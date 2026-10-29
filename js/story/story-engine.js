/* story-engine.js - Main Story turn-based battle core.
   Pure logic, no DOM: the screen layer (story-battle.js) reads the event list
   each action returns and animates it. Turn order is a charge-time timeline:
   every unit waits a delay based on Speed, so fast units act more often and
   the next turns can always be previewed. Enemies have a Stagger gauge that
   Breaks into a lost turn plus extra damage; Breaking a charging enemy
   cancels its telegraphed attack. Handlers fill a Bond gauge that calls
   their Toon's power through the badge. */
'use strict';

const ST_ROLE_ICON = { Guardian: '🛡', Broadcaster: '📺', Baker: '🧁', Excavator: '⛏', Dreamkeeper: '🌙' };

/* ------------------------------------------------------------ HANDLERS
   base = level 1 stats, grow = gain per level. Skills unlock when the named
   story scene has been seen (or 'badge' = from the moment badges wake). */
const ST_HANDLERS = {
  Devan: {
    name: 'Devan', full: 'Devan Reed', toon: 'Pebble', assignment: 'Dandy & Pebble', role: 'Guardian', color: '#d9dde2', accent: '#8f98a3',
    art: 'uploads/Devanbattle.webp', basicName: 'Rocky Nudge', basicKind: 'phys', improvised: 'Mop Swing',
    base: { hp: 132, fp: 22, atk: 14, mag: 6, def: 13, mdef: 9, spd: 10.5, luck: 6 },
    grow: { hp: 15, fp: 1.4, atk: 1.55, mag: .55, def: 1.45, mdef: 1.05, spd: .16, luck: .2 },
    passive: { name: 'Small Target', desc: 'Devan dodges 12% of incoming attacks, and Taunted enemies hit him 15% softer.' },
    skills: [
      { id: 'tackle', name: 'Rocky Tackle', fp: 6, unlock: 'badge', target: 'enemy', kind: 'phys', power: 1.55, stagger: 3.2,
        desc: 'A heavy shoulder-check. Big Stagger damage.' },
      { id: 'speak', name: 'Speak!', fp: 8, unlock: 'badge', target: 'self', kind: 'buff',
        desc: 'Bark like Pebble: Taunt every enemy for 2 turns and raise Devan’s Defense for 2 turns.' },
      { id: 'fetch', name: 'Fetch!', fp: 9, unlock: 's5', target: 'ally', kind: 'buff',
        desc: 'Throw himself in front of an ally: a Shield worth 26% of Devan’s Max HP for 3 turns.' },
      { id: 'goodboy', name: 'Good Boy!', fp: 14, unlock: 's9', target: 'allies', kind: 'buff',
        desc: 'Party Defense up for 3 turns. Devan gains Regen for 3 turns.' }
    ],
    bond: { name: 'Rock Solid', toonLine: 'Pebble barks through the badge!', desc: 'Shield the whole party (22% of Devan’s Max HP), Taunt all enemies for 3 turns and counter every hit taken for 3 turns.' }
  },
  Veronica: {
    name: 'Veronica', full: 'Veronica Hurley', toon: 'Vee', role: 'Broadcaster', color: '#46d65a', accent: '#1f8a31',
    art: 'uploads/veronicabattle.webp', basicName: 'Static Mote', basicKind: 'mag', improvised: 'Extinguisher Blast',
    base: { hp: 86, fp: 30, atk: 8, mag: 17.5, def: 7, mdef: 11, spd: 12, luck: 8 },
    grow: { hp: 9.2, fp: 2.1, atk: .8, mag: 2.0, def: .8, mdef: 1.2, spd: .2, luck: .25 },
    passive: { name: 'Ratings Chase', desc: 'Each hit in a row on the same enemy deals 10% more (up to +40%). Switching targets resets the streak.' },
    skills: [
      { id: 'spotlight', name: 'Spotlight On', fp: 6, unlock: 'badge', target: 'enemy', kind: 'mag', power: 1.2, stagger: 1.4,
        desc: 'Magic hit that puts the enemy on camera: Marked for 3 turns (takes 25% more damage).' },
      { id: 'surge', name: 'Audience Surge', fp: 11, unlock: 'badge', target: 'enemies', kind: 'mag', power: .78, stagger: .8,
        desc: 'The crowd roars. Magic damage to every enemy.' },
      { id: 'break', name: 'Commercial Break', fp: 12, unlock: 's7', target: 'enemy', kind: 'mag', power: 1.0, stagger: 2,
        desc: 'Magic hit with a 65% chance to Stun. Bosses are instead knocked back on the timeline.' },
      { id: 'live', name: 'Live Broadcast', fp: 18, unlock: 's12', target: 'enemy', kind: 'mag', power: 2.3, stagger: 3,
        desc: 'Ichor static in every word. Huge magic hit; +50% and double Stagger against a Marked enemy.' }
    ],
    bond: { name: 'Prime Time', toonLine: 'Vee takes the broadcast!', desc: 'Magic damage to every enemy and Mark them all for 3 turns.' }
  },
  Sam: {
    name: 'Sam', full: 'Sam McLaughlin', toon: 'Sprout', role: 'Baker', color: '#ff5a5f', accent: '#b52a35',
    art: 'uploads/Sambattle.webp', basicName: 'Tossed Sweets', basicKind: 'mag', improvised: 'Rolling Pin',
    base: { hp: 94, fp: 34, atk: 7, mag: 13, def: 8.5, mdef: 12, spd: 12.5, luck: 7 },
    grow: { hp: 10.4, fp: 2.4, atk: .7, mag: 1.45, def: .9, mdef: 1.3, spd: .2, luck: .2 },
    passive: { name: 'Overprotective', desc: 'The first time each ally drops under 30% HP in a battle, Sam instantly tosses them a treat (15% Max HP).' },
    skills: [
      { id: 'sweets', name: 'Baked Sweets', fp: 6, unlock: 'badge', target: 'ally', kind: 'heal',
        desc: 'Heal one ally for 30% of their Max HP plus Sam’s Magic.' },
      { id: 'stayclose', name: 'Stay Close', fp: 8, unlock: 'badge', target: 'ally', kind: 'buff',
        desc: 'Regen (9% Max HP per turn) and Defense up on one ally for 3 turns.' },
      { id: 'oven', name: 'Fresh Out of the Oven', fp: 15, unlock: 's5', target: 'allies', kind: 'heal',
        desc: 'Heal the whole party for 22% Max HP and wash off Ichor.' },
      { id: 'batch', name: 'Second Batch', fp: 20, unlock: 's11', target: 'ko', kind: 'heal',
        desc: 'Bring a fallen ally back with 40% HP.' }
    ],
    bond: { name: 'Bake Sale', toonLine: 'Sprout bakes through the badge!', desc: 'Heal everyone 55%, revive the fallen at 30% and cleanse all ailments.' }
  },
  Shannon: {
    name: 'Shanon', full: 'Shanon Mendez', toon: 'Shelly', role: 'Excavator', color: '#f3b04a', accent: '#a86b17',
    art: 'uploads/Shanonbattle.webp', basicName: 'Trowel Strike', basicKind: 'phys', improvised: 'Trowel Strike',
    base: { hp: 100, fp: 28, atk: 12.5, mag: 11, def: 9.5, mdef: 10, spd: 13.5, luck: 9 },
    grow: { hp: 11.2, fp: 2.0, atk: 1.35, mag: 1.2, def: 1.0, mdef: 1.1, spd: .22, luck: .3 },
    passive: { name: 'Field Notes', desc: 'Shanon’s first hit on each enemy deals 30% more and double Stagger.' },
    skills: [
      { id: 'stratum', name: 'Stratum Extraction', fp: 6, unlock: 'badge', target: 'enemy', kind: 'phys', power: 1.15, stagger: 1.8,
        desc: 'Dig into the enemy’s guard: Defense down for 3 turns.' },
      { id: 'inspire', name: 'Inspiration!', fp: 10, unlock: 'badge', target: 'ally', kind: 'buff',
        desc: 'An ally gains Attack and Magic up for 3 turns and Haste for 2 turns, and acts sooner.' },
      { id: 'fossil', name: 'Greatest Fossil Discovery', fp: 11, unlock: 's9', target: 'enemy', kind: 'phys', power: 1.3, stagger: 0,
        desc: 'Find the crack. Fills half of the enemy’s Stagger gauge.' },
      { id: 'solver', name: 'Problem Solver', fp: 12, unlock: 's11', target: 'allies', kind: 'buff',
        desc: 'Cleanse the party and restore 7 FP to everyone else.' }
    ],
    bond: { name: 'Rainbow Beam', toonLine: 'Shelly lights the dig site!', desc: 'Prismatic damage to every enemy, then the party gains Attack and Magic up for 3 turns.' }
  },
  Austin: {
    name: 'Austin', full: 'Austin Russo', toon: 'Astro', role: 'Dreamkeeper', color: '#4d6fe0', accent: '#24357e',
    art: 'uploads/austinbattle.webp', basicName: 'Lullaby Mote', basicKind: 'mag', improvised: 'Lullaby Mote',
    base: { hp: 90, fp: 32, atk: 9, mag: 15.5, def: 7.5, mdef: 13.5, spd: 10, luck: 8 },
    grow: { hp: 9.8, fp: 2.3, atk: .9, mag: 1.75, def: .8, mdef: 1.4, spd: .16, luck: .25 },
    passive: { name: 'Well Rested', desc: 'While Austin stands, every party member regains 2 FP at the start of their turn.' },
    skills: [
      { id: 'pulse', name: 'Dream Pulse', fp: 6, unlock: 'badge', target: 'enemy', kind: 'mag', power: 1.15, stagger: 1.2,
        desc: 'Magic hit. The ally lowest on FP regains 5 FP.' },
      { id: 'slumber', name: 'Peaceful Slumber', fp: 10, unlock: 'badge', target: 'enemy', kind: 'debuff',
        desc: '85% chance to Sleep an enemy for 2 turns (damage wakes it). Bosses are Slowed instead.' },
      { id: 'stars', name: 'Falling Stars', fp: 14, unlock: 's9', target: 'enemies', kind: 'mag', power: .52, stagger: .7, hits: 4,
        desc: 'Four falling stars strike random enemies.' }
    ],
    bond: { name: 'Endless Night', toonLine: 'Astro hums through the badge…', desc: 'Every enemy falls asleep for 1 turn (bosses are Slowed), the party heals 25% and regains 10 FP.' }
  }
};
const ST_HANDLER_IDS = Object.keys(ST_HANDLERS);
/* Chapter 2 plays the Toons themselves: same shape as a Handler, filled in by ch2-toons.js. */
const ST_TOONS = {};
function stChar(k) { return ST_HANDLERS[k] || ST_TOONS[k]; }

