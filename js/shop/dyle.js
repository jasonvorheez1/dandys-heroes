/* Dyle's personal notes and permanent appearance gifts use the existing save. */
'use strict';
const DyleShop = (() => {
  const records = [
    { id:'kh', mode:'dyleKh', title:'Dearly Beloved', source:'Kingdom Hearts', cost:75000 },
    { id:'ff7', mode:'dyleFf7', title:'Main Theme', source:'Final Fantasy VII', cost:75000 },
    { id:'ode', mode:'dyleOde', title:'Ode to Joy', source:'Beethoven', cost:75000 }
  ];
  const owned = id => Save.owns(id);
  const stars = id => Save.data.heroes?.[id]?.stars || 0;
  const chapterClear = (chapter, node, hard = false) => typeof MainStory !== 'undefined' && MainStory.withCh(chapter, () => hard ? MainStory.hardDone(node) : MainStory.done(MainStory.nodeIdx(node)));
  const files = [
    { id:'small-records', title:'A small recordkeeping habit', tag:'At the counter', mood:'thoughtful', hint:'Visit Dyle’s shop.', open:() => true,
      text:'Haha… I sometimes like to do my own small recordkeeping and investigations. Dandy keeps receipts. I keep the things people say before they notice someone is listening. Entirely different filing systems.' },
    { id:'time-to-browse', title:'Right on time', tag:'At the counter', mood:'pleased', hint:'Visit Dyle’s shop.', open:() => true,
      text:'You know, a timetable is a promise. People tend to remember the train that arrived late and forget the hundred that arrived exactly when they needed it. I remember those too.' },
    { id:'sprout-apron', title:'Something sweet', tag:'Sprout', mood:'amused', hint:'Recruit Sprout.', open:() => owned('Sprout'),
      text:'Sprout checked the stitching on that caramel apron before he looked at the colour. Practical fellow. Then he asked whether I had another one in Cosmo’s size. I had only put the first one on the counter.' },
    { id:'two-plates', title:'Always a second plate', tag:'Sprout & Cosmo', mood:'warm', hint:'Recruit Sprout and Cosmo.', open:() => owned('Sprout') && owned('Cosmo'),
      text:'Cosmo says he baked too much. Sprout says he happened to be passing. Yet there are always two plates ready before either of them gives an excuse. I shall leave the arithmetic to you.' },
    { id:'my-file', title:'The file with my name on it', tag:'Dyle', mood:'skeptical', hint:'Recruit Dyle.', open:() => owned('Dyle'),
      text:'Dandy has a file about me, naturally. I asked to read it. He said it was confidential. Curious, considering I appear to be the source, the subject, and the person expected to carry the file upstairs.' },
    { id:'hug-report', title:'An incident, apparently', tag:'Goob', mood:'concerned', hint:'Recruit Goob.', open:() => owned('Goob'),
      text:'Goob meant well. I would like that written at the top of the report. Beneath it, please write that a hug should end before someone has time to reconsider every appointment on their schedule.' },
    { id:'rudie-fast', title:'Early is a direction', tag:'Rudie', mood:'amused', hint:'Promote Rudie to 2★.', open:() => stars('Rudie') >= 2,
      text:'Rudie reached the platform before everyone else. Unfortunately, it was the wrong platform. He reached the correct one before everyone else too. I suppose that is one way to solve a navigation problem.' },
    { id:'counter-ledger', title:'A very flexible ledger', tag:'Dandy', mood:'skeptical', hint:'Upgrade Dandy’s counter to level 10.', open:() => (Save.data.shop?.level || 0) >= 10,
      text:'Dandy tells me every counter upgrade is an investment in our future. His handwriting gets noticeably smaller whenever he writes down who paid for it. A fascinating economy of ink.' },
    { id:'experienced', title:'The quiet before departure', tag:'Field notes', mood:'thoughtful', hint:'Reach Mastery 20.', open:() => (Save.data.mastery || 1) >= 20,
      text:'You are learning to pause before you rush in. That is worth more than people think. A moment spent checking who is missing can save an entire journey spent looking for them.' },
    { id:'below-lobby', title:'Ten floors down', tag:'The Depths', mood:'concerned', hint:'Reach floor 10 in the Depths.', open:() => (Save.data.bestFloor || 0) >= 10,
      text:'Down there, a familiar face is not always a familiar person. Watch what they do before you trust what you recognise. And when you return, tell someone you made it back. We do notice.' },
    { id:'platform-nine', title:'The platform remembers', tag:'Chapter 2', mood:'serious', hint:'Clear Platform Nine in Chapter 2.', open:() => chapterClear(2,'k4'),
      text:'An empty platform is never entirely quiet. Rails settling. A light buzzing. Your own footsteps, arriving a fraction later than you expect. I prefer the sound of a train. At least a train tells you where it is going.' },
    { id:'mirror-records', title:'Two versions of a story', tag:'Dandy’s files', mood:'curious', hint:'Read 3 case files in Dandy’s shop.', open:() => new Set(Save.data.seen?.gossipCases || []).size >= 3,
      text:'You have been reading Dandy’s files? Then you will have noticed how often he is standing just outside the important part of the story. I would never call that suspicious. I would simply keep a second set of notes.' },
    { id:'friendship', title:'Someone waiting for you', tag:'Friendship', mood:'warm', hint:'Complete any Friendship Campaign.', open:() => Object.values(CAMPAIGNS).some(c => Save.campaignStage(c.id) >= c.stages.length),
      text:'A finished journey is a fine thing. Having someone who would make the journey with you again is finer. Do not let the badge do all the remembering for you.' },
    { id:'reserve-hard', title:'A carefully kept promise', tag:'Chapter 2 · Hard', mood:'serious', hint:'Clear The Reserve on Hard in Chapter 2.', open:() => chapterClear(2,'k11',true),
      text:'You went back, knowing how difficult it would be. I have recorded that. Some things deserve to be kept somewhere a little safer than a rumour passed across a counter.' }
  ];
  function state() {
    Save.data.shop ||= { bought:{}, refreshes:{}, level:0 };
    if (!Save.data.shop.dyle || typeof Save.data.shop.dyle !== 'object' || Array.isArray(Save.data.shop.dyle)) Save.data.shop.dyle = {};
    const s = Save.data.shop.dyle;
    if (!Array.isArray(s.read)) s.read = [];
    if (!Array.isArray(s.skins)) s.skins = [];
    if (!Array.isArray(s.records)) s.records = [];
    if (!Array.isArray(s.stickers)) s.stickers = [];
    return s;
  }
  function hasRecord(id) { return state().records.includes(id); }
  function buyRecord(id) {
    const record = records.find(item => item.id === id);
    if (!record || hasRecord(id) || !Save.can({ tape:record.cost })) return false;
    Save.data.res.tape -= record.cost;
    state().records.push(id);
    Save.write();
    UI.refreshBar();
    return true;
  }
  function readCount() { return files.filter(f => state().read.includes(f.id)).length; }
  function hear(id) {
    const file = files.find(f => f.id === id);
    if (!file || !file.open()) return null;
    if (!state().read.includes(id)) { state().read.push(id); Save.write(); }
    return file;
  }
  function hasSkin() { return state().skins.includes('salted-caramel') || (Save.data.heroes?.Sprout?.costumes || []).includes('salted-caramel'); }
  function ready() { return owned('Sprout') && readCount() >= 4; }
  function claim() {
    if (hasSkin() || !ready()) return false;
    state().skins.push('salted-caramel');
    const hero = Save.hero('Sprout');
    if (!Array.isArray(hero.costumes)) hero.costumes = [];
    if (!hero.costumes.includes('salted-caramel')) hero.costumes.push('salted-caramel');
    Save.write();
    return true;
  }
  function renderGossip(contents, root, api) {
    const panel = el('div', 'dyle-files');
    panel.innerHTML = `<div class="market-section-label"><b>Personal records</b><span>${readCount()} / ${files.length} heard</span></div><div class="dyle-gossip-grid"></div>`;
    contents.appendChild(panel);
    const grid = $('.dyle-gossip-grid', panel);
    files.forEach(file => {
      const unlocked = file.open(), read = state().read.includes(file.id);
      const card = el('button', 'dyle-gossip-card' + (unlocked ? '' : ' locked') + (read ? ' read' : ''));
      card.type = 'button'; card.dataset.dyleFile = file.id; card.dataset.search = `${file.title} ${file.tag} ${file.hint}`.toLowerCase();
      card.dataset.available = String(unlocked); card.dataset.unread = String(!read && unlocked);
      card.innerHTML = `<span class="dyle-file-icon" aria-hidden="true">${unlocked ? '✦' : '⌑'}</span><span class="dyle-file-copy"><small>${file.tag}</small><b>${file.title}</b><span>${unlocked ? read ? 'Listen again' : 'New conversation' : file.hint}</span></span><span class="dyle-file-status">${unlocked ? read ? '↻' : '▶' : 'LOCKED'}</span>`;
      card.setAttribute('aria-label', `${file.title}. ${unlocked ? read ? 'Listen again' : 'Hear gossip' : 'Locked: ' + file.hint}`);
      card.onclick = () => {
        if (!file.open()) { Sound.play('ui_err'); api.say(`That note is still sealed. ${file.hint}`, 'thoughtful'); return; }
        const wasReady = ready();
        hear(file.id);
        Sound.play('ui_ok');
        panel.remove(); renderGossip(contents, root, api);
        $(`[data-dyle-file="${file.id}"]`,root)?.focus({preventScroll:true});
        api.say(file.text, file.mood); api.filter();
        if (!wasReady && ready() && !hasSkin()) UI.toast('Salted caramel is ready to claim in Dyle’s Skins.');
      };
      grid.appendChild(card);
    });
  }
  function renderSkins(contents, root, api) {
    const ownedSkin = hasSkin(), canClaim = ready(), sprout = owned('Sprout');
    const equipped = sprout && Save.hero('Sprout').costume === 'salted-caramel';
    const card = el('article', 'dyle-skin-card');
    card.innerHTML = `<div class="dyle-skin-art"><span class="dyle-skin-stamp">${ownedSkin ? 'COLLECTED' : 'DYLE’S GIFT'}</span><img src="assets/skins/sprout-salted-caramel.svg" alt="Sprout in the Salted caramel skin"><span class="dyle-skin-floor"></span></div>
      <div class="dyle-skin-copy"><small>SPROUT · APPEARANCE</small><h2>Salted caramel</h2><p>A caramel apron, striped scarf, and a little something sweet.</p>
      ${ownedSkin ? '<div class="dyle-skin-owned">✓ Added to your collection</div>' : `<div class="dyle-skin-requirements"><div class="${sprout ? 'done' : ''}"><i>${sprout ? '✓' : '○'}</i><span>Recruit Sprout</span></div><div class="${readCount() >= 4 ? 'done' : ''}"><i>${readCount() >= 4 ? '✓' : '○'}</i><span>Hear 4 of Dyle’s gossip files</span><b>${Math.min(4,readCount())}/4</b></div><div class="dyle-reward-progress"><i style="width:${Math.min(100,readCount()/4*100)}%"></i></div></div>`}
      <button class="market-primary dyle-skin-action" ${!ownedSkin && !canClaim || ownedSkin && !sprout ? 'disabled' : ''}>${ownedSkin ? !sprout ? 'Recruit Sprout to equip' : equipped ? 'Use default appearance' : 'Equip on Sprout' : canClaim ? 'Claim free skin' : 'Complete the requirements'}</button>
      ${!ownedSkin && !canClaim ? '<button class="market-text-button dyle-to-gossip">Visit Dyle’s gossip →</button>' : ''}</div>`;
    contents.appendChild(card);
    $('.dyle-skin-action', card).onclick = () => {
      if (!hasSkin()) {
        if (!claim()) return;
        Sound.play('get_rare');
        Screens._shopNextLine = 'For Sprout. A small thank-you for taking the time to listen. Tell him the apron has already passed a very thorough inspection.';
        Screens._shopNextMood = 'pleased';
      } else if (owned('Sprout')) {
        Save.hero('Sprout').costume = equipped ? null : 'salted-caramel'; Save.write(); Sound.play('ui_ok');
        Screens._shopNextLine = equipped ? 'Back to the familiar look. The caramel apron will be here whenever Sprout wants it.' : 'A splendid fit. I had a feeling he would like it.';
        Screens._shopNextMood = 'pleased';
      }
      Screens.render();
    };
    $('.dyle-to-gossip', card)?.addEventListener('click', () => { Screens.dyleShopTab = 'gossip'; Screens.render(); });
  }
  function renderRadio(contents, root, api) {
    const list = el('div', 'dyle-radio-list');
    contents.appendChild(list);
    records.forEach(record => {
      const ownedRecord = hasRecord(record.id);
      const selected = Music.getMenuMode() === record.mode;
      const card = el('article', 'dyle-radio-card' + (ownedRecord ? ' owned' : ''));
      card.innerHTML = `<span class="dyle-radio-symbol" aria-hidden="true">♫</span><div class="dyle-radio-copy"><small>${record.source}</small><h3>${record.title}</h3><span>${ownedRecord ? selected ? 'Playing in menus' : 'Unlocked for menu music' : 'Permanent menu music unlock'}</span></div><button class="market-primary dyle-radio-action" type="button">${ownedRecord ? selected ? 'Selected' : 'Select track' : `Unlock · 📼 ${fmt(record.cost)}`}</button>`;
      const action = $('.dyle-radio-action', card);
      action.disabled = ownedRecord && selected || !ownedRecord && !Save.can({ tape:record.cost });
      action.onclick = () => {
        if (!hasRecord(record.id)) {
          if (!buyRecord(record.id)) return;
          Sound.play('get_rare');
          api.say(`A fine choice. ${record.title} is yours to play from the radio whenever you like.`, 'pleased');
        } else {
          Music.setMenuMode(record.mode);
          Sound.play('ui_ok');
          api.say(`${record.title}. I will put it on the timetable.`, 'pleased');
        }
        list.remove(); renderRadio(contents, root, api);
      };
      list.appendChild(card);
    });
  }
  /* Profile stickers: Ichor purchases, some held back until a Mastery level. */
  function hasSticker(id) { return state().stickers.includes(id); }
  function buySticker(id) {
    const sticker = BOOK_SHOP_STICKERS.find(item => item.id === id);
    if (!sticker || hasSticker(id) || bookLocked(sticker) || !Save.can({ ichor:sticker.cost })) return false;
    Save.data.res.ichor -= sticker.cost;
    state().stickers.push(id);
    Save.write();
    UI.refreshBar();
    return true;
  }
  function renderStickers(contents, root, api) {
    const grid = el('div', 'dyle-sticker-grid');
    contents.appendChild(grid);
    BOOK_SHOP_STICKERS.forEach(sticker => {
      const owned = hasSticker(sticker.id), locked = !owned && bookLocked(sticker);
      const card = el('article', 'dyle-sticker-card' + (owned ? ' owned' : '') + (locked ? ' locked' : ''));
      card.innerHTML = `<img src="assets/stickers/${sticker.id}.webp" alt="" loading="lazy"><b>${sticker.label}</b><button class="market-primary dyle-sticker-action" type="button">${owned ? 'In your book' : locked ? `🔒 Mastery ${sticker.mastery}` : `<img class="currency-icon ichor-icon" src="uploads/ichor.png" alt="Ichor"> ${fmt(sticker.cost)}`}</button>`;
      const action = $('.dyle-sticker-action', card);
      action.disabled = owned || locked || !Save.can({ ichor:sticker.cost });
      action.onclick = () => {
        if (!buySticker(sticker.id)) return;
        Sound.play('get_item');
        api.say(`“${sticker.label}” — filed under your name. You'll find it in your profile book.`, 'pleased');
        grid.remove(); renderStickers(contents, root, api);
      };
      grid.appendChild(card);
    });
  }
  return { files, records, state, hasSticker, buySticker, renderStickers, readCount, hear, hasSkin, ready, claim, hasRecord, buyRecord, renderGossip, renderSkins, renderRadio };
})();
