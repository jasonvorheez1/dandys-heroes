/* flowery-cuts.js - the animated cutscenes of "Flower Kingdom" (run by `@cut name` in the story scripts).
   Each one draws on top of the overworld for a fixed time, in Deltarune's 320 x 240 space. Sprites come from flowery.bin;
   Scraps, Ginger and Yatta are the game's own smooth cutouts on purpose. Sounds are Deltarune's (pack) or the game's cues. */
'use strict';

(() => {
  const P = () => window.FlPack;
  const VW = 320, VH = 240;
  const A = (typeof ASSET !== 'undefined' ? ASSET : './');
  const img = src => { const i = new Image(); i.src = A + src; return i; };
  const TW = { Boxten: img('assets/enemies/Twisteds/Boxten.png'), Dandy: img('assets/enemies/Twisteds/Dandy.png'), Brightney: img('assets/enemies/Twisteds/Brightney.webp'),
    Goob: img('assets/enemies/Twisteds/Goob.png'), Shrimpo: img('assets/enemies/Twisteds/Shrimpo.webp') };
  const ease = k => k * k * (3 - 2 * k);
  const cl = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
  const seg = (t, a, b) => cl((t - a) / (b - a));

  /* run a timeline: draw(ctx, t, k) every frame for `secs`; `cues` = [[time, fn]] fire once; Z/tap skips when opt.skip */
  function run(S, secs, draw, cues = [], opt = {}) {
    return new Promise(res => {
      const t0 = performance.now(), fired = new Set();
      let end = secs, finished = false;
      S.fx.fade = 0; S.fx.fadeTo = 0;
      const f = ctx => {
        const t = Math.min(end, (performance.now() - t0) / 1000);
        cues.forEach((c, i) => { if (!fired.has(i) && t >= c[0]) { fired.add(i); try { c[1](); } catch (_) { /* decoration */ } } });
        ctx.save(); draw(ctx, t, cl(t / secs)); ctx.restore();
      };
      S.overlays.push(f);
      const finish = () => {
        if (finished) return; finished = true;
        if (opt.endBlack) { S.fx.fade = 1; S.fx.fadeTo = 1; }
        const i = S.overlays.indexOf(f); if (i >= 0) S.overlays.splice(i, 1);
        document.removeEventListener('keydown', kd, true); S.root.removeEventListener('pointerdown', pd, true);
        res();
      };
      const kd = e => { if (opt.skip && (e.code === 'KeyZ' || e.code === 'Enter' || e.code === 'Space' || e.code === 'Escape')) { e.stopPropagation(); finish(); } };
      const pd = e => { if (opt.skip && !e.target.closest('.fk-quit')) { e.stopPropagation(); finish(); } };
      document.addEventListener('keydown', kd, true); S.root.addEventListener('pointerdown', pd, true);
      setTimeout(finish, secs * 1000 + 30);
    });
  }
  const sfx = (c, v) => FW.sfx(c, { vol: v == null ? .5 : v });
  function toon(ctx, id, x, y, h, o = {}) {
    const im = FW.toonImg[id]; if (!im || !im.naturalWidth) return;
    const w = im.naturalWidth / im.naturalHeight * h;
    ctx.save(); ctx.translate(x, y); if (o.rot) ctx.rotate(o.rot); if (o.flip) ctx.scale(-1, 1);
    ctx.globalAlpha *= o.alpha == null ? 1 : o.alpha; ctx.imageSmoothingEnabled = true;
    if (o.filter) ctx.filter = o.filter;
    ctx.drawImage(im, -w / 2, -h, w, h); ctx.filter = 'none'; ctx.restore(); ctx.imageSmoothingEnabled = false;
  }
  function text(ctx, s, x, y, o = {}) {
    ctx.save(); ctx.font = (o.weight || 900) + ' ' + (o.size || 16) + 'px ' + (o.font || '"Courier New",monospace');
    ctx.textAlign = o.align || 'center'; ctx.textBaseline = 'middle'; ctx.globalAlpha *= o.alpha == null ? 1 : o.alpha;
    if (o.rot) { ctx.translate(x, y); ctx.rotate(o.rot); x = 0; y = 0; }
    ctx.lineJoin = 'round'; ctx.lineWidth = o.stroke || 4; ctx.strokeStyle = o.strokeColor || '#000'; ctx.strokeText(s, x, y);
    ctx.fillStyle = o.color || '#fff'; ctx.fillText(s, x, y); ctx.restore();
  }
  function speedLines(ctx, t, dir = 'up', col = 'rgba(255,255,255,.5)', n = 22) {
    ctx.save(); ctx.strokeStyle = col; ctx.lineWidth = 1;
    for (let i = 0; i < n; i++) {
      const r = (i * 97.13) % 1, L = 20 + r * 60;
      if (dir === 'up') { const x = (i * 37) % VW, y = VH - ((t * 600 + i * 53) % (VH + L)); ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, y + L); ctx.stroke(); }
      else { const y = 20 + (i * 29) % (VH - 40), x = VW - ((t * 900 + i * 71) % (VW + L)); ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + L, y); ctx.stroke(); }
    }
    ctx.restore();
  }
  function radial(ctx, cx, cy, t, col, n = 28) {
    ctx.save(); ctx.fillStyle = col;
    for (let i = 0; i < n; i++) {
      const a = i / n * Math.PI * 2 + t * .3, w = .03 + ((i * 13) % 5) * .006;
      ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx + Math.cos(a - w) * 400, cy + Math.sin(a - w) * 400); ctx.lineTo(cx + Math.cos(a + w) * 400, cy + Math.sin(a + w) * 400); ctx.fill();
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
  // Omega Flowery: Flowery's own form plus each flower's piece, each glowing in its color (as in the Chapter 5 finale)
  const OMEGA = [['omegaf_green', '#5cff6a', '#d8ffd8', -16, -2], ['omegaf_aqua', '#4ff4ff', '#e0ffff', -10, 4], ['omegaf_seth', '#b07bff', '#efe2ff', 10, -8],
    ['omegaf_yellow', '#ffd23a', '#fff6c8', 6, -14], ['omegaf_blue', '#7f9bff', '#e2e8ff', 16, -2], ['omegaf_orange', '#ff8a4a', '#ffe4d2', -2, 8]];
  // each flower: a pale glowing body (its sprite) with its outline sprite in full color; Flowery's own form in front
  function omega(ctx, x, y, t, o = {}) {
    const s = o.s || 1.15, f = Math.floor(t * 8) % 3, al = o.alpha == null ? 1 : o.alpha;
    OMEGA.forEach(([n, col, pale, dx, dy], i) => {
      const bx = x + dx * s * 1.4, by = y - 4 + dy * s * 1.4 + Math.sin(t * 3 + i) * 1.5;
      P().draw(ctx, n + '_o_' + f, bx, by + 1, { s: s * 1.07, tint: col, alpha: .75 * al });          // colored glow edge
      P().draw(ctx, n + '_' + f, bx, by, { s, alpha: .78 * al });                                       // white body + line art
      P().draw(ctx, n + '_' + f, bx, by, { s, tint: pale, alpha: .9 * al, blend: 'multiply' });         // pastel wash
    });
    const pose = (o.pose || 'omegaflowery_jarona') + '_' + f;
    P().draw(ctx, pose, x, y + 1, { s: s * 1.12, tint: '#ffd23a', alpha: .8 * al });
    P().draw(ctx, pose, x, y, { s: s * 1.05, alpha: al });
  }

  const C = FW.CUTS;

  /* ---------------------------------------------------------- 1. the vents */
  C.door = S => run(S, 6, (ctx, t) => {
    ctx.fillStyle = '#05040a'; ctx.fillRect(0, 0, VW, VH);
    const z = t * .9;
    for (let i = 0; i < 14; i++) {
      const d = ((i - z * 3) % 14 + 14) % 14, sc = Math.pow(.78, d), w = VW * sc * 1.4, h = VH * sc * 1.2;
      ctx.strokeStyle = 'rgba(150,150,170,' + (0.08 + sc * .5) + ')'; ctx.lineWidth = Math.max(1, sc * 4);
      ctx.strokeRect(VW / 2 - w / 2, VH / 2 - h / 2, w, h);
    }
    // the little door at the end, growing as they crawl
    const k = ease(seg(t, .3, 4)), ds = .35 + k * 1.6, open = t > 3.6 ? Math.min(2, Math.floor((t - 3.6) * 6)) : -1;
    P().draw(ctx, open < 0 ? 'fcastle_pinkdoor_0' : 'fcastle_pinkdoor_open_' + open, VW / 2, VH / 2 + 50 * ds * .6, { s: ds * .6 });
    if (t > 3.6) { const g = seg(t, 3.6, 5.4); ctx.fillStyle = 'rgba(255,250,230,' + g + ')'; ctx.fillRect(0, 0, VW, VH); radial(ctx, VW / 2, VH / 2, t, 'rgba(255,240,180,' + (g * .5) + ')'); }
    // three cutouts crawling in the foreground, from behind
    const bob = i => Math.abs(Math.sin(t * 6 + i * 1.7)) * 3;
    toon(ctx, 'Yatta', 110, 252 - bob(0), 70, { filter: 'brightness(.35)', rot: Math.sin(t * 6) * .05 });
    toon(ctx, 'Ginger', 160, 258 - bob(1), 66, { filter: 'brightness(.35)' });
    toon(ctx, 'Scraps', 212, 254 - bob(2), 70, { filter: 'brightness(.35)', flip: true });
    if (t < 3.5) text(ctx, t < 1.8 ? 'YATTA: IT\'S JUST UP HERE!!!' : 'GINGER: ...it smells like sunscreen and candy.', VW / 2, 22, { size: 11, alpha: .9 });
  }, [[.2, () => sfx('step1', .3)], [1.2, () => sfx('step2', .3)], [2.2, () => sfx('step1', .3)], [3.6, () => sfx('dooropen', .7)], [4.2, () => sfx('great_shine', .6)]]);

  /* ---------------------------------------------------------- 2. the fall into the Dark World */
  C.fall = S => run(S, 6.5, (ctx, t) => {
    const k = seg(t, 0, 5.2);
    const g = ctx.createLinearGradient(0, 0, 0, VH);
    g.addColorStop(0, k < .5 ? '#0a0418' : '#ff6a3a'); g.addColorStop(1, k < .5 ? '#2a0c3a' : '#ffd07a');
    ctx.fillStyle = g; ctx.fillRect(0, 0, VW, VH);
    if (k > .45) { ctx.globalAlpha = seg(k, .45, .8); FW.sunsetSky(ctx, { x: 0 }, t, { cliffY: 260 - seg(t, 3, 5.2) * 120 }); ctx.globalAlpha = 1; }
    speedLines(ctx, t, 'up', 'rgba(255,255,255,' + (.25 + k * .3) + ')', 30);
    drawPetals(ctx, t, .9, 10, -160);
    if (t > 2.6) for (let i = 0; i < 3; i++) P().draw(ctx, 'sunrise_back_clouds_0', -200 + i * 260, VH + 60 - ((t - 2.6) * 260 + i * 90) % 520, { ax: 0, ay: .5, alpha: .7 });
    const land = seg(t, 5.0, 5.3);
    [['Yatta', 90, 0], ['Ginger', 160, 1], ['Scraps', 230, 2]].forEach(([id, x, i]) => {
      const y = 70 + Math.sin(t * 2 + i) * 14 + land * 120 + i * 6;
      toon(ctx, id, x + Math.sin(t * 1.3 + i) * 10, y, 54, { rot: land < 1 ? t * (2.5 + i * .7) * (i % 2 ? -1 : 1) : 0 });
    });
    if (t < 2.5) text(ctx, 'YATTA: WHEEEEEEEEEEEEEE!!!', VW / 2 + Math.sin(t * 20) * 2, 30, { size: 14, color: '#ffe95c' });
    else if (t < 4.6) text(ctx, 'SCRAPS: WE\'RE FALLING UP!? DOWN!? WHICH WAY IS IT', VW / 2, 30, { size: 10 });
    if (t > 5.25) { ctx.fillStyle = 'rgba(255,255,255,' + (1 - seg(t, 5.25, 6.2)) + ')'; ctx.fillRect(0, 0, VW, VH); }
  }, [[0, () => sfx('wing', .5)], [2.6, () => sfx('rumble', .3)], [5.25, () => { sfx('impact', .8); S.fx.shake = 10; }]], { endBlack: true });

  /* ---------------------------------------------------------- 3. Flower Castle on the hill */
  C.castle = S => run(S, 4.5, (ctx, t) => {
    const a = seg(t, 0, .5) * (1 - seg(t, 3.9, 4.5));
    ctx.globalAlpha = a;
    FW.sunsetSky(ctx, { x: t * 30 }, t, { cliffY: 200 });
    radial(ctx, VW / 2, 70, t, 'rgba(255,240,180,.18)', 20);
    const rise = ease(seg(t, .2, 2.4));
    P().draw(ctx, 'castle_distance_small_0', VW / 2, 210 - rise * 40, { s: 1.15 + rise * .25 });
    drawPetals(ctx, t, a);
    text(ctx, 'FLOWER CASTLE', VW / 2, 34, { size: 22, color: '#ffe066', alpha: seg(t, 1.2, 2), stroke: 5, strokeColor: '#5a1030' });
    text(ctx, 'Population: seven. Plus whoever Flowery lets in.', VW / 2, 56, { size: 9, alpha: seg(t, 2, 2.6) });
  }, [[.1, () => sfx('great_shine', .4)], [1.2, () => sfx('orchhit', .4)]]);

  /* ---------------------------------------------------------- 4. the ichor comes up */
  C.ichorRise = S => run(S, 5.5, (ctx, t) => {
    const lvl = ease(seg(t, .2, 3)) * (1 - ease(seg(t, 4.4, 5.5)) * .6);
    const top = VH - lvl * 110;
    // the Twisted shapes rising out of it
    [['Boxten', 70, 0, 74], ['Brightney', 250, .6, 70], ['Dandy', 160, 1.2, 96]].forEach(([n, x, d, h]) => {
      const im = TW[n]; if (!im.naturalWidth) return;
      const up = ease(seg(t, .8 + d, 2.6 + d)) * (1 - ease(seg(t, 4 + d * .3, 5.2)));
      const w = im.naturalWidth / im.naturalHeight * h;
      ctx.save(); ctx.globalAlpha = .92 * up; ctx.imageSmoothingEnabled = true; ctx.filter = 'brightness(0) drop-shadow(0 0 4px #b040ff)';
      ctx.drawImage(im, x - w / 2 + Math.sin(t * 2 + d) * 4, top + 30 - up * (h * .8), w, h); ctx.restore();
    });
    ctx.fillStyle = '#07000e';
    ctx.beginPath(); ctx.moveTo(0, VH);
    for (let x = 0; x <= VW; x += 8) ctx.lineTo(x, top + Math.sin(x * .05 + t * 3) * 5 + Math.sin(x * .13 - t * 2) * 3);
    ctx.lineTo(VW, VH); ctx.fill();
    ctx.fillStyle = 'rgba(160,60,255,.35)';
    for (let i = 0; i < 18; i++) { const x = (i * 47 + t * 13) % VW, y = top + 8 + ((i * 31 + t * 30) % 90); ctx.beginPath(); ctx.arc(x, y, 1 + (i % 3), 0, 7); ctx.fill(); }
    if (t > 1.5 && t < 4.2) text(ctx, '* ...the stones are bleeding.', VW / 2, 20, { size: 11, alpha: seg(t, 1.5, 2) });
  }, [[.2, () => { sfx('rumble', .6); S.fx.shake = 6; }], [1.0, () => sfx('noise', .3)], [1.9, () => sfx('creepyjingle', .35)], [3, () => { S.fx.shake = 8; sfx('screenshake', .5); }]]);

  /* ---------------------------------------------------------- 5. every flower holds their wing */
  C.flowersCall = S => run(S, 8.5, (ctx, t) => {
    ctx.fillStyle = '#000'; ctx.fillRect(0, 0, VW, VH);
    const panels = [
      { y: 0, c: '#3c1f4a', from: -1, t0: 0, label: 'THE ROAD', draw: (x, y, lt) => {
        P().draw(ctx, 'seth_throw_' + Math.min(6, Math.floor(lt * 7)), x + 70, y + 74, { s: 1 });
        P().draw(ctx, 'aqua_walk_right_' + (Math.floor(lt * 8) % 4), x + 110, y + 74);
        for (let i = 0; i < 4; i++) P().draw(ctx, 'faqua_knife_spinning_' + (Math.floor(lt * 10 + i) % 4), x + 140 + ((lt * 160 + i * 30) % 130), y + 40 + i * 8, { ax: .5, ay: .5, s: .3 });
        P().draw(ctx, 'enemy_floradin_' + (Math.floor(lt * 6) % 4), x + 270, y + 74, { tint: '#120018', alpha: lt > 1.6 ? .3 : 1 });
      } },
      { y: 80, c: '#4a2a14', from: 1, t0: 2.2, label: 'THE CAFE', draw: (x, y, lt) => {
        P().draw(ctx, 'enemy_green_pan_widerswing_' + (Math.floor(lt * 6) % 3), x + 80, y + 76);
        P().draw(ctx, 'orange_animepunch_' + Math.min(5, Math.floor(lt * 5)), x + 170, y + 76, { s: 1.1 });
        P().draw(ctx, 'kawkaw_' + (Math.floor(lt * 6) % 3), x + 265, y + 76, { tint: '#120018', alpha: lt > 1.5 ? .3 : 1 });
      } },
      { y: 160, c: '#14234a', from: -1, t0: 4.4, label: 'THE LEFT WING', draw: (x, y, lt) => {
        P().draw(ctx, 'yellow_shoot_' + (Math.floor(lt * 4) % 2), x + 70, y + 78);
        P().draw(ctx, 'enemy_blue_spintopose_' + (Math.floor(lt * 6) % 4), x + 120, y + 78);
        for (let i = 0; i < 3; i++) P().draw(ctx, 'petal_blue2_' + (Math.floor(lt * 8 + i) % 4), x + 100 + ((lt * 140 + i * 40) % 140), y + 44 + i * 6, { ax: .5, ay: .5 });
        P().draw(ctx, 'mantis_idle_' + (Math.floor(lt * 5) % 3), x + 265, y + 78, { tint: '#120018', alpha: lt > 1.6 ? .3 : 1 });
      } }
    ];
    panels.forEach(p => {
      const lt = t - p.t0; if (lt < 0) return;
      const slide = (1 - ease(seg(lt, 0, .45))) * VW * p.from;
      ctx.save(); ctx.beginPath(); ctx.rect(0, p.y + 2, VW, 76); ctx.clip();
      ctx.fillStyle = p.c; ctx.fillRect(slide, p.y, VW, 80);
      speedLines(ctx, t + p.t0, 'side', 'rgba(255,255,255,.12)', 10);
      p.draw(slide, p.y, lt);
      text(ctx, p.label, slide + 8, p.y + 12, { size: 9, align: 'left', color: '#ffd84a' });
      ctx.restore();
      ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.strokeRect(slide + 1, p.y + 2, VW - 2, 76);
    });
    if (t > 6.8) { const a = seg(t, 6.8, 7.4); ctx.fillStyle = 'rgba(0,0,0,' + a * .7 + ')'; ctx.fillRect(0, 0, VW, VH); text(ctx, 'THE FLOWERS HOLD THE CASTLE.', VW / 2, VH / 2, { size: 15, color: '#ffe066', alpha: a }); }
  }, [[0, () => FW.music('flFlowers')], [.3, () => sfx('weaponpull', .5)], [1.2, () => sfx('hit', .5)], [2.5, () => sfx('heavyswing', .5)], [3.4, () => sfx('impact', .6)], [4.7, () => sfx('drive', .3)], [5.4, () => sfx('magicsprinkle', .5)], [6.8, () => sfx('orchhit', .5)]]);

  /* ---------------------------------------------------------- 6. LV 99 (Flowery types in his stats) */
  const FAKE = ['LV 99', 'ATK 99', 'DEF 99', 'MAGIC 99', 'FLOWERS LV.99', 'FLOWERINESS ✿✿✿', 'GUTS ✿✿✿✿✿', 'ROMANCE 999', 'HAIR 100%', 'STYLE: YES', 'HUMILITY 0'];
  C.powerUp = S => run(S, 6, (ctx, t) => {
    ctx.fillStyle = 'rgba(10,0,20,' + (.6 + .3 * seg(t, 0, 1)) + ')'; ctx.fillRect(0, 0, VW, VH);
    radial(ctx, VW / 2, 150, t * 3, 'rgba(255,220,90,' + (.12 + .1 * Math.sin(t * 9)) + ')', 24);
    for (let r = 0; r < 4; r++) { const rr = ((t * 70 + r * 30) % 120); ctx.strokeStyle = 'rgba(255,230,120,' + (1 - rr / 120) + ')'; ctx.lineWidth = 2; ctx.beginPath(); ctx.ellipse(VW / 2, 190, rr, rr * .3, 0, 0, 7); ctx.stroke(); }
    const f = t < 3.6 ? 'flowery_poweringup_' + (Math.floor(t * 8) % 5) : 'flowery_powering_up_finish_' + Math.min(4, Math.floor((t - 3.6) * 7));
    P().draw(ctx, f, VW / 2, 196 + Math.sin(t * 30) * (t < 3.6 ? 1 : 0), { s: 2.4, add: '#ffe066', addA: .25 + .2 * Math.sin(t * 12) });
    FAKE.forEach((s, i) => {
      const st = .3 + i * .38; if (t < st) return;
      const lt = t - st, x = 40 + ((i * 83) % 240), y = 200 - lt * 60;
      text(ctx, s, x, y, { size: 11 + (i % 3) * 2, color: i % 2 ? '#ffe066' : '#ff9ad0', alpha: 1 - seg(lt, 1.6, 2.4) });
    });
    if (t > 4.2) text(ctx, 'FLOWERY · LV 99 (TYPED IN BY HAND)', VW / 2, 26, { size: 12, color: '#fff', alpha: seg(t, 4.2, 4.6) });
    if (t > 5.4) { ctx.fillStyle = 'rgba(255,255,255,' + seg(t, 5.4, 6) + ')'; ctx.fillRect(0, 0, VW, VH); }
  }, [[0, () => FW.voiceLine(null, 'powering_up', 'Powering up!', { quiet: true })], [.2, () => sfx('power', .6)], [1.6, () => sfx('boost', .5)], [3.6, () => { sfx('great_shine', .7); S.fx.shake = 6; }], [5.4, () => sfx('tensionhorn', .6)]]);

  /* ---------------------------------------------------------- 7. NO ONE CAN OUTSPEED A FLOWER (after the fight) */
  C.omegaChase = S => run(S, 17, (ctx, t) => {
    const slow = t > 12 && t < 14.2 ? .18 : 1;
    const vt = t < 12 ? t : t < 14.2 ? 12 + (t - 12) * .18 : 12.4 + (t - 14.2);
    FW.sunsetSky(ctx, { x: vt * 220 }, vt, { cliffY: 130 });
    // the cliff-top running floor: grass band over dark ground, scrolling fast
    ctx.fillStyle = '#2b1838'; ctx.fillRect(0, 150, VW, 90);
    FW.tileFill(ctx, FW.TX.grass, 0, 196, VW, 22, vt * 420, 0);
    ctx.fillStyle = 'rgba(0,0,0,.25)'; ctx.fillRect(0, 150, VW, 4);
    speedLines(ctx, vt, 'side', 'rgba(255,255,255,' + (slow < 1 ? .1 : .35) + ')', 26);
    // Omega Flowery
    let ox = 230, oy = 196;
    if (t < 2) ox = 330 - ease(seg(t, 0, 1.4)) * 100;
    else if (t < 6) ox = 230 + Math.sin(t * 2) * 30;
    else if (t < 8) ox = 260 - Math.sin((t - 6) * 3) * 10;
    else if (t < 12) ox = 240 + Math.sin(t * 1.5) * 20;
    else if (t < 14.2) ox = 232;
    const split = seg(t, 14.2, 15.4);
    if (split <= 0) omega(ctx, ox, oy - Math.abs(Math.sin(vt * 9)) * 4, vt, { pose: t > 6.2 && t < 7.2 ? 'omegaflowery_deflect' : 'omegaflowery_jarona' });
    else {
      OMEGA.forEach(([n, col], i) => {
        const a = i / OMEGA.length * Math.PI * 2;
        P().draw(ctx, n + '_o_0', ox + Math.cos(a) * split * 160, oy - 30 + Math.sin(a) * split * 120 - split * 40, { s: 1.4, tint: col, alpha: 1 - split, rot: split * 6 });
      });
      const fy = oy - 60 * Math.sin(split * Math.PI) + seg(t, 15.4, 16) * 0;
      P().draw(ctx, split < 1 ? 'flowery_hurt_0' : 'flowery_crouch_left_0', ox + split * 20, Math.min(oy, fy + split * 60), { s: 1.4, rot: split < 1 ? split * 8 : 0 });
    }
    // the trio running after him
    const run = i => Math.abs(Math.sin(vt * 14 + i * 2)) * 4;
    let sx = 120, gx = 80, yx = 40;
    if (t > 6 && t < 7.4) sx = 120 + Math.sin(seg(t, 6, 6.6) * Math.PI) * 100;      // Scraps grapples in... and gets swatted
    if (t > 8.5) gx = 80 - seg(t, 8.5, 9.5) * 30;                                       // Ginger falls behind
    if (t > 10.2) yx = 40 + ease(seg(t, 10.2, 12.4)) * 160;                             // Yatta: Spring Loaded
    if (t > 14.2) { sx += seg(t, 14.2, 16) * 40; gx += seg(t, 14.2, 16) * 60; }
    if (t > 6 && t < 6.6) { ctx.strokeStyle = '#ffd36b'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(sx, 170); ctx.lineTo(ox, 170); ctx.stroke(); }
    toon(ctx, 'Ginger', gx, 200 - run(1), 46, { rot: Math.sin(vt * 14) * .08 });
    toon(ctx, 'Scraps', sx, 200 - run(2) - (t > 6 && t < 7.4 ? Math.sin(seg(t, 6, 7.4) * Math.PI) * 50 : 0), 48, { rot: t > 6.6 && t < 7.4 ? -seg(t, 6.6, 7.4) * 6 : Math.sin(vt * 14) * .08 });
    toon(ctx, 'Yatta', yx, 200 - run(0) - (t > 11.2 && t < 13.6 ? Math.sin(seg(t, 11.2, 13.6) * Math.PI) * 60 : 0), 48, { rot: t > 11.2 && t < 12.2 ? vt * 9 : Math.sin(vt * 14) * .08 });
    // Ginger's heart cookie to Yatta
    if (t > 9.2 && t < 10.4) { const k = seg(t, 9.2, 10.4); text(ctx, '♥', gx + (yx - gx) * k, 160 - Math.sin(k * Math.PI) * 50, { size: 18, color: '#ff6b9a' }); }
    // captions
    if (t > 1.4 && t < 4.8) text(ctx, 'NO ONE CAN OUTSPEED A FLOWER!', VW / 2, 46, { size: 17, color: '#fff', strokeColor: '#e0207a', rot: -.06, alpha: seg(t, 1.4, 1.7) });
    if (t > 6 && t < 7) text(ctx, 'CRAFTY GRAPPLE!', sx + 30, 120, { size: 11, color: '#ffd36b' });
    if (t > 7 && t < 8.2) text(ctx, 'FLOWERY: Nice try, Origami!', VW / 2, 34, { size: 11 });
    if (t > 9 && t < 10.6) text(ctx, 'GINGER: Yatta— take it! For you!', VW / 2, 34, { size: 11, color: '#ffb3c9' });
    if (t > 10.4 && t < 12) text(ctx, 'YATTA: SPRING LOADED!!!', VW / 2, 34, { size: 13, color: '#ffe95c' });
    if (slow < 1) { ctx.fillStyle = 'rgba(40,0,60,.35)'; ctx.fillRect(0, 0, VW, VH); radial(ctx, ox - 10, 160, vt, 'rgba(0,0,0,.35)', 30); }
    if (t > 13 && t < 14.4) { ctx.fillStyle = 'rgba(255,255,255,' + (1 - seg(t, 13, 13.4)) * .9 + ')'; ctx.fillRect(0, 0, VW, VH); text(ctx, 'TAG.', VW / 2, VH / 2 - 10, { size: 40, color: '#ffe95c', strokeColor: '#000', stroke: 6 }); }
    if (t > 15.4) { ctx.fillStyle = 'rgba(255,255,255,' + seg(t, 15.4, 17) + ')'; ctx.fillRect(0, 0, VW, VH); }
  }, [[0, () => { FW.music('flBoss'); sfx('great_shine', .7); }], [.4, () => FW.voiceLine(null, 'omega', 'OMEGA FLOWERY!', { quiet: true })],
    [2.4, () => FW.voiceLine(null, 'sanfrandisco', 'Here I come, Sanfrandisco!', { quiet: true })], [6, () => sfx('chain_extend', .6)], [6.6, () => { sfx('impact', .7); S.fx.shake = 6; }],
    [7.1, () => FW.voiceLine(null, 'hah', 'Hah!', { quiet: true, ms: 700 })], [9.3, () => sfx('power', .6)], [10.3, () => sfx('boost', .7)], [12, () => sfx('weirdeffect', .4)],
    [13, () => { sfx('rudebuster_hit', .8); S.fx.shake = 10; }], [14.2, () => sfx('badexplosion', .7)], [15, () => FW.voiceLine(null, 'nonono', 'No no no!', { quiet: true, ms: 900 })]], { endBlack: true });

  /* ---------------------------------------------------------- 8. that day (Asgore remembers) */
  const BOUQUET = [['#ffe066', 0, -14], ['#7ff07f', -14, -6], ['#ff9a5a', 14, -6], ['#8ff8ff', -20, 6], ['#c49bff', 20, 6], ['#9fb6ff', -8, 10], ['#ffe37a', 8, 12]];
  const MEMORY = ['Twenty years ago, I grew seven flowers.', 'I asked her a question with them.', 'She said yes. For a while.',
    'When the shop was quiet, I talked to them. I sang to them. Badly.', 'I never once thought they were listening.', '...They were, of course. Flowers are very nosy.'];
  C.thatDay = S => run(S, 15, (ctx, t) => {
    ctx.fillStyle = '#1a0f08'; ctx.fillRect(0, 0, VW, VH);
    // a window, light falling in
    ctx.fillStyle = 'rgba(255,220,160,.12)'; ctx.beginPath(); ctx.moveTo(200, 20); ctx.lineTo(290, 20); ctx.lineTo(260, 200); ctx.lineTo(130, 200); ctx.fill();
    ctx.fillStyle = '#3a2614'; ctx.fillRect(200, 20, 90, 60); ctx.fillStyle = '#f2d9a8'; ctx.fillRect(204, 24, 38, 52); ctx.fillRect(248, 24, 38, 52);
    // the shop counter and the bouquet
    ctx.fillStyle = '#4a3020'; ctx.fillRect(40, 160, 240, 12); ctx.fillStyle = '#2e1e12'; ctx.fillRect(48, 172, 224, 50);
    BOUQUET.forEach(([col, dx, dy], i) => {
      const sway = Math.sin(t * 1.2 + i) * 1.5;
      ctx.strokeStyle = '#3d6b2a'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(110, 160); ctx.lineTo(110 + dx + sway, 128 + dy); ctx.stroke();
      P().draw(ctx, 'asgore_flower_0', 110 + dx + sway, 132 + dy, { tint: col, s: .7, ax: .5, ay: .5 });
    });
    P().draw(ctx, 'asgore_lookback_sad_0', 210, 160, { s: 1.4 });
    // sepia film
    ctx.fillStyle = 'rgba(112,66,20,.28)'; ctx.fillRect(0, 0, VW, VH);
    for (let i = 0; i < 30; i++) { ctx.fillStyle = 'rgba(255,240,200,' + (.04 + (i % 3) * .02) + ')'; ctx.fillRect((i * 53 + t * 7) % VW, (i * 31 + t * 11) % VH, 1, 1); }
    ctx.fillStyle = 'rgba(0,0,0,.35)'; ctx.fillRect(0, 0, VW, 14); ctx.fillRect(0, VH - 14, VW, 14);
    const i = Math.min(MEMORY.length - 1, Math.floor(t / 2.35)), lt = t - i * 2.35, s = MEMORY[i];
    const shown = s.slice(0, Math.floor(lt * 34));
    ctx.fillStyle = 'rgba(0,0,0,.6)'; ctx.fillRect(10, 196, VW - 20, 30);
    text(ctx, shown, VW / 2, 211, { size: 9, color: '#f2d9a8', stroke: 2 });
    if (t > 14) { ctx.fillStyle = 'rgba(0,0,0,' + seg(t, 14, 15) + ')'; ctx.fillRect(0, 0, VW, VH); }
  }, [[.1, () => sfx('txtasg', .4)]], { endBlack: true, skip: true });

  /* ---------------------------------------------------------- 9. Ralsei walks them home */
  C.doorHome = S => run(S, 6, (ctx, t) => {
    ctx.fillStyle = '#04030a'; ctx.fillRect(0, 0, VW, VH);
    for (let i = 0; i < 12; i++) {
      const d = ((i - t * 2.2) % 12 + 12) % 12, sc = Math.pow(.8, d), w = VW * sc * 1.3, h = VH * sc * 1.3;
      ctx.strokeStyle = 'rgba(120,255,160,' + (.05 + sc * .35) + ')'; ctx.lineWidth = Math.max(1, sc * 3); ctx.strokeRect(VW / 2 - w / 2, VH / 2 - h / 2, w, h);
    }
    const g = seg(t, 2.5, 5);
    ctx.fillStyle = 'rgba(255,250,235,' + (.3 + g * .7) + ')'; ctx.fillRect(VW / 2 - 10 - g * 30, VH / 2 - 8 - g * 20, 20 + g * 60, 16 + g * 40);
    P().draw(ctx, 'ralsei_walk_up_' + (Math.floor(t * 7) % 4), VW / 2, 180 - t * 6, { s: 1.6 - t * .1 });
    toon(ctx, 'Scraps', VW / 2 - 50, 236 - Math.abs(Math.sin(t * 7)) * 3, 64, { filter: 'brightness(.5)' });
    toon(ctx, 'Ginger', VW / 2 + 4, 244 - Math.abs(Math.sin(t * 7 + 1)) * 3, 60, { filter: 'brightness(.5)' });
    toon(ctx, 'Yatta', VW / 2 + 56, 238 - Math.abs(Math.sin(t * 7 + 2)) * 3, 64, { filter: 'brightness(.5)' });
    if (t < 2.4) text(ctx, 'RALSEI: Almost there! Don\'t look at the walls!', VW / 2, 20, { size: 10, color: '#9ff0b0' });
    if (t > 5) { ctx.fillStyle = 'rgba(255,255,255,' + seg(t, 5, 6) + ')'; ctx.fillRect(0, 0, VW, VH); }
  }, [[0, () => sfx('magicsprinkle', .5)], [1, () => sfx('step1', .3)], [2, () => sfx('step2', .3)], [4.8, () => sfx('great_shine', .6)]], { endBlack: true });

  /* ---------------------------------------------------------- 10. credits */
  const CREDITS = [
    ['FLOWER KINGDOM', 'big'], ['A Dandy\'s Heroes × DELTARUNE event', ''], ['', ''],
    ['STARRING', 'h'], ['Scraps', ''], ['Ginger', ''], ['Yatta', ''], ['', ''],
    ['AND', 'h'], ['Flowery', ''], ['Seth · Aqua', ''], ['Green · Orange', ''], ['Blue · Yellow', ''], ['Pink', ''], ['Asgore', ''], ['Ralsei', ''], ['', ''],
    ['DELTARUNE characters, sprites, music and sounds', 'h'], ['by Toby Fox and the DELTARUNE team', ''], ['', ''],
    ['MUSIC (DELTARUNE Chapter 5 OST)', 'h'], ['Your Dad\'s Best Friend · Rakuichi Buster · Ride the Board', ''], ['Who Might You Be? · Petal Dance · Sunset of Seven Suns', ''],
    ['Shop 3 · Flower King · I\'m Telling! · Stop, Criminell!', ''], ['Flower Man feat. Camellia · That Day · Walking Home', ''], ['', ''],
    ['Dandy\'s World characters', 'h'], ['from Dandy\'s World', ''], ['', ''],
    ['Sprites gathered in drspritearchive', 'h'], ['', ''], ['', ''],
    ['Thank you for watching our dream.', 'big']
  ];
  const WALKERS = [['flowery_walk_right_jacket_', 4], ['seth_walk_right_', 2], ['aqua_walk_right_', 4], ['enemy_green_walk_right_', 4], ['blue_walk_r_', 4], ['yellow_walk_right_', 4], ['pink_walk_right_', 4], ['ralsei_walk_right_', 4]];
  C.credits = S => run(S, 46, (ctx, t) => {
    ctx.fillStyle = '#000'; ctx.fillRect(0, 0, VW, VH);
    drawPetals(ctx, t, .35, -12, 20);
    CREDITS.forEach(([s, k], i) => {
      const y = VH + 10 + i * 18 - t * 16;
      if (y < -20 || y > VH + 20) return;
      text(ctx, s, VW / 2, y, { size: k === 'big' ? 18 : k === 'h' ? 10 : 12, color: k === 'h' ? '#ffd84a' : k === 'big' ? '#ffe066' : '#fff', stroke: 3 });
    });
    const wx = (t * 26) % (VW + 300) - 280;
    WALKERS.forEach(([b, n], i) => P().draw(ctx, b + (Math.floor(t * 7) % n), wx + i * 30, 232));
    toon(ctx, 'Yatta', wx - 40, 232 - Math.abs(Math.sin(t * 9)) * 3, 30);
    toon(ctx, 'Ginger', wx - 70, 232 - Math.abs(Math.sin(t * 9 + 1)) * 3, 28);
    toon(ctx, 'Scraps', wx - 100, 232 - Math.abs(Math.sin(t * 9 + 2)) * 3, 30);
  }, [[0, () => FW.music('flHome')]], { skip: true, endBlack: true });

  window.FlowerCuts = { run, toon, text, omega, radial, speedLines, drawPetals, OMEGA };
})();
