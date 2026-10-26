/* ch2-nodes.js - Main Story · Chapter 2 "Business as Usual" path, Dandy's Shop
   and the lore Tapes. Twelve battles and eighteen scenes across July 6-8, 2002,
   after a lost week. The party is only ever the Toons; the Handlers are gone.
   Enemies start at level 26, two levels above the Chapter 1 finale. */
'use strict';

Object.assign(ST_BG, {
  christmas: 'Stagebackgrounds/maps/christmas-floor.png', platform: 'Stagebackgrounds/maps/warehouse.png'
});
Object.assign(ST_MUSIC, { colossus2: 'stColossus' });

const ST2_NODES = [
  { type: 'story', scene: 'c2s1' },
  { type: 'story', scene: 'c2s2', join: ['Tisha'] },
  { type: 'story', scene: 'c2s3', join: ['Scraps', 'Goob', 'Sprout'] },
  { type: 'story', scene: 'c2s4', join: ['Connie'] },
  { type: 'battle', id: 'k1', name: 'Maintenance Wing', bg: 'warehouse', lv: 26, music: 'unknown', require: ['Scraps', 'Goob'],
    tune: { easy: { atk: 1 }, hard: { atk: 0.95 } },
    hint: 'Nobody here has ever thrown a punch. Hit things anyway. Break the charging ones and Guard when hurt.',
    easy: [[['inkBall', 2], ['inkDrop', 1]], [['repBoxten', 1, { boss: true }]]],
    hard: [[['inkBall', 2], ['inkDrop', 1], ['inkCake', 1]], [['repBoxten', 1, { boss: true }], ['inkBall', 1]]] },
  { type: 'story', scene: 'c2s5', join: ['Rodger', 'Shelly'] },
  { type: 'battle', id: 'k2', name: 'Showtime', bg: 'sign', lv: 27, music: 'normal2',
    tune: { easy: { atk: 1 }, hard: { atk: 0.85 } },
    hint: 'Rodger’s skills build Research. At 3 an enemy is Exposed and its next charge is interrupted.',
    easy: [[['repLooey', 1], ['repYatta', 1]], [['repToodles', 1], ['inkCake', 1], ['inkDrop', 1]]],
    hard: [[['repLooey', 1], ['repYatta', 1], ['inkDrop', 1]], [['repToodles', 1], ['inkCake', 2], ['inkDrop', 1]]] },
  { type: 'story', scene: 'c2s6', join: ['Vee'] },
  { type: 'battle', id: 'k3', name: 'Control Room', bg: 'veeStorage', lv: 28, music: 'twisted',
    tune: { easy: { atk: 1 }, hard: { atk: 0.92 } },
    hint: 'Vee’s Headline takes extra damage from her. Commercial Break cancels a charge.',
    easy: [[['inkBottle', 2], ['inkCake', 1]], [['repFlutter', 1], ['repGigi', 1]]],
    hard: [[['inkBottle', 2], ['inkCake', 1], ['inkBomb', 1]], [['repFlutter', 1], ['repGigi', 1], ['inkSponge', 1]]] },
  { type: 'story', scene: 'c2s7', join: ['Dyle'] },
  { type: 'battle', id: 'k4', name: 'Platform Nine', bg: 'platform', lv: 29, music: 'boss', boss: 'repDyle', require: ['Dyle'],
    tune: { easy: { atk: 1 }, hard: { atk: 1.05 } },
    hint: 'Dyle’s hits land 35% harder on anything that is charging. Break Twisted Dyle before the Express arrives.',
    easy: [[['inkBrick', 1], ['inkBall', 2]], [['repDyle', 1, { boss: true }]]],
    hard: [[['inkBrick', 2], ['inkBall', 2]], [['repDyle', 1, { boss: true }], ['inkBrick', 1]]] },
  { type: 'story', scene: 'c2s8', join: ['Cosmo'] },
  { type: 'story', scene: 'c2s9', join: ['Brightney'] },
  { type: 'battle', id: 'k5', name: 'Blackout Wing', bg: 'library', lv: 30, music: 'unknown',
    tune: { easy: { atk: 1 }, hard: { atk: 0.85 } },
    hint: 'Brightney’s Blinding Flash Taunts the whole room. Safety Light softens every area attack.',
    easy: [[['repBlot', 2], ['inkHand', 1]], [['repBlot', 1], ['inkCake', 1], ['inkHand', 2]]],
    hard: [[['repBlot', 2], ['inkHand', 2]], [['repBlot', 2], ['inkCake', 1], ['inkHand', 2]]] },
  { type: 'story', scene: 'c2s10' },
  { type: 'battle', id: 'k6', name: 'The Annex', bg: 'artist', lv: 31, music: 'normal',
    tune: { easy: { atk: 1 }, hard: { atk: 0.85 } },
    easy: [[['inkBrick', 2], ['inkSponge', 1]], [['repGigi', 1], ['repToodles', 1], ['inkHand', 1]]],
    hard: [[['inkBrick', 2], ['inkSponge', 2]], [['repGigi', 1], ['repToodles', 1], ['inkHand', 2]]] },
  { type: 'story', scene: 'c2s11' },
  { type: 'battle', id: 'k7', name: 'Hall of Mirrors', bg: 'art', lv: 32, music: 'boss', boss: 'repGlisten',
    tune: { easy: { atk: 1 }, hard: { atk: 1.0 } },
    hint: 'Twisted Glisten counters when she Reflects. Wait it out, or hit her with something that does not touch her.',
    easy: [[['inkBall', 3]], [['repGlisten', 1, { boss: true }]]],
    hard: [[['inkBall', 3], ['inkCake', 1]], [['repGlisten', 1, { boss: true }], ['inkDrop', 1]]] },
  { type: 'story', scene: 'c2s12', join: ['Astro'] },
  { type: 'battle', id: 'k8', name: 'The Humming', bg: 'astro', lv: 33, music: 'emotional', require: ['Astro'],
    tune: { easy: { atk: 0.98 }, hard: { atk: 0.8 } },
    hint: 'This is Astro’s dream. Peaceful Slumber and Falling Stars are at their best here.',
    easy: [[['repBlot', 2], ['inkDrop', 2]], [['repFlutter', 1], ['repBlot', 1], ['inkCake', 1]]],
    hard: [[['repBlot', 2], ['inkDrop', 2], ['inkBomb', 1]], [['repFlutter', 1], ['repBlot', 1], ['inkCake', 2]]] },
  { type: 'story', scene: 'c2s13' },
  { type: 'story', scene: 'c2s14' },
  { type: 'battle', id: 'k9', name: 'Halloween Floor', bg: 'halloween', lv: 34, music: 'twisted', boss: 'repSoulvester',
    tune: { easy: { atk: 1 }, hard: { atk: 1.0 } },
    hint: 'Twisted Soulvester only gets sturdier. Frays, Defense down and Stagger Breaks are how you win.',
    easy: [[['repRibecca', 1], ['inkBrick', 1], ['inkBall', 1]], [['repSoulvester', 1, { boss: true }], ['inkHand', 1]]],
    hard: [[['repRibecca', 1], ['inkBrick', 2], ['inkBall', 1]], [['repSoulvester', 1, { boss: true }], ['repRibecca', 1], ['inkHand', 1]]] },
  { type: 'story', scene: 'c2s15', join: ['Rudie', 'Coal'] },
  { type: 'battle', id: 'k10', name: 'Toy Workshop', bg: 'christmas', lv: 36, music: 'carol', boss: 'repCocoa', require: ['Coal'],
    tune: { easy: { atk: 0.95 }, hard: { atk: 0.75 } },
    hint: 'Two bosses. Coal’s Stay Put pulls both onto her, and Rudie’s Momentum builds as he hits.',
    easy: [[['inkCake', 2], ['inkDrop', 2]], [['repCocoa', 1, { boss: true }], ['repFlyte', 1, { boss: true }]]],
    hard: [[['inkCake', 2], ['inkDrop', 2], ['inkBomb', 1]], [['repCocoa', 1, { boss: true }], ['repFlyte', 1, { boss: true }], ['inkCake', 1]]] },
  { type: 'story', scene: 'c2s16' },
  { type: 'battle', id: 'k11', name: 'The Reserve', bg: 'greenhouse', lv: 38, music: 'unknown',
    tune: { easy: { atk: 0.9 }, hard: { atk: 0.72 } },
    hint: 'Three waves, and your own faces in the last one. HP carries over; spend Bond Arts where they count.',
    easy: [[['inkHand', 2], ['inkBomb', 1], ['inkBrick', 1]], [['repToodles', 1], ['repGigi', 1], ['repLooey', 1]], [['twTisha', 1, { name: 'Replica Tisha' }], ['twRodger', 1, { name: 'Replica Rodger' }], ['repBoxten', 1, { boss: true }]]],
    hard: [[['inkHand', 2], ['inkBomb', 2], ['inkBrick', 1]], [['repToodles', 1], ['repGigi', 1], ['repLooey', 1], ['inkCake', 1]], [['twTisha', 1, { name: 'Replica Tisha' }], ['twRodger', 1, { name: 'Replica Rodger' }], ['repBoxten', 1, { boss: true }], ['inkHand', 1]]] },
  { type: 'story', scene: 'c2s17' },
  { type: 'battle', id: 'k12', name: 'Unit One', bg: 'greenhouse', lv: 40, music: 'colossus', boss: 'repDandy', final: true,
    tune: { easy: { atk: .64, hp: .9 }, hard: { atk: .56, hp: .78 } },
    hint: 'Two phases. Save your Bond Arts for the second.',
    easy: [[['repDandy', 1, { boss: true }], ['inkCake', 1]], [['repDandyCore', 1, { boss: true }], ['inkHand', 1]]],
    hard: [[['repDandy', 1, { boss: true }], ['inkCake', 1], ['inkDrop', 1]], [['repDandyCore', 1, { boss: true }], ['inkHand', 2]]] },
  { type: 'story', scene: 'c2s18' }
];

