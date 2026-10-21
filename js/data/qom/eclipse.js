'use strict';

function qomEclipseAmp(u, B, amount) {
  const before = qomStacks(u, 'qom_amp');
  const cap = u.rarity >= 5 ? 15 : 10;
  if (before >= cap) return;
  B.applyStatus(u, u, 'qom_amp', 999, { stacks: Math.min(amount, cap - before) });
  const now = qomStacks(u, 'qom_amp');
  if (before < 10 && now >= 10) { qomMark(u, B, 'FULL VOLUME', '#c8fb7a'); qomShow(B, 'riff', u); }
  if (before < 15 && now >= 15) {
    qomMark(u, B, 'HEADLINER', '#e8a8ff'); qomShow(B, 'solo', u);
    if (u.hpPct < .60 && !u._qomFinalSolo) {
      u._qomFinalSolo = true;
      B.after(.12, () => qomEclipseFinalSolo(u, B));
    }
  }
}

function qomEclipseWave(u, B, ratio, tag) {
  const amp = qomStacks(u, 'qom_amp');
  const total = qomWave(B, u, ratio, 'magic', tag, e => {
    if (amp >= 10) B.applyStatus(u, e, 'armslow', 3);
    if (amp >= 12) B.applyStatus(u, e, 'grief', 4);
  });
  qomShow(B, tag === 'Final Solo' ? 'solo' : 'riff', u);
  return total;
}

function qomEclipseFinalSolo(u, B) {
  if (!u.alive) return;
  B.applyStatus(u, u, 'untargetable', 1.45);
  B.anim(u, 'cast', 1.45);
  Sound.play('qom_riff', { vol: .65, priority: true });
  let total = 0;
  B.repeat(4, .25, i => {
    if (!u.alive) return;
    total += qomEclipseWave(u, B, .66 + i * .22, 'Final Solo');
    qomFoes(B, u).forEach(e => {
      B.applyStatus(u, e, 'qom_feedback', 6);
      B.applyStatus(u, e, 'defdown', 5);
      B.applyStatus(u, e, 'magdown', 5);
    });
  });
  B.after(1.08, () => {
    if (!u.alive) return;
    const target = qomTop(qomFoes(B, u), 'hp');
    if (target) {
      B.leap(u, target.x - u.face * 20, .22, () => {
        if (!u.alive || !target.alive) return;
        const hit = B.damage(u, target, u.st.atk * (2.6 + (1 - target.hpPct) * 2.1), { type: 'physical', tag: 'Final Chord' });
        total += hit ? hit.amount : 0;
        B.knockback(u, target, 90);
        qomShow(B, 'solo', u, target);
      }, target.depth);
    }
    total += qomWave(B, u, .65, 'magic', 'Final Chord Splash', e => { if (e !== target) B.knockback(u, e, 65); });
    B.heal(u, u, Math.min(u.max.hp * .38, total * .16));
    B.shield(u, u, Math.min(u.max.hp * .38, total * .18), 8);
    B.removeStatus(u, 'untargetable');
  });
}

QOM_ECLIPSE.basic.onHit = (u, target, B) => {
  u._qomGuitarSwing = (u._qomGuitarSwing || 0) + 1;
  if (u._qomGuitarSwing % 2 === 0 && target.alive) {
    B.damage(u, target, u.st.mag * .37, { type: 'magic', tag: 'Electric Guitar Swing' });
    qomShow(B, 'riff', u, target);
  }
};

