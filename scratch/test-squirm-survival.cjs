const fs = require('fs');
const vm = require('vm');
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
const ctx = vm.createContext({
  console: console,
  document: doc, window: null, localStorage: { getItem() { return null; }, setItem() {}, removeItem() {} },
  navigator: { userAgent: 'node', hardwareConcurrency: 4 }, location: { search: '', href: 'http://localhost' },
  performance, URL, URLSearchParams, Image: class {}, Audio: class {}, setTimeout: () => 0, clearTimeout() {},
  setInterval: () => 0, clearInterval() {}, requestAnimationFrame: () => 0, cancelAnimationFrame() {},
  matchMedia: () => ({ matches: false, addEventListener() {} }), innerWidth: 560, innerHeight: 760
});
ctx.window = ctx; ctx.addEventListener = () => {};

const scripts = [...fs.readFileSync(path.join(root, 'index.html'), 'utf8').matchAll(/<script src="([^"]+)"/g)]
  .map(m => m[1]).filter(s => !['js/main.js', 'js/websim.js'].includes(s));
for (const file of scripts) vm.runInContext(fs.readFileSync(path.join(root, file), 'utf8'), ctx, { filename: file });

vm.runInContext(`
Save.data = Save.fresh(); Save.write = () => {}; Save.addMasteryXp = () => {}; UI.queueHeroUnlock = () => {}; UI.toast = () => {}; Achievements.record = () => {};
Object.keys(FX).forEach(k => { if (typeof FX[k] === 'function') FX[k] = () => {}; });
Object.keys(Sound).forEach(k => { if (typeof Sound[k] === 'function') Sound[k] = () => false; });

const spec = id => ({ id, level: 70, rarity: 5, rarityPlus: 1, stars: 3, skillLv: 70 });
const B = new Battle({ offscreen: true });

// Spawn 3 hard hitting bosses against solo Squirm!
const boss1 = makeTwisted('Dandy', 70, 'boss');
const boss2 = makeTwisted('Vee', 70, 'boss');
const boss3 = makeTwisted('Pebble', 70, 'boss');

B.start(
  [spec('Squirm')],
  [boss1, boss2, boss3],
  { timeLimit: 90 }
);

const u = B.units.find(x => x.id === 'Squirm');
console.log("Squirm starting HP: " + u.hp + "/" + u.max.hp);

let prevSec = 0;
while (B.t < 60 && !B.over) {
  B.step(0.05);
  const curSec = Math.floor(B.t);
  if (curSec !== prevSec && curSec % 5 === 0) {
    prevSec = curSec;
    console.log(\`T=\${curSec}s: Squirm HP=\${Math.round(u.hp)}/\${Math.round(u.max.hp)} (\${(u.hpPct*100).toFixed(1)}%) Shields=\${u.shields.reduce((a,s)=>a+s.amt,0).toFixed(0)} BiblioPanic=\${u._biblioPanic} Alive=\${u.alive}\`);
  }
}
console.log(\`End of 60s: Squirm alive=\${u.alive}, HP=\${Math.round(u.hp)}/\${Math.round(u.max.hp)}\`);
`, ctx);
