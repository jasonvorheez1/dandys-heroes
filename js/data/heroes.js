/* heroes.js - Hero definitions, part 1.
   Kits follow the authored skillsets in Characters/<Name>/Skillset.txt:
   same names, same roles, same tiers, same mechanics, expressed in engine terms.

   Skill contract:
     v  : numbers scaled by skill level (ratios, damage coefficients)
     p  : numbers that do NOT scale (durations, counts, thresholds)
     ai : {cond(u,B), prio} - higher prio wins when several skills are ready
     cast(u, B, S, P)
   Rarity gate: W=1(White) G=2(Green) B=3(Blue) P=4(Purple) R=5(Red).
   Only White skills have both a passive and an active. */
'use strict';

const HEROES = {};
const RARITY_NAMES = ['-', 'White', 'Green', 'Blue', 'Purple', 'Red', 'Rainbow'];
const RARITY_COLORS = ['#444', '#f4f0ff', '#5fe07a', '#5aa9ff', '#c17bff', '#ff6060', '#ffe56b'];
const RARITY_TIER_MAX = [0, 3, 5, 5, 12, 20, 30];
const RARITY_TOTAL_RANKS = RARITY_TIER_MAX.reduce((total, max) => total + max, 0);
const SKILL_ORDER = ['W', 'G', 'B', 'P', 'R'];
const SKILL_RARITY = { W: 1, G: 2, B: 3, P: 4, R: 5 };

/* Rarity is a color tier plus a rank inside that tier. Skill gates still use
   the color tier, while the full rank controls stat growth. */
function rarityLabel(tier, plus) {
  tier = clamp(Number(tier) || 1, 1, 6);
  plus = Number(plus);
  if (!Number.isFinite(plus)) plus = 1;
  return RARITY_NAMES[tier] + ' ' + clamp(plus, 1, RARITY_TIER_MAX[tier]);
}
function rarityRank(tier, plus) {
  tier = clamp(Number(tier) || 1, 1, 6);
  plus = Number(plus);
  if (!Number.isFinite(plus)) plus = 1;
  plus = clamp(plus, 1, RARITY_TIER_MAX[tier]);
  let rank = plus;
  for (let i = 1; i < tier; i++) rank += RARITY_TIER_MAX[i];
  return rank;
}
function rarityNext(tier, plus) {
  tier = clamp(Number(tier) || 1, 1, 6);
  plus = Number(plus);
  if (!Number.isFinite(plus)) plus = 1;
  plus = clamp(plus, 1, RARITY_TIER_MAX[tier]);
  if (plus < RARITY_TIER_MAX[tier]) return { tier, plus: plus + 1 };
  if (tier < 6) return { tier: tier + 1, plus: 1 };
  return null;
}
function rarityStatMultiplier(tier, plus) { return 1 + rarityRank(tier, plus) * .018; }
function rarityPlusForLevel(level, tier, seed) {
  tier = clamp(Number(tier) || 1, 1, 6);
  const max = RARITY_TIER_MAX[tier];
  if (tier === 1) return 1;
  return clamp(1 + (hashStr(String(seed || level || 1)) % max), 1, max);
}

function defHero(o) {
  /* Some rarity skills are pure rule changes ("now bounces", "cannot repeat",
     and so on), so they historically had no number for a Skill level to
     affect. Give those upgrade-only passives a modest, visible Skill Mastery
     payoff: 2% Skill Haste at rank one, scaling with that skill's rank. */
  Object.keys(o.skills || {}).forEach(key => {
    const skill = o.skills[key];
    const hasNumbers = Object.keys(skill.v || {}).length || Object.keys(skill.p || {}).length || skill.cd;
    if (hasNumbers || !skill.passive) return;
    skill.v = { mastery: .02 };
    const passive = skill.passive, describe = skill.desc;
    skill.desc = (S, P) => `${describe ? describe(S, P) : ''}<span class="sk-pas"> Skill Mastery grants <em>${pcn(S.mastery * 100)}</em> Skill Haste.</span>`;
    skill.passive = (u, B, S, P) => {
      passive(u, B, S, P);
      u.flat['skillMastery' + key] = S.mastery;
      u.dirty = true;
    };
  });
  HEROES[o.id] = o; return o;
}
function pc(v) { return Math.round(v * 100) + '%'; }
function pcn(v) { return (v >= 100 ? Math.round(v) : v.toFixed(1).replace(/\.0$/, '')) + '%'; }

/* ============================================================ ASTRO
   Support Controller / Enchanter - S Tier */
defHero({
  id: 'Astro', name: 'Astro', folder: 'Astro', file: 'Astro', icon: 'Astro',
  role: 'Support', tier: 'S', element: 'Dream',
  blurb: 'The quiet moon of the Depths. He does not win fights so much as refuse to let his friends lose them.',
  base: { hp: 3480, atk: 150, def: 180, mag: 388, mdef: 315, spd: 108, acc: 178, eva: 122 },
  hidden: { range: 300, aspd: 0.96, ms: 72, aggro: 0.55, crit: .05, critDmg: 1.5, healPow: 1.35, shieldPow: 1.20, cdr: .04, ccRes: .15, kbRes: .35, armorPen: 0, magPen: .06 },
  growth: { hp: .088, atk: .07, def: .078, mag: .095, mdef: .090 },
  move: { gait: 'float', bob: 9, freq: 1.1, lean: 3, squash: .02, hover: 16, idle: 'pulse', step: null,
    particles: 'sparkle', pcol: '#b9a4ff', trail: { on: true, col: '#8f7fff', rate: .1 }, brake: .1 },
  basic: { name: 'Lullaby Mote', type: 'magic', ratio: 1.08, range: 300, proj: 'orb', pcol: '#b9a4ff',
    sfx: 'whoosh', hit: 'hit_magic', wind: .28, note: 'A drifting mote that slows whatever it settles on.',
    onHit: (u, t, B) => { if (chance(.35) || t.hasStatus('drowsy')) B.applyStatus(u, t, 'drowsy', 3.5); } },
  skills: {
    W: {
      name: 'Dream Pulse', type: 'Magic Damage', energy: 100,
      v: { ratio: 1.60, heal: 1.25 }, p: { drowsy: 6, en: 30, thr: .40 },
      desc: (S, P) => `<span class="sk-pas">Allies near Astro recover Energy every second. When an ally drops below ${pc(P.thr)} HP he heals them for <em>${pcn(S.heal * 35)}</em> Magic and grants brief Damage Reduction.</span>
        Active: a wave of dream energy washes the field. Allies restore <em>${P.en}</em> Energy, heal <em>${pcn(S.heal * 100)}</em> Magic and lose up to three debuffs. Enemies take <em>${pcn(S.ratio * 100)}</em> Magic Damage and become 🌙 Drowsy for ${P.drowsy}s.`,
      passive: (u, B, S) => {
        B.every(u, 1.0, () => B.alliesOf(u).forEach(a => { if (B.distance(a, u) < 340) B.energy(a, 3); }));
        B.on(u, 'allyLow', a => {
          if (a._dreamGuard && B.t - a._dreamGuard < 8) return;
          a._dreamGuard = B.t;
          B.heal(u, a, u.st.mag * S.heal * 0.35, { tag: 'dream' });
          B.applyStatus(u, a, 'ward', 3);
          B.fxRing(a.x, a.y - 40, 70, '#b9a4ff');
        });
      },
      cast: (u, B, S, P) => {
        B.anim(u, 'cast', .55); Sound.play('magiccircle');
        B.after(.4, () => {
          Sound.play('ult'); B.tint('#7a6bff', .35, .45); B.shake(7, .4);
          B.fxRing(u.x, u.y - 40, 520, '#b9a4ff', .9);
          B.alliesOf(u).forEach(a => {
            B.energy(a, P.en); B.heal(u, a, u.st.mag * S.heal, { tag: 'dream' }); B.cleanse(a, 3);
            B.fxSparkle(a.x, a.y - 40, 14, '#dcd0ff');
          });
          B.enemiesOf(u).forEach(e => {
            B.damage(u, e, u.st.mag * S.ratio, { type: 'magic', tag: 'Dream Pulse' });
            B.applyStatus(u, e, 'drowsy', P.drowsy);
          });
        });
      }
    },
    G: {
      name: 'Peaceful Slumber', type: 'Crowd Control', cd: 10,
      v: { ratio: .50 }, p: { sleep: 5, drain: .25, groggy: 4 },
      desc: (S, P) => `Astro sings the enemy holding the most Energy to sleep for ${P.sleep}s, dealing <em>${pcn(S.ratio * 100)}</em> Magic Damage. Up to three positive effects are lulled away, they lose <em>${pc(P.drain)}</em> of their current Energy, and wake 😪 Groggy for ${P.groggy}s.`,
      ai: { prio: 60, cond: (u, B) => B.enemiesOf(u).some(e => !e.hasStatus('sleep')) },
      cast: (u, B, S, P) => {
        const t = B.highestEnergy(B.enemiesOf(u).filter(e => !e.hasStatus('sleep'))) || B.highestEnergy(B.enemiesOf(u));
        if (!t) return;
        B.anim(u, 'cast', .4); Sound.play('dizzy');
        B.after(.28, () => {
          if (!t.alive) return;
          B.fxRing(t.x, t.y - 50, 110, '#7f6bd6'); B.fxFloatIcon(t.x, t.y - 90, '💤'); B.dispel(t, 3);
          t.energy = Math.max(0, t.energy * (1 - P.drain));
          B.damage(u, t, u.st.mag * S.ratio, { type: 'magic', tag: 'Slumber' });
          B.applyStatus(u, t, 'sleep', P.sleep, { groggyDur: P.groggy });
          if (!t.hasStatus('sleep')) B.applyStatus(u, t, 'drowsy', 5);
        });
      }
    },
    B: {
      name: 'Falling Stars', type: 'Magic Damage', cd: 11,
      v: { ratio: .52, heal: .26 }, p: { hits: 8, focusBonus: .60 },
      desc: (S, P) => `${P.hits} stars fall on enemies for <em>${pcn(S.ratio * 100)}</em> Magic each. Stars home in on 🌙 Drowsy or 💤 Sleeping targets and hit <em>${pc(P.focusBonus)}</em> harder. Every impact heals the weakest ally.`,
      ai: { prio: 48, cond: () => true },
      cast: (u, B, S, P) => {
        B.anim(u, 'cast', .5); Sound.play('magiccircle', { vol: .6 });
        B.repeat(P.hits, .12, () => {
          const foes = B.enemiesOf(u); if (!foes.length) return;
          const marked = foes.filter(e => e.hasStatus('drowsy') || e.hasStatus('sleep'));
          const t = marked.length ? pick(marked) : pick(foes);
          const bonus = marked.includes(t) ? (1 + P.focusBonus) : 1;
          B.fxStarfall(t.x, t.y, () => {
            Sound.play('hit_magic', { vol: .5, rate: rnd(.9, 1.2) });
            B.damage(u, t, u.st.mag * S.ratio * bonus, { type: 'magic', tag: 'Falling Stars' });
            B.shake(2, .1);
            const w = B.lowestHp(B.alliesOf(u)); if (w) B.heal(u, w, u.st.mag * S.heal, { silent: true, tag: 'Falling Stars Heal' });
          });
        });
      }
    },
    P: {
      name: 'Well Rested', type: 'Team Passive',
      v: { heal: .20, en: .16, pen: .25 }, p: {},
      desc: (S) => `Allies gain <em>${pcn(S.heal * 100)}</em> Healing Received and <em>${pcn(S.en * 100)}</em> Energy Generation. At battle start and whenever an ally is topped to full HP, their next skill ignores <em>${pcn(S.pen * 100)}</em> Magic Defense.`,
      passive: (u, B, S) => {
        B.teamAura(u, m => { m.healRecv += S.heal; m.energyGen += S.en; });
        const armRest = (a) => {
          if (!a || !a.alive) return;
          a._astroPenActive = true;
          B.fxFloatIcon(a.x, a.y - 80, '✨', '#dcd0ff');
          if (!a._astroPenListener) {
            a._astroPenListener = true;
            B.on(a, 'dealDamage', ev => {
              if (!ev.basic && !ev.dot && a._astroPenActive) {
                a._astroPenActive = false;
                ev.armorPen = (ev.armorPen || 0) + S.pen;
                B.fxFloatIcon(a.x, a.y - 92, '🌙 PEN', '#b9a4ff');
              }
            });
          }
        };
        B.after(.3, () => B.alliesOf(u).forEach(armRest));
        B.on(u, 'allyFull', a => armRest(a));
      }
    },
    R: {
      name: 'Endless Night', type: 'Battle Opener',
      v: { shield: .60 }, p: { dur: 10, revive: .22 },
      desc: (S, P) => `Battle opens under a peaceful night for ${P.dur}s: allies regenerate, enemies are 🌙 Drowsy. Whenever Astro casts, his weakest ally gains a <em>${pcn(S.shield * 100)}</em> Magic Shield and ⚓ CC immunity. Once per ally, a lethal blow leaves them at <em>${pc(P.revive)}</em> HP and briefly 👻 Ethereal.`,
      passive: (u, B, S, P) => {
        B.tint('#2b2160', .28, 2.2);
        B.enemiesOf(u).forEach(e => B.applyStatus(u, e, 'drowsy', P.dur));
        B.alliesOf(u).forEach(a => B.applyStatus(u, a, 'regen', P.dur, { val: u.st.mag * .14 }));
        B.on(u, 'cast', () => {
          const w = B.lowestHp(B.alliesOf(u)); if (!w) return;
          B.shield(u, w, u.st.mag * S.shield, 6); B.applyStatus(u, w, 'ccimmune', 3.5);
        });
        B.on(u, 'allyLethal', ev => {
          if (ev.unit._nightSave) return; ev.unit._nightSave = 1;
          ev.prevented = true; ev.unit.hp = ev.unit.max.hp * P.revive;
          B.energy(ev.unit, 55); B.applyStatus(u, ev.unit, 'untargetable', 1.8);
          Sound.play('cleanse'); B.fxRing(ev.unit.x, ev.unit.y - 40, 160, '#fff');
          B.log('<b>Endless Night</b> catches ' + ev.unit.name + '.');
        });
      }
    }
  }
});

/* ============================================================ SCRAPS
   Sustained physical DPS / Improvised crafts - SS Tier */
const SCRAPS_CRAFTS = {
  cardboard: { name: 'Cardboard Claws', icon: '📦', prop: { kind: 'obj', img: 'cardboard' } },
  cup: { name: 'Cup Flail', icon: '🥤', prop: { kind: 'item', img: 'Stein' } },
  yarn: { name: 'Yarn Ball', icon: '🧶' }
};
const SCRAPS_MATERIALS = {
  glue: { name: 'Glitter Glue', icon: '🧴', prop: { kind: 'obj', img: 'glue' } },
  scissors: { name: 'Scissors', icon: '✂️' },
  crayons: { name: 'Crayons', icon: '🖍️', prop: { kind: 'item', img: 'Trinkets/SCRAPS_Crayonset' } },
  tape: { name: 'Tape', icon: '📼', prop: { kind: 'obj', img: 'Tape' } }
};

function scrapsShowProp(u, B, def, at) {
  const x = at ? at.x : u.x, y = at ? at.y : u.y;
  if (def.prop && def.prop.kind === 'obj') B.fxFloatObject(x, y - 82, def.prop.img, '#ffd166');
  else if (def.prop && def.prop.kind === 'item') B.fxFloatItem(x, y - 82, def.prop.img);
  else B.fxFloatIcon(x, y - 82, def.icon, '#ffd166');
}

function scrapsFinishCraft(u, B, forceDifferent) {
  let keys = Object.keys(SCRAPS_CRAFTS);
  if (forceDifferent !== false && u.scrapsCraft) keys = keys.filter(k => k !== u.scrapsCraft);
  u.scrapsCraft = pick(keys);
  u.scrapsCraftBasics = 0;
  u.rangeBonus = Math.max((u.scrapsInspired || u.scrapsCraft === 'cup') ? 72 : 0, u.scrapsSparkRange || 0);
  u.dirty = true;
  scrapsShowProp(u, B, SCRAPS_CRAFTS[u.scrapsCraft]);
  B.fxConfetti(u.x, u.y - 55, 10); Sound.play('item_pickup', { vol: .30, throttle: 300 });
  B.log(`<b>${u.name}</b> finishes ${SCRAPS_CRAFTS[u.scrapsCraft].name}.`);
}

function scrapsCraftPower(u, craft) { return 1 + ((u.scrapsCraftPower && u.scrapsCraftPower[craft]) || 0); }

/** Apply one or all craft properties. Inspired Scraps deliberately gets all
    three, but only the equipped craft's accumulated material bonus scales the
    hit so rotating crafts remains meaningful after the transformation. */
function scrapsCraftHit(u, t, B, S, active) {
  if (!t || !t.alive) return;
  t._scrapsCraftedBy = t._scrapsCraftedBy || {};
  t._scrapsCraftedBy[u.uid] = true;
  const craft = u.scrapsCraft || 'cardboard';
  const power = scrapsCraftPower(u, craft);
  const kinds = u.scrapsInspired ? Object.keys(SCRAPS_CRAFTS) : [craft];
  kinds.forEach((kind, i) => {
    if (kind === 'cardboard') {
      B.after(i * .04, () => { if (!t.alive) return; B.fxSlash(u, t, { col: '#d7b27a', ang: i ? 28 : -24, small: true });
        Sound.play('hit_slash', { vol: .30, throttle: 55 });
        B.damage(u, t, u.st.atk * S.craft * power, { type: 'physical', melee: true, tag: 'Cardboard Claws' });
        B.applyStatus(u, t, 'defdown', active ? 7 : 4); });
    } else if (kind === 'cup') {
      scrapsShowProp(u, B, SCRAPS_CRAFTS.cup, t); Sound.play('hit_blunt', { vol: .42, throttle: 70 });
      B.enemiesOf(u).filter(e => B.distance(e, t) <= (active ? 190 : 125)).forEach(e =>
        B.damage(u, e, u.st.atk * S.craft * power * (e === t ? 1 : .72), { type: 'physical', area: true, tag: 'Cup Flail' }));
    } else {
      scrapsShowProp(u, B, SCRAPS_CRAFTS.yarn, t); Sound.play('cloth', { vol: .24, throttle: 90 });
      B.applyStatus(u, t, 'slow', active ? 6 : 3, { stacks: active ? 2 : 1 });
      B.applyStatus(u, t, 'weaken', active ? 5 : 3);
      B.applyStatus(u, t, 'frayed', active ? 6 : 3, { stacks: active ? 2 : 1 });
    }
  });
}

