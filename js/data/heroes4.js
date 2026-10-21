/* heroes4.js - Rodger, Soulvester, Gourdy, Eclipse, Sprout.
   Same contract as heroes.js/heroes2.js/heroes3.js. Rodger was previously an
   enemy-only quickCast() placeholder in twisted.js written before his real
   Skillset.txt was available (see the removed block there) - this is a full
   rewrite to match that file, now living here as a proper playable Hero.
   Soulvester, Gourdy and Eclipse are new. */
'use strict';

/* ============================================================ RODGER
   Backline Control - B Tier. Never throws a punch; wins by knowing too much.
   The master detective watches, discovers clues, and closes cases. */
defHero({
  id: 'Rodger', name: 'Rodger', folder: 'Rodger', file: 'Rodger', icon: 'Rodger',
  role: 'Control', tier: 'B', element: 'Clue',
  blurb: 'Does not perform Basic Attacks. Constantly discovers Clues, designates Prime Suspects, and exploits solved cases for massive team advantages.',
  base: { hp: 3650, atk: 110, def: 215, mag: 360, mdef: 260, spd: 98, acc: 210, eva: 135 },
  hidden: { range: 520, aspd: .7, ms: 0, aggro: .30, crit: .05, critDmg: 1.4, healPow: 1, shieldPow: 1,
    cdr: .15, ccRes: .20, kbRes: .25, armorPen: .08, magPen: .14 },
  growth: { hp: .082, atk: .050, def: .080, mag: .095, mdef: .088 },
  move: { gait: 'swagger', bob: 4, freq: 1.3, lean: 4, squash: .03, idle: 'think', step: 'step',
    particles: 'none', pcol: '#8fb4ff', trail: { on: false }, brake: .4 },
  // Field Research says he doesn't attack at all - the basic here exists only
  // because the engine wants one; Rodger self-Disarms at battle start (see
  // W's passive) so it never actually fires.
  basic: { name: 'Notebook Flick', type: 'magic', ratio: .3, range: 520, proj: 'orb', pcol: '#8fb4ff',
    sfx: 'whoosh', hit: 'hit_magic', wind: .2, note: 'He never throws this - he is always Disarmed.' },
  skills: {
    W: {
      name: 'Field Research: Grand Deduction', type: 'Control', energy: 100,
      v: { dmg: 160, caseDur: 4.0, shield: 260 },
      p: { gain: 2, allyEn: 20, max: 5 },
      desc: (S, P) => `<span class="sk-pas">Rodger performs no Basic Attacks and stays planted in the backline. Every 1.8s he observes the highest-threat enemy, gathering 1 🔍 Clue (up to ${P.max}) and gaining 14 Energy. When allies hit researched foes or enemies cast, Rodger gains bonus Energy and Clues.</span>
        Active: Rodger raises his magnifying glass, discovering <b>${P.gain} Clues</b> on ALL enemies and dealing <em>${Math.round(S.dmg)}</em> magic damage. Enemies are interrupted and become 🕵 Investigated for <em>${S.caseDur.toFixed(1)}s</em>. If any enemy has 5 Clues (Case Closed), Rodger executes a <b>Grand Deduction</b>: stuns them for 1.8s, dispels all their positive buffs, and grants all allies a <em>${Math.round(S.shield)}</em> Shield, ${P.allyEn} Energy, and +30% Attack Speed!`,
      passive: (u, B, S, P) => {
        u.research = {}; // uid -> stacks (0 to 5), also feeds end-of-battle shard multiplier
        B.applyStatus(u, u, 'planted', 999);
        B.applyStatus(u, u, 'disarm', 999);
        u.immovable = true;

        u.addClue = (target, count = 1) => {
          if (!target || !target.alive) return;
          u.research = u.research || {};
          const old = u.research[target.uid] || 0;
          const next = Math.min(P.max, old + count);
          u.research[target.uid] = next;
          if (next >= P.max && old < P.max && !target._rodgerClosed) {
            target._rodgerClosed = true;
            Sound.play('lock'); Sound.play('guardbreak', { vol: .35, throttle: 500 });
            B.applyStatus(u, target, 'exposed', 999, { stacks: 3 });
            B.applyStatus(u, target, 'investigated', 999);
            B.applyStatus(u, target, 'buffsealed', 6, { stacks: 1 });
            B.fxRing(target.x, target.y - 40, 110, '#8fb4ff');
            B.fxStatusOn(target, 'WeakenEffect', { sizeMul: 1.05 });
            B.fxFloatObject(target.x, target.y - 110, 'Book', '#8fb4ff');
          }
        };

        // Note-taking / observation cycle: every 1.8s observe highest threat
        B.every(u, 1.8, () => {
          const foes = B.enemiesOf(u);
          Object.keys(u.research).forEach(uid => {
            if (!foes.some(foe => String(foe.uid) === uid)) delete u.research[uid];
          });
          const t = B.highestEnergy(foes) || foes[0];
          if (!t) return;
          u.addClue(t, 1);
          B.energy(u, 14);
          B.anim(u, 'cast', .76, 'rodgerResearch');
          Sound.play('ding', { vol: .22, throttle: 600 });
          B.fxRodgerResearch(u, t, u.research[t.uid], true);
        });

        // Ally attacks against researched enemies grant Rodger bonus energy & chance of clue
        B.on(u, 'hit', e => {
          if (!e || !e.target || e.target.team === u.team) return;
          const st = (u.research || {})[e.target.uid] || 0;
          if (st > 0) {
            B.energy(u, 3);
            if (chance(.25)) u.addClue(e.target, 1);
          }
        });

        B.on(u, 'enemyDown', e => {
          if (e && u.research && e.uid != null) {
            e._rodgerResearchAtDefeat = Math.max(e._rodgerResearchAtDefeat || 0, u.research[e.uid] || 0);
          }
        });
      },
      cast: (u, B, S, P) => {
        const foes = B.enemiesOf(u);
        if (!foes.length) return;
        B.anim(u, 'cast', 1.14, 'rodgerResearch');
        Sound.play('lock');
        Sound.play('beam_charge', { vol: .28, throttle: 260 });

        const primary = B.mostResearched(u) || B.highestEnergy(foes) || foes[0];
        if (primary) B.fxRodgerResearch(u, primary, Math.min(P.max, ((u.research || {})[primary.uid] || 0) + P.gain), false);

        B.after(.35, () => {
          if (!u.alive) return;
          let anyCaseClosed = false;
          foes.forEach(foe => {
            if (!foe.alive) return;
            if (u.addClue) u.addClue(foe, P.gain);
            B.applyStatus(u, foe, 'investigated', S.caseDur);
            B.interrupt(foe);
            B.damage(u, foe, S.dmg + u.st.mag * 0.8, { type: 'magic' });
            B.fxRing(foe.x, foe.y - 35, 75, '#8fb4ff');
            if ((u.research || {})[foe.uid] >= P.max) anyCaseClosed = true;
          });

          if (anyCaseClosed) {
            Sound.play('guardbreak', { vol: .38, throttle: 300 });
            B.shake(4, .2);
            foes.filter(f => f.alive && (u.research || {})[f.uid] >= P.max).forEach(f => {
              B.applyStatus(u, f, 'stun', 1.8);
              B.dispel(f, 99);
              B.fxStatusOn(f, 'SilenceEffect', { sizeMul: 1.1 });
            });
            B.alliesOf(u).forEach(ally => {
              B.shield(u, ally, S.shield + u.st.mag * 0.75, 5);
              B.energy(ally, P.allyEn);
              B.applyStatus(u, ally, 'haste', 5);
              B.fxSparkle(ally.x, ally.y - 45, 8, '#8fb4ff');
            });
          }
        });
      }
    },
    G: {
      name: 'Research Capsule', type: 'Control', cd: 8.5,
      v: { baseDmg: 130, perDmg: 50, baseStun: 1.0, perStun: 0.28 },
      p: { dur: 5, seal: 4, cdr: .18 },
      desc: (S, P) => `Throws a pressurized Research Capsule at the enemy with the most Research. Deals <em>${Math.round(S.baseDmg)}</em> (+<em>${Math.round(S.perDmg)}</em> per Clue) magic damage and stuns them for <em>${S.baseStun.toFixed(1)}s</em> (+<em>${S.perStun.toFixed(2)}s</em> per Clue), making them 🕵 Investigated for ${P.dur}s. The capsule splashes 1 Clue and Slows adjacent foes, grants the nearest ally a temporary shield, and at 5 Clues, dispels 2 buffs and 🛑 Buff Seals the primary target for ${P.seal}s.`,
      ai: { prio: 55, cond: (u, B) => !!B.mostResearched(u) || B.enemiesOf(u).length > 0 },
      cast: (u, B, S, P) => {
        const t = B.mostResearched(u) || B.highestEnergy(B.enemiesOf(u));
        if (!t) return;
        const st = (u.research || {})[t.uid] || 0;
        B.anim(u, 'wind', .86, 'rodgerCapsule');
        Sound.play('beam_charge', { vol: .20, throttle: 260 });
        B.fxRodgerCapsuleReady(u, .72);

        B.after(.20, () => {
          if (!u.alive || !t.alive) return;
          B.anim(u, 'attack', .22, 'rodgerCapsuleRelease');
          Sound.play('throwsomething', { vol: .55 });
          B.fxArc(u, t, { kind: 'obj', img: 'researchcapsule', size: 34 }, () => {
            Sound.play('icebreak');
            B.hitstop(70);
            B.fxRodgerCapsuleImpact(t, st);
            B.fxStatusOn(t, 'StunEffect', { sizeMul: .92 });

            const totalDmg = S.baseDmg + u.st.mag * 0.65 + (S.perDmg + u.st.mag * 0.22) * st;
            B.damage(u, t, totalDmg, { type: 'magic' });
            B.applyStatus(u, t, 'stun', S.baseStun + S.perStun * st);
            B.applyStatus(u, t, 'investigated', P.dur);

            // Splash clues & slow to nearby foes
            B.enemiesOf(u).forEach(other => {
              if (other !== t && other.alive && Math.hypot(other.x - t.x, other.y - t.y) < 160) {
                if (u.addClue) u.addClue(other, 1);
                B.applyStatus(u, other, 'slow', 3);
                B.fxRing(other.x, other.y - 30, 50, '#8fb4ff');
              }
            });

            // Nearest ally gains research shield
            const nearestAlly = B.alliesOf(u).filter(a => a.alive).sort((a, b) => Math.hypot(a.x - t.x, a.y - t.y) - Math.hypot(b.x - t.x, b.y - t.y))[0];
            if (nearestAlly) {
              B.shield(u, nearestAlly, 180 + u.st.mag * 0.5, 4.5);
              B.fxSparkle(nearestAlly.x, nearestAlly.y - 40, 6, '#8fb4ff');
            }

            if (st >= 5) {
              B.dispel(t, 2);
              B.applyStatus(u, t, 'buffsealed', P.seal, { stacks: 1 });
              B.fxStatusOn(t, 'WeakenEffect', { sizeMul: .9 });
            }
          });
        });
      }
    },
    B: {
      name: 'Prime Suspect Dossier', type: 'Control', cd: 10.5,
      v: { dur: 6.5, slow: 3.0, backfireDmg: 180 },
      p: { enReward: 30, atkRed: .30 },
      desc: (S, P) => `Opens his dossier on the enemy with the most Research, declaring them the <b>Prime Suspect</b> for <em>${S.dur.toFixed(1)}s</em>. The Prime Suspect deals ${Math.round(P.atkRed * 100)}% reduced damage and is 🕵 Investigated. Whenever they cast a skill, Rodger objects and interrupts them, dealing <em>${Math.round(S.backfireDmg)}</em> deduction magic damage and 🐢 Slowing them for <em>${S.slow.toFixed(1)}s</em>. If the Prime Suspect is defeated while the file is open, Rodger declares <b>Case Solved</b>, granting ${P.enReward} Energy and +25% Speed to all allies!`,
      ai: { prio: 48, cond: (u, B) => !!B.mostResearched(u) || B.enemiesOf(u).length > 0 },
      cast: (u, B, S, P) => {
        const t = B.mostResearched(u) || B.highestEnergy(B.enemiesOf(u));
        if (!t) return;
        B.anim(u, 'cast', 1.12, 'rodgerCase');
        Sound.play('lock');
        Sound.play('ui_open', { vol: .26 });
        B.fxRodgerCaseFile(u, t);
        if (u.addClue) u.addClue(t, 1);

        B.after(.48, () => {
          if (!t.alive) return;
          B.applyStatus(u, t, 'investigated', S.dur);
          B.applyStatus(u, t, 'weaken', S.dur, { stacks: 2 });
          B.fxStatusOn(t, 'SilenceEffect', { sizeMul: .92 });
          t._rodgerPrimeSuspect = true;
        });

        const offCast = B.on(u, 'enemyCast', e => {
          if (e === t && t._rodgerPrimeSuspect && t.alive) {
            B.interrupt(t);
            Sound.play('guardbreak', { vol: .28, throttle: 300 });
            B.damage(u, t, S.backfireDmg + u.st.mag * 0.85, { type: 'magic' });
            B.applyStatus(u, t, 'slow', S.slow);
            B.fxFloatObject(t.x, t.y - 100, 'Book', '#8fb4ff');
          }
        });

        const offDown = B.on(u, 'enemyDown', e => {
          if (e === t && t._rodgerPrimeSuspect) {
            t._rodgerPrimeSuspect = false;
            Sound.play('get_rare', { vol: .45, priority: true });
            B.alliesOf(u).forEach(ally => {
              B.energy(ally, P.enReward);
              B.applyStatus(u, ally, 'haste', 5);
              B.fxSparkle(ally.x, ally.y - 45, 8, '#c7ddff');
            });
            const next = B.highestEnergy(B.enemiesOf(u));
            if (next && u.addClue) u.addClue(next, 3);
          }
        });

        B.after(S.dur, () => {
          if (t) t._rodgerPrimeSuspect = false;
          offCast();
          offDown();
        });
      }
    },
    P: {
      name: 'Observant Detective', type: 'Passive',
      v: { en: 12, bonusDmg: 95 },
      p: { chance: .15, perStack: .12, haste: .15 },
      desc: (S, P) => `<span class="sk-pas">Rodger gains +${Math.round(P.haste * 100)}% Skill Haste. Whenever a researched enemy begins casting, Rodger gains <em>${Math.round(S.en)}</em> Energy and has a ${Math.round(P.chance * 100)}% (+${Math.round(P.perStack * 100)}% per Clue) chance to interrupt and briefly 🔇 Silence them. Whenever an ally applies Crowd Control to an Investigated enemy, Rodger triggers an instant deduction, dealing <em>${Math.round(S.bonusDmg)}</em> magic damage and granting the ally +25% Critical Chance for 4s.</span>`,
      passive: (u, B, S, P) => {
        u.flat.cdr = (u.flat.cdr || 0) + P.haste;
        u.dirty = true;

        B.on(u, 'enemyCast', t => {
          const st = (u.research || {})[t.uid] || 0;
          if (!st) return;
          B.energy(u, S.en);
          if (chance(P.chance + P.perStack * st)) {
            B.interrupt(t);
            B.applyStatus(u, t, 'silence', 1.0);
            B.fxStatusOn(t, 'SilenceEffect', { sizeMul: .8 });
            B.fxFloatObject(t.x, t.y - 100, 'Magifyingglass', '#8fb4ff');
          }
        });

        // Ally CC synergy
        B.on(u, 'statusApplied', e => {
          if (!e) return;
          const tgt = e.unit || e.target;
          const src = e.src || e.source;
          const stId = e.id || e.status;
          if (!tgt || tgt.team === u.team) return;
          const sDef = STATUS[stId];
          if (sDef && sDef.cc && tgt.hasStatus('investigated')) {
            B.damage(u, tgt, S.bonusDmg + u.st.mag * 0.45, { type: 'magic' });
            B.fxSparkle(tgt.x, tgt.y - 40, 5, '#8fb4ff');
            if (src && src.team === u.team) {
              B.applyStatus(u, src, 'lucky', 4);
            }
          }
        });
      }
    },
    R: {
      name: 'Incontrovertible Evidence', type: 'Control',
      v: { deductionDmg: 110, penBonus: .25 },
      p: { max: 5, icd: 4, teamDmg: .10, teamHaste: .08 },
      desc: (S, P) => `<span class="sk-pas">Upon reaching ${P.max} Research (Case Closed), the target becomes permanently 🎯 Exposed (3 stacks) and all allies gain +${Math.round(S.penBonus * 100)}% Armor and Magic Penetration against them. Allied hits against this target trigger Rodger's <b>Deduction Strike</b> for <em>${Math.round(S.deductionDmg)}</em> bonus magic damage (0.35s ICD). When a Case Closed enemy falls, Rodger files their case in the <b>Master Archive</b>: all allies gain a permanent +${Math.round(P.teamDmg * 100)}% Damage and +${Math.round(P.teamHaste * 100)}% Skill Haste for the battle (stacks up to 3 times), and 3 Clues transfer to the highest-Energy survivor.</span>`,
      passive: (u, B, S, P) => {
        u._rodgerArchive = 0;

        // Deduction strikes on hit
        B.on(u, 'hit', e => {
          if (!e || !e.target || e.target.team === u.team || !e.target.alive) return;
          if ((u.research || {})[e.target.uid] >= P.max) {
            const now = B.t;
            if (e.target._rodgerDeductionIcd && now - e.target._rodgerDeductionIcd < 0.35) return;
            e.target._rodgerDeductionIcd = now;
            const dmg = S.deductionDmg + u.st.mag * 0.50;
            B.damage(u, e.target, dmg, { type: 'magic' });
            B.fxRing(e.target.x, e.target.y - 30, 45, '#8fb4ff', .2);
          }
        });

        // Enemy cast while at max research: objection interrupt
        B.on(u, 'enemyCast', t => {
          if ((u.research || {})[t.uid] < P.max) return;
          if (t._rodgerR_icd && B.t - t._rodgerR_icd < P.icd) return;
          t._rodgerR_icd = B.t;
          B.interrupt(t);
          B.applyStatus(u, t, 'silence', 1.2);
          Sound.play('guardbreak', { vol: .28, throttle: 300 });
          t.energy = Math.max(0, t.energy - 30);
          B.fxStatusOn(t, 'SilenceEffect', { sizeMul: .88 });
          B.fxFloatObject(t.x, t.y - 112, 'Magifyingglass', '#8fb4ff');
        });

        // Case closed enemy defeat -> Master archive
        B.on(u, 'enemyDown', e => {
          if (!e || (u.research || {})[e.uid] < P.max) return;
          if (u._rodgerArchive < 3) {
            u._rodgerArchive++;
            Sound.play('get_rare', { vol: .35 });
            B.alliesOf(u).forEach(a => {
              a.mult.dmg = (a.mult.dmg || 1) * (1 + P.teamDmg);
              a.flat.cdr = (a.flat.cdr || 0) + P.teamHaste;
              a.dirty = true;
              B.fxSparkle(a.x, a.y - 50, 10, '#c7ddff');
            });
          }
          const next = B.highestEnergy(B.enemiesOf(u));
          if (next && u.addClue) u.addClue(next, 3);
        });
      }
    }
  }
});

