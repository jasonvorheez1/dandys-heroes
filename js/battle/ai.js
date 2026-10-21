/* ai.js - per-unit decision making.
   The default order is Green, then Blue, then White at full Energy, but every
   skill declares its own condition so a healer waits for wounded allies, a
   controller waits for a cluster, and a burst unit saves for a real target. */
'use strict';

const AI = {

  think(u, B, dt) {
    // resolve a pending basic attack hit - committed once the windup starts,
    // same as a real fighting game: no cancelling into a reposition or a new
    // target mid-swing, and the hit only lands if the target is still where
    // the swing is actually aimed once the windup finishes.
    if (u.pendingHit) {
      u.pendingHit.t -= dt;
      u.moving = false;
      if (u.pendingHit.t <= 0) { const p = u.pendingHit; u.pendingHit = null; this.resolveBasic(u, B, p); }
      return;
    }
    // resolve a casting skill
    if (u.casting) {
      u.casting.t -= dt;
      u.moving = false;
      if (u.casting.t <= 0) {
        const c = u.casting; u.casting = null; this.fire(u, B, c.key, c);
      }
      return;
    }
    // Glisten is deliberately absent during the shared entrance and briefly
    // owns the stage while a mirror teleport resolves. Do not let the normal
    // target/position pass start a basic attack through that authored beat.
    if (u.id === 'Glisten' && u._introOpacity === 0 && !u._introRevealed) {
      // Custom battle previews and low-rarity enemy specs can skip the White
      // passive. Never let that leave Glisten permanently invisible and inert.
      if (!u._glistenOpeningStarted) {
        if (typeof glistenOpenWave === 'function') {
          glistenOpenWave(u, B, B.scaled(u, 'W'), B.skillParams(u, 'W'));
        } else if (typeof glistenReveal === 'function') {
          glistenReveal(u);
        } else {
          u._introRevealed = true; u._introOpacity = 1;
        }
      }
      u.moving = false; return;
    }
    if (u.id === 'Glisten' && u._glistenBusyUntil > B.t) {
      u.moving = false; return;
    }
    if (u.flags.noAct) { u.moving = false; return; }

    // Attack Speed is applied while the cooldown counts down below. Keep the
    // timer itself in a common combat-time unit so slower units do not get
    // penalised twice (the old code divided the interval by aspd and then
    // multiplied the countdown by aspd again, effectively using aspd²).
    if (u.atkCd > 0) u.atkCd -= dt;

    // fear: run away and do nothing else
    if (u.flags.flee) {
      const away = u.team === TEAM_P ? B.leftWall : B.rightWall;
      this.moveToward(u, B, away, dt, 1.25, u.depthHome);
      return;
    }

    // companion trailing its owner
    if (u.followTarget && u.followTarget.alive) {
      const ft = u.followTarget;
      const targetX = clamp(ft.x - ft.face * 55, B.leftWall + 20, B.rightWall - 20);
      const targetDepth = ft.depth;
      const dist = Math.hypot(targetX - u.x, (targetDepth - u.depth) * B.depthSpan);
      if (dist > 18) {
        this.moveToward(u, B, targetX, dt, 1.15, targetDepth);
      } else {
        this.holdPosition(u);
        u.face = ft.face;
      }
      return;
    }

    const distractor = u._distractor || u._teaganDistractor;
    let tgt = distractor && distractor.team !== u.team && B.isTargetable(distractor)
      && B.t < (u._distractUntil || u._teaganDistractUntil || 0) ? distractor : B.bestTarget(u);
    // A target cache can be one tick behind after a Lab duel is assembled or
    // after an entrance status expires. Refresh directly from the live team so
    // a valid solo opponent never leaves the AI in an idle fallback.
    if (!tgt) {
      const liveFoes = B.liveTeam(u.team === TEAM_P ? TEAM_E : TEAM_P)
        .filter(a => B.isTargetable(a));
      if (liveFoes.length) tgt = B.nearest(u, liveFoes);
    }
    if (u.flags.confused && chance(.5)) {
      const own = B.alliesOf(u).filter(a => a !== u);
      if (own.length) tgt = pick(own);
    }
    if (!tgt) {
      // Do not leave a dead or temporarily untargetable target attached to the
      // unit. Stale references also made aggro counters report false pressure.
      u.target = null;
      // Utility skills can still be valid while every opponent is briefly
      // untargetable (for example during a dash or phase transition). Do not
      // make the whole kit wait for a basic-attack target to reappear.
      if (!u.flags.silenced) {
        const key = this.pickSkill(u, B);
        if (key && this.beginCast(u, B, key)) return;
      }
      u.moving = false; return;
    }
    const nextFace = tgt.x === u.x ? u.face : (tgt.x > u.x ? 1 : -1);
    const changedTarget = u.target !== tgt;
    const changedFace = u.face !== nextFace;
    u.target = tgt;
    if (changedFace) { u.face = nextFace; u.turnT = .24; }
    if (changedTarget || changedFace) {
      const col = u.team === TEAM_P ? '#bfe3ff' : '#ffb1b1';
      B.fxTargetLine(u, tgt, col);
      B.fxRing(tgt.x, tgt.y - 42, 54, col, .2);
    }

    const dist = B.distance(u, tgt);

    // ---- skill selection ----
    // Skills are the combat priority once the target is close enough to be
    // meaningfully engaged. Keeping this radius separate from basic-attack
    // reach prevents a melee unit from spending every cooldown while it is
    // still crossing the arena, but guarantees a ready skill beats a basic
    // swing once the fight is actually joined.
    if (!u.flags.silenced && dist <= this.skillRadius(u)) {
      const key = this.pickSkill(u, B);
      if (key && this.beginCast(u, B, key)) return;
    }

    // ---- basic attack / approach ----
    const reach = u.st.range;
    const hitReach = B.attackReach(u, tgt);
    if (dist > hitReach) {
      // Everyone must close until the authored attack can actually connect.
      // Ranged units may hold their formation once they are in range, but
      // holding before that point leaves a whole enemy wave standing still
      // when the opening formation gap is larger than its basic range.
      if (!u.flags.noMove) {
        const dx = tgt.x - u.x, dy = B.depthDelta(u, tgt), len = Math.max(1, Math.hypot(dx, dy));
        const stop = Math.max(28, reach * (this.needsMeleePosition(u) ? .8 : .9));
        this.moveToward(u, B, tgt.x - dx / len * stop, dt, 1,
          tgt.depth - (dy / len * stop) / B.depthSpan);
      } else this.holdPosition(u);
      return;
    }
    if (u.atkCd <= 0 && !u.flags.disarmed) {
      u.moving = false; u.vx *= 0.7;
      this.beginBasic(u, B, tgt);
      return;
    }
    // Between swings, melee units can drift around inside their engagement
    // band so a fight still reads as people fighting. Held-position units do
    // not shuffle or kite between attacks.
    if (!u.flags.noMove && this.needsMeleePosition(u)) this.combatShuffle(u, B, tgt, dist, reach, dt);
    else this.holdPosition(u);
  },

  needsMeleePosition(u) {
    const def = u.def || {};
    if (u.id === 'TigerLilyCookie' && u.hasStatus('cookie_tiger_mounted')) return true;
    if (def.needsMeleePosition != null) return !!def.needsMeleePosition;
    const b = def.basic || {};
    // A non-projectile basic under the close-contact threshold needs a unit to
    // cross the arena. Long swats (like Bassie's and Goob's) and all projectile
    // attacks can stay on their authored formation line. `reach` is an
    // explicit exception for a brawler whose kit is melee even with a longer
    // authored basic range.
    return !!b.reach || (!b.proj && Number(b.range) < 220);
  },

  holdPosition(u) {
    u.moving = false;
    u.movingY = false;
    u.vx *= .55;
    u.vy *= .55;
  },

  combatShuffle(u, B, tgt, dist, reach, dt) {
    // Use the authored range here: mobile viewport scaling should not turn a
    // ranged hero into melee AI and make them plant themselves in a pile.
    const ranged = (u.def.basic.range || reach) >= 220;
    const kiteMin = ranged ? reach * .5 : 0;
    if (dist < kiteMin) {
      // too close for comfort - step back without fully disengaging
      let dx = u.x - tgt.x, dy = B.depthDelta(tgt, u), len = Math.hypot(dx, dy);
      if (len < 1) { dx = u.face > 0 ? -1 : 1; dy = (u.index % 2 ? 1 : -1) * .65; len = Math.hypot(dx, dy); }
      this.moveToward(u, B, clamp(u.x + dx / len * 70, B.leftWall, B.rightWall), dt, .85,
        clamp(u.depth + (dy / len * 70) / B.depthSpan, .04, .92));
      return;
    }
    u._shuffleT = (u._shuffleT || 0) - dt;
    if (u._shuffleT <= 0 || u._shuffleX == null || u._shuffleDepth == null) {
      u._shuffleT = rnd(.85, 1.75);
      // Pick a point on the engagement ring, including the depth axis. This
      // creates circling and strafing instead of ten units sliding along X.
      const currentAngle = Math.atan2(B.depthDelta(tgt, u), u.x - tgt.x);
      const angle = currentAngle + rnd(-.72, .72);
      const radius = reach * (ranged ? rnd(.55, .76) : rnd(.32, .62));
      u._shuffleX = clamp(tgt.x + Math.cos(angle) * radius, B.leftWall, B.rightWall);
      u._shuffleDepth = clamp(tgt.depth + Math.sin(angle) * radius / B.depthSpan, .04, .92);
    }
    this.moveToward(u, B, u._shuffleX, dt, .62, u._shuffleDepth);
  },

  skillRadius(u) {
    // Most authored skills are intended to trigger at the engagement edge,
    // while short-range control skills still need a little breathing room.
    // Use the live range so effects such as Spotlight and equipment are
    // respected, with a readable floor for melee fighters.
    const range = Number(u.st && u.st.range) || Number(u.def.basic && u.def.basic.range) || 0;
    return u.id === 'Glisten' ? Math.max(420, range) : Math.max(220, range);
  },

  moveToward(u, B, x, dt, mult, depth) {
    if (u.immovable || (u.flags && u.flags.noMove)) { this.holdPosition(u); return; }
    if (depth == null) depth = u.depth;
    const dx = x - u.x, dy = (depth - u.depth) * B.depthSpan;
    const dist = Math.hypot(dx, dy);
    if (dist < 6) { u.moving = false; u.movingY = false; u.vx *= .6; u.vy *= .6; return; }
    const spd = u.st.ms * (mult || 1);
    const mv = u.def.move || {};
    // acceleration and braking give each gait its own weight
    const accel = 1 / clamp(mv.weight || 1, .5, 2.2);
    const blend = clamp(dt * 7 * accel, 0, 1);
    u.vx = lerp(u.vx, dx / dist * spd, blend);
    u.vy = lerp(u.vy, dy / dist * spd, blend);
    u.x = clamp(u.x + u.vx * dt, B.leftWall, B.rightWall);
    u.depth = clamp(u.depth + u.vy * dt / B.depthSpan, .04, .92);
    u.movingY = Math.abs(u.vy) > 8;
    u.moving = Math.hypot(u.vx, u.vy) > 12;
    const dir = Math.sign(dx);
    if (u.moving && Math.abs(dx) > 8 && u.face !== dir) { u.face = dir; u.turnT = .2; }
  },

  /** Highest-priority ready skill whose condition passes. */
  pickSkill(u, B) {
    // Authored summons can still basic-attack, follow, and run their own
    // onTick behavior, but they must not inherit their owner's skill kit.
    // Without this guard, Blot's Jr./decoys can cast Ink Decoy themselves and
    // recursively multiply the battlefield.
    if (u.noSkills) return null;
    const sk = u.def.skills;
    // White fires the moment energy caps, unless a kit says otherwise
    if (u.energy >= u.energyMax && sk.W && sk.W.cast && u.rarity >= 1 && !(u.cds.W > 0)) {
      // A few White skills are resources rather than a simple damage button.
      // Let their kit decide whether spending a full bar right now is useful.
      try { if (!sk.W.ai || !sk.W.ai.cond || sk.W.ai.cond(u, B)) return 'W'; }
      catch (e) { /* an unavailable conditional White simply waits */ }
    }
    let best = null, bestP = -1;
    ['G', 'B'].forEach(k => {
      const s = sk[k];
      if (!s || !s.cast) return;
      if (u.rarity < SKILL_RARITY[k]) return;
      if ((u.cds[k] || 0) > 0) return;
      let p = (s.ai && s.ai.prio) || 40;
      if (s.ai && s.ai.cond) { try { if (!s.ai.cond(u, B)) return; } catch (e) { return; } }
      if (p > bestP) { bestP = p; best = k; }
    });
    return best;
  },

  beginCast(u, B, key) {
    const s = u.def.skills && u.def.skills[key];
    // Re-check the decision at the moment of activation. A death, interrupt,
    // silence, or cooldown change can happen after pickSkill() ran.
    if (!u.alive || !s || !s.cast || u.casting || u.pendingHit || u.flags.noAct || u.flags.silenced) return false;
    if (u.rarity < SKILL_RARITY[key] || (u.cds[key] || 0) > 0) return false;
    if (key === 'W' && u.energy < u.energyMax) return false;
    if (s.ai && s.ai.cond) {
      try { if (!s.ai.cond(u, B)) return false; } catch (e) { return false; }
    }
    const wind = Math.max(.12, Number(s.wind) || (key === 'W' ? .48 : .3));
    if (u.id === 'PureVanillaCookie' && key === 'W') u._vanillaCastGuardUntil = B.t + wind + .08;
    if (u.unknownWorld) B.unknownWorldDialogue(u);
    const castId = (u._castId || 0) + 1;
    u._castId = castId;
    u.casting = { key, t: wind, id: castId };
    if ((u.id === 'Tisha' || u.id === 'Poppy') && !u.twisted) {
      const skillArt = Art.skillHero(u.id, key);
      if (skillArt) {
        u.actionArtSrc = skillArt;
        // Both heroes use authored cutouts that are wider than their idle
        // battle art. Keep the temporary pose readable without changing the
        // unit's gameplay footprint or hitbox.
        u.actionBodyW = u.id === 'Poppy' ? u.bodyW * 1.16 : u.bodyW * 1.30;
      } else {
        // Do not leave the previous skill pose stuck on the next cast (Poppy's
        // red skill intentionally uses the giant-bubble overlay instead).
        u.actionArtSrc = u.defaultActionArtSrc || null;
        u.actionBodyW = u.defaultActionBodyW || u.bodyW;
      }
    }
    u.animState = 'wind'; u.animT = wind + .1; u.animDur = wind + .1; u.animStyle = null;
    u.moving = false;
    FX.telegraph(u.x, u.y, 70, u.team === TEAM_E ? '#ff6b6b' : '#7ad1ff', wind);
    if (u.unknownWorld) {
      const cue = typeof UNKNOWN_WORLD_SKILL_AUDIO !== 'undefined' && UNKNOWN_WORLD_SKILL_AUDIO[`${u.id}:${key}`];
      if (cue) Sound.play(cue, { vol: key === 'W' ? .82 : .68, priority: key === 'W', throttle: 260 });
    } else if (u.twisted) Sound.twisted(u, 'skill', { vol: key === 'W' ? .78 : .62, throttle: 480 });
    else if (COLLAB_AUDIO[u.id] && !(u.id === 'CheerbearShelly' && key === 'W')) {
      // Cheer Bear Shelly's White skill already has a large visual payoff;
      // the generic collaboration pulse layered on top was overly sharp.
      Sound.collab(u, key === 'G' ? 'magic' : 'skill', { vol: key === 'W' ? .78 : .62 });
    }
    else {
      const voice = HERO_AUDIO[u.id];
      if (voice && key === 'W' && voice.ability) Sound.hero(u, 'ability', { vol: .52, priority: true });
      else if (voice && voice.talk && !u._heroTalkPlayed) {
        u._heroTalkPlayed = Sound.hero(u, 'talk', { vol: .42, priority: true });
      }
    }
    if (key === 'W') {
      // Overhead speech belongs to friendly non-collab Heroes only. Twisteds
      // may share an identity, but they never use the Hero speech system.
      if (!u.twisted && !HERO_WHITE_DIALOGUE_COLLAB.has(u.id)) {
        const lines = HERO_WHITE_DIALOGUE[u.id];
        if (lines && lines.length && B.heroDialogue) B.heroDialogue(u, pick(lines));
      }
      // Care Bear Shelly already has her authored rainbow skill cue from the
      // collaboration audio route. The generic ult-ready flash is harsh next
      // to it, so keep that cue for the rest of the roster only.
      if (u.id !== 'CheerbearShelly') Sound.play('ult_ready', { vol: .6 });
      FX.floatIcon(u.x, u.y - 118, '★', '#ffe27a');
      FX.ring(u.x, u.y - 30, 190, '#ffe27a', .35);
      FX.punchZoom(.05, .3);
      B.log('<b>' + u.name + '</b> uses <b>' + s.name + '</b>');
    } else if (u.unknownWorld) {
      // These encounter-only machines are meant to advertise their kit in the
      // battle log too. Their short cooldown skills used to happen off-screen
      // between the larger actions, making the invasion feel like basic-attack
      // spam even when a cast technically fired.
      B.log('<b>' + u.name + '</b> uses <b>' + s.name + '</b>');
    } else if (u.id === 'Glisten') {
      // His short mirror casts are easy to miss between larger ultimates;
      // keep the combat log and target feedback honest about what fired.
      B.log('<b>' + u.name + '</b> uses <b>' + s.name + '</b>');
    }
    return true;
  },

  fire(u, B, key, activation) {
    const s = u.def.skills && u.def.skills[key];
    // Ignore a delayed callback for an interrupted or defeated caster.
    if (!u.alive || !s || !s.cast ||
      (activation && activation.id != null && activation.id !== u._castId)) return false;
    const start = { unit: u, key, passion: false, costDiscount: 0 };
    B.emitTeam(u.team, 'allySkillStarting', start);
    B.emitFoe(u.team, 'enemySkillStarting', start);
    if (start.cancel) {
      u.casting = null; u.pendingHit = null; u._castId = (u._castId || 0) + 1;
      u.cds[key] = Math.max(u.cds[key] || 0, start.cooldown || 2);
      return false;
    }
    if (start.delay > 0) {
      u.casting = { key, t: Math.min(1.2, start.delay), id: u._castId };
      B.anim(u, 'wind', u.casting.t);
      return true;
    }
    if (key === 'W') {
      // White skills consume a full Energy bar. `costDiscount` is a genuine
      // discount (for example Shelly's Passion), not the amount to spend;
      // subtracting only it left a unit at 100 Energy and made no-CD Whites
      // immediately cast again and again.
      const cost = Math.max(0, (s.energy || u.energyMax) - (start.costDiscount || 0));
      u.energy = Math.max(0, u.energy - cost);
      if (s.cd) u.cds.W = skillCooldown(s, u.skillLevel(key));
    }
    else u.cds[key] = skillCooldown(s, u.skillLevel(key));
    if (start.passion) {
      const castId = u._castId;
      B.after(.01, () => { if (u.alive && u._castId === castId) B.reduceCd(u, 4); });
    }
    B.heroSequence(u, key, u._castId);
    try { s.cast(u, B, B.scaled(u, key), B.skillParams(u, key)); }
    catch (e) { console.warn('skill failed', u.id, key, e); }
    B.emitFor(u, 'cast', { key });
    if (key === 'W') B.emitTeam(u.team, 'allyUltimate', u);
    B.emitTeam(u.team, 'allyCast', u);
    B.emitFoe(u.team, 'enemyCast', u);
    B.emitFoe(u.team, 'enemyAction', u);
    return true;
  },

  beginBasic(u, B, tgt) {
    const b = u.def.basic;
    // Basic attacks are the steady damage floor of the auto-battler. Their
    // authored Attack Speed should control cadence once, while skills remain
    // the burst layer on top. A small baseline reduction keeps the corrected
    // cadence from feeling sluggish at 1.0 speed without changing damage.
    const interval = 1.18 / Math.max(.2, u.st.aspd);
    u.atkCd = interval;
    if (b.utility) { if (b.perform) b.perform(u, B); return; }
    if (u._shellyNextBasicInterrupt) {
      u._shellyNextBasicInterrupt = false;
      u.animState = 'attack'; u.animT = .24; u.animDur = .24;
      FX.floatIcon(u.x, u.y - 95, 'FOSSIL FACT', '#ffe6ab');
      Sound.play('guardbreak', { vol: .42, throttle: 280 });
      return;
    }
    if (b.onStart) { try { b.onStart(u, B, tgt); } catch (e) { console.warn(e); } }
    const wind = b.fastWind ? Math.max(.06, b.wind || .12) : Math.max(b.wind || .18, .24);
    u.animState = 'wind'; u.animT = wind; u.animDur = wind;
    u.animStyle = b.animStyle || (u.id === 'Poppy' ? 'poppyBasicWind' : u.id === 'Cocoa' ? 'cocoaBasicWind' : u.id === 'Delilah' ? 'delilahNoteWind' : null);
    u.pendingHit = { t: wind, tgt };
    if (wind > .12) FX.telegraph(u.x, u.y, 44, u.team === TEAM_E ? '#ff9d9d' : '#bfe3ff', wind);
    const creatureAttack = u.twisted
      ? Sound.twisted(u, 'attack', { vol: .7, rate: rnd(.96, 1.04), throttle: 430 })
      : Sound.collab(u, 'attack', { vol: .62, throttle: 900 });
    if (!creatureAttack) Sound.play(b.sfx, { vol: .45, rate: rnd(.94, 1.08), throttle: 55 });
    // The supplied machine skill recordings are used as occasional attack
    // signatures too. Every third basic is enough to establish identity in a
    // large wave while preserving room for the named skill casts to land.
    if (u.unknownWorld && typeof UNKNOWN_WORLD_BASIC_AUDIO !== 'undefined') {
      u._unknownBasicBeat = (u._unknownBasicBeat || 0) + 1;
      const cue = UNKNOWN_WORLD_BASIC_AUDIO[u.id];
      if (cue && u._unknownBasicBeat % 3 === 0)
        Sound.play(cue, { vol: .18, rate: rnd(.94, 1.05), throttle: 920 });
    }
    // DW accent on the windup for ranged magic and heavy physical swings
    if (b.type === 'magic' && b.range >= 220 && chance(.5)) Sound.play('beam_fire', { vol: .14, throttle: 60 });
    else if (b.type !== 'magic' && b.range < 180 && chance(.35)) Sound.play('sweep', { vol: .12, throttle: 60 });
  },

  resolveBasic(u, B, p) {
    const b = u.def.basic, tgt = p.tgt;
    if (!tgt || !tgt.alive || !u.alive) return;
    // Basic attacks are committed once the AI starts them in range. The
    // target may shuffle, dash, or be pushed during the windup, but ordinary
    // movement must not erase every swing; accuracy/evasion still handles
    // legitimate misses inside B.damage(). Range is used to decide when an
    // attack starts, not to invalidate it after the animation has begun.
    const hits = b.hits || 1;
    // Leave room for the body to prepare, make contact, and settle. Authored
    // attacks can still be longer, while tiny legacy timings get a readable
    // minimum instead of disappearing in a single frame.
    const contactDelay = b.proj ? .12 : .10;
    const minimumAttack = b.fastWind ? .24 : .30;
    const attackAnim = Math.max(
      b.attackAnim || minimumAttack,
      minimumAttack,
      contactDelay + Math.max(0, hits - 1) * .10 + .16
    );
    u.animState = 'attack'; u.animT = attackAnim; u.animDur = attackAnim;
    u.animStyle = b.animStyle || (u.id === 'Poppy' ? 'poppyBasicBump' : u.id === 'Cocoa' ? 'cocoaBasicFlick' : u.id === 'Delilah' ? 'delilahNote' : null);
    // Connie's Queens of Mischief guitar alternates a physical strike and a
    // spectral note; the shared hero definition must stay immutable per unit.
    const attackType = u.id === 'QOMConnie'
      ? ((u._qomBasicType = u._qomBasicType === 'physical' ? 'magic' : 'physical'))
      : b.type;
    const melee = (attackType === 'physical' && !b.rangedPhysical) || (!b.proj && b.range < 240);
    const per = (b.ratio / hits);

    const doHit = (i, redirectedTarget) => {
      if (!tgt.alive || !u.alive) return;
      const actual = redirectedTarget || (u.basicRedirect ? (u.basicRedirect(tgt, B) || tgt) : tgt);
      if (!actual.alive) return;
      if (u.id === 'QOMConnie' && attackType === 'physical') {
        const returnX = u.x, returnDepth = u.depth;
        B.blink(u, actual.x - u.face * 24, actual.depth);
        B.after(.28, () => { if (u.alive) B.blink(u, returnX, returnDepth); });
      }
      const stat = attackType === 'magic' ? u.st.mag : u.st.atk;
      const ev = B.damage(u, actual, stat * per, { type: attackType, melee, tag: b.name, basic: true });
      if (ev) {
        const hitCue = u.id === 'QOMConnie' ? (attackType === 'magic' ? 'hit_magic' : 'hit_slash') : b.hit || (attackType === 'magic' ? 'hit_magic' : 'hit_blunt');
        if (!Sound.play(hitCue, { vol: .5, rate: rnd(.9, 1.12), throttle: 20 }))
          Sound.play(attackType === 'magic' ? 'hit_magic' : 'hit_blunt', { vol: .42, rate: rnd(.9, 1.12), throttle: 20 });
        if (ev.crit && chance(.6)) Sound.play('sweep', { vol: .22, throttle: 80 });
        else if (!ev.crit && attackType === 'magic' && chance(.3)) Sound.play('pop2', { vol: .18, throttle: 80 });
        if (u.id && u.id.startsWith('QOM') && B.fxQomBasic) {
          B.fxQomBasic(u, actual, attackType);
        } else if (u.id === 'Bassie') {
          B.fxBassieSkill('jab', u, { target: actual });
          B.fxBassieImpact(actual);
        } else if (u.id === 'Eclipse') {
          B.fxEclipseSkill('basic', u, { target: actual, blackout: u.hasStatus('blackout') });
        } else if (u.id === 'Yatta') {
          B.fxYattaSkill('basic', u, { target: actual, index: i, celebration: !!u.getStatus('celebration') });
        } else if (melee) B.fxSlash(u, actual, { col: b.pcol || '#fff', ang: rnd(-30, 30), small: hits > 1 });
        else FX.burst(actual.x, actual.y - 60, 5, b.pcol || '#fff', { spMax: 180 });
        FX.shake(melee ? 2.5 : 1.5, .08);
        B.emitFor(u, 'basicHit', { target: actual });
        if (u.unknownWorld && chance(.24)) B.unknownWorldDialogue(u);
        if (b.onHit) { try { b.onHit(u, actual, B, i); } catch (e) { console.warn(e); } }
        // pierce (Brightney at full charge) hits the line behind
        if (u.pierce) B.enemiesOf(u).forEach(o => { if (o !== actual && B.distance(o, actual) < 220)
          B.damage(u, o, stat * per * .5, { type: attackType, tag: b.name }); });
      }
      B.energy(u, 9);
      // Team basic-attack hooks need both the attacker and the target. Brusha's
      // Inspiration uses this to paint bonus damage onto allies' attacks.
      B.emitTeam(u.team, 'allyBasic', { unit: u, target: actual });
      B.emitFoe(u.team, 'enemyAction', u);
    };

    if (b.proj && (attackType !== 'physical' || b.rangedPhysical)) {
      if (chance(.4)) Sound.play('throwsomething', { vol: .16, throttle: 60 });
      for (let i = 0; i < hits; i++) {
        B.after(contactDelay + i * .09, () => {
          const actual = u.basicRedirect ? (u.basicRedirect(tgt, B) || tgt) : tgt;
          B.fxProj(u, actual, { kind: b.proj, col: b.pcol, img: b.pimg }, () => doHit(i, actual));
        });
      }
    } else {
      for (let i = 0; i < hits; i++) B.after(contactDelay + i * .1, () => doHit(i));
      if (b.shake) FX.shake(b.shake, .15);
    }
  }
};
