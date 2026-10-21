/* heroes5.js - Delilah Keen, clinical Ichor controller & specimen commander (DHBM Standards). */
'use strict';

/* Delilah does not climb a summon ladder. Each release is a tactical battlefield
   diagnosis: the selected specimen answers the formation currently in front of
   her, then remains as a tangible, lethal part of the fight. */
function delilahMark(u, B, target) {
  if (!target || !target.alive || target.hasStatus('testsubject')) return false;
  B.applyStatus(u, target, 'testsubject', 999);
  B.applyStatus(u, target, 'delilah_read', 999);
  B.fxFloatObject(target.x, target.y - 104, 'researchcapsule', '#caa2ff');
  B.fxRing(target.x, target.y - 44, 74, '#caa2ff', .22);
  return true;
}

function delilahSampleChoice(u, B) {
  const foes = B.enemiesOf(u).filter(e => e.alive);
  if (!foes.length) return null;
  const group = foes.find(e => foes.filter(o => o !== e && B.distance(o, e) < 185).length >= 1);
  const isolated = foes.filter(e => foes.every(o => o === e || B.distance(o, e) > 190))
    .sort((a, b) => B.distance(b, u) - B.distance(a, u))[0];
  const defensive = foes.slice().sort((a, b) => (b.st.def + b.st.mdef) - (a.st.def + a.st.mdef))[0];
  const mobile = B.highestStat(foes, 'ms') || B.highestEnergy(foes);
  if (group) return { id: 'Scraps', target: group, kind: 'disrupt' };
  if (isolated && B.distance(isolated, u) > 260) return { id: 'Goob', target: isolated, kind: 'pull' };
  if (defensive && defensive.st.def + defensive.st.mdef > (u.st.def + u.st.mdef) * 1.35)
    return { id: 'Toodles', target: defensive, kind: 'pressure' };
  return { id: 'Poppy', target: mobile || foes[0], kind: 'restrict' };
}

function delilahTriggerSampleAction(m, choice, target, B, u) {
  if (!m || !m.alive || !target || !target.alive) return;
  B.anim(m, 'attack', .62, 'delilahSampleRelease');
  B.fxArc(u, target, { kind: 'obj', img: 'researchcapsule', size: 28 }, () => {
    if (!m.alive || !target.alive) return;
    if (choice.kind === 'disrupt') {
      B.enemiesOf(u).filter(e => e.alive && B.distance(e, target) < 180).forEach(e => {
        B.damage(m, e, m.st.atk * .75, { type: 'true', noDodge: true, tag: 'Scraps Specimen' });
        B.applyStatus(m, e, 'stun', 1.0);
        B.applyStatus(m, e, 'contamination', 6);
      });
      B.fxStatusOn(target, 'StunEffect', { sizeMul: .85 });
    } else if (choice.kind === 'pull') {
      B.pull(target, m.x + m.face * 52, .34, m.depth);
      B.applyStatus(m, target, 'root', 2.2);
      B.damage(m, target, m.st.atk * .90, { type: 'true', noDodge: true, tag: 'Goob Specimen' });
      B.applyStatus(m, target, 'contamination', 6);
      B.fxStatusOn(target, 'StunEffect', { sizeMul: .85 });
    } else if (choice.kind === 'pressure') {
      B.damage(m, target, m.st.atk * 1.15, { type: 'true', noDodge: true, tag: 'Toodles Specimen' });
      B.applyStatus(m, target, 'exposed', 6, { stacks: 3 });
      B.applyStatus(m, target, 'contamination', 6);
      B.fxStatusOn(target, 'WeakenEffect', { sizeMul: .85 });
    } else {
      B.applyStatus(m, target, 'root', 2.0);
      B.applyStatus(m, target, 'slow', 4, { stacks: 3 });
      B.damage(m, target, m.st.atk * .80, { type: 'true', noDodge: true, tag: 'Poppy Specimen' });
      B.applyStatus(m, target, 'contamination', 6);
      B.fxStatusOn(target, 'StunEffect', { sizeMul: .85 });
    }
  });
}

