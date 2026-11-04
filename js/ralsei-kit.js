/* Ralsei — Flower Kingdom recruit. TP belongs to Ralsei and works with any team. */
'use strict';

STATUS.ralsei_tp={icon:'♥',name:'TP',kind:'special',max:100,desc:'Protecting and healing build TP, which empowers Ralsei’s magic.',mods:()=>{}};
STATUS.ralsei_dual_guard={icon:'✦',name:'DualHeal',kind:'buff',desc:'Damage taken -20%; healing received +15%.',mods:m=>{m.dmgTaken-=.20;m.healRecv+=.15;}};
STATUS.ralsei_drowsy={icon:'☾',name:'Drowsy',kind:'debuff',desc:'Attack Speed -25%, Skill Haste -20%, damage dealt -15%. Prince of the Dark also lowers Attack by 15%.',mods:(m,s)=>{m.aspdP-=.25;m.cdr-=.20;m.dmgDealt-=.15;if(s.src?.hasStatus('ralsei_prince'))m.atkP-=.15;}};
STATUS.ralsei_tired={icon:'☾',name:'TIRED',kind:'debuff',desc:'Can be Pacified below 35% HP. Healing received is reduced at Red rarity.',mods:(m,s)=>{if(s.src?._ralseiRed)m.healRecv-=.25;}};
STATUS.ralsei_boss_pacify={icon:'☾',name:'Pacified',kind:'debuff',desc:'Attack -25%.',mods:m=>{m.atkP-=.25;}};
STATUS.ralsei_fluffy={icon:'☁',name:'FluffyGuard',kind:'buff',desc:'Blocks the next Skill hit or three Basic Attacks. Evasion +20%; Debuff Resistance +15%.',mods:m=>{m.evaP+=.20;m.ccRes+=.15;},
  onDamaged(a,s,ev,B){
    if(ev.dot||ev.amount<=0||s.src?.alive!==true)return;
    if(ev.crit&&s.src._ralseiRed&&!s.ralseiCritLayer){s.ralseiCritLayer=true;}
    else s.ralseiCharges=ev.basic?Math.max(0,(s.ralseiCharges||3)-1):0;
    ev.amount=0;
    DeltaruneVisuals.block(s.src,B,a);
    ralseiGain(s.src,B,10);
    if(ev.src?.alive){
      const alreadyDrowsy=ev.src.hasStatus('ralsei_drowsy');
      B.applyStatus(s.src,ev.src,'ralsei_drowsy',alreadyDrowsy?8:5);
      if(alreadyDrowsy&&B.t>=(ev.src._ralseiDrowsyDrainAt||0)){
        ev.src._ralseiDrowsyDrainAt=B.t+2;B.energy(ev.src,-12,{resolvedAmount:true});
      }
    }
    if(s.ralseiCharges<=0){
      if(s.src._ralseiRed)B.energy(a,12,{resolvedAmount:true});
      B.removeStatus(a,'ralsei_fluffy');
    }
  },
  onExpire(a,s,B){if(a.alive&&s.ralseiCharges>0&&s.src?.alive)B.heal(s.src,a,a.max.hp*.1,{tag:'FluffyGuard'});}
};
STATUS.ralsei_kindness={icon:'♡',name:'Kindness',kind:'buff',desc:'Armor, Magic Defense, and Energy generation +15%.',mods:m=>{m.defP+=.15;m.mdefP+=.15;m.energyGen+=.15;}};
STATUS.ralsei_prayer_guard={icon:'♡',name:'Miracle Prayer',kind:'buff',desc:'Damage taken -25%.',mods:m=>{m.dmgTaken-=.25;}};
STATUS.ralsei_prince={icon:'★',name:'Prince of the Dark',kind:'buff',desc:'Team damage taken -25%.',mods:m=>{m.dmgTaken-=.25;}};
STATUS.ralsei_haste={icon:'✦',name:'Healing Rhythm',kind:'buff',desc:'Skill Haste +20%.',mods:m=>{m.cdr+=.20;}};

