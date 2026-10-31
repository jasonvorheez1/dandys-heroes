/* aperture-fight.js - Looey vs GLaDOS, rebuilt on the structure of the MUGEN GLaDOS character (GLaDOS_States.st / GLaDOS_Helpers.st).
   What is carried over:
   - four cores (Morality, Curiosity, Intelligence, Emotion). The Morality Core is knocked loose on a script; each later core comes off when
     redirected rockets have hurt the body enough (a third of the bar per core).
   - a loose core has to be knocked into the Emergency Intelligence Incinerator. The incinerator only opens for ten seconds, after you break the
     glass over the revolving button (about 32 damage) and hit the button.
   - once a core is burnt the incinerator becomes the rocket turret. It aims at you, fires only once you have stopped moving, locks its aim at the
     warning beep, and the rocket flies straight at the locked angle. It will not fire if the shot would hit GLaDOS.
   - if you linger beside the turret it charges a laser. Two ceiling turrets fire small homing bolts once the first core is loose.
   - the TV countdown (six minutes) starts after "Good news..."; at zero the neurotoxin is released.
   - her voice: the clips play in the order and with the hold times the character uses (state 500, 499, 501, 510, 511, 512), the cores talk
     while they are loose, and she says her last line when she goes down. The only words in the fight are the recordings.
   Looey has portals (blue/orange), a jump, and a bonk (the portal gun's butt) for glass, button and cores. Levels do not matter. */
'use strict';

