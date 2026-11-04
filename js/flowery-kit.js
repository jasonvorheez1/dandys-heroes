/* Flowery — a Flower Kingdom recruit. The displayed 999s are a battle illusion. */
'use strict';

STATUS.flowery_max={icon:'✦',name:'Maximum Stats',kind:'buff',desc:'Attack Speed +25%, Evasion +20%, and Movement Speed +25%. The numbers above Flowery are an illusion.',mods:m=>{m.aspdP+=.25;m.evaP+=.20;m.msP+=.25;}};
STATUS.flowery_illusion={icon:'✿',name:'Illusory Shield',kind:'buff',desc:'Takes 20% less damage. Enemies perceive Flowery as a priority target while this shield lasts.',mods:m=>{m.dmgTaken-=.20;m.aggro+=3.8;}};
STATUS.flowery_confidence={icon:'★',name:'Confidence',kind:'buff',max:5,desc:'Attack +5% per stack, up to five stacks.',mods:(m,s)=>{m.atkP+=.05*s.stacks;}};
STATUS.flowery_offbalance={icon:'↘',name:'Off Balance',kind:'debuff',desc:'Accuracy -25% and Movement Speed -25%.',mods:m=>{m.accP-=.25;m.msP-=.25;}};
STATUS.flowery_thicket={icon:'♧',name:'Thicket of Thorns',kind:'debuff',desc:'Movement Speed -30% and Skill Haste -15%. Dashing through the vines causes damage and Root.',mods:m=>{m.msP-=.30;m.cdr-=.15;}};
STATUS.flowery_armor={icon:'✂',name:'Petal Cut',kind:'debuff',desc:'Armor -15%.',mods:m=>{m.defP-=.15;}};
STATUS.flowery_recruits={icon:'✿',name:'My RECRUITs!',kind:'buff',max:3,desc:'Skill Haste +10% per active recruit.',mods:(m,s)=>{m.cdr+=.10*s.stacks;}};
STATUS.flowery_omega={icon:'🌈',name:'Omega Flowery',kind:'buff',desc:'Attack +30%, Skill Power +30%, Skill Haste +25%, and damage taken -25%.',mods:m=>{m.atkP+=.30;m.magP+=.30;m.cdr+=.25;m.dmgTaken-=.25;}};
STATUS.flowery_omega_crit={icon:'✧',name:'Omega Confidence',kind:'buff',desc:'Critical Damage +30% while the Illusory Shield remains.',mods:m=>{m.critDmg+=.30;}};

