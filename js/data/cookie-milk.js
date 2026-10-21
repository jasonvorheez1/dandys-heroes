/* Shadow Milk Cookie's five-act kit. Loaded after his hero definition. */
'use strict';

Object.assign(STATUS, {
 cookie_eye_truth:{icon:'👁',name:'Eye of Truth',kind:'special',desc:'Five debuffs trigger a team cleanse, a Shield, and bonus Magic Damage.'},
 cookie_eye_deceit:{icon:'👁',name:'Eye of Deceit',kind:'special',desc:'Attacks the most charged enemy and extends Taint.'},
 cookie_truth_power:{icon:'✦',name:'Truth Uncovered',kind:'buff',desc:'Magic Damage increased for eight seconds.',mods:m=>{m.magP+=.18;}},
 cookie_puppet_show:{icon:'🎭',name:'Puppet Show',kind:'debuff',cc:true,desc:'Shackled inside Shadow Milk Cookie’s show.',flags:{noAct:true,noMove:true}},
 cookie_taint:{icon:'🖤',name:'Taint',kind:'debuff',desc:'Magic Defense and healing received reduced.',mods:m=>{m.mdefP-=.25;m.healRecv-=.35;}},
 cookie_stage_guard:{icon:'🎭',name:'On Stage',kind:'buff',desc:'Damage reduced and interruptions prevented during Puppet Show.',flags:{ccImmune:true},mods:m=>{m.dmgTaken-=.30;}},
 cookie_deceived:{icon:'🪞',name:'Deceived',kind:'debuff',desc:'Accuracy reduced; Basic Attacks may strike an illusion.',mods:m=>{m.accP-=.25;}},
 cookie_misled:{icon:'🪞',name:'Lost the Plot',kind:'debuff',desc:'Damage reduced after missing an attack.',mods:m=>{m.dmgDealt-=.18;}},
 cookie_stringbound:{icon:'🧵',name:'Stringbound',kind:'debuff',cc:true,desc:'Cannot move; Attack Speed and Skill Haste reduced.',flags:{noMove:true},mods:(m,s)=>{m.aspdP-=s.val||.25;m.cdr-=s.val||.25;},onExpire:(target,s,B)=>{
  const caster=s.src;if(!target.alive||!caster||!caster.alive)return;
  const strength=(s.val||.25)/.25;
  B.alliesOf(target).filter(e=>e.alive&&(e===target||B.distance(e,target)<140)).forEach(e=>B.damage(caster,e,caster.st.mag*(e===target?.9:.45)*strength,{type:'magic',area:true,tag:'Snapped Strings'}));
 }},
 cookie_shadow_power:{icon:'🌘',name:'Power of Deceit',kind:'buff',desc:'Max HP, Magic Damage, and Damage Reduction increased after Shadow Form.',mods:m=>{m.hpP+=.16;m.magP+=.20;m.dmgTaken-=.18;}},
 cookie_return_haste:{icon:'⏳',name:'Encore Tempo',kind:'buff',desc:'Skill Haste increased after Shadow Form.',mods:(m,s)=>{m.cdr+=s.val||.25;}},
 cookie_curtain:{icon:'🧵',name:'Curtain Call',kind:'debuff',desc:'Accuracy and Skill Haste reduced.',mods:m=>{m.accP-=.22;m.cdr-=.25;}}
});

function milkFoes(u,B){return B.enemiesOf(u).filter(e=>B.isTargetable(e)&&!e._cookieSoulPhantom);}
function milkAllies(u,B){return B.alliesOf(u).filter(a=>a.alive);}
function milkHit(u,B,t,ratio,tag,opt){return B.damage(u,t,u.st.mag*ratio,Object.assign({type:'magic',tag},opt||{}));}
function milkPrimary(u,B){return milkFoes(u,B).sort((a,b)=>a.max.hp-b.max.hp)[0];}
function milkEffect(B,u,label){if(!B.offscreen)B.fxFloatIcon(u.x,u.y-110,label,'#9ceaff');}
function milkRedirectBasic(attacker,intended,B){
 if(attacker._cookieRedirectNext){
  attacker._cookieRedirectNext=false;
  return B.alliesOf(attacker).find(a=>a!==attacker&&a.alive&&!a.minion)
   ||(attacker._cookieIllusions||[]).find(m=>m.alive)||intended;
 }
 if(!attacker.hasStatus('cookie_deceived')||Math.random()>=.48)return intended;
 return (attacker._cookieIllusions||[]).find(m=>m.alive)||intended;
}

