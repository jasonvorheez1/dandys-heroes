/* kh-enemies.js - the Heartless of Halloween Town.
   Shadow, Gigas Shadow, Soldier, Stealth Soldier, Large Body and Red Nocturne.
   Weaklings by Kingdom Hearts standards, but tuned to hit harder than the
   Gold Saucer monsters: each keeps the behaviour from its field guide entry. */
'use strict';

const KH_HEARTLESS = {
  KHShadow: 'Heartless that emerges from various places. They sneak up to their enemies and strike them with sharp claws. They are extremely tenacious, often chasing their prey to the end.',
  KHGigasShadow: 'A large Heartless similar to a Shadow. Like its predecessor, it’s quite persistent and will chase its target around. If it just does the littlest amount of damage to Sora, it will fade out of sheer happiness.',
  KHSoldier: 'Heartless that emerges from various places. They are brisk in their movements, and rush into their opponents. However, they are not that tenacious. They often appear in numbers, though they lack teamwork.',
  KHStealthSoldier: 'A stealthy Heartless similar in appearance to a Soldier. It appears alongside other Heartless and deals attacks from afar. Although a troublesome enemy, it shows itself once its weakness is uncovered.',
  KHLargeBody: 'Big round Heartless. They seem tame and laid-back, but go berserk when they are angered. With their brute strength, they can inflict great damage, so be on your guard.',
  KHRedNocturne: 'Spell-casting Heartless. While hovering about they attack by casting Fire. Having low HP, they keep their distance from their opponents, making them difficult to attack. They absorb Fire attacks.'
};

function khHard(u) { return !!(u && u._khHard); }
function khEnemy(o) {
  return defHero(Object.assign({
    folder: null, file: null, icon: o.id, twistedOnly: true, khEnemy: true, element: 'Heartless', tier: 'B', nativeFace: 1,
    growth: { hp: .09, atk: .088, def: .078, mag: .088, mdef: .078 },
    move: { gait: 'step', bob: 3, freq: 1.5, lean: 6, squash: .04, idle: 'breathe', step: 'step', trail: { on: false }, brake: .3 }
  }, o));
}
const KHH = (range, aspd, ms, extra) => Object.assign({ range, aspd, ms, aggro: 1, crit: .12, critDmg: 1.6, healPow: 1, shieldPow: 1, cdr: .06, ccRes: .15, kbRes: .25, armorPen: .06, magPen: .06 }, extra || {});
const khClips = key => ({ idle: [`heartless-${key}-idle`, 6], move: [`heartless-${key}-move`, 10], attack: [`heartless-${key}-attack`, 12, true], cast: [`heartless-${key}-attack`, 10, true] });

khSprites('KHLargeBody', 1.0, 176, khClips('largebody'));
khSprites('KHRedNocturne', 1.0, 150, khClips('nocturne'));

