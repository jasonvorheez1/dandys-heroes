/* ff7-heroes.js - Base Final Fantasy VII (1997) collaboration: Tifa, Cloud,
   Cait Sith and Aerith, plus the Gold Saucer / Corel encounter roster.
   Sprites are PS1-era battle sprites that natively face LEFT. Each pose was
   re-canvassed around the character's feet so swapping poses never shifts
   the body; large Limit Break clips play as stage overlays (FF7FX). */
'use strict';

const FF7_HERO_IDS = ['Tifa', 'Cloud', 'CaitSith', 'Aerith'];
const FF7_ENEMY_IDS = ['FF7Bandit', 'FF7Beachplug', 'FF7DeathClaw', 'FF7Cactuar', 'FF7Joker'];

/* Pose sheets: w/h are processed canvas sizes, k is screen px per sprite px. */
const FF7_POSES = {
  Tifa: { k: 2.5, foot: 10, idle: { src: 'assets/ff7/units/tifa-idle.webp', w: 54, h: 67 }, attack: { src: 'assets/ff7/units/tifa-attack.webp', w: 156, h: 72, ms: 600 }, cast: { src: 'assets/ff7/units/tifa-cast.webp', w: 70, h: 68 }, ready: { src: 'assets/ff7/units/tifa-ready.webp', w: 60, h: 66 } },
  Cloud: { k: 2.3, foot: 12, idle: { src: 'assets/ff7/units/cloud-idle.webp', w: 150, h: 77 }, attack: { src: 'assets/ff7/units/cloud-attack.webp', w: 150, h: 77, ms: 500 }, cast: { src: 'assets/ff7/units/cloud-cast.webp', w: 92, h: 78 }, ready: { src: 'assets/ff7/units/cloud-shrug.webp', w: 56, h: 78 } },
  CaitSith: { k: 1.45, foot: 14, idle: { src: 'assets/ff7/units/caitsith-idle.webp', w: 96, h: 112 }, attack: { src: 'assets/ff7/units/caitsith-attack.webp', w: 120, h: 136, ms: 350 }, cast: { src: 'assets/ff7/units/caitsith-cast.webp', w: 120, h: 113 }, limit: { src: 'assets/ff7/units/caitsith-limit.webp', w: 124, h: 154, ms: 1650 } },
  Aerith: { k: 2.5, foot: 11, idle: { src: 'assets/ff7/units/aerith-idle.webp', w: 64, h: 67 }, attack: { src: 'assets/ff7/units/aerith-attack.webp', w: 276, h: 121, ms: 1350 }, cast: { src: 'assets/ff7/units/aerith-cast.webp', w: 56, h: 70 }, ready: { src: 'assets/ff7/units/aerith-ready.webp', w: 60, h: 67 } }
};
/* Decode the supplied animated WebPs into still-frame strips so combat owns
   the frame clock. A WebP left in an <img> keeps looping through unrelated
   actions even while its unit is idle, paused, or casting another skill. */
function ff7Atlas(name, cellW, cellH, count, baseW, fps, extra = {}) {
  return { src: 'assets/ff7/units/frames/' + name + '.png', cols: count, rows: 1,
    cellW, cellH, baseW, frames: Array.from({ length: count }, (_, i) => i),
    fps, once: true, ...extra };
}
Object.assign(COLLAB_SPRITES, {
  Tifa: {
    idle: ff7Atlas('tifa-idle', 54, 67, 4, 54, 5),
    move: ff7Atlas('tifa-idle', 54, 67, 4, 54, 9),
    ready: ff7Atlas('tifa-ready', 60, 66, 5, 54, 10),
    attack: { ...ff7Atlas('tifa-attack', 156, 72, 12, 54, 18, { anchorX: 43 }), frames: [4, 5, 6, 7, 8, 9, 10, 11] },
    rush: ff7Atlas('tifa-attack', 156, 72, 12, 54, 20, { anchorX: 43 }),
    cast: ff7Atlas('tifa-cast', 70, 68, 4, 54, 9)
  },
  Cloud: {
    idle: ff7Atlas('cloud-idle', 56, 78, 5, 150, 5),
    move: ff7Atlas('cloud-idle', 56, 78, 5, 150, 9),
    ready: ff7Atlas('cloud-idle', 56, 78, 5, 150, 5),
    attack: { ...ff7Atlas('cloud-attack', 150, 77, 10, 150, 18), frames: [1, 2, 3, 4, 5, 6, 7] },
    cross: ff7Atlas('cloud-attack', 150, 77, 10, 150, 18),
    cast: ff7Atlas('cloud-cast', 92, 78, 5, 150, 10)
  },
  CaitSith: {
    idle: ff7Atlas('caitsith-idle', 96, 112, 4, 96, 5),
    move: ff7Atlas('caitsith-idle', 96, 112, 4, 96, 8),
    attack: ff7Atlas('caitsith-attack', 120, 136, 7, 96, 18, { anchorX: 7 }),
    cast: ff7Atlas('caitsith-cast', 120, 113, 4, 96, 9),
    limit: ff7Atlas('caitsith-limit', 124, 154, 33, 96, 20)
  },
  Aerith: {
    idle: ff7Atlas('aerith-idle', 64, 67, 4, 64, 5),
    move: ff7Atlas('aerith-idle', 64, 67, 4, 64, 8),
    ready: ff7Atlas('aerith-ready', 60, 67, 4, 64, 7),
    attack: ff7Atlas('aerith-basic', 64, 70, 6, 64, 12),
    cast: ff7Atlas('aerith-cast', 56, 70, 1, 64, 1)
  }
});
const FF7_CLIPS = {"tifa-beatrush":{"src":"assets/ff7/fx/tifa-beatrush.png","w":426,"h":500,"cols":9,"n":18,"ax":306,"ay":283,"ms":900,"s":.7},"tifa-somersault":{"src":"assets/ff7/fx/tifa-somersault.png","w":450,"h":449,"cols":6,"n":6,"ax":330,"ay":283,"ms":420,"s":.7},"tifa-waterkick":{"src":"assets/ff7/fx/tifa-waterkick.png","w":138,"h":83,"cols":9,"n":9,"ax":82,"ay":54,"ms":450},"tifa-meteodrive":{"src":"assets/ff7/fx/tifa-meteodrive.png","w":328,"h":230,"cols":12,"n":14,"ax":212,"ay":159,"ms":700,"s":.85},"tifa-dolphin":{"src":"assets/ff7/fx/tifa-dolphin.png","w":172,"h":183,"cols":10,"n":10,"ax":131,"ay":172,"ms":500},"tifa-meteorstrike":{"src":"assets/ff7/fx/tifa-meteorstrike.png","w":328,"h":241,"cols":12,"n":18,"ax":228,"ay":184,"ms":900,"s":.85},"tifa-finalheaven":{"src":"assets/ff7/fx/tifa-finalheaven.png","w":535,"h":530,"cols":7,"n":21,"ax":250,"ay":315,"ms":1050,"s":.62},"cloud-chainA":{"src":"assets/ff7/fx/cloud-chainA.png","w":191,"h":125,"cols":14,"n":14,"ax":147,"ay":96,"ms":700},"cloud-chainB":{"src":"assets/ff7/fx/cloud-chainB.png","w":212,"h":125,"cols":14,"n":14,"ax":161,"ay":96,"ms":700},"cloud-chainC":{"src":"assets/ff7/fx/cloud-chainC.png","w":192,"h":95,"cols":12,"n":12,"ax":162,"ay":79,"ms":600},"aerith-fire":{"src":"assets/ff7/fx/aerith-fire.png","w":112,"h":77,"cols":27,"n":27,"ax":49,"ay":64,"ms":1350},"aerith-rain":{"src":"assets/ff7/fx/aerith-rain.png","w":140,"h":244,"cols":27,"n":27,"ax":61,"ay":217,"ms":1350},"aerith-gospel":{"src":"assets/ff7/fx/aerith-gospel.png","w":150,"h":468,"cols":27,"n":27,"ax":61,"ay":353,"ms":1350,"s":.8}};
const FF7_ENEMY_ART = {
  FF7Bandit: 'assets/ff7/enemies/bandit.webp', FF7Beachplug: 'assets/ff7/enemies/beachplug.webp',
  FF7DeathClaw: 'assets/ff7/enemies/deathclaw.webp', FF7Cactuar: 'assets/ff7/enemies/cactuar.webp', FF7Joker: 'assets/ff7/enemies/joker.webp'
};
const FF7_VN_ART = {
  Tifa: 'assets/ff7/vn/tifa.webp', Cloud: 'assets/ff7/vn/cloud.webp', CaitSith: 'assets/ff7/vn/caitsith.webp', Aerith: 'assets/ff7/vn/aerith.webp',
  Gigi: 'assets/ff7/vn/gigi.webp', Vee: 'assets/ff7/vn/vee.webp', Bassie: 'assets/ff7/vn/bassie.webp', Shelly: 'assets/ff7/vn/shelly.webp',
  Bobette: 'assets/ff7/vn/bobette.webp', Dandy: 'assets/ff7/vn/dandy.webp',
  Sephiroth: 'assets/ff7/vn/sephiroth.webp'
};
// Menus use the HD portraits; Battle.render() swaps to the PS1 sprites on the first frame.
FF7_HERO_IDS.forEach(id => { SPECIAL_HERO_ART[id] = FF7_VN_ART[id]; SPECIAL_HERO_ICONS[id] = FF7_VN_ART[id]; });
Object.entries(FF7_ENEMY_ART).forEach(([id, path]) => { SPECIAL_HERO_ART[id] = path; SPECIAL_HERO_ICONS[id] = path; SPECIAL_TWISTED_ART[id] = path; });

/* ---------- presentation helpers (no-ops off screen) ---------- */
const FF7FX = {
  art(B, key, x, y, ms) {
    const paths = { Shiva: 'assets/ff7/fx/shiva.webp', Ramuh: 'assets/ff7/fx/ramuh.webp',
      LuckyGirl: 'assets/ff7/fx/luckygirl.png' };
    const layer = this.layer();
    if (!B || B.offscreen || !layer || !paths[key]) return;
    const node = document.createElement('div');
    node.className = 'ff7-feature-art' + (key === 'LuckyGirl' ? ' lucky' : '');
    node.style.left = `${x}px`; node.style.top = `${y}px`;
    node.style.setProperty('--life', `${ms || 1150}ms`);
    const img = document.createElement('img'); img.src = ASSET + paths[key]; img.alt = '';
    node.appendChild(img); layer.appendChild(node);
    setTimeout(() => node.remove(), (ms || 1150) + 80);
  },
  ko(B, u) {
    const layer = this.layer();
    if (!B || B.offscreen || !layer || !u) return;
    const node = document.createElement('div');
    node.className = 'ff7-ko' + (u.isBoss ? ' boss' : '');
    node.style.left = `${u.x}px`; node.style.top = `${u.y - 55}px`;
    const count = u.isBoss ? 18 : 12;
    for (let i = 0; i < count; i++) {
      const piece = document.createElement('i');
      const angle = i * Math.PI * 2 / count, radius = 34 + (i % 3) * 19;
      piece.style.setProperty('--dx', `${Math.round(Math.cos(angle) * radius)}px`);
      piece.style.setProperty('--dy', `${Math.round(Math.sin(angle) * radius - 26)}px`);
      piece.style.setProperty('--delay', `${(i % 4) * 35}ms`);
      node.appendChild(piece);
    }
    layer.appendChild(node);
    setTimeout(() => node.remove(), 790);
  },
  sfx(name, vol) {
    if (typeof Sound === 'undefined' || !Sound.on) return;
    try { const a = new Audio(ASSET + 'assets/ff7/audio/' + name + '.wav'); a.volume = clamp((vol == null ? .5 : vol) * (Sound.vol == null ? 1 : Sound.vol), 0, 1); a.play().catch(() => {}); } catch (_) {}
  },
  layer() { return document.getElementById('fxFront'); },
  hud() { return document.getElementById('battle'); },
  /* Play a sprite-sheet clip with its character anchor on the unit's feet. */
  clip(B, u, key, opt) {
    const c = FF7_CLIPS[key], layer = this.layer();
    if (!B || B.offscreen || !c || !layer || !u || !u.el) return;
    opt = opt || {};
    const pose = FF7_POSES[u.id];
    const depthScale = u.depth != null ? 1 - u.depth * DEPTH_SCALE_FALL : 1;
    const kBody = (u.bodyW && pose ? u.bodyW / pose.idle.w : 2.4) * depthScale;
    const k = kBody * (c.s || 1) * (opt.scale || 1);
    const x = u.depth != null ? B.W / 2 + (u.x - B.W / 2) * (1 - u.depth * DEPTH_XCOMPRESS) : u.x;
    const flip = u.face > 0;
    const ax = flip ? c.w - c.ax : c.ax;
    const node = document.createElement('div');
    node.className = 'ff7-clip';
    const rows = Math.ceil(c.n / c.cols);
    Object.assign(node.style, {
      width: c.w * k + 'px', height: c.h * k + 'px',
      left: (x - ax * k) + 'px', top: (u.y - (pose ? pose.foot * kBody : 0) - c.ay * k) + 'px',
      backgroundImage: `url("${ASSET + c.src}")`,
      backgroundSize: `${c.cols * c.w * k}px ${rows * c.h * k}px`,
      transform: flip ? 'scaleX(-1)' : 'none', zIndex: 400
    });
    layer.appendChild(node);
    const hide = opt.hideBody !== false && u.imgEl;
    if (hide) u.imgEl.style.visibility = 'hidden';
    const per = (opt.ms || c.ms) / c.n;
    let acc = 0, frame = -1, last = performance.now();
    const step = now => {
      const dt = Math.min(80, now - last); last = now;
      if (!B.paused) acc += dt * (B.speed || 1);
      const f = Math.min(c.n - 1, Math.floor(acc / per));
      if (f !== frame) {
        frame = f;
        node.style.backgroundPosition = `${-(f % c.cols) * c.w * k}px ${-Math.floor(f / c.cols) * c.h * k}px`;
      }
      if (acc < per * c.n && !B.over && node.isConnected) requestAnimationFrame(step);
      else { node.remove(); if (hide && u.imgEl && !u._ff7ClipHold) u.imgEl.style.visibility = ''; }
    };
    requestAnimationFrame(step);
  },
  /* FF7's top-of-screen ability window. */
  banner(B, text, tone) {
    const host = this.hud();
    if (!B || B.offscreen || !host) return;
    host.querySelectorAll('.ff7-banner').forEach(n => n.remove());
    const n = document.createElement('div');
    n.className = 'ff7-banner' + (tone ? ' ' + tone : '');
    n.textContent = text;
    host.appendChild(n);
    setTimeout(() => n.remove(), 1500 / Math.max(1, B.speed || 1));
  },
  /* Tifa's seven reels; returns an updater. */
  reels(B, names, perfect) {
    const host = this.hud();
    if (!B || B.offscreen || !host) return () => {};
    host.querySelectorAll('.ff7-reels').forEach(n => n.remove());
    const n = document.createElement('div');
    n.className = 'ff7-reels' + (perfect ? ' perfect' : '');
    n.innerHTML = `<b>${perfect ? 'PERFECT REELS' : 'LIMIT REELS'}</b><div>${names.map(x => `<span><i>?</i><small>${x}</small></span>`).join('')}</div>`;
    host.appendChild(n);
    const slots = [...n.querySelectorAll('span')];
    return (i, result, done) => {
      if (slots[i]) { slots[i].className = result.toLowerCase().replace(/[^a-z]/g, ''); slots[i].querySelector('i').textContent = result; }
      if (done) setTimeout(() => n.classList.add('out'), 700 / Math.max(1, B.speed || 1)), setTimeout(() => n.remove(), 1200 / Math.max(1, B.speed || 1));
    };
  },
  /* Cait Sith's three spinning reels. */
  slots(B, symbols, final, label) {
    const host = this.hud();
    if (!B || B.offscreen || !host) return;
    host.querySelectorAll('.ff7-slots').forEach(n => n.remove());
    const n = document.createElement('div');
    n.className = 'ff7-slots';
    n.innerHTML = `<b>SLOTS</b><div>${final.map(() => '<span><i></i></span>').join('')}</div><em></em>`;
    host.appendChild(n);
    Sound.play('ff7_slots_spin', { vol: .52, priority: true });
    const cells = [...n.querySelectorAll('i')], sp = Math.max(1, B.speed || 1);
    const spin = setInterval(() => cells.forEach(c => { if (!c.dataset.stop) c.textContent = pick(symbols); }), 60);
    final.forEach((sym, i) => setTimeout(() => { cells[i].dataset.stop = 1; cells[i].textContent = sym; cells[i].parentNode.classList.add('stop'); Sound.play('ff7_slots_stop', { vol: .45, throttle: 0 }); }, (380 + i * 260) / sp));
    setTimeout(() => { clearInterval(spin); n.querySelector('em').textContent = label; n.classList.add('done'); }, (380 + final.length * 260) / sp);
    setTimeout(() => n.remove(), (1900 + final.length * 260) / sp);
  },
  say(B, u, text) {
    if (!B || B.offscreen || !u) return;
    const a = B.unitFxAnchor(u);
    if (FX.heroDialogue) FX.heroDialogue(a.x, a.y + a.size * .42, text, { owner: u, face: u.face, size: a.size, duration: 2200 });
  },
  pop(B, u, text, col) { if (B && !B.offscreen && u) B.fxFloatIcon(u.x, u.y - 128, text, col || '#ffe27a'); }
};

