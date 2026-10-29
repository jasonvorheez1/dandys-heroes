/* ch3-engine.js - Chapter 3 battle rules.
   Lethal strikes (a telegraphed hit that kills outright unless a Tank can take it), Barrier Sign,
   silence, squad bonuses, skill ranks, trinket stats from the game's own gear, the tiered
   enemy ramp, and the passives of Pebble, Bobette, Bassie, Gourdy, Toodles, Eclipse and Cocoa.
   Pure logic; extends StoryBattle after ch2-engine.js. */
'use strict';

/* A Chapter 3 room acts on every fourth combat turn. Keep this rule here so
   the live battle and balance simulator use the same consequences. */
function st3Hazard(B, kind, turns) {
  if (turns % 4) return [];
  const ev = [], party = B.living('p'), foes = B.living('e');
  if (!party.length || !foes.length) return ev;
  const caller = foes[0];
  if (kind === 'signal') {
    const target = party[Math.floor(B.rng() * party.length)];
    ev.push({ t: 'text', text: `Camera sweep! ${target.name} is in frame.`, cls: 'big' });
    B.apply(caller, target, 'mark', 3, null, ev);
  } else if (kind === 'blackout') {
    ev.push({ t: 'text', text: 'The gallery lights die. Footsteps move in the dark.', cls: 'big' });
    party.forEach(u => B.apply(caller, u, 'slow', 2, null, ev));
  } else if (kind === 'rack') {
    ev.push({ t: 'text', text: 'A costume rack opens. The copies brace themselves.', cls: 'big' });
    foes.forEach(u => B.apply(caller, u, 'defUp', 2, null, ev));
  } else if (kind === 'sorter') {
    ev.push({ t: 'text', text: 'The sorter rings. The hum steals 2 FP from every Toon.', cls: 'big' });
    party.forEach(u => { const amount = Math.min(2, u.fp); u.fp -= amount; if (amount) ev.push({ t: 'fp', target: u.uid, amount: -amount }); });
  } else if (kind === 'pressure') {
    ev.push({ t: 'text', text: 'The pipe vents. Get behind a shield!', cls: 'big' });
    party.forEach(u => B.hit(caller, u, .24, 'mag', ev, { noDodge: true, stagger: 0 }));
    B.checkEnd(ev);
  }
  return ev;
}

/* One trinket's stat line ("+2.5% Healing Power and +1.7% Max HP") turned into story stat mods. */
function st3StatMods(text, mult) {
  const out = {};
  const keys = [[/magic defense/i, 'mdef'], [/defense/i, 'def'], [/max hp/i, 'hp'], [/magic attack/i, 'mag'], [/attack speed|move speed/i, 'spd'],
    [/attack/i, 'atk'], [/evasion/i, 'dodge'], [/healing power/i, 'healPow'], [/shield power/i, 'shieldPow'], [/cooldown reduction|skill haste/i, 'fpCut'],
    [/energy generation/i, 'fpTurn'], [/crit damage/i, 'atk']];
  String(text || '').split(/,| and /).forEach(part => {
    const m = /(\d+(?:\.\d+)?)%\s*(.*)/.exec(part); if (!m) return;
    const hit = keys.find(([re]) => re.test(m[2])); if (!hit) return;
    const v = parseFloat(m[1]) / 100 * (mult || 3);
    out[hit[1]] = (out[hit[1]] || 0) + (hit[1] === 'spd' ? v * .5 : v);
  });
  return out;
}