function milkSoulPhantom(u,B,show,fallen){
 if(show.phantom||!u.alive||B.t>=show.until)return;
 const phantom=B.summon(u,{team:fallen.team,protoId:'ShadowMilkCookie',name:'Soul Phantom',art:ASSET+'uploads/shadow_milk_effectmarionette.png',hp:Math.max(1,fallen.max.hp*.50),mag:0,atk:0,scale:.58,life:Math.max(.2,show.until-B.t),noSkills:true,noEnergy:true,tint:'#83dcff',x:fallen.x,depth:fallen.depth});
 phantom.x=fallen.x;phantom.depth=fallen.depth;phantom.y=fallen.y;phantom.def=Object.assign({},phantom.def,{noDamage:true});phantom.inherit=true;phantom._cookieSoulPhantom=true;
 show.phantom=phantom;show.phantomDamage=0;
 B.on(phantom,'damaged',ev=>{show.phantomDamage=Math.min(fallen.max.hp*.25,show.phantomDamage+Math.max(0,ev.amount||0));});
 B.on(phantom,'lethal',ev=>{ev.prevented=true;phantom.hp=1;});
 milkEffect(B,u,'SOUL PHANTOM');
}
function milkGrandFinale(u,B,show){
 if(!u.alive||show.done)return;show.done=true;
 const primaryWasAlive=show.primary&&show.primary.alive;
 const foes=milkFoes(u,B);foes.forEach(e=>{
  milkHit(u,B,e,show.finale||1.65,'Grand Finale',{area:true,noDodge:true});
  if(e.alive)B.applyStatus(u,e,'cookie_taint',show.taint||8);
 });
 const survivingFoes=milkFoes(u,B).sort((a,b)=>a.hp-b.hp);
 if(show.primary&&show.primary.alive){
  B.damage(u,show.primary,Math.min(show.primary.max.hp*.055,u.st.mag*(show.trueCap||3.2)),{type:'true',noDodge:true,tag:'Grand Finale'});
 }else if(primaryWasAlive){
  const target=survivingFoes[0];
  if(target)B.damage(u,target,Math.min(show.primary.max.hp*.055,u.st.mag*(show.trueCap||3.2)),{type:'true',noDodge:true,tag:'Grand Finale'});
 }else if(show.phantomDamage>0){
  const target=survivingFoes[0];
  if(target)B.damage(u,target,Math.min(show.phantomDamage,u.st.mag*(show.trueCap||3.2)),{type:'true',noDodge:true,tag:'Soul Phantom Finale'});
 }
 if(show.phantom&&show.phantom.alive)B.kill(show.phantom);
 B.removeStatus(u,'cookie_stage_guard');
 B.fxRing(u.x,u.y-55,290,'#82dfff',.55);
 Sound.play('cookie_darkmagic_spread',{vol:.72});
 u._cookieFinales=(u._cookieFinales||0)+1;
 if(u.rarity>=5&&u._cookieFinales>=2&&!u._cookieCurtainUsed)milkCurtainCall(u,B);
}
function milkPuppetShow(u,B,target,ratio,show){
 if(!target||!target.alive)return;
 B.fxRing(target.x,target.y-42,145,'#80d8ef',.55);milkEffect(B,target,'PUPPET');
 const control=target.isBoss?1.5:show.duration;
 B.applyStatus(u,target,'cookie_puppet_show',control,{unresistable:true});
 B.applyStatus(u,target,'curse',control);
 const isPrimary=(target===show.primary);
 for(let n=1;n<=Math.ceil(show.duration/.5);n++)B.after(n*.5,()=>{
  const active=(target&&target.alive)?target:(isPrimary&&show.phantom&&show.phantom.alive?show.phantom:null);
  if(!u.alive||show.done||!active)return;
  milkHit(u,B,active,.12*ratio,'Puppet Show',{dot:true,noDodge:true});
  milkFoes(u,B).filter(e=>e!==active&&B.distance(e,active)<155).forEach(e=>milkHit(u,B,e,.055*ratio,'Puppet Show Splash',{area:true,dot:true}));
 });
}
function milkCurtainCall(u,B){
 u._cookieCurtainUsed=true;u._cookieCurtainActive=true;
 if(!B.offscreen){
  const host=typeof $==='function'?$('#fxFront'):null;
  if(host){
   const veil=el('div','cookie-curtain-veil');host.appendChild(veil);
   B.after(4.2,()=>veil.remove());setTimeout(()=>veil.remove(),5000);
  }
 }
 milkEffect(B,u,'CURTAIN CALL');
 B.fxRing(u.x,u.y-60,340,'#6550bb',.8);
 milkFoes(u,B).forEach(e=>B.applyStatus(u,e,'cookie_curtain',5));
 for(let n=1;n<=8;n++)B.after(n*.5,()=>{
  if(!u.alive)return;
  milkFoes(u,B).forEach(e=>{
   milkHit(u,B,e,e.hasStatus('cookie_taint')?.23:.17,'Curtain Call',{area:true,dot:true});
   if(n===1&&e.hasStatus('cookie_stringbound'))e._cookieInterruptNext=true;
  });
 });
 B.after(4.1,()=>{
  u._cookieCurtainActive=false;if(!u.alive)return;
  const foes=milkFoes(u,B),weak=foes.slice().sort((a,b)=>a.hp-b.hp)[0];
  foes.forEach(e=>milkHit(u,B,e,1.45,'Curtain Call Finale',{area:true}));
  if(weak&&weak.alive)B.damage(u,weak,Math.min(weak.max.hp*.045,u.st.mag*2.6),{type:'true',noDodge:true,tag:'Curtain Call Finale'});
  B.energy(u,Math.min(35,foes.length*(u._cookieCurtainEnergy||6)));
  Sound.play('cookie_darkmagic_spread',{vol:.78});
 });
}
function milkIllusion(u,B,near){
 const illusion=B.summon(u,{protoId:'ShadowMilkCookie',name:'Illusion',art:ASSET+'uploads/Shadow_milk_idle.gif',hp:1,mag:0,atk:0,scale:.48,life:6,noSkills:true,noEnergy:true,tint:'#84ddff',onDeath:m=>{
  const attacker=m._lastHitBy;if(!attacker||!u.alive)return;
  milkHit(u,B,attacker,u._milkIllusionBurst||.85,'Illusion Burst',{area:true});B.energy(attacker,-(u._milkIllusionDrain||12));B.energy(u,u._milkIllusionGain||8);
  if(attacker.hasStatus('cookie_taint'))B.applyStatus(u,attacker,'silence',1.2);
 }});
 illusion.x=near.x+near.face*36;illusion.depth=near.depth;illusion.y=near.y;
 illusion.def=Object.assign({},illusion.def,{noDamage:true});illusion.inherit=true;
 illusion.baseStats.eva=0;illusion.recompute(true);
 return illusion;
}
function milkShadowForm(u,B,P={}){
 if(u._cookieShadowUsed)return;u._cookieShadowUsed=true;u._cookieShadowForming=true;
 B.cleanseAll(u);u.hp=Math.max(1,u.max.hp*.08);
 u.invuln=Math.max(u.invuln||0,B.t+4.1);
 u.casting=null;u.pendingHit=null;u.moving=false;u.movingY=false;u._castId=(u._castId||0)+1;
 u.animState='idle';u.animT=0;u.animDur=0;u.animStyle=null;
 B.applyStatus(u,u,'untargetable',4.1);
 const puppet=B.summon(u,{protoId:'ShadowMilkCookie',name:'Shadow Puppet',art:ASSET+'uploads/shadow_milk_effectmarionette2.png',hp:u.max.hp*.12,mag:0,atk:0,scale:.72,life:4,noSkills:true,noEnergy:true,taunt:420,tint:'#7664dc',onDeath:m=>milkShadowReturn(u,B,m._lastHitBy!=null)});
 puppet.x=u.x;puppet.depth=u.depth;puppet.y=u.y;puppet.def=Object.assign({},puppet.def,{noDamage:true});puppet.inherit=true;
 B.shield(u,puppet,u.max.hp*(P.shield||.35),4);
 u._cookieShadowPuppet=puppet;
 for(let n=1;n<=8;n++)B.after(n*.5,()=>{if(u.alive&&u._cookieShadowForming)B.heal(u,u,u.max.hp*(P.recovery||.035));});
 B.after(4.05,()=>{if(u._cookieShadowForming)milkShadowReturn(u,B,false);if(puppet.alive)B.kill(puppet);});
 milkEffect(B,u,'SHADOW FORM');Sound.play('cookie_darkmagic_ability',{vol:.68});
}
function milkShadowReturn(u,B,early){
 if(!u.alive||!u._cookieShadowForming)return;
 u._cookieShadowForming=false;B.removeStatus(u,'untargetable');
 u.invuln=Math.max(u.invuln||0,B.t+0.35);
 if(early)u.hp=Math.min(u.hp,u.max.hp*.24);
 B.applyStatus(u,u,'cookie_shadow_power',999);
 if(u.rarity>=5)B.applyStatus(u,u,'cookie_return_haste',9,{val:u._cookieReturnHaste||.25});
 B.removeStatus(u,'cookie_eye_truth');B.applyStatus(u,u,'cookie_eye_deceit',999);u._cookieEyeDeceit=true;
 B.fxRing(u.x,u.y-50,200,'#8b64ef',.5);milkEffect(B,u,'POWER OF DECEIT');
}