/* Pose resolver consumed by Battle.render(); returns a clip and its phase. */
const FF7Sprites = {
  pose(u, B) {
    const P = FF7_POSES[u.id]; if (!P) return null;
    if (!u._ff7HudFixed && u.el && u.bodyW) {
      u._ff7HudFixed = true;
      const h = u.bodyW * P.idle.h / P.idle.w;
      [['.hpmini', 8], ['.nameplate', 17], ['.stats', -6], ['.unit-loadout', 30], ['.qom-meter', -17]].forEach(([sel, off]) => {
        const n = u.el.querySelector(sel); if (n) n.style.bottom = (h + off) + 'px';
      });
      u.el.classList.add('ff7-unit');
    }
    if (u._ff7HpText) {
      const hp = Math.max(0, Math.round(u.hp));
      if (hp !== u._ff7HpShown) { u._ff7HpShown = hp; u._ff7HpText.textContent = hp >= 1e6 ? (hp / 1e6).toFixed(2) + 'M' : hp >= 1e4 ? Math.round(hp / 1e3) + 'K' : String(hp); u._ff7HpText.classList.toggle('low', u.hpPct < .25); }
      const ready = u.energy >= u.energyMax;
      if (ready !== u._ff7LimitShown) { u._ff7LimitShown = ready; u.bar.classList.toggle('ff7-limit-ready', ready); }
    }
    const atlases = COLLAB_SPRITES[u.id];
    const t = B.t;
    let clip = 'idle', phase = 0;
    if (t < (u._ff7PoseUntil || 0) && atlases[u._ff7Pose]) {
      clip = u._ff7Pose;
      phase = (t - u._ff7PoseStarted) / Math.max(.01, u._ff7PoseUntil - u._ff7PoseStarted);
    } else if (u.casting || (u.animT > 0 && u.animState === 'cast')) {
      clip = 'cast';
      phase = u.animT > 0 ? 1 - u.animT / Math.max(.01, u.animDur || 1) : .5;
    } else if (u.animT > 0 && (u.animState === 'attack' || u.animState === 'wind')) {
      clip = 'attack';
      phase = 1 - u.animT / Math.max(.01, u.animDur || 1);
    } else if (u.moving) clip = 'move';
    else if (u.hpPct < .3 && atlases.ready) clip = 'ready';
    if (clip === 'idle' || clip === 'move' || clip === 'ready') {
      const atlas = atlases[clip];
      phase = ((t * atlas.fps / atlas.frames.length) % 1 + 1) % 1;
    }
    return { clip, phase: clamp(phase, 0, .999) };
  },
  hold(u, B, key, sec) { u._ff7Pose = key; u._ff7PoseStarted = B.t; u._ff7PoseUntil = B.t + sec; }
};

/* ---------- statuses ---------- */
Object.assign(STATUS, {
  ff_armorbreak: { icon: '🛡', name: 'Armor Break', kind: 'debuff', desc: 'Armor is reduced.', mods: (m, s) => { m.defP -= s.val || .2; } },
  ff_drdown: { icon: '🩻', name: 'Guard Broken', kind: 'debuff', desc: 'Takes more damage.', mods: (m, s) => { m.dmgTaken += s.val || .12; } },
  ff_paralyze: { icon: '⚡', name: 'Paralyzed', kind: 'debuff', cc: true, desc: 'Cannot Basic Attack or use Skills.', flags: { disarmed: true, silenced: true } },
  ff_crossmark: { icon: '✚', name: 'Cross-Marked', kind: 'debuff', desc: "Tifa's next Basic Attack against this target deals increased Critical Damage." },
  ff_rush: { icon: '👊', name: 'Beat Rush', kind: 'buff', desc: 'Attack Speed +20%.', mods: m => { m.aspdP += .20; } },
  ff_evade: { icon: '💧', name: 'Waterkick Footwork', kind: 'buff', desc: 'Evasion up and immune to Knockback.', mods: m => { m.evaP += .45; m.kbRes += 1; } },
  ff_spirit: { icon: '🔥', name: 'Fighting Spirit', kind: 'buff', max: 8, desc: 'Each stack: +5% Attack and +4% Critical Damage.', mods: (m, s) => { m.atkP += .05 * s.stacks; m.critDmg += .04 * s.stacks; } },
  ff_perfect: { icon: '🎰', name: 'Perfect Limit', kind: 'buff', desc: '+30% Attack Speed, +25% Evasion, 20% Lifesteal.', mods: m => { m.aspdP += .30; m.evaP += .25; },
    onDealDamage: (u, s, ev, B) => { if (ev.target !== u) B.after(0, () => { if (u.alive) B.heal(u, u, ev.amount * .2, { tag: 'Perfect Limit' }); }); } },
  ff_limitlock: { icon: '⭐', name: 'Limit Break', kind: 'buff', desc: 'Performing a Limit Break.', flags: { noAct: true, noMove: true } },
  ff_focus: { icon: '🎯', name: 'Battle Focus', kind: 'buff', max: 5, desc: 'Each stack: +6% Attack.', mods: (m, s) => { m.atkP += .06 * s.stacks; } },
  ff_counterguard: { icon: '🪨', name: 'Counter Stance', kind: 'buff', desc: 'Damage taken -20%.', mods: m => { m.dmgTaken -= .20; } },
  ff_finish: { icon: '🌪', name: 'Finishing Touch', kind: 'buff', desc: '+30% Attack Speed, +25% Critical Damage, 20% Damage Reduction.', mods: m => { m.aspdP += .30; m.critDmg += .25; m.dmgTaken -= .20; } },
  ff_skillslow: { icon: '⏳', name: 'Skill Haste Down', kind: 'debuff', desc: 'Skill Haste -20%.', mods: (m, s) => { m.cdr -= s.val || .2; } },
  ff_stars: { icon: '⭐', name: 'Lucky Stars', kind: 'buff', max: 5, desc: 'Cait Sith spends Lucky Stars to fix bad Slots results.' },
  ff_fortune: { icon: '🍀', name: 'Good Fortune', kind: 'buff', desc: 'Critical Chance +20%, Critical Damage +25%.', mods: (m, s) => { m.crit += .20; m.critDmg += .25; if (s.val) m.aspdP += s.val; } },
  ff_luckygirl: { icon: '💖', name: 'Lucky Girl', kind: 'buff', desc: 'Critical Chance +45%.', mods: m => { m.crit += .45; } },
  ff_skillpower: { icon: '🎲', name: 'Hot Streak', kind: 'buff', desc: 'Attack and Magic Attack +15%.', mods: m => { m.atkP += .15; m.magP += .15; } },
  ff_bodyguard: { icon: '🧸', name: 'Bodyguard', kind: 'buff', desc: "The Moogle intercepts part of the damage dealt to the lowest-HP ally." },
  ff_transform: { icon: '🐱', name: 'Transform', kind: 'buff', desc: 'The Moogle grows huge: +35% Attack, Basic Attacks splash.', mods: m => { m.atkP += .35; m.dmgTaken -= .12; } },
  ff_jackpot: { icon: '💰', name: 'Jackpot!', kind: 'buff', desc: '+20% Attack and +20% Skill Haste.', mods: m => { m.atkP += .20; m.magP += .20; m.cdr += .20; } },
  ff_regen: { icon: '🌿', name: 'Regen', kind: 'buff', desc: 'Recovers HP every second.', tick: (u, s, dt, B) => { s.acc = (s.acc || 0) + dt; if (s.acc >= 1 && B) { s.acc -= 1; B.heal(s.src || u, u, s.val || 0, { tag: 'Regen' }); } } },
  ff_wind: { icon: '🍃', name: 'Tailwind', kind: 'buff', desc: 'Skill Haste +15%.', mods: m => { m.cdr += .15; } },
  ff_gospel: { icon: '🕊', name: 'Planet’s Guard', kind: 'buff', desc: 'Damage taken -15%.', mods: m => { m.dmgTaken -= .15; } },
  ff_peerless: { icon: '✨', name: 'Peerless', kind: 'buff', desc: 'Immune to damage.' },
  ff_resist: { icon: '🌏', name: 'Breath of the Earth', kind: 'buff', desc: 'Debuff resistance +20%.', mods: m => { m.ccRes += .20; } },
  ff_accdown: { icon: '🌫', name: 'Sealed Sight', kind: 'debuff', desc: 'Accuracy -15%.', mods: m => { m.accP -= .15; } },
  ff_fury: { icon: '💢', name: 'Fury', kind: 'buff', desc: '+15% Attack Speed and +20% Energy generation.', mods: (m, s) => { m.aspdP += .15 * (s.val || 1); m.energyGen += .20 * (s.val || 1); } },
  // enemies
  ff_barrier: { icon: '🟦', name: 'Barrier', kind: 'buff', desc: 'Physical damage taken is halved.', onDamaged: (u, s, ev) => { if (ev.type === 'physical') ev.amount *= .5; } },
  ff_mbarrier: { icon: '🟪', name: 'MBarrier', kind: 'buff', desc: 'Magic damage taken is halved.', onDamaged: (u, s, ev) => { if (ev.type === 'magic') ev.amount *= .5; } },
  ff_haste: { icon: '💨', name: 'Haste', kind: 'buff', desc: 'Attack Speed +30%, Energy generation +25%.', mods: m => { m.aspdP += .30; m.energyGen += .25; } },
  ff_loot: { icon: '💰', name: 'Loot', kind: 'buff', max: 5, desc: 'Each stolen haul: +8% Attack.', mods: (m, s) => { m.atkP += .08 * s.stacks; } },
  ff_holdup: { icon: '🔫', name: 'Held Up', kind: 'debuff', cc: true, desc: 'Frozen at gunpoint and takes 15% more damage.', flags: { noAct: true, noMove: true }, mods: m => { m.dmgTaken += .15; } },
  ff_chill: { icon: '❄', name: 'Chilled', kind: 'debuff', max: 3, desc: 'Slowed. At 3 stacks the target Freezes.', mods: (m, s) => { m.aspdP -= .10 * s.stacks; m.msP -= .12 * s.stacks; } },
  ff_needled: { icon: '🌵', name: 'Needled', kind: 'debuff', max: 5, desc: 'Each stack: -6% Defense.', mods: (m, s) => { m.defP -= .06 * s.stacks; } },
  ff_doom: { icon: '🃏', name: 'Joker’s Doom', kind: 'debuff', desc: 'When the countdown ends, takes massive damage. Cleansing removes it.',
    onExpire: (u, s, B) => { if (u.alive) { Sound.play('banish'); B.damage(s.src, u, u.max.hp * (s.val || .55), { type: 'true', tag: 'Joker', noDodge: true }); FF7FX.pop(B, u, 'DEATH', '#ff4a6a'); } } }
});

/* ---------- shared kit helpers ---------- */
function ff7Foes(u, B) { return B.enemiesOf(u).filter(e => e.alive && B.isTargetable(e)); }
function ff7Target(u, B) { const t = u.target && u.target.alive && B.isTargetable(u.target) ? u.target : null; return t || B.nearest(u, ff7Foes(u, B)); }
function ff7Stopped(u) { return !u.alive || u.hasStatus('stun') || u.hasStatus('freeze') || u.hasStatus('launch') || u.hasStatus('ff_holdup') || u.hasStatus('sleep') || u.hasStatus('petrify'); }
function ff7Limit(u, B, amt) {
  // Desperation: below half HP every Limit source fills faster.
  B.energy(u, amt * (u.hpPct < .5 ? 1.5 : 1) * (u._ff7LimitMul || 1));
}
function ff7Common(o) {
  return defHero(Object.assign({
    folder: null, file: null, icon: o.id, element: 'Materia', ff7: true, nativeFace: -1, ff7Sprite: true,
    move: { gait: 'step', bob: 2, freq: 1.4, lean: 5, squash: .02, idle: 'breathe', step: 'step', trail: { on: false }, brake: .2 },
    growth: { hp: .09, atk: .09, def: .08, mag: .09, mdef: .08 }
  }, o));
}

