/* trinkets.js - equippable trinkets, up to 2 per Hero.
   Each character Trinket is a meaningful build piece: its own effect plus a
   reduced signature fragment borrowed from the character it came from.
   Real equipment now: each drop or craft is its own physical copy. Owning a
   copy of a Trinket type unlocks it; owning several copies of the same rank
   lets you merge two into one of the next rank (like standard gear fusion).
   Copies come from defeating a Twisted (that Hero's own trinket if curated,
   or a generic one otherwise), from a Hero's own level-ups (FFRK Record
   Materia style), or crafted outright with Scrap salvaged from other copies. */
'use strict';

const TRINKET_ICON_DIR = ASSET + 'item/Trinkets/';

const TRINKET_MAX_RANK = 5;
const TRINKET_MERGE_COUNT = 2;   // Rank 1/2 baseline; higher ranks use trinketMergeCost()
const TRINKET_MERGE_COSTS = [0, 2, 2, 3, 3, 0];
const CRAFT_COPY_COST = 90;      // Scrap spent to craft one fresh rank-1 copy
const TRINKET_SALVAGE = [0, 20, 35, 60, 105, 165]; // Scrap refunded per rank when breaking a copy down
const TRINKET_RANK_POWER = [0, 1, 2, 3.2, 4.5, 6];
const TRINKET_RANK_NAMES = ['', 'Worn', 'Tuned', 'Refined', 'Masterwork', 'Mythic'];

function trinketRankPower(rank) {
  const r = clamp(Math.floor(Number(rank) || 1), 1, TRINKET_MAX_RANK);
  return TRINKET_RANK_POWER[r] || r;
}
function trinketMergeCost(rank) {
  const r = clamp(Math.floor(Number(rank) || 1), 1, TRINKET_MAX_RANK);
  return TRINKET_MERGE_COSTS[r] || TRINKET_MERGE_COUNT;
}
function trinketRankLabel(rank) {
  const r = clamp(Math.floor(Number(rank) || 1), 1, TRINKET_MAX_RANK);
  return TRINKET_RANK_NAMES[r] || 'Rank ' + r;
}
function trinketStatText(trinket, rank) {
  return trinket && trinket.stat ? trinket.stat(trinketRankPower(rank)) : '';
}

const TRINKETS = {};

/* A Trinket is a small piece of its owner's kit, not just a stat stick. These
   echoes are intentionally short of the full Hero skill, so equipping a
   keepsake changes a build without replacing the character who wears it. */
const TRINKET_SIGNATURES = {
  Teagan: {
    name: 'Etiquette',
    desc: 'The wearer occasionally blocks a debuff; blocking it Fatigues the source and restores a little health.',
    apply(u, B, r) {
      u.flat.ccRes = (u.flat.ccRes || 0) + .018 * r;
      u.guards = u.guards || [];
      u.guards.push((id, d, battle) => {
        if (d.kind !== 'debuff' || battle.t < (u._teaganTrinketGuardAt || 0)) return false;
        u._teaganTrinketGuardAt = battle.t + Math.max(6.5, 10 - r * .8);
        return true;
      });
      B.on(u, 'debuffBlocked', ev => {
        if (ev.unit !== u || !ev.src || !ev.src.alive) return;
        B.applyStatus(u, ev.src, 'fatigue', 2.5 + r * .7);
        B.heal(u, u, u.max.hp * (.012 + r * .008), { tag: 'Etiquette' });
      });
    }
  },
  Finn: {
    name: 'Barnaby Splash',
    desc: 'The wearer\'s slows, hooks, and roots splash nearby enemies, while granting Accuracy and Energy.',
    apply(u, B, r) {
      u.flat.accP = (u.flat.accP || 0) + .012 * r;
      u._trinketSplashAt = -99;
      B.on(u, 'statusApplied', ev => {
        if (ev.src !== u || ev.unit.team === u.team || !['slow', 'hooked', 'root'].includes(ev.id)) return;
        if (B.t - u._trinketSplashAt < Math.max(2.8, 5.5 - r * .65)) return;
        u._trinketSplashAt = B.t;
        const nearby = B.enemiesOf(u).filter(e => e !== ev.unit && B.distance(e, ev.unit) < 230);
        const target = nearby[0];
        if (target) B.applyStatus(u, target, 'slow', 1.8 + r * .5);
        B.energy(u, 2 + r * 2);
        B.fxFloatIcon(ev.unit.x, ev.unit.y - 88, '🐟', '#75dcff');
      });
    }
  },
  Shelly: {
    name: 'Field Notes',
    desc: 'Hitting enemies who are Marked, Exposed, or Weakened builds Research and reveals another opening.',
    apply(u, B, r) {
      u._trinketStudyHits = 0;
      B.on(u, 'dealDamage', ev => {
        if (!ev.target || ev.dot || ev.target.team === u.team) return;
        if (ev.target.hasStatus('marked') || ev.target.hasStatus('exposed') || ev.target.hasStatus('weaken')) u._trinketStudyHits++;
        if (u._trinketStudyHits < Math.max(2, 5 - r)) return;
        u._trinketStudyHits = 0;
        B.applyStatus(u, ev.target, 'research', 3 + r);
        B.fxFloatIcon(ev.target.x, ev.target.y - 88, '📋', '#9fe5ff');
      });
    }
  },
  Rodger: {
    name: 'Case File',
    desc: 'The wearer\'s basic attacks periodically Mark and Expose their target.',
    apply(u, B, r) {
      u._trinketCaseHits = 0;
      B.on(u, 'basicHit', ev => {
        if (!ev.target) return;
        u._trinketCaseHits++;
        if (u._trinketCaseHits < Math.max(2, 4 - r)) return;
        u._trinketCaseHits = 0;
        B.applyStatus(u, ev.target, 'marked', 3 + r);
        B.applyStatus(u, ev.target, 'exposed', 2 + r * .5);
      });
    }
  },
  Gourdy: {
    name: 'Sugar Rush',
    desc: 'Healing grants the healed ally a brief Speed boost and a little Energy.',
    apply(u, B, r) {
      B.on(u, 'healDone', ev => {
        if (!ev.target || B.t < (u._trinketSugarAt || 0)) return;
        u._trinketSugarAt = B.t + Math.max(4.5, 7 - r * .6);
        B.applyStatus(u, ev.target, 'speedup', 2 + r * .5);
        B.energy(ev.target, 2 + r);
      });
    }
  },
  Toodles: {
    name: 'Lucky Change',
    desc: 'The wearer gains Crit chance and occasionally turns a hit into a Critical hit that Exposes its target.',
    apply(u, B, r) {
      u.flat.crit = (u.flat.crit || 0) + .012 * r;
      B.on(u, 'dealDamage', ev => {
        if (!ev.target || ev.dot || !chance(.035 * r)) return;
        ev.forceCrit = true;
        B.applyStatus(u, ev.target, 'exposed', 2 + r * .4);
      });
    }
  },
  Poppy: {
    name: 'Music Box Tempo',
    desc: 'Casting the Green skill grants Tempo and a small Energy burst.',
    apply(u, B, r) {
      B.on(u, 'cast', ev => {
        if (ev.key !== 'G') return;
        B.applyStatus(u, u, 'tempo', 3 + r);
        B.energy(u, 2 + r);
      });
    }
  },
  Goob: {
    name: 'Comfort Hug',
    desc: 'Shielding an ally also gives the wearer a small personal Shield and makes that ally Receptive.',
    apply(u, B, r) {
      B.on(u, 'shieldDone', ev => {
        if (!ev.target || ev.target === u || B.t < (u._trinketHugAt || 0)) return;
        u._trinketHugAt = B.t + Math.max(3.5, 6 - r * .5);
        B.shield(u, u, u.max.hp * (.018 + r * .009), 4 + r);
        B.applyStatus(u, ev.target, 'receptive', 2 + r * .4, { val: .025 * r });
      });
    }
  }
};

function trinketSignatureFor(owner) {
  if (!owner) return '';
  const echo = TRINKET_SIGNATURES[owner];
  if (echo) return echo.name;
  const source = HEROES[owner];
  const skill = source && source.skills && (source.skills.G || source.skills.W || source.skills.B);
  return skill ? skill.name + ' fragment' : 'signature fragment';
}

function applyRoleTrinketEcho(u, B, r, owner) {
  const source = HEROES[owner];
  const role = String(source && source.role || '').toLowerCase();
  if (role.includes('support')) {
    B.on(u, 'healDone', ev => {
      if (!ev.target || B.t < (u._roleEchoAt || 0)) return;
      u._roleEchoAt = B.t + Math.max(5, 8 - r);
      B.applyStatus(u, ev.target, 'speedup', 1.5 + r * .4);
    });
  } else if (role.includes('tank')) {
    B.on(u, 'damaged', ev => {
      if (ev.dot || !ev.src || B.t < (u._roleEchoAt || 0)) return;
      u._roleEchoAt = B.t + Math.max(5, 8 - r);
      B.shield(u, u, u.max.hp * (.018 + r * .008), 3.5 + r * .4);
      B.applyStatus(u, ev.src, 'taunt', 1.5 + r * .3);
    });
  } else if (role.includes('control')) {
    B.on(u, 'statusApplied', ev => {
      if (ev.src !== u || ev.unit.team === u.team || !STATUS[ev.id] || !STATUS[ev.id].cc) return;
      B.energy(u, 2 + r);
      B.applyStatus(u, ev.unit, 'weaken', 1.5 + r * .4);
    });
  } else {
    B.on(u, 'dealDamage', ev => {
      if (!ev.target || ev.dot || B.t < (u._roleEchoAt || 0)) return;
      u._roleEchoAt = B.t + Math.max(4.5, 7 - r * .5);
      B.applyStatus(u, ev.target, 'exposed', 1.8 + r * .4);
    });
  }
}

function applyTrinketSignature(u, B, r, trinket) {
  if (!trinket.owner || !HEROES[trinket.owner]) return;
  u.trinketSignature = u.trinketSignature || [];
  u.trinketSignature.push({ owner: trinket.owner, name: trinket.signature });
  const echo = TRINKET_SIGNATURES[trinket.owner];
  if (echo) echo.apply(u, B, r);
  else applyRoleTrinketEcho(u, B, r, trinket.owner);
}

function defTrinket(o) {
  o.signature = o.signature || trinketSignatureFor(o.owner);
  const originalApply = o.apply;
  o.apply = (u, B, r) => {
    const power = trinketRankPower(r);
    originalApply(u, B, power);
    applyTrinketSignature(u, B, power, o);
  };
  TRINKETS[o.id] = o; return o;
}

/* ============================================================ HERO TRINKETS
   Every playable Hero exports one Trinket. `owner` means whose gimmick the
   item exports and where copies drop from; it is never an equip restriction.
   Any Hero may wear any Trinket and borrow that piece of the source Hero.
   `placeholder` keeps unfinished artwork unmistakable without blocking the
   item's complete mechanics, drops, crafting, or equipment behavior. */

defTrinket({ id: 'astro_starpillow', name: 'Star Pillow', owner: 'Astro', file: 'ASTRO_Starpillow.png',
  desc: 'Astro never goes anywhere without it.',
  stat: r => `+${(r * 2.5).toFixed(1)}% Healing Power`,
  effect: 'Every 8s, quietly heals the weakest ally for a little Magic.',
  apply(u, B, r) { u.flat.healPowP = (u.flat.healPowP || 0) + r * .025; u.dirty = true;
    B.every(u, 8, () => { const a = B.lowestHp(B.alliesOf(u)); if (a) B.heal(u, a, u.st.mag * .10 * r, { silent: true }); }); } });

defTrinket({ id: 'blot_mimemakeup', name: 'Mime Makeup', owner: 'Blot', file: 'BLOT_Mimemakeup.png',
  desc: 'Smudged, but it still works.',
  stat: r => `+${(r * 1.5).toFixed(1)}% Evasion`,
  effect: 'On being hit, a small chance to Blind the attacker briefly.',
  apply(u, B, r) { u.flat.evaP = (u.flat.evaP || 0) + r * .015; u.dirty = true;
    B.on(u, 'damaged', ev => { if (!ev.dot && ev.src && chance(.06 * r)) B.applyStatus(u, ev.src, 'blind', 2); }); } });

defTrinket({ id: 'boxten_bluebandana', name: 'Blue Bandana', owner: 'Boxten', file: 'BOXTEN_Bluebandana.png',
  desc: 'Keeps the springs from rattling loose.',
  stat: r => `+${(r * 1.5).toFixed(1)}% Move Speed`,
  effect: 'Basic Attacks have a small chance to grant a stack of Speed Up.',
  apply(u, B, r) { u.flat.msP = (u.flat.msP || 0) + r * .015; u.dirty = true;
    B.on(u, 'basicHit', () => { if (chance(.08 * r)) B.applyStatus(u, u, 'speedup', 2); }); } });

defTrinket({ id: 'brightney_sparebulb', name: 'Spare Bulb', owner: 'Brightney', file: 'BRIGHTNEY_SpareBulb.png',
  desc: 'Just in case.',
  stat: r => `+${(r * 1.5).toFixed(1)}% Magic Defense`,
  effect: 'Once per battle, dropping below 25% HP triggers a bright flash that Blinds nearby enemies.',
  apply(u, B, r) { u.flat.mdefP = (u.flat.mdefP || 0) + r * .015; u.dirty = true;
    B.on(u, 'damaged', () => { if (u._bulbUsed || u.hpPct > .25 || !u.alive) return; u._bulbUsed = true;
      Sound.play('flash'); B.flash('#fffbe0', .5, .3); B.aoeStatus(u, u.x, 220, 'blind', 2.5); }); } });

defTrinket({ id: 'brusha_paintbucket', name: 'Paint Bucket', owner: 'Brusha', file: 'BRUSHA_PaintBucket.png',
  desc: 'Never quite empties.',
  stat: r => `+${(r * 1.5).toFixed(1)}% Magic Attack`,
  effect: 'Basic Attacks have a small chance to Weaken the target.',
  apply(u, B, r) { u.flat.magP = (u.flat.magP || 0) + r * .015; u.dirty = true;
    B.on(u, 'basicHit', ev => { if (chance(.08 * r)) B.applyStatus(u, ev.target, 'weaken', 3); }); } });

defTrinket({ id: 'connie_ghostsnakes', name: 'Ghost Snakes In A Can', owner: 'Connie', file: 'CONNIE_GhostSnakesInACan.png',
  desc: 'The prank never gets old.',
  stat: r => `+${(r * 1.7).toFixed(1)}% Evasion`,
  effect: 'A successful dodge has a chance to Fear the attacker briefly.',
  apply(u, B, r) { u.flat.evaP = (u.flat.evaP || 0) + r * .017; u.dirty = true;
    B.on(u, 'dodged', ev => { if (ev.src && chance(.15 * r)) B.applyStatus(u, ev.src, 'fear', 1.5); }); } });

defTrinket({ id: 'cosmo_sweetcharm', name: 'Sweet Charm', owner: 'Cosmo', file: 'COSMO_Sweetcharm.png',
  desc: 'Feels lucky to hold.',
  stat: r => `+${(r * 2).toFixed(1)}% Healing Power`,
  effect: 'Heals this Hero lands have a chance to also cleanse a debuff.',
  apply(u, B, r) { u.flat.healPowP = (u.flat.healPowP || 0) + r * .02; u.dirty = true;
    B.on(u, 'healDone', ev => { if (ev.target !== u && chance(.10 * r)) B.cleanse(ev.target, 1); }); } });

