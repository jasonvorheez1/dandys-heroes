/* Test Butter Tiger companion lifecycle, physics, actions, and animations */
const fs = require('fs'), vm = require('vm'), assert = require('assert'), path = require('path');
const root = path.resolve(__dirname, '..');

function node() {
  const classes = new Set();
  return {
    get className() { return [...classes].join(' '); },
    set className(val) {
      classes.clear();
      if (val) String(val).split(' ').filter(Boolean).forEach(c => classes.add(c));
    },
    style: {},
    classList: {
      add(...c) { c.forEach(x => classes.add(x)); },
      remove(...c) { c.forEach(x => classes.delete(x)); },
      toggle(c, f) { if (f === undefined) f = !classes.has(c); if (f) classes.add(c); else classes.delete(c); return f; },
      contains(c) { return classes.has(c); }
    },
    dataset: {},
    children: [],
    append(...v) { this.children.push(...v); },
    appendChild(v) { this.children.push(v); v.parentNode = this; return v; },
    removeChild(v) { const idx = this.children.indexOf(v); if (idx >= 0) this.children.splice(idx, 1); return v; },
    replaceChildren() { this.children = []; },
    remove() { if (this.parentNode) this.parentNode.removeChild(this); },
    querySelector(s) {
      if (s.startsWith('.')) {
        const cls = s.slice(1);
        if (this.classList.contains(cls)) return this;
        for (const c of this.children) {
          const f = c.querySelector(s);
          if (f) return f;
        }
      }
      return node();
    },
    querySelectorAll() { return []; },
    setAttribute() {},
    getAttribute() { return ''; },
    removeAttribute() {},
    addEventListener() {},
    getBoundingClientRect() { return { width: 560, height: 760, left: 0, top: 0 }; },
    get firstChild() { return null; },
    parentElement: { classList: { toggle() {} }, setAttribute() {} },
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
  console: { log: console.log, error: console.error, warn(...a) { warnings.push(a.map(v => v?.stack || String(v)).join(' ')); } },
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
    vm.runInContext(fs.readFileSync(root + '/' + p, 'utf8'), ctx, { filename: p });
  } catch (e) {
    console.error('LOAD', p, e);
    process.exit(1);
  }
}

vm.runInContext(`
(() => {
  Save.data = Save.fresh();
  Save.data.mastery = 100;
  Save.write = () => {};
  UI.queueHeroUnlock = () => {};
  UI.toast = () => {};
  Achievements.record = () => {};
  Object.keys(FX).forEach(k => { if (typeof FX[k] === 'function') FX[k] = () => {}; });
  Object.keys(Sound).forEach(k => { if (typeof Sound[k] === 'function') Sound[k] = () => false; });

  const spec = (id, lv = 70) => ({ id, level: lv, rarity: 5, rarityPlus: 1, stars: 3, skillLv: lv });
  const b = new Battle({ offscreen: false });
  const lilySpec = spec('TigerLilyCookie', 70);
  const snakeSpec = spec('PomegranateSnake', 70);

  b.start([lilySpec], [snakeSpec], { timeLimit: 60 });
  const lily = b.units.find(u => u.id === 'TigerLilyCookie');
  const enemy = b.units.find(u => u.id === 'PomegranateSnake');

  assert(lily, 'Tiger Lily unit should exist in battle');
  assert(lily.cookieButterTigerEl, 'Tiger Lily should have companion Butter Tiger element created');
  assert(lily.cookieButterTigerEl.classList.contains('cookie-butter-tiger'), 'Element must have .cookie-butter-tiger class');

  // Verify initial companion state and rendering
  b.render(0.016);
  assert(lily._tigerX != null, 'Tiger companion X should be initialized');
  assert(lily._tigerDepth != null, 'Tiger companion depth should be initialized');
  assert.equal(lily.cookieButterTigerEl.style.display, '', 'Companion is displayed when Tiger Lily is unmounted');

  // Verify companion leash physics
  const initialX = lily._tigerX;
  lily.x += 40;
  b.render(0.05);
  assert(lily._tigerX > initialX, 'Companion leashes toward Tiger Lily new position');

  // Verify Butter Tiger Swipe animation trigger
  lily._tigerSwipeUntil = b.t + 0.42;
  lily._tigerSwipeTarget = enemy;
  b.render(0.016);
  assert(lily.cookieButterTigerEl.classList.contains('swiping'), 'Companion plays swiping action class during swipe');

  // Verify Tiger Pounce animation trigger
  lily._tigerSwipeUntil = 0;
  lily._tigerPounceUntil = b.t + 0.58;
  lily._tigerPounceTarget = enemy;
  b.render(0.016);
  assert(lily.cookieButterTigerEl.classList.contains('pouncing'), 'Companion plays pouncing action class during unmounted pounce');

  // Verify mounted state
  lily._tigerPounceUntil = 0;
  b.applyStatus(lily, lily, 'cookie_tiger_mounted', 6);
  b.render(0.016);
  assert.equal(lily.cookieButterTigerEl.style.display, 'none', 'Companion element hides while Tiger Lily is riding Butter Tiger');

  // Verify dismounted state
  b.removeStatus(lily, 'cookie_tiger_mounted');
  b.render(0.016);
  assert.equal(lily.cookieButterTigerEl.style.display, '', 'Companion element reappears when Tiger Lily dismounts');

  console.log('PASS Butter Tiger companion lifecycle, physics, actions, and animations verified successfully!');
})();
`, ctx);
