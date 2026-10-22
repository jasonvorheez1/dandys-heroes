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
    particles: 'sparkle', pcol: '#b9a4ff', trail: { on: true, col: '#7c4dff', rate: .08 }, brake: .1 },
  basic: { name: 'Lullaby Mote', type: 'magic', ratio: 1.08, range: 300, proj: 'orb', pcol: '#b9a4ff',
    sfx: 'whoosh', hit: 'hit_magic', wind: .28, note: 'A drifting mote that slows whatever it settles on.',
    onHit: (u, t, B) => {
      if (chance(.35) || t.hasStatus('drowsy')) {
        B.applyStatus(u, t, 'drowsy', 3.5);
        if (typeof FX !== 'undefined' && FX.astroDrowsy) FX.astroDrowsy(t);
      }
    } },
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
          B.fxAstroSkill('shield', u, a, null, { dur: 3 });
          B.fxFloatItem(a.x, a.y - 88, 'Trinkets/ASTRO_Starpillow');
          B.fxFloatIcon(a.x, a.y - 110, 'DREAM WARD', '#dcd0ff');
        });
      },
      cast: (u, B, S, P) => {
        B.anim(u, 'cast', .55); Sound.play('hero_astro_ability');
        B.after(.4, () => {
          Sound.play('ult'); B.tint('#7a6bff', .35, .45); B.shake(7, .4);
          B.fxAstroSkill('pulse', u, null, B.alliesOf(u), { isAlly: true });
          B.fxAstroSkill('pulse', u, null, B.enemiesOf(u), { isAlly: false });
          B.alliesOf(u).forEach(a => {
            B.energy(a, P.en); B.heal(u, a, u.st.mag * S.heal, { tag: 'dream' }); B.cleanse(a, 3);
            B.fxSparkle(a.x, a.y - 40, 14, '#dcd0ff');
            B.fxFloatItem(a.x, a.y - 88, 'Trinkets/ASTRO_Starpillow');
            B.fxFloatIcon(a.x, a.y - 110, 'RESTORED', '#b9a4ff');
          });
          B.enemiesOf(u).forEach(e => {
            B.damage(u, e, u.st.mag * S.ratio, { type: 'magic', tag: 'Dream Pulse' });
            B.applyStatus(u, e, 'drowsy', P.drowsy);
            if (typeof FX !== 'undefined' && FX.astroDrowsy) FX.astroDrowsy(e);
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
          B.fxAstroSkill('slumber', u, t);
          B.dispel(t, 3);
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
            const w = B.lowestHp(B.alliesOf(u));
            if (w) {
              B.heal(u, w, u.st.mag * S.heal, { silent: true, tag: 'Falling Stars Heal' });
              B.fxSparkle(w.x, w.y - 45, 4, '#dcd0ff');
              B.fxAstroSkill('rested', u, w);
            }
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
          B.fxFloatItem(a.x, a.y - 82, 'Trinkets/ASTRO_Starpillow');
          B.fxFloatIcon(a.x, a.y - 104, 'WELL RESTED', '#dcd0ff');
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
        B.enemiesOf(u).forEach(e => {
          B.applyStatus(u, e, 'drowsy', P.dur);
          if (typeof FX !== 'undefined' && FX.astroDrowsy) FX.astroDrowsy(e);
        });
        B.alliesOf(u).forEach(a => B.applyStatus(u, a, 'regen', P.dur, { val: u.st.mag * .14 }));
        B.on(u, 'cast', () => {
          const w = B.lowestHp(B.alliesOf(u)); if (!w) return;
          B.shield(u, w, u.st.mag * S.shield, 6); B.applyStatus(u, w, 'ccimmune', 3.5);
          B.fxAstroSkill('shield', u, w, null, { dur: 6 });
        });
        B.on(u, 'allyLethal', ev => {
          if (ev.unit._nightSave) return; ev.unit._nightSave = 1;
          ev.prevented = true; ev.unit.hp = ev.unit.max.hp * P.revive;
          B.energy(ev.unit, 55); B.applyStatus(u, ev.unit, 'untargetable', 1.8);
          Sound.play('cleanse');
          B.fxAstroSkill('save', u, ev.unit);
          B.log('<b>Endless Night</b> catches ' + ev.unit.name + '.');
        });
      }
    }
  }
});

/* ============================================================ SCRAPS
   Craft-circle physical DPS / ally grapple - SS Tier */
const SCRAPS_CRAFTS = {
  cardboard: { name: 'Cardboard Claws', icon: '📦', prop: { kind: 'obj', img: 'cardboard' } },
  cup: { name: 'Cup Flail', icon: '🥤', prop: { kind: 'item', img: 'Stein' } },
  yarn: { name: 'Yarn Ball', icon: '🧶' }
};
const SCRAPS_CRAFT_ORDER = ['cardboard', 'cup', 'yarn'];

function scrapsShowProp(u, B, def, at) {
  const x = at ? at.x : u.x, y = at ? at.y : u.y;
  if (def.prop && def.prop.kind === 'obj') B.fxFloatObject(x, y - 82, def.prop.img, '#ffd166');
  else if (def.prop && def.prop.kind === 'item') B.fxFloatItem(x, y - 82, def.prop.img);
  else B.fxFloatIcon(x, y - 82, def.icon, '#ffd166');
}
function scrapsNearby(u, B, radius, center) {
  return B.enemiesOf(u).filter(e => B.distance(e, center || u) <= radius);
}
function scrapsCastBoost(u, B) {
  return B.t < (u.scrapsBurstUntil || 0) ? 1 + (u.scrapsBurstBonus || 0) : 1;
}
function scrapsFray(u, t, B, duration, stacks) {
  B.applyStatus(u, t, 'frayed', duration, { stacks: stacks || 1 });
  B.fxFloatIcon(t.x, t.y - 92, '🧵', '#ffd166');
}
function scrapsSetCraft(u, B) {
  u.scrapsCraftIndex = ((u.scrapsCraftIndex || 0) + 1) % SCRAPS_CRAFT_ORDER.length;
  u.scrapsCraft = SCRAPS_CRAFT_ORDER[u.scrapsCraftIndex];
  scrapsShowProp(u, B, SCRAPS_CRAFTS[u.scrapsCraft]);
  B.fxConfetti(u.x, u.y - 52, 9);
  B.fxScrapsCraftSwap(u, u.scrapsCraft);
  B.log(`<b>${u.name}</b> makes ${SCRAPS_CRAFTS[u.scrapsCraft].name}.`);
}