const ralseiAllies=(u,B)=>B.alliesOf(u).filter(a=>a.alive&&!a.minion);
const ralseiFoes=(u,B)=>B.enemiesOf(u).filter(e=>e.alive&&B.isTargetable(e,u));
const ralseiLow=(u,B)=>ralseiAllies(u,B).sort((a,b)=>(a.hp/a.max.hp)-(b.hp/b.max.hp));
function ralseiSyncTP(u,B){
  const n=u._ralseiTP||0;
  if(!n){B.removeStatus(u,'ralsei_tp');return;}
  const s=B.applyStatus(u,u,'ralsei_tp',999,{stacks:1});
  if(s){s.stacks=n;u.statusVersion++;}
}
function ralseiGain(u,B,n){
  const old=u._ralseiTP||0;u._ralseiTP=Math.min(100,old+n);
  if(u._ralseiTP!==old)ralseiSyncTP(u,B);
}
function ralseiSpend(u,B,n){
  if((u._ralseiTP||0)<n)return false;
  u._ralseiTP-=n;ralseiSyncTP(u,B);return true;
}
function ralseiBasic(u,B){
  B.anim(u,'cast',.5,'ralseiBasic');
  ralseiLow(u,B).slice(0,u.hasStatus('ralsei_prince')?2:1).forEach(a=>{
    B.heal(u,a,u.st.mag*.75,{tag:'Healing Spell',overheal:'shield'});
    B.cleanse(a,1);
    DeltaruneVisuals.heal(u,B,a);
  });
  B.energy(u,9);B.emitTeam(u.team,'allyBasic',{unit:u,target:null});B.emitFoe(u.team,'enemyAction',u);
}
function ralseiDual(u,B,scale=1,free=false){
  const empowered=free||ralseiSpend(u,B,50);
  B.anim(u,'cast',1,'ralseiDual');
  DeltaruneVisuals.dual(u,B,empowered);
  ralseiAllies(u,B).forEach(a=>{
    const full=a.hp>=a.max.hp-1;
    B.heal(u,a,(a.max.hp*.30+u.st.mag*.6)*(empowered?1.45:1)*scale,{tag:'DualHeal',overheal:'shield'});
    B.applyStatus(u,a,'ralsei_dual_guard',8);
    if(full)B.energy(a,10,{resolvedAmount:true});
    if(empowered){B.cleanse(a,2);B.shield(u,a,a.max.hp*.20*scale,8);if(u._ralseiRed)B.energy(a,12*scale,{resolvedAmount:true});}
    if(u._ralseiRed)B.applyStatus(u,a,'ralsei_haste',8);
    DeltaruneVisuals.heal(u,B,a);
  });
}
function ralseiSpare(u,B,e){
  const off=B.offscreen;B.offscreen=true;
  try{B.kill(e,u);}finally{B.offscreen=off;}
  if(!off&&e.el){e.el.style.transition='opacity .42s ease';e.el.style.opacity='0';if(e.bar)e.bar.classList.add('gone');setTimeout(()=>{if(!e.alive&&e.el)e.el.style.display='none';},450);}
}
function ralseiPrayer(u,B,a){
  const miracle=(u._ralseiTP||0)>=100;
  if(miracle)ralseiSpend(u,B,35);
  B.anim(u,'cast',.72,'ralseiPrayer');
  const targets=miracle?ralseiLow(u,B).slice(0,2):[a];
  targets.forEach((target,i)=>{
    B.heal(u,target,u.st.mag*(miracle?(u._ralseiRed?1.9:1.6):(u._ralseiRed?1.5:1.2))*(i? .75:1),{tag:miracle?'Miracle Prayer':'Heal Prayer',overheal:'shield'});
    B.cleanse(target,1);B.applyStatus(u,target,'ralsei_kindness',8);
    if(miracle)B.applyStatus(u,target,'ralsei_prayer_guard',6);
    DeltaruneVisuals.prayer(u,B,target,miracle);
  });
  if(u._ralseiRed&&targets.length===1){const next=ralseiLow(u,B).find(x=>x!==a);if(next)B.applyStatus(u,next,'ralsei_kindness',6);}
}

