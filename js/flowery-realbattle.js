/* flowery-realbattle.js - "Flower Kingdom" fights that run on the game's own auto battler (BattleScreen / Battle).
   The event's enemies are defined here with defWeakling, the same way the Ichor Depths' weaklings are, and exist only for
   this event (ids start with "Fl"; nothing adds them to floors, crates or lists). Their art is their Deltarune sprite from
   flowery.bin, upscaled without smoothing. The trio is built with rivalSpec, so it works whether or not they're owned.
   - floradinn: the trio can't hurt Darkners (every hit lands as 1); the fight is stopped on cue and Flowery cuts in.
   - ichorSmall: Gardenview ichor leaking into the castle (segments 5 and 7).
   - ichor: the courtyard, two real waves with Asgore's charge between them.
   - flowery: the boss opens as a real auto battle; Flowery walks over the real HUD, takes the AUTO button and breaks it,
     and the turn-based fight from flowery-battle.js takes over. */
'use strict';

(() => {
  if (typeof defWeakling !== 'function' || typeof BattleScreen === 'undefined') return;   // the preview page has no game behind it
  const P = () => window.FlPack;
  const LV = 60;

  /* ---------------------------------------------------------------- enemies */
  const WKs = (hp, atk, def, mag, mdef, spd) => ({ hp, atk, def, mag, mdef, spd, acc: 140, eva: 110 });
  function flEnemy(o) {
    defWeakling({
      id: o.id, name: o.name, role: 'Damage', element: o.element || 'Flower', scale: o.scale || .62,
      blurb: o.blurb || '',
      base: o.base,
      hidden: { range: o.range || 150, aspd: o.aspd || 1.1, ms: 90, aggro: .8, crit: .06, critDmg: 1.5, healPow: 1, shieldPow: 1,
        cdr: 0, ccRes: o.ccRes || 0, kbRes: .2, armorPen: 0, magPen: 0 },
      move: { gait: 'bounce', bob: 8, freq: 2.2, lean: 5, squash: .1, idle: 'bounce', step: 'bounce',
        particles: o.inked ? 'splash' : 'none', pcol: o.inked ? '#2b1d44' : '#ffd23a', trail: { on: !!o.inked, col: '#2b1d44', rate: .12 }, brake: .4 },
      basic: { name: o.basic || 'Slash', type: 'physical', ratio: 1, range: o.range || 150, sfx: 'swing_light', hit: 'hit_slash', wind: .14, note: '' },
      skills: {
        W: { name: o.wName || 'Petal Storm', type: 'Physical Damage', energy: 100, v: { ratio: .5 }, p: { hits: 3 },
          desc: (S, P) => `Strikes ${P.hits} times for <em>${pcn(S.ratio * 100)}</em> Attack.`,
          cast: (u, B, S, P) => {
            B.anim(u, 'cast', .25); Sound.play('swing_heavy');
            B.repeat(P.hits, .16, () => {
              const foes = B.enemiesOf(u); if (!foes.length) return;
              const t = pick(foes);
              B.damage(u, t, u.st.atk * S.ratio, { type: 'physical', tag: o.wName || 'Petal Storm' });
              B.fxBoom(t.x, t.y - 30, .5, o.inked ? '#3a2a5a' : '#ffd23a');
            });
          } },
        G: { name: o.gName || 'Lunge', type: 'Physical Damage', cd: 6, v: { ratio: .8 }, p: {},
          desc: (S) => `Lunges at the nearest enemy for <em>${pcn(S.ratio * 100)}</em> Attack.`,
          ai: { prio: 48, cond: () => true },
          cast: (u, B, S) => {
            const t = B.nearest(u, B.enemiesOf(u)); if (!t) return;
            B.anim(u, 'cast', .2); B.blink(u, t.x - u.face * 45); Sound.play('hit_slash', { vol: .5 });
            B.damage(u, t, u.st.atk * S.ratio, { type: 'physical', tag: o.gName || 'Lunge' });
          } }
      }
    });
  }
  const ART = {
    FlFloradinn: ['enemy_floradin_0', 'Floradinn'], FlInkFloradinn: ['enemy_floradin_0', 'Inked Floradinn', 1], FlInkKawkaw: ['kawkaw_0', 'Inked Kawkaw', 1],
    FlInkMantis: ['mantis_idle_0', 'Inked Mantis', 1], FlInkBloxer: ['blockguy_overworld_0', 'Inked Bloxer', 1], FlInkConductor: ['floradin_conductor_0', 'Inked Conductor', 1],
    FlFlowery: ['flowery_idle2_0', 'Flowery']
  };
  flEnemy({ id: 'FlFloradinn', name: 'Floradinn', base: WKs(2600, 200, 260, 60, 240, 110), basic: 'Sunflower Sword', wName: 'Perfect Day', gName: 'En Garde', blurb: 'A sunflower knight. Not on your side.' });
  flEnemy({ id: 'FlInkFloradinn', name: 'Inked Floradinn', inked: true, base: WKs(1500, 170, 90, 60, 90, 110), basic: 'Dripping Sword', wName: 'Black Petals' });
  flEnemy({ id: 'FlInkKawkaw', name: 'Inked Kawkaw', inked: true, base: WKs(1700, 185, 95, 60, 95, 120), basic: 'Peck', wName: 'Ink Gust' });
  flEnemy({ id: 'FlInkMantis', name: 'Inked Mantis', inked: true, base: WKs(1900, 200, 100, 60, 100, 115), basic: 'Scythe', wName: 'Black Dance' });
  flEnemy({ id: 'FlInkBloxer', name: 'Inked Bloxer', inked: true, base: WKs(2100, 175, 130, 60, 120, 95), basic: 'Block', wName: 'Stack Crash' });
  flEnemy({ id: 'FlInkConductor', name: 'Inked Conductor', inked: true, scale: .8, base: WKs(4200, 220, 120, 60, 120, 110), basic: 'Baton', wName: 'Crescendo', ccRes: .4 });
  flEnemy({ id: 'FlFlowery', name: 'Flowery', scale: .8, base: WKs(99999, 1, 999, 1, 999, 140), basic: 'Pose', wName: 'Pirouette', gName: 'Hair Flip' });

  const artCache = {};
  function artFor(id) {
    if (artCache[id]) return artCache[id];
    const [frame, , inked] = ART[id];
    let url = P().url(frame, 4);
    if (inked) {   // soak it in Gardenview ichor
      const img = new Image(); img.src = url;
      const c = document.createElement('canvas'), f = P().frames[frame]; c.width = f[7] * 4; c.height = f[8] * 4;
      const x = c.getContext('2d'); x.imageSmoothingEnabled = false;
      P().draw(x, frame, c.width / 2, c.height, { s: 4 });
      x.globalCompositeOperation = 'source-atop'; x.fillStyle = 'rgba(24,0,40,.62)'; x.fillRect(0, 0, c.width, c.height);
      url = c.toDataURL('image/png');
    }
    return (artCache[id] = url);
  }
  function foe(id, level = LV) { const s = makeWeakling(id, level); s.artSrc = artFor(id); s.name = ART[id][1]; return s; }
  const trio = (ids = ['Scraps', 'Ginger', 'Yatta']) => ids.map(id => rivalSpec(id, LV, { buildSeed: 'flowery-' + id }));
  function bgURL(room) {
    const c = document.createElement('canvas'); c.width = 640; c.height = 360;
    const x = c.getContext('2d'); x.imageSmoothingEnabled = false; x.scale(2, 1.5);
    const R = FW.ROOMS[room]; x.fillStyle = '#000'; x.fillRect(0, 0, 320, 240);
    if (R.sky) R.sky(x, { x: 0, y: 0 }, 0);
    if (R.back) { x.save(); x.translate(-(R.bgx || 0), -(R.bgy || 0)); R.back(x, 0); x.restore(); }
    return c.toDataURL('image/png');
  }

  function arenaURL() {   // the vine tower, for the boss's auto-battle opening (the same stage the turn-based half uses)
    if (!window.FlArena) return bgURL('roof');
    const c = document.createElement('canvas'); c.width = 640; c.height = 360;
    const x = c.getContext('2d'); x.imageSmoothingEnabled = false; x.scale(2, 1.5);
    FlArena.bg(x, 0, {});
    return c.toDataURL('image/png');
  }

  /* trio hits on Darkners land as 1 while meta.flWeak is set (the trio isn't from this world) */
  const dmg = Battle.prototype.damage;
  Battle.prototype.damage = function (src, tgt, amount, opt, ...rest) {
    if (this.meta && this.meta.flWeak && src && tgt && src.team === TEAM_P && tgt.team === TEAM_E) amount = Math.min(amount, 1);
    if (this.meta && this.meta.flDodge && src && tgt && src.team === TEAM_P && tgt.team === TEAM_E) { this.floatNum(tgt, -90, 'MISS', 'block'); return null; }
    return dmg.call(this, src, tgt, amount, opt, ...rest);   // (strict mode: changing amount doesn't change arguments)
  };

  /* run one real battle; the event overlay hides while it plays. stopAfter (s) ends it on cue as a scripted win. */
  function fight(S, o) {
    return new Promise(res => {
      if (typeof MUSIC_TRACKS !== 'undefined' && P().music[o.music]) MUSIC_TRACKS[o.music] = P().music[o.music];
      const root = S.root; root.style.display = 'none';
      let stopT = null;
      const done = r => { clearTimeout(stopT); root.style.display = ''; $('#app').hidden = true; res(r); };
      BattleScreen.launch({
        team: o.team || trio(), foes: o.foes, music: o.music, skipResults: !!o.stopAfter,
        meta: Object.assign({ title: o.title, bg: bgURL(o.room) }, o.meta || {}),
        onReady: b => {
          if (o.stopAfter) stopT = setTimeout(() => { if (BattleScreen.active === b && !b.over) b.finish(true, 'scripted'); }, o.stopAfter * 1000);
          if (o.onReady) o.onReady(b);
        },
        onDone: r => done(r)
      });
    });
  }

  FW.BATTLES.floradinn = async S => {
    await fight(S, { title: 'The Garden · Floradinn', room: 'garden', music: 'flBattle', foes: [foe('FlFloradinn'), foe('FlFloradinn')], meta: { flWeak: true }, stopAfter: 13 });
    return 'win';
  };
  FW.BATTLES.ichorSmall = async (S, args) => {
    for (;;) {
      const r = await fight(S, { title: (args && args[0] === 'bath' ? 'The Onsen' : 'The West Wing') + ' · Ichor', room: args && args[0] === 'bath' ? 'onsen' : 'hall', music: 'flBattle',
        foes: [makeWeakling('Ichordrop', LV), makeWeakling('Ichordrop', LV), args && args[0] === 'bath' ? makeWeakling('Sponge', LV) : makeWeakling('Ball', LV)] });
      if (r.win) return 'win';
      if (r.quit) return 'quit';
    }
  };
  // the courtyard, in two fights with Asgore's charge between them (segment 8 stages the charge in the room)
  FW.BATTLES.ichor1 = async S => {
    for (;;) {
      const r = await fight(S, { title: 'The Courtyard · Ichor', room: 'courtyard', music: 'flBattle', foes: [foe('FlInkFloradinn'), foe('FlInkKawkaw'), makeWeakling('Ichordrop', LV)] });
      if (r.quit) return 'quit';
      if (r.win) return 'win';
    }
  };
  FW.BATTLES.ichor2 = async S => {
    for (;;) {
      const r = await fight(S, { title: 'The Courtyard · With Asgore', room: 'courtyard', music: 'flAsgore', foes: [foe('FlInkConductor'), foe('FlInkMantis'), foe('FlInkBloxer')] });
      if (r.quit) return 'quit';
      if (r.win) return 'win';
    }
  };
  FW.BATTLES.ichor = async S => {
    for (;;) {
      const r1 = await fight(S, { title: 'The Courtyard · Wave 1', room: 'courtyard', music: 'flBattle', foes: [foe('FlInkFloradinn'), foe('FlInkKawkaw'), makeWeakling('Ichordrop', LV)] });
      if (r1.quit) return 'quit';
      if (!r1.win) continue;
      await FW.CUTS.asgoreCharge(S);
      const r2 = await fight(S, { title: 'The Courtyard · Wave 2', room: 'courtyard', music: 'flBattle', foes: [foe('FlInkConductor'), foe('FlInkMantis'), foe('FlInkBloxer')] });
      if (r2.quit) return 'quit';
      if (r2.win) return 'win';
    }
  };

  /* the boss: a real auto battle Flowery dodges, then he takes the AUTO button off the real HUD */
  const jrpg = FW.BATTLES.flowery;
  FW.BATTLES.flowery = async (S, args) => {
    const root = S.root;
    let battle = null;
    await new Promise(res => {
      if (typeof MUSIC_TRACKS !== 'undefined' && P().music.flBoss) MUSIC_TRACKS.flBoss = P().music.flBoss;
      root.style.display = 'none';
      BattleScreen.launch({
        team: trio(), foes: [foe('FlFlowery')], music: 'flBoss', skipResults: true,
        meta: { title: 'Top of Castle · Flowery', bg: arenaURL(), flDodge: true },
        onReady: b => { battle = b; setTimeout(res, 9000); },
        onDone: () => {}
      });
    });
    // the fourth wall, over the real battle
    battle.paused = true;
    root.style.display = ''; root.classList.add('fk-ghost');
    FW.voiceLine(null, 'sanfrandisco', '');
    await FW.say('Flowery', 'flat', 'Hold on. Hold on, hold on.');
    await FW.say('Flowery', 'side', 'You\'re not pressing anything. Are you?');
    await FW.say('Flowery', 'squint', 'This little button. "AUTO." | They swing, I dodge, and you just watch.');
    await FW.say('Flowery', 'serious', 'I spent twenty years in a pot being watched, Princesses. | I know what watching looks like.');
    await FW.say('Flowery', 'snarl', 'Up here, you look me in the eye. And you CHOOSE.');
    FW.hideBox();
    // he walks to the real button and takes it
    const btn = document.getElementById('btnAuto'), box = btn.getBoundingClientRect();
    const fl = document.createElement('img'); fl.className = 'fk-walker';
    const frames = [0, 1, 2, 3].map(i => P().url('flowery_walk_right_jacket_' + i, 4));
    fl.src = frames[0]; document.body.appendChild(fl);
    const start = { x: window.innerWidth * .62, y: window.innerHeight * .62 }, end = { x: box.left - 40, y: box.bottom + 70 };
    await new Promise(r => {
      const t0 = performance.now();
      const step = now => { const k = Math.min(1, (now - t0) / 1600); fl.src = frames[Math.floor(now / 110) % 4];
        fl.style.left = (start.x + (end.x - start.x) * k) + 'px'; fl.style.top = (start.y + (end.y - start.y) * k) + 'px';
        if (k < 1) requestAnimationFrame(step); else r(); };
      requestAnimationFrame(step);
    });
    fl.src = P().url('flowery_gestureup_right_0', 4); FW.sfx('grab', { vol: .6 });
    btn.classList.add('fk-auto-taken');
    await FW.say('Flowery', 'grin', 'Mine now.');
    FW.voiceLine(null, 'for_the_fans', '');
    await new Promise(r => setTimeout(r, 700));
    btn.classList.add('fk-auto-snap'); FW.sfx('break2', { vol: .9 }); document.getElementById('battle').classList.add('fk-shake');
    S.fx.glitch = .8;
    await new Promise(r => setTimeout(r, 900));
    fl.remove(); btn.classList.remove('fk-auto-taken', 'fk-auto-snap'); document.getElementById('battle').classList.remove('fk-shake');
    battle.paused = false; battle.finish(true, 'scripted');
    await new Promise(r => { const iv = setInterval(() => { if (!BattleScreen.active) { clearInterval(iv); r(); } }, 100); });
    root.classList.remove('fk-ghost'); $('#app').hidden = true;
    return jrpg(S, Object.assign([], args || [], { skipIntro: true }));
  };
})();
