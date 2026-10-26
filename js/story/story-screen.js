/* story-screen.js - Main Story · Chapter 1 "The Malfunction".
   Progress state, the timeline hub ("The Day"), Handler files, battle prep,
   the visual novel player and the home-page feature card. Battles run in
   story-battle.js. Everything hangs off the existing Screens / Save / Music. */
'use strict';

/* ------------------------------------------------------------ registrations */
Object.assign(MUSIC_TRACKS, {
  stNeutral: uploadUrl('storyneutral.mp3'), stInteresting: uploadUrl('storyinteresting.mp3'),
  stEmotional: uploadUrl('storyemotional.mp3'), stBattle: uploadUrl('storybattle.mp3'),
  stClair: MUSIC_TRACKS.navigationClairDeLune, stShop: MUSIC_TRACKS.shop, stDelilah: MUSIC_TRACKS.delilahEvent,
  stJournal: MUSIC_TRACKS.journal, stGlossary: MUSIC_TRACKS.glossary, stBossa: MUSIC_TRACKS.phantasiaShop,
  stTwisted: MUSIC_TRACKS.eventBattle, stNormal: MUSIC_TRACKS.battle, stNormal2: uploadUrl('battletheme2.mp3'),
  stUnknown: MUSIC_TRACKS.unknownWorldBattle, stBoss: MUSIC_TRACKS.unknownWorldBossBattle, stColossus: MUSIC_TRACKS.arena,
  stQom: MUSIC_TRACKS.qomMenu
});
Object.assign(MUSIC_TRACK_TRIMS, { stColossus: .39, stQom: .66 });

const ST_VN_ART = {
  Arthur: 'uploads/arthurvmportrait.webp', Delilah: 'uploads/delilahvmportrait.webp', Sprout: 'uploads/sproutvmportrait.webp',
  Dandy: 'uploads/dandyhimself.webp', Ginger: 'uploads/gingervnportait.webp', Shrimpo: 'uploads/shrimpovnportrait.webp'
};
const ST_COLORS = {
  Devan: '#d9dde2', Veronica: '#46d65a', Sam: '#ff5a5f', Shannon: '#f3b04a', Austin: '#6f8cff',
  Arthur: '#b98cff', Delilah: '#f1e7cf', Dandy: 'rainbow', Intercom: '#7fe3ff', Reporter: '#ffd36b', Lily: '#ffb3d1'
};
const ST_VOICE = {
  Dandy: { tick: 'dandy_text', vol: .3 }, Vee: { cue: 'hero_vee_talk' }, Shelly: { cue: 'hero_shelly_talk' }, Sprout: { cue: 'hero_sprout_talk' },
  Astro: { cue: 'hero_astro_talk' }, Pebble: { cue: 'pebble_talk' }, Devan: { tick: 'kh_blip', rate: .95 }, Veronica: { tick: 'kh_blip', rate: 1.15 },
  Sam: { tick: 'kh_blip', rate: 1.3 }, Shannon: { tick: 'kh_blip', rate: 1.4 }, Austin: { tick: 'kh_blip', rate: .8 }, Arthur: { tick: 'kh_blip', rate: .72 },
  Delilah: { tick: 'kh_blip', rate: .9 }, Lily: { tick: 'kh_blip', rate: 1.7 }, Boxten: { tick: 'kh_blip', rate: 1.2 }, Intercom: { tick: 'ui_move', rate: 1.2 }
};
const ST_EMOTES = {
  '!': ['!', 'warn'], '?': ['?', 'ui_move'], anger: ['💢', 'shrink2'], sweat: ['💧', 'cloth'], note: ['♪', 'sparkle'], heart: ['❤', 'sparkle'],
  idea: ['💡', 'ding'], dots: ['…', null], tears: ['💧', 'ui_back'], sparkle: ['✨', 'sparkle'], shock: ['‼', 'warn'], blush: ['///', 'pop2']
};

function msWho(who) {
  if (who === 'Voice') return '???';
  if (/^Twisted/.test(who)) return 'Twisted ' + who.slice(7);
  if (ST_HANDLERS[who]) return ST_HANDLERS[who].name;
  return HEROES[who] ? HEROES[who].name : who;
}
function stPortrait(who) {
  if (ST_HANDLERS[who]) return ASSET + ST_HANDLERS[who].art;
  if (ST_VN_ART[who]) return ASSET + ST_VN_ART[who];
  if (/^Twisted/.test(who)) return Art.twisted(who.slice(7));
  if (HEROES[who] && HEROES[who].folder) return Art.defaultHero(who);
  return null;
}
/* Art for either cast: Handlers carry their own art, Toons use the VN portrait or their Hero render. */
function stCharUrl(id) {
  if (ST_HANDLERS[id]) return ASSET + ST_HANDLERS[id].art;
  return ST_VN_ART[id] ? ASSET + ST_VN_ART[id] : Art.hero(id);
}
function stBattleUrl(id) { return ST_HANDLERS[id] ? ASSET + ST_HANDLERS[id].art : Art.battleHero(id); }
function stToonArt(id) { return ST_VN_ART[id] ? ASSET + ST_VN_ART[id] : Art.defaultHero(id); }
function stEnemyArt(key) {
  const a = ST_ENEMIES[key].art, [kind, id] = a.split(':');
  if (kind === 'w') return Art.weakling(id);
  if (kind === 't') return Art.twisted(id);
  return ASSET + ST_VN_ART[id];
}
function stBg(key) { return ST_BG[key] != null ? (ST_BG[key] ? ASSET + ST_BG[key] : '') : ASSET + key; }
function stTrack(key) { return ST_MUSIC[key] || key; }

/* ------------------------------------------------------------ handler skins */
Object.entries(ST_SKINS).forEach(([toon, sk]) => {
  // Handler cutouts face left in their source art; live combat tracks targets
  // from a right-facing baseline unless the skin supplies its native facing.
  HERO_SKINS[toon] = { id: sk.id, name: sk.name, art: sk.art, noRig: true, nativeFace: -1,
    description: `${toon} borrows ${ST_HANDLERS[sk.handler].full}'s Handler uniform. Earned by clearing "${ST_NODES.find(n => n.id === sk.node).name}" on Hard in the Main Story.` };
  Object.defineProperty(HERO_SKINS[toon], 'available', { configurable: true, enumerable: true,
    get() { try { return MainStory.hardDone(sk.node); } catch (_) { return false; } } });
});

