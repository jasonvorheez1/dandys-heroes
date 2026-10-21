/* heroes6.js - Razzle & Dazzle, one frontline body shared by two imperfect
   specialists. Comedy pressures; Tragedy endures; neither replaces a real
   dedicated Damage Hero or Tank. */
'use strict';

function rndResetPerformance(u, B) {
  u.rndComedyPerf = 0; u.rndTragedyPerf = 0; u.rndPerformance = 0; u.rndEncore = false;
  u.flat.atkP6 = 0; u.flat.aspdP6 = 0; u.flat.defP6 = 0; u.flat.mdefP6 = 0; u.flat.healRecv6 = 0;
  if (B) B.removeStatus(u, 'performance');
  u.dirty = true;
}

function rndAddPerformance(u, B, state) {
  if (!u.rndPerfMax || u.rndDual) return;
  u.rndPerformance = Math.min(u.rndPerfMax, (u.rndPerformance || 0) + 1);
  if (state === 'comedy') u.rndComedyPerf = (u.rndComedyPerf || 0) + 1;
  else u.rndTragedyPerf = (u.rndTragedyPerf || 0) + 1;
  u.flat.atkP6 = (u.rndComedyPerf || 0) * u.rndPerfAtk;
  u.flat.aspdP6 = (u.rndComedyPerf || 0) * u.rndPerfSpeed;
  u.flat.defP6 = (u.rndTragedyPerf || 0) * u.rndPerfArmor;
  u.flat.mdefP6 = (u.rndTragedyPerf || 0) * u.rndPerfArmor;
  u.flat.healRecv6 = (u.rndTragedyPerf || 0) * u.rndPerfHeal;
  B.applyStatus(u, u, 'performance', 999, { stacks: 1 });
  u.dirty = true;
  if (u.rndPerformance >= u.rndPerfMax && !u.rndEncore) {
    u.rndEncore = true; B.fxFloatIcon(u.x, u.y - 104, '🎭', '#ffd166');
    B.log(`<b>${u.name}</b> has a full Performance.`); Sound.play('cheer', { vol: .38 });
  }
}

function rndSetState(u, B, state, force) {
  if (u.rndDual && !force) return false;
  if (u.rndState === state) return false;
  u.rndState = state;
  if (force !== 'reset') rndAddPerformance(u, B, state);
  const comedy = state === 'comedy';
  B.fxFloatIcon(u.x, u.y - 102, comedy ? '☀️' : '🌧️', comedy ? '#ffe27a' : '#9cb3d9');
  B.fxAura(u, comedy ? '#ffd166' : '#8091ad', .65);
  B.log(`<b>${comedy ? 'Razzle' : 'Dazzle'}</b> takes the stage.`);
  return true;
}

function rndUseBoth(u, B) {
  if (u.rndDual) return true;
  if (!u.rndEncore) return false;
  rndResetPerformance(u, B);
  return true;
}

function rndBasicEffect(u, t, B, S, state) {
  if (state === 'comedy') {
    B.applyStatus(u, u, 'speedup', 3.5, { stacks: 1 });
    u.rndMove = Math.min(5, (u.rndMove || 0) + 1); u.rndMoveUntil = B.t + 4;
    u.flat.msP6 = u.rndMove * S.move; u.dirty = true;
  } else {
    B.applyStatus(u, u, 'fortify', 3.5, { stacks: 1 });
    B.heal(u, u, u.max.hp * S.heal, { silent: true, tag: 'Tragedy' });
  }
}

function rndStartFinalAct(u, B, S, P) {
  if (u.rndDual || u.rndFinalUsed) return;
  u.rndFinalUsed = true; u.rndDual = true; u.rndDualNext = 'comedy';
  B.fxFloatIcon(u.x, u.y - 112, '🎭', '#ffd166'); B.fxConfetti(u.x, u.y - 55, 30);
  B.applyStatus(u, u, 'inspire', P.dur); B.applyStatus(u, u, 'ward', P.dur);
  B.log(`<b>One More Act!</b> Razzle and Dazzle perform together.`); Sound.play('cheer_big', { vol: .5 });
  B.after(P.dur, () => {
    if (!u.alive) return;
    u.rndDual = false; rndResetPerformance(u, B);
    rndSetState(u, B, u.hpPct < .5 ? 'tragedy' : 'comedy', 'reset');
  });
}

