/* heroes16.js - Glisten, a mirror-first control specialist. */
'use strict';

function glistenDelaySkill(target, seconds) {
  if (!target || !target.cds) return;
  const delay = Math.max(0, Number(seconds) || 0);
  Object.keys(target.cds).forEach(key => { target.cds[key] = (target.cds[key] || 0) + delay; });
  if (target.casting) target.casting.t += delay;
}

function glistenCurrentAudience(u) {
  const t = u && u.glistenAudience;
  return t && t.alive && t.hasStatus('glisten_audience') ? t : null;
}

function glistenMarkAudience(u, B, target, dur) {
  if (!u || !target || !target.alive) return;
  const old = glistenCurrentAudience(u);
  if (old && old !== target) B.removeStatus(old, 'glisten_audience');
  u.glistenAudience = target;
  B.applyStatus(u, target, 'glisten_audience', dur || 999, { val: u._glistenAudienceBonus || .12 });
  B.fxRing(target.x, target.y - 44, 116, '#f3d4ff', .62);
  B.fxFloatIcon(target.x, target.y - 96, '🪞', '#f3d4ff');
}

function glistenDazzle(u, B, target, dur) {
  if (!target || !target.alive) return;
  B.applyStatus(u, target, 'dazzled', dur || 5.5);
  B.fxFloatIcon(target.x, target.y - 78, '✨', '#f4d8ff');
}

function glistenReveal(u) {
  if (!u) return;
  u._introRevealed = true;
  u._introOpacity = 1;
  u._renderOpacity = null;
  if (u.el) { u.el.style.visibility = ''; u.el.style.opacity = '1'; }
}

function glistenHide(u) {
  if (!u) return;
  u._introOpacity = 0;
  u._renderOpacity = null;
  if (u.el) u.el.style.opacity = '0';
}

function glistenDepthY(B, u, depth) {
  return Number.isFinite(depth) && B && Number.isFinite(B.ground) && Number.isFinite(B.depthSpan)
    ? B.ground - depth * B.depthSpan : u.y;
}

function glistenAddAdmiration(u, B, target, P) {
  if (!u || !target || !target.alive || !u._glistenAdmire) return;
  P = P || u._glistenAdmireParams || { admireDur: 6, armSlow: 2.4, admireMax: 5, fixDur: 4.5, fixDelay: 1.4 };
  const before = target.getStatus('admiration');
  const beforeStacks = before ? before.stacks : 0;
  B.applyStatus(u, target, 'admiration', P.admireDur, { stacks: 1 });
  B.applyStatus(u, target, 'armslow', P.armSlow);
  const now = target.getStatus('admiration');
  if (!now) return;
  B.fxFloatIcon(target.x, target.y - 98, `💎 ${now.stacks}`, '#f3d4ff');
  if (now.stacks >= P.admireMax && beforeStacks < P.admireMax) {
    B.applyStatus(u, target, 'fixated', P.fixDur);
    glistenDelaySkill(target, P.fixDelay);
    B.fxRing(target.x, target.y - 44, 138, '#ffd6f5', .75);
    B.fxFloatIcon(target.x, target.y - 116, '👀 FIXATED', '#ffd6f5');
  }
}

function glistenHitFormation(u, B, ratio, dur, tag) {
  const foes = B.enemiesOf(u);
  foes.forEach(target => {
    B.damage(u, target, u.st.mag * ratio, { type: 'magic', area: true, tag: tag || 'Grand Reflection' });
    glistenDazzle(u, B, target, dur);
  });
}

function glistenOpenWave(u, B, S, P) {
  if (u._glistenOpeningStarted) return;
  u._glistenOpeningStarted = true;
  u._glistenMisses = 0;
  B.after(.16, () => {
    if (!u.alive) return;
    const foes = B.enemiesOf(u);
    if (!foes.length) { glistenReveal(u); return; }
    const mirrorX = clamp(B.avgX(foes) - u.face * 54, B.leftWall + 44, B.rightWall - 44);
    const homeX = u.homeX, homeDepth = u.depthHome;
    u._glistenBusyUntil = B.t + .56;
    B.anim(u, 'cast', .62, 'glistenReflection');
    Sound.play('hero_glisten_ability', { vol: .52, throttle: 700 });
    B.blink(u, mirrorX, .48);
    B.fxGlistenMirror(mirrorX, u.y, 122, u.face, { life: .95, inDur: .34, spin: true, behind: true });
    B.fxRing(mirrorX, u.y - 34, 170, '#e8c8ff', .7);
    B.after(.18, () => {
      if (!u.alive) return;
      glistenReveal(u);
      glistenHitFormation(u, B, S.ratio, P.dazzleDur, 'Grand Reflection');
      if (u._glistenRed) B.enemiesOf(u).forEach(e => B.energy(e, -P.openingEnergy));
      B.after(.22, () => {
        if (!u.alive) return;
        B.fxGlistenMirror(homeX, glistenDepthY(B, u, homeDepth), 104, u.face, { life: .48, inDur: .18, spin: true, behind: true });
        B.blink(u, homeX, homeDepth);
        u._glistenBusyUntil = B.t + .04;
      });
    });
  });
}