QOM_ECLIPSE.skills = {
  W: {
    name: 'Queens of Mischief', type: 'Physical / Magic / Control', energy: 100,
    v: { ratio: 1.65 }, p: {},
    desc: () => 'Every third Basic releases an electric soundwave and gains Amplification. At 2/4/6/8/10 stacks she gains speed, splash, defenses, Energy drain, and Full Volume. Active: leaps into the enemy team, knocks them back, claws their strongest attacker, and at Full Volume adds three interrupting soundwaves and a damage-based Shield.',
    passive(u, B) {
      u._qomBasics = 0;
      B.on(u, 'basicHit', ev => {
        if (!ev.target) return;
        const amp = qomStacks(u, 'qom_amp');
        if (amp >= 4) qomFoes(B, u).filter(e => e !== ev.target && B.distance(e, ev.target) < 150)
          .forEach(e => B.damage(u, e, u.st.mag * .28, { type: 'magic', area: true, tag: 'Guitar Splash' }));
        if (amp >= 8) B.energy(ev.target, -5);
        if (++u._qomBasics % 3) return;
        qomEclipseAmp(u, B, 1);
        qomEclipseWave(u, B, .36, 'Electric Soundwave');
      });
      B.on(u, 'dealDamage', ev => {
        if (!ev.target || ev.target.team === u.team || ev.dot || ev.reflected) return;
        const amp = qomStacks(u, 'qom_amp');
        if (amp >= 10) B.heal(u, u, Math.min(u.max.hp * .035, ev.amount * (amp >= 15 ? .16 : .09)));
        if (amp >= 15 && ev.basic && ev.target.alive)
          B.damage(u, ev.target, u.st.mag * .43, { type: 'magic', tag: 'Headliner Double', reflected: true });
      });
    },
    cast(u, B, S) {
      const foes = qomFoes(B, u); if (!foes.length) return;
      qomVoice(u, 'qom_hey');
      qomShow(B, 'charge', u, qomTop(foes, 'atk'));
      B.leap(u, B.avgX(foes), .34, () => {
        if (!u.alive) return;
        qomEclipseWave(u, B, S.ratio, 'Queens of Mischief');
        foes.filter(e => e.alive).forEach(e => B.knockback(u, e, 75));
        const strong = qomTop(qomFoes(B, u), 'atk');
        if (strong) B.repeat(3, .16, () => {
          if (!u.alive || !strong.alive) return;
          B.damage(u, strong, u.st.atk * .72, { type: 'physical', tag: 'Guitar Claws' });
          qomShow(B, 'riff', u, strong);
        });
        if (qomStacks(u, 'qom_amp') >= 10) {
          let lastTotal = 0;
          B.repeat(3, .23, i => {
            if (!u.alive) return;
            lastTotal = qomEclipseWave(u, B, .55 + i * .10, 'Full Volume');
            qomFoes(B, u).forEach(e => { if (e.casting) B.interrupt(e); });
          });
          B.after(.75, () => { if (u.alive) B.shield(u, u, Math.min(u.max.hp * .35, lastTotal * .24), 7); });
        }
      }, foes[0].depth);
      Sound.play('qom_riff', { vol: .60 });
    }
  },
  G: {
    name: 'Feedback Frenzy', type: 'Magic / Control / Shield', cd: 9,
    v: { ratio: 1.25 }, p: { dur: 6 },
    desc: () => 'Feedback damages and weakens nearby enemies. Their Skills hurt them and build Amplification; attacks against Eclipse trigger shielded counters. At Full Volume Feedback reaches the whole team, hits harder, and heals Eclipse.',
    cast(u, B, S, P) {
      const full = qomStacks(u, 'qom_amp') >= 10;
      qomShow(B, 'feedback', u);
      qomFoes(B, u).filter(e => full || B.distance(u, e) < 280).forEach(e => {
        const already = e.hasStatus('qom_feedback');
        B.damage(u, e, u.st.mag * S.ratio * (full && already ? 1.35 : 1), { type: 'magic', tag: 'Feedback Frenzy' });
        B.applyStatus(u, e, 'qom_feedback', P.dur);
        if (full) B.heal(u, u, u.max.hp * .035);
      });
      Sound.play('qom_riff', { vol: .45 });
    }
  },
  B: {
    name: 'Howling Riff', type: 'Physical / Magic / Control', cd: 12,
    v: { ratio: 1.15 }, p: { dur: 6 },
    desc: () => 'Eclipse howls, gains Attack Speed and Evasion, then charges through three foes, Rattling them. A sustained chord hits every Rattled target. At low HP she guards and Taunts the strongest foe; Full Volume reaches every enemy and punishes low HP.',
    cast(u, B, S, P) {
      u._qomRiffUntil = B.t + 1.3;
      qomShow(B, 'charge', u);
      B.applyStatus(u, u, 'speedup', P.dur);
      B.applyStatus(u, u, 'qom_riff_speed', P.dur);
      if (u.hpPct < .5) {
        B.applyStatus(u, u, 'ward', 4);
        const strongest = qomTop(qomFoes(B, u), 'atk');
        if (strongest) B.applyStatus(u, strongest, 'taunt', 3);
      }
      const full = qomStacks(u, 'qom_amp') >= 10;
      const foes = qomFoes(B, u).slice(0, full ? 99 : 3);
      foes.forEach((e, i) => B.after(i * .18, () => {
        if (!u.alive || !e.alive) return;
        B.dash(u, e.x - u.face * 25, .16, { depth: e.depth });
        B.damage(u, e, u.st.atk * S.ratio, { type: 'physical', tag: 'Howling Riff' });
        B.applyStatus(u, e, full ? 'qom_rattled_full' : 'qom_rattled', 6);
        qomShow(B, 'charge', u, e);
      }));
      B.after(Math.max(.45, foes.length * .18 + .12), () => {
        if (!u.alive) return;
        qomFoes(B, u).filter(e => e.hasStatus('qom_rattled') || e.hasStatus('qom_rattled_full')).forEach(e => {
          B.damage(u, e, u.st.mag * (.78 + (full ? (1 - e.hpPct) * .85 : 0)), { type: 'magic', tag: 'Sustained Chord' });
        });
        qomShow(B, 'riff', u);
      });
      Sound.play('qom_riff', { vol: .5 });
    }
  },
  P: {
    name: 'Wild at Heart', type: 'Attack / Armor / Lifesteal / Control', v: { hp: .16 }, p: {},
    desc: () => 'Gains Max HP and Lifesteal. Critical hits build Amplification and restore HP. Skill hits build Backstage Guard; maximum Guard prepares a reflecting Reversal. Defeats heal her and raise her Attack. At Full Volume she can spend Amplification to resist a Stun.',
    passive(u, B, S) {
      u.flat.hpPqom = S.hp; u.flat.healRecvqom = .15; u.dirty = true;
      B.on(u, 'dealDamage', ev => {
        if (!ev.crit || ev.dot || ev.reflected) return;
        qomEclipseAmp(u, B, 1);
        B.heal(u, u, (u.max.hp - u.hp) * .035);
      });
      B.on(u, 'damaged', ev => {
        if (u._qomReversalReady && ev.src && !ev.reflected) {
          u._qomReversalReady = false;
          B.damage(u, ev.src, ev.amount * .42, { type: 'magic', reflected: true, tag: 'Reversal' });
          B.knockback(u, ev.src, 75); qomShow(B, 'riff', u, ev.src);
          B.removeStatus(u, 'qom_backstage_guard');
        } else if (ev.src && !ev.basic && !ev.reflected) {
          B.applyStatus(u, u, 'qom_backstage_guard', 7);
          if (qomStacks(u, 'qom_backstage_guard') >= 5) u._qomReversalReady = true;
        }
      });
      B.on(u, 'enemyDown', e => {
        if (e._lastHitBy !== u) return;
        B.heal(u, u, u.max.hp * .10);
        B.applyStatus(u, u, 'atkup', 999);
        qomEclipseAmp(u, B, 1);
      });
      u.guards.push((id, def) => {
        if (id !== 'stun' || qomStacks(u, 'qom_amp') < 10 || B.t < (u._qomStunGuardAt || 0)) return false;
        u._qomStunGuardAt = B.t + 8;
        qomSpend(B, u, 'qom_amp', 2);
        const target = qomTop(qomFoes(B, u), 'atk');
        if (target) { B.damage(u, target, u.st.atk * .95, { type: 'physical', tag: 'Wild Counter' }); qomShow(B, 'riff', u, target); }
        return true;
      });
    }
  },
  R: {
    name: 'Final Encore', type: 'Physical / Magic / Shield / Control', v: { atk: .16 }, p: {},
    desc: () => 'Amplification reaches 15. Higher stacks pierce Armor, reduce enemy Healing, strengthen defense and shields, and restore Energy on Critical hits. Headliner doubles Basics and resists the first Skill hit. A low-HP maximum triggers the once-per-wave Final Solo.',
    passive(u, B, S) {
      u.flat.atkPqom = S.atk; u.flat.critDmgqom = .24; u.flat.hpPqomR = .08; u.dirty = true;
      B.on(u, 'dealDamage', ev => {
        const amp = qomStacks(u, 'qom_amp');
        if (ev.target && ev.target.alive && amp >= 12 && ev.tag && (ev.tag.includes('Soundwave') || ev.tag.includes('Volume') || ev.tag.includes('Solo')))
          B.applyStatus(u, ev.target, 'grief', 4);
        if (ev.crit && amp >= 14 && !ev.reflected) {
          B.energy(u, 5);
          u.cds.B = Math.max(0, (u.cds.B || 0) - .35);
        }
        if (amp >= 15 && ev.target && ev.target.hpPct < .5 && ev.tag && ev.tag.includes('Guitar')) ev.amount *= 1.22;
      });
      B.on(u, 'damaged', ev => {
        if (qomStacks(u, 'qom_amp') < 15 || ev.basic || ev.dot || u._qomHeadlinerAbsorbed) return;
        u._qomHeadlinerAbsorbed = true;
        const saved = ev.amount * .5;
        ev.amount -= saved;
        B.shield(u, u, saved, 6);
        qomShow(B, 'barrier', u);
      });
      B.on(u, 'enemyDown', e => {
        if (qomStacks(u, 'qom_amp') < 15 || e._lastHitBy !== u) return;
        qomEclipseWave(u, B, .42, 'Headliner KO'); B.energy(u, 12);
      });
    }
  }
};

