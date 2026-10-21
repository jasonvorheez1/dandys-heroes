/* heroes14.js - Care Bears collaboration visitors.
   Each kit now has a visible payoff loop:
   Shelly builds Cheer into an Encore, Astro completes Sleep Cycles, and Gigi
   rotates prize types until the Wish Wheel reaches a Jackpot. */
'use strict';

function cbLowestEnergy(list) {
  return list.filter(a => a && a.alive).sort((a, b) => (a.energy / a.energyMax) - (b.energy / b.energyMax))[0];
}

function shellyGloom(u, B, e, stacks, dur) {
  if (!e || !e.alive) return;
  const before = e.statuses.find(s => s.id === 'cbgloom');
  const beforeStacks = before ? before.stacks : 0;
  B.applyStatus(u, e, 'cbgloom', dur || 7, { stacks: stacks || 1 });
  const st = e.statuses.find(s => s.id === 'cbgloom');
  if (st && st.stacks > beforeStacks) B.fxShellySkill('gloom', u, { target: e, stacks: st.stacks });
  if (st && st.stacks >= 5 && beforeStacks < 5) {
    B.applyStatus(u, e, 'cbdisheartened', 7);
    if (!e._shellyFactUntil || e._shellyFactUntil < B.t) {
      e._shellyFactUntil = B.t + 2.5;
      if (e.pendingHit) { e.pendingHit = null; e.animState = 'idle'; e.animT = 0; e.windup = 0; }
      else e._shellyNextBasicInterrupt = true;
      B.interrupt(e); B.fxShellySkill('fact', u, { target: e });
      B.log('Shelly delivers a fossil fact.');
      Sound.play('shelly_fossil_fact', { vol: .68, priority: true, throttle: 900 });
    }
  }
}

/* Shelly’s meter is intentionally small and easy to read. Damage to an
   Encouraged ally, a blocked debuff, or an enemy Skill adds Cheer. Three Cheer
   becomes an Encore: a team barrier, a burst of Energy, and a full enemy
   Dishearten. The short lock prevents a single multi-hit event from looping it. */
function shellyCheer(u, B, amount) {
  if (!u || !u.alive || u._shellyEncoreLock) return;
  const before = u._shellyCheer || 0;
  u._shellyCheer = Math.min(3, before + (amount || 1));
  B.fxFloatIcon(u.x, u.y - 90, `CHEER ${u._shellyCheer}/3`, '#ffd36b');
  if (u._shellyCheer < 3) return;
  u._shellyCheer = 0;
  u._shellyEncoreLock = true;
  const allies = B.alliesOf(u), foes = B.enemiesOf(u);
  B.anim(u, 'cast', .92, 'shellyEncore');
  B.fxShellySkill('encore', u, { allies, targets: foes });
  Sound.play('cheer', { vol: .42, throttle: 500 });
  allies.forEach(a => {
    B.heal(u, a, a.max.hp * .05, { tag: 'Shelly Encore' });
    B.cleanse(a, 1);
    B.shield(u, a, a.max.hp * .18, 8);
    B.applyStatus(u, a, 'cbencouraged', 8);
    B.applyStatus(u, a, 'cbhope', 8);
    B.energy(a, 20);
  });
  foes.forEach(e => {
    shellyGloom(u, B, e, 1, 7);
    B.applyStatus(u, e, 'cbdisheartened', 6);
  });
  B.after(.55, () => { u._shellyEncoreLock = false; });
}

function shellyEncourage(u, B, a, dur) {
  if (!a || !a.alive) return;
  const old = a.statuses.find(s => s.id === 'cbencouraged');
  B.applyStatus(u, a, 'cbencouraged', dur || 7);
  if (!old || old.t < (dur || 7) * .38) B.fxShellySkill('encourage', u, { target: a });
}

