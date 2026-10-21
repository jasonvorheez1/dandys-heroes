/* Queens of Mischief: separate event variants, not costumes of the base cast. */
'use strict';

const QOM_IDS = ['QOMGourdy', 'QOMEclipse', 'QOMSoulvester', 'QOMRibecca', 'QOMConnie'];
function qomFoes(B,u) { return B.enemiesOf(u).filter(e => e.alive && B.isTargetable(e)); }
function qomAllies(B,u) { return B.alliesOf(u).filter(a => a.alive); }
function qomTop(list,key) { return list.slice().sort((a,b) => (b.st && b.st[key] || b[key] || 0) - (a.st && a.st[key] || a[key] || 0))[0]; }
function qomLow(list) { return list.slice().sort((a,b) => a.hpPct-b.hpPct)[0]; }
function qomStacks(u,id) { const s=u.getStatus(id); return s ? s.stacks : 0; }
function qomSpend(B,u,id,n) { const s=u.getStatus(id); if (!s) return 0; const spent=Math.min(n,s.stacks); s.stacks-=spent; if (!s.stacks) B.removeStatus(u,id); else { u.dirty=true; u.statusVersion++; } return spent; }
function qomAmp(B,u,n) { const cap=u.rarity>=5?15:10; const have=qomStacks(u,'qom_amp'); if(have>=cap)return; B.applyStatus(u,u,'qom_amp',999,{stacks:Math.min(n,cap-have)}); if(have<10&&have+n>=10)B.fxFloatIcon(u.x,u.y-95,'FULL VOLUME','#adff6b'); if(have<15&&have+n>=15&&u.rarity>=5){ B.fxFloatIcon(u.x,u.y-115,'HEADLINER','#eaa4ff'); if(u.hpPct<.6&&!u._qomSolo){u._qomSolo=true;B.after(.12,()=>qomFinalSolo(B,u));} } }
function qomNotes(B,u,n) { const have=qomStacks(u,'qom_notes'); if(have<8) B.applyStatus(u,u,'qom_notes',999,{stacks:Math.min(n,8-have)}); }
function qomHitAll(B,u,ratio,type,tag,status,dur) { qomFoes(B,u).forEach(e=>{B.damage(u,e,u.st[type==='physical'?'atk':'mag']*ratio,{type,area:true,tag});if(status)B.applyStatus(u,e,status,dur||5);if(u.id==='QOMEclipse'&&type==='magic'&&qomStacks(u,'qom_amp')>=10){B.applyStatus(u,e,'armslow',3);if(qomStacks(u,'qom_amp')>=12)B.applyStatus(u,e,'grief',4);}}); B.fxRing(u.x,u.y-48,310,type==='magic'?'#c764f7':'#8fed65',.45); }
function qomFinalSolo(B,u){ if(!u.alive)return; B.applyStatus(u,u,'untargetable',1.35); Sound.play('qom_riff',{vol:.60,priority:true}); B.anim(u,'cast',1.1); B.repeat(3,.24,i=>{if(!u.alive)return;qomHitAll(B,u,.68+i*.22,'magic','Final Solo','qom_feedback',6);qomFoes(B,u).forEach(e=>B.applyStatus(u,e,'defdown',5));}); B.after(.86,()=>{if(!u.alive)return;const t=qomTop(qomFoes(B,u),'hp');if(t){B.damage(u,t,u.st.atk*3.2*(1+(1-t.hpPct)*.65),{type:'physical',tag:'Final Solo'});B.knockback(u,t,100);}B.heal(u,u,u.max.hp*.19);B.shield(u,u,u.max.hp*.24,8);B.removeStatus(u,'untargetable');}); }
function qomCommon(id,name,role,tier,element,base,hidden,basic,blurb){return {id,name:name+' · Queens of Mischief',role,tier,element,blurb,base,hidden,growth:{hp:.088,atk:.086,def:.082,mag:.09,mdef:.083},move:{gait:'bounce',bob:5,freq:1.7,lean:5,squash:.025,hover:0,idle:'pulse',step:null,particles:'sparkle',pcol:'#a5ed55',trail:{on:true,col:'#ba59e0',rate:.16},brake:.12},basic};}

// Gourdy: the four-beat rhythm is always running, even under control.
const QOM_GOURDY=qomCommon('QOMGourdy','Gourdy','Support','SS','Sound',
  {hp:4100,atk:155,def:215,mag:505,mdef:325,spd:110,acc:195,eva:120},
  {range:315,aspd:.85,ms:58,aggro:.50,crit:.07,critDmg:1.5,healPow:1.1,shieldPow:1.2,cdr:.16,ccRes:.16,kbRes:.35,armorPen:0,magPen:.1},
  {name:'Snare Hit',type:'magic',ratio:.85,range:315,proj:'orb',pcol:'#b757e4',sfx:'hit_magic',hit:'hit_magic',wind:.28},
  'A drummer whose four-beat measure sets the tempo of every fight.');
