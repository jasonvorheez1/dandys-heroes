/* ch2-engine.js - Chapter 2 battle rules for the Toons.
   Extends StoryBattle (story-engine.js) with the hooks it calls when a Toon
   fights: generic data-driven skills (`fx`), per-Toon passives, Research /
   Rail Marker / Fray / Haunt statuses and the Toon auto-play brain. Pure logic. */
'use strict';

(function () {
  const P = StoryBattle.prototype;
  const BUFFS = ['atkUp', 'magUp', 'defUp', 'haste', 'shield', 'regen', 'counter', 'taunt', 'ward'];
  const ST = (k, t, extra) => [k, t, 1, extra];

  /* Highest Max HP among living enemies (bosses first): Vee's Headline. */
  P.headline = function () {
    return this.living('e').slice().sort((a, b) => (b.boss ? 1 : 0) - (a.boss ? 1 : 0) || b.max.hp - a.max.hp)[0] || null;
  };

  P.addResearch = function (t, n, ev) {
    if (!t || !t.alive || t.side !== 'e') return;
    const was = t.research || 0;
    t.research = Math.min(3, was + n);
    t.st.research = { t: 99, n: t.research };
    ev.push({ t: 'status', target: t.uid, k: 'research' });
    if (t.research >= 3 && was < 3) {
      t.st.exposed = { t: 99 };
      ev.push({ t: 'text', text: `${t.name} is Exposed! Its next charged attack will be interrupted.`, actor: t.uid, cls: 'break' });
      ev.push({ t: 'status', target: t.uid, k: 'exposed' });
    }
  };

  P.stripBuffs = function (t, ev) {
    let any = false;
    BUFFS.forEach(k => { if (t.st[k]) { delete t.st[k]; any = true; } });
    if (any) ev.push({ t: 'text', text: `${t.name} loses its bonuses!`, actor: t.uid });
  };

  /* One foe-side rider: ['status', turns, chance, extra] or a named effect. */
  P.fxFoe = function (u, t, f, ev) {
    if (!t.alive) return;
    (f.foe || []).forEach(([k, turns, chance, extra]) => {
      if (!t.alive) return;
      if (chance != null && this.rng() >= chance) return;
      if (k === 'fray') {
        const cur = t.st.fray ? (t.st.fray.n || 1) : 0;
        this.apply(u, t, 'fray', turns, { n: Math.min(4, cur + 1) }, ev);
      } else this.apply(u, t, k, turns, extra, ev);
    });
    if (f.push && t.alive) { t.ct += this.delay(t) * f.push; }
    if (f.interrupt && t.alive && t.tele) {
      t.tele = null; t.stagger && (t.stagger.cur = Math.min(t.stagger.max - 1, t.stagger.cur + 1));
      ev.push({ t: 'text', text: `${t.name}'s attack is interrupted!`, actor: t.uid, cls: 'break' });
    }
    if (f.research && t.alive) this.addResearch(t, f.research, ev);
    if (f.stunScale && t.alive) {
      const ch = f.stunScale[0] + f.stunScale[1] * (t.research || 0);
      if (this.rng() < ch) this.apply(u, t, 'stun', 1, null, ev);
      if (t.boss && (t.research || 0) >= 3) this.stripBuffs(t, ev);
      else if (!t.boss && (t.research || 0) >= 3) this.stripBuffs(t, ev);
    }
  };

  P.pickAllies = function (u, sk, T) {
    const allies = this.living('p');
    if (sk.target === 'allies' || sk.target === 'self-allies') return allies;
    if (sk.target === 'self') return [u];
    if (sk.target === 'ko') return T ? [T] : [];
    if (T && T.alive && T.side === 'p') return [T];
    // default: whoever needs it most
    return [allies.slice().sort((a, b) => a.hp / a.max.hp - b.hp / b.max.hp)[0] || u];
  };

  /* The generic skill runner. `sk.fx` describes the whole effect. */
  P.fxSkill = function (u, sk, T, ev, isBond) {
    const f = sk.fx, foes = this.living('e');
    const mine = isBond ? this.living('p') : this.pickAllies(u, sk, T);
    const opts = { stagger: sk.stagger != null ? sk.stagger : 1, skill: true, sid: sk.id || 'bond' };
    let tgt = null;
    if (sk.target === 'enemy') tgt = T && T.alive && T.side === 'e' ? T : foes[0];

    if (f.selfCost) {
      const cost = Math.min(u.hp - 1, Math.round(u.max.hp * f.selfCost));
      if (cost > 0) { u.hp -= cost; ev.push({ t: 'text', text: `${u.name} gives up some of ${u.name === 'Cosmo' ? 'his' : 'their'} own strength…`, actor: u.uid }); }
    }
    // ---- damage
    if (f.dmg && foes.length) {
      const rounds = f.hits || 1;
      for (let r = 0; r < rounds; r++) {
        let list;
        if (f.all) list = this.living('e');
        else if (f.random) { const l = this.living('e'); list = l.length ? [this.rng.pick(l)] : []; }
        else list = tgt && tgt.alive ? [tgt] : this.living('e').slice(0, 1);
        list.forEach(t => {
          if (!t.alive) return;
          let mult = 1;
          if (f.bonus && this.has(t, f.bonus.has)) { mult = f.bonus.mult; }
          this.hit(u, t, f.power, f.dmg, ev, Object.assign({}, opts, { mult }));
          if (f.bonus && f.bonus.consume && t.alive) delete t.st[f.bonus.has];
          if (t.alive) this.fxFoe(u, t, f, ev);
        });
      }
    } else if (!f.dmg && (f.foe || f.push || f.interrupt || f.research || f.taunt)) {
      const list = f.all ? this.living('e') : (tgt ? [tgt] : []);
      list.forEach(t => this.fxFoe(u, t, f, ev));
    }
    if (f.taunt) this.living('e').forEach(t => this.apply(u, t, 'taunt', f.taunt, null, ev));
    if (f.selfBuffOnHit === undefined) { /* placeholder for readability */ }

    // ---- allies
    if (f.heal) mine.forEach(a => {
      if (!a.alive) return;
      const amt = a.max.hp * (f.heal.pct || 0) + this.stat(u, 'mag') * (f.heal.mag || 0);
      const low = f.heal.lowBonus && a.hp / a.max.hp < .4 ? 1.35 : 1;
      this.healRaw(a, amt * low, ev, sk.name);
    });
    if (f.revive) mine.forEach(a => { if (!a.alive) this.revive(a, f.revive, ev); });
    if (f.cleanse) {
      const who = f.cleanse === 'self' ? [u] : f.cleanse === 'team' ? this.living('p') : mine;
      who.forEach(a => this.cleanse(a, ev));
    }
    if (f.shield) {
      const who = f.shield.who === 'self' ? [u] : f.shield.who === 'team' ? this.living('p') : mine;
      who.forEach(a => this.apply(u, a, 'shield', f.shield.turns || 3, { v: Math.round((f.shield.of === 'target' ? a.max.hp : u.max.hp) * f.shield.pct) }, ev));
    }
    (f.ally || []).forEach(([k, turns, ch, extra]) => mine.forEach(a => { if (a.alive) this.apply(u, a, k, turns, extra, ev); }));
    (f.team || []).forEach(([k, turns, ch, extra]) => this.living('p').forEach(a => this.apply(u, a, k, turns, extra, ev)));
    (f.self || []).forEach(([k, turns, ch, extra]) => this.apply(u, u, k, turns, extra, ev));
    if (f.cleanseFoe) this.living('e').forEach(t => this.stripBuffs(t, ev));
    if (f.fpAlly) mine.forEach(a => { a.fp = Math.min(a.max.fp, a.fp + f.fpAlly); ev.push({ t: 'fp', target: a.uid, amount: f.fpAlly }); });
    if (f.fpTeam) this.living('p').forEach(a => { if (a !== u || f.fpTeamSelf) { a.fp = Math.min(a.max.fp, a.fp + f.fpTeam); ev.push({ t: 'fp', target: a.uid, amount: f.fpTeam }); } });
    if (f.fpLowest) {
      const low = this.living('p').slice().sort((a, b) => a.fp / a.max.fp - b.fp / b.max.fp)[0];
      if (low) { low.fp = Math.min(low.max.fp, low.fp + f.fpLowest); ev.push({ t: 'fp', target: low.uid, amount: f.fpLowest }); }
    }
    if (f.solver) this.problemSolver(u, mine[0] || u, ev);
    if (f.healSelf) this.healRaw(u, u.max.hp * f.healSelf, ev, sk.name);
    if (f.bondTeam) this.living('p').forEach(a => { a.bond = Math.min(100, a.bond + f.bondTeam); });
  };

  /* Shelly picks whichever fix the ally needs most. */
  P.problemSolver = function (u, a, ev) {
    if (a.hp / a.max.hp < .5) {
      ev.push({ t: 'text', text: `Recovery Solution: ${a.name} gets patched up!`, actor: u.uid });
      this.healRaw(a, a.max.hp * .28 + this.stat(u, 'mag') * .8, ev, 'Problem Solver');
      this.apply(u, a, 'shield', 3, { v: Math.round(a.max.hp * .15) }, ev);
    } else if (a.fp / a.max.fp < .45) {
      ev.push({ t: 'text', text: `Offensive Solution: ${a.name} gets a second wind!`, actor: u.uid });
      a.fp = Math.min(a.max.fp, a.fp + 14); ev.push({ t: 'fp', target: a.uid, amount: 14 });
      this.apply(u, a, 'atkUp', 3, null, ev);
    } else {
      ev.push({ t: 'text', text: `Defensive Solution: ${a.name} is covered!`, actor: u.uid });
      this.apply(u, a, 'defUp', 3, null, ev); this.apply(u, a, 'ward', 3, { v: .2 }, ev);
    }
  };

  /* ---------- hooks ---------- */
  P.toonTurnStart = function (u, ev) {
    if (u.side !== 'p' || !u.alive) return;
    if (u.key === 'Tisha') {
      const dirty = this.living('p').find(a => ['ink', 'atkDown', 'defDown', 'slow', 'fray'].some(k => a.st[k]));
      if (dirty) { this.cleanse(dirty, ev); ev.push({ t: 'text', text: `Tidy Habits! ${dirty.name} is wiped clean.`, actor: u.uid, cls: 'heal' }); }
      u.fp = Math.min(u.max.fp, u.fp + 2);
    }
    if (u.key === 'Goob' && u.hp / u.max.hp < .3 && !u.cheered) {
      u.cheered = true; this.apply(u, u, 'defUp', 3, null, ev); this.apply(u, u, 'regen', 3, { v: .07 }, ev);
      ev.push({ t: 'text', text: 'Goob refuses to stay down. "You can do it, me!"', actor: u.uid, cls: 'heal' });
    }
  };

  P.toonDodge = function (src, tgt, o, ev) {
    if (tgt.side !== 'p' || o.noDodge || o.isCounter) return false;
    let p = 0;
    if (tgt.key === 'Connie') p += .2;
    if (this.has(tgt, 'dodge')) p += .3;
    if (!p || this.rng() >= Math.min(.55, p)) return false;
    ev.push({ t: 'miss', target: tgt.uid });
    if (tgt.key === 'Connie') { tgt.fp = Math.min(tgt.max.fp, tgt.fp + 2); tgt.bond = Math.min(100, tgt.bond + 4); }
    return true;
  };

  P.toonMods = function (src, tgt, dmg, kind, o, ev) {
    if (src.side === 'p') {
      const k = src.key;
      if (k === 'Dyle') {
        if (this.has(tgt, 'rail')) dmg *= 1.3;
        if (tgt.tele) { dmg *= 1.35; src.fp = Math.min(src.max.fp, src.fp + 3); }
      }
      if (k === 'Scraps') {
        if (this.has(tgt, 'fray')) dmg *= 1 + .05 * (tgt.st.fray.n || 1);
        if (o.basic || o.skill) {
          src.craft = (src.craft || 0) + 1;
          if (src.craft % 3 === 0) { dmg *= 1.4; o.craftTrig = true; }
        }
      }
      if (k === 'Vee') {
        if (tgt === this.headline()) dmg *= 1.2 * (1 + .05 * (src.rt || 0));
      }
      if (k === 'Connie' && this.has(tgt, 'haunt')) dmg *= 1.25;
      if (k === 'Rudie') dmg *= 1 + .06 * (src.mom || 0);
      if (k === 'Tisha' && tgt.def && tgt.def.art && tgt.def.art[0] === 'w') dmg *= 1.25;
      if (o.skill && k !== 'Shelly' && this.living('p').some(x => x.key === 'Shelly')) {
        dmg *= (this.has(tgt, 'mark') || this.has(tgt, 'exposed') || tgt.research >= 1) ? 1.2 : 1.1;
      }
      if (tgt.side === 'e' && this.has(tgt, 'exposed')) dmg *= 1.15;
    } else if (tgt.side === 'p') {
      if (tgt.key === 'Goob') dmg *= .85;
      if (tgt.key === 'Coal') dmg *= Math.max(.62, .94 - .03 * (tgt.sturdy || 0));
      if (this.has(tgt, 'ward')) dmg *= 1 - (tgt.st.ward.v || .2);
      if (o.aoe && this.living('p').some(x => x.key === 'Brightney')) dmg *= .85;
    }
    return dmg;
  };

  P.toonAfterHit = function (src, tgt, dmg, kind, o, ev) {
    if (src.side === 'p') {
      if (src.key === 'Rudie') src.mom = Math.min(6, (src.mom || 0) + 1);
      if (src.key === 'Vee' && tgt === this.headline()) src.rt = Math.min(8, (src.rt || 0) + 1);
      if (src.key === 'Scraps' && o.craftTrig && tgt.hp > 0) {
        const cur = tgt.st.fray ? (tgt.st.fray.n || 1) : 0;
        this.apply(src, tgt, 'fray', 3, { n: Math.min(4, cur + 1) }, ev);
        ev.push({ t: 'text', text: 'Craft hit! Frayed!', actor: src.uid });
      }
      if (src.key === 'Dyle' && o.basic && tgt.hp > 0 && !this.has(tgt, 'rail') && this.rng() < .4) {
        this.apply(src, tgt, 'rail', 3, null, ev);
      }
    } else if (tgt.side === 'p') {
      if (tgt.key === 'Coal') tgt.sturdy = Math.min(8, (tgt.sturdy || 0) + 1);
      if (tgt.key === 'Goob') tgt.bond = Math.min(100, tgt.bond + 3);
    }
  };

  /* Exposed foes get a charged attack cancelled once, if Rodger is on the field. */
  P.toonInterrupt = function (u, move, ev) {
    if (!this.has(u, 'exposed')) return false;
    const r = this.living('p').find(x => x.key === 'Rodger');
    if (!r) return false;
    delete u.st.exposed; delete u.st.research; u.research = 0;
    ev.push({ t: 'text', text: `Rodger interrupts ${u.name}'s ${move.name}! “Observation, not speculation.”`, actor: r.uid, cls: 'break' });
    r.bond = Math.min(100, r.bond + 10);
    return true;
  };

  /* ---------- auto play for Toons ---------- */
  P.toonAuto = function (u, c) {
    const { foes, allies, ko, lowest, charging, target, has } = c;
    const act = (id, t) => ({ type: 'skill', id, target: t ? t.uid : undefined });
    const lowPct = lowest.hp / lowest.max.hp;
    const hurt = allies.filter(a => a.hp / a.max.hp < .6).length;
    switch (u.key) {
      case 'Sprout':
        if (hurt >= 2 && has('oven')) return act('oven');
        if (lowPct < .5 && has('sweets')) return act('sweets', lowest);
        if (lowPct < .8 && has('stayclose') && !this.has(lowest, 'regen')) return act('stayclose', lowest);
        break;
      case 'Cosmo':
        if (lowPct < .5 && lowest !== u && has('share') && u.hp / u.max.hp > .5) return act('share', lowest);
        if (hurt >= 2 && has('comfort')) return act('comfort');
        if (lowPct < .8 && has('treats') && !this.has(lowest, 'regen')) return act('treats', lowest);
        if (lowPct < .45 && has('gift')) return act('gift');
        break;
      case 'Astro':
        if (foes.length >= 3 && has('stars')) return act('stars');
        { const sl = foes.find(f => !f.boss && !this.has(f, 'sleep') && f !== target);
          if (sl && has('slumber') && foes.length >= 2) return act('slumber', sl); }
        if (has('pulse')) return act('pulse', target);
        break;
      case 'Tisha':
        if (allies.some(a => a.st.ink || a.st.atkDown || a.st.defDown) && has('scrub')) return act('scrub', allies.find(a => a.st.ink || a.st.atkDown || a.st.defDown));
        if (hurt >= 2 && has('spotless')) return act('spotless');
        if (foes.length >= 3 && has('sweep')) return act('sweep');
        if (!this.has(target, 'defDown') && has('mopup')) return act('mopup', target);
        break;
      case 'Rodger':
        if (charging && has('capsule')) return act('capsule', charging);
        if (!this.has(target, 'exposed') && (target.research || 0) < 3 && has('casefile') && target.boss) return act('casefile', target);
        if (this.has(target, 'exposed') && has('closed')) return act('closed', target);
        if (has('notes')) return act('notes', target);
        break;
      case 'Shelly':
        if (lowPct < .5 && has('solver')) return act('solver', lowest);
        if (!allies.some(a => this.has(a, 'atkUp')) && has('inspire')) return act('inspire');
        if (foes.length && !this.has(target, 'defDown') && has('core')) return act('core', target);
        break;
      case 'Vee': {
        const hl = this.headline();
        if (foes.length >= 3 && has('surge')) return act('surge');
        if (charging && has('static')) return act('static', charging);
        if (hl && this.has(hl, 'mark') && has('live')) return act('live', hl);
        if (hl && has('beam')) return act('beam', hl);
        break;
      }
      case 'Dyle':
        if (charging && has('gap')) return act('gap', charging);
        if (foes.length >= 3 && has('express')) return act('express');
        if (has('lastTrain') && foes.some(f => this.has(f, 'rail'))) return act('lastTrain', foes.find(f => this.has(f, 'rail')));
        if (!foes.some(f => this.has(f, 'rail')) && has('allaboard')) return act('allaboard');
        if (has('gap')) return act('gap', target);
        break;
      case 'Scraps':
        if (foes.length >= 3 && has('crash')) return act('crash');
        if (has('grapple') && target.boss) return act('grapple', target);
        if (has('claws')) return act('claws', target);
        break;
      case 'Goob':
        if (hurt >= 2 && has('cheer') && !allies.some(a => this.has(a, 'regen'))) return act('cheer');
        if (charging && has('bighug')) return act('bighug', charging);
        if (has('groupHug') && foes.length >= 3) return act('groupHug');
        if (has('bighug')) return act('bighug', target);
        break;
      case 'Connie':
        if (!foes.some(f => this.has(f, 'haunt')) && has('prank')) return act('prank', target);
        if (foes.length >= 3 && has('presence')) return act('presence');
        if (allies.every(a => !this.has(a, 'dodge')) && has('drift') && hurt >= 1) return act('drift');
        if (has('prank')) return act('prank', target);
        break;
      case 'Brightney':
        if (foes.length >= 3 && has('flash') && !foes.some(f => this.has(f, 'taunt'))) return act('flash');
        if (!this.has(u, 'shield') && has('guard') && u.hp / u.max.hp < .8) return act('guard');
        if (!this.has(target, 'defDown') && has('beam')) return act('beam', target);
        break;
      case 'Rudie':
        if (!this.has(u, 'haste') && has('redNose')) return act('redNose');
        if (foes.length >= 3 && has('rush')) return act('rush');
        if (has('barrage')) return act('barrage', target);
        break;
      case 'Coal':
        if (!this.has(u, 'taunt') && !foes.some(f => this.has(f, 'taunt')) && has('stayPut')) return act('stayPut');
        if (lowPct < .6 && lowest !== u && has('cozy')) return act('cozy', lowest);
        if (charging && has('rolling')) return act('rolling', charging);
        if (has('rockToss')) return act('rockToss', target);
        break;
    }
    return null;
  };
})();