function scrapsUseMaterial(u, B, S, P, free) {
  let keys = Object.keys(SCRAPS_MATERIALS).filter(k => k !== u.scrapsLastMaterial);
  const key = pick(keys), mat = SCRAPS_MATERIALS[key];
  u.scrapsLastMaterial = key;
  u.scrapsMaterials = u.scrapsMaterials || new Set();
  u.scrapsCraftPower = u.scrapsCraftPower || { cardboard: 0, cup: 0, yarn: 0 };
  scrapsShowProp(u, B, mat); B.anim(u, 'cast', .44); B.fxConfetti(u.x, u.y - 50, 8);
  Sound.play({ glue: 'pop2', scissors: 'swing_knife', crayons: 'sparkle', tape: 'cloth' }[key], { vol: .30, throttle: 180 });
  if (key === 'glue') {
    B.enemiesOf(u).sort((a, b) => B.distance(a, u) - B.distance(b, u)).slice(0, 3).forEach((e, i) => B.after(i * .07, () => {
      B.fxProj(u, e, { kind: 'obj', img: 'glue' }, () => { B.damage(u, e, u.st.atk * S.ratio, { type: 'physical', area: true, tag: mat.name }); B.applyStatus(u, e, 'slow', P.debuff, { stacks: 2 }); });
    }));
  } else if (key === 'scissors') {
    const t = B.highestStat(B.enemiesOf(u), 'def');
    if (t) for (let i = 0; i < P.cuts; i++) B.after(i * .10, () => { if (!t.alive) return; B.fxSlash(u, t, { col: '#e9f2ff', ang: i % 2 ? 35 : -35, small: true });
      B.damage(u, t, u.st.atk * S.cut, { type: 'physical', melee: true, armorPen: P.pen, tag: mat.name }); });
  } else if (key === 'crayons') {
    B.fxScribble(u.x + u.face * 45, u.y - 50); B.fxPaintStroke(u, ['#ff5fa8', '#5fd0ff', '#ffd166'], true);
    B.after(.18, () => B.enemiesOf(u).forEach(e => { B.damage(u, e, u.st.atk * S.wave, { type: 'physical', area: true, tag: mat.name }); B.applyStatus(u, e, 'blind', P.debuff); }));
  } else {
    const t = B.nearest(u, B.enemiesOf(u));
    if (t) { B.fxProj(u, t, { kind: 'obj', img: 'Tape' }, () => { B.applyStatus(u, t, 'root', P.root); B.after(.32, () => { if (!t.alive) return;
      B.damage(u, t, u.st.atk * S.tape, { type: 'physical', melee: true, tag: mat.name }); B.fxConfetti(t.x, t.y - 55, 9); }); }); }
  }
  const craft = u.scrapsCraft || 'cardboard';
  u.scrapsCraftPower[craft] += S.grow * (1 + (u.scrapsCraftGrowth || 0));
  if (!u.scrapsMaterials.has(key)) {
    u.scrapsMaterials.add(key);
    if (u.scrapsRedAtk) { u.flat.atkP6 = u.scrapsMaterials.size * u.scrapsRedAtk; u.dirty = true; }
  }
  if (u.scrapsRed && u.scrapsMaterials.size === Object.keys(SCRAPS_MATERIALS).length && !u.scrapsInspired) {
    u.scrapsInspired = true; u.rangeBonus = Math.max(72, u.scrapsSparkRange || 0); u.flat.critDmg6 = u.scrapsRedCrit; u.dirty = true;
    B.applyStatus(u, u, 'inspire', 999); B.fxConfetti(u.x, u.y - 55, 34); B.fxAura(u, '#ffd166', 1.4);
    Sound.play('cheer_big', { vol: .56 }); B.log(`<b>${u.name} is Inspired!</b>`);
  }
  if (!free) Sound.play('item_used', { vol: .42 });
  return key;
}

defHero({
  id: 'Scraps', name: 'Scraps', folder: 'scraps', file: 'scraps', icon: 'Scraps',
  role: 'Damage', tier: 'SS', element: 'Craft',
  blurb: 'An inexhaustible arts-and-crafts brawler who turns cardboard, cups, yarn and whatever else she finds into sustained pressure.',
  base: { hp: 3740, atk: 405, def: 228, mag: 118, mdef: 205, spd: 122, acc: 205, eva: 112 },
  hidden: { range: 235, aspd: 1.06, ms: 86, aggro: .92, crit: .13, critDmg: 1.65, healPow: 1, shieldPow: 1, cdr: .07, ccRes: .20, kbRes: .36, armorPen: .12, magPen: 0 },
  growth: { hp: .087, atk: .105, def: .074, mag: .04, mdef: .069 },
  move: { gait: 'skitter', bob: 6, freq: 2.9, lean: 12, squash: .09, idle: 'jitter', step: 'step_soft',
    particles: 'confetti', pcol: '#ffd166', trail: { on: true, col: '#ffd166', rate: .11 }, brake: .22, wobble: 9 },
  basic: { name: 'Claws & Crafts', type: 'physical', ratio: 1.02, range: 235, sfx: 'swing_claw', hit: 'hit_slash',
    wind: .17, reach: true, note: 'Alternates sharp claw swipes with the currently equipped improvised craft.',
    onHit: (u, t, B) => {
      if (u.scrapsLastWasCraft) scrapsShowProp(u, B, SCRAPS_CRAFTS[u.scrapsCraft || 'cardboard'], t);
      else B.fxSlash(u, t, { col: '#fff1c2', ang: -28, small: true });
    } },
  skills: {
    W: {
      name: 'Crafty Grapple', type: 'Physical Damage', energy: 100,
      v: { pass: .34, strike: .28, smash: .74, craft: .18, aspd: .035 }, p: { hits: 3, craftEvery: 4, stamina: 5 },
      desc: (S, P) => `<span class="sk-pas">Basic Attacks build up to ${P.stamina} Stamina stacks, each granting <em>${pcn(S.aspd * 100)}</em> Attack Speed. Every ${P.craftEvery} attacks she finishes Cardboard Claws, a Cup Flail, or a Yarn Ball; attacks alternate between claws and the current craft. Yarn Balls leave 🧵 Frayed, making follow-up control easier. If Scraps misses an evasive target, she spots its movement and her attacks cannot be Dodged for several seconds.</span>
        Active: grapples to the lowest-HP enemy while untargetable, deals <em>${pcn(S.pass * 100)}</em> Attack to every enemy crossed, then lands ${P.hits} rapid claw strikes and a <em>${pcn(S.smash * 100)}</em> craft smash before building something different.`,
      passive: (u, B, S, P) => {
        u.antiDodge = target => target && (target.hasStatus('frayed') || target.hasStatus('scraps_spotted') || B.t < (target._scrapsSpottedUntil || 0));
        B.on(u, 'missed', ev => {
          if (!ev.target || !ev.target.alive || ev.target.team === u.team) return;
          ev.target._scrapsSpottedUntil = B.t + 6;
          B.applyStatus(u, ev.target, 'scraps_spotted', 6);
          B.fxFloatIcon(ev.target.x, ev.target.y - 92, '🧷', '#ffd166');
        });
        u.scrapsCraftPower = { cardboard: 0, cup: 0, yarn: 0 };
        u.scrapsMaterials = new Set(); u.scrapsCraftBasics = 0;
        scrapsFinishCraft(u, B, false);
        B.on(u, 'basicHit', ev => {
          const t = ev.target; if (!t || !t.alive) return;
          u.scrapsStamina = Math.min(P.stamina, (u.scrapsStamina || 0) + 1);
          u.scrapsStaminaUntil = B.t + 4; u.flat.aspdP6 = u.scrapsStamina * S.aspd; u.dirty = true;
          u.scrapsLastWasCraft = !u.scrapsLastWasCraft;
          if (u.scrapsLastWasCraft) scrapsCraftHit(u, t, B, S, false);
          if (u.scrapsInspired) {
            B.damage(u, t, u.st.atk * (u.scrapsRedExtra || .16), { type: 'physical', melee: true, tag: 'Inspired Craft' });
            u.scrapsInspiredBasics = (u.scrapsInspiredBasics || 0) + 1;
            if (u.scrapsInspiredBasics % 3 === 0) B.energy(u, u.scrapsRedEnergy || 12);
          }
          if (++u.scrapsCraftBasics >= P.craftEvery) scrapsFinishCraft(u, B, true);
        });
        B.every(u, .5, () => { if (u.scrapsStamina && B.t > u.scrapsStaminaUntil) { u.scrapsStamina = 0; u.flat.aspdP6 = 0; u.dirty = true; } });
      },
      cast: (u, B, S, P) => {
        const t = B.enemiesOf(u).sort((a, b) => a.hpPct - b.hpPct)[0]; if (!t) return;
        const from = u.x, lo = Math.min(from, t.x), hi = Math.max(from, t.x);
        const crossed = B.enemiesOf(u).filter(e => e !== t && e.x >= lo && e.x <= hi);
        u.scrapsGrappleSeq = (u.scrapsGrappleSeq || 0) + 1;
        const crossMark = `${u.uid}:${u.scrapsGrappleSeq}`;
        let bonus = u.scrapsInspired ? 1 + crossed.length * (u.scrapsRedPass || .12) : 1;
        u.face = t.x >= u.x ? 1 : -1; u.scrapsClawTarget = t; u.scrapsLockedTarget = t; u.target = t;
        B.anim(u, 'cast', .48); Sound.play('grapple', { vol: .56 }); B.fxNet(u, [t]); B.fxTargetLine(u, t, '#ffd166');
        B.applyStatus(u, u, 'untargetable', .62);
        const killed = { any: false };
        B.dash(u, t.x - u.face * 42, .42, { depth: t.depth,
          onMove: () => crossed.forEach(e => { if (e._scrapsCrossed === crossMark || !e.alive) return; e._scrapsCrossed = crossMark;
            const was = e.alive; B.damage(u, e, u.st.atk * S.pass, { type: 'physical', melee: true, tag: 'Crafty Grapple' }); if (was && !e.alive) killed.any = true;
            B.fxSlash(u, e, { col: '#ffd166', ang: 16, small: true }); }),
          onEnd: () => {
            if (!u.alive || !t.alive) { if (killed.any && u.scrapsInspired) scrapsUseMaterial(u, B, B.scaled(u, 'G'), u.def.skills.G.p, true); return; }
            for (let i = 0; i < P.hits; i++) B.after(i * .09, () => { if (!t.alive) return; B.fxSlash(u, t, { col: '#fff', ang: i % 2 ? 38 : -38, small: true });
              const was = t.alive; B.damage(u, t, u.st.atk * S.strike * bonus, { type: 'physical', melee: true, tag: 'Crafty Grapple' }); if (was && !t.alive) killed.any = true; });
            B.after(P.hits * .09 + .06, () => { if (t.alive) { scrapsShowProp(u, B, SCRAPS_CRAFTS[u.scrapsCraft], t); const was = t.alive;
              B.damage(u, t, u.st.atk * S.smash * scrapsCraftPower(u, u.scrapsCraft) * bonus, { type: 'physical', melee: true, tag: 'Crafty Grapple' });
              scrapsCraftHit(u, t, B, S, true); if (was && !t.alive) killed.any = true; }
              B.shake(9, .28); B.hitstop(75); scrapsFinishCraft(u, B, true);
              if (killed.any && u.scrapsInspired) scrapsUseMaterial(u, B, B.scaled(u, 'G'), u.def.skills.G.p, true);
            });
          }
        });
      }
    },
    G: {
      name: 'Whatever Works', type: 'Physical Damage', cd: 8.5,
      v: { ratio: .62, cut: .29, wave: .74, tape: 1.10, grow: .035 }, p: { cuts: 4, pen: .55, debuff: 5, root: 2.2 },
      desc: (S, P) => `Uses Glitter Glue, Scissors, Crayons, or Tape, never the same twice in a row. Each attacks differently, from area Attack Speed reduction to ${P.cuts} Armor-piercing cuts, a formation-wide Accuracy debuff, or a Root. Yarn Balls also apply 🧵 Frayed. The material permanently adds <em>${pcn(S.grow * 100)}</em> Damage to the current craft for the wave.`,
      ai: { prio: 57, cond: (u, B) => B.enemiesOf(u).length > 0 },
      cast: (u, B, S, P) => { scrapsUseMaterial(u, B, S, P, false); }
    },
    B: {
      name: 'Emotional Piece', type: 'Physical Damage', cd: 13,
      v: { ratio: .72, taken: .52 }, p: { focus: 2.4, fury: 7, stun: 1.8 },
      desc: (S, P) => `Works on a large artwork for ${P.focus}s, taking reduced Damage and ignoring Attack Speed reductions. Then charges through every enemy for <em>${pcn(S.ratio * 100)}</em> Attack plus <em>${pcn(S.taken * 100)}</em> of Damage received while working. If Crowd Controlled during the piece, enemies are Stunned. Finishing grants Attack and Critical Damage.`,
      ai: { prio: 52, cond: (u, B) => B.enemiesOf(u).length > 0 },
      cast: (u, B, S, P) => {
        u.scrapsArtDamage = 0; u.scrapsArtCC = false;
        B.anim(u, 'cast', P.focus); B.applyStatus(u, u, 'artfocus', P.focus);
        Sound.play('sparkle', { vol: .28 });
        B.fxFloatObject(u.x, u.y - 92, 'canvas', '#ffd166'); B.fxScribble(u.x, u.y - 60); B.fxPaintCanvas(u, P.focus, ['#ff5fa8', '#5fd0ff', '#ffd166'], false);
        const damageOff = B.on(u, 'damaged', ev => { if (u.hasStatus('artfocus')) u.scrapsArtDamage += ev.amount || 0; });
        const ccOff = B.on(u, 'statusApplied', ev => { if (ev.unit === u && ev.id !== 'artfocus' && STATUS[ev.id] && STATUS[ev.id].cc && u.hasStatus('artfocus')) u.scrapsArtCC = true; });
        const knockOff = B.on(u, 'knockedBack', () => { if (u.hasStatus('artfocus')) u.scrapsArtCC = true; });
        B.after(P.focus, () => {
          ccOff(); damageOff(); knockOff(); if (!u.alive) return;
          const foes = B.enemiesOf(u), far = foes.slice().sort((a, b) => B.distance(b, u) - B.distance(a, u))[0]; if (!far) return;
          const hit = new Set(), bonus = Math.min(u.scrapsArtDamage, u.max.hp * 1.25) * S.taken;
          B.fxBigStroke(u, '#ffd166'); B.fxFloatObject(u.x, u.y - 96, 'canvas', '#ffd166'); Sound.play('sweep', { vol: .54 });
          B.dash(u, far.x + u.face * 60, .46, { depth: far.depth, onMove: () => B.enemiesOf(u).forEach(e => { if (hit.has(e.uid) || B.distance(e, u) > 82) return; hit.add(e.uid);
            B.damage(u, e, u.st.atk * S.ratio + bonus, { type: 'physical', melee: true, area: true, tag: 'Emotional Piece' });
            if (u.scrapsArtCC) B.applyStatus(u, e, 'stun', P.stun); B.fxPaintMark(e.x, e.y - 5, ['#ff5fa8', '#5fd0ff', '#ffd166'], .55, true); }),
            onEnd: () => { B.enemiesOf(u).forEach(e => { if (hit.has(e.uid)) return; B.damage(u, e, u.st.atk * S.ratio + bonus, { type: 'physical', area: true, tag: 'Emotional Piece' }); if (u.scrapsArtCC) B.applyStatus(u, e, 'stun', P.stun); });
              B.applyStatus(u, u, 'artfury', P.fury); B.fxConfetti(u.x, u.y - 55, 24); B.shake(12, .35); }
          });
        });
      }
    },
    P: {
      name: 'Sharp Around the Edges', type: 'Physical Damage / Attack Speed',
      v: { ramp: .025, flurry: .22, low: .16, sparkHp: .022, sparkDef: .025, sparkRange: 10 }, p: { max: 6, swipes: 3 },
      desc: (S, P) => `Consecutive Basic Attacks against one enemy gain up to ${P.max} stacks of <em>${pcn(S.ramp * 100)}</em> bonus Physical Damage. Each different craft effect also creates a Creative Spark, granting <em>${pcn(S.sparkHp * 100)}</em> Max HP, <em>${pcn(S.sparkDef * 100)}</em> Defense, and <em>${S.sparkRange}</em> Skill Range per stack. Crafty Grapple transfers the stacks to its target. Hard Crowd Control or Knockback primes ${P.swipes} retaliatory claw swipes, and below half HP Scraps gains <em>${pcn(S.low * 100)}</em> Attack Speed.`,
      passive: (u, B, S, P) => {
        u.scrapsSparkEffects = {};
        u.scrapsSpark = 0;
        B.on(u, 'basicHit', ev => {
          const t = ev.target; if (!t || !t.alive) return;
          if (u.scrapsClawTarget === t) u.scrapsClawStacks = Math.min(P.max, (u.scrapsClawStacks || 0) + 1);
          else { u.scrapsClawTarget = t; u.scrapsClawStacks = 1; }
          B.damage(u, t, u.st.atk * S.ramp * u.scrapsClawStacks, { type: 'physical', melee: true, tag: 'Sharp Around the Edges' });
          if (u.scrapsRetaliate) { u.scrapsRetaliate = false; for (let i = 0; i < P.swipes; i++) B.after(.04 + i * .07, () => { if (!t.alive) return;
            B.fxSlash(u, t, { col: '#ffcfad', ang: i % 2 ? 42 : -42, small: true }); B.damage(u, t, u.st.atk * S.flurry, { type: 'physical', melee: true, tag: 'Cornered Claws' }); }); }
        });
        B.on(u, 'statusApplied', ev => {
          if (ev.unit === u && STATUS[ev.id] && STATUS[ev.id].cc) u.scrapsRetaliate = true;
          if (ev.src !== u || !ev.unit || ev.unit.team === u.team || !STATUS[ev.id] || STATUS[ev.id].kind !== 'debuff') return;
          if (u.scrapsSparkEffects[ev.id] || u.scrapsSpark >= P.max) return;
          u.scrapsSparkEffects[ev.id] = 1; u.scrapsSpark++;
          u.flat.hpP8 = u.scrapsSpark * S.sparkHp;
          u.flat.defP8 = u.scrapsSpark * S.sparkDef;
          u.scrapsSparkRange = u.scrapsSpark * S.sparkRange;
          u.rangeBonus = Math.max(u.rangeBonus || 0, u.scrapsSparkRange);
          u.dirty = true; B.fxFloatIcon(u.x, u.y - 92, '✨', '#ffd166');
        });
        B.on(u, 'knockedBack', () => { u.scrapsRetaliate = true; });
        B.on(u, 'enemyDown', e => { if (e && e._scrapsCraftedBy && e._scrapsCraftedBy[u.uid]) B.energy(u, 14); });
        B.every(u, .4, () => { const on = u.hpPct < .5; if (on !== u.scrapsLow) { u.scrapsLow = on; u.flat.aspdP7 = on ? S.low : 0; u.dirty = true; } });
      }
    },
    R: {
      name: 'Arts and Crafts', type: 'Physical Damage / Attack / Critical Damage',
      v: { atk: .015, extra: .16 }, p: { crit: .35, energy: 12, pass: .12 },
      desc: (S, P) => `The first use of each Whatever Works material permanently grants <em>${pcn(S.atk * 100)}</em> Attack. After all four, Scraps remains Inspired: Basics deal <em>${pcn(S.extra * 100)}</em> extra Physical Damage, every craft gains all three properties, Critical Damage rises ${pc(P.crit)}, and every third Basic accelerates Crafty Grapple. Its Damage rises ${pc(P.pass)} per enemy crossed; a Grapple defeat immediately triggers Whatever Works.`,
      passive: (u, B, S, P) => {
        u.scrapsRed = true; u.scrapsRedAtk = S.atk; u.scrapsRedExtra = S.extra;
        u.scrapsRedCrit = P.crit; u.scrapsRedEnergy = P.energy; u.scrapsRedPass = P.pass;
      }
    }
  }
});

