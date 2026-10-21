/* weaklings.js - the common floor trash of the Ichor Depths.
   Twisteds are dangerous by design, so most rooms are padded out with these:
   small animated objects with a single gimmick each, low HP and low damage.
   They use the same Unit contract as Heroes, so nothing in the engine is special-cased. */
'use strict';

const WEAKLING_IDS = ['Ball', 'Bomb', 'Bottle', 'Brick', 'Cake', 'Grape', 'Honeydrop', 'Sponge'];

/** Compact definition helper: weaklings only need a Basic, a White and a Green. */
function defWeakling(o) {
  return defHero({
    id: o.id, name: o.name, folder: null, file: null, icon: o.id,
    twistedOnly: true, weakling: true, scale: o.scale || .7,
    role: o.role, tier: o.tier || 'F', element: o.element,
    blurb: o.blurb,
    base: o.base, hidden: o.hidden, growth: o.growth || { hp: .07, atk: .07, def: .06, mag: .06, mdef: .06 },
    move: o.move, basic: o.basic, skills: o.skills
  });
}

/* Shared statline shape. Weaklings sit at roughly 55% of a Twisted's bulk and
   damage - a real speed bump, not a wall, but every one of them now has a
   Green skill too so a room of them keeps acting instead of just tanking hits
   until an ultimate finally charges. */
const WK = (hp, atk, def, mag, mdef, spd, acc, eva) =>
  ({ hp, atk, def, mag, mdef, spd, acc, eva });

/* ============================================================ BALL */
defWeakling({
  id: 'Ball', name: 'Ball', role: 'Damage', element: 'Rubber', scale: .62,
  blurb: 'It bounces. That is the entire threat model.',
  base: WK(1700, 225, 98, 78, 88, 130, 150, 150),
  hidden: { range: 150, aspd: 1.25, ms: 120, aggro: .8, crit: .10, critDmg: 1.5, healPow: 1, shieldPow: 1,
    cdr: 0, ccRes: 0, kbRes: .05, armorPen: 0, magPen: 0 },
  move: { gait: 'bounce', bob: 18, freq: 3.0, lean: 6, squash: .18, idle: 'bounce', step: 'bounce',
    particles: 'none', pcol: '#ff8fb0', trail: { on: true, col: '#ff8fb0', rate: .07 }, brake: .3 },
  basic: { name: 'Bonk', type: 'physical', ratio: .95, range: 150, sfx: 'bounce', hit: 'hit_light',
    wind: .10, note: 'A hopeful little bounce.',
    onHit: (u, t, B) => { B.knockback(u, t, 10); } },
  skills: {
    W: { name: 'Ricochet', type: 'Physical Damage', energy: 100,
      v: { ratio: .55 }, p: { hits: 4 },
      desc: (S, P) => `Bounces between ${P.hits} targets for <em>${pcn(S.ratio * 100)}</em> Attack each.`,
      cast: (u, B, S, P) => {
        B.anim(u, 'cast', .25); Sound.play('bounce');
        B.repeat(P.hits, .14, () => {
          const foes = B.enemiesOf(u); if (!foes.length) return;
          const t = pick(foes);
          B.blink(u, t.x - u.face * 45);
          Sound.play('hit_light', { vol: .5, rate: rnd(.9, 1.3), throttle: 12 });
          B.damage(u, t, u.st.atk * S.ratio, { type: 'physical', tag: 'Ricochet' });
          B.fxBoom(t.x, t.y - 30, .5, '#ff8fb0'); B.shake(3, .1);
        });
      } },
    G: { name: 'Quick Bounce', type: 'Physical Damage', cd: 6,
      v: { ratio: .75 }, p: { dur: 3 },
      desc: (S, P) => `Springs at the nearest enemy for <em>${pcn(S.ratio * 100)}</em> Attack and gains 🏃 Speed Up for ${P.dur}s.`,
      ai: { prio: 50, cond: () => true },
      cast: (u, B, S, P) => {
        const t = B.nearest(u, B.enemiesOf(u)); if (!t) return;
        B.anim(u, 'cast', .2); Sound.play('bounce');
        B.blink(u, t.x - u.face * 45);
        Sound.play('hit_light', { vol: .55 });
        B.damage(u, t, u.st.atk * S.ratio, { type: 'physical', tag: 'Quick Bounce' });
        B.applyStatus(u, u, 'speedup', P.dur);
        B.fxBoom(t.x, t.y - 30, .6, '#ff8fb0');
      } }
  }
});

