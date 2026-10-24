/* heroes10.js - The Door Opens collaboration roster.
   These Heroes are playable only after event acquisition. Their supplied
   frame atlases provide their natural combat animation in every mode. */
'use strict';

const COLLAB_SPRITES = {
  Sora: {
    idle:   { src: './uploads/soraidle.png', cols: 3, rows: 2, frames: [0, 1, 2, 3], fps: 6, bodyScale: 1, baseW: 60, cellW: 60, cellH: 73 },
    move:   { src: './uploads/335000105_standby.png', cols: 3, rows: 2, frames: [0, 1, 2, 3], fps: 9, bodyScale: 1, baseW: 60, cellW: 81, cellH: 68 },
    // These sheets contain several separate moves. The first six cells are
    // Sora's complete standard swing; the later cells are special attacks.
    attack: { src: './uploads/sorattack.png', cols: 3, rows: 7, frames: [0, 1, 2, 3, 4, 5], fps: 12, bodyScale: 1, baseW: 60, cellW: 247, cellH: 127, anchorX: 188, groundY: 106, once: true },
    cast:   { src: './uploads/soramagic.png', cols: 3, rows: 2, frames: [0, 1, 2, 3], fps: 11, bodyScale: 1, baseW: 60, cellW: 99, cellH: 71, once: true }
  },
  Riku: {
    idle:   { src: './uploads/rikuidle.png', cols: 3, rows: 3, frames: [0, 1, 2, 3], fps: 6, bodyScale: 1.15, baseW: 48, cellW: 48, cellH: 46 },
    move:   { src: './uploads/unit_standby_335000405.png', cols: 3, rows: 3, frames: [0, 1, 2, 3], fps: 9, bodyScale: 1.15, baseW: 48, cellW: 57, cellH: 48 },
    // Cells 6-11 form Riku's normal slash. The surrounding cells belong to
    // his other attacks and should not be chained into a basic animation.
    attack: { src: './uploads/rikuattarck.png', cols: 3, rows: 7, frames: [6, 7, 8, 9, 10, 11], fps: 12, bodyScale: 1.15, baseW: 48, cellW: 220, cellH: 101, once: true },
    cast:   { src: './uploads/rikumagic.png', cols: 3, rows: 2, frames: [0, 1, 2, 3], fps: 10, bodyScale: 1.15, baseW: 48, cellW: 73, cellH: 61, once: true }
  },
  Kairi: {
    idle:   { src: './uploads/kairiidle.png', cols: 3, rows: 3, frames: Array.from({ length: 8 }, (_, i) => i), fps: 7, bodyScale: 1.1, baseW: 89, cellW: 89, cellH: 83 },
    move:   { src: './uploads/kairstandby.png', cols: 3, rows: 2, frames: [0, 1, 2, 3], fps: 9, bodyScale: 1.1, baseW: 89, cellW: 101, cellH: 83 },
    // Kairi's attack strip includes several combo branches. Keep only the
    // six-frame standard strike at cells 27-32 for a single clean attack.
    attack: { src: './uploads/kairiattackspritesheet.png', cols: 3, rows: 24, frames: [27, 28, 29, 30, 31, 32], fps: 12, bodyScale: 1.1, baseW: 89, cellW: 302, cellH: 108, once: true },
    cast:   { src: './uploads/kairiskill.png', cols: 3, rows: 8, frames: Array.from({ length: 22 }, (_, i) => i), fps: 22, bodyScale: 1.1, baseW: 89, cellW: 110, cellH: 105, once: true }
  },
  Goofy: {
    idle: { src: './uploads/goofy-sprites-transparent.png', sheetW: 512, sheetH: 412, baseW: 50, frames: [0, 1, 2, 3], fps: 5, scale: .78,
      rects: [
        { x: 48, y: 150, w: 44, h: 64 }, { x: 87, y: 150, w: 47, h: 64 },
        { x: 130, y: 150, w: 53, h: 64 }, { x: 179, y: 150, w: 45, h: 64 }
      ] },
    move: { src: './uploads/goofy-sprites-transparent.png', sheetW: 512, sheetH: 412, baseW: 50, frames: [0, 1, 2, 3, 4, 5, 6], fps: 10, scale: .78,
      rects: [
        { x: 109, y: 343, w: 45, h: 69 }, { x: 147, y: 343, w: 37, h: 69 },
        { x: 175, y: 343, w: 35, h: 69 }, { x: 202, y: 343, w: 37, h: 69 },
        { x: 232, y: 343, w: 40, h: 69 }, { x: 264, y: 343, w: 43, h: 69 },
        { x: 299, y: 343, w: 45, h: 69 }
      ] },
    attack: { src: './uploads/goofy-sprites-transparent.png', sheetW: 512, sheetH: 412, baseW: 50, frames: [0, 1, 2, 3, 4, 5], fps: 18, scale: .78, once: true,
      rects: [
        { x: 122, y: 77, w: 67, h: 74 }, { x: 178, y: 77, w: 50, h: 74 },
        { x: 226, y: 77, w: 72, h: 74 }, { x: 292, y: 77, w: 70, h: 74 },
        { x: 369, y: 77, w: 75, h: 74 }, { x: 446, y: 77, w: 66, h: 74 }
      ] },
    cast: { src: './uploads/goofy-sprites-transparent.png', sheetW: 512, sheetH: 412, baseW: 50, frames: [0, 1, 2, 3, 4], fps: 10, scale: .78, once: true,
      rects: [
        { x: 37, y: 1, w: 46, h: 77 }, { x: 75, y: 1, w: 45, h: 77 },
        { x: 112, y: 8, w: 55, h: 70 }, { x: 159, y: 1, w: 46, h: 77 },
        { x: 198, y: 1, w: 46, h: 77 }
      ] },
    /* The source sheet's attack row is a complete shield-spin sequence.
       Exposing it as its own clip lets Tornado Bash request that motion by
       name while retaining all six authored frames. */
    spin: { src: './uploads/goofy-sprites-transparent.png', sheetW: 512, sheetH: 412, baseW: 50,
      frames: [0, 1, 2, 3, 4, 5], fps: 18, scale: .78, once: true,
      rects: [
        { x: 122, y: 77, w: 67, h: 74 }, { x: 178, y: 77, w: 50, h: 74 },
        { x: 226, y: 77, w: 72, h: 74 }, { x: 292, y: 77, w: 70, h: 74 },
        { x: 369, y: 77, w: 75, h: 74 }, { x: 446, y: 77, w: 66, h: 74 }
      ] }
  }
};

/* Skill previews need the same action order as the real kits, including calls
   hidden inside helpers or event callbacks that cannot be discovered by
   reading the skill's top-level cast function. */
const COLLAB_PREVIEW_ACTIONS = {
  Sora:  { W: ['attack'], G: ['cast'], B: ['spin'], P: ['idle'], R: ['cast'] },
  Riku:  { W: ['cast', 'attack'], G: ['cast'], B: ['move', 'attack'], P: ['attack'], R: ['cast', 'attack'] },
  Kairi: { W: ['attack'], G: ['cast'], B: ['cast', 'attack'], P: ['idle'], R: ['cast'] },
  Goofy: { W: ['cast', 'attack'], G: ['spin'], B: ['move', 'attack'], P: ['cast'], R: ['cast', 'attack'] }
};

function collabVoice(u, cue, opt) {
  if (Sound.collab) Sound.collab(u, cue, opt || { vol: .75 });
}

function soraGainCombo(u, target, B, amount) {
  B.applyStatus(u, u, 'combo', 999, { stacks: amount || 1 });
  if (target && target.alive) B.applyStatus(u, target, 'comboed', 6, { stacks: 1 });
}

function soraSpendCombo(u, B) {
  const st = u.getStatus('combo'), n = st ? st.stacks : 0;
  if (st) B.removeStatus(u, 'combo');
  return n;
}

function soraStrike(u, target, B, ratio, opt) {
  if (!target || !target.alive) return;
  opt = opt || {};
  B.damage(u, target, u.st.atk * ratio, { type: 'physical', tag: opt.tag || 'Keyblade Combo', noDodge: opt.noDodge });
  B.fxSlash(u, target, { col: opt.color || '#8edcff', big: !!opt.big });
  Sound.play('keyblade_hit', { vol: .62, throttle: 45 });
  if (opt.combo !== false) soraGainCombo(u, target, B, 1);
}

