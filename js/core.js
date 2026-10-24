/* core.js - shared helpers, seeded RNG, math */
'use strict';

const ASSET = './';

/* Big uploads (music, voice lines) are served from the GitHub repo through
   jsDelivr, pinned to a commit. Files newer than that commit stay local until
   the pin is bumped, so list them here. */
const UPLOADS_CDN = 'https://cdn.jsdelivr.net/gh/jasonvorheez1/dandys-heroes@a3a9fc5a18f1f6c4e64578bcf3dbde7da02116ae/uploads/';
const UPLOADS_LOCAL = new Set(["Barretshoot.gif", "Bullmotor.webp", "Cursor_-_Equip_ff7.wav", "Cursor_-_Move_ff7.wav", "Dandysheroes-2.webp", "Gigi_Ability.ogg", "Grangalan.webp", "Purchase.wav", "Shiva-ffvii.webp", "backgroundeditteam.webp", "barretgunfire.wav", "barretgunupthenarmup.gif", "barretidle.gif", "barretreadygun.gif", "barretvmportrait.png", "crowdawwww.mp3", "dandyhimself.webp", "drumhit.mp3", "ff7_Cursor_-_Accept.wav", "ff7enemydown.wav", "ff7stronghit.wav", "ff7swordhit.wav", "fistup.mp3", "glassbreak.mp3", "ice.wav", "laserhit.mp3", "launcher-room.webp", "luckygirl.png", "orb.mp3", "powerline_attack2_beat1.mp3", "powerline_attack2_beat2.mp3", "powerline_defeat_microphonics.mp3", "ramuh.webp", "sephirothidle.gif", "sephirothputswordbackandturnidling__1_.gif", "sephirothswingsword.gif", "sephirothusemagic-frames-removed.gif", "sephirothusemagic.gif", "sephirothvnportrait.zip", "sephirothwingandslashesfire.gif", "skillimpacthit.mp3", "slots.mp3", "slotsstop.mp3", "sproutfull.webp", "swishattack.mp3", "swishattack2.mp3", "vocalsmalescream.mp3", "yappingattack.mp3", "yappinginaskill1.mp3"]);
function uploadUrl(name) {
  return UPLOADS_LOCAL.has(name) ? ASSET + 'uploads/' + name : UPLOADS_CDN + encodeURIComponent(name).replace(/%2F/g, '/');
}

/* ---------- dom ---------- */
function $(s, r) { return (r || document).querySelector(s); }
function $$(s, r) { return [].slice.call((r || document).querySelectorAll(s)); }
function el(tag, cls, html) {
  const n = document.createElement(tag);
  if (cls) n.className = cls;
  if (html != null) n.innerHTML = html;
  return n;
}
function clear(n) { while (n.firstChild) n.removeChild(n.firstChild); return n; }

