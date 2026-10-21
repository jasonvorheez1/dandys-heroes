'use strict';

function qomConnieNotes(u, B, amount) {
  const have = qomStacks(u, 'qom_notes');
  if (have < 8) B.applyStatus(u, u, 'qom_notes', 999, { stacks: Math.min(amount, 8 - have) });
  if (have < 8 && qomStacks(u, 'qom_notes') >= 8) { qomMark(u, B, 'SPECTRAL HEADLINER', '#e7b7ff'); qomShow(B, 'phantom', u); }
}

function qomConnieCounter(u, B, source) {
  if (!u.alive || !source || !source.alive) return;
  const recent = u._qomLastDodgeAt != null && B.t - u._qomLastDodgeAt < 5;
  u._qomLastDodgeAt = B.t;
  B.blink(u, source.x - u.face * 22, source.depth);
  B.damage(u, source, u.st.mag * .8, { type: 'magic', tag: 'Phantom Counter' });
  B.applyStatus(u, source, 'qom_haunted', 7);
  if (recent) qomFoes(B, u).filter(e => e !== source && B.distance(e, source) < 175)
    .forEach(e => B.damage(u, e, u.st.mag * .43, { type: 'magic', area: true, tag: 'Phantom Counter' }));
  if (u.hasStatus('qom_untouchable')) B.heal(u, u, u.max.hp * .05);
  qomShow(B, 'counter', u, source);
}

function qomConnieSolo(u, B, S, spent, ovation) {
  if (!u.alive) return;
  const foes = qomFoes(B, u);
  if (foes.length) B.blink(u, B.avgX(foes), foes[0].depth);
  qomShow(B, ovation ? 'finale' : 'phantom', u);
  B.repeat(5, .23, i => {
    if (!u.alive) return;
    qomFoes(B, u).forEach(e => {
      const ratio = S.ratio * (1 + spent * .12) + (i === 4 ? (1 - e.hpPct) * .9 : 0);
      B.damage(u, e, u.st.mag * ratio, { type: 'magic', area: true, tag: i === 4 ? 'Phantom Final Chord' : 'Phantom Solo' });
      if (!e.alive) return;
      if (i === 0) B.applyStatus(u, e, 'defdown', 6);
      if (i === 1) B.applyStatus(u, e, 'magdown', 6);
      if (i === 2) B.energy(e, -15);
      if (i === 3) B.applyStatus(u, e, 'qom_haunted', 7);
      if (i === 4 && spent >= 5) B.applyStatus(u, e, 'stun', 2);
    });
    qomShow(B, i === 4 ? 'finale' : 'phantom', u);
  });
  B.after(1.24, () => {
    if (!u.alive) return;
    if (spent >= 5) B.heal(u, u, (u.max.hp - u.hp) * .20);
    if (ovation) {
      const targets = qomFoes(B, u);
      B.repeat(2, .18, () => { if (u.alive) qomWave(B, u, .55, 'magic', 'Ghostly Ovation', e => B.applyStatus(u, e, 'qom_haunted', 6)); });
      B.after(.42, () => {
        if (!u.alive) return;
        qomWave(B, u, 1.7, 'magic', 'Ghostly Finale', e => B.applyStatus(u, e, 'stun', 1.3));
        B.shield(u, u, u.max.hp * (.08 + targets.length * .04), 7);
        qomConnieNotes(u, B, 4);
        B.applyStatus(u, u, 'qom_headliner', 6);
        qomShow(B, 'finale', u);
      });
    } else B.removeStatus(u, 'untargetable');
  });
  if (ovation) B.after(1.8, () => { if (u.alive) B.removeStatus(u, 'untargetable'); });
}

QOM_CONnie.basic.onHit = (u, target, B) => {
  // AI.resolveBasic already alternates physical guitar strikes and Magic notes.
  if (u._qomBasicType === 'magic' && target.alive) qomShow(B, 'phantom', u, target);
};

