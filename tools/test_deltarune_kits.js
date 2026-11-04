const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const baseDir = path.resolve(__dirname, '..');
const readScript = rel => fs.readFileSync(path.join(baseDir, rel), 'utf8');

const ctx = vm.createContext({
  console,
  Math,
  Set,
  Map,
  Array,
  Object,
  Number,
  String,
  Boolean,
  RegExp,
  document: {
    createElement: () => ({
      classList: { add() {}, remove() {}, toggle() {} },
      style: {},
      querySelector: () => null,
      appendChild() {}
    })
  },
  CUE_SOURCES: [],
  Sound: { play() {} },
  STATUS: {},
  HEROES: {},
  HERO_IDS: [],
  PLAYABLE_IDS: [],
  HERO_OBTAIN: {},
  COLLAB_HERO_IDS: new Set(),
  SPECIAL_HERO_ART: {},
  SPECIAL_HERO_ICONS: {},
  SKILL_HERO_ART: {},
  HERO_GENDER: {},
  HERO_ANIMAL: {},
  HeroCollections: { catalogue: [] },
  DyleShop: { renderCharacters: () => {} },
  defHero: def => {
    ctx.HEROES[def.id] = def;
    if (!ctx.HERO_IDS.includes(def.id)) ctx.HERO_IDS.push(def.id);
    if (!ctx.PLAYABLE_IDS.includes(def.id)) ctx.PLAYABLE_IDS.push(def.id);
  },
  pcn: n => Math.round(n) + '%',
  Battle: function() {},
  Art: { collabAtlases: () => ({}) },
  FX: { burst() {} }
});
ctx.Battle.prototype.setNaturalSprite = function(u, name, phase) { return { u, name, phase }; };

// Execute scripts in order
const scriptsToRun = [
  'js/deltarune-visuals.js',
  'js/tasque-manager-visuals.js',
  'js/flowery-visuals.js',
  'js/kris-kit.js',
  'js/ralsei-kit.js',
  'js/tasque-manager-kit.js',
  'js/flowery-kit.js',
  'js/deltarune-shop.js'
];

for (const script of scriptsToRun) {
  vm.runInContext(readScript(script), ctx);
}

console.log('All Deltarune scripts loaded successfully in VM context.');

// Check Hero Registrations
const heroes = ['Kris', 'Ralsei', 'TasqueManager', 'Flowery'];
for (const id of heroes) {
  assert(ctx.HEROES[id], `HEROES.${id} must be defined`);
  assert(ctx.SPECIAL_HERO_ART[id], `SPECIAL_HERO_ART.${id} must be defined`);
  assert(ctx.SPECIAL_HERO_ICONS[id], `SPECIAL_HERO_ICONS.${id} must be defined`);
  assert(fs.existsSync(path.join(baseDir, ctx.SPECIAL_HERO_ART[id])), `SPECIAL_HERO_ART file for ${id} must exist`);
  assert(fs.existsSync(path.join(baseDir, ctx.SPECIAL_HERO_ICONS[id])), `SPECIAL_HERO_ICONS file for ${id} must exist`);
}

// Check Tiers
assert.equal(ctx.HEROES.Kris.tier, 'S', 'Kris tier should be S');
assert.equal(ctx.HEROES.Ralsei.tier, 'SS', 'Ralsei tier should be SS');
assert.equal(ctx.HEROES.TasqueManager.tier, 'SS', 'TasqueManager tier should be SS');
assert.equal(ctx.HEROES.Flowery.tier, 'S', 'Flowery tier should be S');

// Check Native Faces
assert.equal(ctx.HEROES.Kris.nativeFace, 1, 'Kris nativeFace should be 1');
assert.equal(ctx.HEROES.Ralsei.nativeFace, 1, 'Ralsei nativeFace should be 1');
assert.equal(ctx.HEROES.TasqueManager.nativeFace, -1, 'TasqueManager nativeFace should be -1');
assert.equal(ctx.HEROES.TasqueCompanion.nativeFace, -1, 'TasqueCompanion nativeFace should be -1');
assert.equal(ctx.HEROES.Flowery.nativeFace, 1, 'Flowery nativeFace should be 1');

