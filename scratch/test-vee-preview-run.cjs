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
        if (!node || !node.classList) return;
        if (sel.startsWith('.')) {
          const cls = sel.slice(1).split(' ')[0];
          if (node.classList.contains(cls)) results.push(node);
        } else if (sel === 'small' && node.tagName === 'SMALL') {
          results.push(node);
        } else if (sel === 'b' && node.tagName === 'B') {
          results.push(node);
        } else if (sel === 'i' && node.tagName === 'I') {
          results.push(node);
        } else if (sel === 'img' && node.tagName === 'IMG') {
          results.push(node);
        }
        for (const child of node.children) match(child);
      };
      for (const child of el.children) match(child);
      return results;
    },
    setAttribute: () => {},
    removeAttribute: () => {},
    getAttribute: () => null,
    addEventListener: () => {},
    removeEventListener: () => {}
  };
  return el;
}

const doc = {
  documentElement: makeElement('html'),
  body: makeElement('body'),
  querySelector: () => makeElement('div'),
  querySelectorAll: () => [],
  getElementById: () => makeElement('div'),
  createElement: (tag) => makeElement(tag),
  addEventListener: () => {}
};

const sandbox = {
  console: console,
  setTimeout: (cb) => { cb(); return 1; },
  clearTimeout: () => {},
  setInterval: () => 1,
  clearInterval: () => {},
  requestAnimationFrame: (cb) => 1,
  cancelAnimationFrame: () => {},
  window: null,
  document: doc,
  performance: { now: () => Date.now() },
  makeElement,
  localStorage: { getItem: () => null, setItem: () => {} }
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
  console.log('Testing Vee preview rendering for all skills...');
  const hero = HEROES.Vee;
  const skills = ['basic', 'W', 'G', 'B', 'P', 'R'];
  
  for (const sk of skills) {
    console.log('Rendering Vee skill:', sk);
    HeroPage.skillKey = sk;
    HeroPage.hero = hero;
    const stage = makeElement('div', 'preview-stage');
    // Call renderPreview
    HeroPage.renderPreview(stage, hero);
    console.log('renderPreview succeeded for', sk);
    
    // Simulate playPreview frames
    const cfg = stage._preview;
    for (let p = 0; p <= 1; p += 0.05) {
      HeroPage.drawVeePreview(stage, cfg, p, 0.45);
    }
    console.log('Animation playback frames succeeded for', sk);
  }
  console.log('ALL VEE PREVIEWS PASSED!');
`, context);
