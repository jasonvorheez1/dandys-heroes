/* Tasque Manager — Flower Kingdom's opening recruit. */
'use strict';

STATUS.tasque_under = {icon:'⌘',name:'Under Management',kind:'debuff',desc:'Attack Speed and Skill Haste -15%. Tasque Manager can issue stronger orders to this enemy.',
  mods:m=>{m.aspdP-=.15;m.cdr-=.15;}};
STATUS.tasque_scared = {icon:'!',name:'Scared',kind:'debuff',desc:'Takes 20% more Magic Damage and deals 20% less Damage to Tasques.',
  onDamaged(a,s,ev){if(ev.type==='magic')ev.amount*=1.2;},
  onDealDamage(a,s,ev){if(ev.target?.owner?.id==='TasqueManager')ev.amount*=.8;}};
STATUS.tasque_disciplined = {icon:'▤',name:'Disciplined',kind:'debuff',desc:'Attack and Skill Haste -25% after Charm ends.',
  mods:m=>{m.atkP-=.25;m.cdr-=.25;}};
STATUS.tasque_commanded = {icon:'◆',name:'Good Little Tasque!',kind:'special',desc:'Charmed Basics hit teammates. Attack Speed +20%, Movement Speed +15%; teammate damage is 75%, or 110% at Red rarity.',
  mods:m=>{m.aspdP+=.2;m.msP+=.15;},
  onDealDamage(a,s,ev){if(ev.target?.team===a.team&&ev.target!==a)ev.amount*=s.src?._tasqueRed?1.1:.75;}};
STATUS.tasque_wrong = {icon:'✕',name:'Out of Order',kind:'debuff',desc:'Accuracy -25% after Alphabetical Order.',mods:m=>{m.accP-=.25;}};
STATUS.tasque_right = {icon:'✓',name:'Correct Answer',kind:'debuff',desc:'Energy generation -20%.',mods:m=>{m.energyGen-=.2;}};
STATUS.tasque_next_skill = {icon:'⚡',name:'Whip Warning',kind:'debuff',desc:'The next Skill deals 20% less Damage.',
  onDealDamage(a,s,ev,B){if(ev.basic||ev.dot||ev.target?.team===a.team)return;ev.amount*=.8;B.after(0,()=>{if(a.alive)B.removeStatus(a,'tasque_next_skill');});}};
STATUS.tasque_energy_seal = {icon:'⌁',name:'Static Interference',kind:'debuff',desc:'Energy generation -15%.',mods:m=>{m.energyGen-=.15;}};
STATUS.tasque_training = {icon:'⌘',name:'Whip Them Into Shape!',kind:'buff',desc:'Skill Haste +20% and a 25% chance to resist incoming debuffs.',mods:m=>{m.cdr+=.2;}};
STATUS.tasque_reassembled = {icon:'✦',name:'Reassembled',kind:'buff',desc:'Attack Speed +30%.',mods:m=>{m.aspdP+=.3;}};
STATUS.tasque_alphabet_haste = {icon:'A',name:'Alphabetical Advantage',kind:'buff',desc:'Skill Haste +20% after stunning at least two enemies. Tasques also attack 20% faster.',mods:(m,s,a)=>{m.cdr+=.2;if(a.minion&&a.owner?.id==='TasqueManager')m.aspdP+=.2;}};
STATUS.tasque_priority = {icon:'⚡',name:'Priority Override',kind:'buff',desc:'Takes 20% less Damage while attacking an enemy Under Management.',
  onDamaged(a,s,ev){if(a.target?.hasStatus('tasque_under'))ev.amount*=.8;}};
STATUS.tasque_compliance = {icon:'▥',name:'Forced Compliance',kind:'debuff',desc:'Skill Haste -35% for the duration of Forced Compliance.',mods:m=>{m.cdr-=.35;}};
STATUS.tasque_compliant_charm = {icon:'◆',name:'Priority Command',kind:'special',desc:'Charmed Attack Speed +30% during Forced Compliance.',mods:m=>{m.aspdP+=.3;}};
STATUS.tasque_covered = {icon:'◇',name:'Tasque Cover',kind:'buff',desc:'An active Tasque redirects 25% of Tasque Manager’s Damage to itself.',
  onDamaged(a,s,ev,B){
    if(ev.redirected||ev.amount<=0)return;
    const tasques=(a._tasques||[]).filter(t=>t.alive&&B.isTargetable(t));
    if(!tasques.length)return;
    const t=tasques.sort((x,y)=>B.distance(x,a)-B.distance(y,a))[0];
    const amount=ev.amount*.25;ev.amount-=amount;
    B.damage(ev.src||a,t,amount,{type:'true',redirected:true,noDodge:true,noCrit:true,skipOutgoing:true,silent:true,tag:'Tasque Cover'});
  }};

