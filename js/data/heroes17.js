/* heroes17.js - Flutter, an aerial-control SS tier. */
'use strict';

function flutterDelaySkill(target, seconds) {
  if (!target || !target.cds) return;
  const delay = Math.max(0, Number(seconds) || 0);
  Object.keys(target.cds).forEach(key => { target.cds[key] = (target.cds[key] || 0) + delay; });
  if (target.casting) target.casting.t += delay;
}

function flutterStripBuff(target, B) {
  if (!target || !target.statuses) return false;
  const buff = target.statuses.find(s => STATUS[s.id] && STATUS[s.id].kind === 'buff' && s.id !== 'shield' && !s.apexLocked);
  return buff ? B.removeStatus(target, buff.id) : false;
}

function flutterHide(u) {
  if (!u) return;
  u._flutterHidden = true; u._introOpacity = 0; u._renderOpacity = null;
  if (u.el) u.el.style.opacity = '0';
}

function flutterReveal(u) {
  if (!u) return;
  u._flutterHidden = false; u._introRevealed = true; u._introOpacity = 1; u._renderOpacity = null;
  if (u.el) { u.el.style.visibility = ''; u.el.style.opacity = '1'; }
}

function flutterFoes(B, u) { return B.enemiesOf(u).filter(e => e && e.alive && B.isTargetable(e)); }

function flutterPushAway(u, B, target, originX, amount) {
  if (!target || !target.alive) return;
  const oldFace = u.face;
  u.face = target.x >= originX ? 1 : -1;
  if (Math.abs(target.x - originX) < 4) u.face = oldFace || 1;
  B.knockback(u, target, amount);
  u.face = oldFace || 1;
}

function flutterAddLift(u, B, stacks) {
  const before = u.getStatus('lift');
  const max = u._flutterLiftMax || 5;
  B.applyStatus(u, u, 'lift', 999, { stacks: stacks || 1 });
  const now = u.getStatus('lift');
  if (!now || now.stacks < max || (before && before.stacks >= max)) return;
  B.fxFloatIcon(u.x, u.y - 112, 'LIFT MAX', '#d8fbff');
  if (u._flutterStormEnabled && B.t >= (u._flutterStormLock || 0)) {
    u._flutterStormLock = B.t + 1.5;
    flutterWingstorm(u, B, u._flutterStormParams || { duration: 5.5, radius: 280, dot: .18, intercept: 2.4 });
  }
}

function flutterOffBalance(u, B, target, dur) {
  if (!target || !target.alive) return;
  B.applyStatus(u, target, 'offbalance', dur || 5.5);
  B.fxFloatIcon(target.x, target.y - 88, '🥴', '#c9f6ff');
}

function flutterPathHit(u, B, target, ratio, push, dur, tag, returning) {
  if (!target || !target.alive) return;
  B.damage(u, target, u.st.atk * ratio, { type: 'physical', area: true, tag: tag || 'Floaty Dash' });
  flutterOffBalance(u, B, target, dur);
  flutterPushAway(u, B, target, u.x, push || 80);
  if (returning && target.hasStatus('offbalance')) B.interrupt(target);
  B.fxFlutterHit(target, returning);
  flutterAddLift(u, B, 1);
}

function flutterPathPass(u, B, toX, opt) {
  opt = opt || {};
  const hits = new Set();
  const dir = toX >= u.x ? 1 : -1;
  B.dash(u, toX, opt.dur || .34, {
    arc: true, depth: opt.depth == null ? u.depth : opt.depth,
    onMove: () => {
      if (u._flutterHidden) flutterReveal(u);
      flutterFoes(B, u).forEach(target => {
        if (hits.has(target) || B.distance(target, u) > (opt.radius || 76)) return;
        hits.add(target);
        flutterPathHit(u, B, target, opt.ratio || 1, opt.push || 90, opt.offDur || 5.5,
          opt.tag || 'Floaty Dash', !!opt.returning);
      });
    },
    onEnd: opt.onEnd
  });
  B.fxFlutterDash(u.x, u.y, toX, dir, opt.dur || .34, !!opt.returning);
}