/* ---------- accessibility ---------- */
const Accessibility = {
  _media: null,
  systemEnabled() {
    return typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
  },
  enabled() {
    if (typeof Save !== 'undefined' && Save.data && Save.data.opt && typeof Save.data.opt.reducedEffects === 'boolean') {
      return Save.data.opt.reducedEffects;
    }
    return this.systemEnabled();
  },
  sync() {
    const on = this.enabled();
    document.documentElement.classList.toggle('accessibility-reduced-effects', on);
    document.documentElement.dataset.reducedEffects = on ? 'true' : 'false';
    if (typeof FX !== 'undefined' && FX.setReducedEffects) FX.setReducedEffects(on);
    if (!this._media && typeof matchMedia === 'function') {
      this._media = matchMedia('(prefers-reduced-motion: reduce)');
      if (this._media.addEventListener) this._media.addEventListener('change', () => this.sync());
      else if (this._media.addListener) this._media.addListener(() => this.sync());
    }
    return on;
  },
  toggle() {
    if (typeof Save === 'undefined' || !Save.data) return false;
    Save.data.opt.reducedEffects = !this.enabled();
    Save.write();
    return this.sync();
  },
  enable() {
    if (typeof Save === 'undefined' || !Save.data) return false;
    Save.data.opt.reducedEffects = true;
    Save.write();
    return this.sync();
  },
  disable() {
    if (typeof Save === 'undefined' || !Save.data) return false;
    Save.data.opt.reducedEffects = false;
    Save.write();
    return this.sync();
  },
  firstRunPrompt() {
    if (typeof Save === 'undefined' || !Save.data || !Save.data.seen || Save.data.seen.accessibilityPrompt) return;
    const body = el('div', 'accessibility-first-run');
    body.innerHTML = `<p>Do you have epilepsy or sensitivity to flashing lights or motion?</p>
      <small>Reduced Motion &amp; Flashing removes screen flashes, shake, zoom, hitstop, and most decorative battle effects.</small>`;
    const row = el('div', 'row accessibility-first-run-actions');
    const yes = el('button', 'btn pri grow', 'Yes — reduce effects');
    const unsure = el('button', 'btn gold grow', 'Not sure');
    const no = el('button', 'btn grow', 'No');
    row.append(yes, unsure, no); body.appendChild(row);
    const finish = on => {
      Save.data.seen.accessibilityPrompt = true;
      if (Save.data.opt) Save.data.opt.reducedEffects = !!on;
      Save.write(); Accessibility.sync(); UI.closeModal();
    };
    yes.onclick = () => finish(true);
    unsure.onclick = () => finish(true);
    no.onclick = () => finish(false);
    UI.modal('Accessibility', body, { closeButton: false });
    yes.focus({ preventScroll: true });
  }
};

/* ---------- graphics ---------- */
const GRAPHICS_PREF_KEY = 'dandys-heroes-graphics-quality-v1';
const GRAPHICS_DEFAULTS = {
  graphicsParticles: 'auto',
  graphicsBackground: true,
  combatNumbers: true,
  screenShake: true,
  cameraZoom: true
};
const GraphicsSettings = {
  readLocal() {
    try {
      const stored = localStorage.getItem(GRAPHICS_PREF_KEY);
      if (stored === null || stored.trim() === '') return null;
      const value = Number(stored);
      return Number.isFinite(value) ? clamp(value, 0, 100) : null;
    } catch (_) { return null; }
  },
  remember(value) {
    try { localStorage.setItem(GRAPHICS_PREF_KEY, String(clamp(Math.round(Number(value) || 0), 0, 100))); }
    catch (_) { /* the save file remains the fallback when storage is blocked */ }
  },
  value() {
    const local = this.readLocal();
    if (local !== null) return local;
    const saved = typeof Save !== 'undefined' && Save.data && Save.data.opt && Save.data.opt.graphicsQuality;
    const numeric = Number(saved);
    return clamp(Number.isFinite(numeric) ? numeric : 50, 0, 100);
  },
  option(key) {
    const saved = typeof Save !== 'undefined' && Save.data && Save.data.opt ? Save.data.opt[key] : undefined;
    return saved === undefined ? GRAPHICS_DEFAULTS[key] : saved;
  },
  setOption(key, value, opt) {
    if (!Object.prototype.hasOwnProperty.call(GRAPHICS_DEFAULTS, key) || typeof Save === 'undefined' || !Save.data) return false;
    Save.data.opt[key] = value;
    if (!(opt && opt.skipSave)) Save.write();
    this.sync();
    return value;
  },
  sync() {
    const value = this.value();
    this.remember(value);
    // Graphics are device preferences, not account progression. Keep the
    // active local copy aligned after a cloud/file import without queueing a
    // second cloud upload for the preference-only correction.
    if (typeof Save !== 'undefined' && Save.data && Save.data.opt && Save.data.opt.graphicsQuality !== value) {
      Save.data.opt.graphicsQuality = value;
      if (Save.write) Save.write({ skipCloud: true, touch: false });
    }
    document.documentElement.classList.toggle('graphics-lite', value <= 66);
    document.documentElement.classList.toggle('graphics-low', value <= 33);
    document.documentElement.classList.toggle('graphics-no-background', this.option('graphicsBackground') === false);
    document.documentElement.dataset.graphicsQuality = String(value);
    if (typeof FX !== 'undefined') {
      if (FX.setGraphicsQuality) FX.setGraphicsQuality(value);
      if (FX.setGraphicsOptions) FX.setGraphicsOptions({
        particles: this.option('graphicsParticles'),
        combatNumbers: this.option('combatNumbers') !== false,
        screenShake: this.option('screenShake') !== false,
        cameraZoom: this.option('cameraZoom') !== false
      });
    }
    return value;
  },
  set(value) {
    if (typeof Save === 'undefined' || !Save.data) return false;
    const next = clamp(Math.round(Number(value) || 0), 0, 100);
    this.remember(next);
    Save.data.opt.graphicsQuality = next;
    Save.write();
    return this.sync();
  }
};

