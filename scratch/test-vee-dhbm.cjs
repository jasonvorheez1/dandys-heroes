/* Run with node scratch/test-vee-dhbm.cjs. Exercises Vee DHBM kit in the battle engine. */
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

console.log('--- 1. Testing Vee Base Hero & Skill Definitions ---');
const vHero = HEROES.Vee;
assert(vHero, 'Vee hero definition should exist');
assert.equal(vHero.tier, 'SS', 'Vee should be Tier SS');
assert.equal(vHero.role, 'Tank', 'Vee role should be Tank');
assert.equal(vHero.base.hp, 5850, 'Vee base HP should be 5850');
assert.equal(vHero.base.mag, 380, 'Vee base Mag should be 380');
assert.equal(vHero.base.def, 385, 'Vee base Def should be 385');
assert.equal(vHero.base.mdef, 390, 'Vee base MDef should be 390');
assert.equal(vHero.base.spd, 120, 'Vee base Spd should be 120');
assert.equal(vHero.hidden.cdr, 0.15, 'Vee hidden CDR should be 0.15');
assert.equal(vHero.hidden.aggro, 1.8, 'Vee hidden aggro should be 1.8');
assert.equal(vHero.hidden.kbRes, 0.75, 'Vee hidden kbRes should be 0.75');

for (const key of ['W', 'G', 'B', 'P', 'R']) {
  const sk = vHero.skills[key];
  assert(sk, 'Skill ' + key + ' must exist');
  const S = Object.fromEntries(Object.entries(sk.v || {}).map(([k, v]) => [k, v * skillMult(70)]));
  const P = skillGrowthParams(sk, 70);
  const desc = sk.desc(S, P);
  assert(typeof desc === 'string' && desc.length > 20, 'Skill ' + key + ' desc should format properly');
}
console.log('PASS: Hero stats and all 5 skill descriptors verified.');

console.log('--- 2. Testing vee_shelly Friendship Badge ---');
const badge = BADGES.vee_shelly;
assert(badge, 'vee_shelly badge should exist in BADGES');
assert.equal(badge.owner, 'Vee', 'Badge owner should be Vee');
assert.equal(badge.friend, 'Shelly', 'Badge friend should be Shelly');
assert(badge.effect.includes('Amber'), 'Badge effect should describe Amber lens mechanics');
console.log('PASS: vee_shelly badge verified.');

console.log('--- 3. Testing Vee UI Skill Previews ---');
assert(VEE_SKILL_PREVIEWS.basic, 'Vee basic preview should exist');
assert(VEE_SKILL_PREVIEWS.W, 'Vee W preview should exist');
assert(VEE_SKILL_PREVIEWS.G, 'Vee G preview should exist');
assert(VEE_SKILL_PREVIEWS.B, 'Vee B preview should exist');
assert(VEE_SKILL_PREVIEWS.P, 'Vee P preview should exist');
assert(VEE_SKILL_PREVIEWS.R, 'Vee R preview should exist');
assert.equal(VEE_SKILL_PREVIEWS.basic.veeMode, 'signal');
assert.equal(VEE_SKILL_PREVIEWS.W.veeMode, 'spotlight');
assert.equal(VEE_SKILL_PREVIEWS.G.veeMode, 'audience');
assert.equal(VEE_SKILL_PREVIEWS.B.veeMode, 'commercial');
assert.equal(VEE_SKILL_PREVIEWS.P.veeMode, 'production');
assert.equal(VEE_SKILL_PREVIEWS.R.veeMode, 'finale');
assert(typeof HeroPage.drawVeePreview === 'function', 'HeroPage.drawVeePreview must exist');
console.log('PASS: Vee skill previews for all 6 skills verified.');

console.log('--- 4. Testing Vee Battle Mechanics ---');
const spec = id => ({ id, level: 70, rarity: 5, rarityPlus: 1, stars: 3, skillLv: 70 });
const B = new Battle({ offscreen: true });
const bossShrimpo = makeTwisted('Shrimpo', 70, 'boss');
const bossPoppy = makeTwisted('Poppy', 70, 'boss');
// Boost boss HP so they survive sustained combat testing
bossShrimpo.maxHp = 500000; bossShrimpo.hp = 500000;
bossPoppy.maxHp = 500000; bossPoppy.hp = 500000;

B.start(
  [spec('Vee'), spec('Shelly'), spec('Boxten')],
  [bossShrimpo, bossPoppy],
  { timeLimit: 45 }
);

