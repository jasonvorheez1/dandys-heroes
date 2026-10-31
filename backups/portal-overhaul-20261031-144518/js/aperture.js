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
    s.diff = ['easy', 'medium', 'hard'].includes(s.diff) ? s.diff : 'medium';
    return s;
  };
  const beatenAny = () => Object.values(state().beaten).some(Boolean);

  const DIFFS = {
    easy:   { label: 'Easy',   note: 'Slow rockets, weak bolts, a seven minute countdown.' },
    medium: { label: 'Medium', note: 'Faster rockets, six minutes on the clock.' },
    hard:   { label: 'Hard',   note: 'Full-speed rockets, stronger bolts, five minutes, less health.' }
  };

  /* ---------------------------------------------------------------- audio */
  const SFX = { index: null, buffer: null, urls: {} };
  const sfxReady = fetch(asset('sfx/index.json')).then(r => r.json()).then(i => { SFX.index = i; return fetch(asset('sfx/aperture-sfx.bin')); })
    .then(r => r.arrayBuffer()).then(b => { SFX.buffer = b; }).catch(() => { /* the event still works without the voice pack */ });
  function snd(name, vol = .6, o = {}) {
    try {
      if (Sound.on === false || !SFX.buffer || !SFX.index || !SFX.index[name]) return;
      const [at, len, secs] = SFX.index[name];
      const url = SFX.urls[name] || (SFX.urls[name] = window.URL.createObjectURL(new Blob([SFX.buffer.slice(at, at + len)], { type: 'audio/ogg' })));
      const a = new Audio(url);
      a.volume = clamp(vol * (typeof Sound.vol === 'number' ? Sound.vol : 1), 0, 1);
      if (o.rate) a.playbackRate = o.rate;
      a.play().catch(() => {});
      const max = o.max || Math.min(secs, 6) * 1000;
      setTimeout(() => { try { a.pause(); } catch (_) { /* gone */ } }, max + 200);
    } catch (_) { /* audio is decoration */ }
  }
  if (typeof MUSIC_TRACKS !== 'undefined') {
    MUSIC_TRACKS.apStory = ASSET + BASE + 'music/self-esteem-fund.mp3';
    MUSIC_TRACKS.apFight = ASSET + BASE + 'music/some-assembly-required.mp3';
    MUSIC_TRACKS.apCalm = ASSET + BASE + 'music/future-starts-with-you.mp3';
    MUSIC_TRACKS.apCredits = ASSET + BASE + 'music/still-alive.mp3';
  }
  const playMusic = key => { try { Music.play(key); } catch (_) { /* optional */ } };

  /* ---------------------------------------------------------------- sprites */
  const atlas = { img: new Image(), frames: null };
  const atlasReady = Promise.all([
    fetch(asset('atlas.json')).then(r => r.json()).then(j => { atlas.frames = j.frames; }).catch(() => {}),
    new Promise(res => { atlas.img.onload = atlas.img.onerror = res; atlas.img.src = asset('atlas.png'); })
  ]);
  /* draw an atlas frame. o: ax, ay (anchor 0..1), s (scale), flip, rot, alpha */
  function spr(ctx, name, x, y, o = {}) {
    const f = atlas.frames && atlas.frames[name];
    if (!f) return null;
    const s = o.s || 1, w = f.w * s, h = f.h * s;
    ctx.save();
    ctx.translate(x, y);
    if (o.rot) ctx.rotate(o.rot);
    if (o.flip) ctx.scale(-1, 1);
    if (o.alpha != null) ctx.globalAlpha = o.alpha;
    ctx.drawImage(atlas.img, f.x, f.y, f.w, f.h, -w * (o.ax == null ? .5 : o.ax), -h * (o.ay == null ? .5 : o.ay), w, h);
    ctx.restore();
    return { w, h };
  }
  const PORTRAITS = { Wheatley: BASE + 'wheatley.png', GLaDOS: BASE + 'glados.png' };

  /* ---------------------------------------------------------------- story */
  const scene = (title, place, script) => ({ title, place, script: script.trim(), time: 'AFTER HOURS', date: 'GARDENVIEW' });
  const STORY = [
    scene('Quiet Hours', 'Gardenview Educational Center', `
@bg assets/uploads/backgroundlobby1.webp
@music apStory
> Gardenview Educational Center, after hours. The hallway lights hum a half-step flat, and nobody has fixed it in years.
@enter Looey center
Looey: Boing. Boing. Boing. Okay. Quiet hallway. Nobody here. Good.
> Looey bounces down the corridor, one careful bounce at a time. The floor is polished, and polished floors squeak.
Looey: Sorry, floor.
> Somewhere ahead a vending machine clunks. A single mint drops into the tray. Nobody pressed anything.
Looey: That wasn't me.
> The wrapper has a small orange stamp on it. A circle with a slice taken out.
Looey: Huh.
> It is very quiet for a while. Then, above the water fountain, a vent rattles. Once. Twice. Then something very small starts to cry.
Looey [!]: Hello? Is somebody in the vent?
@exitall`),

    scene('The Thing in the Vent', 'Gardenview Educational Center', `
@bg assets/uploads/backgroundlobby1.webp
@enter Looey right
> The vent cover pops off and a round, battered shape drops into the fountain with a clang. It has one big blue eye and two handles, and it does not stop talking.
@enter Wheatley left
Wheatley: Oh! Oh, thank goodness, a person. A rubber person. A person-adjacent. Sorry. Hello. Hi.
Looey: Hi?
Wheatley: I've been in that vent for, what, four hours? Three days? There's no clock in a vent. Nobody tells you that.
Looey: You're a... ball.
Wheatley: Core. Personality core. It's a whole distinction. Listen. Listen. Don't panic. Actually, panic a little. I've been panicking quite a lot and it's helping.
Looey: What's going on?
Wheatley: She's back. Her. The big one, with the, the tone of voice. Somebody put her back together.
Looey: Who?
Wheatley: No idea! Somebody tidy. There was a clipboard down there. Tiny, careful handwriting. A "D", a dot, a "K", a dot. Probably nothing. Probably a sandwich order.
Looey: Down where?
Wheatley: Down. Below the basement. Below the basement's basement. They've put green tubing in everything, and they've stapled it. Neatly.
> Looey looks at the mint still in one hand. Then at the stamped circle on the wrapper. Then at the corridor behind the fountain, where a service door that was never on any floor plan is standing open.
Looey: ...I'll get my coat.
Wheatley: You can't be serious. Oh. You're serious. Right. Right! Great! I'll come. I'll be brave from just behind you.
@exitall`),

    scene('Down', 'Service Elevator', `
@bg assets/aperture/bg/shaft.png
@music apCalm
> Behind the door there is an elevator with one button and no label. Looey presses it. The doors close with a very polite sound.
@enter Looey right
@enter Wheatley left
> Above the door a counter starts to count.
> Floor 12.
Wheatley: It's fine. It's an elevator. They go down. That's a thing they do.
> Floor 47. Nobody speaks. The lights flicker once and then pretend they didn't.
> Floor 96. A mug sits on the rail by the door. It says WORLD'S OKAYEST RESEARCHER. It is still warm.
Looey: Whose mug is that?
Wheatley: Not mine. I don't have hands. I have handles.
Looey: Somebody was just here.
Wheatley: Let's not think about it. I'm not thinking about it. You shouldn't either. Think about something else. Think about toast.
> Floor 180. The concrete walls turn into white panels, and the white panels turn into grey ones.
> Floor 241. Somewhere far below a machine counts something in a calm, pleasant voice. Neither of them can make out the number.
Looey: Wheatley?
Wheatley: Yes.
Looey: How many floors is this?
Wheatley: Three hundred. Roughly. Give or take a basement.
> Floor 300.
@exitall`),

    scene('Hello Again', 'Test Chamber, Floor 300', `
@bg assets/aperture/bg/ruins.png
@fx dark
> The doors open on a chamber that has been repaired badly and cleaned very thoroughly. Green tubing runs along the new panels, stitched in with neat little staples.
@enter Wheatley left
@enter Looey center
Wheatley: That tubing. That's the same tubing. Looey, I think we should leave now. I think we should have left earlier.
@enter GLaDOS farright
> Overhead, something very large unfolds from the ceiling and turns its single optic toward them. It has four small cores attached to it, like buttons on a coat.
Looey: Um. Hi? We're lost. We were looking for a vent.
Wheatley: Don't wave. If you don't wave she can't, she can't...
> Behind Looey a pedestal rises out of the floor. On it sits a white and grey device with two glowing barrels, one blue and one orange.
Looey: ...Is that for me?
Wheatley: It's always for you. That's the thing about pedestals.
@sfx ui_open
> Looey picks up the device. It hums. It sounds almost pleased. Somewhere in the ceiling a machine clears its throat.
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
  const playFight = (diffKey, onEnd) => window.ApertureFight.play(diffKey, onEnd, { snd, spr, atlasReady, sfxReady, playMusic, asset });

  /* ---------------------------------------------------------------- credits */
  const CREDITS = [
    ['STILL ALIVE', 'a Gardenview test'],
    ['', ''],
    ['TEST SUBJECT', 'Looey'],
    ['PERSONALITY CORE', 'Wheatley'],
    ['FACILITY', 'GLaDOS'],
    ['', ''],
    ['MUGEN GLaDOS', 'fhqwhgads7'],
    ['PEDESTAL BUTTON MODEL', 'ripped by KartMakerBrosU'],
    ['PIXEL SPRITES', 'from the fan fighting-game sprite sheet'],
    ['PORTAL', 'Valve'],
    ['', ''],
    ['DANDY\'S WORLD', 'its toons and its terrible floors'],
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
    const run = () => playFight(diff, ok => {
      const st = state();
      if (ok === null) { sceneThen(() => playMusic('navigation')); return; }
      st.tries++;
      if (ok) {
        const first = !beatenAny();
        st.beaten[diff] = true; Save.write();
        playCredits(() => { sceneThen(); UI.toast(first ? 'Chell is waiting at Dyle\'s shop.' : 'Test complete. Still alive.'); });
      } else { Save.write(); sceneThen(); UI.toast('The test is not over. GLaDOS would like you to try again.'); }
    });
    if (withStory) playChapters(STORY, finished => { if (finished) { state().read = true; Save.write(); run(); } else sceneThen(); });
    else run();
  }

  function recruitChell() {
    if (Save.owns('Chell')) return false;
    Save.data.heroes.Chell = Save.newHero('Chell');
    state().chell = true;
    try { Save.addMasteryXp(260); Achievements.record('heroUnlock', 1); if (UI.queueHeroUnlock) UI.queueHeroUnlock('Chell'); } catch (_) { /* extras only */ }
    Save.write();
    return true;
  }

  function dossier(s) {
    const st = state();
    const root = el('div', 'ap-wrap');
    const diffBtn = k => `<button type="button" class="ap-diff${st.diff === k ? ' on' : ''}" data-diff="${k}"><b>${DIFFS[k].label}</b>${st.beaten[k] ? '<i>✔</i>' : ''}<small>${DIFFS[k].note}</small></button>`;
    root.innerHTML = `<header class="ap-bar-top"><button class="ap-back" type="button" aria-label="Back">‹</button><b>${TITLE}</b></header>
      <section class="ap-card"><img class="ap-sign" src="${asset('wheatley.png')}" alt=""><div><small>STORY EVENT · ONE BOSS</small><h2>${TITLE}</h2>
      <p>Looey finds a very frightened core in a vent. Somebody has rebuilt GLaDOS, 300 floors under Gardenview. Levels do not matter: it is just Looey, a portal device, and the test.</p></div></section>
      <section class="ap-card"><h3>The test</h3><p class="ap-small">Four cores. Break the glass over the spinning button, hit it to open the incinerator, and knock a loose core into the hole. Then it becomes a rocket turret: do not stand still, and send its rockets back through your portals into her to knock the next core off. Beat the clock.</p>
      <div class="ap-diffs">${['easy', 'medium', 'hard'].map(diffBtn).join('')}</div>
      <div class="ap-actions"><button class="ap-go" type="button">${st.read ? 'Begin the test' : 'Start the story'}</button>${st.read ? '<button class="ap-alt" type="button" data-a="story">Replay the story</button>' : ''}${st.credits ? '<button class="ap-alt" type="button" data-a="credits">Watch the credits</button>' : ''}</div></section>
      <section class="ap-card ap-reward"><img src="${asset('chell/icon.png')}" alt=""><div><small>REWARD</small><h3>Chell</h3><p class="ap-small">${Save.owns('Chell') ? 'Chell has joined your roster.' : beatenAny() ? 'Beaten. Dyle\'s shop is selling her now (Skins shelf).' : 'Beat GLaDOS on any difficulty. Dyle will sell you a silent test subject with a portal device.'}</p></div></section>`;
    s.appendChild(root);
    $('.ap-back', root).onclick = () => { Screens._raidDossier = null; Screens.go('raid'); try { Music.screen(Screens.cur); } catch (_) { /* optional */ } };
    $$('.ap-diff', root).forEach(b => b.onclick = () => { st.diff = b.dataset.diff; Save.write(); Screens.render(); });
    $('.ap-go', root).onclick = () => startFlow(st.diff, !st.read);
    $$('.ap-alt', root).forEach(b => b.onclick = () => {
      if (b.dataset.a === 'story') playChapters(STORY, fin => sceneThen());
      else playCredits(() => sceneThen());
    });
  }

  /* ---- hooks into the rest of the game */
  {
    const weekly = weeklyEvents;
    weeklyEvents = function (week) {
      return [{ id: ID, label: TITLE, kind: 'aperture', isAperture: true, bossIds: [], featuredIds: ['Looey'], tag: 'STORY · BOSS', minMastery: 1, stageLevels: [1], rewardMult: 1,
        title: TITLE, blurb: 'A rebuilt GLaDOS, three hundred floors down.' }, ...weekly.call(this, week)];
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
          kind: 'Story · Boss', accent: '#ff9a2e', title: TITLE, sub: 'Looey vs GLaDOS',
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
      wrap.innerHTML = `<img src="${asset('chell/icon.png')}" alt="Chell"><div><small>APERTURE SCIENCE</small><b>Chell</b><p>${owned ? 'On your roster.' : ready ? 'A silent test subject with a handheld portal device. Dyle already wrapped her boots.' : 'Locked. Beat GLaDOS in the Aperture event.'}</p><button type="button" class="ap-buy" ${owned || !ready ? 'disabled' : ''}>${owned ? 'Recruited' : ready ? 'Recruit Chell' : 'Locked'}</button></div>`;
      $('.ap-buy', wrap).onclick = () => { if (recruitChell()) { UI.toast('Chell joined your roster.'); Screens.render(); } };
      contents.appendChild(wrap);
    };
  }

  window.Aperture = { ID, DIFFS, state, playFight, playCredits, playChapters, STORY, recruitChell };
})();
