/* heroes8.js - Waxwell, an S-tier backline terrain Controller.
   His wax and fire exist as timed battlefield zones. They react to movement,
   merge at Red rarity, and never require Waxwell to enter the enemy formation. */
'use strict';

function waxwellZones(u) { return u.waxZones || (u.waxZones = []); }
function waxwellTouching(u, target, type) {
  return waxwellZones(u).filter(z => (!type || z.type === type) && Math.abs(target.x - z.x) <= z.radius);
}
function waxwellInNetwork(u, target) { return waxwellTouching(u, target).length > 0; }

function waxwellAddZone(u, B, type, x, radius, dur, y) {
  const zones = waxwellZones(u);
  x = clamp(x, B.leftWall, B.rightWall);
  y = y == null ? u.y : clamp(y, B.ground - B.depthSpan, B.ground);
  if (u.waxNetwork && type === 'flame') zones.forEach(z => {
    if (z.type === 'soft' && Math.abs(z.x - x) <= z.radius + radius) {
      z.type = 'flame'; z.until = Math.max(z.until, B.t + dur);
      B.fxWaxZone(z.x, 'flame', z.radius, Math.max(.5, z.until - B.t), z.y);
    }
  });
  const overlapping = (u.waxNetwork || type === 'soft') && zones.find(z => z.type === type && Math.abs(z.x - x) <= z.radius + radius * .7);
  if (overlapping) {
    const left = Math.min(overlapping.x - overlapping.radius, x - radius);
    const right = Math.max(overlapping.x + overlapping.radius, x + radius);
    overlapping.x = (left + right) / 2;
    overlapping.y = (overlapping.y + y) * .5;
    overlapping.radius = Math.min(250, (right - left) / 2);
    overlapping.until = Math.max(overlapping.until, B.t + dur);
    return overlapping;
  }
  const zone = { id: ++u.waxZoneSeq, type, x, y, radius, until: B.t + dur };
  zones.push(zone);
  B.fxWaxZone(x, type, radius, dur, y);
  return zone;
}

function waxwellLine(u, B, endX, type, dur, radius, endY) {
  const dist = endX - u.x;
  const steps = clamp(Math.ceil(Math.abs(dist) / 85), 3, 8);
  const targetY = endY == null ? u.y : endY;
  for (let i = 1; i <= steps; i++) {
    const p = i / steps;
    waxwellAddZone(u, B, type, u.x + dist * p, radius || 62, dur, lerp(u.y, targetY, p));
  }
  B.fxWaxTrail(u, endX, type, dur, targetY);
}

function waxwellMeltFigure(u, target, B, damage) {
  const record = (u.waxFigures || []).find(f => f.target === target);
  if (!record) return;
  B.fxWaxwellFigure('melt', u, record, target);
  u.waxFigures = u.waxFigures.filter(f => f !== record);
  B.removeStatus(target, 'waxfigure');
  B.fxWaxZone(record.x, 'soft', 58, 5, record.y);
  B.fxWaxwellSkill('meltFigure', u, { target, x: record.x, y: record.y });
  waxwellAddZone(u, B, 'soft', record.x, 58, 5, record.y);
  if (damage && target.alive) {
    B.damage(u, target, u.st.mag * damage, { type: 'magic', tag: 'Wax Figure' });
    B.applyStatus(u, target, 'waxcooldowns', 6);
    B.fxFloatIcon(target.x, target.y - 98, '♟', '#f1c85c');
  }
}

function waxwellMakeFigure(u, target, B) {
  if (!u.waxFigureCap || !target || !target.alive) return;
  const old = (u.waxFigures || []).find(f => f.target === target);
  if (old) { old.lastTargetX = target.x; old.lastTargetY = target.y; B.applyStatus(u, target, 'waxfigure', 999); return; }
  u.waxFigures = u.waxFigures || [];
  while (u.waxFigures.length >= u.waxFigureCap) waxwellMeltFigure(u, u.waxFigures[0].target, B, 0);
  const x = clamp(u.x + u.face * (48 + u.waxFigures.length * 34), B.leftWall, B.rightWall);
  const record = { target, x, y: u.y, lastX: x, lastTargetX: target.x, lastTargetY: target.y };
  u.waxFigures.push(record);
  B.fxWaxwellFigure('spawn', u, record, target);
  B.applyStatus(u, target, 'waxfigure', 999);
  B.fxWaxwellSkill('figure', u, { target });
}

