/* content.js - stages, floor modifiers, events, trials, release schedule, resources. */
'use strict';

/* ---------------- backgrounds ---------------- */
/* Authored map library. `id` is intentionally stable: use bgForMap(id) for
   character events, boss rooms, or special content instead of guessing a
   filename. The array order preserves the supplied progression. */
const MAP_BACKGROUNDS = [
  { id: 'rainbow-rooms',    label: 'Rainbow Rooms',    file: 'maps/rainbow-rooms.png' },
  { id: 'artist',           label: 'Artist',           file: 'maps/artist.png' },
  { id: 'art-floor',        label: 'Art Floor',        file: 'maps/art-floor.png' },
  { id: 'aquatic-floor',    label: 'Aquatic Floor',    file: 'maps/aquatic-floor.png' },
  { id: 'greenhouse',       label: 'Greenhouse',       file: 'maps/greenhouse.png' },
  { id: 'library-floor',    label: 'Library Floor',    file: 'maps/library-floor.png' },
  { id: 'diner',            label: 'Diner',            file: 'maps/diner.png' },
  { id: 'warehouse',        label: 'Warehouse',        file: 'maps/warehouse.png' },
  { id: 'gift-floor',       label: 'Gift Floor',       file: 'maps/gift-floor.png' },
  { id: 'astro-floor',      label: "Astro's Floor",   file: 'maps/astro-floor.png' },
  { id: 'shelly-floor',     label: "Shelly's Floor",  file: 'maps/shelly-floor.png' },
  { id: 'vee-floor',        label: "Vee's Floor",     file: 'maps/vee-floor.png' },
  { id: 'easter-floor',     label: 'Easter Floor',     file: 'maps/easter-floor.png' },
  { id: 'christmas-floor',  label: 'Christmas Floor',  file: 'maps/christmas-floor.png' },
  { id: 'halloween-floor',  label: 'Halloween Floor',  file: 'maps/halloween-floor.png' }
];
const MAP_BY_ID = Object.fromEntries(MAP_BACKGROUNDS.map(map => [map.id, map]));
// File-list alias retained for Arena, Trials, and Raid random selections.
const BACKGROUNDS = MAP_BACKGROUNDS.map(map => map.file);
function bgForMap(id) { const map = MAP_BY_ID[id] || MAP_BACKGROUNDS[0]; return Art.bg(map.file); }
function bgForFloor(f, node) { return Art.bg(seeded('bg' + f + '-' + node).pick(MAP_BACKGROUNDS).file); }

/* ---------------- resources ---------------- */
const RES = {
  ichor: { icon: '<img class="currency-icon ichor-icon" src="uploads/ichor.png" alt="Ichor">', name: 'Black Ichor', desc: 'Universal currency. Levels Heroes and buys crates.' },
  arenaCoin: { icon: '🪙', name: 'Arena Coin', desc: 'Earned from Arena victories. Spend it at the Grand Colosseum Exchange.' },
  tape: { icon: '📼', name: 'Tape', desc: 'Skill material. Upgrades individual skills.' },
  notes: { icon: '✦', name: 'Skill Notes', desc: 'Practice notes used for Hero skill upgrades, preserving Ichor for other progress.' },
  star: { icon: '⭐', name: 'Star Dust', desc: 'Promotes Heroes to higher star ranks.' },
  ticket: { icon: '🎟', name: 'Scratch Ticket', desc: 'Use anytime on the always-open Prize Parade for big resources and Hero shards.' },
  raidTicket: { icon: '⚡', name: 'Raid Ticket', desc: 'Runs a Trial or Event battle off screen at 10,000× speed. Rewards are paid only if your selected team wins the real battle sim.' },
  counterToken: { icon: '🔄', name: 'Counter Token', desc: "A stamped token Dandy accepts to refresh today's shop stock." },
  elevatorTicket: { icon: '🎫', name: 'Elevator Ticket', desc: 'An express pass that skips five Ichor Depths floors without spending Black Ichor. Skipped rooms give no rewards.' },
  exp: { icon: '<img class="resource-icon exp-icon" src="uploads/exp-bottle-icon.png" alt="EXP Bottle">', name: 'EXP Bottle', desc: 'Direct Hero experience.' },
  gold: { icon: '📦', name: 'Gold Crate', desc: 'A common resource crate containing older Heroes and bulk supplies.' },
  diamond: { icon: '💎', name: 'Diamond Crate', desc: 'A premium resource crate with newer Heroes and stronger supplies.' },
  main: { icon: '🌟', name: 'Main Character Crate', desc: 'A focused resource crate with a high chance of Main Character or Dandy research.' },
  core: { icon: '🔩', name: 'Rarity Core', desc: 'Advances a Hero from White to Rainbow rarity.' },
  manual: { icon: '📘', name: 'Training Manual', desc: 'Ranks up a Hero’s chosen Classes and Subclasses.' },
  scrap: { icon: '⚙', name: 'Scrap', desc: 'Salvaged from Trinket shards. Craft it into shards for any Trinket you choose.' },
  gear: { icon: '⚙', name: 'Gear', desc: 'Recovered from Unknown World machines. Trade it for superior Trinkets and supplies.' }
};

/* Fixed rewards become more valuable as the account grows. Reward systems
   that already have their own mastery curve call their existing formula so
   this layer does not compound them. */
function masteryRewardMultiplier(value) {
  const raw = value == null
    ? (typeof Save !== 'undefined' && Save.data ? Save.data.mastery : 1)
    : value;
  const mastery = clamp(Math.floor(Number(raw) || 1), 1, 800);
  return 1 + Math.sqrt(Math.max(0, mastery - 1) / 799) * .70;
}
function masteryRewardValue(value, mastery) {
  const amount = Number(value) || 0;
  if (amount <= 0) return amount;
  return Math.max(1, Math.round(amount * masteryRewardMultiplier(mastery)));
}
function masteryRewardBundle(bundle, mastery) {
  const out = {};
  Object.keys(bundle || {}).forEach(key => {
    const value = bundle[key];
    out[key] = typeof value === 'number' ? masteryRewardValue(value, mastery) : value;
  });
  return out;
}

/* Shared Twisted loot resolver. Keeping this outside the renderer means live
   battles and off-screen Raid Ticket simulations award the same shard drops. */
function collectTwistedShardDrops(battle) {
  if (!battle || !Array.isArray(battle.units)) return {};
  const foes = battle.units.filter(u => u.team === TEAM_E && !u.minion);
  const mine = battle.units.filter(u => u.team === TEAM_P && !u.minion);
  const rodgerResearch = mine
    .filter(u => u.id === 'Rodger' && u.research)
    .reduce((best, rodger) => {
      Object.keys(rodger.research).forEach(uid => { best[uid] = Math.max(best[uid] || 0, rodger.research[uid] || 0); });
      return best;
    }, {});
  const rodgerMultipliers = [1, 2, 4, 8, 12, 20];
  const drops = {};
  foes.filter(u => !u.alive && u.twisted && HEROES[u.id]).forEach(u => {
    const research = clamp(Math.max(Number(rodgerResearch[u.uid]) || 0, Number(u._rodgerResearchAtDefeat) || 0), 0, 5);
    const amount = masteryRewardValue(rodgerMultipliers[research]);
    drops[u.id] = (drops[u.id] || 0) + amount;
  });
  Object.entries(drops).forEach(([id, amount]) => Save.giveShards(id, amount));
  return drops;
}

/* ---------------- floor modifiers ---------------- */
/* rarity: 'common' shows up from floor 3, 'rare' from floor 8, 'epic' from floor 15.
   buildFloor() weights selection so common mods appear most often at shallow floors
   and epic mods dominate deep runs. good:true marks player-beneficial mods. */