defHero({
  id: 'Sora', name: 'Sora', folder: 'Sora', file: 'Sora', icon: 'Sora',
  scale: 1.65, nativeFace: -1,
  role: 'Control', roleLabel: 'Combo Control', tier: 'S', position: 'Middle', element: 'Light',
  blurb: 'A visiting Keyblade wielder who turns clean strings of hits into launches, stuns, and explosive finishers.',
  base: { hp: 4650, atk: 405, def: 280, mag: 370, mdef: 290, spd: 132, acc: 210, eva: 158 },
  hidden: { range: 108, aspd: 1.22, ms: 94, aggro: .92, crit: .22, critDmg: 1.85, healPow: 1,
    shieldPow: 1.15, cdr: .12, ccRes: .32, kbRes: .42, armorPen: .20, magPen: .18 },
  growth: { hp: .098, atk: .104, def: .088, mag: .095, mdef: .086 },
  move: { gait: 'sprint', bob: 3, freq: 1.65, lean: 16, squash: .04, idle: 'natural', step: 'step_soft',
    particles: 'sparkle', pcol: '#8edcff', trail: { on: true, col: '#73d8ff', rate: .08 }, brake: .20 },
  basic: { name: 'Keyblade Chain', type: 'physical', ratio: 1.32, range: 108, sfx: 'sora_attack', hit: 'keyblade_hit', wind: .12, fastWind: true, attackAnim: .14,
    onHit: (u, t, B) => {
      soraGainCombo(u, t, B, 1);
      const c = u.getStatus('combo');
      if (c && c.stacks >= 5) {
        B.removeStatus(u, 'combo');
        B.damage(u, t, u.st.atk * 1.45, { type: 'physical', tag: 'Combo Finisher', forceCrit: true });
        B.applyStatus(u, t, 'launch', .65); B.fxBoom(t.x, t.y - 48, .9, '#f7fbff');
        // The finisher keeps Sora moving instead of erasing the haste his
        // Combo Master passive has just built.
        B.applyStatus(u, u, 'combo', 999, { stacks: 2 });
      }
    } },
  skills: {
    W: {
      name: 'Ars Arcanum', type: 'Physical Damage / Control', energy: 100,
      v: { hit: .72, finish: 2.35, splash: 1.20 }, p: { hits: 6, stun: 1.8 },
      desc: (S, P) => `<span class="sk-pas">Basic Attacks build 🔑 Combo. At five stacks, Sora launches his target and keeps two stacks.</span> Active: rushes the highest-Energy enemy with ${P.hits} Keyblade hits for <em>${pcn(S.hit * 100)}</em> Attack each, then spends Combo on a final <em>${pcn(S.finish * 100)}</em> Attack strike that gains 12% Damage per spent stack. The finisher Stuns for ${P.stun}s, splashes nearby enemies, and rebuilds two Combo.`,
      passive: () => {},
      cast: (u, B, S, P) => {
        let t = B.highestEnergy(B.enemiesOf(u)); if (!t) return;
        collabVoice(u, 'skill', { vol: .8, priority: true });
        B.anim(u, 'attack', 1.02); B.dash(u, t.x - u.face * 58, .18, { depth: t.depth });
        [ .16, .29, .42, .55, .68, .81 ].slice(0, P.hits).forEach((delay, i) => {
          B.after(delay, () => {
            if (!u.alive) return;
            if (!t || !t.alive) t = B.nearest(u, B.enemiesOf(u));
            if (t) soraStrike(u, t, B, S.hit, { tag: 'Ars Arcanum ' + (i + 1) });
          });
        });
        B.after(.94, () => {
          if (!u.alive) return;
          if (!t || !t.alive) t = B.nearest(u, B.enemiesOf(u));
          if (!t) return;
          const combo = soraSpendCombo(u, B);
          soraStrike(u, t, B, S.finish * (1 + combo * .12), { combo: false, tag: 'Ars Arcanum Finisher', color: '#fff7a8' });
          B.applyStatus(u, t, 'stun', P.stun); B.fxRing(t.x, t.y - 42, 132, '#fff7a8', .42); B.fxFloatIcon(t.x, t.y - 102, '✦', '#fff7a8');
          const nearby = B.enemiesOf(u).filter(e => e !== t && B.distance(e, t) < 185);
          nearby.forEach(e => {
            B.damage(u, e, u.st.atk * S.splash, { type: 'physical', area: true, tag: 'Ars Arcanum Shockwave' });
            B.applyStatus(u, e, 'comboed', 7, { stacks: 2 });
            B.interrupt(e); B.dash(e, e.x + u.face * 95, .22, { depth: e.depth });
          });
          B.applyStatus(u, u, 'combo', 999, { stacks: 2 });
          if (nearby.length) B.energy(u, Math.min(28, nearby.length * 9));
          B.shake(13, .3); B.flash('#d9f7ff', .28, .16);
        });
      }
    },
    G: {
      name: 'Thunder', type: 'Magic Damage / Control', cd: 7,
      v: { ratio: 1.95, shieldCrack: .40, comboBurst: .75 }, p: { shock: 3, delay: .4 },
      desc: (S, P) => `Calls lightning onto the three enemies with the highest Energy for <em>${pcn(S.ratio * 100)}</em> Magic Damage. Each bolt cracks <em>${pcn(S.shieldCrack * 100)}</em> of an active Shield, interrupts, and applies ${P.shock} Shock. Combo Locked targets take another Magic hit, are Stunned for 1.2s, and restore Sora’s Energy.`,
      ai: { prio: 62, cond: (u, B) => B.enemiesOf(u).length > 0 },
      cast: (u, B, S, P) => {
        collabVoice(u, 'magic'); B.anim(u, 'cast', .7);
        B.enemiesOf(u).slice().sort((a, b) => b.energy - a.energy).slice(0, 3).forEach((t, i) => B.after(P.delay + i * .12, () => {
          if (!u.alive || !t.alive) return;
          B.fxThunder(t, { size: 124, delay: i * 0.04 });
          Sound.play('shock_big', { vol: .58, throttle: 90 });
          B.crackShield(u, t, S.shieldCrack, { color: '#d9f7ff' });
          B.interrupt(t); B.damage(u, t, u.st.mag * S.ratio, { type: 'magic', tag: 'Thunder' });
          B.applyStatus(u, t, 'shock', 6, { stacks: P.shock, val: u.st.mag * .12 });
          if (t.hasStatus('comboed')) {
            B.damage(u, t, u.st.mag * S.comboBurst, { type: 'magic', tag: 'Thunder Combo Burst' });
            B.applyStatus(u, t, 'stun', 1.0); B.energy(u, 10);
          }
        }));
      }
    },
    B: {
      name: 'Back Off!', type: 'Physical Damage / Control / Shield', cd: 8.5,
      v: { ratio: 2.30, shield: .14 }, p: { radius: 215, stun: 1.2 },
      desc: (S, P) => `Sora breaks pressure with a circular Keyblade sweep, dealing <em>${pcn(S.ratio * 100)}</em> Attack to nearby enemies, interrupting and Stunning them for ${P.stun}s, then Knocking them Back. Hitting an enemy Shields the whole team for <em>${pcn(S.shield * 100)}</em> of each ally’s Max HP.`,
      ai: { prio: 78, cond: (u, B) => B.enemiesOf(u).some(e => B.distance(e, u) < 215) },
      cast: (u, B, S, P) => {
        collabVoice(u, 'skill'); B.anim(u, 'spin', .72); let hits = 0;
        B.enemiesOf(u).filter(e => B.distance(e, u) <= P.radius).forEach(e => {
          hits++; B.interrupt(e); soraStrike(u, e, B, S.ratio, { combo: false, tag: 'Back Off!' });
          B.applyStatus(u, e, 'stun', P.stun); B.dash(e, e.x + u.face * 150, .26, { depth: e.depth });
        });
        if (hits) B.alliesOf(u).forEach(a => B.shield(u, a, a.max.hp * S.shield, 7));
        B.fxRing(u.x, u.y - 42, P.radius, '#dff8ff', .55); B.shake(10, .24);
      }
    },
    P: {
      name: 'Combo Master', type: 'Skill Haste / Control',
      v: { haste: .065, dr: .045 }, p: { energy: 9 },
      desc: (S, P) => `Sora starts with two 🔑 Combo. Each stack grants <em>${pcn(S.haste * 100)}</em> Skill Haste and <em>${pcn(S.dr * 100)}</em> Damage Reduction. If an enemy dodges one of Sora’s attacks, he reads their movement: they become Combo Locked and his follow-up attacks cannot be Dodged for 5s. Stunning or launching an enemy restores <em>${P.energy}</em> Energy and advances his cooldowns.`,
      passive: (u, B, S, P) => {
        B.applyStatus(u, u, 'combo', 999, { stacks: 2 });
        u.flat.cdrCombo = 2 * S.haste; u.flat.dmgTakenCombo = -2 * S.dr; u.dirty = true;
        B.on(u, 'waveStart', () => {
          const c = u.getStatus('combo');
          if (!c || c.stacks < 2) B.applyStatus(u, u, 'combo', 999, { stacks: 2 });
          const n = (u.getStatus('combo') || {}).stacks || 2;
          u.flat.cdrCombo = n * S.haste; u.flat.dmgTakenCombo = -n * S.dr; u.dirty = true;
        });
        u.antiDodge = target => !!(target && (target.hasStatus('comboed') || B.t < (target._soraReadUntil || 0)));
        B.on(u, 'missed', ev => {
          const target = ev && ev.target;
          if (!target || !target.alive || target.team === u.team) return;
          target._soraReadUntil = B.t + 5;
          B.applyStatus(u, target, 'comboed', 5, { stacks: 1 });
          B.fxFloatIcon(target.x, target.y - 88, '🔑', '#fff7a8');
        });
        B.every(u, .25, () => {
          const c = u.getStatus('combo'), n = c ? c.stacks : 0;
          const haste = n * S.haste, guard = -n * S.dr;
          if (u.flat.cdrCombo !== haste || u.flat.dmgTakenCombo !== guard) {
            u.flat.cdrCombo = haste; u.flat.dmgTakenCombo = guard; u.dirty = true;
          }
        });
        B.on(u, 'statusApplied', ev => {
          if (ev.src !== u || !ev.unit || ev.unit.team === u.team || (ev.id !== 'stun' && ev.id !== 'launch')) return;
          if (B.t < (u._soraControlRefundAt || 0)) return;
          u._soraControlRefundAt = B.t + 1.5;
          B.energy(u, P.energy); B.reduceCd(u, .5);
        });
      }
    },
    R: {
      name: 'Trinity Limit', type: 'Physical Damage / Magic Damage / Control',
      v: { physical: 1.8, magic: 1.95 }, p: { cd: 18, energy: 14, hasteDur: 6 },
      desc: (S, P) => `Every ${P.cd.toFixed(1)}s, Sora unleashes Trinity Limit: it pulls every enemy to the center, interrupts them, and deals Physical and Magic Damage. Each enemy is left with 3 stacks of Combo Locked. Allies gain ${Math.round(P.energy)} Energy and ${P.hasteDur.toFixed(1)}s of Skill Haste.`,
      passive: (u, B, S, P) => {
        B.every(u, P.cd, () => {
          if (!u.alive) return;
          collabVoice(u, 'limit', { vol: .85, priority: true }); B.anim(u, 'cast', 1.0);
          const foes = B.enemiesOf(u);
          foes.forEach(e => { B.pull(e, B.midX, .35, e.depth); B.interrupt(e); });
          B.after(.42, () => {
            if (!u.alive) return;
            foes.forEach(e => { if (e.alive) {
              B.damage(u, e, u.st.atk * S.physical, { type: 'physical', tag: 'Trinity Limit' });
              B.damage(u, e, u.st.mag * S.magic, { type: 'magic', tag: 'Trinity Limit' });
              B.applyStatus(u, e, 'comboed', 8, { stacks: 3 });
            }});
          });
          B.alliesOf(u).forEach(a => { B.energy(a, P.energy); B.applyStatus(u, a, 'haste', P.hasteDur); });
          B.fxRing(B.midX, B.ground - 60, 420, '#f7ffff', .9); B.flash('#ffffff', .5, .3); B.shake(20, .7);
        });
      }
    }
  }
});