function qomBeat(u,B,fast){if(!u.alive)return;u._qomBeat=(u._qomBeat||0)%4+1;const beat=u._qomBeat;const power=1+qomStacks(u,'qom_encore')*.06;B.fxFloatIcon(u.x,u.y-100,String(beat),beat===4?'#d9a5ff':'#9df273');
  if(beat===1)qomAllies(B,u).forEach(a=>B.energy(a,Math.round(5*power)));
  if(beat===2)qomFoes(B,u).forEach(e=>B.applyStatus(u,e,'armslow',3.5));
  if(beat===3)qomAllies(B,u).forEach(a=>B.reduceCd(a,.42*power));
  if(beat===4){Sound.play('qom_crash',{vol:.34,throttle:250});qomHitAll(B,u,.52*power,'magic','Fourth Beat');qomFoes(B,u).forEach(e=>{if(e.casting)B.interrupt(e);});B.applyStatus(u,u,'qom_encore',999);u._qomMeasures=(u._qomMeasures||0)+1;if(u.rarity>=5){const allies=qomAllies(B,u);if(allies.some(a=>a.hpPct<.5))allies.sort((a,b)=>a.hpPct-b.hpPct).slice(0,2).forEach(a=>B.shield(u,a,u.max.hp*.12,6));else allies.forEach(a=>B.applyStatus(u,a,'qom_treat',4));const charged=qomTop(qomFoes(B,u),'energy');if(charged&&charged.energy>=70){B.energy(charged,-14);B.applyStatus(u,charged,'silence',.75);}}if(u.rarity>=5&&!u._qomFinalChorus&&u._qomMeasures>=4){u._qomFinalChorus=true;B.after(.1,()=>qomChorus(u,B,true));}}
}
function qomChorus(u,B,final){if(!u.alive)return;const beats=final?8:8;Sound.play('qom_crash',{vol:.5});qomAllies(B,u).forEach(a=>B.applyStatus(u,a,'haste',final?12:7)); B.repeat(beats,final?.28:.22,i=>{if(!u.alive)return;qomBeat(u,B,true);if(final&&i%4===3)qomHitAll(B,u,.55,'magic','Final Chorus');});if(final)B.after(2.4,()=>qomAllies(B,u).forEach(a=>B.applyStatus(u,a,'haste',7)));}
QOM_GOURDY.skills={
 W:{name:'Queens of Mischief',type:'Magic Damage / Control / Support',energy:100,v:{ratio:.62},p:{beat:1.12},desc:()=>`Passive: Gourdy keeps a four-beat drum measure running. Beat 1 gives allies Energy; beat 2 slows enemy attacks; beat 3 reduces allied cooldowns; beat 4 damages and interrupts enemies. Every measure builds Encore. Active: performs two fast measures, granting the team Haste and disrupting enemy Skills.`,passive:(u,B,S,P)=>{B.every(u,P.beat,()=>qomBeat(u,B));},cast:(u,B)=>{B.anim(u,'cast',1.8);qomChorus(u,B,false);}},
 G:{name:'Out of Tune',type:'Magic Damage / Control',cd:11,v:{ratio:1.05},p:{dur:6},desc:()=>`Changes the rhythm for 6 seconds. Enemies lose Skill Haste, and their first Skill during the effect is delayed by a snare hit. Tricked enemies also lose Energy.`,cast:(u,B,S,P)=>{qomFoes(B,u).forEach(e=>B.applyStatus(u,e,'qom_offbeat',P.dur));const off=B.on(u,'enemyCast',e=>{if(!e.hasStatus('qom_offbeat')||e._qomSnaredUntil>B.t)return;e._qomSnaredUntil=B.t+P.dur;B.damage(u,e,u.st.mag*S.ratio,{type:'magic',tag:'Out of Tune'});B.interrupt(e);if(e.hasStatus('qom_trick'))B.energy(e,-14);});B.after(P.dur,off);Sound.play('qom_crash',{vol:.35});}},
 B:{name:'Trick or Treat!',type:'Support / Control',cd:10,v:{shield:.17},p:{dur:8},desc:()=>`Throws candy to the two lowest-Energy allies. Each receives one random Treat: Attack and speed, Skill Haste and Energy, a protective Shield, or a cooldown refund. The highest-Energy foe is Tricked. A treated ally's Skill advances Gourdy's beat.`,cast:(u,B,S,P)=>{qomAllies(B,u).sort((a,b)=>a.energy-b.energy).slice(0,2).forEach(a=>{B.applyStatus(u,a,'qom_treat',P.dur);const roll=Math.floor(Math.random()*4);if(roll===0){B.applyStatus(u,a,'atkup',P.dur);B.applyStatus(u,a,'speedup',P.dur);}else if(roll===1){B.applyStatus(u,a,'haste',P.dur);B.energy(a,15);}else if(roll===2){B.shield(u,a,u.max.hp*S.shield,P.dur);B.applyStatus(u,a,'ward',4);}else B.reduceCd(a,2.4);B.fxFloatIcon(a.x,a.y-90,'🍬','#c6fb7b');});const e=qomTop(qomFoes(B,u),'energy');if(e)B.applyStatus(u,e,'qom_trick',P.dur);Sound.play('qom_guard',{vol:.42});}},
 P:{name:'Keep the Beat',type:'Support / Control',v:{haste:.10},p:{},desc:()=>`The rhythm continues through control. Allied Skills used on beat four gain power and cooldown recovery; enemy Skills used on beat four lose Energy and damage. Gourdy gains Energy from either.`,passive:(u,B)=>{B.on(u,'allyCast',a=>{if(u._qomBeat!==4)return;B.energy(u,5);B.applyStatus(u,a,'inspire',4);B.reduceCd(a,1.2);});B.on(u,'enemyCast',e=>{if(u._qomBeat!==4)return;B.energy(u,5);B.energy(e,-12);B.applyStatus(u,e,'weaken',4);});}},
 R:{name:'One Last Encore',type:'Support / Magic Damage',v:{mag:.12},p:{},desc:()=>`Fourth beats adapt: shield wounded allies, drain a charged enemy, or boost a healthy team. After four measures, Final Chorus runs at double tempo and leaves all allies with Haste.`,passive:(u,B)=>{u.flat.magPqom=.12;u.flat.cdrqom=.12;u.dirty=true;B.on(u,'allyBasic',()=>{if(u._qomBeat!==4)return;const allies=qomAllies(B,u);if(allies.some(a=>a.hpPct<.5))allies.sort((a,b)=>a.hpPct-b.hpPct).slice(0,2).forEach(a=>B.shield(u,a,u.max.hp*.12,6));else allies.forEach(a=>B.applyStatus(u,a,'qom_treat',4));const e=qomTop(qomFoes(B,u),'energy');if(e&&e.energy>=70)B.energy(e,-12);});}}
};defHero(QOM_GOURDY);

