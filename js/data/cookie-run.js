/* Cookie Run collaboration: authored combat kits and encounter-only creatures. */
'use strict';
const COOKIE_HERO_IDS = ['GingerBrave', 'GingerBright', 'ShadowMilkCookie', 'CreamPuffCookie', 'TigerLilyCookie', 'PureVanillaCookie'];
const COOKIE_BRIGHT_ANIMS = {
 idle:'uploads/gingerbrightidle.gif', attack:'uploads/gingerbrightattack.gif',
 skill2:'uploads/gingerbrightskill2.gif', skill3:'uploads/gingerbrightskill3.gif'
};
const COOKIE_VANILLA_ANIMS = {
 idle:'uploads/purevanillacookieidle.gif', run:'uploads/purevanillacookierun.gif',
 skill1:'uploads/purevanillacookieskill1.gif', skill2:'uploads/purevanillacookieskill2.gif', skill3:'uploads/purevanillacookieskill3.gif'
};
const COOKIE_TIGER_ANIMS = {
 idle:'uploads/tigerlilyidle.gif', run:'uploads/tigerlilyrun.gif', skill:'uploads/tigerlilyskill1.gif',
 mountedIdle:'uploads/tigerlilyidletrans.gif', mountedRun:'uploads/tigerlilyruntrans.gif', mountedSkill:'uploads/tigerlilyskilltrans.gif'
};
const COOKIE_CREAM_ANIMS = {
 idle:'uploads/creampuffidle.gif', run:'uploads/creampuffrun.gif',
 skill1:'uploads/creampuffskill1.gif', skill2:'uploads/creampuffskill2.gif'
};
const COOKIE_BRAVE_ANIMS = {
 idle: 'uploads/gingerbraveidle.gif',
 run: 'uploads/gingerbraverun.gif',
 attack: 'uploads/gingerbraveattack.gif'
};
const COOKIE_ENEMY_IDS = ['BerryBishop','BerryHealingBot','PomegranateSnake','CookieScorpion','DangerInTheBox','PaperPuppetKnight','SkelecakeCook'];
const COOKIE_ART = {
 GingerBrave:'uploads/image-81.png', GingerBright:COOKIE_BRIGHT_ANIMS.idle, ShadowMilkCookie:'uploads/Shadow_milk_idle.gif', CreamPuffCookie:COOKIE_CREAM_ANIMS.idle, TigerLilyCookie:COOKIE_TIGER_ANIMS.idle, PureVanillaCookie:COOKIE_VANILLA_ANIMS.idle,
 BerryBishop:'uploads/image-88.png', BerryHealingBot:'uploads/image-88.png',
 PomegranateSnake:'uploads/pomegrantesnake.png', CookieScorpion:'uploads/scorpion.png',
 DangerInTheBox:'uploads/dangerinabox.png', PaperPuppetKnight:'uploads/paperpuppetknight.png', SkelecakeCook:'uploads/Skelecake_Cook.png'
};
Object.entries(COOKIE_ART).forEach(([id,path])=>{SPECIAL_HERO_ART[id]=path;SPECIAL_HERO_ICONS[id]=path;SPECIAL_TWISTED_ART[id]=path;});
Object.assign(STATUS, {
 cookie_brave: {icon:'🍬',name:'Indomitable Will',kind:'buff',desc:'Critical Hit chance rises after Never Back Down!.',mods:(m,s)=>{m.crit+=s.val??.30;}},
 cookie_overflow:{icon:'🔥',name:'Overflowing Courage',kind:'buff',desc:'Movement Speed and Basic Attack damage rise after Never Back Down!.',mods:(m,s)=>{m.msP+=s.src?._cookieOverflowSpeed??.25;},onDealDamage:(u,s,e)=>{if(e.basic)e.amount*=1+(s.src?._cookieOverflowBasic??.25);}},
 cookie_victory:{icon:'⚡',name:'Never Back Down!',kind:'buff',desc:'Movement Speed and Attack Speed rise after a knockout.',mods:(m,s)=>{m.msP+=s.src?._cookieVictoryMove??.25;m.aspdP+=s.src?._cookieVictoryAttackSpeed??.15;}},
 status_corruption:{icon:'🎭',name:'Status Corruption',kind:'debuff',max:10,desc:'Each stack reduces healing received and Skill Haste by 10%.',mods:(m,s)=>{m.healRecv-=.1*s.stacks;m.cdr-=.1*s.stacks;}}
});
function cookieFoes(u,B){return B.enemiesOf(u).filter(e=>B.isTargetable(e));}
function cookieSay(u,B,text){
 if(B.offscreen)return;
 const anchor=B.unitFxAnchor(u);
 const bubble=FX.heroDialogue(anchor.x,anchor.y+anchor.size*.42,text,{owner:u,face:u.face,size:anchor.size,duration:3600});
 if(bubble)bubble.classList.add('cookie-battle-speech');
}
function cookieBrave(u,B){if(u.rarity>=4)B.applyStatus(u,u,'cookie_brave',u._cookieWillDur||10,{val:u._cookieWillCrit||.30});}
function cookieHit(u,B,t,ratio,tag,extra){
 const hit=B.damage(u,t,u.st.atk*ratio,Object.assign({type:'physical',tag},extra||{}));
 if(hit&&u.id==='GingerBrave')Sound.play('cookie_brave_skill_hit',{vol:.48});
 return hit;
}
function cookieDash(u,B,ultimate,ratio,P={}){
 const foes=cookieFoes(u,B);if(!foes.length)return;
 const from=u.x,far=foes.reduce((a,b)=>Math.abs(b.x-from)>Math.abs(a.x-from)?b:a);
 const to=far.x+u.face*50;
 const path=foes.filter(t=>t.x>=Math.min(from,to)-35&&t.x<=Math.max(from,to)+35&&Math.abs(t.depth-far.depth)*B.depthSpan<145);
 u._braveDashAt=B.t;
 if(!ultimate&&P.follow){u._cookieDashFollowupUntil=B.t+P.follow;u._cookieDashFollowupRatio=ratio*.65;}
 B.dash(u,to,.55,{depth:far.depth});
 (path.length?path:[far]).forEach((t,i)=>B.after(.12+i*.055,()=>{
  if(!u.alive||!t.alive)return;
  const hit=cookieHit(u,B,t,ratio*.8,ultimate?'Never Back Down!':'Brave Dash');
  B.fxRing(t.x,t.y-30,88,'#ffce77',.24);
  if(hit&&t.alive)B.knockback(u,t,P.kb||75);
 }));
 if(!ultimate)return;
 cookieSay(u,B,'Never back down!');
 B.after(.65,()=>{if(u.alive)B.leap(u,u.x,.3,null,u.depth);});
 B.after(.95,()=>{
  if(!u.alive)return;
  B.anim(u,'attack',1.04);B.fxRing(u.x,u.y-25,190,'#ffcf73',.5);B.shake(7,.2);Sound.play('cookie_cane_slam',{vol:.65});
  cookieFoes(u,B).filter(t=>B.distance(u,t)<(P.radius||220)).forEach(t=>{
   const hit=cookieHit(u,B,t,ratio*1.8,'Never Back Down!');
   if(hit&&t.alive){B.applyStatus(u,t,'stun',P.stun||1.2);B.knockback(u,t,P.kb||75);}
  });
  cookieBrave(u,B);
  if(u.rarity>=5)B.applyStatus(u,u,'cookie_overflow',u._cookieOverflowDur||8);
 });
}
function cookieCommon(id,name,role,base,range){return {id,name,role,tier:'B',element:'Cookie',cookieRun:true,twistedOnly:!COOKIE_HERO_IDS.includes(id),folder:null,file:null,icon:id,
 base,hidden:{range,aspd:1,ms:95,aggro:1,crit:.1,critDmg:1.6,healPow:1,shieldPow:1,cdr:.04,ccRes:.12,kbRes:.2,armorPen:0,magPen:0},growth:{hp:.085,atk:.085,def:.075,mag:.085,mdef:.075},
 move:{gait:'bounce',bob:5,freq:1.8,lean:7,squash:.04,idle:'bounce',trail:{on:false},brake:.2},
 basic:{name:'Cookie Strike',type:'physical',ratio:1,range,wind:.23,sfx:'swing_light',hit:'hit_blunt'},skills:{}};}
