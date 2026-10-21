/* heroes5.js - Delilah Keen, a formation-reading controller. */
'use strict';

/* Delilah does not climb a summon ladder. Each release is a small battlefield
   diagnosis: the selected sample answers the formation currently in front of
   her, then remains as a tangible part of the fight. */
function delilahMark(u, B, target) {
  if (!target || !target.alive || target.hasStatus('testsubject')) return false;
  B.applyStatus(u, target, 'testsubject', 999);
  B.applyStatus(u, target, 'delilah_read', 999);
  B.fxFloatObject(target.x, target.y - 104, 'researchcapsule', '#caa2ff');
  B.fxRing(target.x, target.y - 44, 74, '#caa2ff', .22);
  return true;
}

function delilahSampleChoice(u, B) {
  const foes = B.enemiesOf(u);
  const group = foes.find(e => foes.filter(o => o !== e && B.distance(o, e) < 165).length >= 2);
  const isolated = foes.filter(e => foes.every(o => o === e || B.distance(o, e) > 210))
    .sort((a, b) => B.distance(b, u) - B.distance(a, u))[0];
  const defensive = foes.slice().sort((a, b) => (b.st.def + b.st.mdef) - (a.st.def + a.st.mdef))[0];
  const mobile = B.highestStat(foes, 'ms');
  if (group) return { id: 'Scraps', target: group, kind: 'disrupt' };
  if (isolated && B.distance(isolated, u) > 300) return { id: 'Goob', target: isolated, kind: 'pull' };
  if (defensive && defensive.st.def + defensive.st.mdef > (u.st.def + u.st.mdef) * 1.55)
    return { id: 'Toodles', target: defensive, kind: 'pressure' };
  return { id: 'Poppy', target: mobile || B.highestEnergy(foes), kind: 'restrict' };
}

function delilahRelease(u, B, S, P) {
  const cap = u.rarity >= 5 ? P.redCap : P.cap;
  if (B.minionsOf(u).length >= cap) return false;
  const choice = delilahSampleChoice(u, B); if (!choice || !choice.target) return false;
  const failed = B.enemiesOf(u).find(e => e._delilahFailed && e.alive);
  const target = failed || (choice.target.hasStatus('testsubject') ? choice.target : (B.highestEnergy(B.enemiesOf(u)) || choice.target));
  const scale = { hp: S.hp, atk: S.atk, def: S.def, mag: S.mag, mdef: S.mdef };
  const m = B.summon(u, {
    protoId: choice.id, name: 'Twisted ' + choice.id, art: Art.twisted(choice.id),
    hp: u.max.hp * scale.hp, atk: u.st.atk * scale.atk, def: u.st.def * scale.def,
    mag: u.st.mag * scale.mag, mdef: u.st.mdef * scale.mdef,
    scale: .72, offset: (B.minionsOf(u).length - 1) * 50, noEnergy: true, twisted: true,
    delilahSample: true, sampleType: choice.id, follow: target, tint: '#bd82ff'
  });
  m.antiDodge = enemy => enemy && (enemy.hasStatus('testsubject') || enemy.hasStatus('delilah_read'));
  m.failedVariable = failed || null;
  B.fxFloatObject(u.x + u.face * 28, u.y - 110, 'researchcapsule', '#caa2ff');
  B.anim(u, 'cast', .78, 'delilahExperiment');
  Sound.play('summon', { vol: .58 }); Sound.play('beam_charge', { vol: .18, throttle: 240 });

  // The opening action is intentionally not a full stolen character kit. It
  // gives each specimen a readable signature before its normal basic AI takes over.
  B.after(.12, () => {
    if (!m.alive || !target.alive) return;
    B.anim(m, 'attack', .62, 'delilahSampleRelease');
    B.fxArc(u, target, { kind: 'obj', img: 'Tape', size: 27 }, () => {
      if (choice.kind === 'disrupt') {
        B.enemiesOf(u).filter(e => B.distance(e, target) < 170).forEach(e => {
          B.damage(m, e, m.st.atk * .48, { type: 'true', noDodge: true, tag: 'Scraps Sample' });
          B.applyStatus(m, e, 'stun', .72);
        });
      } else if (choice.kind === 'pull') {
        B.pull(target, m.x + m.face * 52, .34, m.depth); B.applyStatus(m, target, 'root', 1.8);
        B.damage(m, target, m.st.atk * .62, { type: 'true', noDodge: true, tag: 'Goob Sample' });
      } else if (choice.kind === 'pressure') {
        B.damage(m, target, m.st.atk * .82, { type: 'true', noDodge: true, tag: 'Toodles Sample' });
        B.applyStatus(m, target, 'exposed', 5, { stacks: 2 });
      } else {
        B.applyStatus(m, target, 'root', 1.6); B.applyStatus(m, target, 'slow', 3, { stacks: 2 });
        B.damage(m, target, m.st.atk * .52, { type: 'true', noDodge: true, tag: 'Poppy Sample' });
      }
      B.fxStatusOn(target, choice.kind === 'pressure' ? 'WeakenEffect' : 'StunEffect', { sizeMul: .78 });
    });
  });
  if (u.rarity >= 5 && !u.sampleTypes[choice.id]) {
    u.sampleTypes[choice.id] = true;
    B.minionsOf(u).forEach(a => { B.applyStatus(u, a, 'speedup', 999, { stacks: 1 }); B.applyStatus(u, a, 'fortify', 999, { stacks: 1 }); });
  }
  return true;
}

