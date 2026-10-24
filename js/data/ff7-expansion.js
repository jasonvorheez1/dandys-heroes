/* The Corel continuation: Barret, Sephiroth, and two new encounters. */
'use strict';

FF7_HERO_IDS.push('Barret', 'Sephiroth');
FF7_ENEMY_IDS.push('FF7Grangalan', 'FF7Bullmoter');
Object.assign(FF7_VN_ART, { Barret: 'assets/ff7/vn/barret.png', Waxwell: 'assets/ff7/vn/waxwell.png' });
Object.assign(FF7_ENEMY_ART, {
  FF7Grangalan: 'assets/ff7/enemies/grangalan.webp',
  FF7Bullmoter: 'assets/ff7/enemies/bullmoter.webp'
});
for (const id of ['Barret', 'Sephiroth']) {
  SPECIAL_HERO_ART[id] = FF7_VN_ART[id];
  SPECIAL_HERO_ICONS[id] = FF7_VN_ART[id];
}
for (const id of ['FF7Grangalan', 'FF7Bullmoter']) {
  SPECIAL_HERO_ART[id] = FF7_ENEMY_ART[id];
  SPECIAL_HERO_ICONS[id] = FF7_ENEMY_ART[id];
  SPECIAL_TWISTED_ART[id] = FF7_ENEMY_ART[id];
}
// Uploaded GIFs are decoded into transparent strips so the battle clock owns
// their frames. The blank tail frames in the source GIFs are omitted.
function ff7SuppliedAtlas(name, width, height, count, baseW, fps, extra = {}) {
  return { src: `assets/ff7/units/frames/${name}.png`, cols: count, rows: 1,
    frames: Array.from({ length: count }, (_, i) => i), cellW: width, cellH: height,
    baseW, fps, once: true, ...extra };
}
COLLAB_SPRITES.Barret = {
  idle: ff7SuppliedAtlas('barret-idle', 95, 87, 4, 95, 5, { groundY: 70 }),
  move: ff7SuppliedAtlas('barret-idle', 95, 87, 4, 95, 8, { groundY: 70 }),
  ready: ff7SuppliedAtlas('barret-ready', 84, 87, 4, 95, 5, { groundY: 70 }),
  attack: { ...ff7SuppliedAtlas('barret-attack', 116, 91, 28, 95, 20, { anchorX: 64, groundY: 74 }),
    frames: [0, 3, 6, 9, 12, 15, 18, 21, 24, 27] },
  bigshot: { ...ff7SuppliedAtlas('barret-attack', 116, 91, 28, 95, 20, { anchorX: 64, groundY: 74 }),
    frames: [2, 5, 8, 11, 14, 17, 20, 24] },
  barrage: ff7SuppliedAtlas('barret-attack', 116, 91, 28, 95, 18, { anchorX: 64, groundY: 74 }),
  cast: { ...ff7SuppliedAtlas('barret-cast', 86, 126, 17, 95, 12, { groundY: 109 }),
    frames: [0, 2, 4, 6, 9, 12, 14, 16] }
};
COLLAB_SPRITES.Sephiroth = {
  idle: ff7SuppliedAtlas('sephiroth-idle', 124, 76, 4, 124, 5, { groundY: 63 }),
  move: ff7SuppliedAtlas('sephiroth-idle', 124, 76, 4, 124, 8, { groundY: 63 }),
  attack: { ...ff7SuppliedAtlas('sephiroth-attack', 257, 159, 27, 124, 20, { anchorX: 160, groundY: 123 }),
    frames: [0, 3, 6, 9, 12, 15, 18, 21, 24, 26] },
  cast: ff7SuppliedAtlas('sephiroth-cast', 125, 76, 4, 124, 8, { groundY: 71 }),
  sheath: ff7SuppliedAtlas('sephiroth-ready', 200, 145, 22, 124, 20, { anchorX: 135, groundY: 132 })
};
Object.assign(FF7_POSES, {
  Barret: { idle: { w: 95, h: 87 }, foot: 17 },
  Sephiroth: { idle: { w: 124, h: 76 }, foot: 13 }
});
FF7_CLIPS['sephiroth-wing'] = {
  src: 'assets/ff7/units/frames/sephiroth-wing.png', w: 505, h: 95,
  cols: 22, n: 22, ax: 315, ay: 84, ms: 1400, s: 1
};

