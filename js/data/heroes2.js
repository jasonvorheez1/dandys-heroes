/* heroes2.js - Hero definitions, part 2. Same contract as heroes.js.
   Kits follow Characters/<Name>/Skillset.txt. */
'use strict';

/* ============================================================ BASSIE
   Support / DPS - A Tier. The Supply economy: stock it, spend it or throw it. */
defHero({
  id: 'Bassie', name: 'Bassie', folder: 'Bassie', file: 'Bassie', icon: 'Bassie',
  role: 'Support', tier: 'A', element: 'Spring',
  blurb: 'Keeps her basket stocked because being prepared is the best way to help. Anything left over gets thrown.',
  base: { hp: 3800, atk: 300, def: 228, mag: 262, mdef: 250, spd: 114, acc: 186, eva: 128 },
  hidden: { range: 250, aspd: 1.0, ms: 74, aggro: .85, crit: .12, critDmg: 1.55, healPow: 1.25, shieldPow: 1.20, cdr: .10, ccRes: .16, kbRes: .3, armorPen: .10, magPen: 0 },
  growth: { hp: .088, atk: .086, def: .080, mag: .080, mdef: .080 },
  move: { gait: 'hop', bob: 9, freq: 2.1, lean: 6, squash: .08, idle: 'bounce', step: 'bounce',
    particles: 'confetti', pcol: '#8fd9c4', trail: { on: false }, brake: .3 },
  basic: { name: 'Basket Jab', type: 'physical', ratio: 1.02, range: 250, sfx: 'swing_light', hit: 'hit_light',
    wind: .16, note: 'She swings the basket. Things fall out. Both are useful.',
    onHit: (u, t, B) => { if (chance(.18)) B.supply(u, 1); } },
  skills: {
    W: {
      name: 'Springful Sharing', type: 'Physical Damage', energy: 100,
      v: { ratio: .70, restore: .35 }, p: { max: 5, prep: 4, thr: .5, expose: 7 },
      desc: (S, P) => `<span class="sk-pas">Bassie prepares a Supply every ${P.prep}s, storing up to ${P.max}. Any ally below ${pc(P.thr)} HP or Energy is automatically handed one, restoring <em>${pcn(S.restore * 100)}</em> of whichever is lower.</span>
        Active: every remaining Supply is hurled at the biggest cluster for <em>${pcn(S.ratio * 100)}</em> Attack each, reducing Attack. Enemies struck by two or more become 🎯 Exposed for ${P.expose}s.`,
      passive: (u, B, S, P) => {
        u.supplies = P.max; u.supplyMax = P.max;
        B.every(u, P.prep, () => B.supply(u, 1));
        B.every(u, 1, () => {
          if ((u.supplies || 0) <= 0) return;
          const needy = B.alliesOf(u).find(a =>
            (a.hpPct < P.thr || a.energy < a.energyMax * P.thr) && !(a._supCd && B.t - a._supCd < 6));
          if (!needy) return;
          needy._supCd = B.t; u.supplies--;
          B.fxBassieSkill('supply', u, { target: needy, food: 'Apple' });
          B.fxArc(u, needy, { kind: 'food', img: 'Apple' }, () => {
            const healLow = needy.hpPct <= needy.energy / needy.energyMax;
            if (healLow || u.supplyBoth) B.heal(u, needy, needy.max.hp * S.restore, { tag: 'Supply' });
            if (!healLow || u.supplyBoth) B.energy(needy, needy.energyMax * S.restore);
            Sound.play('get_item', { vol: .5 });
            if (u.supplyAtk) { u.flat.atkP = (u.flat.atkP || 0) + .02; u.dirty = true; }
          });
        });
      },
      cast: (u, B, S, P) => {
        const n = Math.max(1, u.supplies || 0);
        const overflow = u.overflow || 0;
        u.supplies = 0; u.overflow = 0;
        B.anim(u, 'cast', .45); B.fxBassieSkill('sharing', u, { count: n + overflow, overflow }); Sound.play('cheer');
        const hits = new Map();
        B.repeat(n + overflow, .09, i => {
          const foes = B.enemiesOf(u); if (!foes.length) return;
          const t = foes[i % foes.length];
          B.fxArc(u, t, { kind: 'food', img: pick(['Apple', 'Bread', 'Cherry', 'Pretzel']) }, () => {
            Sound.play('hit_light', { vol: .5, throttle: 12 });
            const over = i >= n;
            if (over) { B.fxBassieImpact(t, { overflow: true }); Sound.play('bomb', { vol: .5 }); }
            B.damage(u, t, u.st.atk * S.ratio * (over ? 1.6 : 1), { type: 'physical', tag: 'Springful Sharing' });
            B.applyStatus(u, t, 'weaken', 6);
            hits.set(t, (hits.get(t) || 0) + 1);
            if (hits.get(t) >= 2) B.applyStatus(u, t, 'exposed', P.expose, { stacks: 2 });
          });
        });
      }
    },
    G: {
      name: 'Packed for Everyone', type: 'Buff', cd: 11,
      v: { shield: .45 }, p: { dur: 8 },
      desc: (S, P) => `Bassie opens the basket. Allies gain Attack Speed, cooldown recovery and Crit Chance for ${P.dur}s, and anyone who receives a Supply while it lasts also gains a <em>${pcn(S.shield * 100)}</em> Magic Shield.`,
      ai: { prio: 55, cond: () => true },
      cast: (u, B, S, P) => {
        B.anim(u, 'cast', .4); B.fxBassieSkill('packed', u, { targets: B.alliesOf(u) }); Sound.play('get_item');
        B.alliesOf(u).forEach(a => {
          B.applyStatus(u, a, 'speedup', P.dur);
          B.applyStatus(u, a, 'haste', P.dur);
          B.applyStatus(u, a, 'lucky', P.dur);
          B.fxSparkle(a.x, a.y - 40, 8, '#8fd9c4');
        });
        u._packedUntil = B.t + P.dur;
        B.on(u, 'statusApplied', ev => {
          if (B.t < (u._packedUntil || 0) && ev.id === 'regen' && ev.src === u)
            B.shield(u, ev.unit, u.st.mag * S.shield, 6);
        });
      }
    },
    B: {
      name: 'Basket Toss', type: 'Physical Damage', cd: 13,
      v: { ratio: 1.05 }, p: { dur: 7 },
      desc: (S, P) => `The whole basket goes in and comes back. Enemies take <em>${pcn(S.ratio * 100)}</em> Attack and become 🌀 Disorganized for ${P.dur}s, losing Defense and Accuracy. Bassie prepares one fresh Supply per enemy hit.`,
      ai: { prio: 50, cond: (u, B) => B.enemiesOf(u).length >= 2 },
      cast: (u, B, S, P) => {
        B.anim(u, 'wind', .4); Sound.play('swing_heavy');
        B.after(.3, () => {
          Sound.play('explode', { vol: .6 }); B.shake(10, .35);
          const cx = B.avgX(B.enemiesOf(u));
          B.fxBassieSkill('toss', u, { targetX: cx, targetY: B.ground - 70 });
          B.enemiesOf(u).forEach(e => {
            B.damage(u, e, u.st.atk * S.ratio, { type: 'physical', tag: 'Basket Toss' });
            B.applyStatus(u, e, 'disorganized', P.dur);
            B.supply(u, 1);
          });
        });
      }
    },
    P: {
      name: 'Always Prepared', type: 'Max HP / Attack',
      v: { pen: .25 }, p: { extra: 2 },
      desc: (S, P) => `Supply storage grows by ${P.extra}. Every Supply an ally consumes permanently raises Bassie's Attack for the rest of the battle, and at maximum Supplies her next damaging skill ignores <em>${pcn(S.pen * 100)}</em> Defense.`,
      passive: (u, B, S, P) => {
        u.supplyMax = (u.supplyMax || 5) + P.extra;
        u.supplyAtk = true;
        B.every(u, .5, () => {
          u.flat.armorPen = (u.supplies || 0) >= u.supplyMax ? S.pen : 0;
          u.dirty = true;
        });
      }
    },
    R: {
      name: 'Overflowing Basket', type: 'Max HP / Attack',
      v: {}, p: {},
      desc: () => `Bassie opens at maximum Supplies, and Supplies now restore both HP and Energy. Preparing one while already full creates an Overflow Supply, which detonates on impact during Springful Sharing and extends 🎯 Exposed. Her buffs cannot be stripped while the basket is full.`,
      passive: (u, B) => {
        u.supplyBoth = true;
        u.supplies = u.supplyMax || 7;
        B.every(u, 1, () => {
          if ((u.supplies || 0) >= (u.supplyMax || 7)) B.applyStatus(u, u, 'ccimmune', 1.3);
        });
      }
    }
  }
});

/* ============================================================ BLOT
   Frontline Control / Threat Manipulator - A Tier */
function blotAddPool(u, B, x, radius) {
  const pools = u._blotPools || (u._blotPools = []);
  x = clamp(x, B.leftWall + 20, B.rightWall - 20);
  const r = radius || 190;
  u._blotPoolSeq = (u._blotPoolSeq || 0) + 1;
  pools.push({ id: u._blotPoolSeq, x, radius: r });
  B.fxPool(x, 999, '#3b2560', r * 1.1);
  if (!u._blotPoolInterval) {
    u._blotPoolInterval = true;
    B.every(u, 1, () => {
      if (!u.alive && (!u._blotPools || !u._blotPools.length)) return;
      u._blotPools.forEach(pool => {
        B.enemiesOf(u).forEach(e => {
          if (e.alive && Math.abs(e.x - pool.x) <= pool.radius) {
            B.applyStatus(u, e, 'slow', 1.5);
          }
        });
        B.alliesOf(u).forEach(a => {
          if (a.alive && Math.abs(a.x - pool.x) <= pool.radius) {
            B.energy(a, 3.5);
          }
        });
      });
    });
  }
}

