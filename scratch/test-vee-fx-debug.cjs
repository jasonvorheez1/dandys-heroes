const fs = require('fs');
const path = require('path');
const vm = require('vm');

const root = path.resolve(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const regex = /<script\s+src=["']([^"']+)["']/g;
let match;
const scriptPaths = [];
while ((match = regex.exec(html)) !== null) {
  if (!match[1].includes('main.js') && !match[1].includes('websim.js')) {
    scriptPaths.push(match[1]);
  }
}

function makeElem(tag = 'div') {
  return {
    tagName: tag.toUpperCase(),
    className: '',
    id: '',
    style: { setProperty() {}, removeProperty() {} },
    dataset: {},
    children: [],
    innerHTML: '',
    textContent: '',
    parentElement: { classList: { toggle() {}, add() {}, remove() {} }, setAttribute() {} },
    classList: { add() {}, remove() {}, toggle() {}, contains: () => false },
    appendChild: function(c) { this.children.push(c); c.parentNode = this; return c; },
    removeChild: function(c) {
      const idx = this.children.indexOf(c);
      if (idx !== -1) this.children.splice(idx, 1);
      c.parentNode = null;
      return c;
    },
    remove: function() {
      if (this.parentNode && this.parentNode.removeChild) this.parentNode.removeChild(this);
    },
    addEventListener: () => {},
    removeEventListener: () => {},
    setAttribute: () => {},
    removeAttribute: () => {},
    getAttribute: () => null,
    querySelector: () => makeElem(),
    querySelectorAll: () => [],
    getBoundingClientRect: () => ({ width: 560, height: 760, top: 0, left: 0, bottom: 760, right: 560 })
  };
}

const elements = {};
const rafQueue = [];
const sandbox = {
  rafQueue,
  console: console,
  setTimeout: (cb, d) => { try { cb(); } catch(e) { console.error('setTimeout err:', e); } return 1; },
  clearTimeout: () => {},
  setInterval: () => 1,
  clearInterval: () => {},
  requestAnimationFrame: (cb) => { rafQueue.push(cb); return rafQueue.length; },
  cancelAnimationFrame: () => {},
  Math: Math,
  Date: Date,
  performance: { now: () => Date.now() },
  window: null,
  document: {
    getElementById: (id) => elements[id] || (elements[id] = makeElem()),
    querySelector: (sel) => elements[sel] || (elements[sel] = makeElem()),
    querySelectorAll: (sel) => [],
    createElement: (tag) => makeElem(tag),
    body: makeElem('body'),
    documentElement: makeElem('html'),
    addEventListener: () => {}
  },
  localStorage: { getItem: () => null, setItem: () => {}, removeItem: () => {} }
};
sandbox.window = sandbox;

const context = vm.createContext(sandbox);

for (const scriptPath of scriptPaths) {
  const fullPath = path.join(root, scriptPath);
  const code = fs.readFileSync(fullPath, 'utf8');
  try {
    vm.runInContext(code, context, { filename: scriptPath });
  } catch (err) {
    console.error('Error loading ' + scriptPath + ':', err);
  }
}

vm.runInContext(`
  FX.init();
  const B = new Battle({ offscreen: false });
  const heroes = [
    { id: 'Vee', level: 70, rarity: 5, stars: 3, skillLv: 70 },
    { id: 'Boxten', level: 70, rarity: 5, stars: 3, skillLv: 70 }
  ];
  const enemies = [
    makeTwisted('Shrimpo', 70, 'boss'),
    makeTwisted('Poppy', 70, 'boss')
  ];
  enemies.forEach(e => { e.maxHp = 500000; e.hp = 500000; });
  B.start(heroes, enemies);
  const u = B.units.find(x => x.id === 'Vee');
  console.log('Battle started. Vee unit found:', !!u);

  // Cast W
  console.log('Testing W cast...');
  HEROES.Vee.skills.W.cast(u, B, { ratio: 2.45, heal: .20, shield: .25 }, skillGrowthParams(HEROES.Vee.skills.W, 70));

  // Cast G
  console.log('Testing G cast...');
  HEROES.Vee.skills.G.cast(u, B, { heal: .22, fortifyDef: .35 }, skillGrowthParams(HEROES.Vee.skills.G, 70));

  // Cast B
  console.log('Testing B cast...');
  HEROES.Vee.skills.B.cast(u, B, { heal: .10 }, skillGrowthParams(HEROES.Vee.skills.B, 70));

  // Trigger R
  console.log('Testing R trigger...');
  // Log all skill casts
  B.on(u, 'cast', (unit, sk) => console.log('Skill cast by', unit.id, ':', sk));
  B.units.forEach(unit => {
    B.on(unit, 'cast', (un, sk) => console.log('UNIT CAST:', un.id, sk));
  });

  // Step battle forward for 60 seconds
  console.log('Running 60s combat simulation...');
  for (let i = 0; i < 1200; i++) {
    B.step(0.05);
    while (rafQueue.length) {
      const cb = rafQueue.shift();
      try { cb(); } catch(e) { console.error('rAF error at tick ' + i + ':', e); throw e; }
    }
  }
  console.log('60s combat simulation completed successfully! Battle over:', B.over);
`, context);