Object.assign(STATUS, {
  ff_suppress: { icon: '🎯', name: 'Suppressive Fire', kind: 'debuff', max: 3,
    desc: 'Each stack reduces Accuracy by 10% and Energy generation by 15%.',
    mods: (m, s) => { const k = s.val || 1; m.accP -= .10 * s.stacks * k; m.energyGen -= .15 * s.stacks * k; } },
  ff_drained: { icon: '◈', name: 'Drained', kind: 'debuff', desc: 'Skill Haste -20%; Basic Attacks lose Energy.',
    mods: m => { m.cdr -= .20; } },
  ff_barret_slow: { icon: '💥', name: 'Pinned Down', kind: 'debuff', desc: 'Movement Speed -25%; Attack Speed may also be reduced.',
    mods: (m, s) => { m.msP -= .25; m.aspdP -= s.val || 0; } },
  ff_barret_haste: { icon: '🔫', name: 'Clear Field', kind: 'buff', desc: 'Attack Speed +20%.', mods: m => { m.aspdP += .20; } },
  ff_ungarmax: { icon: '🔫', name: 'Ungarmax', kind: 'buff', desc: 'Firing rapid gun-arm bursts.' },
  ff_calamity: { icon: '☄', name: 'Calamity', kind: 'debuff', max: 5,
    desc: 'Each stack increases Magic Damage taken from Sephiroth by 5%.' },
  ff_wall: { icon: '🛡', name: 'Wall', kind: 'buff', desc: 'Physical and Magic Damage taken -20%.',
    mods: m => { m.dmgTaken -= .20; } },
  ff_shadowburn: { icon: '✦', name: 'Shadowburn', kind: 'debuff', desc: 'Magic Defense -25%; takes periodic Magic Damage.',
    mods: m => { m.mdefP -= .25; },
    tick: (u, s, dt, B) => { s.acc = (s.acc || 0) + dt; if (s.acc >= 1 && B && u.alive) { s.acc -= 1; B.damage(s.src, u, s.val || 0, { type: 'magic', dot: true, tag: 'Shadowburn' }); } } },
  ff_sadness: { icon: '◌', name: 'Sadness', kind: 'debuff', desc: 'Energy generation -25%.',
    mods: m => { m.energyGen -= .25; } },
  ff_small: { icon: '▫', name: 'Small', kind: 'debuff', desc: 'Attack and Armor -20%.',
    mods: m => { m.atkP -= .20; m.defP -= .20; } },
  ff_soldierfocus: { icon: '⚔', name: "SOLDIER's Focus", kind: 'buff', max: 4,
    desc: 'Each stack increases Attack and Accuracy by 5%.',
    mods: (m, s) => { m.atkP += .05 * s.stacks; m.accP += .05 * s.stacks; } },
  ff_heartless: { icon: '◇', name: 'Heartless Angel', kind: 'buff', desc: 'Skill Haste +25%.',
    mods: m => { m.cdr += .25; } },
  ff_seph_healcut: { icon: '✕', name: 'Healing Cut', kind: 'debuff', desc: 'Healing received -35%.',
    mods: (m, s) => { m.healRecv -= s.val || .35; } }
});

function ff7Suppression(u, t, B) {
  if (!t || !t.alive) return;
  B.applyStatus(u, t, 'ff_suppress', 6, { val: u._barretRed ? 1.25 : 1 });
  u._barretApplied = (u._barretApplied || 0) + 1;
}
function ff7Suppressed(t) { const s = t && t.getStatus && t.getStatus('ff_suppress'); return s ? s.stacks : 0; }
function ff7BarretSatellite(u, B) {
  if (u._barretSatellite || !u.alive) return;
  u._barretSatellite = true;
  FF7FX.banner(B, 'Satellite Beam', 'limit');
  FF7Sprites.hold(u, B, 'barrage', 1.5);
  B.flash('#ffdb88', .35, .25);
  ff7Foes(u, B).forEach(t => {
    B.damage(u, t, u.st.atk * 1.15, { type: 'physical', forceCrit: true, noDodge: true, area: true, tag: 'Satellite Beam' });
    B.dispel(t, 1);
    if (t.casting) B.interrupt(t, u);
    B.fxBoom(t.x, t.y - 40, .85, '#ffdc84');
  });
  B.applyStatus(u, u, 'ff_ungarmax', 7);
  B.repeat(18, 7 / 18, () => {
    if (!u.alive) return;
    const foes = ff7Foes(u, B); if (!foes.length) return;
    const t = pick(foes);
    B.damage(u, t, u.st.atk * .24, { type: 'physical', tag: 'Ungarmax' });
    if (ff7Suppressed(t)) B.energy(u, 2);
  });
}
function ff7BarretBasic(u, t, B) {
  if (!t || !u.alive) return;
  if (B.distance(u, t) < 120) {
    B.damage(u, t, u.st.atk * .7, { type: 'physical', melee: true, tag: 'Hammerblow' });
    B.knockback(u, t, 100);
    if (!t.isBoss && !t.flags?.executeImmune && t.hpPct < .15 && chance(.08)) B.damage(u, t, Math.min(t.hp, t.max.hp * .2), { type: 'true', noDodge: true, tag: 'Hammerblow' });
    FF7FX.banner(B, 'Hammerblow');
    return;
  }
  const burst = u._barretBurst = (u._barretBurst || 0) + 1;
  for (let i = 1; i < 3; i++) B.after(i * .08, () => {
    if (u.alive && t.alive) B.damage(u, t, u.st.atk * .31, { type: 'physical', tag: 'Gun-arm Burst' });
  });
  if (burst % 3 === 0) ff7Suppression(u, t, B);
}

