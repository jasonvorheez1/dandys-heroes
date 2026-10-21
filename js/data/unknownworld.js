/* unknownworld.js - office robots from the sealed world; Big Wig can later be recruited. */
'use strict';

const UNKNOWN_WORLD_ART = {
  GladHander: ASSET + 'uploads/image-38.png',
  RobberBaron: ASSET + 'uploads/image-39.png',
  LegalEagle: ASSET + 'uploads/image-40.png',
  PencilPusher: ASSET + 'uploads/pencilpusher.png',
  BigWig: ASSET + 'uploads/Bigwig.png'
};
const UNKNOWN_WORLD_DIALOGUE = [
  'Would you like a bite?',
  'Sorry to trip you up there!',
  "I'm going to get on your good side.",
  "I'm going to get on your good side.",
  'See, words can hurt you.',
  'Did you catch my meaning?'
];
const UNKNOWN_WORLD_SKILL_AUDIO = {
  'GladHander:W': 'cog_hot_air', 'GladHander:G': 'cog_demotion', 'GladHander:B': 'cog_fountain_pen',
  'LegalEagle:W': 'cog_jargon', 'LegalEagle:G': 'cog_mumbo_jumbo', 'LegalEagle:B': 'cog_evil_eye',
  'RobberBaron:W': 'cog_power_trip', 'RobberBaron:G': 'cog_pick_pocket', 'RobberBaron:B': 'cog_hangup',
  'PencilPusher:W': 'cog_guilt_trip', 'PencilPusher:G': 'cog_demotion', 'PencilPusher:B': 'cog_fountain_pen',
  'BigWig:W': 'cog_paradigm_shift', 'BigWig:G': 'cog_mumbo_jumbo', 'BigWig:B': 'cog_glower_power'
};
// These are deliberately sparse accents rather than a replacement for every
// basic-hit sound. They give each machine a recognizable battle cadence.
const UNKNOWN_WORLD_BASIC_AUDIO = {
  GladHander: 'cog_hot_air', LegalEagle: 'cog_evil_eye', RobberBaron: 'cog_hangup',
  PencilPusher: 'cog_fountain_pen', BigWig: 'cog_glower_power'
};

// Keep the shared Lawbot chassis, but let each file read as a distinct office
// threat in the roster and on the battlefield.
const LAWBOT_PROFILES = {
  GladHander: { roleLabel: 'Debuff Broker', color: '#d8b86a', blurb: 'A smooth-talking Lawbot who turns existing debuffs into stronger pressure and personal cover.' },
  LegalEagle: { roleLabel: 'Control Litigator', color: '#8dc4e8', blurb: 'A surgical Lawbot that strips buffs, denies actions, and preys on compromised targets.' },
  RobberBaron: { roleLabel: 'Power Disruptor', color: '#c77e8e', blurb: 'A predatory executive who taxes Energy, scatters formations, and profits from every hit.' },
  PencilPusher: { roleLabel: 'Execution Clerk', color: '#9db49c', blurb: 'A methodical enforcer who softens a target, then cashes in once their health is low.' },
  BigWig: { roleLabel: 'High Court', color: '#b496df', blurb: 'The highest court machine. His court grows harder to break for every enemy caught in a debuff.' }
};

function unknownStats() {
  return { hp: 5300, atk: 322, def: 252, mag: 304, mdef: 254, spd: 108, acc: 184, eva: 102 };
}
function unknownHidden() {
  return { range: 300, aspd: .98, ms: 66, aggro: .7, crit: .08, critDmg: 1.58,
    healPow: 1, shieldPow: 1, cdr: 0, ccRes: .32, kbRes: .26, armorPen: .04, magPen: .04 };
}
function unknownMove(gait, color) {
  return { gait, bob: 3, freq: 1.4, lean: 2, squash: .025, idle: 'pulse', step: 'robot',
    particles: 'dust', pcol: color || '#b7c4d0', brake: .18 };
}
function unknownSkill(name, type, extra) {
  return Object.assign({ name, type, energy: 100 }, extra || {});
}
function hitTarget(u, B, list, stat) { return B.highestStat(B.enemiesOf(u), stat) || B.nearest(u, list || B.enemiesOf(u)); }
function allRounder(id, name, file, move, skills, basic, tier) {
  const profile = LAWBOT_PROFILES[id] || {};
  return defHero({
    id, name, folder: 'UnknownWorld', file, icon: id, role: 'All-Rounder', roleLabel: profile.roleLabel || 'All-Rounder', tier: tier || 'B',
    element: 'Office', unknownWorld: true, twistedOnly: id !== 'BigWig',
    blurb: profile.blurb || 'An encounter-only machine that recognizes your Toon as a familiar target.', base: unknownStats(), hidden: unknownHidden(),
    growth: { hp: .086, atk: .074, def: .078, mag: .081, mdef: .079 }, move: unknownMove(move, profile.color),
    basic: basic || { name: 'Paperwork', type: 'physical', ratio: .84, range: 115, sfx: 'unknown_machine_attack', hit: 'hit', wind: .32 },
    skills
  });
}

