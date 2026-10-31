/* story-nodes.js - Main Story · Chapter 1 "The Malfunction" path.
   Fifteen scenes and twelve battles across June 24, 2002. The party is only
   ever the five Toon Handlers; who is available follows the story (join /
   leave), so a Handler can be gained and lost. Hard mode is the same fight a
   few levels higher with fewer supplies; certain Hard clears unlock the
   matching Handler as a skin for their Toon. */
'use strict';

const ST_BG = {
  lobby: 'uploads/backgroundlobby1.webp', sign: 'uploads/backgroundlobby2.png', launcher: 'uploads/launcher-room.webp',
  diner: 'assets/backgrounds/maps/diner.png', rainbow: 'assets/backgrounds/maps/rainbow-rooms.png', art: 'assets/backgrounds/maps/art-floor.png',
  gift: 'assets/backgrounds/maps/gift-floor.png', aquatic: 'assets/backgrounds/maps/aquatic-floor.png', astro: 'assets/backgrounds/maps/astro-floor.png',
  library: 'assets/backgrounds/maps/library-floor.png', artist: 'assets/backgrounds/maps/artist.png', greenhouse: 'assets/backgrounds/maps/greenhouse.png',
  warehouse: 'assets/backgrounds/maps/warehouse.png', vee: 'assets/backgrounds/maps/vee-floor.png', veeShow: 'assets/backgrounds/maps/vee-showroom.webp',
  veeStorage: 'assets/backgrounds/maps/vee-storage.webp', shelly: 'assets/backgrounds/maps/shelly-floor.png', easter: 'assets/backgrounds/maps/easter-floor.png',
  halloween: 'assets/backgrounds/maps/halloween-floor.png', black: ''
};

/* Story-only scores plus the game's own non-collab tracks. */
const ST_MUSIC = {
  neutral: 'stNeutral', interesting: 'stInteresting', emotional: 'stEmotional', battle: 'stBattle',
  clair: 'stClair', shop: 'stShop', delilah: 'stDelilah', journal: 'stJournal', glossary: 'stGlossary', bossa: 'stBossa',
  twisted: 'stTwisted', normal: 'stNormal', normal2: 'stNormal2', unknown: 'stUnknown', boss: 'stBoss', colossus: 'stColossus', qom: 'stQom'
};