function delilahRelease(u, B, S, P) {
  const cap = (u.rarity >= 5 || (u.skills && u.skills.R)) ? P.redCap : P.cap;
  const currentMinions = B.minionsOf(u).filter(m => m.alive);

  // If already at cap, overcharge all existing specimens!
  if (currentMinions.length >= cap) {
    Sound.play('beam_fire', { vol: .65, throttle: 200 });
    B.flash('#bd82ff', .3, .2);
    B.fxRing(u.x, u.y - 40, 220, '#caa2ff', .5);
    B.fxFloatIcon(u.x, u.y - 110, '🧪 OVERCHARGED!', '#caa2ff');

    currentMinions.forEach(m => {
      B.heal(u, m, m.max.hp * .35, { tag: 'Ichor Overcharge' });
      B.shield(u, m, u.max.hp * .25, 8);
      B.applyStatus(u, m, 'speedup', 8, { stacks: 2 });
      B.applyStatus(u, m, 'atkup', 8, { stacks: 2 });
      B.fxSparkle(m.x, m.y - 45, 8, '#bd82ff');

      // Trigger signature action on their target
      const foe = m.forcedTarget && m.forcedTarget.alive ? m.forcedTarget : (B.lowestHp(B.enemiesOf(u)) || B.enemiesOf(u)[0]);
      if (foe) {
        delilahTriggerSampleAction(m, { id: m.sampleType || 'Scraps', kind: m.sampleKind || 'disrupt' }, foe, B, u);
      }
    });
    return true;
  }

  const choice = delilahSampleChoice(u, B);
  if (!choice || !choice.target) return false;
  const failed = B.enemiesOf(u).find(e => e._delilahFailed && e.alive);
  const target = failed || (choice.target.hasStatus('testsubject') ? choice.target : (B.highestEnergy(B.enemiesOf(u)) || choice.target));
  const scale = { hp: S.hp || .65, atk: S.atk || .75, def: S.def || .60, mag: S.mag || .65, mdef: S.mdef || .60 };

  const m = B.summon(u, {
    protoId: choice.id, name: 'Twisted ' + choice.id, art: Art.twisted(choice.id),
    hp: u.max.hp * scale.hp, atk: u.st.atk * scale.atk, def: u.st.def * scale.def,
    mag: u.st.mag * scale.mag, mdef: u.st.mdef * scale.mdef,
    scale: .78, offset: (currentMinions.length) * 52, noEnergy: true, twisted: true,
    delilahSample: true, sampleType: choice.id, sampleKind: choice.kind, follow: target, tint: '#bd82ff'
  });

  m.antiDodge = enemy => enemy && (enemy.hasStatus('testsubject') || enemy.hasStatus('delilah_read'));
  m.failedVariable = failed || null;

  // Initial specimen shield
  B.shield(u, m, u.max.hp * .25, 8);
  B.fxFloatObject(u.x + u.face * 28, u.y - 110, 'researchcapsule', '#caa2ff');
  B.anim(u, 'cast', .78, 'delilahExperiment');
  Sound.play('summon', { vol: .65 });
  Sound.play('beam_charge', { vol: .22, throttle: 240 });

  // Opening signature attack
  B.after(.14, () => {
    delilahTriggerSampleAction(m, choice, target, B, u);
  });

  if ((u.rarity >= 5 || (u.skills && u.skills.R)) && !u.sampleTypes[choice.id]) {
    u.sampleTypes[choice.id] = true;
    B.minionsOf(u).forEach(a => {
      B.applyStatus(u, a, 'speedup', 999, { stacks: 1 });
      B.applyStatus(u, a, 'fortify', 999, { stacks: 1 });
    });
  }
  return true;
}