ff7Common({
  id: 'Barret', name: 'Barret', role: 'Damage', roleLabel: 'Damage / Control', position: 'Backline', tier: 'C',
  blurb: 'Barret Wallace carries a gun-arm and leads Avalanche. At Corel, he is hunting the other man accused of the Gold Saucer shootings.',
  ff7Sprite: true, nativeFace: -1, scale: 1.55,
  base: { hp: 4500, atk: 420, def: 275, mag: 265, mdef: 225, spd: 94, acc: 220, eva: 110 },
  hidden: { range: 340, aspd: .88, ms: 72, aggro: .65, crit: .11, critDmg: 1.55, healPow: 1, shieldPow: 1, cdr: .03, ccRes: .18, kbRes: .65, armorPen: .05, magPen: .02 },
  basic: { name: 'Gun-arm Burst', type: 'physical', ratio: .72, range: 340, proj: 'orb', rangedPhysical: true, pcol: '#ffd084', wind: .22, attackAnim: .48, sfx: 'ff7_barret_gun', hit: 'hit_blunt',
    onHit: ff7BarretBasic },
  skills: {
    W: { name: 'Catastrophe', type: 'Physical Damage / Control', energy: 100,
      v: { blast: .38, final: 1.2 }, p: {},
      desc: S => `Every third Basic Attack burst applies Suppressive Fire for 6s (up to 3 stacks): -10% Accuracy and -15% Energy generation per stack. Hammerblow Knocks Back enemies that reach Barret. Catastrophe fires ten blasts for <em>${pcn(S.blast * 100)}</em> Physical Damage each, favoring Suppressed enemies, then an area blast for <em>${pcn(S.final * 100)}</em>. Hitting three different enemies grants 20% Attack Speed for 8s.`,
      passive: (u, B) => { u._barretBurst = 0; u._barretApplied = 0; u._barretSatellite = false;
        B.every(u, .3, () => { if (u._barretRed && u._barretApplied >= 12 && !u._barretSatellite) ff7BarretSatellite(u, B); }); },
      cast: (u, B, S) => {
        FF7FX.banner(B, 'Catastrophe', 'limit'); B.anim(u, 'cast', 1.7);
        FF7Sprites.hold(u, B, 'barrage', 1.7);
        const hit = new Set();
        B.repeat(10, .13, i => {
          if (!u.alive) return;
          const foes = ff7Foes(u, B).sort((a, b) => ff7Suppressed(b) - ff7Suppressed(a)); if (!foes.length) return;
          const t = foes[i % Math.min(foes.length, 3)]; hit.add(t);
          const bonus = u._barretRed && ff7Suppressed(t) >= 3 ? 1.3 : 1;
          B.damage(u, t, u.st.atk * S.blast * bonus, { type: 'physical', tag: 'Catastrophe' });
          B.fxBoom(t.x, t.y - 35, .5, '#ffd082');
          if (i === 9) {
            if (u._barretRed && foes[0]?.alive) B.energy(foes[0], -15);
            ff7Foes(u, B).forEach(e => {
              B.damage(u, e, u.st.atk * S.final, { type: 'physical', area: true, tag: 'Catastrophe' });
              B.knockback(u, e, 55);
            });
            Sound.play('ff7_strong_hit', { vol: .65, priority: true });
            if (hit.size >= 3) B.applyStatus(u, u, 'ff_barret_haste', 8);
          }
        });
      } },
    G: { name: 'Big Shot', type: 'Physical Damage', cd: 8,
      v: { ratio: 2.1, pierce: .7 }, p: {},
      desc: S => `Fires at the enemy with the most remaining HP for <em>${pcn(S.ratio * 100)}</em> Physical Damage, with reduced damage to enemies behind them. Deals 25% more damage above 75% HP. Against Suppressed targets, reduces Armor by 20% for 8s and restores Barret's Energy.`,
      ai: { prio: 58, cond: (u, B) => ff7Foes(u, B).length > 0 },
      cast: (u, B, S) => { const foes = ff7Foes(u, B).sort((a, b) => b.hp - a.hp), t = foes[0]; if (!t) return;
        B.anim(u, 'cast', .6); FF7FX.banner(B, 'Big Shot');
        FF7Sprites.hold(u, B, 'bigshot', .6);
        B.after(.3, () => { if (!u.alive || !t.alive) return;
          const mult = t.hpPct > .75 ? 1.25 : 1;
          B.damage(u, t, u.st.atk * S.ratio * mult * (u._barretNextBig ? 1.3 : 1) * (u._barretRed ? 1.12 : 1), { type: 'physical', armorPen: u._barretNextBig ? .15 : 0, tag: 'Big Shot' });
          Sound.play('ff7_strong_hit', { vol: .55 });
          foes.filter(e => e !== t && e.alive && (e.x - t.x) * (t.x - u.x) >= 0 && Math.abs(e.x - t.x) < 135).forEach(e => B.damage(u, e, u.st.atk * S.pierce, { type: 'physical', area: true, tag: 'Big Shot' }));
          if (ff7Suppressed(t)) { B.applyStatus(u, t, 'ff_armorbreak', 8, { val: .2 }); B.energy(u, 10); }
          if (u._barretRed) B.applyStatus(u, t, 'ff_seph_healcut', 6, { val: .2 });
          u._barretNextBig = false; if (!t.alive) u.cds.P = Math.max(0, (u.cds.P || 0) - 3);
        }); } },
    B: { name: 'Mindblow', type: 'Magic Damage / Control', cd: 10,
      v: { ratio: 1.45 }, p: {},
      desc: S => `Hits the highest-Energy enemy for <em>${pcn(S.ratio * 100)}</em> Magic Damage, removes 35 Energy, and applies Drained for 7s. At 3 Suppressive Fire stacks, also Silences for 2s. Removing at least 25 Energy restores 15 to Barret. Ungarmax adds a weaker second target.`,
      ai: { prio: 67, cond: (u, B) => ff7Foes(u, B).some(t => t.energy > 20) },
      cast: (u, B, S) => { const targets = ff7Foes(u, B).sort((a, b) => b.energy - a.energy).slice(0, u._barretRed ? 2 : 1);
        B.anim(u, 'cast', .55); FF7FX.banner(B, 'Mindblow');
        B.after(.3, () => targets.forEach((t, i) => { if (!u.alive || !t.alive) return;
          const factor = i ? .6 : 1, before = t.energy;
          B.damage(u, t, u.st.mag * S.ratio * factor, { type: 'magic', noDodge: true, tag: 'Mindblow' });
          B.energy(t, -35 * factor); B.applyStatus(u, t, 'ff_drained', 7);
          if (!t._barretDrainHook) { t._barretDrainHook = true; B.on(t, 'basicHit', () => { if (t.hasStatus('ff_drained')) B.energy(t, -3); }); }
          if (ff7Suppressed(t) >= 3) B.applyStatus(u, t, 'silence', 2);
          if (!i && before - t.energy >= 25) B.energy(u, 15);
        })); } },
    P: { name: 'Grenade Bomb', type: 'Physical Damage / Control', cd: 12,
      v: { ratio: 1.65 }, p: { radius: 175 },
      desc: S => `Explodes in the largest enemy cluster for <em>${pcn(S.ratio * 100)}</em> Physical Damage. Hit enemies gain Suppressive Fire and lose 25% Movement Speed for 6s. Three hits empower the next Big Shot; a kill by either attack shortens Grenade Bomb's cooldown by 3s.`,
      ai: { prio: 60, cond: (u, B) => ff7Foes(u, B).length > 1 },
      cast: (u, B, S, P) => { const foes = ff7Foes(u, B); if (!foes.length) return;
        const center = foes.slice().sort((a, b) => foes.filter(e => B.distance(a, e) < P.radius).length - foes.filter(e => B.distance(b, e) < P.radius).length).pop();
        B.anim(u, 'cast', .55); FF7FX.banner(B, 'Grenade Bomb');
        B.after(.35, () => { if (!u.alive || !center) return;
          const hits = ff7Foes(u, B).filter(e => B.distance(center, e) < P.radius);
          hits.forEach(t => { B.damage(u, t, u.st.atk * S.ratio, { type: 'physical', area: true, tag: 'Grenade Bomb' });
            if (t.alive) { ff7Suppression(u, t, B); B.applyStatus(u, t, 'ff_barret_slow', 6, { val: u._barretRed ? .2 : 0 }); }
            else u.cds.P = Math.max(0, (u.cds.P || 0) - 3);
          }); if (hits.length >= 3) u._barretNextBig = true;
          B.fxBoom(center.x, center.y - 35, 1.2, '#ffa852');
        }); } },
    R: { name: 'Ungarmax', type: 'Physical Damage / Control',
      v: { atk: .12, crit: .18, acc: .10 }, p: {},
      desc: S => `Improves Barret's four attacks. Once per wave after 12 Suppressive Fire applications, Satellite Beam critically strikes every enemy, removes a defensive buff and interrupts Skills. Ungarmax then fires 18 rapid shots over 7s. Also grants Attack, Critical Damage and Accuracy.`,
      passive: (u, B, S) => { u._barretRed = true; u.flat.atkP87 = S.atk; u.flat.critDmg87 = S.crit; u.flat.accP87 = S.acc; u.dirty = true; } }
  }
});

