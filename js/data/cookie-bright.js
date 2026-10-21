/* GingerBright: physical combo fighter and battlefield Candy Jelly support. */
'use strict';

Object.assign(STATUS, {
  bright_candy: {icon:'🍬',name:'Candy Jelly',kind:'buff',max:5,
    desc:'Each stack increases Attack.',mods:(m,s)=>{m.atkP+=(s.src?._brightCandyAttack??.05)*s.stacks;}},
  bright_rainbow: {icon:'🌈',name:'Rainbow Candy Jelly',kind:'buff',
    desc:'Attack Speed and Movement Speed increased.',mods:(m,s)=>{m.aspdP+=s.src?._brightRainbowAttackSpeed??.15;m.msP+=s.src?._brightRainbowMovement??.20;}},
  bright_sweet: {icon:'🍭',name:'Sweet Boost',kind:'buff',
    desc:'Attack increased by Candy Jelly Parade.',mods:(m,s)=>{m.atkP+=s.val??.12;}},
  bright_crit: {icon:'✨',name:'Candy Focus',kind:'buff',
    desc:'Critical Hit chance increased after Candy Jelly Parade.',mods:(m,s)=>{m.crit+=s.val??.10;}},
  bright_haste: {icon:'🧀',name:'Cheese Drop Haste',kind:'buff',
    desc:'Skill Haste increased by Cheese Drop.',mods:(m,s)=>{m.cdr+=s.val??.15;}},
  bright_evasion: {icon:'🌈',name:'Cheese Drop Guard',kind:'buff',
    desc:'Evasion increased by Cheese Drop.',mods:(m,s)=>{m.evaP+=s.val??.20;}},
  bright_spirit: {icon:'💖',name:'Bright Spirit',kind:'buff',max:6,
    desc:'Attack increased per stack.',mods:(m,s)=>{m.atkP+=(s.src?._brightSpiritAttack??.04)*s.stacks;}},
  bright_wonder: {icon:'🌈',name:'Wonderful Surprise',kind:'buff',
    desc:'Attack, Attack Speed, and Movement Speed increased.',
    mods:(m,s)=>{m.atkP+=s.src?._brightWonderAttack??.25;m.aspdP+=s.src?._brightWonderAttackSpeed??.20;m.msP+=s.src?._brightWonderMovement??.20;}},
  bright_wonder_crit: {icon:'🍭',name:'Wonderful Critical',kind:'buff',
    desc:'Critical Damage increased during Wonderful Surprise.',mods:(m,s)=>{m.critDmg+=s.src?._brightWonderCritDamage??.30;}}
});

function brightAllies(u,B){return B.alliesOf(u).filter(a=>a.alive&&!a.minion);}
function brightFoes(u,B){return B.enemiesOf(u).filter(e=>B.isTargetable(e));}
function brightHit(u,B,t,ratio,tag,opt){
  return B.damage(u,t,u.st.atk*ratio*(u.rarity>=5&&tag.startsWith('Bright Attack')?1+(u._brightWhiteBoost||.12):1),Object.assign({type:'physical',tag},opt||{}));
}
function brightPose(u,B,pose,duration){u._brightPose=pose;u._brightPoseUntil=B.t+duration;B.anim(u,'attack',Math.min(duration,.9));}
function brightFx(B,a,label){if(!B.offscreen)B.fxFloatIcon(a.x,a.y-100,label,'#ffe28b');}

