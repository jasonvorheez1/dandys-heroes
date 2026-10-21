/* twisted.js - Twisted enemy forms, enemy-only casts, and boss definitions.
   A Twisted keeps its Hero's kit but gains corruption modifiers and sharper AI. */
'use strict';

/* Exact filenames in enemies/Twisteds (case matters on some hosts). */
const TWISTED_FILE = {
  Astro: 'Astro', Bassie: 'Bassie.webp', Blot: 'Blot', Bobette: 'Bobette', Boxten: 'Boxten',
  Brusha: 'Brusha', Brightney: 'Brightney.webp', Coal: 'Coal', Cocoa: 'Cocoa.webp',
  Connie: 'Connie', Cosmo: 'Cosmo', Dandy: 'Dandy', Dyle: 'Dyle', Eclipse: 'Eclipse.webp',
  Eggson: 'Eggson.webp', Finn: 'Finn', Gigi: 'Gigi', Ginger: 'Ginger', Goob: 'Goob',
  Gourdy: 'Gourdy', Looey: 'Looey', Pebble: 'Pebble', Poppy: 'Poppy', Rodger: 'Rodger',
  Rudie: 'Rudie', Scraps: 'Scraps', Shelly: 'Shelly', Sprout: 'Sprout',
  Squirm: 'Squirm.webp', Shrimpo: 'Shrimpo.webp', Teagan: 'Teagan', Tisha: 'Tisha',
  Toodles: 'Toodles', Vee: 'Vee', Yatta: 'Yatta', Delilah: 'Delilah', RnD: 'RnD',
  Waxwell: 'Waxwell', Glisten: 'Glisten', Flutter: 'Flutter'
};
/* Collaboration visitors are event challengers, never Gardenview Twisteds.
   Keep this explicit so a future generic enemy builder cannot manufacture a
   Twisted version just because the visitor has a playable Hero definition. */
const NON_TWISTED_IDS = new Set(['Sora', 'Riku', 'Kairi', 'Goofy', 'Phantasia', 'Ribecca', 'CheerbearShelly', 'BedtimeAstro', 'WishBearGigi', ...QOM_IDS]);
const TWISTED_IDS = Object.keys(TWISTED_FILE).filter(id => !NON_TWISTED_IDS.has(id));
const EVENT_ONLY_TWISTED = new Set(['Delilah']);

/* Twisteds the Depths treats as genuinely dangerous. */
const ELITE_TWISTED = ['Sprout', 'Vee', 'Shelly', 'Bobette', 'Astro', 'Dandy', 'Pebble', 'Dyle', 'Scraps', 'Goob', 'Waxwell'];

/* The dangerous Twisteds do not show up in the shallows. Debut floor is derived
   from the Hero's tier so it stays correct if a kit is ever re-tiered, with a
   few explicit overrides for the enemy-only heavyweights. */
const TIER_DEBUT = { F: 1, D: 1, C: 1, B: 2, A: 5, S: 8, SS: 12 };
const DEBUT_OVERRIDE = { Sprout: 14, Dandy: 12, Dyle: 11, Pebble: 10, Goob: 6, Waxwell: 9 };
// Combat tier and acquisition rarity are separate systems. Bobette and Gourdy
// are B-tier kits, but their Main Character status should not put them in the
// first tutorial rooms beside Common Twisteds.
const MAIN_CHARACTER_DEBUT = 10;

function twistedDebut(id) {
  if (DEBUT_OVERRIDE[id]) return DEBUT_OVERRIDE[id];
  const h = HEROES[id];
  if (!h) return 1;
  const combatDebut = TIER_DEBUT[h.tier] || 1;
  return obtainOf(id).rank >= OBTAIN.Main.rank
    ? Math.max(combatDebut, MAIN_CHARACTER_DEBUT)
    : combatDebut;
}

/** Twisted forms legal for a given depth.
    Rooms only need a couple of Twisteds now that Weaklings fill the rest, so a
    small shallow pool is fine and stops B-tier sustain tanks leaking into floor 1. */
function twistedPool(floor) {
  const all = TWISTED_IDS.filter(id => HEROES[id] && !EVENT_ONLY_TWISTED.has(id));
  const ok = all.filter(id => twistedDebut(id) <= floor);
  if (ok.length >= 2) return ok;
  return all.slice().sort((a, b) => twistedDebut(a) - twistedDebut(b)).slice(0, 4);
}

/* How often each obtainment rarity should turn up, by depth. Common Twisteds
   (obtainOf rank 0) start out plentiful and taper off; Main Character and
   Lethal forms (rank 3-4) are scarce near their debut floor and become the
   norm the deeper you go. Debut floor already keeps them off the shallows
   entirely - this only shapes frequency once they're eligible to appear.
   Index 0..4 = Common, Uncommon, Rare, Main, Lethal. */
const RANK_WEIGHT_SHALLOW = [5, 4, 3, 2, 1];
const RANK_WEIGHT_DEEP = [1, 2, 3, 4, 5];
const RANK_WEIGHT_FLOOR_SPAN = 34;  // floor at which the curve finishes sliding

function twistedRankWeight(id, floor) {
  const rank = obtainOf(id).rank;
  const p = clamp((floor - 1) / RANK_WEIGHT_FLOOR_SPAN, 0, 1);
  return lerp(RANK_WEIGHT_SHALLOW[rank], RANK_WEIGHT_DEEP[rank], p);
}

/* ============================================================ DANDY
   Attention and Neglect are individual records on every enemy, not a generic
   taunt. They make focusing Dandy and ignoring Dandy two different mistakes. */
function dandyRecord(u, B, target, id, max) {
  if (!target || !target.alive) return 0;
  const other = id === 'attention' ? 'neglect' : 'attention';
  const old = target.statuses.find(s => s.id === id && s.src === u);
  const before = old ? old.stacks : 0;
  target.statuses = target.statuses.filter(s => !(s.id === other && s.src === u));
  B.applyStatus(u, target, id, 999, { stacks: 1 });
  const now = target.statuses.find(s => s.id === id && s.src === u);
  if (now) now.stacks = Math.min(max, now.stacks);
  target.dirty = true;
  return { before, stacks: now ? now.stacks : 0 };
}
function dandyStacks(u, target, id) {
  const s = target && target.statuses.find(x => x.id === id && x.src === u);
  return s ? s.stacks : 0;
}
function dandySpendNeglect(u, target) {
  const s = target && target.statuses.find(x => x.id === 'neglect' && x.src === u);
  if (!s) return 0;
  s.stacks--;
  if (s.stacks <= 0) target.statuses.splice(target.statuses.indexOf(s), 1);
  target.dirty = true;
  return Math.max(0, s.stacks);
}
function dandyRestore(u, B, amount, opt) {
  if (!u || !u.alive || !Number.isFinite(amount) || amount <= 0) return 0;
  const missing = Math.max(0, u.max.hp - u.hp);
  if (!missing) return 0;
  // Player Dandy keeps the full sustain fantasy. Enemy/Twisted Dandy gets a
  // finite recovery budget so a high-level boss cannot heal forever from a
  // repeated Basic + Distortion loop after the Depths power rebalance. The
  // Phantasia event uses a shorter budget: its Dandy also carries the Lethal
  // Ward and is fought after two attrition waves, so the old 42% budget could
  // refill the entire final phase before the player's next damage window.
  const cap = u.twisted ? u.max.hp * (u.phantasiaBoss ? .24 : .30) : Infinity;
  const remaining = Math.max(0, cap - (u._dandyRecovery || 0));
  const healed = Math.min(missing, amount, remaining);
  if (healed <= 0) return 0;
  const applied = B.heal(u, u, healed, opt);
  if (u.twisted) u._dandyRecovery = (u._dandyRecovery || 0) + applied;
  return applied;
}