/* ---------- math ---------- */
const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
const lerp = (a, b, t) => a + (b - a) * t;
const rnd = (a, b) => a + Math.random() * (b - a);
const rndi = (a, b) => Math.floor(a + Math.random() * (b - a + 1));
const pick = arr => arr[Math.floor(Math.random() * arr.length)];
const chance = p => Math.random() < p;
function shuffle(a) {
  a = a.slice();
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}
function pickN(arr, n) { return shuffle(arr).slice(0, n); }
function possessive(name) { return name + (name.endsWith('s') ? "'" : "'s"); }
function sum(a) { return a.reduce((x, y) => x + y, 0); }
function fmt(n) {
  n = Math.floor(n);
  if (n >= 1e9) return (n / 1e9).toFixed(2) + 'B';
  if (n >= 1e6) return (n / 1e6).toFixed(2) + 'M';
  if (n >= 1e4) return (n / 1e3).toFixed(1) + 'K';
  return n.toLocaleString('en-US');
}

/* ---------- rng (deterministic content: arena, weeks, floors) ---------- */
function mulberry(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0; a = a + 0x6D2B79F5 | 0;
    let t = Math.imul(a ^ a >>> 15, 1 | a);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}
function hashStr(s) {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
}
function createRng(random) {
  return {
    f: random,
    i: (a, b) => Math.floor(a + random() * (b - a + 1)),
    pick: a => a[Math.floor(random() * a.length)],
    chance: p => random() < p,
    shuffle(a) {
      a = a.slice();
      for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
      }
      return a;
    },
    pickN(a, n) { return this.shuffle(a).slice(0, n); }
  };
}
/** Deterministic RNG bundle from any string key. */
function seeded(key) { return createRng(mulberry(hashStr(String(key)))); }
/** Same rng interface as seeded(), but backed by real Math.random - for
    anything that should genuinely differ every time (a fresh floor's rooms,
    who shows up in a room) rather than always rolling the same way. */
function liveRng() { return createRng(Math.random); }

/* ---------- time ---------- */
const DAY = 86400000;
const LIVE_EPOCH = Date.UTC(2026, 0, 5); // Monday 00:00 UTC
/** All service rotations use one real UTC clock. There is deliberately no
    player-controlled offset: daily and weekly state advances only with time. */