defHero({
  id:'CheerbearShelly', name:'Cheerbear Shelly', folder:null, file:null, icon:null,
  role:'Control', roleLabel:'Control / Support', tier:'SS', position:'Backline', element:'Rainbow',
  blurb:'A fossil-loving morale controller who turns pressure into a three-step Cheer Encore.',
  base:{hp:4200,atk:165,def:215,mag:445,mdef:365,spd:108,acc:198,eva:132},
  hidden:{range:310,aspd:.92,ms:66,aggro:.42,crit:.05,critDmg:1.5,healPow:1.4,shieldPow:1.4,cdr:.15,ccRes:.30,kbRes:.30,armorPen:.05,magPen:.14},
  growth:{hp:.088,atk:.06,def:.08,mag:.098,mdef:.092},
  move:{gait:'float',bob:10,freq:1.2,hover:10,idle:'pulse',step:'step_soft',particles:'sparkle',pcol:'#ff78c8',trail:{on:true,col:'#ffd36b',rate:.16},brake:.18},
  basic:{name:'Rainbow Pebble',type:'magic',ratio:.98,range:310,proj:'orb',pcol:'#ff8bc9',sfx:'sparkle',hit:'hit_magic',wind:.25,
    onHit:(u,t,B)=>{if(chance(.32))shellyGloom(u,B,t,1,5);}},
  skills:{
    W:{name:'Cheer Rally',type:'Healing / Cleanse / Shield / Energy',energy:100,v:{heal:.07,shield:.22},p:{dur:9,energy:24},
      desc:(S,P)=>`<span class="sk-pas">Shelly gains Cheer when an ally is hurt, a debuff is blocked, or an enemy uses a Skill. At 3 Cheer she performs an Encore: healing, cleansing, shielding, and recharging the team while Disheartening every enemy.</span> Active: heals, cleanses one debuff, shields and Encourages the team, adds Gloom to enemies, and advances the Cheer meter.`,
      passive:(u,B,S,P)=>{u._shellyCheer=0;u._shellyEncoreLock=false;B.on(u,'allyDamaged',ev=>{if(ev.unit&&ev.unit.team===u.team&&ev.src&&ev.src.team!==u.team){if(ev.unit.hasStatus('cbencouraged'))shellyGloom(u,B,ev.src,1,7);shellyCheer(u,B,1);}});B.on(u,'debuffBlocked',ev=>{if(ev.unit&&ev.unit.team===u.team){if(ev.src)shellyGloom(u,B,ev.src,1,6);shellyCheer(u,B,1);}});B.on(u,'enemyCast',()=>shellyCheer(u,B,1));},
      cast:(u,B,S,P)=>{const allies=B.alliesOf(u),foes=B.enemiesOf(u);B.anim(u,'cast',1.04,'shellyRally');B.fxShellySkill('inspiration',u,{allies,targets:foes,lecture:foes.length>=3});allies.forEach(a=>{B.heal(u,a,a.max.hp*S.heal,{tag:'Cheer Rally'});B.cleanse(a,1);B.shield(u,a,a.max.hp*S.shield,P.dur);shellyEncourage(u,B,a,P.dur);B.applyStatus(u,a,'cbhope',P.dur);B.energy(a,P.energy);});foes.forEach(e=>shellyGloom(u,B,e,1,P.dur));shellyCheer(u,B,2);}
    },
    G:{name:'Fossil First Aid',type:'Healing / Shield / Cleanse',cd:7,v:{heal:.27,shield:.24},p:{dur:9,cleanse:4},
      desc:(S,P)=>`Heals the lowest-HP ally, cleanses ${P.cleanse} debuffs, and grants a Shield, 🌈 Encouraged, and 💛 Hope. The enemy targeting them becomes 🦴 Corrected and gains 🌑 Gloom.`,
      ai:{prio:78,cond:(u,B)=>B.alliesOf(u).some(a=>a.hpPct<.94||a.statuses.some(s=>STATUS[s.id]&&STATUS[s.id].kind==='debuff'))},
      cast:(u,B,S,P)=>{const a=B.lowestHp(B.alliesOf(u)),e=a&&B.enemiesOf(u).sort((x,y)=>(y.target===a)-(x.target===a))[0];if(!a)return;B.anim(u,'cast',.94,'shellyFieldAid');Sound.play('shelly_fossil_fact',{vol:.44,throttle:700});B.fxShellySkill('pep',u,{ally:a,corrected:e});B.heal(u,a,a.max.hp*S.heal,{tag:'Fossil First Aid'});B.cleanse(a,P.cleanse);B.shield(u,a,a.max.hp*S.shield,P.dur);shellyEncourage(u,B,a,P.dur);B.applyStatus(u,a,'cbhope',P.dur);B.energy(a,16);if(e){B.applyStatus(u,e,'cbcorrected',P.dur);shellyGloom(u,B,e,1,P.dur);}shellyCheer(u,B,1);}
    },
    B:{name:'Rainbow Exhibit',type:'Magic Damage / Area Control',cd:9,v:{ratio:1.72},p:{dur:8,gloom:3,silence:3.2},
      desc:(S,P)=>`Opens a glowing fossil exhibit across the enemy line for <em>${pcn(S.ratio*100)}%</em> Magic Damage, Brightened, and ${P.gloom} Gloom. Disheartened enemies are Silenced and lose Energy.`,
      ai:{prio:66,cond:(u,B)=>B.enemiesOf(u).length>0},
      cast:(u,B,S,P)=>{const foes=B.enemiesOf(u);B.anim(u,'cast',1.0,'shellyExhibit');Sound.play('shelly_rainbow_beam',{vol:.74,priority:true});B.fxShellySkill('beam',u,{targets:foes});foes.forEach(e=>{B.damage(u,e,u.st.mag*S.ratio,{type:'magic',area:true,tag:'Rainbow Exhibit'});B.applyStatus(u,e,'cbbrightened',P.dur);shellyGloom(u,B,e,P.gloom,P.dur);if(e.hasStatus('cbdisheartened')){B.energy(e,-24);B.applyStatus(u,e,'silence',P.silence);}});shellyCheer(u,B,1);}
    },
    P:{name:'Museum Crowd',type:'Support / Energy / Control',v:{},p:{dur:7,energy:18,cool:.8,shieldHeal:.025,selfEnergy:6},
      desc:(S,P)=>'When an Encouraged ally uses a Skill, they gain '+Math.round(P.energy)+' Energy, Hope, and '+P.cool.toFixed(1)+' seconds of cooldown recovery. When a team Shield loses durability, its bearer heals for '+(P.shieldHeal*100).toFixed(1)+'% Max HP and gains Hope while Shelly gains Energy and Cheer.',
      passive:(u,B,S,P)=>{u._shellyShieldAt=new Map();B.on(u,'allyCast',a=>{if(a&&a.team===u.team&&a.hasStatus('cbencouraged')){B.energy(a,P.energy);B.reduceCd(a,P.cool);B.applyStatus(u,a,'cbhope',P.dur);shellyCheer(u,B,1);}});B.every(u,.35,()=>B.alliesOf(u).forEach(a=>{const now=a.shieldTotal||0,was=u._shellyShieldAt.get(a.uid)||0;if(was>now+.5){B.applyStatus(u,a,'cbhope',P.dur);B.heal(u,a,a.max.hp*P.shieldHeal,{tag:'Museum Crowd'});B.energy(u,P.selfEnergy);shellyCheer(u,B,1);}u._shellyShieldAt.set(a.uid,now);}));}
    },
    R:{name:'The Museum Comes Alive',type:'Control / Shield / Rescue',v:{shield:.17},p:{dur:10,rescueHp:.40,rescueShield:.34},
      desc:(S,P)=>'Starts battle with a team Shield, Encouragement, and Hope. Once per wave, Shelly prevents an ally’s defeat, restores them to '+Math.round(P.rescueHp*100)+'% HP, cleanses them, grants a '+Math.round(P.rescueShield*100)+'% Max-HP fossil barrier, and triggers an Encore.',
      passive:(u,B,S,P)=>{const allies=B.alliesOf(u);allies.forEach(a=>{B.shield(u,a,a.max.hp*S.shield,P.dur);shellyEncourage(u,B,a,P.dur);B.applyStatus(u,a,'cbhope',P.dur);});B.on(u,'allyLethal',ev=>{if(u._shellySaved||ev.unit===u)return;u._shellySaved=true;ev.prevented=true;ev.unit.hp=Math.max(1,ev.unit.max.hp*P.rescueHp);B.cleanse(ev.unit,4);B.shield(u,ev.unit,ev.unit.max.hp*P.rescueShield,P.dur);B.applyStatus(u,ev.unit,'cbhope',P.dur);B.applyStatus(u,ev.unit,'cbencouraged',P.dur);B.fxShellySkill('save',u,{target:ev.unit});Sound.play('cheer_big',{vol:.72,priority:true});B.enemiesOf(u).forEach(e=>{shellyGloom(u,B,e,1,8);B.applyStatus(u,e,'cbdisheartened',6);});u._shellyCheer=2;shellyCheer(u,B,1);});}
    }
  }
});