/* ------------------------------------------------------------ progress */
const MainStory = {
  ch: 1,   // the chapter the hub, prep and battles are showing (1 = Handlers, 2 = Toons)
  get nodes() { return this.ch === 2 ? ST2_NODES : ST_NODES; },
  get ids() { return this.ch === 2 ? ST_TOON_IDS : ST_HANDLER_IDS; },
  get hard() { return this.ch === 2 ? ST2_HARD : ST_HARD; },
  chapter2Open() { return true; },   // every chapter can be played at any point
  withCh(ch, fn) { const was = this.ch; this.ch = ch; try { return fn(); } finally { this.ch = was; } },
  state() {
    const d = Save.data, key = this.ch === 2 ? 'mainStory2' : 'mainStory';
    if (!d[key] || typeof d[key] !== 'object') d[key] = {};
    const s = d[key];
    if (!s.cleared) s.cleared = {};
    if (!s.lv) s.lv = {};
    if (!s.rows) s.rows = {};
    if (!Array.isArray(s.party)) s.party = [];
    if (this.ch === 2) {
      if (!s.shop || typeof s.shop !== 'object') s.shop = {};
      if (!s.shop.items || typeof s.shop.items !== 'object') s.shop.items = {};
    }
    const startLv = this.ch === 2 ? ST_TOON_START_LV : 1;
    this.ids.forEach(id => {
      const l = s.lv[id] || (s.lv[id] = { lv: startLv, exp: 0 });
      l.lv = clamp(Math.floor(Number(l.lv) || startLv), startLv, 80); l.exp = Math.max(0, Math.floor(Number(l.exp) || 0));
      if (!s.rows[id]) s.rows[id] = ['Devan', 'Shannon', 'Tisha', 'Goob', 'Dyle', 'Scraps', 'Brightney', 'Coal', 'Rudie', 'Shelly'].includes(id) ? 'front' : 'back';
    });
    return s;
  },
  done(i) {
    const n = this.nodes[i], c = this.state().cleared[i];
    return !!(n && c && (n.type === 'story' ? c.story : (c.easy || c.hard)));
  },
  unlocked(i) { return i === 0 || (i > 0 && i < this.nodes.length && this.done(i - 1)); },
  current() { for (let i = 0; i < this.nodes.length; i++) if (!this.done(i)) return i; return this.nodes.length - 1; },
  complete() { return this.done(this.nodes.length - 1); },
  progress() { return this.nodes.filter((n, i) => this.done(i)).length / this.nodes.length; },
  sceneIdx(key) { return this.nodes.findIndex(n => n.scene === key); },
  seen(key) { const i = this.sceneIdx(key); return i >= 0 && this.done(i); },
  nodeIdx(id) { return this.nodes.findIndex(n => n.id === id); },
  hardDone(id) { const i = this.nodeIdx(id), c = this.state().cleared[i]; return !!(c && c.hard); },
  mark(i, mode) {
    const s = this.state();
    s.cleared[i] = Object.assign({}, s.cleared[i], { [mode]: true });
    Save.write();
  },
  /* Who is with the party at node i (joins and losses up to and including i). */
  rosterAt(i) {
    const s = new Set();
    this.nodes.slice(0, i + 1).forEach(n => { (n.join || []).forEach(x => s.add(x)); (n.leave || []).forEach(x => s.delete(x)); });
    return this.ids.filter(id => s.has(id));
  },
  /* Status for the Handler files, at the player's current progress. */
  status(id) {
    const upTo = this.complete() ? this.nodes.length - 1 : this.current() - 1;
    let met = false, gone = null;
    this.nodes.slice(0, upTo + 1).forEach(n => {
      if ((n.join || []).includes(id)) { met = true; gone = null; }
      if ((n.leave || []).includes(id)) gone = n.scene === 's14' ? 'lost' : 'missing';
    });
    return !met ? 'unmet' : gone || 'active';
  },
  skillOpen(sk) { return sk.unlock === 'badge' || this.seen(sk.unlock); },
  unlockName(sk) { const i = this.sceneIdx(sk.unlock); return i >= 0 ? ST_STORY[sk.unlock].title : ''; },
  lv(id) { return this.state().lv[id]; },
  /* The story never leaves you below the fight it is asking for. */
  floor(ids, lv) { ids.forEach(id => { const l = this.lv(id); if (l.lv < lv) { l.lv = lv; l.exp = 0; } }); Save.write(); },
  addExp(id, amt) {
    const l = this.lv(id); let ups = 0;
    l.exp += Math.round(amt);
    while (l.lv < 60 && l.exp >= stExpNeed(l.lv)) { l.exp -= stExpNeed(l.lv); l.lv++; ups++; }
    return ups;
  },
  foeLevel(n, mode) { return n.lv + (mode === 'hard' ? this.hard.lv : 0); },
  itemsFor(mode) { return Object.assign({}, this.ch === 2 ? ST2_ITEMS_FOR[mode] : ST_ITEMS_FOR[mode]); },
  foeMult(n, mode) {
    const h = mode === 'hard' ? this.hard.mult : {}, t = (n.tune && n.tune[mode]) || {};
    return { hp: (h.hp || 1) * (t.hp || 1), atk: (h.atk || 1) * (t.atk || 1), def: (h.def || 1) * (t.def || 1) };
  },
  rewards(n, mode, first) {
    const lv = this.foeLevel(n, mode), boss = !!n.boss;
    const base = this.ch === 2
      ? { ichor: Math.round(1500 + lv * 110), exp: Math.round(1100 + lv * 80), star: 24 + lv * 3, tape: 5 + Math.round(lv / 3), notes: 6 + Math.round(lv / 4) }
      : { ichor: Math.round(800 + lv * 70), exp: Math.round(600 + lv * 55), star: 14 + lv * 2, tape: 3 + Math.round(lv / 4) };
    if (!first) return masteryRewardBundle({ ichor: Math.round(base.ichor * .3), exp: Math.round(base.exp * .3) });
    if (mode === 'easy') return masteryRewardBundle(base);
    return Object.assign(masteryRewardBundle({ ichor: base.ichor * 2, exp: base.exp * 2, star: base.star * 2, tape: base.tape * 2, notes: (base.notes || 0) * 2 }),
      { core: (this.ch === 2 ? 2 : 1) + (boss ? 1 : 0) }, boss ? { main: this.ch === 2 ? 2 : 1 } : {});
  },
  sceneReward(i) { return this.ch === 2 ? masteryRewardBundle({ ichor: 520 + i * 50, notes: 8 + Math.round(i / 2) }) : masteryRewardBundle({ ichor: 260 + i * 30, notes: 4 + Math.round(i / 3) }); },
  /* ----- Chapter 2: Dandy's Shop stock and Tapes ----- */
  stock(id) { return (this.ch === 2 && this.state().shop.items[id]) || 0; },
  tapeOpen(t) { return t.hard ? this.hardDone(t.unlock) : (this.nodeIdx(t.unlock) >= 0 ? this.done(this.nodeIdx(t.unlock)) : this.seen(t.unlock)); },
  shopOpen() { return this.ch === 2 && this.seen('c2s8'); }
};