// Eclipse: attack to amplify; she never transforms.
const QOM_ECLIPSE=qomCommon('QOMEclipse','Eclipse','Damage','SS','Sound',
  {hp:5650,atk:515,def:345,mag:355,mdef:275,spd:145,acc:210,eva:195},
  {range:75,aspd:1.22,ms:108,aggro:1.15,crit:.20,critDmg:1.9,healPow:1,shieldPow:1.15,cdr:.09,ccRes:.22,kbRes:.55,armorPen:.10,magPen:.06},
  {name:'Claw & Guitar',type:'physical',ratio:1.10,range:75,sfx:'swing_claw',hit:'hit_slash',wind:.21},
  'A relentless electric guitarist who grows louder and deadlier with every attack.');
QOM_ECLIPSE.skills={
 W:{name:'Queens of Mischief',type:'Physical / Magic / Control',energy:100,v:{ratio:1.65},p:{},desc:()=>`Every third Basic Attack releases a Magic soundwave and gains Amplification. At 2/4/6/8/10 stacks she gains speed, splash damage, defenses, Energy drain, and Full Volume. Active: leaps in, knocks back the formation, then claws the strongest enemy. Full Volume adds three interrupting soundwaves and a Shield.`,passive:(u,B)=>{u._qomBasics=0;B.on(u,'basicHit',ev=>{u._qomBasics++;if(u._qomBasics%3!==0)return;qomAmp(B,u,1);qomHitAll(B,u,.34,'magic','Electric Soundwave');if(qomStacks(u,'qom_amp')>=8)qomFoes(B,u).forEach(e=>B.energy(e,-4));});},cast:(u,B,S)=>{const foes=qomFoes(B,u);if(!foes.length)return;B.blink(u,B.avgX(foes),u.depth);qomHitAll(B,u,S.ratio,'magic','Queens of Mischief');foes.forEach(e=>B.knockback(u,e,70));const t=qomTop(foes,'atk');if(t)B.repeat(3,.13,()=>{if(t.alive)B.damage(u,t,u.st.atk*.68,{type:'physical',tag:'Guitar Claws'});});if(qomStacks(u,'qom_amp')>=10)B.repeat(3,.24,()=>{qomHitAll(B,u,.55,'magic','Full Volume');qomFoes(B,u).forEach(e=>{if(e.casting)B.interrupt(e);});B.shield(u,u,u.max.hp*.07,6);});Sound.play('qom_riff',{vol:.60});}},
 G:{name:'Feedback Frenzy',type:'Magic / Control / Shield',cd:9,v:{ratio:1.25},p:{dur:6},desc:()=>`A feedback burst damages and marks nearby enemies. Their Skills trigger extra damage and Amplification; attackers draw a shielded guitar counter. At Full Volume the feedback reaches everyone and heals Eclipse.`,cast:(u,B,S,P)=>{qomFoes(B,u).filter(e=>B.distance(u,e)<270||qomStacks(u,'qom_amp')>=10).forEach(e=>{B.damage(u,e,u.st.mag*S.ratio,{type:'magic',tag:'Feedback Frenzy'});B.applyStatus(u,e,'qom_feedback',P.dur);if(qomStacks(u,'qom_amp')>=10)B.heal(u,u,u.max.hp*.035);});Sound.play('qom_riff',{vol:.45});}},
 B:{name:'Howling Riff',type:'Physical / Magic / Control',cd:12,v:{ratio:1.15},p:{dur:6},desc:()=>`Howls, gains speed and Evasion, then rushes through three foes, Rattling their Attack and Armor. A final chord hits every Rattled foe. At Full Volume she strikes everyone and deals extra damage to wounded enemies.`,cast:(u,B,S,P)=>{B.applyStatus(u,u,'speedup',P.dur);B.applyStatus(u,u,'lucky',P.dur);const foes=qomFoes(B,u).slice(0,qomStacks(u,'qom_amp')>=10?99:3);foes.forEach((e,i)=>B.after(i*.18,()=>{if(!u.alive||!e.alive)return;B.blink(u,e.x-20,u.depth);B.damage(u,e,u.st.atk*S.ratio,{type:'physical',tag:'Howling Riff'});B.applyStatus(u,e,'qom_rattled',6);}));B.after(.7,()=>qomFoes(B,u).filter(e=>e.hasStatus('qom_rattled')).forEach(e=>B.damage(u,e,u.st.mag*(.75+(qomStacks(u,'qom_amp')>=10?(1-e.hpPct)*.6:0)),{type:'magic',tag:'Sustained Chord'})));Sound.play('qom_riff',{vol:.5});}},
 P:{name:'Wild at Heart',type:'Attack / Armor / Lifesteal',v:{hp:.16},p:{},desc:()=>`Gains Max HP and Lifesteal. Critical damage builds Amplification and heals. Skill hits build Backstage Guard; at maximum she reflects the next strike. Defeats restore HP and raise her Attack.`,passive:(u,B,S)=>{u.flat.hpPqom=S.hp;u.flat.healRecvqom=.14;u.dirty=true;B.on(u,'dealDamage',ev=>{if(ev.crit&&!ev.dot){qomAmp(B,u,1);B.heal(u,u,u.max.hp*.025);}});B.on(u,'damaged',ev=>{if(!ev.src||ev.basic)return;B.applyStatus(u,u,'fortify',7);if(qomStacks(u,'fortify')>=5&&u._qomCounterAt<B.t){u._qomCounterAt=B.t+5;B.damage(u,ev.src,ev.amount*.35,{type:'magic',reflected:true,tag:'Reversal'});B.knockback(u,ev.src,55);}});B.on(u,'enemyDown',e=>{if(e._lastHitBy===u){B.heal(u,u,u.max.hp*.10);B.applyStatus(u,u,'atkup',999);}});}},
 R:{name:'Final Encore',type:'Physical / Magic / Shield / Control',v:{atk:.16},p:{},desc:()=>`Amplification now reaches 15. Higher stacks pierce Armor, weaken healing, and improve defense and Energy gain. At 15 she becomes Headliner: double strikes, stronger soundwaves and lifesteal. Once per wave at low HP, Final Solo makes her untargetable, hits the entire team repeatedly, heals, and grants a Shield.`,passive:(u,B,S)=>{u.flat.atkPqom=S.atk;u.flat.critDmgqom=.22;u.dirty=true;B.on(u,'basicHit',ev=>{const n=qomStacks(u,'qom_amp');if(n>=11&&ev.target&&ev.target.alive)B.damage(u,ev.target,u.st.mag*.38,{type:'magic',tag:'Headliner Echo'});if(n>=14)B.energy(u,3);if(n>=15&&ev.target)B.heal(u,u,u.max.hp*.012);});B.on(u,'damaged',ev=>{if(qomStacks(u,'qom_amp')>=15&&!u._qomAbsorb){u._qomAbsorb=true;ev.amount*=.55;B.shield(u,u,u.max.hp*.16,7);}});}}
};defHero(QOM_ECLIPSE);