const flowFoes=(u,B)=>B.enemiesOf(u).filter(e=>e.alive&&B.isTargetable(e,u));
const flowMark=(B,u,text,col='#ffe277')=>{if(!B.offscreen)B.fxFloatIcon(u.x,u.y-112,text,col);};
function flowExtend(u,B){const s=u.getStatus('flowery_max');if(s){s.t=Math.min(8,s.t+2);u.statusVersion++;}}
function flowShield(u,B,amount){
  const existing=u._flowShield;
  if(existing&&u.shields.includes(existing)){existing.amt=Math.min(u.max.hp*.3,existing.amt+amount);existing.t=Math.max(existing.t,8);return;}
  B.shield(u,u,amount,999,{resolvedAmount:true,onBreak:()=>{
    if(!u.alive)return;
    u._flowLastShield=u._flowShield;
    u._flowShield=null;B.removeStatus(u,'flowery_illusion');B.removeStatus(u,'flowery_omega_crit');
    flowFoes(u,B).filter(e=>B.distance(u,e)<190).forEach(e=>{B.damage(u,e,u.st.mag*.72,{type:'magic',area:true,tag:'Petal Burst'});B.applyStatus(u,e,'blind',4);});
    FloweryVisuals.petals(B,u);if(!u._flowOmega)FloweryVisuals.voice(B,'just_kidding',{vol:.72});
    flowMark(B,u,'PETAL BURST','#ff9ad5');
  }});
  u._flowShield=u.shields[u.shields.length-1];
  if(u._flowShield){B.applyStatus(u,u,'flowery_illusion',999);if(u._flowRed)B.applyStatus(u,u,'flowery_omega_crit',999);}
}
function flowCharge(u,B,e,ratio=1,copy=false){
  if(!u.alive||!e?.alive||!B.isTargetable(e,u))return;
  const oldX=u.x,oldDepth=u.depth;
  if(!copy){B.blink(u,e.x-u.face*24,e.depth);u._flowCharges=(u._flowCharges||0)+1;B.anim(u,'attack',.36,'floweryJarona');}
  FloweryVisuals.charge(u,B,e,copy);
  const hit=B.damage(u,e,u.st.atk*ratio*(1+(u._flowJaronaPct||0)),{type:'physical',tag:copy?'JARONA Copy':'JARONA!'});
  if(hit?.amount>0){B.interrupt(e,u);if(!copy)B.knockback(u,e,76);else B.applyStatus(u,e,'flowery_offbalance',6);}
  if(!B.offscreen){B.fxSlash(u,e,{col:copy?'#bdb7ff':'#ffe879',ang:copy?-26:18});if(!copy)flowMark(B,e,'JARONA!');}
  if(!copy)B.after(.2,()=>{if(u.alive)B.blink(u,oldX,oldDepth);});
  flowTryOmega(u,B);
}
function flowTryOmega(u,B){
  if(!u._flowRed||u._flowOmegaUsed||!u.alive||u._flowCharges<4||u._flowSummoned<2)return;
  u._flowOmegaUsed=true;u._flowOmega=true;B.applyStatus(u,u,'flowery_omega',10);B.anim(u,'cast',.9,'floweryOmega');FloweryVisuals.omega(u,B);FloweryVisuals.voice(B,'omega',{vol:1,priority:true});flowMark(B,u,'OMEGA FLOWERY','#fb91ff');
  B.after(10,()=>{
    if(!u.alive||!u._flowOmega)return;
    u._flowOmega=false;B.removeStatus(u,'flowery_omega');
    FloweryVisuals.voice(B,'last_jarona',{vol:1,priority:true});
    flowFoes(u,B).forEach((e,i)=>B.after(i*.08,()=>{if(!u.alive||!e.alive)return;FloweryVisuals.charge(u,B,e);B.damage(u,e,u.st.atk*1.45,{type:'physical',area:true,tag:'Omega JARONA Finale'});B.applyStatus(u,e,'stun',.8);}));
    B.anim(u,'attack',.8,'floweryJarona');flowMark(B,u,'FINAL JARONA!');
  });
  const flowers=['Aqua','Seth','Yellow','Blue','Green','Orange'];
  flowers.forEach((who,pulse)=>B.after(pulse*2,()=>{
    if(!u.alive||!u._flowOmega)return;
    const foes=flowFoes(u,B);if(!foes.length)return;
    const highest=foes.slice().sort((a,b)=>b.st.atk-a.st.atk)[0];
    const lowest=foes.slice().sort((a,b)=>a.hp-b.hp)[0];
    const color={Aqua:'#8be7ff',Seth:'#eb9dff',Yellow:'#ffe55e',Blue:'#88a7ff',Green:'#8bea97',Orange:'#ffae67'}[who];
    if(who==='Aqua')foes.slice(0,3).forEach(e=>{B.damage(u,e,u.st.mag*.62,{type:'magic',tag:'Aqua Flower'});FloweryVisuals.flower(B,e,color);});
    if(who==='Seth'){B.damage(u,highest,u.st.atk*1.05,{type:'physical',tag:'Seth Flower'});FloweryVisuals.flower(B,highest,color);}
    if(who==='Yellow'){B.damage(u,lowest,u.st.atk*.85,{type:'physical',tag:'Yellow Flower'});FloweryVisuals.flower(B,lowest,color);}
    if(who==='Blue')foes.filter(e=>B.distance(u,e)<220).forEach(e=>{B.damage(u,e,u.st.mag*.5,{type:'magic',tag:'Blue Flower'});B.knockback(u,e,95);FloweryVisuals.flower(B,e,color);});
    if(who==='Green'){B.heal(u,u,u.max.hp*.08,{tag:'Green Flower'});FloweryVisuals.flower(B,u,color);}
    if(who==='Orange'){B.damage(u,highest,u.st.atk*1.3,{type:'physical',tag:'Orange Flower'});B.applyStatus(u,highest,'stun',.6);FloweryVisuals.flower(B,highest,color);}
    flowMark(B,u,who.toUpperCase()+'!',color);
  }));
}
function flowRecruit(u,B,name){
  if(!u.alive)return;
  const foes=flowFoes(u,B);if(!foes.length)return;
  const aliveBefore=new Set(foes);
  let focus=foes[0];
  if(name==='Floradinn')foes.filter(e=>B.distance(u,e)<260).slice(0,3).forEach(e=>{B.damage(u,e,u.st.atk*.68,{type:'physical',area:true,tag:'Floradinn Sweep'});B.applyStatus(u,e,'flowery_armor',5);});
  if(name==='Sheary'){const e=foes.sort((a,b)=>b.st.mag-a.st.mag)[0];focus=e;B.damage(u,e,u.st.atk*.75,{type:'physical',tag:'Sheary Cut'});if(e.casting){B.interrupt(e,u);flowExtend(u,B);}}
  if(name==='Leafling'){foes.slice(0,3).forEach(e=>B.applyStatus(u,e,'blind',4));flowShield(u,B,u.max.hp*.05);}
  if(name==='Shinobeetle'){const e=foes.sort((a,b)=>a.hp-b.hp)[0];focus=e;B.damage(u,e,u.st.atk*.70,{type:'physical',tag:'Shinobeetle Rush'});B.applyStatus(u,e,'stun',.7);}
  [...aliveBefore].filter(e=>!e.alive).forEach(()=>flowExtend(u,B));
  FloweryVisuals.recruit(u,B,name,focus);
}