function flutterOpening(u, B, S, P) {
  if (u._flutterOpeningStarted) return;
  u._flutterOpeningStarted = true;
  B.after(.08, () => {
    if (!u.alive) return;
    const foes = flutterFoes(B, u);
    if (!foes.length) { flutterReveal(u); return; }
    const dir = u.team === TEAM_P ? 1 : -1;
    const startX = dir > 0 ? B.leftWall + 24 : B.rightWall - 24;
    const farX = dir > 0 ? B.rightWall - 24 : B.leftWall + 24;
    const homeX = u.homeX, homeDepth = u.depthHome;
    const doublePass = !!u._flutterStormOpeningDouble;
    u._flutterBusyUntil = B.t + (doublePass ? 1.65 : 1.05);
    u.face = dir;
    flutterHide(u);
    B.blink(u, startX, .38);
    B.anim(u, 'attack', .72, 'flutterEntry');
    Sound.play('flutter_white', { vol: .78, priority: true });
    B.fxFlutterEntry(startX, u.y, farX, dir, .52);
    flutterPathPass(u, B, farX, {
      dur: .52, depth: .44, ratio: S.ratio, push: P.knockback, offDur: P.offBalance,
      tag: 'Floaty Dash', onEnd: () => {
        B.after(.12, () => {
          if (!u.alive) return;
          const finish = () => {
            B.after(.08, () => {
              if (!u.alive) return;
              B.blink(u, homeX, homeDepth);
              flutterReveal(u);
              flutterAddLift(u, B, 1);
              B.fxFlutterHit(u, true);
              u._flutterBusyUntil = B.t + .04;
            });
          };
          // Storm of Wings makes the entrance itself a two-hit fly-by: the
          // first pass scatters the formation, then Flutter circles back into
          // midline with reduced damage and stronger knockback.
          if (doublePass) {
            flutterPathPass(u, B, homeX, {
              dur: .42, depth: homeDepth, ratio: S.returnRatio, push: P.returnKnockback,
              offDur: P.offBalance, tag: 'Floaty Dash return', returning: true, onEnd: finish
            });
          } else finish();
        });
      }
    });
  });
}

function flutterActiveDash(u, B, S, P) {
  const lift = u.getStatus('lift');
  const maxed = !!lift && lift.stacks >= P.maxLift;
  const dir = u.team === TEAM_P ? 1 : -1;
  const farX = dir > 0 ? B.rightWall - 26 : B.leftWall + 26;
  const homeX = u.homeX, homeDepth = u.depthHome;
  u._flutterBusyUntil = B.t + (maxed ? 1.02 : .62);
  B.applyStatus(u, u, 'untargetable', P.airTime);
  B.anim(u, 'attack', .58, 'flutterDash');
  Sound.play('flutter_white', { vol: .62, throttle: 500 });
  flutterPathPass(u, B, farX, {
    dur: .36, depth: .42, ratio: S.ratio, push: P.knockback, offDur: P.offBalance,
    tag: 'Floaty Dash', onEnd: () => {
      if (maxed && u.alive) {
        B.after(.08, () => flutterPathPass(u, B, homeX, {
          dur: .36, depth: homeDepth, ratio: S.returnRatio, push: P.returnKnockback,
          offDur: P.offBalance, tag: 'Floaty Dash return', returning: true,
          onEnd: () => B.after(.08, () => flutterFinishDash(u, B, homeX, homeDepth))
        }));
      } else B.after(.08, () => flutterFinishDash(u, B, homeX, homeDepth));
    }
  });
}

function flutterFinishDash(u, B, x, depth) {
  if (!u || !u.alive) return;
  B.blink(u, x, depth);
  B.removeStatus(u, 'untargetable');
  B.fxRing(x, B.ground - depth * B.depthSpan, 108, '#c9f6ff', .34);
  u._flutterBusyUntil = B.t + .04;
}

function flutterCreateTrail(u, B, P) {
  const dur = P.trailDur || 2.8;
  u._flutterTrailUntil = Math.max(u._flutterTrailUntil || 0, B.t + dur);
  B.repeat(Math.ceil(dur / .18), .18, () => {
    if (!u.alive || B.t > u._flutterTrailUntil) return;
    B.fxFlutterTrail(u.x, u.y, u.face, .42);
    flutterFoes(B, u).forEach(e => {
      if (B.distance(e, u) > 68) return;
      B.applyStatus(u, e, 'fluttertrail', 1.1);
      B.energy(e, -2);
    });
  });
}