function realDayIndex(t) { return Math.floor(((t == null ? Date.now() : t) - LIVE_EPOCH) / DAY); }
function dayIndex(t) { return realDayIndex(t); }
function weekIndex(t) { return Math.floor(dayIndex(t) / 7); }
function dayOfWeek(t) { return ((dayIndex(t) % 7) + 7) % 7; }
function untilDayReset(now) {
  now = now || Date.now();
  const elapsed = ((now - LIVE_EPOCH) % DAY + DAY) % DAY;
  return DAY - elapsed;
}
function untilWeekReset(now) {
  now = now || Date.now();
  const week = Math.floor((now - LIVE_EPOCH) / (DAY * 7));
  return LIVE_EPOCH + (week + 1) * DAY * 7 - now;
}
function liveTime(ms) {
  ms = Math.max(0, ms);
  const days = Math.floor(ms / DAY);
  const hours = Math.floor(ms % DAY / 3600000);
  const mins = Math.floor(ms % 3600000 / 60000);
  const secs = Math.floor(ms % 60000 / 1000);
  const hh = String(hours).padStart(2, '0'), mm = String(mins).padStart(2, '0'), ss = String(secs).padStart(2, '0');
  return days ? `${days}d ${hh}h ${mm}m` : `${hh}:${mm}:${ss}`;
}

/* ---------- easing ---------- */
const ease = {
  out: t => 1 - Math.pow(1 - t, 3),
  in: t => t * t * t,
  back: t => { const c = 1.70158 + 1; return 1 + (c + 1) * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2); },
  elastic: t => t === 0 || t === 1 ? t : Math.pow(2, -10 * t) * Math.sin((t * 10 - .75) * (2 * Math.PI / 3)) + 1,
  bounce: t => { const n = 7.5625, d = 2.75;
    if (t < 1 / d) return n * t * t;
    if (t < 2 / d) return n * (t -= 1.5 / d) * t + .75;
    if (t < 2.5 / d) return n * (t -= 2.25 / d) * t + .9375;
    return n * (t -= 2.625 / d) * t + .984375; }
};

/* ---------- asset paths ---------- */
/* Heroes with no file in icons/. Their full art stands in for the icon. */
const MISSING_ICONS = { Eggson: 1, Flyte: 1, Soulvester: 1, Gourdy: 1, Waxwell: 1, Sora: 1, Riku: 1, Kairi: 1, Goofy: 1, Phantasia: 1, Tisha: 1, Ribecca: 1, Glisten: 1, Flutter: 1, BigWig: 1, CheerbearShelly: 1, BedtimeAstro: 1, WishBearGigi: 1 };

/* The collaboration art arrived as sprite exports instead of the usual
   Characters/<name> folders. These single-frame poses stay crisp in roster,
   team editor, shop, and battle UI while Sora's combat body uses his atlases. */
const SPECIAL_HERO_ART = {
  Sora: 'uploads/soramove.png',
  Riku: 'uploads/unit_ills_335000405.png',
  Kairi: 'uploads/kairistance.png',
  Goofy: 'uploads/goofyicon-2.png',
  Phantasia: 'uploads/Phantasia.png',
  BigWig: 'uploads/Bigwig.png',
  CheerbearShelly: 'uploads/Cheerbearshelly.png',
  BedtimeAstro: 'uploads/Bedtimeastro.png',
  WishBearGigi: 'uploads/wishgigi.png',
  Tisha: 'uploads/image-removebg-preview-3.png',
  Ribecca: 'uploads/Ribecca.png',
  Glisten: 'uploads/Glisten.png',
  Flutter: 'uploads/Fltuter.png',
  QOMGourdy: 'uploads/gourdyQOM.png',
  QOMEclipse: 'uploads/EclipseQOM.png',
  QOMSoulvester: 'uploads/SoulvesterQOM.png',
  QOMRibecca: 'uploads/ribeccaQOM.png',
  QOMConnie: 'uploads/ConnieQOM.png'
};
const SPECIAL_HERO_ICONS = {
  Sora: 'uploads/iconsora.png',
  Riku: 'uploads/rikuicon.png',
  Delilah: 'uploads/delilahicon.png',
  Kairi: 'uploads/iconkairi.png',
  Goofy: 'uploads/goofyicon-2.png',
  Phantasia: 'uploads/Iconphantasia.png',
  BigWig: 'uploads/Bigwig.png',
  CheerbearShelly: 'uploads/cheerbearshellyicon.png',
  BedtimeAstro: 'uploads/bedtimeastroicon.png',
  WishBearGigi: 'uploads/wishgigiicon.png',
  Tisha: 'uploads/Icontisha.png',
  Ribecca: 'uploads/ribeccaicon.png',
  Glisten: 'uploads/glistenicon.png',
  Waxwell: 'uploads/waxwellicon.png',
  Flutter: 'uploads/fluttericon.png',
  QOMGourdy: 'uploads/qomicon-gourdy.png',
  QOMEclipse: 'uploads/qomicon-eclipse.png',
  QOMSoulvester: 'uploads/qomicon-soulvester.png',
  QOMRibecca: 'uploads/qomicon-ribecca.png',
  QOMConnie: 'uploads/qomicon-connie.png'
};
const SPECIAL_TWISTED_ART = {
  Tisha: 'uploads/Twistedtisha.png',
  Glisten: 'uploads/twistedglisten.png',
  Flutter: 'uploads/twistedflutter.png'
};

