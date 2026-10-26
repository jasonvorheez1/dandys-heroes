/* kh-core.js - Kingdom Hearts · Halloween Town.
   Shared tables for the event: cast ids, art, feet-anchored sprite atlases,
   the Heartless/Halloween statuses and a small effects kit (banner, pops,
   Heartless knock-out, overlay sprites, manual target picking). */
'use strict';

const KH_NEW_HERO_IDS = ['JackSkellington', 'OogieBoogie', 'LockShockBarrel', 'Donald'];
const KH_ENEMY_IDS = ['KHShadow', 'KHGigasShadow', 'KHSoldier', 'KHStealthSoldier', 'KHLargeBody', 'KHRedNocturne'];
const KH_CAST_IDS = ['Sora', 'Riku', 'Kairi', 'Goofy', ...KH_NEW_HERO_IDS];

/* Portraits, cut from the first idle frame of each sprite strip. */
const KH_ART = {
  Sora: 'assets/kh/art/sora.png', Riku: 'assets/kh/art/riku.png', Kairi: 'assets/kh/art/kairi.png', Goofy: 'assets/kh/art/goofy.png',
  Donald: 'assets/kh/art/donald.png', JackSkellington: 'assets/kh/art/jack.png', OogieBoogie: 'assets/kh/art/oogie.png',
  LockShockBarrel: 'assets/kh/art/lsb.png',
  KHShadow: 'assets/kh/art/shadow.png', KHGigasShadow: 'assets/kh/art/gigas.png', KHSoldier: 'assets/kh/art/soldier.png',
  KHStealthSoldier: 'assets/kh/art/stealth.png', KHLargeBody: 'assets/kh/art/largebody.png', KHRedNocturne: 'assets/kh/art/nocturne.png'
};
/* Story busts: animated GIFs where the supplier made them, strips elsewhere. */
const KH_VN_GIF = {
  JackSkellington: 'uploads/jack_skellington_front_gestures.gif', OogieBoogie: 'uploads/oogie_boogie_laugh_and_point.gif',
  LockShockBarrel: 'uploads/lockshockbarrelidle.gif', Donald: 'uploads/donald_duck_idle_front.gif'
};
/* Cut-out story portraits (backgrounds removed). */
const KH_VN_ART = { Sora: 'assets/kh/vn/sora.png', SoraHalloween: 'assets/kh/vn/sora-halloween.png', Goofy: 'assets/kh/vn/goofy.png',
  JackSkellington: 'assets/kh/vn/jack.png', OogieBoogie: 'assets/kh/vn/oogie.png', LockShockBarrel: 'assets/kh/vn/lsb.png',
  Donald: 'assets/kh/vn/donald.webp', Eclipse: 'assets/kh/vn/eclipse.webp', Pooh: 'assets/kh/wood/vn/pooh.webp',
  Tigger: 'assets/kh/wood/vn/tigger.webp', Piglet: 'assets/kh/wood/vn/piglet.webp', Eeyore: 'assets/kh/wood/vn/eeyore.webp', Rabbit: 'assets/kh/wood/vn/rabbit.webp' };
const KH_NAMES = {
  Sora: 'Sora', Riku: 'Riku', Kairi: 'Kairi', Goofy: 'Goofy', Donald: 'Donald', JackSkellington: 'Jack Skellington', OogieBoogie: 'Oogie Boogie',
  LockShockBarrel: 'Lock, Shock & Barrel', Dandy: 'Dandy', TwistedDandy: 'Twisted Dandy', Vee: 'Vee', Bassie: 'Bassie', Bobette: 'Bobette',
  Shelly: 'Shelly', Eclipse: 'Eclipse', Pooh: 'Pooh', Tigger: 'Tigger', Piglet: 'Piglet', Eeyore: 'Eeyore', Rabbit: 'Rabbit', Lock: 'Lock', Shock: 'Shock', Barrel: 'Barrel',
  KHShadow: 'Shadow', KHGigasShadow: 'Gigas Shadow', KHSoldier: 'Soldier', KHStealthSoldier: 'Stealth Soldier', KHLargeBody: 'Large Body', KHRedNocturne: 'Red Nocturne'
};
/* Sora, Riku, Kairi and Goofy keep their existing portraits everywhere else. */
[...KH_NEW_HERO_IDS, ...KH_ENEMY_IDS].forEach(id => {
  SPECIAL_HERO_ART[id] = KH_ART[id];
  SPECIAL_HERO_ICONS[id] = KH_ART[id];
});
KH_ENEMY_IDS.forEach(id => { SPECIAL_TWISTED_ART[id] = KH_ART[id]; });

