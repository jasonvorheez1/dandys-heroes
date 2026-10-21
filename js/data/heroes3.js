/* heroes3.js - Dyle, Gigi, Squirm, Eggson, Flyte.
   Same contract as heroes.js/heroes2.js. Dyle and Gigi were previously
   enemy-only placeholders in twisted.js written before their real Skillset.txt
   files were available; these are full rewrites to match those files. Their
   Twisted forms (enemies/Twisteds/Dyle.png, Gigi.png) are untouched - makeTwisted()
   only needs HEROES[id] to exist, so nothing there had to change. */
'use strict';

/* ============================================================ DYLE
   DPS - SS Tier. Rail Markers and a train that runs the field on schedule. */
defHero({
  id: 'Dyle', name: 'Dyle', folder: 'Dyle', file: 'Dyle', icon: 'Dyle',
  role: 'Damage', tier: 'SS', element: 'Rail',
  blurb: 'Runs on a schedule nobody asked for and does not tolerate delays, least of all his own.',
  base: { hp: 4250, atk: 500, def: 242, mag: 172, mdef: 210, spd: 132, acc: 214, eva: 152 },
  hidden: { range: 195, aspd: 1.14, ms: 90, aggro: .85, crit: .20, critDmg: 1.75, healPow: 1, shieldPow: 1,
    cdr: .08, ccRes: .15, kbRes: .3, armorPen: .16, magPen: 0 },
  growth: { hp: .080, atk: .108, def: .076, mag: .058, mdef: .070 },
  move: { gait: 'march', bob: 4, freq: 2.0, lean: 10, squash: .05, idle: 'tap', step: 'step_metal',
    particles: 'dust', pcol: '#9fb0c2', trail: { on: true, col: '#c9d4e0', rate: .07 }, brake: .5, dashy: true },
  basic: { name: 'Punch The tape', type: 'physical', ratio: .64, range: 195, sfx: 'swing_pole', hit: 'hit_slash',
    wind: .10, hits: 2, note: 'Two crisp, efficient strikes. Never one more than necessary.',
    onHit: (u, t, B, i) => { if (i === 1 && chance(.55)) B.markRail(u, t); } },
  skills: {
    W: {
      name: 'All Aboard', type: 'Physical Damage', energy: 100,
      v: { ratio: 1.72, bonus: .55 }, p: { spread: 4, kb: 110 },
      desc: (S, P) => `<span class="sk-pas">Dyle's Basic Attacks can leave a 🚂 Rail Marker on a target - only one enemy carries it at a time. Attacks against the Rail Marker deal <em>${pcn(S.bonus * 100)}</em> bonus damage. After ${P.spread} hits on it, the marker spreads to a nearby enemy too.</span>
        Active: Dyle signals the train, which rockets across the battlefield for <em>${pcn(S.ratio * 100)}</em> Attack to everyone it passes, knocking them aside.`,
      passive: (u, B) => {
        u.railHits = 0;
        B.on(u, 'dealDamage', ev => {
          if (ev.dot || !ev.target.hasStatus('railmarker')) return;
          ev.amount *= 1 + (B.scaled(u, 'W').bonus || .45);
          u.railHits++;
          if (u.railHits >= 4) {
            u.railHits = 0;
            const near = B.enemiesOf(u).filter(e => e !== ev.target && B.distance(e, ev.target) < 220);
            if (near.length) { B.markRail(u, pick(near)); B.fxFloatIcon(ev.target.x, ev.target.y - 90, '🚃'); }
          }
        });
      },
      cast: (u, B, S, P) => {
        B.anim(u, 'wind', .55); Sound.play('warn'); Sound.play('steam', { delay: 120, vol: .65 });
        const dir = u.face > 0 ? 1 : -1;
        if (u.railRoute) {
          const route = HEROES.Dyle.skills.R.p;
          u._railRouteUntil = B.t + route.dur;
          u._railRouteDepth = u.depth == null ? .5 : u.depth;
          u._railRouteHitAt = new Map();
          B.fxRing(u.x, u.y - 38, 250, '#c9d4e0', .32);
        }
        B.after(.42, () => {
          B.fxTrainPass(u, dir, .95); Sound.play('hit_heavy'); B.shake(10, .3);
          const span = B.rightWall - B.leftWall;
          B.enemiesOf(u).forEach(e => {
            const p = clamp((e.x - B.leftWall) / span, 0, 1);
            B.after(.04 + (dir > 0 ? p : 1 - p) * .38, () => {
              if (!e.alive) return;
              Sound.play('hit_slash', { vol: .6, throttle: 12 });
              B.fxBoom(e.x, e.y - 54, .7, '#c9d4e0'); B.fxStatusOn(e, 'ShockEffect', { sizeMul: .9 });
              B.damage(u, e, u.st.atk * S.ratio, { type: 'physical', tag: 'All Aboard' });
              B.knockback(u, e, P.kb);
            });
          });
        });
      }
    },
    G: {
      name: 'Mind the Gap', type: 'Physical Damage', cd: 8,
      v: { ratio: 1.25 }, p: { dur: 6, marker: 1.35 },
      desc: (S, P) => `Dyle checks his watch, repositions, and strikes the highest-Attack enemy for <em>${pcn(S.ratio * 100)}</em> Attack, interrupting them. He gains Attack Speed and Move Speed for ${P.dur}s - while it lasts, his Basic Attacks against 🚂 Rail Marker targets hit even harder.`,
      ai: { prio: 56, cond: () => true },
      cast: (u, B, S, P) => {
        const t = B.highestStat(B.enemiesOf(u), 'atk'); if (!t) return;
        B.anim(u, 'cast', .2); Sound.play('dash');
        B.blink(u, t.x - u.face * 50, t.depth);
        Sound.play('hit_slash'); B.hitstop(60); B.shake(6, .2);
        B.fxSlash(u, t, { col: '#c9d4e0', ang: -20 });
        B.interrupt(t);
        B.damage(u, t, u.st.atk * S.ratio, { type: 'physical', tag: 'Mind the Gap' });
        B.applyStatus(u, u, 'speedup', P.dur, { stacks: 2 });
        u._gapUntil = B.t + P.dur;
      },
      passive: (u, B) => {
        B.on(u, 'dealDamage', ev => { if (B.t < (u._gapUntil || 0) && ev.target.hasStatus('railmarker')) ev.amount *= P.marker; });
      }
    },
    B: {
      name: 'Express Service', type: 'Physical Damage', cd: 16,
      v: { ratio: .78, ret: .95, third: .62 }, p: { dur: 5, gap: .38, thirdGap: .42 },
      desc: (S, P) => `A train sweeps across the field for <em>${pcn(S.ratio * 100)}</em> Attack, then returns along the same route after a moment for <em>${pcn(S.ret * 100)}</em> Attack. Anyone hit both times is ⏳ Delayed for ${P.dur}s. If both passes connect, a third express pass follows. 🚂 Rail Marker targets take extra on the return trip.`,
      ai: { prio: 48, cond: (u, B) => B.enemiesOf(u).length >= 2 },
      cast: (u, B, S, P) => {
        B.anim(u, 'cast', .42); Sound.play('warn'); Sound.play('steam', { delay: 100, vol: .5 });
        const first = new Set(), connected = new Set();
        const sweep = (ratio, dir, onHit, returnPass, only) => {
          B.fxTrainPass(u, dir, .78);
          const span = B.rightWall - B.leftWall;
          (only || B.enemiesOf(u)).forEach(e => {
            if (onHit(e)) return;
            const p = clamp((e.x - B.leftWall) / span, 0, 1);
            B.after(.03 + (dir > 0 ? p : 1 - p) * .3, () => {
              if (!e.alive) return;
              Sound.play('hit_slash', { vol: .5, throttle: 14 });
              const bonus = e.hasStatus('railmarker') && returnPass ? 1.5 : 1;
              B.fxBoom(e.x, e.y - 52, .5, '#c9d4e0');
              if (returnPass && first.has(e)) {
                connected.add(e);
                B.applyStatus(u, e, 'delayed', P.dur, { stacks: 1 });
                B.fxStatusOn(e, 'SlowEffect', { sizeMul: .86 });
              }
              B.damage(u, e, u.st.atk * ratio * bonus, { type: 'physical', tag: 'Express Service' });
            });
          });
        };
        const dir = u.face > 0 ? 1 : -1;
        sweep(S.ratio, dir, e => { if (first.has(e)) return true; first.add(e); return false; }, false);
        B.after(P.gap, () => {
          Sound.play('warn', { vol: .5 });
          sweep(S.ret, -dir, () => false, true);
          B.after(P.thirdGap, () => {
            if (u.alive && connected.size) sweep(S.third, dir, () => false, false, [...connected]);
          });
        });
      }
    },
    P: {
      name: 'Strict Schedule', type: 'Passive',
      v: { bonus: .42, en: 15 }, p: { need: 3, max: 2 },
      desc: (S, P) => `Whenever Dyle damages an enemy within a beat of them casting a skill, he deals <em>${pcn(S.bonus * 100)}</em> bonus damage and restores <em>${Math.round(S.en)}</em> Energy. After ${P.need} successful timings he gains permanent Attack Speed and cooldown recovery for the rest of the battle, up to ${P.max} times.`,
      passive: (u, B, S, P) => {
        u.onTimeCount = 0; u.onTimeStacks = 0;
        B.on(u, 'enemyCast', e => { e._justCast = B.t; });
        B.on(u, 'dealDamage', ev => {
          if (ev.dot || !ev.target._justCast || B.t - ev.target._justCast > 1.4) return;
          ev.target._justCast = 0;
          ev.amount *= 1 + S.bonus; B.energy(u, S.en);
          u.onTimeCount++;
          if (u.onTimeCount >= P.need && u.onTimeStacks < P.max) {
            u.onTimeCount = 0; u.onTimeStacks++;
            u.flat.aspdP2 = u.onTimeStacks * .08; u.flat.cdr2 = u.onTimeStacks * .08; u.dirty = true;
            B.fxFloatIcon(u.x, u.y - 100, '⏱'); Sound.play('get_item');
          }
        });
      }
    },
    R: {
      name: 'Last Train', type: 'Battle Opener',
      v: { ratio: .30, kill: .22 }, p: { dur: 7, thr: .36 },
      desc: (S, P) => `All Aboard now leaves a Rail Route on the ground for ${P.dur}s, damaging and slowing anyone who crosses it. Express Service gains a third pass if both earlier passes connected. Defeating an enemy grants Energy and <em>${pcn(S.kill * 100)}</em> Attack for a few seconds. If Dyle drops below ${pc(P.thr)} HP, All Aboard fires immediately for free - once per battle.`,
      passive: (u, B, S, P) => {
        u.railRoute = true;
        u._railRouteUntil = 0;
        u._railRouteDepth = u.depth == null ? .5 : u.depth;
        u._railRouteHitAt = new Map();
        B.every(u, .25, () => {
          if (B.t > (u._railRouteUntil || 0)) return;
          const lane = u._railRouteDepth == null ? u.depth : u._railRouteDepth;
          B.enemiesOf(u).forEach(e => {
            if (Math.abs((e.depth == null ? .5 : e.depth) - lane) > .20) return;
            const last = u._railRouteHitAt.get(e) || -99;
            if (B.t - last < .65) return;
            u._railRouteHitAt.set(e, B.t);
            B.damage(u, e, u.st.atk * S.ratio * .72, { type: 'physical', area: true, tag: 'Rail Route' });
            B.applyStatus(u, e, 'slow', .9, { stacks: 1 });
            B.fxRing(e.x, e.y - 38, 58, '#c9d4e0', .18);
          });
        });
        B.on(u, 'enemyDown', () => {
          B.energy(u, 20); B.applyStatus(u, u, 'atkup', 6, { stacks: 2 });
        });
        B.on(u, 'damaged', () => {
          if (u._lastTrain || u.hpPct > P.thr || !u.alive) return;
          u._lastTrain = true;
          Sound.play('suddendeath'); B.log('<b>Last Train.</b>');
          HEROES.Dyle.skills.W.cast(u, B, B.scaled(u, 'W'), HEROES.Dyle.skills.W.p);
        });
      }
    }
  }
});