defHero({
  id: 'Dandy', name: 'Dandy', folder: 'Dandy', file: 'Dandy', icon: 'Dandy',
  role: 'Tank', tier: 'S', element: 'Attention',
  blurb: 'The mascot wants your attention. Ignoring him is the more dangerous choice.',
  base: { hp: 5650, atk: 380, def: 340, mag: 145, mdef: 315, spd: 110, acc: 214, eva: 116 },
  hidden: { range: 158, aspd: 1.03, ms: 78, aggro: 1.15, crit: .16, critDmg: 1.8, healPow: 1.05, shieldPow: 1,
    cdr: .08, ccRes: .28, kbRes: .48, armorPen: .18, magPen: .05 },
  growth: { hp: .098, atk: .094, def: .091, mag: .06, mdef: .088 },
  move: { gait: 'stomp', bob: 3, freq: 1.25, lean: 4, squash: .035, idle: 'wave', step: 'step_heavy',
    particles: 'dust', pcol: '#ffcf5a', trail: { on: false }, brake: .65 },
  basic: { name: 'Friendly Reminder', type: 'physical', ratio: 1.10, range: 158, pcol: '#ffd166',
    sfx: 'swing_heavy', hit: 'hit_blunt', wind: .28,
    onHit: (u, t, B) => {
      const maxed = u.hasStatus('distortion') || dandyStacks(u, t, 'neglect') >= (u.dandyMax || 5);
      if (maxed) B.damage(u, t, t.max.hp * (u.dandyMaxDmg || .035), { type: 'physical', melee: true, tag: 'Unforgettable' });
      if (u.hasStatus('distortion')) B.enemiesOf(u).filter(e => e !== t && Math.abs(e.x - t.x) < 135)
        .forEach(e => B.damage(u, e, u.st.atk * (u.dandySplashRatio || .45), { type: 'physical', melee: true, tag: 'Distorted Swing' }));
    } },
  skills: {
    W: { name: 'Center of Attention', type: 'Physical Damage / Max HP', energy: 100,
      v: { ratio: 2.30, restore: .05, heal: .085 }, p: { max: 5, loss: .07, stun: 1.1, kb: 118, hits: 4, energy: 25, finisher: 2.15 },
      desc: (S, P) => `<span class="sk-pas">Enemies that damage Dandy gain 👁 Attention; enemies that damage his allies gain ❗ Neglect instead. Attention reduces their damage to Dandy. Neglect makes Dandy hit them harder, and at ${P.max} stacks he hunts them. Max Attention restores <em>${pcn(S.restore * 100)}</em> Max HP; max Neglect grants <em>${Math.round(P.energy)}</em> Energy.</span> Active: pushes nearby enemies away, then hits the most Neglect target ${P.hits} times for <em>${pcn(S.ratio * 100)}</em> Attack, spending Neglect to restore <em>${pcn(S.heal * 100)}</em> missing HP per stack. A maximum-Neglect target takes a heavy final strike for <em>${pcn(S.ratio / P.hits * P.finisher * 100)}</em> Attack and is Stunned for ${P.stun}s.`,
      passive: (u, B, S, P) => {
        u.dandyMax = P.max; u._dandyLastHp = 1; u._dandyRecovery = 0;
        B.on(u, 'damaged', ev => {
          if (!ev.src || ev.src.team === u.team) return;
          ev.src._dandyLastHit = B.t;
          const rec = dandyRecord(u, B, ev.src, 'attention', P.max);
          if (rec.before < P.max && rec.stacks >= P.max) dandyRestore(u, B, u.max.hp * S.restore);
        });
        B.on(u, 'allyDamaged', ev => {
          if (!ev.src || ev.unit === u || !u.alive || u.flags.untargetable) return;
          const rec = dandyRecord(u, B, ev.src, 'neglect', P.max);
          u._dandyLastAllyAttacker = ev.src;
          if (rec.before < P.max && rec.stacks >= P.max) B.energy(u, P.energy);
        });
        B.every(u, .4, () => {
          const lost = u._dandyLastHp - u.hpPct;
          if (lost >= P.loss) B.enemiesOf(u).filter(e => e.target && e.target !== u).forEach(e => dandyRecord(u, B, e, 'neglect', P.max));
          u._dandyLastHp = u.hpPct;
        });
      },
      cast: (u, B, S, P) => {
        const foes = B.enemiesOf(u); if (!foes.length) return;
        B.dash(u, B.avgX(foes), .28);
        B.after(.3, () => {
          if (!u.alive) return;
          B.enemiesOf(u).filter(e => Math.abs(e.x - u.x) < 230).forEach(e => B.knockback(u, e, P.kb));
          const t = B.enemiesOf(u).slice().sort((a, b) => dandyStacks(u, b, 'neglect') - dandyStacks(u, a, 'neglect'))[0]; if (!t) return;
          const wasMax = dandyStacks(u, t, 'neglect') >= P.max;
          B.repeat(P.hits, .16, i => {
            if (!t.alive || !u.alive) return;
            const missing = u.max.hp - u.hp;
            B.fxSlash(u, t, { col: '#ffd166', ang: -35 + i * 22, big: i === P.hits - 1 });
            B.damage(u, t, u.st.atk * S.ratio / P.hits * (wasMax && i === P.hits - 1 ? P.finisher : 1), { type: 'physical', melee: true, tag: 'Center of Attention' });
            if (dandyStacks(u, t, 'neglect')) { dandySpendNeglect(u, t); dandyRestore(u, B, missing * S.heal); }
            if (wasMax && i === P.hits - 1) B.applyStatus(u, t, 'stun', P.stun);
          });
        });
      } },
    G: { name: 'Closing Time', type: 'Physical Damage / Armor', cd: 9,
      v: { ratio: 1.32, neglectBonus: .10 }, p: { range: 245, atk: .25, guard: .10, dur: 7, kb: 100, energy: 24, dr: 5, attentionKb: 20 },
      desc: (S, P) => `Clears nearby enemies for <em>${pcn(S.ratio * 100)}</em> Attack, Knockback, and reduces their Attack for ${P.dur}s. Dandy gains Armor and Magic Defense for each enemy hit. Attention is knocked farther; Neglect takes <em>${pcn(S.neglectBonus * 100)}</em> extra damage per stack and drains <em>${Math.round(P.energy)}</em> Energy. Hitting 3 enemies grants Damage Reduction for ${P.dr}s.`,
      ai: { prio: 58, cond: (u, B) => B.enemiesOf(u).some(e => Math.abs(e.x - u.x) < 250) },
      cast: (u, B, S, P) => {
        const hits = B.enemiesOf(u).filter(e => Math.abs(e.x - u.x) < P.range); if (!hits.length) return;
        B.anim(u, 'cast', .35); Sound.play('swing_heavy'); B.fxRing(u.x, u.y - 45, P.range, '#ffd166', .32);
        hits.forEach(e => {
          const attention = dandyStacks(u, e, 'attention'), neglect = dandyStacks(u, e, 'neglect');
          B.damage(u, e, u.st.atk * S.ratio * (neglect ? 1 + neglect * S.neglectBonus : 1), { type: 'physical', melee: true, tag: 'Closing Time' });
          B.knockback(u, e, P.kb + attention * P.attentionKb); B.applyStatus(u, e, 'weaken', P.dur, { stacks: 2 });
          if (neglect) B.energy(e, -P.energy);
        });
        B.applyStatus(u, u, 'fortify', P.dur, { stacks: Math.min(5, hits.length) });
        if (hits.length >= 3) B.applyStatus(u, u, 'composed', P.dr);
      } },
    B: { name: 'Keep Smiling', type: 'Physical Damage', cd: 10,
      v: { ratio: 1.60, shield: .45 }, p: { slow: 6, per: .20, shieldDur: 5 },
      desc: (S, P) => `Strikes the enemy that most recently hurt an ally for <em>${pcn(S.ratio * 100)}</em> Attack, reducing their Attack Speed for ${P.slow}s. Dandy removes Attack and Attack Speed debuffs from himself. Neglect adds <em>${pcn(P.per * 100)}</em> damage per stack and grants a <em>${pcn(S.shield * 100)}</em> Shield based on damage dealt for ${P.shieldDur}s.`,
      ai: { prio: 54, cond: (u) => !!(u._dandyLastAllyAttacker && u._dandyLastAllyAttacker.alive) },
      cast: (u, B, S, P) => {
        const t = u._dandyLastAllyAttacker && u._dandyLastAllyAttacker.alive ? u._dandyLastAllyAttacker : B.bestTarget(u); if (!t) return;
        B.anim(u, 'cast', .3); Sound.play('hit_blunt'); B.fxSlash(u, t, { col: '#fff2a5', big: true });
        const neglect = dandyStacks(u, t, 'neglect');
        const ev = B.damage(u, t, u.st.atk * S.ratio * (1 + neglect * P.per), { type: 'physical', melee: true, tag: 'Keep Smiling' });
        B.applyStatus(u, t, 'slow', P.slow, { stacks: 2 });
        ['weaken', 'slow', 'drowsy', 'groggy', 'disarm'].forEach(id => B.removeStatus(u, id));
        if (neglect && ev) B.shield(u, u, ev.amount * S.shield, P.shieldDur);
      } },
    P: { name: 'Everybody\'s Favorite', type: 'Attack / Defense',
      v: { atk: .065, def: .060 }, p: {},
      desc: (S) => `Dandy gains <em>${pcn(S.atk * 100)}</em> Attack for each ❗ Neglect stack across the enemy team and <em>${pcn(S.def * 100)}</em> Armor/Magic Defense for each 👁 Attention stack.`,
      passive: (u, B, S) => B.every(u, .25, () => {
        let attention = 0, neglect = 0;
        B.enemiesOf(u).forEach(e => { attention += dandyStacks(u, e, 'attention'); neglect += dandyStacks(u, e, 'neglect'); });
        u.flat.atkP2 = neglect * S.atk; u.flat.defP2 = attention * S.def; u.flat.mdefP2 = attention * S.def; u.dirty = true;
      }) },
    R: { name: 'You Didn\'t Forget Me, Did You?', type: 'Physical Damage / Max HP',
      v: { heal: .24, life: .035, splashRatio: .45, maxDmg: .035 }, p: { ignore: 3.0, thr: .40, dur: 7, max: 5 },
      desc: (S, P) => `Neglect grows on enemies that have not damaged Dandy recently. Maximum Neglect cuts Armor and rejects Move Speed. Once per wave below ${pc(P.thr)} HP with a maximum-Neglect enemy, Dandy distorts: he Cleanses, heals <em>${pcn(S.heal * 100)}</em> Max HP, gains Attack and Damage Reduction, ignores Stun/Knockback, and Basic Attacks restore <em>${pcn(S.life * 100)}</em> Max HP while splashing nearby enemies for <em>${pcn(S.splashRatio * 100)}</em> Attack. When it ends, all Neglect clears.`,
      passive: (u, B, S, P) => {
        u.dandySplashRatio = S.splashRatio; u.dandyMaxDmg = S.maxDmg;
        B.on(u, 'waveStart', () => { u._dandyDistorted = false; });
        B.every(u, P.ignore, () => B.enemiesOf(u).forEach(e => {
          // Neglect is meant to grow on anyone who keeps ignoring Dandy,
          // including an enemy that has not earned its first stack yet.
          if (B.t - (e._dandyLastHit || -999) > P.ignore) dandyRecord(u, B, e, 'neglect', P.max);
        }));
        B.on(u, 'basicHit', ev => {
          if (u.hasStatus('distortion') || dandyStacks(u, ev.target, 'neglect') >= P.max) dandyRestore(u, B, u.max.hp * S.life);
        });
        B.every(u, .22, () => {
          const maxed = B.enemiesOf(u).some(e => dandyStacks(u, e, 'neglect') >= P.max);
          u.immovable = u.hasStatus('distortion');
          if (u._dandyDistorted || u.hpPct >= P.thr || !maxed) return;
          u._dandyDistorted = true; B.cleanseAll(u); dandyRestore(u, B, u.max.hp * S.heal, { pure: true });
          B.applyStatus(u, u, 'distortion', P.dur); B.fxStatusOn(u, 'CurseEffect', { sizeMul: 1.2 }); Sound.play('warn');
          B.after(P.dur, () => {
            if (!u.alive) return;
            B.enemiesOf(u).forEach(e => { e.statuses = e.statuses.filter(s => !(s.id === 'neglect' && s.src === u)); e.dirty = true; });
            u._dandyDistorted = false; u.immovable = false;
          });
        });
      } }
  }
});