defHero({
  id: 'Scraps', name: 'Scraps', folder: 'scraps', file: 'scraps', icon: 'Scraps',
  role: 'Damage', tier: 'SS', element: 'Craft',
  blurb: 'An unstoppable, relentless paper-craft predator who grapples aggressively into the heart of battle, dragging an expanding Craft Circle that shreds armor, snags foes with razor ribbon, and detonates cascading paper shards.',
  base: { hp: 3820, atk: 485, def: 235, mag: 118, mdef: 215, spd: 132, acc: 220, eva: 125 },
  hidden: { range: 215, aspd: 1.25, ms: 78, aggro: .85, crit: .18, critDmg: 1.75, healPow: 1, shieldPow: 1, cdr: .12, ccRes: .35, kbRes: .45, armorPen: .20, magPen: 0 },
  growth: { hp: .088, atk: .118, def: .075, mag: .04, mdef: .072 },
  move: { gait: 'skitter', bob: 6, freq: 2.9, lean: 12, squash: .09, idle: 'jitter', step: 'step_soft',
    particles: 'confetti', pcol: '#ffd166', trail: { on: true, col: '#ffd166', rate: .11 }, brake: .22, wobble: 9 },
  basic: {
    name: 'Relentless Paper Claws', type: 'physical', ratio: 1.15, range: 215, sfx: 'swing_claw', hit: 'hit_slash',
    wind: .14, reach: true, note: 'Every third hit uses her equipped craft with savage force. Hitting Frayed foes builds Relentless Frenzy (+Attack Speed, +Move Speed; double-strikes at max stacks).',
    onHit: (u, t, B) => {
      B.fxSlash(u, t, { col: '#fff1c2', ang: -28, small: true });
      if (t && t.alive && t.hasStatus('frayed')) {
        u._scrapsFrenzy = Math.min((u._scrapsFrenzy || 0) + 1, 6);
        u.flat.aspdP = (u._scrapsFrenzy * 0.06);
        u.flat.msP = (u._scrapsFrenzy * 0.04);
        u.flat.atkP = (u.flat.atkP || 0) + 0.02;
        u.dirty = true;
        if (u._scrapsFrenzy >= 6) {
          B.after(0.06, () => {
            if (t.alive && u.alive) {
              B.fxSlash(u, t, { col: '#ff9fbb', ang: 35, small: true });
              B.damage(u, t, u.st.atk * 0.55, { type: 'physical', tag: 'Relentless Scissor Flurry' });
            }
          });
        }
      }
    }
  },
  skills: {
    W: {
      name: 'Crafty Grapple', type: 'Physical Damage', energy: 100,
      v: { slam: 1.45, claw: 0.85, craft: 0.65 }, p: { radius: 215, safety: .55, fray: 6, every: 3 }, fixedP: ['every'],
      desc: (S, P) => `<span class="sk-pas">Every ${P.every} Basic Attacks, Scraps strikes with her equipped craft: Cardboard pierces with heavy Armor Penetration and Frays, Cup flails surrounding foes while cracking shields, and Yarn deals damage, Frays, and heavily slows. Scraps' attacks cannot be Dodged by Frayed enemies.</span> Active: pulls herself toward an ally or into the fray with a high-velocity, invulnerable grapple. On landing, she slams her Craft Circle down for <em>${pcn(S.slam * 100)}</em> Attack, pulls enemies inward, and adds Frayed, then executes a rapid 3-hit scissor claw flurry for <em>${pcn(S.claw * 100)}</em> Attack. If any enemy dies within 3s, Scraps refunds 45 Energy and resets Whatever Works!`,
      passive: (u, B, S, P) => {
        u.scrapsCraftIndex = 0; u.scrapsCraft = 'cardboard'; u.scrapsBasicHits = 0;
        u.scrapsRadius = 215;
        u.antiDodge = t => !!(t && t.hasStatus('frayed'));
        B.on(u, 'basicHit', ev => {
          const t = ev.target; if (!t || !t.alive || ++u.scrapsBasicHits % P.every) return;
          scrapsShowProp(u, B, SCRAPS_CRAFTS[u.scrapsCraft], t);
          B.fxScrapsCraftSwap(t, u.scrapsCraft);
          const mult = scrapsCastBoost(u, B);
          if (u.scrapsCraft === 'cardboard') {
            B.fxSlash(u, t, { col: '#d7b27a', ang: 30, big: true });
            B.damage(u, t, u.st.atk * S.craft * 1.35 * mult, { type: 'physical', armorPen: .40, tag: 'Cardboard Claws' });
            if (t.alive) scrapsFray(u, t, B, P.fray, 2);
          } else if (u.scrapsCraft === 'cup') {
            B.enemiesOf(u).filter(e => B.distance(e, t) <= 145).forEach(e => {
              B.damage(u, e, u.st.atk * S.craft * mult * (e === t ? 1.15 : .85), { type: 'physical', area: true, tag: 'Cup Flail' });
              if (e.shield) B.crackShield(e, e.shield * 0.35);
            });
          } else {
            B.damage(u, t, u.st.atk * S.craft * mult, { type: 'physical', tag: 'Yarn Ball' });
            if (t.alive) { scrapsFray(u, t, B, P.fray, 1); B.applyStatus(u, t, 'slow', 3.5); }
          }
        });
      },
      cast: (u, B, S, P) => {
        const allies = B.alliesOf(u).filter(a => a !== u && a.alive && !a.minion);
        const lowAlly = B.lowestHp(allies);
        const anchor = lowAlly || u;
        const land = () => {
          if (!u.alive) return;
          B.fxScrapsCircle(u, P.radius, u.scrapsCraft, true);
          B.fxRing(u.x, u.y - 40, P.radius * 2, '#ffd166', .55);
          B.fxConfetti(u.x, u.y - 50, 24); Sound.play('hit_heavy', { vol: .55 });
          const targets = scrapsNearby(u, B, P.radius);
          targets.forEach(e => {
            B.damage(u, e, u.st.atk * S.slam * scrapsCastBoost(u, B), { type: 'physical', area: true, tag: 'Crafty Grapple' });
            if (e.alive) {
              scrapsFray(u, e, B, P.fray, 2);
              e.x = lerp(e.x, u.x, 0.25);
            }
          });
          [0.08, 0.16, 0.24].forEach((delay, idx) => {
            B.after(delay, () => {
              if (!u.alive) return;
              const curTargets = scrapsNearby(u, B, P.radius);
              curTargets.forEach(e => {
                if (!e.alive) return;
                B.fxSlash(u, e, { col: idx % 2 ? '#fff1c2' : '#ff9fbb', ang: idx * 25 - 25, small: true });
                B.damage(u, e, u.st.atk * (S.claw / 3) * scrapsCastBoost(u, B), { type: 'physical', area: true, tag: 'Crafty Grapple Claws' });
              });
            });
          });
          const onVictimDown = () => {
            if (!u.alive) return;
            B.energy(u, 45);
            if (u.cds) u.cds.G = 0;
            B.fxFloatIcon(u.x, u.y - 105, '✂️ RELENTLESS RESET!', '#ffd166');
            cleanup();
          };
          const cleanup = B.on(u, 'enemyDown', onVictimDown);
          B.after(3.0, cleanup);
        };
        B.anim(u, 'cast', .42); scrapsShowProp(u, B, SCRAPS_CRAFTS[u.scrapsCraft]);
        if (anchor === u || u.immovable || u.flags.noDash) { land(); return; }
        u.face = anchor.x >= u.x ? 1 : -1;
        B.fxTargetLine(u, anchor, '#ffd166'); Sound.play('grapple', { vol: .55 });
        u.invuln = Math.max(u.invuln || 0, B.t + P.safety);
        B.applyStatus(u, u, 'untargetable', P.safety);
        B.dash(u, anchor.x + (u.face === 1 ? -34 : 34), .36, { depth: anchor.depth, arc: true, onEnd: land });
      }
    },
    G: {
      name: 'Whatever Works', type: 'Physical Damage', cd: 6.5,
      v: { cardboard: 1.75, cup: 1.25, yarn: 1.35 }, p: { radius: 245, fray: 6, slow: 4.0 },
      desc: (S, P) => `Instantly cycles to the next craft (Cardboard Claws -> Cup Flail -> Yarn Ball) and grants Craft Adrenaline (+30% Attack Speed, +25% Move Speed for 4s). Cardboard Claws pierce ignoring 50% Armor with bonus damage against Frayed foes; the Cup Flail sweeps a wide arc dragging enemies inward and concussing them; the Yarn Ball deals heavy damage, Frays, and roots enemies.`,
      ai: { prio: 62, cond: (u, B) => B.enemiesOf(u).length > 0 },
      cast: (u, B, S, P) => {
        scrapsSetCraft(u, B); B.anim(u, 'cast', .38);
        B.applyStatus(u, u, 'speedup', 4.0);
        u.flat.aspdP = (u.flat.aspdP || 0) + 0.30;
        u.dirty = true;
        B.after(4.0, () => { if (u.alive) { u.flat.aspdP = Math.max(0, (u.flat.aspdP || 0) - 0.30); u.dirty = true; } });
        B.fxScrapsCircle(u, u.scrapsRadius || P.radius, u.scrapsCraft, !!u.scrapsRedDuration);
        if (u.scrapsRedDuration) u.scrapsBurstUntil = B.t + u.scrapsRedDuration;
        const nearby = scrapsNearby(u, B, P.radius);
        const targets = nearby.length ? nearby : [B.nearest(u, B.enemiesOf(u))].filter(Boolean);
        const mult = scrapsCastBoost(u, B);
        if (u.scrapsCraft === 'cardboard') {
          const t = B.lowestHp(targets); if (!t) return;
          B.fxSlash(u, t, { col: '#d7b27a', ang: -36, big: true }); Sound.play('hit_slash', { vol: .55 });
          B.damage(u, t, u.st.atk * S.cardboard * mult * (t.hasStatus('frayed') ? 1.4 : 1), { type: 'physical', armorPen: .50, tag: 'Cardboard Claws' });
          if (t.alive) scrapsFray(u, t, B, P.fray, 2);
        } else if (u.scrapsCraft === 'cup') {
          Sound.play('hit_blunt', { vol: .55 }); B.fxRing(u.x, u.y - 40, P.radius * 2, '#ffa9c4', .45);
          targets.forEach(e => {
            B.damage(u, e, u.st.atk * S.cup * mult, { type: 'physical', area: true, tag: 'Cup Flail' });
            if (e.alive) {
              e.x = lerp(e.x, u.x, 0.20);
              B.applyStatus(u, e, 'stun', 0.75);
            }
          });
        } else {
          Sound.play('cloth', { vol: .45 });
          targets.forEach(e => {
            B.damage(u, e, u.st.atk * S.yarn * mult, { type: 'physical', area: true, tag: 'Yarn Ball' });
            if (e.alive) {
              scrapsFray(u, e, B, P.fray, 1);
              B.applyStatus(u, e, 'root', 2.0);
              B.applyStatus(u, e, 'slow', P.slow);
            }
          });
        }
      }
    },
    B: {
      name: 'Craft Class Crash', type: 'Physical Damage', cd: 8.5,
      v: { burst: 1.05, follow: 0.65, frayBonus: 0.18 }, p: { radius: 275, fray: 6 },
      desc: (S, P) => `Scraps spins into a manic hurricane of cut paper, scissors, and flying origami shurikens, striking all nearby enemies 3 times in rapid succession. Each wave deals <em>${pcn(S.burst * 100)}</em> Attack, gains <em>+${pcn(S.frayBonus * 100)}</em> damage per Frayed stack, refreshes Frayed, and shreds 12% enemy Armor. Scraps gains CC immunity and 25% damage reduction during the spin.`,
      ai: { prio: 55, cond: (u, B) => B.enemiesOf(u).length > 0 },
      cast: (u, B, S, P) => {
        B.anim(u, 'cast', .55); B.fxBigStroke(u, '#ffd166');
        B.fxScribble(u.x, u.y - 60); Sound.play('sweep', { vol: .52 });
        B.applyStatus(u, u, 'ccimmune', 1.0);
        const radius = Math.max(P.radius, u.scrapsRadius || 0);
        B.fxScrapsCircle(u, radius, u.scrapsCraft, true);
        [0, 0.16, 0.32].forEach((delay, wave) => {
          B.after(delay, () => {
            if (!u.alive) return;
            B.fxRing(u.x, u.y - 40, radius * 2, wave === 0 ? '#ffd166' : wave === 1 ? '#ff99bd' : '#ce78b4', .4);
            scrapsNearby(u, B, radius).forEach(e => {
              const stacks = e.statuses.find(s => s.id === 'frayed')?.stacks || 0;
              const ratio = (wave === 0 ? S.burst : S.follow) * (1 + S.frayBonus * stacks) * scrapsCastBoost(u, B);
              B.damage(u, e, u.st.atk * ratio, { type: 'physical', area: true, tag: 'Craft Class Crash' });
              if (e.alive) {
                scrapsFray(u, e, B, P.fray, 1);
                B.applyStatus(u, e, 'defdown', 3.0);
              }
            });
          });
        });
      }
    },
    P: {
      name: 'Craft Circle', type: 'Physical Damage / Attack Speed',
      v: { tick: .32, allySpeed: .14, atk: .06 }, p: { radius: 215, max: 5, fray: 3.5 },
      desc: (S, P) => `The Craft Circle around Scraps is an active shredder zone. Every second, enemies inside take <em>${pcn(S.tick * 100)}</em> Attack and become Frayed; nearby allies gain <em>${pcn(S.allySpeed * 100)}</em> Attack Speed. Cardboard lowers enemy Defense, the cup increases circle damage by 50% and pulls foes inward, and yarn heavily slows. Scraps gains <em>${pcn(S.atk * 100)}</em> Attack for each nearby enemy, up to ${P.max} (+${(S.atk * P.max * 100).toFixed(0)}% Attack). The circle follows her grapple.`,
      passive: (u, B, S, P) => {
        u.scrapsBaseRadius = P.radius; u.scrapsRadius = P.radius;
        B.every(u, 1, () => {
          const radius = u.scrapsRadius || P.radius;
          const foes = scrapsNearby(u, B, radius);
          B.fxScrapsCircle(u, radius, u.scrapsCraft, B.t < (u.scrapsBurstUntil || 0));
          const boost = Math.min(P.max, foes.length) * S.atk;
          if (u.flat.atkPScraps !== boost) { u.flat.atkPScraps = boost; u.dirty = true; }
          B.alliesOf(u).filter(a => B.distance(a, u) <= radius).forEach(a =>
            B.applyStatus(u, a, 'scraps_craftbeat', 1.35, { val: S.allySpeed }));
          foes.forEach(e => {
            const modeDamage = u.scrapsCraft === 'cup' ? 1.5 : 1;
            B.damage(u, e, u.st.atk * S.tick * modeDamage * scrapsCastBoost(u, B), { type: 'physical', area: true, tag: 'Craft Circle' });
            if (!e.alive) return;
            scrapsFray(u, e, B, P.fray, 1);
            if (u.scrapsCraft === 'cardboard') B.applyStatus(u, e, 'defdown', 1.5);
            if (u.scrapsCraft === 'cup') e.x = lerp(e.x, u.x, 0.15);
            if (u.scrapsCraft === 'yarn') B.applyStatus(u, e, 'slow', 2.0);
          });
        });
      }
    },
    R: {
      name: 'Every Piece Counts', type: 'Physical Damage / Craft Circle',
      v: { burst: .30, finish: 1.10 }, p: { grow: 16, maxGrow: 96, duration: 4.0, radius: 180 },
      desc: (S, P) => `Each skill cast permanently expands Craft Circle by ${P.grow}, up to ${P.maxGrow}. For ${P.duration}s afterward, Scraps enters Paper Frenzy: her craft hits and circle damage rise by <em>${pcn(S.burst * 100)}</em>. Whenever an enemy inside the circle is defeated, they burst into razor paper shards, dealing <em>${pcn(S.finish * 100)}</em> Attack to all nearby foes and spreading Frayed. Slain foes refund 25 Energy and extend Paper Frenzy by 2.5s.`,
      passive: (u, B, S, P) => {
        u.scrapsBurstBonus = S.burst;
        u.scrapsRedDuration = P.duration;
        B.on(u, 'cast', () => {
          const base = u.scrapsBaseRadius || 215;
          u.scrapsRadius = Math.min(base + P.maxGrow, (u.scrapsRadius || base) + P.grow);
          u.scrapsBurstUntil = B.t + P.duration;
          B.fxAura(u, '#ffd166', .7);
          B.fxScrapsCircle(u, u.scrapsRadius, u.scrapsCraft, true);
        });
        B.on(u, 'enemyDown', e => {
          if (!e || B.distance(e, u) > (u.scrapsRadius || 215)) return;
          B.fxScrapsShards(e, P.radius);
          B.fxConfetti(e.x, e.y - 45, 18);
          B.energy(u, 25);
          u.scrapsBurstUntil = Math.max(u.scrapsBurstUntil || 0, B.t) + 2.5;
          B.enemiesOf(u).filter(other => other !== e && B.distance(other, e) <= P.radius).forEach(other => {
            B.damage(u, other, u.st.atk * S.finish, { type: 'physical', area: true, tag: 'Paper Shards' });
            if (other.alive) scrapsFray(u, other, B, 5, 1);
          });
        });
      }
    }
  }
});

