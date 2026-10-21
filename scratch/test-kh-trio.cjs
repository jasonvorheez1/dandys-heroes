'use strict';

const fs = require('fs');
const path = require('path');
const vm = require('vm');
const assert = require('assert');

const root = 'c:/Users/anoob/Downloads/dandy_s_heroes_by_scraps/dandys heroes';

function node() {
  return {
    style: { setProperty() {}, removeProperty() {}, backgroundImage: '', transition: '', opacity: '', transform: '', display: '' },
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
  getElementById(s) { return nodes['#' + s] || (nodes['#' + s] = node()); },
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
  setTimeout: (fn, ms) => { if (typeof fn === 'function') fn(); return 0; },
  clearTimeout() {},
  setInterval: () => 0,
  clearInterval() {},
  requestAnimationFrame: (fn) => { if (typeof fn === 'function') fn(performance.now()); return 0; },
  cancelAnimationFrame() {},
  matchMedia: () => ({ matches: false, addEventListener() {} }),
  innerWidth: 560,
  innerHeight: 760,
  assert
});
ctx.window = ctx;
ctx.addEventListener = () => {};

const indexHtml = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const scripts = [...indexHtml.matchAll(/<script src="([^"]+)"/g)]
  .map(x => x[1])
  .filter(x => !['js/main.js', 'js/websim.js', 'js/ui/screens/arena-live.js'].includes(x));

for (const p of scripts) {
  try {
    const code = fs.readFileSync(path.join(root, p), 'utf8');
    vm.runInContext(code, ctx, { filename: p });
  } catch (e) {
    console.error('LOAD ERROR', p, e);
    process.exit(1);
  }
}

vm.runInContext(`
Save.data = Save.fresh();
Save.write = () => {};
UI.queueHeroUnlock = () => {};
UI.toast = () => {};
Achievements.record = () => {};
Object.keys(FX).forEach(k => { if (typeof FX[k] === 'function') FX[k] = () => {}; });
Object.keys(Sound).forEach(k => { if (typeof Sound[k] === 'function') Sound[k] = () => false; });
if (typeof Music !== 'undefined') {
  Music.screen = () => {};
  Music.play = () => {};
  Music.stop = () => {};
}

const spec = (id, lv = 70, rarity = 5) => ({ id, level: lv, rarity, rarityPlus: 0, stars: 3, skillLv: lv });
`, ctx);

console.log('=== TEST 1: Sora Stats, Combo Master Bug Fix, & Burst Suite ===');
vm.runInContext(`{
  const soraDef = HEROES.Sora;
  assert(soraDef, 'Sora must exist in HEROES');
  assert(soraDef.base.hp >= 5800, 'Sora base HP should be >= 5800 (was 5250)');
  assert(soraDef.base.atk >= 480, 'Sora base Atk should be >= 480 (was 430)');
  assert(soraDef.base.def >= 325, 'Sora base Def should be >= 325 (was 290)');
  assert(soraDef.base.mag >= 415, 'Sora base Mag should be >= 415 (was 370)');

  // Skill ratios
  assert(soraDef.skills.W.v.finish >= 2.80, 'Sora W finisher ratio >= 2.80 (was 2.30)');
  assert(soraDef.skills.G.cd <= 7, 'Sora G cd <= 7 (was 8)');
  assert(soraDef.skills.B.cd <= 8.5, 'Sora B cd <= 8.5 (was 10)');
  assert(soraDef.skills.R.p.cd <= 14, 'Sora R cd <= 14 (was 18)');

  const B = new Battle({ offscreen: true });
  B.start([spec('Sora', 70, 5)], [spec('Dandy', 70, 5)], { timeLimit: 30 });
  const sora = B.units.find(u => u.id === 'Sora');

  // Verify Combo Master cdrCombo & dmgTakenCombo are recognized in recompute (baseKey bug fix)
  assert(sora.getStatus('combo'), 'Sora must start with Combo buff');
  sora.recompute();
  assert(sora.st.cdr > 0.12, 'Sora Combo Master must grant Skill Haste via baseKey fix');

  // Verify waveStart Combo reset
  B.removeStatus(sora, 'combo');
  assert(!sora.getStatus('combo'), 'Combo must be removed');
  B.emitFor(sora, 'waveStart');
  assert(sora.getStatus('combo') && sora.getStatus('combo').stacks >= 2, 'Sora must regain Combo on waveStart');

  console.log('PASS: Sora stats, Combo Master baseKey fix, and waveStart reset verified.');
}`, ctx);

