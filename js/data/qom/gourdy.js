'use strict';

function qomDrumBeat(u, B) {
  if (!u.alive) return [];
  const beat = u._qomBeat = (u._qomBeat || 0) % 4 + 1;
  const strength = 1 + qomStacks(u, 'qom_encore') * .07;
  qomShow(B, 'beat', u, null, { beat });
  const interrupted = [];
  if (beat === 1) qomAllies(B, u).forEach(a => B.energy(a, Math.round(6 * strength)));
  if (beat === 2) qomFoes(B, u).forEach(e => B.applyStatus(u, e, 'armslow', 3.5));
  if (beat === 3) qomAllies(B, u).forEach(a => B.reduceCd(a, .55 * strength));
  if (beat !== 4) {
    Sound.play('qom_snare', { vol: beat === 1 ? .34 : .24, rate: .94 + beat * .05, throttle: 150 });
    return interrupted;
  }

  Sound.play('qom_crash', { vol: .5, throttle: 320 });
  qomWave(B, u, .55 * strength, 'magic', 'Fourth Beat');
  qomFoes(B, u).forEach(e => {
    if (e.casting) { interrupted.push(e); B.interrupt(e); }
  });
  B.applyStatus(u, u, 'qom_encore', 999);
  u._qomMeasures = (u._qomMeasures || 0) + 1;

  if (u.rarity >= 5) {
    const allies = qomAllies(B, u);
    const low = allies.filter(a => a.hpPct < .5).sort((a, b) => a.hpPct - b.hpPct);
    const charged = qomTop(qomFoes(B, u), 'energy');
    if (low.length) low.slice(0, 2).forEach(a => B.shield(u, a, u.max.hp * .15, 6));
    else if (charged && charged.energy >= 70) {
      B.energy(charged, -16); B.applyStatus(u, charged, 'silence', .9);
    } else allies.forEach(a => { B.applyStatus(u, a, 'atkup', 4); B.applyStatus(u, a, 'haste', 4); });
    if (u._qomMeasures >= 4 && !u._qomFinalChorus) {
      u._qomFinalChorus = true;
      B.after(.12, () => qomDrumChorus(u, B, true));
    }
  }
  return interrupted;
}

function qomDrumChorus(u, B, final) {
  if (!u.alive) return;
  const interrupted = new Set();
  const cadence = final ? .18 : .23;
  qomShow(B, final ? 'finalChorus' : 'chorus', u);
  Sound.play('qom_crash', { vol: final ? .58 : .45, throttle: 500 });
  qomAllies(B, u).forEach(a => { B.applyStatus(u, a, 'haste', final ? 11 : 7); B.applyStatus(u, a, 'speedup', final ? 8 : 6); });
  B.repeat(8, cadence, i => {
    if (!u.alive) return;
    qomDrumBeat(u, B).forEach(e => interrupted.add(e));
    if (final) {
      qomAllies(B, u).forEach(a => B.reduceCd(a, .85));
      qomFoes(B, u).forEach(e => { B.applyStatus(u, e, 'armslow', 2.5); B.applyStatus(u, e, 'qom_offbeat', 2.5); });
      if (i === 3 || i === 7) {
        qomWave(B, u, .58, 'magic', 'Final Chorus');
        qomFoes(B, u).forEach(e => { if (e.casting) { interrupted.add(e); B.interrupt(e); B.energy(e, -18); } });
      }
    } else {
      qomWave(B, u, .22, 'magic', 'Chorus Measure');
      qomFoes(B, u).forEach(e => { if (e.casting) { interrupted.add(e); B.energy(e, -10); } });
    }
  });
  B.after(8 * cadence + .03, () => {
    if (!u.alive) return;
    if (final) qomAllies(B, u).forEach(a => B.applyStatus(u, a, 'haste', 7));
    else interrupted.forEach(e => { if (e.alive) B.applyStatus(u, e, 'stun', 1.2); });
    qomShow(B, 'chorus', u);
  });
}

