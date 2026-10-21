const fs = require('fs');
const path = require('path');
const vm = require('vm');

const root = path.resolve('c:/Users/anoob/Downloads/dandy_s_heroes_by_scraps/dandys heroes');
const ctx = vm.createContext({
  console, setTimeout: () => {}, clearTimeout: () => {}, setInterval: () => {}, clearInterval: () => {},
  Math, Date, Object, Array, String, Number, Boolean, RegExp, Set, Map,
  window: {},
  document: {
    createElement: () => ({ setAttribute: () => {}, appendChild: () => {}, style: {}, classList: { add: () => {}, remove: () => {} } }),
    createDocumentFragment: () => ({ append: () => {}, appendChild: () => {}, childNodes: [] }),
    createTreeWalker: () => ({ nextNode: () => false })
  },
  requestAnimationFrame: () => 0, cancelAnimationFrame() {}, matchMedia: () => ({ matches: false, addEventListener() {} })
});
ctx.window = ctx;

const indexHtml = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const scripts = [...indexHtml.matchAll(/<script src="([^"]+)"/g)]
  .map(x => x[1])
  .filter(x => !['js/main.js', 'js/websim.js', 'js/ui/screens/arena-live.js'].includes(x));

for (const p of scripts) {
  try {
    vm.runInContext(fs.readFileSync(path.join(root, p), 'utf8'), ctx, { filename: p });
  } catch (e) {
    console.error('LOAD ERROR', p, e);
    process.exit(1);
  }
}

console.log('Environment loaded successfully!');
const count = vm.runInContext('Object.keys(BADGES).length', ctx);
console.log('Testing existing BADGES count:', count);

vm.runInContext(`
  ['Eggson', 'GingerBrave'].forEach(id => {
    const h = HEROES[id];
    console.log('=== ' + id + ' (' + h.name + ') ===');
    ['W', 'G', 'B', 'P', 'R'].forEach(k => {
      const s = h.skills[k];
      const desc = SkillDesc.format(id, k, s, 30);
      console.log('[' + k + '] ' + s.name + ': ' + desc.substring(0, 100) + '...');
    });
  });
`, ctx);