/* ============================================================ TIFA */
const TIFA_LIMITS = ['Beat Rush', 'Somersault', 'Waterkick', 'Meteodrive', 'Dolphin Blow', 'Meteor Strike', 'Final Heaven'];
const TIFA_CLIPS = ['tifa-beatrush', 'tifa-somersault', 'tifa-waterkick', 'tifa-meteodrive', 'tifa-dolphin', 'tifa-meteorstrike', 'tifa-finalheaven'];
function tifaSpirit(u) { const s = u.getStatus && u.getStatus('ff_spirit'); return s ? s.stacks : 0; }
function tifaSpiritMax(u) { return u._ff7Unbridled ? 8 : 6; }
function tifaLimitBreak(u, B, S, P) {
  const foes0 = ff7Foes(u, B); if (!foes0.length) return;
  let target = ff7Target(u, B);
  const red = !!u._ff7Unbridled;
  const perfect = red && !u._ff7PerfectUsed && tifaSpirit(u) >= tifaSpiritMax(u);
  if (perfect) u._ff7PerfectUsed = true;
  // Resolve the reels up front, exactly like stopping FF7's slot reels.
  const yeah = clamp(u.st.crit * .9 + .10 + (red ? .12 : 0), .12, .72);
  const miss = clamp(.20 - (u.st.acc - 200) / 1500, .06, .22);
  let results = TIFA_LIMITS.map((_, i) => {
    if (perfect) return 'Hit';
    if (i === 0 && red) return 'Yeah!';
    const r = Math.random();
    return r < miss ? 'Miss' : r < miss + yeah ? 'Yeah!' : 'Hit';
  });
  if (perfect) {
    const order = [0, 1, 2, 3, 4, 5, 6].sort(() => Math.random() - .5);
    const crits = Math.max(3, Math.round(yeah * 7));
    order.slice(0, crits).forEach(i => { results[i] = 'Yeah!'; });
  }
  FF7FX.banner(B, perfect ? 'Perfect Limit · Final Heaven' : 'Limit Break · Final Heaven', 'limit');
  FF7FX.sfx('limit2', .6);
  if (perfect) { B.flash('#ffe27a', .4, .3); FF7FX.say(B, u, 'This is it!'); }
  const update = FF7FX.reels(B, TIFA_LIMITS, perfect);
  B.applyStatus(u, u, 'ff_limitlock', 9.5);
  if (target) B.dash(u, target.x - u.face * 70, .25, { depth: target.depth });
  let successes = 0, t = .35, aborted = false;
  const ratios = [1.0, 1.05, 1.15, 1.35, 1.35, 1.55];
  results.forEach((res, i) => {
    const clip = FF7_CLIPS[TIFA_CLIPS[i]];
    const dur = Math.max(.45, clip.ms / 1000);
    B.after(t, () => {
      if (aborted) return;
      if (ff7Stopped(u)) { aborted = true; B.removeStatus(u, 'ff_limitlock'); update(i, 'Miss', true); FF7FX.pop(B, u, 'INTERRUPTED', '#ff8080'); return; }
      if (!target || !target.alive) target = B.nearest(u, ff7Foes(u, B));
      if (!target) { update(i, 'Miss', i === 6); return; }
      update(i, res, i === 6);
      if (res === 'Miss') { B.floatNum(target, -95, 'MISS', 'miss'); Sound.play('miss', { vol: .4 }); return; }
      FF7FX.clip(B, u, TIFA_CLIPS[i]);
      const bonus = 1 + .12 * successes;
      B.after(dur * .55, () => {
        if (!u.alive || !target) return;
        if (!target.alive) target = B.nearest(u, ff7Foes(u, B));
        if (!target) return;
        const isFinal = i === 6;
        const ratio = (isFinal ? S.finale : S.ratio * ratios[i]) * bonus * (perfect && isFinal ? 1.35 : 1);
        const ev = B.damage(u, target, u.st.atk * ratio, { type: 'physical', tag: TIFA_LIMITS[i], forceCrit: res === 'Yeah!', melee: true, noDodge: perfect });
        Sound.play(res === 'Yeah!' ? 'hit_heavy' : 'hit_blunt', { vol: .55 });
        FF7FX.sfx('hit', .35);
        B.shake(isFinal ? 16 : res === 'Yeah!' ? 7 : 4, isFinal ? .5 : .15);
        if (res === 'Yeah!') FF7FX.pop(B, u, 'Yeah!', '#ffd34d');
        if (ev) {
          successes++;
          if (perfect) B.heal(u, u, u.max.hp * .03, { tag: 'Perfect Limit' });
          if (i === 1 || i === 4) B.applyStatus(u, target, 'launch', .7);
          if (i === 2 || i === 5) B.knockback(u, target, 35);
          if (isFinal) {
            const trueDmg = Math.min(u.st.atk * P.trueCap, u.st.atk * S.trueRatio * successes, target.max.hp * (target.isBoss ? .08 : .25));
            B.after(.12, () => { if (target.alive) B.damage(u, target, trueDmg, { type: 'true', tag: 'Final Heaven', noDodge: true }); });
            B.flash('#ffffff', .5, .35); Sound.play('explode', { vol: .7 });
            B.log(`<b>Final Heaven</b> lands after <b>${successes}</b> connected strikes.`);
          }
        }
      });
    });
    t += res === 'Miss' ? .3 : dur + .08;
  });
  B.after(t + .1, () => {
    B.removeStatus(u, 'ff_limitlock');
    if (perfect && u.alive) { B.applyStatus(u, u, 'ff_perfect', 10); FF7FX.pop(B, u, 'PERFECT!', '#fff2a8'); }
  });
}
ff7Common({
  id: 'Tifa', name: 'Tifa', role: 'Damage', roleLabel: 'Damage / Control', position: 'Frontline', tier: 'SS',
  blurb: 'A martial artist from Nibelheim and the owner of Seventh Heaven. She looks after the group and closes in fast during a fight.',
  scale: 54 * 2.5 / 98,
  base: { hp: 4350, atk: 540, def: 250, mag: 120, mdef: 235, spd: 152, acc: 232, eva: 196 },
  hidden: { range: 92, aspd: 1.16, ms: 118, aggro: .95, crit: .18, critDmg: 1.75, healPow: 1, shieldPow: 1, cdr: .05, ccRes: .12, kbRes: .25, armorPen: .06, magPen: 0 },
  basic: { name: 'Martial Arts', type: 'physical', ratio: 1.02, range: 92, wind: .16, attackAnim: .55, sfx: 'swing_light', hit: 'hit_blunt', pcol: '#ffb26b',
    onHit: (u, t, B) => tifaBasicHit(u, t, B) },
  skills: {
    W: {
      name: 'Final Heaven', type: 'Physical Damage / True Damage', energy: 100,
      v: { ratio: 1.05, finale: 3.4, trueRatio: .32 }, p: { trueCap: 3.0 },
      desc: (S, P) => `<span class="sk-pas">Passive: Tifa generates Limit whenever she attacks, takes damage, or lands a Critical Hit. Below 50% HP her Limit fills 50% faster.</span>
        Active: Tifa spins her Limit reels and performs Beat Rush, Somersault, Waterkick, Meteodrive, Dolphin Blow, Meteor Strike, and Final Heaven. Each reel rolls <b>Hit</b>, <b>Yeah!</b> (guaranteed Critical), or <b>Miss</b>. Strikes deal <em>${pcn(S.ratio * 100)}–${pcn(S.ratio * 155)}</em> Physical Damage, and every connected strike raises the next by 12%. A successful Final Heaven deals <em>${pcn(S.finale * 100)}</em> Physical Damage plus <em>${pcn(S.trueRatio * 100)}</em> True Damage per connected strike (capped). Defeated targets are replaced by the nearest enemy. Stuns interrupt the sequence.`,
      passive: (u, B) => {
        u._ff7PerfectUsed = false;
        B.on(u, 'basicHit', () => ff7Limit(u, B, 3));
        B.on(u, 'damaged', ev => { if (ev.amount > 0) ff7Limit(u, B, Math.min(8, ev.amount / u.max.hp * 55)); });
        B.on(u, 'crit', e => { if (e.unit === u) ff7Limit(u, B, 2.5); });
      },
      cast: (u, B, S, P) => tifaLimitBreak(u, B, S, P)
    },
    G: {
      name: 'Beat Rush', type: 'Physical Damage / Control', cd: 8,
      v: { ratio: .40, follow: 1.15 }, p: { hits: 5, shred: .20, dur: 8 },
      desc: (S, P) => `Tifa unleashes ${P.hits} rapid punches on the closest enemy for <em>${pcn(S.ratio * 100)}</em> Physical Damage each. The final punch reduces Armor by ${pc(P.shred)} for ${P.dur}s; if 3+ punches were Critical, it also Stuns briefly. Afterward Tifa gains 20% Attack Speed for 6s. Above 50% Limit she follows with <b>Somersault</b>, launching the enemy for <em>${pcn(S.follow * 100)}</em> Physical Damage and generating extra Limit.`,
      ai: { prio: 60, cond: (u, B) => ff7Foes(u, B).some(e => B.distance(u, e) < 260) },
      cast: (u, B, S, P) => {
        const t = B.nearest(u, ff7Foes(u, B)); if (!t) return;
        FF7FX.banner(B, 'Beat Rush');
        B.dash(u, t.x - u.face * 60, .18, { depth: t.depth });
        FF7Sprites.hold(u, B, 'rush', .78);
        let crits = 0;
        B.repeat(P.hits, .13, i => {
          if (!u.alive || !t.alive) return;
          const ev = B.damage(u, t, u.st.atk * S.ratio, { type: 'physical', tag: 'Beat Rush', melee: true });
          Sound.play('hit_blunt', { vol: .4, rate: rnd(.95, 1.2), throttle: 30 });
          B.fxSlash(u, t, { col: '#ffb26b', ang: rnd(-40, 40), small: true });
          if (ev && ev.crit) crits++;
          if (i === P.hits - 1) {
            B.applyStatus(u, t, 'ff_armorbreak', P.dur, { val: u._ff7Unbridled ? P.shred + .10 : P.shred });
            if (crits >= 3) B.applyStatus(u, t, 'stun', .9);
            B.applyStatus(u, u, 'ff_rush', 6);
            if (u.energy >= 50) B.after(.2, () => {
              if (!u.alive || !t.alive) return;
              FF7FX.clip(B, u, 'tifa-somersault', { scale: .7 });
              FF7FX.pop(B, u, 'Somersault', '#9fd0ff');
              const so = B.damage(u, t, u.st.atk * S.follow, { type: 'physical', tag: 'Somersault', melee: true, critBonus: u._ff7Unbridled ? .15 : 0 });
              if (so && u._ff7Unbridled && so.crit) so.amount *= 1.2;
              if (so && t.alive) B.applyStatus(u, t, 'launch', .8);
              ff7Limit(u, B, 6);
            });
          }
        });
      }
    },
    B: {
      name: 'Waterkick', type: 'Physical Damage / Evasion', cd: 11,
      v: { ratio: 1.20, spin: .70, drive: 1.65 }, p: { radius: 170, hpPct: .06, kb: 70 },
      desc: (S, P) => `Tifa sweeps the nearest enemy for <em>${pcn(S.ratio * 100)}</em> Physical Damage and Knocks it Back, then spins a rotating Waterkick for <em>${pcn(S.spin * 100)}</em> to enemies within ${P.radius}px. She gains greatly increased Evasion and Knockback immunity during the attack. Against an Armor-reduced enemy she follows with <b>Meteodrive</b>: a suplex for <em>${pcn(S.drive * 100)}</em> plus ${pc(P.hpPct)} of the target's current HP (capped against bosses).`,
      ai: { prio: 55, cond: (u, B) => ff7Foes(u, B).some(e => B.distance(u, e) < 240) },
      cast: (u, B, S, P) => {
        const t = B.nearest(u, ff7Foes(u, B)); if (!t) return;
        FF7FX.banner(B, 'Waterkick');
        B.applyStatus(u, u, 'ff_evade', 1.8);
        FF7FX.clip(B, u, 'tifa-waterkick');
        B.after(.2, () => {
          if (!u.alive || !t.alive) return;
          B.damage(u, t, u.st.atk * S.ratio, { type: 'physical', tag: 'Waterkick', melee: true });
          B.knockback(u, t, P.kb);
          B.fxRing(t.x, t.y - 30, 120, '#7fd0ff', .3);
        });
        B.after(.42, () => {
          if (!u.alive) return;
          ff7Foes(u, B).filter(e => B.distance(u, e) < P.radius).forEach(e => B.damage(u, e, u.st.atk * S.spin * (u._ff7Unbridled && e.hasStatus('ff_armorbreak') ? 1.25 : 1), { type: 'physical', area: true, tag: 'Waterkick' }));
          B.fxRing(u.x, u.y - 30, P.radius, '#7fd0ff', .35); Sound.play('sweep', { vol: .4 });
        });
        B.after(.65, () => {
          if (!u.alive || !t.alive || !t.hasStatus('ff_armorbreak')) return;
          FF7FX.pop(B, u, 'Meteodrive', '#ffb26b');
          B.dash(u, t.x - u.face * 40, .12, { depth: t.depth });
          FF7FX.clip(B, u, 'tifa-meteodrive', { scale: .7 });
          B.after(.42, () => {
            if (!u.alive || !t.alive) return;
            const extra = Math.min(t.hp * P.hpPct, t.isBoss ? u.st.atk * 1.5 : u.st.atk * 4);
            B.damage(u, t, u.st.atk * S.drive * (u._ff7Unbridled ? 1.25 : 1) + extra, { type: 'physical', tag: 'Meteodrive', melee: true });
            if (u._ff7Unbridled) B.applyStatus(u, t, 'ff_drdown', 6, { val: .12 });
            B.shake(10, .3); Sound.play('explode', { vol: .45 });
          });
        });
      }
    },
    P: {
      name: 'Master Fist', type: 'Attack / Critical Chance / Counterattack',
      v: { crit: .20, aspd: .15 }, p: { dolphin: 1.9, counter: .60 },
      desc: (S, P) => `Tifa gains <em>${pcn(S.crit * 100)}</em> Critical Chance and <em>${pcn(S.aspd * 100)}</em> Attack Speed. Each Critical Hit grants a stack of Fighting Spirit (max 6): +5% Attack and +4% Critical Damage each. At maximum Fighting Spirit her next Basic Attack becomes <b>Dolphin Blow</b>, a rising uppercut for <em>${pcn(P.dolphin * 100)}</em> that launches and generates Limit. After Dodging, her next Basic Attack counters for +${pc(P.counter)} damage. Below 50% HP she gains 12% Attack (Powersoul).`,
      passive: (u, B, S, P) => {
        u.flat.crit88 = S.crit; u.flat.aspdP88 = S.aspd; u.dirty = true;
        u._ff7Dolphin = P.dolphin; u._ff7CounterMul = P.counter;
        B.on(u, 'crit', e => {
          if (e.unit !== u) return;
          const before = tifaSpirit(u);
          B.applyStatus(u, u, 'ff_spirit', 999, { stacks: 1 });
          const st = u.getStatus('ff_spirit'); if (st) st.stacks = Math.min(st.stacks, tifaSpiritMax(u));
          if (before < tifaSpiritMax(u) && tifaSpirit(u) >= tifaSpiritMax(u)) { u._ff7DolphinReady = true; FF7FX.pop(B, u, 'MAX SPIRIT', '#ffb26b'); }
        });
        B.on(u, 'dodged', () => { u._ff7CounterReady = true; FF7FX.pop(B, u, 'COUNTER', '#bde3ff'); });
        B.on(u, 'dealDamage', ev => {
          if (!ev.basic) return;
          if (u._ff7CounterReady) { ev.amount *= 1 + u._ff7CounterMul; u._ff7CounterReady = false; }
          if (ev.target && ev.target.hasStatus('ff_crossmark')) { ev.forceCrit = true; ev.amount *= 1.25; B.removeStatus(ev.target, 'ff_crossmark'); }
        });
        B.every(u, .5, () => { const low = u.hpPct < .5; if (low !== u._ff7Soul) { u._ff7Soul = low; u.flat.atkP88 = low ? .12 : 0; u.dirty = true; } });
      }
    },
    R: {
      name: 'Unbridled Limit', type: 'Physical Damage / True Damage / Control',
      v: { atk: .10, critDmg: .15, hp: .10 }, p: {},
      desc: S => `Tifa's Limit Break becomes far stronger: better Yeah! odds and the first reel always lands a Yeah!. Beat Rush shreds more Armor and Somersault crits harder. Waterkick hits Armor-reduced enemies 25% harder, and Meteodrive breaks their guard. Fighting Spirit caps at 8 stacks. <b>Perfect Limit:</b> once per wave, entering a Limit Break at maximum Fighting Spirit turns her reels Perfect: all seven strikes connect, at least three are Yeah!, each heals her, and Final Heaven hits 35% harder. Afterward she gains 30% Attack Speed, 25% Evasion, and 20% Lifesteal for 10s. Also grants <em>${pcn(S.atk * 100)}</em> Attack, <em>${pcn(S.critDmg * 100)}</em> Critical Damage, and <em>${pcn(S.hp * 100)}</em> Max HP.`,
      passive: (u, B, S) => { u._ff7Unbridled = true; u.flat.atkP89 = S.atk; u.flat.critDmg89 = S.critDmg; u.flat.hpP89 = S.hp; u.dirty = true; }
    }
  }
});
function tifaBasicHit(u, t, B) {
  if (!u._ff7DolphinReady || !t.alive) return;
  u._ff7DolphinReady = false;
  B.after(.06, () => {
    if (!u.alive || !t.alive) return;
    FF7FX.clip(B, u, 'tifa-dolphin');
    FF7FX.pop(B, u, 'Dolphin Blow', '#7fd0ff');
    const mult = u._ff7Unbridled && t.hpPct > .5 ? 1.25 : 1;
    B.damage(u, t, u.st.atk * (u._ff7Dolphin || 1.9) * mult, { type: 'physical', tag: 'Dolphin Blow', melee: true });
    if (t.alive) B.applyStatus(u, t, 'launch', .9);
    ff7Limit(u, B, 12);
    // FF7 duo synergy: Cloud feeds off Tifa's momentum.
    B.alliesOf(u).filter(a => a.id === 'Cloud' && a.alive).forEach(c => B.energy(c, 14));
    const st = u.getStatus('ff_spirit'); if (st) st.stacks = Math.max(1, st.stacks - 3);
  });
}

