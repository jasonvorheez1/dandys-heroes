'use strict';

function qomDrumBeat(u, B, fast) {
  if (!u.alive) return [];
  const beat = u._qomBeat = (u._qomBeat || 0) % 4 + 1;
  const encoreStacks = qomStacks(u, 'qom_encore');
  const bandBoost = qomAllies(B, u).some(a => a !== u && (a.id.startsWith('QOM') || a.id.includes('Holloway'))) ? 1.10 : 1.0;
  const finalPower = (1 + encoreStacks * 0.05) * bandBoost;
  qomShow(B, 'beat', u, null, { beat });
  if (B.fxQomDrum) B.fxQomDrum(u.x, u.y, beat, finalPower);
  const interrupted = [];

  if (beat === 1) {
    Sound.play('powerline_beat1', { vol: .5, throttle: 180 });
    qomAllies(B, u).forEach(a => {
      B.energy(a, Math.round(6 * finalPower));
      B.shield(u, a, u.max.hp * .045 * finalPower, 5);
    });
  }
  if (beat === 2) {
    Sound.play('powerline_beat2', { vol: .5, throttle: 180 });
    qomFoes(B, u).forEach(e => {
      B.applyStatus(u, e, 'armslow', 4);
      B.applyStatus(u, e, 'magdown', 4);
    });
  }
  if (beat === 3) {
    Sound.play('qom_bone', { vol: .48, throttle: 180 });
    qomAllies(B, u).forEach(a => {
      B.reduceCd(a, .35 * finalPower);
      B.applyStatus(u, a, 'haste', 4);
    });
    const low = qomLow(qomAllies(B, u));
    if (low) B.heal(u, low, u.st.mag * .35 * finalPower);
  }
  if (beat === 4) {
    Sound.play('qom_crash', { vol: .75, throttle: 220 });
    Sound.play('drum_hit', { vol: .6, throttle: 220 });
    qomWave(B, u, (u._qomDrumRatio || .85) * finalPower, 'magic', 'Fourth Beat Crash');
    qomFoes(B, u).forEach(e => {
      if (e.casting) { interrupted.push(e); B.interrupt(e); }
      B.knockback(u, e, 45);
    });
    B.applyStatus(u, u, 'qom_encore', 999);
    u._qomMeasures = (u._qomMeasures || 0) + 1;

    if (encoreStacks >= 4) {
      qomFoes(B, u).forEach(e => B.applyStatus(u, e, 'blind', 2));
    }
    if (encoreStacks >= 8) {
      qomWave(B, u, (u._qomDrumRatio || .85) * .25 * finalPower, 'magic', 'Encore Echo');
    }

    if (u.rarity >= 5) {
      const allies = qomAllies(B, u);
      const low = allies.filter(a => a.hpPct < .5).sort((a, b) => a.hpPct - b.hpPct);
      const charged = qomTop(qomFoes(B, u), 'energy');
      if (low.length) {
        low.slice(0, 2).forEach(a => B.shield(u, a, u.max.hp * .15, 6));
      } else if (charged && charged.energy >= 65) {
        B.energy(charged, -16);
        B.applyStatus(u, charged, 'silence', 1.0);
      } else {
        allies.forEach(a => B.applyStatus(u, a, 'qom_treat', 5));
      }
      if (u._qomMeasures >= 4 && !u._qomFinalChorus) {
        u._qomFinalChorus = true;
        B.after(.1, () => qomDrumChorus(u, B, true));
      }
    }
  }
  return interrupted;
}