/* ============================================================ GIGI
   Fortune support - the wheel is random, but every spin moves her toward a jackpot. */
const GIGI_WHEEL = [
  { id: 'heart', name: 'Heart', icon: '♥', color: '#ff719d' },
  { id: 'shield', name: 'Shield', icon: '◆', color: '#61d8dc' },
  { id: 'tempo', name: 'Tempo', icon: '➤', color: '#ffd166' },
  { id: 'energy', name: 'Energy', icon: '⚡', color: '#9d8bff' },
  { id: 'power', name: 'Power', icon: '★', color: '#ff9d58' },
  { id: 'jinx', name: 'Jinx', icon: '☁', color: '#a5aac4' },
  { id: 'double', name: 'Double', icon: '×2', color: '#73c889' },
  { id: 'jackpot', name: 'JACKPOT', icon: '✦', color: '#fff0a0' }
];

defHero({
  id: 'Gigi', name: 'Gigi', folder: 'Gigi', file: 'Gigi', icon: 'Gigi',
  role: 'Support', tier: 'SS', element: 'Fortune',
  blurb: 'Every spin is a surprise. Gigi just happens to know how to make the odds bend her way.',
  base: { hp: 3650, atk: 178, def: 208, mag: 322, mdef: 278, spd: 108, acc: 176, eva: 126 },
  hidden: { range: 260, aspd: .90, ms: 68, aggro: .60, crit: .06, critDmg: 1.45, healPow: 1.30, shieldPow: 1.20,
    cdr: .12, ccRes: .15, kbRes: .25, armorPen: 0, magPen: .06 },
  growth: { hp: .086, atk: .066, def: .080, mag: .096, mdef: .088 },
  move: { gait: 'bounce', bob: 11, freq: 2.1, lean: 5, squash: .09, idle: 'shake', step: 'bounce',
    particles: 'confetti', pcol: '#ffb0e0', trail: { on: false }, brake: .3 },
  basic: { name: 'Lucky Toss', type: 'magic', ratio: .92, range: 260, proj: 'orb', pcol: '#ffb0e0',
    sfx: 'whoosh', hit: 'hit_light', wind: .2, note: 'A little nudge to the odds.' },
  skills: {
    W: {
      name: 'Lucky Spin', type: 'Support', energy: 100,
      v: { mult: 1 }, p: { every: 5, max: 3 },
      desc: (S, P) => `<span class="sk-pas">Gigi gains a Wheel tape every ${P.every}s (up to ${P.max}, or 4 with Hot Streak); her Basic Attacks can find extra tapes. Each spin grants a prize. When an enemy’s haunting or possession reaches an ally, Gigi clears it and grants a brief Ward; this can trigger every 5s. After two misses, the next spin is a Jackpot.</span>
        Active: spends all tapes, spinning once per tape. Repeated prizes combo for a stronger effect.`,
      passive: (u, B, S, P) => {
        u.gigiTickets = 0; u.gigiMax = P.max; u.gigiMisses = 0; u.gigiLastPrize = null; u.gigiCombo = 0; u.gigiSeen = new Set(); u._gigiTicketAt = -99; u._gigiBonustapeAt = -99;
        B.every(u, P.every, () => B.gigiTicket(u));
        B.on(u, 'basicHit', () => { if (B.t - u._gigiTicketAt >= 2.5) { u._gigiTicketAt = B.t; B.gigiTicket(u); } });
        B.on(u, 'statusApplied', ev => {
          if (!ev || !ev.unit || ev.unit.team !== u.team || ev.src?.team === u.team || B.t < (u._gigiHauntGuardAt || 0)) return;
          if (!['haunted', 'qom_haunted', 'cookie_deceived', 'cookie_stringbound', 'qom_possessed'].includes(ev.id)) return;
          u._gigiHauntGuardAt = B.t + 5;
          B.removeStatus(ev.unit, ev.id);
          B.applyStatus(u, ev.unit, 'ward', 2.5);
          B.energy(ev.unit, 8);
          B.fxFloatIcon(ev.unit.x, ev.unit.y - 88, '🍀', '#ffb0e0');
        });
      },
      cast: (u, B, S) => { B.gigiSpin(u, S.mult); }
    },
    G: {
      name: 'Loaded Coin', type: 'Magic Damage', cd: 8,
      v: { ratio: 1.15 }, p: { dur: 6 },
      desc: (S, P) => `Gigi flips a loaded coin at the highest-Attack enemy for <em>${pcn(S.ratio * 100)}%</em> Magic Damage and Jinxes them, reducing Attack and Accuracy for ${P.dur}s. If they are already Jinxed, Gigi gains a Wheel tape.`,
      ai: { prio: 55, cond: () => true },
      cast: (u, B, S) => {
        const t = B.highestStat(B.enemiesOf(u), 'atk'); if (!t) return;
        B.anim(u, 'cast', .62, 'gigiLoaded'); Sound.play('gigi_ability', { vol: .30, throttle: 700 });
        B.fxProj(u, t, { kind: 'orb', col: '#ffd166' }, () => {
          B.damage(u, t, u.st.mag * S.ratio, { type: 'magic', tag: 'Loaded Coin' });
          const wasJinxed = t.hasStatus('weaken'); B.applyStatus(u, t, 'weaken', P.dur, { stacks: 2 }); B.applyStatus(u, t, 'blind', P.dur);
          if (wasJinxed) B.gigiTicket(u);
        });
      }
    },
    B: {
      name: 'House Advantage', type: 'Support', cd: 15,
      v: { mult: 1.5 }, p: { dur: 8 },
      desc: (S, P) => `Gigi calls her shot: the next spin is guaranteed to land on a prize she has not hit in this battle. The whole team gains Lucky and Haste for ${P.dur}s; her next prize is boosted to <em>${pcn(S.mult * 100)}</em> strength.`,
      ai: { prio: 45, cond: () => true },
      cast: (u, B, S, P) => {
        u.gigiHouseCall = true; u.gigiBoostNext = S.mult;
        B.anim(u, 'cast', .82, 'gigiWheel'); Sound.play('gigi_ability', { vol: .38, priority: true });
        const allies = B.alliesOf(u); allies.forEach(a => { B.applyStatus(u, a, 'lucky', P.dur); B.applyStatus(u, a, 'haste', P.dur); });
        B.fxConfetti(u.x, u.y - 60, 18); B.gigiTicket(u);
      }
    },
    P: {
      name: 'Hot Streak', type: 'Passive',
      v: { chance: .25 }, p: { max: 4 },
      desc: (S, P) => `Wheel Tickets store up to ${P.max}. Basic Attacks have a <em>${pcn(S.chance * 100)}</em> chance to find an extra tape. A repeated prize doubles its effect; Jackpot resets the pity counter and empowers the whole team.`,
      passive: (u, B, S, P) => {
        u.gigiMax = P.max; u.gigiBigChance = S.chance;
        u.gigiSeen = new Set(); u.gigiHouseCall = false; u.gigiBoostNext = 1;
        B.on(u, 'basicHit', () => { if (chance(S.chance) && B.t - u._gigiBonustapeAt > 1.8) { u._gigiBonustapeAt = B.t; B.gigiTicket(u); } });
      }
    },
    R: {
      name: 'The House Always Wins', type: 'Battle Opener',
      v: { bonus: .12, shield: .12, en: 20 }, p: { need: 3 },
      desc: (S, P) => `Gigi starts with ${P.need} Wheel Tickets, and the wheel has a larger Jackpot slice. Every unique prize adds a permanent Fortune stack. Jackpots grant all allies a Casino Shield worth <em>${pcn(S.shield * 100)}</em> Max HP, ${Math.round(S.en)} Energy, a teamwide heal, and Attack boost!`,
      passive: (u, B, S, P) => {
        u.gigiSeen = new Set(); u.gigiFortune = 0; u.gigiWheelBonus = S.bonus;
        B.after(.3, () => { for (let i = 0; i < P.need; i++) B.gigiTicket(u); });
        B.on(u, 'gigiPrize', prize => {
          if (prize.id === 'jackpot') {
            B.alliesOf(u).forEach(a => {
              B.shield(u, a, u.max.hp * S.shield, 6);
              B.energy(a, S.en);
            });
            return;
          }
          if (!u.gigiSeen.has(prize.id)) {
            u.gigiSeen.add(prize.id);
            u.gigiFortune++;
            B.applyStatus(u, u, 'atkup', 999, { stacks: 1 });
            B.applyStatus(u, u, 'magup', 999, { stacks: 1 });
          }
        });
      }
    }
  }
});