const FLOOR_MODS = [

  /* -------- COMMON (floor 3+) -------- */
  { id: 'flood', rarity: 'common', name: 'Ichor Flood', icon: '🩸',
    desc: 'Twisteds move and attack 20% faster.',
    apply: (B) => B.foeTeam().forEach(u => { u.flat.msP = (u.flat.msP||0) + .2; u.flat.aspdP = (u.flat.aspdP||0) + .2; }) },
  { id: 'dark', rarity: 'common', name: 'Broken Lights', icon: '🌑',
    desc: 'Everyone loses 25% Accuracy.',
    apply: (B) => B.all().forEach(u => { u.flat.accP = (u.flat.accP||0) - .25; }) },
  { id: 'panic', rarity: 'common', name: 'Panic Mode', icon: '❗',
    desc: 'Heroes generate 30% less Energy.',
    apply: (B) => B.playerTeam().forEach(u => { u.flat.energyGen = (u.flat.energyGen||0) - .3; }) },
  { id: 'thin', rarity: 'common', name: 'Thin Air', icon: '🎈',
    desc: 'Everyone has 40% less Max HP but hits 25% harder.',
    apply: (B) => B.all().forEach(u => { u.flat.hpP = (u.flat.hpP||0) - .4; u.flat.dmgDealt = (u.flat.dmgDealt||0) + .25; }) },
  { id: 'heavy', rarity: 'common', name: 'Heavy Air', icon: '🐢',
    desc: 'Cooldowns recover 25% slower for everyone.',
    apply: (B) => B.all().forEach(u => { u.flat.cdr = (u.flat.cdr||0) - .25; }) },
  { id: 'brittle', rarity: 'common', name: 'Brittle Ground', icon: '🪨',
    desc: 'Defense is 30% less effective for everyone.',
    apply: (B) => B.all().forEach(u => { u.flat.defP = (u.flat.defP||0) - .30; }) },
  { id: 'gravity', rarity: 'common', name: 'Gravity Surge', icon: '⬇',
    desc: 'Everyone moves 25% slower but hits 18% harder.',
    apply: (B) => B.all().forEach(u => { u.flat.msP = (u.flat.msP||0) - .25; u.flat.dmgDealt = (u.flat.dmgDealt||0) + .18; }) },
  { id: 'interference', rarity: 'common', name: 'Interference', icon: '📡',
    desc: 'Healing received is 40% less effective for everyone.',
    apply: (B) => B.all().forEach(u => { u.flat.healRecv = (u.flat.healRecv||0) - .40; }) },
  { id: 'hemorrhage', rarity: 'common', name: 'Open Wounds', icon: '🩹',
    desc: 'Basic attacks apply 1 stack of Rend (5s) to the target.',
    apply: (B) => B.all().forEach(u => B.on(u, 'basicHit', ev => {
      if (ev.target && ev.target.alive)
        B.applyStatus(u, ev.target, 'bleed', 5, { stacks: 1, val: ev.target.max.hp * .003 }); })) },
  { id: 'feast', rarity: 'common', good: true, name: 'Scattered Rations', icon: '🍎',
    desc: 'Your Heroes regenerate 2% HP per second.',
    apply: (B) => B.playerTeam().forEach(u => B.applyStatus(u, u, 'regen', 999, { val: u.max.hp * .02 })) },
  { id: 'surge', rarity: 'common', good: true, name: 'Ichor Surge', icon: '🔋',
    desc: 'Your Heroes start at 50 Energy.',
    apply: (B) => B.playerTeam().forEach(u => { u.energy = 50; }) },
  { id: 'clarity', rarity: 'common', good: true, name: 'Clear Skies', icon: '☀',
    desc: 'Heroes gain +20% Accuracy and +12% Crit Chance.',
    apply: (B) => B.playerTeam().forEach(u => { u.flat.accP = (u.flat.accP||0) + .20; u.flat.crit = (u.flat.crit||0) + .12; }) },

  /* -------- RARE (floor 8+) -------- */
  { id: 'mutate', rarity: 'rare', name: 'Twisted Mutation', icon: '🧬',
    desc: 'Twisteds start with two random buffs.',
    apply: (B) => B.foeTeam().forEach(u => pickN(['atkup', 'fortify', 'lucky', 'haste', 'reflect', 'thorns'], 2)
      .forEach(b => B.applyStatus(u, u, b, 999, { stacks: 2 }))) },
  { id: 'rot', rarity: 'rare', name: 'Creeping Rot', icon: '☠',
    desc: 'Every 4s all units take a stacking Poison hit.',
    apply: (B) => B.every(null, 4, () => B.all().forEach(u => B.applyStatus(u, u, 'poison', 6, { val: u.max.hp * .004 }))) },
  { id: 'static', rarity: 'rare', name: 'Static Field', icon: '⚡',
    desc: 'All units have 2 stacks of Shock - magic damage chains to nearby units.',
    apply: (B) => B.all().forEach(u => B.applyStatus(u, u, 'shock', 999, { stacks: 2 })) },
  { id: 'armored', rarity: 'rare', name: 'Armored Forces', icon: '🧱',
    desc: 'Twisteds start the battle with 4 stacks of Fortify.',
    apply: (B) => B.foeTeam().forEach(u => B.applyStatus(u, u, 'fortify', 9999, { stacks: 4 })) },
  { id: 'regrowth', rarity: 'rare', name: 'Regrowth', icon: '💚',
    desc: 'Twisteds regenerate 1.2% of their Max HP per second.',
    apply: (B) => B.foeTeam().forEach(u => B.applyStatus(u, u, 'regen', 9999, { val: u.max.hp * .012 })) },
  { id: 'shielded', rarity: 'rare', name: 'Shielded Forces', icon: '🛡',
    desc: 'Every Twisted starts with a 15% Max HP Shield.',
    apply: (B) => B.foeTeam().forEach(u => B.shield(u, u, u.max.hp * .15, 9999)) },
  { id: 'corruption', rarity: 'rare', name: 'Corruption Seep', icon: '🕷',
    desc: 'Heroes take 1.5% of their Max HP as true damage every second.',
    apply: (B) => B.every(null, 1, () => B.playerTeam().forEach(u => {
      if (u.alive) B.damage(u, u, u.max.hp * .015, { type: 'true', dot: true, selfharm: true, tag: 'corruption' }); })) },
  { id: 'shield_brittle', rarity: 'rare', name: 'Brittle Wards', icon: '💔',
    desc: 'Shields are 45% weaker for everyone - heroes and Twisteds alike.',
    apply: (B) => B.all().forEach(u => { u.flat.shieldPowP = (u.flat.shieldPowP||0) - .45; }) },
  { id: 'energy_debt', rarity: 'rare', name: 'Energy Debt', icon: '🕳',
    desc: 'Heroes generate 50% less Energy from all sources.',
    apply: (B) => B.playerTeam().forEach(u => { u.flat.energyGen = (u.flat.energyGen||0) - .50; }) },
  { id: 'harmony', rarity: 'rare', good: true, name: 'Inner Harmony', icon: '🎵',
    desc: 'Heroes above 50% HP gain 25% Skill Haste and 15% damage.',
    apply: (B) => B.every(null, .5, () => B.playerTeam().forEach(u => {
      const val = u.alive && u.hpPct > .5 ? 1 : 0;
      if (u._harmCdr !== val) { u.flat.cdr_h = val * .25; u.flat.dmgDealt_h = val * .15; u._harmCdr = val; u.dirty = true; } })) },

  /* -------- EPIC (floor 15+) -------- */
  { id: 'glacial', rarity: 'epic', name: 'Glacial Domain', icon: '❄',
    desc: 'Every 8s all Twisteds gain a permanent Fortify stack - the longer it lasts, the harder they get.',
    apply: (B) => B.every(null, 8, () => B.foeTeam().forEach(u => { if (u.alive) B.applyStatus(u, u, 'fortify', 9999, { stacks: 1 }); })) },
  { id: 'vengeful', rarity: 'epic', name: 'Vengeful', icon: '😤',
    desc: 'When a Twisted falls, all remaining Twisteds gain Attack Up and Speed Up for 5s.',
    apply: (B) => {
      let prevAlive = null;
      B.every(null, .4, () => {
        const n = B.foeTeam().filter(u => u.alive).length;
        if (prevAlive !== null && n < prevAlive) B.foeTeam().forEach(e => { if (e.alive) {
          B.applyStatus(e, e, 'atkup', 5, { stacks: 2 }); B.applyStatus(e, e, 'speedup', 5); } });
        prevAlive = n;
      }); } },
  { id: 'focused', rarity: 'epic', name: 'Focused Assault', icon: '🎯',
    desc: 'Twisteds focus the highest-HP hero, who takes 20% more damage and cannot hide.',
    apply: (B) => {
      let cur = null;
      B.every(null, 3, () => {
        const top = B.playerTeam().filter(u => u.alive).sort((a, b) => b.max.hp - a.max.hp)[0];
        if (!top) return;
        if (cur && cur !== top && cur.alive) B.removeStatus(cur, 'headline');
        cur = top;
        if (!top.hasStatus('headline')) B.applyStatus(top, top, 'headline', 9999);
      }); } },
  { id: 'spellstorm', rarity: 'epic', name: 'Spellstorm', icon: '🌩',
    desc: 'All units have 3 stacks of Shock - magic damage chains hard in all directions.',
    apply: (B) => B.all().forEach(u => B.applyStatus(u, u, 'shock', 9999, { stacks: 3 })) },
  { id: 'overwhelming', rarity: 'epic', name: 'Overwhelming Force', icon: '💥',
    desc: 'Twisteds deal 35% more damage but have 20% less Max HP.',
    apply: (B) => B.foeTeam().forEach(u => { u.flat.dmgDealt = (u.flat.dmgDealt||0) + .35; u.flat.hpP = (u.flat.hpP||0) - .20; }) },
  { id: 'nightmare', rarity: 'epic', name: 'Living Nightmare', icon: '👹',
    desc: 'Heroes begin the battle with 3 stacks of Ichor Burn and Grief - corruption at its worst.',
    apply: (B) => B.playerTeam().forEach(u => {
      B.applyStatus(u, u, 'ichorburn', 9999, { stacks: 3, val: u.max.hp * .002 });
      B.applyStatus(u, u, 'grief', 9999); }) },
  { id: 'counterforce', rarity: 'epic', name: 'Counterforce', icon: '🔄',
    desc: 'Twisteds reflect 20% of damage they take back at the attacker.',
    apply: (B) => B.foeTeam().forEach(u => B.on(u, 'damaged', ev => {
      if (ev.dot || ev.reflected || ev.redirected || !ev.src || ev.src.team === u.team) return;
      B.damage(u, ev.src, ev.amount * .20, { type: 'true', reflected: true, tag: 'counterforce' }); })) }
];

/* ---------------- floor node types ---------------- */
const NODE = {
  battle: { icon: '⚔', label: 'Twisted' },
  elite: { icon: '💀', label: 'Elite' },
  event: { icon: '❓', label: 'Event' },
  machine: { icon: '⚙', label: 'Machine' },
  treasure: { icon: '🎁', label: 'Cache' },
  rest: { icon: '🔥', label: 'Camp' },
  boss: { icon: '👑', label: 'Boss' }
};