function pebbleFetch(u, B, S, P) {
  const allies = B.alliesOf(u), hurt = B.lowestHp(allies);
  if (!hurt) return;
  const red = !!u.pebbleGoodBoy;
  let kind, target, item, projectile, sfx;
  if (hurt.hpPct < P.healThr) {
    kind = 'heal'; target = hurt; item = red ? 'Medkit' : 'bandage';
    projectile = { kind: 'food', img: item }; sfx = red ? 'item_medkit' : 'item_bandage';
  } else if (u.hpPct < P.armorThr) {
    kind = 'armor'; target = u; item = red ? 'shield' : 'cardboard';
    projectile = { kind: red ? 'food' : 'obj', img: item, size: red ? 25 : 31 }; sfx = red ? 'guard' : 'cloth';
  } else {
    kind = 'speed';
    target = B.highestStat(allies, 'atk') || u; item = red ? 'Boxochocolates' : 'Speedcandy';
    projectile = { kind: 'food', img: item }; sfx = 'item_eat';
  }

  const origin = u.x, ownEdge = u.team === TEAM_P ? B.leftWall + 12 : B.rightWall - 12;
  B.anim(u, 'wind', .4); Sound.play('pebble_talk', { vol: .55 });
  B.fxFloatItem(u.x, u.y - 94, 'Trinkets/PEBBLE_Bone');
  B.dash(u, ownEdge, .20, { lean: 36 });
  B.after(.23, () => {
    if (!u.alive) return;
    Sound.play('item_pickup', { vol: .46 });
    if (projectile.kind === 'obj') B.fxFloatObject(u.x, u.y - 86, item, '#d4b98a');
    else B.fxFloatItem(u.x, u.y - 86, item);
    const returnX = target === u ? origin : clamp(target.x - u.face * 54, B.leftWall, B.rightWall);
    B.dash(u, returnX, .24, { lean: 34, onEnd: () => {
      if (!u.alive) return;
      const receiver = target.alive ? target : u;
      B.fxArc(u, receiver, projectile, () => {
        if (!receiver.alive) return;
        Sound.play(sfx, { vol: .55 });
        if (kind === 'heal') B.heal(u, receiver, receiver.max.hp * (red ? S.redHeal : S.heal), { tag: red ? 'Health Kit' : 'Bandage' });
        else if (kind === 'armor') {
          B.shield(u, u, u.max.hp * (red ? S.redShield : S.shield), P.itemDur);
          B.applyStatus(u, u, 'fortify', P.itemDur, { stacks: red ? 3 : 2 });
        } else {
          const fastest = red
            ? allies.filter(a => a.alive).sort((a, b) => b.st.atk - a.st.atk).slice(0, 3)
            : [...new Set([u, receiver])];
          fastest.forEach(a => {
            B.applyStatus(u, a, 'speedup', P.itemDur, { stacks: red ? 2 : 1 });
            B.applyStatus(u, a, 'atkup', P.itemDur, { stacks: red ? 2 : 1 });
            if (a !== receiver) B.fxFloatItem(a.x, a.y - 90, item);
          });
        }
        B.applyStatus(u, u, 'speedup', P.fetchSpeed, { stacks: 1 });
      });
    } });
  });
}