allRounder('GladHander', 'Glad Hander', 'image-38.png', 'march', {
  W: unknownSkill('Schmooze', 'Magic Damage', {
    v: { ratio: 1.52, debuff: 6, heal: .09 }, p: { bonus: .36 },
    desc: (S, P) => `Targets the highest-Attack enemy for <em>${pcn(S.ratio * 100)}</em> Magic Damage and lowers Attack and Magic Attack for ${S.debuff}s. If they were already debuffed, Schmooze deals <em>+${pc(P.bonus)}</em> damage and heals Glad Hander for <em>${pc(S.heal)}</em> max HP.`,
    cast: (u, B, S, P) => { const t = hitTarget(u, B, B.enemiesOf(u), 'atk'); if (!t) return; const had = t.statuses.some(s => STATUS[s.id] && STATUS[s.id].kind === 'debuff');
      B.anim(u, 'cast', .42); Sound.play('unknown_machine_question', { vol: .34 }); B.after(.28, () => { B.damage(u, t, u.st.mag * S.ratio * (had ? 1 + P.bonus : 1), { type: 'magic', tag: 'Schmooze' }); B.applyStatus(u, t, 'attackdown', S.debuff, { val: .18 }); B.applyStatus(u, t, 'magdown', S.debuff); if (had) B.heal(u, u, u.max.hp * S.heal, { tag: 'Schmooze' }); }); }
  }),
  G: unknownSkill('Rubber Stamp', 'Normal Damage', { cd: 7, v: { ratio: 1.08 }, p: { dur: 8 },
    desc: (S, P) => `Stamps the closest enemy for <em>${pcn(S.ratio * 100)}</em> Normal Damage and applies Marked for Business for ${P.dur}s.`,
    ai: { prio: 55 }, cast: (u, B, S, P) => { const t = B.nearest(u, B.enemiesOf(u)); if (!t) return; B.anim(u, 'cast', .26); B.after(.18, () => { B.damage(u, t, u.st.atk * S.ratio, { type: 'physical', tag: 'Rubber Stamp' }); B.applyStatus(u, t, 'businessmark', P.dur); }); }
  }),
  B: unknownSkill('Fountain Pen', 'Magic Damage', { cd: 9, v: { ratio: 1.02 }, p: { blind: 5 },
    desc: (S, P) => `Fires ink at the fastest enemy for <em>${pcn(S.ratio * 100)}</em> Magic Damage and Blinds them for ${P.blind}s. Business-marked targets also lose Evasion.`,
    ai: { prio: 52 }, cast: (u, B, S, P) => { const t = hitTarget(u, B, B.enemiesOf(u), 'spd'); if (!t) return; B.anim(u, 'cast', .3); B.after(.2, () => { B.damage(u, t, u.st.mag * S.ratio, { type: 'magic', tag: 'Fountain Pen' }); B.applyStatus(u, t, 'blind', P.blind); if (t.hasStatus('businessmark')) B.applyStatus(u, t, 'evadown', P.blind); }); }
  }),
  P: unknownSkill('Filibuster', 'Passive', { p: { hits: 3, dur: 4.5 },
    desc: (S, P) => `Every ${Math.round(P.hits)} basic attacks, lowers the closest enemy's Power gain and Attack Speed for ${P.dur}s.`,
    passive: (u, B, S, P) => { u._unknownHits = 0; B.on(u, 'basicHit', ev => { if (!ev.target) return; u._unknownHits++; if (u._unknownHits < P.hits) return; u._unknownHits = 0; Sound.play('cog_filibuster', { vol: .23, throttle: 900 }); B.applyStatus(u, ev.target, 'drain', P.dur); B.applyStatus(u, ev.target, 'armslow', P.dur); }); }
  }),
  R: unknownSkill('Corporate Smile', 'Passive', { p: { dur: 4 },
    desc: (S, P) => `Whenever Glad Hander applies a debuff to an enemy, he gains Fortify for ${P.dur}s. Fortify can stack up to 5 times.`,
    passive: (u, B, S, P) => B.on(u, 'statusApplied', ev => { if (ev.src !== u || !ev.unit || ev.unit.team === u.team || !STATUS[ev.id] || STATUS[ev.id].kind !== 'debuff') return; B.applyStatus(u, u, 'fortify', P.dur); })
  })
});

