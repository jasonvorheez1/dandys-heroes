/* ch3-nodes.js - Main Story · Chapter 3 "Closed for Renovation", July 8-10, 2002.
   Twenty-seven scenes and seventeen battles told by three squads that never share a party:
   the Handlers (outside, then under the building), the Residents (the Toons who still
   think the closure is a break between seasons) and the Seasonals (the holiday floors).
   A node's `squad` picks whose lineup fights it; `relay` hands each wave to a different squad.
   `fall` marks a scene where someone dies; they come back from the Lobby later.
   Enemies start at level 41. Lethal moves kill outright unless a Tank can take the hit. */
'use strict';

Object.assign(ST_BG, {
  park: 'assets/backgrounds/maps/park-gate.webp', station: 'assets/uploads/gardenviewtrainstation.webp', station2: 'assets/uploads/gardenviewtrainstation.webp',
  renovation: 'assets/uploads/gardenviewsignclosedforrenovation.png'
});

/* Pictures a scene can lay over the stage with `@image key`. Caption is optional. */
const ST3_IMAGES = {
  news: { src: 'assets/uploads/news_paper.webp', cap: 'City Newspaper · 6/24/2002' },
  sign: { src: 'assets/uploads/gardenviewsignclosedforrenovation.png', cap: 'GARDENVIEW · CLOSED FOR RENOVATIONS.' },
  barrier: { src: 'assets/uploads/barriersign.png', cap: '' },
  park: { src: 'assets/uploads/gardenviewparkbackground.webp', cap: 'Gardenview Park' },
  station: { src: 'assets/uploads/gardenviewtrainstation.webp', cap: 'FIND ME!' },
  note1: { src: 'assets/uploads/Get_Her_1.webp', cap: 'The note, front.' },
  note2: { src: 'assets/uploads/Get_Her_2.webp', cap: 'The note, back.' }
};

/* Horror stills painted at runtime by websim.imageGen; each falls back to a procedural one. */
const ST3_HORROR = {
  corridor: 'Dark empty museum corridor for children, black ink dripping from the ceiling, cartoon character posters on the walls with the eyes scratched out, single red emergency light, VHS horror, cinematic, no text',
  monitors: 'A wall of old CRT security monitors in a dark room, every screen showing the same cartoon character staring straight into the camera, static, green glow, horror, no text',
  tanks: 'Rows of tall glass tanks in a dark laboratory, each holding the silhouette of a sleeping cartoon character in black liquid, brass labels, ominous green lamps, horror, no text',
  door: 'A heavy steel blast door at the bottom of a dark concrete stairwell, three small handprints in black ink low on the door, a tiny dog shadow, horror, no text',
  boots: 'Grainy black and white security camera footage of an empty hallway, a tall figure visible only as dark boots at the edge of the frame, eerie, no text',
  eggs: 'Pastel Easter decorations stained with black ink, an empty candy basket on the floor, one cracked egg with an eye inside, dim light, creepy, no text',
  lobby: 'A museum lobby at night, reception desk, black ink on the ceiling, one small cheerful cartoon character standing alone facing the wall, unsettling, no text',
  vent: 'Inside a narrow metal ventilation duct, a faint ghostly glow ahead, hundreds of pairs of eyes reflecting in the dark, horror, no text',
  press: 'A huge industrial printing press in a dark chamber, black liquid, drawers along the walls full of sleeping cartoon characters, red digital counter, horror, no text'
};


const ST3_RESIDENTS = ['Pebble', 'Brusha', 'Rodger', 'Vee', 'Shelly', 'Scraps', 'Sprout', 'Cosmo', 'Astro', 'Toodles'];

