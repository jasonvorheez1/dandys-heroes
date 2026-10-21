/* heroes7.js - Goob, a deliberately awkward middle-line rescue Support.
   Hug Lines are real timed links: they track health, redirect his targeting,
   power up healing, and become rescue ropes at Red rarity. */
'use strict';

function goobLineTo(u, target) {
  return (u.goobLines || []).find(line => line.target === target);
}

function goobRemoveLineStatus(u, target) {
  const at = target.statuses.findIndex(s => s.id === 'hugline' && s.src === u);
  if (at >= 0) { target.statuses.splice(at, 1); target.dirty = true; }
}

function goobSnap(u, B) {
  if (!u.goobSnapRadius || !u.alive) return;
  Sound.play('grab', { vol: .48 });
  B.fxRing(u.x, u.y - 42, u.goobSnapRadius * 1.35, '#f3bd68', .34);
  B.enemiesOf(u).filter(e => B.distance(e, u) <= u.goobSnapRadius).forEach(e => {
    const dir = e.x >= u.x ? 1 : -1;
    B.dash(e, e.x + dir * u.goobSnapKnockback, .24, { depth: e.depth });
    B.applyStatus(u, e, 'armslow', u.goobSnapSlow);
  });
}

function goobEndLine(u, line, B, snapped) {
  if (!line || line.ended) return;
  line.ended = true;
  if (line.el) line.el.remove();
  goobRemoveLineStatus(u, line.target);
  u.goobLines = (u.goobLines || []).filter(x => x !== line);
  if (!snapped && line.healthy && u.goobExpiryEnergy && u.alive) {
    B.energy(u, u.goobExpiryEnergy);
    B.fxFloatIcon(u.x, u.y - 104, '⚡', '#f4c86a');
  }
  if (snapped) goobSnap(u, B);
}

function goobUpdateLines(u, B) {
  (u.goobLines || []).slice().forEach(line => {
    const target = line.target;
    if (!u.alive || !target || !target.alive) { goobEndLine(u, line, B, !!u.alive); return; }
    if (target.hpPct < .5) line.healthy = false;
    if (B.t >= line.until) { goobEndLine(u, line, B, false); return; }
    if (!line.el || !line.el.isConnected) return;
    const a = B.unitFxAnchor(u), b = B.unitFxAnchor(target);
    const dx = b.x - a.x, dy = b.y - a.y;
    line.el.style.left = a.x + 'px';
    line.el.style.top = a.y + 'px';
    line.el.style.width = Math.hypot(dx, dy) + 'px';
    line.el.style.transform = `rotate(${Math.atan2(dy, dx)}rad)`;
    line.el.classList.toggle('strained', target.hpPct < .5);
  });
}

function goobCreateLine(u, target, B, dur) {
  if (!target || !target.alive || target === u) return null;
  if (B.t < (u.goobLineLockUntil || 0)) {
    B.floatNum(u, -104, 'ARMS TIRED', 'block'); return null;
  }
  const existing = goobLineTo(u, target);
  if (existing) {
    existing.until = B.t + dur; existing.healthy = existing.healthy && target.hpPct >= .5;
    B.applyStatus(u, target, 'hugline', dur); return existing;
  }
  u.goobLines = u.goobLines || [];
  while (u.goobLines.length >= (u.goobLineCap || 1)) goobEndLine(u, u.goobLines[0], B, true);
  const line = { target, until: B.t + dur, healthy: target.hpPct >= .5, ended: false, el: null };
  const layer = $('#fxBack');
  if (layer) { line.el = el('div', 'goob-hug-line'); layer.appendChild(line.el); }
  u.goobLines.push(line);
  B.applyStatus(u, target, 'hugline', dur);
  B.fxTargetLine(u, target, '#f3bd68');
  B.fxFloatIcon(target.x, target.y - 105, '🤗', '#f3bd68');
  if (u.goobLineShield) {
    B.shield(u, u, u.max.hp * u.goobLineShield, 5);
    B.shield(u, target, target.max.hp * u.goobLineShield, 5);
  }
  return line;
}

function goobApplyComfort(u, target, B) {
  if (!u.goobComfortDur || !target || !target.alive) return;
  B.applyStatus(u, target, 'comforted', u.goobComfortDur,
    { val: u.goobComfortDR, overheal: u.goobComfortHeal });
}

