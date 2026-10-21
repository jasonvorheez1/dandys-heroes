/* heroes12.js - Tisha, Gardenview's formation-control specialist. */
'use strict';

function tishaLines(u, B) {
  if (!u._tishaLines) {
    const span = B.rightWall - B.leftWall;
    u._tishaLines = [.37, .5, .63].map(p => B.leftWall + span * p);
  }
  return u._tishaLines;
}

function tishaCrossed(from, to, line) {
  return Math.abs(to - from) > 3 && Math.min(from, to) <= line && Math.max(from, to) >= line;
}

function tishaMisplace(u, target, B, dur) {
  if (!target || !target.alive) return;
  const fresh = !target.hasStatus('misplaced');
  B.applyStatus(u, target, 'misplaced', dur || 6);
  if (!fresh) {
    const st = target.getStatus('misplaced');
    if (st) st.t = Math.max(st.t, dur || 6);
  }
  B.fxFloatIcon(target.x, target.y - 92, '🧹', '#9ff3ef');
  if (fresh && u.tishaNeatFreak) B.applyStatus(u, u, 'haste', 4, { stacks: 1 });

  const foes = B.enemiesOf(u);
  const all = foes.length > 0 && foes.every(e => e.hasStatus('misplaced'));
  if (u.tishaNeatFreak && all && !u._tishaAllMisplaced) {
    u._tishaAllMisplaced = true;
    if (B.t - (u._tishaDustRefreshAt || -99) > 7) {
      u._tishaDustRefreshAt = B.t;
      B.after(.18, () => { if (u.alive) tishaDustCloud(u, B, .09, 4.2, true); });
    }
  }
}

function tishaCrossLine(u, unit, B, line) {
  if (unit.team === u.team) {
    B.applyStatus(u, unit, 'cleanstep', 3.5);
    const movementDebuff = ['slow', 'tangled', 'sticky'].find(id => unit.hasStatus(id));
    if (movementDebuff) B.removeStatus(unit, movementDebuff);
    if (u.tishaSpotless) B.shield(u, unit, u.st.atk * u.tishaLineShield, 4);
  } else {
    tishaMisplace(u, unit, B, 6);
    B.energy(u, 5);
    if (u.tishaSpotless) {
      B.energy(unit, -9);
      Object.keys(unit.cds).forEach(k => { unit.cds[k] += .55; });
    }
  }
  B.fxRing(line, B.ground - 28, 54, unit.team === u.team ? '#d9fff0' : '#85e8ed', .24);
}

function tishaDustCloud(u, B, dotRatio, dur, reduced) {
  const foes = B.enemiesOf(u); if (!foes.length) return;
  const cx = B.avgX(foes), width = Math.min(430, Math.max(230, B.rightWall - B.leftWall) * .52);
  B.fxTishaDust(cx, width, dur, reduced); Sound.play('tisha_dust_cloud', { vol: reduced ? .22 : .34, throttle: 260 });
  foes.forEach(e => B.applyStatus(u, e, 'dustcloud', dur, { val: u.st.atk * dotRatio }));
  B.alliesOf(u).forEach(a => B.applyStatus(u, a, 'cleanfocus', dur));
}

function tishaHookDustMisses(u, B) {
  B.enemiesOf(u).forEach(e => {
    const hook = '_tishaDustHook' + u.uid;
    if (e[hook]) return;
    e[hook] = true;
    B.on(e, 'missed', () => {
      if (!u.alive || !e.alive || !e.hasStatus('dustcloud')) return;
      B.applyStatus(u, e, 'dustjam', 1.35);
      B.interrupt(e);
      const misplaced = e.getStatus('misplaced');
      if (misplaced) misplaced.t += 1.4; else tishaMisplace(u, e, B, 5);
      B.fxTishaSweep(u, e, false); Sound.play('tisha_duster_sweep', { vol: .24, throttle: 160 });
    });
  });
}