function qomDrumChorus(u, B, final) {
  if (!u.alive) return;
  const interrupted = new Set();
  const cadence = final ? .18 : .22;
  qomShow(B, final ? 'finalChorus' : 'chorus', u);
  Sound.play('qom_crash', { vol: final ? .85 : .65, throttle: 350 });
  qomAllies(B, u).forEach(a => {
    B.applyStatus(u, a, 'haste', final ? 14 : 8);
    B.applyStatus(u, a, 'speedup', final ? 10 : 6);
  });
  if (final) {
    qomAllies(B, u).forEach(a => B.applyStatus(u, a, 'ward', 3));
    B.fxFloatIcon(u.x, u.y - 120, 'GRAND STADIUM FINALE', '#f4ffd9');
  }

  B.repeat(8, cadence, i => {
    if (!u.alive) return;
    qomDrumBeat(u, B, true).forEach(e => interrupted.add(e));
    if (final && (i === 3 || i === 7)) {
      qomWave(B, u, (u._qomDrumRatio || .85) * 1.0, 'magic', 'Grand Finale Blast');
      qomFoes(B, u).forEach(e => {
        if (e.casting) { interrupted.add(e); B.interrupt(e); }
        B.applyStatus(u, e, 'stun', 1.0);
        B.energy(e, -18);
      });
    }
  });

  if (final) {
    B.after(2.2, () => {
      if (!u.alive) return;
      qomAllies(B, u).forEach(a => {
        B.applyStatus(u, a, 'haste', 8);
        B.applyStatus(u, a, 'overcharge', 8);
        if (u._qomFinalShield) B.shield(u, a, u.max.hp * u._qomFinalShield, 7);
      });
    });
  } else {
    B.after(8 * cadence + .04, () => {
      if (!u.alive) return;
      interrupted.forEach(e => { if (e.alive) B.applyStatus(u, e, 'stun', 1.2); });
      qomShow(B, 'chorus', u);
    });
  }
}

QOM_GOURDY.basic.note = 'Strikes with drumsticks and sound orbs. Every 2nd basic attack unleashes an acoustic Bass Drop that shields the lowest-HP ally and grants them Energy.';
QOM_GOURDY.basic.onHit = (u, target, B) => {
  if (!target || !target.alive) return;
  u._qomGourdyBasics = (u._qomGourdyBasics || 0) + 1;
  if (u._qomGourdyBasics % 2 === 0) {
    const ally = qomLow(qomAllies(B, u)) || u;
    const shieldVal = u.max.hp * .055 + u.st.mag * .20;
    B.shield(u, ally, shieldVal, 5.0);
    B.energy(ally, 8);
    Sound.play('qom_snare', { vol: .45, throttle: 180 });
    B.fxSparkle(ally.x, ally.y - 45, 6, '#bcf87b');
    B.fxFloatIcon(ally.x, ally.y - 100, '🥁 BASS SHIELD +8⚡', '#bcf87b');
  }
};

