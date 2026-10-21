/* tags.js - lightweight character tags used by Trials (and anywhere else a
   Hero card wants a quick-read badge): gender, species, a signature color,
   speed/power read off real stats, plus curated seasonal themes and the Rarity/Role/Event facts other
   systems already track, exposed as tags too. Gender/species/color are
   curated from the toons' actual in-universe designs; everything else is
   computed straight from each Hero's own data so it can't drift out of sync
   as the roster grows. */
'use strict';

const HERO_GENDER = {
  Astro: 'Male', Bassie: 'Female', Blot: 'Male', Bobette: 'Female', Boxten: 'Male',
  Brightney: 'Female', Brusha: 'Female', Cocoa: 'Female', Coal: 'Male', Connie: 'Female',
  Cosmo: 'Male', Dyle: 'Male', Delilah: 'Female', Eggson: 'Male', Flyte: 'Male', Gigi: 'Female', Ginger: 'Female',
  Looey: 'Male', Poppy: 'Female', Rudie: 'Male', Scraps: 'Female', Shelly: 'Female',
  Shrimpo: 'Male', Squirm: 'Male', Toodles: 'Female', Vee: 'Female', Yatta: 'Female',
  Rodger: 'Male', Soulvester: 'Male', Eclipse: 'Female', Pebble: 'Male', RnD: 'Male', Goob: 'Male', Flutter: 'Female'
};

/** Toons whose species is an actual animal/creature rather than an object -
    Shelly (dinosaur fossil), Squirm (bookworm/caterpillar), Shrimpo (shrimp),
    Flyte (butterfly), Rudie (reindeer). */
const HERO_ANIMAL = { Shelly: 1, Squirm: 1, Shrimpo: 1, Flyte: 1, Rudie: 1, Pebble: 1, Flutter: 1 };

/* Seasonal identity tags are permanent roster facts, not event flags. They
   let themed Trials rotate through the same weekly service pool as every
   other division, even when the calendar is nowhere near that holiday. */
const HERO_THEME_TAGS = {
  Easter: { icon: '🥚', ids: new Set(['Cocoa', 'Eggson']) },
  Christmas: { icon: '🎄', ids: new Set(['Bobette', 'Ginger', 'Rudie']) },
  Halloween: { icon: '🎃', ids: new Set(['Connie', 'Gourdy']) }
};

const HERO_COLOR = {
  Astro: 'Blue', Bassie: 'Pink', Blot: 'Black', Bobette: 'Red', Boxten: 'Purple',
  Brightney: 'Yellow', Brusha: 'Purple', Cocoa: 'Brown', Coal: 'Black', Connie: 'Blue',
  Cosmo: 'Pink', Dyle: 'Gold', Delilah: 'Purple', Eggson: 'Brown', Flyte: 'Cyan', Gigi: 'Red', Ginger: 'Brown',
  Looey: 'Yellow', Poppy: 'Blue', Rudie: 'Brown', Scraps: 'Brown', Shelly: 'Brown', Tisha: 'Blue',
  Shrimpo: 'Pink', Squirm: 'Green', Toodles: 'Gray', Vee: 'Gray', Yatta: 'Yellow', Pebble: 'Gray', RnD: 'Gray', Goob: 'Orange', Flutter: 'Cyan'
};
const TAG_COLOR_HEX = {
  Red: '#ff6b6b', Orange: '#ff9d4d', Yellow: '#ffd54d', Green: '#6cd67a', Blue: '#6cb5ff',
  Purple: '#c17bff', Pink: '#ff9dc4', Brown: '#b98b5e', Black: '#8a8f98', Gray: '#a7acb5',
  Gold: '#e8c14d', Cyan: '#5fe0e0'
};

/** Speed and Power read straight off each Hero's own base stats, ranked
    against the current playable roster - top/bottom third earn the tag, the
    middle stays untagged rather than forcing everyone into a bucket. */
function computeStatTags() {
  const ids = PLAYABLE_IDS;
  const bySpd = ids.slice().sort((a, b) => HEROES[b].base.spd - HEROES[a].base.spd);
  const byPow = ids.slice().sort((a, b) => (HEROES[b].base.atk + HEROES[b].base.mag) - (HEROES[a].base.atk + HEROES[a].base.mag));
  const byRange = ids.slice().sort((a, b) => HEROES[b].hidden.range - HEROES[a].hidden.range);
  const third = Math.max(1, Math.floor(ids.length / 3));
  return {
    fast: new Set(bySpd.slice(0, third)),
    slow: new Set(bySpd.slice(-third)),
    strong: new Set(byPow.slice(0, third)),
    passive: new Set(byPow.slice(-third)),
    ranged: new Set(byRange.slice(0, third)),
    melee: new Set(byRange.slice(-third))
  };
}
let _statTagCache = null;
function statTags() { return _statTagCache || (_statTagCache = computeStatTags()); }

const ROLE_ICON = { Tank: '🛡', Damage: '⚔', Support: '💚', Control: '🌀' };

/* The menu has four readable jobs. Some older data uses hybrid/internal
   labels, but those are descriptive notes—not additional player-facing roles.
   Keep the canonical role derived from the authored primary role so filters,
   tags, and profile chips all agree. */
function heroRole(role) {
  const text = String(role || '').toLowerCase();
  if (text.includes('tank')) return 'Tank';
  if (text.includes('control')) return 'Control';
  if (text.includes('support') || text.includes('heal')) return 'Support';
  return 'Damage';
}

