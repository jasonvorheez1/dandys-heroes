/* heroes13.js - Teagan turns careful tea service into support and measured control. */
'use strict';

function teaganTape(u, B, amount) {
  const current = Math.max(0, Math.min(150, Number(u.teaganTapes) || 0));
  const gained = Math.min(150 - current, Math.max(0, Number(amount) || 0));
  if (!gained) return;
  u.teaganTapes = current + gained;
  if (B.t - (u._teaganTapeFxAt ?? -Infinity) >= .6) {
    u._teaganTapeFxAt = B.t;
    B.fxTeaganSkill('tape', u, { count: gained });
  }
}

function teaganTakeTea(u, B, S, P) {
  if (!u.alive || u.hpPct >= .98 || u.teaganTapes < P.tapeCost || B.t < (u._teaganTeaNext || 0)) return false;
  u.teaganTapes -= P.tapeCost;
  u._teaganTeaNext = B.t + P.careCd;
  B.cleanse(u, 1);
  B.heal(u, u, u.max.hp * S.selfHeal, { tag: 'Tea Time' });
  B.fxTeaganSkill('shield', u, { target: u });
  Sound.play('teagan_tea_service', { vol: .58, throttle: 500 });
  return true;
}

defHero({
  id: 'Teagan', name: 'Teagan', folder: 'Teagan', file: 'Teagan', icon: 'Teagan',
  role: 'Support', roleLabel: 'Support / Control', tier: 'S', position: 'Midline', element: 'Tea',
  blurb: 'A gracious host who knows when a friend needs a cup, a pause, or a place to sit.',
  base: { hp: 4800, atk: 165, def: 270, mag: 325, mdef: 300, spd: 112, acc: 188, eva: 155 },
  hidden: { range: 255, aspd: .90, ms: 72, aggro: .82, crit: .06, critDmg: 1.45, healPow: 1.30, shieldPow: 1.26, cdr: .08, ccRes: .24, kbRes: .32, armorPen: 0, magPen: .10 },
  growth: { hp: .095, atk: .050, def: .082, mag: .100, mdef: .088 },
  move: { gait: 'waddle', bob: 4, freq: 1.35, lean: 4, squash: .04, idle: 'pour', step: 'step_soft',
    particles: 'steam', pcol: '#d7ad72', trail: { on: false }, brake: .5 },
  basic: { name: 'Saucer Flick', type: 'magic', ratio: .82, range: 255, proj: 'orb', pcol: '#d7ad72',
    sfx: 'whoosh', hit: 'hit_magic', wind: .19, note: 'A neat little clink before the next cup is poured.',
    onHit: (u, t, B) => {
      teaganTape(u, B, 15);
      u.teaganSteep = Math.min(3, (u.teaganSteep || 0) + 1);
    } },
  skills: {
    W: {
      name: 'Tea Time', type: 'Shield / Self Healing', energy: 100,
      v: { selfHeal: .32, shield: .12 }, p: { tapeCost: 75, careCd: 10, dur: 5 },
      fixedP: ['tapeCost', 'careCd'],
      desc: (S, P) => `<span class="sk-pas">Teagan gathers 📼 Tapes as she fights and helps her guests. Below 55% HP, she spends ${P.tapeCost} Tapes to heal herself for <em>${pcn(S.selfHeal * 100)}</em> Max HP and clear one debuff.</span> Active: Teagan serves tea, clearing one debuff and shielding every ally for <em>${pcn(S.shield * 100)}</em> of her Max HP with Haste for ${P.dur}s. Each recent basic attack lets the tea steep and strengthens the Shields. If she needs healing and has enough Tapes, she takes a cup herself.`,
      passive: (u, B, S, P) => {
        u.teaganTapes = 25;
        u.teaganSteep = 0;
        u._teaganTeaNext = 0;
        B.on(u, 'waveStart', () => teaganTape(u, B, 20));
        B.on(u, 'allyDamaged', ev => {
          if (!ev || !ev.unit || ev.unit === u || ev.dot || B.t < (u._teaganGuestTapeAt || 0)) return;
          u._teaganGuestTapeAt = B.t + .8;
          teaganTape(u, B, 5);
        });
        B.every(u, .3, () => { if (u.hpPct < .55) teaganTakeTea(u, B, S, P); });
      },
      cast: (u, B, S, P) => {
        const allies = B.alliesOf(u);
        const steep = u.teaganSteep || 0;
        u.teaganSteep = 0;
        B.anim(u, 'cast', .82, 'teaganTea');
        Sound.play('teagan_tea_service', { vol: .72, priority: true });
        B.fxTeaganSkill('tea', u, { allies });
        allies.forEach(a => {
          B.cleanse(a, 1);
          B.shield(u, a, u.max.hp * S.shield * (1 + steep * .15), P.dur);
          B.applyStatus(u, a, 'haste', P.dur);
        });
        teaganTakeTea(u, B, S, P);
      }
    },
    G: {
      name: 'A Seat at the Table', type: 'Magic Control / Shield', cd: 10,
      v: { ratio: 1.02, shield: .11 }, p: { stun: 2.4, slow: 4 },
      desc: (S, P) => `Teagan offers the most dangerous enemy a place to pause. A cup deals <em>${pcn(S.ratio * 100)}</em> Magic damage, 🌀 Stuns them for ${P.stun}s, then 🐢 Slows them for ${P.slow}s. The most injured teammate receives a Shield worth <em>${pcn(S.shield * 100)}</em> of Teagan's Max HP.`,
      ai: { prio: 58, cond: (u, B) => B.enemiesOf(u).length > 0 },
      cast: (u, B, S, P) => {
        const target = B.enemiesOf(u).slice().sort((a, b) =>
          (b.st.atk + b.st.mag) - (a.st.atk + a.st.mag))[0];
        if (!target) return;
        B.anim(u, 'cast', .64, 'teaganCorrect');
        Sound.play('teagan_manners_correction', { vol: .62, priority: true });
        B.fxTeaganSkill('invitation', u, { target });
        B.damage(u, target, u.st.mag * S.ratio * (1 + (u._teaganInviteBonus || 0)), { type: 'magic', tag: 'A Seat at the Table' });
        if (target.alive) {
          B.applyStatus(u, target, 'stun', P.stun);
          B.applyStatus(u, target, 'slow', P.slow);
        }
        const friend = B.lowestHp(B.alliesOf(u).filter(a => a !== u && !a.minion)) || u;
        B.shield(u, friend, u.max.hp * S.shield, 5);
      }
    },
    B: {
      name: 'A Quieter Table', type: 'Magic Control / Team Buff', cd: 12,
      v: { ratio: .74 }, p: { dur: 5 },
      desc: (S, P) => `Teagan settles the room. Enemies take <em>${pcn(S.ratio * 100)}</em> Magic damage and become 🌙 Drowsy for ${P.dur}s, slowing attacks and skill recovery. Allies gain Fortify and a little Energy so they can catch their breath.`,
      ai: { prio: 53, cond: (u, B) => B.enemiesOf(u).length > 0 },
      cast: (u, B, S, P) => {
        const foes = B.enemiesOf(u), allies = B.alliesOf(u);
        B.anim(u, 'cast', .72, 'teaganSeat');
        Sound.play('teagan_proper_seating', { vol: .62, priority: true });
        B.fxTeaganSkill('quiet', u, { targets: foes, allies });
        foes.forEach(e => {
          B.damage(u, e, u.st.mag * S.ratio, { type: 'magic', area: true, tag: 'A Quieter Table' });
          if (e.alive) B.applyStatus(u, e, 'drowsy', P.dur);
        });
        allies.forEach(a => { B.applyStatus(u, a, 'fortify', P.dur); B.energy(a, 8); });
      }
    },
    P: {
      name: 'Remembered Orders', type: 'Passive / Team Buff',
      v: { shield: .14 }, p: { every: 2, dur: 5, energy: 16 }, fixedP: ['every'],
      desc: (S, P) => `Every ${P.every} basic attacks, Teagan prepares a cup for the teammate who needs it most. An injured guest receives a <em>${pcn(S.shield * 100)}</em> Max HP Shield; a tired guest gains ${P.energy} Energy; otherwise the cup grants Haste for ${P.dur}s.`,
      passive: (u, B, S, P) => {
        u._teaganCups = 0;
        B.on(u, 'basicHit', () => {
          u._teaganPreparedThisHit = false;
          if (++u._teaganCups < P.every) return;
          u._teaganCups = 0;
          u._teaganPreparedThisHit = true;
          const friend = B.lowestHp(B.alliesOf(u).filter(a => a !== u && !a.minion)) || u;
          if (friend.hpPct < .75) B.shield(u, friend, u.max.hp * S.shield, P.dur);
          else if (friend.energy < friend.energyMax * .5) B.energy(friend, P.energy);
          else B.applyStatus(u, friend, 'haste', P.dur);
          B.fxTeaganSkill('shield', u, { target: friend });
        });
      }
    },
    R: {
      name: 'A Cup for Everyone', type: 'Magic Damage / Upgrade',
      v: { splash: .48, invite: .28 }, p: { radius: 150, dur: 3 },
      desc: (S, P) => `Teagan's basic attacks splash to enemies within ${P.radius} range for <em>${pcn(S.splash * 100)}</em> Magic damage. When Remembered Orders serves a cup, the splash also makes those enemies 🌙 Drowsy for ${P.dur}s. A Seat at the Table deals <em>${pcn(S.invite * 100)}</em> more damage.`,
      passive: (u, B, S, P) => {
        u._teaganInviteBonus = S.invite;
        B.on(u, 'basicHit', ev => {
          const target = ev && ev.target;
          if (!target) return;
          B.enemiesOf(u).filter(e => e !== target && B.distance(e, target) <= P.radius).forEach(e => {
            B.damage(u, e, u.st.mag * S.splash, { type: 'magic', area: true, tag: 'A Cup for Everyone' });
            if (u._teaganPreparedThisHit && e.alive) B.applyStatus(u, e, 'drowsy', P.dur);
          });
        });
      }
    }
  }
});

// Teagan's playable definition replaces the earlier enemy-side quick-cast kit.
if (typeof HERO_IDS !== 'undefined' && !HERO_IDS.includes('Teagan')) HERO_IDS.push('Teagan');
if (typeof PLAYABLE_IDS !== 'undefined' && !PLAYABLE_IDS.includes('Teagan')) PLAYABLE_IDS.push('Teagan');