defTrinket({ id: 'delilah_preservedspecimen', name: 'Preserved Specimen', owner: 'Delilah', file: 'DELILAH_PreservedSpecimen.png',
  desc: 'It twitches when nobody is taking notes.',
  stat: r => `+${(r * 2).toFixed(0)}% Cooldown Reduction`,
  effect: 'At battle start, identifies a Test Subject and releases a temporary miniature Twisted to hunt it.',
  apply(u, B, r) {
    u.flat.cdr = (u.flat.cdr || 0) + r * .02; u.dirty = true;
    B.after(.65, () => {
      if (!u.alive || B.over || u._preservedSpecimenReleased) return;
      const foes = B.enemiesOf(u); if (!foes.length) return;
      // Borrow Delilah's real formation diagnosis when her data is present.
      // The fallback keeps the Trinket self-contained in isolated test fights.
      const choice = typeof delilahSampleChoice === 'function'
        ? delilahSampleChoice(u, B)
        : { id: 'Poppy', target: B.highestEnergy(foes) || foes[0], kind: 'restrict' };
      const target = choice && choice.target && choice.target.alive ? choice.target : foes[0];
      if (!target) return;
      u._preservedSpecimenReleased = true;
      const life = 8 + r * 2;
      B.applyStatus(u, target, 'testsubject', life);
      const m = B.summon(u, {
        protoId: choice.id || 'Poppy', name: 'Preserved ' + (choice.id || 'Sample'),
        art: Art.twisted(choice.id || 'Poppy'), twisted: true, delilahSample: true, sampleType: choice.id || 'Poppy',
        hp: u.max.hp * (.18 + r * .04), atk: u.st.atk * (.20 + r * .04), mag: u.st.mag * (.20 + r * .04),
        def: u.st.def * (.30 + r * .05), mdef: u.st.mdef * (.30 + r * .05),
        scale: .48, offset: 18, noEnergy: true, follow: target, life, tint: '#bd82ff'
      });
      // Trinket summons fight normally, but never consume or feed a Hero's
      // native summon mechanics (Delilah's sample cap, decoy counters, etc.).
      m.trinketSample = true;
      B.fxFloatObject(u.x, u.y - 104, 'researchcapsule', '#caa2ff');
      B.fxRing(target.x, target.y - 42, 72, '#caa2ff', .22);
      Sound.play('summon', { vol: .45 });
      B.after(.14, () => {
        if (!m.alive || !target.alive) return;
        if (choice.kind === 'disrupt') B.applyStatus(m, target, 'stun', .35 + r * .12);
        else if (choice.kind === 'pull') B.applyStatus(m, target, 'root', .65 + r * .18);
        else if (choice.kind === 'pressure') B.applyStatus(m, target, 'exposed', 1.5 + r * .5);
        else B.applyStatus(m, target, 'slow', 1.5 + r * .5);
      });
    });
  } });

defTrinket({ id: 'dyle_trainwhistle', name: 'Train Whistle', owner: 'Dyle', file: 'DYLE_TrainWhistle.png',
  desc: 'On time, every time.',
  stat: r => `+${(r * 1.5).toFixed(1)}% Accuracy`,
  effect: 'A chance to shrug off the next debuff aimed at this Hero, on a short cooldown.',
  apply(u, B, r) {
    u.flat.accP = (u.flat.accP || 0) + r * .015; u.dirty = true;
    u.guards = u.guards || [];
    u.guards.push((id, d, battle) => {
      if (u._whistleCd && battle.t - u._whistleCd < 8) return false;
      if (!chance(.06 + r * .03)) return false;
      u._whistleCd = battle.t; Sound.play('warn', { vol: .4 }); return true;
    });
  } });

defTrinket({ id: 'eggson_eggradar', name: 'Egg Radar', owner: 'Eggson', file: 'EGGSON_eggradar.png',
  desc: 'Beeps faster near something worth finding.',
  stat: r => `+${(r * 1.7).toFixed(1)}% Accuracy`,
  effect: 'Basic Attacks have a small chance to Expose the target.',
  apply(u, B, r) { u.flat.accP = (u.flat.accP || 0) + r * .017; u.dirty = true;
    B.on(u, 'basicHit', ev => { if (chance(.08 * r)) B.applyStatus(u, ev.target, 'exposed', 3); }); } });

defTrinket({ id: 'gigi_luckycoin', name: 'Lucky Coin', owner: 'Gigi', file: 'GIGI_LuckyCoin.png',
  desc: 'Gigi has never once spent it.',
  stat: r => `+${(r * 1).toFixed(1)}% Crit Chance`,
  effect: 'Basic Attacks have a small chance to refund Energy.',
  apply(u, B, r) { u.flat.crit = (u.flat.crit || 0) + r * .01; u.dirty = true;
    B.on(u, 'basicHit', () => { if (chance(.08 * r)) B.energy(u, 8); }); } });

defTrinket({ id: 'looey_clownhorn', name: 'Clown Horn', owner: 'Looey', file: 'LOOEY_Clownhorn.png',
  desc: 'HONK.',
  stat: r => `+${(r * 1.5).toFixed(1)}% Attack Speed`,
  effect: 'On being hit, a small chance to Taunt the attacker.',
  apply(u, B, r) { u.flat.aspdP = (u.flat.aspdP || 0) + r * .015; u.dirty = true;
    B.on(u, 'damaged', ev => { if (!ev.dot && ev.src && chance(.08 * r)) B.applyStatus(u, ev.src, 'taunt', 1.5); }); } });

defTrinket({ id: 'poppy_pinkbow', name: 'Pink Bow', owner: 'Poppy', file: 'POPPY_PinkBow.png',
  desc: 'Ties everything together.',
  stat: r => `+${(r * 2.5).toFixed(1)}% Crit Damage`,
  effect: 'Critical hits have a small chance to Slow the target.',
  apply(u, B, r) { u.flat.critDmg = (u.flat.critDmg || 0) + r * .025; u.dirty = true;
    B.on(u, 'dealDamage', ev => { if (ev.crit && chance(.12 * r)) B.applyStatus(u, ev.target, 'slow', 1.5); }); } });

defTrinket({ id: 'scraps_crayonset', name: 'Crayon Set', owner: 'Scraps', file: 'SCRAPS_Crayonset.png',
  desc: 'Missing the blue one.',
  stat: r => `+${(r * 2).toFixed(0)}% Attack Speed`,
  effect: 'Materials improve the current craft more each time Whatever Works is used.',
  apply(u, B, r) { u.flat.aspdP = (u.flat.aspdP || 0) + r * .02; u.scrapsCraftGrowth = r * .10; u.dirty = true; } });

defTrinket({ id: 'shelly_participation', name: 'Participation Reward', owner: 'Shelly', file: 'SHELLY_ParticipationReward.png',
  desc: 'Everybody got one. She kept hers.',
  stat: r => `+${(r * 1.5).toFixed(1)}% Max HP`,
  effect: '+3% Energy Generation.',
  apply(u, B, r) { u.flat.hpP = (u.flat.hpP || 0) + r * .015; u.flat.energyGen = (u.flat.energyGen || 0) + r * .03; u.dirty = true; } });

defTrinket({ id: 'shrimpo_brick', name: 'Brick', owner: 'Shrimpo', file: 'SHRIMPO_Brick.png',
  desc: 'It is, in fact, just a brick.',
  stat: r => `+${(r * 1.7).toFixed(1)}% Defense`,
  effect: 'On being hit, a small chance to Slow the attacker.',
  apply(u, B, r) { u.flat.defP = (u.flat.defP || 0) + r * .017; u.dirty = true;
    B.on(u, 'damaged', ev => { if (!ev.dot && ev.src && chance(.08 * r)) B.applyStatus(u, ev.src, 'slow', 2); }); } });

defTrinket({ id: 'squirm_stressball', name: 'Stress Ball', owner: 'Squirm', file: 'SQUIRM_Stressball.png',
  desc: 'Nearly flat. Still helps.',
  stat: r => `+${(r * 1.5).toFixed(1)}% Max HP`,
  effect: 'Below 50% HP, a small chance to shrug off part of an incoming hit.',
  apply(u, B, r) { u.flat.hpP = (u.flat.hpP || 0) + r * .015; u.dirty = true;
    B.on(u, 'damaged', ev => { if (u.hpPct < .5 && chance(.08 * r)) ev.amount *= .8; }); } });

defTrinket({ id: 'toodles_dogplush', name: 'Dog Plush', owner: 'Toodles', file: 'Toodles_DogPlush.png',
  desc: 'A gift, once, from someone who cared.',
  stat: r => `+${(r * 1.5).toFixed(1)}% Healing Power`,
  effect: 'Every 12s, restores a little of her own Energy.',
  apply(u, B, r) { u.flat.healPowP = (u.flat.healPowP || 0) + r * .015; u.dirty = true;
    B.every(u, 12, () => B.energy(u, 5 * r)); } });

defTrinket({ id: 'tisha_featherduster', name: 'Feather Duster', owner: 'Tisha', file: 'TISHA_Featherduster.png',
  desc: 'A little piece of Tisha’s insistence that everything has a proper place.',
  stat: r => `+${(r * 1.5).toFixed(1)}% Accuracy`,
  effect: 'Periodically, a Basic Attack pushes its target and leaves it Misplaced.',
  apply(u, B, r) {
    u.flat.accP = (u.flat.accP || 0) + r * .015; u.dirty = true; u._dusterAt = -99;
    B.on(u, 'basicHit', ev => {
      if (!ev.target || B.t - u._dusterAt < Math.max(5, 9 - r)) return;
      u._dusterAt = B.t; B.knockback(u, ev.target, 35 + r * 12);
      B.applyStatus(u, ev.target, 'misplaced', 3 + r);
      B.fxFloatIcon(ev.target.x, ev.target.y - 88, '🧹', '#9ff3ef'); Sound.play('sweep', { vol: .35 });
    });
  } });

defTrinket({ id: 'vee_veemote', name: 'Veemote', owner: 'Vee', file: 'VEE_Veemote.png',
  desc: 'Studio-branded and slightly out of date.',
  stat: r => `+${(r * 1.5).toFixed(1)}% Accuracy`,
  effect: 'Basic Attacks have a small chance to Expose the target.',
  apply(u, B, r) { u.flat.accP = (u.flat.accP || 0) + r * .015; u.dirty = true;
    B.on(u, 'basicHit', ev => { if (chance(.08 * r)) B.applyStatus(u, ev.target, 'exposed', 3); }); } });

defTrinket({ id: 'yatta_partypopper', name: 'Party Popper', owner: 'Yatta', file: 'YATTA_PartyPopper.png',
  desc: 'One good pop left in it.',
  stat: r => `+${(r * 1.5).toFixed(1)}% Attack Speed`,
  effect: 'Landing a Critical Hit has a small chance to grant Haste.',
  apply(u, B, r) { u.flat.aspdP = (u.flat.aspdP || 0) + r * .015; u.dirty = true;
    B.on(u, 'dealDamage', ev => { if (ev.crit && chance(.10 * r)) B.applyStatus(u, u, 'haste', 3); }); } });

/* ============================================================ COMPLETED OWNER SET
   These fill every playable Hero that did not previously export a Trinket.
   `placeholder` marks mechanics that are complete but still need final art. */

defTrinket({ id: 'cocoa_fondantbag', name: 'Glazed Fondant Bag', owner: 'Cocoa', file: 'COCOA_GlazedFondantBag.png',
  desc: 'Packed with emergency decorations and one suspiciously fresh glaze.',
  stat: r => `+${(r * 2).toFixed(1)}% Shield Power`,
  effect: 'Shielding an ally also gives them a short burst of Healing Received.',
  apply(u, B, r) { u.flat.shieldPowP = (u.flat.shieldPowP || 0) + r * .02; u.dirty = true;
    B.on(u, 'shieldDone', ev => { if (ev.target && ev.target !== u) B.applyStatus(u, ev.target, 'receptive', 2.5, { val: .04 * r }); }); } });

defTrinket({ id: 'bobette_windupbell', name: 'Wind-Up Bell', owner: 'Bobette', file: 'PLACEHOLDER_Trinket.svg', placeholder: true,
  desc: 'PLACEHOLDER ART: a tiny bell from Bobette’s clockwork gift routine.',
  stat: r => `+${(r * 1.5).toFixed(1)}% Attack Speed`,
  effect: 'The first Skill used every few seconds gives all allies brief Speed Up.',
  apply(u, B, r) { u.flat.aspdP = (u.flat.aspdP || 0) + r * .015; u.dirty = true; u._bellAt = -99;
    B.on(u, 'cast', () => { if (B.t - u._bellAt < Math.max(8, 12 - r)) return; u._bellAt = B.t;
      B.alliesOf(u).forEach(a => B.applyStatus(u, a, 'speedup', 1.5 + r * .5)); Sound.play('ding', { vol: .35 }); }); } });

defTrinket({ id: 'coal_cinderchunk', name: 'Cinder Chunk', owner: 'Coal', file: 'PLACEHOLDER_Trinket.svg', placeholder: true,
  desc: 'PLACEHOLDER ART: a stubborn ember that refuses to cool down.',
  stat: r => `+${(r * 1.7).toFixed(1)}% Defense`,
  effect: 'Melee attackers can be Burned by the retained heat.',
  apply(u, B, r) { u.flat.defP = (u.flat.defP || 0) + r * .017; u.dirty = true;
    B.on(u, 'damaged', ev => { if (ev.melee && ev.src && chance(.07 * r)) B.applyStatus(u, ev.src, 'burn', 4, { val: u.st.atk * .035 }); }); } });

defTrinket({ id: 'ginger_pepperminticing', name: 'Peppermint Icing', owner: 'Ginger', file: 'GINGER_PeppermintIcing.png',
  desc: 'Still sweet, still minty, somehow still not melted.',
  stat: r => `+${(r * 2).toFixed(1)}% Healing Power`,
  effect: 'Healing an ally can give them brief Speed Up.',
  apply(u, B, r) { u.flat.healPowP = (u.flat.healPowP || 0) + r * .02; u.dirty = true;
    B.on(u, 'healDone', ev => { if (ev.target && chance(.09 * r)) B.applyStatus(u, ev.target, 'speedup', 2.5); }); } });

defTrinket({ id: 'bassie_basketpin', name: 'Basket Pin', owner: 'Bassie', file: 'PLACEHOLDER_Trinket.svg', placeholder: true,
  desc: 'PLACEHOLDER ART: a sturdy pin from the basket she never leaves behind.',
  stat: r => `+${(r * 1.7).toFixed(1)}% Max HP`,
  effect: 'Once every few seconds, an ally falling below 40% HP receives a small Shield.',
  apply(u, B, r) { u.flat.hpP = (u.flat.hpP || 0) + r * .017; u.dirty = true; u._basketPinAt = -99;
    B.on(u, 'allyLow', a => { if (!a || B.t - u._basketPinAt < Math.max(8, 12 - r)) return; u._basketPinAt = B.t;
      B.shield(u, a, u.max.hp * (.025 + r * .012), 5); B.fxFloatIcon(a.x, a.y - 88, '🧺', '#d8a86f'); }); } });

defTrinket({ id: 'rudie_festivelights', name: 'Festive Lights', owner: 'Rudie', file: 'RUDIE_FestiveLights.png',
  desc: 'One bulb always blinks out of rhythm.',
  stat: r => `+${(r * 1.5).toFixed(1)}% Accuracy`,
  effect: 'Using an Ultimate briefly Blinds the highest-Energy enemy.',
  apply(u, B, r) { u.flat.accP = (u.flat.accP || 0) + r * .015; u.dirty = true;
    B.on(u, 'cast', ev => { if (ev.key !== 'W') return; const t = B.highestEnergy(B.enemiesOf(u));
      if (t) { B.applyStatus(u, t, 'blind', 1.5 + r * .5); B.fxSparkle(t.x, t.y - 45, 6, '#d7f5ff'); } }); } });

defTrinket({ id: 'sprout_savorycharm', name: 'Savory Charm', owner: 'Sprout', file: 'SPROUT_SavoryCharm.png',
  desc: 'A reminder that not every useful recipe has to be sweet.',
  stat: r => `+${(r * 2.5).toFixed(1)}% Healing Power`,
  effect: 'Every few heals restore a little Energy to the healed ally.',
  apply(u, B, r) { u.flat.healPowP = (u.flat.healPowP || 0) + r * .025; u.dirty = true; u._savoryHeals = 0;
    B.on(u, 'healDone', ev => { if (ev.target && ++u._savoryHeals >= Math.max(2, 5 - r)) { u._savoryHeals = 0; B.energy(ev.target, 3 + r * 2); } }); } });

defTrinket({ id: 'flyte_scrapbook', name: 'Scrapbook', owner: 'Flyte', file: 'FLYTE_Scrapbook.png',
  desc: 'Every page is arranged around someone Flyte helped.',
  stat: r => `+${(r * 1.7).toFixed(1)}% Evasion`,
  effect: 'Dodging grants the weakest ally brief Move Speed and a small Shield.',
  apply(u, B, r) { u.flat.evaP = (u.flat.evaP || 0) + r * .017; u.dirty = true; u._scrapbookAt = -99;
    B.on(u, 'dodged', () => { if (B.t - u._scrapbookAt < 6) return; u._scrapbookAt = B.t; const a = B.lowestHp(B.alliesOf(u));
      if (a) { B.applyStatus(u, a, 'cleanstep', 2 + r * .5); B.shield(u, a, u.st.mag * .08 * r, 4); } }); } });

defTrinket({ id: 'rodger_magnifyingglass', name: 'Magnifying Glass', owner: 'Rodger', file: 'Rodger_Magnifyingglass.png',
  desc: 'Every smudge is evidence if you stare long enough.',
  stat: r => `+${(r * 2).toFixed(1)}% Accuracy`,
  effect: 'Repeated Basic Attacks eventually Mark the target for the team.',
  apply(u, B, r) { u.flat.accP = (u.flat.accP || 0) + r * .02; u.dirty = true; u._glassHits = 0;
    B.on(u, 'basicHit', ev => { if (ev.target && ++u._glassHits >= Math.max(2, 6 - r)) { u._glassHits = 0;
      B.applyStatus(u, ev.target, 'marked', 3 + r); B.fxFloatIcon(ev.target.x, ev.target.y - 88, '🔎', '#f0d27a'); } }); } });

