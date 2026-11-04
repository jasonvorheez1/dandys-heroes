/* flowery-cuts.js - Choreographed pixel-art & anime cutscenes for the "Flower Kingdom" event.
   Each cutscene renders via S.overlays in Deltarune's 320 x 240 canvas space using authentic
   Deltarune Chapter 5 sprites from flowery.bin (flowershop_0..4, castle_roof_1..2, flowerytree_0,
   superbloom_front_0..6, vfx_parry_*, finisher_explosion_*, omegaflowery_*, etc.). */
'use strict';

(() => {
  const P = () => window.FlPack;
  const VW = 320, VH = 240;
  const A = (typeof ASSET !== 'undefined' ? ASSET : './');
  const img = src => { const i = new Image(); i.src = A + src; return i; };
  const TW = {
    Boxten: img('assets/enemies/Twisteds/Boxten.png'),
    Dandy: img('assets/enemies/Twisteds/Dandy.png'),
    Brightney: img('assets/enemies/Twisteds/Brightney.webp'),
    Goob: img('assets/enemies/Twisteds/Goob.png'),
    Shrimpo: img('assets/enemies/Twisteds/Shrimpo.webp')
  };
  const ease = k => k * k * (3 - 2 * k);
  const cl = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
  const seg = (t, a, b) => cl((t - a) / (b - a));
  const lerp = (a, b, t) => a + (b - a) * cl(t);

  /* Cinema letterbox bars + skip indicator */
  function frame(ctx, t, secs, skip = true) {
    const a = Math.min(1, t * 3, (secs - t) * 3);
    ctx.save();
    ctx.globalAlpha = Math.max(0, a);
    ctx.fillStyle = '#05030a';
    ctx.fillRect(0, 0, VW, 14);
    ctx.fillRect(0, VH - 14, VW, 14);
    ctx.fillStyle = '#d9a45b';
    ctx.fillRect(0, 13, VW, 1);
    ctx.fillRect(0, VH - 14, VW, 1);
    if (skip) {
      ctx.font = 'bold 6px "Courier New", monospace';
      ctx.textAlign = 'right';
      ctx.fillStyle = '#dbc8a4';
      ctx.fillText('[Z / TAP] SKIP', VW - 6, VH - 4);
    }
    ctx.restore();
  }

  const FACE_FOR = {
    Flowery: 'face_flowery_27',
    'Omega Flowery': 'face_flowery_33',
    Ralsei: 'face_r_nohat_22',
    Asgore: 'asgore_lookback_sad_0'
  };
  const TOON_FOR = { Scraps: 'Scraps', Ginger: 'Ginger', Yatta: 'Yatta' };

  /* Authentic Deltarune dark-world pixel dialogue box with portrait & double border */
  function caption(ctx, t, beats) {
    const b = beats.find(([from, to]) => t >= from && t < to);
    if (!b) return;
    const [from, to, who, line, color = '#ffffff', faceOverride = null] = b;
    const a = Math.min(1, (t - from) * 6, (to - t) * 6);
    ctx.save();
    ctx.globalAlpha = Math.max(0, a);

    const bx = 8, by = 174, bw = VW - 16, bh = 50;
    ctx.fillStyle = '#000000';
    ctx.fillRect(bx - 1, by - 1, bw + 2, bh + 2);
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.strokeRect(bx, by, bw, bh);
    ctx.strokeStyle = '#2d1e42';
    ctx.lineWidth = 1;
    ctx.strokeRect(bx + 3, by + 3, bw - 6, bh - 6);

    let tx = bx + 10;
    const faceSpr = faceOverride || FACE_FOR[who];
    const toonId = TOON_FOR[who];
    if (faceSpr && P().has(faceSpr)) {
      const fs = faceSpr.startsWith('asgore_') ? 0.75 : 1;
      P().draw(ctx, faceSpr, bx + 24, by + bh - 6, { ax: 0.5, ay: 1, s: fs });
      tx = bx + 46;
    } else if (toonId) {
      toon(ctx, toonId, bx + 24, by + bh - 4, 38);
      tx = bx + 46;
    }

    ctx.textAlign = 'left';
    let ty = by + 13;
    if (who && who !== 'Narrator') {
      ctx.font = 'bold 8px "Courier New", monospace';
      ctx.fillStyle = who === 'Ralsei' ? '#8fffa0' : who === 'Asgore' ? '#ffd87a' : '#ffe066';
      ctx.fillText(who.toUpperCase(), tx, ty);
      ty += 12;
    } else {
      ty += 4;
    }

    ctx.font = 'bold 9px "Courier New", monospace';
    ctx.fillStyle = color;
    const maxW = VW - tx - 14;
    const rows = [''];
    for (const word of String(line).split(' ')) {
      const next = rows[rows.length - 1] ? rows[rows.length - 1] + ' ' + word : word;
      if (ctx.measureText('* ' + next).width > maxW && rows[rows.length - 1]) rows.push(word);
      else rows[rows.length - 1] = next;
    }
    rows.slice(0, 2).forEach((row, i) => {
      ctx.fillText((i === 0 ? '* ' : '  ') + row, tx, ty + i * 11);
    });
    ctx.restore();
  }

  /* Run a timeline on S.overlays for `secs`; cues fire once. */
  function run(S, secs, draw, cues = [], opt = {}) {
    if (FW.test) {
      cues.forEach(c => { try { c[1](); } catch (_) {} });
      [0.05, 0.2, 0.4, 0.6, 0.75, 0.9, 0.98].forEach(p => draw(S.ctx, secs * p, p));
      return Promise.resolve();
    }
    return new Promise(res => {
      const t0 = performance.now(), fired = new Set();
      let finished = false, timer;
      S.fx.fade = 0; S.fx.fadeTo = 0;
      const f = ctx => {
        const t = Math.min(secs, (performance.now() - t0) / 1000);
        cues.forEach((c, i) => { if (!fired.has(i) && t >= c[0]) { fired.add(i); try { c[1](); } catch (_) { /* decoration */ } } });
        ctx.save();
        draw(ctx, t, cl(t / secs));
        frame(ctx, t, secs);
        ctx.restore();
      };
      S.overlays.push(f);
      const finish = () => {
        if (finished) return;
        finished = true;
        clearTimeout(timer);
        if (opt.endBlack) { S.fx.fade = 1; S.fx.fadeTo = 1; }
        const i = S.overlays.indexOf(f);
        if (i >= 0) S.overlays.splice(i, 1);
        document.removeEventListener('keydown', kd, true);
        S.root.removeEventListener('pointerdown', pd, true);
        res();
      };
      const kd = e => { if (e.code === 'KeyZ' || e.code === 'Enter' || e.code === 'Space' || e.code === 'Escape') { e.preventDefault(); e.stopImmediatePropagation(); finish(); } };
      const pd = e => { if (!e.target.closest('.fk-quit')) { e.stopImmediatePropagation(); finish(); } };
      document.addEventListener('keydown', kd, true);
      S.root.addEventListener('pointerdown', pd, true);
      timer = setTimeout(finish, secs * 1000 + 30);
    });
  }

  const sfx = (c, v) => FW.sfx(c, { vol: v == null ? .5 : v });

  function toon(ctx, id, x, y, h, o = {}) {
    const im = FW.toonImg && FW.toonImg[id];
    if (!im || !im.naturalWidth) return;
    const w = im.naturalWidth / im.naturalHeight * h;
    ctx.save();
    ctx.translate(x, y);
    if (o.rot) ctx.rotate(o.rot);
    if (o.flip) ctx.scale(-1, 1);
    ctx.globalAlpha *= o.alpha == null ? 1 : o.alpha;
    ctx.imageSmoothingEnabled = true;
    if (o.filter) ctx.filter = o.filter;
    ctx.drawImage(im, -w / 2, -h, w, h);
    ctx.filter = 'none';
    ctx.restore();
    ctx.imageSmoothingEnabled = false;
  }

  function text(ctx, s, x, y, o = {}) {
    ctx.save();
    ctx.font = (o.weight || 900) + ' ' + (o.size || 16) + 'px ' + (o.font || '"Courier New",monospace');
    ctx.textAlign = o.align || 'center';
    ctx.textBaseline = 'middle';
    ctx.globalAlpha *= o.alpha == null ? 1 : o.alpha;
    if (o.rot) { ctx.translate(x, y); ctx.rotate(o.rot); x = 0; y = 0; }
    ctx.lineJoin = 'round';
    ctx.lineWidth = o.stroke || 4;
    ctx.strokeStyle = o.strokeColor || '#000';
    ctx.strokeText(s, x, y);
    ctx.fillStyle = o.color || '#fff';
    ctx.fillText(s, x, y);
    ctx.restore();
  }

  function speedLines(ctx, t, dir = 'up', col = 'rgba(255,255,255,.5)', n = 22) {
    ctx.save();
    ctx.strokeStyle = col;
    ctx.lineWidth = 1;
    for (let i = 0; i < n; i++) {
      const r = (i * 97.13) % 1, L = 24 + r * 64;
      if (dir === 'up') {
        const x = (i * 37) % VW, y = VH - ((t * 600 + i * 53) % (VH + L));
        ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, y + L); ctx.stroke();
      } else {
        const y = 16 + (i * 29) % (VH - 32), x = VW - ((t * 900 + i * 71) % (VW + L));
        ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + L, y); ctx.stroke();
      }
    }
    ctx.restore();
  }

  function radial(ctx, cx, cy, t, col, n = 28) {
    ctx.save();
    ctx.fillStyle = col;
    for (let i = 0; i < n; i++) {
      const a = i / n * Math.PI * 2 + t * .3, w = .03 + ((i * 13) % 5) * .006;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx + Math.cos(a - w) * 400, cy + Math.sin(a - w) * 400);
      ctx.lineTo(cx + Math.cos(a + w) * 400, cy + Math.sin(a + w) * 400);
      ctx.fill();
    }
    ctx.restore();
  }

  const petals = Array.from({ length: 40 }, (_, i) => ({ x: (i * 61) % VW, y: (i * 37) % VH, s: .5 + (i % 5) * .2, p: i }));
  function drawPetals(ctx, t, k = 1, vx = -30, vy = 40) {
    petals.forEach(p => {
      const x = ((p.x + vx * t * p.s) % VW + VW) % VW, y = ((p.y + vy * t * p.s) % VH + VH) % VH;
      P().draw(ctx, 'spin_petal_' + (Math.floor(t * 8 + p.p) % 5), x, y, { ax: .5, ay: .5, alpha: k });
    });
  }

  // Omega Flowery: Flowery's form plus all 6 borrowed flower pieces glowing in their colors
  const OMEGA = [
    ['omegaf_green', '#5cff6a', '#d8ffd8', -16, -2],
    ['omegaf_aqua', '#4ff4ff', '#e0ffff', -10, 4],
    ['omegaf_seth', '#b07bff', '#efe2ff', 10, -8],
    ['omegaf_yellow', '#ffd23a', '#fff6c8', 6, -14],
    ['omegaf_blue', '#7f9bff', '#e2e8ff', 16, -2],
    ['omegaf_orange', '#ff8a4a', '#ffe4d2', -2, 8]
  ];
  function omega(ctx, x, y, t, o = {}) {
    const s = o.s || 1.15, f = Math.floor(t * 8) % 3, al = o.alpha == null ? 1 : o.alpha;
    OMEGA.forEach(([n, col, pale, dx, dy], i) => {
      const bx = x + dx * s * 1.4, by = y - 4 + dy * s * 1.4 + Math.sin(t * 3 + i) * 1.5;
      P().draw(ctx, n + '_o_' + f, bx, by + 1, { s: s * 1.07, tint: col, alpha: .75 * al });
      P().draw(ctx, n + '_' + f, bx, by, { s, alpha: .78 * al });
      P().draw(ctx, n + '_' + f, bx, by, { s, tint: pale, alpha: .9 * al, blend: 'multiply' });
    });
    const pose = (o.pose || 'omegaflowery_jarona') + '_' + f;
    P().draw(ctx, pose, x, y + 1, { s: s * 1.12, tint: '#ffd23a', alpha: .8 * al });
    P().draw(ctx, pose, x, y, { s: s * 1.05, alpha: al });
  }

  const C = FW.CUTS;

  /* ============================================================================
     1. THE DOOR IN THE VENT (Gardenview -> Sanctuary Pink Door Awakening)
     ============================================================================ */
  C.door = S => run(S, 8.6, (ctx, t) => {
    // Deep Dark-World transition corridor built from authentic Flower Castle tiles & glow
    ctx.fillStyle = '#06030d';
    ctx.fillRect(0, 0, VW, VH);

    const k = ease(seg(t, 0.3, 5.2));
    const open = t > 5.0 ? Math.min(2, Math.floor((t - 5.0) * 5)) : -1;
    const doorSpr = open < 0 ? 'fcastle_pinkdoor_0' : 'fcastle_pinkdoor_open_' + open;
    const ds = 0.55 + k * 0.95;
    const doorY = Math.round(lerp(132, 168, k));

    // Castle tile archway & landing glow emerging from the darkness
    ctx.save();
    ctx.globalAlpha = 0.22 + k * 0.45;
    FW.tileFill(ctx, FW.TX.wallTop, 24, 14, VW - 48, doorY - 20, 0, Math.floor(t * 16));
    FW.tileFill(ctx, FW.TX.woodLeaf, 0, doorY - 4, VW, VH - doorY + 4, 0, Math.floor(t * 28));
    ctx.restore();

    if (t > 4.2) {
      const gk = seg(t, 4.2, 7.6);
      radial(ctx, VW / 2, doorY - 36, t, 'rgba(255,230,150,' + (gk * 0.42) + ')', 24);
      P().draw(ctx, 'dw_landing_glow_0', VW / 2, doorY + 12, { s: 1.1 + gk * 0.8, alpha: gk * 0.95 });
    }

    P().draw(ctx, doorSpr, VW / 2, doorY, { s: ds });

    // Superbloom petals erupting out of the open threshold
    if (t > 5.2) {
      const bf = Math.min(6, Math.floor((t - 5.2) * 6));
      P().draw(ctx, 'superbloom_front_' + bf, VW / 2, doorY + 10, { s: 1.1, alpha: seg(t, 5.2, 6.2) });
      drawPetals(ctx, t, seg(t, 5.2, 7.0), 0, -90);
    }

    // Scraps, Ginger, and Yatta approaching the glowing door from the foreground
    const bob = i => Math.abs(Math.sin(t * 6 + i * 1.7)) * 3;
    const pull = ease(seg(t, 6.0, 8.2));
    toon(ctx, 'Yatta', lerp(96, 138, pull), lerp(236, doorY + 6, pull) - bob(0), lerp(64, 28, pull), { rot: Math.sin(t * 6) * .04 });
    toon(ctx, 'Ginger', lerp(160, 160, pull), lerp(242, doorY + 8, pull) - bob(1), lerp(60, 26, pull));
    toon(ctx, 'Scraps', lerp(224, 182, pull), lerp(238, doorY + 6, pull) - bob(2), lerp(64, 28, pull), { flip: true });

    if (t > 7.4) {
      ctx.fillStyle = 'rgba(255,248,220,' + seg(t, 7.4, 8.5) + ')';
      ctx.fillRect(0, 0, VW, VH);
    }

    caption(ctx, t, [
      [0.3, 2.8, 'Scraps', 'The sad flower I drew on the CLOSED sign... it resonated with something behind the wall.'],
      [2.9, 5.3, 'Ginger', 'Wait—the concrete is gone! It smells like warm soil, honey, and dried kingcups!'],
      [5.4, 8.0, 'Yatta', 'THE DOOR IS OPENING!! HOLD ON TO MY STREAMERS, EVERYBODY!!']
    ]);
  }, [
    [0.2, () => sfx('step1', .35)],
    [1.5, () => sfx('step2', .35)],
    [3.0, () => sfx('rumble', .45)],
    [5.0, () => sfx('dooropen', .75)],
    [5.6, () => sfx('great_shine', .65)]
  ]);

  /* ============================================================================
     2. FALLING INTO THE DARK WORLD (Skyfall through the Seven Suns -> Flowerbed)
     ============================================================================ */
  C.fall = S => run(S, 8.6, (ctx, t) => {
    const k = seg(t, 0, 6.8);
    if (t < 6.8) {
      // Multi-plane Deltarune Chapter 5 sunrise sky scrolling upward during the fall
      const sy = (t * 85) % 240;
      P().draw(ctx, 'sunrise_back_sky_0', 0, -sy, { ax: 0, ay: 0 });
      P().draw(ctx, 'sunrise_back_clouds_tall_0', -40, -sy * 1.3, { ax: 0, ay: 0, alpha: 0.85 });
      P().draw(ctx, 'sunrise_long_grad_0', 0, 0, { ax: 0, ay: 0, alpha: 0.55 });
      if (k > 0.4) {
        ctx.globalAlpha = seg(k, 0.4, 0.85);
        FW.sunsetSky(ctx, { x: t * 30 }, t, { cliffY: 250 - seg(t, 4.0, 6.8) * 110 });
        ctx.globalAlpha = 1;
      }
      P().draw(ctx, 'dw_leaf_parallax_0', 0, -((t * 240) % 360), { ax: 0, ay: 0, s: 0.5, alpha: 0.7 });
      speedLines(ctx, t, 'up', 'rgba(255,245,190,' + (0.28 + k * 0.32) + ')', 32);
      drawPetals(ctx, t, 0.95, 14, -170);

      [['Yatta', 88, 0], ['Ginger', 160, 1], ['Scraps', 232, 2]].forEach(([id, x, i]) => {
        const cx = x + Math.sin(t * 2.4 + i) * 12;
        const cy = 86 + Math.sin(t * 3.1 + i * 1.5) * 16 + i * 6;
        toon(ctx, id, cx, cy, 52, { rot: t * (2.6 + i * 0.6) * (i % 2 ? -1 : 1) });
      });
    } else {
      // Impact into the Golden Flowerbed!
      const lt = t - 6.8;
      if (FW.ROOMS.cliffs) {
        if (FW.ROOMS.cliffs.sky) FW.ROOMS.cliffs.sky(ctx, { x: 0, y: 0 }, t);
        if (FW.ROOMS.cliffs.back) FW.ROOMS.cliffs.back(ctx);
      } else { ctx.fillStyle = '#140a1d'; ctx.fillRect(0, 0, VW, VH); }

      const bf = Math.min(6, Math.floor(lt * 7));
      P().draw(ctx, 'superbloom_front_' + bf, VW / 2, 198, { s: 1.25 });
      const df = Math.min(4, Math.floor(lt * 8));
      if (lt < 0.9) {
        P().draw(ctx, 'vfx_landingdust_' + df, 92 - lt * 26, 198, { s: 1.5 });
        P().draw(ctx, 'vfx_landingdust_' + df, 160, 202, { s: 1.6 });
        P().draw(ctx, 'vfx_landingdust_' + df, 228 + lt * 26, 198, { s: 1.5 });
      }
      const bounce = lt < 0.35 ? Math.sin((lt / 0.35) * Math.PI) * 14 : 0;
      toon(ctx, 'Yatta', 96, 194 - bounce, 46);
      toon(ctx, 'Ginger', 160, 198 - bounce * 0.7, 44);
      toon(ctx, 'Scraps', 224, 194 - bounce, 46, { flip: true });
    }

    if (t > 6.8 && t < 7.4) {
      ctx.fillStyle = 'rgba(255,255,255,' + (1 - seg(t, 6.8, 7.4)) * 0.85 + ')';
      ctx.fillRect(0, 0, VW, VH);
    }
    if (t > 8.0) {
      ctx.fillStyle = 'rgba(0,0,0,' + seg(t, 8.0, 8.6) + ')';
      ctx.fillRect(0, 0, VW, VH);
    }

    caption(ctx, t, [
      [0.3, 2.7, 'Yatta', 'WHEEEEEEEEEEEEEE!! THE SKY IS MADE OF GOLD!!', '#ffe95c'],
      [2.9, 5.4, 'Scraps', 'Wait—why are there SEVEN suns in the sky?! And why aren\'t they moving?!'],
      [5.5, 6.7, 'Ginger', 'Aim for the giant bed of buttercups below us! Brace yourselves!'],
      [7.0, 8.3, 'Narrator', 'The golden petals catch their fall like a warm quilt.']
    ]);
  }, [
    [0, () => sfx('wing', .55)],
    [3.2, () => sfx('rumble', .35)],
    [6.8, () => { sfx('impact', .85); S.fx.shake = 10; }]
  ], { endBlack: true });

  /* ============================================================================
     3. THE SANCTUARY OF SEVEN SUNS (Cliff Overlook & Castle Reveal)
     ============================================================================ */
  C.castle = S => run(S, 7.4, (ctx, t) => {
    const a = seg(t, 0, 0.7) * (1 - seg(t, 6.7, 7.4));
    ctx.globalAlpha = a;
    const rise = ease(seg(t, 0.4, 4.8));
    FW.sunsetSky(ctx, { x: t * 18 }, t, { cliffY: 206 - rise * 18 });
    radial(ctx, VW / 2, 68, t, 'rgba(255,240,180,.18)', 22);

    // Seven suns gleaming in the eternal afternoon sky
    for (let i = 0; i < 7; i++) {
      const sx = 38 + i * 40, sy = 30 + Math.sin(i * 0.9) * 8;
      ctx.fillStyle = 'rgba(255,235,140,0.26)';
      ctx.beginPath(); ctx.arc(sx, sy, 9 + Math.sin(t * 3 + i) * 1.5, 0, 7); ctx.fill();
      ctx.fillStyle = '#fff8d6';
      ctx.beginPath(); ctx.arc(sx, sy, 4, 0, 7); ctx.fill();
    }

    // Castle in the valley (castle_distance_small_0 is 266x171)
    P().draw(ctx, 'castle_distance_small_0', VW / 2, 214 - rise * 36, { s: 1.05 + rise * 0.22 });

    // Foreground cliff ledge & low plants
    P().draw(ctx, 'dw_parallax_low_plants_0', VW / 2, 240, { s: 1 });
    if (t > 2.2) {
      const ff = Math.floor(t * 6) % 5;
      P().draw(ctx, 'flowery_idle3_' + ff, 284, 202, { s: 1.15, alpha: seg(t, 2.2, 3.2) });
    }

    drawPetals(ctx, t, a);
    text(ctx, 'FLOWER CASTLE', VW / 2, 42, {
      size: 20, color: '#ffe066',
      alpha: seg(t, 1.5, 2.4) * (1 - seg(t, 5.9, 6.7)),
      stroke: 5, strokeColor: '#5a1030'
    });
    caption(ctx, t, [
      [0.6, 3.4, 'Narrator', 'Seven suns hang frozen in eternal afternoon above a kingdom built from a flower shop.'],
      [3.6, 6.6, 'Flowery', 'Every petal in its place... so the Big Guy\'s one good day never has to end.']
    ]);
  }, [[0.2, () => sfx('great_shine', .45)], [2.0, () => sfx('orchhit', .45)]]);

  /* ============================================================================
     4. ICHOR RISES (Gardenview Ichor Floods the Castle Courtyard)
     ============================================================================ */
  C.ichorRise = S => run(S, 8.2, (ctx, t) => {
    // Render the Castle Courtyard underneath the rising Ichor
    if (FW.ROOMS.courtyard) {
      if (FW.ROOMS.courtyard.sky) FW.ROOMS.courtyard.sky(ctx, { x: 160, y: 0 }, t);
      if (FW.ROOMS.courtyard.back) FW.ROOMS.courtyard.back(ctx);
    }
    ctx.fillStyle = 'rgba(10,2,20,' + (0.35 + seg(t, 0, 3) * 0.45) + ')';
    ctx.fillRect(0, 0, VW, VH);

    const lvl = ease(seg(t, 0.3, 4.6)) * (1 - ease(seg(t, 7.1, 8.2)) * 0.3);
    const top = VH - lvl * 106;

    // Deltarune Chapter 5 rising thorns erupting along the courtyard stones
    const tf = Math.floor(t * 8) % 3;
    [54, 122, 198, 266].forEach((gx, i) => {
      if (t > 0.5 + i * 0.25) {
        P().draw(ctx, (i % 2 ? 'rising_thorns_a_' : 'rising_thorns_b_') + tf, gx, top + 24, { s: 1.1 });
      }
    });

    // Twisted silhouettes rising from the black Gardenview Ichor
    [['Boxten', 70, 0, 74], ['Brightney', 250, 0.5, 70], ['Dandy', 160, 1.0, 96]].forEach(([n, x, d, h]) => {
      const im = TW[n];
      if (!im || !im.naturalWidth) return;
      const up = ease(seg(t, 1.2 + d, 4.4 + d)) * (1 - ease(seg(t, 6.8 + d * 0.2, 8.2)));
      const w = im.naturalWidth / im.naturalHeight * h;
      ctx.save();
      ctx.globalAlpha = 0.92 * up;
      ctx.imageSmoothingEnabled = true;
      ctx.filter = 'brightness(0) drop-shadow(0 0 5px #b040ff)';
      ctx.drawImage(im, x - w / 2 + Math.sin(t * 2 + d) * 4, top + 30 - up * (h * 0.8), w, h);
      ctx.restore();
    });

    // Boiling black Ichor wave
    ctx.fillStyle = '#07000e';
    ctx.beginPath();
    ctx.moveTo(0, VH);
    for (let x = 0; x <= VW; x += 8) {
      ctx.lineTo(x, top + Math.sin(x * 0.05 + t * 3) * 5 + Math.sin(x * 0.13 - t * 2) * 3);
    }
    ctx.lineTo(VW, VH);
    ctx.fill();

    ctx.fillStyle = 'rgba(176,75,255,.42)';
    for (let i = 0; i < 20; i++) {
      const x = (i * 47 + t * 15) % VW, y = top + 8 + ((i * 31 + t * 32) % 86);
      ctx.beginPath(); ctx.arc(x, y, 1 + (i % 3), 0, 7); ctx.fill();
    }

    caption(ctx, t, [
      [0.4, 2.9, 'Narrator', 'Black Gardenview Ichor pours through the open vent door and cracks the courtyard stone!'],
      [3.1, 5.6, 'Scraps', 'That\'s the ink from our world! It followed us through the door I drew!'],
      [5.8, 7.9, 'Ralsei', 'The Ichor is fusing with the Darkners—which means your Toon attacks can finally hurt them!']
    ]);
  }, [
    [0.2, () => { sfx('rumble', .65); S.fx.shake = 6; }],
    [1.3, () => sfx('noise', .35)],
    [3.0, () => sfx('creepyjingle', .4)],
    [4.6, () => { S.fx.shake = 8; sfx('screenshake', .55); }]
  ]);

  /* ============================================================================
     5. ASGORE CHARGES IN (Courtyard Rescue Between Waves)
     ============================================================================ */
  C.asgoreCharge = async S => {
    const foes = [
      ['enemy_floradin_0', 194, 152],
      ['kawkaw_0', 232, 176],
      ['mantis_idle_0', 266, 144],
      ['blockguy_overworld_0', 292, 182]
    ].map(([n, x, y]) => ({ n, x, y, vy: 0, vx: 0, r: 0, hit: false }));
    S.root.style.display = '';
    await run(S, 3.6, (ctx, t) => {
      if (FW.ROOMS.courtyard) {
        if (FW.ROOMS.courtyard.sky) FW.ROOMS.courtyard.sky(ctx, { x: 160, y: 0 }, t);
        if (FW.ROOMS.courtyard.back) FW.ROOMS.courtyard.back(ctx);
      }
      ctx.fillStyle = 'rgba(12,0,24,.78)';
      ctx.fillRect(0, 0, VW, VH);
      ctx.fillStyle = '#07000e';
      ctx.fillRect(0, 196, VW, 44);

      const ax = -60 + t * 155;
      foes.forEach(f => {
        if (!f.hit && ax > f.x - 22) {
          f.hit = true;
          f.vx = 130 + Math.random() * 80;
          f.vy = -230 - Math.random() * 80;
          sfx('impact', .65);
          S.fx.shake = 8;
        }
        if (f.hit) {
          f.x += f.vx / 60;
          f.y += f.vy / 60;
          f.vy += 9;
          f.r += 0.22;
          P().draw(ctx, 'hit_vfx_' + (Math.floor(t * 14) % 4), f.x - 16, f.y - 20, { s: 0.55, alpha: 0.7 });
        }
        P().draw(ctx, f.n, f.x, f.y, { tint: '#1a0028', rot: f.r, alpha: .95 });
      });

      const chargeFrame = 'asgore_armor_charge_verymad_' + (Math.floor(t * 12) % 6);
      P().draw(ctx, chargeFrame, ax, 200, { s: 1.4 });
      FW.drawAsgoreCrown(ctx, { s: 1.4 }, chargeFrame, ax, 200, false);
      speedLines(ctx, t, 'side', 'rgba(255,220,120,.32)', 16);
      if (t < 0.6) {
        ctx.fillStyle = 'rgba(255,255,255,' + (0.6 - t) + ')';
        ctx.fillRect(0, 0, VW, VH);
      }
    }, [[0, () => { FW.music('flAsgore'); sfx('rumble', .75); }]]);
    S.root.style.display = '';
    await FW.say('Asgore', '', 'NOT IN MY GARDEN!', { shout: true });
    await FW.say('Asgore', '', "...Oh! Hello again, little ones. | I'll hold the courtyard gate. You hurry up to the sanctuary roof!");
    FW.hideBox();
  };

  /* ============================================================================
     6. LEND ME YOUR POWER! (Vine Tower Awakening -> Six Petal Souls Combine)
     ============================================================================ */
  C.lendPower = async S => {
    const A = window.FlArena;
    if (!A) return;
    const st = { t0: performance.now(), k: 0, pose: 'kneel', speed: 8, flash: 0, y: 178, spark: 0 };
    const f = ctx => {
      const t = (performance.now() - st.t0) / 1000;
      A.bg(ctx, t, { x: 112, w: 96, speed: st.speed, sunset: cl(st.spark * 0.7) });
      if (st.speed > 50) {
        ctx.fillStyle = 'rgba(0,0,0,.25)';
        ctx.fillRect(0, 0, VW, VH);
        speedLines(ctx, t, 'up', 'rgba(255,235,160,.38)', 24);
      }

      // Superbloom & parry ring aura during powerup
      if (st.spark > 0) {
        radial(ctx, 160, st.y - 34, t * 4, 'rgba(255,240,170,' + (0.16 * st.spark) + ')', 24);
        const bf = Math.floor(t * 10) % 7;
        P().draw(ctx, 'superbloom_front_' + bf, 160, st.y + 8, { s: 1.15, alpha: st.spark * 0.85 });
      }

      // The 6 flower friends' Omega souls spiraling in
      A.ghosts(ctx, t, st.k, 160, st.y - 40);
      if (st.k > 0.1) {
        OMEGA.forEach(([n, col], i) => {
          const ang = t * 4.2 + (i / 6) * Math.PI * 2;
          const rad = lerp(92, 18, ease(st.k));
          const sx = 160 + Math.cos(ang) * rad;
          const sy = (st.y - 34) + Math.sin(ang) * rad * 0.65;
          const sf = Math.floor(t * 8 + i) % 3;
          P().draw(ctx, n + '_o_' + sf, sx, sy, { ax: .5, ay: .5, s: 1, tint: col, alpha: st.k });
          P().draw(ctx, n + '_' + sf, sx, sy, { ax: .5, ay: .5, s: 1, alpha: st.k });
        });
      }

      const fr = st.pose === 'kneel' ? 'flowery_powering_up_kneel_' + (Math.floor(t * 6) % 2)
        : st.pose === 'up' ? 'flowery_poweringup_' + (Math.floor(t * 10) % 5)
        : st.pose === 'finish' ? 'flowery_powering_up_finish_' + Math.min(4, Math.floor((t - st.pt) * 10))
        : 'flowery_punch_up_chase_0';
      P().draw(ctx, fr, 160, st.y + (st.pose === 'climb' ? Math.sin(t * 9) * 2 : 0), { s: 1.45 });

      if (st.flash > 0) {
        ctx.fillStyle = 'rgba(255,255,255,' + st.flash + ')';
        ctx.fillRect(0, 0, VW, VH);
        st.flash = Math.max(0, st.flash - 0.03);
      }
      caption(ctx, t, [
        [0.2, 2.2, 'Narrator', 'All six petals of the Flower Kingdom answer Flowery\'s call!']
      ]);
      frame(ctx, 1, 100, false);
    };
    S.overlays.push(f);
    const wait = ms => new Promise(r => setTimeout(r, FW.test ? 0 : ms));
    const tw = (key, to, ms) => new Promise(r => {
      const a = st[key], t0 = performance.now();
      const step = () => {
        const k = Math.min(1, (performance.now() - t0) / ms);
        st[key] = a + (to - a) * ease(k);
        if (k < 1 && !FW.test) requestAnimationFrame(step);
        else { st[key] = to; r(); }
      };
      step();
    });
    try {
      FW.music('flBoss');
      sfx('rumble', .55);
      await wait(450);
      st.pose = 'up';
      await tw('k', 1, 1600);
      FW.voiceLine(null, 'lend_power', '');
      await FW.say('Flowery', 'hair3', 'Seth! Aqua! Green! Orange! Blue! Yellow! | Lend me your power—don\'t let them wake the Big Guy up!', { clip: 'none' });
      FW.hideBox();
      st.spark = 1;
      sfx('great_shine', .75);
      S.fx.shake = 5;
      await wait(900);
      st.pose = 'finish';
      st.pt = (performance.now() - st.t0) / 1000;
      sfx('power', .75);
      await tw('k', 0, 700);
      st.flash = 0.95;
      await wait(500);
      st.pose = 'climb';
      st.speed = 240;
      sfx('wing', .65);
      FW.voiceLine(null, 'hoo', '');
      await tw('y', 114, 1700);
      st.flash = 1;
      sfx('orchhit', .6);
      await wait(400);
    } finally {
      const i = S.overlays.indexOf(f);
      if (i >= 0) S.overlays.splice(i, 1);
    }
  };

  /* ============================================================================
     7. OMEGA CHASE (Studio Trigger Rooftop Climax Clash)
     ============================================================================ */
  C.omegaChase = S => run(S, 19.5, (ctx, t) => {
    const slow = t > 12 && t < 14.2 ? .18 : t > 16.5 ? .4 : 1;
    const vt = t < 12 ? t : t < 14.2 ? 12 + (t - 12) * .18 : t < 16.5 ? 12.4 + (t - 14.2) : 14.7 + (t - 16.5) * .4;

    // Authentic Deltarune Chapter 5 Rooftop & Sunset Sky
    FW.sunsetSky(ctx, { x: vt * 220 }, vt, { cliffY: 130 });
    P().draw(ctx, 'flowerytree_0', VW - ((vt * 90) % 420), 192, { s: 0.9, alpha: 0.85 });
    P().draw(ctx, 'castle_roof_2_0', VW / 2 - ((vt * 180) % 160) + 80, 198, { s: 1 });
    P().draw(ctx, 'castle_roof_1_0', VW / 2 - ((vt * 320) % 60) + 30, 240, { s: 1.1 });
    const gf = Math.floor(vt * 6) % 3;
    P().draw(ctx, 'fcastle_top_sideglow_' + gf, 0, 0, { ax: 0, ay: 0, alpha: 0.65 });
    P().draw(ctx, 'fcastle_top_sideglow_' + gf, VW, 0, { ax: 1, ay: 0, flip: true, alpha: 0.65 });

    speedLines(ctx, vt, 'side', 'rgba(255,255,255,' + (slow < 1 ? .15 : .38) + ')', 28);

    // Omega Flowery position & choreography
    let ox = 232, oy = 192;
    if (t < 2) ox = 330 - ease(seg(t, 0, 1.4)) * 98;
    else if (t < 6) ox = 232 + Math.sin(t * 2) * 28;
    else if (t < 8) ox = 258 - Math.sin((t - 6) * 3) * 12;
    else if (t < 12) ox = 240 + Math.sin(t * 1.5) * 18;
    else if (t < 14.2) ox = 232;

    const split = seg(t, 14.2, 15.6);
    if (split <= 0) {
      const pose = (t > 6.2 && t < 7.2) ? 'omegaflowery_deflect'
        : (t > 12.6 && t < 14.2) ? 'omegaflowery_clash'
        : 'omegaflowery_jarona';
      omega(ctx, ox, oy - Math.abs(Math.sin(vt * 9)) * 4, vt, { pose, s: 1.25 });

      // Parry shockwave when deflecting Scraps' grapple
      if (t > 6.5 && t < 7.3) {
        const pk = seg(t, 6.5, 7.3);
        P().draw(ctx, 'vfx_parry_ring_0', ox - 20, oy - 32, { ax: .5, ay: .5, s: 0.35 + pk * 0.6, alpha: 1 - pk });
        P().draw(ctx, 'vfx_parry_impact_' + Math.min(6, Math.floor(pk * 7)), ox - 20, oy - 32, { ax: .5, ay: .5, s: 0.9 });
      }
    } else {
      // Finisher explosion & Superbloom as the 6 borrowed petal souls scatter!
      const ef = Math.floor(split * 8);
      if (ef < 7) P().draw(ctx, 'finisher_explosion_' + ef, ox, oy - 28, { ax: .5, ay: .5, s: 1.1 });
      const sbf = Math.min(6, Math.floor(split * 7));
      P().draw(ctx, 'superbloom_front_' + sbf, ox, oy + 4, { s: 1.2, alpha: 1 - split * 0.7 });

      OMEGA.forEach(([n, col], i) => {
        const a = i / OMEGA.length * Math.PI * 2;
        const sx = ox + Math.cos(a) * split * 165;
        const sy = oy - 30 + Math.sin(a) * split * 120 - split * 35;
        P().draw(ctx, n + '_o_0', sx, sy, { s: 1.4, tint: col, alpha: 1 - split * 0.85, rot: split * 6 });
        P().draw(ctx, n + '_0', sx, sy, { s: 1.3, alpha: 1 - split * 0.85, rot: split * 6 });
      });
      const fy = oy - 56 * Math.sin(split * Math.PI);
      P().draw(ctx, split < 1 ? 'flowery_hurt_0' : 'flowery_crouch_left_0', ox + split * 22, Math.min(oy, fy + split * 56), {
        s: 1.35, rot: split < 1 ? split * 6 : 0
      });
    }

    // Scraps, Ginger, and Yatta chasing & executing their 3-part combo
    const runBob = i => Math.abs(Math.sin(vt * 14 + i * 2)) * 4;
    let sx = 122, gx = 80, yx = 40;
    if (t > 6 && t < 7.4) sx = 122 + Math.sin(seg(t, 6, 6.6) * Math.PI) * 98;
    if (t > 8.5) gx = 80 - seg(t, 8.5, 9.5) * 26;
    if (t > 10.2) yx = 40 + ease(seg(t, 10.2, 12.6)) * 172;
    if (t > 14.2) {
      sx += seg(t, 14.2, 17.5) * 52;
      gx += seg(t, 14.2, 17.5) * 68;
      yx -= ease(seg(t, 15.4, 17.2)) * 130;
    }
    if (t > 6 && t < 6.6) {
      ctx.strokeStyle = '#ffd36b'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(sx, 166); ctx.lineTo(ox, 166); ctx.stroke();
    }
    toon(ctx, 'Ginger', gx, 194 - runBob(1), 46, { rot: Math.sin(vt * 14) * .08 });
    toon(ctx, 'Scraps', sx, 194 - runBob(2) - (t > 6 && t < 7.4 ? Math.sin(seg(t, 6, 7.4) * Math.PI) * 50 : 0), 48, {
      rot: t > 6.6 && t < 7.4 ? -seg(t, 6.6, 7.4) * 6 : Math.sin(vt * 14) * .08
    });
    toon(ctx, 'Yatta', yx, 194 - runBob(0) - (t > 11.2 && t < 13.8 ? Math.sin(seg(t, 11.2, 13.8) * Math.PI) * 62 : 0), 48, {
      rot: t > 11.2 && t < 12.4 ? vt * 9 : Math.sin(vt * 14) * .08
    });

    // Ginger's Baked-With-Care heart boost to Yatta
    if (t > 9.2 && t < 10.4) {
      const hk = seg(t, 9.2, 10.4);
      P().draw(ctx, 'vfx_parry_half_ring_0', gx + (yx - gx) * hk, 156 - Math.sin(hk * Math.PI) * 46, { ax: .5, ay: .5, s: 0.3 });
      text(ctx, '♥', gx + (yx - gx) * hk, 156 - Math.sin(hk * Math.PI) * 46, { size: 18, color: '#ff6b9a' });
    }

    if (t > 1.4 && t < 4.8) {
      text(ctx, 'NO ONE CAN OUTSPEED A FLOWER!', VW / 2, 42, {
        size: 16, color: '#fff', strokeColor: '#e0207a', rot: -.05, alpha: seg(t, 1.4, 1.7)
      });
    }
    if (t > 6 && t < 7) text(ctx, 'CRAFTY GRAPPLE!', sx + 26, 116, { size: 11, color: '#ffd36b' });
    if (slow < 1) {
      ctx.fillStyle = 'rgba(40,0,60,.35)';
      ctx.fillRect(0, 0, VW, VH);
      radial(ctx, ox - 10, 156, vt, 'rgba(255,255,255,.22)', 30);
    }
    if (t > 13 && t < 14.4) {
      const ik = seg(t, 13, 13.5);
      ctx.fillStyle = 'rgba(255,255,255,' + (1 - ik) * .9 + ')';
      ctx.fillRect(0, 0, VW, VH);
      P().draw(ctx, 'hit_vfx_1', ox - 12, 152, { ax: .5, ay: .5, s: 1.3, alpha: 1 - ik * 0.5 });
      P().draw(ctx, 'vfx_directional_hit_0', ox - 12, 152, { ax: .5, ay: .5, s: 1.2, alpha: 1 - ik * 0.5 });
      text(ctx, 'TAG!!', VW / 2, VH / 2 - 14, { size: 40, color: '#ffe95c', strokeColor: '#000', stroke: 6 });
    }
    if (t > 15.4 && t < 16.4) {
      ctx.fillStyle = 'rgba(255,255,255,' + (1 - Math.abs(t - 15.9) * 2) * .85 + ')';
      ctx.fillRect(0, 0, VW, VH);
    }
    if (t > 18.5) {
      ctx.fillStyle = 'rgba(0,0,0,' + seg(t, 18.5, 19.5) + ')';
      ctx.fillRect(0, 0, VW, VH);
    }

    caption(ctx, t, [
      [2.0, 4.8, 'Omega Flowery', 'Here I come, Sanfrandisco! Catch me if you can, cartoons!'],
      [6.8, 8.6, 'Omega Flowery', 'Nice grapple, Origami—but six souls beat one paper paw!'],
      [8.8, 10.5, 'Ginger', 'Yatta, catch my heart-cookie! Use the sugar rush to jump the wind-wall!', '#ffd6df'],
      [10.6, 12.8, 'Yatta', 'SPRING LOADED!! TAG—YOU\'RE IT, FLOWER BOY!!', '#ffe95c'],
      [16.2, 18.5, 'Narrator', 'The six borrowed petal souls scatter like confetti. Flowery skids across the roof alone.']
    ]);
  }, [
    [0, () => { FW.music('flBoss'); sfx('great_shine', .7); }],
    [0.4, () => FW.voiceLine(null, 'omega', 'OMEGA FLOWERY!', { quiet: true })],
    [2.2, () => FW.voiceLine(null, 'sanfrandisco', 'Here I come, Sanfrandisco!', { quiet: true })],
    [6.0, () => sfx('chain_extend', .6)],
    [6.6, () => { sfx('impact', .75); S.fx.shake = 6; }],
    [7.1, () => FW.voiceLine(null, 'hah', 'Hah!', { quiet: true, ms: 700 })],
    [9.3, () => sfx('power', .65)],
    [10.3, () => sfx('boost', .75)],
    [12.0, () => sfx('weirdeffect', .45)],
    [13.0, () => { sfx('rudebuster_hit', .85); S.fx.shake = 10; }],
    [14.2, () => sfx('badexplosion', .75)],
    [15.0, () => FW.voiceLine(null, 'nonono', 'No no no!', { quiet: true, ms: 900 })]
  ], { endBlack: true });

  /* ============================================================================
     8. THAT DAY IN THE FLOWER SHOP (Authentic Deltarune Ch5 flowershop_0..4 Panels)
     ============================================================================ */
  const BOUQUET = [
    ['#ffe066', 0, -14], ['#7ff07f', -14, -6], ['#ff9a5a', 14, -6],
    ['#8ff8ff', -20, 6], ['#c49bff', 20, 6], ['#9fb6ff', -8, 10], ['#ffe37a', 8, 12]
  ];
  const MEMORY_PANELS = [
    ['flowershop_0', 'Asgore', 'I grew seven flowers in my shop—one golden kingcup, and six in every color of the sun.'],
    ['flowershop_1', 'Asgore', 'After the house grew quiet and everyone left... I kept watering them every morning for twenty years.'],
    ['flowershop_2', 'Asgore', 'I talked to them while I swept the floor. About the old days. About the kid I missed so much.'],
    ['flowershop_3', 'Flowery', 'When the Dark Fountain opened in his back room, the seven of us finally woke up and built him a kingdom.'],
    ['flowershop_4', 'Flowery', 'For the first time in twenty years, the Big Guy smiled. I just... didn\'t want him to wake up lonely again.']
  ];

  C.thatDay = S => run(S, 21, (ctx, t) => {
    // Warm sepia memory backdrop
    const g = ctx.createLinearGradient(0, 0, 0, VH);
    g.addColorStop(0, '#160c06');
    g.addColorStop(0.5, '#28150a');
    g.addColorStop(1, '#100703');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, VW, VH);

    const pIdx = Math.min(MEMORY_PANELS.length - 1, Math.floor((t / 20) * MEMORY_PANELS.length));
    const pStart = (pIdx / MEMORY_PANELS.length) * 20;
    const pEnd = ((pIdx + 1) / MEMORY_PANELS.length) * 20;
    const localK = seg(t, pStart, pEnd);
    const fade = Math.min(1, localK * 6, pIdx < MEMORY_PANELS.length - 1 ? (1 - localK) * 6 : 1);
    const [panelSpr] = MEMORY_PANELS[pIdx];

    // Ornate sepia memory frame housing the real 195x113 Deltarune Chapter 5 illustration
    const px = 22, py = 24, pw = 195, ph = 113;
    ctx.fillStyle = '#0a0502';
    ctx.fillRect(px - 5, py - 5, pw + 10, ph + 10);
    ctx.strokeStyle = '#d9a45b';
    ctx.lineWidth = 2;
    ctx.strokeRect(px - 3, py - 3, pw + 6, ph + 6);
    P().draw(ctx, panelSpr, px, py, { ax: 0, ay: 0, s: 1, alpha: fade });

    // Asgore & his 7 potted flowers beside the memory frame on the right
    BOUQUET.forEach(([col, dx, dy], i) => {
      const sway = Math.sin(t * 1.3 + i) * 1.2;
      P().draw(ctx, 'asgore_flower_0', 268 + dx + sway, 82 + dy, {
        tint: col, s: 0.72, ax: .5, ay: .5, alpha: 0.35 + seg(t, i * 0.45, i * 0.45 + 1.2) * 0.65
      });
    });
    P().draw(ctx, 'asgore_lookback_sad_0', 268, 164, { s: 1.25 });

    // Drifting golden memory motes
    for (let i = 0; i < 26; i++) {
      ctx.fillStyle = 'rgba(255,235,180,' + (0.08 + (i % 3) * 0.05) + ')';
      ctx.fillRect((i * 53 + t * 8) % VW, (i * 31 + t * 11) % 168, 1, 1);
    }

    const beats = MEMORY_PANELS.map(([, who, line], i) => [
      (i / MEMORY_PANELS.length) * 20 + 0.15,
      ((i + 1) / MEMORY_PANELS.length) * 20 - 0.1,
      who,
      line,
      '#f7e6c4',
      who === 'Flowery' ? 'face_flowery_29' : 'asgore_lookback_sad_0'
    ]);
    caption(ctx, t, beats);

    if (t > 20) {
      ctx.fillStyle = 'rgba(0,0,0,' + seg(t, 20, 21) + ')';
      ctx.fillRect(0, 0, VW, VH);
    }
  }, [[0.1, () => sfx('txtasg', .45)]], { endBlack: true });

  /* ============================================================================
     9. RALSEI WALKS THEM HOME (Closing the Threshold Between Worlds)
     ============================================================================ */
  C.doorHome = S => run(S, 9.0, (ctx, t) => {
    ctx.fillStyle = '#05030b';
    ctx.fillRect(0, 0, VW, VH);

    const k = ease(seg(t, 0.3, 6.5));
    const g = seg(t, 3.2, 7.6);
    const doorY = Math.round(lerp(148, 128, k));

    // Castle tile path giving way to the glowing Gardenview doorway
    ctx.save();
    ctx.globalAlpha = 0.65 * (1 - g * 0.5);
    FW.tileFill(ctx, FW.TX.woodLeaf, 56, doorY, VW - 112, VH - doorY, 0, -Math.floor(t * 28));
    ctx.restore();
    radial(ctx, VW / 2, doorY - 24, t, 'rgba(180,255,210,' + (0.15 + g * 0.35) + ')', 22);
    P().draw(ctx, 'dw_landing_glow_0', VW / 2, doorY + 10, { s: 1.1 + g * 0.9, alpha: 0.45 + g * 0.55 });

    const closeIdx = t < 5.2 ? 2 : t < 6.4 ? 1 : 0;
    P().draw(ctx, 'fcastle_pinkdoor_open_' + closeIdx, VW / 2, doorY, { s: 0.95 });
    drawPetals(ctx, t, 0.75 * (1 - g * 0.6), -12, 28);

    // Ralsei leading Scraps, Ginger, and Yatta toward the doorway home
    P().draw(ctx, 'ralsei_walk_up_' + (Math.floor(t * 7) % 4), VW / 2, 178 - t * 4.5, { s: 1.5 - t * 0.05 });
    toon(ctx, 'Scraps', VW / 2 - 48, 232 - Math.abs(Math.sin(t * 7)) * 3 - t * 2, 58);
    toon(ctx, 'Ginger', VW / 2 + 2, 238 - Math.abs(Math.sin(t * 7 + 1)) * 3 - t * 2, 54);
    toon(ctx, 'Yatta', VW / 2 + 52, 234 - Math.abs(Math.sin(t * 7 + 2)) * 3 - t * 2, 58);

    caption(ctx, t, [
      [0.4, 3.0, 'Ralsei', 'Almost back to Gardenview! Step through the light before the Fountain settles!', '#c7f2cf'],
      [3.2, 5.6, 'Flowery', 'Hey, paper cat! Keep that flower drawing on your wall—and visit us anytime!'],
      [5.8, 7.8, 'Scraps', 'I see the Gardenview hallway ahead. Thank you for everything, Ralsei.']
    ]);

    if (t > 7.5) {
      ctx.fillStyle = 'rgba(255,255,255,' + seg(t, 7.5, 8.5) + ')';
      ctx.fillRect(0, 0, VW, VH);
    }
    if (t > 8.4) {
      ctx.fillStyle = 'rgba(0,0,0,' + seg(t, 8.4, 9.0) + ')';
      ctx.fillRect(0, 0, VW, VH);
    }
  }, [
    [0, () => sfx('magicsprinkle', .5)],
    [1.2, () => sfx('step1', .3)],
    [2.6, () => sfx('step2', .3)],
    [4.2, () => sfx('step1', .3)],
    [7.4, () => sfx('great_shine', .65)]
  ], { endBlack: true });

  /* ============================================================================
     10. CREDITS ROLL (Walking Home)
     ============================================================================ */
  const CREDITS = [
    ['FLOWER KINGDOM', 'big'], ['A Dandy\'s Heroes × DELTARUNE Chapter 5 Event', ''], ['', ''],
    ['STARRING', 'h'], ['Scraps', ''], ['Ginger', ''], ['Yatta', ''], ['', ''],
    ['AND THE SANCTUARY OF SEVEN SUNS', 'h'], ['Flowery', ''], ['Seth · Aqua', ''], ['Green · Orange', ''], ['Blue · Yellow', ''], ['Pink', ''], ['Asgore', ''], ['Ralsei', ''], ['', ''],
    ['DELTARUNE characters, sprites, music and sounds', 'h'], ['by Toby Fox and the DELTARUNE team', ''], ['', ''],
    ['MUSIC (DELTARUNE Chapter 5 OST)', 'h'], ['Your Dad\'s Best Friend · Rakuichi Buster · Ride the Board', ''], ['Who Might You Be? · Petal Dance · Sunset of Seven Suns', ''],
    ['Shop 3 · Flower King · I\'m Telling! · Stop, Criminell!', ''], ['Flower Man feat. Camellia · That Day · Walking Home', ''], ['', ''],
    ['Dandy\'s World characters', 'h'], ['from Dandy\'s World', ''], ['', ''],
    ['Sprites gathered in drspritearchive', 'h'], ['', ''], ['', ''],
    ['Thank you for watching our dream.', 'big']
  ];
  const WALKERS = [
    ['flowery_walk_right_jacket_', 4], ['seth_walk_right_', 2], ['aqua_walk_right_', 4],
    ['enemy_green_walk_right_', 4], ['blue_walk_r_', 4], ['yellow_walk_right_', 4],
    ['pink_walk_right_', 4], ['ralsei_walk_right_', 4]
  ];
  C.credits = S => run(S, 46, (ctx, t) => {
    ctx.fillStyle = '#05030a';
    ctx.fillRect(0, 0, VW, VH);
    drawPetals(ctx, t, .4, -12, 20);
    CREDITS.forEach(([s, k], i) => {
      const y = VH + 10 + i * 18 - t * 16;
      if (y < -20 || y > VH + 20) return;
      text(ctx, s, VW / 2, y, {
        size: k === 'big' ? 18 : k === 'h' ? 10 : 12,
        color: k === 'h' ? '#ffd84a' : k === 'big' ? '#ffe066' : '#fff',
        stroke: 3
      });
    });
    const wx = (t * 26) % (VW + 300) - 280;
    WALKERS.forEach(([b, n], i) => P().draw(ctx, b + (Math.floor(t * 7) % n), wx + i * 30, 232));
    toon(ctx, 'Yatta', wx - 40, 232 - Math.abs(Math.sin(t * 9)) * 3, 30);
    toon(ctx, 'Ginger', wx - 70, 232 - Math.abs(Math.sin(t * 9 + 1)) * 3, 28);
    toon(ctx, 'Scraps', wx - 100, 232 - Math.abs(Math.sin(t * 9 + 2)) * 3, 30);
  }, [[0, () => FW.music('flHome')]], { skip: true, endBlack: true });

  window.FlowerCuts = { run, toon, text, omega, radial, speedLines, drawPetals, OMEGA };
})();