/* ============================================================ SHADOW */
khEnemy({
  id: 'KHShadow', name: 'Shadow', role: 'Damage', scale: 1.25, blurb: KH_HEARTLESS.KHShadow,
  base: { hp: 3700, atk: 450, def: 215, mag: 120, mdef: 190, spd: 152, acc: 222, eva: 172 },
  hidden: KHH(82, 1.3, 138, { crit: .15, ccRes: .25 }),
  basic: { name: 'Claw', type: 'physical', ratio: 1.0, range: 82, wind: .14, sfx: 'swing_light', hit: 'hit_slash' },
  skills: {
    W: { name: 'Emerge', type: 'Special', energy: 100, v: { ratio: 1.45 }, p: { sink: 1.6 },
      desc: (S, P) => `Sinks into the ground, becoming untargetable for ${P.sink}s, then bursts out under the lowest-HP Hero for <em>${pcn(S.ratio * 100)}</em> (never misses) and leaves them bleeding.`,
      cast: (u, B, S, P) => {
        B.applyStatus(u, u, 'untargetable', P.sink); KHFX.pop(B, u, 'EMERGE', '#ffd23a'); Sound.play('whoosh', { vol: .4 });
        B.after(P.sink, () => {
          const t = B.lowestHp(khFoes(u, B)); if (!u.alive || !t) return;
          B.blink(u, t.x - u.face * 46, t.depth, true); B.anim(u, 'attack', .35);
          B.damage(u, t, u.st.atk * S.ratio, { type: 'physical', tag: 'Emerge', noDodge: true, melee: true });
          B.applyStatus(u, t, 'bleed', 5, { val: u.st.atk * .05 });
        });
      } },
    G: { name: 'Lunge', type: 'Physical Damage', cd: 6, v: { ratio: 1.25 }, p: {},
      desc: S => `Lunges at its current prey for <em>${pcn(S.ratio * 100)}</em> and slows it.`,
      ai: { prio: 55, cond: () => true },
      cast: (u, B, S) => {
        const t = khTarget(u, B); if (!t) return;
        B.anim(u, 'attack', .35); B.dash(u, t.x - u.face * 40, .2, { depth: t.depth });
        B.after(.18, () => { if (!u.alive || !t.alive) return; B.damage(u, t, u.st.atk * S.ratio, { type: 'physical', tag: 'Lunge', melee: true }); B.applyStatus(u, t, 'slow', 3); });
      } },
    B: { name: 'Swarm Rush', type: 'Support', cd: 12, v: {}, p: { dur: 5 },
      desc: P => 'Every Shadow on the field attacks 35% faster for 5s.',
      ai: { prio: 50, cond: (u, B) => B.alliesOf(u).filter(a => a.id === u.id).length > 1 },
      cast: (u, B, S, P) => { B.anim(u, 'cast', .4); B.alliesOf(u).filter(a => a.id === u.id).forEach(a => B.applyStatus(u, a, 'speedup', P.dur)); KHFX.pop(B, u, 'SWARM', '#ffd23a'); } },
    P: { name: 'Tenacious', type: 'Passive', v: {}, p: {},
      desc: () => 'Chases its prey to the end: +25% Move Speed and +20% Crowd Control Resistance. It will not stop hunting the Hero it picked first.',
      passive: (u, B) => {
        B.applyStatus(u, u, 'kh_tenacious', 999);
        B.every(u, .5, () => { if (!u.alive) return; if (u._khPrey && u._khPrey.alive && B.isTargetable(u._khPrey) && !khStopped(u)) u._distractor = u._khPrey, u._distractUntil = B.t + 1; else u._khPrey = u.target; });
      } }
  }
});

/* ============================================================ GIGAS SHADOW */
khEnemy({
  id: 'KHGigasShadow', name: 'Gigas Shadow', role: 'Tank', scale: 1.7, blurb: KH_HEARTLESS.KHGigasShadow,
  base: { hp: 8200, atk: 470, def: 310, mag: 140, mdef: 265, spd: 104, acc: 205, eva: 104 },
  hidden: KHH(96, 1.0, 92, { aggro: 1.3, ccRes: .35, kbRes: .6 }),
  basic: { name: 'Gigas Smash', type: 'physical', ratio: 1.2, range: 96, wind: .24, sfx: 'hit_heavy', hit: 'hit_heavy' },
  skills: {
    W: { name: 'Ground Pound', type: 'Physical Damage / Control', energy: 100, v: { ratio: 1.5 }, p: { radius: 230, stun: 1.0 },
      desc: (S, P) => `Slams the ground, dealing <em>${pcn(S.ratio * 100)}</em> to every Hero within ${P.radius}px, Stunning them for ${P.stun}s.`,
      cast: (u, B, S, P) => {
        B.anim(u, 'attack', .6); B.after(.35, () => {
          if (!u.alive) return;
          khFoes(u, B).filter(e => B.distance(u, e) <= P.radius).forEach(e => { B.damage(u, e, u.st.atk * S.ratio, { type: 'physical', area: true, tag: 'Ground Pound' }); B.applyStatus(u, e, 'stun', khHard(u) ? P.stun + .4 : P.stun); });
          B.fxRing(u.x, u.y - 20, P.radius, '#6a5acd', .6); B.shake(14, .4); Sound.play('explode', { vol: .4 });
        });
      } },
    G: { name: 'Relentless Chase', type: 'Control', cd: 9, v: {}, p: { dur: 5 },
      desc: () => 'Picks its prey and charges it down, gaining Move Speed for 5s and ignoring everything else.',
      ai: { prio: 50, cond: () => true },
      cast: (u, B, S, P) => { const t = khTarget(u, B); if (!t) return; B.applyStatus(u, u, 'speedup', P.dur); u._distractor = t; u._distractUntil = B.t + P.dur; B.dash(u, t.x - u.face * 70, .3, { depth: t.depth }); } },
    B: { name: 'Shadow Crush', type: 'Physical Damage', cd: 12, v: { ratio: 1.8 }, p: {},
      desc: S => `Crushes the highest-Attack Hero for <em>${pcn(S.ratio * 100)}</em> and Knocks them back.`,
      ai: { prio: 58, cond: () => true },
      cast: (u, B, S) => { const t = B.topN(khFoes(u, B), 'atk', 1)[0]; if (!t) return; B.anim(u, 'attack', .5); B.dash(u, t.x - u.face * 60, .25, { depth: t.depth });
        B.after(.28, () => { if (!u.alive || !t.alive) return; B.damage(u, t, u.st.atk * S.ratio, { type: 'physical', tag: 'Shadow Crush', melee: true }); B.knockback(u, t, 60); }); } },
    P: { name: 'Joyful Fade', type: 'Passive', v: {}, p: {},
      desc: () => 'Persistent, but easily pleased: the moment it does even the littlest damage to Sora, it fades out of sheer happiness.',
      passive: (u, B) => {
        B.on(u, 'dealDamage', ev => {
          if (!ev.target || ev.target.id !== 'Sora' || ev.dot || u._khFading) return;
          u._khFading = true; B.fxFloatIcon(u.x, u.y - 150, '♥', '#ff6a8a'); B.log('<b>Gigas Shadow</b> fades out happily.');
          B.after(.3, () => { if (u.alive) B.kill(u, null); });
        });
      } }
  }
});

