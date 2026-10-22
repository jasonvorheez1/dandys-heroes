const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const root = path.resolve(__dirname, '..');

// Create test environment
const sandbox = {
  console,
  setTimeout,
  clearTimeout,
  performance: { now: () => Date.now() },
  requestAnimationFrame: (cb) => setTimeout(cb, 16),
  clamp: (v, min, max) => Math.min(Math.max(v, min), max),
  Sound: { play: () => {} },
  STATUS: {
    glisten_dizzy: { id: 'glisten_dizzy', kind: 'debuff' },
    exposed: { id: 'exposed', kind: 'debuff' },
    shock: { id: 'shock', kind: 'debuff' },
    silence: { id: 'silence', kind: 'debuff' },
    ward: { id: 'ward', kind: 'buff' },
    atkup: { id: 'atkup', kind: 'buff' },
    magup: { id: 'magup', kind: 'buff' }
  },
  OBTAIN: {
    Main: { rank: 1, name: 'Main' },
    Rare: { rank: 2, name: 'Rare' },
    SuperRare: { rank: 3, name: 'Super Rare' },
    UltraRare: { rank: 4, name: 'Ultra Rare' },
    Collab: { rank: 10, name: 'Collaboration' }
  },
  obtainOf: (id) => {
    if (id === 'Vee') return { rank: 4, name: 'Ultra Rare' };
    if (id === 'Glisten') return { rank: 3, name: 'Super Rare' };
    if (id === 'Goob') return { rank: 2, name: 'Rare' };
    return { rank: 1, name: 'Main' };
  },
  HEROES: {},
  defHero: (h) => { sandbox.HEROES[h.id] = h; return h; },
  BADGES: {},
  defBadge: (b) => { sandbox.BADGES[b.id] = b; return b; },
  BADGE_MAX_LVL: 5,
  BADGE_IDS_FOR: (id) => Object.keys(sandbox.BADGES).filter(k => sandbox.BADGES[k].owner === id),
  CAMPAIGNS: {},
  defCampaign: (c) => { sandbox.CAMPAIGNS[c.id] = c; return c; },
  friendshipRecLevel: (a, b) => {
    const ra = sandbox.obtainOf(a).rank, rb = sandbox.obtainOf(b).rank;
    const high = Math.max(ra, rb), low = Math.min(ra, rb);
    return 45 + high * 5 + low * 2 + (high >= sandbox.OBTAIN.Collab.rank ? 8 : 0);
  },
  glistenPartner: (u, B) => B.alliesOf(u).find(a => a !== u) || u,
  glistenAudience: (u) => u.glistenAudience
};

const ctx = vm.createContext(sandbox);

// Load badges_extra.js and campaigns_extra.js
const badgesExtraCode = fs.readFileSync(path.join(root, 'js/data/badges_extra.js'), 'utf8');
vm.runInContext(badgesExtraCode, ctx);

const campaignsExtraCode = fs.readFileSync(path.join(root, 'js/data/campaigns_extra.js'), 'utf8');
vm.runInContext(campaignsExtraCode, ctx);

console.log('Testing Glisten Friendship Badges...');

// 1. Verify badge definitions
const bgGoob = sandbox.BADGES['glisten_goob'];
assert(bgGoob, 'glisten_goob badge must exist');
assert.strictEqual(bgGoob.owner, 'Glisten', 'glisten_goob owner is Glisten');
assert.strictEqual(bgGoob.friend, 'Goob', 'glisten_goob friend is Goob');
assert(bgGoob.name.includes('Goob'), 'Badge name mentions Goob');
assert(bgGoob.icon, 'Badge has an icon');
console.log('✓ glisten_goob badge definition valid:', bgGoob.name);

