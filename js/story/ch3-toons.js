/* ch3-toons.js - Chapter 3 "Closed for Renovation": the two newly playable
   characters (Pebble, Bobette, Bassie, Gourdy and Toodles), the new weaklings and the Chapter 3 foes.
   Moves flagged `lethal` kill outright when no Tank can take the hit (ch3-engine.js).
   Moves with `split` or `fpdrain` are the weaklings' gimmicks. */
'use strict';

Object.assign(ST_ROLE_ICON, { Giftwrapper: '🎁', Courier: '🧺', Trickster: '🎲', Tracker: '🐺', Warmer: '☕', Artist: '🎨' });

const ST_CH3_START_LV = 40;

Object.assign(ST_TOONS, {
  Pebble: {
    kind: 'toon', name: 'Pebble', full: 'Pebble', toon: 'Pebble', role: 'Guardian', color: '#d9dde2', accent: '#8f98a3',
    blurb: 'A small dog who has been waiting at one door for a very long time.',
    basicName: 'Rocky Nudge', basicKind: 'phys', improvised: 'Rocky Nudge',
    base: { hp: 146, fp: 22, atk: 12.5, mag: 5, def: 15, mdef: 10, spd: 10.4, luck: 7 },
    grow: { hp: 16.5, fp: 1.3, atk: 1.4, mag: .5, def: 1.6, mdef: 1.1, spd: .15, luck: .2 },
    passive: { name: 'Good Dog', desc: 'Counts as a Tank. The first time each ally drops under 35% HP, Pebble throws up a Shield for them.' },
    skills: [
      { id: 'speak', name: 'Speak!', fp: 7, unlock: 'badge', target: 'self', kind: 'buff', desc: 'Bark. Taunts every enemy for 2 turns and raises Pebble’s Defense.', fx: { taunt: 2, self: [['defUp', 3]] } },
      { id: 'tackle', name: 'Rocky Tackle', fp: 7, unlock: 'badge', target: 'enemy', kind: 'phys', stagger: 3, desc: 'A heavy shoulder-check that interrupts a charge.', fx: { dmg: 'phys', power: 1.45, interrupt: true } },
      { id: 'stay', name: 'Stay!', fp: 10, unlock: 'badge', target: 'ally', kind: 'buff', desc: 'Sit down in front of an ally: a Shield worth 28% of Pebble’s Max HP and Ward 25% on them.', fx: { shield: { who: 'ally', pct: .28, turns: 3, of: 'self' }, ally: [['ward', 3, 1, { v: .25 }]] } },
      { id: 'goodboy', name: 'Good Boy!', fp: 14, unlock: 'badge', target: 'allies', kind: 'heal', desc: 'Heal the whole party for 14% and cleanse every ailment.', fx: { heal: { pct: .14 }, cleanse: 'team' } }
    ],
    bond: { name: 'Waiting at the Door', toonLine: 'Pebble does not move.', desc: 'Taunt every enemy for 3 turns, Shield the party for 20% of Pebble’s Max HP and counter every hit for 3 turns.',
      fx: { taunt: 3, shield: { who: 'team', pct: .2, turns: 3, of: 'self' }, self: [['counter', 3]] } }
  },

  Bobette: {
    kind: 'toon', name: 'Bobette', full: 'Bobette', toon: 'Bobette', role: 'Giftwrapper', color: '#ff8f8f', accent: '#b83a3a',
    blurb: 'Christmas floor. She wraps everything, hands out a present before anyone asks, and can hide inside her own box.',
    basicName: 'Ribbon Whip', basicKind: 'mag', improvised: 'Ribbon Whip',
    base: { hp: 108, fp: 30, atk: 8, mag: 13.5, def: 10, mdef: 11.5, spd: 11.8, luck: 8 },
    grow: { hp: 12, fp: 2, atk: .8, mag: 1.5, def: 1.15, mdef: 1.3, spd: .18, luck: .24 },
    passive: { name: 'Habit', desc: 'At the start of her turn the weakest ally gets a small Shield (5% of Bobette’s Max HP).' },
    skills: [
      { id: 'wrap', name: 'Gift Wrap', fp: 8, unlock: 'badge', target: 'ally', kind: 'buff', desc: 'Wrap an ally: a Shield worth 22% of Bobette’s Max HP and Defense up for 3 turns.', fx: { shield: { who: 'ally', pct: .22, turns: 3, of: 'self' }, ally: [['defUp', 3]] } },
      { id: 'tag', name: 'Gift Tag', fp: 7, unlock: 'badge', target: 'ally', kind: 'heal', desc: 'Heal one ally for 20% of their Max HP and hand them 5 FP.', fx: { heal: { pct: .2, mag: .5 }, fpAlly: 5 } },
      { id: 'box', name: 'In the Box', fp: 12, unlock: 'badge', target: 'self', kind: 'buff', desc: 'Hide in the gift box: Shield, Ward 30% and she counts as a Tank for 2 turns.', fx: { shield: { who: 'self', pct: .26, turns: 2 }, self: [['barrier', 2], ['ward', 2, 1, { v: .3 }]] } },
      { id: 'bow', name: 'Big Bow', fp: 16, unlock: 'badge', target: 'allies', kind: 'buff', desc: 'Tie the whole party together: Attack up and Regen (6% per turn) for 3 turns.', fx: { team: [['atkUp', 3], ['regen', 3, 1, { v: .06 }]] } }
    ],
    bond: { name: 'Open Your Presents', toonLine: 'Bobette smiles: “Open it.”', desc: 'Shield the party for 18% of Bobette’s Max HP and heal everyone 12%.', fx: { shield: { who: 'team', pct: .18, turns: 3, of: 'self' }, heal: { pct: .12 } } }
  },

  Bassie: {
    kind: 'toon', name: 'Bassie', full: 'Bassie', toon: 'Bassie', role: 'Courier', color: '#ffb6d9', accent: '#c25a92',
    blurb: 'Easter floor. She is always dropping something, and what she drops usually turns out to be what someone needed.',
    basicName: 'Basket Swing', basicKind: 'phys', improvised: 'Basket Swing',
    base: { hp: 104, fp: 26, atk: 11.5, mag: 8, def: 9.5, mdef: 9.5, spd: 13.4, luck: 10 },
    grow: { hp: 11.2, fp: 1.7, atk: 1.25, mag: .8, def: 1, mdef: 1, spd: .22, luck: .3 },
    passive: { name: 'Dropped Something', desc: 'Every third turn Bassie drops an item: the party member with the lowest HP heals 10%.' },
    skills: [
      { id: 'basket', name: 'Basket Toss', fp: 6, unlock: 'badge', target: 'enemy', kind: 'phys', stagger: 1.4, desc: 'Fling the basket. Slows the target for 2 turns.', fx: { dmg: 'phys', power: 1.15, foe: [['slow', 2]] } },
      { id: 'eggs', name: 'Egg Barrage', fp: 11, unlock: 'badge', target: 'enemies', kind: 'phys', stagger: .8, desc: 'Four eggs at random enemies.', fx: { dmg: 'phys', random: true, hits: 4, power: .55 } },
      { id: 'drop', name: 'Special Delivery', fp: 9, unlock: 'badge', target: 'ally', kind: 'heal', desc: 'Drop what an ally needs: heal 18% of their Max HP and 6 FP.', fx: { heal: { pct: .18, mag: .5 }, fpAlly: 6 } },
      { id: 'hop', name: 'Hop Away', fp: 8, unlock: 'badge', target: 'self', kind: 'buff', desc: 'Dodge up and Haste for 2 turns.', fx: { self: [['dodge', 3], ['haste', 2]] } }
    ],
    bond: { name: 'Egg Hunt', toonLine: 'Bassie scatters every egg she owns!', desc: 'Six eggs at random enemies, then the party heals 10% and gains 6 FP.', stagger: 1.2, fx: { dmg: 'phys', random: true, hits: 6, power: .6, heal: { pct: .1 }, fpTeam: 6, fpTeamSelf: true } }
  },

  Gourdy: {
    kind: 'toon', name: 'Gourdy', full: 'Gourdy', toon: 'Gourdy', role: 'Guardian', color: '#ffb347', accent: '#b8681a',
    blurb: 'Halloween floor. A pumpkin who worries about everyone and still steps in front of them. Toodles is his closest friend.',
    basicName: 'Pumpkin Bump', basicKind: 'phys', improvised: 'Pumpkin Bump',
    base: { hp: 138, fp: 22, atk: 10.5, mag: 7, def: 13.5, mdef: 11, spd: 9.8, luck: 6 },
    grow: { hp: 15.5, fp: 1.4, atk: 1.2, mag: .7, def: 1.5, mdef: 1.2, spd: .15, luck: .2 },
    passive: { name: 'Soft Heart', desc: 'Counts as a Tank. At the start of a fight the weakest ally gets a Shield worth 12% of Gourdy’s Max HP.' },
    skills: [
      { id: 'patch', name: 'Pumpkin Patch', fp: 8, unlock: 'badge', target: 'self', kind: 'buff', desc: 'Plant himself: Taunts every enemy for 2 turns and raises his Defense.', fx: { taunt: 2, self: [['defUp', 3]] } },
      { id: 'smash', name: 'Pumpkin Smash', fp: 7, unlock: 'badge', target: 'enemy', kind: 'phys', stagger: 2.6, desc: 'A heavy bump. Big Stagger damage.', fx: { dmg: 'phys', power: 1.4 } },
      { id: 'seeds', name: 'Seed Spit', fp: 9, unlock: 'badge', target: 'enemies', kind: 'mag', stagger: .8, desc: 'Spit seeds at everyone. Slows them down.', fx: { dmg: 'mag', all: true, power: .55, foe: [['slow', 2, .6]] } },
      { id: 'liege', name: 'Stay Behind Me', fp: 12, unlock: 'badge', target: 'ally', kind: 'buff', desc: 'A Shield worth 26% of Gourdy’s Max HP and Ward 25% on one ally.', fx: { shield: { who: 'ally', pct: .26, turns: 3, of: 'self' }, ally: [['ward', 3, 1, { v: .25 }]] } }
    ],
    bond: { name: 'Don’t Be Scared', toonLine: 'Gourdy: “I’ve got you.”', desc: 'Taunt every enemy for 2 turns, Shield the party for 16% of Gourdy’s Max HP and cleanse every ailment.', fx: { taunt: 2, shield: { who: 'team', pct: .16, turns: 3, of: 'self' }, cleanse: 'team' } }
  },

  Toodles: {
    kind: 'toon', name: 'Toodles', full: 'Toodles', toon: 'Toodles', role: 'Trickster', color: '#ffcf6b', accent: '#b8842a',
    blurb: 'Never sits still, never has good luck, and has never let either of those get him down. Gourdy’s best friend.',
    basicName: 'Bounce', basicKind: 'phys', improvised: 'Bounce',
    base: { hp: 100, fp: 28, atk: 12, mag: 9, def: 9, mdef: 9, spd: 13.8, luck: 6 },
    grow: { hp: 10.8, fp: 1.8, atk: 1.35, mag: .9, def: .95, mdef: .95, spd: .23, luck: .1 },
    passive: { name: 'Bad Luck, Good Friend', desc: 'When an ally goes down, Toodles gets Attack up for 3 turns. Takes 15% less damage while a Guardian stands.' },
    skills: [
      { id: 'gamble', name: 'Lucky Toss', fp: 7, unlock: 'badge', target: 'enemy', kind: 'phys', stagger: 1.6, desc: 'A coin toss. 50% a big hit, 50% a weak one.', fx: { dmg: 'phys', power: 1.1 } },
      { id: 'balls', name: 'Bouncy Balls', fp: 11, unlock: 'badge', target: 'enemies', kind: 'phys', stagger: .8, desc: 'Bounce a handful of balls off every enemy.', fx: { dmg: 'phys', all: true, power: .6 } },
      { id: 'cheer', name: 'Good Morning!', fp: 9, unlock: 'badge', target: 'ally', kind: 'buff', desc: 'Cheer an ally on: Attack up for 3 turns and 4 FP.', fx: { ally: [['atkUp', 3]], fpAlly: 4 } },
      { id: 'jinx', name: 'Jinx', fp: 10, unlock: 'badge', target: 'enemy', kind: 'debuff', stagger: .8, desc: 'Cursed luck: Defense and Attack down for 3 turns.', fx: { dmg: 'phys', power: .7, foe: [['defDown', 3], ['atkDown', 3]] } }
    ],
    bond: { name: 'Jackpot', toonLine: 'Toodles: “This is it, this is the one!”', desc: 'Hit every enemy hard, heal the party for 12% and give everyone Attack up.', stagger: 1.4, fx: { dmg: 'phys', all: true, power: 1.1, heal: { pct: .12 }, team: [['atkUp', 3]] } }
  },
  Eclipse: {
    kind: 'toon', name: 'Eclipse', full: 'Eclipse', toon: 'Eclipse', role: 'Tracker', color: '#c9c2ff', accent: '#6c63c9',
    blurb: 'Halloween floor. A wolf who treats everyone as part of the pack and can smell trouble on a staircase from two floors away.',
    basicName: 'Snap', basicKind: 'phys', improvised: 'Snap',
    base: { hp: 112, fp: 26, atk: 12.5, mag: 8, def: 10, mdef: 9.5, spd: 13.6, luck: 9 },
    grow: { hp: 12.4, fp: 1.7, atk: 1.4, mag: .8, def: 1.1, mdef: 1, spd: .22, luck: .26 },
    passive: { name: 'Keen Nose', desc: 'Hits Marked enemies 15% harder. When an enemy starts charging a lethal strike, the whole party gets Ward 20% for a turn: Eclipse smelled it coming.' },
    skills: [
      { id: 'scent', name: 'Follow the Scent', fp: 7, unlock: 'badge', target: 'enemy', kind: 'phys', stagger: 1.4, desc: 'A quick bite that Marks the target for 3 turns.', fx: { dmg: 'phys', power: 1.1, foe: [['mark', 3]] } },
      { id: 'pounce', name: 'Moonlit Pounce', fp: 11, unlock: 'badge', target: 'enemy', kind: 'phys', stagger: 2.4, desc: 'A leaping strike. 40% stronger against a Marked enemy.', fx: { dmg: 'phys', power: 1.6, bonus: { has: 'mark', mult: 1.4 } } },
      { id: 'howl', name: 'Pack Howl', fp: 12, unlock: 'badge', target: 'allies', kind: 'buff', desc: 'Everyone gets Attack up for 3 turns and 3 FP.', fx: { team: [['atkUp', 3]], fpTeam: 3, fpTeamSelf: true } },
      { id: 'circle', name: 'Circle the Pack', fp: 10, unlock: 'badge', target: 'self', kind: 'buff', desc: 'Dodge up and Haste for 2 turns, and a Shield worth 14% of his Max HP.', fx: { shield: { who: 'self', pct: .14, turns: 3 }, self: [['dodge', 3], ['haste', 2]] } }
    ],
    bond: { name: 'Full Moon', toonLine: 'Eclipse throws his head back and howls.', desc: 'Hit every enemy and Mark them, then give the party Attack up and Haste for 3 turns.', stagger: 1.4, fx: { dmg: 'phys', all: true, power: .95, foe: [['mark', 3]], team: [['atkUp', 3], ['haste', 2]] } }
  },

  Cocoa: {
    kind: 'toon', name: 'Cocoa', full: 'Cocoa', toon: 'Cocoa', role: 'Warmer', color: '#c98a5a', accent: '#7a4a28',
    blurb: 'Christmas floor. A cup of hot chocolate who looks after people. She was rescued from the Reserve and is not sure which Cocoa she is.',
    basicName: 'Sugar Cube', basicKind: 'mag', improvised: 'Sugar Cube',
    base: { hp: 102, fp: 32, atk: 7, mag: 14, def: 9.5, mdef: 12, spd: 11.6, luck: 8 },
    grow: { hp: 11.2, fp: 2.1, atk: .7, mag: 1.6, def: 1.05, mdef: 1.35, spd: .18, luck: .24 },
    passive: { name: 'Warm Up', desc: 'On her first turn in a fight, the party gets Regen (4% per turn) for 3 turns.' },
    skills: [
      { id: 'cocoa', name: 'Hot Cocoa', fp: 8, unlock: 'badge', target: 'ally', kind: 'heal', desc: 'Heal one ally for 24% of their Max HP and give them Regen for 3 turns.', fx: { heal: { pct: .24, mag: .6 }, ally: [['regen', 3, 1, { v: .05 }]] } },
      { id: 'spill', name: 'Scalding Spill', fp: 8, unlock: 'badge', target: 'enemy', kind: 'mag', stagger: 1.3, desc: 'Hot chocolate everywhere. Magic damage and Ichor-soaks the target.', fx: { dmg: 'mag', power: 1.2, foe: [['ink', 3]] } },
      { id: 'marsh', name: 'Marshmallow', fp: 9, unlock: 'badge', target: 'ally', kind: 'buff', desc: 'A soft Shield worth 24% of Cocoa’s Max HP and Magic Defense up on one ally.', fx: { shield: { who: 'ally', pct: .24, turns: 3, of: 'self' }, ally: [['defUp', 3]] } },
      { id: 'bonbon', name: 'Bonbon Barrage', fp: 12, unlock: 'badge', target: 'enemies', kind: 'mag', stagger: .8, desc: 'Four bonbons at random enemies.', fx: { dmg: 'mag', random: true, hits: 4, power: .6 } }
    ],
    bond: { name: 'Cup of Comfort', toonLine: 'Cocoa: “Here. Take this one.”', desc: 'Heal everyone 28%, cleanse every ailment and give the party Regen for 3 turns.', fx: { heal: { pct: .28 }, cleanse: 'team', team: [['regen', 3, 1, { v: .05 }]] } }
  },
  Brusha: {
    kind: 'toon', name: 'Brusha', full: 'Brusha', toon: 'Brusha', role: 'Artist', color: '#ff9f6b', accent: '#b8561f',
    blurb: 'The Art Floor painter. Short-tempered, honest, and the first person in the building to say something was wrong.',
    basicName: 'Brush Flick', basicKind: 'mag', improvised: 'Brush Flick',
    base: { hp: 104, fp: 30, atk: 8, mag: 14, def: 9.5, mdef: 11.5, spd: 12.2, luck: 8 },
    grow: { hp: 11.4, fp: 2, atk: .8, mag: 1.6, def: 1.05, mdef: 1.3, spd: .19, luck: .24 },
    passive: { name: 'Eye for Detail', desc: 'Hits enemies with lowered Defense 20% harder. While Tisha stands beside her, both take 10% less damage and Brusha hits 10% harder.' },
    skills: [
      { id: 'splash', name: 'Paint Splash', fp: 7, unlock: 'badge', target: 'enemy', kind: 'mag', stagger: 1.2, desc: 'Fling paint. Magic damage that lowers Defense for 3 turns.', fx: { dmg: 'mag', power: 1.15, foe: [['defDown', 3]] } },
      { id: 'portrait', name: 'Portrait', fp: 9, unlock: 'badge', target: 'ally', kind: 'buff', desc: 'Paint an ally as they ought to be: a Shield worth 22% of Brusha’s Max HP and Ward 25%.', fx: { shield: { who: 'ally', pct: .22, turns: 3, of: 'self' }, ally: [['ward', 3, 1, { v: .25 }]] } },
      { id: 'erase', name: 'Paint Over', fp: 10, unlock: 'badge', target: 'enemy', kind: 'mag', stagger: 1.6, desc: 'Cover an enemy’s tricks: magic damage that strips its bonuses and cancels a charge.', fx: { dmg: 'mag', power: 1.1, interrupt: true, cleanseFoe: true } },
      { id: 'wall', name: 'Painted Wall', fp: 14, unlock: 'badge', target: 'allies', kind: 'buff', desc: 'Paint a wall across the front: the whole party counts as protected by a Tank for 2 turns.', fx: { team: [['barrier', 2]] } }
    ],
    bond: { name: 'Masterpiece', toonLine: 'Brusha: “Hold still. This one’s good.”', desc: 'Magic damage to every enemy that lowers their Defense, and a Shield for the party worth 14% of Brusha’s Max HP.', stagger: 1.4, fx: { dmg: 'mag', all: true, power: 1, foe: [['defDown', 3]], shield: { who: 'team', pct: .14, turns: 3, of: 'self' } } }
  },

  Soulvester: {
    kind: 'toon', name: 'Soulvester', full: 'Soulvester', toon: 'Soulvester', role: 'Guardian', color: '#b6c2d4', accent: '#5d6b82',
    blurb: 'Halloween floor. A suit of armour who has kept watch on the same stairs every night, and calls Gourdy “my liege.”',
    basicName: 'Steel Fist', basicKind: 'phys', improvised: 'Steel Fist',
    base: { hp: 152, fp: 22, atk: 12, mag: 6, def: 17, mdef: 12, spd: 9.4, luck: 6 },
    grow: { hp: 17, fp: 1.3, atk: 1.35, mag: .5, def: 1.8, mdef: 1.3, spd: .13, luck: .18 },
    passive: { name: 'Sworn Guard', desc: 'Counts as a Tank. While Soulvester and Gourdy both stand, Gourdy takes 15% less damage.' },
    skills: [
      { id: 'line', name: 'Hold the Line', fp: 8, unlock: 'badge', target: 'self', kind: 'buff', desc: 'Plant his feet: Taunts every enemy for 2 turns and raises his Defense.', fx: { taunt: 2, self: [['defUp', 3]] } },
      { id: 'blow', name: 'Armoured Blow', fp: 7, unlock: 'badge', target: 'enemy', kind: 'phys', stagger: 3, desc: 'A heavy strike that cancels a charge.', fx: { dmg: 'phys', power: 1.45, interrupt: true } },
      { id: 'oath', name: 'Knight’s Oath', fp: 11, unlock: 'badge', target: 'ally', kind: 'buff', desc: 'Swear to guard someone: a Shield worth 28% of Soulvester’s Max HP and Counter for 3 turns.', fx: { shield: { who: 'ally', pct: .28, turns: 3, of: 'self' }, ally: [['counter', 3]] } },
      { id: 'steel', name: 'Steel Resolve', fp: 14, unlock: 'badge', target: 'self', kind: 'buff', desc: 'A Shield worth 32% of his Max HP, Ward 30% and he heals 10%.', fx: { shield: { who: 'self', pct: .32, turns: 3 }, self: [['ward', 3, 1, { v: .3 }]], healSelf: .1 } }
    ],
    bond: { name: 'Last Watch', toonLine: 'Soulvester: “Nothing gets past me tonight.”', desc: 'Taunt every enemy for 3 turns and Shield the party for 18% of Soulvester’s Max HP.', fx: { taunt: 3, shield: { who: 'team', pct: .18, turns: 3, of: 'self' } } }
  }
});

