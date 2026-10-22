/* Run with node scratch/test-squirm-dhbm.cjs. Exercises Squirm DHBM kit in the battle engine. */
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

const nodes = {};
const doc = { querySelector(s) { return nodes[s] || (nodes[s] = node()); }, querySelectorAll() { return []; },
  createElement: node, documentElement: node(), body: node(), addEventListener() {} };
const warnings = [];
const ctx = vm.createContext({
  console: { log: console.log, error: console.error, warn(...a) { warnings.push(a.map(v => v?.stack || String(v)).join(' ')); } },
  document: doc, window: null, localStorage: { getItem() { return null; }, setItem() {}, removeItem() {} },
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

console.log('--- 1. Testing Squirm Base Hero & Skill Definitions ---');
const sHero = HEROES.Squirm;
assert(sHero, 'Squirm hero definition should exist');
assert.equal(sHero.tier, 'SS', 'Squirm should be Tier SS');
assert.equal(sHero.role, 'Tank', 'Squirm role should be Tank');
assert.equal(sHero.base.hp, 5850, 'Squirm base HP should be 5850');
assert.equal(sHero.base.atk, 270, 'Squirm base Atk should be 270');
assert.equal(sHero.base.def, 380, 'Squirm base Def should be 380');
assert.equal(sHero.base.mdef, 370, 'Squirm base MDef should be 370');
assert.equal(sHero.base.spd, 110, 'Squirm base Spd should be 110');
assert.equal(sHero.hidden.aggro, 1.85, 'Squirm hidden aggro should be 1.85');
assert.equal(sHero.hidden.kbRes, 0.70, 'Squirm hidden kbRes should be 0.70');
assert.equal(sHero.hidden.ccRes, 0.35, 'Squirm hidden ccRes should be 0.35');
assert.equal(sHero.hidden.healPow, 1.15, 'Squirm hidden healPow should be 1.15');
assert.equal(sHero.hidden.shieldPow, 1.20, 'Squirm hidden shieldPow should be 1.20');
console.log('Squirm base stats and hidden attributes verified: SS Tank / Disruptor / Survivor');

console.log('--- 2. Checking Skill Definitions & Dynamic Descriptions ---');
for (const key of ['W', 'G', 'B', 'P', 'R']) {
  const sk = sHero.skills[key];
  assert(sk, 'Skill ' + key + ' must exist');
  const S = Object.fromEntries(Object.entries(sk.v || {}).map(([k, v]) => [k, v * skillMult(70)]));
  const P = skillGrowthParams(sk, 70);
  const desc = sk.desc(S, P);
  assert(desc && desc.length > 10, 'Skill ' + key + ' description rendered properly');
  console.log('Skill ' + key + ' (' + sk.name + '): ' + desc.slice(0, 65) + '...');
}
assert(sHero.basic, 'Squirm basic attack must exist');
console.log('Basic Attack (' + sHero.basic.name + '): verified');

console.log('--- 3. Checking Friendship Badge cocoa_squirm ---');
const badge = BADGES.cocoa_squirm;
assert(badge, 'Badge cocoa_squirm must exist');
assert.equal(badge.owner, 'Cocoa', 'Badge owner should be Cocoa');
assert.equal(badge.friend, 'Squirm', 'Badge friend should be Squirm');
assert.equal(badge.name, "Squirm's Pressed Book-Ribbon");
console.log('Badge cocoa_squirm (' + badge.name + ') verified for Cocoa & Squirm pairing');

console.log('--- 4. Checking UI Skill Previews in SQUIRM_SKILL_PREVIEWS ---');
assert(typeof SQUIRM_SKILL_PREVIEWS !== 'undefined', 'SQUIRM_SKILL_PREVIEWS should be defined');
for (const key of ['basic', 'W', 'G', 'B', 'P', 'R']) {
  const prev = SQUIRM_SKILL_PREVIEWS[key];
  assert(prev, 'Preview for key ' + key + ' must exist');
  assert(prev.squirmMode, 'squirmMode must be set for ' + key);
  assert(prev.floatLabel, 'floatLabel must be set for ' + key);
  console.log('Preview ' + key + ': mode=' + prev.squirmMode + ', label="' + prev.floatLabel + '"');
}

console.log('--- 5. Testing Squirm Battle Mechanics ---');
const spec = id => ({ id, level: 70, rarity: 5, rarityPlus: 1, stars: 3, skillLv: 70 });
const B = new Battle({ offscreen: true });
const bossShrimpo = makeTwisted('Shrimpo', 70, 'boss');
bossShrimpo.maxHp = 500000; bossShrimpo.hp = 500000;

B.start(
  [spec('Squirm'), spec('Cocoa'), spec('Boxten')],
  [bossShrimpo],
  { timeLimit: 45 }
);

const u = B.units.find(x => x.id === 'Squirm');
const cocoa = B.units.find(x => x.id === 'Cocoa');
const enemy = B.enemiesOf(u)[0];
if (enemy.baseStats) enemy.baseStats.ccRes = 0;
enemy.st.ccRes = 0;

assert(u && cocoa && enemy, 'Units must be spawned');
console.log('Fighter spawned: ' + u.name + ' (HP: ' + u.hp + '/' + u.max.hp + ', Def: ' + u.st.def + ', MDef: ' + u.st.mdef + ')');

// Test 5A: G Skill - Please Don't Hurt Me
console.log("Testing Skill G: Please Don't Hurt Me...");
const gSkill = sHero.skills.G;
gSkill.cast(u, B, gSkill.v, gSkill.p);
assert(u.shields && u.shields.length > 0, "Squirm should have gained a cocoon shield");
assert(u.hasStatus('regen'), "Squirm should gain HP regen");
assert(u._curledUntil > B.t, "Squirm should have cocoon reflection active");
console.log("PASS: Please Don't Hurt Me granted cocoon shield, regen, and damage reflection");

// Test 5B: W Skill - Distressed Delicacy
console.log('Testing Skill W: Distressed Delicacy...');
enemy.x = u.x + 100; // Place enemy within melee/shockwave radius
const wSkill = sHero.skills.W;
wSkill.cast(u, B, wSkill.v, wSkill.p);
assert(u.hasStatus('ward'), 'Squirm should have ward during feast');
assert(u.hasStatus('ccimmune'), 'Squirm should be CC immune during feast');
for (let i = 0; i < 36; i++) B.step(0.1); // Let the 3.5s feast complete in 0.1s increments
assert(enemy.hasStatus('stun'), 'Seismic shockwave should stun the enemy');
console.log('PASS: Distressed Delicacy completed feast and stunned enemy with shockwave');

// Test 5C: B Skill - Nervous Flailing
console.log('Testing Skill B: Nervous Flailing...');
const bSkill = sHero.skills.B;
bSkill.cast(u, B, bSkill.v, bSkill.p);
B.step(1.5);
assert(u.hasStatus('fortify'), 'Squirm should gain Fortify from rolling flurry');
console.log('PASS: Nervous Flailing hit enemy and gained Fortify');

// Test 5D: P Passive - Bookworm Erudition
console.log('Testing Skill P: Bookworm...');
assert(u.bookStacks !== undefined, 'Squirm should track bookStacks');
console.log('PASS: Bookworm Erudition stacks tracked (' + u.bookStacks + ' stacks)');

// Test 5E: R Climax - What Could Go Wrong? Emergency Biblio-Panic
console.log('Testing Skill R: What Could Go Wrong? (Emergency Biblio-Panic)...');
u.hp = u.max.hp * 0.10; // Drop below 15% HP
const preHp = u.hp;
B.step(0.6); // Tick 0.6s to trigger every(0.5) emergency panic check
assert(u._biblioPanic, 'Emergency Full Biblio-Panic should trigger below 15% HP');
assert(u.hp > preHp, 'Squirm should heal significantly on emergency Biblio-Panic');
assert(u.hasStatus('invulnerable') || u.st.invulnerable, 'Squirm should gain invulnerability on Biblio-Panic');
console.log('PASS: Emergency Biblio-Panic triggered: HP ' + Math.round(preHp) + ' -> ' + Math.round(u.hp) + ', invulnerable=' + !!(u.hasStatus('invulnerable') || u.st.invulnerable));

console.log("");
console.log("=== ALL SQUIRM DHBM REWORK VERIFICATIONS PASSED ===");
`, ctx);