// Ribecca: a barrier tank with redirection, debuff immunity, and one team rescue.
const QOM_RIBECCA=qomCommon('QOMRibecca','Ribecca','Tank','SS','Sound',
  {hp:6900,atk:230,def:455,mag:335,mdef:385,spd:88,acc:170,eva:112},
  {range:78,aspd:.84,ms:67,aggro:1.5,crit:.05,critDmg:1.5,healPow:1,shieldPow:1.27,cdr:.04,ccRes:.35,kbRes:.72,armorPen:0,magPen:.08},
  {name:'Keytar Strike',type:'magic',ratio:.83,range:78,sfx:'hit_blunt',hit:'hit_magic',wind:.31},
  'A skeleton keytarist who absorbs incoming damage and keeps the band standing.');
QOM_RIBECCA.skills={
 W:{name:'Skeleton Symphony',type:'Magic / Shield / Control',energy:100,v:{ratio:1.15},p:{dur:8},desc:()=>`Starts each wave with a Sound Barrier worth 30% Max HP. She redirects and softens allied damage; absorbed hits build Resonance and release knockback waves. Active: grants the team Shields and Damage Reduction, then answers with a bass note.`,passive:(u,B)=>{B.shield(u,u,u.max.hp*.30,15);B.on(u,'allyDamaged',ev=>{if(ev.unit===u||!ev.src||ev.redirected||B.t<(ev.unit._qomRedirectAt||0))return;ev.unit._qomRedirectAt=B.t+.35;const moved=ev.amount*.25;ev.amount-=moved;B.damage(ev.src,u,moved*.70,{type:'true',redirected:true,tag:'Sound Barrier'});B.applyStatus(u,u,'qom_resonance',999);if(qomStacks(u,'qom_resonance')>=5){B.removeStatus(u,'qom_resonance');qomHitAll(B,u,.43,'magic','Resonance');qomFoes(B,u).filter(e=>B.distance(u,e)<150).forEach(e=>B.knockback(u,e,35));}});},cast:(u,B,S,P)=>{qomAllies(B,u).forEach(a=>{B.shield(u,a,u.max.hp*.20,P.dur);B.applyStatus(u,a,'ward',4);});B.after(.5,()=>qomHitAll(B,u,S.ratio,'magic','Skeleton Symphony'));Sound.play('qom_guard',{vol:.56});}},
 G:{name:'Bone Rattler',type:'Physical / Control',cd:9,v:{ratio:1.35},p:{dur:6},desc:()=>`Detaches an arm to stun the strongest foe, then bounces to two more. All targets become Offbeat. Ribecca reattaches it and gains Armor.`,cast:(u,B,S,P)=>{const foes=qomFoes(B,u);const first=qomTop(foes,'atk');if(!first)return;[first,...foes.filter(e=>e!==first).slice(0,2)].forEach((e,i)=>{B.damage(u,e,u.st.atk*S.ratio*(i?.65:1),{type:'physical',tag:'Bone Rattler'});B.applyStatus(u,e,'qom_offbeat',P.dur);if(!i)B.applyStatus(u,e,'stun',1.2);});B.applyStatus(u,u,'fortify',8);Sound.play('qom_counter',{vol:.45});}},
 B:{name:'Backstage Protection',type:'Shield / Support / Control',cd:11,v:{shield:.25},p:{dur:8},desc:()=>`Keytar chord shields the two lowest-HP allies. Their incoming damage is redirected to Ribecca and reduced; attackers lose Attack. Broken shields restore her health.`,cast:(u,B,S,P)=>{qomAllies(B,u).sort((a,b)=>a.hpPct-b.hpPct).slice(0,2).forEach(a=>{B.shield(u,a,u.max.hp*S.shield,P.dur,{redirect:{to:u,pct:.4},onBreak:()=>B.heal(u,u,u.max.hp*.06)});B.applyStatus(u,a,'fortify',P.dur);});Sound.play('qom_guard',{vol:.48});}},
 P:{name:'The Undead',type:'Tank / Support',v:{hp:.12},p:{},desc:()=>`Immune to removable debuffs. Resisted debuffs build Undead Resilience and every third one heals Ribecca. Once per wave below 40% HP, she falls apart, reassembles, heals, and Taunts nearby enemies.`,passive:(u,B,S)=>{u.flat.hpPqom=S.hp;u.dirty=true;u.guards.push((id,d)=>{if(d.kind!=='debuff')return false;B.applyStatus(u,u,'qom_resilience',10);u._qomResists=(u._qomResists||0)+1;if(u._qomResists%3===0)B.heal(u,u,u.max.hp*.05);return true;});B.on(u,'allyLow',a=>{if(a!==u||u._qomReassembled||u.hpPct>=.4)return;u._qomReassembled=true;B.applyStatus(u,u,'untargetable',1.5);B.after(1.5,()=>{if(!u.alive)return;B.heal(u,u,(u.max.hp-u.hp)*.15);qomFoes(B,u).filter(e=>B.distance(u,e)<210).forEach(e=>B.applyStatus(u,e,'taunt',4));Sound.play('qom_guard',{vol:.58});});});}},
 R:{name:'Unbreakable Performance',type:'Shield / Control / Magic',v:{hp:.15},p:{},desc:()=>`Every 15 seconds, plays a defensive team chord. Shielded allies gain Armor and Magic Defense. Once per wave, Standing Ovation prevents one allied KO, protects them, and makes Ribecca Taunt the entire enemy team.`,passive:(u,B,S)=>{u.flat.hpPqomR=S.hp;u.flat.defPqom=.16;u.flat.mdefPqom=.15;u.dirty=true;B.every(u,15,()=>qomAllies(B,u).forEach(a=>{B.shield(u,a,u.max.hp*.12,8);B.applyStatus(u,a,'fortify',8);}));B.on(u,'allyLethal',ev=>{if(u._qomOvation||!ev.unit||ev.unit===u)return;u._qomOvation=true;ev.prevented=true;ev.unit.hp=Math.max(1,ev.unit.max.hp*.15);B.shield(u,ev.unit,u.max.hp*.30,8);B.applyStatus(u,u,'ward',5);qomFoes(B,u).forEach(e=>B.applyStatus(u,e,'taunt',5));B.fxFloatIcon(u.x,u.y-110,'STANDING OVATION','#b7ff8d');Sound.play('qom_guard',{vol:.75});B.after(5,()=>{if(u.alive){qomHitAll(B,u,.7,'magic','Standing Ovation');B.heal(u,u,u.max.hp*.10);}});});}}
};defHero(QOM_RIBECCA);