/* ============================================================ SOULVESTER
   Tank / Bruiser - S Tier. Max HP feeds Armor, Armor feeds Attack. */
defHero({
  id: 'Soulvester', name: 'Soulvester', folder: 'Soulvester', file: 'Soulvester', icon: 'Soulvester',
  role: 'Tank', tier: 'S', element: 'Steel',
  blurb: 'Does not need to be fast. His whole plan is staying in the fight and becoming harder to remove every second he does.',
  base: { hp: 5750, atk: 285, def: 355, mag: 130, mdef: 262, spd: 92, acc: 170, eva: 82 },
  hidden: { range: 185, aspd: .82, ms: 56, aggro: 1.9, crit: .05, critDmg: 1.45, healPow: 1, shieldPow: 1.30,
    cdr: .05, ccRes: .25, kbRes: .75, armorPen: 0, magPen: 0 },
  growth: { hp: .112, atk: .082, def: .104, mag: .050, mdef: .090 },
  move: { gait: 'trudge', bob: 3, freq: 1.1, lean: 3, squash: .03, idle: 'tap', step: 'step_metal',
    particles: 'dust', pcol: '#9aa2ad', trail: { on: false }, brake: .7, weight: 1.4 },
  basic: { name: 'Armored Slam', type: 'physical', ratio: 1.05, range: 185, sfx: 'swing_heavy', hit: 'hit_blunt', animStyle: 'soulvesterSlam',
    wind: .2, note: 'Every swing lands like a door closing.',
    onHit: (u, t, B) => B.fxSoulvesterSkill('slam', u, { target: t }) },
  skills: {
    W: {
      name: 'Knightly Armor', type: 'Defense', energy: 100,
      v: { hpToDef: .07, defToAtk: .16, dur: 5 }, p: {},
      desc: (S, P) => `<span class="sk-pas">Soulvester is immune to ranged Basic Attacks. At the start of each wave, he raises a brief guard around the team while reinforcing his own armor. A share of his Max HP is folded into Armor, and a share of that Armor into Attack.</span>
        Active: reinforces his armor, gaining Armor and Magic Defense, and takes 30% less damage for ${S.dur}s.`,
      passive: (u, B, S) => {
        u.rangedImmune = true;
        B.after(.24, () => {
          if (!u.alive) return;
          B.alliesOf(u).forEach(a => B.applyStatus(u, a, 'ward', 2.8));
          B.applyStatus(u, u, 'fortify', 3.8, { stacks: 2 });
          B.fxRing(u.x, u.y - 42, 300, '#c9d0da', .5);
          B.fxFloatIcon(u.x, u.y - 104, '🛡', '#c9d0da');
        });
        // Derived from baseStats (fixed) rather than the live, already-boosted
        // st.def/st.atk - a chain that fed off its own output would compound
        // every tick instead of settling on one stable bonus.
        B.every(u, 1, () => {
          const hpArmor = u.max.hp * S.hpToDef;
          const armorAtk = (u.baseStats.def + hpArmor) * S.defToAtk;
          u.flat.defP = hpArmor / Math.max(1, u.baseStats.def);
          u.flat.atkP = armorAtk / Math.max(1, u.baseStats.atk);
          u.dirty = true;
        });
      },
      cast: (u, B, S) => {
        B.anim(u, 'cast', .62, 'soulvesterArmor');
        Sound.play('guard', { vol: .48 });
        B.fxSoulvesterSkill('armor', u, { phase: 'cast', dur: S.dur });
        B.applyStatus(u, u, 'fortify', S.dur, { stacks: 3 });
        B.applyStatus(u, u, 'ward', S.dur);
        B.after(.28, () => { if (u.alive) B.fxSoulvesterSkill('armor', u, { phase: 'lock', dur: S.dur }); });
      }
    },
    G: {
      name: "A Knight's Duty", type: 'Defense', cd: 12,
      v: { redirect: .35, armorPer: .35 }, p: { dur: 6 },
      desc: (S, P) => `Soulvester guards the lowest-HP ally for ${P.dur}s, redirecting <em>${pcn(S.redirect * 100)}</em> of the damage they take to himself. He gains Armor from every point redirected - more the lower that ally's HP is.`,
      ai: { prio: 56, cond: (u, B) => B.alliesOf(u).some(a => a !== u && a.hpPct < .6) },
      cast: (u, B, S, P) => {
        const t = B.lowestHp(B.alliesOf(u).filter(a => a !== u)); if (!t) return;
        B.anim(u, 'cast', .58, 'soulvesterGuard');
        Sound.play('guard', { vol: .44 });
        B.fxSoulvesterSkill('guard', u, { target: t, phase: 'cast', dur: P.dur });
        // Reduce t's incoming damage before it lands (statuses can still see
        // the smaller amount) and route the removed share onto Soulvester
        // himself as a separate true-damage hit, same trick shields use to
        // move damage onto a shieldlink target.
        const off = B.on(t, 'damaged', ev => {
          if (ev.dot || ev.redirected || !u.alive) return;
          const moved = ev.amount * S.redirect;
          ev.amount -= moved;
          const bonus = moved * (1 + (1 - t.hpPct)) * .02;
          u.flat.defP2 = (u.flat.defP2 || 0) + bonus / Math.max(1, u.baseStats.def); u.dirty = true;
          B.fxSoulvesterSkill('redirect', u, { target: t, moved });
          B.after(0, () => B.damage(ev.src, u, moved, { type: 'true', redirected: true, tag: "A Knight's Duty" }));
        });
        B.after(P.dur, off);
      }
    },
    B: {
      name: 'Soul Sword', type: 'Physical Damage', cd: 10,
      v: { ratio: .7, hpRatio: .06, ghost: .35 }, p: { dur: 4 },
      desc: (S, P) => `Strikes the highest-Attack enemy for <em>${pcn(S.ratio * 100)}</em> Attack plus <em>${pcn(S.hpRatio * 100)}</em> of his Max HP, slowing their Attack Speed and Move Speed based on his Armor. For ${P.dur}s, his Basic Attacks against that enemy also deal Ghost damage based on his Magic Defense.`,
      ai: { prio: 50, cond: () => true },
      passive: (u, B, S) => {
        // registered once, not per-cast - reads u._soulTarget/_soulUntil (set
        // fresh by every cast below) so repeated casts don't stack listeners
        B.on(u, 'basicHit', ev => {
          if (!u._soulTarget || ev.target.uid !== u._soulTarget || B.t > (u._soulUntil || 0)) return;
          B.damage(u, ev.target, u.st.mdef * S.ghost, { type: 'true', tag: 'Soul Sword' });
        });
      },
      cast: (u, B, S, P) => {
        const t = B.highestStat(B.enemiesOf(u), 'atk'); if (!t) return;
        B.anim(u, 'wind', .55, 'soulvesterSword');
        Sound.play('swing_heavy', { vol: .44 });
        B.fxSoulvesterSkill('sword', u, { target: t, phase: 'cast' });
        B.after(.22, () => {
          Sound.play('hit_heavy', { vol: .52 }); B.hitstop(80); B.shake(8, .2);
          B.fxSlash(u, t, { col: '#c9d0da', ang: -15, big: true });
          B.damage(u, t, u.st.atk * S.ratio + u.max.hp * S.hpRatio, { type: 'physical', tag: 'Soul Sword' });
          B.applyStatus(u, t, 'slow', 4, { stacks: Math.min(3, Math.round(u.st.def / 150)) });
          u._soulTarget = t.uid; u._soulUntil = B.t + P.dur;
          B.fxSoulvesterSkill('sword', u, { target: t, phase: 'impact' });
        });
      }
    },
    P: {
      name: 'Unshaken', type: 'Passive',
      v: { atk: .12, def: .10, mdef: .10, aspd: .12, dr: .10 }, p: { thresholds: [.75, .5, .25] },
      desc: (S, P) => `Whenever Soulvester crosses ${P.thresholds.map(t => pc(t)).join(' / ')} Max HP, he gains a permanent combat bonus for the rest of the battle - Attack, then Armor and Magic Defense, then Attack Speed and Damage Reduction. Each threshold triggers once.`,
      passive: (u, B, S, P) => {
        u._unshaken = P.thresholds.slice();
        B.on(u, 'damaged', () => {
          if (!u._unshaken.length || !u.alive) return;
          if (u.hpPct > u._unshaken[0]) return;
          const idx = P.thresholds.length - u._unshaken.length;
          u._unshaken.shift();
          Sound.play('guard', { vol: .38 }); B.fxSoulvesterSkill('unshaken', u, { index: idx });
          if (idx === 0) u.flat.atkP2 = S.atk;
          else if (idx === 1) { u.flat.defP3 = S.def; u.flat.mdefP2 = S.mdef; }
          else { u.flat.aspdP = S.aspd; u.flat.dmgTaken3 = -S.dr; }
          u.dirty = true;
        });
      }
    },
    R: {
      name: "Soulvester's Resolve", type: 'Survival',
      v: { heal: .18, atk: .16, def: .16, mdef: .16 }, p: { thr: .20, dur: 6 },
      desc: (S, P) => `When Soulvester drops below ${pc(P.thr)} Max HP, he immediately heals a share of his Max HP and gains a burst of Attack, Armor and Magic Defense for ${P.dur}s - stronger the more HP he was missing. Once per battle.`,
      passive: (u, B, S, P) => {
        B.on(u, 'damaged', () => {
          if (u._resolveUsed || u.hpPct > P.thr || !u.alive) return;
          u._resolveUsed = true;
          const missing = 1 - u.hpPct;
          B.anim(u, 'cast', .78, 'soulvesterResolve');
          Sound.play('guard', { vol: .5 }); B.shake(10, .3); B.flash('#c9d0da', .25, .35);
          B.fxSoulvesterSkill('resolve', u, { phase: 'cast', missing });
          B.heal(u, u, u.max.hp * S.heal * (1 + missing), { tag: "Soulvester's Resolve" });
          u.flat.atkP4 = S.atk * (1 + missing); u.flat.defP4 = S.def * (1 + missing); u.flat.mdefP3 = S.mdef * (1 + missing);
          u.dirty = true;
          B.after(.28, () => { if (u.alive) B.fxSoulvesterSkill('resolve', u, { phase: 'impact', missing }); });
          B.after(P.dur, () => { u.flat.atkP4 = 0; u.flat.defP4 = 0; u.flat.mdefP3 = 0; u.dirty = true; });
        });
      }
    }
  }
});

