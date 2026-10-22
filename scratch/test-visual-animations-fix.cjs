const fs = require('fs');
const vm = require('vm');
const assert = require('assert');

const coreCode = fs.readFileSync('js/core.js', 'utf8');
const fxCode = fs.readFileSync('js/battle/fx.js', 'utf8');
const simCode = fs.readFileSync('js/battle/sim.js', 'utf8');

// Set up mock window / document environment
const classList = new Set();
const docEl = {
  classList: {
    toggle: (cls, on) => { if (on) classList.add(cls); else classList.delete(cls); },
    contains: (cls) => classList.has(cls)
  },
  dataset: {}
};

let prefersReducedMotion = true; // Simulating Windows OS with reduced motion flag on

const sandbox = {
  window: {
    matchMedia: (q) => ({ matches: prefersReducedMotion, addEventListener: () => {} })
  },
  matchMedia: (q) => ({ matches: prefersReducedMotion, addEventListener: () => {} }),
  document: {
    documentElement: docEl,
    getElementById: () => null,
    querySelector: () => null
  },
  $: () => null,
  $$: () => [],
  el: (tag, cls) => ({ tag, className: cls, style: {}, appendChild: () => {} }),
  clamp: (v, min, max) => Math.max(min, Math.min(max, v)),
  rnd: (a, b) => (a + b) / 2,
  pick: (arr) => arr[0],
  console,
  setTimeout: () => {},
  clearTimeout: () => {},
  setInterval: () => {},
  clearInterval: () => {},
  requestAnimationFrame: (cb) => { cb(); },
  DEPTH_SCALE_FALL: 0.15,
  DEPTH_XCOMPRESS: 0.1,
  Art: { item: (s) => s, object: (s) => s, vfx: () => '' }
};

vm.createContext(sandbox);

// Load core.js
vm.runInContext(coreCode + '\nglobalThis.Accessibility = Accessibility;\nif (typeof FX !== "undefined") globalThis.FX = FX;\nif (typeof Battle !== "undefined") globalThis.Battle = Battle;', sandbox);

// 1. Test Accessibility when Save.data.opt.reducedEffects is false
sandbox.Save = {
  data: {
    opt: { reducedEffects: false },
    seen: {}
  },
  write: () => {}
};

assert.strictEqual(sandbox.Accessibility.systemEnabled(), true, 'System has prefers-reduced-motion: reduce');
assert.strictEqual(sandbox.Accessibility.enabled(), false, 'Accessibility.enabled() should be false when user opt.reducedEffects is false, even if system is reduce');

sandbox.Accessibility.sync();
assert.strictEqual(classList.has('accessibility-reduced-effects'), false, 'HTML should NOT have accessibility-reduced-effects');

// 2. Test Accessibility when Save.data.opt.reducedEffects is true
sandbox.Save.data.opt.reducedEffects = true;
assert.strictEqual(sandbox.Accessibility.enabled(), true, 'Accessibility.enabled() should be true when user opt.reducedEffects is true');
sandbox.Accessibility.sync();
assert.strictEqual(classList.has('accessibility-reduced-effects'), true, 'HTML should have accessibility-reduced-effects');

// 3. Test Accessibility when Save.data.opt.reducedEffects is undefined (fallback to system)
delete sandbox.Save.data.opt.reducedEffects;
assert.strictEqual(sandbox.Accessibility.enabled(), true, 'Accessibility.enabled() should fallback to system when reducedEffects is undefined');

// 4. Test Accessibility.disable()
sandbox.Accessibility.disable();
assert.strictEqual(sandbox.Save.data.opt.reducedEffects, false, 'Save.data.opt.reducedEffects should now be false');
assert.strictEqual(sandbox.Accessibility.enabled(), false, 'Accessibility.enabled() should now be false');
assert.strictEqual(classList.has('accessibility-reduced-effects'), false, 'HTML should NOT have accessibility-reduced-effects after disable');

// 5. Test FX.floatItem and FX.floatIcon when FX.pop is null
vm.runInContext(fxCode + '\nglobalThis.FX = FX;', sandbox);
sandbox.FX.pop = null;
try {
  sandbox.FX.floatIcon(100, 100, '⭐', '#fff');
  sandbox.FX.floatItem(100, 100, 'Bread', '#ffd166');
  console.log('FX.floatIcon and FX.floatItem with null pop: PASS (no crash)');
} catch (e) {
  assert.fail('FX.floatIcon or FX.floatItem threw with null pop: ' + e.message);
}

// 6. Test Battle.prototype.unitFxAnchor with null unit
vm.runInContext(simCode + '\nglobalThis.Battle = Battle;', sandbox);
const battle = new sandbox.Battle();
try {
  const anchor = battle.unitFxAnchor(null);
  assert(anchor && typeof anchor.x === 'number' && typeof anchor.y === 'number', 'Anchor coordinates returned');
  console.log('Battle.unitFxAnchor(null): PASS (returned safe fallback anchor)');
} catch (e) {
  assert.fail('battle.unitFxAnchor(null) threw: ' + e.message);
}

console.log('\nAll Visual Animation & Accessibility Tests PASSED successfully!');