function rikuCounter(u, B, ratio, wide) {
  // Several protection callbacks can resolve on the same simulation tick
  // (shield break, ally interception, and a Resolve-triggered counter). Keep
  // one counter burst per tick so a clustered hit cannot duplicate its full
  // AoE damage, status work, and screen effects.
  if (u._rikuCounterTick === B.t) return;
  u._rikuCounterTick = B.t;
  B.anim(u, 'attack', wide ? .62 : .42);
  const foes = B.enemiesOf(u).filter(e => wide ? B.distance(e, u) < 225 : true);
  const targets = wide ? foes : [B.nearest(u, foes)].filter(Boolean);
  targets.forEach(t => {
    const bonus = t.hasStatus('darkmarked') ? 1.55 : 1;
    const counterDmg = (u.st.atk * ratio + (u.max.hp || 0) * .045) * bonus;
    B.damage(u, t, counterDmg, { type: 'physical', tag: 'Dark Pressure Counter', noDodge: true });
    B.applyStatus(u, t, 'weaken', 7, { stacks: 1 }); B.fxSlash(u, t, { col: '#9d74ff', big: !!wide });
    if (wide) B.dash(t, t.x + u.face * 95, .22, { depth: t.depth });
  });
  if (targets.length) {
    Sound.play('keyblade_hit', { vol: .7 });
    if (wide) B.fxRing(u.x, u.y - 44, 225, '#9d74ff', .38);
    B.shake(wide ? 14 : 7, .25);
  }
}

function rikuGuard(u, B, S, P, shortened) {
  const dur = shortened ? P.guard * .55 : P.guard;
  u.rikuGuardUntil = B.t + dur; u.rikuPressure = 0;
  B.anim(u, 'cast', .6); collabVoice(u, 'guard', { vol: .8, priority: true });
  B.fxRing(u.x, u.y - 42, 118, '#9d74ff', .38); B.fxFloatIcon(u.x, u.y - 98, '🌘', '#b99bff');
  B.shield(u, u, u.max.hp * S.shield, dur, { onBreak: () => {
    if (u.rikuGuardUntil > B.t) {
      rikuCounter(u, B, S.counter + u.rikuPressure, true);
      B.enemiesOf(u).filter(e => B.distance(e, u) < 225).forEach(e => B.applyStatus(u, e, 'stun', .85));
      u.rikuGuardUntil = 0;
    }
  }});
  B.alliesOf(u).filter(a => a !== u).forEach(a => B.shield(u, a, u.max.hp * (P.allyShield || .16), dur, { redirect: { to: u, pct: P.redirect } }));
  B.after(dur, () => {
    if (!u.alive || u.rikuGuardUntil <= 0) return;
    rikuCounter(u, B, S.counter + u.rikuPressure, true);
    B.enemiesOf(u).filter(e => B.distance(e, u) < 225).forEach(e => B.applyStatus(u, e, 'stun', .85));
    u.rikuGuardUntil = 0;
  });
}