/* ---------------- random events ---------------- */
const EVENTS = [
  {
    id: 'supplies', title: 'Lost Supplies',
    text: 'A toppled crate spills across the corridor. Something moved when you got close.',
    choices: [
      { label: 'Take everything', sub: 'Guaranteed resources, but the noise draws a fight.',
        act: G => { G.give({ ichor: 900, tape: 12 }); return { fight: true, msg: 'You grabbed it all. Something heard.' }; } },
      { label: 'Take what you can carry', sub: 'A smaller haul, no risk.',
        act: G => { G.give({ ichor: 400, tape: 5 }); return { msg: 'You leave quietly.' }; } },
      { label: 'Leave it', sub: 'Restore 25% HP to the whole team instead.',
        act: G => { G.healRun(.25); return { msg: 'The team rests instead.' }; } }
    ]
  },
  {
    id: 'machine', title: 'Strange Machine',
    text: 'A humming machine offers to improve someone. It does not specify how.',
    choices: [
      { label: 'Feed it Ichor', sub: 'Spend 1200 Ichor for a random Hero upgrade.',
        cost: { ichor: 1200 },
        act: G => { const h = G.upgradeRandom(); return { msg: h ? h + ' came out stronger.' : 'Nothing happened.' }; } },
      { label: 'Climb in yourself', sub: 'A permanent run buff, or a damaged team and an angry machine.',
        act: G => G.chance(.55)
          ? { msg: 'The run gains a permanent buff.', runBuff: G.pick(['atkup', 'fortify', 'haste', 'lucky']) }
          : (G.hurtRun(.18), { msg: 'Corruption spreads. The machine wakes something nearby.', forceElite: true }) },
      { label: 'Unplug it', sub: 'Salvage 2 Rarity Cores.',
        act: G => { G.give({ core: 2 }); return { msg: 'You strip it for parts.' }; } }
    ]
  },
  {
    id: 'room', title: 'Abandoned Room',
    text: 'Someone lived here. Their notes stop mid-sentence.',
    choices: [
      { label: 'Read the notes', sub: 'Reveal the next two floors and gain Tape.',
        act: G => { G.give({ tape: 20 }); G.scout(2); return { msg: 'You know what is coming.' }; } },
      { label: 'Search the room', sub: 'A Gold Crate and some Star Dust.',
        act: G => { G.give({ gold: 1, star: 40 }); return { msg: 'A crate was under the bed.' }; } },
      { label: 'Rest here', sub: 'Fully heal and revive one fallen Hero.',
        act: G => { G.healRun(1); G.reviveOne(); return { msg: 'The team sleeps properly for once.' }; } }
    ]
  },
  {
    id: 'mirror', title: 'Ichor Mirror',
    text: 'Your reflection is a beat behind you.',
    choices: [
      { label: 'Touch it', sub: 'Fight a Twisted copy of your strongest Hero for a big reward.',
        act: G => ({ fight: true, mirror: true, msg: 'It steps out.' }) },
      { label: 'Break it', sub: 'Take 15% team HP damage, gain a Diamond Crate.',
        act: G => { G.hurtRun(.15); G.give({ diamond: 1 }); return { msg: 'Glass everywhere. Worth it.' }; } },
      { label: 'Walk away', sub: 'Gain 30 Battle Pass XP.',
        act: G => { G.passXp(30); return { msg: 'You do not look back.' }; } }
    ]
  },
  {
    id: 'vendor', title: 'A Familiar Shop',
    text: 'The shelves are stocked. Nobody is behind the counter.',
    choices: [
      { label: 'Buy the crate', sub: '2500 Ichor for 2 Gold Crates.', cost: { ichor: 2500 },
        act: G => { G.give({ gold: 2 }); return { msg: 'You leave the money on the counter.' }; } },
      { label: 'Buy the shards', sub: '3000 Ichor for 15 shards of a random owned Hero.', cost: { ichor: 3000 },
        act: G => { const h = G.giveRandomShards(15); return { msg: h + ' shards acquired.' }; } },
      { label: 'Take it all and run', sub: 'Free loot. The next battle is an Elite.',
        act: G => { G.give({ ichor: 1500, gold: 1, tape: 15 }); return { msg: 'You are being followed.', forceElite: true }; } }
    ]
  },
  {
    id: 'checkpoint', title: 'Skill Check',
    text: 'A pressure plate. The timing window is very narrow.',
    choices: [
      { label: 'Go for perfect', sub: '55% chance of a large reward, otherwise team damage.',
        act: G => G.chance(.55) ? (G.give({ ichor: 2000, tape: 25, star: 60 }), { msg: 'Perfect.' })
          : (G.hurtRun(.20), { msg: 'You missed it.' }) },
      { label: 'Play it safe', sub: 'A guaranteed modest reward.',
        act: G => { G.give({ ichor: 700, tape: 8 }); return { msg: 'Good enough.' }; } },
      { label: 'Disarm it', sub: 'Remove the next floor modifier entirely.',
        act: G => ({ msg: 'The next floor is clean.', clearMods: true }) }
    ]
  },
  {
    id: 'stalled_lift', title: 'Stalled Elevator',
    text: 'The lift is wedged between floors. Its emergency panel still has one green light.',
    choices: [
      { label: 'Force the doors', sub: 'Lose 12% team HP, but map two rooms ahead.',
        act: G => { G.hurtRun(.12); G.scout(2); return { msg: 'The doors give way. The route is visible.' }; } },
      { label: 'Feed the panel', sub: 'Spend 1600 Ichor to recover an Elevator Ticket.', cost: { ichor: 1600 },
        act: G => { G.give({ elevatorTicket: 1 }); return { msg: 'The lift coughs up a spare tape.' }; } },
      { label: 'Climb the cable', sub: 'Take a Gold Crate, but whatever is above hears you.',
        act: G => { G.give({ gold: 1, ichor: 700 }); return { fight: true, msg: 'You reach the next landing. Something follows.' }; } }
    ]
  },
  {
    id: 'field_notes', title: 'Field Notes',
    text: 'A soaked notebook describes the rooms ahead in hurried handwriting. The last page is still warm.',
    choices: [
      { label: 'Study the route', sub: 'Reveal two rooms and gain Pass XP.',
        act: G => { G.scout(2); G.passXp(45); return { msg: 'The route starts making sense.' }; } },
      { label: 'Copy the useful page', sub: 'Queue an extra Endless card draft after this room.',
        act: G => { G.queueDraft('event'); return { msg: 'You keep the page. It feels like a blueprint.' }; } },
      { label: 'Tear it out', sub: 'Gain a Rarity Core, but alert an Elite patrol.',
        act: G => { G.give({ core: 1, tape: 10 }); return { forceElite: true, msg: 'The missing page was louder than expected.' }; } }
    ]
  },
  {
    id: 'generator', title: 'Emergency Generator',
    text: 'A backup generator sputters in the dark. Its battery could power the lift—or the squad.',
    choices: [
      { label: 'Reconnect the lights', sub: 'Heal 18% team HP and clear the next floor modifier.',
        act: G => { G.healRun(.18); return { clearMods: true, msg: 'The corridor brightens. The pressure eases.' }; } },
      { label: 'Strip the battery', sub: 'Take Ichor and a Rarity Core. No healing.',
        act: G => { G.give({ ichor: 900, core: 1 }); return { msg: 'The battery comes out clean.' }; } },
      { label: 'Overcharge it', sub: 'Gain Attack Up for the run, but the next room is a fight.',
        act: G => { G.hurtRun(.10); return { runBuff: 'atkup', fight: true, msg: 'The squad is charged. So is everything nearby.' }; } }
    ]
  },
  {
    id: 'first_aid', title: 'First-Aid Station',
    text: 'A wall cabinet blinks: RESTOCKED. The expiration date is impossible to read.',
    choices: [
      { label: 'Treat the wounded', sub: 'Heal 30% team HP.',
        act: G => { G.healRun(.30); return { msg: 'The medicine is questionable but effective.' }; } },
      { label: 'Wake the fallen', sub: 'Revive one defeated Hero at 35% HP.',
        act: G => { G.reviveOne(.35); return { msg: 'A monitor beeps. Someone gets back up.' }; } },
      { label: 'Pack the cabinet', sub: 'Take a Diamond Crate, but lose 10% team HP while hauling it.',
        act: G => { G.hurtRun(.10); G.give({ diamond: 1 }); return { msg: 'Heavy, valuable, and definitely not sterile.' }; } }
    ]
  },
  {
    id: 'red_thread', title: 'Red Thread',
    text: 'A red line runs beneath the door and disappears into the next room. It is pulling gently.',
    choices: [
      { label: 'Follow it', sub: 'Reveal two rooms and gain Star Dust.',
        act: G => { G.scout(2); G.give({ star: 45 }); return { msg: 'The thread leads somewhere useful.' }; } },
      { label: 'Tie it to the squad', sub: 'Gain Fortify for the rest of the run.',
        act: G => ({ runBuff: 'fortify', msg: 'The thread tightens into a protective knot.' }) },
      { label: 'Cut it', sub: 'Take a Diamond Crate, but lose 10% team HP.',
        act: G => { G.hurtRun(.10); G.give({ diamond: 1 }); return { msg: 'The line snaps. Something snaps back.' }; } }
    ]
  }
];

/* ================= OBTAINMENT RARITY =================
   How hard a Hero is to GET. Deliberately separate from HEROES[id].tier, which
   is how strong they are. A Common can be S tier and a Main Character can be D. */
const OBTAIN = {
  Common: { rank: 0, name: 'Common', icon: '🤍', color: '#d8dee6', weight: 100,
    unlock: 20, costMult: 1.00, crates: ['gold', 'diamond'], shardRange: [6, 14] },
  Uncommon: { rank: 1, name: 'Uncommon', icon: '💚', color: '#7ce4a0', weight: 50,
    unlock: 40, costMult: 1.35, crates: ['gold', 'diamond'], shardRange: [5, 12] },
  Rare: { rank: 2, name: 'Rare', icon: '💙', color: '#6cc4ff', weight: 20,
    unlock: 70, costMult: 1.80, crates: ['gold', 'diamond'], shardRange: [4, 10] },
  Main: { rank: 3, name: 'Main Character', icon: '💜', color: '#c99bff', weight: 6,
    unlock: 110, costMult: 2.40, crates: ['diamond', 'main'], shardRange: [3, 8] },
  Lethal: { rank: 4, name: 'Lethal', icon: '❤️‍🔥', color: '#ff7b7b', weight: 1.5,
    unlock: 180, costMult: 3.20, crates: [], shardRange: [2, 6] },
  Collab: { rank: 5, name: 'Collab', icon: '🔑', color: '#73d8ff', weight: 0,
    unlock: 260, costMult: 4.80, crates: [], shardRange: [1, 4] },
  Event: { rank: 5, name: 'Event', icon: '🎸', color: '#bd80f1', weight: 0,
    unlock: 70, costMult: 2.25, crates: [], shardRange: [3, 8] }
};
const OBTAIN_ORDER = ['Common', 'Uncommon', 'Rare', 'Main', 'Lethal', 'Collab', 'Event'];

/* Straight from Dandy's World's own rarity list. */
const HERO_OBTAIN = {
  // Common
  Boxten: 'Common', Brusha: 'Common', Cosmo: 'Common', Looey: 'Common', Poppy: 'Common',
  Shrimpo: 'Common', Tisha: 'Common', Ribecca: 'Common', Yatta: 'Common', Rudie: 'Common', Eggson: 'Common',
  // Uncommon
  Brightney: 'Uncommon', Connie: 'Uncommon', Rodger: 'Uncommon', Teagan: 'Uncommon',
  Toodles: 'Uncommon', Ginger: 'Uncommon', Flyte: 'Uncommon', Soulvester: 'Uncommon', RnD: 'Uncommon', Finn: 'Uncommon', Flutter: 'Uncommon',
  // Rare
  Blot: 'Rare', Gigi: 'Rare', Goob: 'Rare', Scraps: 'Rare', Cocoa: 'Rare', Coal: 'Rare', Squirm: 'Rare',
  Eclipse: 'Rare', Waxwell: 'Rare', Glisten: 'Rare',
  // Main Character
  Astro: 'Main', Pebble: 'Main', Shelly: 'Main', Sprout: 'Main', Vee: 'Main',
  Bassie: 'Main', Bobette: 'Main', Gourdy: 'Main',
  // Lethal
  Dandy: 'Lethal', Dyle: 'Lethal', Delilah: 'Lethal', BigWig: 'Lethal',
  // Collaboration visitors use their own acquisition rules and never enter crates.
  GingerBrave: 'Collab', GingerBright: 'Collab', ShadowMilkCookie: 'Collab', CreamPuffCookie: 'Collab', TigerLilyCookie: 'Collab', PureVanillaCookie: 'Collab', Sora: 'Collab', Riku: 'Collab', Kairi: 'Collab', Goofy: 'Collab', Phantasia: 'Collab',
  CheerbearShelly: 'Collab', BedtimeAstro: 'Collab', WishBearGigi: 'Collab',
  QOMGourdy: 'Event', QOMEclipse: 'Event', QOMSoulvester: 'Event', QOMRibecca: 'Event', QOMConnie: 'Event'
};

const KINGDOM_HEARTS_HERO_IDS = new Set(['Sora', 'Riku', 'Kairi', 'Goofy']);
const CARE_BEAR_HERO_IDS = new Set(['CheerbearShelly', 'BedtimeAstro', 'WishBearGigi']);
const BIG_WIG_HERO_IDS = new Set(['BigWig']);
const COLLAB_HERO_IDS = new Set([...KINGDOM_HEARTS_HERO_IDS, ...CARE_BEAR_HERO_IDS, ...COOKIE_HERO_IDS, 'Phantasia']);
const QOM_HERO_IDS = new Set(['QOMGourdy', 'QOMEclipse', 'QOMSoulvester', 'QOMRibecca', 'QOMConnie']);
const COLLAB_EVENT = { name: 'The Door Opens', icon: '🔑', color: '#73d8ff', collab: true };
const CARE_BEAR_EVENT = { name: 'Care Bears', icon: '🌈', color: '#ff78b6', collab: true };