/* ------------------------------------------------------------ ITEMS */
const ST_ITEMS = {
<<<<<<< HEAD
  bandage: { name: 'Bandage', icon: ItemSheet.url('bandage'), target: 'ally', desc: 'Restore 40% HP.' },
  medkit: { name: 'Med Kit', icon: ItemSheet.url('Medkit'), target: 'allies', desc: 'Restore 35% HP to the whole party.' },
  pop: { name: 'Bottle o’ Pop', icon: ItemSheet.url('Bottleopop'), target: 'ally', desc: 'Restore 18 FP.' },
  speed: { name: 'Speed Candy', icon: ItemSheet.url('Speedcandy'), target: 'ally', desc: 'Haste for 3 turns.' },
  jumper: { name: 'Jumper Cable', icon: ItemSheet.url('Jumpercable'), target: 'ko', desc: 'Revive a fallen ally at 45% HP.' },
  jawbreaker: { name: 'Jawbreaker', icon: ItemSheet.url('jawbreaker'), target: 'ally', desc: 'A Shield worth 30% of the ally’s Max HP for 3 turns.' },
  tonic: { name: 'Clean Tonic', icon: ItemSheet.url('Marmalade'), target: 'allies', desc: 'Wash off every ailment and restore 20% HP to the whole party.' },
  barrier: { name: 'Barrier Sign', icon: 'uploads/barriersign.png', target: 'allies', desc: 'Plant it in front of everyone: counts as a Tank for 3 turns, with Ward 25%.' },
  stealth: { name: 'Stealth Candy', icon: ItemSheet.url('Stealthcandy'), target: 'ally', desc: 'The ally can’t be singled out for 2 turns.' }
=======
  bandage: { name: 'Bandage', icon: 'item/bandage.png', target: 'ally', desc: 'Restore 40% HP.' },
  medkit: { name: 'Med Kit', icon: 'item/Medkit.png', target: 'allies', desc: 'Restore 35% HP to the whole party.' },
  pop: { name: 'Bottle o’ Pop', icon: 'item/Bottleopop.png', target: 'ally', desc: 'Restore 18 FP.' },
  speed: { name: 'Speed Candy', icon: 'item/Speedcandy.png', target: 'ally', desc: 'Haste for 3 turns.' },
  jumper: { name: 'Jumper Cable', icon: 'item/Jumpercable.png', target: 'ko', desc: 'Revive a fallen ally at 45% HP.' },
  jawbreaker: { name: 'Jawbreaker', icon: 'item/jawbreaker.png', target: 'ally', desc: 'A Shield worth 30% of the ally’s Max HP for 3 turns.' },
  tonic: { name: 'Clean Tonic', icon: 'item/Marmalade.png', target: 'allies', desc: 'Wash off every ailment and restore 20% HP to the whole party.' },
  stealth: { name: 'Stealth Candy', icon: 'item/Stealthcandy.png', target: 'ally', desc: 'The ally can’t be singled out for 2 turns.' }
>>>>>>> ccb31b9f96fec6e5b5e1509b31b66f6b3cb024e0
};

/* ------------------------------------------------------------ ENEMIES
   Stats are level 1 and grow ~11% per level. Moves are picked by weight;
   'tele' moves spend a turn charging first. `art` resolves in the UI. */
