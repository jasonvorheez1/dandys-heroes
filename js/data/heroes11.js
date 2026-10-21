/* heroes11.js - collaboration visitors outside The Door Opens. */
'use strict';

const PHANTASIA_BOOSTS = ['computer', 'speed', 'bravery'];

function phantasiaSparkle(src, target, B, stacks) {
  if (!target || !target.alive) return;
  B.applyStatus(src, target, 'sparkle', 8, { stacks: stacks || 1 });
  B.fxSparkle(target.x, target.y - 48, 7, '#efb8ff');
}

function phantasiaWeightedOutcome(u, target) {
  let healWeight = target.hpPct < .25 ? 9 : target.hpPct < .45 ? 6 : 1;
  if (u.phantasiaHealBias) { healWeight = 10; u.phantasiaHealBias = false; }
  const entries = [
    ['healing', healWeight], ['computer', target.energy < 55 ? 3 : 2],
    ['speed', 3], ['bravery', 3]
  ];
  let roll = Math.random() * entries.reduce((n, x) => n + x[1], 0);
  for (const entry of entries) { roll -= entry[1]; if (roll <= 0) return entry[0]; }
  return 'bravery';
}

function phantasiaOutcomeScore(kind, target, B) {
  const pressured = B.enemiesOf(target).some(e => e.target === target);
  if (kind === 'healing') return (1 - target.hpPct) * 12;
  if (kind === 'computer') return target.energy > 65 ? 6 : 3;
  if (kind === 'bravery') return pressured ? 7 : 3;
  return !pressured && target.hpPct > .55 ? 6 : 3;
}

function phantasiaApplyBoost(u, target, B, kind, dur, computerEnergy) {
  const status = kind === 'computer' ? 'computerwish' : kind === 'speed' ? 'speedwish' : 'braverywish';
  const icon = kind === 'computer' ? '💻' : kind === 'speed' ? '🏃' : '🛡';
  B.applyStatus(u, target, status, dur);
  if (kind === 'computer') B.energy(target, computerEnergy == null ? 10 : computerEnergy);
  B.fxFloatIcon(target.x, target.y - 88, icon, '#f0bdff');
  B.fxPhantasiaWish(kind, target);
}

function phantasiaMagicTrick(u, target, B, S, P, opt) {
  if (!target || !target.alive) return;
  opt = opt || {};
  phantasiaSparkle(u, u, B, 1);
  B.shield(u, target, u.st.mag * S.shield * (opt.emergency ? 1.25 : 1), 7);
  B.fxRing(target.x, target.y - 42, 105, '#eeb5ff', .45);

  if (opt.emergency) {
    B.applyStatus(u, target, 'regen', 6, { val: u.st.mag * S.fallback });
    const bonus = pick(PHANTASIA_BOOSTS);
    phantasiaApplyBoost(u, target, B, bonus, P.buffDur, S.computer);
    return bonus;
  }

  let outcome = phantasiaWeightedOutcome(u, target);
  if (u.rarity >= 5) {
    let second = phantasiaWeightedOutcome(u, target);
    if (second === outcome) second = pick(['healing'].concat(PHANTASIA_BOOSTS).filter(x => x !== outcome));
    if (phantasiaOutcomeScore(second, target, B) > phantasiaOutcomeScore(outcome, target, B)) outcome = second;
  }

  if (outcome === 'healing') {
    B.fxPhantasiaWish('healing', target);
    if (u.rarity >= 4 && target.hpPct >= P.full) {
      B.shield(u, target, u.st.mag * S.fullShield, 8);
      B.fxFloatIcon(target.x, target.y - 88, '🛡', '#ffe8ff');
    } else {
      B.heal(u, target, u.st.mag * S.heal, { tag: 'Magic Trick' });
      B.applyStatus(u, target, 'receptive', P.buffDur, { val: P.healRecv });
      B.fxFloatIcon(target.x, target.y - 88, '💚', '#c4ffcf');
    }
    if (u.rarity >= 4) phantasiaApplyBoost(u, target, B, pick(PHANTASIA_BOOSTS), P.buffDur);
  } else {
    phantasiaApplyBoost(u, target, B, outcome, P.buffDur, S.computer);
    if (u.rarity >= 4) B.applyStatus(u, target, 'regen', 5, { val: u.st.mag * S.trickle });
    if (target.hpPct <= P.critical) B.after(P.delay, () => {
      if (u.alive && target.alive) B.heal(u, target, u.st.mag * S.fallback, { tag: 'Hopeful Echo' });
    });
  }
  if (u.rarity >= 4 && target.hpPct < .5) phantasiaSparkle(u, u, B, 1);
  B.log(`<b>Magic Trick</b> · ${({ healing: 'Healing Spell', computer: 'Computer Spell', speed: 'Speed Spell', bravery: 'Bravery Spell' })[outcome]} on ${target.name}.`);
  return outcome;
}