/* ------------------------------------------------------------ the hub */
const StoryUI = {
  tab: 'story', sel: null, overlay: false,

  hubTrack() {
    if (MainStory.ch === 2) return MainStory.complete() ? 'stEmotional' : MainStory.current() >= MainStory.sceneIdx('c2s10') ? 'stJournal' : 'stNeutral';
    return MainStory.complete() ? 'stEmotional' : MainStory.current() >= MainStory.sceneIdx('s9') ? 'stJournal' : 'stNeutral';
  },
  storyTime(i) {
    const n = MainStory.nodes[i];
    for (let k = i; k >= 0; k--) if (MainStory.nodes[k].type === 'story') return ST_STORY[MainStory.nodes[k].scene].time;
    return n ? (MainStory.ch === 2 ? '11:52 PM' : '7:58 AM') : '';
  },
  storyDate(i) {
    for (let k = i; k >= 0; k--) if (MainStory.nodes[k].type === 'story') return (ST_STORY[MainStory.nodes[k].scene].date || 'JUNE 24, 2002').replace(/(^|\s)(\w)(\w*)/g, (m, a, b, c) => a + b + c.toLowerCase());
    return 'June 24, 2002';
  },
  clockAngles(time) {
    const m = /(\d+):(\d+)\s*(AM|PM)/.exec(time || '');
    if (!m) return { h: 0, m: 0 };
    const h = (+m[1] % 12) + +m[2] / 60;
    return { h: h * 30, m: +m[2] * 6 };
  },
  clockSvg(time, cls) {
    const a = this.clockAngles(time);
    const ticks = Array.from({ length: 12 }, (_, k) => `<line x1="50" y1="${k % 3 ? 9 : 7}" x2="50" y2="${k % 3 ? 13 : 16}" transform="rotate(${k * 30} 50 50)"/>`).join('');
    return `<svg class="ms-clock ${cls || ''}" viewBox="0 0 100 100" aria-hidden="true"><circle class="ms-clock-face" cx="50" cy="50" r="46"/><g class="ms-clock-ticks">${ticks}</g>
      <line class="ms-clock-h" x1="50" y1="50" x2="50" y2="27" style="transform:rotate(${a.h}deg)"/><line class="ms-clock-m" x1="50" y1="50" x2="50" y2="15" style="transform:rotate(${a.m}deg)"/>
      <line class="ms-clock-s" x1="50" y1="56" x2="50" y2="12"/><circle cx="50" cy="50" r="3.4" class="ms-clock-pin"/></svg>`;
  },

  render(s) {
    MainStory.state();
    if (this.sel == null || !MainStory.unlocked(this.sel)) this.sel = MainStory.current();
    const ch2 = MainStory.ch === 2;
    if (!ch2 && this.tab === 'shop') this.tab = 'story';
    if (this.tab === 'shop' && !MainStory.shopOpen()) this.tab = 'story';
    const cur = MainStory.current(), time = MainStory.complete() ? 'June 29, 2002' : this.storyTime(cur);
    const head = ch2
      ? ['CHAPTER 2', 'BUSINESS AS USUAL', MainStory.complete() ? 'July 8, 2002 · Still closed' : this.storyDate(cur) + ' · ' + time]
      : ['CHAPTER 1', 'THE MALFUNCTION', MainStory.complete() ? 'June 29, 2002 · Closed' : 'June 24, 2002 · ' + time];
    const tabs = ch2 ? [['story', 'The Story'], ['handlers', 'Toons']].concat(MainStory.shopOpen() ? [['shop', 'Dandy’s Shop']] : []) : [['story', 'The Day'], ['handlers', 'Handlers']];
    const page = el('section', 'ms-page' + (ch2 ? ' ms-ch2' : ''));
    page.innerHTML = `
      <div class="ms-drips" aria-hidden="true">${Array.from({ length: 9 }, (_, k) => `<i style="--k:${k}"></i>`).join('')}</div>
      <header class="ms-head">
        <button class="ms-back" type="button" aria-label="Back to Home">‹</button>
        ${this.clockSvg(MainStory.complete() ? '' : time)}
        <div class="ms-titles"><small>MAIN STORY · ${head[0]}</small><b>${head[1]}</b><span>${head[2]}</span></div>
      </header>
      <div class="ms-progress" aria-label="Chapter progress"><i style="width:${Math.round(MainStory.progress() * 100)}%"></i><b>${Math.round(MainStory.progress() * 100)}%</b></div>
      <nav class="ms-tabs">${tabs.map(([k, n]) => `<button data-tab="${k}" class="${this.tab === k ? 'on' : ''}">${n}</button>`).join('')}</nav>
      <div class="ms-body"></div>`;
    s.appendChild(page);
    page.querySelector('.ms-back').onclick = () => { Sound.play('ui_back'); Screens.go('storyCover'); };
    page.querySelectorAll('[data-tab]').forEach(b => b.onclick = () => { Sound.play('ui_move'); this.tab = b.dataset.tab; Screens.render(); });
    const body = page.querySelector('.ms-body');
    if (this.tab === 'handlers') this.handlersTab(body); else if (this.tab === 'shop') this.shopTab(body); else this.timeline(body);
    if (this.pendingResult) { const r = this.pendingResult; this.pendingResult = null; setTimeout(() => StoryBattleUI.showResult(r), 60); }
  },

  timeline(body) {
    const cur = MainStory.current(), list = el('ol', 'ms-line');
    const fillTo = MainStory.complete() ? 100 : cur / (MainStory.nodes.length - 1) * 100;
    list.style.setProperty('--fill', fillTo + '%');
    MainStory.nodes.forEach((n, i) => {
      const open = MainStory.unlocked(i), done = MainStory.done(i), c = MainStory.state().cleared[i] || {};
      const li = el('li', `ms-node ${n.type}${open ? '' : ' locked'}${done ? ' done' : ''}${i === cur && !MainStory.complete() ? ' now' : ''}`);
      li.style.setProperty('--i', i);
      if (n.type === 'story') {
        const sc = ST_STORY[n.scene], firstBg = ([...sc.script.matchAll(/@bg (\S+)/g)].map(m => m[1]).find(k => ST_BG[k]) || 'lobby');
        const joins = (n.join || []).map(id => `<img src="${stCharUrl(id)}" alt="${id}" title="${id} joins">`).join('');
        li.innerHTML = `<span class="ms-dot"></span><button class="ms-card" type="button" ${open ? '' : 'disabled'}>
          <span class="ms-thumb" style="background-image:url('${stBg(firstBg)}')"></span>
          <span class="ms-card-copy"><small>${open ? (sc.date ? sc.date.slice(0, 6) + ' · ' : '') + sc.time : '--:--'} · SCENE ${MainStory.nodes.slice(0, i + 1).filter(x => x.type === 'story').length}</small><b>${open ? sc.title : '? ? ?'}</b><em>${open ? sc.place : 'Locked'}</em></span>
          ${open && joins ? `<span class="ms-joins">${joins}</span>` : ''}
          <span class="ms-stamp">${done ? 'SEEN' : open ? 'NEW' : ''}</span></button>`;
        li.querySelector('.ms-card').onclick = () => { if (!open) return Sound.play('ui_err'); Sound.play('choose'); this.playScene(i); };
      } else {
        const ids = [...new Set([...n.easy, ...n.hard].flat().map(f => f[0]))];
        const skin = n.skin && ST_SKINS[n.skin], skinGot = skin && MainStory.hardDone(n.id);
        li.innerHTML = `<span class="ms-dot"></span><button class="ms-card" type="button" ${open ? '' : 'disabled'}>
          <span class="ms-foes">${open ? ids.slice(0, 4).map(k => `<img class="${ST_ENEMIES[k].art[0] === 'w' ? 'ink' : ''}" src="${stEnemyArt(k)}" alt="">`).join('') : '<i>?</i>'}</span>
          <span class="ms-card-copy"><small>BATTLE · LV ${n.lv}${n.boss ? ' · BOSS' : ''}</small><b>${open ? n.name : '? ? ?'}</b>
          <em><i class="${c.easy ? 'ok' : ''}">EASY</i><i class="${c.hard ? 'ok hard' : ''}">HARD</i>${skin ? `<i class="skin${skinGot ? ' ok' : ''}" title="${skin.name}">${skinGot ? '★' : '☆'} SKIN</i>` : ''}</em></span></button>`;
        li.querySelector('.ms-card').onclick = () => { if (!open) return Sound.play('ui_err'); Sound.play('choose'); this.prep(i); };
      }
      list.appendChild(li);
    });
    if (MainStory.complete()) list.appendChild(el('li', 'ms-node end', MainStory.ch === 2
      ? '<span class="ms-dot"></span><div class="ms-endcard"><b>END OF CHAPTER 2</b><small>Somebody is knocking from below…</small></div>'
      : '<span class="ms-dot"></span><div class="ms-endcard"><b>END OF CHAPTER 1</b><small>The Ichor Operation begins…</small></div>'));
    body.appendChild(list);
    requestAnimationFrame(() => {
      const now = list.querySelector('.now') || list.lastElementChild, scr = $('#screen');
      if (now && scr) scr.scrollTop = Math.max(0, now.offsetTop - scr.clientHeight * .42);
    });
  },

  /* ---------- Handlers ---------- */
  handlersTab(body) {
    const grid = el('div', 'ms-handlers');
    MainStory.ids.forEach(id => {
      const h = stChar(id), st = MainStory.status(id), l = MainStory.lv(id), known = st !== 'unmet';
      const card = el('button', `ms-hcard ${st}`);
      card.style.setProperty('--hc', h.color); card.style.setProperty('--ha', h.accent);
      card.innerHTML = `<span class="ms-hart"><img src="${stCharUrl(id)}" alt=""></span>
        <span class="ms-hcopy"><small>${known ? `${ST_ROLE_ICON[h.role]} ${h.role.toUpperCase()}` : 'UNKNOWN'}</small><b>${known ? h.full : '? ? ?'}</b>
        <em>${known ? `<img src="${Art.icon(h.toon)}" alt="">${h.kind === 'toon' ? 'Toon' : h.toon + '’s Handler'}` : 'Not met yet'}</em>
        ${known ? `<span class="ms-lv">LV <b>${l.lv}</b><u><s style="width:${Math.round(l.exp / stExpNeed(l.lv) * 100)}%"></s></u></span>` : ''}</span>
        <i class="ms-hstatus">${{ active: MainStory.ch === 2 ? 'READY' : 'IN PARTY', missing: 'MISSING', lost: 'LOST', unmet: '???' }[st]}</i>`;
      card.onclick = () => { if (!known) return Sound.play('ui_err'); Sound.play('choose'); this.handlerFile(id); };
      grid.appendChild(card);
    });
    body.appendChild(grid);
  },

  handlerFile(id) {
    const h = stChar(id), l = MainStory.lv(id), s = stHandlerStats(id, l.lv), rows = MainStory.state().rows, skin = h.kind === 'toon' ? null : ST_SKINS[h.toon];
    const box = el('div', 'ms-file');
    box.style.setProperty('--hc', h.color);
    const draw = () => {
      box.innerHTML = `<header><img src="${stCharUrl(id)}" alt=""><div><small>${ST_ROLE_ICON[h.role]} ${h.role.toUpperCase()} · ${h.kind === 'toon' ? 'TOON' : (h.assignment || h.toon).toUpperCase() + ' HANDLER'}</small><b>${h.full}</b>
          <span>LV ${l.lv} · EXP ${fmt(l.exp)} / ${fmt(stExpNeed(l.lv))}</span>
          <div class="ms-rowpick">${['front', 'back'].map(r => `<button data-row="${r}" class="${rows[id] === r ? 'on' : ''}">${r === 'front' ? 'Front row' : 'Back row'}</button>`).join('')}</div></div></header>
        <div class="ms-stats">${[['HP', s.hp], ['FP', s.fp], ['ATK', s.atk], ['MAG', s.mag], ['DEF', s.def], ['MDEF', s.mdef], ['SPD', s.spd]].map(([k, v]) => `<span><small>${k}</small><b>${Math.round(v)}</b></span>`).join('')}</div>
        ${h.blurb ? `<p class="ms-rownote ms-blurb">${h.blurb}</p>` : ''}
        <p class="ms-rownote">${rows[id] === 'front' ? 'Front row: full damage dealt and taken.' : 'Back row: takes 22% less physical damage, deals 20% less physical damage. Magic is unaffected.'}</p>
        <article class="ms-skill passive"><small>PASSIVE</small><b>${h.passive.name}</b><p>${h.passive.desc}</p></article>
        ${h.skills.map(sk => { const open = MainStory.skillOpen(sk); return `<article class="ms-skill${open ? '' : ' locked'}"><small>${open ? `${sk.fp} FP` : `UNLOCKS · ${MainStory.unlockName(sk)}`}</small><b>${open ? sk.name : '? ? ?'}</b><p>${open ? sk.desc : 'Keep going.'}</p></article>`; }).join('')}
        <article class="ms-skill bond"><small>BOND ART · ${h.toon.toUpperCase()}</small><b>${h.bond.name}</b><p>${h.bond.desc} The Bond gauge fills as ${h.name} fights and gets hurt.</p></article>
        ${skin ? `<article class="ms-skill skin${MainStory.hardDone(skin.node) ? ' got' : ''}"><img src="${ASSET + skin.art}" alt=""><div><small>${MainStory.hardDone(skin.node) ? 'SKIN UNLOCKED' : 'HARD MODE REWARD'}</small><b>${skin.name}</b><p>${h.toon} can wear ${h.name}’s uniform. Clear “${MainStory.nodes.find(n => n.id === skin.node).name}” on Hard.${MainStory.hardDone(skin.node) ? ` Equip it from ${h.toon}’s Hero page.` : ''}</p></div></article>` : ''}`;
      box.querySelectorAll('[data-row]').forEach(b => b.onclick = () => { rows[id] = b.dataset.row; Save.write(); Sound.play('ui_ok'); draw(); });
    };
    draw();
    UI.modal(h.name, box, { className: 'ms-modal' });
  },

  /* ---------- battle prep ---------- */
  prep(i) {
    const n = MainStory.nodes[i], st = MainStory.state(), c = st.cleared[i] || {}, roster = MainStory.rosterAt(i), max = Math.min(4, roster.length);
    let mode = this.prepMode && c.easy ? this.prepMode : 'easy';
    let team = st.party.filter(id => roster.includes(id));
    (n.require || []).forEach(id => { if (!team.includes(id)) team.unshift(id); });
    roster.forEach(id => { if (team.length < max && !team.includes(id)) team.push(id); });
    team = team.slice(0, max);
    const box = el('div', 'ms-prep');
    const draw = () => {
      const lv = MainStory.foeLevel(n, mode), first = !c[mode], rew = MainStory.rewards(n, mode, first), skin = n.skin && ST_SKINS[n.skin];
      const foes = {};
      n[mode].flat().forEach(([k, cnt, x]) => { foes[k] = foes[k] || { k, cnt: 0, boss: x && x.boss }; foes[k].cnt += cnt; });
      box.innerHTML = `<div class="ms-prep-hero" style="background-image:url('${stBg(n.bg)}')"><small>${n[mode].length} WAVE${n[mode].length > 1 ? 'S' : ''} · ENEMY LV ${lv}</small><b>${n.name}</b></div>
        <div class="ms-modes">${['easy', 'hard'].map(m => `<button data-mode="${m}" class="${mode === m ? 'on' : ''} ${m}" ${m === 'hard' && !c.easy ? 'disabled' : ''}>${m === 'easy' ? 'Easy' : 'Hard'}${c[m] ? ' ✓' : ''}<small>${m === 'hard' && !c.easy ? 'Clear Easy first' : `LV ${MainStory.foeLevel(n, m)}`}</small></button>`).join('')}</div>
        ${n.hint ? `<p class="ms-hint">${n.hint}</p>` : ''}
        <div class="ms-prep-foes">${Object.values(foes).map(f => `<span class="${f.boss ? 'boss' : ''}"><img class="${ST_ENEMIES[f.k].art[0] === 'w' ? 'ink' : ''}" src="${stEnemyArt(f.k)}" alt=""><b>${ST_ENEMIES[f.k].name}</b><small>×${f.cnt}${f.boss ? ' · BOSS' : ''}</small></span>`).join('')}</div>
        <div class="ms-rewards"><small>${first ? (mode === 'hard' ? 'FIRST HARD CLEAR' : 'FIRST CLEAR') : 'REPLAY'} REWARDS</small><div>${Object.keys(rew).filter(k => RES[k]).map(k => `<span>${RES[k].icon}<b>${fmt(rew[k])}</b></span>`).join('')}
          ${mode === 'hard' && skin ? `<span class="skin${MainStory.hardDone(n.id) ? ' got' : ''}"><img src="${ASSET + skin.art}" alt=""><b>${n.skin} skin</b></span>` : ''}</div>
          <p>${MainStory.ch === 2 ? 'Toon' : 'Handler'} EXP from every win${mode === 'hard' ? ' · Hard gives 60% more' : ''}.${skin && mode === 'easy' ? ` Hard clear unlocks the ${skin.name} skin for ${n.skin}.` : ''}</p></div>
        <div class="ms-team"><small>PARTY · ${team.length} / ${max}</small><div class="ms-team-grid">${roster.map(id => {
          const on = team.includes(id), req = (n.require || []).includes(id), l = MainStory.lv(id), h = stChar(id);
          return `<button data-id="${id}" class="${on ? 'on' : ''}${req ? ' req' : ''}" style="--hc:${h.color}"><img src="${stCharUrl(id)}" alt=""><b>${h.name}</b><small>LV ${Math.max(l.lv, n.lv)}</small>${on ? `<i data-row="${id}">${st.rows[id] === 'front' ? 'FRONT' : 'BACK'}</i>` : ''}</button>`;
        }).join('')}</div><p>Tap a ${MainStory.ch === 2 ? 'Toon' : 'Handler'} to add or remove. Tap FRONT/BACK to change rows.${MainStory.ch === 2 && Object.values(st.shop.items).some(v => v > 0) ? ' Dandy’s Shop stock comes along.' : ''}${roster.some(id => MainStory.lv(id).lv < n.lv) ? ` Story levels below ${n.lv} are raised to ${n.lv}.` : ''}</p></div>
        <button class="ms-go" type="button">${n.improvised ? 'Grab the mop' : 'Begin'} ›</button>`;
      box.querySelectorAll('[data-mode]').forEach(b => b.onclick = () => { if (b.disabled) return Sound.play('ui_err'); mode = this.prepMode = b.dataset.mode; Sound.play('ui_move'); draw(); });
      box.querySelectorAll('[data-id]').forEach(b => b.onclick = e => {
        const id = b.dataset.id;
        if (e.target.dataset.row) { st.rows[id] = st.rows[id] === 'front' ? 'back' : 'front'; Save.write(); Sound.play('ui_move'); draw(); return; }
        if ((n.require || []).includes(id)) { Sound.play('ui_err'); UI.toast(`${id} won’t sit this one out.`); return; }
        if (team.includes(id)) team = team.filter(x => x !== id);
        else if (team.length < max) team.push(id);
        else return Sound.play('ui_err');
        Sound.play('ui_move'); draw();
      });
      box.querySelector('.ms-go').onclick = () => {
        if (!team.length) return Sound.play('ui_err');
        st.party = team.slice(); Save.write();
        UI.closeModal({ skipHook: true });
        StoryBattleUI.start(i, mode, team);
      };
    };
    draw();
    UI.modal('', box, { className: 'ms-modal ms-prep-modal', bare: true, dismissOnBackdrop: true });
  },

  /* ============================================================ VISUAL NOVEL */
  playScene(i, chained) {
    const n = MainStory.nodes[i], scene = ST_STORY[n.scene];
    if (!scene) return;
    document.querySelectorAll('.ms-vn').forEach(x => x.remove());
    const lines = scene.script.trim().split('\n').map(x => x.trim()).filter(Boolean);
    const vn = el('div', 'ms-vn');
    vn.innerHTML = `<div class="ms-vn-bg"></div><div class="ms-vn-bg2"></div><div class="ms-vn-stage"></div><div class="ms-vn-fx"></div>
      <div class="ms-vn-bar top"><span class="ms-vn-stampline"><b>JUNE 24, 2002</b> · <span class="ms-vn-time"></span> · <span class="ms-vn-place"></span></span></div>
      <div class="ms-vn-box"><b class="ms-vn-name"></b><p class="ms-vn-text"></p><i class="ms-vn-next">▼</i></div>
      <div class="ms-vn-bar bottom"><button data-vn="auto">Auto</button><button data-vn="log">Log</button><button data-vn="skip">Skip »</button></div>
      <div class="ms-vn-choice" hidden></div><div class="ms-vn-card"><span></span></div><div class="ms-vn-log" hidden><div class="ms-vn-log-in"></div><button data-vn="closelog">Close</button></div>
      <div class="ms-vn-title"><small class="ms-vn-t-date"></small><b class="ms-vn-t-time"></b><i></i><strong class="ms-vn-t-title"></strong><em class="ms-vn-t-place"></em></div>`;
    document.body.appendChild(vn);
    this.overlay = true;
    const Q = sel => vn.querySelector(sel);
    const bg = Q('.ms-vn-bg'), bg2 = Q('.ms-vn-bg2'), stage = Q('.ms-vn-stage'), fx = Q('.ms-vn-fx'), box = Q('.ms-vn-box');
    const nameEl = Q('.ms-vn-name'), textEl = Q('.ms-vn-text'), card = Q('.ms-vn-card'), choiceEl = Q('.ms-vn-choice'), logEl = Q('.ms-vn-log');
    const dated = /2002/.test(scene.time);
    Q('.ms-vn-time').textContent = dated ? '' : scene.time; Q('.ms-vn-place').textContent = scene.place;
    Q('.ms-vn-stampline b').textContent = scene.date || 'JUNE 24, 2002';
    if (dated && !scene.date) Q('.ms-vn-stampline').innerHTML = `<b>${scene.time.toUpperCase()}</b> · ${scene.place}`;
    const slots = { farleft: 13, left: 31, center: 50, right: 69, farright: 87 };
    const cast = {}, log = [];
    let at = 0, typing = null, full = '', waiting = false, closed = false, choice = 0, auto = false, autoT = null, curBg = '';
    const setBg = key => {
      const url = stBg(key);
      vn.classList.remove('fx-blackout');
      if (url === curBg) return; curBg = url;
      bg2.style.backgroundImage = bg.style.backgroundImage; bg2.classList.remove('fade'); void bg2.offsetWidth; bg2.classList.add('fade');
      bg.style.backgroundImage = url ? `url("${url}")` : 'none';
      bg.classList.remove('pan'); void bg.offsetWidth; bg.classList.add('pan');
    };
    const freeSlot = () => ['center', 'left', 'right', 'farleft', 'farright'].find(sl => !Object.values(cast).some(c => c.slot === sl)) || 'center';
    const exit = who => { const c = cast[who]; if (!c) return; delete cast[who]; c.node.classList.remove('in'); c.node.classList.add('out'); setTimeout(() => c.node.remove(), 450); };
    const enter = (who, slot) => {
      const art = stPortrait(who); if (!art) return null;
      let c = cast[who];
      if (!c) {
        const present = Object.keys(cast);
        if (present.length >= 5) exit(present.sort((a, b) => (cast[a].talked || 0) - (cast[b].talked || 0))[0]);
        const node = el('div', 'ms-bust' + (/^Twisted/.test(who) ? ' twisted' : '') + (ST_HANDLERS[who] ? ' handler' : '') + (ST_VN_ART[who] ? ' vnart' : ''));
        node.innerHTML = `<img src="${art}" alt="${msWho(who)}"><span class="ms-emote"></span>`;
        stage.appendChild(node);
        c = cast[who] = { node, slot: slot || freeSlot() };
        requestAnimationFrame(() => node.classList.add('in'));
      }
      if (slot) c.slot = slot;
      c.node.style.left = slots[c.slot] + '%';
      return c;
    };
    const emote = (c, key) => {
      const e = ST_EMOTES[key]; if (!c || !e) return;
      const sp = c.node.querySelector('.ms-emote'); sp.textContent = e[0];
      sp.className = 'ms-emote show e-' + (key.replace(/[^a-z]/g, '') || 'x');
      if (e[1]) Sound.play(e[1], { vol: .32, throttle: 60 });
      clearTimeout(c.emT); c.emT = setTimeout(() => { sp.className = 'ms-emote'; }, 1500);
    };
    const anim = (c, a) => { if (!c || !a) return; c.node.classList.remove('a-' + c.lastA); void c.node.offsetWidth; c.lastA = a; c.node.classList.add('a-' + a); };
    const retrig = cls => { vn.classList.remove(cls); void vn.offsetWidth; vn.classList.add(cls); };
    const effect = k => {
      if (k === 'shake') { retrig('fx-shake'); Sound.play('hit_blunt', { vol: .35 }); }
      else if (k === 'flash') retrig('fx-flash');
      else if (k === 'alarm') vn.classList.add('fx-alarm');
      else if (k === 'calm') vn.classList.remove('fx-alarm', 'fx-dark', 'fx-heartbeat');
      else if (k === 'ink') vn.classList.add('fx-ink');
      else if (k === 'dry') vn.classList.remove('fx-ink');
      else if (k === 'dark') vn.classList.add('fx-dark');
      else if (k === 'light') vn.classList.remove('fx-dark', 'fx-blackout');
      else if (k === 'glitch') { retrig('fx-glitch'); Sound.play('spectral', { vol: .3 }); }
      else if (k === 'static') { retrig('fx-static'); Sound.play('robot', { vol: .2 }); }
      else if (k === 'heartbeat') vn.classList.add('fx-heartbeat');
      else if (k === 'nobeat') vn.classList.remove('fx-heartbeat');
      else if (k === 'tv') vn.classList.add('fx-tv');
      else if (k === 'notv') vn.classList.remove('fx-tv');
      else if (k === 'blackout') { vn.classList.add('fx-blackout'); Object.keys(cast).forEach(exit); }
      else if (k === 'whiteout') retrig('fx-whiteout');
      else if (k === 'petals') {
        const cols = ['#ff5c5c', '#ffb347', '#ffe156', '#6ee07a', '#5fb6ff', '#b58cff'];
        for (let j = 0; j < 26; j++) setTimeout(() => {
          const p = el('i', 'ms-petal'); p.style.left = rnd(0, 100) + '%'; p.style.background = cols[j % 6];
          p.style.animationDuration = rnd(2.6, 4.6) + 's'; fx.appendChild(p); setTimeout(() => p.remove(), 4800);
        }, j * 90);
      }
    };
    const voice = (who, ch, k) => {
      const v = ST_VOICE[who]; if (!v) return;
      if (v.cue && k === 0) Sound.play(v.cue, { vol: .45, throttle: 200 });
      if (v.tick && k % 3 === 0 && /\S/.test(ch)) Sound.play(v.tick, { vol: v.vol || .14, rate: (v.rate || 1) * rnd(.95, 1.05), throttle: 40 });
    };
    const schedAuto = () => { clearTimeout(autoT); if (auto && !closed) autoT = setTimeout(() => advance(), 1100 + full.length * 28); };
    const type = (who, text) => {
      full = text; textEl.textContent = ''; vn.classList.remove('can-next'); clearInterval(typing);
      let k = 0;
      typing = setInterval(() => {
        k++; textEl.textContent = full.slice(0, k); voice(who, full[k - 1] || '', k - 1);
        if (k >= full.length) { clearInterval(typing); typing = null; vn.classList.add('can-next'); schedAuto(); }
      }, 22);
    };
    const showCard = (text, ms) => {
      waiting = true; card.querySelector('span').textContent = text; card.classList.remove('show'); void card.offsetWidth; card.classList.add('show');
      box.classList.add('hide'); Sound.play('ui_open', { vol: .3 });
      setTimeout(() => { card.classList.remove('show'); waiting = false; box.classList.remove('hide'); step(); }, ms || 2600);
    };
    const showChoice = opts => {
      waiting = true; box.classList.add('dim');
      choiceEl.hidden = false; choiceEl.innerHTML = opts.map((o, k) => `<button data-c="${k + 1}">${o}</button>`).join('');
      Sound.play('ui_open', { vol: .35 });
      choiceEl.querySelectorAll('button').forEach(b => b.onclick = e => {
        e.stopPropagation(); choice = +b.dataset.c; choiceEl.hidden = true; box.classList.remove('dim'); waiting = false;
        Sound.play('choose'); log.push({ name: '', text: '» ' + b.textContent }); step();
      });
    };
    const finish = skipped => {
      if (closed) return; closed = true; clearInterval(typing); clearTimeout(autoT);
      vn.classList.add('closing'); this.overlay = false;
      setTimeout(() => vn.remove(), 520);
      const first = !MainStory.done(i);
      if (first) {
        const rew = MainStory.sceneReward(i);
        MainStory.mark(i, 'story');
        Save.give(rew, true);
        (n.join || []).forEach((id, k) => setTimeout(() => UI.toast(`${stChar(id).name} joined the party`), 500 + k * 500));
        (n.leave || []).forEach(id => setTimeout(() => UI.toast(n.scene === 's14' ? `${stChar(id).name} is gone.` : `${stChar(id).name} is missing`), 600));
        if (MainStory.ch === 2) {
          ST2_TAPES.filter(t => t.unlock === n.scene).forEach((t, k) => setTimeout(() => UI.toast(`📼 New tape: ${t.title}`), 900 + k * 600));
          if (n.scene === 'c2s8') setTimeout(() => UI.toast('Dandy’s Shop is open'), 1500);
          if (n.scene === 'c2s18') {
            Save.give(masteryRewardBundle({ main: 4, diamond: 4, ticket: 5 }), true);
            setTimeout(() => UI.toast('Chapter 2 complete · 🌟×4 💎×4 🎟×5'), 900);
          }
        }
        if (n.scene === 's15') {
          Save.give(masteryRewardBundle({ main: 2, diamond: 2, ticket: 3 }), true);
          setTimeout(() => UI.toast('Chapter 1 complete · 🌟×2 💎×2 🎟×3'), 900);
        }
      }
      const next = i + 1;
      if (first && MainStory.nodes[next] && !skipped) {
        this.sel = next;
        if (MainStory.nodes[next].type === 'story') { setTimeout(() => this.playScene(next, true), 560); return; }
        Screens.cur === 'story' ? Screens.render() : Screens.go('story');
        setTimeout(() => this.prep(next), 620);
        return;
      }
      this.sel = Math.min(next, MainStory.nodes.length - 1);
      if (Screens.cur === 'story') Screens.render(); else Screens.go('story');
      Music.play(this.hubTrack());
    };
    const step = () => {
      if (closed) return;
      while (at < lines.length) {
        let line = lines[at++];
        const opt = /^([12])>\s?(.*)$/.exec(line);
        if (opt) { if (+opt[1] !== choice) continue; line = opt[2]; }
        if (line[0] === '@') {
          const [cmd, ...rest] = line.slice(1).split(' '), arg = rest.join(' ');
          if (cmd === 'bg') setBg(arg);
          else if (cmd === 'music') Music.play(stTrack(arg));
          else if (cmd === 'stop') Music.stop();
          else if (cmd === 'enter') enter(rest[0], rest[1]);
          else if (cmd === 'move') { const c = cast[rest[0]]; if (c) { c.slot = rest[1]; c.node.style.left = slots[rest[1]] + '%'; } }
          else if (cmd === 'exit') exit(arg);
          else if (cmd === 'exitall') Object.keys(cast).forEach(exit);
          else if (cmd === 'fx') effect(arg);
          else if (cmd === 'sfx') Sound.play(arg, { vol: .5 });
          else if (cmd === 'card') { log.push({ name: '', text: arg }); showCard(arg); return; }
          else if (cmd === 'wait') { waiting = true; setTimeout(() => { waiting = false; step(); }, +arg || 600); return; }
          else if (cmd === 'choice') { showChoice(arg.split('|').map(x => x.trim())); return; }
          continue;
        }
        Object.values(cast).forEach(c => c.node.classList.remove('talk'));
        if (line[0] === '>') {
          box.className = 'ms-vn-box narrate'; nameEl.textContent = ''; nameEl.style.removeProperty('--nc');
          Object.values(cast).forEach(c => c.node.classList.add('dim'));
          const t = line.slice(1).trim(); log.push({ name: '', text: t }); type(null, t); return;
        }
        // "Name~:" is a voice from off stage: named, but no portrait steps in.
        const m = /^([A-Za-z]+)(~)?\s*(?:\[([^\]]+)\])?\s*(?:\(([^)]+)\))?\s*:\s*(.*)$/.exec(line);
        if (!m) continue;
        const [, who, offstage, emo, an, text] = m;
        const col = ST_COLORS[who] || (/^Twisted/.test(who) ? '#ff3b4e' : (HEROES[who] ? '#ffe9a8' : '#cfd6e6'));
        box.className = 'ms-vn-box' + (col === 'rainbow' ? ' rainbow' : '') + (/^Twisted/.test(who) ? ' twisted' : '');
        nameEl.textContent = msWho(who); nameEl.style.setProperty('--nc', col === 'rainbow' ? '#ffe36d' : col);
        const c = cast[who] || (offstage ? null : enter(who));
        Object.entries(cast).forEach(([k, x]) => x.node.classList.toggle('dim', k !== who));
        if (c) { c.node.classList.add('talk'); c.talked = performance.now(); emote(c, emo); anim(c, an || 'nod'); }
        log.push({ name: msWho(who), text, col: col === 'rainbow' ? '#ffe36d' : col });
        type(who, text); return;
      }
      finish();
    };
    const advance = () => {
      if (closed || waiting) return;
      if (typing) { clearInterval(typing); typing = null; textEl.textContent = full; vn.classList.add('can-next'); schedAuto(); return; }
      clearTimeout(autoT); Sound.play('ui_move', { vol: .18, throttle: 40 }); step();
    };
    vn.addEventListener('click', e => {
      const b = e.target.closest('[data-vn]');
      if (b) {
        e.stopPropagation();
        const k = b.dataset.vn;
        if (k === 'auto') { auto = !auto; b.classList.toggle('on', auto); Sound.play(auto ? 'auto_on' : 'auto_off'); if (auto && !typing) schedAuto(); else clearTimeout(autoT); }
        else if (k === 'log') { logEl.hidden = false; logEl.querySelector('.ms-vn-log-in').innerHTML = log.map(x => `<p>${x.name ? `<b style="color:${x.col}">${x.name}</b>` : ''}${x.text}</p>`).join(''); const inner = logEl.querySelector('.ms-vn-log-in'); inner.scrollTop = inner.scrollHeight; }
        else if (k === 'closelog') logEl.hidden = true;
        else if (k === 'skip') { Sound.play('ui_back'); finish(true); }
        return;
      }
      if (!logEl.hidden || e.target.closest('.ms-vn-choice')) return;
      if (vn.classList.contains('titling')) { endTitle(); return; }
      advance();
    });
    const key = e => {
      if (closed) { document.removeEventListener('keydown', key); return; }
      if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); if (vn.classList.contains('titling')) endTitle(); else advance(); }
      else if (e.key === 'Escape') { if (!logEl.hidden) logEl.hidden = true; else finish(true); }
    };
    document.addEventListener('keydown', key);
    // Title card: date, time, title, place.
    const t = Q('.ms-vn-title');
    Q('.ms-vn-t-date').textContent = scene.date || (dated ? 'FIVE DAYS LATER' : 'JUNE 24, 2002');
    Q('.ms-vn-t-time').textContent = scene.date ? scene.time : dated ? 'JUNE 29' : scene.time;
    Q('.ms-vn-t-title').textContent = scene.title; Q('.ms-vn-t-place').textContent = scene.place;
    vn.classList.add('titling');
    Sound.play('ticktock', { vol: .45 });
    setTimeout(() => Sound.play('ult', { vol: .3 }), 700);
    let titled = false;
    const endTitle = () => { if (titled) return; titled = true; vn.classList.remove('titling'); t.classList.add('gone'); setTimeout(step, 380); };
    setTimeout(endTitle, chained ? 2400 : 2900);
  }
};