/* Everyone playable in Chapter 3. Tisha only fights alongside Brusha. Dyle is busy; Goob, Connie, Brightney, Coal and Rudie are minor characters. */
const ST3_IDS = ['Veronica', 'Sam', 'Shannon', 'Austin', 'Devan', 'Pebble', 'Brusha', 'Tisha', 'Rodger', 'Vee', 'Shelly', 'Scraps', 'Sprout', 'Cosmo', 'Astro', 'Toodles',
  'Gourdy', 'Soulvester', 'Bobette', 'Bassie', 'Eclipse', 'Cocoa'];
/* Keys that count as a Tank for lethal strikes. */
const ST3_TANKS = new Set(['Devan', 'Pebble', 'Gourdy', 'Soulvester']);

/* ------------------------------------------------------------ ENEMIES */
Object.assign(ST_ENEMIES, {
  /* ---- the three new weaklings, plus a Chapter 3 Sponge ---- */
  inkIchordrop: { name: 'Ichordrop', art: 'w:Ichordrop', hp: 46, atk: 10, mag: 11, def: 6, mdef: 6, spd: 10.5, stagger: 6, exp: 1.4, split: 'inkDroplet',
    moves: [{ name: 'Drip', kind: 'mag', power: .8, ink: .45, w: 3 }, { name: 'Pool Party', kind: 'mag', power: .5, target: 'all', slow: .5, w: 1 }] },
  inkDroplet: { name: 'Ichordroplet', art: 'w:Ichordrop', hp: 20, atk: 7, mag: 8, def: 4, mdef: 4, spd: 12.5, stagger: 3, exp: .5, noSplit: true,
    moves: [{ name: 'Plink', kind: 'mag', power: .6, ink: .3, w: 1 }] },
  inkFlower: { name: 'Flower', art: 'w:Flower', hp: 54, atk: 6, mag: 11, def: 7, mdef: 8, spd: 9.5, stagger: 8, exp: 1.6,
    moves: [
      { name: 'Sway', kind: 'mag', power: .75, w: 3 },
      { name: 'Loves Me', kind: 'allyheal', power: .22, w: 2 },
      { name: 'Loves Me Not', kind: 'phys', power: 1, lethal: true, tele: 'The Flower plucks a petal. Then another. One left… “Loves me not.”', w: 2, cd: 4 }
    ] },
  inkPeeper: { name: 'Peeper', art: 'w:Peeper', hp: 42, atk: 6, mag: 12, def: 6, mdef: 8, spd: 11.5, stagger: 7, exp: 1.5,
    moves: [
      { name: 'Glare', kind: 'mag', power: .8, debuff: 'atkDown', w: 3 },
      { name: 'Stare', kind: 'mag', power: .5, silence: 1, w: 2 },
      { name: 'Blackout', kind: 'mag', power: .4, target: 'all', silence: .6, w: 1, cd: 4 }
    ] },
  inkHollow: { name: 'Hollow Sponge', art: 'w:Sponge', hp: 60, atk: 7, mag: 9, def: 9, mdef: 6, spd: 7.5, stagger: 8, exp: 1.5,
    moves: [{ name: 'Wring', kind: 'mag', power: .5, target: 'all', fpdrain: 6, w: 3 }, { name: 'Absorb', kind: 'heal', power: .22, w: 1, when: 'hurt' }, { name: 'Squelch', kind: 'phys', power: .9, w: 2 }] },

  /* ---- Camera 6B ---- */
  camera6B: { name: 'Camera 6B', art: 'w:Peeper', hp: 420, atk: 12, mag: 16, def: 13, mdef: 15, spd: 11.5, stagger: 34, exp: 12, boss: true,
    moves: [
      { name: 'Unblinking', kind: 'mag', power: 1.1, debuff: 'defDown', w: 3 },
      { name: 'Blackout', kind: 'mag', power: .45, target: 'all', silence: .8, w: 2, cd: 3 },
      { name: 'Playback', kind: 'summon', summon: 'inkPeeper', w: 1, cd: 4 },
      { name: 'Recording', kind: 'phys', power: 1.2, lethal: true, tele: 'Every monitor in the room swivels to one target. A red light comes on. REC.', w: 2, cd: 3 }
    ], phases: [{ at: .5, text: 'The screens split into forty windows. Forty identical Toons stare out of every one of them.', buff: 'atkUp', summon: ['inkPeeper', 'inkPeeper'] }] },

  /* ---- Egg Hunt ---- */
  hunterBassie: { name: 'Unit Three · Bassie', art: 't:Bassie', hp: 380, atk: 13, mag: 12, def: 11, mdef: 12, spd: 13.5, stagger: 30, exp: 11, boss: true,
    moves: [
      { name: 'Basket Swing', kind: 'phys', power: 1.25, w: 3 },
      { name: 'Egg Toss', kind: 'mag', power: .6, hits: 3, target: 'random', ink: .3, w: 2 },
      { name: 'Get Her', kind: 'phys', power: 1.3, lethal: true, tele: 'The note in her paw says one thing. “Get her. Get her. GET HER.”', w: 2, cd: 3 }
    ], phases: [{ at: .5, text: 'The handwriting on her paw is shaking. It is not her handwriting.', buff: 'haste', summon: ['inkFlower', 'inkFlower'] }] },
  twEggson: { name: 'Replica Eggson', art: 't:Eggson', hp: 190, atk: 12, mag: 9, def: 14, mdef: 11, spd: 8, stagger: 22, exp: 5,
    moves: [{ name: 'Cane Rap', kind: 'phys', power: 1.2, w: 3 }, { name: 'Hard Boiled', kind: 'selfbuff', buff: 'shield', w: 1, cd: 4 }] },

  /* ---- Sublevel Four ---- */
  clipboardDandy: { name: 'Clipboard Dandy', art: 't:Dandy', hp: 560, atk: 14, mag: 16, def: 15, mdef: 17, spd: 13, stagger: 42, exp: 20, boss: true,
    moves: [
      { name: 'Price Check', kind: 'mag', power: 1.3, debuff: 'defDown', w: 3 },
      { name: 'Petal Storm', kind: 'mag', power: .62, target: 'all', w: 3 },
      { name: 'Inventory', kind: 'summon', summon: 'repToodles', w: 1, cd: 4 },
      { name: 'Terminate Contract', kind: 'phys', power: 1.4, lethal: true, tele: 'He ticks a box on the clipboard. “Unit disposition: surplus.” He looks at the nearest Toon.', w: 2, cd: 3 }
    ], phases: [{ at: .5, text: 'The clipboard snaps in half. “...I had a list. Who was on the list?”', buff: 'atkUp', summon: ['inkIchordrop', 'inkIchordrop'] }] },

  /* ---- Halloween Hall: Gourdy's liege, copied ---- */
  repKnight: { name: 'Unit Two · Soulvester', art: 't:Soulvester', hp: 470, atk: 14, mag: 9, def: 18, mdef: 14, spd: 9, stagger: 40, exp: 14, boss: true,
    moves: [
      { name: 'Steel Fist', kind: 'phys', power: 1.35, w: 3 },
      { name: 'Hold the Line', kind: 'selfbuff', buff: 'shield', w: 1, cd: 4 },
      { name: 'Knight’s Verdict', kind: 'phys', power: 1.5, lethal: true, tele: 'The copy raises its fist and looks straight at one of you. It does not say anything. It does not have to.', w: 2, cd: 3 }
    ], phases: [{ at: .5, text: 'It stops swinging for a second. Gourdy says its name, and the copy flinches.', buff: 'defUp', summon: ['inkFlower', 'inkPeeper'] }] },

  /* ---- the blast door ---- */
  repPebble: { name: 'Unit Two · Pebble', art: 't:Pebble', hp: 440, atk: 14, mag: 8, def: 18, mdef: 12, spd: 10, stagger: 38, exp: 14, boss: true,
    moves: [
      { name: 'Rock Slide', kind: 'phys', power: 1.3, w: 3 },
      { name: 'Guard the Door', kind: 'selfbuff', buff: 'shield', w: 1, cd: 4 },
      { name: 'Bark', kind: 'mag', power: .55, target: 'all', debuff: 'atkDown', w: 2 },
      { name: 'Nobody Gets Through', kind: 'phys', power: 1.5, lethal: true, tele: 'The copy does not bark. It plants its feet in front of the door and stares straight at you. That is worse.', w: 2, cd: 3 }
    ], phases: [{ at: .5, text: 'From the other side of the door: three slow taps. The replica turns its head toward them. Just for a moment.', buff: 'defUp' }] },

  /* ---- the Return Queue ---- */
  repUnitFive: { name: 'Unit Five', art: 't:Looey', hp: 150, atk: 14, mag: 8, def: 12, mdef: 9, spd: 9.5, stagger: 18, exp: 4,
    moves: [{ name: 'Too-Tight Hug', kind: 'phys', power: 1.45, w: 3 }, { name: 'Count Off', kind: 'selfbuff', buff: 'defUp', w: 1 }] },

  /* ---- the Return Press ---- */
  returnPress: { name: 'The Return Press', art: 't:RnD', hp: 760, atk: 15, mag: 17, def: 16, mdef: 17, spd: 11, stagger: 52, exp: 30, boss: true,
    moves: [
      { name: 'Stamp', kind: 'phys', power: 1.4, w: 3 },
      { name: 'Reprint', kind: 'mag', power: .6, target: 'all', ink: .5, w: 3 },
      { name: 'Spare Parts', kind: 'summon', summon: 'inkIchordrop', w: 1, cd: 3 },
      { name: 'Memory Sync', kind: 'mag', power: .8, target: 'all', silence: .7, w: 2, cd: 4 },
      { name: 'Print Run', kind: 'mag', power: 1.1, target: 'all', lethal: true, tele: 'The Press winds up. Somewhere inside it, a counter reads 41. Then 42. Everyone in the room is already on the list.', w: 2, cd: 4 }
    ], phases: [
      { at: .6, text: 'Drawers open along the wall. Every one of them holds a Toon you know, sleeping, labelled, patient.', buff: 'atkUp', summon: ['inkPeeper', 'inkFlower'] },
      { at: .3, text: 'The Press stops pretending to be a machine. “Overwrite. Overwrite. Overwrite.”', buff: 'haste', summon: ['inkHollow', 'inkIchordrop'] }
    ] }
});


