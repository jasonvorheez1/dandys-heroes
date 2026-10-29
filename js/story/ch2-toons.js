/* ch2-toons.js - Chapter 2 "Business as Usual": the playable Toons and the
   new Replica enemies. Same shape as the Handlers in story-engine.js, but the
   skills are data (`fx`) run by ch2-engine.js. Toons start at level 26, above
   the Chapter 1 finale. Skill `unlock` is 'badge' (known from the start) or a
   Chapter 2 scene id (learned once that scene has been seen). */
'use strict';

Object.assign(ST_ROLE_ICON, {
  Sweeper: '🧹', Investigator: '🔎', Researcher: '🦴', Conductor: '🚂', Shredder: '✂', Bruiser: '🥊', Ghost: '👻', Beacon: '💡', Sprinter: '🦌'
});

const ST_TOON_START_LV = 26;

Object.assign(ST_TOONS, {
  Tisha: {
    kind: 'toon', name: 'Tisha', full: 'Tisha', toon: 'Tisha', role: 'Sweeper', color: '#6fe3f0', accent: '#2b8fb0',
    blurb: 'A tissue box who has mopped up after every disaster in Gardenview and kept count of each one.',
    basicName: 'Duster Smack', basicKind: 'phys', improvised: 'Duster Smack',
    base: { hp: 112, fp: 24, atk: 13.5, mag: 7, def: 11, mdef: 9, spd: 12.8, luck: 7 },
    grow: { hp: 12.5, fp: 1.6, atk: 1.5, mag: .6, def: 1.2, mdef: 1.0, spd: .2, luck: .22 },
    passive: { name: 'Tidy Habits', desc: 'At the start of her turn Tisha wipes one ailment off the party and regains 2 FP. Deals 25% more to Ichor weaklings.' },
    skills: [
      { id: 'sweep', name: 'Spring Clean', fp: 8, unlock: 'badge', target: 'enemies', kind: 'phys', stagger: 1, desc: 'A sweeping duster blow to every enemy.', fx: { dmg: 'phys', all: true, power: .74 } },
      { id: 'scrub', name: 'Scrub Down', fp: 7, unlock: 'badge', target: 'ally', kind: 'buff', desc: 'Wash every ailment off one ally, restore 15% HP and raise their Defense for 3 turns.', fx: { cleanse: 'ally', heal: { pct: .15 }, ally: [['defUp', 3]] } },
      { id: 'mopup', name: 'Mop Up', fp: 12, unlock: 'c2s5', target: 'enemy', kind: 'phys', stagger: 2.6, desc: 'A heavy, grinding scrub. Big Stagger damage and lowers Defense for 3 turns.', fx: { dmg: 'phys', power: 1.65, foe: [['defDown', 3]] } },
      { id: 'spotless', name: 'Spotless', fp: 16, unlock: 'c2s10', target: 'allies', kind: 'heal', desc: 'The whole party is cleansed, shielded for 14% of Tisha’s Max HP and regains 4 FP.', fx: { cleanse: 'team', shield: { who: 'team', pct: .14, turns: 3 }, fpTeam: 4 } }
    ],
    bond: { name: 'Deep Clean', toonLine: 'Tisha rolls up her sleeves!', desc: 'Scrub every enemy, then heal the party for 25% and cleanse every ailment.',
      fx: { dmg: 'phys', all: true, power: 1.2, heal: { pct: .25 }, cleanse: 'team' }, stagger: 2 }
  },

  Rodger: {
    kind: 'toon', name: 'Rodger', full: 'Rodger', toon: 'Rodger', role: 'Investigator', color: '#8fa6ff', accent: '#4658c9',
    blurb: 'A magnifying glass who would rather be certain than quick. He does not guess. He observes.',
    basicName: 'Magnify', basicKind: 'mag', improvised: 'Magnify',
    base: { hp: 90, fp: 30, atk: 9, mag: 15.5, def: 8, mdef: 11, spd: 12.4, luck: 9 },
    grow: { hp: 9.6, fp: 2.0, atk: .9, mag: 1.75, def: .9, mdef: 1.2, spd: .21, luck: .25 },
    passive: { name: 'Observant Detective', desc: 'Rodger’s skills build Research on enemies. At 3 Research an enemy is Exposed: it takes 15% more damage and its next charged attack is interrupted.' },
    skills: [
      { id: 'notes', name: 'Field Notes', fp: 6, unlock: 'badge', target: 'enemy', kind: 'mag', stagger: 1.2, desc: 'A quick magic hit. +1 Research.', fx: { dmg: 'mag', power: .85, research: 1 } },
      { id: 'capsule', name: 'Research Capsule', fp: 9, unlock: 'badge', target: 'enemy', kind: 'mag', stagger: 1.4, desc: 'Magic hit that Stuns (40% +20% per Research). A fully researched target also loses its bonuses.', fx: { dmg: 'mag', power: .95, stunScale: [.4, .2] } },
      { id: 'casefile', name: 'Case File', fp: 12, unlock: 'c2s5', target: 'enemy', kind: 'debuff', desc: '+2 Research and Defense down for 3 turns.', fx: { research: 2, foe: [['defDown', 3]] } },
      { id: 'closed', name: 'Case Closed', fp: 18, unlock: 'c2s13', target: 'enemy', kind: 'mag', stagger: 3, desc: 'Huge magic hit. 60% stronger against an Exposed enemy.', fx: { dmg: 'mag', power: 1.8, bonus: { has: 'exposed', mult: 1.6 } } }
    ],
    bond: { name: 'Complete Research', toonLine: 'Rodger flips the case file shut!', desc: 'Magic damage to every enemy and every enemy gains 3 Research.', stagger: 1.4, fx: { dmg: 'mag', all: true, power: 1.0, research: 3 } }
  },

  Shelly: {
    kind: 'toon', name: 'Shelly', full: 'Shelly', toon: 'Shelly', role: 'Researcher', color: '#ffc857', accent: '#b07a1a',
    blurb: 'A fossil-hunting dinosaur whose curiosity has never once been talked out of anything.',
    basicName: 'Fossil Pick', basicKind: 'phys', improvised: 'Fossil Pick',
    base: { hp: 98, fp: 32, atk: 10.5, mag: 12, def: 9, mdef: 10, spd: 13, luck: 9 },
    grow: { hp: 10.6, fp: 2.2, atk: 1.1, mag: 1.3, def: 1.0, mdef: 1.1, spd: .21, luck: .28 },
<<<<<<< HEAD
    passive: { name: 'Fossil Findings', desc: 'Allies’ skills deal 5% more damage while Shelly is on her feet (10% more against Marked, Researched or Exposed enemies).' },
    skills: [
      { id: 'core', name: 'Core Sample', fp: 6, unlock: 'badge', target: 'enemy', kind: 'phys', stagger: 1.8, desc: 'A drilling strike. Lowers Defense for 3 turns.', fx: { dmg: 'phys', power: 1.15, foe: [['defDown', 3]] } },
      { id: 'inspire', name: 'Inspiration', fp: 13, unlock: 'badge', target: 'allies', kind: 'buff', desc: 'The whole party gains Attack and Magic up for 3 turns.', fx: { team: [['atkUp', 3]] } },
      { id: 'solver', name: 'Problem Solver', fp: 11, unlock: 'c2s10', target: 'ally', kind: 'buff', desc: 'Shelly picks the fix an ally needs: healing and a shield when hurt, FP and Attack when tired, otherwise Defense and a Ward.', fx: { solver: true } },
      { id: 'passion', name: 'Paleontologist’s Passion', fp: 20, unlock: 'c2s14', target: 'allies', kind: 'buff', desc: 'Party Attack and Defense up for 3 turns, and everyone else regains 4 FP.', fx: { team: [['atkUp', 3], ['defUp', 3]], fpTeam: 4 } }
=======
    passive: { name: 'Fossil Findings', desc: 'Allies’ skills deal 10% more damage while Shelly is on her feet (20% more against Marked, Researched or Exposed enemies).' },
    skills: [
      { id: 'core', name: 'Core Sample', fp: 6, unlock: 'badge', target: 'enemy', kind: 'phys', stagger: 1.8, desc: 'A drilling strike. Lowers Defense for 3 turns.', fx: { dmg: 'phys', power: 1.15, foe: [['defDown', 3]] } },
      { id: 'inspire', name: 'Inspiration', fp: 10, unlock: 'badge', target: 'allies', kind: 'buff', desc: 'The whole party gains Attack and Magic up for 3 turns.', fx: { team: [['atkUp', 3]] } },
      { id: 'solver', name: 'Problem Solver', fp: 11, unlock: 'c2s10', target: 'ally', kind: 'buff', desc: 'Shelly picks the fix an ally needs: healing and a shield when hurt, FP and Attack when tired, otherwise Defense and a Ward.', fx: { solver: true } },
      { id: 'passion', name: 'Paleontologist’s Passion', fp: 18, unlock: 'c2s14', target: 'allies', kind: 'buff', desc: 'Party Attack and Defense up for 3 turns, and everyone else regains 6 FP.', fx: { team: [['atkUp', 3], ['defUp', 3]], fpTeam: 6 } }
>>>>>>> ccb31b9f96fec6e5b5e1509b31b66f6b3cb024e0
    ],
    bond: { name: 'Eureka!', toonLine: 'Shelly holds up the fossil!', desc: 'Magic damage to every enemy. The party gains Attack up and Haste for 3 turns and 10 FP.', stagger: 1.5, fx: { dmg: 'mag', all: true, power: .9, team: [['atkUp', 3], ['haste', 3]], fpTeam: 10, fpTeamSelf: true } }
  },

  Vee: {
    kind: 'toon', name: 'Vee', full: 'Vee', toon: 'Vee', role: 'Broadcaster', color: '#46d65a', accent: '#1f8a31',
    blurb: 'A television who treats every crisis as a broadcast, and every broadcast as an investigation.',
    basicName: 'Signal Beam', basicKind: 'mag', improvised: 'Signal Beam',
    base: { hp: 84, fp: 30, atk: 8, mag: 17, def: 7, mdef: 11, spd: 12.2, luck: 8 },
    grow: { hp: 9.0, fp: 2.1, atk: .8, mag: 2.0, def: .8, mdef: 1.2, spd: .2, luck: .25 },
    passive: { name: 'Spotlight On', desc: 'Vee puts the toughest enemy on camera as the Headline: it takes 20% more from her. Each hit on the Headline builds Ratings (+5% damage, up to 8).' },
    skills: [
      { id: 'beam', name: 'Focus Beam', fp: 6, unlock: 'badge', target: 'enemy', kind: 'mag', stagger: 1.4, desc: 'Magic hit that puts the enemy on camera: Marked for 3 turns (25% more damage).', fx: { dmg: 'mag', power: 1.25, foe: [['mark', 3]] } },
      { id: 'surge', name: 'Audience Surge', fp: 11, unlock: 'badge', target: 'enemies', kind: 'mag', stagger: .8, desc: 'The crowd roars. Magic damage to every enemy.', fx: { dmg: 'mag', all: true, power: .8 } },
      { id: 'static', name: 'Commercial Break', fp: 12, unlock: 'c2s6', target: 'enemy', kind: 'mag', stagger: 2, desc: 'Cut to static: 65% to Stun (a boss is knocked back instead) and cancels a charge.', fx: { dmg: 'mag', power: 1.0, foe: [['stun', 1, .65]], interrupt: true, push: .3 } },
      { id: 'live', name: 'Live Broadcast', fp: 18, unlock: 'c2s11', target: 'enemy', kind: 'mag', stagger: 3, desc: 'Huge magic hit; 50% stronger against a Marked enemy.', fx: { dmg: 'mag', power: 2.3, bonus: { has: 'mark', mult: 1.5 } } }
    ],
    bond: { name: 'Prime Time', toonLine: 'Vee goes live!', desc: 'Magic damage to every enemy and Mark them all for 3 turns.', stagger: 2, fx: { dmg: 'mag', all: true, power: 1.5, foe: [['mark', 3]] } }
  },

  Dyle: {
    kind: 'toon', name: 'Dyle', full: 'Dyle Timesly', toon: 'Dyle', role: 'Conductor', color: '#e8c36a', accent: '#8a6a1e',
    blurb: 'Gardenview’s train supervisor. Nothing is late on his watch, and nothing is early either.',
    basicName: 'Pocket Watch', basicKind: 'phys', improvised: 'Pocket Watch',
    base: { hp: 106, fp: 26, atk: 15, mag: 6, def: 10, mdef: 8, spd: 13.8, luck: 8 },
    grow: { hp: 11.8, fp: 1.8, atk: 1.65, mag: .6, def: 1.05, mdef: .9, spd: .23, luck: .24 },
    passive: { name: 'All Aboard', desc: 'His attacks have a 40% chance to place a Rail Marker (30% more damage from Dyle). He hits charging enemies 35% harder and regains 3 FP doing it.' },
    skills: [
      { id: 'gap', name: 'Mind the Gap', fp: 7, unlock: 'badge', target: 'enemy', kind: 'phys', stagger: 2.2, desc: 'Cancels a charge, knocks the target back and gives Dyle Haste for 2 turns.', fx: { dmg: 'phys', power: 1.25, interrupt: true, push: .25, self: [['haste', 2]] } },
      { id: 'allaboard', name: 'All Aboard!', fp: 11, unlock: 'badge', target: 'enemies', kind: 'phys', stagger: 1.2, desc: 'The train crosses the stage. Every enemy is hit and given a Rail Marker for 3 turns.', fx: { dmg: 'phys', all: true, power: .8, foe: [['rail', 3]], push: .12 } },
      { id: 'express', name: 'Express Service', fp: 14, unlock: 'c2s7', target: 'enemies', kind: 'phys', stagger: .9, desc: 'Two passes along the track. Enemies with a Rail Marker take 40% more.', fx: { dmg: 'phys', all: true, hits: 2, power: .62, bonus: { has: 'rail', mult: 1.4 } } },
      { id: 'lastTrain', name: 'Last Train', fp: 20, unlock: 'c2s14', target: 'enemy', kind: 'phys', stagger: 3.4, desc: 'A crushing finish. Double damage to a Rail-Marked enemy, which consumes the marker.', fx: { dmg: 'phys', power: 1.7, bonus: { has: 'rail', mult: 2, consume: true } } }
    ],
    bond: { name: 'Right on Time', toonLine: 'Dyle checks his watch.', desc: 'Two train passes through every enemy and the party gains Haste for 2 turns.', stagger: 2, fx: { dmg: 'phys', all: true, hits: 2, power: .95, team: [['haste', 2]] } }
  },

  Scraps: {
    kind: 'toon', name: 'Scraps', full: 'Scraps', toon: 'Scraps', role: 'Shredder', color: '#ffb36b', accent: '#d4607f',
    blurb: 'A paper-craft predator with a cup flail, a yarn ball and no concept of personal space.',
    basicName: 'Cardboard Claws', basicKind: 'phys', improvised: 'Cardboard Claws',
    base: { hp: 100, fp: 25, atk: 15.5, mag: 6, def: 8.5, mdef: 8, spd: 14.2, luck: 9 },
    grow: { hp: 11.2, fp: 1.8, atk: 1.7, mag: .6, def: .95, mdef: .9, spd: .24, luck: .26 },
    passive: { name: 'Crafty Grapple', desc: 'Every third strike is a Craft hit: +40% damage and Frays the target (Defense −7% per stack, up to 4). She hits Frayed enemies 5% harder per stack.' },
    skills: [
      { id: 'claws', name: 'Whatever Works', fp: 6, unlock: 'badge', target: 'enemy', kind: 'phys', stagger: 1.7, desc: 'Cardboard claws tear in. Frays the target.', fx: { dmg: 'phys', power: 1.35, foe: [['fray', 3]] } },
      { id: 'yarn', name: 'Yarn Ball', fp: 8, unlock: 'badge', target: 'enemy', kind: 'phys', stagger: 1.2, desc: 'A ricocheting snare. Slows the target for 2 turns and Frays it.', fx: { dmg: 'phys', power: .95, foe: [['slow', 2], ['fray', 3]] } },
      { id: 'crash', name: 'Craft Class Crash', fp: 14, unlock: 'c2s5', target: 'enemies', kind: 'phys', stagger: .8, desc: 'A hurricane of cut paper: three strikes on every enemy, each Fraying them.', fx: { dmg: 'phys', all: true, hits: 3, power: .46, foe: [['fray', 3]] } },
      { id: 'grapple', name: 'Grapple Strike', fp: 13, unlock: 'c2s9', target: 'enemy', kind: 'phys', stagger: 3, desc: 'Scraps launches herself at the foe and is untargetable for a turn. Big damage.', fx: { dmg: 'phys', power: 2.1, self: [['veil', 1]] } }
    ],
    bond: { name: 'Every Piece Counts', toonLine: 'Scraps tears the room to ribbons!', desc: 'Two shredding passes through every enemy that Fray them, and Scraps regains 10 FP.', stagger: 2.2, fx: { dmg: 'phys', all: true, hits: 2, power: .9, foe: [['fray', 3]], healSelf: .1 } }
  },

  Goob: {
    kind: 'toon', name: 'Goob', full: 'Goob', toon: 'Goob', role: 'Bruiser', color: '#9be15d', accent: '#4c9a2a',
    blurb: 'Gardenview’s biggest cheerleader. He did not know he was strong. He only knew he was happy.',
    basicName: 'Bear Hug', basicKind: 'phys', improvised: 'Bear Hug',
    base: { hp: 134, fp: 22, atk: 13, mag: 5, def: 12.5, mdef: 9, spd: 10.2, luck: 6 },
    grow: { hp: 15, fp: 1.4, atk: 1.45, mag: .5, def: 1.45, mdef: 1.05, spd: .15, luck: .2 },
    passive: { name: 'Big Heart', desc: 'Goob takes 15% less damage and fills his Bond faster when hurt. The first time he drops under 30% HP he cheers himself up: Defense up and Regen.' },
    skills: [
      { id: 'bighug', name: 'Too-Tight Hug', fp: 7, unlock: 'badge', target: 'enemy', kind: 'phys', stagger: 3, desc: 'A hug nobody asked for. Big Stagger damage and a 50% chance to Stun.', fx: { dmg: 'phys', power: 1.5, foe: [['stun', 1, .5]] } },
      { id: 'cheer', name: 'Cheer Up!', fp: 9, unlock: 'badge', target: 'allies', kind: 'buff', desc: 'The whole party gains Regen (6% per turn) for 3 turns.', fx: { team: [['regen', 3, 1, { v: .06 }]] } },
      { id: 'groupHug', name: 'Group Hug', fp: 13, unlock: 'c2s4', target: 'allies', kind: 'buff', desc: 'Shield the party for 12% of Goob’s Max HP and Taunt every enemy for 2 turns.', fx: { shield: { who: 'team', pct: .12, turns: 3 }, taunt: 2 } },
      { id: 'bounce', name: 'Bounce Back', fp: 10, unlock: 'c2s9', target: 'self', kind: 'heal', desc: 'Goob heals 30% of his Max HP and raises his Defense for 3 turns.', fx: { healSelf: .3, self: [['defUp', 3]] } }
    ],
    bond: { name: 'Hug It Out', toonLine: 'Goob opens his arms wide!', desc: 'Taunt every enemy for 3 turns, shield the party for 20% of Goob’s Max HP and counter every hit he takes for 3 turns.', fx: { taunt: 3, shield: { who: 'team', pct: .2, turns: 3 }, self: [['counter', 3]] } }
  },

  Connie: {
    kind: 'toon', name: 'Connie', full: 'Connie', toon: 'Connie', role: 'Ghost', color: '#c9a8ff', accent: '#6a4bb0',
    blurb: 'A ghost who treats every hallway as a stage for pranks, and every escape as a victory lap.',
    basicName: 'Boo!', basicKind: 'mag', improvised: 'Boo!',
    base: { hp: 90, fp: 30, atk: 8, mag: 13.5, def: 7.5, mdef: 12.5, spd: 13.4, luck: 11 },
    grow: { hp: 9.4, fp: 2.1, atk: .8, mag: 1.55, def: .85, mdef: 1.3, spd: .22, luck: .3 },
    passive: { name: 'Haunting Escape', desc: 'Connie dodges 20% of attacks (regaining 2 FP when she does) and enemies pick her half as often.' },
    skills: [
      { id: 'prank', name: 'Phantom Prank', fp: 6, unlock: 'badge', target: 'enemy', kind: 'mag', stagger: 1.2, desc: 'Magic hit from behind. The target is Haunted for 3 turns: Connie hits it 25% harder.', fx: { dmg: 'mag', power: 1.15, foe: [['haunt', 3]] } },
      { id: 'drift', name: 'Spectral Drift', fp: 9, unlock: 'badge', target: 'allies', kind: 'buff', desc: 'The whole party slips half-way into the spirit world: 30% dodge for 3 turns.', fx: { team: [['dodge', 3]] } },
      { id: 'escape', name: 'Fade Out', fp: 8, unlock: 'c2s4', target: 'self', kind: 'buff', desc: 'Connie cannot be singled out for 2 turns, cleanses herself and rattles every enemy (Attack down).', fx: { self: [['veil', 2]], cleanse: 'self', foe: [['atkDown', 3]], all: true } },
      { id: 'presence', name: 'Ghostly Presence', fp: 13, unlock: 'c2s9', target: 'enemies', kind: 'mag', stagger: .9, desc: 'Spooky magic damage to every enemy that also lowers their Attack for 3 turns.', fx: { dmg: 'mag', all: true, power: .62, foe: [['atkDown', 3]] } }
    ],
    bond: { name: 'Beyond the Veil', toonLine: 'Connie vanishes into the Veil!', desc: 'The party can’t be singled out for 1 turn and gains 30% dodge for 3 turns. Every enemy is Haunted.', fx: { team: [['veil', 1], ['dodge', 3]], foe: [['haunt', 3]], all: true } }
  },

  Brightney: {
    kind: 'toon', name: 'Brightney', full: 'Brightney', toon: 'Brightney', role: 'Beacon', color: '#ffe36d', accent: '#c9a227',
    blurb: 'A desk lamp who has never once been afraid of the dark. She just turns on.',
    basicName: 'Bulb Bonk', basicKind: 'mag', improvised: 'Bulb Bonk',
    base: { hp: 118, fp: 28, atk: 8, mag: 13, def: 12, mdef: 11.5, spd: 11, luck: 7 },
    grow: { hp: 13.4, fp: 1.9, atk: .8, mag: 1.45, def: 1.3, mdef: 1.25, spd: .17, luck: .22 },
    passive: { name: 'Safety Light', desc: 'The party takes 15% less damage from attacks that hit everyone, and enemies pick Brightney more often.' },
    skills: [
      { id: 'flash', name: 'Blinding Flash', fp: 9, unlock: 'badge', target: 'enemies', kind: 'mag', stagger: .8, desc: 'Magic damage to every enemy. Taunts them for 2 turns and lowers their Attack for 3.', fx: { dmg: 'mag', all: true, power: .6, foe: [['atkDown', 3]], taunt: 2 } },
      { id: 'guard', name: 'Lampshade Guard', fp: 8, unlock: 'badge', target: 'self', kind: 'buff', desc: 'A Shield worth 24% of her Max HP and Defense up for 3 turns.', fx: { shield: { who: 'self', pct: .24, turns: 3 }, self: [['defUp', 3]] } },
      { id: 'beam', name: 'Focused Beam', fp: 8, unlock: 'c2s9', target: 'enemy', kind: 'mag', stagger: 1.8, desc: 'A hard beam on one enemy. Lowers its Defense for 3 turns.', fx: { dmg: 'mag', power: 1.3, foe: [['defDown', 3]] } },
      { id: 'bulb', name: 'Overcharged Bulb', fp: 15, unlock: 'c2s14', target: 'allies', kind: 'buff', desc: 'Cleanse the whole party, give them Haste for 2 turns and 5 FP.', fx: { cleanse: 'team', team: [['haste', 2]], fpTeam: 5, fpTeamSelf: true } }
    ],
    bond: { name: 'Full Brightness', toonLine: 'Brightney turns it all the way up!', desc: 'Magic damage to every enemy, lowering their Attack, and a Shield for the party worth 16% of Brightney’s Max HP.', stagger: 1.6, fx: { dmg: 'mag', all: true, power: 1.1, foe: [['atkDown', 3]], shield: { who: 'team', pct: .16, turns: 3 } } }
  },

  Sprout: {
    kind: 'toon', name: 'Sprout', full: 'Sprout', toon: 'Sprout', role: 'Baker', color: '#ff9f6b', accent: '#b3522a',
    blurb: 'Gardenview’s baker. If someone is hurt, Sprout has already put the kettle on.',
    basicName: 'Tossed Sweets', basicKind: 'mag', improvised: 'Tossed Sweets',
    base: { hp: 94, fp: 34, atk: 7, mag: 13, def: 8.5, mdef: 12, spd: 12.5, luck: 7 },
    grow: { hp: 10.4, fp: 2.4, atk: .7, mag: 1.45, def: .9, mdef: 1.3, spd: .2, luck: .2 },
<<<<<<< HEAD
    passive: { name: 'Overprotective', desc: 'The first time each ally drops under 30% HP in a battle, Sprout instantly tosses them a treat (10% Max HP).' },
=======
    passive: { name: 'Overprotective', desc: 'The first time each ally drops under 30% HP in a battle, Sprout instantly tosses them a treat (15% Max HP).' },
>>>>>>> ccb31b9f96fec6e5b5e1509b31b66f6b3cb024e0
    skills: [
      { id: 'sweets', name: 'Baked Sweets', fp: 6, unlock: 'badge', target: 'ally', kind: 'heal', desc: 'Heal one ally for 30% of their Max HP plus Sprout’s Magic.', fx: { heal: { pct: .3, mag: 1.6 } } },
      { id: 'stayclose', name: 'Stay Close', fp: 8, unlock: 'badge', target: 'ally', kind: 'buff', desc: 'Regen (9% Max HP per turn) and Defense up on one ally for 3 turns.', fx: { ally: [['regen', 3, 1, { v: .09 }], ['defUp', 3]] } },
      { id: 'oven', name: 'Fresh Out of the Oven', fp: 15, unlock: 'c2s8', target: 'allies', kind: 'heal', desc: 'Heal the whole party for 22% Max HP and wash off Ichor.', fx: { heal: { pct: .22, mag: .6 }, cleanse: 'team' } },
<<<<<<< HEAD
      { id: 'batch', name: 'Second Batch', fp: 26, unlock: 'c2s12', target: 'ko', kind: 'heal', once: true, desc: 'Bring a fallen ally back with 30% HP. Once per battle.', fx: { revive: .3 } }
    ],
    bond: { name: 'Bake Sale', toonLine: 'Sprout opens the bakery!', desc: 'Heal everyone 40%, revive the fallen at 20% and cleanse all ailments.', fx: { revive: .2, heal: { pct: .4 }, cleanse: 'team' } }
=======
      { id: 'batch', name: 'Second Batch', fp: 20, unlock: 'c2s12', target: 'ko', kind: 'heal', desc: 'Bring a fallen ally back with 40% HP.', fx: { revive: .4 } }
    ],
    bond: { name: 'Bake Sale', toonLine: 'Sprout opens the bakery!', desc: 'Heal everyone 55%, revive the fallen at 30% and cleanse all ailments.', fx: { revive: .3, heal: { pct: .55 }, cleanse: 'team' } }
>>>>>>> ccb31b9f96fec6e5b5e1509b31b66f6b3cb024e0
  },

  Cosmo: {
    kind: 'toon', name: 'Cosmo', full: 'Cosmo', toon: 'Cosmo', role: 'Baker', color: '#ffd6a5', accent: '#c9894e',
    blurb: 'Sprout’s kitchen partner, who bakes an extra one in case someone needs it.',
    basicName: 'Sugar Toss', basicKind: 'mag', improvised: 'Sugar Toss',
    base: { hp: 104, fp: 30, atk: 7, mag: 12, def: 9, mdef: 12.5, spd: 12, luck: 7 },
    grow: { hp: 11.4, fp: 2.1, atk: .7, mag: 1.3, def: 1.0, mdef: 1.3, spd: .19, luck: .2 },
    passive: { name: 'Sharing is Caring', desc: 'Cosmo’s heals also give the ally a 15% Ward for 2 turns. Cosmo cannot be healed by his own skills.' },
    skills: [
      { id: 'share', name: 'Sharing is Caring', fp: 6, unlock: 'badge', target: 'ally', kind: 'heal', desc: 'Give 12% of Cosmo’s own HP to the chosen ally for a big heal (extra under 40% HP). Cleanses them.', fx: { selfCost: .12, heal: { pct: .3, mag: 1.4, lowBonus: true }, cleanse: 'ally', ally: [['ward', 2, 1, { v: .15 }]] } },
      { id: 'treats', name: 'Fresh Baked Treats', fp: 8, unlock: 'badge', target: 'ally', kind: 'heal', desc: 'Regen (8% per turn) for 3 turns and a Ward on one ally.', fx: { ally: [['regen', 3, 1, { v: .08 }], ['ward', 2, 1, { v: .15 }]] } },
      { id: 'comfort', name: 'Comforting Presence', fp: 13, unlock: 'c2s8', target: 'allies', kind: 'buff', desc: 'Everyone takes 20% less damage for 3 turns and heals 10%.', fx: { team: [['ward', 3, 1, { v: .2 }]], heal: { pct: .1 } } },
      { id: 'gift', name: 'The Sweetest Gift', fp: 18, unlock: 'c2s13', target: 'allies', kind: 'heal', desc: 'Heal the party for 24% and Shield everyone for 10% of Cosmo’s Max HP.', fx: { heal: { pct: .24, mag: .5 }, shield: { who: 'team', pct: .1, turns: 3 } } }
    ],
    bond: { name: 'A Recipe for Care', toonLine: 'Cosmo opens the oven!', desc: 'Heal everyone 45%, Ward the party for 3 turns and cleanse.', fx: { heal: { pct: .45 }, team: [['ward', 3, 1, { v: .2 }]], cleanse: 'team' } }
  },

  Astro: {
    kind: 'toon', name: 'Astro', full: 'Astro', toon: 'Astro', role: 'Dreamkeeper', color: '#6f8cff', accent: '#3b4fb8',
    blurb: 'A sleepy star who remembers more of the lost week than he wants to.',
    basicName: 'Drowsy Spark', basicKind: 'mag', improvised: 'Drowsy Spark',
    base: { hp: 95, fp: 32, atk: 7, mag: 13.5, def: 8.5, mdef: 13, spd: 12.1, luck: 8 },
    grow: { hp: 10.4, fp: 2.2, atk: .7, mag: 1.6, def: .9, mdef: 1.4, spd: .2, luck: .22 },
    passive: { name: 'Well Rested', desc: 'Every ally regains 2 FP at the start of their turn while Astro is awake.' },
    skills: [
      { id: 'pulse', name: 'Dream Pulse', fp: 6, unlock: 'badge', target: 'enemy', kind: 'mag', stagger: 1.2, desc: 'Magic hit. The ally lowest on FP regains 5 FP.', fx: { dmg: 'mag', power: 1.15, fpLowest: 5 } },
      { id: 'slumber', name: 'Peaceful Slumber', fp: 10, unlock: 'badge', target: 'enemy', kind: 'debuff', desc: '85% chance to Sleep an enemy for 2 turns (damage wakes it). Bosses are Slowed instead.', fx: { foe: [['sleep', 2, .85]] } },
      { id: 'stars', name: 'Falling Stars', fp: 14, unlock: 'c2s12', target: 'enemies', kind: 'mag', stagger: .7, desc: 'Four falling stars strike random enemies.', fx: { dmg: 'mag', random: true, hits: 4, power: .55 } },
      { id: 'lullaby', name: 'Lullaby', fp: 17, unlock: 'c2s16', target: 'allies', kind: 'heal', desc: 'Heal the party for 18% and cleanse them. Every enemy is Slowed for 2 turns.', fx: { heal: { pct: .18, mag: .5 }, cleanse: 'team', foe: [['slow', 2]], all: true } }
    ],
    bond: { name: 'Endless Night', toonLine: 'Astro hums a lullaby…', desc: 'Every enemy falls asleep for 1 turn (bosses are Slowed), the party heals 25% and regains 10 FP.', fx: { foe: [['sleep', 1]], all: true, heal: { pct: .25 }, fpTeam: 10, fpTeamSelf: true } }
  },

  Rudie: {
    kind: 'toon', name: 'Rudie', full: 'Rudie', toon: 'Rudie', role: 'Sprinter', color: '#e5533d', accent: '#8f2519',
    blurb: 'A reindeer who has been waiting all year to be fast again.',
    basicName: 'Hoof Kick', basicKind: 'phys', improvised: 'Hoof Kick',
    base: { hp: 98, fp: 24, atk: 15, mag: 5, def: 8, mdef: 8, spd: 16, luck: 10 },
    grow: { hp: 10.8, fp: 1.6, atk: 1.65, mag: .5, def: .9, mdef: .85, spd: .28, luck: .3 },
    passive: { name: 'Momentum', desc: 'Every hit Rudie lands builds Momentum: +6% damage per stack, up to 6.' },
    skills: [
      { id: 'barrage', name: 'Hoofstep Barrage', fp: 7, unlock: 'badge', target: 'enemy', kind: 'phys', stagger: .9, desc: 'Three rapid kicks on one enemy.', fx: { dmg: 'phys', hits: 3, power: .56 } },
      { id: 'redNose', name: 'Red Nose Rush', fp: 8, unlock: 'badge', target: 'self', kind: 'buff', desc: 'Haste and Attack up for 3 turns.', fx: { self: [['haste', 3], ['atkUp', 3]] } },
      { id: 'rush', name: 'Antler Rush', fp: 12, unlock: 'badge', target: 'enemies', kind: 'phys', stagger: 1.3, desc: 'Charge through every enemy, knocking them back on the timeline.', fx: { dmg: 'phys', all: true, power: .85, push: .15 } },
      { id: 'run', name: 'Born to Run', fp: 15, unlock: 'c2s16', target: 'enemy', kind: 'phys', stagger: 2.8, desc: 'A full-speed finishing charge. 50% stronger against a Slowed enemy.', fx: { dmg: 'phys', power: 1.9, bonus: { has: 'slow', mult: 1.5 } } }
    ],
    bond: { name: 'Sleigh Charge', toonLine: 'Rudie’s nose lights up!', desc: 'Three charges through every enemy. Rudie gains Haste for 3 turns.', stagger: 2, fx: { dmg: 'phys', all: true, hits: 3, power: .55, self: [['haste', 3]] } }
  },

  Coal: {
    kind: 'toon', name: 'Coal', full: 'Coal', toon: 'Coal', role: 'Guardian', color: '#8c92a0', accent: '#4b505c',
    blurb: 'A small pet rock who decided one friend is hers to protect and will not be reasoned with.',
    basicName: 'Pebble Roll', basicKind: 'phys', improvised: 'Pebble Roll',
    base: { hp: 140, fp: 20, atk: 11.5, mag: 4, def: 14, mdef: 10, spd: 9.6, luck: 5 },
    grow: { hp: 16, fp: 1.2, atk: 1.3, mag: .4, def: 1.55, mdef: 1.1, spd: .14, luck: .18 },
    passive: { name: 'Sturdy', desc: 'Each hit Coal takes hardens her: 3% less damage per stack, up to 8 stacks.' },
    skills: [
      { id: 'rolling', name: 'Rolling Pebble', fp: 6, unlock: 'badge', target: 'enemy', kind: 'phys', stagger: 2.8, desc: 'Roll into the enemy: cancels a charge and slows it for 2 turns.', fx: { dmg: 'phys', power: 1.3, interrupt: true, foe: [['slow', 2]] } },
      { id: 'cozy', name: 'Cozy Companion', fp: 9, unlock: 'badge', target: 'ally', kind: 'buff', desc: 'A Shield worth 26% of Coal’s Max HP and Defense up on one ally.', fx: { shield: { who: 'ally', pct: .26, turns: 3 }, ally: [['defUp', 3]] } },
      { id: 'rockToss', name: 'Rock Toss', fp: 10, unlock: 'c2s15', target: 'enemy', kind: 'phys', stagger: 2, desc: 'Launch herself like a cannonball. Strips the target’s bonuses and slows it.', fx: { dmg: 'phys', power: 1.5, foe: [['slow', 2]], cleanseFoe: true } },
      { id: 'stayPut', name: 'Stay Put', fp: 11, unlock: 'c2s15', target: 'self', kind: 'buff', desc: 'Taunt every enemy for 2 turns, Ward 30% for 3 turns.', fx: { taunt: 2, self: [['ward', 3, 1, { v: .3 }]] } }
    ],
    bond: { name: 'Immovable', toonLine: 'Coal plants herself.', desc: 'Taunt every enemy for 3 turns, shield the party for 18% of Coal’s Max HP and Ward her for 3 turns.', fx: { taunt: 3, shield: { who: 'team', pct: .18, turns: 3 }, self: [['ward', 3, 1, { v: .3 }]] } }
  }
});
const ST_TOON_IDS = Object.keys(ST_TOONS);