allRounder('LegalEagle', 'Legal Eagle', 'image-40.png', 'march', {
  W: unknownSkill('Pecking Order', 'Normal Damage', { v: { ratio: 1.36 }, p: { dur: 6 },
    desc: (S, P) => `Strikes the highest-Attack enemy for <em>${pcn(S.ratio * 100)}</em> Normal Damage, removes 1 buff, then lowers Attack and Speed for ${P.dur}s.`,
    cast: (u, B, S, P) => { const t = hitTarget(u, B, B.enemiesOf(u), 'atk'); if (!t) return; B.anim(u, 'cast', .42); B.after(.26, () => { B.dispel(t, 1); B.damage(u, t, u.st.atk * S.ratio, { type: 'physical', tag: 'Pecking Order' }); B.applyStatus(u, t, 'attackdown', P.dur, { val: .2 }); B.applyStatus(u, t, 'slow', P.dur); }); }
  }),
  G: unknownSkill('Legalese', 'Magic Damage', { cd: 8, v: { ratio: .94 }, p: { silence: 3.5 },
    desc: (S, P) => `Deals <em>${pcn(S.ratio * 100)}</em> Magic Damage to the closest enemy and Silences them for ${P.silence}s. A target already carrying a debuff is Silenced <em>45%</em> longer.`,
    cast: (u, B, S, P) => { const t = B.nearest(u, B.enemiesOf(u)); if (!t) return; const dur = P.silence * (t.statuses.some(s => STATUS[s.id] && STATUS[s.id].kind === 'debuff') ? 1.45 : 1); B.anim(u, 'cast', .3); B.after(.2, () => { B.damage(u, t, u.st.mag * S.ratio, { type: 'magic', tag: 'Legalese' }); B.applyStatus(u, t, 'silence', dur); }); }
  }),
  B: unknownSkill('Evil Eye', 'Magic Damage', { cd: 10, v: { ratio: 1.02 }, p: { dur: 6 },
    desc: (S, P) => `Targets the highest-Magic-Attack enemy for <em>${pcn(S.ratio * 100)}</em> Magic Damage and Blinds them for ${P.dur}s. Legal Eagle immediately gains a Shield worth <em>8%</em> max HP.`,
    cast: (u, B, S, P) => { const t = hitTarget(u, B, B.enemiesOf(u), 'mag'); if (!t) return; B.anim(u, 'cast', .32); B.after(.2, () => { B.damage(u, t, u.st.mag * S.ratio, { type: 'magic', tag: 'Evil Eye' }); B.applyStatus(u, t, 'blind', P.dur); B.shield(u, u, u.max.hp * .08, 4); }); }
  }),
  P: unknownSkill('Jargon', 'Passive', { p: { hits: 3, dur: 6 }, desc: (S, P) => `Every ${Math.round(P.hits)} basic attacks applies Confused Testimony for ${P.dur}s.`,
    passive: (u, B, S, P) => { u._unknownHits = 0; B.on(u, 'basicHit', ev => { if (!ev.target) return; u._unknownHits++; if (u._unknownHits >= P.hits) { u._unknownHits = 0; Sound.play('cog_jargon', { vol: .20, throttle: 950 }); B.applyStatus(u, ev.target, 'confusedtestimony', P.dur); } }); }
  }),
  R: unknownSkill('Obey the Pecking Order', 'Passive', { p: { dur: 3.5 }, desc: (S, P) => `Every 2.1s, if any enemy is debuffed, Legal Eagle gains 2 Fortify stacks for ${P.dur}s.`,
    passive: (u, B, S, P) => B.every(u, 2.1, () => { if (B.enemiesOf(u).some(e => e.statuses.some(s => STATUS[s.id] && STATUS[s.id].kind === 'debuff'))) B.applyStatus(u, u, 'fortify', P.dur, { stacks: 2 }); })
  })
});