defHero({
  id: 'Blot', name: 'Blot', folder: 'Blot', file: 'Blot', icon: 'Blot',
  role: 'Control', tier: 'A', element: 'Ink',
  blurb: 'A silent mime who wins by making sure nothing is ever hitting what it meant to hit.',
  base: { hp: 4400, atk: 232, def: 285, mag: 320, mdef: 288, spd: 104, acc: 178, eva: 148 },
  hidden: { range: 235, aspd: .92, ms: 64, aggro: 1.3, crit: .09, critDmg: 1.55, healPow: 1, shieldPow: 1.30, cdr: .08, ccRes: .24, kbRes: .5, armorPen: 0, magPen: .14 },
  growth: { hp: .096, atk: .072, def: .090, mag: .090, mdef: .086 },
  move: { gait: 'ooze', bob: 4, freq: .9, lean: 3, squash: .12, idle: 'drip', step: 'step_wet',
    particles: 'ink', pcol: '#8f6bff', trail: { on: true, col: '#3b2560', rate: .07 }, brake: .6, smear: true },
  basic: { name: 'Ink Flick', type: 'magic', ratio: .96, range: 235, proj: 'blob', pcol: '#8f6bff',
    sfx: 'whoosh', hit: 'hit_water', wind: .24, attackAnim: .34, animStyle: 'blotFlick', note: 'Splatters, and the splatter sticks.',
    onHit: (u, t, B) => { B.fxBlotSkill('flick', u, { target: t }); B.applyStatus(u, t, 'corrode', 5); } },
  skills: {
    W: {
      name: 'Ink Decoy', type: 'Magic Damage', energy: 100,
      v: { hp: .45, ratio: 1.05 }, p: { taunt: 4, slow: 3, life: 8 },
      desc: (S, P) => `<span class="sk-pas">Blot Jr. trails after Blot, tossing ink at the nearest enemy every 3s and applying 🧪 Corrode.</span>
        Active: Blot paints a lifelike decoy carrying <em>${pcn(S.hp * 100)}</em> of his Max HP, 🎭 Taunting everything near it for ${P.taunt}s. When it is destroyed or expires it bursts for <em>${pcn(S.ratio * 100)}</em> Magic and 🐢 Slows everything nearby for ${P.slow}s.`,
      passive: (u, B, S) => {
        B.after(.4, () => {
          if (!u.alive || (u._blotJr && u._blotJr.alive)) return;
          const jr = B.summon(u, {
            name: 'Blot Jr.', art: ASSET + 'Characters/Blot/Blotjr.png', hp: u.max.hp * (u.jrScale ? u.jrScale.hp : .30),
            scale: .62, life: 999, follow: u, tint: '#8f6bff', noSkills: true,
            onTick: (m) => B.every(m, 3, () => {
              if (!m.alive || !u.alive) return;
              const foes = B.enemiesOf(u); if (!foes.length) return;
              const t = B.nearest(m, foes); if (!t) return;
              B.fxBlotSkill('flick', m, { target: t });
              B.fxProj(m, t, { kind: 'blob', col: '#8f6bff' }, () => {
                Sound.play('blot_ink_burst', { vol: .22 });
                B.damage(u, t, u.st.mag * (u.jrScale ? u.jrScale.dmg : .30), { type: 'magic', tag: 'Blot Jr.' });
                B.applyStatus(u, t, 'corrode', 5);
              });
            })
          });
          u._blotJr = jr;
          Sound.play('summon', { vol: .5 });
        });
      },
      cast: (u, B, S, P) => {
        B.anim(u, 'cast', .72, 'blotDecoy'); Sound.play('blot_ink_cast', { vol: .42 });
        B.fxBlotSkill('decoy', u);
        const spawn = (offset, customX, customDepth) => {
          const m = B.summon(u, {
            name: 'Ink Decoy', art: ASSET + 'assets/fx/blot-decoy.png', hp: u.max.hp * S.hp,
            scale: .9, life: P.life, taunt: 260, tint: '#8f6bff', offset,
            x: customX, depth: customDepth,
            immovable: true, noSkills: true,
            onDeath: (decoy) => {
              Sound.play('blot_ink_burst', { vol: .42 }); B.fxBlotSkill('decoyBurst', decoy);
              B.aoe(u, decoy.x, 240, u.team, u.st.mag * S.ratio, { type: 'magic', tag: 'Ink Decoy' });
              B.aoeStatus(u, decoy.x, 240, 'slow', P.slow);
              if (u.inkPools) blotAddPool(u, B, decoy.x, 190);
            }
          });
          B.fxBlotSkill('decoySpawn', m);
          return m;
        };
        spawn(60);
        if (u.rarity >= 5 || u.inkPools) {
          const farFoe = B.farthestN(u, B.enemiesOf(u), 1)[0];
          const backX = farFoe ? clamp(farFoe.x - u.face * 30, B.leftWall + 40, B.rightWall - 40)
                               : clamp(u.x + u.face * 380, B.leftWall + 40, B.rightWall - 40);
          const backDepth = farFoe ? farFoe.depth : u.depth;
          spawn(0, backX, backDepth);
        }
      }
    },
    G: {
      name: 'Pantomime Wall', type: 'Shield', cd: 10,
      v: { shield: .70 }, p: { dur: 6, slow: 4 },
      desc: (S, P) => `Blot mimes a barricade. He and nearby allies gain a Shield worth <em>${pcn(S.shield * 100)}</em> of his Magic Defense for ${P.dur}s, and anything attacking through it loses Attack Speed for ${P.slow}s.`,
      ai: { prio: 56, cond: (u, B) => B.alliesOf(u).some(a => a.hpPct < .9) || !u.hasStatus('shield') },
      cast: (u, B, S, P) => {
        B.anim(u, 'cast', .62, 'blotWall'); Sound.play('blot_mime_wall', { vol: .34 });
        B.fxBlotSkill('wall', u, { dur: P.dur });
        B.alliesOf(u).forEach(a => {
          if (B.distance(a, u) > 300) return;
          B.shield(u, a, u.st.mdef * S.shield, P.dur);
          B.fxBlotSkill('shield', u, { target: a });
        });
        u._wallUntil = B.t + P.dur;
        if (!u._hasWallListener) {
          u._hasWallListener = true;
          B.on(u, 'allyDamaged', ev => {
            if (!u.alive || B.t > (u._wallUntil || 0) || !ev || !ev.src || !ev.src.alive || ev.src.team === u.team || ev.dot || ev.selfharm) return;
            if (ev.unit && B.distance(ev.unit, u) <= 320) {
              B.applyStatus(u, ev.src, 'slow', P.slow);
              if (B.t - (u._lastWallHitAt || 0) >= .25) {
                u._lastWallHitAt = B.t;
                B.fxBlotSkill('wallHit', u, { target: ev.src });
                Sound.play('blot_mime_wall', { vol: .24, throttle: 250 });
              }
            }
          });
        }
      }
    },
    B: {
      name: 'Slippery Trail', type: 'Magic Damage', cd: 14,
      v: { ratio: .30 }, p: { dur: 8 },
      desc: (S, P) => `An ink slick spreads under the highest-damage enemy for ${P.dur}s, dealing <em>${pcn(S.ratio * 100)}</em> Magic per second. Anything standing in it loses Accuracy and takes more physical damage.`,
      ai: { prio: 48, cond: () => true },
      cast: (u, B, S, P) => {
        const foes = B.enemiesOf(u); if (!foes.length) return;
        const t = foes.reduce((a, b) => {
          const aDmg = (a.dmgDone || 0) + Math.max(a.st.atk, a.st.mag);
          const bDmg = (b.dmgDone || 0) + Math.max(b.st.atk, b.st.mag);
          return bDmg > aDmg ? b : a;
        });
        B.anim(u, 'cast', .58, 'blotTrail'); Sound.play('blot_ink_cast', { vol: .3 });
        const cx = t.x;
        B.fxBlotSkill('trail', u, { x: cx, dur: P.dur });
        B.repeat(P.dur, 1, () => {
          if (!u.alive || B.over) return;
          B.enemiesOf(u).forEach(e => {
            if (!e.alive || Math.abs(e.x - cx) > 220) return;
            B.damage(u, e, u.st.mag * S.ratio, { type: 'magic', dot: true, tag: 'Slippery Trail' });
            B.applyStatus(u, e, 'blind', 2);
            B.applyStatus(u, e, 'exposed', 2);
            B.applyStatus(u, e, 'sticky', 2);
          });
        });
      }
    },
    P: {
      name: 'Silent Performance', type: 'Passive',
      v: {}, p: { max: 5, silence: 3 },
      desc: (S, P) => `Every time an enemy uses an offensive skill Blot gains 🤫 Mimicry (max ${P.max}), raising Evasion and cutting damage taken. At maximum stacks his next basic attack 🔇 Silences its target for ${P.silence}s and spends the stacks.`,
      passive: (u, B, S, P) => {
        B.on(u, 'enemyCast', () => {
          if (!u.alive) return;
          B.applyStatus(u, u, 'mimicry', 999, { stacks: 1 });
          const m = u.getStatus('mimicry');
          B.fxBlotSkill('mimic', u, { stacks: m ? m.stacks : 1 });
          Sound.play('blot_ink_cast', { vol: .16, throttle: 220 });
        });
        B.on(u, 'basicHit', ev => {
          if (!u.alive || !ev || !ev.target || !ev.target.alive) return;
          const m = u.getStatus('mimicry');
          if (!m || m.stacks < P.max) return;
          B.removeStatus(u, 'mimicry');
          B.applyStatus(u, ev.target, 'silence', P.silence);
          B.fxBlotSkill('silence', u, { target: ev.target });
          Sound.play('blot_mime_wall', { vol: .28, throttle: 120 });
        });
      }
    },
    R: {
      name: 'Grand Illusion', type: 'Summon Upgrade',
      v: {}, p: {},
      desc: () => `Ink Decoy now paints two decoys at once, one beside Blot and one in the enemy backline. Each burst leaves a lasting Ink Pool that continuously slows enemies and regenerates Energy for allies standing inside it.`,
      passive: (u) => { u.inkPools = true; u.jrScale = { hp: .45, dmg: .45 }; }
    }
  }
});

/* ============================================================ BRUSHA
   Magic DPS / Team Buffer - S Tier */
const BRUSHA_COLORS = ['#ff5fa8', '#5fd0ff', '#ffd166', '#9b7bff'];
defHero({
  id: 'Brusha', name: 'Brusha', folder: 'Brusha', file: 'Brusha', icon: 'Brusha',
  role: 'Damage', tier: 'S', element: 'Paint',
  blurb: 'Paints across the whole battlefield and expects everyone to stand where the colour is.',
  base: { hp: 3500, atk: 245, def: 198, mag: 450, mdef: 242, spd: 120, acc: 198, eva: 136 },
  hidden: { range: 290, aspd: 1.0, ms: 74, aggro: .85, crit: .22, critDmg: 1.75, healPow: 1, shieldPow: 1.15, cdr: .12, ccRes: .12, kbRes: .25, armorPen: 0, magPen: .24 },
  growth: { hp: .078, atk: .07, def: .070, mag: .106, mdef: .074 },
  move: { gait: 'glide', bob: 7, freq: 2.2, lean: 15, squash: .07, idle: 'sway', step: 'step_soft',
    particles: 'paint', pcol: '#ff5fa8', trail: { on: true, col: '#ff5fa8', rate: .06 }, brake: .3, smear: true },
  basic: { name: 'Quick Stroke', type: 'magic', ratio: 1.04, range: 290, proj: 'obj', pimg: 'paintbrush', pcol: '#ff5fa8',
    sfx: 'paint_swipe', hit: 'paint_splash',
    wind: .14, note: 'One confident line, straight through you.',
    onHit: (u, t, B) => {
      const at = u._brushaColor = ((u._brushaColor || 0) + 1) % BRUSHA_COLORS.length;
      B.fxPaintMark(t.x, t.y - 55, [BRUSHA_COLORS[at], BRUSHA_COLORS[(at + 1) % BRUSHA_COLORS.length]], .72);
      if (chance(.28)) B.applyStatus(u, t, 'defdown', 5);
    } },
  skills: {
    W: {
      name: 'Masterpiece Sweep', type: 'Magic Damage', energy: 100,
      v: { ratio: 1.82, atkBuff: .40, shield: .18 }, p: { dur: 7 },
      desc: (S, P) => `<span class="sk-pas">Brusha's canvas stays on the ground after every sweep.</span>
        Active: one enormous stroke across the whole field for <em>${pcn(S.ratio * 100)}</em> Magic to every enemy, leaving vibrant canvas for ${P.dur}s. While it is active, allies gain <em>${pcn(S.atkBuff * 100)}</em> Attack, Magic Attack, and Attack Speed, while enemies lose Magic Defense and Evasion. At Red rarity the paint covers everything: allies also gain a <em>${pcn(S.shield * 100)}</em> Max HP Shield and enemies are slowed.`,
      passive: () => {},
      cast: (u, B, S, P) => {
        B.anim(u, 'cast', .65); Sound.play('paint_swipe', { vol: .72 });
        B.fxPaintCast(u, BRUSHA_COLORS, 'masterpiece');
        B.after(.38, () => {
          Sound.play('paint_splash', { vol: .68 }); B.hitstop(90); B.shake(4, .2);
          B.fxPaintStroke(u, BRUSHA_COLORS, true);
          const full = u.rarity >= 5;
          B.fxPaintCanvas(u, P.dur, BRUSHA_COLORS, full);
          B.enemiesOf(u).forEach((e, i) => B.after(i * .045, () => {
            if (!e.alive) return;
            B.damage(u, e, u.st.mag * S.ratio, { type: 'magic', tag: 'Masterpiece Sweep' });
            B.applyStatus(u, e, 'magdown', P.dur, { stacks: 1 });
            B.applyStatus(u, e, 'evadown', P.dur);
            B.fxPaintMark(e.x, e.y - 48, BRUSHA_COLORS, 1.05);
          }));
          B.alliesOf(u).forEach(a => {
            B.applyStatus(u, a, 'atkup', P.dur, { stacks: 2 });
            B.applyStatus(u, a, 'speedup', P.dur, { stacks: 2 });
            B.applyStatus(u, a, 'magup', P.dur, { stacks: 1 });
            if (full) B.shield(u, a, u.max.hp * S.shield, P.dur);
          });
          if (full) B.enemiesOf(u).forEach(e => { B.applyStatus(u, e, 'slow', P.dur, { stacks: 2 }); });
        });
      }
    },
    G: {
      name: 'Color Palette', type: 'Buff', cd: 8,
      v: { en: 28 }, p: { dur: 10, count: 3 },
      desc: (S, P) => `Custom pigment for the ${P.count} highest-damage allies: 🖍 Vibrant Pigment for ${P.dur}s, worth 20% Crit Chance, plus Magic Attack, Haste, and <em>${Math.round(S.en)}</em> Energy each.`,
      ai: { prio: 56, cond: () => true },
      cast: (u, B, S, P) => {
        B.anim(u, 'cast', .48); Sound.play('paint_splash', { vol: .48 });
        B.fxPaintCast(u, BRUSHA_COLORS, 'palette');
        B.alliesOf(u).sort((a, b) => (b.st.atk + b.st.mag) - (a.st.atk + a.st.mag)).slice(0, P.count)
          .forEach((a, i) => B.after(.16 + i * .1, () => {
            if (!a.alive) return;
            const colors = [BRUSHA_COLORS[i % BRUSHA_COLORS.length], BRUSHA_COLORS[(i + 1) % BRUSHA_COLORS.length], BRUSHA_COLORS[(i + 2) % BRUSHA_COLORS.length]];
            B.fxPaintRibbon(u, a, colors);
            B.applyStatus(u, a, 'vibrant', P.dur); B.applyStatus(u, a, 'magup', P.dur); B.applyStatus(u, a, 'haste', P.dur);
            B.energy(a, S.en);
            B.fxSparkle(a.x, a.y - 40, 7, colors[0]);
          }));
      }
    },
    B: {
      name: 'Broad Stroke', type: 'Magic Damage', cd: 10,
      v: { ratio: 1.28 }, p: { dur: 6.5 },
      desc: (S, P) => `An ink-soaked brush sweeps forward for <em>${pcn(S.ratio * 100)}</em> Magic in a line, leaving enemies Smeared for ${P.dur}s with Defense and Magic Defense torn down.`,
      ai: { prio: 52, cond: () => true },
      cast: (u, B, S, P) => {
        const colors = ['#5fd0ff', '#9b7bff', '#ff5fa8'];
        B.anim(u, 'cast', .5); Sound.play('paint_swipe', { vol: .62 });
        B.fxPaintCast(u, colors, 'broad');
        B.after(.24, () => {
          B.fxPaintStroke(u, colors, false); B.shake(3, .14);
          B.enemiesOf(u).sort((a, b) => u.face * (a.x - b.x)).forEach((e, i) => B.after(i * .04, () => {
            if (!e.alive) return;
            B.damage(u, e, u.st.mag * S.ratio, { type: 'magic', tag: 'Broad Stroke' });
            B.applyStatus(u, e, 'defdown', P.dur, { stacks: 2 });
            B.applyStatus(u, e, 'magdown', P.dur, { stacks: 2 });
            B.fxPaintMark(e.x, e.y - 50, colors, .88);
          }));
        });
      }
    },
    P: {
      name: 'Creative Inspiration', type: 'Passive',
      v: { per: .055 }, p: { max: 12 },
      desc: (S, P) => `Whenever Brusha or any ally lands a critical hit she gains 🖼 Inspiration (max ${P.max}), worth <em>${pcn(S.per * 100)}</em> Magic Attack each. Allies also add a portion of her Magic to their basic attacks.`,
      passive: (u, B, S, P) => {
        B.on(u, 'allyDamageDealt', ev => {
          if (!ev.crit) return;
          const before = u.getStatus('inspiration'); const old = before ? before.stacks : 0;
          B.applyStatus(u, u, 'inspiration', 999, { stacks: 1 });
          const now = u.getStatus('inspiration'), stacks = Math.min(P.max, now ? now.stacks : old);
          if (stacks > old) {
            const at = stacks % BRUSHA_COLORS.length;
            B.fxPaintMark(u.x, u.y - 78, [BRUSHA_COLORS[at], BRUSHA_COLORS[(at + 1) % BRUSHA_COLORS.length]], .55);
            if (stacks === 1 || stacks % 3 === 0) B.fxFloatObject(u.x, u.y - 105, 'canvas', BRUSHA_COLORS[at]);
          }
        });
        B.on(u, 'allyBasic', ev => {
          const a = ev && ev.unit, i = u.getStatus('inspiration');
          if (!i || !a || a === u) return;
          const t = ev.target; if (!t || !t.alive) return;
          B.damage(u, t, u.st.mag * .055 * i.stacks, { type: 'magic', silent: true, tag: 'inspired paint' });
          if (B.t - (u._inspiredPaintFx || -99) > .22) {
            u._inspiredPaintFx = B.t;
            const at = i.stacks % BRUSHA_COLORS.length;
            B.fxPaintMark(t.x, t.y - 42, [BRUSHA_COLORS[at]], .46);
          }
        });
      }
    },
    R: {
      name: 'Masterwork Finish', type: 'Ultimate Upgrade',
      v: {}, p: {},
      desc: () => `Masterpiece Sweep now covers the entire field. While the paint is down allies carry a Shield and enemies standing on it lose Move and Attack Speed.`,
      passive: () => {}
    }
  }
});