defHero({
  id: 'Pebble', name: 'Pebble', folder: 'Pebble', file: 'Pebble', icon: 'Pebble',
  role: 'Tank', tier: 'A', element: 'Stone',
  blurb: 'A tiny hyperactive tank who survives by making the entire enemy team fail to catch him.',
  base: { hp: 5620, atk: 345, def: 320, mag: 105, mdef: 275, spd: 142, acc: 185, eva: 210 },
  hidden: { range: 145, aspd: 1.10, ms: 126, aggro: 1.35, crit: .12, critDmg: 1.65, healPow: 1,
    shieldPow: 1.20, cdr: .08, ccRes: .25, kbRes: .45, armorPen: .10, magPen: 0 },
  growth: { hp: .102, atk: .080, def: .094, mag: .05, mdef: .088 },
  move: { gait: 'sprint', bob: 7, freq: 4.3, lean: 30, squash: .11, idle: 'pant', step: 'step',
    particles: 'dust', pcol: '#aeb4ba', trail: { on: true, col: '#d7dadd', rate: .045 }, brake: .96, dashy: true },
  basic: { name: 'Rocky Nudge', type: 'physical', ratio: .88, range: 145, pcol: '#aeb4ba',
    sfx: 'pebble_talk', hit: 'hit_blunt', wind: .12,
    onHit: (u, t, B) => { if (t.target === u) B.energy(u, 4); } },
  skills: {
    W: {
      name: 'Speak!', type: 'Physical Damage / Max HP', energy: 100,
      v: { ratio: 1.10, move: .09, eva: .08, stackMove: .018, stackArmor: .022, hp: .09, tauntEva: .10, heal: .018 },
      p: { max: 5, excitedDur: 6, stop: 2.6, enemySlow: .20, taunt: 4.5, drain: 16, kb: 75 },
      desc: (S, P) => `<span class="sk-pas">While moving, Pebble gains <em>${pcn(S.move * 100)}</em> Move Speed and <em>${pcn(S.eva * 100)}</em> Evasion. Every Dodge grants 🐾 Excited (max ${P.max}), adding Move Speed and Armor; stopping for ${P.stop}s clears it. Enemies targeting a moving Pebble lose ${pc(P.enemySlow)} Attack Speed.</span>
        Active: several barks Taunt every enemy for ${P.taunt}s and grant <em>${pcn(S.hp * 100)}</em> Max HP plus Evasion. Dodging during the Taunt drains ${P.drain} Energy from the attacker and heals Pebble. When it ends, he charges through the enemy team for <em>${pcn(S.ratio * 100)}</em> Attack, knocks them aside, then returns to where he started.`,
      passive: (u, B, S, P) => {
        u.pebbleExcitedMove = S.stackMove; u.pebbleExcitedArmor = S.stackArmor;
        u.pebbleSpeakHp = S.hp; u.pebbleSpeakEva = S.tauntEva; u._pebbleStill = 0;
        B.on(u, 'dodged', ev => {
          B.applyStatus(u, u, 'excited', P.excitedDur, { stacks: 1 });
          B.fxFloatIcon(u.x, u.y - 86, '🐾');
          if (u.hasStatus('loudandproud')) {
            if (ev.src) B.energy(ev.src, -P.drain);
            B.heal(u, u, u.max.hp * S.heal, { silent: true, tag: 'Speak! Dodge' });
          }
        });
        B.every(u, .2, () => {
          u.flat.msP4 = u.moving ? S.move : 0; u.flat.evaP4 = u.moving ? S.eva : 0;
          u._pebbleStill = u.moving ? 0 : u._pebbleStill + .2;
          if (u._pebbleStill >= P.stop) B.removeStatus(u, 'excited');
          if (u.moving) B.enemiesOf(u).filter(e => e.target === u)
            .forEach(e => B.applyStatus(u, e, 'chasingpebble', .35, { val: P.enemySlow }));
          u.dirty = true;
        });
      },
      cast: (u, B, S, P) => {
        const origin = u.x, foes = B.enemiesOf(u).slice(); if (!foes.length) return;
        B.anim(u, 'cast', .72); B.applyStatus(u, u, 'loudandproud', P.taunt);
        foes.forEach(e => B.applyStatus(u, e, 'taunt', P.taunt));
        [0, .24, .48].forEach((delay, i) => B.after(delay, () => {
          if (!u.alive) return;
          Sound.play(i ? 'pebble_talk' : 'pebble_speak', { vol: i ? .5 : .66, throttle: 100 });
          B.fxBark(u, 3 + i, i === 2 ? '#f4d27a' : '#d9dde2'); B.shake(2.2, .1);
        }));
        B.after(P.taunt, () => {
          if (!u.alive) return;
          const living = foes.filter(e => e.alive); if (!living.length) return;
          if (u.pebbleGoodBoy) living.forEach(e => B.applyStatus(u, e, 'goodboyguard', u.pebbleGuardDur || 5));
          const end = u.team === TEAM_P ? B.rightWall - 22 : B.leftWall + 22;
          u.face = end > u.x ? 1 : -1;
          Sound.play('dash', { vol: .5 });
          B.dash(u, end, .44, { lean: 42, onEnd: () => { if (u.alive) B.dash(u, origin, .36, { lean: 34 }); } });
          living.forEach((e, i) => B.after(.16 + i * .045, () => {
            if (!u.alive || !e.alive) return;
            Sound.play('hit_blunt', { vol: .4, throttle: 75 });
            B.damage(u, e, u.st.atk * S.ratio, { type: 'physical', melee: true, tag: 'Speak! Run' });
            B.knockback(u, e, P.kb); B.fxCrackAt(e.x, e.y);
          }));
        });
      }
    },
    G: {
      name: 'Fetch!', type: 'Healing / Shield', cd: 9,
      v: { heal: .08, redHeal: .12, shield: .08, redShield: .12 },
      p: { healThr: .58, armorThr: .68, itemDur: 8, fetchSpeed: 5 },
      desc: (S, P) => `Pebble sniffs out a real Item: a Bandage heals the lowest ally below ${pc(P.healThr)} HP; Cardboard Armor Shields Pebble below ${pc(P.armorThr)} HP; otherwise Speed Candy raises Pebble and the strongest ally's Attack and Movement Speed. Fetching always gives Pebble a short speed burst.`,
      ai: { prio: 60, cond: () => true },
      cast: (u, B, S, P) => pebbleFetch(u, B, S, P)
    },
    B: {
      name: 'Rocky Tackle', type: 'Physical Damage', cd: 9.5,
      v: { ratio: .95, shield: .08 }, p: { stun: 1.35, kb: 78, revenge: 1.45, grief: 4 },
      desc: (S, P) => `Charges the enemy with the highest Attack twice for <em>${pcn(S.ratio * 100)}</em> total Attack, circling them between hits. The first hit Knocks Back and the second Stuns for ${P.stun}s, strips one removable buff, and applies 🥺 Grief for ${P.grief}s, reducing Healing Received. If they were attacking Pebble, the second hit deals ${pc(P.revenge - 1)} more damage and Pebble gains a Max HP Shield.`,
      ai: { prio: 57, cond: () => true },
      cast: (u, B, S, P) => {
        const t = B.highestStat(B.enemiesOf(u), 'atk'); if (!t) return;
        const revenge = t.target === u;
        B.anim(u, 'wind', .36); Sound.play('pebble_talk', { vol: .48 });
        u.face = t.x > u.x ? 1 : -1;
        B.dash(u, t.x - u.face * 42, .24, { lean: 40, depth: t.depth, onEnd: () => {
          if (!u.alive || !t.alive) return;
          Sound.play('hit_blunt', { vol: .52 }); B.shake(4, .14); B.fxCrackAt(t.x, t.y);
          B.damage(u, t, u.st.atk * S.ratio * .35, { type: 'physical', melee: true, tag: 'Rocky Tackle I' });
          B.knockback(u, t, P.kb); B.fxRing(t.x, t.y - 32, 92, '#c6cbd0', .38);
          const circle = clamp(t.x + u.face * 115, B.leftWall, B.rightWall);
          B.dash(u, circle, .30, { arc: true, onEnd: () => {
            if (!u.alive || !t.alive) return;
            u.face = t.x > u.x ? 1 : -1;
            B.dash(u, t.x - u.face * 34, .20, { lean: 44, depth: t.depth, onEnd: () => {
              if (!u.alive || !t.alive) return;
              Sound.play('hit_heavy', { vol: .58 }); B.hitstop(75); B.shake(5, .18);
              B.damage(u, t, u.st.atk * S.ratio * .65 * (revenge ? P.revenge : 1), { type: 'physical', melee: true, tag: 'Rocky Tackle II' });
              B.applyStatus(u, t, 'stun', P.stun); B.dispel(t, 1); B.applyStatus(u, t, 'grief', P.grief); B.fxCrackAt(t.x, t.y);
              if (revenge) B.shield(u, u, u.max.hp * S.shield, 6);
            } });
          } });
        } });
      }
    },
    P: {
      name: 'Small Target', type: 'Evasion / Armor',
      v: { area: .10, energy: 8 }, p: { every: 4, accDur: 5 },
      desc: (S, P) => `Area damage is reduced by <em>${pcn(S.area * 100)}</em>. After every ${P.every} Basic Attacks aimed at Pebble, he automatically Dodges the next direct Basic Attack or Skill. Every Dodge reduces the attacker's Accuracy for ${P.accDur}s; at maximum Excited stacks it also restores <em>${Math.round(S.energy)}</em> Energy. Guaranteed hits still bypass this.`,
      passive: (u, B, S, P) => {
        u._pebbleBasics = 0; u._pebbleAutoDodge = false; u._pebbleCountAt = -Infinity;
        u.dodgeGuard = ev => {
          if (ev.area) return false;
          if (u._pebbleAutoDodge) { u._pebbleAutoDodge = false; return true; }
          if (ev.basic && B.t - u._pebbleCountAt > .22) {
            u._pebbleCountAt = B.t;
            if (++u._pebbleBasics >= P.every) { u._pebbleBasics = 0; u._pebbleAutoDodge = true; B.fxFloatIcon(u.x, u.y - 92, '🐾'); }
          }
          return false;
        };
        B.on(u, 'damaged', ev => { if (ev.area) ev.amount *= 1 - S.area; });
        B.on(u, 'dodged', ev => {
          if (ev.src) B.applyStatus(u, ev.src, 'rattledaim', P.accDur);
          const excited = u.getStatus('excited');
          if (excited && excited.stacks >= 5) B.energy(u, S.energy);
        });
      }
    },
    R: {
      name: 'Good Boy!', type: 'Max HP / Armor / Physical Damage',
      v: { dr: .10, per: .022 }, p: { guard: 5, thr: .45, cd: 8 },
      desc: (S, P) => `Speak! grants <em>${pcn(S.dr * 100)}</em> Damage Reduction, and former Taunt targets deal 30% less damage to Pebble's allies for ${P.guard}s. Fetch! upgrades to Health Kits, stronger armor, or Box o' Chocolates for multiple allies. Below ${pc(P.thr)} HP, Pebble immediately reaches maximum Excited and cleanses movement penalties (every ${P.cd}s). He gains <em>${pcn(S.per * 100)}</em> Attack per enemy targeting him.`,
      passive: (u, B, S, P) => {
        u.pebbleGoodBoy = true; u.pebbleSpeakDR = S.dr; u.pebbleGuardDur = P.guard; u._goodBoyAt = -Infinity;
        B.on(u, 'waveStart', () => { u._goodBoyAt = -Infinity; });
        B.every(u, .2, () => {
          const hunters = B.enemiesOf(u).filter(e => e.target === u).length;
          u.flat.atkP8 = hunters * S.per;
          if (u.hpPct < P.thr && B.t - u._goodBoyAt >= P.cd) {
            u._goodBoyAt = B.t;
            B.applyStatus(u, u, 'excited', 6, { stacks: 5 });
            ['slow', 'sticky', 'tangled'].forEach(id => B.removeStatus(u, id));
            Sound.play('pebble_speak', { vol: .58 }); B.fxBark(u, 4, '#f4d27a');
          }
          u.dirty = true;
        });
      }
    }
  }
});

