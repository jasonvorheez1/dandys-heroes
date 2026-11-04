/* flowery-battle.js - the fights of "Flower Kingdom".
   - floradinn: a scripted Dandy's Heroes-style auto battle. The trio can't hurt Darkners (every hit is "1"); Flowery cuts in.
   - ichor: an auto battle against "Inked" Chapter 5 Darkners and Gardenview ichor (these exist only in this event); Asgore charges in.
   - flowery: the boss. It starts as an auto battle, Flowery breaks the AUTO button, and the rest is a hard turn-based fight:
     the trio is commanded (FIGHT / SKILL / ITEM / DEFEND), Ralsei acts on his own as a guest, and Flowery's moves come from his
     Chapter 5 fight turned into JRPG attacks: every hit can be Braced with good timing (a perfect Brace on a charge counters).
   Losing never ends the event: Flowery puts you back at the start of the phase, Green restores the items, and after six losses
   the fight gets easier (as in Chapter 5). */
'use strict';

(() => {
  const P = () => window.FlPack;
  const VW = 320, VH = 240;
  const A = (typeof ASSET !== 'undefined' ? ASSET : './');
  const cl = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
  const ease = k => k * k * (3 - 2 * k);
  const rnd = (a, b) => a + Math.random() * (b - a);
  const pick = arr => arr[Math.floor(Math.random() * arr.length)];
  const wait = ms => new Promise(r => setTimeout(r, ms));
  const sfx = (c, v, rate) => FW.sfx(c, { vol: v == null ? .5 : v, rate });
  const say = (who, face, txt, o) => FW.say(who, face, txt, o || {});
  const voice = (k, txt, o) => FW.voiceLine(null, k, txt, Object.assign({ quiet: true }, o || {}));
  const icon = id => (typeof ItemSheet !== 'undefined' ? ItemSheet.icon(id) : '');
  const DHIMG = {};
  const dhImg = src => DHIMG[src] || (DHIMG[src] = Object.assign(new Image(), { src: A + src }));

  /* ======================================================================== stage */
  function mount(S, bg) {
    const host = S.root.querySelector('.fk-screen');
    const root = document.createElement('div'); root.className = 'fb-root';
    root.innerHTML = '<canvas class="fb-cv"></canvas><div class="fb-ui"></div>';
    host.appendChild(root);
    const cv = root.querySelector('canvas'), ctx = cv.getContext('2d'), ui = root.querySelector('.fb-ui');
    const B = { S, root, host, cv, ctx, ui, t: 0, rt: 0, units: [], pops: [], parts: [], over: [], bg, shake: 0, flash: 0, flashCol: '#fff', gray: 0, frozen: false, alive: true };
    const fit = () => {
      const r = host.getBoundingClientRect(), k = Math.min(r.width / VW, r.height / VH);
      B.K = Math.max(2, Math.ceil(k)); cv.width = VW * B.K; cv.height = VH * B.K;
      Object.assign(cv.style, { position: 'absolute', width: VW * k + 'px', height: VH * k + 'px', left: (r.width - VW * k) / 2 + 'px', top: (r.height - VH * k) / 2 + 'px' });
      B.k = k;
    };
    fit(); B._fit = fit; window.addEventListener('resize', fit);
    // input
    B.kd = e => {
      if (!B.alive) return;
      const box = S.root.querySelector('.fk-box'); if (box && !box.hidden) return;   // a textbox is open: it owns the keys
      const k = e.code;
      if ((k === 'KeyZ' || k === 'Enter' || k === 'Space') && B.onConfirm) { e.preventDefault(); e.stopPropagation(); B.onConfirm(); }
      else if ((k === 'KeyX' || k === 'ShiftLeft' || k === 'Backspace') && B.onBack) { e.preventDefault(); e.stopPropagation(); B.onBack(); }
      else if (/^Arrow|^Key[WASD]$/.test(k) && B.onDir) { e.preventDefault(); e.stopPropagation(); B.onDir({ ArrowUp: 'up', KeyW: 'up', ArrowDown: 'down', KeyS: 'down', ArrowLeft: 'left', KeyA: 'left', ArrowRight: 'right', KeyD: 'right' }[k]); }
    };
    document.addEventListener('keydown', B.kd, true);
    cv.addEventListener('pointerdown', e => { if (B.onConfirm) { e.preventDefault(); B.onConfirm(); } });
    let last = 0;
    const frame = now => {
      if (!B.alive || !root.isConnected) return;
      const dt = Math.min(.05, (now - (last || now)) / 1000); last = now;
      if (!B.frozen) B.t += dt;
      B.rt = (B.rt || 0) + dt;
      if (B.tick) B.tick(dt);
      draw(B, dt);
      requestAnimationFrame(frame);
    };
    requestAnimationFrame(frame);
    return B;
  }
  function unmount(B) {
    B.alive = false; document.removeEventListener('keydown', B.kd, true); window.removeEventListener('resize', B._fit);
    B.root.remove();
  }
  function draw(B, dt) {
    const ctx = B.ctx, K = B.K;
    ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.imageSmoothingEnabled = false;
    ctx.fillStyle = '#000'; ctx.fillRect(0, 0, B.cv.width, B.cv.height);
    const sx = B.shake ? (Math.random() - .5) * B.shake : 0, sy = B.shake ? (Math.random() - .5) * B.shake : 0;
    B.shake = Math.max(0, B.shake - dt * 30);
    ctx.setTransform(K, 0, 0, K, sx * K, sy * K);
    if (B.bg) B.bg(ctx, B.rt);
    [...B.units].sort((a, b) => a.y - b.y).forEach(u => drawUnit(B, u));
    B.parts.forEach(p => { p.x += p.vx * dt; p.y += p.vy * dt; p.vy += (p.g || 0) * dt; p.life -= dt; p.draw ? p.draw(ctx, p) : (ctx.fillStyle = p.c, ctx.globalAlpha = cl(p.life * 2), ctx.fillRect(p.x, p.y, p.r || 2, p.r || 2), ctx.globalAlpha = 1); });
    B.parts = B.parts.filter(p => p.life > 0);
    B.pops.forEach(p => {
      p.t += dt; const y = p.y - p.t * 26 + (p.t < .2 ? -Math.sin(p.t / .2 * Math.PI) * 6 : 0);
      FlowerCuts.text(ctx, p.s, p.x, y, { size: p.size || 13, color: p.c || '#fff', alpha: cl(1.6 - p.t), stroke: 3 });
    });
    B.pops = B.pops.filter(p => p.t < 1.6);
    B.over.forEach(f => { ctx.save(); f(ctx, B.rt); ctx.restore(); });
    if (B.gray > 0) { ctx.save(); ctx.globalCompositeOperation = 'saturation'; ctx.globalAlpha = B.gray; ctx.fillStyle = '#888'; ctx.fillRect(0, 0, VW, VH); ctx.restore(); }
    if (B.flash > 0) { ctx.globalAlpha = cl(B.flash); ctx.fillStyle = B.flashCol; ctx.fillRect(0, 0, VW, VH); ctx.globalAlpha = 1; B.flash -= dt * 2.5; }
  }
  function drawUnit(B, u) {
    if (u.hidden) return;
    const ctx = B.ctx, x = u.x + (u.ox || 0) + (u.shk ? (Math.random() - .5) * u.shk : 0), y = u.y + (u.oy || 0);
    u.shk = Math.max(0, (u.shk || 0) - .6);
    if (u.pad != null && window.FlArena) FlArena.pad(ctx, u.x, u.y, u.pad, B.rt);
    else if (!u.noShadow) { ctx.fillStyle = 'rgba(0,0,0,.25)'; ctx.beginPath(); ctx.ellipse(u.x + (u.ox || 0), u.y, 12 * (u.s || 1), 3.5, 0, 0, 7); ctx.fill(); }
    const alpha = (u.alpha == null ? 1 : u.alpha) * (u.alive === false ? .35 : 1);
    if (u.toon) {
      const im = FW.toonImg[u.toon]; if (!im || !im.naturalWidth) return;
      const h = u.h || 50, w = im.naturalWidth / im.naturalHeight * h, bob = u.alive === false ? 0 : Math.sin(B.rt * 3 + u.x) * .8;
      ctx.save(); ctx.translate(x, y - bob); ctx.globalAlpha = alpha; ctx.imageSmoothingEnabled = true;
      if (u.rot) ctx.rotate(u.rot);
      if (u.alive === false) ctx.rotate(-1.2);
      if (u.flip) ctx.scale(-1, 1);
      if (u.hat) { /* a green hat, Flowery's favorite gag */ }
      ctx.drawImage(im, -w / 2, -h, w, h);
      if (u.hit > 0) { ctx.globalCompositeOperation = 'source-atop'; ctx.fillStyle = 'rgba(255,255,255,' + u.hit + ')'; ctx.fillRect(-w / 2, -h, w, h); u.hit -= .08; }
      ctx.restore(); ctx.imageSmoothingEnabled = false;
      if (u.hat) P().draw(ctx, 'green_orange_hat_0', x, y - h + 6, { s: .7, alpha });
    } else if (u.img) {
      const im = dhImg(u.img); if (!im.naturalWidth) return;
      const h = u.h || 36, w = im.naturalWidth / im.naturalHeight * h;
      ctx.save(); ctx.translate(x, y + Math.sin(B.rt * 4 + u.x) * 1.5); ctx.globalAlpha = alpha; ctx.imageSmoothingEnabled = true;
      ctx.drawImage(im, -w / 2, -h, w, h); ctx.restore(); ctx.imageSmoothingEnabled = false;
    } else {
      const f = typeof u.frame === 'function' ? u.frame(B.rt, u) : u.frame;
      if (u.omega) FlowerCuts.omega(ctx, x, y, B.rt, { s: u.s, pose: u.omegaPose, alpha });
      else if (f) {
        P().draw(ctx, f, x, y, { s: u.s || 1, flip: u.flip, alpha, rot: u.rot || 0 });
        if (u.crown) FW.drawAsgoreCrown(ctx, { s: u.s || 1, alpha }, f, x, y, u.flip);
        if (u.inked) { P().draw(ctx, f, x, y, { s: u.s || 1, flip: u.flip, alpha: .62 * alpha, tint: '#14001f' }); }
        if (u.hit > 0) { P().draw(ctx, f, x, y, { s: u.s || 1, flip: u.flip, alpha: u.hit, tint: '#fff' }); u.hit -= .08; }
      }
      if (u.inked && Math.random() < .12) B.parts.push({ x: x + rnd(-8, 8), y: y - rnd(4, 30), vx: 0, vy: 14, life: .8, c: '#1a0028', r: 2 });
    }
  }
  const pop = (B, u, s, c, size) => B.pops.push({ x: u.x + (u.ox || 0) + rnd(-4, 4), y: u.y - (u.toon ? (u.h || 50) : 50 * (u.s || 1)) + 10, s: String(s), c, t: 0, size });
  function burst(B, x, y, col, n = 10) { for (let i = 0; i < n; i++) B.parts.push({ x, y, vx: rnd(-80, 80), vy: rnd(-90, 10), g: 220, life: rnd(.4, .8), c: col, r: rnd(1, 3) }); }
  function tween(u, to, ms) {
    const from = {}; Object.keys(to).forEach(k => { from[k] = u[k] || 0; });
    const t0 = performance.now();
    return new Promise(res => {
      const st = () => { const k = cl((performance.now() - t0) / ms), e = ease(k); Object.keys(to).forEach(kk => { u[kk] = from[kk] + (to[kk] - from[kk]) * e; }); if (k < 1) requestAnimationFrame(st); else res(); };
      st();
    });
  }
  async function lunge(u, tx, ms = 160) { const d = tx - u.x; await tween(u, { ox: d * .7 }, ms); await wait(60); tween(u, { ox: 0 }, 200); }

  /* ---------------------------------------------------------------- backgrounds */
  const BG = {
    garden(ctx, t) { FW.sunsetSky(ctx, { x: t * 4 }, t, { cliffY: 150 }); FW.tileFill(ctx, FW.TX.grass, 0, 140, VW, 100, t * 2, 0); ctx.fillStyle = 'rgba(0,0,0,.15)'; ctx.fillRect(0, 140, VW, 3); },
    courtyard(ctx, t) { FW.sunsetSky(ctx, { x: t * 3 }, t, { night: true, castle: true, cliffY: 130 }); FW.tileFill(ctx, FW.TX.stone, 0, 110, VW, 30); FW.tileFill(ctx, FW.TX.sand, 0, 136, VW, 104); ctx.fillStyle = 'rgba(20,0,40,.25)'; ctx.fillRect(0, 0, VW, VH); },
    roof(ctx, t) { FW.ROOMS.roof.sky(ctx, { x: 0, y: 0 }, t); FW.ROOMS.roof.back(ctx, t); },
    omega(ctx, t) { FW.sunsetSky(ctx, { x: t * 160 }, t, { cliffY: 130 }); ctx.fillStyle = '#2b1838'; ctx.fillRect(0, 150, VW, 90); FW.tileFill(ctx, FW.TX.grass, 0, 194, VW, 22, t * 300, 0); FlowerCuts.speedLines(ctx, t, 'side', 'rgba(255,255,255,.18)', 14); }
  };

  /* ======================================================================== the Dandy's Heroes-style auto battle */
  const TOON = {
    Scraps: { name: 'Scraps', toon: 'Scraps', h: 52, hp: 220, atk: 60, def: 7, rate: 1.0, skill: 'Craft Class Crash', col: '#ffd36b' },
    Ginger: { name: 'Ginger', toon: 'Ginger', h: 48, hp: 190, atk: 30, def: 8, rate: 1.35, skill: 'Frosting Care', heal: true, col: '#ff9db0' },
    Yatta: { name: 'Yatta', toon: 'Yatta', h: 52, hp: 175, atk: 48, def: 5, rate: .72, skill: 'Piñata Party', col: '#ffe95c' },
    Ralsei: { name: 'Ralsei', frame: (t, u) => u.act ? 'ralsei_spell_' + Math.min(10, Math.floor((t - u.act) * 14)) : 'ralsei_idle_' + (Math.floor(t * 6) % 5), s: 1, hp: 160, atk: 22, def: 6, rate: 1.4, skill: 'Heal Prayer', heal: true, col: '#7fe07f' },
    FloweryAlly: { name: 'Flowery', frame: (t, u) => u.act ? 'flowery_puuunch_0' : 'flowery_idle2_' + (Math.floor(t * 6) % 5), s: 1, hp: 400, atk: 70, def: 12, rate: .8, skill: 'My Jarona!', col: '#ffe066' }
  };
  const FOE = {
    floradinn: { name: 'Floradinn', frame: t => 'enemy_floradin_flipped_' + (Math.floor(t * 6) % 4), hp: 999, atk: 13, rate: 1.25 },
    inkFlora: { name: 'Inked Floradinn', frame: t => 'enemy_floradin_flipped_' + (Math.floor(t * 6) % 4), inked: true, hp: 150, atk: 13, rate: 1.4 },
    inkKawkaw: { name: 'Inked Kawkaw', frame: t => 'kawkaw_' + (Math.floor(t * 5) % 3), inked: true, hp: 180, atk: 15, rate: 1.5 },
    inkMantis: { name: 'Inked Mantis', frame: (t, u) => u.act ? 'mantis_dance_' + (Math.floor((t - u.act) * 14) % 10) : 'mantis_idle_' + (Math.floor(t * 5) % 3), inked: true, hp: 210, atk: 17, rate: 1.6 },
    inkBloxer: { name: 'Inked Bloxer', frame: t => 'blockguy_overworld_' + (Math.floor(t * 6) % 4), inked: true, hp: 190, atk: 14, rate: 1.3 },
    inkConductor: { name: 'Inked Conductor', frame: t => 'floradin_conductor_flipped_' + (Math.floor(t * 6) % 4), inked: true, s: 1.4, hp: 620, atk: 19, rate: 1.2 },
    ichorDrop: { name: 'Ichor Drop', img: 'assets/enemies/Weaklings/Ichordrop.png', h: 30, hp: 110, atk: 12, rate: 1.2 },
    ichorBall: { name: 'Ichor Ball', img: 'assets/enemies/Weaklings/Ball.png', h: 28, hp: 100, atk: 11, rate: .9 }
  };
  const PSLOT = [[92, 168], [66, 190], [98, 212], [52, 214]];
  const ESLOT = [[228, 170], [262, 192], [226, 214], [276, 158], [290, 218]];
  function mkUnit(def, side, i, extra) {
    const [x, y] = (side === 'p' ? PSLOT : ESLOT)[i % 5];
    return Object.assign({ side, x, y, max: def.hp, hp: def.hp, alive: true, cd: rnd(.2, .9) * def.rate, en: 0, ox: 0, oy: 0 }, def, { def: def.def || 0 }, extra || {});
  }
  function hudAuto(B, party, label) {
    B.ui.innerHTML = `<div class="fb-autobar">📍 ${label}</div>
      <div class="fb-auto"><button type="button" data-b="speed">1x</button><button type="button" data-b="auto" class="on">AUTO</button><button type="button" data-b="pause">⏸</button></div>
      <div class="fb-dock">${party.map((u, i) => `<div data-i="${i}">${u.toon ? `<img src="${icon(u.toon)}" alt="">` : `<img src="${P().url(u.name === 'Ralsei' ? 'face_r_nohat_0' : 'face_flowery_0', 1)}" alt="" style="image-rendering:pixelated">`}<span>${u.name}</span><i><u></u></i><i class="en"><u></u></i></div>`).join('')}</div>`;
    B.ui.querySelectorAll('.fb-auto button').forEach(b => b.onclick = () => { sfx('menumove', .4); if (b.dataset.b === 'speed') { B.spd = B.spd === 2 ? 1 : 2; b.textContent = B.spd + 'x'; } });
    B.dock = () => party.forEach((u, i) => {
      const d = B.ui.querySelector(`.fb-dock [data-i="${i}"]`); if (!d) return;
      const [hp, en] = d.querySelectorAll('i u'); hp.style.width = cl(u.hp / u.max) * 100 + '%'; en.style.width = cl(u.en) * 100 + '%';
    });
  }
  /* runs until the enemies (or the party) are gone, or `cfg.stop()` says so. cfg.weak: the party only ever deals 1. */
  function autoSim(B, party, foes, cfg) {
    return new Promise(res => {
      let ended = false;
      B.tick = dt => {
        if (B.paused || ended) return;
        dt *= (B.spd || 1);
        const alive = s => (s === 'p' ? party : foes).filter(u => u.alive);
        if (cfg.stop && cfg.stop()) { ended = true; B.tick = null; res('stop'); return; }
        if (!alive('e').length) { ended = true; B.tick = null; res('win'); return; }
        if (!alive('p').length) { ended = true; B.tick = null; res('lose'); return; }
        [...party, ...foes].forEach(u => {
          if (!u.alive || u.busy) return;
          u.cd -= dt; if (u.cd > 0) return;
          u.cd = u.rate * rnd(.85, 1.15);
          const foesOf = u.side === 'p' ? alive('e') : alive('p'); if (!foesOf.length) return;
          const skill = u.en >= 1;
          if (skill) u.en = 0;
          act(u, foesOf, skill);
        });
        if (B.dock) B.dock();
      };
      async function act(u, targets, skill) {
        u.busy = true; u.act = B.rt;
        const tg = pick(targets);
        if (skill && u.heal) {
          pop(B, u, u.skill + '!', u.col, 10); sfx('power', .45);
          party.filter(p => p.alive).forEach(p => { const h = Math.round(p.max * .25); p.hp = Math.min(p.max, p.hp + h); pop(B, p, '+' + h, '#7dff8a'); });
        } else {
          if (skill && u.skill) { pop(B, u, u.skill + '!', u.col || '#ffd84a', 10); sfx('boost', .45); }
          await lunge(u, tg.x - (u.side === 'p' ? 18 : -18));
          const hits = skill ? 3 : 1;
          for (let h = 0; h < hits; h++) {
            let d = u.side === 'p' && cfg.weak ? 1 : Math.max(1, Math.round((u.atk * (skill ? .9 : 1) - (tg.def || 0) * .5) * rnd(.9, 1.1)));
            if (u.side === 'e' && cfg.foeMult) d = Math.round(d * cfg.foeMult);
            tg.hp = Math.max(0, tg.hp - d); tg.hit = 1; tg.shk = 4;
            pop(B, tg, d, u.side === 'p' ? (cfg.weak ? '#bbb' : '#fff') : '#ff6a6a', cfg.weak && u.side === 'p' ? 11 : 13);
            sfx(u.side === 'p' ? (cfg.weak ? 'bump' : 'laz_c') : 'hurtsmall', .45);
            burst(B, tg.x, tg.y - 20, tg.inked ? '#2a0040' : '#fff', 5);
            if (tg.hp <= 0 && tg.alive) { tg.alive = false; if (tg.side === 'e') { tg.hidden = true; burst(B, tg.x, tg.y - 16, '#1a0028', 18); sfx('break1', .5); } }
            if (hits > 1) await wait(120);
          }
          u.en = Math.min(1, u.en + (u.side === 'p' ? .22 : .18));
        }
        u.act = 0; u.busy = false;
      }
    });
  }
  async function resultCard(B, title, lines) {
    const el = document.createElement('div'); el.className = 'fb-retry';
    el.innerHTML = `<div style="font-size:28px;color:#ffe066;letter-spacing:.2em">${title}</div>${lines.map(l => `<div>${l}</div>`).join('')}<button type="button">CONTINUE</button>`;
    B.ui.appendChild(el); sfx('won', .5);
    await new Promise(r => { el.querySelector('button').onclick = r; B.onConfirm = r; });
    B.onConfirm = null; el.remove();
  }
  async function retryCard(B, lines, opts = ['RETRY', 'LEAVE']) {
    const el = document.createElement('div'); el.className = 'fb-retry';
    el.innerHTML = lines.map(l => `<div>${l}</div>`).join('') + `<div style="display:flex;gap:14px">${opts.map((o, i) => `<button type="button" data-i="${i}">${o}</button>`).join('')}</div>`;
    B.ui.appendChild(el);
    const i = await new Promise(r => { el.querySelectorAll('button').forEach(b => b.onclick = () => r(+b.dataset.i)); B.onConfirm = () => r(0); });
    B.onConfirm = null; el.remove(); return i;
  }

  /* ---------------------------------------------------------------- 1. the Floradinns (segment 2) */
  FW.BATTLES.floradinn = async S => {
    const B = mount(S, BG.garden);
    FW.music('flBattle'); sfx('battleenter', .6);
    const party = ['Scraps', 'Ginger', 'Yatta'].map((k, i) => mkUnit(TOON[k], 'p', i));
    const foes = [mkUnit(FOE.floradinn, 'e', 0), mkUnit(FOE.floradinn, 'e', 1)];
    foes.forEach(f => { f.s = 1.2; });
    B.units.push(...party, ...foes);
    hudAuto(B, party, 'THE GARDEN · Floradinn x2');
    B.flash = 1;
    const t0 = B.rt;
    await autoSim(B, party, foes, { weak: true, foeMult: 1.15, stop: () => B.rt - t0 > 11 || party.reduce((a, u) => a + u.hp / u.max, 0) / 3 < .38 });
    B.paused = true;
    await say('Yatta', '', 'WHY ISN\'T IT WORKING?! I\'M HITTING IT WITH MY WHOLE BODY!!', { shout: true });
    await say('Scraps', '', 'It says ONE. Every time. ONE!');
    await say('Floradinn', '', 'Ha ha! Your strange smooth arms cannot harm a knight of the Kingdom! You are not even Lightners! You are... | ...what ARE you?');
    FW.hideBox();
    // Flowery drops in
    const fl = { side: 'x', name: 'Flowery', x: 182, y: -30, s: 1.25, frame: 'flowery_spin_to_idle_0', noShadow: true };
    B.units.push(fl); sfx('wing', .6);
    await tween(fl, { y: 196 }, 420);
    fl.noShadow = false; B.shake = 8; B.flash = .8; B.flashCol = '#ffe066'; sfx('impact', .7);
    for (let i = 0; i < 8; i++) { fl.frame = 'flowery_spin_to_idle_' + i; await wait(55); }
    voice('keep_waiting', 'Sorry to keep you waiting!');
    fl.frame = 'flowery_pose_point_cooler_0'; await wait(900);
    // he grabs both Floradinns at once (the frames include them)
    foes.forEach(f => { f.hidden = true; });
    for (let i = 0; i <= 16; i++) { fl.frame = 'flowery_grabfloradins_' + i; if (i === 9) sfx('grab', .6); await wait(i < 9 ? 70 : 95); }
    // and throws them over the cliff
    fl.frame = 'flowery_pose_r_0';
    const thrown = [0, 1].map(i => ({ side: 'x', x: fl.x, y: 150, s: 1.2, frame: 'floradin_hurt_0', noShadow: true, rot: 0 }));
    B.units.push(...thrown); sfx('heavyswing', .7);
    await Promise.all(thrown.map((u, i) => tween(u, { x: 380 + i * 30, y: -40 - i * 30, rot: 9 + i * 3 }, 800)));
    sfx('stardrop', .5);
    fl.frame = 'flowery_idle_0';
    await resultCard(B, 'YOU WON?', ['* Got 0 EXP and 0 D$.', '* (Flowery took the D$. He called it a guide fee.)']);
    unmount(B); return 'win';
  };

  /* ---------------------------------------------------------------- 2. the ichor (segment 8) */
  FW.BATTLES.ichor = async S => {
    for (;;) {
      const B = mount(S, BG.courtyard);
      FW.music('flBattle'); sfx('battleenter', .6);
      const party = ['Scraps', 'Ginger', 'Yatta'].map((k, i) => mkUnit(TOON[k], 'p', i));
      const flowery = mkUnit(TOON.FloweryAlly, 'p', 3, { x: 128, y: 196 });
      party.push(flowery);
      B.units.push(...party);
      hudAuto(B, party, 'THE COURTYARD · Wave 1/3');
      const waves = [['inkFlora', 'ichorDrop', 'inkFlora'], ['inkKawkaw', 'inkMantis', 'inkBloxer', 'ichorBall'], ['inkConductor', 'ichorDrop', 'inkFlora']];
      let result = 'win';
      for (let w = 0; w < waves.length && result === 'win'; w++) {
        B.ui.querySelector('.fb-autobar').textContent = '📍 THE COURTYARD · Wave ' + (w + 1) + '/3';
        const foes = waves[w].map((k, i) => mkUnit(FOE[k], 'e', i));
        foes.forEach(f => { f.x += 80; });
        B.units.push(...foes);
        await Promise.all(foes.map(f => tween(f, { x: f.x - 80 }, 500)));
        if (w === 0) { B.paused = true; await say('Flowery', 'wide', 'Wait— you\'re HITTING them! Those numbers are REAL numbers!'); await say('Ginger', '', 'Because they\'re soaked in OUR stuff. | Everything that came from home, we can touch.'); FW.hideBox(); B.paused = false; }
        if (w === 2) {
          // Asgore
          B.paused = true;
          await say('Scraps', '', 'There\'s too many— the big one\'s got a baton—');
          FW.hideBox();
          const ag = { side: 'x', x: -60, y: 200, s: 1.3, crown: true, frame: t => 'asgore_armor_charge_verymad_' + (Math.floor(t * 12) % 6) };
          B.units.push(ag); sfx('rumble', .6); B.shake = 6; FW.music('flAsgore');
          await tween(ag, { x: 400 }, 1300);
          foes.forEach(f => { f.hp = Math.round(f.hp * .3); f.hit = 1; f.shk = 8; pop(B, f, 'BONK', '#ffe066'); });
          sfx('impact', .8); B.shake = 12; B.flash = .7; B.flashCol = '#ffe066';
          ag.x = 330; ag.flip = true; ag.frame = 'asgore_armor_yell_0';
          await tween(ag, { x: 290 }, 300);
          await say('Asgore', '', 'NOT. IN. MY. GARDEN.', { shout: true });
          ag.frame = 'asgore_expressions_right_1';
          await say('Asgore', '', '...Oh! Hello again, small ones. Flowery, I\'ll hold the gate. | You four finish this.');
          await say('Flowery', 'blush', '...Yes, Gorey.');
          FW.hideBox();
          ag.frame = 'asgore_armor_run_left_0'; await tween(ag, { x: 420 }, 700); B.units.splice(B.units.indexOf(ag), 1);
          FW.music('flBattle'); B.paused = false;
        }
        result = await autoSim(B, party, foes, {});
        B.units = B.units.filter(u => u.side !== 'e');
        party.forEach(u => { if (u.alive) u.hp = Math.min(u.max, u.hp + Math.round(u.max * .2)); });
      }
      if (result === 'win') { await resultCard(B, 'YOU WON!', ['* The ichor sinks back into the stones.']); unmount(B); return 'win'; }
      const c = await retryCard(B, ['* Flowery drags you out by the collars.', '* "Again! Hit them FIRST this time!"']);
      unmount(B); if (c === 1) return 'quit';
    }
  };

  /* ======================================================================== the boss */
  const BST = () => { try { const r = Raid.state(); return r.flowery || (r.flowery = {}); } catch (_) { return (window.__flBoss = window.__flBoss || {}); } };
  const SKILLS = {
    Scraps: [
      { id: 'works', name: 'Whatever Works', tp: 25, target: 'foe', desc: 'A cardboard-claw hit (x2.2). Frays Flowery: Defense down and one of his buffs torn off.' },
      { id: 'yarn', name: 'Yarn Ball', tp: 20, target: 'foe', desc: 'A light hit that snares. Cancels a charged attack, or takes two hits off his next one.' },
      { id: 'crash', name: 'Craft Class Crash', tp: 55, target: 'foe', desc: 'Three big paper-hurricane hits. Shreds Bamboo Barriers instantly.' },
      { id: 'grapple', name: 'Crafty Grapple', tp: 35, target: 'foe', desc: 'Grapple in for a strong hit (x1.4). Scraps can\'t be targeted this turn.' }
    ],
    Ginger: [
      { id: 'baked', name: 'Baked With Care!', tp: 30, target: 'ally', desc: 'Give one of your Hearts: heal 70%, or revive a fallen friend at 45%. Costs Ginger 12% of her HP.' },
      { id: 'frost', name: 'Frosting Care', tp: 40, target: 'none', desc: 'Heal everyone 30% and wash off hats, burns and dazzle.' },
      { id: 'treats', name: 'Decorated Treats', tp: 25, target: 'none', desc: 'Party Attack up for 3 turns. The most hurt friend gets a Shield.' }
    ],
    Yatta: [
      { id: 'pinata', name: 'Piñata Party', tp: 25, target: 'foe', desc: 'Bounce off him five times. Each hit gives a little TP.' },
      { id: 'candy', name: 'Candy Crash', tp: 35, target: 'foe', desc: 'A huge hit (x2.4). If he\'s Frayed or below 35%, he gets Dizzy (his next attack misses a lot).' },
      { id: 'spring', name: 'Spring Loaded', tp: 15, target: 'none', desc: 'Yatta dodges every single-target hit this turn. Each dodge gives TP.' }
    ]
  };
  const ITEMS = {
    cookie: { name: 'Round Cookie', n: 3, target: 'ally', desc: 'Green helped. Heal 55%.' },
    bandage: { name: 'Bandage', n: 3, target: 'ally', desc: 'Heal 35%.' },
    choco: { name: 'Box o\' Chocolates', n: 2, target: 'none', desc: 'Heal everyone 25%.' },
    cable: { name: 'Jumper Cable', n: 2, target: 'ko', desc: 'Revive a fallen friend at 50%.' },
    speed: { name: 'Speed Candy', n: 2, target: 'none', desc: '+30% TP.' }
  };

  // stand-ins for the preview page (the game uses flowery-realbattle.js)
  FW.BATTLES.ichor1 = async () => 'win';
  FW.BATTLES.ichor2 = async () => 'win';
  FW.BATTLES.ichorSmall = async () => 'win';
  FW.BATTLES.flowery = async (S, args) => {
    const skipIntro = !!(args && (args.skipIntro || args[0] === 'skip'));   // flowery-realbattle.js runs the real auto battle and the fourth wall first
    const st = BST(); st.losses = st.losses || 0;
    const B = mount(S, BG.roof);
    const P0 = ['Scraps', 'Ginger', 'Yatta', 'Ralsei'].map((k, i) => mkUnit(TOON[k], 'p', i));
    const ral = P0[3];
    const fl = { side: 'e', name: 'Flowery', x: 236, y: 196, s: 1.5, max: 3600, hp: 3600, alive: true, def: 10, atk: 34, ox: 0, oy: 0,
      frame: (t, u) => u.pose || ('flowery_idle_' + (Math.floor(t * 6) % 5)), st: {}, fp: 0 };
    B.units.push(...P0, fl);
    FW.music('flBoss');

    if (!skipIntro) {
    /* ------------------------------------------ phase 0: it starts as one of OUR fights */
    hudAuto(B, P0.slice(0, 3), 'THE TOP OF THE CASTLE · Flowery');
    B.ui.querySelector('.fb-auto [data-b="auto"]').classList.add('auto-btn');
    voice('sanfrandisco', 'Here I come, Sanfrandisco!');
    const dodgeLines = ['MISS', 'MISS', '0', 'MISS', '0'];
    let dodgeI = 0;
    const tStart = B.rt;
    B.tick = dt => {
      if (B.paused) return;
      P0.slice(0, 3).forEach(u => {
        if (u.busy) return; u.cd -= dt; if (u.cd > 0) return; u.cd = u.rate * rnd(.9, 1.2); u.busy = true;
        (async () => {
          await lunge(u, fl.x - 22); fl.pose = pick(['flowery_pirouette_' + Math.floor(rnd(0, 8)), 'flowery_deflected_0', 'flowery_fair_0']);
          pop(B, fl, dodgeLines[dodgeI++ % dodgeLines.length], '#bbb', 11); sfx('graze', .4); u.en = Math.min(1, u.en + .25);
          if (u.en >= 1) { u.en = 0; pop(B, u, u.skill + '!', u.col, 10); sfx('boost', .4); await wait(300); pop(B, fl, '0', '#bbb', 14); }
          await wait(220); fl.pose = null; u.busy = false;
        })();
      });
      if (B.dock) B.dock();
    };
    await new Promise(r => { const iv = setInterval(() => { if (B.rt - tStart > 9) { clearInterval(iv); r(); } }, 100); });
    B.tick = null; await wait(500);

    /* ------------------------------------------ the fourth wall */
    B.frozen = true; fl.pose = 'flowery_idle3_0';
    try { Music.stop(); } catch (_) { /* optional */ }
    for (let g = 0; g <= 10; g++) { B.gray = g / 10 * .85; await wait(40); }
        await say('Flowery', 'flat', 'Hold on. | Hold on, hold on, hold on.');
    await say('Flowery', 'side', 'You\'re not even pressing anything. Are you?');
    fl.pose = 'flowery_gestureup_0';
    await say('Flowery', 'squint', 'Look at this. A little yellow button that says "AUTO." | They swing, I dodge, you sit there and eat a snack.');
    await say('Flowery', 'serious', 'Princesses. I spent twenty years in a pot being WATCHED. | I know exactly what it looks like when somebody\'s watching instead of doing.');
    await say('Flowery', 'snarl', 'Not in my kingdom. Not on my roof. | Up here, you look me in the eye, and you CHOOSE.');
    FW.hideBox();
    // he walks up to the button and takes it
    fl.pose = null; fl.frame = (t, u) => 'flowery_walk_right_jacket_' + (Math.floor(t * 8) % 4);
    B.frozen = false;
    await tween(fl, { x: 300, y: 70 }, 900);
    const btn = B.ui.querySelector('.fb-auto .auto-btn'); if (btn) btn.classList.add('gone');
    let held = true;
    const drawBtn = (ctx, x, y, rot, half) => { ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.fillStyle = '#f2a91c'; ctx.strokeStyle = '#3b2200'; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.roundRect ? ctx.roundRect(half === 2 ? 0 : -13, -8, half ? 13 : 26, 16, 4) : ctx.rect(-13, -8, 26, 16); ctx.fill(); ctx.stroke();
      if (!half) FlowerCuts.text(ctx, 'AUTO', 0, 0, { size: 7, color: '#3b2200', stroke: 0, font: 'Arial Black,Arial,sans-serif' }); ctx.restore(); };
    const handBtn = ctx => { if (held) drawBtn(ctx, fl.x - 10, fl.y - 66, -.2); };
    B.over.push(handBtn); sfx('grab', .6);
    fl.frame = (t, u) => u.pose || 'flowery_walk_left_jacket_' + (Math.floor(t * 8) % 4);
    await tween(fl, { x: 236, y: 196 }, 900);
    fl.frame = (t, u) => u.pose || ('flowery_idle_' + (Math.floor(t * 6) % 5));
    fl.pose = 'flowery_pose_0';
    await say('Flowery', 'grin', 'This? This is a crutch. A little plastic crutch.');
    voice('for_the_fans', 'For the fans!');
    await wait(900);
    // snap
    held = false; B.over.splice(B.over.indexOf(handBtn), 1);
    const halves = [{ x: fl.x - 12, y: fl.y - 66, vx: -50, vy: -80, r: 0 }, { x: fl.x - 8, y: fl.y - 66, vx: 40, vy: -90, r: 0 }];
    B.over.push(ctx => halves.forEach((h, i) => { h.x += h.vx / 60; h.y += h.vy / 60; h.vy += 6; h.r += .15; drawBtn(ctx, h.x, h.y, h.r * (i ? 1 : -1), i + 1); }));
    sfx('break2', .9); B.shake = 10; B.flash = .9; FW.S && (FW.S.fx.glitch = .8);
    B.ui.querySelectorAll('.fb-auto,.fb-dock,.fb-autobar').forEach(e => { e.style.transition = 'opacity .5s, transform .5s'; e.style.opacity = '0'; e.style.transform = 'translateY(30px) rotate(4deg)'; });
    for (let g = 10; g >= 0; g--) { B.gray = g / 10 * .85; await wait(30); }
    await wait(500); B.over.length = 0;
    fl.pose = 'flowery_pose_point_cooler_0';
    await say('Flowery', 'beam', 'There. Now every punch is YOUR fault. | Isn\'t that romantic?');
    await say('Ralsei', 'worry', 'Everyone, listen! When he attacks, keep moving. Arrows to move, [Z] to dash right through things!');
    await say('Ralsei', 'determined', 'And I\'ll keep you healed. I promise!');
    await say('Flowery', 'smirk', 'Hey, tutorial boy. You\'re very cute when you\'re useful.');
    await say('Ralsei', 'pout', '...');
    FW.hideBox(); fl.pose = null;
    FW.music('flBoss');

    }
    FW.music('flBoss');
    /* ------------------------------------------ the turn-based fight, on the vine tower */
    B.sunsetK = 0;
    B.bg = (ctx, t) => FlArena.bg(ctx, t, { sunset: B.sunsetK });
    P0.forEach((u, i) => { u.pad = i; u.h = 34; u.noShadow = true; tween(u, { x: [58, 44, 58, 44][i], y: [86, 118, 150, 182][i] }, 500); });
    ral.s = .9;
    fl.frame = (t, u) => u.pose || ('flowery_idle3_' + (Math.floor(t * 6) % 5)); fl.noShadow = true; fl.s = 1.15;
    tween(fl, { x: 256, y: 168 }, 500);
    const guests = {};
    const GUEST = { Aqua: ['aqua_centered_', 4, 286, 104], Seth: ['seth_idle_', 4, 300, 196], Green: ['enemy_green_', 1, 222, 196], Orange: ['orange_proud_left_', 1, 218, 132],
      Yellow: ['yellow_quarter_', 1, 296, 150], Blue: ['blue_poses_', 3, 300, 92] };
    async function guest(names, line) {
      const fresh = names.filter(n => !guests[n]);
      if (!fresh.length) return;
      fresh.forEach(n => { const [b, k, x, y] = GUEST[n]; const u = { side: 'x', name: n, x: x + 40, y, s: 1, alpha: 0, noShadow: true, frame: t => b + (Math.floor(t * 5) % k) }; guests[n] = u; B.units.push(u); tween(u, { x, alpha: 1 }, 500); });
      sfx('magicsprinkle', .5); log(line); await wait(1300);
    }
    if (skipIntro && !st.tutSeen) {
      st.tutSeen = true;
      await say('Ralsei', 'worry', 'Everyone, listen! When he attacks, keep moving. Arrows to move, [Z] to dash right through things!');
      await say('Ralsei', 'determined', 'And I\'ll keep you healed. I promise!');
      FW.hideBox();
    }
    const dodgeTurn = (label, pat, power, o = {}) => FlArena.dodge(B, {
      dur: o.dur || 6, phase: G.phase, label, tutorial: !G.tut, laneSpeed: o.lane,
      pattern: pat,
      onHit: pw => { const u = o.target ? o.target() : target(); if (u) { hitParty(u, power * pw); if (o.onHitU) o.onHitU(u); } },
      onGraze: dt => { G.graze = (G.graze || 0) + dt; if (G.graze > .2) { G.graze = 0; tpGain(1); } }
    }).then(r => { G.tut = true; if (r.hits === 0) { pop(B, fl, 'NO HITS!', '#ffe066', 10); tpGain(6); } return r; });
    const easyMode = () => st.losses >= 6;
    const G = { tp: 0, phase: 1, duo: 0, round: 0, items: {}, lastDealer: null, dmgThisRound: 0, cook: false, charge: false, chargeKind: null };
    const resetItems = () => { Object.keys(ITEMS).forEach(k => { G.items[k] = ITEMS[k].n; }); };
    resetItems();
    let check = null;
    const save = () => { check = { hp: fl.hp, phase: G.phase, duo: G.duo }; };
    window.__flDbg = { G, fl, P0, B };   // test hook (tools/flowery bots)
    save();
    const party = P0.slice(0, 3);
    const living = () => P0.filter(u => u.alive);
    const tpGain = n => { G.tp = cl(G.tp + n * (easyMode() ? 1.5 : 1), 0, 100); drawTP(); };
    // ---- UI
    B.ui.innerHTML = `<div class="fb-log"></div><div class="fb-tp"><b>TP</b><i></i><em>0%</em></div><div class="fb-menu"></div><div class="fb-press"></div>`;
    const ui = sel => B.ui.querySelector(sel);
    const log = s => { ui('.fb-log').textContent = s || ''; };
    function drawTP() { ui('.fb-tp i').style.height = G.tp + '%'; ui('.fb-tp em').textContent = Math.round(G.tp) + '%'; }
    const BTN = { fight: 'btfight_0', skill: 'bttech_0', item: 'btitem_0', defend: 'btdefend_0' };
    function drawPanels(cur) {
      ui('.fb-menu').style.gridTemplateColumns = 'repeat(' + P0.length + ',1fr)';
      ui('.fb-menu').innerHTML = P0.map((u, i) => `<div class="fb-pc ${u === cur ? 'turn' : ''} ${u.alive ? '' : 'ko'}" style="--c:${u.col}" data-i="${i}">
        <header><img src="${u.toon ? icon(u.toon) : P().url('face_r_nohat_0', 1)}" alt="" style="${u.toon ? '' : 'image-rendering:pixelated'}"><span>${u.name}${u === ral ? ' <small style="color:#888">(guest)</small>' : ''}</span></header>
        <div class="fb-hp"><i style="width:${cl(u.hp / u.max) * 100}%"></i></div><div class="fb-hpn"><span>HP</span><span>${Math.ceil(u.hp)}/${u.max}</span></div>
        ${u === cur ? `<div class="fb-btns">${Object.entries(BTN).map(([k, f]) => `<button type="button" data-a="${k}"><img src="${P().url(f, 1)}" alt="">${k === 'skill' ? 'SKILL' : k.toUpperCase()}</button>`).join('')}</div>` : `<div class="fb-hpn"><span>${statusText(u)}</span></div>`}
      </div>`).join('');
    }
    const statusText = u => [u.hat && 'HAT', u.burn && 'BURN', u.dazzle && 'DAZZLED', u.shield && 'SHIELD', u.atkUp && 'ATK+', u.defDown && 'DEF-'].filter(Boolean).join(' ') || '';
    // choose among DOM buttons with keys or clicks
    function choose(btns, opt = {}) {
      return new Promise(res => {
        let i = opt.start || 0; const on = () => btns.forEach((b, k) => b.classList.toggle('on', k === i)); on();
        if (opt.onFocus) opt.onFocus(i);
        const done = v => { B.onDir = B.onConfirm = B.onBack = null; res(v); };
        btns.forEach((b, k) => { b.onclick = () => { if (!b.disabled) { sfx('select', .4); done(k); } }; b.onmouseenter = () => { i = k; on(); if (opt.onFocus) opt.onFocus(i); }; });
        B.onDir = d => { const cols = opt.cols || 1; const step = d === 'left' ? -1 : d === 'right' ? 1 : d === 'up' ? -cols : cols; i = (i + step + btns.length) % btns.length; on(); sfx('menumove', .3); if (opt.onFocus) opt.onFocus(i); };
        B.onConfirm = () => { if (btns[i] && !btns[i].disabled) { sfx('select', .4); done(i); } else sfx('cantselect', .4); };
        B.onBack = () => { if (opt.back) { sfx('menumove', .3); done(-1); } };
      });
    }
    function subMenu(rows, descOf) {
      const el = document.createElement('div'); el.className = 'fb-sub';
      el.innerHTML = rows.map((r, i) => `<button type="button" ${r.disabled ? 'disabled' : ''}>${r.label}<em>${r.right || ''}</em></button>`).join('') + '<div class="fb-desc"></div>';
      B.ui.appendChild(el);
      const btns = [...el.querySelectorAll('button')];
      return choose(btns, { cols: 2, back: true, onFocus: i => { el.querySelector('.fb-desc').textContent = descOf(i) || ''; } }).then(v => { el.remove(); return v; });
    }
    async function pickTarget(kind) {
      const pool = kind === 'ko' ? P0.filter(u => !u.alive) : kind === 'allyAny' ? P0 : P0.filter(u => u.alive);
      if (!pool.length) return null;
      const rows = pool.map(u => ({ label: u.name, right: Math.ceil(u.hp) + '/' + u.max }));
      const i = await subMenu(rows, i => pool[i].name);
      return i < 0 ? null : pool[i];
    }
    // ---- QTEs
    function attackBars(n, dazzled) {
      // Deltarune-style: a cursor per attacker slides left toward the line; press as it crosses
      return new Promise(res => {
        const rows = Array.from({ length: n }, (_, i) => ({ x: 1.2 + i * .35, sp: dazzled[i] ? 1.7 : 1.05, r: null }));
        const t0 = B.rt; let cur = 0;
        const f = ctx => {
          const t = B.rt - t0;
          ctx.fillStyle = 'rgba(0,0,0,.75)'; ctx.fillRect(40, 170 - n * 9, 240, n * 18 + 6);
          rows.forEach((r, i) => {
            const y = 173 - n * 9 + i * 18; if (r.r == null) r.cx = r.x - t * r.sp;
            ctx.strokeStyle = '#fff'; ctx.strokeRect(60, y, 200, 14);
            ctx.fillStyle = '#ff8a00'; ctx.fillRect(84, y, 3, 14);
            const px = 84 + (r.cx) * 160;
            if (px > 40 && px < 290) { ctx.fillStyle = r.r == null ? '#fff' : r.r > .85 ? '#ffe066' : r.r > .3 ? '#9fe' : '#888'; ctx.fillRect(px - 2, y - 2, 4, 18); }
            if (r.r == null && r.cx < -.3) { r.r = 0; cur = i + 1; }
          });
          if (rows.every(r => r.r != null) && !f.done) { f.done = true; setTimeout(() => { B.over.splice(B.over.indexOf(f), 1); B.onConfirm = null; res(rows.map(r => r.r)); }, 250); }
        };
        B.over.push(f);
        B.onConfirm = () => {
          const r = rows.find(rr => rr.r == null); if (!r) return;
          const d = Math.abs(r.cx); r.r = d < .045 ? 1 : d < .16 ? .7 : d < .32 ? .45 : .2;
          if (r.r === 1) { sfx('criticalswing', .45); tpGain(6); } else sfx('smallswing', .35);
        };
      });
    }
    /* a Brace: a ring closes on the target; press as it lands. fake: Flowery stops short ("Just kidding!") and the real hit comes later */
    function brace(u, dur = .75, opt = {}) {
      return new Promise(res => {
        const t0 = B.rt, win = .16 * (easyMode() ? 1.4 : 1), perfect = .06 * (easyMode() ? 1.4 : 1);
        let result = null, early = false;
        const f = ctx => {
          const t = B.rt - t0, k = 1 - t / dur, x = u.x + (u.ox || 0), y = u.y - (u.toon ? (u.h || 50) / 2 : 24);
          if (k > -win) {
            ctx.strokeStyle = early ? '#f44' : k < win && k > -win ? '#ffe066' : '#fff'; ctx.lineWidth = 2;
            ctx.beginPath(); ctx.arc(x, y, 8 + Math.max(0, k) * 46, 0, 7); ctx.stroke();
            ctx.strokeStyle = 'rgba(255,255,255,.4)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(x, y, 8, 0, 7); ctx.stroke();
          }
          if (result == null && t > dur + win) finish('none');
        };
        const finish = r => { if (result != null) return; result = early && r !== 'none' ? 'none' : r; B.over.splice(B.over.indexOf(f), 1); B.onConfirm = null; res(early ? 'early' : result); };
        B.over.push(f);
        B.onConfirm = () => {
          const t = B.rt - t0, d = Math.abs(t - dur) / dur;
          if (t < dur - win * dur) { early = true; sfx('cantselect', .4); return; }
          finish(d < perfect ? 'perfect' : d < win ? 'good' : 'none');
        };
      });
    }
    // ---- damage to the party
    async function hitParty(u, power, o = {}) {
      if (!u.alive) return 0;
      if (u.grapple && !o.aoe) { pop(B, u, 'UNTARGETABLE', '#ffd36b', 10); return 0; }
      if (u.spring && !o.aoe) { pop(B, u, 'DODGE!', '#ffe95c', 11); sfx('jump', .4); tpGain(6); return 0; }
      if (fl.dizzy && Math.random() < .4) { pop(B, u, 'MISS', '#bbb'); sfx('graze', .3); return 0; }
      const b = o.brace ? await brace(u, o.dur || .75) : 'none';
      if (o.counter && b === 'perfect') return 'counter';
      let d = (fl.atk * power) * (G.phase === 2 ? 1.15 : G.phase === 3 ? 1.3 : 1) * (fl.atkUp ? 1.25 : 1) - u.def * .6;
      d *= b === 'perfect' ? .2 : b === 'good' ? .5 : 1;
      if (u.defending) d *= .5;
      if (u.defDown) d *= 1.25;
      if (easyMode()) d *= .75;
      d = Math.max(1, Math.round(d * rnd(.92, 1.08)));
      if (u.shield) { const s = Math.min(u.shield, d); u.shield -= s; d -= s; if (s) pop(B, u, 'SHIELD -' + s, '#9fe'); }
      u.hp = Math.max(0, u.hp - d); u.hit = 1; u.shk = 5;
      pop(B, u, d, b === 'perfect' ? '#ffe066' : '#ff6a6a', 13);
      if (b === 'perfect') { pop(B, u, 'PERFECT', '#ffe066', 9); tpGain(5); sfx('bump', .5); } else { sfx(d > 40 ? 'hurt1' : 'hurtsmall', .55); tpGain(2); }
      B.shake = Math.min(10, 3 + d / 10);
      // Ginger's Last Bite (once per friend)
      if (u.hp > 0 && u.hp < u.max * .25 && !u.lastBite && party[1].alive && u !== party[1]) {
        u.lastBite = true; const h = Math.round(u.max * .2); u.hp += h; pop(B, u, 'LAST BITE +' + h, '#ff9db0', 10); sfx('power', .4);
      }
      if (u.hp <= 0) { u.alive = false; u.hp = 0; pop(B, u, 'DOWN', '#f66', 12); sfx('damage', .6); }
      drawPanels(null);
      return d;
    }
    const target = (o = {}) => { const pool = living().filter(u => !u.blown && (o.any || !u.grapple)); return pool.length ? pick(pool) : null; };
    // ---- damage to Flowery
    function hitFlowery(raw, src, o = {}) {
      if (fl.barrier > 0 && !o.pierce) {
        const s = Math.min(fl.barrier, raw); fl.barrier -= s; pop(B, fl, 'BAMBOO -' + Math.round(s), '#8fdc6a', 11); sfx('break1', .4);
        if (fl.barrier <= 0) { pop(B, fl, 'BARRIER BROKEN', '#ffe066', 11); sfx('break2', .6); }
        return 0;
      }
      if (fl.evade > 0 && !o.sure && Math.random() < .5) { fl.evade--; pop(B, fl, 'MISS', '#bbb'); fl.pose = 'flowery_pirouette_3'; setTimeout(() => { fl.pose = null; }, 300); sfx('pirouette', .4); return 0; }
      let d = raw * (fl.fray ? 1.15 : 1) - fl.def * (fl.fray ? .3 : .6);
      d = Math.max(1, Math.round(d * rnd(.93, 1.07)));
      const floor = G.phase === 1 ? fl.max * .65 : G.phase === 2 ? fl.max * .3 : 0;
      fl.hp = Math.max(floor, fl.hp - d);
      fl.hit = 1; fl.shk = 5; pop(B, fl, d, '#fff', 14); burst(B, fl.x, fl.y - 40, '#ffe066', 6);
      G.dmgThisRound += d; if (src) G.lastDealer = src;
      if (fl.charge && o.interrupt) { fl.charge = null; pop(B, fl, 'INTERRUPTED!', '#ffd36b', 11); }
      return d;
    }
    // ---- party actions
    async function doFight(list) {
      const rates = await attackBars(list.length, list.map(u => u.dazzle));
      for (let i = 0; i < list.length; i++) {
        const u = list[i]; u.dazzle = 0;
        await lunge(u, fl.x - 26, 140);
        let mult = .55 + rates[i] * 1.0;
        if (u.name === 'Yatta') { u.combo = (u.combo || 0) + 1; if (u.combo % 3 === 0) { mult *= 1.6; pop(B, u, 'CELEBRATION!', '#ffe95c', 10); } }
        sfx(rates[i] >= 1 ? 'criticalswing' : 'laz_c', .5);
        hitFlowery(u.atk * mult * (u.atkUp ? 1.3 : 1), u);
        await wait(160);
      }
    }
    async function doSkill(u, sk, tgt) {
      G.tp -= sk.tp; drawTP();
      const atk = u.atk * (u.atkUp ? 1.3 : 1);
      pop(B, u, sk.name + '!', u.col, 10); sfx('spellcast', .45);
      await wait(250);
      switch (sk.id) {
        case 'works': await lunge(u, fl.x - 26); sfx('scissorbell', .6); hitFlowery(atk * 2.2, u);
          fl.fray = 3; const buffs = ['atkUp', 'evade'].filter(k => fl[k]); if (buffs.length) { fl[buffs[0]] = 0; pop(B, fl, 'BUFF TORN OFF', '#ffd36b', 10); } pop(B, fl, 'FRAYED', '#ffd36b', 10); break;
        case 'yarn': await lunge(u, fl.x - 26); sfx('chain_extend', .5); hitFlowery(atk * .8, u, { interrupt: true }); if (!fl.charge) { fl.slow = 2; pop(B, fl, 'SNARED', '#ffd36b', 10); } break;
        case 'crash': for (let i = 0; i < 3; i++) { await lunge(u, fl.x - 24, 110); sfx('heavyswing', .5); if (fl.barrier > 0) { fl.barrier = 0; pop(B, fl, 'SHREDDED!', '#ffe066', 11); sfx('break2', .6); } hitFlowery(atk * 1.15, u); await wait(90); } break;
        case 'grapple': u.grapple = true; sfx('chain_extend', .6); await lunge(u, fl.x - 22, 90); hitFlowery(atk * 1.4, u); break;
        case 'baked': {
          const t = tgt; u.hp = Math.max(1, u.hp - Math.round(u.max * .12)); pop(B, u, '-♥', '#ff9db0');
          if (!t.alive) { t.alive = true; t.hp = Math.round(t.max * .45); pop(B, t, 'REVIVED', '#7dff8a'); } else { const h = Math.round(t.max * .7); t.hp = Math.min(t.max, t.hp + h); pop(B, t, '+' + h, '#7dff8a'); }
          sfx('power', .6); FW.voiceLine && pop(B, u, '"I decorated it myself!"', '#ffb3c9', 9); break;
        }
        case 'frost': living().forEach(p => { const h = Math.round(p.max * .3); p.hp = Math.min(p.max, p.hp + h); p.hat = 0; p.burn = 0; p.dazzle = 0; p.defDown = 0; pop(B, p, '+' + h, '#7dff8a'); }); sfx('magicsprinkle', .6); break;
        case 'treats': living().forEach(p => { p.atkUp = 3; }); { const low = living().sort((a, b) => a.hp / a.max - b.hp / b.max)[0]; if (low) { low.shield = Math.round(low.max * .25); pop(B, low, 'SHIELD', '#9fe'); } } sfx('power', .5); break;
        case 'pinata': for (let i = 0; i < 5; i++) { await lunge(u, fl.x - 22 + rnd(-6, 6), 80); sfx('bump', .45, 1 + i * .1); hitFlowery(atk * .6, u); tpGain(2); await wait(40); } break;
        case 'candy': await lunge(u, fl.x - 24, 200); sfx('badexplosion', .5); hitFlowery(atk * 2.4, u); if (fl.fray || fl.hp < fl.max * .35) { fl.dizzy = 1; pop(B, fl, 'DIZZY', '#ffe95c', 11); } break;
        case 'spring': u.spring = true; sfx('jump', .5); pop(B, u, 'SPRING LOADED!', '#ffe95c', 10); break;
      }
      drawPanels(null);
    }
    async function doItem(k, tgt) {
      G.items[k]--; const it = ITEMS[k]; sfx('item', .5);
      if (k === 'cookie' || k === 'bandage') { const h = Math.round(tgt.max * (k === 'cookie' ? .55 : .35)); tgt.hp = Math.min(tgt.max, tgt.hp + h); pop(B, tgt, '+' + h, '#7dff8a'); }
      if (k === 'choco') living().forEach(p => { const h = Math.round(p.max * .25); p.hp = Math.min(p.max, p.hp + h); pop(B, p, '+' + h, '#7dff8a'); });
      if (k === 'cable') { tgt.alive = true; tgt.hp = Math.round(tgt.max * .5); pop(B, tgt, 'REVIVED', '#7dff8a'); }
      if (k === 'speed') tpGain(30);
      log('Used ' + it.name + '.'); drawPanels(null);
    }
    // Ralsei, guest: heals when someone's hurt, otherwise cheers (TP); can't act with a hat on
    async function ralseiTurn() {
      if (!ral.alive) return;
      if (ral.hat) { ral.hat = 0; log('* Ralsei won\'t move until the hat comes off. It\'s off now.'); await wait(900); return; }
      const hurt = living().filter(u => u.hp < u.max * .55).sort((a, b) => a.hp / a.max - b.hp / b.max)[0];
      const down = P0.find(u => !u.alive);
      ral.act = B.rt;
      if (down && Math.random() < .5) { down.alive = true; down.hp = Math.round(down.max * .3); pop(B, down, 'REVIVED', '#7dff8a'); log('Ralsei casts Heal Prayer on ' + down.name + '!'); sfx('revival', .5); }
      else if (hurt) { const h = Math.round(hurt.max * .4); hurt.hp = Math.min(hurt.max, hurt.hp + h); pop(B, hurt, '+' + h, '#7dff8a'); log('Ralsei casts Heal Prayer on ' + hurt.name + '!'); sfx('power', .5); }
      else { tpGain(8); log('Ralsei cheers everyone on! (+8% TP)'); sfx('magicsprinkle', .4); }
      await wait(700); ral.act = 0; drawPanels(null);
    }

    /* ---- Flowery's moves (his Chapter 5 attacks, turned into turns) */
    const pose = async (p, ms) => { fl.pose = p; await wait(ms); };
    const MOVES = {
      async vines() { log('Flowery sends a wall of vines!'); await pose('flowery_gestureup_0', 300); fl.pose = null; await dodgeTurn('VINES', D => FlArena.PAT.vines(D, 6 - (fl.slow ? 2 : 0)), .9, { dur: 6 - (fl.slow ? 2 : 0) }); },
      async dash() { log('Flowery dashes back and forth. You can barely see him.'); voice('hah', 'Hah!'); await dodgeTurn('DASH', D => FlArena.PAT.dash(D, 4 + G.phase), 1.0, { dur: 6 }); },
      async pillars() { log('Light comes down between the petals.'); await dodgeTurn('', D => FlArena.PAT.pillars(D, 6), .9, { dur: 6.5 }); },
      async bamboo() { log('Flowery raises a Bamboo Barrier! It blocks all damage until it breaks.'); await pose('flowery_pose_0', 500); fl.barrier = 380; sfx('grow', .6); pop(B, fl, 'BAMBOO BARRIER', '#8fdc6a', 11); fl.pose = null; await dodgeTurn('', D => FlArena.PAT.petals(D, 4), .7, { dur: 4 }); },
      async chargeUp() { log('Flowery turns blue and lowers his head. He\'s going to CHARGE next turn!'); fl.charge = 'charge'; await pose('flowery_crouch_left_0', 700); sfx('boost', .5); },
      async charge() {
        log('Flowery charges! Dash out of the way!'); fl.hidden = true;
        const r = await dodgeTurn('CHARGE', D => FlArena.PAT.charge(D), 2.6, { dur: 4 });
        fl.hidden = false;
        if (r.hits === 0) { fl.pose = 'flowery_deflected_0'; pop(B, fl, 'HE OVERSHOT!', '#ffe066', 12); sfx('rudebuster_hit', .8); B.shake = 10; hitFlowery(240, null, { sure: true }); fl.stun = 1; await wait(600); }
      },
      async shine() { const u = target(); if (!u) return; log('Flowery flashes his teeth at ' + u.name + '. Dazzling!'); await pose('flowery_teethshine_3', 600); sfx('great_shine', .5); u.dazzle = 1; pop(B, u, 'DAZZLED', '#ffe066', 10); fl.pose = null; await dodgeTurn('', D => FlArena.PAT.petals(D, 4.5), .7, { dur: 4.5 }); },
      async hat() {
        const u = Math.random() < .5 && ral.alive ? ral : target(); if (!u) return;
        log(u === ral ? 'Flowery plops a green hat on Raly. "There. Now you\'re decent."' : 'Flowery plops a green hat on ' + u.name + '. They can\'t act next turn!');
        await pose('flowery_gestureup_right_0', 500); sfx('equip', .5); u.hat = 1; pop(B, u, 'HAT', '#7ff07f', 11); fl.pose = null;
        await dodgeTurn('', D => FlArena.PAT.pillars(D, 4), .8, { dur: 4.5 });
      },
      async pirouette() { log('Flowery pirouettes!'); voice('spiral', 'Spiral dance!'); for (let i = 0; i < 8; i++) { fl.pose = 'flowery_pirouette_' + i; await wait(70); } sfx('pirouette', .5); fl.evade = 2; pop(B, fl, 'EVADE UP', '#fff', 10); fl.pose = null; await dodgeTurn('', D => FlArena.PAT.dash(D, 3), .9, { dur: 4.5 }); },
      async flex() { log('Flowery rolls up his sleeves. ATTACK UP!'); voice('powering_up', 'Powering up!'); fl.pose = 'flowery_poweringup_2'; await wait(800); fl.atkUp = 3; sfx('power', .6); pop(B, fl, 'ATTACK UP', '#ffe066', 11); fl.pose = null; },
      async kick() { log('Flowery flash-kicks!'); voice('take_that', 'Take that!'); await pose('flowery_kick_crescent_0', 300); fl.pose = null; await dodgeTurn('KICK', D => FlArena.PAT.kick(D), 1.0, { dur: 5.5 }); },
      async fire() { log('Flowery throws bouquets. They burst.'); await pose('flowery_puuunch_0', 300); fl.pose = null; await dodgeTurn('', D => FlArena.PAT.fire(D), .9, { dur: 6, onHitU: u => { if (!u.burn) { u.burn = 2; pop(B, u, 'BURN', '#ff8a4a', 10); } } }); },
      async blow() {
        const u = target(); if (!u) return; log('Flowery blows ' + u.name + ' clean off their flower! A mysterious wind!'); voice('wind', 'A mysterious wind...!');
        await pose('flowery_kiss_2', 600); sfx('wing', .6); await tween(u, { ox: -120, alpha: 0 }, 400); u.blown = 1; pop(B, u, 'BLOWN AWAY', '#9fe', 10); fl.pose = null;
      },
      async jarona(withOrange) {
        log(withOrange ? 'Orange rides on Flowery\'s fist! Stay out of its row!' : 'Flowery\'s FLOWER POWER is full. Here it comes!');
        voice('my_jarona', 'Heh, it\'s my Jarona!'); await pose('flowery_punch_windup_4', 900); fl.pose = 'flowery_puuunch_0';
        const r = await dodgeTurn('JARONA', D => FlArena.PAT.jarona(D, { orange: withOrange, fakes: withOrange ? [2, 5] : null,
          onBeat: i => voice(withOrange && (i === 2 || i === 5) ? 'just_kidding' : ['jarona1', 'jarona2', 'jarona3', 'jarona4'][i % 4], '', { ms: 400 }) }), withOrange ? 1.25 : 1.1, { dur: 5.4 });
        fl.fp = 0; fl.pose = null;
        if (r.hits <= 1) { voice('nonono', 'No no no!'); log('He punched himself out. Flowery is reeling!'); hitFlowery(260, null, { sure: true }); fl.stun = 1; }
      },
      // his friends
      async sethAqua() {
        await guest(['Aqua', 'Seth'], '* Flowery\'s friends Aqua and Seth appeared!');
        log(pick(['Flowery shows Seth how to be more confident!', 'Flowery shows Aqua how to safely hold a knife!'])); voice('leaf_it', 'Leaf it to me!');
        await dodgeTurn('SETH & AQUA', D => FlArena.PAT.words(D), .75, { dur: 6.5 });
        if (Math.random() < .5) { log('Seth reads from a list of your weaknesses. Party Defense down!'); living().forEach(u => { u.defDown = 2; }); sfx('noise', .3); await wait(700); }
      },
      async orangeGreen() {
        await guest(['Green', 'Orange'], '* Green and Orange came up the vine!');
        if (!G.cook) {
          log('Green and Flowery come up with a new recipe! (Deal 300+ damage next turn or Green feeds it to him!)'); G.cook = true; G.cookDmg = 0;
          await dodgeTurn('GREEN', D => FlArena.PAT.green(D), .85, { dur: 6 }); return;
        }
        await this.jarona(true);
      },
      async yellowBlue() {
        await guest(['Yellow', 'Blue'], '* Flowery\'s sparring partner Yellow and dance rival Blue appeared!');
        log('Flowery and Yellow point at you side by side!'); voice('predictable', 'What a predictable creature.');
        const u = G.lastDealer && G.lastDealer.alive ? G.lastDealer : null;
        if (u) log('Yellow has his eye on whoever hit Flowery hardest: ' + u.name + '.');
        await dodgeTurn('YELLOW & BLUE', D => FlArena.PAT.yellowBlue(D), .9, { dur: 6.5, target: () => (u && u.alive && Math.random() < .6 ? u : target()) });
      }
    };
    let duoEls = [];
    function duoShow(frames) { duoEls = frames.map((f, i) => { const u = { side: 'x', x: 280 + i * 22, y: 160 + i * 34, s: 1.1, frame: f, alpha: 0 }; B.units.push(u); tween(u, { alpha: 1 }, 300); return u; }); }
    function duoHide() { duoEls.forEach(u => { tween(u, { alpha: 0 }, 300).then(() => { const i = B.units.indexOf(u); if (i >= 0) B.units.splice(i, 1); }); }); duoEls = []; }
    function vineFx(u) { const t0 = B.rt, f = ctx => { const k = cl((B.rt - t0) / .6); P().draw(ctx, 'chasewall_0', fl.x - (fl.x - u.x) * k, u.y - 20, { ax: .5, ay: .5, s: .5, tint: '#7ff07f' }); if (k >= 1) setTimeout(() => { const i = B.over.indexOf(f); if (i >= 0) B.over.splice(i, 1); }); }; return f; }
    function knifeFx(u) { const t0 = B.rt, f = ctx => { const k = cl((B.rt - t0) / .5); P().draw(ctx, 'faqua_knife_spinning_' + (Math.floor(B.rt * 12) % 4), 300 - (300 - u.x) * k, 140 + (u.y - 160) * k, { ax: .5, ay: .5, s: .3 }); if (k >= 1) setTimeout(() => { const i = B.over.indexOf(f); if (i >= 0) B.over.splice(i, 1); }); }; return f; }

    async function floweryTurn() {
      if (fl.stun) { fl.stun = 0; log('Flowery is reeling! He loses his turn.'); await pose('flowery_hurt_0', 900); fl.pose = null; return; }
      fl.fp = Math.min(100, fl.fp + (G.phase === 1 ? 22 : 18));
      if (fl.charge === 'charge') { fl.charge = null; await MOVES.charge(); }
      else if (G.phase === 1) {
        if (fl.fp >= 100) await MOVES.jarona(false);
        else {
          const opts = ['vines', 'dash', 'dash', 'pillars', 'shine', 'kick', 'fire', 'hat', 'pirouette', 'flex', 'blow'];
          if (!fl.barrier && G.round % 4 === 1) opts.push('bamboo', 'bamboo');
          if (G.round % 3 === 2) opts.push('chargeUp', 'chargeUp');
          await MOVES[pick(opts)]();
        }
      } else if (G.phase === 2) {
        const duo = ['sethAqua', 'orangeGreen', 'yellowBlue'][G.duo % 3];
        if (G.cook && duo !== 'orangeGreen') { /* the recipe is finishing elsewhere */ }
        await MOVES[duo]();
        if (!(duo === 'orangeGreen' && G.cook)) G.duo++;
        else if (G.cookDone) { G.duo++; G.cook = false; G.cookDone = false; }
        if (Math.random() < .35 && living().length) await MOVES[pick(['dash', 'fire', 'shine', 'hat'])]();
      } else await omegaTurn();
      fl.pose = null; fl.slow = Math.max(0, (fl.slow || 0) - 1);
      ['fray', 'atkUp', 'dizzy'].forEach(k => { if (fl[k]) fl[k]--; });
    }
    /* ---- Omega Flowery: Prism Rush, high or low */
    async function omegaTurn() {
      if (G.round % 2 === 0) {
        log('PRISM RUSH! Watch him: HIGH means jump (▲), LOW means duck (▼)!');
        voice('prism_blow', 'Prism Blow!');
        let good = 0;
        for (let i = 0; i < 5; i++) {
          const high = Math.random() < .5;
          fl.omegaPose = high ? 'omegaflowery_windup' : 'omegaflowery_punch';
          const ok = await dirPrompt(high ? 'up' : 'down', .9 - i * .06);
          fl.omegaPose = 'omegaflowery_jarona';
          if (ok) { good++; sfx('rudebuster_hit', .5); hitFlowery(70, null, { sure: true }); pop(B, fl, 'COUNTER!', '#ffe066', 11); }
          else for (const u of living()) await hitParty(u, .8, { aoe: true });
        }
        if (good === 5) { log('You read every move! Omega Flowery staggers!'); hitFlowery(200, null, { sure: true }); }
      } else {
        log('Omega Flowery shines with every color. WITH YOUR POWERS COMBINED!'); voice('powers_combined', 'With your powers combined!');
        await dodgeTurn('OMEGA', D => FlArena.PAT.omega(D), 1.2, { dur: 7, lane: 160 });
      }
    }
    function dirPrompt(want, dur) {
      return new Promise(res => {
        const t0 = B.rt; let done = false;
        const f = ctx => {
          const t = B.rt - t0, k = cl(t / dur);
          ctx.fillStyle = 'rgba(0,0,0,.5)'; ctx.fillRect(110, 40, 100, 34);
          FlowerCuts.text(ctx, want === 'up' ? '▲ HIGH' : '▼ LOW', 160, 57, { size: 14, color: want === 'up' ? '#9fe' : '#ff9ad0', alpha: k < .35 ? 1 : .35 + Math.random() * .2 });
          ctx.fillStyle = '#fff'; ctx.fillRect(110, 72, 100 * (1 - k), 2);
          if (t > dur && !done) end(false);
        };
        const end = v => { if (done) return; done = true; B.over.splice(B.over.indexOf(f), 1); B.onDir = null; B.cv.onpointerdown = null; res(v); };
        B.over.push(f);
        B.onDir = d => { if (d === 'up' || d === 'down') end(d === want); };
        B.onConfirm = null;
        // on touch: tap the top half for high, the bottom half for low
        B.cv.onpointerdown = e => { const r = B.cv.getBoundingClientRect(); end(((e.clientY - r.top) / r.height < .5 ? 'up' : 'down') === want); B.cv.onpointerdown = null; };
      });
    }

    /* ---- phase changes */
    async function phaseTwo() {
      G.phase = 2; save();
      fl.pose = 'flowery_lookdown_upleft_0';
      await say('Flowery', 'serious', 'Okay. Okay! You\'re better at choosing than I thought.');
      await say('Flowery', 'yell', 'Then I won\'t do it alone. PETALS! Two at a time, just like we practiced!');
      await say('Seth', '', 'We did NOT practice this!');
      await say('Aqua', '', 'Uuu, I practiced! With knives!');
      await say('Orange', '', 'I-I practiced too! I\'m EXTRA now!');
      FW.hideBox(); fl.pose = null;
      tween(B, { sunsetK: 1 }, 1600);
      await guest(['Aqua', 'Seth'], '* Flowery\'s friends Aqua and Seth appeared!');
    }
    async function phaseThree() {
      G.phase = 3; save();
      await say('Flowery', 'hair2', '...Not yet. I said NOT YET.');
      await say('Flowery', 'hair3', 'Everybody. All of you. | Lend me ALL of it.');
      FW.hideBox();
      tween(B, { sunsetK: 0 }, 900);
      const gh = { k: 0 }; const ghF = ctx => FlArena.ghosts(ctx, B.rt, gh.k, fl.x, fl.y - 40);
      B.over.push(ghF); fl.pose = 'flowery_poweringup_2';
      await tween(gh, { k: 1 }, 1400);
      voice('lend_power', 'Lend me your power!'); sfx('great_shine', .7);
      await wait(1600);
      for (let i = 0; i < 12; i++) { B.flash = .5; B.flashCol = ['#7ff07f', '#8ff8ff', '#c49bff', '#ffe37a', '#9fb6ff', '#ff9a5a'][i % 6]; await wait(110); }
      B.over.splice(B.over.indexOf(ghF), 1); Object.values(guests).forEach(u => { u.hidden = true; }); fl.pose = null;
      B.bg = BG.omega; fl.omega = true; fl.s = 1.3; fl.omegaPose = 'omegaflowery_jarona'; fl.y = 196; fl.x = 240;
      P0.forEach((u, i) => { u.pad = null; u.noShadow = false; u.h = 44; u.y = 192 + (i % 2) * 8; u.x = 36 + i * 34; });
      voice('omega', 'OMEGA FLOWERY!'); B.flash = 1; B.flashCol = '#fff'; B.shake = 12;
      FW.music('flBoss');
      await say('Ralsei', 'shock', 'All seven flowers at once...! | Everyone, dodge with ▲ and ▼! Counter when he commits!');
      FW.hideBox();
    }

    const lost = () => !party.some(u => u.alive);
    async function handleLoss() {
        st.losses++; try { Save.write(); } catch (_) { /* optional */ }
        const lines = ['* Flowery carried everyone back. Gently, like princesses.', '* Green put your items back.'];
        if (st.losses === 6) lines.push('<b style="color:#ffe066">* Flowery is going easy on you. He\'d like you not to mention it.</b>');
        const c = await retryCard(B, lines, ['TRY AGAIN', 'LEAVE']);
        if (c === 1) { unmount(B); return 'quit'; }
        P0.forEach(u => { u.alive = true; u.hp = u.max; u.hat = 0; u.burn = 0; u.dazzle = 0; u.defDown = 0; u.shield = 0; u.atkUp = 0; u.lastBite = false; u.ox = 0; u.alpha = 1; });
        fl.hp = check.hp; G.phase = check.phase; G.duo = check.duo; G.tp = 0; G.cook = false; fl.fp = 0; fl.barrier = 0; fl.charge = null;
        resetItems(); drawTP(); drawPanels(null);
      }

    /* ---- the round loop */
    drawTP();
    for (;;) {
      G.round++; G.dmgThisRound = 0;
      if (lost()) { if (await handleLoss() === 'quit') return 'quit'; continue; }
      // burn ticks
      living().forEach(u => { if (u.burn) { const d = Math.round(u.max * .06); u.hp = Math.max(1, u.hp - d); pop(B, u, d, '#ff8a4a', 10); u.burn--; } u.defending = false; u.grapple = false; u.spring = false; });
      drawPanels(null);
      // choose actions
      const plan = [];
      const actors = party.filter(u => u.alive && !u.hat && !u.blown);
      party.forEach(u => { if (u.alive && u.hat) pop(B, u, 'HAT (skips)', '#7ff07f', 10); if (u.alive && u.blown) pop(B, u, 'BLOWN AWAY (skips)', '#9fe', 10); });
      for (let i = 0; i < actors.length; i++) {
        const u = actors[i];
        drawPanels(u); log(u.name + ' — what will you do?');
        const btns = [...B.ui.querySelectorAll('.fb-pc.turn .fb-btns button')];
        const c = await choose(btns, { cols: 4, back: i > 0 });
        if (c === -1) { const prev = plan.pop(); if (prev && prev.refund) G.tp += prev.refund; if (prev && prev.refundItem) G.items[prev.refundItem]++; drawTP(); i = Math.max(-1, i - 2); continue; }
        const kind = btns[c].dataset.a;
        if (kind === 'fight') { plan.push({ u, kind }); continue; }
        if (kind === 'defend') { plan.push({ u, kind }); continue; }
        if (kind === 'skill') {
          const list = SKILLS[u.name];
          const s = await subMenu(list.map(sk => ({ label: sk.name, right: sk.tp + '% TP', disabled: G.tp < sk.tp || (sk.id === 'baked' && u.hp < u.max * .25) })), k => list[k].desc);
          if (s < 0) { i--; continue; }
          const sk = list[s]; let tgt = null;
          if (sk.target === 'ally') { tgt = await pickTarget('allyAny'); if (!tgt) { i--; continue; } }
          G.tp -= sk.tp; drawTP();
          plan.push({ u, kind, sk, tgt, refund: sk.tp });
          continue;
        }
        if (kind === 'item') {
          const keys = Object.keys(ITEMS);
          const s = await subMenu(keys.map(k => ({ label: ITEMS[k].name, right: 'x' + G.items[k], disabled: G.items[k] <= 0 || (ITEMS[k].target === 'ko' && !P0.some(p => !p.alive)) })), k => ITEMS[keys[k]].desc);
          if (s < 0) { i--; continue; }
          const k = keys[s]; let tgt = null;
          if (ITEMS[k].target === 'ally') { tgt = await pickTarget('ally'); if (!tgt) { i--; continue; } }
          if (ITEMS[k].target === 'ko') { tgt = await pickTarget('ko'); if (!tgt) { i--; continue; } }
          G.items[k]--; plan.push({ u, kind, k, tgt, refundItem: k });
          continue;
        }
      }
      party.forEach(u => { if (u.hat) u.hat = 0; if (u.blown) { u.blown = 0; tween(u, { ox: 0, alpha: 1 }, 300); } });
      drawPanels(null); log('');
      // run them: defend first, then items, skills, and all the FIGHTs together
      for (const p of plan) if (p.kind === 'defend') { p.u.defending = true; tpGain(16); pop(B, p.u, 'DEFEND', '#9fe', 10); sfx('bump', .3); }
      for (const p of plan) if (p.kind === 'item') { G.items[p.k]++; await doItem(p.k, p.tgt); await wait(250); }
      for (const p of plan) if (p.kind === 'skill') { G.tp += p.sk.tp; await doSkill(p.u, p.sk, p.tgt); await wait(200); }
      const fighters = plan.filter(p => p.kind === 'fight').map(p => p.u);
      if (fighters.length) await doFight(fighters);
      if (lost()) { if (await handleLoss() === 'quit') return 'quit'; continue; }
      await ralseiTurn();
      // the Green recipe resolves
      if (G.cook && G.phase === 2) {
        if (G.dmgThisRound >= 300) { log('* You broke up the cooking. Green looks proud of you anyway.'); G.cook = false; G.duo++; }
        else { const h = Math.round(fl.max * .08); fl.hp = Math.min(fl.max * .65, fl.hp + h); pop(B, fl, '+' + h, '#7dff8a'); log('Green feeds Flowery the new recipe. Petalicious!'); voice('try_flavor', 'Try my flavor!'); G.cookDone = true; }
        await wait(900);
      }
      // phase checks
      if (G.phase === 1 && fl.hp <= fl.max * .65 + 1) { await phaseTwo(); }
      else if (G.phase === 2 && fl.hp <= fl.max * .3 + 1) { await phaseThree(); }
      else if (G.phase === 3 && fl.hp <= 0) break;
      if (!living().length) { /* fall through to loss */ }
      else { await floweryTurn(); if (G.phase === 3 && fl.hp <= 0) break; }
      if (G.phase === 3 && fl.hp <= 0) break;
      if (lost()) { if (await handleLoss() === 'quit') return 'quit'; continue; }
      // party side ticks
      party.forEach(u => { if (u.atkUp) u.atkUp--; if (u.defDown) u.defDown--; });
    }
    // won
    fl.omegaPose = 'omegaflowery_hurt'; B.shake = 14; B.flash = 1; sfx('badexplosion', .8);
    log(''); await wait(1200);
    unmount(B);
    st.beaten = true; try { Save.write(); } catch (_) { /* optional */ }
    return 'win';
  };

  window.FloweryBattle = { mount, unmount, BG };
})();