/* ============================================================ LOOEY
   Risk DPS / High-Wire Performer - A Tier. Builds pressure by staying just
   inflated enough to turn a near-pop into a full circus finale. */
defHero({
  id: 'Looey', name: 'Looey', folder: 'Looey', file: 'Looey', icon: 'Looey',
  role: 'Damage', roleLabel: 'High-Wire Damage', tier: 'A', element: 'Helium',
  blurb: 'A circus balloon who turns every close call into more lift, more spectacle, and one very dangerous final pop.',
  base: { hp: 3500, atk: 414, def: 204, mag: 175, mdef: 204, spd: 134, acc: 196, eva: 165 },
  hidden: { range: 180, aspd: 1.18, ms: 96, aggro: .8, crit: .18, critDmg: 1.65, healPow: 1, shieldPow: 1, cdr: .08, ccRes: .10, kbRes: .1, armorPen: .12, magPen: 0 },
  growth: { hp: .070, atk: .094, def: .062, mag: .06, mdef: .064 },
  move: { gait: 'bounce', bob: 14, freq: 2.4, lean: 10, squash: .12, hover: 8, idle: 'drift', step: 'bounce',
    particles: 'none', pcol: '#ff8fb0', trail: { on: true, col: '#ff8fb0', rate: .07 }, brake: .25, sway: 10 },
  basic: { name: 'Bop', type: 'physical', ratio: .60, range: 180, sfx: 'swing_light', hit: 'hit_light',
    wind: .10, hits: 2, note: 'Two quick squeaky hits.',
    onHit: (u, t, B) => { if (chance(.15)) B.knockback(u, t, 14); } },
  skills: {
    W: {
      name: 'Helium Hustle', type: 'Physical Damage', energy: 100,
      v: { ratio: .38, popRatio: .72 }, p: { hits: 8, popAt: 5, popSlow: 3 },
      desc: (S, P) => `<span class="sk-pas">Taking direct damage grants 🎈 Inflated, increasing Looey's speed, Max HP, and damage reduction. During Big Top Performance, allied skill casts also feed him Inflated. Healing removes 2 stacks.</span>
        Active: he ricochets ${P.hits} times for <em>${pcn(S.ratio * 100)}</em> Attack per hit, with more damage per Inflated stack. At ${P.popAt} stacks, the final hit creates a 🎈 Final Pop for <em>${pcn(S.popRatio * 100)}</em> Attack in an area, Slows enemies, and spends 2 stacks.`,
      passive: (u, B) => {
        u._looeyShowCueAt = 0;
        u._looeyPopSave = false;
        B.on(u, 'damaged', ev => { if (!ev.dot) B.applyStatus(u, u, 'inflated', 999, { stacks: 1 }); });
        B.on(u, 'allyCast', ally => {
          if (!ally || ally === u || ally.team !== u.team || B.t >= (u._looeyShowUntil || 0) || B.t < u._looeyShowCueAt) return;
          u._looeyShowCueAt = B.t + 1.15;
          B.applyStatus(u, u, 'inflated', 999, { stacks: 1 });
          B.fxFloatIcon(u.x, u.y - 94, '🎈', '#ffb7d0');
        });
        B.on(u, 'lethal', ev => {
          if (ev.src === u || u._looeyPopSave) return;
          u._looeyPopSave = true; ev.prevented = true; u.hp = Math.max(1, u.max.hp * .18);
          u.invuln = Math.max(u.invuln || 0, B.t + .35);
          B.cleanse(u, 99);
          B.applyStatus(u, u, 'inflated', 999, { stacks: 2 });
          B.shield(u, u, u.max.hp * .12, 3.5);
          Sound.play('pop2', { vol: .62 }); B.fxBoom(u.x, u.y - 35, .95, '#fff4fb'); B.shake(7, .24);
          B.log('<b>Looey popped back into shape.</b>');
        });
      },
      cast: (u, B, S, P) => {
        const inf = (u.getStatus('inflated') || {}).stacks || 0;
        let last = null;
        B.anim(u, 'cast', .82, 'looeyInflate'); Sound.play('beam_charge', { vol: .22, throttle: 260 });
        B.fxLooeySkill('inflate', u, { stacks: inf });
        B.after(.34, () => {
          if (!u.alive) return;
          B.anim(u, 'attack', .72, 'looeyHustle'); Sound.play('bounce');
          B.repeat(P.hits, .13, i => {
            if (!u.alive || (u.flags && u.flags.noAct)) return;
            const foes = B.enemiesOf(u); if (!foes.length) return;
            const t = pick(foes);
            last = t;
            const dir = t.x < u.x ? -1 : 1;
            u.face = dir;
            B.blink(u, t.x - dir * 50, t.depth);
            Sound.play('hit_light', { vol: .55, rate: rnd(.9, 1.3), throttle: 12 });
            B.fxBoom(t.x, t.y - 40, .6, '#ff8fb0'); B.shake(4, .1);
            B.damage(u, t, u.st.atk * S.ratio * (1 + inf * .12), { type: 'physical', tag: 'Helium Hustle' });
            if (i === P.hits - 1 && inf >= P.popAt) B.after(.06, () => {
              if (!u.alive) return;
              const popX = (last && last.alive) ? last.x : (last ? last.x : u.x);
              const popY = (last && last.alive) ? last.y : (last ? last.y : u.y);
              Sound.play('pop2', { vol: .68 }); B.fxBoom(popX, popY - 42, 1.05, '#fff2fa'); B.shake(9, .22);
              B.aoe(u, popX, 190, u.team, u.st.atk * S.popRatio, { type: 'physical', area: true, tag: 'Final Pop' });
              B.aoeStatus(u, popX, 190, 'slow', P.popSlow);
              const stack = u.getStatus('inflated');
              if (stack) {
                stack.stacks = Math.max(0, stack.stacks - 2);
                if (stack.stacks <= 0) B.removeStatus(u, 'inflated');
                u.dirty = true;
              }
            });
          });
        });
      }
    },
    G: {
      name: 'Balloon Bounce', type: 'Physical Damage', cd: 8,
      v: { ratio: .55 }, p: { bounces: 4, selfCost: .04, launchStacks: 3 },
      desc: (S, P) => `Looey launches through up to ${P.bounces} different nearby enemies for <em>${pcn(S.ratio * 100)}</em> Attack, each bounce hitting harder than the last. At ${P.launchStacks}+ 🎈 Inflated stacks, each landing also knocks its target back. The final landing costs Looey <em>${pc(P.selfCost)}</em> max HP, recharging his Inflated state.`,
      ai: { prio: 56, cond: (u, B) => B.enemiesOf(u).length >= 1 },
      cast: (u, B, S, P) => {
        const inf = (u.getStatus('inflated') || {}).stacks || 0;
        const visited = new Set();
        B.anim(u, 'wind', .72, 'looeyBounce'); Sound.play('beam_charge', { vol: .20, throttle: 260 });
        B.fxLooeySkill('bounceWindup', u);
        B.after(.28, () => {
          if (!u.alive) return;
          B.anim(u, 'attack', .34, 'looeyLaunch'); Sound.play('bounce');
          B.repeat(P.bounces, .16, i => {
            if (!u.alive || (u.flags && u.flags.noAct)) return;
            const foes = B.nearestN(u, B.enemiesOf(u), P.bounces); if (!foes.length) return;
            const t = foes.find(e => !visited.has(e.uid)) || foes[i % foes.length];
            if (!t) return;
            visited.add(t.uid);
            const dir = t.x < u.x ? -1 : 1;
            u.face = dir;
            B.blink(u, t.x - dir * 48, t.depth);
            Sound.play('hit_blunt', { vol: .5, rate: 1 + i * .12, throttle: 12 });
            B.fxLooeySkill('bounceHit', u, { target: t });
            B.fxSlash(u, t, { col: '#ff8fb0', ang: rnd(-40, 40), small: true }); B.shake(4, .12);
            B.damage(u, t, u.st.atk * S.ratio * (1 + i * .35), { type: 'physical', tag: 'Balloon Bounce' });
            if (inf >= P.launchStacks) B.knockback(u, t, 56 + inf * 5);
            if (i === P.bounces - 1) {
              const selfDmg = Math.max(0, Math.min(u.hp - 1, u.max.hp * P.selfCost));
              if (selfDmg > 0) {
                B.damage(u, u, selfDmg, { type: 'true', selfharm: true, silent: true });
              } else {
                B.applyStatus(u, u, 'inflated', 999, { stacks: 1 });
              }
            }
          });
        });
      }
    },
    B: {
      name: 'Big Top Performance', type: 'Buff', cd: 15,
      v: {}, p: { dur: 8, damageTaken: .12 },
      desc: (S, P) => `Looey puts on a show for ${P.dur}s. Allies gain Move and Attack Speed; Looey gains double the bonus and an <em>8%</em> max-HP stage shield, but takes ${pc(P.damageTaken)} more damage. Every allied skill cast during the show grants Looey 🎈 Inflated (once per 1.2s).`,
      ai: { prio: 50, cond: (u, B) => B.enemiesOf(u).length >= 1 },
      cast: (u, B, S, P) => {
        const allies = B.alliesOf(u);
        B.anim(u, 'cast', 1.00, 'looeyShow'); Sound.play('cheer'); B.fxLooeySkill('show', u, { allies, dur: P.dur });
        B.after(.36, () => {
          if (!u.alive) return;
          B.fxConfetti(u.x, u.y - 60, 30);
          allies.forEach(a => B.applyStatus(u, a, 'speedup', P.dur));
          B.applyStatus(u, u, 'speedup', P.dur, { stacks: 2 });
          B.shield(u, u, u.max.hp * .08, P.dur);
          u.flat.dmgTaken4 = P.damageTaken;
          u._looeyShowUntil = B.t + P.dur;
          u.dirty = true;
          B.after(P.dur, () => {
            if (B.t >= (u._looeyShowUntil || 0)) {
              u.flat.dmgTaken4 = 0;
              u.dirty = true;
            }
          });
        });
      }
    },
    P: {
      name: 'Light As Air', type: 'Max HP',
      v: { eva: .45, aspd: .40, defLoss: .22, dmgGuard: .16 }, p: {},
      desc: (S) => `The emptier Looey gets the harder he is to hit: up to <em>${pcn(S.eva * 100)}</em> Evasion, <em>${pcn(S.aspd * 100)}</em> Attack Speed, and <em>${pcn(S.dmgGuard * 100)}</em> Damage Reduction at 1 HP. His Defense falls by up to <em>${pcn(S.defLoss * 100)}</em> over the same range, but the penalty is limited so a hit does not immediately pop him.`,
      passive: (u, B, S) => {
        B.every(u, .4, () => {
          if (!u.alive) return;
          const m = 1 - (u.hpPct || (u.hp / u.max.hp));
          u.flat.evaP3 = m * S.eva;
          u.flat.aspdP2 = m * S.aspd;
          u.flat.defP3 = -m * S.defLoss;
          u.flat.dmgTaken5 = -m * S.dmgGuard;
          u.dirty = true;
        });
      }
    },
    R: {
      name: 'The Greatest Show', type: 'Escalation',
      v: {}, p: { max: 8, heal: .08 },
      desc: (S, P) => `At ${P.max} 🎈 Inflated stacks Looey reaches Maximum Inflation: Basic Attacks pierce a nearby enemy, cooldowns recover <em>30%</em> faster, and he removes Slows. His first incoming debuff every 5.5s starts a 2.5s debuff-immunity window. A takedown restores <em>${pc(P.heal)}</em> max HP but spends 3 Inflated stacks. Healing to full ends Maximum Inflation.`,
      passive: (u, B, S, P) => {
        u.looeyStatusBlockAt = 0;
        u.looeyDebuffImmuneUntil = 0;
        u.guards = u.guards || [];
        if (!u._looeyRGuard) {
          u._looeyRGuard = true;
          u.guards.push((id, d, battle) => {
            const inf = (u.getStatus('inflated') || {}).stacks || 0;
            if (inf < P.max || !d || d.kind !== 'debuff') return false;
            if (id === 'slow' || (d && d.slow)) return true;
            if (battle.t < u.looeyDebuffImmuneUntil) return true;
            if (battle.t < u.looeyStatusBlockAt) return false;
            u.looeyStatusBlockAt = battle.t + 5.5;
            u.looeyDebuffImmuneUntil = battle.t + 2.5;
            B.applyStatus(u, u, 'ccimmune', 2.5);
            return true;
          });
        }
        B.every(u, .5, () => {
          if (!u.alive) return;
          const inf = (u.getStatus('inflated') || {}).stacks || 0;
          const maxed = inf >= P.max;
          u.pierce = maxed;
          u.flat.cdr4 = maxed ? .3 : 0;
          if (maxed) B.removeStatus(u, 'slow');
          if (u.hp >= u.max.hp - 1) B.removeStatus(u, 'inflated');
          u.dirty = true;
        });
        B.on(u, 'defeatedEnemy', () => {
          const inf = u.getStatus('inflated');
          if (!inf || inf.stacks < P.max) return;
          B.heal(u, u, u.max.hp * P.heal, { pure: true });
          inf.stacks = Math.max(0, inf.stacks - 3);
          if (inf.stacks <= 0) B.removeStatus(u, 'inflated');
          u.dirty = true;
        });
      }
    }
  }
});