QOM_GOURDY.skills = {
  W: {
    name: 'Queens of Mischief', type: 'Magic Damage / Control / Support', energy: 100,
    v: { ratio: .58, haste: .35 }, p: { beat: 1.30, encoreMax: 8 }, fixedP: ['encoreMax'],
    desc: (S, P) => `<span class="sk-pas">Passive: Gourdy's four-beat drum measure powers the concert every <em>${(P && P.beat != null ? Number(P.beat).toFixed(2) : '1.30')}s</em> (even through control).<br>
• <b>Beat 1 (Bass)</b>: All allies gain <em>6+</em> Energy and a 🛡️ Bass Shield for 5s.<br>
• <b>Beat 2 (Hi-Hat)</b>: Enemies suffer -25% Attack Speed and -30% Magic Defense for 4s.<br>
• <b>Beat 3 (Tom)</b>: All allies gain +30% Haste, 0.35s Cooldown Refund, and the lowest ally is healed.<br>
• <b>Beat 4 (Crash)</b>: Deals <em>${pcn(S.ratio * 100)}%</em> area Magic Damage, interrupts casting, knocks foes back, and stacks 💥 Encore (+5% beat power, max ${P.encoreMax}). At 4+ Encore, Beat 4 Blinds for 2s; at 8, it echoes. Bandmates increase beat potency by 10%.</span><br>
Active: Gourdy unleashes an eight-beat, double-tempo drum solo. Crash beats strike and knock back enemies while the band gains Haste and Move Speed.`,
    passive(u, B, S, P) {
      u._qomBeat = 0; u._qomMeasures = 0;
      u._qomDrumRatio = S.ratio;
      u.immovable = true;
      B.applyStatus(u, u, 'planted', 999);
      B.every(u, P.beat, () => qomDrumBeat(u, B));
      B.on(u, 'allyCast', ally => {
        if (!ally || !ally.alive || B.t < (u._qomTreatBeatAt || 0)) return;
        if (!ally.statuses.some(s => s.id.startsWith('qom_') && ['qom_treat', 'qom_sweet_surprise', 'qom_sugar_rush', 'qom_candy_coating', 'qom_second_helping'].includes(s.id))) return;
        u._qomTreatBeatAt = B.t + 1.8;
        qomDrumBeat(u, B);
      });
    },
    cast(u, B) { B.anim(u, 'cast', 1.8); qomDrumChorus(u, B, false); }
  },
  G: {
    name: 'Out of Tune', type: 'Magic Damage / Control', cd: 10, v: { ratio: 1.35, mdefDown: .30 }, p: { dur: 7 },
    desc: (S, P) => `Alters concert tempo for ${P.dur}s, inflicting <b>Offbeat</b> on all enemies. Whenever an Offbeat enemy begins casting a Skill, screeching feedback strikes them for <em>${pcn(S.ratio * 100)}%</em> Magic Damage, interrupts their Skill, burns 20 Energy, and shreds Magic Defense by <em>${pcn(S.mdefDown * 100)}%</em> for 5s. If the enemy is <b>Tricked</b>, they are also Silenced for 1.2s.`,
    cast(u, B, S, P) {
      qomShow(B, 'snare', u);
      qomFoes(B, u).forEach(e => B.applyStatus(u, e, 'qom_offbeat', P.dur));
      const stop = B.on(u, 'enemySkillStarting', start => {
        const e = start.unit;
        if (!e || !e.hasStatus('qom_offbeat') || B.t < (e._qomSnaredUntil || 0)) return;
        e._qomSnaredUntil = B.t + P.dur;
        start.delay = Math.max(start.delay || 0, .6);
        B.damage(u, e, u.st.mag * S.ratio, { type: 'magic', tag: 'Out of Tune Feedback' });
        B.interrupt(e);
        B.energy(e, -20);
        B.applyStatus(u, e, 'magdown', 5);
        if (e.hasStatus('qom_trick')) B.applyStatus(u, e, 'silence', 1.2);
        qomShow(B, 'snare', u, e);
        Sound.play('qom_crash', { vol: .45 });
        Sound.play('qom_riff', { vol: .4 });
      });
      Sound.play('qom_crash', { vol: .45 });
      Sound.play('qom_riff', { vol: .4 });
      B.after(P.dur, stop);
    }
  },
  B: {
    name: 'Trick or Treat!', type: 'Support / Shield / Control', cd: 9, v: { shield: .25, atkBonus: .25 }, p: { dur: 8, silence: 2.0 },
    desc: (S, P) => `Throws glowing VIP passes and rock candies to the 2 lowest-HP or lowest-Energy allies. Each gains a 🛡️ Sound Shield (<em>${pcn(S.shield * 100)}% Max HP</em>), <em>+${pcn(S.atkBonus * 100)}%</em> Attack & Magic, Ward (-30% damage taken), and a <b>Treat</b> buff for ${P.dur}s. A protected ally's Skill triggers an extra Drum Beat, at most once every 1.8s. In addition, the highest-Energy foe is <b>Tricked</b>, drained of 15 Energy, and Silenced for ${P.silence}s.`,
    cast(u, B, S, P) {
      const allies = qomAllies(B, u).sort((a, b) => (a.hpPct + a.energy / 100) - (b.hpPct + b.energy / 100)).slice(0, 2);
      allies.forEach(a => {
        B.applyStatus(u, a, 'qom_treat', P.dur);
        B.shield(u, a, u.max.hp * S.shield, P.dur);
        B.applyStatus(u, a, 'ward', 5);
        B.applyStatus(u, a, 'atkup', P.dur);
        const roll = Math.floor(Math.random() * 4);
        if (roll === 0) B.applyStatus(u, a, 'speedup', P.dur);
        else if (roll === 1) { B.applyStatus(u, a, 'haste', P.dur); B.energy(a, 20); }
        else if (roll === 2) B.applyStatus(u, a, 'fortify', P.dur);
        else B.reduceCd(a, 3.0);
        B.fxFloatIcon(a.x, a.y - 90, '🎟🍬', '#c6fb7b');
        qomShow(B, 'candy', u, a);
      });
      const foe = qomTop(qomFoes(B, u), 'energy');
      if (foe) {
        B.applyStatus(u, foe, 'qom_trick', P.dur);
        B.applyStatus(u, foe, 'silence', P.silence);
        B.energy(foe, -15);
        qomShow(B, 'trick', u, foe);
      }
      Sound.play('qom_guard', { vol: .48 });
    }
  },
  P: {
    name: 'Keep the Beat', type: 'Support / Control / Teamwork', v: { haste: .15, energy: 5, power: .25 }, p: { cdRefund: 1.5 },
    desc: (S, P) => `<span class="sk-pas">The rock rhythm continues uninterrupted through crowd control. Gourdy gains Skill Haste. Allied Skills started on Beat 4 gain On Beat damage, a ${P.cdRefund}s Cooldown Refund, and Energy. Enemy Skills attempted on Beat 4 backfire: their caster loses 15 Energy and suffers Weaken for 5s. QOM bandmates and Holloway family members increase drum beat potency by 10%.</span>`,
    passive(u, B, S) {
      u.flat.cdrqomP = Math.min(.22, .10 + S.haste * .2); u.dirty = true;
      B.on(u, 'allySkillStarting', start => {
        if (u._qomBeat !== 4 || !start.unit) return;
        const ally = start.unit;
        B.applyStatus(u, ally, 'qom_onbeat', 1.5);
        B.reduceCd(ally, 1.5);
        B.energy(ally, Math.round(S.energy + 4));
        B.energy(u, 8);
        qomShow(B, 'beat', u, ally, { beat: 4 });
      });
      B.on(u, 'enemySkillStarting', start => {
        if (u._qomBeat !== 4 || !start.unit) return;
        B.applyStatus(u, start.unit, 'qom_offbeat_skill', 1.5);
        B.applyStatus(u, start.unit, 'weaken', 5);
        B.energy(u, 8);
        B.after(.02, () => { if (start.unit.alive) B.energy(start.unit, -15); });
      });
    }
  },
  R: {
    name: 'One Last Encore', type: 'Support / Magic Damage / Ultimate', v: { mag: .15, shield: .15, overcharge: .35 }, p: { measures: 4 }, fixedP: ['measures'],
    desc: (S, P) => `<span class="sk-pas">Gourdy permanently gains <em>+${pcn(S.mag * 100)}%</em> Magic Attack and +10% Cooldown Reduction. Beat 4 dynamically adapts: grants emergency shields (<em>${pcn(S.shield * 100)}% Max HP</em>) to wounded allies (<50% HP), silences high-energy foes (>=65 Energy), or showers healthy allies with Treats. After ${P.measures} completed measures, once per battle, unleashes the <b>Grand Stadium Finale</b>: a double-tempo drum storm granting team Ward, Overcharge, Haste, and a stadium explosion!</span>`,
    passive(u, B, S) {
      u.flat.magPqom = S.mag;
      u.flat.cdrqom = .10;
      u._qomFinalShield = S.shield;
      u.dirty = true;
      B.on(u, 'allyBasic', () => {
        if (u._qomBeat !== 4) return;
        const allies = qomAllies(B, u);
        if (allies.some(a => a.hpPct < .5)) allies.sort((a, b) => a.hpPct - b.hpPct).slice(0, 2).forEach(a => B.shield(u, a, u.max.hp * .15, 6));
        else allies.forEach(a => B.applyStatus(u, a, 'qom_treat', 4));
        const e = qomTop(qomFoes(B, u), 'energy');
        if (e && e.energy >= 65) B.energy(e, -15);
      });
    }
  }
};