function tishaSortFormation(u, B, S, P) {
  const foes = B.enemiesOf(u).slice().sort((a, b) => (a.x - b.x) * u.face);
  if (!foes.length) return;
  const edge = Math.max(1, Math.ceil(foes.length / 3));
  const middle = foes.slice(edge, Math.max(edge, foes.length - edge));
  const middleX = middle.length ? B.avgX(middle) : B.avgX(foes);
  const planned = [];
  foes.forEach((e, i) => {
    let dest;
    if (i < edge) dest = e.x + e.face * P.frontPush;
    else if (i >= foes.length - edge) dest = e.x - e.face * P.backPush;
    else dest = middleX + (i - edge - (middle.length - 1) / 2) * 34;
    dest = clamp(dest, B.leftWall + 35, B.rightWall - 35);
    planned.push({ e, dest });
  });

  B.fxTishaSweep(u, null, true); Sound.play('tisha_formation_signal', { vol: .34, throttle: 180 });
  planned.forEach(({ e, dest }, i) => B.after(i * .045, () => {
    if (!u.alive || !e.alive) return;
    // Repositioning is the point of the formation sweep. Cancel a skill that
    // was already being prepared so the enemy cannot finish it after Tisha
    // has visibly sorted them into a new row.
    if (e.casting) B.interrupt(e);
    B.dash(e, dest, .28, { depth: e.depth });
    B.applyStatus(u, e, 'armslow', P.slow);
    tishaMisplace(u, e, B, 7);
  }));
  for (let a = 0; a < planned.length; a++) for (let b = a + 1; b < planned.length; b++) {
    if (Math.abs(planned[a].dest - planned[b].dest) <= P.bumpRange) {
      B.after(.3, () => {
        [planned[a].e, planned[b].e].forEach(e => {
          if (!e.alive) return;
          B.applyStatus(u, e, 'stun', P.bumpStun); B.applyStatus(u, e, 'blind', 4);
          B.fxBoom(e.x, e.y - 46, .55, '#b9f4ee');
        });
      });
    }
  }

  if (u.tishaSpotless) {
    const frontAnchor = B.midX + u.face * 105;
    const backAnchor = u.face > 0 ? B.rightWall - 68 : B.leftWall + 68;
    const midAnchor = (frontAnchor + backAnchor) / 2;
    u._tishaSorted = new Map();
    foes.forEach((e, i) => u._tishaSorted.set(e.uid,
      i < edge ? frontAnchor : i >= foes.length - edge ? backAnchor : midAnchor));
    u._tishaSortedUntil = B.t + P.sorted;
    foes.forEach(e => B.applyStatus(u, e, 'sortedformation', P.sorted));
  }
}