/* ============================================================ RUDIE
   DPS / Assassin / Momentum Carry - SS Tier */
defHero({
  id: 'Rudie', name: 'Rudie', folder: 'Rudie', file: 'Rudie', icon: 'Rudie',
  role: 'Damage', tier: 'SS', element: 'Momentum',
  blurb: 'A hyperactive reindeer who turns movement into damage and refuses to slow down for anyone.',
  base: { hp: 3900, atk: 470, def: 235, mag: 175, mdef: 205, spd: 145, acc: 210, eva: 165 },
  hidden: { range: 185, aspd: 1.25, ms: 118, aggro: .85, crit: .22, critDmg: 1.85, healPow: 1, shieldPow: 1, cdr: .10, ccRes: .18, kbRes: .35, armorPen: .18, magPen: 0 },
  growth: { hp: .082, atk: .108, def: .076, mag: .06, mdef: .072 },
  move: { gait: 'sprint', bob: 7, freq: 3.4, lean: 26, squash: .09, idle: 'bounce', step: 'step',
    particles: 'dust', pcol: '#ffd166', trail: { on: true, col: '#ff5b7f', rate: .045 }, brake: .9, dashy: true },
  basic: { name: 'Antler Jab', type: 'physical', ratio: .62, range: 185, sfx: 'stab', hit: 'hit_slash', animStyle: 'rudieJab',
    wind: .08, hits: 2, note: 'Quick, low, and always moving forward.' },
  skills: {
    W: {
      name: 'Antler Rush', type: 'Physical Damage', energy: 100,
      v: { ratio: 1.55, perMo: .09 }, p: { kb: 90 },
      desc: (S, P) => `<span class="sk-pas">Moving and dealing damage builds 💨 Momentum, raising Attack Speed and Crit Chance. Being slowed or stunned strips it away.</span>
        Active: Rudie lowers his antlers and charges the length of the field, hitting everything for <em>${pcn(S.ratio * 100)}</em> Attack plus <em>${pcn(S.perMo * 100)}</em> per Momentum stack, knocking them aside and interrupting them. A kill during the charge grants extra Momentum.`,
      passive: (u, B) => {
        u._rudieMomentumX = u.x;
        B.every(u, .2, () => {
          const moved = Math.abs(u.x - (u._rudieMomentumX == null ? u.x : u._rudieMomentumX));
          if (moved >= 95) {
            B.applyStatus(u, u, 'momentum', 8, { stacks: Math.min(2, Math.floor(moved / 95)) });
            u._rudieMomentumX = u.x;
          }
        });
        B.on(u, 'statusApplied', ev => {
          if (ev.unit !== u) return;
          if (ev.id === 'slow' || ev.id === 'stun' || ev.id === 'root') {
            const m = u.getStatus('momentum');
            if (m) { m.stacks = Math.max(0, m.stacks - 3); u.dirty = true; if (!m.stacks) B.removeStatus(u, 'momentum'); }
          }
        });
        B.on(u, 'dealDamage', ev => {
          if (!ev || !ev.target || ev.target.team === u.team || ev.dot || ev.amount <= 0) return;
          B.applyStatus(u, u, 'momentum', 8, { stacks: 1 });
        });
      },
      cast: (u, B, S, P) => {
        const mo = (u.getStatus('momentum') || {}).stacks || 0;
        const maxed = mo >= (u.rudieMomentumCap || 10);
        B.anim(u, 'wind', .78, 'rudieRush'); Sound.play('rudie_wind', { vol: .42 }); Sound.play('dash', { vol: .42 }); Sound.play('brake', { delay: 560, vol: .28 });
        B.fxRudieSkill('rush', u, { dur: .78 });
        // A fully wound-up Rudie is meant to be unstoppable during the charge,
        // not merely harder to interrupt after it has already started.
        if (maxed) B.applyStatus(u, u, 'ccimmune', .92);
        const dest = u.face > 0 ? B.rightWall - 60 : B.leftWall + 60;
        const hit = new Set();
        B.dash(u, dest, .45, { lean: 34, onMove: () => B.enemiesOf(u).forEach(e => {
          if (hit.has(e) || B.distance(e, u) > 58) return;
          hit.add(e);
          Sound.play('hit_heavy', { vol: .48, throttle: 12 }); B.hitstop(50); B.shake(9, .2);
          B.fxRudieSkill('rushHit', u, { target: e, index: hit.size });
          B.fxSlash(u, e, { col: '#ffd166', ang: 0, big: true });
          B.interrupt(e);
          const before = e.alive;
          B.damage(u, e, u.st.atk * (S.ratio + S.perMo * mo), { type: 'physical', tag: 'Antler Rush' });
          B.knockback(u, e, P.kb);
          if (before && !e.alive) B.applyStatus(u, u, 'momentum', 10, { stacks: 3 });
        }) });
      }
    },
    G: {
      name: 'Hoofstep Barrage', type: 'Physical Damage', cd: 8,
      v: { ratio: .40 }, p: { hits: 5 },
      desc: (S, P) => `${P.hits} rapid kicks for <em>${pcn(S.ratio * 100)}</em> Attack each, every consecutive hit on the same target landing harder than the last. At maximum 💨 Momentum every third kick is a guaranteed critical hit.`,
      ai: { prio: 58, cond: () => true },
      cast: (u, B, S, P) => {
        const t = B.bestTarget(u); if (!t) return;
        B.anim(u, 'attack', .64, 'rudieHoof');
        Sound.play('rudie_hoofstep', { vol: .38 }); B.fxRudieSkill('hoof', u, { target: t });
        const mo = (u.getStatus('momentum') || {}).stacks || 0;
        B.repeat(P.hits, .1, i => {
          if (!t.alive) return;
          Sound.play('swing_light', { vol: .28, rate: 1 + i * .1, throttle: 10 });
          B.fxSlash(u, t, { col: '#ffd166', ang: -20 + i * 15, small: true });
          B.fxRudieSkill('hoofHit', u, { target: t, index: i });
          B.damage(u, t, u.st.atk * S.ratio * (1 + i * .22), {
            type: 'physical', tag: 'Hoofstep Barrage',
            forceCrit: mo >= (u.rudieMomentumCap || 10) && (i + 1) % 3 === 0
          });
          B.shake(3, .08);
        });
      }
    },
    B: {
      name: 'Red Nose Rush', type: 'Self Buff', cd: 14,
      v: { dmg: .30 }, p: { dur: 8 },
      desc: (S, P) => `Rudie surges for ${P.dur}s, gaining Attack Speed and Move Speed and dealing up to <em>${pcn(S.dmg * 100)}</em> bonus damage scaled by his 💨 Momentum. Every kill during it extends the duration.`,
      // The AI passes the Battle as the second condition argument. Rudie units
      // do not carry a `B` property, so reading u.B here made this skill fail
      // its condition every time and silently disabled Red Nose Rush.
      ai: { prio: 53, cond: (u, B) => !u._rushUntil || B.t > u._rushUntil },
      cast: (u, B, S, P) => {
        B.anim(u, 'cast', .72, 'rudieRedNose'); Sound.play('rudie_red_nose', { vol: .42 }); B.fxRudieSkill('boost', u, { dur: .72 }); B.fxAura(u, '#ff5b7f', P.dur);
        B.applyStatus(u, u, 'speedup', P.dur, { stacks: 3 });
        B.applyStatus(u, u, 'momentum', P.dur, { stacks: 1 });
        u._rushUntil = B.t + P.dur;
        // These hooks used to be installed on every cast, so repeated Red Nose
        // Rushes multiplied its damage ticks and kill-extension listeners.
        // Keep one lifetime hook and let it read the current rush window.
        if (!u._rudieRushTicker) {
          u._rudieRushTicker = true;
          const updateRushBonus = () => {
            const mo = (u.getStatus('momentum') || {}).stacks || 0;
            u.flat.dmgDealt4 = B.t < (u._rushUntil || 0) ? S.dmg * (mo / 10) : 0;
            u.dirty = true;
          };
          B.every(u, .5, () => {
            updateRushBonus();
          });
        }
        // Do not make the first attack wait for the periodic ticker.
        const moNow = (u.getStatus('momentum') || {}).stacks || 0;
        u.flat.dmgDealt4 = S.dmg * (moNow / 10); u.dirty = true;
        if (!u._rudieRushKillHook) {
          u._rudieRushKillHook = true;
          B.on(u, 'enemyDown', () => { if (B.t < (u._rushUntil || 0)) u._rushUntil += 2; });
        }
      }
    },
    P: {
      name: 'Born To Run', type: 'Max HP / Defense',
      v: { per: .028 }, p: {},
      desc: (S) => `Every 💨 Momentum stack grants <em>${pcn(S.per * 100)}</em> Defense and Damage Reduction. Above half Momentum his Move Speed cannot be dropped below normal, and taking a large hit immediately grants Momentum.`,
      passive: (u, B, S) => {
        B.every(u, .5, () => {
          const mo = (u.getStatus('momentum') || {}).stacks || 0;
          u.flat.defP4 = mo * S.per;
          u.flat.dmgTaken5 = -mo * S.per;
          if (mo >= 5) {
            B.applyStatus(u, u, 'rudiefooting', .6);
            B.removeStatus(u, 'slow');
          } else B.removeStatus(u, 'rudiefooting');
          if (u._rudieVisualMomentum !== mo) {
            u._rudieVisualMomentum = mo;
            if (mo) B.fxRudieSkill('momentum', u, { stacks: mo });
          }
          u.dirty = true;
        });
        B.on(u, 'damaged', ev => {
          if (ev.amount > u.max.hp * .10) B.applyStatus(u, u, 'momentum', 8, { stacks: 2 });
        });
      }
    },
    R: {
      name: 'The Fastest Delivery', type: 'Battle Opener',
      v: { cdmg: .40, trailHit: .22 }, p: { max: 12, trailDur: 5 },
      desc: (S, P) => `Rudie opens by charging the weakest enemy, leaving a burning trail that deals <em>${pcn(S.trailHit * 100)}</em> Attack to enemies who cross it. At maximum Momentum his basic attacks hit multiple enemies, his charges cannot be interrupted, and he gains <em>${pcn(S.cdmg * 100)}</em> Crit Damage. Every kill restores HP and cuts his cooldowns. If he would fall at maximum Momentum he gets one last charge first.`,
      passive: (u, B, S, P) => {
        u.rudieMomentumCap = P.max;
        u.rudieTrail = [];
        B.every(u, .35, () => {
          u.rudieTrail = (u.rudieTrail || []).filter(mark => mark.until > B.t);
          B.enemiesOf(u).forEach(e => {
            const mark = u.rudieTrail.find(m => Math.abs(m.x - e.x) < 92);
            if (!mark || e._rudieTrailHitAt && B.t - e._rudieTrailHitAt < .7) return;
            e._rudieTrailHitAt = B.t;
            B.damage(u, e, u.st.atk * S.trailHit, { type: 'physical', area: true, tag: 'Fastest Delivery trail' });
            B.applyStatus(u, e, 'burn', 2.2, { val: u.st.atk * S.trailHit * .18 });
          });
        });
        B.after(.5, () => {
          const t = B.lowestHp(B.enemiesOf(u)); if (!t) return;
          u.face = t.x >= u.x ? 1 : -1;
          B.anim(u, 'wind', .68, 'rudieOpener'); Sound.play('rudie_wind', { vol: .36 }); B.fxRudieSkill('opener', u, { dur: .68 });
          const markTrail = () => {
            const last = u.rudieTrail[u.rudieTrail.length - 1];
            if (!last || Math.abs(last.x - u.x) > 42) {
              u.rudieTrail.push({ x: u.x, until: B.t + P.trailDur });
              B.fxPool(u.x, 6, '#ff5b7f', 150);
            }
          };
          B.dash(u, t.x - u.face * 60, .3, { lean: 34, depth: t.depth, onMove: markTrail, onEnd: markTrail });
          B.after(.34, () => {
            if (!t.alive) return;
            Sound.play('hit_heavy', { vol: .48 }); B.shake(10, .3); B.fxRudieSkill('rushHit', u, { target: t, index: 1 });
            B.damage(u, t, u.st.atk * 1.2, { type: 'physical', tag: 'Fastest Delivery' });
            B.applyStatus(u, u, 'momentum', 8, { stacks: 1 });
            B.fxPool(u.x, 6, '#ff5b7f', 200);
          });
        });
        B.every(u, .5, () => {
          const mo = (u.getStatus('momentum') || {}).stacks || 0;
          const maxed = mo >= (u.rudieMomentumCap || P.max);
          u.pierce = maxed;
          u.flat.critDmg4 = maxed ? S.cdmg : 0;
          if (maxed) B.applyStatus(u, u, 'ccimmune', .7);
          u.dirty = true;
        });
        B.on(u, 'enemyDown', () => { B.heal(u, u, u.max.hp * .07, { pure: true }); B.reduceCd(u, 2.5); });
        B.on(u, 'lethal', ev => {
          const mo = (u.getStatus('momentum') || {}).stacks || 0;
          if (u._lastRun || mo < P.max) return;
          u._lastRun = true; ev.prevented = true; u.hp = 1; u.invuln = B.t + 1.6;
          Sound.play('suddendeath'); B.log('<b>One last run.</b>');
          HEROES.Rudie.skills.W.cast(u, B, B.scaled(u, 'W'), HEROES.Rudie.skills.W.p);
          B.after(1.5, () => { if (u.alive) B.kill(u); });
        });
      }
    }
  }
});

/* ============================================================ SHELLY
   Skill Power Support / Team Buffer / Strategist - S Tier */
