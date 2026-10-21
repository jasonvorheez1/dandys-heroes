const fs = require('fs');
const path = require('path');
const vm = require('vm');

const root = path.resolve(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const regex = /<script\s+src=["']([^"']+)["']/g;
let match;
const scriptPaths = [];
while ((match = regex.exec(html)) !== null) {
  scriptPaths.push(match[1]);
}

function makeElem(tag = 'div') {
  return {
    tagName: tag.toUpperCase(),
    className: '',
    id: '',
    style: {},
    dataset: {},
    children: [],
    innerHTML: '',
    textContent: '',
    classList: { add: () => {}, remove: () => {}, toggle: () => {}, contains: () => false },
    appendChild: function(c) { this.children.push(c); c.parentNode = this; return c; },
    removeChild: function(c) {
      const idx = this.children.indexOf(c);
      if (idx !== -1) this.children.splice(idx, 1);
      c.parentNode = null;
      return c;
    },
    remove: function() { if (this.parentNode) this.parentNode.removeChild(this); },
    addEventListener: () => {},
    removeEventListener: () => {},
    setAttribute: () => {},
    getAttribute: () => null,
    querySelector: () => makeElem(),
    querySelectorAll: () => [],
    getBoundingClientRect: () => ({ width: 560, height: 760, top: 0, left: 0, bottom: 760, right: 560 })
  };
}

const elements = {};
const sandbox = {
  console: console,
  setTimeout: (cb) => {},
  clearTimeout: () => {},
  setInterval: () => {},
  clearInterval: () => {},
  Math: Math, Date: Date, JSON: JSON, Array: Array, Object: Object, String: String, Number: Number, Boolean: Boolean, RegExp: RegExp, Set: Set, Map: Map, Promise: Promise, Error: Error,
  window: null,
  document: {
    createElement: makeElem,
    getElementById: (id) => elements[id] || (elements[id] = makeElem()),
    querySelector: (sel) => elements[sel] || (elements[sel] = makeElem()),
    querySelectorAll: () => [],
    addEventListener: () => {},
    removeEventListener: () => {},
    body: makeElem('body'),
    documentElement: makeElem('html'),
    title: ''
  },
  localStorage: {
    _data: {},
    getItem(k) { return this._data[k] !== undefined ? this._data[k] : null; },
    setItem(k, v) { this._data[k] = String(v); },
    removeItem(k) { delete this._data[k]; },
    clear() { this._data = {}; }
  },
  navigator: { userAgent: 'Node-VM' },
  location: { href: 'http://localhost/', search: '', hash: '' },
  performance: { now: () => Date.now() },
  addEventListener: () => {},
  removeEventListener: () => {},
  requestAnimationFrame: () => {},
  cancelAnimationFrame: () => {},
  Audio: function() { return { play: () => Promise.resolve(), pause: () => {}, addEventListener: () => {} }; }
};
sandbox.window = sandbox;
sandbox.global = sandbox;
sandbox.self = sandbox;

const ctx = vm.createContext(sandbox);

for (const rel of scriptPaths) {
  const full = path.join(root, rel);
  if (fs.existsSync(full)) {
    const code = fs.readFileSync(full, 'utf8');
    vm.runInContext(code, ctx, { filename: rel });
  }
}

const HEROES = vm.runInContext('HEROES', ctx);
const Battle = vm.runInContext('Battle', ctx);
const BADGES = vm.runInContext('BADGES', ctx);

console.log('--- TESTING COCOA DHBM REVAMP ---');

const cocoaDef = HEROES['Cocoa'];
if (!cocoaDef) throw new Error('Cocoa hero definition missing!');

console.log('Tier:', cocoaDef.tier, '| Role:', cocoaDef.role, '| Element:', cocoaDef.element);
console.log('Base HP:', cocoaDef.base.hp, '| Mag:', cocoaDef.base.mag, '| Def:', cocoaDef.base.def, '| Spd:', cocoaDef.base.spd);

// 1. Check skill tooltips format
for (const [key, sk] of Object.entries(cocoaDef.skills)) {
  const descStr = typeof sk.desc === 'function' ? sk.desc(sk.v || {}, sk.p || {}) : sk.desc;
  console.log(`Skill ${key} (${sk.name}): ${descStr.substring(0, 60)}...`);
  if (!descStr || descStr.includes('undefined') || descStr.includes('NaN')) {
    throw new Error(`Skill ${key} description contains undefined/NaN!`);
  }
}

// 2. Simulate a Battle with Cocoa in full White, Green, Blue, Purple, Red progression
console.log('\nSimulating Battle with Cocoa + Rudie + Soulvester vs Foes...');

const team1Specs = [
  { id: 'Cocoa', lvl: 80, rarity: 5, rank: 8, stars: 5, skills: { W: 80, G: 80, B: 80, P: 80, R: 80 }, badge: { id: 'cocoa_rudie', lvl: 5 } },
  { id: 'Rudie', lvl: 80, rarity: 5, rank: 8, stars: 5, skills: { W: 80, G: 80, B: 80, P: 80, R: 80 } },
  { id: 'Soulvester', lvl: 80, rarity: 5, rank: 8, stars: 5, skills: { W: 80, G: 80, B: 80, P: 80, R: 80 } }
];

const team2Specs = [
  { id: 'Boxten', lvl: 80, rarity: 5, rank: 8, stars: 5, skills: { W: 80, G: 80, B: 80, P: 80, R: 80 } },
  { id: 'Poppy', lvl: 80, rarity: 5, rank: 8, stars: 5, skills: { W: 80, G: 80, B: 80, P: 80, R: 80 } },
  { id: 'Sprout', lvl: 80, rarity: 5, rank: 8, stars: 5, skills: { W: 80, G: 80, B: 80, P: 80, R: 80 } }
];

const b = new Battle({ offscreen: true });
b.start(team1Specs, team2Specs, { title: 'Test Cocoa Battle' });

let cocoaDeliveredCount = 0;
let cocoaShieldTotal = 0;
const cocoaUnit = b.units.find(u => u.id === 'Cocoa');
if (!cocoaUnit) throw new Error('Cocoa not spawned in battle!');

b.on(cocoaUnit, 'bonbonDelivered', ev => {
  cocoaDeliveredCount++;
});

b.on(cocoaUnit, 'shieldDone', ev => {
  cocoaShieldTotal += ev.amount || 0;
});

console.log('Initial BonBons:', cocoaUnit.bonbons, '/', cocoaUnit.bonbonMax);
if (cocoaUnit.bonbons < 6) throw new Error('Cocoa Red skill should start her with full BonBons!');

for (let tick = 0; tick < 300; tick++) {
  b.step(0.033);
  if (b.over) break;
}

console.log('Battle simulated successfully to t =', b.t.toFixed(1), 's (over =', b.over, ')');
console.log('BonBons remaining:', cocoaUnit.bonbons);
console.log('BonBons delivered during combat:', cocoaDeliveredCount);
console.log('Cocoa Damage dealt:', Math.round(cocoaUnit.dmgDone || 0));
console.log('Cocoa Healing done:', Math.round(cocoaUnit.healDone || 0));
console.log('Cocoa Shielding done:', Math.round(cocoaShieldTotal || 0));

console.log('\n--- ALL COCOA TESTS PASSED CLEANLY! ---');