QOM_GOURDY.skills = {
  W: {
    name: 'Queens of Mischief', type: 'Magic Damage / Control / Support', energy: 100,
    v: { ratio: .55 }, p: { beat: 1.12 },
    desc: () => 'Gourdy continuously plays four beats: Energy, enemy Attack Speed down, allied cooldown recovery, then a damaging cymbal crash that interrupts Skills. Each measure builds Encore. Active: two fast measures strengthen allies and punish interrupted enemies.',
    passive(u, B, S, P) {
      u._qomBeat = 0; u._qomMeasures = 0;
      B.every(u, P.beat, () => qomDrumBeat(u, B));
      B.on(u, 'allyCast', ally => {
        if (!ally || !ally.alive || B.t < (ally._qomTreatBeatAt || 0)) return;
        if (!ally.statuses.some(s => s.id.startsWith('qom_') && ['qom_sweet_surprise', 'qom_sugar_rush', 'qom_candy_coating', 'qom_second_helping'].includes(s.id))) return;
        ally._qomTreatBeatAt = B.t + .65;
        qomDrumBeat(u, B);
      });
    },
    cast(u, B) { B.anim(u, 'cast', 1.8); qomDrumChorus(u, B, false); }
  },
  G: {
    name: 'Out of Tune', type: 'Magic Damage / Control', cd: 11, v: { ratio: 1.05 }, p: { dur: 6 },
    desc: () => 'Enemies lose Skill Haste and attack irregularly. Their first Skill during the effect is delayed by a snare hit that strips a removable buff and reduces their Healing Received; Tricked targets also lose Energy.',
    cast(u, B, S, P) {
      qomShow(B, 'snare', u);
      qomFoes(B, u).forEach(e => B.applyStatus(u, e, 'qom_offbeat', P.dur));
      const stop = B.on(u, 'enemySkillStarting', start => {
        const e = start.unit;
        if (!e || !e.hasStatus('qom_offbeat') || B.t < (e._qomSnaredUntil || 0)) return;
        e._qomSnaredUntil = B.t + P.dur;
        start.delay = Math.max(start.delay || 0, .6);
        B.damage(u, e, u.st.mag * S.ratio, { type: 'magic', tag: 'Out of Tune' });
        B.dispel(e, 1);
        B.applyStatus(u, e, 'grief', 3.5);
        if (e.hasStatus('qom_trick')) B.energy(e, -15);
        qomShow(B, 'snare', u, e);
        Sound.play('qom_snare', { vol: .6, rate: .85 });
      });
      Sound.play('qom_snare', { vol: .55 });
      B.after(P.dur, stop);
    }
  },
  B: {
    name: 'Trick or Treat!', type: 'Support / Control', cd: 10, v: { shield: .20 }, p: { dur: 8 },
    desc: () => 'Two allies with the least Energy each receive one of four distinct Treats. The highest-Energy foe is Tricked; a treated ally casting a Skill advances Gourdy’s drum beat.',
    cast(u, B, S, P) {
      const allies = qomAllies(B, u).sort((a, b) => a.energy - b.energy).slice(0, 2);
      allies.forEach(a => {
        const roll = Math.floor(Math.random() * 4);
        const id = ['qom_sweet_surprise', 'qom_sugar_rush', 'qom_candy_coating', 'qom_second_helping'][roll];
        B.applyStatus(u, a, id, P.dur);
        if (roll === 1) B.energy(a, 18);
        if (roll === 2) B.shield(u, a, u.max.hp * S.shield, P.dur);
        if (roll === 3) B.reduceCd(a, 3.5);
        qomShow(B, 'candy', u, a);
      });
      const foe = qomTop(qomFoes(B, u), 'energy');
      if (foe) { B.applyStatus(u, foe, 'qom_trick', P.dur); qomShow(B, 'trick', u, foe); }
      Sound.play('qom_candy', { vol: .62 });
    }
  },
  P: {
    name: 'Keep the Beat', type: 'Support / Control', v: { haste: .10 }, p: {},
    desc: () => 'The drums continue through control. Skills started on the fourth beat gain power and cooldown recovery; enemy Skills started then deal less damage and lose Energy.',
    passive(u, B, S) {
      u.flat.cdrqomP = (S && S.haste) || .10; u.dirty = true;
      B.on(u, 'allySkillStarting', start => {
        if (u._qomBeat !== 4 || !start.unit) return;
        const ally = start.unit;
        B.applyStatus(u, ally, 'qom_onbeat', 1.5);
        B.reduceCd(ally, 1.25);
        B.energy(u, 5);
        qomShow(B, 'beat', u, ally, { beat: 4 });
      });
      B.on(u, 'enemySkillStarting', start => {
        if (u._qomBeat !== 4 || !start.unit) return;
        B.applyStatus(u, start.unit, 'qom_offbeat_skill', 1.5);
        B.energy(u, 5);
        B.after(.02, () => { if (start.unit.alive) B.energy(start.unit, -14); });
      });
    }
  },
  R: {
    name: 'One Last Encore', type: 'Support / Control / Magic Damage', v: { mag: .12 }, p: {},
    desc: () => 'The fourth beat adapts to wounded allies, charged enemies, or a healthy team. After four measures, Final Chorus runs at eight rapid beats, accelerating allied Skills and disrupting the enemy team.',
    passive(u) { u.flat.magPqom = .12; u.flat.cdrqom = .12; u.dirty = true; }
  }
};