/* ============================================================ SOLDIER */
khEnemy({
  id: 'KHSoldier', name: 'Soldier', role: 'Damage', scale: 1.05, blurb: KH_HEARTLESS.KHSoldier,
  base: { hp: 3500, atk: 470, def: 205, mag: 120, mdef: 185, spd: 178, acc: 225, eva: 192 },
  hidden: KHH(80, 1.55, 160, { crit: .16, ccRes: .04, kbRes: .15 }),
  basic: { name: 'Slash', type: 'physical', ratio: .95, range: 80, wind: .12, sfx: 'swing_light', hit: 'hit_slash' },
  skills: {
    W: { name: 'Rush Dance', type: 'Physical Damage', energy: 100, v: { hit: .95 }, p: { hits: 4 },
      desc: (S, P) => `Rushes the nearest Hero and slashes ${P.hits} times for <em>${pcn(S.hit * 100)}</em> each.`,
      cast: (u, B, S, P) => {
        const t = B.nearest(u, khFoes(u, B)); if (!t) return;
        B.anim(u, 'attack', .75); B.dash(u, t.x - u.face * 46, .16, { depth: t.depth });
        for (let i = 0; i < P.hits; i++) B.after(.18 + i * .15, () => { if (!u.alive || !t.alive) return; B.damage(u, t, u.st.atk * S.hit, { type: 'physical', tag: 'Rush Dance', melee: true }); B.fxSlash(u, t, { col: '#ffd23a', small: true }); });
      } },
    G: { name: 'Sidestep', type: 'Support', cd: 7, v: {}, p: { dur: 3 },
      desc: () => 'Dances out of the way: Evasion up and Move Speed up for 3s.',
      ai: { prio: 45, cond: (u, B) => khFoes(u, B).some(e => B.distance(u, e) < 220) },
      cast: (u, B, S, P) => { B.applyStatus(u, u, 'float', P.dur); B.applyStatus(u, u, 'speedup', P.dur); KHFX.pop(B, u, 'DODGE', '#ffd23a'); } },
    B: { name: 'Frenzy', type: 'Support', cd: 14, v: {}, p: { dur: 5 },
      desc: () => 'Whips nearby Soldiers into a frenzy (+20% Attack for 5s). Soldiers still lack teamwork: each only buffs itself and one neighbour.',
      ai: { prio: 40, cond: () => true },
      cast: (u, B, S, P) => { B.anim(u, 'cast', .4); const n = B.alliesOf(u).filter(a => a !== u && a.alive && a.id === u.id).sort((a, b) => B.distance(u, a) - B.distance(u, b))[0];
        [u, n].forEach(a => a && B.applyStatus(u, a, 'atkup', P.dur)); } },
    P: { name: 'Brisk Rush', type: 'Passive', v: {}, p: {},
      desc: () => 'Rushes into its opponents: +40% Move Speed while its target is far away. Not very tenacious: it loses interest and swaps targets easily.',
      passive: (u, B) => {
        B.every(u, .4, () => {
          if (!u.alive) return; const t = u.target; const far = t && B.distance(u, t) > 170;
          const v = far ? .4 : 0; if (u.flat.msPKhBrisk !== v) { u.flat.msPKhBrisk = v; u.dirty = true; }
          if (chance(.12) && B.t - (u._khSwap || 0) > 3) { u._khSwap = B.t; const o = pick(khFoes(u, B)); if (o) { u._distractor = o; u._distractUntil = B.t + 2; } }
        });
      } }
  }
});