/* Purpose-built action poses used only on the battlefield. Portraits, icons
   and every non-combat screen keep using the canonical character renders. */
const BATTLE_HERO_ART = {
  Scraps: 'Characters/scraps/scraps-battle-v2.png',
  Poppy: 'Characters/Poppy/Poppy-battle-v2.png',
  Cocoa: 'Characters/Cocoa/Cocoa-battle-v2.png',
  Vee: 'Characters/Vee/Vee-battle-v2.png',
  CheerbearShelly: 'uploads/Cheerbearshelly.png',
  BedtimeAstro: 'uploads/Bedtimeastro.png',
  WishBearGigi: 'uploads/wishgigi.png'
};

/* Alternate hero appearances. Costumes flow through portraits, battle units,
   and previews without replacing the canonical art. */
const HERO_SKINS = {
  Scraps: {
    id: 'pastel-bow',
    name: 'Pastel Bow',
    art: 'assets/skins/scraps-pastel-bow.png'
  }
};

/* Skill-specific action sprites. These are used by the animated skill
   previews while portraits and idle art remain canonical. */
const SKILL_HERO_ART = {
  Sora: {
    W: 'Characters/Sora/Sora-W.png',
    G: 'Characters/Sora/Sora-G.png',
    B: 'Characters/Sora/Sora-B.png'
  },
  Kairi: {
    W: 'Characters/Kairi/Kairi-W.png',
    G: 'Characters/Kairi/Kairi-G.png',
    B: 'Characters/Kairi/Kairi-B.png'
  },
  Goofy: {
    W: 'Characters/Goofy/Goofy-W.png'
  },
  Shrimpo: {
    W: 'Characters/Shrimpo/Shrimpo-W.png',
    G: 'Characters/Shrimpo/Shrimpo-G.png',
    B: 'Characters/Shrimpo/Shrimpo-B.png'
  },
  Poppy: {
    W: 'Characters/Poppy/Poppy-W.png',
    G: 'Characters/Poppy/Poppy-G.png',
    B: 'Characters/Poppy/Poppy-B.png'
  },
  Boxten: {
    W: 'Characters/Boxten/Boxten-W.png',
    G: 'Characters/Boxten/Boxten-G.png',
    B: 'Characters/Boxten/Boxten-B.png'
  },
  Brusha: {
    W: 'Characters/Brusha/Brusha-W.png',
    G: 'Characters/Brusha/Brusha-G.png',
    B: 'Characters/Brusha/Brusha-B.png'
  },
  Rodger: {
    W: 'Characters/Rodger/Rodger-W.png',
    G: 'Characters/Rodger/Rodger-G.png',
    B: 'Characters/Rodger/Rodger-B.png'
  },
  Tisha: {
    W: 'assets/characters/tisha/tisha-tidy.png',
    G: 'assets/characters/tisha/tisha-formation.png',
    B: 'assets/characters/tisha/tisha-dust.png'
  }
};