/* ------------------------------------------------------------ screen + music hooks */
Screens.storyCover = function (s) {
  const page = el('section', 'ms-page ms-cover');
  const back = el('button', 'ms-back');
  back.type = 'button';
  back.setAttribute('aria-label', 'Back to Home');
  back.textContent = '‹';
  back.onclick = () => { Sound.play('ui_back'); Screens.go('home'); };
  page.append(back, StoryUI.homeCard(1));
  if (MainStory.chapter2Open()) page.append(StoryUI.homeCard(2)); else page.append(StoryUI.lockedCard());
  s.appendChild(page);
};
Screens.story = function (s) { StoryUI.render(s); };
{
  const baseScreen = Music.screen.bind(Music);
  Music.screen = function (name, opt) {
    if (StoryUI.overlay) return;          // the VN / battle owns the soundtrack
    if (name === 'story' || name === 'storyCover') { Music.play(StoryUI.hubTrack()); return; }
    return baseScreen(name, opt);
  };
}

/* ------------------------------------------------------------ story cover and home link */
/* One chapter's card for the cover; temporarily switches MainStory to that chapter to read its state. */
StoryUI.homeCard = function (ch) {
  ch = ch || 1;
  return MainStory.withCh(ch, () => {
    MainStory.state();
    const ch2 = ch === 2;
    const cur = MainStory.current(), done = MainStory.complete(), n = MainStory.nodes[cur];
    const time = done ? (ch2 ? 'July 8' : 'June 29') : StoryUI.storyTime(cur);
    const label = done ? 'Chapter complete' : n.type === 'story' ? ST_STORY[n.scene].title : n.name;
    const kind = done ? (ch2 ? 'REPLAY THE WEEK' : 'REPLAY THE DAY') : n.type === 'story' ? (cur === 0 ? 'BEGIN' : 'CONTINUE') : 'BATTLE';
    const scene = [...MainStory.nodes.slice(0, cur + 1)].reverse().find(x => x.type === 'story');
    const bgKey = n.type === 'battle' ? n.bg : (/@bg (\S+)/.exec(ST_STORY[scene.scene].script) || [])[1] || 'lobby';
    const title = ch2 ? 'BUSINESS AS USUAL' : 'THE MALFUNCTION';
    const card = el('button', 'ms-home' + (done ? ' done' : '') + (cur === 0 ? ' fresh' : '') + (ch2 ? ' ms-home-2' : ''));
    card.type = 'button';
    card.setAttribute('aria-label', `Main Story, Chapter ${ch}, ${title}. ${kind}: ${label}`);
    const castIds = ch2 ? ['Tisha', 'Rodger', 'Shelly', 'Vee', 'Dyle'] : ST_HANDLER_IDS;
    const cast = castIds.map((id, k) => {
      const stt = MainStory.status(id);
      return `<span class="ms-home-h ${stt}" style="--k:${k}"><img src="${stCharUrl(id)}" alt=""></span>`;
    }).join('');
    card.innerHTML = `<span class="ms-home-bg" style="background-image:url('${stBg(bgKey)}')"></span><span class="ms-home-tint"></span>
      <span class="ms-home-rays"></span><span class="ms-home-drips">${Array.from({ length: 7 }, (_, k) => `<i style="--k:${k}"></i>`).join('')}</span>
      <span class="ms-home-cast">${cast}</span>
      <span class="ms-home-top"><small>MAIN STORY</small><em>CHAPTER ${ch}</em></span>
      ${StoryUI.clockSvg(done ? '' : time, 'home')}
      <span class="ms-home-title"><b>${title}</b><span>${ch2 ? 'July 6, 2002' : 'June 24, 2002'} · ${Math.round(MainStory.progress() * 100)}%</span></span>
      <span class="ms-home-strip">${MainStory.nodes.map((x, k) => `<i class="${x.type}${MainStory.done(k) ? ' done' : ''}${k === cur && !done ? ' now' : ''}"></i>`).join('')}</span>
      <span class="ms-home-cta"><small>${kind} · ${time}</small><b>${label}</b><strong>›</strong></span>`;
    card.onclick = () => { Sound.play('choose', { vol: .5 }); Sound.play('ticktock', { vol: .3 }); MainStory.ch = ch; StoryUI.tab = 'story'; StoryUI.sel = MainStory.current(); Screens.go('story'); };
    return card;
  });
};
StoryUI.lockedCard = function () {
  const card = el('div', 'ms-home ms-home-2 locked');
  card.innerHTML = `<span class="ms-home-tint"></span><span class="ms-home-top"><small>MAIN STORY</small><em>CHAPTER 2</em></span>
    <span class="ms-home-title"><b>BUSINESS AS USUAL</b><span>Clear Chapter 1 to unlock</span></span>`;
  return card;
};
/* The home link points at whichever chapter you are on: Chapter 2 once Chapter 1 is finished. */
StoryUI.homeLink = function () {
  const ch = MainStory.withCh(1, () => MainStory.complete()) ? 2 : 1;   // the home shortcut follows your furthest chapter
  return MainStory.withCh(ch, () => {
    MainStory.state();
    const cur = MainStory.current(), done = MainStory.complete(), n = MainStory.nodes[cur];
    const label = done ? 'Chapter complete' : n.type === 'story' ? ST_STORY[n.scene].title : n.name;
    const link = el('button', 'ms-home-link');
    link.type = 'button';
    link.innerHTML = `<span><small>MAIN STORY · CHAPTER ${ch}</small><b>${ch === 2 ? 'Business as Usual' : 'The Malfunction'}</b><em>${label}</em></span><strong>›</strong>`;
    link.onclick = () => { Sound.play('choose', { vol: .5 }); Screens.go('storyCover'); };
    return link;
  });
};