const bgVee = sandbox.BADGES['glisten_vee'];
assert(bgVee, 'glisten_vee badge must exist');
assert.strictEqual(bgVee.owner, 'Glisten', 'glisten_vee owner is Glisten');
assert.strictEqual(bgVee.friend, 'Vee', 'glisten_vee friend is Vee');
assert(bgVee.name.includes('Vee'), 'Badge name mentions Vee');
assert(bgVee.icon, 'Badge has an icon');
console.log('✓ glisten_vee badge definition valid:', bgVee.name);

// 2. Verify BADGE_IDS_FOR('Glisten')
const glistenBadges = sandbox.BADGE_IDS_FOR('Glisten');
assert(glistenBadges.includes('glisten_goob'), 'BADGE_IDS_FOR includes glisten_goob');
assert(glistenBadges.includes('glisten_vee'), 'BADGE_IDS_FOR includes glisten_vee');
console.log('✓ BADGE_IDS_FOR("Glisten") returned:', glistenBadges);

// 3. Verify campaigns
const cpGoob = sandbox.CAMPAIGNS['glisten_goob'];
assert(cpGoob, 'glisten_goob campaign must exist');
assert.strictEqual(cpGoob.badge, 'glisten_goob');
assert.strictEqual(cpGoob.a, 'Glisten');
assert.strictEqual(cpGoob.b, 'Goob');
assert.strictEqual(cpGoob.stages.length, 8, 'Campaign has 8 stages');
console.log('✓ glisten_goob campaign valid with 8 stages:', cpGoob.title);

const cpVee = sandbox.CAMPAIGNS['glisten_vee'];
assert(cpVee, 'glisten_vee campaign must exist');
assert.strictEqual(cpVee.badge, 'glisten_vee');
assert.strictEqual(cpVee.a, 'Glisten');
assert.strictEqual(cpVee.b, 'Vee');
assert.strictEqual(cpVee.stages.length, 8, 'Campaign has 8 stages');
console.log('✓ glisten_vee campaign valid with 8 stages:', cpVee.title);

// 4. Test Goob badge in mock combat
console.log('\nTesting glisten_goob combat application:');
const createUnit = (id, team, maxHp, mag) => ({
  id, team, alive: true, hp: maxHp, max: { hp: maxHp }, st: { mag, def: 50 },
  flat: {}, statuses: [], x: 100, y: 100,
  hasStatus(s) { return this.statuses.some(st => st.id === s); },
  removeStatus(s) { this.statuses = this.statuses.filter(st => st.id !== s); }
});

const createMockBattle = (allies, enemies) => {
  const events = {};
  const everyCallbacks = [];
  return {
    t: 1.0,
    alliesOf: (u) => allies.filter(a => a.team === u.team && a.alive),
    enemiesOf: (u) => enemies.filter(e => e.team !== u.team && e.alive),
    lowestHp: (list) => list.slice().sort((a, b) => (a.hp/a.max.hp) - (b.hp/b.max.hp))[0],
    on: (u, ev, fn) => {
      if (!events[ev]) events[ev] = [];
      events[ev].push(fn);
      return () => { events[ev] = events[ev].filter(f => f !== fn); };
    },
    emit: (ev, data) => {
      (events[ev] || []).forEach(fn => fn(data));
    },
    every: (u, interval, fn) => {
      everyCallbacks.push(fn);
    },
    tickEvery: () => {
      everyCallbacks.forEach(fn => fn());
    },
    applyStatus: (src, target, status, dur, opt) => {
      target.statuses.push({ id: status, dur, opt });
    },
    removeStatus: (target, status) => {
      target.removeStatus(status);
    },
    shield: (src, target, amt, dur) => {
      target.shieldAmt = (target.shieldAmt || 0) + amt;
    },
    heal: (src, target, amt, opt) => {
      target.hp = Math.min(target.max.hp, target.hp + amt);
      target.healedAmt = (target.healedAmt || 0) + amt;
    },
    damage: (src, target, amt, opt) => {
      target.damageTaken = (target.damageTaken || 0) + amt;
    },
    cleanse: (target, count) => {
      target.cleansed = (target.cleansed || 0) + count;
    },
    energy: (target, amt) => {
      target.energy = (target.energy || 0) + amt;
    },
    fxSparkle: () => {},
    fxFloatIcon: () => {},
    fxRing: () => {}
  };
};