/* ============================================================ VEE
   Tank / Support / Battlefield Director - A Tier */
defHero({
  id: 'Vee', name: 'Vee', folder: 'Vee', file: 'Vee', icon: 'Vee',
  role: 'Tank', tier: 'A', element: 'Broadcast',
  blurb: 'Gardenview\'s host. She does not tank because she is tough; she tanks because she decides where the camera points.',
  base: { hp: 5250, atk: 245, def: 325, mag: 295, mdef: 330, spd: 102, acc: 195, eva: 105 },
  hidden: { range: 200, aspd: 0.92, ms: 68, aggro: 1.5, crit: .07, critDmg: 1.5, healPow: 1.15, shieldPow: 1.25, cdr: .06, ccRes: .25, kbRes: .6, armorPen: 0, magPen: .06 },
  growth: { hp: .102, atk: .075, def: .095, mag: .086, mdef: .095 },
  move: { gait: 'glide', bob: 3, freq: 1.6, lean: 4, squash: .03, idle: 'scan', step: 'step_metal',
    particles: 'static', pcol: '#7be0ff', trail: { on: true, col: '#7be0ff', rate: .14 }, brake: .2 },
  basic: { name: 'Signal Jab', type: 'physical', ratio: 1.08, range: 210, sfx: 'swing_pole', hit: 'hit_blunt',
    wind: .18, note: 'Sharp, professional, mildly threatening.',
    onHit: (u, t, B) => { if (t.hasStatus('headline')) B.energy(u, 7); } },
  skills: {
    W: {
      name: 'Spotlight On', type: 'Magic Damage', energy: 100,
      v: { ratio: 1.45, heal: .08 }, p: { blind: 5, drain: .40, acc: .20, energy: 6 },
      desc: (S, P) => `<span class="sk-pas">Vee tags the enemy contributing the most damage as the 📺 Headline. Allies gain <em>${pcn(P.acc * 100)}</em> Accuracy against it and <em>${Math.round(P.energy)}</em> Energy whenever it casts.</span>
        Active: studio lights flood the field for <em>${pcn(S.ratio * 100)}</em> Magic. The Headline is interrupted, 🌑 Blinded for ${P.blind}s and loses <em>${pcn(P.drain * 100)}</em> Energy. If it falls while marked, the team heals <em>${pcn(S.heal * 100)}</em> Max HP and a new one is named.`,
      passive: (u, B, S, P) => {
        B.every(u, 3, () => {
          const foes = B.enemiesOf(u); if (!foes.length) return;
          const top = foes.reduce((a, b) => (b.dmgDone || 0) > (a.dmgDone || 0) ? b : a);
          if (top.hasStatus('headline')) return;
          foes.forEach(f => B.removeStatus(f, 'headline'));
          B.applyStatus(u, top, 'headline', 999); Sound.play('lock', { vol: .5 });
          B.fxFloatIcon(top.x, top.y - 100, '📺');
        });
        B.teamAura(u, m => { m.accP += P.acc; });
        B.on(u, 'enemyCast', e => { if (e.hasStatus('headline')) B.alliesOf(u).forEach(a => B.energy(a, P.energy)); });
        B.on(u, 'enemyDown', e => { if (e.hasStatus('headline'))
          B.alliesOf(u).forEach(a => B.heal(u, a, u.max.hp * S.heal, { tag: 'ratings' })); });
      },
      cast: (u, B, S, P) => {
        B.anim(u, 'cast', .68, 'veeSpotlight'); Sound.play('flash');
        const foes = B.enemiesOf(u), headline = foes.find(e => e.hasStatus('headline'));
        B.fxVeeSpotlight(u, foes, headline);
        B.after(.3, () => {
          B.flash('#eaf7ff', .24, .55); B.shake(6, .3); Sound.play('ult');
          B.enemiesOf(u).forEach(e => {
            B.damage(u, e, u.st.mag * S.ratio, { type: 'magic', tag: 'Spotlight On' });
            if (e.hasStatus('headline')) {
              B.interrupt(e); B.applyStatus(u, e, 'blind', P.blind);
              e.energy = Math.max(0, e.energy * (1 - P.drain));
            }
          });
        });
      }
    },
    G: {
      name: 'Audience Support', type: 'Healing', cd: 11,
      v: { heal: .14 }, p: { dur: 5, count: 3, fortify: 3 },
      desc: (S, P) => `The crowd cheers. The ${P.count} weakest allies heal <em>${pcn(S.heal * 100)}</em> of Vee's Max HP over ${P.dur}s while gaining Defense. Overheal becomes a 🛡 Shield; already-shielded allies get Energy Generation instead.`,
      ai: { prio: 58, cond: (u, B) => B.alliesOf(u).some(a => a.hpPct < .8) },
      cast: (u, B, S, P) => {
        B.anim(u, 'cast', .72, 'veeAudience'); Sound.play('cheer');
        const chosen = B.alliesOf(u).sort((a, b) => a.hpPct - b.hpPct).slice(0, P.count);
        B.fxVeeAudience(u, chosen);
        chosen.forEach(a => {
          B.applyStatus(u, a, 'fortify', P.dur, { stacks: P.fortify });
          if (a.hasStatus('shield')) B.applyStatus(u, a, 'overcharge', P.dur);
          B.applyStatus(u, a, 'regen', P.dur, { val: u.max.hp * S.heal / P.dur, overheal: 'shield' });
          B.fxSparkle(a.x, a.y - 40, 10, '#7bd66a');
        });
      }
    },
    B: {
      name: 'Commercial Break', type: 'Team Buff', cd: 14,
      v: { heal: .06 }, p: { dur: 6, hasteStacks: 2 },
      desc: (S, P) => `Vee cuts to ads for ${P.dur}s. Enemy cooldowns crawl, allies gain 💨 Haste, faster Energy and immunity to Energy drain. Ally skills cast during the break heal their caster for <em>${pcn(S.heal * 100)}</em> of Vee's Max HP.`,
      ai: { prio: 42, cond: (u, B) => B.enemiesOf(u).length >= 2 },
      cast: (u, B, S, P) => {
        B.anim(u, 'cast', .78, 'veeCommercial'); Sound.play('ui_open'); B.tint('#1b2a55', .3, .5);
        const enemies = B.enemiesOf(u), allies = B.alliesOf(u);
        B.fxVeeCommercial(u, allies, enemies, P.dur);
        enemies.forEach(e => B.applyStatus(u, e, 'drowsy', P.dur));
        allies.forEach(a => {
          B.applyStatus(u, a, 'haste', P.dur, { stacks: P.hasteStacks });
          B.applyStatus(u, a, 'overcharge', P.dur);
        });
        u._breakUntil = B.t + P.dur;
        B.on(u, 'allyCast', a => { if (B.t < (u._breakUntil || 0)) B.heal(u, a, u.max.hp * S.heal, { silent: true }); });
      }
    },
    P: {
      name: 'Studio Production', type: 'Defense / Magic Defense',
      v: { def: .035, mdef: .025 }, p: { maxStacks: 10, redirect: .25, energy: 10, absorbP: .6 },
      desc: (S, P) => `Each time an ally damages the 📺 Headline, Vee gains Production Value (max ${P.maxStacks}), worth <em>${pcn(S.def * 100)}</em> Defense and <em>${pcn((S.mdef || .025) * 100)}</em> Magic Defense each. She redirects up to <em>${pcn(P.redirect * 100)}</em> of nearby ally damage onto herself at reduced strength, granting them <em>${Math.round(P.energy)}</em> Energy. Stacks are only lost if Vee falls.`,
      passive: (u, B, S, P) => {
        u.prodMax = P.maxStacks; u.prodDef = S.def;
        B.on(u, 'allyDamageDealt', ev => {
          if (ev.target && ev.target.hasStatus('headline')) {
            u.prod = Math.min((u.prod || 0) + 1, P.maxStacks);
            u.flat.defPProd = (u.prod || 0) * S.def;
            u.flat.mdefPProd = (u.prod || 0) * (S.mdef || .025);
            u.dirty = true;
          }
        });
        B.on(u, 'allyDamaged', ev => {
          const prod = u.prod || 0;
          if (prod < 4 || ev.unit === u || !u.alive) return;
          if (B.distance(ev.unit, u) > 280) return;
          const pct = prod >= P.maxStacks ? P.redirect : (P.redirect * (prod / P.maxStacks));
          const moved = ev.amount * pct;
          ev.amount -= moved;
          B.damage(ev.src, u, moved * P.absorbP, { type: 'true', redirected: true, noDodge: true, tag: 'redirect' });
          if (u.alive) B.energy(ev.unit, P.energy);
        });
      }
    },
    R: {
      name: 'Season Finale', type: 'Battle Opener',
      v: { exposeDmg: .18, def: .05, mag: .35 }, p: { needExposure: 6, liveDur: 12, energy: 22, cdr: 2.5 },
      desc: (S, P) => `Enemies build Exposure by acting. At ${P.needExposure} they become the 📺 Headline: less damage, no hiding, less healing, and <em>${pcn(S.exposeDmg * 100)}</em> more damage taken. Each Headline defeated refreshes ally shields, restores <em>${Math.round(P.energy)}</em> Energy, and grants Vee <em>${pcn(S.def * 100)}</em> Defense permanently. Once per battle, if Vee is last alive she goes Live for ${P.liveDur}s with <em>${pcn(S.mag * 100)}</em> Magic Attack and every enemy is a Headline.`,
      passive: (u, B, S, P) => {
        u.antiDodge = target => !!(target && (target.hasStatus('headline') || B.t < (target._veeOnAirUntil || 0)));
        B.on(u, 'waveStart', () => { u._live = false; });
        B.on(u, 'enemyAction', e => {
          e.exposure = (e.exposure || 0) + 1;
          if (e.exposure >= P.needExposure && !e.hasStatus('headline')) {
            e._veeOnAirUntil = B.t + 999;
            B.applyStatus(u, e, 'headline', 999); B.applyStatus(u, e, 'grief', 999);
            B.fxFloatIcon(e.x, e.y - 100, '📺'); Sound.play('gasp', { vol: .5 });
          }
        });
        B.on(u, 'enemyDown', e => {
          if (!e.hasStatus('headline')) return;
          B.alliesOf(u).forEach(a => { B.energy(a, P.energy); B.refreshShields(a); B.reduceCd(a, P.cdr); });
          u.flat.defP2 = (u.flat.defP2 || 0) + S.def; u.dirty = true;
        });
        B.every(u, 1, () => {
          if (u._live || !u.alive) return;
          if (B.alliesOf(u).filter(a => a !== u && a.alive).length === 0) {
            u._live = true; B.log('<b>LIVE BROADCAST</b>'); Sound.play('suddendeath');
            B.tint('#ff2b6b', .3, 1.2); B.applyStatus(u, u, 'ccimmune', P.liveDur);
            B.applyStatus(u, u, 'spotlight', P.liveDur);
            B.applyStatus(u, u, 'haste', P.liveDur, { stacks: 2 });
            u.flat.magP2 = (u.flat.magP2 || 0) + S.mag;
            u.rangeBonus = 240; u.dirty = true;
            B.enemiesOf(u).forEach(e => B.applyStatus(u, e, 'headline', P.liveDur));
          }
        });
      }
    }
  }
});

/* ============================================================ COSMO
   Healer / Sustain Support - A Tier */
defHero({
  id: 'Cosmo', name: 'Cosmo', folder: 'Cosmo', file: 'Cosmo', icon: 'Cosmo',
  role: 'Support', tier: 'A', element: 'Bake',
  blurb: 'Bakes for everyone but himself. The most reliable healing in the Depths and the least sustainable.',
  base: { hp: 3900, atk: 152, def: 210, mag: 330, mdef: 300, spd: 98, acc: 170, eva: 105 },
  hidden: { range: 280, aspd: 0.88, ms: 60, aggro: .7, crit: .04, critDmg: 1.4, healPow: 1.45, shieldPow: 1.30, cdr: .05, ccRes: .15, kbRes: .3, armorPen: 0, magPen: 0 },
  growth: { hp: .092, atk: .065, def: .082, mag: .095, mdef: .09 },
  move: { gait: 'waddle', bob: 7, freq: 1.7, lean: 6, squash: .06, idle: 'breathe', step: 'step_soft',
    particles: 'crumbs', pcol: '#ffd7a0', trail: { on: false }, brake: .3 },
  basic: { name: 'Warm Roll', type: 'magic', ratio: .92, range: 280, proj: 'food', pimg: 'Roll',
    sfx: 'whoosh', hit: 'hit_light', wind: .24, note: 'He throws food. It is somehow effective.',
    onHit: (u, t, B) => { const w = B.lowestHp(B.alliesOf(u)); if (w) B.heal(u, w, u.st.mag * .12, { silent: true }); } },
  skills: {
    W: {
      name: 'Sharing is Caring', type: 'Healing', energy: 100,
      v: { heal: 1.5 }, p: { thr: .35, bonus: .6, dr: 4, cost: .10 },
      desc: (S, P) => `<span class="sk-pas">Anyone Cosmo heals gains Damage Reduction for ${P.dr}s. Cosmo cannot be healed by his own abilities.</span>
        Active: he spends <em>${pc(P.cost)}</em> of his own Max HP to heal his weakest ally <em>${pcn(S.heal * 100)}</em> Magic and strip every debuff. Below ${pc(P.thr)} HP the heal is <em>${pc(P.bonus)}</em> stronger.`,
      passive: (u, B, S, P) => {
        u.noSelfHeal = true;
        B.on(u, 'healDone', ev => { if (ev.target !== u) B.applyStatus(u, ev.target, 'ward', P.dr); });
      },
      cast: (u, B, S, P) => {
        const t = B.lowestHp(B.alliesOf(u).filter(a => a !== u)) || B.lowestHp(B.alliesOf(u));
        if (!t) return;
        B.anim(u, 'cast', .5); Sound.play('get_food');
        B.after(.3, () => {
          B.damage(u, u, u.max.hp * P.cost, { type: 'true', selfharm: true, silent: true });
          const mult = t.hpPct < P.thr ? 1 + P.bonus : 1;
          B.heal(u, t, u.st.mag * S.heal * mult, { tag: 'Sharing is Caring' });
          B.cleanseAll(t); B.fxHeartLink(u, t);
          Sound.play('cleanse', { vol: .28 }); Sound.play('heal'); B.fxSparkle(t.x, t.y - 40, 20, '#ffd7a0');
          if (u.rarity >= 4) B.alliesOf(u).forEach(a => {
            if (a !== t && B.distance(a, t) < 200) { B.heal(u, a, u.st.mag * S.heal * (u._cosmoSplash||.45)); B.applyStatus(u, a, 'speedup', 5); }
          });
        });
      }
    },
    G: {
      name: 'Fresh Baked Treats', type: 'Healing', cd: 9,
      v: { heal: .30 }, p: { dur: 5, crit: .25 },
      desc: (S, P) => `Treats to the weakest ally, healing <em>${pcn(S.heal * 100)}</em> Magic per second for ${P.dur}s. Below ${pc(P.crit)} HP they also gain 🧱 Fortify.`,
      ai: { prio: 62, cond: (u, B) => B.alliesOf(u).some(a => a.hpPct < .9) },
      cast: (u, B, S, P) => {
        const t = B.lowestHp(B.alliesOf(u)); if (!t) return;
        B.anim(u, 'cast', .35);
        B.fxProj(u, t, { kind: 'food', img: 'Brownie' }, () => {
          Sound.play('get_food', { vol: .6 }); Sound.play('item_pop', { vol: .24, throttle: 120 });
          B.applyStatus(u, t, 'regen', P.dur, { val: u.st.mag * S.heal, overheal: u.rarity >= 5 ? 'shield' : null });
          if (t.hpPct < P.crit) B.applyStatus(u, t, 'fortify', P.dur, { stacks: 3 });
        });
        if (u.rarity >= 5) B.after(P.dur, () => {
          const w = B.lowestHp(B.alliesOf(u)); if (w) B.heal(u, w, u.st.mag * (u._cosmoGift||S.heal*2), { overheal: 'shield' });
        });
      }
    },
    B: {
      name: 'Comforting Presence', type: 'Team Buff', cd: 16,
      v: { shield: .14 }, p: { dur: 6.0 },
      desc: (S, P) => `For ${P.dur}s the whole team takes 30% less damage and receives 35% more healing. While active, any ally who drops below 50% HP immediately receives a comforting Shield worth <em>${pcn(S.shield * 100)}</em> of Cosmo's Max HP.`,
      ai: { prio: 50, cond: (u, B) => B.alliesOf(u).filter(a => a.hpPct < .7).length >= 2 || B.t > 12 },
      cast: (u, B, S, P) => {
        B.anim(u, 'cast', .4); Sound.play('buff'); Sound.play('cheer', { vol: .28 }); B.tint('#ffbe7a', .18, .5);
        B.alliesOf(u).forEach(a => {
          B.applyStatus(u, a, 'ward', P.dur);
          B.applyStatus(u, a, 'rally', P.dur);
          B.fxRing(a.x, a.y - 40, 70, '#ffd7a0');
        });
        u._comfortUntil = B.t + P.dur;
        if (!u._comfortListener) {
          u._comfortListener = true;
          B.on(u, 'allyDamaged', ev => {
            if (B.t > (u._comfortUntil || 0) || !ev.unit || !ev.unit.alive || ev.unit.hpPct >= .50) return;
            if (ev.unit._comfortShielded && B.t - ev.unit._comfortShielded < P.dur) return;
            ev.unit._comfortShielded = B.t;
            B.shield(u, ev.unit, u.max.hp * S.shield, 4);
            B.fxSparkle(ev.unit.x, ev.unit.y - 40, 10, '#ffd166');
          });
        }
      }
    },
    P: {
      name: 'A Recipe For Care', type: 'Healing Upgrade',
      v: { healPow: .18 }, p: { splash: .45 },
      desc: (S, P) => `Sharing is Caring splashes ${Math.round(P.splash*100)}% of its healing onto allies near its target. Everyone it heals gains Speed Up. In addition, Cosmo gains <em>+${pcn(S.healPow * 100)}</em> Healing Power.`,
      passive: (u, B, S, P) => {
        u._cosmoSplash = P.splash;
        u.flat.healPowP = (u.flat.healPowP || 0) + S.healPow;
        u.dirty = true;
      }
    },
    R: {
      name: 'The Sweetest Gift', type: 'Healing / Shield',
      v: { gift: .60 }, p: {},
      desc: (S, P) => `Fresh Baked Treats leaves a second treat worth <em>${pcn(S.gift * 100)}</em> Magic healing. Any overhealing Cosmo does becomes a Shield.`,
      passive: (u, B, S, P) => {
        u.overhealShield = true;
        u._cosmoGift = S.gift;
      }
    }
  }
});

