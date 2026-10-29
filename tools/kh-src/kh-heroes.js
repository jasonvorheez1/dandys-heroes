/* kh-heroes.js - the Halloween Town cast: Oogie Boogie, Jack Skellington,
   Lock, Shock & Barrel and Donald, plus corrected sprite atlases for the
   four Heroes who arrived in The Door Opens (Sora, Riku, Kairi, Goofy). */
'use strict';

/* ---------- fixed Door Opens sprites ---------- */
khSprites('Sora', 1.65, 168, { idle: ['sora-idle', 6], move: ['sora-move', 9], attack: ['sora-attack', 12, true], cast: ['sora-cast', 11, true] });
khSprites('Riku', 1.75, 172, { idle: ['riku-idle', 6], move: ['riku-move', 9], attack: ['riku-attack', 12, true], cast: ['riku-cast', 10, true] });
khSprites('Kairi', 1.65, 150, { idle: ['kairi-idle', 6], move: ['kairi-move', 8], attack: ['kairi-attack', 12, true], cast: ['kairi-cast', 10, true] });
khSprites('Goofy', 1.55, 190, { idle: ['goofy-idle', 5], move: ['goofy-move', 10], attack: ['goofy-attack', 16, true], cast: ['goofy-cast', 10, true] });
['Sora', 'Riku', 'Kairi', 'Goofy'].forEach(id => { if (HEROES[id]) HEROES[id].kh = true; });

/* Sora's Halloween Town costume: worn in the story from the moment he arrives,
   and equippable from his Gear tab once the event has been beaten. */
Object.assign(HERO_SKINS.Sora, {
  art: 'assets/kh/vn/sora-halloween.png',
  description: 'Sora\u2019s Halloween Town costume: bat wings, a pumpkin mask and a jagged collar. Earned by finishing the Halloween Town event.',
  atlases: { idle: 'assets/kh/units/sora-h-idle.png', move: 'assets/kh/units/sora-h-move.png', attack: 'assets/kh/units/sora-h-attack.png',
    cast: 'assets/kh/units/sora-h-cast.png', entrance: HERO_SKINS.Sora.atlases.entrance }
});
Object.defineProperty(HERO_SKINS.Sora, 'available', { configurable: true, enumerable: true,
  get() { try { return KHEvent.nodeDone(KH_NODES.length - 1); } catch (_) { return false; } } });

/* ---------- registration helper ---------- */
const KH_H = (range, aspd, ms, extra) => Object.assign({ range, aspd, ms, aggro: 1, crit: .12, critDmg: 1.65, healPow: 1, shieldPow: 1, cdr: .06, ccRes: .2, kbRes: .3, armorPen: .05, magPen: .1 }, extra || {});
function khHero(o) {
  return defHero(Object.assign({
    folder: null, file: null, icon: o.id, element: 'Halloween', kh: true, nativeFace: 1,
    move: { gait: 'step', bob: 3, freq: 1.3, lean: 6, squash: .03, idle: 'breathe', step: 'step', trail: { on: false }, brake: .25 },
    growth: { hp: .095, atk: .09, def: .082, mag: .098, mdef: .084 }
  }, o));
}

/* ============================================================ OOGIE BOOGIE */
khSprites('OogieBoogie', 1.9, 262, {
  idle: ['oogie-idle-v2', 4.5], move: ['oogie-shuffle', 9], attack: ['oogie-attack', 9, true],
  cast: ['oogie-cast', 8, true], fright: ['oogie-fright', 10, true], eat: ['oogie-eat', 10, false]
}, 'oogie-idle');

function oogieSnakeEyes(u, B, S, P, t, step) {
  if (!u.alive || !t || !t.alive) return;
  const dice = KHFX.sprite(B, step % 2 ? 'dice-purple1' : 'dice-purple2', KHFX.screenPos(B, t).x, t.y - 96, { h: 56, life: 780, fps: 12 });
  B.after(.62, () => {
    if (!u.alive) return;
    if (!t.alive) return;
    if (chance(P.odds)) {
      KHFX.pop(B, t, 'SNAKE EYES!', '#9dff6a'); Sound.play('crit', { vol: .4 });
      KHFX.arc(B, u, t, 'oogie'); KHFX.impact(B, t, 'oogie', { size: 112 });
      khMagic(u, t, B, u.st.mag * S.chain, { tag: 'Snake Eyes Roll', noDodge: true });
      B.fxBoom(t.x, t.y - 70, .8, '#9dff6a');
      if (u._khSnakeHook) u._khSnakeHook();
      if (step < P.max) B.after(.35, () => oogieSnakeEyes(u, B, S, P, t, step + 1));
    } else B.fxFloatIcon(t.x, t.y - 104, '🎲', '#d9c2ff');
  });
}