defHero({
  id:'Flowery',name:'Flowery',folder:'Flowery',file:'Flowery',icon:'Flowery',tier:'S',role:'Damage',roleLabel:'Damage / Control',position:'Midline',element:'Deltarune',eventOnly:true,nativeFace:1,
  blurb:'A loud, golden-haired fighter whose impossible numbers draw enemy eyes. His rushes, recruits, and borrowed flower power make for a dangerous finale.',
  base:{hp:4500,atk:355,def:230,mag:300,mdef:235,spd:122,acc:220,eva:175},
  hidden:{range:165,aspd:1.1,ms:91,aggro:.9,crit:.15,critDmg:1.6,healPow:1,shieldPow:1,cdr:.08,ccRes:.12,kbRes:.2,armorPen:.05,magPen:.04},
  growth:{hp:.085,atk:.10,def:.075,mag:.09,mdef:.075},
  move:{gait:'strut',bob:4,freq:1.6,lean:5,squash:.02,idle:'sway',step:'step_soft',particles:'sparkle',pcol:'#ffdd67',trail:{on:true,col:'#ffbde5',rate:.15},brake:.3},
  basic:{name:'Petal Jab',type:'physical',ratio:.94,range:165,wind:.17,fastWind:true,pcol:'#ffe67c',hit:'hit_slash',
    note:'The first Basic Attack during Maximum Stats becomes a JARONA charge. Omega Basics alternate between charges and flower projectiles.',
    onStart(u,B,t){u._flowBasicCharge=false;u._flowProjectile=false;if(u._flowOmega){u._flowNextBasicCharge=!u._flowNextBasicCharge;u._flowBasicCharge=u._flowNextBasicCharge;u._flowProjectile=!u._flowBasicCharge;}else if(u.hasStatus('flowery_max')&&u._flowFirst){u._flowFirst=false;u._flowBasicCharge=true;}if(u._flowBasicCharge)B.dash(u,t.x-u.face*25,.18,{depth:t.depth});u._flowBasicVoice=(u._flowBasicVoice||0)+1;if(!u._flowOmega&&u._flowBasicVoice%4===1)FloweryVisuals.voice(B,u._flowBasicVoice%8===1?'hah':'hoo',{vol:.52,throttle:1800});},
    onHit(u,t,B){if(u._flowBasicCharge){u._flowBasicCharge=false;u._flowCharges++;FloweryVisuals.charge(u,B,t);B.knockback(u,t,70);B.interrupt(t,u);flowTryOmega(u,B);}if(u._flowProjectile){u._flowProjectile=false;B.damage(u,t,u.st.mag*.55,{type:'magic',basic:true,tag:'Omega Petal'});FloweryVisuals.flower(B,t,'#ff91df');}}
  },
  skills:{
    W:{name:'JARONA!',type:'Physical Damage / Control',energy:100,v:{ratio:1.05,copy:.43},
      desc:(S)=>`<span class="sk-pas">Each wave begins with Maximum Stats for 8s: Attack Speed +25%, Evasion +20%, and faster movement. The first Basic Attack charges and Knocks Back.</span> Rush the three highest-Attack enemies, dealing <em>${pcn(S.ratio*100)}</em> Physical Damage and interrupting them. Four copies hit other targets for reduced damage and apply Off Balance for 6s. With Maximum Stats, the final rush fans out Magic projectiles. Omega adds one copy and cuts Armor.`,
      passive(u,B){u._flowFirst=true;u._flowCharges=0;u._flowSummoned=0;u._flowOmegaUsed=false;u._flowOmega=false;u._flowNextBasicCharge=false;u._flowThicket=null;u._flowLastShield=null;B.applyStatus(u,u,'flowery_max',8);},
      cast(u,B,S){const foes=flowFoes(u,B).sort((a,b)=>b.st.atk-a.st.atk);if(!foes.length)return;const maximum=u.hasStatus('flowery_max');const picked=foes.slice(0,3);u._flowJaronaLine=(u._flowJaronaLine||0)+1;FloweryVisuals.voice(B,u._flowJaronaLine===1?'my_jarona':'jarona'+(1+(u._flowJaronaLine-2)%4),{vol:.9,priority:true});
        picked.forEach((e,i)=>B.after(i*.20,()=>{if(u.alive)flowCharge(u,B,e,S.ratio);if(i===picked.length-1&&u.alive){if(u._flowRed&&e.alive)B.applyStatus(u,e,'flowery_armor',6);if(maximum)flowFoes(u,B).filter(x=>B.distance(e,x)<180).forEach(x=>B.damage(u,x,u.st.mag*.48,{type:'magic',area:true,tag:'JARONA Petals'}));}}));
        B.after(picked.length*.20+.12,()=>{if(!u.alive)return;const copyTargets=flowFoes(u,B).filter(e=>!picked.includes(e));const pool=copyTargets.length?copyTargets:flowFoes(u,B);for(let i=0;i<(u._flowRed?5:4);i++){const e=pool[i%pool.length];if(e){flowCharge(u,B,e,S.copy,true);if(u._flowRed)B.applyStatus(u,e,'flowery_armor',6);}}});
      }},
    G:{name:'Thicket of Thorns',type:'Magic Damage / Control',cd:14,first:3,v:{ratio:.95},
      desc:(S)=>`Send bamboo and thorns across the enemy formation for <em>${pcn(S.ratio*100)}</em> Magic Damage and Knockback. Vines linger on struck enemies for 7s, slowing Movement by 30% and Skill Haste by 15%. Dashing through them causes damage and Root; Knockback into them restores Flowery’s Energy. Omega widens the strike and drains Energy.`,
      cast(u,B,S){const foes=flowFoes(u,B).sort((a,b)=>a.x-b.x);if(!foes.length)return;B.anim(u,'cast',.7,'floweryThorns');FloweryVisuals.voice(B,'leaf_it',{vol:.78});const spread=u._flowRed?135:70;u._flowThicket={min:foes[0].x-spread,max:foes[foes.length-1].x+spread,until:B.t+7};FloweryVisuals.thicket(u,B,u._flowThicket);foes.forEach((e,i)=>B.after(i*.1,()=>{if(!u.alive||!e.alive)return;B.damage(u,e,u.st.mag*S.ratio,{type:'magic',area:true,tag:'Thicket of Thorns'});B.applyStatus(u,e,'flowery_thicket',7);B.knockback(u,e,85);if(u._flowRed)B.energy(e,-12,{resolvedAmount:true});if(!B.offscreen)FX.burst(e.x,e.y-40,8,'#79d671',{spMax:90});}));}
    },
    B:{name:'My RECRUITs!',type:'Physical / Magic / Support',cd:18,first:5,
      desc:()=>`Call two random Flower Kingdom recruits for 9s; three at Red rarity. Each attacks twice. Floradinn sweeps and cuts Armor; Sheary targets Skill Power and interrupts; Leafling blinds foes and shields Flowery; Shinobeetle rushes the weakest foe and Stuns. Each active recruit grants 10% Skill Haste. An interrupt or defeat extends Maximum Stats by up to 2s.`,
      cast(u,B){const names=['Floradinn','Sheary','Leafling','Shinobeetle'].sort(()=>Math.random()-.5).slice(0,u._flowRed?3:2);u._flowSummoned+=names.length;B.anim(u,'cast',.8,'floweryRecruit');FloweryVisuals.voice(B,'hey_guys',{vol:.8});
        const active=B.applyStatus(u,u,'flowery_recruits',9);if(active){active.stacks=names.length;u.statusVersion++;u.dirty=true;}
        names.forEach((name,i)=>{B.after(.35+i*.14,()=>flowRecruit(u,B,name));B.after(4.5+i*.14,()=>flowRecruit(u,B,name));});
        B.after(9,()=>{if(u.alive)B.removeStatus(u,'flowery_recruits');});flowTryOmega(u,B);
      }},
    P:{name:'999 in Everything!',type:'Survival / Control / Damage',
      desc:()=>`Starts each wave with an Illusory Shield equal to 30% Max HP. While it lasts, Flowery draws more single-target attacks and takes 20% less damage. Shield hits grant Confidence: Attack +5% for 8s, up to five stacks. Its break bursts into Magic petals and lowers nearby Accuracy. Once every 15s, a Dodge restores part of the shield. The displayed 999s are not real stats.`,
      passive(u,B){u._flowDodgeAt=-99;flowShield(u,B,u.max.hp*.30);B.on(u,'shieldAbsorbed',ev=>{if(ev.shield!==u._flowShield&&ev.shield!==u._flowLastShield)return;B.applyStatus(u,u,'flowery_confidence',8,{stacks:1});});
        B.on(u,'dodged',()=>{if(!u.alive||B.t-u._flowDodgeAt<15)return;u._flowDodgeAt=B.t;flowShield(u,B,u.max.hp*.10);});
        flowFoes(u,B).forEach(e=>B.on(e,'knockedBack',()=>{if(!u.alive||!e.alive||!e.hasStatus('flowery_thicket'))return;B.damage(u,e,u.st.mag*.35,{type:'magic',tag:'Thicket Collision'});B.energy(u,5,{resolvedAmount:true});}));
        B.every(u,.2,()=>{flowFoes(u,B).forEach(e=>{const zone=u._flowThicket,inside=zone&&B.t<zone.until&&e.x>=zone.min&&e.x<=zone.max;if(inside&&!e.hasStatus('flowery_thicket'))B.applyStatus(u,e,'flowery_thicket',Math.max(.2,zone.until-B.t));const trapped=e.hasStatus('flowery_thicket');if(e.el)e.el.classList.toggle('flowery-thicket-trapped',trapped);if(!trapped||!e.dashUntil||e.dashUntil<=B.t||e._flowDashSeen===e.dashUntil)return;e._flowDashSeen=e.dashUntil;B.damage(u,e,u.st.mag*.45,{type:'magic',tag:'Thicket Dash'});B.applyStatus(u,e,'root',.8);});if(u.el){let tag=u.el.querySelector('.flowery-fake-stats');if(!tag){tag=document.createElement('div');tag.className='flowery-fake-stats';tag.innerHTML='<b>MAXIMUM STATS ✦</b><span>LV 99 · HP 999 · ATK 99</span><span>DEF 99 · MAG 99 · GUTS ★★★★★</span>';tag.style.bottom=(u.bodyW*1.32+u.plate+34)+'px';u.el.appendChild(tag);}tag.hidden=!u.hasStatus('flowery_max');u.el.classList.toggle('flowery-omega-active',!!u._flowOmega);}});
      }},
    R:{name:'OMEGA FLOWERY',type:'Physical / Magic / Control',p:{atkPct:10,hpPct:8,evaPct:8,jaronaPct:15},
      desc:()=>`JARONA gains a fifth copy and cuts Armor; the Thicket grows stronger and drains Energy; My RECRUITs! calls three allies. The Illusory Shield adds Critical Damage. Once per wave, after four real JARONA charges and two recruits, Flowery borrows the six Colored Flowers for 10s. Omega gains Attack, Skill Power, Damage Reduction, and Skill Haste; each flower attacks in turn. He finishes with a teamwide JARONA charge and brief Stun.`,
      passive(u,B,S,P){u._flowRed=true;u._flowJaronaPct=P.jaronaPct/100;u.flat.atkP_flowery=P.atkPct/100;u.flat.hpP_flowery=P.hpPct/100;u.flat.evaP_flowery=P.evaPct/100;u.dirty=true;if(u._flowShield)B.applyStatus(u,u,'flowery_omega_crit',999);}
    }
  }
});