defHero({
  id: 'Riku', name: 'Riku', folder: 'Riku', file: 'Riku', icon: 'Riku',
  scale: 1.75, nativeFace: -1,
  role: 'Tank', roleLabel: 'Counter Tank', tier: 'S', position: 'Frontline', element: 'Darkness',
  blurb: 'A defensive counter tank who intercepts danger, controls his darkness, and returns enemy pressure in one heavy slash.',
  base: { hp: 6500, atk: 340, def: 385, mag: 225, mdef: 365, spd: 106, acc: 195, eva: 108 },
  hidden: { range: 82, aspd: .95, ms: 78, aggro: 1.65, crit: .12, critDmg: 1.75, healPow: 1,
    shieldPow: 1.25, cdr: .05, ccRes: .45, kbRes: .85, armorPen: .18, magPen: .10 },
  growth: { hp: .112, atk: .092, def: .104, mag: .075, mdef: .102 },
  move: { gait: 'march', bob: 3, freq: 1.25, lean: 8, squash: .03, idle: 'sway', step: 'step_heavy',
    particles: 'sparkle', pcol: '#8165d9', trail: { on: true, col: '#6148a8', rate: .14 }, brake: .32 },
  basic: { name: 'Wayfinder Slash', type: 'physical', ratio: 1.15, range: 82, sfx: 'riku_attack', hit: 'keyblade_hit', wind: .27,
    onHit: (u, t, B) => { if (u.rikuCounterReady) { u.rikuCounterReady = false; B.removeStatus(u, 'resolve'); rikuCounter(u, B, 1.25, false); } } },
  skills: {
    W: {
      name: 'Dark Guard', type: 'Physical Damage / Shield', energy: 100,
      v: { shield: .60, counter: 1.95 }, p: { guard: 5.5, redirect: .80, allyShield: .16 },
      desc: (S, P) => `<span class="sk-pas">Taking Damage, Blocking, or protecting an ally builds 🌘 Resolve. At maximum Resolve, Riku's next Basic Attack becomes a counter slash and his next debuff starts a 3.5s immunity window.</span> Active: gains a large Shield for ${P.guard}s and redirects ${pc(P.redirect)} of ally Damage to himself. Hits store Dark Pressure, released as a wide Stun and Knock Back counter when the guard ends or breaks.`,
      passive: (u, B) => {
        B.on(u, 'damaged', ev => {
          if (ev.amount <= 0) return;
          let r = u.getStatus('resolve');
          if (!r || r.stacks < 6) B.applyStatus(u, u, 'resolve', 999, { stacks: 1 });
          r = u.getStatus('resolve');
          if (r && r.stacks >= 6) u.rikuCounterReady = true;
          if (u.rikuGuardUntil > B.t) u.rikuPressure = Math.min(2.5, (u.rikuPressure || 0) + ev.amount / u.max.hp * .80);
        });
        B.on(u, 'shieldDone', ev => { if (ev.target !== u) B.applyStatus(u, u, 'resolve', 999, { stacks: 1 }); });
        B.on(u, 'allyDamaged', ev => { if (ev.unit !== u && ev.src && ev.src.hasStatus('darkmarked')) ev.amount *= .80; });
      },
      cast: (u, B, S, P) => rikuGuard(u, B, S, P, false)
    },
    G: {
      name: 'Dark Firaga', type: 'Magic Damage / Control', cd: 8,
      v: { ratio: 2.25, shieldCrack: .45 }, p: { weaken: 9 },
      desc: (S, P) => `Fires at the enemy with the highest Attack, cracking <em>${pcn(S.shieldCrack * 100)}</em> of an active Shield before dealing <em>${pcn(S.ratio * 100)}</em> Magic Damage and applying 2 stacks of 🥀 Weaken for ${P.weaken}s. If that target has already dealt Damage this battle, it is also 🌑 Marked by Darkness and deals less Damage to allies other than Riku.`,
      ai: { prio: 66, cond: (u, B) => B.enemiesOf(u).length > 0 },
      cast: (u, B, S, P) => {
        const t = B.topN(B.enemiesOf(u), 'atk', 1)[0]; if (!t) return;
        collabVoice(u, 'skill'); B.anim(u, 'cast', .55); B.fxProj(u, t, { kind: 'orb', col: '#7447c7' }, () => {
          if (!u.alive || !t.alive) return;
          B.crackShield(u, t, S.shieldCrack, { color: '#9d74ff' });
          B.damage(u, t, u.st.mag * S.ratio, { type: 'magic', tag: 'Dark Firaga' });
          B.applyStatus(u, t, 'weaken', P.weaken, { stacks: 2 });
          if (t.dmgDone > 0) B.applyStatus(u, t, 'darkmarked', P.weaken);
        });
      }
    },
    B: {
      name: 'Way to the Dawn', type: 'Physical Damage / Healing', cd: 9.5,
      v: { ratio: 2.15, heal: .65, shield: .32, receptive: .35 }, p: { intercept: 5.5, prevented: .50 },
      desc: (S, P) => `Dashes to the lowest-HP ally, grants them a redirecting Shield for ${P.intercept}s, and gives them 💞 Receptive for <em>${pcn(S.receptive * 100)}</em> increased Healing Received. The first enemy to hit them is countered, receives 2 stacks of 🐢 Slow, and Riku Heals from the prevented Damage. Allies below 50% HP gain an extra Shield.`,
      ai: { prio: 84, cond: (u, B) => B.alliesOf(u).some(a => a !== u && a.hpPct < .62) },
      cast: (u, B, S, P) => {
        const a = B.lowestHp(B.alliesOf(u).filter(x => x !== u)); if (!a) return;
        collabVoice(u, 'guard'); B.dash(u, a.x - u.face * 45, .3, { depth: a.depth });
        B.shield(u, a, a.max.hp * .22, P.intercept, { redirect: { to: u, pct: .80 } });
        B.applyStatus(u, a, 'receptive', P.intercept, { val: S.receptive });
        if (a.hpPct < .5) B.shield(u, a, u.max.hp * S.shield, 7);
        let used = false;
        const off = B.on(u, 'allyDamaged', ev => {
          if (used || ev.unit !== a || !ev.src || ev.src.team === u.team || B.t > (u._dawnUntil || 0)) return;
          used = true; const prevented = ev.amount * P.prevented; ev.amount -= prevented;
          rikuCounter(u, B, S.ratio, false); B.applyStatus(u, ev.src, 'slow', 5, { stacks: 2 });
          B.heal(u, u, prevented + u.st.atk * S.heal, { tag: 'Way to the Dawn' }); off();
        });
        u._dawnUntil = B.t + P.intercept;
        B.after(P.intercept, off);
      }
    },
    P: {
      name: 'Controlled Darkness', type: 'Armor / Magic Defense / Damage Reduction',
      v: { defense: .38, reduction: .35, leech: .30 }, p: {},
      desc: (S) => `Above half HP, Riku gains <em>${pcn(S.defense * 100)}</em> Armor and Magic Defense. Below half HP, he gains <em>${pcn(S.reduction * 100)}</em> Damage Reduction and his counters Heal him for <em>${pcn(S.leech * 100)}</em> of Damage dealt. Resolve shortens disabling effects, and maximum Resolve turns the next incoming debuff into a 3.5s immunity window.`,
      passive: (u, B, S) => {
        const initHigh = u.hpPct > .5;
        u.flat.defPControlled = initHigh ? S.defense : 0;
        u.flat.mdefPControlled = initHigh ? S.defense : 0;
        u.flat.dmgTakenControlled = initHigh ? 0 : -S.reduction;
        u.dirty = true;
        u.guards = u.guards || [];
        u.guards.push((id, d) => {
          const r = u.getStatus('resolve');
          if (!r || r.stacks < 6 || !d || d.kind !== 'debuff') return false;
          B.applyStatus(u, u, 'ccimmune', 3.5);
          B.removeStatus(u, 'resolve');
          u.rikuCounterReady = true;
          return true;
        });
        B.every(u, .25, () => {
          const high = u.hpPct > .5;
          const targetDef = high ? S.defense : 0;
          const targetDr = high ? 0 : -S.reduction;
          if (u.flat.defPControlled !== targetDef || u.flat.dmgTakenControlled !== targetDr) {
            u.flat.defPControlled = targetDef; u.flat.mdefPControlled = targetDef;
            u.flat.dmgTakenControlled = targetDr; u.dirty = true;
          }
        });
        B.on(u, 'statusApplied', ev => {
          if (ev.unit !== u || !STATUS[ev.id] || !STATUS[ev.id].cc) return;
          const r = u.getStatus('resolve'); if (!r) return;
          if (r.stacks >= 6) { B.applyStatus(u, u, 'ccimmune', 3.5); B.removeStatus(u, ev.id); B.removeStatus(u, 'resolve'); rikuCounter(u, B, 1.15, false); }
          else { const st = u.getStatus(ev.id); if (st) st.t *= Math.max(.35, 1 - r.stacks * .1); }
        });
        B.on(u, 'dealDamage', ev => { if (u.hpPct < .5 && ev.tag && ev.tag.includes('Counter')) B.heal(u, u, ev.amount * S.leech, { silent: true }); });
      }
    },
    R: {
      name: 'Road to Dawn', type: 'Physical Damage / Max HP / Shield',
      v: { hp: .060 }, p: { cap: .45 },
      desc: (S, P) => `Starts each wave with 3 stacks of 🌘 Resolve. Shielding an ally permanently increases Riku’s Max HP by <em>${pcn(S.hp * 100)}</em>, up to ${pc(P.cap)}. Dark Pressure counters apply ⚖ Unbalanced. Once per wave, lethal Damage leaves Riku at 1 HP, cleanses him, and immediately starts a shortened Dark Guard.`,
      passive: (u, B, S, P) => {
        B.applyStatus(u, u, 'resolve', 999, { stacks: 3 }); u.rikuRoadHp = 0;
        B.on(u, 'waveStart', () => {
          u.rikuLastStand = false;
          B.applyStatus(u, u, 'resolve', 999, { stacks: 3 });
        });
        B.on(u, 'shieldDone', ev => { if (ev.target === u || u.rikuRoadHp >= P.cap) return;
          u.rikuRoadHp = Math.min(P.cap, u.rikuRoadHp + S.hp); u.flat.hpPRoad = u.rikuRoadHp; u.dirty = true;
        });
        B.on(u, 'dealDamage', ev => { if (ev.tag && ev.tag.includes('Counter') && ev.target) B.applyStatus(u, ev.target, 'unbalanced', 7); });
        B.on(u, 'lethal', ev => { if (u.rikuLastStand) return; u.rikuLastStand = true; ev.prevented = true; u.hp = 1; B.cleanse(u, 99);
          B.applyStatus(u, u, 'resolve', 999, { stacks: 6 }); rikuGuard(u, B, { shield: .35, counter: 1.25 }, { guard: 4, redirect: .30 }, true);
        });
      }
    }
  }
});