/* ============================================================ COCOA
   Support / Utility / Buffer - SS Tier
   The BonBon economy: prepare, deliver on ally casts, convert to Sugar Rush. */
defHero({
  id: 'Cocoa', name: 'Cocoa', folder: 'Cocoa', file: 'Cocoa', icon: 'Cocoa',
  role: 'Support', tier: 'SS', element: 'Chocolate',
  blurb: 'An endlessly cheerful chocolate rabbit whose portable confectionery supplies ensure no ally ever runs out of stamina. Through expert BonBon crafting, Cocoa accelerates her team\'s tempo, distributes protective candy coatings, and turns combat into a sugar-fueled symphony.',
  base: { hp: 4900, atk: 220, def: 300, mag: 415, mdef: 325, spd: 128, acc: 215, eva: 150 },
  hidden: { range: 280, aspd: 1.10, ms: 84, aggro: .55, crit: .10, critDmg: 1.55, healPow: 1.35, shieldPow: 1.55, cdr: .20, ccRes: .25, kbRes: .40, armorPen: 0, magPen: .12 },
  growth: { hp: .102, atk: .070, def: .090, mag: .110, mdef: .096 },
  move: { gait: 'hop', bob: 12, freq: 2.4, lean: 7, squash: .12, idle: 'bounce', step: 'bounce',
    particles: 'crumbs', pcol: '#c98a5a', trail: { on: true, col: '#f3d3a7', rate: .12 }, brake: .25 },
  basic: {
    name: 'Candy Flick', type: 'magic', ratio: 1.15, range: 280, proj: 'orb', pcol: '#c98a5a',
    sfx: 'whoosh', hit: 'hit_light', animStyle: 'cocoaBasicFlick', wind: .18,
    note: 'Flicks confection-infused treats that deal Magic Damage, recharge team Energy, and craft BonBons.',
    onHit: (u, t, B) => {
      if (chance(.35)) B.bonbon(u, 1);
      u._cocoaBasics = (u._cocoaBasics || 0) + 1;
      if (u._cocoaBasics % 2 === 0) {
        const ally = B.lowestEnergy(B.alliesOf(u)) || u;
        if (ally && ally.alive) {
          B.energy(ally, 16);
          B.applyStatus(u, ally, 'speedup', 2.5);
          B.bonbon(u, 1);
          B.fxSparkle(ally.x, ally.y - 45, 6, '#f3d3a7');
          B.fxFloatIcon(ally.x, ally.y - 95, '🍬 SWEET FLICK +16⚡', '#c98a5a');
          Sound.play('item_pop', { vol: .35, throttle: 120 });
        }
      }
    }
  },
  skills: {
    W: {
      name: 'BonBon Delivery', type: 'Team Buff', energy: 100, cd: 4.5,
      v: { en: 36 }, p: { prepEvery: 3.0, max: 5, rushDur: 9.0 },
      desc: (S, P) => `<span class="sk-pas">Cocoa bakes a BonBon every ${P.prepEvery}s (storing up to ${P.max}). Whenever an ally casts a skill, she tosses them a freshly wrapped BonBon (once every 3.5s per ally). Recipients gain 🍬 Sugar Rush for <em>${P.rushDur}s</em> (+25% Attack Speed, +25% Move Speed, +22% Cooldown Reduction, +30% Energy Generation). If an ally already has Sugar Rush, the delivery refreshes its duration, restores <em>${Math.round(S.en)}</em> Energy, and grants them +15% Skill Haste.</span>
        Active: Cocoa throws open her confection basket, expending all stored BonBons to treat every living ally! All allies receive 🍬 Sugar Rush for <em>${P.rushDur}s</em> and restore <em>${Math.round(S.en * 1.25)}</em> Energy. Allies already rushing gain an extra <em>${Math.round(S.en * 0.75)}</em> bonus Energy and 2s of CC Immunity. Every consumed BonBon has a chance to be refunded by Always Prepared.`,
      ai: { cond: (u, B) => (u.bonbons || 0) > 0 && B.alliesOf(u).some(a => !a.hasStatus('sugarrush') || (a.getStatus('sugarrush').t || 0) < 4) },
      passive: (u, B, S, P) => {
        u.bonbons = P.max; u.bonbonMax = P.max;
        B.every(u, P.prepEvery, () => B.bonbon(u, 1));
        B.on(u, 'waveStart', () => {
          u.bonbons = u.sugarPlus ? (u.bonbonMax || 7) : Math.min(u.bonbonMax || 5, (u.bonbons || 0) + 3);
          B.alliesOf(u).forEach(a => { a._bonCd = -Infinity; a._freeBon = -Infinity; });
        });
        u._cocoaConsumeBonbon = () => {
          if ((u.bonbons || 0) <= 0) return false;
          u.bonbons--;
          if (u.bonbonRefund && chance(u.bonbonRefund)) {
            u.bonbons = Math.min(u.bonbonMax || P.max, u.bonbons + 1);
            B.fxFloatIcon(u.x, u.y - 95, '🍬 BONBON SAVED!', '#c98a5a');
            Sound.play('item_pop', { vol: .3, throttle: 150 });
          }
          return true;
        };
        u._cocoaApplyRush = a => {
          if (!a || !a.alive || a.team !== u.team) return false;
          const rush = a.getStatus('sugarrush');
          const repeated = !!rush;
          if (rush) {
            B.energy(a, S.en);
            rush.t = Math.max(rush.t, P.rushDur);
            B.applyStatus(u, a, 'haste', 4.0);
          } else {
            B.applyStatus(u, a, 'sugarrush', P.rushDur);
          }
          B.emitFor(u, 'bonbonDelivered', { target: a, repeated });
          return true;
        };
        u._cocoaDeliverBonbon = (a, respectCooldown) => {
          if (!a || !a.alive || (u.bonbons || 0) <= 0) return false;
          if (respectCooldown && Number.isFinite(a._bonCd) && B.t - a._bonCd < 3.5) return false;
          if (!u._cocoaConsumeBonbon()) return false;
          if (respectCooldown) a._bonCd = B.t;
          u._cocoaApplyRush(a);
          B.fxProj(u, a, { kind: 'orb', col: '#c98a5a' }, () => {
            Sound.play('get_food', { vol: .45 });
            B.fxFloatIcon(a.x, a.y - 85, '🍬 SUGAR RUSH!', '#c98a5a');
            B.fxSparkle(a.x, a.y - 40, 8, '#f3d3a7');
          });
          return true;
        };
        B.on(u, 'allyCast', a => {
          if (a === u || (u.bonbons || 0) <= 0) return;
          u._cocoaDeliverBonbon(a, true);
        });
      },
      cast: (u, B, S, P) => {
        const stock = u.bonbons || 0;
        if (!stock) return;
        u.bonbons = 0;
        for (let i = 0; i < stock; i++) if (u.bonbonRefund && chance(u.bonbonRefund)) u.bonbons++;
        B.anim(u, 'cast', .72, 'cocoaBonbonBurst');
        Sound.play('cheer');
        Sound.play('get_food', { vol: .42, throttle: 180 });
        B.tint('#c98a5a', .18, .5);
        B.fxRing(u.x, u.y - 34, 95, '#e8b98a');
        B.after(.28, () => {
          B.alliesOf(u).forEach(a => {
            const wasRushing = a.hasStatus('sugarrush');
            u._cocoaApplyRush(a);
            B.energy(a, S.en * 1.25);
            if (wasRushing) {
              B.energy(a, S.en * 0.75);
              B.applyStatus(u, a, 'ccimmune', 2.0);
            }
            B.fxSparkle(a.x, a.y - 40, 12, '#e8b98a');
            B.fxFloatIcon(a.x, a.y - 90, '🍬 BONBON FEAST!', '#e8b98a');
          });
        });
      }
    },
    G: {
      name: 'Sharing is Caring', type: 'Shield / Cleanse', cd: 8.0,
      v: { shield: .28, heal: .14 }, p: { dur: 8.0, lowThr: .50 },
      desc: (S, P) => `<span class="sk-pas">Whenever an ally gains 🍬 Sugar Rush or receives a BonBon, they gain a Confection Shield worth <em>${pcn(S.shield * 100)}</em> of Cocoa's Max HP for ${P.dur}s (amplified by +50% for allies below ${pc(P.lowThr)} HP). If the ally is already shielded, the coating converts into sweet icing, regenerating <em>${pcn(S.heal * 100)}</em> Max HP over ${P.dur}s and granting +6 Energy.</span>
        Active: Cocoa scatters a wave of comforting chocolate glaze across the team! Cleanses up to 2 debuffs from every ally, applies 🍫 BonBon Blessing (+15% CC Resistance and debuff purge), and shields everyone for <em>${pcn(S.shield * 100)}</em> Max HP. Allies below ${pc(P.lowThr)} HP are immediately healed for <em>${pcn(S.heal * 100)}</em> of Cocoa's Max HP.`,
      ai: { prio: 54, cond: (u, B) => B.alliesOf(u).some(a => a.hpPct < .9) },
      passive: (u, B, S, P) => {
        B.on(u, 'statusApplied', ev => {
          if (ev.id !== 'sugarrush' || ev.src !== u) return;
          const a = ev.unit;
          if (!a || !a.alive) return;
          const amt = u.max.hp * S.shield * (a.hpPct < P.lowThr ? 1.5 : 1.0);
          if (a.hasStatus('shield')) {
            B.applyStatus(u, a, 'regen', P.dur, { val: (u.max.hp * S.heal) / P.dur });
            B.energy(a, 6);
            B.fxFloatIcon(a.x, a.y - 95, '🍯 SWEET REGEN', '#f3d3a7');
          } else {
            B.shield(u, a, amt, P.dur);
            B.fxFloatIcon(a.x, a.y - 95, '🍫 CANDY SHIELD', '#f3d3a7');
          }
        });
      },
      cast: (u, B, S, P) => {
        B.anim(u, 'cast', .68, 'cocoaShareCleanse');
        Sound.play('guard');
        Sound.play('cure_all', { vol: .42 });
        B.fxRing(u.x, u.y - 34, 110, '#f3d3a7');
        B.alliesOf(u).forEach(a => {
          B.cleanse(a, 2);
          B.applyStatus(u, a, 'bonbonblessing', P.dur);
          const amt = u.max.hp * S.shield * (a.hpPct < P.lowThr ? 1.5 : 1.0);
          B.shield(u, a, amt, P.dur);
          if (a.hpPct < P.lowThr) {
            B.heal(u, a, u.max.hp * S.heal, { tag: 'Sharing is Caring' });
            B.fxFloatIcon(a.x, a.y - 110, '💖 CARE HEAL', '#fff1c2');
          }
          B.fxSparkle(a.x, a.y - 44, 10, '#fff1c2');
        });
      }
    },
    B: {
      name: 'Sweet Surprise', type: 'Magic Damage', cd: 9.5,
      v: { ratio: 1.45, energyBonus: 5 }, p: { dur: 7.0 },
      desc: (S, P) => `Cocoa tosses a hefty festive chocolate bomb into the densest cluster of enemies, detonating on impact for <em>${pcn(S.ratio * 100)}</em> Magic Damage and coating all foes within 340 range in molten chocolate for ${P.dur}s. The blast strips up to 2 removable buffs from each target and afflicts them with 🍯 Sticky (-30% Move Speed, -25% Attack Speed) and 🥱 Drowsy (-25% Cooldown Rate).
        Allies who strike coated enemies restore <em>${Math.round(S.energyBonus)}</em> Energy and gain +20% Move Speed for 2s (up to once every 1.0s per ally).`,
      ai: { prio: 47, cond: () => true },
      cast: (u, B, S, P) => {
        B.anim(u, 'cast', .78, 'cocoaChocolateToss');
        Sound.play('throwsomething', { vol: .40 });
        Sound.play('bomb', { vol: .45, delay: 220 });
        B.after(.34, () => {
          const cx = B.avgX(B.enemiesOf(u));
          B.fxBoom(cx, B.ground - 60, 1.55, '#c98a5a');
          B.shake(7, .25);
          B.fxRing(cx, B.ground - 60, 160, '#c98a5a', .4);
          B.enemiesOf(u).forEach(e => {
            if (Math.abs(e.x - cx) > 340) return;
            B.damage(u, e, u.st.mag * S.ratio, { type: 'magic', tag: 'Sweet Surprise' });
            const buffs = e.statuses.filter(s => STATUS[s.id] && STATUS[s.id].kind === 'buff' && s.id !== 'shield' && !s.apexLocked).slice(0, 2);
            buffs.forEach(b => B.removeStatus(e, b.id));
            B.applyStatus(u, e, 'sticky', P.dur);
            B.applyStatus(u, e, 'drowsy', P.dur);
            B.fxFloatIcon(e.x, e.y - 85, '🍫 CHOCO COATED!', '#c98a5a');
          });
          u._chocoUntil = B.t + P.dur;
          if (!u._cocoaChocolateHook) {
            u._cocoaChocolateHook = true;
            B.on(u, 'allyDamageDealt', ev => {
              if (B.t >= (u._chocoUntil || 0) || !ev.target || !ev.target.hasStatus('sticky') || !ev.src || ev.src.team !== u.team) return;
              if (Number.isFinite(ev.src._cocoaChocoAt) && B.t - ev.src._cocoaChocoAt < 1.0) return;
              ev.src._cocoaChocoAt = B.t;
              B.energy(ev.src, S.energyBonus);
              B.applyStatus(u, ev.src, 'speedup', 2.0);
              B.fxFloatIcon(ev.src.x, ev.src.y - 80, `⚡ +${Math.round(S.energyBonus)}`, '#f3d3a7');
            });
          }
        });
      }
    },
    P: {
      name: 'Always Prepared', type: 'Energy',
      v: { refund: .50, killEnergy: 25, killCdr: 2.5 }, p: { extra: 2 },
      desc: (S, P) => `<span class="sk-pas">Cocoa expands her confection bag capacity by +${P.extra} BonBons (storing up to 7), and increases her Base Cooldown Reduction by +15% and Healing/Shielding Power by +15%. Every BonBon consumed has a <em>${pcn(S.refund * 100)}</em> chance to be immediately refunded into storage.</span>
        Whenever an ally under 🍬 Sugar Rush defeats an enemy, Cocoa instantly restores <em>${Math.round(S.killEnergy)}</em> Energy, reduces all her skill cooldowns by <em>${S.killCdr.toFixed(1)}s</em>, and bakes an emergency BonBon.`,
      passive: (u, B, S, P) => {
        u.bonbonMax = (u.bonbonMax || 5) + P.extra;
        u.bonbonRefund = S.refund;
        u.flat.cdr = (u.flat.cdr || 0) + 0.15;
        u.flat.healPowP = (u.flat.healPowP || 0) + 0.15;
        u.flat.shieldPowP = (u.flat.shieldPowP || 0) + 0.15;
        u.dirty = true;
        B.on(u, 'enemyDown', e => {
          const killer = e && e._lastHitBy;
          if (killer && killer.team === u.team && killer.hasStatus('sugarrush')) {
            B.energy(u, S.killEnergy);
            B.reduceCd(u, S.killCdr);
            B.bonbon(u, 1);
            B.fxFloatIcon(u.x, u.y - 105, `🍬 TAKEDOWN TREAT +${Math.round(S.killEnergy)}⚡`, '#c98a5a');
            Sound.play('item_pop', { vol: .4 });
          }
        });
      }
    },
    R: {
      name: 'A Basket for Everyone', type: 'Max HP / Shield',
      v: { hasteBonus: .18, energyGen: .25, tickEnergy: 6 }, p: { thr: .50, lowCd: 6.0 },
      desc: (S, P) => `<span class="sk-pas">Cocoa begins every battle with a full stock of BonBons. 🍬 Sugar Rush is permanently empowered with +15% Crit Chance, +25% Tenacity (CC Resistance), and immunity to being stripped. Any ally dropping below ${pc(P.thr)} HP automatically receives an emergency BonBon without consuming storage, granting instant Sugar Rush, 🍫 BonBon Blessing, and Lucky for 8s (once every ${P.lowCd}s per ally).</span>
        <b>Sugar Symphony:</b> While all living allies are under Sugar Rush, the team enters a sweet frenzy: gaining +<em>${pcn(S.hasteBonus * 100)}</em> Cooldown Acceleration, +<em>${pcn(S.energyGen * 100)}</em> Energy Generation, full immunity to buff dispels, and a pulse of <em>${Math.round(S.tickEnergy)}</em> Energy every second. Any BonBons baked while storage is full overflow as instant healing treats to the lowest-HP ally (restoring 12% Max HP and 10 Energy).`,
      passive: (u, B, S, P) => {
        u.bonbons = u.bonbonMax || 7;
        u.sugarPlus = true;
        u.cocoaOverflow = true;
        u.cocoaOverflowDur = 8;
        B.on(u, 'allyLow', a => {
          if (a._freeBon && B.t - a._freeBon < P.lowCd) return;
          if (a.hpPct > P.thr) return;
          a._freeBon = B.t;
          B.applyStatus(u, a, 'sugarrush', 8);
          B.applyStatus(u, a, 'bonbonblessing', 8);
          B.applyStatus(u, a, 'lucky', 8);
          B.heal(u, a, u.max.hp * 0.10, { tag: 'Basket Rescue' });
          B.fxSparkle(a.x, a.y - 45, 10, '#f3d3a7');
          B.fxFloatIcon(a.x, a.y - 95, '🍬 EMERGENCY BASKET!', '#c98a5a');
          Sound.play('item_pop', { vol: .45 });
        });
        B.every(u, 1, () => {
          const all = B.alliesOf(u);
          const fullTeam = all.length > 0 && all.every(a => a.hasStatus('sugarrush'));
          all.forEach(a => {
            const powered = a.hasStatus('sugarrush');
            if (powered) {
              B.applyStatus(u, a, 'lucky', 1.4);
              B.applyStatus(u, a, 'bonbonblessing', 1.4);
            }
            a.flat.cdr7 = fullTeam ? S.hasteBonus : 0;
            a.flat.energyGen7 = fullTeam ? S.energyGen : 0;
            a._cocoaBuffGuardUntil = fullTeam ? B.t + 1.2 : 0;
            a.dirty = true;
            if (fullTeam) {
              B.energy(a, S.tickEnergy);
              if (chance(.25)) B.fxSparkle(a.x, a.y - 45, 4, '#e8b98a');
            }
          });
        });
      }
    }
  }
});

