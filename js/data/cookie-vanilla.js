/* Pure Vanilla Cookie: a defensive healer with one rescue per wave. */
'use strict';

Object.assign(STATUS, {
  injury: { icon: '🩹', name: 'Injury', kind: 'debuff',
    desc: 'Maximum HP is reduced until the Injury is relieved.',
    mods: (m, s) => { m.hpP -= Math.min(.6, Math.max(0, s.val || .2)); } },
  vanilla_gentle: { icon: '🌼', name: 'Gentle Radiance', kind: 'buff',
    desc: 'Positive stat buffs are 15% stronger.' },
  vanilla_truth: { icon: '✨', name: 'Light of Truth', kind: 'buff',
    desc: 'Takes 25% less damage. One emergency heal triggers below half HP.',
    mods: m => { m.dmgTaken -= .25; },
    onExpire: (a, s, B) => { if (a.alive) { B.energy(a, 200); B.cleanse(a, 1); B.fxRing(a.x, a.y - 50, 110, '#fff0bd', .38); } } },
  vanilla_healing: { icon: '🕊️', name: 'Peaceful Healing', kind: 'buff',
    desc: 'Healing received increased by 20%.', mods: m => { m.healRecv += .2; } },
  vanilla_recovery: { icon: '🌟', name: 'Vanilla Recovery', kind: 'special',
    desc: 'Heals each second when Love & Peace could not provide a Shield.',
    tick: (a, s, dt, B) => { s.acc = (s.acc || 0) + dt; while (s.acc >= 1) { s.acc -= 1; B.heal(s.src, a, s.val || 0, { silent: true }); } } },
  vanilla_illuminated: { icon: '☀️', name: 'Illuminated', kind: 'debuff',
    desc: 'Deals 15% less damage and receives 20% less healing.',
    mods: m => { m.dmgDealt -= .15; m.healRecv -= .2; } },
  vanilla_compassion: { icon: '🤍', name: 'Warmth of Compassion', kind: 'buff',
    desc: 'Max HP increased by 15% and damage taken reduced by 10%.',
    mods: m => { m.hpP += .15; m.dmgTaken -= .10; } },
  vanilla_salvation: { icon: '🌤️', name: 'Light of Salvation', kind: 'buff',
    desc: 'Incoming damage reduced by 15%.', mods: m => { m.dmgTaken -= .15; } },
  vanilla_focus: { icon: '🪄', name: 'Compassionate Focus', kind: 'buff',
    desc: 'Skill Haste increased after an emergency heal.', mods: m => { m.cdr += .12; } },
  vanilla_accuracy: { icon: '🌫️', name: 'Dazzled by Truth', kind: 'debuff',
    desc: 'Accuracy reduced by 15%.', mods: m => { m.accP -= .15; } }
});

function vanillaAllies(u, B) { return B.alliesOf(u).filter(a => a.alive); }
function vanillaLow(u, B) { return vanillaAllies(u, B).sort((a, b) => a.hpPct - b.hpPct); }
function vanillaFoes(u, B) { return B.enemiesOf(u).filter(e => B.isTargetable(e)); }
function vanillaPose(u, B, clip, duration) { u._vanillaPose = clip; u._vanillaPoseUntil = B.t + duration; B.anim(u, 'cast', Math.min(duration, 1.1)); }
function vanillaFx(B, a, radius = 86) { B.fxRing(a.x, a.y - 48, radius, '#ffedb2', .4); }

function vanillaBasic(u, B) {
  vanillaPose(u, B, 'skill1', .5);
  vanillaLow(u, B).slice(0, 2).forEach(a => {
    B.heal(u, a, u.st.mag * .48, { silent: true });
    B.applyStatus(u, a, 'vanilla_gentle', 8);
    vanillaFx(B, a, 56);
  });
  B.energy(u, 9);
  B.emitTeam(u.team, 'allyBasic', { unit: u, target: null });
  B.emitFoe(u.team, 'enemyAction', u);
  Sound.play('heal_soft', { vol: .38, throttle: 110 });
}

function vanillaRelieveInjury(u, B, a) {
  const injury = a.statuses.find(s => s.id === 'injury');
  if (!injury) return;
  const before = a.max.hp;
  injury.val = Math.max(0, (injury.val || .2) * .5);
  if (injury.val < .01) B.removeStatus(a, 'injury');
  a.dirty = true; a.recompute();
  const restored = Math.max(0, a.max.hp - before);
  if (restored) B.heal(u, a, restored * .5, { silent: true });
}