/* ---------- sprite atlases ----------
   KH_ATLAS is generated from the re-sliced strips (tools/kh_sprites.py).
   Every strip is anchored on its own feet/shadow, so clips line up. */
function khAtlas(name, fps, once, extra) {
  const m = KH_ATLAS[name];
  return Object.assign({ src: m.src, cols: m.n, rows: 1, frames: Array.from({ length: m.n }, (_, i) => i), cellW: m.cellW, cellH: m.cellH,
    anchorX: m.anchorX, groundY: m.groundY, fps: fps || m.fps || 8, once: !!once }, extra || {});
}
/* clips: { idle: [name, fps, once], ... }. targetH is the on-screen body height in px. */
function khSprites(id, defScale, targetH, clips, baseNameForScale) {
  const ref = KH_ATLAS[baseNameForScale || clips.idle[0]];
  const baseW = ref.cellW, k = targetH / ref.groundY;
  const bodyScale = k * baseW / (98 * defScale);
  const out = {};
  Object.keys(clips).forEach(clip => {
    const [name, fps, once] = clips[clip];
    out[clip] = khAtlas(name, fps, once, { baseW, bodyScale });
  });
  COLLAB_SPRITES[id] = out;
  return out;
}

/* ---------- statuses ---------- */
Object.assign(STATUS, {
  kh_scared: { icon: '😨', name: 'Scared', kind: 'debuff', desc: 'Move Speed -25%, Attack Speed -15%, and Accuracy -15%. Halloween Town skills can exploit or spread Scared.',
    mods: m => { m.msP -= .25; m.aspdP -= .15; m.accP -= .15; } },
  kh_sack: { icon: '🎒', name: 'In the Sack', kind: 'debuff', cc: true, desc: 'Bagged by the trio: cannot act or move and takes damage every second. Cannot be evaded or resisted.',
    flags: { noAct: true, noMove: true },
    tick: (u, s, dt, B) => { s.acc = (s.acc || 0) + dt; if (s.acc >= .5) { s.acc -= .5;
      B.damage(s.src, u, (s.val || 1) * .5, { type: 'magic', dot: true, tag: 'Sack', noDodge: true }); } } },
  kh_scorpions: { icon: '🦂', name: 'Scorpions', kind: 'debuff', max: 3, desc: 'Magic damage every second. The target is hallucinating and cannot tell friend from foe.',
    flags: { confused: true },
    tick: (u, s, dt, B) => { s.acc = (s.acc || 0) + dt; if (s.acc >= 1) { s.acc -= 1;
      B.damage(s.src, u, (s.val || 1) * s.stacks, { type: 'magic', dot: true, tag: 'Scorpions', noDodge: true }); } } },
  kh_unnerved: { icon: '💢', name: 'Unnerved', kind: 'debuff', desc: 'Tenacity and Evasion stripped away.',
    mods: m => { m.ccRes -= .35; m.evaP -= .5; } },
  kh_pumpkinfire: { icon: '🎃', name: 'Pumpkin Flame', kind: 'debuff', max: 5, desc: 'Pumpkin fire: Magic damage every second.',
    tick: (u, s, dt, B) => { s.acc = (s.acc || 0) + dt; if (s.acc >= 1) { s.acc -= 1;
      B.damage(s.src, u, (s.val || 1) * s.stacks, { type: 'magic', dot: true, tag: 'Pumpkin Flame', noDodge: true }); } } },
  kh_lantern: { icon: '🔥', name: 'Jack-O-Lantern', kind: 'buff', desc: 'Engulfed in flame: basic attacks splash to nearby enemies.' },
  kh_hunger: { icon: '🪱', name: 'Well Fed', kind: 'buff', max: 5, desc: 'Max HP increased by every handful of grubs.',
    mods: (m, s) => { m.hpP += (s.val || .05) * s.stacks; } },
  kh_revealed: { icon: '👁', name: 'Revealed', kind: 'debuff', desc: 'Its weakness is uncovered: cannot return to stealth and takes 25% more damage.',
    mods: m => { m.dmgTaken += .25; } },
  kh_berserk: { icon: '💢', name: 'Berserk', kind: 'buff', desc: 'Angered: Attack +60%, Attack Speed +30%, Crowd Control Resistance up.',
    mods: m => { m.atkP += .6; m.aspdP += .3; m.ccRes += .25; } },
  kh_absorb_fire: { icon: '🔥', name: 'Fire Absorb', kind: 'buff', desc: 'Fire attacks and burns heal this Heartless instead of hurting it.',
    onDamaged: (u, s, ev, B) => {
      const txt = String(ev.tag || '');
      if (/burn|fire|flame|blaze|pumpkin|ignite|scorch/i.test(txt)) {
        B.heal(ev.src || u, u, ev.amount * .8, { tag: 'Fire Absorb', silent: true });
        B.floatNum(u, -92, 'ABSORBED', 'block'); ev.amount = 0;
      }
    } },
  kh_tenacious: { icon: '🐾', name: 'Tenacious', kind: 'buff', desc: 'Relentless hunter: Move Speed +25% and Crowd Control Resistance +20%.',
    mods: m => { m.msP += .25; m.ccRes += .20; } },
  kh_snakeluck: { icon: '🎲', name: 'Snake Eyes', kind: 'buff', desc: 'The dice came up ones. Max HP is raised for the rest of the wave.', max: 10,
    mods: (m, s) => { m.hpP += (s.val || .03) * s.stacks; } }
});
STATUS_VFX.kh_scared = 'FearEffect';
STATUS_VFX.kh_pumpkinfire = 'BurnEffect';
STATUS_VFX.kh_scorpions = 'PoisonBubble';
STATUS_VFX.kh_sack = 'StunEffect';
STATUS_VFX.kh_unnerved = 'WeakenEffect';
STATUS_VFX.kh_berserk = 'RageEffect';
STATUS_VFX.kh_hunger = 'RegenEffect';