/* Astro’s Sleep Cycle: debt reaches Drowsy at three stacks and Forced Rest at
   five, then clears so the same enemy can be put back to sleep later. */
function astroDebt(u,B,e,n) {
  if(!e||!e.alive)return;
  B.applyStatus(u,e,'cbsleepdebt',6,{stacks:n||1});
  const st=e.statuses.find(s=>s.id==='cbsleepdebt');
  if(st&&st.stacks>=3)B.applyStatus(u,e,'cbdrowsy',5);
  if(st&&st.stacks>=5&&!e.hasStatus('cbforcedrest')){
    B.removeStatus(e,'cbsleepdebt');B.interrupt(e);B.applyStatus(u,e,'cbforcedrest',3.8,{unresistable:true});B.applyStatus(u,e,'cbdrowsy',6);B.energy(e,-28);B.fxFloatIcon(e.x,e.y-88,'SLEEP CYCLE!','#9ecbff');B.fxRing(e.x,e.y-40,108,'#8dbbff',.65);Sound.play('magiccircle',{vol:.44,throttle:700});
    const a=B.lowestHp(B.alliesOf(u));if(a)B.heal(u,a,a.max.hp*.045,{tag:'Dream Eater'});
  }
}

defHero({
  id:'BedtimeAstro',name:'Bedtime Bear Astro',folder:null,file:null,icon:null,
  role:'Support',roleLabel:'Support / Control',tier:'SS',position:'Backline',element:'Moonlight',
  blurb:'A night-watch support who completes Sleep Cycles to shut down reckless enemies.',
  base:{hp:3650,atk:145,def:185,mag:430,mdef:360,spd:105,acc:190,eva:130},
  hidden:{range:305,aspd:.94,ms:64,aggro:.38,crit:.05,critDmg:1.5,healPow:1.35,shieldPow:1.25,cdr:.09,ccRes:.24,kbRes:.30,armorPen:0,magPen:.12},
  growth:{hp:.086,atk:.055,def:.078,mag:.102,mdef:.098},
  move:{gait:'float',bob:9,freq:1.05,hover:16,idle:'pulse',step:null,particles:'sparkle',pcol:'#9fc7ff',trail:{on:true,col:'#7777e8',rate:.12},brake:.12},
  basic:{name:'Moon Mote',type:'magic',ratio:.94,range:305,proj:'orb',pcol:'#9fc7ff',sfx:'whoosh',hit:'hit_magic',wind:.28,
    onHit:(u,t,B)=>astroDebt(u,B,t,1)},
  skills:{
    W:{name:'Bedtime Story',type:'Support / Shield / Control',energy:100,v:{shield:.16},p:{dur:8,rest:3,energy:20},
      desc:(S,P)=>`<span class="sk-pas">Enemies gain Sleep Debt whenever they attack or use Skills. At 3 Debt they become Drowsy; at 5 they enter Forced Rest and the Debt resets.</span> Active: gives the team Dream Shields, Rest, Energy, and up to three cleanses, then advances every enemy’s Sleep Cycle.`,
      passive:(u,B,S,P)=>{B.every(u,.7,()=>{B.alliesOf(u).forEach(a=>{if(a.hitT<=0)B.applyStatus(u,a,'cbrest',1.4,{stacks:1});});B.enemiesOf(u).forEach(e=>{if(e.casting||e.atkCd>0)astroDebt(u,B,e,1);});});B.on(u,'enemyCast',e=>astroDebt(u,B,e,1));},
      cast:(u,B,S,P)=>{const allies=B.alliesOf(u),foes=B.enemiesOf(u);B.anim(u,'cast',.92,'astroStory');Sound.play('magiccircle',{vol:.62,priority:true});B.fxRing(u.x,u.y-40,520,'#9bbdff',1.0);allies.forEach(a=>{B.applyStatus(u,a,'cbrest',P.dur,{stacks:2});B.energy(a,P.energy);B.cleanse(a,3);B.shield(u,a,a.max.hp*S.shield,P.dur);B.applyStatus(u,a,'cbdream',P.dur);});foes.forEach(e=>astroDebt(u,B,e,1));}
    },
    G:{name:'Nightlight Watch',type:'Healing / Shield / Control',cd:9,v:{heal:.12,shield:.19},p:{dur:7},
      desc:(S,P)=>`Watches the ally most likely to be hit, healing and shielding them while cleansing up to three debuffs. The first attacker gains Sleep Debt; if the watched ally drops below half HP, they vanish into a brief safe dream.`,
      ai:{prio:74,cond:(u,B)=>B.alliesOf(u).some(a=>a.hpPct<.84||a.statuses.some(s=>STATUS[s.id]&&STATUS[s.id].kind==='debuff'))},
      cast:(u,B,S,P)=>{const a=B.lowestHp(B.alliesOf(u)),e=a&&B.enemiesOf(u).find(x=>x.target===a)||B.enemiesOf(u)[0];if(!a)return;B.anim(u,'cast',.78,'astroNightlight');Sound.play('sparkle',{vol:.42,throttle:650});B.fxRing(a.x,a.y-42,100,'#9fc7ff',.6);B.heal(u,a,a.max.hp*S.heal,{tag:'Nightlight Watch'});B.cleanse(a,3);B.applyStatus(u,a,'cbwatched',P.dur);B.applyStatus(u,a,'cbdream',P.dur);B.shield(u,a,a.max.hp*S.shield,P.dur);const off=B.on(u,'allyDamaged',ev=>{if(ev.unit!==a||!ev.src||ev.src.team===u.team)return;astroDebt(u,B,ev.src,1);ev.amount*=.76;if(a.hpPct<.5&&!a._astroDreamGuard){a._astroDreamGuard=true;B.applyStatus(u,a,'untargetable',.9);B.shield(u,a,a.max.hp*.10,3);B.fxFloatIcon(a.x,a.y-90,'💭','#9fc7ff');}});B.after(P.dur,off);if(e)astroDebt(u,B,e,1);}
    },
    B:{name:'Constellation Drift',type:'Magic Damage / Area Control',cd:11,v:{ratio:1.22},p:{dur:6},
      desc:(S,P)=>`Draws a drifting constellation through the enemy line for Magic Damage, two Sleep Debt, and Drowsy. Each enemy caught restores a little HP to the weakest ally.`,
      ai:{prio:65,cond:(u,B)=>B.enemiesOf(u).length>0},
      cast:(u,B,S,P)=>{const foes=B.enemiesOf(u),a=B.lowestHp(B.alliesOf(u));B.anim(u,'cast',.88,'astroConstellation');Sound.play('magiccircle',{vol:.54});B.fxRing(u.x+u.face*170,u.y-42,210,'#7e9cff',1);foes.forEach(e=>{B.damage(u,e,u.st.mag*S.ratio,{type:'magic',area:true,tag:'Constellation Drift'});astroDebt(u,B,e,2);B.applyStatus(u,e,'cbdrowsy',P.dur);if(a)B.heal(u,a,a.max.hp*.035,{tag:'Starlight'});});}
    },
    P:{name:'Quiet Hours',type:'Support / Energy / Cleanse',v:{heal:.07},p:{dur:5},
      desc:(S,P)=>`Rested allies who use Skills are healed, cleansed of up to two debuffs, and given Hopeful Sleep. Dream Shields also feed Astro Energy when they absorb damage.`,
      passive:(u,B,S,P)=>{B.on(u,'shieldDone',ev=>{if(ev.target&&ev.target.team===u.team){B.applyStatus(u,ev.target,'cbrest',P.dur,{stacks:1});B.energy(u,4);}});B.on(u,'allyCast',a=>{if(a&&a.team===u.team&&a.hasStatus('cbrest')){B.heal(u,a,a.max.hp*S.heal,{tag:'Quiet Hours'});B.cleanse(a,2);B.removeStatus(a,'cbrest');B.applyStatus(u,a,'cbhopefulsleep',P.dur);}});}
    },
    R:{name:'Lights Out',type:'Control / Support / Rescue',v:{shield:.22,ratio:.9},p:{dur:8},
      desc:(S,P)=>`At combat start, the team gains Dream Shields. Once per wave, Astro saves a Dream-Shielded ally, restores them, and forces a Sleep Cycle check across every enemy.`,
      passive:(u,B,S,P)=>{const allies=B.alliesOf(u);allies.forEach(a=>{B.shield(u,a,a.max.hp*S.shield,P.dur);B.applyStatus(u,a,'cbdream',P.dur);});B.on(u,'allyLethal',ev=>{if(u._astroSaved||ev.unit===u||(!ev.unit.hasStatus('cbdream')&&!ev.unit.hasStatus('shield')))return;u._astroSaved=true;ev.prevented=true;ev.unit.hp=Math.max(1,ev.unit.max.hp*.24);B.applyStatus(u,ev.unit,'untargetable',1.0);B.applyStatus(u,ev.unit,'cbrest',P.dur,{stacks:2});B.shield(u,ev.unit,ev.unit.max.hp*S.shield,P.dur);B.anim(u,'cast',1.0,'astroLightsOut');B.fxRing(ev.unit.x,ev.unit.y-42,170,'#8eaaff',1);Sound.play('magiccircle',{vol:.72,priority:true});B.enemiesOf(u).forEach(e=>{astroDebt(u,B,e,2);B.damage(u,e,u.st.mag*S.ratio,{type:'magic',area:true,tag:'Lights Out'});});});}
    }
  }
});