function obtainOf(id) { return OBTAIN[HERO_OBTAIN[id] || 'Common']; }
function obtainKey(id) { return HERO_OBTAIN[id] || 'Common'; }

/** All regular Heroes are available year-round. Collaboration visitors keep
    their separate acquisition path; holiday/event flavor never gates a Hero. */
function heroAvailable(id, when) {
  return !COLLAB_HERO_IDS.has(id) && !BIG_WIG_HERO_IDS.has(id) && !QOM_HERO_IDS.has(id);
}
function eventOf(id) {
  if (COOKIE_HERO_IDS.includes(id)) return { name: 'Cookie Run', icon: '🍪', color: '#ffd380', collab: true };
  if (KINGDOM_HEARTS_HERO_IDS.has(id)) return COLLAB_EVENT;
  if (CARE_BEAR_HERO_IDS.has(id)) return CARE_BEAR_EVENT;
  if (QOM_HERO_IDS.has(id)) return { name: 'Queens of Mischief', icon: '🎸', color: '#c070ed' };
  return null;
}

/* New players start with just these two - the rest of the roster is something
   to go earn, not something handed over on day one. */
const STARTERS = ['Boxten', 'Poppy'];

/* Your ceiling rises as your collection grows, so chasing rare Heroes directly
   raises the level cap on the Heroes you already own. */
function globalCap() { return Math.min(60 + (Save.data ? Save.ownedIds().length : 8) * 20, 800); }

/* ---------------- crate pools ---------------- */
/* Gold/Diamond Crates pull from the available non-Lethal roster. The focused
   Main Character Crate is the intentional exception: it also includes Dandy
   as its signature chase result. Other Lethals remain encounter rewards. */
function cratePool(kind) {
  if (kind === 'main') {
    return PLAYABLE_IDS.filter(id => heroAvailable(id) && (obtainOf(id).rank === OBTAIN.Main.rank || id === 'Dandy'));
  }
  return PLAYABLE_IDS.filter(id => heroAvailable(id) && obtainOf(id).rank < OBTAIN.Lethal.rank && obtainOf(id).crates.includes(kind));
}
/** Weighted pick honouring obtainment rarity. Diamond crates tilt toward the top. */
function rollCrateHero(kind, rng) {
  const pool = cratePool(kind);
  if (!pool.length) return null;
  const r = rng || { f: Math.random };
  const tilt = kind === 'main' ? 1.15 : kind === 'diamond' ? 1.7 : 1;
  // A new Hero is exciting, but duplicates must still carry the collection.
  // Give an unowned target a gentle nudge instead of letting a large Common
  // pool drown out the Heroes the player has not seen yet.
  const unowned = typeof Save !== 'undefined' ? pool.filter(id => !Save.owns(id)) : [];
  const target = unowned.length && r.f() < (kind === 'diamond' ? .72 : .58) ? unowned : pool;
  const weights = target.map(id => {
    const o = obtainOf(id);
    const dandyFocus = kind === 'main' && id === 'Dandy' ? 2.2 : 1;
    return o.weight * dandyFocus * Math.pow(tilt, o.rank);
  });
  let roll = r.f() * sum(weights);
  for (let i = 0; i < target.length; i++) { roll -= weights[i]; if (roll <= 0) return target[i]; }
  return target[target.length - 1];
}

/** Shard rolls should help finish a real promotion instead of picking an
    arbitrary owned Hero. If the player has no eligible duplicate yet, the
    same roll becomes a banked recruitment shard rather than a dead resource. */
function rollCrateShard(kind, rng) {
  const pool = cratePool(kind);
  if (!pool.length) return null;
  const r = rng || { f: Math.random };
  const eligible = typeof Save !== 'undefined'
    ? pool.filter(id => Save.owns(id) && Save.hero(id).stars < 5)
    : [];
  const target = eligible.length ? eligible : pool;
  const weights = target.map(id => {
    const o = obtainOf(id);
    const h = typeof Save !== 'undefined' && Save.owns(id) ? Save.hero(id) : null;
    if (!h) return o.weight * Math.pow(kind === 'main' ? 1.15 : kind === 'diamond' ? 1.7 : 1, o.rank);
    const next = typeof Progress !== 'undefined' && Progress.starCost
      ? Progress.starCost(id)
      : null;
    const nextShards = next ? next.shards : (typeof STAR_COST !== 'undefined' ? Math.round(STAR_COST[h.stars] * o.costMult) : 30);
    const progress = nextShards ? clamp((h.shards || 0) / nextShards, 0, 1) : 0;
    const dandyFocus = kind === 'main' && id === 'Dandy' ? 2.2 : 1;
    return o.weight * dandyFocus * (1 + progress * 2.2);
  });
  let roll = r.f() * sum(weights);
  for (let i = 0; i < target.length; i++) { roll -= weights[i]; if (roll <= 0) return target[i]; }
  return target[target.length - 1];
}

/* ---------------- weekly feature ---------------- */
/* Both tracks still rotate weekly, but the pick is driven by rarity instead of a
   release date: the Pass carries something hard to get, the card something softer. */
function currentWeek() { return weekIndex(); }
function featured(week) {
  const rng = seeded('feature-' + week);
  const avail = PLAYABLE_IDS.filter(id => heroAvailable(id));
  const byRank = r => avail.filter(id => obtainOf(id).rank === r);

  let pass = null;
  const hard = byRank(3).concat(byRank(2));
  pass = hard.length ? rng.pick(hard) : rng.pick(avail);
  // the scratch card runs softer, and only sometimes has two
  const soft = byRank(0).concat(byRank(1), byRank(2)).filter(id => id !== pass);
  const count = rng.chance(.5) ? 2 : 1;
  const scratch = rng.pickN(soft, Math.min(count, soft.length));
  return { pass, scratch, season: null };
}

/* ---------------- weekly trials ---------------- */
/* A larger service pool makes the three displayed divisions genuinely change
   each week. IDs stay stable so the save can track a returning division. */
const TRIAL_POOL = [
  { id: 'swift', name: 'Swift Trial', icon: '⚡', tags: ['speed:Fast'],
    rule: 'Fast Toons only.' },
  { id: 'patient', name: 'Patient Trial', icon: '🐌', tags: ['speed:Slow'],
    rule: 'Slow Toons only.' },
  { id: 'power', name: 'Powerhouse Trial', icon: '💪', tags: ['temper:Strong'],
    rule: 'Strong Toons only.' },
  { id: 'gentle', name: 'Gentle Trial', icon: '🍃', tags: ['temper:Passive'],
    rule: 'Passive Toons only.' },
  { id: 'support', name: 'Support Trial', icon: '💚', tags: ['role:Support'],
    rule: 'Support Toons only.' },
  { id: 'damage', name: 'Striker Trial', icon: '⚔', tags: ['role:Damage'],
    rule: 'Damage Toons only.' },
  { id: 'tank', name: 'Vanguard Trial', icon: '🛡', tags: ['role:Tank'],
    rule: 'Tank Toons only.' },
  { id: 'control', name: 'Control Trial', icon: '🌀', tags: ['role:Control'],
    rule: 'Control Toons only.' },
  { id: 'wildlife', name: 'Animal Trial', icon: '🐾', tags: ['species:Animal'],
    rule: 'Animal Toons only - a small, tight roster.' },
  { id: 'easter', name: 'Easter Trial', icon: '🥚', tags: ['theme:Easter'],
    rule: 'Easter Toons only - a small egg-hunt roster.' },
  { id: 'christmas', name: 'Christmas Trial', icon: '🎄', tags: ['theme:Christmas'],
    rule: 'Christmas Toons only - presents, cookies, and reindeer.' },
  { id: 'halloween', name: 'Halloween Trial', icon: '🎃', tags: ['theme:Halloween'],
    rule: 'Halloween Toons only - ghosts and pumpkins.' },
  { id: 'rookie', name: 'Rookie Trial', icon: '🤍', tags: ['rarity:Common'],
    rule: 'Common-rarity Toons only.' },
  { id: 'uncommon', name: 'Uncommon Trial', icon: '🟢', tags: ['rarity:Uncommon'],
    rule: 'Uncommon-rarity Toons only.' },
  { id: 'rare', name: 'Rare Trial', icon: '🟦', tags: ['rarity:Rare'],
    rule: 'Rare Toons only.' },
  { id: 'main', name: 'Main Trial', icon: '🟣', tags: ['rarity:Main Character'],
    rule: 'Main Characters only.' },
  { id: 'ranged', name: 'Ranged Trial', icon: '🏹', tags: ['range:Ranged'],
    rule: 'Ranged Toons only.' },
  { id: 'melee', name: 'Close-Up Trial', icon: '🗡', tags: ['range:Melee'],
    rule: 'Melee Toons only.' },
  { id: 'heroines', name: 'Heroines Trial', icon: '♀', tags: ['gender:Female'],
    rule: 'Female Toons only.' },
  { id: 'gentlemen', name: 'Gentlemen Trial', icon: '♂', tags: ['gender:Male'],
    rule: 'Male Toons only.' },
  { id: 'warm', name: 'Warm Palette Trial', icon: '🔥', tags: ['color:Red', 'color:Orange', 'color:Yellow', 'color:Pink'],
    rule: 'Red, Orange, Yellow, or Pink Toons only.' },
  { id: 'cool', name: 'Cool Palette Trial', icon: '❄', tags: ['color:Blue', 'color:Cyan', 'color:Purple'],
    rule: 'Blue, Cyan, or Purple Toons only.' },
  { id: 'earth', name: 'Earth Palette Trial', icon: '🪨', tags: ['color:Brown', 'color:Gray', 'color:Black'],
    rule: 'Brown, Gray, or Black Toons only.' },
  { id: 'open', name: 'Open Trial', icon: '🌍', tags: [], hard: true,
    rule: 'Anyone can enter - but the enemies are two tiers stronger.' }
];
/* Permanent endgame challenge. This is deliberately separate from the
   rotating weekly pool: reaching Mastery 800 should unlock a dependable,
   high-pressure activity instead of another random division. */