/* Dyle, Gigi and Pebble are now real playable Heroes. Their TWISTED_FILE
   entries above still point makeTwisted() at enemies/Twisteds
   art, which works unchanged since it only needs HEROES[id] to exist. */

/* Lighter enemy-only casts. Full kits, tuned to be readable threats rather than
   stat-sticks - they still telegraph and still have counters. */
function quickCastDef(o) {
  return {
    id: o.id, name: o.id, folder: null, file: null, icon: o.icon || o.id, twistedOnly: true,
    role: o.role, tier: o.tier, element: o.element, blurb: o.blurb,
    base: o.base, hidden: o.hidden, growth: o.growth || { hp: .09, atk: .09, def: .082, mag: .086, mdef: .08 },
    move: o.move, basic: o.basic, skills: o.skills
  };
}
function quickCast(o) { return defHero(quickCastDef(o)); }

const TWISTED_GOOB_DEF = quickCastDef({
  id: 'Goob', icon: 'Goob', role: 'Tank', tier: 'A', element: 'Hug',
  blurb: 'It only ever wanted a hug. It has stopped taking no for an answer.',
  base: { hp: 6300, atk: 300, def: 345, mag: 175, mdef: 285, spd: 90, acc: 168, eva: 78 },
  hidden: { range: 180, aspd: .8, ms: 60, aggro: 2.2, crit: .06, critDmg: 1.5, healPow: 1, shieldPow: 1.3, cdr: 0, ccRes: .4, kbRes: .9, armorPen: .05, magPen: 0 },
  move: { gait: 'stomp', bob: 4, freq: 1.1, lean: 4, squash: .09, idle: 'breathe', step: 'step_heavy',
    particles: 'dust', pcol: '#b09fd0', trail: { on: false }, brake: .8, weight: 1.5, shakeStep: 2 },
  // Twisted Goob keeps its enemy chassis and corruption scaling, but fights
  // with the real Goob kit. This removes the old mass pull/root, stacking
  // proximity DR, AoE taunt/sticky and death-root override.
  basic: HEROES.Goob.basic,
  skills: HEROES.Goob.skills
});
if (!HEROES.Goob) defHero(TWISTED_GOOB_DEF);

/* Twisted Waxwell uses Waxwell's remote-control kit throughout the fight.
   The stored frustration still makes its enemy body escalate when it becomes
   the final Twisted alive, but it must remain an active threat before then. */