const ginger=cookieCommon('GingerBrave','GingerBrave','Damage',{hp:4450,atk:475,def:275,mag:100,mdef:245,spd:145,acc:215,eva:170},85);
ginger.tier='B';
ginger.blurb='He runs straight at trouble and makes room for the team with his candy cane.';
ginger.basic.name='Candy Cane Attack';
ginger.basic.onStart=u=>{if(u.rarity>=4){u._cookieBasics=(u._cookieBasics||0)+1;u._cookiePurpleThird=u._cookieBasics%3===0;}};
ginger.skills={
 W:{
  name:'Never Back Down!',type:'Physical Damage / Control',energy:100,
  v:{ratio:2.1,shred:.25},p:{stun:1.5,kb:110,radius:240,victoryDur:6,victoryMove:.30,victoryAttackSpeed:.20},
  desc:(S,P)=>`At the start of each wave, GingerBrave dashes through enemies, knocking them aside. Active: he charges through the enemy frontline, leaps, and lands an earth-shattering candy cane slam for <em>${pcn(S.ratio * 100)}</em> Physical Damage. The slam Stuns enemies for ${P.stun.toFixed(1)}s, knocks them back ${P.kb}px, and shreds their Armor by <em>${pcn(S.shred * 100)}</em> for 6s within ${P.radius}px. Scoring a knockout grants +${Math.round(P.victoryMove*100)}% Movement Speed and +${Math.round(P.victoryAttackSpeed*100)}% Attack Speed for ${P.victoryDur.toFixed(1)}s.`,
  passive:(u,B,S,P)=>{
   u._braveDashAt=-99;
   u._cookieVictoryMove=P.victoryMove;u._cookieVictoryAttackSpeed=P.victoryAttackSpeed;
   B.after(.7,()=>{if(u.alive)cookieDash(u,B,false,S.ratio*.5,P);});
   B.on(u,'defeatedEnemy',()=>{B.applyStatus(u,u,'cookie_victory',P.victoryDur);cookieSay(u,B,"Let's keep going!");});
   B.on(u,'basicHit',e=>{
    if(B.t>(u._cookieDashFollowupUntil||0))return;
    u._cookieDashFollowupUntil=0;
    B.after(.14,()=>{if(u.alive&&e.target.alive)cookieHit(u,B,e.target,u._cookieDashFollowupRatio||.9,'Candy Cane Follow-Up',{basic:true,melee:true});});
   });
  },
  cast:(u,B,S,P)=>{
   cookieDash(u,B,true,S.ratio,P);
   B.after(0.95, () => {
    if (!u.alive) return;
    cookieFoes(u, B).filter(t => B.distance(u, t) < P.radius).forEach(t => {
     B.applyStatus(u, t, 'defdown', 6, { val: S.shred });
    });
   });
  }
 },
 G:{
  name:'Brave Strike',type:'Physical Damage / Control',cd:9,
  v:{ratio:1.75},p:{radius:165,kb:90},
  desc:(S,P)=>`Slams the closest enemy with his candy cane, striking all enemies within ${P.radius}px for <em>${pcn(S.ratio * 100)}</em> Physical Damage and knocking them back. If GingerBrave dashed in the last 5 seconds, he swings twice.`,
  cast:(u,B,S,P)=>{
   const t=B.nearest(u,cookieFoes(u,B));if(!t)return;
   const followup=B.t-u._braveDashAt<=5;B.anim(u,'attack',1.04);
   B.fxRing(t.x,t.y-25,145,'#ffcf73',.3);Sound.play('cookie_cane_slam',{vol:.5});
   B.repeat(followup?2:1,.18,()=>{
    if(!u.alive)return;
    cookieFoes(u,B).filter(e=>e===t||B.distance(e,t)<P.radius).forEach(e=>{
     const hit=cookieHit(u,B,e,S.ratio*(e===t?1.4:.75),'Brave Strike');
     if(hit&&e.alive)B.knockback(u,e,e===t?P.kb:P.kb*.65);
    });
   });
  }
 },
 B:{
  name:'Did Someone Say "Run?"',type:'Physical Damage / Movement',cd:11,
  v:{ratio:1.60},p:{kb:95,follow:5},
  desc:(S,P)=>`Dashes through the enemy line, striking all targets in his path for <em>${pcn(S.ratio * 100)}</em> Physical Damage and knocking them back ${P.kb}px. His next Basic Attack within ${P.follow.toFixed(1)}s lands an extra follow-up strike.`,
  cast:(u,B,S,P)=>cookieDash(u,B,false,S.ratio,P)
 },
 P:{
  name:'OvenBreaker',type:'Physical Damage / Critical Chance',
  v:{crit:.18,extra:.85,willCrit:.35},p:{willDur:10,hits:3},
  desc:(S,P)=>`GingerBrave's indomitable courage sharpens his strikes, granting <em>${pcn(S.crit * 100)}</em> Critical Hit chance. Every ${P.hits}rd Basic Attack lands an extra devastating cane blow for <em>${pcn(S.extra * 100)}</em> Physical Damage that bypasses shields. After casting Never Back Down!, GingerBrave gains <em>${pcn(S.willCrit * 100)}</em> Critical Hit chance and +20% Critical Damage for ${P.willDur.toFixed(1)}s.`,
  passive:(u,B,S,P)=>{
   u.flat.crit71=S.crit;u._cookieWillCrit=S.willCrit;u._cookieWillDur=P.willDur;u.dirty=true;
   B.on(u,'basicHit',e=>{
    if(u._cookiePurpleThird&&e.target.alive)B.after(.12,()=>{
     if(u.alive&&e.target.alive)cookieHit(u,B,e.target,S.extra,'OvenBreaker',{basic:true,melee:true,bypassShield:true});
    });
   });
  }
 },
 R:{
  name:'Overflowing Courage',type:'Physical Damage / Movement',
  v:{atk:.20,highHp:.35,speed:.30,basic:.35},p:{dur:8,shield:.15},
  desc:(S,P)=>`GingerBrave gains <em>${pcn(S.atk * 100)}</em> Attack and deals <em>${pcn(S.highHp * 100)}</em> more damage to enemies above half HP. Whenever GingerBrave dashes through enemies or casts Never Back Down!, he gains <em>${pcn(S.speed * 100)}</em> Movement Speed, <em>${pcn(S.basic * 100)}</em> Basic Attack damage, and a Pack Bravery Shield absorbing <em>${pcn(S.shield * 100)}</em> Max HP for ${P.dur.toFixed(1)}s.`,
  passive:(u,B,S,P)=>{
   u.flat.atkP71=S.atk;u._cookieOverflowSpeed=S.speed;u._cookieOverflowBasic=S.basic;u._cookieOverflowDur=P.dur;u.dirty=true;
   B.on(u,'dealDamage',e=>{if(e.target&&e.target.hpPct>.5)e.amount*=1+S.highHp;});
   B.on(u,'cast',ev=>{
    if(ev.key==='W'||ev.key==='B'){
     B.shield(u,u,u.max.hp*P.shield,P.dur);
     B.fxFloatIcon(u.x,u.y-105,'🛡️ COURAGE SHIELD','#ffce77');
    }
   });
  }
 }
};
defHero(ginger);
const bright=cookieCommon('GingerBright','GingerBright','Damage',{hp:3650,atk:475,def:215,mag:100,mdef:235,spd:155,acc:235,eva:190},115);
bright.tier='A';bright.position='Midline';bright.roleLabel='Damage / Support';
bright.blurb='A quick lollipop fighter whose Candy Jellies power up her teammates, with Cheese Drop helping the strongest attacker.';
Object.assign(bright.hidden,{aspd:1.14,ms:125,crit:.16,critDmg:1.7,aggro:.68});
bright.basic={name:'Bright Lollipop',type:'physical',ratio:1.06,range:115,wind:.20,attackAnim:.56,sfx:'swing_light',hit:'hit_slash',pcol:'#ff9eda',onStart:(u,B)=>brightBasicStart(u,B),onHit:(u,t,B)=>brightBasicHit(u,t,B)};
bright.skills={};defHero(bright);
const milk=cookieCommon('ShadowMilkCookie','Shadow Milk Cookie','Control',{hp:3550,atk:180,def:220,mag:495,mdef:300,spd:115,acc:200,eva:150},310);
milk.tier='SS';milk.blurb='A theatrical controller who traps priority enemies, turns attacks aside, and survives one defeat through Shadow Form.';milk.basic={name:'Deceptive Spark',type:'magic',ratio:1,range:310,proj:'orb',pcol:'#67deff',wind:.25,sfx:'hit_magic'};
milk.skills={};defHero(milk);
const cream=cookieCommon('CreamPuffCookie','Cream Puff Cookie','Support',{hp:2950,atk:120,def:170,mag:565,mdef:260,spd:120,acc:210,eva:145},335);
cream.tier='SS';cream.blurb='A backline spellcaster whose Great Successes damage enemies, restore the team, and build toward her strongest spell.';
cream.position='Backline';cream.roleLabel='Support / Damage / Healer';
Object.assign(cream.hidden,{crit:.20,critDmg:1.6,healPow:1.25,cdr:.07,ms:110});
cream.basic={name:'Magic Jelly',type:'magic',ratio:.72,range:335,proj:'orb',pcol:'#ffe39a',wind:.24,sfx:'sparkle',hit:'hit_magic'};
cream.skills={};defHero(cream);
const tiger=cookieCommon('TigerLilyCookie','Tiger Lily Cookie','Damage',{hp:3150,atk:455,def:205,mag:80,mdef:205,spd:146,acc:235,eva:180},305);
tiger.tier='SS';tiger.position='Backline';tiger.roleLabel='Damage / Control';
tiger.blurb='A spear hunter who fights beside her Butter Tiger, then mounts up to break enemy lines.';
Object.assign(tiger.hidden,{aspd:1.08,crit:.17,critDmg:1.7,ms:125,kbRes:.28});
tiger.basic={name:'Wild Spear',type:'physical',ratio:1.03,range:305,proj:'spear',rangedPhysical:true,wind:.24,attackAnim:.65,sfx:'cookie_tiger_spear',hit:'hit_slash',pcol:'#ffc54f',onHit:(u,t,B)=>tigerBasicHit(u,t,B)};
tiger.skills={};defHero(tiger);
const vanilla=cookieCommon('PureVanillaCookie','Pure Vanilla Cookie','Support',{hp:3700,atk:95,def:225,mag:505,mdef:315,spd:108,acc:205,eva:135},335);
vanilla.tier='S';vanilla.position='Backline';vanilla.roleLabel='Healer / Support';
vanilla.blurb='A dedicated healer who steadies the whole team with restorative light, strong Shields, and a last-second rescue.';
Object.assign(vanilla.hidden,{aspd:.96,ms:88,aggro:.38,healPow:1.26,shieldPow:1.16,cdr:.10,ccRes:.22,kbRes:.32});
vanilla.basic={name:'Gentle Radiance',type:'magic',ratio:0,range:335,utility:true,perform:(u,B)=>vanillaBasic(u,B)};
vanilla.skills={};defHero(vanilla);
function cookieHeal(u,B,mini){const t=B.alliesOf(u).filter(a=>a.alive).sort((a,b)=>a.hpPct-b.hpPct)[0];if(!t)return;B.anim(u,'cast',.45);B.heal(u,t,u.st.mag*(mini?.65:1.8));B.fxRing(t.x,t.y-35,mini?55:90,'#ffafdb',.35);}
COOKIE_ENEMY_IDS.forEach(id=>{
 const bishop=id==='BerryBishop'||id==='BerryHealingBot',box=id==='DangerInTheBox';
 const names={BerryBishop:'Berry Bishop',BerryHealingBot:'Healing Bot',PomegranateSnake:'Pomegranate Snake',CookieScorpion:'Scorpion',DangerInTheBox:'Danger-in-the-box',PaperPuppetKnight:'Paper Puppet Knight',SkelecakeCook:'Skelecake Cook'};
 const h=cookieCommon(id,names[id],bishop?'Support':box?'Control':'Damage',{hp:box?2900:bishop?3200:3500,atk:bishop||box?0:340,def:210,mag:bishop?370:180,mdef:220,spd:100,acc:180,eva:115},bishop?500:box?500:90);
 h.blurb=bishop?'Heals the ally with the lowest percentage of HP. Cannot deal damage.':box?'On defeat, corrupts nearby enemies and releases a Paper Puppet Knight. Cannot deal damage.':'A Cookie Run weakling with the strength of a B-tier Toon.';
 if(bishop||box){h.noDamage=true;h.basic.utility=true;h.basic.ratio=0;h.basic.perform=(u,B)=>{if(bishop)cookieHeal(u,B,id==='BerryHealingBot');};h.hidden.aspd=id==='BerryHealingBot'?1.5:.55;}
 if(id==='BerryBishop')h.skills.G={name:'Healing Helpers',type:'Summon / Healing',cd:15,v:{hp:.3},p:{},desc:()=>`Summons a smaller, faster Healing Bot.`,cast:(u,B)=>{if(B.alliesOf(u).filter(a=>a.id==='BerryHealingBot').length>=2)return;const m=B.summon(u,{protoId:'BerryHealingBot',name:'Healing Bot',art:ASSET+COOKIE_ART.BerryHealingBot,hp:u.max.hp*.3,atk:0,mag:u.st.mag*.65,scale:.45,life:900,noSkills:true,noEnergy:true});m.inherit=true;}};
 if(box){h.cookieObstacle=true;h.skills.W={name:'A Parting Surprise',type:'Status Corruption / Summon',energy:100,v:{radius:240},p:{},desc:()=>`On defeat, applies two stacks of Status Corruption in medium range and spawns one Paper Puppet Knight.`,passive:(u,B)=>B.on(u,'death',()=>{cookieFoes(u,B).filter(t=>B.distance(u,t)<=240).forEach(t=>B.applyStatus(u,t,'status_corruption',10,{stacks:2}));const m=B.summon(u,{protoId:'PaperPuppetKnight',name:'Paper Puppet Knight',art:ASSET+COOKIE_ART.PaperPuppetKnight,hp:u.max.hp*1.0,atk:u.baseStats.mag*2.0,scale:.85,life:900});m.inherit=true;m.minion=false;m.owner=null;B._liveDirty=true;})};}
 if(id==='PomegranateSnake'||id==='CookieScorpion'){
  h.cookiePrey=id==='PomegranateSnake'?'Tank':'Support';h.hidden.ms=id==='CookieScorpion'?150:125;
  h.basic.onHit=(u,t,B)=>B.applyStatus(u,t,'poison',6,{val:t.max.hp*(id==='PomegranateSnake'?.012:.008)});
  h.skills.G={name:id==='PomegranateSnake'?'Venomous Pursuit':'Support Stinger',type:'Poison / Physical Damage',cd:8,v:{ratio:1.3},p:{},desc:()=>id==='PomegranateSnake'?'Hunts Tanks, poisons them, and inflicts 12% Max-HP Injury for eight seconds.':'Rushes Supports and applies stacking Poison.',cast:(u,B,S)=>{const foes=cookieFoes(u,B),t=foes.find(e=>e.role===h.cookiePrey)||B.lowestHp(foes);if(!t)return;B.dash(u,t.x-u.face*25,.25,{depth:t.depth});cookieHit(u,B,t,S.ratio,'Venom Strike');B.applyStatus(u,t,'poison',8,{stacks:3,val:t.max.hp*(id==='PomegranateSnake'?.012:.008)});if(id==='PomegranateSnake')B.applyStatus(u,t,'injury',8,{val:.12});}};
 }
 defHero(h);
});
// Loaded after base rosters are collected: expose only recruitable cookies.
COOKIE_HERO_IDS.forEach(id=>{if(!HERO_IDS.includes(id))HERO_IDS.push(id);if(!PLAYABLE_IDS.includes(id))PLAYABLE_IDS.push(id);});
