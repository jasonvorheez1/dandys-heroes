/* Event economy stays inside the current save slot; loaned heroes never enter it. */
'use strict';
const COOKIE_OBTAIN_ORDER = [
 {id:'ShadowMilkCookie',name:'Shadow Milk',pityKey:'pity',pityMax:60,fullChance:.001,shardChance:.03,shards:30,shopCost:6},
 {id:'CreamPuffCookie',name:'Cream Puff',pityKey:'creamPity',pityMax:50,fullChance:.002,shardChance:.04,shards:30,shopCost:5},
 {id:'PureVanillaCookie',name:'Pure Vanilla',pityKey:'vanillaPity',pityMax:40,fullChance:.003,shardChance:.05,shards:30,shopCost:4},
 {id:'TigerLilyCookie',name:'Tiger Lily',pityKey:'tigerPity',pityMax:30,fullChance:.004,shardChance:.06,shards:30,shopCost:3},
 {id:'GingerBright',name:'GingerBright',pityKey:'brightPity',pityMax:20,fullChance:.012,shardChance:.08,shards:40,shopCost:2},
 {id:'GingerBrave',name:'GingerBrave',pityKey:'bravePity',pityMax:10,fullChance:.03,shardChance:.22,shards:50,shopCost:1}
];
const COOKIE_EVENT = {
 id:'cookie-run',title:'Cookie Run · Never Back Down!',label:'Cookie Run',kind:'cookie',isCookieRun:true,
 bossIds:['ShadowMilkCookie'],featuredIds:COOKIE_OBTAIN_ORDER.map(c=>c.id),tag:'COOKIE RUN COLLAB',minMastery:40,
 stageLevels:[70,100,150,220,320,450,600,760],
 blurb:'GingerBrave has fired up the oven! Stand with the Toons against poisoned ambushes, Berry Bishops and puppet reinforcements. Earn Cookie Cutters to bake Cookie rewards.'
};
const CookieRun={
 event:COOKIE_EVENT,
 cutterArt:'uploads/Cookie_cutter_featured.webp',
 shardPack:{amount:150,ichor:5000},
 shopOffers(){const offers={manual:{cost:1,res:'manual',amount:15},exp:{cost:1,res:'exp',amount:6000}};COOKIE_OBTAIN_ORDER.forEach(c=>{offers[c.id]={cost:c.shopCost,id:c.id,amount:this.shardPack.amount,ichor:this.shardPack.ichor};});return offers;},
 state(){
  const r=Raid.state();if(!r.cookieRun)r.cookieRun={cutters:0,pulls:0,rarityOrderV1:true};
  const c=r.cookieRun;
  if(c.cutters==null)c.cutters=Math.ceil(Math.max(0,Number(c.crumbs)||0)/100);
  delete c.crumbs;
  if(!c.rarityOrderV1){
   // Carry each old guarantee's percentage of progress into its new limit.
   const oldLimits={pity:35,creamPity:45,vanillaPity:40,tigerPity:30,brightPity:20};
   COOKIE_OBTAIN_ORDER.forEach(item=>{const old=oldLimits[item.pityKey];if(old)c[item.pityKey]=Math.ceil((Number(c[item.pityKey])||0)*item.pityMax/old);});
   c.rarityOrderV1=true;
  }
  ['cutters','pulls',...COOKIE_OBTAIN_ORDER.map(item=>item.pityKey)].forEach(k=>{c[k]=Math.max(0,Math.floor(Number(c[k])||0));});
  return c;
 },
 loan(stage){const level=Math.max(70,Raid.stageLevel(stage,COOKIE_EVENT));return {id:'GingerBrave',level,rarity:5,rarityPlus:Math.min(20,1+stage*2),stars:3,skillLv:level,temporary:true,artSrc:Art.hero('GingerBrave')};},
 team(specs,stage){const brave=Save.owns('GingerBrave')?playerSpec('GingerBrave'):this.loan(stage);return [brave,...specs.filter(s=>s.id!=='GingerBrave').slice(0,4)];},
 ensureWave(specs,stage){return specs.some(s=>s.id==='GingerBrave')?specs:[Save.owns('GingerBrave')?playerSpec('GingerBrave'):this.loan(stage),...specs.slice(0,4)];},
 wave(wave,level){
  const stage=Math.max(0,COOKIE_EVENT.stageLevels.indexOf(level));
  const ids=wave===1
   ?['SkelecakeCook','PomegranateSnake','BerryBishop','DangerInTheBox','CookieScorpion']
   :wave===2
   ?['CookieScorpion','PomegranateSnake','BerryBishop','DangerInTheBox','SkelecakeCook','PaperPuppetKnight']
   :['PaperPuppetKnight','BerryBishop','CookieScorpion','DangerInTheBox','PomegranateSnake'];
  const foes=ids.map((id,i)=>({
   id,level,
   rarity:stage>=5?5:stage>=3?4:3,
   rarityPlus:Math.min(14,1+stage*2),
   stars:wave===3?5:(stage>=5?5:4),
   skillLv:level,twisted:false,encounterOnly:true,artSrc:Art.hero(id),
   formationLine:id==='BerryBishop'?2:i%2,
   mult:{
    hp:1.16+wave*.12+stage*.025,
    atk:.95+wave*.05+stage*.015,
    mag:1.00+wave*.05+stage*.015,
    def:1.04+wave*.035+stage*.012,
    mdef:1.04+wave*.035+stage*.012
   }
  }));
  if(wave===3)foes.unshift({
   id:'ShadowMilkCookie',level,rarity:5,rarityPlus:Math.min(18,2+stage*2),stars:5,skillLv:level,
   kind:'boss',twisted:false,encounterOnly:true,artSrc:Art.hero('ShadowMilkCookie'),formationLine:2,
   mult:{
    hp:2.85+stage*.06,
    atk:1.08+stage*.012,
    mag:1.22+stage*.015,
    def:1.14+stage*.012,
    mdef:1.14+stage*.012
   }
  });
  return foes;
 },
 plan(){return [
 {wave:1,desc:'Oven Outskirts · Berry Bishops heal the lowest-HP ally. Opening Momentum helps your team break through.',mods:['event_momentum']},
 {wave:2,desc:'Sugar Mirage · Snakes hunt Tanks, while Scorpions rush Supports. Event Attrition reduces healing.',mods:['event_attrition']},
 {wave:3,desc:'Puppet Moon · Shadow Milk Cookie commands the stage under Boss Pressure. Boxes spread Corruption and release Paper Puppet Knights.',mods:['event_attrition','event_boss_pressure']}
 ];},
 reward(stage){return 2+Math.floor(stage/2);},
 bake(count){
 if(count!==1&&count!==10)return {ok:false,reason:'Choose one or ten bakes.'};
 const state=this.state(),cost=count;if(state.cutters<cost)return {ok:false,reason:'Earn more Cookie Cutters in event battles.'};
 state.cutters-=cost;const results=[];
 for(let i=0;i<count;i++){
  state.pulls++;COOKIE_OBTAIN_ORDER.forEach(c=>state[c.pityKey]++);const roll=Math.random();let id=null,amount=0,label,art,full=false,resource=null,isNew=false;
  let winner=COOKIE_OBTAIN_ORDER.find(c=>state[c.pityKey]>=c.pityMax),threshold=0;
  if(!winner)for(const c of COOKIE_OBTAIN_ORDER){threshold+=c.fullChance;if(roll<threshold){winner=c;break;}}
  if(winner){id=winner.id;amount=Save.unlockNeed(id);state[winner.pityKey]=0;label=HEROES[id].name;full=true;}
  else {
   threshold=COOKIE_OBTAIN_ORDER.reduce((sum,c)=>sum+c.fullChance,0);
   for(const c of COOKIE_OBTAIN_ORDER){threshold+=c.shardChance;if(roll<threshold){id=c.id;amount=c.shards;label=`${c.name} · ${amount} shards`;break;}}
  }
  if(!id&&roll<threshold+.30){Save.data.res.exp+=3000;amount=3000;resource='exp';label='3,000 EXP';}
  else if(!id){Save.data.res.manual+=8;amount=8;resource='manual';label='8 Training Manuals';}
  if(id){isNew=Save.giveShards(id,amount,true)==='new';art=Art.hero(id);}results.push({id,amount,label,art,full,resource,isNew,rare:full&&(id==='ShadowMilkCookie'||id==='CreamPuffCookie'||id==='TigerLilyCookie'||id==='PureVanillaCookie'||id==='GingerBright')});
 }
 Save.write();return {ok:true,results};
 },
 buy(id){const o=this.shopOffers()[id],s=this.state();if(!o||s.cutters<o.cost)return false;s.cutters-=o.cost;if(o.id){Save.giveShards(o.id,o.amount);Save.data.res.ichor+=o.ichor;}else Save.data.res[o.res]+=o.amount;Save.write();return true;}
};
