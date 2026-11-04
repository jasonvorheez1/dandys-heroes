/* flowery-endgame.js - "Flower Kingdom" endgame: Jevil (the game files call him "joker") and Spamton NEO.
   Unlocks after all ten segments. A short cutscene in the Gardenview lobby (the door Scraps drew is still open; Ralsei came back
   to close it), then a fight on the Main Story's turn-based battle with any four from the story, everyone locked at level 99.
   Both bosses are far past Flowery Hard. Their big moves come with quick-time events (timing, mashing, dialing, picking the safe
   suit) that cut the damage a lot when you hit them and punish you a little extra when you don't. When both are standing they
   use team attacks with anime cut-ins. Ralsei is playable here. Balance: tools/flowery/endgame_sim.js. */
'use strict';

(() => {
  if (typeof StoryBattleUI === 'undefined' || typeof StoryBattle === 'undefined' || typeof ST_ENEMIES === 'undefined') return;
  const P = () => window.FlPack;
  const wait = ms => new Promise(r => setTimeout(r, ms));
  const sfx = (k, v) => { try { FW.sfx(k, { vol: v == null ? .6 : v }); } catch (_) { /* audio is decoration */ } };

  /* ---------------------------------------------------------------- Spamton NEO, assembled from his parts (they share one canvas) */
  let ready = false;
  function prepare() {
    if (ready || !P() || !P().ok) return;
    ready = true;
    // The source pack stores NEO as separate limbs. Build real whole-body
    // frames once so the battle can animate him without redrawing an atlas
    // every tick. Keep the original 82x89 canvas so his feet stay aligned.
    const part = (x, name, px, py, angle = 0, dx = 0, dy = 0) => {
      const f = P().frames[name], src = f && P().sheets[f[0]];
      if (!src) return;
      x.save(); x.translate(px + dx, py + dy); x.rotate(angle);
      x.drawImage(src, f[1], f[2], f[3], f[4], f[5] - px, f[6] - py, f[3], f[4]);
      x.restore();
    };
    for (let attack = 0; attack < 2; attack++) for (let i = 0; i < 8; i++) {
      const c = document.createElement('canvas'); c.width = 82; c.height = 89;
      const x = c.getContext('2d'); x.imageSmoothingEnabled = false;
      const wave = Math.sin(i * Math.PI / 4), sway = Math.cos(i * Math.PI / 4);
      x.save(); x.translate(0, Math.round(wave * (attack ? 2 : 1)));
      part(x, 'sneo_wingr_0', 34, 30, wave * (attack ? .22 : .12));
      part(x, 'sneo_wingl_0', 25, 31, -wave * (attack ? .24 : .14));
      part(x, 'sneo_legl_0', 23, 62, sway * .07);
      part(x, 'sneo_legr_0', 31, 62, -sway * .07);
      part(x, 'sneo_armr_0', 38, 39, -wave * (attack ? .28 : .13));
      part(x, 'sneo_body_0', 0, 0);
      part(x, 'sneo_head_' + (attack ? 2 + (i % 2) : Math.floor(i / 2)), 0, 0, sway * .045, wave, -Math.abs(wave));
      part(x, attack ? 'sneo_arml_1' : 'sneo_arml_0', 20, 42, wave * (attack ? .3 : .15));
      x.restore();
      const name = 'eg_sneo_' + (attack ? 'attack_' : '') + i;
      P().sheets.push(c);
      P().frames[name] = [P().sheets.length - 1, 0, 0, 82, 89, 0, 0, 82, 89];
    }
    // the overworld cast for the cutscene
    Object.assign(FW.CAST, {
      Spamton: { name: 'Spamton', idle: { down: 'spamton_idle_0', left: 'spamton_idle_0', right: 'spamton_idle_0', up: 'spamton_idle_0' }, voice: 420, color: '#ff8ad8', blip: ['sfx:txtspam', 'sfx:txtspam2'], noTurn: true },
      Jevil: { name: 'Jevil', idleAnim: ['joker_main_', 2, 4], idle: { down: 'joker_main_0', left: 'joker_main_0', right: 'joker_main_0', up: 'joker_main_0' }, voice: 760, color: '#b07bff', noTurn: true },
      NEO: { name: 'Spamton NEO', idleAnim: ['eg_sneo_', 4, 6], idle: { down: 'eg_sneo_0', left: 'eg_sneo_0', right: 'eg_sneo_0', up: 'eg_sneo_0' }, voice: 300, color: '#ff8ad8', blip: ['sfx:txtspam', 'sfx:txtspam2'], noTurn: true }
    });
  }

  /* ---------------------------------------------------------------- Ralsei, playable */
  if (typeof ST_ROLE_ICON !== 'undefined') ST_ROLE_ICON.Prince = '🎩';
  if (!ST_TOONS.Ralsei) ST_TOONS.Ralsei = {
    kind: 'toon', name: 'Ralsei', full: 'Ralsei', toon: 'Ralsei', role: 'Prince', color: '#7fe07f', accent: '#2f8a47',
    blurb: 'The prince from the dark. He came back to close a door, and found it full of old trouble.',
    basicName: 'Scarf Swipe', basicKind: 'mag', improvised: 'Scarf Swipe',
    base: { hp: 104, fp: 34, atk: 7, mag: 14, def: 10, mdef: 13.5, spd: 12, luck: 8 },
    grow: { hp: 11.8, fp: 2.1, atk: .7, mag: 1.55, def: 1.1, mdef: 1.35, spd: .2, luck: .24 },
    passive: { name: 'Gentle Heart', desc: 'Healing from Ralsei is 15% stronger on allies below half HP.' },
    skills: [
      { id: 'prayer', name: 'Heal Prayer', fp: 8, unlock: 'badge', target: 'ally', kind: 'heal', desc: 'Restore 40% HP to one ally.', fx: { heal: { pct: .4, mag: .5, lowBonus: true } } },
      { id: 'pacify', name: 'Pacify', fp: 7, unlock: 'badge', target: 'enemy', kind: 'mag', stagger: 2.2, desc: 'Magic that lowers the target’s Attack and slows it.', fx: { dmg: 'mag', power: .9, foe: [['atkDown', 3], ['slow', 2]] } },
      { id: 'fluffy', name: 'Fluffy Guard', fp: 10, unlock: 'badge', target: 'self', kind: 'buff', desc: 'Ralsei plants himself in front of everyone: counts as a Tank for 2 turns, with Ward.', fx: { self: [['barrier', 2], ['ward', 2, 1, { v: .3 }], ['defUp', 2]] } },
      { id: 'hat', name: 'Dark Prince’s Hat', fp: 15, unlock: 'badge', target: 'allies', kind: 'buff', desc: 'Cleanse the party and shield them for 20% of Ralsei’s Max HP.', fx: { cleanse: 'team', shield: { who: 'team', pct: .2, turns: 3 } } }
    ],
    bond: { name: 'Light of the Prince', toonLine: 'Ralsei takes off his hat.', desc: 'Revive every fallen ally at 50%, heal the party 35% and shield them.', fx: { revive: .5, heal: { pct: .35 }, shield: { who: 'team', pct: .15, turns: 3 } } }
  };
  const ART = { Ralsei: { battle: () => P().url('ralsei_idle_0', 4) || P().url('ralsei_walk_right_0', 4), port: () => P().url('face_r_nohat_0', 2) } };
  const ralseiBattleFrames = Object.create(null);
  function ralseiBattleFrame(name) {
    if (ralseiBattleFrames[name]) return ralseiBattleFrames[name];
    const f = P().frames[name], sheet = f && P().sheets[f[0]];
    if (!sheet) return P().url(name, 4);
    // The source canvases leave Ralsei at their far left. Recenter the actual
    // sprite on a consistent 70 × 47 frame so his feet and actions line up.
    const scale = 4, canvas = document.createElement('canvas');
    canvas.width = 70 * scale; canvas.height = 47 * scale;
    const ctx = canvas.getContext('2d'); ctx.imageSmoothingEnabled = false;
    ctx.drawImage(sheet, f[1], f[2], f[3], f[4], Math.round((70 - f[3]) * scale / 2), (47 - f[4]) * scale, f[3] * scale, f[4] * scale);
    return (ralseiBattleFrames[name] = canvas.toDataURL('image/png'));
  }
  const pixel = id => !!ART[id];
  ['stCharUrl', 'stBattleUrl', 'stToonArt'].forEach(fn => {
    if (typeof window[fn] !== 'function' && typeof globalThis[fn] !== 'function') return;
    const old = globalThis[fn];
    globalThis[fn] = function (id) { if (ART[id] && P() && P().ok) return fn === 'stBattleUrl' ? ART[id].battle() : ART[id].port(); return old.apply(this, arguments); };
  });

  /* ---------------------------------------------------------------- the enemies */
  // qte: { type: 'timing' | 'mash' | 'seq' | 'pick', ms } - played before the move lands (see QTE below)
  Object.assign(ST_ENEMIES, {
    egPipis: { name: 'Pipis', art: 'f:sneo_mail_0', hp: 160, atk: 10, mag: 16, def: 10, mdef: 10, spd: 9, stagger: 10, exp: 2,
      moves: [{ name: 'Pipis', kind: 'mag', power: 1.3, target: 'all', tele: 'The Pipis is ticking.', selfKo: true, w: 1 }] },
    egJevil: { name: 'Jevil', art: 'f:joker_dance_0', hp: 900, atk: 20, mag: 20, def: 18, mdef: 18, spd: 17, stagger: 95, exp: 90, boss: true, partner: 'egSneo',
      moves: [
        { name: 'Devilsknife', kind: 'phys', power: 1.7, w: 3, qte: { type: 'timing', ms: 900 }, fx: 'scythe' },
        { name: 'Chaos Carousel', kind: 'phys', power: .55, hits: 2, target: 'all', w: 3, cd: 2, qte: { type: 'mash', ms: 2200, goal: 14 }, fx: 'carousel' },
        { name: 'Suit Bombs', kind: 'mag', power: .5, hits: 5, target: 'random', w: 3, qte: { type: 'pick', ms: 1700 }, fx: 'suits' },
        { name: 'Hypno Ring', kind: 'mag', power: .35, target: 'all', sleep: .8, w: 2, cd: 4, qte: { type: 'mash', ms: 1800, goal: 12 }, fx: 'ring' },
        { name: 'I Can Do Anything', kind: 'egAnything', w: 1, cd: 4 },
        { name: 'KIDDING!!', kind: 'phys', power: 1.4, w: 2, cd: 3, qte: { type: 'fake', ms: 1000 }, fx: 'scythe' },
        { name: 'No Intermission', kind: 'egTeam', team: 'chaos', power: .75, w: 3, cd: 5, qte: { type: 'seq', ms: 2600, n: 6 } }
      ],
      phases: [{ at: .5, text: 'Jevil twists into a new shape.', buff: 'haste', egCut: 'meta' }, { at: .15, text: 'Jevil is laughing too hard to stand still.', buff: 'atkUp', egCut: 'chaosFinal' }] },
    egSneo: { name: 'Spamton NEO', art: 'f:eg_sneo_0', hp: 980, atk: 19, mag: 21, def: 17, mdef: 19, spd: 15, stagger: 95, exp: 90, boss: true, partner: 'egJevil',
      moves: [
        { name: 'Phone Hand', kind: 'mag', power: 1.2, silence: 1, w: 3, qte: { type: 'seq', ms: 2000, n: 5 }, fx: 'phone' },
        { name: 'Mail Bomb', kind: 'mag', power: .5, hits: 4, target: 'random', w: 3, qte: { type: 'timing', ms: 800 }, fx: 'mail' },
        { name: 'Pipis', kind: 'summon', summon: 'egPipis', w: 2, cd: 4 },
        { name: 'Deal of a Lifetime', kind: 'egDeal', w: 2, cd: 5 },
        { name: 'Strings', kind: 'mag', power: .8, stun: 1, w: 2, cd: 3, qte: { type: 'mash', ms: 1800, goal: 13 }, fx: 'strings' },
        { name: 'BIG SHOT', kind: 'mag', power: 2.1, lethal: true, reflect: .9, tele: 'Spamton NEO steadies his hand cannon. The muzzle begins to glow.', w: 3, cd: 4, qte: { type: 'mash', ms: 2400, goal: 22 }, fx: 'bigshot' },
        { name: 'Two for One', kind: 'egTeam', team: 'deal', power: .65, w: 2, cd: 6, qte: { type: 'mash', ms: 2400, goal: 18 } }
      ],
      phases: [{ at: .3, text: 'Spamton NEO pulls hard against the wires overhead.', buff: 'atkUp', egCut: 'final', summon: ['egPipis'] }] }
  });
  if (typeof ST_STATUS_ICON !== 'undefined') ST_STATUS_ICON.deal = ['$', 'debuff', 'Deal: healing hurts'];

  /* ---------------------------------------------------------------- engine (only when B.eg is set) */
  const SP = StoryBattle.prototype;
  const hit0 = SP.hit, heal0 = SP.healRaw, kill0 = SP.kill, check0 = SP.checkPhases;
  const isBoss = u => u && (u.key === 'egJevil' || u.key === 'egSneo');
  SP.hit = function (src, tgt, power, kind, ev, o) {
    if (this.eg && this.qte && tgt && tgt.side === 'p' && src && src.side === 'e') {
      if (this.qte.mult === 0) { ev.push({ t: 'miss', target: tgt.uid }); return 0; }
      o = Object.assign({}, o || {}, { mult: ((o && o.mult) || 1) * this.qte.mult, noDodge: true });
    }
    return hit0.call(this, src, tgt, power, kind, ev, o);
  };
  // Deal of a Lifetime: healing hurts while it lasts
  SP.healRaw = function (u, amt, ev, tag) {
    if (this.eg && u && u.side === 'p' && this.has(u, 'deal') && amt > 0) {
      const d = Math.min(u.hp - 1, Math.round(amt * .6));
      if (d > 0) { u.hp -= d; ev.push({ t: 'dot', target: u.uid, amount: d, kind: 'deal' }); }
      return 0;
    }
    return heal0.call(this, u, amt, ev, tag);
  };
  // one falls: the other stops playing around
  SP.kill = function (u, ev) {
    // fair: anyone above half HP when an attack starts survives it at 1 HP, unless it was a telegraphed lethal strike
    if (this.eg && u.side === 'p' && this._egGuts && this._egGuts.has(u.uid)) { this._egGuts.delete(u.uid); u.hp = 1; ev.push({ t: 'text', text: `${u.name} hangs on!`, actor: u.uid, cls: 'heal' }); return; }
    const r = kill0.call(this, u, ev);
    if (this.eg && isBoss(u)) {
      if (u.key === 'egJevil' && typeof Achievements !== 'undefined' && Achievements.recordMax) Achievements.recordMax('jevilDefeat', 1);
      if (u.key === 'egSneo' && typeof Achievements !== 'undefined' && Achievements.recordMax) Achievements.recordMax('spamtonNeoDefeat', 1);
      const o = this.living('e').find(isBoss);
      if (o && !o.egEnraged) {
        o.egEnraged = true;
        this.apply(o, o, 'haste', 99, null, ev); this.apply(o, o, 'atkUp', 99, null, ev);
        ev.push({ t: 'eg', k: 'cut', cut: o.key === 'egJevil' ? 'enrageJ' : 'enrageS' });
      }
    }
    return r;
  };
  SP.checkPhases = function (u, ev) {
    if (!this.eg) return check0.call(this, u, ev);
    (u.def.phases || []).forEach((p, i) => {
      if (u.phaseDone[i] || u.hp / u.max.hp > p.at) return;
      u.phaseDone[i] = true;
      if (p.egCut) ev.push({ t: 'eg', k: 'cut', cut: p.egCut });
      if (p.buff) this.apply(u, u, p.buff, 99, null, ev);
      (p.summon || []).forEach(k => this.summon(u, k, ev));
    });
  };
  // pick a move (the UI needs it first, to run the quick-time event)
  SP.egPick = function (u) {
    if (!u._egInit) { u._egInit = true; u.def.moves.forEach(m => { if (m.kind === 'egTeam') u.cds[m.name] = Math.max(u.cds[m.name] || 0, 3); if (m.lethal) u.cds[m.name] = Math.max(u.cds[m.name] || 0, 2); }); }
    if (u.tele) return u.tele;
    const partner = u.def.partner && this.living('e').find(x => x.key === u.def.partner);
    const opts = u.def.moves.filter(m => !(u.cds[m.name] > 0) && !(m.kind === 'egTeam' && !partner) && !(m.kind === 'summon' && this.living('e').length >= ST_MAX_FOES));
    let r = this.rng() * opts.reduce((a, m) => a + m.w, 0);
    return opts.find(m => (r -= m.w) <= 0) || opts[0] || u.def.moves[0];
  };
  SP.egAct = function (u) {
    const ev = [];
    let move;
    if (u.tele) { move = u.tele; u.tele = null; }
    else {
      move = u._plan || this.egPick(u); u._plan = null;
      if (move.cd) u.cds[move.name] = move.cd;
      if (move.tele) {
        u.tele = move;
        ev.push({ t: 'charge', actor: u.uid, name: move.name, text: move.tele, lethal: !!move.lethal });
        this.endTurn(u, ev, .75); this.qte = null;
        return ev;
      }
    }
    const res = this.qte ? this.qte.res : 'none';
    this._egGuts = move.lethal ? null : new Set(this.living('p').filter(p => p.hp / p.max.hp > .5).map(p => p.uid));
    ev.push({ t: 'act', actor: u.uid, name: move.name, kind: 'enemy', big: true });
    if (move.fx) ev.push({ t: 'eg', k: 'fx', fx: move.fx, actor: u.uid });
    const party = () => this.living('p');
    const doHit = (tgt, power) => {
      if (!tgt || !tgt.alive) return;
      if (move.lethal && res !== 'perfect' && this.lethalStrike && this.lethalStrike(u, tgt, move, ev)) return;
      this.hit(u, tgt, power, move.kind === 'phys' ? 'phys' : 'mag', ev, { stagger: 0, aoe: move.target === 'all' });
      if (!tgt.alive) return;
      const resisted = res === 'perfect' || res === 'good';
      if (move.sleep && !resisted && this.rng() < move.sleep) this.apply(u, tgt, 'sleep', 2, null, ev);
      if (move.stun && !resisted && this.rng() < move.stun) this.apply(u, tgt, 'stun', 1, null, ev);
      if (move.silence && !resisted) this.apply(u, tgt, 'silence', 2, null, ev);
    };
    switch (move.kind) {
      case 'phys': case 'mag': {
        const hits = move.hits || 1;
        for (let i = 0; i < hits; i++) {
          if (move.target === 'all') party().forEach(t => doHit(t, move.power));
          else doHit(move.target === 'random' ? this.rng.pick(party()) : (this._egT && this._egT.alive ? this._egT : (this._egT = this.pickTarget(u, move))), move.power);
          if (!party().length) break;
        }
        this._egT = null;
        // BIG SHOT: win the push and it goes back where it came from
        if (move.reflect && res === 'perfect' && u.alive) { ev.push({ t: 'eg', k: 'cut', cut: 'reflect' }); this.qte = null; this.hit(party()[0] || u, u, move.reflect * 3, 'mag', ev, { stagger: 3, sure: true }); }
        break;
      }
      case 'summon': this.summon(u, move.summon, ev); break;
      case 'egDeal':
        ev.push({ t: 'eg', k: 'cut', cut: 'deal' });
        party().forEach(p => this.apply(u, p, 'deal', 2, null, ev));
        break;
      case 'egAnything': {
        ev.push({ t: 'eg', k: 'cut', cut: 'anything' });
        // he takes every buff you have
        const BUFFS = ['atkUp', 'magUp', 'defUp', 'haste', 'shield', 'regen', 'counter', 'ward', 'barrier'];
        let got = 0;
        party().forEach(p => BUFFS.forEach(k => { if (p.st[k]) { const was = Object.assign({}, p.st[k]); delete was.t; delete p.st[k]; ev.push({ t: 'expire', target: p.uid, k }); if (k !== 'barrier' && k !== 'shield') this.apply(u, u, k, 3, was, ev); got++; } }));
        if (!got) this.healRaw(u, u.max.hp * .04, ev, 'Anything');
        break;
      }
      case 'egTeam': {
        const other = this.living('e').find(x => x.key === u.def.partner);
        ev.push({ t: 'eg', k: 'cut', cut: move.team });
        const waves = move.team === 'chaos' ? 3 : 2;
        for (let w = 0; w < waves; w++) party().forEach(t => doHit(t, move.power));
        if (move.team === 'deal') party().forEach(p => this.apply(u, p, 'deal', 2, null, ev));
        if (other) other.ct = Math.max(0, other.ct * .5);   // his partner gets back in line sooner
        break;
      }
    }
    if (move.selfKo && u.alive) this.kill(u, ev);
    this.qte = null; this._egGuts = null;
    this.endTurn(u, ev);
    return ev;
  };

  /* ---------------------------------------------------------------- quick-time events */
  const QTE_MULT = { perfect: .12, good: .5, fail: 1.15 };
  function runQTE(host, spec) {
    return new Promise(done => {
      const box = document.createElement('div'); box.className = 'eg-qte eg-qte-' + spec.type;
      host.appendChild(box);
      const t0 = performance.now(), ms = spec.ms;
      let finished = false, raf = 0;
      const end = res => {
        if (finished) return; finished = true;
        cancelAnimationFrame(raf); document.removeEventListener('keydown', kd, true); box.removeEventListener('pointerdown', pd);
        box.classList.add('res-' + res); box.dataset.res = res === 'perfect' ? 'PERFECT' : res === 'good' ? 'GOOD' : 'MISS';
        sfx(res === 'fail' ? 'hurtsmall' : res === 'perfect' ? 'great_shine' : 'bump', .5);
        setTimeout(() => { box.parentNode && box.parentNode.removeChild(box); done(res); }, 380);
      };
      let kd = () => {}, pd = () => {};
      const bar = '<div class="eg-qte-time"><i></i></div>';
      const tick = () => { const k = (performance.now() - t0) / ms; const t = box.querySelector('.eg-qte-time i'); if (t) t.style.width = Math.max(0, 100 - k * 100) + '%'; if (spec.onTick) spec.onTick(k); if (k >= 1) spec.timeout(); else raf = requestAnimationFrame(tick); };
      if (spec.type === 'timing') {
        // a ring closes on the mark: press as it lands
        box.innerHTML = '<div class="eg-ring"><i></i><b></b></div><small>[Z] / TAP</small>';
        const ring = box.querySelector('.eg-ring i');
        spec.onTick = k => { ring.style.transform = `scale(${Math.max(.15, 3 - k * 2.7 / .85)})`; };
        const press = () => { const k = (performance.now() - t0) / ms, d = Math.abs(k - .85) * ms; end(d < 70 ? 'perfect' : d < 150 ? 'good' : 'fail'); };
        kd = e => { if (/KeyZ|Space|Enter/.test(e.code)) { e.preventDefault(); e.stopPropagation(); press(); } };
        pd = e => { e.preventDefault(); press(); };
        spec.timeout = () => end('fail');
      } else if (spec.type === 'fake') {
        // KIDDING!! - the ring is purple. Pressing it is the mistake.
        box.innerHTML = '<div class="eg-ring fake"><i></i><b></b></div><small>[Z] / TAP</small>';
        box.classList.add('eg-qte-fake');
        const ring = box.querySelector('.eg-ring i');
        spec.onTick = k => { ring.style.transform = `scale(${Math.max(.15, 3 - k * 2.7 / .85)})`; };
        kd = e => { if (/KeyZ|Space|Enter/.test(e.code)) { e.preventDefault(); e.stopPropagation(); end('fail'); } };
        pd = e => { e.preventDefault(); end('fail'); };
        spec.timeout = () => end('perfect');
      } else if (spec.type === 'mash') {
        box.innerHTML = '<b class="eg-mash-t">MASH!</b><div class="eg-mash"><i></i></div><small>[Z] / TAP</small>' + bar;
        let n = 0; const fill = box.querySelector('.eg-mash i');
        const hit = () => { n++; fill.style.width = Math.min(100, n / spec.goal * 100) + '%'; sfx('menumove', .25); if (n >= spec.goal) end((performance.now() - t0) / ms < .7 ? 'perfect' : 'good'); };
        kd = e => { if (/KeyZ|Space|Enter/.test(e.code)) { e.preventDefault(); e.stopPropagation(); if (!e.repeat) hit(); } };
        pd = e => { e.preventDefault(); hit(); };
        spec.timeout = () => end(n >= spec.goal * .6 ? 'good' : 'fail');
      } else if (spec.type === 'seq') {
        const A = ['ArrowUp', 'ArrowRight', 'ArrowDown', 'ArrowLeft'], G = { ArrowUp: '▲', ArrowRight: '▶', ArrowDown: '▼', ArrowLeft: '◀' };
        const want = Array.from({ length: spec.n }, () => A[Math.floor(Math.random() * 4)]);
        let i = 0, miss = 0;
        box.innerHTML = '<div class="eg-seq">' + want.map(k => `<span>${G[k]}</span>`).join('') + '</div><div class="eg-pad">' + A.map(k => `<button type="button" data-k="${k}">${G[k]}</button>`).join('') + '</div>' + bar;
        const spans = [...box.querySelectorAll('.eg-seq span')];
        const press = k => {
          if (k === want[i]) { spans[i].classList.add('ok'); i++; sfx('menumove', .3); if (i >= want.length) end(miss ? 'good' : 'perfect'); }
          else { miss++; box.classList.remove('shake'); void box.offsetWidth; box.classList.add('shake'); sfx('cantselect', .4); if (miss >= 3) end('fail'); }
        };
        kd = e => { if (A.includes(e.code)) { e.preventDefault(); e.stopPropagation(); press(e.code); } };
        box.querySelectorAll('.eg-pad button').forEach(b => b.onpointerdown = e => { e.preventDefault(); e.stopPropagation(); press(b.dataset.k); });
        spec.timeout = () => end(i >= want.length - 1 ? 'good' : 'fail');
      } else if (spec.type === 'pick') {
        // one suit glows for a moment: that's the one he won't bomb
        const S = ['♠', '♥', '♣', '♦'], safe = Math.floor(Math.random() * 4);
        let cur = 0;
        box.innerHTML = '<div class="eg-suits">' + S.map((s, i) => `<button type="button" data-i="${i}" class="${i === safe ? 'safe' : ''}">${s}</button>`).join('') + '</div><small>◀ ▶ + [Z] / TAP</small>' + bar;
        const btns = [...box.querySelectorAll('.eg-suits button')];
        setTimeout(() => btns[safe].classList.remove('safe'), 420);
        const sel = () => btns.forEach((b, i) => b.classList.toggle('cur', i === cur)); sel();
        const choose = i => end(i === safe ? 'perfect' : 'fail');
        kd = e => {
          if (e.code === 'ArrowLeft' || e.code === 'ArrowRight') { e.preventDefault(); e.stopPropagation(); cur = (cur + (e.code === 'ArrowLeft' ? 3 : 1)) % 4; sel(); sfx('menumove', .3); }
          else if (/KeyZ|Space|Enter/.test(e.code)) { e.preventDefault(); e.stopPropagation(); choose(cur); }
        };
        btns.forEach((b, i) => b.onpointerdown = e => { e.preventDefault(); e.stopPropagation(); choose(i); });
        spec.timeout = () => end('fail');
      }
      document.addEventListener('keydown', kd, true); box.addEventListener('pointerdown', pd);
      raf = requestAnimationFrame(tick);
    });
  }

  /* ---------------------------------------------------------------- the battle screen */
  // tools/flowery/endgame_sim.js (autoplay): hitting no QTEs ~0-1% win, half of them ~6-16%, most of them ~60-70%
  const TUNE = { lv: 99, flv: 99, mult: { hp: .4, atk: .42, def: 1 } };
  const EG = Object.create(StoryBattleUI);
  EG.art = function (u) {
    if (u.key === 'Ralsei') return ralseiBattleFrame('ralsei_idle_0');
    if (u.side === 'e' && u.def && u.def.art && u.def.art.startsWith('f:')) return P().url(u.def.art.slice(2), 4);
    return StoryBattleUI.art.call(this, u);
  };
  const makeUnit0 = StoryBattleUI.makeUnit;
  EG.makeUnit = function (u) {
    const n = makeUnit0.call(this, u);
    if ((u.side === 'e' && u.def.art.startsWith('f:')) || (u.side === 'p' && pixel(u.key))) n.classList.add('fl-pix');
    if (u.key === 'Ralsei') n.classList.add('eg-ralsei');
    if (u.key === 'egSneo') {
      // Spamton NEO is HUGE: the body is drawn 3.4x, and everything on it (name, HP bar, markers) is moved up to match
      const k = 3.4, body = n.querySelector('.body'), w = parseFloat(body.style.width);
      n.classList.add('eg-strings', 'eg-huge');
      body.style.width = (w * k) + 'px'; body.style.marginLeft = (-w * k / 2) + 'px';
      n.querySelectorAll('.nameplate,.hpmini,.stb-sg,.stats,.stb-arrow,.stb-charge,.ms-pops').forEach(e => { const b0 = parseFloat(e.style.bottom); if (!isNaN(b0)) e.style.bottom = (b0 * k * .92) + 'px'; });
    }
    if (u.key === 'egJevil') n.classList.add('eg-jevil');
    return n;
  };
  EG.startBossAnimation = function () {
    this.stopBossAnimation();
    const art = {
      egJevil: {
        idle: Array.from({ length: 8 }, (_, i) => P().url('joker_dance_' + i, 4)),
        act: Array.from({ length: 8 }, (_, i) => P().url('joker_dance_' + i, 4))
      },
      egSneo: {
        idle: Array.from({ length: 8 }, (_, i) => P().url('eg_sneo_' + i, 4)),
        act: Array.from({ length: 8 }, (_, i) => P().url('eg_sneo_attack_' + i, 4))
      },
      Ralsei: {
        idle: Array.from({ length: 5 }, (_, i) => ralseiBattleFrame('ralsei_idle_' + i)),
        attack: Array.from({ length: 7 }, (_, i) => ralseiBattleFrame('ralsei_attack_' + i)),
        spell: Array.from({ length: 11 }, (_, i) => ralseiBattleFrame('ralsei_spell_' + i)),
        defend: Array.from({ length: 8 }, (_, i) => ralseiBattleFrame('ralsei_defend_' + i)),
        item: Array.from({ length: 7 }, (_, i) => ralseiBattleFrame('ralsei_item_' + i)),
        hurt: [ralseiBattleFrame('ralsei_hurt_fixed_0')]
      }
    };
    const tick = () => {
      if (!this.root || !this.root.isConnected || !this.B) { this.stopBossAnimation(); return; }
      const now = performance.now();
      this.B.units.forEach(u => {
        const frames = art[u.key], node = frames && this.unitEl(u);
        if (!node || !u.alive) return;
        const ralsei = u.key === 'Ralsei', acting = now < (node._egActUntil || 0);
        const action = ralsei ? now < (node._egHurtUntil || 0) ? 'hurt' : acting ? node._egAction || 'spell' : 'idle' : acting ? 'act' : 'idle';
        const list = frames[action] || frames.idle;
        const delay = ralsei ? (action === 'idle' ? 150 : 90 / this.speed) : acting ? 90 : u.key === 'egJevil' ? 1000 / 12 : 125;
        const elapsed = ralsei && action !== 'idle' ? now - (action === 'hurt' ? node._egHurtStart : node._egActStart) : now;
        const index = ralsei && action !== 'idle' ? Math.min(list.length - 1, Math.max(0, Math.floor(elapsed / delay))) : Math.floor(elapsed / delay) % list.length;
        const frame = action + ':' + index;
        if (node._egFrame !== frame) {
          node.querySelector('.body img').src = list[index];
          node._egFrame = frame;
        }
      });
    };
    tick();
    this._bossAnimTimer = setInterval(tick, 80);
  };
  EG.stopBossAnimation = function () {
    if (this._bossAnimTimer) clearInterval(this._bossAnimTimer);
    this._bossAnimTimer = null;
  };
  EG.rigAction = function (u, kind, skill) {
    StoryBattleUI.rigAction.call(this, u, kind, skill);
    if (u?.key !== 'Ralsei') return;
    const node = this.unitEl(u); if (!node) return;
    const now = performance.now();
    node._egAction = kind === 'attack' ? 'attack' : kind === 'guard' ? 'defend' : kind === 'item' ? 'item' : 'spell';
    node._egActStart = now;
    node._egActUntil = now + (kind === 'attack' || kind === 'guard' ? 800 : kind === 'item' ? 700 : 1100) / this.speed;
  };
  EG.rigHit = function (u) {
    StoryBattleUI.rigHit.call(this, u);
    if (u?.key !== 'Ralsei') return;
    const node = this.unitEl(u); if (!node) return;
    node._egHurtStart = performance.now();
    node._egHurtUntil = node._egHurtStart + 330 / this.speed;
  };
  // Spamton NEO hangs at the far right; Jevil dances in front of him
  EG.spot = function (u) {
    const p = StoryBattleUI.spot.call(this, u);
    if (u.key === 'egSneo') { p.x = this.W * .86; p.d = Math.min(p.d, .35); p.y = this.ground - p.d * this.depthSpan + 8; }
    if (u.key === 'egJevil') p.x = this.W * .66;
    return p;
  };
  EG.say = function (text, cls) { return StoryBattleUI.say.call(this, String(text).replace('calls more Ichor!', 'calls a Pipis!'), cls); };
  EG.lobbyReturn = () => false;
  EG.storyHazard = () => [];
  function arenaBg() {
    const c = document.createElement('canvas'); c.width = 640; c.height = 360;
    const x = c.getContext('2d'); x.imageSmoothingEnabled = false;
    x.fillStyle = '#05030f'; x.fillRect(0, 0, 640, 360);
    // shattered blue facets around a point (Jevil's room)
    const cx = 230, cy = 170, R = 520;
    for (let i = 0; i < 18; i++) {
      const a0 = i / 18 * Math.PI * 2, a1 = (i + 1) / 18 * Math.PI * 2, k = (i * 37 % 7) / 7;
      x.fillStyle = `rgb(${18 + k * 20},${20 + k * 26},${90 + k * 120})`;
      x.beginPath(); x.moveTo(cx + Math.cos(a0) * 40, cy + Math.sin(a0) * 40); x.lineTo(cx + Math.cos(a0) * R, cy + Math.sin(a0) * R); x.lineTo(cx + Math.cos(a1) * R, cy + Math.sin(a1) * R); x.lineTo(cx + Math.cos(a1) * 40, cy + Math.sin(a1) * 40); x.fill();
    }
    const g = x.createLinearGradient(330, 0, 640, 0); g.addColorStop(0, 'rgba(5,3,15,0)'); g.addColorStop(.35, 'rgba(5,3,15,.85)'); g.addColorStop(1, '#05030f');
    x.fillStyle = g; x.fillRect(330, 0, 310, 360);
    for (let i = 0; i < 3; i++) P().draw(x, 'bg_dw_mansion_basement_cityscape_0', 380 + i * 198 * 1.2, 300, { ax: 0, ay: 1, s: 1.2, alpha: .85 });
    x.fillStyle = 'rgba(80,255,110,.55)'; for (let i = 0; i < 9; i++) x.fillRect(470 + i * 12 + (i % 2) * 4, 0, 2, 120 + (i * 29 % 60));
    return c.toDataURL('image/png');
  }

  EG.startEg = function (ids, done) {
    prepare();
    this.egDone = done; this.speed = 1; this.auto = false;
    const n = { name: 'The Door With No Lock', bg: '', music: 'flNeo', tier: 5, eg: true, hard: [[['egJevil', 1, { boss: true }], ['egSneo', 1, { boss: true }]]] };
    const items = { bandage: 3, medkit: 2, pop: 3, jumper: 2, barrier: 2, jawbreaker: 2, tonic: 2 };
    this.run = { i: -1, n, mode: 'hard', ids, wave: 0, carry: {}, items, base: Object.assign({}, items), stock: null, exp: 0, killed: 0, ch: 3 };
    if (typeof StoryUI !== 'undefined') StoryUI.overlay = true;
    if (typeof MUSIC_TRACKS !== 'undefined' && P().music.flNeo) MUSIC_TRACKS.flNeo = P().music.flNeo;
    this.build();
    $('#bgLayer').style.backgroundImage = `url("${arenaBg()}")`;
    this.arena.classList.add('fl-story', 'eg-battle');
    this.launchWave();
  };
  EG.launchWave = function () {
    const r = this.run;
    const foes = r.n.hard[0].map(([k, , x]) => [k, TUNE.flv, Object.assign({}, x || {}, { mult: Object.assign({}, TUNE.mult) })]);
    const party = r.ids.map(id => ({ sq: null, tm: null, rank: 3, id, lv: TUNE.lv, row: 'front', hp: null, bond: 0 }));
    this.B = new StoryBattle({ party, foes, items: r.items, tier: 5, unlocked: () => true });
    this.B.eg = true;
    this.el.wave.textContent = 'The Door With No Lock'; this.el.turn.textContent = 'TURN 1';
    clear(this.el.units);
    this.drawParty(); this.drawFoes(); this.drawDock(); this.drawOrder();
    this.startBossAnimation();
    this.el.cmd.innerHTML = '';
    Music.play('flNeo');
    this.egCut('vs').then(() => setTimeout(() => this.loop(), 300));
  };
  // the turn loop, with the quick-time event between "he picks a move" and "it lands"
  EG.loop = async function () {
    const B = this.B, alive = () => this.B === B && this.root && this.root.isConnected;
    while (!B.over && alive()) {
      this._fxAction = null;
      const nx = B.next();
      this.drawOrder();
      const actor = nx.actor;
      this.setTurn(actor);
      if (nx.events.length) await this.play(nx.events);
      if (!alive()) return;
      if (B.over) break;
      if (nx.skip) { this.refreshAll(); await this.wait(250); continue; }
      let ev;
      if (actor.side === 'p') {
        const action = await this.pick(actor);
        if (!alive()) return;
        ev = B.act(actor, action);
      } else {
        await this.wait(260);
        const plan = B.egPick(actor);
        const firing = !!actor.tele || !plan.tele;
        if (!actor.tele) actor._plan = plan;
        if (firing && plan.qte) {
          this.banner(plan.name, 'big'); Sound.play('warn', { vol: .5 });
          await this.wait(450);
          const res = await runQTE(this.root, plan.qte);
          B.qte = { res, mult: plan.qte.type === 'pick' && res === 'perfect' ? 0 : QTE_MULT[res] };
        } else B.qte = null;
        if (!alive()) return;
        ev = B.egAct(actor);
      }
      await this.play(ev);
      if (!alive()) return;
      this.refreshAll(); this.drawOrder();
      await this.wait(120);
    }
    if (alive()) this.endWave();
  };
  EG.endWave = async function () {
    const B = this.B;
    this.el.cmd.innerHTML = '';
    if (!B.win) { await this.wait(400); this.defeat(); return; }
    this.victory();
  };

  /* anime cut-ins: big sprites, speed lines, a flash. Almost no words. */
  const CUTS = {
    vs: { a: 'joker_main_0', b: 'eg_sneo_0', title: 'JEVIL × SPAMTON NEO', snd: ['joker_laugh1', 'sneo_laugh_long'] },
    chaos: { a: 'joker_dance_0', b: 'eg_sneo_1', title: 'NO INTERMISSION', snd: ['joker_neochaos', 'sneo_overpower'], col: '#b07bff' },
    deal: { a: 'eg_sneo_2', b: 'carousel_0', title: 'TWO FOR ONE', snd: ['spamton_laugh', 'joker_chaos'], col: '#ff8ad8' },
    meta: { a: 'joker_scythebody_0', title: 'METAMORPHOSIS', snd: ['joker_metamorphosis'], col: '#7a3fd0' },
    final: { a: 'sneo_final_forme_0', scale: .45, title: 'FINAL FORME', snd: ['sneo_overpower'], col: '#ff2f6d' },
    anything: { a: 'joker_dance_2', title: 'I CAN DO ANYTHING', snd: ['joker_anything'], col: '#b07bff' },
    reflect: { a: 'sneo_bigshot_l_0', title: 'RETURN TO SENDER', snd: ['chargeshot_fire'], col: '#ffe066', flip: true },
    chaosFinal: { a: 'joker_scythebody_0', b: 'joker_dance_4', title: 'LAST TURN', snd: ['joker_neochaos', 'joker_laugh1'], col: '#ffffff' },
    enrageJ: { a: 'joker_teleport_0', title: 'BYE BYE', snd: ['joker_byebye'], col: '#b07bff' },
    enrageS: { a: 'eg_sneo_3', title: '[[HEAVEN]]', snd: ['sneo_laugh_long'], col: '#ff8ad8' }
  };
  EG.egCut = async function (key) {
    const c = CUTS[key]; if (!c || !this.root) return;
    const box = document.createElement('div'); box.className = 'eg-cut'; box.style.setProperty('--c', c.col || '#fff');
    const img = (n, cls) => n ? `<img class="${cls}" src="${P().url(n, Math.max(1, Math.round(4 * (c.scale || 1))))}" alt="">` : '';
    box.innerHTML = `<div class="eg-band"></div><div class="eg-lines"></div>${img(c.a, 'eg-a' + (c.flip ? ' flip' : ''))}${img(c.b, 'eg-b')}<b class="eg-title">${c.title}</b>`;
    this.root.appendChild(box);
    (c.snd || []).forEach((s, i) => setTimeout(() => sfx(s, .8), i * 350));
    this.flash(c.col || '#fff'); this.shake(true);
    await this.wait(key === 'vs' ? 1900 : 1250);
    box.classList.add('out'); await this.wait(220);
    box.parentNode && box.parentNode.removeChild(box);
  };
  // attack effects: the bosses' own bullets flying at the party
  const FX = {
    scythe: ['joker_scythebody_0', 'scytheburst_bc'], carousel: ['carousel_0', 'joker_chaos'], suits: ['bomb_spade_0', 'explosion'], ring: ['hypnoring_0', 'joker_ha0'],
    phone: ['sneo_phonehand_0', 'electric_talk'], mail: ['sneo_mail_0', 'rocket'], strings: ['sneo_wireheart_0', 'whip_hard'], bigshot: ['sneo_bigshot_l_0', 'chargeshot_fire']
  };
  EG.egFx = async function (e) {
    const f = FX[e.fx]; if (!f) return;
    const a = this.B.units.find(x => x.uid === e.actor), from = this.unitEl(a), to = this.el.dock;
    if (!from || !to) return;
    const r0 = from.getBoundingClientRect(), r1 = $('#unitLayer').getBoundingClientRect();
    const n = e.fx === 'suits' || e.fx === 'mail' ? 5 : e.fx === 'carousel' ? 3 : 1;
    sfx(f[1], .7);
    for (let i = 0; i < n; i++) {
      const im = document.createElement('img'); im.className = 'eg-shot'; im.src = P().url(i % 4 && e.fx === 'suits' ? ['bomb_heart_0', 'bomb_club_0', 'bomb_diamond_0'][i % 3] : f[0], 3);
      im.style.left = (r0.left + r0.width / 2) + 'px'; im.style.top = (r0.top + r0.height * .4) + 'px';
      document.body.appendChild(im);
      const tx = r1.left + r1.width * (.15 + Math.random() * .3), ty = r1.top + r1.height * (.45 + Math.random() * .3);
      requestAnimationFrame(() => { im.style.left = tx + 'px'; im.style.top = ty + 'px'; im.style.transform = 'translate(-50%,-50%) rotate(' + (360 + Math.random() * 360) + 'deg)'; });
      setTimeout(() => im.parentNode && im.parentNode.removeChild(im), 560);
      await wait(90);
    }
    await this.wait(260);
  };
  EG.play = async function (events) {
    let run = [];
    const flush = async () => { if (run.length) { await StoryBattleUI.play.call(this, run); run = []; } };
    for (const e of events) {
      if (e.t === 'act') {
        const a = this.B.units.find(x => x.uid === e.actor);
        const node = a && isBoss(a) && this.unitEl(a);
        if (node) {
          node._egActUntil = performance.now() + 1300;
          if (a.key === 'egJevil') { node.classList.remove('eg-tele'); void node.offsetWidth; node.classList.add('eg-tele'); sfx('joker_ha' + (Math.random() < .5 ? 0 : 1), .5); }
        }
      }
      if (e.t === 'eg') { await flush(); if (!this.root || !this.root.isConnected) return; if (e.k === 'cut') await this.egCut(e.cut); else if (e.k === 'fx') await this.egFx(e); }
      else run.push(e);
    }
    await flush();
  };

  const finish = (self, r) => { const done = self.egDone; self.egDone = null; self.closeBattle(true); $('#battle').hidden = true; if (typeof StoryUI !== 'undefined') StoryUI.overlay = false; if (done) done(r); };
  EG.victory = function () { Sound.play('arena_fanfare', { vol: .5 }); finish(this, 'win'); };
  EG.defeat = function () {
    this.arena.classList.add('stb-lost'); Music.play('stEmotional');
    this.el.cmd.innerHTML = `<div class="ms-defeat"><b>GAME OVER</b><p>The stage goes quiet. Jevil and Spamton are still standing.</p><div><button data-d="retry">Try again</button><button data-d="leave">Leave</button></div></div>`;
    this.el.cmd.querySelector('[data-d="retry"]').onclick = () => { Sound.play('choose'); const done = this.egDone, ids = this.run.ids; this.closeBattle(true); this.startEg(ids, done); };
    this.el.cmd.querySelector('[data-d="leave"]').onclick = () => { Sound.play('ui_back'); finish(this, 'quit'); };
  };
  EG.confirmQuit = function () {
    if (this.root.querySelector('.ms-quit')) return;
    const q = el('div', 'ms-quit', '<div><b>Retreat?</b><p></p><button data-q="y">Retreat</button><button data-q="n">Keep fighting</button></div>');
    this.root.appendChild(q);
    q.querySelector('[data-q="n"]').onclick = () => q.remove();
    q.querySelector('[data-q="y"]').onclick = () => finish(this, 'quit');
  };
  EG.closeBattle = function (keep) {
    this.stopBossAnimation();
    if (this.arena) this.arena.classList.remove('fl-story', 'eg-battle');
    document.querySelectorAll('.eg-shot').forEach(x => x.parentNode && x.parentNode.removeChild(x));
    return StoryBattleUI.closeBattle.call(this, keep);
  };

  /* ---------------------------------------------------------------- picking the four */
  function roster() {
    const ids = new Set(['Scraps', 'Ginger', 'Yatta', 'Ralsei']);
    (typeof ST3_IDS !== 'undefined' ? ST3_IDS : []).forEach(id => ids.add(id));
    Object.keys(ST_TOONS).forEach(id => ids.add(id));
    Object.keys(typeof ST_HANDLERS !== 'undefined' ? ST_HANDLERS : {}).forEach(id => ids.add(id));
    return [...ids].filter(id => { const c = stChar(id); return c && c.skills && c.skills.length; });
  }
  function pickTeam() {
    return new Promise(res => {
      const ids = roster(), pick = ['Scraps', 'Ginger', 'Yatta', 'Ralsei'].filter(id => ids.includes(id));
      const box = document.createElement('div'); box.className = 'eg-pick';
      const draw = () => {
        box.innerHTML = `<div class="eg-pick-in"><h3>PICK FOUR <small>LV 99</small></h3><div class="eg-grid">${ids.map(id => { const c = stChar(id), on = pick.includes(id);
          return `<button type="button" data-id="${id}" class="${on ? 'on' : ''}" style="--hc:${c.color}"><img src="${stCharUrl(id)}" alt=""${pixel(id) ? ' style="image-rendering:pixelated"' : ''}><b>${c.name}</b><small>${c.role || ''}</small>${on ? `<i>${pick.indexOf(id) + 1}</i>` : ''}</button>`; }).join('')}</div>
          <div class="eg-pick-go"><button type="button" class="eg-back">Back</button><button type="button" class="eg-go" ${pick.length === 4 ? '' : 'disabled'}>FIGHT</button></div></div>`;
        box.querySelectorAll('.eg-grid button').forEach(b => b.onclick = () => {
          const id = b.dataset.id, i = pick.indexOf(id);
          if (i >= 0) pick.splice(i, 1); else if (pick.length < 4) pick.push(id); else { pick.shift(); pick.push(id); }
          sfx('menumove', .4); draw();
        });
        box.querySelector('.eg-go').onclick = () => { sfx('select', .6); box.parentNode.removeChild(box); res(pick.slice()); };
        box.querySelector('.eg-back').onclick = () => { box.parentNode.removeChild(box); res(null); };
      };
      draw(); document.body.appendChild(box);
    });
  }

  /* ---------------------------------------------------------------- the cutscene */
  const MEET = String.raw`
@party Scraps,Ginger,Yatta,Ralsei
@room gardenview 70 206 right
@fade out 0.01
@music stop
@card The Door With No Lock|GARDENVIEW · LATE
@fade in 1
@party off
@lead 90 206 right
@walk Ralsei 200 196 0.01
@face Ralsei left
Ralsei.serious: It's still open. | I came back to close it.
Scraps: I drew it. I'll erase it.
@sfx electric_talk 0.6
@shake 2
* (A phone is ringing inside the vent.)
@spawn Spamton 250 168 left
@alpha Spamton 0
@flash #ff8ad8
@alpha Spamton 1
@sfx spamton_laugh 0.8
Spamton: WELL, WELL. A DOOR STRAIGHT TO THE [Factory Floor]. | WHO LEFT THIS OPEN?
Spamton: THAT PRESS DOWNSTAIRS MAKES BODIES, RIGHT? | HOW MUCH FOR ONE WITHOUT THE WIRES?
Ginger: We're not for sale.
Spamton: GOOD. I DIDN'T ASK FOR YOU.
@sfx joker_laugh0 0.8
@spawn Jevil 140 160 right
@alpha Jevil 0
@flash #b07bff
@alpha Jevil 1
@anim Jevil joker_dance_ 8 12
Jevil: LITTLE PRINCE! YOU LEFT THE DOOR OPEN. | IS THAT HOW YOUR GAME WORKS NOW?
Ralsei.shock: Jevil? How did you get out?
Jevil: OUT? I NEVER LEFT MY CELL. | I JUST FOUND A BIGGER ONE.
@idle Jevil
Yatta: Is this a party!?
Ginger: No.
Spamton: ONE PRINT FOR ME. | AFTER THAT, YOU CAN HAVE THE MACHINE.
Jevil: GOOD, GOOD. | THEN THE REST OF THE TURNS ARE MINE.
@sfx sneo_overpower 0.9
@shake 8
@flash #fff
@remove Spamton
@spawn NEO 250 176 left
@scale NEO 0.9
NEO: STILL GOT THE [Wires]. | FINE. I'LL TAKE THE NEXT ONE.
Scraps: ...Everyone. | Pick your team.
@end`;
  const AFTER = String.raw`
@party Scraps,Ginger,Yatta,Ralsei
@room gardenview 70 206 right
@party off
@lead 90 206 right
@walk Ralsei 200 196 0.01
@face Ralsei left
@spawn Jevil 150 166 right
@frame Jevil joker_tired_0
@fade in 1
@music stop
Jevil: HEE HEE... I'M TIRED. | KEEP YOUR DOOR.
@sfx joker_byebye 0.8
@flash #b07bff
@remove Jevil
* (Something small and gray lies where Spamton NEO fell. A phone inside it rings once, then stops.)
Ralsei.content: Now. The door.
@sfx dooropen 0.6
* (Scraps erases the flower. The vent is just a vent.)
Yatta: ...Can we have a party now?
Ginger: Yes.
@end`;

  async function play() {
    prepare();
    const st = (() => { try { const s = Raid.state(); return s.flowery || (s.flowery = {}); } catch (_) { return {}; } })();
    const host = document.createElement('div'); host.className = 'fk-root';
    document.body.appendChild(host);
    FW.open(host, {});
    await FW.play(MEET);
    for (;;) {
      host.style.display = 'none';
      const team = await pickTeam();
      if (!team) break;
      const r = await new Promise(res => EG.startEg(team, res));
      host.style.display = ''; $('#app').hidden = true;
      if (r === 'win') {
        st.endgame = true; try { Save.write(); } catch (_) { /* optional */ }
        await FW.play(AFTER);
        break;
      }
      if (r === 'quit') break;
    }
    FW.close(); host.parentNode && host.parentNode.removeChild(host);
    $('#app').hidden = false;
    try { Music.screen(Screens.cur); } catch (_) { /* optional */ }
    try { Screens.render(); } catch (_) { /* optional */ }
  }

  // A straight rematch from the event menu after the ten story segments.
  async function battle() {
    prepare();
    const team = await pickTeam();
    if (!team) return;
    try {
      const result = await new Promise(res => EG.startEg(team, res));
      if (result === 'win') {
        const raid = Raid.state();
        const st = raid.flowery || (raid.flowery = {});
        st.endgame = true;
        try { Save.write(); } catch (_) { /* optional */ }
      }
    } finally {
      if (EG.root) EG.closeBattle(true);
      $('#battle').hidden = true;
      $('#app').hidden = false;
      if (typeof StoryUI !== 'undefined') StoryUI.overlay = false;
      try { Music.screen(Screens.cur); } catch (_) { /* optional */ }
    }
  }

  window.FlEndgame = { play, battle, EG, TUNE, QTE_MULT, prepare, pickTeam };
})();