defHero({
  id: 'RnD', name: 'Razzle & Dazzle', folder: 'RnD', file: 'RnD', icon: 'RnD',
  role: 'Tank', roleLabel: 'DPS / Tank Hybrid', tier: 'C', element: 'Theatre',
  blurb: 'Razzle wants the spotlight. Dazzle wants the fight to end. They trade offense and survival without matching a dedicated specialist at either.',
  base: { hp: 4560, atk: 302, def: 266, mag: 82, mdef: 258, spd: 98, acc: 172, eva: 86 },
  hidden: { range: 186, aspd: .92, ms: 70, aggro: 1.24, crit: .09, critDmg: 1.55, healPow: 1,
    shieldPow: 1.12, cdr: .03, ccRes: .22, kbRes: .48, armorPen: .07, magPen: 0 },
  growth: { hp: .094, atk: .083, def: .087, mag: .035, mdef: .085 },
  move: { gait: 'march', bob: 3, freq: 1.45, lean: 5, squash: .045, idle: 'sway', step: 'step_soft',
    particles: 'confetti', pcol: '#d64b4b', trail: { on: false }, brake: .58, wobble: 4 },
  basic: { name: 'Shared Spotlight', type: 'physical', ratio: .94, range: 186, sfx: 'swing_light', hit: 'hit_blunt', wind: .23,
    note: 'Comedy presses the attack; Tragedy braces behind it.' },
  skills: {
    W: {
      name: 'Comedy / Tragedy', type: 'Physical Damage', energy: 100,
      v: { ratio: 1.22, comedy: .18, heal: .018, move: .018, shield: .11 }, p: { blind: 5, thresholds: [.75, .50, .25] },
      desc: (S, P) => `<span class="sk-pas">Comedy Basics deal <em>${pcn(S.comedy * 100)}</em> more Physical Damage and build Attack/Move Speed. Tragedy Basics deal less Damage but grant Armor/Magic Defense and heal <em>${pcn(S.heal * 100)}</em> Max HP. Crossing ${P.thresholds.map(x => pc(x)).join(', ')} HP automatically switches them.</span> Active: the current personality attacks nearby enemies, then switches. Comedy spins forward and reduces Accuracy; Tragedy lands a heavy impact and grants a <em>${pcn(S.shield * 100)}</em> Max HP Shield.`,
      passive: (u, B, S, P) => {
        u.rndState = 'comedy'; u.rndThreshold = 0;
        B.on(u, 'dealDamage', ev => {
          if (!ev.basic) return;
          const state = u.rndDual ? u.rndDualNext : u.rndState;
          if (u.rndDual) u.rndDualNext = state === 'comedy' ? 'tragedy' : 'comedy';
          u.rndLastBasicState = state;
          ev.amount *= state === 'comedy' ? 1 + S.comedy : .78;
        });
        B.on(u, 'basicHit', ev => {
          const state = u.rndLastBasicState || u.rndState;
          rndBasicEffect(u, ev.target, B, S, state);
          if (u.rndDual && state === 'tragedy') B.shield(u, u, u.max.hp * S.shield * .42, 3);
        });
        B.every(u, .2, () => {
          const threshold = P.thresholds[u.rndThreshold];
          if (threshold != null && u.hpPct <= threshold && rndSetState(u, B, u.rndState === 'comedy' ? 'tragedy' : 'comedy')) u.rndThreshold++;
          if (u.rndMove && B.t > u.rndMoveUntil) { u.rndMove = 0; u.flat.msP6 = 0; u.dirty = true; }
        });
      },
      cast: (u, B, S, P) => {
        const both = rndUseBoth(u, B), states = both ? ['comedy', 'tragedy'] : [u.rndState];
        B.anim(u, 'cast', .5); B.spinUnit(u, .6); Sound.play('spin', { vol: .45 });
        if (states.includes('comedy')) B.dash(u, u.x + u.face * 95, .25, {});
        B.after(.28, () => {
          const near = B.enemiesOf(u).filter(e => B.distance(e, u) <= 225);
          states.forEach(state => near.forEach(e => {
            B.damage(u, e, u.st.atk * S.ratio * (state === 'comedy' ? 1.15 : .82), { type: 'physical', melee: true, area: true, tag: state === 'comedy' ? 'Comedy' : 'Tragedy' });
            if (state === 'comedy') B.applyStatus(u, e, 'blind', P.blind);
          }));
          if (states.includes('tragedy')) B.shield(u, u, u.max.hp * S.shield, 7);
          B.fxBoom(u.x, u.y - 28, 1, states.length > 1 ? '#ffd166' : u.rndState === 'comedy' ? '#ffcf5a' : '#8292ad');
          if (!both) rndSetState(u, B, u.rndState === 'comedy' ? 'tragedy' : 'comedy');
        });
      }
    },
    G: {
      name: 'Take The Stage', type: 'Physical Damage', cd: 9.5,
      v: { hit: .34, final: .68 }, p: { hits: 3, guard: 5 },
      desc: (S, P) => `Razzle charges the highest-Attack enemy for ${P.hits} strikes of <em>${pcn(S.hit * 100)}</em> Attack. Every hit builds Attack Speed. Starting in Comedy adds a <em>${pcn(S.final * 100)}</em> finishing strike; starting in Tragedy instead grants Damage Reduction.`,
      ai: { prio: 54, cond: (u, B) => B.enemiesOf(u).length > 0 },
      cast: (u, B, S, P) => {
        const start = u.rndState, both = rndUseBoth(u, B) || u.rndDual;
        const t = B.highestStat(B.enemiesOf(u), 'atk'); if (!t) return;
        if (!u.rndDual && !both && !rndSetState(u, B, 'comedy')) rndAddPerformance(u, B, 'comedy');
        B.fxTargetLine(u, t, '#ffd166'); B.dash(u, t.x - u.face * 55, .34, { depth: t.depth, onEnd: () => {
          for (let i = 0; i < P.hits; i++) B.after(i * .10, () => { if (!t.alive) return; B.fxSlash(u, t, { col: '#ffe27a', ang: i % 2 ? 32 : -32, small: true });
            B.damage(u, t, u.st.atk * S.hit, { type: 'physical', melee: true, tag: 'Take The Stage' }); B.applyStatus(u, u, 'speedup', 4, { stacks: 1 }); });
          B.after(P.hits * .10, () => { if ((start === 'comedy' || both) && t.alive) B.damage(u, t, u.st.atk * S.final, { type: 'physical', melee: true, tag: 'Final Flourish' });
            if (start === 'tragedy' || both) B.applyStatus(u, u, 'ward', P.guard); B.fxConfetti(t.x, t.y - 55, 14); });
        }});
      }
    },
    B: {
      name: 'Curtain Call', type: 'Physical Damage', cd: 11.5,
      v: { ratio: .92, comedy: .38 }, p: { slow: 5, guard: 5 },
      desc: (S, P) => `Dazzle slams nearby enemies for <em>${pcn(S.ratio * 100)}</em> Attack and reduces their Attack Speed. Razzle & Dazzle gain Damage Reduction against the retaliation. Tragedy strengthens the protection; Comedy adds <em>${pcn(S.comedy * 100)}</em> Attack Damage.`,
      ai: { prio: 50, cond: (u, B) => B.enemiesOf(u).some(e => B.distance(e, u) <= 250) },
      cast: (u, B, S, P) => {
        const start = u.rndState, both = rndUseBoth(u, B) || u.rndDual;
        if (!u.rndDual && !both && !rndSetState(u, B, 'tragedy')) rndAddPerformance(u, B, 'tragedy');
        B.anim(u, 'cast', .46); Sound.play('quake', { vol: .48 }); B.fxCrackAt(u.x, u.y);
        B.after(.24, () => {
          B.enemiesOf(u).filter(e => B.distance(e, u) <= 250).forEach(e => {
            B.damage(u, e, u.st.atk * (S.ratio + ((start === 'comedy' || both) ? S.comedy : 0)), { type: 'physical', area: true, tag: 'Curtain Call' });
            B.applyStatus(u, e, 'slow', P.slow, { stacks: 2 }); B.applyStatus(u, e, 'weaken', P.guard);
          });
          B.applyStatus(u, u, 'ward', P.guard + ((start === 'tragedy' || both) ? 3 : 0)); B.shake(10, .3);
        });
      }
    },
    P: {
      name: 'Two Sides', type: 'Attack / Armor',
      v: { atk: .035, speed: .025, armor: .045, heal: .04 }, p: { max: 4 },
      desc: (S, P) => `Switching sides — or taking the same side again with its matching skill — gains 🎭 Performance, up to ${P.max}. Comedy stacks grant <em>${pcn(S.atk * 100)}</em> Attack and <em>${pcn(S.speed * 100)}</em> Attack Speed; Tragedy stacks grant <em>${pcn(S.armor * 100)}</em> Armor/Magic Defense and <em>${pcn(S.heal * 100)}</em> healing received. At maximum, the next skill activates both versions.`,
      passive: (u, B, S, P) => {
        u.rndPerfMax = P.max; u.rndPerfAtk = S.atk; u.rndPerfSpeed = S.speed; u.rndPerfArmor = S.armor; u.rndPerfHeal = S.heal;
        rndResetPerformance(u, B);
      }
    },
    R: {
      name: 'One More Act', type: 'Physical Damage / Max HP / Armor',
      v: { heal: .025, shield: .045, comedy: .22 }, p: { trigger: .35, dur: 9 },
      desc: (S, P) => `Once per battle below ${pc(P.trigger)} HP, both perform for ${P.dur}s and cannot be forced to switch. Basics alternate: Comedy deals <em>${pcn(S.comedy * 100)}</em> more Physical Damage and builds speed; Tragedy heals <em>${pcn(S.heal * 100)}</em> Max HP and grants a <em>${pcn(S.shield * 100)}</em> Shield. Afterward all Performance is lost and normal rotation resumes.`,
      passive: (u, B, S, P) => {
        B.every(u, .15, () => { if (!u.rndFinalUsed && u.hpPct <= P.trigger) rndStartFinalAct(u, B, S, P); });
        B.on(u, 'dealDamage', ev => { if (u.rndDual && ev.basic && u.rndLastBasicState === 'comedy') ev.amount *= 1 + S.comedy; });
        B.on(u, 'basicHit', () => { if (u.rndDual && u.rndLastBasicState === 'tragedy') {
          B.heal(u, u, u.max.hp * S.heal, { silent: true, tag: 'One More Act' }); B.shield(u, u, u.max.hp * S.shield, 3.5); } });
      }
    }
  }
});