/* Moves an enemy picks up as the story goes on (`tier` is the fight's tier, 0 to 5). Chapter 3 gets meaner the further in you are. */
const ST3_EXTRA = {
  inkBall: [{ tier: 2, move: { name: 'Rebound', kind: 'phys', power: .5, hits: 3, w: 2 } }],
  inkBrick: [{ tier: 2, move: { name: 'Collapse', kind: 'phys', power: .7, target: 'all', w: 2, cd: 3 } }],
  inkHand: [{ tier: 2, move: { name: 'Pull Below', kind: 'phys', power: 1.1, slow: .8, w: 2 } }, { tier: 4, move: { name: 'Hold Down', kind: 'phys', power: .9, stun: .4, w: 2, cd: 3 } }],
  inkFlower: [{ tier: 2, move: { name: 'Pollen', kind: 'mag', power: .45, target: 'all', sleep: .35, w: 2 } }, { tier: 4, move: { name: 'Wilt', kind: 'mag', power: .55, target: 'all', debuff: 'atkDown', w: 2 } }],
  inkPeeper: [{ tier: 2, move: { name: 'Replay', kind: 'mag', power: .6, hits: 2, w: 2 } }, { tier: 4, move: { name: 'Feedback', kind: 'mag', power: .5, target: 'all', silence: .9, w: 2, cd: 3 } }],
  inkIchordrop: [{ tier: 2, move: { name: 'Spill', kind: 'mag', power: .55, target: 'all', ink: .6, w: 2 } }, { tier: 4, move: { name: 'Overflow', kind: 'summon', summon: 'inkDroplet', w: 1, cd: 3 } }],
  inkHollow: [{ tier: 2, move: { name: 'Drain', kind: 'mag', power: .7, fpdrain: 8, drain: .5, w: 2 } }, { tier: 4, move: { name: 'Wring Out', kind: 'mag', power: .6, target: 'all', fpdrain: 10, w: 2, cd: 3 } }],
  twEggson: [{ tier: 3, move: { name: 'Rotten Egg', kind: 'mag', power: .8, ink: .7, w: 2 } }],
  repUnitFive: [{ tier: 4, move: { name: 'Roll Call', kind: 'phys', power: .7, target: 'all', w: 2, cd: 3 } }],
  camera6B: [{ tier: 2, move: { name: 'Rewind', kind: 'mag', power: .7, target: 'all', slow: .7, w: 2, cd: 3 } }],
  hunterBassie: [{ tier: 1, move: { name: 'Chase', kind: 'phys', power: .7, hits: 3, w: 2 } }],
  repKnight: [{ tier: 3, move: { name: 'Shield Wall', kind: 'mag', power: .6, target: 'all', debuff: 'defDown', w: 2, cd: 3 } }],
  clipboardDandy: [{ tier: 4, move: { name: 'Audit', kind: 'mag', power: .8, target: 'all', debuff: 'defDown', w: 2, cd: 3 } }],
  returnPress: [{ tier: 5, move: { name: 'Overwrite', kind: 'mag', power: .9, target: 'all', silence: .8, ink: .6, w: 2, cd: 3 } }, { tier: 5, move: { name: 'Hard Reset', kind: 'phys', power: 1.5, lethal: true, tele: 'Every drawer in the room slides open at once. The Press picks a name and starts the count.', w: 1, cd: 4 } }]
};

if (typeof module !== 'undefined') module.exports = { ST3_IDS, ST3_TANKS, ST_CH3_START_LV };