/* ============================================================ BOMB */
defWeakling({
  id: 'Bomb', name: 'Bomb', role: 'Damage', element: 'Blast', scale: .66,
  blurb: 'Slow, fragile, and extremely committed to one idea.',
  base: WK(1300, 265, 90, 225, 78, 85, 150, 60),
  hidden: { range: 165, aspd: .70, ms: 46, aggro: 1.1, crit: .08, critDmg: 1.6, healPow: 1, shieldPow: 1,
    cdr: 0, ccRes: .1, kbRes: .3, armorPen: .1, magPen: .1 },
  move: { gait: 'trudge', bob: 4, freq: .9, lean: 5, squash: .07, idle: 'ember', step: 'step_heavy',
    particles: 'ember', pcol: '#ff8a3d', trail: { on: false }, brake: .7, weight: 1.4, glow: '#ff5a1f' },
  basic: { name: 'Fuse Swipe', type: 'physical', ratio: 1.0, range: 165, sfx: 'swing_heavy', hit: 'hit_blunt',
    wind: .26, note: 'It would rather just explode.',
    onHit: (u, t, B) => { B.applyStatus(u, t, 'burn', 4, { val: u.st.atk * .05 }); } },
  skills: {
    W: { name: 'Detonate', type: 'Magic Damage', energy: 100,
      v: { ratio: 1.5 }, p: { radius: 240 },
      desc: (S) => `Blows itself up for <em>${pcn(S.ratio * 100)}</em> Magic to everything nearby. It does not survive this.`,
      passive: (u, B) => {
        // even killed early it goes off, so ignoring a Bomb is never free
        B.on(u, 'death', () => {
          Sound.play('explode'); B.shake(12, .35); B.fxBoom(u.x, u.y - 30, 1.4, '#ff8a3d');
          B.aoe(u, u.x, 200, u.team, u.st.mag * 1.0, { type: 'magic', tag: 'Dud Blast' });
        });
      },
      cast: (u, B, S, P) => {
        B.anim(u, 'wind', .5); Sound.play('warn');
        B.after(.45, () => {
          Sound.play('explode'); B.shake(16, .45); B.hitstop(80);
          B.fxBoom(u.x, u.y - 30, 2, '#ff8a3d'); B.flash('#ffb066', .35, .25);
          B.aoe(u, u.x, P.radius, u.team, u.st.mag * S.ratio, { type: 'magic', tag: 'Detonate' });
          B.enemiesOf(u).forEach(e => { if (Math.abs(e.x - u.x) < P.radius) B.applyStatus(u, e, 'burn', 6, { stacks: 2, val: u.st.mag * .06 }); });
          B.kill(u);
        });
      } },
    G: { name: 'Spark', type: 'Magic Damage', cd: 7,
      v: { ratio: .55 }, p: { dur: 4 },
      desc: (S, P) => `A small flare on the nearest enemy for <em>${pcn(S.ratio * 100)}</em> Magic and 🔥 Burn for ${P.dur}s.`,
      ai: { prio: 48, cond: () => true },
      cast: (u, B, S, P) => {
        const t = B.nearest(u, B.enemiesOf(u)); if (!t) return;
        B.anim(u, 'cast', .2); Sound.play('fire', { vol: .6 });
        B.damage(u, t, u.st.mag * S.ratio, { type: 'magic', tag: 'Spark' });
        B.applyStatus(u, t, 'burn', P.dur, { val: u.st.mag * .05 });
        B.fxBoom(t.x, t.y - 30, .5, '#ff8a3d');
      } }
  }
});