defTrinket({ id: 'soulvester_soulsword', name: 'Soul Sword', owner: 'Soulvester', file: 'SOULVESTER_SoulSword.png',
  desc: 'It remembers every hand that tried to hold it.',
  stat: r => `+${(r * 1.7).toFixed(1)}% Attack`,
  effect: 'Defeating an enemy grants a Shield and a short burst of Attack Up.',
  apply(u, B, r) { u.flat.atkP = (u.flat.atkP || 0) + r * .017; u.dirty = true;
    B.on(u, 'enemyDown', () => { B.shield(u, u, u.st.atk * .16 * r, 5); B.applyStatus(u, u, 'atkup', 3, { stacks: 1 }); }); } });

defTrinket({ id: 'gourdy_candywrapper', name: 'Candy Wrapper', owner: 'Gourdy', file: 'PLACEHOLDER_Trinket.svg', placeholder: true,
  desc: 'PLACEHOLDER ART: the wrapper changes color when nobody is looking.',
  stat: r => `+${(r * 1.5).toFixed(1)}% Attack Speed`,
  effect: 'Periodically, a Basic Attack grants one random small stat boost.',
  apply(u, B, r) { u.flat.aspdP = (u.flat.aspdP || 0) + r * .015; u.dirty = true; u._wrapperHits = 0;
    B.on(u, 'basicHit', () => { if (++u._wrapperHits < Math.max(3, 7 - r)) return; u._wrapperHits = 0;
      B.applyStatus(u, u, pick(['speedup', 'atkup', 'fortify']), 3, { stacks: 1 }); Sound.play('get_food', { vol: .3 }); }); } });

defTrinket({ id: 'eclipse_moonfragment', name: 'Moon Fragment', owner: 'Eclipse', file: 'PLACEHOLDER_Trinket.svg', placeholder: true,
  desc: 'PLACEHOLDER ART: a cold shard chipped from an impossible moon.',
  stat: r => `+${(r * 1.7).toFixed(1)}% Magic Attack`,
  effect: 'Periodically Blinds and drains a little Energy from the highest-Energy enemy.',
  apply(u, B, r) { u.flat.magP = (u.flat.magP || 0) + r * .017; u.dirty = true;
    B.every(u, Math.max(7, 11 - r), () => { const t = B.highestEnergy(B.enemiesOf(u)); if (!t) return;
      B.applyStatus(u, t, 'blind', 1.4 + r * .35); B.energy(t, -(3 + r * 2)); B.fxFloatIcon(t.x, t.y - 88, '🌘', '#a993ff'); }); } });

defTrinket({ id: 'goob_friendshipbracelet', name: 'Friendship Bracelet', owner: 'Goob', file: 'Goob_Friendshipbracelet.png',
  desc: 'Made to fit any wrist, arm, paw, branch, or tentacle.',
  stat: r => `+${(r * 2).toFixed(1)}% Shield Power`,
  effect: 'Shielding another ally also grants the wearer a smaller matching Shield.',
  apply(u, B, r) { u.flat.shieldPowP = (u.flat.shieldPowP || 0) + r * .02; u.dirty = true; u._braceletAt = -99;
    B.on(u, 'shieldDone', ev => { if (!ev.target || ev.target === u || B.t - u._braceletAt < 4) return; u._braceletAt = B.t;
      B.shield(u, u, ev.amount * Math.min(.42, .18 + r * .08), 5); }); } });

defTrinket({ id: 'waxwell_cherishedblanket', name: 'Cherished Blanket', owner: 'Waxwell', file: 'WAXWELL_Cherishedblanket.png',
  desc: 'Warm enough to soften even a very bad day.',
  stat: r => `+${(r * 1.7).toFixed(1)}% Magic Defense`,
  effect: 'Once per battle below half HP, gains Ward and sheds one debuff.',
  apply(u, B, r) { u.flat.mdefP = (u.flat.mdefP || 0) + r * .017; u.dirty = true;
    B.on(u, 'damaged', () => { if (u._blanketUsed || u.hpPct >= .5) return; u._blanketUsed = true;
      B.applyStatus(u, u, 'ward', 2 + r); B.cleanse(u, 1); B.fxFloatIcon(u.x, u.y - 88, '🧣', '#e2b68c'); }); } });

defTrinket({ id: 'finn_fishingrod', name: 'Fishing Rod', owner: 'Finn', file: 'FINN_FishingRod.png',
  desc: 'The line always seems longer than it looked a second ago.',
  stat: r => `+${(r * 1.7).toFixed(1)}% Accuracy`,
  effect: 'Periodically hooks the farthest enemy slightly toward the wearer.',
  apply(u, B, r) { u.flat.accP = (u.flat.accP || 0) + r * .017; u.dirty = true;
    B.every(u, Math.max(7, 11 - r), () => { const foes = B.enemiesOf(u); if (!foes.length) return;
      const t = foes.slice().sort((a, b) => B.distance(b, u) - B.distance(a, u))[0]; if (!t || t.immovable) return;
      B.fxTargetLine(u, t, '#6cc4ff'); B.pull(t, t.x - t.face * (28 + r * 10), .24, t.depth); }); } });

defTrinket({ id: 'dandy_dandyplush', name: 'Dandy Plush', owner: 'Dandy', file: 'DANDY_DandyPlush.png',
  desc: 'It is always facing you, even when you turn it around.',
  stat: r => `+${(r * 1.7).toFixed(1)}% Max HP`,
  effect: 'Enemies that hurt another ally gain Attention and briefly deal less damage.',
  apply(u, B, r) { u.flat.hpP = (u.flat.hpP || 0) + r * .017; u.dirty = true; u._plushAt = -99;
    B.on(u, 'allyDamaged', ev => { if (!ev.src || ev.unit === u || B.t - u._plushAt < 2.5) return; u._plushAt = B.t;
      B.applyStatus(u, ev.src, 'attention', 4 + r, { stacks: 1 }); B.applyStatus(u, ev.src, 'weaken', 2.5, { stacks: 1 }); }); } });

defTrinket({ id: 'pebble_bone', name: 'Bone', owner: 'Pebble', file: 'PEBBLE_Bone.png',
  desc: 'The fastest way to turn a serious mission into fetch.',
  stat: r => `+${(r * 1.7).toFixed(1)}% Move Speed`,
  effect: 'Every few Basic Attacks grant Excited, increasing combat speed.',
  apply(u, B, r) { u.flat.msP = (u.flat.msP || 0) + r * .017; u.dirty = true; u._boneHits = 0;
    B.on(u, 'basicHit', () => { if (++u._boneHits < Math.max(2, 6 - r)) return; u._boneHits = 0;
      B.applyStatus(u, u, 'excited', 4, { stacks: 1 }); B.fxFloatIcon(u.x, u.y - 88, '🦴', '#f1dfb8'); }); } });

/* Collaboration Trinkets are fully functional and universally equippable. */
defTrinket({ id: 'sora_paopucharm', name: 'Kingdom Key', owner: 'Sora', file: 'image-60.png',
  desc: 'A Keyblade carried through unfamiliar worlds, still ready to open the next door.',
  stat: r => `+${(r * 1.7).toFixed(1)}% Attack`,
  effect: 'Every few Basic Attacks grant Haste and a small burst of Energy.',
  apply(u, B, r) { u.flat.atkP = (u.flat.atkP || 0) + r * .017; u.dirty = true; u._paopuHits = 0;
    B.on(u, 'basicHit', () => { if (++u._paopuHits < Math.max(3, 7 - r)) return; u._paopuHits = 0;
      B.applyStatus(u, u, 'haste', 2.5, { stacks: 1 }); B.energy(u, 3 + r * 2); }); } });

defTrinket({ id: 'riku_wayfindershard', name: 'Wayfinder Shard', owner: 'Riku', file: 'PLACEHOLDER_Trinket.svg', placeholder: true,
  desc: 'PLACEHOLDER ART: a dark shard that still points toward home.',
  stat: r => `+${(r * 1.7).toFixed(1)}% Magic Defense`,
  effect: 'Once per battle below half HP, gains Ward and Haste.',
  apply(u, B, r) { u.flat.mdefP = (u.flat.mdefP || 0) + r * .017; u.dirty = true;
    B.on(u, 'damaged', () => { if (u._wayfinderUsed || u.hpPct >= .5) return; u._wayfinderUsed = true;
      B.applyStatus(u, u, 'ward', 2 + r); B.applyStatus(u, u, 'haste', 3, { stacks: 1 }); }); } });

defTrinket({ id: 'kairi_luckycharm', name: 'Lucky Charm', owner: 'Kairi', file: 'PLACEHOLDER_Trinket.svg', placeholder: true,
  desc: 'PLACEHOLDER ART: a promise kept close when the road splits apart.',
  stat: r => `+${(r * 2).toFixed(1)}% Healing Power`,
  effect: 'Using an Ultimate heals the weakest ally and grants brief Accuracy.',
  apply(u, B, r) { u.flat.healPowP = (u.flat.healPowP || 0) + r * .02; u.dirty = true;
    B.on(u, 'cast', ev => { if (ev.key !== 'W') return; const a = B.lowestHp(B.alliesOf(u)); if (!a) return;
      B.heal(u, a, u.st.mag * .10 * r, { tag: 'Lucky Charm' }); B.applyStatus(u, a, 'accup', 2 + r); }); } });

defTrinket({ id: 'goofy_shieldemblem', name: 'Shield Emblem', owner: 'Goofy', file: 'PLACEHOLDER_Trinket.svg', placeholder: true,
  desc: 'PLACEHOLDER ART: a dented emblem stamped with a knight’s shield.',
  stat: r => `+${(r * 1.7).toFixed(1)}% Defense`,
  effect: 'Periodically Blocks part of an incoming Basic Attack.',
  apply(u, B, r) { u.flat.defP = (u.flat.defP || 0) + r * .017; u.dirty = true; u._emblemAt = -99;
    B.on(u, 'damaged', ev => { if (!ev.basic || B.t - u._emblemAt < Math.max(5, 9 - r)) return; u._emblemAt = B.t;
      ev.amount *= Math.max(.45, .72 - r * .07); B.fxFloatIcon(u.x, u.y - 88, '🛡', '#8edcff'); Sound.play('guard', { vol: .4 }); }); } });

defTrinket({ id: 'phantasia_unicornemblem', name: 'Unicorn Emblem', owner: 'Phantasia', file: 'phantasiatrinket.png',
  desc: 'A bright emblem from Phantasia’s wandering star.',
  stat: r => `+${(r * 1.7).toFixed(1)}% Cooldown Reduction`,
  effect: 'Periodically grants a random ally one random useful boost.',
  apply(u, B, r) { u.flat.cdr = (u.flat.cdr || 0) + r * .017; u.dirty = true;
    B.every(u, Math.max(7, 11 - r), () => { const allies = B.alliesOf(u); if (!allies.length) return; const a = pick(allies);
      B.applyStatus(u, a, pick(['speedwish', 'braverywish', 'computerwish']), 2.5 + r * .5); B.fxFloatIcon(a.x, a.y - 88, '🍬', '#efb8ff'); }); } });

/* Superior gear recovered from the sealed office world. These are deliberately
   stronger than ordinary keepsakes, but their power is conditional so they
   reward building around a team instead of replacing one. */
defTrinket({ id: 'unknown_brassbriefcase', name: 'Brass Briefcase', owner: null, file: 'PLACEHOLDER_Trinket.svg', placeholder: true,
  desc: 'A locked case that hums whenever a debuff lands.', stat: r => `+${(r * 3.4).toFixed(1)}% Attack and Magic Attack`,
  effect: 'Damage against debuffed enemies restores Energy and briefly grants Focus.',
  apply(u, B, r) { u.flat.atkP = (u.flat.atkP || 0) + r * .034; u.flat.magP = (u.flat.magP || 0) + r * .034; u.dirty = true;
    B.on(u, 'dealDamage', ev => { if (!ev.target || ev.dot || !ev.target.statuses.some(s => STATUS[s.id] && STATUS[s.id].kind === 'debuff')) return; if (chance(.08 * r)) { B.energy(u, 3 + r); B.applyStatus(u, u, 'focus', 2.5); } }); } });
defTrinket({ id: 'unknown_contractclip', name: 'Contract Clip', owner: null, file: 'PLACEHOLDER_Trinket.svg', placeholder: true,
  desc: 'Every clause is binding. Especially the last one.', stat: r => `+${(r * 3.1).toFixed(1)}% Defense and Magic Defense`,
  effect: 'The first time each battle you fall below 45% HP, gain a heavy Shield and cleanse two debuffs.',
  apply(u, B, r) { u.flat.defP = (u.flat.defP || 0) + r * .031; u.flat.mdefP = (u.flat.mdefP || 0) + r * .031; u.dirty = true; u._contractUsed = false;
    B.on(u, 'damaged', ev => { if (u._contractUsed || u.hpPct > .45 || ev.dot) return; u._contractUsed = true; B.cleanse(u, 2); B.shield(u, u, u.max.hp * (.18 + r * .035), 7 + r); }); } });
defTrinket({ id: 'unknown_inkseal', name: 'Ink Seal', owner: null, file: 'PLACEHOLDER_Trinket.svg', placeholder: true,
  desc: 'A black seal pressed into an impossible contract.', stat: r => `+${(r * 3.2).toFixed(1)}% Accuracy and Evasion`,
  effect: 'Basic attacks against debuffed enemies deal bonus Magic damage and extend one debuff.',
  apply(u, B, r) { u.flat.accP = (u.flat.accP || 0) + r * .032; u.flat.evaP = (u.flat.evaP || 0) + r * .032; u.dirty = true;
    B.on(u, 'basicHit', ev => { if (!ev.target || !ev.target.statuses.some(s => STATUS[s.id] && STATUS[s.id].kind === 'debuff')) return; B.damage(u, ev.target, u.st.mag * (.12 + r * .035), { type: 'magic', tag: 'Ink Seal' }); const debuff = ev.target.statuses.find(s => STATUS[s.id] && STATUS[s.id].kind === 'debuff'); if (debuff) debuff.t += .5 + r * .25; }); } });
defTrinket({ id: 'unknown_goldenstamp', name: 'Golden Stamp', owner: null, file: 'PLACEHOLDER_Trinket.svg', placeholder: true,
  desc: 'Approved by a department that does not exist.', stat: r => `+${(r * 2.8).toFixed(1)}% Skill Haste`,
  effect: 'Casting a skill grants Attack Up and Speed Up; the first cast each battle refunds Energy.',
  apply(u, B, r) { u.flat.cdr = (u.flat.cdr || 0) + r * .028; u.dirty = true; u._stampCast = false;
    B.on(u, 'cast', ev => { B.applyStatus(u, u, 'atkup', 3 + r * .6); B.applyStatus(u, u, 'speedup', 3 + r * .6); if (!u._stampCast) { u._stampCast = true; B.energy(u, 18 + r * 5); } }); } });
defTrinket({ id: 'badge_of_law', name: 'Badge of the Law', owner: 'BigWig', file: 'badgeofthelaw.png',
  desc: 'Big Wig’s polished authority badge, stamped for a case that never closes.',
  stat: r => `+${(r * 3.2).toFixed(1)}% Defense and Magic Defense`,
  effect: 'Applying a debuff grants Energy and a brief Shield. Convicted enemies take extra damage from the wearer.',
  apply(u, B, r) { u.flat.defP = (u.flat.defP || 0) + r * .032; u.flat.mdefP = (u.flat.mdefP || 0) + r * .032; u.flat.cdr = (u.flat.cdr || 0) + r * .018; u.dirty = true; u._lawBadgeAt = -99;
    B.on(u, 'statusApplied', ev => { if (ev.src !== u || !ev.unit || ev.unit.team === u.team || !STATUS[ev.id] || STATUS[ev.id].kind !== 'debuff') return; if (B.t - u._lawBadgeAt >= Math.max(2.8, 5.2 - r * .5)) { u._lawBadgeAt = B.t; B.energy(u, 5 + r * 2); B.shield(u, u, u.max.hp * (.045 + r * .012), 3.5 + r * .5); } });
    B.on(u, 'dealDamage', ev => { if (ev.target && ev.target.hasStatus('convicted') && !ev.dot) ev.amount *= 1 + r * .045; }); } });