function ff7SephMagic(u, t, amount) { return amount * (1 + .05 * ((t.getStatus('ff_calamity') || {}).stacks || 0)); }
function ff7SephHpCut(u, t, B, fraction, bossCap, tag) {
  const raw = Math.min(t.hp * fraction, t.isBoss ? t.max.hp * bossCap : Infinity, Math.max(0, t.hp - 1));
  if (raw > 0) { t.hp = Math.max(1, t.hp - raw); B.floatNum(t, -86, Math.round(raw), 'dmg'); B.log(`<b>${tag}</b> reduces ${t.name}'s current HP.`); }
  return raw;
}
function ff7SephBasic(u, t, B) {
  if (!t || !u.alive) return;
  const count = u._sephBasics = (u._sephBasics || 0) + 1;
  if (count % 3 === 0) {
    B.applyStatus(u, t, 'ff_calamity', 10);
    const behind = ff7Foes(u, B).find(e => e !== t && B.distance(t, e) < 125);
    if (behind) B.damage(u, behind, u.st.atk * .45, { type: 'physical', area: true, tag: 'Masamune' });
  }
  if (u._sephMasamune && count % 4 === 0) B.applyStatus(u, t, 'ff_calamity', 10);
  if (u._sephMasamune && count % 4 === 0) ff7Foes(u, B).filter(e => e !== t).slice(0, 2).forEach(e => {
    B.damage(u, e, u.st.atk * .7, { type: 'physical', area: true, tag: 'Masamune' }); B.applyStatus(u, e, 'ff_calamity', 10);
  });
  if (u._sephMasamune && (u.getStatus('ff_soldierfocus') || {}).stacks >= 4) {
    B.removeStatus(u, 'ff_soldierfocus'); FF7FX.banner(B, 'Deen'); FF7Sprites.hold(u, B, 'sheath', 1.1);
    ff7Foes(u, B).forEach(e => { B.damage(u, e, ff7SephMagic(u, e, u.st.mag * .7), { type: 'magic', area: true, tag: 'Deen' }); B.applyStatus(u, e, 'ff_barret_slow', 5, { val: .2 }); if (u._sephRed) B.applyStatus(u, e, 'ff_calamity', 10); });
  }
}
function ff7HeartlessAngel(u, B) {
  if (u._sephAngel || !u.alive) return;
  u._sephAngel = true; FF7FX.banner(B, 'Heartless Angel', 'limit'); B.flash('#f4e5ff', .4, .3);
  FF7Sprites.hold(u, B, 'cast', .8);
  let removed = 0;
  ff7Foes(u, B).forEach(t => { removed += ff7SephHpCut(u, t, B, .4, .1, 'Heartless Angel');
    if (t.hasStatus('ff_shadowburn')) B.applyStatus(u, t, 'ff_seph_healcut', 8);
  });
  u._sephAngelBonus = Math.min(u.st.mag * 2, removed * .08);
  B.shield(u, u, u.max.hp * .25, 8); B.applyStatus(u, u, 'ff_heartless', 8);
}

