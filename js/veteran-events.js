/* Repeatable progression for established DW Modded and Toons Universe rosters. */
'use strict';
const VeteranEvents = (() => {
  const DW='dw-modded-event',TU=ToonsUniverse.eventId;
  const eligible=()=>Number(Save.data.mastery||1)>=650;
  const day=()=>new Date().toLocaleDateString('en-CA',{timeZone:'America/Chicago'});
  function state(){const s=Raid.state();return s.veteranEvents||(s.veteranEvents={bought:{},tuVeteran:false});}
  const goods=[
    {id:'power',name:'Mod Power cache',gain:{modPower:500},dw:250,tu:400,limit:3,text:'500 Mod Power'},
    {id:'fragments',name:'Mod Fragment case',gain:{modFrag:25},dw:350,tu:550,limit:2,text:'25 Mod Fragments'},
    {id:'pieces',name:'Mod Piece case',gain:{modPiece:2},dw:600,tu:900,limit:1,text:'2 Mod Pieces'},
    {id:'parts',name:'Trinket workshop crate',gain:{scrap:600,manual:80},dw:300,tu:450,limit:2,text:'600 Trinket Shards + 80 Training Manuals'},
    {id:'research',name:'Advanced training case',gain:{exp:100000,tape:250},dw:250,tu:400,limit:2,text:'100,000 EXP + 250 Field Tape'}
  ];
  function offers(id){const dw=id===DW;return goods.map(g=>({...g,cost:dw?g.dw:g.tu})).concat((dw?['dango_skewer','jessie_radio','cody_beartrap','nugget_mustard']:['selena_batemblem','copper_dragonemblem','discard_dolphinemblem','phantasia_unicornemblem']).filter(t=>TRINKETS[t]).map(t=>({id:'ranked-'+t,name:TRINKETS[t].name,trinket:t,rank:Math.min(TRINKET_MAX_RANK,4+Math.floor((Save.data.mastery-650)/100)),cost:dw?800:1000,limit:1,text:'A ranked copy; combines through normal Trinket progression.'})));}
  function wallet(id){return id===DW?Raid.state().dwModdedTapes||0:ToonsUniverse.state().malachor||0;}
  function key(id,o){return day()+':'+id+':'+o.id;}
  function left(id,o){return Math.max(0,o.limit-(state().bought[key(id,o)]||0));}
  function buy(id,offerId){if(!eligible()||![DW,TU].includes(id))return false;const o=offers(id).find(g=>g.id===offerId);
    if(!o||!left(id,o)||wallet(id)<o.cost)return false;
    if(id===DW)Raid.state().dwModdedTapes-=o.cost;else ToonsUniverse.state().malachor-=o.cost;
    state().bought[key(id,o)]=(state().bought[key(id,o)]||0)+1;
    if(o.trinket)Save.addTrinketCopy(o.trinket,o.rank);else Save.give(o.gain,true,{exact:true});
    Save.write();UI.refreshBar(true);return true;
  }
  // Append, rather than replace, the original eight stages and their saved clears.
  const weekly=weeklyEvents;weeklyEvents=function(week){return weekly(week).map(e=>e.id===DW&&eligible()?Object.assign({},e,{stageLevels:e.stageLevels.concat([550,650,725,800]),blurb:e.blurb+' Veteran stages and an endgame exchange open at Mastery 650.'}):e);};
  const token=Raid.tokenReward;Raid.tokenReward=function(e,stage){const n=token.call(this,e,stage);return e.id===DW&&stage>=8?Math.round(n*(1.5+(stage-8)*.15)):n;};
  const reward=Raid.stageRewards;Raid.stageRewards=function(e,stage){const base=reward.call(this,e,stage);if(e.id!==DW||stage<8)return base;return Object.assign({},base,{modPower:(base.modPower||0)+150+(stage-8)*75,modFrag:(base.modFrag||0)+5+(stage-8)*2});};
  // Veteran difficulty is opted into at the start of a fresh TU expedition.
  const start=ToonsUniverse.start;ToonsUniverse.start=function(team){const result=start.call(this,team);if(result?.ok&&eligible()&&state().tuVeteran){const r=this.run();r.veteran650=true;r.level=Math.min(800,Math.max(650,r.level));Save.write();}return result;};
  function mult(r){return r?.veteran650?Math.min(3,1.5+Math.max(0,r.floor-1)*.1):1;}
  // The UI calls these exported entry points; their internal helpers remain unchanged.
  for(const name of ['hitSkillCheck','tickMachine','useMachineItem','tickObjective','capsule','settle']){
    const original=ToonsUniverse[name];if(typeof original!=='function')continue;
    ToonsUniverse[name]=function(...args){const s=this.state(),r=this.run(),before=s.malachor;const result=original.apply(this,args);
      const gained=Math.max(0,s.malachor-before),extra=Math.round(gained*(mult(r)-1));
      if(extra){s.malachor+=extra;if(r?.stats)r.stats.malachor+=extra;if(r)r.last=(r.last||'')+' · Veteran bonus: +'+extra+' Malachor';Save.write();}return result;};
  }
  const clearPending=ToonsUniverse.raidClearPending;
  ToonsUniverse.raidClearPending=async function(...args){const s=this.state(),r=this.run(),before=s.malachor;const result=await clearPending.apply(this,args);
    const extra=Math.round(Math.max(0,s.malachor-before)*(mult(r)-1));
    if(extra){s.malachor+=extra;if(r?.stats)r.stats.malachor+=extra;Save.write();}return result;};
  const sweep=ToonsUniverse.runRaidTicketOne;
  ToonsUniverse.runRaidTicketOne=async function(floor){const result=await sweep.call(this,floor);
    // Only successful high-floor sweeps get the boost, with no extra ticket sources.
    if(eligible()&&floor>=10&&result?.win){const base=result.rewards?.malachor||0,extra=Math.round(base*.5);this.state().malachor+=extra;result.rewards.malachor+=extra;Save.write();}return result;};
  function toggle(){if(!eligible()||ToonsUniverse.run()?.status==='active')return false;state().tuVeteran=!state().tuVeteran;Save.write();return true;}
  function panel(s,id){if(!eligible())return;const box=el('section','ve-panel');const dw=id===DW;
    box.innerHTML=`<header><small>MASTERY 650+ · REPEATABLE PROGRESSION</small><h2>${dw?'DW Modded':'Toons Universe'} · Veteran Exchange</h2><b>${wallet(id)} ${dw?'Golden Tapes':'Malachor'}</b></header><p>${dw?'Four additional stages: Lv 550, 650, 725 and 800. They award extra Golden Tapes, Mod Power and Mod Fragments. Select them directly from the stage list.':'Veteran expeditions start with a Lv 650 difficulty floor. Malachor payouts increase from 1.5× to 3× as you descend; high-floor Raid Ticket sweeps pay 50% more Malachor from floor 10.'}</p><div class="ve-config"></div><div class="ve-stock"></div><small>Daily stock resets at midnight, Chicago time. Currency and ordinary event shops retain their existing balances.</small>`;
    if(!dw){const active=ToonsUniverse.run()?.status==='active';const b=el('button','ve-toggle',`Veteran expedition: ${state().tuVeteran?'ON':'OFF'}${active?' · finish or retire the current run first':' · next new run'}`);b.disabled=active;b.setAttribute('aria-pressed',String(state().tuVeteran));b.onclick=()=>{if(toggle())Screens.render();};box.querySelector('.ve-config').appendChild(b);}
    for(const o of offers(id)){const card=el('article','ve-offer');card.innerHTML=`<h3>${o.name}</h3><p>${o.trinket?'Rank '+o.rank+' · ':''}${o.text}</p><small>${left(id,o)} left today</small>`;const b=el('button','',`${o.cost} ${dw?'Golden Tapes':'Malachor'}`);b.disabled=!left(id,o)||wallet(id)<o.cost;b.onclick=()=>{if(buy(id,o.id)){Sound.play('currency');Screens.render();UI.toast(o.name+' received');}};card.appendChild(b);box.querySelector('.ve-stock').appendChild(card);}s.appendChild(box);
  }
  const dossier=Screens.raidDossier;Screens.raidDossier=function(s,e){const result=dossier.call(this,s,e);if([DW,TU].includes(e.id))panel(s,e.id);return result;};
  return {eligible,state,offers,wallet,left,buy,mult,toggle,DW,TU};
})();