/* ============================================================ STEALTH SOLDIER */
khEnemy({
  id: 'KHStealthSoldier', name: 'Stealth Soldier', role: 'Damage', scale: 1.1, blurb: KH_HEARTLESS.KHStealthSoldier,
  base: { hp: 3000, atk: 500, def: 190, mag: 160, mdef: 190, spd: 150, acc: 240, eva: 210 },
  hidden: KHH(330, 1.1, 96, { crit: .2, critDmg: 1.75, ccRes: .12 }),
  basic: { name: 'Shadow Bolt', type: 'physical', rangedPhysical: true, ratio: 1.0, range: 330, proj: 'orb', pcol: '#8aa0ff', wind: .2, sfx: 'whoosh', hit: 'hit_magic' },
  skills: {
    W: { name: 'Shadow Volley', type: 'Physical Damage', energy: 100, v: { ratio: .95 }, p: { bolts: 5 },
      desc: (S, P) => `Fires ${P.bolts} bolts at random Heroes from the dark, each for <em>${pcn(S.ratio * 100)}</em>.`,
      cast: (u, B, S, P) => {
        B.anim(u, 'attack', .8);
        for (let i = 0; i < P.bolts; i++) B.after(.2 + i * .14, () => { const t = pick(khFoes(u, B)); if (!u.alive || !t) return;
          B.fxProj(u, t, { kind: 'orb', col: '#8aa0ff' }, () => { if (t.alive) B.damage(u, t, u.st.atk * S.ratio, { type: 'physical', tag: 'Shadow Volley' }); }); });
      } },
    G: { name: 'Fade Step', type: 'Special', cd: 8, v: {}, p: {},
      desc: () => 'Slips to the far side of the field and melts back into stealth, unless its weakness has been uncovered.',
      ai: { prio: 50, cond: (u, B) => !u.hasStatus('kh_revealed') && khFoes(u, B).some(e => B.distance(u, e) < 200) },
      cast: (u, B) => { const away = u.x < B.W / 2 ? B.W - 90 : 90; B.blink(u, clamp(u.team === TEAM_E ? Math.max(away, B.W / 2 + 60) : away, B.leftWall + 20, B.rightWall - 20), u.depth); if (!u.hasStatus('kh_revealed')) B.applyStatus(u, u, 'stealth', 999); } },
    B: { name: 'Dark Mark', type: 'Control', cd: 11, v: {}, p: { dur: 5 },
      desc: () => 'Marks the highest-Energy Hero: they take 15% more damage and can be crit more easily for 5s.',
      ai: { prio: 44, cond: () => true },
      cast: (u, B, S, P) => { const t = B.highestEnergy(khFoes(u, B)); if (t) { B.applyStatus(u, t, 'marked', P.dur); B.applyStatus(u, t, 'defdown', P.dur); } } },
    P: { name: 'Veil', type: 'Passive', v: {}, p: { wait: 4.5, reveal: 8 },
      desc: (S, P) => `Stays hidden: untargetable until it attacks (its first strike always crits), and re-veils itself ${P.wait}s after striking. Landing a critical hit on it, or any debuff, uncovers its weakness: it is Revealed for ${P.reveal}s, takes 25% more damage and cannot hide.`,
      passive: (u, B, S, P) => {
        B.applyStatus(u, u, 'stealth', 999); u._khLastAtk = B.t;
        B.on(u, 'dealDamage', () => { u._khLastAtk = B.t; });
        const reveal = () => { if (!u.alive) return; B.removeStatus(u, 'stealth'); B.applyStatus(u, u, 'kh_revealed', P.reveal); KHFX.pop(B, u, 'REVEALED', '#ff8a8a'); };
        B.on(u, 'damaged', ev => { if (ev.target === u && ev.crit && !u.hasStatus('kh_revealed')) reveal(); });
        B.on(u, 'statusApplied', ev => { if (ev.unit === u && STATUS[ev.id] && STATUS[ev.id].kind === 'debuff' && ev.id !== 'kh_revealed' && !u.hasStatus('kh_revealed')) reveal(); });
        B.every(u, .6, () => { if (u.alive && !u.hasStatus('stealth') && !u.hasStatus('kh_revealed') && B.t - u._khLastAtk > P.wait) B.applyStatus(u, u, 'stealth', 999); });
      } }
  }
});