const ST_NODES = [
  { type: 'story', scene: 's1' },
  { type: 'story', scene: 's2', join: ['Devan', 'Veronica'] },
  { type: 'battle', id: 'b1', tune: { easy: { atk: 1.1 }, hard: { hp: .66, atk: .72 } }, name: 'Spill in Hall C', bg: 'rainbow', lv: 1, music: 'battle', improvised: true,
    hint: 'No badges yet. Devan has a mop and Veronica has a fire extinguisher. Guard when you are hurt.',
    easy: [[['inkBottle', 2]], [['inkBall', 1], ['inkBottle', 1]]],
    hard: [[['inkBottle', 2], ['inkBall', 1]], [['inkSponge', 1], ['inkBall', 2]]] },
  { type: 'story', scene: 's3', join: ['Sam'] },
  { type: 'battle', id: 'b2', tune: { easy: { atk: 1.2 }, hard: { atk: 1.32 } }, name: 'Service Corridor', bg: 'diner', lv: 3, music: 'normal',
    hint: 'The badges are awake. Spend FP on skills, and Break enemies by filling their Stagger gauge.',
    easy: [[['inkBottle', 2], ['inkSponge', 1]], [['inkBrick', 1], ['inkBall', 2]]],
    hard: [[['inkBottle', 2], ['inkSponge', 1], ['inkBall', 1]], [['inkBrick', 2], ['inkBall', 2]]] },
  { type: 'story', scene: 's4' },
  { type: 'battle', id: 'b3', tune: { easy: { atk: 1.3 }, hard: { atk: 1.2 } }, name: 'The Main Stage', bg: 'sign', lv: 5, music: 'twisted', boss: 'twBoxten', skin: 'Sprout',
    hint: 'When a Twisted starts charging, Break it before it acts to cancel the attack, or Guard.',
    easy: [[['inkBall', 2], ['inkBottle', 1]], [['twBoxten', 1, { boss: true }]]],
    hard: [[['inkBall', 2], ['inkBrick', 1]], [['twBoxten', 1, { boss: true }], ['inkBottle', 1]]] },
  { type: 'story', scene: 's5', join: ['Shannon'] },
  { type: 'battle', id: 'b4', tune: { easy: { atk: 1.35 }, hard: { atk: 1.25 } }, name: 'The Gift Floor', bg: 'gift', lv: 7, music: 'normal2',
    easy: [[['inkBall', 2], ['inkBomb', 1]], [['twToodles', 1], ['twGigi', 1]]],
    hard: [[['inkBall', 2], ['inkBomb', 2]], [['twToodles', 1], ['twGigi', 1], ['inkSponge', 1]]] },
  { type: 'story', scene: 's6' },
  { type: 'battle', id: 'b5', tune: { easy: { atk: 1.35, hp: 1.05 }, hard: { atk: 1.32, hp: 1.1 } }, name: 'Aquarium Walk', bg: 'aquatic', lv: 9, music: 'battle', skin: 'Shelly',
    easy: [[['inkSponge', 2], ['inkHand', 1]], [['twFinn', 1], ['twCosmo', 1]]],
    hard: [[['inkSponge', 2], ['inkHand', 2]], [['twFinn', 1], ['twCosmo', 1], ['inkBrick', 1]]] },
  { type: 'story', scene: 's7', join: ['Austin'] },
  { type: 'battle', id: 'b6', tune: { easy: { atk: 1.38 }, hard: { atk: 1 } }, name: 'The Planetarium', bg: 'astro', lv: 11, music: 'unknown',
    easy: [[['inkHand', 2], ['inkBall', 1]], [['twBrightney', 1], ['twShrimpo', 1]]],
    hard: [[['inkHand', 2], ['inkBomb', 1], ['inkBall', 1]], [['twBrightney', 1], ['twShrimpo', 1], ['inkHand', 1]]] },
  { type: 'story', scene: 's8' },
  { type: 'battle', id: 'b7', tune: { easy: { atk: 1.38 }, hard: { atk: 1.02 } }, name: 'Research Wing', bg: 'artist', lv: 13, music: 'boss', boss: 'twRnD', skin: 'Vee',
    easy: [[['inkBottle', 2], ['inkBrick', 1]], [['twRnD', 1, { boss: true }]]],
    hard: [[['inkBottle', 2], ['inkBrick', 1], ['inkBomb', 1]], [['twRnD', 1, { boss: true }], ['inkSponge', 1]]] },
  { type: 'story', scene: 's9', leave: ['Veronica'] },
  { type: 'battle', id: 'b8', tune: { easy: { atk: 1.32 }, hard: { atk: 1 } }, name: 'The Ichor Surge', bg: 'warehouse', lv: 15, music: 'twisted', boss: 'twPoppy',
    hint: 'Veronica is gone. Lean on Shanon’s Stagger and Devan’s Taunt.',
    easy: [[['inkHand', 2], ['inkSponge', 1]], [['twPoppy', 1, { boss: true }], ['inkBall', 1]]],
    hard: [[['inkHand', 2], ['inkSponge', 1], ['inkBomb', 1]], [['twPoppy', 1, { boss: true }], ['inkBall', 2]]] },
  { type: 'story', scene: 's10' },
  { type: 'battle', id: 'b9', tune: { easy: { atk: 1.3 }, hard: { atk: .98 } }, name: 'Lullaby', bg: 'astro', lv: 17, music: 'emotional', boss: 'twAstro', skin: 'Astro', require: ['Austin'],
    hint: 'Austin will not sit this one out. Break Twisted Astro before Endless Night lands.',
    easy: [[['twAstro', 1, { boss: true }]]],
    hard: [[['twAstro', 1, { boss: true }], ['inkHand', 1]]] },
  { type: 'story', scene: 's11' },
  { type: 'battle', id: 'b10', tune: { easy: { atk: 1.18 }, hard: { atk: .92 } }, name: 'Staff Corridor', bg: 'library', lv: 19, music: 'normal',
    easy: [[['inkHand', 2], ['inkBrick', 1]], [['twRodger', 1], ['twTeagan', 1], ['twTisha', 1]]],
    hard: [[['inkHand', 2], ['inkBrick', 2]], [['twRodger', 1], ['twTeagan', 1], ['twTisha', 1], ['inkBomb', 1]]] },
  { type: 'story', scene: 's12', join: ['Veronica'] },
  { type: 'battle', id: 'b11', tune: { easy: { atk: 1.15 }, hard: { atk: .82, hp: .92 } }, name: 'Core Approach', bg: 'veeStorage', lv: 21, music: 'unknown', boss: 'twScraps',
    easy: [[['inkHand', 2], ['inkBomb', 1], ['inkBrick', 1]], [['twScraps', 1, { boss: true }], ['twGoob', 1]]],
    hard: [[['inkHand', 2], ['inkBomb', 2], ['inkBrick', 1]], [['twScraps', 1, { boss: true }], ['twGoob', 1], ['inkHand', 1]]] },
  { type: 'story', scene: 's13' },
  { type: 'battle', id: 'b12', tune: { easy: { atk: .92, hp: .92 }, hard: { atk: .78, hp: .85 } }, name: 'The Gardener', bg: 'greenhouse', lv: 24, music: 'colossus', boss: 'dandy', skin: 'Pebble', final: true,
    hint: 'Two phases. Save your Bond Arts for the bloom.',
    easy: [[['dandy', 1, { boss: true }]], [['dandyBloom', 1, { boss: true }]]],
    hard: [[['dandy', 1, { boss: true }], ['inkHand', 1]], [['dandyBloom', 1, { boss: true }], ['inkHand', 1]]] },
  { type: 'story', scene: 's14', leave: ['Devan'] },
  { type: 'story', scene: 's15' }
];

const ST_ITEMS_FOR = {
  easy: { bandage: 3, medkit: 1, pop: 2, speed: 1, jumper: 1 },
  hard: { bandage: 2, medkit: 0, pop: 1, speed: 1, jumper: 1 }
};
const ST_HARD = { lv: 4, mult: { hp: 1.25, atk: 1.15, def: 1.06 } };

/* Handler skins: the Toon wears its Handler's look. Earned from Hard clears. */
const ST_SKINS = {
  Sprout: { handler: 'Sam', node: 'b3', id: 'handler-sam', name: 'Toon Handler · Sam', art: 'uploads/Sambattle.webp' },
  Shelly: { handler: 'Shannon', node: 'b5', id: 'handler-shannon', name: 'Toon Handler · Shanon', art: 'uploads/Shanonbattle.webp' },
  Vee: { handler: 'Veronica', node: 'b7', id: 'handler-veronica', name: 'Toon Handler · Veronica', art: 'uploads/veronicabattle.webp' },
  Astro: { handler: 'Austin', node: 'b9', id: 'handler-austin', name: 'Toon Handler · Austin', art: 'uploads/austinbattle.webp' },
  Pebble: { handler: 'Devan', node: 'b12', id: 'handler-devan', name: 'Toon Handler · Devan', art: 'uploads/Devanbattle.webp' }
};

if (typeof module !== 'undefined') module.exports = { ST_NODES, ST_ITEMS_FOR, ST_HARD, ST_SKINS };