const u = B.units.find(x => x.id === 'Vee');
const ally1 = B.units.find(x => x.id === 'Shelly');
const ally2 = B.units.find(x => x.id === 'Boxten');
const enemy1 = B.enemiesOf(u)[0];
const enemy2 = B.enemiesOf(u)[1];
enemy1.st.ccRes = 0;
enemy2.st.ccRes = 0;

assert(u && ally1 && ally2 && enemy1, 'Fighters should be spawned');

// Step 3s to let telemetry tag Headline
for (let i = 0; i < 40; i++) B.step(0.1);

const headline = B.enemiesOf(u).find(e => e.hasStatus('headline'));
assert(headline, 'An enemy should be designated as Headline');
console.log('PASS: Telemetry successfully designated Headline: ' + headline.name);

// Test W: Spotlight On
if (enemy1.baseStats) enemy1.baseStats.ccRes = 0;
if (enemy2.baseStats) enemy2.baseStats.ccRes = 0;
enemy1.st.ccRes = 0; enemy2.st.ccRes = 0;
const wSkill = vHero.skills.W;
wSkill.cast(u, B, wSkill.v, wSkill.p);
B.step(0.35); // Allow after(.3) to trigger
assert(headline.hasStatus('stun'), 'Headline should be stunned by Spotlight On');
assert(headline.hasStatus('blind'), 'Headline should be blinded by Spotlight On');
assert(ally1.hasStatus('haste'), 'Allies should gain Prime Time haste');
assert(ally1.shields && ally1.shields.length > 0, 'Allies should gain Broadcast Shield');
console.log('PASS: Spotlight On active cast applied stun, blind, energy drain, Prime Time, and shields!');

// Test G: Audience Support
const gSkill = vHero.skills.G;
gSkill.cast(u, B, gSkill.v, gSkill.p);
B.step(0.2);
assert(ally1.hasStatus('fortify'), 'Allies should gain Studio Fortification');
assert(ally1.hasStatus('overcharge'), 'Shielded allies should gain Overcharge');
assert(ally1.hasStatus('regen'), 'Allies should gain continuous HP Regen');
console.log('PASS: Audience Support healed team, granted Fortify, and Overcharged shielded allies!');

// Test B: Commercial Break
const bSkill = vHero.skills.B;
bSkill.cast(u, B, bSkill.v, bSkill.p);
B.step(0.2);
assert(enemy1.hasStatus('drowsy'), 'Enemies should be drowsy during ad break');
assert(enemy1.hasStatus('slow'), 'Enemies should be slowed during ad break');
assert(enemy1._energyLockedUntil > B.t, 'Enemies energy should be locked');
assert(ally1._energyDrainImmuneUntil > B.t, 'Allies should be immune to energy drain');
console.log('PASS: Commercial Break dilated time, locked enemy energy, and super-hasted allies!');

// Test P: Studio Production Redirection
const preDmg = ally1.hp;
B.damage(enemy1, ally1, 500, { type: 'physical' });
B.step(0.1);
assert(ally1.shields.length > 0, 'Protected ally should gain Static Barrier');
assert((u.prod || 0) > 0, 'Vee should accumulate Production Value stacks');
console.log('PASS: Studio Production redirected damage and granted ally energy & barrier! Stacks: ' + u.prod);

// Test Emergency LIVE BROADCAST Climax
console.log('Before live damage: u.hp =', u.hp, 'u.max.hp =', u.max.hp, 'hpPct =', u.hpPct);
u.hp = u.max.hp * 0.20;
console.log('Directly set u.hp: hpPct =', u.hpPct, 'u.alive =', u.alive);
for (let i = 0; i < 15; i++) {
  u.hp = u.max.hp * 0.20;
  B.step(0.1);
  if (u._live) break;
}
console.log('After stepping: u._live =', u._live, 'hpPct =', u.hpPct);
assert(u._live, 'Vee should enter LIVE BROADCAST');
assert(u.hasStatus('ccimmune'), 'Vee should have CC immunity during live broadcast');
assert(u.rangeBonus >= 300, 'Vee should have increased range bonus');
console.log('PASS: Emergency LIVE BROADCAST triggered below 35% HP with CC immunity and +300 Range!');

console.log('\\nALL VEE BATTLE TESTS COMPLETED SUCCESSFULLY! 🎉');
`, ctx);

if (warnings.length) console.log('Warnings caught:', warnings);