SPECIAL_HERO_ART.Flowery='assets/deltarune/flowery-idle.png';
SPECIAL_HERO_ICONS.Flowery='assets/deltarune/flowery-idle.png';
SKILL_HERO_ART.Flowery={W:'assets/deltarune/flowery-attack.png',G:'assets/deltarune/flowery-idle.png',B:'assets/deltarune/flowery-idle.png',P:'assets/deltarune/flowery-idle.png',R:'assets/deltarune/flowery-omega-card.png'};
if(!HERO_IDS.includes('Flowery'))HERO_IDS.push('Flowery');
if(!PLAYABLE_IDS.includes('Flowery'))PLAYABLE_IDS.push('Flowery');
HERO_OBTAIN.Flowery='Collab';COLLAB_HERO_IDS.add('Flowery');

(() => {
  const src='assets/deltarune/flowery-battle.png';
  const clip=(row,n,fps=8,once=false)=>({src,cols:8,rows:8,cellW:96,cellH:96,baseW:96,bodyScale:1.08,groundY:96,frames:Array.from({length:n},(_,i)=>row*8+i),fps,once});
  const omegaSrc='assets/deltarune/flowery-omega-battle.png';
  const omegaClip=(row,fps=8,once=false)=>({src:omegaSrc,cols:3,rows:4,cellW:160,cellH:160,baseW:160,bodyScale:1.42,groundY:160,frames:[row*3,row*3+1,row*3+2],fps,once});
  const atlas={idle:clip(0,5,5),move:clip(1,4,10),attack:clip(2,5,12,true),cast:clip(3,3,8,true),omegaIdle:omegaClip(0,6),omegaAttack:omegaClip(1,12,true),omegaCast:omegaClip(2,10,true),omegaPunch:omegaClip(3,10,true)};
  const previous=Art.collabAtlases;Art.collabAtlases=function(id){return id==='Flowery'?atlas:previous.apply(this,arguments);};
  const prevSprite=Battle.prototype.setNaturalSprite;
  Battle.prototype.setNaturalSprite=function(u,name,phase){
    if(u?.id==='Flowery'){
      if(u._flowOmega)name=name==='attack'?'omegaAttack':name==='cast'?'omegaCast':'omegaIdle';
      // Idle and walking art face right; attack, cast, and Omega art face left.
      u.skinNativeFace=name==='idle'||name==='move'?1:-1;
    }
    return prevSprite.call(this,u,name,phase);
  };
})();