defHero({
  id: 'Shelly', name: 'Shelly', folder: 'Shelly', file: 'Shelly', icon: 'Shelly',
  role: 'Support', tier: 'S', element: 'Discovery',
  blurb: 'A paleontologist who turns her team\'s abilities into something larger than they were designed to be.',
  base: { hp: 3700, atk: 190, def: 215, mag: 348, mdef: 292, spd: 112, acc: 182, eva: 120 },
  hidden: { range: 285, aspd: .92, ms: 68, aggro: .70, crit: .08, critDmg: 1.55, healPow: 1.20, shieldPow: 1.25, cdr: .16, ccRes: .18, kbRes: .3, armorPen: 0, magPen: .12 },
  growth: { hp: .086, atk: .068, def: .080, mag: .098, mdef: .088 },
  move: { gait: 'march', bob: 5, freq: 1.8, lean: 8, squash: .05, idle: 'tap', step: 'step',
    particles: 'dust', pcol: '#c9a87a', trail: { on: false }, brake: .4 },
  basic: { name: 'Field Notes', type: 'magic', ratio: .94, range: 285, proj: 'orb', pcol: '#c9a87a',
    sfx: 'whoosh', hit: 'hit_magic', wind: .22, note: 'She is writing all of this down.' },
  skills: {
    W: {
      name: 'Fossil Findings', type: 'Support', energy: 100,
      v: { power: 4, crit: .22 }, p: { dur: 10, full: 6 },
      desc: (S, P) => `<span class="sk-pas">Every time an enemy casts, Shelly gains 📊 Research on that enemy. Research makes incoming skills hit harder. At ${P.full} stacks the target is Fully Researched: its defenses are easier to pierce and abilities against it generate extra Energy.</span>
        Active: she reveals her findings. Every ally gains <em>${Math.round(S.power)}</em> stacks of ⚗ Skill Power and <em>${pcn(S.crit * 100)}</em> Crit Chance for ${P.dur}s. Fully Researched enemies lose up to two positive effects and are 🛑 Buff Sealed for ${P.dur}s, stopping their next hostile buff.`,
      passive: (u, B, S, P) => {
        const logResearch = e => {
          if (!e || !e.alive) return;
          B.applyStatus(u, e, 'research', 999, { stacks: 1 });
          const r = e.getStatus('research');
          if (r && r.stacks >= P.full && !e.hasStatus('fullyresearched')) {
            B.applyStatus(u, e, 'fullyresearched', 999);
            B.fxFloatObject(e.x, e.y - 104, 'Magifyingglass', '#d8b579');
            B.fxRing(e.x, e.y - 42, 112, '#d8b579', .42);
            Sound.play('get_rare', { vol: .38 });
          }
        };
        B.on(u, 'enemyCast', logResearch);
        B.on(u, 'allyDamageDealt', ev => {
          const r = ev.target.getStatus && ev.target.getStatus('research');
          if (!r) return;
          if (!ev.basic && r.stacks >= P.full) B.energy(ev.src, 2);
        });
      },
      cast: (u, B, S, P) => {
        // Give the fossil explanation a full extra ~25 frames to read in the
        // battle pose and in the skill preview.
        B.anim(u, 'cast', 1.04, 'shellyResearch');
        B.fxFloatObject(u.x + u.face * 22, u.y - 108, 'Magifyingglass', '#d8b579');
        Sound.play('lock'); Sound.play('ult', { delay: 120 });
        B.after(.32, () => {
          B.tint('#c9a87a', .2, .5); B.fxRing(u.x, u.y - 40, 480, '#c9a87a', .7);
          B.alliesOf(u).forEach(a => {
            B.applyStatus(u, a, 'skillpower', P.dur, { stacks: Math.round(S.power) });
            B.applyStatus(u, a, 'lucky', P.dur);
            B.applyStatus(u, a, 'findings', P.dur);
            B.fxSparkle(a.x, a.y - 40, 12, '#c9a87a');
          });
          B.enemiesOf(u).filter(e => e.hasStatus('fullyresearched')).forEach(e => {
            B.dispel(e, 2);
            B.applyStatus(u, e, 'buffsealed', P.dur, { stacks: 1 });
            B.fxRing(e.x, e.y - 38, 94, '#e8c98f', .38);
          });
        });
      }
    },
    G: {
      name: 'Inspiration', type: 'Buff', cd: 11,
      v: {}, p: { dur: 10 },
      desc: (S, P) => `The team becomes 🌞 Inspired for ${P.dur}s: Skill Power, cooldown recovery, Energy generation and healing all rise. Any ally defeating an enemy while Inspired extends the duration.`,
      passive: (u, B) => {
        B.on(u, 'enemyDown', () => {
          if (B.t > (u._inspUntil || 0)) return;
          u._inspUntil += 3;
          B.alliesOf(u).forEach(a => {
            const s = a.getStatus('inspired');
            if (s) s.t = Math.min(s.t + 3, 18);
          });
          B.fxConfetti(u.x, u.y - 50, 12);
        });
      },
      ai: { prio: 58, cond: () => true },
      cast: (u, B, S, P) => {
        B.anim(u, 'cast', 1.00, 'shellyInspire'); Sound.play('cheer');
        B.fxAura(u, '#f2cf77', P.dur);
        B.alliesOf(u).forEach(a => {
          B.applyStatus(u, a, 'inspired', P.dur);
          B.fxSparkle(a.x, a.y - 48, 9, '#f2cf77');
        });
        u._inspUntil = B.t + P.dur;
      }
    },
    B: {
      name: 'Problem Solver', type: 'Utility', cd: 12,
      v: { shield: .85, heal: .5 }, p: { dur: 8 },
      desc: (S, P) => `Shelly reads the battlefield and hands the ally who needs it most exactly one solution: Offensive (⚗ Skill Power and Crit), Defensive (Damage Reduction and a <em>${pcn(S.shield * 100)}</em> Magic Shield), or Recovery (Energy restored and cooldowns cut). She always picks correctly.`,
      ai: { prio: 55, cond: () => true },
      cast: (u, B, S, P) => {
        const allies = B.alliesOf(u); if (!allies.length) return;
        const hurt = allies.filter(a => a.hpPct < .66).sort((a, b) => a.hpPct - b.hpPct)[0];
        const starved = allies.filter(a => a.energy < 35).sort((a, b) => a.energy - b.energy)[0];
        const carry = allies.slice().sort((a, b) => (b.st.atk + b.st.mag) - (a.st.atk + a.st.mag))[0];
        const cooldownNeed = allies.filter(a => Object.values(a.cds || {}).some(v => v > 5)).sort((a, b) =>
          Math.max(...Object.values(b.cds || {}), 0) - Math.max(...Object.values(a.cds || {}), 0))[0];
        B.anim(u, 'cast', .90, 'shellySolution');
        if (hurt) {
          Sound.play('guard');
          B.shield(u, hurt, u.st.mag * S.shield, P.dur);
          B.applyStatus(u, hurt, 'ward', P.dur);
          B.fxFloatObject(hurt.x, hurt.y - 104, 'Magifyingglass', '#86d5e8');
          B.fxFloatIcon(hurt.x, hurt.y - 90, '🛡', '#86d5e8');
        } else if (starved || cooldownNeed) {
          const target = starved || cooldownNeed;
          Sound.play('cleanse');
          B.energy(target, 60); B.reduceCd(target, 5);
          B.fxFloatObject(target.x, target.y - 104, 'Magifyingglass', '#a8dfb5');
          B.fxFloatIcon(target.x, target.y - 90, '🔋', '#a8dfb5');
        } else if (carry) {
          Sound.play('buff');
          B.applyStatus(u, carry, 'skillpower', P.dur, { stacks: 5 });
          B.applyStatus(u, carry, 'lucky', P.dur);
          B.fxFloatObject(carry.x, carry.y - 104, 'Magifyingglass', '#e0b6ff');
          B.fxFloatIcon(carry.x, carry.y - 90, '⚗', '#e0b6ff');
        }
      }
    },
    P: {
      name: "Paleontologist's Passion", type: 'Skill Power',
      v: {}, p: { max: 8 },
      desc: (S, P) => `Every ally skill cast grants Shelly 📈 Excitement (max ${P.max}), raising the whole team's Skill Power. At maximum stacks the next ally skill deals greatly increased damage, costs less Energy and has its cooldown reduced after use. Excitement slowly decays when nobody casts.`,
      passive: (u, B, S, P) => {
        B.on(u, 'allyCast', a => {
          if (u._passionJustUsed === B.t) { u._passionJustUsed = -1; return; }
          u._shellyLastSkillAt = B.t;
          B.applyStatus(u, u, 'excitement', 999, { stacks: 1 });
          const e = u.getStatus('excitement');
          B.anim(u, 'cast', .26, 'shellyPassion');
          B.fxFloatIcon(u.x, u.y - 100, e && e.stacks >= P.max ? '💡' : '📈', '#e8c98f');
          if (e && e.stacks >= P.max) u._passionReady = true;
        });
        B.on(u, 'allyDamageDealt', ev => {
          const e = u.getStatus('excitement');
          if (e && !ev.basic) ev.amount *= 1 + .025 * e.stacks;
        });
        B.on(u, 'allySkillStarting', ev => {
          if (!u._passionReady || !ev.unit || !ev.unit.alive) return;
          u._passionReady = false; u._passionJustUsed = B.t;
          B.removeStatus(u, 'excitement');
          ev.passion = true; ev.costDiscount = 18;
          B.applyStatus(u, ev.unit, 'passionboost', 1.8);
          B.anim(u, 'cast', .44, 'shellyPassion');
          Sound.play('get_rare'); B.fxFloatIcon(ev.unit.x, ev.unit.y - 100, '💡', '#ffe39a');
        });
        B.every(u, 1.8, () => {
          const e = u.getStatus('excitement');
          if (!e || B.t - (u._shellyLastSkillAt || -99) < 1.8) return;
          e.stacks--; e.t = 999; u.statusVersion++; u.dirty = true;
          if (e.stacks <= 0) B.removeStatus(u, 'excitement');
        });
      }
    },
    R: {
      name: 'Greatest Discovery', type: 'Battle Opener',
      v: { power: 3, pen: .20 }, p: { need: 4 },
      desc: (S, P) => `Shelly opens the Field Lab: at the start of each wave, every ally receives a brief Skill Power and Crit boost while the Lab grants permanent ⚗ Skill Power, faster cooldowns, <em>${pcn(S.pen * 100)}</em> Penetration and stronger healing. After ${P.need} ally ultimates the Lab becomes the Ancient Archive, granting a large Skill Power surge, uninterruptible skills and bonus damage on each ally's first skill. Any ally falling below half HP is automatically Inspired.`,
      passive: (u, B, S, P) => {
        B.after(.4, () => {
          B.alliesOf(u).forEach(a => {
            B.applyStatus(u, a, 'skillpower', 999, { stacks: Math.round(S.power) });
            B.applyStatus(u, a, 'haste', 999, { stacks: 1 });
            a.flat.magPen = (a.flat.magPen || 0) + S.pen;
            a.flat.armorPen = (a.flat.armorPen || 0) + S.pen;
            a.dirty = true;
          });
          B.alliesOf(u).forEach(a => {
            B.applyStatus(u, a, 'skillpower', 6, { stacks: 1 });
            B.applyStatus(u, a, 'lucky', 6);
            B.fxSparkle(a.x, a.y - 48, 8, '#e8c98f');
          });
          B.fxPool(B.avgX(B.alliesOf(u)), 999, '#c9a87a', 420);
          B.fxFloatObject(u.x + u.face * 22, u.y - 112, 'Magifyingglass', '#c9a87a');
          B.fxAura(u, '#c9a87a', 999);
        });
        B.on(u, 'allyUltimate', () => {
          u.breakthrough = (u.breakthrough || 0) + 1;
          if (u.breakthrough < P.need || u._archiveActive) return;
          u._archiveActive = true;
          B.log('<b>The Ancient Archive opens.</b>'); Sound.play('suddendeath');
          B.anim(u, 'cast', .9, 'shellyArchive');
          B.tint('#c9a87a', .3, 1);
          B.alliesOf(u).forEach(x => {
            B.applyStatus(u, x, 'skillpower', 999, { stacks: 10 });
            B.applyStatus(u, x, 'ccimmune', 999);
            B.applyStatus(u, x, 'archivefirst', 999);
          });
          B.fxRing(u.x, u.y - 42, 520, '#e8c98f', 1.1);
          B.fxFloatObject(u.x + u.face * 22, u.y - 112, 'Book', '#e8c98f');
        });
        B.on(u, 'allySkillStarting', ev => {
          if (!u._archiveActive || !ev.unit || !ev.unit.hasStatus('archivefirst')) return;
          B.removeStatus(ev.unit, 'archivefirst');
          B.applyStatus(u, ev.unit, 'archivebonus', 2.2);
          B.fxFloatObject(ev.unit.x, ev.unit.y - 108, 'Book', '#e8c98f');
          B.fxRing(ev.unit.x, ev.unit.y - 38, 110, '#e8c98f', .42);
        });
        B.on(u, 'allyDamaged', ev => {
          const a = ev && ev.unit;
          const projectedHp = a && Math.max(0, a.hp - Math.max(0, (ev.amount || 0) - a.shieldTotal));
          if (!a || (a.hpPct >= .5 && projectedHp / a.max.hp >= .5) || (a._archiveInsp && B.t - a._archiveInsp < 10)) return;
          a._archiveInsp = B.t;
          B.applyStatus(u, a, 'inspired', 8);
          B.fxSparkle(a.x, a.y - 54, 10, '#f2cf77');
        });
      }
    }
  }
});

/* ============================================================ SHRIMPO
   Melee Burst DPS / Aggro Disruptor - C Tier
   He wants to be hit. That is the whole design. */