HEROES.ShadowMilkCookie.skills={
 W:{name:'Act 1: Lies',type:'Magic Damage / True Damage / Control',energy:100,v:{ratio:1},p:{show:5,finale:1.65,taint:8,eyeShield:.16,trueCap:3.2},
  desc:(S,P)=>'Eye of Truth gains Truth from debuffs. At five Truth it cleanses allies, Shields Shadow Milk Cookie, and boosts Magic Damage. Deceived, Stringbound, and Tainted enemies have their evasive movement read, so his attacks cannot be Dodged. Puppet Show traps the lowest-Max-HP enemy for '+P.show.toFixed(1)+' seconds. Grand Finale hits all enemies for '+Math.round(P.finale*100)+'% Magic Damage, deals capped Max-HP True Damage, and applies Taint for '+P.taint.toFixed(1)+' seconds. An early defeat leaves a damage-storing Soul Phantom.',
  passive(u,B,S,P){
   u._cookieTruth=0;u._cookieFinales=0;u._cookieShadowUsed=false;u._cookieCurtainUsed=false;
   u.antiDodge=target=>!!(target&&(target.hasStatus('cookie_deceived')||target.hasStatus('cookie_stringbound')||target.hasStatus('cookie_taint')||target.hasStatus('cookie_puppet_show')||B.t<(target._milkReadUntil||0)));
   B.applyStatus(u,u,'cookie_eye_truth',999);
   B.on(u,'statusApplied',ev=>{
    if(u._cookieEyeDeceit||!ev.unit||STATUS[ev.id]?.kind!=='debuff')return;
    if(++u._cookieTruth<5)return;u._cookieTruth=0;
    milkAllies(u,B).forEach(a=>B.cleanse(a,1));
    B.shield(u,u,u.max.hp*P.eyeShield,8);B.applyStatus(u,u,'cookie_truth_power',8);
    milkEffect(B,u,'EYE OF TRUTH');
   });
   B.on(u,'enemyDown',fallen=>{const show=u._cookieShow;if(show&&!show.done&&show.primary===fallen)milkSoulPhantom(u,B,show,fallen);});
   B.on(u,'enemySkillStarting',start=>{
    if(!start.unit||!start.unit._cookieInterruptNext)return;
    start.unit._cookieInterruptNext=false;start.cancel=true;start.cooldown=2.5;
   });
   B.every(u,3.5,()=>{
    if(!u.alive||!u._cookieEyeDeceit||u._cookieShadowForming)return;
    const target=milkFoes(u,B).sort((a,b)=>b.energy-a.energy)[0];if(!target)return;
    milkHit(u,B,target,.54+(u.rarity>=5?.16:0),'Eye of Deceit');
    const taint=target.getStatus('cookie_taint');if(taint){taint.t=Math.min(12,taint.t+1.5);target.statusVersion++;}
   });
  },
  cast(u,B,S,P){
   const primary=milkPrimary(u,B);if(!primary)return;
   const show={primary,until:B.t+P.show,duration:P.show,finale:P.finale,taint:P.taint,trueCap:P.trueCap,done:false,phantom:null,phantomDamage:0};u._cookieShow=show;
   B.anim(u,'cast',.8);B.applyStatus(u,u,'cookie_stage_guard',P.show+.1);
   milkPuppetShow(u,B,primary,S.ratio,show);
   if(u.rarity>=5){const second=milkFoes(u,B).filter(e=>e!==primary).sort((a,b)=>B.distance(a,primary)-B.distance(b,primary))[0];if(second&&B.distance(second,primary)<200)milkPuppetShow(u,B,second,S.ratio*.48,show);}
   B.after(P.show,()=>milkGrandFinale(u,B,show));
   Sound.play('cookie_darkmagic_ability',{vol:.72});milkEffect(B,u,'PUPPET SHOW');
  }},
 G:{name:'The Truth Is a Lie',type:'Magic Damage / Control',cd:11,v:{burst:.85},p:{deceived:6,drain:12,gain:8},
  desc:(S,P)=>'Illusions surround the two strongest attackers for '+P.deceived.toFixed(1)+' seconds. Deceived lowers Accuracy and can redirect Basic Attacks into an illusion. Destroyed illusions burst for '+Math.round(S.burst*100)+'% Magic Damage, drain '+Math.round(P.drain)+' Energy, and Silence Tainted attackers. Shadow Milk gains Energy.',
  cast(u,B,S,P){
   u._milkIllusionBurst=S.burst;u._milkIllusionDrain=P.drain;u._milkIllusionGain=P.gain;
   const targets=milkFoes(u,B).sort((a,b)=>b.st.atk-a.st.atk).slice(0,2);if(!targets.length)return;
   targets.forEach((t,i)=>{
    t._milkReadUntil=B.t+P.deceived;
    B.applyStatus(u,t,'cookie_deceived',P.deceived);
    t._cookieIllusions=(t._cookieIllusions||[]).filter(m=>m.alive);
    t._cookieIllusions.push(milkIllusion(u,B,t));
    if(u.rarity>=5&&i===0)t._cookieIllusions.push(milkIllusion(u,B,t));
    t.basicRedirect=(intended,battle)=>milkRedirectBasic(t,intended,battle);
    if(u.rarity>=5&&!t._cookieMissListener){
     t._cookieMissListener=true;
     B.on(t,'missed',()=>{if(t.hasStatus('cookie_deceived'))B.applyStatus(u,t,'cookie_misled',2.5);});
    }
   });
   milkEffect(B,u,'DECEIVED');Sound.play('cookie_darkmagic_ability',{vol:.58});
  }},
 B:{name:'Master of Puppets',type:'Magic Damage / Control',cd:12,v:{ratio:.82,trigger:.62},p:{string:6,slow:.25},
  desc:(S,P)=>'Stringbound targets the highest Skill Power enemy for '+P.string.toFixed(1)+' seconds, slowing attacks and Skills by '+Math.round(P.slow*100)+'%. Their Skills trigger '+Math.round(S.trigger*100)+'% Magic Damage and delay the next Skill. Tainted or Puppet Show targets have their next Basic Attack redirected. Strings snap for area damage.',
  passive(u,B,S,P){B.on(u,'enemyCast',enemy=>{
   if(!enemy||!enemy.alive||!enemy.statuses.some(s=>s.id==='cookie_stringbound'&&s.src===u))return;
   milkHit(u,B,enemy,S.trigger,'Puppet Strings');
   Object.keys(enemy.cds).forEach(k=>{enemy.cds[k]=Math.max(0,enemy.cds[k]||0)+1.6;});
   if(enemy.hasStatus('cookie_puppet_show')||enemy.hasStatus('cookie_taint')){
    enemy._cookieRedirectNext=true;
    if(!B.alliesOf(enemy).some(a=>a!==enemy&&a.alive)&&!(enemy._cookieIllusions||[]).some(m=>m.alive))
      (enemy._cookieIllusions||(enemy._cookieIllusions=[])).push(milkIllusion(u,B,enemy));
   }
  });},
  cast(u,B,S,P){
   const targets=milkFoes(u,B).sort((a,b)=>b.st.mag-a.st.mag).slice(0,u.rarity>=5?2:1);
   targets.forEach((t,i)=>{milkHit(u,B,t,S.ratio*(i?.55:1),'Master of Puppets');if(t.alive){B.applyStatus(u,t,'cookie_stringbound',t.isBoss?(i?1.3:2):(i?P.string*.67:P.string),{val:P.slow*(i?.6:1)});t.basicRedirect=(intended,battle)=>milkRedirectBasic(t,intended,battle);}});
   targets.forEach(t=>B.fxRing(t.x,t.y-40,125,'#8bdcf0',.5));
   milkEffect(B,u,'STRINGBOUND');Sound.play('cookie_shadow_strings',{vol:.67});
  }},
 P:{name:'Shadow Form',type:'Survival / Magic Damage / Control',v:{},p:{shield:.35,recovery:.035},
  desc:(S,P)=>'Once per wave, a lethal hit sends Shadow Milk Cookie to another realm. A puppet takes his place with a Shield worth '+Math.round(P.shield*100)+'% of his Max HP while he recovers HP for up to four seconds. He returns with Power of Deceit and the attacking Eye of Deceit. Destroying the puppet early cuts short recovery.',
  passive(u,B,S,P){
   u._cookieShadowUsed=false;
   B.on(u,'lethal',ev=>{if(u._cookieShadowUsed)return;ev.prevented=true;milkShadowForm(u,B,P);});
  }},
 R:{name:'The Greatest Show on Earth',type:'Magic Damage / True Damage / Control',v:{mag:.16,hp:.12},p:{haste:.25,energy:6},
  desc:(S,P)=>'Puppet Show catches a second enemy. Illusions multiply; Master of Puppets catches two targets. After two Grand Finales, Curtain Call damages and weakens every enemy for four seconds, interrupts Stringbound Skills, then explodes and deals capped True Damage to the weakest survivor. Shadow Form grants '+Math.round(P.haste*100)+'% return Skill Haste; Curtain Call restores up to '+Math.round(P.energy)+' Energy per enemy hit.',
  passive(u,B,S,P){u.flat.magPcookie=S.mag;u.flat.hpPcookie=S.hp;u._cookieReturnHaste=P.haste;u._cookieCurtainEnergy=P.energy;u.dirty=true;
   B.on(u,'dealDamage',ev=>{if(ev.tag==='Puppet Show'&&ev.type==='magic')ev.amount*=1.16;if(ev.tag==='Eye of Deceit')ev.amount*=1.15;});
  }}
};