function glistenFashionablyLate(u, B, S, P) {
  const audience = glistenCurrentAudience(u);
  // An Audience can briefly be untargetable during a dash or phase change.
  // Do not spend the cooldown teleporting into an invisible target; pick the
  // next visible high-Magic enemy instead.
  const target = (audience && B.isTargetable(audience))
    || B.highestStat(B.enemiesOf(u).filter(e => B.isTargetable(e)), 'mag');
  if (!target) return;
  const homeX = u.homeX, homeDepth = u.depthHome;
  // Keep a malformed/temporarily unplaced target from poisoning Glisten's
  // position with NaN. A NaN x-coordinate makes the sprite disappear and
  // causes every later distance/attack decision to fail.
  const targetX = Number.isFinite(target.x) ? target.x : (Number.isFinite(u.x) ? u.x : homeX);
  const targetDepth = Number.isFinite(target.depth) ? target.depth : (Number.isFinite(u.depth) ? u.depth : homeDepth);
  const targetY = Number.isFinite(target.y) ? target.y : u.y;
  const arrivalFace = u.face === -1 ? -1 : 1;
  const arrivalX = clamp(targetX + arrivalFace * 64, B.leftWall, B.rightWall);
  u._glistenBusyUntil = B.t + .42;
  B.anim(u, 'cast', .46, 'glistenLate');
  Sound.play('hero_glisten_ability', { vol: .46, throttle: 700 });
  B.blink(u, arrivalX, targetDepth);
  B.fxGlistenMirror(arrivalX, targetY, 104, arrivalFace, { life: .72, inDur: .24, spin: true, behind: true });
  B.fxRing(arrivalX, targetY - 34, 116, '#e4c7ff', .42);
  // Resolve the hit on arrival. Waiting here made the attack silently miss
  // whenever the target dashed, died, or became untargetable during the
  // visual delay, which made the teleport look cosmetic.
  if (u.alive && target.alive) {
    const alreadyDazzled = target.hasStatus('dazzled');
    const bonus = u._glistenRed && audience === target ? 1 + (u._glistenFashionablyLateBonus || .32) : 1;
    B.damage(u, target, u.st.mag * S.ratio * bonus, { type: 'magic', tag: 'Fashionably Late' });
    B.enemiesOf(u).filter(e => e !== target && B.distance(e, target) < 170).forEach(e => {
      B.damage(u, e, u.st.mag * S.ratio * .48, { type: 'magic', area: true, tag: 'Fashionably Late' });
      glistenDazzle(u, B, e, P.dazzleDur);
      B.applyStatus(u, e, 'armslow', P.slowDur);
    });
    glistenDazzle(u, B, target, P.dazzleDur);
    B.applyStatus(u, target, 'armslow', P.slowDur);
    if (alreadyDazzled) {
      glistenDelaySkill(target, P.delay);
      B.energy(target, -P.energyLoss);
      if (u._glistenRed) glistenAddAdmiration(u, B, target, u._glistenAdmireParams || P);
    }
  }
  // Always return through the mirror, even if the target was defeated by
  // another hit before the arrival sequence completed.
  B.after(.26, () => {
    if (!u.alive) return;
    B.fxGlistenMirror(homeX, glistenDepthY(B, u, homeDepth), 96, u.face, { life: .46, inDur: .18, spin: true, behind: true });
    B.blink(u, homeX, homeDepth);
    u._glistenBusyUntil = B.t + .04;
  });
}