/* ============================================================ CLOUD */
const CLOUD_LIMITS = ['', 'Braver', 'Blade Beam', 'Meteorain', 'Omnislash'];
function cloudLevelUp(u, B) {
  if (u._ff7Lv < 4) {
    u._ff7Lv++;
    FF7FX.pop(B, u, 'LIMIT LV ' + u._ff7Lv, '#9fe3ff');
    if (u._ff7Lv === 4) { u.flat.energyGen87 = -.20; u.dirty = true; if (u._ff7Finish && !u._ff7FinishUsed) u._ff7FinishNext = true; }
  }
}
function cloudBraver(u, B, S) {
  const t = B.topN(ff7Foes(u, B), 'atk', 1)[0]; if (!t) return;
  B.leap(u, t.x - u.face * 60, .35, null, t.depth);
  B.after(.32, () => FF7FX.clip(B, u, 'cloud-chainA', { ms: 520 }));
  B.after(.55, () => {
    if (!u.alive || !t.alive) return;
    B.damage(u, t, u.st.atk * S.braver, { type: 'physical', tag: 'Braver', melee: true, armorPen: u._ff7Finish ? .20 : 0 });
    B.applyStatus(u, t, 'stun', u._ff7Finish ? 1.5 : .8);
    B.shake(12, .3); Sound.play('hit_heavy', { vol: .6 }); B.fxRing(t.x, t.y - 20, 150, '#9fe3ff', .35);
  });
}
function cloudBladeBeam(u, B, S) {
  const foes = ff7Foes(u, B); if (!foes.length) return;
  const t = foes.slice().sort((a, b) => b.hp - a.hp)[0];
  FF7FX.clip(B, u, 'cloud-chainB', { ms: 560 });
  B.after(.4, () => {
    if (!u.alive || !t.alive) return;
    if (!B.offscreen && FX.beam) FX.beam(u.x, u.y - 60, t.x, t.y - 50, '#bff2ff', .3);
    B.damage(u, t, u.st.atk * S.beam, { type: 'physical', tag: 'Blade Beam' });
    if (u._ff7Finish) B.energy(t, -25);
    B.fxRing(t.x, t.y - 40, 160, '#bff2ff', .4); Sound.play('beam_fire', { vol: .5 });
    B.after(.18, () => ff7Foes(u, B).filter(e => e !== t).forEach(e => {
      B.damage(u, e, u.st.atk * S.split * (u._ff7Finish ? 1.3 : 1), { type: 'physical', area: true, tag: 'Blade Beam' });
      B.fxRing(e.x, e.y - 40, 80, '#bff2ff', .3);
    }));
  });
}
function cloudMeteorain(u, B, S) {
  const n = u._ff7Finish ? 8 : 6;
  B.leap(u, u.x, .45, null, u.depth);
  FF7Sprites.hold(u, B, 'cast', 1.4);
  B.repeat(n, .16, () => {
    const foes = ff7Foes(u, B); if (!foes.length || !u.alive) return;
    const t = pick(foes);
    B.fxBoom(t.x, t.y - 40, .8, '#ffb070');
    B.damage(u, t, u.st.atk * S.meteor, { type: 'physical', area: true, tag: 'Meteorain' });
    B.applyStatus(u, t, 'ff_armorbreak', 8, { val: .15 });
    if (u._ff7Finish) B.applyStatus(u, t, 'ff_skillslow', 6, { val: .2 });
    Sound.play('explode', { vol: .3, throttle: 60 });
  });
}
function cloudOmnislash(u, B, S) {
  const hits = u._ff7Finish ? 18 : 15;
  B.applyStatus(u, u, 'ff_limitlock', hits * .13 + .9);
  FF7FX.say(B, u, 'Omnislash.');
  B.flash('#cfefff', .35, .25);
  ['cloud-chainA', 'cloud-chainB', 'cloud-chainC'].forEach((c, i) => B.after(i * .72, () => FF7FX.clip(B, u, c, { ms: 680 })));
  for (let i = 0; i < hits; i++) {
    B.after(.25 + i * .13, () => {
      if (!u.alive) return;
      const foes = ff7Foes(u, B); if (!foes.length) return;
      const t = foes.slice().sort((a, b) => a.hpPct - b.hpPct)[0];
      if (i % 3 === 0) B.blink(u, t.x - u.face * 55, t.depth);
      let ratio = S.omni * (u._ff7Finish && t.hpPct < .5 ? 1.25 : 1);
      if (i === hits - 1) ratio += S.omniFinal;
      B.damage(u, t, u.st.atk * ratio, { type: 'physical', tag: 'Omnislash', forceCrit: true, melee: true, noDodge: true });
      B.fxSlash(u, t, { col: '#cfefff', ang: rnd(-60, 60), small: i < hits - 1 });
      Sound.play('hit_slash', { vol: .45, rate: rnd(.9, 1.2), throttle: 25 });
      if (i === hits - 1) { B.applyStatus(u, t, 'stun', 1.2); B.shake(16, .45); FF7FX.sfx('boss_kill', .3); }
    });
  }
  B.after(.25 + hits * .13 + .2, () => B.removeStatus(u, 'ff_limitlock'));
}
function cloudFinishingTouch(u, B, S) {
  u._ff7FinishUsed = true; u._ff7FinishNext = false;
  FF7FX.banner(B, 'Finishing Touch', 'limit');
  FF7FX.clip(B, u, 'cloud-chainC', { ms: 700 });
  const cx = ff7Foes(u, B).reduce((a, e) => a + e.x, 0) / Math.max(1, ff7Foes(u, B).length);
  B.fxRing(cx, B.ground - 40, 260, '#d8f4ff', .8);
  ff7Foes(u, B).forEach(e => B.blink(e, cx + rnd(-50, 50), e.depth, true));
  B.repeat(5, .18, i => ff7Foes(u, B).forEach(e => {
    B.damage(u, e, u.st.atk * S.whirl, { type: 'physical', area: true, tag: 'Finishing Touch' });
    if (i === 4 && e.alive) {
      B.applyStatus(u, e, 'launch', 1.2);
      if (!e.isBoss && !e.isElite && e.hpPct < .20) { B.damage(u, e, e.hp + 1, { type: 'true', tag: 'Finishing Touch', noDodge: true }); FF7FX.pop(B, e, 'FINISHED', '#d8f4ff'); }
      else if (e.isBoss || e.isElite) B.damage(u, e, u.st.atk * 1.5, { type: 'physical', tag: 'Finishing Touch' });
    }
  }));
  B.after(1.1, () => { if (u.alive) B.applyStatus(u, u, 'ff_finish', 8); });
}
ff7Common({
  id: 'Cloud', name: 'Cloud', role: 'Damage', roleLabel: 'Damage / Control', position: 'Frontline', tier: 'SS',
  blurb: 'A mercenary with the Buster Sword. He claims to be former SOLDIER and keeps the rest of his past to himself.',
  scale: 150 * 2.3 / 98,
  base: { hp: 5250, atk: 505, def: 325, mag: 150, mdef: 280, spd: 138, acc: 225, eva: 150 },
  hidden: { range: 118, aspd: 1.0, ms: 105, aggro: 1.1, crit: .14, critDmg: 1.7, healPow: 1, shieldPow: 1, cdr: .05, ccRes: .18, kbRes: .4, armorPen: .08, magPen: 0 },
  basic: { name: 'Buster Sword', type: 'physical', ratio: 1.05, range: 118, wind: .2, attackAnim: .5, sfx: 'swing_heavy', hit: 'ff7_sword_hit', pcol: '#cfefff',
    onHit: (u, t, B) => cloudBasicHit(u, t, B) },
  skills: {
    W: {
      name: 'Limit Break', type: 'Physical Damage / Control', energy: 100,
      v: { braver: 2.7, beam: 2.2, split: .95, meteor: .78, omni: .44, omniFinal: 1.3, whirl: .55 }, p: {},
      desc: S => `<span class="sk-pas">Passive: Cloud gains Limit when he attacks, takes damage, or defeats an enemy. He starts each wave at Limit Level 1 and gains a Level after each Limit Break (max 4).</span>
        Active, by Limit Level — <b>1 · Braver</b>: leaps onto the highest-Attack enemy for <em>${pcn(S.braver * 100)}</em> and Knocks it Down. <b>2 · Blade Beam</b>: an energy wave hits the highest-HP enemy for <em>${pcn(S.beam * 100)}</em>, then splits into every other enemy for <em>${pcn(S.split * 100)}</em>. <b>3 · Meteorain</b>: six strikes on random enemies for <em>${pcn(S.meteor * 100)}</em> each, reducing Armor. <b>4 · Omnislash</b>: 15 guaranteed Critical strikes of <em>${pcn(S.omni * 100)}</em>, prioritizing the lowest HP; the last adds <em>${pcn(S.omniFinal * 100)}</em> and Stuns. At Level 4 Cloud's Limit fills 20% slower.`,
      passive: (u, B) => {
        u._ff7Lv = 1;
        B.on(u, 'basicHit', () => ff7Limit(u, B, 2.5));
        B.on(u, 'damaged', ev => { if (ev.amount > 0) ff7Limit(u, B, Math.min(7, ev.amount / u.max.hp * 50)); });
        B.on(u, 'defeatedEnemy', () => ff7Limit(u, B, 15));
      },
      cast: (u, B, S) => {
        if (u._ff7FinishNext) { cloudFinishingTouch(u, B, S); return; }
        const lv = u._ff7Lv || 1;
        FF7FX.banner(B, `Limit Lv ${lv} · ${CLOUD_LIMITS[lv]}`, 'limit');
        FF7FX.sfx('limit2', .55);
        [null, cloudBraver, cloudBladeBeam, cloudMeteorain, cloudOmnislash][lv](u, B, S);
        cloudLevelUp(u, B);
      }
    },
    G: {
      name: 'Cross-Slash', type: 'Physical Damage / Control', cd: 9,
      v: { ratio: .62 }, p: { para: 4, drain: 40 },
      desc: (S, P) => `Cloud slashes the closest enemy three times for <em>${pcn(S.ratio * 100)}</em> Physical Damage each. The final strike forms a cross that Paralyzes for ${P.para}s (no Basic Attacks or Skills). Against an Armor-reduced target it deals 30% more and drains ${P.drain} Energy. At Limit Level 3+ the cross also hits nearby enemies. Paralyzing grants Cloud Limit, and marks the target so Tifa's next Basic Attack against it critically strikes.`,
      ai: { prio: 62, cond: (u, B) => ff7Foes(u, B).some(e => B.distance(u, e) < 260) },
      cast: (u, B, S, P) => {
        const t = B.nearest(u, ff7Foes(u, B)); if (!t) return;
        FF7FX.banner(B, 'Cross-Slash');
        B.dash(u, t.x - u.face * 70, .16, { depth: t.depth });
        FF7Sprites.hold(u, B, 'cross', .56);
        B.repeat(3, .15, i => {
          if (!u.alive || !t.alive) return;
          const broken = t.hasStatus('ff_armorbreak');
          B.damage(u, t, u.st.atk * S.ratio * (broken ? 1.3 : 1), { type: 'physical', tag: 'Cross-Slash', melee: true });
          B.fxSlash(u, t, { col: '#cfefff', ang: i === 2 ? 45 : -45 });
          Sound.play('hit_slash', { vol: .45, throttle: 30 });
          if (i !== 2) return;
          if (!B.offscreen) B.fxFloatIcon(t.x, t.y - 70, '✚', '#cfefff');
          const before = t.hasStatus('ff_paralyze');
          B.applyStatus(u, t, 'ff_paralyze', t.isBoss ? P.para * .5 : P.para);
          if (!before && t.hasStatus('ff_paralyze')) { ff7Limit(u, B, 10); B.applyStatus(u, t, 'ff_crossmark', 8); }
          if (broken) B.energy(t, -P.drain);
          if ((u._ff7Lv || 1) >= 3) ff7Foes(u, B).filter(e => e !== t && B.distance(e, t) < 150).forEach(e => B.damage(u, e, u.st.atk * S.ratio * .6, { type: 'physical', area: true, tag: 'Cross-Slash' }));
        });
      }
    },
    B: {
      name: 'Climhazzard', type: 'Physical Damage / Control', cd: 12,
      v: { stab: 1.25, rise: 1.0, missing: 1.4 }, p: { shred: .25, dur: 8 },
      desc: (S, P) => `Cloud lunges at the enemy with the most HP, stabbing for <em>${pcn(S.stab * 100)}</em> and reducing Armor by ${pc(P.shred)} for ${P.dur}s, then rips upward for <em>${pcn(S.rise * 100)}</em> plus up to <em>${pcn(S.missing * 100)}</em> more based on missing HP (capped on bosses), launching it. A Paralyzed target takes a second strike on landing. At Limit Level 4 it also reduces the target's Damage Reduction for 6s.`,
      ai: { prio: 54, cond: (u, B) => ff7Foes(u, B).length > 0 },
      cast: (u, B, S, P) => {
        const t = ff7Foes(u, B).sort((a, b) => b.hp - a.hp)[0]; if (!t) return;
        FF7FX.banner(B, 'Climhazzard');
        B.dash(u, t.x - u.face * 60, .2, { depth: t.depth });
        FF7FX.clip(B, u, 'cloud-chainA', { ms: 600 });
        B.after(.22, () => {
          if (!u.alive || !t.alive) return;
          B.damage(u, t, u.st.atk * S.stab, { type: 'physical', tag: 'Climhazzard', melee: true });
          B.applyStatus(u, t, 'ff_armorbreak', P.dur, { val: P.shred });
        });
        B.after(.45, () => {
          if (!u.alive || !t.alive) return;
          const miss = (1 - t.hpPct) * (t.isBoss ? .5 : 1);
          B.damage(u, t, u.st.atk * (S.rise + S.missing * miss), { type: 'physical', tag: 'Climhazzard', melee: true });
          B.applyStatus(u, t, 'launch', .8);
          if ((u._ff7Lv || 1) >= 4) B.applyStatus(u, t, 'ff_drdown', 6, { val: .12 });
          B.leap(u, u.x, .4, null, u.depth);
          if (t.hasStatus('ff_paralyze')) B.after(.5, () => { if (u.alive && t.alive) { B.damage(u, t, u.st.atk * S.rise, { type: 'physical', tag: 'Climhazzard', melee: true }); B.shake(8, .2); } });
        });
      }
    },
    P: {
      name: 'Counter Materia', type: 'Physical Damage / Survival',
      v: { def: .15, crit: .10, counter: .85 }, p: { chance: .35, low: .50 },
      desc: (S, P) => `Cloud gains <em>${pcn(S.def * 100)}</em> Armor and <em>${pcn(S.crit * 100)}</em> Critical Chance. When struck by a Basic Attack, he has a ${pc(P.chance)} chance (${pc(P.low)} below half HP) to counter for <em>${pcn(S.counter * 100)}</em> Physical Damage. Each counter grants Battle Focus (+6% Attack, 8s, max 5); at 5 stacks his next Basic Attack splashes and generates Limit. Falling below 50% HP grants 20% Damage Reduction for 6s (20s cooldown).`,
      passive: (u, B, S, P) => {
        u.flat.defP86 = S.def; u.flat.crit86 = S.crit; u.dirty = true; u._ff7GuardAt = -99;
        B.on(u, 'damaged', ev => {
          if (u.hpPct < .5 && B.t - u._ff7GuardAt > 20) { u._ff7GuardAt = B.t; B.applyStatus(u, u, 'ff_counterguard', 6); }
          if (!ev.basic || !ev.src || ev.src.team === u.team || ev.tag === 'Counter' || !ev.src.alive) return;
          if (!chance(u.hpPct < .5 ? P.low : P.chance)) return;
          const src = ev.src;
          B.after(.12, () => {
            if (!u.alive || !src.alive || ff7Stopped(u)) return;
            B.anim(u, 'attack', .35);
            B.damage(u, src, u.st.atk * S.counter, { type: 'physical', tag: 'Counter', melee: true });
            FF7FX.pop(B, u, 'COUNTER', '#cfefff');
            B.applyStatus(u, u, 'ff_focus', 8, { stacks: 1 });
            const f = u.getStatus('ff_focus'); if (f && f.stacks >= 5) u._ff7Empowered = true;
          });
        });
      }
    },
    R: {
      name: 'Finishing Touch', type: 'Physical Damage / Control / True Damage',
      v: { atk: .10, hp: .10, def: .08 }, p: {},
      desc: S => `Cloud's Limit Breaks gain effects: Braver Stuns longer and ignores 20% Armor; Blade Beam drains Energy and splits harder; Meteorain fires 8 strikes and slows Skill Haste; Omnislash gains 3 hits and hits harder below half HP. <b>Finishing Touch:</b> once per wave, on reaching Limit Level 4 his next Limit Break is a whirlwind that pulls enemies together, strikes repeatedly, launches them, and finishes non-boss enemies below 20% HP (bosses take bonus damage instead). Afterward: +30% Attack Speed, +25% Critical Damage, 20% Damage Reduction for 8s. Also grants <em>${pcn(S.atk * 100)}</em> Attack, <em>${pcn(S.hp * 100)}</em> Max HP, and <em>${pcn(S.def * 100)}</em> Armor.`,
      passive: (u, B, S) => { u._ff7Finish = true; u.flat.atkP85 = S.atk; u.flat.hpP85 = S.hp; u.flat.defP85 = S.def; u.dirty = true; }
    }
  }
});
function cloudBasicHit(u, t, B) {
  if (!u._ff7Empowered) return;
  u._ff7Empowered = false; B.removeStatus(u, 'ff_focus');
  ff7Foes(u, B).filter(e => B.distance(e, t) < 150).forEach(e => B.damage(u, e, u.st.atk * .8, { type: 'physical', area: true, tag: 'Focused Strike' }));
  B.fxRing(t.x, t.y - 30, 150, '#cfefff', .3); ff7Limit(u, B, 12);
}