function vanillaShieldOrRecovery(u, B, a, amount, duration) {
  B.shield(u, a, amount, duration);
  const shield = a.shields.find(s => s.src === u && s.amt > 0);
  if (shield) shield.vanillaLovePeace = true;
  else
    B.applyStatus(u, a, 'vanilla_recovery', 7, { val: u.st.mag * .18 });
}

function vanillaSalvation(u, B, ally, delayed, P) {
  if (!u.alive || !ally || (delayed && ally.alive)) return;
  if (delayed) {
    ally.alive = true;
    ally._vanillaPendingRevive = false;
    ally.dirty = true;
    ally.hp = 1;
    ally._lastHitBy = null;
    ally.el?.classList.remove('dead');
    if (ally.el) { ally.el.style.display = ''; ally.el.style.transition = 'opacity .25s'; ally.el.style.opacity = '1'; ally.el.style.transform = ''; }
    if (ally.imgEl && !ally.imgEl.getAttribute('src') && ally.idleArtSrc) ally.imgEl.src = ally.idleArtSrc;
    ally.bar?.classList.remove('gone');
    B._liveDirty = true;
  }
  ally.hp = Math.max(ally.hp, ally.max.hp * P.rescueHp);
  B.shield(u, ally, ally.max.hp * P.rescueShield, 8);
  vanillaPose(u, B, 'skill3', 1.2);
  B.fxFloatIcon(ally.x, ally.y - 105, 'LIGHT OF SALVATION', '#fff2ad');
  vanillaAllies(u, B).forEach(a => {
    B.heal(u, a, u.st.mag * .4, { silent: true });
    B.applyStatus(u, a, 'vanilla_salvation', 6);
    vanillaFx(B, a, 94);
  });
  Sound.play('cleanse', { vol: .65, throttle: 300 });
}