/* ============================================================ SQUIRM
   Tank / DPS - A Tier. Survives by eating books at the worst possible times. */
defHero({
  id: 'Squirm', name: 'Squirm', folder: 'Squirm', file: 'Squirm', icon: 'Squirm',
  role: 'Tank', tier: 'A', element: 'Paper',
  blurb: 'Constantly one inconvenience away from falling apart, and somehow harder to finish off the more pressure you put on him.',
  base: { hp: 5850, atk: 240, def: 335, mag: 168, mdef: 268, spd: 90, acc: 168, eva: 88 },
  hidden: { range: 175, aspd: .84, ms: 58, aggro: 1.75, crit: .05, critDmg: 1.5, healPow: 1.15, shieldPow: 1.35,
    cdr: .04, ccRes: .18, kbRes: .55, armorPen: .06, magPen: 0 },
  growth: { hp: .114, atk: .074, def: .100, mag: .058, mdef: .088 },
  move: { gait: 'skitter', bob: 6, freq: 3.4, lean: 8, squash: .08, idle: 'jitter', step: 'step_soft',
    particles: 'paint', pcol: '#e8d4a0', trail: { on: false }, brake: .6, jitter: 2.4 },
  basic: { name: 'Panicked Nibble', type: 'physical', ratio: 1.0, range: 175, sfx: 'swing_light', hit: 'hit_light', animStyle: 'squirmNibble',
    wind: .12, note: 'Bites first, worries about it after.' },
  skills: {
    W: {
      name: 'Distressed Delicacy', type: 'Defense', energy: 100,
      v: { heal: .12, hp: .30, jolt: 1.6 }, p: { thr: .60, dur: 3.5, icd: 6 },
      desc: (S, P) => `<span class="sk-pas">Below ${pc(P.thr)} HP, getting hit has a chance to make Squirm eat a book, healing <em>${pcn(S.heal * 100)}</em> Max HP (short cooldown).</span>
        Active: Squirm frantically eats for ${P.dur}s, gaining <em>${pcn(S.hp * 100)}</em> Max HP and heavy Damage Reduction. He cannot Basic Attack but cannot be interrupted. When it ends he releases the book in a nervous jolt - the lower his HP was when he started, the harder it hits.`,
      passive: (u, B, S, P) => {
        B.on(u, 'damaged', () => {
          if (u.hpPct > P.thr || !u.alive) return;
          if (u._eatCd && B.t - u._eatCd < P.icd) return;
          if (!chance(.35)) return;
          u._eatCd = B.t; Sound.play('squirm_book_chomp', { vol: .48 });
          B.heal(u, u, u.max.hp * S.heal, { tag: 'book' }); B.fxSquirmSkill('eat', u, { dur: .8 });
        });
      },
      cast: (u, B, S, P) => {
        const startPct = u.hpPct;
        B.anim(u, 'cast', .88, 'squirmEat'); Sound.play('squirm_book_chomp', { vol: .62 }); B.fxSquirmSkill('eat', u, { dur: P.dur });
        u.flat.hpP2 = S.hp; B.applyStatus(u, u, 'ward', P.dur);
        B.applyStatus(u, u, 'disarm', P.dur); u.dirty = true;
        B.after(P.dur, () => {
          if (!u.alive) return;
          u.flat.hpP2 = 0; u.dirty = true;
          B.anim(u, 'cast', .52, 'squirmJolt'); Sound.play('squirm_panic_flail', { vol: .62 }); B.shake(10, .3); B.fxSquirmSkill('jolt', u);
          const mult = 1 + (1 - startPct) * 2;
          B.aoe(u, u.x, 210, u.team, u.st.atk * S.jolt * mult, { type: 'physical', tag: 'Distressed Delicacy' });
        });
      }
    },
    G: {
      name: "Please Don't Hurt Me", type: 'Shield', cd: 11,
      v: { shield: .28, heal: .06 }, p: { dur: 6, slow: 3 },
      desc: (S, P) => `Squirm curls up, gaining a Shield worth <em>${pcn(S.shield * 100)}</em> of his Max HP and healing <em>${pcn(S.heal * 100)}</em> Max HP per second for ${P.dur}s. While the Shield holds, attackers are 🐢 Slowed and deal less damage to him. If the Shield breaks, he gains a burst of Armor and Magic Defense.`,
      ai: { prio: 56, cond: (u) => u.hpPct < .85 },
      cast: (u, B, S, P) => {
        B.anim(u, 'cast', .62, 'squirmCurl'); Sound.play('squirm_curl_shield', { vol: .56 }); B.fxSquirmSkill('curl', u);
        B.shield(u, u, u.max.hp * S.shield, P.dur, {
          onBreak: () => { B.applyStatus(u, u, 'fortify', 6, { stacks: 3 }); Sound.play('icebreak'); B.fxSquirmSkill('break', u); }
        });
        B.applyStatus(u, u, 'regen', P.dur, { val: u.max.hp * S.heal });
        u._curledUntil = B.t + P.dur;
        B.on(u, 'damaged', ev => {
          if (B.t >= (u._curledUntil || 0) || !ev.src) return;
          B.applyStatus(u, ev.src, 'slow', P.slow);
          B.applyStatus(u, ev.src, 'weaken', P.slow, { stacks: 1 });
        });
      }
    },
    B: {
      name: 'Nervous Flailing', type: 'Physical Damage', cd: 13,
      v: { ratio: .38, heal: .05 }, p: { hits: 5, radius: 190, max: 4 },
      desc: (S, P) => `Squirm flails ${P.hits} times at everything nearby for <em>${pcn(S.ratio * 100)}</em> Attack each, interrupting them. Every distinct enemy struck grants Damage Reduction (up to ${P.max} stacks). Below half HP, the final strike heals him based on how many enemies were hit.`,
      ai: { prio: 50, cond: (u, B) => B.enemiesOf(u).some(e => B.distance(e, u) < 190) },
      cast: (u, B, S, P) => {
        // Give the roll enough runway to read as a deliberate panic tumble.
        // The hit loop stays compact, while the final part of the animation
        // is reserved for Squirm's awkward landing.
        B.anim(u, 'attack', .86, 'squirmFlailRoll'); Sound.play('squirm_panic_flail', { vol: .62 }); B.fxSquirmSkill('flail', u);
        const struck = new Set();
        B.repeat(P.hits, .11, i => {
          B.enemiesOf(u).forEach(e => {
            if (B.distance(e, u) > P.radius) return;
            Sound.play('hit_light', { vol: .45, throttle: 10 });
            B.damage(u, e, u.st.atk * S.ratio, { type: 'physical', tag: 'Nervous Flailing' });
            B.interrupt(e); struck.add(e);
          });
          B.shake(3, .1);
          if (i === P.hits - 1) {
            B.applyStatus(u, u, 'fortify', 8, { stacks: Math.min(P.max, struck.size) });
            if (u.hpPct < .5 && struck.size) B.heal(u, u, u.max.hp * S.heal * struck.size, { tag: 'Nervous Flailing' });
          }
        });
      }
    },
    P: {
      name: 'Bookworm', type: 'Passive',
      v: { hp: .012, cc: .05 }, p: { max: 15 },
      desc: (S, P) => `Whenever Squirm heals himself through one of his own skills, he permanently gains <em>${pcn(S.hp * 100)}</em> Max HP for the rest of the battle, up to ${P.max} times. While under any Crowd Control, he gains Armor and Magic Defense that grows the longer it lasts.`,
      passive: (u, B, S, P) => {
        u.bookStacks = 0;
        B.on(u, 'healDone', ev => {
          if (ev.target !== u || u.bookStacks >= P.max) return;
          u.bookStacks++; u.flat.hpP3 = u.bookStacks * S.hp; u.dirty = true;
        });
        B.every(u, .5, () => {
          const cc = u.statuses.find(s => STATUS[s.id].cc);
          if (cc) { u._ccStart = u._ccStart || B.t; const t = clamp((B.t - u._ccStart) * S.cc, 0, .35);
            u.flat.defP2 = t; u.flat.mdefP2 = t; u.dirty = true; }
          else if (u._ccStart) { u._ccStart = 0; u.flat.defP2 = 0; u.flat.mdefP2 = 0; u.dirty = true; }
        });
      }
    },
    R: {
      name: 'What Could Go Wrong?', type: 'Survival',
      v: { heal: .20, revive: .25 }, p: { thresholds: [.5, .25] },
      desc: (S, P) => `Whenever Squirm crosses ${P.thresholds.map(t => pc(t)).join(' or ')} HP he immediately heals <em>${pcn(S.heal * 100)}</em> Max HP and gains Damage Reduction - each threshold once. If he would be defeated, he instead eats a book and survives at <em>${pc(S.revive)}</em> HP, once per battle, immediately refreshing Distressed Delicacy and gaining permanent Armor and Magic Defense.`,
      passive: (u, B, S, P) => {
        u._thresholds = P.thresholds.slice();
        B.on(u, 'damaged', () => {
          if (!u._thresholds.length || !u.alive) return;
          if (u.hpPct > u._thresholds[0]) return;
          u._thresholds.shift();
          Sound.play('squirm_book_chomp', { vol: .5 }); B.heal(u, u, u.max.hp * S.heal, { tag: 'What Could Go Wrong?' }); B.fxSquirmSkill('eat', u, { dur: .75 });
          B.applyStatus(u, u, 'ward', 5);
        });
        B.on(u, 'lethal', ev => {
          if (u._wcgwUsed) return;
          u._wcgwUsed = true; ev.prevented = true;
          u.hp = u.max.hp * S.revive;
          Sound.play('squirm_book_chomp', { vol: .7 }); B.anim(u, 'cast', .64, 'squirmJolt'); B.fxSquirmSkill('revive', u); B.shake(14, .5); B.flash('#e8d4a0', .4, .4);
          B.log('<b>Squirm was NOT ready for that.</b>');
          B.resetCd(u, 'W'); u.flat.defP4 = .25; u.flat.mdefP4 = .25; u.dirty = true;
        });
      }
    }
  }
});

