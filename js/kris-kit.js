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
  if(!B.offscreen&&gain>=10)B.fxFloatIcon(u.x,u.y-106,'+'+gain+' TP','#ff8c92');
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
  const foes=krisFoes(u,B), eligible=foes.filter(e=>e.hp/e.max.hp<.30&&(e.getStatus('kris_acted')?.stacks||0)>=2);
  if(eligible.length)return {kind:'SPARE',target:eligible.sort((a,b)=>a.hp-b.hp)[0]};
  if(!foes.length)return null;
  const avgAtk=foes.reduce((n,e)=>n+e.st.atk,0)/foes.length;
  const highAttack=foes.filter(e=>e.st.atk>=avgAtk*1.12).sort((a,b)=>b.st.atk-a.st.atk)[0];
  if(highAttack)return {kind:'TALK',target:highAttack};
  const highEnergy=foes.filter(e=>e.energy>=Math.min(60,e.energyMax*.6)).sort((a,b)=>b.energy-a.energy)[0];
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
  id:'Kris',name:'Kris',folder:'Kris',file:'Kris',icon:'Kris',role:'Control',roleLabel:'Control / Damage',tier:'B',
  position:'Midline',element:'Deltarune',noVoice:true,eventOnly:true,
  blurb:'The quiet party leader reads the fight, builds TP, and chooses when to talk, guard, or draw their sword.',
  base:{hp:3900,atk:350,def:240,mag:120,mdef:240,spd:118,acc:220,eva:160},
  hidden:{range:185,aspd:1.04,ms:80,aggro:.65,crit:.14,critDmg:1.6,healPow:1,shieldPow:1,cdr:.10,ccRes:.18,kbRes:.3,armorPen:.08,magPen:0},
  growth:{hp:.087,atk:.091,def:.08,mag:.04,mdef:.08},
  move:{gait:'strut',bob:3,freq:1.5,lean:3,squash:.02,idle:'sway',step:'step_soft',particles:'none',pcol:'#e96385',trail:{on:false},brake:.3},
  basic:{name:'Sword Strike',type:'physical',ratio:.95,range:185,wind:.22,sfx:'dr_swing',hit:'dr_rudebuster_hit',note:'A measured sword attack. The first hit after DEFEND is stronger.'},
  skills:{
    W:{
      name:'ACT',type:'Control / Support',energy:100,
      p:{talkDur:7,distractDur:7,spareDur:7,delay:1.2},
      desc:(S,P)=>`<span class="sk-pas">At wave start, CHECK the highest-Attack foe (two with Courage). CHECK reduces Evasion by 15%; Kris deals 15% more damage to that foe and gains TP when they damage it, up to 100 TP.</span> Active chooses an ACT: <b>TALK</b> cuts a strong attacker's Attack by 25% and Skill Haste by 20% for ${P.talkDur.toFixed(1)}s; <b>DISTRACT</b> cuts a high-Energy foe's Accuracy by 30% and delays their next skill; <b>SPARE</b> removes an ordinary foe below 30% HP after two ACTs, counting as a defeat. Bosses and execution-immune foes are weakened instead. A successful ACT fills the lowest-Energy teammate's Energy. Spend 25 TP to extend the ACT, or use Determination's free empowered ACT.`,
      passive:(u,B)=>{
        u._krisTP=0;u._krisEarned=0;u._krisForDeterm=0;
        B.after(.12,()=>{
          if(!u.alive)return;
          krisFoes(u,B).sort((a,b)=>b.st.atk-a.st.atk).slice(0,u._krisCourage?2:1).forEach(e=>krisCheck(u,B,e));
        });
        B.on(u,'damageDealt',ev=>{
          if(ev.target?.team!==u.team&&krisChecked(u,ev.target)&&ev.amount>0)krisTP(u,B,6);
        });
        B.on(u,'dealDamage',ev=>{
          if(krisChecked(u,ev.target))ev.amount*=1.15;
          if(u._krisCourage&&ev.tag==='X-Slash II'&&ev.crit)ev.amount*=1.2;
        });
      },
      cast:(u,B,S,P)=>{
        const choice=krisActTarget(u,B);if(!choice)return;
        const {kind,target}=choice;
        const free=u.hasStatus('kris_determination')&&u._krisFreeAct;
        const empowered=free||krisSpendTP(u,B,25);
        if(free)u._krisFreeAct=false;
        const durBonus=(empowered?1:0)+(free?2:0);
        B.anim(u,'cast',.8,'krisAct');
        DeltaruneVisuals.act(u,B,target,kind);
        let successful=false;
        if(kind==='SPARE'){
          if(target.isBoss||target.flags?.executeImmune||target.def?.executeImmune){
            successful=!!B.applyStatus(u,target,'kris_spare_boss',P.spareDur+durBonus);
          }else{krisSpare(u,B,target);successful=!target.alive;}
        }else if(kind==='TALK'){
          successful=!!B.applyStatus(u,target,'kris_talk',P.talkDur+durBonus);
          if(successful){if(u._krisCourage)B.applyStatus(u,target,'kris_talk_courage',P.talkDur+durBonus);B.applyStatus(u,target,'kris_acted',999,{stacks:1});}
        }else{
          successful=!!B.applyStatus(u,target,'kris_distract',P.distractDur+durBonus);
          if(successful){
            for(const key of Object.keys(target.cds||{}))target.cds[key]=(target.cds[key]||0)+P.delay+(empowered?.5:0);
            if(target.casting)target.casting.t+=P.delay;
            B.applyStatus(u,target,'kris_acted',999,{stacks:1});
          }
        }
        const ally=successful&&krisLowestEnergy(u,B);if(ally)B.energy(ally,100,{resolvedAmount:true});
      }
    },
    G:{
      name:'X-Slash',type:'Physical Damage',cd:9,first:3,
      v:{first:1.25,second:1.35},p:{armorDur:6},
      desc:(S,P)=>`Kris rushes the closest enemy for two sword hits (${pcn(S.first*100)} and ${pcn(S.second*100)} Attack). The first cuts Armor by 15% for ${P.armorDur.toFixed(1)}s; the second deals 30% more damage to CHECKED foes. At 25 TP, Kris spends it to make the second hit a guaranteed Critical Hit and interrupt the target. A kill immediately CHECKs the highest-HP remaining foe.`,
      cast:(u,B,S,P)=>{
        const t=B.nearest(u,krisFoes(u,B));if(!t)return;
        const powered=krisSpendTP(u,B,25);
        const dest=Math.max(B.leftWall+25,Math.min(B.rightWall-25,t.x-u.face*52));
        B.anim(u,'attack',.65,'krisXSlash');B.dash(u,dest,.2,{depth:t.depth});
        const finishCheck=()=>{if(!t.alive){const next=krisFoes(u,B).sort((a,b)=>b.hp-a.hp)[0];if(next)krisCheck(u,B,next);}};
        B.after(.18,()=>{
          if(!u.alive||!t.alive)return;
          DeltaruneVisuals.slash(u,B,t,1);
          B.damage(u,t,u.st.atk*S.first,{type:'physical',tag:'X-Slash I'});
          B.applyStatus(u,t,'kris_armor_cut',P.armorDur);
          finishCheck();
        });
        B.after(.42,()=>{
          if(!u.alive||!t.alive)return;
          DeltaruneVisuals.slash(u,B,t,2);
          B.damage(u,t,u.st.atk*S.second*(krisChecked(u,t)?1.3:1),{type:'physical',forceCrit:powered,tag:'X-Slash II'});
          if(powered)B.interrupt(t,u);
          if(u._krisCourage&&krisChecked(u,t))krisTP(u,B,8);
          finishCheck();
        });
      }
    },
    B:{
      name:'DEFEND',type:'Support / Shield',cd:14,first:4,
      p:{guardDur:4,allyDur:4,allyReduction:.15,tp:25,critTp:15,share:.6,nextBasic:.35},
      fixedP:['guardDur','allyDur','tp','critTp'],progression:{allyReduction:{max:.3},share:{max:1},nextBasic:{max:.8}},
      desc:(S,P)=>`Kris guards for ${P.guardDur}s: 40% Damage Reduction, 30% chance to resist a debuff, and ${P.tp} TP. The lowest-HP teammate gains ${pcn(P.allyReduction*100)} Damage Reduction. A Critical Hit against Kris is partly blocked and gives ${P.critTp} extra TP. When DEFEND ends, earned TP becomes Energy for the lowest-Energy teammate; Kris's next Basic Attack deals more Physical Damage.`,
      passive:(u,B,S,P)=>{
        u.guards.push((id,d)=>d.kind==='debuff'&&u.hasStatus('kris_defend')&&Math.random()<.30);
        B.on(u,'damaged',ev=>{
          if(!u.hasStatus('kris_defend')||!ev.crit||ev.dot)return;
          ev.amount*=.7;krisTP(u,B,P.critTp+(u._krisCourage?5:0));
        });
        B.on(u,'dealDamage',ev=>{
          if(ev.basic&&u.hasStatus('kris_riposte')){
            ev.amount*=1+P.nextBasic;B.removeStatus(u,'kris_riposte');
          }
        });
      },
      cast:(u,B,S,P)=>{
        u._krisGuardEarned=0;
        const guardId=(u._krisGuardId||0)+1;u._krisGuardId=guardId;
        B.anim(u,'cast',.65,'krisDefend');B.applyStatus(u,u,'kris_defend',P.guardDur);
        const low=krisOtherAllies(u,B).sort((a,b)=>(a.hp/a.max.hp)-(b.hp/b.max.hp))[0];
        if(low)B.applyStatus(u,low,'kris_guard_ally',P.allyDur,{val:P.allyReduction});
        DeltaruneVisuals.guard(u,B,low);
        krisTP(u,B,P.tp+(u._krisCourage?10:0));
        B.after(P.guardDur,()=>{
          if(!u.alive||u._krisGuardId!==guardId)return;
          B.removeStatus(u,'kris_defend');
          const ally=krisLowestEnergy(u,B);if(ally)B.energy(ally,Math.min(40,u._krisGuardEarned*P.share),{resolvedAmount:true});
          B.applyStatus(u,u,'kris_riposte',999);
          if(u._krisCourage&&low?.alive)B.shield(u,low,low.max.hp*.08,4);
        });
      }
    },
    P:{
      name:'The Red SOUL',type:'Evasion / Support',
      v:{counter:.75},p:{evaPct:20,hasteDur:5,determDur:8,determCd:15},
      fixedP:['evaPct','hasteDur','determDur','determCd'],
      desc:(S,P)=>`Kris gains ${P.evaPct}% Evasion. A Dodge shows the red SOUL, grants 10 TP and 15% Skill Haste for ${P.hasteDur}s. Every third Dodge counters the attacker for ${pcn(S.counter*100)} Attack. Each 50 TP generated in a wave grants Determination for ${P.determDur}s: Attack and Damage Reduction +15%, and the next ACT is empowered for free. This can occur once every ${P.determCd}s.`,
      passive:(u,B,S,P)=>{
        u.flat.evaP_soul=P.evaPct/100;u.dirty=true;u._krisSoul=true;u._krisDodgeCount=0;u._krisDetermAt=-99;u._krisForDeterm=0;
        B.on(u,'dodged',ev=>{
          u._krisDodgeCount++;
          krisTP(u,B,u._krisCourage?15:10);
          B.applyStatus(u,u,'kris_soul_haste',P.hasteDur);
          DeltaruneVisuals.soul(u,B);
          if(u._krisDodgeCount%3===0&&ev.src?.alive){
            B.damage(u,ev.src,u.st.atk*S.counter,{type:'physical',tag:'SOUL Counter'});
            if(u._krisCourage){const ally=krisLowestEnergy(u,B);if(ally)B.energy(ally,10,{resolvedAmount:true});}
          }
        });
        B.every(u,.25,()=>{
          if(u._krisForDeterm<50||B.t-u._krisDetermAt<P.determCd)return;
          u._krisForDeterm-=50;u._krisDetermAt=B.t;u._krisFreeAct=true;
          B.applyStatus(u,u,'kris_determination',P.determDur);
          DeltaruneVisuals.soul(u,B);
          if(!B.offscreen)B.fxFloatIcon(u.x,u.y-112,'DETERMINATION','#ff526b');
        });
      }
    },
    R:{
      name:'Courage',type:'Support / Control / Physical Damage',
      v:{final:1.45},p:{atkPct:8,evaPct:5,hpPct:8,guardDur:8,stun:1.1},
      fixedP:['guardDur'],
      desc:(S,P)=>`ACT CHECKs two foes and TALK also weakens Skill Damage. X-Slash hits harder and restores TP on CHECKED foes. DEFEND leaves a Shield on its protected teammate. SOUL counters give Energy to the lowest-Energy teammate. Once per wave, when two allies are below half HP, Courage gives the team +25% Armor, +25% Magic Defense, 15% Damage Reduction, and Knockback Resistance for ${P.guardDur}s. It boosts TP from Dodges and DEFEND, then Kris strikes the highest-Attack foe for ${pcn(S.final*100)} Attack and briefly Stuns them. Kris also gains Attack, Evasion, and Max HP.`,
      passive:(u,B,S,P)=>{
        u._krisCourage=true;u._krisCourageUsed=false;
        u.flat.atkP_courage=P.atkPct/100;u.flat.evaP_courage=P.evaPct/100;u.flat.hpP_courage=P.hpPct/100;u.dirty=true;
        B.every(u,.3,()=>{
          if(u._krisCourageUsed||B.alliesOf(u).filter(a=>a.alive&&!a.minion&&a.hp/a.max.hp<.5).length<2)return;
          u._krisCourageUsed=true;
          B.anim(u,'cast',.8,'krisCourage');
          DeltaruneVisuals.courage(u,B);
          B.alliesOf(u).filter(a=>a.alive).forEach(a=>B.applyStatus(u,a,'kris_courage_team',P.guardDur));
          B.after(P.guardDur,()=>{
            if(!u.alive)return;
            const foe=krisFoes(u,B).sort((a,b)=>b.st.atk-a.st.atk)[0];if(!foe)return;
            DeltaruneVisuals.slash(u,B,foe,2);
            B.damage(u,foe,u.st.atk*S.final,{type:'physical',tag:'Courage Strike'});
            B.applyStatus(u,foe,'stun',P.stun);
          });
        });
      }
    }
  }
});