function waxwellUpdate(u, B) {
  u.waxZones = waxwellZones(u).filter(z => z.until > B.t);
  const zones = u.waxZones;
  B.enemiesOf(u).forEach(e => {
    const touching = zones.filter(z => Math.abs(e.x - z.x) <= z.radius);
    const soft = touching.some(z => z.type === 'soft');
    const flame = touching.some(z => z.type === 'flame');
    const memory = e._waxwell || (e._waxwell = {});
    const state = memory[u.uid] || (memory[u.uid] = { dwell: 0, seen: {}, crosses: 0, burnAt: -99, energyAt: -99, rootAt: -99 });
    const activeZoneIds = new Set(zones.map(z => z.id));
    Object.keys(state.seen).forEach(id => { if (!activeZoneIds.has(Number(id))) delete state.seen[id]; });
    state.crosses = Object.keys(state.seen).length;
    if (soft) {
      B.applyStatus(u, e, 'softwax', .55);
      state.dwell += .25;
      if (state.dwell >= (u.waxRootAfter || 2.5) && B.t - state.rootAt > 4) {
        state.rootAt = B.t; state.dwell = 0;
        B.applyStatus(u, e, 'root', u.waxRootDur || 1.4);
      }
    } else {
      if (state.wasSoft && e.moving) B.applyStatus(u, e, 'slow', 2.2, { stacks: 2 });
      state.dwell = 0;
    }
    state.wasSoft = soft;
    if (flame) {
      B.applyStatus(u, e, 'litup', .65);
      if (B.t - state.burnAt >= 1) {
        state.burnAt = B.t;
        B.applyStatus(u, e, 'burn', 2, { val: u.st.mag * (u.waxTrailDot || .075) });
      }
    }
    if (touching.length && e.moving && B.t - state.energyAt >= .75) {
      state.energyAt = B.t; B.energy(u, u.waxMoveEnergy || 2.5);
    }
    if (u.waxNetwork) touching.forEach(z => {
      if (state.seen[z.id]) return;
      state.seen[z.id] = 1; state.crosses++;
      if (state.crosses >= 3) B.applyStatus(u, e, 'waxtrapped', 4.5);
    });
  });
  B.alliesOf(u).forEach(a => {
    if (a === u || !zones.some(z => z.type === 'flame' && Math.abs(a.x - z.x) <= z.radius)) return;
    const fresh = !a.hasStatus('waxignited');
    B.applyStatus(u, a, 'waxignited', .7);
    if (fresh && u.waxNetwork) B.energy(u, u.waxAllyEnergy || 3);
  });
  (u.waxFigures || []).slice().forEach(f => {
    if (!f.target.alive) { waxwellMeltFigure(u, f.target, B, 0); return; }
    f.x = clamp(f.x + (f.target.x - f.lastTargetX), B.leftWall, B.rightWall);
    f.lastTargetX = f.target.x;
    f.y = clamp(f.y + (f.target.y - f.lastTargetY), B.ground - B.depthSpan, B.ground);
    f.lastTargetY = f.target.y;
    if (Math.abs(f.x - f.lastX) >= 38) {
      f.lastX = f.x; waxwellAddZone(u, B, 'soft', f.x, 42, 5, f.y);
    }
    B.fxWaxwellFigure('move', u, f, f.target);
  });
}