// Soulvester: single-target teleport interception and punishing parries.
const QOM_SOULVESTER=qomCommon('QOMSoulvester','Soulvester','Tank','S','Spirit',
  {hp:6000,atk:385,def:390,mag:190,mdef:280,spd:111,acc:180,eva:132},
  {range:78,aspd:1.0,ms:78,aggro:1.35,crit:.13,critDmg:1.72,healPow:1,shieldPow:1.05,cdr:.08,ccRes:.18,kbRes:.65,armorPen:.08,magPen:0},
  {name:'Knight Slash',type:'physical',ratio:1.03,range:78,sfx:'swing_sword',hit:'hit_slash',wind:.27},
  'A ghostly knight who appears beside an endangered ally, blocks the hit, and counters.');
function qomParry(u,B,attacker,ally,ratio){if(!attacker||!attacker.alive)return;B.blink(u,ally?ally.x:attacker.x,u.depth);B.damage(u,attacker,u.st.atk*ratio,{type:'physical',tag:'Perfect Parry'});B.applyStatus(u,attacker,'qom_challenged',6);B.applyStatus(u,attacker,'stun',1);B.applyStatus(u,u,'qom_resolve',8);if(ally)B.shield(u,ally,u.max.hp*.15,5);Sound.play('qom_counter',{vol:.57});}
QOM_SOULVESTER.skills={
 W:{name:'Knight of Mischief',type:'Physical / Control / Shield',energy:100,v:{ratio:2.2},p:{},desc:()=>`Opens with Damage Reduction. Critical hits against allies build Valor. Active: teleports to the lowest-HP ally, blocks their next attack, and retaliates with a Stunning slash. Challenged enemies deal less damage to anyone else.`,passive:(u,B)=>{B.applyStatus(u,u,'ward',6);B.on(u,'allyDamaged',ev=>{if(ev.unit!==u&&ev.crit)B.applyStatus(u,u,'qom_valor',10);});},cast:(u,B,S)=>{const ally=qomLow(qomAllies(B,u));if(!ally)return;B.blink(u,ally.x-20,u.depth);B.shield(u,ally,u.max.hp*.18,6);u._qomGuardAlly=ally;u._qomGuardUntil=B.t+6;B.on(u,'allyDamaged',ev=>{if(ev.unit!==ally||B.t>u._qomGuardUntil||!ev.src)return;u._qomGuardUntil=0;ev.amount=0;qomParry(u,B,ev.src,ally,S.ratio);if(!ev.basic)B.energy(ev.src,-20);});}},
 G:{name:'Perfect Parry',type:'Physical / Control',cd:10,v:{ratio:1.3},p:{},desc:()=>`Raises his shield for two seconds, greatly reducing incoming damage. If struck, negates the blow, teleports to the attacker, and retaliates twice with Armor reduction. Otherwise gains a Shield.`,cast:(u,B,S)=>{u._qomParryUntil=B.t+2;u._qomParried=false;B.applyStatus(u,u,'ward',2);B.on(u,'damaged',ev=>{if(B.t>u._qomParryUntil||u._qomParried||!ev.src)return;u._qomParried=true;ev.amount=0;qomParry(u,B,ev.src,null,S.ratio*2);B.applyStatus(u,ev.src,'defdown',8);if(!ev.basic){B.interrupt(ev.src);B.heal(u,u,u.max.hp*.07);}});B.after(2,()=>{if(u.alive&&!u._qomParried)B.shield(u,u,u.max.hp*.12,6);});}},
 B:{name:'Royal Intervention',type:'Physical / Support',cd:12,v:{ratio:1.55},p:{dur:12},desc:()=>`Guards the highest-Attack ally for 12 seconds, redirecting part of their damage. Intercepts a damaging Skill, rushes its source, and knocks them back. Both gain speed afterward.`,cast:(u,B,S,P)=>{const ally=qomTop(qomAllies(B,u).filter(a=>a!==u),'atk');if(!ally)return;B.shield(u,ally,u.max.hp*.18,P.dur,{redirect:{to:u,pct:.25}});u._qomRoyal=ally;u._qomRoyalUntil=B.t+P.dur;u._qomRoyalUses=u.rarity>=5?2:1;B.on(u,'allyDamaged',ev=>{if(ev.unit!==ally||ev.basic||!ev.src||B.t>u._qomRoyalUntil||u._qomRoyalUses<=0)return;u._qomRoyalUses--;ev.amount*=.25;B.blink(u,ally.x,u.depth);B.damage(u,ev.src,u.st.atk*S.ratio,{type:'physical',tag:'Royal Intervention'});B.knockback(u,ev.src,90);B.applyStatus(u,u,'speedup',6);B.applyStatus(u,ally,'speedup',6);B.applyStatus(u,u,'qom_resolve',8);});}},
 P:{name:'Unyielding Knight',type:'Tank / Counterattack',v:{hp:.17},p:{},desc:()=>`Gains Max HP and Armor. Every guard, parry, or interception builds Knightly Resolve. At three stacks his next counter cleaves nearby foes. Ranged Basics hurt less while above half HP.`,passive:(u,B,S)=>{u.flat.hpPqom=S.hp;u.flat.defPqom=.18;u.dirty=true;B.on(u,'damaged',ev=>{if(ev.basic&&!ev.melee&&u.hpPct>.5)ev.amount*=.7;});B.on(u,'dealDamage',ev=>{if(ev.tag!=='Perfect Parry'||qomStacks(u,'qom_resolve')<3)return;qomFoes(B,u).filter(e=>e!==ev.target&&B.distance(e,ev.target)<140).forEach(e=>B.damage(u,e,u.st.atk*.42,{type:'physical',area:true,tag:'Riposte'}));B.removeStatus(u,'qom_resolve');});}},
 R:{name:'Curtain Call Counter',type:'Physical / Control / Support',v:{atk:.13},p:{},desc:()=>`Parries restore Energy and accelerate Royal Intervention. His guard grants stronger protection, and Royal Intervention may trigger twice. Below 35% HP once per wave, Last Stand reduces damage, then Grand Riposte punishes his strongest attacker.`,passive:(u,B,S)=>{u.flat.atkPqom=S.atk;u.flat.defPqomR=.14;u.dirty=true;B.on(u,'dealDamage',ev=>{if(ev.tag==='Perfect Parry'){B.energy(u,12);B.reduceCd(u,1.2);}});B.on(u,'allyLow',a=>{if(a!==u||u.hpPct>=.35||u._qomLastStand)return;u._qomLastStand=true;B.applyStatus(u,u,'ward',5);const foe=qomTop(qomFoes(B,u),'atk');B.fxFloatIcon(u.x,u.y-105,'LAST STAND','#e5c5ff');B.after(5,()=>{if(!u.alive||!foe||!foe.alive)return;B.blink(u,foe.x,u.depth);B.damage(u,foe,u.st.atk*3,{type:'physical',tag:'Grand Riposte'});B.heal(u,u,(u.max.hp-u.hp)*.2);B.applyStatus(u,foe,'taunt',4);Sound.play('qom_counter',{vol:.7});});});}}
};defHero(QOM_SOULVESTER);