/* ============================================================ BOTTLE */
defWeakling({
  id: 'Bottle', name: 'Bottle', role: 'Control', element: 'Spill', scale: .68,
  blurb: 'Tips over on purpose and makes the floor everyone else\'s problem.',
  base: WK(1550, 165, 104, 210, 114, 105, 145, 105),
  hidden: { range: 265, aspd: .90, ms: 62, aggro: .7, crit: .05, critDmg: 1.4, healPow: 1, shieldPow: 1,
    cdr: .05, ccRes: .05, kbRes: .1, armorPen: 0, magPen: .05 },
  move: { gait: 'waddle', bob: 5, freq: 1.4, lean: 8, squash: .06, idle: 'slosh', step: 'step_wet',
    particles: 'splash', pcol: '#7be0ff', trail: { on: false }, brake: .5 },
  basic: { name: 'Splash', type: 'magic', ratio: .85, range: 265, proj: 'orb', pcol: '#7be0ff',
    sfx: 'whoosh', hit: 'hit_water', wind: .22, note: 'Lobs whatever is inside it.',
    onHit: (u, t, B) => { if (chance(.30)) B.applyStatus(u, t, 'slow', 3); } },
  skills: {
    W: { name: 'Tip Over', type: 'Control', energy: 100,
      v: { ratio: .70 }, p: { dur: 6 },
      desc: (S, P) => `Spills across the field for <em>${pcn(S.ratio * 100)}</em> Magic, leaving everything 🍯 Sticky and 🐢 Slowed for ${P.dur}s.`,
      cast: (u, B, S, P) => {
        B.anim(u, 'cast', .35); Sound.play('hit_water');
        const cx = B.avgX(B.enemiesOf(u));
        B.fxPool(cx, P.dur, '#7be0ff', 240);
        B.enemiesOf(u).forEach(e => {
          if (Math.abs(e.x - cx) > 240) return;
          B.damage(u, e, u.st.mag * S.ratio, { type: 'magic', tag: 'Tip Over' });
          B.applyStatus(u, e, 'sticky', P.dur); B.applyStatus(u, e, 'slow', P.dur);
        });
      } },
    G: { name: 'Splash Zone', type: 'Magic Damage', cd: 7,
      v: { ratio: .50 }, p: { dur: 3 },
      desc: (S, P) => `A short-range splash for <em>${pcn(S.ratio * 100)}</em> Magic that 🌑 Blinds for ${P.dur}s.`,
      ai: { prio: 46, cond: (u, B) => B.enemiesOf(u).some(e => Math.abs(e.x - u.x) < 260) },
      cast: (u, B, S, P) => {
        B.anim(u, 'cast', .25); Sound.play('hit_water', { vol: .6 });
        B.enemiesOf(u).forEach(e => {
          if (Math.abs(e.x - u.x) > 260) return;
          B.damage(u, e, u.st.mag * S.ratio, { type: 'magic', tag: 'Splash Zone' });
          B.applyStatus(u, e, 'blind', P.dur);
        });
      } }
  }
});

/* ============================================================ BRICK */
defWeakling({
  id: 'Brick', name: 'Brick', role: 'Tank', element: 'Masonry', scale: .64,
  blurb: 'The single most stubborn object in the Depths.',
  base: WK(3300, 190, 255, 65, 205, 62, 130, 40),
  hidden: { range: 145, aspd: .62, ms: 36, aggro: 2.4, crit: .02, critDmg: 1.4, healPow: 1, shieldPow: 1,
    cdr: 0, ccRes: .45, kbRes: .95, armorPen: 0, magPen: 0 },
  move: { gait: 'trudge', bob: 2, freq: .8, lean: 2, squash: .03, idle: 'settle', step: 'step_heavy',
    particles: 'dust', pcol: '#b08a6a', trail: { on: false }, brake: .95, weight: 1.8, shakeStep: 2 },
  basic: { name: 'Thud', type: 'physical', ratio: 1.15, range: 145, sfx: 'swing_heavy', hit: 'hit_blunt',
    wind: .32, shake: 4, note: 'Arrives eventually.' },
  skills: {
    W: { name: 'Wall Up', type: 'Defense', energy: 100,
      v: { shield: .30 }, p: { dur: 8, taunt: 4 },
      desc: (S, P) => `Plants itself: a <em>${pcn(S.shield * 100)}</em> Max HP Shield and 🎭 Taunt on everything for ${P.taunt}s.`,
      cast: (u, B, S, P) => {
        B.anim(u, 'cast', .35); Sound.play('quake'); B.shake(8, .3);
        B.shield(u, u, u.max.hp * S.shield, P.dur);
        B.applyStatus(u, u, 'fortify', P.dur, { stacks: 3 });
        B.enemiesOf(u).forEach(e => B.applyStatus(u, e, 'taunt', P.taunt));
        B.fxCrack(u.x, u.y, 1);
      } },
    G: { name: 'Brace', type: 'Physical Damage', cd: 8,
      v: { ratio: .60, def: .20 }, p: { dur: 5 },
      desc: (S, P) => `Braces and swings for <em>${pcn(S.ratio * 100)}</em> Attack, gaining <em>${pcn(S.def * 100)}</em> Defense for ${P.dur}s and 🎭 Taunting its target.`,
      ai: { prio: 44, cond: () => true },
      cast: (u, B, S, P) => {
        const t = B.nearest(u, B.enemiesOf(u)); if (!t) return;
        B.anim(u, 'cast', .25); Sound.play('swing_heavy', { vol: .6 });
        B.damage(u, t, u.st.atk * S.ratio, { type: 'physical', tag: 'Brace' });
        B.applyStatus(u, t, 'taunt', P.dur);
        B.applyStatus(u, u, 'fortify', P.dur, { stacks: 2 });
      } }
  }
});

