/* aperture.js - "Aperture Science: Test Subject", a story event.
   A slow-burn visual novel (Looey, Wheatley, a rebuilt GLaDOS 300 floors down), a real-time 1-on-1 portal fight (Looey vs GLaDOS; Easy, Medium, Hard;
   levels never matter), a finale cutscene, and credits. Beating it lets Dyle's shop recruit Chell (js/chell-kit.js).
   Art is all 2D: sprites from the GLaDOS MUGEN character and the Chell sheet, 3D props rendered flat (tools/portal/). Sounds come from the GLaDOS pack. */
'use strict';

(() => {
  const ID = 'aperture-event';
  const BASE = 'assets/aperture/';
  const TITLE = 'Aperture Science: Test Subject';
  const asset = f => ASSET + BASE + f;

  /* ---------------------------------------------------------------- state */
  const state = () => {
    const raid = Raid.state();
    const s = raid.aperture || (raid.aperture = {});
    s.read = !!s.read;
    if (!s.beaten || typeof s.beaten !== 'object') s.beaten = {};
    if (!s.best || typeof s.best !== 'object') s.best = {};
    s.tries = s.tries || 0; s.credits = !!s.credits; s.chell = !!s.chell;
    s.license = !!s.license || Object.values(s.beaten).some(Boolean);   // the first clear of anything
    s.bank = Math.max(0, Number(s.bank) || 0);                            // shards earned before she was bought
    s.diff = ['easy', 'medium', 'hard', 'kaizo'].includes(s.diff) ? s.diff : 'medium';
    return s;
  };
  const beatenAny = () => Object.values(state().beaten).some(Boolean);
  /* Kaizo needs every Bosker's Globe toon */
  const GLOBE_IDS = ['Astro', 'Vee', 'Shelly', 'Bassie', 'Gourdy', 'Yatta', 'Sprout', 'Bobette', 'Pebble'];
  const globeCount = () => GLOBE_IDS.filter(id => { try { return Save.owns('g:' + id); } catch (_) { return false; } }).length;
  const globeAll = () => globeCount() === GLOBE_IDS.length;
  /* Chell: a license from the first clear, bought at Dyle's; shards from clears (1 to 3 stars is the base pack) */
  const CHELL_PRICE = 25000;
  function shardsToThree() {
    try { const m = obtainOf('Chell').costMult, b = Progress.promotionShardMultiplier(); return Math.max(1, Math.round(STAR_COST[1] * m * b) + Math.round(STAR_COST[2] * m * b)); } catch (_) { return 110; }
  }
  const CLEAR_SHARDS = { easy: .5, medium: .75, hard: 1, kaizo: 2 };         // times the base pack; Kaizo pays more than any other difficulty
  const clearShards = k => Math.round(shardsToThree() * (CLEAR_SHARDS[k] || .5));
  const payShards = n => { if (Save.owns('Chell')) { try { Save.giveShards('Chell', n); } catch (_) { /* optional */ } } else state().bank += n; };

  const DIFFS = {
    easy:   { label: 'Easy',   note: 'Slow' },
    medium: { label: 'Medium', note: 'Faster' },
    hard:   { label: 'Hard',   note: 'Fast, less health' },
    kaizo:  { label: 'Kaizo',  note: 'Glitched' }
  };

  /* ---------------------------------------------------------------- audio */
  const SFX = { index: null, buffer: null, urls: {}, live: new Set() };
  const sfxReady = fetch(asset('sfx/index.json')).then(r => r.json()).then(i => { SFX.index = i; return fetch(asset('sfx/aperture-sfx.bin')); })
    .then(r => r.arrayBuffer()).then(b => { SFX.buffer = b; return Promise.all([loadMia(), loadVoid(), loadShop()]); }).catch(() => { /* the event still works without the voice pack */ });
  /* the Kaizo-only pack: the Mia character's sounds cut into pieces (tools/portal/build-mia.js) */
  /* the void pieces play only once someone has auditioned them: tools/portal/audition-void.html writes void-approved.json */
  /* the shop pack plays only once someone has auditioned it: tools/portal/audition-void.html?pack=shop writes shop-approved.json */
  function loadShop() {
    return fetch(asset('sfx/shop-approved.json')).then(r => { if (!r.ok) throw new Error('not approved'); return r.json(); }).then(ap => fetch(asset('sfx/shop-index.json')).then(r => r.json()).then(i => fetch(asset('sfx/shop-sfx.bin')).then(r => r.arrayBuffer()).then(ab => { SFX.shopBuf = ab; Object.keys(i).forEach(k => { if ((ap.approved || []).includes(k)) SFX.index[k] = [i[k][0], i[k][1], i[k][2], 's']; }); }))).catch(() => { /* none approved yet: no shop sounds */ });
  }
  function loadVoid() {
    return fetch(asset('sfx/void-approved.json')).then(r => { if (!r.ok) throw new Error('not approved'); return r.json(); }).then(ap => fetch(asset('sfx/void-index.json')).then(r => r.json()).then(i => fetch(asset('sfx/void-sfx.bin')).then(r => r.arrayBuffer()).then(ab => { SFX.voidBuf = ab; Object.keys(i).forEach(k => { if ((ap.approved || []).includes(k)) SFX.index[k] = [i[k][0], i[k][1], i[k][2], 'v']; }); }))).catch(() => { /* none approved yet: no void sounds */ });
  }
  function loadMia() {
    return fetch(asset('sfx/mia-index.json')).then(r => r.json()).then(i => fetch(asset('sfx/mia-sfx.bin')).then(r => r.arrayBuffer()).then(ab => { SFX.miaBuf = ab; Object.keys(i).forEach(k => { SFX.index[k] = [i[k][0], i[k][1], i[k][2], 'm']; }); })).catch(() => { /* Kaizo works without it */ });
  }
  function snd(name, vol = .6, o = {}) {
    try {
      if(name==='shoot-a'){Sound.play('chell_portal_fire',{vol,rate:o.rate||1,throttle:140});return;}
      if (Sound.on === false || !SFX.buffer || !SFX.index || !SFX.index[name]) return;
      const [at, len, secs, pk] = SFX.index[name], src = pk === 'm' ? SFX.miaBuf : pk === 'v' ? SFX.voidBuf : pk === 's' ? SFX.shopBuf : SFX.buffer;
      if (!src) return;
      const url = SFX.urls[name] || (SFX.urls[name] = window.URL.createObjectURL(new Blob([src.slice(at, at + len)], { type: 'audio/ogg' })));
      const a = new Audio(url);
      a.volume = clamp(vol * (typeof Sound.vol === 'number' ? Sound.vol : 1), 0, 1);
      if (o.pitch) { a.preservesPitch = false; a.mozPreservesPitch = false; a.webkitPreservesPitch = false; }
      const rate = (o.rate || 1) * (o.pitch || 1); if (rate !== 1) a.playbackRate = clamp(rate, .25, 4);
      if (o.from) { try { a.currentTime = o.from; } catch (_) { /* not ready */ } }
      a.play().catch(() => {});
      if (o.voice) { SFX.live.add(a); const drop = () => SFX.live.delete(a); a.addEventListener('ended', drop); a.addEventListener('error', drop); }
      // a line marked full is never cut: it plays to its end
      if (!o.full) { const max = o.max || Math.min(secs, 6) * 1000; setTimeout(() => { try { a.pause(); } catch (_) { /* gone */ } }, max + (o.exact ? 0 : 200)); }
      return a;
    } catch (_) { /* audio is decoration */ }
  }
  if (typeof MUSIC_TRACKS !== 'undefined') {
    MUSIC_TRACKS.apStory = ASSET + BASE + 'music/self-esteem-fund.mp3';
    MUSIC_TRACKS.apFight = ASSET + BASE + 'music/some-assembly-required.mp3';
    MUSIC_TRACKS.apCalm = ASSET + BASE + 'music/future-starts-with-you.mp3';
    MUSIC_TRACKS.apCredits = ASSET + BASE + 'music/still-alive.mp3';
    MUSIC_TRACKS.apKaizo = ASSET + BASE + 'music/kaizo.mp3';
  }
  const playMusic = key => { try { Music.play(key); } catch (_) { /* optional */ } };

  /* ---------------------------------------------------------------- sprites */
  const atlas = { img: new Image(), frames: null };
  const atlasReady = Promise.all([
    fetch(asset('atlas.json')).then(r => r.json()).then(j => { atlas.frames = j.frames; }).catch(() => {}),
    new Promise(res => { atlas.img.onload = atlas.img.onerror = res; atlas.img.src = asset('atlas.png'); })
  ]);
  /* the Kaizo-only atlas: abstract pieces (vortex, rings, static, dark shapes) */
  const atlas2 = { img: new Image(), frames: null };
  const atlas2Ready = Promise.all([
    fetch(asset('corrupt-atlas.json')).then(r => r.json()).then(j => { atlas2.frames = j.frames; }).catch(() => {}),
    new Promise(res => { atlas2.img.onload = atlas2.img.onerror = res; atlas2.img.src = asset('corrupt-atlas.png'); })
  ]);
  const spr2 = (ctx, name, x, y, o) => spr(ctx, name, x, y, Object.assign({ at: atlas2 }, o));
  /* the Kaizo intro's cameo */
  const atlas3 = { img: new Image(), frames: null };
  const atlas3Ready = Promise.all([
    fetch(asset('shop-atlas.json')).then(r => r.json()).then(j => { atlas3.frames = j.frames; }).catch(() => {}),
    new Promise(res => { atlas3.img.onload = atlas3.img.onerror = res; atlas3.img.src = asset('shop-atlas.png'); })
  ]);
  const spr3 = (ctx, name, x, y, o) => spr(ctx, name, x, y, Object.assign({ at: atlas3 }, o));
  /* draw an atlas frame. o: ax, ay (anchor 0..1), s (scale), flip, rot, alpha, at (another atlas) */
  function spr(ctx, name, x, y, o = {}) {
    const at = o.at || atlas, f = at.frames && at.frames[name];
    if (!f) return null;
    const s = o.s || 1, w = f.w * s, h = f.h * s;
    ctx.save();
    ctx.translate(x, y);
    if (o.rot) ctx.rotate(o.rot);
    if (o.flip) ctx.scale(-1, 1);
    if (o.alpha != null) ctx.globalAlpha = o.alpha;
    ctx.drawImage(at.img, f.x, f.y, f.w, f.h, -w * (o.ax == null ? .5 : o.ax), -h * (o.ay == null ? .5 : o.ay), w, h);
    ctx.restore();
    return { w, h };
  }
  const PORTRAITS = { Wheatley: BASE + 'wheatley.png', GLaDOS: BASE + 'glados.png' };

  /* ---------------------------------------------------------------- story */
  const scene = (title, place, time, script) => ({ title, place, script: script.trim(), time, date: 'APERTURE' });
  const STORY = [
    scene('Quiet Hours', 'Gardenview Educational Center', 'AFTER HOURS', `
@bg assets/uploads/backgroundlobby1.webp
@music apStory
> Gardenview Educational Center. After hours.
@enter Looey center
Looey: Quiet. Good.
> A vending machine clunks. A mint drops. Nobody pressed anything.
> The wrapper has a stamp on it: a circle with a slice missing.
Looey: Huh.
> The vent over the fountain rattles. Something small is crying in it.
Looey [!]: Hello?
@exitall`),

    scene('The Vent', 'Gardenview Educational Center', 'AFTER HOURS', `
@bg assets/uploads/backgroundlobby1.webp
@enter Looey right
> The cover falls off. A core drops into the fountain.
@enter Wheatley left
Wheatley: Oh! A person! Thank goodness. Hello. Hi.
Looey: Hi?
Wheatley: She's back. GLaDOS. Somebody put her back together.
Looey: Who?
Wheatley: No idea. There was a clipboard. Tidy handwriting. A "D", a dot, a "K", a dot.
Looey: Where is she?
Wheatley: Down. Below the basement. Past where the floor plans stop.
> A service door that is on no floor plan stands open behind the fountain.
Looey: ...Okay.
Wheatley: You're going? Right. Right. I'll come. From just behind you.
@exitall`),

    scene('Down', 'Service Elevator', 'GOING DOWN', `
@bg assets/aperture/bg/shaft.png
@music apCalm
@enter Looey right
@enter Wheatley left
> One button. No label. The doors close.
> Floor 47.
Wheatley: It's an elevator. They go down. That's what they do.
> Floor 96. A mug sits by the door. WORLD'S OKAYEST RESEARCHER. Still warm.
Looey: Someone was just here.
Wheatley: Think about toast.
> Floor 241. Far below, a calm voice is counting something.
Looey: How many floors is this?
Wheatley: Three hundred. Give or take a basement.
> Floor 300.
@exitall`),

    scene('Floor 300', 'Test Chamber', 'FLOOR 300', `
@bg assets/aperture/bg/ruins.png
@fx dark
> Green tubing runs along the new panels. Neat little staples.
@enter Wheatley left
@enter Looey center
Wheatley: That tubing. I know that tubing. We should leave. We should have left earlier.
@enter GLaDOS farright
> Something large unfolds from the ceiling. Four small cores hang from it like buttons.
Looey: We're lost. We were looking for a vent.
> A pedestal rises behind Looey. On it, a white device with two barrels. One blue. One orange.
Looey: ...Is that for me?
Wheatley: It's always for you.
@sfx ui_open
@exitall`)
  ];

  function playChapters(list, done) {
    let i = 0;
    const next = () => {
      if (i >= list.length) { done(true); return; }
      const data = list[i++];
      StoryUI.playScene(0, false, {
        scene: data,
        className: 'ap-vn',
        portrait: who => PORTRAITS[who] ? ASSET + PORTRAITS[who] : stPortrait(who),
        onFinish: skipped => { if (skipped) { done(false); return; } next(); }
      });
    };
    next();
  }

  /* ---------------------------------------------------------------- the fight (js/aperture-fight.js) */
  const voices = { hold: on => SFX.live.forEach(a => { try { if (on) a.pause(); else a.play().catch(() => {}); } catch (_) { /* gone */ } }), stop: () => { SFX.live.forEach(a => { try { a.pause(); } catch (_) { /* gone */ } }); SFX.live.clear(); } };
  const playFight = (diffKey, onEnd) => window.ApertureFight.play(diffKey, onEnd, { spr3, atlas3Ready, shopClips: () => Object.keys(SFX.index || {}).filter(k => k.indexOf('shop-') === 0).map(k => [k, SFX.index[k][2]]), spr2, atlas2Ready, voidClips: () => Object.keys(SFX.index || {}).filter(k => k.indexOf('void-') === 0).map(k => [k, SFX.index[k][2]]), voices, miaClips: () => Object.keys(SFX.index || {}).filter(k => k.indexOf('mia-') === 0).map(k => [k, SFX.index[k][2]]), sfxLen: n => (SFX.index && SFX.index[n] ? SFX.index[n][2] : 0), snd, spr, atlasReady, sfxReady, playMusic, asset });

  /* ---------------------------------------------------------------- credits */
  const CREDITS = [
    ['STILL ALIVE', 'Aperture Science'],
    ['', ''],
    ['TEST SUBJECT', 'Looey'],
    ['PERSONALITY CORE', 'Wheatley'],
    ['TEST', 'GLaDOS'],
    ['', ''],
    ['MUGEN GLaDOS', 'fhqwhgads7'],
    ['PEDESTAL BUTTON MODEL', 'ripped by KartMakerBrosU'],
    ['PIXEL SPRITES', 'fan sprite sheet'],
    ['PORTAL', 'Valve'],
    ['', ''],
    ['DANDY\'S WORLD', ''],
    ['', ''],
    ['THANKS FOR PLAYING', ''],
    ['', ''],
    ['Dyle has something for you.', '']
  ];
  function playCredits(onDone) {
    const root = el('div', 'ap-credits');
    const rows = CREDITS.map(([a, b]) => `<div class="ap-cr${a === 'STILL ALIVE' ? ' title' : ''}"><b>${a}</b><span>${b}</span></div>`).join('');
    root.innerHTML = `<canvas class="ap-cr-strip" width="400" height="120"></canvas><div class="ap-cr-scroll"><div class="ap-cr-pad"></div>${rows}<div class="ap-cr-pad"></div></div><button class="ap-skip" type="button">Skip</button>`;
    ($('#app') || document.body).appendChild(root);
    const strip = $('.ap-cr-strip', root), sc = strip.getContext('2d'); sc.imageSmoothingEnabled = false;
    const scroll = $('.ap-cr-scroll', root);
    const audio = new Audio(asset('music/still-alive.mp3'));
    audio.volume = clamp((typeof Music !== 'undefined' && typeof Music.volume === 'number' ? Music.volume : .7), 0, 1);
    try { Music.stop && Music.stop(); } catch (_) { /* optional */ }
    let finished = false, t0 = performance.now();
    const done = () => { if (finished) return; finished = true; try { audio.pause(); } catch (_) { /* gone */ } root.remove(); state().credits = true; Save.write(); playMusic('navigation'); onDone(); };
    $('.ap-skip', root).onclick = done;
    const total = () => (isFinite(audio.duration) && audio.duration > 30 ? audio.duration : 175) * 1000;
    audio.onended = () => setTimeout(done, 1200);
    audio.play().catch(() => {});
    atlasReady.then(() => {
      const tick = now => {
        if (!root.isConnected) return;
        const k = Math.min(1, (now - t0) / total());
        scroll.style.transform = `translateY(${(1 - k) * 100 - k * (scroll.scrollHeight - 200)}px)`;
        sc.clearRect(0, 0, 400, 120);
        const x = ((now - t0) / 28) % 520 - 60;
        spr(sc, 'cube', x, 112, { ax: .5, ay: 1, s: 1.1, rot: Math.sin((now - t0) / 160) * .06 });
        spr(sc, 'wheatley', x + 62, 96 + Math.sin((now - t0) / 260) * 6, { s: .3 });
        spr(sc, 'chell-cakes', 330, 112, { ax: .5, ay: 1, s: .6 });
        spr(sc, 'pixel-turret', 60, 112, { ax: .5, ay: 1, s: .9 });
        requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    });
  }

  /* ---------------------------------------------------------------- event card, dossier, shop */
  const sceneThen = (fn) => { Screens._raidDossier = ID; try { Screens.render(); } catch (_) { /* optional */ } if (fn) fn(); };
  function startFlow(diff, withStory) {
    const run = () => playFight(diff, (ok, res) => {
      const st = state();
      if (ok === null) { sceneThen(() => playMusic('navigation')); return; }
      st.tries++;
      if (ok) {
        const firstAny = !st.license, firstDiff = !st.beaten[diff], n = Math.round(clearShards(diff) * (firstDiff ? 1 : .2));
        st.beaten[diff] = true; st.license = true; payShards(n); if (res && res.rank && 'SABC'.indexOf(res.rank) < 'SABC'.indexOf(st.best[diff] || 'D')) st.best[diff] = res.rank; Save.write();
        playCredits(() => { sceneThen(); UI.toast(firstAny ? 'Chell license unlocked at Dyle\'s shop. +' + n + ' shards' : '+' + n + ' Chell shards'); });
      } else { Save.write(); sceneThen(); UI.toast('Test failed.'); }
    });
    if (withStory) playChapters(STORY, finished => { if (finished) { state().read = true; Save.write(); run(); } else sceneThen(); });
    else run();
  }

  function recruitChell() {
    const st = state();
    if (Save.owns('Chell') || !st.license) return 0;
    if (!Save.can({ gold: CHELL_PRICE })) { UI.toast('Not enough gold.'); return 0; }
    Save.spend({ gold: CHELL_PRICE });
    Save.data.heroes.Chell = Save.newHero('Chell');
    st.chell = true;
    try { Save.addMasteryXp(260); Achievements.record('heroUnlock', 1); if (UI.queueHeroUnlock) UI.queueHeroUnlock('Chell'); } catch (_) { /* extras only */ }
    const n = shardsToThree() + st.bank; st.bank = 0;
    try { Save.giveShards('Chell', n); } catch (_) { /* optional */ }
    Save.write();
    return n;
  }

  /* ---------------------------------------------------------------- menu scene and intro */
  const rng = i => { const x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
  const ease = k => { k = Math.max(0, Math.min(1, k)); return k * k * (3 - 2 * k); };
  /* One painter for the intro and the menu banner. st: scroll (px), speed 0..1, glados 0..1 (how far she has lowered), flash, shake */
  function drawScene(ctx, w, h, t, st) {
    const u = h / 300;
    ctx.save();
    if (st.shake) ctx.translate((Math.random() - .5) * st.shake, (Math.random() - .5) * st.shake);
    let g = ctx.createLinearGradient(0, 0, 0, h); g.addColorStop(0, '#05070a'); g.addColorStop(1, '#18202a'); ctx.fillStyle = g; ctx.fillRect(-30, -30, w + 60, h + 60);
    // far wall: dark panels
    ctx.fillStyle = 'rgba(255,255,255,.03)';
    for (let x = 0; x < w; x += 90 * u) ctx.fillRect(x, 0, 2, h);
    // columns
    [[.05, 22], [.17, 12], [.83, 12], [.95, 22]].forEach(c => {
      const cw = c[1] * u, cx = w * c[0] - cw / 2, cg = ctx.createLinearGradient(cx, 0, cx + cw, 0); cg.addColorStop(0, '#10151a'); cg.addColorStop(.35, '#3a444e'); cg.addColorStop(1, '#0d1115');
      ctx.fillStyle = cg; ctx.fillRect(cx, -10, cw, h + 20);
    });
    // girders passing by
    const gap = 130 * u;
    for (let i = -1; i < h / gap + 2; i++) {
      const y = ((i * gap + st.scroll) % (gap * Math.ceil(h / gap + 2))) - gap;
      ctx.fillStyle = '#0b0e11'; ctx.fillRect(0, y, w, 12 * u);
      ctx.fillStyle = '#2b333b'; ctx.fillRect(0, y + 2 * u, w, 3 * u);
      ctx.fillStyle = '#566069'; ctx.fillRect(0, y + 2 * u, w, Math.max(1, u * .8));
      ctx.fillStyle = '#7c8791'; for (let x = 12 * u; x < w; x += 46 * u) ctx.fillRect(x, y + 7 * u, 2 * u, 2 * u);
      const tx = w * (.3 + rng(Math.floor((st.scroll - i * gap) / gap) + i) * .35);
      ctx.fillStyle = '#c8700f'; ctx.fillRect(tx, y - 2 * u, 36 * u, 16 * u); ctx.fillStyle = '#16181a';
      for (let k = 0; k < 6; k++) { ctx.beginPath(); ctx.moveTo(tx + k * 8 * u, y + 14 * u); ctx.lineTo(tx + k * 8 * u + 4 * u, y + 14 * u); ctx.lineTo(tx + k * 8 * u + 8 * u, y - 2 * u); ctx.lineTo(tx + k * 8 * u + 4 * u, y - 2 * u); ctx.fill(); }
    }
    // speed streaks
    if (st.speed > .04) for (let n = 0; n < 34; n++) {
      const x = rng(n) * w, len = (30 + rng(n + 50) * 120) * u * st.speed, y = ((rng(n + 9) * h * 2 + st.scroll * (1.1 + rng(n + 3))) % (h * 1.5)) - len;
      ctx.strokeStyle = 'rgba(255,' + (150 + Math.floor(rng(n + 4) * 80)) + ',80,' + (.25 + .4 * st.speed * rng(n + 2)) + ')'; ctx.lineWidth = Math.max(1, 1.6 * u); ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, y + len); ctx.stroke();
    }
    // dust
    ctx.fillStyle = 'rgba(255,255,255,.22)';
    for (let n = 0; n < 26; n++) { const x = (rng(n + 70) * w + Math.sin(t * .3 + n) * 12 * u + w) % w, y = (rng(n + 90) * h + t * (6 + rng(n) * 10) * u + st.scroll * .1) % h; ctx.fillRect(x, y, Math.max(1, u), Math.max(1, u)); }
    // GLaDOS lowers from the ceiling, swaying on her cables
    const gl = ease(st.glados);
    if (gl > 0) {
      const sc = h / 315 * 1.02, px = w * .74, py = -(1 - gl) * h * 1.15 - 4;
      const lg = ctx.createRadialGradient(px, h * .8, 10, px, h * .8, h * .8); lg.addColorStop(0, 'rgba(255,138,31,' + (.22 * gl) + ')'); lg.addColorStop(1, 'rgba(255,138,31,0)'); ctx.fillStyle = lg; ctx.fillRect(0, 0, w, h);
      ctx.save(); ctx.translate(px, py); ctx.rotate(Math.sin(t * .7) * .022 * gl); ctx.imageSmoothingEnabled = false;
      ctx.strokeStyle = '#0b0e11'; ctx.lineWidth = 5 * u; ctx.beginPath(); ctx.moveTo(0, -3000); ctx.lineTo(0, 0); ctx.stroke();
      spr(ctx, 'glados-' + (Math.floor(t * 3) % 5), 0, 0, { ax: .5, ay: 0, s: sc, flip: true });
      if (window.ApertureFight && window.ApertureFight.paintMounts) window.ApertureFight.paintMounts(ctx, spr, 0, 0, sc / .8, t, () => 'attached', () => ({ frame: 0, flip: true }));
      const k = sc / .8, og = ctx.createRadialGradient(-30 * k, 235 * k, 1, -30 * k, 235 * k, 46 * k); og.addColorStop(0, 'rgba(255,190,90,' + (.55 + .25 * Math.sin(t * 3)) + ')'); og.addColorStop(1, 'rgba(255,120,20,0)');
      ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = og; ctx.fillRect(-120 * k, 180 * k, 180 * k, 110 * k);
      ctx.restore();
    }
    // Wheatley, bobbing
    const ws = h / 300 * 1.05, wx = w * .42 + Math.sin(t * .9) * 9 * u, wy = h * .52 + Math.sin(t * 1.7) * 7 * u + (st.speed > .1 ? Math.sin(t * 40) * 2 * u * st.speed : 0);
    ctx.imageSmoothingEnabled = false;
    spr(ctx, 'wheatley', wx, wy, { s: ws, rot: Math.sin(t * 1.3) * .07 + (st.speed > .1 ? Math.sin(t * 31) * .03 : 0) });
    // vignette, flash
    const vg = ctx.createRadialGradient(w / 2, h / 2, h * .35, w / 2, h / 2, Math.max(w, h) * .75); vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,0,0,.6)'); ctx.fillStyle = vg; ctx.fillRect(-30, -30, w + 60, h + 60);
    if (st.flash > 0) { ctx.fillStyle = 'rgba(255,240,220,' + Math.min(1, st.flash) + ')'; ctx.fillRect(-30, -30, w + 60, h + 60); }
    ctx.restore();
  }
  /* keep a canvas sharp at its CSS size */
  function fitCanvas(cv) {
    const dpr = Math.min(window.devicePixelRatio || 1, 2), w = cv.clientWidth, h = cv.clientHeight;
    if (!w || !h) return null;
    const pw = Math.round(w * dpr), ph = Math.round(h * dpr);
    if (cv.width !== pw || cv.height !== ph) { cv.width = pw; cv.height = ph; }
    const ctx = cv.getContext('2d'); ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.imageSmoothingEnabled = false;
    return { ctx, w, h };
  }
  const reduced = () => { try { return window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (_) { return false; } };

  function playIntro(onDone) {
    const rootEl = el('div', 'ap-intro');
    rootEl.innerHTML = '<canvas></canvas><i class="ap-lb top"></i><i class="ap-lb bot"></i><div class="ap-in-floor"><small>FLOOR</small><b>1</b></div>'
      + '<div class="ap-in-title"><small>APERTURE SCIENCE</small><h1>' + 'TEST SUBJECT'.split('').map((c, i) => '<span style="--i:' + i + '">' + (c === ' ' ? '&nbsp;' : c) + '</span>').join('') + '</h1><p>LOOEY &nbsp;VS&nbsp; GLaDOS</p></div><button class="ap-skip" type="button">Skip</button>';
    ($('#app') || document.body).appendChild(rootEl);
    const cv = $('canvas', rootEl), floorEl = $('.ap-in-floor b', rootEl), floorBox = $('.ap-in-floor', rootEl);
    let finished = false, fired = {};
    const done = () => { if (finished) return; finished = true; rootEl.classList.add('out'); setTimeout(() => { rootEl.remove(); }, 800); onDone(); };
    $('.ap-skip', rootEl).onclick = done;
    const keyHandler = e => { if (e.code === 'Escape') { document.removeEventListener('keydown', keyHandler); done(); } };
    document.addEventListener('keydown', keyHandler);
    rootEl.addEventListener('click', e => { if (e.target === rootEl || e.target === cv) done(); });
    let t0 = null, last = null, scroll = 0;
    atlasReady.then(() => {
      const frame = now => {
        if (!rootEl.isConnected) { document.removeEventListener('keydown', keyHandler); return; }
        if (t0 == null) { t0 = now; last = now; }
        const t = (now - t0) / 1000, dt = Math.min(.05, (now - last) / 1000); last = now;
        const f = fitCanvas(cv);
        if (f) {
          // 0.7-3.9 s the car drops, 3.9 it stops hard, 4.5-5.9 she lowers, 5.6 the title
          const run = ease((t - .7) / 1.6) * (1 - ease((t - 3.7) / .8));
          scroll += run * f.h * 3.4 * dt;
          const floorN = t < .7 ? 1 : t > 4.4 ? 300 : 1 + Math.round(299 * ease((t - .7) / 3.7) ** 1.3);
          floorEl.textContent = floorN;
          floorBox.classList.toggle('lock', t > 4.4); floorBox.classList.toggle('gone', t > 6.4);
          if (t > 3.9 && !fired.stop) { fired.stop = true; snd('clank-a', .7, { max: 900 }); snd('boom-a', .45, { max: 1200 }); }
          if (t > 4.5 && !fired.door) { fired.door = true; snd('door', .5, { max: 1400 }); }
          if (t > 5.2 && !fired.open) { fired.open = true; snd('open', .4, { max: 900, rate: .8 }); }
          if (t > .25 && !fired.go) { fired.go = true; rootEl.classList.add('go'); snd('door', .25, { max: 800, rate: .7 }); }
          if (t > 5.6 && !fired.title) { fired.title = true; rootEl.classList.add('title'); snd('warning', .22, { max: 600, rate: .7 }); }
          const flash = t > 3.9 ? Math.max(0, .9 - (t - 3.9) * 2.2) : 0, shake = t > .9 && t < 3.9 ? 2 + run * 3 : t >= 3.9 ? Math.max(0, 16 - (t - 3.9) * 22) : 0;
          drawScene(f.ctx, f.w, f.h, t, { scroll, speed: run, glados: (t - 4.5) / 1.4, flash, shake });
          if (t < .7) { f.ctx.fillStyle = 'rgba(0,0,0,' + (1 - t / .7) + ')'; f.ctx.fillRect(0, 0, f.w, f.h); }
        }
        if (t > 8 && !finished) { done(); return; }
        requestAnimationFrame(frame);
      };
      requestAnimationFrame(frame);
    });
  }

  /* ---------------------------------------------------------------- the menu */
  const CLEAR_TIME = { easy: '7:00', medium: '6:00', hard: '5:00', kaizo: '4:30' };
  function dossier(s) {
    const st = state();
    const root = el('div', 'ap-wrap');
    const owned = Save.owns('Chell'), ready = beatenAny();
    const level = { easy: 1, medium: 2, hard: 3, kaizo: 4 };
    const locked = k => k === 'kaizo' && !globeAll();
    const diffBtn = k => '<button type="button" class="ap-diff ' + k + (st.diff === k ? ' on' : '') + (locked(k) ? ' locked' : '') + '" data-diff="' + k + '"><b>' + DIFFS[k].label + '</b><span class="pips">' + [1, 2, 3, 4].map(n => '<i' + (n <= level[k] ? ' class="lit"' : '') + '></i>').join('') + '</span><small>' + CLEAR_TIME[k] + '</small>' + (st.beaten[k] ? '<em>' + (st.best[k] || '\u2714') + '</em>' : '') + '</button>';
    root.innerHTML = '<header class="ap-hero"><canvas class="ap-scene"></canvas><button class="ap-back" type="button" aria-label="Back">\u2039</button><button class="ap-replay" type="button">\u25b6 Intro</button>'
      + '<div class="ap-title"><small>APERTURE SCIENCE</small><h2><span>Test</span><span>Subject</span></h2><p>Looey vs GLaDOS</p></div></header>'
      + '<div class="ap-grid"><section class="ap-panel ap-modes"><h3>Difficulty</h3><div class="ap-diffs">' + ['easy', 'medium', 'hard', 'kaizo'].map(diffBtn).join('') + '</div>'
      + '<div class="ap-actions"><button class="ap-go" type="button"><span>' + (st.read ? 'Start test' : 'Begin') + '</span></button>' + (st.read ? '<button class="ap-alt" type="button" data-a="story">Story</button>' : '') + (st.credits ? '<button class="ap-alt" type="button" data-a="credits">Credits</button>' : '') + '</div></section>'
      + '<section class="ap-panel ap-prog"><h3>Cores</h3><div class="ap-eyes">' + [0, 1, 2, 3].map(c => '<i class="ap-eye' + (ready ? ' lit' : '') + '" data-c="' + c + '"></i>').join('') + '</div>'
      + '<div class="ap-clears">' + ['easy', 'medium', 'hard', 'kaizo'].map(k => '<span class="' + (st.beaten[k] ? 'ok' : '') + '">' + DIFFS[k].label + '</span>').join('') + '</div><p class="ap-meta">' + (st.tries ? st.tries + ' attempt' + (st.tries === 1 ? '' : 's') : 'No attempts yet') + '</p></section>'
      + '<section class="ap-panel ap-reward"><img src="' + asset('chell/icon.png') + '" alt=""><div><small>REWARD</small><b>Chell</b><span>' + (owned ? 'On your roster' : st.license ? 'License ready at Dyle\'s shop' : 'Clear the test for the license') + '</span><em class="ap-shards">Shards per clear: ' + ['easy', 'medium', 'hard', 'kaizo'].map(k => DIFFS[k].label + ' ' + clearShards(k)).join(' \u00b7 ') + '</em></div></section></div>';
    s.appendChild(root);
    $('.ap-back', root).onclick = () => { Screens._raidDossier = null; Screens.go('raid'); try { Music.screen(Screens.cur); } catch (_) { /* optional */ } };
    $$('.ap-diff', root).forEach(b => b.onclick = () => { if (locked(b.dataset.diff)) { UI.toast('Kaizo needs all 9 Bosker\'s Globe toons (' + globeCount() + '/9).'); return; } st.diff = b.dataset.diff; Save.write(); $$('.ap-diff', root).forEach(n => n.classList.toggle('on', n === b)); snd('open', .12, { max: 300, rate: 1.6 }); });
    $('.ap-go', root).onclick = () => startFlow(locked(st.diff) ? 'hard' : st.diff, !st.read);
    $$('.ap-alt', root).forEach(b => b.onclick = () => {
      if (b.dataset.a === 'story') playChapters(STORY, fin => sceneThen());
      else playCredits(() => sceneThen());
    });
    // the banner is the intro's last frame, kept alive
    const cv = $('.ap-scene', root);
    atlasReady.then(() => {
      $$('.ap-eye', root).forEach(i => {
        const fr = atlas.frames && atlas.frames['eye-' + i.dataset.c + '-0']; if (!fr) return;
        const k = 1.7; i.style.width = fr.w * k + 'px'; i.style.height = fr.h * k + 'px'; i.style.backgroundImage = 'url(' + asset('atlas.png') + ')';
        i.style.backgroundSize = atlas.img.naturalWidth * k + 'px ' + atlas.img.naturalHeight * k + 'px'; i.style.backgroundPosition = '-' + fr.x * k + 'px -' + fr.y * k + 'px';
      });
      let t0 = null;
      const frame = now => {
        if (!root.isConnected) return;
        if (t0 == null) t0 = now;
        const t = (now - t0) / 1000 + 30, f = fitCanvas(cv);
        if (f) drawScene(f.ctx, f.w, f.h, t, { scroll: t * f.h * .06, speed: .06, glados: 1, flash: 0, shake: 0 });
        requestAnimationFrame(frame);
      };
      requestAnimationFrame(frame);
    });
    const run = () => { root.classList.add('go'); };
    let seen = false; try { seen = !!sessionStorage.getItem('apIntro'); } catch (_) { /* private window */ }
    if (seen || reduced()) run();
    else { try { sessionStorage.setItem('apIntro', '1'); } catch (_) { /* optional */ } playIntro(run); }
    $('.ap-replay', root).onclick = () => { root.classList.remove('go'); playIntro(run); };
  }

  /* ---- hooks into the rest of the game */
  {
    const weekly = weeklyEvents;
    weeklyEvents = function (week) {
      return [{ id: ID, label: TITLE, kind: 'aperture', isAperture: true, bossIds: [], featuredIds: ['Looey'], tag: 'STORY · BOSS', minMastery: 1, stageLevels: [1], rewardMult: 1,
        title: TITLE, blurb: 'GLaDOS is back.' }, ...weekly.call(this, week)];
    };
  }
  {
    const raid = Screens.raid;
    Screens.raid = function (s) {
      const result = raid.apply(this, arguments);
      const old = [...s.querySelectorAll('.eb')].find(b => b.querySelector('.eb-title') && b.querySelector('.eb-title').textContent === TITLE);
      if (old) {
        const st = state();
        const card = this.ebCard({
          kind: 'Story', accent: '#ff9a2e', title: TITLE, sub: 'Looey vs GLaDOS',
          art: [asset('wheatley.png'), asset('glados.png')],
          status: beatenAny() ? 'Cleared' : st.read ? 'The test' : 'New', tone: beatenAny() ? 'done' : 'ready', progress: beatenAny() ? 1 : st.read ? .5 : 0, cls: 'ap-event-card'
        });
        card.onclick = () => { Screens._raidDossier = ID; Screens.render(); };
        old.replaceWith(card);
      }
      return result;
    };
    const dossierFn = Screens.raidDossier;
    Screens.raidDossier = function (s, ev) { if (ev && ev.isAperture) { dossier(s); return; } return dossierFn.apply(this, arguments); };
  }
  if (typeof DyleShop !== 'undefined' && DyleShop.renderSkins) {
    const renderSkins = DyleShop.renderSkins;
    DyleShop.renderSkins = function (contents) {
      renderSkins.apply(this, arguments);
      const wrap = el('section', 'ap-shelf');
      const owned = Save.owns('Chell'), ready = beatenAny();
      const lic = state().license, afford = Save.can({ gold: CHELL_PRICE });
      wrap.innerHTML = `<img src="${asset('chell/icon.png')}" alt="Chell"><div><small>APERTURE SCIENCE</small><b>Chell</b><p>${owned ? 'On your roster.' : lic ? 'License ready. Comes with shards for 3 stars (' + shardsToThree() + ').' : 'Clear the test to get the license.'}</p><button type="button" class="ap-buy" ${owned || !lic || !afford ? 'disabled' : ''}>${owned ? 'Owned' : lic ? 'Buy \u00b7 ' + CHELL_PRICE.toLocaleString() + ' gold' : 'Locked'}</button></div>`;
      $('.ap-buy', wrap).onclick = () => { const n = recruitChell(); if (n) { UI.toast('Chell joined with ' + n + ' shards.'); Screens.render(); } };
      contents.appendChild(wrap);
    };
  }

  window.Aperture = { ID, DIFFS, state, playIntro, playFight, playCredits, playChapters, STORY, recruitChell };
})();