defHero({
  id: 'Phantasia', name: 'Phantasia', folder: 'Phantasia', file: 'Phantasia', icon: 'Phantasia',
  scale: 1.08,
  role: 'Support', roleLabel: 'Healer', tier: 'A', position: 'Backline', element: 'Wish',
  blurb: 'A distractible unicorn whose unstable wish magic turns lucky heals and useful mistakes into constant backline support.',
  base: { hp: 3420, atk: 152, def: 174, mag: 346, mdef: 292, spd: 108, acc: 180, eva: 130 },
  hidden: { range: 330, aspd: .98, ms: 64, aggro: .48, crit: .05, critDmg: 1.5, healPow: 1.24,
    shieldPow: 1.14, cdr: .04, ccRes: .15, kbRes: .24, armorPen: 0, magPen: .06 },
  growth: { hp: .084, atk: .068, def: .076, mag: .091, mdef: .087 },
  move: { gait: 'float', bob: 8, freq: 1.4, lean: 5, squash: .04, hover: 8, idle: 'pulse', step: 'step_soft',
    particles: 'sparkle', pcol: '#efb8ff', trail: { on: true, col: '#d792f5', rate: .13 }, brake: .12 },
  basic: { name: 'Wish Spark', type: 'magic', ratio: .96, range: 330, proj: 'orb', pcol: '#efb8ff',
    sfx: 'sparkle', hit: 'hit_magic', wind: .28 },
  skills: {
    W: {
      name: 'Magic Trick', type: 'Healing / Support', energy: 100,
      v: { shield: .46, heal: 1.10, fallback: .28, trickle: .13, fullShield: .72, computer: 10 },
      p: { buffDur: 7, healRecv: .28, critical: .30, delay: 1.5, full: .88 },
      desc: (S, P) => `<span class="sk-pas">Phantasia cannot directly heal herself. Casting on an ally grants ✨ Sparkle, stacking Skill Haste. At the start of each wave, every ally receives Sparkle and a small Energy burst.</span> Active: the lowest-HP ally gains a <em>${pcn(S.shield * 100)}</em> Magic Shield, then Magic Trick rolls a rare Healing Spell or a more common Computer, Speed, or Bravery boost. Healing restores <em>${pcn(S.heal * 100)}</em> Magic; Computer restores <em>${S.computer}</em> Energy; Speed and Bravery last ${P.buffDur}s. Low HP sharply improves the healing odds; a failed critical roll leaves a delayed Heal instead.`,
      passive: (u, B) => {
        u.noSelfHeal = true;
        B.after(.24, () => {
          if (!u.alive) return;
          B.alliesOf(u).forEach(a => {
            B.applyStatus(u, a, 'sparkle', 5, { stacks: 1 });
            B.energy(a, 4);
            B.fxSparkle(a.x, a.y - 44, 6, '#efb8ff');
          });
          B.fxRing(u.x, u.y - 42, 280, '#efb8ff', .42);
        });
        B.after(.35, () => { if (u.alive) Sound.collab(u, 'start', { vol: .76, priority: true }); });
      },
      cast: (u, B, S, P) => {
        const allies = B.alliesOf(u).filter(a => a !== u);
        const target = B.lowestHp(allies) || u;
        B.anim(u, 'cast', .7); Sound.collab(u, 'skill', { vol: .78, priority: true });
        B.after(.32, () => { if (u.alive && target.alive) phantasiaMagicTrick(u, target, B, S, P); });
      }
    },
    G: {
      name: 'Premonition', type: 'Control / Shield', cd: 10,
      v: { shield: .62, warn: .28 }, p: { dur: 6, warnWindow: 1.15 },
      desc: (S, P) => `Predicts the enemy with the highest Attack for ${P.dur}s, making them 🔮 Predicted and 🥀 Weakened. Their first target gains a <em>${pcn(S.shield * 100)}</em> Magic Shield before Damage lands. If the Predicted enemy casts, Phantasia warns the team and reduces that Skill's Damage by <em>${pcn(S.warn * 100)}</em>.`,
      ai: { prio: 68, cond: (u, B) => B.enemiesOf(u).length > 0 },
      cast: (u, B, S, P) => {
        const target = B.highestStat(B.enemiesOf(u), 'atk'); if (!target) return;
        B.anim(u, 'cast', .55); Sound.play('whisper', { vol: .45 });
        B.applyStatus(u, target, 'predicted', P.dur); B.fxFloatIcon(target.x, target.y - 92, '🔮', '#efb8ff');
        B.applyStatus(u, target, 'weaken', P.dur);
        let guarded = false;
        const offHit = B.on(u, 'allyDamaged', ev => {
          if (guarded || ev.src !== target || !ev.unit || !ev.unit.alive) return;
          guarded = true;
          B.shield(u, ev.unit, u.st.mag * S.shield, 6, { onBreak: () => { if (u.alive) B.energy(u, 18); } });
          B.fxFloatIcon(ev.unit.x, ev.unit.y - 88, '🔮', '#f7d7ff');
        });
        const offCast = B.on(u, 'enemyCast', enemy => {
          if (enemy !== target || !target.alive) return;
          const key = 'dmgDealtPhantasia' + u.index;
          const stamp = B.t;
          target.flat[key] = -S.warn; target.dirty = true;
          target._phantasiaWarnAt = stamp;
          B.alliesOf(u).forEach(a => B.fxFloatIcon(a.x, a.y - 84, '❗', '#f7d7ff'));
          B.after(P.warnWindow, () => {
            if (target._phantasiaWarnAt !== stamp) return;
            delete target.flat[key]; target.dirty = true;
          });
        });
        B.after(P.dur, () => { offHit(); offCast(); });
      }
    },
    B: {
      name: 'Wishling Ward', type: 'Healing / Shield', cd: 12,
      v: { shield: .78, regen: .16, burst: .42 }, p: { dur: 7, radius: 190 },
      desc: (S, P) => `Wards the lowest-HP ally with a Shield and healing over time. Debuffs expire faster while it holds. If broken, it Heals nearby allies; if it expires naturally, Phantasia gains ✨ Sparkle and her next Magic Trick has strongly improved Healing Spell odds.`,
      ai: { prio: 76, cond: (u, B) => B.alliesOf(u).some(a => a !== u && a.hpPct < .82) },
      cast: (u, B, S, P) => {
        const target = B.lowestHp(B.alliesOf(u).filter(a => a !== u)); if (!target) return;
        B.anim(u, 'cast', .62); Sound.play('magiccircle', { vol: .55 }); phantasiaSparkle(u, u, B, 1);
        B.applyStatus(u, target, 'regen', P.dur, { val: u.st.mag * S.regen });
        let broken = false;
        B.shield(u, target, u.st.mag * S.shield, P.dur, { onBreak: () => {
          broken = true;
          B.alliesOf(u).filter(a => B.distance(a, target) <= P.radius).forEach(a => B.heal(u, a, u.st.mag * S.burst, { tag: 'Wishling Burst' }));
          B.fxRing(target.x, target.y - 42, P.radius, '#f1c6ff', .55);
        } });
        const wardShield = target.shields[target.shields.length - 1];
        const until = B.t + P.dur;
        const ageDebuffs = () => {
          if (B.t >= until || !u.alive || !target.alive || !target.shields.includes(wardShield)) return;
          target.statuses.forEach(st => { if (STATUS[st.id] && STATUS[st.id].kind === 'debuff' && !st.sticky) st.t = Math.max(.05, st.t - .30); });
          B.after(.5, ageDebuffs);
        };
        B.after(.5, ageDebuffs);
        B.after(P.dur + .05, () => {
          if (!broken && u.alive) { u.phantasiaHealBias = true; phantasiaSparkle(u, u, B, 1); }
        });
      }
    },
    P: {
      name: 'I Hope It Heals', type: 'Healing / Skill Haste',
      v: { basicHeal: .20 }, p: { basicEvery: 3 },
      desc: (S, P) => `Every ${P.basicEvery} successful Wish Sparks heals the lowest-HP ally for <em>${pcn(S.basicHeal * 100)}% Magic Attack</em> and grants Phantasia ✨ Sparkle. Magic Trick's non-Healing outcomes also grant a small Heal over time, while Healing Spell adds a random stat boost.`,
      passive: (u, B, S, P) => {
        u.phantasiaBasicHeal = S.basicHeal;
        u.phantasiaBasicEvery = P.basicEvery;
        u.phantasiaBasicHits = 0;
        B.on(u, 'basicHit', () => {
          if (++u.phantasiaBasicHits < u.phantasiaBasicEvery) return;
          u.phantasiaBasicHits = 0;
          const ally = B.lowestHp(B.alliesOf(u).filter(a => a !== u));
          if (ally) B.heal(u, ally, u.st.mag * u.phantasiaBasicHeal, { tag: 'Lucky Spark' });
          phantasiaSparkle(u, u, B, 1);
        });
      }
    },
    R: {
      name: 'Wish Upon Me', type: 'Healing / Support / Shield',
      v: { rescueShield: .72, rescueRegen: .18 }, p: { buffDur: 7 },
      desc: () => `Magic Trick rolls two outcomes and applies the one most useful to its target. Once per wave, an ally's defeat is prevented by an emergency Shield, Heal over time, and random boost. That rescue grants the whole team ✨ Sparkle.`,
      passive: (u, B, S, P) => {
        B.on(u, 'allyLethal', ev => {
          if (ev.prevented || u._phantasiaWishUsed || ev.unit === u || !ev.unit.alive) return;
          u._phantasiaWishUsed = true; ev.prevented = true; ev.unit.hp = Math.max(1, ev.unit.max.hp * .08);
          B.anim(u, 'cast', .72); Sound.collab(u, 'protect', { vol: .86, priority: true });
          B.shield(u, ev.unit, u.st.mag * S.rescueShield, 8);
          B.applyStatus(u, ev.unit, 'regen', 7, { val: u.st.mag * S.rescueRegen });
          phantasiaApplyBoost(u, ev.unit, B, pick(PHANTASIA_BOOSTS), P.buffDur);
          B.alliesOf(u).forEach(a => phantasiaSparkle(u, a, B, 1));
          B.fxRing(ev.unit.x, ev.unit.y - 42, 170, '#fff0ff', .7); B.flash('#f1c6ff', .30, .18);
          B.log(`<b>Wish Upon Me</b> catches ${ev.unit.name}.`);
        });
      }
    }
  }
});