defHero({
  id: 'Shrimpo', name: 'Shrimpo', folder: 'Shrimpo', file: 'Shrimpo', icon: 'Shrimpo',
  role: 'Damage', tier: 'C', element: 'Rage',
  blurb: 'Furious, fragile, and impossible to ignore. He drags every attack onto himself and gets stronger for it.',
  base: { hp: 3100, atk: 445, def: 155, mag: 130, mdef: 145, spd: 128, acc: 185, eva: 105 },
  hidden: { range: 170, aspd: 1.24, ms: 92, aggro: 3.0, crit: .20, critDmg: 1.95, healPow: 1, shieldPow: 1, cdr: .10, ccRes: .08, kbRes: .15, armorPen: .22, magPen: 0 },
  growth: { hp: .070, atk: .104, def: .056, mag: .05, mdef: .056 },
  move: { gait: 'skitter', bob: 5, freq: 3.8, lean: 20, squash: .11, idle: 'seethe', step: 'step',
    particles: 'none', pcol: '#ff6b6b', trail: { on: true, col: '#ff6b6b', rate: .05 }, brake: .9, jitter: 3 },
  basic: { name: 'Angry Jab', type: 'physical', ratio: .55, range: 170, sfx: 'stab', hit: 'hit_light',
    wind: .07, hits: 2, note: 'Two furious little jabs.',
    onHit: (u, t, B) => { B.applyStatus(u, t, 'taunt', 1.6); } },
  skills: {
    W: {
      name: 'Temper Tantrum', type: 'Physical Damage', energy: 100,
      v: { ratio: .55 }, p: { dur: 3, ticks: 6, aspd: .60, defLoss: .30 },
      desc: (S, P) => `<span class="sk-pas">Shrimpo generates far more threat than anyone else on the field.</span>
        Active: he thrashes in place for ${P.dur}s, dealing <em>${pcn(S.ratio * 100)}</em> Attack per tick to everything adjacent and forcing them all to 🎭 target him. He gains <em>${pc(P.aspd)}</em> Attack Speed but loses <em>${pc(P.defLoss)}</em> of both Defenses for the duration.`,
      passive: (u) => { u.flat.aggro = 2.0; },
      cast: (u, B, S, P) => {
        B.anim(u, 'cast', P.dur, 'shrimpoThrash'); Sound.play('warn'); Sound.play('swing_heavy', { vol: .34, throttle: 180 });
        B.fxShrimpoTantrumStart(u, P.dur);
        u.flat.aspdP2 = P.aspd; u.flat.defP = -P.defLoss; u.flat.mdefP = -P.defLoss; u.dirty = true;
        if (u.rarity >= 5) B.applyStatus(u, u, 'ccimmune', P.dur);
        B.repeat(P.ticks, P.dur / P.ticks, () => {
          Sound.play('swing_light', { vol: .5, throttle: 12 });
          B.shake(5, .12); B.fxShrimpoTantrumHit(u);
          B.enemiesOf(u).forEach(e => {
            if (B.distance(e, u) > 220) return;
            B.damage(u, e, u.st.atk * S.ratio, { type: 'physical', melee: true, tag: 'Temper Tantrum' });
            B.applyStatus(u, e, 'taunt', P.dur);
          });
        });
        B.after(P.dur, () => { u.flat.aspdP2 = 0; u.flat.defP = 0; u.flat.mdefP = 0; u.dirty = true; });
      }
    },
    G: {
      name: "Bully 'Em", type: 'Physical Damage', cd: 8,
      v: { ratio: 1.35 }, p: { thr: .35, stun: 2, kb: 110 },
      desc: (S, P) => `Shrimpo charges the enemy on the lowest HP percentage for <em>${pcn(S.ratio * 100)}</em> Attack and knocks them back. Below ${pc(P.thr)} HP it is a guaranteed critical hit and 😵 Stuns them for ${P.stun}s.`,
      ai: { prio: 60, cond: () => true },
      cast: (u, B, S, P) => {
        const t = B.lowestHp(B.enemiesOf(u)); if (!t) return;
        const finisher = t.hpPct < P.thr;
        B.anim(u, 'wind', .72, 'shrimpoPunchWindup'); Sound.play('warn', { vol: .34 });
        B.after(.34, () => {
          if (!u.alive || !t.alive) return;
          B.anim(u, 'attack', .38, 'shrimpoPunchCharge'); Sound.play('dash', { vol: .52 });
          B.dash(u, t.x - u.face * 55, .2, { depth: t.depth });
        });
        B.after(.54, () => {
          if (!u.alive || !t.alive) return;
          Sound.play(finisher ? 'crit' : 'hit_heavy'); B.hitstop(finisher ? 130 : 70); B.shake(finisher ? 16 : 9, .3);
          B.fxShrimpoBully(u, t, finisher);
          B.damage(u, t, u.st.atk * S.ratio, { type: 'physical', melee: true, forceCrit: finisher, tag: "Bully 'Em" });
          if (finisher) B.applyStatus(u, t, 'stun', P.stun);
          B.knockback(u, t, P.kb);
        });
      }
    },
    B: {
      name: 'Pure Spite', type: 'True Damage', cd: 0,
      v: { burst: 3.2 }, p: { max: 10, steal: .5 },
      desc: (S, P) => `<span class="sk-pas">Every hit Shrimpo takes grants 🤬 Spite, up to ${P.max}, each worth 4% Attack. At ${P.max} stacks his next basic attack spends them all for <em>${pcn(S.burst * 100)}</em> Attack as True Damage, healing him for <em>${pc(P.steal)}</em> of it.</span>`,
      passive: (u, B, S, P) => {
        B.on(u, 'damaged', ev => {
          if (ev.dot) return;
          const oldStacks = (u.getStatus('spite') || {}).stacks || 0;
          B.applyStatus(u, u, 'spite', 999, { stacks: 1 });
          const stacks = Math.min(P.max, (u.getStatus('spite') || {}).stacks || 1);
          if (stacks >= P.max && oldStacks < P.max) Sound.play('ult_ready', { vol: .42, throttle: 600 });
          if (!u._spiteFxAt || B.t - u._spiteFxAt > .16) {
            u._spiteFxAt = B.t; B.anim(u, 'wind', .24, 'shrimpoSpiteGain'); B.fxShrimpoSpiteGain(u, stacks, P.max);
          }
        });
        B.on(u, 'basicHit', ev => {
          const s = u.getStatus('spite');
          if (!s || s.stacks < P.max) return;
          B.removeStatus(u, 'spite');
          B.anim(u, 'attack', .58, 'shrimpoSpiteBurst'); B.fxShrimpoSpiteBurst(u, ev.target);
          Sound.play('crit'); B.hitstop(140); B.shake(18, .45); B.flash('#ff2b2b', .5, .3);
          const out = B.damage(u, ev.target, u.st.atk * S.burst, { type: 'true', tag: 'Pure Spite', forceCrit: true });
          if (out) B.heal(u, u, out.amount * P.steal, { pure: true });
        });
      }
    },
    P: {
      name: 'Aggro Magnet', type: 'Threat',
      v: { per: .10 }, p: {},
      desc: (S) => `Enemy targeting always prefers Shrimpo over the allies behind him. For every enemy currently aiming at him he gains <em>${pcn(S.per * 100)}</em> Attack Speed.`,
      passive: (u, B, S) => {
        u.flat.aggro2 = 2.5;
        B.every(u, .5, () => {
          const n = B.enemiesOf(u).filter(e => e.target === u).length;
          u.flat.aspdP = n * S.per; u.dirty = true;
        });
      }
    },
    R: {
      name: 'Short Fuse', type: 'Death Trigger',
      v: {}, p: { dur: 3 },
      desc: (S, P) => `Temper Tantrum now grants immunity to crowd control while it runs. On taking a lethal blow Shrimpo refuses to go down for ${P.dur}s, becoming invulnerable with doubled Attack Speed before he finally faints.`,
      passive: (u, B, S, P) => {
        B.on(u, 'lethal', ev => {
          if (u._fuse) return;
          u._fuse = true; ev.prevented = true; u.hp = 1; u.invuln = B.t + P.dur;
          Sound.play('warn'); Sound.play('suddendeath', { vol: .52, priority: true }); B.flash('#ff2b2b', .5, .4); B.log('<b>Shrimpo is not finished.</b>');
          u.flat.aspdP3 = 1.0; u.dirty = true;
          B.enemiesOf(u).forEach(e => B.applyStatus(u, e, 'taunt', P.dur));
          B.after(P.dur, () => { if (u.alive) B.kill(u); });
        });
      }
    }
  }
});

/* ============================================================ TOODLES
   DPS / Support Tank / Adaptive Fighter - S Tier */
defHero({
  id: 'Toodles', name: 'Toodles', folder: 'Toodles', file: 'Toodles', icon: 'Toodles',
  role: 'Damage', tier: 'S', element: 'Luck',
  blurb: 'Refuses to be underestimated and refuses to be one thing. Whatever the team lacks, she becomes.',
  base: { hp: 4450, atk: 375, def: 280, mag: 272, mdef: 260, spd: 122, acc: 188, eva: 145 },
  hidden: { range: 215, aspd: 1.05, ms: 82, aggro: 1.15, crit: .16, critDmg: 1.70, healPow: 1.15, shieldPow: 1.32, cdr: .14, ccRes: .22, kbRes: .42, armorPen: .10, magPen: .10 },
  growth: { hp: .094, atk: .090, def: .086, mag: .080, mdef: .080 },
  move: { gait: 'bounce', bob: 9, freq: 2.2, lean: 8, squash: .08, idle: 'tumble', step: 'bounce',
    particles: 'sparkle', pcol: '#ffe27a', trail: { on: true, col: '#ffe27a', rate: .08 }, brake: .35 },
  basic: { name: 'Rolling Swing', type: 'physical', ratio: 1.10, range: 215, sfx: 'swing_light', hit: 'hit_blunt', animStyle: 'toodlesSwing', attackAnim: .30, pcol: '#ffb3d8',
    wind: .16, note: 'Whatever is nearest, swung with confidence.',
    onHit: (u, t, B) => { if (chance(.15)) B.luckyBoost(u); } },
  skills: {
    W: {
      name: "Beginner's Luck", type: 'Buff', energy: 100,
      v: {}, p: { dur: 11 },
      desc: (S, P) => `<span class="sk-pas">Whenever Toodles or an ally gains a friendly buff, Toodles has a 20% chance to roll one Lucky Boost: Damage, Defense, Speed, or Support.</span>
        Active: she rolls a Lucky Boost for ${P.dur}s. Damage grants 2 stacks of ⚔ Attack Up; Defense grants 3 stacks of 🧱 Fortify and 🛡 Ward; Speed grants 2 stacks of 🏃 Speed Up; Support grants 📣 Rally and 🔋 Overcharge.`,
      passive: (u, B) => {
        u.lastBoost = null;
        B.on(u, 'statusApplied', ev => {
          if (!STATUS[ev.id] || STATUS[ev.id].kind !== 'buff' || !ev.unit || ev.unit.team !== u.team || !ev.src || ev.src.team !== u.team) return;
          if (chance(.20)) B.luckyBoost(u);
        });
      },
      cast: (u, B, S, P) => {
        B.anim(u, 'cast', .82, 'toodlesLuckRoll'); Sound.play('toodles_gamble', { vol: .62 }); Sound.play('coin', { vol: .34, delay: 160, throttle: 180 });
        ['⚔', '🛡', '🏃', '💚'].forEach((icon, i) => B.after(.08 + i * .07, () => {
          if (u.alive) B.fxFloatIcon(u.x + (i - 1.5) * 22, u.y - 88 - (i % 2) * 13, icon, '#ffb5d8');
        }));
        B.fxRing(u.x, u.y - 36, 86, '#ffe27a');
        B.luckyBoost(u, P.dur);
      }
    },
    G: {
      name: 'Lucky Strike', type: 'Physical Damage', cd: 7.5,
      v: { ratio: 1.34 }, p: { dur: 7 },
      desc: (S, P) => `Toodles rushes the enemy with the highest Attack for <em>${pcn(S.ratio * 100)}</em> damage and 🥀 Weakens them for ${P.dur}s. Her current Lucky Boost adds a second effect: Damage crits, Defense shields her, Speed strikes twice, Support restores an ally's Energy.`,
      ai: { prio: 57, cond: () => true },
      cast: (u, B, S, P) => {
        const t = B.highestStat(B.enemiesOf(u), 'atk'); if (!t) return;
        const boost = u.lastBoost;
        B.anim(u, 'wind', .52, 'toodlesLuckyStrike'); Sound.play('dash'); Sound.play('sweep', { vol: .26, throttle: 120 });
        B.fxTargetLine(u, t, '#ff9dd0');
        B.dash(u, t.x - u.face * 55, .2, { depth: t.depth });
        const strike = (crit) => {
          Sound.play('hit_heavy', { throttle: 10 }); B.hitstop(80); B.shake(10, .28);
          B.fxSlash(u, t, { col: '#ffe27a', ang: -30, big: true });
          B.damage(u, t, u.st.atk * S.ratio, { type: 'physical', forceCrit: crit, tag: 'Lucky Strike' });
          B.applyStatus(u, t, 'weaken', P.dur, { stacks: 2 });
        };
        B.after(.24, () => {
          strike(boost === 'damage');
          if (boost === 'speed') B.after(.16, () => strike(false));
          if (boost === 'defense') B.shield(u, u, u.max.hp * .22, 8);
          if (boost === 'support') { const a = B.lowestHp(B.alliesOf(u)); if (a) B.energy(a, 50); }
        });
      }
    },
    B: {
      name: 'Small Miracle', type: 'Shield', cd: 10,
      v: { shield: .23 }, p: { dur: 9, thr: .55 },
      desc: (S, P) => `The weakest ally gains a Shield worth <em>${pcn(S.shield * 100)}</em> of Toodles' Max HP and up to three debuffs are stripped. Below ${pc(P.thr)} HP, that Shield is 20% stronger and they gain 2 stacks of 🏃 Speed Up plus 🛡 Ward.`,
      ai: { prio: 56, cond: (u, B) => B.alliesOf(u).some(a => a.hpPct < .85) },
      cast: (u, B, S, P) => {
        const t = B.lowestHp(B.alliesOf(u)); if (!t) return;
        B.anim(u, 'cast', .68, 'toodlesMiracle'); Sound.play('toodles_gamble', { vol: .34 }); Sound.play('cleanse', { vol: .35 });
        B.shield(u, t, u.max.hp * S.shield * (t.hpPct < P.thr ? 1.2 : 1), P.dur);
        B.cleanse(t, 3);
        if (t.hpPct < P.thr) { B.applyStatus(u, t, 'speedup', P.dur, { stacks: 2 }); B.applyStatus(u, t, 'ward', P.dur); }
        B.fxRing(t.x, t.y - 40, 104, '#ffe27a'); B.fxSparkle(t.x, t.y - 66, 8, '#fff5bd');
      }
    },
    P: {
      name: 'Always Improving', type: 'Max HP / Defense',
      v: { per: .06 }, p: {},
      desc: (S) => `Every Lucky Boost grants nearby allies one stack of its matching buff. Defense’s 🛡 Ward and Support’s 🔋 Overcharge remain with Toodles. Each different Boost she has rolled permanently adds <em>${pcn(S.per * 100)}</em> Max HP and Defense plus 2.5% Attack Speed for the battle.`,
      passive: (u, B, S) => {
        u.boostShare = true; u.boostSeen = {};
        B.on(u, 'luckyBoost', kind => {
          if (u.boostSeen[kind]) return;
          u.boostSeen[kind] = 1;
          const n = Object.keys(u.boostSeen).length;
          u.flat.hpP = n * S.per; u.flat.defP2 = n * S.per; u.flat.aspdP2 = n * .025; u.dirty = true;
        });
      }
    },
    R: {
      name: 'Lucky Charm', type: 'Upgrade',
      v: {}, p: {},
      desc: () => `Toodles can never roll the same Lucky Boost twice in a row.`,
      passive: (u) => { u.noRepeatBoost = true; }
    }
  }
});