/* ------------------------------------------------------------ the three squads */
const ST3_SQUADS = {
  handlers: { name: 'The Handlers', short: 'HANDLERS', color: '#46d65a', pool: ['Devan', 'Veronica', 'Sam', 'Shannon', 'Austin'],
    blurb: 'Locked out, then under the building. Without Devan they have no Guardian.',
    bonus: 'Badge Link: Bond fills faster, and every fight starts with one extra Barrier Sign.' },
  residents: { name: 'The Residents', short: 'RESIDENTS', color: '#6fe3f0', pool: ST3_RESIDENTS, guests: ['Tisha'],
    blurb: 'Still at home. Most of them think the building is on a break between seasons.',
    bonus: 'Same Halls: everyone starts a fight with 25 Bond.' },
  seasonals: { name: 'The Seasonals', short: 'SEASONALS', color: '#ffb347', pool: ['Gourdy', 'Soulvester', 'Bobette', 'Bassie', 'Cocoa', 'Eclipse'],
    blurb: 'The holiday floors. Gourdy holds the line, and everyone else looks after each other.',
    bonus: 'Holiday Spirit: while two or more Seasonals stand, the squad deals 8% more damage.' }
};

const ST3_NODES = [
  { type: 'story', scene: 'c3h1', join: ['Veronica', 'Sam', 'Shannon', 'Austin'] },
  { type: 'battle', id: 'm1', tier: 0, name: 'Park Path', bg: 'park', lv: 41, music: 'unknown', squad: 'handlers',
    tune: { easy: { atk: 1.1 }, hard: { atk: 1.1 } },
    hint: 'The Handlers have no Guardian. A Flower’s last petal is LETHAL with nobody to take it: Break it, Shield the target, or plant a Barrier Sign.',
    easy: [[['inkFlower', 1], ['inkBall', 2]], [['inkFlower', 2], ['inkIchordrop', 1]]],
    hard: [[['inkFlower', 1], ['inkBall', 2], ['inkPeeper', 1]], [['inkFlower', 2], ['inkIchordrop', 2]]] },
  { type: 'story', scene: 'c3h2' },
  { type: 'battle', id: 'm2', tier: 0, name: 'Platform Zero', bg: 'station', lv: 42, music: 'twisted', squad: 'handlers',
    tune: { easy: { atk: 1 }, hard: { atk: .8 } },
    hint: 'Ichordrops split into two droplets when they pop. Fight them one at a time, or clear them all at once.',
    easy: [[['inkIchordrop', 2], ['inkBrick', 1]], [['inkIchordrop', 2], ['inkPeeper', 1], ['inkFlower', 1]]],
    hard: [[['inkIchordrop', 3], ['inkBrick', 1]], [['inkIchordrop', 2], ['inkPeeper', 2], ['inkFlower', 1]]] },
  { type: 'story', scene: 'c3x1' },
  { type: 'battle', id: 'm12', tier: 1, name: 'Signal Cabin', bg: 'station2', lv: 43, music: 'unknown', squad: 'handlers', hazard: 'signal',
    tune: { easy: { atk: .85, hp: .85 }, hard: { atk: .68, hp: .75 } },
    hint: 'The camera sweeps every fourth turn and Marks a Handler. Guard the marked target or Break the Peepers before they exploit it.',
    easy: [[['inkPeeper', 2], ['inkBrick', 1]], [['inkPeeper', 2], ['inkIchordrop', 1], ['inkFlower', 1]]],
    hard: [[['inkPeeper', 3], ['inkBrick', 1]], [['inkPeeper', 3], ['inkIchordrop', 2], ['inkFlower', 1]]] },
  { type: 'story', scene: 'c3r1', join: ['Pebble', 'Brusha', 'Tisha', 'Rodger', 'Vee', 'Shelly', 'Scraps', 'Sprout', 'Cosmo', 'Astro', 'Toodles'] },
  { type: 'story', scene: 'c3r2' },
  { type: 'battle', id: 'm3', tier: 1, name: 'Lobby Planters', bg: 'lobby', lv: 43, music: 'normal2', squad: 'residents',
    tune: { easy: { atk: 1.05 }, hard: { atk: .95 } },
    hint: 'Pebble is the Residents’ only Tank. With a Tank on the field, a lethal strike lands on them instead.',
    easy: [[['inkFlower', 2], ['inkIchordrop', 1]], [['inkFlower', 1], ['inkIchordrop', 2], ['inkPeeper', 1]]],
    hard: [[['inkFlower', 2], ['inkIchordrop', 2]], [['inkFlower', 2], ['inkIchordrop', 2], ['inkPeeper', 1]]] },
  { type: 'story', scene: 'c3s1', join: ['Gourdy', 'Bobette', 'Bassie', 'Cocoa'] },
  { type: 'battle', id: 'm4', tier: 1, name: 'Egg Hunt', bg: 'easter', lv: 44, music: 'twisted', boss: 'hunterBassie', squad: 'seasonals',
    tune: { easy: { atk: .85, hp: .7 }, hard: { atk: .55, hp: .75 } },
    hint: 'Gourdy is the Seasonals’ Tank. GET HER is lethal: keep Gourdy up or use Bobette’s box.',
    easy: [[['inkFlower', 2], ['twEggson', 1]], [['hunterBassie', 1, { boss: true }], ['inkFlower', 1]]],
    hard: [[['inkFlower', 2], ['twEggson', 1], ['inkPeeper', 1]], [['hunterBassie', 1, { boss: true }], ['inkFlower', 1], ['twEggson', 1]]] },
  { type: 'story', scene: 'c3r3' },
  { type: 'battle', id: 'm5', tier: 2, name: 'Gallery of Eyes', bg: 'art', lv: 45, music: 'unknown', squad: 'residents', guest: ['Tisha'], require: ['Tisha', 'Brusha'],
    tune: { easy: { atk: 1.05 }, hard: { atk: .55 } },
    hint: 'Tisha only fights alongside Brusha, so both are in. Peepers Silence you: no skills for a turn. Basic attacks, Guard and items still work. Brusha’s Painted Wall stands in for a Tank.',
    easy: [[['inkPeeper', 3], ['inkHand', 1]], [['inkPeeper', 2], ['inkFlower', 1], ['inkHollow', 1]]],
    hard: [[['inkPeeper', 3], ['inkHand', 2]], [['inkPeeper', 3], ['inkFlower', 1], ['inkHollow', 1]]] },
  { type: 'story', scene: 'c3x2' },
  { type: 'battle', id: 'm13', tier: 2, name: 'Blind Spot', bg: 'art', lv: 46, music: 'unknown', squad: 'residents', guest: ['Tisha'], require: ['Tisha', 'Brusha'], hazard: 'blackout',
    tune: { easy: { atk: .9, hp: .85 }, hard: { atk: .68, hp: .75 } },
    hint: 'The gallery lights fail every fourth turn. The dark Slows the party, but breaking a Peepers interrupts its next attack.',
    easy: [[['inkPeeper', 2], ['inkHand', 1]], [['inkHollow', 1], ['inkPeeper', 2], ['inkFlower', 1]]],
    hard: [[['inkPeeper', 3], ['inkHand', 1]], [['inkHollow', 2], ['inkPeeper', 2], ['inkFlower', 1]]] },
  { type: 'story', scene: 'c3r4', leave: ['Rodger'], fall: true },
  { type: 'battle', id: 'm6', tier: 2, name: 'Monitor Wall', bg: 'veeStorage', lv: 46, music: 'boss', boss: 'camera6B', squad: 'residents',
    tune: { easy: { atk: .8 }, hard: { atk: .6 } },
    hint: 'Rodger is gone. Camera 6B’s RECORDING kills one Toon outright. A Tank in front, a Shield, or a Break stops it.',
    easy: [[['inkPeeper', 2], ['inkHollow', 1]], [['camera6B', 1, { boss: true }]]],
    hard: [[['inkPeeper', 2], ['inkHollow', 1], ['inkFlower', 1]], [['camera6B', 1, { boss: true }], ['inkPeeper', 1]]] },
  { type: 'story', scene: 'c3r5', join: ['Rodger'] },
  { type: 'story', scene: 'c3f1' },
  { type: 'story', scene: 'c3e1' },
  { type: 'battle', id: 'me', tier: 2, name: 'The Elevator', bg: 'library', lv: 46, music: 'unknown', squad: 'residents', guest: ['Tisha'], only: ['Tisha', 'Brusha'], require: ['Tisha', 'Brusha'],
    tune: { easy: { atk: .75, hp: .8 }, hard: { atk: .55, hp: .75 } },
    hint: 'Just Tisha and Brusha, stuck between floors. Brusha’s Painted Wall covers for a missing Tank; Tisha scrubs ailments off both of them.',
    easy: [[['inkPeeper', 1], ['inkIchordrop', 1]], [['inkFlower', 1], ['inkPeeper', 1], ['inkDroplet', 1]]],
    hard: [[['inkPeeper', 2], ['inkIchordrop', 1]], [['inkFlower', 1], ['inkPeeper', 1], ['inkIchordrop', 1]]] },
  { type: 'story', scene: 'c3s2', join: ['Soulvester', 'Eclipse'] },
  { type: 'battle', id: 'm7', tier: 3, name: 'Halloween Hall', bg: 'halloween', lv: 47, music: 'boss', boss: 'repKnight', squad: 'seasonals',
    tune: { easy: { atk: .75, hp: .75 }, hard: { atk: .5, hp: .8 } },
    hint: 'A copy of Soulvester guards the stairs. KNIGHT’S VERDICT is lethal. Gourdy can take it, if he is still standing.',
    easy: [[['inkPeeper', 2], ['inkFlower', 1]], [['repKnight', 1, { boss: true }], ['inkPeeper', 1]]],
    hard: [[['inkPeeper', 2], ['inkFlower', 2]], [['repKnight', 1, { boss: true }], ['inkPeeper', 1], ['inkIchordrop', 1]]] },
  { type: 'story', scene: 'c3x3' },
  { type: 'battle', id: 'm14', tier: 3, name: 'Costume Racks', bg: 'halloween', lv: 48, music: 'twisted', squad: 'seasonals', hazard: 'rack',
    tune: { easy: { atk: .58, hp: .55 }, hard: { atk: .42, hp: .4 } },
    hint: 'Every fourth turn a rack opens: copies gain Defense. Focus one foe and Break it before the next rack opens.',
    easy: [[['repUnitFive', 1], ['inkPeeper', 2]], [['repUnitFive', 2], ['inkFlower', 1], ['inkIchordrop', 1]]],
    hard: [[['repUnitFive', 2], ['inkPeeper', 2]], [['repUnitFive', 2], ['inkFlower', 2], ['inkIchordrop', 1]]] },
  { type: 'story', scene: 'c3r6', leave: ['Scraps'], fall: true },
  { type: 'story', scene: 'c3s3' },
  { type: 'battle', id: 'm8', tier: 3, name: 'Vent Run', bg: 'warehouse', lv: 48, music: 'unknown', squad: 'seasonals', only: ['Eclipse'], require: ['Eclipse'], solo: true,
    tune: { easy: { atk: .3, hp: .6 }, hard: { atk: .2, hp: .6 } },
    hint: 'Eclipse alone. Nobody to Tank, so Break anything that charges. Dodge and his Shield are all the armour he has.',
    easy: [[['inkPeeper', 1], ['inkIchordrop', 1]], [['inkPeeper', 1], ['inkFlower', 1], ['inkDroplet', 1]]],
    hard: [[['inkPeeper', 1], ['inkIchordrop', 1], ['inkDroplet', 1]], [['inkPeeper', 1], ['inkFlower', 1], ['inkDroplet', 1]]] },
  { type: 'story', scene: 'c3s4' },
  { type: 'story', scene: 'c3r9', join: ['Scraps', 'Pebble'] },
  { type: 'story', scene: 'c3h3' },
  { type: 'story', scene: 'c3h4', join: ['Devan'] },
  { type: 'battle', id: 'm9', tier: 4, name: 'Sublevel Four', bg: 'greenhouse', lv: 50, music: 'emotional', boss: 'clipboardDandy', squad: 'handlers',
    tune: { easy: { atk: .55 }, hard: { atk: .5 } },
    hint: 'Devan is with them now, and he is the Tank. TERMINATE CONTRACT is lethal: let him stand in front of it.',
    easy: [[['inkIchordrop', 1], ['inkPeeper', 1]], [['clipboardDandy', 1, { boss: true }]]],
    hard: [[['inkIchordrop', 2], ['inkPeeper', 1]], [['clipboardDandy', 1, { boss: true }], ['inkDroplet', 1]]] },
  { type: 'story', scene: 'c3h5' },
  { type: 'story', scene: 'c3r10' },
  { type: 'story', scene: 'c3x4' },
  { type: 'battle', id: 'm15', tier: 4, name: 'Sorting Line', bg: 'library', lv: 52, music: 'unknown', squad: 'residents', hazard: 'sorter',
    tune: { easy: { atk: .72, hp: .8 }, hard: { atk: .5, hp: .65 } },
    hint: 'The sorter sounds every fourth turn, draining 2 FP from each Toon. Use basic attacks and save skills for the second wave.',
    easy: [[['inkHollow', 1], ['inkIchordrop', 2]], [['repUnitFive', 1], ['inkPeeper', 2], ['inkHollow', 1]]],
    hard: [[['inkHollow', 2], ['inkIchordrop', 2]], [['repUnitFive', 2], ['inkPeeper', 2], ['inkHollow', 1]]] },
  { type: 'battle', id: 'm10', tier: 4, name: 'The Return Queue', bg: 'library', lv: 52, music: 'twisted', squad: 'residents',
    tune: { easy: { atk: .65 }, hard: { atk: .5 } },
    hint: 'Every weakling gimmick at once. Silence, splitting droplets, Flowers and Sponges that drain FP. Keep a Tank up.',
    easy: [[['inkIchordrop', 2], ['inkFlower', 1], ['inkPeeper', 1]], [['repUnitFive', 1], ['inkHollow', 1], ['inkFlower', 1], ['inkPeeper', 1]], [['repUnitFive', 2], ['inkIchordrop', 1], ['inkFlower', 1]]],
    hard: [[['inkIchordrop', 2], ['inkFlower', 2], ['inkPeeper', 1]], [['repUnitFive', 1], ['inkHollow', 2], ['inkFlower', 1], ['inkPeeper', 1]], [['repUnitFive', 2], ['inkIchordrop', 2], ['inkFlower', 1]]] },
  { type: 'story', scene: 'c3r11', leave: ['Shelly'], fall: true },
  { type: 'story', scene: 'c3x5' },
  { type: 'battle', id: 'm16', tier: 5, name: 'Pressure Shaft', bg: 'greenhouse', lv: 54, music: 'boss', squad: 'seasonals', hazard: 'pressure',
    tune: { easy: { atk: .55, hp: .65 }, hard: { atk: .38, hp: .52 } },
    hint: 'Every fourth turn the pipe vents heat across the party. Guard, Shield, or finish the wave before the next vent.',
    easy: [[['inkPeeper', 2], ['inkFlower', 1]], [['inkHollow', 2], ['inkIchordrop', 1], ['inkFlower', 1]]],
    hard: [[['inkPeeper', 2], ['inkFlower', 2]], [['inkHollow', 2], ['inkIchordrop', 2], ['inkFlower', 1]]] },
  { type: 'story', scene: 'c3r12' },
  { type: 'battle', id: 'm11', tier: 5, name: 'The Return Press', bg: 'greenhouse', lv: 55, music: 'colossus', boss: 'returnPress', relay: ['handlers', 'residents', 'seasonals'], final: true,
    tune: { easy: { atk: .3, hp: .6 }, hard: { atk: .22, hp: .5 } },
    hint: 'Three squads, one wave each, and none of them can see the others. Each squad fights its own side of the Press. PRINT RUN is lethal to the whole squad unless a Tank is standing.',
    easy: [[['inkIchordrop', 2], ['inkPeeper', 1], ['inkFlower', 1]], [['inkHollow', 1], ['inkPeeper', 1], ['inkFlower', 1], ['inkIchordrop', 1]], [['returnPress', 1, { boss: true }], ['inkPeeper', 1]]],
    hard: [[['inkIchordrop', 2], ['inkPeeper', 2], ['inkFlower', 1]], [['inkHollow', 2], ['inkPeeper', 1], ['inkFlower', 1], ['inkIchordrop', 1]], [['returnPress', 1, { boss: true }], ['inkPeeper', 1], ['inkFlower', 1]]] },
  { type: 'story', scene: 'c3r13', join: ['Shelly'] }
];

