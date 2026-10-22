/* Glisten: mirror rescue, precision flashes, and a dramatic entrance. */
'use strict';

function glistenAudience(u) {
  const target = u.glistenAudience;
  return target && target.alive && target.hasStatus('glisten_audience') ? target : null;
}

function glistenPartner(u, B) {
  return B.alliesOf(u).filter(a => a !== u && a.alive)
    .sort((a, b) => a.hpPct - b.hpPct || a.hp - b.hp)[0] || u;
}

function glistenDazzle(u, B, target, dur) {
  if (!target || !target.alive) return;
  B.applyStatus(u, target, 'dazzled', dur);
  B.fxFloatIcon(target.x, target.y - 78, '✨', '#f4d8ff');
}

function glistenMarkAudience(u, B, target, bonus) {
  if (!target || !target.alive) return;
  const old = glistenAudience(u);
  if (old && old !== target) B.removeStatus(old, 'glisten_audience');
  u.glistenAudience = target;
  B.applyStatus(u, target, 'glisten_audience', 999, { val: bonus });
  B.fxFloatIcon(target.x, target.y - 96, '🪞', '#f3d4ff');
}

function glistenReveal(u) {
  u._introRevealed = true;
  u._introOpacity = 1;
  u._renderOpacity = null;
  if (u.el) { u.el.style.visibility = ''; u.el.style.opacity = '1'; }
}

function glistenJumpTo(u, B, ally, dizzyDur) {
  if (!u.alive || !ally || !ally.alive) return;
  const x = clamp(ally.x - (ally.face || u.face || 1) * 42, B.leftWall + 32, B.rightWall - 32);
  B.fxGlistenMirror(u.x, u.y, 92, u.face, { life: .55, inDur: .16, spin: true, behind: true });
  B.blink(u, x, ally.depth, true);
  B.fxGlistenMirror(u.x, u.y, 110, u.face, { life: .8, inDur: .24, spin: true, behind: true });
  B.fxRing(u.x, u.y - 38, 130, '#ebcbff', .6);
  glistenReveal(u);
  if (ally !== u && dizzyDur) B.applyStatus(u, u, 'glisten_dizzy', dizzyDur);
}

function glistenOpening(u, B, S, P) {
  if (u._glistenOpeningStarted) return;
  u._glistenOpeningStarted = true;
  B.after(.16, () => {
    if (!u.alive) return;
    B.anim(u, 'cast', .56, 'glistenReflection');
    Sound.play('hero_glisten_ability', { vol: .50, throttle: 700 });
    glistenJumpTo(u, B, glistenPartner(u, B), 0);
    // The stage-light opening is the Powerline nod; the mirror is Glisten's.
    B.enemiesOf(u).slice().sort((a, b) => B.distance(u, a) - B.distance(u, b))
      .slice(0, P.openTargets).forEach(enemy => {
        B.damage(u, enemy, u.st.mag * S.openHit, { type: 'magic', tag: 'Mirror Entrance' });
        glistenDazzle(u, B, enemy, P.openDazzle);
      });
  });
}

