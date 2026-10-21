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

console.log('Found', scriptPaths.length, 'scripts in index.html');

// Create browser-like sandbox
const listeners = {};
const elements = {};

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
    querySelectorAll: () => []
  };
}

const sandbox = {
  console: console,
  setTimeout: setTimeout,
  clearTimeout: clearTimeout,
  setInterval: setInterval,
  clearInterval: clearInterval,
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
    querySelector: () => makeElem(),
    querySelectorAll: () => [],
    addEventListener: (evt, cb) => {
      listeners[evt] = listeners[evt] || [];
      listeners[evt].push(cb);
    },
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
  addEventListener: (evt, cb) => {
    listeners[evt] = listeners[evt] || [];
    listeners[evt].push(cb);
  },
  removeEventListener: () => {},
  requestAnimationFrame: (cb) => setTimeout(cb, 16),
  cancelAnimationFrame: (id) => clearTimeout(id),
  Audio: function() {
    return { play: () => Promise.resolve(), pause: () => {}, addEventListener: () => {} };
  }
};
sandbox.window = sandbox;
sandbox.global = sandbox;
sandbox.self = sandbox;

const ctx = vm.createContext(sandbox);

// Load each script in order, catching errors
const failed = [];
for (const rel of scriptPaths) {
  const full = path.join(root, rel);
  if (!fs.existsSync(full)) {
    console.error('FILE NOT FOUND:', rel);
    failed.push({ file: rel, error: 'File not found' });
    continue;
  }
  try {
    const code = fs.readFileSync(full, 'utf8');
    vm.runInContext(code, ctx, { filename: rel });
  } catch (err) {
    console.error('ERROR in ' + rel + ':', err.message, err.stack.split('\n')[1]);
    failed.push({ file: rel, error: err });
  }
}

console.log('\n--- Script Loading Result ---');
if (failed.length === 0) {
  console.log('ALL scripts loaded without errors!');
} else {
  console.log(failed.length + ' scripts failed to load!');
}

// Deep Audits
console.log('\n=== RUNNING DEEP AUDITS ===');

const HEROES = vm.runInContext('HEROES', ctx);
const BADGES = vm.runInContext('BADGES', ctx);
const STATUS = vm.runInContext('STATUS', ctx);
const SkillDesc = vm.runInContext('typeof SkillDesc !== "undefined" ? SkillDesc : null', ctx);

console.log('Total Heroes:', Object.keys(HEROES || {}).length);
console.log('Total Badges:', Object.keys(BADGES || {}).length);
console.log('Total Statuses:', Object.keys(STATUS || {}).length);

// 1. Audit Badges
console.log('\n--- 1. AUDIT BADGES ---');
const badgeIssues = [];
const dummyBattle = {
  t: 1.0,
  foeTeam: () => [],
  enemiesOf: () => [],
  alliesOf: () => [],
  on: (u, evt, cb) => {},
  after: (sec, fn) => {},
  repeat: (times, interval, fn) => {},
  every: (owner, interval, fn) => {},
  applyStatus: (src, tgt, st, dur, opts) => {
    if (!STATUS[st]) {
      badgeIssues.push(`Badge applied unknown status '${st}'!`);
    }
  },
  hasStatus: (u, st) => false,
  removeStatus: (u, st) => {},
  cleanse: (u, n) => {},
  energy: (u, amt) => {},
  shield: (src, tgt, amt, dur) => {},
  fxFloatIcon: () => {},
  fxFloatObject: () => {},
  fxPill: () => {},
  fxRing: () => {},
  fxSparkle: () => {},
  dealDamage: () => {},
  damage: () => {},
  heal: () => {},
  knockback: () => {},
  anim: () => {},
  lowestHp: (list) => list[0] || null,
  highestEnergy: (list) => list[0] || null
};

for (const [bid, badge] of Object.entries(BADGES || {})) {
  if (!badge.owner || !HEROES[badge.owner]) {
    badgeIssues.push(`Badge ${bid}: owner '${badge.owner}' not found in HEROES`);
  }
  if (!badge.friend || !HEROES[badge.friend]) {
    badgeIssues.push(`Badge ${bid}: friend '${badge.friend}' not found in HEROES`);
  }
  if (typeof badge.stat !== 'function') {
    badgeIssues.push(`Badge ${bid}: missing or non-function 'stat'`);
  } else {
    try {
      const s = badge.stat(1);
      if (!s || s.includes('undefined') || s.includes('NaN')) {
        badgeIssues.push(`Badge ${bid}: stat(1) returned '${s}'`);
      }
    } catch (e) {
      badgeIssues.push(`Badge ${bid}: stat(1) threw: ${e.message}`);
    }
  }
  if (typeof badge.apply !== 'function') {
    badgeIssues.push(`Badge ${bid}: missing or non-function 'apply'`);
  } else {
    try {
      const dummyUnit = {
        id: badge.owner,
        team: 0,
        x: 100, y: 100,
        flat: {},
        mult: {},
        maxHp: 10000, hp: 10000,
        atk: 500, def: 200, mag: 400, mdef: 180,
        alive: true,
        hasStatus: (st) => false
      };
      badge.apply(dummyUnit, dummyBattle, 1);
    } catch (e) {
      badgeIssues.push(`Badge ${bid}: apply() threw: ${e.message}`);
    }
  }
}
if (badgeIssues.length === 0) {
  console.log('Badges integrity: ALL PASS (0 issues found)');
} else {
  console.log(`Badges integrity: ${badgeIssues.length} issues found:`);
  badgeIssues.slice(0, 20).forEach(i => console.log('  !', i));
}

