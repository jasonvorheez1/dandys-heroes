const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

const bundle = fs.readFileSync('js/game.js', 'utf8');
const scripts = new Map(JSON.parse(bundle.split('var S=')[1].split(';\nfor(var i=')[0]));
const source = scripts.get('battle/fx.js');
let now = 0, nextId = 1;
const queue = new Map();
function schedule(fn, delay) { const id = nextId++; queue.set(id, { at: now + delay, fn }); return id; }
function advance(ms) {
  const end = now + ms;
  while (true) {
    const task = [...queue].filter(([, item]) => item.at <= end).sort((a, b) => a[1].at - b[1].at)[0];
    if (!task) break;
    queue.delete(task[0]); now = task[1].at; task[1].fn();
  }
  now = end;
}
function node(classes = '') {
  const n = { children: [], parent: null, style: {}, innerHTML: '', classes: new Set(classes.split(/\s+/).filter(Boolean)) };
  n.classList = { add: value => n.classes.add(value), remove: value => n.classes.delete(value) };
  n.appendChild = child => { child.parent = n; n.children.push(child); };
  n.remove = () => { if (n.parent) n.parent.children = n.parent.children.filter(child => child !== n); n.parent = null; };
  n.querySelectorAll = selector => n.children.filter(child => child.classes.has(selector.slice(1)));
  return n;
}
const ctx = vm.createContext({
  Math, Set, el: (_tag, classes) => node(classes),
  setTimeout: schedule, clearTimeout: id => queue.delete(id),
  requestAnimationFrame: fn => schedule(() => fn(now), 0), cancelAnimationFrame: id => queue.delete(id)
});
vm.runInContext(source, ctx);
const FX = vm.runInContext('FX', ctx);
FX.front = node(); FX.back = node(); FX.reducedEffects = false;
FX.battleMs = seconds => seconds * 1000;
FX.ring = () => {}; FX.sparkle = () => {}; FX.flash = () => {};

for (let i = 0; i < 7; i++) FX.gingerRoyalIcing(100 + i * 20, 100, 125, 8);
assert.equal(FX.front.querySelectorAll('.gi-icing').length, 3, 'party shields keep at most three decorative domes');
advance(1600);
assert.equal(FX.front.querySelectorAll('.gi-icing').length, 0, 'domes expire before the eight-second gameplay shield');

for (let i = 0; i < 4; i++) FX.gingerPeppermintHearth(150 + i * 20, 100, 6);
assert.equal(FX.back.querySelectorAll('.gi-hearth').length, 2, 'hearth visuals are capped');
advance(2100);
assert.equal(FX.back.querySelectorAll('.gi-hearth').length, 0, 'hearth visuals expire before six-second regeneration ends');

FX.gingerHeartBurst(150, 100, 160, { masterwork: true });
FX.gingerMasterwork(150, 100);
advance(900);
assert.equal(FX.front.querySelectorAll('.gi-heart').length, 0);
assert.equal(FX.front.querySelectorAll('.gi-master').length, 0);
console.log('Ginger FX lifespan checks passed');