/* ============================================================ BOBETTE
   Defensive Support / Survival Tank - B Tier */
defHero({
  id: 'Bobette', name: 'Bobette', folder: 'Bobette', file: 'Bobette', icon: 'Bobette',
  role: 'Tank', tier: 'B', element: 'Holiday',
  blurb: 'Bobette Carolynne wraps presents for a living and treats her whole team like the fragile ones.',
  base: { hp: 5600, atk: 232, def: 348, mag: 190, mdef: 292, spd: 90, acc: 162, eva: 82 },
  hidden: { range: 190, aspd: .80, ms: 56, aggro: 1.9, crit: .05, critDmg: 1.5, healPow: 1.15, shieldPow: 1.50, cdr: .04, ccRes: .35, kbRes: .8, armorPen: 0, magPen: 0 },
  growth: { hp: .112, atk: .068, def: .100, mag: .062, mdef: .090 },
  move: { gait: 'waddle', bob: 6, freq: 1.3, lean: 4, squash: .07, idle: 'settle', step: 'step_soft',
    particles: 'confetti', pcol: '#e8536b', trail: { on: false }, brake: .7, weight: 1.4 },
  basic: { name: 'Ribbon Swat', type: 'physical', ratio: 1.12, range: 190, sfx: 'swing_light', hit: 'hit_blunt', animStyle: 'bobetteRibbonSwat',
    wind: .24, note: 'A firm swat with a roll of wrapping paper.',
    onHit: (u, t, B) => { if (chance(.25)) B.applyStatus(u, t, 'wrapped', 4); } },
  skills: {
    W: {
      name: 'Precious Packaging', type: 'Shield', energy: 100,
      v: { shield: .24, heal: .28 }, p: { wrap: 3, slow: 4, kb: 130, root: 1.35, boost: 1.8 },
      desc: (S, P) => `<span class="sk-pas">Taking a heavy hit grants 📦 Packed Protection, raising Bobette's Defense. At max stacks her next Shield is boosted by <em>${pcn((P.boost - 1) * 100)}</em>.</span>
        Active: she wraps herself in a gift box for ${P.wrap}s, unable to act but taking greatly reduced damage and immune to crowd control. When it opens she heals <em>${pcn(S.heal * 100)}</em> Max HP, shields nearby allies for <em>${pcn(S.shield * 100)}</em> Max HP, and shoves enemies away 🐢 Slowed for ${P.slow}s (Rooted for ${P.root}s if already Wrapped).`,
      passive: (u, B) => {
        B.on(u, 'damaged', ev => {
          if (ev.amount > u.max.hp * .06) {
            // A full enemy squad can otherwise feed this stack on every
            // simultaneous hit and make Twisted Bobette effectively
            // unbreakable. Keep the player version at its authored cap, but
            // give the enemy version a shorter defensive ramp.
            const packed = u.getStatus('packed');
            if (!u.twisted || !packed || packed.stacks < 3)
              B.applyStatus(u, u, 'packed', 14, { stacks: 1 });
            const p = u.getStatus('packed');
            if (p && p.stacks >= 5) B.fxFloatIcon(u.x, u.y - 100, '📦');
          }
        });
      },
      cast: (u, B, S, P) => {
        // Keep the enemy version's signature defensive package, but shorten
        // its lockout so elite encounters cannot stall behind one long box.
        const wrapDur = u.twisted ? Math.min(P.wrap, 2.15) : P.wrap;
        Sound.play('bobette_wrap', { vol: .58 }); B.anim(u, 'cast', .72, 'bobetteWrap'); B.fxBobetteSkill('wrap', u, { dur: wrapDur });
        const packed = u.getStatus('packed');
        const boost = packed && packed.stacks >= 5 ? P.boost : 1;
        B.applyStatus(u, u, 'petrify', wrapDur);
        B.applyStatus(u, u, 'ccimmune', wrapDur);
        B.applyStatus(u, u, 'ward', wrapDur);
        B.fxRing(u.x, u.y - 30, 130, '#e8536b', .5);
        // Box pulse: ring beats every 0.55s while inside to sell the "trapped" phase
        let pulseT = 0;
        const boxPulse = () => {
          if (!u.alive || !u.hasStatus('petrify')) return;
          pulseT += .55;
          if (pulseT < wrapDur - .1) {
            B.fxRing(u.x, u.y - 30, 90 + pulseT * 14, '#e8536b', .25);
            B.after(.55, boxPulse);
          }
        };
        B.after(.55, boxPulse);
        B.after(wrapDur, () => {
          if (!u.alive) return;
          B.removeStatus(u, 'petrify'); B.removeStatus(u, 'packed');
          B.anim(u, 'cast', .56, 'bobetteUnwrap'); Sound.play('bobette_present_pop', { vol: .66 }); B.fxBobetteSkill('open', u);
          B.flash('#e8536b', .30, .25);
          B.shake(18, .5);
          B.fxConfetti(u.x, u.y - 50, 70);
          B.fxRing(u.x, u.y - 30, 350, '#e8536b', .45);
          B.heal(u, u, u.max.hp * S.heal, { tag: 'Precious Packaging' });
          B.alliesOf(u).forEach(a => { if (B.distance(a, u) < 320) B.shield(u, a, u.max.hp * S.shield * boost, 9); });
          B.enemiesOf(u).forEach(e => {
            if (B.distance(e, u) > 300) return;
            const alreadyWrapped = e.hasStatus('wrapped');
            B.knockback(u, e, P.kb); B.applyStatus(u, e, 'slow', P.slow, { stacks: 2 });
            if (alreadyWrapped) B.applyStatus(u, e, 'root', P.root);
          });
        });
      }
    },
    G: {
      name: 'Holiday Spirit', type: 'Healing / Buff', cd: 11,
      v: { shield: .10, perAlly: .12 }, p: { dur: 9, shieldDur: 6 },
      desc: (S, P) => `The team gains 🎄 Festive Cheer for ${P.dur}s: Move Speed, Energy Generation and Healing Received all rise. Any ally who fires their ultimate while cheered gains a <em>${pcn(S.shield * 100)}</em> Max HP Shield (+<em>${pcn(S.perAlly * 100)}</em> per nearby ally) for ${P.shieldDur}s. The effect grows with each nearby ally.`,
      ai: { prio: 56, cond: () => true },
      cast: (u, B, S, P) => {
        B.anim(u, 'cast', .64, 'bobetteCheer'); Sound.play('cheer'); B.fxBobetteSkill('cheer', u);
        const near = B.alliesOf(u).filter(a => B.distance(a, u) < 340).length;
        const scale = 1 + near * S.perAlly;
        B.fxRing(u.x, u.y - 30, 340, '#e8536b', .5);
        B.alliesOf(u).forEach(a => {
          B.applyStatus(u, a, 'festivecheer', P.dur);
          B.fxSparkle(a.x, a.y - 40, 8, '#e8536b');
          B.fxFloatIcon(a.x, a.y - 100, '🎄');
        });
        u._cheerUntil = B.t + P.dur;
        B.on(u, 'allyUltimate', a => {
          if (B.t < (u._cheerUntil || 0) && a.hasStatus('festivecheer'))
            B.shield(u, a, u.max.hp * S.shield * scale, P.shieldDur);
        });
      }
    },
    B: {
      name: 'Wrapped Surprise', type: 'Physical Damage', cd: 13,
      v: { ratio: .80 }, p: { dur: 7, root: 2.5 },
      desc: (S, P) => `Decorated presents fly out for <em>${pcn(S.ratio * 100)}</em> Attack, applying 🎀 Wrapped for ${P.dur}s: slower attacks, slower cooldowns, less Energy. A Wrapped enemy hit again is ⛓ Rooted for ${P.root}s as the wrapping tightens.`,
      ai: { prio: 50, cond: () => true },
      cast: (u, B, S, P) => {
        B.anim(u, 'wind', .76, 'bobetteToss'); Sound.play('beam_charge', { vol: .18, throttle: 260 }); B.fxBobetteSkill('toss', u);
        B.after(.22, () => {
          if (!u.alive) return;
          B.anim(u, 'attack', .22, 'bobetteTossRelease'); Sound.play('bobette_gift_toss', { vol: .62 });
          B.enemiesOf(u).forEach((e, i) => B.after(i * .09, () => {
            if (!e.alive) return;
            B.fxArc(u, e, { kind: 'food', img: 'christmaspresent', size: 34, spin: 18 }, () => {
              Sound.play('bobette_present_pop', { vol: .42 });
              B.fxFloatIcon(e.x, e.y - 90, '🎁');
              if (e.hasStatus('wrapped')) { B.applyStatus(u, e, 'root', P.root); B.fxFloatIcon(e.x, e.y - 90, '⛓'); }
              B.damage(u, e, u.st.atk * S.ratio, { type: 'physical', tag: 'Wrapped Surprise' });
              B.applyStatus(u, e, 'wrapped', P.dur);
            });
          }));
        });
      }
    },
    P: {
      name: 'Ornament Protection', type: 'Max HP / Defense',
      v: { shield: .05 }, p: { max: 8, dur: 6 },
      desc: (S, P) => `Whenever a nearby ally loses HP, Bobette gains 🔔 Festive Guard (max ${P.max}), raising Defense, Magic Defense and Shield Strength. At max stacks she shares it with nearby allies, and any Shield she receives also shields everyone carrying Festive Guard for <em>${pcn(S.shield * 100)}</em> of Bobette's Max HP for ${P.dur}s.`,
      passive: (u, B, S, P) => {
        B.on(u, 'allyDamaged', ev => {
          if (ev.unit === u || !u.alive) return;
          if (B.distance(ev.unit, u) > 320) return;
          const guard = u.getStatus('festiveguard');
          const guardMax = u.twisted ? 3 : P.max;
          if (!u.twisted || !guard || guard.stacks < guardMax)
            B.applyStatus(u, u, 'festiveguard', 999, { stacks: 1 });
          const g = u.getStatus('festiveguard');
          // Player Bobette shares the finished guard. Enemy Bobette should
          // not turn every nearby Twisted into another defensive wall.
          if (!u.twisted && g && g.stacks >= P.max) B.alliesOf(u).forEach(a => {
            if (a !== u && B.distance(a, u) < 320) B.applyStatus(u, a, 'festiveguard', 8, { stacks: 2 });
          });
        });
        B.on(u, 'statusApplied', ev => {
          if (ev.id !== 'shield' || ev.unit !== u) return;
          B.alliesOf(u).forEach(a => { if (a !== u && a.hasStatus('festiveguard')) B.shield(u, a, u.max.hp * S.shield, P.dur); });
        });
      }
    },
    R: {
      name: 'The Perfect Present', type: 'Battle Opener',
      v: { revive: .30, def: .35, shieldPow: .40, healPow: .35 }, p: { wardDur: 5 },
      desc: (S, P) => `Before battle the ally with the lowest Max HP receives 🎁 Holiday Favor: more Max HP, Damage Reduction and Healing Received. If they would be defeated the present opens instead and they survive at <em>${pcn(S.revive * 100)}</em> HP with ${P.wardDur}s protection. Afterwards Bobette gains <em>${pcn(S.def * 100)}</em> Defense, <em>${pcn(S.shieldPow * 100)}</em> Shield Strength and <em>${pcn(S.healPow * 100)}</em> Healing Power, but her own damage drops by a third.`,
      passive: (u, B, S, P) => {
        B.on(u, 'waveStart', () => { u._opened = false; });
        B.after(.4, () => {
          const t = B.alliesOf(u).filter(a => a !== u).sort((a, b) => a.max.hp - b.max.hp)[0] || u;
          u._favored = t;
          B.applyStatus(u, t, 'holidayfavor', 999);
          B.fxFloatIcon(t.x, t.y - 100, '🎁'); Sound.play('bobette_wrap', { vol: .42 }); B.fxBobetteSkill('favor', t);
        });
        B.on(u, 'allyLethal', ev => {
          if (u._opened || ev.unit !== u._favored) return;
          u._opened = true; ev.prevented = true;
          ev.unit.hp = ev.unit.max.hp * (u.twisted ? Math.min(S.revive, .22) : S.revive);
          B.applyStatus(u, ev.unit, 'ward', P.wardDur); B.applyStatus(u, ev.unit, 'ccimmune', P.wardDur);
          Sound.play('bobette_present_pop', { vol: .7 }); B.fxBobetteSkill('open', ev.unit); B.fxConfetti(ev.unit.x, ev.unit.y - 50, 50);
          B.log('<b>The Perfect Present opens.</b>');
          u.flat.defP2 = S.def; u.flat.shieldPowP = S.shieldPow; u.flat.healPowP = S.healPow; u.flat.dmgDealt = -.33;
          u.dirty = true;
        });
      }
    }
  }
});

/* ============================================================ BOXTEN
   DPS / Rhythm Fighter - D Tier
   Consistency becomes power: Tempo must be maintained or it decays. */