// Connie: evasive lead guitarist who earns and spends Phantom Notes.
const QOM_CONnie=qomCommon('QOMConnie','Connie','Damage','SS','Spirit',
  {hp:4700,atk:365,def:250,mag:555,mdef:330,spd:158,acc:205,eva:285},
  {range:265,aspd:1.18,ms:102,aggro:.65,crit:.22,critDmg:1.95,healPow:1,shieldPow:1.08,cdr:.14,ccRes:.15,kbRes:.35,armorPen:.03,magPen:.16},
  {name:'Spectral Guitar',type:'magic',ratio:1.06,range:265,proj:'orb',pcol:'#ae64e6',sfx:'hit_magic',hit:'hit_magic',wind:.22},
  'A phantom lead guitarist who vanishes, reappears, and spends notes on supernatural solos.');
QOM_CONnie.skills={
 W:{name:'Queens of Mischief',type:'Magic / Physical / Control',energy:100,v:{ratio:.68},p:{},desc:()=>`Starts with 3 Phantom Notes. Every third Basic Attack and every Dodge gains another; each stored note raises Evasion. Active: vanishes and plays five soundwaves that reduce defenses, Energy and Accuracy before a finishing strike. Consuming 5 Notes Stuns enemies and heals Connie.`,passive:(u,B)=>{qomNotes(B,u,3);u._qomBasic=0;B.on(u,'basicHit',()=>{u._qomBasic++;if(u._qomBasic%3===0)qomNotes(B,u,1);});B.on(u,'dodged',ev=>{qomNotes(B,u,u.hasStatus('qom_untouchable')?2:1);if(ev.src&&ev.src.alive)B.damage(u,ev.src,u.st.mag*.36,{type:'magic',tag:'Phantom Note'});});B.on(u,'enemyCast',e=>{if(e.hasStatus('qom_possessed')){B.damage(u,e,u.st.mag*.55,{type:'magic',tag:'Possessed Performance'});qomNotes(B,u,1);}});B.on(u,'dealDamage',ev=>{if(ev.target&&ev.target.hasStatus('qom_possessed')&&B.t>(u._qomPossessAt||0)){u._qomPossessAt=B.t+1;B.energy(u,4);qomNotes(B,u,1);}});},cast:(u,B,S)=>{u._qomWasHeadliner=qomStacks(u,'qom_notes')>=8;const spent=qomSpend(B,u,'qom_notes',5);B.applyStatus(u,u,'untargetable',1.5);Sound.play('qom_ghost',{vol:.48});B.repeat(5,.2,i=>{if(!u.alive)return;qomHitAll(B,u,S.ratio*(1+spent*.12), 'magic','Phantom Solo');qomFoes(B,u).forEach(e=>{if(i===0)B.applyStatus(u,e,'defdown',6);if(i===1)B.applyStatus(u,e,'magdown',6);if(i===2)B.energy(e,-12);if(i===3)B.applyStatus(u,e,'qom_haunted',7);if(i===4&&spent>=5)B.applyStatus(u,e,'stun',2);});});B.after(1.15,()=>{if(u.alive){B.removeStatus(u,'untargetable');if(spent>=5)B.heal(u,u,(u.max.hp-u.hp)*.20);}});}},
 G:{name:'Haunting Escape',type:'Evasion / Magic / Control',cd:11,v:{ratio:1.65},p:{dur:4},desc:()=>`Becomes invisible and untargetable for 4 seconds, gaining speed and Skill Haste. Reappears behind the strongest foe, haunting them. At 5 Notes, spends 2 for a second Energy-draining, Silencing hit.`,cast:(u,B,S,P)=>{B.applyStatus(u,u,'untargetable',P.dur);B.applyStatus(u,u,'speedup',P.dur);B.applyStatus(u,u,'haste',P.dur);Sound.play('qom_ghost',{vol:.4});B.after(P.dur,()=>{if(!u.alive)return;B.removeStatus(u,'untargetable');const t=qomTop(qomFoes(B,u),'atk');if(!t)return;B.blink(u,t.x+u.face*36,u.depth);B.damage(u,t,u.st.mag*S.ratio,{type:'magic',tag:'Haunting Escape'});B.applyStatus(u,t,'qom_haunted',8);if(qomStacks(u,'qom_notes')>=5){qomSpend(B,u,'qom_notes',2);B.damage(u,t,u.st.mag*.85,{type:'magic',tag:'Phantom Strike'});B.energy(t,-20);B.applyStatus(u,t,'silence',1.4);}});}},
 B:{name:'Possessed Performance',type:'Magic / Control / Support',cd:12,v:{ratio:1.25},p:{dur:6},desc:()=>`Possesses the highest-Skill-Power foe. Their Attack Speed and Skill Haste fall; using a Skill triggers spectral damage. Damage against the victim grants Connie Energy and Phantom Notes. At 6 Notes, extends the possession.`,cast:(u,B,S,P)=>{const t=qomTop(qomFoes(B,u),'mag');if(!t)return;const extend=qomStacks(u,'qom_notes')>=6;if(extend)qomSpend(B,u,'qom_notes',3);B.applyStatus(u,t,'qom_possessed',P.dur+(extend?3:0));B.damage(u,t,u.st.mag*S.ratio,{type:'magic',tag:'Possessed Performance'});Sound.play('qom_ghost',{vol:.4});}},
 P:{name:"Can't Hit a Ghost",type:'Evasion / Magic / Control',v:{eva:.20},p:{},desc:()=>`Gains Evasion. Once every 6 seconds a Basic Attack can pass through her, causing a teleporting Phantom Counter and Haunted. Three Dodges grant a short Untouchable state with stronger counters and healing.`,passive:(u,B,S)=>{u.flat.evaPqom=S.eva;u.dirty=true;u.dodgeGuard=ev=>{if(!ev.basic||B.t<(u._qomPhaseAt||0))return false;u._qomPhaseAt=B.t+6;return true;};B.on(u,'dodged',ev=>{if(!ev.src||!ev.src.alive)return;u._qomDodges=(u._qomDodges||0)+1;B.blink(u,ev.src.x+u.face*25,u.depth);B.damage(u,ev.src,u.st.mag*.75,{type:'magic',tag:'Phantom Counter'});B.applyStatus(u,ev.src,'qom_haunted',6);if(u.hasStatus('qom_untouchable'))B.heal(u,u,u.max.hp*.045);if(u._qomDodges>=3&&B.t>(u._qomUntouchableAt||0)){u._qomDodges=0;u._qomUntouchableAt=B.t+15;B.applyStatus(u,u,'qom_untouchable',5);}});}},
 R:{name:'Grand Finale',type:'Magic / Control / Support',v:{mag:.16},p:{},desc:()=>`At 4, 6 and 8 Notes gains Attack and Haste, stronger Phantom Counters, then Spectral Headliner. Once per wave, using Queens of Mischief at 8 Notes triggers Ghostly Ovation: team buffs, extra soundwaves, a stunning final chord and a Shield.`,passive:(u,B,S)=>{u.flat.magPqom=S.mag;u.flat.critDmgqom=.24;u.dirty=true;B.on(u,'cast',ev=>{if(ev.key!=='W'||u._qomOvation||!u._qomWasHeadliner)return;u._qomOvation=true;B.after(.2,()=>{if(!u.alive)return;B.fxFloatIcon(u.x,u.y-115,'GHOSTLY OVATION','#dba5ff');qomAllies(B,u).forEach(a=>{B.applyStatus(u,a,'atkup',10);B.applyStatus(u,a,'haste',10);B.applyStatus(u,a,'speedup',10);});B.repeat(3,.26,()=>qomHitAll(B,u,.48,'magic','Ghostly Ovation','qom_haunted',6));B.after(.9,()=>{qomHitAll(B,u,1.7,'magic','Final Chord');qomFoes(B,u).forEach(e=>B.applyStatus(u,e,'stun',1.3));B.shield(u,u,u.max.hp*.20,7);qomNotes(B,u,4);B.applyStatus(u,u,'qom_headliner',6);});});});}}
};defHero(QOM_CONnie);