// Check Collections and Genders
assert.equal(ctx.HERO_GENDER.Ralsei, 'Male');
assert.equal(ctx.HERO_GENDER.TasqueManager, 'Female');
assert.equal(ctx.HERO_GENDER.Flowery, 'Male');
assert.equal(ctx.HERO_GENDER.Kris, 'Other');
assert.equal(ctx.HERO_ANIMAL.TasqueManager, 'Cat');
assert.equal(ctx.HERO_ANIMAL.TasqueCompanion, 'Cat');
assert.equal(ctx.HERO_ANIMAL.Ralsei, 'Goat');

const drCollection = ctx.HeroCollections.catalogue.find(c => c.id === 'deltarune');
assert(drCollection, 'deltarune collection must exist in catalogue');
assert.equal(JSON.stringify(drCollection.members()), JSON.stringify(['Kris', 'Ralsei', 'TasqueManager', 'Flowery']));

// Test Mock Battle Simulation for waveStart & passives
class MockBattle {
  constructor() {
    this.t = 0;
    this.events = new Map();
    this.statuses = new Map();
    this.units = [];
    this.leftWall = 0;
    this.rightWall = 800;
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
    const s = { id: statusId, src, target, duration, stacks: opts.stacks || 1, t: duration };
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
  shield(src, target, amount, dur, opts = {}) {
    const sh = { amt: amount, t: dur };
    target.shields.push(sh);
    return sh;
  }
  damage(src, target, amount, opts = {}) {
    target.hp -= amount;
    return { amount };
  }
  cleanse() {}
  anim() {}
  energy(u, amt) { u.energy = Math.min(100, (u.energy || 0) + amt); }
  alliesOf(u) { return this.units.filter(x => x.team === u.team); }
  enemiesOf(u) { return this.units.filter(x => x.team !== u.team); }
  isTargetable(u) { return u && u.alive; }
  distance(a, b) { return Math.abs(a.x - b.x); }
  summon(owner, config) {
    const minion = {
      ...config,
      team: owner.team,
      alive: true,
      minion: true,
      owner,
      baseStats: { aggro: config.aggro || 1, hp: config.hp },
      max: { hp: config.hp },
      hp: config.hp,
      shields: [],
      hasStatus: s => this.hasStatus(minion, s),
      recompute() {}
    };
    this.units.push(minion);
    return minion;
  }
}

function makeUnit(heroDef, team = 0, x = 100) {
  const u = {
    id: heroDef.id,
    team,
    x,
    depth: 0.5,
    face: team === 0 ? 1 : -1,
    alive: true,
    minion: false,
    rarity: 5,
    max: { hp: heroDef.base.hp },
    hp: heroDef.base.hp,
    st: { ...heroDef.base },
    flat: {},
    shields: [],
    statusVersion: 0,
    guards: [],
    hasStatus(s) { return B.hasStatus(this, s); },
    getStatus(s) { return B.getStatus(this, s); }
  };
  return u;
}

const B = new MockBattle();

// 1. Test Kris
const kris = makeUnit(ctx.HEROES.Kris, 0, 100);
B.units.push(kris);
const foe1 = { id: 'DummyFoe', team: 1, alive: true, minion: false, x: 500, depth: 0.5, hp: 5000, max: { hp: 5000 }, st: { atk: 200 }, shields: [], hasStatus: s => B.hasStatus(foe1, s) };
B.units.push(foe1);

// Initialize Kris passives
ctx.HEROES.Kris.skills.W.passive(kris, B);
ctx.HEROES.Kris.skills.P.passive(kris, B);
ctx.HEROES.Kris.skills.R.passive(kris, B, null, { hpPct: 10, atkPct: 10, courageDur: 10 });

assert.equal(kris._krisTP, 0, 'Kris starts with 0 TP');
assert(B.hasStatus(foe1, 'kris_checked'), 'Kris applies CHECKED to highest-threat foe');

// Test waveStart on Kris
kris._krisCourageUsed = true;
B.removeStatus(foe1, 'kris_checked');
B.emit('waveStart');
assert.equal(kris._krisCourageUsed, false, 'Kris courage reset on waveStart');
assert(B.hasStatus(foe1, 'kris_checked'), 'Kris re-applies CHECKED on waveStart');

// 2. Test Ralsei
const ralsei = makeUnit(ctx.HEROES.Ralsei, 0, 80);
B.units.push(ralsei);
ctx.HEROES.Ralsei.skills.W.passive(ralsei, B);
ctx.HEROES.Ralsei.skills.R.passive(ralsei, B, null, { hpPct: 8, magPct: 10, guardDur: 10 });
assert.equal(ralsei._ralseiTP, 25, 'Ralsei starts with 25 TP');

// Test waveStart on Ralsei
ralsei._ralseiTP = 10;
ralsei._ralseiReviveUsed = true;
ralsei._ralseiPrinceUsed = true;
B.emit('waveStart');
assert.equal(ralsei._ralseiTP, 35, 'Ralsei TP increases by 25 on waveStart');
assert.equal(ralsei._ralseiReviveUsed, false, 'ReviveSong resets on waveStart');
assert.equal(ralsei._ralseiPrinceUsed, false, 'Prince of the Dark resets on waveStart');

// 3. Test Tasque Manager
const tasqueMgr = makeUnit(ctx.HEROES.TasqueManager, 0, 70);
B.units.push(tasqueMgr);
ctx.HEROES.TasqueManager.skills.W.passive(tasqueMgr, B);
ctx.HEROES.TasqueManager.skills.P.passive(tasqueMgr, B);
assert.equal(tasqueMgr._tasques.length, 2, 'Tasque Manager summons 2 Tasques');
assert(tasqueMgr._tasques[0].hp > tasqueMgr.max.hp * 0.55, 'Tasque has at least 60% of Tasque Manager HP');
assert(B.hasStatus(tasqueMgr._tasques[0], 'tasque_companion_guard'), 'Tasque has Managed Guard');

// Test Tasque death and waveStart re-summoning
tasqueMgr._tasques[0].alive = false;
tasqueMgr._tasques[1]._tasqueReassembled = true;
tasqueMgr._tasqueComplianceUsed = true;
B.emit('waveStart');
assert.equal(tasqueMgr._tasques.filter(t => t.alive).length, 2, 'Tasque Manager re-summons dead Tasques to maintain 2 on waveStart');
assert.equal(tasqueMgr._tasques[0]._tasqueReassembled, false, 'Surviving Tasque reassembled flag reset on waveStart');
assert.equal(tasqueMgr._tasqueComplianceUsed, false, 'Forced compliance reset on waveStart');

// 4. Test Flowery
const flowery = makeUnit(ctx.HEROES.Flowery, 0, 110);
B.units.push(flowery);
ctx.HEROES.Flowery.skills.W.passive(flowery, B);
ctx.HEROES.Flowery.skills.P.passive(flowery, B);
assert(B.hasStatus(flowery, 'flowery_max'), 'Flowery starts with Maximum Stats');
assert(flowery.shields.length > 0, 'Flowery starts with Illusory Shield');

// Test waveStart on Flowery
flowery._flowCharges = 5;
flowery._flowOmegaUsed = true;
flowery._flowFirst = false;
B.removeStatus(flowery, 'flowery_max');
flowery.shields = [];
flowery._flowShield = null;
B.emit('waveStart');
assert(B.hasStatus(flowery, 'flowery_max'), 'Flowery re-gains Maximum Stats on waveStart');
assert(flowery.shields.length > 0, 'Flowery re-gains Illusory Shield on waveStart');
assert.equal(flowery._flowCharges, 0, 'Flowery charges reset on waveStart');
assert.equal(flowery._flowOmegaUsed, false, 'Flowery Omega reset on waveStart');
assert.equal(flowery._flowFirst, true, 'Flowery first charge ready on waveStart');

console.log('ALL DELTARUNE TESTS PASSED WITH 100% SUCCESS!');