const ST_ENEMIES = {
  inkBottle: { name: 'Ink Bottle', art: 'w:Bottle', hp: 30, atk: 8, mag: 7, def: 6, mdef: 6, spd: 9, stagger: 6, exp: 1,
    moves: [{ name: 'Splash', kind: 'phys', power: 1, w: 3 }, { name: 'Ink Spit', kind: 'mag', power: .8, ink: .35, w: 2 }] },
  inkBall: { name: 'Ink Ball', art: 'w:Ball', hp: 25, atk: 9, mag: 4, def: 5, mdef: 5, spd: 13.5, stagger: 5, exp: 1,
    moves: [{ name: 'Bounce', kind: 'phys', power: .62, hits: 2, w: 3 }, { name: 'Ricochet', kind: 'phys', power: .55, target: 'random', hits: 3, w: 1 }] },
  inkSponge: { name: 'Ink Sponge', art: 'w:Sponge', hp: 44, atk: 6, mag: 8, def: 8, mdef: 4, spd: 7.5, stagger: 7, exp: 1.2,
    moves: [{ name: 'Soak', kind: 'mag', power: .55, target: 'all', ink: .25, w: 2 }, { name: 'Absorb', kind: 'heal', power: .22, w: 1, when: 'hurt' }, { name: 'Squelch', kind: 'phys', power: .9, w: 2 }] },
  inkBrick: { name: 'Ink Brick', art: 'w:Brick', hp: 56, atk: 11, mag: 3, def: 12, mdef: 6, spd: 6.5, stagger: 9, exp: 1.4,
    moves: [{ name: 'Slam', kind: 'phys', power: 1.3, w: 3 }, { name: 'Brace', kind: 'selfbuff', buff: 'defUp', w: 1 }] },
  inkBomb: { name: 'Ink Bomb', art: 'w:Bomb', hp: 22, atk: 6, mag: 13, def: 4, mdef: 4, spd: 11, stagger: 4, exp: 1,
    moves: [{ name: 'Ichor Burst', kind: 'mag', power: 1.3, target: 'all', ink: .5, tele: 'The Ink Bomb is ticking…', selfKo: true, w: 1 }] },
  inkHand: { name: 'Ichor Hand', art: 'w:Grape', hp: 40, atk: 12, mag: 8, def: 7, mdef: 7, spd: 12, stagger: 6, exp: 1.2,
    moves: [{ name: 'Grab', kind: 'phys', power: 1, slow: .5, w: 2 }, { name: 'Drag Under', kind: 'phys', power: 1.35, w: 2 }] },

  twBoxten: { name: 'Twisted Boxten', art: 't:Boxten', hp: 150, atk: 12, mag: 12, def: 10, mdef: 10, spd: 9.5, stagger: 22, exp: 5, boss: true,
    moves: [
      { name: 'Music Box Slam', kind: 'phys', power: 1.35, w: 3 },
      { name: 'Off-Key Lullaby', kind: 'mag', power: .6, target: 'all', sleep: .3, w: 2 },
      { name: 'Discordant Crescendo', kind: 'mag', power: 1.25, target: 'all', tele: 'Twisted Boxten winds his key. The melody swells…', w: 2, cd: 3 }
    ], phases: [{ at: .5, text: 'The melody skips. Twisted Boxten speeds up!', buff: 'haste' }] },
  twToodles: { name: 'Twisted Toodles', art: 't:Toodles', hp: 72, atk: 12, mag: 9, def: 8, mdef: 8, spd: 13, stagger: 12, exp: 2.2,
    moves: [{ name: 'Claw', kind: 'phys', power: 1.05, w: 3 }, { name: 'Bad Luck', kind: 'gamble', power: 1.9, w: 2 }] },
  twGigi: { name: 'Twisted Gigi', art: 't:Gigi', hp: 66, atk: 8, mag: 13, def: 7, mdef: 9, spd: 14, stagger: 11, exp: 2.2,
    moves: [{ name: 'Prank', kind: 'mag', power: .85, debuff: 'defDown', w: 2 }, { name: 'Coin Toss', kind: 'mag', power: 1.2, w: 3 }] },
  twFinn: { name: 'Twisted Finn', art: 't:Finn', hp: 84, atk: 13, mag: 8, def: 9, mdef: 7, spd: 11, stagger: 13, exp: 2.4,
    moves: [{ name: 'Hook Line', kind: 'phys', power: 1.1, slow: .6, w: 3 }, { name: 'Barnaby Splash', kind: 'mag', power: .7, target: 'all', w: 2 }] },
  twCosmo: { name: 'Twisted Cosmo', art: 't:Cosmo', hp: 78, atk: 10, mag: 12, def: 8, mdef: 10, spd: 10, stagger: 12, exp: 2.4,
    moves: [{ name: 'Burnt Batch', kind: 'mag', power: 1, ink: .45, w: 3 }, { name: 'Sugar Rush', kind: 'allybuff', buff: 'haste', w: 1 }] },
  twBrightney: { name: 'Twisted Brightney', art: 't:Brightney', hp: 90, atk: 8, mag: 13, def: 8, mdef: 11, spd: 12, stagger: 14, exp: 2.8,
    moves: [{ name: 'Flashbulb', kind: 'mag', power: .7, target: 'all', debuff: 'atkDown', w: 2 }, { name: 'Glare', kind: 'mag', power: 1.35, w: 3 }] },
  twShrimpo: { name: 'Twisted Shrimpo', art: 't:Shrimpo', hp: 100, atk: 15, mag: 6, def: 10, mdef: 6, spd: 10, stagger: 14, exp: 2.8,
    moves: [{ name: 'Grumble Punch', kind: 'phys', power: 1.3, w: 3 }, { name: 'I Hate This', kind: 'selfbuff', buff: 'atkUp', w: 1 }] },
  twRnD: { name: 'Twisted R&D', art: 't:RnD', hp: 215, atk: 13, mag: 15, def: 13, mdef: 12, spd: 9, stagger: 26, exp: 6, boss: true,
    moves: [
      { name: 'Sample Extraction', kind: 'mag', power: 1.15, ink: .6, drain: .5, w: 3 },
      { name: 'Containment Field', kind: 'selfbuff', buff: 'shield', w: 1, cd: 4 },
      { name: 'Replicate', kind: 'summon', summon: 'inkBottle', w: 1, cd: 4 },
      { name: 'Hazard Purge', kind: 'mag', power: 1.3, target: 'all', ink: .5, tele: 'Warning lights blaze across Twisted R&D. PURGE CYCLE ARMED.', w: 2, cd: 3 }
    ], phases: [{ at: .5, text: 'Twisted R&D vents black steam and summons more samples!', summon: ['inkBottle', 'inkBomb'] }] },
  twPoppy: { name: 'Twisted Poppy', art: 't:Poppy', hp: 150, atk: 12, mag: 14, def: 9, mdef: 10, spd: 13, stagger: 18, exp: 4, boss: true,
    moves: [
      { name: 'Where Is He?', kind: 'mag', power: 1.15, w: 3 },
      { name: 'Pop!', kind: 'mag', power: .75, target: 'all', w: 2 },
      { name: 'Bubble Wrap', kind: 'selfbuff', buff: 'shield', w: 1, cd: 4 }
    ] },
  twAstro: { name: 'Twisted Astro', art: 't:Astro', hp: 270, atk: 10, mag: 14, def: 11, mdef: 15, spd: 10.5, stagger: 30, exp: 8, boss: true,
    moves: [
      { name: 'Nightmare Pulse', kind: 'mag', power: 1.2, w: 3 },
      { name: 'Peaceful Slumber', kind: 'mag', power: .3, sleep: .8, w: 2, cd: 2 },
      { name: 'Falling Stars', kind: 'mag', power: .55, target: 'random', hits: 4, w: 2 },
      { name: 'Endless Night', kind: 'mag', power: 1.35, target: 'all', sleep: .25, tele: 'The lights go out. Twisted Astro’s eyes open wide in the dark…', w: 2, cd: 3 }
    ], phases: [{ at: .5, text: '"Five more minutes…" Twisted Astro curls up and mends itself.', heal: .12 }, { at: .25, text: 'The dark thickens. Twisted Astro is dreaming faster.', buff: 'haste' }] },
  twRodger: { name: 'Twisted Rodger', art: 't:Rodger', hp: 110, atk: 14, mag: 10, def: 11, mdef: 9, spd: 11, stagger: 16, exp: 3.2,
    moves: [{ name: 'Magnified Glare', kind: 'mag', power: 1, debuff: 'defDown', w: 2 }, { name: 'Case Closed', kind: 'phys', power: 1.4, w: 3 }] },
  twTeagan: { name: 'Twisted Teagan', art: 't:Teagan', hp: 104, atk: 9, mag: 14, def: 9, mdef: 12, spd: 10, stagger: 15, exp: 3.2,
    moves: [{ name: 'Bitter Blend', kind: 'mag', power: 1, debuff: 'atkDown', w: 3 }, { name: 'Steeped', kind: 'allyheal', power: .25, w: 2 }] },
  twTisha: { name: 'Twisted Tisha', art: 't:Tisha', hp: 98, atk: 13, mag: 8, def: 10, mdef: 8, spd: 14, stagger: 14, exp: 3.2,
    moves: [{ name: 'Duster Sweep', kind: 'phys', power: .72, target: 'all', w: 3 }, { name: 'Dust Cloud', kind: 'mag', power: .4, target: 'all', debuff: 'atkDown', w: 1 }] },
  twScraps: { name: 'Twisted Scraps', art: 't:Scraps', hp: 165, atk: 15, mag: 12, def: 11, mdef: 10, spd: 12, stagger: 20, exp: 4, boss: true,
    moves: [{ name: 'Snip', kind: 'phys', power: 1.4, w: 3 }, { name: 'Yarn Bind', kind: 'phys', power: .8, slow: 1, w: 2 }, { name: 'Shred', kind: 'phys', power: .8, target: 'all', w: 2 }] },
  twGoob: { name: 'Twisted Goob', art: 't:Goob', hp: 140, atk: 16, mag: 6, def: 13, mdef: 8, spd: 9, stagger: 18, exp: 4,
    moves: [{ name: 'Too-Tight Hug', kind: 'phys', power: 1.5, w: 3 }, { name: 'Wobble', kind: 'selfbuff', buff: 'defUp', w: 1 }] },
  dandy: { name: 'Dandy', art: 'd:Dandy', hp: 330, atk: 12.5, mag: 13.5, def: 14, mdef: 16, spd: 12.5, stagger: 36, exp: 10, boss: true,
    moves: [
      { name: 'Petal Storm', kind: 'mag', power: .62, target: 'all', w: 3 },
      { name: 'Price Check', kind: 'mag', power: 1.3, debuff: 'defDown', w: 3 },
      { name: 'Thorn Bind', kind: 'phys', power: .9, stun: .4, w: 2, cd: 2 },
      { name: 'No Refunds', kind: 'mag', power: 1.25, target: 'all', tele: 'Dandy folds his hands. "I’m afraid all sales are final."', w: 2, cd: 3 }
    ] },
  dandyBloom: { name: 'Dandy · Ichor Bloom', art: 't:Dandy', hp: 390, atk: 13.5, mag: 14.5, def: 14, mdef: 16, spd: 13.5, stagger: 40, exp: 14, boss: true,
    moves: [
      { name: 'Ichor Garden', kind: 'mag', power: .68, target: 'all', ink: .55, w: 3 },
      { name: 'Uproot', kind: 'phys', power: 1.45, w: 3 },
      { name: 'Grafting', kind: 'summon', summon: 'inkHand', w: 1, cd: 4 },
      { name: 'Last Petal', kind: 'mag', power: 1.45, target: 'all', tele: 'Every petal turns black at once. Dandy is no longer smiling.', w: 2, cd: 3 }
    ], phases: [{ at: .5, text: 'Black roots split the floor. Dandy grafts the Ichor to himself!', buff: 'atkUp', summon: ['inkHand', 'inkHand'] }] }
};