defHero({
  id: 'Waxwell', name: 'Waxwell', folder: 'Waxwell', file: 'Waxwell', icon: 'Waxwell',
  role: 'Control', roleLabel: 'Terrain Control', tier: 'S', position: 'Backline', element: 'Wax',
  blurb: 'A mischievous candle who turns the floor into a blueprint. He stays safely behind the team while wax and flame decide where everyone else may stand.',
  base: { hp: 3480, atk: 154, def: 178, mag: 390, mdef: 292, spd: 105, acc: 202, eva: 118 },
  hidden: { range: 340, aspd: .91, ms: 61, aggro: .48, crit: .08, critDmg: 1.55, healPow: 1,
    shieldPow: 1, cdr: .08, ccRes: .16, kbRes: .26, armorPen: 0, magPen: .19 },
  growth: { hp: .082, atk: .064, def: .073, mag: .098, mdef: .087 },
  move: { gait: 'waddle', bob: 4, freq: 1.1, lean: 3, squash: .04, idle: 'flicker', step: 'step_soft',
    particles: 'sparkle', pcol: '#ffb347', trail: { on: true, col: '#e7bd54', rate: .16 }, brake: .5 },
  basic: { name: 'Wick Spark', type: 'magic', ratio: .93, range: 340, proj: 'orb', pcol: '#ff9c3e',
    sfx: 'whoosh', hit: 'hit_magic', wind: .25,
    onHit: (u, t, B) => { if (waxwellTouching(u, t).length) B.applyStatus(u, t, 'litup', 3); } },
  skills: {
    W: {
      name: 'Ignite', type: 'Magic Damage / Control', energy: 100,
      v: { dot: .075 }, p: { tired: 999, active: 7, zone: 8, soft: 7, rootAfter: 2.5, rootDur: 1.4, moveEnergy: 2.5, run: .42 },
      desc: (S, P) => `<span class="sk-pas">Begins each wave with 🕯 Tired II. Enemies moving through Waxwell's zones restore his Energy. Every Skill places Soft Wax beneath the highest-Energy enemy; lingering in it causes Root.</span> Active: removes Tired II, lights the wick on his head, then dashes out and back along his Flame Trail. The trail Burns and applies 🕯 Lit Up to enemies while allies crossed gain 🔥 Ignited Skill Haste. When Ignite ends, every Flame Trail melts into Soft Wax.`,
      ai: { cond: (u, B) => B.enemiesOf(u).length > 0 },
      passive: (u, B, S, P) => {
        u.waxZones = []; u.waxZoneSeq = 0; u.waxFigures = [];
        u.waxTrailDot = S.dot; u.waxRootAfter = P.rootAfter; u.waxRootDur = P.rootDur; u.waxMoveEnergy = P.moveEnergy;
        B.applyStatus(u, u, 'tiredii', P.tired);
        B.every(u, .25, () => waxwellUpdate(u, B));
        B.on(u, 'cast', () => {
          const t = B.highestEnergy(B.enemiesOf(u));
          if (t) waxwellAddZone(u, B, 'soft', t.x, 72, P.soft, t.y);
        });
      },
      cast: (u, B, S, P) => {
        const enemies = B.enemiesOf(u); const first = B.highestEnergy(enemies); if (!first) return;
        const second = B.nearest(first, enemies.filter(e => e !== first)) || first;
        const returnX = u.x;
        B.anim(u, 'cast', .52); B.fxWaxwellSkill('ignite', u, { first, second }); Sound.play('whoosh', { vol: .55 });
        B.removeStatus(u, 'tiredii'); u.waxIgniteUntil = B.t + P.active;
        waxwellLine(u, B, second.x, 'flame', P.zone, 62, second.y);
        // Waxwell races the hot path he just drew, with a protected, visibly
        // burning wick. The return dash keeps his controller position intact.
        u.wickBurningUntil = B.t + P.run * 2 + .26;
        B.fxWaxwellSkill('run', u, { endX: second.x });
        B.after(.10, () => {
          if (!u.alive) return;
          B.dash(u, second.x - u.face * 42, P.run, { depth: u.depth });
          B.after(P.run + .05, () => { if (u.alive) B.dash(u, returnX, P.run, { depth: u.depth }); });
        });
        B.after(P.active, () => {
          if (!u.alive || B.t + .05 < u.waxIgniteUntil) return;
          B.applyStatus(u, u, 'tiredii', P.tired);
          waxwellZones(u).forEach(z => { if (z.type === 'flame') { z.type = 'soft'; z.until = Math.max(z.until, B.t + P.soft); } });
          B.fxFloatIcon(u.x, u.y - 104, '🕯', '#e8bd52');
        });
      }
    },
    G: {
      name: 'Melt Pattern', type: 'Magic Damage / Control', cd: 10.5,
      v: { ratio: .68 }, p: { dur: 8, hasteDown: 7 },
      desc: (S, P) => `Melts a long wax path from the backline through the enemy formation for ${P.dur}s. Enemies on it are Slowed and lose Skill Haste. Contact with Flame Trail ignites the path, dealing Magic Damage over time and reducing Energy gain; contact with Soft Wax merges it into a wider zone.`,
      ai: { prio: 58, cond: (u, B) => B.enemiesOf(u).length > 0 },
      cast: (u, B, S, P) => {
        const enemies = B.enemiesOf(u); if (!enemies.length) return;
        const endTarget = enemies.slice().sort((a, b) => u.face > 0 ? b.x - a.x : a.x - b.x)[0];
        const end = endTarget.x;
        const lo = Math.min(u.x, end), hi = Math.max(u.x, end);
        const touchesFire = waxwellZones(u).some(z => z.type === 'flame' && z.x + z.radius >= lo && z.x - z.radius <= hi);
        B.anim(u, 'cast', .38); B.fxWaxwellSkill('melt', u, { endX: end, type: touchesFire ? 'flame' : 'soft', dur: P.dur }); Sound.play('hit_water', { vol: .42 });
        waxwellLine(u, B, end, touchesFire ? 'flame' : 'soft', P.dur, 70, endTarget.y);
        enemies.forEach(e => { if (!waxwellInNetwork(u, e)) return;
          B.damage(u, e, u.st.mag * S.ratio, { type: 'magic', tag: 'Melt Pattern' });
          B.applyStatus(u, e, 'slow', P.hasteDown, { stacks: 2 });
          B.applyStatus(u, e, 'waxcooldowns', P.hasteDown);
          if (touchesFire) B.applyStatus(u, e, 'drain', 4);
        });
      }
    },
    B: {
      name: 'Candle Snuffer', type: 'Control', cd: 12,
      v: {}, p: { delay: 2.4, softBonus: 1.5, loss: 28 },
      desc: (S, P) => `From the backline, delays the highest-Energy enemy's next Skill and stops their Energy gain. Soft Wax lengthens the delay; Flame Trail interrupts and drains ${P.loss} Energy instead. Lit Up spreads to the nearest enemy. With Burning Blueprint, a Trapped enemy makes Candle Snuffer affect every foe standing in Waxwell's network.`,
      ai: { prio: 66, cond: (u, B) => B.enemiesOf(u).some(e => e.energy > 35 || e.casting) },
      cast: (u, B, S, P) => {
        const enemies = B.enemiesOf(u); const primary = B.highestEnergy(enemies); if (!primary) return;
        const networkCast = u.waxNetwork && enemies.some(e => e.hasStatus('waxtrapped'));
        const targets = networkCast ? enemies.filter(e => waxwellInNetwork(u, e)) : [primary];
        B.anim(u, 'cast', .3); B.fxWaxwellSkill('snuffer', u, { targets }); Sound.play('lock', { vol: .55 });
        targets.forEach(t => {
          const inSoft = waxwellTouching(u, t, 'soft').length > 0;
          const inFlame = waxwellTouching(u, t, 'flame').length > 0;
          B.fxWaxwellSkill('snuffHit', u, { target: t, flame: inFlame });
          if (inFlame) { B.interrupt(t); t.energy = Math.max(0, t.energy - P.loss); }
          B.applyStatus(u, t, 'waxsnuffed', P.delay + (inSoft ? P.softBonus : 0));
          if (u.waxFigureCap) waxwellMakeFigure(u, t, B);
          if (t.hasStatus('litup')) {
            const near = B.nearest(t, enemies.filter(e => e !== t));
            if (near) B.applyStatus(u, near, 'litup', 5);
          }
        });
      }
    },
    P: {
      name: 'Wax Figure', type: 'Magic Damage / Control',
      v: { ratio: 1.05 }, p: { cap: 3 },
      desc: (S, P) => `Whenever Waxwell Roots, Slows, Silences, Stuns, or interrupts an enemy, he creates a Wax Figure near the backline (maximum ${P.cap}). Figures copy their original's movement and leave Soft Wax behind. If the original uses a Skill, its figure melts for <em>${pcn(S.ratio * 100)}</em> Magic and lengthens their cooldowns.`,
      passive: (u, B, S, P) => {
        u.waxFigureCap = P.cap; u.waxFigureDamage = S.ratio;
        B.on(u, 'statusApplied', ev => {
          if (ev.src === u && ['root', 'slow', 'silence', 'stun', 'waxsnuffed'].includes(ev.id)) waxwellMakeFigure(u, ev.unit, B);
        });
        B.on(u, 'enemyCast', t => { if ((u.waxFigures || []).some(f => f.target === t)) waxwellMeltFigure(u, t, B, S.ratio); });
      }
    },
    R: {
      name: 'Burning Blueprint', type: 'Magic Damage / Control / Skill Haste',
      v: {}, p: { allyEnergy: 3 },
      desc: (S, P) => `Flame Trails, Soft Wax, and Wax Figures become one connected control network. Touching zones merge or ignite; enemies crossing several zones become 🕸 Trapped in the Pattern, losing Movement, Skill Haste, Accuracy, and bonus Energy. A Trapped enemy makes the next Candle Snuffer hit every foe in the network. Allies Ignited by a Flame Trail restore ${P.allyEnergy} Energy to Waxwell.`,
      passive: (u, B, S, P) => { u.waxNetwork = true; u.waxAllyEnergy = P.allyEnergy; }
    }
  }
});