defTrinket({ id: 'badge_of_the_market', name: 'Badge of the Market', owner: 'GladHander', file: 'badgeofthemarket.png',
  desc: 'A polished market badge that turns every opening into a sale.',
  stat: r => `+${(r * 3.1).toFixed(1)}% Attack and Magic Attack`,
  effect: 'Applying a debuff grants Energy and briefly increases damage dealt.',
  apply(u, B, r) { u.flat.atkP = (u.flat.atkP || 0) + r * .031; u.flat.magP = (u.flat.magP || 0) + r * .031; u.dirty = true; B.on(u, 'statusApplied', ev => { if (ev.src !== u || !ev.unit || ev.unit.team === u.team || !STATUS[ev.id] || STATUS[ev.id].kind !== 'debuff') return; B.energy(u, 4 + r); B.applyStatus(u, u, 'inspire', 2.2 + r * .35); }); } });
defTrinket({ id: 'badge_of_money', name: 'Badge of the Money', owner: 'RobberBaron', file: 'badgeofthemoney.png',
  desc: 'A weighty badge that approves every profitable exchange.',
  stat: r => `+${(r * 3.2).toFixed(1)}% Max HP and Shield Power`,
  effect: 'Whenever an enemy loses Power or a buff, gain a Shield and a burst of Energy.',
  apply(u, B, r) { u.flat.hpP = (u.flat.hpP || 0) + r * .032; u.flat.shieldPowP = (u.flat.shieldPowP || 0) + r * .032; u.dirty = true; u._moneyBadgeAt = -99; B.on(u, 'dealDamage', ev => { if (!ev.target || B.t - u._moneyBadgeAt < Math.max(2.5, 4.8 - r * .4)) return; if (ev.target.energy < ev.target.energyMax * .55 || !ev.target.statuses.some(s => STATUS[s.id] && STATUS[s.id].kind === 'buff')) { u._moneyBadgeAt = B.t; B.energy(u, 5 + r * 2); B.shield(u, u, u.max.hp * (.035 + r * .01), 3.5 + r * .5); } }); } });
defTrinket({ id: 'badge_of_the_boss', name: 'Badge of the Boss', owner: 'BigWig', file: 'badgeoftheboss.png',
  desc: 'A boss-level badge reserved for the machine at the top of the file.',
  stat: r => `+${(r * 3.5).toFixed(1)}% Defense, Magic Defense, and Skill Haste`,
  effect: 'Against debuffed enemies, the wearer deals more damage and takes less damage.',
  apply(u, B, r) { u.flat.defP = (u.flat.defP || 0) + r * .035; u.flat.mdefP = (u.flat.mdefP || 0) + r * .035; u.flat.cdr = (u.flat.cdr || 0) + r * .028; u.dirty = true; B.on(u, 'dealDamage', ev => { if (ev.target && ev.target.statuses.some(s => STATUS[s.id] && STATUS[s.id].kind === 'debuff') && !ev.dot) ev.amount *= 1 + r * .04; }); B.on(u, 'damaged', ev => { if (ev.src && ev.src.team !== u.team && ev.src.statuses.some(s => STATUS[s.id] && STATUS[s.id].kind === 'debuff')) ev.amount *= Math.max(.62, 1 - r * .035); }); } });

/* ============================================================ GENERIC TRINKETS
   No owner - only farmable from Twisteds in general, never from leveling a
   specific Hero, and equippable by anyone from the start. */

defTrinket({ id: 'alarm', name: 'Alarm', owner: null, file: 'Alarm.png',
  desc: 'Goes off exactly when you do not want it to.',
  stat: r => `+${(r * 1.5).toFixed(1)}% Energy Generation`,
  effect: 'Starts battle with a small burst of Energy.',
  apply(u, B, r) { u.flat.energyGen = (u.flat.energyGen || 0) + r * .015; u.dirty = true;
    B.after(.1, () => B.energy(u, 10 * r)); } });

defTrinket({ id: 'fancypurse', name: 'Fancy Purse', owner: 'Teagan', file: 'TEAGAN_FancyPurse.png',
  desc: 'A polished purse Teagan keeps stocked for every guest, every emergency, and one more cup of tea.',
  stat: r => `+${(r * 2.5).toFixed(1)}% Max HP`,
  effect: 'The first Shield you create each battle also applies Etiquette to an enemy and restores a little Energy.',
  apply(u, B, r) { u.flat.hpP = (u.flat.hpP || 0) + r * .025; u.dirty = true; u._purseUsed = false;
    B.on(u, 'statusApplied', ev => {
      if (ev.id !== 'shield' || ev.src !== u || u._purseUsed) return;
      u._purseUsed = true;
      const target = B.highestEnergy(B.enemiesOf(u));
      if (target) B.applyStatus(u, target, 'etiquette', 3.5 + r);
      B.energy(u, 5 + r * 2);
      B.shield(u, ev.unit || u, u.max.hp * (.04 + r * .015), 6);
      B.fxFloatIcon(u.x, u.y - 105, '👜', '#d6a765');
    });
  } });

defTrinket({ id: 'machinemanual', name: "Machine Manual", owner: null, file: 'Machinemanual.png',
  desc: 'Dog-eared and coffee-stained.',
  stat: r => `+${(r * 1.5).toFixed(1)}% Cooldown Reduction`,
  effect: 'No secondary effect - it just works.',
  apply(u, B, r) { u.flat.cdr = (u.flat.cdr || 0) + r * .015; u.dirty = true; } });

defTrinket({ id: 'researchmap', name: 'Research Map', owner: null, file: 'Researchmap.png',
  desc: 'Marked up over several visits.',
  stat: r => `+${(r * 1.7).toFixed(1)}% Accuracy`,
  effect: 'Once per battle, a hit against an enemy below 20% HP is a guaranteed Critical Hit.',
  apply(u, B, r) { u.flat.accP = (u.flat.accP || 0) + r * .017; u.dirty = true;
    B.on(u, 'dealDamage', ev => { if (u._mapUsed || ev.dot || ev.target.hpPct > .20 || ev.forceCrit) return;
      u._mapUsed = true; ev.forceCrit = true; }); } });

defTrinket({ id: 'ribbonspool', name: 'R&D Ribbon Spool', owner: 'RnD', file: 'RnD_RibbonSpool.png',
  desc: 'Never quite runs out either.',
  stat: r => `+${(r * 2).toFixed(1)}% Shield Power`,
  effect: 'Overhealing while Shielded extends the Shield a little.',
  apply(u, B, r) { u.flat.shieldPowP = (u.flat.shieldPowP || 0) + r * .02; u.dirty = true;
    B.on(u, 'healDone', ev => { if (ev.target === u && u.hasStatus('shield')) u.shields.forEach(s => s.t += .5 * r); }); } });

defTrinket({ id: 'speedometer', name: 'Speedometer', owner: null, file: 'Speedometer.png',
  desc: 'Stuck reading a number that feels aspirational.',
  stat: r => `+${(r * 1.5).toFixed(1)}% Move Speed`,
  effect: 'A burst of Move Speed for the first few seconds of battle.',
  apply(u, B, r) { u.flat.msP = (u.flat.msP || 0) + r * .015; u.dirty = true;
    B.applyStatus(u, u, 'speedup', 4 * r); } });

defTrinket({ id: 'speedyshoes', name: 'Speedy Shoes', owner: null, file: 'Speedyshoes.png',
  desc: 'Nearly worn through.',
  stat: r => `+${(r * 1.7).toFixed(1)}% Move Speed`,
  effect: 'Slow effects on this Hero are weaker.',
  apply(u, B, r) { u.flat.msP = (u.flat.msP || 0) + r * .017; u.slowResist = (u.slowResist || 0) + .12 * r; u.dirty = true; } });

defTrinket({ id: 'thinkingcap', name: 'Thinking Cap', owner: null, file: 'Thinkingcap.png',
  desc: 'Purely decorative. Probably.',
  stat: r => `+${(r * 1.5).toFixed(1)}% Cooldown Reduction`,
  effect: 'Using an ultimate restores a small amount of Energy to the team.',
  apply(u, B, r) { u.flat.cdr = (u.flat.cdr || 0) + r * .015; u.dirty = true;
    B.on(u, 'cast', ev => { if (ev.key === 'W') B.alliesOf(u).forEach(a => { if (a !== u) B.energy(a, 4 * r); }); }); } });

defTrinket({ id: 'wrench', name: 'Wrench', owner: null, file: 'Wrench.png',
  desc: 'Fixes more than it should be able to.',
  stat: r => `+${(r * 1.7).toFixed(1)}% Defense`,
  effect: 'When this Hero\'s Shield breaks, a brief burst of Defense follows.',
  apply(u, B, r) { u.flat.defP = (u.flat.defP || 0) + r * .017; u.dirty = true;
    u.onShieldBreakBonus = .10 * r; } });

/* ============================================================ TRINKET REWORK
   Trinkets are build pieces, not tiny passive stat stickers. The original
   definitions above remain as a readable fallback record, while this layer
   gives every live Trinket a distinct battle loop. Each replacement receives
   the same rank-scaled power and signature fragment as the base system. */
function trinketReady(u, B, key, cooldown) {
  const next = Number(u[key]);
  if (Number.isFinite(next) && B.t < next) return false;
  u[key] = B.t + cooldown;
  return true;
}
function trinketBasicProc(u, B, r, base, fn) {
  B.on(u, 'basicHit', ev => {
    if (!ev.target || !ev.target.alive || !chance(Math.min(.52, base + r * .035))) return;
    fn(ev.target, ev);
  });
}
function trinketDebuffed(t) {
  return !!(t && t.statuses && t.statuses.some(s => STATUS[s.id] && STATUS[s.id].kind === 'debuff'));
}
function trinketRework(id, stat, effect, apply) {
  const t = TRINKETS[id];
  if (!t) return;
  t.stat = stat;
  t.effect = effect;
  t.apply = (u, B, rank) => {
    const r = trinketRankPower(rank);
    apply(u, B, r);
    applyTrinketSignature(u, B, r, t);
  };
}

trinketRework('astro_starpillow', r => `+${(r * 1.4).toFixed(1)}% Healing Power`,
  'Healing an ally below 60% HP grants Regeneration and a small burst of Energy.',
  (u, B, r) => {
    u.flat.healPowP = (u.flat.healPowP || 0) + r * .014; u.dirty = true;
    B.on(u, 'healDone', ev => {
      if (!ev.target || ev.target.team !== u.team || ev.target.hpPct > .60 || !trinketReady(u, B, '_pillowAt', Math.max(2.8, 5.6 - r * .35))) return;
      B.applyStatus(u, ev.target, 'regen', 4 + r * .4, { val: u.st.mag * (.018 + r * .006) });
      B.energy(u, 2 + r);
    });
  });

trinketRework('blot_mimemakeup', r => `+${(r * 1.2).toFixed(1)}% Evasion`,
  'Basic Attacks can Blind the target; blinded targets also take Rend when they hit the wearer.',
  (u, B, r) => {
    u.flat.evaP = (u.flat.evaP || 0) + r * .012; u.dirty = true;
    trinketBasicProc(u, B, r, .07, (t) => B.applyStatus(u, t, 'blind', 1.8 + r * .25));
    B.on(u, 'damaged', ev => {
      if (!ev.dot && ev.src && ev.src.team !== u.team && ev.src.hasStatus('blind') && trinketReady(u, B, '_mimeAt', 3.5))
        B.applyStatus(u, ev.src, 'bleed', 4, { val: u.st.atk * (.018 + r * .006) });
    });
  });

trinketRework('boxten_bluebandana', r => `+${(r * 1.2).toFixed(1)}% Move Speed`,
  'Basic Attacks have a chance to Stun the target briefly and leave its Attack Speed reduced.',
  (u, B, r) => {
    u.flat.msP = (u.flat.msP || 0) + r * .012; u.dirty = true;
    trinketBasicProc(u, B, r, .055, (t) => {
      if (!trinketReady(u, B, '_bandanaAt', Math.max(2.6, 5.2 - r * .32))) return;
      B.applyStatus(u, t, 'stun', .25 + r * .08);
      B.applyStatus(u, t, 'armslow', 2.2 + r * .25);
    });
  });

trinketRework('brightney_sparebulb', r => `+${(r * 1.2).toFixed(1)}% Magic Defense`,
  'When the wearer is badly hurt, flashes Blind enemies nearby and applies Resist Down.',
  (u, B, r) => {
    u.flat.mdefP = (u.flat.mdefP || 0) + r * .012; u.dirty = true;
    B.on(u, 'damaged', () => {
      if (u._bulbUsed || u.hpPct > .42 || !u.alive) return;
      u._bulbUsed = true; B.aoeStatus(u, u.x, 235, 'blind', 2.2 + r * .3);
      B.aoeStatus(u, u.x, 235, 'magdown', 3.5 + r * .4);
      B.applyStatus(u, u, 'fortify', 3 + r * .3); Sound.play('flash', { vol: .35 });
    });
  });

trinketRework('brusha_paintbucket', r => `+${(r * 1.2).toFixed(1)}% Magic Attack`,
  'Basic Attacks can splatter Burn and Defense Down onto the target.',
  (u, B, r) => {
    u.flat.magP = (u.flat.magP || 0) + r * .012; u.dirty = true;
    trinketBasicProc(u, B, r, .08, (t) => {
      if (!trinketReady(u, B, '_paintAt', Math.max(2.4, 4.6 - r * .25))) return;
      B.applyStatus(u, t, 'burn', 4.5 + r * .25, { val: u.st.mag * (.022 + r * .006) });
      B.applyStatus(u, t, 'defdown', 4 + r * .35, { stacks: r >= 4 ? 2 : 1 });
    });
  });

trinketRework('connie_ghostsnakes', r => `+${(r * 1.4).toFixed(1)}% Evasion`,
  'Dodging releases a Ghost Snake that Fears the attacker and grants the wearer Speed Up.',
  (u, B, r) => {
    u.flat.evaP = (u.flat.evaP || 0) + r * .014; u.dirty = true;
    B.on(u, 'dodged', ev => {
      if (!ev.src || !trinketReady(u, B, '_snakeAt', Math.max(2.8, 5.5 - r * .3))) return;
      B.applyStatus(u, ev.src, 'fear', 1.1 + r * .12);
      B.applyStatus(u, u, 'speedup', 2.5 + r * .25);
    });
  });

trinketRework('cosmo_sweetcharm', r => `+${(r * 1.5).toFixed(1)}% Healing Power`,
  'Healing an ally cleanses a debuff; healing a badly hurt ally also grants Receptive and Regeneration.',
  (u, B, r) => {
    u.flat.healPowP = (u.flat.healPowP || 0) + r * .015; u.dirty = true;
    B.on(u, 'healDone', ev => {
      if (!ev.target || ev.target.team !== u.team) return;
      B.cleanse(ev.target, 1);
      if (ev.target.hpPct < .55 && trinketReady(u, B, '_sweetAt', Math.max(2.5, 5 - r * .3))) {
        B.applyStatus(u, ev.target, 'receptive', 3 + r * .3, { val: .10 + r * .018 });
        B.applyStatus(u, ev.target, 'regen', 3 + r * .3, { val: u.st.mag * (.014 + r * .005) });
      }
    });
  });

trinketRework('delilah_preservedspecimen', r => `+${(r * 1.5).toFixed(1)}% Skill Haste`,
  'Periodically strips a removable buff from the enemy with the most buffs, then marks them as a Test Subject.',
  (u, B, r) => {
    u.flat.cdr = (u.flat.cdr || 0) + r * .015; u.dirty = true;
    B.every(u, Math.max(4.5, 7.5 - r * .35), () => {
      const targets = B.enemiesOf(u).filter(e => e.alive);
      if (!targets.length) return;
      const t = targets.sort((a, b) => b.statuses.filter(s => STATUS[s.id] && STATUS[s.id].kind === 'buff').length - a.statuses.filter(s => STATUS[s.id] && STATUS[s.id].kind === 'buff').length)[0];
      if (!t) return;
      const buff = t.statuses.find(s => STATUS[s.id] && STATUS[s.id].kind === 'buff' && !s.sticky && !s.apexLocked);
      if (buff) B.removeStatus(t, buff.id);
      B.applyStatus(u, t, 'testsubject', 7 + r * .7);
      B.fxFloatIcon(t.x, t.y - 88, '🧪', '#bd82ff');
    });
  });

trinketRework('dyle_trainwhistle', r => `+${(r * 1.2).toFixed(1)}% Accuracy`,
  'The first debuff that would land every few seconds is blocked, then the team gains Speed Up and Energy.',
  (u, B, r) => {
    u.flat.accP = (u.flat.accP || 0) + r * .012; u.dirty = true; u.guards = u.guards || [];
    u.guards.push((id, d, battle) => {
      if (battle.t < (u._whistleAt || -Infinity) || !chance(.12 + r * .045)) return false;
      u._whistleAt = battle.t + Math.max(4.5, 8 - r * .35);
      B.alliesOf(u).forEach(a => { B.applyStatus(u, a, 'speedup', 2.5 + r * .2); B.energy(a, 2 + r); });
      return true;
    });
  });