/* ------------------------------------------------------------ MATH */
const ST_ENEMY_GROW = .11;
const ST_DMG_ENEMY = 3.5;   // enemy hits are scaled up so a fight has tension
const ST_DMG_PARTY = 1.5;
const ST_MAX_FOES = 5;

function stRng(seed) {
  let s = (seed >>> 0) || 1;
  const f = () => { s ^= s << 13; s >>>= 0; s ^= s >> 17; s ^= s << 5; s >>>= 0; return s / 4294967296; };
  f.range = (a, b) => a + f() * (b - a);
  f.pick = arr => arr[Math.floor(f() * arr.length)];
  return f;
}

function stHandlerStats(id, lv) {
  const h = stChar(id), o = {};
  Object.keys(h.base).forEach(k => { o[k] = h.base[k] + h.grow[k] * (lv - 1); });
  o.hp = Math.round(o.hp); o.fp = Math.round(o.fp);
  return o;
}
function stEnemyStats(key, lv, mult) {
  const e = ST_ENEMIES[key], g = 1 + ST_ENEMY_GROW * (lv - 1), m = mult || {};
  // Later chapters hit a little harder than the stat curve alone, so the climb keeps rising.
  const ramp = 1 + .022 * (lv - 1);
  return {
    hp: Math.round(e.hp * g * (m.hp || 1)), atk: e.atk * g * ramp * (m.atk || 1), mag: e.mag * g * ramp * (m.atk || 1),
    def: e.def * g * (m.def || 1), mdef: e.mdef * g * (m.def || 1), spd: e.spd * (1 + .012 * (lv - 1)) * (m.spd || 1), luck: 5 + lv * .2
  };
}
function stExpNeed(lv) { return Math.round(36 + lv * 28 + lv * lv * 1.6); }

/* ------------------------------------------------------------ BATTLE */
class StoryBattle {
  /* opt: { party: [{id, lv, row}], foes: [[key, lv, {mult, name}]...], items, seed, improvised, unlocked(skillId)->bool } */
  constructor(opt) {
    this.rng = stRng(opt.seed || (Date.now() & 0xffffffff));
    this.units = [];
    this.turn = 0;
    this.items = Object.assign({}, opt.items || {});
    this.improvised = !!opt.improvised;
    this.over = false; this.win = false;
    this.uid = 0;
    this.phaseHooks = [];
<<<<<<< HEAD
    this.tier = opt.tier || 0;   // Chapter 3: how far along the enemy ramp this fight sits
=======
>>>>>>> ccb31b9f96fec6e5b5e1509b31b66f6b3cb024e0
    (opt.party || []).forEach(p => this.addHandler(p, opt));
    (opt.foes || []).forEach(f => this.addFoe(f[0], f[1], f[2] || {}));
    this.units.forEach(u => { u.ct = 1000 / u.s.spd * this.rng.range(.25, 1); });
  }

  addHandler(p, opt) {
    const h = stChar(p.id), s = stHandlerStats(p.id, p.lv);
    const skills = this.improvised ? [] : h.skills.filter(sk => !opt.unlocked || opt.unlocked(sk));
    const u = {
      uid: ++this.uid, key: p.id, side: 'p', name: h.name, lv: p.lv, row: p.row || 'front',
      max: { hp: s.hp, fp: s.fp }, hp: p.hp != null ? Math.min(s.hp, p.hp) : s.hp, fp: s.fp, s,
      st: {}, bond: p.bond || 0, skills, alive: p.hp !== 0, streak: { target: null, n: 0 }, touched: new Set(), saved: false
    };
    this.units.push(u); return u;
  }

  addFoe(key, lv, extra) {
    const e = ST_ENEMIES[key];
    if (!e) return null;
    const s = stEnemyStats(key, lv, extra.mult);
    const u = {
      uid: ++this.uid, key, side: 'e', name: extra.name || e.name, lv, row: 'front', def: e,
      max: { hp: s.hp, fp: 0 }, hp: s.hp, fp: 0, s, st: {}, alive: true, boss: !!(e.boss || extra.boss),
<<<<<<< HEAD
      stagger: { max: e.stagger * (extra.boss ? 1.4 : 1), cur: 0, broken: 0 }, tele: null, cds: {}, phaseDone: {}, exp: e.exp, mult: extra.mult
=======
      stagger: { max: e.stagger * (extra.boss ? 1.4 : 1), cur: 0, broken: 0 }, tele: null, cds: {}, phaseDone: {}, exp: e.exp
>>>>>>> ccb31b9f96fec6e5b5e1509b31b66f6b3cb024e0
    };
    this.units.push(u); return u;
  }

  /* ---------- queries ---------- */
  party() { return this.units.filter(u => u.side === 'p'); }
  foes() { return this.units.filter(u => u.side === 'e'); }
  living(side) { return this.units.filter(u => u.side === side && u.alive); }
  has(u, k) { return !!(u.st[k] && u.st[k].t > 0); }
  stat(u, k) {
    let v = u.s[k];
    const up = { atk: 'atkUp', mag: 'magUp', def: 'defUp', mdef: 'defUp' }[k], down = { atk: 'atkDown', mag: 'atkDown', def: 'defDown', mdef: 'defDown' }[k];
    if (k === 'mag' && this.has(u, 'atkUp') && !this.has(u, 'magUp')) v *= 1.3; // Inspiration / Rainbow raise both
    if (up && this.has(u, up)) v *= 1.3;
    if (down && this.has(u, down)) v *= .72;
    if ((k === 'def' || k === 'mdef') && this.has(u, 'fray')) v *= Math.max(.5, 1 - .07 * (u.st.fray.n || 1));
    if (k === 'spd') { if (this.has(u, 'haste')) v *= 1.45; if (this.has(u, 'slow')) v *= .65; }
    return v;
  }
  delay(u, mult) { return 1000 / this.stat(u, 'spd') * (mult || 1); }

  /* The next n actors by simulated charge time (for the timeline strip). */
  preview(n) {
    const sim = this.units.filter(u => u.alive).map(u => ({ u, ct: u.ct }));
    const out = [];
    for (let i = 0; i < n && sim.length; i++) {
      sim.sort((a, b) => a.ct - b.ct || a.u.uid - b.u.uid);
      const x = sim[0]; out.push(x.u);
      const step = x.ct; sim.forEach(y => { y.ct -= step; });
      x.ct = this.delay(x.u);
    }
    return out;
  }

