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

QOM_ECLIPSE.basic.note = 'Alternates razor guitar slashes and electric soundwaves. Every 2nd hit splashes Magic damage; every 3rd hit grants Amplification and releases a concussive shockwave.';
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
    v: { ratio: 1.75, splash: .36, clawRatio: .72 }, p: { ampMax: 10 },
    desc: (S, P) => `<span class="sk-pas">Passive: Every 3rd Basic Attack releases an electric soundwave dealing <em>${pcn(S.splash * 100)}%</em> Magic Damage and grants 1 stack of ⚡ <b>Amplification</b> (max ${P.ampMax}, or 15 at 5-star). Critical hits and enemy KOs grant extra Amp.<br>
• <b>4+ Stacks</b>: Basic attacks splash <em>${pcn(S.splash * 100)}%</em> Magic damage to adjacent foes.<br>
• <b>8+ Stacks</b>: Basic hits drain 5 Energy from the target.<br>
• <b>10+ Stacks (FULL VOLUME)</b>: Heals for 9% of all damage dealt; Feedback Frenzy hits all enemies.<br>
• <b>15 Stacks (HEADLINER)</b>: Basic attacks trigger Double Strikes, lifesteal rises to 16%, absorbs 50% of the first major skill hit into a shield, and dropping &lt;60% HP triggers the devastating 🎸 <b>Final Solo</b>!</span><br>
Active: Leaps high into the enemy formation, knocks all foes back, and tears into the strongest enemy with 3 rapid guitar claw strikes (<em>${pcn(S.ratio * 100)}% Physical</em>). At Full Volume, unleashes 3 interrupting shockwaves and gains an electric shield!`,
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
          B.damage(u, strong, u.st.atk * S.clawRatio, { type: 'physical', tag: 'Guitar Claws' });
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
    v: { ratio: 1.35, heal: .04 }, p: { dur: 6 },
    desc: (S, P) => `Screeching guitar feedback lashes nearby enemies for <em>${pcn(S.ratio * 100)}%</em> Magic Damage, marking them with <b>Feedback</b> for <em>${P.dur}s</em>. While marked, enemy Skill casts trigger electric backlash (55% Mag) and build 1 Amplification for Eclipse; enemy attacks against Eclipse trigger shielded counter-riffs (65% Mag) that Stun low-HP targets. At <b>Full Volume</b>, reaches all enemies, deals +35% damage, and heals Eclipse for <em>${pcn(S.heal * 100)}% Max HP</em>!`,
    cast(u, B, S, P) {
      const full = qomStacks(u, 'qom_amp') >= 10;
      qomShow(B, 'feedback', u);
      qomFoes(B, u).filter(e => full || B.distance(u, e) < 280).forEach(e => {
        const already = e.hasStatus('qom_feedback');
        B.damage(u, e, u.st.mag * S.ratio * (full && already ? 1.35 : 1), { type: 'magic', tag: 'Feedback Frenzy' });
        B.applyStatus(u, e, 'qom_feedback', P.dur);
        if (full) B.heal(u, u, u.max.hp * S.heal);
      });
      Sound.play('qom_riff', { vol: .45 });
    }
  },
  B: {
    name: 'Howling Riff', type: 'Physical / Magic / Control', cd: 12,
    v: { ratio: 1.25, chord: .85 }, p: { dur: 6 },
    desc: (S, P) => `Eclipse howls into the microphone, gaining +30% Attack Speed and +25% Evasion for <em>${P.dur}s</em>, then dashes through 3 foes (or ALL foes at Full Volume), dealing <em>${pcn(S.ratio * 100)}% Physical Damage</em> and inflicting <b>Rattled</b> (-20% Def and MagDef for 6s). Afterward, a sustained power chord detonates all Rattled enemies for <em>${pcn(S.chord * 100)}% Magic Damage</em> (+ bonus missing-HP damage at Full Volume). Below 50% HP, she gains Ward and Taunts the strongest foe.`,
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
          B.damage(u, e, u.st.mag * (S.chord + (full ? (1 - e.hpPct) * .85 : 0)), { type: 'magic', tag: 'Sustained Chord' });
        });
        qomShow(B, 'riff', u);
      });
      Sound.play('qom_riff', { vol: .5 });
    }
  },
  P: {
    name: 'Wild at Heart', type: 'Attack / Armor / Lifesteal / Control',
    v: { hp: .18, lifesteal: .16, reflect: .42 }, p: { guardMax: 5 },
    desc: (S, P) => `<span class="sk-pas">Eclipse gains <em>+${pcn(S.hp * 100)}%</em> Max HP and <em>+${pcn(S.lifesteal * 100)}%</em> Lifesteal. Critical strikes build 1 Amplification and heal for 3.5% missing HP. Incoming Skill hits build <b>Backstage Guard</b>; at ${P.guardMax} stacks, prepares a <b>Reversal</b> that reflects <em>${pcn(S.reflect * 100)}%</em> damage and knocks the attacker back 75px. Scoring a KO heals Eclipse for 10% Max HP, grants +25% Attack, and awards 1 Amp. At Full Volume, she can spend 2 Amp to instantly cancel and counter a Stun!</span>`,
    passive(u, B, S) {
      u.flat.hpPqom = S.hp; u.flat.healRecvqom = S.lifesteal; u.dirty = true;
      B.on(u, 'dealDamage', ev => {
        if (!ev.crit || ev.dot || ev.reflected) return;
        qomEclipseAmp(u, B, 1);
        B.heal(u, u, (u.max.hp - u.hp) * .035);
      });
      B.on(u, 'damaged', ev => {
        if (u._qomReversalReady && ev.src && !ev.reflected) {
          u._qomReversalReady = false;
          B.damage(u, ev.src, ev.amount * S.reflect, { type: 'magic', reflected: true, tag: 'Reversal' });
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
    name: 'Final Encore', type: 'Physical / Magic / Shield / Control',
    v: { atk: .18, critDmg: .25, echoRatio: .42 }, p: { ampCap: 15 },
    desc: (S, P) => `<span class="sk-pas">Eclipse permanently gains <em>+${pcn(S.atk * 100)}%</em> Attack, <em>+${pcn(S.critDmg * 100)}%</em> Crit Damage, and +8% Max HP. Amplification cap increases to ${P.ampCap}. At 12+ Amp, soundwaves inflict <b>Grief</b> (-40% healing). At 14+ Amp, critical hits refund 5 Energy and 0.35s Cooldown. At 15 Amp (<b>HEADLINER</b>), basic attacks deal +22% bonus damage to low-HP foes, and taking a major Skill hit absorbs 50% into a 6s shield. Low HP (&lt;60%) unleashes the once-per-wave <b>Final Solo</b>: untargetable, 4 full-team soundwaves, defense shred, finished by a devastating leaping claw strike!</span>`,
    passive(u, B, S) {
      u.flat.atkPqom = S.atk; u.flat.critDmgqom = S.critDmg; u.flat.hpPqomR = .08; u.dirty = true;
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
        qomEclipseWave(u, B, S.echoRatio, 'Headliner KO'); B.energy(u, 12);
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
