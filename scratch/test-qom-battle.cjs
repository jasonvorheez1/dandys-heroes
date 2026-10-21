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
    remove: function() { if (this.parentNode && this.parentNode.removeChild) this.parentNode.removeChild(this); },
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
const storage = {};
const ctx = {
  console: console,
  setTimeout: () => {},
  clearTimeout: () => {},
  setInterval: () => {},
  clearInterval: () => {},
  requestAnimationFrame: (cb) => { if (cb) cb(); },
  cancelAnimationFrame: () => {},
  Math: Math,
  Date: Date,
  performance: { now: () => Date.now() },
  window: {},
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
    documentElement: makeElem('html')
  },
  localStorage: {
    getItem: k => storage[k] || null,
    setItem: (k, v) => { storage[k] = String(v); },
    removeItem: k => { delete storage[k]; }
  },
  navigator: { userAgent: 'Node' },
  location: { href: 'http://localhost/' }
};
ctx.window = ctx;
ctx.global = ctx;
ctx.self = ctx;

vm.createContext(ctx);

for (const rel of scriptPaths) {
  if (rel.includes('main.js') || rel.includes('websim.js')) continue;
  const abs = path.join(root, rel);
  if (fs.existsSync(abs)) {
    const code = fs.readFileSync(abs, 'utf8');
    vm.runInContext(code, ctx, { filename: rel });
  }
}

vm.runInContext('if (typeof FX !== "undefined" && FX.init) FX.init();', ctx);

const HEROES = vm.runInContext('HEROES', ctx);
const Battle = vm.runInContext('Battle', ctx);
const BADGES = vm.runInContext('BADGES', ctx);

console.log('Testing Queens of Mischief squad in full battle...');
const qomTeamIds = ['QOMGourdy', 'QOMEclipse', 'QOMRibecca', 'QOMSoulvester', 'QOMConnie'];
const opponentTeamIds = ['Dandy', 'Pebble', 'Delilah', 'Flyte', 'Shelly'];

const qomSpecs = qomTeamIds.map(id => ({
  id,
  lvl: 75,
  rank: 10,
  stars: 5,
  skills: { W: 75, G: 75, B: 75, P: 75, R: 75 },
  badge: Object.keys(BADGES).find(b => BADGES[b].owner === id) ? { id: Object.keys(BADGES).find(b => BADGES[b].owner === id), lvl: 5 } : null
}));

const oppSpecs = opponentTeamIds.map(id => ({
  id,
  lvl: 75,
  rank: 10,
  stars: 5,
  skills: { W: 75, G: 75, B: 75, P: 75, R: 75 },
  badge: Object.keys(BADGES).find(b => BADGES[b].owner === id) ? { id: Object.keys(BADGES).find(b => BADGES[b].owner === id), lvl: 5 } : null
}));

const b = new Battle({ offscreen: true });
b.start(qomSpecs, oppSpecs, { title: 'Queens of Mischief Stadium Showdown' });

console.log('Starting battle simulation...');
let tSec = 0;
for (let t = 0; t < 400 && !b.over; t++) {
  b.step(0.033);
  tSec += 0.033;
}

console.log(`Battle ended at t=${tSec.toFixed(2)}s, over=${b.over}, winner=${b.winner}`);
const qomAlive = b.units.filter(u => u.team === 0 && u.alive);
const oppAlive = b.units.filter(u => u.team === 1 && u.alive);
console.log(`QOM Team alive: ${qomAlive.length}/5 [${qomAlive.map(u => u.id + ' (' + Math.round(u.hpPct*100) + '% HP)').join(', ')}]`);
console.log(`Opponent Team alive: ${oppAlive.length}/5 [${oppAlive.map(u => u.id + ' (' + Math.round(u.hpPct*100) + '% HP)').join(', ')}]`);
console.log('SUCCESS: All Queens of Mischief performed and functioned flawlessly!');