defHero({
  id: 'Goob', name: 'Goob', folder: 'Goob', file: 'Goob', icon: 'Goob',
  role: 'Support', roleLabel: 'Rescue Support', tier: 'D', position: 'Middle', element: 'Hug',
  blurb: 'A friendly pair of long arms in search of somebody who needs pulling out of trouble. His rescues are brief, awkward, and sometimes exactly enough.',
  base: { hp: 3980, atk: 202, def: 224, mag: 264, mdef: 252, spd: 96, acc: 178, eva: 102 },
  hidden: { range: 250, aspd: .88, ms: 65, aggro: .72, crit: .06, critDmg: 1.5, healPow: 1.12,
    shieldPow: 1.15, cdr: .03, ccRes: .18, kbRes: .38, armorPen: .04, magPen: 0 },
  growth: { hp: .084, atk: .068, def: .078, mag: .082, mdef: .083 },
  move: { gait: 'waddle', bob: 5, freq: 1.2, lean: 5, squash: .06, idle: 'sway', step: 'step_soft',
    particles: 'none', pcol: '#f3bd68', trail: { on: false }, brake: .45, wobble: 5 },
  basic: { name: 'Stretch Slap', type: 'physical', ratio: .78, range: 250, sfx: 'swing_double', hit: 'hit_light',
    wind: .28, note: 'Long enough to help from the middle line.',
    onHit: (u, t, B) => {
      if (!u.goobRescueBasic) return;
      B.applyStatus(u, t, 'armslow', u.goobRescueSlow);
      B.fxTargetLine(u, t, '#f3bd68');
      u.goobRescueBasic = false; u.forcedTarget = null;
    } },
  skills: {
    W: {
      name: 'Hug!', type: 'Shield / Rescue', energy: 100,
      v: { shield: .105, hot: .04 }, p: { every: 3, slow: 2.6, line: 7, low: .35, hotDur: 5 },
      desc: (S, P) => `<span class="sk-pas">Every ${P.every} Basics, Goob's next Basic targets the enemy attacking his lowest-HP ally and inflicts 🫳 Tangled Arms.</span>
        Active: pulls the lowest-HP ally close, removes up to two debuffs, grants a <em>${pcn(S.shield * 100)}</em> Max HP Shield and creates a 🤝 Hug Line for ${P.line}s. Below ${pc(P.low)} HP they also regenerate health for ${P.hotDur}s.`,
      ai: { cond: (u, B) => B.alliesOf(u).some(a => a !== u && (a.hpPct < .72 || a.statuses.some(s => STATUS[s.id].kind === 'debuff'))) },
      passive: (u, B, S, P) => {
        u.goobLines = []; u.goobLineCap = 1; u.goobBasicCount = 0; u.goobRescueSlow = P.slow;
        B.every(u, .05, () => goobUpdateLines(u, B));
        B.on(u, 'basicHit', () => {
          if (u.goobRescueBasic) return;
          u.goobBasicCount++;
          if (u.goobBasicCount < P.every) return;
          u.goobBasicCount = 0;
          const allies = B.alliesOf(u).filter(a => a !== u);
          const low = B.lowestHp(allies); if (!low) return;
          const attackers = B.enemiesOf(u).filter(e => e.target === low);
          u.forcedTarget = B.highestStat(attackers, 'atk') || B.highestStat(B.enemiesOf(u), 'atk');
          if (u.forcedTarget) { u.goobRescueBasic = true; B.fxFloatIcon(u.x, u.y - 105, '🫳', '#f3bd68'); }
        });
        B.on(u, 'death', () => (u.goobLines || []).slice().forEach(line => goobEndLine(u, line, B, false)));
      },
      cast: (u, B, S, P) => {
        const ally = B.lowestHp(B.alliesOf(u).filter(a => a !== u)); if (!ally) return;
        const wasLow = ally.hpPct < P.low;
        B.anim(u, 'cast', .42); Sound.play('grab', { vol: .5 });
        B.fxTargetLine(u, ally, '#f3bd68');
        B.pull(ally, u.x - u.face * 48, .34, u.depth);
        B.after(.28, () => {
          if (!ally.alive) return;
          B.shield(u, ally, ally.max.hp * S.shield, 7); B.cleanse(ally, 2);
          if (wasLow) B.applyStatus(u, ally, 'regen', P.hotDur, { val: u.st.mag * S.hot });
          goobCreateLine(u, ally, B, P.line);
        });
      }
    },
    G: {
      name: 'Helping Reach', type: 'Healing', cd: 10.5,
      v: { hot: .17, shield: .045, lineBonus: .32 }, p: { dur: 4, receptive: 6 },
      desc: (S, P) => `Reaches the two allies missing the most HP. Both regenerate <em>${pcn(S.hot * 100)}</em> Magic each second for ${P.dur}s and gain 💞 Receptive. Allies below half HP gain a small Shield; 🤝 Hug Line allies receive <em>${pcn(S.lineBonus * 100)}</em> stronger healing.`,
      ai: { prio: 56, cond: (u, B) => B.alliesOf(u).filter(a => a !== u && a.hpPct < .86).length > 0 },
      cast: (u, B, S, P) => {
        const targets = B.alliesOf(u).filter(a => a !== u).sort((a, b) => a.hpPct - b.hpPct).slice(0, 2);
        if (!targets.length) return;
        B.anim(u, 'cast', .38); Sound.play('heal_incoming', { vol: .4 });
        targets.forEach((a, i) => B.after(i * .12, () => {
          if (!a.alive) return;
          const boost = goobLineTo(u, a) ? 1 + S.lineBonus : 1;
          B.fxTargetLine(u, a, '#8fe3bd');
          B.applyStatus(u, a, 'regen', P.dur, { val: u.st.mag * S.hot * boost });
          B.applyStatus(u, a, 'receptive', P.receptive, { val: .24 });
          if (a.hpPct < .5) B.shield(u, a, a.max.hp * S.shield, P.dur + 2);
        }));
      }
    },
    B: {
      name: 'Stretchy Interruption', type: 'Physical Damage', cd: 12,
      v: { ratio: 1.04, shield: .075, attack: .22 }, p: { debuff: 6, pull: 76 },
      desc: (S, P) => `Strikes and interrupts the highest-Attack enemy for <em>${pcn(S.ratio * 100)}</em> Attack, reducing their Attack by <em>${pcn(S.attack * 100)}</em> for ${P.debuff}s. If they were attacking a 🤝 Hug Line ally, Goob pulls them away and gains a Shield.`,
      ai: { prio: 62, cond: (u, B) => B.enemiesOf(u).length > 0 },
      cast: (u, B, S, P) => {
        const t = B.highestStat(B.enemiesOf(u), 'atk'); if (!t) return;
        const protecting = (u.goobLines || []).some(line => line.target === t.target);
        B.anim(u, 'cast', .4); Sound.play('swing_double', { vol: .52 }); B.fxTargetLine(u, t, '#f3bd68');
        B.after(.26, () => {
          if (!t.alive) return;
          B.interrupt(t); B.damage(u, t, u.st.atk * S.ratio, { type: 'physical', tag: 'Stretchy Interruption' });
          B.applyStatus(u, t, 'attackdown', P.debuff, { val: S.attack });
          if (protecting) {
            const dir = t.x >= u.x ? 1 : -1;
            B.dash(t, t.x + dir * P.pull, .25, { depth: t.depth });
            B.shield(u, u, u.max.hp * S.shield, 6);
          }
        });
      }
    },
    P: {
      name: 'Comforting Presence', type: 'Max HP / Shield',
      v: { hp: .12, dr: .07, heal: .15, lineShield: .035 }, p: { dur: 6, energy: 15 },
      desc: (S, P) => `Max HP +<em>${pcn(S.hp * 100)}</em>. Healing or shielding an ally grants 🧸 Comforted for ${P.dur}s: reduced Damage and stronger healing received. Creating a 🤝 Hug Line Shields both partners; a line that expires while its ally stayed above half HP restores ${P.energy} Energy.`,
      passive: (u, B, S, P) => {
        u.flat.hpP7 = S.hp; u.goobComfortDur = P.dur; u.goobComfortDR = S.dr; u.goobComfortHeal = S.heal;
        u.goobLineShield = S.lineShield; u.goobExpiryEnergy = P.energy; u.dirty = true;
        B.on(u, 'healDone', ev => goobApplyComfort(u, ev.target, B));
        B.on(u, 'shieldDone', ev => goobApplyComfort(u, ev.target, B));
      }
    },
    R: {
      name: 'Long Distance Buddy', type: 'Max HP / Shield / Healing',
      v: { hp: .10, dr: .13, conversion: .55, catchHp: .18, catchShield: .12 },
      p: { far: 230, hot: 4, stun: 1.6, lock: 5, snapRadius: 235, snapSlow: 4.5, knockback: 100 },
      desc: (S, P) => `Max HP +<em>${pcn(S.hp * 100)}</em> and Goob can hold two 🤝 Hug Lines. Linked allies take <em>${pcn(S.dr * 100)}</em> less Damage from enemies farther than ${P.far} range; <em>${pcn(S.conversion * 100)}</em> of the prevented Damage becomes healing over ${P.hot}s. Once per line, Goob catches a lethal ally at <em>${pcn(S.catchHp * 100)}</em> HP and Shields them, but the line snaps, Goob is Stunned, and new lines are locked for ${P.lock}s. Snaps Knock Back nearby enemies and inflict 🫳 Tangled Arms.`,
      passive: (u, B, S, P) => {
        u.flat.hpP8 = S.hp; u.goobLineCap = 2;
        u.goobSnapRadius = P.snapRadius; u.goobSnapSlow = P.snapSlow; u.goobSnapKnockback = P.knockback; u.dirty = true;
        B.on(u, 'allyDamaged', ev => {
          const line = goobLineTo(u, ev.unit);
          if (!line || !ev.src || ev.src.team === u.team || B.distance(ev.src, u) <= P.far) return;
          const prevented = ev.amount * S.dr;
          ev.amount -= prevented;
          B.applyStatus(u, ev.unit, 'regen', P.hot, { val: prevented * S.conversion / P.hot });
        });
        B.on(u, 'allyLethal', ev => {
          const line = goobLineTo(u, ev.unit);
          if (!line || line.caught || B.t < (u.goobLineLockUntil || 0)) return;
          line.caught = true; ev.prevented = true;
          ev.unit.hp = Math.max(1, ev.unit.max.hp * S.catchHp);
          B.shield(u, ev.unit, ev.unit.max.hp * S.catchShield, 6);
          B.pull(ev.unit, u.x - u.face * 44, .28, u.depth);
          u.goobLineLockUntil = B.t + P.lock;
          goobEndLine(u, line, B, true);
          B.applyStatus(u, u, 'stun', P.stun, { unresistable: true });
          B.log(`<b>Goob</b> catches ${ev.unit.name} before they fall!`);
        });
      }
    }
  }
});