function kairiGleam(u, target, B, stacks) {
  B.applyStatus(u, target, 'gleam', 9, { stacks: stacks || 1 });
  const g = target.getStatus('gleam');
  if (u.kairiOath && g && g.stacks >= 3) B.applyStatus(u, target, 'exposedlight', 7);
}

defHero({
  id: 'Kairi', name: 'Kairi', folder: 'Kairi', file: 'Kairi', icon: 'Kairi',
  scale: 1.65, nativeFace: -1,
  role: 'Control', roleLabel: 'All-rounder Control', tier: 'S', position: 'Middle', element: 'Light',
  blurb: 'An all-rounder who turns light marks into safe zones, counter windows, and clean bursts of mixed damage.',
  base: { hp: 4550, atk: 320, def: 270, mag: 415, mdef: 330, spd: 120, acc: 210, eva: 150 },
  hidden: { range: 126, aspd: 1.12, ms: 82, aggro: .83, crit: .16, critDmg: 1.70, healPow: 1.28,
    shieldPow: 1.24, cdr: .12, ccRes: .32, kbRes: .45, armorPen: .14, magPen: .20 },
  growth: { hp: .096, atk: .090, def: .088, mag: .104, mdef: .094 },
  move: { gait: 'march', bob: 4, freq: 1.35, lean: 8, squash: .035, idle: 'sway', step: 'step_soft',
    particles: 'sparkle', pcol: '#ffd5f2', trail: { on: true, col: '#ffb8e6', rate: .13 }, brake: .28 },
  basic: { name: 'Gleaming Strike', type: 'physical', ratio: 1.20, range: 126, sfx: 'kairi_attack', hit: 'keyblade_hit', wind: .23,
    onHit: (u, t, B) => kairiGleam(u, t, B, 1) },
  skills: {
    W: {
      name: 'Lightbound Strike', type: 'Physical Damage / Magic Damage / Control', energy: 100,
      v: { physical: 1.15, magic: 1.75, shield: .14, heal: .60 }, p: { blind: 4.5 },
      desc: (S, P) => `<span class="sk-pas">Basic Attacks apply ✨ Gleam. When a Gleaming enemy attacks an ally, Kairi periodically gives that ally a Shield and gains Energy.</span> Active: dashes through every enemy, marking them, then bursts Gleam for Magic Damage and Blinds them for ${P.blind}s. The team gains Shields and the weakest ally is Healed.`,
      passive: (u, B) => B.on(u, 'allyDamaged', ev => {
        if (!ev.src || !ev.src.hasStatus('gleam') || !ev.unit || !ev.unit.alive) return;
        if (B.t < (ev.unit._kairiLightWardAt || 0)) return;
        ev.unit._kairiLightWardAt = B.t + 2.5;
        B.energy(u, 8); B.shield(u, ev.unit, u.st.mag * .45, 4.5);
      }),
      cast: (u, B, S, P) => {
        const foes = B.enemiesOf(u); if (!foes.length) return;
        collabVoice(u, 'skill', { vol: .8, priority: true }); B.anim(u, 'attack', .9);
        foes.forEach((t, i) => B.after(i * .10, () => {
          if (!u.alive || !t.alive) return;
          B.dash(u, t.x - u.face * 50, .12, { depth: t.depth });
          B.damage(u, t, u.st.atk * S.physical, { type: 'physical', tag: 'Lightbound Strike' });
          kairiGleam(u, t, B, 1); B.fxSlash(u, t, { col: '#ffd7f2' });
        }));
        B.after(.52, () => {
          if (!u.alive) return;
          let blinded = 0;
          foes.forEach(t => {
            if (!t.alive) return;
            const g = t.getStatus('gleam'); if (!g) return;
            B.damage(u, t, u.st.mag * S.magic * (1 + (g.stacks - 1) * .25), { type: 'magic', tag: 'Lightbound Burst' });
            B.applyStatus(u, t, 'blind', P.blind);
            blinded++;
            if (u.kairiOath) g.stacks = Math.max(1, g.stacks - 1);
          });
          if (blinded) {
            B.alliesOf(u).forEach(a => B.shield(u, a, a.max.hp * S.shield, 6));
            const weak = B.lowestHp(B.alliesOf(u));
            if (weak) { B.heal(u, weak, u.st.mag * S.heal * Math.min(3, blinded), { tag: 'Lightbound Renewal' }); B.fxPool(weak.x, 4, '#ffd0ed', 105); }
          }
          B.flash('#fff3fb', .32, .2); B.fxRing(u.x, u.y - 44, 310, '#ffd0ed', .65);
        });
      }
    },
    G: {
      name: 'Radiant Circle', type: 'Magic Damage / Control / Shield / Healing', cd: 11,
      v: { tick: .58, shield: .20, allyShield: .08, heal: .26 }, p: { dur: 6, radius: 205 },
      desc: (S, P) => `Creates a light circle around the lowest-HP ally for ${P.dur}s, Shielding and cleansing them while giving the team smaller Shields. Each second, it Heals that ally and damages enemies inside; ✨ Gleaming enemies are struck even outside the circle. Enemies in the circle are Slowed, and marked enemies there are Rooted. It ends in a burst that Knocks enemies Back.`,
      ai: { prio: 74, cond: (u, B) => B.alliesOf(u).some(a => a.hpPct < .86) || B.enemiesOf(u).some(e => e.hasStatus('gleam')) },
      cast: (u, B, S, P) => {
        const a = B.lowestHp(B.alliesOf(u)); if (!a) return;
        collabVoice(u, 'protect'); B.anim(u, 'cast', .65);
        B.alliesOf(u).forEach(ally => B.shield(u, ally, ally.max.hp * (ally === a ? S.shield : S.allyShield), P.dur));
        B.cleanse(a, 3);
        B.fxPool(a.x, P.dur, '#ffd0ed', P.radius);
        let ticks = 0; const pulse = () => {
          if (!u.alive || !a.alive || ticks++ >= P.dur) return;
          B.heal(u, a, u.st.mag * S.heal, { tag: 'Radiant Circle' });
          B.enemiesOf(u).filter(e => B.distance(e, a) <= P.radius || e.hasStatus('gleam')).forEach(e => {
            const inside = B.distance(e, a) <= P.radius;
            B.damage(u, e, u.st.mag * S.tick * (inside ? 1 : .6), { type: 'magic', dot: true, tag: 'Radiant Circle' });
            if (inside) { B.applyStatus(u, e, 'slow', 2); if (e.hasStatus('gleam')) B.applyStatus(u, e, 'root', .85); }
          });
          B.after(1, pulse);
        }; pulse();
        B.after(P.dur, () => {
          if (!u.alive || !a.alive) return;
          B.enemiesOf(u).filter(e => B.distance(e, a) <= P.radius + 35 || e.hasStatus('gleam')).forEach(e => {
            B.damage(u, e, u.st.mag * S.tick * 2.0, { type: 'magic', tag: 'Radiant Circle Burst' });
            if (B.distance(e, a) <= P.radius + 35) B.dash(e, e.x + u.face * 90, .22, { depth: e.depth });
          });
          B.fxRing(a.x, a.y - 40, P.radius + 40, '#fff4fb', .55);
        });
      }
    },
    B: {
      name: 'Heart’s Counter', type: 'Physical Damage / Healing / Control', cd: 9,
      v: { ratio: 2.75, heal: 1.25, shieldCrack: .60, splash: .95 }, p: { ready: 7, slow: 7, seal: 5 },
      desc: (S, P) => `Prepares for ${P.ready}s. The next enemy to Damage any ally is counterattacked for <em>${pcn(S.ratio * 100)}</em> Attack: Kairi cracks its Shield, removes buffs, Slows and Buff Seals it, and spreads Gleam to nearby foes. She Heals and Shields the ally it struck, with a stronger Heal if the attacker was Gleaming. If no counter triggers, she strikes the highest-Attack enemy instead.`,
      ai: { prio: 70, cond: () => true },
      cast: (u, B, S, P) => {
        collabVoice(u, 'protect'); B.anim(u, 'cast', .5); u.kairiCounterUntil = B.t + P.ready; u.kairiCounterUsed = false;
        const off = B.on(u, 'allyDamaged', ev => {
          if (u.kairiCounterUsed || B.t > u.kairiCounterUntil || !ev.src || ev.src.team === u.team) return;
          if (!ev.unit || !ev.unit.alive) return;
          u.kairiCounterUsed = true; B.dash(u, ev.src.x - u.face * 54, .2, { depth: ev.src.depth });
          B.after(.18, () => {
            if (!u.alive || !ev.src.alive) return;
            const marked = ev.src.hasStatus('gleam');
            B.crackShield(u, ev.src, S.shieldCrack, { color: '#ffd0ed' });
            B.anim(u, 'attack', .48); B.fxRing(ev.src.x, ev.src.y - 42, 94, '#ffd0ed', .32);
            B.damage(u, ev.src, u.st.atk * S.ratio + u.st.mag * .65, { type: 'physical', tag: 'Heart’s Counter', noDodge: true });
            B.dispel(ev.src, 3); B.applyStatus(u, ev.src, 'buffsealed', P.seal, { stacks: 1 }); B.applyStatus(u, ev.src, 'slow', P.slow, { stacks: 2 });
            kairiGleam(u, ev.src, B, 1);
            B.enemiesOf(u).filter(e => e !== ev.src && B.distance(e, ev.src) < 175).forEach(e => {
              B.damage(u, e, u.st.mag * S.splash, { type: 'magic', area: true, tag: 'Heart’s Counter Light' });
              kairiGleam(u, e, B, 1);
            });
            if (ev.unit.alive) {
              B.heal(u, ev.unit, u.st.mag * S.heal * (marked ? 1.6 : 1), { tag: 'Heart’s Counter' });
              B.shield(u, ev.unit, ev.unit.max.hp * .16, 6);
            }
            Sound.play('keyblade_hit', { vol: .7 });
          });
        });
        B.after(P.ready, () => {
          off();
          if (u.kairiCounterUsed || !u.alive) return;
          const t = B.topN(B.enemiesOf(u), 'atk', 1)[0];
          if (t) {
            B.damage(u, t, u.st.atk * S.ratio + u.st.mag * .65, { type: 'physical', tag: 'Heart’s Counter' });
            kairiGleam(u, t, B, 2);
          }
        });
      }
    },
    P: {
      name: 'Princess of Heart', type: 'Magic Damage / Shield / Control',
      v: { punish: .80, rescueShield: .18 }, p: { missEnergy: 16, rescueCd: 13 },
      desc: (S, P) => `Shielding an ally makes their next Basic Attack apply Gleam and grants 3s immunity to debuffs. When a Gleaming enemy misses, Kairi deals <em>${pcn(S.punish * 100)}</em> Magic Damage and drains Energy. An ally facing a hit that would leave them below 50% HP receives an emergency Shield and cleanse, once every ${P.rescueCd}s per ally.`,
      passive: (u, B, S, P) => {
        const hookEnemy = e => {
          if (!e || e._kairiMissHooked) return;
          e._kairiMissHooked = true;
          B.on(e, 'missed', ev => {
            if (!u.alive || !e.hasStatus('gleam')) return;
            B.damage(u, e, u.st.mag * S.punish, { type: 'magic', tag: 'Princess of Heart', noDodge: true });
            e.energy = Math.max(0, e.energy - P.missEnergy);
          });
        };
        B.enemiesOf(u).forEach(hookEnemy);
        B.on(u, 'waveStart', () => { B.enemiesOf(u).forEach(hookEnemy); });
        B.every(u, 1.0, () => { B.enemiesOf(u).forEach(hookEnemy); });

        B.on(u, 'allyDamaged', ev => {
          const a = ev.unit;
          if (!u.alive || !a || !a.alive || !ev.src || ev.src.team === u.team || ev.amount <= 0) return;
          if (a.hasStatus('shield')) B.cleanse(a, 2);
          const hpAfterHit = a.hp - Math.max(0, ev.amount - a.shieldTotal);
          if (hpAfterHit > a.max.hp * .50 || B.t < (a._kairiRescueAt || 0)) return;
          a._kairiRescueAt = B.t + P.rescueCd;
          B.shield(u, a, a.max.hp * S.rescueShield, 6); B.cleanse(a, 2);
          B.fxRing(a.x, a.y - 42, 105, '#ffd0ed', .4);
        });

        B.on(u, 'shieldDone', ev => {
          const a = ev && ev.target;
          if (!a || a.team !== u.team || ev.amount <= 0) return;
          a.kairiGleamBasic = u;
          a._kairiDebuffImmuneUntil = Math.max(a._kairiDebuffImmuneUntil || 0, B.t + 3);
          B.applyStatus(u, a, 'ccimmune', 3);
          if (!a._kairiBasicHook) {
            a._kairiBasicHook = true;
            B.on(a, 'basicHit', bev => {
              if (!a.kairiGleamBasic || !bev.target) return;
              kairiGleam(u, bev.target, B, 1);
              a.kairiGleamBasic = null;
            });
          }
          if (!a._kairiShieldGuard) {
            a._kairiShieldGuard = true;
            a.guards = a.guards || [];
            a.guards.push((id, d) => !!(d && d.kind === 'debuff' && B.t < (a._kairiDebuffImmuneUntil || 0)));
          }
        });
      }
    },
    R: {
      name: 'Oath of Light', type: 'Physical Damage / Magic Damage / Control',
      v: { rescue: .40, teamHeal: .12, teamShield: .12 }, p: { max: 3 },
      desc: (S, P) => `Enemies hold up to ${P.max} ✨ Gleam stacks; maximum Gleam applies ☀ Exposed to Light. Lightbound Strike consumes Gleam for extra burst Damage. Once per wave, Kairi survives lethal Damage at <em>${pcn(S.rescue * 100)}</em> HP, cleanses herself, marks and Blinds enemies, then Heals and Shields the team.`,
      passive: (u, B, S) => {
        u.kairiOath = true;
        B.on(u, 'waveStart', () => { u.kairiRescue = false; });
        B.on(u, 'lethal', ev => {
          if (u.kairiRescue) return;
          u.kairiRescue = true; ev.prevented = true; u.hp = u.max.hp * S.rescue; B.cleanse(u, 99);
          B.enemiesOf(u).forEach(e => { kairiGleam(u, e, B, 2); B.applyStatus(u, e, 'blind', 5); });
          B.alliesOf(u).forEach(a => { B.heal(u, a, a.max.hp * S.teamHeal, { tag: 'Oath of Light' }); B.shield(u, a, a.max.hp * S.teamShield, 7); });
          B.flash('#fff4fb', .55, .35); B.fxRing(u.x, u.y - 44, 230, '#ffd0ed', .75);
        });
      }
    }
  }
});