function brightExpireJelly(u,jelly){
  if(jelly.consumed)return;
  jelly.consumed=true;
  jelly.node?.remove();
  if(u._brightJellies)u._brightJellies=u._brightJellies.filter(j=>j!==jelly);
}
function brightGenerated(u,B){
  u._brightGenerated=(u._brightGenerated||0)+1;
  if(u.rarity>=5&&u._brightGenerated>=15&&!u._brightWonderUsed)brightWonderful(u,B);
}
function brightCollect(u,B,jelly,ally){
  brightExpireJelly(u,jelly);
  if(jelly.kind==='rainbow'){
    B.shield(u,ally,ally.max.hp*(u._brightCheeseGuardShield||.18),u._brightCheeseGuardDur||6);
    B.applyStatus(u,ally,'bright_evasion',u._brightCheeseGuardDur||6,{val:u._brightCheeseEvasion||.20});
  }else if(jelly.kind==='parade'){
    const p=jelly.parade;
    if(ally.hpPct<.5)B.shield(u,ally,ally.max.hp*p.guard,6);
    else if(ally.energy<ally.energyMax*.5)B.energy(ally,p.energy+(u.rarity>=5?(u._brightRedJellyEnergy||0):0));
    else B.applyStatus(u,ally,'bright_sweet',p.sweetDur,{val:p.sweetAttack});
    if(jelly.parade){
      jelly.parade.collected.add(ally.uid);
      if(jelly.parade.collected.size>=3&&!jelly.parade.rewarded){
        jelly.parade.rewarded=true;B.applyStatus(u,u,'bright_sweet',p.sweetDur,{val:p.sweetAttack});brightFx(B,u,'SWEET BOOST');
      }
    }
  }else{
    B.applyStatus(u,ally,'bright_candy',7);
    B.energy(ally,(u._brightCandyEnergy||8)+(u.rarity>=5?(u._brightRedJellyEnergy||0):0));
  }
  if(u.rarity>=5&&jelly.kind==='parade')B.applyStatus(u,ally,'bright_crit',u._brightParadeCritDur||6,{val:u._brightParadeCrit||.10});
  if(u.rarity>=4){
    if(ally===u)u._brightNextBasicBonus=true;
    else{
      const max=u.rarity>=5?6:5;
      if((u.getStatus('bright_spirit')?.stacks||0)<max)B.applyStatus(u,u,'bright_spirit',999);
    }
  }
  if(!B.offscreen)B.fxRing(ally.x,ally.y-46,50,jelly.kind==='parade'?'#ffabdf':'#ffe194',.25);
  Sound.play('sparkle',{vol:.16,throttle:180});
}
function brightDrop(u,B,ally,kind='normal',parade=null){
  if(!u.alive||!ally?.alive)return;
  const jelly={x:Math.max(B.leftWall+25,Math.min(B.rightWall-25,ally.x+(Math.random()-.5)*76)),
    y:ally.y-48,depth:ally.depth,kind,parade,at:B.t+.24,until:B.t+8,consumed:false,node:null};
  if(!B.offscreen&&FX.front){
    const node=document.createElement('div');node.className='bright-jelly'+(kind==='parade'?' parade':'');
    node.style.left=jelly.x+'px';node.style.top=jelly.y+'px';node.setAttribute('aria-hidden','true');
    FX.front.appendChild(node);jelly.node=node;
  }
  (u._brightJellies||(u._brightJellies=[])).push(jelly);
  brightGenerated(u,B);
  B.after(8.1,()=>brightExpireJelly(u,jelly));
  return jelly;
}
function brightScatter(u,B,count,kind='normal',parade=null){
  const allies=brightAllies(u,B);if(!allies.length)return;
  for(let i=0;i<count;i++){
    const index=u._brightScatterCursor%allies.length;u._brightScatterCursor++;
    brightDrop(u,B,allies[index],kind,parade);
  }
}
function brightRainbow(u,B,allies,duration=8){
  brightGenerated(u,B);
  allies.filter(a=>a.alive).forEach(a=>{
    B.applyStatus(u,a,'bright_rainbow',duration);
    if(!B.offscreen)B.fxRing(a.x,a.y-45,75,'#ffcbec',.36);
  });
  brightFx(B,u,'RAINBOW CANDY');
}
function brightWonderful(u,B){
  if(u._brightWonderUsed||!u.alive)return;
  const duration=u._brightWonderDuration||10;
  u._brightWonderUsed=true;u._brightWonderUntil=B.t+duration;
  brightPose(u,B,'skill3',1.15);brightFx(B,u,'WONDERFUL SURPRISE!');
  if(!B.offscreen&&FX.front){
    const giant=document.createElement('div');giant.className='bright-giant-jelly';giant.setAttribute('aria-hidden','true');
    giant.style.left=B.centerX()+'px';giant.style.top=(u.y-155)+'px';FX.front.appendChild(giant);
    B.after(1.15,()=>giant.remove());
  }
  brightFoes(u,B).forEach(e=>{brightHit(u,B,e,u._brightWonderBurst||1.75,'Wonderful Surprise',{area:true});B.fxRing(e.x,e.y-45,100,'#ffe684',.42);});
  brightAllies(u,B).forEach(a=>B.applyStatus(u,a,'bright_wonder',duration));
  B.applyStatus(u,u,'bright_wonder_crit',duration);
  Sound.play('sparkle',{vol:.7,throttle:200});
}
function brightBasicStart(u,B){
  u._brightBasicCount=(u._brightBasicCount||0)+1;
  u._brightSpinBasic=u._brightBasicCount%3===0;
  u._brightCurrentBasicBonus=!!u._brightNextBasicBonus;
  u._brightNextBasicBonus=false;
  if(u._brightSpinBasic&&(u._brightBasicDrops||0)<8){
    const allies=brightAllies(u,B);
    if(allies.length){brightDrop(u,B,allies[Math.floor(Math.random()*allies.length)]);u._brightBasicDrops++;}
  }
}
function brightBasicHit(u,t,B){
  if(!u._brightSpinBasic)return;
  brightPose(u,B,'attack',.45);
  brightFoes(u,B).filter(e=>e!==t&&B.distance(e,t)<110).forEach(e=>brightHit(u,B,e,.65,'Bright Spin',{area:true,basic:true,melee:true}));
  B.fxRing(t.x,t.y-44,122,'#ffcce7',.28);
  const max=u.rarity>=5?6:5;
  if(u.rarity>=4&&(u.getStatus('bright_spirit')?.stacks||0)>=max){
    brightFoes(u,B).filter(e=>B.distance(e,t)<150).forEach(e=>brightHit(u,B,e,(u._brightSpiritBurst||.78)+(u.rarity>=5?(u._brightRedSpiritBonus||.30):0),'Bright Spirit Burst',{area:true}));
    const low=brightAllies(u,B).sort((a,b)=>a.energy-b.energy)[0];if(low)B.energy(low,100);
    B.removeStatus(u,'bright_spirit');brightFx(B,u,'BRIGHT SPIRIT');
  }
}
function brightCheeseEnd(u){const cheese=u._brightCheese;if(!cheese)return;cheese.node?.remove();u._brightCheese=null;}
function brightCheeseActive(u,B){return !!(u._brightCheese&&B.t<u._brightCheese.until&&u._brightCheese.ally.alive);}
function brightCheeseGuard(u,B,cheese){
  if(!cheese||cheese.lowUsed||!u.alive||!cheese.ally.alive||cheese.ally.hpPct>=.4)return;
  cheese.lowUsed=true;
  const jelly=brightDrop(u,B,cheese.ally,'rainbow');
  if(jelly)brightCollect(u,B,jelly,cheese.ally);
  brightFx(B,cheese.ally,'RAINBOW GUARD');
}

