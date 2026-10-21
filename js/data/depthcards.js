/* depthcards.js - run-only build cards for the Ichor Depths.
   These are deliberately chunky, build-defining bonuses. Permanent Trinkets
   still provide the collection chase; cards decide what this particular run
   feels like. */
'use strict';

const DEPTH_CARD_RARITY = {
  common: { label: 'COMMON', color: '#eff4ef' },
  rare:   { label: 'RARE',   color: '#83d9ff' },
  epic:   { label: 'EPIC',   color: '#e3a7ff' }
};

const DEPTH_CARDS = {
  script_doctor: {
    name: 'Script Doctor', icon: 'uploads/cardiconscript.png', rarity: 'common', max: 3,
    desc: n => `Skills recharge ${n * 9}% faster and Energy generation rises ${n * 12}%.`
  },
  overclocked: {
    name: 'Overclocked', icon: 'uploads/cardicongear.png', rarity: 'common', max: 3,
    desc: n => `Attack and Magic rise ${n * 12}%; Attack Speed rises ${n * 6}%. Max HP falls ${n * 3}%.`
  },
  gem_resonance: {
    name: 'Gem Resonance', icon: 'uploads/cardicongem.png', rarity: 'rare', max: 3,
    desc: n => `Each equipped Trinket rank grants an extra ${n * 2}% core stats and ${n * 3}% Max HP.`
  },
  watchful_eye: {
    name: 'Watchful Eye', icon: 'uploads/cardiconeye.png', rarity: 'common', max: 3,
    desc: n => `Accuracy rises ${n * 10}% and Critical Chance rises ${n * 4}%.`
  },
  power_saver: {
    name: 'Power Saver', icon: 'uploads/cardiconelectricitydown.png', rarity: 'common', max: 3,
    desc: n => `Enemies deal ${n * 7}% less damage and generate ${n * 8}% less Energy.`
  },
  fresh_air: {
    name: 'Fresh Air', icon: 'uploads/cardiconvent.png', rarity: 'common', max: 3,
    desc: n => `Control Resistance rises ${n * 12}% and incoming healing rises ${n * 8}%.`
  },
  reinforced_shell: {
    name: 'Reinforced Shell', icon: 'uploads/cardiconshield.png', rarity: 'common', max: 3,
    desc: n => `Max HP rises ${n * 12}%, defenses rise ${n * 8}%, and damage taken falls ${n * 3}%.`
  },
  ichor_siphon: {
    name: 'Ichor Siphon', icon: 'uploads/cardiconichorleak.png', rarity: 'rare', max: 3,
    desc: n => `Heroes heal for ${n * 4}% of direct damage dealt and recover ${n * 4}% HP after a room.`
  },
  bright_idea: {
    name: 'Bright Idea', icon: 'uploads/cardiconlightbulb.png', rarity: 'rare', max: 2,
    desc: n => `Start with ${n * 18} Energy. Once per battle below 40% HP, gain a ${n * 14}% Max HP Shield.`
  },
  redline_dial: {
    name: 'Redline Dial', icon: 'uploads/cardicondyle.png', rarity: 'common', max: 3,
    desc: n => `Attack Speed rises ${n * 10}% and all damage dealt rises ${n * 6}%.`
  },
  spring_shoes: {
    name: 'Spring Shoes', icon: 'uploads/cardiconshoes.png', rarity: 'common', max: 3,
    desc: n => `Evasion rises ${n * 8}%, Move Speed rises ${n * 12}%, and Attack Speed rises ${n * 4}%.`
  },
  elevator_pass: {
    name: 'Elevator Pass', icon: 'uploads/cardiconelevator.png', rarity: 'epic', max: 2,
    desc: n => `Reveal ${n * 2} extra rooms, earn ${n * 8}% more battle loot, and clear this floor's modifiers when picked.`
  },
  bargain_tag: {
    name: 'Bargain Tag', icon: 'uploads/cardiconpricetag.png', rarity: 'rare', max: 3,
    desc: n => `Battle loot rises ${n * 12}% and Twisted Trinket drop chances rise ${n * 8}%.`
  },
  patch_job: {
    name: 'Patch Job', icon: 'uploads/cardicontape.png', rarity: 'rare', max: 3,
    desc: n => `Healing and Shields rise ${n * 10}%. Recover ${n * 5}% HP after every won room; picking this up also patches 8% HP.`
  },
  blind_grab: {
    name: 'Blind Grab', icon: 'uploads/cardiconquestion.png', rarity: 'rare', max: 2,
    desc: n => `Gain a reroll now. Future drafts are luckier${n > 1 ? ' still' : ''}.`
  },
  second_wind: {
    name: 'Second Wind', icon: 'uploads/cardiconheart.png', rarity: 'epic', max: 1,
    desc: () => `Once per battle, each Hero survives a lethal hit with 22% HP and a 15% Max HP Shield.`
  },
  glass_cannon: {
    name: 'Glass Cannon', icon: 'uploads/cardicongem.png', rarity: 'rare', max: 2,
    desc: n => `Attack and Magic rise ${n * 18}%, Critical Chance rises ${n * 7}%, but Max HP falls ${n * 8}%.`
  },
  last_stand: {
    name: 'Last Stand', icon: 'uploads/cardiconheart.png', rarity: 'epic', max: 2,
    desc: n => `Once per battle when a Hero goes down, living Heroes gain a ${n * 10}% Max HP Shield and ${n * 12} Energy.`
  },
  overkill_protocol: {
    name: 'Overkill Protocol', icon: 'uploads/cardiconeye.png', rarity: 'rare', max: 2,
    desc: n => `Damage to enemies below 35% HP rises ${n * 18}%; Armor and Magic Penetration rise ${n * 6}%.`
  },
  emergency_kit: {
    name: 'Emergency Kit', icon: 'uploads/cardiconshield.png', rarity: 'common', max: 3,
    desc: n => `Each Hero starts battles with ${n * 12} Energy and a ${n * 6}% Max HP Shield.`
  },
  medic_protocol: {
    name: 'Medic Protocol', icon: 'uploads/cardiconvent.png', rarity: 'rare', max: 2,
    desc: n => `Every 6s, heal the most injured living Hero for ${n * 3}% Max HP; incoming healing rises ${n * 5}%.`
  },
  battle_hymn: {
    name: 'Battle Hymn', icon: 'uploads/cardiconscript.png', rarity: 'common', max: 3,
    desc: n => `Energy Generation rises ${n * 5}%; every team damage pulse grants each living Hero ${n} Energy.`
  },
  mapmaker: {
    name: 'Mapmaker', icon: 'uploads/cardiconelevator.png', rarity: 'rare', max: 2,
    desc: n => `Reveal ${n * 3} extra rooms immediately and gain ${n} reroll${n === 1 ? '' : 's'} when picked.`
  },
  ichor_finder: {
    name: 'Ichor Finder', icon: 'uploads/cardiconichorleak.png', rarity: 'common', max: 3,
    desc: n => `Battle and floor loot rises ${n * 10}%. The bonus keeps scaling after every stack.`
  },
  enemy_analyzer: {
    name: 'Enemy Analyzer', icon: 'uploads/cardicondyle.png', rarity: 'rare', max: 3,
    desc: n => `Accuracy rises ${n * 8}%; damage against Elites and Bosses rises ${n * 8}%.`
  },
  clean_sweep: {
    name: 'Clean Sweep', icon: 'uploads/cardiconshoes.png', rarity: 'common', max: 3,
    desc: n => `When an enemy goes down, living Heroes gain ${n * 4} Energy and ${n * 2}% Attack for 5s.`
  }
};

const DEPTH_CARD_IDS = Object.keys(DEPTH_CARDS);
