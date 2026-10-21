/* heroes15.js - Ribecca, a calm anti-debuff control unit. */
'use strict';

function ribeccaDelaySkill(target, seconds) {
  if (!target || !target.cds) return;
  Object.keys(target.cds).forEach(key => { target.cds[key] = (target.cds[key] || 0) + seconds; });
}

function ribeccaOffRhythm(u, target, B, dur, stacks) {
  if (!u || !target || !target.alive || target.team === u.team) return;
  const before = target.getStatus('offrhythm');
  const beforeStacks = before ? before.stacks : 0;
  B.applyStatus(u, target, 'offrhythm', dur || 6, { stacks: stacks || 1 });
  const rhythm = target.getStatus('offrhythm');
  if (!rhythm) return;
  const gained = rhythm.stacks > beforeStacks;
  if (gained && beforeStacks > 0) ribeccaDelaySkill(target, .65);
  if (gained && rhythm.stacks >= 3) {
    B.applyStatus(u, target, 'disjointed', 4.5);
    ribeccaDelaySkill(target, 1.1);
  }
  B.fxFloatIcon(target.x, target.y - 88, '🎵', '#b8a7ff');
}

function ribeccaRattleNearby(u, B, dur) {
  B.enemiesOf(u).filter(e => e.alive && B.distance(u, e) <= 300).forEach(e => {
    ribeccaOffRhythm(u, e, B, dur || 6);
    B.applyStatus(u, e, 'disarm', 1.15);
  });
}