/* ---------- helpers shared by every KH kit ---------- */
function khFoes(u, B) { return B.enemiesOf(u).filter(e => e.alive && B.isTargetable(e)); }
function khTarget(u, B) { const t = u.target && u.target.alive && B.isTargetable(u.target) ? u.target : null; return t || B.nearest(u, khFoes(u, B)); }
function khStopped(u) { return !u.alive || u.hasStatus('stun') || u.hasStatus('freeze') || u.hasStatus('launch') || u.hasStatus('sleep') || u.hasStatus('petrify') || u.hasStatus('kh_sack'); }
function khScared(t) { return !!(t && t.hasStatus && t.hasStatus('kh_scared')); }
/* Magic damage resolves as magic and shows in the purple. */
function khMagic(u, t, B, amount, opt) {
  return B.damage(u, t, amount, Object.assign({ type: 'magic' }, opt || {}));
}
/* Scares a target. Returns true if it was already Scared (feeds Sound of a Scream). */
function khScare(u, t, B, dur, opt) {
  if (!t || !t.alive) return false;
  const was = khScared(t);
  const version = t.statusVersion;
  B.applyStatus(u, t, 'kh_scared', dur, opt);
  // Guards may reject the debuff. A blocked Scare must not trigger Jack's
  // repeat-Scare damage or spread, even if the target was already Scared.
  if (t.statusVersion === version || !khScared(t)) return false;
  if (!was) B.fxFloatIcon(t.x, t.y - 96, '😨', '#c9a5ff');
  B.emitAll('khScare', { src: u, unit: t, was });
  return was;
}
function khClip(u, name, sec) { u._clip = name; u._clipUntil = (u.B ? u.B.t : 0) + sec; }