const tasqueFoes=(u,B)=>B.enemiesOf(u).filter(e=>e.alive&&B.isTargetable(e,u)&&!e.minion);
const tasquePets=u=>(u._tasques||[]).filter(t=>t.alive);
function summonTasque(u,B,index){
  const p=B.summon(u,{protoId:'TasqueCompanion',name:'Tasque '+(index+1),art:'assets/deltarune/tasque-companion.png',life:900,noSkills:true,noEnergy:true,scale:.65,
    hp:u.max.hp*(.45+(u._tasqueHpPct||0)),mag:u.st.mag*.48,atk:u.st.atk*.55,def:u.st.def*(u._tasqueRed?1.25:1),mdef:u.st.mdef*(u._tasqueRed?1.25:1),
    x:u.x+u.face*(108+index*34),depth:Math.max(.08,Math.min(.9,u.depth+(index?-.1:.1))),tint:'#65eef4'});
  p.baseStats.aggro=2.2;p.dirty=true;p.recompute(true);p.hp=p.max.hp;
  u._tasques.push(p);if(u._tasqueRed)B.applyStatus(u,p,'tasque_priority',999);
  return p;
}
function tasqueStrike(u,B,t,scale=1,chosen){
  if(!t?.alive||!u.alive)return;
  const pet=chosen?.alive?chosen:tasquePets(u).sort((a,b)=>B.distance(a,t)-B.distance(b,t))[0];
  if(!pet)return;
  B.blink(pet,t.x-pet.face*22,t.depth);
  B.anim(pet,'attack',.32);
  B.damage(pet,t,pet.st.mag*scale,{type:'magic',tag:'Tasque Strike'});
  B.applyStatus(u,t,'tasque_under',8);
  if(u._tasqueRed)B.applyStatus(u,t,'tasque_energy_seal',5);
  TasqueManagerVisuals.spark(B,t);
}
function tasqueCounter(u,B,e,force=false){
  if(!e?.alive||(!force&&!e.hasStatus('tasque_under')))return;
  const pet=tasquePets(u).sort((a,b)=>B.distance(a,e)-B.distance(b,e))[0];
  if(!pet)return;
  if(!force){
    if(B.t<(e._tasqueCounterAt||0))return;
    e._tasqueCounterAt=B.t+4;
  }
  tasqueStrike(u,B,e,.75);
  B.applyStatus(u,e,'tasque_next_skill',7);
}
function tasqueCharm(u,B,e,duration){
  if(!e?.alive)return;
  if(e.isBoss||e.flags?.ccImmune||e.hasStatus('charm')||e.hasStatus('charm_composure')){
    B.damage(u,e,u.st.mag*.85,{type:'magic',tag:'Good Little Tasque!'});
    B.energy(e,-20,{resolvedAmount:true});B.applyStatus(u,e,'silence',3);
    TasqueManagerVisuals.whip(B,u,e);
    return;
  }
  const extra=e.hasStatus('tasque_under')?2:0;
  const applied=typeof CharmTeam!=='undefined'?CharmTeam.apply(u,e,B,duration+extra):B.applyStatus(u,e,'charm',duration+extra);
  if(!applied||!e.hasStatus('charm')){
    B.damage(u,e,u.st.mag*.85,{type:'magic',tag:'Good Little Tasque!'});
    B.energy(e,-20,{resolvedAmount:true});B.applyStatus(u,e,'silence',3);
  }else{
    B.applyStatus(u,e,'tasque_commanded',duration+extra);
    if(u._tasqueCompliance)B.applyStatus(u,e,'tasque_compliant_charm',Math.max(.2,u._tasqueComplianceAt+8-B.t));
    u._tasqueCharms.add(e);
  }
  TasqueManagerVisuals.whip(B,u,e);
}
function tasqueAlphabet(u,B){
  const foes=tasqueFoes(u,B);if(!foes.length)return;
  const minX=Math.min(...foes.map(e=>e.x)),maxX=Math.max(...foes.map(e=>e.x));
  const width=Math.min(B.rightWall-B.leftWall,Math.max(220,maxX-minX+100));
  const left=Math.max(B.leftWall,Math.min((minX+maxX-width)/2,B.rightWall-width));
  const section=e=>Math.max(0,Math.min(3,Math.floor((e.x-left)/width*4)));
  const correct=section(foes.slice().sort((a,b)=>a.hp-b.hp)[0]);
  TasqueManagerVisuals.alphabet(B,left,width,correct);
  foes.forEach(e=>{
    if(!e.hasStatus('charm')&&!e.hasStatus('tasque_under'))return;
    const here=section(e),wrong=[0,1,2,3].filter(i=>i!==correct).sort((a,b)=>Math.abs(a-here)-Math.abs(b-here))[0];
    const center=left+width*(wrong+.5)/4;
    const shift=e.hasStatus('charm')?center-e.x:Math.max(-32,Math.min(32,center-e.x));
    e.x=Math.max(B.leftWall,Math.min(B.rightWall,e.x+shift));
  });
  B.after(.65,()=>{
    if(!u.alive)return;
    let stunned=0;const wrongTargets=[];
    foes.forEach(e=>{
      if(!e.alive)return;
      if(section(e)===correct){B.damage(u,e,u.st.mag*.38,{type:'magic',area:true,tag:'Alphabetical Order'});B.applyStatus(u,e,'tasque_right',7);}
      else{
        wrongTargets.push(e);
        B.damage(u,e,u.st.mag*1.12*(e.hasStatus('charm')?1.3:1),{type:'magic',area:true,tag:'Alphabetical Order'});
        const had=e.hasStatus('stun');B.applyStatus(u,e,'stun',.9);if(!had&&e.hasStatus('stun'))stunned++;
        B.applyStatus(u,e,'tasque_wrong',7);
        TasqueManagerVisuals.spark(B,e);
      }
    });
    if(stunned>=2){B.applyStatus(u,u,'tasque_alphabet_haste',7);tasquePets(u).forEach(p=>B.applyStatus(u,p,'tasque_alphabet_haste',7));}
    if(u._tasqueRed)B.after(.22,()=>wrongTargets.forEach(e=>{if(!e.alive)return;B.damage(u,e,u.st.mag*.48,{type:'magic',area:true,tag:'Alphabetical Order Encore'});if(e.hasStatus('stun'))B.energy(e,-14,{resolvedAmount:true});TasqueManagerVisuals.spark(B,e);}));
  });
}
function tasqueCompliance(u,B){
  if(u._tasqueComplianceUsed)return;
  u._tasqueComplianceUsed=true;u._tasqueCompliance=true;u._tasqueComplianceAt=B.t;
  const pets=tasquePets(u),foes=tasqueFoes(u,B);
  while(pets.length<2)pets.push(summonTasque(u,B,pets.length));
  pets.forEach((p,i)=>{
    B.heal(u,p,p.max.hp,{tag:'Forced Compliance'});
    if(foes.length)B.blink(p,i?Math.max(...foes.map(e=>e.x)):Math.min(...foes.map(e=>e.x)),foes[i%foes.length].depth);
  });
  foes.forEach(e=>B.applyStatus(u,e,'tasque_compliance',8));
  TasqueManagerVisuals.compliance(B,u);
  const pulse=()=>{
    if(!u.alive||!u._tasqueCompliance)return;
    tasqueFoes(u,B).forEach(e=>{
      B.damage(u,e,u.st.mag*.42,{type:'magic',area:true,tag:'Forced Compliance'});
      B.applyStatus(u,e,'tasque_under',8);
      B.applyStatus(u,e,'tasque_compliance',Math.max(.2,u._tasqueComplianceAt+8-B.t));
      if(e.hasStatus('charm'))B.applyStatus(u,e,'tasque_compliant_charm',Math.max(.2,u._tasqueComplianceAt+8-B.t));
      TasqueManagerVisuals.spark(B,e);
    });
    TasqueManagerVisuals.order(B,u);
  };
  pulse();for(let i=1;i<4;i++)B.after(i*2,pulse);
  B.after(8,()=>{
    u._tasqueCompliance=false;if(!u.alive)return;
    tasqueFoes(u,B).forEach(e=>{B.removeStatus(e,'tasque_compliance');B.removeStatus(e,'tasque_compliant_charm');});
    tasqueFoes(u,B).forEach(e=>{
      B.damage(u,e,u.st.mag*.95,{type:'magic',area:true,tag:'Forced Compliance Finale'});
      if(e.hasStatus('tasque_scared')||e.hasStatus('tasque_disciplined'))B.applyStatus(u,e,'stun',3);
    });
    TasqueManagerVisuals.compliance(B,u,true);
  });
}