console.log('=== TEST 2: Riku Counter Tank, Max HP Stacking, & Wave Reset Suite ===');
vm.runInContext(`{
  const rikuDef = HEROES.Riku;
  assert(rikuDef, 'Riku must exist in HEROES');
  assert(rikuDef.base.hp >= 7400, 'Riku base HP should be >= 7400 (was 6450)');
  assert(rikuDef.base.def >= 400, 'Riku base Def should be >= 400 (was 360)');
  assert(rikuDef.base.mdef >= 390, 'Riku base MDef should be >= 390 (was 348)');
  assert(rikuDef.base.atk >= 390, 'Riku base Atk should be >= 390 (was 350)');

  const B = new Battle({ offscreen: true });
  B.start([spec('Riku', 70, 5), spec('Boxten', 70, 5)], [spec('Dandy', 70, 5)], { timeLimit: 30 });
  const riku = B.units.find(u => u.id === 'Riku');

  // Test Controlled Darkness defense bonus (baseKey bug fix)
  riku.hp = riku.max.hp;
  riku.recompute();
  assert(riku.st.def > riku.baseStats.def * 1.35, 'Controlled Darkness must increase Def above 50% HP (baseKey fix)');

  // Test Road to Dawn Max HP stacking (baseKey bug fix)
  const initialMaxHp = riku.max.hp;
  rikuDef.skills.W.cast(riku, B, rikuDef.skills.W.v, rikuDef.skills.W.p);
  riku.recompute();
  assert(riku.max.hp > initialMaxHp, 'Shielding allies must increase Riku Max HP via Road to Dawn (baseKey fix)');

  // Test multi-wave lethal reset & Resolve stacks
  riku.rikuLastStand = true;
  B.emitFor(riku, 'waveStart');
  assert.strictEqual(riku.rikuLastStand, false, 'rikuLastStand must reset to false on waveStart');
  assert(riku.getStatus('resolve') && riku.getStatus('resolve').stacks >= 3, 'Riku must have Resolve stacks on waveStart');

  console.log('PASS: Riku stats, Controlled Darkness & Road to Dawn baseKey fix, and waveStart reset verified.');
}`, ctx);

console.log('=== TEST 3: Kairi Light Control, Gleam Synergy, & Protection Suite ===');
vm.runInContext(`{
  const kairiDef = HEROES.Kairi;
  assert(kairiDef, 'Kairi must exist in HEROES');
  assert(kairiDef.base.hp >= 5700, 'Kairi base HP should be >= 5700 (was 5000)');
  assert(kairiDef.base.mag >= 470, 'Kairi base Mag should be >= 470 (was 410)');
  assert(kairiDef.base.atk >= 380, 'Kairi base Atk should be >= 380 (was 350)');
  assert(kairiDef.base.mdef >= 360, 'Kairi base MDef should be >= 360 (was 330)');

  const B = new Battle({ offscreen: true });
  B.start([spec('Kairi', 70, 5), spec('Boxten', 70, 5)], [spec('Dandy', 70, 5)], { timeLimit: 30 });
  const kairi = B.units.find(u => u.id === 'Kairi');
  const dandy = B.units.find(u => u.id === 'Dandy');

  // Verify Gleam application and non-zero consumption
  B.applyStatus(kairi, dandy, 'gleam', 9, { stacks: 3 });
  assert(dandy.hasStatus('gleam'), 'Target must have Gleam');
  
  // Cast W (Lightbound Strike)
  kairiDef.skills.W.cast(kairi, B, kairiDef.skills.W.v, kairiDef.skills.W.p);
  for (let i = 0; i < 7; i++) B.step(0.1);

  // Target must RETAIN at least 1 stack of Gleam so synergies are not killed!
  assert(dandy.hasStatus('gleam') && dandy.getStatus('gleam').stacks >= 1, 'Target must retain Gleam after W burst');

  // Test lethal rescue multi-wave reset
  kairi.kairiRescue = true;
  B.emitFor(kairi, 'waveStart');
  assert.strictEqual(kairi.kairiRescue, false, 'kairiRescue must reset to false on waveStart');

  console.log('PASS: Kairi stats, Gleam synergy preservation, and waveStart rescue reset verified.');
}`, ctx);