khHero({
  id: 'OogieBoogie', name: 'Oogie Boogie', role: 'Tank', roleLabel: 'Magic Bruiser', position: 'Frontline', tier: 'S', nativeFace: -1,
  blurb: 'The Boogeyman of Halloween Town. A sack of bugs that loves a gamble, and cheats at every one of them. Scared enemies barely scratch him.',
  scale: 1.9,
  base: { hp: 6400, atk: 260, def: 340, mag: 430, mdef: 350, spd: 92, acc: 192, eva: 82 },
  hidden: KH_H(112, .86, 62, { aggro: 1.5, ccRes: .4, kbRes: .85, crit: .1, critDmg: 1.6, healPow: 1.1, magPen: .12 }),
  basic: { name: 'Burlap Sweep', type: 'magic', ratio: 1.12, range: 112, wind: .3, attackAnim: .6, sfx: 'hit_heavy', hit: 'hit_magic', pcol: '#9dff6a',
    onHit: (u, t, B) => KHFX.impact(B, t, 'oogie', { size: 70, count: 5 }) },
  skills: {
    W: {
      name: 'Quite a Fright', type: 'Magic Damage', energy: 100,
      v: { ratio: 1.7, heal: .12 }, p: { scare: 17 },
      desc: (S, P) => `<span class="sk-pas">Passive: Oogie Boogie's basic attacks deal Magic damage.</span>
        Active: Oogie grins a terrifying grin, dealing <em>${pcn(S.ratio * 100)}</em> Magic damage to all enemies, <b>Scaring</b> all enemies for ${P.scare}s, and healing himself for <em>${pcn(S.heal * 100)}</em> of his Max HP.`,
      passive: () => {},
      cast: (u, B, S, P) => {
        B.anim(u, 'cast', .85); khClip(u, 'fright', .85); KHFX.banner(B, 'Quite a Fright', 'oogie'); KHFX.sfx('select', .5);
        KHFX.impact(B, u, 'oogie', { aura: true, size: 260, life: .9, lift: 78 });
        B.after(.4, () => {
          if (!u.alive) return;
          khFoes(u, B).forEach(e => {
            KHFX.impact(B, e, 'oogie', { size: 116, lift: 72 });
            khMagic(u, e, B, u.st.mag * S.ratio, { tag: 'Quite a Fright' });
            khScare(u, e, B, P.scare);
          });
          B.heal(u, u, u.max.hp * S.heal, { tag: 'Quite a Fright' });
          B.flash('#2aff7a', .18, .18); B.shake(10, .3);
        });
      }
    },
    G: {
      name: 'Snake Eyes', type: 'Magic Damage', cd: 8,
      v: { ratio: 1.5, chain: 1.0 }, p: { odds: .24, max: 6 },
      desc: (S, P) => `Oogie throws a pair of dice at a random enemy, dealing <em>${pcn(S.ratio * 100)}</em> Magic damage. The dice then roll above the enemy: on a double 1 (${pcn(P.odds * 100)} loaded odds) they take <em>${pcn(S.chain * 100)}</em> more, and the dice roll again. They keep rolling each time Oogie throws two 1's, up to ${P.max} extra times, until the enemy is KO'd or the dice stop.`,
      ai: { prio: 60, cond: (u, B) => khFoes(u, B).length > 0 },
      cast: (u, B, S, P) => {
        const t = pick(khFoes(u, B)); if (!t) return;
        B.anim(u, 'attack', .5);
        KHFX.shot(B, u, t, 'oogie', { size: 50, life: .5 });
        B.fxProj(u, t, { kind: 'orb', col: '#e8ffe0' }, () => {
          if (!t.alive) return;
          KHFX.impact(B, t, 'oogie', { size: 96 });
          khMagic(u, t, B, u.st.mag * S.ratio, { tag: 'Snake Eyes' });
          Sound.play('hit_magic', { vol: .45 });
          oogieSnakeEyes(u, B, S, P, t, 0);
        });
      }
    },
    B: {
      name: 'Weak with Hunger', type: 'Support', cd: 12,
      v: { heal: .14, hp: .05 }, p: { cap: 5 },
      desc: (S, P) => `Oogie eats a handful of grubs, healing <em>${pcn(S.heal * 100)}</em> of his Max HP and permanently increasing his Max HP by <em>${pcn(S.hp * 100)}</em> (up to ${P.cap} times).`,
      ai: { prio: 50, cond: u => u.hpPct < .97 || !u.hasStatus('kh_hunger') },
      cast: (u, B, S, P) => {
        khClip(u, 'eat', 1.05); B.anim(u, 'cast', 1.0); Sound.play('heal_soft', { vol: .5 });
        KHFX.impact(B, u, 'oogie', { aura: true, size: 172, life: 1, lift: 75 });
        B.after(.7, () => {
          if (!u.alive) return;
          const have = (u.getStatus('kh_hunger') || { stacks: 0 }).stacks;
          if (have < P.cap) B.applyStatus(u, u, 'kh_hunger', 999, { val: S.hp });
          B.heal(u, u, u.max.hp * S.heal, { tag: 'Grubs' });
          KHFX.impact(B, u, 'oogie', { size: 96, lift: 95 });
          B.fxFloatIcon(u.x, u.y - 120, '🪱', '#c8ff7a');
        });
      }
    },
    P: {
      name: 'Spooky Shadows', type: 'Passive', v: { red: .6 }, p: {},
      desc: S => `Oogie Boogie takes <em>${pcn(S.red * 100)}</em> less damage from enemies who are <b>Scared</b>.`,
      passive: (u, B, S) => {
        B.on(u, 'damaged', ev => { if (ev.target === u && ev.src && khScared(ev.src)) ev.amount *= 1 - S.red; });
      }
    },
    R: {
      name: 'Unfair Play', type: 'Passive', v: { dealt: .25, hp: .03 }, p: {},
      desc: S => `Enemies deal <em>${pcn(S.dealt * 100)}</em> less damage while Scared. When Snake Eyes succeeds on a roll to damage an enemy, Oogie Boogie gains <em>${pcn(S.hp * 100)}</em> Max HP for the rest of the wave.`,
      passive: (u, B, S) => {
        u._khSnakeHook = () => { B.applyStatus(u, u, 'kh_snakeluck', 999, { val: S.hp }); B.fxFloatIcon(u.x, u.y - 124, '+HP', '#9dff6a'); };
        const clearUnfair = () => B.enemiesOf(u).forEach(e => { if (e.flat.dmgDealtKhUnfair) { e.flat.dmgDealtKhUnfair = 0; e.dirty = true; } });
        B.on(u, 'death', clearUnfair);
        B.every(u, .4, () => B.enemiesOf(u).forEach(e => {
          const f = khScared(e) ? -S.dealt : 0;
          if (e.flat.dmgDealtKhUnfair !== f) { e.flat.dmgDealtKhUnfair = f; e.dirty = true; }
        }));
      }
    }
  }
});

/* ============================================================ JACK SKELLINGTON */
khSprites('JackSkellington', 1.7, 205, {
  idle: ['jack-idle-v2', 4.5], move: ['jack-move', 10], attack: ['jack-attack', 10, true],
  cast: ['jack-cast', 8, true], scare: ['jack-scare', 8, true]
}, 'jack-idle');