defHero({
  id: 'Glisten', name: 'Glisten', folder: null, file: null, icon: 'Glisten',
  role: 'Control', roleLabel: 'Mirror Rescuer', tier: 'S', position: 'Midline', element: 'Gleam',
  blurb: 'A perfectionist mirror Toon who appears beside teammates, catches blows in glass, and throws a dazzling flash.',
  noIntro: true, needsMeleePosition: true,
  base: { hp: 3420, atk: 128, def: 188, mag: 438, mdef: 286, spd: 112, acc: 198, eva: 158 },
  hidden: { range: 285, aspd: 1.05, ms: 84, aggro: .42, crit: .08, critDmg: 1.55, healPow: 1, shieldPow: 1.08,
    cdr: .12, ccRes: .16, kbRes: .26, armorPen: .04, magPen: .16 },
  growth: { hp: .084, atk: .044, def: .074, mag: .101, mdef: .086 },
  move: { gait: 'float', bob: 8, freq: 1.15, hover: 10, lean: 3, idle: 'pulse', step: null,
    particles: 'sparkle', pcol: '#e4c7ff', trail: { on: true, col: '#d7a8ff', rate: .12 }, brake: .16 },
  basic: { name: 'Mirror Flash', type: 'magic', ratio: .74, range: 285, proj: 'orb', pcol: '#e4c7ff',
    sfx: 'beam_fire', hit: 'hit_magic', wind: .14, fastWind: true,
    note: 'A sharp flash from a mirror that finds the marked enemy.' },
  skills: {
    W: {
      name: 'Reflection!', type: 'Shield / Magic Damage / Control', energy: 100, wind: .3,
      v: { shield: 1.05, hit: 1.1, openHit: .34 },
      p: { shieldDur: 7, dazzleDur: 4.5, dizzyDur: 2.5, openDazzle: 2.8, openTargets: 2 },
      fixedP: ['openTargets', 'dizzyDur'],
      desc: (S, P) => `<span class="sk-pas">Glisten enters each wave through a mirror beside a teammate. The entrance flashes the two nearest enemies for <em>${pcn(S.openHit * 100)}</em> Magic Damage and briefly Dazzles them.</span> Active: teleports to the lowest-HP teammate, even from across the battlefield, Cleanses one debuff and gives them a <em>${pcn(S.shield * 100)}</em> Magic Attack Shield. A reflected flash hits and Dazzles the two enemies nearest that teammate. The jump leaves Glisten Dizzy for ${P.dizzyDur}s, lowering his Accuracy and Move Speed.`,
      passive: (u, B, S, P) => glistenOpening(u, B, S, P),
      cast: (u, B, S, P) => {
        const ally = glistenPartner(u, B);
        B.anim(u, 'cast', .72, 'glistenReflection');
        Sound.play('hero_glisten_ability', { vol: .54, throttle: 700 });
        glistenJumpTo(u, B, ally, P.dizzyDur);
        B.cleanse(ally, 1);
        B.shield(u, ally, u.st.mag * S.shield, P.shieldDur);
        if (ally !== u) B.shield(u, u, u.st.mag * S.shield * .45, P.shieldDur);
        B.enemiesOf(u).slice().sort((a, b) => B.distance(ally, a) - B.distance(ally, b))
          .slice(0, 2).forEach(enemy => {
            B.damage(u, enemy, u.st.mag * S.hit, { type: 'magic', tag: 'Reflection!' });
            glistenDazzle(u, B, enemy, P.dazzleDur);
          });
      }
    },
    G: {
      name: 'Prismatic Close-Up', type: 'Magic Damage / Control', cd: 9, wind: .22,
      v: { hit: 1.28 }, p: { dazzleDur: 4.5, splash: .42 },
      desc: (S, P) => `Focuses a mirror beam on his Audience, or the strongest enemy Mage if none is marked, dealing <em>${pcn(S.hit * 100)}</em> Magic Damage. Nearby enemies take a smaller reflected hit. All enemies hit become Dazzled for ${P.dazzleDur}s.`,
      ai: { prio: 64, cond: (u, B) => B.enemiesOf(u).some(e => B.isTargetable(e)) },
      cast: (u, B, S, P) => {
        const target = glistenAudience(u) || B.highestStat(B.enemiesOf(u), 'mag');
        if (!target || !target.alive) return;
        B.anim(u, 'cast', .48, 'glistenReflection');
        Sound.play('hero_glisten_ability', { vol: .44, throttle: 700 });
        B.fxGlistenMirror(target.x, target.y, 96, u.face, { life: .68, inDur: .2, spin: true, behind: true });
        B.damage(u, target, u.st.mag * S.hit, { type: 'magic', tag: 'Prismatic Close-Up' });
        glistenDazzle(u, B, target, P.dazzleDur);
        B.enemiesOf(u).filter(e => e !== target && B.distance(e, target) < 165).forEach(enemy => {
          B.damage(u, enemy, u.st.mag * S.hit * P.splash, { type: 'magic', area: true, tag: 'Prismatic Close-Up' });
          glistenDazzle(u, B, enemy, P.dazzleDur);
        });
      }
    },
    B: {
      name: 'Mirror Audience', type: 'Control / Shield',
      v: { audienceBonus: .1, shield: .58 }, p: { drowsyDur: 4 },
      desc: (S, P) => `Marks the enemy with the highest Magic Attack as his 🪞 Audience, making Glisten focus them and deal <em>${pcn(Math.min(.35, S.audienceBonus) * 100)}</em> more Damage to them. When the Audience uses a Skill, Glisten shields his lowest-HP teammate and makes the Audience Drowsy for ${P.drowsyDur}s. If the Audience falls, he chooses a new one.`,
      passive: (u, B, S, P) => {
        B.after(.2, () => {
          if (u.alive) glistenMarkAudience(u, B, B.highestStat(B.enemiesOf(u), 'mag'), Math.min(.35, S.audienceBonus));
        });
        B.on(u, 'enemyCast', enemy => {
          if (!u.alive || enemy !== glistenAudience(u)) return;
          B.shield(u, glistenPartner(u, B), u.st.mag * S.shield, 5);
          B.applyStatus(u, enemy, 'drowsy', P.drowsyDur);
        });
        B.on(u, 'enemyDown', dead => {
          if (!u.alive || dead !== u.glistenAudience) return;
          u.glistenAudience = null;
          glistenMarkAudience(u, B, B.highestStat(B.enemiesOf(u), 'mag'), Math.min(.35, S.audienceBonus));
        });
      }
    },
    P: {
      name: 'Perfect Reflection', type: 'Shield / Magic Damage',
      v: { reduction: .16, counter: .55 }, p: { counterCd: 1.25 }, fixedP: ['counterCd'],
      desc: (S, P) => `When Glisten or a teammate protected by his Shield is attacked, the mirror reduces that hit by <em>${pcn(Math.min(.45, S.reduction) * 100)}</em> and reflects up to <em>${pcn(S.counter * 100)}</em> Magic Attack as Magic Damage to the attacker. Can counter once every ${P.counterCd}s.`,
      passive: (u, B, S, P) => {
        u._glistenCounterAt = -Infinity;
        B.on(u, 'allyDamaged', ev => {
          if (!u.alive || !ev.unit || !ev.src || ev.src.team === u.team || ev.reflected
            || !ev.unit.shields.some(sh => sh.src === u && sh.amt > 0)) return;
          ev.amount *= 1 - Math.min(.45, S.reduction);
          if (B.t < u._glistenCounterAt) return;
          u._glistenCounterAt = B.t + P.counterCd;
          B.damage(u, ev.src, Math.min(ev.amount * .35, u.st.mag * S.counter),
            { type: 'magic', reflected: true, tag: 'Perfect Reflection' });
          B.fxFloatIcon(ev.unit.x, ev.unit.y - 100, '🪞', '#e4c7ff');
        });
      }
    },
    R: {
      name: 'Right on Time', type: 'Rescue / Shield / Control',
      v: { shield: 1.2 }, p: { healPct: .16, dazzleDur: 5, dizzyDur: 2.5 }, fixedP: ['healPct', 'dizzyDur'],
      desc: (S, P) => `Once per wave, when another teammate would be defeated, Glisten appears beside them through a mirror. He prevents the defeat, restores <em>${pcn(P.healPct * 100)}</em> of their Max HP, shields them, and Dazzles the attacker. This emergency jump also leaves Glisten Dizzy for ${P.dizzyDur}s.`,
      passive: (u, B, S, P) => {
        u._glistenRescueUsed = false;
        B.on(u, 'allyLethal', ev => {
          if (!u.alive || u._glistenRescueUsed || ev.prevented || !ev.unit || ev.unit === u) return;
          u._glistenRescueUsed = true;
          ev.prevented = true;
          ev.unit.hp = Math.max(1, ev.unit.max.hp * P.healPct);
          B.anim(u, 'cast', .65, 'glistenReflection');
          Sound.play('hero_glisten_ability', { vol: .56, throttle: 700 });
          glistenJumpTo(u, B, ev.unit, P.dizzyDur);
          B.shield(u, ev.unit, u.st.mag * S.shield, 6);
          if (ev.src && ev.src.alive && ev.src.team !== u.team) glistenDazzle(u, B, ev.src, P.dazzleDur);
          B.log(`<b>Right on Time</b> catches ${ev.unit.name}.`);
        });
      }
    }
  }
});

/* Glisten is a regular Hero. His Twisted enemy definition lives in twisted.js. */
if (typeof HERO_IDS !== 'undefined' && !HERO_IDS.includes('Glisten')) HERO_IDS.push('Glisten');
if (typeof PLAYABLE_IDS !== 'undefined' && !PLAYABLE_IDS.includes('Glisten')) PLAYABLE_IDS.push('Glisten');