defHero({
  id: 'Glisten', name: 'Glisten', folder: null, file: null, icon: 'Glisten',
  role: 'Control', roleLabel: 'Mirror Controller', tier: 'S', position: 'Midline', element: 'Gleam',
  blurb: 'A flashy mirror controller who weaponizes attention, missed attacks, and one very important audience member.',
  // Glisten's basic attack is ranged, but his kit is built around stepping
  // into the spotlight and then returning through a mirror. The default AI
  // parks projectile users on their formation line, which left him frozen at
  // spawn until somebody happened to walk into range.
  // He is absent from the shared walk-in. Grand Reflection reveals him when
  // the battle actually starts, so the entrance is owned by his teleport kit.
  noIntro: true,
  // Glisten is a mobile midline controller, not a ranged turret. Let the
  // shared AI close distance and drift between attacks so the mirror kit is
  // visible during the whole fight, not only during teleports.
  needsMeleePosition: true,
  base: { hp: 3420, atk: 128, def: 188, mag: 438, mdef: 286, spd: 112, acc: 198, eva: 158 },
  hidden: { range: 285, aspd: 1.05, ms: 84, aggro: .42, crit: .08, critDmg: 1.55, healPow: 1, shieldPow: 1.08,
    cdr: .12, ccRes: .16, kbRes: .26, armorPen: .04, magPen: .16 },
  growth: { hp: .084, atk: .044, def: .074, mag: .101, mdef: .086 },
  move: { gait: 'float', bob: 8, freq: 1.15, hover: 10, lean: 3, idle: 'pulse', step: null,
    particles: 'sparkle', pcol: '#e4c7ff', trail: { on: true, col: '#d7a8ff', rate: .12 }, brake: .16 },
  basic: { name: 'Mirror Flash', type: 'magic', ratio: .74, range: 285, proj: 'orb', pcol: '#e4c7ff',
    sfx: 'beam_fire', hit: 'hit_magic', wind: .14, fastWind: true, note: 'A sharp flash from a mirror that always finds the audience.' },
  skills: {
    W: {
      name: 'Grand Reflection', type: 'Magic Damage / Control', energy: 100,
      wind: .36, v: { ratio: .72 }, p: { dazzleDur: 5.5, missRatio: .075, maxMiss: 12, openingEnergy: 16 },
      desc: (S, P) => `<span class="sk-pas">At the beginning of each wave, Glisten enters through a mirror, dealing <em>${pcn(S.ratio * 100)}</em> Magic Damage to every enemy and applying ✨ Dazzled. Dazzled enemies lose Accuracy and Skill Haste. Each attack an enemy misses while Dazzled increases this skill’s next Damage, up to ${P.maxMiss} misses.</span> Active: opens several mirrors around the enemy team, dealing increased Magic Damage and refreshing Dazzled. The miss bonus resets between waves.`,
      passive: (u, B, S, P) => {
        u._glistenMisses = 0;
        B.enemiesOf(u).forEach(enemy => B.on(enemy, 'missed', ev => {
          if (!u.alive || !enemy.hasStatus('dazzled')) return;
          u._glistenMisses = Math.min(P.maxMiss, (u._glistenMisses || 0) + 1);
          B.fxFloatIcon(u.x, u.y - 104, `MISS ${u._glistenMisses}`, '#e4c7ff');
          if (ev.target === u) glistenAddAdmiration(u, B, enemy, { admireDur: 6, armSlow: 2.4, admireMax: 5, fixDur: 4.5, fixDelay: 1.4 });
        }));
        glistenOpenWave(u, B, S, P);
      },
      cast: (u, B, S, P) => {
        const misses = Math.min(P.maxMiss, u._glistenMisses || 0);
        B.anim(u, 'cast', .76, 'glistenReflection'); Sound.play('hero_glisten_ability', { vol: .52, throttle: 700 });
        B.fxGlistenMirror(B.avgX(B.enemiesOf(u)), B.ground - 66, 140, u.face, { life: .86, inDur: .24, spin: true, behind: true });
        B.fxRing(B.avgX(B.enemiesOf(u)), B.ground - 80, 260, '#e4c7ff', .7);
        B.after(.16, () => glistenHitFormation(u, B, S.ratio + misses * P.missRatio, P.dazzleDur, 'Grand Reflection'));
      }
    },
    G: {
      name: 'Fashionably Late', type: 'Magic Damage / Control', cd: 9, wind: .22,
      v: { ratio: 1.02 }, p: { dazzleDur: 5.5, slowDur: 4.5, delay: 1.45, energyLoss: 18 },
      desc: (S, P) => `Teleports behind the Mirror Audience, dealing <em>${pcn(S.ratio * 100)}</em> Magic Damage to them and nearby enemies. Everyone hit is Dazzled and loses Attack Speed for ${P.slowDur}s. If the Audience was already Dazzled, their next Skill is delayed and ${P.energyLoss} Energy is removed.`,
      ai: { prio: 64, cond: (u, B) => B.enemiesOf(u).some(e => B.isTargetable(e)) },
      cast: (u, B, S, P) => glistenFashionablyLate(u, B, S, P)
    },
    B: {
      name: 'Mirror Audience', type: 'Control',
      v: { audienceBonus: .12 }, p: { audienceDur: 999 },
      desc: (S) => `At the beginning of each wave, Glisten marks the enemy with the highest Magic Attack as his 🪞 Audience. He focuses that enemy with Basic Attacks and Skills. The Audience has reduced Accuracy against Glisten and takes <em>${pcn(S.audienceBonus * 100)}</em> more Damage from him while Dazzled. Whenever it uses a Skill, Glisten gains 14 Energy and the Audience becomes 😪 Drowsy, reducing Attack Speed and Skill Haste.`,
      passive: (u, B, S, P) => {
        u._glistenAudienceBonus = S.audienceBonus;
        B.after(.2, () => {
          if (!u.alive) return;
          const target = B.highestStat(B.enemiesOf(u), 'mag');
          if (target) glistenMarkAudience(u, B, target, P.audienceDur);
        });
        B.on(u, 'enemyCast', enemy => {
          if (!enemy || enemy !== glistenCurrentAudience(u)) return;
          B.energy(u, 14);
          B.applyStatus(u, enemy, 'drowsy', 4.5);
          B.fxFloatIcon(u.x, u.y - 102, '+14', '#e4c7ff');
        });
      }
    },
    P: {
      name: 'Too Pretty to Ignore', type: 'Control / Evasion',
      v: { reduction: .24 }, p: { admireDur: 6, admireMax: 5, fixDur: 4.5, fixDelay: 1.4, armSlow: 2.4 },
      desc: (S, P) => `Glisten takes <em>${pcn(S.reduction * 100)}</em> less Damage from Dazzled enemies. Enemies who miss him while Dazzled gain 💎 Admiration, reducing Energy gain and Attack Speed. At ${P.admireMax} Admiration they become 👀 Fixated, can only Basic Attack Glisten when possible, and their next Skill is delayed.`,
      passive: (u, B, S, P) => {
        u._glistenAdmire = true;
        u._glistenAdmireParams = P;
        B.on(u, 'damaged', ev => {
          if (ev.src && ev.src.team !== u.team && ev.src.hasStatus('dazzled')) ev.amount *= 1 - S.reduction;
        });
      }
    },
    R: {
      name: 'Cracked Spotlight', type: 'Control / Magic Damage / Rescue',
      v: { audienceBonus: .32, haste: .20, eva: .18 }, p: { trigger: .34, retreat: 1.25, dazzleDur: 5.5 },
      desc: (S, P) => `Grand Reflection removes ${16} Energy from every enemy at the beginning of each wave. Fashionably Late deals more Damage to the Audience and adds extra Admiration when they are Dazzled. When the Audience falls, the next-highest Magic Attack enemy becomes the new Audience. While an Audience is active, Glisten gains <em>${pcn(S.haste * 100)}</em> Skill Haste and <em>${pcn(S.eva * 100)}</em> Evasion. Once per wave below ${pc(P.trigger)} HP, he retreats into a mirror, becomes untargetable, then reappears behind the highest-HP ally and Dazzles every enemy.`,
      passive: (u, B, S, P) => {
        u._glistenRed = true; u._glistenFashionablyLateBonus = S.audienceBonus; u._glistenRetreated = false;
        B.on(u, 'enemyDown', dead => {
          if (!u.alive || dead !== u.glistenAudience) return;
          const next = B.highestStat(B.enemiesOf(u), 'mag');
          if (next) glistenMarkAudience(u, B, next, 999);
          else u.glistenAudience = null;
        });
        B.every(u, .2, () => {
          const active = !!glistenCurrentAudience(u);
          const cdr = active ? S.haste : 0, eva = active ? S.eva : 0;
          if (u.flat.cdr9 !== cdr || u.flat.evaP9 !== eva) { u.flat.cdr9 = cdr; u.flat.evaP9 = eva; u.dirty = true; }
          if (u._glistenRetreated || u.hpPct > P.trigger || !u.alive) return;
          u._glistenRetreated = true;
          const ally = B.alliesOf(u).slice().sort((a, b) => b.max.hp - a.max.hp)[0] || u;
          B.applyStatus(u, u, 'untargetable', P.retreat);
          const retreatX = Number.isFinite(ally.x) ? ally.x - u.face * 48 : u.homeX;
          glistenHide(u);
          u._glistenBusyUntil = B.t + .30;
          B.blink(u, retreatX, ally.depth);
          B.fxGlistenMirror(u.x, glistenDepthY(B, u, ally.depth), 104, u.face, { life: .72, inDur: .22, spin: true, behind: true });
          B.after(.16, () => {
            if (!u.alive) return;
            glistenReveal(u);
            B.enemiesOf(u).forEach(e => glistenDazzle(u, B, e, P.dazzleDur));
            B.fxRing(u.x, u.y - 40, 150, '#e4c7ff', .8);
            u._glistenBusyUntil = B.t + .04;
          });
          Sound.play('hero_glisten_ability', { vol: .48, throttle: 700 });
        });
      }
    }
  }
});

/* heroes16.js loads after the original roster snapshot. Glisten is a regular,
   year-round Hero with no Twisted form, so keep him in the live playable list
   without manufacturing an enemy definition. */
if (typeof HERO_IDS !== 'undefined' && !HERO_IDS.includes('Glisten')) HERO_IDS.push('Glisten');
if (typeof PLAYABLE_IDS !== 'undefined' && !PLAYABLE_IDS.includes('Glisten')) PLAYABLE_IDS.push('Glisten');