function jackBasicHit(u, t, B) {
  KHFX.impact(B, t, 'jack', { size: 78, count: 6 });
  const has = k => u.rarity >= SKILL_RARITY[k];
  if (has('W')) { const S = B.scaled(u, 'W'), P = B.skillParams(u, 'W'); B.applyStatus(u, t, 'kh_pumpkinfire', P.burn, { val: u.st.mag * S.dot }); }
  if (has('B') && u.hasStatus('kh_lantern')) {
    const S = B.scaled(u, 'B'), P = B.skillParams(u, 'B');
    B.enemiesOf(u).filter(e => e !== t && e.alive && Math.hypot(e.x - t.x, B.depthDelta(t, e)) <= P.radius).forEach(e => {
      khMagic(u, e, B, u.st.mag * 1.06 * S.splash, { area: true, tag: 'Lantern Splash' });
      B.applyStatus(u, e, 'kh_pumpkinfire', 3, { val: u.st.mag * .06 });
    });
    B.fxRing(t.x, t.y - 50, P.radius, '#ff8c1a', .35);
  }
  if (has('R')) {
    const P = B.skillParams(u, 'R');
    if (!(t.level > P.failLv && chance(.5))) khScare(u, t, B, P.scare);
    else B.fxFloatIcon(t.x, t.y - 100, '😐', '#cfcfcf');
  }
}
/* Every third Pumpkin Toss is a double toss: a second pumpkin follows the first. */
function jackDoubleToss(u, t, B) {
  u._jackToss = (u._jackToss || 0) + 1;
  if (u._jackToss % 3) return;
  B.after(.16, () => {
    if (!u.alive || !t.alive) return;
    KHFX.shot(B, u, t, 'jack', { size: 36, life: .22 });
    KHFX.impact(B, t, 'jack', { size: 68, count: 5 });
    khMagic(u, t, B, u.st.mag * .55, { tag: 'Double Toss' });
    B.fxFloatIcon(t.x, t.y - 96, '🎃', '#ff8c1a'); Sound.play('hit_magic', { vol: .3 });
  });
}
function jackDuck(u, B, S, P) {
  const burn = e => B.applyStatus(u, e, 'kh_pumpkinfire', 4, { val: u.st.mag * .08 });
  if (B.offscreen) {
    khFoes(u, B).forEach(e => { khScare(u, e, B, P.scare); khMagic(u, e, B, u.st.mag * S.ratio, { area: true, tag: "What's This?!" }); burn(e); });
    return;
  }
  const layer = KHFX.layer(); const dir = u.face, x0 = u.x + dir * 78;
  const present = document.createElement('div'); present.className = 'kh-vfx-present';
  present.style.left = KHFX.screenPos(B, { x: x0, depth: u.depth }).x + 'px'; present.style.top = (u.y - 18) + 'px';
  if (layer) layer.appendChild(present);
  setTimeout(() => present.remove(), 900 / Math.max(1, B.speed || 1));
  B.after(.4, () => {
    if (!u.alive) return;
    B.enemiesOf(u).filter(e => Math.abs(e.x - x0) <= P.radius).forEach(e => khScare(u, e, B, P.scare));
    KHFX.impact(B, { x: x0, y: u.y, depth: u.depth }, 'jack', { size: 150, lift: 43 });
    B.fxRing(x0, u.y - 40, P.radius, '#ff8c1a', .5); Sound.play('pop2', { vol: .5 });
    const duck = document.createElement('div'); duck.className = 'kh-vfx-duck' + (dir < 0 ? ' flip' : '');
    if (layer) layer.appendChild(duck);
    const hit = new Set(); let x = x0;
    const place = () => { duck.style.left = KHFX.screenPos(B, { x, depth: u.depth }).x + 'px'; duck.style.top = (u.y - 44) + 'px'; };
    place();
    B.repeat(16, .075, () => {
      x += dir * 62; place();
      B.enemiesOf(u).forEach(e => {
        if (hit.has(e) || !e.alive) return;
        if (Math.abs(e.x - x) < 56 + P.width) {
          hit.add(e);
          KHFX.impact(B, e, 'jack', { size: 92 });
          khMagic(u, e, B, u.st.mag * S.ratio, { area: true, tag: "What's This?!" }); burn(e); B.fxBoom(e.x, e.y - 60, .7, '#ff8c1a');
        }
      });
    });
    B.after(16 * .075 + .1, () => duck.remove());
  });
}
/* The lantern's finale: a pumpkin bomb that bursts around Jack's foes. */
function jackLanternBurst(u, B, S, P) {
  if (!u.alive) return;
  const foes = khFoes(u, B); if (!foes.length) return;
  const t = B.nearest(u, foes);
  KHFX.impact(B, t, 'jack', { aura: true, size: P.radius * 2, life: .9 });
  B.flash('#ff7a00', .16, .16); Sound.play('fire', { vol: .5 });
  foes.filter(e => Math.hypot(e.x - t.x, B.depthDelta(t, e)) <= P.radius * 1.5).forEach(e => {
    KHFX.impact(B, e, 'jack', { size: 108 });
    khMagic(u, e, B, u.st.mag * S.boom, { area: true, tag: 'Pumpkin Bomb' }); khScare(u, e, B, 3);
    B.fxBoom(e.x, e.y - 60, .8, '#ff8c1a');
  });
}