allRounder('RobberBaron', 'Robber Baron', 'image-39.png', 'march', {
  W: unknownSkill('Power Trip', 'Magic Damage', { v: { ratio: .82 }, p: { slow: 6 }, desc: (S, P) => `Deals <em>${pcn(S.ratio * 100)}</em> Magic Damage to every enemy and Slows them for ${P.slow}s. The highest-Power enemy loses <em>32 Power</em>.`,
    cast: (u, B, S, P) => { const foes = B.enemiesOf(u); B.anim(u, 'cast', .44); B.after(.25, () => { foes.forEach(e => { B.damage(u, e, u.st.mag * S.ratio, { type: 'magic', area: true, tag: 'Power Trip' }); B.applyStatus(u, e, 'slow', P.slow); }); const t = B.highestEnergy(foes); if (t) B.energy(t, -32); }); }
  }),
  G: unknownSkill('Embezzle', 'Magic Damage', { cd: 8, v: { ratio: 1.08 }, desc: (S) => `Targets the highest-Power enemy for <em>${pcn(S.ratio * 100)}</em> Magic Damage, steals <em>36 Power</em>, removes 1 buff, and grants Robber Baron a <em>12%</em> max-HP Shield.`,
    cast: (u, B, S) => { const t = B.highestEnergy(B.enemiesOf(u)); if (!t) return; B.anim(u, 'cast', .3); B.after(.2, () => { B.energy(t, -36); B.energy(u, 30); B.dispel(t, 1); B.damage(u, t, u.st.mag * S.ratio, { type: 'magic', tag: 'Embezzle' }); B.shield(u, u, u.max.hp * .12, 5); }); }
  }),
  B: unknownSkill('Tee Off', 'Normal Damage', { cd: 9, v: { ratio: 1.06 }, p: { dur: 5 }, desc: (S, P) => `Knocks the farthest enemy back for <em>${pcn(S.ratio * 100)}</em> Normal Damage and reduces their Attack Speed for ${P.dur}s.`,
    cast: (u, B, S, P) => { const t = B.farthestN(u, B.enemiesOf(u), 1)[0]; if (!t) return; B.anim(u, 'cast', .3); B.after(.2, () => { B.damage(u, t, u.st.atk * S.ratio, { type: 'physical', tag: 'Tee Off' }); B.knockback(u, t, 90); B.applyStatus(u, t, 'armslow', P.dur); }); }
  }),
  P: unknownSkill('Synergy', 'Passive', { p: { hits: 3, dur: 5 }, desc: (S, P) => `After every ${Math.round(P.hits)} basic attacks, Robber Baron deals <em>28%</em> Magic Damage to all enemies and lowers Magic Defense for ${P.dur}s.`,
    passive: (u, B, S, P) => { u._unknownHits = 0; B.on(u, 'basicHit', () => { u._unknownHits++; if (u._unknownHits < P.hits) return; u._unknownHits = 0; Sound.play('cog_power_trip', { vol: .21, throttle: 950 }); B.enemiesOf(u).forEach(e => { B.damage(u, e, u.st.mag * .28, { type: 'magic', area: true, tag: 'Synergy' }); B.applyStatus(u, e, 'magdown', P.dur); }); }); }
  }),
  R: unknownSkill('Hostile Takeover', 'Passive', { p: { dur: 3 }, desc: (S, P) => `Whenever Robber Baron deals damage, he gains Fortify for ${P.dur}s.`, passive: (u, B, S, P) => B.on(u, 'dealDamage', ev => { if (ev.src !== u || !ev.target) return; B.applyStatus(u, u, 'fortify', P.dur); }) })
});