/* Chapter 3 saves from before the expanded route store clears by array index. */
const ST3_LEGACY_ORDER = 'c3h1 m1 c3h2 m2 c3r1 c3r2 m3 c3s1 m4 c3r3 m5 c3r4 m6 c3r5 c3f1 c3e1 me c3s2 m7 c3r6 c3s3 m8 c3s4 c3r9 c3h3 c3h4 m9 c3h5 c3r10 m10 c3r11 c3r12 m11 c3r13'.split(' ');
const ST3_HAZARD_NAMES = { signal: 'CAMERA', blackout: 'BLACKOUT', rack: 'COPY RACKS', sorter: 'SORTER', pressure: 'VENT' };

const ST3_ITEMS_FOR = {
  easy: { bandage: 4, medkit: 1, pop: 2, speed: 1, jumper: 1, barrier: 1 },
  hard: { bandage: 3, medkit: 1, pop: 1, speed: 1, jumper: 1, barrier: 0 }
};
const ST3_HARD = { lv: 4, mult: { hp: 1.3, atk: 1.2, def: 1.08 } };

/* ------------------------------------------------------------ Dandy's Shop returns */
const ST3_SHOP = [
  { id: 'bandage', price: 900 }, { id: 'pop', price: 700 }, { id: 'barrier', price: 2800 },
  { id: 'speed', price: 1200, unlock: 'm3' }, { id: 'medkit', price: 2400, unlock: 'm3' },
  { id: 'jawbreaker', price: 1800, unlock: 'm5' }, { id: 'stealth', price: 2200, unlock: 'm5' },
  { id: 'jumper', price: 3000, unlock: 'm6' }, { id: 'tonic', price: 2600, unlock: 'm7' }
];
const ST3_DANDY_LINES = [
  'You can just point. I understand.',
  'Same prices. I checked twice.',
  'I heard what they said. Take the bandages.',
  'The register rings by itself now.',
  'I’ll leave the door open.',
  'Good choice. I’ll leave it at that.'
];

