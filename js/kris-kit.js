/* Kris — Dandy's Heroes. Deltarune's battle commands adapted to the native
   auto battler. The Delta Rune is generic equipment: any Hero may wear it. */
'use strict';

STATUS.kris_checked = { icon:'🔎', name:'CHECKED', kind:'debuff', desc:'Kris has read this foe. Evasion -15%; Kris deals 15% more damage to them.', mods:m=>{m.evaP-=.15;} };
STATUS.kris_acted = { icon:'✦', name:'ACTed', kind:'special', max:2, desc:'Kris has used ACT on this foe. Two ACTs make a weakened ordinary foe eligible for SPARE.', mods:()=>{} };
STATUS.kris_talk = { icon:'💬', name:'Talked Down', kind:'debuff', desc:'Attack -25% and Skill Haste -20%.', mods:m=>{m.atkP-=.25;m.cdr-=.20;} };
STATUS.kris_talk_courage = { icon:'💬', name:'Courageous Talk', kind:'debuff', desc:'Skills deal 15% less damage.', onDealDamage:(u,s,ev)=>{if(!ev.basic)ev.amount*=.85;}, mods:()=>{} };
STATUS.kris_distract = { icon:'✧', name:'Distracted', kind:'debuff', desc:'Accuracy -30%; next skill delayed.', mods:m=>{m.accP-=.30;} };
STATUS.kris_spare_boss = { icon:'♡', name:'SPARE', kind:'debuff', desc:'Boss or execution-immune foe: Attack -25% and Skill Haste -20%.', mods:m=>{m.atkP-=.25;m.cdr-=.20;} };
STATUS.kris_armor_cut = { icon:'⚔', name:'Armor Cut', kind:'debuff', desc:'Armor -15%.', mods:m=>{m.defP-=.15;} };
STATUS.kris_defend = { icon:'🛡', name:'DEFEND', kind:'buff', desc:'Damage Reduction +40%.', mods:m=>{m.dmgTaken-=.40;} };
STATUS.kris_guard_ally = { icon:'🛡', name:'Guarded by Kris', kind:'buff', desc:'Damage Reduction +15%.', mods:(m,s)=>{m.dmgTaken-=s.val||.15;} };
STATUS.kris_riposte = { icon:'⚔', name:'Ready to Strike', kind:'buff', desc:'Next Basic Attack deals more Physical Damage.', mods:()=>{} };
STATUS.kris_soul_haste = { icon:'♥', name:'SOUL Focus', kind:'buff', desc:'Skill Haste +15%.', mods:m=>{m.cdr+=.15;} };
STATUS.kris_determination = { icon:'♥', name:'Determination', kind:'buff', desc:'Attack +15% and Damage Reduction +15%.', mods:m=>{m.atkP+=.15;m.dmgTaken-=.15;} };
STATUS.kris_courage_team = { icon:'✦', name:'Courage', kind:'buff', desc:'Armor and Magic Defense +25%; Damage Reduction +15%; Knockback Resistance increased.', mods:m=>{m.defP+=.25;m.mdefP+=.25;m.dmgTaken-=.15;m.kbRes+=.35;} };