defHero({
  id:'Ralsei',name:'Ralsei',folder:'Ralsei',file:'Ralsei',icon:'Ralsei',tier:'SS',role:'Support',roleLabel:'Support / Healer / Control',
  position:'Backline',element:'Deltarune',noVoice:true,eventOnly:true,nativeFace:1,
  blurb:'A gentle prince who protects the party, heals through danger, and can end a tired foe’s fight peacefully.',
  base:{hp:4050,atk:130,def:225,mag:465,mdef:330,spd:105,acc:190,eva:155},
  hidden:{range:335,aspd:.87,ms:72,aggro:.35,crit:.08,critDmg:1.4,healPow:1.2,shieldPow:1.15,cdr:.12,ccRes:.18,kbRes:.2,armorPen:0,magPen:0},
  growth:{hp:.092,atk:.035,def:.078,mag:.105,mdef:.09},
  move:{gait:'float',bob:3,freq:1.3,lean:2,squash:.01,idle:'sway',step:'step_soft',particles:'none',pcol:'#92e8b5',trail:{on:false},brake:.3},
  basic:{name:'Healing Spell',type:'magic',ratio:0,range:335,utility:true,perform:ralseiBasic,note:'Heals the ally with the lowest HP and builds Energy.'},
  skills:{
    W:{name:'DualHeal',type:'Healing / Support / Shield',energy:100,
      desc:()=>'<span class="sk-pas">Starts each wave with 25 TP. Healing an ally below half HP grants 5 TP. Basics heal the weakest ally.</span> Heal the whole team for 30% Max HP plus Skill Power, then give 20% Damage Reduction and 15% more healing received for 8s. At 50 TP, spend it to increase healing, cleanse two debuffs, and shield each ally for 20% Max HP. Allies already at full HP gain Energy. Red rarity also grants team Skill Haste.',
      passive(u,B){
        u._ralseiTP=0;
        ralseiGain(u,B,25);
        B.on(u,'waveStart',()=>{
          ralseiGain(u,B,25);
        });
        B.on(u,'healDone',ev=>{if(ev.amount>0&&ev.target?.alive&&(ev.target.hp-ev.amount)/ev.target.max.hp<.5)ralseiGain(u,B,5);});
      },
      cast(u,B){ralseiDual(u,B);}},
    G:{name:'Pacify',type:'Control / Support',cd:11,first:5,
      desc:()=> 'Make the highest-Attack foe Drowsy for 8s: Attack Speed -25%, Skill Haste -20%, damage -15%. Its next skill or attack against a FluffyGuard refreshes Drowsy and drains Energy. A Drowsy foe below 40% HP becomes TIRED. Cast again on a TIRED foe below 35% HP to spend 20 TP and spare an ordinary enemy, counting as a defeat. Bosses are Stunned, weakened, and drained instead. At Red rarity, affect two enemies, but spare only one per cast.',
      passive(u,B){
        B.every(u,.35,()=>ralseiFoes(u,B).forEach(e=>{if(e.hasStatus('ralsei_drowsy')&&e.hp/e.max.hp<.4)B.applyStatus(u,e,'ralsei_tired',10);}));
        B.on(u,'enemySkillStarting',ev=>{const e=ev.unit;if(!e?.hasStatus('ralsei_drowsy')||B.t<(e._ralseiDrowsyDrainAt||0))return;e._ralseiDrowsyDrainAt=B.t+2;B.applyStatus(u,e,'ralsei_drowsy',8);B.energy(e,-15,{resolvedAmount:true});});
        B.on(u,'allyDamaged',ev=>{const e=ev.src;if(!e?.hasStatus('ralsei_drowsy')||!ev.unit?.hasStatus('ralsei_fluffy')||B.t<(e._ralseiDrowsyDrainAt||0))return;e._ralseiDrowsyDrainAt=B.t+2;B.applyStatus(u,e,'ralsei_drowsy',8);B.energy(e,-12,{resolvedAmount:true});});
      },
      cast(u,B){
        const foes=ralseiFoes(u,B),ready=foes.filter(e=>e.hasStatus('ralsei_tired')&&e.hp/e.max.hp<.35).sort((a,b)=>a.hp-b.hp);
        const targets=ready.length&&u._ralseiTP>=20?[ready[0]]:foes.sort((a,b)=>b.st.atk-a.st.atk).slice(0,u._ralseiRed?2:1);
        B.anim(u,'cast',.8,'ralseiPacify');
        targets.forEach(e=>{
          if(e.hasStatus('ralsei_tired')&&e.hp/e.max.hp<.35&&ralseiSpend(u,B,20)){
            DeltaruneVisuals.pacify(u,B,e,true);
            if(e.isBoss||e.flags?.executeImmune||e.def?.executeImmune){
              B.damage(u,e,u.st.mag*1.8,{type:'magic',tag:'Pacify Boss',crit:false});
              B.applyStatus(u,e,'stun',3);
              B.applyStatus(u,e,'ralsei_boss_pacify',7);
              B.energy(e,-30,{resolvedAmount:true});
            }
            else {ralseiSpare(u,B,e);const a=ralseiLow(u,B)[0];if(a)B.heal(u,a,u.st.mag*.9,{tag:'Pacify'});ralseiGain(u,B,15);}
          }else {B.applyStatus(u,e,'ralsei_drowsy',8);DeltaruneVisuals.pacify(u,B,e,false);}
        });
        if(u._ralseiRed&&targets.length===1){const next=foes.filter(e=>e.alive&&e!==targets[0]).sort((a,b)=>b.st.atk-a.st.atk)[0];if(next){B.applyStatus(u,next,'ralsei_drowsy',8);DeltaruneVisuals.pacify(u,B,next,false);}}
      }},
    B:{name:'FluffyGuard',type:'Shield / Support / Control',cd:16,first:4,
      desc:()=> 'Place fluffy guards on the two most injured allies for 10s. Each blocks one damaging Skill or three Basic Attacks. Protected allies gain 20% Evasion and 15% Debuff Resistance. Blocking grants 10 TP and makes the attacker Drowsy; an unbroken guard heals its ally on expiry. At 75 TP, spend 15 TP for a third guard on Ralsei and 15% Skill Haste for guarded allies. Red rarity adds a Critical Hit protection layer and Energy when a guard breaks.',
      cast(u,B){
        const third=(u._ralseiTP||0)>=75&&ralseiSpend(u,B,15);
        const targets=ralseiLow(u,B).filter(a=>a!==u).slice(0,2);
        if(third||targets.length<2)targets.push(u);
        if(u.hasStatus('ralsei_prince')){const next=ralseiLow(u,B).find(a=>!targets.includes(a));if(next)targets.push(next);}
        B.anim(u,'cast',.8,'ralseiGuard');
        targets.forEach(a=>{const s=B.applyStatus(u,a,'ralsei_fluffy',10);if(s){s.ralseiCharges=3;s.ralseiCritLayer=false;}if(third)B.applyStatus(u,a,'ralsei_haste',10);DeltaruneVisuals.fluffy(u,B,a);});
      }},
    P:{name:'Heal Prayer',type:'Healing / Support / Survival',
      desc:()=> 'Once every 10s, automatically heal an ally who falls below half HP, cleanse one debuff, and grant Kindness: Armor, Magic Defense, and Energy generation +15% for 8s. Excess healing above 80% HP becomes a small Shield. Every allied Dodge grants 5 TP, with a shared 2s cooldown. At 100 TP, Miracle Prayer spends 35 TP to heal the two most injured allies and give 25% Damage Reduction for 6s.',
      passive(u,B){
        u._ralseiPrayerAt=-99;u._ralseiDodgeAt=-99;
        B.on(u,'allyDamageTaken',ev=>{const a=ev.unit;if(!u.alive||!a?.alive||a.minion||a.hp/a.max.hp>=.5||B.t-u._ralseiPrayerAt<(u.hasStatus('ralsei_prince')?5:10))return;u._ralseiPrayerAt=B.t;ralseiPrayer(u,B,a);});
        const hookDodges=()=>{
          ralseiAllies(u,B).forEach(a=>{
            if(!a._ralseiDodgeHooked){
              a._ralseiDodgeHooked=true;
              B.on(a,'dodged',()=>{if(!u.alive||B.t-u._ralseiDodgeAt<2)return;u._ralseiDodgeAt=B.t;ralseiGain(u,B,5);});
            }
          });
        };
        hookDodges();
        B.on(u,'waveStart',hookDodges);
        B.on(u,'healDone',ev=>{const a=ev.target;if(ev.amount>0&&a?.alive&&a.hp/a.max.hp>.8)B.shield(u,a,Math.min(ev.amount*.2,a.max.hp*.06),6);});
      }},
    R:{name:'ReviveSong',type:'Healing / Support / Control',
      p:{hpPct:8,magPct:10,guardDur:10},fixedP:['guardDur'],
      desc:()=> 'Improves DualHeal, Pacify, FluffyGuard, and Heal Prayer. Once per wave, ReviveSong rescues a defeated ally with 45% HP and a 25% Max-HP Shield; survivors heal 20% and lose one debuff. At 100 TP while two allies are below half HP, Prince of the Dark protects the team for 10s: Ralsei’s Basics heal two allies, Heal Prayer recovers twice as often, FluffyGuard covers an extra ally, and the team takes 25% less damage. It ends with a free half-strength DualHeal.',
      passive(u,B,S,P){
        u._ralseiRed=true;u._ralseiReviveUsed=false;u._ralseiPrinceUsed=false;
        u.flat.hpP_ralsei=P.hpPct/100;u.flat.magP_ralsei=P.magPct/100;u.dirty=true;
        B.on(u,'waveStart',()=>{
          u._ralseiReviveUsed=false;
          u._ralseiPrinceUsed=false;
        });
        B.on(u,'allyLethal',ev=>{
          const a=ev.unit;if(!u.alive||u._ralseiReviveUsed||!a||a.minion)return;
          u._ralseiReviveUsed=true;ev.prevented=true;a.hp=Math.max(1,a.max.hp*.45);B.shield(u,a,a.max.hp*.25,8);
          ralseiAllies(u,B).filter(x=>x!==a).forEach(x=>{B.heal(u,x,x.max.hp*.20,{tag:'ReviveSong'});B.cleanse(x,1);});
          ralseiGain(u,B,30);B.anim(u,'cast',1,'ralseiRevive');
          DeltaruneVisuals.revive(u,B,a);
        });
        B.every(u,.3,()=>{
          if(u._ralseiPrinceUsed||u._ralseiTP<100||ralseiAllies(u,B).filter(a=>a.hp/a.max.hp<.5).length<2)return;
          u._ralseiPrinceUsed=true;B.anim(u,'cast',1,'ralseiPrince');
          DeltaruneVisuals.prince(u,B);
          ralseiAllies(u,B).forEach(a=>B.applyStatus(u,a,'ralsei_prince',P.guardDur));
          ralseiFoes(u,B).filter(e=>e.hasStatus('ralsei_drowsy')).forEach(e=>{e.dirty=true;});
          B.after(P.guardDur,()=>{ralseiFoes(u,B).filter(e=>e.hasStatus('ralsei_drowsy')).forEach(e=>{e.dirty=true;});if(u.alive)ralseiDual(u,B,.5,true);});
        });
      }}
  }
});

SPECIAL_HERO_ART.Ralsei='assets/deltarune/ralsei-portrait.png';
SPECIAL_HERO_ICONS.Ralsei='assets/deltarune/ralsei-icon.png';
SKILL_HERO_ART.Ralsei={W:'assets/deltarune/ralsei-heal.png',G:'assets/deltarune/ralsei-pacify.png',B:'assets/deltarune/ralsei-guard.png',P:'assets/deltarune/ralsei-heal.png',R:'assets/deltarune/ralsei-revive.png'};
if(!HERO_IDS.includes('Ralsei'))HERO_IDS.push('Ralsei');
if(!PLAYABLE_IDS.includes('Ralsei'))PLAYABLE_IDS.push('Ralsei');
HERO_OBTAIN.Ralsei='Collab';
COLLAB_HERO_IDS.add('Ralsei');