/* ============================================================ GOURDY
   Control / Support - B Tier. Gives you something random; every result matters. */
const GOURDY_TREATS = [
  { name: 'Attack', icon: '⚔', status: 'atkup' },
  { name: 'Speed', icon: '🏃', status: 'speedup' },
  { name: 'Defense', icon: '🧱', status: 'fortify' },
  { name: 'Magic Defense', icon: '🔰', status: 'mdefup' },
  { name: 'Critical Chance', icon: '🎯', status: 'lucky' },
  { name: 'Mana Regen', icon: '💨', status: 'overcharge' }
];
const GOURDY_TRICKS = [
  { name: 'Attack', icon: '🥀', status: 'attackdown' },
  { name: 'Attack Speed', icon: '🫳', status: 'armslow' },
  { name: 'Movement Speed', icon: '🐢', status: 'slow' },
  { name: 'Defense', icon: '💔', status: 'defdown' },
  { name: 'Resist', icon: '🪫', status: 'magdown' },
  { name: 'Mana', icon: '🕳', status: 'drain' }
];
defHero({
  id: 'Gourdy', name: 'Gourdy', folder: 'Gourdy', file: 'Gourdy', icon: 'Gourdy',
  role: 'Support', tier: 'B', element: 'Pumpkin',
  blurb: "Gives you something random. You don't control what you get, but every sweet result changes the fight.",
  base: { hp: 4200, atk: 120, def: 235, mag: 360, mdef: 280, spd: 104, acc: 190, eva: 130 },
  hidden: { range: 255, aspd: .95, ms: 75, aggro: .55, crit: .08, critDmg: 1.5, healPow: 1.25, shieldPow: 1.25,
    cdr: .14, ccRes: .22, kbRes: .35, armorPen: 0, magPen: .08 },
  growth: { hp: .092, atk: .055, def: .085, mag: .082, mdef: .088 },
  move: { gait: 'bounce', bob: 9, freq: 1.8, lean: 5, squash: .08, idle: 'shake', step: 'bounce',
    particles: 'confetti', pcol: '#ff9d4d', trail: { on: false }, brake: .3 },
  basic: { name: 'Pumpkin Candy Toss', type: 'magic', ratio: .65, range: 255, proj: 'orb', pcol: '#ff9d4d',
    sfx: 'throwsomething', hit: 'hit_light', wind: .2, note: "Sweet pumpkin candy tossed with care.",
    onHit: (u, t, B) => {
      if (chance(.25)) {
        if (chance(.5)) B.gourdyTrick(u, t, 1);
        else {
          const a = B.lowestHp(B.alliesOf(u));
          if (a) B.gourdyTreat(u, a, .6);
        }
      }
    }
  },
  skills: {
    W: {
      name: 'Spooky Treat Extravaganza', type: 'Support / Magic Damage', energy: 100,
      v: { ratio: .85, heal: .08 }, p: { radius: 360, duration: 9 },
      desc: (S, P) => `<span class="sk-pas">Basic Attacks have a 25% chance to slip a Trick onto enemies or toss a Treat to an ally.</span>
        Active: Gourdy dumps his glowing pumpkin bucket! Every ally gains a random Treat for <em>${P.duration}s</em>, heals for <em>${pcn(S.ratio * 100)}</em> Magic + ${pcn(S.heal * 100)} Max HP, and gains 18 Energy. Nearby enemies take <em>${pcn(S.ratio * 100)}</em> Magic Damage, suffer a random Trick, and are rooted in pumpkin vines for 1.5s.`,
      passive: () => {},
      cast: (u, B, S, P) => {
        B.anim(u, 'cast', .78, 'gourdyTreat');
        Sound.play('get_item');
        Sound.play('candy_pop', { vol: .6 });
        B.fxGourdyTreatCast(u);
        if (B.fxGourdyCandyFountain) B.fxGourdyCandyFountain(u.x, u.y);
        const allies = B.alliesOf(u);
        const foes = B.enemiesOf(u).filter(e => B.distance(e, u) < P.radius);
        B.after(.18, () => {
          if (!u.alive) return;
          B.fxConfetti(u.x, u.y - 60, 24);
          allies.filter(a => a.alive).forEach(a => {
            B.gourdyTreat(u, a, P.duration / 8);
            B.heal(u, a, u.st.mag * S.ratio + u.max.hp * S.heal, { tag: 'Pumpkin Treat' });
            B.energy(a, 18);
          });
          foes.filter(e => e.alive).forEach(e => {
            B.damage(u, e, u.st.mag * S.ratio, { type: 'magic', area: true, tag: 'Spooky Surprise' });
            B.applyStatus(u, e, 'root', 1.5);
            B.gourdyTrick(u, e, 1);
          });
        });
      }
    },
    G: {
      name: 'Sugar Rush & Harvest Cheer', type: 'Buff / Shield',
      v: { shield: .16 }, p: { rushDur: 7 },
      desc: (S, P) => `At battle start, grants all allies 🏃 Speed Up and 💨 Skill Haste for <em>${P.rushDur}s</em>. Whenever an ally gains a Treat or lands a critical hit, Candy Cascade accelerates the team with Speed Up and 6 Energy. Reaching full Mana or casting Spooky Extravaganza grants Gourdy and the lowest-HP ally a protective Candy Shield worth <em>${pcn(S.shield * 100)}</em> Max HP.`,
      passive: (u, B, S, P) => {
        const rush = (dur, smaller) => {
          if (smaller && B.t < (u._gourdyRushAt || 0) + .25) return;
          u._gourdyRushAt = B.t;
          const allies = B.alliesOf(u);
          if (!smaller && !u.casting && u.animStyle !== 'gourdyTreat') {
            B.anim(u, 'cast', .68, 'gourdyRush');
          }
          B.fxGourdyRush(u, allies, smaller);
          allies.forEach(a => {
            B.applyStatus(u, a, 'speedup', dur);
            B.applyStatus(u, a, 'haste', dur * .8);
            if (smaller) B.energy(a, 6);
          });
        };
        const grantShield = () => {
          const hurt = B.lowestHp(B.alliesOf(u)) || u;
          B.shield(u, u, u.max.hp * S.shield, 8);
          if (hurt !== u) B.shield(u, hurt, u.max.hp * S.shield, 8);
          Sound.play('sparkle', { vol: .4 });
        };
        B.after(.2, () => rush(P.rushDur, false));
        B.on(u, 'gourdyTreat', () => rush(3, true));
        B.on(u, 'dealDamage', ev => { if (ev.crit) rush(2.5, true); });
        B.on(u, 'cast', ev => {
          if (ev.key === 'W') {
            rush(P.rushDur, false);
            grantShield();
          }
        });
        B.every(u, .25, () => {
          const full = u.energy >= u.energyMax;
          if (full && !u._gourdyFullMana) {
            rush(P.rushDur, false);
            grantShield();
          }
          u._gourdyFullMana = full;
        });
      }
    },
    B: {
      name: 'Mega Pumpkin Patch Slam', type: 'Control / Magic Damage', cd: 7,
      v: { ratio: 1.25 }, p: {},
      desc: (S) => `Heaves an enormous Jack-o'-Lantern into the enemy ranks for <em>${pcn(S.ratio * 100)}</em> Magic Damage. It prioritizes enemies holding a 🤝 Hug Line, breaking the link on impact. Targets are Stunned for 1.5s, rooted in pumpkin vines for 2s, and suffer two random Tricks. If Mrs. Holloway or Mr. Holloway is in the party, Mother and Father's presence triggers a Spiral Harvest Detonation: dealing +40% bonus damage and restoring 25 Energy to Gourdy!`,
      ai: { prio: 50, cond: (u, B) => B.enemiesOf(u).length > 0 },
      cast: (u, B, S) => {
        const foes = B.enemiesOf(u);
        const linked = foes.filter(e => e.hasStatus('hugline'));
        const t = pick(linked.length ? linked : foes); if (!t) return;
        const hasFamily = B.alliesOf(u).some(a => a.id === 'MrsHolloway' || a.id === 'MrHolloway');
        B.anim(u, 'wind', .82, 'gourdyToss'); Sound.play('beam_charge', { vol: .24, throttle: 260 });
        B.after(.24, () => {
          if (!u.alive || !t.alive) return;
          B.anim(u, 'attack', .24, 'gourdyTossRelease'); Sound.play('throwsomething', { vol: .65 });
          B.fxArc(u, t, { kind: 'food', img: 'Pumpkin', size: 44 }, () => {
            const hitT = (t && t.alive) ? t : (B.nearest(t, B.enemiesOf(u)) || pick(B.enemiesOf(u)));
            if (!hitT || !hitT.alive) return;
            const dmgMult = hasFamily ? 1.40 : 1.0;
            B.damage(u, hitT, u.st.mag * S.ratio * dmgMult, { type: 'magic', area: true, tag: 'Mega Pumpkin Slam' });
            if (hasFamily) {
              B.energy(u, 25);
              Sound.play('spectral', { vol: .5 });
            }
            if (B.fxGourdyMegaPumpkin) B.fxGourdyMegaPumpkin(u, hitT, hasFamily);
            else B.fxGourdyPumpkinImpact(hitT, 'stun');
            Sound.play('pop2', { vol: .75 });
            B.applyStatus(u, hitT, 'stun', 1.5);
            B.applyStatus(u, hitT, 'root', 2);
            B.gourdyTrick(u, hitT, 1);
            B.gourdyTrick(u, hitT, 1);
            const hug = hitT.getStatus('hugline');
            if (hug) {
              const goob = hug.src;
              const line = goob && (goob.goobLines || []).find(item => item.target === hitT);
              if (line && typeof goobEndLine === 'function') goobEndLine(goob, line, B, false);
              else B.removeStatus(hitT, 'hugline');
              B.fxFloatIcon(hitT.x, hitT.y - 100, '🎃', '#ff9d4d');
            }
            // Splash Tricks to nearby foes
            B.enemiesOf(u).filter(e => e !== hitT && B.distance(e, hitT) < 160).forEach(e => {
              B.damage(u, e, u.st.mag * S.ratio * 0.45, { type: 'magic', area: true, tag: 'Pumpkin Splash' });
              B.gourdyTrick(u, e, 1);
            });
          });
        });
      }
    },
    P: {
      name: "Trickster's Harvest & Hollow Heritage", type: 'Passive / Defense',
      v: { base: .25, perCdr: .35 }, p: {},
      desc: (S) => `Treats granted to allies grant +15% Tenacity (CC Resistance) and 15% Damage Reduction. Enemies with Tricks take +18% increased damage from all sources. When Trick or Treat lands, there is a chance for a second one to land. Once every 12s when an ally falls below 40% HP, Gourdy tosses an emergency Guardian Candy granting a 20% Max HP Shield and Cleansing 2 debuffs.`,
      passive: (u, B, S) => {
        u._gourdyLucky = S;
        u._gourdyEmergencyCd = 0;
        B.on(u, 'allyDamaged', ev => {
          if (!ev.unit || !ev.unit.alive || ev.unit.hpPct >= .40 || B.t < u._gourdyEmergencyCd) return;
          u._gourdyEmergencyCd = B.t + 12;
          B.shield(u, ev.unit, u.max.hp * .20, 8);
          B.cleanse(ev.unit, 2);
          Sound.play('sparkle', { vol: .5 });
          B.fxFloatIcon(ev.unit.x, ev.unit.y - 100, '🍬🛡', '#ffd166');
        });
      }
    },
    R: {
      name: "The Great Halloween Miracle", type: 'Battle Opener',
      v: {}, p: { thr: .5, trickDur: 5 },
      desc: (S, P) => `Trick or Treat rolls three Treats per ally, picking the optimal one for their current stats; the two leftovers become flying pumpkin bombs that crash down on enemies for Magic Damage and Tricks for ${P.trickDur}s. In addition, all allies gain permanent +15% Energy Generation for the entire fight.`,
      passive: (u, B, S, P) => {
        u._gourdyLuck = Object.assign({}, u._gourdyLucky || {}, P, {
          trickDur: P.trickDur,
          red: true
        });
        B.after(.25, () => {
          B.alliesOf(u).forEach(a => {
            a.flat.energyGenP = (a.flat.energyGenP || 0) + .15;
            a.dirty = true;
          });
        });
      }
    }
  }
});