defHero({
  id: 'Boxten', name: 'Boxten', folder: 'Boxten', file: 'Boxten', icon: 'Boxten',
  role: 'Damage', tier: 'B', element: 'Music',
  blurb: 'A quiet music box keeping a rhythm going. Once the beat is established, every note lands with purpose.',
  base: { hp: 3650, atk: 395, def: 230, mag: 185, mdef: 215, spd: 116, acc: 195, eva: 125 },
  hidden: { range: 195, aspd: 1.15, ms: 72, aggro: .65, crit: .16, critDmg: 1.65, healPow: 1, shieldPow: 1, cdr: .08, ccRes: .15, kbRes: .35, armorPen: .12, magPen: 0 },
  growth: { hp: .086, atk: .098, def: .078, mag: .064, mdef: .074 },
  move: { gait: 'hop', bob: 10, freq: 2.0, lean: 5, squash: .09, idle: 'wind', step: 'bounce',
    particles: 'notes', pcol: '#ffd166', trail: { on: false }, brake: .25 },
  basic: { name: 'Wind-Up Jab', type: 'physical', ratio: .98, range: 195, sfx: 'swing_light', hit: 'hit_blunt',
    wind: .14, note: 'Struck exactly on the beat, every time.',
    onHit: (u, t, B) => { B.applyStatus(u, u, 'tempo', 6, { stacks: 1 }); u._lastBeat = B.t; } },
  skills: {
    W: {
      name: 'Wind-Up Strike', type: 'Physical Damage', energy: 100,
      v: { ratio: 1.82, perTempo: .12, echo: .58 }, p: { decay: 3.5 },
      desc: (S, P) => `<span class="sk-pas">Attacking builds 🎵 Tempo, each stack adding Attack Speed. Stop attacking for ${P.decay}s and Tempo starts falling away.</span>
        Active: Boxten winds his key and unleashes a spinning strike on the nearest enemy for <em>${pcn(S.ratio * 100)}</em> Attack, plus <em>${pcn(S.perTempo * 100)}</em> for every Tempo stack he holds. At maximum Tempo, the strike sends a sound-wave echo into another enemy for <em>${pcn(S.echo * 100)}</em> Attack.`,
      passive: (u, B) => {
        u._lastBeat = 0;
        u._rhythmListener = false;
        B.every(u, 1, () => {
          if (B.t - (u._lastBeat || 0) > u.def.skills.W.p.decay) {
            const t = u.getStatus('tempo');
            if (t) { t.stacks--; u.dirty = true; if (t.stacks <= 0) B.removeStatus(u, 'tempo'); }
          }
        });
      },
      cast: (u, B, S) => {
        const t = B.nearest(u, B.enemiesOf(u)); if (!t) return;
        const tempo = (u.getStatus('tempo') || {}).stacks || 0;
        B.anim(u, 'wind', .45); Sound.play('spin');
        B.after(.38, () => {
          Sound.play('hit_heavy'); B.hitstop(110); B.shake(13, .4);
          B.fxSlash(u, t, { col: '#ffd166', ang: -40, big: true });
          B.fxNotes(t.x, t.y - 60, 10);
          B.damage(u, t, u.st.atk * (S.ratio + S.perTempo * tempo), { type: 'physical', tag: 'Wind-Up Strike' });
          if (tempo >= 10 || u.boxtenMaxTempo) {
            const echo = B.nearest(u, B.enemiesOf(u).filter(enemy => enemy !== t));
            if (echo) {
              B.damage(u, echo, u.st.atk * S.echo, { type: 'physical', tag: 'Wind-Up Echo' });
              B.fxNotes(echo.x, echo.y - 60, 6);
            }
          }
          u._lastBeat = B.t;
        });
      }
    },
    G: {
      name: 'Music Box Melody', type: 'Physical Damage', cd: 9,
      v: { ratio: 1.15, bonus: .45 }, p: { dur: 5.5, radius: 320, en: 18 },
      desc: (S, P) => `Sound waves ripple out for <em>${pcn(S.ratio * 100)}</em> Attack, cutting enemy Attack Speed for ${P.dur}s and interrupting their casts. Enemies already slowed or crowd controlled take <em>+${pcn(S.bonus * 100)}</em> bonus damage, and hitting two or more enemies grants Boxten 2 bonus 🎵 Tempo stacks and ${P.en} Energy.`,
      ai: { prio: 55, cond: (u, B) => B.enemiesOf(u).some(e => B.distance(e, u) < 320) },
      cast: (u, B, S, P) => {
        B.anim(u, 'cast', .35); Sound.play('whoosh');
        B.fxRing(u.x, u.y - 40, P.radius * 2, '#ffd166', .5);
        let hit = 0;
        B.enemiesOf(u).forEach(e => {
          if (B.distance(e, u) > P.radius) return;
          hit++;
          const cc = e.hasStatus('slow') || e.hasStatus('stun') || e.hasStatus('freeze') || e.hasStatus('sleep') || e.hasStatus('root');
          const dmg = u.st.atk * S.ratio * (cc ? (1 + S.bonus) : 1);
          B.damage(u, e, dmg, { type: 'physical', tag: 'Music Box Melody' });
          B.applyStatus(u, e, 'slow', P.dur);
          if (cc) B.fxFloatIcon(e.x, e.y - 95, '🎵 CRIT', '#ffd166');
        });
        if (hit >= 2) {
          B.applyStatus(u, u, 'tempo', 8, { stacks: 2 });
          B.energy(u, P.en);
        }
        u._lastBeat = B.t;
      }
    },
    B: {
      name: 'Perfect Rhythm', type: 'Self Buff', cd: 15,
      v: { ratio: .42 }, p: { dur: 8 },
      desc: (S, P) => `Boxten locks into the beat for ${P.dur}s, gaining Attack Speed and Crit Chance. Every second attack while active releases a sound wave for <em>${pcn(S.ratio * 100)}</em> Attack to nearby enemies.`,
      ai: { prio: 52, cond: (u) => !u.hasStatus('speedup') },
      cast: (u, B, S, P) => {
        B.anim(u, 'cast', .3); Sound.play('buff'); B.fxAura(u, '#ffd166', P.dur);
        B.applyStatus(u, u, 'speedup', P.dur, { stacks: 2 });
        B.applyStatus(u, u, 'lucky', P.dur);
        u._rhythmUntil = B.t + P.dur; u._beatCount = 0;
        if (!u._rhythmListener) {
          u._rhythmListener = true;
          B.on(u, 'basicHit', () => {
            if (B.t > (u._rhythmUntil || 0)) return;
            if (++u._beatCount % 2) return;
            Sound.play('hit_magic', { vol: .5 }); B.fxRing(u.x, u.y - 40, 260, '#ffd166', .3);
            B.aoe(u, u.x, 240, u.team, u.st.atk * S.ratio, { type: 'physical', tag: 'Perfect Rhythm' });
          });
        }
      }
    },
    P: {
      name: 'Always Wound Up', type: 'Max HP / Attack',
      v: { per: .075, leech: .18 }, p: { en: 12 },
      desc: (S, P) => `Boxten's gears wind tighter with team momentum. For each living ally, he gains <em>${pcn(S.per * 100)}</em> Attack Speed, Skill Haste, and Energy Generation. Whenever an ally uses a Skill, Boxten gains 1 🎵 Tempo and ${P.en} Energy. At maximum (10) Tempo, Boxten heals for <em>${pcn(S.leech * 100)}</em> of all damage dealt.`,
      passive: (u, B, S, P) => {
        B.every(u, .5, () => {
          const n = B.alliesOf(u).filter(a => a !== u).length;
          u.flat.aspdP = n * S.per; u.flat.cdr = n * S.per; u.flat.energyGen = n * S.per;
          u.dirty = true;
        });
        B.on(u, 'allyCast', () => {
          B.applyStatus(u, u, 'tempo', 8, { stacks: 1 });
          B.energy(u, P.en);
        });
        B.on(u, 'dealDamage', ev => {
          const t = u.getStatus('tempo');
          if (t && t.stacks >= 10 && !ev.dot && ev.amount > 0) {
            B.heal(u, u, ev.amount * S.leech, { silent: true, tag: 'Wound Up Leech' });
          }
        });
      }
    },
    R: {
      name: 'Final Performance', type: 'Battle Opener',
      v: { pen: .25 }, p: { max: 10 },
      desc: (S, P) => `Boxten starts battle fully wound at ${P.max} 🎵 Tempo. At maximum Tempo his attacks strike an extra enemy, his cooldowns shorten, and his sound attacks ignore <em>${pcn(S.pen * 100)}</em> Defense. If Tempo ever empties he becomes 🔧 Unwound until he rebuilds it.`,
      passive: (u, B, S, P) => {
        B.after(.2, () => B.applyStatus(u, u, 'tempo', 999, { stacks: P.max }));
        B.every(u, .5, () => {
          const t = u.getStatus('tempo');
          const full = t && t.stacks >= P.max;
          u.pierce = !!full;
          u.flat.cdr2 = full ? .25 : 0;
          u.flat.armorPen4 = full ? S.pen : 0;
          u.boxtenMaxTempo = !!full;
          if (!t && !u.hasStatus('unwound')) B.applyStatus(u, u, 'unwound', 5);
          if (t && u.hasStatus('unwound')) B.removeStatus(u, 'unwound');
          u.dirty = true;
        });
      }
    }
  }
});

/* ============================================================ BRIGHTNEY
   Utility Tank / Crowd Control - B Tier */
defHero({
  id: 'Brightney', name: 'Brightney', folder: 'Brightney', file: 'Brightney', icon: 'Brightney',
  role: 'Tank', tier: 'B', element: 'Light',
  blurb: 'A desk lamp who keeps the dark honest. She tanks by making sure nothing can aim properly.',
  base: { hp: 5100, atk: 220, def: 318, mag: 290, mdef: 300, spd: 98, acc: 190, eva: 96 },
  hidden: { range: 215, aspd: .86, ms: 62, aggro: 1.8, crit: .07, critDmg: 1.5, healPow: 1, shieldPow: 1.35, cdr: .06, ccRes: .28, kbRes: .6, armorPen: 0, magPen: .15 },
  growth: { hp: .104, atk: .07, def: .096, mag: .084, mdef: .092 },
  move: { gait: 'glide', bob: 6, freq: 1.4, lean: 5, squash: .04, idle: 'flicker', step: 'step_metal',
    particles: 'glow', pcol: '#fff3b0', trail: { on: true, col: '#fff3b0', rate: .12 }, brake: .3, glow: '#fff3b0' },
  basic: { name: 'Bulb Bash', type: 'physical', ratio: 1.05, range: 215, sfx: 'swing_pole', hit: 'hit_blunt',
    wind: .20, attackAnim: .36, animStyle: 'brightneyBash', note: 'She swings the whole lampshade.',
    onHit: (u, t, B) => { B.fxBrightneySkill('bash', u, { target: t }); if (chance(.25)) B.applyStatus(u, t, 'blind', 3); } },
  skills: {
    W: {
      name: 'Blinding Flash', type: 'Magic Damage', energy: 100,
      v: { ratio: 1.30 }, p: { taunt: 3, blind: 4, acc: .40 },
      desc: (S, P) => `<span class="sk-pas">Brightney's glow keeps everything visible: enemies cannot become 🫥 Hidden while she lives, and her allies gain Accuracy.</span>
        Active: she overcharges her bulb for <em>${pcn(S.ratio * 100)}</em> Magic to all nearby enemies, 🎭 Taunting them for ${P.taunt}s, stripping <em>${pc(P.acc)}</em> Accuracy, and reducing Evasion for ${P.blind}s.`,
      passive: (u, B) => {
        B.teamAura(u, m => { m.accP += .12; });
        B.every(u, 1, () => B.enemiesOf(u).forEach(e => B.removeStatus(e, 'stealth')));
      },
      cast: (u, B, S, P) => {
        B.anim(u, 'cast', .72, 'brightneyFlash');
        Sound.play('beam_charge', { vol: .3 });
        B.fxBrightneySkill('flash', u, { phase: 'charge' });
        B.after(.44, () => {
          B.flash('#fffbe0', .65, .42); B.shake(7, .28); Sound.play('flash', { vol: .42 });
          const foes = B.enemiesOf(u).filter(e => B.distance(e, u) <= 380);
          B.fxBrightneySkill('flash', u, { phase: 'burst', targets: foes });
          foes.forEach(e => {
            if (B.distance(e, u) > 380) return;
            B.damage(u, e, u.st.mag * S.ratio, { type: 'magic', tag: 'Blinding Flash' });
            B.applyStatus(u, e, 'taunt', P.taunt);
            B.applyStatus(u, e, 'blind', P.blind);
            B.applyStatus(u, e, 'evadown', P.blind);
          });
          if (u.rarity >= 5) {
            B.cleanseAll(u);
            const shieldRatio = (u.skills && u.skills.R && u.skills.R.v && u.skills.R.v.shield) || 0.15;
            const energyAmt = (u.skills && u.skills.R && u.skills.R.v && u.skills.R.v.en) || 25;
            const dur = (u.skills && u.skills.R && u.skills.R.p && u.skills.R.p.dur) || 4.5;
            B.alliesOf(u).forEach(a => {
              B.shield(u, a, u.max.hp * shieldRatio, dur);
              B.energy(a, energyAmt);
              B.applyStatus(u, a, 'overcharge', dur);
              B.applyStatus(u, a, 'speedup', dur);
            });
            B.fxBrightneySkill('overcharge', u, { allies: B.alliesOf(u) });
          }
        });
      }
    },
    G: {
      name: 'Lampshade Guard', type: 'Shield', cd: 10,
      v: { shield: .20 }, p: { dur: 6, aspd: 3 },
      desc: (S, P) => `She angles her shade into the attacks, gaining a Shield worth <em>${pcn(S.shield * 100)}</em> of her Max HP for ${P.dur}s. While it holds, anything that basic-attacks her loses Attack Speed for ${P.aspd}s.`,
      ai: { prio: 58, cond: (u) => !u.hasStatus('shield') },
      cast: (u, B, S, P) => {
        B.anim(u, 'cast', .58, 'brightneyGuard'); Sound.play('guard', { vol: .42 });
        B.fxBrightneySkill('guard', u, { phase: 'cast', dur: P.dur });
        B.shield(u, u, u.max.hp * S.shield, P.dur);
        u._guardUntil = B.t + P.dur;
        B.on(u, 'damaged', ev => {
          if (B.t > (u._guardUntil || 0) || !ev.src || ev.dot) return;
          B.applyStatus(u, ev.src, 'slow', P.aspd);
          B.fxBrightneySkill('guardHit', u, { target: ev.src });
        });
      }
    },
    B: {
      name: 'Focused Beam', type: 'Magic Damage', cd: 13,
      v: { ratio: 1.20 }, p: { dur: 5 },
      desc: (S, P) => `A harsh beam pins the highest-damage enemy for <em>${pcn(S.ratio * 100)}</em> Magic, tearing down their Defense and Magic Defense for ${P.dur}s.`,
      ai: { prio: 52, cond: () => true },
      cast: (u, B, S, P) => {
        const foes = B.enemiesOf(u); if (!foes.length) return;
        const t = foes.reduce((a, b) => b.st.atk + b.st.mag > a.st.atk + a.st.mag ? b : a);
        B.anim(u, 'cast', .68, 'brightneyBeam');
        Sound.play('beam_charge', { vol: .3 });
        B.fxBrightneySkill('beam', u, { phase: 'charge', target: t });
        B.after(.28, () => {
          Sound.play('beam_fire', { vol: .34 }); B.hitstop(70); B.shake(6, .26);
          B.fxBrightneySkill('beam', u, { phase: 'fire', target: t });
          B.fxProj(u, t, { kind: 'beam', col: '#fff3b0' }, () => {
            B.damage(u, t, u.st.mag * S.ratio, { type: 'magic', tag: 'Focused Beam' });
            B.applyStatus(u, t, 'defdown', P.dur, { stacks: 2 });
            B.applyStatus(u, t, 'magdown', P.dur, { stacks: 2 });
            B.fxBrightneySkill('beam', u, { phase: 'impact', target: t });
          });
        });
      }
    },
    P: {
      name: 'Safety Light', type: 'Aura',
      v: { dr: .18, regen: .018, tenacity: .25 }, p: { radius: 320 },
      desc: (S, P) => `Allies within Brightney's light take <em>${pcn(S.dr * 100)}</em> less damage, regenerate <em>${pcn(S.regen * 100)}</em> Max HP per second, and gain <em>${pcn(S.tenacity * 100)}</em> Crowd Control Resistance.`,
      passive: (u, B, S, P) => {
        B.every(u, 1, () => B.alliesOf(u).forEach(a => {
          if (B.distance(a, u) > P.radius) { a.flat.dmgTaken2 = 0; a.flat.ccRes2 = 0; a.dirty = true; return; }
          B.heal(u, a, a.max.hp * S.regen, { silent: true, tag: 'safety light' });
          a.flat.dmgTaken2 = -S.dr; a.flat.ccRes2 = S.tenacity; a.dirty = true;
        }));
      }
    },
    R: {
      name: 'Overcharged Bulb', type: 'Ultimate Upgrade',
      v: { shield: .15, en: 25 }, p: { dur: 4.5 },
      desc: (S, P) => `Blinding Flash cleanses every debuff from Brightney and empowers the entire team with an Overcharged Shield worth <em>${pcn(S.shield * 100)}</em> of her Max HP, ${Math.round(S.en)} Energy, Overcharge, and Speed Up for ${P.dur}s.`,
      passive: () => {}
    }
  }
});

/* ============================================================ COAL
   Tank / Protector - B Tier
   A pet rock who gets harder to move the longer the fight runs. */
