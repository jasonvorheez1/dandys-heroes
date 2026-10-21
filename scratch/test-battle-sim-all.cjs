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
    classList: {
      add: () => {},
      remove: () => {},
      toggle: () => {},
      contains: () => false
    },
    appendChild: function(c) { this.children.push(c); return c; },
    removeChild: function(c) {
      const idx = this.children.indexOf(c);
      if (idx !== -1) this.children.splice(idx, 1);
      return c;
    },
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
  Math: Math,
  Date: Date,
  JSON: JSON,
  Array: Array,
  Object: Object,
  String: String,
  Number: Number,
  Boolean: Boolean,
  RegExp: RegExp,
  Set: Set,
  Map: Map,
  Promise: Promise,
  Error: Error,
  TypeError: TypeError,
  RangeError: RangeError,
  window: null,
  document: {
    createElement: makeElem,
    getElementById: (id) => {
      if (!elements[id]) elements[id] = makeElem();
      return elements[id];
    },
    querySelector: (sel) => {
      if (!elements[sel]) elements[sel] = makeElem();
      return elements[sel];
    },
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
  Audio: function() {
    return { play: () => Promise.resolve(), pause: () => {}, addEventListener: () => {} };
  }
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

console.log('Testing battles with playable heroes...');
const playableHeroIds = Object.keys(HEROES).filter(id => !HEROES[id].twistedOnly && !HEROES[id].weakling && !HEROES[id].minion);
console.log('Playable heroes count:', playableHeroIds.length);

const battleErrors = [];

// Test battles in chunks of 5 heroes vs 5 heroes
for (let i = 0; i < playableHeroIds.length; i += 5) {
  const team1Ids = playableHeroIds.slice(i, i + 5);
  if (team1Ids.length < 5) {
    team1Ids.push(...playableHeroIds.slice(0, 5 - team1Ids.length));
  }
  const team2Ids = playableHeroIds.slice((i + 5) % playableHeroIds.length, ((i + 5) % playableHeroIds.length) + 5);
  if (team2Ids.length < 5) {
    team2Ids.push(...playableHeroIds.slice(0, 5 - team2Ids.length));
  }

  const team1Specs = team1Ids.map(id => ({
    id,
    lvl: 60,
    rank: 8,
    stars: 5,
    skills: { W: 60, G: 60, B: 60, P: 60, R: 60 },
    badge: Object.keys(BADGES).find(b => BADGES[b].owner === id) ? { id: Object.keys(BADGES).find(b => BADGES[b].owner === id), lvl: 5 } : null
  }));

  const team2Specs = team2Ids.map(id => ({
    id,
    lvl: 60,
    rank: 8,
    stars: 5,
    skills: { W: 60, G: 60, B: 60, P: 60, R: 60 },
    badge: Object.keys(BADGES).find(b => BADGES[b].owner === id) ? { id: Object.keys(BADGES).find(b => BADGES[b].owner === id), lvl: 5 } : null
  }));

  try {
    const b = new Battle({ offscreen: true });
    b.start(team1Specs, team2Specs, { title: 'Test Battle' });

    // Simulate 300 ticks (approx 10-15s of combat)
    for (let t = 0; t < 300 && !b.over; t++) {
      b.step(0.033);
    }
    console.log(`Match ${i / 5 + 1}: [${team1Ids.join(',')}] vs [${team2Ids.join(',')}] -> OK (t=${b.t.toFixed(1)}s, over=${b.over})`);
  } catch (err) {
    console.error(`ERROR in battle with ${team1Ids.join(',')}:`, err.message, err.stack);
    battleErrors.push({ team: team1Ids, err: err.message });
  }
}

if (battleErrors.length === 0) {
  console.log('\nALL battle simulations passed cleanly!');
} else {
  console.log(`\n${battleErrors.length} battles crashed!`);
}