  /* Pop the next actor and run start-of-turn ticks. Returns { actor, events, skip }. */
  next() {
    const live = this.units.filter(u => u.alive);
    live.sort((a, b) => a.ct - b.ct || a.uid - b.uid);
    const u = live[0], step = u.ct;
    live.forEach(x => { x.ct -= step; });
    this.turn++;
    const ev = [];
    let skip = false;
    // Well Rested: Austin's party FP trickle.
    if (u.side === 'p' && this.living('p').some(x => x.key === 'Austin' || x.key === 'Astro')) u.fp = Math.min(u.max.fp, u.fp + 2);
    if (this.has(u, 'regen')) {
      const amt = Math.round(u.max.hp * u.st.regen.v);
      this.healRaw(u, amt, ev, 'Regen');
    }
    if (this.has(u, 'ink')) {
      const amt = Math.max(1, Math.round(u.max.hp * (u.side === 'e' ? .05 : .06)));
      ev.push({ t: 'dot', target: u.uid, amount: Math.min(amt, u.hp - (u.side === 'p' ? 0 : 0)), kind: 'ink' });
      u.hp = Math.max(0, u.hp - amt);
      if (u.hp <= 0) this.kill(u, ev);
    }
    if (u.alive && this.toonTurnStart) this.toonTurnStart(u, ev);
    if (!u.alive) { this.endTurn(u, ev); return { actor: u, events: ev, skip: true }; }
    if (u.stagger && u.stagger.broken) {
      ev.push({ t: 'text', text: `${u.name} is still reeling from the Break!`, actor: u.uid, cls: 'break' });
      u.stagger.broken = 0; u.stagger.cur = 0; skip = true;
      ev.push({ t: 'recover', target: u.uid });
    } else if (this.has(u, 'stun')) {
      ev.push({ t: 'text', text: `${u.name} is Stunned and can’t move!`, actor: u.uid }); skip = true;
      delete u.st.stun;
    } else if (this.has(u, 'sleep')) {
      ev.push({ t: 'text', text: `${u.name} is fast asleep…`, actor: u.uid, cls: 'sleep' }); skip = true;
    }
    if (u.side === 'p') u.guard = false;
    if (skip) this.endTurn(u, ev);
    return { actor: u, events: ev, skip };
  }

  endTurn(u, ev, delayMult) {
    Object.keys(u.st).forEach(k => {
      if (k === 'stun') return;
      u.st[k].t--;
      if (u.st[k].t <= 0) { delete u.st[k]; ev.push({ t: 'expire', target: u.uid, k }); }
    });
    if (u.cds) Object.keys(u.cds).forEach(k => { if (u.cds[k] > 0) u.cds[k]--; });
    u.ct = this.delay(u, delayMult);
    this.checkEnd(ev);
  }

  checkEnd(ev) {
    if (this.over) return;
    if (!this.living('e').length) { this.over = true; this.win = true; ev.push({ t: 'end', win: true }); }
    else if (!this.living('p').length) { this.over = true; this.win = false; ev.push({ t: 'end', win: false }); }
  }

  /* ---------- status ---------- */
  apply(src, u, k, turns, extra, ev) {
    if (!u.alive) return false;
    if (u.boss && (k === 'sleep' || k === 'stun')) {
      // Bosses shrug off hard control: they are pushed back on the timeline instead.
      u.ct += this.delay(u) * .35; ev.push({ t: 'text', text: `${u.name} resists, but loses ground!`, actor: u.uid });
      ev.push({ t: 'status', target: u.uid, k: 'slow', resisted: true });
      return false;
    }
    const cur = u.st[k];
    u.st[k] = Object.assign({ t: Math.max(turns, cur ? cur.t : 0) }, extra || {});
    if (k === 'shield') u.st.shield.v = Math.max(cur && cur.v || 0, extra.v);
    if (k === 'taunt') u.st.taunt.by = src.uid;
    ev.push({ t: 'status', target: u.uid, k });
    return true;
  }
  cleanse(u, ev) {
    let any = false;
    ['ink', 'atkDown', 'defDown', 'slow', 'sleep', 'stun'].forEach(k => { if (u.st[k]) { delete u.st[k]; any = true; } });
    if (any) ev.push({ t: 'cleanse', target: u.uid });
  }

  /* ---------- damage ---------- */
  hit(src, tgt, power, kind, ev, o) {
    o = o || {};
    if (!tgt.alive) return 0;
    const phys = kind === 'phys';
    if (this.toonDodge && this.toonDodge(src, tgt, o, ev)) return 0;
    const A = this.stat(src, phys ? 'atk' : 'mag'), D = this.stat(tgt, phys ? 'def' : 'mdef');
    // Devan's Small Target dodge.
    if (tgt.side === 'p' && tgt.key === 'Devan' && !o.noDodge && this.rng() < .12) {
      ev.push({ t: 'miss', target: tgt.uid }); return 0;
    }
    let dmg = power * A * A / (A + D);
    dmg *= src.side === 'e' ? ST_DMG_ENEMY : ST_DMG_PARTY;
    dmg *= this.rng.range(.92, 1.08);
    let crit = false;
    if (this.rng() < .05 + src.s.luck * .004) { crit = true; dmg *= 1.5; }
    if (this.has(tgt, 'mark')) dmg *= 1.25;
    if (tgt.stagger && tgt.stagger.broken) dmg *= 1.5;
    if (tgt.guard) dmg *= .5;
    if (phys && tgt.side === 'p' && tgt.row === 'back') dmg *= .78;
    if (phys && src.side === 'p' && src.row === 'back') dmg *= .8;
    if (src.side === 'e' && tgt.key === 'Devan' && this.has(src, 'taunt')) dmg *= .85;
    // Veronica's Ratings Chase streak.
    if (src.key === 'Veronica') {
      if (src.streak.target === tgt.uid) src.streak.n = Math.min(4, src.streak.n + 1); else src.streak = { target: tgt.uid, n: 0 };
      dmg *= 1 + src.streak.n * .1;
    }
    // Shannon's Field Notes on first contact.
    let fieldNotes = false;
    if (src.key === 'Shannon' && !src.touched.has(tgt.uid)) { src.touched.add(tgt.uid); dmg *= 1.3; fieldNotes = true; }
    if (o.mult) dmg *= o.mult;
    if (this.toonMods) dmg = this.toonMods(src, tgt, dmg, kind, o, ev);
    dmg = Math.max(1, Math.round(dmg));
    // Shields soak first.
    let soaked = 0;
    if (this.has(tgt, 'shield')) {
      soaked = Math.min(tgt.st.shield.v, dmg);
      tgt.st.shield.v -= soaked; dmg -= soaked;
      if (tgt.st.shield.v <= 0) { delete tgt.st.shield; ev.push({ t: 'expire', target: tgt.uid, k: 'shield' }); }
    }
    tgt.hp = Math.max(0, tgt.hp - dmg);
    ev.push({ t: 'dmg', src: src.uid, target: tgt.uid, amount: dmg, soaked, crit, kind, fieldNotes, streak: src.key === 'Veronica' ? src.streak.n : 0 });
    if (this.has(tgt, 'sleep') && dmg > 0) { delete tgt.st.sleep; ev.push({ t: 'text', text: `${tgt.name} wakes up!`, actor: tgt.uid }); }
    // Bond fills from both giving and taking.
    if (src.side === 'p') src.bond = Math.min(100, src.bond + 4 + (crit ? 3 : 0));
    if (tgt.side === 'p') tgt.bond = Math.min(100, tgt.bond + Math.round(dmg / tgt.max.hp * 70));
    // Stagger.
    if (tgt.stagger && !tgt.stagger.broken) {
      let sg = (o.stagger != null ? o.stagger : 1) * (crit ? 1.5 : 1) * (fieldNotes ? 2 : 1);
      if (o.staggerFlat) sg += o.staggerFlat;
      tgt.stagger.cur = Math.min(tgt.stagger.max, tgt.stagger.cur + sg);
      ev.push({ t: 'stagger', target: tgt.uid, cur: tgt.stagger.cur, max: tgt.stagger.max });
      if (tgt.stagger.cur >= tgt.stagger.max) this.breakFoe(tgt, ev);
    }
    if (this.toonAfterHit) this.toonAfterHit(src, tgt, dmg, kind, o, ev);
    if (tgt.hp <= 0) this.kill(tgt, ev);
    else {
      if (tgt.side === 'e') this.checkPhases(tgt, ev);
      if (tgt.side === 'p') this.overprotect(tgt, ev);
      if (tgt.side === 'p' && this.has(tgt, 'counter') && src.alive && src.side === 'e' && !o.isCounter) {
        ev.push({ t: 'text', text: `${tgt.name} counters!`, actor: tgt.uid });
        this.hit(tgt, src, .8, 'phys', ev, { isCounter: true, stagger: 1.2 });
      }
    }
    return dmg;
  }