defHero({
  id: 'Delilah', name: 'Delilah Keen', folder: 'Delilah', file: 'Delilah', icon: 'Delilah',
  role: 'Control', tier: 'SS', element: 'Ichor',
  blurb: 'A clinical observer who turns crowd control into a living experiment.',
  base: { hp: 4000, atk: 214, def: 228, mag: 326, mdef: 282, spd: 106, acc: 224, eva: 138 },
  hidden: { range: 330, aspd: .86, ms: 74, aggro: .45, crit: .08, critDmg: 1.55, healPow: 1, shieldPow: 1,
    cdr: .13, ccRes: .24, kbRes: .26, armorPen: .10, magPen: .18 },
  growth: { hp: .085, atk: .075, def: .082, mag: .089, mdef: .086 },
  move: { gait: 'glide', bob: 2, freq: 1.15, lean: 2, squash: .018, idle: 'think', step: 'step_soft',
    particles: 'none', pcol: '#caa2ff', trail: { on: false }, brake: .5 },
  basic: { name: 'Clinical Note', type: 'magic', ratio: .76, range: 330, proj: 'orb', pcol: '#caa2ff',
    sfx: 'whoosh', hit: 'hit_magic', wind: .24,
    onHit: (u, t, B) => { if (t.statuses.some(s => STATUS[s.id].cc)) delilahMark(u, B, t); } },
  skills: {
    W: {
      name: 'Controlled Experiment', type: 'True Damage', energy: 100,
      v: { hp: .36, atk: .50, def: .40, mag: .40, mdef: .40 }, p: { cap: 2, redCap: 3 },
      desc: (S, P) => `<span class="sk-pas">Delilah’s direct attacks and samples cannot be Dodged by enemies marked 🧪 Test Subject or 🔍 Read Pattern. A missed attack briefly maps that target anyway.</span> Passive: starts each battle by releasing a formation-selected Twisted. Enemies crowd controlled during the wave become 🧪 Test Subjects. Active: releases another Twisted (up to ${P.cap}, or ${P.redCap} at Red) inheriting Delilah's core stats, then immediately performs a simplified signature action.`,
      ai: { cond: (u, B) => B.minionsOf(u).length < (u.rarity >= 5 ? 3 : 2) },
      passive: (u, B, S, P) => {
        u.sampleTypes = {};
        u.antiDodge = target => target && (target.hasStatus('testsubject') || target.hasStatus('delilah_read'));
        B.on(u, 'missed', ev => {
          if (!ev.target || !ev.target.alive || ev.target.team === u.team) return;
          B.applyStatus(u, ev.target, 'delilah_read', 6);
          B.fxFloatIcon(ev.target.x, ev.target.y - 92, '🔍', '#caa2ff');
        });
        // Delilah's identity should be present from the opening exchange, not
        // hidden behind the first full Energy bar. This timer begins only once
        // combat is actually running, after the walk-in/banter sequence.
        B.after(.45, () => {
          if (!u.alive || B.minionsOf(u).length) return;
          if (delilahRelease(u, B, S, P)) B.log('<b>Delilah</b> releases her first Twisted specimen.');
        });
        B.every(u, .45, () => B.enemiesOf(u).forEach(e => {
          if (e.statuses.some(s => STATUS[s.id].cc)) delilahMark(u, B, e);
        }));
      },
      cast: delilahRelease
    },
    G: {
      name: 'Unstable Sample', type: 'True Damage', cd: 9.5,
      v: { dmg: 1.30, shieldCrack: .34 }, p: { dur: 7.5, spread: .62, heal: .20 },
      desc: (S, P) => `Injects the highest-Energy enemy, cracking <em>${pcn(S.shieldCrack * 100)}</em> of an active Shield, stripping one removable buff, then dealing True Damage and applying ☣ Contamination for ${P.dur}s. Test Subjects spread it to the nearest enemy. A cleanser removes it but becomes Stunned. Contaminated KO's heal Delilah's weakest active Twisted.`,
      ai: { prio: 62 },
      cast: (u, B, S, P) => {
        const t = B.highestEnergy(B.enemiesOf(u)); if (!t) return;
        const activation = (u._contamActivation || 0) + 1; u._contamActivation = activation;
        B.anim(u, 'wind', .68, 'delilahInject'); Sound.play('beam_charge', { vol: .24, throttle: 260 });
        B.after(.18, () => {
          if (!u.alive || !t.alive) return;
          B.anim(u, 'attack', .28, 'delilahInjectRelease'); Sound.play('spectral', { vol: .55 });
          B.fxArc(u, t, { kind: 'obj', img: 'researchcapsule', size: 31 }, () => {
            B.crackShield(u, t, S.shieldCrack, { color: '#caa2ff' });
            const buff = t.statuses.find(s => STATUS[s.id] && STATUS[s.id].kind === 'buff' && s.id !== 'shield' && !s.apexLocked);
            if (buff) B.removeStatus(t, buff.id);
            B.damage(u, t, u.st.mag * S.dmg, { type: 'true', noDodge: true, tag: 'Unstable Sample' });
            B.applyStatus(u, t, 'contamination', P.dur);
            B.fxStatusOn(t, 'CurseEffect', { sizeMul: .86 });
            if (t.hasStatus('testsubject')) {
              const near = B.nearest(t, B.enemiesOf(u).filter(e => e !== t && e._delilahSpread !== activation));
              if (near) { near._delilahSpread = activation; B.applyStatus(u, near, 'contamination', P.dur * P.spread); B.fxArc(t, near, { kind: 'obj', img: 'Tape', size: 20 }); }
            }
          });
        });
      },
      passive: (u, B, S, P) => B.on(u, 'enemyDown', e => {
        if (!e.hasStatus('contamination')) return;
        const sample = B.lowestHp(B.minionsOf(u)); if (sample) B.heal(u, sample, sample.max.hp * P.heal);
      })
    },
    B: {
      name: 'Containment Procedure', type: 'Control', cd: 13,
      v: {}, p: { dur: 2.3, per: .80, fallback: 1.4, clean: 5.5 },
      desc: (S, P) => `Orders every active Twisted to surround the highest-Attack enemy. Delilah and her samples gain 🧼 Sterile Protocol, cleansing up to three negative statuses when the protocol is renewed and improving CC Resistance. They stop attacking while the target is ⛓ Contained; each Twisted extends the duration. When it ends, every sample immediately strikes once. With no samples, Delilah instead Stuns the target.`,
      ai: { prio: 58 },
      cast: (u, B, S, P) => {
        const t = B.highestStat(B.enemiesOf(u), 'atk'); if (!t) return;
        const samples = B.minionsOf(u);
        B.anim(u, 'cast', .72, 'delilahContainment'); Sound.play('lock'); Sound.play('guard', { vol: .28, throttle: 180 });
        B.fxFloatObject(u.x, u.y - 108, 'Book', '#caa2ff'); B.fxRing(u.x, u.y - 38, 88, '#caa2ff');
        const sterilize = a => {
          const alreadySterile = a.hasStatus('sterileprotocol');
          B.applyStatus(u, a, 'sterileprotocol', P.clean);
          if (alreadySterile) B.cleanse(a, 3);
        };
        sterilize(u); samples.forEach(sterilize);
        if (!samples.length) { B.applyStatus(u, t, 'stun', P.fallback); return; }
        const dur = P.dur + (samples.length - 1) * P.per;
        B.applyStatus(u, t, 'contained', dur); B.fxRing(t.x, t.y - 42, 110, '#caa2ff', .35);
        samples.forEach((m, i) => {
          m.forcedTarget = t; B.applyStatus(u, m, 'stun', dur);
          B.dash(m, t.x + (i - (samples.length - 1) / 2) * 76, .34, { depth: t.depth });
        });
        B.after(dur, () => samples.forEach(m => {
          if (!m.alive || !t.alive) return;
          B.removeStatus(m, 'stun'); m.forcedTarget = t;
          B.fxSlash(m, t, { col: '#caa2ff', small: true });
          B.damage(m, t, m.st.atk * .85, { type: 'physical', melee: true, tag: 'Containment Strike' });
        }));
      }
    },
    P: {
      name: 'Clinical Observation', type: 'Skill Haste / Defense',
      v: { en: 9 }, p: { haste: 4.5, hp: .20, armor: .24 },
      desc: (S, P) => `Test Subjects casting a skill grants Delilah <em>${S.en}</em> Energy. Whenever they suffer Crowd Control, she gains Skill Haste for ${P.haste}s. The first time each Test Subject drops below half HP permanently reinforces her active Twisteds with <em>${pcn(P.hp * 100)}</em> Max HP and <em>${pcn(P.armor * 100)}</em> defenses. If a Test Subject defeats one, it becomes a Failed Variable for the next release.`,
      passive: (u, B, S, P) => {
        B.on(u, 'enemyCast', t => { if (t.hasStatus('testsubject')) B.energy(u, S.en); });
        B.on(u, 'statusApplied', ev => {
          if (ev.unit.team !== u.team && ev.unit.hasStatus('testsubject') && (STATUS[ev.id].cc || ev.id === 'slow'))
            B.applyStatus(u, u, 'haste', P.haste, { stacks: 1 });
        });
        B.every(u, .3, () => B.enemiesOf(u).forEach(t => {
          if (!t.hasStatus('testsubject') || t.hpPct >= .5 || t._delilahObserved) return;
          t._delilahObserved = true;
          B.minionsOf(u).forEach(m => {
            const pct = m.hpPct; m.baseStats.hp *= 1 + P.hp; m.baseStats.def *= 1 + P.armor; m.baseStats.mdef *= 1 + P.armor;
            m.recompute(true); m.hp = m.max.hp * pct;
          });
          B.fxFloatObject(t.x, t.y - 110, 'Book', '#caa2ff');
        }));
        B.on(u, 'minionDown', ev => {
          if (!ev.src || !ev.src.hasStatus('testsubject')) return;
          ev.src._delilahFailed = true; B.applyStatus(u, ev.src, 'failedvariable', 999);
        });
      }
    },
    R: {
      name: 'Further Testing Required', type: 'True Damage / Control',
      v: { spill: .06 }, p: { ccNeed: 3.8, cd: 13, spillDur: 7, saveHp: .16 },
      desc: (S, P) => `A third Twisted can be maintained. New sample types strengthen the active set. Defeated Twisteds leave Ichor Spills that hurt enemies and heal samples; sustained CC creates Test Subjects and recharges Controlled Experiment. Once per wave, a surviving Twisted intercepts Delilah's lethal damage.`,
      passive: (u, B, S, P) => {
        B.every(u, .5, () => B.enemiesOf(u).forEach(e => {
          const underCC = e.statuses.some(s => STATUS[s.id].cc);
          e._delilahCcTime = (e._delilahCcTime || 0) + (underCC ? .5 : 0);
          if (e._delilahCcTime >= P.ccNeed && delilahMark(u, B, e)) B.reduceCd(u, P.cd);
        }));
        B.on(u, 'minionDown', ev => {
          const m = ev.minion;
          const x = m.x;
          B.fxBoom(x, m.y - 35, .75, '#a24dce');
          const until = B.t + P.spillDur;
          const tick = () => {
            if (B.t >= until) return;
            B.enemiesOf(u).filter(e => Math.abs(e.x - x) < 105).forEach(e => {
              B.damage(u, e, u.max.hp * S.spill * .5, { type: 'true', dot: true, tag: 'Ichor Spill' });
              B.applyStatus(u, e, 'contamination', .8);
            });
            B.minionsOf(u).filter(a => Math.abs(a.x - x) < 105).forEach(a => B.heal(u, a, a.max.hp * .035));
            B.after(.5, tick);
          };
          tick();
        });
        B.on(u, 'allyLethal', ev => {
          if (ev.unit !== u || u._delilahRescue) return;
          const guardian = B.highestHp(B.minionsOf(u)); if (!guardian) return;
          u._delilahRescue = true; ev.prevented = true; u.hp = u.max.hp * P.saveHp;
          B.fxArc(guardian, u, { kind: 'obj', img: 'Tape', size: 24 });
          B.damage(ev.src, guardian, Math.max(ev.amount || guardian.hp, guardian.hp), { type: 'true', noDodge: true, tag: 'Interception' });
        });
      }
    }
  }
});