function flutterWingstorm(u, B, P) {
  if (!u || !u.alive || B.t < (u._flutterStormUntil || 0)) return;
  const foes = flutterFoes(B, u);
  if (!foes.length) return;
  const centerX = clamp(B.avgX(foes), B.leftWall + 90, B.rightWall - 90);
  const centerY = B.ground - .46 * B.depthSpan;
  const duration = P.duration || 5.5;
  u._flutterStormUntil = B.t + duration;
  u._flutterStormX = centerX;
  u._flutterStormLast = new Map(foes.map(e => [e.uid, e.x]));
  B.fxFlutterWingstorm(centerX, centerY, P.radius || 280, duration);
  B.fxFloatIcon(centerX, centerY - 86, 'WINGSTORM', '#d8fbff');
  B.repeat(Math.ceil(duration / .35), .35, () => {
    if (!u.alive || B.t > u._flutterStormUntil) return;
    flutterFoes(B, u).forEach(e => {
      const previousX = u._flutterStormLast.get(e.uid);
      const jumped = previousX != null && Math.abs(e.x - previousX) > 68;
      u._flutterStormLast.set(e.uid, e.x);
      if (Math.abs(e.x - centerX) > (P.radius || 280) * .55) return;
      B.applyStatus(u, e, 'wingstorm', .85);
      B.damage(u, e, u.st.atk * (P.dot || .18), { type: 'physical', dot: true, tag: 'Wingstorm' });
      B.applyStatus(u, e, 'offbalance', .95);
      flutterPushAway(u, B, e, centerX, 18);
      if ((jumped || e.dashUntil > B.t || e.dashTo != null) && B.t >= (e._flutterInterceptAt || 0)) {
        e._flutterInterceptAt = B.t + (P.intercept || 2.4);
        e.dashUntil = 0; e.dashTo = null; e.dashOpt = null; e.movingY = false; e.yOff = 0;
        e.vx = 0; e.vy = 0; e.moving = false;
        B.interrupt(e);
        B.damage(u, e, u.st.atk * .34, { type: 'physical', tag: 'Wingstorm intercept' });
        B.fxFlutterIntercept(e);
      }
    });
  });
}

function flutterWingbeat(u, B, S, P) {
  const foes = flutterFoes(B, u);
  if (!foes.length) return;
  B.anim(u, 'cast', .42, 'flutterWingbeat');
  Sound.play('flutter_wingbeat', { vol: .56, throttle: 360 });
  B.fxFlutterGust(u.x, u.y, B.avgX(foes), B.ground - 70, P.radius, u.face);
  const hit = [];
  foes.forEach(e => {
    const nearest = B.nearest(e, B.alliesOf(u));
    const off = e.hasStatus('offbalance');
    B.damage(u, e, u.st.atk * S.ratio, { type: 'physical', area: true, tag: 'Wingbeat Sweep' });
    flutterPushAway(u, B, e, nearest ? nearest.x : B.avgX(B.alliesOf(u)), off ? P.knockback * 1.45 : P.knockback);
    B.applyStatus(u, e, 'fluttertrail', 1.8);
    if (off) B.applyStatus(u, e, 'offbalance', P.offBalance);
    hit.push(e);
  });
  B.after(.24, () => {
    hit.forEach((a, i) => hit.slice(i + 1).forEach(b => {
      if (a.alive && b.alive && B.distance(a, b) < 72) {
        B.applyStatus(u, a, 'stun', P.collisionStun);
        B.applyStatus(u, b, 'stun', P.collisionStun);
      }
    }));
  });
}

function flutterSilentFlutter(u, B, S, P) {
  const foes = flutterFoes(B, u);
  if (!foes.length) return;
  const attackTarget = B.highestStat(foes, 'atk');
  const energyTarget = B.highestEnergy(foes);
  if (!attackTarget || !energyTarget) return;
  B.anim(u, 'cast', .30, 'flutterSilent');
  Sound.play('flutter_wingbeat', { vol: .42, throttle: 420 });
  B.applyStatus(u, attackTarget, 'flutterdistracted', P.dur);
  flutterStripBuff(energyTarget, B);
  flutterDelaySkill(energyTarget, P.delay);
  B.fxFlutterSilent(attackTarget, energyTarget);
  const special = attackTarget.hasStatus('offbalance') || energyTarget.hasStatus('offbalance');
  if (special) { flutterAddLift(u, B, 1); flutterCreateTrail(u, B, P); }
  const homeX = u.homeX, homeDepth = u.depthHome;
  const passFace = energyTarget.x >= u.x ? 1 : -1;
  const passX = clamp(energyTarget.x + passFace * 42, B.leftWall + 18, B.rightWall - 18);
  u.face = passFace;
  u._flutterBusyUntil = B.t + .56;
  // This is a readable fly-by, not an instant teleport: Flutter crosses the
  // energy target, leaves any earned trail behind, and returns to midline.
  B.dash(u, passX, .22, { arc: true, depth: energyTarget.depth, onEnd: () => {
    if (!u.alive) return;
    B.fxFlutterDash(u.x, u.y, homeX, -passFace, .22, true);
    B.after(.04, () => {
      if (!u.alive) return;
      B.dash(u, homeX, .22, { arc: true, depth: homeDepth, onEnd: () => { u._flutterBusyUntil = B.t + .04; } });
    });
  }});
  B.fxFlutterDash(u.x, u.y, passX, passFace, .22, false);
}