/* ------------------------------------------------------------ Dyle's Lost and Found
   Dyle sells the game's own Trinkets, each left behind by the Toon it belongs to. Buying one puts a real
   copy in your inventory (rank grows as the story does). Each character can carry two in the story. */
const ST3_DYLE = [
  { id: 'dyle_trainwhistle', price: 3500 }, { id: 'tisha_featherduster', price: 3500 }, { id: 'pebble_bone', price: 3500 },
  { id: 'astro_starpillow', price: 3800 }, { id: 'sprout_savorycharm', price: 3800 }, { id: 'cosmo_sweetcharm', price: 3800 },
  { id: 'rodger_magnifyingglass', price: 4200, unlock: 'm3' }, { id: 'vee_veemote', price: 4200, unlock: 'm3' }, { id: 'shelly_participation', price: 4200, unlock: 'm3' },
  { id: 'scraps_crayonset', price: 4200, unlock: 'm3' }, { id: 'toodles_dogplush', price: 4200, unlock: 'm3' },
  { id: 'bobette_windupbell', price: 4800, unlock: 'm4' }, { id: 'bassie_basketpin', price: 4800, unlock: 'm4' }, { id: 'gourdy_candywrapper', price: 4800, unlock: 'm4' },
  { id: 'cocoa_fondantbag', price: 5200, unlock: 'm5' }, { id: 'eclipse_moonfragment', price: 5200, unlock: 'm5' }, { id: 'brusha_paintbucket', price: 5200, unlock: 'm5' },
  { id: 'squirm_stressball', price: 5600, unlock: 'm6' }, { id: 'boxten_bluebandana', price: 5600, unlock: 'm6' }, { id: 'brightney_sparebulb', price: 6000, unlock: 'm7' },
  { id: 'connie_ghostsnakes', price: 6000, unlock: 'm7' }, { id: 'coal_cinderchunk', price: 6400, unlock: 'm9' }, { id: 'rudie_festivelights', price: 6400, unlock: 'm9' }
];
const ST3_DYLE_LINES = [
  'Left behind. Tagged. Priced.',
  'If the owner asks, send them to me.',
  'Conductor. The cart is incidental.',
  'Halloween floor, May. Never claimed.'
];