khHero({
  id: 'JackSkellington', name: 'Jack Skellington', role: 'Damage', roleLabel: 'Magic Fright', position: 'Middle', tier: 'SS', nativeFace: -1,
  blurb: 'The Pumpkin King of Halloween Town. He sets his pumpkins aflame, turns a scare into a stun, and his friends feast on every frightened foe.',
  scale: 1.7,
  base: { hp: 5000, atk: 260, def: 245, mag: 560, mdef: 300, spd: 130, acc: 220, eva: 154 },
  hidden: KH_H(215, 1.12, 100, { aggro: .8, ccRes: .28, crit: .16, critDmg: 1.75, magPen: .18, cdr: .08 }),
  basic: { name: 'Pumpkin Toss', type: 'magic', ratio: 1.1, range: 215, proj: 'orb', pcol: '#ff8c1a', wind: .22, attackAnim: .5, sfx: 'whoosh', hit: 'hit_magic',
    onHit: (u, t, B) => { jackBasicHit(u, t, B); jackDoubleToss(u, t, B); } },
  skills: {
    W: {
      name: 'Master of Fright', type: 'Magic Damage', energy: 100,
      v: { dot: .12, ratio: 1.3 }, p: { burn: 4, scare: 8, stun: 1.8, buff: 8 },
      desc: (S, P) => `<span class="sk-pas">Passive: Jack sets his pumpkins aflame. His basic attacks deal Magic damage and burn for <em>${pcn(S.dot * 100)}</em> Magic per second (${P.burn}s). Every third Pumpkin Toss is a double toss.</span>
        Active: Jack twists his face into a horrible sight, dealing <em>${pcn(S.ratio * 100)}</em> Magic damage to all enemies, <b>Scaring</b> them for ${P.scare}s and Stunning them for ${P.stun}s. He then reigns as the Pumpkin King for ${P.buff}s, gaining Magic Up and Haste.`,
      passive: () => {},
      cast: (u, B, S, P) => {
        B.anim(u, 'cast', .8); khClip(u, 'scare', .8); KHFX.banner(B, 'Master of Fright', 'jack'); KHFX.sfx('select', .5);
        KHFX.impact(B, u, 'jack', { aura: true, size: 270, life: .9, lift: 82 });
        B.after(.35, () => {
          if (!u.alive) return;
          khFoes(u, B).forEach(e => {
            KHFX.arc(B, u, e, 'jack'); KHFX.impact(B, e, 'jack', { size: 118, lift: 82 });
            khScare(u, e, B, P.scare); B.applyStatus(u, e, 'stun', P.stun);
            khMagic(u, e, B, u.st.mag * S.ratio, { area: true, tag: 'Master of Fright' });
          });
          B.applyStatus(u, u, 'magup', P.buff); B.applyStatus(u, u, 'haste', P.buff);
          B.flash('#ff7a00', .2, .2); B.shake(10, .35);
          B.fxFloatIcon(u.x, u.y - 128, '👑 PUMPKIN KING', '#ff8c1a');
        });
      }
    },
    G: {
      name: "What's This?!", type: 'Magic Damage', cd: 9,
      v: { ratio: 2.6 }, p: { scare: 6, radius: 230, width: 14 },
      desc: (S, P) => `Jack throws a present in front of himself and a maniacal toy duck emerges, Scaring nearby enemies for ${P.scare}s. The duck then travels across the screen, dealing <em>${pcn(S.ratio * 100)}</em> Magic damage to every enemy in a line and igniting them with Pumpkin Flame.`,
      ai: { prio: 64, cond: (u, B) => khFoes(u, B).length > 0 },
      cast: (u, B, S, P) => { B.anim(u, 'attack', .5); jackDuck(u, B, S, P); }
    },
    B: {
      name: 'Jack-O-Lantern', type: 'Magic Damage', cd: 15,
      v: { splash: .9, boom: 2.0 }, p: { dur: 10, radius: 170 },
      desc: (S, P) => `Jack engulfs himself in flames for ${P.dur}s, gaining Haste. His basic attacks splash for <em>${pcn(S.splash * 100)}</em> Magic damage to enemies near the target and ignite them. When the flames die down, a Pumpkin Bomb bursts for <em>${pcn(S.boom * 100)}</em> Magic damage and Scares enemies near the closest foe.`,
      ai: { prio: 52, cond: (u, B) => !u.hasStatus('kh_lantern') && khFoes(u, B).length > 0 },
      cast: (u, B, S, P) => {
        B.anim(u, 'cast', .6); B.applyStatus(u, u, 'kh_lantern', P.dur); B.applyStatus(u, u, 'haste', P.dur); KHFX.pop(B, u, '🎃', '#ff8c1a');
        KHFX.impact(B, u, 'jack', { aura: true, size: 184, life: 1, lift: 75 });
        Sound.play('fire', { vol: .5 });
        B.after(P.dur, () => jackLanternBurst(u, B, S, P));
      }
    },
    P: {
      name: 'Trick-or-Treats', type: 'Support', v: { heal: .03 }, p: { energy: 4 },
      desc: (S, P) => `Jack's allies heal for <em>${pcn(S.heal * 100)}</em> of their Max HP and gain ${P.energy} Energy whenever they damage a <b>Scared</b> enemy.`,
      passive: (u, B, S, P) => {
        B.on(u, 'allyDamageDealt', ev => {
          const a = ev.src;
          if (!a || !a.alive || a.team !== u.team || ev.dot || !khScared(ev.target) || ev.amount <= 0) return;
          if (B.t < (a._khTreatAt || 0)) return; a._khTreatAt = B.t + .7;
          B.heal(u, a, a.max.hp * S.heal, { tag: 'Treat' }); B.energy(a, P.energy); B.fxFloatIcon(a.x, a.y - 100, '🍬', '#ffd27a');
        });
      }
    },
    R: {
      name: 'Sound of a Scream', type: 'Magic Damage', v: { ratio: 1.6 }, p: { scare: 5, failLv: 260, spread: 4, reach: 260 },
      desc: (S, P) => `If Jack or any of his allies scare an enemy who is already Scared, the enemy takes <em>${pcn(S.ratio * 100)}</em> Magic damage and the scream spreads, Scaring the nearest unfrightened enemy for ${P.spread}s. Jack's basic attacks also Scare enemies for ${P.scare}s. The scare from Jack's basic attack has a chance to fail against enemies above level ${P.failLv}.`,
      passive: (u, B, S, P) => {
        B.on(u, 'khScare', ev => {
          if (!ev.was || !ev.src || ev.src.team !== u.team || !ev.unit.alive) return;
          if (B.t < (ev.unit._khScreamAt || 0)) return; ev.unit._khScreamAt = B.t + .5;
          khMagic(u, ev.unit, B, u.st.mag * S.ratio, { tag: 'Sound of a Scream', noDodge: true });
          B.fxFloatIcon(ev.unit.x, ev.unit.y - 112, '😱', '#ffb7ff');
          const next = khFoes(u, B).filter(e => e !== ev.unit && !khScared(e) && Math.hypot(e.x - ev.unit.x, B.depthDelta(ev.unit, e)) <= P.reach)
            .sort((a, b) => Math.abs(a.x - ev.unit.x) - Math.abs(b.x - ev.unit.x))[0];
          if (next) khScare(u, next, B, P.spread);
        });
      }
    }
  }
});

/* ============================================================ LOCK, SHOCK & BARREL */
khSprites('LockShockBarrel', 1.6, 168, {
  idle: ['lsb-idle', 25], move: ['lsb-move', 25], attack: ['lsb-idle', 25, true], cast: ['lsb-cast', 25, false]
});
const LSB_DISABLES = ['stun', 'freeze', 'blind', 'charm', 'silence'];