/* Shared combat hooks that make the performance meters matter between casts. */
const qomGourdyWhite=QOM_GOURDY.skills.W.passive;
QOM_GOURDY.skills.W.passive=(u,B,S,P)=>{
  qomGourdyWhite(u,B,S,P);
  B.on(u,'allyCast',a=>{if(a.hasStatus('qom_treat')&&B.t>(a._qomTreatBeatAt||0)){a._qomTreatBeatAt=B.t+.7;qomBeat(u,B);}});
};
QOM_ECLIPSE.basic.onHit=(u,t,B)=>{
  u._qomGuitarSwing=(u._qomGuitarSwing||0)+1;
  if(u._qomGuitarSwing%2===0&&t.alive)B.damage(u,t,u.st.mag*.34,{type:'magic',tag:'Guitar Swing'});
};
const qomEclipseWhite=QOM_ECLIPSE.skills.W.passive;
QOM_ECLIPSE.skills.W.passive=(u,B,S,P)=>{
  qomEclipseWhite(u,B,S,P);
  B.on(u,'basicHit',ev=>{
    const n=qomStacks(u,'qom_amp');
    if(n>=4)qomFoes(B,u).filter(e=>e!==ev.target&&B.distance(e,ev.target)<140)
      .forEach(e=>B.damage(u,e,u.st.mag*.26,{type:'magic',area:true,tag:'Guitar Splash'}));
    if(n>=15&&ev.target&&ev.target.alive)B.damage(u,ev.target,u.st.mag*.45,{type:'magic',tag:'Headliner Double'});
  });
  B.on(u,'enemyCast',e=>{
    if(!e.hasStatus('qom_feedback'))return;
    B.damage(u,e,u.st.mag*.55,{type:'magic',tag:'Feedback'});
    qomAmp(B,u,1);
  });
  B.on(u,'dealDamage',ev=>{
    if(ev.src===u&&ev.target&&ev.target.team!==u.team&&qomStacks(u,'qom_amp')>=10&&!ev.reflected)
      B.heal(u,u,Math.min(u.max.hp*.03,ev.amount*.06),{silent:true,tag:'Full Volume'});
  });
  B.on(u,'damaged',ev=>{
    if(!ev.src||!ev.src.hasStatus('qom_feedback')||ev.reflected||B.t<(u._qomFeedbackCounterAt||0))return;
    u._qomFeedbackCounterAt=B.t+.75;
    B.damage(u,ev.src,u.st.mag*.75,{type:'magic',reflected:true,tag:'Feedback Counter'});
    B.shield(u,u,u.max.hp*.09,5);
    if(ev.src.hpPct<.5)B.applyStatus(u,ev.src,'stun',.7);
  });
};
const qomEclipsePurple=QOM_ECLIPSE.skills.P.passive;
QOM_ECLIPSE.skills.P.passive=(u,B,S,P)=>{
  qomEclipsePurple(u,B,S,P);
  u.guards.push((id,d)=>{
    if(id!=='stun'||qomStacks(u,'qom_amp')<10||B.t<(u._qomStunCounterAt||0))return false;
    u._qomStunCounterAt=B.t+8;qomSpend(B,u,'qom_amp',2);
    const t=qomTop(qomFoes(B,u),'atk');
    if(t)B.damage(u,t,u.st.atk*.75,{type:'physical',tag:'Stun Reversal'});
    return true;
  });
};
const qomEclipseBlue=QOM_ECLIPSE.skills.B.cast;
QOM_ECLIPSE.skills.B.cast=(u,B,S,P)=>{
  u._qomRiffUntil=B.t+1.2;
  qomEclipseBlue(u,B,S,P);
  if(u.hpPct<.5){B.applyStatus(u,u,'ward',4);const t=qomTop(qomFoes(B,u),'atk');if(t)B.applyStatus(u,t,'taunt',3);}
};
const qomEclipseRed=QOM_ECLIPSE.skills.R.passive;
QOM_ECLIPSE.skills.R.passive=(u,B,S,P)=>{
  qomEclipseRed(u,B,S,P);
  B.on(u,'enemyDown',e=>{
    if(qomStacks(u,'qom_amp')>=15){qomHitAll(B,u,.42,'magic','Headliner KO');B.energy(u,10);}
    if(e._lastHitBy===u&&B.t<(u._qomRiffUntil||0)){B.energy(u,16);B.heal(u,u,(u.max.hp-u.hp)*.08);}
  });
  B.on(u,'dealDamage',ev=>{if(ev.crit&&qomStacks(u,'qom_amp')>=14){B.energy(u,3);B.reduceCd(u,.2);}});
};
const qomRibeccaWhite=QOM_RIBECCA.skills.W.passive;
QOM_RIBECCA.skills.W.passive=(u,B,S,P)=>{
  qomRibeccaWhite(u,B,S,P);
  B.on(u,'allyDamaged',ev=>{
    if(!ev.src||!ev.unit||ev.unit===u)return;
    if(ev.unit.shields&&ev.unit.shields.some(sh=>sh.src===u)){
      if(B.t<(ev.unit._qomShieldCounterAt||0))return;
      ev.unit._qomShieldCounterAt=B.t+.6;
      B.damage(u,ev.src,u.st.mag*.33,{type:'magic',reflected:true,tag:'Keytar Barrier'});
      B.applyStatus(u,ev.src,'attackdown',5,{val:.10});
      B.applyStatus(u,ev.src,'armslow',4);
    }
  });
};
QOM_CONnie.basic.onHit=(u,t,B)=>{
  u._qomSpectralStrike=(u._qomSpectralStrike||0)+1;
  if(u._qomSpectralStrike%2===0&&t.alive)
    B.damage(u,t,u.st.atk*.42,{type:'physical',tag:'Guitar Strike'});
};
const qomConnieRed=QOM_CONnie.skills.R.passive;
QOM_CONnie.skills.R.passive=(u,B,S,P)=>{
  qomConnieRed(u,B,S,P);
  B.on(u,'basicHit',ev=>{
    if(qomStacks(u,'qom_notes')<8&&!u.hasStatus('qom_headliner'))return;
    const other=qomFoes(B,u).find(e=>e!==ev.target);
    if(other&&Math.random()<.35)B.damage(u,other,u.st.mag*.38,{type:'magic',tag:'Spectral Headliner'});
  });
  B.on(u,'dealDamage',ev=>{
    if(ev.tag!=='Phantom Counter'||qomStacks(u,'qom_notes')<6||!ev.target)return;
    B.energy(ev.target,-9);
    ev.armorPen=(ev.armorPen||0)+.16;
  });
};

// Short vocal calls belong to a few featured player Skills. The event enemies
// keep their existing audio and combat behavior.
function qomPlayerVocal(hero, key, cue) {
  const cast = hero.skills[key].cast;
  hero.skills[key].cast = (u, B, S, P) => {
    if (u.team === TEAM_P) Sound.play(cue, { vol: .55, throttle: 4200 });
    return cast(u, B, S, P);
  };
}
qomPlayerVocal(QOM_ECLIPSE, 'B', 'qom_hey');