/* ============================================================ LARGE BODY */
khEnemy({
  id: 'KHLargeBody', name: 'Large Body', role: 'Tank', scale: 1.0, blurb: KH_HEARTLESS.KHLargeBody,
  base: { hp: 10500, atk: 540, def: 390, mag: 100, mdef: 305, spd: 62, acc: 195, eva: 58 },
  hidden: KHH(104, .78, 58, { aggro: 1.4, ccRes: .45, kbRes: .95 }),
  basic: { name: 'Belly Bump', type: 'physical', ratio: 1.3, range: 104, wind: .32, sfx: 'hit_heavy', hit: 'hit_heavy' },
  skills: {
    W: { name: 'Belly Slam', type: 'Physical Damage / Control', energy: 100, v: { ratio: 1.6 }, p: { radius: 240, stun: 1.2 },
      desc: (S, P) => `Flops onto the ground: <em>${pcn(S.ratio * 100)}</em> to every Hero within ${P.radius}px, Stunning them for ${P.stun}s and knocking them away.`,
      cast: (u, B, S, P) => {
        B.anim(u, 'attack', .8); B.after(.5, () => {
          if (!u.alive) return;
          khFoes(u, B).filter(e => B.distance(u, e) <= P.radius).forEach(e => { B.damage(u, e, u.st.atk * S.ratio, { type: 'physical', area: true, tag: 'Belly Slam' }); B.applyStatus(u, e, 'stun', P.stun); B.knockback(u, e, 80); });
          B.fxRing(u.x, u.y - 20, P.radius, '#c43b4b', .7); B.shake(18, .5); Sound.play('explode', { vol: .5 });
        });
      } },
    G: { name: 'Shell Up', type: 'Survival', cd: 12, v: {}, p: { dur: 3.5 },
      desc: () => 'Tucks in and takes 50% less damage for 3.5s.',
      ai: { prio: 48, cond: u => u.hpPct < .9 },
      cast: (u, B, S, P) => { u.flat.dmgTakenKhShell = -.5; u.dirty = true; KHFX.pop(B, u, 'SHELL UP', '#9fa8ff'); B.after(P.dur, () => { u.flat.dmgTakenKhShell = 0; u.dirty = true; }); } },
    B: { name: 'Rolling Charge', type: 'Physical Damage', cd: 14, v: { ratio: 1.5 }, p: {},
      desc: S => `Rolls straight through the Hero line for <em>${pcn(S.ratio * 100)}</em> to everyone it passes.`,
      ai: { prio: 56, cond: (u, B) => khFoes(u, B).length > 1 },
      cast: (u, B, S) => {
        const t = B.topN(khFoes(u, B), 'def', 1)[0]; if (!t) return; B.anim(u, 'attack', .7);
        const to = clamp(u.x + u.face * 420, B.leftWall + 20, B.rightWall - 20); const hit = new Set();
        B.dash(u, to, .55, { depth: u.depth });
        B.repeat(8, .07, () => khFoes(u, B).forEach(e => { if (!hit.has(e) && Math.abs(e.x - u.x) < 70) { hit.add(e); B.damage(u, e, u.st.atk * S.ratio, { type: 'physical', area: true, tag: 'Rolling Charge' }); B.knockback(u, e, 50); } }));
      } },
    P: { name: 'Laid-Back', type: 'Passive', v: {}, p: { anger: .62 },
      desc: (S, P) => `Tame and easygoing: takes 20% less damage while calm. Anger it (below ${pcn(P.anger * 100)} HP, or by hitting it six times in four seconds) and it goes <b>Berserk</b>: +60% Attack, +30% Attack Speed, and no more calm.`,
      passive: (u, B, S, P) => {
        u.flat.dmgTakenKhCalm = -.2; u.dirty = true; u._khHits = [];
        const rage = () => { if (!u.alive || u.hasStatus('kh_berserk')) return; u.flat.dmgTakenKhCalm = 0; u.dirty = true; B.applyStatus(u, u, 'kh_berserk', 999); KHFX.banner(B, 'Large Body is angry!', 'enemy'); KHFX.pop(B, u, '💢', '#ff5a5a'); B.shake(10, .4); };
        B.on(u, 'damaged', ev => { if (ev.target !== u || ev.dot) return; u._khHits = u._khHits.filter(t => B.t - t < 4); u._khHits.push(B.t); if (u._khHits.length >= 6) rage(); });
        B.every(u, .3, () => { if (u.hpPct < P.anger) rage(); });
      } }
  }
});