allRounder('PencilPusher', 'Pencil Pusher', 'pencilpusher.png', 'trudge', {
  W: unknownSkill('Write Off', 'Normal Damage', { v: { ratio: 1.22, execute: .55 }, desc: (S, P) => `Targets the lowest-HP enemy for <em>${pcn(S.ratio * 100)}</em> Normal Damage and lowers Defense for 6s. Below <em>${pc(S.execute)}</em> HP, Write Off deals <em>55%</em> more damage.`, cast: (u, B, S, P) => { const t = B.lowestHp(B.enemiesOf(u)); if (!t) return; B.anim(u, 'cast', .36); B.after(.22, () => { B.damage(u, t, u.st.atk * S.ratio * (t.hpPct < S.execute ? 1.55 : 1), { type: 'physical', tag: 'Write Off' }); B.applyStatus(u, t, 'defdown', 6); }); } }),
  G: unknownSkill('Rub Out', 'Magic Damage', { cd: 7, v: { ratio: .98 }, p: { dur: 6 }, desc: (S, P) => `Deals <em>${pcn(S.ratio * 100)}</em> Magic Damage to the closest enemy and lowers Attack for ${P.dur}s. If they were already debuffed, they also lose <em>24 Power</em>.`, cast: (u, B, S, P) => { const t = B.nearest(u, B.enemiesOf(u)); if (!t) return; const had = t.statuses.some(s => STATUS[s.id] && STATUS[s.id].kind === 'debuff'); B.anim(u, 'cast', .28); B.after(.18, () => { B.damage(u, t, u.st.mag * S.ratio, { type: 'magic', tag: 'Rub Out' }); B.applyStatus(u, t, 'attackdown', P.dur, { val: .2 }); if (had) B.energy(t, -24); }); } }),
  B: unknownSkill('Fountain Pen', 'Magic Damage', { cd: 9, v: { ratio: .92 }, p: { blind: 5 }, desc: (S, P) => `Sprays ink at the highest-Accuracy enemy for <em>${pcn(S.ratio * 100)}</em> Magic Damage and Blinds them for ${P.blind}s.`, cast: (u, B, S, P) => { const t = hitTarget(u, B, B.enemiesOf(u), 'acc'); if (!t) return; B.anim(u, 'cast', .3); B.after(.2, () => { B.damage(u, t, u.st.mag * S.ratio, { type: 'magic', tag: 'Fountain Pen' }); B.applyStatus(u, t, 'blind', P.blind); }); } }),
  P: unknownSkill('Finger Wag', 'Passive', { p: { hits: 3, dur: 4 }, desc: (S, P) => `Every ${Math.round(P.hits)} basic attacks scolds the target, reducing Attack Speed and Power gain for ${P.dur}s.`, passive: (u, B, S, P) => { u._unknownHits = 0; B.on(u, 'basicHit', ev => { if (!ev.target) return; u._unknownHits++; if (u._unknownHits >= P.hits) { u._unknownHits = 0; Sound.play('cog_guilt_trip', { vol: .20, throttle: 950 }); B.applyStatus(u, ev.target, 'armslow', P.dur); B.applyStatus(u, ev.target, 'drain', P.dur); } }); } }),
  R: unknownSkill('Fill With Lead', 'Passive', { p: { dur: 5 }, desc: (S, P) => `Basic attacks apply Lead Mark for ${P.dur}s.`, passive: (u, B, S, P) => B.on(u, 'basicHit', ev => { if (ev.target) B.applyStatus(u, ev.target, 'leadmark', P.dur); }) })
});