/* ============================================================ GOOFY
   Dependable shield tank / Ally interception - A Tier */
function goofyCharge(u, B, amount, fill) {
  let st = u.getStatus('shieldcharge');
  if (!st) {
    B.applyStatus(u, u, 'shieldcharge', 999, { stacks: fill ? 5 : (amount || 1) });
    st = u.getStatus('shieldcharge');
  } else {
    st.stacks = fill ? 5 : Math.min(5, st.stacks + (amount || 1));
    st.t = 999; u.dirty = true;
  }
  return st ? st.stacks : 0;
}

function goofySturdy(u, B) {
  if (!u.goofySturdyEnabled) return;
  B.applyStatus(u, u, 'fortify', 7, { stacks: 1 });
}

function goofyBehind(u, ally) {
  return u.face >= 0 ? ally.x <= u.x + 28 : ally.x >= u.x - 28;
}

function goofyIntercept(u, ally, attacker, B, S, P, ev, automatic) {
  if (!u.alive || !ally || !ally.alive || !attacker || !ev || ev.amount <= 0) return false;
  const moved = ev.amount; ev.amount = 0;
  collabVoice(u, 'protect', { vol: automatic ? .68 : .78, priority: !!automatic });
  B.dash(u, ally.x - u.face * 42, .22, { depth: ally.depth });
  B.after(0, () => { if (u.alive) B.damage(attacker, u, moved, { type: 'true', redirected: true, tag: 'Bodyguard' }); });
  B.after(.2, () => {
    if (!u.alive || !attacker.alive) return;
    B.anim(u, 'attack', .46); B.damage(u, attacker, u.st.atk * S.ratio, { type: 'physical', melee: true, tag: 'Bodyguard Counter', noDodge: true });
    B.applyStatus(u, attacker, 'attackdown', P.debuff, { val: P.attackDown });
    B.fxGoofy('intercept', u); B.fxSlash(u, attacker, { col: '#f6c27a', big: true }); Sound.play('hit_blunt', { vol: .62 });
  });
  B.shield(u, ally, u.max.hp * S.shield, 7);
  if (ally.hpPct < .5) B.cleanse(ally, 2);
  goofySturdy(u, B);
  if (u.goofyKnightLoyalty) {
    goofyCharge(u, B, 5, true);
    u.goofyTornadoEmpowered = true;
  }
  return true;
}