defHero({
  id: 'Coal', name: 'Coal', folder: 'Coal', file: 'Coal', icon: 'Coal',
  role: 'Tank', tier: 'B', element: 'Stone',
  blurb: 'A small pet rock who decided one teammate is hers to protect, and will not be reasoned with about it.',
  base: { hp: 6100, atk: 275, def: 375, mag: 158, mdef: 300, spd: 86, acc: 160, eva: 74 },
  hidden: { range: 175, aspd: .82, ms: 56, aggro: 2.45, crit: .05, critDmg: 1.5, healPow: 1, shieldPow: 1.48, cdr: .04, ccRes: .46, kbRes: .88, armorPen: .05, magPen: 0 },
  growth: { hp: .116, atk: .072, def: .104, mag: .058, mdef: .088 },
  // Coal has legs; only her Rolling Pebble skill should make her roll. The
  // normal movement gait keeps her grounded and readable as a heavy walker.
  move: { gait: 'trudge', bob: 3, freq: 1.1, lean: 4, squash: .04, idle: 'settle', step: 'step_heavy',
    particles: 'dust', pcol: '#9a8a7a', trail: { on: false }, brake: .8, weight: 1.6, shakeStep: 2.2 },
  basic: { name: 'Bonk', type: 'physical', ratio: 1.16, range: 175, sfx: 'swing_heavy', hit: 'hit_blunt', animStyle: 'coalBonk',
    wind: .26, shake: 4, note: 'She is a rock. It does what rocks do.',
    onHit: (u, t, B) => { B.knockback(u, t, 16); } },
  skills: {
    W: {
      name: 'Rolling Pebble', type: 'Physical Damage', energy: 100,
      v: { ratio: 1.48, perSturdy: .11 }, p: { slow: 6 },
      desc: (S, P) => `<span class="sk-pas">Every hit Coal takes grants 🪨 Sturdy, raising her Defense.</span>
        Active: she rolls at the highest-Attack enemy for <em>${pcn(S.ratio * 100)}</em> Attack plus <em>${pcn(S.perSturdy * 100)}</em> per Sturdy stack, interrupting their action and cutting their Attack Speed for ${P.slow}s.`,
      passive: (u, B) => {
        B.on(u, 'damaged', ev => { if (!ev.dot) B.applyStatus(u, u, 'sturdy', 12, { stacks: 1 }); });
      },
      cast: (u, B, S, P) => {
        const t = B.highestStat(B.enemiesOf(u), 'atk'); if (!t) return;
        const st = (u.getStatus('sturdy') || {}).stacks || 0;
        B.anim(u, 'spin', .62, 'coalRoll'); Sound.play('spin', { vol: .72 });
        B.dash(u, t.x - u.face * 60, .3, { spin: true, depth: t.depth });
        B.after(.34, () => {
          Sound.play('quake'); Sound.play('hit_heavy', { delay: 30 });
          B.hitstop(120); B.shake(16, .45); B.fxCrack(t.x, t.y, 1.2);
          B.interrupt(t);
          B.damage(u, t, u.st.atk * (S.ratio + S.perSturdy * st), { type: 'physical', tag: 'Rolling Pebble' });
          B.applyStatus(u, t, 'slow', P.slow, { stacks: 2 });
        });
      }
    },
    G: {
      name: 'Cozy Companion', type: 'Shield', cd: 9,
      v: { shield: .22 }, p: { dur: 9, share: .34 },
      desc: (S, P) => `Coal presses up against her weakest ally, shielding them for <em>${pcn(S.shield * 100)}</em> of her Max HP. While it holds they take less damage, <em>${pc(P.share)}</em> of what they take is passed to Coal, and both gain CC Resistance.`,
      ai: { prio: 58, cond: (u, B) => B.alliesOf(u).some(a => a.hpPct < .9) },
      cast: (u, B, S, P) => {
        const t = B.lowestHp(B.alliesOf(u).filter(a => a !== u)) || u;
        B.anim(u, 'cast', .58, 'coalGuard'); Sound.play('guard');
        B.shield(u, t, u.max.hp * S.shield, P.dur, { redirect: { to: u, pct: P.share } });
        B.applyStatus(u, t, 'ward', P.dur);
        [t, u].forEach(a => B.applyStatus(u, a, 'fortify', P.dur, { stacks: 2 }));
        B.fxHeartLink(u, t);
      }
    },
    B: {
      name: 'Rock Toss', type: 'Physical Damage / Anti-Buff', cd: 11,
      v: { ratio: 1.24, splash: .66 }, p: { kb: 170, slow: 6, splashSlow: 3, radius: 155, seal: 6 },
      desc: (S, P) => `Coal launches herself at the farthest enemy, smashing them and nearby enemies in a <em>${P.radius}</em>-radius impact for <em>${pcn(S.ratio * 100)}</em> Attack to the target and <em>${pcn(S.splash * 100)}</em> to nearby enemies. All hit enemies lose up to three buffs, become 🚫 Buff Sealed for ${P.seal}s, and have their next hostile buff denied. The main target is knocked back and slowed; already slowed targets become 📍 Pinned.`,
      ai: { prio: 58, cond: (u, B) => B.enemiesOf(u).length > 0 },
      cast: (u, B, S, P) => {
        const t = B.farthestN(u, B.enemiesOf(u), 1)[0]; if (!t) return;
        B.anim(u, 'wind', .68, 'coalToss'); Sound.play('jump');
        B.leap(u, t.x - u.face * 60, .38, () => {
          const hits = B.enemiesOf(u).filter(e => B.distance(e, t) <= P.radius);
          Sound.play('hit_heavy'); B.hitstop(90); B.shake(14, .4); B.fxCrack(t.x, t.y, 1); B.fxRing(t.x, t.y - 40, P.radius, '#9a8a7a', .45);
          hits.forEach(e => {
            const primary = e === t;
            B.interrupt(e);
            B.damage(u, e, u.st.atk * (primary ? S.ratio : S.splash), { type: 'physical', area: true, tag: 'Rock Toss' });
            B.dispel(e, 3);
            B.applyStatus(u, e, 'buffsealed', P.seal, { stacks: primary ? 2 : 1 });
            if (primary) {
              if (e.hasStatus('slow')) B.applyStatus(u, e, 'pinned', P.slow);
              else B.applyStatus(u, e, 'slow', P.slow, { stacks: 2 });
              B.knockback(u, e, P.kb);
            } else {
              B.applyStatus(u, e, 'slow', P.splashSlow);
            }
          });
        }, t.depth);
      }
    },
    P: {
      name: 'Heavy Heart', type: 'Max HP',
      v: {}, p: { max: 8 },
      desc: (S, P) => `Losing HP grants ⚓ Weight (max ${P.max}): more Max HP, more Damage Reduction, stronger taunts. At maximum stacks Coal becomes Anchored, immune to knockback and slows, and redirects a share of nearby ally damage onto herself.`,
      passive: (u, B, S, P) => {
        B.on(u, 'damaged', () => B.applyStatus(u, u, 'weight', 999, { stacks: 1 }));
        B.every(u, .5, () => {
          const w = u.getStatus('weight');
          const anchored = w && w.stacks >= P.max;
          u.immovable = !!anchored;
          u.flat.aggro = anchored ? 1.2 : .5;
          if (anchored) B.removeStatus(u, 'slow');
          u.dirty = true;
        });
        B.on(u, 'allyDamaged', ev => {
          const w = u.getStatus('weight');
          if (!w || w.stacks < P.max || ev.unit === u || !u.alive) return;
          if (B.distance(ev.unit, u) > 300) return;
          const moved = ev.amount * .25; ev.amount -= moved;
          B.damage(ev.src, u, moved, { type: 'true', redirected: true, tag: 'anchor' });
        });
      }
    },
    R: {
      name: 'The Best Present', type: 'Battle Opener',
      v: { loyalty: .045, revive: .40 }, p: { dur: 8 },
      desc: (S, P) => `Coal picks one ally to protect, granting them Max HP, Defense and Damage Reduction. Every time they are hurt Coal gains Loyalty, worth <em>${pcn(S.loyalty * 100)}</em> Defense, Attack and Shield Strength each. If they would fall, Coal takes their place and survives at <em>${pc(S.revive)}</em> HP: for ${P.dur}s she grows, her attacks reach further, and she cannot be crowd controlled.`,
      passive: (u, B, S, P) => {
        B.after(.4, () => {
          const t = B.alliesOf(u).filter(a => a !== u)[0];
          if (!t) return;
          u._ward = t;
          B.anim(u, 'cast', .72, 'coalProtect'); Sound.play('guard', { vol: .42 });
          B.applyStatus(u, t, 'fortify', 999, { stacks: 3 });
          B.applyStatus(u, t, 'holidayfavor', 999);
          B.fxHeartLink(u, t); Sound.play('get_item');
        });
        B.on(u, 'allyDamaged', ev => {
          if (ev.unit !== u._ward) return;
          u.loyalty = (u.loyalty || 0) + 1;
          u.flat.defP2 = u.loyalty * S.loyalty;
          u.flat.atkP = u.loyalty * S.loyalty;
          u.flat.shieldPowP = u.loyalty * S.loyalty;
          u.dirty = true;
        });
        B.on(u, 'allyLethal', ev => {
          if (u._took || ev.unit !== u._ward || !u.alive) return;
          u._took = true; ev.prevented = true;
          ev.unit.hp = Math.max(ev.unit.hp, ev.unit.max.hp * .25);
          u.hp = Math.max(1, u.hp * S.revive);
          B.anim(u, 'cast', .9, 'coalRescue');
          Sound.play('quake'); B.shake(20, .6); B.fxCrack(u.x, u.y, 2);
          B.log('<b>Coal takes the hit.</b>');
          B.applyStatus(u, u, 'ccimmune', P.dur);
          B.applyStatus(u, u, 'atkup', P.dur, { stacks: 2 });
          u.rangeBonus = 120;
          B.after(P.dur, () => { u.rangeBonus = 0; });
        });
      }
    }
  }
});

/* ============================================================ CONNIE
   Evasive Spectral Support / Phantom Trickster - DHBM Standards */
defHero({
  id: 'Connie', name: 'Connie', folder: 'Connie', file: 'Connie', icon: 'Connie',
  role: 'Support', tier: 'SS', element: 'Spirit',
  blurb: 'A playful and mischievous ghost Toon whose elusive phase-shifting, spectral decoys, and poltergeist pranks make her impossible to hit while turning enemy aggression into massive team acceleration.',
  base: { hp: 3680, atk: 210, def: 195, mag: 388, mdef: 315, spd: 132, acc: 215, eva: 260 },
  hidden: { range: 285, aspd: 1.05, ms: 92, aggro: .55, crit: .14, critDmg: 1.65, healPow: 1.20, shieldPow: 1.25, cdr: .16, ccRes: .25, kbRes: .45, armorPen: .10, magPen: .22 },
  growth: { hp: .078, atk: .070, def: .068, mag: .102, mdef: .088 },
  move: { gait: 'float', bob: 8, freq: .9, lean: 4, squash: .03, hover: 22, idle: 'drift', step: null,
    particles: 'glow', pcol: '#bfe9ff', trail: { on: true, col: '#bfe9ff', rate: .09 }, brake: .12, sway: 8 },
  basic: {
    name: 'Poltergeist Touch',
    type: 'magic',
    ratio: 1.05,
    range: 285,
    proj: 'orb',
    pcol: '#bfe9ff',
    sfx: 'whoosh',
    hit: 'hit_magic',
    wind: .20,
    note: 'Chills targets with ghostly ectoplasm and siphons energy for the squad.',
    onHit: (u, t, B) => {
      if (!t || !t.alive) return;
      B.applyStatus(u, t, 'haunted', 6.0);
      u._connieBasics = (u._connieBasics || 0) + 1;
      if (u._connieBasics % 2 === 0) {
        B.energy(t, -15);
        const ally = B.lowestEnergy(B.alliesOf(u)) || u;
        if (ally && ally.alive) {
          B.energy(ally, 15);
          B.fxSparkle(ally.x, ally.y - 45, 6, '#bfe9ff');
          B.fxFloatIcon(ally.x, ally.y - 100, '👻 ECTO SIPHON +15⚡', '#bfe9ff');
        }
      }
    }
  },
  skills: {
    // ---------------- WHITE SKILL (Ultimate): Haunting Escape & Séance
    W: {
      name: 'Haunting Escape',
      type: 'Support / Area Control',
      energy: 100,
      cd: 16,
      v: { dmg: 1.80, veilEva: .35 },
      p: { dur: 3.5, fear: 4.0 },
      desc: (S, P) => `<span class="sk-pas">Connie permanently gains +25% Evasion. Whenever Connie or an ally dodges an attack, she unleashes a Poltergeist Backlash dealing Magic Damage to the attacker, siphoning 10 Energy, and cutting Connie's cooldowns by 1.5s. Every 8s (or upon dodging 2 attacks), she spawns a Phantom Decoy with 25% Max HP that taunts nearby foes.</span> Active: Connie slips into the Spirit Realm for ${P.dur}s (completely Untargetable, cleanses all debuffs). While vanished, an Ectoplasmic Veil grants all allies +<em>${pcn(S.veilEva * 100)}</em> Evasion, Ward (-30% damage taken), and regenerates 4% Max HP/sec. Re-emerging in the enemy ranks unleashes a terrifying "BOO!": dealing <em>${pcn(S.dmg * 100)}</em> Magic Damage, Stunning all enemies for 1.8s, and inflicting 😱 Terrified (-30% Accuracy and Attack Speed) for ${P.fear}s.`,
      ai: { cond: (u, B) => u.hpPct < .80 || B.enemiesOf(u).some(e => e.target === u) },
      passive: (u, B, S, P) => {
        u.flat.evaP = (u.flat.evaP || 0) + 0.25;
        u.dirty = true;
        u._connieDodgeCount = 0;
        u._connieDecoyAt = 0;

        const summonDecoy = () => {
          if (!u.alive || B.minionsOf(u).length >= 2) return;
          B.fxConnieSkill('phantom', u, { twisted: u.twisted });
          Sound.play('unsummon', { vol: .4 });
          B.summon(u, {
            name: u.twisted ? 'Twisted Phantom' : 'Phantom Decoy',
            art: Art.unit('Connie', u.twisted),
            hp: u.max.hp * .25,
            scale: .8,
            life: 6,
            taunt: 260,
            tint: u.twisted ? '#df4c9e' : '#bfe9ff',
            offset: rndi(-50, 50),
            noSkills: true
          });
          B.fxFloatIcon(u.x, u.y - 100, '👻 PHANTOM DECOY', '#bfe9ff');
        };

        B.on(u, 'dodged', ev => {
          u._connieDodgeCount = (u._connieDodgeCount || 0) + 1;
          if (ev.src && ev.src.alive && ev.src.team !== u.team) {
            B.damage(u, ev.src, u.st.mag * .65, { type: 'magic', tag: 'Poltergeist Backlash' });
            B.energy(ev.src, -10);
            B.reduceCd(u, 1.5);
            B.fxConnieSkill('dodge', u);
          }
          if (u._connieDodgeCount % 2 === 0) summonDecoy();
        });

        B.on(u, 'allyDodged', ev => {
          if (ev.src && ev.src.alive && ev.src.team !== u.team) {
            B.damage(u, ev.src, u.st.mag * .45, { type: 'magic', tag: 'Poltergeist Backlash' });
            B.reduceCd(u, 1.0);
          }
        });

        B.every(u, 8.0, () => summonDecoy());
      },
      cast: (u, B, S, P) => {
        B.anim(u, 'cast', .72, 'connieEscape');
        Sound.play('unsummon', { vol: .5 });
        B.fxConnieSkill('escape', u, { phase: 'cast', dur: P.dur });

        B.applyStatus(u, u, 'untargetable', P.dur);
        B.cleanseAll(u);

        // Apply Ectoplasmic Veil to team
        B.alliesOf(u).forEach(a => {
          B.applyStatus(u, a, 'ward', P.dur);
          a.flat.evaP_veil = S.veilEva;
          a.dirty = true;
          B.applyStatus(u, a, 'regen', P.dur, { val: a.max.hp * .04 });
          B.fxSparkle(a.x, a.y - 45, 8, '#bfe9ff');
          B.fxFloatIcon(a.x, a.y - 100, '👻 ECTOPLASMIC VEIL', '#bfe9ff');
        });

        B.after(P.dur, () => {
          B.alliesOf(u).forEach(a => {
            a.flat.evaP_veil = 0;
            a.dirty = true;
          });

          if (!u.alive) return;
          B.anim(u, 'cast', .48, 'connieReturn');
          Sound.play('gasp', { vol: .55 });
          Sound.play('fanfare', { vol: .6 });
          B.flash('#bfe9ff', .35, .25);
          B.shake(10, .35);

          // BOO! Jumpscare return
          B.enemiesOf(u).forEach(e => {
            if (!e.alive) return;
            B.damage(u, e, u.st.mag * S.dmg, { type: 'magic', tag: 'Haunting Return' });
            B.applyStatus(u, e, 'stun', 1.8);
            B.applyStatus(u, e, 'slow', P.fear, { stacks: 2 });
            B.applyStatus(u, e, 'dizzy', P.fear);
            B.applyStatus(u, e, 'terrified', P.fear);
            B.fxConnieSkill('fear', u, { target: e, dur: P.fear });
          });
          B.fxFloatIcon(u.x, u.y - 110, '👻 BOO! JUMPSCARE!', '#bfe9ff');
        });
      }
    },

    // ---------------- GREEN SKILL: Phantom Prank
    G: {
      name: 'Phantom Prank',
      type: 'Backline Ambush / Shielding',
      cd: 9.0,
      v: { ratio: 1.65, shield: .22 },
      p: { dur: 8.0, daze: 2.5 },
      desc: (S, P) => `<span class="sk-pas">Enemies afflicted by 👻 Haunted take 30% increased Magic Damage from all allies and have their skill cooldown recovery slowed by 25%.</span> Active: Connie phases behind the highest-Attack or Energy enemy, dealing <em>${pcn(S.ratio * 100)}</em> Magic Damage, stripping 2 buffs, and draining 35 Energy. Leaves an Ectoplasmic Trap that Dazes nearby enemies for ${P.daze}s and marks them Haunted for ${P.dur}s, then blinks back to her squad granting the lowest-HP ally a Spectral Shroud (<em>${pcn(S.shield * 100)}</em> Max HP shield + cleanses 1 debuff).`,
      ai: { prio: 60, cond: () => true },
      passive: (u, B) => {
        B.on(u, 'allyDamageDealt', ev => {
          if (ev.target && ev.target.alive && ev.target.hasStatus('haunted') && ev.type === 'magic') {
            ev.amount *= 1.30;
          }
        });
      },
      cast: (u, B, S, P) => {
        const t = B.highestStat(B.enemiesOf(u), 'atk') || B.highestEnergy(B.enemiesOf(u)) || B.enemiesOf(u)[0];
        if (!t) return;
        const returnX = u.x;
        u.face = t.x >= u.x ? 1 : -1;

        B.anim(u, 'wind', .35, 'conniePrankWindup');
        Sound.play('unsummon', { vol: .4 });
        B.fxConnieSkill('prank', u, { phase: 'cast', target: t });

        B.after(.18, () => {
          if (!u.alive || !t.alive) return;
          B.blink(u, t.x + (u.face * -55), t.depth);
          B.anim(u, 'attack', .38, 'conniePrankStrike');
          Sound.play('dash', { vol: .5 });

          B.after(.22, () => {
            if (!u.alive || !t.alive) return;
            Sound.play('hit_magic', { vol: .6 });
            B.hitstop(80);
            B.shake(8, .25);
            B.fxConnieSkill('prank', u, { phase: 'impact', target: t });

            B.dispel(t, 2);
            B.energy(t, -35);
            B.damage(u, t, u.st.mag * S.ratio, { type: 'magic', tag: 'Phantom Prank' });

            // Area trap
            B.enemiesOf(u).filter(e => e.alive && B.distance(e, t) < 170).forEach(e => {
              B.applyStatus(u, e, 'dazed', P.daze);
              B.applyStatus(u, e, 'haunted', P.dur);
              B.fxConnieSkill('fear', u, { target: e, dur: P.dur });
            });

            // Blink back & shield ally
            B.after(.25, () => {
              if (!u.alive) return;
              B.blink(u, returnX, u.depth);
              const ally = B.lowestHp(B.alliesOf(u)) || u;
              if (ally && ally.alive) {
                B.cleanse(ally, 1);
                B.shield(u, ally, u.max.hp * S.shield, 6.0);
                B.fxSparkle(ally.x, ally.y - 45, 8, '#bfe9ff');
                B.fxFloatIcon(ally.x, ally.y - 100, '🛡 SPECTRAL SHROUD', '#bfe9ff');
              }
            });
          });
        });
      }
    },

    // ---------------- BLUE SKILL: Spectral Drift & Bait
    B: {
      name: 'Spectral Drift',
      type: 'Evasion Buff / Retaliatory Shielding',
      cd: 10.0,
      v: { eva: .50, move: .30 },
      p: { dur: 7.0, energy: 15 },
      desc: (S, P) => `<span class="sk-pas">Mischievous Bait: Connie taunts attackers away from backline allies. Whenever an enemy misses Connie, they are afflicted with 💫 Dizzy and ⏳ Slow for 4s.</span> Active: Connie enters Spectral Drift for ${P.dur}s, gaining +<em>${pcn(S.eva * 100)}</em> Evasion and +<em>${pcn(S.move * 100)}</em> Move Speed. Every attack avoided during the drift restores ${P.energy} Energy and grants all allies a 5% Max HP shield (stacks up to 5 times). Avoiding at least 2 attacks instantly resets Phantom Prank's cooldown!`,
      ai: { prio: 56, cond: () => true },
      passive: (u, B) => {
        B.on(u, 'enemyMissed', ev => {
          if (ev.src && ev.src.alive && ev.target === u) {
            B.applyStatus(u, ev.src, 'dizzy', 4.0);
            B.applyStatus(u, ev.src, 'slow', 4.0, { stacks: 1 });
            B.fxFloatIcon(ev.src.x, ev.src.y - 95, '💫 DIZZY', '#ffd166');
          }
        });
      },
      cast: (u, B, S, P) => {
        B.anim(u, 'cast', .52, 'connieDrift');
        Sound.play('dash', { vol: .48 });
        B.fxConnieSkill('drift', u, { phase: 'cast', dur: P.dur });

        u._driftDodges = 0;
        u.flat.evaP_drift = S.eva;
        u.dirty = true;
        B.applyStatus(u, u, 'speedup', P.dur, { stacks: 2 });

        const onDriftDodge = () => {
          u._driftDodges = (u._driftDodges || 0) + 1;
          B.alliesOf(u).forEach(a => {
            B.energy(a, P.energy);
            B.shield(u, a, u.max.hp * .05, 6.0);
          });
          B.fxFloatIcon(u.x, u.y - 100, `💨 DRIFT DODGE (${u._driftDodges})`, '#bfe9ff');
          if (u._driftDodges === 2) {
            u.cds.G = 0;
            B.fxFloatIcon(u.x, u.y - 120, '✨ PRANK RESET!', '#38bdf8');
          }
        };

        const unhook = B.on(u, 'dodged', onDriftDodge);

        B.after(P.dur, () => {
          u.flat.evaP_drift = 0;
          u.dirty = true;
          B.fxConnieSkill('drift', u, { phase: 'end' });
          if (unhook) unhook();
        });
      }
    },

    // ---------------- PURPLE SKILL: Spiritual Tether
    P: {
      name: 'Spiritual Tether',
      type: 'Ally Cleanse / Damage Redirection',
      v: { heal: .18, tetherEva: .30 },
      p: { share: .40, cd: 8.0 },
      desc: (S, P) => `When an ally drops below 50% HP or suffers Hard Crowd Control (Stun, Freeze, Silence, Daze), Connie instantly binds a Spiritual Tether to them: cleansing all crowd control, granting +<em>${pcn(S.tetherEva * 100)}</em> Evasion, nullifying 40% of incoming damage through spirit redirection, and healing them for <em>${pcn(S.heal * 100)}</em> Max HP over 5s while granting Connie +25% Skill Haste. (8s cooldown per ally).`,
      passive: (u, B, S, P) => {
        u._tetherAllyCds = u._tetherAllyCds || {};

        const tetherAlly = a => {
          if (!a || !a.alive || a.team !== u.team || a === u) return;
          const uid = a.uid || a.id;
          if (B.t < (u._tetherAllyCds[uid] || 0)) return;
          u._tetherAllyCds[uid] = B.t + P.cd;

          Sound.play('cure_all', { vol: .55 });
          B.cleanse(a, 99);
          B.applyStatus(u, a, 'lucky', 5.0);
          B.heal(u, a, u.max.hp * S.heal, { tag: 'Spiritual Tether' });

          // Share evasion and nullify 40% damage
          a.flat.evaP_tether = S.tetherEva;
          a.flat.dmgTaken_tether = -P.share;
          a.dirty = true;
          B.applyStatus(u, u, 'haste', 5.0);

          B.anim(u, 'cast', .35, 'connieTether');
          B.fxSparkle(a.x, a.y - 45, 10, '#bfe9ff');
          B.fxFloatIcon(a.x, a.y - 105, '🔗 SPIRITUAL TETHER', '#bfe9ff');

          B.after(5.0, () => {
            a.flat.evaP_tether = 0;
            a.flat.dmgTaken_tether = 0;
            a.dirty = true;
          });
        };

        B.on(u, 'allyDamaged', ev => {
          if (ev.unit && ev.unit.hpPct < .50) tetherAlly(ev.unit);
        });

        B.on(u, 'statusApplied', ev => {
          if (ev.unit && ev.unit.team === u.team && STATUS[ev.id]?.cc) tetherAlly(ev.unit);
        });
      }
    },

    // ---------------- RED SKILL: Beyond the Veil
    R: {
      name: 'Beyond the Veil',
      type: 'Vengeful Spirits / Lethal Rescue',
      v: { wispDmg: .85, saveHp: .35 },
      p: { veilEva: .20, blind: 3.5 },
      desc: (S, P) => `Connie dissolves the veil between worlds! At wave start, all allies gain Ghostly Mist (+20% Evasion and +20% Magic Penetration). Whenever Connie or an ally dodges, Connie launches a Vengeful Spirit at the nearest enemy, exploding for <em>${pcn(S.wispDmg * 100)}</em> Magic Damage and Blinding them for ${P.blind}s. Once per battle when an ally would suffer lethal damage, Connie pulls them into the Veil for 3.0s: granting complete Invulnerability, full cleanse, swapping them with a Phantom Decoy that absorbs the blow, and restoring 35% Max HP.`,
      passive: (u, B, S, P) => {
        const deployMist = () => {
          if (!u.alive) return;
          B.alliesOf(u).forEach(a => {
            a.flat.evaP_mist = P.veilEva;
            a.flat.magPen = (a.flat.magPen || 0) + 0.20;
            a.dirty = true;
            B.fxSparkle(a.x, a.y - 45, 8, '#bfe9ff');
          });
          B.fxFloatIcon(u.x, u.y - 110, '🌫 GHOSTLY MIST ACTIVE', '#bfe9ff');
        };

        B.on(u, 'waveStart', deployMist);
        B.after(.35, deployMist);

        // Vengeful spirit on dodges
        const fireWisp = () => {
          if (!u.alive) return;
          const target = B.nearest(u, B.enemiesOf(u).filter(e => e.alive));
          if (!target) return;
          Sound.play('hit_magic', { vol: .45 });
          B.fxArc(u, target, { kind: 'item', img: 'Bonbon', size: 24, col: '#bfe9ff' }, () => {
            if (!target.alive) return;
            B.damage(u, target, u.st.mag * S.wispDmg, { type: 'magic', tag: 'Vengeful Spirit' });
            B.applyStatus(u, target, 'blind', P.blind);
            B.fxSparkle(target.x, target.y - 45, 8, '#bfe9ff');
          });
        };

        B.on(u, 'dodged', fireWisp);
        B.on(u, 'allyDodged', fireWisp);

        // Lethal damage rescue
        B.on(u, 'allyLethal', ev => {
          const a = ev.unit;
          if (!a || a.team !== u.team || u._veilRescueUsed) return;
          u._veilRescueUsed = true;
          ev.prevented = true;
          a.hp = a.max.hp * P.saveHp;
          B.cleanse(a, 99);
          B.applyStatus(u, a, 'untargetable', 3.0);
          B.applyStatus(u, a, 'ward', 3.0);

          // Spawn Decoy at ally position
          B.fxConnieSkill('phantom', a, { twisted: u.twisted });
          B.summon(u, {
            name: 'Rescue Phantom',
            art: Art.unit('Connie', u.twisted),
            hp: u.max.hp * .3,
            scale: .8,
            life: 6,
            taunt: 260,
            x: a.x,
            tint: '#bfe9ff'
          });

          Sound.play('fanfare', { vol: .8 });
          B.flash('#bfe9ff', .4, .25);
          B.fxFloatIcon(a.x, a.y - 120, '👻 PHANTASMAL RESCUE!', '#bfe9ff');
        });
      }
    }
  }
});

