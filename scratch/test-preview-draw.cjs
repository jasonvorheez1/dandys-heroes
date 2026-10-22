const fs = require('fs');
const path = require('path');
const vm = require('vm');

const root = path.resolve(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const scriptMatches = [...html.matchAll(/<script\s+src="([^"]+)"><\/script>/g)].map(m => m[1]);

function makeElement(tag, className) {
  const el = {
    tagName: (tag || 'DIV').toUpperCase(),
    className: className || '',
    style: {
      setProperty: (k, v) => { el.style[k] = v; }
    },
    dataset: {},
    children: [],
    childNodes: [],
    parentNode: null,
    clientWidth: 500,
    clientHeight: 260,
    isConnected: true,
    offsetWidth: 500,
    offsetHeight: 260,
    classList: {
      _classes: new Set((className || '').split(' ').filter(Boolean)),
      add: function(...args) { args.forEach(a => this._classes.add(a)); el.className = [...this._classes].join(' '); },
      remove: function(...args) { args.forEach(a => this._classes.delete(a)); el.className = [...this._classes].join(' '); },
      toggle: function(a, force) {
        if (force === undefined) force = !this._classes.has(a);
        if (force) this.add(a); else this.remove(a);
        return force;
      },
      contains: function(a) { return this._classes.has(a); }
    },
    appendChild: function(c) {
      if (!c) return;
      c.parentNode = el;
      el.children.push(c);
      el.childNodes.push(c);
      return c;
    },
    removeChild: function(c) {
      const idx = el.children.indexOf(c);
      if (idx !== -1) el.children.splice(idx, 1);
      const idx2 = el.childNodes.indexOf(c);
      if (idx2 !== -1) el.childNodes.splice(idx2, 1);
      c.parentNode = null;
      return c;
    },
    remove: function() {
      if (el.parentNode) el.parentNode.removeChild(el);
    },
    querySelector: function(sel) {
      return el.querySelectorAll(sel)[0] || null;
    },
    querySelectorAll: function(sel) {
      const results = [];
      const match = (node) => {
        if (sel.startsWith('.')) {
          const cls = sel.slice(1).split(' ')[0];
          if (node.classList && node.classList.contains(cls)) results.push(node);
        } else if (sel.startsWith('#')) {
          if (node.id === sel.slice(1)) results.push(node);
        } else if (sel === 'i' || sel === 'img' || sel === 'b' || sel === 'u') {
          if (node.tagName === sel.toUpperCase()) results.push(node);
        }
        (node.children || []).forEach(match);
      };
      (el.children || []).forEach(match);
      return results;
    },
    setAttribute: () => {},
    getAttribute: () => null,
    addEventListener: () => {}
  };
  return el;
}

const domMock = `
const window = globalThis;
const document = {
  documentElement: makeElement('html'),
  querySelector: (s) => null,
  querySelectorAll: () => [],
  getElementById: () => null,
  createElement: makeElement,
  addEventListener: () => {},
  hidden: false
};
const performance = { now: () => Date.now() };
const matchMedia = () => ({ matches: false, addEventListener: () => {} });
const localStorage = { getItem: () => null, setItem: () => {} };
`;

const ctx = vm.createContext({ makeElement, console });
vm.runInContext(domMock, ctx);

for (const s of scriptMatches) {
  if (s === 'js/main.js') continue;
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

// Test preview rendering and draw*Preview for all heroes
const HEROES = ctx.HEROES;
const HeroPage = ctx.HeroPage;
const $ = ctx.$;

console.log('Testing preview rendering and draw methods for all heroes...');
let drawErrors = 0;

for (const id in HEROES) {
  const hero = HEROES[id];
  const keys = ['basic', 'W', 'G', 'B', 'P', 'R'].filter(k => k === 'basic' ? hero.basic : (hero.skills && hero.skills[k]));
  for (const k of keys) {
    try {
      HeroPage.skillKey = k;
      const stage = HeroPage.previewStage(id, k);
      if (!stage) continue;
      stage._previewW = 500;
      stage._previewH = 260;
      const cfg = stage._preview || {};
      
      // Test drawing frames at p = 0, 0.25, 0.5, 0.75, 1.0
      const hitAt = 0.5;
      for (const p of [0, 0.2, 0.45, 0.5, 0.75, 1]) {
        if (cfg.scrapsMode) HeroPage.drawScrapsPreview(stage, cfg, p, hitAt);
        if (cfg.flutterMode) HeroPage.drawFlutterPreview(stage, cfg, p, hitAt);
        if (cfg.sproutMode) HeroPage.drawSproutPreview(stage, cfg, p, hitAt);
        if (cfg.astroMode) HeroPage.drawAstroPreview(stage, cfg, p, hitAt);
        if (cfg.rodgerMode) HeroPage.drawRodgerPreview(stage, cfg, p, hitAt);
        if (cfg.shrimpoMode) HeroPage.drawShrimpoPreview(stage, cfg, p, hitAt);
        if (cfg.veeMode) HeroPage.drawVeePreview(stage, cfg, p, hitAt);
        if (cfg.flyteMode) HeroPage.drawFlytePreview(stage, cfg, p, hitAt);
        if (cfg.bassieMode) HeroPage.drawBassiePreview(stage, cfg, p, hitAt);
        if (cfg.waxMode) HeroPage.drawWaxwellPreview(stage, cfg, p, hitAt);
        if (cfg.rudieMode) HeroPage.drawRudiePreview(stage, cfg, p, hitAt);
        if (cfg.dandyMode) HeroPage.drawDandyPreview(stage, cfg, p, hitAt);
        if (cfg.pebbleMode) HeroPage.drawPebblePreview(stage, cfg, p, hitAt);
        if (cfg.ribeccaMode) HeroPage.drawRibeccaPreview(stage, cfg, p, hitAt);
        if (cfg.milkMode) HeroPage.drawMilkPreview(stage, cfg, p, hitAt);
        if (cfg.vanillaMode) HeroPage.drawVanillaPreview(stage, cfg, p, hitAt);
        if (cfg.khMode) HeroPage.drawKhPreview(stage, cfg, p, hitAt);
      }
    } catch (e) {
      console.error('ERROR in preview draw for ' + id + ' ' + k + ':', e);
      drawErrors++;
    }
  }
}
console.log('Finished testing draw methods. Errors found:', drawErrors);