function eggsonFindTarget(u, target, B, dur) {
  if (!u || !target || !target.alive) return false;
  target._eggsonFoundUntil = B.t + dur;
  B.applyStatus(u, target, 'found', dur);
  B.fxFloatIcon(target.x, target.y - 92, '🥚 FOUND', '#f6d58a');
  return true;
}

/* ============================================================ EGGSON
   Melee Damage - B Tier. A retired hard-boiled Egg Hunt toon who won Egg
   Hunts with patience, a cane, and absolutely no need to hurry. */
defHero({
  id: 'Eggson', name: 'Eggson', folder: 'Eggson', file: 'Eggson', icon: 'Eggson',
  role: 'Damage', roleLabel: 'Old-School Damage', tier: 'B', element: 'Antique',
  blurb: 'An elderly hard-boiled egg toon who won Egg Hunts with patience, a cane, and absolutely no need to hurry.',
  base: { hp: 3880, atk: 440, def: 245, mag: 132, mdef: 210, spd: 104, acc: 205, eva: 110 },
  hidden: { range: 200, aspd: 1.02, ms: 72, aggro: .86, crit: .16, critDmg: 1.65, healPow: 1, shieldPow: 1,
    cdr: .08, ccRes: .15, kbRes: .35, armorPen: .14, magPen: 0 },
  growth: { hp: .088, atk: .102, def: .078, mag: .050, mdef: .072 },
  move: { gait: 'trudge', bob: 3, freq: 1.2, lean: 4, squash: .04, idle: 'tap', step: 'step',
    particles: 'dust', pcol: '#c9a35a', trail: { on: false }, brake: .6, weight: 1.2 },
  basic: { name: 'Cane Tap', type: 'physical', ratio: 1.0, range: 200, sfx: 'swing_pole', hit: 'hit_blunt',
    wind: .18, note: 'A firm, well-practiced tap. He has been doing this longer than most toons have been alive.' },
  skills: {
    W: {
      name: 'Back in My Day', type: 'Physical Damage / Control', energy: 100,
      v: { ratio: 1.45, repeat: .75, shred: .25 }, p: { dur: 8, kb: 120, stun: 1.5, crack: .40 },
      desc: (S, P) => `Eggson hurls a heavy championship golden Easter egg, striking the nearest or highest-HP enemy for <em>${pcn(S.ratio * 100)}</em> Physical Damage, Stunning them for ${P.stun.toFixed(1)}s, and marking them 🥚 Found for ${P.dur}s. If they were already Found, the egg shatters into razor-sharp Eggshell Shrapnel: cracks ${Math.round(P.crack * 100)}% of shields on all nearby foes, deals an extra <em>${pcn(S.repeat * 100)}</em> Physical Damage, knocks them back ${P.kb}px, and shreds their Armor by <em>${pcn(S.shred * 100)}</em> for 6s.`,
      cast: (u, B, S, P) => {
        const foes = B.enemiesOf(u); if (!foes.length) return;
        const t = B.highestHp(foes) || B.nearest(u, foes); if (!t) return;
        const repeat = t.hasStatus('found');
        B.anim(u, 'wind', .58, 'eggsonCanePlant'); Sound.play('lock');
        B.fxProj(u, t, { kind: 'item', img: 'easteregg', col: '#f6d58a' }, () => {
          if (!t.alive) return;
          Sound.play('hit_heavy', { vol: .52 });
          B.damage(u, t, u.st.atk * S.ratio, { type: 'physical', tag: 'Back in My Day' });
          B.applyStatus(u, t, 'stun', P.stun);
          if (repeat) {
            Sound.play('glass_break', { vol: .55 });
            B.shake(8, .25);
            B.enemiesOf(u).forEach(foe => {
              if (!foe.alive || Math.abs(foe.x - t.x) > 220) return;
              if (foe.shield && foe.shield > 0) B.crackShield(foe, foe.shield * P.crack);
              B.damage(u, foe, u.st.atk * S.repeat, { type: 'physical', area: true, tag: 'Eggshell Shrapnel' });
              B.knockback(u, foe, P.kb);
              B.applyStatus(u, foe, 'defdown', 6, { val: S.shred });
              B.fxSparkle(foe.x, foe.y - 45, 8, '#f6d58a');
            });
            B.fxFloatIcon(t.x, t.y - 105, '🥚 SHRAPNEL!', '#f6d58a');
          }
          eggsonFindTarget(u, t, B, P.dur);
        });
      }
    },
    G: {
      name: 'Cane Sweep', type: 'Physical Damage / Control', cd: 10,
      v: { ratio: .95 }, p: { radius: 235, kb: 110, dur: 6, disarm: 3.5, stun: 1.6, energyPer: 15 },
      desc: (S, P) => `Eggson sweeps his antique cane around himself with veteran precision, dealing <em>${pcn(S.ratio * 100)}</em> Physical Damage to nearby enemies, knocking them back ${P.kb}px, Disarming them for ${P.disarm.toFixed(1)}s, and marking them 🥚 Found for ${P.dur}s. Enemies who were already Found are tripped and Stunned for ${P.stun.toFixed(1)}s. Eggson restores ${P.energyPer} Energy per enemy struck.`,
      ai: { prio: 58, cond: (u, B) => B.enemiesOf(u).some(e => B.distance(u, e) <= 245) },
      cast: (u, B, S, P) => {
        B.anim(u, 'cast', .62, 'eggsonStomp'); Sound.play('hit_blunt', { vol: .58 });
        B.fxCrackAt(u.x); B.fxRing(u.x, u.y - 34, P.radius * 1.35, '#c9a35a', .45);
        let hits = 0;
        B.enemiesOf(u).filter(e => B.distance(u, e) <= P.radius).forEach(e => {
          hits++;
          const wasFound = e.hasStatus('found');
          B.damage(u, e, u.st.atk * S.ratio, { type: 'physical', area: true, tag: 'Cane Sweep' });
          if (e.alive) {
            B.knockback(u, e, P.kb);
            B.applyStatus(u, e, 'disarm', P.disarm);
            if (wasFound) {
              B.applyStatus(u, e, 'stun', P.stun);
              B.fxFloatIcon(e.x, e.y - 95, '💫 TRIPPED!', '#c9a35a');
            }
            eggsonFindTarget(u, e, B, P.dur);
          }
        });
        if (hits > 0) B.energy(u, hits * P.energyPer);
      }
    },
    B: {
      name: 'Hard-Boiled', type: 'Physical Damage / Defense', cd: 12,
      v: { ratio: 1.35, bonusTrue: .55, shield: .16 }, p: { dur: 6, stacks: 2 },
      desc: (S, P) => `Eggson executes a punishing cane overhead bonk on the highest-Attack enemy for <em>${pcn(S.ratio * 100)}</em> Physical Damage. If the target is 🥚 Found, the blow bypasses their defenses for an additional <em>${pcn(S.bonusTrue * 100)}</em> True Damage. Eggson hardens his veteran shell, gaining ${P.stacks} stacks of 🧱 Fortify and an <em>${pcn(S.shield * 100)}</em> Max HP Shield for ${P.dur}s.`,
      ai: { prio: 52, cond: (u, B) => B.enemiesOf(u).length > 0 },
      cast: (u, B, S, P) => {
        const t = B.highestStat(B.enemiesOf(u), 'atk'); if (!t) return;
        B.anim(u, 'wind', .52, 'eggsonCanePlant'); Sound.play('guard', { vol: .46 });
        B.after(.18, () => {
          if (!t.alive) return;
          Sound.play('hit_heavy', { vol: .55 });
          B.damage(u, t, u.st.atk * S.ratio, { type: 'physical', tag: 'Hard-Boiled' });
          if (t.hasStatus('found')) {
            B.damage(u, t, u.st.atk * S.bonusTrue, { type: 'true', tag: 'Hard-Boiled True Crack' });
            B.fxSparkle(t.x, t.y - 45, 10, '#f6d58a');
          }
          B.applyStatus(u, u, 'fortify', P.dur, { stacks: P.stacks });
          B.shield(u, u, u.max.hp * S.shield, P.dur);
          B.fxFloatIcon(u.x, u.y - 94, '🥚 HARD-BOILED', '#f6d58a');
        });
      }
    },
    P: {
      name: 'Old Egg Hunt Tricks', type: 'Passive / Physical Damage',
      v: { ratio: .52, aspd: .30, lifesteal: .18 }, p: { hits: 3, dur: 8 },
      desc: (S, P) => `Every ${P.hits}rd Basic Attack becomes a 🥚 Lucky Find: it strikes with 100% Critical Hit Chance, deals an extra <em>${pcn(S.ratio * 100)}</em> Physical Damage, and marks the target 🥚 Found for ${P.dur}s. While attacking Found targets, Eggson's attacks cannot be Dodged, ignore Tenacity, and he gains <em>${pcn(S.aspd * 100)}</em> Attack Speed and <em>${pcn(S.lifesteal * 100)}</em> Lifesteal.`,
      passive: (u, B, S, P) => {
        u.eggsonBasicCount = 0;
        u.antiDodge = target => !!(target && (target.hasStatus('found') || B.t < (target._eggsonFoundUntil || 0)));
        B.on(u, 'basicHit', ev => {
          if (!ev || !ev.target || !ev.target.alive) return;
          u.eggsonBasicCount = (u.eggsonBasicCount || 0) + 1;
          if (u.eggsonBasicCount % P.hits) return;
          Sound.play('get_rare', { vol: .38 });
          B.damage(u, ev.target, u.st.atk * S.ratio, { type: 'physical', crit: true, tag: 'Lucky Find' });
          eggsonFindTarget(u, ev.target, B, P.dur);
          B.fxRing(ev.target.x, ev.target.y - 36, 82, '#f6d58a', .34);
        });
        B.on(u, 'dealDamage', ev => {
          if (!ev || !ev.target || ev.target.team === u.team || !ev.target.hasStatus('found')) return;
          if (ev.basic && S.lifesteal) {
            B.heal(u, u, ev.amount * S.lifesteal, { tag: 'Hunt Lifesteal' });
          }
        });
      }
    },
    R: {
      name: 'One Last Hunt', type: 'Passive / Physical Damage',
      v: { bonus: .28, trophyShield: .20 }, p: { dur: 8, energy: 35 },
      desc: (S, P) => `Eggson deals <em>${pcn(S.bonus * 100)}</em> more damage to 🥚 Found targets. When a Found enemy falls, Eggson's championship pride surges: restores ${P.energy} Energy, cleanses all debuffs, immediately resets the cooldown of Cane Sweep, grants Eggson and the lowest-HP ally a <em>${pcn(S.trophyShield * 100)}</em> Max HP Trophy Shield for 6s, and immediately tracks the highest-HP surviving enemy as the next 🥚 Found quarry for ${P.dur}s.`,
      passive: (u, B, S, P) => {
        B.on(u, 'dealDamage', ev => {
          if (!ev || ev.dot || !ev.target || ev.target.team === u.team || !ev.target.hasStatus('found')) return;
          ev.amount *= 1 + S.bonus;
        });
        B.on(u, 'enemyDown', e => {
          if (!e || !e.hasStatus('found')) return;
          Sound.play('cheer_big', { vol: .5 });
          B.energy(u, P.energy);
          B.cleanse(u, 99);
          B.resetCd(u, 'G');
          B.shield(u, u, u.max.hp * S.trophyShield, 6);
          const lowest = B.lowestHp(B.alliesOf(u));
          if (lowest && lowest !== u) B.shield(u, lowest, u.max.hp * S.trophyShield, 6);
          const next = B.highestHp(B.enemiesOf(u));
          if (!next) return;
          eggsonFindTarget(u, next, B, P.dur);
          B.fxFloatIcon(next.x, next.y - 96, '🥚 NEXT QUARRY', '#f6d58a');
        });
      }
    }
  }
});