/* ============================================================ CAIT SITH */
const CAIT_SYMBOLS = ['👑', '🐾', '💖', '🌀', '🎁', '🐱', '🃏', '7'];
const CAIT_OUTCOMES = {
  toysoldier: { name: 'Toy Soldier', sym: '👑', good: true }, mogdance: { name: 'Mog Dance', sym: '🐾', good: true, heal: true },
  luckygirl: { name: 'Lucky Girl', sym: '💖', good: true }, summon: { name: 'Summon', sym: '🌀', good: true, rare: true },
  toybox: { name: 'Toy Box', sym: '🎁', good: false }, transform: { name: 'Transform', sym: '🐱', good: true },
  gameover: { name: 'Game Over', sym: '7', good: true, rare: true }, deathjoker: { name: 'Death Joker', sym: '🃏', good: false }
};
function caitStars(u) { const s = u.getStatus && u.getStatus('ff_stars'); return s ? s.stacks : 0; }
function caitGainStar(u, B, n) {
  if (!u.alive) return;
  B.applyStatus(u, u, 'ff_stars', 999, { stacks: n || 1 });
  FF7FX.pop(B, u, '⭐ +' + (n || 1), '#ffe27a');
}
function caitSpendStars(u, n) { const s = u.getStatus('ff_stars'); if (!s || s.stacks < n) return false; s.stacks -= n; if (s.stacks <= 0) s.stacks = 0; u.statusVersion++; return true; }
function caitRoll(u) {
  const r = Math.random();
  const table = [['toysoldier', .20], ['mogdance', .17], ['luckygirl', .14], ['summon', .12], ['toybox', .15], ['transform', .10], ['gameover', .03], ['deathjoker', .09]];
  let acc = 0; for (const [k, w] of table) { acc += w; if (r < acc) return k; }
  return 'toybox';
}
function caitResolve(u, B, S, key) {
  const foes = ff7Foes(u, B), allies = B.alliesOf(u).filter(a => a.alive);
  const red = !!u._ff7GameOver, power = red ? 1.2 : 1;
  switch (key) {
    case 'toysoldier':
      B.log('<b>Toy Soldier!</b> A tiny army opens fire.');
      B.repeat(3, .2, () => ff7Foes(u, B).forEach(e => { B.damage(u, e, u.st.atk * S.soldier * power / 3, { type: 'physical', area: true, tag: 'Toy Soldier' }); FX.burst(e.x, e.y - 50, 4, '#ffd34d', { spMax: 160 }); }));
      Sound.play('explode', { vol: .4 }); break;
    case 'mogdance':
      allies.forEach(a => { B.heal(u, a, a.max.hp * .22 * power + u.st.mag * .4, { tag: 'Mog Dance' }); B.energy(a, 20); B.fxRing(a.x, a.y - 40, 90, '#ffc0e8', .4); });
      FF7FX.sfx('cure2', .5);
      if (u.hasStatus('ff_bodyguard')) { B.applyStatus(u, u, 'ff_bodyguard', 7); allies.forEach(a => B.applyStatus(u, a, 'ff_wind', 5)); }
      break;
    case 'luckygirl':
      allies.forEach(a => B.applyStatus(u, a, 'ff_luckygirl', 8 * power));
      FF7FX.art(B, 'LuckyGirl', u.x, u.y - 90, 1100); FF7FX.sfx('item', .5); break;
    case 'summon': {
      const s = pick([['Ifrit', '#ff7a3d', 'burn'], ['Shiva', '#9fe3ff', 'slow'], ['Ramuh', '#fff27a', 'ff_paralyze'], ['Bahamut', '#c8a0ff', null]]);
      FF7FX.banner(B, 'Summon · ' + s[0], 'summon');
      FF7FX.art(B, s[0], B.W / 2, B.H * .64, 1200);
      B.tint(s[1], .3, .8); FF7FX.sfx('cast_magic', .5);
      B.after(.5, () => {
        if (s[0] === 'Shiva') Sound.play('ff7_ice', { vol: .65, priority: true });
        ff7Foes(u, B).forEach(e => {
          B.damage(u, e, u.st.mag * S.summon * power * (s[0] === 'Bahamut' ? 1.35 : 1), { type: 'magic', area: true, tag: s[0] });
          B.fxBoom(e.x, e.y - 40, 1.1, s[1]);
          if (s[2] === 'burn') B.applyStatus(u, e, 'burn', 5, { val: u.st.mag * .12 });
          else if (s[2] === 'slow') B.applyStatus(u, e, 'slow', 5);
          else if (s[2] && chance(.3)) B.applyStatus(u, e, s[2], 2);
        });
      });
      B.shake(12, .5); break;
    }
    case 'toybox':
      B.log('<b>Toy Box:</b> things start falling from the sky.');
      B.repeat(5, .15, () => { const e = pick(ff7Foes(u, B)); if (!e) return; B.damage(u, e, u.st.mag * .5 * power, { type: 'magic', tag: 'Toy Box' }); B.fxBoom(e.x, e.y - 80, .6, '#ffffff'); if (chance(.25)) B.applyStatus(u, e, pick(['stun', 'slow', 'blind']), 1.5); });
      break;
    case 'transform':
      B.applyStatus(u, u, 'ff_transform', 12); FF7FX.sfx('chocobo_kweh', .5); break;
    case 'gameover': {
      FF7FX.banner(B, 'GAME OVER', 'gameover');
      B.flash('#000000', .7, .6); FF7FX.sfx('boss_kill', .6);
      const thr = u._ff7JackpotSpin ? .30 : .22;
      B.after(.6, () => ff7Foes(u, B).forEach(e => {
        if (!e.isBoss && !e.isElite && e.hpPct < thr) { B.damage(u, e, e.hp + 1, { type: 'true', tag: 'Game Over', noDodge: true }); FF7FX.pop(B, e, 'GAME OVER', '#ff4a6a'); }
        else B.damage(u, e, e.isBoss ? Math.min(e.max.hp * .08, u.st.mag * 4) : u.st.mag * S.gameover, { type: 'true', tag: 'Game Over', noDodge: true });
      }));
      break;
    }
    case 'deathjoker':
      B.log('<b>Death Joker!</b> The machine turns on its own team.');
      Sound.play('banish', { vol: .5 });
      allies.forEach(a => { B.damage(null, a, a.hp * .25, { type: 'true', tag: 'Death Joker', selfharm: true, noDodge: true }); B.energy(a, -15); });
      break;
  }
}
function caitSlots(u, B, S) {
  let key, jackpot = false;
  if (u._ff7GameOver && u._ff7JackpotReady) { jackpot = true; u._ff7JackpotReady = false; u._ff7JackpotSpin = true; key = pick(['toysoldier', 'summon', 'mogdance', 'luckygirl', 'gameover']); }
  else {
    key = caitRoll(u);
    if (u._ff7GameOver && caitStars(u) >= 5 && !CAIT_OUTCOMES[key].rare && caitSpendStars(u, 5)) { key = pick(['summon', 'gameover']); FF7FX.pop(B, u, '⭐×5 LOADED', '#ffe27a'); }
    else if (!CAIT_OUTCOMES[key].good && caitStars(u) >= 3 && caitSpendStars(u, 3)) {
      const allies = B.alliesOf(u).filter(a => a.alive);
      key = allies.some(a => a.hpPct < .5) ? 'mogdance' : 'toysoldier';
      FF7FX.pop(B, u, '⭐×3 NUDGE', '#ffe27a');
    }
  }
  const o = CAIT_OUTCOMES[key];
  const reels = key === 'toybox' ? [o.sym, o.sym, pick(CAIT_SYMBOLS.filter(s => s !== o.sym))] : [o.sym, o.sym, o.sym];
  FF7FX.banner(B, jackpot ? 'Jackpot Spin!' : 'Slots', 'limit');
  FF7FX.slots(B, CAIT_SYMBOLS, reels, o.name.toUpperCase() + (jackpot ? ' · JACKPOT' : ''));
  FF7Sprites.hold(u, B, 'limit', 1.65);
  B.applyStatus(u, u, 'ff_limitlock', 1.3);
  B.after(1.25, () => {
    if (!u.alive) return;
    caitResolve(u, B, S, key);
    if (o.good) B.applyStatus(u, u, 'ff_skillpower', 8);
    if (u._ff7GameOver && !u._ff7JackpotUsed && !jackpot) {
      (u._ff7Seen = u._ff7Seen || new Set()).add(key);
      if (u._ff7Seen.size >= 3) { u._ff7JackpotReady = true; u._ff7JackpotUsed = true; FF7FX.pop(B, u, 'JACKPOT READY', '#ffd34d'); }
    }
    if (jackpot) { B.alliesOf(u).forEach(a => B.applyStatus(u, a, 'ff_jackpot', 8)); u._ff7JackpotSpin = false; FF7FX.sfx('item', .6); }
  });
}
ff7Common({
  id: 'CaitSith', name: 'Cait Sith', role: 'Support', roleLabel: 'Support / Damage / Control', position: 'Midline', tier: 'SS',
  blurb: 'A fortune teller at the Gold Saucer who rides a stuffed Moogle and fights with a megaphone.',
  scale: 96 * 1.45 / 98,
  base: { hp: 4700, atk: 360, def: 270, mag: 440, mdef: 300, spd: 120, acc: 215, eva: 120 },
  hidden: { range: 165, aspd: .98, ms: 88, aggro: .85, crit: .12, critDmg: 1.6, healPow: 1.15, shieldPow: 1.1, cdr: .07, ccRes: .15, kbRes: .45, armorPen: 0, magPen: .05 },
  basic: { name: 'Moogle Punch', type: 'physical', ratio: 1.0, range: 165, wind: .24, attackAnim: .4, sfx: 'swing_heavy', hit: 'hit_blunt', pcol: '#ffffff',
    onHit: (u, t, B) => {
      if (u.hasStatus('ff_bodyguard')) B.knockback(u, t, 45);
      if (u.hasStatus('ff_transform')) ff7Foes(u, B).filter(e => e !== t && B.distance(e, t) < 140).forEach(e => B.damage(u, e, u.st.atk * .55, { type: 'physical', area: true, tag: 'Big Moogle' }));
    } },
  skills: {
    W: {
      name: 'Slots', type: 'Physical / Magic Damage / Support / Control', energy: 100,
      v: { soldier: 2.1, summon: 2.0, gameover: 2.6 }, p: { start: 2, max: 5 },
      desc: (S, P) => `<span class="sk-pas">Passive: Cait Sith starts each wave with ${P.start} Lucky Stars (max ${P.max}) and earns more when an ally uses a White Skill, an enemy is defeated, or his Moogle blocks an attack.</span>
        Active: Cait Sith spins three reels. <b>Toy Soldier</b> fires a volley at every enemy (<em>${pcn(S.soldier * 100)}</em> total). <b>Mog Dance</b> heals and restores Energy to the team. <b>Lucky Girl</b> grants huge Critical Chance. <b>Summon</b> calls Ifrit, Shiva, Ramuh or Bahamut for <em>${pcn(S.summon * 100)}</em> Magic Damage to all enemies. <b>Transform</b> enlarges the Moogle. <b>Toy Box</b> drops random junk. <b>Game Over</b> (rare) finishes weakened non-boss enemies. <b>Death Joker</b> hurts his own team — unless he spends 3 Lucky Stars to nudge the reels. Good results raise his Attack and Magic by 15% for 8s.`,
      passive: (u, B, S, P) => {
        B.after(.1, () => caitGainStar(u, B, P.start));
        B.on(u, 'allyUltimate', a => { if (a !== u) caitGainStar(u, B, 1); });
        let dead = 0;
        B.every(u, .5, () => {
          const all = B.units ? B.units.filter(x => x.team !== u.team && !x.minion && !x.alive).length : 0;
          if (all > dead) { caitGainStar(u, B, all - dead); dead = all; }
          if (u._ff7GameOver) { const hi = caitStars(u) >= 3; if (hi !== u._ff7Resist) { u._ff7Resist = hi; u.flat.ccRes84 = hi ? .2 : 0; u.dirty = true; } }
        });
      },
      cast: (u, B, S) => caitSlots(u, B, S)
    },
    G: {
      name: 'Dice', type: 'Physical Damage / True Damage', cd: 9,
      v: { pip: .19, triple: 1.25 }, p: { start: 3, max: 6 },
      desc: (S, P) => `Cait Sith throws ${P.start} dice at the enemy with the most HP; each die deals <em>${pcn(S.pip * 100)}</em> Physical Damage per pip. A pair adds 50% damage and drains Energy. Triples add <em>${pcn(S.triple * 100)}</em> True Damage and Stun. A total of 15+ earns a Lucky Star. Each use adds a die for next time (max ${P.max}), resetting every wave.`,
      ai: { prio: 58, cond: (u, B) => ff7Foes(u, B).length > 0 },
      cast: (u, B, S, P) => {
        const t = ff7Foes(u, B).sort((a, b) => b.hp - a.hp)[0]; if (!t) return;
        const n = u._ff7Dice = Math.min(P.max, (u._ff7Dice || P.start - 1) + 1);
        const dice = Array.from({ length: n }, () => 1 + Math.floor(Math.random() * 6));
        const counts = {}; dice.forEach(d => { counts[d] = (counts[d] || 0) + 1; });
        const best = Math.max(...Object.values(counts)), total = dice.reduce((a, b) => a + b, 0);
        B.anim(u, 'cast', .5);
        FF7FX.banner(B, 'Dice · ' + dice.join(' · '));
        if (!B.offscreen) B.fxFloatIcon(t.x, t.y - 110, '🎲 ' + dice.join(' '), '#ffffff');
        B.after(.4, () => {
          if (!u.alive || !t.alive) return;
          let dmg = u.st.atk * S.pip * total * (u._ff7GameOver ? 1.15 : 1);
          if (best >= 2) { dmg *= 1.5 + (u._ff7GameOver ? .15 : 0); B.energy(t, -20); }
          B.damage(u, t, dmg, { type: 'physical', tag: 'Dice' });
          B.fxBoom(t.x, t.y - 40, .7, '#ffffff'); Sound.play('hit_blunt', { vol: .5 });
          if (best >= 3) {
            B.damage(u, t, u.st.atk * S.triple, { type: 'true', tag: 'Dice', noDodge: true }); B.applyStatus(u, t, 'stun', 1.2);
            if (u._ff7GameOver) { B.applyStatus(u, t, 'ff_armorbreak', 8, { val: .2 }); B.applyStatus(u, t, 'magdown', 8); }
            FF7FX.pop(B, t, 'TRIPLES!', '#ffd34d');
          }
          if (best >= 2 && u._ff7LuckyGirl) {
            const a = B.topN(B.alliesOf(u).filter(x => x.hasStatus('ff_fortune')), 'atk', 1)[0];
            const s = a && a.getStatus('ff_fortune'); if (s) s.t += 4;
          }
          if (total >= 15) caitGainStar(u, B, 1);
        });
      }
    },
    B: {
      name: 'Moogle Dance', type: 'Healing / Shield / Support', cd: 14,
      v: { heal: .9, shield: .15 }, p: { guard: 7, share: .30, cut: .40 },
      desc: (S, P) => `The Moogle dances, healing all allies for <em>${pcn(S.heal * 100)}</em> Magic and granting Shields worth <em>${pcn(S.shield * 100)}</em> of Cait Sith's Max HP (the lowest-HP ally is healed extra). Then Bodyguard for ${P.guard}s: ${pc(P.share)} of damage aimed at the lowest-HP ally is redirected to Cait Sith and reduced by ${pc(P.cut)}. Moogle Basic Attacks Knock Back, and absorbing damage restores Energy.`,
      ai: { prio: 66, cond: (u, B) => B.alliesOf(u).some(a => a.alive && a.hpPct < .7) },
      cast: (u, B, S, P) => {
        FF7FX.banner(B, 'Moogle Dance');
        B.anim(u, 'cast', .8); FF7FX.sfx('cure3', .5);
        const allies = B.alliesOf(u).filter(a => a.alive);
        const low = B.lowestHp(allies);
        allies.forEach(a => {
          B.heal(u, a, u.st.mag * S.heal * (a === low ? 1.5 : 1), { tag: 'Moogle Dance' });
          B.shield(u, a, u.max.hp * S.shield * (u._ff7GameOver ? 1.25 : 1), 8);
          if (u._ff7GameOver) B.cleanse(a, 1);
          B.fxRing(a.x, a.y - 40, 90, '#ffd0f0', .4);
        });
        B.applyStatus(u, u, 'ff_bodyguard', P.guard);
        u._ff7Share = P.share; u._ff7Cut = P.cut;
      },
      passive: (u, B) => {
        u._ff7BlockAt = -99;
        B.on(u, 'allyDamaged', ev => {
          if (!u.hasStatus('ff_bodyguard') || ev.unit === u || ev.redirected || !(ev.amount > 0) || !u.alive) return;
          const low = B.lowestHp(B.alliesOf(u).filter(a => a.alive && a !== u));
          if (ev.unit !== low) return;
          const part = ev.amount * (u._ff7Share || .3);
          ev.amount -= part;
          B.damage(u, u, part * (1 - (u._ff7Cut || .4)), { type: 'true', selfharm: true, redirected: true, silent: true });
          B.energy(u, 2);
          if (B.t - u._ff7BlockAt > 4) { u._ff7BlockAt = B.t; caitGainStar(u, B, 1); }
        });
      }
    },
    P: {
      name: 'Lucky Girl', type: 'Critical Chance / Support / Control',
      v: { fortune: 10 }, p: { targets: 2 },
      desc: (S, P) => `At the start of each wave, ${P.targets} random allies gain Good Fortune for <em>${S.fortune.toFixed(1)}s</em>: +20% Critical Chance and +25% Critical Damage. Their Critical Hits restore Cait Sith's Energy, and every fifth one earns a Lucky Star. Rolling doubles or triples on Dice extends Good Fortune on the strongest ally by 4s.`,
      passive: (u, B, S, P) => {
        u._ff7LuckyGirl = true; let crits = 0, lastE = -9;
        B.after(.3, () => rngPickN(B.alliesOf(u).filter(a => a.alive), P.targets).forEach(a => B.applyStatus(u, a, 'ff_fortune', S.fortune, { val: u._ff7GameOver ? .15 : 0 })));
        B.on(u, 'crit', e => {
          if (!e.unit || !e.unit.hasStatus('ff_fortune')) return;
          if (B.t - lastE > 1) { lastE = B.t; B.energy(u, 5); }
          if (++crits % 5 === 0) caitGainStar(u, B, 1);
          if (u._ff7GameOver) Object.keys(u.cds || {}).forEach(k => { if (u.cds[k] > 0) u.cds[k] = Math.max(0, u.cds[k] - .3); });
        });
      }
    },
    R: {
      name: 'Game Over', type: 'True Damage / Magic Damage / Support / Control',
      v: { mag: .12, hp: .10, critDmg: .12 }, p: {},
      desc: S => `Gambling upgrades: good Slots results are 20% stronger, and 5 Lucky Stars can force a rare Summon or Game Over. Dice matches hit harder and triples shred Armor and Magic Defense. Moogle Dance Shields are stronger and Cleanse a debuff. Good Fortune adds 15% Attack Speed, and fortunate Critical Hits trim Cait Sith's cooldowns. Holding 3+ Stars grants 20% Debuff Resistance. <b>Jackpot!</b> Once per wave, after three different Slots outcomes, his next spin is a guaranteed winner; Game Over then finishes non-bosses below 30% HP. Afterward all allies gain +20% Attack and +20% Skill Haste for 8s. Also grants <em>${pcn(S.mag * 100)}</em> Magic, <em>${pcn(S.hp * 100)}</em> Max HP, and <em>${pcn(S.critDmg * 100)}</em> Critical Damage.`,
      passive: (u, B, S) => { u._ff7GameOver = true; u.flat.magP83 = S.mag; u.flat.atkP83 = S.mag; u.flat.hpP83 = S.hp; u.flat.critDmg83 = S.critDmg; u.dirty = true; }
    }
  }
});
function rngPickN(list, n) { return list.slice().sort(() => Math.random() - .5).slice(0, n); }