/* ---------- sound ---------- */
const KH_SFX = {
  move: 'kh_ui_move', back: 'kh_ui_back', select: 'kh_ui_select', get: 'kh_ui_get', small: 'kh_ui_small'
};
const KH_UPLOAD_SFX_VOL = { move: .5, back: .55, select: .5, get: .7, small: .6 };
const KHSnd = {
  play(key, vol) {
    const cue = KH_SFX[key];
    if (cue && typeof Sound !== 'undefined')
      Sound.play(cue, { vol: vol == null ? KH_UPLOAD_SFX_VOL[key] : vol });
  }
};
MUSIC_TRACKS.khMenu = ASSET + 'uploads/2-09_A_Piece_of_Peace.mp3';
MUSIC_TRACKS.khTown = ASSET + 'uploads/2-12_This_is_Halloween.mp3';
MUSIC_TRACKS.khDearly = ASSET + 'uploads/1-01_Dearly_Beloved.mp3';
MUSIC_TRACKS.khNight = ASSET + 'uploads/2-21_Scherzo_Di_Notte.mp3';
MUSIC_TRACKS.khBattle = ASSET + 'uploads/KHhalloweenbattle.mp3';
MUSIC_TRACKS.khGardenBattle = ASSET + 'uploads/KHbattlegardenview.mp3';
MUSIC_TRACKS.khBoss = ASSET + 'uploads/Khboss.mp3';
MUSIC_TRACKS.khEscapade = ASSET + 'uploads/1-35._Winnie_the_Pooh.mp3';
Object.assign(MUSIC_TRACK_TRIMS, { khEscapade: .6, khMenu: .8, khTown: .72, khDearly: .8, khNight: .75, khBattle: .72, khGardenBattle: .72, khBoss: .75 });