trinketRework('eggson_eggradar', r => `+${(r * 1.3).toFixed(1)}% Accuracy`,
  'Basic Attacks scan the target: repeated scans apply Exposed, Marked, and Defense Down.',
  (u, B, r) => {
    u.flat.accP = (u.flat.accP || 0) + r * .013; u.dirty = true; u._eggScans = 0;
    B.on(u, 'basicHit', ev => {
      if (!ev.target) return;
      u._eggScans++;
      if (u._eggScans % Math.max(2, 5 - Math.floor(r / 2)) === 0) {
        B.applyStatus(u, ev.target, 'exposed', 3.5 + r * .25);
        B.applyStatus(u, ev.target, 'marked', 4 + r * .25);
        if (r >= 3) B.applyStatus(u, ev.target, 'defdown', 3.5, { stacks: 1 });
      }
    });
  });

trinketRework('gigi_luckycoin', r => `+${(r * .8).toFixed(1)}% Crit Chance`,
  'Basic Attacks can flip the coin: restore Energy and grant Lucky; against debuffed targets, deal bonus Magic damage.',
  (u, B, r) => {
    u.flat.crit = (u.flat.crit || 0) + r * .008; u.dirty = true;
    trinketBasicProc(u, B, r, .07, (t) => {
      B.energy(u, 4 + r * 2); B.applyStatus(u, u, 'lucky', 2.5 + r * .2);
      if (trinketDebuffed(t)) B.damage(u, t, u.st.mag * (.05 + r * .012), { type: 'magic', tag: 'Lucky Coin' });
    });
  });

trinketRework('looey_clownhorn', r => `+${(r * 1.2).toFixed(1)}% Attack Speed`,
  'Taking a hit can Taunt and Stun the attacker; the wearer gains Fortify after the joke lands.',
  (u, B, r) => {
    u.flat.aspdP = (u.flat.aspdP || 0) + r * .012; u.dirty = true;
    B.on(u, 'damaged', ev => {
      if (ev.dot || !ev.src || ev.src.team === u.team || !trinketReady(u, B, '_hornAt', Math.max(2.8, 5.4 - r * .3)) || !chance(.12 + r * .035)) return;
      B.applyStatus(u, ev.src, 'taunt', 2 + r * .2); B.applyStatus(u, ev.src, 'stun', .22 + r * .06);
      B.applyStatus(u, u, 'fortify', 3 + r * .3);
    });
  });

trinketRework('poppy_pinkbow', r => `+${(r * 2).toFixed(1)}% Crit Damage`,
  'Critical hits Slow the target; striking a slowed target can Stun it and apply Rend.',
  (u, B, r) => {
    u.flat.critDmg = (u.flat.critDmg || 0) + r * .02; u.dirty = true;
    B.on(u, 'dealDamage', ev => {
      if (!ev.target || ev.dot || !ev.crit || !trinketReady(u, B, '_bowAt', Math.max(2.2, 4.8 - r * .25))) return;
      const wasSlow = ev.target.hasStatus('slow');
      B.applyStatus(u, ev.target, 'slow', 2 + r * .25);
      B.applyStatus(u, ev.target, 'bleed', 3.5 + r * .2, { val: u.st.atk * (.018 + r * .005) });
      if (wasSlow) B.applyStatus(u, ev.target, 'stun', .24 + r * .06);
    });
  });

trinketRework('scraps_crayonset', r => `+${(r * 1.6).toFixed(1)}% Attack Speed`,
  'Basic Attacks paint a random weakness; every few hits also grants Sharp Inspiration.',
  (u, B, r) => {
    u.flat.aspdP = (u.flat.aspdP || 0) + r * .016; u.dirty = true; u._crayonHits = 0;
    B.on(u, 'basicHit', ev => {
      if (!ev.target) return;
      u._crayonHits++;
      if (chance(.10 + r * .025)) B.applyStatus(u, ev.target, pick(['defdown', 'weaken', 'magdown']), 3.5 + r * .2);
      if (u._crayonHits >= Math.max(3, 7 - Math.floor(r))) { u._crayonHits = 0; B.applyStatus(u, u, 'artfury', 3 + r * .3); }
    });
  });

trinketRework('shelly_participation', r => `+${(r * 1.3).toFixed(1)}% Max HP`,
  'Basic Attacks Mark targets; hitting a Marked target builds Research and applies Exposed for the team.',
  (u, B, r) => {
    u.flat.hpP = (u.flat.hpP || 0) + r * .013; u.dirty = true;
    trinketBasicProc(u, B, r, .12, (t) => B.applyStatus(u, t, 'marked', 3.5 + r * .25));
    B.on(u, 'dealDamage', ev => {
      if (!ev.target || ev.dot || !ev.target.hasStatus('marked') || !trinketReady(u, B, '_shellyAt', Math.max(1.8, 3.8 - r * .2))) return;
      B.applyStatus(u, ev.target, 'research', 5 + r * .3);
      B.applyStatus(u, ev.target, 'exposed', 2.5 + r * .2);
      B.energy(u, 2 + r);
    });
  });

trinketRework('shrimpo_brick', r => `+${(r * 1.5).toFixed(1)}% Defense`,
  'Melee attackers can be Stunned and Weakened by the Brick; the wearer gains Fortify.',
  (u, B, r) => {
    u.flat.defP = (u.flat.defP || 0) + r * .015; u.dirty = true;
    B.on(u, 'damaged', ev => {
      if (ev.dot || !ev.melee || !ev.src || ev.src.team === u.team || !trinketReady(u, B, '_brickAt', Math.max(2.5, 5 - r * .25)) || !chance(.12 + r * .035)) return;
      B.applyStatus(u, ev.src, 'stun', .28 + r * .07); B.applyStatus(u, ev.src, 'weaken', 3 + r * .25);
      B.applyStatus(u, u, 'fortify', 3 + r * .25);
    });
  });

trinketRework('squirm_stressball', r => `+${(r * 1.3).toFixed(1)}% Max HP`,
  'Below half HP, incoming hits are softened; once per cooldown the attacker also takes Rend damage.',
  (u, B, r) => {
    u.flat.hpP = (u.flat.hpP || 0) + r * .013; u.dirty = true;
    B.on(u, 'damaged', ev => {
      if (u.hpPct >= .5 || ev.dot) return;
      ev.amount *= Math.max(.62, 1 - r * .045);
      if (ev.src && ev.src.team !== u.team && trinketReady(u, B, '_stressAt', Math.max(2.5, 5 - r * .25)))
        B.applyStatus(u, ev.src, 'bleed', 4, { val: u.st.def * (.018 + r * .006) });
    });
  });

trinketRework('toodles_dogplush', r => `+${(r * 1.2).toFixed(1)}% Healing Power`,
  'Healing an ally restores their Energy and can grant them Speed Up and a cleanse.',
  (u, B, r) => {
    u.flat.healPowP = (u.flat.healPowP || 0) + r * .012; u.dirty = true;
    B.on(u, 'healDone', ev => {
      if (!ev.target || ev.target.team !== u.team || !trinketReady(u, B, '_plushAt', Math.max(1.8, 3.8 - r * .2))) return;
      B.energy(ev.target, 2 + r); B.applyStatus(u, ev.target, 'speedup', 2 + r * .2);
      if (ev.target.hpPct < .6) B.cleanse(ev.target, 1);
    });
  });

trinketRework('tisha_featherduster', r => `+${(r * 1.2).toFixed(1)}% Accuracy`,
  'Basic Attacks tidy the target: push it, apply Misplaced and Defense Down, then briefly Root it at higher ranks.',
  (u, B, r) => {
    u.flat.accP = (u.flat.accP || 0) + r * .012; u.dirty = true;
    trinketBasicProc(u, B, r, .12, (t) => {
      if (!trinketReady(u, B, '_dusterAt', Math.max(2.8, 5.8 - r * .3))) return;
      B.knockback(u, t, 32 + r * 10); B.applyStatus(u, t, 'misplaced', 3 + r * .25);
      B.applyStatus(u, t, 'defdown', 3.5 + r * .25);
      if (r >= 3) B.applyStatus(u, t, 'root', .7 + r * .1);
    });
  });

trinketRework('vee_veemote', r => `+${(r * 1.2).toFixed(1)}% Accuracy`,
  'Basic Attacks can Expose and Burn a target; hitting an already Exposed target grants Focus.',
  (u, B, r) => {
    u.flat.accP = (u.flat.accP || 0) + r * .012; u.dirty = true;
    trinketBasicProc(u, B, r, .08, (t) => {
      const exposed = t.hasStatus('exposed');
      B.applyStatus(u, t, 'exposed', 3.5 + r * .25);
      B.applyStatus(u, t, 'burn', 3.5 + r * .25, { val: u.st.atk * (.018 + r * .005) });
      if (exposed) B.applyStatus(u, u, 'focus', 2.5 + r * .2);
    });
  });

trinketRework('yatta_partypopper', r => `+${(r * 1.3).toFixed(1)}% Attack Speed`,
  'Critical Hits pop Haste and Energy; the next Basic Attack can Stun the target.',
  (u, B, r) => {
    u.flat.aspdP = (u.flat.aspdP || 0) + r * .013; u.dirty = true; u._popperReady = 0;
    B.on(u, 'dealDamage', ev => {
      if (!ev.crit || ev.dot || !trinketReady(u, B, '_popperAt', Math.max(2.2, 4.5 - r * .22))) return;
      u._popperReady = B.t + 5; B.applyStatus(u, u, 'haste', 2.5 + r * .2); B.energy(u, 3 + r);
    });
    B.on(u, 'basicHit', ev => {
      if (!ev.target || !u._popperReady || B.t > u._popperReady) return;
      u._popperReady = 0; B.applyStatus(u, ev.target, 'stun', .24 + r * .06);
    });
  });

trinketRework('cocoa_fondantbag', r => `+${(r * 1.5).toFixed(1)}% Shield Power`,
  'Shielding an ally grants Receptive and Regeneration; badly hurt allies also gain Fortify.',
  (u, B, r) => {
    u.flat.shieldPowP = (u.flat.shieldPowP || 0) + r * .015; u.dirty = true;
    B.on(u, 'shieldDone', ev => {
      if (!ev.target || ev.target.team !== u.team) return;
      B.applyStatus(u, ev.target, 'receptive', 3 + r * .25, { val: .10 + r * .018 });
      if (ev.target.hpPct < .55) B.applyStatus(u, ev.target, 'fortify', 2.5 + r * .2);
      B.applyStatus(u, ev.target, 'regen', 3 + r * .2, { val: u.st.mag * (.012 + r * .004) });
    });
  });

trinketRework('bobette_windupbell', r => `+${(r * 1.2).toFixed(1)}% Attack Speed`,
  'Casting a Skill rings the team bell: allies gain Attack Up and Speed Up, with a short cooldown.',
  (u, B, r) => {
    u.flat.aspdP = (u.flat.aspdP || 0) + r * .012; u.dirty = true;
    B.on(u, 'cast', () => {
      if (!trinketReady(u, B, '_bellAt', Math.max(4.5, 9 - r * .4))) return;
      B.alliesOf(u).forEach(a => { B.applyStatus(u, a, 'atkup', 2.5 + r * .2); B.applyStatus(u, a, 'speedup', 2 + r * .2); });
      Sound.play('ding', { vol: .28 });
    });
  });

trinketRework('coal_cinderchunk', r => `+${(r * 1.5).toFixed(1)}% Defense`,
  'Melee attackers are Burned and given Defense Down; the wearer gains Thorns while the ember is hot.',
  (u, B, r) => {
    u.flat.defP = (u.flat.defP || 0) + r * .015; u.dirty = true;
    B.on(u, 'damaged', ev => {
      if (ev.dot || !ev.melee || !ev.src || ev.src.team === u.team || !trinketReady(u, B, '_coalAt', Math.max(2.5, 5 - r * .3))) return;
      B.applyStatus(u, ev.src, 'burn', 4 + r * .25, { val: u.st.atk * (.025 + r * .006) });
      B.applyStatus(u, ev.src, 'defdown', 3 + r * .25); B.applyStatus(u, u, 'thorns', 2.5 + r * .2, { val: u.st.def * (.22 + r * .04) });
    });
  });

trinketRework('ginger_pepperminticing', r => `+${(r * 1.5).toFixed(1)}% Healing Power`,
  'Healing an ally applies Attack Up and Speed Up; a badly hurt ally also receives a cleansing Freshly Baked boost.',
  (u, B, r) => {
    u.flat.healPowP = (u.flat.healPowP || 0) + r * .015; u.dirty = true;
    B.on(u, 'healDone', ev => {
      if (!ev.target || ev.target.team !== u.team || !trinketReady(u, B, '_icingAt', Math.max(1.8, 4 - r * .2))) return;
      B.applyStatus(u, ev.target, 'atkup', 2.5 + r * .2); B.applyStatus(u, ev.target, 'speedup', 2.5 + r * .2);
      if (ev.target.hpPct < .5) B.applyStatus(u, ev.target, 'freshlybaked', 3 + r * .25);
    });
  });

trinketRework('bassie_basketpin', r => `+${(r * 1.5).toFixed(1)}% Max HP`,
  'An ally below 40% HP receives a Shield, Fortify, and a brief Energy refill; the attacker is Taunted.',
  (u, B, r) => {
    u.flat.hpP = (u.flat.hpP || 0) + r * .015; u.dirty = true;
    B.on(u, 'allyLow', a => {
      if (!a || a.team !== u.team || !trinketReady(u, B, '_basketAt', Math.max(5, 10 - r * .4))) return;
      B.shield(u, a, u.max.hp * (.035 + r * .012), 5 + r * .25); B.applyStatus(u, a, 'fortify', 3 + r * .2); B.energy(a, 3 + r);
      const foe = B.nearest(a, B.enemiesOf(u)); if (foe) B.applyStatus(u, foe, 'taunt', 2.5 + r * .2);
    });
  });

trinketRework('rudie_festivelights', r => `+${(r * 1.2).toFixed(1)}% Accuracy`,
  'Using an Ultimate blinds the highest-Energy enemy, applies Burn, and briefly speeds the team.',
  (u, B, r) => {
    u.flat.accP = (u.flat.accP || 0) + r * .012; u.dirty = true;
    B.on(u, 'cast', ev => {
      if (ev.key !== 'W' || !trinketReady(u, B, '_lightsAt', Math.max(2.5, 5 - r * .25))) return;
      const t = B.highestEnergy(B.enemiesOf(u));
      if (t) { B.applyStatus(u, t, 'blind', 1.6 + r * .2); B.applyStatus(u, t, 'burn', 3.5 + r * .2, { val: u.st.mag * (.022 + r * .006) }); }
      B.alliesOf(u).forEach(a => B.applyStatus(u, a, 'speedup', 2 + r * .2));
    });
  });

trinketRework('sprout_savorycharm', r => `+${(r * 1.8).toFixed(1)}% Healing Power`,
  'Every few heals grants the healed ally Energy and Rally; the next heal on a full-health ally shields them.',
  (u, B, r) => {
    u.flat.healPowP = (u.flat.healPowP || 0) + r * .018; u.dirty = true; u._savoryHeals = 0;
    B.on(u, 'healDone', ev => {
      if (!ev.target || ev.target.team !== u.team) return;
      u._savoryHeals++;
      if (u._savoryHeals >= Math.max(2, 5 - Math.floor(r))) { u._savoryHeals = 0; B.energy(ev.target, 3 + r * 2); B.applyStatus(u, ev.target, 'rally', 2.5 + r * .2); }
      if (ev.target.hpPct > .98 && trinketReady(u, B, '_savoryAt', 5)) B.shield(u, ev.target, u.st.mag * (.06 + r * .015), 5);
    });
  });

trinketRework('flyte_scrapbook', r => `+${(r * 1.4).toFixed(1)}% Evasion`,
  'Dodging grants the weakest ally a Shield and Speed Up; at higher ranks it also cleanses one debuff.',
  (u, B, r) => {
    u.flat.evaP = (u.flat.evaP || 0) + r * .014; u.dirty = true;
    B.on(u, 'dodged', () => {
      if (!trinketReady(u, B, '_scrapbookAt', Math.max(3.5, 7 - r * .35))) return;
      const a = B.lowestHp(B.alliesOf(u));
      if (!a) return;
      B.applyStatus(u, a, 'speedup', 2.5 + r * .2); B.shield(u, a, u.st.mag * (.06 + r * .014), 4.5 + r * .25);
      if (r >= 3) B.cleanse(a, 1);
    });
  });