/* ============================================================ FLYTE
   Support / Utility - S Tier. Turns movement itself into team-wide upside. */
defHero({
  id: 'Flyte', name: 'Flyte', folder: 'Flyte', file: 'Flyte', icon: 'Flyte',
  role: 'Support', tier: 'S', element: 'Wind',
  blurb: 'Never stays in one place long enough to be a target, and makes sure his team does not either.',
  base: { hp: 3620, atk: 175, def: 205, mag: 310, mdef: 268, spd: 140, acc: 185, eva: 170 },
  hidden: { range: 245, aspd: 1.02, ms: 115, aggro: .5, crit: .05, critDmg: 1.4, healPow: 1.15, shieldPow: 1.30,
    cdr: .14, ccRes: .15, kbRes: .25, armorPen: 0, magPen: .06 },
  growth: { hp: .084, atk: .065, def: .076, mag: .098, mdef: .088 },
  move: { gait: 'float', bob: 15, freq: 1.5, lean: 6, squash: .05, hover: 24, idle: 'drift', step: null,
    particles: 'sparkle', pcol: '#bfe0ff', trail: { on: true, col: '#bfe0ff', rate: .06 }, brake: .15, sway: 10 },
  basic: { name: 'Wing Buffet', type: 'magic', ratio: .88, range: 245, proj: 'orb', pcol: '#bfe0ff',
    sfx: 'whoosh', hit: 'hit_magic', wind: .18, note: 'A small gust with real force behind it.',
    onHit: (u, t, B) => { B.knockback(u, t, 16); } },
  skills: {
    W: {
      name: 'Guiding Gust', type: 'Buff', energy: 100,
      v: { ms: .20 }, p: { dur: 5.5, radius: 240 },
      desc: (S, P) => `<span class="sk-pas">Moving leaves a breeze behind Flyte; allies who cross it gain <em>${pcn(S.ms * 100)}</em> Move Speed briefly.</span>
        Active: creates a large Gust where the team is fighting. Allies inside gain Move Speed, Attack Speed, Cooldown Recovery, and 15% Damage Reduction for ${P.dur}s, and cannot be Slowed while it lasts. Flyte receives the same benefits.`,
      passive: (u, B, S) => {
        B.every(u, 1.0, () => { if (u.moving) B.alliesOf(u).forEach(a => { if (B.distance(a, u) < 100) B.applyStatus(u, a, 'speedup', 2.2); }); });
      },
      cast: (u, B, S, P) => {
        const allies = B.alliesOf(u); if (!allies.length) return;
        const cx = B.avgX(allies);
        const t = allies.reduce((a, b) => Math.abs(b.x - cx) > Math.abs(a.x - cx) ? b : a);
        B.anim(u, 'cast', .72, 'flyteGust'); Sound.play('tornado_s');
        B.fxFlyteGust(u, t, P.radius, P.dur);
        B.applyStatus(u, u, 'speedup', P.dur); B.applyStatus(u, u, 'haste', P.dur);
        if (u.hasStatus('slow')) B.removeStatus(u, 'slow');
        B.repeat(Math.round(P.dur * 2), .5, () => {
          B.alliesOf(u).forEach(a => {
            if (B.distance(a, t) < P.radius || a === u) {
              if (a.hasStatus('slow')) B.removeStatus(a, 'slow');
              B.applyStatus(u, a, 'speedup', 1.8);
              B.applyStatus(u, a, 'haste', 1.8);
              B.applyStatus(u, a, 'ward', 1.0);
            }
          });
        });
      }
    },
    G: {
      name: 'Stay Close', type: 'Shield', cd: 9,
      v: { shield: .34 }, p: { dur: 6, push: 65 },
      desc: (S, P) => `Rushes to the lowest-HP ally, granting a Shield worth <em>${pcn(S.shield * 100)}</em> of Flyte's Max HP plus Magic, and Move Speed. Nearby enemies are blown back clear of the ally. If the Shield breaks, the protected ally gains another burst of speed.`,
      ai: { prio: 58, cond: (u, B) => B.alliesOf(u).some(a => a.hpPct < .75) },
      cast: (u, B, S, P) => {
        const t = B.lowestHp(B.alliesOf(u)); if (!t) return;
        B.anim(u, 'cast', .54, 'flyteRescue'); Sound.play('dash'); B.fxFlyteRescue(u, t);
        B.blink(u, clamp(t.x - u.face * 40, B.leftWall + 20, B.rightWall - 20), t.depth);
        const shieldVal = u.max.hp * S.shield + u.st.mag * 0.4;
        B.shield(u, t, shieldVal, P.dur, { onBreak: () => B.applyStatus(u, t, 'speedup', 4) });
        B.applyStatus(u, t, 'speedup', P.dur);
        B.enemiesOf(u).forEach(e => {
          if (B.distance(e, t) < 160) {
            B.knockback(u, e, P.push);
            Sound.play('hit_light', { vol: .4, throttle: 10 });
          }
        });
        B.alliesOf(u).forEach(a => {
          if (a !== u && B.distance(a, t) < 130) {
            a.x = clamp(a.x + (u.face > 0 ? -18 : 18), B.leftWall + 20, B.rightWall - 20);
          }
        });
      }
    },
    B: {
      name: 'Clear the Way', type: 'Magic Damage', cd: 11,
      v: { ratio: .85 }, p: { kb: 80 },
      desc: (S, P) => `Sweeps across the battlefield, dealing <em>${pcn(S.ratio * 100)}</em> Magic Damage and pushing back every enemy in his path while passing through allies, granting them Move Speed and Cooldown Recovery.`,
      ai: { prio: 48, cond: (u, B) => B.enemiesOf(u).length >= 1 },
      cast: (u, B, S, P) => {
        B.anim(u, 'attack', .58, 'flyteClear'); Sound.play('dash');
        const targetDir = B.enemiesOf(u).length ? (B.avgX(B.enemiesOf(u)) >= u.x ? 1 : -1) : (u.face || 1);
        u.face = targetDir;
        const dest = targetDir > 0 ? B.rightWall - 40 : B.leftWall + 40;
        B.fxFlyteClearWay(u, dest, .38);
        const hitE = new Set(), hitA = new Set();
        B.dash(u, dest, .38, { onMove: () => {
          B.enemiesOf(u).forEach(e => {
            if (hitE.has(e) || Math.abs(e.x - u.x) > 65 || Math.abs(B.depthDelta(e, u)) > 115) return;
            hitE.add(e);
            Sound.play('hit_light', { vol: .5, throttle: 12 });
            B.damage(u, e, u.st.mag * S.ratio, { type: 'magic', tag: 'Clear the Way' }); B.knockback(u, e, P.kb);
            B.fxFlytePass(e, false);
          });
          B.alliesOf(u).forEach(a => {
            if (hitA.has(a) || a === u || Math.abs(a.x - u.x) > 65 || Math.abs(B.depthDelta(a, u)) > 115) return;
            hitA.add(a);
            B.applyStatus(u, a, 'speedup', 3.5); B.applyStatus(u, a, 'haste', 3.5); B.fxFlytePass(a, true);
          });
        } });
      }
    },
    P: {
      name: 'Watch Your Step', type: 'Passive',
      v: { eva: .15 }, p: { en: 28 },
      desc: (S, P) => `Allies currently under a Flyte buff gain <em>${pcn(S.eva * 100)}</em> Evasion and CC Resistance. If a removable debuff reaches a buffed ally, Flyte clears it and refreshes their Move Speed (4s cooldown per ally). Crowd Control landing on allies also restores ${P.en} Energy to Flyte.`,
      passive: (u, B, S, P) => {
        B.every(u, .5, () => B.alliesOf(u).forEach(a => {
          const buffed = a.hasStatus('speedup') || a.hasStatus('haste') || a.hasStatus('flightpath');
          a.flat.evaP4 = buffed ? S.eva : 0; a.flat.ccRes2 = buffed ? S.eva : 0; a.dirty = true;
        }));
        B.on(u, 'allyDamaged', ev => {
          const a = ev.unit;
          if (!a || !a.statuses.some(s => STATUS[s.id].cc)) return;
          if (a._flyteSave && B.t - a._flyteSave < 6) return;
          const buffed = a.hasStatus('speedup') || a.hasStatus('haste') || a.hasStatus('flightpath');
          if (!buffed) return;
          a._flyteSave = B.t; B.applyStatus(u, a, 'speedup', 2.5); B.energy(u, P.en);
        });
        B.on(u, 'statusApplied', ev => {
          const a = ev && ev.unit;
          if (!a || a.team !== u.team || ev.src?.team === u.team || !STATUS[ev.id] || STATUS[ev.id].kind !== 'debuff') return;
          if (!(a.hasStatus('speedup') || a.hasStatus('haste') || a.hasStatus('flightpath')) || B.t < (a._flyteCleanseAt || 0)) return;
          a._flyteCleanseAt = B.t + 4;
          B.cleanse(a, 1);
          B.applyStatus(u, a, 'speedup', 2.5);
          B.energy(u, P.en);
          B.fxFloatIcon(a.x, a.y - 88, '🕊️ CLEAR AIR', '#bfe0ff');
        });
      }
    },
    R: {
      name: 'Looking Out for You', type: 'Battle Opener',
      v: { shield: .24 }, p: { thr: .5 },
      desc: (S, P) => `At the start of battle, Flyte places a Gust between the teams that grants the whole team 🕊 Flight Path. Whenever an ally under Flight Path drops below ${pc(P.thr)} HP, Flyte creates a fresh Gust at their location, cleanses a debuff, and shields them for <em>${pcn(S.shield * 100)}</em> of his Max HP plus Magic.`,
      passive: (u, B, S, P) => {
        B.after(.4, () => {
          Sound.play('tornado_s'); B.fxRing(B.centerX(), u.y - 20, 260, '#bfe0ff', .6);
          B.alliesOf(u).forEach(a => B.applyStatus(u, a, 'flightpath', 999));
        });
        B.on(u, 'allyLow', a => {
          if (!a.hasStatus('flightpath')) return;
          if (a._lookingOut && B.t - a._lookingOut < 10) return;
          a._lookingOut = B.t;
          Sound.play('cleanse'); Sound.play('tornado_s');
          B.fxRing(a.x, a.y - 30, 180, '#bfe0ff', .5);
          B.fxFlyteGust(u, a, 180, 5);
          B.cleanse(a, 1);
          B.repeat(5, .5, () => {
            B.alliesOf(u).forEach(ally => {
              if (B.distance(ally, a) < 180) {
                B.applyStatus(u, ally, 'speedup', 2);
                B.applyStatus(u, ally, 'haste', 2);
              }
            });
          });
          B.shield(u, a, u.max.hp * S.shield + u.st.mag * 0.35, 6);
        });
      }
    }
  }
});
