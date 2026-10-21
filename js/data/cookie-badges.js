/* Two immediately owned friendship keepsakes for every playable Cookie; choose one to wear. */
'use strict';

const COOKIE_BADGE_DEFS = [
 ['brave_bright_button','GingerBrave','GingerBright',"GingerBright's Candy Button",'🍭','#f799c9','atkP','Attack',.02,'W','energy'],
 ['brave_tiger_paw','GingerBrave','TigerLilyCookie',"Tiger Lily's Pawprint",'🐾','#efad55','msP','Movement Speed',.02,'B','shield'],
 ['bright_brave_ribbon','GingerBright','GingerBrave',"GingerBrave's Rally Ribbon",'🎀','#ffd384','aspdP','Attack Speed',.02,'W','energy'],
 ['bright_vanilla_charm','GingerBright','PureVanillaCookie',"Pure Vanilla's Sugar Charm",'✨','#ffe6ad','crit','Critical Hit Chance',.012,'B','shield'],
 ['milk_cream_spark','ShadowMilkCookie','CreamPuffCookie',"Cream Puff's Stage Spark",'⭐','#9ad9fa','magP','Magic Attack',.02,'W','weaken'],
 ['milk_tiger_thread','ShadowMilkCookie','TigerLilyCookie',"Tiger Lily's Snare Thread",'🧵','#b392ed','cdr','Skill Haste',.012,'B','energy'],
 ['cream_vanilla_bookmark','CreamPuffCookie','PureVanillaCookie',"Pure Vanilla's Orchid Bookmark",'🌸','#ffe6a6','healPowP','Healing Power',.02,'W','heal'],
 ['cream_milk_star','CreamPuffCookie','ShadowMilkCookie',"Shadow Milk's Paper Star",'🌟','#c1b3fa','crit','Critical Hit Chance',.012,'G','energy'],
 ['tiger_bright_compass','TigerLilyCookie','GingerBright',"GingerBright's Candy Compass",'🧭','#ffcf78','crit','Critical Hit Chance',.012,'W','speed'],
 ['tiger_brave_bell','TigerLilyCookie','GingerBrave',"GingerBrave's Brave Bell",'🔔','#f7a264','aspdP','Attack Speed',.02,'G','energy'],
 ['vanilla_cream_ribbon','PureVanillaCookie','CreamPuffCookie',"Cream Puff's Spell Ribbon",'🎗️','#ffdf9e','shieldPowP','Shield Power',.02,'W','shieldAlly'],
 ['vanilla_tiger_token','PureVanillaCookie','TigerLilyCookie',"Tiger Lily's Tiger Token",'🐯','#f6d783','healPowP','Healing Power',.02,'G','cleanse']
];

const COOKIE_BADGE_BURSTS = {
 energy:'Restores a little Energy when its linked Skill is used.',
 shield:'Grants the wearer a small Shield when its linked Skill is used.',
 shieldAlly:'Shields the lowest-HP ally when its linked Skill is used.',
 heal:'Heals the lowest-HP ally when its linked Skill is used.',
 weaken:'Briefly Weakens the nearest enemy when its linked Skill is used.',
 speed:'Briefly boosts movement after its linked Skill is used.',
 cleanse:'Cleanses one debuff from the lowest-HP ally when its linked Skill is used.'
};

COOKIE_BADGE_DEFS.forEach(([id,owner,friend,name,icon,color,statKey,statName,rate,skill,burst])=>defBadge({
 id,owner,friend,name,icon,color,cookieRun:true,skillKey:skill,
 desc:`A keepsake from ${HEROES[friend].name} for ${HEROES[owner].name}.`,
 stat:lvl=>`+${(lvl*rate*100).toFixed(Number.isInteger(rate*100)?0:1)}% ${statName}`,
 effect:`After ${HEROES[owner].skills[skill]?.name||skill}, ${COOKIE_BADGE_BURSTS[burst].charAt(0).toLowerCase()+COOKIE_BADGE_BURSTS[burst].slice(1)} Badge level strengthens the effect.`,
 apply(u,B,lvl){
  u.flat[statKey]=(u.flat[statKey]||0)+lvl*rate;u.dirty=true;
  B.on(u,'cast',ev=>{
   if(ev.key!==skill)return;
   const ally=()=>B.alliesOf(u).filter(a=>a.alive).sort((a,b)=>a.hpPct-b.hpPct)[0]||u;
   if(burst==='energy')B.energy(u,2+lvl*2);
   else if(burst==='shield')B.shield(u,u,u.max.hp*(.02+lvl*.008),6);
   else if(burst==='shieldAlly'){const a=ally();B.shield(u,a,a.max.hp*(.018+lvl*.007),6);}
   else if(burst==='heal'){const a=ally();B.heal(u,a,a.max.hp*(.018+lvl*.007));}
   else if(burst==='weaken'){const t=B.nearest(u,B.enemiesOf(u));if(t)B.applyStatus(u,t,'weaken',2+lvl*.25);}
   else if(burst==='speed')B.applyStatus(u,u,'speedup',2+lvl*.35);
   else if(burst==='cleanse')B.cleanse(ally(),1);
  });
 }
}));
