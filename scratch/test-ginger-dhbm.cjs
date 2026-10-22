/* Run with node scratch/test-ginger-dhbm.cjs. Exercises Ginger DHBM kit in the battle engine. */
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

console.log('--- 1. Testing Ginger Base Hero & Skill Definitions ---');
const gHero = HEROES.Ginger;
assert(gHero, 'Ginger hero definition should exist');
assert.equal(gHero.tier, 'SS', 'Ginger should be Tier SS');
assert.equal(gHero.role, 'Support', 'Ginger role should be Support');
assert.equal(gHero.base.hp, 4950, 'Ginger base HP should be 4950');
assert.equal(gHero.base.mag, 420, 'Ginger base Mag should be 420');
assert.equal(gHero.hidden.healPow, 1.65, 'Ginger hidden healPow should be 1.65');
assert.equal(gHero.hidden.shieldPow, 1.55, 'Ginger hidden shieldPow should be 1.55');

for (const key of ['W', 'G', 'B', 'P', 'R']) {
  const sk = gHero.skills[key];
  assert(sk, 'Skill ' + key + ' must exist');
  const S = Object.fromEntries(Object.entries(sk.v || {}).map(([k, v]) => [k, v * skillMult(70)]));
  const P = skillGrowthParams(sk, 70);
  const desc = sk.desc(S, P);
  assert(typeof desc === 'string' && desc.length > 20, 'Skill ' + key + ' desc should format properly');
}
console.log('PASS: Hero stats and all 5 skill descriptors verified.');

console.log('--- 2. Testing UI Preview Setup ---');
assert(GINGER_SKILL_PREVIEWS, 'GINGER_SKILL_PREVIEWS must exist');
for (const k of ['basic', 'W', 'G', 'B', 'P', 'R']) {
  assert(GINGER_SKILL_PREVIEWS[k], 'GINGER_SKILL_PREVIEWS[' + k + '] must exist');
  assert(GINGER_SKILL_PREVIEWS[k].gingerMode, 'gingerMode must be specified for ' + k);
}
assert(typeof HeroPage.drawGingerPreview === 'function', 'HeroPage.drawGingerPreview must be implemented');
console.log('PASS: UI Skill Previews configuration & draw method verified.');

console.log('--- 3. Testing Ginger Battle Mechanics ---');
const spec = id => ({ id, level: 70, rarity: 5, rarityPlus: 1, stars: 3, skillLv: 70 });
const B = new Battle({ offscreen: true });
B.start(
  [spec('Ginger'), spec('Bobette'), spec('Boxten')],
  [makeTwisted('Shrimpo', 70, 'normal'), makeTwisted('Poppy', 70, 'normal')],
  { timeLimit: 45 }
);

const u = B.units.find(x => x.id === 'Ginger');
const ally1 = B.units.find(x => x.id === 'Bobette');
const ally2 = B.units.find(x => x.id === 'Boxten');
const enemy = B.enemiesOf(u)[0];

assert(u && ally1 && ally2 && enemy, 'Fighters should be spawned');

// Step 0.3s to allow Battle Opener (R) to trigger
B.step(0.35);
assert((ally1.flat.hpP2 || 0) > 0, 'Opener should grant ally Max HP boost');
assert((ally1.flat.healRecP || 0) >= 0.25, 'Opener should grant ally +25% Healing Received');
assert(ally1.hasStatus('rally'), 'Opener should apply Rally status');
console.log('PASS: Opener (R: A Recipe For Everyone) applied grand holiday banquet!');

// Test Emergency Last Bite (Rescue)
B.damage(enemy, ally2, ally2.max.hp * 0.70, { type: 'true', noDodge: true, bypassShield: true });
B.step(0.1);
assert(ally2.hasStatus('untargetable'), 'Last bite should grant untargetable');
assert(ally2.hasStatus('determined'), 'Last bite should grant ally determined');
assert(u.hasStatus('determined'), 'Last bite should grant ginger determined');
assert(u.energy >= u.energyMax - 1, 'Last bite should refund Ginger full energy');
console.log('PASS: Emergency Last Bite successfully rescued critical ally & triggered Determined!');

// Test Blue Skill: Peppermint Swirl
u.energy = 50;
gHero.skills.B.cast(u, B, gHero.skills.B.v, gHero.skills.B.p);
B.step(0.2);
B.step(0.4);
assert(ally1.hasStatus('tenacity'), 'Peppermint Swirl should apply Tenacity');
console.log('PASS: Peppermint Swirl applied and hearth active!');

// Test Green Skill: Decorated Treats
gHero.skills.G.cast(u, B, gHero.skills.G.v, gHero.skills.G.p);
B.step(0.1);
assert(ally1.hasStatus('sweetsupport'), 'Decorated Treats should apply Sweet Support');
assert(ally1.hasStatus('freshlybaked'), 'Decorated Treats should apply Freshly Baked');
assert(ally1.shields.length > 0 || ally2.shields.length > 0, 'Lowest HP allies should have Royal Icing Shield');
console.log('PASS: Decorated Treats applied Sweet Support & Royal Icing Shield!');

// Test Passive Stacking (Perfect Decoration)
assert(u.deco > 0, 'Ginger should have Perfect Decoration stacks from casting skills and shielding');
assert(u.flat.healPowP > 0, 'Ginger should have gained Healing Power from Perfect Decoration');
assert(u.flat.shieldPowP > 0, 'Ginger should have gained Shield Power from Perfect Decoration');
console.log('PASS: Little Improvements (P) stacked Perfect Decoration (' + u.deco + ' stacks)!');

// Stack up to 8 for Masterwork
while ((u.deco || 0) < 8) {
  B.t += 0.1;
  gingerDecoration(u, B, gHero.skills.P.v, gHero.skills.P.p, ally1);
}
assert.equal(u.deco, 8, 'Ginger should have reached max 8 stacks');
assert(u._gingerAtMaxDeco, '_gingerAtMaxDeco flag should be set');
console.log('PASS: Perfect Decoration reached max 8 stacks and triggered Masterwork ready!');

// Test Ultimate (W): Baked With Care!
u.energy = 100;
gHero.skills.W.cast(u, B, gHero.skills.W.v, gHero.skills.W.p);
B.step(0.35);
assert(ally1.shields.length > 0, 'Baked With Care should grant Royal Icing Barrier');
assert(enemy.hasStatus('blind'), 'Masterwork Baked With Care should blind enemy foes');
console.log('PASS: Ultimate (Baked With Care!) triggered with Masterwork sugar burst!');

console.log('--- 4. Testing Friendship Badge: ginger_bobette ---');
const badge = BADGES.ginger_bobette;
assert(badge, 'ginger_bobette badge should exist in BADGES');
assert.equal(badge.owner, 'Ginger');
assert.equal(badge.friend, 'Bobette');
badge.apply(u, B, 1);
assert(u.flat.shieldPowP > 0, 'Badge should grant Shield Power');
assert(u.flat.cdrP > 0, 'Badge should grant CDR');
console.log('PASS: Bobette Festive Music Box badge applied correctly!');

console.log('=== ALL GINGER DHBM TESTS PASSED! ===');
`, ctx);
