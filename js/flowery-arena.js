/* flowery-arena.js - the final fight's stage and its bullet box, after Chapter 5's Flowery battle:
   the vine tower between red curtains, the party on floating flowers, Flowery on the right in his cape, and a side-on
   bullet box (green rails, scrolling lanes) where a small flower soul moves with the arrows and dashes with [Z].
   FlArena.bg(ctx, t, o)      draws the stage (o.sunset 0..1 fades in the cliffs' sunset behind the tower)
   FlArena.pad(ctx, x, y, i)  a floating flower under a party member
   FlArena.dodge(B, spec)     runs one enemy turn in the box; resolves { hits, grazed } */
'use strict';

const FlArena = (() => {
  const P = () => window.FlPack;
  const VW = 320, VH = 240;
  const cl = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
  const rnd = (a, b) => a + Math.random() * (b - a);
  const pick = a => a[Math.floor(Math.random() * a.length)];

  /* ------------------------------------------------------------------ stage */
  let vinePat = null, vineSrc = null;
  function vinePattern(ctx) {
    if (vinePat) return vinePat;
    if (!P().has('towery_vines_0')) return null;
    vineSrc = document.createElement('canvas'); vineSrc.width = 180; vineSrc.height = 180;
    const x = vineSrc.getContext('2d'); x.imageSmoothingEnabled = false;
    x.fillStyle = '#18240f'; x.fillRect(0, 0, 180, 180);
    P().draw(x, 'towery_vines_depth_0', 0, 0, { ax: 0, ay: 0, alpha: .9 });
    P().draw(x, 'towery_vines_0', 0, 0, { ax: 0, ay: 0 });
    x.globalCompositeOperation = 'multiply'; x.fillStyle = '#4c7a3e'; x.fillRect(0, 0, 180, 180);
    x.globalCompositeOperation = 'source-over';
    vinePat = ctx.createPattern(vineSrc, 'repeat');
    return vinePat;
  }
  // flowers and leaves stuck on the tower, scrolling with it
  const DECOR = Array.from({ length: 22 }, (_, i) => ({ x: 6 + ((i * 47) % 70), y: (i * 61) % 260, f: i % 3 === 0 ? 'leaf' : 'flower', k: i }));
  function tower(ctx, t, o = {}) {
    const x0 = o.x == null ? 124 : o.x, w = o.w || 84, scroll = (t * (o.speed == null ? 6 : o.speed)) % 180;
    const pat = vinePattern(ctx);
    ctx.save();
    ctx.beginPath(); ctx.rect(x0, 0, w, VH); ctx.clip();
    if (pat) { ctx.translate(x0, -scroll); ctx.fillStyle = pat; ctx.fillRect(0, 0, w, VH + 180); ctx.translate(-x0, scroll); }
    else { ctx.fillStyle = '#26401c'; ctx.fillRect(x0, 0, w, VH); }
    DECOR.forEach(d => {
      const y = ((d.y - t * (o.speed == null ? 6 : o.speed)) % 260 + 260) % 260 - 10;
      if (d.f === 'flower') { P().draw(ctx, 'fcastle_tower_flower_' + (d.k % 24), x0 + d.x, y, { ax: .5, ay: .5, alpha: .9 }); P().draw(ctx, 'fcastle_tower_flower_' + (d.k % 24), x0 + d.x, y, { ax: .5, ay: .5, tint: '#8e62b8', alpha: .55 }); }
      else P().draw(ctx, 'fcastle_tower_leaf_' + (d.k % 24), x0 + d.x, y, { ax: .5, ay: .5, alpha: .55 });
    });
    // round the column off
    const g = ctx.createLinearGradient(x0, 0, x0 + w, 0);
    g.addColorStop(0, 'rgba(0,0,0,.65)'); g.addColorStop(.18, 'rgba(0,0,0,0)'); g.addColorStop(.75, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(0,0,0,.7)');
    ctx.fillStyle = g; ctx.fillRect(x0, 0, w, VH);
    ctx.restore();
  }
  function curtains(ctx, alpha = 1) {
    ctx.save(); ctx.globalAlpha = alpha;
    [[0, 26], [VW - 26, 26], [44, 12], [VW - 56, 12]].forEach(([x, w], i) => {
      const g = ctx.createLinearGradient(x, 0, x + w, 0);
      g.addColorStop(0, '#1a0204'); g.addColorStop(.5, i < 2 ? '#4a0a10' : '#2c0509'); g.addColorStop(1, '#1a0204');
      ctx.fillStyle = g; ctx.fillRect(x, 0, w, VH);
    });
    ctx.restore();
  }
  function sunset(ctx, t, k) {
    if (k <= 0) return;
    ctx.save(); ctx.globalAlpha = k;
    const g = ctx.createLinearGradient(0, 0, 0, VH);
    g.addColorStop(0, '#ff6a3a'); g.addColorStop(.45, '#ffb24a'); g.addColorStop(.62, '#ff8fb0'); g.addColorStop(1, '#e8608e');
    ctx.fillStyle = g; ctx.fillRect(0, 0, VW, VH);
    ctx.fillStyle = '#ffe766'; ctx.beginPath(); ctx.arc(262, 132, 26, Math.PI, 0); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,.35)';
    for (let i = 0; i < 5; i++) ctx.fillRect(220 + i * 4, 136 + i * 6, 80 - i * 10, 2);
    ctx.restore();
  }
  // falling leaves/petals drifting across the stage
  const DRIFT = Array.from({ length: 26 }, (_, i) => ({ x: (i * 53) % VW, y: (i * 37) % VH, s: .6 + (i % 4) * .2, k: i }));
  function drift(ctx, t, col) {
    DRIFT.forEach(p => {
      const x = ((p.x - t * 24 * p.s) % VW + VW) % VW, y = ((p.y + t * 18 * p.s) % VH + VH) % VH;
      ctx.save(); ctx.translate(x, y); ctx.rotate(t * 2 + p.k); ctx.fillStyle = col || (p.k % 3 ? 'rgba(230,214,150,.75)' : 'rgba(170,140,90,.7)');
      ctx.fillRect(-3, -1.5, 6, 3); ctx.restore();
    });
  }
  function bg(ctx, t, o = {}) {
    ctx.fillStyle = '#000'; ctx.fillRect(0, 0, VW, VH);
    sunset(ctx, t, o.sunset || 0);
    curtains(ctx, 1 - (o.sunset || 0) * .85);
    tower(ctx, t, o);
    drift(ctx, t);
  }
  const PADS = ['flowery_floating_flower1_', 'flowery_floating_flower1_susie_', 'flowery_floating_flower1_centered_', 'flowery_floating_flower1_ralsei_'];
  const PADTINT = ['#ffb347', '#ff8fb0', '#ffe95c', null];
  function pad(ctx, x, y, i, t) {
    const n = PADS[i % 4] + (Math.floor(t * 4 + i) % 3);
    P().draw(ctx, n, x, y + 6 + Math.sin(t * 2 + i) * 1, { ax: .5, ay: .5, s: 1.1 });
    if (PADTINT[i % 4]) P().draw(ctx, n, x, y + 6 + Math.sin(t * 2 + i) * 1, { ax: .5, ay: .5, s: 1.1, tint: PADTINT[i % 4], alpha: .45 });
  }

  /* ------------------------------------------------------------------ the bullet box */
  const BOX = { x: 22, y: 64, w: 276, h: 108 };
  const segDist = (px, py, x1, y1, x2, y2) => {
    const dx = x2 - x1, dy = y2 - y1, l = dx * dx + dy * dy || 1, k = cl(((px - x1) * dx + (py - y1) * dy) / l);
    return Math.hypot(px - (x1 + dx * k), py - (y1 + dy * k));
  };
  function drawSoul(ctx, s, t) {
    if (s.inv > 0 && Math.floor(t * 20) % 2) return;
    s.trail.forEach((p, i) => { ctx.globalAlpha = (i + 1) / s.trail.length * .35; ctx.fillStyle = '#ffb347'; ctx.beginPath(); ctx.arc(p.x, p.y, 3, 0, 7); ctx.fill(); });
    ctx.globalAlpha = 1;
    ctx.save(); ctx.translate(s.x, s.y);
    ctx.fillStyle = '#ff9a2e';
    for (let i = 0; i < 5; i++) { const a = i / 5 * Math.PI * 2 + t * 3; ctx.beginPath(); ctx.arc(Math.cos(a) * 2.6, Math.sin(a) * 2.6, 1.8, 0, 7); ctx.fill(); }
    ctx.fillStyle = '#ffe766'; ctx.beginPath(); ctx.arc(0, 0, 1.7, 0, 7); ctx.fill();
    ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.moveTo(6, 0); ctx.lineTo(3.5, -2); ctx.lineTo(3.5, 2); ctx.fill();
    ctx.restore();
  }

  /* spec: { dur, pattern(D) (sets up timers), power, onHit(power, bullet), onGraze(), label } */
  function dodge(B, spec) {
    return new Promise(done => {
      const D = { t: 0, box: BOX, bullets: [], timers: [], fx: [], hits: 0, grazed: 0, ended: false, phase: spec.phase || 1 };
      FlArena._D = D;
      const s = D.soul = { x: BOX.x + 40, y: BOX.y + BOX.h / 2, inv: 0, dash: 0, dashCd: 0, dx: 1, dy: 0, trail: [] };
      const keys = {};
      D.at = (time, fn) => D.timers.push({ at: time, fn });
      D.every = (from, gap, until, fn) => { for (let k = from, i = 0; k < until; k += gap, i++) { const ii = i; D.at(k, () => fn(ii)); } };
      D.add = b => { b.t = 0; b.life = b.life == null ? 9 : b.life; D.bullets.push(b); return b; };
      D.warnLine = (y, ms, col) => D.fx.push({ k: 'row', y, life: ms / 1000, col: col || '#ff4a4a' });
      D.warnCol = (x, ms, col) => D.fx.push({ k: 'col', x, life: ms / 1000, col: col || '#ff4a4a' });
      D.rowY = () => BOX.y + 10 + Math.random() * (BOX.h - 20);
      // lanes scroll like the game's
      let lane = 0;
      const kd = e => {
        const k = e.code;
        if (/^Arrow|^Key[WASDZX]$|^Space$|^Enter$/.test(k)) { e.preventDefault(); e.stopPropagation(); }
        if (keys[k]) return; keys[k] = true;
        if ((k === 'KeyZ' || k === 'Space' || k === 'Enter') && s.dashCd <= 0) dash();
      };
      const ku = e => { keys[e.code] = false; };
      function dash() {
        const dx = (keys.ArrowRight || keys.KeyD ? 1 : 0) - (keys.ArrowLeft || keys.KeyA ? 1 : 0), dy = (keys.ArrowDown || keys.KeyS ? 1 : 0) - (keys.ArrowUp || keys.KeyW ? 1 : 0);
        if (dx || dy) { const l = Math.hypot(dx, dy); s.dx = dx / l; s.dy = dy / l; } else { s.dx = 1; s.dy = 0; }
        s.dash = .16; s.dashCd = .38; s.inv = Math.max(s.inv, .2); FW.sfx('graze', { vol: .25, rate: 1.4 });
      }
      // touch: drag to steer, tap to dash
      let ptr = null, ptrT = 0;
      const toBox = e => { const r = B.cv.getBoundingClientRect(); return { x: (e.clientX - r.left) / r.width * VW, y: (e.clientY - r.top) / r.height * VH }; };
      const pd = e => { e.preventDefault(); ptr = toBox(e); ptrT = performance.now(); };
      const pm = e => { if (ptr) ptr = toBox(e); };
      const pu = () => { if (ptr && performance.now() - ptrT < 180 && s.dashCd <= 0) dash(); ptr = null; };
      document.addEventListener('keydown', kd, true); document.addEventListener('keyup', ku, true);
      B.cv.addEventListener('pointerdown', pd); window.addEventListener('pointermove', pm); window.addEventListener('pointerup', pu);
      const prev = { c: B.onConfirm, d: B.onDir, b: B.onBack }; B.onConfirm = B.onDir = B.onBack = null;
      let fade = 0;

      const hurt = b => {
        if (s.inv > 0 || D.ended) return;
        s.inv = 1; D.hits++; B.shake = 6; FW.sfx('hurt1', { vol: .5 });
        if (spec.onHit) spec.onHit(b.power || spec.power || 1, b);
      };
      const over = ctx => {
        const dt = Math.min(.05, B._dDt || 1 / 60);
        fade = cl(fade + dt * (D.ended ? -5 : 5));
        ctx.globalAlpha = fade * .97; ctx.fillStyle = '#000'; ctx.fillRect(0, 0, VW, VH); ctx.globalAlpha = 1;
        if (fade < .05 && D.ended) return;
        ctx.save(); ctx.globalAlpha = fade;
        // rails and lanes
        ctx.save(); ctx.beginPath(); ctx.rect(BOX.x, BOX.y, BOX.w, BOX.h); ctx.clip();
        lane = (lane + dt * (spec.laneSpeed || 70)) % 46;
        ctx.fillStyle = 'rgba(120,120,130,.55)';
        for (let x = BOX.x + BOX.w - lane; x > BOX.x - 10; x -= 46) ctx.fillRect(Math.round(x), BOX.y, 3, BOX.h);
        if (spec.backdrop) spec.backdrop(ctx, D);
        // warnings
        D.fx.forEach(f => {
          f.life -= dt; const a = Math.floor(D.t * 14) % 2 ? .75 : .3;
          ctx.globalAlpha = fade * a; ctx.fillStyle = f.col;
          if (f.k === 'row') ctx.fillRect(BOX.x, f.y - 6, BOX.w, 12);
          else ctx.fillRect(f.x - 6, BOX.y, 12, BOX.h);
          ctx.globalAlpha = fade;
        });
        D.fx = D.fx.filter(f => f.life > 0);
        D.bullets.forEach(b => { if (b.draw) { ctx.save(); b.draw(ctx, b, D); ctx.restore(); } else { ctx.fillStyle = b.col || '#fff'; ctx.beginPath(); ctx.arc(b.x, b.y, b.r || 4, 0, 7); ctx.fill(); } });
        drawSoul(ctx, s, D.t);
        ctx.restore();
        ctx.strokeStyle = '#27ff3c'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(BOX.x - 4, BOX.y); ctx.lineTo(BOX.x + BOX.w + 4, BOX.y); ctx.moveTo(BOX.x - 4, BOX.y + BOX.h); ctx.lineTo(BOX.x + BOX.w + 4, BOX.y + BOX.h); ctx.stroke();
        if (spec.label && D.t < 1.6) FlowerCuts.text(ctx, spec.label, VW / 2, BOX.y - 12, { size: 9, color: '#ffe066', alpha: cl(1.6 - D.t) });
        if (D.t < 2.2 && spec.tutorial) FlowerCuts.text(ctx, '[ARROWS] move   [Z] dash', VW / 2, BOX.y + BOX.h + 12, { size: 8, color: '#fff', alpha: cl(2.2 - D.t) * .9 });
        ctx.restore();
      };
      const step = dt => {
        if (D.ended) return;
        D.t += dt;
        D.timers = D.timers.filter(tm => { if (D.t >= tm.at) { tm.fn(); return false; } return true; });
        if (spec.tick) spec.tick(D, dt);
        // move the soul
        let mx = (keys.ArrowRight || keys.KeyD ? 1 : 0) - (keys.ArrowLeft || keys.KeyA ? 1 : 0), my = (keys.ArrowDown || keys.KeyS ? 1 : 0) - (keys.ArrowUp || keys.KeyW ? 1 : 0);
        if (ptr) { const dx = ptr.x - s.x, dy = ptr.y - s.y, l = Math.hypot(dx, dy); if (l > 3) { mx = dx / l; my = dy / l; } }
        const sp = 105;
        if (s.dash > 0) { s.x += s.dx * 460 * dt; s.y += s.dy * 460 * dt; s.dash -= dt; }
        else { const l = Math.hypot(mx, my) || 1; s.x += mx / l * sp * dt; s.y += my / l * sp * dt; }
        s.x = cl(s.x, BOX.x + 4, BOX.x + BOX.w - 4); s.y = cl(s.y, BOX.y + 4, BOX.y + BOX.h - 4);
        s.inv = Math.max(0, s.inv - dt); s.dashCd = Math.max(0, s.dashCd - dt);
        s.trail.push({ x: s.x, y: s.y }); if (s.trail.length > (s.dash > 0 ? 8 : 3)) s.trail.shift();
        // bullets
        D.bullets.forEach(b => {
          b.t += dt; b.life -= dt;
          if (b.upd) b.upd(b, dt, D); else { b.x += (b.vx || 0) * dt; b.y += (b.vy || 0) * dt; }
          if (b.t < (b.armT || 0) || b.safe) return;
          let d;
          if (b.seg) d = segDist(s.x, s.y, ...b.seg) - (b.thick || 3);
          else if (b.w) d = Math.max(Math.abs(s.x - b.x) - b.w / 2, Math.abs(s.y - b.y) - b.h / 2);
          else d = Math.hypot(s.x - b.x, s.y - b.y) - (b.r || 4);
          if (d < 2) hurt(b);
          else if (d < 12 && s.inv <= 0) { D.grazed += dt; if (spec.onGraze) spec.onGraze(dt); }
        });
        D.bullets = D.bullets.filter(b => b.life > 0 && b.x > -120 && b.x < VW + 160 && b.y > -160 && b.y < VH + 160);
        if (D.t >= spec.dur) finish();
      };
      function finish() {
        D.ended = true;
        document.removeEventListener('keydown', kd, true); document.removeEventListener('keyup', ku, true);
        B.cv.removeEventListener('pointerdown', pd); window.removeEventListener('pointermove', pm); window.removeEventListener('pointerup', pu);
        const tick0 = B.tick; B.tick = tick0 === tickF ? null : tick0;
        setTimeout(() => { const i = B.over.indexOf(over); if (i >= 0) B.over.splice(i, 1); B.onConfirm = prev.c; B.onDir = prev.d; B.onBack = prev.b; done({ hits: D.hits, grazed: D.grazed }); }, 260);
      }
      const tickF = dt => { B._dDt = dt; step(dt); };
      B.over.push(over); B.tick = tickF;
      if (spec.pattern) spec.pattern(D);
      if (FW.test) { D.t = spec.dur; finish(); }
    });
  }

  /* ------------------------------------------------------------------ patterns (Flowery's, and his friends') */
  const R = () => BOX.x + BOX.w + 20;           // spawn x, right of the box
  const sprite = (n, o = {}) => (ctx, b) => P().draw(ctx, typeof n === 'function' ? n(b) : n, b.x, b.y, Object.assign({ ax: .5, ay: .5 }, o, { rot: b.rot || 0 }));
  const flowerBullet = (D, x, y, vx, vy, o = {}) => D.add(Object.assign({ x, y, vx, vy, r: 4, draw: sprite('flowery_bullet_0', { s: .9 }) }, o));
  const petal = (D, x, y, vx, vy) => D.add({ x, y, vx, vy, r: 4, rot: 0, upd: (b, dt) => { b.x += b.vx * dt; b.y += b.vy * dt; b.rot += dt * 6; }, draw: sprite(b => 'spinning_petal_' + (Math.floor(b.t * 10) % 4), { s: .7 }) });
  const PAT = {
    // Flowery zips across a row, leaving a smear of himself (after a red warning)
    dash(D, n = 4) {
      D.every(.4, 1.25 - D.phase * .1, .4 + n * (1.25 - D.phase * .1), () => {
        const y = Math.random() < .55 ? D.soul.y : D.rowY();
        D.warnLine(y, 520);
        D.at(D.t + .55, () => {
          FW.sfx('wing', { vol: .35 });
          D.add({ x: R() + 20, y, vx: -560, vy: 0, w: 34, h: 18, ghosts: [],
            upd: (b, dt) => { b.ghosts.unshift(b.x); b.ghosts.length = 6; b.x += b.vx * dt; },
            draw: (ctx, b) => { b.ghosts.forEach((gx, i) => gx && P().draw(ctx, 'flowery_fair_left_0', gx + i * 10, b.y + 14, { alpha: .18 * (6 - i) / 6, tint: '#8fd8ff' })); P().draw(ctx, 'flowery_fair_left_0', b.x, b.y + 14, {}); } });
        });
      });
      D.every(.2, .45, 1.25 * n, () => flowerBullet(D, R(), D.rowY(), -90 - D.phase * 15, rnd(-10, 10)));
    },
    // walls of light with a gap, scrolling in
    pillars(D, n = 5, col = '#ffffff') {
      D.every(.3, 1.05 - D.phase * .08, .3 + n * (1.05 - D.phase * .08), i => {
        const gap = 30 - D.phase * 2, gy = BOX.y + 14 + Math.random() * (BOX.h - 28 - gap), x = R();
        const mk = (y0, y1) => D.add({ x, y: (y0 + y1) / 2, w: 6, h: y1 - y0, vx: -120 - D.phase * 12, col, draw: (ctx, b) => { ctx.fillStyle = col; ctx.fillRect(b.x - 3, b.y - b.h / 2, 6, b.h); ctx.fillStyle = 'rgba(255,255,255,.5)'; ctx.fillRect(b.x - 1, b.y - b.h / 2, 2, b.h); } });
        mk(BOX.y - 4, gy); mk(gy + gap, BOX.y + BOX.h + 4);
      });
    },
    petals(D, dur = 6) {
      D.every(.1, .16 - D.phase * .02, dur, () => petal(D, R() - Math.random() * 120, BOX.y - 10, rnd(-110, -60), rnd(50, 90)));
    },
    // the spiked vine wall creeps in from the left; flowers come from the right
    vines(D, dur = 6) {
      D.add({ x: BOX.x - 36, y: BOX.y + BOX.h / 2, w: 30, h: BOX.h + 20, life: dur + 1, upd: (b, dt, DD) => { b.x = BOX.x - 36 + Math.min(110, DD.t * 22) + Math.sin(DD.t * 5) * 3; },
        draw: (ctx, b) => { P().draw(ctx, 'chasewall_0', b.x - 10, b.y, { ax: .5, ay: .5, s: .45 }); } });
      D.every(.6, .5, dur, () => flowerBullet(D, R(), D.rowY(), -110 - D.phase * 10, 0));
    },
    // seven punches down the soul's row; the last one is huge
    jarona(D, o = {}) {
      const n = o.n || 7, gap = o.gap || .62;
      for (let i = 0; i < n; i++) {
        const t0 = .5 + i * gap;
        D.at(t0, () => {
          const y = D.soul.y, fake = o.fakes && o.fakes.includes(i);
          D.warnLine(y, 380, fake ? '#ffb347' : '#ff4a4a');
          if (o.onBeat) o.onBeat(i);
          D.at(D.t + .4, () => {
            FW.sfx('heavyswing', { vol: .4 });
            if (fake) { D.add({ x: R(), y: y + rnd(-14, 14), vx: -300, vy: 0, r: 7, draw: sprite(b => 'bullet_green_flame_' + (Math.floor(b.t * 10) % 4), { rot: -Math.PI / 2, s: .8 }) }); return; }
            const big = i === n - 1;
            D.add({ x: R() + 30, y, vx: big ? -380 : -480, vy: 0, w: big ? 46 : 26, h: big ? 32 : 16,
              draw: (ctx, b) => { P().draw(ctx, o.orange ? 'forange_glove_' + (Math.floor(b.t * 8) % 3) : 'flowery_puuunch_left_0', b.x, b.y + (o.orange ? 0 : 18), { ax: .5, ay: o.orange ? .5 : 1, s: big ? 1.3 : (o.orange ? .5 : .8), flip: !!o.orange }); } });
          });
        });
      }
    },
    // a blue charge straight through: he aims, then crosses the box twice
    charge(D) {
      [.6, 2.2].forEach(t0 => D.at(t0, () => {
        const y = D.soul.y; D.warnLine(y, 700, '#6ab0ff');
        D.at(D.t + .75, () => { FW.sfx('boost', { vol: .5 }); D.add({ x: R() + 40, y, vx: -700, w: 46, h: 30, ghosts: [],
          upd: (b, dt) => { b.ghosts.unshift(b.x); b.ghosts.length = 8; b.x += b.vx * dt; },
          draw: (ctx, b) => { b.ghosts.forEach((gx, i) => gx && P().draw(ctx, 'flowery_crouch_left_0', gx + i * 12, b.y + 16, { alpha: .2 * (8 - i) / 8, tint: '#3a7bff' })); P().draw(ctx, 'flowery_crouch_left_0', b.x, b.y + 16, { tint: '#6ab0ff', alpha: .9 }); } }); });
      }));
      D.every(.4, .8, 3.6, () => flowerBullet(D, R(), D.rowY(), -100, 0));
    },
    kick(D) {   // crescent arcs sweep down the box
      D.every(.5, .9 - D.phase * .1, 5, () => {
        const x = BOX.x + 30 + Math.random() * (BOX.w - 60);
        D.warnCol(x, 420, '#ffe066');
        D.at(D.t + .45, () => D.add({ x, y: BOX.y - 14, vy: 300, w: 26, h: 10, draw: (ctx, b) => { ctx.strokeStyle = '#ffe766'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(b.x, b.y - 8, 14, .3, Math.PI - .3); ctx.stroke(); } }));
      });
    },
    fire(D) {   // bouquets that pop into rings of petals
      D.every(.4, 1.1, 5, () => {
        const b0 = D.add({ x: R(), y: D.rowY(), vx: -140, vy: 0, r: 6, pop: 1.2 + Math.random() * .5, draw: sprite('flowery_circle_0', { s: .5 }) });
        D.at(D.t + b0.pop, () => { if (b0.life <= 0) return; b0.life = 0; for (let k = 0; k < 8; k++) { const a = k / 8 * Math.PI * 2; petal(D, b0.x, b0.y, Math.cos(a) * 80, Math.sin(a) * 80); } FW.sfx('bomb', { vol: .25 }); });
      });
    },
    // Seth's words fall as bars; Aqua's knives spin in arcs
    words(D) {
      const W = ['DREAM', 'KNIFE', 'TRUTH', 'AQUA', 'SETH', 'LIGHT', 'DARK', 'IMAGE', 'LIST', 'BRAVE'];
      D.every(.3, .62 - D.phase * .04, 6, i => {
        const x = BOX.x + 20 + Math.random() * (BOX.w - 40), txt = pick(W), down = i % 2 === 0;
        D.add({ x, y: down ? BOX.y - 30 : BOX.y + BOX.h + 30, vy: down ? 70 : -70, vx: -30, w: 12, h: 46, txt,
          draw: (ctx, b) => { ctx.translate(b.x, b.y); ctx.rotate(-Math.PI / 2); ctx.fillStyle = '#1c0b2c'; ctx.fillRect(-23, -6, 46, 12); ctx.strokeStyle = '#c49bff'; ctx.lineWidth = 1; ctx.strokeRect(-23, -6, 46, 12);
            FlowerCuts.text(ctx, b.txt, 0, 0, { size: 8, color: '#d9b8ff', stroke: 0 }); } });
      });
      D.every(1, 1.3, 6, () => {
        const y0 = D.rowY();
        D.add({ x: R(), y: y0, r: 6, a0: y0, upd: (b, dt) => { b.x -= 150 * dt; b.y = b.a0 + Math.sin(b.t * 5) * 22; }, draw: sprite(b => 'attack_knifechain_spin_' + (Math.floor(b.t * 14) % 4), { s: .9 }) });
      });
    },
    // Green: flames rise from the floor; a slow beam sweeps the box
    green(D) {
      D.every(.3, .5, 6, () => { const x = BOX.x + 10 + Math.random() * (BOX.w - 20); D.add({ x, y: BOX.y + BOX.h + 14, vy: -110 - D.phase * 10, vx: -20, r: 5, draw: sprite(b => 'bullet_green_flame_' + (Math.floor(b.t * 10) % 4), { s: .6 }) }); });
      D.at(1.2, () => {
        const cx = BOX.x + BOX.w / 2, cy = BOX.y + BOX.h / 2;
        D.add({ x: cx, y: cy, life: 4.2, armT: .9, seg: [0, 0, 0, 0], thick: 2.5, upd: (b, dt) => { const a = -1 + b.t * .55, L = 200; b.seg = [cx - Math.cos(a) * L, cy - Math.sin(a) * L, cx + Math.cos(a) * L, cy + Math.sin(a) * L]; },
          draw: (ctx, b) => { ctx.strokeStyle = b.t < b.armT ? 'rgba(80,255,90,.35)' : '#5cff6a'; ctx.lineWidth = b.t < b.armT ? 1 : 5; ctx.beginPath(); ctx.moveTo(b.seg[0], b.seg[1]); ctx.lineTo(b.seg[2], b.seg[3]); ctx.stroke(); } });
      });
    },
    // Yellow's reticles lock on, then fire; Blue's butterflies weave
    yellowBlue(D) {
      D.every(.5, 1.0 - D.phase * .08, 6, () => {
        const tx = D.soul.x, ty = D.soul.y;
        const r = D.add({ x: tx, y: ty, r: 9, safe: true, life: .9, draw: (ctx, b) => P().draw(ctx, 'enemy_yellow_reticle_0', b.x, b.y, { ax: .5, ay: .5, s: .8 + (1 - b.t) * .6, alpha: .9 }) });
        D.at(D.t + .85, () => { FW.sfx('bomb', { vol: .25 }); D.add({ x: r.x, y: r.y, r: 10, life: .18, draw: (ctx, b) => { ctx.fillStyle = '#fff6a0'; ctx.beginPath(); ctx.arc(b.x, b.y, 11, 0, 7); ctx.fill(); } }); });
      });
      D.every(.2, .7, 6, () => { const y0 = D.rowY(); D.add({ x: R(), y: y0, r: 5, a0: y0, upd: (b, dt) => { b.x -= 95 * dt; b.y = b.a0 + Math.sin(b.t * 4) * 16; }, draw: sprite(b => 'enemy_blue_bullet_butterfly_' + (Math.floor(b.t * 10) % 4), { s: .8 }) }); });
    },
    // Omega: everyone's bullets at once, in color
    omega(D) {
      PAT.dash(D, 3); PAT.petals(D, 5);
      D.every(.6, .35, 6, () => { const a = Math.random() * Math.PI * 2; D.add({ x: BOX.x + BOX.w + 10, y: D.rowY(), vx: -150, vy: Math.sin(a) * 30, r: 4, hue: Math.floor(Math.random() * 6),
        draw: (ctx, b) => { ctx.fillStyle = ['#5cff6a', '#4ff4ff', '#b07bff', '#ffd23a', '#7f9bff', '#ff8a4a'][b.hue]; ctx.beginPath(); ctx.arc(b.x, b.y, 4, 0, 7); ctx.fill(); } }); });
    }
  };


  /* the kingdom's Darkners, lending Flowery their power: pale ghosts around the tower, sparks flying into him */
  const GHOSTS = [['blockguy_overworld_0', 40, 96, 1.3], ['kawkaw_0', 112, 52, 1.1], ['mantis_idle_0', 206, 56, 1.1], ['npc_umbrellayokai_0', 270, 84, 1],
    ['npc_ramb_body_full_stone_0', 34, 214, 1.4], ['npc_zenlooker_0', 70, 150, 1.1], ['floradin_conductor_0', 268, 176, 1.1], ['enemy_floradin_0', 290, 226, 1]];
  function ghosts(ctx, t, k, tx, ty) {
    if (k <= 0) return;
    GHOSTS.forEach(([n, x, y, s], i) => {
      const a = cl(k * 1.4 - i * .08);
      if (a <= 0) return;
      const yy = y + Math.sin(t * 1.6 + i) * 2;
      P().draw(ctx, n, x, yy, { s, tint: '#b8c4e8', alpha: a * .55 });
      P().draw(ctx, n, x, yy, { s, alpha: a * .35 });
      // sparks leave each ghost for Flowery
      for (let j = 0; j < 3; j++) {
        const p = ((t * .7 + j / 3 + i * .13) % 1);
        const sx = x + (tx - x) * p, sy = yy - 16 * s + (ty - (yy - 16 * s)) * p - Math.sin(p * Math.PI) * 18;
        ctx.globalAlpha = a * (1 - p) * .9; ctx.fillStyle = '#fff';
        ctx.fillRect(Math.round(sx) - 1, Math.round(sy), 3, 1); ctx.fillRect(Math.round(sx), Math.round(sy) - 1, 1, 3);
        ctx.globalAlpha = 1;
      }
    });
  }

  return { ghosts, bg, tower, curtains, sunset, drift, pad, dodge, PAT, BOX };
})();
window.FlArena = FlArena;