/* ============================================================ AERITH */
ff7Common({
  id: 'Aerith', name: 'Aerith', role: 'Support', roleLabel: 'Healer / Support', position: 'Backline', tier: 'C',
  blurb: 'A flower seller from the Sector 5 slums. She hears the Planet and fights with a staff and magic.',
  scale: 64 * 2.5 / 98,
  base: { hp: 3250, atk: 230, def: 170, mag: 470, mdef: 305, spd: 112, acc: 205, eva: 135 },
  hidden: { range: 300, aspd: .95, ms: 80, aggro: .45, crit: .06, critDmg: 1.5, healPow: 1.3, shieldPow: 1.15, cdr: .08, ccRes: .15, kbRes: .25, armorPen: 0, magPen: .05 },
  basic: { name: 'Guard Stick', type: 'magic', ratio: .9, range: 300, proj: 'orb', pcol: '#ffc8e8', wind: .25, sfx: 'sparkle', hit: 'hit_magic',
    onHit: (u, t, B) => {
      u._ff7Alt = !u._ff7Alt;
      if (!u._ff7Alt) return;
      const a = B.lowestHp(B.alliesOf(u).filter(x => x.alive));
      if (a && a.hpPct < 1) { B.heal(u, a, u.st.mag * .38, { tag: 'Cure' }); B.fxRing(a.x, a.y - 40, 55, '#b8ffc8', .3); }
    } },
  skills: {
    W: {
      name: 'Healing Wind', type: 'Healing / Support', energy: 100,
      v: { heal: .35, regen: .25 }, p: { low: .30, top: .75 },
      desc: (S, P) => `<span class="sk-pas">Passive: Aerith gains Energy whenever an ally falls low, and every other Basic Attack is a small Cure on the lowest-HP ally.</span>
        Active: a warm wind restores <em>${pcn(S.heal * 100)}</em> of each ally's Max HP and cleanses one debuff. Allies below ${pc(P.low)} HP also Regenerate for 6s. Allies healed above ${pc(P.top)} HP gain 15% Skill Haste for 5s.`,
      passive: (u, B) => {
        B.on(u, 'allyLow', a => { if (a !== u && B.t - (a._ff7AerithLow || -9) > 5) { a._ff7AerithLow = B.t; B.energy(u, 8); } });
      },
      cast: (u, B, S, P) => {
        const allies = B.alliesOf(u).filter(a => a.alive);
        const gospel = u._ff7Gospel && !u._ff7GospelUsed && allies.filter(a => a.hpPct < .4).length >= 2;
        FF7FX.banner(B, gospel ? 'Great Gospel' : 'Healing Wind', 'limit');
        FF7FX.clip(B, u, gospel ? 'aerith-gospel' : 'aerith-rain');
        FF7FX.sfx(gospel ? 'cure3' : 'cure2', .55);
        B.after(.6, () => {
          allies.forEach(a => {
            if (!a.alive) return;
            if (a.hpPct < P.low) B.applyStatus(u, a, 'ff_regen', 6, { val: u.st.mag * S.regen });
            B.heal(u, a, a.max.hp * S.heal, { tag: 'Healing Wind' });
            B.cleanse(a, 1);
            if (a.hpPct > P.top) B.applyStatus(u, a, 'ff_wind', 5);
            if (u._ff7Gospel) B.applyStatus(u, a, 'ff_gospel', 6);
            B.fxRing(a.x, a.y - 40, 90, '#b8ffc8', .45);
          });
          if (u._ff7Fury) { const e = allies.slice().sort((a, b) => a.energy - b.energy)[0]; if (e && e !== u) B.energy(e, 50); }
          if (gospel) {
            u._ff7GospelUsed = true;
            B.flash('#fff8e0', .5, .5);
            allies.forEach(a => { if (!a.alive) return; B.heal(u, a, a.max.hp * .20, { tag: 'Great Gospel' }); a.invuln = Math.max(a.invuln || 0, B.t + 3); B.applyStatus(u, a, 'ff_peerless', 3); });
            const top = B.topN(allies.filter(a => a.alive && a !== u), 'atk', 1)[0]; if (top) B.energy(top, 60);
            B.log('<b>Great Gospel</b> — the Planet answers.');
          }
        });
      }
    },
    G: {
      name: 'Seal Evil', type: 'Control / Magic Damage', cd: 11,
      v: { ratio: 1.45, splash: .6 }, p: { silence: 5, stop: 2, radius: 150 },
      desc: (S, P) => `Aerith seals the enemy with the most Magic Attack for <em>${pcn(S.ratio * 100)}</em> Magic Damage and Silences it for ${P.silence}s. If it holds over 50% Energy it is also Stopped for ${P.stop}s. Nearby enemies take <em>${pcn(S.splash * 100)}</em> and lose 15% Accuracy for 6s. If the seal catches an enemy about to act, Aerith gains Energy.`,
      ai: { prio: 60, cond: (u, B) => ff7Foes(u, B).length > 0 },
      cast: (u, B, S, P) => {
        const t = B.topN(ff7Foes(u, B), 'mag', 1)[0]; if (!t) return;
        FF7FX.banner(B, 'Seal Evil');
        FF7FX.clip(B, u, 'aerith-fire', { hideBody: true });
        B.after(.55, () => {
          if (!u.alive || !t.alive) return;
          const charged = t.energy >= 50, casting = !!t.casting || t.energy >= 90;
          B.damage(u, t, u.st.mag * S.ratio, { type: 'magic', tag: 'Seal Evil' });
          B.applyStatus(u, t, 'silence', P.silence);
          if (charged) B.applyStatus(u, t, 'stun', P.stop);
          if (u._ff7Gospel) B.after(P.silence, () => { if (t.alive) B.applyStatus(u, t, 'ff_skillslow', 5, { val: .2 }); });
          if (casting) B.energy(u, 35);
          B.fxRing(t.x, t.y - 40, 110, '#ffb0d8', .45);
          ff7Foes(u, B).filter(e => e !== t && B.distance(e, t) < P.radius).forEach(e => { B.damage(u, e, u.st.mag * S.splash, { type: 'magic', area: true, tag: 'Seal Evil' }); B.applyStatus(u, e, 'ff_accdown', 6); });
        });
      }
    },
    B: {
      name: 'Breath of the Earth', type: 'Healing / Support', cd: 15,
      v: { per: .28, shield: .12 }, p: { n: 3 },
      desc: (S, P) => `All allies are cleansed of up to ${P.n} debuffs and gain 20% Debuff Resistance for 8s. Each debuff removed heals <em>${pcn(S.per * 100)}</em> Magic. Allies with no debuffs instead gain a Shield of <em>${pcn(S.shield * 100)}</em> of their Max HP. The ally with the least Energy gains 20 Energy.`,
      ai: { prio: 64, cond: (u, B) => B.alliesOf(u).some(a => a.alive && (a.hpPct < .75 || a.statuses.some(s => STATUS[s.id] && STATUS[s.id].kind === 'debuff'))) },
      cast: (u, B, S, P) => {
        FF7FX.banner(B, 'Breath of the Earth');
        B.anim(u, 'cast', .8); FF7FX.sfx('magic', .5);
        const allies = B.alliesOf(u).filter(a => a.alive);
        allies.forEach(a => {
          const n = B.cleanse(a, P.n);
          if (n) B.heal(u, a, u.st.mag * S.per * n * (u._ff7Gospel ? 1.4 : 1), { tag: 'Breath of the Earth' });
          else B.shield(u, a, a.max.hp * S.shield, 8);
          B.applyStatus(u, a, 'ff_resist', 8);
          B.fxRing(a.x, a.y - 30, 80, '#9fe8b0', .4);
        });
        const e = allies.slice().sort((a, b) => a.energy - b.energy)[0]; if (e) B.energy(e, 20);
      }
    },
    P: {
      name: 'Fury Brand', type: 'Support / Energy',
      v: { dur: 8 }, p: { energy: 50 },
      desc: (S, P) => `At the start of each wave the two allies with the highest Attack gain Fury for <em>${S.dur.toFixed(1)}s</em>: +15% Attack Speed and +20% Energy generation; a takedown under Fury empowers their next Basic Attack by 20%. Healing Wind gives the ally with the least Energy ${P.energy} Energy. Once per wave, when two allies are below half HP at once, Breath of the Earth's cooldown is halved.`,
      passive: (u, B, S) => {
        u._ff7Fury = true; let used = false;
        B.after(.3, () => {
          const allies = B.alliesOf(u).filter(a => a.alive && a !== u);
          const top = B.topN(allies, 'atk', 2);
          (u._ff7Gospel ? allies : top).forEach(a => B.applyStatus(u, a, 'ff_fury', S.dur, { val: u._ff7Gospel && !top.includes(a) ? .5 : 1 }));
        });
        B.every(u, .5, () => {
          if (used) return;
          if (B.alliesOf(u).filter(a => a.alive && a.hpPct < .5).length >= 2) { used = true; if (u.cds && u.cds.B > 0) u.cds.B *= .5; FF7FX.pop(B, u, 'PLANET’S CALL', '#9fe8b0'); }
        });
      }
    },
    R: {
      name: 'Great Gospel', type: 'Healing / Support / Survival',
      v: { mag: .10, heal: .12, mdef: .12 }, p: {},
      desc: S => `Healing Wind also grants 15% Damage Reduction for 6s. Seal Evil slows Skill Haste after its Silence ends. Breath of the Earth heals more per debuff. Fury Brand reaches the whole team at reduced strength. <b>Planet Protector:</b> once per wave, Healing Wind cast while two allies are below 40% HP becomes <b>Great Gospel</b>: an extra 20% Max HP heal and 3s of Peerless (immune to damage), and the strongest ally gains 60 Energy. Also grants <em>${pcn(S.mag * 100)}</em> Magic, <em>${pcn(S.heal * 100)}</em> Healing, and <em>${pcn(S.mdef * 100)}</em> Magic Defense.`,
      passive: (u, B, S) => { u._ff7Gospel = true; u.flat.magP82 = S.mag; u.flat.healPowP82 = S.heal; u.flat.mdefP82 = S.mdef; u.flat.shieldPowP82 = .1; u.dirty = true; }
    }
  }
});