QOM_CONnie.skills = {
  W: {
    name: 'Queens of Mischief', type: 'Magic / Physical / Control', energy: 100,
    v: { ratio: .68 }, p: {},
    desc: () => 'Connie starts with three Phantom Notes. Her Basics alternate guitar strikes and spectral soundwaves; every third Basic and every Dodge builds Notes, each increasing Evasion. Active: vanishes, then sends five supernatural waves that reduce defenses, Energy, Accuracy, and finally punish missing HP. Spending five Notes Stuns and heals.',
    passive(u, B) {
      qomConnieNotes(u, B, 3);
      u._qomBasicCount = 0;
      B.on(u, 'basicHit', () => { if (++u._qomBasicCount % 3 === 0) qomConnieNotes(u, B, 1); });
      B.on(u, 'dodged', ev => {
        qomConnieNotes(u, B, u.hasStatus('qom_untouchable') ? 2 : 1);
        if (ev.src && ev.src.alive) B.damage(u, ev.src, u.st.mag * .38, { type: 'magic', tag: 'Phantom Note' });
      });
      B.on(u, 'enemyCast', enemy => {
        if (enemy.hasStatus('qom_possessed')) {
          B.damage(u, enemy, u.st.mag * .55, { type: 'magic', tag: 'Possessed Skill' });
          qomShow(B, 'possess', u, enemy);
        }
      });
      B.on(u, 'dealDamage', ev => {
        if (!ev.target || !ev.target.hasStatus('qom_possessed') || B.t < (u._qomPossessEnergyAt || 0)) return;
        u._qomPossessEnergyAt = B.t + 1.1;
        B.energy(u, 5); qomConnieNotes(u, B, 1);
      });
      B.on(u, 'enemyDown', enemy => {
        const possession = enemy.getStatus('qom_possessed');
        if (!possession || possession.src !== u) return;
        const next = qomTop(qomFoes(B, u), 'energy');
        if (next) { B.applyStatus(u, next, 'qom_possessed', possession.t); qomShow(B, 'possess', u, next); }
      });
    },
    cast(u, B, S) {
      const headliner = qomStacks(u, 'qom_notes') >= 8;
      const spent = qomSpend(B, u, 'qom_notes', 5);
      const ovation = u.rarity >= 5 && headliner && !u._qomGhostlyOvation;
      if (ovation) {
        u._qomGhostlyOvation = true;
        qomAllies(B, u).forEach(a => B.applyStatus(u, a, 'qom_ovation_buff', 10));
        qomMark(u, B, 'GHOSTLY OVATION', '#e7b8ff');
      }
      B.applyStatus(u, u, 'untargetable', ovation ? 4 : 3.5);
      qomShow(B, 'vanish', u);
      B.after(2, () => qomConnieSolo(u, B, S, spent, ovation));
      Sound.play('qom_ghost', { vol: .49 });
    }
  },
  G: {
    name: 'Haunting Escape', type: 'Evasion / Magic / Control', cd: 11,
    v: { ratio: 1.65 }, p: { dur: 4 },
    desc: () => 'Connie vanishes for four seconds with Speed and Haste, leaving an attackable Phantom Guitar that feeds her Notes. She reappears behind the strongest attacker to Haunt them. At five Notes, she spends two for an extra Energy-draining, Silencing strike.',
    cast(u, B, S, P) {
      B.applyStatus(u, u, 'untargetable', P.dur);
      B.applyStatus(u, u, 'speedup', P.dur);
      B.applyStatus(u, u, 'haste', P.dur);
      qomShow(B, 'vanish', u);
      const decoy = B.summon(u, {
        protoId: 'QOMConnie', name: 'Phantom Guitar', art: Art.hero('QOMConnie'), scale: .55,
        hp: Math.max(1, u.max.hp * .22), atk: 0, mag: 0, def: u.st.def * .6, mdef: u.st.mdef * .6,
        noEnergy: true, noSkills: true, life: P.dur, tint: '#ddaeff'
      });
      if (decoy) B.on(decoy, 'damaged', ev => { if (u.alive && ev.src && ev.src.team !== u.team) qomConnieNotes(u, B, 1); });
      B.after(P.dur, () => {
        if (!u.alive) return;
        B.removeStatus(u, 'untargetable');
        if (decoy && decoy.alive) B.kill(decoy);
        const target = qomTop(qomFoes(B, u), 'atk'); if (!target) return;
        B.blink(u, target.x - u.face * 24, target.depth);
        B.damage(u, target, u.st.mag * S.ratio, { type: 'magic', tag: 'Haunting Escape' });
        B.applyStatus(u, target, 'qom_haunted', 8);
        qomShow(B, 'counter', u, target);
        if (qomStacks(u, 'qom_notes') >= 5) {
          qomSpend(B, u, 'qom_notes', 2);
          B.damage(u, target, u.st.mag * .85, { type: 'magic', tag: 'Phantom Strike' });
          B.energy(target, -20);
          B.applyStatus(u, target, 'silence', 1.4);
        }
      });
      Sound.play('qom_ghost', { vol: .42 });
    }
  },
  B: {
    name: 'Possessed Performance', type: 'Magic / Control / Support', cd: 12,
    v: { ratio: 1.25 }, p: { dur: 6 },
    desc: () => 'A spectral copy Possesses the highest-Skill-Power foe, slowing their attacks and Skills. Their Skills trigger ghostly damage. Connie can burst the possessed weapon and, with six Notes, extend the effect and steal a removable buff for her weakest ally.',
    cast(u, B, S, P) {
      const target = qomTop(qomFoes(B, u), 'mag'); if (!target) return;
      const extended = qomStacks(u, 'qom_notes') >= 6;
      if (extended) qomSpend(B, u, 'qom_notes', 3);
      B.applyStatus(u, target, 'qom_possessed', P.dur + (extended ? 3 : 0));
      B.damage(u, target, u.st.mag * S.ratio, { type: 'magic', tag: 'Possessed Performance' });
      qomShow(B, 'possess', u, target);
      B.after(.28, () => {
        if (!u.alive || !target.alive) return;
        [target, ...qomFoes(B, u).filter(e => e !== target && B.distance(e, target) < 180)].forEach(e => {
          B.damage(u, e, u.st.mag * .52, { type: 'magic', area: true, tag: 'Ghostly Feedback' });
          if (e.casting) B.interrupt(e);
        });
        qomShow(B, 'feedback', u, target);
      });
      if (extended) {
        const buff = target.statuses.find(s => STATUS[s.id] && STATUS[s.id].kind === 'buff' && s.id !== 'shield' && !s.apexLocked);
        const ally = qomLow(qomAllies(B, u));
        if (buff && ally && B.removeStatus(target, buff.id)) B.applyStatus(u, ally, buff.id, Math.min(6, buff.t));
      }
      Sound.play('qom_ghost', { vol: .42 });
    }
  },
  P: {
    name: "Can't Hit a Ghost", type: 'Evasion / Magic / Control', v: { eva: .20 }, p: {},
    desc: () => 'Every six seconds a Basic can phase through Connie; she teleports behind its source and counters with Haunted. A recent Dodge makes the counter splash. Three Dodges trigger Untouchable for stronger Evasion, double Notes, and healing counters.',
    passive(u, B, S) {
      u.flat.evaPqom = S.eva; u.dirty = true;
      u.dodgeGuard = ev => {
        if (!ev.basic || B.t < (u._qomPhaseAt || 0)) return false;
        u._qomPhaseAt = B.t + 6;
        return true;
      };
      B.on(u, 'dodged', ev => {
        if (!ev.src || !ev.src.alive) return;
        u._qomDodges = (u._qomDodges || 0) + 1;
        qomConnieCounter(u, B, ev.src);
        if (u._qomDodges >= 3 && B.t >= (u._qomUntouchableAt || 0)) {
          u._qomDodges = 0; u._qomUntouchableAt = B.t + 15;
          B.applyStatus(u, u, 'qom_untouchable', 5);
          qomShow(B, 'vanish', u);
        }
      });
    }
  },
  R: {
    name: 'Grand Finale', type: 'Magic / Control / Support / Evasion', v: { mag: .16 }, p: {},
    desc: () => 'At four, six, and eight Notes Connie gains stronger Skills, counter Energy drain, then Spectral Headliner. Once per wave, using Queens of Mischief at eight Notes grants team buffs and an extended solo with extra waves, a stunning chord, and a Shield.',
    passive(u, B, S) {
      u.flat.magPqom = S.mag; u.flat.critDmgqom = .24; u.dirty = true;
      // Note thresholds: 4 Notes = stronger Skills, 6 = Skill Haste, 8 = Headliner.
      B.every(u, .5, () => {
        const notes = qomStacks(u, 'qom_notes');
        const mag = notes >= 8 ? .16 : notes >= 6 ? .11 : notes >= 4 ? .06 : 0;
        const cdr = notes >= 6 ? .08 : 0;
        if (u.flat.magPqomNotes !== mag || u.flat.cdrqomNotes !== cdr) {
          if (mag > (u.flat.magPqomNotes || 0)) qomShow(B, 'phantom', u);
          u.flat.magPqomNotes = mag; u.flat.cdrqomNotes = cdr; u.dirty = true;
        }
      });
      B.on(u, 'basicHit', ev => {
        if (qomStacks(u, 'qom_notes') < 8 && !u.hasStatus('qom_headliner')) return;
        const other = qomFoes(B, u).find(e => e !== ev.target);
        if (other && Math.random() < .38) B.damage(u, other, u.st.mag * .40, { type: 'magic', tag: 'Spectral Headliner' });
      });
      B.on(u, 'dealDamage', ev => {
        if (ev.tag !== 'Phantom Counter' || !ev.target || qomStacks(u, 'qom_notes') < 6) return;
        ev.armorPen = (ev.armorPen || 0) + .18;
        B.energy(ev.target, -10);
      });
    }
  }
};