/* ------------------------------------------------------------ Dandy's Shop (Chapter 2) */
StoryUI.shopTab = function (body) {
  const st = MainStory.state(), box = el('div', 'ms-shop');
  if (!this._dandyLine) this._dandyLine = ST2_DANDY_LINES[Math.floor(Math.random() * ST2_DANDY_LINES.length)];
  const draw = () => {
    const ichor = (Save.data.res && Save.data.res.ichor) || 0;
    box.innerHTML = `<div class="ms-shop-head"><img src="${ASSET}uploads/dandyhimself.webp" alt="Dandy"><div><small>DANDY’S SHOP</small><b>“${this._dandyLine}”</b>
        <em>${RES.ichor.icon}<span>${fmt(ichor)}</span></em></div></div>
      <p class="ms-shop-note">Stock you buy here rides along in every battle and is used after the free supplies. You can carry ${ST2_SHOP_CAP} of each.</p>
      <div class="ms-shop-grid">${ST2_SHOP.map(p => {
        const it = ST_ITEMS[p.id], own = MainStory.stock(p.id), afford = ichor >= p.price && own < ST2_SHOP_CAP;
        return `<article class="ms-shop-item"><img src="${ASSET + it.icon}" alt=""><div><b>${it.name}</b><p>${it.desc}</p></div>
          <button data-buy="${p.id}" ${afford ? '' : 'disabled'}>${RES.ichor.icon}<span>${fmt(p.price)}</span></button><i>×${own}</i></article>`;
      }).join('')}</div>
      <h4 class="ms-shop-sub">TAPES</h4>
      <div class="ms-tapes">${ST2_TAPES.map(t => {
        const open = MainStory.tapeOpen(t);
        return `<button class="ms-tape${open ? '' : ' locked'}" data-tape="${t.id}" ${open ? '' : 'disabled'}><span>📼</span><div><b>${open ? t.title : '? ? ?'}</b><small>${open ? t.place : (t.hard ? 'Clear the final fight on Hard' : 'Not found yet')}</small></div></button>`;
      }).join('')}</div>`;
    box.querySelectorAll('[data-buy]').forEach(b => b.onclick = () => {
      const p = ST2_SHOP.find(x => x.id === b.dataset.buy);
      if (b.disabled || !Save.spend({ ichor: p.price })) return Sound.play('ui_err');
      st.shop.items[p.id] = (st.shop.items[p.id] || 0) + 1; Save.write();
      Sound.play('get_item', { vol: .5 }); this._dandyLine = ST2_DANDY_LINES[Math.floor(Math.random() * ST2_DANDY_LINES.length)]; draw();
    });
    box.querySelectorAll('[data-tape]').forEach(b => b.onclick = () => {
      const t = ST2_TAPES.find(x => x.id === b.dataset.tape);
      Sound.play('choose', { vol: .4 });
      const v = el('div', 'ms-tape-view');
      v.innerHTML = `<small>${t.place.toUpperCase()}</small>${t.lines.map(l => `<p>${l}</p>`).join('')}`;
      UI.modal(t.title, v, { className: 'ms-modal ms-tape-modal' });
    });
  };
  draw(); body.appendChild(box);
};
{
  const baseHome = Screens.home;
  Screens.home = function (s) {
    const out = baseHome.call(this, s);
    const hub = s.querySelector('.home-hub');
    if (hub) hub.insertBefore(StoryUI.homeLink(), hub.firstChild && hub.firstChild.nextSibling);
    return out;
  };
}