/* ============================================================ CAKE */
defWeakling({
  id: 'Cake', name: 'Cake', role: 'Support', element: 'Sugar', scale: .60,
  blurb: 'Keeps the other weaklings going for slightly longer than you would like.',
  base: WK(1600, 130, 112, 195, 150, 100, 135, 95),
  hidden: { range: 250, aspd: .85, ms: 58, aggro: .55, crit: .03, critDmg: 1.4, healPow: 1.25, shieldPow: 1.1,
    cdr: .08, ccRes: .05, kbRes: .1, armorPen: 0, magPen: 0 },
  move: { gait: 'waddle', bob: 6, freq: 1.5, lean: 4, squash: .07, idle: 'breathe', step: 'step_soft',
    particles: 'crumbs', pcol: '#ffd7a0', trail: { on: false }, brake: .4 },
  basic: { name: 'Crumb Toss', type: 'magic', ratio: .78, range: 250, proj: 'food', pimg: 'Cherry',
    sfx: 'whoosh', hit: 'hit_light', wind: .2, note: 'Mostly icing.' },
  skills: {
    W: { name: 'Second Helping', type: 'Healing', energy: 100,
      v: { heal: .75 }, p: {},
      desc: (S) => `Heals every ally for <em>${pcn(S.heal * 100)}</em> Magic and grants ⚔ Attack Up.`,
      cast: (u, B, S) => {
        B.anim(u, 'cast', .35); Sound.play('get_food');
        B.alliesOf(u).forEach(a => {
          B.heal(u, a, u.st.mag * S.heal, { tag: 'Second Helping' });
          B.applyStatus(u, a, 'atkup', 8);
          B.fxSparkle(a.x, a.y - 40, 8, '#ffd7a0');
        });
      } },
    G: { name: 'Slice', type: 'Healing', cd: 8,
      v: { heal: .55 }, p: {},
      desc: (S) => `Hands the weakest ally a slice, healing <em>${pcn(S.heal * 100)}</em> Magic.`,
      ai: { prio: 60, cond: (u, B) => B.alliesOf(u).some(a => a.hpPct < .8) },
      cast: (u, B, S) => {
        const t = B.lowestHp(B.alliesOf(u)); if (!t) return;
        Sound.play('heal', { vol: .6 });
        B.heal(u, t, u.st.mag * S.heal, { tag: 'Slice' });
      } }
  }
});

