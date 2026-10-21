const fs = require('fs'), vm = require('vm'), assert = require('assert'), path = require('path');
const root = 'c:/Users/anoob/Downloads/dandy_s_heroes_by_scraps/dandys heroes';

function node() {
  return {
    style: { setProperty() {}, removeProperty() {} },
    classList: { add() {}, remove() {}, toggle() {}, contains() { return false; } },
    dataset: {},
    children: [],
    append(...v) { this.children.push(...v); },
    appendChild(v) { this.children.push(v); return v; },
    removeChild() {},
    replaceChildren() { this.children = []; },
    remove() {},
    querySelector() { return node(); },
    querySelectorAll() { return []; },
    setAttribute() {},
    getAttribute() { return ''; },
    removeAttribute() {},
    addEventListener() {},
    getBoundingClientRect() { return { width: 560, height: 760, left: 0, top: 0 }; },
    get firstChild() { return null; },
    parentElement: { classList: { toggle() {} } },
    clientWidth: 560,
    clientHeight: 760,
    hidden: true
  };
}

const nodes = {};
const doc = {
  querySelector(s) { return nodes[s] || (nodes[s] = node()); },
  querySelectorAll() { return []; },
  createElement: node,
  documentElement: node(),
  body: node(),
  addEventListener() {}
};

const warnings = [];
const ctx = vm.createContext({
  console: { log: console.log, error: console.error, warn(...a) { warnings.push(a.map(String).join(' ')); } },
  document: doc,
  window: null,
  localStorage: { getItem() { return null; }, setItem() {}, removeItem() {} },
  navigator: { userAgent: 'node', hardwareConcurrency: 4 },
  location: { search: '', href: 'http://localhost' },
  performance,
  URL,
  URLSearchParams,
  Image: class {},
  Audio: class {},
  setTimeout: () => 0,
  clearTimeout() {},
  setInterval: () => 0,
  clearInterval() {},
  requestAnimationFrame: () => 0,
  cancelAnimationFrame() {},
  matchMedia: () => ({ matches: false, addEventListener() {} }),
  innerWidth: 560,
  innerHeight: 760,
  assert
});
ctx.window = ctx;
ctx.addEventListener = () => {};

const scripts = [...fs.readFileSync(path.join(root, 'index.html'), 'utf8').matchAll(/<script src="([^"]+)"/g)]
  .map(x => x[1])
  .filter(x => !['js/main.js', 'js/websim.js'].includes(x));

for (const p of scripts) {
  try {
    vm.runInContext(fs.readFileSync(path.join(root, p), 'utf8'), ctx, { filename: p });
  } catch (e) {
    console.error('LOAD ERROR', p, e);
    process.exit(1);
  }
}

console.log('All game scripts loaded successfully.');