/* ============================================================ YATTA
   Combo DPS / Festival Finisher - S Tier. Builds a visible celebration loop,
   then cashes it out against targets she has already thrown off rhythm. */
defHero({
  id: 'Yatta', name: 'Yatta', folder: 'Yatta', file: 'Yatta', icon: 'Yatta',
  role: 'Damage', roleLabel: 'Festival Finisher', tier: 'S', element: 'Festival',
  blurb: 'A piñata performer who turns every beat, dodge, and dizzy opponent into one bigger festival finish.',
  base: { hp: 3600, atk: 460, def: 210, mag: 190, mdef: 195, spd: 138, acc: 200, eva: 172 },
  hidden: { range: 190, aspd: 1.28, ms: 100, aggro: .85, crit: .24, critDmg: 1.80, healPow: 1, shieldPow: 1, cdr: .10, ccRes: .14, kbRes: .25, armorPen: .16, magPen: 0 },
  growth: { hp: .080, atk: .106, def: .072, mag: .062, mdef: .070 },
  move: { gait: 'bounce', bob: 12, freq: 2.8, lean: 14, squash: .11, idle: 'bounce', step: 'bounce',
    particles: 'confetti', pcol: '#ff8fb0', trail: { on: true, col: '#ffd166', rate: .06 }, brake: .5 },
  basic: { name: 'Swing Through', type: 'physical', ratio: .95, range: 190, sfx: 'swing_light', hit: 'hit_blunt',
    wind: .12, animStyle: 'yattaSwing', note: 'Every swing is on the way to somewhere else.',
    onHit: (u, t, B) => { u.beat = (u.beat || 0) + 1; if (u.beat % 3 === 0) B.applyStatus(u, u, 'celebration', 10, { stacks: 1 }); } },
  skills: {
    W: {
      name: 'Piñata Party', type: 'Physical Damage', energy: 100,
      v: { ratio: .48, burst: 1.1, finish: .72 }, p: { hits: 8, dizzy: 5, max: 5, finishNeed: 3, finishExpose: 4 },
      desc: (S, P) => `<span class="sk-pas">Every third basic attack grants 🎉 Celebration (max ${P.max}), raising Attack Speed and Crit Chance. At maximum stacks her next attack bursts for <em>${pcn(S.burst * 100)}</em> Attack to everything nearby.</span>
        Active: Yatta swings through the enemy team ${P.hits} times for <em>${pcn(S.ratio * 100)}</em> Attack each. Anything hit ${P.finishNeed}+ times becomes 😵‍💫 Dizzy for ${P.dizzy}s; the most-hit target then takes a <em>${pcn(S.finish * 100)}</em> Attack Party Finish and becomes Exposed for ${P.finishExpose}s.`,
      passive: (u, B, S, P) => {
        B.on(u, 'basicHit', ev => {
          const c = u.getStatus('celebration');
          if (!c || c.stacks < P.max) return;
          B.removeStatus(u, 'celebration');
          Sound.play('explode', { vol: .7 }); B.shake(10, .3);
          B.fxYattaSkill('finish', u); B.fxConfetti(ev.target.x, ev.target.y - 50, 18);
          B.aoe(u, ev.target.x, 230, u.team, u.st.atk * S.burst, { type: 'physical', tag: 'candy explosion' });
          if (u.candyShred) B.aoeStatus(u, ev.target.x, 230, 'defdown', 6);
        });
      },
      cast: (u, B, S, P) => {
        B.anim(u, 'cast', .72, 'yattaParty'); Sound.play('pop2', { vol: .44 }); Sound.play('bounce'); B.fxYattaSkill('party', u);
        const hits = new Map();
        B.repeat(P.hits, .12, i => {
          const foes = B.enemiesOf(u); if (!foes.length) return;
          const t = pick(foes);
          B.blink(u, t.x - u.face * 50, t.depth);
          Sound.play('hit_blunt', { vol: .55, rate: rnd(.9, 1.25), throttle: 12 });
          B.fxYattaSkill('partyHit', u, { target: t, index: i, last: P.hits - 1 });
          B.shake(5, .1);
          B.damage(u, t, u.st.atk * S.ratio, { type: 'physical', tag: 'Piñata Party' });
          hits.set(t, (hits.get(t) || 0) + 1);
          if (hits.get(t) >= P.finishNeed) B.applyStatus(u, t, 'dizzy', P.dizzy);
          if (i === P.hits - 1) B.after(.08, () => {
            const focus = [...hits.entries()].sort((a, b) => b[1] - a[1])[0];
            if (!focus || focus[1] < P.finishNeed || !focus[0].alive) return;
            const target = focus[0];
            Sound.play('explode', { vol: .54 }); B.hitstop(75); B.fxYattaSkill('finish', u, { target });
            B.damage(u, target, u.st.atk * S.finish, { type: 'physical', tag: 'Party Finish' });
            B.applyStatus(u, target, 'exposed', P.finishExpose);
          });
        });
      }
    },
    G: {
      name: 'Candy Crash', type: 'Physical Damage', cd: 8,
      v: { ratio: 1.45 }, p: { thr: .40, stun: 1.8, dizzyCelebrate: 2 },
      desc: (S, P) => `Yatta launches at the lowest-HP enemy for <em>${pcn(S.ratio * 100)}</em> Attack. Below ${pc(P.thr)} HP it hits far harder and 😵 Stuns for ${P.stun}s. Defeating a 😵‍💫 Dizzy target grants ${P.dizzyCelebrate} 🎉 Celebration stacks. At Red rarity it bounces to a new target on a kill, growing each time.`,
      ai: { prio: 58, cond: () => true },
      cast: (u, B, S, P) => {
        const bounce = (t, chainN) => {
          if (!t || !t.alive || chainN > 5) return;
          const low = t.hpPct < P.thr;
          const dizzy = t.hasStatus('dizzy');
          B.blink(u, t.x - u.face * 50, t.depth);
          Sound.play(low ? 'crit' : 'hit_heavy'); B.hitstop(low ? 120 : 70); B.shake(low ? 15 : 9, .3);
          B.fxYattaSkill('crash', u, { target: t, chain: chainN, low });
          const before = t.alive;
          B.damage(u, t, u.st.atk * S.ratio * (low ? 1.6 : 1) * (1 + chainN * .3),
            { type: 'physical', forceCrit: low, tag: 'Candy Crash' });
          if (low && t.alive) B.applyStatus(u, t, 'stun', P.stun);
          if (before && !t.alive && dizzy) B.applyStatus(u, u, 'celebration', 10, { stacks: Math.round(P.dizzyCelebrate) });
          if (u.crashChain && before && !t.alive) {
            const next = B.lowestHp(B.enemiesOf(u));
            if (next) { B.resetCd(u, 'G'); B.after(.2, () => bounce(next, chainN + 1)); }
          }
        };
        B.anim(u, 'wind', .3, 'yattaCrash'); Sound.play('jump'); B.fxYattaSkill('crashStart', u);
        B.after(.2, () => bounce(B.lowestHp(B.enemiesOf(u)), 0));
      }
    },
    B: {
      name: 'Spring Loaded', type: 'Self Buff', cd: 12,
      v: { eva: .40 }, p: { dur: 7 },
      desc: (S, P) => `Yatta bounds around the field for ${P.dur}s, gaining <em>${pcn(S.eva * 100)}</em> Evasion, Move Speed, and 1 🎉 Celebration stack. Every dodge restores Energy; dodges during Spring Loaded also add another Celebration stack.`,
      ai: { prio: 52, cond: (u) => u.hpPct < .9 },
      cast: (u, B, S, P) => {
        B.anim(u, 'cast', .45, 'yattaSpring'); Sound.play('bounce'); Sound.play('pop2', { vol: .25 }); B.fxYattaSkill('spring', u, { dur: P.dur });
        u._yattaSpringUntil = B.t + P.dur;
        u.flat.evaP2 = S.eva; u.dirty = true;
        B.applyStatus(u, u, 'speedup', P.dur, { stacks: 2 });
        B.applyStatus(u, u, 'celebration', P.dur, { stacks: 1 });
        B.after(P.dur, () => { if (B.t >= (u._yattaSpringUntil || 0)) { u.flat.evaP2 = 0; u._yattaSpringUntil = 0; u.dirty = true; } });
      },
      passive: (u, B) => { B.on(u, 'dodged', () => { B.energy(u, 12); if (B.t < (u._yattaSpringUntil || 0)) B.applyStatus(u, u, 'celebration', 10, { stacks: 1 }); }); }
    },
    P: {
      name: 'Festival Fuel', type: 'Attack Speed',
      v: {}, p: {},
      desc: () => `🎉 Celebration builds twice as fast, and the candy explosion at maximum stacks also shreds the Defense of everything it hits. A Party Finish creates the opening; Candy Crash cashes it in.`,
      passive: (u, B) => {
        u.candyShred = true;
        B.on(u, 'basicHit', () => { if (u.beat % 3 === 1) B.applyStatus(u, u, 'celebration', 10, { stacks: 1 }); });
      }
    },
    R: {
      name: 'The Big Finish', type: 'Upgrade',
      v: {}, p: {},
      desc: () => `Candy Crash now bounces to another enemy each time it lands a kill, hitting harder with every bounce and refreshing itself outright when it chains. A Dizzy takedown carries extra 🎉 Celebration into the next finish.`,
      passive: (u) => { u.crashChain = true; }
    }
  }
});

/* ============================================================ POPPY
   Tank / Bubble Shelter - C Tier.
   Bubbly and evasive rather than armored: Poppy survives by not being hit,
   but now shares just enough of that safety to hold a line for her team. */