defHero({
  id: 'Tisha', name: 'Tisha', folder: 'Tisha', file: 'Tisha', icon: 'Tisha',
  scale: 1.04,
  role: 'Control', roleLabel: 'Formation Control', tier: 'S', position: 'Midline', element: 'Clean',
  blurb: 'A tireless organizer who turns battlefield spacing into a weapon, sweeping mobile enemies back into their proper rows.',
  base: { hp: 4240, atk: 288, def: 248, mag: 188, mdef: 252, spd: 124, acc: 202, eva: 154 },
  hidden: { range: 238, aspd: 1.06, ms: 84, aggro: .78, crit: .10, critDmg: 1.58, healPow: 1,
    shieldPow: 1.08, cdr: .08, ccRes: .24, kbRes: .36, armorPen: .12, magPen: .03 },
  growth: { hp: .089, atk: .086, def: .083, mag: .067, mdef: .084 },
  move: { gait: 'sprint', bob: 5, freq: 2.5, lean: 14, squash: .06, idle: 'sweep', step: 'step_soft',
    particles: 'dust', pcol: '#9deceb', trail: { on: true, col: '#8fe8ed', rate: .09 }, brake: .48 },
  basic: { name: 'Duster Snap', type: 'physical', ratio: .94, range: 238, sfx: 'swing_pole', hit: 'hit_light', wind: .18,
    note: 'A precise feather-duster snap that keeps the nearest threat at arm’s length.',
    onHit: (u, t, B) => { if (t.hasStatus('misplaced')) B.energy(u, 2); } },
  skills: {
    W: {
      name: 'Tidy Up!', type: 'Control / Physical Damage', energy: 100,
      v: { ratio: .76 }, p: { misplaced: 7, extra: 58 },
      desc: (S, P) => `<span class="sk-pas">Tisha draws invisible Clean Lines across the field. Allies crossing one gain Move Speed and shed one movement penalty; enemies crossing one become 🧹 Misplaced, reducing Accuracy and Skill Haste.</span> Active: a cleaning pulse speeds allies and sweeps every enemy toward the nearest Clean Line for <em>${pcn(S.ratio * 100)}</em> Attack. Already Misplaced enemies are pushed farther and interrupted.`,
      passive: (u, B) => {
        const lines = tishaLines(u, B); u._tishaLastX = {};
        B.after(.25, () => { if (u.alive) B.fxTishaLines(lines, u.tishaSpotless ? 2.3 : 1.2, !!u.tishaSpotless); });
        B.every(u, .12, () => {
          tishaHookDustMisses(u, B);
          B.units.filter(x => x.alive && !x.minion).forEach(x => {
            const key = x.team + ':' + x.uid, before = u._tishaLastX[key];
            if (before != null) lines.forEach(line => { if (tishaCrossed(before, x.x, line)) tishaCrossLine(u, x, B, line); });
            u._tishaLastX[key] = x.x;
          });
          if (u.tishaNeatFreak && !B.enemiesOf(u).every(e => e.hasStatus('misplaced'))) u._tishaAllMisplaced = false;
          if (u.tishaSpotless && u._tishaSorted && B.t < u._tishaSortedUntil) {
            B.enemiesOf(u).forEach(e => {
              const anchor = u._tishaSorted.get(e.uid);
              if (anchor == null || Math.abs(e.x - anchor) <= 82 || B.t < (e._tishaSweepAt || 0)) return;
              e._tishaSweepAt = B.t + .9; B.interrupt(e); B.dash(e, anchor, .18, { depth: e.depth });
              B.damage(u, e, u.st.atk * u.tishaRowDamage, { type: 'physical', tag: 'Spotless Formation' });
              tishaMisplace(u, e, B, 6); B.fxTishaSweep(u, e, false);
            });
          }
        });
      },
      cast: (u, B, S, P) => {
        const lines = tishaLines(u, B); B.anim(u, 'cast', .72); B.fxTishaLines(lines, 1.3, true); B.fxTishaSweep(u, null, true);
        Sound.play('tisha_wind', { vol: .18, throttle: 300 });
        Sound.play('tisha_duster_sweep', { vol: .22, delay: .12, throttle: 300 });
        B.alliesOf(u).forEach(a => {
          B.applyStatus(u, a, 'cleanstep', 4);
          const movementDebuff = ['slow', 'tangled', 'sticky'].find(id => a.hasStatus(id));
          if (movementDebuff) B.removeStatus(a, movementDebuff);
        });
        B.enemiesOf(u).forEach((e, i) => B.after(.12 + i * .045, () => {
          if (!e.alive || !u.alive) return;
          const already = e.hasStatus('misplaced');
          const line = lines.slice().sort((a, b) => Math.abs(a - e.x) - Math.abs(b - e.x))[0];
          const dir = Math.sign(line - e.x) || u.face;
          const dest = line + (already ? dir * P.extra : 0);
          B.damage(u, e, u.st.atk * S.ratio, { type: 'physical', area: true, tag: 'Tidy Up!' });
          B.dash(e, dest, .26, { depth: e.depth }); tishaMisplace(u, e, B, P.misplaced);
          if (already) B.interrupt(e);
        }));
      }
    },
    G: {
      name: 'Everything In Its Place', type: 'Control', cd: 10,
      v: {}, p: { frontPush: 76, backPush: 72, slow: 6, bumpRange: 62, bumpStun: 1.05, sorted: 6 },
      desc: (S, P) => `Sweeps every enemy toward a proper row: frontliners forward, backliners backward, and middle enemies toward center. All become 🧹 Misplaced and lose Attack Speed. Enemies compressed within ${P.bumpRange} range collide, becoming Stunned and Blinded.${P.sorted ? ' At Red rarity, their assigned rows are temporarily locked.' : ''}`,
      ai: { prio: 72, cond: (u, B) => B.enemiesOf(u).length > 0 },
      cast: (u, B, S, P) => { B.anim(u, 'cast', .72); tishaSortFormation(u, B, S, P); }
    },
    B: {
      name: 'Dust Cloud', type: 'Control / Physical Damage', cd: 12,
      v: { impact: .46, dot: .14 }, p: { dur: 7 },
      desc: (S, P) => `Kicks up a Dust Cloud for ${P.dur}s. Enemies take <em>${pcn(S.impact * 100)}</em> Attack immediately, then Physical Damage over time with heavily reduced Accuracy. A miss lets Tisha interrupt their next Basic Attack and extend 🧹 Misplaced. Allies gain Accuracy against the cloud.`,
      ai: { prio: 64, cond: (u, B) => B.enemiesOf(u).length > 0 },
      cast: (u, B, S, P) => {
        B.anim(u, 'cast', .62); B.enemiesOf(u).forEach(e => B.damage(u, e, u.st.atk * S.impact,
          { type: 'physical', area: true, tag: 'Dust Cloud' }));
        tishaDustCloud(u, B, S.dot, P.dur, false); tishaHookDustMisses(u, B);
      }
    },
    P: {
      name: 'Neat Freak', type: 'Skill Haste / Control',
      v: {}, p: {},
      desc: () => `Whenever an enemy first becomes 🧹 Misplaced, Tisha gains Haste. Pushing an enemy across a Clean Line restores Energy. When every living enemy is Misplaced at once, Tisha immediately refreshes Dust Cloud at reduced strength, no more than once every 7s.`,
      passive: (u) => { u.tishaNeatFreak = true; }
    },
    R: {
      name: 'Spotless Formation', type: 'Control / Skill Haste / Physical Damage',
      v: { lineShield: .22, rowDamage: .42 }, p: {},
      desc: (S) => `Clean Lines now drain enemy Energy and delay their Skill cooldowns, while allies crossing gain a <em>${pcn(S.lineShield * 100)}</em> Attack Shield. Everything In Its Place creates Sorted Formation: enemies are assigned to a row, and attempts to leave are swept back, interrupted, and struck for <em>${pcn(S.rowDamage * 100)}</em> Attack.`,
      passive: (u, B, S) => {
        u.tishaSpotless = true; u.tishaLineShield = S.lineShield; u.tishaRowDamage = S.rowDamage;
        B.after(.35, () => { if (u.alive) B.fxTishaLines(tishaLines(u, B), 2.5, true); });
      }
    }
  }
});