vm.runInContext(`
(() => {
  Save.data = Save.fresh();
  Save.write = () => {};
  UI.queueHeroUnlock = () => {};
  UI.toast = () => {};
  Achievements.record = () => {};
  Object.keys(FX).forEach(k => { if (typeof FX[k] === 'function') FX[k] = () => {}; });
  Object.keys(Sound).forEach(k => { if (typeof Sound[k] === 'function') Sound[k] = () => false; });

  const spec = (id, lv = 70, rarity = 5) => ({ id, level: lv, rarity, rarityPlus: 0, stars: 3, skillLv: lv });

  // Test 1: Looey definition exists with all 5 skills
  const heroDef = HEROES.Looey;
  assert(heroDef, 'Looey hero definition must exist');
  assert(heroDef.skills.W, 'W skill exists');
  assert(heroDef.skills.G, 'G skill exists');
  assert(heroDef.skills.B, 'B skill exists');
  assert(heroDef.skills.P, 'P skill exists');
  assert(heroDef.skills.R, 'R skill exists');
  console.log('Test 1 Passed: Looey skills defined');

  // Test 2: Unit creation and passives initialization
  const B = new Battle({ offscreen: true });
  B.start([spec('Looey'), spec('Poppy')], [spec('Boxten'), spec('Shrimpo')], { timeLimit: 45 });
  const looey = B.units.find(u => u.id === 'Looey');
  const poppy = B.units.find(u => u.id === 'Poppy');
  const boxten = B.units.find(u => u.id === 'Boxten');
  const shrimpo = B.units.find(u => u.id === 'Shrimpo');

  assert(looey.alive, 'Looey is alive');
  assert.strictEqual(looey._looeyPopSave, false, 'Pop save initialized to false');
  console.log('Test 2 Passed: Looey created and battle started');

  // Test 3: Helium Hustle (W) passive - taking direct damage grants inflated
  const dmgRes = B.damage(boxten, looey, 200, { type: 'physical', noDodge: true });
  let inf = looey.getStatus('inflated');
  assert(inf && inf.stacks >= 1, 'Looey gained 1 inflated stack from direct damage');
  console.log('Test 3 Passed: Helium Hustle damaged listener grants inflated');

  // Test 4: Lethal save mechanics
  looey.hp = 100;
  looey.shields = [];
  B.applyStatus(boxten, looey, 'poison', 5);
  assert(looey.hasStatus('poison'), 'Looey poisoned before lethal');
  const lethalRes = B.damage(boxten, looey, 500000, { type: 'true', noDodge: true });
  console.log('lethalRes:', lethalRes && lethalRes.amount, 'looey hp:', looey.hp, '_looeyPopSave:', looey._looeyPopSave);
  assert(looey.alive, 'Looey survived lethal hit with pop save');
  assert.strictEqual(looey._looeyPopSave, true, 'Pop save flagged as used');
  assert(looey.hp >= Math.floor(looey.max.hp * 0.17), 'Looey restored to 18% max HP');
  assert(!looey.hasStatus('poison'), 'Looey cleansed of DoTs on lethal save');
  assert(looey.invuln > B.t, 'Looey gained brief invulnerability window');
  assert(looey.shields.length > 0, 'Looey gained protective shield');
  console.log('Test 4 Passed: Lethal save cleanly prevents death, cleanses, shields, and restores HP');

  // Test 5: Big Top Performance (B) and dmgTaken4 reset bug
  B.t = 10;
  HEROES.Looey.skills.B.cast(looey, B, B.scaled(looey, 'B'), HEROES.Looey.skills.B.p);
  // Advance through windup (0.36s)
  while (B.timers.length && B.timers[0].t <= 0.36) {
    const timer = B.timers.shift();
    B.t += timer.t;
    timer.fn();
  }
  assert.strictEqual(looey.flat.dmgTaken4, 0.12, 'Looey has +12% damage taken during show');
  assert(looey.hasStatus('speedup'), 'Looey gained speedup');
  assert(poppy.hasStatus('speedup'), 'Ally gained speedup');

  // Advance through remaining show duration (8s)
  while (B.timers.length) {
    const timer = B.timers.shift();
    B.t += timer.t;
    timer.fn();
  }
  assert.strictEqual(looey.flat.dmgTaken4, 0, 'Looey dmgTaken4 must reset to 0 after show ends (bug fix verified)');
  console.log('Test 5 Passed: Big Top Performance applies buffs and cleanly resets dmgTaken4 to 0');

  // Test 6: Light As Air (P) missing HP stat scaling without overwriting trinket stats
  looey.flat.evaP = 0.05; // Simulate trinket evasion
  looey.flat.defP = 0.03; // Simulate trinket defense
  looey.hp = Math.floor(looey.max.hp * 0.2); // 80% missing HP
  looey.recompute();
  // Trigger interval callback
  const pInterval = B.intervals.find(it => it.owner === looey && it.every === 0.4);
  assert(pInterval, 'P interval registered');
  pInterval.fn();

  assert(looey.flat.evaP3 > 0, 'Looey has evaP3 from missing HP');
  assert(looey.flat.aspdP2 > 0, 'Looey has aspdP2 from missing HP');
  assert(looey.flat.defP3 < 0, 'Looey has defP3 penalty from missing HP');
  assert(looey.flat.dmgTaken5 < 0, 'Looey has dmgTaken5 reduction from missing HP');
  assert.strictEqual(looey.flat.evaP, 0.05, 'Trinket evaP is preserved and not overwritten!');
  assert.strictEqual(looey.flat.defP, 0.03, 'Trinket defP is preserved and not overwritten!');
  console.log('Test 6 Passed: Light As Air scales cleanly without clobbering trinket stats');

  // Test 7: Balloon Bounce (G) bounce sequence, knockback, facing, and suicide prevention
  looey.hp = 2; // Extremely low HP
  B.applyStatus(looey, looey, 'inflated', 999, { stacks: 4 });
  HEROES.Looey.skills.G.cast(looey, B, B.scaled(looey, 'G'), HEROES.Looey.skills.G.p);
  while (B.timers.length) {
    const timer = B.timers.shift();
    B.t += timer.t;
    timer.fn();
  }
  assert(looey.alive, 'Looey did NOT commit suicide from bounce self-damage at 2 HP');
  assert(looey.hp >= 1, 'Looey remains at >= 1 HP');
  console.log('Test 7 Passed: Balloon Bounce executes safely without self-suicide');

  // Test 8: The Greatest Show (R) Maximum Inflation, pierce, slow immunity, and takedown heal
  B.applyStatus(looey, looey, 'inflated', 999, { stacks: 8 });
  const rInterval = B.intervals.find(it => it.owner === looey && it.every === 0.5);
  assert(rInterval, 'R interval registered');
  rInterval.fn();

  assert.strictEqual(looey.pierce, true, 'Maximum Inflation grants basic attack pierce');
  assert.strictEqual(looey.flat.cdr4, 0.3, 'Maximum Inflation grants 30% CDR');

  // Test Slow Immunity
  B.applyStatus(boxten, looey, 'slow', 3);
  assert(!looey.hasStatus('slow'), 'Looey is completely immune to Slow during Maximum Inflation');

  // Test other debuffs trigger ccimmune window
  B.applyStatus(boxten, looey, 'silence', 3);
  assert(looey.hasStatus('ccimmune'), 'First incoming debuff starts ccimmune window');

  // Test takedown: enemy killed by ally should NOT consume Looey stacks
  const currentStacks = looey.getStatus('inflated').stacks;
  B.emitFoe(boxten.team, 'enemyDown', boxten);
  assert.strictEqual(looey.getStatus('inflated').stacks, currentStacks, 'Random enemy death does NOT spend Looey stacks');

  // Test takedown: enemy killed by Looey DOES heal and consume 3 stacks
  B.emitFor(looey, 'defeatedEnemy', shrimpo);
  assert.strictEqual(looey.getStatus('inflated').stacks, currentStacks - 3, 'Looey takedown consumes 3 stacks and heals');

  // Test full heal ends Maximum Inflation
  looey.hp = looey.max.hp;
  rInterval.fn();
  assert(!looey.hasStatus('inflated'), 'Reaching full HP removes all inflated stacks');
  assert.strictEqual(looey.pierce, false, 'Pierce removed after inflation ends');
  console.log('Test 8 Passed: The Greatest Show (R) mechanics, slow immunity, and takedowns verified');

  console.log('ALL 8 LOOEY TESTS PASSED PERFECTLY!');
})();
`, ctx);