/* Chapter 2 hits harder than Chapter 1 and pays better. */
const ST2_ITEMS_FOR = {
  easy: { bandage: 4, medkit: 1, pop: 2, speed: 1, jumper: 1 },
  hard: { bandage: 3, medkit: 1, pop: 1, speed: 1, jumper: 1 }
};
const ST2_HARD = { lv: 4, mult: { hp: 1.3, atk: 1.18, def: 1.08 } };
const ST2_START_ITEMS = { bandage: 2, pop: 1 };

/* ------------------------------------------------------------ Dandy's Shop */
const ST2_SHOP = [
  { id: 'bandage', price: 900 }, { id: 'pop', price: 700 },
  { id: 'speed', price: 1200, unlock: 'k5' }, { id: 'medkit', price: 2400, unlock: 'k5' },
  { id: 'jumper', price: 2800, unlock: 'k7' }, { id: 'jawbreaker', price: 1800, unlock: 'k7', hard: true },
  { id: 'stealth', price: 2200, unlock: 'k9' }, { id: 'tonic', price: 2600, unlock: 'k10' }
];
const ST2_SHOP_CAP = 9;
const ST2_DANDY_LINES = [
  'Everything has a price. That is not a threat, it is a policy.',
  'No refunds. I would love to offer them. I simply do not remember agreeing to any.',
  'Oh, you want the cheap one? Of course you do.',
  'Take your time. The shelves will still be here. They are the one thing I am sure of.',
  'A week goes by and suddenly everyone wants bandages.',
  'Mind the gloves. They are not the colour I left them.',
  'I have only ever sold things. Surely that counts for something.',
  'Another customer. How wonderful. How ordinary.'
];