trinketRework('rodger_magnifyingglass', r => `+${(r * 1.6).toFixed(1)}% Accuracy`,
  'Basic Attacks investigate targets; the final investigation applies Marked, Exposed, and Defense Down.',
  (u, B, r) => {
    u.flat.accP = (u.flat.accP || 0) + r * .016; u.dirty = true; u._glassHits = {};
    B.on(u, 'basicHit', ev => {
      if (!ev.target) return;
      const key = ev.target.uid || ev.target.id; u._glassHits[key] = (u._glassHits[key] || 0) + 1;
      if (u._glassHits[key] >= Math.max(2, 5 - Math.floor(r / 2))) {
        u._glassHits[key] = 0; B.applyStatus(u, ev.target, 'marked', 4 + r * .25); B.applyStatus(u, ev.target, 'exposed', 3 + r * .25); B.applyStatus(u, ev.target, 'defdown', 3.5 + r * .2);
        B.energy(u, 2 + r);
      }
    });
  });

trinketRework('soulvester_soulsword', r => `+${(r * 1.5).toFixed(1)}% Attack`,
  'Defeating an enemy heals the wearer, grants Attack Up, and marks the next enemy for extra damage.',
  (u, B, r) => {
    u.flat.atkP = (u.flat.atkP || 0) + r * .015; u.dirty = true;
    B.on(u, 'enemyDown', () => {
      B.heal(u, u, u.max.hp * (.035 + r * .012), { tag: 'Soul Sword' }); B.applyStatus(u, u, 'atkup', 3.5 + r * .25); B.applyStatus(u, u, 'haste', 2 + r * .15);
      const t = B.lowestHp(B.enemiesOf(u)); if (t) B.applyStatus(u, t, 'marked', 4 + r * .25);
    });
  });

trinketRework('gourdy_candywrapper', r => `+${(r * 1.3).toFixed(1)}% Attack Speed`,
  'Every few Basic Attacks unwraps a random boost; at higher ranks the wrapper also affects the nearest ally.',
  (u, B, r) => {
    u.flat.aspdP = (u.flat.aspdP || 0) + r * .013; u.dirty = true; u._wrapperHits = 0;
    B.on(u, 'basicHit', () => {
      if (++u._wrapperHits < Math.max(2, 6 - Math.floor(r))) return;
      u._wrapperHits = 0; const status = pick(['speedup', 'atkup', 'fortify', 'focus']); B.applyStatus(u, u, status, 3 + r * .25, { stacks: 1 });
      if (r >= 3) { const a = B.alliesOf(u).find(x => x !== u); if (a) B.applyStatus(u, a, status, 2.5 + r * .2, { stacks: 1 }); }
    });
  });

trinketRework('eclipse_moonfragment', r => `+${(r * 1.2).toFixed(1)}% Attack · +${(r * .8).toFixed(1)}% Crit Chance`,
  'The fragment periodically marks the lowest-HP prey with Moonlit Hunt, Blinds and Drains it, then rewards Eclipse for staying on that target. Repeated hits build Rend and Defense Down; a confirmed KO restores Energy, cuts cooldowns, and chains the mark to the next weakest enemy. Entering Blackout upgrades the current hunt and briefly accelerates Eclipse.',
  (u, B, r) => {
    u.flat.atkP = (u.flat.atkP || 0) + r * .012;
    u.flat.crit = (u.flat.crit || 0) + r * .008;
    u.flat.msP = (u.flat.msP || 0) + r * .006;
    u.dirty = true;
    u._moonFragmentHits = 0; u._moonFragmentPrey = null; u._moonFragmentChain = 0;

    const markPrey = (t, dur) => {
      if (!t || !t.alive) return;
      u._moonFragmentPrey = t;
      B.applyStatus(u, t, 'marked', dur || 5 + r * .25);
      B.applyStatus(u, t, 'exposed', 2.5 + r * .25);
      B.fxFloatIcon(t.x, t.y - 88, '🌘', '#a993ff');
    };

    // The fragment chooses a vulnerable target instead of a random one, making
    // the trinket feed Eclipse's existing execution and Focus behavior.
    const moonPulse = () => {
      const t = B.lowestHp(B.enemiesOf(u)); if (!t) return;
      markPrey(t, 5.5 + r * .25);
      B.applyStatus(u, t, 'blind', 1.6 + r * .22);
      B.applyStatus(u, t, 'drain', 2.5 + r * .3);
      B.energy(t, -(3 + r * 1.8));
      if (trinketDebuffed(t)) B.applyStatus(u, t, 'defdown', 3.5 + r * .25);
    };
    B.after(.25, moonPulse);
    B.every(u, Math.max(4.5, 8 - r * .35), moonPulse);

    // Staying on the marked target turns ordinary attacks into a setup rather
    // than making the trinket a one-button burst. The threshold tightens as it
    // ranks up, while the reward grows with rank.
    B.on(u, 'basicHit', ev => {
      const t = ev.target;
      if (!t || t !== u._moonFragmentPrey || !t.alive || !t.statuses.some(s => s.id === 'marked' && s.src === u)) return;
      u._moonFragmentHits++;
      if (u._moonFragmentHits < Math.max(2, 5 - Math.floor(r / 1.6))) return;
      u._moonFragmentHits = 0;
      B.applyStatus(u, t, 'bleed', 4.5 + r * .2, { stacks: 1 + Math.floor(r / 3), val: u.st.atk * (.035 + r * .006) });
      B.applyStatus(u, t, 'defdown', 4 + r * .25, { stacks: 1 });
      B.energy(u, 2 + r * .8);
      B.fxFloatIcon(t.x, t.y - 104, '✦', '#c6b7ff');
    });

    // Eclipse's skill loop gets a small, rank-scaled acceleration when she
    // commits to the marked hunt. It is cooldown-gated so multi-hit skills do
    // not repeatedly trigger the reward.
    B.on(u, 'cast', ev => {
      if (!['W', 'G', 'B'].includes(ev.key) || !trinketReady(u, B, '_moonFragmentCastAt', Math.max(2.2, 4.8 - r * .25))) return;
      B.applyStatus(u, u, 'speedup', 2.5 + r * .25, { stacks: 1 });
      B.applyStatus(u, u, 'haste', 2.5 + r * .25, { stacks: 1 });
      if (u._moonFragmentPrey && u._moonFragmentPrey.alive) markPrey(u._moonFragmentPrey, 4 + r * .2);
    });

    B.on(u, 'statusApplied', ev => {
      if (ev.unit !== u || ev.id !== 'blackout') return;
      u._moonFragmentChain = Math.min(5, (u._moonFragmentChain || 0) + 1);
      B.energy(u, 4 + r * 1.5);
      B.applyStatus(u, u, 'speedup', 3 + r * .3, { stacks: 2 });
      if (u._moonFragmentPrey && u._moonFragmentPrey.alive) {
        B.applyStatus(u, u._moonFragmentPrey, 'exposed', 4 + r * .25, { stacks: 2 });
        B.applyStatus(u, u._moonFragmentPrey, 'blind', 1.8 + r * .18);
      }
    });

    B.on(u, 'enemyDown', e => {
      if (!e || e._lastHitBy !== u || e !== u._moonFragmentPrey) return;
      u._moonFragmentHits = 0;
      u._moonFragmentChain = Math.min(5, (u._moonFragmentChain || 0) + 1);
      B.energy(u, 7 + r * 2);
      B.reduceCd(u, 1.2 + r * .25);
      B.applyStatus(u, u, 'speedup', 3.5 + r * .25, { stacks: 1 + Math.floor(r / 2.5) });
      const next = B.lowestHp(B.enemiesOf(u));
      if (next) {
        markPrey(next, 4.5 + r * .25);
        if (u.hasStatus('blackout')) {
          B.damage(u, next, u.st.atk * (.14 + r * .018 + u._moonFragmentChain * .012), { type: 'physical', tag: 'Moon Fragment Pounce' });
          B.applyStatus(u, next, 'defdown', 3.5 + r * .2);
        }
      }
      B.fxFloatIcon(u.x, u.y - 108, '🌑', '#a993ff');
    });
  });

trinketRework('goob_friendshipbracelet', r => `+${(r * 1.5).toFixed(1)}% Shield Power`,
  'Shielding another ally grants the wearer a matching partial Shield and makes the ally Receptive.',
  (u, B, r) => {
    u.flat.shieldPowP = (u.flat.shieldPowP || 0) + r * .015; u.dirty = true;
    B.on(u, 'shieldDone', ev => {
      if (!ev.target || ev.target === u || !trinketReady(u, B, '_braceletAt', Math.max(2.5, 4.8 - r * .2))) return;
      B.shield(u, u, ev.amount * Math.min(.48, .20 + r * .045), 5 + r * .2); B.applyStatus(u, ev.target, 'receptive', 3 + r * .25, { val: .11 + r * .016 });
    });
  });

trinketRework('waxwell_cherishedblanket', r => `+${(r * 1.5).toFixed(1)}% Magic Defense`,
  'Once per battle below half HP, gain Ward, cleanse two debuffs, and regenerate over time.',
  (u, B, r) => {
    u.flat.mdefP = (u.flat.mdefP || 0) + r * .015; u.dirty = true;
    B.on(u, 'damaged', () => {
      if (u._blanketUsed || u.hpPct >= .5) return;
      u._blanketUsed = true; B.applyStatus(u, u, 'ward', 3 + r * .3); B.applyStatus(u, u, 'regen', 5 + r * .3, { val: u.max.hp * (.012 + r * .003) }); B.cleanse(u, 2);
    });
  });

trinketRework('finn_fishingrod', r => `+${(r * 1.4).toFixed(1)}% Accuracy`,
  'Periodically Hooks the farthest enemy, then Roots and Slows it; if it is already debuffed, it also takes Rend.',
  (u, B, r) => {
    u.flat.accP = (u.flat.accP || 0) + r * .014; u.dirty = true;
    B.every(u, Math.max(5.5, 9 - r * .3), () => {
      const foes = B.enemiesOf(u).filter(e => !e.immovable); if (!foes.length) return;
      const t = foes.slice().sort((a, b) => B.distance(b, u) - B.distance(a, u))[0];
      B.pull(t, t.x - t.face * (30 + r * 8), .24, t.depth); B.applyStatus(u, t, 'root', .7 + r * .1); B.applyStatus(u, t, 'slow', 2.5 + r * .25);
      if (trinketDebuffed(t)) B.applyStatus(u, t, 'bleed', 3.5 + r * .2, { val: u.st.atk * (.018 + r * .005) });
    });
  });

trinketRework('dandy_dandyplush', r => `+${(r * 1.4).toFixed(1)}% Max HP`,
  'When an enemy hurts another ally, it gains Attention, Weaken, and Defense Down; Dandy gains Energy.',
  (u, B, r) => {
    u.flat.hpP = (u.flat.hpP || 0) + r * .014; u.dirty = true;
    B.on(u, 'allyDamaged', ev => {
      if (!ev.src || ev.unit === u || ev.src.team === u.team || !trinketReady(u, B, '_plushAt', Math.max(1.8, 3.8 - r * .2))) return;
      B.applyStatus(u, ev.src, 'attention', 3.5 + r * .25, { stacks: 1 }); B.applyStatus(u, ev.src, 'weaken', 2.5 + r * .2); B.applyStatus(u, ev.src, 'defdown', 2.5 + r * .2); B.energy(u, 2 + r);
    });
  });

trinketRework('pebble_bone', r => `+${(r * 1.4).toFixed(1)}% Move Speed`,
  'Every few Basic Attacks grants Excited and Speed Up; the next hit can briefly Stun the target.',
  (u, B, r) => {
    u.flat.msP = (u.flat.msP || 0) + r * .014; u.dirty = true; u._boneHits = 0; u._boneStun = false;
    B.on(u, 'basicHit', ev => {
      if (!ev.target) return;
      u._boneHits++;
      if (u._boneHits >= Math.max(2, 5 - Math.floor(r / 2))) { u._boneHits = 0; u._boneStun = true; B.applyStatus(u, u, 'excited', 4 + r * .25); B.applyStatus(u, u, 'speedup', 3 + r * .2); }
      if (u._boneStun) { u._boneStun = false; B.applyStatus(u, ev.target, 'stun', .22 + r * .06); }
    });
  });

trinketRework('sora_paopucharm', r => `+${(r * 1.5).toFixed(1)}% Attack`,
  'Every few Basic Attacks grants Haste and Energy; the charged hit also applies Defense Down and Exposed.',
  (u, B, r) => {
    u.flat.atkP = (u.flat.atkP || 0) + r * .015; u.dirty = true; u._paopuHits = 0; u._paopuReady = false;
    B.on(u, 'basicHit', ev => {
      if (!ev.target) return;
      u._paopuHits++;
      if (u._paopuHits >= Math.max(3, 6 - Math.floor(r / 2))) { u._paopuHits = 0; u._paopuReady = true; B.applyStatus(u, u, 'haste', 2.5 + r * .2); B.energy(u, 3 + r * 2); }
      if (u._paopuReady) { u._paopuReady = false; B.applyStatus(u, ev.target, 'defdown', 3.5 + r * .25); B.applyStatus(u, ev.target, 'exposed', 3 + r * .2); }
    });
  });

trinketRework('riku_wayfindershard', r => `+${(r * 1.5).toFixed(1)}% Magic Defense`,
  'Once per battle below half HP, gain Ward and Haste; the enemy that triggered it is Weakened and Feared.',
  (u, B, r) => {
    u.flat.mdefP = (u.flat.mdefP || 0) + r * .015; u.dirty = true;
    B.on(u, 'damaged', ev => {
      if (u._wayfinderUsed || u.hpPct >= .5) return;
      u._wayfinderUsed = true; B.applyStatus(u, u, 'ward', 3 + r * .25); B.applyStatus(u, u, 'haste', 3 + r * .2); B.cleanse(u, 1);
      if (ev.src && ev.src.team !== u.team) { B.applyStatus(u, ev.src, 'weaken', 3 + r * .25); B.applyStatus(u, ev.src, 'fear', 1 + r * .1); }
    });
  });

trinketRework('kairi_luckycharm', r => `+${(r * 1.5).toFixed(1)}% Healing Power`,
  'Using an Ultimate heals the weakest ally, cleanses them, and grants Accuracy Up and Rally.',
  (u, B, r) => {
    u.flat.healPowP = (u.flat.healPowP || 0) + r * .015; u.dirty = true;
    B.on(u, 'cast', ev => {
      if (ev.key !== 'W') return;
      const a = B.lowestHp(B.alliesOf(u)); if (!a) return;
      B.heal(u, a, u.st.mag * (.09 + r * .012), { tag: 'Lucky Charm' }); B.cleanse(a, 1); B.applyStatus(u, a, 'accup', 2.5 + r * .2); B.applyStatus(u, a, 'rally', 2 + r * .2);
    });
  });

trinketRework('goofy_shieldemblem', r => `+${(r * 1.5).toFixed(1)}% Defense`,
  'Periodically Blocks a Basic Attack, then Stuns and Defense Downs the attacker.',
  (u, B, r) => {
    u.flat.defP = (u.flat.defP || 0) + r * .015; u.dirty = true;
    B.on(u, 'damaged', ev => {
      if (!ev.basic || ev.dot || !ev.src || ev.src.team === u.team || !trinketReady(u, B, '_emblemAt', Math.max(3.5, 7 - r * .35))) return;
      ev.amount *= Math.max(.38, .72 - r * .065); B.applyStatus(u, ev.src, 'stun', .28 + r * .06); B.applyStatus(u, ev.src, 'defdown', 3 + r * .2); B.applyStatus(u, u, 'fortify', 2.5 + r * .2);
    });
  });

trinketRework('phantasia_unicornemblem', r => `+${(r * 1.5).toFixed(1)}% Skill Haste`,
  'Periodically grants a random ally a powerful Wish; debuffed allies are cleansed first.',
  (u, B, r) => {
    u.flat.cdr = (u.flat.cdr || 0) + r * .015; u.dirty = true;
    B.every(u, Math.max(5.5, 9 - r * .3), () => {
      const allies = B.alliesOf(u); if (!allies.length) return;
      const a = allies.slice().sort((x, y) => x.hpPct - y.hpPct)[0];
      if (a.statuses.some(s => STATUS[s.id] && STATUS[s.id].kind === 'debuff')) B.cleanse(a, 2);
      B.applyStatus(u, a, pick(['speedwish', 'braverywish', 'computerwish']), 2.8 + r * .25); B.energy(a, 2 + r);
    });
  });

trinketRework('unknown_brassbriefcase', r => `+${(r * 2.6).toFixed(1)}% Attack and Magic Attack`,
  'Basic Attacks against debuffed enemies deal bonus Magic damage, apply Defense Down, and restore Energy.',
  (u, B, r) => {
    u.flat.atkP = (u.flat.atkP || 0) + r * .026; u.flat.magP = (u.flat.magP || 0) + r * .026; u.dirty = true;
    trinketBasicProc(u, B, r, .16, (t) => {
      if (!trinketDebuffed(t)) return;
      B.damage(u, t, u.st.mag * (.10 + r * .025), { type: 'magic', tag: 'Brass Briefcase' }); B.applyStatus(u, t, 'defdown', 3 + r * .2); B.energy(u, 3 + r);
    });
  });