/* ------------------------------------------------------------ Evidence */
const ST3_TAPES = [
  { id: 'e1', unlock: 'c3h1', title: 'City Newspaper · 6/24', place: 'Outside the Gates', img: 'assets/uploads/news_paper.webp', lines: [
    'CITY NEWSPAPER: Gardenview Educational Center™ is to shut its doors on 6/29 due to recent allegations and lack of safety regulations…',
    'CITY NEWSPAPER: Little has been revealed following a case of the “Malfunction” incident. One of the creators, known as Arthur Walton, was questioned on the matter. He chose to remain silent.',
    '(Under the print, a black smear. Most of a second article has been scratched out. The word “silly” is still readable.)'
  ] },
  { id: 'e2', unlock: 'c3h2', title: 'Platform Zero', place: 'Freight Station', img: 'assets/uploads/gardenviewtrainstation.webp', lines: [
    'WRITTEN ON THE WALL, IN WET BLACK INK: FIND ME!',
    'NOTE (Sam): None of us knows the handwriting. Shannon thinks it might be Devan. Veronica says Devan would have signed it.',
    'NOTE (Sam): The ink was still wet when we got there. Nobody was around.'
  ] },
  { id: 'e3', unlock: 'c3r3', title: 'The Gallery Wall', place: 'Art Floor', lines: [
    'BRUSHA: I’m writing this down because nobody will listen to it out loud.',
    'BRUSHA: Somebody was in my gallery overnight. I never saw them. I found boot prints in the paint tray and my portraits turned to face the wall.',
    'BRUSHA: Every painting with eyes has been scratched out. I don’t think a Toon did it. Nobody here owns boots.'
  ] },
  { id: 'e4', unlock: 'c3r5', title: 'Gift Tags', place: 'The Lobby', lines: [
    'BOBETTE (on a gift tag): For Rodger, who came back.',
    'BOBETTE (on a second tag): I wrote “welcome back” on this one before he got here. I don’t know why. I just did.',
    'BOBETTE (on a third tag, blank): In case I need it.'
  ] },
  { id: 'e5', unlock: 'c3s1', img: 'assets/uploads/Get_Her_1.webp', title: 'The Note', place: 'Easter Floor', lines: [
    'FRONT: Get her. get her. Get Her. get her. NOW. Get Her…',
    'BACK: NOW. Her. GetHer. get her. NOW. Her. (The ink covers the middle of the page. The pen has gone through the paper twice.)',
    'NOTE: The handwriting gets bigger with every line. Whoever wrote it could not stop. Bassie says the S is hers.'
  ] },
  { id: 'e6', unlock: 'c3f1', title: 'Dandy’s World · Season Two', place: 'Behind the Scenes, 1993', lines: [
    'TAPE LABEL: DANDY’S WORLD · SEASON TWO · EPISODE 7 · BEHIND THE SCENES. FOR STAFF ONLY.',
    'TAPE: Fifteen episodes a season, four seasons, a new one every spring. The Toons play themselves. Handlers stay off camera.',
    'TAPE: At the end of the roll, two people argue in the corner of the set. One of them has a pencil. The tape cuts before they finish.'
  ] },
  { id: 'e7', unlock: 'c3s2', title: 'Seasonal Hall Minutes', place: 'Halloween Floor', lines: [
    'MINUTES: Item 4. Costume storage. The Understudy racks were moved to Sublevel Three without our sign-off.',
    'MINUTES: Item 5. Soulvester asks that the racks not be labelled with the names of Seasonals.',
    'MINUTES: Motion to ask Delilah why. Seconded by Gourdy. Not carried.'
  ] },
  { id: 'e8', unlock: 'c3s4', title: 'Understudy Program · Form 03', place: 'Return Queue', lines: [
    'FORM 03: LOBBY RETURN. A Toon that is destroyed, unrecoverable or surplus to requirements is re-printed from its last memory sync and delivered to the Lobby.',
    'FORM 03: Memory syncs are recorded by the building’s cameras. The Toon wakes with everything it knew. For all practical purposes, it is the same Toon.',
    'FORM 03: Approved: D.K.',
    '(In pencil, in the margin: “Practical for who?”)'
  ] },
  { id: 'e9', unlock: 'c3h4', title: 'Devan’s Notebook', place: 'Sublevel Four', lines: [
    'DEVAN: Day 3. The lights are on a timer. Somebody wanted me to be able to see.',
    'DEVAN: Day 9. The other Dandy brings me a tray. He doesn’t say anything. I think he’s embarrassed.',
    'DEVAN: Day 12. I asked him which one he was. He said, “the one who stayed.”'
  ] },
  { id: 'e10', unlock: 'c3r10', title: 'Unit Four', place: 'Reserve Office', lines: [
    'LEDGER: BOXTEN. UNIT FOUR. RELEASED 07/07 6 AM. DESTINATION: LOBBY. STATUS: UNACCOUNTED.',
    'LEDGER (different hand): Does not answer to Unit One’s name. Answers to “Boxten.” Winds his own key.',
    'LEDGER (pencil): He asked if he was allowed to keep the tea.'
  ] },
  { id: 'e11', unlock: 'c3r13', title: 'Camera 6B · 4:44 AM', place: 'Security Room', lines: [
    'LOG: Camera 6B. Corridor, 4:44 AM. Empty. Empty. Empty.',
    'LOG: Frame 1,108. A boot enters the left edge of the shot and stays there for the rest of the tape.',
    'LOG: Operator field: blank. Offset: +12. Somebody is still adjusting it by hand.'
  ] },
  { id: 'e12', unlock: 'c3x1', title: 'Signal Cabin · Offset', place: 'Platform Zero', lines: [
    'TIMETABLE: 11:52 circled twice. The cabin camera carries a +12 minute offset.',
    'CAMERA LOG: Offset +12. Operator field cleared. Four figures entered frame; the fourth disappeared for ten seconds.',
    'NOTE (Veronica): A recording can be altered. A warning can still be useful.'
  ] },
  { id: 'e13', unlock: 'c3x3', title: 'Costume Rack Tags', place: 'Halloween Storage', lines: [
    'RACK: SOULVESTER · UNIT TWO · READY. The tag is fresh; the armour behind it is still wet.',
    'REQUISITION: Seasonal doubles to be stored out of public view. Sign-off line left blank.',
    'NOTE (Gourdy): We asked to remove our names. Someone kept making copies.'
  ] },
  { id: 'e14', unlock: 'c3x4', title: 'Sorting Bell', place: 'Return Queue', lines: [
    'MAINTENANCE: The bell sounds every fourth cycle. Camera sync pauses while the sorter resets.',
    'PAPER STRIP: SCRAPS. RODGER. SHELLY. BOXTEN. Beside each name, a recent camera still.',
    'NOTE (Boxten): I heard the bell when I was alone. This time I have people with me.'
  ] }
];

if (typeof module !== 'undefined') module.exports = { ST3_NODES, ST3_ITEMS_FOR, ST3_HARD, ST3_TAPES, ST3_IMAGES, ST3_HORROR, ST3_SQUADS, ST3_SHOP, ST3_DYLE };
