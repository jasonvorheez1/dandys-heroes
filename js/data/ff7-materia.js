/* ff7-materia.js - six Materia crafted from shards dropped by the FF7
   event's monsters. They are ordinary Trinkets (rank, merge, equip) with
   much stronger effects than generic gear, and never drop elsewhere. */
'use strict';

const FF7_MATERIA = [
  { id: 'ff7_steal', name: 'Steal Materia', color: 'yellow', icon: 'steal', from: 'FF7Bandit', shard: 'Bandit' },
  { id: 'ff7_bigguard', name: 'Big Guard Materia', color: 'blue', icon: 'bigguard', from: 'FF7Beachplug', shard: 'Beachplug' },
  { id: 'ff7_gravity', name: 'Gravity Materia', color: 'green', icon: 'gravity', from: 'FF7DeathClaw', shard: 'Death Claw' },
  { id: 'ff7_counter', name: 'Counter Attack Materia', color: 'purple', icon: 'counter', from: 'FF7Cactuar', shard: 'Cactuar' },
  { id: 'ff7_deathblow', name: 'Deathblow Materia', color: 'yellow', icon: 'deathblow', from: 'FF7Joker', shard: 'Joker' },
  { id: 'ff7_phoenix', name: 'Phoenix Materia', color: 'red', icon: 'phoenix', from: 'boss', shard: 'Phoenix' }
];
const FF7_MATERIA_BY_ID = Object.fromEntries(FF7_MATERIA.map(m => [m.id, m]));
const FF7_SHARD_COST = 30;

defTrinket({ id: 'ff7_steal', name: 'Steal Materia', file: '', eventOnly: true, ff7Materia: true,
  desc: 'Yellow Command Materia. Your hands are quicker than their eyes.',
  stat: r => `+${(r * 2.6).toFixed(1)}% Attack and Attack Speed`,
  effect: 'Every 4th Basic Attack Mugs: steals Energy and one buff from the target, and the wearer gains that Energy.',
  apply(u, B, r) {
    u.flat.atkP = (u.flat.atkP || 0) + r * .026; u.flat.aspdP = (u.flat.aspdP || 0) + r * .026; u.dirty = true;
    let n = 0;
    B.on(u, 'basicHit', ev => {
      const t = ev.target; if (!t || !t.alive || ++n % 4) return;
      const amt = 8 + r * 2; B.energy(t, -amt); B.energy(u, amt);
      const buff = t.statuses.find(s => STATUS[s.id] && STATUS[s.id].kind === 'buff' && !s.apexLocked && s.t < 900);
      if (buff) B.removeStatus(t, buff.id);
      B.fxFloatIcon(t.x, t.y - 95, 'STEAL', '#ffe27a');
    });
  } });

defTrinket({ id: 'ff7_bigguard', name: 'Big Guard Materia', file: '', eventOnly: true, ff7Materia: true,
  desc: 'Blue Enemy Skill. Learned the hard way, on a beach.',
  stat: r => `+${(r * 2.6).toFixed(1)}% Armor and Magic Defense`,
  effect: 'At the start of battle, casts Haste, Barrier and MBarrier on the whole team for a few seconds.',
  apply(u, B, r) {
    u.flat.defP = (u.flat.defP || 0) + r * .026; u.flat.mdefP = (u.flat.mdefP || 0) + r * .026; u.dirty = true;
    B.after(.8, () => {
      if (!u.alive) return;
      const dur = 3 + r * .9;
      B.alliesOf(u).filter(a => a.alive).forEach(a => { B.applyStatus(u, a, 'ff_haste', dur); B.applyStatus(u, a, 'ff_barrier', dur); B.applyStatus(u, a, 'ff_mbarrier', dur); });
      B.fxFloatIcon(u.x, u.y - 110, 'BIG GUARD', '#9fc8ff');
    });
  } });

defTrinket({ id: 'ff7_gravity', name: 'Gravity Materia', file: '', eventOnly: true, ff7Materia: true,
  desc: 'Green Magic Materia. Weight, in a small glowing sphere.',
  stat: r => `+${(r * 2.6).toFixed(1)}% Magic and Attack`,
  effect: 'Every third Skill cast drops Demi on the target with the most HP: damage equal to a slice of their current HP (capped against bosses).',
  apply(u, B, r) {
    u.flat.magP = (u.flat.magP || 0) + r * .026; u.flat.atkP = (u.flat.atkP || 0) + r * .02; u.dirty = true;
    let n = 0;
    B.on(u, 'cast', () => {
      if (++n % 3) return;
      const foes = B.enemiesOf(u).filter(e => e.alive); if (!foes.length) return;
      const t = foes.sort((a, b) => b.hp - a.hp)[0];
      const pct = .06 + r * .012;
      const dmg = Math.min(t.hp * pct, (u.st.atk + u.st.mag) * (t.isBoss ? 1.2 : 3));
      B.damage(u, t, dmg, { type: 'true', tag: 'Demi', noDodge: true });
      B.fxRing(t.x, t.y - 40, 120, '#a98aff', .4); B.fxFloatIcon(t.x, t.y - 100, 'DEMI', '#c9b0ff');
    });
  } });