/* ------------------------------------------------------------ Tapes
   Free to collect: each is found at a story beat. They read as transcripts. */
const ST2_TAPES = [
  { id: 't1', unlock: 'c2s8', title: 'Opening Day · 1987', place: 'Gardenview Lobby', lines: [
    'ARTHUR WALTON: Welcome! Welcome to Gardenview Educational Center and Museum. I am Arthur, this is Delilah, and these are our friends.',
    'DELILAH KEEN: Please do not feed the exhibits.',
    'ARTHUR: They are not exhibits, Delilah. They are guests.',
    'DELILAH: They are guests with a very strict fire code. Cut the cameras, Arthur, the Toons are going to climb the sign again.',
    'ARTHUR: Every Toon in this building is here because they chose to be. Remember that, wherever you take this tape.'
  ] },
  { id: 't2', unlock: 'c2s8', title: 'Handler Orientation', place: 'Staff Training', lines: [
    'NARRATOR: Congratulations on joining Gardenview’s Toon Handler program.',
    'NARRATOR: A Toon is not a tool, a pet or a prop. A Toon is a person who happens to be a lamp, or a tissue box, or a pocket watch.',
    'NARRATOR: Your badge connects you to your Toon’s wellbeing. It will warm if they are in distress. Do not ignore it.',
    'NARRATOR: Rule one: listen. Rule two: listen again. Rule three: if a Toon starts to glitch, do not touch the sparkle. Call for help.',
    'NARRATOR: Handlers are never in charge. Handlers are there.'
  ] },
  { id: 't3', unlock: 'k3', title: 'Ichor and You', place: 'Children’s Short', lines: [
    'DANDY (cartoon): Hi, friends! It’s me, Dandy! Today we’re learning about Ichor!',
    'DANDY: Ichor is the sparkle that keeps Toons bright and bouncy. A little Ichor makes a Toon glow. A lot of Ichor…',
    'DANDY: …well! We never need a lot of Ichor! That’s why we keep it in the basement. In tanks. Behind several doors.',
    'DANDY: If you ever see Ichor on the floor: don’t touch it, don’t taste it, don’t follow it. Tell a Handler!',
    '(The tape ends on a close-up of the cartoon Dandy. His smile is a frame too long.)'
  ] },
  { id: 't4', unlock: 'c2s6', title: 'Camera 6B · 11:47', place: 'Security Room', lines: [
    'LOG: Camera 6B calibration. Offset +12 minutes. Adjusted by hand at 6:00 AM, June 24. Operator field: blank.',
    'LOG: Core corridor, 11:47 on screen. A figure in dark gloves opens the valve room. It is not the first time that morning.',
    'LOG: 11:35 real time. The figure removes a glove. The hand underneath is stained black to the wrist.',
    'LOG: Footage ends. The tape has been spliced in two places.'
  ] },
  { id: 't5', unlock: 'c2s14', title: 'Seasonal Hall Minutes', place: 'Staff Notes', lines: [
    'MINUTES: The Seasonal Toons rotate through the year. A Toon that is out of season spends its quiet months resting on its floor.',
    'MINUTES: Some Seasonals go further: they hide. The Christmas Toons in particular take their quiet months very seriously.',
    'MINUTES: If a Seasonal disappears in July, assume they have a reason. Do not search. They will come out when they are ready.',
    'MINUTES: Nobody asked what they were hiding from. Add to next month’s agenda.'
  ] },
  { id: 't6', unlock: 'c2s16', title: 'Understudy Program · Form 02', place: 'Reserve Office', lines: [
    'REQUISITION: Cast Units, forty-one (41), plus spares. For use during filming when a Toon is unavailable.',
    'REQUISITION: Cast Units are grown in the Development Tanks from a sample of the original and carry no memories of their own.',
    'REQUISITION: A Cast Unit may stand in for its original for no more than one scene. It must be returned to the Reserve afterwards.',
    'REQUISITION: Approved: D.K.',
    '(Beneath the signature, in pencil: “What happens to the ones we don’t return?”)'
  ] },
  { id: 't7', unlock: 'k12', hard: true, title: 'Roll Call', place: 'The Reserve', lines: [
    'ROLL CALL: Boxten. Present. Boxten. Present.',
    'ROLL CALL: Tisha. Present. Tisha. Present.',
    'ROLL CALL: Dyle. Present. Dyle. Present.',
    'ROLL CALL: Dandy. Present. Dandy. Present. Dandy. Present.',
    'ROLL CALL: Devan Reed. (A long pause.) Retained.'
  ] }
];

if (typeof module !== 'undefined') module.exports = { ST2_NODES, ST2_ITEMS_FOR, ST2_HARD, ST2_SHOP, ST2_TAPES };