// 2. Audit Heroes & Skills
console.log('\n--- 2. AUDIT HEROES & SKILLS ---');
const heroIssues = [];
for (const [hid, hero] of Object.entries(HEROES || {})) {
  if (hero.weakling || hero.minion || hero.twistedOnly) continue;
  if (!hero.name) heroIssues.push(`Hero ${hid}: missing name`);
  if (!hero.role) heroIssues.push(`Hero ${hid}: missing role`);
  if (!hero.skills) {
    heroIssues.push(`Hero ${hid}: missing skills`);
    continue;
  }
  const expectedSkills = ['W', 'G', 'B', 'P', 'R'];
  for (const skKey of expectedSkills) {
    const sk = hero.skills[skKey];
    if (!sk) {
      heroIssues.push(`Hero ${hid}: missing skill ${skKey}`);
      continue;
    }
    if (!sk.name) heroIssues.push(`Hero ${hid} skill ${skKey}: missing name`);
    if (!sk.desc) heroIssues.push(`Hero ${hid} skill ${skKey}: missing desc`);
    
    // Test SkillDesc formatting if available
    if (SkillDesc && sk.desc) {
      try {
        const formatted = SkillDesc.format(sk, hero, 60);
        if (formatted.includes('undefined') || formatted.includes('NaN')) {
          heroIssues.push(`Hero ${hid} skill ${skKey}: SkillDesc format contains undefined/NaN!`);
        }
      } catch (err) {
        heroIssues.push(`Hero ${hid} skill ${skKey}: SkillDesc.format threw: ${err.message}`);
      }
    }
  }
}
if (heroIssues.length === 0) {
  console.log('Heroes & Skills integrity: ALL PASS (0 issues found)');
} else {
  console.log(`Heroes & Skills integrity: ${heroIssues.length} issues found:`);
  heroIssues.slice(0, 30).forEach(i => console.log('  !', i));
}

// 3. Scan for Invalid Statuses in Code
console.log('\n--- 3. AUDIT STATUS USAGE ---');
const statusKeys = new Set(Object.keys(STATUS || {}));
console.log('Valid statuses count:', statusKeys.size);

// Scan all js/ files for applyStatus
const jsDir = path.join(root, 'js');
function scanDir(dir) {
  let files = [];
  for (const f of fs.readdirSync(dir)) {
    const p = path.join(dir, f);
    if (fs.statSync(p).isDirectory()) {
      files = files.concat(scanDir(p));
    } else if (f.endsWith('.js')) {
      files.push(p);
    }
  }
  return files;
}
const allJs = scanDir(jsDir);
const statusIssues = [];
for (const file of allJs) {
  const code = fs.readFileSync(file, 'utf8');
  // Match applyStatus(..., ..., 'status_name'
  const applyMatches = code.matchAll(/\.applyStatus\s*\(\s*[^,]+\s*,\s*[^,]+\s*,\s*['"]([a-zA-Z0-9_-]+)['"]/g);
  for (const m of applyMatches) {
    const st = m[1];
    if (!statusKeys.has(st)) {
      statusIssues.push(`${path.relative(root, file)}: applyStatus with invalid status '${st}'`);
    }
  }
  // Match hasStatus('status_name')
  const hasMatches = code.matchAll(/\.hasStatus\s*\(\s*['"]([a-zA-Z0-9_-]+)['"]\s*\)/g);
  for (const m of hasMatches) {
    const st = m[1];
    if (!statusKeys.has(st)) {
      statusIssues.push(`${path.relative(root, file)}: hasStatus with invalid status '${st}'`);
    }
  }
  // Match removeStatus(u, 'status_name')
  const removeMatches = code.matchAll(/\.removeStatus\s*\(\s*[^,]+\s*,\s*['"]([a-zA-Z0-9_-]+)['"]\s*\)/g);
  for (const m of removeMatches) {
    const st = m[1];
    if (!statusKeys.has(st)) {
      statusIssues.push(`${path.relative(root, file)}: removeStatus with invalid status '${st}'`);
    }
  }
}
if (statusIssues.length === 0) {
  console.log('Status usage integrity: ALL PASS (0 invalid statuses found)');
} else {
  console.log(`Status usage integrity: ${statusIssues.length} invalid status references found:`);
  statusIssues.forEach(i => console.log('  !', i));
}

process.exit(0);