/* ============================================================ ENEMIES
   Weaklings by FF7 standards, but tuned to be a real fight here: each keeps
   its original move list, with MP replaced by cooldowns and Energy. */
function ff7Enemy(o) {
  return defHero(Object.assign({
    folder: null, file: null, icon: o.id, twistedOnly: true, ff7Enemy: true, element: 'Monster', tier: 'B',
    growth: { hp: .088, atk: .085, def: .075, mag: .085, mdef: .075 },
    move: { gait: 'step', bob: 3, freq: 1.3, lean: 5, squash: .03, idle: 'breathe', step: 'step', trail: { on: false }, brake: .3 }
  }, o));
}
const FF7H = (range, aspd, ms, extra) => Object.assign({ range, aspd, ms, aggro: 1, crit: .1, critDmg: 1.6, healPow: 1, shieldPow: 1, cdr: .05, ccRes: .15, kbRes: .25, armorPen: .05, magPen: .05 }, extra || {});
function ff7Hard(u) { return !!(u && u._ff7Hard); }

ff7Enemy({
  id: 'FF7Bandit', name: 'Bandit', role: 'Damage', scale: 1.05,
  blurb: 'Raiders near Corel Prison. They grow stronger in a group and can slip behind the front line.',
  base: { hp: 3900, atk: 400, def: 230, mag: 120, mdef: 200, spd: 140, acc: 215, eva: 165 },
  hidden: FF7H(105, 1.15, 120, { crit: .14 }),
  basic: { name: 'Hit', type: 'physical', ratio: 1.0, range: 105, wind: .18, sfx: 'swing_light', hit: 'hit_blunt' },
  skills: {
    W: { name: 'Escape', type: 'Special', energy: 100, v: { ratio: 1.1 }, p: { vanish: 2.5 },
      desc: S => `Vanishes, becoming untargetable, then reappears behind the backline and ambushes the lowest-HP Hero for <em>${pcn(S.ratio * 100)}</em> (never misses). Spending Loot makes it hit harder.`,
      cast: (u, B, S, P) => {
        B.applyStatus(u, u, 'untargetable', P.vanish); FF7FX.pop(B, u, 'ESCAPE', '#ffd34d'); FF7FX.sfx('run', .4);
        B.after(P.vanish, () => {
          const t = B.lowestHp(ff7Foes(u, B)); if (!u.alive || !t) return;
          B.blink(u, t.x + u.face * -60, t.depth, true);
          const loot = u.getStatus('ff_loot'), mult = 1 + (loot ? loot.stacks * .08 : 0);
          B.damage(u, t, u.st.atk * S.ratio * mult, { type: 'physical', tag: 'Ambush', noDodge: true, melee: true });
          if (ff7Hard(u)) B.applyStatus(u, t, 'ff_holdup', .6);
        });
      } },
    G: { name: 'Mug', type: 'Physical Damage', cd: 7, v: { ratio: 1.0 }, p: { steal: 18 },
      desc: (S, P) => `Strikes for <em>${pcn(S.ratio * 100)}</em>, steals ${P.steal} Energy and one buff, and pockets a Loot stack (+8% Attack).`,
      ai: { prio: 55, cond: () => true },
      cast: (u, B, S, P) => {
        const t = B.nearest(u, ff7Foes(u, B)); if (!t) return;
        B.anim(u, 'attack', .3);
        if (!B.damage(u, t, u.st.atk * S.ratio, { type: 'physical', tag: 'Mug', melee: true })) return;
        B.energy(t, -P.steal); B.energy(u, P.steal);
        const buff = t.statuses.find(s => STATUS[s.id] && STATUS[s.id].kind === 'buff' && !s.apexLocked && s.t < 900);
        if (buff) B.removeStatus(t, buff.id);
        B.applyStatus(u, u, 'ff_loot', 999, { stacks: 1 }); FF7FX.pop(B, u, 'MUG!', '#ffd34d');
      } },
    B: { name: 'Hold-up', type: 'Control', cd: 12, v: {}, p: { dur: 1.6 },
      desc: P => `Holds the highest-Attack Hero at gunpoint: they cannot act for 1.6s and take 15% more damage.`,
      ai: { prio: 60, cond: () => true },
      cast: (u, B, S, P) => { const t = B.topN(ff7Foes(u, B), 'atk', 1)[0]; if (!t) return; B.anim(u, 'cast', .4); B.applyStatus(u, t, 'ff_holdup', ff7Hard(u) ? P.dur + .6 : P.dur); FF7FX.pop(B, t, 'HOLD-UP', '#ff9a6a'); } },
    P: { name: 'Gang Up', type: 'Passive', v: { per: .05 }, p: {},
      desc: S => `+${pc(S.per)} Attack for every other living Bandit. When a Bandit falls, the others get angry.`,
      passive: (u, B, S) => {
        B.every(u, .5, () => { const n = B.alliesOf(u).filter(a => a.alive && a !== u && a.id === u.id).length; if (n !== u._ff7Gang) { u._ff7Gang = n; u.flat.atkP80 = n * S.per; u.dirty = true; } });
        B.on(u, 'allyDown', a => { if (a && a.id === u.id) { B.energy(u, 15); B.applyStatus(u, u, 'speedup', 4); } });
      } }
  }
});