defTrinket({ id: 'ff7_counter', name: 'Counter Attack Materia', file: '', eventOnly: true, ff7Materia: true,
  desc: 'Purple Independent Materia. Hit me. I dare you.',
  stat: r => `+${(r * 2.4).toFixed(1)}% Evasion and Armor`,
  effect: 'When hit by a Basic Attack, the wearer has a chance to strike back immediately.',
  apply(u, B, r) {
    u.flat.evaP = (u.flat.evaP || 0) + r * .024; u.flat.defP = (u.flat.defP || 0) + r * .02; u.dirty = true;
    B.on(u, 'damaged', ev => {
      if (!ev.basic || !ev.src || !ev.src.alive || ev.src.team === u.team || ev.tag === 'Counter') return;
      if (!chance(.12 + r * .03)) return;
      const src = ev.src;
      B.after(.1, () => {
        if (!u.alive || !src.alive) return;
        B.damage(u, src, Math.max(u.st.atk, u.st.mag) * (.7 + r * .08), { type: u.st.atk >= u.st.mag ? 'physical' : 'magic', tag: 'Counter' });
        B.fxFloatIcon(u.x, u.y - 100, 'COUNTER', '#d7b0ff');
      });
    });
  } });

defTrinket({ id: 'ff7_deathblow', name: 'Deathblow Materia', file: '', eventOnly: true, ff7Materia: true,
  desc: 'Yellow Command Materia. Aim for the one that matters.',
  stat: r => `+${(r * 2.4).toFixed(1)}% Critical Damage and +${(r * 1.2).toFixed(1)}% Critical Chance`,
  effect: 'Every 5th Basic Attack is a guaranteed Deathblow critical. Non-boss enemies below a small HP threshold are finished outright.',
  apply(u, B, r) {
    u.flat.critDmg = (u.flat.critDmg || 0) + r * .024; u.flat.crit = (u.flat.crit || 0) + r * .012; u.dirty = true;
    let n = 0;
    B.on(u, 'dealDamage', ev => {
      if (!ev.basic) return;
      if (++n % 5) return;
      ev.forceCrit = true; ev.amount *= 1.25;
      const t = ev.target;
      B.after(0, () => {
        if (t && t.alive && !t.isBoss && !t.isElite && t.hpPct < .06 + r * .012) { B.damage(u, t, t.hp + 1, { type: 'true', tag: 'Deathblow', noDodge: true }); B.fxFloatIcon(t.x, t.y - 100, 'DEATHBLOW', '#ffe27a'); }
      });
    });
  } });

defTrinket({ id: 'ff7_phoenix', name: 'Phoenix Materia', file: '', eventOnly: true, ff7Materia: true,
  desc: 'Red Summon Materia. A firebird that refuses to let anyone stay down.',
  stat: r => `+${(r * 2.4).toFixed(1)}% Max HP and Healing`,
  effect: 'Once per battle, when an ally would fall, Phoenix rekindles them with part of their HP and scorches every enemy.',
  apply(u, B, r) {
    u.flat.hpP = (u.flat.hpP || 0) + r * .024; u.flat.healPowP = (u.flat.healPowP || 0) + r * .024; u.dirty = true;
    let used = false;
    B.on(u, 'allyLethal', ev => {
      const a = ev.unit;
      if (used || ev.prevented || !u.alive || !a || a.minion) return;
      used = true; ev.prevented = true;
      B.after(0, () => {
        if (!a.alive) return;
        a.hp = Math.max(a.hp, a.max.hp * (.25 + r * .03));
        a.invuln = Math.max(a.invuln || 0, B.t + 1.2);
        B.tint('#ff6a2a', .3, .6);
        B.enemiesOf(u).filter(e => e.alive).forEach(e => B.damage(u, e, (u.st.atk + u.st.mag) * (.4 + r * .1), { type: 'magic', area: true, tag: 'Phoenix' }));
        B.fxFloatIcon(a.x, a.y - 110, 'PHOENIX', '#ffb070');
      });
    });
  } });

FF7_MATERIA.forEach(m => { if (!TRINKET_IDS.includes(m.id)) TRINKET_IDS.push(m.id); });
const ff7BaseTrinketIcon = trinketIcon;
// eslint-disable-next-line no-global-assign
trinketIcon = function (id) {
  const m = FF7_MATERIA_BY_ID[id];
  return m ? ASSET + 'assets/ff7/materia/' + m.icon + '.svg' : ff7BaseTrinketIcon(id);
};