const glisten1 = createUnit('Glisten', 'heroes', 3500, 450);
const ally1 = createUnit('Goob', 'heroes', 4000, 200);
ally1.hp = 2000; // low hp
const enemy1 = createUnit('Twisted', 'monsters', 5000, 300);

const mockB1 = createMockBattle([glisten1, ally1], [enemy1]);
bgGoob.apply(glisten1, mockB1, 3);

assert(glisten1.flat.shieldPowP > 0.25, 'shieldPowP increased');
assert(glisten1.flat.hpP > 0.20, 'hpP increased');

// Simulate Glisten having dizzy status
glisten1.statuses.push({ id: 'glisten_dizzy' });
assert(glisten1.hasStatus('glisten_dizzy'), 'Has dizzy');
mockB1.tickEvery();
assert(!glisten1.hasStatus('glisten_dizzy'), 'Dizzy cleansed by Goob badge');
assert(glisten1.shieldAmt > 0, 'Glisten gained soft landing shield');
console.log('✓ Soft Landing: Dizzy status successfully neutralized and shield granted');

// Simulate rescue cast
mockB1.emit('cast', {});
assert(ally1.shieldAmt > 0, 'Rescued ally received Plush Hug Shield');
assert(ally1.hasStatus('ward'), 'Rescued ally received Ward');
console.log('✓ Rescue Cast: Plush Hug Shield and Ward applied to ally');

// Simulate Perfect Reflection counter
mockB1.emit('dealDamage', { tag: 'Perfect Reflection', target: enemy1 });
assert(enemy1.hasStatus('slow'), 'Attacker slowed by yarn');
assert(enemy1.hasStatus('taunt'), 'Attacker taunted by yarn');
assert(ally1.healedAmt > 0, 'Lowest HP ally healed by fluffy rebound');
console.log('✓ Perfect Reflection Counter: Attacker entangled/taunted and ally healed');

// 5. Test Vee badge in mock combat
console.log('\nTesting glisten_vee combat application:');
const glisten2 = createUnit('Glisten', 'heroes', 3500, 500);
const enemy2 = createUnit('TwistedMage', 'monsters', 6000, 600);
glisten2.glistenAudience = enemy2;

const mockB2 = createMockBattle([glisten2], [enemy2]);
bgVee.apply(glisten2, mockB2, 3);

assert(glisten2.flat.magP > 0.25, 'magP increased');
assert(glisten2.flat.cdr > 0.20, 'cdr increased');

// Test Audience Exposure
mockB2.tickEvery();
assert(enemy2.hasStatus('exposed'), 'Audience receives exposed');
assert(enemy2.hasStatus('slow'), 'Audience receives attack speed slow');
console.log('✓ Primetime Audience: 🪞 Audience marked as exposed and slowed');

// Test Prismatic Close-Up Studio Spotlight
mockB2.emit('dealDamage', { tag: 'Prismatic Close-Up', target: enemy2 });
assert(enemy2.damageTaken > 0, 'Target took Studio Spotlight bonus magic damage');
assert(enemy2.hasStatus('shock'), 'Target shocked');
assert(glisten2.energy > 0, 'Glisten team gained energy siphoned from Audience');
console.log('✓ Prismatic Close-Up: Studio Spotlight burst, shock, and energy siphon passed');

// Test Overcharged Reflection
mockB2.emit('dealDamage', { tag: 'Perfect Reflection', target: enemy2 });
assert(enemy2.hasStatus('silence'), 'Attacker silenced');
assert(glisten2.hasStatus('magup'), 'Glisten gained Magic Attack stack');
console.log('✓ Overcharged Reflection: Attacker silenced and Glisten gained Magic Attack buff');

console.log('\nALL GLISTEN FRIENDSHIP BADGE TESTS PASSED!');