function lsbCrit(u, t, B) {
  if (!t || !t.alive) return;
  if (u.rarity >= SKILL_RARITY.P) {
    const P = B.skillParams(u, 'P');
    u._khCrits = (u._khCrits || 0) + 1;
    if (u._khCrits >= P.every) {
      u._khCrits = 0; t.statuses.filter(s => s.id === 'tenacity').forEach(() => B.removeStatus(t, 'tenacity'));
      B.applyStatus(u, t, 'kh_unnerved', P.dur); B.fxFloatIcon(t.x, t.y - 108, '💢', '#ffb04a');
    }
  }
  if (u.rarity >= SKILL_RARITY.R) {
    const S = B.scaled(u, 'R'), P = B.skillParams(u, 'R');
    if (chance(S.chance)) { const id = pick(LSB_DISABLES); B.applyStatus(u, t, id, P.dur); B.fxFloatIcon(t.x, t.y - 118, STATUS[id].icon, '#ffe27a'); }
  }
}
function lsbKidnap(u, B, S, P, t) {
  if (!u.alive || !t || !t.alive) return;
  B.anim(u, 'cast', 1.1); B.dash(u, t.x - u.face * 78, .32, { depth: t.depth });
  KHFX.banner(B, 'All Caught Up', 'lsb'); Sound.play('bobette_gift_toss', { vol: .5 });
  B.after(.4, () => {
    if (!u.alive || !t.alive) return;
    Sound.play('grab', { vol: .55 }); Sound.play('cloth', { vol: .5, delay: .12 });
    B.alliesOf(u).forEach(a => { if (a !== u && a.alive) B.energy(a, P.cheer); });
    if (u.rarity >= SKILL_RARITY.R) {
      const RP = B.skillParams(u, 'R');
      if (t.hpPct < RP.exec && khFoes(u, B).filter(e => e !== t).length === 0) {
        KHFX.pop(B, t, 'THREE OF A KIND!', '#ffe27a');
        B.damage(u, t, t.isBoss ? t.max.hp * .2 : t.hp + 1, { type: 'true', tag: 'Three of a Kind', noDodge: true, pierceAll: true });
        if (!t.alive) return;
      }
    }
    B.applyStatus(u, t, 'kh_sack', P.sack, { val: u.st.mag * S.dps, unresistable: true, bypassControlGuard: true });
    if (!B.offscreen) {
      const sack = document.createElement('div'); sack.className = 'kh-sack'; sack.innerHTML = '<span>🎒</span>';
      const sp = KHFX.screenPos(B, t); sack.style.left = sp.x + 'px'; sack.style.top = (t.y - 10) + 'px';
      sack.style.setProperty('--k', String(sp.k)); const layer = KHFX.layer(); if (layer) layer.appendChild(sack);
      const dur = P.sack / Math.max(1, B.speed || 1) * 1000;
      setTimeout(() => sack.classList.add('out'), Math.max(0, dur - 260)); setTimeout(() => sack.remove(), dur + 40);
    }
    B.after(P.sack + .05, () => {
      if (!t.alive) return;
      KHFX.pop(B, t, 'SURPRISE!', '#ffb04a');
      khMagic(u, t, B, u.st.mag * S.burst, { tag: 'Surprise!', noDodge: true });
      B.applyStatus(u, t, 'stun', P.stunEnd); B.fxBoom(t.x, t.y - 60, .8, '#ffb04a'); Sound.play('bobette_present_pop', { vol: .45 });
    });
  });
}