const WAXWELL_WHITE = HEROES.Waxwell.skills.W;
const TWISTED_WAXWELL_DEF = quickCastDef({
  id: 'Waxwell', icon: 'Waxwell', role: 'Control', tier: 'S', element: 'Wax',
  blurb: 'A corrupted wick that sketches wax and flame across the battlefield. When alone, it burns far brighter.',
  base: { hp: 5750, atk: 180, def: 278, mag: 430, mdef: 330, spd: 104, acc: 220, eva: 105 },
  hidden: { range: 350, aspd: .92, ms: 58, aggro: .38, crit: .10, critDmg: 1.65, healPow: 1,
    shieldPow: 1, cdr: .12, ccRes: .34, kbRes: .62, armorPen: 0, magPen: .24 },
  move: { gait: 'stalk', bob: 2, freq: .8, lean: 2, squash: .03, idle: 'flicker', step: 'step_heavy',
    particles: 'sparkle', pcol: '#e7542f', trail: { on: true, col: '#6a251d', rate: .10 }, brake: .8, weight: 1.4 },
  basic: { name: 'Last Wick', type: 'magic', ratio: 1.18, range: 350, proj: 'orb', pcol: '#e7542f',
    sfx: 'whoosh', hit: 'hit_magic', wind: .24,
    onHit: (u, t, B) => { B.applyStatus(u, t, 'burn', 5, { stacks: 2, val: u.st.mag * .065 }); B.applyStatus(u, t, 'litup', 5); } },
  skills: Object.assign({}, HEROES.Waxwell.skills, {
    W: Object.assign({}, WAXWELL_WHITE, {
      passive: (u, B, S, P) => {
        WAXWELL_WHITE.passive(u, B, S, P);
        B.every(u, .2, () => {
          if (u._waxwellAwake || B.alliesOf(u).some(a => a !== u && a.alive)) return;
          u._waxwellAwake = true;
          u.flat.magP9 = .52; u.flat.cdr9 = .35; u.flat.dmgTaken9 = -.18; u.dirty = true;
          u.energy = u.energyMax;
          B.applyStatus(u, u, 'twistedrage', 999, { stacks: 6 });
          B.fxRing(u.x, u.y - 45, 230, '#e7542f', .75); B.shake(14, .55);
          B.enemiesOf(u).forEach(e => waxwellAddZone(u, B, 'soft', e.x, 78, 9, e.y));
          B.log('<b>Twisted Waxwell</b> is the last wick standing.');
        });
      }
    })
  })
});

const TWISTED_DEF_OVERRIDE = { Goob: TWISTED_GOOB_DEF, Waxwell: TWISTED_WAXWELL_DEF };

quickCast({
  id: 'Teagan', icon: 'Teagan', role: 'Support', tier: 'B', element: 'Brew',
  blurb: 'Serves tea. The tea is doing something.',
  base: { hp: 3900, atk: 195, def: 232, mag: 300, mdef: 285, spd: 106, acc: 172, eva: 112 },
  hidden: { range: 265, aspd: .9, ms: 66, aggro: .75, crit: .07, critDmg: 1.5, healPow: 1.35, shieldPow: 1.2, cdr: .1, ccRes: .2, kbRes: .3, armorPen: 0, magPen: .05 },
  move: { gait: 'waddle', bob: 5, freq: 1.4, lean: 4, squash: .06, idle: 'pour', step: 'step_soft',
    particles: 'steam', pcol: '#9be36b', trail: { on: false }, brake: .35 },
  basic: { name: 'Hot Pour', type: 'magic', ratio: .92, range: 265, proj: 'orb', pcol: '#9be36b',
    sfx: 'whoosh', hit: 'hit_water', wind: .22, onHit: (u, t, B) => B.applyStatus(u, t, 'poison', 5, { val: u.st.mag * .05 }) },
  skills: {
    W: { name: 'Steeped', type: 'Healing', energy: 100, v: { heal: 1.1 }, p: { dur: 12 },
      desc: (S, P) => `<span class="sk-pas">Teagan's healing also cleanses one debuff.</span>
        Active: the team heals <em>${pcn(S.heal * 100)}</em> Magic and gains 💚 Regeneration and 🌞 Inspire for ${P.dur}s. Every enemy is ☠ Poisoned.`,
      passive: (u, B) => { B.on(u, 'healDone', ev => B.cleanse(ev.target, 1)); },
      cast: (u, B, S, P) => { B.anim(u, 'cast', .45); Sound.play('heal'); B.tint('#4a6b2a', .2, .5);
        B.alliesOf(u).forEach(a => { B.heal(u, a, u.st.mag * S.heal); B.applyStatus(u, a, 'regen', P.dur, { val: u.st.mag * .12 }); B.applyStatus(u, a, 'inspire', P.dur); });
        B.enemiesOf(u).forEach(e => B.applyStatus(u, e, 'poison', P.dur, { stacks: 4, val: u.st.mag * .07 })); } },
    G: { name: 'Refill', type: 'Healing', cd: 8, v: { heal: .8 }, p: {},
      desc: (S) => `Heals the two weakest allies for <em>${pcn(S.heal * 100)}</em> Magic.`,
      ai: { prio: 60, cond: (u, B) => B.alliesOf(u).some(a => a.hp / a.max.hp < .9) },
      cast: (u, B, S) => B.alliesOf(u).sort((a, b) => a.hp / a.max.hp - b.hp / b.max.hp).slice(0, 2)
        .forEach(t => { Sound.play('heal', { vol: .6 }); B.heal(u, t, u.st.mag * S.heal); B.fxSteam(t.x, t.y - 30, 8); }) },
    B: { name: 'Bitter Blend', type: 'Debuff', cd: 13, v: { ratio: .85 }, p: { dur: 8 },
      desc: (S, P) => `<em>${pcn(S.ratio * 100)}</em> Magic to all enemies with 🥺 Grief and 🥀 Weaken for ${P.dur}s.`,
      ai: { prio: 48, cond: () => true },
      cast: (u, B, S, P) => B.enemiesOf(u).forEach(e => { B.damage(u, e, u.st.mag * S.ratio, { type: 'magic', tag: 'Bitter Blend' });
        B.applyStatus(u, e, 'grief', P.dur); B.applyStatus(u, e, 'weaken', P.dur, { stacks: 2 }); }) },
    P: { name: 'Warm Cup', type: 'Healing', v: { hpow: .28 }, p: {},
      desc: (S) => `Healing Power +<em>${pcn(S.hpow * 100)}</em>.`, passive: (u, B, S) => { u.flat.healPowP = S.hpow; } },
    R: { name: 'One More Round', type: 'Revival', v: { hp: .35 }, p: {},
      desc: (S) => `Once per battle, the first ally defeated is brought back at <em>${pc(S.hp)}</em> HP with full Energy.`,
      passive: (u, B, S) => { B.on(u, 'allyLethal', ev => { if (u._round || ev.unit === u) return; u._round = true;
        ev.prevented = true; ev.unit.hp = ev.unit.max.hp * S.hp; ev.unit.energy = 100;
        Sound.play('cleanse'); B.fxRing(ev.unit.x, ev.unit.y - 40, 160, '#9be36b'); B.log('<b>' + ev.unit.name + ' gets one more round.</b>'); }); } }
  }
});