/* ============================================================ GRAPE */
defWeakling({
  id: 'Grape', name: 'Grape', role: 'Damage', element: 'Ferment', scale: .58,
  blurb: 'Overripe and faintly hostile.',
  base: WK(1420, 205, 94, 170, 100, 118, 145, 130),
  hidden: { range: 235, aspd: 1.10, ms: 78, aggro: .75, crit: .12, critDmg: 1.55, healPow: 1, shieldPow: 1,
    cdr: .05, ccRes: 0, kbRes: .1, armorPen: .08, magPen: .08 },
  move: { gait: 'skitter', bob: 7, freq: 2.6, lean: 12, squash: .10, idle: 'jitter', step: 'step_soft',
    particles: 'paint', pcol: '#a97bff', trail: { on: false }, brake: .5, jitter: 1.6 },
  basic: { name: 'Squirt', type: 'magic', ratio: .55, range: 235, proj: 'blob', pcol: '#a97bff',
    sfx: 'whoosh', hit: 'hit_water', wind: .14, hits: 2, note: 'Two sour little jets.',
    onHit: (u, t, B) => { B.applyStatus(u, t, 'poison', 5, { val: u.st.mag * .035 }); } },
  skills: {
    W: { name: 'Burst', type: 'Magic Damage', energy: 100,
      v: { ratio: 1.15 }, p: { dur: 8 },
      desc: (S, P) => `Ruptures for <em>${pcn(S.ratio * 100)}</em> Magic to all enemies and stacks ☠ Poison for ${P.dur}s.`,
      cast: (u, B, S, P) => {
        B.anim(u, 'wind', .4); Sound.play('hit_water');
        B.after(.3, () => {
          B.fxBoom(u.x, u.y - 30, 1.2, '#a97bff'); B.shake(7, .3);
          B.enemiesOf(u).forEach(e => {
            B.damage(u, e, u.st.mag * S.ratio, { type: 'magic', tag: 'Burst' });
            B.applyStatus(u, e, 'poison', P.dur, { stacks: 3, val: u.st.mag * .05 });
          });
        });
      } },
    G: { name: 'Squeeze', type: 'Magic Damage', cd: 6,
      v: { ratio: .58 }, p: { stacks: 2 },
      desc: (S, P) => `Squirts the weakest enemy for <em>${pcn(S.ratio * 100)}</em> Magic and ${P.stacks} stacks of ☠ Poison.`,
      ai: { prio: 47, cond: () => true },
      cast: (u, B, S, P) => {
        const t = B.lowestHp(B.enemiesOf(u)); if (!t) return;
        B.anim(u, 'cast', .2); Sound.play('hit_water', { vol: .55 });
        B.damage(u, t, u.st.mag * S.ratio, { type: 'magic', tag: 'Squeeze' });
        B.applyStatus(u, t, 'poison', 5, { stacks: P.stacks, val: u.st.mag * .04 });
      } }
  }
});

/* ============================================================ HONEYDROP */
defWeakling({
  id: 'Honeydrop', name: 'Honeydrop', role: 'Control', element: 'Honey', scale: .50,
  blurb: 'Barely dangerous. Extremely annoying.',
  base: WK(1220, 125, 92, 158, 104, 96, 135, 120),
  hidden: { range: 230, aspd: .95, ms: 54, aggro: .5, crit: .03, critDmg: 1.4, healPow: 1, shieldPow: 1,
    cdr: .1, ccRes: 0, kbRes: .05, armorPen: 0, magPen: 0 },
  move: { gait: 'ooze', bob: 4, freq: .9, lean: 3, squash: .14, idle: 'drip', step: 'step_wet',
    particles: 'none', pcol: '#ffc94d', trail: { on: false }, brake: .8 },
  basic: { name: 'Dribble', type: 'magic', ratio: .70, range: 230, proj: 'blob', pcol: '#ffc94d',
    sfx: 'whoosh', hit: 'hit_water', wind: .24, note: 'Sticks to everything.',
    onHit: (u, t, B) => { B.applyStatus(u, t, 'sticky', 4); } },
  skills: {
    W: { name: 'Glue Trap', type: 'Control', energy: 100,
      v: { ratio: .45 }, p: { root: 2.5, slow: 7 },
      desc: (S, P) => `Everything nearby is ⛓ Rooted for ${P.root}s and 🐢 Slowed for ${P.slow}s, taking <em>${pcn(S.ratio * 100)}</em> Magic.`,
      cast: (u, B, S, P) => {
        B.anim(u, 'cast', .35); Sound.play('cloth');
        B.fxRing(u.x, u.y - 20, 300, '#ffc94d', .5);
        B.enemiesOf(u).forEach(e => {
          if (Math.abs(e.x - u.x) > 300) return;
          B.damage(u, e, u.st.mag * S.ratio, { type: 'magic', tag: 'Glue Trap' });
          B.applyStatus(u, e, 'root', P.root);
          B.applyStatus(u, e, 'slow', P.slow, { stacks: 2 });
        });
      } },
    G: { name: 'Drip', type: 'Magic Damage', cd: 6,
      v: { ratio: .48 }, p: { dur: 3 },
      desc: (S, P) => `A thin drip on the nearest enemy for <em>${pcn(S.ratio * 100)}</em> Magic and 🐢 Slow for ${P.dur}s.`,
      ai: { prio: 44, cond: () => true },
      cast: (u, B, S, P) => {
        const t = B.nearest(u, B.enemiesOf(u)); if (!t) return;
        B.anim(u, 'cast', .2); Sound.play('hit_water', { vol: .5 });
        B.damage(u, t, u.st.mag * S.ratio, { type: 'magic', tag: 'Drip' });
        B.applyStatus(u, t, 'slow', P.dur);
      } }
  }
});