const krisFoes=(u,B)=>B.enemiesOf(u).filter(e=>e.alive&&B.isTargetable(e,u));
const krisChecked=(u,e)=>!!e?.statuses?.some(s=>s.id==='kris_checked'&&s.src===u);
const krisOtherAllies=(u,B)=>B.alliesOf(u).filter(a=>a.alive&&a!==u&&!a.minion);
function krisLowestEnergy(u,B){
  return krisOtherAllies(u,B).sort((a,b)=>(a.energy/a.energyMax)-(b.energy/b.energyMax))[0]||null;
}
function krisCheck(u,B,e){
  if(!e?.alive)return;
  B.applyStatus(u,e,'kris_checked',999);
  DeltaruneVisuals.check(u,B,e);
}
function krisTP(u,B,n){
  const gain=Math.min(Math.max(0,100-(u._krisTP||0)),Math.max(0,n));
  if(!gain)return;
  u._krisTP=(u._krisTP||0)+gain;
  u._krisEarned=(u._krisEarned||0)+gain;
  if(u._krisSoul)u._krisForDeterm=(u._krisForDeterm||0)+gain;
  if(u.hasStatus('kris_defend'))u._krisGuardEarned=(u._krisGuardEarned||0)+gain;
  const chip=B.applyStatus(u,u,'kris_tp',999,{stacks:gain});
  if(chip){chip.stacks=u._krisTP;u.statusVersion++;}
  if(!B.offscreen&&gain>=8){
    if(typeof DeltaruneVisuals!=='undefined'&&DeltaruneVisuals.tpGain) DeltaruneVisuals.tpGain(u,B,gain,'#ff8c92');
    else B.fxFloatIcon(u.x,u.y-106,'+'+gain+' TP','#ff8c92');
  }
}
STATUS.kris_tp={icon:'♥',name:'TP',kind:'special',max:100,desc:'Kris can spend 25 TP to empower ACT or X-Slash.',mods:()=>{}};
function krisSpendTP(u,B,n){
  if((u._krisTP||0)<n)return false;
  u._krisTP-=n;
  if(u._krisTP){const chip=u.getStatus('kris_tp');if(chip){chip.stacks=u._krisTP;u.statusVersion++;}}
  else B.removeStatus(u,'kris_tp');
  return true;
}
function krisActTarget(u,B){
  const foes=krisFoes(u,B);
  if(!foes.length)return null;
  const eligible=foes.filter(e=>(e.hp/e.max.hp<.38&&(e.getStatus('kris_acted')?.stacks||0)>=1)||(e.hp/e.max.hp<.22));
  if(eligible.length)return {kind:'SPARE',target:eligible.sort((a,b)=>a.hp-b.hp)[0]};
  const avgAtk=foes.reduce((n,e)=>n+e.st.atk,0)/foes.length;
  const highAttack=foes.filter(e=>e.st.atk>=avgAtk*1.1).sort((a,b)=>b.st.atk-a.st.atk)[0];
  if(highAttack)return {kind:'TALK',target:highAttack};
  const highEnergy=foes.filter(e=>e.energy>=Math.min(50,e.energyMax*.5)).sort((a,b)=>b.energy-a.energy)[0];
  if(highEnergy)return {kind:'DISTRACT',target:highEnergy};
  return {kind:'TALK',target:foes.sort((a,b)=>b.st.atk-a.st.atk)[0]};
}
function krisSpare(u,B,target){
  // Keep native defeat/scoring hooks, but let SPARE fade the foe out quietly.
  const wasOffscreen=B.offscreen;
  B.offscreen=true;
  try{B.kill(target,u);}finally{B.offscreen=wasOffscreen;}
  if(!wasOffscreen&&target.el){
    target.el.style.transition='opacity .42s ease';target.el.style.opacity='0';
    if(target.bar)target.bar.classList.add('gone');
    setTimeout(()=>{if(!target.alive&&target.el)target.el.style.display='none';},450);
  }
}