/* ============================================================ ECLIPSE
   DPS - S Tier. Hunts whatever's already wounded, and gets worse to fight the longer it lasts. */
defHero({
  id: 'Eclipse', name: 'Eclipse', folder: 'Eclipse', file: 'Eclipse', icon: 'Eclipse',
  role: 'Damage', tier: 'S', element: 'Moon',
  blurb: 'Calm until something is wounded. Then she is not calm at all.',
  base: { hp: 4050, atk: 485, def: 238, mag: 130, mdef: 210, spd: 142, acc: 220, eva: 170 },
  hidden: { range: 180, aspd: 1.10, ms: 96, aggro: 1.05, crit: .18, critDmg: 1.7, healPow: 1, shieldPow: 1,
    cdr: .11, ccRes: .20, kbRes: .36, armorPen: .18, magPen: 0 },
  growth: { hp: .088, atk: .112, def: .080, mag: .050, mdef: .074 },
  move: { gait: 'skitter', bob: 5, freq: 2.8, lean: 8, squash: .06, idle: 'jitter', step: 'step_soft',
    particles: 'dust', pcol: '#8a6bff', trail: { on: true, col: '#8a6bff', rate: .08 }, brake: .5, jitter: 1.6 },
  basic: { name: 'Claw Rake', type: 'physical', ratio: 1.02, range: 180, sfx: 'swing_light', hit: 'hit_slash',
    wind: .12, animStyle: 'eclipseRake', note: 'Faster and meaner once something is already hurt.',
    onHit: (u, t, B) => {
      u._eclipseRendAt = u._eclipseRendAt || {};
      if (B.t >= (u._eclipseRendAt[t.uid] || 0)) {
        u._eclipseRendAt[t.uid] = B.t + 5;
        B.crackShield(u, t, .12, { color: '#8a6bff' });
        B.dispel(t, 1);
        B.applyStatus(u, t, 'grief', 3.5);
      }
      const low = t.hpPct < (u._eclipseThr || .3);
      if (low) {
        u.focus = t.uid; u.eclipseFocusTarget = t;
        B.applyStatus(u, t, 'marked', 6.5);
        B.applyStatus(u, t, 'exposed', 4.5);
        B.fxFloatIcon(t.x, t.y - 90, '🌘');
      }
      if (u.hasStatus('blackout')) {
        u._eclipseBlackoutHits = (u._eclipseBlackoutHits || 0) + 1;
        B.applyStatus(u, t, 'bleed', 4.5, { stacks: 1, val: u.st.atk * .065 });
        if (u._eclipseBlackoutHits % 2 !== 0) return;
        B.after(.08, () => { if (t.alive) { Sound.play('hit_slash', { vol: .4 });
          B.damage(u, t, u.st.atk * .42, { type: 'physical', tag: 'Blackout Claw' });
          B.applyStatus(u, t, 'bleed', 4.5, { stacks: 1, val: u.st.atk * .065 }); } });
      }
    } },
  skills: {
    W: {
      name: 'Moonlit Hunt', type: 'Physical Damage', energy: 100,
      v: { ratio: .64, dmgBonus: .34, bleed: .06 }, p: { thr: .34, hits: 5, dur: 5, ramp: .08 },
      desc: (S, P) => `<span class="sk-pas">Eclipse deals <em>${pcn(S.dmgBonus * 100)}</em> more non-Damage-over-Time damage to enemies below ${pc(P.thr)} HP. Her Basic Attacks Mark and Focus prey below that threshold, making her ordinary attacks prioritize it. When Focused prey is KO'd, Focus immediately shifts to the enemy with the lowest HP.</span>
        Active: Eclipse lunges to the lowest-HP enemy, striking ${P.hits} times for <em>${pcn(S.ratio * 100)}</em> Attack each. Each successive strike grows <em>${pcn(P.ramp * 100)}</em> stronger, applies Rend for <em>${pcn(S.bleed * 100)}</em> Attack, and can retarget a new low-HP enemy if the original prey falls. She then returns to her exact starting position, gains 3 stacks of Attack Speed and Move Speed plus Haste for ${P.dur}s, and enters 🌑 Blackout.
        <span class="sk-pas">Blackout: Basic Attacks deal additional Physical Damage, apply Rend, and every second claw strike creates an extra claw hit.</span>`,
      passive: (u, B, S, P) => {
        u._eclipseThr = P.thr;
        B.on(u, 'dealDamage', ev => { if (!ev.dot && ev.target.hpPct < P.thr) ev.amount *= 1 + S.dmgBonus; });
        B.on(u, 'enemyDown', e => {
          if (u.focus === (e && e.uid)) {
            const next = B.lowestHp(B.enemiesOf(u));
            u.focus = next ? next.uid : null; u.eclipseFocusTarget = next || null;
          }
        });
      },
      cast: (u, B, S, P) => {
        const t = B.lowestHp(B.enemiesOf(u)); if (!t) return;
        const start = u.x;
        const startDepth = u.depth;
        u.face = t.x >= u.x ? 1 : -1;
        u.focus = t.uid; u.eclipseFocusTarget = t; B.applyStatus(u, t, 'marked', P.dur + 2);
        B.anim(u, 'cast', .48, 'eclipseHunt'); Sound.play('spectral', { vol: .28 }); Sound.play('dash');
        B.fxEclipseSkill('hunt', u, { target: t }); B.blink(u, t.x - u.face * 40, t.depth);
        B.repeat(P.hits, .1, i => {
          const victim = t.alive ? t : B.lowestHp(B.enemiesOf(u));
          if (!victim) return;
          u.face = victim.x >= u.x ? 1 : -1;
          Sound.play('hit_slash', { vol: .5, throttle: 10 }); B.fxEclipseSkill('rake', u, { target: victim, index: i });
          B.damage(u, victim, u.st.atk * S.ratio * (1 + i * P.ramp), { type: 'physical', tag: 'Moonlit Hunt' });
          B.applyStatus(u, victim, 'bleed', 4.5, { stacks: 1, val: u.st.atk * S.bleed });
          if (victim.hpPct < P.thr) B.applyStatus(u, victim, 'marked', P.dur + 2);
        });
        B.after(P.hits * .1 + .05, () => {
          u.x = start; u.depth = startDepth; u.moving = false;
          B.fxEclipseSkill('return', u); B.applyStatus(u, u, 'speedup', P.dur, { stacks: 3 });
          B.applyStatus(u, u, 'haste', P.dur, { stacks: 1 });
          B.applyStatus(u, u, 'blackout', P.dur); Sound.play('beam_charge', { vol: .26 });
        });
      }
    },
    G: {
      name: 'Moon Rush', type: 'Physical Damage', cd: 9,
      v: { ratio: .52, leap: .78, kb: 78, darkBonus: .45, darkLeap: .35 }, p: { dur: 4, bleed: 4 },
      desc: (S, P) => `Charges toward the lowest-HP enemy, hitting every enemy in her path for <em>${pcn(S.ratio * 100)}</em> Attack and applying Rend. She then leaps onto her target for <em>${pcn(S.leap * 100)}</em> more, Marks them, and Knocks them Back. Eclipse gains 2 stacks of Attack Speed and Move Speed plus Haste for ${P.dur}s. During 🌑 Blackout, the charge deals <em>${pcn(S.darkBonus * 100)}</em> more damage, applies extra Rend and Expose to enemies it catches, and the leap deals <em>${pcn(S.darkLeap * 100)}</em> more damage and applies Defense Down.`,
      ai: { prio: 54, cond: () => true },
      cast: (u, B, S, P) => {
        const t = B.lowestHp(B.enemiesOf(u)); if (!t) return;
        const dark = u.hasStatus('blackout');
        u.face = t.x >= u.x ? 1 : -1;
        B.anim(u, 'cast', .45, 'eclipseRush'); Sound.play('dash'); B.fxEclipseSkill('rush', u, { target: t });
        const hit = new Set();
        B.dash(u, t.x - u.face * 40, .3, { depth: t.depth, onMove: () => B.enemiesOf(u).forEach(e => {
          if (hit.has(e) || B.distance(e, u) > 50) return; hit.add(e);
          Sound.play('hit_light', { vol: .5, throttle: 12 });
          B.damage(u, e, u.st.atk * S.ratio * (dark ? 1 + S.darkBonus : 1), { type: 'physical', tag: 'Moon Rush' });
          B.applyStatus(u, e, 'bleed', P.bleed, { stacks: dark ? 2 : 1, val: u.st.atk * .05 });
          if (dark) B.applyStatus(u, e, 'exposed', 3.5);
        }) });
        B.after(.32, () => {
          if (!t.alive) return;
          Sound.play('hit_heavy'); B.fxEclipseSkill('pounce', u, { target: t });
          B.damage(u, t, u.st.atk * S.leap * (dark ? 1 + S.darkLeap : 1), { type: 'physical', tag: 'Moon Rush' });
          B.knockback(u, t, S.kb);
          B.applyStatus(u, t, 'marked', 5.5);
          if (dark) B.applyStatus(u, t, 'defdown', 4, { stacks: 2 });
        });
        B.applyStatus(u, u, 'speedup', P.dur, { stacks: 2 }); B.applyStatus(u, u, 'haste', P.dur, { stacks: 1 });
      }
    },
    B: {
      name: 'Savage Swipe', type: 'Physical Damage', cd: 6,
      v: { ratio: .46, finisher: .78, cleave: 1.12 }, p: { bleed: 4.5, bleedRatio: .055, slowDur: 1.8 },
      desc: (S, P) => `Rapidly slashes the closest enemy three times for <em>${pcn(S.ratio * 100)}</em> Attack each. Every hit applies Rend; the final strike deals <em>${pcn(S.finisher * 100)}</em> more and applies Defense Down. During 🌑 Blackout, the final strike also damages nearby enemies for <em>${pcn(S.cleave * 100)}</em> cleave, Rends them, and Slows them for ${P.slowDur}s.`,
      ai: { prio: 50, cond: () => true },
      cast: (u, B, S, P) => {
        const t = B.nearest(u, B.enemiesOf(u)); if (!t) return;
        const dark = u.hasStatus('blackout');
        B.anim(u, 'cast', .42, 'eclipseSwipe'); Sound.play('sweep', { vol: .4 });
        B.repeat(3, .1, i => {
          if (!t.alive) return;
          Sound.play('hit_slash', { vol: .45, throttle: 8 }); B.fxEclipseSkill('swipe', u, { target: t, index: i });
          const last = i === 2;
          B.damage(u, t, u.st.atk * S.ratio * (last ? 1 + S.finisher : 1), { type: 'physical', tag: 'Savage Swipe' });
          B.applyStatus(u, t, 'bleed', P.bleed, { stacks: last ? 2 : 1, val: u.st.atk * P.bleedRatio });
          if (last) B.applyStatus(u, t, 'defdown', 4.5, { stacks: 1 });
          if (last && dark) B.enemiesOf(u).forEach(e => { if (e !== t && B.distance(e, u) < 170) {
            B.damage(u, e, u.st.atk * S.ratio * S.cleave, { type: 'physical', tag: 'Savage Swipe' });
            B.applyStatus(u, e, 'bleed', P.bleed, { stacks: 1, val: u.st.atk * (P.bleedRatio * .8) });
            B.applyStatus(u, e, 'slow', P.slowDur);
          } });
        });
      }
    },
    P: {
      name: "Predator's Instinct", type: 'Passive',
      v: { dmg: .24, returnRatio: .62, crackShield: .12 }, p: { en: 35, dur: 5, cdr: 1.8, griefDur: 3.5 },
      desc: (S, P) => `Deals <em>${pcn(S.dmg * 100)}</em> more damage to enemies below the Moonlit Hunt threshold, Marks them, and keeps Eclipse Focused on them; her attacks cannot be evaded by her Focused prey. Every 5s per target, her Basic Attacks also crack <em>${pcn(S.crackShield * 100)}</em> of an active Shield, strip one removable buff, and apply 🥺 Grief for ${P.griefDur}s. When an enemy phases out and returns, Eclipse strikes them once for <em>${pcn(S.returnRatio * 100)}</em> Attack. Whenever Eclipse personally KOs an enemy, she gains ${Math.round(P.en)} Energy, 2 stacks of Attack Speed, Haste, and ${P.cdr}s cooldown recovery for her other skills.`,
      passive: (u, B, S, P) => {
        u.antiDodge = target => !!(target && target === u.eclipseFocusTarget);
        u._eclipsePhaseAt = u._eclipsePhaseAt || {};
        B.on(u, 'statusExpired', ev => {
          const t = ev.unit;
          if (!t || t.team === u.team || !['untargetable', 'stealth'].includes(ev.id) || !t.alive || B.t < (u._eclipsePhaseAt[t.uid] || 0)) return;
          u._eclipsePhaseAt[t.uid] = B.t + 4;
          B.damage(u, t, u.st.atk * S.returnRatio, { type: 'physical', tag: 'Predator’s Return' });
          B.applyStatus(u, t, 'grief', P.griefDur);
          B.fxEclipseSkill('rake', u, { target: t });
        });
        B.on(u, 'dealDamage', ev => {
          if (ev.dot || !ev.target || ev.target.hpPct >= (u._eclipseThr || .3)) return;
          ev.amount *= 1 + S.dmg;
          u.focus = ev.target.uid; u.eclipseFocusTarget = ev.target;
          B.applyStatus(u, ev.target, 'marked', P.dur + 1);
        });
        B.on(u, 'enemyDown', e => {
          if (!e || e._lastHitBy !== u) return;
          B.energy(u, P.en); B.applyStatus(u, u, 'speedup', P.dur, { stacks: 2 });
          B.applyStatus(u, u, 'haste', P.dur, { stacks: 1 }); B.reduceCd(u, P.cdr);
        });
      }
    },
    R: {
      name: 'Total Eclipse', type: 'Transformation',
      v: { atk: .30, aspd: .24, ms: .24, hp: .26, cleave: .55, crit: .12 }, p: { extend: 3, en: 25 },
      desc: (S, P) => `At the start of 🌑 Blackout, Eclipse transforms into her werewolf form. She gains <em>${pcn(S.atk * 100)}</em> Attack, <em>${pcn(S.aspd * 100)}</em> Attack Speed, <em>${pcn(S.ms * 100)}</em> Movement Speed, <em>${pcn(S.hp * 100)}</em> Max HP, and <em>${pcn(S.crit * 100)}</em> Critical Chance. Her Basic Attacks gain <em>${pcn(S.cleave * 100)}</em> Physical damage, hit nearby enemies, and spread Rend. Eclipse cannot have her Movement Speed reduced during Blackout. Whenever she personally KOs an enemy during Blackout, she restores ${Math.round(P.en)} Energy, gains a burst of Speed, and extends the transformation by ${P.extend}s. When Blackout ends, she returns to normal form.`,
      passive: (u, B, S, P) => {
        // statusApplied/statusExpired broadcast to every listener regardless of
        // whose status it is (see Battle.emitAll) - filter to Eclipse's own.
        B.on(u, 'statusApplied', ev => {
          if (ev.unit !== u || ev.id !== 'blackout' || u._eclipseForm) return;
          u._eclipseForm = true;
          B.anim(u, 'cast', .62, 'eclipseBlackout');
          Sound.play('grow', { vol: .34 }); Sound.play('beam_charge', { vol: .3 }); B.fxEclipseSkill('blackout', u, { dur: 2.5 }); B.shake(4, .16);
          u.flat.atkP3 = S.atk; u.flat.aspdP2 = S.aspd; u.flat.msP2 = S.ms; u.flat.hpP2 = S.hp; u.flat.crit2 = S.crit;
          B.applyStatus(u, u, 'eclipsefooting', 999);
          u.dirty = true;
          if (u.imgEl) { const src = u.artSrc || Art.unit(u.id, u.twisted); u.imgEl.src = src.replace('Eclipse.png', 'Eclipse_TRANSFORM.png'); }
        });
        B.on(u, 'basicHit', ev => {
          if (!u._eclipseForm) return;
          B.enemiesOf(u).forEach(e => { if (e !== ev.target && B.distance(e, u) < 175) {
            B.damage(u, e, u.st.atk * S.cleave, { type: 'physical', tag: 'Total Eclipse' });
            B.applyStatus(u, e, 'bleed', 4.5, { stacks: 1, val: u.st.atk * .055 });
          } });
        });
        B.on(u, 'enemyDown', e => {
          if (!u._eclipseForm || !e || e._lastHitBy !== u) return;
          B.energy(u, P.en);
          const s = u.statuses.find(st => st.id === 'blackout'); if (s) s.t += P.extend;
          B.applyStatus(u, u, 'speedup', 3.5, { stacks: 2 });
          B.fxFloatIcon(u.x, u.y - 105, '🌑', '#8a6bff');
        });
        B.on(u, 'statusExpired', ev => {
          if (ev.unit !== u || ev.id !== 'blackout' || !u._eclipseForm) return;
          u._eclipseForm = false;
          B.fxEclipseSkill('return', u); Sound.play('spectral', { vol: .18 });
          B.removeStatus(u, 'eclipsefooting');
          u.flat.atkP3 = 0; u.flat.aspdP2 = 0; u.flat.msP2 = 0; u.flat.hpP2 = 0; u.flat.crit2 = 0; u._eclipseBlackoutHits = 0; u.dirty = true;
          if (u.imgEl) u.imgEl.src = u.artSrc || Art.unit(u.id, u.twisted);
        });
      }
    }
  }
});