defHero({
  id: 'Ribecca', name: 'Ribecca', folder: null, file: null, icon: 'Ribecca',
  role: 'Control', roleLabel: 'Anti-Debuff Control', tier: 'C', position: 'Midline', element: 'Bone',
  blurb: 'A calm control unit who refuses enemy debuffs and turns failed pressure into small openings.',
  base: { hp: 3820, atk: 268, def: 214, mag: 176, mdef: 226, spd: 110, acc: 184, eva: 156 },
  hidden: { range: 245, aspd: .94, ms: 70, aggro: .86, crit: .08, critDmg: 1.52, healPow: 1, shieldPow: 1.08, cdr: .04, ccRes: .16, kbRes: .28, armorPen: .08, magPen: 0 },
  growth: { hp: .084, atk: .077, def: .078, mag: .058, mdef: .082 },
  move: { gait: 'walk', bob: 3, freq: 1.05, lean: 2, squash: .03, idle: 'settle', step: 'step_soft', particles: 'dust', pcol: '#b8a7ff', trail: { on: false }, brake: .45 },
  basic: { name: 'Bone Tap', type: 'physical', ratio: .90, range: 245, sfx: 'hit_light', hit: 'hit_blunt', wind: .20,
    note: 'A quiet tap of bone that keeps the enemy just slightly out of step.' },
  skills: {
    W: {
      name: 'The Undead', type: 'Control / Anti-Debuff', energy: 100,
      v: { ratio: .72 }, p: { dur: 5.5, energy: 4, attackDown: .22, disarm: 1.15 },
      desc: (S, P) => `<span class="sk-pas">Ribecca is immune to applied debuffs. At the start of each wave, her team becomes immune to applied debuffs for 2s. Whenever an enemy's debuff fails against her, that enemy becomes 🎵 Off Rhythm, losing Accuracy and Skill Haste.</span> Active: for ${P.dur}s, enemies targeting Ribecca lose <em>${pcn(P.attackDown * 100)}</em> Attack Speed. When it ends, nearby Off Rhythm enemies lose their next Basic Attack.`,
      passive: (u, B, S) => {
        u.guards = u.guards || [];
        u.guards.push((id, d) => d.kind === 'debuff');
        B.after(.24, () => {
          if (!u.alive) return;
          B.alliesOf(u).forEach(a => {
            B.applyStatus(u, a, 'ccimmune', 2);
            if (a === u) return;
            const immuneUntil = B.t + 2;
            const openingImmunity = (id, d) => {
              if (B.t >= immuneUntil) {
                a.guards = (a.guards || []).filter(g => g !== openingImmunity);
                return false;
              }
              if (!d || d.kind !== 'debuff') return false;
              B.fxFloatIcon(a.x, a.y - 92, '✨', '#b8a7ff');
              return true;
            };
            a.guards = a.guards || [];
            a.guards.push(openingImmunity);
          });
          B.fxRing(u.x, u.y - 42, 300, '#b8a7ff', .48);
        });
        B.on(u, 'debuffBlocked', ev => {
          if (ev.unit !== u || !ev.src || ev.src.team === u.team) return;
          u.ribeccaFailedDebuffs = (u.ribeccaFailedDebuffs || 0) + 1;
          u.ribeccaFailedDebuffWave = true;
          B.energy(u, S.energy || 4);
          ribeccaOffRhythm(u, ev.src, B, 6);
          if (u.ribeccaUndeadUntil > B.t) ribeccaOffRhythm(u, ev.src, B, 7);
        });
      },
      cast: (u, B, S, P) => {
        u.ribeccaUndeadUntil = B.t + P.dur;
        B.anim(u, 'cast', .62); Sound.play('guard', { vol: .46 });
        B.fxRing(u.x, u.y - 42, 170, '#b8a7ff', .55);
        B.every(u, .28, () => {
          if (B.t > u.ribeccaUndeadUntil || !u.alive) return;
          B.enemiesOf(u).forEach(e => {
            if (e.target === u) B.applyStatus(u, e, 'slow', .8, { stacks: 1 });
          });
        });
        B.after(P.dur, () => {
          if (!u.alive) return;
          ribeccaRattleNearby(u, B, 6);
          B.fxRing(u.x, u.y - 42, 230, '#b8a7ff', .7);
        });
      }
    },
    G: {
      name: 'Loose Bones', type: 'Physical Damage / Control', cd: 9,
      v: { ratio: .68 }, p: { dur: 6, root: 1.25, bossDur: 8 },
      desc: (S, P) => `Sends loose bones through the enemy formation for <em>${pcn(S.ratio * 100)}</em> Attack. Enemies become 🎵 Off Rhythm; already affected targets are Rooted for ${P.root}s, while bosses receive heavier Skill Haste reduction instead.`,
      ai: { prio: 58, cond: (u, B) => B.enemiesOf(u).length > 0 },
      cast: (u, B, S, P) => {
        const foes = B.enemiesOf(u); B.anim(u, 'cast', .92, 'ribeccaLooseBones'); Sound.play('bone', { vol: .58 });
        foes.forEach((e, i) => B.after(i * .055, () => {
          if (!e.alive) return;
          B.fxRibeccaBones(u, e, i);
          B.damage(u, e, u.st.atk * S.ratio, { type: 'physical', area: true, tag: 'Loose Bones' });
          const already = e.hasStatus('offrhythm');
          ribeccaOffRhythm(u, e, B, e.isBoss ? P.bossDur : P.dur);
          if (already && !e.isBoss) B.applyStatus(u, e, 'root', P.root);
          if (already && e.isBoss) ribeccaDelaySkill(e, 1.2);
        }));
      }
    },
    B: {
      name: 'Rattle Step', type: 'Control / Physical Damage', cd: 12,
      v: { ratio: .54 }, p: { slow: 5, delay: 1.5, energy: 12, eva: .18, evaDur: 4.5 },
      desc: (S, P) => `Moves in an uneven rhythm and rattles the highest-Energy enemy for <em>${pcn(S.ratio * 100)}</em> Attack. Their next Skill is delayed, their Movement Speed falls for ${P.slow}s, and Ribecca gains <em>${pcn(P.eva * 100)}</em> Evasion for ${P.evaDur}s.`,
      ai: { prio: 54, cond: (u, B) => B.enemiesOf(u).length > 0 },
      cast: (u, B, S, P) => {
        const target = B.highestEnergy(B.enemiesOf(u)); if (!target) return;
        B.anim(u, 'cast', .52); B.dash(u, u.x + u.face * 42, .24, { depth: u.depth });
        B.damage(u, target, u.st.atk * S.ratio, { type: 'physical', tag: 'Rattle Step' });
        ribeccaOffRhythm(u, target, B, 6); ribeccaDelaySkill(target, P.delay);
        B.applyStatus(u, target, 'slow', P.slow, { stacks: 1 });
        if (u.ribeccaFailedDebuffWave) B.energy(target, -P.energy);
        B.applyStatus(u, u, 'ribecca_evasion', P.evaDur);
        B.fxFloatIcon(target.x, target.y - 88, '🦴', '#b8a7ff');
      }
    },
    P: {
      name: 'Unbothered', type: 'Armor / Magic Defense / Control',
      v: { def: .035, mdef: .035, energy: 3 }, p: { ccRes: .22 },
      desc: (S, P) => `Whenever an enemy becomes 🎵 Off Rhythm, Ribecca gains <em>${pcn(S.def * 100)}</em> Armor and Magic Defense. Ignored debuffs restore ${S.energy} Energy, and Crowd Control duration against her is reduced.`,
      passive: (u, B, S, P) => {
        u.flat.ccResRibecca = P.ccRes;
        B.on(u, 'statusApplied', ev => {
          if (ev.src !== u || ev.id !== 'offrhythm' || !ev.unit || ev.unit.team === u.team) return;
          B.applyStatus(u, u, 'ribecca_unbothered', 999, { stacks: 1 });
        });
        B.on(u, 'debuffBlocked', ev => {
          if (ev.unit === u && ev.src && ev.src.team !== u.team) B.energy(u, S.energy || 3);
        });
      }
    },
    R: {
      name: 'Still Standing', type: 'Control / Max HP',
      v: { hp: .08, shield: .22 }, p: { trigger: .32, reform: 5, extend: 1.6, disjoint: 4.5 },
      desc: (S, P) => `Off Rhythm can stack to its limit; maximum stacks make enemies 🦴 Disjointed, delaying their next Skill and weakening their next attack. Once per wave below ${pc(P.trigger)}, Ribecca reforms with a Shield and applies Off Rhythm nearby.`,
      passive: (u, B, S, P) => {
        u.flat.hpP15 = S.hp;
        B.on(u, 'cast', ev => {
          if (ev.key !== 'W') return;
          B.enemiesOf(u).forEach(e => {
            const rhythm = e.getStatus('offrhythm');
            if (rhythm) rhythm.t += P.extend;
          });
        });
        B.every(u, .18, () => {
          if (u._ribeccaReformed || u.hpPct > P.trigger || !u.alive) return;
          u._ribeccaReformed = true;
          B.cleanseAll(u); B.shield(u, u, u.max.hp * S.shield, P.reform);
          B.enemiesOf(u).filter(e => B.distance(u, e) <= 300).forEach(e => ribeccaOffRhythm(u, e, B, P.disjoint));
          B.fxRing(u.x, u.y - 42, 250, '#e5d6ff', .85); B.fxFloatIcon(u.x, u.y - 105, '🦴', '#e5d6ff');
        });
      }
    }
  }
});

/* heroes15.js loads after twisted.js snapshots the base roster. Keep Ribecca
   in the live playable list so the shop, roster, saves, and campaign gates
   all see her. */
if (typeof PLAYABLE_IDS !== 'undefined' && !PLAYABLE_IDS.includes('Ribecca')) PLAYABLE_IDS.push('Ribecca');