trinketRework('unknown_contractclip', r => `+${(r * 2.4).toFixed(1)}% Defense and Magic Defense`,
  'The first time each battle the wearer falls below 45% HP, gain Ward, a heavy Shield, and cleanse three debuffs.',
  (u, B, r) => {
    u.flat.defP = (u.flat.defP || 0) + r * .024; u.flat.mdefP = (u.flat.mdefP || 0) + r * .024; u.dirty = true;
    B.on(u, 'damaged', () => {
      if (u._contractUsed || u.hpPct > .45 || !u.alive) return;
      u._contractUsed = true; B.cleanse(u, 3); B.applyStatus(u, u, 'ward', 3.5 + r * .25); B.shield(u, u, u.max.hp * (.18 + r * .03), 7 + r * .3);
    });
  });

trinketRework('unknown_inkseal', r => `+${(r * 2.5).toFixed(1)}% Accuracy and Evasion`,
  'Basic Attacks against debuffed enemies deal bonus Magic damage, apply Rend, and extend their longest debuff.',
  (u, B, r) => {
    u.flat.accP = (u.flat.accP || 0) + r * .025; u.flat.evaP = (u.flat.evaP || 0) + r * .025; u.dirty = true;
    B.on(u, 'basicHit', ev => {
      if (!ev.target || !trinketDebuffed(ev.target)) return;
      B.damage(u, ev.target, u.st.mag * (.10 + r * .025), { type: 'magic', tag: 'Ink Seal' }); B.applyStatus(u, ev.target, 'bleed', 3.5 + r * .2, { val: u.st.atk * (.018 + r * .005) });
      const debuff = ev.target.statuses.filter(s => STATUS[s.id] && STATUS[s.id].kind === 'debuff').sort((a, b) => b.t - a.t)[0]; if (debuff) debuff.t += .4 + r * .12;
    });
  });

trinketRework('unknown_goldenstamp', r => `+${(r * 2.2).toFixed(1)}% Skill Haste`,
  'Casting a Skill grants Attack Up and Speed Up; the first cast refunds Energy and applies Focus.',
  (u, B, r) => {
    u.flat.cdr = (u.flat.cdr || 0) + r * .022; u.dirty = true; u._stampCast = false;
    B.on(u, 'cast', () => {
      B.applyStatus(u, u, 'atkup', 3 + r * .3); B.applyStatus(u, u, 'speedup', 3 + r * .3);
      if (!u._stampCast) { u._stampCast = true; B.energy(u, 14 + r * 4); B.applyStatus(u, u, 'focus', 3 + r * .25); }
    });
  });

trinketRework('badge_of_law', r => `+${(r * 2.7).toFixed(1)}% Defense and Magic Defense`,
  'Applying a debuff grants Energy and a Shield; Convicted enemies take extra damage from the wearer.',
  (u, B, r) => {
    u.flat.defP = (u.flat.defP || 0) + r * .027; u.flat.mdefP = (u.flat.mdefP || 0) + r * .027; u.dirty = true;
    B.on(u, 'statusApplied', ev => {
      if (ev.src !== u || ev.id === 'convicted' || !ev.unit || ev.unit.team === u.team || !STATUS[ev.id] || STATUS[ev.id].kind !== 'debuff' || !trinketReady(u, B, '_lawAt', Math.max(2.5, 5 - r * .25))) return;
      B.energy(u, 4 + r * 2); B.shield(u, u, u.max.hp * (.04 + r * .01), 3.5 + r * .25); B.applyStatus(u, ev.unit, 'convicted', 3 + r * .3);
    });
    B.on(u, 'dealDamage', ev => { if (ev.target && ev.target.hasStatus('convicted') && !ev.dot) ev.amount *= 1 + r * .04; });
  });

trinketRework('badge_of_the_market', r => `+${(r * 2.6).toFixed(1)}% Attack and Magic Attack`,
  'Applying a debuff grants Energy and Inspire; Basic Attacks against that target deal bonus damage.',
  (u, B, r) => {
    u.flat.atkP = (u.flat.atkP || 0) + r * .026; u.flat.magP = (u.flat.magP || 0) + r * .026; u.dirty = true;
    B.on(u, 'statusApplied', ev => { if (ev.src === u && ev.unit && ev.unit.team !== u.team && STATUS[ev.id] && STATUS[ev.id].kind === 'debuff') { B.energy(u, 3 + r); B.applyStatus(u, u, 'inspire', 2 + r * .2); } });
    B.on(u, 'basicHit', ev => { if (ev.target && trinketDebuffed(ev.target)) B.damage(u, ev.target, u.st.atk * (.035 + r * .01), { type: 'physical', tag: 'Market Badge' }); });
  });

trinketRework('badge_of_money', r => `+${(r * 2.7).toFixed(1)}% Max HP and Shield Power`,
  'Hitting a low-Energy or buffed enemy grants a Shield and Energy; the next hit applies Drain.',
  (u, B, r) => {
    u.flat.hpP = (u.flat.hpP || 0) + r * .027; u.flat.shieldPowP = (u.flat.shieldPowP || 0) + r * .027; u.dirty = true;
    B.on(u, 'dealDamage', ev => {
      const t = ev.target;
      if (!t || ev.dot || t.energy > t.energyMax * .55 && !t.statuses.some(s => STATUS[s.id] && STATUS[s.id].kind === 'buff') || !trinketReady(u, B, '_moneyAt', Math.max(2.2, 4.5 - r * .25))) return;
      B.energy(u, 4 + r * 2); B.shield(u, u, u.max.hp * (.035 + r * .01), 3.5 + r * .25); B.applyStatus(u, t, 'drain', 2.5 + r * .2);
    });
  });

trinketRework('badge_of_the_boss', r => `+${(r * 2.9).toFixed(1)}% Defense, Magic Defense, and Skill Haste`,
  'Against debuffed enemies, the wearer deals more damage and takes less damage; Basic Attacks apply Weaken periodically.',
  (u, B, r) => {
    u.flat.defP = (u.flat.defP || 0) + r * .029; u.flat.mdefP = (u.flat.mdefP || 0) + r * .029; u.flat.cdr = (u.flat.cdr || 0) + r * .022; u.dirty = true;
    B.on(u, 'dealDamage', ev => { if (ev.target && trinketDebuffed(ev.target) && !ev.dot) ev.amount *= 1 + r * .035; });
    B.on(u, 'damaged', ev => { if (ev.src && trinketDebuffed(ev.src)) ev.amount *= Math.max(.62, 1 - r * .03); });
    trinketBasicProc(u, B, r, .14, t => B.applyStatus(u, t, 'weaken', 3 + r * .2));
  });

trinketRework('alarm', r => `+${(r * 1.2).toFixed(1)}% Energy Generation`,
  'Starts battle with Energy; the first Basic Attack also Stuns and Marks its target.',
  (u, B, r) => {
    u.flat.energyGen = (u.flat.energyGen || 0) + r * .012; u.dirty = true; u._alarmUsed = false;
    B.after(.1, () => B.energy(u, 8 + r * 2));
    B.on(u, 'basicHit', ev => { if (u._alarmUsed || !ev.target) return; u._alarmUsed = true; B.applyStatus(u, ev.target, 'stun', .28 + r * .06); B.applyStatus(u, ev.target, 'marked', 4 + r * .25); });
  });

trinketRework('fancypurse', r => `+${(r * 1.8).toFixed(1)}% Max HP`,
  'The first Shield created each battle also Convicts an enemy, grants Energy, and applies a short Defense Down.',
  (u, B, r) => {
    u.flat.hpP = (u.flat.hpP || 0) + r * .018; u.dirty = true; u._purseUsed = false;
    B.on(u, 'shieldDone', ev => {
      if (u._purseUsed || !ev.target) return;
      u._purseUsed = true; const t = B.highestEnergy(B.enemiesOf(u));
      if (t) { B.applyStatus(u, t, 'convicted', 3.5 + r * .25); B.applyStatus(u, t, 'defdown', 3 + r * .2); }
      B.energy(u, 5 + r * 2);
    });
  });

trinketRework('machinemanual', r => `+${(r * 1.2).toFixed(1)}% Skill Haste`,
  'Casting a Skill primes the next Basic Attack to deal bonus damage and apply Defense Down.',
  (u, B, r) => {
    u.flat.cdr = (u.flat.cdr || 0) + r * .012; u.dirty = true; u._manualReady = false;
    B.on(u, 'cast', () => { u._manualReady = true; B.applyStatus(u, u, 'focus', 1.8 + r * .15); });
    B.on(u, 'basicHit', ev => { if (!u._manualReady || !ev.target) return; u._manualReady = false; B.damage(u, ev.target, u.st.mag * (.08 + r * .018), { type: 'magic', tag: 'Machine Manual' }); B.applyStatus(u, ev.target, 'defdown', 3.5 + r * .2); });
  });

trinketRework('researchmap', r => `+${(r * 1.4).toFixed(1)}% Accuracy`,
  'The first hit against an enemy below 25% HP is a guaranteed Critical Hit and applies Exposed and Defense Down.',
  (u, B, r) => {
    u.flat.accP = (u.flat.accP || 0) + r * .014; u.dirty = true; u._mapUsed = false;
    B.on(u, 'dealDamage', ev => {
      if (u._mapUsed || ev.dot || !ev.target || ev.target.hpPct > .25 || ev.forceCrit) return;
      u._mapUsed = true; ev.forceCrit = true; B.applyStatus(u, ev.target, 'exposed', 3 + r * .2); B.applyStatus(u, ev.target, 'defdown', 3 + r * .2);
    });
  });

trinketRework('ribbonspool', r => `+${(r * 1.6).toFixed(1)}% Shield Power`,
  'Healing a Shielded ally extends their Shield and grants them Receptive; excess healing adds a small new Shield.',
  (u, B, r) => {
    u.flat.shieldPowP = (u.flat.shieldPowP || 0) + r * .016; u.dirty = true;
    B.on(u, 'healDone', ev => {
      if (!ev.target || !ev.target.hasStatus('shield')) return;
      ev.target.shields.forEach(s => s.t += .35 + r * .1); B.applyStatus(u, ev.target, 'receptive', 2.5 + r * .2, { val: .08 + r * .012 });
      if (ev.amount > ev.target.max.hp * .04) B.shield(u, ev.target, ev.amount * (.16 + r * .025), 5);
    });
  });

trinketRework('speedometer', r => `+${(r * 1.2).toFixed(1)}% Move Speed`,
  'Starts battle with Speed Up; the first Basic Attack after the opening burst Roots and Slows its target.',
  (u, B, r) => {
    u.flat.msP = (u.flat.msP || 0) + r * .012; u.dirty = true; u._speedoReady = false;
    B.after(.1, () => { B.applyStatus(u, u, 'speedup', 3.5 + r * .3); u._speedoReady = true; });
    B.on(u, 'basicHit', ev => { if (!u._speedoReady || !ev.target) return; u._speedoReady = false; B.applyStatus(u, ev.target, 'root', .55 + r * .08); B.applyStatus(u, ev.target, 'slow', 2.5 + r * .2); });
  });

trinketRework('speedyshoes', r => `+${(r * 1.4).toFixed(1)}% Move Speed`,
  'Slow effects are weaker; when Slowed, cleanse one debuff and gain Haste on a short cooldown.',
  (u, B, r) => {
    u.flat.msP = (u.flat.msP || 0) + r * .014; u.slowResist = (u.slowResist || 0) + .10 * r; u.dirty = true;
    B.on(u, 'statusApplied', ev => { if (ev.unit !== u || ev.id !== 'slow' || !trinketReady(u, B, '_shoesAt', Math.max(3.5, 7 - r * .35))) return; B.cleanse(u, 1); B.applyStatus(u, u, 'haste', 2.5 + r * .2); });
  });

trinketRework('thinkingcap', r => `+${(r * 1.2).toFixed(1)}% Skill Haste`,
  'Using an Ultimate restores Energy to allies and grants them Haste; the wearer gains Focus.',
  (u, B, r) => {
    u.flat.cdr = (u.flat.cdr || 0) + r * .012; u.dirty = true;
    B.on(u, 'cast', ev => { if (ev.key !== 'W') return; B.alliesOf(u).forEach(a => { if (a !== u) { B.energy(a, 3 + r); B.applyStatus(u, a, 'haste', 2 + r * .2); } }); B.applyStatus(u, u, 'focus', 2.5 + r * .2); });
  });

trinketRework('wrench', r => `+${(r * 1.4).toFixed(1)}% Defense`,
  'When the wearer’s Shield breaks, gain Fortify and repair a small Shield; the nearest enemy gets Defense Down.',
  (u, B, r) => {
    u.flat.defP = (u.flat.defP || 0) + r * .014; u.dirty = true;
    u.onShieldBreakBonus = .08 * r;
    B.on(u, 'shieldBreak', () => {
      if (!trinketReady(u, B, '_wrenchAt', Math.max(2.5, 5.5 - r * .3))) return;
      B.applyStatus(u, u, 'fortify', 3 + r * .25); B.shield(u, u, u.max.hp * (.035 + r * .01), 4 + r * .25);
      const t = B.nearest(u, B.enemiesOf(u)); if (t) B.applyStatus(u, t, 'defdown', 3 + r * .2);
    });
  });

/* ============================================================ TOONTOWN SET
   Cog gear is deliberately more dramatic than ordinary Trinkets. These eight
   pieces are the sealed-world reward set: they create formation-wide moments,
   but each has a readable trigger/cooldown so they do not erase every battle
   the moment they are equipped. */
function trinketAoeEnemies(u, B, fn) {
  B.enemiesOf(u).filter(t => t && t.alive).forEach(fn);
}
function trinketShareStats(u, B, r, duration) {
  const share = .045 + r * .012;
  B.alliesOf(u).filter(a => a !== u && a.alive).forEach(a => B.applyStatus(u, a, 'statshare', duration, { val: share }));
}

trinketRework('unknown_goldenstamp', r => `+${(r * 2.4).toFixed(1)}% Skill Haste`,
  'Every Skill cast can trigger a Golden Stamp: Stun every enemy, then apply Defense Down. The team gains Attack Up after the stamp.',
  (u, B, r) => {
    u.flat.cdr = (u.flat.cdr || 0) + r * .024; u.dirty = true;
    B.on(u, 'cast', () => {
      if (!trinketReady(u, B, '_goldStampAt', Math.max(4.5, 8.5 - r * .35))) return;
      trinketAoeEnemies(u, B, t => {
        B.applyStatus(u, t, 'stun', .38 + r * .09);
        B.applyStatus(u, t, 'defdown', 4 + r * .3, { stacks: r >= 4 ? 2 : 1 });
      });
      B.alliesOf(u).forEach(a => B.applyStatus(u, a, 'atkup', 3 + r * .25));
      trinketShareStats(u, B, r, 3.5 + r * .25);
      B.energy(u, 5 + r * 2); Sound.play('guard', { vol: .4, throttle: 350 });
    });
  });

trinketRework('unknown_inkseal', r => `+${(r * 2.7).toFixed(1)}% Accuracy and Evasion`,
  'Every Basic Attack against a debuffed enemy splashes Defense Down and Weaken across the entire enemy team. Higher ranks add Resist Down.',
  (u, B, r) => {
    u.flat.accP = (u.flat.accP || 0) + r * .027; u.flat.evaP = (u.flat.evaP || 0) + r * .027; u.dirty = true;
    B.on(u, 'basicHit', ev => {
      const target = ev.target;
      if (!target || !trinketDebuffed(target) || !trinketReady(u, B, '_inkSealAt', Math.max(.24, .48 - r * .035))) return;
      const duration = 2.8 + r * .22;
      trinketAoeEnemies(u, B, t => {
        B.applyStatus(u, t, 'defdown', duration, { stacks: r >= 4 ? 2 : 1 });
        B.applyStatus(u, t, 'weaken', duration);
        if (r >= 3) B.applyStatus(u, t, 'magdown', duration);
      });
      B.damage(u, target, u.st.mag * (.12 + r * .025), { type: 'magic', tag: 'Ink Seal Splash', area: true });
    });
  });

trinketRework('unknown_brassbriefcase', r => `+${(r * 2.8).toFixed(1)}% Attack and Magic Attack`,
  'Damaging a debuffed enemy releases a paperwork burst that hits nearby enemies, applies Corrode, and restores Energy.',
  (u, B, r) => {
    u.flat.atkP = (u.flat.atkP || 0) + r * .028; u.flat.magP = (u.flat.magP || 0) + r * .028; u.dirty = true;
    B.on(u, 'dealDamage', ev => {
      if (!ev.target || ev.dot || ev.area || !trinketDebuffed(ev.target) || !trinketReady(u, B, '_briefcaseAt', Math.max(1.2, 2.6 - r * .12))) return;
      B.energy(u, 3 + r);
      B.enemiesOf(u).filter(t => t !== ev.target && t.alive && Math.abs(t.x - ev.target.x) < 250).forEach(t => {
        B.damage(u, t, u.st.mag * (.10 + r * .025), { type: 'magic', area: true, tag: 'Briefcase Burst' });
        B.applyStatus(u, t, 'corrode', 3.5 + r * .25);
      });
      B.applyStatus(u, ev.target, 'defdown', 3.5 + r * .25);
    });
  });