/* ============================================================ RED NOCTURNE */
khEnemy({
  id: 'KHRedNocturne', name: 'Red Nocturne', role: 'Damage', scale: 1.0, blurb: KH_HEARTLESS.KHRedNocturne,
  base: { hp: 2700, atk: 150, def: 130, mag: 450, mdef: 250, spd: 128, acc: 235, eva: 150 },
  hidden: KHH(390, .95, 74, { magPen: .14, ccRes: .12 }),
  basic: { name: 'Fire', type: 'magic', ratio: 1.15, range: 390, proj: 'orb', pcol: '#ff6a2a', wind: .26, sfx: 'fire', hit: 'hit_magic',
    onHit: (u, t, B) => { B.applyStatus(u, t, 'burn', 3, { val: u.st.mag * .05 }); } },
  skills: {
    W: { name: 'Firaga', type: 'Magic Damage', energy: 100, v: { ratio: 1.45 }, p: {},
      desc: S => `Sets the whole Hero line ablaze for <em>${pcn(S.ratio * 100)}</em> Magic and a burn.`,
      cast: (u, B, S) => {
        B.anim(u, 'cast', .8); KHFX.pop(B, u, 'FIRAGA', '#ff8a3a');
        B.after(.45, () => { if (!u.alive) return; khFoes(u, B).forEach(e => { B.damage(u, e, u.st.mag * S.ratio, { type: 'magic', tag: 'Firaga' }); B.applyStatus(u, e, 'burn', 4, { val: u.st.mag * .06 }); B.fxBoom(e.x, e.y - 60, .8, '#ff8a3a'); }); Sound.play('fire', { vol: .5 }); });
      } },
    G: { name: 'Fire Rain', type: 'Magic Damage', cd: 7, v: { ratio: 1.0 }, p: { bolts: 3 },
      desc: (S, P) => `Rains ${P.bolts} fireballs on random Heroes for <em>${pcn(S.ratio * 100)}</em> each.`,
      ai: { prio: 58, cond: (u, B) => khFoes(u, B).length > 0 },
      cast: (u, B, S, P) => { B.anim(u, 'cast', .5); for (let i = 0; i < P.bolts; i++) B.after(.15 + i * .18, () => { const t = pick(khFoes(u, B)); if (!u.alive || !t) return; B.fxProj(u, t, { kind: 'orb', col: '#ff6a2a' }, () => { if (t.alive) B.damage(u, t, u.st.mag * S.ratio, { type: 'magic', tag: 'Fire Rain' }); }); }); } },
    B: { name: 'Cinder Boon', type: 'Support', cd: 13, v: {}, p: { dur: 5 },
      desc: () => 'Blesses nearby Heartless with Fire Absorb and +20% Attack for 5s.',
      ai: { prio: 42, cond: (u, B) => B.alliesOf(u).length > 1 },
      cast: (u, B, S, P) => { B.anim(u, 'cast', .4); B.alliesOf(u).filter(a => a.alive && B.distance(u, a) < 360).forEach(a => { B.applyStatus(u, a, 'atkup', P.dur); B.applyStatus(u, a, 'kh_absorb_fire', P.dur); }); } },
    P: { name: 'Fire Absorb', type: 'Passive', v: {}, p: { away: 175 },
      desc: (S, P) => `Absorbs Fire: burns and fire attacks heal it instead. Low HP, so it keeps its distance, drifting away whenever a Hero gets within ${P.away}px.`,
      passive: (u, B, S, P) => {
        B.applyStatus(u, u, 'kh_absorb_fire', 999);
        B.every(u, .5, () => {
          if (!u.alive || khStopped(u) || B.t < (u._khDriftAt || 0)) return;
          const near = B.nearest(u, khFoes(u, B)); if (!near || B.distance(u, near) > P.away) return;
          u._khDriftAt = B.t + 3.2; const dir = u.x >= near.x ? 1 : -1;
          B.blink(u, clamp(u.x + dir * 190, B.leftWall + 24, B.rightWall - 24), u.depth);
        });
      } }
  }
});