// Tisha's authored skill cutouts were exported facing the opposite direction
// from her canonical idle art. Keep this correction scoped to action poses so
// portraits and idle battle art are not mirrored.
const SKILL_HERO_NATIVE_FACE = { Tisha: -1 };

const Art = {
  skin(id) {
    const skin = HERO_SKINS[id], hero = typeof Save !== 'undefined' && Save.data && Save.data.heroes && Save.data.heroes[id];
    return skin && hero && hero.costume === skin.id ? skin : null;
  },
  defaultHero(id) {
    const h = HEROES[id];
    if (h && h.weakling) return Art.weakling(id);
    if (SPECIAL_HERO_ART[id]) return ASSET + SPECIAL_HERO_ART[id];
    if (!h || !h.folder) return Art.twisted(id); // enemy-only cast has no Hero art
    return ASSET + 'Characters/' + h.folder + '/' + h.file + '.png';
  },
  hero(id) { const skin = Art.skin(id); return skin ? ASSET + skin.art : Art.defaultHero(id); },
  battleHero(id) {
    const skin = Art.skin(id);
    return skin ? ASSET + skin.art : (BATTLE_HERO_ART[id] ? ASSET + BATTLE_HERO_ART[id] : Art.defaultHero(id));
  },
  skillHero(id, key) { return SKILL_HERO_ART[id] && SKILL_HERO_ART[id][key] ? ASSET + SKILL_HERO_ART[id][key] : null; },
  weakling(id) { return ASSET + 'enemies/Weaklings/' + id + '.png'; },
  twisted(id) {
    if (SPECIAL_TWISTED_ART[id]) return ASSET + SPECIAL_TWISTED_ART[id];
    const file = TWISTED_FILE[id] || id;
    return ASSET + 'enemies/Twisteds/' + file + (/\.[a-z0-9]+$/i.test(file) ? '' : '.png');
  },
  /** Not every Hero has a dedicated icon file; fall back to full art. */
  icon(id) {
    if (SPECIAL_HERO_ICONS[id]) return ASSET + SPECIAL_HERO_ICONS[id];
    if (MISSING_ICONS[id] || (HEROES[id] && HEROES[id].weakling)) return Art.hero(id);
    return ASSET + 'icons/' + (HEROES[id] ? HEROES[id].icon : id) + '.png';
  },
  item(n) { return ASSET + 'item/' + n + '.png'; },
  object(n) { return ASSET + 'OBJECT/' + n + '.png'; },
  /** One frame of a status VFX flipbook, e.g. Art.vfx('BurnEffect', 3). */
  vfx(folder, frame) { return ASSET + 'VFX/' + folder + '/Frames/' + folder + '_' + String(frame).padStart(2, '0') + '.png'; },
  bg(p) { return ASSET + 'Stagebackgrounds/' + p; },
  /** Portrait for either a hero or its Twisted form. */
  unit(id, twisted) { return twisted ? Art.twisted(id) : Art.hero(id); }
};