trinketRework('unknown_contractclip', r => `+${(r * 2.6).toFixed(1)}% Defense and Magic Defense`,
  'When the wearer falls below 45% HP, gain Ward and a heavy Shield, cleanse three debuffs, then Stun and Slow every enemy.',
  (u, B, r) => {
    u.flat.defP = (u.flat.defP || 0) + r * .026; u.flat.mdefP = (u.flat.mdefP || 0) + r * .026; u.dirty = true;
    B.on(u, 'damaged', () => {
      if (u._contractUsed || u.hpPct > .45 || !u.alive) return;
      u._contractUsed = true; B.cleanse(u, 3); B.applyStatus(u, u, 'ward', 3.5 + r * .3); B.shield(u, u, u.max.hp * (.20 + r * .035), 7 + r * .35); trinketShareStats(u, B, r, 5 + r * .3);
      trinketAoeEnemies(u, B, t => { B.applyStatus(u, t, 'stun', .3 + r * .07); B.applyStatus(u, t, 'slow', 3.5 + r * .25); });
    });
  });

trinketRework('badge_of_law', r => `+${(r * 2.9).toFixed(1)}% Defense and Magic Defense`,
  'Applying a debuff Convicts and Silences the target, weakens nearby enemies, grants Energy, and raises a Shield.',
  (u, B, r) => {
    u.flat.defP = (u.flat.defP || 0) + r * .029; u.flat.mdefP = (u.flat.mdefP || 0) + r * .029; u.dirty = true;
    B.on(u, 'statusApplied', ev => {
      if (ev.src !== u || ev.id === 'convicted' || !ev.unit || ev.unit.team === u.team || !STATUS[ev.id] || STATUS[ev.id].kind !== 'debuff' || !trinketReady(u, B, '_lawAt', Math.max(2.2, 4.5 - r * .2))) return;
      B.energy(u, 5 + r * 2); B.shield(u, u, u.max.hp * (.045 + r * .012), 3.5 + r * .3);
      const target = ev.unit;
      B.applyStatus(u, target, 'convicted', 4 + r * .35);
      B.applyStatus(u, target, 'silence', 1.15 + r * .12);
      B.enemiesOf(u).filter(t => t !== target && Math.abs(t.x - target.x) < 210).forEach(t => B.applyStatus(u, t, 'defdown', 3 + r * .25));
      if (r >= 4) B.enemiesOf(u).filter(t => t !== target && Math.abs(t.x - target.x) < 210).forEach(t => B.applyStatus(u, t, 'silence', .65 + r * .08));
    });
    B.on(u, 'dealDamage', ev => { if (ev.target && ev.target.hasStatus('convicted') && !ev.dot) ev.amount *= 1 + r * .045; });
  });

trinketRework('badge_of_the_market', r => `+${(r * 2.8).toFixed(1)}% Attack and Magic Attack`,
  'Applying a debuff Inspires the team; Basic Attacks against debuffed enemies expose the target and splash Attack Down nearby.',
  (u, B, r) => {
    u.flat.atkP = (u.flat.atkP || 0) + r * .028; u.flat.magP = (u.flat.magP || 0) + r * .028; u.dirty = true;
    B.on(u, 'statusApplied', ev => {
      if (ev.src !== u || !ev.unit || ev.unit.team === u.team || !STATUS[ev.id] || STATUS[ev.id].kind !== 'debuff') return;
      B.alliesOf(u).forEach(a => B.applyStatus(u, a, 'inspire', 2 + r * .22)); trinketShareStats(u, B, r, 2.5 + r * .2); B.energy(u, 3 + r);
    });
    B.on(u, 'basicHit', ev => {
      if (!ev.target || !trinketDebuffed(ev.target) || !trinketReady(u, B, '_marketAt', Math.max(.55, 1.1 - r * .06))) return;
      B.applyStatus(u, ev.target, 'exposed', 3 + r * .25);
      B.enemiesOf(u).filter(t => t !== ev.target && Math.abs(t.x - ev.target.x) < 190).forEach(t => B.applyStatus(u, t, 'attackdown', 2.5 + r * .2, { val: .16 + r * .012 }));
    });
  });

trinketRework('badge_of_money', r => `+${(r * 2.9).toFixed(1)}% Max HP and Shield Power`,
  'When an enemy loses Energy or a buff, drain nearby enemies and convert the loss into a team Shield and Energy.',
  (u, B, r) => {
    u.flat.hpP = (u.flat.hpP || 0) + r * .029; u.flat.shieldPowP = (u.flat.shieldPowP || 0) + r * .029; u.dirty = true;
    B.on(u, 'dealDamage', ev => {
      const t = ev.target;
      if (!t || ev.dot || !trinketReady(u, B, '_moneyAt', Math.max(1.6, 3.2 - r * .15))) return;
      if (t.energy >= t.energyMax * .55 && !t.statuses.some(s => STATUS[s.id] && STATUS[s.id].kind === 'buff')) return;
      B.energy(u, 4 + r * 2); B.alliesOf(u).forEach(a => B.shield(u, a, a.max.hp * (.018 + r * .006), 3.5 + r * .2)); trinketShareStats(u, B, r, 3 + r * .25);
      B.enemiesOf(u).filter(e => e !== t && Math.abs(e.x - t.x) < 220).forEach(e => { B.energy(e, -(2 + r)); B.applyStatus(u, e, 'drain', 2 + r * .2); });
    });
  });

trinketRework('badge_of_the_boss', r => `+${(r * 3.1).toFixed(1)}% Defense, Magic Defense, and Skill Haste`,
  'Against debuffed enemies, deal more damage and take less damage. Every third Basic Attack against one applies an AOE Weaken and Defense Down.',
  (u, B, r) => {
    u.flat.defP = (u.flat.defP || 0) + r * .031; u.flat.mdefP = (u.flat.mdefP || 0) + r * .031; u.flat.cdr = (u.flat.cdr || 0) + r * .024; u.dirty = true; u._bossBadgeHits = 0;
    B.on(u, 'dealDamage', ev => { if (ev.target && trinketDebuffed(ev.target) && !ev.dot) ev.amount *= 1 + r * .04; });
    B.on(u, 'damaged', ev => { if (ev.src && trinketDebuffed(ev.src)) ev.amount *= Math.max(.58, 1 - r * .035); });
    B.on(u, 'basicHit', ev => {
      if (!ev.target || !trinketDebuffed(ev.target)) return;
      u._bossBadgeHits++;
      if (u._bossBadgeHits < Math.max(2, 4 - Math.floor(r / 2))) return;
      u._bossBadgeHits = 0; trinketAoeEnemies(u, B, t => { B.applyStatus(u, t, 'weaken', 3 + r * .22); B.applyStatus(u, t, 'defdown', 3 + r * .22); });
    });
  });

/* Backstage gear borrows one battle loop from each band member. Event-only
   pieces never enter generated enemy loadouts. */
defTrinket({ id: 'qom_gourdy_drums', name: 'Gourdy’s Drums', owner: 'QOMGourdy', file: 'gourdydrums.png', eventOnly: true,
  desc: 'The pulse of the whole performance.',
  stat: r => `+${(r * 2.8).toFixed(1)}% Skill Haste and Magic Attack`,
  effect: 'Casting a Skill gives the team Energy and briefly speeds the two allies with the least Energy.',
  apply(u, B, r) {
    u.flat.cdr = (u.flat.cdr || 0) + r * .028; u.flat.magP = (u.flat.magP || 0) + r * .028; u.dirty = true;
    B.on(u, 'cast', () => {
      if (!trinketReady(u, B, '_qomDrumsAt', Math.max(5.5, 9 - r * .35))) return;
      const allies = B.alliesOf(u).filter(a => a.alive);
      allies.forEach(a => B.energy(a, 3 + r));
      allies.sort((a, b) => a.energy - b.energy).slice(0, 2).forEach(a => B.applyStatus(u, a, 'haste', 3 + r * .3));
      B.fxRing(u.x, u.y - 45, 260, '#b5fa6f', .45);
      B.fxFloatIcon(u.x, u.y - 100, '♫', '#e2adff');
    });
  }
});
defTrinket({ id: 'qom_eclipse_guitar', name: 'Eclipse’s Guitar', owner: 'QOMEclipse', file: 'eclipseguitar.png', eventOnly: true,
  desc: 'Every strike turns the volume higher.',
  stat: r => `+${(r * 2.8).toFixed(1)}% Attack and Magic Attack`,
  effect: 'Every third Basic Attack releases a soundwave that damages and slows the enemy team.',
  apply(u, B, r) {
    u.flat.atkP = (u.flat.atkP || 0) + r * .028; u.flat.magP = (u.flat.magP || 0) + r * .028; u.dirty = true;
    u._qomGuitarHits = 0;
    B.on(u, 'basicHit', ev => {
      if (!ev.target || ++u._qomGuitarHits % 3 || !trinketReady(u, B, '_qomGuitarAt', 2.2)) return;
      B.enemiesOf(u).filter(e => e.alive).forEach(e => {
        B.damage(u, e, u.st.mag * (.26 + r * .035), { type: 'magic', area: true, tag: 'Amplified Chord' });
        B.applyStatus(u, e, 'armslow', 2.5 + r * .18);
      });
      B.fxRing(ev.target.x, ev.target.y - 45, 290, '#c05afa', .48);
      B.fxFloatIcon(u.x, u.y - 90, '⚡', '#d8a1ff');
    });
  }
});
defTrinket({ id: 'qom_soulvester_sword', name: 'Soulvester’s Sword', owner: 'QOMSoulvester', file: 'SOULVESTER_SoulSword.png', eventOnly: true,
  desc: 'A blade kept ready behind the curtain.',
  stat: r => `+${(r * 3).toFixed(1)}% Defense and Magic Defense`,
  effect: 'Periodically intercepts an attack against an ally, Shields them, and counters the attacker.',
  apply(u, B, r) {
    u.flat.defP = (u.flat.defP || 0) + r * .03; u.flat.mdefP = (u.flat.mdefP || 0) + r * .03; u.dirty = true;
    B.on(u, 'allyDamaged', ev => {
      if (!ev.unit || ev.unit === u || !ev.src || ev.src.team === u.team || ev.redirected || !trinketReady(u, B, '_qomSwordAt', Math.max(5.5, 9 - r * .35))) return;
      ev.amount *= Math.max(.55, .78 - r * .025);
      B.shield(u, ev.unit, u.max.hp * (.055 + r * .012), 5);
      B.damage(u, ev.src, u.st.atk * (.52 + r * .07), { type: 'physical', tag: 'Curtain Counter' });
      B.applyStatus(u, ev.src, 'stun', .45 + r * .055);
      B.fxRing(ev.unit.x, ev.unit.y - 42, 110, '#c8aeff', .36);
      B.fxFloatIcon(ev.unit.x, ev.unit.y - 92, '✦', '#e8d4ff');
    });
  }
});
defTrinket({ id: 'qom_ribecca_keytar', name: 'Ribecca’s Keytar', owner: 'QOMRibecca', file: 'ribeccakeytar.png', eventOnly: true,
  desc: 'A low chord holds the band together.',
  stat: r => `+${(r * 2.9).toFixed(1)}% Max HP and Shield Power`,
  effect: 'When an ally takes damage, the team gains barriers and the attacker falls Offbeat.',
  apply(u, B, r) {
    u.flat.hpP = (u.flat.hpP || 0) + r * .029; u.flat.shieldPowP = (u.flat.shieldPowP || 0) + r * .029; u.dirty = true;
    B.on(u, 'allyDamaged', ev => {
      if (!ev.unit || !ev.src || ev.src.team === u.team || ev.redirected || !trinketReady(u, B, '_qomKeytarAt', Math.max(6, 10 - r * .4))) return;
      B.alliesOf(u).filter(a => a.alive).forEach(a => B.shield(u, a, u.max.hp * (.035 + r * .008), 5));
      B.applyStatus(u, ev.src, 'qom_offbeat', 3 + r * .25);
      B.fxRing(u.x, u.y - 45, 310, '#b7f46e', .55);
      B.fxFloatIcon(u.x, u.y - 98, '♪', '#c1ff8e');
    });
  }
});
defTrinket({ id: 'qom_connie_guitar', name: 'Connie’s Guitar', owner: 'QOMConnie', file: 'connieguitarqom.png', eventOnly: true,
  desc: 'A haunted instrument with notes to spare.',
  stat: r => `+${(r * 2.8).toFixed(1)}% Magic Attack and Evasion`,
  effect: 'Casting a Skill sends a spectral chord through the enemy team and Haunts the strongest foe.',
  apply(u, B, r) {
    u.flat.magP = (u.flat.magP || 0) + r * .028; u.flat.evaP = (u.flat.evaP || 0) + r * .028; u.dirty = true;
    B.on(u, 'cast', () => {
      if (!trinketReady(u, B, '_qomConnieAt', Math.max(5, 8 - r * .3))) return;
      const foes = B.enemiesOf(u).filter(e => e.alive);
      foes.forEach(e => B.damage(u, e, u.st.mag * (.22 + r * .03), { type: 'magic', area: true, tag: 'Phantom Chord' }));
      const strongest = foes.sort((a, b) => b.st.atk - a.st.atk)[0];
      if (strongest) B.applyStatus(u, strongest, 'qom_haunted', 4 + r * .25);
      B.energy(u, 4 + r);
      B.fxRing(u.x, u.y - 50, 320, '#c886f4', .5);
      B.fxFloatIcon(u.x, u.y - 105, '♩', '#ead0ff');
    });
  }
});

const TRINKET_IDS = Object.keys(TRINKETS);
function trinketIcon(id) {
  if (id === 'qom_gourdy_drums') return ASSET + 'uploads/gourdydrums.png';
  if (id === 'qom_eclipse_guitar') return ASSET + 'uploads/eclipseguitar.png';
  if (id === 'qom_ribecca_keytar') return ASSET + 'uploads/ribeccakeytar.png';
  if (id === 'qom_connie_guitar') return ASSET + 'uploads/connieguitarqom.png';
  if (id === 'sora_paopucharm') return ASSET + 'uploads/image-60.png';
  if (id === 'phantasia_unicornemblem') return ASSET + 'uploads/phantasiatrinket.png';
  if (id === 'badge_of_law') return ASSET + 'uploads/badgeofthelaw.png';
  if (id === 'badge_of_the_market') return ASSET + 'uploads/badgeofthemarket.png';
  if (id === 'badge_of_money') return ASSET + 'uploads/badgeofthemoney.png';
  if (id === 'badge_of_the_boss') return ASSET + 'uploads/badgeoftheboss.png';
  const t = TRINKETS[id]; return t ? TRINKET_ICON_DIR + t.file : '';
}
function trinketPlaceholderBadge(id) {
  return TRINKETS[id] && TRINKETS[id].placeholder ? '<span class="trinket-art-wip">PLACEHOLDER ART</span>' : '';
}
function trinketSignatureText(id) {
  const t = TRINKETS[id];
  if (!t) return '';
  if (!t.owner) return 'General gear';
  const owner = HEROES[t.owner] ? HEROES[t.owner].name : t.owner;
  return `Signature fragment · ${owner}: ${t.signature}`;
}
function trinketSignatureEffect(id) {
  const t = TRINKETS[id];
  if (!t || !t.owner) return 'No character fragment; this is general gear.';
  const echo = TRINKET_SIGNATURES[t.owner];
  if (echo && echo.desc) return echo.desc;
  const source = HEROES[t.owner];
  const role = String(source && (source.roleLabel || source.role) || '').toLowerCase();
  if (role.includes('support')) return 'Role echo: healing periodically grants the target a brief Speed boost.';
  if (role.includes('tank')) return 'Role echo: taking damage periodically grants a Shield and Taunts the attacker.';
  if (role.includes('control')) return 'Role echo: applying crowd control grants Energy and Weakens the target.';
  return 'Role echo: damaging an enemy periodically Exposes them.';
}
function trinketEquipRule(id) {
  const t = TRINKETS[id];
  return t && t.owner
    ? `Any Hero can equip this. ${HEROES[t.owner] ? HEROES[t.owner].name : t.owner} contributes the Signature Fragment. ` +
      'The fragment changes the wearer\'s build; it does not require the source Hero to be equipped.'
    : 'Any Hero can equip this general Trinket. It has no character-specific Signature Fragment.';
}
function trinketsForOwner(id) { return TRINKET_IDS.filter(k => TRINKETS[k].owner === id); }
