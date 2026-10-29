const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const bundle = fs.readFileSync(path.join(__dirname, '../js/game.js'), 'utf8');
const start = bundle.indexOf('var S=') + 6;
const end = bundle.indexOf('];\nfor(var i=', start) + 1;
const map = new Map(JSON.parse(bundle.slice(start, end)));

const context = {
  HEROES: {},
  PLAYABLE_IDS: [],
  HERO_IDS: [],
  BADGES: {},
  CAMPAIGNS: {},
  Sound: { play: () => true },
  FX: {
    burst() {}, shake() {}, ring() {}, floatIcon() {}, floatObject() {}, targetLine() {}, sparkle() {}, boom() {}
  },
  chance: () => false,
  rnd: (a, b) => (a + b) / 2,
  TEAM_E: 1,
  TEAM_P: 0,
  tuneSkill: () => {},
  defHero: (h) => { context.HEROES[h.id] = h; },
  defBadge: (b) => { context.BADGES[b.id] = b; },
  defCampaign: (c) => { context.CAMPAIGNS[c.id] = c; },
  OBTAIN: { Collab: { rank: 4 } },
  obtainOf: () => ({ rank: 1 }),
  friendshipRecLevel: () => 1
};

vm.createContext(context);
vm.runInContext(map.get('data/heroes14.js'), context);
vm.runInContext(map.get('data/badges.js'), context);
vm.runInContext(map.get('data/campaigns.js'), context);

console.log('--- TESTING TENDERHEART SPROUT & SHARE BEAR COSMO ---');

const sprout = context.HEROES.TenderheartSprout;
const cosmo = context.HEROES.ShareBearCosmo;

assert.ok(sprout, 'TenderheartSprout exists');
assert.ok(cosmo, 'ShareBearCosmo exists');
assert.equal(sprout.tier, 'A', 'Sprout is A Tier');
assert.equal(cosmo.tier, 'S', 'Cosmo is S Tier');
assert.equal(sprout.role, 'Control', 'Sprout is Control');
assert.equal(cosmo.role, 'Control', 'Cosmo is Control');

const skillKeys = ['W', 'G', 'B', 'P', 'R'];
skillKeys.forEach(k => {
  assert.ok(sprout.skills[k], `Sprout has skill ${k}`);
  assert.ok(cosmo.skills[k], `Cosmo has skill ${k}`);
  assert.ok(sprout.skills[k].desc, `Sprout skill ${k} has desc`);
  assert.ok(cosmo.skills[k].desc, `Cosmo skill ${k} has desc`);
});

// Mock battle environment for skill execution testing
const battleMock = {
  t: 10,
  units: [],
  listeners: {},
  statuses: [],
  damages: [],
  heals: [],
  shields: [],
  logs: [],
  on(unit, evt, fn) {
    (this.listeners[evt] = this.listeners[evt] || []).push({ unit, fn });
  },
  emit(evt, payload) {
    (this.listeners[evt] || []).forEach(L => L.fn(payload));
  },
  applyStatus(src, tgt, id, dur, opt) {
    this.statuses.push({ src, tgt, id, dur, opt });
    tgt.statuses = tgt.statuses || {};
    tgt.statuses[id] = true;
    this.emit('statusApplied', { src, unit: tgt, id, dur, ...opt });
  },
  removeStatus(tgt, id) {
    if (tgt.statuses) delete tgt.statuses[id];
  },
  damage(src, tgt, amt, opt) {
    this.damages.push({ src, tgt, amt, opt });
    this.emit('damaged', { src, unit: tgt, dmg: amt, ...opt });
  },
  heal(src, tgt, amt, opt) {
    this.heals.push({ src, tgt, amt, opt });
    this.emit('healDone', { src, target: tgt, amount: amt, ...opt });
  },
  shield(src, tgt, amt, dur, opt) {
    this.shields.push({ src, tgt, amt, dur, opt });
    this.emit('shieldDone', { src, target: tgt, amount: amt, dur, ...opt });
  },
  cleanse(tgt) {},
  energy(u, n) { u.energy = (u.energy || 0) + n; },
  anim() {},
  fxFloatIcon() {},
  fxFloatObject() {},
  fxRing() {},
  fxTargetLine() {},
  fxSparkle() {},
  fxBoom() {},
  log(msg) { this.logs.push(msg); },
  after(delay, fn) { fn(); },
  every(owner, interval, fn) {},
  teamAura(u, fn) { fn(u); },
  alliesOf(u) { return this.units.filter(x => x.team === u.team); },
  enemiesOf(u) { return this.units.filter(x => x.team !== u.team); }
};

// Test unit instances
const uSprout = {
  id: 'TenderheartSprout', name: 'Tenderheart Sprout', team: 0, alive: true, x: 100, y: 100,
  st: { atk: 205, mag: 425 }, max: { hp: 3850 }, hp: 3850, flat: {}, def: sprout
};
const uCosmo = {
  id: 'ShareBearCosmo', name: 'Share Bear Cosmo', team: 0, alive: true, x: 80, y: 100,
  st: { atk: 215, mag: 495 }, max: { hp: 4450 }, hp: 4450, flat: {}, def: cosmo
};
const foe1 = {
  id: 'Foe1', name: 'Twisted Foe 1', team: 1, alive: true, x: 300, y: 100,
  st: { atk: 300, mag: 300 }, max: { hp: 5000 }, hp: 5000, energy: 60, flat: {}
};
const foe2 = {
  id: 'Foe2', name: 'Twisted Foe 2', team: 1, alive: true, x: 350, y: 100,
  st: { atk: 250, mag: 250 }, max: { hp: 4000 }, hp: 4000, energy: 40, flat: {}
};