function gigiToken(u,B,n) {
  if(!u||!u.alive)return;
  u.wishTokens=Math.min(8,(u.wishTokens||0)+(n||1));
  B.fxFloatIcon(u.x,u.y-90,`WISH ${u.wishTokens}/8`,u.wishTokens>=8?'#ffd166':'#ff75a7');
  if(u.wishTokens>=8)u.wishJackpot=true;
}

function gigiPrize(u,B,a,jackpot) {
  if(!a||!a.alive)return;
  const kinds=['star','ribbon','spark'];
  let kind=pick(kinds);if(kind===u.wishLast&&kinds.length>1)kind=kinds[(kinds.indexOf(kind)+1)%kinds.length];
  u.wishLast=kind;u.wishKinds=u.wishKinds||new Set();u.wishKinds.add(kind);
  const jp=!!jackpot||!!u.wishJackpot;if(jp)u.wishJackpot=false;
  if(kind==='star'){const foe=B.highestEnergy(B.enemiesOf(u))||B.enemiesOf(u)[0];if(foe){B.damage(u,foe,u.st.mag*(jp?1.10:.52),{type:'magic',tag:jp?'Jackpot Star':'Star Prize'});B.energy(foe,-(jp?18:8));}B.applyStatus(u,a,'atkup',jp?7:5,{stacks:1});}
  if(kind==='ribbon'){B.heal(u,a,a.max.hp*(jp?.11:.055),{tag:'Ribbon Prize'});B.shield(u,a,a.max.hp*(jp?.20:.09),6);B.applyStatus(u,a,'ward',jp?6:3);}
  if(kind==='spark'){B.energy(a,jp?30:15);B.applyStatus(u,a,'haste',jp?7:4);B.applyStatus(u,a,'lucky',jp?7:4);}
  u.wishPrizes=(u.wishPrizes||0)+1;B.applyStatus(u,u,'cbwishattack',999,{stacks:1});
  B.fxFloatIcon(a.x,a.y-88,jp?'🎰':kind==='star'?'⭐':kind==='ribbon'?'🎀':'✨',jp?'#ffd166':'#ff9dcc');
  if(u.wishKinds.size>=3){u.wishKinds.clear();u.wishJackpot=true;B.fxFloatIcon(u.x,u.y-116,'JACKPOT READY!','#ffd166');}
}

