/* Dango's counter and repeatable, non-canon festival challenges. */
'use strict';
const DangoFestival = (() => {
  const roster = ['Dango','Jessie','Cody','Nugget','Shelly','Vee','Bassie','Bobette'];
  const stages = [
    {name:'Tea Tray Relay',hint:'Clear the helpers before the healer can keep them standing.',bg:'assets/backgrounds/maps/diner.png',boss:'Sprout',waves:[['Boxten','Toodles','Poppy'],['Cosmo','Goob','Poppy'],['Sprout','Cosmo','Goob','Toodles']]},
    {name:'Center Stage Rush',hint:'Fast damage dealers build pressure. Keep your support protected.',bg:'assets/backgrounds/maps/vee-showroom.webp',boss:'Vee',waves:[['Looey','Poppy','Toodles'],['Glisten','Vee','Poppy'],['Vee','Glisten','Looey','Toodles']]},
    {name:'Backstage Scramble',hint:'A tough front line protects ranged damage. Bring sustained damage.',bg:'assets/backgrounds/maps/vee-storage.webp',boss:'Bobette',waves:[['Goob','Scraps','Boxten'],['Bobette','Scraps','Poppy'],['Bobette','Goob','Scraps','Cosmo']]},
    {name:'Last Train Encore',hint:'Three mixed teams, then a well-supported headliner. Save your team for the finale.',bg:'uploads/gardenviewtrainstation.webp',boss:'Dandy',waves:[['Boxten','Poppy','Toodles'],['Goob','Cosmo','Glisten'],['Dandy','Sprout','Vee','Goob','Toodles']]}
  ];
  const modes = {warmup:{name:'Warm-up',level:30,waves:2,pay:60,mult:.7},standard:{name:'Showtime',level:75,waves:3,pay:125,mult:1},encore:{name:'Encore',level:140,waves:3,pay:220,mult:1.35}};
  const rules = [
    {id:'df_rule_0',kind:'buff',icon:'🍵',name:'Tea Break',desc:'Your team receives 20% more healing.',apply:B=>B.playerTeam().forEach(u=>{u.flat.healRecv79=(u.flat.healRecv79||0)+.2;u.dirty=true;})},
    {id:'df_rule_1',kind:'debuff',icon:'🎤',name:'Quick Cues',desc:'Opponents have 12% cooldown reduction.',apply:B=>B.foeTeam().forEach(u=>{u.flat.cdr79=(u.flat.cdr79||0)+.12;u.dirty=true;})},
    {id:'df_rule_2',kind:'debuff',icon:'🎭',name:'Steady Footing',desc:'Opponents gain 20% control resistance.',apply:B=>B.foeTeam().forEach(u=>{u.flat.ccRes79=(u.flat.ccRes79||0)+.2;u.dirty=true;})},
    {id:'df_rule_3',kind:'debuff',icon:'🚉',name:'Final Call',desc:'Opponents gain 15% more Energy.',apply:B=>B.foeTeam().forEach(u=>{u.flat.energyGen79=(u.flat.energyGen79||0)+.15;u.dirty=true;})}
  ];
  EVENT_MODIFIERS.push(...rules);
  function state(){const s=AlmostHome.state();s.festival ||= {};const f=s.festival;
    for(const key of ['ichor','earned','level'])f[key]=Math.max(0,Math.floor(Number(f[key])||0));
    f.level=Math.min(5,f.level);f.clears ||= {};f.daily ||= {};f.heard ||= {};
    return f;
  }
  function day(){return new Date().toLocaleDateString('en-CA',{timeZone:'America/Chicago'});}
  function basePay(i,mode){return Math.round(modes[mode].pay*(1+i*.1));}
  function quote(i,mode){const f=state();return {repeat:basePay(i,mode),first:f.clears[i+':'+mode]?0:180,daily:(f.daily[day()]||0)<3?50:0};}
  function award(i,mode,win,completed){const f=state(), q=quote(i,mode);
    const amount=win?q.repeat+q.first+q.daily:completed*Math.round(q.repeat*.12);
    if(win){f.clears[i+':'+mode]=(f.clears[i+':'+mode]||0)+1;f.daily[day()]=(f.daily[day()]||0)+1;AlmostHome.state().bonus[i]=true;}
    f.ichor+=amount;f.earned+=amount;Save.write();return amount;
  }
  function spec(id,level,loan){return FF7Event.spec(id,level,loan);}
  function battle(i,mode='warmup',selected=['Dango','Jessie','Cody','Nugget','Shelly']){
    if(!stages[i]||!modes[mode]||BattleScreen.active)return false;
    const ids=[...new Set(selected)].filter(id=>roster.includes(id)).slice(0,5);if(!ids.length)return false;
    const cfg=modes[mode], node=stages[i], level=cfg.level+i*5;
    const lists=cfg.waves===2?[node.waves[0],node.waves[2]]:node.waves;
    let wave=0, team=ids.map(id=>spec(id,level,false)),settled=false;
    function finish(win,quit){if(settled)return;settled=true;
      const amount=award(i,mode,win,wave);Screens._raidDossier=AlmostHome.event.id;Screens.go('raid');
      UI.toast(`${win?'Show cleared!':quit?'Run ended.':'Try another team.'} +${amount} Festival Ichor`);
    }
    function launch(){let instance;let handled=false;const final=wave===lists.length-1;
      const foes=lists[wave].map((id,k)=>Object.assign(spec(id,level,true),{
        name:final&&id===node.boss?node.name+' · Headliner':HEROES[id].name,
        kind:final&&id===node.boss?'boss':undefined,twisted:false,encounterOnly:true,
        formationLine:k%2,mult:{hp:cfg.mult*(final?1.6:1),atk:cfg.mult*.8,mag:cfg.mult*.8,def:1,mdef:1}
      }));
      instance=BattleScreen.launch({team,foes,music:'ahSega',skipResults:!final,
        meta:{title:node.name+' · '+cfg.name,floorLabel:`Rehearsal ${wave+1}/${lists.length} · Festival Ichor`,roomIdx:wave+1,roomTotal:lists.length,bg:ASSET+node.bg,timeLimit:150,mods:[rules[i].id],mutations:[]},rewards:()=>({}),
        onDone:result=>{if(handled||settled)return;handled=true;
          if(result.quit||!result.win){finish(false,!!result.quit);return;}
          wave++;if(final){finish(true,false);return;}
          // Survivors keep their condition; a short intermission restores 20% HP.
          const hp={};if(instance&&instance.units)instance.units.filter(u=>u.team===TEAM_P&&!u.minion).forEach(u=>hp[u.id]=u.alive?u.hpPct:0);
          team=team.filter(sp=>hp[sp.id]===undefined||hp[sp.id]>0).map(sp=>Object.assign({},sp,{carryHp:Math.min(1,(hp[sp.id]??1)+.2)}));
          if(!team.length){finish(false,false);return;}launch();
        }});
      if(!instance&&!handled)finish(false,true);
    }
    launch();return true;
  }
  function prep(i){const node=stages[i];let mode='warmup',ids=['Dango','Jessie','Cody','Nugget','Shelly'];
    const body=el('div','df-prep');body.innerHTML=`<p>${node.hint}</p><p><b>${rules[i].name}:</b> ${rules[i].desc}</p><p class="df-notice">Non-canon rehearsal. Loan toons provided. No entry fee.</p><div class="df-modes"></div><div class="df-team"></div><p class="df-payout"></p><p class="df-rules">Survivors carry HP between waves and recover 20% during intermissions. A lost or abandoned run keeps a small payout for completed waves.</p>`;
    const payout=body.querySelector('.df-payout'),grid=body.querySelector('.df-team');
    function update(){const q=quote(i,mode);payout.textContent=`${modes[mode].waves} waves · Lv ${modes[mode].level+i*5} · ${q.repeat} per clear${q.first?' +180 first clear':''}${q.daily?' +50 daily bonus':''} Festival Ichor`;
      body.querySelectorAll('[data-mode]').forEach(b=>{b.classList.toggle('selected',b.dataset.mode===mode);b.setAttribute('aria-pressed',String(b.dataset.mode===mode));});
      grid.querySelectorAll('button').forEach(b=>{b.classList.toggle('selected',ids.includes(b.dataset.id));b.setAttribute('aria-pressed',String(ids.includes(b.dataset.id)));});}
    Object.entries(modes).forEach(([key,d])=>{const b=el('button','',d.name);b.type='button';b.dataset.mode=key;b.onclick=()=>{mode=key;update();};body.querySelector('.df-modes').appendChild(b);});
    roster.forEach(id=>{const b=el('button');b.type='button';b.dataset.id=id;b.innerHTML=`<img src="${Art.hero(id)}" alt=""><span>${HEROES[id].name}</span>`;b.onclick=()=>{if(ids.includes(id)){if(ids.length>1)ids=ids.filter(x=>x!==id);}else if(ids.length<5)ids.push(id);else UI.toast('Choose up to five toons.');update();};grid.appendChild(b);});
    const go=el('button','df-primary','Start rehearsal');go.onclick=()=>{UI.closeModal();battle(i,mode,ids);};body.appendChild(go);update();UI.modal(node.name,body);
  }
  function board(body){const f=state();body.appendChild(el('p','ah-note',`Festival Ichor: ${f.ichor} · Earn it on every clear. First clears add 180; your first three wins each day add 50. No entry costs or daily earning cap.`));
    stages.forEach((node,i)=>{const card=el('article','df-challenge');card.innerHTML=`<img src="${Art.hero(node.boss)}" alt=""><div><small>REPEATABLE REHEARSAL ${i+1}</small><h3>${node.name}</h3><p>${node.hint}</p><b>${basePay(i,'warmup')}–${basePay(i,'encore')} Festival Ichor per clear</b></div>`;
      const actions=el('div','df-actions');const b=el('button','','Choose team & difficulty');b.onclick=()=>prep(i);actions.appendChild(b);
      if(AlmostHome.state().bonus[i]){const memory=el('button','','Watch side scene');memory.onclick=()=>AlmostHome.read(i,true);actions.appendChild(memory);}card.appendChild(actions);body.appendChild(card);
    });
  }
  return {state,day,quote,award,battle,prep,board,stages,modes,roster,rules};
})();