const ENDGAME_TRIAL = {
  id: 'apex', name: 'Apex Trial', icon: '☠', tags: [], hard: true, endgame: true,
  apexTier: 800, apexLevelCurve: [650, 680, 710, 740, 765, 785, 800, 800], apexRewardMult: 1,
  apexBg: 'uploads/image-63.png', apexMusic: 'apexTrial',
  apexDebuffs: [{ id: 'weaken', stacks: 1 }, { id: 'defdown', stacks: 1 }],
  requiredMastery: 800,
  rule: 'Mastery 800 challenge. Five elite enemies, escalating modifiers, and no easy division.'
};
const LOWER_APEX_TRIALS = [
  { id: 'apex700', name: 'Apex Trial · 700', icon: '☠', tags: [], hard: true, endgame: true,
    apexTier: 700, apexLevelCurve: [560, 590, 620, 650, 670, 690, 700, 700], apexRewardMult: .78,
    apexBg: 'uploads/image-63.png', apexMusic: 'apexTrial',
    apexDebuffs: [{ id: 'weaken', stacks: 1 }, { id: 'slow', stacks: 1 }],
    requiredMastery: 700,
    rule: 'Mastery 700 challenge. Five elite enemies, reduced rewards, and a starting Weaken/Slow tax.' },
  { id: 'apex600', name: 'Apex Trial · 600', icon: '☠', tags: [], hard: true, endgame: true,
    apexTier: 600, apexLevelCurve: [480, 510, 540, 560, 575, 590, 600, 600], apexRewardMult: .62,
    apexBg: 'uploads/image-63.png', apexMusic: 'apexTrial',
    apexDebuffs: [{ id: 'defdown', stacks: 1 }, { id: 'magdown', stacks: 1 }],
    requiredMastery: 600,
    rule: 'Mastery 600 challenge. Five elite enemies, reduced rewards, and a starting Defense/Resist Down tax.' }
];
const APEX_TRIALS = LOWER_APEX_TRIALS.concat([ENDGAME_TRIAL]);
const APEX_TRIAL_IDS = new Set(APEX_TRIALS.map(t => t.id));
function isApexTrialId(id) { return APEX_TRIAL_IDS.has(id); }
function weeklyTrials(week) {
  week = week == null ? currentWeek() : week;
  const rng = seeded('weekly-trials-' + week);
  const picks = rng.pickN(TRIAL_POOL.filter(t => t.id !== 'open'), 3);
  // Every weekly board must be playable by a brand-new Boxten/Poppy account.
  if (!picks.some(t => STARTERS.some(id => trialAllows(t, id)))) picks[2] = TRIAL_POOL.find(t => t.id === 'open');
  return picks;
}
/** A Hero is eligible if the Trial has no tag requirement, or the Hero
    carries at least one of the required tags. */
function trialAllows(trial, heroId) {
  if (!trial.tags.length) return true;
  const keys = heroTags(heroId).map(t => t.key);
  return trial.tags.some(t => keys.includes(t));
}

/* ---------------- daily deliveries ---------------- */
const DAILY_REWARDS = [
  { ichor: 1200, tape: 10, notes: 12 },
  { gold: 2, exp: 800 },
  { star: 80, tape: 3 },
  { diamond: 1, ichor: 2000 },
  { tape: 30, notes: 40, core: 2, manual: 8 },
  { tape: 5, gold: 3 },
  { diamond: 2, star: 150, ichor: 4000, tape: 3, manual: 15 }
];

/* ---------------- battle pass ---------------- */
/* The Pass is a major weekly progression path. It gets the normal account
   reward scaling plus a small Pass-only Mastery bonus, so high-Mastery runs
   pay out like a meaningful weekly haul instead of thirty tiny errands. */
function battlePassMasteryMultiplier(mastery) {
  const level = clamp(Math.floor(Number(mastery == null && typeof Save !== 'undefined' && Save.data ? Save.data.mastery : mastery) || 1), 1, 800);
  return 1 + Math.sqrt(Math.max(0, level - 1) / 799) * .35;
}
function battlePassRewardBundle(bundle, mastery) {
  const extra = battlePassMasteryMultiplier(mastery);
  const out = {};
  Object.keys(bundle || {}).forEach(key => {
    const value = bundle[key];
    out[key] = typeof value === 'number'
      ? Math.max(1, Math.round(masteryRewardValue(value, mastery) * extra))
      : value;
  });
  return out;
}
function passTrack(week, mastery) {
  const f = featured(week);
  // The weekly track must be a ledger, not a slot machine: its deterministic
  // supply packs never change when the screen is reopened.
  const rng = seeded('battle-pass-' + week);
  const t = [];
  for (let i = 1; i <= 30; i++) {
    const rank = Math.ceil(i / 5);
    const supplyPacks = [
      { ichor: 7000 + i * 700, exp: 4800 + i * 460, tape: 30 + i * 3, notes: 22 + i * 2 },
      { ichor: 5200 + i * 620, exp: 3600 + i * 420, star: 110 + i * 11, manual: 7 + Math.floor(i / 3), core: 1 + Math.floor(i / 13) },
      { ichor: 6100 + i * 650, exp: 4200 + i * 440, tape: 24 + i * 2, notes: 18 + i * 2, ticket: 1 + Math.floor(i / 15) }
    ];
    let r = rng.pick(supplyPacks);
    if (i % 5 === 0) {
      const shardMilestone = [0, 28, 40, 54, 70, 100, 150][rank];
      r = Object.assign({}, r, {
        ichor: 12000 + rank * 7000,
        exp: 9000 + rank * 6500,
        star: 180 + rank * 120,
        manual: 14 + rank * 10,
        core: 1 + Math.floor(rank / 2),
        tape: 1 + Math.floor(rank / 2)
      });
      if (f.pass) { r.hero = f.pass; r.shards = shardMilestone; }
      if (rank === 2 || rank === 4) r.diamond = 1;
      if (rank === 3 || rank === 5) { r.gold = 1; r.raidTicket = 1; }
      if (rank === 6) { r.main = 1; r.diamond = 2; r.raidTicket = 3; r.gold = 2; }
    }
    t.push({ lv: i, xp: 100 + i * 40, reward: battlePassRewardBundle(r, mastery) });
  }
  return t;
}

/* ---------------- upgrade costs ---------------- */
const STAR_COST = [0, 30, 80, 180, 400];          // base shards to reach star n+1; Progress applies Mastery scaling
const STAR_ICHOR = [0, 1200, 3200, 7600, 15000];
const STAR_DUST_COST = [0, 30, 80, 180, 400];     // promotion also uses the Star Dust earned throughout the game
/* Granular rarity costs, indexed by the next full rarity rank (1..75):
   White 1-3, Green 1-5, Blue 1-5, Purple 1-12, Red 1-20, Rainbow 1-30.
   Cores stay predictable and land at about 240 for a complete Hero. Ichor
   deliberately accelerates after the skill-unlock tiers: a focused endgame
   player should have a substantial chase for one Hero, while early rarity
   remains affordable during roster formation. The final Red/Rainbow stretch
   now adds a gentle late-game pressure so reaching Rainbow 30 takes about one
   extra day of focused play without slowing the opening roster climb. */
const RARITY_CORE_STEPS = Array.from({ length: RARITY_TOTAL_RANKS + 1 }, (_, rank) => rank ? 1 + Math.floor((rank - 1) / 14) : 0);
const RARITY_ICHOR_LATE_START = 45;
const RARITY_ICHOR_LATE_PRESSURE = .12;
function rarityIchorPressure(rank) {
  if (rank <= RARITY_ICHOR_LATE_START) return 1;
  const span = RARITY_TOTAL_RANKS - RARITY_ICHOR_LATE_START;
  const progress = clamp((rank - RARITY_ICHOR_LATE_START) / span, 0, 1);
  return 1 + Math.pow(progress, 1.35) * RARITY_ICHOR_LATE_PRESSURE;
}
const RARITY_ICHOR_STEPS = Array.from({ length: RARITY_TOTAL_RANKS + 1 }, (_, rank) => rank
  ? Math.round((300 + rank * 55 + Math.pow(rank, 1.9) * 10) * rarityIchorPressure(rank))
  : 0);
const RARITY_CORE = RARITY_CORE_STEPS;
const RARITY_ICHOR = RARITY_ICHOR_STEPS;

function levelCost(lv) { return Math.round(4.2 * Math.pow(lv, 1.42)); }
/* Keep the familiar early curve, then soften its exponent at high Mastery.
   Levels near 800 still take real EXP, without one Hero needing well over a
   hundred million bottles to catch up to the account cap. */
function levelExp(lv) {
  const rank = Math.max(0, Number(lv) || 0);
  const early = Math.min(rank, 100);
  return Math.round(60 * Math.pow(early, 1.30) * Math.max(1, rank / 100));
}
const SKILL_MAX_LEVEL = 800;
function skillCost(lv) {
  // Keep early training familiar; later ranks grow more slowly so extending
  // the ceiling to Mastery 800 does not make each of five skills unaffordable.
  const effective = Math.min(lv, 100) + Math.max(0, lv - 100) * .32;
  return {
    tape: Math.ceil(1 + effective * 0.42),
    notes: Math.ceil(2 + effective * 0.24),
    // Skills still take a little Black Ichor, but it is no longer their main
    // Ichor sink; levels, promotions, rarities, and crates keep that role.
    // Ichor remains a small part of skill cost; Tape and Notes are the
    // dedicated skill materials. This keeps a level-60 build from competing
    // with every other Ichor sink at once.
    ichor: Math.round(2.5 * Math.pow(effective, 1.08))
  };
}

/* Preserve existing skill strength through 450. Mastery beyond the old cap
   should be a substantial upgrade: level 800 reaches about 10.58x versus
   6.03x at level 450. */
function skillMult(lv) {
  const rank = clamp(Number(lv) || 1, 1, SKILL_MAX_LEVEL) - 1;
  return 1 + .0112 * Math.min(rank, 449) + .013 * Math.max(0, rank - 449);
}

function enemySkillLevel(level, kind) {
  const rate = { weakling: .80, normal: .90, elite: 1, boss: 1.08, rival: .95 }[kind] || .90;
  return clamp(Math.round(Math.max(1, Number(level) || 1) * rate), 1, SKILL_MAX_LEVEL);
}

/* Attack and Magic Attack should matter to a skill beyond the damage formula
   written inside its cast. This is deliberately a small nudge: high stats
   make matching percentage-based effects a little stronger, while Skill
   Levels remain the main source of coefficient growth. */
const SKILL_STAT_SCALING_KEYS = new Set([
  'ratio', 'hit', 'final', 'burst', 'counter', 'strike', 'smash', 'wave',
  'impact', 'finisher', 'execute', 'heal', 'shield', 'regen', 'restore',
  'fallback', 'trickle', 'leech', 'thorns', 'dot', 'bonus', 'damage', 'dmg',
  'comedy', 'conversion', 'rescue', 'lineShield', 'rowDamage', 'frontDamage',
  'backDamage', 'fullShield', 'healRecv', 'receptive', 'reduction'
]);
const SKILL_GUARD_SCALING_KEYS = new Set([
  'shield', 'heal', 'regen', 'restore', 'fallback', 'trickle', 'receptive',
  'reduction', 'counter', 'thorns', 'rescue', 'lineShield', 'fullShield'
]);
function skillUsesMagic(skill) {
  const type = (skill && skill.type) || '';
  return !/physical/i.test(type) && /magic|healing|shield/i.test(type);
}
function skillStatPowerMultiplier(skill, stats, key) {
  const magic = skillUsesMagic(skill);
  const stat = magic ? Number(stats && stats.mag) : Number(stats && stats.atk);
  // Attack/Magic Attack now reaches a meaningful, still-controlled +18% at
  // the high end. Skill Levels remain the main source of coefficient growth.
  let bonus = clamp((Math.max(0, stat || 0) - 100) / 16000, 0, .18);
  // Defensive stats do more than mitigate incoming damage: Defense strengthens
  // physical protection and counter skills, while Magic Defense strengthens
  // magical protection and recovery. Their smaller +12% cap keeps tanks from
  // eclipsing dedicated healers just by stacking armor.
  if (key && SKILL_GUARD_SCALING_KEYS.has(key)) {
    const guard = magic ? Number(stats && stats.mdef) : Number(stats && stats.def);
    bonus += clamp((Math.max(0, guard || 0) - 100) / 18000, 0, .12);
  }
  return 1 + bonus;
}