(function () {
  const P = StoryBattle.prototype;

  /* A Tank is a Guardian-type Toon, or anyone standing behind a Barrier Sign. */
  P.isTank = function (u) {
    return !!u && u.side === 'p' && u.alive && (ST3_TANKS.has(u.key) || this.has(u, 'barrier'));
  };
  P.tankOf = function () {
    return this.living('p').filter(x => this.isTank(x)).sort((a, b) => b.hp / b.max.hp - a.hp / a.max.hp)[0] || null;
  };

  /* Returns true when the strike was fully resolved here. False = resolve it as an ordinary hit. */
  P.lethalStrike = function (src, tgt, move, ev) {
    if (!tgt || !tgt.alive || tgt.side !== 'p') return true;
    const tank = this.tankOf();
    if (move.target === 'all') {
      if (tank) return false;
    } else if (tank) {
      if (tank === tgt) return false;
      ev.push({ t: 'text', text: `${tank.name} steps in front!`, actor: tank.uid, cls: 'break' });
      this.hit(src, tank, move.power * 1.15, move.kind === 'mag' ? 'mag' : 'phys', ev, { stagger: 0 });
      return true;
    }
    if (this.toonDodge && this.toonDodge(src, tgt, {}, ev)) return true;
    if (this.has(tgt, 'shield')) {
      delete tgt.st.shield; ev.push({ t: 'expire', target: tgt.uid, k: 'shield' });
      ev.push({ t: 'text', text: `${tgt.name}'s shield takes the hit and breaks.`, actor: tgt.uid, cls: 'break' });
      this.hit(src, tgt, move.power * .6, move.kind === 'mag' ? 'mag' : 'phys', ev, { stagger: 0, noDodge: true });
      return true;
    }
    ev.push({ t: 'text', text: `Nobody was in front. ${tgt.name} is down.`, actor: src.uid, cls: 'break' });
    ev.push({ t: 'lethal', target: tgt.uid });
    tgt.hp = 0; tgt.bond = 0;
    this.kill(tgt, ev);
    return true;
  };

  /* ---------- skill ranks and trinkets ---------- */
  function scaleFx(fx, rank, tm) {
    const f = JSON.parse(JSON.stringify(fx));
    const pw = 1 + .12 * rank, hl = (1 + .1 * rank) * (1 + (tm.healPow || 0)), sh = (1 + .1 * rank) * (1 + (tm.shieldPow || 0));
    if (f.power) f.power *= pw;
    if (f.heal) { if (f.heal.pct) f.heal.pct *= hl; if (f.heal.mag) f.heal.mag *= hl; }
    if (f.shield && f.shield.pct) f.shield.pct *= sh;
    if (rank >= 2) ['foe', 'ally', 'team', 'self'].forEach(k => (f[k] || []).forEach(e => { if (e[1] <= 3 && e[0] !== 'ward') e[1] += 1; }));
    if (rank >= 3 && f.taunt) f.taunt += 1;
    return f;
  }
  function scaleSkill(sk, rank, tm) {
    const c = Object.assign({}, sk);
    c.fp = Math.max(3, Math.round(sk.fp * (1 - Math.min(.3, tm.fpCut || 0))) - rank);
    if (sk.fx) c.fx = scaleFx(sk.fx, rank, tm); else if (sk.power) c.power = sk.power * (1 + .12 * rank);
    if (rank) c.desc = sk.desc + ` (Rank ${['', 'I', 'II', 'III'][rank]}: +${12 * rank}% power, −${rank} FP.)`;
    return c;
  }
  const baseAdd = P.addHandler;
  P.addHandler = function (p, opt) {
    const u = baseAdd.call(this, p, opt);
    u.sq = p.sq || null;
    const tm = p.tm || {}, rank = p.rank || 0;
    ['atk', 'mag', 'def', 'mdef', 'spd'].forEach(k => { if (tm[k]) u.s[k] *= 1 + Math.min(.5, tm[k]); });
    if (tm.hp) { const was = u.max.hp; u.max.hp = Math.round(u.max.hp * (1 + Math.min(.5, tm.hp))); u.hp = Math.round(u.hp * u.max.hp / was); u.s.hp = u.max.hp; }
    u.trinDodge = Math.min(.25, tm.dodge || 0); u.trinFpTurn = tm.fpTurn ? Math.round(tm.fpTurn * 40) / 10 : 0;
    if (rank || Object.keys(tm).length) u.skills = u.skills.map(sk => scaleSkill(sk, rank, tm));
    u.rank = rank;
    if (u.sq === 'residents') u.bond = Math.max(u.bond, 25);
    if (u.sq === 'handlers' && !this._handlerSigns) { this._handlerSigns = true; this.items.barrier = (this.items.barrier || 0) + 1; }
    return u;
  };

  const baseDodge = P.toonDodge;
  P.toonDodge = function (src, tgt, o, ev) {
    if (baseDodge && baseDodge.call(this, src, tgt, o, ev)) return true;
    if (tgt.side !== 'p' || o.noDodge || o.isCounter || !tgt.trinDodge || this.rng() >= tgt.trinDodge) return false;
    ev.push({ t: 'miss', target: tgt.uid });
    return true;
  };

  /* ---------- turn start, damage mods, bond ---------- */
  const baseTurnStart = P.toonTurnStart;
  P.toonTurnStart = function (u, ev) {
    if (baseTurnStart) baseTurnStart.call(this, u, ev);
    if (u.side !== 'p' || !u.alive) return;
    if (u.trinFpTurn) u.fp = Math.min(u.max.fp, u.fp + u.trinFpTurn);
    if (u.key === 'Pebble') {
      const a = this.living('p').find(x => x !== u && x.hp / x.max.hp < .35 && !(u.fetched && u.fetched[x.uid]));
      if (a) {
        (u.fetched = u.fetched || {})[a.uid] = true;
        this.apply(u, a, 'shield', 3, { v: Math.round(u.max.hp * .2) }, ev);
        ev.push({ t: 'text', text: `Pebble barks and plants herself in front of ${a.name}!`, actor: u.uid, cls: 'heal' });
      }
    }
    if (u.key === 'Gourdy' && !u.softHeart) {
      u.softHeart = true;
      const a = this.living('p').filter(x => x !== u).sort((x, y) => x.hp / x.max.hp - y.hp / y.max.hp)[0];
      if (a) { this.apply(u, a, 'shield', 3, { v: Math.round(u.max.hp * .12) }, ev); ev.push({ t: 'text', text: `Gourdy checks on ${a.name} first, as usual.`, actor: u.uid, cls: 'heal' }); }
    }
    if (u.key === 'Cocoa' && !u.warmed) {
      u.warmed = true;
      this.living('p').forEach(a => this.apply(u, a, 'regen', 3, { v: .04 }, ev));
      ev.push({ t: 'text', text: 'Cocoa passes the cups round. Everyone warms up.', actor: u.uid, cls: 'heal' });
    }
    if (u.key === 'Bobette') {
      const a = this.living('p').slice().sort((x, y) => x.hp / x.max.hp - y.hp / y.max.hp)[0];
      if (a) this.apply(u, a, 'shield', 2, { v: Math.round(u.max.hp * .05) }, ev);
    }
    if (u.key === 'Bassie') {
      u.drops = (u.drops || 0) + 1;
      if (u.drops % 3 === 0) {
        const a = this.living('p').slice().sort((x, y) => x.hp / x.max.hp - y.hp / y.max.hp)[0];
        if (a) { ev.push({ t: 'text', text: 'Bassie drops something. It was exactly what was needed.', actor: u.uid, cls: 'heal' }); this.healRaw(a, a.max.hp * .1, ev, 'Dropped'); }
      }
    }
  };

  const baseMods = P.toonMods;
  P.toonMods = function (src, tgt, dmg, kind, o, ev) {
    dmg = baseMods.call(this, src, tgt, dmg, kind, o, ev);
    if (src.side === 'p') {
      if (src.key === 'Toodles' && o.sid === 'gamble') dmg *= this.rng() < .5 ? 1.9 : .5;
      if (src.key === 'Eclipse' && tgt.side === 'e' && this.has(tgt, 'mark')) dmg *= 1.15;
      if (src.key === 'Brusha' && tgt.side === 'e') { if (this.has(tgt, 'defDown')) dmg *= 1.2; if (this.living('p').some(x => x.key === 'Tisha')) dmg *= 1.1; }
      if (src.sq === 'seasonals' && this.living('p').filter(x => x.sq === 'seasonals').length >= 2) dmg *= 1.08;
    } else if (tgt.side === 'p') {
      if (tgt.key === 'Toodles' && this.living('p').some(x => ST3_TANKS.has(x.key))) dmg *= .85;
      if (tgt.key === 'Gourdy' && this.living('p').some(x => x.key === 'Soulvester')) dmg *= .85;
      if ((tgt.key === 'Brusha' && this.living('p').some(x => x.key === 'Tisha')) || (tgt.key === 'Tisha' && this.living('p').some(x => x.key === 'Brusha'))) dmg *= .9;
    }
    return dmg;
  };

  const baseAfter = P.toonAfterHit;
  P.toonAfterHit = function (src, tgt, dmg, kind, o, ev) {
    if (baseAfter) baseAfter.call(this, src, tgt, dmg, kind, o, ev);
    if (src.side === 'p' && src.sq === 'handlers') src.bond = Math.min(100, src.bond + 1);
    if (tgt.side === 'p' && tgt.sq === 'handlers') tgt.bond = Math.min(100, tgt.bond + 1);
  };

  const baseKill = P.kill;
  P.kill = function (u, ev) {
    const wasAlive = u.alive;
    baseKill.call(this, u, ev);
    if (wasAlive && u.side === 'p') this.living('p').filter(x => x.key === 'Toodles').forEach(t => {
      this.apply(t, t, 'atkUp', 3, null, ev);
      ev.push({ t: 'text', text: 'Toodles stops smiling for a second, and then he is moving.', actor: t.uid });
    });
  };

  /* ---------- the tiered ramp ---------- */
  const baseAddFoe = P.addFoe;
  P.addFoe = function (key, lv, extra) {
    const u = baseAddFoe.call(this, key, lv, extra);
    if (!u) return u;
    const tier = this.tier || 0;
    u.tier = tier;
    const adds = (ST3_EXTRA[key] || []).filter(e => e.tier <= tier).map(e => e.move);
    if (adds.length) u.def = Object.assign({}, u.def, { moves: u.def.moves.concat(adds) });
    if (tier) { u.s.atk *= 1 + .05 * tier; u.s.mag *= 1 + .05 * tier; }
    return u;
  };

  const baseEnemyAct = P.enemyAct;
  P.enemyAct = function (u) {
    const ev = baseEnemyAct.call(this, u);
    const tier = u.tier || 0;
    // Eclipse smells a lethal charge coming.
    const ch = ev.find(e => e.t === 'charge' && e.lethal);
    if (ch && this.living('p').some(x => x.key === 'Eclipse')) {
      this.living('p').forEach(a => this.apply(a, a, 'ward', 1, { v: .2 }, ev));
      ev.push({ t: 'text', text: 'Eclipse growls. Everyone braces.', actor: this.living('p').find(x => x.key === 'Eclipse').uid });
    }
    // From tier 2 on, enemies sometimes get a second swing in the same turn.
    if (tier >= 2 && u.alive && !u.tele && !this.over && !ch && this.rng() < .16 + .07 * (tier - 2)) {
      const m = u.def.moves.filter(x => (x.kind === 'phys' || x.kind === 'mag') && !x.lethal && !x.tele && x.target !== 'all' && !(x.hits > 1));
      const mv = m.length ? this.rng.pick(m) : null, tgt = mv && this.pickTarget(u, mv);
      if (mv && tgt) {
        ev.push({ t: 'text', text: `${u.name} swings again before anyone can move.`, actor: u.uid });
        ev.push({ t: 'act', actor: u.uid, name: mv.name, kind: 'enemy' });
        this.hit(u, tgt, mv.power * .75, mv.kind, ev, { stagger: 0 });
        this.checkEnd(ev);
      }
    }
    return ev;
  };

  const baseAuto = P.toonAuto;
  P.toonAuto = function (u, c) {
    const { foes, allies, lowest, charging, target, has } = c;
    const act = (id, t) => ({ type: 'skill', id, target: t ? t.uid : undefined });
    const lowPct = lowest.hp / lowest.max.hp;
    const hurt = allies.filter(a => a.hp / a.max.hp < .6).length;
    switch (u.key) {
      case 'Pebble':
        if (charging && has('tackle')) return act('tackle', charging);
        if (!foes.some(f => this.has(f, 'taunt')) && has('speak') && (foes.length >= 2 || foes.some(f => f.boss))) return act('speak');
        if (lowPct < .5 && lowest !== u && has('stay')) return act('stay', lowest);
        if (hurt >= 2 && has('goodboy')) return act('goodboy');
        if (has('tackle')) return act('tackle', target);
        return null;
      case 'Gourdy':
        if (charging && has('smash')) return act('smash', charging);
        if (!foes.some(f => this.has(f, 'taunt')) && has('patch')) return act('patch');
        if (lowPct < .5 && lowest !== u && has('liege')) return act('liege', lowest);
        if (foes.length >= 3 && has('seeds')) return act('seeds');
        if (has('smash')) return act('smash', target);
        return null;
      case 'Bobette':
        if (lowPct < .55 && has('tag')) return act('tag', lowest);
        if (!allies.some(a => this.has(a, 'atkUp')) && has('bow')) return act('bow');
        if (!this.tankOf() && has('box')) return act('box');
        if (lowPct < .85 && !this.has(lowest, 'shield') && has('wrap')) return act('wrap', lowest);
        return null;
      case 'Bassie':
        if (lowPct < .5 && has('drop')) return act('drop', lowest);
        if (foes.length >= 3 && has('eggs')) return act('eggs');
        if (has('basket')) return act('basket', target);
        return null;
      case 'Toodles':
        if (allies.some(a => a.key !== 'Toodles' && !this.has(a, 'atkUp')) && has('cheer') && foes.length >= 2) return act('cheer', allies.find(a => a.key !== 'Toodles' && !this.has(a, 'atkUp')));
        if (target.boss && !this.has(target, 'defDown') && has('jinx')) return act('jinx', target);
        if (foes.length >= 3 && has('balls')) return act('balls');
        if (has('gamble')) return act('gamble', target);
        return null;
      case 'Soulvester':
        if (charging && has('blow')) return act('blow', charging);
        if (!foes.some(f => this.has(f, 'taunt')) && has('line')) return act('line');
        if (lowPct < .5 && lowest !== u && has('oath')) return act('oath', lowest);
        if (u.hp / u.max.hp < .5 && has('steel')) return act('steel');
        if (has('blow')) return act('blow', target);
        return null;
      case 'Brusha':
        if (charging && has('erase')) return act('erase', charging);
        if (lowPct < .5 && lowest !== u && has('portrait')) return act('portrait', lowest);
        if (!this.tankOf() && has('wall') && foes.some(f => f.boss)) return act('wall');
        if (!this.has(target, 'defDown') && has('splash')) return act('splash', target);
        if (has('splash')) return act('splash', target);
        return null;
      case 'Eclipse':
        if (!allies.some(a => this.has(a, 'atkUp')) && has('howl') && foes.length >= 2) return act('howl');
        if (this.has(target, 'mark') && has('pounce')) return act('pounce', target);
        if (!this.has(target, 'mark') && has('scent')) return act('scent', target);
        if (!this.has(u, 'dodge') && u.hp / u.max.hp < .6 && has('circle')) return act('circle');
        return null;
      case 'Cocoa':
        if (lowPct < .55 && has('cocoa')) return act('cocoa', lowest);
        if (lowPct < .8 && !this.has(lowest, 'shield') && has('marsh')) return act('marsh', lowest);
        if (foes.length >= 3 && has('bonbon')) return act('bonbon');
        if (has('spill')) return act('spill', target);
        return null;
    }
    return baseAuto.call(this, u, c);
  };
})();
