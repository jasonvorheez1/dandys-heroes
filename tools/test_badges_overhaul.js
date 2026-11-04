const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const baseDir = path.resolve(__dirname, '..');
const bundle = fs.readFileSync(path.join(baseDir, 'js/game.js'), 'utf8');
const scripts = new Map(JSON.parse(bundle.split('var S=')[1].split(/;\r?\nfor\(var i=/)[0]));

const ctx = vm.createContext({
  console, Math, Object, Array, String, Number, Boolean, Set, Map, RegExp,
  STATUS: {},
  Save: {
    data: { badges: {} },
    badgeLvl: () => 1
  },
  TEAM_P: 0, TEAM_E: 1,
  PLAYABLE_IDS: [],
  HEROES: {},
  defHero: def => {
    ctx.HEROES[def.id] = def;
    if (!ctx.PLAYABLE_IDS.includes(def.id)) ctx.PLAYABLE_IDS.push(def.id);
  },
  Sound: { play() {} },
  FX: { burst() {}, floatIcon() {} }
});

// Load core badge scripts from game.js
const badgeScripts = [
  'data/status.js',
  'data/badges.js',
  'data/badges_extra.js',
  'data/badges_scraps_poppy.js',
  'data/badges_rudie_scraps.js',
  'data/badges_flutter.js',
  'data/badges_ribecca.js',
  'data/cookie-badges.js',
  'data/badges_bigwig.js',
  'data/badges_ff7.js',
  'data/badges_dandy.js'
];

badgeScripts.forEach(s => {
  const code = scripts.get(s);
  if (code) vm.runInContext(code, ctx);
});

// Load external kits
['js/kris-kit.js', 'js/ralsei-kit.js', 'js/tasque-manager-kit.js', 'js/flowery-kit.js', 'js/chell-kit.js'].forEach(rel => {
  const code = fs.readFileSync(path.join(baseDir, rel), 'utf8');
  try { vm.runInContext(code, ctx); } catch(e) {}
});

// Load badges-overhaul.js
const overhaulCode = fs.readFileSync(path.join(baseDir, 'js/badges-overhaul.js'), 'utf8');
vm.runInContext(overhaulCode, ctx);

const badges = vm.runInContext('BADGES', ctx);
console.log('Total badges in BADGES:', Object.keys(badges).length);

const targetedBadges = [
  'poppy_boxten', 'bigwig_legaleagle', 'bigwig_pencilpusher', 'flutter_flyte',
  'flyte_brightney', 'flyte_flutter', 'flyte_bassie', 'jack_gourdy',
  'oogie_cocoa', 'lockshockbarrel_waxwell', 'dandy_brusha', 'dandy_pebble',
  'ff7_cloud_buster', 'ff7_tifa_gloves', 'ff7_aerith_ribbon', 'ff7_caitsith_megaphone',
  'vee_shelly', 'dyle_shrimpo', 'squirm_cocoa', 'finn_shelly',
  'scraps_yatta', 'scraps_poppy', 'waxwell_soulvester', 'yatta_looey',
  'jessie_shrimpo', 'bassie_shelly', 'eclipse_pebble', 'brusha_tisha',
  'tisha_blot', 'rodger_teagan', 'gigi_connie', 'poppy_toodles',
  // New Badges
  'kris_ralsei', 'ralsei_kris', 'tasquemanager_dyle', 'flowery_dandy', 'chell_boxten'
];

console.log(`Checking ${targetedBadges.length} overhauled & expanded badges...`);
assert(targetedBadges.length >= 20, 'At least 20 badges must be tested');

for (const bid of targetedBadges) {
  const b = badges[bid];
  assert(b, `Badge ${bid} must be defined`);
  assert(b.name, `Badge ${bid} must have a name`);
  assert(typeof b.stat === 'function' || typeof b.stat === 'string', `Badge ${bid} must have stat function`);
  const statText = typeof b.stat === 'function' ? b.stat(1) : b.stat;
  assert(statText.length > 5, `Badge ${bid} stat text must not be empty`);
  assert(b.effect && b.effect.length > 50, `Badge ${bid} effect description must be substantial`);
  assert(typeof b.apply === 'function', `Badge ${bid} must have an apply function`);
}

console.log('All targeted badges have valid definitions, stats, and effects.');

// Mock Battle test for each badge
class MockBattle {
  constructor() {
    this.t = 0;
    this.events = new Map();
    this.statuses = new Map();
    this.units = [];
  }
  on(unit, eventName, cb) {
    if (!this.events.has(eventName)) this.events.set(eventName, []);
    this.events.get(eventName).push({ unit, cb });
  }
  emit(eventName, ev = {}) {
    const list = this.events.get(eventName) || [];
    for (const entry of list) {
      entry.cb(ev);
    }
  }
  every(unit, interval, cb) {}
  after(delay, cb) { cb(); }
  applyStatus(src, target, statusId, duration, opts = {}) {
    if (!this.statuses.has(target)) this.statuses.set(target, new Map());
    const s = { id: statusId, src, target, duration, stacks: opts.stacks || 1, val: opts.val || 0 };
    this.statuses.get(target).set(statusId, s);
    return s;
  }
  removeStatus(target, statusId) {
    if (this.statuses.has(target)) this.statuses.get(target).delete(statusId);
  }
  hasStatus(target, statusId) {
    return this.statuses.has(target) && this.statuses.get(target).has(statusId);
  }
  getStatus(target, statusId) {
    return this.statuses.has(target) ? this.statuses.get(target).get(statusId) : null;
  }
  heal(src, target, amount) {
    target.hp = Math.min(target.max.hp, target.hp + amount);
    this.emit('healDone', { src, target, amount });
  }
  shield(src, target, amount, dur) {
    const sh = { amt: amount, t: dur, src };
    target.shields.push(sh);
    return sh;
  }
  crackShield(src, target, pct) {}
  damage(src, target, amount, opts = {}) {
    target.hp -= amount;
    return { amount };
  }
  cleanse() {}
  cleanseAll() {}
  dispel() {}
  dispelAll() {}
  energy(u, amt) { u.energy = Math.min(100, (u.energy || 0) + amt); }
  reduceCd() {}
  knockback() {}
  interrupt() {}
  shake() {}
  flash() {}
  grantTeamKnockbackImmunity() {}
  summon(owner, config) {
    const minion = makeUnit(config.protoId || 'Minion', this, owner.team, owner.x + 30);
    minion.minion = true;
    minion.owner = owner;
    this.units.push(minion);
    return minion;
  }
  alliesOf(u) { return this.units.filter(x => x.team === u.team); }
  enemiesOf(u) { return this.units.filter(x => x.team !== u.team); }
  lowestHp(list) { return list.sort((a,b) => a.hp - b.hp)[0]; }
  highestStat(list, stat) { return list.sort((a,b) => (b.st?.[stat]||0) - (a.st?.[stat]||0))[0]; }
  distance(a, b) { return Math.abs(a.x - b.x); }
  fxRing() {}
  fxFloatIcon() {}
  fxSparkle() {}
}

function makeUnit(id, B, team = 0, x = 100) {
  return {
    id,
    team,
    x,
    depth: 0.5,
    face: team === 0 ? 1 : -1,
    alive: true,
    minion: false,
    max: { hp: 4000 },
    hp: 4000,
    baseStats: { aggro: 1, hp: 4000 },
    st: { atk: 300, mag: 300, def: 200, mdef: 200, spd: 110, ccRes: 0.1 },
    flat: {},
    shields: [],
    statuses: [],
    guards: [],
    recompute() {},
    hasStatus(s) { return B.hasStatus(this, s); },
    getStatus(s) { return B.getStatus(this, s); }
  };
}

let appliedCount = 0;
for (const bid of targetedBadges) {
  const b = badges[bid];
  const B = new MockBattle();
  const wearer = makeUnit(b.owner, B, 0, 100);
  const ally = makeUnit('AllyHero', B, 0, 80);
  const enemy = makeUnit('EnemyHero', B, 1, 400);
  B.units.push(wearer, ally, enemy);

  // Apply badge
  b.apply(wearer, B, 1);
  appliedCount++;

  // Trigger waveStart
  B.emit('waveStart');

  // Trigger damaged / dealDamage
  B.emit('dealDamage', { target: enemy, amount: 200, basic: true, crit: true });
  B.emit('damaged', { src: enemy, amount: 150 });
  B.emit('dodged', { src: enemy });
}

console.log(`Successfully applied and tested all ${appliedCount} badges in simulated battle!`);

// Verify Save data badges registration for new badges
const immediateBadges = ['kris_ralsei', 'ralsei_kris', 'tasquemanager_dyle', 'flowery_dandy', 'chell_boxten'];
for (const bid of immediateBadges) {
  assert(ctx.Save.data.badges[bid], `Save.data.badges should have ${bid}`);
  assert.equal(ctx.Save.data.badges[bid].lvl, 1, `${bid} should be granted at level 1`);
}

console.log('All immediate badges properly granted to player save data!');
console.log('ALL BADGE OVERHAUL CHECKS PASSED WITH 100% SUCCESS!');