ff7Common({
  id: 'Sephiroth', name: 'Sephiroth', role: 'Damage', roleLabel: 'Damage / Control', position: 'Midline', tier: 'S',
  blurb: 'A former SOLDIER wielding the Masamune. He cuts down weakened enemies after magic and status effects have stripped their defenses.',
  ff7Sprite: true, nativeFace: -1, scale: 1.6,
  base: { hp: 4200, atk: 480, def: 245, mag: 500, mdef: 315, spd: 124, acc: 245, eva: 165 },
  hidden: { range: 180, aspd: 1.0, ms: 102, aggro: .75, crit: .15, critDmg: 1.7, healPow: 1, shieldPow: 1, cdr: .08, ccRes: .25, kbRes: .35, armorPen: .08, magPen: .1 },
  basic: { name: 'Masamune', type: 'physical', ratio: 1.0, range: 180, wind: .2, attackAnim: .54, sfx: 'swing_heavy', hit: 'ff7_sword_hit', onHit: ff7SephBasic },
  skills: {
    W: { name: 'Super Nova', type: 'Magic Damage / Control', energy: 100,
      v: { ratio: 1.1 }, p: {},
      desc: S => `Starts each wave with Wall for 8s. Every third Masamune strike applies Calamity (up to 5 stacks), increasing Sephiroth's Magic Damage by 5% per stack. Super Nova removes 35% of each enemy's current HP, capped against bosses, then deals <em>${pcn(S.ratio * 100)}</em> Magic Damage scaled by Calamity. It Slows and Silences for 4s; full Calamity also Confuses. The HP reduction cannot defeat an enemy by itself.`,
      passive: (u, B) => { u._sephBasics = 0; u._sephAngel = false; B.applyStatus(u, u, 'ff_wall', 8); },
      cast: (u, B, S) => { FF7FX.banner(B, 'Super Nova', 'limit'); B.anim(u, 'cast', 1.4); B.flash('#e5c7ff', .5, .4);
        FF7FX.clip(B, u, 'sephiroth-wing', { hideBody: false });
        B.after(.7, () => { if (!u.alive) return; ff7Foes(u, B).forEach(t => {
          if (u._sephRed) B.dispel(t, 1);
          ff7SephHpCut(u, t, B, .35, .1, 'Super Nova');
          B.damage(u, t, ff7SephMagic(u, t, u.st.mag * S.ratio), { type: 'magic', area: true, tag: 'Super Nova' });
          B.applyStatus(u, t, 'slow', 4); B.applyStatus(u, t, 'silence', 4);
          if ((t.getStatus('ff_calamity') || {}).stacks >= 5) { B.applyStatus(u, t, 'confusion', 3); if (u._sephRed) B.energy(t, -15); }
          B.fxBoom(t.x, t.y - 45, 1, '#d8b0ff');
        }); }); } },
    G: { name: 'Shadow Flare', type: 'Magic Damage / Control', cd: 9,
      v: { ratio: 2.0, splash: .65, burn: .18 }, p: {},
      desc: S => `Detonates around the highest-Attack enemy for <em>${pcn(S.ratio * 100)}</em> Magic Damage, with splash. Shadowburn lowers Magic Defense by 25% and deals damage for 8s. Three Calamity stacks also remove 25 Energy and interrupt.`,
      passive: (u, B) => B.every(u, .25, () => {
        ff7Foes(u, B).filter(t => t.casting && t.hasStatus('ff_shadowburn') && B.t - (t._sephBurnEnergyAt || -99) > 2).forEach(t => { t._sephBurnEnergyAt = B.t; B.energy(u, 10); });
      }),
      ai: { prio: 62, cond: (u, B) => ff7Foes(u, B).length > 0 },
      cast: (u, B, S) => { const foes = ff7Foes(u, B).sort((a, b) => b.st.atk - a.st.atk), t = foes[0]; if (!t) return;
        B.anim(u, 'cast', .55); FF7FX.banner(B, 'Shadow Flare');
        B.after(.35, () => { if (!u.alive || !t.alive) return;
          B.damage(u, t, ff7SephMagic(u, t, u.st.mag * S.ratio) + (u._sephAngelBonus || 0), { type: 'magic', tag: 'Shadow Flare' }); u._sephAngelBonus = 0;
          B.applyStatus(u, t, 'ff_shadowburn', 8, { val: u.st.mag * S.burn });
          foes.filter(e => e !== t && e.alive && B.distance(e, t) < 170).forEach(e => B.damage(u, e, ff7SephMagic(u, e, u.st.mag * S.splash), { type: 'magic', area: true, tag: 'Shadow Flare' }));
          if ((t.getStatus('ff_calamity') || {}).stacks >= 3) { B.energy(t, -25); if (t.casting) B.interrupt(t, u); }
          if (u._sephRed && !t.alive) { const other = ff7Foes(u, B)[0]; if (other) B.applyStatus(u, other, 'ff_shadowburn', 8, { val: u.st.mag * S.burn }); }
          B.fxBoom(t.x, t.y - 45, 1.1, '#b189f5');
        }); } },
    B: { name: 'Pale Horse', type: 'Magic Damage / Control', cd: 11,
      v: { ratio: 1.25 }, p: {},
      desc: S => `Hits the highest-Energy enemy for <em>${pcn(S.ratio * 100)}</em> Magic Damage. Applies two different ailments for 7s: Silence, Slow, Sadness or Small. Calamity also reduces Healing received. With four Calamity stacks, Heartless Angel adds a third ailment.`,
      ai: { prio: 65, cond: (u, B) => ff7Foes(u, B).some(e => e.energy > 20) },
      cast: (u, B, S) => { const t = ff7Foes(u, B).sort((a, b) => b.energy - a.energy)[0]; if (!t) return;
        B.anim(u, 'cast', .55); FF7FX.banner(B, 'Pale Horse');
        B.after(.3, () => { if (!u.alive || !t.alive) return;
          B.damage(u, t, ff7SephMagic(u, t, u.st.mag * S.ratio), { type: 'magic', noDodge: true, tag: 'Pale Horse' });
          const options = ['silence', 'slow', 'ff_sadness', 'ff_small'];
          const n = u._sephRed && (t.getStatus('ff_calamity') || {}).stacks >= 4 ? 3 : 2;
          rngPickN(options, n).forEach(id => B.applyStatus(u, t, id, id === 'silence' ? 3 : 7));
          if (t.hasStatus('ff_calamity')) B.applyStatus(u, t, 'ff_seph_healcut', 7, { val: .2 });
        }); } },
    P: { name: 'Masamune', type: 'Physical Damage / Survival',
      v: { crit: .2, armor: .15 }, p: {},
      desc: S => `The Masamune reaches from midline. Grants <em>${pcn(S.crit * 100)}</em> Critical Chance and <em>${pcn(S.armor * 100)}</em> Armor Penetration. Every fourth Basic Attack sweeps up to three enemies. Critical Hits build SOLDIER's Focus; at four stacks, the next strike releases Deen. A received Critical Hit can refresh Wall once every 12s.`,
      passive: (u, B, S) => { u._sephMasamune = true; u.flat.critP86 = S.crit; u.flat.armorPen86 = S.armor; u.dirty = true; u._sephWallAt = -99;
        B.on(u, 'crit', ev => { if (ev.unit === u) B.applyStatus(u, u, 'ff_soldierfocus', 7); });
        B.on(u, 'damaged', ev => { if (ev.crit && B.t - u._sephWallAt >= 12) { u._sephWallAt = B.t; B.applyStatus(u, u, 'ff_wall', 4); } }); } },
    R: { name: 'Heartless Angel', type: 'Magic Damage / Control / Survival',
      v: { atk: .1, mag: .12, crit: .12 }, p: {},
      desc: S => `Upgrades Super Nova, Shadow Flare, Pale Horse and Masamune. Once per wave, below 40% HP or when three enemies reach five Calamity stacks, Heartless Angel removes 40% of each enemy's current HP (boss capped; nonlethal), grants a 25% Max HP Shield and 25% Skill Haste, and empowers the next Shadow Flare. Also grants Attack, Magic and Critical Damage.`,
      passive: (u, B, S) => { u._sephRed = true; u.flat.atkP87 = S.atk; u.flat.magP87 = S.mag; u.flat.critDmg87 = S.crit; u.dirty = true;
        B.every(u, .25, () => { if (u._sephAngel || !u.alive) return;
          if (u.hpPct < .4 || ff7Foes(u, B).filter(t => (t.getStatus('ff_calamity') || {}).stacks >= 5).length >= 3) ff7HeartlessAngel(u, B);
        }); } }
  }
});

