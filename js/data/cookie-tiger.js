/* Tiger Lily Cookie: spear hunter on foot, formation breaker on Butter Tiger. */
'use strict';
Object.assign(STATUS,{
 cookie_tiger_mounted:{icon:'🐅',name:'Tiger Rider',kind:'buff',desc:'Butter Tiger: faster close-range attacks, movement, knockback resistance and 25% damage reduction.',mods:m=>{m.aspdP+=.40;m.msP+=.35;m.dmgTaken-=.25;m.kbRes+=1;}},
 cookie_tiger_instinct:{icon:'🏹',name:'Hunting Instinct',kind:'buff',max:5,desc:'Every third spear hit adds a stack. Five stacks empower the next Tiger Rider.'},
 cookie_tiger_prey:{icon:'🎯',name:'Prey',kind:'debuff',desc:'Armor and movement reduced; Tiger Lily hunts this target.',mods:(m,s)=>{m.defP-=s.val||.25;m.msP-=.20;if(s.src?.rarity>=5)m.healRecv-=.25;}},
 cookie_tiger_cornered:{icon:'🐾',name:'Cornered',kind:'debuff',desc:'Accuracy and Skill Haste reduced.',mods:m=>{m.accP-=.20;m.cdr-=.20;}},
 cookie_tiger_mark:{icon:'🩸',name:"Predator's Mark",kind:'debuff',desc:'Tiger Lily deals extra Physical Damage to this attacker.',mods:(m,s)=>{if(s.src?.hasStatus('cookie_tiger_mounted'))m.aspdP-=.15;}},
 cookie_tiger_evasion:{icon:'🍃',name:'Rolling Escape',kind:'buff',desc:'Evasion increased after Tiger Pounce.',mods:(m,s)=>{m.evaP+=s.val||.30;}},
 cookie_tiger_dodge:{icon:'⚡',name:'Wild Reflex',kind:'buff',desc:'Attack Speed increased after a successful dodge.',mods:(m,s)=>{m.aspdP+=s.val||.20;}},
 cookie_tiger_apex:{icon:'👑',name:'Apex Predator',kind:'buff',desc:'Attack, Attack Speed, and Movement Speed increased during the final hunt.',mods:m=>{m.atkP+=.25;m.aspdP+=.25;m.msP+=.25;}},
 cookie_tiger_hunted:{icon:'🐾',name:'Hunted',kind:'debuff',desc:'Attack Speed reduced after Final Pounce.',mods:m=>{m.aspdP-=.25;}},
 cookie_tiger_exhaust:{icon:'🐾',name:'Mauled',kind:'debuff',desc:'Energy generation reduced and Movement Speed bonuses disabled.',mods:m=>{m.energyGen-=.25;m.noMsGain=true;}}
});
function tigerFoes(u,B){return B.enemiesOf(u).filter(e=>B.isTargetable(e));}
function tigerHasOwnStatus(u,t,id){return !!t?.statuses.some(s=>s.id===id&&s.src===u);}
function tigerPrey(u,B){return tigerFoes(u,B).find(e=>tigerHasOwnStatus(u,e,'cookie_tiger_prey'));}
function tigerMounted(u){return u.hasStatus('cookie_tiger_mounted');}
function tigerHit(u,B,t,ratio,tag,opt={}){return B.damage(u,t,u.st.atk*ratio,Object.assign({type:'physical',tag},opt));}
function tigerPose(u,B,dur=.9){u._tigerSkillUntil=B.t+dur;B.anim(u,'attack',Math.min(dur,.8));}
function tigerFx(B,t,radius=95){B.fxRing(t.x,t.y-42,radius,'#ffc745',.38);}
function tigerInstinct(u,B,amount=1){for(let i=0;i<amount;i++)B.applyStatus(u,u,'cookie_tiger_instinct',999);}
function tigerCharge(u,B,ratio,stun,tag,extra=false){
 const foes=tigerFoes(u,B);if(!foes.length)return;
 const far=foes.reduce((a,b)=>Math.abs(b.x-u.x)>Math.abs(a.x-u.x)?b:a);
 B.dash(u,far.x+u.face*55,.46,{depth:far.depth});tigerPose(u,B,1.05);Sound.play('cookie_tiger_pounce',{vol:.72});
 foes.forEach((t,i)=>B.after(.10+i*.035,()=>{if(!u.alive||!t.alive)return;
  const hit=tigerHit(u,B,t,ratio,tag,{area:true});if(hit){B.applyStatus(u,t,'stun',t.isBoss?Math.min(.9,stun*.35):stun+(extra&&i===0?.65:0));tigerFx(B,t,125);}
 }));
}
function tigerMount(u,B,duration){
 u._tigerMountEnds=Math.max(u._tigerMountEnds||0,B.t+duration);
 B.applyStatus(u,u,'cookie_tiger_mounted',duration);
 u.rangeBonus=-190;u.dirty=true;
 B.after(duration+.02,()=>{if(!u.alive||B.t<(u._tigerMountEnds||0)-.04)return;u.rangeBonus=0;u.dirty=true;B.removeStatus(u,'cookie_tiger_mounted');});
}
function tigerApex(u,B){
 if(u._tigerApexUsed||u.rarity<5||!u.alive)return;
 u._tigerApexUsed=true;u._tigerApexActive=true;u._tigerApexBasics=0;
 const duration=u._tigerApexDuration||10;
 tigerMount(u,B,duration);B.applyStatus(u,u,'cookie_tiger_apex',duration);B.shield(u,u,u.max.hp*(u._tigerApexShield||.30),duration);
 const prey=tigerPrey(u,B)||B.nearest(u,tigerFoes(u,B));if(prey)B.dash(u,prey.x-u.face*35,.32,{depth:prey.depth});
 if(!B.offscreen)B.fxFloatIcon(u.x,u.y-110,'APEX PREDATOR','#ffe277');Sound.play('cookie_tiger_pounce',{vol:.82});
 B.after(duration,()=>{if(!u.alive)return;u._tigerApexActive=false;
  tigerPose(u,B,1.15);tigerCharge(u,B,2.65,0,'Final Pounce');
  tigerFoes(u,B).forEach(e=>{if(e.hpPct<.5)tigerHit(u,B,e,.8,'Final Pounce', {area:true});B.knockback(u,e,85);B.applyStatus(u,e,'cookie_tiger_hunted',6);});
 });
}
function tigerCheckApex(u,B){
 if(u.rarity<5||u._tigerApexUsed||((u._tigerCharges||0)<2&&(u._tigerMarkedKills||0)<2))return;
 const wait=(u._tigerChargeBusyUntil||0)-B.t;
 if(wait>0){
  if(!u._tigerApexPending){u._tigerApexPending=true;B.after(wait+.02,()=>{u._tigerApexPending=false;tigerCheckApex(u,B);});}
  return;
 }
 tigerApex(u,B);
}
function tigerBasicHit(u,t,B){
 u._tigerSpearHits=(u._tigerSpearHits||0)+1;
 const prey=tigerHasOwnStatus(u,t,'cookie_tiger_prey');
 if(u._tigerSpearHits%3===0)tigerInstinct(u,B);
 if(tigerMounted(u)){
  const radius=u._tigerApexActive?150:105;
  if(u.rarity>=4)B.heal(u,u,u.max.hp*(u._tigerClawHeal||.018)*(prey?1.25:1));
  tigerFoes(u,B).filter(e=>e!==t&&B.distance(e,t)<radius).slice(0,u._tigerApexActive?3:2).forEach(e=>{
   const hit=tigerHit(u,B,e,.55,'Butter Tiger Claws',{area:true,basic:true});
   if(hit&&u.rarity>=4)B.heal(u,u,u.max.hp*(u._tigerClawHeal||.018)*(tigerHasOwnStatus(u,e,'cookie_tiger_prey')?1.25:1));
  });
  tigerFx(B,t,80);u._tigerApexBasics=(u._tigerApexBasics||0)+1;
  if(u._tigerApexActive&&u._tigerApexBasics%3===0){const p=tigerPrey(u,B)||t;B.dash(u,p.x-u.face*25,.2,{depth:p.depth});tigerHit(u,B,p,.8,'Apex Pounce',{area:true});B.applyStatus(u,p,'stun',p.isBoss?.3:.7);}
 }else if(u._tigerApexActive){tigerFoes(u,B).filter(e=>e!==t&&B.distance(e,t)<140).slice(0,2).forEach(e=>tigerHit(u,B,e,.36,'Apex Spear',{basic:true}));}
}
HEROES.TigerLilyCookie.skills={
 W:{name:'Tiger Rider',type:'Physical Damage / Control',energy:100,v:{ratio:1.7,swipe:.48},p:{stun:3,mount:6,instinct:5,swipeEvery:3.2},fixedP:['instinct'],
  desc:(S,P)=>`Butter Tiger swipes nearby foes for ${Math.round(S.swipe*100)}% Attack damage every ${P.swipeEvery.toFixed(1)}s while Tiger Lily fights on foot. Every third spear hit builds Hunting Instinct. Mount and charge through the enemy line for ${Math.round(S.ratio*100)}% Attack damage and a ${P.stun.toFixed(1)}s Stun. Mounted for ${P.mount.toFixed(1)}s: +40% Attack Speed, +35% Movement Speed, 25% Damage Reduction, knockback immunity, and close-range claw/spear attacks. At five Instinct, add a hit, extend the first Stun, and charge again before dismounting. Red rarity extends the ride and can trigger Apex Predator.`,
  passive(u,B,S,P){u._tigerSpearHits=0;u._tigerCharges=0;u._tigerMarkedKills=0;u._tigerApexUsed=false;u._tigerApexActive=false;
   B.on(u,'dealDamage',ev=>{if(ev.crit&&tigerHasOwnStatus(u,ev.target,'cookie_tiger_prey'))tigerInstinct(u,B);});
   B.every(u,P.swipeEvery,()=>{if(!u.alive||tigerMounted(u))return;const t=B.nearest(u,tigerFoes(u,B).filter(e=>B.distance(u,e)<=180));if(t){tigerHit(u,B,t,S.swipe,'Butter Tiger Swipe',{area:true});tigerFx(B,t,55);Sound.play('cookie_tiger_pounce',{vol:.24,throttle:500});}});
  },
  cast(u,B,S,P){const instinct=u.getStatus('cookie_tiger_instinct')?.stacks||0,empowered=instinct>=P.instinct;
   if(empowered)B.removeStatus(u,'cookie_tiger_instinct');
   u._tigerCharges++;if(u.rarity>=5)u._tigerChargeGuardUntil=B.t+.55;
   u._tigerChargeBusyUntil=B.t+(empowered?P.mount-.44:.56);
   tigerMount(u,B,P.mount+(u.rarity>=5?(u._tigerRedMountBonus||2):0));tigerCharge(u,B,S.ratio,P.stun,'Tiger Rider',empowered);
   if(empowered){B.after(.45,()=>{if(!u.alive)return;const t=B.nearest(u,tigerFoes(u,B));if(t)tigerHit(u,B,t,S.ratio*.65,'Instinct Charge',{area:true});});B.after(P.mount-1,()=>{if(u.alive)tigerCharge(u,B,S.ratio*.72,P.stun*.5,'Second Charge');});}
   tigerCheckApex(u,B);
  }},
 G:{name:'Spear of the Wilds',type:'Physical Damage / Control',cd:9,v:{ratio:1.8},p:{prey:8,armor:.25,slow:1.5},
  desc:(S,P)=>`Throws a spear at the highest-Attack enemy for ${Math.round(S.ratio*100)}% Attack damage. Prey lasts ${P.prey.toFixed(1)}s, reducing Armor by ${Math.round(P.armor*100)}% and Movement Speed by 20%. The spear pierces another enemy and slows both. Basics hunt Prey, and critical hits against it build Instinct. Mounted: Feral Pursuit leaps to Prey, interrupts it, and briefly Stuns nearby foes. Red rarity adds another pierce and cuts Prey's healing.`,
  cast(u,B,S,P){const foes=tigerFoes(u,B);if(!foes.length)return;const t=(tigerMounted(u)&&tigerPrey(u,B))||foes.slice().sort((a,b)=>b.st.atk-a.st.atk)[0];tigerPose(u,B,1);Sound.play('cookie_tiger_spear',{vol:.65});
   if(tigerMounted(u)){B.dash(u,t.x-u.face*28,.26,{depth:t.depth});foes.filter(e=>B.distance(e,t)<165).forEach(e=>{const hit=tigerHit(u,B,e,S.ratio*(e===t?1:.58),'Feral Pursuit',{area:true});if(hit&&e.alive){if(e.casting)B.interrupt(e,u);B.applyStatus(u,e,'stun',e.isBoss?.35:.85);}tigerFx(B,e,95);});return;}
   const targets=[t,...foes.filter(e=>e!==t).sort((a,b)=>B.distance(a,t)-B.distance(b,t)).slice(0,u.rarity>=5?2:1)];
   B.fxProj(u,t,{kind:'spear',col:'#ffc745'},()=>targets.forEach((e,i)=>{if(!u.alive||!e.alive)return;const hit=tigerHit(u,B,e,S.ratio*(i===0?1:.55),'Spear of the Wilds');if(hit){B.applyStatus(u,e,'cookie_tiger_prey',P.prey,{val:P.armor});B.applyStatus(u,e,'slow',P.slow);tigerFx(B,e,75);}}));
  }},
 B:{name:'Tiger Pounce',type:'Physical Damage / Control / Evasion',cd:12,v:{ratio:1.45},p:{corner:6,evasion:.30,drain:20},
  desc:(S,P)=>`Butter Tiger pounces on the highest-Energy enemy for ${Math.round(S.ratio*100)}% Attack area damage and Knockdown. Cornered cuts Accuracy and Skill Haste for ${P.corner.toFixed(1)}s. Tiger Lily rolls clear and gains ${Math.round(P.evasion*100)}% Evasion for 5s. Prey loses Energy and is refreshed. Mounted: two pounces, with the second hitting behind the formation. Red rarity also lowers Energy generation and blocks Movement Speed bonuses.`,
  cast(u,B,S,P){const foes=tigerFoes(u,B);if(!foes.length)return;const t=foes.slice().sort((a,b)=>b.energy-a.energy)[0];const mounted=tigerMounted(u);tigerPose(u,B,1.25);Sound.play('cookie_tiger_pounce',{vol:.7});
   const pounce=(center,ratio)=>{tigerFoes(u,B).filter(e=>B.distance(e,center)<155).forEach(e=>{
    const hit=tigerHit(u,B,e,ratio,'Tiger Pounce',{area:true});if(!hit||!e.alive)return;
    B.applyStatus(u,e,'launch',e.isBoss?.2:.45);B.applyStatus(u,e,'cookie_tiger_cornered',P.corner);
    if(u.rarity>=5)B.applyStatus(u,e,'cookie_tiger_exhaust',P.corner);
    if(tigerHasOwnStatus(u,e,'cookie_tiger_prey')){B.energy(e,-P.drain);B.applyStatus(u,e,'cookie_tiger_prey',u._tigerPreyDuration||B.skillParams(u,'G').prey,{val:u._tigerPreyArmor||B.skillParams(u,'G').armor});}
    tigerFx(B,e,95);
   });};
   if(mounted)B.dash(u,t.x-u.face*26,.24,{depth:t.depth});pounce(t,S.ratio);
   if(mounted)B.after(.38,()=>{if(!u.alive)return;const back=tigerFoes(u,B).sort((a,b)=>u.face*(b.x-a.x))[0];if(back){B.dash(u,back.x+u.face*35,.24,{depth:back.depth});pounce(back,S.ratio*.62);}B.applyStatus(u,u,'cookie_tiger_evasion',5,{val:P.evasion});});
   else{B.dash(u,u.x-u.face*80,.26,{depth:u.depth});B.applyStatus(u,u,'cookie_tiger_evasion',5,{val:P.evasion});}
  }},
 P:{name:'Wild Instinct',type:'Physical Damage / Critical Chance / Control',v:{},p:{crit:.20,accuracy:.12,mark:8,bonus:.25,dodge:.20,heal:.018},
  desc:(S,P)=>`Gains ${Math.round(P.crit*100)}% Critical Hit chance and ${Math.round(P.accuracy*100)}% Accuracy. Attackers receive Predator's Mark for ${P.mark.toFixed(1)}s and take ${Math.round(P.bonus*100)}% more damage from Tiger Lily. Defeating a marked foe throws a follow-up spear at the weakest foe and builds Instinct. Mounted spear and claw hits heal Tiger Lily for ${+(P.heal*100).toFixed(1)}% Max HP, and marked foes attack slower. Dodging grants ${Math.round(P.dodge*100)}% Attack Speed for 6s.`,
  passive(u,B,S,P){u.flat.critTiger=P.crit;u.flat.accPTiger=P.accuracy;u._tigerMarkBonus=P.bonus;u._tigerClawHeal=P.heal;u.dirty=true;
   B.on(u,'damaged',ev=>{if(ev.src&&ev.src.team!==u.team&&ev.src.alive)B.applyStatus(u,ev.src,'cookie_tiger_mark',P.mark);});
   B.on(u,'dealDamage',ev=>{if(tigerHasOwnStatus(u,ev.target,'cookie_tiger_mark')){ev.amount*=1+P.bonus;if(u.rarity>=5&&ev.crit)ev.amount*=1.12;}if(u.rarity>=5&&ev.crit&&tigerHasOwnStatus(u,ev.target,'cookie_tiger_prey'))ev.amount*=1.12;});
   B.on(u,'defeatedEnemy',e=>{if(!tigerHasOwnStatus(u,e,'cookie_tiger_mark'))return;u._tigerMarkedKills++;tigerInstinct(u,B);const t=tigerFoes(u,B).sort((a,b)=>a.hp-b.hp)[0];if(t)tigerHit(u,B,t,.8,'Wild Instinct Spear');tigerCheckApex(u,B);});
   B.on(u,'dodged',()=>B.applyStatus(u,u,'cookie_tiger_dodge',6,{val:P.dodge}));
  }},
 R:{name:'The Hunt',type:'Physical Damage / Control / Survival',v:{attack:.13,critDamage:.18},p:{mount:2,shield:.30,apex:10},
  desc:(S,P)=>`Tiger Rider lasts ${P.mount.toFixed(1)}s longer and resists Stun during its opening charge. Spear pierces two foes and Prey weakens healing; Pounce slows Energy gain; marked and Prey targets take stronger critical hits. After two charges or two marked kills, Apex Predator activates once per wave for ${P.apex.toFixed(1)}s: mount up, gain a ${Math.round(P.shield*100)}% Max-HP Shield, stronger Attack and speed, piercing spear/claw attacks, and a pounce every third Basic. Final Pounce hits the formation harder below half HP, knocks survivors back, and slows their attacks.`,
  passive(u,B,S,P){u.flat.atkPTigerRed=S.attack;u.flat.critDmgTiger=S.critDamage;u.flat.evaPTigerRed=.08;u._tigerRedMountBonus=P.mount;u._tigerApexDuration=P.apex;u._tigerApexShield=P.shield;u._tigerPreyDuration=B.skillParams(u,'G').prey;u._tigerPreyArmor=B.skillParams(u,'G').armor;u.dirty=true;
   B.on(u,'statusApplied',ev=>{if(ev.unit===u&&ev.id==='stun'&&B.t<(u._tigerChargeGuardUntil||0))B.removeStatus(u,'stun');});
  }}
};