  breakFoe(u, ev) {
    u.stagger.broken = 1;
    // A Break throws the unit to the back of the line and cancels any charge.
    u.ct += this.delay(u) * .5;
    const cancelled = !!u.tele;
    u.tele = null;
    ev.push({ t: 'break', target: u.uid, cancelled });
  }

  checkPhases(u, ev) {
    (u.def.phases || []).forEach((p, i) => {
      if (u.phaseDone[i] || u.hp / u.max.hp > p.at) return;
      u.phaseDone[i] = true;
      ev.push({ t: 'phase', target: u.uid, text: p.text });
      if (p.buff) this.apply(u, u, p.buff, 99, p.buff === 'shield' ? { v: u.max.hp * .1 } : null, ev);
      if (p.heal) this.healRaw(u, Math.round(u.max.hp * p.heal), ev, 'Mend');
      (p.summon || []).forEach(k => this.summon(u, k, ev));
    });
  }

  summon(src, key, ev) {
    if (this.living('e').length >= ST_MAX_FOES) return null;
<<<<<<< HEAD
    const f = this.addFoe(key, Math.max(1, src.lv - 1), { mult: src.mult });
=======
    const f = this.addFoe(key, Math.max(1, src.lv - 1), {});
>>>>>>> ccb31b9f96fec6e5b5e1509b31b66f6b3cb024e0
    f.ct = this.delay(f) * this.rng.range(.4, .9);
    ev.push({ t: 'summon', target: f.uid, by: src.uid });
    return f;
  }

  kill(u, ev) {
    if (!u.alive) return;
    u.alive = false; u.hp = 0; u.st = {}; u.tele = null;
    if (u.stagger) u.stagger.broken = 0;
    ev.push({ t: 'ko', target: u.uid });
<<<<<<< HEAD
    if (u.side === 'e' && u.def && u.def.split && !u.noSplit) for (let k = 0; k < 2; k++) { const f = this.summon(u, u.def.split, ev); if (f) f.noSplit = true; }
=======
>>>>>>> ccb31b9f96fec6e5b5e1509b31b66f6b3cb024e0
  }

  healRaw(u, amt, ev, tag) {
    if (!u.alive) return 0;
    const before = u.hp;
    u.hp = Math.min(u.max.hp, u.hp + Math.round(amt));
    ev.push({ t: 'heal', target: u.uid, amount: u.hp - before, tag });
    return u.hp - before;
  }

  revive(u, pct, ev) {
    if (u.alive) return;
    u.alive = true; u.hp = Math.max(1, Math.round(u.max.hp * pct)); u.saved = false;
    u.ct = this.delay(u) * .6;
    ev.push({ t: 'revive', target: u.uid, amount: u.hp });
  }

  overprotect(u, ev) {
    if (u.saved || u.hp / u.max.hp >= .3) return;
    const sam = this.living('p').find(x => (x.key === 'Sam' || x.key === 'Sprout') && x !== u);
    if (!sam) return;
    u.saved = true;
    ev.push({ t: 'text', text: `Overprotective! ${sam.name} tosses a treat!`, actor: sam.uid, cls: 'heal' });
    this.healRaw(u, u.max.hp * .15, ev, 'Treat');
  }

  /* ---------- player actions ----------
     action: { type: 'attack'|'skill'|'guard'|'item'|'bond', id, target(uid) } */
  canUse(u, sk) { return u.fp >= sk.fp; }

  act(u, action) {
    const ev = [];
    const T = action.target != null ? this.units.find(x => x.uid === action.target) : null;
    const foes = this.living('e');
    let delayMult = 1;
    if (action.type === 'attack') {
      ev.push({ t: 'act', actor: u.uid, name: this.improvised ? stChar(u.key).improvised : stChar(u.key).basicName, kind: 'attack' });
      const tgt = T && T.alive ? T : foes[0];
      const kind = this.improvised && u.key === 'Veronica' ? 'mag' : stChar(u.key).basicKind;
      this.hit(u, tgt, this.improvised ? .9 : 1, kind, ev, { stagger: 1, basic: true });
      u.fp = Math.min(u.max.fp, u.fp + 3);
      if (this.toonBasic) this.toonBasic(u, tgt, ev);
    } else if (action.type === 'guard') {
      ev.push({ t: 'act', actor: u.uid, name: 'Guard', kind: 'guard' });
      u.guard = true; u.fp = Math.min(u.max.fp, u.fp + 5); u.bond = Math.min(100, u.bond + 8);
      ev.push({ t: 'status', target: u.uid, k: 'guard' });
      delayMult = .8;
    } else if (action.type === 'item') {
      const it = ST_ITEMS[action.id];
      if (!it || !(this.items[action.id] > 0)) return ev;
      this.items[action.id]--;
      ev.push({ t: 'act', actor: u.uid, name: it.name, kind: 'item', icon: it.icon });
      const tgt = T || u;
      if (action.id === 'bandage') this.healRaw(tgt, tgt.max.hp * .4, ev, 'Bandage');
      else if (action.id === 'medkit') this.living('p').forEach(x => this.healRaw(x, x.max.hp * .35, ev, 'Med Kit'));
      else if (action.id === 'pop') { tgt.fp = Math.min(tgt.max.fp, tgt.fp + 18); ev.push({ t: 'fp', target: tgt.uid, amount: 18 }); }
      else if (action.id === 'speed') this.apply(u, tgt, 'haste', 3, null, ev);
      else if (action.id === 'jumper') this.revive(tgt, .45, ev);
      else if (action.id === 'jawbreaker') this.apply(u, tgt, 'shield', 3, { v: Math.round(tgt.max.hp * .3) }, ev);
      else if (action.id === 'tonic') { this.living('p').forEach(x => { this.cleanse(x, ev); this.healRaw(x, x.max.hp * .2, ev, 'Tonic'); }); }
      else if (action.id === 'stealth') this.apply(u, tgt, 'veil', 2, null, ev);
<<<<<<< HEAD
      else if (action.id === 'barrier') this.living('p').forEach(x => { this.apply(u, x, 'barrier', 3, null, ev); this.apply(u, x, 'ward', 3, { v: .25 }, ev); });
      delayMult = .85;
    } else if (action.type === 'skill') {
      const sk = u.skills.find(s => s.id === action.id);
      if (!sk || u.fp < sk.fp || this.has(u, 'silence') || (sk.once && u.used && u.used[sk.id])) return ev;
      u.fp -= sk.fp;
      if (sk.once) (u.used = u.used || {})[sk.id] = true;
=======
      delayMult = .85;
    } else if (action.type === 'skill') {
      const sk = u.skills.find(s => s.id === action.id);
      if (!sk || u.fp < sk.fp) return ev;
      u.fp -= sk.fp;
>>>>>>> ccb31b9f96fec6e5b5e1509b31b66f6b3cb024e0
      ev.push({ t: 'act', actor: u.uid, name: sk.name, kind: 'skill', skill: sk.id });
      this.skill(u, sk, T, ev);
      u.bond = Math.min(100, u.bond + 6);
    } else if (action.type === 'bond') {
      if (u.bond < 100) return ev;
      u.bond = 0;
      const b = stChar(u.key).bond;
      ev.push({ t: 'act', actor: u.uid, name: b.name, kind: 'bond' });
      ev.push({ t: 'cutin', actor: u.uid, toon: stChar(u.key).toon, line: b.toonLine, name: b.name });
      this.bondArt(u, ev);
      delayMult = .7;
    }
    this.endTurn(u, ev, delayMult);
    return ev;
  }

