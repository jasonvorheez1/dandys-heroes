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
    appendChild: function(c) { this.children.push(c); return c; },
    removeChild: function(c) { return c; },
    addEventListener: () => {},
    removeEventListener: () => {},
    querySelector: () => makeElem(),
    querySelectorAll: () => []
  };
}

const sandbox = {
  console,
  setTimeout: () => {},
  clearTimeout: () => {},
  setInterval: () => {},
  clearInterval: () => {},
  Math,
  Date,
  JSON,
  Array,
  Object,
  String,
  Number,
  Boolean,
  RegExp,
  Set,
  Map,
  Promise,
  Error,
  window: null,
  document: {
    createElement: makeElem,
    getElementById: () => makeElem(),
    querySelector: () => makeElem(),
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

let loaded = 0;
for (const rel of scriptPaths) {
  const full = path.join(root, rel);
  if (fs.existsSync(full)) {
    const code = fs.readFileSync(full, 'utf8');
    try {
      vm.runInContext(code, ctx, { filename: rel });
      loaded++;
    } catch (e) {
      // console.log('Err in', rel, e.message);
    }
  }
}
const HEROES = vm.runInContext('HEROES', ctx);
console.log('Loaded scripts:', loaded);
console.log('Total heroes:', HEROES ? Object.keys(HEROES).length : 0);

const inspect = ['Dandy', 'Pebble', 'Scraps', 'Flutter', 'Ribecca', 'Astro', 'PureVanillaCookie', 'ShadowMilkCookie', 'CreamPuffCookie', 'GingerBrave', 'Bobette', 'Poppy', 'Gigi'];
for (const id of inspect) {
  const h = HEROES && HEROES[id];
  if (!h) { console.log('Not found:', id); continue; }
  console.log(`=== ${id} (${h.name}) [${h.role}] ===`);
  for (const k of Object.keys(h.skills)) {
    const s = h.skills[k];
    console.log(`  ${k}: "${s.name}" (${s.type || (s.cast ? 'Active' : 'Passive')})`);
  }
}