HEROES.GingerBright.skills={
 W:{name:'Bright Attack',type:'Physical Damage / Support',energy:100,v:{ratio:.49,finale:1.1},p:{jellyCap:8,rainbow:8,candyAttack:.05,candyEnergy:8,rainbowAttackSpeed:.15,rainbowMovement:.20},fixedP:['jellyCap'],
  desc:(S,P)=>`Basic Attacks use two quick lollipop strikes followed by a nearby spinning hit. Every third Basic creates a Candy Jelly, up to ${P.jellyCap} per wave. A normal Jelly grants ${Math.round(P.candyAttack*100)}% Attack and ${Math.round(P.candyEnergy)} Energy. Active: leap to the closest foe for six rapid hits; every successful hit creates a Jelly. The final hit deals ${Math.round(S.finale*100)}% Attack area damage and knocks nearby enemies back. If all six connect, the team gains ${Math.round(P.rainbowAttackSpeed*100)}% Attack Speed and ${Math.round(P.rainbowMovement*100)}% Movement Speed for ${P.rainbow.toFixed(1)}s.`,
  passive(u,B,S,P){
    u._brightBasicCount=0;u._brightBasicDrops=0;u._brightGenerated=0;u._brightScatterCursor=0;u._brightWonderUsed=false;u._brightJellies=[];
    u._brightCandyAttack=P.candyAttack;u._brightCandyEnergy=P.candyEnergy;u._brightRainbowAttackSpeed=P.rainbowAttackSpeed;u._brightRainbowMovement=P.rainbowMovement;
    B.every(u,.15,()=>{
      if(!u.alive||!u._brightJellies?.length)return;
      const allies=brightAllies(u,B);
      u._brightJellies.slice().forEach(j=>{
        if(j.consumed||B.t<j.at)return;
        if(B.t>=j.until){brightExpireJelly(u,j);return;}
        const near=allies.filter(a=>B.distance(a,j)<75).sort((a,b)=>B.distance(a,j)-B.distance(b,j))[0];
        if(near)brightCollect(u,B,j,near);
      });
    });
    B.on(u,'death',()=>{u._brightJellies.forEach(j=>j.node?.remove());u._brightJellies=[];brightCheeseEnd(u);});
    B.on(u,'enemyDown',e=>{if(B.t<(u._brightWonderUntil||0)&&e?._lastHitBy?.team===u.team&&e._lastHitBy.alive)B.energy(e._lastHitBy,u._brightWonderKillEnergy||14);});
    B.every(u,.15,()=>{
      const cheese=u._brightCheese;if(!cheese)return;
      if(!u.alive||!cheese.ally.alive||B.t>=cheese.until){brightCheeseEnd(u);return;}
      if(cheese.node){cheese.node.style.left=(cheese.ally.x+25)+'px';cheese.node.style.top=(cheese.ally.y-105)+'px';}
      if(B.t>=cheese.nextJelly){brightDrop(u,B,cheese.ally);cheese.nextJelly=B.t+cheese.every;}
      brightCheeseGuard(u,B,cheese);
    });
    B.on(u,'allyLow',ally=>{const cheese=u._brightCheese;if(brightCheeseActive(u,B)&&cheese.ally===ally)brightCheeseGuard(u,B,cheese);});
    B.on(u,'allyBasic',ev=>{
      const cheese=u._brightCheese;
      if(!brightCheeseActive(u,B)||ev?.unit!==cheese.ally||B.t-cheese.lastAssist<cheese.assistEvery)return;
      const target=ev.target?.alive?ev.target:B.nearest(cheese.ally,brightFoes(u,B));if(!target)return;
      cheese.lastAssist=B.t;brightHit(u,B,target,cheese.assist,'Cheese Drop');
      if(cheese.node){cheese.node.style.left=target.x+'px';cheese.node.style.top=(target.y-55)+'px';}
      B.fxRing(target.x,target.y-42,58,'#ffe383',.25);
    });
    B.on(u,'allySkillStarting',ev=>{
      const cheese=u._brightCheese;
      if(!brightCheeseActive(u,B)||ev?.unit!==cheese.ally)return;
      brightDrop(u,B,cheese.ally);B.applyStatus(u,cheese.ally,'bright_haste',cheese.haste,{val:cheese.hastePower});
    });
  },
  cast(u,B,S,P){
    const t=B.nearest(u,brightFoes(u,B));if(!t)return;
    brightPose(u,B,'attack',1.1);B.leap(u,t.x-u.face*36,.27,null,t.depth);
    let landed=0;
    for(let i=0;i<6;i++)B.after(.30+i*.115,()=>{
      if(!u.alive)return;
      const target=t.alive?t:B.nearest(u,brightFoes(u,B));if(!target)return;
      const hit=brightHit(u,B,target,i===5?S.finale:S.ratio,'Bright Attack',{area:i===5});
      if(hit){landed++;brightScatter(u,B,1);B.fxRing(target.x,target.y-45,i===5?128:54,'#ffacd5',.22);}
      if(i===5){
        const center={x:target.x,depth:target.depth};
        if(hit&&target.alive)B.knockback(u,target,70);
        brightFoes(u,B).filter(e=>e!==target&&B.distance(e,center)<145).forEach(e=>{
          const splash=brightHit(u,B,e,S.finale*.55,'Bright Attack Finale',{area:true});
          if(splash&&e.alive)B.knockback(u,e,70);
        });
        if(hit&&u.rarity>=5)brightScatter(u,B,2);
        if(landed===6)brightRainbow(u,B,brightAllies(u,B),P.rainbow);
      }
    });
  }},
 G:{name:'Candy Jelly Parade',type:'Physical Damage / Support',cd:10,v:{ratio:1.25},p:{sweet:7,sweetAttack:.12,guard:.11,energy:20},
  desc:(S,P)=>`Dashes through the enemy formation for ${Math.round(S.ratio*100)}% Attack damage per foe and scatters Candy Jellies. A pickup gives an ally below half HP a ${Math.round(P.guard*100)}% Max-HP Shield, restores ${Math.round(P.energy)} Energy below half Energy, or grants +${Math.round(P.sweetAttack*100)}% Attack for ${P.sweet.toFixed(1)}s. If three different allies collect Jellies, GingerBright gains Sweet Boost too. At Red rarity, pickups also grant Critical Hit chance.`,
  cast(u,B,S,P){
    const foes=brightFoes(u,B);if(!foes.length)return;
    const from=u.x,far=foes.reduce((a,b)=>Math.abs(b.x-from)>Math.abs(a.x-from)?b:a);
    const to=far.x+u.face*55,parade={collected:new Set(),rewarded:false,guard:P.guard,energy:P.energy,sweetAttack:P.sweetAttack,sweetDur:P.sweet};
    brightPose(u,B,'skill2',.9);B.dash(u,to,.52,{depth:far.depth});
    for(let i=1;i<=5;i++)B.after(i*.075,()=>{
      if(!u.alive)return;
      B.fxRing(from+(to-from)*i/6,u.y-46,45,i%2?'#ffcce5':'#ffe6a3',.22);
    });
    foes.filter(e=>e.x>=Math.min(from,to)-40&&e.x<=Math.max(from,to)+40).forEach((e,i)=>B.after(.12+i*.06,()=>{
      if(!u.alive||!e.alive)return;
      brightHit(u,B,e,S.ratio,'Candy Jelly Parade',{area:true});
      B.fxRing(e.x,e.y-42,88,'#ff91d8',.26);
    }));
    const allies=brightAllies(u,B);brightScatter(u,B,Math.max(5,allies.length), 'parade',parade);
  }},
 B:{name:'Cheese Drop',type:'Physical Damage / Support',cd:16,v:{assist:.56},p:{duration:10,haste:5,hastePower:.15,every:2.5,assistEvery:.8,guardShield:.18,evasion:.20,guardDur:6},
  desc:(S,P)=>`Cheese Drop follows the highest-Attack ally for ${P.duration.toFixed(1)}s, makes a Candy Jelly every ${P.every.toFixed(1)}s, and assists their attacks for ${Math.round(S.assist*100)}% Attack damage. Their Skills make another Jelly and grant ${Math.round(P.hastePower*100)}% Skill Haste for ${P.haste.toFixed(1)}s. Below 40% HP, Cheese Drop immediately makes a Rainbow Jelly that grants a ${Math.round(P.guardShield*100)}% Max-HP Shield and ${Math.round(P.evasion*100)}% Evasion for ${P.guardDur.toFixed(1)}s. Cheese Drop cannot be targeted. Red rarity extends its visit and makes Jellies faster.`,
  cast(u,B,S,P){
    const ally=brightAllies(u,B).sort((a,b)=>b.st.atk-a.st.atk)[0];if(!ally)return;
    brightCheeseEnd(u);brightPose(u,B,'skill3',.9);
    const duration=P.duration+(u.rarity>=5?(u._brightCheeseExtra||4):0);
    const cheese={ally,until:B.t+duration,nextJelly:B.t+.5,every:P.every*(u.rarity>=5?1-(u._brightCheeseRate||.28):1),assistEvery:P.assistEvery,
      lowUsed:false,lastAssist:-99,assist:S.assist,haste:P.haste,hastePower:P.hastePower,node:null};
    u._brightCheese=cheese;
    u._brightCheeseGuardShield=P.guardShield;u._brightCheeseEvasion=P.evasion;u._brightCheeseGuardDur=P.guardDur;
    if(!B.offscreen&&FX.front){
      const node=document.createElement('div');node.className='bright-cheese-drop';node.setAttribute('aria-hidden','true');
      FX.front.appendChild(node);cheese.node=node;
    }
    B.after(duration+.02,()=>{if(u._brightCheese===cheese)brightCheeseEnd(u);});
  }},
 P:{name:'Happy Mind, Happy Life!',type:'Attack / Support',v:{burst:.78},p:{attackSpeed:.15,crit:.10,basicBonus:.20,spiritAttack:.04},
  desc:(S,P)=>`GingerBright gains ${Math.round(P.attackSpeed*100)}% Attack Speed and ${Math.round(P.crit*100)}% Critical Hit chance. Her own Candy Jelly pickup strengthens her next Basic Attack by ${Math.round(P.basicBonus*100)}%. Other allies' pickups grant Bright Spirit, up to five stacks of +${+(P.spiritAttack*100).toFixed(1)}% Attack. At maximum stacks, her next spinning attack bursts for ${Math.round(S.burst*100)}% Attack damage and gives the lowest-Energy ally 100 Energy.`,
  passive(u,B,S,P){
    u.flat.aspdPbright=P.attackSpeed;u.flat.critBright=P.crit;u._brightBasicBonus=P.basicBonus;u._brightSpiritAttack=P.spiritAttack;u._brightSpiritBurst=S.burst;u.dirty=true;
    B.on(u,'dealDamage',e=>{if(u._brightCurrentBasicBonus&&e.basic&&(e.tag==='Bright Lollipop'||e.tag==='Bright Spin'))e.amount*=1+u._brightBasicBonus;});
  }},
 R:{name:'Something Wonderful!',type:'Physical Damage / Support',v:{atk:.12,crit:.08,burst:1.75},p:{jellies:15,duration:10,whiteBoost:.12,paradeCrit:.10,paradeCritDur:6,cheeseExtra:4,cheeseRate:.28,spiritBonus:.30,wonderAttack:.25,wonderAttackSpeed:.20,wonderMovement:.20,critDamage:.30,jellyEnergy:4,killEnergy:14},fixedP:['jellies'],
  desc:(S,P)=>`Bright Attack's final hit creates two extra Jellies and deals ${Math.round(P.whiteBoost*100)}% more damage. Parade pickups grant +${Math.round(P.paradeCrit*100)}% Critical Hit chance. Cheese Drop stays ${P.cheeseExtra.toFixed(1)}s longer and makes Jellies faster. Bright Spirit stacks to six with a stronger burst. Once per wave after ${P.jellies} generated Jellies, Wonderful Surprise deals ${Math.round(S.burst*100)}% Attack damage to all enemies and grants the team +${Math.round(P.wonderAttack*100)}% Attack, +${Math.round(P.wonderAttackSpeed*100)}% Attack Speed, and +${Math.round(P.wonderMovement*100)}% Movement Speed for ${P.duration.toFixed(1)}s. GingerBright gains +${Math.round(P.critDamage*100)}% Critical Damage; allied knockouts restore Energy. Also raises her Attack, Critical Hit chance, and Jelly Energy.`,
  passive(u,B,S,P){
    u.flat.atkPbrightRed=S.atk;u.flat.critBrightRed=S.crit;u._brightWonderBurst=S.burst;u._brightWonderDuration=P.duration;
    u._brightWhiteBoost=P.whiteBoost;u._brightParadeCrit=P.paradeCrit;u._brightParadeCritDur=P.paradeCritDur;
    u._brightCheeseExtra=P.cheeseExtra;u._brightCheeseRate=P.cheeseRate;u._brightRedSpiritBonus=P.spiritBonus;
    u._brightWonderAttack=P.wonderAttack;u._brightWonderAttackSpeed=P.wonderAttackSpeed;u._brightWonderMovement=P.wonderMovement;
    u._brightWonderCritDamage=P.critDamage;u._brightRedJellyEnergy=P.jellyEnergy;u._brightWonderKillEnergy=P.killEnergy;
    u.dirty=true;
  }
 }
};