QOM_ECLIPSE.skills.W.passive = ((original) => (u, B, S, P) => {
  original(u, B, S, P);
  B.on(u, 'enemyCast', e => {
    if (!e.hasStatus('qom_feedback')) return;
    B.damage(u, e, u.st.mag * .55, { type: 'magic', tag: 'Feedback Punish' });
    qomEclipseAmp(u, B, 1);
    qomShow(B, 'feedback', u, e);
  });
  B.on(u, 'damaged', ev => {
    if (!ev.src || !ev.src.hasStatus('qom_feedback') || ev.reflected || B.t < (u._qomFeedbackCounterAt || 0)) return;
    u._qomFeedbackCounterAt = B.t + .85;
    B.damage(u, ev.src, u.st.mag * .65, { type: 'magic', reflected: true, tag: 'Feedback Counter' });
    B.shield(u, u, u.max.hp * .07, 5);
    if (ev.src.hpPct < .5) B.applyStatus(u, ev.src, 'stun', .85);
    qomShow(B, 'feedback', u, ev.src);
  });
  B.every(u, .7, () => {
    const count = qomFoes(B, u).filter(e => e.hasStatus('qom_feedback')).length;
    const bonus = count * .055;
    if (u.flat.mdefPqomFeedback !== bonus) { u.flat.mdefPqomFeedback = bonus; u.dirty = true; }
  });
  B.on(u, 'enemyDown', e => {
    if (e._lastHitBy === u && B.t < (u._qomRiffUntil || 0)) {
      B.energy(u, 16); B.heal(u, u, (u.max.hp - u.hp) * .09);
    }
  });
})(QOM_ECLIPSE.skills.W.passive);