/* ---------- tiny preloader ---------- */
const Preload = {
  cache: {},
  cacheOrder: [],
  img(src) {
    if (this.cache[src]) return this.cache[src];
    const i = new Image();
    // Decode off the critical rendering path where supported. These images
    // are normally consumed later by an <img>, so don't compete with the
    // launcher's small set of visible assets for high-priority bandwidth.
    i.decoding = 'async';
    try { i.fetchPriority = 'low'; } catch (_) { /* older browsers */ }
    i.src = src;
    this.cache[src] = i;
    this.cacheOrder.push(src);
    // Keep a small warm set. The browser's HTTP cache still serves older
    // images, while releasing these Image references lets phones reclaim
    // decoded cutouts after several different battles.
    while (this.cacheOrder.length > 24) {
      const oldest = this.cacheOrder.shift();
      delete this.cache[oldest];
    }
    return i;
  },
  /** Duplicate srcs are collapsed, decoded before completion, and a slow or
      broken asset can never hold a loading screen hostage. */
  all(list, onProgress) {
    const srcs = [...new Set((list || []).filter(Boolean))];
    if (!srcs.length) return Promise.resolve([]);
    let done = 0;
    const load = src => new Promise(res => {
      const i = this.img(src);
      let settled = false;
      const fin = () => {
        if (settled) return; settled = true;
        done++;
        onProgress && onProgress(done, srcs.length);
        res();
      };
      const decoded = () => {
        if (!i.decode || !i.naturalWidth) return fin();
        i.decode().catch(() => {}).then(fin);
      };
      if (i.complete) return decoded();
      i.addEventListener('load', decoded, { once: true });
      i.addEventListener('error', fin, { once: true });
      setTimeout(fin, 6000);
    });

    // Starting dozens of large cutouts simultaneously creates a burst of
    // decoding and memory pressure. A small queue keeps the loader responsive
    // and lets the browser prioritize the visible launcher assets.
    const connection = typeof navigator !== 'undefined' ? navigator.connection : null;
    const handheld = typeof matchMedia === 'function' && matchMedia('(max-width: 700px)').matches;
    const limit = connection && connection.saveData ? 3 : handheld ? 4 : 8;
    let cursor = 0;
    const worker = async () => {
      while (cursor < srcs.length) {
        const src = srcs[cursor++];
        await load(src);
      }
    };
    return Promise.all(Array.from({ length: Math.min(limit, srcs.length) }, worker)).then(() => srcs);
  },

  heroBundle(id) {
    const out = [Art.hero(id), Art.icon(id), Art.battleHero(id)];
    const skills = SKILL_HERO_ART[id];
    if (skills) Object.values(skills).forEach(src => out.push(ASSET + src));
    const atlases = typeof COLLAB_SPRITES !== 'undefined' && COLLAB_SPRITES[id];
    if (atlases) Object.values(atlases).forEach(a => out.push(a.src));
    const c = typeof HERO_CINEMATICS !== 'undefined' && HERO_CINEMATICS[id];
    if (c && !c.signature) [c.cast, c.impact].filter(Boolean).forEach(folder => {
      for (let frame = 0; frame < 16; frame++) out.push(Art.vfx(folder, frame));
    });
    const props = {
      Gourdy: ['item:Pumpkin','item:Skillcheckcandy','item:Speedcandy','item:Staminacandy','item:Enigmacandy'],
      Rodger: ['obj:Book','obj:Magifyingglass','obj:researchcapsule','item:paper'],
      Brightney: ['item:Trinkets/BRIGHTNEY_SpareBulb'],
      Blot: ['obj:canvas', 'raw:assets/fx/blot-decoy.png', 'raw:Characters/Blot/Blotjr.png'],
      Rudie: ['raw:assets/fx/rudie-wind-rush.png','raw:assets/fx/rudie-hoof-barrage.png'],
      Goofy: ['obj:goofy-shield'],
      Shrimpo: ['item:Trinkets/SHRIMPO_Brick'],
      Soulvester: ['raw:uploads/image-31.png'],
      Vee: ['item:Trinkets/VEE_Veemote','raw:VFX/particle/spotlight_02.png','raw:VFX/particle/spotlight_04.png','raw:VFX/particle/spotlight_06.png'],
      Tisha: ['item:Trinkets/TISHA_Featherduster'],
      Sprout: ['item:Brownie', 'item:Bread', 'item:Proteinbar', 'item:Trinkets/SPROUT_SavoryCharm'],
      Astro: ['item:Trinkets/ASTRO_Starpillow']
    }[id] || [];
    props.forEach(p => {
      const [kind, name] = p.split(':');
      out.push(kind === 'obj' ? Art.object(name) : kind === 'raw' ? ASSET + name : Art.item(name));
    });
    return out;
  },

  battleBundle(cfg) {
    const out = [cfg.meta && cfg.meta.bg || bgForFloor(1, 0)];
    [...(cfg.team || []), ...(cfg.foes || [])].forEach(spec => {
      if (spec.twisted) {
        out.push(Art.twisted(spec.id));
        if (typeof HEROES !== 'undefined' && HEROES[spec.id]) out.push(Art.icon(spec.id));
      } else {
        out.push(...this.heroBundle(spec.id));
      }
      (spec.trinkets || []).forEach(worn => {
        const copy = typeof worn === 'string' ? Save.data.trinketInv[worn] : worn;
        if (copy && TRINKETS[copy.id]) out.push(trinketIcon(copy.id));
      });
    });
    if (cfg.meta && cfg.meta.collabEntrance) {
      out.push(ASSET + 'uploads/rikustandby.png', ASSET + 'uploads/sorawinortauntidk.png', ASSET + 'uploads/kairstandby.png');
    }
    return out;
  }
};