HEROES.PureVanillaCookie.skills = {
  W: { name: 'Love & Peace', type: 'Healing / Shield / Support', energy: 100,
    v: { heal: 1.7, shield: .20 }, p: { shieldDur: 10, gentle: 8 },
    desc: (S, P) => `Basic Attacks heal the two weakest allies instead of hurting enemies and grant Gentle Radiance for ${P.gentle}s, strengthening positive buffs by 15%. Active: all allies heal for ${Math.round(S.heal * 100)}% Skill Power and gain a ${Math.round(S.shield * 100)}% Max-HP Shield for ${P.shieldDur}s. Injury is halved, restoring extra HP. If a Shield cannot be applied or is dispelled, its ally receives seven seconds of healing instead. Pure Vanilla resists interruptions while casting.`,
    passive(u, B) {
      u.guards.push((id, def) => !!(def.cc && B.t < (u._vanillaCastGuardUntil || 0)));
      B.on(u, 'buffRemoved', ev => {
        const a = ev.unit;
        if (!a || a.team !== u.team || !ev.ids?.includes('shield')) return;
        const own = a.shields.filter(s => s.src === u && s.vanillaLovePeace);
        if (!own.length) return;
        a.shields = a.shields.filter(s => !own.includes(s));
        B.applyStatus(u, a, 'vanilla_recovery', 7, { val: u.st.mag * .18 });
      });
    },
    cast(u, B, S, P) {
      vanillaPose(u, B, 'skill3', 1.45);
      B.fxRing(u.x, u.y - 65, 360, '#fff1ba', .75);
      vanillaAllies(u, B).forEach(a => {
        vanillaRelieveInjury(u, B, a);
        B.heal(u, a, u.st.mag * S.heal);
        vanillaShieldOrRecovery(u, B, a, a.max.hp * S.shield, P.shieldDur);
        if (u.rarity >= 5) { B.cleanse(a, 1); B.applyStatus(u, a, 'vanilla_healing', 8); }
        vanillaFx(B, a, 108);
      });
      Sound.play('sparkle', { vol: .6, throttle: 250 });
    } },
  G: { name: 'Light of Truth', type: 'Healing / Support / Control', cd: 11,
    v: { heal: 1.2, emergency: 1.1 }, p: { dur: 8 },
    desc: (S, P) => `The lowest-HP ally heals and gains Light of Truth for ${P.dur}s, reducing incoming damage by 25%. If they fall below half HP, they receive one emergency heal of ${Math.round(S.emergency * 100)}% Skill Power, even while Pure Vanilla acts. Surviving the full duration grants 200 Energy and cleanses one debuff. Attackers lose 15% Accuracy for five seconds. Red rarity protects a second ally with reduced healing.`,
    passive(u, B, S) {
      B.on(u, 'allyDamaged', ev => {
        const a = ev.unit;
        if (!a || !a.alive) return;
        const truth = a.statuses.find(s => s.id === 'vanilla_truth' && s.src === u);
        if (!truth) return;
        if (ev.src && ev.src.team !== u.team) B.applyStatus(u, ev.src, 'vanilla_accuracy', 5);
        if (truth._emergencyUsed) return;
        const afterHit = (a.hp - Math.max(0, (ev.amount || 0) - a.shieldTotal)) / a.max.hp;
        if (afterHit >= .5) return;
        truth._emergencyUsed = true;
        B.heal(u, a, u.st.mag * S.emergency * (truth._secondary ? .65 : 1));
        vanillaFx(B, a, 105);
        if (u.rarity >= 5) B.applyStatus(u, u, 'vanilla_focus', 6);
      });
    },
    cast(u, B, S, P) {
      vanillaPose(u, B, 'skill1', 1.05);
      vanillaLow(u, B).slice(0, u.rarity >= 5 ? 2 : 1).forEach((a, i) => {
        B.heal(u, a, u.st.mag * S.heal * (i ? .65 : 1));
        B.applyStatus(u, a, 'vanilla_truth', P.dur);
        const truth = a.statuses.find(s => s.id === 'vanilla_truth' && s.src === u);
        if (truth) { truth._emergencyUsed = false; truth._secondary = !!i; }
        vanillaFx(B, a, 115);
      });
    } },
  B: { name: 'Shards of Light', type: 'Magic Damage / Healing / Control', cd: 12,
    v: { heal: .62, damage: .82 }, p: { shards: 5, shield: .07, dur: 7 },
    desc: (S, P) => `${P.shards} Shards seek the battlefield: three heal and lightly Shield the weakest allies, while two damage the strongest enemies and Illuminate them for ${P.dur}s. Illuminated foes deal 15% less damage, receive 20% less healing, lose a removable buff when they use a Skill, and trigger a small heal for the weakest ally. If everyone is above 75% HP, one extra Shard attacks instead. Red rarity adds two Shards, favoring allies when injured and enemies when healthy.`,
    passive(u, B) {
      B.on(u, 'enemySkillStarting', ev => {
        const e = ev.unit;
        if (!e || !e.statuses.some(s => s.id === 'vanilla_illuminated' && s.src === u)) return;
        const buff = e.statuses.find(s => STATUS[s.id] && STATUS[s.id].kind === 'buff' && s.id !== 'shield' && !s.apexLocked);
        if (buff) { B.removeStatus(e, buff.id); B.fxFloatIcon(e.x, e.y - 92, '✨ DISPEL', '#fff0bd'); }
        const a = vanillaLow(u, B)[0];
        if (a) { B.heal(u, a, u.st.mag * .27, { silent: true }); vanillaFx(B, a, 48); }
      });
    },
    cast(u, B, S, P) {
      vanillaPose(u, B, 'skill2', 1.4);
      const healthy = vanillaAllies(u, B).every(a => a.hpPct > .75);
      const heals = u.rarity >= 5 ? (healthy ? 2 : 5) : (healthy ? 2 : 3);
      const count = u.rarity >= 5 ? P.shards + 2 : P.shards;
      for (let i = 0; i < count; i++) B.after(i * .14, () => {
        if (!u.alive) return;
        if (i < heals || !vanillaFoes(u, B).length) {
          const allies = vanillaLow(u, B), a = allies[i % Math.max(1, allies.length)];
          if (!a) return;
          B.fxProj(u, a, { kind: 'orb', col: '#fff4c0' }, () => {
            if (!a.alive) return;
            B.heal(u, a, u.st.mag * S.heal);
            B.shield(u, a, a.max.hp * P.shield, 6);
            vanillaFx(B, a, 62);
          });
        } else {
          const foes = vanillaFoes(u, B).sort((a, b) => b.st.atk - a.st.atk);
          const e = foes[(i - heals) % foes.length];
          B.fxProj(u, e, { kind: 'orb', col: '#ffe38d' }, () => {
            if (!e.alive) return;
            B.damage(u, e, u.st.mag * S.damage, { type: 'magic', tag: 'Shards of Light' });
            B.applyStatus(u, e, 'vanilla_illuminated', P.dur);
            vanillaFx(B, e, 66);
          });
        }
      });
    } },
  P: { name: 'Warmth of Compassion', type: 'Healing / Support / Survival',
    v: { selfHeal: .25 }, p: { resist: .30, start: 10, overheal: .40 },
    desc: (S, P) => `Pure Vanilla resists ${Math.round(P.resist * 100)}% of removable debuffs. At each wave start, allies gain 15% Max HP and 10% Damage Reduction for ${P.start}s. ${Math.round(P.overheal * 100)}% of excess healing becomes a Shield, capped at 15% Max HP. Once per wave below 35% HP, he cleanses himself, heals ${Math.round(S.selfHeal * 100)}% Max HP, and gains a 20% Max-HP Shield. A broken allied Shield grants him Energy on a short cooldown.`,
    passive(u, B, S, P) {
      u.guards.push((id, def) => def.kind === 'debuff' && Math.random() < P.resist);
      vanillaAllies(u, B).forEach(a => B.applyStatus(u, a, 'vanilla_compassion', P.start));
      B.on(u, 'allyOverheal', ev => {
        if (!ev.target?.alive || ev.amount <= 0) return;
        B.shield(u, ev.target, Math.min(ev.amount * P.overheal, ev.target.max.hp * .15), 8);
      });
      B.on(u, 'allyLow', a => {
        if (a !== u || u._vanillaCompassionUsed || u.hpPct >= .35) return;
        u._vanillaCompassionUsed = true;
        u.hp = Math.max(1, u.hp);
        B.cleanse(u, 99);
        B.heal(u, u, u.max.hp * S.selfHeal);
        B.shield(u, u, u.max.hp * .20, 8);
        vanillaFx(B, u, 130);
      });
      B.on(u, 'allyShieldBreak', ev => {
        if (!ev.unit || B.t < (u._vanillaShieldEnergyAt || 0)) return;
        u._vanillaShieldEnergyAt = B.t + 2.5;
        B.energy(u, 12);
      });
    } },
  R: { name: 'Beacon of Truth', type: 'Healing / Shield / Magic Damage / Support',
    v: { mag: .13, heal: .16, hp: .10, shield: .14 }, p: { rescueHp: .30, rescueShield: .25 },
    desc: (S, P) => `Love & Peace cleanses one debuff and grants 20% Healing received. Light of Truth protects two allies, with reduced healing on the second. Shards of Light gains two Shards, and emergency heals grant Skill Haste. Once per wave, Light of Salvation rescues one ally from defeat at ${Math.round(P.rescueHp * 100)}% HP with a ${Math.round(P.rescueShield * 100)}% Max-HP Shield. Each ally can be rescued only once per battle. The team then heals and takes 15% less damage for six seconds. Skill Power, healing, Max HP, and Shields increase.`,
    passive(u, B, S, P) {
      u.flat.magP81 = S.mag;
      u.flat.healPowP81 = S.heal;
      u.flat.hpP81 = S.hp;
      u.flat.shieldPowP81 = S.shield;
      u.dirty = true;
      u._vanillaSavedAllies = u._vanillaSavedAllies || new Set();
      B.on(u, 'allyLethal', ev => {
        const a = ev.unit;
        if (ev.prevented || u._vanillaSalvationUsed || !a || !a.alive || a.minion || !u.alive || a._vanillaSavedOnce || u._vanillaSavedAllies.has(a.uid)) return;
        if (a === u && !vanillaAllies(u, B).some(other => other !== u)) return;
        u._vanillaSalvationUsed = true;
        u._vanillaSavedAllies.add(a.uid);
        a._vanillaSavedOnce = true;
        ev.prevented = true;
        vanillaSalvation(u, B, a, false, P);
      });
      B.on(u, 'allyDown', a => {
        if (u._vanillaSalvationUsed || !a || a.minion || !u.alive || a._vanillaSavedOnce || u._vanillaSavedAllies.has(a.uid)) return;
        if (!vanillaAllies(u, B).length) return;
        u._vanillaSalvationUsed = true;
        u._vanillaSavedAllies.add(a.uid);
        a._vanillaSavedOnce = true;
        a._vanillaPendingRevive = true;
        B.after(.35, () => {
          if (a.alive) { a._vanillaPendingRevive = false; return; }
          if (!B.over && u.alive) vanillaSalvation(u, B, a, true, P);
          else { a._vanillaPendingRevive = false; B.removeListenersFor(a); B.intervals = B.intervals.filter(i => i.owner !== a); }
        });
      });
    } }
};