/*
   `v` holds the large, stat-like part of a skill. `p` holds the mechanics
   around it: how long a debuff lasts, how wide a zone is, how many times it
   bounces, and so on. Those values used to be completely frozen at level 1,
   which made upgrades feel like Attack/Magic Attack upgrades even when the
   skill was a shield, heal, passive, or control tool.

   Utility grows deliberately slower than damage. This keeps a levelled skill
   feeling broader and more reliable without turning a level-800 stun into an
   encounter lock. Thresholds, costs, cooldown bookkeeping, and authored
   requirements stay fixed; they are gates, not rewards.
*/
const SKILL_DURATION_KEYS = new Set([
  'dur', 'sleep', 'stun', 'root', 'slow', 'blind', 'silence', 'fear', 'drowsy',
  'groggy', 'taunt', 'ward', 'guard', 'veil', 'wrap', 'expose', 'debuff',
  'buffDur', 'bubbleDur', 'hotDur', 'liveDur', 'itemDur', 'life', 'lock',
  'attackDown', 'enemySlow', 'hasteDown', 'dr', 'revenge'
]);
const SKILL_AREA_KEYS = new Set([
  'radius', 'range', 'spread', 'zone', 'line', 'extra', 'gap', 'pull', 'push',
  'kb', 'knockback', 'backPush', 'frontPush', 'hook', 'bumpRange'
]);
const SKILL_COUNT_KEYS = new Set([
  'hits', 'ticks', 'bounces', 'targets', 'swipes', 'cuts', 'count', 'stacks',
  'max', 'maxStacks', 'cap', 'redCap', 'maxUses', 'maxBoosts',
  'gain', 'clues', 'tokens', 'shards', 'cards', 'ammo', 'points', 'orbs',
  'charges', 'cleanse', 'dispel', 'strips', 'chain', 'chains', 'waves',
  'stars', 'clue', 'allyEn'
]);
const SKILL_POWER_KEYS = new Set([
  'heal', 'shield', 'damage', 'dmg', 'ratio', 'atk', 'def', 'mag', 'mdef', 'hp',
  'energy', 'en', 'restore', 'regen', 'drain', 'pen', 'redirect', 'reduction',
  'share', 'chance', 'crit', 'eva', 'aspd', 'ms', 'power', 'per', 'thorns',
  'leech', 'conversion', 'refill', 'reviveHp', 'rescue', 'fallback', 'bonus',
  'loss', 'spill', 'steal', 'jolt', 'leap', 'finisher', 'finisher', 'exec',
  'base', 'perStack', 'perCdr', 'healRecv', 'critical', 'acc', 'impact',
  'dot', 'burst', 'lineShield', 'rowDamage', 'frontDamage', 'backDamage'
]);
const SKILL_INTERVAL_KEYS = new Set(['every', 'beat', 'delay', 'icd', 'cd', 'cooldown', 'prep', 'splashEvery', 'basicEvery', 'assistEvery', 'swipeEvery']);

function skillUtilityMult(lv) {
  const rank = clamp(Number(lv) || 1, 1, SKILL_MAX_LEVEL) - 1;
  return 1 + Math.min(.45, .004 * rank) + .00065 * Math.max(0, rank - 449);
}
function skillCountMult(lv) {
  const rank = clamp(Number(lv) || 1, 1, SKILL_MAX_LEVEL) - 1;
  return 1 + Math.min(.27, .0006 * rank) + .00042 * Math.max(0, rank - 449);
}
function skillCooldownMult(lv) {
  const rank = clamp(Number(lv) || 1, 1, SKILL_MAX_LEVEL) - 1;
  return Math.max(.66, Math.max(.72, 1 - .0007 * rank) - .00018 * Math.max(0, rank - 449));
}
function skillCooldown(skill, lv) {
  return (skill.cd || 10) * .82 * skillCooldownMult(lv);
}

function formatSkillSeconds(text) {
  return String(text).replace(/(\d+(?:\.\d+)?)s\b/g, (match, raw) => {
    const value = Number(raw);
    if (!Number.isFinite(value)) return match;
    return (Math.round((value + Number.EPSILON) * 10) / 10) + 's';
  });
}

function skillGrowthParams(skill, lv) {
  const out = Object.assign({}, skill && skill.p || {});
  const utility = skillUtilityMult(lv), count = skillCountMult(lv);
  Object.keys(out).forEach(key => {
    const value = out[key];
    if (typeof value !== 'number' || !Number.isFinite(value)) return;
    // Authored combo gates and per-wave caps stay fixed when a skill levels up.
    if (skill.fixedP && skill.fixedP.includes(key)) return;
    if (SKILL_INTERVAL_KEYS.has(key)) {
      out[key] = Math.round(value * skillCooldownMult(lv) * 100) / 100;
    } else if (SKILL_COUNT_KEYS.has(key)) {
      out[key] = Math.max(1, Math.round(value * count));
    } else if (SKILL_DURATION_KEYS.has(key)) {
      out[key] = Math.round(value * utility * 10) / 10;
    } else if (SKILL_AREA_KEYS.has(key) || SKILL_POWER_KEYS.has(key)) {
      out[key] = Math.round(value * utility * 1000) / 1000;
    } else {
      // Thresholds and bespoke passive knobs are effects too.
      const v = key === 'thr' || key === 'full' || key === 'crit'
        ? Math.min(.95, value * utility)
        : value * utility;
      out[key] = Math.round(v * 1000) / 1000;
    }
  });
  return out;
}

/* ============================================================
   SKILL DESCRIPTION ENGINE (Unified, Robust, Interactive)
   ============================================================ */