SPECIAL_HERO_ART.Kris='assets/deltarune/kris-idle.png';
SPECIAL_HERO_ICONS.Kris='assets/deltarune/kris-idle.png';
SKILL_HERO_ART.Kris={W:'assets/deltarune/kris-act.png',G:'assets/deltarune/kris-attack.png',B:'assets/deltarune/kris-guard.png'};
if(!HERO_IDS.includes('Kris'))HERO_IDS.push('Kris');
if(!PLAYABLE_IDS.includes('Kris'))PLAYABLE_IDS.push('Kris');
HERO_OBTAIN.Kris='Collab';
COLLAB_HERO_IDS.add('Kris');

/* The image is the user's Delta Rune, with only its exterior white removed.
   A wearer gets the same benefit regardless of which Hero they are. */
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
defTrinket({
  id:'kris_delta_rune',name:'The Delta Rune',owner:'Kris',file:'delta-rune.png',
  desc:'A familiar emblem carried into another world.',
  stat:r=>`+${(r*2.2).toFixed(1)}% Evasion and +${(r*1.3).toFixed(1)}% Skill Haste`,
  effect:'Dodging gives the lowest-Energy teammate a small Energy boost.',
  apply(u,B,r){u.flat.evaP_delta=(u.flat.evaP_delta||0)+r*.022;u.flat.cdr_delta=(u.flat.cdr_delta||0)+r*.013;u.dirty=true;}
});
TRINKET_IDS.push('kris_delta_rune');
{
  const previousIcon=trinketIcon;
  trinketIcon=function(id){return id==='kris_delta_rune'?ASSET+'assets/deltarune/delta-rune.png':previousIcon(id);};
}