battleMock.units = [uSprout, uCosmo, foe1, foe2];

// Initialize Sprout's passives
sprout.skills.W.passive(uSprout, battleMock, sprout.skills.W.v, sprout.skills.W.p);
sprout.skills.P.passive(uSprout, battleMock, sprout.skills.P.v, sprout.skills.P.p);
sprout.skills.R.passive(uSprout, battleMock, sprout.skills.R.v, sprout.skills.R.p);

assert.equal(uSprout.flat.acc, 9999, 'Sprout accuracy set by W passive');
assert.ok(uSprout._caringLeadership, 'Sprout caring leadership set by R passive');

// Test Sprout W Ultimate Cast (Care Bear Stare)
sprout.skills.W.cast(uSprout, battleMock, sprout.skills.W.v, sprout.skills.W.p);
assert.ok(foe1._empathyLinkedWith === foe2, 'Foe 1 empathy linked with Foe 2');
assert.ok(foe2._empathyLinkedWith === foe1, 'Foe 2 empathy linked with Foe 1');
console.log('✓ Empathy Link successfully bound between Foe 1 and Foe 2');

// Test Empathy Link damage replication: damage to Foe 1 replicates to Foe 2
const preRepCount = battleMock.damages.length;
battleMock.damage(uSprout, foe1, 1000, { type: 'magic', tag: 'Test Hit' });
const linkHit = battleMock.damages.find(d => d.tgt === foe2 && d.opt.tag === 'Empathy Link');
assert.ok(linkHit, 'Empathy Link replicated damage to Foe 2');
assert.equal(linkHit.amt, 650, 'Replicated 65% of damage as True Damage');
console.log('✓ Empathy Link damage replication verified (65% True Damage)');

// Test Crowd Control Mirroring: CC applied to Foe 1 mirrors to Foe 2
battleMock.applyStatus(uSprout, foe1, 'stun', 2.0);
const ccMirror = battleMock.statuses.find(s => s.tgt === foe2 && s.id === 'stun' && s.opt && s.opt._mirrored);
assert.ok(ccMirror, 'Stun on Foe 1 mirrored to Foe 2');
console.log('✓ Hard CC mirroring verified');

// Test Sprout Purple passive: retaliation when an enemy CCs an ally
battleMock.applyStatus(foe1, uCosmo, 'freeze', 3.0);
const retaliationStun = battleMock.statuses.find(s => s.src === uSprout && s.tgt === foe1 && s.id === 'stun');
assert.ok(retaliationStun, 'Offending enemy stunned on ally CC');
assert.ok(battleMock.shields.find(s => s.tgt === uCosmo), 'CC-ed ally received Warm Heart Shield');
console.log('✓ From the Bottom of My Heart anti-CC retaliation verified');

// Initialize Cosmo's passives
cosmo.skills.B.passive(uCosmo, battleMock, cosmo.skills.B.v, cosmo.skills.B.p);
cosmo.skills.P.passive(uCosmo, battleMock, cosmo.skills.P.v, cosmo.skills.P.p);
cosmo.skills.R.passive(uCosmo, battleMock, cosmo.skills.R.v, cosmo.skills.R.p);

assert.ok(uCosmo._theSweetestGift, 'Cosmo Sweetest Gift flag set by R passive');

// Test Cosmo Equal Slices: enemy gets buff -> duplicated to allies
battleMock.applyStatus(foe1, foe1, 'atkup', 5.0);
const copiedBuff = battleMock.statuses.find(s => s.tgt === uSprout && s.id === 'atkup');
assert.ok(copiedBuff, 'Positive buff copied to allies via Equal Slices');
console.log('✓ Equal Slices buff duplication verified');

// Test Cosmo Sharing is Caring: heal to one ally duplicated to others
battleMock.heal(uSprout, uSprout, 500, { tag: 'Test Heal' });
const sharedHeal = battleMock.heals.find(h => h.tgt === uCosmo && h.opt && h.opt._shared);
assert.ok(sharedHeal, 'Heal shared with other allies');
assert.equal(sharedHeal.amt, 500 * 0.35, '35% heal shared');
console.log('✓ Sharing is Caring heal duplication verified');

// Test Cosmo W Ultimate Cast (Share or Else!)
const preEnergySprout = uSprout.energy || 0;
cosmo.skills.W.cast(uCosmo, battleMock, cosmo.skills.W.v, cosmo.skills.W.p);
assert.ok((foe1.energy || 0) < 60, 'Foe 1 energy siphoned');
assert.ok((uSprout.energy || 0) > preEnergySprout, 'Stolen energy distributed to allies');
console.log('✓ Share or Else! energy siphoning and team redistribution verified');

console.log('\nALL TENDERHEART SPROUT & SHARE BEAR COSMO CHECKS PASSED PERFECTLY!');
