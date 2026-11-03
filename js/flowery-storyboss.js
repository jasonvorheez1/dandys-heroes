/* flowery-storyboss.js - the "Flower Kingdom" boss on the Main Story's own turn-based battle (story-battle.js / story-engine.js,
   Chapter 3 rules: lethal strikes, Barrier Signs, Break, Bond). Nothing from Deltarune's battle system is used.
   - Easy (segment 9, the story): one health bar, his friends come out at 66% and 33%.
   - Hard (the rematch on the event menu): Flowery cheats. Three health bars (the first two are "tutorial" bars), he skips the
     turn order, steals items, types smaller damage numbers in, swaps HP with you, pauses the game, and walks across the HUD
     to do it. A Break cancels his number edits.
   Ginger and Yatta get story kits here (event only); Scraps uses her Chapter 2 kit. Ralsei helps from the side. */
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

  /* ---------------------------------------------------------------- the enemies (art 'f:frame' is a flowery.bin frame) */
  const FRIEND = (o) => Object.assign({ stagger: 20, exp: 4, flFriend: true }, o);
  Object.assign(ST_ENEMIES, {
    flFloradinn: { name: 'Floradinn', art: 'f:enemy_floradin_flipped_0', hp: 120, atk: 11, mag: 7, def: 12, mdef: 8, spd: 10, stagger: 14, exp: 2,
      moves: [{ name: 'Sunflower Sword', kind: 'phys', power: 1.0, w: 3 }, { name: 'En Garde', kind: 'selfbuff', buff: 'defUp', w: 1 }] },
    flSeth: FRIEND({ name: 'Seth', art: 'f:seth_idle_0', hp: 170, atk: 9, mag: 14, def: 10, mdef: 13, spd: 10.5,
      moves: [{ name: 'Book Toss', kind: 'mag', power: 1.0, w: 3 }, { name: 'List of Weaknesses', kind: 'mag', power: .4, target: 'all', debuff: 'defDown', w: 2, cd: 3 },
        { name: 'Adjust Glasses', kind: 'selfbuff', buff: 'defUp', w: 1, cd: 3 }] }),
    flAqua: FRIEND({ name: 'Aqua', art: 'f:aqua_centered_0', hp: 160, atk: 14, mag: 8, def: 9, mdef: 9, spd: 13,
      moves: [{ name: 'Knife Spin', kind: 'phys', power: .5, hits: 3, target: 'random', w: 3 }, { name: 'Uuu!', kind: 'allyheal', power: .2, w: 1, cd: 3 }] }),
    flGreen: FRIEND({ name: 'Green', art: 'f:enemy_green_0', hp: 230, atk: 12, mag: 10, def: 14, mdef: 11, spd: 9,
      moves: [{ name: 'Pan Smack', kind: 'phys', power: 1.1, w: 3 }, { name: 'Today’s Special', kind: 'allyheal', power: .24, w: 2, cd: 3 }] }),
    flOrange: FRIEND({ name: 'Orange', art: 'f:orange_proud_left_0', hp: 150, atk: 15, mag: 6, def: 8, mdef: 8, spd: 14,
      moves: [{ name: 'Anime Punch', kind: 'phys', power: 1.25, w: 3 }, { name: 'I’m Telling!', kind: 'selfbuff', buff: 'atkUp', w: 1, cd: 3 }] }),
    flBlue: FRIEND({ name: 'Blue', art: 'f:blue_poses_0', hp: 180, atk: 9, mag: 14, def: 10, mdef: 13, spd: 12,
      moves: [{ name: 'Butterfly Waltz', kind: 'mag', power: .55, target: 'all', slow: .4, w: 3 }, { name: 'Messengers of Love', kind: 'allybuff', buff: 'defUp', w: 1, cd: 3 }] }),
    flYellow: FRIEND({ name: 'Yellow', art: 'f:yellow_quarter_0', hp: 200, atk: 15, mag: 8, def: 12, mdef: 10, spd: 11,
      moves: [{ name: 'Hat Toss', kind: 'phys', power: .85, w: 2 },
        { name: 'Punishment Gun', kind: 'phys', power: 1.5, lethal: true, tele: 'Yellow cocks the Punishment Gun. "Hold it right there, varmint."', w: 2, cd: 3 }] }),

    // Easy: the story fight
    flFlowery: { name: 'Flowery', art: 'f:flowery_idle3_0', hp: 640, atk: 13, mag: 13, def: 14, mdef: 14, spd: 13, stagger: 44, exp: 24, boss: true,
      moves: [
        { name: 'Flash Kick', kind: 'phys', power: 1.15, w: 3 },
        { name: 'Bouquet Toss', kind: 'mag', power: .55, hits: 3, target: 'random', w: 3 },
        { name: 'Teeth Shine', kind: 'mag', power: .45, target: 'all', debuff: 'atkDown', w: 2, cd: 3 },
        { name: 'Pirouette', kind: 'selfbuff', buff: 'shield', w: 1, cd: 4 },
        { name: 'Jarona', kind: 'phys', power: 1.5, tele: 'Flowery winds up his fist. "Heh. It\'s my Jarona."', w: 2, cd: 4 },
        { name: 'Pause', kind: 'flPause', heal: .05, w: 1, cd: 6 }
      ],
      phases: [{ at: .66, text: 'Flowery whistles. Seth and Aqua come running.', summon: ['flSeth', 'flAqua'] },
        { at: .33, text: '"Petals! Everybody!" Green and Orange climb up onto the roof.', buff: 'atkUp', summon: ['flGreen', 'flOrange'] }] },

    // Hard: the rematch. He cheats.
    flFloweryHard: { name: 'Flowery', art: 'f:flowery_idle3_0', hp: 760, atk: 14, mag: 14, def: 15, mdef: 15, spd: 13.5, stagger: 56, exp: 60, boss: true, flBars: 3,
      moves: [
        { name: 'Flash Kick', kind: 'phys', power: 1.35, w: 3 },
        { name: 'Bouquet Toss', kind: 'mag', power: .62, hits: 3, target: 'random', ink: .2, w: 3 },
        { name: 'Teeth Shine', kind: 'mag', power: .55, target: 'all', debuff: 'atkDown', w: 2, cd: 3 },
        { name: 'Hair Flip', kind: 'phys', power: .8, target: 'all', slow: .5, w: 2, cd: 2 },
        { name: 'Jarona', kind: 'phys', power: 1.7, lethal: true, tele: 'Flowery winds up his fist and picks one of you. "Heh. It\'s my Jarona."', w: 3, cd: 3 },
        { name: 'Skip the Line', kind: 'flSkip', power: 1.1, w: 2, cd: 3 },
        { name: 'Five-Finger Bouquet', kind: 'flSteal', w: 2, cd: 4 },
        { name: 'Number Edit', kind: 'flEdit', w: 2, cd: 5 },
        { name: 'Trade You', kind: 'flSwap', w: 1, cd: 6 },
        { name: 'Intermission', kind: 'flMute', w: 1, cd: 5 },
        { name: 'Pause', kind: 'flPause', heal: .1, w: 1, cd: 6 },
        { name: 'All According to Plant', kind: 'summon', summon: 'flFloradinn', w: 1, cd: 5 }
      ],
      flPhases: {
        1: [{ at: .5, text: '"Floradinns! Front and center!"', summon: ['flFloradinn', 'flFloradinn'] }],
        2: [{ at: .5, text: 'Green and Orange climb up onto the roof. Orange is shaking. He climbs anyway.', summon: ['flGreen', 'flOrange'] }],
        3: [{ at: .5, text: 'Flowery stops smiling.', buff: 'defUp' }, { at: .2, text: '"Not yet. I said NOT YET."', heal: .1 }]
      } }
  });

  /* ---------------------------------------------------------------- engine rules for his fight (only when B.fl is set) */
  const SP = StoryBattle.prototype;
  const kill0 = SP.kill, hit0 = SP.hit, enemyAct0 = SP.enemyAct, breakFoe0 = SP.breakFoe, checkPhases0 = SP.checkPhases, endTurn0 = SP.endTurn;
  const isFl = u => u && u.side === 'e' && u.def && (u.key === 'flFlowery' || u.key === 'flFloweryHard');

  // the "tutorial" health bars: at zero he fills back up, until the last one
  SP.kill = function (u, ev) {
    if (this.fl && isFl(u) && u.def.flBars && (u.flBar || 1) < u.def.flBars) {
      u.flBar = (u.flBar || 1) + 1;
      u.hp = u.max.hp; u.st = {}; u.tele = null; u.flEdit = 0;
      if (u.stagger) { u.stagger.cur = 0; u.stagger.broken = 0; }
      ev.push({ t: 'fl', k: 'fakeWin', target: u.uid, bar: u.flBar });
      if (u.flBar === 2) {
        ev.push({ t: 'fl', k: 'line', actor: u.uid, clip: 'hah', text: 'Hah! That was the tutorial health bar.' });
        this.apply(u, u, 'atkUp', 4, null, ev);
        this.summon(u, 'flSeth', ev); this.summon(u, 'flAqua', ev);
      } else {
        ev.push({ t: 'fl', k: 'line', actor: u.uid, clip: 'nonono', text: 'No no no. That one was ALSO the tutorial.' });
        this.apply(u, u, 'haste', 4, null, ev); this.apply(u, u, 'regen', 99, { v: .015 }, ev);
        this.summon(u, 'flYellow', ev); this.summon(u, 'flBlue', ev);
      }
      ev.push({ t: 'fl', k: 'bars', target: u.uid });
      // while he resets his bar, Ralsei gets everyone back on their feet
      ev.push({ t: 'fl', k: 'ralsei', target: u.uid, text: 'Now, while he\'s resetting! Everyone, hold still!' });
      this.party().forEach(p => { if (!p.alive) this.revive(p, .5, ev); else this.healRaw(p, p.max.hp * .4, ev, 'Heal Prayer'); p.fp = Math.min(p.max.fp, p.fp + 10); });
      return;
    }
    // a friend goes down: on Hard he loads a save, once per friend
    if (this.fl === 'hard' && u.side === 'e' && u.def && u.def.flFriend && !this.flReloaded[u.key] && this.living('e').some(isFl)) {
      this.flReloaded[u.key] = true;
      u.hp = Math.round(u.max.hp * .5); u.st = {}; u.tele = null;
      ev.push({ t: 'fl', k: 'reload', target: u.uid, actor: this.living('e').find(isFl).uid, text: `"Nope. Loading my save." ${u.name} is back.` });
      ev.push({ t: 'heal', target: u.uid, amount: u.hp, tag: 'Load Save' });
      return;
    }
    return kill0.call(this, u, ev);
  };
  // Number Edit: he typed a smaller number in
  SP.hit = function (src, tgt, power, kind, ev, o) {
    if (this.fl && tgt && isFl(tgt) && tgt.flEdit > 0 && src && src.side === 'p') o = Object.assign({}, o || {}, { mult: ((o && o.mult) || 1) * .2 });
    return hit0.call(this, src, tgt, power, kind, ev, o);
  };
  SP.breakFoe = function (u, ev) {
    if (this.fl && isFl(u) && u.flEdit) { u.flEdit = 0; ev.push({ t: 'text', text: 'The Break knocks his edit loose. Damage is back to normal.', actor: u.uid, cls: 'break' }); }
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
  // per-bar phases on Hard
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
  // his cheats
  SP.enemyAct = function (u) {
    if (!this.fl || u.tele) return enemyAct0.call(this, u);
    // let the game pick the move as usual, then run ours if it's a cheat
    const opts = u.def.moves.filter(m => !(u.cds[m.name] > 0) && !(m.kind === 'summon' && this.living('e').length >= ST_MAX_FOES));
    const cheat = opts.filter(m => /^fl/.test(m.kind));
    const tot = opts.reduce((a, m) => a + m.w, 0);
    let r = this.rng() * tot, move = opts.find(m => (r -= m.w) <= 0) || opts[0];
    if (!move || !/^fl/.test(move.kind) || !cheat.length) {
      // re-roll among the normal moves through the game's own picker
      const keep = u.def.moves; u.def = Object.assign({}, u.def, { moves: keep.filter(m => !/^fl/.test(m.kind)) });
      try { return enemyAct0.call(this, u); } finally { u.def = Object.assign({}, u.def, { moves: keep }); }
    }
    if (move.cd) u.cds[move.name] = move.cd;
    const ev = [];
    ev.push({ t: 'act', actor: u.uid, name: move.name, kind: 'enemy', big: true });
    const party = this.living('p');
    switch (move.kind) {
      case 'flSkip': {
        ev.push({ t: 'fl', k: 'skip', actor: u.uid });
        const t = this.pickTarget(u, move); if (t) this.hit(u, t, move.power, 'phys', ev, { stagger: 0 });
        u.flSkipNow = true;
        break;
      }
      case 'flSteal': {
        const order = ['medkit', 'jumper', 'jawbreaker', 'bandage', 'tonic', 'pop', 'speed', 'stealth', 'barrier'];
        const k = order.find(x => (this.items[x] || 0) > 0);
        if (k) { this.items[k]--; ev.push({ t: 'fl', k: 'steal', actor: u.uid, item: k }); }
        else { ev.push({ t: 'fl', k: 'line', actor: u.uid, clip: 'huh', text: 'Your pockets are empty. Huh. I\'ll take FP then.' }); party.forEach(p => { const n = Math.min(p.fp, 6); if (n) { p.fp -= n; ev.push({ t: 'fp', target: p.uid, amount: -n }); } }); }
        break;
      }
      case 'flEdit':
        u.flEdit = 3;
        ev.push({ t: 'fl', k: 'edit', actor: u.uid });
        ev.push({ t: 'text', text: 'Flowery edited the damage numbers. Your hits do 20% until he’s Broken.', actor: u.uid, cls: 'big' });
        break;
      case 'flSwap': {
        const t = party.slice().sort((a, b) => b.hp / b.max.hp - a.hp / a.max.hp)[0];
        if (t && t.hp / t.max.hp > u.hp / u.max.hp) {
          const a = u.hp / u.max.hp, b = t.hp / t.max.hp;
          ev.push({ t: 'fl', k: 'swap', actor: u.uid, target: t.uid });
          const tNew = Math.max(1, Math.round(t.max.hp * a)), uNew = Math.round(u.max.hp * b);
          ev.push({ t: 'dot', target: t.uid, amount: t.hp - tNew, kind: 'swap' }); t.hp = tNew;
          ev.push({ t: 'heal', target: u.uid, amount: uNew - u.hp, tag: 'Trade' }); u.hp = uNew;
        } else { ev.push({ t: 'fl', k: 'line', actor: u.uid, clip: 'forget_it', text: 'Eh. Your HP\'s worse than mine. Forget it.' }); this.apply(u, u, 'atkUp', 3, null, ev); }
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
    }
    this.endTurn(u, ev);
    return ev;
  };

  /* ---------------------------------------------------------------- the battle screen for his fight */
  /* balance (tools/flowery/boss_sim.js, autoplay): Easy wins about 90% like a Chapter 3 Easy boss; Hard about 7%. */
  const TUNE = {
    easy: { plv: 50, flv: 48, mult: { hp: 1, atk: .42, def: 1 } },
    hard: { plv: 56, flv: 58, mult: { hp: .45, atk: .32, def: 1 } }
  };
  const UI = Object.create(StoryBattleUI);
  UI.art = function (u) {
    if (u.side === 'e' && u.def && u.def.art && u.def.art.startsWith('f:')) return P().url(u.def.art.slice(2), 4);
    return StoryBattleUI.art.call(this, u);
  };
  const makeUnit0 = StoryBattleUI.makeUnit;
  UI.makeUnit = function (u) { const n = makeUnit0.call(this, u); if (u.side === 'e' && u.def.art.startsWith('f:')) n.classList.add('fl-pix'); return n; };
  function arenaBg() {
    const c = document.createElement('canvas'); c.width = 640; c.height = 360;
    const x = c.getContext('2d'); x.imageSmoothingEnabled = false; x.scale(2, 1.5);
    if (window.FlArena) FlArena.bg(x, 0, {}); else { x.fillStyle = '#100'; x.fillRect(0, 0, 320, 240); }
    return c.toDataURL('image/png');
  }

  UI.startFl = function (mode, done) {
    if (typeof BattleScreen !== 'undefined' && BattleScreen.active) return;
    this.flDone = done; this.flMode = mode; this.speed = 1; this.auto = false;
    const hard = mode === 'hard';
    const n = { name: hard ? 'Top of Castle' : 'Top of Castle', bg: '', music: 'flBoss', tier: 5, fl: true,
      [mode]: [[[hard ? 'flFloweryHard' : 'flFlowery', 1, { boss: true }]]] };
    const items = hard ? { bandage: 2, medkit: 1, pop: 1, jumper: 1, barrier: 3, jawbreaker: 1 } : { bandage: 3, medkit: 2, pop: 2, jumper: 1, barrier: 2, jawbreaker: 1 };
    this.run = { i: -1, n, mode, ids: ['Scraps', 'Ginger', 'Yatta'], wave: 0, carry: {}, items, base: Object.assign({}, items), stock: null, exp: 0, killed: 0, ch: 3 };
    if (typeof StoryUI !== 'undefined') StoryUI.overlay = true;
    if (typeof MUSIC_TRACKS !== 'undefined' && P().music.flBoss) MUSIC_TRACKS.flBoss = P().music.flBoss;
    this.build();
    $('#bgLayer').style.backgroundImage = `url("${arenaBg()}")`;
    this.arena.classList.add('fl-story');
    // he broke the AUTO button on the way in; it stays broken for his fight
    const ab = $('#btnAuto'); if (ab) { ab.classList.add('fl-broken'); ab.onclick = () => { Sound.play('ui_err'); this.say('<b class="foe">Flowery</b> · Still broken. I checked.', 'big'); }; }
    this.launchWave();
  };
  UI.launchWave = function () {
    const r = this.run, n = r.n, hard = r.mode === 'hard';
    const c = TUNE[r.mode];
    const foes = n[r.mode][0].map(([k, , x]) => [k, c.flv, Object.assign({}, x || {}, { mult: Object.assign({}, c.mult) })]);
    const plv = c.plv;
    const party = r.ids.map(id => ({ sq: null, tm: null, rank: hard ? 3 : 2, id, lv: plv, row: 'front', hp: null, bond: hard ? 0 : 20 }));
    this.B = new StoryBattle({ party, foes, items: r.items, tier: 5, unlocked: () => true });
    this.B.fl = hard ? 'hard' : 'easy'; this.B.flReloaded = {};
    this.hazardTurns = 0;
    this.el.wave.textContent = hard ? 'Top of Castle  ·  HARD' : 'Top of Castle';
    this.el.turn.textContent = 'TURN 1';
    clear(this.el.units);
    this.drawParty(); this.drawFoes(); this.drawDock(); this.drawOrder();
    this.el.cmd.innerHTML = '';
    Music.play('flBoss');
    this.banner(hard ? 'FLOWERY · HARD' : 'FLOWERY', 'boss');
    Sound.play('apex_trial_warning', { vol: .45 });
    setTimeout(() => this.loop(), 1300);
  };
  UI.lobbyReturn = () => false;
  UI.say = function (text, cls) { return StoryBattleUI.say.call(this, String(text).replace('calls more Ichor!', 'calls a friend over!'), cls); };

  // Ralsei helps from the side: a heal every few turns. On Hard Flowery also cheats the turn order now and then.
  UI.storyHazard = function (B) {
    const ev = [], t = ++this.hazardTurns, party = B.living('p'), fl = B.living('e').find(isFl);
    if (!party.length || !fl) return ev;
    if (t % (B.fl === 'hard' ? 7 : 5) === 0) {
      const low = party.slice().sort((a, b) => a.hp / a.max.hp - b.hp / b.max.hp)[0];
      ev.push({ t: 'fl', k: 'ralsei', target: low.uid });
      B.healRaw(low, low.max.hp * (B.fl === 'hard' ? .25 : .35), ev, 'Heal Prayer');
      const ko = B.party().find(x => !x.alive);
      if (ko && B.fl === 'easy') B.revive(ko, .3, ev);
    }
    return ev;
  };

  /* fourth-wall animations: Flowery's own sprite walking over the real battle HUD */
  function walker(from, to, ms) {
    const img = document.createElement('img'); img.className = 'fl-walker';
    document.body.appendChild(img);
    const dir = to.x < from.x ? 'left' : 'right', frames = [0, 1, 2, 3].map(i => P().url(`flowery_walk_${dir}_jacket_${i}`, 3));
    return new Promise(res => {
      const t0 = performance.now();
      const step = now => {
        const k = Math.min(1, (now - t0) / ms); img.src = frames[Math.floor(now / 110) % 4];
        img.style.left = (from.x + (to.x - from.x) * k) + 'px'; img.style.top = (from.y + (to.y - from.y) * k) + 'px';
        if (k < 1) requestAnimationFrame(step); else res(img);
      };
      requestAnimationFrame(step);
    });
  }
  const center = el => { const r = el.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; };
  UI.flBubble = async function (u, text, clip) {
    if (clip && FW.voiceLine) FW.voiceLine(null, clip, '');
    const n = this.unitEl(u); if (!n) { this.say(`<b class="foe">Flowery</b> · ${text}`, 'big'); await this.wait(1400); return; }
    const b = document.createElement('div'); b.className = 'fl-bubble'; n.appendChild(b);
    for (let i = 1; i <= text.length; i++) { b.textContent = text.slice(0, i); if (i % 2) FlPack.play && FlPack.play('voice:noise' + (1 + (i % 3)), .5); await wait(22); }
    await this.wait(900 + text.length * 25);
    b.remove();
  };
  UI.flRun = async function (e) {
    const B = this.B, U = id => B.units.find(x => x.uid === id), a = e.actor != null ? U(e.actor) : null, t = e.target != null ? U(e.target) : null;
    const fl = a || t;
    switch (e.k) {
      case 'line': await this.flBubble(a, e.text, e.clip); break;
      case 'fakeWin': {
        // a victory screen that isn't
        const v = document.createElement('div'); v.className = 'fl-fakewin';
        v.innerHTML = '<b>VICTORY</b><small>Flowery was defeated!</small>';
        this.root.appendChild(v); Sound.play('arena_fanfare', { vol: .45 });
        await this.wait(1500);
        v.classList.add('crack'); FW.sfx && FW.sfx('break2', { vol: .8 }); this.shake(true);
        await this.wait(700); v.remove();
        this.refreshUnit(t); this.flash('#fff');
        this.banner(`FLOWERY · BAR ${e.bar}/3`, 'boss');
        await this.wait(500);
        break;
      }
      case 'bars': this.refreshUnit(t); break;
      case 'reload': {
        const s = document.createElement('div'); s.className = 'fl-save'; s.innerHTML = '<b>LOAD</b><span>FILE 1 · Flowery · TOP OF CASTLE</span>';
        this.root.appendChild(s); FW.sfx && FW.sfx('save', { vol: .6 }); await this.wait(900); s.remove();
        this.refreshUnit(t); this.pop(t, 'LOADED', 'heal'); this.say(e.text, 'big'); await this.wait(800);
        break;
      }
      case 'skip': {
        // he drags himself to the front of the NEXT strip
        const strip = this.root.querySelector('.stb-order');
        if (strip) strip.classList.add('fl-cut');
        await this.flBubble(fl, 'Turn order? Never heard of it.', 'take_that');
        if (strip) setTimeout(() => strip.classList.remove('fl-cut'), 900);
        break;
      }
      case 'steal': {
        const it = ST_ITEMS[e.item] || { name: e.item };
        const n = this.unitEl(fl); const img = document.createElement('img'); img.className = 'fl-loot'; img.src = it.icon ? (it.icon.startsWith('data:') || it.icon.startsWith('http') ? it.icon : ASSET + it.icon) : '';
        const dock = $('#allyDock'), from = center(dock), to = n ? center(n) : { x: innerWidth * .7, y: innerHeight * .4 };
        img.style.left = from.x + 'px'; img.style.top = from.y + 'px'; document.body.appendChild(img);
        await wait(30); img.style.left = to.x + 'px'; img.style.top = to.y + 'px'; FW.sfx && FW.sfx('grab', { vol: .6 });
        await this.wait(700); img.remove();
        await this.flBubble(fl, `Ooh, a ${it.name}. Mine now.`, 'its_all_yours');
        this.say(`Flowery took a <b>${it.name}</b> out of your pocket.`, 'big');
        break;
      }
      case 'edit': {
        const n = this.unitEl(fl);
        const box = document.createElement('div'); box.className = 'fl-edit'; box.innerHTML = '<span>DMG ×</span><b>1.00</b>';
        (n || this.root).appendChild(box);
        const num = box.querySelector('b');
        for (const s of ['1.0', '1.', '1', '', '0', '0.', '0.2', '0.20']) { num.textContent = s + '▌'; FW.sfx && FW.sfx('text', { vol: .4 }); await wait(110); }
        num.textContent = '0.20';
        await this.flBubble(fl, 'There. That\'s a much nicer number.', 'plant');
        box.remove();
        break;
      }
      case 'swap': {
        this.flash('#ffe066'); FW.sfx && FW.sfx('spellcast', { vol: .6 });
        await this.flBubble(fl, 'Trade you! ...No take-backs.', 'hah');
        break;
      }
      case 'mute': {
        const cmd = this.el.cmd; cmd.classList.add('fl-tape');
        await this.flBubble(fl, 'SKILLS are on break. Union rules.', 'forget_it');
        setTimeout(() => cmd.classList.remove('fl-tape'), 1600);
        break;
      }
      case 'pause': {
        const p = document.createElement('div'); p.className = 'fl-pause';
        p.innerHTML = '<div><b>PAUSED</b><button type="button" disabled>RESUME</button><button type="button" disabled>QUIT</button></div>';
        this.root.appendChild(p); Music.pause && Music.pause(); FW.sfx && FW.sfx('menumove', { vol: .6 });
        const btn = $('#btnQuit');
        if (btn && this.flMode === 'hard') {
          const n = this.unitEl(fl), start = n ? center(n) : { x: innerWidth * .7, y: innerHeight * .5 }, end = center(btn);
          const w = await walker(start, { x: end.x - 30, y: end.y + 30 }, 1100);
          btn.classList.add('fl-hold'); w.src = P().url('flowery_gestureup_right_0', 3);
          await this.flBubble(fl, 'Paused. Not for you, for ME. Snack break.', 'sanfran');
          btn.classList.remove('fl-hold'); w.remove();
        } else await this.flBubble(fl, 'Hold on. Snack break.', 'sanfran');
        p.remove(); try { Music.play('flBoss'); } catch (_) { /* optional */ }
        break;
      }
      case 'ralsei': {
        const r = document.createElement('img'); r.className = 'fl-ralsei'; r.src = P().url('ralsei_spell_6', 3) || P().url('ralsei_walk_right_0', 3);
        this.root.appendChild(r); FW.sfx && FW.sfx('spellcast', { vol: .5 });
        this.say('<b style="color:#7fe07f">Ralsei</b> · Heal Prayer! (from the side)', 'big');
        await this.wait(900); r.remove();
        break;
      }
    }
  };
  // run our events between the game's own
  UI.play = async function (events) {
    let run = [];
    for (const e of events) {
      if (e.t === 'fl') { if (run.length) { await StoryBattleUI.play.call(this, run); run = []; } if (!this.root || !this.root.isConnected) return; await this.flRun(e); }
      else run.push(e);
    }
    if (run.length) await StoryBattleUI.play.call(this, run);
  };
  // the HP bar shows which tutorial bar he's on
  const refresh0 = StoryBattleUI.refreshUnit;
  UI.refreshUnit = function (u) {
    refresh0.call(this, u);
    if (u && isFl(u) && u.def.flBars) { const n = this.unitEl(u); const pl = n && n.querySelector('.nameplate'); if (pl) pl.dataset.bar = `${u.flBar || 1}/${u.def.flBars}`; }
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
    st.losses = (st.losses || 0) + 1; try { Save.write(); } catch (_) { /* optional */ }
    this.el.cmd.innerHTML = `<div class="ms-defeat"><b>${r.mode === 'hard' ? 'FLOWERY WINS. AGAIN.' : 'FLOWERY WINS'}</b><p>${r.mode === 'hard' ? '"You can keep trying. I\'ll keep cheating."' : '"Come on, princesses. Again!"'}</p>
      <div><button data-d="retry">Try again</button><button data-d="leave">Leave</button></div></div>`;
    this.el.cmd.querySelector('[data-d="retry"]').onclick = () => { Sound.play('choose'); const done = this.flDone, mode = r.mode; this.closeBattle(true); this.startFl(mode, done); };
    this.el.cmd.querySelector('[data-d="leave"]').onclick = () => { Sound.play('ui_back'); const done = this.flDone; this.flDone = null; this.closeBattle(true); $('#battle').hidden = true; if (typeof StoryUI !== 'undefined') StoryUI.overlay = false; if (done) done('quit'); };
  };
  UI.confirmQuit = function () {
    if (this.root.querySelector('.ms-quit')) return;
    const q = el('div', 'ms-quit', '<div><b>Retreat?</b><p>Flowery will call it a forfeit.</p><button data-q="y">Retreat</button><button data-q="n">Keep fighting</button></div>');
    this.root.appendChild(q);
    q.querySelector('[data-q="n"]').onclick = () => q.remove();
    q.querySelector('[data-q="y"]').onclick = () => { const done = this.flDone; this.flDone = null; this.closeBattle(true); $('#battle').hidden = true; if (typeof StoryUI !== 'undefined') StoryUI.overlay = false; if (done) done('quit'); };
  };
  UI.closeBattle = function (keep) {
    if (this.arena) this.arena.classList.remove('fl-story');
    const ab = $('#btnAuto'); if (ab) ab.classList.remove('fl-broken');
    document.querySelectorAll('.fl-walker,.fl-loot').forEach(x => x.remove());
    return StoryBattleUI.closeBattle.call(this, keep);
  };

  /* run it from the event: resolves 'win' or 'quit' */
  function run(S, mode) {
    return new Promise(res => {
      const root = S && S.root; if (root) root.style.display = 'none';
      UI.startFl(mode === 'hard' ? 'hard' : 'easy', r => {
        if (r === 'win') { try { const st = Raid.state(), f = st.flowery || (st.flowery = {}); if (mode === 'hard') f.beatenHard = true; else f.beaten = true; Save.write(); } catch (_) { /* optional */ } }
        if (root) root.style.display = ''; $('#app').hidden = true; res(r);
      });
    });
  }
  window.FlStoryBoss = { run, UI, TUNE };
})();