/* ============================================================ GINGER
   Healer / Buffer / Team Sustain - A Tier */
function gingerDecoration(u, B, S, P, unit) {
  if (!unit || !unit.alive || unit === u) return;
  if (u._gingerMasterwork) return;
  u._gingerDecoAt = u._gingerDecoAt || {};
  // Count one decoration per ally per support event, not once for every
  // individual buff inside Decorated Treats.
  if (u._gingerDecoAt[unit.uid] === B.t) return;
  u._gingerDecoAt[unit.uid] = B.t;
  u.deco = Math.min((u.deco || 0) + 1, P.max);
  u.flat.healPowP = u.deco * S.per;
  u.flat.energyGen = u.deco * S.per;
  u.dirty = true;
}
defHero({
  id: 'Ginger', name: 'Ginger', folder: 'Ginger', file: 'Ginger', icon: 'Ginger',
  role: 'Support', tier: 'A', element: 'Bake',
  blurb: 'Keeps her team alive through kindness and preparation, and gives away more of herself than she should.',
  base: { hp: 4100, atk: 185, def: 232, mag: 350, mdef: 300, spd: 110, acc: 178, eva: 118 },
  hidden: { range: 270, aspd: .96, ms: 70, aggro: .68, crit: .05, critDmg: 1.45, healPow: 1.56, shieldPow: 1.30, cdr: .10, ccRes: .22, kbRes: .34, armorPen: 0, magPen: .07 },
  growth: { hp: .092, atk: .066, def: .082, mag: .096, mdef: .088 },
  move: { gait: 'waddle', bob: 7, freq: 1.6, lean: 5, squash: .07, idle: 'breathe', step: 'step_soft',
    particles: 'crumbs', pcol: '#ffb56b', trail: { on: false }, brake: .35 },
  basic: { name: 'Icing Flick', type: 'magic', ratio: .96, range: 270, proj: 'food', pimg: 'Cherry', animStyle: 'gingerFlick',
    sfx: 'whoosh', hit: 'hit_light', wind: .22, note: 'A flick of frosting, delivered with intent.',
    onHit: (u, t, B) => { if (chance(.22)) B.applyStatus(u, t, 'messy', 4); } },
  skills: {
    W: {
      name: 'Baked With Care!', type: 'Healing', energy: 100,
      v: { heal: 2.08 }, p: { cost: .15, thr: .55, floor: .20 },
      desc: (S, P) => `<span class="sk-pas">Every time an ally drops below ${pc(P.thr)} HP, Ginger gains 💭 Concern, strengthening her next heal by 15%.</span>
        Active: she gives away one of her own Hearts, healing an ally <em>${pcn(S.heal * 100)}</em> Magic. At maximum Perfect Decoration, the next use heals the whole team and consumes the decorations. It costs <em>${pc(P.cost)}</em> of her own Max HP, and she will not cast it below ${pc(P.floor)} HP. If it saves an ally from defeat, both become 🫂 Encouraged.`,
      passive: (u, B) => {
        B.on(u, 'allyLow', a => {
          if (a._concern && B.t - a._concern < 6) return;
          a._concern = B.t; B.applyStatus(u, u, 'concern', 20, { stacks: 1 });
        });
      },
      cast: (u, B, S, P) => {
        if (u.hpPct < P.floor) return;
        const masterwork = (u.deco || 0) >= (u.decoMax || 8);
        const targets = masterwork
          ? B.alliesOf(u).filter(a => a.alive)
          : [B.lowestHp(B.alliesOf(u).filter(a => a !== u)) || B.lowestHp(B.alliesOf(u))].filter(Boolean);
        if (!targets.length) return;
        const criticalTargets = targets.filter(t => t.hpPct < .3);
        if (masterwork) { u.deco = 0; u._gingerMasterwork = true; }
        B.anim(u, 'cast', .62, 'gingerHeart'); Sound.play('heal_soft', { vol: .38 });
        B.after(.28, () => {
          B.damage(u, u, u.max.hp * P.cost, { type: 'true', selfharm: true, silent: true });
          targets.forEach(t => {
            B.heal(u, t, u.st.mag * S.heal, { tag: 'Baked With Care!' });
            B.fxHeartLink(u, t); B.fxSparkle(t.x, t.y - 40, masterwork ? 14 : 10, '#ffb56b');
            if (t.hpPct < .3 || criticalTargets.includes(t)) B.applyStatus(u, t, 'encouraged', 10);
          });
          B.removeStatus(u, 'concern');
          if (criticalTargets.length) B.applyStatus(u, u, 'encouraged', 10);
          u._gingerMasterwork = false;
        });
      }
    },
    G: {
      name: 'Decorated Treats', type: 'Buff', cd: 10,
      v: { shield: .68 }, p: { dur: 9 },
      desc: (S, P) => `Cookies for everyone. Allies gain Sweet Support for ${P.dur}s: Attack Speed, cooldown recovery and Healing Received all rise. Each ally also receives Freshly Baked, which clears up to two negative statuses and adds Crowd Control Resistance. The weakest ally gets a <em>${pcn(S.shield * 100)}</em> Magic Shield; at maximum Perfect Decoration, every ally receives one.`,
      ai: { prio: 56, cond: () => true },
      cast: (u, B, S, P) => {
        const masterwork = (u.deco || 0) >= (u.decoMax || 8);
        if (masterwork) { u.deco = 0; u._gingerMasterwork = true; }
        B.anim(u, 'cast', .66, 'gingerCleansingTreats'); Sound.play('get_food'); Sound.play('cleanse', { vol: .30 }); Sound.play('cheer', { vol: .24 });
        B.fxRing(u.x, u.y - 42, 118, '#fff1c7', .42);
        B.alliesOf(u).forEach(a => {
          B.applyStatus(u, a, 'sweetsupport', P.dur);
          B.removeStatus(a, 'freshlybaked');
          B.applyStatus(u, a, 'freshlybaked', P.dur);
          B.fxSparkle(a.x, a.y - 40, 8, '#ffb56b');
        });
        const recipients = masterwork ? B.alliesOf(u) : [B.lowestHp(B.alliesOf(u))].filter(Boolean);
        recipients.forEach(a => B.shield(u, a, u.st.mag * S.shield, P.dur));
        u._gingerMasterwork = false;
      }
    },
    B: {
      name: 'Frosting Care', type: 'Healing / Cleanse', cd: 11,
      v: { heal: .82, shield: .18 }, p: { dur: 8 },
      desc: (S, P) => `Ginger sends decorated cookies to every ally, restoring <em>${pcn(S.heal * 100)}</em> Magic and applying Freshly Baked for ${P.dur}s. Freshly Baked cleanses up to two negative statuses and grants Crowd Control Resistance. The weakest ally also receives a <em>${pcn(S.shield * 100)}</em> Shield.`,
      ai: { prio: 68, cond: (u, B) => B.alliesOf(u).some(a => a.hpPct < .92 || a.statuses.some(s => STATUS[s.id] && STATUS[s.id].kind === 'debuff')) },
      cast: (u, B, S, P) => {
        B.anim(u, 'cast', .66, 'gingerCleansingTreats'); Sound.play('get_food'); Sound.play('cleanse', { vol: .30 });
        B.fxRing(u.x, u.y - 42, 118, '#fff1c7', .42);
        B.alliesOf(u).forEach((a, i) => B.after(i * .045, () => {
          if (!a.alive || !u.alive) return;
          B.fxProj(u, a, { kind: 'food', img: 'Honey', col: '#ffb56b' }, () => {
            B.heal(u, a, u.st.mag * S.heal, { tag: 'Frosting Care' });
            B.removeStatus(a, 'freshlybaked');
            B.applyStatus(u, a, 'freshlybaked', P.dur);
            B.fxSparkle(a.x, a.y - 40, 12, '#fff1c7');
          });
        }));
        const w = B.lowestHp(B.alliesOf(u));
        if (w) B.shield(u, w, u.st.mag * S.shield, P.dur);
      }
    },
    P: {
      name: 'Little Improvements', type: 'Passive',
      v: { per: .055 }, p: { max: 8 },
      desc: (S, P) => `Every heal Ginger lands or ally she buffs grants Perfect Decoration (max ${P.max}), worth <em>${pcn(S.per * 100)}</em> Healing Power and Energy Generation each. At max stacks her next healing or buff skill becomes a Masterwork and gives its extra support to the entire team.`,
      passive: (u, B, S, P) => {
        u.decoMax = P.max;
        B.on(u, 'healDone', ev => gingerDecoration(u, B, S, P, ev.target));
        B.on(u, 'statusApplied', ev => {
          if (ev.src !== u || !ev.unit || ev.unit.team !== u.team || ev.unit === u || !STATUS[ev.id] || STATUS[ev.id].kind !== 'buff') return;
          gingerDecoration(u, B, S, P, ev.unit);
        });
      }
    },
    R: {
      name: 'A Recipe For Everyone', type: 'Battle Opener',
      v: { hp: .14, heal: .95 }, p: { thr: .30 },
      desc: (S, P) => `Before battle every ally gains <em>${pcn(S.hp * 100)}</em> Max HP and more Healing Received, and the weakest gets a Shield. Any ally falling below ${pc(P.thr)} HP is automatically given a Last Bite: <em>${pcn(S.heal * 100)}</em> Magic healing, up to two debuffs removed and a damage boost. Ginger then becomes 💪 Determined.`,
      passive: (u, B, S, P) => {
        B.after(.3, () => {
          B.anim(u, 'cast', .76, 'gingerPrep'); Sound.play('get_food', { vol: .7 });
          B.alliesOf(u).forEach(a => { a.flat.hpP2 = S.hp; a.dirty = true; B.applyStatus(u, a, 'rally', 999); });
          const w = B.lowestHp(B.alliesOf(u)); if (w) B.shield(u, w, u.st.mag * .78, 12);
        });
        B.on(u, 'allyLow', a => {
          if (a.hpPct > P.thr) return;
          if (a._lastBite && B.t - a._lastBite < 14) return;
          a._lastBite = B.t;
          B.anim(u, 'cast', .54, 'gingerLastBite');
          B.heal(u, a, u.st.mag * S.heal, { tag: 'Last Bite' });
          B.cleanse(a, 2); B.applyStatus(u, a, 'atkup', 8, { stacks: 2 });
          B.applyStatus(u, u, 'determined', 10);
          Sound.play('get_food'); Sound.play('heal_soft', { vol: .30, throttle: 500 }); B.fxFloatIcon(a.x, a.y - 90, '🍪');
        });
      }
    }
  }
});