const SkillDesc = {
  getMode() {
    return (typeof Save !== 'undefined' && Save.data && Save.data.skillDescMode) || 'both';
  },

  setMode(mode) {
    if (typeof Save !== 'undefined' && Save.data) {
      Save.data.skillDescMode = mode;
      if (typeof Save.write === 'function') Save.write();
    }
    if (typeof document !== 'undefined' && document.querySelectorAll) {
      document.querySelectorAll('.sk-desc-root').forEach(el => {
        el.classList.remove('sk-mode-both', 'sk-mode-calc', 'sk-mode-pct');
        el.classList.add('sk-mode-' + mode);
      });
      document.querySelectorAll('.sk-mode-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.mode === mode);
      });
    }
  },

  modeToggleHtml() {
    const cur = this.getMode();
    return `<div class="sk-mode-bar" title="Change skill description display mode">
      <button type="button" class="sk-mode-btn ${cur === 'pct' ? 'active' : ''}" data-mode="pct" onclick="SkillDesc.setMode('pct'); event.stopPropagation();">% Ratio</button>
      <button type="button" class="sk-mode-btn ${cur === 'calc' ? 'active' : ''}" data-mode="calc" onclick="SkillDesc.setMode('calc'); event.stopPropagation();"># Hit</button>
      <button type="button" class="sk-mode-btn ${cur === 'both' ? 'active' : ''}" data-mode="both" onclick="SkillDesc.setMode('both'); event.stopPropagation();">✦ Both</button>
    </div>`;
  },

  getStats(heroId, spec) {
    let st = null;
    try {
      const s = spec || (typeof playerSpec === 'function' ? playerSpec(heroId) : { id: heroId, level: 70, rarity: 5 });
      st = new Unit(s, 0, 0, { auras: [] }).st;
    } catch (e) {
      const d = HEROES[heroId];
      st = Object.assign({ hp: 4000, atk: 500, mag: 500, def: 200, mdef: 200 }, (d && d.base) || {});
    }
    return st;
  },

  safeParams(skill, lv) {
    const mult = skillMult(lv);
    const S = {};
    for (const k in (skill.v || {})) S[k] = skill.v[k] * mult;
    const P = skillGrowthParams(skill, lv);
    const safeS = new Proxy(S, {
      get: (t, p) => (p in t ? t[p] : (P && p in P ? P[p] : 1))
    });
    const safeP = new Proxy(P, {
      get: (t, p) => (p in t ? t[p] : (S && p in S ? S[p] : 1))
    });
    return { S, P, safeS, safeP };
  },

  enhanceText(text, skill, st) {
    if (!text) return '';
    let out = formatSkillSeconds(text);

    const escapeAttr = s => String(s || '').replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

    // Dynamic value chips for <em>
    out = out.replace(/<em>([^<]+)<\/em>/g, (match, valStr, offset, fullStr) => {
      const pctMatch = valStr.match(/^([\d.]+)%$/);
      const following = fullStr.slice(offset + match.length, offset + match.length + 40).toLowerCase();
      const preceding = fullStr.slice(Math.max(0, offset - 30), offset).toLowerCase();

      // Check if this percentage is a utility stat or fixed debuff/buff rather than an Attack/Magic ratio:
      const isUtilityPct = /\b(accuracy|evasion|speed|chance|resistance|crit|reduction|cdr|tenacity|aspd)\b/i.test(following)
        || /\b(stripping|reduces|reduced|chance of|gain \+|gains \+|has \+)\b/i.test(preceding);

      if (pctMatch && !isUtilityPct) {
        const pct = parseFloat(pctMatch[1]);
        let statKey = 'atk';
        let statLabel = 'Attack';
        const skillTypeLower = (skill && skill.type ? skill.type : '').toLowerCase();
        if (following.includes('magic') || skillTypeLower.includes('magic')) {
          statKey = 'mag'; statLabel = 'Magic Attack';
        } else if (following.includes('max hp') || following.includes('hp')) {
          statKey = 'hp'; statLabel = 'Max HP';
        } else if (following.includes('defense') || following.includes('armor')) {
          statKey = 'def'; statLabel = 'Defense';
        } else if (skillTypeLower.includes('physical')) {
          statKey = 'atk'; statLabel = 'Attack';
        }
        const statVal = (st && st[statKey]) || 500;
        const calcVal = Math.round(statVal * (pct / 100));
        const cleanFormula = `${pct}% × ${fmt(Math.round(statVal))} ${statLabel} = ${fmt(calcVal)}`;
        const safeFormula = escapeAttr(cleanFormula);
        return `<em class="sk-chip" data-pct="${pct}%" data-calc="${fmt(calcVal)}" data-formula="${safeFormula}" title="${safeFormula}" onclick="SkillDesc.inspect(this, event)"><span class="sk-chip-pct">${pct}%</span><span class="sk-chip-calc"> [${fmt(calcVal)}]</span></em>`;
      }
      return `<em class="sk-chip sk-chip-fixed"><span class="sk-chip-val">${valStr}</span></em>`;
    });

    // Helper: only replace text outside HTML tags so tag attributes (like data-formula or title) are NEVER corrupted
    const replaceTextOnly = (html, regex, replacement) => {
      return html.replace(/(<[^>]+>)|([^<]+)/g, (m, tag, textChunk) => {
        if (tag) return tag;
        return textChunk.replace(regex, replacement);
      });
    };

    // Keywords
    out = replaceTextOnly(out, /\b(Physical Damage|Physical Attack)\b/gi, '<span class="sk-kw sk-kw-phys">⚔️ $1</span>');
    out = replaceTextOnly(out, /\b(Magic Damage|Magic Attack)\b/gi, '<span class="sk-kw sk-kw-mag">✨ $1</span>');
    out = replaceTextOnly(out, /\b(True Damage)\b/gi, '<span class="sk-kw sk-kw-true">⚡ $1</span>');
    out = replaceTextOnly(out, /\b(Healing Received)\b/gi, '<span class="sk-kw sk-kw-heal">💚 $1</span>');
    out = replaceTextOnly(out, /\b(Energy Generation)\b/gi, '<span class="sk-kw sk-kw-energy">🔋 $1</span>');

    return typeof tagifyStatuses === 'function' ? tagifyStatuses(out) : out;
  },

  format(heroId, key, skill, skillLv, spec) {
    if (!skill) return '';
    const st = this.getStats(heroId, spec);
    let raw = '';
    if (key === 'basic') {
      const isMag = skill.type === 'magic';
      const pct = Math.round(skill.ratio * 100);
      raw = `${skill.note || ''} Deals <em>${pct}%</em> of ${isMag ? 'Magic Attack' : 'Attack'}.`;
    } else {
      const { safeS, safeP } = this.safeParams(skill, skillLv || 1);
      try {
        raw = skill.desc(safeS, safeP);
      } catch (e) {
        raw = skill.name || '';
      }
    }

    // Extract passive vs active blocks
    let passiveText = null;
    let activeText = null;

    const pasMatch = raw.match(/<span class="sk-pas">([\s\S]*?)<\/span>/i);
    if (pasMatch) {
      passiveText = pasMatch[1].trim();
      activeText = raw.replace(/<span class="sk-pas">[\s\S]*?<\/span>/i, '').replace(/^\s*Active:\s*/i, '').trim();
    } else if (key !== 'basic' && !skill.cast) {
      passiveText = raw.trim();
    } else {
      activeText = raw.replace(/^\s*Active:\s*/i, '').trim();
    }

    let html = '';
    if (passiveText) {
      html += `<div class="sk-box sk-box-pas"><div class="sk-box-badge">✦ PASSIVE TRAIT</div><div class="sk-box-body">${this.enhanceText(passiveText, skill, st)}</div></div>`;
    }
    if (activeText) {
      const badgeText = (key === 'W' || skill.energy) ? '★ ULTIMATE ABILITY' : '⚡ ACTIVE ABILITY';
      html += `<div class="sk-box sk-box-act"><div class="sk-box-badge">${badgeText}</div><div class="sk-box-body">${this.enhanceText(activeText, skill, st)}</div></div>`;
    }

    return html || `<div class="sk-box sk-box-act"><div class="sk-box-body">${this.enhanceText(raw, skill, st)}</div></div>`;
  },

  rankPreview(skill, lv, st) {
    if (!skill || lv >= SKILL_MAX_LEVEL) return '';
    const next = lv + 1;
    const { S: curS, P: curP } = this.safeParams(skill, lv);
    const { S: nxtS, P: nxtP } = this.safeParams(skill, next);
    const changes = [];

    const formatDiff = (key, curVal, nxtVal) => {
      const label = key.replace(/([A-Z])/g, ' $1').replace(/^./, c => c.toUpperCase());
      const isPct = Math.abs(curVal) <= 1.5;
      const curStr = isPct ? (curVal * 100).toFixed(1).replace(/\.0$/, '') + '%' : curVal.toFixed(1).replace(/\.0$/, '');
      const nxtStr = isPct ? (nxtVal * 100).toFixed(1).replace(/\.0$/, '') + '%' : nxtVal.toFixed(1).replace(/\.0$/, '');
      let extra = '';
      if (isPct && st) {
        const isMag = (skill.type || '').toLowerCase().includes('magic');
        const stat = isMag ? (st.mag || 500) : (st.atk || 500);
        const diffDmg = Math.round(stat * (nxtVal - curVal));
        if (diffDmg > 0) extra = ` <small class="sk-next-delta">(+${diffDmg} ${isMag ? 'Mag' : 'Phys'})</small>`;
      }
      return `<div class="sk-next-item"><span class="sk-next-label">${label}</span> <b class="sk-next-diff">${curStr} → ${nxtStr}</b>${extra}</div>`;
    };

    Object.keys(curS).forEach(key => {
      if (changes.length < 3 && Math.abs(nxtS[key] - curS[key]) > 0.00001) {
        changes.push(formatDiff(key, curS[key], nxtS[key]));
      }
    });
    Object.keys(curP).forEach(key => {
      if (changes.length < 3 && Math.abs(nxtP[key] - curP[key]) > 0.00001) {
        changes.push(formatDiff(key, curP[key], nxtP[key]));
      }
    });
    if (skill.cd && changes.length < 3) {
      const curCd = skillCooldown(skill, lv).toFixed(1);
      const nxtCd = skillCooldown(skill, next).toFixed(1);
      changes.push(`<div class="sk-next-item"><span class="sk-next-label">Cooldown</span> <b class="sk-next-diff">${curCd}s → ${nxtCd}s</b> <small class="sk-next-delta">(-${(curCd - nxtCd).toFixed(1)}s)</small></div>`);
    }

    return changes.join('');
  },

  inspect(chip, ev) {
    if (ev && ev.stopPropagation) ev.stopPropagation();
    const formula = chip.dataset.formula;
    if (formula && typeof UI !== 'undefined' && UI.toast) {
      UI.toast(formula, { icon: '📊', time: 3400 });
    }
  }
};

/* ---------------- classes ---------------- */
/* Classes and subclasses are fifty-rank combat specializations. Rank 1 is
   learned for free when a Hero first equips a path; Manuals raise it from
   there. Enemies use the same packages and receive ranks from encounter
   difficulty, so this is one ruleset rather than hidden enemy-only bonuses. */
const CLASS_MAX_RANK = 50;
function trainingScale(rank) { return 1 + (clamp(rank || 1, 1, CLASS_MAX_RANK) - 1) / (CLASS_MAX_RANK - 1); }
const TRAINING_STAT_LABELS = {
  hpP: 'Max HP', atkP: 'Attack', defP: 'Defense', magP: 'Magic Attack', mdefP: 'Magic Defense',
  aspdP: 'Attack Speed', msP: 'Move Speed', spdP: 'Speed', accP: 'Accuracy', evaP: 'Evasion',
  crit: 'Crit Chance', critDmg: 'Crit Damage', cdr: 'Cooldown Recovery', ccRes: 'CC Resistance',
  armorPen: 'Armor Penetration', magPen: 'Magic Penetration', energyGen: 'Energy Generation',
  healPowP: 'Healing Power', shieldPowP: 'Shield Power'
};

/* Each path gets a small, direct stat identity in addition to its authored
   combat mechanic. The bonus starts at Rank 2 and reaches roughly +7.4% on
   the focused stat at Rank 50, so higher ranks are visible without replacing
   the class's actual play pattern. */