window.ApertureFight = (() => {
  const W = 800, WH = 450, FLOOR = 388, CEIL = 36, LW = 22, RW = 778;
  const NARROW = (window.innerWidth || 800) < 700;
  const H = WH; // One coordinate system, including portrait phones.
  const BX = 640, GS = .8;                                   // GLaDOS hangs at x=640, drawn at 80%
  const BODY = { x0: BX - 56, x1: BX + 56, y0: CEIL, y1: CEIL + 252 };
  const INC = { x: BX, half: 40 };                           // the incinerator in the floor, under her
  const CORES = [
    { name: 'Morality',     eye: 0, voice: null },
    { name: 'Curiosity',    eye: 1, voice: { group: 'core-squeal', holds: [80, 70, 70, 70, 70, 130, 70, 70, 110, 70, 80, 180, 70, 70, 70, 170, 100], loopTo: 1, die: 'core-squeal-17' } },
    { name: 'Intelligence', eye: 2, voice: { group: 'core-a', holds: [278, 125, 83, 158, 81, 173, 172, 211, 119, 149, 74, 77, 112, 77, 114, 131, 345, 261, 101, 83, 175, 136, 193, 88, 209, 133, 274, 87, 237, 196, 191, 200, 96, 300, 175, 175, 168, 167, 121, 108, 77, 464, 242], loopTo: 1, die: 'core-squeal-17' } },
    { name: 'Emotion',      eye: 3, voice: { group: 'core-b', holds: [46, 63, 125, 134, 59, 49, 69, 119, 132, 77, 130, 106, 100, 46, 49, 44, 73, 56], loopTo: 1, die: null } }
  ];
  // hold times in ticks (60 per second), straight from the character's voice-loop states
  const HOLD = {
    mor:  { 0: 780, 1: 210, 2: 210, 3: 200, 4: 204, 5: 360, 6: 300, 7: 720, 8: 600, 9: 720, 10: 720, 11: 780, 12: 660, 13: 780, 14: 660, 15: 680, 16: 420, 17: 660, 18: 600, 19: 600, 20: 600 },
    good: { 20: 70, 21: 483, 22: 440, 23: 301, 24: 610, 25: 265 },
    b1:   { 25: 120, 26: 380, 27: 300, 28: 480, 29: 240, 30: 265, 31: 244, 32: 494, 33: 319, 34: 295, 35: 227, 36: 367, 37: 468, 38: 647, 39: 483, 40: 200, 41: 428, 42: 449, 43: 316, 44: 376, 45: 548 },
    b2:   { 46: 35, 47: 597, 48: 518, 49: 427, 50: 256, 51: 368, 52: 387, 53: 378, 54: 1074, 55: 329, 56: 508 },
    b3:   { 57: 35, 58: 596, 59: 368, 60: 486, 61: 378, 62: 347, 63: 433, 64: 377, 65: 423, 66: 195, 67: 793, 68: 124, 69: 172, 70: 394, 71: 325, 72: 409, 73: 562, 74: 326, 75: 476, 76: 388 }
  };
  const TICK = 1 / 60;
  const MOUNT = [{ x: -40, y: 52 }, { x: 32, y: 118 }, { x: -18, y: 80 }, { x: -5, y: 164 }];
  const WIRE = ['#6a4fd0', '#ff9a2e', '#3aa0ff', '#ff4a3a'];
  const FEED = [{ x: -44, y: 4 }, { x: 4, y: 56 }, { x: -14, y: 30 }, { x: -2, y: 96 }];
  /* Draws the four cradles and whatever is still seated in them. st(i) -> 'attached' or anything else (empty), look(i, x, y) -> { frame, flip } */
  function paintMounts(ctx, spr, x0, y0, k, t, st, look) {
    for (let i = 0; i < 4; i++) {
      const m = MOUNT[i], mx = x0 + m.x * k, my = y0 + m.y * k, sway = Math.sin(t * 1.3 + i * 1.9), on = st(i) === 'attached';
      ctx.save(); ctx.lineCap = 'round';
      [-1, 1].forEach(side => {
        const ax = x0 + (FEED[i].x + side * 9) * k, ay = y0 + FEED[i].y * k, cx = (ax + mx) / 2 + side * 16 * k + sway * 2.5 * k, cy = (ay + my) / 2 + 10 * k;
        ctx.strokeStyle = '#07090b'; ctx.lineWidth = 5.2 * k; ctx.beginPath(); ctx.moveTo(ax, ay); ctx.quadraticCurveTo(cx, cy, mx, my); ctx.stroke();
        ctx.strokeStyle = side < 0 ? '#444c54' : WIRE[i]; ctx.lineWidth = 3 * k; ctx.stroke();
        ctx.strokeStyle = 'rgba(255,255,255,.22)'; ctx.lineWidth = k; ctx.beginPath(); ctx.moveTo(ax - k, ay - k); ctx.quadraticCurveTo(cx - k, cy - k, mx - k, my - k); ctx.stroke();
      });
      // the cradle
      ctx.beginPath(); ctx.arc(mx, my + 2 * k, 22 * k, 0, 6.283); ctx.fillStyle = 'rgba(0,0,0,.35)'; ctx.fill();
      ctx.beginPath(); ctx.arc(mx, my, 21 * k, 0, 6.283); ctx.fillStyle = '#2a3036'; ctx.fill(); ctx.lineWidth = 2 * k; ctx.strokeStyle = '#07090b'; ctx.stroke();
      ctx.beginPath(); ctx.arc(mx, my, 21 * k, Math.PI * 1.05, Math.PI * 1.75); ctx.strokeStyle = 'rgba(255,255,255,.28)'; ctx.stroke();
      ctx.beginPath(); ctx.arc(mx, my, 17 * k, 0, 6.283); ctx.fillStyle = on ? '#0d1014' : '#050607'; ctx.fill();
      ctx.fillStyle = '#8b949c'; for (let b = 0; b < 4; b++) { const a = b * 1.5708 + .785; ctx.beginPath(); ctx.arc(mx + Math.cos(a) * 19.2 * k, my + Math.sin(a) * 19.2 * k, 1.4 * k, 0, 6.283); ctx.fill(); }
      if (on) {
        const lk = look ? look(i, mx, my) : { frame: 0, flip: false };
        spr(ctx, 'eye-' + i + '-' + lk.frame, mx, my + Math.sin(t * 2.1 + i) * .6 * k, { s: 1.12 * k, flip: lk.flip });
        ctx.beginPath(); ctx.arc(mx, my, 16.5 * k, Math.PI * .1, Math.PI * .9); ctx.strokeStyle = 'rgba(0,0,0,.35)'; ctx.lineWidth = 2 * k; ctx.stroke();
      } else {
        // empty: torn cable ends swing, and the contacts spit now and then
        [-6, 6].forEach((dx, j) => { const sw = Math.sin(t * 2.2 + i + j * 2) * 3 * k; ctx.strokeStyle = '#07090b'; ctx.lineWidth = 4.4 * k; ctx.beginPath(); ctx.moveTo(mx + dx * k, my + 14 * k); ctx.quadraticCurveTo(mx + dx * k + sw, my + 24 * k, mx + dx * k + sw * 1.6, my + 34 * k); ctx.stroke();
          ctx.strokeStyle = j ? WIRE[i] : '#444c54'; ctx.lineWidth = 2.4 * k; ctx.stroke(); ctx.fillStyle = '#d8b05a'; ctx.fillRect(mx + dx * k + sw * 1.6 - k, my + 34 * k, 2 * k, 2 * k); });
        const spark = Math.sin(t * 9 + i * 3) + Math.sin(t * 23 + i);
        if (spark > 1.1) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.strokeStyle = '#bfe6ff'; ctx.lineWidth = 1.5 * k; ctx.beginPath(); let px = mx - 6 * k, py = my; ctx.moveTo(px, py); for (let n = 0; n < 4; n++) { px += 3.2 * k; py = my + (((t * 97 + n * 31 + i * 7) % 9) - 4.5) * k; ctx.lineTo(px, py); } ctx.stroke(); ctx.restore(); }
      }
      ctx.restore();
    }
  }
  const DIFFS = {
    easy:   { label: 'Easy',   hp: 1500, rocket: 300, bolt: 3, bolts: 3.4, boltSpeed: 170, tele: .9,  hit: 750, speed: 300, timer: 420, laserDps: 120 },
    medium: { label: 'Medium', hp: 1000, rocket: 380, bolt: 5, bolts: 2.6, boltSpeed: 230, tele: .75, hit: 600, speed: 380, timer: 360, laserDps: 220 },
    hard:   { label: 'Hard',   hp: 700,  rocket: 480, bolt: 8, bolts: 2.0, boltSpeed: 290, tele: .6,  hit: 480, speed: 480, timer: 300, laserDps: 300 },
    kaizo:  { label: 'Kaizo',  hp: 460,  rocket: 540, bolt: 11, bolts: 1.25, boltSpeed: 330, tele: .45, hit: 380, speed: 540, timer: 240, laserDps: 360 }
  };

  function play(diffKey, onEnd, X) {
    const { snd: rawSnd, spr, atlasReady, sfxReady, playMusic, asset } = X;
    const spr2 = X.spr2 || (() => null);
    const spr3 = X.spr3 || (() => null);
    const camImgs = [asset('cameo-1.png'), asset('cameo-2.png')].map(u => { const i = new Image(); i.src = u; return i; });
    const kaizo = diffKey === 'kaizo';
    // in Kaizo every sound comes out at a random pitch
    const snd = kaizo ? (n, v, o) => rawSnd(n, v, Object.assign({ pitch: .7 + Math.random() * .9 }, o)) : rawSnd;
    const D = DIFFS[diffKey] || DIFFS.easy;
    let paused = true, selectedPortal = 'blue', disposed = false;
    const root = el('div', 'ap-fight');
    root.innerHTML = '<div class="ap-hud"><button class="ap-pause" type="button" aria-label="Pause">\u2161</button><button class="ap-quit" type="button" aria-label="Leave">\u2715</button></div>'
      + '<div class="ap-objective" role="status"><span class="ap-mark">APERTURE</span><b></b><progress max="3" value="0" aria-label="Rockets sent back"></progress></div>'
      + '<div class="ap-viewport"><canvas class="ap-canvas" width="' + W + '" height="' + H + '" aria-label="Test chamber"></canvas></div><div class="ap-sub" aria-live="polite"></div>'
      + '<div class="ap-help"><h2>Burn four cores</h2><ol><li>Break the glass, press the button.</li><li>Carry the core to the pit.</li><li>Send her rockets back through the portals.</li></ol><p class="keys">A D move \u00b7 Space jump \u00b7 Shift dash \u00b7 F use \u00b7 Q blue \u00b7 E orange \u00b7 P pause</p><button class="ap-start" type="button">Start</button></div>'
      + '<div class="ap-pad"><div class="ap-move"><button type="button" data-k="left">\u25c0</button><button type="button" data-k="right">\u25b6</button></div>'
      + '<div class="ap-fire"><button type="button" data-k="jump" class="jump">Jump</button><button type="button" data-k="bonk" class="bonk">Use</button><button type="button" data-k="dash" class="dash">Dash</button><button type="button" data-k="blue" class="blue selected" aria-pressed="true">Blue</button><button type="button" data-k="orange" class="orange" aria-pressed="false">Orange</button></div></div>';
    ($('#app') || document.body).appendChild(root);
    const canvas = $('.ap-canvas', root), ctx = canvas.getContext('2d');
    ctx.imageSmoothingEnabled = false;
    const sub = $('.ap-sub', root);
    try { Music.stop(); } catch (_) { /* optional */ }
    let musicWas = null;
    try { musicWas = Music.volume; Music.setVolume(kaizo ? Math.min(1, Math.max(musicWas * 1.7, .5)) : Math.min(musicWas, .3), { skipSave: true }); } catch (_) { /* optional */ }
    const MEME = ['vine.ogg', 'sadtrombone.ogg', 'Cheering.ogg', 'pebble-bark.mp3', 'error.mp3', 'button.ogg', 'snap.ogg', 'swoosh.ogg', 'recycle.mp3', 'couldbeusedfordancereleatedstuff.ogg', 'bfsl-minifigfoots1.mp3'];
    const MEME_GAIN = { 'vine.ogg': 1.07, 'sadtrombone.ogg': .48, 'Cheering.ogg': .6, 'pebble-bark.mp3': 2.09, 'error.mp3': 2.37, 'button.ogg': .32, 'snap.ogg': .46, 'swoosh.ogg': .41, 'recycle.mp3': 6, 'couldbeusedfordancereleatedstuff.ogg': .65, 'bfsl-minifigfoots1.mp3': 9.9 };
    let memeCtx = null;
    const memeCache = {};
    function meme(file, vol, pitch, max) {
      if (typeof Sound !== 'undefined' && Sound.on === false) return;
      try {
        const base = memeCache[file] || (memeCache[file] = new Audio(encodeURI(ASSET + 'assets/boskers-globe/sfx/' + file)));
        const a = base.cloneNode(), g = vol * (MEME_GAIN[file] || 1) * (typeof Sound !== 'undefined' && typeof Sound.vol === 'number' ? Sound.vol : 1);
        a.volume = clamp(g, 0, 1);
        if (g > 1) { try { memeCtx = memeCtx || new (window.AudioContext || window.webkitAudioContext)(); memeCtx.resume(); const node = memeCtx.createMediaElementSource(a), gn = memeCtx.createGain(); gn.gain.value = Math.min(g, 8); node.connect(gn); gn.connect(memeCtx.destination); a.volume = 1; } catch (_) { a.volume = 1; } }
        a.preservesPitch = false; a.mozPreservesPitch = false; a.webkitPreservesPitch = false; a.playbackRate = clamp(pitch || 1, .25, 4);
        a.play().catch(() => {}); setTimeout(() => { try { a.pause(); } catch (_) { /* gone */ } }, max || 1200);
      } catch (_) { /* decoration */ }
    }
    const randMeme = (vol = .3) => meme(MEME[Math.floor(Math.random() * MEME.length)], vol, .4 + Math.random() * 2.2, 700 + Math.random() * 900);
    const cue = (name, vol = .5) => { try { Sound.play(name, { vol }); } catch (_) { /* optional */ } };

    const hero = HEROES.Looey || {};
    const heroImg = new Image(); heroImg.src = Art.hero('Looey');
    const heroFace = hero.nativeFace || 1;

    /* ---- state */
    const P = { dashT: 0, dashCd: 0, dashDir: 1, inv: 0, cx: 450, cy: FLOOR - 23, vx: 0, vy: 0, w: 22, h: 46, face: 1, hp: D.hp, ground: true, carry: null, hurt: 0, flash: 0, portalCd: 0, run: 0, bonk: 0, bonkCd: 0, still: 0, lastX: 450, lastY: 0, vel: { x: 0, y: 0 } };
    const portals = { blue: null, orange: null };
    const G = { tiles: [], wall: null, crawlers: [], gl: 0, glT: 2, evT: 6, evWarn: null, invert: 0, floatT: 0, rain: [], banter: 0, sweep: null, sweepT: 6, rocket2: 0, stage: 0, mode: 'script', dmg: 0, f: 1, stunned: 0, flash: 0, frame: 0, detachAt: null, glass: 32, button: { a: 0 }, incOpen: 0, turretOut: 0, laser: null, aim: 0, warn: 0, still: 0, shotAt: 0, boltT: 2.5, boltSide: 0 };
    const cores = CORES.map((c, i) => ({ i, state: 'attached', x: 0, y: 0, vx: 0, vy: 0, say: null }));
    const dmul = kaizo ? 1.7 : diffKey === 'hard' ? 1.3 : diffKey === 'easy' ? .7 : 1;          // how hard each phase ramps
    const goneN = () => cores.filter(c => c.state === 'gone').length;
    const corrupt = () => kaizo ? Math.min(1, .12 + goneN() / 3 * .88) : 0;
    const openTime = () => Math.max(kaizo ? 4.5 : 7, (kaizo ? 8 : diffKey === 'hard' ? 12 : diffKey === 'medium' ? 16 : 20) - 2.5 * goneN() * dmul);
    const floats = [], stats = { hits: 0, combo: 0, best: 0, redirects: 0, t: 0 };
    let slow = 0, comboT = 0, realDt = null;
    let kin = kaizo ? { t: 0, s: 0, hold: 0, m: 0, seg: '', oils: [], f: {}, flash: 0, dlgs: [], cores: [0, 1, 2, 3].map(() => ({ x: 80 + Math.random() * 600, y: 80 + Math.random() * 240, vx: (Math.random() < .5 ? -1 : 1) * (150 + Math.random() * 120), vy: (Math.random() < .5 ? -1 : 1) * (120 + Math.random() * 120), done: false })) } : null;
    const rockets = [], bolts = [], parts = [], booms = [], shots = [];
    const keys = {};
    root._dbg = () => ({ P, G, cores, V, rockets, bolts, portals, clock });
    let aim = { x: P.cx + 200, y: P.cy - 20 }, time = 0, lost = false, shake = 0, finale = null, ended = false, hitstop = 0, timeScale = 1;
    let clock = D.timer, clockOn = false, said = {}, gasT = 0;
    let lastFrame = performance.now();
    const baseZoom = 1;
    const camNow = { x: W / 2, y: H / 2, z: baseZoom };

    const say = (key, text, ms = 3600) => {
      if (said[key]) return; said[key] = true;
      sub.innerHTML = '<b>Wheatley</b> ' + text; sub.classList.add('on');
      clearTimeout(say.t); say.t = setTimeout(() => sub.classList.remove('on'), ms);
    };
    const spark = (x, y, n, col, sp = 160) => { for (let i = 0; i < n; i++) { const a = Math.random() * 6.28, v = Math.random() * sp; parts.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 40, life: .4 + Math.random() * .5, max: .9, col, size: 2 + Math.random() * 2 }); } };
    const boom = (x, y, s = 1, quiet) => { booms.push({ x, y, t: 0, s }); spark(x, y, 14, '#ffb347', 220 * s); shake = Math.max(shake, 6 * s); if (!quiet) snd(Math.random() < .5 ? 'boom-a' : 'boom-b', .5, { max: 1400 }); };

    /* ---- her voice: the character's own loops, in order, with its hold times */
    const V = { phase: 'mor', k: 0, t: 0, started: false, interrupt: null, asked: false, hold: 0 };
    const clip = (k, vol = .8) => kaizo ? null : snd('taunt-' + k, vol, { full: 1, voice: 1 });
    const nextMor = k => (k === 0 ? 1 : k === 20 ? 18 : k + 1);
    function vsay(cat, o = {}) {
      if (!kaizo || !root.isConnected) return null;
      const vs = V.vs || (V.vs = (() => { const l = X.voidClips ? X.voidClips() : []; return { short: l.filter(c => c[1] < 1), med: l.filter(c => c[1] >= 1 && c[1] < 2), long: l.filter(c => c[1] >= 2), all: l }; })());
      const arr = vs[cat] && vs[cat].length ? vs[cat] : vs.all; if (!arr.length) return null;
      const c = arr[Math.floor(Math.random() * arr.length)];
      if (o.pick) return c;
      const go = () => { if (!root.isConnected) return; rawSnd(c[0], o.vol || .85, { pitch: o.pitch || 1, full: !o.cut, max: o.cut, exact: !!o.cut, voice: !o.cut }); G.vpulse = .3; };
      if (o.delay) setTimeout(go, o.delay * 1000); else go();
      return c;
    }
    // one short piece climbing a major scale: doot doot doot
    function vscale() { const c = vsay('short', { pick: 1 }); if (!c) return; [0, 2, 4, 5, 7, 9, 11, 12].forEach((st, n) => setTimeout(() => { if (root.isConnected) { rawSnd(c[0], .75, { pitch: Math.pow(2, st / 12), max: 170, exact: true }); G.vpulse = .2; } }, n * 130)); }
    // a line that answers itself, quieter, higher, three times
    function vecho() { const c = vsay('med', { pick: 1 }); if (!c) return; for (let k = 0; k < 4; k++) setTimeout(() => { if (root.isConnected) rawSnd(c[0], .85 * Math.pow(.6, k), { pitch: 1 + .07 * k, max: 650, exact: true }); }, k * 260); G.vpulse = .3; }
    // an alarm: the same sliver, six times, very fast
    function vstutter() { const c = vsay('short', { pick: 1 }); if (!c) return; const n = 4 + Math.floor(Math.random() * 3); for (let k = 0; k < n; k++) setTimeout(() => { if (root.isConnected) rawSnd(c[0], .8, { pitch: 1.1 + Math.random() * .5, max: 90, exact: true }); }, k * 85); G.vpulse = .25; }
    // a call and a squeaky answer
    function vanswer() { vsay('med', { pitch: .75 + Math.random() * .3 }); vsay('short', { pitch: 1.6 + Math.random() * .8, delay: .7 + Math.random() * .4 }); }
    const taunts = [];
    function kaizoVoice(dt) {
      V.kt = (V.kt == null ? .1 : V.kt) - dt; if (V.kt > 0) return;
      if (!taunts.length) for (let i = 0; i < 90; i++) { const l = X.sfxLen ? X.sfxLen('taunt-' + i) : 0; if (l) taunts.push(['taunt-' + i, l]); }
      (X.miaClips ? X.miaClips() : []).forEach(c => { for (let n = 0; n < 3; n++) taunts.push(c); });   // the Mia pieces are a third of her voice in Kaizo
      if (!V.voidList) V.voidList = X.voidClips ? X.voidClips() : [];
      if (!taunts.length) return;
      const frantic = G.banter > 0 || G.gl > 0 ? .5 : 1; V.kt = (.1 + Math.random() * .5) * frantic;
      const cr = corrupt(), vo = V.voidList || [];
      const pickT = () => (vo.length && Math.random() < .22 + cr * .6 ? vo[Math.floor(Math.random() * vo.length)] : taunts[Math.floor(Math.random() * taunts.length)]), [i, len] = pickT(), r = Math.random(), from = Math.random() * Math.max(0, len - .5);
      if (r < .32) rawSnd(i, .85, { from, pitch: .8 + Math.random() * .7, max: 250 + Math.random() * 900, exact: true });
      else if (r < .55) { const d = 70 + Math.random() * 90, n = 3 + Math.floor(Math.random() * 5); for (let k = 0; k < n; k++) setTimeout(() => { if (root.isConnected) rawSnd(i, .8, { from, pitch: .9 + Math.random() * .3, max: d, exact: true }); }, k * d * .9); }
      else if (r < .75) { rawSnd(i, .75, { from, pitch: .45 + Math.random() * .25, max: 800, exact: true }); const [j, l2] = pickT(); setTimeout(() => { if (root.isConnected) rawSnd(j, .75, { from: Math.random() * Math.max(0, l2 - .4), pitch: 1.6 + Math.random() * 1.1, max: 450, exact: true }); }, 140); }
      else if (r < .9) { const [j, l2] = pickT(); rawSnd(i, .7, { from, pitch: .9 + Math.random() * .4, max: 900, exact: true }); rawSnd(j, .7, { from: Math.random() * Math.max(0, l2 - .4), pitch: .6 + Math.random() * 1.2, max: 900, exact: true }); }
      else { const q = Math.random(); if (q < .3) vscale(); else if (q < .55) vecho(); else if (q < .8) vanswer(); else randMeme(.4); }
    }
    function voiceStart() { if (kaizo) { V.started = true; V.asked = true; return; } V.started = true; V.t = 0; V.k = 0; V.phase = 'mor'; clip(0); }
    function voiceUpdate(dt) {
      if (!V.started) return;
      if (kaizo) { kaizoVoice(dt); return; }
      V.t += dt;
      const ticks = V.t / TICK;
      if (V.interrupt) {
        // "Where are you taking that thing": one short line, then back to the loop
        const i = V.interrupt;
        if (!i.said && ticks >= i.t0 + 20) { i.said = true; snd('voice-5000-0', .8, { full: 1, voice: 1 }); }
        if (ticks >= i.t0 + 390) { V.interrupt = null; V.k = nextMor(nextMor(V.k)); V.t = 0; clip(V.k); }
        return;
      }
      const table = HOLD[V.phase] || {};
      const hold = table[V.k];
      if (hold == null) return;
      // clip 33 of the first battle phase waits until the body has taken a first hit
      if (V.phase === 'b1' && V.k === 33 && !(G.dmg >= (Tstage() / 3) || G.stage > 1)) return;
      if (ticks < hold) return;
      V.t = 0;
      if (V.phase === 'mor') { V.k = nextMor(V.k); clip(V.k); }
      else if (V.phase === 'good') { if (V.k === 25) { phaseTo('b1', 25, false); } else { V.k = V.k + 1; clip(V.k); } }
      else if (V.phase === 'b1') { V.k = V.k + 1; if (HOLD.b1[V.k] != null) clip(V.k); }
      else if (V.phase === 'b2') { V.k = V.k + 1; if (HOLD.b2[V.k] != null) clip(V.k); }
      else if (V.phase === 'b3') { V.k = V.k + 1; if (HOLD.b3[V.k] != null) { clip(V.k); if (V.k === 66) setTimeout(() => { if (root.isConnected) snd('voice-5100-0', .8, { full: 1, voice: 1 }); }, 2400); } }
      // morality core: scripted detach three seconds into clip 3
    }
    function phaseTo(p, k, speak = true) { V.phase = p; V.k = k; V.t = 0; if (speak && HOLD[p][k] != null) clip(k); }

    /* ---- helpers */
    const Tstage = () => D.hit * 3;                      // body damage that takes one core off
    const surfaceFor = (ex, ey) => {
      if (ey >= FLOOR - 1) return { x: clamp(ex, LW + 40, RW - 40), y: FLOOR, nx: 0, ny: -1 };
      if (ey <= CEIL + 1) return { x: clamp(ex, LW + 40, RW - 40), y: CEIL, nx: 0, ny: 1 };
      if (ex <= LW + 1) return { x: LW, y: clamp(ey, CEIL + 40, FLOOR - 40), nx: 1, ny: 0 };
      return { x: RW, y: clamp(ey, CEIL + 40, FLOOR - 40), nx: -1, ny: 0 };
    };
    const portalOk = p => !(p.ny === -1 && Math.abs(p.x - BX) < 170) && !(p.ny === 1 && Math.abs(p.x - BX) < 130);   // not the floor or ceiling around her
    function fire(color) {
      if (paused || finale || lost) return;
      const ox = P.cx, oy = P.cy - 8;
      let dx = aim.x - ox, dy = aim.y - oy; const len = Math.hypot(dx, dy) || 1; dx /= len; dy /= len;
      let best = 1e9, hit = null;
      const test = (t, x, y) => { if (t > 0 && t < best && x >= LW - 1 && x <= RW + 1 && y >= CEIL - 1 && y <= FLOOR + 1) { best = t; hit = { x, y }; } };
      if (dx < 0) { const t = (LW - ox) / dx; test(t, LW, oy + dy * t); }
      if (dx > 0) { const t = (RW - ox) / dx; test(t, RW, oy + dy * t); }
      if (dy < 0) { const t = (CEIL - oy) / dy; test(t, ox + dx * t, CEIL); }
      if (dy > 0) { const t = (FLOOR - oy) / dy; test(t, ox + dx * t, FLOOR); }
      if (!hit) return;
      let blocked = !portalOk(surfaceFor(hit.x, hit.y));
      // The ceiling above GLaDOS must remain a usable portal surface.
      P.face = dx >= 0 ? 1 : -1;
      shots.push({ x: ox, y: oy, tx: hit.x, ty: hit.y, t: 0, dur: Math.min(.18, best / 2400), color, blocked });
      snd('shoot-a', .22, { max: 300, rate: color === 'blue' ? 1 : 1.2 });
    }
    function placePortal(color, hit) {
      const p = surfaceFor(hit.x, hit.y), otherKey = color === 'blue' ? 'orange' : 'blue', other = portals[otherKey];
      if (!portalOk(p)) { spark(p.x, p.y, 8, '#9aa6ae', 90); snd('hit', .25, { max: 300 }); say('dead', 'Dead panel. Not there.', 2600); return; }
      if (other && Math.hypot(other.x - p.x, other.y - p.y) < 70) portals[otherKey] = null;
      portals[color] = Object.assign(p, { color, t: 0 });
      spark(p.x, p.y, 10, color === 'blue' ? '#4aa8ff' : '#ff9a2e', 120);
      snd('open', .25, { max: 500, rate: color === 'blue' ? 1.1 : .9 });
    }
    function through(e, from) {
      const to = from === portals.blue ? portals.orange : portals.blue;
      if (!to || e.portalCd > 0) return false;
      const sp = Math.max(Math.hypot(e.vx, e.vy), 240);
      e.vx = to.nx * sp; e.vy = to.ny * sp;
      const hw = (e.w || 10) / 2, hh = (e.h || 10) / 2;
      e.cx = to.x + to.nx * (hw + 4); e.cy = to.y + to.ny * (hh + 4);
      if (to.ny === -1) e.cy = to.y - hh - 2;
      if (to.ny === 1) e.cy = to.y + hh + 2;
      e.portalCd = .28; e.through = (e.through || 0) + 1;
      spark(to.x, to.y, 8, to === portals.blue ? '#4aa8ff' : '#ff9a2e', 100);
      snd('open', .16, { max: 300, rate: 1.4 });
      return true;
    }
    const tryPortals = (e, r) => ['blue', 'orange'].forEach(c => {
      const p = portals[c]; if (!p || e.portalCd > 0) return;
      if (Math.hypot(e.cx - p.x, e.cy - p.y) < r && (e.vx * p.nx + e.vy * p.ny) <= 8) through(e, p);
    });
    function dash() {
      if (paused || finale || lost || P.dashCd > 0) return;
      const dir = ((keys.right ? 1 : 0) - (keys.left ? 1 : 0)) * (G.invert > 0 ? -1 : 1) || P.face;
      P.dashDir = dir; P.face = dir; P.dashT = .17; P.dashCd = .85; P.inv = .3; P.vy = 0;
      snd('clank-b', .18, { max: 250, rate: 2.2 }); spark(P.cx, P.cy, 8, '#9ad8ff', 90); if (kaizo) { meme('swoosh.ogg', .4, 1.2 + Math.random() * 1.5, 600); if (Math.random() < .45) vsay('short', { pitch: 2 + Math.random() * 1.2 }); }
    }
    const hurt = (n, key) => {
      if (P.hurt > 0 || P.inv > 0 || finale || lost) return;
      stats.hits++; stats.combo = 0; comboT = 0; if (kaizo) { meme('vine.ogg', .55, .5 + Math.random() * 1.3, 900); vsay('med', { pitch: .5 + Math.random() * .3, delay: .2 }); }
      P.hp -= n; P.hurt = key === 'beam' ? .08 : key === 'bolt' ? .35 : 1.0; P.flash = .2; shake = Math.max(shake, key === 'bolt' ? 3 : 9);
      if (P.carry != null) { /* the core stays with you */ }
      if (P.hp <= 0) { lost = true; P.hp = 0; setTimeout(() => finish(false), 1600); snd('hit', .6); if (kaizo) { meme('sadtrombone.ogg', .7, 1, 2600); vsay('long', { pitch: .45, delay: .25 }); ssay('long', { pitch: 1 }); } }
    };

    /* ---- cores */
    function detachCore(i) {
      const c = cores[i]; if (c.state !== 'attached') return;
      const s = MOUNT[i];
      c.state = 'loose'; c.x = BX + s.x; c.y = CEIL + s.y; c.vx = (Math.random() - .5) * 120; c.vy = -90;
      shake = 14; boom(c.x, c.y, 1.2); snd('clank-a', .6, { max: 700 });
      for (let n = 0; n < 4; n++) spark(c.x, c.y, 4, '#ffe08a', 150);
      G.mode = 'incinerate'; G.glass = 32; G.incOpen = 0; G.turretOut = 0; G.warn = 0; G.still = 0;
      rockets.length = 0;
      // the core talks while it is loose
      const v = CORES[i].voice; if (v) c.say = { k: 0, t: 0 };
      say('core', 'Break the glass, hit the button, bonk the core into the hole.', 5200);
    }
    function coreVoice(c, dt) {
      const v = CORES[c.i].voice; if (!v || !c.say) return;
      c.say.t += dt;
      if (c.say.t === dt) snd(v.group + '-' + c.say.k, .7, { full: 1, voice: 1 });
      if (c.say.t / TICK >= v.holds[c.say.k]) { c.say.t = 0; c.say.k = c.say.k >= v.holds.length - 1 ? v.loopTo : c.say.k + 1; snd(v.group + '-' + c.say.k, .7, { full: 1, voice: 1 }); }
    }
    function burnCore(c) {
      c.state = 'gone'; if (P.carry === c.i) P.carry = null;
      boom(INC.x, FLOOR - 14, 1.5);
      for (let n = 0; n < 24; n++) spark(INC.x, FLOOR - 14, 1, '#ff9a2e', 280);
      const v = CORES[c.i].voice; if (v && v.die) snd(v.die, .7, { full: 1, voice: 1 }); cue('crit', .5); if (kaizo) { vecho(); meme('recycle.mp3', .5, .6 + Math.random() * 1.2, 1600); meme('couldbeusedfordancereleatedstuff.ogg', .35, 1 + Math.random(), 1500); }
      G.incOpen = 0; G.glass = 32;
      if (c.i === 0) { V.interrupt = null; phaseTo('good', 20, false); V.t = 0; if (!kaizo) playMusic('apFight'); }
      else if (c.i === 1) phaseTo('b2', 46);
      else if (c.i === 2) phaseTo('b3', 57);
      if (c.i === 3) { beginFinale(); return; }
      G.mode = 'turret'; G.dmg = 0; G.f = 1; G.turretOut = 0; G.stage = c.i; G.sweep = null; G.warn = 0; G.laser = null; G.rocket2 = 0; bolts.length = 0;
      G.banter = { easy: 8, medium: 6, hard: 4.5, kaizo: 1.6 }[diffKey] || 6;
    }

    /* ---- bonk: glass, button, cores */
    function bonk() {
      if (paused || P.bonkCd > 0 || finale || lost) return;
      const loose = cores.find(c => c.state === 'loose' && Math.hypot(P.cx-c.x,P.cy-c.y)<64);
      if (P.carry != null && G.incOpen > 0 && Math.abs(P.cx-INC.x)<65) {
        const held = cores[P.carry]; P.carry=null; burnCore(held); P.bonkCd=.3; return;
      }
      const nearButton = G.mode === 'incinerate' && G.incOpen <= 0 && Math.hypot(P.cx-(BX-130),P.cy-(FLOOR-44))<70;
      if (nearButton) {
        P.bonkCd=.3; P.bonk=.18;
        if(G.glass>0){G.glass=Math.max(0,G.glass-16);snd(G.glass?'hit':'glass-break',.4);}
        else {G.incOpen=openTime();snd('open',.5);}
        return;
      }
      if (P.carry != null) {const c=cores[P.carry];c.state='loose';c.x=P.cx+P.face*38;c.y=P.cy;c.vx=P.face*120;c.vy=-90;P.carry=null;P.bonkCd=.3;return;}
      if(loose){P.carry=loose.i;loose.state='carried';P.bonkCd=.3;snd('clank-b',.2);return;}
      P.bonkCd = .35; P.bonk = .18;
      const hx = P.cx + P.face * 30, hy = P.cy - 6;
      snd('clank-b', .25, { max: 250 });
      if (G.mode === 'incinerate') {
        const bx = BX - 130, by = FLOOR - 44;
        if (Math.hypot(hx - bx, hy - by) < 34) {
          if (G.glass > 0) { G.glass -= 16; spark(bx, by, 8, '#cfe9ff', 140); snd('hit', .4, { max: 300 }); if (G.glass <= 0) { snd('glass-break', .6, { max: 900 }); spark(bx, by, 24, '#cfe9ff', 260); say('glass', 'Now the red button.', 2600); } }
          else if (!G.incOpen) { G.incOpen = openTime(); snd('open', .6, { max: 900 }); boom(INC.x, FLOOR - 10, .8, true); say('open', 'Ten seconds. Knock it in.', 2600); }
        }
      }
      cores.forEach(c => { if (c.state === 'loose' && Math.hypot(hx - c.x, hy - c.y) < 40) { c.vx = P.face * 330; c.vy = -230; snd('hit', .4, { max: 300 }); spark(c.x, c.y, 6, '#fff', 120); } });
    }

    /* ---- input */
    const clearKeys=()=>{Object.keys(keys).forEach(k=>keys[k]=false);root.querySelectorAll('.ap-pad button').forEach(b=>b.classList.remove('on'));};
    const help=$('.ap-help',root), pauseButton=$('.ap-pause',root);
    const setPaused=value=>{paused=value;try{X.voices.hold(value);}catch(_){}clearKeys();help.hidden=!value;$('.ap-start',root).textContent=time?'Resume':'Start';pauseButton.textContent=value?'▶':'Ⅱ';pauseButton.setAttribute('aria-pressed',String(value));};
    $('.ap-start',root).onclick=()=>setPaused(false);
    pauseButton.onclick=()=>{if(!finale)setPaused(!paused);};
    const blur=()=>{if(!finale)setPaused(true);};
    const hidden=()=>{if(document.hidden)blur();};
    window.addEventListener('blur',blur);document.addEventListener('visibilitychange',hidden);
    const down = e => {
      if(e.code==='KeyP'){e.preventDefault();if(!e.repeat&&!finale)setPaused(!paused);return;}
      if(e.code==='Escape'){if(!finale)setPaused(!paused);return;}
      if(paused)return;
      if(['ArrowLeft','ArrowRight','ArrowUp','Space'].includes(e.code))e.preventDefault();
      if (['ArrowLeft', 'KeyA'].includes(e.code)) keys.left = true;
      else if (['ArrowRight', 'KeyD'].includes(e.code)) keys.right = true;
      else if (['ArrowUp', 'KeyW', 'Space'].includes(e.code)) { keys.jump = true; e.preventDefault(); }
      else if (e.code === 'KeyQ' && !e.repeat) {selectedPortal='blue';fire('blue');}
      else if (e.code === 'KeyE' && !e.repeat) {selectedPortal='orange';fire('orange');}
      else if (['KeyF', 'KeyX'].includes(e.code) && !e.repeat) bonk();
      else if (['ShiftLeft', 'ShiftRight', 'KeyK'].includes(e.code) && !e.repeat) dash();
      else if (e.code === 'Escape') quit();
    };
    const up = e => {
      if (['ArrowLeft', 'KeyA'].includes(e.code)) keys.left = false;
      else if (['ArrowRight', 'KeyD'].includes(e.code)) keys.right = false;
      else if (['ArrowUp', 'KeyW', 'Space'].includes(e.code)) keys.jump = false;
    };
    document.addEventListener('keydown', down); document.addEventListener('keyup', up);
    const toWorld = ev => { const r=canvas.getBoundingClientRect(),scale=Math.min(r.width/W,r.height/H),left=r.left+(r.width-W*scale)/2,top=r.top+(r.height-H*scale)/2; return {x:((ev.clientX-left)/scale-W/2)/camNow.z+camNow.x,y:((ev.clientY-top)/scale-H/2)/camNow.z+camNow.y}; };
    canvas.addEventListener('pointermove', ev => { aim = toWorld(ev); });
    canvas.addEventListener('pointerdown', ev => {
      if(paused||finale||lost)return;ev.preventDefault();aim=toWorld(ev);
      if(ev.pointerType==='mouse'){fire(ev.button===2?'orange':selectedPortal);return;}
      const points=[{x:LW,y:clamp(aim.y,CEIL+40,FLOOR-40)},{x:RW,y:clamp(aim.y,CEIL+40,FLOOR-40)},{x:clamp(aim.x,LW+40,RW-40),y:CEIL},{x:clamp(aim.x,LW+40,RW-40),y:FLOOR}];
      const hit=points.sort((a,b)=>Math.hypot(a.x-aim.x,a.y-aim.y)-Math.hypot(b.x-aim.x,b.y-aim.y))[0];placePortal(selectedPortal,hit);
    });
    canvas.addEventListener('contextmenu', ev => ev.preventDefault());
    $$('.ap-pad button', root).forEach(b => {
      const k = b.dataset.k;
      const on = ev => { ev.preventDefault(); if(paused)return;try{b.setPointerCapture(ev.pointerId);}catch(_){} if (k === 'blue' || k === 'orange') {selectedPortal=k;root.querySelectorAll('.ap-fire .blue,.ap-fire .orange').forEach(n=>{n.classList.toggle('selected',n.dataset.k===k);n.setAttribute('aria-pressed',String(n.dataset.k===k));});} else if (k === 'bonk') bonk(); else if (k === 'dash') dash(); else keys[k] = true; b.classList.add('on'); };
      const off = ev => { ev.preventDefault(); if (k === 'left' || k === 'right' || k === 'jump') keys[k] = false; b.classList.remove('on'); };
      b.addEventListener('pointerdown', on); b.addEventListener('pointerup', off); b.addEventListener('lostpointercapture', off); b.addEventListener('pointercancel', off);
    });
    const cleanup = () => { if(disposed)return;disposed=true;ended = true; clearKeys();window.removeEventListener('blur',blur);document.removeEventListener('visibilitychange',hidden);clearInterval(hudId); document.removeEventListener('keydown', down); document.removeEventListener('keyup', up); clearTimeout(say.t); try { if (musicWas != null) Music.setVolume(musicWas, { skipSave: true }); } catch (_) { /* optional */ } };
    const finish = ok => { if (!root.isConnected) return; if (!ok) { try { X.voices.stop(); } catch (_) { /* optional */ } } cleanup(); root.remove(); onEnd(ok); };
    const quit = () => { if (finale) return; try { X.voices.stop(); } catch (_) { /* optional */ } cleanup(); root.remove(); onEnd(null); };
    $('.ap-quit', root).onclick = () => UI.confirm('Leave the test?', '', quit);

    /* ---- update */
    function update(dt) {
      if(paused||disposed||lost)return;
      if (kin) { kaizoIntro(dt); return; }
      time += dt; stats.t += dt; P.inv -= dt; P.dashCd -= dt; if (comboT > 0 && (comboT -= dt) <= 0) stats.combo = 0; P.hurt -= dt; P.flash -= dt; P.portalCd -= dt; P.bonk -= dt; P.bonkCd -= dt; G.flash -= dt;
      G.frame = Math.floor(time * 3) % 5;
      if (finale) { finaleUpdate(dt); return; }
      /* player */
      const carryMul = P.carry != null ? .85 : 1, speed = 200 * carryMul;
      const dir = ((keys.right ? 1 : 0) - (keys.left ? 1 : 0)) * (G.invert > 0 ? -1 : 1);
      if (dir) { P.face = dir; P.run += dt * 10; }
      const accel = P.ground ? 1500 : 650;
      if (dir) P.vx += dir * accel * dt; else P.vx -= Math.sign(P.vx) * Math.min(Math.abs(P.vx), (P.ground ? 1400 : 200) * dt);
      const lim = Math.max(speed, Math.abs(P.vx) > speed + 5 && !P.ground ? Math.abs(P.vx) : speed);
      P.vx = clamp(P.vx, -lim, lim);
      if (keys.jump && P.ground) { P.vy = -540; P.ground = false; snd('clank-b', .15, { max: 200, rate: 1.8 }); }
      P.vy = Math.min(G.floatT > 0 ? 420 : 900, P.vy + 1250 * (G.floatT > 0 ? .35 : 1) * dt);
      if (P.dashT > 0) { P.dashT -= dt; P.vx = P.dashDir * 640; P.vy = 0; if (Math.random() < .9) parts.push({ x: P.cx, y: P.cy + (Math.random() - .5) * 30, vx: -P.dashDir * 30, vy: 0, life: .3, max: .3, col: '#9ad8ff', size: 4 }); }
      P.cx += P.vx * dt; P.cy += P.vy * dt;
      tryPortals(P, 30);
      if (P.cx - P.w / 2 < LW) { P.cx = LW + P.w / 2; P.vx = Math.max(0, P.vx); }
      if (P.cx + P.w / 2 > RW) { P.cx = RW - P.w / 2; P.vx = Math.min(0, P.vx); }
      if (P.cy - P.h / 2 < CEIL) { P.cy = CEIL + P.h / 2; P.vy = Math.max(0, P.vy); }
      if (P.cy + P.h / 2 >= FLOOR) { P.cy = FLOOR - P.h / 2; if (P.vy > 0) P.vy = 0; P.ground = true; } else P.ground = false;
      // her body is solid: you can walk under her, not through her
      if (P.cx + P.w / 2 > BODY.x0 && P.cx - P.w / 2 < BODY.x1 && P.cy - P.h / 2 < BODY.y1) {
        const left = P.cx < BX; if (P.cy - P.h / 2 < BODY.y1 - 6) { P.cx = left ? BODY.x0 - P.w / 2 : BODY.x1 + P.w / 2; P.vx = 0; }
      }
      const vel = { x: (P.cx - P.lastX) / Math.max(dt, .001), y: (P.cy - P.lastY) / Math.max(dt, .001) }; P.lastX = P.cx; P.lastY = P.cy; P.vel = vel;
      /* shots */
      for (let i = shots.length - 1; i >= 0; i--) { const s = shots[i]; s.t += dt; if (s.t >= s.dur) { if (!s.blocked) placePortal(s.color, { x: s.tx, y: s.ty }); else spark(s.tx, s.ty, 6, '#aaa', 80); shots.splice(i, 1); } }
      ['blue', 'orange'].forEach(c => { const p = portals[c]; if (!p) return; p.t += dt; if (p.ttl != null && (p.ttl -= dt) <= 0) { spark(p.x, p.y, 10, '#cfd6dc', 110); portals[c] = null; } });
      /* script: the voice loop starts at once; she knocks the Morality Core off three seconds into her third clip */
      if (!V.started) { voiceStart(); say('start', 'Blue: click or Q. Orange: right click or E. Bonk: F.', 6000); }
      voiceUpdate(realDt == null ? dt : realDt);
      if (G.mode === 'script' && ((V.phase === 'mor' && V.k >= 3 && V.t / TICK >= 180) || time >= (kaizo ? 6 : 40))) { detachCore(0); }
      // "Where are you taking that thing?": the first time you pick the core up and carry it off
      const m = cores[0];
      if (G.mode === 'incinerate' && m.state === 'loose' && !V.asked && V.phase === 'mor' && !V.interrupt && (Math.abs(m.vx) > 120 || Math.hypot(m.x - P.cx, m.y - P.cy) < 30) && ((V.k === 6 && V.t / TICK >= 300) || V.k > 6 && V.t / TICK >= 60)) { V.asked = true; V.interrupt = { t0: V.t / TICK, said: false }; V.t = 0; }
      /* the body */
      G.f = Math.min(1, G.f + dt * .1);
      G.stunned = Math.max(0, G.stunned - dt);
      /* incinerator and button */
      G.button.a += dt * (Math.PI * 2 / 6);
      if (G.incOpen > 0) { G.incOpen -= dt; if (G.incOpen <= 0) { snd('door', .4, { max: 700 }); } }
      const pn = goneN(), dm = dmul, ramp = Math.max(0, pn - 1) * dm;
      if (G.banter > 0) { G.banter -= dt; if (G.banter <= 0) { snd('open', .4, { max: 700 }); say('turret' + G.stage, 'Keep moving. Send its rocket back through a portal.', 4200); } }
      /* turret mode */
      if (G.mode === 'turret' && G.banter <= 0) {
        G.turretOut = Math.min(1, G.turretOut + dt * 2);
        const tx = INC.x, ty = FLOOR - 16, ang = Math.atan2(P.cy - ty, P.cx - tx);
        const toBody = Math.atan2((CEIL + 130) - ty, BX - tx);
        const inLine = Math.abs(((ang - toBody + Math.PI * 3) % (Math.PI * 2)) - Math.PI) > Math.PI - .79;   // within 45 degrees of her: it will not shoot
        if (G.warn <= 0) { G.aim = ang; }
        const still = (kaizo || (Math.abs(P.vel.x) < 35 && Math.abs(P.vel.y) < 60)) && !inLine;
        const phase = G.stage + 1;                                // the character's phase counter: 1 after the first core
        if (G.warn <= 0) { G.still = still ? G.still + dt : 0; if (G.still >= (30 - 5 * (phase - 1)) * TICK) { G.warn = (80 - 10 * (phase - 1)) * TICK; G.still = 0; snd('warning', .35, { max: 700 }); say('rocket', 'Rocket. Move.', 2600); } }
        else { G.warn -= dt; if (G.warn <= 0) { launchRocket(G.aim); G.shotAt = time; if ((pn >= 3 && dm >= 1) || kaizo) G.rocket2 = .5; } }
        if (G.rocket2 > 0) { G.rocket2 -= dt; if (G.rocket2 <= 0) { launchRocket(Math.atan2(P.cy - (FLOOR - 30), P.cx - INC.x)); snd('warning', .2, { max: 400, rate: 1.5 }); } }
        // linger by the turret: it charges a laser
        const near = Math.abs(P.cx - tx) < 40 && P.cy + P.h / 2 >= FLOOR - 4;
        if (!G.laser && near) { G.lingering = (G.lingering || 0) + dt; if (G.lingering >= 1) { G.laser = { t: 0 }; G.lingering = 0; snd('charge', .4, { max: 1600 }); } }
        else if (!near) G.lingering = 0;
        if (G.laser) { G.laser.t += dt; if (G.laser.t > 100 * TICK) { if (!G.laser.fired) { G.laser.fired = true; snd('laser', .35, { max: 1200 }); } if (Math.abs(P.cx - tx) < 26) hurt(D.laserDps * dt * (diffKey === 'hard' ? 1 : .8), 'beam'); if (G.laser.t > 164 * TICK) G.laser = null; } }
      }
      if (kaizo && !finale) {
        G.glT -= dt; if (G.glT <= 0) { G.gl = .2 + Math.random() * .6; G.glT = (1 + Math.random() * 2.2) * (1 - .5 * corrupt()); if (Math.random() < .6) randMeme(.22); if (Math.random() < .5) vstutter(); }
        if (G.gl > 0) G.gl -= dt;
        G.invert -= dt; G.floatT -= dt; G.vpulse = Math.max(0, (G.vpulse || 0) - dt);
        if (G.mode !== 'script' && G.banter <= 0) {
          if (G.evWarn) {
            G.evWarn.t -= dt;
            if (G.evWarn.t <= 0) {
              const n = G.evWarn.name; G.evWarn = null; G.gl = .7; randMeme(.4);
              if (n === 'invert') G.invert = 2.6;
              else if (n === 'float') G.floatT = 4;
              else if (n === 'swap') { const b = portals.blue, o = portals.orange; portals.blue = o && Object.assign(o, { color: 'blue' }); portals.orange = b && Object.assign(b, { color: 'orange' }); }
              else if (n === 'burst') { const a0 = Math.random() * 6.28; for (let i = 0; i < 8; i++) { const a = a0 + i * .785; bolts.push({ cx: BX, cy: CEIL + 120, tx: BX + Math.cos(a) * 300, ty: CEIL + 120 + Math.sin(a) * 300, tele: .6, sp: 250, vx: 0, vy: 0, age: 0 }); } }
              else if (n === 'tiles') { const seg = (RW - LW) / 8, ids = [0, 1, 2, 3, 4, 5, 6, 7].sort(() => Math.random() - .5).slice(0, 3); G.tiles = ids.map(i => ({ x0: LW + i * seg, x1: LW + (i + 1) * seg, t: 0 })); }
              else if (n === 'wall') { G.wall = { t: 0, x: RW + 30, gapY: FLOOR - 112 - Math.random() * 30 }; }
              else if (n === 'crawl') { for (let i = 0; i < 2 && G.crawlers.length < 3; i++) G.crawlers.push({ x: i ? LW + 30 : RW - 30, t: -.8 - i * .5, life: 7, bob: Math.random() * 6 }); }
              else if (n === 'rain') { G.rain = []; for (let i = 0; i < 5; i++) G.rain.push({ x: LW + 40 + Math.random() * (RW - LW - 80), t: -i * .12 }); }
            }
          } else {
            G.evT -= dt;
            if (G.evT <= 0) {
              const names = ['invert', 'float', 'swap', 'burst', 'rain', 'tiles', 'wall', 'crawl'].filter(x => x !== G.lastEv); const n = names[Math.floor(Math.random() * names.length)];
              G.lastEv = n; G.evWarn = { name: n, t: .8 }; G.evT = (Math.max(3.2, 7 - 1.1 * pn) + Math.random() * 2.5) * (1 - .3 * corrupt()); snd('warning', .35, { max: 600 }); vstutter(); meme('error.mp3', .35, .5 + Math.random() * .6, 900);
            }
          }
          // floor patches: marked, then they burn anyone standing on them (jump or dash)
          for (let i = G.tiles.length - 1; i >= 0; i--) { const q = G.tiles[i]; q.t += dt; if (q.t > 1.2 && q.t < 2.3 && P.cx > q.x0 && P.cx < q.x1 && P.cy + P.h / 2 >= FLOOR - 6) hurt(D.bolt * 4, 'bolt'); if (q.t > 2.5) G.tiles.splice(i, 1); }
          // the wall: telegraphed at the edge, then it crosses the whole arena with one gap, a jump high
          if (G.wall) { const w = G.wall; w.t += dt; if (w.t > 1) { w.x -= (300 + 30 * pn) * dt; const gt = w.gapY - 50, gb = w.gapY + 50; if (Math.abs(P.cx - w.x) < 28 && (P.cy - P.h / 2 < gt || P.cy + P.h / 2 > gb)) hurt(D.bolt * 7, 'rocket'); if (w.x < LW - 40) G.wall = null; } }
          // crawlers: slow things that walk along the floor at you; hop them
          for (let i = G.crawlers.length - 1; i >= 0; i--) { const c = G.crawlers[i]; c.t += dt; if (c.t < 0) continue; c.life -= dt; c.x += Math.sign(P.cx - c.x) * (85 + 12 * pn) * dt; if (Math.abs(P.cx - c.x) < 22 && P.cy + P.h / 2 >= FLOOR - 20) hurt(D.bolt * 4, 'bolt'); if (c.life <= 0) G.crawlers.splice(i, 1); }
          for (let i = G.rain.length - 1; i >= 0; i--) { const q = G.rain[i]; q.t += dt; if (q.t > 1 && q.t < 1.35 && Math.abs(P.cx - q.x) < 14) hurt(D.bolt * 5, 'bolt'); if (q.t > 1.45) G.rain.splice(i, 1); }
        }
      }
      if (kaizo && !finale && G.mode !== 'script' && G.banter <= 0 && goneN() >= 1) {
        G.waveT = (G.waveT == null ? 3 : G.waveT) - dt;
        if (G.waveT <= 0) { G.waveT = Math.max(3.2, 7.5 - 1.6 * goneN()) + Math.random() * 2; G.waves = G.waves || []; G.waves.push({ t: 0, x: BX + 30, y: CEIL + 235 }); snd('warning', .25, { max: 500, rate: .6 }); }
      }
      if (G.waves) for (let i = G.waves.length - 1; i >= 0; i--) {
        const w = G.waves[i]; w.t += dt; const rad = Math.max(0, w.t - .7) * (210 + 40 * goneN());
        if (w.t > .7 && Math.abs(Math.hypot(P.cx - w.x, P.cy - w.y) - rad) < 10) hurt(D.bolt * 4, 'bolt');
        if (rad > 900) G.waves.splice(i, 1);
      }
      /* ceiling bolts and the low floor beam: each ramps with every core burnt and with the difficulty */
      if (G.mode !== 'script' && G.banter <= 0) {
        G.boltT -= dt;
        if (G.boltT <= 0) {
          G.boltT = Math.max(D.bolts * .5, D.bolts * (1 - .17 * ramp)) * (.9 + Math.random() * .2);
          const volley = kaizo ? Math.min(5, pn + 2) : pn >= 3 && dm >= 1 ? 3 : pn >= 2 && dm >= 1 ? 2 : 1, sp = D.boltSpeed * (1 + .1 * ramp);
          const add = (side, off) => { const bx = BX + (side ? 120 : -120), by = CEIL + 40, a = Math.atan2(P.cy - by, P.cx - bx) + off; bolts.push({ cx: bx, cy: by, tx: bx + Math.cos(a) * 300, ty: by + Math.sin(a) * 300, tele: D.tele, sp, vx: 0, vy: 0, age: 0 }); };
          if (volley === 1) { G.boltSide ^= 1; add(G.boltSide, 0); } else { add(0, 0); add(1, 0); if (volley >= 3) add(Math.random() < .5 ? 0 : 1, (Math.random() < .5 ? -1 : 1) * .3); for (let n = 4; n <= volley; n++) add(Math.random() < .5 ? 0 : 1, (Math.random() - .5) * .9); }
          snd('warning', .16, { max: 300, rate: 1.6 });
        }
        if (pn >= (diffKey === 'hard' || kaizo ? 1 : diffKey === 'medium' ? 2 : 3)) {
          if (!G.sweep) { G.sweepT -= dt; if (G.sweepT <= 0) { G.sweep = { t: 0, fired: false, dbl: kaizo && pn >= 2 && Math.random() < .45 }; G.sweepT = Math.max(kaizo ? 3 : 4.5, 12 - 2.2 * ramp - (diffKey === 'hard' ? 2 : 0) - (kaizo ? 3 : 0)); snd('warning', .3, { max: 600, rate: .8 }); say('sweep', 'Low beam. Jump.', 2600); } }
          else {
            const sw = G.sweep; sw.t += dt;
            if (sw.t > 1.3 && !sw.fired) { sw.fired = true; snd('laser', .3, { max: 900 }); }
            if (sw.t > 1.3 && sw.t < 1.85 && P.cy + P.h / 2 > FLOOR - 26) hurt(D.laserDps * dt * .6, 'beam');
            if (sw.dbl && sw.t > 1.3 && sw.t < 1.85 && P.cy - P.h / 2 < FLOOR - 62) hurt(D.laserDps * dt * .6, 'beam');
            if (sw.t > 1.95) G.sweep = null;
          }
        }
      }
      for (let i = bolts.length - 1; i >= 0; i--) {
        const b = bolts[i]; b.age += dt;
        if (b.tele > 0) { b.tele -= dt; if (b.tele <= 0) { const a = Math.atan2(b.ty - b.cy, b.tx - b.cx); b.ang = a; b.vx = Math.cos(a) * b.sp; b.vy = Math.sin(a) * b.sp; snd('shoot-b', .18, { max: 400, rate: 1.5 }); if (kaizo && Math.random() < .35) meme('pebble-bark.mp3', .25, 1.4 + Math.random() * 1.6, 500); } continue; }
        b.cx += b.vx * dt; b.cy += b.vy * dt;
        if (Math.hypot(P.cx - b.cx, P.cy - b.cy) < 18) { bolts.splice(i, 1); hurt(D.bolt * 6, 'bolt'); spark(b.cx, b.cy, 6, '#ffb36b', 120); cue('hit_blunt', .4); continue; }
        if (b.cx < LW || b.cx > RW || b.cy < CEIL || b.cy > FLOOR || b.age > 6) bolts.splice(i, 1);
      }
      /* rockets: straight lines that speed up to a cap */
      for (let i = rockets.length - 1; i >= 0; i--) {
        const r = rockets[i]; if (!r) continue; r.age += dt; r.portalCd -= dt;
        const sp = Math.min(D.speed * (1 + .1 * ramp), Math.hypot(r.vx, r.vy) * Math.pow(1.0875, 60 * dt));
        const l = Math.hypot(r.vx, r.vy) || 1; r.vx = r.vx / l * sp; r.vy = r.vy / l * sp;
        r.cx += r.vx * dt; r.cy += r.vy * dt; r.ang = Math.atan2(r.vy, r.vx);
        r.trail.push({ x: r.cx, y: r.cy }); if (r.trail.length > 14) r.trail.shift();
        const before = r.through || 0; tryPortals(r, 26);
        if ((r.through || 0) > before) { slow = Math.max(slow, .22); spark(r.cx, r.cy, 8, '#ffe08a', 140); say('redirect', 'It went through. Portals close after one.', 3000); ['blue', 'orange'].forEach(c => { if (portals[c] && portals[c].ttl == null) portals[c].ttl = .9; }); }
        if ((r.through || 0) > 0 && r.cx > BODY.x0 && r.cx < BODY.x1 && r.cy > BODY.y0 && r.cy < BODY.y1) {
          rockets.splice(i, 1); hitBody(r); continue;
        }
        if (Math.hypot(r.cx - P.cx, r.cy - P.cy) < 22) { rockets.splice(i, 1); boom(r.cx, r.cy, .9); hurt(D.rocket * (r.through ? 1 : 1) * .5, 'rocket'); continue; }
        if (r.cx < LW || r.cx > RW || r.cy < CEIL || r.cy > FLOOR || r.age > 9) { rockets.splice(i, 1); boom(clamp(r.cx, LW, RW), clamp(r.cy, CEIL, FLOOR), .8); }
      }
      /* cores */
      cores.forEach(c => {
        if(c.state==='carried'){c.x=P.cx+P.face*20;c.y=P.cy-24;coreVoice(c,dt);return;}
        if (c.state !== 'loose') return;
        coreVoice(c, dt);
        c.vy += 972 * dt; c.x += c.vx * dt; c.y += c.vy * dt;
        if (c.y > FLOOR - 14) { c.y = FLOOR - 14; if (Math.abs(c.vy) > 60) snd('clank-b', .2, { max: 250 }); c.vy = Math.abs(c.vy) > 60 ? -Math.abs(c.vy) * .25 : 0; c.vx *= Math.pow(.85, 60 * dt); }
        if (c.y < CEIL + 14) { c.y = CEIL + 14; c.vy = Math.abs(c.vy) * .25; }
        if (c.x < LW + 14) { c.x = LW + 14; c.vx = Math.abs(c.vx); } if (c.x > RW - 14) { c.x = RW - 14; c.vx = -Math.abs(c.vx); }
        // the pit: open it and the core is burnt; closed, the core rolls off the lid
        if (Math.abs(c.x - INC.x) < INC.half - 2 && c.y >= FLOOR - 20) {
          if (G.incOpen > 0) burnCore(c); else c.vx += (c.x < INC.x ? -1 : 1) * 30;
        }
        // Looey nudges a core just by walking into it
        if (Math.hypot(c.x - P.cx, c.y - P.cy) < 30 && Math.abs(P.vx) > 20) c.vx += P.vx * .06;
        if (Math.hypot(c.x - P.cx, c.y - P.cy) < 36 && !said.nudge) { said.nudge = true; say('nudge', 'Bonk it. F.', 2400); }
      });
      /* clock */
      if (V.phase !== 'mor' && V.phase !== 'good') clockOn = true;
      if (clockOn) clock = Math.max(0, clock - dt);
      if (clock <= 0 && !lost && !finale) { gasT += dt; if (gasT > 6) { lost = true; setTimeout(() => finish(false), 800); } }
      /* fx */
      for (let i = parts.length - 1; i >= 0; i--) { const q = parts[i]; q.life -= dt; q.vy += 520 * dt; q.x += q.vx * dt; q.y += q.vy * dt; if (q.life <= 0) parts.splice(i, 1); }
      for (let i = floats.length - 1; i >= 0; i--) { const q = floats[i]; q.t += dt; q.y -= 34 * dt; if (q.t > 1.1) floats.splice(i, 1); }
      for (let i = booms.length - 1; i >= 0; i--) { booms[i].t += dt; if (booms[i].t > .45) booms.splice(i, 1); }
      shake = Math.max(0, shake - 30 * dt);
      if (pn > 0 && G.banter <= 0) { const I = pn * dm; if (Math.random() < dt * I * 2.4) spark(LW + 20 + Math.random() * (RW - LW - 40), CEIL + 4, 1, '#ffb347', 35); shake = Math.max(shake, .35 * I); }
    }
    /* Kaizo's opening is a bad joke: a fake old-computer boot that goes backwards, error boxes everywhere, GLaDOS falling in and bouncing,
       her cores bouncing around the screen like a screensaver before they get stuffed back in, Wheatley photobombing, and a bouncing title. */
    const KIN_END = 12.2, KIN_TITLE = 8.0, KIN_FALL = 3.4;
    // [segment, script time it starts at, how long it lasts]: the base timeline freezes while each one plays
    const HOLDS = [['P', 1.1, 2.6], ['A', 3.3, 2.7], ['C', 4.6, 3.8], ['B', 5.4, 3.4], ['D', 6.2, 3.6], ['E', 7.0, 4.0]];
    const DLG = ['Cake not found', 'Are you sure?  [Yes]  [Yes]', 'Cores: 47 / 4', 'Updating morality... (no)', 'Neurotoxin is 100% organic', 'Error: error', 'Wheatley has joined the chat', 'Please do not read this', 'Press any key (not that one)', 'Test subject is mostly water'];
    const easeK = u => { u = Math.max(0, Math.min(1, u)); return u * u * (3 - 2 * u); };
    // the five approved shop clips, by how they are used: a blip, YES!, the hum, come back, YOU LOSE
    const SHOP_LISTS = { short: ['shop-33-33', 'shop-24-24', 'shop-24-24'], med: ['shop-5000-1', 'shop-5000-1', 'shop-93-93'], long: ['shop-235-235', 'shop-235-235', 'shop-93-93'] };
    function ssay(cat, o = {}) {
      if (!root.isConnected) return;
      const arr = SHOP_LISTS[cat] || SHOP_LISTS.short;
      rawSnd(arr[Math.floor(Math.random() * arr.length)], o.vol || .9, { pitch: o.pitch || 1, full: true, voice: true });
    }
    function kaizoIntro(dt) {
      const k = kin, fire = (n, fn) => { if (!k.f[n]) { k.f[n] = true; fn(); } };
      const rd = realDt == null ? dt : realDt;
      k.t += rd;
      if (k.hold > 0) { k.hold -= rd; k.m += rd; } else k.s += rd;
      if (k.hold <= 0) for (const h of HOLDS) if (!k.f['seg' + h[0]] && k.s >= h[1]) { k.f['seg' + h[0]] = 1; k.hold = h[2]; k.m = 0; k.seg = h[0]; break; }
      const t = k.s, ft = t - KIN_FALL;
      if (k.hold > 0) {
        const m = k.m, f2 = (n, fn) => fire(k.seg + n, fn);
        if (k.seg === 'P') {
          f2('0', () => { meme('error.mp3', .5, 1.2, 800); meme('button.ogg', .3, .7, 400); });
          if (m > .9) f2('1', () => meme('sadtrombone.ogg', .4, 1.9, 1200));
          if (m > 1.7) f2('2', () => { meme('error.mp3', .5, 2.4, 600); meme('snap.ogg', .4, .6, 400); });
        } else if (k.seg === 'A') {
          // the first cameo: an error window with a still in it
          f2('0', () => { meme('error.mp3', .5, 1.1, 700); ssay('med'); shake = 8; });
          if (m > 1.9) f2('1', () => { meme('button.ogg', .5, 1.2, 400); ssay('short', { pitch: 1 }); });
        } else if (k.seg === 'C') {
          f2('0', () => { snd('boom-a', .4, { max: 900 }); meme('swoosh.ogg', .6, .9, 600); shake = 12; });
          if (m > .5) f2('1', () => meme('Cheering.ogg', .4, 1.5, 1200));
          if (m > 1.3) f2('2', () => { meme('vine.ogg', .7, 1.2, 900); shake = 14; });
          if (m > 2.5) f2('3', () => meme('button.ogg', .4, 1.8, 300));
          if (m > 3.1) f2('4', () => meme('snap.ogg', .5, .8, 300));
        } else if (k.seg === 'D') {
          f2('0', () => meme('couldbeusedfordancereleatedstuff.ogg', .6, 1, 3200));
          if (m > 2.0) f2('1', () => meme('Cheering.ogg', .3, 1.9, 1000));
        } else if (k.seg === 'E') {
          f2('0', () => meme('swoosh.ogg', .4, 1.2, 500));
          for (let n = 0; n < 9; n++) if (m > .35 + n * .22) f2('b' + n, () => meme('pebble-bark.mp3', .3, 1 + n * .18, 350));
          if (m > 2.6) f2('c', () => { meme('vine.ogg', .8, .45, 1300); snd('clank-a', .5, { max: 700 }); shake = 18; ssay('long', { pitch: .9 }); });
          if (m > 3.2) f2('d', () => meme('sadtrombone.ogg', .5, 1.2, 1600));
        } else {
          // the second cameo, a flash, then wheatley on a rainbow
          f2('0', () => { meme('vine.ogg', .8, .5, 1200); ssay('med', { pitch: .85 }); shake = 16; k.flash = .6; });
          if (m > 1.6) f2('1', () => { meme('swoosh.ogg', .7, .8, 800); meme('Cheering.ogg', .3, 1.7, 900); });
          if (m > 2.7) f2('2', () => { snd('boom-a', .6, { max: 1200 }); meme('vine.ogg', .8, .4, 1000); ssay('short', { pitch: 1 }); k.flash = 1; shake = 24; for (let n = 0; n < 40; n++) { const an = Math.random() * 6.28, v = 100 + Math.random() * 300; parts.push({ x: W / 2, y: H * .4, vx: Math.cos(an) * v, vy: Math.sin(an) * v - 120, life: 1 + Math.random(), max: 2, col: ['#ffd24a', '#ff8a1f', '#fff'][n % 3], size: 3 + Math.random() * 5 }); } });
        }
        k.flash = Math.max(0, k.flash - rd * 2.2); shake = Math.max(0, shake - 30 * rd);
        for (let i = parts.length - 1; i >= 0; i--) { const q = parts[i]; q.life -= rd; q.vy += 520 * rd; q.x += q.vx * rd; q.y += q.vy * rd; if (q.life <= 0) parts.splice(i, 1); }
        return;
      }
      if (!k.dlgs) { k.dlgs = []; k.cores = [0, 1, 2, 3].map(i => ({ x: 80 + Math.random() * 600, y: 80 + Math.random() * 240, vx: (Math.random() < .5 ? -1 : 1) * (150 + Math.random() * 120), vy: (Math.random() < .5 ? -1 : 1) * (120 + Math.random() * 120), done: false })); }
      fire('start', () => { meme('error.mp3', .4, 1.5, 700); snd('open', .3, { max: 500 }); });
      if (t > .9) fire('bar99', () => meme('error.mp3', .5, 2.2, 800));
      if (t > 1.05) fire('barBack', () => meme('sadtrombone.ogg', .45, 1.7, 1400));
      // error boxes
      while (k.dlgs.length < 9 && t > 1.3 + k.dlgs.length * .27) {
        const n = k.dlgs.length; k.dlgs.push({ x: 20 + Math.random() * 520, y: 40 + Math.random() * 300, text: DLG[n % DLG.length], born: t });
        meme(['error.mp3', 'button.ogg', 'snap.ogg', 'error.mp3'][n % 4], .45, .7 + Math.random() * 1.6, 500); shake = Math.max(shake, 3);
      }
      if (t > 3) fire('fatal', () => { meme('vine.ogg', .8, .55, 1200); randMeme(.4); shake = 12; });
      if (t > 3 && t < KIN_FALL + .2) { V.started = true; V.asked = true; kaizoVoice(dt); }
      if (t > KIN_FALL) fire('crash', () => { k.flash = 1; shake = 26; snd('boom-a', .6, { max: 1200 }); meme('swoosh.ogg', .6, .6, 700); });
      if (ft > 0) { V.started = true; V.asked = true; kaizoVoice(dt); G.gl = Math.random() < .35 ? .1 : 0; }
      [[.5, 1.3], [1.0, 1.0], [1.4, .8]].forEach((b, n) => { if (ft > b[0]) fire('bounce' + n, () => { meme('vine.ogg', .55, b[1], 800); snd('clank-b', .4, { max: 300 }); shake = Math.max(shake, 10 - n * 3); spark(BX, FLOOR - 10, 10, '#ffffff', 180); }); });
      if (ft > 1.8) fire('rise', () => { meme('swoosh.ogg', .5, 1.8, 600); meme('Cheering.ogg', .3, 1.7, 900); });
      // the cores bounce around the screen like a screensaver, then get called back
      k.cores.forEach((c, i) => {
        if (ft < 0 || c.done) return;
        if (ft < 2.0) {
          c.x += c.vx * dt; c.y += c.vy * dt;
          if (c.x < LW + 15 || c.x > RW - 15) { c.vx = -c.vx; c.x = clamp(c.x, LW + 15, RW - 15); meme('snap.ogg', .3, .8 + Math.random() * 1.6, 300); }
          if (c.y < CEIL + 15 || c.y > FLOOR - 15) { c.vy = -c.vy; c.y = clamp(c.y, CEIL + 15, FLOOR - 15); meme('pebble-bark.mp3', .25, 1.2 + Math.random() * 1.6, 350); }
        } else {
          const tx = BX + MOUNT[i].x, ty = CEIL + MOUNT[i].y, a = Math.min(1, dt * 7);
          c.x += (tx - c.x) * a; c.y += (ty - c.y) * a;
          if (ft > 2.2 + i * .22 && Math.hypot(tx - c.x, ty - c.y) < 6) { c.done = true; snd('clank-b', .4, { max: 300 }); meme('snap.ogg', .4, 1 + i * .3, 300); spark(tx, ty, 10, '#ffe066', 150); }
        }
      });
      if (t > KIN_TITLE) fire('title', () => {
        for (let n = 0; n < 26; n++) k.oils.push({ x: Math.random() * W, y: -30 - Math.random() * 400, vy: 140 + Math.random() * 160, rot: Math.random() * 6, vr: (Math.random() - .5) * 8 });
        ssay('short', { pitch: 1.4 }); setTimeout(() => ssay('med', { pitch: 1.1 }), 500);
        playMusic('apKaizo'); k.flash = 1; shake = 22; snd('boomboomboom', .6, { max: 2000 }); meme('Cheering.ogg', .6, 1.3, 1500); meme('vine.ogg', .6, .7, 900);
        for (let n = 0; n < 80; n++) { const a = Math.random() * 6.28, v = 120 + Math.random() * 330; parts.push({ x: W / 2, y: H / 2, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 220, life: 1.2 + Math.random(), max: 2.2, col: 'hsl(' + Math.floor(Math.random() * 360) + ',90%,60%)', size: 4 + Math.random() * 5 }); }
      });
      k.oils.forEach(o => { o.y += o.vy * dt; o.rot += o.vr * dt; if (o.y > H + 40) o.y = -40; });
      k.flash = Math.max(0, k.flash - dt * 2.2); shake = Math.max(0, shake - 30 * dt);
      for (let i = parts.length - 1; i >= 0; i--) { const q = parts[i]; q.life -= dt; q.vy += 520 * dt; q.x += q.vx * dt; q.y += q.vy * dt; if (q.life <= 0) parts.splice(i, 1); }
      if (t > KIN_END) { kin = null; G.gl = 0; P.cx = 450; P.cy = FLOOR - 23; P.vx = 0; P.vy = 0; hud(); }
    }
    function winBox(x, y, w, h, title, text) {
      ctx.fillStyle = 'rgba(0,0,0,.35)'; ctx.fillRect(x + 5, y + 5, w, h);
      ctx.fillStyle = '#c3c7cb'; ctx.fillRect(x, y, w, h); ctx.fillStyle = '#fff'; ctx.fillRect(x, y, w, 2); ctx.fillRect(x, y, 2, h); ctx.fillStyle = '#6b6f73'; ctx.fillRect(x, y + h - 2, w, 2); ctx.fillRect(x + w - 2, y, 2, h);
      ctx.fillStyle = '#0a2a8a'; ctx.fillRect(x + 3, y + 3, w - 6, 18); ctx.fillStyle = '#fff'; ctx.font = '700 11px sans-serif'; ctx.textAlign = 'left'; ctx.fillText(title, x + 8, y + 16);
      ctx.fillStyle = '#c3c7cb'; ctx.fillRect(x + w - 20, y + 5, 14, 14); ctx.fillStyle = '#000'; ctx.fillText('x', x + w - 16, y + 16);
      if (text) { ctx.fillStyle = '#000'; ctx.font = '12px sans-serif'; ctx.fillText(text, x + 16, y + 44); }
      ctx.fillStyle = '#c3c7cb'; ctx.fillRect(x + w / 2 - 28, y + h - 32, 56, 22); ctx.strokeStyle = '#000'; ctx.lineWidth = 1; ctx.strokeRect(x + w / 2 - 27.5, y + h - 31.5, 55, 21); ctx.fillStyle = '#000'; ctx.textAlign = 'center'; ctx.fillText('OK', x + w / 2, y + h - 17);
    }
    // a window frame; returns the white client area
    function winFrame(x, y, w, h, title, red) {
      ctx.fillStyle = 'rgba(0,0,0,.35)'; ctx.fillRect(x + 5, y + 5, w, h);
      ctx.fillStyle = '#c3c7cb'; ctx.fillRect(x, y, w, h); ctx.fillStyle = '#fff'; ctx.fillRect(x, y, w, 2); ctx.fillRect(x, y, 2, h); ctx.fillStyle = '#6b6f73'; ctx.fillRect(x, y + h - 2, w, 2); ctx.fillRect(x + w - 2, y, 2, h);
      ctx.fillStyle = red ? '#a00018' : '#0a2a8a'; ctx.fillRect(x + 3, y + 3, w - 6, 18);
      ctx.fillStyle = '#fff'; ctx.font = '700 11px sans-serif'; ctx.textAlign = 'left'; ctx.fillText(title, x + 8, y + 16);
      ctx.fillStyle = '#c3c7cb'; ctx.fillRect(x + w - 20, y + 5, 14, 14); ctx.fillStyle = '#000'; ctx.fillText('x', x + w - 16, y + 16);
      ctx.fillStyle = '#fff'; ctx.fillRect(x + 6, y + 26, w - 12, h - 32); ctx.strokeStyle = '#808080'; ctx.lineWidth = 1; ctx.strokeRect(x + 6.5, y + 26.5, w - 13, h - 33);
      return { x: x + 6, y: y + 26, w: w - 12, h: h - 32 };
    }
    function drawKin() {
      const k = kin, t = k.s, ft = t - KIN_FALL;
      ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, H);
      ctx.save(); ctx.translate((Math.random() - .5) * shake, (Math.random() - .5) * shake);
      if (ft < 0) {
        // a teal desktop
        ctx.fillStyle = '#008080'; ctx.fillRect(0, 0, W, H);
        ctx.fillStyle = '#c3c7cb'; ctx.fillRect(0, H - 28, W, 28); ctx.fillStyle = '#fff'; ctx.fillRect(0, H - 28, W, 2); ctx.fillStyle = '#000'; ctx.font = '700 12px sans-serif'; ctx.textAlign = 'left'; ctx.fillText('Start', 12, H - 10);
        if (t < 3) {
          const p = t < .9 ? t / .9 * .99 : t < 1.05 ? .99 : .03 + Math.max(0, Math.sin(t * 3)) * .02;
          winBox(W / 2 - 190, H / 2 - 80, 380, 150, 'Aperture OS 95', t < 1.05 ? 'Starting GLaDOS...' : 'Please wait... (this is normal)');
          ctx.fillStyle = '#fff'; ctx.fillRect(W / 2 - 160, H / 2 - 12, 320, 20); ctx.strokeStyle = '#000'; ctx.strokeRect(W / 2 - 159.5, H / 2 - 11.5, 319, 19);
          ctx.fillStyle = '#0a2a8a'; for (let x = 0; x < 316 * p; x += 12) ctx.fillRect(W / 2 - 158 + x, H / 2 - 9, 9, 16);
          ctx.fillStyle = '#000'; ctx.textAlign = 'center'; ctx.fillText(Math.round(p * 100) + '%', W / 2, H / 2 + 28);
        }
        k.dlgs.forEach(d => { const u = easeK((t - d.born) / .18); ctx.save(); const w = Math.max(190, ctx.measureText(d.text).width + 50), h = 96; ctx.translate(d.x + w / 2, d.y + h / 2); ctx.scale(.3 + .7 * u, .3 + .7 * u); ctx.translate(-w / 2, -h / 2); winBox(0, 0, w, h, 'Error', d.text); ctx.restore(); });
        if (t > 3) { const u = easeK((t - 3) / .15); ctx.save(); ctx.translate(W / 2, H / 2); ctx.scale(.2 + .8 * u, .2 + .8 * u); winBox(-210, -80, 420, 160, 'FATAL ERROR', 'Everything has stopped. Everything.'); ctx.fillStyle = '#c00'; ctx.fillRect(-190, -52, 20, 20); ctx.fillStyle = '#fff'; ctx.font = '900 16px sans-serif'; ctx.textAlign = 'center'; ctx.fillText('X', -180, -36); ctx.restore(); }
      } else {
        ctx.globalAlpha = Math.min(1, ft / .25); drawBackground(); ctx.globalAlpha = 1;
        // falling, bouncing, floating back up to hang
        const floorTop = FLOOR - CEIL - 252;
        const fallY = ft < .5 ? -280 + (floorTop + 280) * (ft / .5) ** 2 : ft < 1 ? floorTop - 80 * Math.sin((ft - .5) / .5 * Math.PI) : ft < 1.4 ? floorTop - 34 * Math.sin((ft - 1) / .4 * Math.PI) : ft < 1.8 ? floorTop : ft < 2.4 ? floorTop * (1 - easeK((ft - 1.8) / .6)) : 0;
        const sq = [[.5, .3], [1, .18], [1.4, .1]].reduce((m, b) => ft >= b[0] ? Math.max(m, b[1] * Math.exp(-(ft - b[0]) * 14)) : m, 0);
        const spin = ft < .5 ? (1 - ft / .5) * 6.28 * 1.5 : 0;
        const pendA = (k.pend || 0);
        ctx.save(); ctx.translate(BX, CEIL); ctx.rotate(pendA); ctx.translate(-BX, -CEIL);
        ctx.save(); ctx.translate(BX, CEIL + fallY + 252); ctx.rotate(spin); ctx.scale(1 + sq, 1 - sq); ctx.translate(0, -252); bodyAt(0, 0); ctx.restore();
        // wheatley photobombs
        ctx.restore();
        if (t > 4.6 && t < 8.95) spr(ctx, 'wheatley', -60 + easeK((t - 4.6) / .7) * 190 - (t > 8.4 ? easeK((t - 8.4) / .5) * 330 : 0), H - 70 + Math.sin(t * 6) * 4, { s: .9, rot: Math.sin(t * 9) * .18 - (t > 8.4 ? (t - 8.4) * 12 : 0) });
        ctx.save(); ctx.translate(BX, CEIL); ctx.rotate(k.pend || 0); ctx.translate(-BX, -CEIL);
        // the screensaver cores
        k.cores.forEach((c, i) => { if (ft < 0) return; if (c.done) return; spr(ctx, 'eye-' + i + '-0', c.x, c.y, { s: 1.12, rot: t * 9 + i, flip: i % 2 === 0 }); });
        if (ft > 1.9) paintMounts(ctx, spr, BX, CEIL, 1, t, i => (k.cores[i].done ? 'attached' : 'gone'), () => ({ frame: 0, flip: true }));
        ctx.restore();
        // a spinner over her head while she "loads"
        if (ft > 1.5 && t < KIN_TITLE) { ctx.save(); ctx.translate(BX, CEIL + 36); ctx.strokeStyle = '#fff'; ctx.lineWidth = 5; ctx.lineCap = 'round'; ctx.beginPath(); ctx.arc(0, 0, 14, t * 8, t * 8 + 4.2); ctx.stroke(); ctx.restore(); }
        if (t > KIN_TITLE) {
          const a = t - KIN_TITLE; ctx.save(); ctx.globalAlpha = 1 - easeK((t - 10.1) / .5); ctx.translate(0, -easeK((t - 10.1) / .6) * 150);
          ctx.font = '900 104px "Comic Sans MS", "Chalkboard SE", "Trebuchet MS", cursive'; ctx.textAlign = 'center'; ctx.lineJoin = 'round'; ctx.lineWidth = 12; ctx.strokeStyle = '#000';
          const word = 'KAIZO', widths = [...word].map(c => ctx.measureText(c).width), total = widths.reduce((m, x) => m + x, 0);
          let x = W / 2 - total / 2;
          [...word].forEach((c, i) => {
            const u = Math.max(0, Math.min(1, (a - i * .09) / .55)), drop = u <= 0 ? -400 : (1 - u) * (1 - u) * -300 - Math.abs(Math.sin(u * Math.PI * 3)) * (1 - u) * 70;
            ctx.save(); ctx.translate(x + widths[i] / 2, H / 2 + 40 + drop); ctx.rotate(Math.sin(a * 5 + i) * .07 * (1 - Math.min(1, a / 2))); ctx.strokeText(c, 0, 0); ctx.fillStyle = 'hsl(' + ((i * 60 + a * 160) % 360) + ',90%,58%)'; ctx.fillText(c, 0, 0); ctx.restore(); x += widths[i];
          });
          ctx.restore();
        }
      }
      // the three of them arrive where they stand in the fight, as stupidly as possible
      if (t > 8.3 && k.hold <= 0) {
        const base = FLOOR - 23, keepX = P.cx, keepY = P.cy;
        // Looey is fired in from the left, spins three times, lands, hops, gets bowled into
        const lu = Math.max(0, Math.min(1, (t - 8.4) / .9));
        let lx = -60 + (450 + 60) * lu, ly = base - 300 * Math.sin(lu * Math.PI), lrot = (1 - lu) * 6.283 * 3, lsq = 0;
        if (t > 9.3) { const d = t - 9.3; lsq = .28 * Math.exp(-d * 12) * Math.cos(d * 30); ly = base - 46 * Math.abs(Math.sin(d * 8)) * Math.exp(-d * 3.2); lrot = 0; }
        if (t > 9.75) lrot = Math.sin((t - 9.75) * 22) * .22 * Math.exp(-(t - 9.75) * 5);
        // wheatley rolls in along the floor from the right, hits looey, bounces up to his shoulder
        const wu = (t - 9.0) / .8, hu = Math.max(0, Math.min(1, (t - 9.75) / .55));
        let wx, wy, wrot, wvis = t > 9.0;
        if (t < 9.75) { const e = 1 - Math.pow(1 - Math.max(0, Math.min(1, wu)), 2); wx = W + 80 - (W + 80 - 515) * e; wy = FLOOR - 26; wrot = -wx / 22; }
        else { const e = 1 - Math.pow(1 - hu, 3); wx = 515 + (450 - 34 - 515) * e; wy = (FLOOR - 26) + ((base - 46 - 4 - 14) - (FLOOR - 26)) * e - Math.sin(hu * Math.PI) * 70; wrot = (1 - hu) * 6.283 * 2 - 515 / 22; }
        // she swings in like a wrecking ball
        const pend = t > 8.8 ? .7 * Math.exp(-(t - 8.8) * 1.5) * Math.cos((t - 8.8) * 5.5) : 0;
        if (t > 8.8 && t < 9.3 && k.f.pdone !== 1) { k.f.pdone = 1; snd('clank-b', .5, { max: 400 }); meme('swoosh.ogg', .5, .6, 700); }
        if (t > 8.4 && !k.f.landA) { k.f.landA = 1; meme('swoosh.ogg', .6, 1.5, 600); meme('Cheering.ogg', .3, 1.9, 900); }
        if (t > 9.3 && !k.f.landB) { k.f.landB = 1; meme('vine.ogg', .6, .8, 900); snd('clank-b', .5, { max: 300 }); shake = 12; spark(450, FLOOR - 4, 14, '#ffffff', 220); }
        if (t > 9.75 && !k.f.landC) { k.f.landC = 1; meme('pebble-bark.mp3', .4, 1.4, 500); meme('snap.ogg', .5, .8, 300); shake = 8; }
        if (t > 10.35 && !k.f.landD) { k.f.landD = 1; meme('button.ogg', .4, 1.4, 300); }
        // looey, drawn the way the fight draws him
        P.cx = lx; P.cy = ly;
        if (t >= 8.4) { ctx.save(); const fx = lx, fy = ly + P.h / 2; ctx.translate(fx, fy); ctx.rotate(lrot); ctx.scale(1 + lsq, 1 - lsq); ctx.translate(-fx, -fy); drawLooey(); ctx.restore(); }
        P.cx = keepX; P.cy = keepY;
        if (wvis) spr(ctx, 'wheatley', wx, wy, { s: .42, rot: wrot });
        // a line each, then the fight
        if (t > 10.35) {
          const bub = (x, y, txt) => { ctx.save(); ctx.font = '700 13px sans-serif'; const w = ctx.measureText(txt).width + 22, u = easeK((t - 10.35) / .15); ctx.translate(x, y); ctx.scale(u, u); ctx.fillStyle = '#fff'; ctx.strokeStyle = '#000'; ctx.lineWidth = 2; ctx.beginPath(); ctx.rect(-w / 2, -30, w, 28); ctx.fill(); ctx.stroke(); ctx.beginPath(); ctx.moveTo(-6, -2); ctx.lineTo(0, 10); ctx.lineTo(6, -2); ctx.fill(); ctx.fillStyle = '#000'; ctx.textAlign = 'center'; ctx.fillText(txt, 0, -11); ctx.restore(); };
          bub(450 - 34, base - 96, 'Is it over? Is it over?'); bub(450 + 40, base - 40, 'Boing.');
        }
        // the pendulum is applied to her below
        k.pend = pend;
      } else k.pend = 0;
      // the cameo and the other gags
      if (k.hold > 0) {
        const m = k.m, seg = k.seg, hh = heroImg.complete && heroImg.naturalWidth ? heroImg.naturalHeight : 1, hw = heroImg.naturalWidth || 1;
        const looey = (x, y, h, rot) => { if (!(heroImg.complete && heroImg.naturalWidth)) return; const wv = h * hw / hh; ctx.save(); ctx.translate(x, y); ctx.rotate(rot || 0); ctx.drawImage(heroImg, -wv / 2, -h, wv, h); ctx.restore(); };
        const still = (img, cx, cy, w, scale, title, pressed) => {
          if (!img.complete || !img.naturalWidth || scale < .02) return;
          const ih = w * img.naturalHeight / img.naturalWidth, fw = w + 12, fh = ih + 26 + 12 + (pressed != null ? 40 : 0);
          ctx.save(); ctx.translate(cx, cy); ctx.scale(scale, scale);
          const c = winFrame(-fw / 2, -fh / 2, fw, fh, title, pressed != null);
          ctx.drawImage(img, c.x, c.y, c.w, ih);
          if (pressed != null) { ctx.fillStyle = pressed ? '#9a9ea2' : '#c3c7cb'; ctx.fillRect(-28, c.y + ih + 8, 56, 22); ctx.strokeStyle = '#000'; ctx.lineWidth = 1; ctx.strokeRect(-27.5, c.y + ih + 8.5, 55, 21); ctx.fillStyle = '#000'; ctx.font = '12px sans-serif'; ctx.textAlign = 'center'; ctx.fillText('OK', 0, c.y + ih + 23); }
          ctx.restore();
        };
        if (seg === 'P') {
          ctx.fillStyle = 'rgba(0,0,0,.25)'; ctx.fillRect(0, 0, W, H);
          spr(ctx, 'wheatley', -60 + easeK(m / 2) * (W + 120), H / 2 + 38 + Math.sin(m * 18) * 6, { s: .6, rot: m * 9 });
          const est = ['3 days', '2 days', '41 minutes', '-4 minutes', 'yes'][Math.min(4, Math.floor(m / .5))];
          winBox(W - 270, H - 130, 250, 90, 'Time remaining', 'About ' + est);
        } else if (seg === 'A') {
          ctx.fillStyle = 'rgba(0,0,0,.35)'; ctx.fillRect(0, 0, W, H);
          const u = easeK(m / .2), out = m > 2.2 ? easeK((m - 2.2) / .25) : 0;
          still(camImgs[0], W * .62, H * .48 + Math.sin(m * 3) * 3, 340, (.2 + .8 * u) * (1 - out), 'Error', m > 1.9 && m < 2.2 ? 1 : 0);
        } else if (seg === 'C') {
          ctx.fillStyle = 'rgba(8,10,16,.82)'; ctx.fillRect(0, 0, W, H);
          ctx.save(); ctx.fillStyle = '#ff8a1f'; ctx.beginPath(); ctx.moveTo(0, H * .72); ctx.lineTo(W, H * .5); ctx.lineTo(W, H * .56); ctx.lineTo(0, H * .78); ctx.fill(); ctx.restore();
          const u = easeK(m / .45), lx = -220 + (190 + 220) * u, rx = W + 220 - (W - 590 + 220) * u;
          looey(lx, H - 40, 250, Math.sin(m * 6) * .03);
          ctx.save(); ctx.translate(rx, 20); ctx.rotate(Math.sin(m * 5) * .02); bodyAt(0, 0); ctx.restore();
          if (m > .5) { const v = easeK((m - .5) / .25), sc = 3.4 - 2.4 * v + Math.max(0, Math.sin((m - .75) * 18)) * .06; ctx.save(); ctx.translate(W / 2, H * .46); ctx.scale(sc, sc); ctx.font = '900 110px "Comic Sans MS", "Trebuchet MS", cursive'; ctx.textAlign = 'center'; ctx.lineWidth = 12; ctx.strokeStyle = '#000'; ctx.lineJoin = 'round'; ctx.strokeText('VS', 0, 0); ctx.fillStyle = '#ffd23a'; ctx.fillText('VS', 0, 0); ctx.restore(); }
          ctx.font = '800 15px monospace'; ctx.textAlign = 'center'; ctx.fillStyle = '#9dff3a';
          const rows = ['LOOEY       HP: yes    ATTACK: yes        DEFENSE: no', 'GLaDOS      HP: yes    ATTACK: more yes   DEFENSE: also no', 'WHEATLEY    HP: ???    ATTACK: sorry      DEFENSE: hiding'];
          rows.forEach((r, i) => { if (m > 1.2 + i * .45) ctx.fillText(r.slice(0, Math.floor((m - 1.2 - i * .45) * 60)), W / 2, H - 70 + i * 22); });
        } else if (seg === 'D') {
          // a conga line across the stage, rainbow underfoot
          ctx.fillStyle = 'rgba(0,0,0,.35)'; ctx.fillRect(0, 0, W, H);
          for (let i = -1; i < 5; i++) spr3(ctx, 'rainbow', ((i * 180 + m * 160) % (5 * 180)) - 90, FLOOR + 22, { ax: 0, s: .6, alpha: .9 });
          const line = [['wheat', 0], ['core0', 1], ['core1', 2], ['looey', 3], ['core2', 4], ['core3', 5], ['wheat', 6]];
          line.forEach(([kind, i]) => {
            const x = -80 + (m * 190 - i * 70), y = FLOOR - 24 - Math.abs(Math.sin(m * 9 + i)) * 18; if (x < -120 || x > W + 120) return;
            if (kind === 'wheat') spr(ctx, 'wheatley', x, y - 24, { s: .5, rot: Math.sin(m * 10 + i) * .2 });
            else if (kind === 'looey') looey(x, y + 26, 100, Math.sin(m * 9) * .1);
            else spr(ctx, 'eye-' + kind.slice(4) + '-0', x, y - 6, { s: 1.2, rot: m * 8 + i, flip: false });
          });
        } else if (seg === 'E') {
          // looey, and bottles falling onto his head one at a time until the stack gives out
          ctx.fillStyle = 'rgba(0,0,0,.35)'; ctx.fillRect(0, 0, W, H);
          const fall = m > 2.6, tt = Math.max(0, m - 2.6), cx = W / 2, base = FLOOR - 20, sway = Math.sin(m * 7) * Math.min(9, Math.floor((m - .35) / .22) + 1) * 2.2;
          if (!fall) { looey(cx + sway * .4, base, 190, sway * .004); for (let i = 0; i < 9; i++) { const t0 = .35 + i * .22; if (m < t0) continue; const target = base - 196 - i * 38, f = Math.min(1, (m - t0) / .18), yy = -40 + (target + 40) * f * f; spr3(ctx, 'oil', cx + sway * (1 + i * .22) * .6 + Math.sin(i * 2) * 4, yy, { s: .5, rot: f < 1 ? f * 3 : Math.sin(m * 7 + i) * .1 * (1 + i * .15) }); } }
          else { const sq = Math.max(0, 1 - tt * 2.2); looey(cx, base, 190 * (1 - .25 * sq), 0); for (let i = 0; i < 9; i++) { const vx = (i - 4) * 70, y = Math.min(base - 8, base - 196 - i * 38 + 450 * tt * tt); spr3(ctx, 'oil-side', cx + vx * Math.min(1, tt * 1.6), Math.min(base - 10, y), { s: .5, rot: tt * 5 + i }); } }
        } else {
          // the second cameo (a still in a viewer), then wheatley on a rainbow, then a boom
          ctx.fillStyle = 'rgba(0,0,0,.25)'; ctx.fillRect(0, 0, W, H);
          if (m < 1.5) { const u = easeK(m / .3), out = easeK((m - 1.1) / .4); still(camImgs[1], W / 2 + (1 - u) * -500 + out * 900 + Math.sin(m * 40) * (m < .5 ? 8 : 2), H / 2 + 10, 480, 1, 'Image Viewer', null); }
          if (m > 1.5 && m < 3.2) {
            const u = (m - 1.5) / 1.3, rx = W + 240 - u * (W + 560), ry = H * .3 + Math.sin(u * 9) * 14;
            spr3(ctx, 'rainbow', rx + 20, ry, { ax: 0, s: 2.6, alpha: .9 }); spr(ctx, 'wheatley', rx, ry, { s: .8, rot: -m * 14 });
          }
          if (m > 2.7) { const fr = Math.min(11, 1 + Math.floor((m - 2.7) / .6 * 11)); spr3(ctx, 'boom-' + fr, W / 2, H * .4, { s: 2.4 }); }
        }
      }
      // the title: lamp oil raining
      if (t > KIN_TITLE && k.hold <= 0) k.oils.forEach(o => spr3(ctx, 'oil', o.x, o.y, { rot: o.rot, s: Math.max(.001, .5 * (1 - easeK((t - 10) / .6))) }));
      if (k.flash > 0) { ctx.fillStyle = 'rgba(255,255,255,' + Math.min(1, k.flash) + ')'; ctx.fillRect(0, 0, W, H); }
      parts.forEach(q => { ctx.globalAlpha = Math.max(0, q.life / q.max); ctx.fillStyle = q.col; ctx.fillRect(q.x, q.y, q.size, q.size); ctx.globalAlpha = 1; });
      ctx.restore();
      if (k.t > 1.5 && k.s < KIN_TITLE) { ctx.save(); ctx.font = '700 11px sans-serif'; ctx.textAlign = 'right'; ctx.fillStyle = 'rgba(255,255,255,.45)'; ctx.fillText('tap to skip', W - 12, H - 10); ctx.restore(); }
    }
    canvas.addEventListener('pointerdown', () => { if (kin && kin.t > .8 && kin.s < KIN_TITLE) { kin.s = KIN_TITLE; kin.hold = 0; HOLDS.forEach(h => { kin.f['seg' + h[0]] = 1; }); } });
    function launchRocket(angle) {
      const sx = INC.x, sy = FLOOR - 30;
      rockets.push({ cx: sx, cy: sy, w: 14, h: 8, vx: Math.cos(angle) * 130, vy: Math.sin(angle) * 130, ang: angle, age: 0, portalCd: .2, through: 0, trail: [] });
      snd('shoot-b', .35, { max: 700 });
    }
    function hitBody(r) {
      stats.combo++; stats.redirects++; stats.best = Math.max(stats.best, stats.combo); comboT = 14;
      const dmg = D.hit * (1 + .1 * Math.min(stats.combo - 1, 4)); if (G.mode === 'turret') G.dmg += dmg; G.f = 1; G.flash = .6; shake = Math.max(shake, 14); hitstop = .09; slow = .3;
      if (kaizo) { meme(Math.random() < .5 ? 'Cheering.ogg' : 'snap.ogg', .4, .6 + Math.random() * 1.6, 900); if (stats.combo >= 3 && stats.combo % 3 === 0) { vscale(); ssay('short', { pitch: 1 }); } else vsay('short', { pitch: 1.5 + Math.random() * .7 }); }
      const heal = D.hp * .04; P.hp = Math.min(D.hp, P.hp + heal);
      floats.push({ x: r.cx, y: r.cy - 20, txt: '-' + Math.round(dmg), col: '#ffffff', t: 0, big: 1 });
      floats.push({ x: P.cx, y: P.cy - 54, txt: stats.combo > 1 ? 'REDIRECT x' + stats.combo : 'REDIRECT', col: '#ffb36b', t: 0 });
      floats.push({ x: P.cx, y: P.cy - 34, txt: '+' + Math.round(heal), col: '#9dff3a', t: 0 });
      boom(r.cx, r.cy, 1.1); spark(r.cx, r.cy, 18, '#ffffff', 220); snd('hit', .5, { max: 400 }); cue('hit_heavy', .5);
      if (G.mode === 'turret' && G.dmg >= Tstage()) {
        const next = G.stage + 1; G.dmg = 0; G.stunned = 3;
        if (next <= 3) { detachCore(next); G.stage = next; }
      }
    }

    /* ---- finale: she goes down (the last core is burnt) */
    function beginFinale() {
      finale = { t: 0, loops: 0, gy: 0, gvy: 0, gr: 0, portals: false, closed: false, slam: false, white: 0, dark: 0, ghosts: [] };
      rockets.length = 0; bolts.length = 0; portals.blue = portals.orange = null; sub.classList.remove('on');
      hitstop = .18; snd('boomboomboom', .6, { max: 2500 }); cue('down', .6); playMusic('apCalm');
      setTimeout(() => { if (root.isConnected) snd('cake-0', .85, { full: 1, voice: 1 }); }, 1000);   // the line she says when she goes down
    }
    const FL = FLOOR - CEIL;
    function rankOf() { const k = P.hp / D.hp; return stats.hits <= 2 ? 'S' : k >= .7 ? 'A' : k >= .4 ? 'B' : 'C'; }
    function rankCard() {
      const rk = rankOf(), m = Math.floor(stats.t / 60), sec = String(Math.floor(stats.t % 60)).padStart(2, '0');
      const card = el('div', 'ap-rank');
      card.innerHTML = '<small>TEST COMPLETE</small><b class="r' + rk + '">' + rk + '</b><ul><li><span>Time</span>' + m + ':' + sec + '</li><li><span>Hits taken</span>' + stats.hits + '</li><li><span>Best combo</span>x' + stats.best + '</li><li><span>Redirects</span>' + stats.redirects + '</li></ul><button type="button">Continue</button>';
      root.appendChild(card); snd('open', .4, { max: 700 });
      let gone = false; const go = () => { if (gone) return; gone = true; root.classList.add('out'); setTimeout(() => { root.remove(); onEnd(true, { rank: rk, time: stats.t, hits: stats.hits, combo: stats.best }); }, 500); };
      $('button', card).onclick = go; setTimeout(go, 12000);
    }
    function finaleUpdate(dt) {
      const f = finale; f.t += dt; const t = f.t;
      timeScale = t < .3 ? .05 : t < 1.9 ? .28 : t < 3.4 ? .6 : 1;
      if (t > 1.6 && !f.s2) { f.s2 = true; snd('glass-break', .6, { max: 1000 }); snd('clank-a', .5, { max: 600 }); spark(BX, CEIL, 40, '#ffb347', 320); shake = 16; }
      if (t > 1.6) f.gr = Math.min(.5, (t - 1.6) * .4);
      if (t > 3.1 && !f.portals && !f.closed) {
        f.portals = true; portals.orange = { x: BX, y: CEIL, nx: 0, ny: 1, color: 'orange', t: 0 }; portals.blue = { x: BX, y: FLOOR, nx: 0, ny: -1, color: 'blue', t: 0 };
        snd('open', .5, { max: 700 }); spark(BX, CEIL, 20, '#ff9a2e', 200); spark(BX, FLOOR, 20, '#4aa8ff', 200);
        say('f1', 'She is falling forever.', 2600);
      }
      if (f.portals) {
        f.gvy = Math.min(1900, f.gvy + (600 + f.loops * 320) * dt); f.gy += f.gvy * dt;
        if (f.gy > FL) { f.gy -= FL; f.loops++; shake = Math.max(shake, 10 + f.loops * 4); snd(f.loops % 2 ? 'boom-a' : 'boom-b', .4, { max: 800 }); }
        f.ghosts.push({ y: f.gy, t: .25 }); if (f.ghosts.length > 9) f.ghosts.shift();
      }
      f.ghosts.forEach(g => g.t -= dt);
      if (t > 7.6 && f.portals) { f.portals = false; f.closed = true; portals.blue = portals.orange = null; snd('open', .5, { max: 600, rate: .6 }); spark(BX, FLOOR, 30, '#4aa8ff', 260); spark(BX, CEIL, 30, '#ff9a2e', 260); say('f2', 'Landing.', 1600); }
      if (f.closed && !f.slam) { f.gvy = Math.min(1900, f.gvy + 1600 * dt); f.gy += f.gvy * dt; if (f.gy >= FL - 252 || t > 9.2) { f.gy = FL - 252; f.slam = true; slam(); } }
      if (t > 10.6 && !f.dark) f.dark = 1;
      f.white = Math.max(0, f.white - dt * 1.4);
      if (t > 10.2 && !f.s3) { f.s3 = true; say('f3', 'Is she off?', 2200); }
      if (t > 12.6 && !f.done) { f.done = true; cleanup(); rankCard(); }
      for (let i = parts.length - 1; i >= 0; i--) { const q = parts[i]; q.life -= dt; q.vy += 520 * dt; q.x += q.vx * dt; q.y += q.vy * dt; if (q.life <= 0) parts.splice(i, 1); }
      for (let i = booms.length - 1; i >= 0; i--) { booms[i].t += dt; if (booms[i].t > .45) booms.splice(i, 1); }
      shake = Math.max(0, shake - 20 * dt);
      P.vx = 0;
      if (t > 2.4 && t < 3.2) { P.cx = Math.min(520, P.cx + 280 * dt); P.face = 1; P.cy = FLOOR - 23 - Math.sin((t - 2.4) / .8 * Math.PI) * 64; } else if (t >= 3.2) P.cy = FLOOR - 23;
    }
    function slam() {
      finale.white = 1; shake = 34; snd('boomboomboom', .8, { max: 2600 });
      boom(BX, FLOOR - 40, 2.4);
      for (let i = 0; i < 5; i++) setTimeout(() => { if (root.isConnected) boom(BX - 80 + Math.random() * 160, FLOOR - 30, 1.2); }, i * 140);
      spark(BX, FLOOR - 20, 90, '#ffd9a0', 520);
    }

    /* ---- draw */
    const eyeLook = y => { const dy = P.cy - y; return dy < -60 ? 9 : dy > 60 ? 1 : 0; };
    const eye = (c, x, y, k) => spr(ctx, 'eye-' + CORES[c].eye + '-' + eyeLook(y), x, y, { s: k, flip: P.cx < x });
    const stage = (() => {
      const cv = document.createElement('canvas'); cv.width = W; cv.height = H; const g = cv.getContext('2d');
      let seed = 7; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
      g.fillStyle = '#0b0d10'; g.fillRect(0, 0, W, H);
      // wall: light panels, each a little different, seams shaded
      for (let x = LW; x < RW; x += 64) for (let y = CEIL; y < FLOOR; y += 48) {
        const v = 168 + Math.floor(rnd() * 22);
        const gr = g.createLinearGradient(0, y, 0, y + 48); gr.addColorStop(0, 'rgb(' + (v + 8) + ',' + (v + 11) + ',' + (v + 14) + ')'); gr.addColorStop(1, 'rgb(' + (v - 8) + ',' + (v - 5) + ',' + (v - 2) + ')');
        g.fillStyle = gr; g.fillRect(x, y, 64, 48);
        g.fillStyle = 'rgba(0,0,0,.28)'; g.fillRect(x, y, 64, 1); g.fillRect(x, y, 1, 48);
        g.fillStyle = 'rgba(255,255,255,.25)'; g.fillRect(x + 1, y + 1, 62, 1);
        if (rnd() < .12) { g.fillStyle = 'rgba(40,46,52,.16)'; g.fillRect(x + 1, y + 1, 62, 46); }
      }
      // light falloff: bright under the ceiling, dark toward the floor and corners
      let gr = g.createLinearGradient(0, CEIL, 0, FLOOR); gr.addColorStop(0, 'rgba(255,255,255,.14)'); gr.addColorStop(.55, 'rgba(0,0,0,0)'); gr.addColorStop(1, 'rgba(10,14,18,.5)');
      g.fillStyle = gr; g.fillRect(LW, CEIL, RW - LW, FLOOR - CEIL);
      gr = g.createRadialGradient(W / 2, 200, 120, W / 2, 200, 520); gr.addColorStop(0, 'rgba(0,0,0,0)'); gr.addColorStop(1, 'rgba(6,9,12,.55)');
      g.fillStyle = gr; g.fillRect(LW, CEIL, RW - LW, FLOOR - CEIL);
      // observation glass on the left wall
      g.fillStyle = '#10161c'; g.fillRect(96, 84, 168, 82); g.fillStyle = '#1b2a36'; g.fillRect(100, 88, 160, 74);
      gr = g.createLinearGradient(100, 88, 260, 162); gr.addColorStop(0, 'rgba(160,210,255,.28)'); gr.addColorStop(.5, 'rgba(160,210,255,.04)'); gr.addColorStop(1, 'rgba(160,210,255,.12)'); g.fillStyle = gr; g.fillRect(100, 88, 160, 74);
      g.fillStyle = 'rgba(255,255,255,.12)'; g.beginPath(); g.moveTo(130, 88); g.lineTo(158, 88); g.lineTo(122, 162); g.lineTo(100, 162); g.closePath(); g.fill();
      g.fillStyle = '#10161c'; g.fillRect(96, 166, 168, 5);
      // green tubing, stapled down the wall
      const tube = [[LW, 300], [110, 300], [110, 214], [330, 214], [330, 120], [470, 120], [470, CEIL + 4]];
      g.lineJoin = 'round'; g.lineCap = 'round';
      g.strokeStyle = '#0c1a10'; g.lineWidth = 12; g.beginPath(); tube.forEach((p, i) => i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1])); g.stroke();
      g.strokeStyle = '#2f7a42'; g.lineWidth = 9; g.beginPath(); tube.forEach((p, i) => i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1])); g.stroke();
      g.strokeStyle = 'rgba(190,255,200,.35)'; g.lineWidth = 2; g.beginPath(); tube.forEach((p, i) => i ? g.lineTo(p[0] - 2, p[1] - 2) : g.moveTo(p[0] - 2, p[1] - 2)); g.stroke();
      g.fillStyle = '#c8ccd0';
      for (let i = 1; i < tube.length; i++) { const a = tube[i - 1], b = tube[i], n = Math.floor(Math.hypot(b[0] - a[0], b[1] - a[1]) / 46); for (let k = 1; k <= n; k++) { const t = k / (n + 1), x = a[0] + (b[0] - a[0]) * t, y = a[1] + (b[1] - a[1]) * t; if (a[0] === b[0]) g.fillRect(x - 7, y - 1, 14, 3); else g.fillRect(x - 1, y - 7, 3, 14); } }
      // ceiling: pale panels with recessed light strips
      for (let x = LW; x < RW; x += 64) { const v = 205 + Math.floor(rnd() * 14); g.fillStyle = 'rgb(' + v + ',' + (v + 3) + ',' + (v + 6) + ')'; g.fillRect(x, 0, 64, CEIL); g.fillStyle = 'rgba(0,0,0,.25)'; g.fillRect(x, 0, 1, CEIL); }
      g.fillStyle = 'rgba(0,0,0,.4)'; g.fillRect(LW, CEIL - 2, RW - LW, 2);
      [[300, 150], [470, 110]].forEach(l => { g.fillStyle = '#2a3036'; g.fillRect(l[0] - 2, 8, l[1] + 4, 14); g.fillStyle = '#fffbe8'; g.fillRect(l[0], 10, l[1], 10);
        const lg = g.createLinearGradient(0, CEIL, 0, CEIL + 110); lg.addColorStop(0, 'rgba(255,250,225,.30)'); lg.addColorStop(1, 'rgba(255,250,225,0)'); g.fillStyle = lg; g.beginPath(); g.moveTo(l[0], CEIL); g.lineTo(l[0] + l[1], CEIL); g.lineTo(l[0] + l[1] + 46, CEIL + 110); g.lineTo(l[0] - 46, CEIL + 110); g.closePath(); g.fill(); });
      // side walls: dark, grooved
      g.fillStyle = '#14181c'; g.fillRect(0, 0, LW, H); g.fillRect(RW, 0, W - RW, H);
      g.fillStyle = '#242a30'; for (let y = 0; y < H; y += 30) { g.fillRect(0, y, LW, 2); g.fillRect(RW, y, W - RW, 2); }
      g.fillStyle = '#05070a'; g.fillRect(LW - 2, 0, 2, H); g.fillRect(RW, 0, 2, H);
      // floor: dark plating, lit lip, rivets
      gr = g.createLinearGradient(0, FLOOR, 0, H); gr.addColorStop(0, '#4a525a'); gr.addColorStop(.12, '#333a41'); gr.addColorStop(1, '#171b1f');
      g.fillStyle = gr; g.fillRect(0, FLOOR, W, H - FLOOR);
      g.fillStyle = '#6a737b'; g.fillRect(LW, FLOOR - 3, RW - LW, 3); g.fillStyle = 'rgba(255,255,255,.35)'; g.fillRect(LW, FLOOR - 3, RW - LW, 1);
      for (let x = 0; x < W; x += 64) { g.fillStyle = 'rgba(0,0,0,.45)'; g.fillRect(x, FLOOR, 2, H - FLOOR); g.fillStyle = '#8a939b'; g.fillRect(x + 6, FLOOR + 8, 3, 3); g.fillRect(x + 54, FLOOR + 8, 3, 3); }
      g.fillStyle = 'rgba(0,0,0,.4)'; g.fillRect(0, FLOOR + 34, W, 2);
      // contact shadow where the wall meets the floor
      gr = g.createLinearGradient(0, FLOOR - 36, 0, FLOOR); gr.addColorStop(0, 'rgba(0,0,0,0)'); gr.addColorStop(1, 'rgba(0,0,0,.35)'); g.fillStyle = gr; g.fillRect(LW, FLOOR - 36, RW - LW, 36);
      return cv;
    })();
    function drawBackground() {
      ctx.drawImage(stage, 0, 0);
      // the incinerator pit: hazard lip, grate when shut, fire when open
      const open = G.incOpen > 0, x0 = INC.x - INC.half, w = INC.half * 2;
      ctx.fillStyle = '#0a0c0e'; ctx.fillRect(x0, FLOOR - 3, w, 22);
      if (open) {
        const gl = ctx.createLinearGradient(0, FLOOR - 70, 0, FLOOR); gl.addColorStop(0, 'rgba(255,120,20,0)'); gl.addColorStop(1, 'rgba(255,150,40,.75)'); ctx.fillStyle = gl; ctx.fillRect(x0, FLOOR - 70, w, 70);
        const f = .6 + .4 * Math.sin(time * 18); ctx.fillStyle = 'rgba(255,200,90,' + (.55 * f) + ')'; ctx.fillRect(x0 + 6, FLOOR - 3, w - 12, 4);
      } else { ctx.fillStyle = '#59636c'; for (let i = 0; i < 6; i++) ctx.fillRect(x0 + 6 + i * 12, FLOOR - 3, 5, 14); }
      ctx.save(); ctx.beginPath(); ctx.rect(x0 - 6, FLOOR - 4, w + 12, 7); ctx.clip();
      ctx.fillStyle = '#f0b400'; ctx.fillRect(x0 - 6, FLOOR - 4, w + 12, 7); ctx.fillStyle = '#16181a'; for (let i = -2; i < 14; i++) { ctx.beginPath(); ctx.moveTo(x0 - 6 + i * 12, FLOOR + 3); ctx.lineTo(x0 - 6 + i * 12 + 6, FLOOR + 3); ctx.lineTo(x0 - 6 + i * 12 + 12, FLOOR - 4); ctx.lineTo(x0 - 6 + i * 12 + 6, FLOOR - 4); ctx.fill(); }
      ctx.restore();
    }
    function drawLooey() {
      const h = 62;
      ctx.save(); ctx.translate(P.cx, P.cy + P.h / 2); if (P.hurt > 0 && Math.floor(time * 20) % 2) ctx.globalAlpha = .45;
      const bob = P.ground && Math.abs(P.vx) > 10 ? Math.abs(Math.sin(P.run)) * 4 : 0;
      ctx.scale(P.face * heroFace, 1);
      if (heroImg.complete && heroImg.naturalWidth) { const k = h / heroImg.naturalHeight; ctx.drawImage(heroImg, -heroImg.naturalWidth * k / 2, -h - bob, heroImg.naturalWidth * k, h); }
      else { ctx.fillStyle = '#e6c84a'; ctx.fillRect(-28, -h, 56, h); }
      ctx.restore();
      const a = P.bonk > 0 ? (P.face > 0 ? -.8 + (1 - P.bonk / .18) * 1.6 : Math.PI + .8 - (1 - P.bonk / .18) * 1.6) : Math.atan2(aim.y - (P.cy - 8), aim.x - P.cx);
      ctx.save(); ctx.translate(P.cx + Math.cos(a) * 10, P.cy - 4 + Math.sin(a) * 10); ctx.rotate(a);
      ctx.fillStyle = '#d8dde2'; ctx.fillRect(0, -3, 22, 6); ctx.fillStyle = '#4aa8ff'; ctx.fillRect(16, -3, 3, 3); ctx.fillStyle = '#ff9a2e'; ctx.fillRect(16, 0, 3, 3); ctx.restore();
    }
    function drawPortal(p) {
      if (!p) return;
      const open = Math.min(1, p.t / .15);
      ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.nx ? (p.nx > 0 ? 0 : Math.PI) : (p.ny > 0 ? Math.PI / 2 : -Math.PI / 2)); ctx.scale(open, open);
      spr(ctx, 'portal-' + p.color, 0, 0, { s: .85 }); ctx.restore();
    }
    const whites = {};
    function whiteBody(fr) {
      if (whites[fr]) return whites[fr];
      const w = Math.ceil(139 * GS) + 8, h = Math.ceil(315 * GS) + 8, sil = document.createElement('canvas'); sil.width = w; sil.height = h;
      const g = sil.getContext('2d'); g.imageSmoothingEnabled = false; spr(g, 'glados-' + fr, w / 2, 4, { ax: .5, ay: 0, s: GS, flip: true });
      const edge = document.createElement('canvas'); edge.width = w; edge.height = h; const e = edge.getContext('2d');
      g.globalCompositeOperation = 'source-atop'; g.fillStyle = '#fff'; g.fillRect(0, 0, w, h);
      const dk = document.createElement('canvas'); dk.width = w; dk.height = h; const d = dk.getContext('2d'); d.drawImage(sil, 0, 0); d.globalCompositeOperation = 'source-in'; d.fillStyle = '#0b0d10'; d.fillRect(0, 0, w, h);
      [[-2, 0], [2, 0], [0, -2], [0, 2], [-2, -2], [2, 2]].forEach(o => e.drawImage(dk, o[0], o[1])); e.drawImage(sil, 0, 0);
      return (whites[fr] = edge);
    }
    const bodyAt = (dx, dy, alpha) => {
      if (alpha != null) ctx.globalAlpha = alpha;
      if (kaizo) { const c = whiteBody(G.frame); ctx.drawImage(c, dx - c.width / 2, dy - 4); } else spr(ctx, 'glados-' + G.frame, dx, dy, { ax: .5, ay: 0, s: GS, flip: true });
    };
    function glados(y, rot, ghost, dark, clip) {
      ctx.save();
      if (clip) { ctx.beginPath(); ctx.rect(clip.x, clip.y, clip.w, clip.h); ctx.clip(); }
      if (ghost) { ctx.globalAlpha = Math.max(0, ghost) * 1.2; ctx.globalCompositeOperation = 'lighter'; }
      ctx.translate(BX + (G.flash > 0 && !finale ? Math.sin(time * 80) * 3 : 0), CEIL + y); if (rot) ctx.rotate(rot);
      if (kaizo && G.gl > 0 && !finale) {
        for (let y = 0; y < 315 * GS; y += 12) { ctx.save(); ctx.beginPath(); ctx.rect(-90, y, 180, 12); ctx.clip(); ctx.translate(Math.random() < .5 ? (Math.random() - .5) * 34 : 0, 0); bodyAt(0, 0); ctx.restore(); }
        ctx.save(); ctx.globalAlpha = .45; ctx.globalCompositeOperation = 'lighter'; try { ctx.filter = 'hue-rotate(' + Math.floor(Math.random() * 360) + 'deg) saturate(4)'; } catch (_) { /* no filter */ } bodyAt((Math.random() - .5) * 18, (Math.random() - .5) * 8); ctx.restore();
      } else bodyAt(0, 0);
      if (kaizo && !finale) {
        const cr = corrupt();
        ctx.save();
        ctx.globalAlpha = .12 + .4 * cr; spr2(ctx, 'swirl', 8, 110, { s: 1.1 + .6 * cr, rot: time * (.9 + cr * 2) });
        ctx.restore();
        ctx.save(); ctx.globalAlpha = .25 + .6 * cr;
        spr2(ctx, 'dark', -30 + Math.sin(time * 1.3) * 22, 150 + Math.cos(time * 1.7) * 30, { s: .6 + .4 * cr, rot: Math.sin(time * 2) * .3 });
        if (cr > .4) spr2(ctx, 'dark2', 26 + Math.cos(time * 1.1) * 20, 60 + Math.sin(time * 1.9) * 25, { s: .7 + .4 * cr, rot: Math.cos(time * 2.4) * .4 });
        ctx.restore();
      }
      if (G.flash > 0 && !finale) { ctx.globalAlpha = .45; ctx.globalCompositeOperation = 'lighter'; bodyAt(0, 0); }
      if (dark) { ctx.globalCompositeOperation = 'source-atop'; ctx.fillStyle = 'rgba(0,0,0,.65)'; ctx.fillRect(-80, 0, 160, 330); }
      ctx.restore();
    }
    const rrect = (x, y, w, h, r) => { ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath(); };
    function drawHud() {
      if (stats.combo > 1) { ctx.save(); const k = 1 + .12 * Math.sin(time * 14); ctx.font = '900 ' + Math.round(22 * k) + 'px sans-serif'; ctx.textAlign = 'left'; ctx.lineWidth = 5; ctx.strokeStyle = 'rgba(0,0,0,.8)'; ctx.strokeText('COMBO x' + stats.combo, 18, 118); ctx.fillStyle = '#ffb36b'; ctx.fillText('COMBO x' + stats.combo, 18, 118); ctx.restore(); }
      if (P.dashCd > 0) { ctx.fillStyle = 'rgba(0,0,0,.5)'; ctx.fillRect(12, 94, 56, 5); ctx.fillStyle = '#9ad8ff'; ctx.fillRect(12, 94, 56 * (1 - P.dashCd / .85), 5); }
      const hs = window.innerWidth < 700 ? 1.45 : 1;
      ctx.save(); ctx.scale(hs, hs);
      rrect(12, 10, 256, 80, 8); ctx.fillStyle = 'rgba(12,15,18,.82)'; ctx.fill(); ctx.strokeStyle = 'rgba(255,255,255,.14)'; ctx.lineWidth = 1; ctx.stroke();
      ctx.fillStyle = '#ff8a1f'; ctx.fillRect(12, 10, 4, 80);
      ctx.font = '700 10px sans-serif'; ctx.textBaseline = 'alphabetic'; ctx.textAlign = 'left'; ctx.fillStyle = '#9aa6ae'; ctx.fillText('LOOEY', 28, 26);
      const k = clamp(P.hp / D.hp, 0, 1), low = k < .3;
      rrect(28, 32, 224, 12, 6); ctx.fillStyle = '#05070a'; ctx.fill();
      if (k > 0) { ctx.save(); rrect(28, 32, 224, 12, 6); ctx.clip(); const g = ctx.createLinearGradient(0, 32, 0, 44); g.addColorStop(0, low ? '#ff7a5a' : '#c4ff5a'); g.addColorStop(1, low ? '#c0301c' : '#5fb21e'); ctx.fillStyle = g; ctx.fillRect(28, 32, 224 * k, 12); ctx.fillStyle = 'rgba(255,255,255,.25)'; ctx.fillRect(28, 33, 224 * k, 2); ctx.restore(); }
      ctx.fillStyle = 'rgba(0,0,0,.5)'; for (let i = 1; i < 10; i++) ctx.fillRect(28 + i * 22.4, 32, 1, 12);
      cores.forEach((c, i) => {
        const cx = 42 + i * 52, cy = 67, gone = c.state === 'gone';
        ctx.beginPath(); ctx.arc(cx, cy, 15, 0, 6.283); ctx.fillStyle = '#05070a'; ctx.fill(); ctx.lineWidth = 2; ctx.strokeStyle = gone ? '#3a3f44' : c.state === 'attached' ? '#59636c' : '#ff8a1f'; ctx.stroke();
        ctx.globalAlpha = gone ? .22 : 1; spr(ctx, 'eye-' + CORES[i].eye + '-0', cx, cy, { s: .9 }); ctx.globalAlpha = 1;
        if (gone) { ctx.strokeStyle = '#ff6a3a'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(cx - 9, cy - 9); ctx.lineTo(cx + 9, cy + 9); ctx.moveTo(cx + 9, cy - 9); ctx.lineTo(cx - 9, cy + 9); ctx.stroke(); }
      });
      ctx.restore();
      if (clockOn) {
        ctx.save(); ctx.scale(hs, hs);
        const x = W / hs - 14, y = 10, kk = 1.5, m = Math.floor(clock / 60), sec = Math.floor(clock % 60), d = [m, Math.floor(sec / 10), sec % 10];
        spr(ctx, 'tv-frame', x, y, { ax: 1, ay: 0, s: kk });
        const ox = x - 82 * kk + 29, oy = y + 18, ds = kk * .9;
        spr(ctx, 'digit-' + d[0], ox, oy, { ax: 0, ay: 0, s: ds });
        ctx.fillStyle = '#8cff00'; ctx.fillRect(ox + 21, oy + 8, 5, 5); ctx.fillRect(ox + 21, oy + 21, 5, 5);
        spr(ctx, 'digit-' + d[1], ox + 30, oy, { ax: 0, ay: 0, s: ds });
        spr(ctx, 'digit-' + d[2], ox + 48, oy, { ax: 0, ay: 0, s: ds });
        ctx.restore();
      }
    }
    function beam(x1, y1, x2, y2, w, col, a) {
      ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.lineCap = 'round'; ctx.strokeStyle = col; ctx.shadowColor = col;
      ctx.globalAlpha = (a == null ? 1 : a) * .55; ctx.shadowBlur = w * 5; ctx.lineWidth = w * 2.6; ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
      ctx.globalAlpha = a == null ? 1 : a; ctx.shadowBlur = w * 2; ctx.lineWidth = w; ctx.stroke();
      ctx.shadowBlur = 0; ctx.strokeStyle = '#fff'; ctx.lineWidth = Math.max(1, w * .42); ctx.stroke(); ctx.restore();
    }
    function rayEnd(x, y, a) {
      const dx = Math.cos(a), dy = Math.sin(a); let t = 1e9;
      if (dx > 0) t = Math.min(t, (RW - x) / dx); if (dx < 0) t = Math.min(t, (LW - x) / dx);
      if (dy > 0) t = Math.min(t, (FLOOR - y) / dy); if (dy < 0) t = Math.min(t, (CEIL - y) / dy);
      return { x: x + dx * t, y: y + dy * t };
    }
    function draw() {
      if (kin) { drawKin(); return; }
      const f = finale;
      ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, H);
      ctx.save();
      let zoom = baseZoom, camX = W / 2, camY = H / 2;
      if (!f) {
        const zn = window.innerWidth < 700 ? 1.45 : 1; zoom = zn; camNow.x += (clamp(P.cx + 90, W / 2 / zn, W - W / 2 / zn) - camNow.x) * .12; camNow.y = H / 2 + (zn > 1 ? 30 : 0); camX = camNow.x; camY = camNow.y;
      } else {
        const t = f.t;
        if (t < 1.9) { const k = Math.min(1, t / 1.2); zoom = baseZoom + .7 * k; camX = W / 2 + (BX - W / 2) * k; camY = H / 2 + (190 - H / 2) * k; }
        else if (t < 3.4) { const k = (t - 1.9) / 1.5; zoom = baseZoom + .7 - .6 * k; camX = BX; camY = 190 + 80 * k; }
        else if (t < 9.0) { zoom = Math.min(baseZoom, 1.15) + Math.min(.15, f.loops * .04); camX = BX; camY = H / 2; }
        else { const k = Math.min(1, (t - 9) / 2); zoom = Math.min(baseZoom, 1.3) - .25 * k; camX = BX - 80 * k; camY = 260; }
      }
      camNow.z = zoom; if (f) { camNow.x = camX; camNow.y = camY; }
      const sx = (Math.random() - .5) * shake, sy = (Math.random() - .5) * shake;
      ctx.translate(W / 2 + sx, H / 2 + sy); ctx.scale(zoom, zoom); ctx.translate(-camX, -camY);
      drawBackground();
      if (kaizo && !f) {
        const cr = corrupt();
        ctx.save(); ctx.globalCompositeOperation = 'multiply'; ctx.globalAlpha = .25 + .5 * cr; ctx.drawImage(stage, 0, 0); ctx.restore();
        ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = .05 + .22 * cr;
        spr2(ctx, 'swirl', W * .3, H * .5, { s: 4.2, rot: -time * .35 }); spr2(ctx, 'swirl', W * .78, H * .45, { s: 3.4, rot: time * .5 });
        ctx.globalAlpha = (.04 + .12 * cr) * (.5 + .5 * Math.sin(time * 3)); spr2(ctx, 'rainbow', W / 2, H / 2, { s: 5.2, rot: time * .1 });
        ctx.restore();
        ctx.save(); ctx.globalAlpha = .03 + .09 * cr; spr2(ctx, 'noise-' + (Math.floor(time * 14) % 2), W / 2, H / 2, { s: 5.2 }); ctx.restore();
      }

      // GLaDOS
      if (f && f.t > 1.6) {
        const band = { x: LW, y: CEIL, w: RW - LW, h: FL };
        if (f.portals) { f.ghosts.forEach(g => glados(g.y, f.gr * .35 * Math.sin(f.t * 3), g.t, false, band)); glados(f.gy, f.gr * .35 * Math.sin(f.t * 3), 0, !!f.dark, band); glados(f.gy - FL, f.gr * .35 * Math.sin(f.t * 3), 0, !!f.dark, band); }
        else glados(f.gy, f.slam ? 0 : f.gr * .35 * Math.sin(f.t * 3), 0, !!f.dark, { x: LW, y: 0, w: RW - LW, h: FLOOR + 2 });
      } else {
        glados(0, 0, 0, false);
        if (kaizo) cores.forEach((c, i) => { if (c.state !== 'attached') spr2(ctx, 'orb', BX + MOUNT[i].x, CEIL + MOUNT[i].y, { s: .3, rot: time * 2 + i }); });
        if (!(kaizo && G.gl > 0 && Math.random() < .35)) paintMounts(ctx, spr, BX, CEIL, 1, time, i => cores[i].state, (i, x, y) => ({ frame: eyeLook(y), flip: P.cx < x }));
                ctx.fillStyle = `rgba(255,170,60,${.35 + .25 * Math.sin(time * 5)})`; ctx.beginPath(); ctx.arc(BX - 30, CEIL + 235, 5 + (G.banter > 0 ? 4 * Math.abs(Math.sin(time * 7)) : 0), 0, 6.28); ctx.fill();
        if (kaizo && G.vpulse > 0) spr2(ctx, 'ring-' + Math.min(12, Math.floor((1 - G.vpulse / .3) * 13)), BX - 30, CEIL + 235, { s: 1.8, alpha: Math.min(1, G.vpulse / .3) });
      }
      // Supplied pedestal prop, stationary and reachable.
      if (G.mode === 'incinerate' && !f) {
        const bx = BX - 130, by = FLOOR - 44;
        spr(ctx,'pedestal',bx,FLOOR-24,{s:.3});
        spr(ctx, G.glass > 0 ? 'btn-grey' : 'btn-red', bx, by, { s: 1.1 });
        if (G.glass > 0) { spr(ctx, 'glass', bx, by, { s: 1.1, alpha: .3 }); }
      }
      portals.blue && drawPortal(portals.blue); portals.orange && drawPortal(portals.orange);
      // ceiling turrets and the floor turret
      [-120, 120].forEach(dx => spr(ctx, 'turret', BX + dx, CEIL + 36, { s: .42, rot: Math.PI }));
      bolts.forEach(b => { if (b.tele > 0) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; const rg = ctx.createRadialGradient(b.cx, b.cy, 1, b.cx, b.cy, 18); rg.addColorStop(0, 'rgba(255,90,70,.9)'); rg.addColorStop(1, 'rgba(255,40,30,0)'); ctx.fillStyle = rg; ctx.fillRect(b.cx - 18, b.cy - 18, 36, 36); ctx.restore(); } });
      if (G.mode === 'turret' && !f) {
        const k = G.turretOut, ty = FLOOR - 4 - 26 * k;
        ctx.save(); ctx.beginPath(); ctx.rect(INC.x - 40, 0, 80, FLOOR); ctx.clip();
        ctx.translate(INC.x, ty); ctx.rotate(G.aim); spr(ctx, 'turret', 0, 0, { s: .35, rot: 0 }); ctx.restore();
        if (G.warn > 0) { const e = rayEnd(INC.x, FLOOR - 30, G.aim), p = .5 + .4 * Math.sin(time * 24) ** 2; beam(INC.x, FLOOR - 30, e.x, e.y, 1.2, '#ff2a2a', p); ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = 'rgba(255,60,40,' + p + ')'; ctx.beginPath(); ctx.arc(e.x, e.y, 5, 0, 6.283); ctx.fill(); ctx.restore(); }
        if (G.laser) { const on = G.laser.t > 100 * TICK, fl = .75 + .25 * Math.sin(time * 70); if (on) { beam(INC.x, FLOOR - 28, INC.x, CEIL, 7 * fl, '#ff2a2a'); ctx.save(); ctx.globalCompositeOperation = 'lighter'; const rg = ctx.createRadialGradient(INC.x, FLOOR - 28, 2, INC.x, FLOOR - 28, 34); rg.addColorStop(0, 'rgba(255,220,200,.9)'); rg.addColorStop(1, 'rgba(255,40,30,0)'); ctx.fillStyle = rg; ctx.fillRect(INC.x - 34, FLOOR - 62, 68, 68); ctx.restore(); } else beam(INC.x, FLOOR - 28, INC.x, CEIL, 1, '#ff2a2a', .3 + .4 * Math.sin(G.laser.t * 30) ** 2); }
      }
      cores.forEach(c => { if (c.state === 'loose' || c.state === 'carried') { ctx.save(); ctx.translate(c.x, c.y); eye(c.i, 0, 0, 1.2); ctx.restore(); } });
      drawLooey();
      if (!f || f.t < 3) { /* the carry slot is unused: cores are knocked, not carried */ }
      spr(ctx, 'wheatley', P.cx - P.face * 34, P.cy - P.h - 4 + Math.sin(time * 3) * 3, { s: .42, flip: P.face < 0 });
      rockets.forEach(r => {
        r.trail.forEach(t => { ctx.fillStyle = 'rgba(255,200,120,.3)'; ctx.fillRect(t.x - 2, t.y - 2, 4, 4); });
        spr(ctx, 'rocket', r.cx, r.cy, { rot: r.ang, s: 1.2 });
        if (r.through) { ctx.strokeStyle = '#ffe08a'; ctx.beginPath(); ctx.arc(r.cx, r.cy, 12, 0, 6.28); ctx.stroke(); }
      });
      bolts.forEach(b => {
        if (b.tele > 0) {
          const a = Math.atan2(b.ty - b.cy, b.tx - b.cx), e = rayEnd(b.cx, b.cy, a), p = .35 + .35 * Math.sin(time * 26) ** 2;
          beam(b.cx, b.cy, e.x, e.y, 1, '#ff2a2a', p);
          ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = 'rgba(255,70,50,' + (.4 + .5 * p) + ')'; ctx.beginPath(); ctx.arc(b.cx, b.cy, 4 + 4 * p, 0, 6.283); ctx.fill(); ctx.restore();
        } else {
          const ca = Math.cos(b.ang), sa = Math.sin(b.ang);
          beam(b.cx - ca * 42, b.cy - sa * 42, b.cx, b.cy, 3, '#ff2a2a');
          if (kaizo) spr2(ctx, 'diamond', b.cx, b.cy, { s: .9, rot: time * 8 });
        }
      });
      if (kaizo && !f) {
        G.tiles.forEach(q => {
          const on = q.t > 1.2, blink = .35 + .35 * Math.sin(q.t * 24);
          ctx.save(); ctx.beginPath(); ctx.rect(q.x0, FLOOR - 70, q.x1 - q.x0, 74); ctx.clip();
          if (!on) { ctx.globalAlpha = blink; for (let x = q.x0; x < q.x1; x += 24) for (let y = FLOOR - 4; y > FLOOR - 70; y -= 24) spr2(ctx, 'dots', x + 12, y, { s: 1.1 }); }
          else { const g = ctx.createLinearGradient(0, FLOOR - 70, 0, FLOOR); g.addColorStop(0, 'rgba(255,40,120,0)'); g.addColorStop(1, 'rgba(255,40,120,.75)'); ctx.fillStyle = g; ctx.fillRect(q.x0, FLOOR - 70, q.x1 - q.x0, 74); for (let x = q.x0 + 14; x < q.x1; x += 30) spr2(ctx, 'orb', x, FLOOR - 14 - Math.abs(Math.sin(q.t * 9 + x)) * 24, { s: .22, rot: q.t * 6 }); }
          ctx.restore();
          ctx.fillStyle = on ? '#ff2a6a' : 'rgba(255,200,60,.8)'; ctx.fillRect(q.x0, FLOOR - 3, q.x1 - q.x0, 3);
        });
        if (G.wall) {
          const w = G.wall, gt = w.gapY - 50, gb = w.gapY + 50;
          if (w.t <= 1) { const b = .4 + .5 * Math.sin(w.t * 26) ** 2; ctx.fillStyle = 'rgba(255,60,90,' + b + ')'; ctx.fillRect(RW - 10, CEIL, 8, gt - CEIL); ctx.fillRect(RW - 10, gb, 8, FLOOR - gb); spr2(ctx, 'cross', RW - 30, w.gapY, { s: .5, alpha: b }); }
          else {
            ctx.save(); [[CEIL, gt], [gb, FLOOR]].forEach(r => { ctx.save(); ctx.beginPath(); ctx.rect(w.x - 18, r[0], 36, r[1] - r[0]); ctx.clip(); ctx.fillStyle = '#0a0610'; ctx.fillRect(w.x - 18, r[0], 36, r[1] - r[0]); ctx.globalAlpha = .55; spr2(ctx, 'noise-' + (Math.floor(time * 16) % 2), w.x, (r[0] + r[1]) / 2, { s: 2.2 }); ctx.globalAlpha = .6; for (let y = r[0]; y < r[1]; y += 44) spr2(ctx, 'zigzag', w.x, y + 20, { s: .8, rot: 1.5708 }); ctx.restore(); ctx.fillStyle = '#ff2a6a'; ctx.fillRect(w.x - 18, r[0], 2, r[1] - r[0]); ctx.fillRect(w.x + 16, r[0], 2, r[1] - r[0]); }); ctx.restore();
          }
        }
        G.crawlers.forEach(c => { const a = c.t < 0 ? Math.max(0, 1 + c.t / .8) * (.4 + .4 * Math.sin(time * 30)) : 1; if (c.t < 0) { ctx.fillStyle = 'rgba(255,40,100,' + a + ')'; ctx.fillRect(c.x - 20, FLOOR - 3, 40, 3); return; } spr2(ctx, 'dark', c.x, FLOOR - 24 + Math.sin(time * 10 + c.bob) * 3, { s: .5, flip: P.cx < c.x, alpha: Math.min(1, c.life / .6) }); });
      }
      if (kaizo && !f) G.rain.forEach(q => { if (q.t < 0) return; if (q.t < 1.35) spr2(ctx, 'cross', q.x, FLOOR - 16, { s: .6, rot: q.t * 4, alpha: .8 });
        if (q.t < 1) beam(q.x, CEIL, q.x, FLOOR, 1, '#ff2a2a', .25 + .45 * Math.sin(q.t * 26) ** 2); else if (q.t < 1.35) beam(q.x, CEIL, q.x, FLOOR, 7, '#ff2a2a'); });
      if (kaizo && !f && G.waves) G.waves.forEach(w => {
        const rad = Math.max(0, w.t - .7) * (210 + 40 * goneN()), pulse = .5 + .5 * Math.sin(w.t * 30);
        if (w.t <= .7) { spr2(ctx, 'orb', w.x, w.y, { s: .25 + .55 * (w.t / .7) * pulse, rot: time * 5 }); return; }
        ctx.save(); ctx.lineWidth = 7; ctx.globalCompositeOperation = 'lighter';
        ['#ff2a6a', '#3affb0', '#6a7bff'].forEach((c, n) => { ctx.strokeStyle = c; ctx.globalAlpha = .75 - n * .15; ctx.beginPath(); ctx.arc(w.x, w.y, rad + n * 6, 0, 6.283); ctx.stroke(); });
        ctx.restore();
      });
      if (kaizo && G.sweep && G.sweep.dbl && !f) { const sw = G.sweep, y2 = FLOOR - 70; ctx.fillStyle = '#ff4a3a'; ctx.fillRect(LW, y2 - 6, 6, 12); ctx.fillRect(RW - 6, y2 - 6, 6, 12); if (sw.t < 1.3) { beam(LW + 6, y2, RW - 6, y2, 1, '#ff2a2a', .25 + .45 * Math.sin(sw.t * 22) ** 2); spr2(ctx, 'cross', W / 2, FLOOR - 42, { s: .7, alpha: .6 + .3 * Math.sin(sw.t * 20) }); } else if (sw.t < 1.85) { beam(LW + 6, y2, RW - 6, y2, 6, '#ff2a2a'); for (let x = LW + 40; x < RW; x += 44) spr2(ctx, 'zigzag', x, y2, { s: .5, alpha: .85 }); } }
      if (G.sweep && !f) {
        const sw = G.sweep, y = FLOOR - 14;
        ctx.fillStyle = '#ff4a3a'; ctx.fillRect(LW, y - 6, 6, 12); ctx.fillRect(RW - 6, y - 6, 6, 12);
        if (sw.t < 1.3) beam(LW + 6, y, RW - 6, y, 1, '#ff2a2a', .25 + .45 * Math.sin(sw.t * 22) ** 2); else if (sw.t < 1.85) { beam(LW + 6, y, RW - 6, y, 6, '#ff2a2a'); if (kaizo) for (let x = LW + 20; x < RW; x += 44) spr2(ctx, 'zigzag', x, y, { s: .5, alpha: .85 }); }
      }
      shots.forEach(s => { const k = s.t / s.dur; ctx.fillStyle = s.color === 'blue' ? '#4aa8ff' : '#ff9a2e'; ctx.fillRect(s.x + (s.tx - s.x) * k - 3, s.y + (s.ty - s.y) * k - 3, 6, 6); });
      booms.forEach(b => { if (kaizo) { spr2(ctx, 'burst', b.x, b.y, { s: 2.4 * b.s, rot: b.t * 6, alpha: Math.max(0, 1 - b.t / .45) }); return; } const fr = Math.min(4, Math.floor(b.t / .45 * 5)); spr(ctx, 'boom-' + fr, b.x, b.y, { s: 3 * b.s }); });
      floats.forEach(q => { ctx.save(); ctx.globalAlpha = Math.max(0, 1 - q.t / 1.1); ctx.font = '900 ' + (q.big ? 24 : 14) + 'px sans-serif'; ctx.textAlign = 'center'; ctx.lineWidth = 4; ctx.strokeStyle = 'rgba(0,0,0,.8)'; ctx.strokeText(q.txt, q.x, q.y); ctx.fillStyle = q.col; ctx.fillText(q.txt, q.x, q.y); ctx.restore(); });
      parts.forEach(q => { ctx.globalAlpha = Math.max(0, q.life / q.max); ctx.fillStyle = q.col; ctx.fillRect(q.x, q.y, q.size, q.size); ctx.globalAlpha = 1; });
      if (!f) { ctx.strokeStyle = 'rgba(255,255,255,.7)'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(aim.x, aim.y, 7, 0, 6.28); ctx.moveTo(aim.x - 12, aim.y); ctx.lineTo(aim.x - 4, aim.y); ctx.moveTo(aim.x + 4, aim.y); ctx.lineTo(aim.x + 12, aim.y); ctx.moveTo(aim.x, aim.y - 12); ctx.lineTo(aim.x, aim.y - 4); ctx.moveTo(aim.x, aim.y + 4); ctx.lineTo(aim.x, aim.y + 12); ctx.stroke(); }
      ctx.restore();
      if (!f) drawHud();
      if (!f && goneN() > 0 && !lost) { const I = goneN() * dmul; ctx.fillStyle = 'rgba(255,40,20,' + (.008 + .012 * I) * (.5 + .5 * Math.sin(time * (3 + I))) + ')'; ctx.fillRect(0, 0, W, H); }
      // neurotoxin
      if (clock <= 0 && !f) { ctx.fillStyle = `rgba(150,220,80,${Math.min(.7, gasT / 6 * .7)})`; ctx.fillRect(0, 0, W, H); }
      if (f) {
        const t = f.t, bars = Math.min(1, t / .8) * 46;
        ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, bars); ctx.fillRect(0, H - bars, W, bars);
        if (f.portals && t < 8) { ctx.strokeStyle = 'rgba(255,255,255,.22)'; for (let i = 0; i < 14; i++) { const x = Math.random() * W; ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); } }
        if (t < 1.8 && t > .25) { ctx.fillStyle = '#ff9a2e'; ctx.font = 'bold 22px monospace'; ctx.textAlign = 'center'; ctx.fillText(Math.floor(t * 20) % 2 ? 'CORE  DISCONNECTED' : 'C0RE  D1SC0NNECTED', W / 2, H - 60); }
        if (f.white > 0) { ctx.fillStyle = `rgba(255,255,255,${Math.min(1, f.white)})`; ctx.fillRect(0, 0, W, H); }
        if (t < .3) { ctx.fillStyle = 'rgba(255,255,255,' + (.3 - t) * 2.5 + ')'; ctx.fillRect(0, 0, W, H); }
        if (f.dark) { ctx.fillStyle = `rgba(0,0,0,${Math.min(.8, (t - 10.6) / 1.2 * .8)})`; ctx.fillRect(0, 0, W, H); }
        if (t > 11.8) { ctx.fillStyle = `rgba(0,0,0,${Math.min(1, (t - 11.8) / .8)})`; ctx.fillRect(0, 0, W, H); }
      } else if (P.flash > 0) { ctx.fillStyle = 'rgba(255,50,50,' + P.flash * 1.2 + ')'; ctx.fillRect(0, 0, W, H); }
      if (kaizo && !f && !lost) {
        if (G.gl > 0) {
          for (let n = 0; n < 5; n++) { const y = Math.random() * H, h = 6 + Math.random() * 34, off = (Math.random() - .5) * 70; ctx.drawImage(canvas, 0, y, W, h, off, y, W, h); }
          ctx.fillStyle = 'rgba(255,0,200,' + (.05 + Math.random() * .08) + ')'; ctx.fillRect(0, 0, W, H);
          spr2(ctx, 'bars', W / 2, Math.random() * H, { s: 5, alpha: .12 }); if (Math.random() < .4) spr2(ctx, 'checker', Math.random() * W, Math.random() * H, { s: 2 + Math.random() * 3, alpha: .5 });
          if (Math.random() < .3) { ctx.save(); ctx.globalCompositeOperation = 'difference'; ctx.fillStyle = 'rgba(255,255,255,.35)'; ctx.fillRect(0, Math.random() * H, W, 8 + Math.random() * 26); ctx.restore(); }
          ctx.font = '700 10px monospace'; ctx.textAlign = 'left'; ctx.fillStyle = 'rgba(255,60,60,.8)'; for (let n = 0; n < 4; n++) ctx.fillText('0x' + Math.floor(Math.random() * 65535).toString(16).toUpperCase() + ' CORE_' + Math.floor(Math.random() * 9), Math.random() * W, Math.random() * H);
        }
        if (G.invert > 0 || G.floatT > 0) { ctx.fillStyle = G.invert > 0 ? 'rgba(255,0,120,.07)' : 'rgba(80,160,255,.07)'; ctx.fillRect(0, 0, W, H); }
        if (G.evWarn || G.invert > 0 || G.floatT > 0) {
          const label = G.evWarn ? { invert: 'INPUT ERROR', float: 'GRAVITY FAULT', swap: 'PORTAL FAULT', burst: 'CORE FAULT', rain: 'CEILING FAULT', tiles: 'FLOOR FAULT', wall: 'WALL FAULT', crawl: 'SYSTEM FAULT' }[G.evWarn.name] : G.invert > 0 ? 'CONTROLS INVERTED' : 'LOW GRAVITY';
          ctx.save(); ctx.font = '900 20px monospace'; ctx.textAlign = 'center'; const jx = (Math.random() - .5) * (G.evWarn ? 8 : 2);
          if (G.evWarn) { ctx.globalAlpha = .5; spr2(ctx, 'bars', W / 2, 66, { s: 5 }); ctx.globalAlpha = .9; spr2(ctx, 'cross', W / 2 - 150, 66, { s: .45, rot: time * 5 }); spr2(ctx, 'cross', W / 2 + 150, 66, { s: .45, rot: -time * 5 }); ctx.globalAlpha = 1; }
          ctx.fillStyle = 'rgba(0,255,255,.7)'; ctx.fillText(label, W / 2 + jx - 2, 74); ctx.fillStyle = 'rgba(255,40,80,.9)'; ctx.fillText(label, W / 2 + jx + 2, 74); ctx.restore();
        }
      }
      if (lost) { ctx.fillStyle = 'rgba(0,0,0,.6)'; ctx.fillRect(0, 0, W, H); ctx.fillStyle = '#fff'; ctx.font = 'bold 28px monospace'; ctx.textAlign = 'center'; ctx.fillText('TEST FAILED', W / 2, H / 2); }
    }
    root._controls={interact:bonk,fire,placePortal,pause:setPaused,aim:p=>{aim=p;},cleanup};
    root._step = sec => { for (let t = 0; t < sec; t += 1 / 60) update(1 / 60); };
    const fmtClock = s => Math.floor(s / 60) + ':' + String(Math.floor(s % 60)).padStart(2, '0');

    /* ---- hud */
    const objB = $('.ap-objective b', root), objP = $('.ap-objective progress', root), bonkBtn = $('.ap-fire .bonk', root);
    const hud = () => {
      const held = P.carry != null, loose = cores.find(c => c.state === 'loose');
      let title = 'Listen';
      if (G.mode === 'incinerate') title = G.glass > 0 ? 'Break the glass' : G.incOpen <= 0 ? 'Press the button' : held ? 'Into the pit \u00b7 ' + Math.ceil(G.incOpen) + 's' : 'Grab the core \u00b7 ' + Math.ceil(G.incOpen) + 's';
      else if (G.mode === 'turret' && G.banter > 0) title = 'Listen';
      else if (G.mode === 'turret') title = 'Send rockets back \u00b7 ' + Math.min(3, Math.round(G.dmg / D.hit)) + '/3';
      if (G.mode === 'incinerate' && !held && G.glass <= 0 && G.incOpen <= 0 && loose) title = 'Press the button';
      if (finale) title = '';
      objB.textContent = title; objP.value = G.mode === 'turret' ? Math.min(3, G.dmg / D.hit) : 0; objP.hidden = G.mode !== 'turret'; root.classList.toggle('quiet', !title);
      bonkBtn.textContent = G.mode === 'incinerate' && Math.hypot(P.cx - 510, P.cy - 344) < 70 ? (G.glass > 0 ? 'Smash' : 'Press') : held ? (G.incOpen > 0 && Math.abs(P.cx - INC.x) < 65 ? 'Drop in' : 'Drop') : loose && Math.hypot(P.cx - loose.x, P.cy - loose.y) < 64 ? 'Grab' : 'Use';
    };
    hud();
    const hudId = setInterval(() => { if (!root.isConnected) { clearInterval(hudId); return; } hud(); }, 120);

    const frame = now => {
      if (!root.isConnected || disposed) return;
      let dt = Math.min(.05, (now - lastFrame) / 1000); lastFrame = now;
      realDt = dt;
      if (hitstop > 0) { hitstop -= dt; dt = 0; } else if (slow > 0) { slow -= dt; dt *= .35; }
      update(dt * (finale ? timeScale : 1)); realDt = null;
      draw();
      if (root.isConnected) requestAnimationFrame(frame);
    };
    Promise.all([atlasReady, sfxReady, X.atlas2Ready || null, X.atlas3Ready || null]).then(() => requestAnimationFrame(t => { lastFrame = t; frame(t); }));
  }
  return { play, DIFFS, paintMounts, MOUNT };
})();