/* ---------- effects ---------- */
const KHFX = {
  layer() { return document.getElementById('fxFront'); },
  hud() { return document.getElementById('battle'); },
  sfx(key, vol) { KHSnd.play(key, vol); },
  screenPos(B, u) {
    const x = u.depth != null ? B.W / 2 + (u.x - B.W / 2) * (1 - u.depth * DEPTH_XCOMPRESS) : u.x;
    const k = u.depth != null ? 1 - u.depth * DEPTH_SCALE_FALL : 1;
    return { x, y: u.y, k };
  },
  banner(B, text, tone) {
    const host = this.hud();
    if (!B || B.offscreen || !host) return;
    host.querySelectorAll('.kh-banner').forEach(n => n.remove());
    const n = document.createElement('div');
    n.className = 'kh-banner' + (tone ? ' ' + tone : '');
    n.innerHTML = `<i></i><b>${text}</b>`;
    host.appendChild(n);
    setTimeout(() => n.remove(), 1700 / Math.max(1, B.speed || 1));
  },
  pop(B, u, text, col) { if (B && !B.offscreen && u) B.fxFloatIcon(u.x, u.y - 128, text, col || '#ffb347'); },
  /* A Heartless is defeated: black smoke, and a red heart drifts up from it. */
  ko(B, u) {
    const layer = this.layer();
    if (!B || B.offscreen || !layer || !u) return;
    const p = this.screenPos(B, u);
    const n = document.createElement('div');
    n.className = 'kh-ko' + (u.isBoss ? ' boss' : '');
    n.style.left = p.x + 'px'; n.style.top = (u.y - 46 * p.k) + 'px';
    const puffs = u.isBoss ? 14 : 9;
    for (let i = 0; i < puffs; i++) {
      const s = document.createElement('i'), a = i / puffs * Math.PI * 2, r = 20 + (i % 3) * 16;
      s.style.setProperty('--dx', Math.round(Math.cos(a) * r) + 'px'); s.style.setProperty('--dy', Math.round(Math.sin(a) * r * .7 - 22) + 'px');
      s.style.setProperty('--d', (i % 4) * 40 + 'ms'); n.appendChild(s);
    }
    const h = document.createElement('b'); h.textContent = '❤'; n.appendChild(h);
    layer.appendChild(n);
    setTimeout(() => n.remove(), 1500);
  },
  /* Looping overlay sprite (dice, boxes, toy duck…) on the battlefield. */
  sprite(B, key, x, y, opt) {
    const layer = this.layer(), m = KH_ATLAS[key];
    if (!B || B.offscreen || !layer || !m) return null;
    opt = opt || {};
    const k = (opt.h || m.cellH * 2) / m.cellH;
    const node = document.createElement('div');
    node.className = 'kh-sprite' + (opt.cls ? ' ' + opt.cls : '');
    Object.assign(node.style, {
      width: m.cellW * k + 'px', height: m.cellH * k + 'px', left: (x - m.anchorX * k) + 'px', top: (y - m.groundY * k) + 'px',
      backgroundImage: `url("${ASSET}${m.src}")`, backgroundSize: `${m.n * m.cellW * k}px ${m.cellH * k}px`,
      transform: opt.flip ? 'scaleX(-1)' : 'none', zIndex: opt.z || 420
    });
    layer.appendChild(node);
    let f = 0; const fps = opt.fps || m.fps || 8;
    node.style.backgroundPosition = '0 0';
    const t = setInterval(() => {
      if (!node.isConnected) { clearInterval(t); return; }
      f = (f + 1) % m.n; node.style.backgroundPosition = `${-f * m.cellW * k}px 0`;
    }, 1000 / fps / Math.max(1, B.speed || 1));
    node.kill = () => { clearInterval(t); node.remove(); };
    if (opt.life) setTimeout(node.kill, opt.life / Math.max(1, B.speed || 1));
    return node;
  },
  /* Short, layered spell marks. They use one DOM node plus a handful of
     deterministic sparks, so a full team cast stays inexpensive on phones. */
  impact(B, at, tone, opt = {}) {
    const layer = this.layer();
    if (!B || B.offscreen || !layer || !at) return null;
    const p = this.screenPos(B, at);
    const node = document.createElement('div');
    const size = opt.size || 110;
    const life = (opt.life || .72) / Math.max(1, B.speed || 1);
    node.className = `kh-vfx kh-vfx-${tone}${opt.aura ? ' aura' : ''}`;
    node.style.left = `${p.x}px`;
    node.style.top = `${at.y - (opt.lift == null ? 58 : opt.lift) * p.k}px`;
    node.style.setProperty('--v-size', `${size * p.k}px`);
    node.style.setProperty('--v-dur', `${life}s`);
    const count = Math.min(12, opt.count == null ? 8 : opt.count);
    for (let i = 0; i < count; i++) {
      const spark = document.createElement('i');
      const angle = (i / count) * Math.PI * 2 + .2;
      const distance = size * (.33 + (i % 3) * .1) * p.k;
      spark.style.setProperty('--dx', `${Math.cos(angle) * distance}px`);
      spark.style.setProperty('--dy', `${Math.sin(angle) * distance}px`);
      spark.style.setProperty('--turn', `${i % 2 ? 90 : -90}deg`);
      node.appendChild(spark);
    }
    const icon = document.createElement('b'); node.appendChild(icon);
    layer.appendChild(node);
    setTimeout(() => node.remove(), life * 1000 + 60);
    return node;
  },
  shot(B, from, to, tone, opt = {}) {
    const layer = this.layer();
    if (!B || B.offscreen || !layer || !from || !to) return null;
    const a = this.screenPos(B, from), b = this.screenPos(B, to);
    const node = document.createElement('div');
    const life = (opt.life || .44) / Math.max(1, B.speed || 1);
    node.className = `kh-vfx-shot kh-vfx-shot-${tone}`;
    node.style.left = `${a.x}px`; node.style.top = `${from.y - (opt.fromLift || 95) * a.k}px`;
    node.style.setProperty('--dx', `${b.x - a.x}px`);
    node.style.setProperty('--dy', `${to.y - (opt.toLift || 60) * b.k - (from.y - (opt.fromLift || 95) * a.k)}px`);
    node.style.setProperty('--v-dur', `${life}s`);
    node.style.setProperty('--v-size', `${(opt.size || 42) * a.k}px`);
    layer.appendChild(node);
    setTimeout(() => node.remove(), life * 1000 + 60);
    return node;
  },
  arc(B, from, to, tone, opt = {}) {
    const layer = this.layer();
    if (!B || B.offscreen || !layer || !from || !to) return null;
    const a = this.screenPos(B, from), b = this.screenPos(B, to);
    const x1 = a.x, y1 = from.y - (opt.fromLift || 70) * a.k;
    const x2 = b.x, y2 = to.y - (opt.toLift || 70) * b.k;
    const node = document.createElement('div');
    const life = (opt.life || .32) / Math.max(1, B.speed || 1);
    node.className = `kh-vfx-arc kh-vfx-arc-${tone}`;
    node.style.left = `${x1}px`; node.style.top = `${y1}px`;
    node.style.width = `${Math.hypot(x2 - x1, y2 - y1)}px`;
    node.style.transform = `rotate(${Math.atan2(y2 - y1, x2 - x1)}rad)`;
    node.style.setProperty('--v-dur', `${life}s`);
    layer.appendChild(node);
    setTimeout(() => node.remove(), life * 1000 + 60);
    return node;
  },
  /* Tap-to-choose overlay: pauses the fight while the player picks an enemy. */
  pickTarget(B, choices, label, done) {
    const layer = this.layer(), stage = document.getElementById('stage');
    if (!B || B.offscreen || B.autoWhite || !layer || !stage || !choices.length) { done(choices[0] || null); return; }
    B._khPicking = true; const wasPaused = B.paused; B.paused = true;
    const wrap = document.createElement('div'); wrap.className = 'kh-pick';
    wrap.innerHTML = `<div class="kh-pick-label"><i></i><b>${label}</b><small>Choose an enemy</small></div>`;
    const L = stage.getBoundingClientRect(), sc = L.width / (stage.offsetWidth || L.width || 1);
    choices.forEach(t => {
      const r = t.el.getBoundingClientRect();
      const b = document.createElement('button'); b.type = 'button'; b.className = 'kh-pick-target';
      Object.assign(b.style, { left: (r.left - L.left) / sc + 'px', top: (r.top - L.top) / sc + 'px', width: r.width / sc + 'px', height: r.height / sc + 'px' });
      b.innerHTML = `<span>${t.name}</span>`;
      b.onclick = e => { e.stopPropagation(); finish(t); };
      wrap.appendChild(b);
    });
    let finished = false;
    const finish = t => {
      if (finished) return; finished = true; wrap.remove(); B._khPicking = false; B.paused = wasPaused; KHSnd.play('select'); done(t);
    };
    // Safety net: never hold the battle hostage.
    setTimeout(() => finish(choices[0]), 12000);
    wrap.addEventListener('click', e => { if (e.target === wrap) e.stopPropagation(); });
    stage.appendChild(wrap); KHSnd.play('move');
  }
};
