/* Cream Puff Cookie's Great Success kit. */
'use strict';
Object.assign(STATUS,{
 cookie_cream_buff:{icon:'🍮',name:'Cream Buff',kind:'buff',max:3,desc:'Skill Power, healing, and Damage Reduction per stack.',mods:(m,s)=>{m.magP+=.08*s.stacks;m.healPowP+=.08*s.stacks;m.dmgTaken-=(s.src?.rarity>=5?.055:.045)*s.stacks;}},
 cookie_cream_blessing:{icon:'✧',name:'Blessing of Light',kind:'buff',desc:'Damage Reduction and stronger buffs.',mods:(m,s)=>{m.dmgTaken-=.12;if(s.src?._creamStar)m.healRecv+=.20;}},
 cookie_cream_attack:{icon:'🍮',name:'Extra Cream',kind:'buff',desc:'Attack increased based on Cream Puff Cookie’s Critical Hit chance.',mods:(m,s)=>{m.atkP+=s.val||0;}},
 cookie_cream_jelly:{icon:'🍬',name:'Cream Puff Jelly',kind:'buff',max:2,desc:'Heals and Shields at low HP or boosts the next White Skill.'},
 cookie_cream_guarded_jelly:{icon:'🍬',name:'Protected Cream Puff Jelly',kind:'buff',desc:'The first Jelly from Extra Cream cannot be dispelled.'},
 cookie_cream_whiteboost:{icon:'🍬',name:'Jelly Boost',kind:'buff',desc:'The next White Skill has stronger damage or healing.',mods:m=>{m.healPowP+=.20;},onDealDamage:(u,s,e)=>{if(!e.basic)e.amount*=1.20;}},
 cookie_cream_crit:{icon:'✦',name:'Critical Cream',kind:'buff',desc:'Critical Damage increased.',mods:(m,s)=>{m.critDmg+=s.val||.20;}},
 cookie_cream_crit_chance:{icon:'✦',name:'Cream Focus',kind:'buff',desc:'Critical Hit chance increased.',mods:(m,s)=>{m.crit+=s.src?._creamCritBonus||.10;}},
 cookie_cream_mastery:{icon:'📖',name:'Magical Mastery',kind:'buff',max:8,desc:'Skill Power and healing rise with each success.',mods:(m,s)=>{const power=s.src?._creamMastery||.055;m.magP+=power*s.stacks;m.healPowP+=power*s.stacks;if(s.stacks>=3)m.magPen+=.15;}},
 cookie_cream_practice:{icon:'✎',name:'Practice',kind:'special',max:5,desc:'Each failed spell adds 10% Great Success chance to the next.'},
 cookie_cream_star:{icon:'⭐',name:'Star Student',kind:'buff',desc:'Successful spells charge allies and speed casting.',mods:m=>{m.cdr+=.18;}},
 cookie_cream_haste:{icon:'✨',name:'Grand Magic Trick',kind:'buff',desc:'+15% Skill Haste.',mods:m=>{m.cdr+=.15;}},
 cookie_cream_guard:{icon:'🌪',name:'Ultimate Great Success',kind:'buff',desc:'Protection, Attack, and Energy during the ultimate.',mods:m=>{m.dmgTaken-=.30;m.atkP+=.22;m.energyGen+=.25;}},
 cookie_cream_atkdown:{icon:'🍬',name:'Dessert Hex',kind:'debuff',desc:'Attack reduced by 20%.',mods:m=>{m.atkP-=.20;}},
 cookie_cream_slowcast:{icon:'🍬',name:'Sticky Spell',kind:'debuff',desc:'Skill Haste reduced by 25%.',mods:m=>{m.cdr-=.25;}},
 cookie_cream_dizzy:{icon:'🍬',name:'Jelly Daze',kind:'debuff',desc:'Accuracy reduced by 20%.',mods:m=>{m.accP-=.20;}},
 cookie_cream_vortex:{icon:'🌪',name:'Jelly Vortex',kind:'debuff',desc:'Magic Defense reduced.',mods:m=>{m.mdefP-=.18;}}
});
function creamFoes(u,B){return B.enemiesOf(u).filter(e=>B.isTargetable(e));}
function creamAllies(u,B){return B.alliesOf(u).filter(a=>a.alive);}
function creamHasJelly(a){return a.hasStatus('cookie_cream_guarded_jelly')||a.hasStatus('cookie_cream_jelly');}
function creamFx(B,u,label){if(!B.offscreen)B.fxFloatIcon(u.x,u.y-105,label,'#ffdf93');}
function creamPose(u,B,kind,duration){u._creamPose=kind;u._creamPoseUntil=B.t+duration;B.anim(u,'cast',Math.min(duration,1.2));}
function creamHit(u,B,t,ratio,tag,success,opt){return B.damage(u,t,u.st.mag*ratio*(success?1.7:1),Object.assign({type:'magic',tag,critBonus:-1},opt||{}));}
function creamRoll(u,B){
 const forced=(u._creamPerfectCasts||0)>0;if(forced)u._creamPerfectCasts--;
 const practice=u.getStatus('cookie_cream_practice');
 const rate=Math.min(.95,Math.max(u.rarity>=4?(u._creamFloor||.30):0,u.st.crit+(practice?practice.stacks*(u._creamPractice||.10):0)));
 const success=forced||Math.random()<rate;
 if(!success){if(u.rarity>=4)B.applyStatus(u,u,'cookie_cream_practice',999);return false;}
 if(practice)B.removeStatus(u,'cookie_cream_practice');
 B.applyStatus(u,u,'cookie_cream_buff',999);u._creamSuccesses=(u._creamSuccesses||0)+1;
 if(u.rarity>=4){
  const old=u.getStatus('cookie_cream_mastery');
  if(!old||old.stacks<(u.rarity>=5?8:6))B.applyStatus(u,u,'cookie_cream_mastery',999);
  if(u.getStatus('cookie_cream_mastery')?.stacks>=6&&!u._creamStar){u._creamStar=true;B.applyStatus(u,u,'cookie_cream_star',999);creamFx(B,u,'STAR STUDENT');}
  if(u._creamStar){
   creamAllies(u,B).forEach(a=>B.energy(a,u.rarity>=5?7:5));
   if(u._creamSuccesses%3===0){const t=creamFoes(u,B).sort((a,b)=>b.st.atk-a.st.atk)[0];if(t){creamHit(u,B,t,.75,'Star Student Jelly',true,{area:true});B.fxRing(t.x,t.y-35,95,'#ffe4a3',.35);}}
  }
 }
 creamFx(B,u,'GREAT SUCCESS!');Sound.play('cookie_great_success',{vol:.46,throttle:350});return true;
}
function creamJellyConsume(u,B,ally,white){
 const jelly=ally.getStatus('cookie_cream_guarded_jelly')||ally.getStatus('cookie_cream_jelly');if(!jelly||!ally.alive)return false;
 jelly.stacks--;ally.statusVersion++;if(jelly.stacks<=0)B.removeStatus(ally,jelly.id);
 if(white){B.energy(ally,12);B.applyStatus(u,ally,'cookie_cream_whiteboost',1.5);ally.recompute();creamFx(B,ally,'JELLY BOOST');}
 else{B.heal(u,ally,u.st.mag*(u._creamJellyHeal||.95));B.shield(u,ally,u.st.mag*(u._creamJellyShield||.7),6);B.fxRing(ally.x,ally.y-36,78,'#ffe5a1',.4);}
 return true;
}
function creamUltimate(u,B){
 u._creamUltimateUsed=true;creamPose(u,B,'skill2',4.2);Sound.play('cookie_jelly_tornado',{vol:.82});creamFx(B,u,'ULTIMATE GREAT SUCCESS!');
 creamAllies(u,B).forEach(a=>B.applyStatus(u,a,'cookie_cream_guard',u._creamGuardDuration||4.2));
 const foes=creamFoes(u,B),center=foes.reduce((sum,e)=>sum+e.x,0)/Math.max(1,foes.length);
 B.fxRing(center,u.y-55,310,'#ffe998',1);
 for(let n=1;n<=8;n++)B.after(n*.5,()=>{
  if(!u.alive)return;
  creamFoes(u,B).forEach(e=>{e.x+=(center-e.x)*.16;B.applyStatus(u,e,'cookie_cream_vortex',2);creamHit(u,B,e,.55,'Ultimate Jelly Tornado',true,{area:true,dot:true});});
  creamAllies(u,B).forEach(a=>B.heal(u,a,u.st.mag*.20));
  if(n%2===0)B.fxRing(center,u.y-55,250,'#fff1b4',.4);
 });
 B.after(4.05,()=>{
  if(!u.alive)return;
  creamFoes(u,B).forEach(e=>{creamHit(u,B,e,2.4,'Ultimate Great Success',true,{area:true});if(e.alive)B.applyStatus(u,e,'stun',e.isBoss?.6:1.6);});
  creamAllies(u,B).forEach(a=>{B.heal(u,a,a.max.hp*(1-a.hpPct)*.55);B.cleanseAll(a);B.shield(u,a,u.st.mag*1.25,8);});
  B.fxRing(center,u.y-55,350,'#fff6ca',.7);Sound.play('cookie_great_success',{vol:.7});u._creamPerfectCasts=2;
 });
}
HEROES.CreamPuffCookie.skills={
 W:{name:'Jellius Extremus!',type:'Magic Damage / Healing / Control',energy:100,v:{ratio:1.8,heal:1.25},p:{stun:2,blessing:10,shield:.20},
  desc:(S,P)=>'Great Success scales with Critical Hit chance. Each success adds Cream Buff, strengthening spells, healing, and protection. Jellius Extremus! damages every enemy and heals every ally for '+Math.round(S.heal*100)+'% Magic. Great Success enlarges the burst, Stuns foes for '+P.stun.toFixed(1)+' seconds, and grants Blessing of Light for '+P.blessing.toFixed(1)+' seconds. At three Cream Buff stacks it cleanses two debuffs and Shields allies. Red rarity leaves a vortex; after five successes, the next cast becomes Ultimate Great Success.',
  passive(u,B){
   u._creamSuccesses=0;u._creamUltimateUsed=false;u._creamPerfectCasts=0;u._creamStar=false;
   B.on(u,'allyDamaged',ev=>{const a=ev.unit;if(!a||!a.alive||!creamHasJelly(a))return;if((a.hp-Math.max(0,ev.amount||0))/a.max.hp<.6)B.after(.01,()=>{if(u.alive&&a.alive)creamJellyConsume(u,B,a,false);});});
   B.on(u,'allySkillStarting',ev=>{if(ev.key==='W'&&ev.unit&&creamHasJelly(ev.unit)&&creamJellyConsume(u,B,ev.unit,true))ev.costDiscount=(ev.costDiscount||0)+12;});
  },
  cast(u,B,S,P){
   if(u.rarity>=5&&u._creamSuccesses>=5&&!u._creamUltimateUsed){creamUltimate(u,B);return;}
   const wasFull=(u.getStatus('cookie_cream_buff')?.stacks||0)>=3,success=creamRoll(u,B);
   creamPose(u,B,'skill2',3.2);Sound.play('cookie_jelly_tornado',{vol:success?.72:.58});
   const foes=creamFoes(u,B),center=foes.reduce((sum,e)=>sum+e.x,0)/Math.max(1,foes.length);
   B.fxRing(center,u.y-55,success?290:205,success?'#fff0ae':'#f7d3fc',.65);
   foes.forEach(e=>{creamHit(u,B,e,S.ratio,'Jellius Extremus!',success,{area:true});if(e.alive){B.knockback(u,e,success?28:16);B.applyStatus(u,e,'launch',e.isBoss?.25:.45);if(success)B.applyStatus(u,e,'stun',e.isBoss?Math.min(.9,P.stun*.35):P.stun);}});
   creamAllies(u,B).forEach(a=>{B.heal(u,a,u.st.mag*S.heal*(success?1.88:1));if(success)B.applyStatus(u,a,'cookie_cream_blessing',P.blessing);if(success&&wasFull){B.cleanse(a,2);B.shield(u,a,u.st.mag*P.shield,8);}});
   if(u.rarity>=5)for(let n=1;n<=Math.ceil(u._creamVortexDuration||5);n++)B.after(n,()=>{if(!u.alive)return;creamFoes(u,B).forEach(e=>{if(Math.abs(e.x-center)<190)creamHit(u,B,e,.23,'Jelly Vortex',false,{area:true,dot:true});});creamAllies(u,B).forEach(a=>B.heal(u,a,u.st.mag*.15));B.fxRing(center,u.y-55,190,'#f8dff8',.25);});
  }},
 G:{name:'Extra Cream',type:'Support / Healing / Magic Damage',cd:12,v:{},p:{attack:.8,heal:.95,shield:.7,dur:12,crit:.20},
  desc:(S,P)=>'Grants team Attack based on Cream Puff Cookie’s Critical Hit chance, up to 40%, for '+P.dur.toFixed(1)+' seconds. Each ally gets a Jelly that heals for '+Math.round(P.heal*100)+'% Magic and Shields below 60% HP, or boosts their next White Skill and refunds Energy. Great Success gives two Jellies, four extra seconds of Attack, and '+Math.round(P.crit*100)+'% Critical Damage. Red rarity also raises Critical Hit chance.',
  cast(u,B,S,P){
   u._creamJellyHeal=P.heal;u._creamJellyShield=P.shield;const success=creamRoll(u,B),attack=Math.min(.40,u.st.crit*P.attack);creamPose(u,B,'skill1',1.2);Sound.play('sparkle',{vol:.5});
   creamAllies(u,B).forEach(a=>{B.applyStatus(u,a,'cookie_cream_attack',P.dur+(success?4:0),{val:attack});let have=(a.getStatus('cookie_cream_jelly')?.stacks||0)+(a.hasStatus('cookie_cream_guarded_jelly')?1:0);const wanted=success?2:1;if(u.rarity>=5&&have<2&&!a.hasStatus('cookie_cream_guarded_jelly')){B.applyStatus(u,a,'cookie_cream_guarded_jelly',20);have=(a.getStatus('cookie_cream_jelly')?.stacks||0)+(a.hasStatus('cookie_cream_guarded_jelly')?1:0);}if(have<2&&have<wanted)B.applyStatus(u,a,'cookie_cream_jelly',20,{stacks:Math.min(2-have,wanted-have)});if(success)B.applyStatus(u,a,'cookie_cream_crit',P.dur+4,{val:P.crit});if(u.rarity>=5)B.applyStatus(u,a,'cookie_cream_crit_chance',P.dur+(success?4:0));B.fxRing(a.x,a.y-35,72,'#ffe7ba',.35);});
  }},
 B:{name:'Conjured Dessert Jellies',type:'Magic Damage / Support / Control',cd:11,v:{ratio:.62},p:{debuff:6,drain:18,heal:.55,finale:.95,haste:8},
  desc:(S,P)=>'Casts four spells in order: Attack down, Skill Haste down, Energy drain and Accuracy down, then a Stun. Each spell rolls Great Success separately; success heals the weakest ally for '+Math.round(P.heal*100)+'% Magic. Grand Magic Trick deals area damage; three successes Silence foes and give allies Skill Haste for '+P.haste.toFixed(1)+' seconds. Red rarity adds a fifth capped Max-HP spell.',
  cast(u,B,S,P){
   const count=u.rarity>=5?5:4,successes={n:0};creamPose(u,B,'skill1',1.3);Sound.play('sparkle',{vol:.5});
   for(let i=0;i<count;i++)B.after(i*.22,()=>{
    if(!u.alive)return;const foes=creamFoes(u,B);if(!foes.length)return;
    const target=i===4?foes.slice().sort((a,b)=>b.hp-a.hp)[0]:foes[i%foes.length],success=creamRoll(u,B);if(success)successes.n++;
    creamHit(u,B,target,S.ratio+(i===3?.25:0),'Dessert Jelly Spell',success);
    if(i===0)B.applyStatus(u,target,'cookie_cream_atkdown',P.debuff);
    if(i===1)B.applyStatus(u,target,'cookie_cream_slowcast',P.debuff);
    if(i===2){B.energy(target,-P.drain);B.applyStatus(u,target,'cookie_cream_dizzy',P.debuff);}
    if(i===3)B.applyStatus(u,target,'stun',target.isBoss?.45:1);
    if(i===4)B.damage(u,target,Math.min(target.max.hp*.045,u.st.mag*1.8),{type:'magic',tag:'Fifth Dessert Jelly',critBonus:-1});
    if(success){const low=creamAllies(u,B).sort((a,b)=>a.hpPct-b.hpPct)[0];if(low)B.heal(u,low,u.st.mag*P.heal);}
    B.fxRing(target.x,target.y-38,75,i===3?'#ffe387':'#ffd5ed',.27);
   });
   B.after(count*.22+.08,()=>{
    if(!u.alive)return;const foes=creamFoes(u,B);foes.forEach(e=>{creamHit(u,B,e,P.finale+successes.n*.12,'Grand Magic Trick',false,{area:true});if(successes.n>=3&&e.alive)B.applyStatus(u,e,'silence',e.isBoss?.55:2);});
    if(successes.n>=3)creamAllies(u,B).forEach(a=>B.applyStatus(u,a,'cookie_cream_haste',P.haste));
    if(foes.length)B.fxRing(foes.reduce((sum,e)=>sum+e.x,0)/foes.length,u.y-48,240,'#fff1b8',.5);
    Sound.play('cookie_great_success',{vol:.44,throttle:300});
   });
  }},
 P:{name:"Parfaedia's Rising Star",type:'Support / Skill Power / Critical Chance',v:{},p:{crit:.25,practice:.10,mastery:.055,floor:.30},
  desc:(S,P)=>'Gains '+Math.round(P.crit*100)+'% Critical Hit chance and at least '+Math.round(P.floor*100)+'% Great Success chance. Success builds Magical Mastery, increasing Skill Power and healing by '+(P.mastery*100).toFixed(1)+'% per stack; three stacks pierce Magic Defense. Six stacks make her Star Student, charging allies and adding a jelly blast every third success. If an enemy dodges her spell, Cream Puff learns its rhythm: that enemy is Dizzied, and her follow-up attacks cannot be Dodged for 5 seconds. Failed spells build Practice, adding '+Math.round(P.practice*100)+'% chance per stack until the next success.',
  passive(u,B,S,P){u.flat.critCream=P.crit;u._creamPractice=P.practice;u._creamMastery=P.mastery;u._creamFloor=P.floor;u.dirty=true;u.antiDodge=enemy=>!!(enemy&&(enemy.hasStatus('cookie_cream_dizzy')||B.t<(enemy._creamReadUntil||0)));B.on(u,'missed',ev=>{if(ev&&ev.target&&ev.target.alive&&ev.target.team!==u.team){ev.target._creamReadUntil=B.t+5;B.applyStatus(u,ev.target,'cookie_cream_dizzy',5);}});}},
 R:{name:'The Greatest Spell Yet!',type:'Magic Damage / Healing / Support / Control',v:{mag:.18,crit:.08},p:{vortex:5,guard:4.2,critChance:.10},
  desc:(S,P)=>'Jellius Extremus! leaves a Jelly Vortex for '+P.vortex.toFixed(1)+' seconds. Extra Cream adds Critical Hit chance; Dessert Jellies gets a fifth capped Max-HP spell; Magical Mastery reaches eight stacks. Once per wave after five Great Successes, the next Jellius Extremus! becomes Ultimate Great Success: a tornado damages and pulls foes while healing and protecting allies, then bursts, cleanses, Shields, and makes the next two spells automatic successes. Cream Puff remains vulnerable to focused backline attacks and healing reduction.',
  passive(u,B,S,P){u.flat.magPCream=S.mag;u.flat.critCreamRed=S.crit;u._creamVortexDuration=P.vortex;u._creamGuardDuration=P.guard;u._creamCritBonus=P.critChance;u.dirty=true;}}
};