defHero({
  id: 'Goofy', name: 'Goofy', folder: 'Goofy', file: 'Goofy', icon: 'Goofy',
  scale: 1.55, nativeFace: 1,
  role: 'Tank', roleLabel: 'Shield Tank', tier: 'A', position: 'Frontline', element: 'Shield',
  blurb: 'A dependable frontline guardian who blocks attacks, intercepts danger, and resets enemy pressure with his shield.',
  base: { hp: 5980, atk: 298, def: 334, mag: 118, mdef: 318, spd: 94, acc: 184, eva: 88 },
  hidden: { range: 78, aspd: .84, ms: 68, aggro: 1.62, crit: .08, critDmg: 1.58, healPow: 1,
    shieldPow: 1.22, cdr: .03, ccRes: .32, kbRes: .76, armorPen: .08, magPen: 0 },
  growth: { hp: .101, atk: .079, def: .094, mag: .04, mdef: .091 },
  move: { gait: 'march', bob: 4, freq: 1.2, lean: 7, squash: .035, idle: 'sway', step: 'step_heavy',
    particles: 'sparkle', pcol: '#78d7ff', trail: { on: true, col: '#4fa9d8', rate: .16 }, brake: .34 },
  basic: { name: 'Shield Strike', type: 'physical', ratio: .94, range: 78, sfx: 'goofy_attack', hit: 'hit_blunt', wind: .3,
    onHit: (u, t, B) => { if (chance(.18)) B.knockback(u, t, 14); } },
  skills: {
    W: {
      name: 'Goofy Shield', type: 'Shield / Physical Damage', energy: 100,
      v: { ratio: 1.18, perCharge: .16, redShield: .075 }, p: { guard: 5, blockCd: 3.2, redirect: .28, reduction: .18, kb: 145 },
      desc: (S, P) => `<span class="sk-pas">Standing still grants 🛡️ Guard Stance: Armor, Magic Defense, and one blocked Basic Attack every ${P.blockCd}s. Blocks build 🔷 Shield Charge (max 5), strengthening Shields.</span>
        Guard Stance also grants 2.5s of debuff immunity when its protection triggers, once every ${4.8}s.
        Active: guards allies behind Goofy for ${P.guard}s, reducing their Damage and redirecting ${pc(P.redirect)} of Damage aimed at the weakest ally. When guard ends, Goofy throws his shield through the enemy line, dealing <em>${pcn(S.ratio * 100)}</em> Attack plus extra Damage per Shield Charge and Knocking enemies Back. All charges are consumed.`,
      passive: (u, B, S, P) => {
        u.goofyNextBlock = 0;
        u.goofyStatusBlockAt = 0;
        u.goofyDebuffImmuneUntil = 0;
        u.guards = u.guards || [];
        u.guards.push((id, d, battle) => {
          if (!u.hasStatus('guardstance') || !d || d.kind !== 'debuff') return false;
          if (battle.t < u.goofyDebuffImmuneUntil) return true;
          if (battle.t < u.goofyStatusBlockAt) return false;
          u.goofyStatusBlockAt = battle.t + 4.8;
          u.goofyDebuffImmuneUntil = battle.t + 2.5;
          B.applyStatus(u, u, 'ccimmune', 2.5);
          return true;
        });
        B.every(u, .2, () => {
          const planted = !u.moving;
          if (planted && !u.hasStatus('guardstance')) B.applyStatus(u, u, 'guardstance', 999);
          else if (!planted && u.hasStatus('guardstance')) B.removeStatus(u, 'guardstance');
        });
        B.on(u, 'damaged', ev => {
          if (ev.basic && !ev.redirected && u.hasStatus('guardstance') && B.t >= u.goofyNextBlock) {
            ev.amount = 0; u.goofyNextBlock = B.t + P.blockCd; goofyCharge(u, B, 1); goofySturdy(u, B);
            B.floatNum(u, -96, 'BLOCKED', 'block'); B.fxGoofy('block', u); Sound.play('block', { vol: .7 });
          } else if (ev.amount > 0 && !ev.redirected && chance(.12)) {
            collabVoice(u, 'hurt', { vol: .5 });
          }
        });
        B.on(u, 'allyDamaged', ev => {
          if (B.t > (u.goofyGuardUntil || 0) || ev.redirected || ev.unit === u || !goofyBehind(u, ev.unit)) return;
          ev.amount *= 1 - P.reduction;
          const weakest = B.lowestHp(B.alliesOf(u).filter(a => a !== u));
          if (weakest !== ev.unit || ev.amount <= 0) return;
          const moved = ev.amount * P.redirect; ev.amount -= moved; goofySturdy(u, B);
          B.after(0, () => { if (u.alive) B.damage(ev.src, u, moved, { type: 'true', redirected: true, tag: 'Goofy Shield' }); });
        });
      },
      cast: (u, B, S, P) => {
        collabVoice(u, 'protect', { vol: .8, priority: true }); B.anim(u, 'cast', .7);
        u.goofyGuardUntil = B.t + P.guard; B.fxGoofy('guard', u, { dur: P.guard });
        if (u.goofyKnightLoyalty) B.alliesOf(u).forEach(a => B.shield(u, a, u.max.hp * S.redShield, P.guard + 2));
        B.after(P.guard, () => {
          if (!u.alive) return;
          const st = u.getStatus('shieldcharge'), charges = st ? st.stacks : 0;
          if (st) B.removeStatus(u, 'shieldcharge');
          B.anim(u, 'attack', .75); Sound.play('goofy_skill', { vol: .78, priority: true }); Sound.play('skill_impact', { vol: .5, throttle: 300 });
          const line = B.enemiesOf(u).filter(e => (e.x - u.x) * u.face >= -35 && Math.abs(e.depth - u.depth) < .44);
          const lead = line.slice().sort((a, b) => Math.abs(a.x - u.x) - Math.abs(b.x - u.x))[0];
          B.fxGoofy('throw', u);
          if (lead) B.fxProj(u, lead, { kind: 'obj', img: 'goofy-shield', size: 44, col: '#f29a2e', spin: 14 });
          line.forEach(e => {
            B.damage(u, e, u.st.atk * (S.ratio + S.perCharge * charges), { type: 'physical', area: true, tag: 'Goofy Shield' });
            B.knockback(u, e, P.kb); B.fxSlash(u, e, { col: '#9fe9ff', big: true });
          });
          if (u.goofyKnightLoyalty) B.alliesOf(u).forEach(a => B.shield(u, a, u.max.hp * S.redShield, 7));
          B.fxRing(u.x + u.face * 140, u.y - 46, 230, '#d7f7ff', .65); B.shake(12, .3);
        });
      }
    },
    G: {
      name: 'Tornado Bash', type: 'Physical Damage / Control', cd: 10,
      v: { ratio: 1.42, shield: .16 }, p: { radius: 175, slow: 5, kb: 112, stun: .8 },
      desc: (S, P) => `Spins forward with his shield, dealing <em>${pcn(S.ratio * 100)}</em> Attack to nearby enemies, pushing them away from the backline, and reducing their Attack Speed for ${P.slow}s. Hitting at least two enemies grants a <em>${pcn(S.shield * 100)}</em> Max HP Shield. At maximum 🔷 Shield Charge, the closest enemy is also Stunned.`,
      ai: { prio: 72, cond: (u, B) => B.enemiesOf(u).some(e => B.distance(e, u) < 210) },
      cast: (u, B, S, P) => {
        const charged = u.getStatus('shieldcharge'), maximum = charged && charged.stacks >= 5;
        const empowered = !!u.goofyTornadoEmpowered; u.goofyTornadoEmpowered = false;
        B.anim(u, 'spin', .72); B.dash(u, u.x + u.face * 105, .24, { depth: u.depth }); Sound.play('tornado_s', { vol: .58 });
        B.after(.2, () => {
          const hits = B.enemiesOf(u).filter(e => B.distance(e, u) <= P.radius);
          const closest = hits.slice().sort((a, b) => B.distance(a, u) - B.distance(b, u))[0];
          hits.forEach(e => {
            B.damage(u, e, u.st.atk * S.ratio * (empowered ? 1.45 : 1), { type: 'physical', melee: true, area: true, tag: 'Tornado Bash' });
            B.applyStatus(u, e, 'slow', P.slow); B.knockback(u, e, P.kb);
          });
          if (hits.length >= 2) B.shield(u, u, u.max.hp * S.shield, 7);
          if (maximum && closest) B.applyStatus(u, closest, 'stun', P.stun);
          B.fxGoofy('tornado', u, { radius: P.radius }); B.shake(hits.length >= 2 ? 11 : 6, .25); Sound.play('tornado_e', { vol: .55 });
        });
      }
    },
    B: {
      name: 'Bodyguard', type: 'Shield / Physical Damage', cd: 12,
      v: { ratio: 1.34, shield: .13 }, p: { ready: 5, debuff: 6, attackDown: .24 },
      desc: (S, P) => `Jumps in front of the lowest-HP ally and intercepts the next attack aimed at them within ${P.ready}s. Goofy takes the reduced Damage, slams the attacker for <em>${pcn(S.ratio * 100)}</em> Attack, and lowers their Attack. The ally gains a Shield and, below half HP, loses up to two debuffs.`,
      ai: { prio: 84, cond: (u, B) => B.alliesOf(u).some(a => a !== u && a.hpPct < .72) },
      cast: (u, B, S, P) => {
        const ally = B.lowestHp(B.alliesOf(u).filter(a => a !== u)); if (!ally) return;
        B.anim(u, 'cast', .48); B.dash(u, ally.x - u.face * 42, .22, { depth: ally.depth });
        let used = false;
        const off = B.on(u, 'allyDamaged', ev => {
          if (used || ev.unit !== ally || !ev.src || ev.src.team === u.team || B.t > (u.goofyBodyguardUntil || 0)) return;
          used = goofyIntercept(u, ally, ev.src, B, S, P, ev, false); if (used) off();
        });
        u.goofyBodyguardUntil = B.t + P.ready;
        B.after(P.ready, () => { if (!used) off(); });
      }
    },
    P: {
      name: 'Sturdy Stance', type: 'Armor / Magic Defense / Max HP',
      v: { hp: .24 }, p: { energy: 5, ward: 3 },
      desc: (S, P) => `Goofy gains <em>${pcn(S.hp * 100)}</em> Max HP. Blocking, redirecting Damage, or Shielding an ally grants stacking Armor and Magic Defense for several seconds. Enemies who attack Goofy while he has a Shield lose ${P.energy} Energy. Knock Back makes him plant his shield for ${P.ward}s of Damage Reduction.`,
      passive: (u, B, S, P) => {
        u.goofySturdyEnabled = true; u.flat.hpPSturdy = S.hp; u.dirty = true;
        B.on(u, 'shieldDone', ev => { if (ev.target !== u) goofySturdy(u, B); });
        B.on(u, 'damaged', ev => {
          if (ev.redirected) goofySturdy(u, B);
          if (u.shields.length && ev.src && ev.src.team !== u.team) ev.src.energy = Math.max(0, ev.src.energy - P.energy);
        });
        B.on(u, 'knockedBack', () => { B.applyStatus(u, u, 'ward', P.ward); B.anim(u, 'cast', .42); });
      }
    },
    R: {
      name: 'Knight’s Loyalty', type: 'Shield / Max HP / Physical Damage',
      v: { rescueShield: .20, selfDamage: .18 }, p: { autoCd: 12, danger: .40 },
      desc: (S, P) => `Goofy Shield now grants allies a Shield when it begins and ends. Bodyguard automatically intercepts a damaging Skill aimed at an ally below ${pc(P.danger)} HP once every ${P.autoCd}s. Every interception fills 🔷 Shield Charge and empowers the next Tornado Bash. Once per wave, Goofy prevents an ally’s defeat, Shields them, and takes unavoidable Damage equal to <em>${pcn(S.selfDamage * 100)}</em> of his Max HP.`,
      passive: (u, B, S, P) => {
        u.goofyKnightLoyalty = true; u.goofyAutoAt = 0;
        B.on(u, 'allyDamaged', ev => {
          if (ev.unit === u || ev.basic || ev.redirected || !ev.src || ev.src.team === u.team || ev.unit.hpPct >= P.danger || B.t < u.goofyAutoAt) return;
          const body = u.def.skills.B;
          if (goofyIntercept(u, ev.unit, ev.src, B, B.scaled(u, 'B'), body.p, ev, true)) u.goofyAutoAt = B.t + P.autoCd;
        });
        B.on(u, 'allyLethal', ev => {
          if (u.goofyLastLoyalty || ev.unit === u || !ev.unit.alive) return;
          u.goofyLastLoyalty = true; ev.prevented = true; ev.unit.hp = 1;
          B.dash(u, ev.unit.x - u.face * 42, .2, { depth: ev.unit.depth });
          B.shield(u, ev.unit, u.max.hp * S.rescueShield, 8); B.cleanse(ev.unit, 3);
          B.after(0, () => { if (u.alive) B.damage(u, u, u.max.hp * S.selfDamage, { type: 'true', selfharm: true, tag: 'Knight’s Loyalty' }); });
          collabVoice(u, 'protect', { vol: .86, priority: true }); B.fxRing(ev.unit.x, ev.unit.y - 42, 150, '#d9f8ff', .7); B.flash('#d9f8ff', .35, .18);
        });
      }
    }
  }
});