ff7Enemy({
  id: 'FF7Beachplug', name: 'Beachplug', role: 'Support', scale: 1.2, nativeFace: -1,
  blurb: 'A sand dweller that protects its allies with Big Guard and burrows when hurt.',
  base: { hp: 4300, atk: 300, def: 290, mag: 360, mdef: 290, spd: 95, acc: 205, eva: 100 },
  hidden: FF7H(220, .9, 70, { kbRes: .5 }),
  basic: { name: 'Bite', type: 'physical', ratio: 1.0, range: 220, proj: 'orb', rangedPhysical: true, pcol: '#d6c46a', wind: .22, sfx: 'swing_light', hit: 'hit_blunt' },
  skills: {
    W: { name: 'Big Guard', type: 'Support', energy: 100, v: {}, p: { dur: 9 },
      desc: P => `Casts Haste, Barrier and MBarrier on its entire side: Attack Speed and Energy up, Physical and Magic damage taken halved.`,
      cast: (u, B, S, P) => {
        B.anim(u, 'cast', .7); FF7FX.banner(B, 'Big Guard', 'enemy'); FF7FX.sfx('magic', .45);
        const dur = ff7Hard(u) ? P.dur + 3 : P.dur;
        B.alliesOf(u).filter(a => a.alive).forEach(a => { B.applyStatus(u, a, 'ff_haste', dur); B.applyStatus(u, a, 'ff_barrier', dur); B.applyStatus(u, a, 'ff_mbarrier', dur * .8); B.fxRing(a.x, a.y - 40, 90, '#7fb0ff', .4); });
      } },
    G: { name: 'Ice', type: 'Magic Damage', cd: 7, v: { ratio: .55 }, p: { radius: 190 },
      desc: (S, P) => `Ice magic on a cluster of Heroes for <em>${pcn(S.ratio * 100)}</em>, Chilling them. Three Chill stacks Freeze.`,
      ai: { prio: 55, cond: () => true },
      cast: (u, B, S, P) => {
        const t = B.nearest(u, ff7Foes(u, B)); if (!t) return;
        B.anim(u, 'cast', .4);
        ff7Foes(u, B).filter(e => B.distance(e, t) < P.radius).forEach(e => {
          B.damage(u, e, u.st.mag * S.ratio, { type: 'magic', area: true, tag: 'Ice' });
          B.applyStatus(u, e, 'ff_chill', 6);
          const c = e.getStatus('ff_chill'); if (c && c.stacks >= 3) { B.removeStatus(e, 'ff_chill'); B.applyStatus(u, e, 'freeze', 1.4); }
          B.fxRing(e.x, e.y - 30, 70, '#bfefff', .3);
        });
      } },
    B: { name: 'Burrow', type: 'Survival', cd: 14, v: { heal: .14 }, p: {},
      desc: S => `When hurt, dives into the sand: untargetable for 1.5s and recovers <em>${pcn(S.heal * 100)}</em> Max HP.`,
      ai: { prio: 70, cond: u => u.hpPct < .55 },
      cast: (u, B, S) => { B.applyStatus(u, u, 'untargetable', 1.5); B.after(1.5, () => { if (u.alive) B.heal(u, u, u.max.hp * S.heal, { tag: 'Burrow' }); }); } },
    P: { name: 'Shoreline', type: 'Passive', v: {}, p: {},
      desc: () => `Whenever an ally under Barrier is struck by a Physical attack, the Beachplug gains Energy.`,
      passive: (u, B) => { B.on(u, 'allyDamaged', ev => { if (ev.type === 'physical' && ev.unit && ev.unit.hasStatus('ff_barrier')) B.energy(u, 2); }); } }
  }
});

ff7Enemy({
  id: 'FF7DeathClaw', name: 'Death Claw', role: 'Control', scale: 1.3,
  blurb: 'A prison monster whose Laser deals damage based on its target’s current HP.',
  base: { hp: 5200, atk: 380, def: 300, mag: 380, mdef: 280, spd: 105, acc: 210, eva: 110 },
  hidden: FF7H(150, .95, 80, { ccRes: .25, kbRes: .6 }),
  basic: { name: 'Claw', type: 'physical', ratio: 1.0, range: 150, wind: .22, sfx: 'swing_heavy', hit: 'hit_slash' },
  skills: {
    W: { name: 'Laser', type: 'Gravity Magic', energy: 100, v: {}, p: { pct: .5 },
      desc: P => `Fires a gravity Laser at the Hero with the most current HP, dealing damage equal to 50% of their current HP (reduced by Magic Defense is ignored; Shields still absorb it).`,
      cast: (u, B, S, P) => {
        const t = ff7Foes(u, B).sort((a, b) => b.hp - a.hp)[0]; if (!t) return;
        B.anim(u, 'cast', .6); FF7FX.banner(B, 'Laser', 'enemy');
        B.after(.4, () => { if (!u.alive || !t.alive) return; if (!B.offscreen && FX.beam) FX.beam(u.x, u.y - 70, t.x, t.y - 50, '#c890ff', .35); B.damage(u, t, t.hp * (ff7Hard(u) ? .55 : .45), { type: 'true', tag: 'Laser', noDodge: true }); B.tint('#5a2a90', .25, .4); });
      } },
    G: { name: 'Death Claw', type: 'Physical / Control', cd: 8, v: { ratio: 1.15 }, p: { para: 2.5, chance: .25 },
      desc: (S, P) => `Rakes the nearest Hero for <em>${pcn(S.ratio * 100)}</em> with a ${pc(P.chance)} chance to Paralyze for ${P.para}s. Paralyzed Heroes take 20% more from Death Claws.`,
      ai: { prio: 55, cond: () => true },
      cast: (u, B, S, P) => {
        const t = B.nearest(u, ff7Foes(u, B)); if (!t) return; B.anim(u, 'attack', .35);
        const ev = B.damage(u, t, u.st.atk * S.ratio * (t.hasStatus('ff_paralyze') ? 1.2 : 1), { type: 'physical', tag: 'Death Claw', melee: true });
        if (ev && chance(ff7Hard(u) ? P.chance + .12 : P.chance)) B.applyStatus(u, t, 'ff_paralyze', P.para);
      } },
    B: { name: 'Barrier', type: 'Support', cd: 13, v: {}, p: { dur: 8 },
      desc: P => `Casts Barrier on the most wounded ally and MBarrier on another.`,
      ai: { prio: 50, cond: (u, B) => B.alliesOf(u).some(a => a.alive && a.hpPct < .85) },
      cast: (u, B, S, P) => {
        const allies = B.alliesOf(u).filter(a => a.alive).sort((a, b) => a.hpPct - b.hpPct);
        if (allies[0]) B.applyStatus(u, allies[0], 'ff_barrier', P.dur);
        if (allies[1] || allies[0]) B.applyStatus(u, allies[1] || allies[0], 'ff_mbarrier', P.dur);
        B.anim(u, 'cast', .4);
      } },
    P: { name: 'Carapace', type: 'Passive', v: {}, p: {},
      desc: () => `Laser targets come first: Death Claw basic attacks prefer Paralyzed Heroes.`,
      passive: (u, B) => { u.basicRedirect = (t) => B.enemiesOf(u).find(e => e.alive && e.hasStatus('ff_paralyze') && B.distance(u, e) < 220) || t; } }
  }
});

ff7Enemy({
  id: 'FF7Cactuar', name: 'Cactuar', role: 'Damage', scale: .95,
  blurb: 'Small and hard to hit. Its 1000 Needles targets the Hero with the lowest HP.',
  base: { hp: 3000, atk: 420, def: 260, mag: 400, mdef: 300, spd: 170, acc: 230, eva: 330 },
  hidden: FF7H(100, 1.1, 150, { crit: .12 }),
  basic: { name: 'Kick', type: 'physical', ratio: .9, range: 100, wind: .16, sfx: 'swing_light', hit: 'hit_blunt' },
  skills: {
    W: { name: '1000 Needles', type: 'Fixed Damage', energy: 100, v: {}, p: {},
      desc: () => `Fires exactly 1000 needles (scaled by level) at the Hero with the lowest HP. Ignores all defense and never misses.`,
      cast: (u, B) => {
        const t = B.lowestHp(ff7Foes(u, B)); if (!t) return;
        B.anim(u, 'cast', .5); FF7FX.banner(B, '1000 Needles', 'enemy');
        const dmg = Math.round(1000 * (1 + u.level / 90) * (ff7Hard(u) ? 1.3 : 1));
        B.after(.35, () => { if (!t.alive) return; B.damage(u, t, dmg, { type: 'true', tag: '1000 Needles', noDodge: true, pierceAll: true }); B.applyStatus(u, t, 'ff_needled', 10, { stacks: 2 }); });
      } },
    G: { name: 'Mystery Kick', type: 'Physical Damage', cd: 9, v: { ratio: 2.6 }, p: {},
      desc: S => `A blinding kick for <em>${pcn(S.ratio * 100)}</em> with 90% accuracy, Knocking Back.`,
      ai: { prio: 55, cond: () => true },
      cast: (u, B, S) => { const t = B.nearest(u, ff7Foes(u, B)); if (!t) return; B.dash(u, t.x - u.face * 50, .12, { depth: t.depth }); if (chance(.9) && B.damage(u, t, u.st.atk * S.ratio, { type: 'physical', tag: 'Mystery Kick', melee: true, noDodge: true })) B.knockback(u, t, 90); else B.floatNum(t, -95, 'MISS', 'miss'); } },
    B: { name: 'Dodge', type: 'Evasion', cd: 11, v: {}, p: { dur: 2.4 },
      desc: P => `Zips aside: untargetable for ${P.dur}s, then its next hit is Critical.`,
      ai: { prio: 65, cond: u => u.hpPct < .8 },
      cast: (u, B, S, P) => { B.applyStatus(u, u, 'untargetable', P.dur); u._ff7Crit = true; B.dash(u, u.x - u.face * 120, .2); } },
    P: { name: 'Needle Skin', type: 'Passive', v: {}, p: {},
      desc: () => `Melee attackers are pricked for small True Damage. After Dodge, its next attack critically strikes.`,
      passive: (u, B) => {
        B.on(u, 'damaged', ev => { if (ev.melee && ev.src && ev.src.alive && ev.src.team !== u.team && chance(.5)) B.damage(u, ev.src, u.st.atk * .12, { type: 'true', tag: 'Needles', noDodge: true }); });
        B.on(u, 'dealDamage', ev => { if (u._ff7Crit) { ev.forceCrit = true; u._ff7Crit = false; } });
      } }
  }
});

ff7Enemy({
  id: 'FF7Joker', name: 'Joker', role: 'Control', scale: 1.05,
  blurb: 'A Gold Saucer jester that attacks with cards and can inflict Doom.',
  base: { hp: 3700, atk: 330, def: 220, mag: 420, mdef: 300, spd: 120, acc: 220, eva: 150 },
  hidden: FF7H(260, 1.0, 85, { ccRes: .2 }),
  basic: { name: 'Spinning Card', type: 'physical', ratio: 1.0, range: 260, proj: 'orb', rangedPhysical: true, pcol: '#ffffff', wind: .2, sfx: 'swing_light', hit: 'hit_slash' },
  skills: {
    W: { name: 'Joker', type: 'Magic / Death', energy: 100, v: { ratio: .8 }, p: { chance: .48, doom: 6 },
      desc: (S, P) => `Flips the Joker on the Hero with the most Energy: <em>${pcn(S.ratio * 100)}</em> Magic Damage and a ${pc(P.chance)} chance of Joker's Doom — after ${P.doom}s they take massive damage unless cleansed.`,
      cast: (u, B, S, P) => {
        const t = B.highestEnergy(ff7Foes(u, B)) || B.nearest(u, ff7Foes(u, B)); if (!t) return;
        B.anim(u, 'cast', .6); FF7FX.banner(B, 'Joker', 'enemy');
        B.after(.4, () => {
          if (!t.alive) return;
          B.damage(u, t, u.st.mag * S.ratio, { type: 'magic', tag: 'Joker', noDodge: true });
          if (chance(ff7Hard(u) ? P.chance * .85 : P.chance * .6)) { B.applyStatus(u, t, 'ff_doom', ff7Hard(u) ? P.doom - 1 : P.doom + 2, { val: ff7Hard(u) ? .6 : .45 }); FF7FX.pop(B, t, '🃏 DOOM', '#ff4a6a'); }
        });
      } },
    G: { name: 'Draw', type: 'Varies', cd: 6, v: { spade: 1.5, club: .75, diamond: .3, heart: .9 }, p: {},
      desc: S => `Draws a card. <b>♠ Spade</b>: <em>${pcn(S.spade * 100)}</em> Physical. <b>♣ Club</b>: Earth magic for <em>${pcn(S.club * 100)}</em> that never misses. <b>♦ Diamond</b>: drains Energy. <b>♥ Heart</b>: heals the most wounded ally.`,
      ai: { prio: 55, cond: () => true },
      cast: (u, B, S) => {
        const hurt = B.alliesOf(u).filter(a => a.alive && a.hpPct < .6);
        const suit = hurt.length && chance(.55) ? 'heart' : pick(['spade', 'club', 'diamond']);
        const t = B.nearest(u, ff7Foes(u, B));
        B.anim(u, 'cast', .35);
        FF7FX.pop(B, u, { spade: '♠ SPADE', club: '♣ CLUB', diamond: '♦ DIAMOND', heart: '♥ HEART' }[suit], suit === 'heart' || suit === 'diamond' ? '#ff6a8a' : '#ffffff');
        if (suit === 'heart') { const a = B.lowestHp(hurt); if (a) B.heal(u, a, u.st.mag * S.heart, { tag: 'Heart' }); return; }
        if (!t) return;
        if (suit === 'spade') B.damage(u, t, u.st.atk * S.spade, { type: 'physical', tag: 'Spade' });
        else if (suit === 'club') B.damage(u, t, u.st.mag * S.club, { type: 'magic', tag: 'Club', noDodge: true });
        else { B.damage(u, t, u.st.mag * S.diamond, { type: 'magic', tag: 'Diamond', noDodge: true }); B.energy(t, -25); B.energy(u, 15); }
      } },
    B: { name: 'Shuffle', type: 'Control', cd: 13, v: {}, p: {},
      desc: () => `Shuffles the deck: swaps places with an ally and Confuses the nearest Hero briefly.`,
      ai: { prio: 45, cond: () => true },
      cast: (u, B) => { const t = B.nearest(u, ff7Foes(u, B)); if (t) B.applyStatus(u, t, 'confusion', 1.8); const a = pick(B.alliesOf(u).filter(x => x.alive && x !== u)); if (a) { const x = u.x; B.blink(u, a.x, a.depth); B.blink(a, x, u.depth); } } },
    P: { name: 'House Edge', type: 'Passive', v: {}, p: {},
      desc: () => `When the Joker falls, it deals one last card: its allies heal 10% Max HP.`,
      passive: (u, B) => { B.on(u, 'death', () => B.alliesOf(u).filter(a => a.alive).forEach(a => B.heal(u, a, a.max.hp * .10, { tag: 'House Edge' }))); } }
  }
});

// PLAYABLE_IDS is snapshotted before the late collaboration files load.
// Register the four recruits after their definitions, as the other events do.
FF7_HERO_IDS.forEach(id => {
  if (!HERO_IDS.includes(id)) HERO_IDS.push(id);
  if (!PLAYABLE_IDS.includes(id)) PLAYABLE_IDS.push(id);
});