defHero({
  id: 'Delilah', name: 'Delilah Keen', folder: 'Delilah', file: 'Delilah', icon: 'Delilah',
  role: 'Control', tier: 'SS', element: 'Ichor',
  blurb: 'A cold, calculating researcher and co-founder of Gardenview who commands the battlefield with clinical mastery, deploying Ichor-engineered specimens and suppressing volatile variables.',
  base: { hp: 4320, atk: 228, def: 245, mag: 368, mdef: 310, spd: 110, acc: 235, eva: 145 },
  hidden: { range: 340, aspd: .92, ms: 75, aggro: .45, crit: .10, critDmg: 1.60, healPow: 1.15, shieldPow: 1.25,
    cdr: .15, ccRes: .28, kbRes: .35, armorPen: .15, magPen: .25 },
  growth: { hp: .095, atk: .080, def: .088, mag: .105, mdef: .092 },
  move: { gait: 'glide', bob: 2, freq: 1.15, lean: 2, squash: .018, idle: 'think', step: 'step_soft',
    particles: 'none', pcol: '#caa2ff', trail: { on: false }, brake: .5 },
  basic: {
    name: 'Ichor Syringe',
    type: 'true',
    ratio: 1.05,
    range: 340,
    proj: 'obj',
    pimg: 'researchcapsule',
    pcol: '#bd82ff',
    sfx: 'whoosh',
    hit: 'hit_magic',
    wind: .22,
    note: 'Fires pressurized Ichor syringes dealing True Damage. Injects targets with Test Subject data.',
    onHit: (u, t, B) => {
      delilahMark(u, B, t);
      if (t.hasStatus('testsubject') || t.statuses.some(s => STATUS[s.id] && STATUS[s.id].cc)) {
        B.damage(u, t, u.st.mag * .25, { type: 'true', silent: true, tag: 'Ichor Resonance' });
        B.applyStatus(u, t, 'contamination', 5);
      }
    }
  },
  skills: {
    // ---------------- WHITE SKILL: Controlled Experiment
    W: {
      name: 'Controlled Experiment',
      type: 'True Damage / Summon',
      energy: 100,
      v: { hp: .65, atk: .75, def: .60, mag: .65, mdef: .60 },
      p: { cap: 2, redCap: 3 },
      desc: (S, P) => `<span class="sk-pas">Delilah and her specimens deal True Damage and cannot be Dodged by enemies marked 🧪 Test Subject or 🔍 Read Pattern.</span> Passive: Delilah begins each battle by releasing a tactical Twisted specimen. Enemies afflicted by Crowd Control automatically become 🧪 Test Subjects. Active: Releases another Twisted specimen (up to ${P.cap}, or ${P.redCap} at Red). If already at maximum specimens, overcharges all active specimens: restoring 35% Max HP, granting a 25% Ichor Shield, +35% Attack Speed, and triggering their signature actions simultaneously!`,
      ai: { cond: (u, B) => true },
      passive: (u, B, S, P) => {
        u.sampleTypes = {};
        u.antiDodge = target => target && (target.hasStatus('testsubject') || target.hasStatus('delilah_read'));
        B.on(u, 'missed', ev => {
          if (!ev.target || !ev.target.alive || ev.target.team === u.team) return;
          B.applyStatus(u, ev.target, 'delilah_read', 8);
          B.fxFloatIcon(ev.target.x, ev.target.y - 92, '🔍', '#caa2ff');
        });
        B.after(.45, () => {
          if (!u.alive || B.minionsOf(u).length) return;
          if (delilahRelease(u, B, S, P)) B.log('<b>Delilah</b> releases her opening Twisted specimen.');
        });
        B.every(u, .45, () => B.enemiesOf(u).forEach(e => {
          if (e.statuses.some(s => STATUS[s.id] && STATUS[s.id].cc)) delilahMark(u, B, e);
        }));
      },
      cast: delilahRelease
    },

    // ---------------- GREEN SKILL: Unstable Sample
    G: {
      name: 'Unstable Sample',
      type: 'True Damage / Debuff',
      cd: 9.0,
      v: { dmg: 1.65, shieldCrack: .50 },
      p: { dur: 8.0, spread: .85, heal: .25 },
      desc: (S, P) => `Delilah injects the highest-Energy enemy with an overcharged capsule, cracking <em>${pcn(S.shieldCrack * 100)}</em> of an active Shield, stripping 2 removable buffs, and dealing <em>${pcn(S.dmg * 100)}</em> True Damage while inflicting ☣ Contamination for ${P.dur}s. Contaminated enemies bleed True Damage and lose 25 Energy per second. Test Subjects spread the contamination to the nearest enemy. Contaminated defeats restore 25% Max HP and 40 Energy to Delilah and all active specimens.`,
      ai: { prio: 65 },
      cast: (u, B, S, P) => {
        const t = B.highestEnergy(B.enemiesOf(u)) || B.enemiesOf(u)[0];
        if (!t) return;
        const activation = (u._contamActivation || 0) + 1;
        u._contamActivation = activation;

        B.anim(u, 'wind', .65, 'delilahInject');
        Sound.play('beam_charge', { vol: .32, throttle: 240 });

        B.after(.16, () => {
          if (!u.alive || !t.alive) return;
          B.anim(u, 'attack', .28, 'delilahInjectRelease');
          Sound.play('spectral', { vol: .65 });

          B.fxArc(u, t, { kind: 'obj', img: 'researchcapsule', size: 32 }, () => {
            B.crackShield(u, t, S.shieldCrack, { color: '#caa2ff' });
            // Strip up to 2 removable buffs
            const buffs = t.statuses.filter(s => STATUS[s.id] && STATUS[s.id].kind === 'buff' && s.id !== 'shield' && !s.apexLocked);
            buffs.slice(0, 2).forEach(b => B.removeStatus(t, b.id));

            B.damage(u, t, u.st.mag * S.dmg, { type: 'true', noDodge: true, tag: 'Unstable Sample' });
            B.applyStatus(u, t, 'contamination', P.dur);
            if (B.fxDelilahContaminationBurst) B.fxDelilahContaminationBurst(t.x, t.y - 35, 140);
            else {
              B.fxStatusOn(t, 'CurseEffect', { sizeMul: .95 });
              B.fxRing(t.x, t.y - 40, 140, '#caa2ff', .4);
            }

            if (t.hasStatus('testsubject')) {
              const near = B.nearest(t, B.enemiesOf(u).filter(e => e !== t && e.alive && e._delilahSpread !== activation));
              if (near) {
                near._delilahSpread = activation;
                B.applyStatus(u, near, 'contamination', P.dur * P.spread);
                B.fxArc(t, near, { kind: 'obj', img: 'researchcapsule', size: 22 });
              }
            }
          });
        });
      },
      passive: (u, B, S, P) => {
        // Continuous energy drain & bleed on contaminated enemies
        B.every(u, 1.5, () => {
          B.enemiesOf(u).filter(e => e.alive && e.hasStatus('contamination')).forEach(e => {
            B.damage(u, e, u.st.mag * .15, { type: 'true', dot: true, silent: true, tag: 'Contamination Bleed' });
            B.energy(e, -25);
          });
        });

        B.on(u, 'enemyDown', e => {
          if (!e.hasStatus('contamination')) return;
          B.heal(u, u, u.max.hp * P.heal, { tag: 'Contamination Harvest' });
          B.energy(u, 40);
          B.minionsOf(u).forEach(m => {
            B.heal(u, m, m.max.hp * P.heal, { tag: 'Contamination Harvest' });
          });
          B.fxFloatIcon(u.x, u.y - 110, '☣ SPECIMEN HEAL +40 ⚡', '#a855f7');
        });
      }
    },

    // ---------------- BLUE SKILL: Containment Procedure
    B: {
      name: 'Containment Procedure',
      type: 'Control / Cleanse',
      cd: 12.0,
      v: {},
      p: { dur: 3.5, clean: 6.0 },
      desc: (S, P) => `Orders all active specimens to surround and restrain the highest-Attack enemy, trapping them in ⛓ Contained Stasis for ${P.dur}s (Stunned, Silenced, taking 30% increased True Damage). Delilah and her specimens gain 🧼 Sterile Protocol, cleansing all debuffs, gaining CC Immunity for ${P.clean}s, and gaining an Ichor Shield equal to 25% Max HP. When Containment ends, all specimens deliver an Execution Strike dealing heavy True Damage. If Delilah has no active specimens, she unleashes a Stasis Shockwave, stunning the target for 2.5s and dealing heavy True Damage herself.`,
      ai: { prio: 60 },
      cast: (u, B, S, P) => {
        const t = B.highestStat(B.enemiesOf(u), 'atk') || B.enemiesOf(u)[0];
        if (!t) return;
        const samples = B.minionsOf(u).filter(m => m.alive);

        B.anim(u, 'cast', .72, 'delilahContainment');
        Sound.play('lock');
        Sound.play('guard', { vol: .35, throttle: 180 });
        B.fxFloatObject(u.x, u.y - 108, 'researchcapsule', '#caa2ff');
        B.fxRing(u.x, u.y - 38, 96, '#caa2ff');

        const sterilize = a => {
          B.cleanse(a, 99);
          B.applyStatus(u, a, 'sterileprotocol', P.clean);
          B.applyStatus(u, a, 'ccimmune', P.clean);
          B.shield(u, a, u.max.hp * .25, P.clean);
        };
        sterilize(u);
        samples.forEach(sterilize);

        if (!samples.length) {
          B.applyStatus(u, t, 'stun', 2.5);
          B.applyStatus(u, t, 'silence', 2.5);
          B.damage(u, t, u.st.mag * 1.40, { type: 'true', tag: 'Stasis Shockwave' });
          B.fxRing(t.x, t.y - 42, 130, '#caa2ff', .5);
          return;
        }

        const dur = P.dur;
        B.applyStatus(u, t, 'contained', dur);
        B.applyStatus(u, t, 'stun', dur);
        B.applyStatus(u, t, 'silence', dur);
        if (B.fxDelilahContainment) B.fxDelilahContainment(t.x, t.y - 35, dur);
        else B.fxRing(t.x, t.y - 42, 120, '#caa2ff', .45);

        samples.forEach((m, i) => {
          m.forcedTarget = t;
          B.applyStatus(u, m, 'stun', dur);
          B.dash(m, t.x + (i - (samples.length - 1) / 2) * 72, .32, { depth: t.depth });
        });

        B.after(dur, () => {
          samples.forEach(m => {
            if (!m.alive || !t.alive) return;
            B.removeStatus(m, 'stun');
            m.forcedTarget = t;
            B.fxSlash(m, t, { col: '#caa2ff', small: false });
            B.damage(m, t, m.st.atk * 1.25, { type: 'true', noDodge: true, tag: 'Execution Strike' });
          });
        });
      }
    },

    // ---------------- PURPLE SKILL: Clinical Observation
    P: {
      name: 'Clinical Observation',
      type: 'Skill Haste / Defense',
      v: { en: 15 },
      p: { haste: 5.0, hp: .25, armor: .25 },
      desc: (S, P) => `Test Subjects casting a skill grants Delilah <em>${S.en}</em> Energy. Whenever an enemy suffers Crowd Control, Delilah gains a stack of Clinical Insight (+5% Skill Haste and +3% True Damage, up to 10 stacks). The first time each Test Subject drops below half HP, her active specimens permanently gain +25% Max HP and +25% Armor and Magic Defense. If a specimen is defeated, its killer becomes a ⚠ Failed Variable, taking +40% True Damage from Delilah and suffering a 2s Stun.`,
      passive: (u, B, S, P) => {
        B.on(u, 'enemyCast', t => {
          if (t.hasStatus('testsubject')) B.energy(u, S.en);
        });

        B.on(u, 'statusApplied', ev => {
          if (ev.unit && ev.unit.team !== u.team && (STATUS[ev.id]?.cc || ev.id === 'slow' || ev.id === 'contained')) {
            B.applyStatus(u, u, 'haste', P.haste, { stacks: 1 });
            u._clinicalInsight = Math.min(10, (u._clinicalInsight || 0) + 1);
            u.flat.cdr = (u.flat.cdr || 0) + 0.005;
            u.flat.trueDmgP = (u.flat.trueDmgP || 0) + 0.03;
            u.dirty = true;
          }
        });

        B.every(u, .3, () => B.enemiesOf(u).forEach(t => {
          if (!t.hasStatus('testsubject') || t.hpPct >= .5 || t._delilahObserved) return;
          t._delilahObserved = true;
          B.minionsOf(u).forEach(m => {
            const pct = m.hpPct;
            m.baseStats.hp *= (1 + P.hp);
            m.baseStats.def *= (1 + P.armor);
            m.baseStats.mdef *= (1 + P.armor);
            m.recompute(true);
            m.hp = m.max.hp * pct;
            B.fxSparkle(m.x, m.y - 45, 8, '#caa2ff');
          });
          B.fxFloatObject(t.x, t.y - 110, 'researchcapsule', '#caa2ff');
        }));

        B.on(u, 'minionDown', ev => {
          if (!ev.src || ev.src.team === u.team) return;
          ev.src._delilahFailed = true;
          B.applyStatus(u, ev.src, 'failedvariable', 999);
          B.applyStatus(u, ev.src, 'stun', 2.0);
          B.fxFloatIcon(ev.src.x, ev.src.y - 100, '⚠ FAILED VARIABLE', '#ff6b6b');
        });
      }
    },

    // ---------------- RED SKILL: Further Testing Required
    R: {
      name: 'Further Testing Required',
      type: 'True Damage / Control',
      v: { spill: .08 },
      p: { ccNeed: 3.5, cd: 12, spillDur: 8, saveHp: .35 },
      desc: (S, P) => `Delilah can maintain a 3rd active Twisted specimen, and all specimens permanently gain +25% Attack Speed and +20% Move Speed. Defeated specimens erupt into an 8s Ichor Spill that burns enemies with True Damage and Contamination while healing friendly specimens. Once per wave, when Delilah would suffer lethal damage, an active specimen intercepts the blow or an Emergency Catalyst activates, granting 3.5s Invulnerability, cleansing all debuffs, and restoring 35% Max HP.`,
      passive: (u, B, S, P) => {
        B.every(u, .5, () => B.enemiesOf(u).forEach(e => {
          const underCC = e.statuses.some(s => STATUS[s.id]?.cc);
          e._delilahCcTime = (e._delilahCcTime || 0) + (underCC ? .5 : 0);
          if (e._delilahCcTime >= P.ccNeed && delilahMark(u, B, e)) {
            e._delilahCcTime = 0;
            B.reduceCd(u, P.cd);
          }
        }));

        B.on(u, 'minionDown', ev => {
          const m = ev.minion;
          if (!m) return;
          const x = m.x;
          B.fxBoom(x, m.y - 35, .85, '#a24dce');
          if (B.fxDelilahSpill) B.fxDelilahSpill(x, m.y - 15, P.spillDur);
          const until = B.t + P.spillDur;
          const tick = () => {
            if (B.t >= until) return;
            B.enemiesOf(u).filter(e => e.alive && Math.abs(e.x - x) < 115).forEach(e => {
              B.damage(u, e, u.max.hp * S.spill * .5, { type: 'true', dot: true, tag: 'Ichor Spill' });
              B.applyStatus(u, e, 'contamination', 1.0);
            });
            B.minionsOf(u).filter(a => a.alive && Math.abs(a.x - x) < 115).forEach(a => {
              B.heal(u, a, a.max.hp * .045);
            });
            B.after(.5, tick);
          };
          tick();
        });

        B.on(u, 'allyLethal', ev => {
          if (ev.unit !== u || u._delilahRescue) return;
          u._delilahRescue = true;
          ev.prevented = true;
          u.hp = u.max.hp * P.saveHp;
          B.cleanse(u, 99);
          B.applyStatus(u, u, 'untargetable', 3.5);
          B.applyStatus(u, u, 'ward', 3.5);

          const guardian = B.highestHp(B.minionsOf(u));
          if (guardian) {
            B.fxArc(guardian, u, { kind: 'obj', img: 'researchcapsule', size: 28 });
            B.damage(ev.src || u, guardian, guardian.hp, { type: 'true', noDodge: true, tag: 'Specimen Interception' });
          }
          Sound.play('fanfare', { vol: .8 });
          B.flash('#caa2ff', .5, .3);
          B.fxFloatIcon(u.x, u.y - 120, '🧪 EMERGENCY CATALYST!', '#ffffff');
        });
      }
    }
  }
});