if (!HEROES.Tisha) quickCast({
  id: 'Tisha', icon: 'Tisha', role: 'Control', tier: 'B', element: 'Clean',
  blurb: 'Tidies up. Does not distinguish between mess and people.',
  base: { hp: 3800, atk: 300, def: 245, mag: 268, mdef: 245, spd: 122, acc: 190, eva: 148 },
  hidden: { range: 235, aspd: 1.08, ms: 82, aggro: .9, crit: .14, critDmg: 1.6, healPow: 1, shieldPow: 1, cdr: .1, ccRes: .18, kbRes: .35, armorPen: .12, magPen: .1 },
  move: { gait: 'sprint', bob: 6, freq: 2.8, lean: 16, squash: .07, idle: 'sweep', step: 'step',
    particles: 'dust', pcol: '#7be0ff', trail: { on: true, col: '#7be0ff', rate: .07 }, brake: .5 },
  basic: { name: 'Sweep', type: 'physical', ratio: 1.0, range: 235, sfx: 'swing_pole', hit: 'hit_light',
    wind: .16, onHit: (u, t, B) => { if (chance(.3)) B.dispel(t, 1); } },
  skills: {
    W: { name: 'Deep Clean', type: 'Physical Damage', energy: 100, v: { ratio: 1.55 }, p: { kb: 130 },
      desc: (S, P) => `<span class="sk-pas">Tisha's hits strip one buff from the target.</span>
        Active: she sweeps the whole field for <em>${pcn(S.ratio * 100)}</em> Attack, removes every buff from every enemy, and knocks them back ${P.kb}.`,
      passive: () => {},
      cast: (u, B, S, P) => { B.anim(u, 'cast', .45); Sound.play('swing_double');
        B.after(.3, () => { Sound.play('hit_blunt'); B.shake(13, .4); B.hitstop(90);
          B.enemiesOf(u).forEach(e => { B.damage(u, e, u.st.atk * S.ratio, { type: 'physical', tag: 'Deep Clean' });
            B.dispelAll(e); B.knockback(u, e, P.kb); B.fxSlash(u, e, { col: '#7be0ff', ang: 10, big: true }); }); }); } },
    G: { name: 'Scrub', type: 'Physical Damage', cd: 8, v: { ratio: 1.2 }, p: { dur: 6 },
      desc: (S, P) => `Hits the nearest enemy for <em>${pcn(S.ratio * 100)}</em> Attack, removes a buff and applies 💔 Defense Down for ${P.dur}s.`,
      ai: { prio: 58, cond: () => true },
      cast: (u, B, S, P) => { const t = B.nearest(u, B.enemiesOf(u)); if (!t) return;
        Sound.play('swing_pole'); B.fxSlash(u, t, { col: '#7be0ff', ang: -20 });
        B.damage(u, t, u.st.atk * S.ratio, { type: 'physical', tag: 'Scrub' });
        B.dispel(t, 2); B.applyStatus(u, t, 'defdown', P.dur, { stacks: 2 }); } },
    B: { name: 'Wet Floor', type: 'Control', cd: 14, v: { ratio: .55 }, p: { dur: 7 },
      desc: (S, P) => `The enemy half becomes slick for ${P.dur}s: <em>${pcn(S.ratio * 100)}</em> Attack, 🐢 Slow, and moving enemies risk being 😵 Stunned.`,
      ai: { prio: 47, cond: () => true },
      cast: (u, B, S, P) => { const cx = B.avgX(B.enemiesOf(u)); B.fxPool(cx, P.dur, '#7be0ff');
        Sound.play('hit_water');
        B.enemiesOf(u).forEach(e => { B.damage(u, e, u.st.atk * S.ratio, { type: 'physical', tag: 'Wet Floor' });
          B.applyStatus(u, e, 'slow', P.dur, { stacks: 2 }); });
        B.repeat(P.dur * 2, .5, () => B.enemiesOf(u).forEach(e => {
          if (e.moving && Math.abs(e.x - cx) < 240 && chance(.25) && !e.hasStatus('stun')) B.applyStatus(u, e, 'stun', 1.4); })); } },
    P: { name: 'Spotless', type: 'Anti-Buff', v: { dmg: .25 }, p: {},
      desc: (S) => `Tisha deals <em>${pcn(S.dmg * 100)}</em> more damage to enemies with no buffs remaining.`,
      passive: (u, B, S) => { B.on(u, 'dealDamage', ev => {
        if (!ev.target.statuses.some(s => STATUS[s.id].kind === 'buff')) ev.amount *= 1 + S.dmg; }); } },
    R: { name: 'Nothing Sticks', type: 'Cleanse', v: {}, p: { every: 5 },
      desc: (S, P) => `Every ${P.every}s Tisha cleanses one debuff from every ally and gains 🎯 Accuracy Up.`,
      passive: (u, B, S, P) => { B.every(u, P.every, () => { B.alliesOf(u).forEach(a => B.cleanse(a, 1));
        B.applyStatus(u, u, 'accup', P.every); }); } }
  }
});

/* ============================================================ TWISTED WRAPPER */
/* Corruption profiles applied on top of the base Hero kit. */
const TWIST_MODS = {
  normal: { hp: 1.00, atk: 1.00, def: 1.00, label: '', aura: null },
  elite: { hp: 1.30, atk: 1.16, def: 1.12, label: 'Elite', aura: 'twistedrage' },
  // Bosses are long fights; Lethal bosses receive a second, explicit layer below.
  boss: { hp: 2.40, atk: 1.05, def: 1.22, label: 'Boss', aura: null }
};

/** Build a combat spec for a Twisted enemy. Level, stars and the visible room
    kind provide its stats; rarity only gates learned skills, just like a Hero.
    Character obtainment rank must never become an invisible stat multiplier. */
function makeTwisted(id, level, kind, extra) {
  if (NON_TWISTED_IDS.has(id)) return null;
  const base = HEROES[id];
  if (!base) return null;
  const training = enemyTraining(id, level, kind || 'normal', `${id}-${kind || 'normal'}`);
  const mod = TWIST_MODS[kind || 'normal'];
  // Dandy's kit already supplies layered mitigation and sustain. Keep the
  // identity of a Lethal boss without multiplying those mechanics by the
  // full generic boss HP/Defense package.
  const dandyBossScale = kind === 'boss' && id === 'Dandy'
    ? { hp: .78, atk: .96, def: .90 }
    : { hp: 1, atk: 1, def: 1 };
  const lethalBoss = kind === 'boss' && obtainOf(id).rank === OBTAIN.Lethal.rank;
  const elite = ELITE_TWISTED.includes(id);
  const rarityTier = kind === 'boss' ? (level >= 220 ? 6 : 5) : elite ? clamp(4 + Math.floor(level / 220), 4, 6) : clamp(2 + Math.floor(level / 90), 1, 6);
  const altClass = Object.keys(CLASSES).find(k => k !== training.cls);
  const altSubclass = Object.keys(SUBCLASSES).find(k => k !== training.subcls);
  return Object.assign({
    id, twisted: true, kind: kind || 'normal',
    defOverride: TWISTED_DEF_OVERRIDE[id] || null,
    name: 'Twisted ' + base.name,
    level: level,
    rarity: rarityTier,
    rarityPlus: kind === 'boss' ? (rarityTier >= 6 ? 30 : 20) : rarityPlusForLevel(level, rarityTier, `${id}-${kind || 'normal'}`),
    stars: kind === 'boss' ? 5 : clamp(1 + Math.floor(level / 70), 1, 5),
    skillLv: enemySkillLevel(level * (lethalBoss ? 1.15 : 1), kind === 'boss' ? 'boss' : kind === 'elite' || elite ? 'elite' : 'normal'),
    mult: {
      hp: mod.hp * dandyBossScale.hp,
      atk: mod.atk * dandyBossScale.atk,
      def: mod.def * dandyBossScale.def
    },
    aura: mod.aura, elite: elite || kind !== 'normal', lethalBoss,
    cls: training.cls, subcls: training.subcls,
    classRank: training.classRank, subclassRank: training.subclassRank,
    cls2: rarityTier >= 6 ? altClass : null, subcls2: rarityTier >= 6 ? altSubclass : null,
    classRank2: rarityTier >= 6 ? 1 : 0, subclassRank2: rarityTier >= 6 ? 1 : 0
  }, extra || {});
}