Object.defineProperty(HEROES,'TasqueCompanion',{enumerable:false,configurable:true,value:{id:'TasqueCompanion',name:'Tasque',tier:'SS',role:'Damage',position:'Frontline',element:'Deltarune',noVoice:true,
  base:{hp:700,atk:75,def:150,mag:180,mdef:150,spd:118,acc:200,eva:155},
  hidden:{range:125,aspd:1.2,ms:115,aggro:2.2,crit:.05,critDmg:1.35,healPow:1,shieldPow:1,cdr:0,ccRes:.1,kbRes:.3,armorPen:0,magPen:.05},
  growth:{hp:0,atk:0,def:0,mag:0,mdef:0},move:{gait:'pounce',bob:3,freq:2,lean:4,squash:.02,idle:'sway',step:'step_soft'},
  basic:{name:'Tasque Strike',type:'magic',ratio:.9,range:125,wind:.18,pcol:'#55eaf1',hit:'hit_magic',onHit(p,t,B){
    const u=p.owner;if(!u?.alive)return;B.applyStatus(u,t,'tasque_under',8);if(u._tasqueRed)B.applyStatus(u,t,'tasque_energy_seal',5);TasqueManagerVisuals.spark(B,t);
  }},skills:{}}});

defHero({
  id:'TasqueManager',name:'Tasque Manager',folder:'TasqueManager',file:'TasqueManager',icon:'TasqueManager',tier:'SS',role:'Support',roleLabel:'Control / Support',position:'Backline',element:'Deltarune',noVoice:true,eventOnly:true,nativeFace:-1,
  blurb:'An exacting commander whose Tasques enforce every order. Charm, electric whips, and alphabetical traps turn enemy strength against itself.',
  base:{hp:4600,atk:165,def:250,mag:490,mdef:365,spd:112,acc:205,eva:175},
  hidden:{range:330,aspd:.9,ms:78,aggro:.35,crit:.08,critDmg:1.45,healPow:1,shieldPow:1.1,cdr:.12,ccRes:.2,kbRes:.2,armorPen:0,magPen:.08},
  growth:{hp:.095,atk:.04,def:.082,mag:.11,mdef:.09},
  move:{gait:'strut',bob:2,freq:1.4,lean:3,squash:.01,idle:'sway',step:'step_soft',particles:'sparkle',pcol:'#6ef7fb',trail:{on:false},brake:.3},
  basic:{name:'Electric Whip',type:'magic',ratio:.9,range:330,proj:'bolt',pcol:'#63f4ff',wind:.2,hit:'hit_magic',onHit(u,t,B){TasqueManagerVisuals.spark(B,t);}},
  skills:{
    W:{name:'Order, Order!',type:'Magic Damage / Control / Support',energy:100,v:{ratio:.68},
      desc:S=>`<span class="sk-pas">Begins each wave with two frontline Tasques, each with 45% of her Max HP. Their strikes apply Under Management for 8s: Attack Speed and Skill Haste -15%. A living Tasque redirects 25% of her incoming Damage to itself.</span> Order the Tasques to rush the two highest-Attack enemies, knocking them back. Three electrical waves deal <em>${pcn(S.ratio*100)}</em> Magic Damage each and apply Under Management. Already managed enemies are Scared for 6s, taking more Magic Damage and hurting Tasques less. Tasques recover 25% of missing HP afterward.`,
      passive(u,B){
        u._tasqueRed=u.rarity>=5;u._tasques=[];u._tasqueCharms=new Set();u._tasqueCompliance=false;u._tasqueComplianceUsed=false;u._tasqueSkillAttempts=new Set();
        for(let i=0;i<2;i++)summonTasque(u,B,i);
        B.applyStatus(u,u,'tasque_covered',999);
        B.every(u,.2,()=>{for(const e of [...u._tasqueCharms]){if(e.alive&&e.hasStatus('charm'))continue;u._tasqueCharms.delete(e);if(e.alive){B.removeStatus(e,'tasque_commanded');B.removeStatus(e,'tasque_compliant_charm');B.applyStatus(u,e,'tasque_disciplined',7);}}});
        B.on(u,'damageResolved',ev=>{
          const e=ev.src;if(!e||!u._tasqueCharms.has(e)||!e.hasStatus('charm')||ev.target?.team!==e.team||!ev.basic||ev.hpDamage<=0)return;
          const p=tasquePets(u).sort((a,b)=>B.distance(a,ev.target)-B.distance(b,ev.target))[0];if(!p)return;
          B.damage(p,ev.target,p.st.mag*.6,{type:'magic',tag:'Tasque Assist'});B.energy(ev.target,-10,{resolvedAmount:true});TasqueManagerVisuals.spark(B,ev.target);
        });
      },
      cast(u,B,S){
        B.anim(u,'cast',.9);TasqueManagerVisuals.order(B,u);
        const targets=tasqueFoes(u,B).sort((a,b)=>b.st.atk-a.st.atk).slice(0,2);
        targets.forEach((e,i)=>{const pet=tasquePets(u)[i];B.after(i*.15,()=>{if(!e.alive)return;tasqueStrike(u,B,e,1.25,pet);B.knockback(u,e,75);});});
        for(let i=0;i<3;i++)B.after(.24+i*.23,()=>{
          if(!u.alive)return;
          tasqueFoes(u,B).forEach(e=>{
            const managed=e.hasStatus('tasque_under');B.damage(u,e,u.st.mag*S.ratio*(1+(u._tasqueOrderPct||0)),{type:'magic',area:true,tag:'Order, Order!'});
            if(managed)B.applyStatus(u,e,'tasque_scared',6);
            B.applyStatus(u,e,'tasque_under',8);TasqueManagerVisuals.spark(B,e);
          });
        });
        B.after(1,()=>tasquePets(u).forEach(p=>B.heal(u,p,(p.max.hp-p.hp)*.25,{tag:'Order, Order!'})));
      }},
    G:{name:'Good Little Tasque!',type:'Charm / Magic Damage / Control',cd:9,first:2,
      desc:()=>`Charm the highest-Attack enemy for 5s, plus 2s if Under Management. Charmed Basics attack teammates at 75% Damage, with +20% Attack Speed and +15% Movement Speed. Each such hit calls a Tasque assist that drains Energy. Charm ends in 7s of Disciplined: Attack and Skill Haste -25%. Charm-immune enemies instead take Magic Damage, lose Energy, and are Silenced for 3s. Red rarity also targets the second-highest attacker with a shorter Charm.`,
      cast(u,B){const targets=tasqueFoes(u,B).sort((a,b)=>b.st.atk-a.st.atk).slice(0,u._tasqueRed?2:1);B.anim(u,'cast',.65);targets.forEach((e,i)=>tasqueCharm(u,B,e,i?3.5:5));}},
    B:{name:'Alphabetical Order',type:'Magic Damage / Control',cd:15,first:4,
      desc:()=>`Divide the enemy formation into A, B, C, and D. The lowest-HP enemy's section is correct. After a warning, wrong sections take Magic Damage, a brief Stun, and -25% Accuracy for 7s. The correct section takes reduced Damage and -20% Energy generation. Managed and Charmed enemies are pulled toward wrong sections; Charmed targets take extra Damage. Stunning two enemies grants Tasque Manager and her Tasques +20% Skill Haste for 7s. Red rarity adds a second wave and drains Stunned enemies' Energy.`,
      cast(u,B){B.anim(u,'cast',.9);tasqueAlphabet(u,B);}},
    P:{name:'Whip Them Into Shape!',type:'Control / Survival / Support',
      desc:()=>`Gain +20% Skill Haste and 25% Debuff Resistance. A managed enemy using a Skill triggers a Tasque counterattack that weakens its next Skill by 20% (once per enemy every 4s). Once per wave, each Tasque below 15% HP becomes untargetable for 2s, reassembles with 35% Max HP restored, and gains +30% Attack Speed for 6s. Attempts to Charm, Scare, or Silence Tasque Manager shield her and place the attacker Under Management.`,
      passive(u,B){
        B.applyStatus(u,u,'tasque_training',999);
        u.guards.push((id,d)=>d.kind==='debuff'&&Math.random()<.25);
        B.on(u,'enemySkillStarting',ev=>{if(!u._tasqueCompliance)tasqueCounter(u,B,ev.unit);});
        B.on(u,'allyDamageTaken',ev=>{
          const p=ev.unit;if(!p||p.owner!==u||p._tasqueReassembled||!p.alive||p.hp>p.max.hp*.15)return;
          p._tasqueReassembled=true;p.hp=Math.max(1,p.hp);B.applyStatus(u,p,'untargetable',2);
          TasqueManagerVisuals.reassemble(B,p);
          B.after(2,()=>{if(!p.alive)return;B.heal(u,p,p.max.hp*.35,{tag:'Tasque Reassembly'});B.applyStatus(u,p,'tasque_reassembled',6);if(u._tasqueRed)B.energy(u,20,{resolvedAmount:true});TasqueManagerVisuals.reassemble(B,p,true);});
        });
        let guardAt=-99;B.on(u,'statusDuration',ev=>{
          if(ev.unit!==u||!ev.src||ev.src.team===u.team||!['charm','fear','silence','tasque_scared','kh_scared'].includes(ev.id)||B.t-guardAt<3)return;
          guardAt=B.t+0.001;B.shield(u,u,u.max.hp*.15,6);if(ev.src?.alive)B.applyStatus(u,ev.src,'tasque_under',8);
        });
      }},
    R:{name:'Priority Override',type:'Magic Damage / Charm / Control / Support',p:{magPct:.12,hpPct:.1,tasqueHpPct:.15,orderPct:.18},
      desc:()=>`Tasques gain HP, defenses, Energy suppression, and protection while attacking managed enemies; reassembling restores Tasque Manager's Energy. Good Little Tasque! Charms two attackers and increases their teammate Damage. Alphabetical Order gains another wave and Energy drain. After three managed enemies attempt Skills, activate Forced Compliance once per wave for 8s: heal both Tasques, reduce enemy Skill Haste by 35%, strengthen Charmed attackers, counter every enemy Skill, and whip all enemies every 2s. It ends with a Magic shockwave that Stuns Scared or Disciplined enemies for 3s. Also gain Skill Power and Max HP.`,
      passive(u,B,S,P){
        u._tasqueRed=true;u._tasqueOrderPct=P.orderPct;u._tasqueHpPct=P.tasqueHpPct;u.flat.magP_tasque=P.magPct;u.flat.hpP_tasque=P.hpPct;u.dirty=true;
        tasquePets(u).forEach(p=>{p.baseStats.hp+=u.max.hp*P.tasqueHpPct;p.max.hp=p.baseStats.hp;p.hp=p.max.hp;p.dirty=true;});
        B.on(u,'enemySkillStarting',ev=>{
          const e=ev.unit;if(!e?.alive)return;
          if(u._tasqueCompliance){tasqueCounter(u,B,e,true);return;}
          if(!e.hasStatus('tasque_under'))return;
          u._tasqueSkillAttempts.add(e.uid);if(u._tasqueSkillAttempts.size>=3)tasqueCompliance(u,B);
        });
      }}
  }
});

SPECIAL_HERO_ART.TasqueManager='assets/deltarune/tasque-manager-portrait.png';
SPECIAL_HERO_ICONS.TasqueManager='assets/deltarune/tasque-manager-icon.png';
SKILL_HERO_ART.TasqueManager={W:'assets/deltarune/tasque-manager-portrait.png',G:'assets/deltarune/tasque-manager-icon.png',B:'assets/deltarune/tasque-manager-portrait.png',P:'assets/deltarune/tasque-companion.png',R:'assets/deltarune/tasque-manager-portrait.png'};
if(!HERO_IDS.includes('TasqueManager'))HERO_IDS.push('TasqueManager');
if(!PLAYABLE_IDS.includes('TasqueManager'))PLAYABLE_IDS.push('TasqueManager');
HERO_OBTAIN.TasqueManager='Collab';COLLAB_HERO_IDS.add('TasqueManager');
