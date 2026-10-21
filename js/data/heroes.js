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
  base: { hp: 3350, atk: 150, def: 168, mag: 372, mdef: 305, spd: 104, acc: 175, eva: 118 },
  hidden: { range: 300, aspd: 0.92, ms: 62, aggro: 0.55, crit: .05, critDmg: 1.5, healPow: 1.30, shieldPow: 1.15, cdr: 0, ccRes: .12, kbRes: .35, armorPen: 0, magPen: .05 },
  growth: { hp: .085, atk: .07, def: .075, mag: .092, mdef: .088 },
  move: { gait: 'float', bob: 9, freq: 1.1, lean: 3, squash: .02, hover: 16, idle: 'pulse', step: null,
    particles: 'sparkle', pcol: '#b9a4ff', trail: { on: true, col: '#8f7fff', rate: .1 }, brake: .1 },
  basic: { name: 'Lullaby Mote', type: 'magic', ratio: 1.02, range: 300, proj: 'orb', pcol: '#b9a4ff',
    sfx: 'whoosh', hit: 'hit_magic', wind: .30, note: 'A drifting mote that slows whatever it settles on.',
    onHit: (u, t, B) => { if (chance(.30)) B.applyStatus(u, t, 'drowsy', 3); } },
  skills: {
    W: {
      name: 'Dream Pulse', type: 'Magic Damage', energy: 100,
      v: { ratio: 1.55, heal: 1.15 }, p: { drowsy: 6, en: 30, thr: .40 },
      desc: (S, P) => `<span class="sk-pas">Allies near Astro recover Energy every second. When an ally drops below ${pc(P.thr)} HP he heals them for <em>${pcn(S.heal * 30)}</em> Magic and grants brief Damage Reduction.</span>
        Active: a wave of dream energy washes the field. Allies restore <em>${P.en}</em> Energy, heal <em>${pcn(S.heal * 100)}</em> Magic and lose up to three debuffs. Enemies take <em>${pcn(S.ratio * 100)}</em> Magic Damage and become 🌙 Drowsy for ${P.drowsy}s.`,
      passive: (u, B) => {
        B.every(u, 1.0, () => B.alliesOf(u).forEach(a => { if (B.distance(a, u) < 340) B.energy(a, 3); }));
        B.on(u, 'allyLow', a => {
          if (a._dreamGuard && B.t - a._dreamGuard < 8) return;
          a._dreamGuard = B.t;
          B.heal(u, a, u.st.mag * 0.30, { tag: 'dream' });
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
      name: 'Peaceful Slumber', type: 'Crowd Control', cd: 11,
      v: { ratio: .35 }, p: { sleep: 5, drain: .25, groggy: 4 },
      desc: (S, P) => `Astro sings the enemy holding the most Energy to sleep for ${P.sleep}s. Up to three positive effects are lulled away, they lose <em>${pc(P.drain)}</em> of their current Energy, and wake 😪 Groggy for ${P.groggy}s.`,
      ai: { prio: 60, cond: (u, B) => B.enemiesOf(u).some(e => !e.hasStatus('sleep')) },
      cast: (u, B, S, P) => {
        const t = B.highestEnergy(B.enemiesOf(u).filter(e => !e.hasStatus('sleep'))); if (!t) return;
        B.anim(u, 'cast', .4); Sound.play('dizzy');
        B.after(.28, () => {
          B.fxRing(t.x, t.y - 50, 110, '#7f6bd6'); B.fxFloatIcon(t.x, t.y - 90, '💤'); B.dispel(t, 3);
          t.energy = Math.max(0, t.energy * (1 - P.drain));
          B.damage(u, t, u.st.mag * S.ratio, { type: 'magic', tag: 'Slumber' });
          B.applyStatus(u, t, 'sleep', P.sleep);
        });
      }
    },
    B: {
      name: 'Falling Stars', type: 'Magic Damage', cd: 15,
      v: { ratio: .46, heal: .22 }, p: { hits: 7, focusBonus: .55 },
      desc: (S, P) => `${P.hits} stars fall on random enemies for <em>${pcn(S.ratio * 100)}</em> Magic each. Stars home in on 🌙 Drowsy or 💤 Sleeping targets and hit <em>${pc(P.focusBonus)}</em> harder. Every impact heals the weakest ally.`,
      ai: { prio: 45, cond: () => true },
      cast: (u, B, S, P) => {
        B.anim(u, 'cast', .5); Sound.play('magiccircle', { vol: .6 });
        B.repeat(P.hits, .13, () => {
          const foes = B.enemiesOf(u); if (!foes.length) return;
          const marked = foes.filter(e => e.hasStatus('drowsy') || e.hasStatus('sleep'));
          const t = marked.length ? pick(marked) : pick(foes);
          const bonus = marked.includes(t) ? (1 + P.focusBonus) : 1;
          B.fxStarfall(t.x, t.y, () => {
            Sound.play('hit_magic', { vol: .5, rate: rnd(.9, 1.2) });
            B.damage(u, t, u.st.mag * S.ratio * bonus, { type: 'magic', tag: 'Falling Stars' });
            B.shake(2, .1);
            const w = B.lowestHp(B.alliesOf(u)); if (w) B.heal(u, w, u.st.mag * S.heal, { silent: true });
          });
        });
      }
    },
    P: {
      name: 'Well Rested', type: 'Team Passive',
      v: { heal: .18, en: .15, pen: .20 }, p: {},
      desc: (S) => `Allies gain <em>${pcn(S.heal * 100)}</em> Healing Received and <em>${pcn(S.en * 100)}</em> Energy Generation. When an ally is topped to full HP their next skill ignores <em>${pcn(S.pen * 100)}</em> Magic Defense.`,
      passive: (u, B, S) => {
        B.teamAura(u, m => { m.healRecv += S.heal; m.energyGen += S.en; });
        B.on(u, 'allyFull', a => { a.penBuff = S.pen; B.fxFloatIcon(a.x, a.y - 80, '✨'); });
      }
    },
    R: {
      name: 'Endless Night', type: 'Battle Opener',
      v: { shield: .55 }, p: { dur: 10, revive: .18 },
      desc: (S, P) => `Battle opens under a peaceful night for ${P.dur}s: allies regenerate, enemies are 🌙 Drowsy. Whenever Astro casts, his weakest ally gains a <em>${pcn(S.shield * 100)}</em> Magic Shield and ⚓ CC immunity. Once per ally, a lethal blow instead leaves them at <em>${pc(P.revive)}</em> HP and briefly 👻 Ethereal.`,
      passive: (u, B, S, P) => {
        B.tint('#2b2160', .28, 2.2);
        B.enemiesOf(u).forEach(e => B.applyStatus(u, e, 'drowsy', P.dur));
        B.alliesOf(u).forEach(a => B.applyStatus(u, a, 'regen', P.dur, { val: u.st.mag * .12 }));
        B.on(u, 'cast', () => {
          const w = B.lowestHp(B.alliesOf(u)); if (!w) return;
          B.shield(u, w, u.st.mag * S.shield, 6); B.applyStatus(u, w, 'ccimmune', 3);
        });
        B.on(u, 'allyLethal', ev => {
          if (ev.unit._nightSave) return; ev.unit._nightSave = 1;
          ev.prevented = true; ev.unit.hp = ev.unit.max.hp * P.revive;
          B.energy(ev.unit, 50); B.applyStatus(u, ev.unit, 'untargetable', 1.6);
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
  base: { hp: 4900, atk: 232, def: 300, mag: 262, mdef: 305, spd: 100, acc: 195, eva: 100 },
  hidden: { range: 200, aspd: 0.90, ms: 66, aggro: 1.5, crit: .07, critDmg: 1.5, healPow: 1.10, shieldPow: 1.20, cdr: .05, ccRes: .25, kbRes: .6, armorPen: 0, magPen: .05 },
  growth: { hp: .098, atk: .075, def: .092, mag: .082, mdef: .092 },
  move: { gait: 'glide', bob: 3, freq: 1.6, lean: 4, squash: .03, idle: 'scan', step: 'step_metal',
    particles: 'static', pcol: '#7be0ff', trail: { on: true, col: '#7be0ff', rate: .14 }, brake: .2 },
  basic: { name: 'Signal Jab', type: 'physical', ratio: 1.05, range: 210, sfx: 'swing_pole', hit: 'hit_blunt',
    wind: .18, note: 'Sharp, professional, mildly threatening.',
    onHit: (u, t, B) => { if (t.hasStatus('headline')) B.energy(u, 6); } },
  skills: {
    W: {
      name: 'Spotlight On', type: 'Magic Damage', energy: 100,
      v: { ratio: 1.25 }, p: { blind: 4, drain: .30, acc: .18 },
      desc: (S, P) => `<span class="sk-pas">Vee tags the enemy contributing the most damage as the 📺 Headline. Allies gain <em>${pc(P.acc)}</em> Accuracy against it and Energy whenever it casts.</span>
        Active: studio lights flood the field for <em>${pcn(S.ratio * 100)}</em> Magic. The Headline is interrupted, 🌑 Blinded for ${P.blind}s and loses <em>${pc(P.drain)}</em> Energy. If it falls while marked, the team heals and a new one is named.`,
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
        B.on(u, 'enemyCast', e => { if (e.hasStatus('headline')) B.alliesOf(u).forEach(a => B.energy(a, 5)); });
        B.on(u, 'enemyDown', e => { if (e.hasStatus('headline'))
          B.alliesOf(u).forEach(a => B.heal(u, a, u.max.hp * .05, { tag: 'ratings' })); });
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
      name: 'Audience Support', type: 'Healing', cd: 12,
      v: { heal: .09 }, p: { dur: 5, count: 3 },
      desc: (S, P) => `The crowd cheers. The ${P.count} weakest allies heal <em>${pcn(S.heal * 100)}</em> of Vee's Max HP over ${P.dur}s while gaining Defense. Overheal becomes a 🛡 Shield; already-shielded allies get Energy Generation instead.`,
      ai: { prio: 58, cond: (u, B) => B.alliesOf(u).some(a => a.hpPct < .8) },
      cast: (u, B, S, P) => {
        B.anim(u, 'cast', .72, 'veeAudience'); Sound.play('cheer');
        const chosen = B.alliesOf(u).sort((a, b) => a.hpPct - b.hpPct).slice(0, P.count);
        B.fxVeeAudience(u, chosen);
        chosen.forEach(a => {
          B.applyStatus(u, a, 'fortify', P.dur, { stacks: 2 });
          if (a.hasStatus('shield')) B.applyStatus(u, a, 'overcharge', P.dur);
          B.applyStatus(u, a, 'regen', P.dur, { val: u.max.hp * S.heal / P.dur, overheal: 'shield' });
          B.fxSparkle(a.x, a.y - 40, 10, '#7bd66a');
        });
      }
    },
    B: {
      name: 'Commercial Break', type: 'Team Buff', cd: 20,
      v: {}, p: { dur: 6 },
      desc: (S, P) => `Vee cuts to ads for ${P.dur}s. Enemy cooldowns crawl, allies gain 💨 Haste, faster Energy and immunity to Energy drain. Ally skills cast during the break heal their caster.`,
      ai: { prio: 42, cond: (u, B) => B.enemiesOf(u).length >= 2 },
      cast: (u, B, S, P) => {
        B.anim(u, 'cast', .78, 'veeCommercial'); Sound.play('ui_open'); B.tint('#1b2a55', .3, .5);
        const enemies = B.enemiesOf(u), allies = B.alliesOf(u);
        B.fxVeeCommercial(u, allies, enemies, P.dur);
        enemies.forEach(e => B.applyStatus(u, e, 'drowsy', P.dur));
        allies.forEach(a => {
          B.applyStatus(u, a, 'haste', P.dur, { stacks: 2 });
          B.applyStatus(u, a, 'overcharge', P.dur);
        });
        u._breakUntil = B.t + P.dur;
        B.on(u, 'allyCast', a => { if (B.t < (u._breakUntil || 0)) B.heal(u, a, u.max.hp * .04, { silent: true }); });
      }
    },
    P: {
      name: 'Studio Production', type: 'Defense / Magic Defense',
      v: { def: .028 }, p: { maxStacks: 10, redirect: .22 },
      desc: (S, P) => `Each time an ally damages the 📺 Headline, Vee gains Production Value (max ${P.maxStacks}), worth <em>${pcn(S.def * 100)}</em> Defense each. At max stacks she redirects <em>${pc(P.redirect)}</em> of nearby ally damage onto herself at reduced strength, granting them Energy. Stacks are only lost if Vee falls.`,
      passive: (u, B, S, P) => {
        u.prodMax = P.maxStacks; u.prodDef = S.def;
        B.on(u, 'allyDamageDealt', ev => {
          if (ev.target.hasStatus('headline')) { u.prod = Math.min((u.prod || 0) + 1, P.maxStacks); u.dirty = true; }
        });
        B.on(u, 'allyDamaged', ev => {
          if ((u.prod || 0) < P.maxStacks || ev.unit === u || !u.alive) return;
          if (B.distance(ev.unit, u) > 280) return;
          const moved = ev.amount * P.redirect; ev.amount -= moved;
          B.damage(ev.src, u, moved * .6, { type: 'true', redirected: true, tag: 'redirect' });
          if (u.alive) B.energy(ev.unit, 8);
        });
      }
    },
    R: {
      name: 'Season Finale', type: 'Battle Opener',
      v: { exposeDmg: .18 }, p: { needExposure: 6, liveDur: 12 },
      desc: (S, P) => `Enemies build Exposure by acting. At ${P.needExposure} they become the 📺 Headline: less damage, no hiding, less healing, and <em>${pcn(S.exposeDmg * 100)}</em> more damage taken. Each Headline defeated refreshes ally shields and hardens Vee permanently. Once per battle, if Vee is last alive she goes Live for ${P.liveDur}s and every enemy is a Headline.`,
      passive: (u, B, S, P) => {
        u.antiDodge = target => !!(target && (target.hasStatus('headline') || B.t < (target._veeOnAirUntil || 0)));
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
          B.alliesOf(u).forEach(a => { B.energy(a, 20); B.refreshShields(a); B.reduceCd(a, 2); });
          u.flat.defP2 = (u.flat.defP2 || 0) + .05; u.dirty = true;
        });
        B.every(u, 1, () => {
          if (u._live || !u.alive) return;
          if (B.alliesOf(u).filter(a => a !== u).length === 0) {
            u._live = true; B.log('<b>LIVE BROADCAST</b>'); Sound.play('suddendeath');
            B.tint('#ff2b6b', .3, 1.2); B.applyStatus(u, u, 'ccimmune', P.liveDur);
            B.applyStatus(u, u, 'spotlight', P.liveDur); u.rangeBonus = 240;
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
      v: {}, p: { dur: 6 },
      desc: (S, P) => `For ${P.dur}s the whole team takes 30% less damage and receives 35% more healing.`,
      ai: { prio: 50, cond: (u, B) => B.alliesOf(u).filter(a => a.hpPct < .7).length >= 2 || B.t > 12 },
      cast: (u, B, S, P) => {
        B.anim(u, 'cast', .4); Sound.play('buff'); Sound.play('cheer', { vol: .28 }); B.tint('#ffbe7a', .18, .5);
        B.alliesOf(u).forEach(a => { B.applyStatus(u, a, 'ward', P.dur); B.applyStatus(u, a, 'rally', P.dur);
          B.fxRing(a.x, a.y - 40, 70, '#ffd7a0'); });
      }
    },
    P: {
      name: 'A Recipe For Care', type: 'Healing Upgrade',
      v: {}, p: { splash: .45 },
      desc: (S,P) => 'Sharing is Caring splashes '+Math.round(P.splash*100)+'% of its healing onto allies near its target. Everyone it heals gains Speed Up.',
      passive: (u,B,S,P) => { u._cosmoSplash=P.splash; }
    },
    R: {
      name: 'The Sweetest Gift', type: 'Healing / Shield',
      v: {}, p: { gift: .60 },
      desc: (S,P) => 'Fresh Baked Treats leaves a second treat worth '+Math.round(P.gift*100)+'% Magic healing. Any overhealing Cosmo does becomes a Shield.',
      passive: (u,B,S,P) => { u.overhealShield = true; u._cosmoGift=P.gift; }
    }
  }
});

/* ============================================================ COCOA
   Support / Utility / Buffer - SS Tier
   The BonBon economy: prepare, deliver on ally casts, convert to Sugar Rush. */
defHero({
  id: 'Cocoa', name: 'Cocoa', folder: 'Cocoa', file: 'Cocoa', icon: 'Cocoa',
  role: 'Support', tier: 'SS', element: 'Chocolate',
  blurb: 'An endlessly optimistic chocolate bunny who decided everyone needs help whether they asked or not.',
  // Cocoa is the more advanced support profile: a small edge over Bassie in
  // survivability, spell output, reach, and tempo without eclipsing dedicated
  // damage dealers. Her value still comes from delivery and team acceleration.
  base: { hp: 4050, atk: 190, def: 236, mag: 325, mdef: 260, spd: 121, acc: 190, eva: 132 },
  hidden: { range: 270, aspd: .98, ms: 80, aggro: .60, crit: .07, critDmg: 1.48, healPow: 1.25, shieldPow: 1.46, cdr: .18, ccRes: .20, kbRes: .35, armorPen: 0, magPen: .06 },
  growth: { hp: .088, atk: .065, def: .078, mag: .09, mdef: .084 },
  move: { gait: 'hop', bob: 12, freq: 2.3, lean: 6, squash: .10, idle: 'bounce', step: 'bounce',
    particles: 'crumbs', pcol: '#c98a5a', trail: { on: false }, brake: .25 },
  basic: { name: 'Candy Flick', type: 'magic', ratio: .90, range: 265, proj: 'orb', pcol: '#c98a5a',
    sfx: 'whoosh', hit: 'hit_light', wind: .20, note: 'A flicked BonBon. Mostly a delivery system.',
    onHit: (u, t, B) => { if (chance(.2)) B.bonbon(u, 1); } },
  skills: {
    W: {
      name: 'BonBon Delivery', type: 'Team Buff', energy: 100, cd: 4.5,
      v: { en: 26 }, p: { dur: 9, max: 5, prepEvery: 3.2 },
      desc: (S, P) => `<span class="sk-pas">Cocoa prepares a BonBon every ${P.prepEvery}s, storing up to ${P.max}. Whenever an ally casts a skill she spends one to throw them a BonBon, once every 5s per ally. If they already have 🍬 Sugar Rush, the delivery restores <em>${Math.round(S.en)}</em> Energy and extends the buff instead.</span>
        Active: Cocoa spends her stored BonBons to serve every ally. New recipients gain 🍬 Sugar Rush for ${P.dur}s (Attack Speed, Move Speed, Haste, and Energy generation); already-rushing allies gain Energy and an extended duration. Purple refunds some spent BonBons instead of refunding preparation ticks.`,
      ai: { cond: (u, B) => (u.bonbons || 0) > 0 && B.alliesOf(u).some(a => !a.hasStatus('sugarrush') || (a.getStatus('sugarrush').t || 0) < 4) },
      passive: (u, B, S, P) => {
        u.bonbons = P.max; u.bonbonMax = P.max;
        B.every(u, P.prepEvery, () => B.bonbon(u, 1));
        u._cocoaConsumeBonbon = () => {
          if ((u.bonbons || 0) <= 0) return false;
          u.bonbons--;
          // Purple refunds consumed BonBons, not preparation ticks.
          if (u.bonbonRefund && chance(u.bonbonRefund)) u.bonbons = Math.min(u.bonbonMax || P.max, u.bonbons + 1);
          return true;
        };
        u._cocoaApplyRush = a => {
          if (!a || !a.alive || a.team !== u.team) return false;
          const rush = a.getStatus('sugarrush');
          const repeated = !!rush;
          if (rush) { B.energy(a, S.en); rush.t += P.dur * .6; }
          else B.applyStatus(u, a, 'sugarrush', P.dur);
          // Keep BonBon delivery observable even when Sugar Rush is refreshed.
          // Status-applied listeners only fire for the first application, but
          // Cocoa's friendship badges should reward every BonBon someone eats.
          B.emitFor(u, 'bonbonDelivered', { target: a, repeated });
          return true;
        };
        u._cocoaDeliverBonbon = (a, respectCooldown) => {
          if (!a || !a.alive || (u.bonbons || 0) <= 0) return false;
          if (respectCooldown && Number.isFinite(a._bonCd) && B.t - a._bonCd < 5) return false;
          if (!u._cocoaConsumeBonbon()) return false;
          if (respectCooldown) a._bonCd = B.t;
          u._cocoaApplyRush(a);
          B.fxProj(u, a, { kind: 'orb', col: '#c98a5a' }, () => {
            Sound.play('get_food', { vol: .5 }); B.fxFloatIcon(a.x, a.y - 80, '🍬');
          });
          return true;
        };
        B.on(u, 'allyCast', a => {
          if (a === u || (u.bonbons || 0) <= 0) return;
          u._cocoaDeliverBonbon(a, true);
        });
      },
      cast: (u, B, S, P) => {
        // Reserve the stock before any delayed FX or ally events can cause a
        // second White-skill decision in the same frame. This is especially
        // important in Lab fights with max Energy generation.
        const stock = u.bonbons || 0;
        if (!stock) return;
        u.bonbons = 0;
        for (let i = 0; i < stock; i++) if (u.bonbonRefund && chance(u.bonbonRefund)) u.bonbons++;
        B.anim(u, 'cast', .72, 'cocoaBonbonBurst'); Sound.play('cheer'); Sound.play('get_food', { vol: .38, throttle: 180 }); B.tint('#c98a5a', .18, .5);
        B.fxRing(u.x, u.y - 34, 76, '#e8b98a');
        B.after(.28, () => {
          B.alliesOf(u).forEach(a => {
            u._cocoaApplyRush(a);
            B.fxSparkle(a.x, a.y - 40, 10, '#e8b98a');
          });
        });
      }
    },
    G: {
      name: 'Sharing is Caring', type: 'Shield / Cleanse', cd: 9,
      v: { shield: .21 }, p: { dur: 8, lowThr: .5 },
      desc: (S, P) => `Whenever an ally gains 🍬 Sugar Rush they also gain a Shield worth <em>${pcn(S.shield * 100)}</em> of Cocoa's Max HP. Already shielded allies heal over time instead. Allies below ${pc(P.lowThr)} HP get a stronger Shield. Casting this applies 🍫 BonBon Blessing, which cleanses up to two negative statuses and grants CC Resistance to each ally.`,
      ai: { prio: 54, cond: (u, B) => B.alliesOf(u).some(a => a.hpPct < .9) },
      passive: (u, B, S, P) => {
        B.on(u, 'statusApplied', ev => {
          if (ev.id !== 'sugarrush' || ev.src !== u) return;
          const a = ev.unit;
          const amt = u.max.hp * S.shield * (a.hpPct < P.lowThr ? 1.6 : 1);
          if (a.hasStatus('shield')) { B.applyStatus(u, a, 'regen', P.dur, { val: amt / P.dur }); B.energy(a, 3); }
          else B.shield(u, a, amt, P.dur);
        });
      },
      cast: (u, B, S, P) => {
        B.anim(u, 'cast', .68, 'cocoaShareCleanse'); Sound.play('guard');
        B.fxRing(u.x, u.y - 34, 92, '#f3d3a7');
        B.alliesOf(u).forEach(a => {
          B.shield(u, a, u.max.hp * S.shield * (a.hpPct < P.lowThr ? 1.6 : 1), P.dur);
          const alreadyBlessed = a.hasStatus('bonbonblessing');
          B.applyStatus(u, a, 'bonbonblessing', P.dur);
          // Refreshing an existing blessing does not fire onApply, so keep
          // the cleanse promise true on every cast without double-cleansing.
          if (alreadyBlessed) B.cleanse(a, 2);
          B.fxSparkle(a.x, a.y - 44, 8, '#fff1c2');
        });
      }
    },
    B: {
      name: 'Sweet Surprise', type: 'Physical Damage', cd: 13,
      v: { ratio: 1.05 }, p: { dur: 7 },
      desc: (S, P) => `A chocolate treat bursts over the biggest cluster for <em>${pcn(S.ratio * 100)}</em> Attack, coating them for ${P.dur}s. Coated enemies lose Attack Speed and cooldown speed, and the impact strips one removable buff. Allies who attack coated enemies restore Energy and briefly gain Speed Up.`,
      ai: { prio: 47, cond: () => true },
      cast: (u, B, S, P) => {
        B.anim(u, 'cast', .78, 'cocoaChocolateToss'); Sound.play('throwsomething', { vol: .35 }); Sound.play('bomb', { vol: .42, delay: 220 });
        B.after(.34, () => {
          const cx = B.avgX(B.enemiesOf(u));
          B.fxBoom(cx, B.ground - 60, 1.45, '#c98a5a'); B.shake(6, .22);
          B.enemiesOf(u).forEach(e => {
            if (Math.abs(e.x - cx) > 330) return;
            B.damage(u, e, u.st.atk * S.ratio, { type: 'physical', tag: 'Sweet Surprise' });
            const buff = e.statuses.find(s => STATUS[s.id] && STATUS[s.id].kind === 'buff' && s.id !== 'shield' && !s.apexLocked);
            if (buff) B.removeStatus(e, buff.id);
            B.applyStatus(u, e, 'sticky', P.dur); B.applyStatus(u, e, 'drowsy', P.dur);
          });
          u._chocoUntil = B.t + P.dur;
          if (!u._cocoaChocolateHook) {
            u._cocoaChocolateHook = true;
            B.on(u, 'allyDamageDealt', ev => {
              if (B.t >= (u._chocoUntil || 0) || !ev.target || !ev.target.hasStatus('sticky') || !ev.src || ev.src.team !== u.team) return;
              if (Number.isFinite(ev.src._cocoaChocoAt) && B.t - ev.src._cocoaChocoAt < 1.2) return;
              ev.src._cocoaChocoAt = B.t; B.energy(ev.src, 3); B.applyStatus(u, ev.src, 'speedup', 1.4);
            });
          }
        });
      }
    },
    P: {
      name: 'Always Prepared', type: 'Energy',
      v: { refund: .42 }, p: { extra: 2 },
      desc: (S, P) => `Cocoa's BonBon storage grows by ${P.extra}. Every BonBon consumed has a <em>${pcn(S.refund * 100)}</em> chance to be replaced instantly. When an ally under 🍬 Sugar Rush personally defeats an enemy, Cocoa restores Energy, reduces her cooldowns, and prepares another BonBon.`,
      passive: (u, B, S, P) => {
        u.bonbonMax = (u.bonbonMax || 4) + P.extra;
        u.bonbonRefund = S.refund;
        B.on(u, 'enemyDown', e => {
          const killer = e && e._lastHitBy;
          if (killer && killer.team === u.team && killer.hasStatus('sugarrush')) { B.energy(u, 18); B.reduceCd(u, 1.5); B.bonbon(u, 1); }
        });
      }
    },
    R: {
      name: 'A Basket for Everyone', type: 'Max HP / Shield',
      v: {}, p: { thr: .45 },
      desc: (S, P) => `Cocoa starts at maximum BonBons. 🍬 Sugar Rush now also grants Crit Chance and CC Resistance. Any ally dropping below ${pc(P.thr)} HP is handed a free BonBon without spending storage. While every living ally has Sugar Rush, the team gains extra Haste and Energy generation, their buffs cannot be stripped, and they receive a steady Energy pulse. BonBons prepared while storage is full overflow directly to the lowest-HP ally.`,
      passive: (u, B, S, P) => {
        u.bonbons = u.bonbonMax || 6;
        u.sugarPlus = true;
        u.cocoaOverflow = true; u.cocoaOverflowDur = 8;
        B.on(u, 'allyLow', a => {
          if (a._freeBon && B.t - a._freeBon < 9) return;
          if (a.hpPct > P.thr) return;
          a._freeBon = B.t;
          B.applyStatus(u, a, 'sugarrush', 8);
          B.applyStatus(u, a, 'lucky', 8);
          B.fxFloatIcon(a.x, a.y - 90, '🍬');
        });
        B.every(u, 1, () => {
          const all = B.alliesOf(u);
          const fullTeam = all.length && all.every(a => a.hasStatus('sugarrush'));
          all.forEach(a => {
            const powered = a.hasStatus('sugarrush');
            if (powered) {
              B.applyStatus(u, a, 'lucky', 1.4);
              B.applyStatus(u, a, 'bonbonblessing', 1.4);
            }
            a.flat.cdr7 = fullTeam ? .14 : 0;
            a.flat.energyGen7 = fullTeam ? .18 : 0;
            a._cocoaBuffGuardUntil = fullTeam ? B.t + 1.2 : 0;
            a.dirty = true;
            if (fullTeam) B.energy(a, 4);
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
      v: { shield: .24, heal: .28 }, p: { wrap: 3, slow: 4, kb: 130 },
      desc: (S, P) => `<span class="sk-pas">Taking a heavy hit grants 📦 Packed Protection, raising Bobette's Defense. At max stacks her next Shield is far stronger.</span>
        Active: she wraps herself in a gift box for ${P.wrap}s, unable to act but taking greatly reduced damage and immune to crowd control. When it opens she heals <em>${pcn(S.heal * 100)}</em> Max HP, shields nearby allies for <em>${pcn(S.shield * 100)}</em> Max HP, and shoves enemies away 🐢 Slowed.`,
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
        const boost = packed && packed.stacks >= 5 ? 1.8 : 1;
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
            if (alreadyWrapped) B.applyStatus(u, e, 'root', 1.35);
          });
        });
      }
    },
    G: {
      name: 'Holiday Spirit', type: 'Healing / Buff', cd: 11,
      v: { shield: .10 }, p: { dur: 9 },
      desc: (S, P) => `The team gains 🎄 Festive Cheer for ${P.dur}s: Move Speed, Energy Generation and Healing Received all rise. Any ally who fires their ultimate while cheered gains a <em>${pcn(S.shield * 100)}</em> Max HP Shield. The effect grows with each nearby ally.`,
      ai: { prio: 56, cond: () => true },
      cast: (u, B, S, P) => {
        B.anim(u, 'cast', .64, 'bobetteCheer'); Sound.play('cheer'); B.fxBobetteSkill('cheer', u);
        const near = B.alliesOf(u).filter(a => B.distance(a, u) < 340).length;
        const scale = 1 + near * .12;
        B.fxRing(u.x, u.y - 30, 340, '#e8536b', .5);
        B.alliesOf(u).forEach(a => {
          B.applyStatus(u, a, 'festivecheer', P.dur);
          B.fxSparkle(a.x, a.y - 40, 8, '#e8536b');
          B.fxFloatIcon(a.x, a.y - 100, '🎄');
        });
        u._cheerUntil = B.t + P.dur;
        B.on(u, 'allyUltimate', a => {
          if (B.t < (u._cheerUntil || 0) && a.hasStatus('festivecheer'))
            B.shield(u, a, u.max.hp * S.shield * scale, 6);
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
      v: {}, p: { max: 8 },
      desc: (S, P) => `Whenever a nearby ally loses HP, Bobette gains 🔔 Festive Guard (max ${P.max}), raising Defense, Magic Defense and Shield Strength. At max stacks she shares it with nearby allies, and any Shield she receives also shields everyone carrying Festive Guard.`,
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
          B.alliesOf(u).forEach(a => { if (a !== u && a.hasStatus('festiveguard')) B.shield(u, a, u.max.hp * .05, 6); });
        });
      }
    },
    R: {
      name: 'The Perfect Present', type: 'Battle Opener',
      v: { revive: .30 }, p: {},
      desc: (S) => `Before battle the ally with the lowest Max HP receives 🎁 Holiday Favor: more Max HP, Damage Reduction and Healing Received. If they would be defeated the present opens instead and they survive at <em>${pc(S.revive)}</em> HP, protected for several seconds. Afterwards Bobette gains Defense, Shield Strength and Healing, but her own damage drops by a third.`,
      passive: (u, B, S) => {
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
          B.applyStatus(u, ev.unit, 'ward', 5); B.applyStatus(u, ev.unit, 'ccimmune', 5);
          Sound.play('bobette_present_pop', { vol: .7 }); B.fxBobetteSkill('open', ev.unit); B.fxConfetti(ev.unit.x, ev.unit.y - 50, 50);
          B.log('<b>The Perfect Present opens.</b>');
          u.flat.defP2 = .35; u.flat.shieldPowP = .40; u.flat.healPowP = .35; u.flat.dmgDealt = -.33;
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
  role: 'Damage', tier: 'D', element: 'Music',
  blurb: 'A quiet music box keeping a rhythm going. Once the beat is established, every note lands with purpose.',
  base: { hp: 3500, atk: 372, def: 218, mag: 175, mdef: 200, spd: 112, acc: 186, eva: 118 },
  hidden: { range: 195, aspd: 1.10, ms: 68, aggro: .65, crit: .14, critDmg: 1.60, healPow: 1, shieldPow: 1, cdr: .06, ccRes: .12, kbRes: .3, armorPen: .08, magPen: 0 },
  growth: { hp: .080, atk: .092, def: .074, mag: .06, mdef: .07 },
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
      v: { ratio: .98 }, p: { dur: 5, radius: 300 },
      desc: (S, P) => `Sound waves ripple out for <em>${pcn(S.ratio * 100)}</em> Attack, cutting enemy Attack Speed for ${P.dur}s. Hitting two or more enemies grants extra 🎵 Tempo.`,
      ai: { prio: 55, cond: (u, B) => B.enemiesOf(u).some(e => B.distance(e, u) < 300) },
      cast: (u, B, S, P) => {
        B.anim(u, 'cast', .35); Sound.play('whoosh');
        B.fxRing(u.x, u.y - 40, P.radius * 2, '#ffd166', .5);
        let hit = 0;
        B.enemiesOf(u).forEach(e => {
          if (B.distance(e, u) > P.radius) return;
          hit++;
          B.damage(u, e, u.st.atk * S.ratio, { type: 'physical', tag: 'Music Box Melody' });
          B.applyStatus(u, e, 'slow', P.dur);
        });
        if (hit >= 2) B.applyStatus(u, u, 'tempo', 8, { stacks: 2 });
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
      v: { per: .07 }, p: {},
      desc: (S) => `For every living ally Boxten gains <em>${pcn(S.per * 100)}</em> Attack Speed, cooldown recovery and Energy Generation. The bonus shrinks as allies fall.`,
      passive: (u, B, S) => {
        B.every(u, .5, () => {
          const n = B.alliesOf(u).filter(a => a !== u).length;
          u.flat.aspdP = n * S.per; u.flat.cdr = n * S.per; u.flat.energyGen = n * S.per;
          u.dirty = true;
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
            B.alliesOf(u).forEach(a => { B.applyStatus(u, a, 'overcharge', 4); B.applyStatus(u, a, 'speedup', 4); });
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
      v: { dr: .15, regen: .012 }, p: { radius: 300 },
      desc: (S, P) => `Allies within Brightney's light take <em>${pcn(S.dr * 100)}</em> less damage and regenerate <em>${pcn(S.regen * 100)}</em> Max HP per second.`,
      passive: (u, B, S, P) => {
        B.every(u, 1, () => B.alliesOf(u).forEach(a => {
          if (B.distance(a, u) > P.radius) { a.flat.dmgTaken2 = 0; a.dirty = true; return; }
          B.heal(u, a, a.max.hp * S.regen, { silent: true, tag: 'safety light' });
          a.flat.dmgTaken2 = -S.dr; a.dirty = true;
        }));
      }
    },
    R: {
      name: 'Overcharged Bulb', type: 'Ultimate Upgrade',
      v: {}, p: { dur: 4 },
      desc: (S, P) => `Blinding Flash now cleanses every debuff from Brightney and grants the whole team bonus Energy Generation and Move Speed for ${P.dur}s.`,
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
   Evasive Support / Ghost - S Tier */
defHero({
  id: 'Connie', name: 'Connie', folder: 'Connie', file: 'Connie', icon: 'Connie',
  role: 'Support', tier: 'S', element: 'Spirit',
  blurb: 'A ghost who survives not by being tough but by being extremely difficult to interact with.',
  base: { hp: 3200, atk: 205, def: 178, mag: 342, mdef: 292, spd: 128, acc: 190, eva: 235 },
  hidden: { range: 275, aspd: 1.0, ms: 88, aggro: .30, crit: .12, critDmg: 1.65, healPow: 1.10, shieldPow: 1, cdr: .12, ccRes: .20, kbRes: .5, armorPen: 0, magPen: .18 },
  growth: { hp: .072, atk: .068, def: .062, mag: .096, mdef: .086 },
  move: { gait: 'float', bob: 8, freq: .9, lean: 4, squash: .03, hover: 22, idle: 'drift', step: null,
    particles: 'glow', pcol: '#bfe9ff', trail: { on: true, col: '#bfe9ff', rate: .09 }, brake: .12, sway: 8 },
  basic: { name: 'Chill Touch', type: 'magic', ratio: .96, range: 275, proj: 'orb', pcol: '#bfe9ff',
    sfx: 'whoosh', hit: 'hit_magic', wind: .22, note: 'Barely there, and colder than it looks.',
    onHit: (u, t, B) => { if (chance(.25)) B.applyStatus(u, t, 'dizzy', 4); } },
  skills: {
    W: {
      name: 'Haunting Escape', type: 'Utility', energy: 100, cd: 18,
      v: {}, p: { dur: 4, fear: 4, acc: .25 },
      desc: (S, P) => `<span class="sk-pas">Connie's ghostly nature strips <em>${pc(P.acc)}</em> Accuracy from anything aiming at her, and every few seconds she can phase into a brief immunity to applied debuffs.</span> Enemies avoid targeting her while other allies stand.
        Active: when pressured, she slips into the spirit world for ${P.dur}s, untargetable and cleansed of everything. On returning she frightens nearby enemies, cutting their Attack Speed and Accuracy for ${P.fear}s. The escape must recharge before she can vanish again.`,
      ai: { cond: (u, B) => u.hpPct < .68 || B.enemiesOf(u).some(e => e.target === u && B.distance(e, u) < 245) },
      passive: (u, B) => {
        u.flat.aggro = -.7;
        u.connieDebuffGuardAt = 0;
        u.connieDebuffImmuneUntil = 0;
        u.guards = u.guards || [];
        u.guards.push((id, d, battle) => {
          if (!d || d.kind !== 'debuff') return false;
          if (battle.t < u.connieDebuffImmuneUntil) return true;
          if (battle.t < u.connieDebuffGuardAt) return false;
          u.connieDebuffGuardAt = battle.t + 7;
          u.connieDebuffImmuneUntil = battle.t + 2.2;
          B.applyStatus(u, u, 'ccimmune', 2.2);
          return true;
        });
        B.on(u, 'damaged', ev => { if (ev.src) ev.amount *= .82; });
      },
      cast: (u, B, S, P) => {
        B.anim(u, 'cast', .72, 'connieEscape');
        Sound.play('unsummon', { vol: u.twisted ? .48 : .36 });
        B.fxConnieSkill('escape', u, { phase: 'cast', dur: P.dur });
        B.after(.24, () => {
          if (!u.alive) return;
          Sound.play('explode', { vol: u.twisted ? .48 : .36 });
          B.fxConnieSkill('escape', u, { phase: 'burst', dur: P.dur });
        });
        B.applyStatus(u, u, 'untargetable', P.dur);
        B.cleanseAll(u);
        B.after(P.dur, () => {
          if (!u.alive) return;
          B.anim(u, 'cast', .46, 'connieReturn');
          Sound.play('gasp', { vol: u.twisted ? .52 : .4 });
          B.fxConnieSkill('escape', u, { phase: 'return', dur: P.fear });
          B.flash(u.twisted ? '#d84b92' : '#bfe9ff', .28, .3); B.shake(8, .3);
          B.enemiesOf(u).forEach(e => {
            if (B.distance(e, u) > 300) return;
            B.applyStatus(u, e, 'slow', P.fear, { stacks: 2 });
            B.applyStatus(u, e, 'dizzy', P.fear);
            B.fxConnieSkill('fear', u, { target: e, dur: P.fear });
          });
        });
      }
    },
    G: {
      name: 'Phantom Prank', type: 'Magic Damage', cd: 9,
      v: { ratio: 1.15 }, p: { dur: 7 },
      desc: (S, P) => `Connie blinks behind the enemy backline and strikes the farthest target for <em>${pcn(S.ratio * 100)}</em> Magic, leaving them 👁 Haunted for ${P.dur}s: far more damage taken from Connie, and much slower skill recharge.`,
      ai: { prio: 58, cond: () => true },
      cast: (u, B, S, P) => {
        const t = B.farthestN(u, B.enemiesOf(u), 1)[0]; if (!t) return;
        u.face = t.x >= u.x ? 1 : -1;
        B.anim(u, 'wind', .68, 'conniePrankWindup');
        Sound.play('unsummon', { vol: u.twisted ? .38 : .28 });
        B.fxConnieSkill('prank', u, { phase: 'cast', target: t });
        B.after(.32, () => {
          if (!u.alive || !t.alive) return;
          B.anim(u, 'attack', .42, 'conniePrankStrike');
          Sound.play('dash', { vol: u.twisted ? .52 : .4 });
          B.blink(u, t.x + u.face * 60, t.depth);
        });
        B.after(.48, () => {
          if (!u.alive || !t.alive) return;
          Sound.play('hit_magic', { vol: u.twisted ? .5 : .38 }); B.hitstop(60); B.shake(7, .25);
          B.fxConnieSkill('prank', u, { phase: 'impact', target: t });
          B.damage(u, t, u.st.mag * S.ratio, { type: 'magic', tag: 'Phantom Prank' });
          B.applyStatus(u, t, 'haunted', P.dur);
        });
      },
      passive: (u, B) => {
        B.on(u, 'dealDamage', ev => { if (ev.target.hasStatus('haunted')) ev.amount *= 1.35; });
      }
    },
    B: {
      name: 'Spectral Drift', type: 'Self Buff', cd: 12,
      v: { eva: .35 }, p: { dur: 7 },
      desc: (S, P) => `For ${P.dur}s Connie phases through attacks, gaining <em>${pcn(S.eva * 100)}</em> Evasion and Move Speed. Every dodge restores Energy and pulls Haunting Escape closer.`,
      ai: { prio: 54, cond: (u) => u.hpPct < .95 },
      cast: (u, B, S, P) => {
        B.anim(u, 'cast', .52, 'connieDrift');
        Sound.play('dash', { vol: u.twisted ? .45 : .34 });
        B.fxConnieSkill('drift', u, { phase: 'cast', dur: P.dur });
        u.flat.evaP2 = S.eva; u.dirty = true;
        B.applyStatus(u, u, 'speedup', P.dur, { stacks: 2 });
        B.after(P.dur, () => {
          u.flat.evaP2 = 0; u.dirty = true;
          B.fxConnieSkill('drift', u, { phase: 'end' });
        });
      },
      passive: (u, B) => {
        B.on(u, 'dodged', () => {
          B.energy(u, 10); u.cds.W = Math.max(0, (u.cds.W || 0) - 1.1);
          B.fxConnieSkill('dodge', u);
        });
      }
    },
    P: {
      name: 'Ghostly Presence', type: 'Control',
      v: {}, p: { drain: 6, fear: 3 },
      desc: (S, P) => `Enemies begin combat with reduced Accuracy and slower Energy gain. Anything that misses Connie becomes 😱 Afraid for ${P.fear}s, dealing less damage.`,
      passive: (u, B, S, P) => {
        B.after(.3, () => {
          const foes = B.enemiesOf(u);
          foes.forEach(e => {
            B.applyStatus(u, e, 'dizzy', 999); B.applyStatus(u, e, 'drain', P.drain);
          });
          B.fxConnieSkill('presence', u, { targets: foes });
        });
        B.on(u, 'dodged', ev => {
          if (ev.src) {
            B.applyStatus(u, ev.src, 'weaken', P.fear, { stacks: 2 });
            B.fxConnieSkill('fear', u, { target: ev.src, dur: P.fear });
          }
        });
      }
    },
    R: {
      name: 'Beyond the Veil', type: 'Magic Damage / Support',
      v: { eva: .18 }, p: { veil: 2.2 },
      desc: (S, P) => `Every skill Connie casts drops her into the Veil for ${P.veil}s: untargetable, while allies gain <em>${pcn(S.eva * 100)}</em> Evasion. Each attack she avoids leaves a Phantom Copy that soaks one hit meant for the team.`,
      passive: (u, B, S, P) => {
        B.on(u, 'cast', () => {
          B.applyStatus(u, u, 'untargetable', P.veil);
          B.alliesOf(u).forEach(a => { a.flat.evaP3 = S.eva; a.dirty = true; });
          B.fxConnieSkill('veil', u, { allies: B.alliesOf(u), dur: P.veil });
          B.after(P.veil, () => B.alliesOf(u).forEach(a => { a.flat.evaP3 = 0; a.dirty = true; }));
        });
        B.on(u, 'dodged', () => {
          if (B.minionsOf(u).length >= 2) return;
          B.fxConnieSkill('phantom', u, { twisted: u.twisted });
          B.summon(u, {
            name: u.twisted ? 'Twisted Phantom' : 'Phantom', art: Art.unit('Connie', u.twisted), hp: 1, scale: .8, life: 8,
            taunt: 240, tint: u.twisted ? '#df4c9e' : '#bfe9ff', offset: rndi(-70, 70), noSkills: true
          });
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