/* ============================================================ BOSSES */
/* Bosses arrive every 5 floors with phases and a field-wide gimmick. */
const BOSSES = [
  {
    id: 'Dandy', title: 'The Shopkeeper', floors: [20, 40, 45],
    intro: 'Dandy would like a word about your outstanding balance.',
    phases: [
      { at: 1.00, name: 'Open For Business', mods: {} },
      { at: 0.74, name: 'Price Hike', mods: { atkP: .36, aspdP: .24, dmgTaken: -.10 },
        onEnter: (b, B) => { Sound.play('warn'); B.enemiesOf(b).forEach(e => B.applyStatus(b, e, 'drain', 5)); } },
      { at: 0.48, name: 'Final Notice', mods: { atkP: .62, aspdP: .42, cdr: .25, dmgTaken: -.18 },
        onEnter: (b, B) => { Sound.play('warn'); B.tint('#5a2b00', .4, 1);
          B.enemiesOf(b).forEach(e => B.applyStatus(b, e, 'ichorburn', 12, { stacks: 4, val: b.st.mag * .09 })); } },
      { at: 0.20, name: 'Everything Must Go', mods: { atkP: 1.05, cdr: .65, dmgTaken: -.30 },
        onEnter: (b, B) => { Sound.play('suddendeath'); B.shake(24, 1); B.flash('#ffd166', .7, .5);
          B.summonAdds(b, ['Goob', 'Gigi'], 3); } }
    ]
  },
  {
    id: 'Sprout', title: 'The Overgrowth', floors: [10, 30, 50],
    intro: 'It has been growing down here for a long time.',
    phases: [
      { at: 1.00, name: 'Rooted', mods: {} },
      { at: 0.65, name: 'Spreading', mods: { aspdP: .3, msP: .3 },
        onEnter: (b, B) => { Sound.play('grow'); B.tint('#2c5a2c', .4, 1);
          B.enemiesOf(b).forEach(e => B.applyStatus(b, e, 'root', 3)); } },
      { at: 0.30, name: 'Full Bloom', mods: { atkP: .60, hpRegen: .02 },
        onEnter: (b, B) => { Sound.play('quake'); B.shake(22, .9); B.summonAdds(b, ['Pebble'], 2); } }
    ]
  },
  {
    id: 'Vee', title: 'The Broadcast', floors: [5, 25],
    intro: 'You are live. Try to look presentable.',
    phases: [
      { at: 1.00, name: 'On Air', mods: {} },
      { at: 0.55, name: 'Ratings Drop', mods: { atkP: .35, cdr: .4 },
        onEnter: (b, B) => { Sound.play('flash'); B.flash('#fff', .9, .4);
          B.enemiesOf(b).forEach(e => B.applyStatus(b, e, 'blind', 6)); } },
      { at: 0.20, name: 'Emergency Broadcast', mods: { atkP: .80, dmgTaken: -.25 },
        onEnter: (b, B) => { Sound.play('suddendeath'); B.summonAdds(b, ['Rodger', 'Tisha'], 2); } }
    ]
  },
  {
    id: 'Dyle', title: 'The Waiting Thing', floors: [15, 35],
    intro: 'Something has been under the water this whole time.',
    phases: [
      { at: 1.00, name: 'Submerged', mods: {} },
      { at: 0.72, name: 'Departure', mods: { atkP: .32, aspdP: .20, dmgTaken: -.10 },
        onEnter: (b, B) => { Sound.play('warn'); B.enemiesOf(b).forEach(e => B.applyStatus(b, e, 'slow', 4, { stacks: 2 })); } },
      { at: 0.48, name: 'Surfacing', mods: { critDmg: .65, aspdP: .46, armorPen: .18, dmgTaken: -.18 },
        onEnter: (b, B) => { Sound.play('hit_water'); B.shake(16, .7);
          B.enemiesOf(b).forEach(e => B.applyStatus(b, e, 'bleed', 10, { stacks: 4, val: b.st.atk * .10 })); } },
      { at: 0.20, name: 'Terminal Crash', mods: { atkP: 1.15, armorPen: .52, cdr: .45, dmgTaken: -.28 },
        onEnter: (b, B) => { Sound.play('suddendeath'); B.tint('#1a3a1a', .5, 1); } }
    ]
  },
  {
    id: 'Delilah', title: 'Failed Experiment', floors: [], eventOnly: true,
    intro: 'The notes are immaculate. The specimen has already rewritten the procedure.',
    phases: [
      { at: 1.00, name: 'Observation', mods: { dmgTaken: -.08 } },
      { at: .82, name: 'Catalogue the Living', mods: { aspdP: .22, cdr: .20, dmgTaken: -.12 },
        onEnter: (b, B) => {
          Sound.play('warn'); B.flash('#caa2ff', .35, .3);
          B.topN(B.enemiesOf(b), 'energy', 2).forEach(e => {
            B.applyStatus(b, e, 'testsubject', 999); B.applyStatus(b, e, 'contamination', 9);
          });
        } },
      { at: .60, name: 'Cross-Contamination', mods: { atkP: .35, aspdP: .32, cdr: .34, dmgTaken: -.18 },
        onEnter: (b, B) => {
          Sound.play('summon'); B.shake(16, .65); B.tint('#44204f', .42, .8);
          B.summonAdds(b, ['Scraps', 'Goob', 'Poppy', 'Toodles'], 4);
          B.enemiesOf(b).forEach(e => B.applyStatus(b, e, 'contamination', 10));
        } },
      { at: .36, name: 'Containment Is Optional', mods: { atkP: .58, cdr: .55, ccRes: .45, dmgTaken: -.25 },
        onEnter: (b, B) => {
          Sound.play('suddendeath'); B.shake(22, .8); B.flash('#b38cff', .62, .45);
          B.shield(b, b, b.max.hp * .22, 12);
          B.enemiesOf(b).forEach(e => { B.applyStatus(b, e, 'contained', 2.2); B.applyStatus(b, e, 'weaken', 8, { stacks: 2 }); });
        } },
      { at: .14, name: 'Peer Review', mods: { atkP: 1.05, aspdP: .62, cdr: .78, armorPen: .35, magPen: .35, dmgTaken: -.34 },
        onEnter: (b, B) => {
          Sound.play('suddendeath'); B.shake(28, 1); B.tint('#260d2d', .62, 1.2);
          B.summonAdds(b, ['Scraps', 'Goob', 'Poppy'], 3);
          B.enemiesOf(b).forEach(e => B.applyStatus(b, e, 'contamination', 14));
        } }
    ]
  }
];

function bossForFloor(f) {
  const depthBosses = BOSSES.filter(b => !b.eventOnly);
  return depthBosses.find(b => b.floors.includes(f)) ||
    (f % 5 === 0 ? depthBosses[(Math.floor(f / 5) - 1) % depthBosses.length] : null);
}

/* Snapshotted here, not in heroes4.js - twisted.js (this file) is what
   actually loads last among the Hero-defining scripts (see index.html), and
   it registers a few Heroes of its own (Dandy, Goob, Teagan...). Snapshotting
   too early silently drops whatever hadn't been defHero()'d yet. */
const HERO_IDS = Object.keys(HEROES);
const PLAYABLE_IDS = HERO_IDS.filter(id => !HEROES[id].twistedOnly);
