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

QOM_CONnie.basic.note = 'Alternates physical guitar chords and spectral ectoplasm. Every 2nd hit siphons 10 Energy; every 3rd hit or critical strike grants 1 Phantom Note.';
QOM_CONnie.basic.onHit = (u, target, B) => {
  if (!target || !target.alive) return;
  u._qomConnieBasics = (u._qomConnieBasics || 0) + 1;
  if (u._qomBasicType === 'magic' && target.alive) qomShow(B, 'phantom', u, target);
  if (u._qomConnieBasics % 2 === 0) {
    B.energy(target, -10);
    B.energy(u, 10);
    B.fxSparkle(u.x, u.y - 45, 6, '#8cf0da');
    B.fxFloatIcon(u.x, u.y - 100, '👻 +10⚡', '#8cf0da');
  }
};

QOM_CONnie.skills = {
  W: {
    name: 'Queens of Mischief', type: 'Magic / Physical / Control', energy: 100,
    v: { ratio: .75, stunDur: 2.0 }, p: { noteSpend: 5, noteCap: 8 },
    desc: (S, P) => `<span class="sk-pas">Passive: Connie starts combat with 3 👻 <b>Phantom Notes</b> (max ${P && P.noteCap || 8}). Each stored note raises Evasion (+3%), Magic (+2%), and Skill Haste (+1%). Every 3rd basic attack, every dodge, and hits on Possessed foes generate Notes. At 8 Notes, Connie becomes a <b>Spectral Headliner</b>!</span><br>
Active: Connie slips into the Spirit Realm (Untargetable for 3.5s) and spends up to ${P && P.noteSpend || 5} Phantom Notes to unleash 5 consecutive supernatural soundwaves across all foes! Each wave deals <em>${pcn(S.ratio * 100)}%</em> Magic Damage, sequentially shredding Def (-30%), MagDef (-30%), draining 15 Energy, and inflicting <b>Haunted</b> for 7s. Consuming ${P && P.noteSpend || 5} Notes Stuns all foes for <em>${(S && S.stunDur != null ? Number(S.stunDur).toFixed(1) : (P && P.stunDur != null ? Number(P.stunDur).toFixed(1) : '2.0'))}s</em> and heals Connie for 20% missing HP!<br>
• <b>Ghostly Ovation</b> (5-Star & 8 Notes): Queens of Mischief triggers an extended stadium solo! Grants all allies +25% Attack, +35% Move Speed, and Haste for 10s, unleashes 2 extra soundwaves, and finishes with a massive <b>Grand Finale chord</b> (170% Magic Damage, 1.3s Stun, shields Connie, and refunds 4 Notes)!`,
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
    v: { ratio: 1.75, phantomStrike: .95 }, p: { dur: 4 },
    desc: (S, P) => `Connie vanishes for <em>${P.dur}s</em> (Untargetable, +35% Move Speed & Haste), leaving behind an attackable <b>Phantom Guitar decoy</b> (22% Max HP). Attacks hitting the decoy feed Connie Phantom Notes. She reappears behind the highest-Attack foe, dealing <em>${pcn(S.ratio * 100)}% Magic Damage</em> and Haunting them for 8s. Holding 5+ Notes spends 2 to strike a 2nd time (<em>${pcn(S.phantomStrike * 100)}% Mag</em>), burns 20 Energy, and Silences for 1.4s!`,
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
          B.damage(u, target, u.st.mag * S.phantomStrike, { type: 'magic', tag: 'Phantom Strike' });
          B.energy(target, -20);
          B.applyStatus(u, target, 'silence', 1.4);
        }
      });
      Sound.play('qom_ghost', { vol: .42 });
    }
  },
  B: {
    name: 'Possessed Performance', type: 'Magic / Control / Support', cd: 12,
    v: { ratio: 1.35, feedback: .55 }, p: { dur: 6 },
    desc: (S, P) => `A spectral copy Possesses the highest-Magic/Skill-Power enemy for <em>${P.dur}s</em>, slowing their Attack Speed and Skill Haste by 25%. Whenever the possessed enemy attempts to cast a Skill, they take <em>${pcn(S.feedback * 100)}% Magic</em> backlash damage. Connie's damage against the possessed foe generates 5 Energy and 1 Phantom Note. At 6+ Notes, spends 3 to extend the possession by 3s and steals a removable buff for her lowest-HP ally!`,
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
          B.damage(u, e, u.st.mag * S.feedback, { type: 'magic', area: true, tag: 'Ghostly Feedback' });
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
    name: "Can't Hit a Ghost", type: 'Evasion / Magic / Control',
    v: { eva: .25, counterRatio: .85 }, p: { phaseCd: 6.0, dodgesForUntouchable: 3 },
    desc: (S, P) => `<span class="sk-pas">Connie gains <em>+${pcn(S.eva * 100)}%</em> Evasion and +15% Magic Attack. Once every ${(P && P.phaseCd != null ? Number(P.phaseCd).toFixed(1) : '6.0')}s, an enemy basic attack phases cleanly through her without dealing damage. Whenever Connie dodges, she blinks behind the attacker with a <b>Phantom Counter</b> (<em>${pcn(S.counterRatio * 100)}% Magic Damage</em>, Haunted for 7s). A recent dodge causes the counter to splash to nearby foes.<br>
• <b>Untouchable</b>: After ${P && P.dodgesForUntouchable || 3} dodges, Connie enters Untouchable for 5s: gains +30% Evasion, doubles note generation, and counters heal her for 5% Max HP!</span>`,
    passive(u, B, S, P) {
      u.flat.evaPqom = S.eva; u.dirty = true;
      u.dodgeGuard = ev => {
        if (!ev.basic || B.t < (u._qomPhaseAt || 0)) return false;
        u._qomPhaseAt = B.t + P.phaseCd;
        return true;
      };
      B.on(u, 'dodged', ev => {
        if (!ev.src || !ev.src.alive) return;
        u._qomDodges = (u._qomDodges || 0) + 1;
        qomConnieCounter(u, B, ev.src);
        if (u._qomDodges >= P.dodgesForUntouchable && B.t >= (u._qomUntouchableAt || 0)) {
          u._qomDodges = 0; u._qomUntouchableAt = B.t + 15;
          B.applyStatus(u, u, 'qom_untouchable', 5);
          qomShow(B, 'vanish', u);
        }
      });
    }
  },
  R: {
    name: 'Grand Finale', type: 'Magic / Control / Support / Evasion',
    v: { mag: .18, critDmg: .25, echoRatio: .45 }, p: { noteTiers: [4, 6, 8] },
    desc: (S, P) => `<span class="sk-pas">Connie permanently gains <em>+${pcn(S.mag * 100)}%</em> Magic Attack and <em>+${pcn(S.critDmg * 100)}%</em> Crit Damage. Stored Note scaling: at 4+ notes (+6% Mag), at 6+ notes (+11% Mag, +8% CDR, counters pierce 18% Armor and drain 10 Energy), and at 8 notes (<b>Headliner</b>: basic attacks have a 38% chance to echo an extra <em>${pcn(S.echoRatio * 100)}%</em> Magic soundwave to an additional enemy).</span>`,
    passive(u, B, S) {
      u.flat.magPqom = S.mag; u.flat.critDmgqom = S.critDmg; u.dirty = true;
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
        if (other && Math.random() < .38) B.damage(u, other, u.st.mag * S.echoRatio, { type: 'magic', tag: 'Spectral Headliner' });
      });
      B.on(u, 'dealDamage', ev => {
        if (ev.tag !== 'Phantom Counter' || !ev.target || qomStacks(u, 'qom_notes') < 6) return;
        ev.armorPen = (ev.armorPen || 0) + .18;
        B.energy(ev.target, -10);
      });
    }
  }
};
