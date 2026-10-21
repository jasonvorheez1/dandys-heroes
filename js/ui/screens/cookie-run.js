'use strict';
const COOKIE_CHAT = [
 {mood:'happy',text:"Hey, you're here! I saved you a spot."},
 {mood:'neutral',text:"Those boxes pop when they go down. Give them room."},
 {mood:'serious',text:"The Berry Bishop keeps healing the others. Get to it first."},
 {mood:'happy',text:"Let's bake one! I want to see who we get."},
 {mood:'serious',text:"Shadow Milk is waiting at the end. Stay together."},
 {mood:'happy',text:"Cream Puff's joining us? Oh, I have to see her next spell!"},
 {mood:'happy',text:"Tiger Lily's here! Uh—do we have room for the tiger?"},
 {mood:'happy',text:"GingerBright and Cheese Drop are here! Look at all those Candy Jellies!"},
 {mood:'serious',text:"When Tiger Lily marks someone, keep the pressure on them."},
 {mood:'neutral',text:"If we're short on cutters, let's do another stage."},
 {mood:'happy',text:"Okay, I'm a little nervous. I'm going anyway!"},
 {mood:'serious',text:"Watch the puppet strings. Don't let him split us up."},
 {mood:'happy',text:"Nice! That was a good run. Want another?"},
 {mood:'neutral',text:"Do you smell that? I hope it's the oven."},
 {mood:'serious',text:"If someone gets stuck, we pull them out. Deal?"},
 {mood:'happy',text:"Come on. No cookie left behind!"}
];
const COOKIE_BRAVE_EMOTIONS = {
 neutral:'uploads/Gingerbrave_default.webp',
 happy:'uploads/Gingerbrave_happy.webp',
 serious:'uploads/Gingerbrave_serious.webp'
};
function cookieCutterIcon(){return `<img class="cookie-cutter-icon" src="${ASSET+CookieRun.cutterArt}" alt="">`;}
function cookieHostSay(root,line,animate=false){
 const bubble=root.querySelector('.cookie-speech'),sprite=root.querySelector('.cookie-host-img');if(!bubble||!sprite)return;
 bubble.textContent=line.text;
 sprite.src=ASSET+(COOKIE_BRAVE_EMOTIONS[line.mood]||COOKIE_BRAVE_EMOTIONS.neutral);
 if(animate){
  sprite.classList.remove('cookie-acting');void sprite.offsetWidth;sprite.classList.add('cookie-acting');
 }
}
Object.assign(Screens,{
 cookieRun(s,ev){
  this._cookieTab=this._cookieTab||'oven';this._raidStages=this._raidStages||{};
  const stage=this._raidStages[ev.id]??Raid.nextStage(ev.id),wallet=CookieRun.state();
  const page=el('section','cookie-event');
  page.innerHTML=`<header class="cookie-header"><button class="cookie-back" type="button" aria-label="Back to event board">← Events</button><h1>Cookie Run</h1><div class="cookie-wallet" aria-label="${fmt(wallet.cutters)} Cookie Cutters">${cookieCutterIcon()}<b>${fmt(wallet.cutters)}</b></div><button class="cookie-exit" type="button" aria-label="Exit Cookie Run to Home">⌂ <span>Home</span></button></header>
   <div class="cookie-layout"><nav class="cookie-nav" aria-label="Cookie Run event"><button data-cookie-tab="oven">Shop</button><button data-cookie-tab="gacha">Gacha</button><button data-cookie-tab="battle">Battle</button></nav>
   <div class="cookie-room"><div class="cookie-host"><button class="cookie-talk" aria-label="Talk to GingerBrave"><img class="cookie-host-img" src="${ASSET+COOKIE_BRAVE_EMOTIONS.neutral}" alt="GingerBrave"></button><button class="cookie-host-copy" type="button" aria-label="Hear more from GingerBrave"><b class="cookie-name">GingerBrave</b><span class="cookie-speech" role="status" aria-live="polite"></span></button></div><div class="cookie-content"></div></div></div>`;
  s.appendChild(page);
  page.querySelector('.cookie-back').onclick=()=>{this._raidDossier=null;this.go('raid');};
  page.querySelector('.cookie-exit').onclick=()=>this.go('home');
  page.querySelectorAll('[data-cookie-tab]').forEach(b=>{b.classList.toggle('active',b.dataset.cookieTab===this._cookieTab);b.onclick=()=>{this._cookieTab=b.dataset.cookieTab;this.render();};});
  let chat=0;
  const nextLine=()=>cookieHostSay(page,COOKIE_CHAT[++chat%COOKIE_CHAT.length],true);
  page.querySelector('.cookie-talk').onclick=nextLine;
  page.querySelector('.cookie-host-copy').onclick=nextLine;
  const content=page.querySelector('.cookie-content');
  if(this._cookieTab==='gacha')this.cookieGacha(content,page);
  else if(this._cookieTab==='battle')this.cookieBattles(content,page,ev,stage);
  else this.cookieOven(content,page);
  const line=this._cookieNotice||COOKIE_CHAT[this._cookieTab==='battle'?4:this._cookieTab==='gacha'?3:0];this._cookieNotice=null;
  cookieHostSay(page,line);
 },
 cookieOven(content,page){
  const shop=CookieRun.shopOffers();
  const cookieCards=COOKIE_OBTAIN_ORDER.map(({id})=>{const h=Save.hero(id),cost=h&&h.stars<5?Progress.starCost(id):null,progress=h?(cost?`${h.stars}★ · ${fmt(h.shards)} / ${fmt(cost.shards)} to next star`:'★★★★★ · Max stars'):`${fmt(Save.pending(id))} / ${fmt(Save.unlockNeed(id))} to recruit`;
   const badges=BADGE_IDS_FOR(id).filter(bid=>BADGES[bid].cookieRun);
   return `<article class="cookie-shard-offer"><img class="cookie-shard-art" src="${Art.hero(id)}" alt=""><div><h3>${HEROES[id].name}</h3><small>${progress}</small><small class="cookie-badges-owned" title="${badges.map(bid=>BADGES[bid].name).join(' · ')}">🤝 ${badges.map(bid=>BADGES[bid].icon).join(' ')} · 2 badges owned</small></div><button data-cookie-buy="${id}" aria-label="Buy ${shop[id].amount} ${HEROES[id].name} shards and ${fmt(shop[id].ichor)} Ichor for ${shop[id].cost} Cookie Cutters" ${h&&h.stars>=5?'disabled':''}>+${shop[id].amount} shards &amp; 5k Ichor <span>${cookieCutterIcon()} ${shop[id].cost}</span></button></article>`;}).join('');
  content.innerHTML=`<div class="cookie-shop-heading"><div class="cookie-section-heading"><h2>Shop</h2></div><button class="cookie-open-gacha" type="button">🍪 Open Cookie Gacha <span>→</span></button></div><div class="cookie-shop-intro">Hardest → easiest to recruit. Both badge choices are owned from the start; each Cookie wears one at a time.</div><div class="cookie-shard-shop">${cookieCards}</div><div class="cookie-offers cookie-supply-offers">
   <article class="cookie-offer"><div class="cookie-item-icon">📚</div><h3>Training Manuals</h3><p>15 Manuals</p><button data-cookie-buy="manual">${cookieCutterIcon()} 1</button></article>
   <article class="cookie-offer"><div class="cookie-item-icon">✦</div><h3>EXP Bundle</h3><p>6,000 EXP</p><button data-cookie-buy="exp">${cookieCutterIcon()} 1</button></article></div>
   <button class="cookie-adventure">Earn Cookie Cutters in battle <span>→</span></button>`;
  content.querySelectorAll('[data-cookie-buy]').forEach(b=>{const offer=shop[b.dataset.cookieBuy];b.disabled=b.disabled||CookieRun.state().cutters<offer.cost;b.onclick=()=>{if(!CookieRun.buy(b.dataset.cookieBuy)){cookieHostSay(page,{mood:'neutral',text:"We're short on Cookie Cutters. Let's go win some!"});return;}this._cookieNotice={mood:'happy',text:'Nice pick!'};Sound.play('ui_ok');this.render();};});
  content.querySelector('.cookie-open-gacha').onclick=()=>{this._cookieTab='gacha';this.render();};
  content.querySelector('.cookie-adventure').onclick=()=>{this._cookieTab='battle';this.render();};
 },
 cookieGacha(content,page){
  const state=CookieRun.state();content.classList.add('cookie-gacha');
  const pityHtml=COOKIE_OBTAIN_ORDER.map(c=>`<span>${c.name} <b>${Math.max(1,c.pityMax-state[c.pityKey])}</b></span>`).join('');
  const shardProgress=COOKIE_OBTAIN_ORDER.map(c=>`${c.name} ${Save.owns(c.id)?'Recruited':`${Save.pending(c.id)} / ${Save.unlockNeed(c.id)}`}`).join(' · ');
  content.innerHTML=`<div class="cookie-shop-heading"><div class="cookie-section-heading"><h2>Cookie Gacha</h2></div><button class="cookie-return-shop" type="button">← Back to Cookie Run Shop</button></div><div class="cookie-feature" aria-label="Featured Cookie Run heroes"><div class="cookie-feature-halo"></div><img class="cookie-feature-hero cookie-feature-shadow" src="uploads/shadow_milk_raisestaff.gif" alt="Shadow Milk Cookie"><img class="cookie-feature-hero cookie-feature-cream" src="uploads/creampuffidle.gif" alt="Cream Puff Cookie"><img class="cookie-feature-hero cookie-feature-vanilla" src="uploads/purevanillacookieidle.gif" alt="Pure Vanilla Cookie"><img class="cookie-feature-hero cookie-feature-tiger" src="uploads/tigerlilyidletrans.gif" alt="Tiger Lily Cookie and Butter Tiger"><img class="cookie-feature-hero cookie-feature-bright" src="uploads/gingerbrightidle.gif" alt="GingerBright"><div class="cookie-feature-ribbon">✦ FEATURED COOKIES ✦</div></div>
   <div class="cookie-pity"><div class="cookie-pity-head"><span>GUARANTEED COOKIE IN · HARDEST → EASIEST</span><button class="cookie-rates">Probabilities ↗</button></div><div class="cookie-pity-grid">${pityHtml}</div></div>
   <div class="cookie-bake-buttons"><button data-bake="1"><span class="cookie-bake-icon">${cookieCutterIcon()}</span><span><small>BAKE 1</small><b>1 Cutter</b></span></button><button data-bake="10"><span class="cookie-bake-icon">${cookieCutterIcon()}</span><span><small>BAKE 10</small><b>10 Cutters</b></span></button></div>
   <small class="cookie-shard-progress">${shardProgress}</small>`;
  content.querySelector('.cookie-return-shop').onclick=()=>{this._cookieTab='oven';this.render();};
  content.querySelectorAll('[data-bake]').forEach(b=>{b.disabled=state.cutters<Number(b.dataset.bake);b.onclick=()=>{const result=CookieRun.bake(Number(b.dataset.bake));if(!result.ok){cookieHostSay(page,{mood:'neutral',text:result.reason});return;}this.cookieReveal(result.results);this.render();};});
  content.querySelector('.cookie-rates').onclick=()=>{
   const rate=chance=>(chance*100).toFixed(1)+'%';
   const fullRows=COOKIE_OBTAIN_ORDER.map(c=>`<tr><td>${HEROES[c.id].name} · full recruit</td><td>${rate(c.fullChance)}</td></tr>`).join('');
   const shardRows=COOKIE_OBTAIN_ORDER.map(c=>`<tr><td>${c.name} · ${c.shards} shards</td><td>${rate(c.shardChance)}</td></tr>`).join('');
   const manualChance=1-.30-COOKIE_OBTAIN_ORDER.reduce((sum,c)=>sum+c.fullChance+c.shardChance,0);
   const pity=COOKIE_OBTAIN_ORDER.map(c=>`${c.name}: ${c.pityMax}`).join(' · ');
   const prices=COOKIE_OBTAIN_ORDER.map(c=>`${c.name}: ${c.shopCost}`).join(' · ');
   const body=el('div','cookie-rates-body',`<p>Hardest → easiest. Base rates per bake; guarantees take priority. Each bake costs 1 Cookie Cutter.</p><table><tbody>${fullRows}${shardRows}<tr><td>3,000 EXP</td><td>30.0%</td></tr><tr><td>8 Training Manuals</td><td>${rate(manualChance)}</td></tr></tbody></table><p>Full recruit guarantees: ${pity}. Each hero has a separate counter. If several guarantees are due together, the rarest resolves first on consecutive bakes.</p><p>Targeted shop prices for 150 shards and 5,000 Ichor: ${prices} Cookie Cutters. Stage clears award 2–5 Cutters, including repeat clears.</p>`);
   UI.modal('Cookie gacha probabilities',body);
  };
 },
 cookieReveal(results){
  const body=el('section','cookie-reveal');
  body.setAttribute('role','dialog');body.setAttribute('aria-label','Cookie gacha results');
  body.appendChild(el('header','cookie-reveal-head','<h2 class="cookie-reveal-banner">You receive...</h2>'));
  const grid=el('div','cookie-results'+(results.length===1?' single':''));
  results.forEach((r,i)=>{
   const grade=r.rare?'rare':r.full?'full':r.id?'shards':'supplies';
   const name=r.id?HEROES[r.id].name:r.resource==='manual'?'Training Manuals':'EXP';
   const art=r.id==='GingerBrave'?ASSET+COOKIE_BRAVE_EMOTIONS.happy:r.art;
   const icon=r.resource==='manual'?'📚':'✦';
   const award=r.id?(r.isNew?(r.full?'RECRUITED':`+${fmt(r.amount)} SHARDS · RECRUITED`):`+${fmt(r.amount)} SHARDS`):r.resource==='manual'?`+${fmt(r.amount)} MANUALS`:`+${fmt(r.amount)} EXP`;
   const card=el('article','cookie-result '+grade);card.style.setProperty('--reveal-order',i);
   card.innerHTML=`<div class="cookie-result-emblem" aria-hidden="true">${r.full?'✦':r.id?'◆':icon}</div><h3>${name}</h3><div class="cookie-result-art">${r.isNew?'<b class="cookie-result-new">NEW!</b>':r.full?'<b class="cookie-result-duplicate">DUPLICATE</b>':''}${art?`<img src="${art}" alt="">`:`<span aria-hidden="true">${icon}</span>`}</div><div class="cookie-result-payout">${award}</div>`;
   grid.appendChild(card);
  });
  body.appendChild(grid);
  const actions=el('footer','cookie-reveal-actions');
  const ok=el('button','cookie-reveal-ok','OK');ok.type='button';ok.onclick=()=>UI.closeModal();
  actions.appendChild(ok);body.appendChild(actions);
  UI.modal('',body,{bare:true,className:'cookie-reveal-modal',dismissOnBackdrop:true});
  ok.focus();Sound.play('ui_ok');
 },
 cookieBattles(content,page,ev,stage){
  const loan=CookieRun.loan(stage),level=Raid.stageLevel(stage,ev),owned=Save.owns('GingerBrave');
  content.classList.add('cookie-battles');content.innerHTML=`<div class="cookie-section-heading"><h2>Battle</h2></div><div class="cookie-stages">${ev.stageLevels.map((lv,i)=>`<button data-stage="${i}" class="${i===stage?'selected':''}" aria-label="Stage ${i+1}, level ${lv}" aria-pressed="${i===stage}"><b>${Raid.stageCleared(ev.id,i)?'✓':i+1}</b><small>Lv ${lv}</small></button>`).join('')}</div>
  <div class="cookie-required"><img src="${ASSET+COOKIE_BRAVE_EMOTIONS.neutral}" alt="GingerBrave"><div><b>GingerBrave is required</b><small>${owned?'Your own GingerBrave joins each wave.':`Event loan · Lv ${loan.level} · Red ${loan.rarityPlus}`}</small><small>GingerBrave + up to 4 of your Toons</small></div><button class="cookie-kit">Skills</button></div>
  <div class="cookie-enemy-line">${['BerryBishop','PomegranateSnake','CookieScorpion','DangerInTheBox','PaperPuppetKnight','SkelecakeCook'].map(id=>`<button data-enemy="${id}" title="${HEROES[id].name}"><img src="${Art.hero(id)}" alt="${HEROES[id].name}"></button>`).join('')}</div>
  <div class="cookie-wave-copy"><b>STAGE ${stage+1} · LV ${level} · SHADOW MILK BOSS</b></div>
  <div class="cookie-battle-reward"><span>Every clear</span><b>${cookieCutterIcon()} ${CookieRun.reward(stage)} Cookie Cutters</b></div><button class="cookie-fight">Choose team & battle <span>⚔ →</span></button><button class="cookie-sim">Use Raid Tickets</button>`;
  content.querySelectorAll('[data-stage]').forEach(b=>b.onclick=()=>{this._raidStages[ev.id]=Number(b.dataset.stage);this.render();});
  content.querySelector('.cookie-kit').onclick=()=>this.cookieKit('GingerBrave',loan);
  content.querySelectorAll('[data-enemy]').forEach(b=>b.onclick=()=>{const h=HEROES[b.dataset.enemy];const body=el('div','cookie-enemy-info',`<img src="${Art.hero(h.id)}" alt="${h.name}"><p>${h.blurb}</p>${h.cookiePrey?`<p>Prioritizes ${h.cookiePrey}s. Poison ignores Defense and scales with the victim’s maximum HP.${h.id==='PomegranateSnake'?' Venomous Pursuit also inflicts 12% Max-HP Injury for eight seconds.':''}</p>`:''}${h.id==='BerryBishop'?'<p>Slams its staff to heal the ally with the lowest HP percentage. Occasionally summons smaller Healing Bots that heal less, but act faster. Neither can deal damage.</p>':''}${h.id==='DangerInTheBox'?'<p>Deals no damage. On defeat, applies one Status Corruption stack within medium range for 10 seconds and spawns a Paper Puppet Knight. Each stack reduces healing received and Skill Haste by 10%.</p>':''}<p>Encounter only · B-tier combat strength</p>`);UI.modal(h.name,body);});
  const allowed=Raid.canEnter(ev.id,stage);content.querySelector('.cookie-fight').disabled=!allowed;content.querySelector('.cookie-sim').disabled=!allowed;
  content.querySelector('.cookie-fight').onclick=()=>this.raidFight(ev.id,stage);
  content.querySelector('.cookie-sim').onclick=()=>this.raidTicketSetup(ev,stage);
 },
 cookieTeamSetup(ev,stage,onConfirm){
  const owned=Save.owns('GingerBrave'),loan=owned?playerSpec('GingerBrave'):CookieRun.loan(stage);
  const body=el('div','team-editor-body');
  body.appendChild(el('div','cookie-required',`<img src="${ASSET+COOKIE_BRAVE_EMOTIONS.neutral}" alt="GingerBrave"><div><b>🔒 GingerBrave · required</b><small>${owned?'Your Hero':'Temporary event loan'} · Lv ${loan.level} · ${rarityLabel(loan.rarity,loan.rarityPlus)}</small><small>Choose up to four companions below.</small></div>`));
  const picker=UI.teamPicker({filter:id=>id!=='GingerBrave',maxSize:4,team:Save.data.team.filter(id=>id!=='GingerBrave')});
  const scroll=el('div','team-editor-scroll');scroll.appendChild(picker.node);body.appendChild(scroll);
  const go=el('button','btn go wide team-confirm','Begin Stage '+(stage+1));
  go.onclick=()=>{if(!picker.valid){UI.toast('Choose at least one companion');return;}const ids=picker.team.filter(Boolean);if(owned)ids.unshift('GingerBrave');UI.closeModal({skipHook:true});onConfirm(ids);};body.appendChild(go);
  UI.modal('Cookie Run · Stage '+(stage+1),body,{className:'team-editor-modal'});
 },
 cookieKit(id,spec){const body=el('div','cookie-kit-body');SKILL_ORDER.forEach(key=>{const skill=HEROES[id].skills[key];if(!skill)return;body.appendChild(el('article','cookie-skill',`<small style="color:${RARITY_COLORS[SKILL_RARITY[key]]}">${RARITY_NAMES[SKILL_RARITY[key]].toUpperCase()} · ${skill.type}</small><h3>${skill.name}</h3><p>${skill.desc(skill.v,skill.p)}</p>`));});UI.modal(HEROES[id].name+' · Skills',body);}
});
