const fs = require('fs');
const path = require('path');
const vm = require('vm');

const root = path.resolve(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const scriptMatches = [...html.matchAll(/<script\s+src="([^"]+)"><\/script>/g)].map(m => m[1]);

const domMock = `
const window = globalThis;
const document = {
  documentElement: { classList: { toggle: () => {}, add: () => {}, remove: () => {} }, dataset: {} },
  querySelector: () => null,
  querySelectorAll: () => [],
  getElementById: () => null,
  createElement: () => ({
    style: {}, classList: { add: () => {}, remove: () => {}, toggle: () => {} },
    appendChild: () => {}, remove: () => {}, setAttribute: () => {},
    addEventListener: () => {}, replaceChildren: () => {},
    children: [], firstElementChild: null, dataset: {}
  }),
  hidden: false
};
const performance = { now: () => Date.now() };
const matchMedia = () => ({ matches: false, addEventListener: () => {} });
const localStorage = { getItem: () => null, setItem: () => {} };
`;

const ctx = vm.createContext({});
vm.runInContext(domMock, ctx);

for (const s of scriptMatches) {
  const filePath = path.join(root, s);
  if (fs.existsSync(filePath)) {
    const code = fs.readFileSync(filePath, 'utf8');
    try {
      vm.runInContext(code, ctx);
    } catch (e) {
      console.error('Error loading script ' + s + ':', e);
    }
  }
}

// Test SkillPreviewSimulator for all heroes
const HEROES = ctx.HEROES;
const SkillPreviewSimulator = ctx.SkillPreviewSimulator;
const HeroPage = ctx.HeroPage;

console.log('Testing SkillPreviewSimulator for all heroes...');
let errors = 0;
for (const id in HEROES) {
  const hero = HEROES[id];
  const keys = ['basic', 'W', 'G', 'B', 'P', 'R'].filter(k => k === 'basic' ? hero.basic : (hero.skills && hero.skills[k]));
  for (const k of keys) {
    try {
      const cfg = { id, previewKey: k, basic: k === 'basic', ally: false };
      const skill = k === 'basic' ? hero.basic : hero.skills[k];
      const res = SkillPreviewSimulator.run(cfg, skill, k);
      if (res && res.error) {
        console.warn('Simulation returned error for ' + id + ' ' + k + ':', res.error);
        errors++;
      }
    } catch (e) {
      console.error('EXCEPTION in SkillPreviewSimulator for ' + id + ' ' + k + ':', e);
      errors++;
    }
  }
}
console.log('Finished testing previews. Errors found:', errors);