defHero({
  id: 'Poppy', name: 'Poppy', folder: 'Poppy', file: 'Poppy', icon: 'Poppy',
  role: 'Tank', tier: 'C', element: 'Bubble',
  blurb: 'A cheerful bubble Toon who bounces out of danger more often than she stands in it.',
  base: { hp: 4500, atk: 202, def: 218, mag: 178, mdef: 198, spd: 122, acc: 182, eva: 220 },
  hidden: { range: 185, aspd: .96, ms: 88, aggro: 1.55, crit: .08, critDmg: 1.5, healPow: 1, shieldPow: 1.30, cdr: .05, ccRes: .15, kbRes: .12, armorPen: 0, magPen: 0 },
  growth: { hp: .096, atk: .058, def: .078, mag: .054, mdef: .072 },
  move: { gait: 'bounce', bob: 14, freq: 2.6, lean: 8, squash: .16, hover: 4, idle: 'bounce', step: 'bounce',
    particles: 'none', pcol: '#ffe9f2', trail: { on: false }, brake: .3, sway: 6 },
  basic: { name: 'Bounce Bump', type: 'physical', ratio: .85, range: 185, sfx: 'swing_light', hit: 'hit_light',
    wind: .12, note: 'She bumps into things. It works better than it should.',
    onHit: (u, t, B) => { if (chance(.15)) B.knockback(u, t, 30); } },
  skills: {
    W: {
      name: 'Panic Pop', type: 'Physical Damage / Control', energy: 100,
      v: { ratio: 1.05 }, p: { dur: 5, kb: 155, slow: 3.5, energy: 8 },
      desc: (S, P) => `<span class="sk-pas">Losing HP makes Poppy 🫧 Buoyant for ${P.dur}s: more Move Speed and Evasion. Dodging a hit while Buoyant restores Energy.</span>
        Active: Poppy launches herself forward, bouncing between enemies for <em>${pcn(S.ratio * 100)}</em> Attack each. Enemies hit are knocked back and 🐢 Slowed for ${P.slow}s.`,
      passive: (u, B, S, P) => {
        B.on(u, 'damaged', ev => { if (!ev.dot) B.applyStatus(u, u, 'buoyant', P.dur, { stacks: 1 }); });
        B.on(u, 'dodged', () => { if (u.hasStatus('buoyant')) B.energy(u, P.energy); });
      },
      cast: (u, B, S, P) => {
        B.anim(u, 'cast', .78, 'poppyBounceRush'); Sound.play('bounce'); Sound.play('jump', { vol: .34, throttle: 180 });
        B.applyStatus(u, u, 'buoyant', P.dur, { stacks: 2 });
        B.fxRing(u.x, u.y - 32, 72, '#ffe9f2');
        B.repeat(5, .13, () => {
          if (!u.alive || (u.flags && u.flags.noAct)) return;
          const foes = B.enemiesOf(u); if (!foes.length) return;
          const t = pick(foes);
          const dir = t.x < u.x ? -1 : 1;
          u.face = dir;
          B.blink(u, t.x - dir * 46, t.depth);
          Sound.play('hit_light', { vol: .5, rate: rnd(.9, 1.2), throttle: 12 });
          B.fxBoom(t.x, t.y - 30, .6, '#ffe9f2'); B.shake(3, .1);
          B.damage(u, t, u.st.atk * S.ratio, { type: 'physical', tag: 'Panic Pop' });
          B.knockback(u, t, P.kb); B.applyStatus(u, t, 'slow', P.slow);
        });
      }
    },
    G: {
      name: 'Bubble Bounce', type: 'Shield', cd: 10,
      v: { shield: .32 }, p: { dur: 6.5, kb: 185, shelter: .32 },
      desc: (S, P) => `Poppy wraps herself in a bubble worth <em>${pcn(S.shield * 100)}</em> of her Max HP for ${P.dur}s. Nearby allies receive a Bubble Shelter worth ${Math.round(P.shelter*100)}% of her own Shield, brief Speed Up, and Attack Up. When it pops it knocks nearby enemies back, and Poppy gains Move Speed and Buoyancy.`,
      ai: { prio: 55, cond: (u) => !u.hasStatus('shield') },
      cast: (u, B, S, P) => {
        B.anim(u, 'cast', .72, 'poppyBubbleGuard'); Sound.play('cloth'); Sound.play('bounce', { vol: .28, throttle: 180 });
        B.fxRing(u.x, u.y - 30, 90, '#ffe9f2');
        const shelter = () => B.alliesOf(u).filter(a => a !== u && B.distance(a, u) < 280).forEach(a => {
          B.shield(u, a, u.max.hp * S.shield * P.shelter, 4.5);
          B.applyStatus(u, a, 'speedup', 4, { stacks: 1 });
          B.applyStatus(u, a, 'atkup', 4, { stacks: 1 });
        });
        shelter();
        const bubble = B.poppyBubble(u, false);
        const burst = () => {
          if (!u.poppyBubbleEl || u.poppyBubbleEl !== bubble) return;
          B.poppyBubblePop(u, false, bubble);
          B.emitFor(u, 'poppyBubblePop', { bubble });
          if (!u.alive) return;
          Sound.play('explode', { vol: .5 }); B.fxBoom(u.x, u.y - 30, 1, '#ffe9f2'); B.shake(8, .3);
          B.enemiesOf(u).forEach(e => { if (B.distance(e, u) < 220) B.knockback(u, e, P.kb); });
          B.applyStatus(u, u, 'speedup', 4, { stacks: 2 });
          B.applyStatus(u, u, 'buoyant', 4, { stacks: 1 });
          shelter();
        };
        B.shield(u, u, u.max.hp * S.shield, P.dur, {
          onBreak: burst
        });
        B.after(P.dur, burst);
      }
    },
    B: {
      name: 'Pop Shock', type: 'Physical Damage / Debuff', cd: 12,
      v: { ratio: 1.18 }, p: { dur: 6, kb: 145, radius: 220 },
      desc: (S, P) => `Poppy compresses, then suddenly expands outward for <em>${pcn(S.ratio * 100)}</em> Attack to everything nearby, knocking enemies away. Anyone hit becomes 🥴 Off Balance for ${P.dur}s, losing Accuracy and cooldown recovery.`,
      ai: { prio: 50, cond: (u, B) => B.enemiesOf(u).some(e => B.distance(e, u) <= 260) },
      cast: (u, B, S, P) => {
        B.anim(u, 'wind', .74, 'poppyPopShock'); Sound.play('warn'); Sound.play('beam_charge', { vol: .18, throttle: 260 });
        B.after(.38, () => {
          if (!u.alive) return;
          Sound.play('explode'); B.hitstop(90); B.shake(11, .35); B.fxBoom(u.x, u.y - 30, 1.2, '#ffe9f2');
          B.enemiesOf(u).forEach(e => {
            if (B.distance(e, u) > P.radius) return;
            B.damage(u, e, u.st.atk * S.ratio, { type: 'physical', tag: 'Pop Shock' });
            B.applyStatus(u, e, 'offbalance', P.dur);
            B.knockback(u, e, P.kb);
          });
        });
      }
    },
    P: {
      name: 'Air Filled', type: 'Max HP',
      v: {}, p: { stackHp: .02, stackShield: .03, stackKb: .03 },
      desc: (S, P) => `Losing HP grants Air Pressure (max 10). Each stack adds ${(P.stackHp*100).toFixed(1)}% Max HP, Shield Strength and Knockback Resistance. At ten stacks Poppy cannot be displaced and takes noticeably less damage.`,
      passive: (u, B, S, P) => {
        u._poppyStackHp=P.stackHp;u._poppyStackShield=P.stackShield;u._poppyStackKb=P.stackKb;
        B.on(u, 'damaged', ev => { if (!ev.dot) B.applyStatus(u, u, 'airpressure', 999, { stacks: 1 }); });
        B.every(u, .5, () => {
          const a = u.getStatus('airpressure');
          const maxed = a && a.stacks >= 10;
          const wasMaxed = !!u.poppyPressureMax;
          u.poppyPressure = a ? a.stacks / 10 : 0;
          u.poppyPressureMax = !!maxed;
          if (maxed && !wasMaxed) {
            if (!u.casting && u.animStyle !== 'poppyBigBubble') {
              B.anim(u, 'cast', .66, 'poppyPressure');
            }
            B.fxRing(u.x, u.y - 38, 118, '#ffe9f2');
            Sound.play('grow', { vol: .42 });
          }
          u.immovable = !!maxed;
          u.flat.dmgTaken3 = maxed ? -.15 : 0;
          u.dirty = true;
        });
      }
    },
    R: {
      name: 'The Biggest Bubble', type: 'Battle Opener',
      v: { shield: .24 }, p: { bubbleDur: 3.8, heal: .12, revive: .55, atkLoss: .24, msGain: .36, kb: 200 },
      desc: (S, P) => `At the start of battle Poppy gains a Shield worth <em>${pcn(S.shield * 100)}</em> of her Max HP. The first time she would be defeated she instead becomes a giant bubble for ${P.bubbleDur}s: untargetable, unable to act, slowly healing. When it pops she returns to battle, damaging and pushing back nearby enemies, then gains <em>${pcn(P.msGain * 100)}</em> Move Speed but <em>${pcn(P.atkLoss * 100)}</em> less Attack for the rest of the battle.`,
      passive: (u, B, S, P) => {
        B.after(.3, () => {
          const openingBubble = B.poppyBubble(u, false);
          B.shield(u, u, u.max.hp * S.shield, 999, { onBreak: () => B.poppyBubblePop(u, false, openingBubble) });
          const ally = B.lowestHp(B.alliesOf(u).filter(a => a !== u));
          if (ally) B.shield(u, ally, u.max.hp * S.shield * .24, 6);
          B.fxRing(u.x, u.y - 30, 90, '#ffe9f2');
        });
        B.on(u, 'lethal', ev => {
          if (u._bubbled) return;
          u._bubbled = true; ev.prevented = true;
          u._castId = (u._castId || 0) + 1;
          u.casting = null; u.pendingHit = null; u.windup = 0;
          u.moving = false; u.movingY = false; u.actionArtSrc = null;
          B.cleanseAll(u);
          Sound.play('cloth'); B.fxRing(u.x, u.y - 40, 140, '#ffe9f2');
          B.anim(u, 'cast', P.bubbleDur, 'poppyBigBubble');
          B.poppyBubble(u, true);
          u.invuln = B.t + P.bubbleDur;    // "cannot be damaged" - a hard guarantee, not just untargetable
          B.applyStatus(u, u, 'untargetable', P.bubbleDur);
          B.applyStatus(u, u, 'stun', P.bubbleDur);
          B.applyStatus(u, u, 'regen', P.bubbleDur, { val: u.max.hp * P.heal });
          B.log('<b>' + u.name + '</b> becomes The Biggest Bubble.');
          B.after(P.bubbleDur, () => {
            if (!u.alive) return;
            B.poppyBubblePop(u);
            B.anim(u, 'cast', .56, 'poppyBurst');
            u.hp = Math.max(u.hp, u.max.hp * P.revive);
            Sound.play('explode'); B.shake(14, .4); B.fxBoom(u.x, u.y - 30, 1.4, '#ffe9f2');
            B.enemiesOf(u).forEach(e => {
              if (B.distance(e, u) > 240) return;
              B.damage(u, e, u.st.atk * 1.2, { type: 'physical', tag: 'The Biggest Bubble' });
              B.knockback(u, e, P.kb);
            });
            B.applyStatus(u, u, 'buoyant', 6, { stacks: 2 });
            u.flat.atkP2 = -P.atkLoss; u.flat.msP2 = P.msGain; u.dirty = true;
          });
        });
      }
    }
  }
});

/* ============================================================ SPROUT
   Enemy-only for now: full kit so the Twisted form has real behaviour, and so
   it can be promoted to a playable Hero the moment art exists. */
defHero({
  id: 'Sprout', name: 'Sprout', folder: null, file: null, icon: 'Sprout', twistedOnly: true,
  role: 'Damage', tier: 'SS', element: 'Growth',
  blurb: 'Something in the Depths kept growing after it should have stopped.',
  base: { hp: 4600, atk: 470, def: 262, mag: 355, mdef: 268, spd: 122, acc: 205, eva: 138 },
  hidden: { range: 220, aspd: 1.08, ms: 84, aggro: 1.1, crit: .20, critDmg: 1.85, healPow: 1.2, shieldPow: 1, cdr: .10, ccRes: .30, kbRes: .5, armorPen: .18, magPen: .18 },
  growth: { hp: .098, atk: .105, def: .085, mag: .098, mdef: .085 },
  move: { gait: 'trudge', bob: 5, freq: 1.3, lean: 8, squash: .07, idle: 'grow', step: 'step_grass',
    particles: 'leaf', pcol: '#6ede77', trail: { on: true, col: '#6ede77', rate: .09 }, brake: .5, weight: 1.3 },
  basic: { name: 'Cleaver', type: 'physical', ratio: 1.20, range: 220, sfx: 'swing_blade', hit: 'hit_slash',
    wind: .2, note: 'Heavy, wet, and unhurried.',
    onHit: (u, t, B) => { B.applyStatus(u, t, 'bleed', 6, { val: u.st.atk * .09 }); B.heal(u, u, u.max.hp * .015, { silent: true }); } },
  skills: {
    W: { name: 'Harvest', type: 'Physical Damage', energy: 100,
      v: { ratio: 2.1, heal: .5 }, p: { exec: .25 },
      desc: (S, P) => `<span class="sk-pas">Every enemy defeated grants permanent Max HP and Attack, and heals Sprout to full.</span>
        Active: a sweeping cleave for <em>${pcn(S.ratio * 100)}</em> Attack to all enemies, healing for <em>${pcn(S.heal * 100)}</em> of the damage dealt. Anything below ${pc(P.exec)} HP is harvested outright.`,
      passive: (u, B) => {
        B.on(u, 'enemyDown', () => {
          u.flat.hpP = (u.flat.hpP || 0) + .10; u.flat.atkP = (u.flat.atkP || 0) + .12;
          u.dirty = true; B.after(.02, () => { u.hp = u.max.hp; });
          Sound.play('grow'); B.fxFloatIcon(u.x, u.y - 100, '🌱');
        });
      },
      cast: (u, B, S, P) => {
        B.anim(u, 'wind', .55); Sound.play('swing_blade');
        B.after(.45, () => {
          Sound.play('hit_heavy'); B.hitstop(140); B.shake(18, .55); B.tint('#2c5a2c', .3, .5);
          let total = 0;
          B.enemiesOf(u).forEach(e => {
            B.fxSlash(u, e, { col: '#6ede77', ang: -20, big: true });
            const ev = B.damage(u, e, u.st.atk * S.ratio, { type: 'physical', tag: 'Harvest' });
            total += ev ? ev.amount : 0;
            if (e.alive && e.hpPct < P.exec) B.damage(u, e, e.hp + 1, { type: 'true', tag: 'harvest' });
          });
          B.heal(u, u, total * S.heal, { tag: 'Harvest' });
        });
      } },
    G: { name: 'Overgrowth', type: 'Control', cd: 10,
      v: { ratio: 1.0 }, p: { root: 4 },
      desc: (S, P) => `Vines erupt under the two farthest enemies for <em>${pcn(S.ratio * 100)}</em> Attack, ⛓ Rooting them for ${P.root}s and dragging them in.`,
      ai: { prio: 56, cond: () => true },
      cast: (u, B, S, P) => {
        B.anim(u, 'cast', .35); Sound.play('dig');
        B.farthestN(u, B.enemiesOf(u), 2).forEach(e => {
          B.damage(u, e, u.st.atk * S.ratio, { type: 'physical', tag: 'Overgrowth' });
          B.applyStatus(u, e, 'root', P.root);
          B.pull(e, u.x + u.face * 130, .4, u.depth);
          B.fxVines(e.x, e.y);
        });
      } },
    B: { name: 'Spore Cloud', type: 'Magic Damage', cd: 15,
      v: { ratio: .85 }, p: { dur: 8 },
      desc: (S, P) => `Spores for <em>${pcn(S.ratio * 100)}</em> Magic to all enemies, applying ☠ Poison and 🧬 Mutation for ${P.dur}s.`,
      ai: { prio: 48, cond: () => true },
      cast: (u, B, S, P) => {
        B.anim(u, 'cast', .4); Sound.play('steam'); B.fxSmoke(u.x, u.y, 30, '#6ede77');
        B.enemiesOf(u).forEach(e => {
          B.damage(u, e, u.st.mag * S.ratio, { type: 'magic', tag: 'Spore Cloud' });
          B.applyStatus(u, e, 'poison', P.dur, { stacks: 4, val: u.st.mag * .08 });
          B.applyStatus(u, e, 'mutation', P.dur);
        });
      } },
    P: { name: 'Rooted Deep', type: 'Sustain',
      v: { steal: .28, cc: .3 }, p: {},
      desc: (S) => `Heals for <em>${pcn(S.steal * 100)}</em> of all damage dealt and resists <em>${pcn(S.cc * 100)}</em> more crowd control.`,
      passive: (u, B, S) => {
        u.flat.ccRes = S.cc;
        B.on(u, 'dealDamage', ev => { if (!ev.dot) B.heal(u, u, ev.amount * S.steal, { silent: true }); });
      } },
    R: { name: 'Second Bloom', type: 'Revival',
      v: { hp: .55 }, p: {},
      desc: (S) => `When defeated it takes root and rises again at <em>${pc(S.hp)}</em> HP with cooldowns reset and ⚓ CC immunity for 6s. Once per battle.`,
      passive: (u, B, S) => {
        B.on(u, 'lethal', ev => {
          if (u._bloom) return; u._bloom = true; ev.prevented = true;
          u.hp = u.max.hp * S.hp; Sound.play('grow'); B.shake(14, .5); B.tint('#2c5a2c', .35, .8);
          B.applyStatus(u, u, 'ccimmune', 6); B.resetCd(u, 'G'); B.resetCd(u, 'B');
          B.log('<b>Sprout blooms again.</b>');
        });
      } }
  }
});