defHero({
  id: 'Flutter', name: 'Flutter', folder: null, file: null, icon: 'Flutter',
  role: 'Control', tier: 'SS', position: 'Midline', element: 'Wind',
  blurb: 'An aerial control unit who breaks formations from above, then turns every missed attack into more airspace.',
  noIntro: true,
  base: { hp: 3380, atk: 326, def: 176, mag: 218, mdef: 228, spd: 152, acc: 196, eva: 238 },
  hidden: { range: 232, aspd: 1.08, ms: 148, aggro: .42, crit: .11, critDmg: 1.58, healPow: 1, shieldPow: 1,
    cdr: .12, ccRes: .12, kbRes: .18, armorPen: .08, magPen: 0 },
  growth: { hp: .078, atk: .098, def: .066, mag: .05, mdef: .07 },
  move: { gait: 'float', bob: 14, freq: 1.8, lean: 8, squash: .03, hover: 24, idle: 'drift', step: null,
    particles: 'sparkle', pcol: '#c9f6ff', trail: { on: true, col: '#8fe8ff', rate: .045 }, brake: .08, sway: 13 },
  basic: { name: 'Fly-by Strike', type: 'physical', ratio: .78, range: 232, proj: 'orb', pcol: '#b9f5ff',
    sfx: 'whoosh', hit: 'hit_light', wind: .12, fastWind: true, note: 'A quick pass that leaves the enemy trying to find the sky.',
    onHit: (u, target, B) => {
      if (!u._flutterFlybyReady) return;
      u._flutterFlybyReady = false;
      B.enemiesOf(u).filter(e => e.alive && e !== target && Math.abs((e.depth || 0) - (u.depth || 0)) < .26
        && (e.x - u.x) * (u.face || 1) > 0 && Math.abs(e.x - u.x) < 300).forEach(e => {
        B.damage(u, e, u.st.atk * .38, { type: 'physical', area: true, tag: 'Fly-by Strike' });
        flutterOffBalance(u, B, e, 3.5);
        B.applyStatus(u, e, 'flutterflyby', 2.8);
      });
      B.applyStatus(u, target, 'flutterflyby', 2.8);
      B.fxFlutterFlyby(u);
    }
  },
  skills: {
    W: {
      name: 'Floaty Dash', type: 'Physical Damage / Control', energy: 100,
      v: { ratio: 1.18, returnRatio: .62 }, p: { offBalance: 5.5, knockback: 118, returnKnockback: 166, airTime: .48, maxLift: 5 },
      desc: (S, P) => `<span class="sk-pas">Flutter begins each wave off-screen, then flies in from above and dashes through the enemy team for <em>${pcn(S.ratio * 100)}</em> Attack, scattering them and applying 🥴 Off Balance. Moving through an enemy refreshes Off Balance and grants 🪽 Lift, increasing Evasion and Skill Haste up to ${P.maxLift}.</span> Active: she becomes briefly untargetable and dives through the formation. At maximum Lift, she hits again on the return path and interrupts Off Balance enemies.`,
      passive: (u, B, S, P) => {
        u._flutterLiftMax = P.maxLift; flutterHide(u); flutterOpening(u, B, S, P);
        u._flutterPassAt = {};
        B.every(u, .10, () => {
          if (!u.moving && !(u.dashUntil > B.t)) return;
          flutterFoes(B, u).forEach(e => {
            if (B.distance(e, u) > 64 || B.t < (u._flutterPassAt[e.uid] || 0)) return;
            u._flutterPassAt[e.uid] = B.t + .55;
            flutterOffBalance(u, B, e, P.offBalance); flutterAddLift(u, B, 1);
          });
        });
      },
      cast: (u, B, S, P) => flutterActiveDash(u, B, S, P)
    },
    G: {
      name: 'Wingbeat Sweep', type: 'Control / Physical Damage', cd: 7,
      v: { ratio: .92 }, p: { radius: 320, knockback: 100, offBalance: 4.5, collisionStun: .82 },
      desc: (S, P) => `Flutter sends a wide gust across the enemy side for <em>${pcn(S.ratio * 100)}</em> Attack, pushing enemies away from the nearest ally and leaving a slowing gust mark. 🥴 Off Balance enemies are pushed farther and lose more Skill Haste. If the gust drives enemies into each other, both are briefly Stunned.`,
      ai: { prio: 60, cond: (u, B) => flutterFoes(B, u).length > 0 },
      cast: (u, B, S, P) => flutterWingbeat(u, B, S, P)
    },
    B: {
      name: 'Silent Flutter', type: 'Control', cd: 10,
      v: {}, p: { dur: 6.2, delay: 1.8, trailDur: 3.8 },
      desc: (S, P) => `Flutter darts between the highest-Attack and highest-Energy enemies. The first becomes Distracted, losing Accuracy and Attack Speed; the second loses one removable buff and has their next Skill delayed by ${P.delay}s. If either is 🥴 Off Balance, Flutter gains Lift and leaves a longer gust trail that slows and drains enemies crossing it.`,
      ai: { prio: 54, cond: (u, B) => flutterFoes(B, u).length > 0 },
      cast: (u, B, S, P) => flutterSilentFlutter(u, B, S, P)
    },
    P: {
      name: 'Hard to Catch', type: 'Evasion / Control',
      v: { reduction: .18 }, p: { offBalance: 5.5, energyLoss: 10 },
      desc: (S, P) => `Flutter gains Evasion from 🪽 Lift. Whenever an enemy misses her, that enemy becomes 🥴 Off Balance; if already Off Balance, it loses ${P.energyLoss} Energy instead. Dodging a Skill arms her next Basic Attack as a line-wide fly-by strike that deals bonus damage, reapplies Off Balance, and reduces Accuracy. Flutter takes <em>${pcn(S.reduction * 100)}</em> less Damage from Off Balance enemies.`,
      passive: (u, B, S, P) => {
        B.on(u, 'dodged', ev => {
          const enemy = ev && ev.src;
          if (!enemy || enemy.team === u.team || !enemy.alive) return;
          if (enemy.hasStatus('offbalance')) {
            B.energy(enemy, -P.energyLoss); B.fxFloatIcon(enemy.x, enemy.y - 94, `-${P.energyLoss}`, '#c9f6ff');
          } else flutterOffBalance(u, B, enemy, P.offBalance);
          flutterAddLift(u, B, 1);
          if (enemy.casting || enemy.animState === 'cast') u._flutterFlybyReady = true;
        });
        B.on(u, 'damaged', ev => {
          if (ev && ev.src && ev.src.team !== u.team && ev.src.hasStatus('offbalance')) ev.amount *= 1 - S.reduction;
        });
      }
    },
    R: {
      name: 'Storm of Wings', type: 'Physical Damage / Control / Skill Haste',
      v: { duration: 7.5, radius: 320, dot: .24, intercept: 2.0 }, p: { maxLift: 5 },
      desc: (S, P) => `At maximum 🪽 Lift, Flutter creates a Wingstorm over the enemy side for ${P.duration}s. Enemies inside take Physical Damage over time, become 🥴 Off Balance, lose Accuracy and Movement Speed, and are pushed out of formation. If one tries to dash, leap, rush, or teleport inside it, Flutter intercepts and interrupts the movement.`,
      passive: (u, B, S, P) => {
        u._flutterStormEnabled = true; u._flutterStormParams = S;
        u._flutterLiftMax = P.maxLift;
        u._flutterStormOpeningDouble = true;
      }
    }
  }
});

if (typeof HERO_IDS !== 'undefined' && !HERO_IDS.includes('Flutter')) HERO_IDS.push('Flutter');
if (typeof PLAYABLE_IDS !== 'undefined' && !PLAYABLE_IDS.includes('Flutter')) PLAYABLE_IDS.push('Flutter');