  skill(u, sk, T, ev) {
    const foes = this.living('e'), allies = this.living('p');
    const tgt = T && T.alive ? T : (sk.target === 'enemy' ? foes[0] : u);
    if (sk.fx && this.fxSkill) { this.fxSkill(u, sk, T, ev); return; }
    switch (sk.id) {
      case 'tackle': this.hit(u, tgt, sk.power, 'phys', ev, { stagger: sk.stagger }); break;
      case 'speak':
        foes.forEach(f => this.apply(u, f, 'taunt', 2, null, ev));
        this.apply(u, u, 'defUp', 3, null, ev); break;
      case 'fetch': this.apply(u, tgt, 'shield', 3, { v: Math.round(u.max.hp * .26) }, ev); break;
      case 'goodboy':
        allies.forEach(a => this.apply(u, a, 'defUp', 3, null, ev));
        this.apply(u, u, 'regen', 3, { v: .08 }, ev); break;
      case 'spotlight':
        this.hit(u, tgt, sk.power, 'mag', ev, { stagger: sk.stagger });
        if (tgt.alive) this.apply(u, tgt, 'mark', 3, null, ev); break;
      case 'surge': foes.forEach(f => this.hit(u, f, sk.power, 'mag', ev, { stagger: sk.stagger })); break;
      case 'break':
        this.hit(u, tgt, sk.power, 'mag', ev, { stagger: sk.stagger });
        if (tgt.alive) {
          if (tgt.boss) { tgt.ct += this.delay(tgt) * .4; ev.push({ t: 'text', text: `${tgt.name} is cut to commercial!`, actor: tgt.uid }); ev.push({ t: 'status', target: tgt.uid, k: 'slow', resisted: true }); }
          else if (this.rng() < .65) this.apply(u, tgt, 'stun', 1, null, ev);
        }
        break;
      case 'live': {
        const marked = this.has(tgt, 'mark');
        this.hit(u, tgt, sk.power, 'mag', ev, { mult: marked ? 1.5 : 1, stagger: sk.stagger * (marked ? 2 : 1) });
        break;
      }
      case 'sweets': this.healRaw(tgt, tgt.max.hp * .3 + this.stat(u, 'mag') * 1.6, ev, 'Baked Sweets'); break;
      case 'stayclose':
        this.apply(u, tgt, 'regen', 3, { v: .09 }, ev);
        this.apply(u, tgt, 'defUp', 3, null, ev); break;
      case 'oven':
        allies.forEach(a => { this.healRaw(a, a.max.hp * .22 + this.stat(u, 'mag') * .6, ev, 'Oven'); if (a.st.ink) { delete a.st.ink; ev.push({ t: 'cleanse', target: a.uid }); } }); break;
      case 'batch': if (T && !T.alive) this.revive(T, .4, ev); break;
      case 'stratum':
        this.hit(u, tgt, sk.power, 'phys', ev, { stagger: sk.stagger });
        if (tgt.alive) this.apply(u, tgt, 'defDown', 3, null, ev); break;
      case 'inspire':
        this.apply(u, tgt, 'atkUp', 3, null, ev); this.apply(u, tgt, 'haste', 2, null, ev);
        if (tgt !== u) { tgt.ct *= .5; ev.push({ t: 'text', text: `${tgt.name} is inspired and moves up!`, actor: tgt.uid }); }
        break;
      case 'fossil':
        this.hit(u, tgt, sk.power, 'phys', ev, { stagger: 0, staggerFlat: tgt.stagger ? tgt.stagger.max * .5 : 0 }); break;
      case 'solver':
        allies.forEach(a => { this.cleanse(a, ev); if (a !== u) { a.fp = Math.min(a.max.fp, a.fp + 7); ev.push({ t: 'fp', target: a.uid, amount: 7 }); } }); break;
      case 'pulse': {
        this.hit(u, tgt, sk.power, 'mag', ev, { stagger: sk.stagger });
        const low = allies.slice().sort((a, b) => a.fp / a.max.fp - b.fp / b.max.fp)[0];
        if (low) { low.fp = Math.min(low.max.fp, low.fp + 5); ev.push({ t: 'fp', target: low.uid, amount: 5 }); }
        break;
      }
      case 'slumber':
        if (tgt.boss) { this.apply(u, tgt, 'slow', 2, null, ev); }
        else if (this.rng() < .85) this.apply(u, tgt, 'sleep', 2, null, ev);
        else ev.push({ t: 'miss', target: tgt.uid });
        break;
      case 'stars':
        for (let i = 0; i < sk.hits; i++) { const live = this.living('e'); if (!live.length) break; this.hit(u, this.rng.pick(live), sk.power, 'mag', ev, { stagger: sk.stagger }); }
        break;
    }
  }

  bondArt(u, ev) {
    const foes = this.living('e'), allies = this.living('p');
    const bd = stChar(u.key).bond;
    if (bd.fx && this.fxSkill) { this.fxSkill(u, bd, null, ev, true); return; }
    switch (u.key) {
      case 'Devan':
        allies.forEach(a => this.apply(u, a, 'shield', 3, { v: Math.round(u.max.hp * .22) }, ev));
        foes.forEach(f => this.apply(u, f, 'taunt', 3, null, ev));
        this.apply(u, u, 'counter', 3, null, ev); break;
      case 'Veronica':
        foes.forEach(f => { this.hit(u, f, 1.5, 'mag', ev, { stagger: 2 }); if (f.alive) this.apply(u, f, 'mark', 3, null, ev); }); break;
      case 'Sam':
        this.party().forEach(a => { if (!a.alive) this.revive(a, .3, ev); else { this.healRaw(a, a.max.hp * .55, ev, 'Bake Sale'); this.cleanse(a, ev); } }); break;
      case 'Shannon':
        foes.forEach(f => this.hit(u, f, 1.35, 'mag', ev, { stagger: 2.2 }));
        this.living('p').forEach(a => this.apply(u, a, 'atkUp', 3, null, ev)); break;
      case 'Austin':
        foes.forEach(f => f.boss ? this.apply(u, f, 'slow', 2, null, ev) : this.apply(u, f, 'sleep', 1, null, ev));
        allies.forEach(a => { this.healRaw(a, a.max.hp * .25, ev, 'Endless Night'); a.fp = Math.min(a.max.fp, a.fp + 10); }); break;
    }
  }

  /* ---------- enemy AI ---------- */
  pickTarget(u, move) {
    let live = this.living('p').filter(p => !this.has(p, 'veil'));
    if (!live.length) live = this.living('p');
    if (!live.length) return null;
    if (this.has(u, 'taunt')) { const t = this.units.find(x => x.uid === u.st.taunt.by && x.alive); if (t) return t; }
    const weights = live.map(p => (p.row === 'back' ? .55 : 1) * (p.key === 'Devan' ? 1.25 : 1) * (p.hp / p.max.hp < .35 ? 1.25 : 1) * (p.key === 'Connie' ? .5 : 1) * (p.key === 'Brightney' ? 1.3 : 1) * (p.key === 'Coal' ? 1.2 : 1));
    let r = this.rng() * weights.reduce((a, b) => a + b, 0);
    for (let i = 0; i < live.length; i++) { r -= weights[i]; if (r <= 0) return live[i]; }
    return live[live.length - 1];
  }

