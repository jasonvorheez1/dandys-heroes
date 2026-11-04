/* flowery-storyboss.js - The "Flower Kingdom" climax boss battle on the Main Story turn-based engine.
   Features a live 60fps pixel-art stage canvas, live frame-by-frame animation for Flowery (normal & composite Omega Flowery)
   and all six petal friends (Seth, Aqua, Green, Orange, Blue, Yellow), Studio Trigger anime cut-ins, canvas VFX choreography,
   and Flowery's signature multi-hit Jarona Combo using his full suite of Jarona voice lines. */
'use strict';

(() => {
  if (typeof StoryBattleUI === 'undefined' || typeof StoryBattle === 'undefined' || typeof ST_ENEMIES === 'undefined') return;
  const P = () => window.FlPack;
  const wait = ms => new Promise(r => setTimeout(r, ms));

  /* ---------------------------------------------------------------- Ginger and Yatta (story kits, this event only) */
  if (!ST_TOONS.Ginger) ST_TOONS.Ginger = {
    kind: 'toon', name: 'Ginger', full: 'Ginger', toon: 'Ginger', role: 'Baker', color: '#ff9db0', accent: '#b8536b',
    blurb: 'A gingerbread girl who only comes out at Christmas, and patches everybody up when she does.',
    basicName: 'Candy Cane Tap', basicKind: 'mag', improvised: 'Candy Cane Tap',
    base: { hp: 102, fp: 32, atk: 7, mag: 13.5, def: 9.5, mdef: 12.5, spd: 12.2, luck: 8 },
    grow: { hp: 11.6, fp: 2.0, atk: .7, mag: 1.5, def: 1.05, mdef: 1.3, spd: .2, luck: .24 },
    passive: { name: 'Last Bite', desc: 'Once a fight, the first ally to drop below 25% HP gets 20% back.' },
    skills: [
      { id: 'icing', name: 'Icing Patch', fp: 7, unlock: 'badge', target: 'ally', kind: 'heal', desc: 'Restore 30% HP to one ally and wash off their ailments.', fx: { heal: { pct: .3, mag: .4 }, cleanse: 'ally' } },
      { id: 'coat', name: 'Frosting Coat', fp: 9, unlock: 'badge', target: 'ally', kind: 'buff', desc: 'A Shield worth 30% of the ally’s Max HP for 3 turns. A shield takes a lethal hit for them.', fx: { shield: { who: 'ally', pct: .3, of: 'target', turns: 3 } } },
      { id: 'crumb', name: 'Crumb Toss', fp: 6, unlock: 'badge', target: 'enemy', kind: 'mag', stagger: 1.4, desc: 'Magic damage that lowers the target’s Attack for 3 turns.', fx: { dmg: 'mag', power: 1.0, foe: [['atkDown', 3]] } },
      { id: 'batch', name: 'Fresh Batch', fp: 15, unlock: 'badge', target: 'allies', kind: 'heal', desc: 'Restore 22% HP to the whole party and give them Regen for 3 turns.', fx: { heal: { pct: .22 }, team: [['regen', 3, 1, { v: .06 }]] } }
    ],
    bond: { name: 'Christmas Morning', toonLine: 'Ginger hands everyone a present!', desc: 'Revive every fallen ally at 40% HP, heal the party 30% and cleanse them.', fx: { revive: .4, heal: { pct: .3 }, cleanse: 'team' } }
  };
  if (!ST_TOONS.Yatta) ST_TOONS.Yatta = {
    kind: 'toon', name: 'Yatta', full: 'Yatta', toon: 'Yatta', role: 'Bruiser', color: '#ffe95c', accent: '#c9a227',
    blurb: 'A piñata who treats every fight like the best party she has ever been to. It is very loud.',
    basicName: 'Party Popper', basicKind: 'phys', improvised: 'Party Popper',
    base: { hp: 96, fp: 26, atk: 15, mag: 8, def: 8, mdef: 8, spd: 14.6, luck: 11 },
    grow: { hp: 10.8, fp: 1.8, atk: 1.65, mag: .8, def: .9, mdef: .9, spd: .25, luck: .3 },
    passive: { name: 'Celebration', desc: 'Crits fill her Bond twice as fast.' },
    skills: [
      { id: 'horn', name: 'Party Horn', fp: 8, unlock: 'badge', target: 'enemy', kind: 'phys', stagger: 2.4, desc: 'A blast right in the face. Interrupts a charging attack and pushes the target back.', fx: { dmg: 'phys', power: .9, interrupt: true, push: .4 } },
      { id: 'confetti', name: 'Confetti Cannon', fp: 10, unlock: 'badge', target: 'enemies', kind: 'phys', stagger: .9, desc: 'Two blasts of confetti on every enemy.', fx: { dmg: 'phys', all: true, hits: 2, power: .5 } },
      { id: 'pinata', name: 'Piñata Party', fp: 12, unlock: 'badge', target: 'enemies', kind: 'phys', stagger: .7, desc: 'Five candy strikes on random enemies.', fx: { dmg: 'phys', random: true, hits: 5, power: .5 } },
      { id: 'hype', name: 'Hype Up', fp: 13, unlock: 'badge', target: 'allies', kind: 'buff', desc: 'Attack up for the whole party for 3 turns, and Haste for 2.', fx: { team: [['atkUp', 3], ['haste', 2]] } }
    ],
    bond: { name: 'YATTA!!!', toonLine: 'Yatta throws the biggest party in the kingdom!', desc: 'Three strikes on every enemy and Haste for the whole party.', stagger: 2, fx: { dmg: 'phys', all: true, hits: 3, power: .75, team: [['haste', 2]] } }
  };

  /* ---------------------------------------------------------------- Enemy Definitions */
  const FRIEND = (o) => Object.assign({ stagger: 22, exp: 4, flFriend: true }, o);
  Object.assign(ST_ENEMIES, {
    flFloradinn: {
      name: 'Floradinn', art: 'f:enemy_floradin_flipped_0', hp: 130, atk: 11, mag: 7, def: 12, mdef: 8, spd: 10, stagger: 14, exp: 2,
      moves: [{ name: 'Sunflower Sword', kind: 'phys', power: 1.0, w: 3 }, { name: 'En Garde', kind: 'selfbuff', buff: 'defUp', w: 1 }]
    },
    flSeth: FRIEND({
      name: 'Seth', art: 'f:seth_idle_0', hp: 185, atk: 9, mag: 14, def: 10, mdef: 13, spd: 10.5,
      moves: [
        { name: 'Book Toss', kind: 'mag', power: 1.0, w: 3 },
        { name: 'List of Weaknesses', kind: 'mag', power: .45, target: 'all', debuff: 'defDown', w: 2, cd: 3 },
        { name: 'Adjust Glasses', kind: 'selfbuff', buff: 'defUp', w: 1, cd: 3 }
      ]
    }),
    flAqua: FRIEND({
      name: 'Aqua', art: 'f:aqua_centered_0', hp: 175, atk: 14, mag: 8, def: 9, mdef: 9, spd: 13,
      moves: [
        { name: 'Knife Spin', kind: 'phys', power: .52, hits: 3, target: 'random', w: 3 },
        { name: 'Uuu!', kind: 'allyheal', power: .2, w: 1, cd: 3 }
      ]
    }),
    flGreen: FRIEND({
      name: 'Green', art: 'f:enemy_green_witharmandpan_0', hp: 245, atk: 12, mag: 10, def: 14, mdef: 11, spd: 9,
      moves: [
        { name: 'Pan Smack', kind: 'phys', power: 1.15, w: 3 },
        { name: 'Today’s Special', kind: 'allyheal', power: .24, w: 2, cd: 3 }
      ]
    }),
    flOrange: FRIEND({
      name: 'Orange', art: 'f:orange_proud_left2_0', hp: 165, atk: 15, mag: 6, def: 8, mdef: 8, spd: 14,
      moves: [
        { name: 'Anime Punch', kind: 'phys', power: 1.28, w: 3 },
        { name: 'I’m Telling!', kind: 'selfbuff', buff: 'atkUp', w: 1, cd: 3 }
      ]
    }),
    flBlue: FRIEND({
      name: 'Blue', art: 'f:blue_poses_0', hp: 195, atk: 9, mag: 14, def: 10, mdef: 13, spd: 12,
      moves: [
        { name: 'Butterfly Waltz', kind: 'mag', power: .58, target: 'all', slow: .4, w: 3 },
        { name: 'Messengers of Love', kind: 'allybuff', buff: 'defUp', w: 1, cd: 3 }
      ]
    }),
    flYellow: FRIEND({
      name: 'Yellow', art: 'f:yellow_cool_stance_0', hp: 215, atk: 15, mag: 8, def: 12, mdef: 10, spd: 11,
      moves: [
        { name: 'Hat Toss', kind: 'phys', power: .88, w: 2 },
        { name: 'Punishment Gun', kind: 'phys', power: 1.5, lethal: true, tele: 'Yellow cocks the Punishment Gun. "Hold it right there, varmint."', w: 2, cd: 3 }
      ]
    }),

    // Story Climax Boss (3 Grand Phases: Stage of Seven Suns -> Petals Combine -> Omega Flowery)
    flFlowery: {
      name: 'Flowery', art: 'f:flowery_idle3_0', hp: 540, atk: 13, mag: 13, def: 14, mdef: 14, spd: 13, stagger: 48, exp: 24, boss: true, flBars: 3,
      moves: [
        { name: 'Flash Kick', kind: 'flKick', power: 1.15, w: 3 },
        { name: 'Bouquet Toss', kind: 'flBouquet', power: .55, hits: 3, target: 'random', w: 3 },
        { name: 'Teeth Shine', kind: 'flShine', power: .48, target: 'all', debuff: 'atkDown', w: 2, cd: 3 },
        { name: 'Pirouette', kind: 'flPirouette', buff: 'shield', w: 1, cd: 4 },
        { name: 'Jarona Combo', kind: 'flJarona', power: 1.38, tele: 'Flowery winds up his fist with a golden gleam! "Heh... Ready for MY JARONA?!"', w: 4, cd: 2 },
        { name: 'Prismatic Petal Storm', kind: 'flPetalStorm', power: .58, target: 'all', hits: 2, w: 2, cd: 3 },
        { name: 'Rainbow Prism Beam', kind: 'flPrismBeam', power: 1.28, tele: 'Seven-colored light converges above the sanctuary roof!', w: 2, cd: 4 },
        { name: 'Last Jarona', kind: 'flLastJarona', power: 1.65, lethal: true, tele: 'Omega Flowery draws back all six petals! "THIS IS MY LAST... JARONA!!"', w: 2, cd: 4 },
        { name: 'Pause', kind: 'flPause', heal: .05, w: 1, cd: 6 }
      ],
      flPhases: {
        1: [{ at: .55, text: '"Still standing, cartoons?! Floradinn—show \'em our choreography!"', summon: ['flFloradinn'] }],
        2: [{ at: .55, text: '"Green! Orange! Don\'t just stand there—cover the flanks!"', summon: ['flGreen', 'flOrange'] }],
        3: [
          { at: .65, text: 'The sky above the Sanctuary tears open with seven-colored light!', buff: 'atkUp' },
          { at: .30, text: '"I won\'t let you wake the Big Guy up! His one good day isn\'t over yet!"', buff: 'haste' }
        ]
      }
    },

    // Hard Mode Rematch: Flowery pulls out every fourth-wall trick and full anime combo
    flFloweryHard: {
      name: 'Flowery', art: 'f:flowery_idle3_0', hp: 780, atk: 14, mag: 14, def: 15, mdef: 15, spd: 13.5, stagger: 56, exp: 60, boss: true, flBars: 3,
      moves: [
        { name: 'Flash Kick', kind: 'flKick', power: 1.35, w: 2 },
        { name: 'Bouquet Toss', kind: 'flBouquet', power: .62, hits: 3, target: 'random', ink: .2, w: 2 },
        { name: 'Teeth Shine', kind: 'flShine', power: .55, target: 'all', debuff: 'atkDown', w: 2, cd: 3 },
        { name: 'Pirouette', kind: 'flPirouette', buff: 'shield', w: 1, cd: 4 },
        { name: 'Jarona Combo', kind: 'flJarona', power: 1.62, tele: 'Flowery winds up his fist and locks onto you! "Heh... It\'s MY JARONA!"', w: 4, cd: 2 },
        { name: 'Last Jarona', kind: 'flLastJarona', power: 1.9, lethal: true, tele: 'Omega Flowery charges his radiant fist! "THIS IS MY LAST... JARONA!"', w: 2, cd: 4 },
        { name: 'Prismatic Petal Storm', kind: 'flPetalStorm', power: .8, target: 'all', w: 2, cd: 4 },
        { name: 'Rainbow Prism Beam', kind: 'flPrismBeam', power: 1.5, tele: 'Seven-colored light tears through the sky!', w: 2, cd: 4 },
        { name: 'Skip the Line', kind: 'flSkip', power: 1.25, w: 3, cd: 3 },
        { name: 'Five-Finger Bouquet', kind: 'flSteal', w: 3, cd: 3 },
        { name: 'Number Edit', kind: 'flEdit', w: 3, cd: 4 },
        { name: 'Trade You', kind: 'flSwap', w: 2, cd: 5 },
        { name: 'Intermission', kind: 'flMute', w: 2, cd: 4 },
        { name: 'Pause', kind: 'flPause', heal: .1, w: 2, cd: 5 },
        { name: 'All According to Plant', kind: 'summon', summon: 'flFloradinn', w: 2, cd: 4 }
      ],
      flPhases: {
        1: [{ at: .5, text: '"Floradinns! Front and center!"', summon: ['flFloradinn', 'flFloradinn'] }],
        2: [{ at: .5, text: 'Green and Orange climb up onto the roof. Orange is shaking. He climbs anyway.', summon: ['flGreen', 'flOrange'] }],
        3: [{ at: .5, text: 'Flowery stops smiling.', buff: 'defUp' }, { at: .2, text: '"Not yet. I said NOT YET."', heal: .1 }]
      }
    }
  });

  /* ---------------------------------------------------------------- Engine Rules (when B.fl is set) */
  const SP = StoryBattle.prototype;
  const kill0 = SP.kill, hit0 = SP.hit, enemyAct0 = SP.enemyAct, breakFoe0 = SP.breakFoe, checkPhases0 = SP.checkPhases, endTurn0 = SP.endTurn;
  const isFl = u => u && u.side === 'e' && u.def && (u.key === 'flFlowery' || u.key === 'flFloweryHard');

  SP.kill = function (u, ev) {
    if (this.fl && isFl(u) && u.def.flBars && (u.flBar || 1) < u.def.flBars) {
      u.flBar = (u.flBar || 1) + 1;
      u.hp = u.max.hp; u.st = {}; u.tele = null; u.flEdit = 0;
      if (u.stagger) { u.stagger.cur = 0; u.stagger.broken = 0; }
      ev.push({ t: 'fl', k: 'fakeWin', target: u.uid, bar: u.flBar, mode: this.fl });
      if (this.fl === 'easy') {
        if (u.flBar === 2) {
          ev.push({ t: 'fl', k: 'cut', cut: 'phase2' });
          ev.push({ t: 'fl', k: 'line', actor: u.uid, clip: 'powers_combined', face: 'face_flowery_27',
            text: 'Did you really think the show was over in one act?! With our powers combined—PETALS, WITH ME!' });
          this.apply(u, u, 'atkUp', 4, null, ev);
          this.summon(u, 'flSeth', ev);
          this.summon(u, 'flAqua', ev);
        } else {
          ev.push({ t: 'fl', k: 'cut', cut: 'omega' });
          ev.push({ t: 'fl', k: 'line', actor: u.uid, clip: 'omega', face: 'face_flowery_33',
            text: 'If you step through that door, the Big Guy wakes up alone! PETALS, LEND ME YOUR POWER—OMEGA FLOWERY!!' });
          ev.push({ t: 'fl', k: 'omegaTransform', actor: u.uid });
          this.apply(u, u, 'haste', 4, null, ev);
          this.summon(u, 'flYellow', ev);
          this.summon(u, 'flBlue', ev);
        }
      } else {
        if (u.flBar === 2) {
          ev.push({ t: 'fl', k: 'cut', cut: 'phase2' });
          ev.push({ t: 'fl', k: 'line', actor: u.uid, clip: 'hah', face: 'face_flowery_23',
            text: 'Hah! That was just the warm-up health bar! Seth! Aqua! Get out here!' });
          this.apply(u, u, 'atkUp', 4, null, ev);
          this.summon(u, 'flSeth', ev);
          this.summon(u, 'flAqua', ev);
        } else {
          ev.push({ t: 'fl', k: 'cut', cut: 'omega' });
          ev.push({ t: 'fl', k: 'line', actor: u.uid, clip: 'nonono', face: 'face_flowery_33',
            text: 'No, no, no! That bar was ALSO the tutorial! Behold—OMEGA FLOWERY!!' });
          ev.push({ t: 'fl', k: 'omegaTransform', actor: u.uid });
          this.apply(u, u, 'haste', 4, null, ev);
          this.apply(u, u, 'regen', 99, { v: .015 }, ev);
          this.summon(u, 'flYellow', ev);
          this.summon(u, 'flBlue', ev);
        }
      }
      ev.push({ t: 'fl', k: 'bars', target: u.uid });
      ev.push({ t: 'fl', k: 'ralsei', target: u.uid, text: 'While Flowery is drawing in power—everyone, gather by my scarf!' });
      this.party().forEach(p => {
        if (!p.alive) this.revive(p, .55, ev);
        else this.healRaw(p, p.max.hp * .45, ev, 'Heal Prayer');
        p.fp = Math.min(p.max.fp, p.fp + 14);
      });
      return;
    }
    if (this.fl === 'hard' && u.side === 'e' && u.def && u.def.flFriend && !this.flReloaded[u.key] && this.living('e').some(isFl)) {
      this.flReloaded[u.key] = true;
      u.hp = Math.round(u.max.hp * .5); u.st = {}; u.tele = null;
      ev.push({ t: 'fl', k: 'reload', target: u.uid, actor: this.living('e').find(isFl).uid, text: `"Nope. Loading my save." ${u.name} is back.` });
      ev.push({ t: 'heal', target: u.uid, amount: u.hp, tag: 'Load Save' });
      return;
    }
    return kill0.call(this, u, ev);
  };

  SP.hit = function (src, tgt, power, kind, ev, o) {
    if (this.fl && tgt && isFl(tgt) && tgt.flEdit > 0 && src && src.side === 'p') {
      o = Object.assign({}, o || {}, { mult: ((o && o.mult) || 1) * .2 });
    }
    return hit0.call(this, src, tgt, power, kind, ev, o);
  };

  SP.breakFoe = function (u, ev) {
    if (this.fl && isFl(u) && u.flEdit) {
      u.flEdit = 0;
      ev.push({ t: 'text', text: 'The Break shatters Flowery’s number edit! Damage is back to 100%!', actor: u.uid, cls: 'break' });
    }
    return breakFoe0.call(this, u, ev);
  };

  SP.endTurn = function (u, ev, d) {
    const r = endTurn0.call(this, u, ev, d);
    if (this.fl && isFl(u)) {
      if (u.flEdit > 0) u.flEdit--;
      if (u.flSkipNow) { u.flSkipNow = false; u.ct = 0; }
    }
    return r;
  };

  SP.checkPhases = function (u, ev) {
    if (!(this.fl && u.def && u.def.flPhases)) return checkPhases0.call(this, u, ev);
    const bar = u.flBar || 1, list = u.def.flPhases[bar] || [];
    list.forEach((p, i) => {
      const key = bar + ':' + i;
      if (u.phaseDone[key] || u.hp / u.max.hp > p.at) return;
      u.phaseDone[key] = true;
      ev.push({ t: 'phase', target: u.uid, text: p.text });
      if (p.buff) this.apply(u, u, p.buff, 99, null, ev);
      if (p.heal) this.healRaw(u, Math.round(u.max.hp * p.heal), ev, 'Not Yet');
      (p.summon || []).forEach(k => this.summon(u, k, ev));
    });
  };

  SP.enemyAct = function (u) {
    if (!this.fl) return enemyAct0.call(this, u);
    // For petal friends (flSeth, flAqua, flGreen, flOrange, flBlue, flYellow, flFloradinn), run standard enemyAct + attach friend VFX event
    if (!isFl(u)) {
      const ev = enemyAct0.call(this, u);
      const actEv = ev.find(x => x.t === 'act');
      if (actEv) {
        ev.unshift({ t: 'fl', k: 'friendMove', actor: u.uid, key: u.key, moveName: actEv.name });
      }
      return ev;
    }

    let move = null;
    const ev = [];
    const bar = u.flBar || 1;
    if (u.tele) {
      move = u.tele;
      u.tele = null;
    } else {
      // Filter moves appropriate for current bar so Phase 3 Omega moves unlock on Bar 2/3 while Jarona Combo is always active
      const opts = u.def.moves.filter(m => {
        if (u.cds[m.name] > 0) return false;
        if (m.kind === 'summon' && this.living('e').length >= ST_MAX_FOES) return false;
        if ((m.kind === 'flLastJarona' || m.kind === 'flPrismBeam') && bar < 3) return false;
        if (m.kind === 'flPetalStorm' && bar < 2) return false;
        return true;
      });
      const tot = opts.reduce((a, m) => a + m.w, 0);
      let r = this.rng() * tot;
      move = opts.find(m => (r -= m.w) <= 0) || opts[0];
      if (!move || (!/^fl/.test(move.kind) && move.kind !== 'summon')) {
        const keep = u.def.moves;
        u.def = Object.assign({}, u.def, { moves: keep.filter(m => !/^fl/.test(m.kind)) });
        try { return enemyAct0.call(this, u); } finally { u.def = Object.assign({}, u.def, { moves: keep }); }
      }
      if (move.kind === 'summon') {
        const keep = u.def.moves;
        u.def = Object.assign({}, u.def, { moves: [move] });
        try { return enemyAct0.call(this, u); } finally { u.def = Object.assign({}, u.def, { moves: keep }); }
      }
      if (move.cd) u.cds[move.name] = move.cd;
      if (move.tele && this.toonInterrupt && this.toonInterrupt(u, move, ev)) {
        this.endTurn(u, ev, .9);
        return ev;
      }
      if (move.tele) {
        u.tele = move;
        ev.push({ t: 'fl', k: 'windup', actor: u.uid, moveKind: move.kind });
        ev.push({ t: 'charge', actor: u.uid, name: move.name, text: move.tele, lethal: !!move.lethal });
        this.endTurn(u, ev, .75);
        return ev;
      }
    }

    if (move.cd && !u.tele) u.cds[move.name] = move.cd;
    ev.push({ t: 'act', actor: u.uid, name: move.name, kind: 'enemy', big: true });
    const party = this.living('p');
    const hasOrange = this.living('e').some(e => e.key === 'flOrange');

    switch (move.kind) {
      case 'flKick': {
        const t = this.pickTarget(u, move);
        ev.push({ t: 'fl', k: 'kick', actor: u.uid, target: t ? t.uid : null });
        if (t) this.hit(u, t, move.power, 'phys', ev);
        break;
      }
      case 'flBouquet': {
        ev.push({ t: 'fl', k: 'bouquet', actor: u.uid });
        for (let i = 0; i < (move.hits || 3); i++) {
          const lp = this.living('p');
          if (!lp.length) break;
          const t = this.rng.pick(lp);
          this.hit(u, t, move.power, 'mag', ev);
          if (move.ink && t.alive && this.rng() < move.ink) this.apply(u, t, 'inked', 2, null, ev);
        }
        break;
      }
      case 'flShine': {
        ev.push({ t: 'fl', k: 'shine', actor: u.uid });
        party.forEach(p => {
          this.hit(u, p, move.power, 'mag', ev, { aoe: true });
          if (p.alive && move.debuff) this.apply(u, p, move.debuff, 2, null, ev);
        });
        break;
      }
      case 'flPirouette': {
        ev.push({ t: 'fl', k: 'pirouette', actor: u.uid });
        this.apply(u, u, 'defUp', 3, null, ev);
        this.healRaw(u, Math.round(u.max.hp * .05), ev, 'Pirouette');
        break;
      }
      case 'flJarona': {
        const t1 = this.pickTarget(u, move);
        const t2 = party.length > 1 ? this.rng.pick(party.filter(p => p !== t1)) || t1 : t1;
        const hits = bar >= 3 ? 3 : 2;
        ev.push({
          t: 'fl', k: 'jaronaCombo', actor: u.uid,
          target: t1 ? t1.uid : null, target2: t2 ? t2.uid : null,
          orange: hasOrange, hits, bar
        });
        if (t1) this.hit(u, t1, move.power * .68, 'phys', ev, { stagger: 0 });
        if (t2 && t2.alive) this.hit(u, t2, move.power * .76, 'phys', ev, { stagger: 0 });
        if (hits >= 3) {
          const lp = this.living('p');
          const t3 = lp.length ? this.rng.pick(lp) : null;
          if (t3) this.hit(u, t3, move.power * .48, 'phys', ev, { stagger: 0 });
        }
        break;
      }
      case 'flPetalStorm': {
        ev.push({ t: 'fl', k: 'petalStorm', actor: u.uid });
        party.forEach(p => { this.hit(u, p, move.power, 'mag', ev, { stagger: 0, aoe: true }); });
        break;
      }
      case 'flPrismBeam': {
        const t = this.pickTarget(u, move);
        ev.push({ t: 'fl', k: 'prismBeam', actor: u.uid, target: t ? t.uid : null });
        if (t) this.hit(u, t, move.power, 'mag', ev, { stagger: 0 });
        break;
      }
      case 'flLastJarona': {
        const t = this.pickTarget(u, move);
        ev.push({ t: 'fl', k: 'lastJarona', actor: u.uid, target: t ? t.uid : null });
        if (t) {
          if (move.lethal && this.lethalStrike && this.lethalStrike(u, t, move, ev)) { /* lethal handled */ }
          else this.hit(u, t, move.power, 'phys', ev, { stagger: 0 });
        }
        break;
      }
      case 'flSkip': {
        ev.push({ t: 'fl', k: 'skip', actor: u.uid });
        const t = this.pickTarget(u, move);
        if (t) this.hit(u, t, move.power, 'phys', ev, { stagger: 0 });
        u.flSkipNow = true;
        break;
      }
      case 'flSteal': {
        const order = ['medkit', 'jumper', 'jawbreaker', 'bandage', 'tonic', 'pop', 'speed', 'stealth', 'barrier'];
        const k = order.find(x => (this.items[x] || 0) > 0);
        if (k) {
          this.items[k]--;
          ev.push({ t: 'fl', k: 'steal', actor: u.uid, item: k });
        } else {
          ev.push({ t: 'fl', k: 'line', actor: u.uid, clip: 'huh', face: 'face_flowery_9', text: 'Your pockets are empty. Huh. I\'ll take FP then.' });
          party.forEach(p => { const n = Math.min(p.fp, 6); if (n) { p.fp -= n; ev.push({ t: 'fp', target: p.uid, amount: -n }); } });
        }
        break;
      }
      case 'flEdit':
        u.flEdit = 3;
        ev.push({ t: 'fl', k: 'edit', actor: u.uid });
        ev.push({ t: 'text', text: 'Flowery edited the damage numbers! Your hits do 20% until he’s Broken!', actor: u.uid, cls: 'big' });
        break;
      case 'flSwap': {
        const t = party.slice().sort((a, b) => b.hp / b.max.hp - a.hp / a.max.hp)[0];
        if (t && t.hp / t.max.hp > u.hp / u.max.hp) {
          const a = u.hp / u.max.hp, b = t.hp / t.max.hp;
          ev.push({ t: 'fl', k: 'swap', actor: u.uid, target: t.uid });
          const tNew = Math.max(1, Math.round(t.max.hp * a)), uNew = Math.round(u.max.hp * b);
          ev.push({ t: 'dot', target: t.uid, amount: t.hp - tNew, kind: 'swap' }); t.hp = tNew;
          ev.push({ t: 'heal', target: u.uid, amount: uNew - u.hp, tag: 'Trade' }); u.hp = uNew;
        } else {
          ev.push({ t: 'fl', k: 'line', actor: u.uid, clip: 'forget_it', face: 'face_flowery_28', text: 'Eh. Your HP\'s worse than mine. Forget it.' });
          this.apply(u, u, 'atkUp', 3, null, ev);
        }
        break;
      }
      case 'flMute':
        ev.push({ t: 'fl', k: 'mute', actor: u.uid });
        party.forEach(p => this.apply(u, p, 'silence', 2, null, ev));
        break;
      case 'flPause':
        ev.push({ t: 'fl', k: 'pause', actor: u.uid });
        this.healRaw(u, u.max.hp * (move.heal || .08), ev, 'Pause');
        if (this.fl === 'hard') party.forEach(p => this.apply(u, p, 'slow', 2, null, ev));
        break;
      default:
        if (move.target === 'all') party.forEach(tgt => this.hit(u, tgt, move.power, move.kind, ev));
        else { const t = this.pickTarget(u, move); if (t) this.hit(u, t, move.power, move.kind, ev); }
        break;
    }
    this.endTurn(u, ev);
    return ev;
  };

  /* ---------------------------------------------------------------- Balance Tuning */
  const TUNE = {
    easy: { plv: 50, flv: 48, mult: { hp: 1, atk: .35, def: 1 } },
    hard: { plv: 56, flv: 58, mult: { hp: .45, atk: .32, def: 1 } }
  };

  /* ---------------------------------------------------------------- Composite Omega Flowery & Cached Frame URLs */
  const urlCache = new Map();
  function frameUrl(name, scale = 4) {
    if (!name || !P() || !P().has(name)) return '';
    const key = name + '@' + scale;
    if (urlCache.has(key)) return urlCache.get(key);
    const u = P().url(name, scale);
    if (u) urlCache.set(key, u);
    return u;
  }

  const OMEGA_PARTS = [
    ['omegaf_green', '#5cff6a', -22, -4],
    ['omegaf_aqua', '#4ff4ff', -14, 6],
    ['omegaf_seth', '#b07bff', 14, -10],
    ['omegaf_yellow', '#ffd23a', 8, -18],
    ['omegaf_blue', '#7f9bff', 22, -4],
    ['omegaf_orange', '#ff8a4a', -4, 10]
  ];
  function omegaUrl(poseBase, frameIdx, maxFrames = 3) {
    if (!P() || !P().ok) return '';
    const f = frameIdx % maxFrames;
    const poseName = poseBase + '_' + f;
    const key = 'OMEGA:' + poseName;
    if (urlCache.has(key)) return urlCache.get(key);
    const c = document.createElement('canvas');
    c.width = 128 * 3;
    c.height = 112 * 3;
    const ctx = c.getContext('2d');
    ctx.imageSmoothingEnabled = false;
    ctx.scale(3, 3);
    const cx = 64, cy = 96;
    const pf = f % 3;
    OMEGA_PARTS.forEach(([n, col, dx, dy]) => {
      P().draw(ctx, n + '_o_' + pf, cx + dx, cy - 18 + dy, { ax: .5, ay: .5, s: 1.08, tint: col, alpha: .85 });
      P().draw(ctx, n + '_' + pf, cx + dx, cy - 18 + dy, { ax: .5, ay: .5, s: 1, alpha: .92 });
    });
    const actualPose = P().has(poseName) ? poseName : 'omegaflowery_idle_' + pf;
    P().draw(ctx, actualPose, cx, cy + 1, { ax: .5, ay: 1, s: 1.15, tint: '#ffd23a', alpha: .85 });
    P().draw(ctx, actualPose, cx, cy, { ax: .5, ay: 1, s: 1.08 });
    const out = c.toDataURL('image/png');
    urlCache.set(key, out);
    return out;
  }

  /* ---------------------------------------------------------------- Battle UI & Live 60FPS Stage / Sprite Choreographer */
  const UI = Object.create(StoryBattleUI);
  UI._jaronaVariant = 0;
  UI._vfxList = [];

  UI.art = function (u) {
    if (u.side === 'e' && u.def && u.def.art && u.def.art.startsWith('f:')) return frameUrl(u.def.art.slice(2), 4);
    return StoryBattleUI.art.call(this, u);
  };
  const makeUnit0 = StoryBattleUI.makeUnit;
  UI.makeUnit = function (u) {
    const n = makeUnit0.call(this, u);
    if (u.side === 'e' && u.def.art && u.def.art.startsWith('f:')) n.classList.add('fl-pix');
    return n;
  };

  /* Anime Cut-In Banner (like Toby Fox / Studio Trigger boss specials) */
  const CUTS = {
    vs: { a: 'flowery_idle3_0', b: 'flowery_teethshine_2', title: 'SANCTUARY OF SEVEN SUNS · FLOWERY', col: '#ffd23a', snd: ['hey_guys'] },
    phase2: { a: 'seth_idle_0', b: 'aqua_centered_0', title: 'ACT II · WITH OUR POWERS COMBINED!', col: '#4ff4ff', snd: ['powers_combined'] },
    omega: { a: 'omegaflowery_powerup_0', b: 'omegaf_yellow_0', title: 'FINAL ACT · OMEGA FLOWERY', col: '#ff4ab8', snd: ['omega', 'powering_up'] },
    jarona: { a: 'flowery_punch_windup_4', b: 'flowery_puuunch_left_0', title: 'SIGNATURE MOVE · MY JARONA!!', col: '#ff8a00', snd: [] },
    jaronaOrange: { a: 'flowery_puuunch_left_0', b: 'forange_largeglove_0', title: 'TAG TEAM · ORANGE JARONA!!', col: '#ff6a00', snd: [] },
    lastJarona: { a: 'omegaflowery_windup_4', b: 'omegaflowery_jarona_0', title: 'ULTIMATE ART · THE LAST JARONA!!', col: '#ff2f6d', snd: [] },
    prismBeam: { a: 'omegaflowery_pose_0', b: 'superbloom_front_3', title: 'SEVEN-SUN PRISM BEAM!!', col: '#ffe066', snd: ['prism_blow'] },
    petalStorm: { a: 'omegaflowery_pose_1', b: 'superbloom_front_2', title: 'PRISMATIC PETAL STORM!!', col: '#b07bff', snd: ['spiral'] },
    punishGun: { a: 'yellow_punish_gun_2', b: 'punishgun_bouquet_2', title: 'SHERIFF YELLOW · PUNISHMENT GUN!', col: '#ffd23a', snd: [] }
  };

  UI.flCut = async function (key) {
    const c = CUTS[key];
    if (!c || !this.root) return;
    const box = document.createElement('div');
    box.className = 'eg-cut';
    box.style.setProperty('--c', c.col || '#ffe066');
    const img = (n, cls) => n && P().has(n) ? `<img class="${cls}" src="${frameUrl(n, 4)}" alt="">` : '';
    box.innerHTML = `<div class="eg-band"></div><div class="eg-lines"></div>${img(c.a, 'eg-a')}${img(c.b, 'eg-b')}<b class="eg-title">${c.title}</b>`;
    this.root.appendChild(box);
    (c.snd || []).forEach((s, i) => setTimeout(() => { if (window.FW && FW.voiceLine) FW.voiceLine(null, s, ''); }, i * 420));
    this.flash(c.col || '#fff');
    this.shake(true);
    await this.wait(key === 'vs' || key === 'omega' ? 1450 : 1050);
    box.classList.add('out');
    await this.wait(180);
    if (box.parentNode) box.parentNode.removeChild(box);
  };

  /* Spawn a live canvas VFX animation over the battlefield */
  UI.spawnVfx = function (kind, opts = {}) {
    this._vfxList.push(Object.assign({ kind, t0: performance.now(), dur: opts.dur || 850 }, opts));
  };

  /* Live 60fps Stage Background + VFX Overlay + Unit Sprite Animator */
  UI.startBossAnimation = function () {
    this.stopBossAnimation();
    const bgLayer = $('#bgLayer');
    const stage = $('#stage') || this.arena;
    if (bgLayer) {
      bgLayer.style.backgroundImage = 'none';
      const cv = document.createElement('canvas');
      cv.className = 'fl-stage-cv';
      cv.width = 320;
      cv.height = 180;
      bgLayer.appendChild(cv);
      this._stageCv = cv;
      this._stageCtx = cv.getContext('2d');
    }
    if (stage) {
      const vcv = document.createElement('canvas');
      vcv.className = 'fl-vfx-cv';
      vcv.width = 320;
      vcv.height = 180;
      stage.appendChild(vcv);
      this._vfxCv = vcv;
      this._vfxCtx = vcv.getContext('2d');
    }

    const tStart = performance.now();
    const tick = (now) => {
      if (!this.B || !this.root || !this.root.isConnected) return;
      const t = (now - tStart) / 1000;
      const fl = this.B.units.find(isFl);
      const bar = (fl && fl.flBar) || 1;

      // 1. Render Live Pixel-Art Stage Background
      if (this._stageCtx && P() && P().ok) {
        const ctx = this._stageCtx;
        ctx.imageSmoothingEnabled = false;
        ctx.clearRect(0, 0, 320, 180);

        if (bar >= 3) {
          // PHASE 3: Sanctuary Rooftop Climax!
          if (window.FW && FW.sunsetSky) FW.sunsetSky(ctx, { x: t * 140 }, t, { cliffY: 120 });
          else { ctx.fillStyle = '#1c092b'; ctx.fillRect(0, 0, 320, 180); }
          P().draw(ctx, 'flowerytree_0', 160, 152, { s: 0.85, alpha: 0.9 });
          P().draw(ctx, 'castle_roof_2_0', 160 - ((t * 90) % 80) + 40, 158, { s: 1 });
          P().draw(ctx, 'castle_roof_1_0', 160 - ((t * 160) % 40) + 20, 184, { s: 1.05 });
          const gf = Math.floor(t * 6) % 3;
          P().draw(ctx, 'fcastle_top_sideglow_' + gf, 0, 0, { ax: 0, ay: 0, alpha: 0.7 });
          P().draw(ctx, 'fcastle_top_sideglow_' + gf, 320, 0, { ax: 1, ay: 0, flip: true, alpha: 0.7 });
          if (window.FlowerCuts) {
            window.FlowerCuts.speedLines(ctx, t, 'side', 'rgba(255,235,170,0.26)', 20);
            window.FlowerCuts.drawPetals(ctx, t, 0.85, -90, 35);
          }
        } else {
          // PHASE 1 & 2: The Climbing Vine Tower & Tearing Sunset Curtains
          const sunsetK = bar === 2 ? 0.75 : 0.15;
          if (window.FlArena) {
            window.FlArena.bg(ctx, t, { sunset: sunsetK, speed: bar === 2 ? 42 : 20, x: 112, w: 96 });
          } else {
            ctx.fillStyle = '#180824';
            ctx.fillRect(0, 0, 320, 180);
          }
          if (bar === 2) {
            P().draw(ctx, 'castle_distance_small_0', 160, 156, { s: 0.65, alpha: 0.45 });
            const bf = Math.floor(t * 8) % 12;
            P().draw(ctx, 'climb_booster_' + bf, 72, 138 + Math.sin(t * 3) * 4, { s: 0.65, alpha: 0.75 });
            P().draw(ctx, 'climb_booster_' + bf, 248, 138 + Math.cos(t * 3) * 4, { s: 0.65, alpha: 0.75 });
          }
          if (window.FlowerCuts) window.FlowerCuts.drawPetals(ctx, t, 0.65, -24, 32);
        }
      }

      // 2. Render Live Canvas Attack VFX Overlay
      if (this._vfxCtx && P() && P().ok) {
        const vctx = this._vfxCtx;
        vctx.imageSmoothingEnabled = false;
        vctx.clearRect(0, 0, 320, 180);
        this._vfxList = this._vfxList.filter(v => now - v.t0 < v.dur);
        for (const v of this._vfxList) {
          const k = Math.min(1, (now - v.t0) / v.dur);
          this.drawVfxItem(vctx, v, k, t);
        }
      }

      // 3. Animate Every Enemy Unit Sprite at 60FPS
      for (const u of this.B.units) {
        if (u.side !== 'e' || !u.alive) continue;
        const node = this.unitEl(u);
        const img = node && node.querySelector('.body img');
        if (!img) continue;

        let nextUrl = '';
        const st = node._flAnim;
        const inAnim = st && now < st.until;

        if (isFl(u)) {
          const isOmega = (u.flBar || 1) >= 3;
          node.classList.toggle('flowery-omega-active', isOmega);
          if (inAnim) {
            const elapsed = (now - st.t0) / 1000;
            if ( isOmega && st.omegaPose ) {
              const fIdx = Math.floor(elapsed * (st.fps || 10));
              nextUrl = omegaUrl(st.omegaPose, fIdx, st.n || 3);
            } else if (st.frames) {
              const fName = st.frames[Math.min(st.frames.length - 1, Math.floor(elapsed * (st.fps || 10)))];
              nextUrl = frameUrl(fName, 4);
            }
          } else if (u.tele) {
            if (isOmega) {
              nextUrl = omegaUrl('omegaflowery_windup', Math.floor(t * 10) % 5, 5);
            } else {
              nextUrl = frameUrl('flowery_punch_windup_' + (Math.floor(t * 10) % 5), 4);
            }
          } else if (isOmega) {
            nextUrl = omegaUrl('omegaflowery_idle', Math.floor(t * 8) % 3, 3);
          } else {
            const idleIdx = Math.floor(t * 7) % 5;
            nextUrl = frameUrl('flowery_idle3_' + idleIdx, 4);
          }
        } else {
          // Animated Petal Friends!
          const fk = u.key;
          if (inAnim && st.frames) {
            const elapsed = (now - st.t0) / 1000;
            const fName = st.frames[Math.min(st.frames.length - 1, Math.floor(elapsed * (st.fps || 9)))];
            nextUrl = frameUrl(fName, 4);
          } else if (u.tele && fk === 'flYellow') {
            nextUrl = frameUrl('yellow_punish_gun_' + (Math.floor(t * 8) % 3), 4);
          } else if (fk === 'flSeth') {
            nextUrl = frameUrl('seth_idle_' + (Math.floor(t * 6) % 4), 4);
          } else if (fk === 'flAqua') {
            nextUrl = frameUrl('aqua_centered_' + (Math.floor(t * 7) % 4), 4);
          } else if (fk === 'flGreen') {
            nextUrl = frameUrl('enemy_green_witharmandpan_' + (Math.floor(t * 5) % 2), 4);
          } else if (fk === 'flOrange') {
            nextUrl = frameUrl('orange_proud_left2_' + (Math.floor(t * 6) % 2), 4);
          } else if (fk === 'flBlue') {
            nextUrl = frameUrl('blue_poses_' + (Math.floor(t * 6) % 3), 4);
          } else if (fk === 'flYellow') {
            nextUrl = frameUrl((Math.floor(t * 2) % 2 === 0) ? 'yellow_cool_stance_0' : 'yellow_quarter_0', 4);
          } else if (fk === 'flFloradinn') {
            nextUrl = frameUrl('enemy_floradin_flipped_0', 4);
          }
        }

        if (nextUrl && node._lastUrl !== nextUrl) {
          node._lastUrl = nextUrl;
          img.src = nextUrl;
        }
      }

      this._animRaf = requestAnimationFrame(tick);
    };
    this._animRaf = requestAnimationFrame(tick);
  };

  UI.stopBossAnimation = function () {
    if (this._animRaf) {
      cancelAnimationFrame(this._animRaf);
      this._animRaf = 0;
    }
    if (this._stageCv && this._stageCv.parentNode) this._stageCv.parentNode.removeChild(this._stageCv);
    if (this._vfxCv && this._vfxCv.parentNode) this._vfxCv.parentNode.removeChild(this._vfxCv);
    this._stageCv = null; this._stageCtx = null;
    this._vfxCv = null; this._vfxCtx = null;
    this._vfxList = [];
  };

  UI.setUnitAnim = function (u, spec, ms = 700) {
    const node = this.unitEl(u);
    if (!node) return;
    const now = performance.now();
    node._flAnim = Object.assign({ t0: now, until: now + ms }, spec);
  };

  const rigHit0 = StoryBattleUI.rigHit;
  UI.rigHit = function (u) {
    rigHit0.call(this, u);
    if (!u || u.side !== 'e') return;
    if (isFl(u)) {
      const isOmega = (u.flBar || 1) >= 3;
      this.setUnitAnim(u, isOmega ? { omegaPose: 'omegaflowery_hurt', n: 1 } : { frames: ['flowery_hurt_0'] }, 360);
    } else if (u.key === 'flSeth') this.setUnitAnim(u, { frames: ['seth_surprised_0'] }, 340);
    else if (u.key === 'flAqua') this.setUnitAnim(u, { frames: ['aqua_surprise_0'] }, 340);
    else if (u.key === 'flGreen') this.setUnitAnim(u, { frames: ['enemy_green_disappointed_0'] }, 340);
    else if (u.key === 'flOrange') this.setUnitAnim(u, { frames: ['orange_shock_0'] }, 340);
    else if (u.key === 'flBlue') this.setUnitAnim(u, { frames: ['blue_unhappy_shock_0'] }, 340);
    else if (u.key === 'flYellow') this.setUnitAnim(u, { frames: ['yellow_confused_0'] }, 340);
  };

  /* Draw active attack VFX on the 320x180 pixel overlay canvas */
  UI.drawVfxItem = function (ctx, v, k, t) {
    const tx = v.tx || 88, ty = v.ty || 116;
    const sx = v.sx || 236, sy = v.sy || 110;
    const lerp = (a, b, p) => a + (b - a) * p;

    switch (v.kind) {
      case 'jaronaHit1': {
        // High-velocity punch impact + directional slash
        if (window.FlowerCuts) window.FlowerCuts.speedLines(ctx, t, 'side', 'rgba(255,220,100,0.45)', 24);
        const f = Math.min(3, Math.floor(k * 5));
        P().draw(ctx, 'vfx_directional_hit_0', tx + 16, ty, { ax: .5, ay: .5, s: 1.2, alpha: 1 - k * .6 });
        P().draw(ctx, 'hit_vfx_' + f, tx, ty, { ax: .5, ay: .5, s: 1.15 });
        break;
      }
      case 'jaronaHit2': {
        // Parry shockwave ring + Orange's giant boxing glove if Orange is present!
        if (v.orange) {
          const gf = Math.min(5, Math.floor(k * 8));
          P().draw(ctx, 'forange_largeglove_' + gf, lerp(sx - 20, tx + 18, Math.min(1, k * 1.6)), ty, { ax: .5, ay: .5, s: 1.1, flip: true });
        }
        const pf = Math.min(6, Math.floor(k * 7));
        P().draw(ctx, 'vfx_parry_ring_0', tx, ty, { ax: .5, ay: .5, s: 0.35 + k * 0.75, alpha: 1 - k });
        P().draw(ctx, 'vfx_parry_impact_' + pf, tx, ty, { ax: .5, ay: .5, s: 1.1 });
        break;
      }
      case 'jaronaFinisher': {
        // Massive Deltarune Ch5 finisher explosion + superbloom eruption!
        const ef = Math.min(6, Math.floor(k * 7));
        const sbf = Math.min(6, Math.floor(k * 7));
        P().draw(ctx, 'superbloom_front_' + sbf, tx, ty + 28, { ax: .5, ay: 1, s: 1.2, alpha: 1 - k * 0.5 });
        P().draw(ctx, 'finisher_explosion_' + ef, tx, ty, { ax: .5, ay: .5, s: 1.15 });
        break;
      }
      case 'kick': {
        P().draw(ctx, 'fx_hitback_vertical_0', tx, ty, { ax: .5, ay: .5, s: 1.2, alpha: 1 - k });
        P().draw(ctx, 'hit_vfx_' + Math.min(3, Math.floor(k * 5)), tx, ty, { ax: .5, ay: .5, s: 1.0 });
        break;
      }
      case 'bouquet': {
        for (let i = 0; i < 6; i++) {
          const pk = Math.max(0, Math.min(1, (k - i * 0.08) / 0.65));
          if (pk <= 0 || pk >= 1) continue;
          const bx = lerp(sx, tx + (i % 3 - 1) * 24, pk);
          const by = lerp(sy, ty + (i % 2 - 0.5) * 22, pk) - Math.sin(pk * Math.PI) * 28;
          P().draw(ctx, 'spin_petal_' + ((i + Math.floor(t * 12)) % 5), bx, by, { ax: .5, ay: .5, s: 1.5 });
        }
        break;
      }
      case 'shine': {
        for (let i = 0; i < 9; i++) {
          const sx0 = 40 + (i * 31) % 240, sy0 = 36 + (i * 23) % 110;
          P().draw(ctx, '5x5shine_0', sx0, sy0, { ax: .5, ay: .5, s: 2.5 * Math.sin(k * Math.PI) });
        }
        P().draw(ctx, 'vfx_parry_ring_0', sx, sy - 10, { ax: .5, ay: .5, s: k * 0.9, alpha: 1 - k });
        break;
      }
      case 'petalStorm': {
        const sbf = Math.min(6, Math.floor(k * 7));
        P().draw(ctx, 'superbloom_front_' + sbf, 100, 150, { ax: .5, ay: 1, s: 1.35, alpha: 1 - k * 0.4 });
        for (let i = 0; i < 14; i++) {
          const pk = (k * 1.3 + i * 0.07) % 1;
          const bx = lerp(sx + 20, 20, pk);
          const by = 24 + ((i * 29) % 130) + Math.sin(pk * 8 + i) * 14;
          P().draw(ctx, 'omegaflowery_bullets_' + (i % 9), bx, by, { ax: .5, ay: .5, s: 1.2 });
        }
        break;
      }
      case 'prismBeam': {
        const cols = ['#ff4a6a', '#ff9a3a', '#ffe066', '#5cff6a', '#4ff4ff', '#7f9bff', '#d47bff'];
        const beamH = Math.sin(k * Math.PI) * 48;
        cols.forEach((c, i) => {
          ctx.fillStyle = c;
          const h = Math.max(2, beamH / 7);
          ctx.fillRect(0, ty - beamH / 2 + i * h, sx, h + 1);
        });
        ctx.fillStyle = `rgba(255,255,255,${Math.sin(k * Math.PI) * 0.75})`;
        ctx.fillRect(0, ty - beamH * 0.2, sx, beamH * 0.4);
        P().draw(ctx, 'vfx_parry_impact_' + Math.min(6, Math.floor(k * 7)), tx, ty, { ax: .5, ay: .5, s: 1.35 });
        break;
      }
      case 'punishLaser': {
        P().draw(ctx, 'punishgun_laser_0', sx - 20, ty + 16, { ax: 1, ay: .5, s: 0.95, alpha: Math.sin(k * Math.PI) });
        const bf = Math.min(5, Math.floor(k * 6));
        P().draw(ctx, 'punishgun_bouquet_' + bf, tx, ty, { ax: .5, ay: .5, s: 1.15 });
        break;
      }
      case 'orangePunch': {
        const gf = Math.min(5, Math.floor(k * 6));
        P().draw(ctx, 'forange_largeglove_' + gf, lerp(sx, tx + 10, Math.min(1, k * 1.5)), ty, { ax: .5, ay: .5, s: 1.1, flip: true });
        P().draw(ctx, 'forange_shockwave_' + (Math.floor(k * 8) % 4), tx + 24, ty, { ax: .5, ay: .5, s: 1.2 });
        break;
      }
      case 'blueWaltz': {
        const bf = Math.floor(k * 8) % 8;
        P().draw(ctx, 'face_blue_butterfly_' + bf, sx - 20, sy - 10, { ax: .5, ay: .5, s: 0.85, alpha: Math.sin(k * Math.PI) });
        for (let i = 0; i < 7; i++) {
          const pk = (k + i * 0.1) % 1;
          const bx = lerp(sx, tx - 20, pk);
          const by = ty + Math.sin(pk * 10 + i) * 28;
          P().draw(ctx, 'enemy_blue_bullet_butterfly_' + (Math.floor(t * 10 + i) % 4), bx, by, { ax: .5, ay: .5, s: 1.3 });
        }
        break;
      }
      case 'greenPan': {
        P().draw(ctx, 'green_omegapan_' + (Math.floor(k * 6) % 2), lerp(sx, tx + 20, Math.sin(k * Math.PI)), ty - 10, { ax: .5, ay: .5, s: 1 });
        P().draw(ctx, 'green_omurice_0', lerp(sx, tx, k), ty - Math.sin(k * Math.PI) * 36, { ax: .5, ay: .5, s: 1.5 });
        break;
      }
    }
  };

  /* Fourth-wall walker */
  function walker(from, to, ms) {
    const img = document.createElement('img');
    img.className = 'fl-walker';
    document.body.appendChild(img);
    const dir = to.x < from.x ? 'left' : 'right';
    const frames = [0, 1, 2, 3].map(i => frameUrl(`flowery_walk_${dir}_jacket_${i}`, 3));
    return new Promise(res => {
      const t0 = performance.now();
      const step = now => {
        const k = Math.min(1, (now - t0) / ms);
        img.src = frames[Math.floor(now / 110) % 4];
        img.style.left = (from.x + (to.x - from.x) * k) + 'px';
        img.style.top = (from.y + (to.y - from.y) * k) + 'px';
        if (k < 1) requestAnimationFrame(step);
        else res(img);
      };
      requestAnimationFrame(step);
    });
  }
  const center = el => { const r = el.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; };

  /* Authentic Deltarune Dark-World speech box with portrait — NEVER plays text blips when a voice clip plays! */
  UI.flBubble = async function (u, text, clip, face) {
    const hasVoice = !!(clip && window.FW && FW.voiceLine && P() && P().voice && P().voice[clip]);
    if (clip && window.FW && FW.voiceLine) FW.voiceLine(null, clip, '');

    const n = this.unitEl(u);
    if (!n) {
      this.say(`<b class="foe">${u ? u.name : 'Flowery'}</b> · ${text}`, 'big');
      await this.wait(1100);
      return;
    }
    const isOmega = u && (u.flBar || 1) >= 3;
    const faceSpr = face || (isOmega ? 'face_flowery_33' : 'face_flowery_27');
    const faceSrc = frameUrl(faceSpr, 2);

    const b = document.createElement('div');
    b.className = 'fl-bubble';
    b.innerHTML = `${faceSrc ? `<img src="${faceSrc}" alt="">` : ''}<div><b>${isOmega ? 'OMEGA FLOWERY' : (u ? u.name : 'FLOWERY')}</b><span></span></div>`;
    const span = b.querySelector('span');
    n.appendChild(b);

    for (let i = 1; i <= text.length; i++) {
      span.textContent = '* ' + text.slice(0, i);
      // Do NOT play text blips when a voice clip is playing!
      if (!hasVoice && i % 2 === 0 && window.FlPack && FlPack.play) {
        FlPack.play('voice:noise' + (1 + (i % 3)), .42);
      }
      await wait(18);
    }
    await this.wait(750 + text.length * 18);
    b.remove();
  };

  /* Choreographed Battle Event Runner */
  UI.flRun = async function (e) {
    const B = this.B, U = id => B.units.find(x => x.uid === id);
    const a = e.actor != null ? U(e.actor) : null;
    const t = e.target != null ? U(e.target) : null;
    const fl = a || t;

    switch (e.k) {
      case 'cut':
        await this.flCut(e.cut);
        break;

      case 'line':
        await this.flBubble(a, e.text, e.clip, e.face);
        break;

      case 'windup': {
        const isOmega = fl && (fl.flBar || 1) >= 3;
        if (e.moveKind === 'flJarona') {
          this.setUnitAnim(fl, isOmega
            ? { omegaPose: 'omegaflowery_windup', n: 5, fps: 10 }
            : { frames: ['flowery_punch_windup_0', 'flowery_punch_windup_1', 'flowery_punch_windup_2', 'flowery_punch_windup_3', 'flowery_punch_windup_4'], fps: 10 }, 1100);
          await this.flBubble(fl, "Heh... Ready for my signature move?! It's MY JARONA!", 'my_jarona', 'face_flowery_23');
        } else if (e.moveKind === 'flLastJarona') {
          this.setUnitAnim(fl, { omegaPose: 'omegaflowery_windup', n: 5, fps: 12 }, 1200);
          await this.flBubble(fl, 'ALL SIX PETALS IN ONE FIST... THIS IS MY LAST JARONA!!', 'last_jarona', 'face_flowery_33');
        } else if (e.moveKind === 'flPrismBeam') {
          this.setUnitAnim(fl, { omegaPose: 'omegaflowery_powerup', n: 3, fps: 10 }, 1000);
          await this.flBubble(fl, 'Shine, seven suns! Burn away the dark!', 'powering_up', 'face_flowery_1');
        }
        break;
      }

      case 'fakeWin': {
        const v = document.createElement('div');
        v.className = 'fl-fakewin';
        v.innerHTML = '<b>VICTORY</b><small>Flowery was defeated...?</small>';
        this.root.appendChild(v);
        Sound.play('arena_fanfare', { vol: .45 });
        await this.wait(1350);
        this.spawnVfx('jaronaHit2', { tx: 160, ty: 90, dur: 650 });
        v.classList.add('crack');
        if (window.FW && FW.sfx) FW.sfx('break2', { vol: .85 });
        this.shake(true);
        await this.wait(650);
        v.remove();
        this.refreshUnit(t);
        this.flash('#fff');
        const phaseTitle = e.mode === 'easy'
          ? (e.bar === 2 ? 'PHASE 2 · PETALS COMBINE!' : 'FINAL PHASE · OMEGA FLOWERY!')
          : `FLOWERY · PHASE ${e.bar}/3`;
        this.banner(phaseTitle, 'boss');
        await this.wait(400);
        break;
      }

      case 'jaronaCombo': {
        const n = this.unitEl(fl);
        const isOmega = fl && (fl.flBar || 1) >= 3;
        await this.flCut(e.orange ? 'jaronaOrange' : 'jarona');

        // Cycle through Flowery's authentic Jarona voice clips!
        const vPair = e.orange
          ? ['jarona_orange1', 'jarona_orange2']
          : (this._jaronaVariant++ % 2 === 0 ? ['jarona1', 'jarona2'] : ['jarona3', 'jarona4']);

        // HIT 1: Lunging Left Hook!
        this.setUnitAnim(fl, isOmega
          ? { omegaPose: 'omegaflowery_punch', n: 3, fps: 12 }
          : { frames: ['flowery_punch_windup_3', 'flowery_punch_windup_4', 'flowery_puuunch_left_0', 'flowery_puuunch_left_0'], fps: 12 }, 550);
        if (n) n.classList.add('fl-lunge-1');
        if (window.FW && FW.voiceLine) FW.voiceLine(null, vPair[0], '');
        if (window.FW && FW.sfx) FW.sfx('punchheavythunder', { vol: .85 });
        this.spawnVfx('jaronaHit1', { dur: 520 });
        this.flash('#ffe066');
        this.shake(true);
        await this.wait(440);

        // HIT 2: Cancels recoil into a rising Uppercut / Cross Jarona!
        if (n) { n.classList.remove('fl-lunge-1'); n.classList.add('fl-lunge-2'); }
        this.setUnitAnim(fl, isOmega
          ? { omegaPose: 'omegaflowery_jarona', n: 3, fps: 12 }
          : { frames: ['flowery_punch_up_chase_0', 'flowery_puuunch_0', 'flowery_puuunch_0'], fps: 12 }, 600);
        if (window.FW && FW.voiceLine) FW.voiceLine(null, vPair[1], '');
        if (window.FW && FW.sfx) FW.sfx('ultraswing', { vol: .9 });
        this.spawnVfx('jaronaHit2', { orange: e.orange, dur: 620 });
        this.flash('#ff6a3a');
        this.shake(true);
        await this.wait(480);

        // HIT 3 (Phase 3 Omega Finisher!)
        if (e.hits >= 3) {
          if (n) { n.classList.remove('fl-lunge-2'); n.classList.add('fl-lunge-3'); }
          this.setUnitAnim(fl, { omegaPose: 'omegaflowery_clash', n: 3, fps: 14 }, 600);
          if (window.FW && FW.voiceLine) FW.voiceLine(null, 'jarona4', '');
          if (window.FW && FW.sfx) FW.sfx('badexplosion', { vol: .85 });
          this.spawnVfx('jaronaFinisher', { dur: 750 });
          this.flash('#ff2f6d');
          this.shake(true);
          await this.wait(520);
        }

        if (n) n.classList.remove('fl-lunge-1', 'fl-lunge-2', 'fl-lunge-3');
        break;
      }

      case 'lastJarona': {
        const n = this.unitEl(fl);
        await this.flCut('lastJarona');
        if (n) n.classList.add('fl-lunge-3');
        this.setUnitAnim(fl, { omegaPose: 'omegaflowery_jarona', n: 3, fps: 14 }, 950);
        if (window.FW && FW.voiceLine) FW.voiceLine(null, 'last_jarona', '');
        if (window.FW && FW.sfx) FW.sfx('punchheavythunder', { vol: 1 });
        this.spawnVfx('jaronaHit2', { orange: true, dur: 700 });
        this.spawnVfx('jaronaFinisher', { dur: 900 });
        this.flash('#fff');
        this.shake(true);
        await this.wait(720);
        if (n) n.classList.remove('fl-lunge-3');
        break;
      }

      case 'omegaTransform': {
        this.setUnitAnim(fl, { omegaPose: 'omegaflowery_powerup', n: 3, fps: 10 }, 1100);
        this.spawnVfx('jaronaFinisher', { tx: 236, ty: 106, dur: 900 });
        this.flash('#fff');
        if (window.FW && FW.sfx) FW.sfx('great_shine', { vol: .95 });
        this.banner('OMEGA FLOWERY', 'boss');
        this.shake(true);
        await this.wait(750);
        break;
      }

      case 'prismBeam': {
        await this.flCut('prismBeam');
        this.setUnitAnim(fl, { omegaPose: 'omegaflowery_pose', n: 3, fps: 12 }, 850);
        this.spawnVfx('prismBeam', { dur: 820 });
        this.flash('#ffe066');
        if (window.FW && FW.sfx) FW.sfx('laz_c', { vol: .85 });
        this.shake(true);
        await this.wait(650);
        break;
      }

      case 'petalStorm': {
        await this.flCut('petalStorm');
        this.setUnitAnim(fl, { omegaPose: 'omegaflowery_pose', n: 3, fps: 12 }, 850);
        this.spawnVfx('petalStorm', { dur: 850 });
        this.flash('#ff9df0');
        if (window.FW && FW.sfx) FW.sfx('scytheburst_bc', { vol: .85 });
        this.shake(true);
        await this.wait(650);
        break;
      }

      case 'kick': {
        const n = this.unitEl(fl);
        if (n) n.classList.add('fl-lunge-1');
        this.setUnitAnim(fl, { frames: ['flowery_kick_crescent_0', 'flowery_flashkick_0', 'flowery_flashkick_0'], fps: 10 }, 520);
        if (window.FW && FW.voiceLine) FW.voiceLine(null, 'take_that', '');
        if (window.FW && FW.sfx) FW.sfx('criticalswing', { vol: .75 });
        this.spawnVfx('kick', { dur: 480 });
        this.shake(true);
        await this.wait(420);
        if (n) n.classList.remove('fl-lunge-1');
        break;
      }

      case 'bouquet': {
        this.setUnitAnim(fl, { frames: ['flowery_idle2_0', 'flowery_idle2_1', 'flowery_idle2_2', 'flowery_idle2_3', 'flowery_idle2_4'], fps: 10 }, 600);
        if (window.FW && FW.voiceLine) FW.voiceLine(null, 'for_the_fans', '');
        this.spawnVfx('bouquet', { dur: 650 });
        await this.wait(450);
        break;
      }

      case 'shine': {
        this.setUnitAnim(fl, { frames: ['flowery_teethshine_0', 'flowery_teethshine_1', 'flowery_teethshine_2', 'flowery_teethshine_3', 'flowery_teethshine_4', 'flowery_teethshine_5'], fps: 11 }, 700);
        if (window.FW && FW.voiceLine) FW.voiceLine(null, 'great_style', '');
        if (window.FW && FW.sfx) FW.sfx('great_shine', { vol: .75 });
        this.spawnVfx('shine', { dur: 680 });
        this.flash('#fff6b0');
        await this.wait(500);
        break;
      }

      case 'pirouette': {
        this.setUnitAnim(fl, { frames: ['flowery_pirouette_0', 'flowery_pirouette_1', 'flowery_pirouette_2', 'flowery_pirouette_3', 'flowery_pirouette_4', 'flowery_pirouette_5', 'flowery_pirouette_6', 'flowery_pirouette_7'], fps: 12 }, 720);
        if (window.FW && FW.voiceLine) FW.voiceLine(null, 'spiral', '');
        this.spawnVfx('shine', { dur: 600 });
        await this.wait(480);
        break;
      }

      case 'friendMove': {
        if (!a) break;
        if (e.key === 'flYellow' && e.moveName === 'Punishment Gun') {
          await this.flCut('punishGun');
          this.setUnitAnim(a, { frames: ['yellow_punish_gun_0', 'yellow_punish_gun_1', 'yellow_punish_gun_2', 'yellow_punish_gun_3', 'yellow_punish_gun_4', 'yellow_punish_gun_5'], fps: 11 }, 750);
          if (window.FW && FW.sfx) FW.sfx('chargeshot_fire', { vol: .85 });
          this.spawnVfx('punishLaser', { dur: 700 });
          this.flash('#ffe066');
          this.shake(true);
          await this.wait(520);
        } else if (e.key === 'flYellow') {
          this.setUnitAnim(a, { frames: ['yellow_hat_spin_0', 'yellow_hat_spin_1', 'yellow_hat_spin_2', 'yellow_hat_spin_3'], fps: 10 }, 520);
        } else if (e.key === 'flOrange') {
          this.setUnitAnim(a, { frames: ['orange_animepunch_0', 'orange_animepunch_1', 'orange_animepunch_2', 'orange_animepunch_3', 'orange_animepunch_4', 'orange_animepunch_5', 'orange_animepunch_finished_0', 'orange_animepunch_finished_1'], fps: 14 }, 650);
          if (e.moveName === 'Anime Punch') {
            this.spawnVfx('orangePunch', { dur: 560 });
            if (window.FW && FW.sfx) FW.sfx('punchheavythunder', { vol: .7 });
          }
        } else if (e.key === 'flBlue') {
          this.setUnitAnim(a, { frames: ['blue_poses_2_0', 'blue_poses_2_1', 'blue_poses_2_2', 'blue_poses_2_3', 'blue_poses_2_4'], fps: 10 }, 620);
          if (e.moveName === 'Butterfly Waltz') this.spawnVfx('blueWaltz', { dur: 650 });
        } else if (e.key === 'flGreen') {
          this.setUnitAnim(a, { frames: ['enemy_green_pan_widerswing_0', 'enemy_green_pan_widerswing_1', 'enemy_green_pan_widerswing_2'], fps: 10 }, 580);
          this.spawnVfx('greenPan', { dur: 600 });
        } else if (e.key === 'flSeth') {
          this.setUnitAnim(a, e.moveName === 'Adjust Glasses'
            ? { frames: ['seth_glasses_shiny_0', 'seth_glasses_shiny_1', 'seth_glasses_shiny_2', 'seth_glasses_shiny_3', 'seth_glasses_shiny_4'], fps: 11 }
            : { frames: ['seth_throw_0', 'seth_throw_1', 'seth_throw_2', 'seth_throw_3', 'seth_throw_4', 'seth_throw_5'], fps: 12 }, 580);
        } else if (e.key === 'flAqua') {
          this.setUnitAnim(a, e.moveName === 'Uuu!'
            ? { frames: ['aqua_clapping_0', 'aqua_clapping_1', 'aqua_clapping_2', 'aqua_clapping_3'], fps: 10 }
            : { frames: ['aqua_spin_0', 'aqua_spin_1', 'aqua_spin_2', 'aqua_spin_3'], fps: 12 }, 560);
        }
        break;
      }

      case 'bars':
        this.refreshUnit(t);
        break;

      case 'reload': {
        const s = document.createElement('div');
        s.className = 'fl-save';
        s.innerHTML = '<b>LOAD</b><span>FILE 1 · Flowery · TOP OF CASTLE</span>';
        this.root.appendChild(s);
        if (window.FW && FW.sfx) FW.sfx('save', { vol: .6 });
        await this.wait(900);
        s.remove();
        this.refreshUnit(t);
        this.pop(t, 'LOADED', 'heal');
        this.say(e.text, 'big');
        await this.wait(800);
        break;
      }

      case 'skip': {
        const strip = this.root.querySelector('.stb-order');
        if (strip) strip.classList.add('fl-cut');
        await this.flBubble(fl, 'Turn order? Never heard of it!', 'take_that', 'face_flowery_23');
        if (strip) setTimeout(() => strip.classList.remove('fl-cut'), 900);
        break;
      }

      case 'steal': {
        const it = ST_ITEMS[e.item] || { name: e.item };
        const n = this.unitEl(fl);
        const img = document.createElement('img');
        img.className = 'fl-loot';
        img.src = it.icon ? (it.icon.startsWith('data:') || it.icon.startsWith('http') ? it.icon : ASSET + it.icon) : '';
        const dock = $('#allyDock'), from = center(dock), to = n ? center(n) : { x: innerWidth * .7, y: innerHeight * .4 };
        img.style.left = from.x + 'px';
        img.style.top = from.y + 'px';
        document.body.appendChild(img);
        await wait(30);
        img.style.left = to.x + 'px';
        img.style.top = to.y + 'px';
        if (window.FW && FW.sfx) FW.sfx('grab', { vol: .6 });
        await this.wait(700);
        img.remove();
        await this.flBubble(fl, `Ooh, a ${it.name}. Mine now!`, 'its_all_yours', 'face_flowery_2');
        this.say(`Flowery took a <b>${it.name}</b> out of your pocket.`, 'big');
        break;
      }

      case 'edit': {
        const n = this.unitEl(fl);
        const box = document.createElement('div');
        box.className = 'fl-edit';
        box.innerHTML = '<span>DMG ×</span><b>1.00</b>';
        (n || this.root).appendChild(box);
        const num = box.querySelector('b');
        for (const s of ['1.0', '1.', '1', '', '0', '0.', '0.2', '0.20']) {
          num.textContent = s + '▌';
          if (window.FW && FW.sfx) FW.sfx('text', { vol: .4 });
          await wait(100);
        }
        num.textContent = '0.20';
        await this.flBubble(fl, 'There! That\'s a much nicer number.', 'plant', 'face_flowery_23');
        box.remove();
        break;
      }

      case 'swap': {
        this.flash('#ffe066');
        if (window.FW && FW.sfx) FW.sfx('spellcast', { vol: .6 });
        await this.flBubble(fl, 'Trade you! ...No take-backs!', 'hah', 'face_flowery_27');
        break;
      }

      case 'mute': {
        const cmd = this.el.cmd;
        cmd.classList.add('fl-tape');
        await this.flBubble(fl, 'SKILLS are on break. Union rules!', 'forget_it', 'face_flowery_23');
        setTimeout(() => cmd.classList.remove('fl-tape'), 1600);
        break;
      }

      case 'pause': {
        const p = document.createElement('div');
        p.className = 'fl-pause';
        p.innerHTML = '<div><b>PAUSED</b><button type="button" disabled>RESUME</button><button type="button" disabled>QUIT</button></div>';
        this.root.appendChild(p);
        if (typeof Music !== 'undefined' && Music.pause) Music.pause();
        if (window.FW && FW.sfx) FW.sfx('menumove', { vol: .6 });
        const btn = $('#btnQuit');
        if (btn && this.flMode === 'hard') {
          const n = this.unitEl(fl), start = n ? center(n) : { x: innerWidth * .7, y: innerHeight * .5 }, end = center(btn);
          const w = await walker(start, { x: end.x - 30, y: end.y + 30 }, 1050);
          btn.classList.add('fl-hold');
          w.src = frameUrl('flowery_gestureup_right_0', 3);
          await this.flBubble(fl, 'Paused. Not for you, for ME. Snack break!', 'sanfran', 'face_flowery_27');
          btn.classList.remove('fl-hold');
          w.remove();
        } else {
          await this.flBubble(fl, 'Time-out! Even the star of the show needs a breather!', 'sanfran', 'face_flowery_27');
        }
        p.remove();
        try { Music.play('flBoss'); } catch (_) { /* optional */ }
        break;
      }

      case 'ralsei': {
        const r = document.createElement('img');
        r.className = 'fl-ralsei';
        r.src = frameUrl('ralsei_spell_6', 3) || frameUrl('ralsei_walk_right_0', 3);
        this.root.appendChild(r);
        if (window.FW && FW.sfx) FW.sfx('spellcast', { vol: .55 });
        this.say('<b style="color:#7fe07f">Ralsei</b> · Heal Prayer! "Don\'t give up—we can reach him!"', 'big');
        await this.wait(850);
        r.remove();
        break;
      }
    }
  };

  UI.startFl = function (mode, done) {
    if (typeof BattleScreen !== 'undefined' && BattleScreen.active) return;
    this.flDone = done; this.flMode = mode; this.speed = 1; this.auto = false;
    const hard = mode === 'hard';
    const n = {
      name: 'Sanctuary of Seven Suns', bg: '', music: 'flBoss', tier: 5, fl: true,
      [mode]: [[[hard ? 'flFloweryHard' : 'flFlowery', 1, { boss: true }]]]
    };
    const items = hard
      ? { bandage: 2, medkit: 1, pop: 1, jumper: 1, barrier: 3, jawbreaker: 1 }
      : { bandage: 3, medkit: 2, pop: 2, jumper: 1, barrier: 2, jawbreaker: 1 };
    this.run = { i: -1, n, mode, ids: ['Scraps', 'Ginger', 'Yatta'], wave: 0, carry: {}, items, base: Object.assign({}, items), stock: null, exp: 0, killed: 0, ch: 3 };
    if (typeof StoryUI !== 'undefined') StoryUI.overlay = true;
    if (typeof MUSIC_TRACKS !== 'undefined' && P().music.flBoss) MUSIC_TRACKS.flBoss = P().music.flBoss;
    this.build();
    this.arena.classList.add('fl-story');
    const ab = $('#btnAuto');
    if (ab) {
      ab.classList.add('fl-broken');
      ab.onclick = () => { Sound.play('ui_err'); this.say('<b class="foe">Flowery</b> · Still broken! I checked!', 'big'); };
    }
    this.launchWave();
  };

  UI.launchWave = function () {
    const r = this.run, n = r.n, hard = r.mode === 'hard';
    const c = TUNE[r.mode];
    const foes = n[r.mode][0].map(([k, , x]) => [k, c.flv, Object.assign({}, x || {}, { mult: Object.assign({}, c.mult) })]);
    const plv = c.plv;
    const party = r.ids.map(id => ({ sq: null, tm: null, rank: hard ? 3 : 2, id, lv: plv, row: 'front', hp: null, bond: hard ? 0 : 20 }));
    this.B = new StoryBattle({ party, foes, items: r.items, tier: 5, unlocked: () => true });
    this.B.fl = hard ? 'hard' : 'easy';
    this.B.flReloaded = {};
    this.hazardTurns = 0;
    this.el.wave.textContent = hard ? 'Sanctuary Roof · HARD' : 'Sanctuary of Seven Suns';
    this.el.turn.textContent = 'TURN 1';
    clear(this.el.units);
    this.drawParty();
    this.drawFoes();
    this.drawDock();
    this.drawOrder();
    this.startBossAnimation();
    this.el.cmd.innerHTML = '';
    Music.play('flBoss');
    Sound.play('apex_trial_warning', { vol: .45 });
    this.flCut('vs').then(() => setTimeout(() => this.loop(), 250));
  };

  UI.lobbyReturn = () => false;
  UI.say = function (text, cls) {
    return StoryBattleUI.say.call(this, String(text).replace('calls more Ichor!', 'calls a petal friend onto the stage!'), cls);
  };

  UI.storyHazard = function (B) {
    const ev = [], t = ++this.hazardTurns, party = B.living('p'), fl = B.living('e').find(isFl);
    if (!party.length || !fl) return ev;
    if (t % (B.fl === 'hard' ? 7 : 5) === 0) {
      const low = party.slice().sort((a, b) => a.hp / a.max.hp - b.hp / b.max.hp)[0];
      ev.push({ t: 'fl', k: 'ralsei', target: low.uid });
      B.healRaw(low, low.max.hp * (B.fl === 'hard' ? .25 : .36), ev, 'Heal Prayer');
      const ko = B.party().find(x => !x.alive);
      if (ko && B.fl === 'easy') B.revive(ko, .35, ev);
    }
    return ev;
  };

  UI.play = async function (events) {
    let run = [];
    for (const e of events) {
      if (e.t === 'fl') {
        if (run.length) { await StoryBattleUI.play.call(this, run); run = []; }
        if (!this.root || !this.root.isConnected) return;
        await this.flRun(e);
      } else run.push(e);
    }
    if (run.length) await StoryBattleUI.play.call(this, run);
  };

  const refresh0 = StoryBattleUI.refreshUnit;
  UI.refreshUnit = function (u) {
    refresh0.call(this, u);
    if (u && isFl(u) && u.def.flBars) {
      const n = this.unitEl(u);
      const pl = n && n.querySelector('.nameplate');
      if (pl) pl.dataset.bar = `${u.flBar || 1}/${u.def.flBars}`;
    }
  };

  UI.victory = function () {
    Sound.play('arena_fanfare', { vol: .5 });
    const done = this.flDone; this.flDone = null;
    this.closeBattle(true);
    $('#battle').hidden = true;
    if (typeof StoryUI !== 'undefined') StoryUI.overlay = false;
    if (done) done('win');
  };

  UI.defeat = function () {
    const r = this.run;
    this.arena.classList.add('stb-lost');
    Music.play('stEmotional');
    const st = (() => { try { const s = Raid.state(); return s.flowery || (s.flowery = {}); } catch (_) { return {}; } })();
    st.losses = (st.losses || 0) + 1;
    try { Save.write(); } catch (_) { /* optional */ }
    this.el.cmd.innerHTML = `<div class="ms-defeat"><b>${r.mode === 'hard' ? 'FLOWERY WINS. AGAIN.' : 'FLOWERY WINS'}</b><p>${r.mode === 'hard' ? '"You can keep trying. I\'ll keep cheating."' : '"Take five, cartoons! Ready for another take?"'}</p>
      <div><button data-d="retry">Try again</button><button data-d="leave">Leave</button></div></div>`;
    this.el.cmd.querySelector('[data-d="retry"]').onclick = () => {
      Sound.play('choose');
      const done = this.flDone, mode = r.mode;
      this.closeBattle(true);
      this.startFl(mode, done);
    };
    this.el.cmd.querySelector('[data-d="leave"]').onclick = () => {
      Sound.play('ui_back');
      const done = this.flDone; this.flDone = null;
      this.closeBattle(true);
      $('#battle').hidden = true;
      if (typeof StoryUI !== 'undefined') StoryUI.overlay = false;
      if (done) done('quit');
    };
  };

  UI.confirmQuit = function () {
    if (this.root.querySelector('.ms-quit')) return;
    const q = el('div', 'ms-quit', '<div><b>Retreat?</b><p>Flowery will call it a forfeit.</p><button data-q="y">Retreat</button><button data-q="n">Keep fighting</button></div>');
    this.root.appendChild(q);
    q.querySelector('[data-q="n"]').onclick = () => q.remove();
    q.querySelector('[data-q="y"]').onclick = () => {
      const done = this.flDone; this.flDone = null;
      this.closeBattle(true);
      $('#battle').hidden = true;
      if (typeof StoryUI !== 'undefined') StoryUI.overlay = false;
      if (done) done('quit');
    };
  };

  UI.closeBattle = function (keep) {
    this.stopBossAnimation();
    if (this.arena) this.arena.classList.remove('fl-story');
    const ab = $('#btnAuto');
    if (ab) ab.classList.remove('fl-broken');
    document.querySelectorAll('.fl-walker,.fl-loot').forEach(x => x.remove());
    return StoryBattleUI.closeBattle.call(this, keep);
  };

  function run(S, mode) {
    return new Promise(res => {
      const root = S && S.root;
      if (root) root.style.display = 'none';
      UI.startFl(mode === 'hard' ? 'hard' : 'easy', r => {
        if (r === 'win') {
          try {
            const st = Raid.state(), f = st.flowery || (st.flowery = {});
            if (mode === 'hard') f.beatenHard = true; else f.beaten = true;
            Save.write();
          } catch (_) { /* optional */ }
        }
        if (root) root.style.display = '';
        $('#app').hidden = true;
        res(r);
      });
    });
  }

  window.FlStoryBoss = { run, UI, TUNE };
})();