/* ============================================================ SPONGE */
defWeakling({
  id: 'Sponge', name: 'Sponge', role: 'Tank', element: 'Absorb', scale: .72,
  blurb: 'Soaks up everything aimed at it and gets heavier about it.',
  base: WK(2950, 160, 182, 78, 230, 74, 130, 60),
  hidden: { range: 155, aspd: .70, ms: 42, aggro: 2.0, crit: .02, critDmg: 1.4, healPow: 1, shieldPow: 1.2,
    cdr: 0, ccRes: .3, kbRes: .6, armorPen: 0, magPen: 0 },
  move: { gait: 'ooze', bob: 4, freq: 1.0, lean: 3, squash: .12, idle: 'slosh', step: 'step_wet',
    particles: 'splash', pcol: '#ffe27a', trail: { on: false }, brake: .8, weight: 1.5 },
  basic: { name: 'Slap', type: 'physical', ratio: .95, range: 155, sfx: 'swing_light', hit: 'hit_water',
    wind: .26, note: 'A damp, disappointing slap.' },
  skills: {
    W: { name: 'Soak', type: 'Defense', energy: 100,
      v: { heal: .18 }, p: { dur: 7 },
      desc: (S, P) => `Wrings itself out, healing <em>${pcn(S.heal * 100)}</em> Max HP and gaining 🔰 Ward for ${P.dur}s.`,
      passive: (u, B) => {
        // every hit it eats makes it slightly tougher, so it stalls a burst team
        B.on(u, 'damaged', ev => { if (!ev.dot) B.applyStatus(u, u, 'fortify', 10, { stacks: 1 }); });
      },
      cast: (u, B, S, P) => {
        B.anim(u, 'cast', .35); Sound.play('hit_water');
        B.heal(u, u, u.max.hp * S.heal, { tag: 'Soak' });
        B.applyStatus(u, u, 'ward', P.dur);
        B.fxSplash(u.x, u.y, '#ffe27a');
      } },
    G: { name: 'Absorb', type: 'Physical Damage', cd: 7,
      v: { ratio: .65, thorns: .5 }, p: { dur: 4 },
      desc: (S, P) => `Slaps the nearest enemy for <em>${pcn(S.ratio * 100)}</em> Attack and gains 🌵 Thorns for ${P.dur}s.`,
      ai: { prio: 45, cond: () => true },
      cast: (u, B, S, P) => {
        const t = B.nearest(u, B.enemiesOf(u)); if (!t) return;
        B.anim(u, 'cast', .2); Sound.play('swing_light', { vol: .55 });
        B.damage(u, t, u.st.atk * S.ratio, { type: 'physical', tag: 'Absorb' });
        B.applyStatus(u, u, 'thorns', P.dur, { val: u.st.def * S.thorns });
      } }
  }
});

/* ============================================================ SPAWNING */
/* Weaklings thin out as you descend: the shallows are mostly trash, the deep
   floors are mostly Twisteds. This is the lever that keeps rooms from being
   five genuinely dangerous Twisteds every single time. */
function weaklingShare(floor) {
  if (floor <= 2) return .65;
  if (floor <= 5) return .48;
  if (floor <= 9) return .34;
  if (floor <= 14) return .22;
  if (floor <= 20) return .14;
  return .07;
}

/** Combat spec for a weakling. They scale with floor but stay a notch below a
    Twisted at the same level - `stars` still climbs with depth like a Twisted's
    does (capped a tier lower), so they do not go on being paper-thin forever. */
function makeWeakling(id, level) {
  const training = enemyTraining(id, level, 'weakling', `weakling-${id}`);
  return {
    id, weakling: true, twisted: false,
    name: HEROES[id].name,
    artSrc: Art.weakling(id),
    level: Math.max(1, level),
    // rarity 2 (not 1) so their Green skill actually unlocks - at rarity 1 it
    // was gated off entirely (SKILL_RARITY.G === 2) and W needs 100 Energy,
    // which a short weakling fight often never reaches, so they were
    // effectively basic-attack-only with a kit nobody ever saw fire.
    rarity: 2, rarityPlus: 1, stars: clamp(1 + Math.floor(level / 80), 1, 4),
    skillLv: Math.max(1, Math.round(level * .85)),
    cls: training.cls, subcls: training.subcls,
    classRank: training.classRank, subclassRank: training.subclassRank,
    mult: { hp: 1, atk: 1, def: 1 }
  };
}