defHero({
  id:'WishBearGigi',name:'Wish Bear Gigi',folder:null,file:null,icon:null,
  role:'Damage',roleLabel:'Damage / Support',tier:'A',position:'Midline',element:'Wish',
  blurb:'A wish-powered support attacker whose rotating prize wheel can become a Jackpot.',
  base:{hp:3250,atk:220,def:160,mag:365,mdef:285,spd:112,acc:188,eva:140},
  hidden:{range:260,aspd:1.04,ms:70,aggro:.64,crit:.09,critDmg:1.65,healPow:1.12,shieldPow:1.08,cdr:.08,ccRes:.12,kbRes:.20,armorPen:.05,magPen:.12},
  growth:{hp:.078,atk:.08,def:.064,mag:.09,mdef:.078},
  move:{gait:'bounce',bob:7,freq:1.55,hover:3,idle:'pulse',step:'step_soft',particles:'sparkle',pcol:'#ff719f',trail:{on:true,col:'#ffd166',rate:.10},brake:.3},
  basic:{name:'Capsule Pop',type:'magic',ratio:1.08,range:260,proj:'orb',pcol:'#ff719f',sfx:'sparkle',hit:'hit_magic',wind:.20,
    onHit:(u,t,B)=>{if(u.wishTokens>0&&chance(.30)){u.wishTokens--;gigiPrize(u,B,B.lowestHp(B.alliesOf(u)),false);}}},
  skills:{
    W:{name:'Wish Wheel',type:'Magic Damage / Support / Gimmick',energy:100,v:{ratio:.52},p:{max:8},
      desc:(S,P)=>`<span class="sk-pas">Gigi gains Wish Tokens when allies are hurt, enemies cast Skills, or an ally falls low. Prize types rotate: ⭐ Attack, 🎀 Ribbon Shield, and ✨ Spark Energy. Collect all three types to prime a Jackpot.</span> Active: spends her Tokens on a capsule volley and distributes that many Prizes, with the final Prize upgraded when the wheel is primed.`,
      passive:(u,B,S,P)=>{u.wishTokens=0;u.wishKinds=new Set();u.wishJackpot=false;B.on(u,'allyDamaged',ev=>{if(ev.unit&&ev.unit.team===u.team&&!ev.prevented)gigiToken(u,B);});B.on(u,'enemyCast',()=>gigiToken(u,B));B.on(u,'allyLow',a=>{if(a&&a.team===u.team&&B.t>(u._gigiLowAt||0)){u._gigiLowAt=B.t+2.5;gigiToken(u,B);}});},
      cast:(u,B,S,P)=>{const n=Math.max(1,u.wishTokens||0),foes=B.enemiesOf(u),jackpot=!!u.wishJackpot||n>=8;u.wishTokens=0;u.wishJackpot=false;B.anim(u,'cast',.86,'gigiWheel');Sound.play(jackpot?'get_rare':'get_item',{vol:jackpot?.72:.58,priority:jackpot});B.fxConfetti(u.x,u.y-55,jackpot?32:18);for(let i=0;i<n;i++){const e=foes[i%Math.max(1,foes.length)];if(e)B.fxProj(u,e,{kind:'orb',col:i%2?'#ffd166':'#ff8db8'},()=>B.damage(u,e,u.st.mag*S.ratio,{type:'magic',area:true,tag:jackpot?'Jackpot Wheel':'Wish Wheel'}));gigiPrize(u,B,B.lowestHp(B.alliesOf(u)),jackpot&&i===n-1);}}
    },
    G:{name:'Loaded Capsule',type:'Magic Damage / Control',cd:8,v:{ratio:1.38},p:{dur:7},
      desc:(S,P)=>`Launches a loaded capsule at the highest-Energy enemy for <em>${pcn(S.ratio*100)}%</em> Magic Damage, drains Energy, and Wishmarks them. If they are casting, the capsule interrupts and refunds Gigi a Token.`,
      ai:{prio:67,cond:(u,B)=>B.enemiesOf(u).length>0},
      cast:(u,B,S,P)=>{const e=B.highestEnergy(B.enemiesOf(u));if(!e)return;B.anim(u,'cast',.62,'gigiLoaded');Sound.play('get_item',{vol:.44,throttle:650});B.fxRing(e.x,e.y-42,88,'#ffd166',.34);B.fxProj(u,e,{kind:'orb',col:'#ffd166'},()=>{B.damage(u,e,u.st.mag*S.ratio,{type:'magic',tag:'Loaded Capsule'});B.applyStatus(u,e,'cbwishmarked',P.dur);B.energy(e,-22);if(e.casting){B.interrupt(e);gigiToken(u,B);B.fxFloatIcon(e.x,e.y-88,'REFUND!','#ffd166');}});}
    },
    B:{name:'Make a Wish',type:'Healing / Shield / Support',cd:10,v:{heal:.18,shield:.16,ratio:.76},p:{dur:7},
      desc:(S,P)=>`Reads the ally in the worst condition and always cleanses up to two debuffs first. Then she heals them when hurt, shields them when targeted, or restores Energy and Haste when they are empty, before firing a wish bolt at the enemy pressuring them.`,
      ai:{prio:63,cond:(u,B)=>B.alliesOf(u).some(a=>a.hpPct<.78||a.energy/a.energyMax<.28||a.statuses.some(s=>STATUS[s.id]&&STATUS[s.id].kind==='debuff'))},
      cast:(u,B,S,P)=>{const a=B.lowestHp(B.alliesOf(u)),foes=B.enemiesOf(u);if(!a)return;B.anim(u,'cast',.72,'gigiMakeWish');B.fxGigiWish(u,a);B.cleanse(a,2);if(a.hpPct<.58){B.heal(u,a,a.max.hp*S.heal,{tag:'Make a Wish'});B.cleanse(a,4);B.applyStatus(u,a,'regen',P.dur,{val:a.max.hp*.018});}else if(foes.some(e=>e.target===a)){B.shield(u,a,a.max.hp*S.shield,P.dur);B.applyStatus(u,a,'fortify',P.dur,{stacks:1});B.applyStatus(u,a,'lucky',P.dur);}else{B.energy(a,28);B.applyStatus(u,a,'haste',P.dur);}gigiToken(u,B);const e=foes.find(x=>x.target===a)||B.highestStat(foes,'atk');if(e)B.damage(u,e,u.st.mag*S.ratio,{type:'magic',tag:'Wish Bolt'});}
    },
    P:{name:'Lucky Breaks',type:'Support / Attack / Rescue',v:{atk:.03},p:{max:8},
      desc:(S,P)=>`Every Prize permanently raises Gigi’s Attack for the wave. When the team is in danger, her wheel spins faster and lucky allies gain a short protection buff.`,
      passive:(u,B,S,P)=>{B.on(u,'allyDamaged',ev=>{if(ev.unit&&ev.unit.team===u.team&&ev.unit.hpPct<.5&&B.t>(u._gigiPressureAt||0)){u._gigiPressureAt=B.t+2;gigiToken(u,B);B.applyStatus(u,ev.unit,'lucky',4);B.applyStatus(u,u,'haste',4);}});B.on(u,'enemyCast',e=>{if(e&&e.energy/e.energyMax>.78)gigiToken(u,B);});}
    },
    R:{name:'Grand Prize Rescue',type:'Support / Area Damage / Jackpot',v:{shield:.22,ratio:1.16},p:{dur:8},
      desc:(S,P)=>`Once per wave, six Tokens or a primed Jackpot can rescue an ally from defeat. The Grand Prize restores them behind a Shield, blasts every enemy, and gives the team a full Lucky Wish.`,
      passive:(u,B,S,P)=>{B.on(u,'allyLethal',ev=>{if(u._gigiSaved||ev.unit===u||((u.wishTokens||0)<6&&!u.wishJackpot))return;u._gigiSaved=true;u.wishTokens=0;u.wishJackpot=false;ev.prevented=true;ev.unit.hp=Math.max(1,ev.unit.max.hp*.24);B.applyStatus(u,ev.unit,'untargetable',1.0);B.shield(u,ev.unit,ev.unit.max.hp*S.shield,P.dur);B.applyStatus(u,ev.unit,'cbjackpot',P.dur);B.anim(u,'cast',1.02,'gigiJackpot');Sound.play('get_rare',{vol:.78,priority:true});B.fxConfetti(ev.unit.x,ev.unit.y-54,34);B.alliesOf(u).forEach(a=>{B.applyStatus(u,a,'lucky',P.dur);B.energy(a,16);});B.enemiesOf(u).forEach(e=>{B.damage(u,e,u.st.mag*S.ratio,{type:'magic',area:true,tag:'Grand Prize'});B.applyStatus(u,e,'cbwishmarked',P.dur);});});}
    }
  }
});

if (typeof HERO_IDS !== 'undefined') ['CheerbearShelly','BedtimeAstro','WishBearGigi'].forEach(id=>{if(!HERO_IDS.includes(id))HERO_IDS.push(id);});
if (typeof PLAYABLE_IDS !== 'undefined') ['CheerbearShelly','BedtimeAstro','WishBearGigi'].forEach(id=>{if(!PLAYABLE_IDS.includes(id))PLAYABLE_IDS.push(id);});
/* This file loads after the general balance pass, so apply the same gentle
   maintenance tuning to these late collaboration definitions. */
if (typeof tuneSkill === 'function') ['CheerbearShelly','BedtimeAstro','WishBearGigi'].forEach(id=>{
  const hero=HEROES[id];Object.values(hero.skills||{}).forEach(skill=>tuneSkill(skill,hero.role,hero.tier));
});