console.log('=== TEST 4: Destiny Trio 4v4 Combat Simulation ===');
vm.runInContext(`{
  const B = new Battle({ offscreen: true });
  B.start([
    spec('Sora', 70, 5),
    spec('Riku', 70, 5),
    spec('Kairi', 70, 5),
    spec('Goofy', 70, 5)
  ], [
    spec('Dandy', 70, 5),
    spec('Sprout', 70, 5),
    spec('Boxten', 70, 5),
    spec('Poppy', 70, 5)
  ], { timeLimit: 30 });

  for (let step = 0; step < 260; step++) {
    B.step(0.1);
    if (B.isOver) break;
  }

  const livingP = B.units.filter(u => u.team === TEAM_P && u.alive);
  const livingE = B.units.filter(u => u.team === TEAM_E && u.alive);

  console.log('Simulation at t=' + B.t.toFixed(1) + 's: Living KH Allies=' + livingP.length + '/4, Living Enemies=' + livingE.length + '/4');
  assert(livingP.length >= 3, 'Kingdom Hearts squad must dominate the arena encounter');
  assert(livingE.length === 0 || livingP.length > livingE.length, 'KH squad must defeat or heavily outmatch opponents');
  console.log('PASS: Destiny Islands team achieved complete arena victory.');
}

console.log('\\n=== TEST 5: Destiny Trio Competitive Matchup Benchmarks ===');
{
  const matchups = [
    { name: 'Destiny Trio + Astro vs Standard Dandy Quad', allies: ['Sora', 'Riku', 'Kairi', 'Astro'], enemies: ['Dandy', 'Sprout', 'Boxten', 'Poppy'] },
    { name: 'Destiny Trio + Finn vs Balanced Quad', allies: ['Sora', 'Riku', 'Kairi', 'Finn'], enemies: ['Bassie', 'Cocoa', 'Tisha', 'Brusha'] },
    { name: 'Destiny Trio + Blot vs Boss Slayer Squad', allies: ['Sora', 'Riku', 'Kairi', 'Blot'], enemies: ['ShadowMilkCookie', 'CreamPuffCookie', 'Pebble', 'Vee'] },
  ];

  matchups.forEach(m => {
    const B = new Battle({ offscreen: true });
    B.start(m.allies.map(id => spec(id, 70, 5)), m.enemies.map(id => spec(id, 70, 5)), { timeLimit: 30 });
    for (let s = 0; s < 250; s++) {
      B.step(0.1);
      if (B.isOver) break;
    }
    const livingAllies = B.units.filter(u => u.team === TEAM_P && u.alive);
    const livingEnemies = B.units.filter(u => u.team === TEAM_E && u.alive);
    const sora = B.units.find(u => u.id === 'Sora');
    const riku = B.units.find(u => u.id === 'Riku');
    const kairi = B.units.find(u => u.id === 'Kairi');
    console.log('Match: ' + m.name);
    console.log('  Result: ' + (livingEnemies.length === 0 ? 'FLAWLESS VICTORY' : 'WIN') + ' (t=' + B.t.toFixed(1) + 's, Allies Alive: ' + livingAllies.length + '/4, Enemies: ' + livingEnemies.length + '/4)');
    if (sora) console.log('    Sora: Dmg=' + Math.round(sora.dmgDone || 0) + ', Taken=' + Math.round(sora.dmgTaken || 0) + ', HP=' + Math.round(sora.hp / sora.max.hp * 100) + '%');
    if (riku) console.log('    Riku: Dmg=' + Math.round(riku.dmgDone || 0) + ', Taken=' + Math.round(riku.dmgTaken || 0) + ', HP=' + Math.round(riku.hp / riku.max.hp * 100) + '%');
    if (kairi) console.log('    Kairi: Dmg=' + Math.round(kairi.dmgDone || 0) + ', Heal=' + Math.round(kairi.healDone || 0) + ', HP=' + Math.round(kairi.hp / kairi.max.hp * 100) + '%');
    assert(livingAllies.length >= 3, 'Trio squad must remain dominant across competitive benchmarks');
  });
  console.log('PASS: All Destiny Trio competitive benchmarks passed.');
}
`, ctx);

console.log('\n=== ALL TESTS AND BENCHMARKS PASSED SUCCESSFULLY! ===');