defHero({
  id:'Kris',name:'Kris',folder:'Kris',file:'Kris',icon:'Kris',role:'Control',roleLabel:'Control / Damage',tier:'S',
  position:'Midline',element:'Deltarune',noVoice:true,eventOnly:true,nativeFace:1,
  blurb:'The quiet party leader reads the fight, builds TP, and chooses when to talk, guard, or draw their sword.',
  base:{hp:4400,atk:410,def:275,mag:160,mdef:265,spd:124,acc:235,eva:185},
  hidden:{range:185,aspd:1.06,ms:84,aggro:.65,crit:.16,critDmg:1.65,healPow:1,shieldPow:1.15,cdr:.10,ccRes:.2,kbRes:.35,armorPen:.10,magPen:0},
  growth:{hp:.094,atk:.098,def:.086,mag:.04,mdef:.086},
  move:{gait:'strut',bob:3,freq:1.5,lean:3,squash:.02,idle:'sway',step:'step_soft',particles:'none',pcol:'#e96385',trail:{on:false},brake:.3},
  basic:{name:'Sword Strike',type:'physical',ratio:1.05,range:185,wind:.20,sfx:'dr_swing',hit:'dr_rudebuster_hit',note:'A measured sword attack. The first hit after DEFEND is much stronger.'},
  skills:{
    W:{
      name:'ACT',type:'Control / Support',energy:100,
      p:{talkDur:7,distractDur:7,spareDur:7,delay:1.5},
      desc:(S,P)=>`<span class="sk-pas">At wave start, CHECK the highest-Attack foe (two with Courage). CHECK reduces Evasion by 15%; Kris deals 20% more damage to that foe and gains 12 TP when they damage it, up to 100 TP.</span> Active chooses an ACT: <b>TALK</b> cuts a strong attacker's Attack by 25% and Skill Haste by 20% for ${P.talkDur.toFixed(1)}s; <b>DISTRACT</b> cuts a high-Energy foe's Accuracy by 30% and delays their next skill; <b>SPARE</b> peacefully removes a weakened foe, counting as a defeat. Bosses and execution-immune foes take heavy true damage and are weakened instead. A successful ACT fills the lowest-Energy teammate's Energy. Spend 25 TP to empower the ACT, extending duration, adding Armor Cut on TALK or Energy drain on DISTRACT.`,
      passive:(u,B)=>{
        const initWave=()=>{
          u._krisTP=0;u._krisEarned=0;u._krisForDeterm=0;
          B.after(.12,()=>{
            if(!u.alive)return;
            krisFoes(u,B).sort((a,b)=>b.st.atk-a.st.atk).slice(0,u._krisCourage?2:1).forEach(e=>krisCheck(u,B,e));
          });
        };
        initWave();
        B.on(u,'waveStart',initWave);
        B.on(u,'damageDealt',ev=>{
          if(ev.target?.team!==u.team&&krisChecked(u,ev.target)&&ev.amount>0)krisTP(u,B,12);
        });
        B.on(u,'dealDamage',ev=>{
          if(krisChecked(u,ev.target))ev.amount*=1.20;
          if(u._krisCourage&&ev.tag==='X-Slash II'&&ev.crit)ev.amount*=1.3;
        });
      },
      cast:(u,B,S,P)=>{
        const choice=krisActTarget(u,B);if(!choice)return;
        const {kind,target}=choice;
        const free=u.hasStatus('kris_determination')&&u._krisFreeAct;
        const empowered=free||krisSpendTP(u,B,25);
        if(free)u._krisFreeAct=false;
        const durBonus=(empowered?3:0)+(free?2:0);
        B.anim(u,'cast',.8,'krisAct');
        DeltaruneVisuals.act(u,B,target,kind);
        let successful=false;
        if(kind==='SPARE'){
          if(target.isBoss||target.flags?.executeImmune||target.def?.executeImmune){
            successful=!!B.applyStatus(u,target,'kris_spare_boss',P.spareDur+durBonus);
            B.damage(u,target,u.st.atk*2.4*(empowered?1.35:1),{type:'true',tag:'SPARE Soul Impact'});
          }else{krisSpare(u,B,target);successful=!target.alive;}
        }else if(kind==='TALK'){
          successful=!!B.applyStatus(u,target,'kris_talk',P.talkDur+durBonus);
          if(successful){
            if(u._krisCourage)B.applyStatus(u,target,'kris_talk_courage',P.talkDur+durBonus);
            B.applyStatus(u,target,'kris_acted',999,{stacks:1});
            if(empowered){
              B.applyStatus(u,target,'kris_armor_cut',P.talkDur+durBonus);
              B.damage(u,target,u.st.atk*1.25,{type:'physical',tag:'Empowered TALK'});
            }
          }
        }else{
          successful=!!B.applyStatus(u,target,'kris_distract',P.distractDur+durBonus);
          if(successful){
            for(const key of Object.keys(target.cds||{}))target.cds[key]=(target.cds[key]||0)+P.delay+(empowered?1.0:0);
            if(target.casting)target.casting.t+=P.delay+(empowered?1.0:0);
            B.applyStatus(u,target,'kris_acted',999,{stacks:1});
            if(empowered)B.energy(target,-25,{resolvedAmount:true});
          }
        }
        const ally=successful&&(krisLowestEnergy(u,B)||u);if(ally)B.energy(ally,100,{resolvedAmount:true});
      }
    },
    G:{
      name:'X-Slash',type:'Physical Damage',cd:9,first:3,
      v:{first:1.85,second:2.15},p:{armorDur:6},
      desc:(S,P)=>`Kris rushes the closest enemy for two sword hits (${pcn(S.first*100)} and ${pcn(S.second*100)} Attack). The first cuts Armor by 15% for ${P.armorDur.toFixed(1)}s; the second deals 30% more damage to CHECKED foes. At 25 TP, Kris spends it to make both hits guaranteed Critical Hits, interrupt the target, and cleave nearby foes for 50% splash damage. A kill immediately CHECKs the highest-HP remaining foe.`,
      cast:(u,B,S,P)=>{
        const t=B.nearest(u,krisFoes(u,B));if(!t)return;
        const powered=krisSpendTP(u,B,25);
        if(t.x!==u.x)u.face=t.x>=u.x?1:-1;
        const dest=Math.max(B.leftWall+25,Math.min(B.rightWall-25,t.x-u.face*52));
        B.anim(u,'attack',.65,'krisXSlash');B.dash(u,dest,.2,{depth:t.depth});
        const finishCheck=()=>{if(!t.alive){const next=krisFoes(u,B).sort((a,b)=>b.hp-a.hp)[0];if(next)krisCheck(u,B,next);}};
        B.after(.18,()=>{
          if(!u.alive||!t.alive)return;
          DeltaruneVisuals.slash(u,B,t,1);
          B.damage(u,t,u.st.atk*S.first,{type:'physical',forceCrit:powered,tag:'X-Slash I'});
          B.applyStatus(u,t,'kris_armor_cut',P.armorDur);
          if(powered){
            krisFoes(u,B).filter(e=>e.alive&&e!==t&&B.distance(e,t)<120).forEach(e=>{
              B.damage(u,e,u.st.atk*S.first*.5,{type:'physical',area:true,tag:'X-Slash Splash'});
            });
          }
          finishCheck();
        });
        B.after(.42,()=>{
          if(!u.alive||!t.alive)return;
          DeltaruneVisuals.slash(u,B,t,2);
          B.damage(u,t,u.st.atk*S.second*(krisChecked(u,t)?1.3:1),{type:'physical',forceCrit:powered,tag:'X-Slash II'});
          if(powered){
            B.interrupt(t,u);
            krisFoes(u,B).filter(e=>e.alive&&e!==t&&B.distance(e,t)<120).forEach(e=>{
              B.damage(u,e,u.st.atk*S.second*.5,{type:'physical',area:true,tag:'X-Slash Splash'});
            });
          }
          if(u._krisCourage&&krisChecked(u,t))krisTP(u,B,10);
          finishCheck();
        });
      }
    },
    B:{
      name:'DEFEND',type:'Support / Shield',cd:14,first:4,
      p:{guardDur:4,allyDur:4,allyReduction:.25,tp:35,critTp:20,share:.75,nextBasic:1.0},
      fixedP:['guardDur','allyDur','tp','critTp'],progression:{allyReduction:{max:.4},share:{max:1},nextBasic:{max:1.6}},
      desc:(S,P)=>`Kris guards for ${P.guardDur}s: 40% Damage Reduction, 30% chance to resist a debuff, and ${P.tp} TP. The lowest-HP teammate gains ${pcn(P.allyReduction*100)} Damage Reduction and a 12% Max HP Shield. A Critical Hit against Kris is partly blocked and gives ${P.critTp} extra TP. When DEFEND ends, earned TP becomes Energy for the lowest-Energy teammate; Kris's next Basic Attack becomes a devastating Riposte (+100% damage, guaranteed Crit, Knockback).`,
      passive:(u,B,S,P)=>{
        u.guards.push((id,d)=>d.kind==='debuff'&&u.hasStatus('kris_defend')&&Math.random()<.30);
        B.on(u,'damaged',ev=>{
          if(!u.hasStatus('kris_defend')||!ev.crit||ev.dot)return;
          ev.amount*=.65;krisTP(u,B,P.critTp+(u._krisCourage?8:0));
        });
        B.on(u,'dealDamage',ev=>{
          if(ev.basic&&u.hasStatus('kris_riposte')){
            ev.amount*=1+P.nextBasic;
            B.removeStatus(u,'kris_riposte');
            if(ev.target?.alive)B.knockback(u,ev.target,60);
          }
        });
      },
      cast:(u,B,S,P)=>{
        u._krisGuardEarned=0;
        const guardId=(u._krisGuardId||0)+1;u._krisGuardId=guardId;
        B.anim(u,'cast',.65,'krisDefend');B.applyStatus(u,u,'kris_defend',P.guardDur);
        const low=krisOtherAllies(u,B).sort((a,b)=>(a.hp/a.max.hp)-(b.hp/b.max.hp))[0];
        if(low){
          B.applyStatus(u,low,'kris_guard_ally',P.allyDur,{val:P.allyReduction});
          B.shield(u,low,low.max.hp*.12,P.allyDur);
        }
        DeltaruneVisuals.guard(u,B,low);
        krisTP(u,B,P.tp+(u._krisCourage?12:0));
        B.after(P.guardDur,()=>{
          if(!u.alive||u._krisGuardId!==guardId)return;
          B.removeStatus(u,'kris_defend');
          const ally=krisLowestEnergy(u,B)||u;if(ally)B.energy(ally,Math.min(50,u._krisGuardEarned*P.share),{resolvedAmount:true});
          B.applyStatus(u,u,'kris_riposte',999);
          if(u._krisCourage&&low?.alive)B.shield(u,low,low.max.hp*.10,4);
        });
      }
    },
    P:{
      name:'The Red SOUL',type:'Evasion / Support',
      v:{counter:1.40},p:{evaPct:25,hasteDur:5,determDur:8,determCd:12},
      fixedP:['evaPct','hasteDur','determDur','determCd'],
      desc:(S,P)=>`Kris gains ${P.evaPct}% Evasion. A Dodge shows the red SOUL, grants 15 TP and 15% Skill Haste for ${P.hasteDur}s. Every second Dodge counters the attacker for ${pcn(S.counter*100)} Attack. Each 50 TP generated in a wave grants Determination for ${P.determDur}s: Attack +20%, Damage Reduction +20%, heals 15% Max HP, and the next ACT is empowered for free. This can occur once every ${P.determCd}s.`,
      passive:(u,B,S,P)=>{
        const p=P||{evaPct:25,hasteDur:5,determDur:8,determCd:12}, s=S||{counter:1.40};
        u.flat.evaP_soul=p.evaPct/100;u.dirty=true;u._krisSoul=true;u._krisDodgeCount=0;u._krisDetermAt=-99;u._krisForDeterm=0;
        B.on(u,'dodged',ev=>{
          u._krisDodgeCount++;
          krisTP(u,B,u._krisCourage?20:15);
          B.applyStatus(u,u,'kris_soul_haste',p.hasteDur);
          DeltaruneVisuals.soul(u,B);
          if(u._krisDodgeCount%2===0&&ev.src?.alive){
            B.damage(u,ev.src,u.st.atk*s.counter,{type:'physical',tag:'SOUL Counter'});
            const ally=krisLowestEnergy(u,B)||u;if(ally)B.energy(ally,u._krisCourage?15:10,{resolvedAmount:true});
          }
        });
        B.every(u,.25,()=>{
          if(u._krisForDeterm<50||B.t-u._krisDetermAt<p.determCd)return;
          u._krisForDeterm-=50;u._krisDetermAt=B.t;u._krisFreeAct=true;
          B.applyStatus(u,u,'kris_determination',p.determDur);
          B.heal(u,u,u.max.hp*.15,{tag:'Determination'});
          B.cleanse(u,2);
          DeltaruneVisuals.soul(u,B);
          if(!B.offscreen)B.fxFloatIcon(u.x,u.y-112,'DETERMINATION','#ff526b');
        });
      }
    },
    R:{
      name:'Courage',type:'Support / Control / Physical Damage',
      v:{final:2.20},p:{atkPct:12,evaPct:8,hpPct:12,guardDur:8,stun:1.5},
      fixedP:['guardDur'],
      desc:(S,P)=>`ACT CHECKs two foes and TALK also weakens Skill Damage. X-Slash hits harder and restores TP on CHECKED foes. DEFEND leaves a Shield on its protected teammate. SOUL counters give Energy to the lowest-Energy teammate. Once per wave, when Kris or two allies fall below half HP, Courage inspires the team with +25% Armor, +25% Magic Defense, 15% Damage Reduction, and Knockback Resistance for ${P.guardDur}s. Kris immediately unleashes a Courage Strike on the highest-Attack foe for ${pcn(S.final*100)} Attack with a ${P.stun}s Stun. Kris also gains permanent Attack, Evasion, and Max HP.`,
      passive:(u,B,S,P)=>{
        const p=P||{guardDur:8,stun:1.5,atkPct:12,evaPct:8,hpPct:12}, s=S||{final:2.20};
        u._krisCourage=true;u._krisCourageUsed=false;
        u.flat.atkP_courage=p.atkPct/100;u.flat.evaP_courage=p.evaPct/100;u.flat.hpP_courage=p.hpPct/100;u.dirty=true;
        B.on(u,'waveStart',()=>{u._krisCourageUsed=false;});
        B.every(u,.25,()=>{
          if(u._krisCourageUsed)return;
          const lowTeammates=B.alliesOf(u).filter(a=>a.alive&&!a.minion&&a.hp/a.max.hp<.5);
          if(lowTeammates.length<2&&u.hp/u.max.hp>=.5)return;
          u._krisCourageUsed=true;
          B.anim(u,'cast',.8,'krisCourage');
          DeltaruneVisuals.courage(u,B);
          B.alliesOf(u).filter(a=>a.alive).forEach(a=>B.applyStatus(u,a,'kris_courage_team',p.guardDur));
          B.after(.35,()=>{
            if(!u.alive)return;
            const foe=krisFoes(u,B).sort((a,b)=>b.st.atk-a.st.atk)[0];if(!foe)return;
            if(foe.x!==u.x)u.face=foe.x>=u.x?1:-1;
            DeltaruneVisuals.slash(u,B,foe,2);
            B.damage(u,foe,u.st.atk*s.final,{type:'physical',tag:'Courage Strike'});
            B.applyStatus(u,foe,'stun',p.stun);
          });
        });
      }
    }
  }
});

