/* Run with node scratch/test-scraps-relentless.cjs. Exercises Scraps relentless DPS kit. */
const fs = require('fs');
const vm = require('vm');
const assert = require('assert');
const path = require('path');
const root = path.resolve(__dirname, '..');

function node() { return {
  style: { setProperty() {}, removeProperty() {} },
  classList: { add() {}, remove() {}, toggle() {}, contains() { return false; } },
  dataset: {}, children: [], append(...v) { this.children.push(...v); },
  appendChild(v) { this.children.push(v); return v; }, removeChild() {}, replaceChildren() { this.children = []; }, remove() {},
  querySelector() { return node(); }, querySelectorAll() { return []; }, setAttribute() {}, getAttribute() { return ''; }, addEventListener() {},
  getBoundingClientRect() { return { width: 560, height: 760, left: 0, top: 0 }; },
  get firstChild() { return null; }, parentElement: { classList: { toggle() {} } }, clientWidth: 560, clientHeight: 760, hidden: true
}; }

const ctx = vm.createContext({
  console: { log: console.log, error: console.error, warn(...a) {} },
  document: { querySelector() { return node(); }, querySelectorAll() { return []; }, createElement: node, documentElement: node(), body: node(), addEventListener() {} },
  window: null, localStorage: { getItem() { return null; }, setItem() {}, removeItem() {} },
  navigator: { userAgent: 'node', hardwareConcurrency: 4 }, location: { search: '', href: 'http://localhost' },
  performance, URL, URLSearchParams, Image: class {}, Audio: class {}, setTimeout: () => 0, clearTimeout() {},
  setInterval: () => 0, clearInterval() {}, requestAnimationFrame: () => 0, cancelAnimationFrame() {},
  matchMedia: () => ({ matches: false, addEventListener() {} }), innerWidth: 560, innerHeight: 760, assert
});
ctx.window = ctx; ctx.addEventListener = () => {};

const scripts = [...fs.readFileSync(path.join(root, 'index.html'), 'utf8').matchAll(/<script src="([^"]+)"/g)]
  .map(m => m[1]).filter(s => !['js/main.js', 'js/websim.js'].includes(s));
for (const file of scripts) vm.runInContext(fs.readFileSync(path.join(root, file), 'utf8'), ctx, { filename: file });

vm.runInContext(`
Save.data = Save.fresh(); Save.write = () => {}; Save.addMasteryXp = () => {}; UI.queueHeroUnlock = () => {}; UI.toast = () => {}; Achievements.record = () => {};
Object.keys(FX).forEach(k => { if (typeof FX[k] === 'function') FX[k] = () => {}; });
Object.keys(Sound).forEach(k => { if (typeof Sound[k] === 'function') Sound[k] = () => false; });

console.log('--- 1. Testing Scraps Relentless DPS Stats & Scaling ---');
const scraps = HEROES.Scraps;
assert.equal(scraps.role, 'Damage');
assert.equal(scraps.tier, 'SS');
assert.equal(scraps.base.atk, 485, 'Base Attack should be 485');
assert.equal(scraps.hidden.aspd, 1.25, 'Base ASPD should be 1.25 (relentless cadence)');
assert.equal(scraps.hidden.armorPen, 0.20, 'Base Armor Pen should be 20%');
assert.equal(scraps.hidden.crit, 0.18, 'Base Crit should be 18%');
assert(scraps.skills.G.cd <= 6.5, 'Whatever Works CD should be <= 6.5s');
assert(scraps.skills.B.cd <= 8.5, 'Craft Class Crash CD should be <= 8.5s');

console.log('--- 2. Testing Relentless Battle Mechanics ---');
const spec = id => ({ id, level: 70, rarity: 5, rarityPlus: 1, stars: 3, skillLv: 70 });
const B = new Battle({ offscreen: true });
B.start([spec('Scraps'), spec('Boxten')], [makeTwisted('Shrimpo', 70, 'normal'), makeTwisted('Poppy', 70, 'normal')], { timeLimit: 45 });
const s = B.units[0], a = B.units[1], e1 = B.enemiesOf(s)[0], e2 = B.enemiesOf(s)[1];
assert(s && a && e1 && e2);
e1.st.ccRes = 0; if (e1.baseStats) e1.baseStats.ccRes = 0;
e2.st.ccRes = 0; if (e2.baseStats) e2.baseStats.ccRes = 0;

// Position for testing
s.x = B.leftWall + 50; a.x = B.centerX(); e1.x = a.x + 30; e2.x = a.x + 50;
a.hp = a.max.hp * 0.40;

// Test W Grapple
scraps.skills.W.cast(s, B, B.scaled(s, 'W'), B.skillParams(s, 'W'));
assert(s.invuln > B.t, 'Grapple should grant Invulnerability during travel');
const landingX = s.dashTo;
const finishGrapple = s.dashOpt.onEnd;
s.x = landingX; s.dashTo = null; s.dashOpt = null;
finishGrapple();
assert(e1.hasStatus('frayed'), 'Landing should inflict Frayed');
console.log('PASS: Crafty Grapple invulnerable dash & landing shred');

// Test Basic Attack Relentless Frenzy Stacking on Frayed targets
for (let i = 0; i < 6; i++) {
  scraps.basic.onHit(s, e1, B);
}
assert.equal(s._scrapsFrenzy, 6, 'Should reach max 6 Relentless Frenzy stacks');
assert(s.flat.aspdP >= 0.36, 'Should gain +36% Attack Speed from 6 Frenzy stacks');
console.log('PASS: Relentless Frenzy stacking & double-slash frenzy');

// Test G (Whatever Works) Craft Adrenaline
scraps.skills.G.cast(s, B, B.scaled(s, 'G'), B.skillParams(s, 'G'));
assert.equal(s.scrapsCraft, 'cup', 'Should cycle to cup');
assert(s.hasStatus('speedup'), 'Should gain speedup buff');
console.log('PASS: Whatever Works fast cycle & Craft Adrenaline');

// Test B (Craft Class Crash)
const e2HpBefore = e2.hp;
scraps.skills.B.cast(s, B, B.scaled(s, 'B'), B.skillParams(s, 'B'));
assert(s.hasStatus('ccimmune'), 'Craft Class Crash should grant CC immunity');
B.step(0.40);
assert(e2.hp < e2HpBefore, 'Craft Class Crash should deal multi-wave area damage');
console.log('PASS: Craft Class Crash paper hurricane & CC immunity');

// Test R Paper Shards on enemy defeat
const e2HpAfterB = e2.hp;
B.kill(e2, s);
assert(s.energy >= 25, 'Enemy defeat should refund 25 Energy');
console.log('PASS: Every Piece Counts paper shards cascade & energy refund');

console.log('=== ALL SCRAPS RELENTLESS DPS TESTS PASSED! ===');
`, ctx);