allRounder('BigWig', 'Big Wig', 'Bigwig.png', 'trudge', {
  W: unknownSkill('Throw Book', 'Normal Damage', { v: { ratio: 2.12 }, p: { convicted: 9 },
    desc: (S, P) => `<span class="sk-pas">Big Wig gains 9 Power when another unit debuffs an enemy, and 6 Power whenever an enemy casts below 12 Power.</span> Active: hits the highest-Power enemy for <em>${pcn(S.ratio * 100)}</em> Normal Damage, removes 1 buff, and applies Convicted for ${P.convicted}s.`,
    passive: (u, B, S) => { B.on(u, 'statusApplied', ev => { if (ev.src && ev.src !== u && ev.unit && ev.unit.team !== u.team && STATUS[ev.id] && STATUS[ev.id].kind === 'debuff') B.energy(u, 9); }); B.on(u, 'enemyCast', enemy => { if (enemy && enemy.energy < 12) B.energy(u, 6); }); },
    cast: (u, B, S, P) => { const t = B.highestEnergy(B.enemiesOf(u)); if (!t) return; B.anim(u, 'cast', .52); B.after(.34, () => { B.dispel(t, 1); B.damage(u, t, u.st.atk * S.ratio, { type: 'physical', tag: 'Throw Book' }); B.applyStatus(u, t, 'convicted', P.convicted); }); }
  }),
  G: unknownSkill('Quash', 'Magic Damage', { cd: 9, v: { ratio: .98 }, p: { silence: 3, sap: 6 },
    desc: (S, P) => `Slams a court order into every enemy for <em>${pcn(S.ratio * 100)}</em> Magic Damage and Silences them for ${P.silence}s. Already-debuffed enemies are Sapped for ${P.sap}s after the Silence.`,
    cast: (u, B, S, P) => { const foes = B.enemiesOf(u); B.anim(u, 'cast', .5); B.after(.3, () => foes.forEach(t => { const had = t.statuses.some(s => STATUS[s.id] && STATUS[s.id].kind === 'debuff'); B.damage(u, t, u.st.mag * S.ratio, { type: 'magic', area: true, tag: 'Quash' }); B.applyStatus(u, t, 'silence', P.silence); if (had) B.after(P.silence, () => { if (t.alive) B.applyStatus(u, t, 'sap', P.sap); }); })); }
  }),
  B: unknownSkill('Power Trip', 'Magic Damage', { cd: 10, v: { ratio: .94 }, p: { slow: 6 },
    desc: (S, P) => `Deals <em>${pcn(S.ratio * 100)}</em> Magic Damage to every enemy and lowers Speed and Attack Speed for ${P.slow}s. Removes 1 buff from the most-buffed enemy and grants Big Wig a <em>7%</em> max-HP Shield per enemy hit.`,
    cast: (u, B, S, P) => { const foes = B.enemiesOf(u); B.anim(u, 'cast', .46); B.after(.28, () => { foes.forEach(t => { B.damage(u, t, u.st.mag * S.ratio, { type: 'magic', area: true, tag: 'Power Trip' }); B.applyStatus(u, t, 'slow', P.slow); B.applyStatus(u, t, 'armslow', P.slow); }); const buffTarget = foes.slice().sort((a, b) => b.statuses.filter(s => STATUS[s.id] && STATUS[s.id].kind === 'buff').length - a.statuses.filter(s => STATUS[s.id] && STATUS[s.id].kind === 'buff').length)[0]; if (buffTarget) B.dispel(buffTarget, 1); B.shield(u, u, u.max.hp * (.07 * foes.length), 5); }); }
  }),
  P: unknownSkill('Finger Wag', 'Passive', { p: { hits: 3, dur: 5 },
    desc: (S, P) => `Every ${Math.round(P.hits)} basic attacks, hits the highest-Attack enemy for <em>70%</em> Normal Damage and lowers their Attack by <em>25%</em> for ${P.dur}s. Convicted targets are also Blinded and Sapped.`,
    passive: (u, B, S, P) => { u._bigWigHits = 0; B.on(u, 'basicHit', () => { u._bigWigHits++; if (u._bigWigHits < P.hits) return; u._bigWigHits = 0; const t = B.highestStat(B.enemiesOf(u), 'atk'); if (!t) return; Sound.play('cog_glower_power', { vol: .26, throttle: 850 }); B.damage(u, t, u.st.atk * .70, { type: 'physical', tag: 'Finger Wag' }); B.applyStatus(u, t, 'attackdown', P.dur, { val: .25 }); if (t.hasStatus('convicted')) { B.applyStatus(u, t, 'blind', P.dur); B.applyStatus(u, t, 'sap', P.dur); } }); }
  }),
  R: unknownSkill('Court Is in Session', 'Passive', {
    desc: (S, P) => `Every debuffed enemy grants Big Wig <em>10%</em> Defense, <em>10%</em> Magic Defense, and <em>5%</em> Skill Haste. If an enemy is Silenced, Sapped, or below 8 Power, Big Wig heals <em>7%</em> max HP every 2.7s and extends Convicted on the highest-Power Convicted enemy by 2.2s.`,
    passive: (u, B, S, P) => { u._courtDebuffs = 0; u._courtHealAt = -99; B.every(u, .55, () => { const foes = B.enemiesOf(u); const count = foes.filter(e => e.statuses.some(s => STATUS[s.id] && STATUS[s.id].kind === 'debuff')).length; if (count !== u._courtDebuffs) { u._courtDebuffs = count; u.flat.defP98 = count * .10; u.flat.mdefP98 = count * .10; u.flat.cdr98 = count * .05; u.dirty = true; } const controlled = foes.some(e => e.hasStatus('silence') || e.hasStatus('sap') || e.energy < 8); if (controlled && B.t - u._courtHealAt > 2.7) { u._courtHealAt = B.t; B.heal(u, u, u.max.hp * .07, { tag: 'Court Is in Session' }); const t = B.highestEnergy(foes); if (t && t.hasStatus('convicted')) { const s = t.getStatus('convicted'); s.t += 2.2; t.statusVersion++; } } }); }
  })
}, { name: 'Paperwork', type: 'physical', ratio: .96, range: 125, sfx: 'unknown_machine_attack', hit: 'hit_heavy', wind: .38 }, 'SS');