SPECIAL_HERO_ART.Kris='assets/deltarune/kris-portrait.png';
SPECIAL_HERO_ICONS.Kris='assets/deltarune/kris-icon.png';
SKILL_HERO_ART.Kris={W:'assets/deltarune/kris-act.png',G:'assets/deltarune/kris-attack.png',B:'assets/deltarune/kris-guard.png'};
if(!HERO_IDS.includes('Kris'))HERO_IDS.push('Kris');
if(!PLAYABLE_IDS.includes('Kris'))PLAYABLE_IDS.push('Kris');
HERO_OBTAIN.Kris='Collab';
COLLAB_HERO_IDS.add('Kris');

/* The image is the user's Delta Rune, with only its exterior white removed.
   A wearer gets the same benefit regardless of which Hero they are. */
if(typeof TRINKET_SIGNATURES!=='undefined'){
  TRINKET_SIGNATURES.Kris={
    name:'Quiet Resolve',desc:'A Dodge gives the lowest-Energy teammate a small Energy boost.',
    apply(u,B,r){
      B.on(u,'dodged',()=>{
        if(B.t<(u._deltaRuneAt||0))return;
        u._deltaRuneAt=B.t+Math.max(4,8-r*.3);
        const ally=B.alliesOf(u).filter(a=>a.alive&&a!==u&&!a.minion).sort((a,b)=>(a.energy/a.energyMax)-(b.energy/b.energyMax))[0];
        if(ally)B.energy(ally,4+r,{resolvedAmount:true});
      });
    }
  };
}
if(typeof defTrinket!=='undefined'){
  defTrinket({
    id:'kris_delta_rune',name:'The Delta Rune',owner:'Kris',file:'delta-rune.png',
    desc:'A familiar emblem carried into another world.',
    stat:r=>`+${(r*2.2).toFixed(1)}% Evasion and +${(r*1.3).toFixed(1)}% Skill Haste`,
    effect:'Dodging gives the lowest-Energy teammate a small Energy boost.',
    apply(u,B,r){u.flat.evaP_delta=(u.flat.evaP_delta||0)+r*.022;u.flat.cdr_delta=(u.flat.cdr_delta||0)+r*.013;u.dirty=true;}
  });
}
if(typeof TRINKET_IDS!=='undefined')TRINKET_IDS.push('kris_delta_rune');
if(typeof trinketIcon!=='undefined'){
  const previousIcon=trinketIcon;
  trinketIcon=function(id){return id==='kris_delta_rune'?(typeof ASSET==='string'?ASSET:'')+'assets/deltarune/delta-rune.png':previousIcon(id);};
}