/* ============================================================ SPROUT
   Healer / Support - SS Tier. Emergency healer who watches his allies' HP
   at all times and intervenes the moment anyone needs help. Baking is how
   he helps. Every heal is a freshly made treat. */
defHero({
  id: 'Sprout', name: 'Sprout', folder: 'Sprout', file: 'Sprout', icon: 'Sprout',
  role: 'Support', tier: 'SS', element: 'Craft',
  blurb: 'Overprotective to a fault. Sprout is always watching, and he will not let anyone go down without doing everything he can.',
  base: { hp: 3500, atk: 108, def: 220, mag: 335, mdef: 290, spd: 116, acc: 160, eva: 122 },
  hidden: { range: 250, aspd: .82, ms: 76, aggro: .35, crit: .04, critDmg: 1.30,
    healPow: 1.55, shieldPow: 1.10, cdr: .10, ccRes: .15, kbRes: .25, armorPen: 0, magPen: 0 },
  growth: { hp: .085, atk: .044, def: .082, mag: .096, mdef: .091 },
  move: { gait: 'walk', bob: 3.5, freq: 1.2, lean: 2, squash: .02, idle: 'look', step: 'step',
    particles: 'none', pcol: '#f4a261', trail: { on: false }, brake: .35 },
  basic: { name: 'Baked Sweets', type: 'magic', ratio: .28, range: 250, proj: 'orb', pcol: '#f4a261',
    sfx: 'throwsomething', hit: 'hit_magic', wind: .15 },
  skills: {
    W: {
      name: 'Baked Sweets', type: 'Healing', energy: 100,
      v: { heal: .46, healLow: .68, lowThreshold: .40 },
      p: { triageThreshold: .70, triageHeal: .14, triageLowBonus: .08 },
      desc: (S, P) => `<span class="sk-pas">Sprout always knows his allies' HP. When any ally drops below ${pc(P.triageThreshold)} HP, his next Basic Attack instead rushes a treat to that ally, healing them for ${pc(P.triageHeal)} of their Max HP (${pc(P.triageHeal + P.triageLowBonus)} if below 50%).</span>
        <b>Active:</b> Sprout immediately gives the lowest-HP ally a freshly made treat, healing for ${pc(S.heal)} of their Max HP. Increased to ${pc(S.healLow)} if they are below ${pc(S.lowThreshold)} HP.`,
      cast: (u, B, S) => {
        const ally = B.alliesOf(u).sort((a, b) => a.hpPct - b.hpPct)[0];
        if (!ally) return;
        B.anim(u, 'cast', .4);
        const ratio = ally.hpPct < S.lowThreshold ? S.healLow : S.heal;
        B.fxSproutSkill('bake', u, ally);
        B.heal(u, ally, ally.max.hp * ratio, { tag: 'Baked Sweets' });
        B.fxFloatIcon(ally.x, ally.y - 90, '🍰');
        B.fxSparkle(ally.x, ally.y - 50, 8, '#f4a261');
        if (u._tryHpBoost) u._tryHpBoost(ally);
        Sound.play('heal');
      },
      passive: (u, B, S, P) => {
        u._triageReady = false;
        B.every(u, .3, () => {
          if (!u._triageReady) {
            const inNeed = B.alliesOf(u).some(a => a !== u && a.hpPct < P.triageThreshold);
            if (inNeed) u._triageReady = true;
          }
        });
        B.on(u, 'basicHit', () => {
          if (!u._triageReady) return;
          const ally = B.alliesOf(u).filter(a => a !== u && a.hpPct < P.triageThreshold)
            .sort((a, b) => a.hpPct - b.hpPct)[0];
          if (!ally) { u._triageReady = false; return; }
          const bonus = ally.hpPct < .50 ? P.triageLowBonus : 0;
          B.heal(u, ally, ally.max.hp * (P.triageHeal + bonus), { silent: true, tag: 'triage' });
          B.fxSproutSkill('delivery', u, ally);
          B.fxFloatIcon(ally.x, ally.y - 80, '🍞');
          if (u._tryHpBoost) u._tryHpBoost(ally);
          u._triageReady = false;
        });
      }
    },
    G: {
      name: 'Stay Close', type: 'Healing / Buff', cd: 10,
      v: { regenVal: .028, regenDur: 5, fortStacks: 2, speedPct: .40, buffDur: 5, selfSpeedDur: 3 },
      desc: (S, P) => `Sprout rushes to the most injured ally, healing them over ${S.regenDur}s (${pc(S.regenVal)}/s of Max HP), granting ${S.fortStacks} stacks of 🧱 Fortify and ${pc(S.speedPct)} Move Speed for ${S.buffDur}s.
        Sprout also gains ${pc(S.speedPct)} Move Speed for ${S.selfSpeedDur}s to quickly reach the next ally in need.`,
      cast: (u, B, S) => {
        const ally = B.alliesOf(u).sort((a, b) => a.hpPct - b.hpPct)[0];
        if (!ally) return;
        B.anim(u, 'wind', .3); B.fxSproutSkill('rush', u, ally); Sound.play('dash');
        B.fxArc(u, ally, { col: '#f4a261', size: 9, speed: 520 }, () => {
          if (!ally.alive) return;
          B.applyStatus(u, ally, 'regen', S.regenDur, { val: ally.max.hp * S.regenVal });
          B.applyStatus(u, ally, 'fortify', S.buffDur, { stacks: S.fortStacks });
          B.applyStatus(u, ally, 'speedup', S.buffDur);
          B.fxFloatIcon(ally.x, ally.y - 95, '🧁');
          B.fxSparkle(ally.x, ally.y - 40, 6, '#f4a261');
          if (u._tryHpBoost) u._tryHpBoost(ally);
        });
        B.applyStatus(u, u, 'speedup', S.selfSpeedDur);
        Sound.play('heal');
      }
    },
    B: {
      name: 'Fresh Out of the Oven', type: 'Healing', cd: 12,
      v: { heal: .36, bonusHeal: .22, healRecvBuff: .28, buffDur: 6, threshold: .35 },
      desc: (S, P) => `Distributes fresh treats to the <b>2 allies missing the most HP</b>, healing each for ${pc(S.heal)} of their Max HP and granting ${pc(S.healRecvBuff)} increased Healing Received for ${S.buffDur}s.
        Each ally below ${pc(S.threshold)} HP receives an additional ${pc(S.bonusHeal)} heal.`,
      cast: (u, B, S) => {
        B.anim(u, 'cast', .4);
        Sound.play('heal');
        const targets = B.alliesOf(u)
          .sort((a, b) => (b.max.hp - b.hp) - (a.max.hp - a.hp))
          .slice(0, 2);
        B.fxSproutSkill('oven', u, null, targets);
        targets.forEach((a, i) => {
          B.after(i * .20, () => {
            if (!a.alive) return;
            B.heal(u, a, a.max.hp * S.heal, { tag: 'Fresh Out of the Oven' });
            // Temporary healing-received boost via flat modifier
            a.flat.healRecv = (a.flat.healRecv || 0) + S.healRecvBuff; a.dirty = true;
            B.after(S.buffDur, () => { a.flat.healRecv = (a.flat.healRecv || 0) - S.healRecvBuff; a.dirty = true; });
            B.fxFloatIcon(a.x, a.y - 90, '🍩');
            if (u._tryHpBoost) u._tryHpBoost(a);
            if (a.hpPct < S.threshold) {
              B.after(.35, () => {
                if (!a.alive) return;
                B.heal(u, a, a.max.hp * S.bonusHeal, { tag: 'Fresh Out of the Oven (bonus)' });
                B.fxFloatIcon(a.x, a.y - 110, '✨');
                if (u._tryHpBoost) u._tryHpBoost(a);
              });
            }
          });
        });
      }
    },
    P: {
      name: 'Overprotective', type: 'Healing / Max HP',
      v: { woundedThreshold: .60, healPowPerAlly: .14, hpBonus: .03, maxBoosts: 3, energyOnLethal: 35 },
      desc: (S, P) => `<span class="sk-pas">At the start of each wave, Sprout gives the whole team a small Fresh Batch heal and temporary increased Healing Received. He also gains +${pc(S.healPowPerAlly)} Heal Power for each ally below ${pc(S.woundedThreshold)} HP (up to 4 allies). Whenever Sprout heals an ally, they permanently gain +${pc(S.hpBonus)} Max HP for this wave (max ${S.maxBoosts}× per ally). If any ally is about to be KO'd, Sprout instantly gains ${S.energyOnLethal} Energy.</span>`,
      passive: (u, B, S) => {
        u._hpBoosts = {};
        u._tryHpBoost = (ally) => {
          const count = u._hpBoosts[ally.id] || 0;
          if (count >= S.maxBoosts) return;
          ally.flat.hpP = (ally.flat.hpP || 0) + S.hpBonus;
          ally.dirty = true;
          u._hpBoosts[ally.id] = count + 1;
        };
        B.after(.24, () => {
          if (!u.alive) return;
          B.alliesOf(u).forEach(a => {
            B.heal(u, a, a.max.hp * .06, { tag: 'Fresh Batch' });
            B.applyStatus(u, a, 'receptive', 5, { val: .14 });
            B.fxFloatIcon(a.x, a.y - 86, '🍞', '#f4a261');
          });
          B.fxRing(u.x, u.y - 42, 280, '#f4a261', .42);
        });
        B.every(u, .5, () => {
          const wounded = Math.min(B.alliesOf(u).filter(a => a !== u && a.hpPct < S.woundedThreshold).length, 4);
          u.flat.healPowP2 = wounded * S.healPowPerAlly;
          u.dirty = true;
        });
        B.on(u, 'allyLethal', ev => {
          if (!ev.unit || ev.unit === u) return;
          B.energy(u, S.energyOnLethal);
          B.fxFloatIcon(u.x, u.y - 80, '💛');
        });
      }
    },
    R: {
      name: "I've Got You", type: 'Healing / Max HP',
      v: { reviveHp: .35, fortStacks: 3, fortDur: 6, otherHeal: .25, maxUses: 2, healPowGain: .20 },
      desc: (S, P) => `When an ally would be KO'd, Sprout immediately intervenes. The KO is prevented, they recover ${pc(S.reviveHp)} Max HP, and gain ${S.fortStacks} stacks of 🧱 Fortify for ${S.fortDur}s. All other allies are healed for ${pc(S.otherHeal)} Max HP.
        Can only trigger ${S.maxUses}× per wave and never twice for the same ally. Each save increases Sprout's Heal Power by ${pc(S.healPowGain)} for this wave.`,
      passive: (u, B, S) => {
        u._igySaves = 0;
        u._igySaved = new Set();
        B.on(u, 'allyLethal', ev => {
          const t = ev.unit;
          if (!t || t === u) return;
          if (u._igySaves >= S.maxUses) return;
          if (u._igySaved.has(t.id)) return;
          ev.prevented = true;
          t.hp = t.max.hp * S.reviveHp;
          u._igySaves++;
          u._igySaved.add(t.id);
          B.fxSproutSkill('save', u, t, B.alliesOf(u), { ultimate: true });
          B.applyStatus(u, t, 'fortify', S.fortDur, { stacks: S.fortStacks });
          B.fxFloatIcon(t.x, t.y - 100, '💛');
          B.flash('#f4a261', .28, .3);
          B.fxSparkle(t.x, t.y - 50, 14, '#f4a261');
          B.fxRing(t.x, t.y - 30, 180, '#f4a261', .5);
          B.alliesOf(u).forEach(a => {
            if (a.alive && a !== t) {
              B.heal(u, a, a.max.hp * S.otherHeal, { tag: "I've Got You" });
              B.fxFloatIcon(a.x, a.y - 75, '🍰');
            }
          });
          u.flat.healPowP3 = (u.flat.healPowP3 || 0) + S.healPowGain;
          u.dirty = true;
          Sound.play('heal');
          B.log(`<b>I've Got You</b> saves ${t.name}.`);
        });
      }
    }
  }
});