const CLASS_STAT_PROFILES = {
  Vanguard: { hpP: .0015, defP: .0008, mdefP: .0008 }, Duelist: { atkP: .0015 },
  Medic: { healPowP: .0015 }, Warden: { ccRes: .0015 }, Saboteur: { atkP: .0015 },
  Runner: { msP: .0015, spdP: .0008 }, Bastion: { hpP: .0015, defP: .0008, mdefP: .0008 },
  Arcanist: { magP: .0015 }, Striker: { atkP: .0015 }, Oracle: { accP: .0015, energyGen: .0012 }
};
const SUBCLASS_STAT_PROFILES = {
  Sharp: { crit: .0012 }, Sturdy: { defP: .0012, mdefP: .0012 }, Swift: { aspdP: .0012 },
  Bright: { magP: .0012 }, Heavy: { hpP: .0012 }, Clear: { ccRes: .0015 },
  Keen: { accP: .0012 }, Piercing: { armorPen: .0012, magPen: .0012 },
  Charged: { energyGen: .0012 }, Mending: { healPowP: .0012, shieldPowP: .0012 },
  Elusive: { evaP: .0012, msP: .0012 }, Fierce: { critDmg: .0012 }
};
function trainingStatBonus(rank) { return Math.max(0, clamp(rank || 1, 1, CLASS_MAX_RANK) - 1); }
function applyTrainingStatBonus(u, path, name, rank) {
  const profile = (path === 'class' ? CLASS_STAT_PROFILES : SUBCLASS_STAT_PROFILES)[name];
  if (!profile || !u || !u.flat) return;
  const levels = trainingStatBonus(rank);
  Object.entries(profile).forEach(([key, perRank]) => {
    u.flat[key] = (u.flat[key] || 0) + levels * perRank;
  });
}
function trainingStatEntries(path, name, rank) {
  const profile = (path === 'class' ? CLASS_STAT_PROFILES : SUBCLASS_STAT_PROFILES)[name];
  const levels = trainingStatBonus(rank);
  if (!profile || !levels) return [];
  return Object.entries(profile).map(([key, perRank]) => ({
    key, label: TRAINING_STAT_LABELS[key] || key, percent: levels * perRank * 100
  }));
}
function trainingStatDescription(def, rank) {
  if (!def) return '';
  const stats = trainingStatEntries(def._trainingPath, def._trainingName, rank)
    .map(stat => `+${pcn(stat.percent)}% ${stat.label}`);
  if (!stats.length) return '';
  return ` <span class="class-rank-stat">· Rank bonus: ${stats.join(' · ')}</span>`;
}
function classDesc(def, rank) {
  const value = def.describe ? def.describe(clamp(rank || 1, 1, CLASS_MAX_RANK)) : def.desc;
  return value + trainingStatDescription(def, rank);
}
function classUpgradeCost(rank, subclass) {
  rank = clamp(rank || 1, 1, CLASS_MAX_RANK);
  // Rank 50 is a long-term sink, but keep each step readable and affordable
  // enough that bulk training remains useful instead of requiring a single
  // absurd final purchase.
  return { manual: Math.ceil((subclass ? 4 : 6) * Math.pow(1.12, rank - 1)) };
}
const CLASSES = {
  Vanguard: { icon: '🛡', describe: r => `Start with a ${Math.round(10 * trainingScale(r))}% Max HP shield.`,
    apply: (u, B, r) => B.shield(u, u, u.max.hp * .10 * trainingScale(r), 12) },
  Duelist: { icon: '⚔', describe: r => `Defeats grant Attack Up for ${Math.round(7 + 3 * trainingScale(r))}s.`,
    apply: (u, B, r) => B.on(u, 'enemyDown', () => B.applyStatus(u, u, 'atkup', 7 + 3 * trainingScale(r), { stacks: r >= 8 ? 2 : 1 })) },
  Medic: { icon: '💚', describe: r => `Heal the lowest ally for ${(2.5 * trainingScale(r)).toFixed(1)}% Max HP every 4s.`,
    apply: (u, B, r) => B.every(u, 4, () => { const a = B.lowestHp(B.alliesOf(u)); if (a) B.heal(u, a, a.max.hp * .025 * trainingScale(r), { silent: true }); }) },
  Warden: { icon: '⛓', describe: r => `Crowd control lasts ${Math.round(14 * trainingScale(r))}% longer.`,
    apply: (u, B, r) => { u.ccDurBonus = .14 * trainingScale(r); } },
  Saboteur: { icon: '☠', describe: r => `Basic attacks apply scaling Poison for 5s.`,
    apply: (u, B, r) => B.on(u, 'basicHit', ev => B.applyStatus(u, ev.target, 'poison', 5, { val: u.st.atk * .035 * trainingScale(r) })) },
  Runner: { icon: '🏃', describe: r => `Move ${Math.round(14 * trainingScale(r))}% faster and gain Haste below half HP.`,
    apply: (u, B, r) => { u.flat.msP = (u.flat.msP || 0) + .14 * trainingScale(r);
      B.every(u, 2, () => { if (u.hp / u.max.hp < .5) B.applyStatus(u, u, 'haste', 2 + trainingScale(r)); }); } },
  Bastion: { icon: '🏰', describe: r => `Gain ${Math.round(8 * trainingScale(r))}% Max HP and draw more enemy attention.`,
    apply: (u, B, r) => { const s = trainingScale(r); u.flat.hpP = (u.flat.hpP || 0) + .08 * s; u.flat.aggro = (u.flat.aggro || 0) + .35 * s; } },
  Arcanist: { icon: '🔮', describe: r => `Gain ${Math.round(8 * trainingScale(r))}% Magic Attack and cooldown recovery.`,
    apply: (u, B, r) => { const s = trainingScale(r); u.flat.magP = (u.flat.magP || 0) + .08 * s; u.flat.cdr = (u.flat.cdr || 0) + .04 * s; } },
  Striker: { icon: '🥊', describe: r => `Gain ${Math.round(7 * trainingScale(r))}% Attack and Armor Penetration.`,
    apply: (u, B, r) => { const s = trainingScale(r); u.flat.atkP = (u.flat.atkP || 0) + .07 * s; u.flat.armorPen = (u.flat.armorPen || 0) + .05 * s; } },
  Oracle: { icon: '👁', describe: r => `Gain Accuracy and generate ${Math.round(8 * trainingScale(r))}% more Energy.`,
    apply: (u, B, r) => { const s = trainingScale(r); u.flat.accP = (u.flat.accP || 0) + .08 * s; u.flat.energyGen = (u.flat.energyGen || 0) + .08 * s; } }
};
const SUBCLASSES = {
  Sharp: { icon: '🎯', describe: r => `+${Math.round(6 * trainingScale(r))}% Crit Chance`, apply: (u, B, r) => u.flat.crit = (u.flat.crit || 0) + .06 * trainingScale(r) },
  Sturdy: { icon: '🧱', describe: r => `+${Math.round(7 * trainingScale(r))}% Defense and Magic Defense`, apply: (u, B, r) => { const s = trainingScale(r); u.flat.defP = (u.flat.defP || 0) + .07 * s; u.flat.mdefP = (u.flat.mdefP || 0) + .07 * s; } },
  Swift: { icon: '💨', describe: r => `+${Math.round(8 * trainingScale(r))}% Attack Speed`, apply: (u, B, r) => u.flat.aspdP = (u.flat.aspdP || 0) + .08 * trainingScale(r) },
  Bright: { icon: '✨', describe: r => `+${Math.round(8 * trainingScale(r))}% Magic Attack`, apply: (u, B, r) => u.flat.magP = (u.flat.magP || 0) + .08 * trainingScale(r) },
  Heavy: { icon: '🪨', describe: r => `+${Math.round(9 * trainingScale(r))}% Max HP`, apply: (u, B, r) => u.flat.hpP = (u.flat.hpP || 0) + .09 * trainingScale(r) },
  Clear: { icon: '⚓', describe: r => `+${Math.round(14 * trainingScale(r))}% CC Resistance`, apply: (u, B, r) => u.flat.ccRes = (u.flat.ccRes || 0) + .14 * trainingScale(r) },
  Keen: { icon: '🔍', describe: r => `+${Math.round(10 * trainingScale(r))}% Accuracy`, apply: (u, B, r) => u.flat.accP = (u.flat.accP || 0) + .10 * trainingScale(r) },
  Piercing: { icon: '🗡', describe: r => `+${Math.round(6 * trainingScale(r))}% Armor and Magic Penetration`, apply: (u, B, r) => { const s = trainingScale(r); u.flat.armorPen = (u.flat.armorPen || 0) + .06 * s; u.flat.magPen = (u.flat.magPen || 0) + .06 * s; } },
  Charged: { icon: '⚡', describe: r => `+${Math.round(10 * trainingScale(r))}% Energy generation`, apply: (u, B, r) => u.flat.energyGen = (u.flat.energyGen || 0) + .10 * trainingScale(r) },
  Mending: { icon: '🩹', describe: r => `+${Math.round(10 * trainingScale(r))}% healing and shield power`, apply: (u, B, r) => { const s = trainingScale(r); u.flat.healPowP = (u.flat.healPowP || 0) + .10 * s; u.flat.shieldPowP = (u.flat.shieldPowP || 0) + .10 * s; } },
  Elusive: { icon: '🌫', describe: r => `+${Math.round(6 * trainingScale(r))}% Evasion and Move Speed`, apply: (u, B, r) => { const s = trainingScale(r); u.flat.evaP = (u.flat.evaP || 0) + .06 * s; u.flat.msP = (u.flat.msP || 0) + .06 * s; } },
  Fierce: { icon: '🔥', describe: r => `+${Math.round(12 * trainingScale(r))}% Critical Damage`, apply: (u, B, r) => u.flat.critDmg = (u.flat.critDmg || 0) + .12 * trainingScale(r) }
};

/* Apply the small rank-stat layer through the same hooks used by combat and
   the detached Hero skill preview. Keeping it as a wrapper avoids duplicating
   the bonus inside every authored class definition. */
Object.entries(CLASSES).forEach(([name, def]) => {
  def._trainingName = name; def._trainingPath = 'class';
  const authored = def.apply;
  def.apply = (u, B, rank) => { applyTrainingStatBonus(u, 'class', name, rank); authored(u, B, rank); };
});
Object.entries(SUBCLASSES).forEach(([name, def]) => {
  def._trainingName = name; def._trainingPath = 'subclass';
  const authored = def.apply;
  def.apply = (u, B, rank) => { applyTrainingStatBonus(u, 'subclass', name, rank); authored(u, B, rank); };
});

/* Role-weighted but deterministic enemy training. Every hostile combatant,
   including weaklings and Arena rivals, gets a class and subclass. */
const ENEMY_CLASS_POOLS = {
  Tank: ['Vanguard', 'Warden', 'Bastion', 'Runner'],
  Support: ['Medic', 'Oracle', 'Arcanist', 'Warden'],
  Control: ['Warden', 'Saboteur', 'Oracle', 'Arcanist'],
  Damage: ['Duelist', 'Saboteur', 'Striker', 'Arcanist', 'Runner']
};
const ENEMY_SUBCLASS_POOLS = {
  Tank: ['Sturdy', 'Heavy', 'Clear', 'Elusive'],
  Support: ['Bright', 'Charged', 'Mending', 'Keen'],
  Control: ['Clear', 'Keen', 'Charged', 'Piercing'],
  Damage: ['Sharp', 'Swift', 'Piercing', 'Fierce', 'Keen']
};
function enemyTraining(id, level, kind, salt) {
  const role = HEROES[id] ? HEROES[id].role : 'Damage';
  const rng = seeded(`training-${currentWeek()}-${salt || id}-${level}-${kind || 'normal'}`);
  const bump = kind === 'boss' ? 3 : kind === 'elite' ? 2 : kind === 'rival' ? 1 : kind === 'weakling' ? -1 : 0;
  return {
    cls: rng.pick(ENEMY_CLASS_POOLS[role] || ENEMY_CLASS_POOLS.Damage),
    subcls: rng.pick(ENEMY_SUBCLASS_POOLS[role] || ENEMY_SUBCLASS_POOLS.Damage),
    classRank: clamp(1 + Math.floor(level / 55) + bump, 1, CLASS_MAX_RANK),
    subclassRank: clamp(1 + Math.floor(level / 70) + bump, 1, CLASS_MAX_RANK)
  };
}

/* A few authored event enemies do not come through makeTwisted() or
   makeWeakling(). Normalize those specs at the final battle boundary so
   machines, collaboration challengers, and event-only bosses still use the
   same class rules as ordinary enemies. Existing authored training is kept. */
function ensureEnemyTraining(spec, salt) {
  if (!spec || spec.noTraining || !spec.id || HEROES[spec.id]?.noDamage) return spec;
  const level = Math.max(1, Number(spec.level) || 1);
  const kind = spec.kind || (spec.boss ? 'boss' : spec.elite ? 'elite' : 'normal');
  const training = enemyTraining(spec.id, level, kind, salt || `${spec.id}-${level}-${kind}`);
  if (!spec.cls || !CLASSES[spec.cls]) spec.cls = training.cls;
  if (!spec.subcls || !SUBCLASSES[spec.subcls]) spec.subcls = training.subcls;
  if (!Number.isFinite(Number(spec.classRank)) || Number(spec.classRank) < 1) spec.classRank = training.classRank;
  if (!Number.isFinite(Number(spec.subclassRank)) || Number(spec.subclassRank) < 1) spec.subclassRank = training.subclassRank;
  const rarity = clamp(Number(spec.rarity) || 1, 1, 6);
  if (rarity >= 6) {
    spec.cls2 = spec.cls2 || Object.keys(CLASSES).find(k => k !== spec.cls) || null;
    spec.subcls2 = spec.subcls2 || Object.keys(SUBCLASSES).find(k => k !== spec.subcls) || null;
    if (!Number.isFinite(Number(spec.classRank2)) || Number(spec.classRank2) < 1) spec.classRank2 = 1;
    if (!Number.isFinite(Number(spec.subclassRank2)) || Number(spec.subclassRank2) < 1) spec.subclassRank2 = 1;
  }
  return spec;
}