/* ============================================================ VEE
   Tank / Support / Battlefield Director - SS Tier */
defHero({
  id: 'Vee', name: 'Vee', folder: 'Vee', file: 'Vee', icon: 'Vee',
  role: 'Tank', tier: 'SS', element: 'Broadcast',
  blurb: 'Gardenview\'s prime-time host. Analytical, commanding, and in complete control of the studio floor, she does not merely tank—she directs the entire battlefield.',
  base: { hp: 5850, atk: 260, def: 385, mag: 380, mdef: 390, spd: 120, acc: 220, eva: 110 },
  hidden: { range: 240, aspd: 1.05, ms: 75, aggro: 1.8, crit: .10, critDmg: 1.6, healPow: 1.30, shieldPow: 1.40, cdr: .15, ccRes: .35, kbRes: .75, armorPen: 0, magPen: .12 },
  growth: { hp: .120, atk: .080, def: .115, mag: .105, mdef: .115 },
  move: { gait: 'glide', bob: 3, freq: 1.6, lean: 4, squash: .03, idle: 'scan', step: 'step_metal',
    particles: 'static', pcol: '#7be0ff', trail: { on: true, col: '#7be0ff', rate: .14 }, brake: .2 },
  basic: {
    name: 'Broadcast Strike & Signal Pulse', type: 'magic', ratio: 1.25, range: 240, sfx: 'swing_pole', hit: 'hit_blunt',
    wind: .16, note: 'Sharp executive wand strikes channeling static electricity. Alternates with a piercing static interference wave that slows enemy attack speed.',
    onHit: (u, t, B) => {
      if (t.hasStatus('headline')) {
        B.energy(u, 10);
        if (t.energy) t.energy = Math.max(0, t.energy - 8);
      }
      u._veeBasicHits = (u._veeBasicHits || 0) + 1;
      if (u._veeBasicHits % 3 === 0) {
        Sound.play('hit_shock', { vol: 0.45, throttle: 120 });
        B.fxSparkle(t.x, t.y - 40, 12, '#7be0ff');
        B.enemiesOf(u).forEach(e => {
          if (B.distance(t, e) <= 180) {
            B.damage(u, e, u.st.mag * 0.55, { type: 'magic', tag: 'Signal Pulse' });
            B.applyStatus(u, e, 'slow', 3.0, { stacks: 2 });
          }
        });
      }
      if (u._live) {
        Sound.play('beam_fire', { vol: 0.5, throttle: 150 });
        B.enemiesOf(u).forEach(e => {
          if (Math.abs(e.y - u.y) < 70) {
            B.damage(u, e, u.st.mag * 0.50, { type: 'magic', tag: 'Live Broadcast Beam' });
            B.fxSparkle(e.x, e.y - 40, 6, '#ff3366');
          }
        });
      }
    }
  },
  skills: {
    W: {
      name: 'Spotlight On', type: 'Magic Damage', energy: 100,
      v: { ratio: 2.45, heal: .20, shield: .25 },
      p: { blind: 6.0, stun: 2.0, drain: .50, acc: .35, crit: .25, dmgBoost: .30, energy: 10, primeDur: 8.0 },
      desc: (S, P) => `<span class="sk-pas">Vee broadcasts telemetry data across allied ranks, identifying the highest-damage enemy as the 📺 Headline every 2.5s. Allies gain <em>+${pcn(P.acc * 100)}</em> Accuracy, <em>+${pcn(P.crit * 100)}</em> Critical Chance, and deal <em>+${pcn(P.dmgBoost * 100)}</em> damage against it. Whenever the Headline acts or casts, allies gain <em>${Math.round(P.energy)}</em> Energy. When it falls, the team heals <em>${pcn(S.heal * 100)}</em> Max HP and dispels all debuffs.</span>
        Active: blinding studio spotlights flood the field for <em>${pcn(S.ratio * 100)}</em> Magic Damage. The Headline is Interrupted, Stunned for ${P.stun}s, 🌑 Blinded for ${P.blind}s, and drained of <em>${pcn(P.drain * 100)}</em> Energy. All allies gain 🌟 <b>Prime Time</b> (+35% Attack Speed, +30% Skill Haste, +30% Headline Damage for ${P.primeDur}s) and a crystalline Broadcast Shield for <em>${pcn(S.shield * 100)}</em> of Vee's Max HP.`,
      passive: (u, B, S, P) => {
        B.every(u, 2.5, () => {
          const foes = B.enemiesOf(u); if (!foes.length) return;
          const top = foes.reduce((a, b) => (b.dmgDone || 0) > (a.dmgDone || 0) ? b : a);
          if (top.hasStatus('headline')) return;
          foes.forEach(f => B.removeStatus(f, 'headline'));
          B.applyStatus(u, top, 'headline', 999); Sound.play('lock', { vol: .55 });
          B.fxFloatIcon(top.x, top.y - 100, '📺 HEADLINE', '#7be0ff');
        });
        B.teamAura(u, m => {
          m.accP += P.acc;
          m.crit += P.crit;
        });
        B.on(u, 'allyDamageDealt', ev => {
          if (ev.tag === 'Executive Director') return;
          if (ev.target && ev.target.hasStatus('headline')) {
            ev.amount += ev.amount * P.dmgBoost;
          }
        });
        B.on(u, 'enemyAction', e => {
          if (e && e.hasStatus('headline')) B.alliesOf(u).forEach(a => B.energy(a, P.energy));
        });
        B.on(u, 'enemyCast', e => {
          if (e && e.hasStatus('headline')) B.alliesOf(u).forEach(a => B.energy(a, P.energy));
        });
        B.on(u, 'enemyDown', e => {
          if (!e || !e.hasStatus('headline')) return;
          Sound.play('cheer', { vol: 0.6 });
          B.alliesOf(u).forEach(a => {
            B.heal(u, a, u.max.hp * S.heal, { tag: 'ratings' });
            B.cleanse(a, 99);
            B.fxSparkle(a.x, a.y - 40, 10, '#7be0ff');
          });
          const foes = B.enemiesOf(u).filter(f => f.alive && f !== e);
          if (foes.length) {
            const next = foes.reduce((a, b) => (b.dmgDone || 0) > (a.dmgDone || 0) ? b : a);
            B.applyStatus(u, next, 'headline', 999);
            B.fxFloatIcon(next.x, next.y - 100, '📺 HEADLINE', '#7be0ff');
          }
        });
      },
      cast: (u, B, S, P) => {
        B.anim(u, 'cast', .75, 'veeSpotlight'); Sound.play('flash'); Sound.play('ult');
        const foes = B.enemiesOf(u), headline = foes.find(e => e.hasStatus('headline'));
        B.fxVeeSpotlight(u, foes, headline);
        B.after(.3, () => {
          B.flash('#eaf7ff', .28, .6); B.shake(8, .35);
          B.enemiesOf(u).forEach(e => {
            B.damage(u, e, u.st.mag * S.ratio, { type: 'magic', tag: 'Spotlight On' });
            if (e.hasStatus('headline')) {
              B.interrupt(e);
              B.applyStatus(u, e, 'stun', P.stun);
              B.applyStatus(u, e, 'blind', P.blind);
              e.energy = Math.max(0, (e.energy || 0) * (1 - P.drain));
            }
          });
          B.alliesOf(u).forEach(a => {
            B.applyStatus(u, a, 'haste', P.primeDur, { stacks: 2 });
            B.shield(u, a, u.max.hp * S.shield, P.primeDur);
            B.fxSparkle(a.x, a.y - 45, 12, '#ffe066');
            B.fxFloatIcon(a.x, a.y - 95, '🌟 PRIME TIME', '#ffe066');
          });
        });
      }
    },
    G: {
      name: 'Audience Support', type: 'Healing / Shield', cd: 10,
      v: { heal: .22, fortifyDef: .35 }, p: { dur: 5.0, overchargeDur: 5.0 },
      desc: (S, P) => `Thunderous applause fills the arena! Cleanses up to 2 debuffs from all allies. The entire team recovers HP over ${P.dur}s (scaling with <em>${pcn(S.heal * 100)}</em> of Vee's Max HP and Magic) while gaining Studio Fortification (+35% Defense & Magic Defense). Overhealing becomes a 🛡️ Broadcast Shield; allies with active shields gain ⚡ <b>Overcharge</b> (+35% Energy Generation, +20% Cooldown Reduction).`,
      ai: { prio: 65, cond: (u, B) => B.alliesOf(u).some(a => a.hpPct < .88 || (a.debuffs && a.debuffs.length)) },
      cast: (u, B, S, P) => {
        B.anim(u, 'cast', .74, 'veeAudience'); Sound.play('cheer', { vol: .75 }); Sound.play('cleanse', { vol: .4 });
        const allies = B.alliesOf(u);
        B.fxVeeAudience(u, allies);
        allies.forEach(a => {
          B.cleanse(a, 2);
          B.applyStatus(u, a, 'fortify', P.dur, { stacks: 3 });
          if (a.hasStatus('shield')) B.applyStatus(u, a, 'overcharge', P.overchargeDur);
          B.applyStatus(u, a, 'regen', P.dur, { val: (u.max.hp * S.heal + u.st.mag * 0.8) / P.dur, overheal: 'shield' });
          B.fxSparkle(a.x, a.y - 40, 10, '#7be0ff');
        });
      }
    },
    B: {
      name: 'Commercial Break', type: 'Team Buff / Stasis', cd: 13,
      v: { heal: .10 }, p: { dur: 6.0, enRegen: 30, hasteStacks: 2 },
      desc: (S, P) => `Vee cuts to commercial! Time dilates for ${P.dur}s: enemies suffer -50% cooldown recovery, -35% Attack Speed & Move Speed, and complete Energy lock. Allies gain 💨 <b>Super Haste</b> (+35% Move Speed, +30% Skill Haste), regenerate <em>${P.enRegen}</em> Energy, and become immune to Energy drain. Ally skills cast during the break trigger a sponsor spot restoring <em>${pcn(S.heal * 100)}</em> of Vee's Max HP and zapping nearby foes with static shock.`,
      ai: { prio: 50, cond: (u, B) => B.enemiesOf(u).length >= 1 },
      cast: (u, B, S, P) => {
        B.anim(u, 'cast', .78, 'veeCommercial'); Sound.play('ui_open'); B.tint('#1b2a55', .35, .6);
        const enemies = B.enemiesOf(u), allies = B.alliesOf(u);
        B.fxVeeCommercial(u, allies, enemies, P.dur);
        enemies.forEach(e => {
          B.applyStatus(u, e, 'drowsy', P.dur);
          B.applyStatus(u, e, 'slow', P.dur, { stacks: 2 });
          e._energyLockedUntil = B.t + P.dur;
        });
        allies.forEach(a => {
          B.applyStatus(u, a, 'haste', P.dur, { stacks: 3 });
          B.applyStatus(u, a, 'overcharge', P.dur);
          B.energy(a, P.enRegen);
          a._energyDrainImmuneUntil = B.t + P.dur;
        });
        u._breakUntil = B.t + P.dur;
        B.on(u, 'allyCast', a => {
          if (B.t < (u._breakUntil || 0)) {
            B.heal(u, a, u.max.hp * S.heal, { tag: 'Commercial Sponsor' });
            Sound.play('hit_shock', { vol: .35, throttle: 150 });
            B.enemiesOf(u).forEach(foe => {
              if (B.distance(a, foe) <= 240) {
                B.damage(u, foe, u.st.mag * 0.50, { type: 'magic', tag: 'Static Shock' });
                B.fxSparkle(foe.x, foe.y - 40, 8, '#7be0ff');
              }
            });
          }
        });
      }
    },
    P: {
      name: 'Studio Production', type: 'Defense / Redirection',
      v: { def: .045, mdef: .045, dmgRed: .025 }, p: { maxStacks: 12, redirect: .35, absorbP: .50, energy: 12 },
      desc: (S, P) => `Whenever an ally damages the 📺 Headline, or Vee shields/protects an ally, Vee gains 1 stack of 🎬 <b>Production Value</b> (max ${P.maxStacks}). Each stack grants Vee <em>+${(S.def * 100).toFixed(1)}%</em> Defense, <em>+${(S.mdef * 100).toFixed(1)}%</em> Magic Defense, and <em>+${(S.dmgRed * 100).toFixed(1)}%</em> Damage Reduction.
        <b>Executive Redirection</b>: Vee redirects <em>${pcn(P.redirect * 100)}</em> of incoming damage from nearby allies onto herself, absorbing 50% of the redirected amount. Protected allies gain <em>${Math.round(P.energy)}</em> Energy and a reflective Static Barrier. At ${P.maxStacks} stacks, radiates an Executive Director Aura granting allies +20% True Damage against the Headline and Silence/Disable immunity.`,
      passive: (u, B, S, P) => {
        u.prodMax = P.maxStacks;
        const addProd = () => {
          u.prod = Math.min((u.prod || 0) + 1, P.maxStacks);
          u.flat.defPProd = (u.prod || 0) * S.def;
          u.flat.mdefPProd = (u.prod || 0) * S.mdef;
          u.flat.dmgRedP = (u.prod || 0) * S.dmgRed;
          u.dirty = true;
        };

        B.on(u, 'allyDamageDealt', ev => {
          if (ev.tag === 'Executive Director') return;
          if (ev.target && ev.target.hasStatus('headline')) addProd();
          if ((u.prod || 0) >= P.maxStacks && ev.target && ev.target.hasStatus('headline')) {
            B.damage(u, ev.target, ev.amount * 0.20, { type: 'true', noDodge: true, tag: 'Executive Director' });
          }
        });
        B.on(u, 'shieldDone', ev => {
          if (ev.target && ev.target !== u) addProd();
        });

        B.on(u, 'allyDamaged', ev => {
          if (ev.unit === u || !u.alive || ev.redirected || ev.dot) return;
          if (B.distance(ev.unit, u) > 320) return;
          const moved = ev.amount * P.redirect;
          ev.amount -= moved;
          B.damage(ev.src, u, moved * P.absorbP, { type: 'true', redirected: true, noDodge: true, tag: 'redirect' });
          if (u.alive) {
            B.energy(ev.unit, P.energy);
            B.shield(u, ev.unit, u.st.mag * 0.35, 3.5);
          }
        });

        B.every(u, 1.0, () => {
          if ((u.prod || 0) >= P.maxStacks) {
            B.alliesOf(u).forEach(a => B.applyStatus(u, a, 'ccimmune', 1.2));
          }
        });
      }
    },
    R: {
      name: 'Season Finale', type: 'Battle Opener / Climax',
      v: { exposeDmg: .25, def: .06, hp: .06, mag: .50 }, p: { needExposure: 5, liveDur: 14, energy: 35, cdr: 3.5, maxFinStacks: 5 },
      desc: (S, P) => `Enemies build Exposure by acting. At ${P.needExposure} stacks they become permanently exposed as a 📺 Headline: -25% damage dealt, no dodging, -50% healing received, and <em>+${pcn(S.exposeDmg * 100)}</em> damage taken. Each Headline defeated triggers a Grand Finale: restores <em>${P.energy}</em> Energy to all allies, refreshes all shields, reduces cooldowns by ${P.cdr}s, and permanently grants Vee <em>+${pcn(S.hp * 100)}</em> Max HP and Defense (stacks up to ${P.maxFinStacks}x).
        🔴 <b>LIVE BROADCAST</b>: Once per wave, if Vee drops below 35% HP or is solo, she goes Live for ${P.liveDur}s: heals 40% Max HP, gains CC immunity, +50% Magic Attack, +40% Attack Speed, +300 Range, piercing laser beam basics, and brands every enemy as a Headline!`,
      passive: (u, B, S, P) => {
        u.antiDodge = target => !!(target && (target.hasStatus('headline') || B.t < (target._veeOnAirUntil || 0)));
        B.on(u, 'waveStart', () => { u._live = false; u._finStacks = 0; });
        B.on(u, 'enemyAction', e => {
          if (!e.alive) return;
          e.exposure = (e.exposure || 0) + 1;
          if (e.exposure >= P.needExposure && !e.hasStatus('headline')) {
            e._veeOnAirUntil = B.t + 999;
            B.applyStatus(u, e, 'headline', 999);
            B.applyStatus(u, e, 'grief', 999);
            B.applyStatus(u, e, 'exposed', 999);
            B.fxFloatIcon(e.x, e.y - 100, '📺 EXPOSED HEADLINE', '#7be0ff');
            Sound.play('gasp', { vol: .55 });
          }
        });
        B.on(u, 'enemyDown', e => {
          if (!e.hasStatus('headline')) return;
          Sound.play('cheer', { vol: 0.65 }); Sound.play('get_rare', { vol: 0.5 });
          B.alliesOf(u).forEach(a => {
            B.energy(a, P.energy);
            B.refreshShields(a);
            B.reduceCd(a, P.cdr);
            B.fxSparkle(a.x, a.y - 45, 10, '#ffd166');
          });
          u._finStacks = Math.min((u._finStacks || 0) + 1, P.maxFinStacks);
          u.flat.hpPFinale = (u._finStacks || 0) * S.hp;
          u.flat.defPFinale = (u._finStacks || 0) * S.def;
          u.dirty = true;
          B.fxFloatIcon(u.x, u.y - 110, `🌟 FINALE x${u._finStacks}`, '#ffd166');
        });
        B.every(u, 0.5, () => {
          if (u._live || !u.alive) return;
          const solo = B.alliesOf(u).filter(a => a !== u && a.alive).length === 0;
          if (u.hpPct <= 0.35 || solo) {
            u._live = true;
            B.log('<b>🔴 LIVE BROADCAST — PRIMETIME FINALE</b>');
            Sound.play('suddendeath'); Sound.play('ult');
            B.flash('#ff3366', .35, .8); B.shake(12, .6);
            if (B.fxVeeLiveBroadcast) B.fxVeeLiveBroadcast(u.x, u.y);
            B.heal(u, u, u.max.hp * 0.40, { tag: 'Live Broadcast' });
            B.applyStatus(u, u, 'ccimmune', P.liveDur);
            B.applyStatus(u, u, 'spotlight', P.liveDur);
            B.applyStatus(u, u, 'haste', P.liveDur, { stacks: 3 });
            u.flat.magP2 = (u.flat.magP2 || 0) + S.mag;
            u.flat.aspdP = (u.flat.aspdP || 0) + 0.40;
            u.rangeBonus = 300;
            u.dirty = true;
            B.enemiesOf(u).forEach(e => {
              B.applyStatus(u, e, 'headline', P.liveDur);
              B.fxFloatIcon(e.x, e.y - 100, '📺 HEADLINE', '#ff3366');
            });
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
   Holiday survivalist and nearby-team support. */
defHero({
  id: 'Bobette', name: 'Bobette', folder: 'Bobette', file: 'Bobette', icon: 'Bobette',
  role: 'Support', roleLabel: 'Holiday Guardian', position: 'Midline', tier: 'A', element: 'Holiday',
  blurb: 'Bobette hides from danger in a gift box while her festive aura keeps nearby friends moving.',
  base: { hp: 4680, atk: 216, def: 294, mag: 278, mdef: 292, spd: 105, acc: 170, eva: 112 },
  hidden: { range: 190, aspd: .92, ms: 76, aggro: .86, crit: .05, critDmg: 1.5, healPow: 1.15, shieldPow: 1.30, cdr: .08, ccRes: .28, kbRes: .55, armorPen: 0, magPen: 0 },
  growth: { hp: .095, atk: .064, def: .085, mag: .086, mdef: .090 },
  move: { gait: 'waddle', bob: 6, freq: 1.3, lean: 4, squash: .07, idle: 'settle', step: 'step_soft',
    particles: 'confetti', pcol: '#e8536b', trail: { on: false }, brake: .7, weight: 1.4 },
  basic: { name: 'Ribbon Swat', type: 'physical', ratio: 1.12, range: 190, sfx: 'swing_light', hit: 'hit_blunt', animStyle: 'bobetteRibbonSwat',
    wind: .24, note: 'A firm swat with a roll of wrapping paper.',
    onHit: (u, t, B) => { if (chance(.25)) B.applyStatus(u, t, 'wrapped', 4); } },
  skills: {
    W: {
      name: 'Precious Packaging', type: 'Invulnerability / Shield', energy: 100,
      v: { shield: .12 }, p: { wrap: 2.8, healPct: .16, shieldDur: 7, kb: 100 },
      fixedP: ['wrap', 'healPct'],
      desc: (S, P) => `Bobette ducks into a gift box for ${P.wrap}s. She cannot move or act, but is Invulnerable. When she opens the box, she recovers ${pcn(P.healPct * 100)} Max HP, knocks back nearby enemies and gives nearby allies a Shield worth up to <em>${pcn(Math.min(.35, S.shield) * 100)}</em> of her Max HP for ${P.shieldDur}s. Twisted Bobette stays boxed for a shorter time.`,
      cast: (u, B, S, P) => {
        // The real ability is invincible but stationary. The shorter combat
        // window preserves that tradeoff without stalling elite encounters.
        const wrapDur = u.twisted ? Math.min(P.wrap, 1.9) : P.wrap;
        B.applyStatus(u, u, 'bobette_box', wrapDur);
        if (!u.hasStatus('bobette_box')) return;
        u.invuln = Math.max(u.invuln || 0, B.t + wrapDur);
        Sound.play('bobette_wrap', { vol: .58 }); B.anim(u, 'cast', .72, 'bobetteWrap'); B.fxBobetteSkill('wrap', u, { dur: wrapDur });
        B.fxRing(u.x, u.y - 30, 130, '#e8536b', .5);
        B.after(wrapDur, () => {
          if (!u.alive) return;
          B.removeStatus(u, 'bobette_box');
          B.anim(u, 'cast', .56, 'bobetteUnwrap'); Sound.play('bobette_present_pop', { vol: .66 }); B.fxBobetteSkill('open', u);
          B.fxConfetti(u.x, u.y - 50, 48);
          B.fxRing(u.x, u.y - 30, 320, '#e8536b', .45);
          B.heal(u, u, u.max.hp * P.healPct, { tag: 'Precious Packaging' });
          B.alliesOf(u).forEach(a => { if (B.distance(a, u) <= 320) B.shield(u, a, u.max.hp * Math.min(u.twisted ? .12 : .35, S.shield), P.shieldDur); });
          B.enemiesOf(u).forEach(e => {
            if (B.distance(e, u) <= 220) B.knockback(u, e, P.kb);
          });
        });
      }
    },
    G: {
      name: 'Festive Aura', type: 'Nearby Support',
      v: { energy: .12 }, p: { radius: 305, linger: 5 }, fixedP: ['radius', 'linger'],
      desc: (S, P) => `Bobette's festive aura gives allies within ${P.radius} range +25% Move Speed and <em>${pcn(Math.min(.5, S.energy) * 100)}</em> more Energy generation, representing her stamina recovery. The boost lingers for ${P.linger}s after they leave. Multiple Bobettes refresh the same boost rather than stacking it.`,
      passive: (u, B, S, P) => {
        const refresh = () => {
          if (!u.alive) return;
          B.alliesOf(u).forEach(a => {
            if (B.distance(a, u) <= P.radius)
              B.applyStatus(u, a, 'festivecheer', P.linger, { val: Math.min(.5, S.energy) });
          });
        };
        refresh();
        B.every(u, .5, refresh);
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
      name: 'Ornament Protection', type: 'Shield / Defense',
      v: { shield: .06 }, p: { guardDur: 7, shieldDur: 6, cooldown: 5 },
      fixedP: ['cooldown'],
      desc: (S, P) => `When a nearby ally takes a substantial hit, Bobette catches it with a Shield worth up to <em>${pcn(Math.min(.2, S.shield) * 100)}</em> of her Max HP and gives them 🔔 Festive Guard for ${P.guardDur}s. Each stack raises Defense and Magic Defense. She can protect each ally once every ${P.cooldown}s.`,
      passive: (u, B, S, P) => {
        const protectedAt = new Map();
        B.on(u, 'allyDamaged', ev => {
          const a = ev.unit;
          if (!u.alive || !a || a === u || !ev.src || ev.src.team === u.team
            || B.distance(a, u) > 320 || ev.amount < a.max.hp * .05
            || B.t < (protectedAt.get(a) || 0)) return;
          protectedAt.set(a, B.t + P.cooldown);
          B.shield(u, a, u.max.hp * Math.min(u.twisted ? .09 : .2, S.shield), P.shieldDur);
          B.applyStatus(u, a, 'festiveguard', P.guardDur, { stacks: 1 });
          B.energy(u, 5);
          B.fxFloatIcon(a.x, a.y - 100, '🔔', '#f5c860');
        });
      }
    },
    R: {
      name: 'The Perfect Present', type: 'Rescue / Shield',
      v: { shield: .08 }, p: { revivePct: .18, wardDur: 3.5, shieldDur: 7 }, fixedP: ['revivePct'],
      desc: (S, P) => `At the start of the fight, Bobette gives 🎁 Holiday Favor to the teammate with the lowest Max HP. It raises their Max HP and resilience. Once per wave, if that teammate would be defeated, the gift opens: they survive with ${pcn(P.revivePct * 100)} Max HP, gain a Shield worth up to <em>${pcn(Math.min(.35, S.shield) * 100)}</em> of Bobette's Max HP, and receive Ward for ${P.wardDur}s.`,
      passive: (u, B, S, P) => {
        const favor = () => {
          if (!u.alive) return;
          u._bobetteFavorOpened = false;
          const t = B.alliesOf(u).filter(a => a !== u).sort((a, b) => a.max.hp - b.max.hp)[0] || u;
          u._favored = t;
          B.applyStatus(u, t, 'bobette_favor', 999);
          B.fxFloatIcon(t.x, t.y - 100, '🎁');
          Sound.play('bobette_wrap', { vol: .42 }); B.fxBobetteSkill('favor', t);
        };
        B.after(.4, favor);
        B.on(u, 'waveStart', () => B.after(.4, favor));
        B.on(u, 'allyLethal', ev => {
          if (!u.alive || u._bobetteFavorOpened || ev.prevented || ev.unit !== u._favored) return;
          u._bobetteFavorOpened = true;
          ev.prevented = true;
          B.removeStatus(ev.unit, 'bobette_favor');
          ev.unit.hp = Math.max(1, ev.unit.max.hp * P.revivePct);
          B.shield(u, ev.unit, u.max.hp * Math.min(S.shield, .35), P.shieldDur);
          B.applyStatus(u, ev.unit, 'ward', P.wardDur);
          B.energy(u, 20);
          Sound.play('bobette_present_pop', { vol: .7 }); B.fxBobetteSkill('open', ev.unit); B.fxConfetti(ev.unit.x, ev.unit.y - 50, 50);
          B.log('<b>The Perfect Present opens.</b>');
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
   The Artisan Holiday Baker & Selfless Guardian Healer - DHBM Standards
   Confectionery craftsmanship: Perfect Decoration mastery, Royal Icing
   barriers, Peppermint Swirl healing hearths, and life-saving Last Bite treats. */
function gingerDecoration(u, B, S, P, unit) {
  if (!unit || !unit.alive || unit === u) return;
  if (u._gingerMasterwork) return;
  u._gingerDecoAt = u._gingerDecoAt || {};
  if (u._gingerDecoAt[unit.uid] === B.t) return;
  u._gingerDecoAt[unit.uid] = B.t;
  const max = P ? P.max || 8 : 8;
  const per = S ? S.per || 0.065 : 0.065;
  const cdrPer = S ? S.cdr || 0.025 : 0.025;
  u.deco = Math.min((u.deco || 0) + 1, max);
  u.flat.healPowP = u.deco * per;
  u.flat.shieldPowP = u.deco * (per * 0.8);
  u.flat.cdrP = u.deco * cdrPer;
  u.flat.energyGen = u.deco * per;
  u.dirty = true;
  if (u.deco >= max && !u._gingerAtMaxDeco) {
    u._gingerAtMaxDeco = true;
    Sound.play('sparkle', { vol: .42 });
    B.fxFloatIcon(u.x, u.y - 105, '✨ MASTERWORK READY!', '#ffd166');
    B.alliesOf(u).forEach(a => {
      B.applyStatus(u, a, 'speedup', 4.0);
    });
  }
}
defHero({
  id: 'Ginger', name: 'Ginger', folder: 'Ginger', file: 'Ginger', icon: 'Ginger',
  role: 'Support', tier: 'SS', element: 'Bake',
  blurb: 'An observant and gentle gingerbread artisan whose delicate piping and selfless baking keep her friends standing when all hope seems lost. With her piping bag, royal icing barriers, and miraculous gingerbread confections, Ginger turns the chaos of battle into a masterwork of care.',
  base: { hp: 4950, atk: 210, def: 285, mag: 420, mdef: 325, spd: 126, acc: 215, eva: 155 },
  hidden: { range: 280, aspd: 1.05, ms: 82, aggro: .55, crit: .08, critDmg: 1.50, healPow: 1.65, shieldPow: 1.55, cdr: .18, ccRes: .30, kbRes: .45, armorPen: 0, magPen: .12 },
  growth: { hp: .102, atk: .068, def: .088, mag: .112, mdef: .096 },
  move: { gait: 'waddle', bob: 9, freq: 1.8, lean: 6, squash: .09, idle: 'breathe', step: 'step_soft',
    particles: 'crumbs', pcol: '#ffb56b', trail: { on: true, col: '#ffe6c2', rate: .10 }, brake: .30 },
  basic: {
    name: 'Icing Flick', type: 'magic', ratio: 1.12, range: 280, proj: 'food', pimg: 'Cherry', animStyle: 'gingerFlick',
    sfx: 'whoosh', hit: 'hit_magic', wind: .20,
    note: 'Flicks delicate, sugar-spun frosting treats that deal Magic Damage. Generates 1 stack of Perfect Decoration. Every 2nd basic attack unleashes Peppermint Glisten, bouncing a restorative peppermint to the lowest-HP ally while applying Messy to the foe.',
    onHit: (u, t, B) => {
      if (!t || !t.alive) return;
      gingerDecoration(u, B, { per: .065, cdr: .025 }, { max: 8 }, u);
      u._gingerBasics = (u._gingerBasics || 0) + 1;
      if (u._gingerBasics % 2 === 0) {
        const ally = B.lowestHp(B.alliesOf(u)) || u;
        if (ally && ally.alive) {
          const healAmt = u.st.mag * 0.55;
          B.heal(u, ally, healAmt, { tag: 'Peppermint Glisten' });
          B.applyStatus(u, ally, 'speedup', 4.0);
          B.energy(ally, 12);
          B.fxProj(u, ally, { kind: 'food', img: 'Trinkets/GINGER_PeppermintIcing', col: '#ff7892' }, () => {
            Sound.play('item_pop', { vol: .35, throttle: 120 });
            B.fxFloatIcon(ally.x, ally.y - 95, '🍬 PEPPERMINT GLISTEN +12⚡', '#ff7892');
            B.fxSparkle(ally.x, ally.y - 40, 8, '#ffd166');
          });
        }
        B.applyStatus(u, t, 'messy', 4.5);
      }
    }
  },
  skills: {
    W: {
      name: 'Baked With Care!', type: 'Healing / Cleanse', energy: 100, cd: 4.0,
      v: { heal: 2.85, shield: .45, dmg: 1.80 }, p: { cost: .10, floor: .15, dur: 8.0 },
      desc: (S, P) => `<span class="sk-pas">Ginger's baking oven never runs dry. Whenever an ally drops below 50% HP, Ginger gains 💭 Concern (+25% Healing Power, +20% Shield Power, max 3 stacks). Caster consumes all Concern to empower this heal by an extra 20% per stack.</span>
        Active: Ginger crafts a magnificent glowing Gingerbread Heart and links her vital warmth to all allies! Restores <em>${pcn(S.heal * 100)}</em> Magic HP to all allies, cleanses <b>ALL</b> crowd control and negative debuffs, and wraps them in a 🛡️ Royal Icing Barrier absorbing <em>${pcn(S.shield * 100)}</em> Max HP + Magic for ${P.dur}s. Critical allies (&lt;30% HP) become 🫂 <b>Encouraged</b> (+35% Attack Speed, +30% Move Speed, +20% Damage Boost, CC Immunity for 8s).
        At maximum Perfect Decoration (8), this ascends to a 🌟 <b>Legendary Masterwork</b>: doubles the shield, unleashes a festive sugar burst dealing <em>${pcn(S.dmg * 100)}</em> Magic Damage and blinding all foes for 3s, and refunds 35 Energy to all allies! (Costs ${pc(P.cost)} HP, floor at ${pc(P.floor)} HP).`,
      ai: { prio: 80, cond: (u, B) => B.alliesOf(u).some(a => a.hpPct < .75 || a.statuses.some(s => STATUS[s.id] && STATUS[s.id].kind === 'debuff')) },
      passive: (u, B) => {
        B.on(u, 'allyLow', a => {
          if (a._concern && B.t - a._concern < 5) return;
          a._concern = B.t;
          B.applyStatus(u, u, 'concern', 25, { stacks: 1, maxStacks: 3 });
          Sound.play('whisper', { vol: .25 });
        });
      },
      cast: (u, B, S, P) => {
        if (u.hpPct < P.floor) return;
        const masterwork = (u.deco || 0) >= (u.decoMax || 8);
        const concernStacks = u.countStatus ? u.countStatus('concern') : (u.hasStatus('concern') ? 1 : 0);
        const concernMul = 1 + concernStacks * 0.20;
        if (masterwork) { u.deco = 0; u._gingerAtMaxDeco = false; u._gingerMasterwork = true; }
        B.anim(u, 'cast', .78, 'gingerHeart');
        Sound.play('heal_soft', { vol: .55 });
        Sound.play('cheer', { vol: .42 });
        Sound.play('ult', { delay: 100 });
        if (B.fxGingerHeartBurst) B.fxGingerHeartBurst(u.x, u.y - 45, masterwork ? 160 : 120);
        else B.fxRing(u.x, u.y - 42, 140, '#ffb56b', .5);

        B.after(.26, () => {
          B.damage(u, u, u.max.hp * P.cost, { type: 'true', selfharm: true, silent: true });
          const allies = B.alliesOf(u).filter(a => a.alive);
          allies.forEach(t => {
            const isCrit = t.hpPct < .35;
            const healVal = u.st.mag * S.heal * concernMul * (masterwork ? 1.35 : 1);
            B.heal(u, t, healVal, { tag: 'Baked With Care!' });
            B.cleanse(t, 99);
            const shieldVal = (u.max.hp * S.shield + u.st.mag * 0.40) * (masterwork ? 2.0 : 1.0);
            B.shield(u, t, shieldVal, P.dur);
            if (B.fxGingerRoyalIcing) B.fxGingerRoyalIcing(t.x, t.y - 40, 95, P.dur);
            if (B.fxHeartLink) B.fxHeartLink(u, t);
            B.fxSparkle(t.x, t.y - 40, masterwork ? 22 : 14, '#ffd166');
            if (isCrit) {
              B.applyStatus(u, t, 'encouraged', 8);
              B.applyStatus(u, t, 'ccimmune', 4);
              B.fxFloatIcon(t.x, t.y - 95, '🫂 ENCOURAGED!', '#ffd166');
            }
          });
          if (masterwork) {
            B.enemiesOf(u).forEach(e => {
              B.damage(u, e, u.st.mag * S.dmg, { type: 'magic', tag: 'Masterwork Festive Burst' });
              B.applyStatus(u, e, 'blind', 3.0);
              B.knockback(u, e, 25);
            });
            allies.forEach(a => B.energy(a, 35));
            B.fxFloatIcon(u.x, u.y - 110, '🌟 MASTERWORK CONFECTION!', '#ffd166');
          }
          B.removeStatus(u, 'concern');
          B.applyStatus(u, u, 'encouraged', 8);
          u._gingerMasterwork = false;
        });
      }
    },
    G: {
      name: 'Decorated Treats', type: 'Buff / Shield', cd: 9.5,
      v: { shield: .85, haste: .25 }, p: { dur: 8.5 },
      desc: (S, P) => `Ginger expertly pipes royal icing cookies for everyone! All allies gain 🍬 <b>Sweet Support</b> for ${P.dur}s (+25% Attack Speed, +20% Cooldown Reduction, and +35% Healing Received) and <b>Freshly Baked</b> (clears up to 2 debuffs, +35% Crowd Control Resistance, and +20% Armor/Magic Defense).
        The 2 lowest-HP allies (or every ally if Ginger has 4+ Perfect Decoration stacks) receive a crystalline 🛡️ <b>Royal Icing Shield</b> equal to <em>${pcn(S.shield * 100)}</em> Magic. While shielded, 25% of all damage absorbed crumbles into healing crumbs, restoring health to the recipient!`,
      ai: { prio: 65, cond: (u, B) => B.alliesOf(u).some(a => !a.hasStatus('sweetsupport') || a.hpPct < .90) },
      cast: (u, B, S, P) => {
        const masterwork = (u.deco || 0) >= 4;
        B.anim(u, 'cast', .68, 'gingerCleansingTreats');
        Sound.play('get_food'); Sound.play('cleanse', { vol: .38 }); Sound.play('cheer', { vol: .28 });
        if (B.fxGingerRoyalIcing) B.fxGingerRoyalIcing(u.x, u.y - 42, 125, P.dur);
        else B.fxRing(u.x, u.y - 42, 125, '#fff1c7', .45);

        B.alliesOf(u).forEach(a => {
          B.applyStatus(u, a, 'sweetsupport', P.dur);
          B.cleanse(a, 2);
          B.applyStatus(u, a, 'freshlybaked', P.dur);
          B.fxSparkle(a.x, a.y - 40, 10, '#ffb56b');
        });

        const recipients = masterwork
          ? B.alliesOf(u)
          : B.alliesOf(u).sort((a, b) => a.hpPct - b.hpPct).slice(0, 2);

        recipients.forEach(a => {
          const sVal = u.st.mag * S.shield;
          B.shield(u, a, sVal, P.dur);
          if (B.fxGingerRoyalIcing) B.fxGingerRoyalIcing(a.x, a.y - 40, 85, P.dur);
          B.fxFloatIcon(a.x, a.y - 95, '🛡️ ROYAL ICING', '#ffeedb');
        });
      }
    },
    B: {
      name: 'Peppermint Swirl', type: 'Healing / Hearth', cd: 8.5,
      v: { heal: 1.15, en: 24, regen: .22 }, p: { dur: 6.0 },
      desc: (S, P) => `Ginger flings festive peppermint swirls across the allied ranks! Restores <em>${pcn(S.heal * 100)}</em> Magic HP to all allies, dispels 1 negative debuff, and restores <em>${Math.round(S.en)}</em> Energy.
        Ignites a <b>Warm Bakery Hearth</b> across the allied zone for ${P.dur}s: allies inside regenerate <em>${pcn(S.regen * 100)}</em> Magic HP each second, gain +20% Tenacity, and take 15% reduced damage from enemy periodic and damage-over-time effects.`,
      ai: { prio: 72, cond: (u, B) => B.alliesOf(u).some(a => a.hpPct < .92 || (a.energy || 0) < 60) },
      cast: (u, B, S, P) => {
        B.anim(u, 'cast', .66, 'gingerPeppermint');
        Sound.play('get_food'); Sound.play('sparkle', { vol: .42 }); Sound.play('cleanse', { vol: .28 });
        if (B.fxGingerPeppermintHearth) B.fxGingerPeppermintHearth(u.x, u.y, P.dur);
        else B.fxRing(u.x, u.y - 40, 130, '#ff7892', .4);

        B.alliesOf(u).forEach((a, i) => B.after(i * .04, () => {
          if (!a.alive || !u.alive) return;
          B.fxProj(u, a, { kind: 'food', img: 'Trinkets/GINGER_PeppermintIcing', col: '#ff7892' }, () => {
            B.heal(u, a, u.st.mag * S.heal, { tag: 'Peppermint Swirl' });
            B.cleanse(a, 1);
            B.energy(a, S.en);
            B.applyStatus(u, a, 'tenacity', P.dur);
            B.fxSparkle(a.x, a.y - 40, 14, '#ffeedb');
            B.fxFloatIcon(a.x, a.y - 95, `🍬 +${Math.round(S.en)}⚡`, '#ff7892');
          });
        }));

        B.every(u, 1.0, () => {
          B.alliesOf(u).forEach(a => {
            if (a.alive) B.heal(u, a, u.st.mag * S.regen, { tag: 'Warm Bakery Hearth', silent: true });
          });
        }, Math.floor(P.dur));
      }
    },
    P: {
      name: 'Little Improvements', type: 'Passive / Masterwork',
      v: { per: .065, cdr: .025 }, p: { max: 8 },
      desc: (S, P) => `Every heal Ginger lands, shield she bestows, or buff she applies grants 1 stack of 🍪 <b>Perfect Decoration</b> (max ${P.max}).
        Each stack permanently grants Ginger <em>+${(S.per * 100).toFixed(1)}%</em> Healing Power, <em>+${(S.per * 80).toFixed(1)}%</em> Shield Power, and <em>+${(S.cdr * 100).toFixed(1)}%</em> Cooldown Reduction.
        At maximum stacks (${P.max}), Ginger radiates an appetizing festive aroma (+15% Move Speed and +15% Energy Generation to all allies), and her next active skill becomes an empowered 🌟 <b>Masterwork Confection</b>!`,
      passive: (u, B, S, P) => {
        u.decoMax = P.max;
        B.on(u, 'healDone', ev => gingerDecoration(u, B, S, P, ev.target));
        B.on(u, 'shieldDone', ev => gingerDecoration(u, B, S, P, ev.target));
        B.on(u, 'statusApplied', ev => {
          if (ev.src !== u || !ev.unit || ev.unit.team !== u.team || ev.unit === u || !STATUS[ev.id] || STATUS[ev.id].kind !== 'buff') return;
          gingerDecoration(u, B, S, P, ev.unit);
        });
      }
    },
    R: {
      name: 'A Recipe For Everyone', type: 'Battle Opener / Rescue',
      v: { hp: .20, heal: 1.45, shield: .95 }, p: { thr: .35 },
      desc: (S, P) => `Ginger prepares a grand holiday banquet before combat begins: all allies permanently gain <em>+${pcn(S.hp * 100)}</em> Max HP and +25% Healing Received for the entire battle, and the lowest-HP ally opens with a 🛡️ <em>${pcn(S.shield * 100)}</em> Magic Gingerbread Shield.
        Whenever any ally falls below ${pc(P.thr)} HP (once every 12s per ally), Ginger immediately bestows an emergency 🍪 <b>Last Bite</b>: restores <em>${pcn(S.heal * 100)}</em> Magic HP, cleanses all debuffs, and grants <b>Untargetable & Invulnerable for 1.8s</b>. The saved ally and Ginger both become 💪 <b>Determined</b> (+30% Attack, +30% Magic, +25% Move Speed for 10s), and Ginger gains full Energy!`,
      passive: (u, B, S, P) => {
        B.after(.25, () => {
          B.anim(u, 'cast', .78, 'gingerPrep'); Sound.play('get_food', { vol: .75 }); Sound.play('cheer', { vol: .35 });
          B.alliesOf(u).forEach(a => {
            a.flat.hpP2 = (a.flat.hpP2 || 0) + S.hp;
            a.flat.healRecP = (a.flat.healRecP || 0) + 0.25;
            a.dirty = true;
            B.applyStatus(u, a, 'rally', 999);
            B.fxSparkle(a.x, a.y - 40, 10, '#ffd166');
          });
          const w = B.lowestHp(B.alliesOf(u));
          if (w) {
            B.shield(u, w, u.st.mag * S.shield, 14);
            B.fxFloatIcon(w.x, w.y - 95, '🍪 BANQUET SHIELD', '#ffd166');
          }
        });

        B.on(u, 'allyLow', a => {
          if (!a.alive || a.hpPct > P.thr) return;
          if (a._lastBite && B.t - a._lastBite < 12) return;
          a._lastBite = B.t;
          B.anim(u, 'cast', .55, 'gingerLastBite');
          if (B.fxGingerLastBite) B.fxGingerLastBite(a.x, a.y - 45);
          else B.fxFloatIcon(a.x, a.y - 110, '🍪 EMERGENCY LAST BITE!', '#ff7892');
          B.heal(u, a, u.st.mag * S.heal, { tag: 'Last Bite' });
          B.cleanse(a, 99);
          B.applyStatus(u, a, 'untargetable', 1.8);
          B.applyStatus(u, a, 'ccimmune', 3.0);
          B.applyStatus(u, a, 'determined', 10);
          B.applyStatus(u, u, 'determined', 10);
          B.energy(u, u.energyMax);
          Sound.play('get_food'); Sound.play('heal_soft', { vol: .55, throttle: 200 }); Sound.play('cleanse', { vol: .45 });
          B.fxSparkle(a.x, a.y - 40, 20, '#ffd166');
        });
      }
    }
  }
});