khHero({
  id: 'LockShockBarrel', name: 'Lock, Shock & Barrel', role: 'Support', roleLabel: 'Trickster Support', position: 'Middle', tier: 'S', nativeFace: 1,
  blurb: 'Oogie Boogie\'s three mischievous henchmen, riding a living bathtub. They sling, kidnap, cheer each other on, and are never quite as loyal as they look.',
  scale: 1.6,
  base: { hp: 4200, atk: 145, def: 240, mag: 490, mdef: 280, spd: 124, acc: 220, eva: 165 },
  growth: { hp: .088, atk: .050, def: .078, mag: .095, mdef: .082 },
  hidden: KH_H(300, 1.2, 112, { aggro: .75, crit: .24, critDmg: 1.8, healPow: 1.2, cdr: .1, ccRes: .26 }),
  basic: { name: 'Slingshot & Lollipop', type: 'magic', ratio: .98, range: 300, proj: 'orb', pcol: '#ffb04a', wind: .2, attackAnim: .5, sfx: 'throwsomething', hit: 'candy_pop',
    onHit: (u, t, B) => {
      const ally = B.lowestHp(B.alliesOf(u).filter(a => a.alive));
      if (ally && u.rarity >= SKILL_RARITY.W) { B.heal(u, ally, u.st.mag * .4, { tag: 'Lollipop' }); B.fxFloatIcon(ally.x, ally.y - 100, '🍭', '#ff9ad6'); }
    } },
  skills: {
    W: {
      name: 'All Caught Up', type: 'Magic Damage', energy: 100,
      v: { dps: .75, burst: 1.6 }, p: { sack: 5, cheer: 12, stunEnd: 1 },
      desc: (S, P) => `<span class="sk-pas">Passive: For their basic attacks, Lock and Shock shoot their slingshots, dealing Magic damage, while Barrel licks his lollipop, healing the ally with the lowest HP.</span>
        Active: <b>Choose an enemy</b> to kidnap. The trio runs over in their bathtub, cheers on every ally for ${P.cheer} Energy, and stuffs the enemy into a sack for ${P.sack}s, dealing <em>${pcn(S.dps * 100)}</em> Magic damage per second. When the sack opens, a surprise deals <em>${pcn(S.burst * 100)}</em> Magic damage and Stuns it for ${P.stunEnd}s. This skill cannot be evaded and its duration is not affected by tenacity. On Auto, they kidnap the enemy with the highest Evasion.`,
      passive: () => {},
      cast: (u, B, S, P) => {
        const foes = khFoes(u, B); if (!foes.length) return;
        const auto = B.topN(foes, 'eva', 1)[0];
        if (u._lastCastManual && !B.autoWhite && !B.offscreen) KHFX.pickTarget(B, foes, 'All Caught Up', t => lsbKidnap(u, B, S, P, t && t.alive ? t : auto));
        else lsbKidnap(u, B, S, P, auto);
      }
    },
    G: {
      name: 'Scorpion Scare', type: 'Magic Damage', cd: 8,
      v: { dot: .3, hit: 1.3 }, p: { dur: 6, spread: 2, reach: 280 },
      desc: (S, P) => `Shock throws a box of scorpions at the nearest enemy, dealing <em>${pcn(S.hit * 100)}</em> Magic damage, then <em>${pcn(S.dot * 100)}</em> per second for ${P.dur}s. The stung enemy hallucinates and cannot tell friend from foe. The scorpions scuttle on to up to ${P.spread} more nearby enemies for half as much.`,
      ai: { prio: 60, cond: (u, B) => khFoes(u, B).length > 0 },
      cast: (u, B, S, P) => {
        const t = B.nearest(u, khFoes(u, B)); if (!t) return;
        B.anim(u, 'cast', .5);
        B.fxArc(u, t, { kind: 'craft', col: '#a0522d' }, () => {
          if (!t.alive) return;
          khMagic(u, t, B, u.st.mag * S.hit, { tag: 'Scorpion Scare' });
          B.applyStatus(u, t, 'kh_scorpions', P.dur, { val: u.st.mag * S.dot });
          B.fxFloatIcon(t.x, t.y - 108, '🦂', '#ffb04a'); Sound.play('item_pop', { vol: .45 }); Sound.play('gasp', { vol: .3, delay: .1 });
          khFoes(u, B).filter(e => e !== t && Math.hypot(e.x - t.x, B.depthDelta(t, e)) <= P.reach)
            .sort((a, b) => Math.abs(a.x - t.x) - Math.abs(b.x - t.x)).slice(0, P.spread).forEach(e => {
              B.applyStatus(u, e, 'kh_scorpions', P.dur * .66, { val: u.st.mag * S.dot * .5 }); B.fxFloatIcon(e.x, e.y - 108, '🦂', '#ffb04a');
            });
        });
      }
    },
    B: {
      name: 'Unwanted Present', type: 'Magic Damage', cd: 13,
      v: { ratio: 1.7, heal: .9 }, p: { fuse: 2.4, radius: 220, scare: 6 },
      desc: (S, P) => `Lock throws a jack-in-the-box onto the battlefield. After ${P.fuse}s the Jack-In-The-Box triggers, Scaring nearby enemies for ${P.scare}s, dealing <em>${pcn(S.ratio * 100)}</em> Magic damage, and tossing the lowest-HP ally a candy that heals <em>${pcn(S.heal * 100)}</em> Magic.`,
      ai: { prio: 54, cond: (u, B) => khFoes(u, B).length > 0 },
      cast: (u, B, S, P) => {
        const t = B.nearest(u, khFoes(u, B)); if (!t) return;
        B.anim(u, 'cast', .5);
        const x = clamp(t.x - u.face * 30, B.leftWall + 20, B.rightWall - 20);
        let box = null;
        if (!B.offscreen && KHFX.layer()) {
          box = document.createElement('img'); box.className = 'kh-jackbox'; box.src = ASSET + 'uploads/dangerinabox.png'; box.alt = '';
          box.style.left = KHFX.screenPos(B, { x, depth: t.depth }).x + 'px'; box.style.top = t.y + 'px'; KHFX.layer().appendChild(box);
          setTimeout(() => box.remove(), P.fuse * 1000 / Math.max(1, B.speed || 1) + 2500);
        }
        B.after(P.fuse, () => {
          if (box) { box.classList.add('pop'); setTimeout(() => box.remove(), 700); }
          B.fxRing(x, t.y - 40, P.radius, '#ffb04a', .5); B.flash('#ffb04a', .2, .2); Sound.play('bobette_present_pop', { vol: .55 }); Sound.play('boo', { vol: .3, delay: .15 });
          B.enemiesOf(u).filter(e => e.alive && Math.abs(e.x - x) <= P.radius).forEach(e => {
            khMagic(u, e, B, u.st.mag * S.ratio, { area: true, tag: 'Unwanted Present' }); khScare(u, e, B, P.scare);
          });
          if (u.alive) {
            const ally = B.lowestHp(B.alliesOf(u).filter(a => a.alive));
            if (ally) { B.heal(u, ally, u.st.mag * S.heal, { tag: 'Candy' }); B.fxFloatIcon(ally.x, ally.y - 100, '🍬', '#ff9ad6'); }
          }
        });
      }
    },
    P: {
      name: 'Henchmen’s Delight', type: 'Passive', v: { crit: .10 }, p: { every: 3, dur: 5, energy: 4 },
      desc: (S, P) => `Lock, Shock, and Barrel gain <em>${pcn(S.crit * 100)}</em> Critical Chance, and each crit hands every ally ${P.energy} Energy. Every ${P.every} times they crit, remove Tenacity and Evasion from the damaged enemy for ${P.dur}s.`,
      passive: (u, B, S, P) => {
        u.flat.critKhTrio = S.crit; u.dirty = true;
        B.on(u, 'crit', e => {
          if (e.unit !== u) return;
          lsbCrit(u, e.target, B);
          B.alliesOf(u).forEach(a => { if (a !== u && a.alive) B.energy(a, P.energy); });
        });
      }
    },
    R: {
      name: 'Three of a Kind', type: 'Magic Damage', v: { chance: .28 }, p: { dur: 2.5, exec: .4 },
      desc: (S, P) => `When Lock, Shock, and Barrel deal crit damage to an enemy, they have a <em>${pcn(S.chance * 100)}</em> chance of applying a random disable (Stun, Freeze, Blind, Charm or Silence) for ${P.dur}s. If the last enemy in combat has less than ${pcn(P.exec * 100)} of their health remaining when All Caught Up grabs them, that enemy is instantly KO'd (bosses lose 20% of their Max HP instead).`,
      passive: () => {}
    }
  }
});