/* ------------------------------------------------------------ ENEMIES
   Replicas: copies grown in the Reserve. They carry their original's habits
   but not their memories. New weaklings: Ichor Cake and Honeydrop. */
Object.assign(ST_ENEMIES, {
  inkCake: { name: 'Ichor Cake', art: 'w:Cake', hp: 52, atk: 7, mag: 10, def: 7, mdef: 7, spd: 9, stagger: 8, exp: 1.3,
    moves: [{ name: 'Frosting Smear', kind: 'mag', power: .8, ink: .4, w: 3 }, { name: 'Sugar Rush', kind: 'allybuff', buff: 'haste', w: 1 }, { name: 'Icing Patch', kind: 'allyheal', power: .2, w: 1 }] },
  inkDrop: { name: 'Honeydrop', art: 'w:Honeydrop', hp: 38, atk: 10, mag: 6, def: 6, mdef: 6, spd: 10, stagger: 6, exp: 1.2,
    moves: [{ name: 'Sticky Splat', kind: 'phys', power: .85, slow: .6, w: 3 }, { name: 'Drizzle', kind: 'mag', power: .5, target: 'all', slow: .3, w: 1 }] },

  repBoxten: { name: 'Twisted Boxten', art: 't:Boxten', hp: 175, atk: 12, mag: 12, def: 10, mdef: 10, spd: 9.5, stagger: 22, exp: 5, boss: true,
    moves: [
      { name: 'Music Box Slam', kind: 'phys', power: 1.3, w: 3 },
      { name: 'Off-Key Lullaby', kind: 'mag', power: .6, target: 'all', sleep: .3, w: 2 },
      { name: 'Wind-Up', kind: 'phys', power: 1.5, target: 'all', tele: 'The key in his back turns once. Twice. Three times…', w: 2, cd: 3 }
    ], phases: [{ at: .5, text: 'The key stops turning. Twisted Boxten’s wooden grin is a different shape.', buff: 'haste' }] },
  repLooey: { name: 'Twisted Looey', art: 't:Looey', hp: 96, atk: 13, mag: 9, def: 9, mdef: 9, spd: 13, stagger: 13, exp: 2.6,
    moves: [{ name: 'Cheap Shot', kind: 'phys', power: 1.1, w: 3 }, { name: 'Spotlight Hog', kind: 'mag', power: .6, target: 'all', debuff: 'atkDown', w: 2 }] },
  repYatta: { name: 'Twisted Yatta', art: 't:Yatta', hp: 88, atk: 11, mag: 12, def: 8, mdef: 9, spd: 14, stagger: 12, exp: 2.6,
    moves: [{ name: 'Encore', kind: 'mag', power: 1.1, hits: 2, w: 3 }, { name: 'Heckle', kind: 'mag', power: .5, target: 'all', debuff: 'defDown', w: 2 }] },
  repBlot: { name: 'Twisted Blot', art: 't:Blot', hp: 112, atk: 12, mag: 12, def: 9, mdef: 10, spd: 11, stagger: 14, exp: 2.8,
    moves: [{ name: 'Ink Blot', kind: 'mag', power: .95, ink: .55, w: 3 }, { name: 'Spread', kind: 'mag', power: .45, target: 'all', ink: .3, w: 2 }] },
  repFlutter: { name: 'Twisted Flutter', art: 't:Flutter', hp: 104, atk: 11, mag: 13, def: 8, mdef: 10, spd: 15, stagger: 13, exp: 3,
    moves: [{ name: '...', kind: 'mag', power: 1.0, w: 3 }, { name: 'Wing Beat', kind: 'phys', power: .6, target: 'all', w: 2 }, { name: 'Silent Scream', kind: 'mag', power: 1.3, w: 1, debuff: 'atkDown' }] },
  repGigi: { name: 'Twisted Gigi', art: 't:Gigi', hp: 98, atk: 9, mag: 14, def: 8, mdef: 9, spd: 14.5, stagger: 12, exp: 2.8,
    moves: [{ name: 'Prank', kind: 'mag', power: .9, debuff: 'defDown', w: 2 }, { name: 'Coin Toss', kind: 'mag', power: 1.25, w: 3 }] },
  repToodles: { name: 'Twisted Toodles', art: 't:Toodles', hp: 108, atk: 13, mag: 9, def: 9, mdef: 8, spd: 13.5, stagger: 13, exp: 2.8,
    moves: [{ name: 'Claw', kind: 'phys', power: 1.1, w: 3 }, { name: 'Bad Luck', kind: 'gamble', power: 2, w: 2 }] },
  repDyle: { name: 'Twisted Dyle', art: 't:Dyle', hp: 240, atk: 14, mag: 10, def: 12, mdef: 11, spd: 12, stagger: 28, exp: 7, boss: true,
    moves: [
      { name: 'Mind the Gap', kind: 'phys', power: 1.25, debuff: 'defDown', w: 3 },
      { name: 'Schedule Delay', kind: 'mag', power: .55, target: 'all', slow: .55, w: 2 },
      { name: 'Express Train', kind: 'phys', power: 1.55, target: 'all', tele: 'A whistle shrieks down the tunnel. Twisted Dyle checks a watch that is not there. CLEAR THE TRACK!', w: 2, cd: 3 },
      { name: 'Signal Fault', kind: 'summon', summon: 'inkBrick', w: 1, cd: 5 }
    ], phases: [{ at: .5, text: 'The rails sing. Twisted Dyle’s chain tightens around the whole platform!', buff: 'atkUp' }, { at: .25, text: '“LAST TRAIN.” The platform lights flicker out one by one.', buff: 'haste' }] },
  repGlisten: { name: 'Twisted Glisten', art: 't:Glisten', hp: 260, atk: 11, mag: 16, def: 11, mdef: 14, spd: 11.5, stagger: 26, exp: 7, boss: true,
    moves: [
      { name: 'Shatter Glance', kind: 'mag', power: 1.15, debuff: 'defDown', w: 3 },
      { name: 'Reflection', kind: 'selfbuff', buff: 'counter', w: 1, cd: 4 },
      { name: 'Cracked Chorus', kind: 'mag', power: .6, target: 'all', w: 2 },
      { name: 'Seven Years', kind: 'mag', power: 1.5, target: 'all', tele: 'Every mirror in the hall turns to face you. Glisten’s reflection smiles a half second late…', w: 2, cd: 3 }
    ], phases: [{ at: .5, text: 'A mirror shatters. There are now two of her reflections, and neither is hers.', summon: ['inkBall', 'inkBall'] }] },
  repSoulvester: { name: 'Twisted Soulvester', art: 't:Soulvester', hp: 360, atk: 13, mag: 9, def: 17, mdef: 14, spd: 8.5, stagger: 34, exp: 8, boss: true,
    moves: [
      { name: 'Steel Fist', kind: 'phys', power: 1.4, w: 3 },
      { name: 'Hold the Line', kind: 'selfbuff', buff: 'shield', w: 1, cd: 4 },
      { name: 'Iron Grave', kind: 'phys', power: 1.3, target: 'all', tele: 'Soulvester digs in his heels. The whole floor groans under his weight…', w: 2, cd: 3 }
    ], phases: [{ at: .5, text: 'Twisted Soulvester does not move. He simply gets heavier.', buff: 'defUp' }] },
  repRibecca: { name: 'Twisted Ribecca', art: 't:Ribecca', hp: 128, atk: 12, mag: 12, def: 10, mdef: 14, spd: 12, stagger: 15, exp: 3,
    moves: [{ name: 'Bone Rattle', kind: 'mag', power: 1.0, w: 3 }, { name: 'Dead Air', kind: 'mag', power: .5, target: 'all', debuff: 'atkDown', w: 2 }] },
  repCocoa: { name: 'Twisted Cocoa', art: 't:Cocoa', hp: 210, atk: 11, mag: 15, def: 10, mdef: 12, spd: 13, stagger: 22, exp: 6, boss: true,
    moves: [
      { name: 'Scalding Spill', kind: 'mag', power: 1.1, ink: .5, w: 3 },
      { name: 'Bonbon Barrage', kind: 'mag', power: .55, hits: 3, target: 'random', w: 2 },
      { name: 'Candy Coat', kind: 'selfbuff', buff: 'shield', w: 1, cd: 4 }
    ] },
  repFlyte: { name: 'Twisted Flyte', art: 't:Flyte', hp: 230, atk: 13, mag: 13, def: 13, mdef: 11, spd: 14.5, stagger: 24, exp: 6, boss: true,
    moves: [
      { name: 'Dive Bomb', kind: 'phys', power: 1.35, w: 3 },
      { name: 'Slipstream', kind: 'selfbuff', buff: 'haste', w: 1, cd: 3 },
      { name: 'Gale Force', kind: 'phys', power: .7, target: 'all', slow: .5, tele: 'Flyte climbs. Higher. Higher. The ornaments on the tree begin to shake…', w: 2, cd: 3 }
    ] },
  repDandy: { name: 'Replica Dandy', art: 't:Dandy', hp: 520, atk: 14, mag: 15, def: 15, mdef: 17, spd: 13, stagger: 44, exp: 18, boss: true,
    moves: [
      { name: 'Petal Storm', kind: 'mag', power: .65, target: 'all', w: 3 },
      { name: 'Price Check', kind: 'mag', power: 1.35, debuff: 'defDown', w: 3 },
      { name: 'Thorn Bind', kind: 'phys', power: .95, stun: .4, w: 2, cd: 2 },
      { name: 'Inventory', kind: 'summon', summon: 'repToodles', w: 1, cd: 4 },
      { name: 'Final Sale', kind: 'mag', power: 1.5, target: 'all', tele: 'Replica Dandy lifts a stamp. “Everything must go.”', w: 2, cd: 3 }
    ], phases: [{ at: .5, text: 'The petals fall off. Underneath, nothing is written on its face.', buff: 'atkUp', summon: ['inkCake', 'inkDrop'] }] },
  repDandyCore: { name: 'Replica Dandy · Unit 1', art: 't:Dandy', hp: 600, atk: 15, mag: 16, def: 15, mdef: 17, spd: 14, stagger: 48, exp: 22, boss: true,
    moves: [
      { name: 'Ichor Garden', kind: 'mag', power: .7, target: 'all', ink: .55, w: 3 },
      { name: 'Uproot', kind: 'phys', power: 1.5, w: 3 },
      { name: 'Grafting', kind: 'summon', summon: 'inkHand', w: 1, cd: 4 },
      { name: 'Count to Forty-One', kind: 'mag', power: 1.55, target: 'all', tele: 'The Replica begins to count. Every number it says, a lamp goes out.', w: 2, cd: 3 }
    ], phases: [{ at: .5, text: 'It stops counting. “Which one of you is the first?”', buff: 'atkUp', summon: ['inkHand', 'inkHand'] }] }
});

if (typeof module !== 'undefined') module.exports = { ST_TOON_IDS, ST_TOON_START_LV };