ff7Enemy({
  id: 'FF7Grangalan', name: 'Grangalan', role: 'Control', scale: 1.4,
  blurb: 'A Corel area monster. Darkeye can Blind a target, while Silver Wheel deals a heavy single hit.',
  base: { hp: 4300, atk: 350, def: 260, mag: 390, mdef: 265, spd: 100, acc: 205, eva: 115 },
  hidden: FF7H(210, .9, 78),
  basic: { name: 'Silver Wheel', type: 'physical', ratio: 1.25, range: 210, proj: 'orb', rangedPhysical: true, pcol: '#b4a1e4', wind: .23, hit: 'hit_blunt' },
  skills: {
    W: { name: 'Darkeye', type: 'Magic / Control', energy: 100, v: { ratio: 1.05 }, p: {},
      desc: S => `Never-miss Magic attack for <em>${pcn(S.ratio * 100)}</em> Damage, with a 72% chance to Blind.`,
      cast: (u, B, S) => { const t = B.nearest(u, ff7Foes(u, B)); if (!t) return;
        B.anim(u, 'cast', .5); B.damage(u, t, u.st.mag * S.ratio, { type: 'magic', noDodge: true, tag: 'Darkeye' }); if (chance(.72)) B.applyStatus(u, t, 'blind', 5); } },
    G: { name: 'Put out', type: 'Special', cd: 8, v: { ratio: 1.15 }, p: {},
      desc: S => `A never-miss strike against one target for <em>${pcn(S.ratio * 100)}</em> Physical Damage.`,
      ai: { prio: 54, cond: (u, B) => ff7Foes(u, B).length > 0 },
      cast: (u, B, S) => { const t = B.nearest(u, ff7Foes(u, B)); if (t) B.damage(u, t, u.st.atk * S.ratio, { type: 'physical', noDodge: true, tag: 'Put out' }); } },
    B: { name: 'Vanish', type: 'Special', cd: 13, v: { ratio: 1.2 }, p: {},
      desc: S => `Vanishes briefly, then makes a never-miss attack for <em>${pcn(S.ratio * 100)}</em> Physical Damage.`,
      ai: { prio: 42, cond: (u, B) => ff7Foes(u, B).length > 0 },
      cast: (u, B, S) => { const t = B.nearest(u, ff7Foes(u, B)); if (!t) return; B.applyStatus(u, u, 'untargetable', 1);
        B.after(1, () => { if (u.alive && t.alive) B.damage(u, t, u.st.atk * S.ratio, { type: 'physical', noDodge: true, tag: 'Vanish' }); }); } }
  }
});
ff7Enemy({
  id: 'FF7Bullmoter', name: 'Bullmoter', role: 'Damage', scale: 1.55,
  blurb: 'A heavy Corel area monster. Bodyblow hits one target; Matra Magic strikes the whole team.',
  base: { hp: 5700, atk: 430, def: 315, mag: 390, mdef: 245, spd: 82, acc: 205, eva: 90 },
  hidden: FF7H(105, .8, 72, { kbRes: .65 }),
  basic: { name: 'Bodyblow', type: 'physical', ratio: 1, range: 105, wind: .26, sfx: 'swing_heavy', hit: 'hit_blunt' },
  skills: {
    W: { name: 'Matra Magic', type: 'Magic / Area', energy: 100, v: { ratio: .69 }, p: {},
      desc: S => `Fires a missile barrage at every enemy, dealing <em>${pcn(S.ratio * 100)}</em> Magic Damage to each.`,
      cast: (u, B, S) => { B.anim(u, 'cast', .7); FF7FX.banner(B, 'Matra Magic', 'enemy');
        B.after(.4, () => { if (!u.alive) return; ff7Foes(u, B).forEach(t => { B.damage(u, t, u.st.mag * S.ratio, { type: 'magic', area: true, tag: 'Matra Magic' }); B.fxBoom(t.x, t.y - 30, .55, '#ffa679'); }); }); } }
  }
});

for (const id of ['Barret', 'Sephiroth']) {
  if (!HERO_IDS.includes(id)) HERO_IDS.push(id);
  if (!PLAYABLE_IDS.includes(id)) PLAYABLE_IDS.push(id);
}