/* ============================================================ DONALD */
khSprites('Donald', 1.4, 122, {
  idle: ['donald-idle', 4], move: ['donald-move', 9], attack: ['donald-cast', 7, true], cast: ['donald-cast', 7, true]
});
STATUS.kh_donald_static = {
  icon: '⚡', name: 'Static', kind: 'debuff', max: 3,
  desc: 'Donald’s lightning interferes with attacks and spell timing. Three charges discharge into an Energy drain and Slow.',
  mods: (m, s) => { m.aspdP -= .07 * s.stacks; m.cdr -= .04 * s.stacks; }
};
STATUS_VFX.kh_donald_static = 'ShockEffect';
function donaldStatic(u, t, B, charges, dur) {
  if (!t || !t.alive) return;
  for (let i = 0; i < charges; i++) B.applyStatus(u, t, 'kh_donald_static', dur);
  const mark = t.getStatus('kh_donald_static');
  if (!mark || mark.stacks < 3) return;
  B.removeStatus(t, 'kh_donald_static');
  B.energy(t, -12); B.applyStatus(u, t, 'slow', 2.2);
  B.fxFloatIcon(t.x, t.y - 104, '⚡ DISCHARGE', '#a9d9ff');
  KHFX.impact(B, t, 'thunder', { size: 76, count: 5 });
}
function donaldThreat(u, B) {
  return khFoes(u, B).sort((a, b) =>
    Number(!!b.casting) - Number(!!a.casting) || b.energy - a.energy || a.hpPct - b.hpPct)[0];
}
khHero({
  id: 'Donald', name: 'Donald', role: 'Control', roleLabel: 'Elemental Control', position: 'Backline', tier: 'A', nativeFace: 1,
  blurb: 'The royal magician keeps trouble off his friends: Static disrupts spellcasters, Curaga turns debuffs around, and Blizzaga claims a patch of ground.',
  scale: 1.4,
  base: { hp: 4250, atk: 140, def: 225, mag: 505, mdef: 330, spd: 122, acc: 210, eva: 134 },
  hidden: KH_H(310, .98, 88, { aggro: .55, healPow: 1.12, shieldPow: 1.08, magPen: .14, cdr: .07, crit: .12 }),
  basic: { name: 'Staff Zap', type: 'magic', ratio: .84, range: 310, proj: 'orb', pcol: '#9fd0ff', wind: .24, attackAnim: .5, sfx: 'whoosh', hit: 'hit_magic',
    onHit: (u, t, B) => { KHFX.impact(B, t, 'thunder', { size: 74, count: 5 }); donaldStatic(u, t, B, 1, 5); } },
  skills: {
    W: {
      name: 'Thundaga', type: 'Magic Damage / Control', energy: 100,
      v: { ratio: 1.3 }, p: { targets: 4, drain: 16, stun: 1.15 },
      desc: (S, P) => `<span class="sk-pas">Staff Zap applies ⚡ Static. Static lowers Attack Speed and Skill Haste; three charges discharge, draining Energy and Slowing the enemy.</span>
        Active: Lightning seeks a casting or highly charged enemy, then arcs to up to ${P.targets - 1} others. Each bolt deals <em>${pcn(S.ratio * 100)}</em> Magic damage, drains ${P.drain} Energy, applies Shock and two Static charges. Enemies already carrying Static are Stunned for ${P.stun}s.`,
      passive: () => {},
      cast: (u, B, S, P) => {
        const foes = khFoes(u, B), first = donaldThreat(u, B);
        if (!first) return;
        const targets = [first, ...foes.filter(e => e !== first).sort((a, b) =>
          Math.hypot(a.x - first.x, B.depthDelta(first, a)) - Math.hypot(b.x - first.x, B.depthDelta(first, b)))].slice(0, P.targets);
        B.anim(u, 'cast', .8); KHFX.banner(B, 'Thundaga', 'donald');
        KHFX.impact(B, u, 'thunder', { aura: true, size: 170, life: .85, lift: 92 });
        targets.forEach((t, i) => B.after(.3 + i * .13, () => {
          if (!u.alive || !t.alive) return;
          KHFX.arc(B, u, t, 'thunder', { life: .3 });
          KHFX.impact(B, t, 'thunder', { size: 126, lift: 72 });
          B.fxThunder(t, { size: 124, delay: i * .04 }); Sound.play('shock_big', { vol: .5, throttle: 90 });
          const primed = !!t.getStatus('kh_donald_static');
          B.damage(u, t, u.st.mag * S.ratio, { type: 'magic', tag: 'Thundaga' });
          if (!t.alive) return;
          B.energy(t, -P.drain);
          B.applyStatus(u, t, 'shock', 5, { stacks: 1, val: u.st.mag * .08 });
          donaldStatic(u, t, B, 2, 5);
          if (primed) B.applyStatus(u, t, 'stun', P.stun);
        }));
      }
    },
    G: {
      name: 'Curaga', type: 'Healing / Control', cd: 10,
      v: { heal: .43, big: 1.15 }, p: { ward: 4, rebound: 2 },
      fixedP: ['rebound'],
      desc: (S, P) => `Triage magic heals every ally for <em>${pcn(S.heal * 100)}</em> Magic, with an extra <em>${pcn(S.big * 100)}</em> Magic for the lowest-HP ally. It removes two debuffs from that ally and one from each other ally. Cleansed allies gain Ward for ${P.ward}s; up to ${P.rebound} removed debuffs rebound as Static onto the most dangerous enemy.`,
      ai: { prio: 70, cond: (u, B) => B.alliesOf(u).some(a => a.alive && (a.hpPct < .76 || a.statuses.some(s => STATUS[s.id] && STATUS[s.id].kind === 'debuff'))) },
      cast: (u, B, S, P) => {
        const allies = B.alliesOf(u).filter(x => x.alive), low = B.lowestHp(allies); if (!low) return;
        B.anim(u, 'cast', .6); Sound.play('heal_soft', { vol: .5 });
        KHFX.impact(B, u, 'cure', { aura: true, size: 166, life: .8, lift: 92 });
        let removed = 0;
        allies.forEach(a => {
          KHFX.impact(B, a, 'cure', { size: a === low ? 142 : 106, lift: 66 });
          B.heal(u, a, u.st.mag * (S.heal + (a === low ? S.big : 0)), { tag: 'Curaga' });
          const cleansed = B.cleanse(a, a === low ? 2 : 1);
          if (cleansed) { removed += cleansed; B.applyStatus(u, a, 'ward', P.ward); }
          B.fxFloatIcon(a.x, a.y - 100, '✚', '#9dffb0');
        });
        const threat = donaldThreat(u, B);
        if (threat && removed) {
          donaldStatic(u, threat, B, Math.min(P.rebound, removed), 5);
          KHFX.arc(B, low, threat, 'thunder', { life: .27 });
        }
      }
    },
    B: {
      name: 'Blizzaga', type: 'Magic Damage / Control', cd: 12,
      v: { ratio: 1.1, pulse: .3 }, p: { freeze: 1.25, slow: 3.5, radius: 185, pulses: 3 },
      fixedP: ['pulses'],
      desc: (S, P) => `Blizzaga lands on the densest group for <em>${pcn(S.ratio * 100)}</em> Magic damage and leaves an ice field. It pulses ${P.pulses} times, each pulse dealing <em>${pcn(S.pulse * 100)}</em> Magic damage and Slowing enemies inside for ${P.slow}s. Enemies caught by a later pulse Freeze for ${P.freeze}s once per field.`,
      ai: { prio: 60, cond: (u, B) => khFoes(u, B).length > 0 },
      cast: (u, B, S, P) => {
        const foes = khFoes(u, B);
        const t = foes.sort((a, b) => {
          const nearby = c => foes.filter(e => Math.hypot(e.x - c.x, B.depthDelta(c, e)) <= P.radius).length;
          return nearby(b) - nearby(a) || b.energy - a.energy;
        })[0];
        if (!t) return; B.anim(u, 'cast', .5);
        KHFX.shot(B, u, t, 'ice', { size: 42, life: .48 });
        B.fxProj(u, t, { kind: 'orb', col: '#bfeaff' }, () => {
          if (!u.alive) return;
          const x = t.x, depth = t.depth, frozen = new Set();
          KHFX.impact(B, t, 'ice', { size: 160, lift: 68 });
          B.fxRing(x, t.y - 40, P.radius, '#bfeaff', .5);
          const inside = () => khFoes(u, B).filter(e => Math.hypot(e.x - x, (e.depth - depth) * B.depthSpan) <= P.radius);
          inside().forEach(e => {
            B.damage(u, e, u.st.mag * S.ratio, { type: 'magic', area: true, tag: 'Blizzaga' });
            if (e.alive) B.applyStatus(u, e, 'slow', P.slow);
          });
          B.repeat(P.pulses, 1, i => {
            if (!u.alive) return;
            B.fxRing(x, B.ground - depth * B.depthSpan - 44, P.radius, '#bfeaff', .28);
            inside().forEach(e => {
              KHFX.impact(B, e, 'ice', { size: 65, count: 4 });
              B.damage(u, e, u.st.mag * S.pulse, { type: 'magic', area: true, tag: 'Blizzaga Field' });
              if (!e.alive) return;
              if (i > 0 && !frozen.has(e)) { B.applyStatus(u, e, 'freeze', P.freeze); frozen.add(e); }
              B.applyStatus(u, e, 'slow', P.slow);
            });
          });
        });
      }
    },
    P: {
      name: 'Magic Mastery', type: 'Passive', v: { cdr: .08 }, p: { energy: 4, every: 3, dur: 5, drain: 18 },
      fixedP: ['every'],
      desc: (S, P) => `+<em>${pcn(S.cdr * 100)}</em> Skill Haste. Every spell Donald casts restores ${P.energy} Energy to allies. Every ${P.every}rd spell is a Magic Surge: allies gain Magic Up for ${P.dur}s, and the two enemies with the most Energy lose ${P.drain} Energy and gain Static.`,
      passive: (u, B, S, P) => {
        u.flat.cdrKhMagic = S.cdr; u.dirty = true; u._donaldSpells = 0;
        B.on(u, 'cast', () => {
          B.alliesOf(u).filter(a => a.alive).forEach(a => B.energy(a, P.energy));
          u._donaldSpells++;
          if (u._donaldSpells % P.every) return;
          B.alliesOf(u).forEach(a => { if (a.alive) B.applyStatus(u, a, 'magup', P.dur); });
          khFoes(u, B).sort((a, b) => b.energy - a.energy).slice(0, 2).forEach(e => {
            B.energy(e, -P.drain); donaldStatic(u, e, B, 1, 5);
            KHFX.arc(B, u, e, 'thunder', { life: .25 });
          });
          KHFX.impact(B, u, 'surge', { aura: true, size: 250, life: .9, lift: 82 });
          B.fxFloatIcon(u.x, u.y - 120, '✨ MAGIC SURGE', '#9fd0ff');
        });
      }
    },
    R: {
      name: 'Royal Magician', type: 'Passive', v: { shield: .08, save: .22 }, p: { silence: 1.1, freeze: 1.2 },
      desc: (S, P) => `After Curaga or Blizzaga, the lowest-HP ally gains a Shield worth <em>${pcn(S.shield * 100)}</em> of their Max HP. If the nearest enemy carries Static, Donald Silences them for ${P.silence}s. Once per battle, he saves an ally from a lethal blow: they recover <em>${pcn(S.save * 100)}</em> Max HP, gain Ward and brief Untargetability, while their attacker Freezes for ${P.freeze}s.`,
      passive: (u, B, S, P) => {
        u._donaldSaved = false;
        B.on(u, 'cast', ev => {
          if (ev.key !== 'G' && ev.key !== 'B') return;
          const a = B.lowestHp(B.alliesOf(u).filter(x => x.alive));
          if (!a) return;
          B.shield(u, a, a.max.hp * S.shield, 6);
          const foe = B.nearest(a, khFoes(u, B));
          if (foe && foe.hasStatus('kh_donald_static')) B.applyStatus(u, foe, 'silence', P.silence);
        });
        B.on(u, 'allyLethal', ev => {
          if (u._donaldSaved || !u.alive || !ev.unit) return;
          u._donaldSaved = true; ev.prevented = true;
          ev.unit.hp = Math.max(1, ev.unit.max.hp * S.save);
          B.applyStatus(u, ev.unit, 'untargetable', .8); B.applyStatus(u, ev.unit, 'ward', 4);
          if (ev.src && ev.src.alive && ev.src.team !== u.team) B.applyStatus(u, ev.src, 'freeze', P.freeze);
          KHFX.impact(B, ev.unit, 'cure', { aura: true, size: 205, life: .9, lift: 68 });
          B.fxFloatIcon(ev.unit.x, ev.unit.y - 120, '👑 SAVED!', '#9dffb0');
          Sound.play('heal_soft', { vol: .6 });
        });
      }
    }
  }
});

KH_NEW_HERO_IDS.forEach(id => {
  if (!HERO_IDS.includes(id)) HERO_IDS.push(id);
  if (!PLAYABLE_IDS.includes(id)) PLAYABLE_IDS.push(id);
});