// The rehearsal board was defined but never mounted, leaving Festival Ichor
// without an obtainable source. Keep it beside the event's regular stages.
const dwDossierWithFestival = Screens.dwModdedDossier;
Screens.dwModdedDossier = function(s, ev) {
  dwDossierWithFestival.call(this, s, ev);
  if (this._dwTab !== 'stages') return;
  const stages = s.querySelector('.dw-stages-grid');
  if (!stages) return;
  const board = el('section', 'df-board');
  board.appendChild(el('h2', '', 'Festival Rehearsals'));
  DangoFestival.board(board);
  stages.before(board);
};

const DangoShop = (()=>{
  const offers=[
    ...['Dango','Jessie','Cody','Nugget'].map(id=>({id:'shards-'+id,name:id+' research',hero:id,amount:10,cost:240,desc:'10 research toward recruiting or promoting '+id+'.'})),
    {id:'tape',name:'Field Tape',cost:70,gain:{tape:15},desc:'15 Field Tape for skill and counter upgrades.',img:'assets/objects/Tape.png'},
    {id:'exp',name:'EXP parcel',cost:60,gain:{exp:2500},desc:'2,500 EXP for your roster.',img:'uploads/exp-bottle-icon.png'},
    {id:'manual',name:'Training notes',cost:100,gain:{manual:10},desc:'10 Training Manuals.',emoji:'📘'},
    {id:'scrap',name:'Trinket parts',cost:120,gain:{scrap:60},desc:'60 Trinket Shards for crafting.',emoji:'🔩'}
  ];
  offers.push(...['dango_skewer','jessie_radio','cody_beartrap','nugget_mustard'].map(id=>({id:'trinket-'+id,trinket:id,name:TRINKETS[id].name,cost:650,desc:TRINKETS[id].desc||TRINKETS[id].effect,img:trinketIcon(id)})));
  const chats=[['stock','The stockroom',"Dandy helped me carry these over. I made my own list this time. If something's missing, I can actually tell you when it'll be back."],['jessie','Jessie’s rehearsal',"She keeps saying she'll only do one more take. I leave the tea covered now. It stays warm longer."],['cody','The fan',"Cody moved the fan again. The cards stay on the desk now, but the welcome sign keeps falling down. I'll find somewhere for both."],['nugget','A useful label',"I asked Nugget to label the boxes. They're all labeled now. Including my lunch. That one says 'Dango, probably'."]];
  function price(o){return Math.ceil(o.cost*(1-DangoFestival.state().level*.03));}
  function wallet(currency){return currency==='golden'?Raid.state().dwModdedTapes||0:DangoFestival.state().ichor;}
  function spend(currency,amount){if(!['ichor','golden'].includes(currency)||wallet(currency)<amount)return false;
    if(currency==='golden')Raid.state().dwModdedTapes-=amount;else DangoFestival.state().ichor-=amount;return true;}
  function buy(id,currency='ichor'){const o=offers.find(x=>x.id===id);if(!o||!spend(currency,price(o)))return false;
    if(o.hero)Save.giveShards(o.hero,o.amount);else if(o.trinket)Save.addTrinketCopy(o.trinket,1);else Save.give(o.gain,true,{exact:true});Save.write();UI.refreshBar(true);return true;}
  function upgrade(currency='ichor'){const f=DangoFestival.state(),cost=300+150*f.level;if(f.level>=5||!spend(currency,cost))return false;f.level++;Save.write();return true;}
  function mount(host,root){if(Save.data.opt?.animatedChars===true&&window.DangoRig){const rig=window.DangoRig.create(host,{assetBase:ASSET+'assets/toon-art/Dango/'});let running=true,frame,last=0;
      function tick(now){if(!running||!root.isConnected)return;rig.update({animState:'idle'},Math.min(.04,(now-last)/1000||.016));last=now;frame=requestAnimationFrame(tick);}frame=requestAnimationFrame(tick);
      return {destroy(){running=false;cancelAnimationFrame(frame);rig.destroy();}};}
    const img=document.createElement('img');img.src=ASSET+'assets/toon-art/Dango/vn.webp';img.alt='Dango';img.className='market-keeper-still';host.appendChild(img);return {destroy(){host.replaceChildren();}};}
  function enter(){Screens.shopKeeper='dango';Screens.go('shop');}
  function render(s){Screens._shopRig?.destroy();Screens._shopRig=null;clearInterval(Screens._shopTalkTimer);clearInterval(Screens._shopClock);clearTimeout(Screens._shopStartTimer);clearTimeout(Screens._shopEntranceTimer);
    const f=DangoFestival.state(),tab=Screens.dangoShopTab||'supplies',root=el('div','shop-screen market market-dango');root.dataset.keeper='dango';
    root.innerHTML=`<header class="market-header"><button class="market-back" aria-label="Back to event">‹</button><h1>Dango’s Shop</h1><span class="market-open"><i></i>OPEN</span></header><nav class="market-keepers" aria-label="Choose shopkeeper"></nav><section class="market-stage"><div class="market-keeper" role="img" aria-label="Dango"></div><div class="market-counter"></div><div class="market-dialogue"><div class="market-speaker">DANGO</div><p class="df-speech" aria-live="polite">Irasshaimase! Have a look. Festival Ichor or Golden Tapes—your choice.</p></div></section><div class="df-wallet"><b>${f.ichor} Festival Ichor · ${wallet('golden')} Golden Tapes</b></div><nav class="market-departments" aria-label="Dango’s departments"></nav><section class="market-stock"><div class="df-shop-content"></div></section>`;
    s.appendChild(root);Screens._shopRig=mount(root.querySelector('.market-keeper'),root);
    const rehearse=el('button','df-rehearse','Earn Festival Ichor');
    rehearse.type='button';
    rehearse.onclick=()=>{Screens._raidDossier=AlmostHome.ID;Screens._dwTab='stages';Screens.go('raid');};
    root.querySelector('.df-wallet').appendChild(rehearse);
    root.querySelector('.market-back').onclick=()=>{Screens._raidDossier=AlmostHome.event.id;Screens.go('raid');};
    for(const [id,label]of[['dandy','Dandy’s'],['dyle','Dyle’s'],['dango','Dango’s']]){const b=el('button',id==='dango'?'selected':'',label);b.type='button';b.setAttribute('aria-pressed',String(id==='dango'));b.onclick=()=>{Screens.shopKeeper=id;Screens.render();};root.querySelector('.market-keepers').appendChild(b);}
    for(const [id,label]of[['supplies','Supplies'],['toons','Event toons'],['trinkets','Trinkets'],['gossip','Gossip']]){const b=el('button',tab===id?'on':'',label);b.type='button';b.setAttribute('aria-pressed',String(tab===id));b.onclick=()=>{Screens.dangoShopTab=id;Screens.render();};root.querySelector('.market-departments').appendChild(b);}
    const body=root.querySelector('.df-shop-content'),say=text=>{root.querySelector('.df-speech').textContent=text;};
    if(tab==='gossip'){for(const [id,title,text]of chats){const b=el('button','df-chat',title+(f.heard[id]?' ↻':''));b.onclick=()=>{f.heard[id]=true;Save.write();say(text);b.textContent=title+' ↻';};body.appendChild(b);}}
    else{const up=el('div','df-upgrade');up.innerHTML=`<b>Counter level ${f.level}/5 · ${f.level*3}% off</b><p>Unlimited stock. Buy with Festival Ichor or Golden Tapes.</p>`;
      const upgradeButtons=el('div','df-buy-options');
      for(const [currency,label] of [['ichor','Festival Ichor'],['golden','Golden Tapes']]){const u=el('button','',f.level===5?'Fully upgraded':`Upgrade · ${300+150*f.level} ${label}`);u.disabled=f.level===5||wallet(currency)<300+150*f.level;u.onclick=()=>{if(upgrade(currency))Screens.render();};upgradeButtons.appendChild(u);}up.appendChild(upgradeButtons);body.appendChild(up);
      const grid=el('div','shop-grid');body.appendChild(grid);
      offers.filter(o=>tab==='toons'?!!o.hero:tab==='trinkets'?!!o.trinket:!o.hero&&!o.trinket).forEach(o=>{const card=el('article','shop-item');const src=o.hero?Art.hero(o.hero):o.img?(o.trinket?o.img:ASSET+o.img):'';card.innerHTML=`<div class="shop-item-art">${src?`<img src="${src}" alt="">`:`<span>${o.emoji}</span>`}</div><div class="shop-item-copy"><h3>${o.name}</h3><p>${o.desc}</p></div>`;
        const buttons=el('div','df-buy-options');for(const [currency,label] of [['ichor','Festival Ichor'],['golden','Golden Tapes']]){const b=el('button','shop-buy',`${price(o)} ${label}`);b.disabled=wallet(currency)<price(o);b.onclick=()=>{if(buy(o.id,currency)){Sound.play('currency');Screens.render();UI.toast(o.name+' received');}};buttons.appendChild(b);}card.querySelector('.shop-item-copy').appendChild(buttons);grid.appendChild(card);});}
    Music.play('ahCandy');
  }
  const base=Screens.shop;Screens.shop=function(s){if(this.shopKeeper==='dango')return render(s);base.call(this,s);const nav=s.querySelector('.market-keepers');if(nav){const b=el('button','','Dango’s Shop');b.type='button';b.setAttribute('aria-pressed','false');b.onclick=enter;nav.appendChild(b);}};
  return {enter,render,buy,upgrade,offers,price};
})();
