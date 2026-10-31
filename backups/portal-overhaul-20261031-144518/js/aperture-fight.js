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
  const H = NARROW ? 700 : WH;
  const BX = 640, GS = .8;                                   // GLaDOS hangs at x=640, drawn at 80%
  const BODY = { x0: BX - 56, x1: BX + 56, y0: CEIL, y1: CEIL + 252 };
  const INC = { x: BX, half: 40 };                           // the incinerator in the floor, under her
  const CORES = [
    { name: 'Morality',     spr: 'core-frame-blue',   voice: null },
    { name: 'Curiosity',    spr: 'core-frame-orange', voice: { group: 'core-squeal', holds: [80, 70, 70, 70, 70, 130, 70, 70, 110, 70, 80, 180, 70, 70, 70, 170, 100], loopTo: 1, die: 'core-squeal-17' } },
    { name: 'Intelligence', spr: 'core-frame-red',    voice: { group: 'core-a', holds: [278, 125, 83, 158, 81, 173, 172, 211, 119, 149, 74, 77, 112, 77, 114, 131, 345, 261, 101, 83, 175, 136, 193, 88, 209, 133, 274, 87, 237, 196, 191, 200, 96, 300, 175, 175, 168, 167, 121, 108, 77, 464, 242], loopTo: 1, die: 'core-squeal-17' } },
    { name: 'Emotion',      spr: 'core-frame-purple', voice: { group: 'core-b', holds: [46, 63, 125, 134, 59, 49, 69, 119, 132, 77, 130, 106, 100, 46, 49, 44, 73, 56], loopTo: 1, die: null } }
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
  const DIFFS = {
    easy:   { label: 'Easy',   hp: 1500, rocket: 300, bolt: 3, bolts: 2.6, boltSpeed: 300, hit: 750, speed: 300, timer: 420, laserDps: 120 },
    medium: { label: 'Medium', hp: 1000, rocket: 380, bolt: 5, bolts: 1.8, boltSpeed: 420, hit: 600, speed: 380, timer: 360, laserDps: 220 },
    hard:   { label: 'Hard',   hp: 700,  rocket: 480, bolt: 8, bolts: 1.3, boltSpeed: 480, hit: 480, speed: 480, timer: 300, laserDps: 300 }
  };

  function play(diffKey, onEnd, X) {
    const { snd, spr, atlasReady, sfxReady, playMusic, asset } = X;
    const D = DIFFS[diffKey];
    const root = el('div', 'ap-fight');
    root.innerHTML = `<div class="ap-hud"><div class="ap-bar hp"><i></i><b>Looey</b></div><div class="ap-cores"></div><div class="ap-clock">6:00</div><button class="ap-quit" type="button" aria-label="Leave the test">✕</button></div>
      <canvas class="ap-canvas" width="${W}" height="${H}"></canvas><div class="ap-sub"></div>
      <div class="ap-pad"><div class="ap-move"><button type="button" data-k="left">◀</button><button type="button" data-k="right">▶</button></div>
      <div class="ap-fire"><button type="button" data-k="jump" class="jump">Jump</button><button type="button" data-k="bonk" class="bonk">Bonk</button><button type="button" data-k="blue" class="blue">Blue</button><button type="button" data-k="orange" class="orange">Orange</button></div></div>`;
    ($('#app') || document.body).appendChild(root);
    const canvas = $('.ap-canvas', root), ctx = canvas.getContext('2d');
    ctx.imageSmoothingEnabled = false;
    const sub = $('.ap-sub', root);
    playMusic('apFight');

    const hero = HEROES.Looey || {};
    const heroImg = new Image(); heroImg.src = Art.hero('Looey');
    const heroFace = hero.nativeFace || 1;

    /* ---- state */
    const P = { cx: 450, cy: FLOOR - 23, vx: 0, vy: 0, w: 22, h: 46, face: 1, hp: D.hp, ground: true, carry: null, hurt: 0, flash: 0, portalCd: 0, run: 0, bonk: 0, bonkCd: 0, still: 0, lastX: 450, lastY: 0, vel: { x: 0, y: 0 } };
    const portals = { blue: null, orange: null };
    const G = { stage: 0, mode: 'script', dmg: 0, f: 1, stunned: 0, flash: 0, frame: 0, detachAt: null, glass: 32, button: { a: 0 }, incOpen: 0, turretOut: 0, laser: null, aim: 0, warn: 0, still: 0, shotAt: 0, boltT: 2.5, boltSide: 0 };
    const cores = CORES.map((c, i) => ({ i, state: 'attached', x: 0, y: 0, vx: 0, vy: 0, say: null }));
    const rockets = [], bolts = [], parts = [], booms = [], shots = [];
    const keys = {};
    root._dbg = () => ({ P, G, cores, V, rockets, bolts, portals, clock });
    let aim = { x: P.cx + 200, y: P.cy - 20 }, time = 0, lost = false, shake = 0, finale = null, ended = false, hitstop = 0, timeScale = 1;
    let clock = D.timer, clockOn = false, said = {}, gasT = 0;
    let lastFrame = performance.now();
    const baseZoom = NARROW ? 2.3 : 1;
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
    const clip = (k, vol = .8) => snd('taunt-' + k, vol, { max: 20000 });
    const nextMor = k => (k === 0 ? 1 : k === 20 ? 18 : k + 1);
    function voiceStart() { V.started = true; V.t = 0; V.k = 0; V.phase = 'mor'; clip(0); }
    function voiceUpdate(dt) {
      if (!V.started) return;
      V.t += dt;
      const ticks = V.t / TICK;
      if (V.interrupt) {
        // "Where are you taking that thing": one short line, then back to the loop
        const i = V.interrupt;
        if (!i.said && ticks >= i.t0 + 20) { i.said = true; snd('voice-5000-0', .8, { max: 3000 }); }
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
      else if (V.phase === 'b3') { V.k = V.k + 1; if (HOLD.b3[V.k] != null) { clip(V.k); if (V.k === 66) setTimeout(() => { if (root.isConnected) snd('voice-5100-0', .8, { max: 2000 }); }, 2400); } }
      // morality core: scripted detach three seconds into clip 3
    }
    function phaseTo(p, k, speak = true) { V.phase = p; V.k = k; V.t = 0; if (speak && HOLD[p][k] != null) clip(k); }

    /* ---- helpers */
    const Tstage = () => D.hit * 3.2;                      // body damage that takes one core off
    const surfaceFor = (ex, ey) => {
      if (ey >= FLOOR - 1) return { x: clamp(ex, LW + 40, RW - 40), y: FLOOR, nx: 0, ny: -1 };
      if (ey <= CEIL + 1) return { x: clamp(ex, LW + 40, RW - 40), y: CEIL, nx: 0, ny: 1 };
      if (ex <= LW + 1) return { x: LW, y: clamp(ey, CEIL + 40, FLOOR - 40), nx: 1, ny: 0 };
      return { x: RW, y: clamp(ey, CEIL + 40, FLOOR - 40), nx: -1, ny: 0 };
    };
    function fire(color) {
      if (finale || lost) return;
      const ox = P.cx, oy = P.cy - 8;
      let dx = aim.x - ox, dy = aim.y - oy; const len = Math.hypot(dx, dy) || 1; dx /= len; dy /= len;
      let best = 1e9, hit = null;
      const test = (t, x, y) => { if (t > 0 && t < best && x >= LW - 1 && x <= RW + 1 && y >= CEIL - 1 && y <= FLOOR + 1) { best = t; hit = { x, y }; } };
      if (dx < 0) { const t = (LW - ox) / dx; test(t, LW, oy + dy * t); }
      if (dx > 0) { const t = (RW - ox) / dx; test(t, RW, oy + dy * t); }
      if (dy < 0) { const t = (CEIL - oy) / dy; test(t, ox + dx * t, CEIL); }
      if (dy > 0) { const t = (FLOOR - oy) / dy; test(t, ox + dx * t, FLOOR); }
      if (!hit) return;
      let blocked = false;
      for (let s = 0; s < best; s += 6) { const x = ox + dx * s, y = oy + dy * s; if (x > BODY.x0 && x < BODY.x1 && y > BODY.y0 && y < BODY.y1) { blocked = true; hit = { x, y }; best = s; break; } }
      P.face = dx >= 0 ? 1 : -1;
      shots.push({ x: ox, y: oy, tx: hit.x, ty: hit.y, t: 0, dur: Math.min(.18, best / 2400), color, blocked });
      snd('shoot-a', .22, { max: 300, rate: color === 'blue' ? 1 : 1.2 });
    }
    function placePortal(color, hit) {
      const p = surfaceFor(hit.x, hit.y), otherKey = color === 'blue' ? 'orange' : 'blue', other = portals[otherKey];
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
    const hurt = (n, key) => {
      if (P.hurt > 0 || finale || lost) return;
      P.hp -= n; P.hurt = key === 'beam' ? .08 : key === 'bolt' ? .35 : 1.0; P.flash = .2; shake = Math.max(shake, key === 'bolt' ? 3 : 9);
      if (P.carry) { /* the core stays with you */ }
      if (P.hp <= 0) { lost = true; P.hp = 0; setTimeout(() => finish(false), 1600); snd('hit', .6); }
    };

    /* ---- cores */
    function detachCore(i) {
      const c = cores[i]; if (c.state !== 'attached') return;
      const spots = [[-42, 56], [-38, 102], [6, 107], [0, 65]], s = spots[i];
      c.state = 'loose'; c.x = BX + s[0] * 1.2; c.y = CEIL + s[1] * 1.5; c.vx = (Math.random() - .5) * 120; c.vy = -90;
      shake = 14; boom(c.x, c.y, 1.2); snd('clank-a', .6, { max: 700 });
      for (let n = 0; n < 4; n++) spark(c.x, c.y, 4, '#ffe08a', 150);
      G.mode = 'incinerate'; G.glass = 32; G.incOpen = 0; G.turretOut = 0; G.warn = 0; G.still = 0;
      rockets.length = 0;
      // the core talks while it is loose
      const v = CORES[i].voice; if (v) c.say = { k: 0, t: 0 };
      say('core', 'A core came off! Knock it into the incinerator, the hole in the floor. Break the glass on that spinning button first, then hit the button!', 6000);
    }
    function coreVoice(c, dt) {
      const v = CORES[c.i].voice; if (!v || !c.say) return;
      c.say.t += dt;
      if (c.say.t === dt) snd(v.group + '-' + c.say.k, .7, { max: 6000 });
      if (c.say.t / TICK >= v.holds[c.say.k]) { c.say.t = 0; c.say.k = c.say.k >= v.holds.length - 1 ? v.loopTo : c.say.k + 1; snd(v.group + '-' + c.say.k, .7, { max: 6000 }); }
    }
    function burnCore(c) {
      c.state = 'gone'; if (P.carry === c) P.carry = null;
      boom(INC.x, FLOOR - 14, 1.5);
      for (let n = 0; n < 24; n++) spark(INC.x, FLOOR - 14, 1, '#ff9a2e', 280);
      const v = CORES[c.i].voice; if (v && v.die) snd(v.die, .7, { max: 2500 });
      G.incOpen = 0; G.glass = 32;
      if (c.i === 0) { V.interrupt = null; phaseTo('good', 20, false); V.t = 0; }
      else if (c.i === 1) phaseTo('b2', 46);
      else if (c.i === 2) phaseTo('b3', 57);
      if (c.i === 3) { beginFinale(); return; }
      G.mode = 'turret'; G.dmg = 0; G.f = 1; G.turretOut = 0; G.stage = c.i;
      say('turret' + c.i, 'It\'s a turret now! Don\'t stand still, it only shoots when you stop. Send its rocket through your portals and into her!', 6000);
    }

    /* ---- bonk: glass, button, cores */
    function bonk() {
      if (P.bonkCd > 0 || finale || lost) return;
      P.bonkCd = .35; P.bonk = .18;
      const hx = P.cx + P.face * 30, hy = P.cy - 6;
      snd('clank-b', .25, { max: 250 });
      if (G.mode === 'incinerate') {
        const bx = BX + Math.cos(G.button.a) * 105, by = CEIL + 130 + Math.sin(G.button.a) * 130;
        if (Math.hypot(hx - bx, hy - by) < 34) {
          if (G.glass > 0) { G.glass -= 16; spark(bx, by, 8, '#cfe9ff', 140); snd('hit', .4, { max: 300 }); if (G.glass <= 0) { snd('glass-break', .6, { max: 900 }); spark(bx, by, 24, '#cfe9ff', 260); say('glass', 'The glass is gone! Now hit the red button!', 3200); } }
          else if (!G.incOpen) { G.incOpen = 10; snd('open', .6, { max: 900 }); boom(INC.x, FLOOR - 10, .8, true); say('open', 'It\'s open! Quick, you have ten seconds, knock the core in!', 3200); }
        }
      }
      cores.forEach(c => { if (c.state === 'loose' && Math.hypot(hx - c.x, hy - c.y) < 40) { c.vx = P.face * 330; c.vy = -230; snd('hit', .4, { max: 300 }); spark(c.x, c.y, 6, '#fff', 120); } });
    }

    /* ---- input */
    const down = e => {
      if (['ArrowLeft', 'KeyA'].includes(e.code)) keys.left = true;
      else if (['ArrowRight', 'KeyD'].includes(e.code)) keys.right = true;
      else if (['ArrowUp', 'KeyW', 'Space'].includes(e.code)) { keys.jump = true; e.preventDefault(); }
      else if (e.code === 'KeyQ') fire('blue');
      else if (e.code === 'KeyE') fire('orange');
      else if (['KeyF', 'KeyX'].includes(e.code)) bonk();
      else if (e.code === 'Escape') quit();
    };
    const up = e => {
      if (['ArrowLeft', 'KeyA'].includes(e.code)) keys.left = false;
      else if (['ArrowRight', 'KeyD'].includes(e.code)) keys.right = false;
      else if (['ArrowUp', 'KeyW', 'Space'].includes(e.code)) keys.jump = false;
    };
    document.addEventListener('keydown', down); document.addEventListener('keyup', up);
    const toWorld = ev => { const r = canvas.getBoundingClientRect(); return { x: ((ev.clientX - r.left) / r.width * W - W / 2) / camNow.z + camNow.x, y: ((ev.clientY - r.top) / r.height * H - H / 2) / camNow.z + camNow.y }; };
    canvas.addEventListener('pointermove', ev => { aim = toWorld(ev); });
    canvas.addEventListener('pointerdown', ev => { aim = toWorld(ev); if (ev.pointerType === 'mouse') fire(ev.button === 2 ? 'orange' : 'blue'); });
    canvas.addEventListener('contextmenu', ev => ev.preventDefault());
    $$('.ap-pad button', root).forEach(b => {
      const k = b.dataset.k;
      const on = ev => { ev.preventDefault(); if (k === 'blue' || k === 'orange') fire(k); else if (k === 'bonk') bonk(); else keys[k] = true; b.classList.add('on'); };
      const off = ev => { ev.preventDefault(); if (k === 'left' || k === 'right' || k === 'jump') keys[k] = false; b.classList.remove('on'); };
      b.addEventListener('pointerdown', on); b.addEventListener('pointerup', off); b.addEventListener('pointerleave', off); b.addEventListener('pointercancel', off);
    });
    const cleanup = () => { ended = true; document.removeEventListener('keydown', down); document.removeEventListener('keyup', up); clearTimeout(say.t); };
    const finish = ok => { if (!root.isConnected) return; cleanup(); root.remove(); onEnd(ok); };
    const quit = () => { if (finale) return; cleanup(); root.remove(); onEnd(null); };
    $('.ap-quit', root).onclick = () => UI.confirm('Leave the test?', 'GLaDOS will be here when you get back.', quit);

    /* ---- update */
    function update(dt) {
      time += dt; P.hurt -= dt; P.flash -= dt; P.portalCd -= dt; P.bonk -= dt; P.bonkCd -= dt; G.flash -= dt;
      G.frame = Math.floor(time * 3) % 5;
      if (finale) { finaleUpdate(dt); return; }
      /* player */
      const carryMul = 1, speed = 200 * carryMul;
      const dir = (keys.right ? 1 : 0) - (keys.left ? 1 : 0);
      if (dir) { P.face = dir; P.run += dt * 10; }
      const accel = P.ground ? 1500 : 650;
      if (dir) P.vx += dir * accel * dt; else P.vx -= Math.sign(P.vx) * Math.min(Math.abs(P.vx), (P.ground ? 1400 : 200) * dt);
      const lim = Math.max(speed, Math.abs(P.vx) > speed + 5 && !P.ground ? Math.abs(P.vx) : speed);
      P.vx = clamp(P.vx, -lim, lim);
      if (keys.jump && P.ground) { P.vy = -540; P.ground = false; snd('clank-b', .15, { max: 200, rate: 1.8 }); }
      P.vy = Math.min(900, P.vy + 1250 * dt);
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
      portals.blue && (portals.blue.t += dt); portals.orange && (portals.orange.t += dt);
      /* script: the voice loop starts at once; she knocks the Morality Core off three seconds into her third clip */
      if (!V.started && time > .8) { voiceStart(); say('start', 'Right! Blue is left click or Q, orange is right click or E, bonk with F. Aim with the mouse, or tap. I\'ll hover. Helpfully!', 6500); }
      voiceUpdate(dt);
      if (G.mode === 'script' && V.phase === 'mor' && V.k === 3 && V.t / TICK >= 180) { detachCore(0); }
      // "Where are you taking that thing?": the first time you pick the core up and carry it off
      const m = cores[0];
      if (G.mode === 'incinerate' && m.state === 'loose' && !V.asked && V.phase === 'mor' && !V.interrupt && (Math.abs(m.vx) > 120 || Math.hypot(m.x - P.cx, m.y - P.cy) < 30) && ((V.k === 6 && V.t / TICK >= 300) || V.k > 6 && V.t / TICK >= 60)) { V.asked = true; V.interrupt = { t0: V.t / TICK, said: false }; V.t = 0; }
      /* the body */
      G.f = Math.min(1, G.f + dt * .1);
      G.stunned = Math.max(0, G.stunned - dt);
      /* incinerator and button */
      G.button.a += dt * (Math.PI * 2 / 6);
      if (G.incOpen > 0) { G.incOpen -= dt; if (G.incOpen <= 0) { snd('door', .4, { max: 700 }); } }
      /* turret mode */
      if (G.mode === 'turret') {
        G.turretOut = Math.min(1, G.turretOut + dt * 2);
        const tx = INC.x, ty = FLOOR - 16, ang = Math.atan2(P.cy - ty, P.cx - tx);
        const toBody = Math.atan2((CEIL + 130) - ty, BX - tx);
        const inLine = Math.abs(((ang - toBody + Math.PI * 3) % (Math.PI * 2)) - Math.PI) > Math.PI - .79;   // within 45 degrees of her: it will not shoot
        if (G.warn <= 0) { G.aim = ang; }
        const still = Math.abs(P.vel.x) < 210 && Math.abs(P.vel.y) < 360 && !inLine;
        const phase = G.stage + 1;                                // the character's phase counter: 1 after the first core
        if (G.warn <= 0) { G.still = still ? G.still + dt : 0; if (G.still >= (30 - 5 * (phase - 1)) * TICK) { G.warn = (80 - 10 * (phase - 1)) * TICK; G.still = 0; snd('warning', .35, { max: 700 }); say('rocket', 'ROCKET! Don\'t stand there! Move, and put a portal in its way!', 4200); } }
        else { G.warn -= dt; if (G.warn <= 0) { launchRocket(G.aim); G.shotAt = time; } }
        // linger by the turret: it charges a laser
        const near = Math.abs(P.cx - tx) < 40 && P.cy + P.h / 2 >= FLOOR - 4;
        if (!G.laser && near) { G.lingering = (G.lingering || 0) + dt; if (G.lingering >= 1) { G.laser = { t: 0 }; G.lingering = 0; snd('charge', .4, { max: 1600 }); } }
        else if (!near) G.lingering = 0;
        if (G.laser) { G.laser.t += dt; if (G.laser.t > 100 * TICK) { if (!G.laser.fired) { G.laser.fired = true; snd('laser', .35, { max: 1200 }); } if (Math.abs(P.cx - tx) < 26) hurt(D.laserDps * dt * (diffKey === 'hard' ? 1 : .8), 'beam'); if (G.laser.t > 164 * TICK) G.laser = null; } }
      }
      /* ceiling bolts: small homing shots once the first core is loose */
      if (G.mode !== 'script') {
        G.boltT -= dt;
        if (G.boltT <= 0) { G.boltT = D.bolts * (.85 + Math.random() * .3); G.boltSide ^= 1; const bx = BX + (G.boltSide ? 120 : -120); bolts.push({ cx: bx, cy: CEIL + 16, vx: 0, vy: 0, w: 8, h: 8, age: 0 }); snd('shoot-b', .18, { max: 400, rate: 1.5 }); }
      }
      for (let i = bolts.length - 1; i >= 0; i--) {
        const b = bolts[i]; b.age += dt;
        const dx = P.cx - b.cx, dy = P.cy - b.cy, l = Math.hypot(dx, dy) || 1;
        b.vx = dx / l * D.boltSpeed; b.vy = dy / l * D.boltSpeed; b.cx += b.vx * dt; b.cy += b.vy * dt;
        if (l < 18) { bolts.splice(i, 1); hurt(D.bolt * 6, 'bolt'); spark(b.cx, b.cy, 6, '#ff7ad9', 120); continue; }
        if (b.age > 2) bolts.splice(i, 1);
      }
      /* rockets: straight lines that speed up to a cap */
      for (let i = rockets.length - 1; i >= 0; i--) {
        const r = rockets[i]; if (!r) continue; r.age += dt; r.portalCd -= dt;
        const sp = Math.min(D.speed, Math.hypot(r.vx, r.vy) * Math.pow(1.0875, 60 * dt));
        const l = Math.hypot(r.vx, r.vy) || 1; r.vx = r.vx / l * sp; r.vy = r.vy / l * sp;
        r.cx += r.vx * dt; r.cy += r.vy * dt; r.ang = Math.atan2(r.vy, r.vx);
        r.trail.push({ x: r.cx, y: r.cy }); if (r.trail.length > 14) r.trail.shift();
        const before = r.through || 0; tryPortals(r, 26);
        if ((r.through || 0) > before) { spark(r.cx, r.cy, 8, '#ffe08a', 140); say('redirect', 'It went through! Now it\'s heading for HER! Did we plan that?', 3600); }
        if ((r.through || 0) > 0 && r.cx > BODY.x0 && r.cx < BODY.x1 && r.cy > BODY.y0 && r.cy < BODY.y1) {
          rockets.splice(i, 1); hitBody(r); continue;
        }
        if (Math.hypot(r.cx - P.cx, r.cy - P.cy) < 22) { rockets.splice(i, 1); boom(r.cx, r.cy, .9); hurt(D.rocket * (r.through ? 1 : 1) * .5, 'rocket'); continue; }
        if (r.cx < LW || r.cx > RW || r.cy < CEIL || r.cy > FLOOR || r.age > 9) { rockets.splice(i, 1); boom(clamp(r.cx, LW, RW), clamp(r.cy, CEIL, FLOOR), .8); }
      }
      /* cores */
      cores.forEach(c => {
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
        if (Math.hypot(c.x - P.cx, c.y - P.cy) < 36 && !said.nudge) { said.nudge = true; say('nudge', 'Bonk it! The bonk is F, or the Bonk button. It rolls. It bounces. Be kind to it.', 3200); }
      });
      /* clock */
      if (V.phase !== 'mor' && V.phase !== 'good') clockOn = true;
      if (clockOn) clock = Math.max(0, clock - dt);
      if (clock <= 0 && !lost && !finale) { gasT += dt; if (gasT > 6) { lost = true; setTimeout(() => finish(false), 800); } }
      /* fx */
      for (let i = parts.length - 1; i >= 0; i--) { const q = parts[i]; q.life -= dt; q.vy += 520 * dt; q.x += q.vx * dt; q.y += q.vy * dt; if (q.life <= 0) parts.splice(i, 1); }
      for (let i = booms.length - 1; i >= 0; i--) { booms[i].t += dt; if (booms[i].t > .45) booms.splice(i, 1); }
      shake = Math.max(0, shake - 30 * dt);
    }
    function launchRocket(angle) {
      const sx = INC.x, sy = FLOOR - 30;
      rockets.push({ cx: sx, cy: sy, w: 14, h: 8, vx: Math.cos(angle) * 130, vy: Math.sin(angle) * 130, ang: angle, age: 0, portalCd: .2, through: 0, trail: [] });
      snd('shoot-b', .35, { max: 700 });
    }
    function hitBody(r) {
      const dmg = D.hit * G.f; if (G.mode === 'turret') G.dmg += dmg; G.f = G.f * .625; G.flash = .6; shake = Math.max(shake, 10);
      boom(r.cx, r.cy, 1.1); spark(r.cx, r.cy, 18, '#ffffff', 220); snd('hit', .5, { max: 400 });
      if (G.mode === 'turret' && G.dmg >= Tstage()) {
        const next = G.stage + 1; G.dmg = 0; G.stunned = 3;
        if (next <= 3) { detachCore(next); G.stage = next; }
      }
    }

    /* ---- finale: she goes down (the last core is burnt) */
    function beginFinale() {
      finale = { t: 0, loops: 0, gy: 0, gvy: 0, gr: 0, portals: false, closed: false, slam: false, white: 0, dark: 0, ghosts: [] };
      rockets.length = 0; bolts.length = 0; portals.blue = portals.orange = null; sub.classList.remove('on');
      hitstop = .18; snd('boomboomboom', .6, { max: 2500 }); playMusic('apCalm');
      setTimeout(() => { if (root.isConnected) snd('cake-0', .85, { max: 7000 }); }, 1000);   // the line she says when she goes down
    }
    const FL = FLOOR - CEIL;
    function finaleUpdate(dt) {
      const f = finale; f.t += dt; const t = f.t;
      timeScale = t < .3 ? .05 : t < 1.9 ? .28 : t < 3.4 ? .6 : 1;
      if (t > 1.6 && !f.s2) { f.s2 = true; snd('glass-break', .6, { max: 1000 }); snd('clank-a', .5, { max: 600 }); spark(BX, CEIL, 40, '#ffb347', 320); shake = 16; }
      if (t > 1.6) f.gr = Math.min(.5, (t - 1.6) * .4);
      if (t > 3.1 && !f.portals && !f.closed) {
        f.portals = true; portals.orange = { x: BX, y: CEIL, nx: 0, ny: 1, color: 'orange', t: 0 }; portals.blue = { x: BX, y: FLOOR, nx: 0, ny: -1, color: 'blue', t: 0 };
        snd('open', .5, { max: 700 }); spark(BX, CEIL, 20, '#ff9a2e', 200); spark(BX, FLOOR, 20, '#4aa8ff', 200);
        say('f1', 'She\'s falling through! Forever! That is the best thing I have EVER seen!', 3000);
      }
      if (f.portals) {
        f.gvy = Math.min(1900, f.gvy + (600 + f.loops * 320) * dt); f.gy += f.gvy * dt;
        if (f.gy > FL) { f.gy -= FL; f.loops++; shake = Math.max(shake, 10 + f.loops * 4); snd(f.loops % 2 ? 'boom-a' : 'boom-b', .4, { max: 800 }); }
        f.ghosts.push({ y: f.gy, t: .25 }); if (f.ghosts.length > 9) f.ghosts.shift();
      }
      f.ghosts.forEach(g => g.t -= dt);
      if (t > 7.6 && f.portals) { f.portals = false; f.closed = true; portals.blue = portals.orange = null; snd('open', .5, { max: 600, rate: .6 }); spark(BX, FLOOR, 30, '#4aa8ff', 260); spark(BX, CEIL, 30, '#ff9a2e', 260); say('f2', 'And she\'s about to land. Oh no. Oh yes. Oh, both.', 1800); }
      if (f.closed && !f.slam) { f.gvy = Math.min(1900, f.gvy + 1600 * dt); f.gy += f.gvy * dt; if (f.gy >= FL - 252 || t > 9.2) { f.gy = FL - 252; f.slam = true; slam(); } }
      if (t > 10.6 && !f.dark) f.dark = 1;
      f.white = Math.max(0, f.white - dt * 1.4);
      if (t > 10.2 && !f.s3) { f.s3 = true; say('f3', 'Is she off? She\'s off. We did it. You did it. I stood nearby.', 2400); }
      if (t > 12.6 && !f.done) { f.done = true; cleanup(); root.classList.add('out'); setTimeout(() => { root.remove(); onEnd(true); }, 600); }
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
    function drawBackground() {
      ctx.fillStyle = '#12161b'; ctx.fillRect(0, 0, W, H);
      for (let x = LW; x < RW; x += 64) for (let y = CEIL; y < FLOOR; y += 48) { ctx.fillStyle = ((x / 64 + y / 48) & 1) ? '#1c232a' : '#191f25'; ctx.fillRect(x + 1, y + 1, 62, 46); }
      ctx.fillStyle = '#0b0e11'; ctx.fillRect(0, 0, W, CEIL); ctx.fillRect(0, FLOOR, W, H - FLOOR); ctx.fillRect(0, 0, LW, H); ctx.fillRect(RW, 0, W - RW, H);
      ctx.fillStyle = '#3a4450'; ctx.fillRect(LW, FLOOR - 2, RW - LW, 3);
      ctx.fillStyle = '#ff8a1f'; ctx.fillRect(LW, CEIL - 3, RW - LW, 3);
      // the incinerator
      const open = G.incOpen > 0;
      ctx.fillStyle = open ? '#000' : '#2a313a'; ctx.fillRect(INC.x - INC.half, FLOOR - 3, INC.half * 2, 7);
      if (open) { const gl = ctx.createLinearGradient(0, FLOOR - 60, 0, FLOOR); gl.addColorStop(0, 'rgba(255,138,31,0)'); gl.addColorStop(1, 'rgba(255,138,31,.8)'); ctx.fillStyle = gl; ctx.fillRect(INC.x - INC.half, FLOOR - 60, INC.half * 2, 60); }
      else { ctx.fillStyle = '#4a5560'; for (let i = 0; i < 6; i++) ctx.fillRect(INC.x - INC.half + 6 + i * 12, FLOOR - 3, 4, 6); }
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
      const col = p.color === 'blue' ? '#4aa8ff' : '#ff9a2e', open = Math.min(1, p.t / .15);
      ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.nx ? 0 : Math.PI / 2);
      ctx.fillStyle = '#000'; ctx.beginPath(); ctx.ellipse(0, 0, 10 * open, 34 * open, 0, 0, 6.28); ctx.fill();
      ctx.lineWidth = 4; ctx.strokeStyle = col; ctx.shadowColor = col; ctx.shadowBlur = 14; ctx.stroke(); ctx.restore();
    }
    function glados(y, rot, ghost, dark, clip) {
      ctx.save();
      if (clip) { ctx.beginPath(); ctx.rect(clip.x, clip.y, clip.w, clip.h); ctx.clip(); }
      if (ghost) { ctx.globalAlpha = Math.max(0, ghost) * 1.2; ctx.globalCompositeOperation = 'lighter'; }
      ctx.translate(BX + (G.flash > 0 && !finale ? Math.sin(time * 80) * 3 : 0), CEIL + y); if (rot) ctx.rotate(rot);
      spr(ctx, 'glados-' + G.frame, 0, 0, { ax: .5, ay: 0, s: GS });
      if (G.flash > 0 && !finale) { ctx.globalAlpha = .45; ctx.globalCompositeOperation = 'lighter'; spr(ctx, 'glados-' + G.frame, 0, 0, { ax: .5, ay: 0, s: GS }); }
      if (dark) { ctx.globalCompositeOperation = 'source-atop'; ctx.fillStyle = 'rgba(0,0,0,.65)'; ctx.fillRect(-80, 0, 160, 330); }
      ctx.restore();
    }
    function draw() {
      const f = finale;
      ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, H);
      ctx.save();
      let zoom = baseZoom, camX = W / 2, camY = H / 2;
      if (!f) {
        const vh = H / zoom, tx = clamp(P.cx + P.face * 50, W / 2 / zoom, W - W / 2 / zoom), ty = clamp(P.cy - 40, CEIL - 20 + vh / 2, Math.max(CEIL - 20 + vh / 2, FLOOR + 36 - vh / 2));
        camNow.x += (tx - camNow.x) * .12; camNow.y += (ty - camNow.y) * .12; camX = camNow.x; camY = camNow.y;
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
      // GLaDOS
      if (f && f.t > 1.6) {
        const band = { x: LW, y: CEIL, w: RW - LW, h: FL };
        if (f.portals) { f.ghosts.forEach(g => glados(g.y, f.gr * .35 * Math.sin(f.t * 3), g.t, false, band)); glados(f.gy, f.gr * .35 * Math.sin(f.t * 3), 0, !!f.dark, band); glados(f.gy - FL, f.gr * .35 * Math.sin(f.t * 3), 0, !!f.dark, band); }
        else glados(f.gy, f.slam ? 0 : f.gr * .35 * Math.sin(f.t * 3), 0, !!f.dark, { x: LW, y: 0, w: RW - LW, h: FLOOR + 2 });
      } else {
        glados(0, 0, 0, false);
        cores.forEach((c, i) => { if (c.state === 'attached') { const s = [[-42, 56], [-38, 102], [6, 107], [0, 65]][i]; spr(ctx, CORES[i].spr, BX + s[0] * 1.2, CEIL + s[1] * 1.5, { s: 1 }); } });
        ctx.fillStyle = `rgba(255,170,60,${.35 + .25 * Math.sin(time * 5)})`; ctx.beginPath(); ctx.arc(BX + 30, CEIL + 235, 5, 0, 6.28); ctx.fill();
      }
      // the revolving button with its glass
      if (G.mode === 'incinerate' && !f) {
        const bx = BX + Math.cos(G.button.a) * 105, by = CEIL + 130 + Math.sin(G.button.a) * 130;
        ctx.fillStyle = G.glass > 0 ? '#d8dde2' : '#c93a3a'; ctx.beginPath(); ctx.arc(bx, by, 11, 0, 6.28); ctx.fill();
        ctx.strokeStyle = '#2a313a'; ctx.lineWidth = 3; ctx.stroke();
        if (G.glass > 0) { ctx.fillStyle = 'rgba(190,225,255,.45)'; ctx.beginPath(); ctx.arc(bx, by, 17, 0, 6.28); ctx.fill(); ctx.strokeStyle = 'rgba(210,235,255,.9)'; ctx.lineWidth = 2; ctx.stroke(); ctx.fillStyle = '#9ec7ea'; ctx.font = '9px monospace'; ctx.textAlign = 'center'; ctx.fillText(String(Math.max(0, G.glass)), bx, by - 22); }
      }
      portals.blue && drawPortal(portals.blue); portals.orange && drawPortal(portals.orange);
      // ceiling turrets and the floor turret
      [-120, 120].forEach(dx => spr(ctx, 'turret', BX + dx, CEIL + 36, { s: .42, rot: Math.PI }));
      if (G.mode === 'turret' && !f) {
        const k = G.turretOut, ty = FLOOR - 4 - 26 * k;
        ctx.save(); ctx.beginPath(); ctx.rect(INC.x - 40, 0, 80, FLOOR); ctx.clip();
        ctx.translate(INC.x, ty); ctx.rotate(G.aim); spr(ctx, 'turret', 0, 0, { s: .35, rot: 0 }); ctx.restore();
        if (G.warn > 0) { ctx.strokeStyle = 'rgba(255,60,60,.55)'; ctx.setLineDash([6, 5]); ctx.beginPath(); ctx.moveTo(INC.x, FLOOR - 30); ctx.lineTo(INC.x + Math.cos(G.aim) * 900, FLOOR - 30 + Math.sin(G.aim) * 900); ctx.stroke(); ctx.setLineDash([]); }
        if (G.laser) { const on = G.laser.t > 100 * TICK; ctx.fillStyle = on ? '#ff3b3b' : 'rgba(255,60,60,.25)'; ctx.fillRect(INC.x - (on ? 12 : 3), CEIL, on ? 24 : 6, FLOOR - CEIL); }
      }
      cores.forEach(c => { if (c.state === 'loose') { ctx.save(); ctx.translate(c.x, c.y); ctx.rotate(c.x * .04); spr(ctx, CORES[c.i].spr, 0, 0, { s: 1 }); ctx.restore(); } });
      drawLooey();
      if (!f || f.t < 3) { /* the carry slot is unused: cores are knocked, not carried */ }
      spr(ctx, 'wheatley', P.cx - P.face * 30, P.cy - P.h - 14 + Math.sin(time * 3) * 3, { s: .22, flip: P.face < 0 });
      rockets.forEach(r => {
        r.trail.forEach(t => { ctx.fillStyle = 'rgba(255,200,120,.3)'; ctx.fillRect(t.x - 2, t.y - 2, 4, 4); });
        spr(ctx, 'rocket', r.cx, r.cy, { rot: r.ang, s: 1.2 });
        if (r.through) { ctx.strokeStyle = '#ffe08a'; ctx.beginPath(); ctx.arc(r.cx, r.cy, 12, 0, 6.28); ctx.stroke(); }
      });
      bolts.forEach(b => { ctx.fillStyle = '#ff7ad9'; ctx.shadowColor = '#ff7ad9'; ctx.shadowBlur = 8; ctx.fillRect(b.cx - 3, b.cy - 3, 6, 6); ctx.shadowBlur = 0; });
      shots.forEach(s => { const k = s.t / s.dur; ctx.fillStyle = s.color === 'blue' ? '#4aa8ff' : '#ff9a2e'; ctx.fillRect(s.x + (s.tx - s.x) * k - 3, s.y + (s.ty - s.y) * k - 3, 6, 6); });
      booms.forEach(b => { const fr = Math.min(4, Math.floor(b.t / .45 * 5)); spr(ctx, 'boom-' + fr, b.x, b.y, { s: 3 * b.s }); });
      parts.forEach(q => { ctx.globalAlpha = Math.max(0, q.life / q.max); ctx.fillStyle = q.col; ctx.fillRect(q.x, q.y, q.size, q.size); ctx.globalAlpha = 1; });
      if (!f) { ctx.strokeStyle = 'rgba(255,255,255,.45)'; ctx.beginPath(); ctx.arc(aim.x, aim.y, 6, 0, 6.28); ctx.moveTo(aim.x - 10, aim.y); ctx.lineTo(aim.x + 10, aim.y); ctx.moveTo(aim.x, aim.y - 10); ctx.lineTo(aim.x, aim.y + 10); ctx.stroke(); }
      ctx.restore();
      // the TV countdown sits above the arena
      if (clockOn && !f) { ctx.fillStyle = 'rgba(0,0,0,.6)'; ctx.fillRect(W / 2 - 46, 6, 92, 24); ctx.fillStyle = clock < 30 ? '#ff5252' : '#9dff3a'; ctx.font = 'bold 18px monospace'; ctx.textAlign = 'center'; ctx.fillText(fmtClock(clock), W / 2, 25); }
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
      if (lost) { ctx.fillStyle = 'rgba(0,0,0,.6)'; ctx.fillRect(0, 0, W, H); ctx.fillStyle = '#fff'; ctx.font = 'bold 28px monospace'; ctx.textAlign = 'center'; ctx.fillText('TEST FAILED', W / 2, H / 2); }
    }
    root._step = sec => { for (let t = 0; t < sec; t += 1 / 60) update(1 / 60); };
    const fmtClock = s => Math.floor(s / 60) + ':' + String(Math.floor(s % 60)).padStart(2, '0');

    /* ---- hud */
    const coresEl = $('.ap-cores', root), clockEl = $('.ap-clock', root);
    const hud = () => {
      $('.ap-bar.hp i', root).style.width = clamp(P.hp / D.hp, 0, 1) * 100 + '%';
      coresEl.innerHTML = cores.map((c, i) => `<span class="${c.state}" title="${CORES[i].name} Core"></span>`).join('');
      clockEl.textContent = clockOn ? fmtClock(clock) : '--:--';
      clockEl.classList.toggle('low', clockOn && clock < 30);
    };
    const hudId = setInterval(() => { if (!root.isConnected) { clearInterval(hudId); return; } hud(); }, 120);

    const frame = now => {
      if (!root.isConnected || ended && !finale) return;
      let dt = Math.min(.05, (now - lastFrame) / 1000); lastFrame = now;
      if (hitstop > 0) { hitstop -= dt; dt = 0; }
      update(dt * (finale ? timeScale : 1));
      draw();
      if (root.isConnected) requestAnimationFrame(frame);
    };
    Promise.all([atlasReady, sfxReady]).then(() => requestAnimationFrame(t => { lastFrame = t; frame(t); }));
  }
  return { play, DIFFS };
})();