const LoadingScreen = {
  token: 0,

  run(opt, ready) {
    opt = opt || {};
    const host = $('#loadScreen');
    if (!host) { Preload.all(opt.assets || []).then(() => ready && ready()); return; }
    const token = ++this.token, fill = $('#loadFill'), pct = $('#loadPct'), msg = $('#loadMsg');
    const progress = $('#loadProgress'), count = $('#loadCount');
    $('#loadKicker').textContent = opt.kicker || 'NOW LOADING';
    $('#loadTitle').textContent = opt.title || 'Preparing the stage';
    msg.textContent = opt.message || 'Gathering props'; pct.textContent = '0%'; fill.style.width = '0%';
    if (progress) progress.setAttribute('aria-valuenow', '0');
    if (count) count.textContent = 'Gathering the props';
    host.setAttribute('aria-busy', 'true');
    const cast = clear($('#loadCast'));
    (opt.portraits || []).filter(Boolean).slice(0, 5).forEach((src, i) => {
      const img = el('img'); img.src = src; img.alt = ''; img.style.setProperty('--load-i', i); cast.appendChild(img);
    });
    host.hidden = false;
    requestAnimationFrame(() => host.classList.add('visible'));
    const began = performance.now();
    Preload.all(opt.assets || [], (done, total) => {
      if (token !== this.token) return;
      const p = total ? done / total : 1;
      const percent = Math.round(p * 100);
      fill.style.width = `${percent}%`; pct.textContent = `${percent}%`;
      if (progress) progress.setAttribute('aria-valuenow', String(percent));
      if (count) count.textContent = total ? `${done} of ${total} set pieces checked` : 'Putting the finishing touches on';
      msg.textContent = p < .38 ? (opt.message || 'Gathering props') : p < .78 ? 'The cast is getting ready' : 'Almost time to play';
    }).catch(() => {}).then(() => {
      if (token !== this.token) return;
      fill.style.width = '100%'; pct.textContent = '100%'; msg.textContent = 'Ready';
      if (progress) progress.setAttribute('aria-valuenow', '100');
      if (count) count.textContent = 'Curtain’s up!';
      host.setAttribute('aria-busy', 'false');
      const finish = () => {
        if (token !== this.token) return;
        host.classList.remove('visible');
        // Do not start the next scene beneath the loading overlay. Battle's
        // pre-combat walk-in begins in `ready`, so handing it off immediately
        // made the entrance play during this fade and look like a spawn.
        setTimeout(() => {
          if (token !== this.token) return;
          host.hidden = true;
          if (ready) ready();
        }, 180);
      };
      const left = Math.max(0, 120 - (performance.now() - began));
      setTimeout(finish, left);
    });
  },

  hide() {
    this.token++;
    const host = $('#loadScreen');
    if (!host) return;
    host.classList.remove('visible'); host.hidden = true; host.setAttribute('aria-busy', 'false');
  }
};