/** Per-Hero battle entrances, keyed by id - checked before the generic
    per-gait fallback in Battle.introWalk() (sim.js). Only worth naming a
    Hero here when their actual personality calls for something the gait
    fallback can't express (a teleport, a flicker, a deliberate stall);
    everyone else rides the fallback their move.gait already implies. */
const ENTRANCE_STYLES = {
  // Gourdy is already at his drum kit when the lights come up.
  QOMGourdy: { dur: .72, stagger: .08, ease: ease.out, teleport: true, appearAt: .4, col: '#b9f878' },
  // paints her own path into the fight, brush marks appearing underfoot
  Brusha: { dur: 1.0, stagger: .13, ease: ease.out, hop: 0, bob: 5, jitter: 0, paintTrail: true },
  // jumps in like a cat: a short, low pounce rather than a walk
  Scraps: { dur: .55, stagger: .09, ease: ease.out, hop: 20, bob: 0, jitter: 0, pounce: true, heavy: true },
  // teleports in: absent, then a flash and a hard cut to her spot
  Astro: { dur: 1.0, stagger: .16, ease: ease.out, teleport: true, appearAt: .6, col: '#b9a4ff' },
  // stomps in like he's pissed: fast, heavy, aggressive footfalls
  Shrimpo: { dur: .8, stagger: .11, ease: t => t, hop: 0, bob: 4, jitter: 0, stomp: true, heavy: true },
  // walks slowly like she owns the place: unhurried, no bounce at all
  Vee: { dur: 1.65, stagger: .2, ease: ease.out, hop: 0, bob: 2, jitter: 0 },
  // slowly comes in and seems afraid: creeps forward, stalls, creeps again
  Squirm: { dur: 1.6, stagger: .22, ease: ease.out, hop: 0, bob: 0, jitter: 2, hesitant: true },
  // eagerly runs in: fast and a little breathless
  Eclipse: { dur: .6, stagger: .09, ease: ease.out, hop: 0, bob: 6, jitter: 0 },
  // does ghost things: flickers and drifts rather than walking
  Connie: { dur: 1.3, stagger: .17, ease: ease.out, hop: 0, bob: 8, jitter: 0, phase: true },
  // a measured theatrical march, with enough sway to read as two performers sharing one cue
  RnD: { dur: 1.12, stagger: .15, ease: ease.out, hop: 0, bob: 4, jitter: 0, stomp: true }
};

/** Every tag a Hero carries: {key, cat, label, icon, color}. `key` is stable
    and filterable (e.g. 'gender:Female'), `cat` groups tags for display. */
function heroTags(id) {
  const d = HEROES[id]; if (!d) return [];
  const st = statTags();
  const tags = [];
  if (HERO_GENDER[id]) tags.push({ key: 'gender:' + HERO_GENDER[id], cat: 'Gender', label: HERO_GENDER[id], icon: HERO_GENDER[id] === 'Female' ? '♀' : '♂' });
  if (HERO_ANIMAL[id]) tags.push({ key: 'species:Animal', cat: 'Species', label: 'Animal', icon: '🐾' });
  Object.entries(HERO_THEME_TAGS).forEach(([theme, info]) => {
    if (info.ids.has(id)) tags.push({ key: 'theme:' + theme, cat: 'Theme', label: theme, icon: info.icon });
  });
  if (st.fast.has(id)) tags.push({ key: 'speed:Fast', cat: 'Speed', label: 'Fast', icon: '⚡' });
  if (st.slow.has(id)) tags.push({ key: 'speed:Slow', cat: 'Speed', label: 'Slow', icon: '🐌' });
  if (st.strong.has(id)) tags.push({ key: 'temper:Strong', cat: 'Temperament', label: 'Strong', icon: '💪' });
  if (st.passive.has(id)) tags.push({ key: 'temper:Passive', cat: 'Temperament', label: 'Passive', icon: '🍃' });
  if (HERO_COLOR[id]) tags.push({ key: 'color:' + HERO_COLOR[id], cat: 'Color', label: HERO_COLOR[id], icon: '🎨', color: TAG_COLOR_HEX[HERO_COLOR[id]] });
  const rk = obtainOf(id);
  tags.push({ key: 'rarity:' + rk.name, cat: 'Rarity', label: rk.name, icon: rk.icon, color: rk.color });
  const role = heroRole(d.role);
  tags.push({ key: 'role:' + role, cat: 'Role', label: role, icon: ROLE_ICON[role] });
  if (st.ranged.has(id)) tags.push({ key: 'range:Ranged', cat: 'Range', label: 'Ranged', icon: '🏹' });
  if (st.melee.has(id)) tags.push({ key: 'range:Melee', cat: 'Range', label: 'Melee', icon: '🗡' });
  return tags;
}

/** Every distinct tag currently in use across the playable roster, so a
    filter UI can list real options instead of a hand-maintained enum. */
function allHeroTags() {
  const seen = {};
  PLAYABLE_IDS.forEach(id => heroTags(id).forEach(t => { seen[t.key] = t; }));
  return Object.values(seen);
}
let _tagInfoCache = null;
/** Look up one tag's display info (icon/label/color) by its key. */
function tagInfo(key) {
  if (!_tagInfoCache) { _tagInfoCache = {}; allHeroTags().forEach(t => { _tagInfoCache[t.key] = t; }); }
  return _tagInfoCache[key];
}