  enemyAct(u) {
    const ev = [];
    let move = null;
    if (u.tele) { move = u.tele; u.tele = null; }
    else {
      const opts = u.def.moves.filter(m => !(u.cds[m.name] > 0) && !(m.when === 'hurt' && u.hp / u.max.hp > .6) && !(m.kind === 'summon' && this.living('e').length >= ST_MAX_FOES) && !(m.kind === 'allyheal' && !this.living('e').some(x => x.hp / x.max.hp < .7)));
      let tot = opts.reduce((a, m) => a + m.w, 0), r = this.rng() * tot;
      move = opts.find(m => (r -= m.w) <= 0) || opts[0] || u.def.moves[0];
      if (move.cd) u.cds[move.name] = move.cd;
      if (move.tele && this.toonInterrupt && this.toonInterrupt(u, move, ev)) { this.endTurn(u, ev, .9); return ev; }
      if (move.tele) {
        u.tele = move;
<<<<<<< HEAD
        ev.push({ t: 'charge', actor: u.uid, name: move.name, text: move.tele, lethal: !!move.lethal });
=======
        ev.push({ t: 'charge', actor: u.uid, name: move.name, text: move.tele });
>>>>>>> ccb31b9f96fec6e5b5e1509b31b66f6b3cb024e0
        this.endTurn(u, ev, .75);
        return ev;
      }
    }
    ev.push({ t: 'act', actor: u.uid, name: move.name, kind: 'enemy', big: !!move.tele });
    const hits = move.hits || 1;
    const doHit = tgt => {
      if (!tgt || !tgt.alive) return;
<<<<<<< HEAD
      if (move.lethal && this.lethalStrike && this.lethalStrike(u, tgt, move, ev)) return;
=======
>>>>>>> ccb31b9f96fec6e5b5e1509b31b66f6b3cb024e0
      const dmg = this.hit(u, tgt, move.power, move.kind === 'gamble' ? 'phys' : move.kind, ev, { stagger: 0, aoe: move.target === 'all' });
      if (!tgt.alive) return;
      if (move.ink && this.rng() < move.ink) this.apply(u, tgt, 'ink', 3, null, ev);
      if (move.sleep && this.rng() < move.sleep) this.apply(u, tgt, 'sleep', 2, null, ev);
      if (move.stun && this.rng() < move.stun) this.apply(u, tgt, 'stun', 1, null, ev);
      if (move.slow && this.rng() < move.slow) this.apply(u, tgt, 'slow', 2, null, ev);
      if (move.debuff) this.apply(u, tgt, move.debuff, 3, null, ev);
<<<<<<< HEAD
      if (move.silence && this.rng() < move.silence) this.apply(u, tgt, 'silence', 1, null, ev);
      if (move.fpdrain && tgt.alive) { const n = Math.min(tgt.fp, move.fpdrain); if (n > 0) { tgt.fp -= n; ev.push({ t: 'fp', target: tgt.uid, amount: -n }); } }
=======
>>>>>>> ccb31b9f96fec6e5b5e1509b31b66f6b3cb024e0
      if (move.drain && dmg) this.healRaw(u, dmg * move.drain, ev, 'Drain');
    };
    switch (move.kind) {
      case 'phys': case 'mag':
        if (move.target === 'all') this.living('p').forEach(doHit);
        else for (let i = 0; i < hits; i++) doHit(move.target === 'random' ? this.rng.pick(this.living('p')) : (i === 0 || !this._last || !this._last.alive ? (this._last = this.pickTarget(u, move)) : this._last));
        break;
      case 'gamble':
        if (this.rng() < .5) { ev.push({ t: 'text', text: 'The dice land on snake eyes. For you.', actor: u.uid }); doHit(this.pickTarget(u, move)); }
        else { ev.push({ t: 'text', text: 'The dice come up lucky… for the Twisteds.', actor: u.uid }); this.living('e').forEach(f => this.healRaw(f, f.max.hp * .12, ev, 'Luck')); }
        break;
      case 'heal': this.healRaw(u, u.max.hp * move.power, ev, move.name); break;
      case 'allyheal': {
        const t = this.living('e').sort((a, b) => a.hp / a.max.hp - b.hp / b.max.hp)[0];
        this.healRaw(t, t.max.hp * move.power, ev, move.name); break;
      }
      case 'selfbuff': this.apply(u, u, move.buff, 3, move.buff === 'shield' ? { v: Math.round(u.max.hp * .12) } : null, ev); break;
      case 'allybuff': { const t = this.rng.pick(this.living('e')); this.apply(u, t, move.buff, 3, null, ev); break; }
      case 'summon': this.summon(u, move.summon, ev); break;
    }
    if (move.selfKo && u.alive) this.kill(u, ev);
    this._last = null;
    this.endTurn(u, ev);
    return ev;
  }

  /* ---------- autoplay (balance tests and the Auto button) ---------- */
  autoAction(u) {
    const foes = this.living('e'), allies = this.living('p'), ko = this.party().filter(x => !x.alive);
<<<<<<< HEAD
    const has = id => !this.has(u, 'silence') && u.skills.find(s => s.id === id && u.fp >= s.fp && !(s.once && u.used && u.used[s.id]));
    const lowest = allies.slice().sort((a, b) => a.hp / a.max.hp - b.hp / b.max.hp)[0];
    const charging = foes.find(f => f.tele);
    const target = charging || foes.slice().sort((a, b) => (b.boss ? 1 : 0) - (a.boss ? 1 : 0) || a.hp - b.hp)[0];
    if (charging && charging.tele.lethal && !this.living('p').some(x => this.isTank && this.isTank(x)) && this.items.barrier > 0 && !allies.some(a => this.has(a, 'barrier'))) return { type: 'item', id: 'barrier' };
=======
    const has = id => u.skills.find(s => s.id === id && u.fp >= s.fp);
    const lowest = allies.slice().sort((a, b) => a.hp / a.max.hp - b.hp / b.max.hp)[0];
    const charging = foes.find(f => f.tele);
    const target = charging || foes.slice().sort((a, b) => (b.boss ? 1 : 0) - (a.boss ? 1 : 0) || a.hp - b.hp)[0];
>>>>>>> ccb31b9f96fec6e5b5e1509b31b66f6b3cb024e0
    if (u.bond >= 100) return { type: 'bond' };
    if (ko.length && has('batch')) return { type: 'skill', id: 'batch', target: ko[0].uid };
    if (ko.length && this.items.jumper > 0) return { type: 'item', id: 'jumper', target: ko[0].uid };
    if (u.key === 'Sam') {
      const hurt = allies.filter(a => a.hp / a.max.hp < .55).length;
      if (hurt >= 2 && has('oven')) return { type: 'skill', id: 'oven' };
      if (lowest.hp / lowest.max.hp < .5 && has('sweets')) return { type: 'skill', id: 'sweets', target: lowest.uid };
      if (lowest.hp / lowest.max.hp < .8 && has('stayclose') && !this.has(lowest, 'regen')) return { type: 'skill', id: 'stayclose', target: lowest.uid };
    }
    if (lowest.hp / lowest.max.hp < .3 && this.items.bandage > 0) return { type: 'item', id: 'bandage', target: lowest.uid };
    if (this.toonAuto && stChar(u.key).kind === 'toon') { const a = this.toonAuto(u, { foes, allies, ko, lowest, charging, target, has }); if (a) return a; }
    if (u.key === 'Devan') {
      if (charging && has('tackle')) return { type: 'skill', id: 'tackle', target: charging.uid };
      if (!foes.some(f => this.has(f, 'taunt')) && has('speak')) return { type: 'skill', id: 'speak' };
      if (has('goodboy') && !this.has(u, 'defUp')) return { type: 'skill', id: 'goodboy' };
      if (has('tackle')) return { type: 'skill', id: 'tackle', target: target.uid };
    }
    if (u.key === 'Veronica') {
      if (foes.length >= 3 && has('surge')) return { type: 'skill', id: 'surge' };
      if (this.has(target, 'mark') && has('live')) return { type: 'skill', id: 'live', target: target.uid };
      if (!this.has(target, 'mark') && has('spotlight')) return { type: 'skill', id: 'spotlight', target: target.uid };
      if (has('break') && charging) return { type: 'skill', id: 'break', target: charging.uid };
    }
    if (u.key === 'Shannon') {
      if (has('fossil') && charging) return { type: 'skill', id: 'fossil', target: charging.uid };
      const dps = allies.find(a => a.key === 'Veronica' && !this.has(a, 'atkUp'));
      if (dps && has('inspire')) return { type: 'skill', id: 'inspire', target: dps.uid };
      if (!this.has(target, 'defDown') && has('stratum')) return { type: 'skill', id: 'stratum', target: target.uid };
    }
    if (u.key === 'Austin') {
      if (foes.length >= 3 && has('stars')) return { type: 'skill', id: 'stars' };
      const sleeper = foes.find(f => !f.boss && !this.has(f, 'sleep') && f !== target);
      if (sleeper && has('slumber') && foes.length >= 2) return { type: 'skill', id: 'slumber', target: sleeper.uid };
      if (has('pulse')) return { type: 'skill', id: 'pulse', target: target.uid };
    }
    return { type: 'attack', target: target.uid };
  }
}

/* Headless resolution for balance checks: returns { win, turns, hpLeft }. */
function stSimulate(opt) {
  const B = new StoryBattle(opt);
  let guard = 0;
  while (!B.over && guard++ < 800) {
    const n = B.next();
    if (n.skip || B.over) continue;
    if (n.actor.side === 'p') B.act(n.actor, B.autoAction(n.actor));
    else B.enemyAct(n.actor);
  }
  const p = B.party();
  return { win: B.win, turns: B.turn, hpLeft: p.reduce((a, u) => a + u.hp, 0) / p.reduce((a, u) => a + u.max.hp, 0), alive: p.filter(u => u.alive).length };
}

if (typeof module !== 'undefined') module.exports = { StoryBattle, stSimulate, ST_HANDLERS, ST_TOONS, ST_ENEMIES, ST_ITEMS, stExpNeed, stHandlerStats, stChar };
