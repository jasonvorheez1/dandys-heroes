const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const root = path.resolve(__dirname, '..');

// Fake minimal DOM
class FakeElement {
  constructor(tag, cls = '', text = '') {
    this.tagName = tag.toUpperCase();
    this.className = cls;
    this.classList = {
      _classes: new Set(cls.split(' ').filter(Boolean)),
      add(c) { this._classes.add(c); },
      remove(c) { this._classes.delete(c); },
      toggle(c, force) {
        if (force === undefined) {
          if (this._classes.has(c)) { this._classes.delete(c); return false; }
          else { this._classes.add(c); return true; }
        }
        if (force) this._classes.add(c); else this._classes.delete(c);
        return force;
      },
      contains(c) { return this._classes.has(c); }
    };
    this.children = [];
    this.dataset = {};
    this.attributes = {};
    this.style = {};
    if (text) this.textContent = text;
  }
  setAttribute(k, v) { this.attributes[k] = String(v); }
  getAttribute(k) { return this.attributes[k]; }
  appendChild(child) { this.children.push(child); return child; }
  append(...children) { children.forEach(c => this.appendChild(c)); }
  querySelector(sel) {
    if (sel.startsWith('.')) {
      const cls = sel.slice(1);
      const find = (node) => {
        if (node.classList && node.classList.contains(cls)) return node;
        for (const c of (node.children || [])) {
          const res = find(c);
          if (res) return res;
        }
        return null;
      };
      return find(this);
    }
    return null;
  }
  querySelectorAll(sel) {
    const results = [];
    const find = (node) => {
      if (sel.startsWith('.') && node.classList && node.classList.contains(sel.slice(1))) results.push(node);
      for (const c of (node.children || [])) find(c);
    };
    find(this);
    return results;
  }
}

const sandbox = {
  console,
  document: {
    createElement(tag) { return new FakeElement(tag); }
  },
  el(tag, cls, text) { return new FakeElement(tag, cls, text); },
  $: () => new FakeElement('div'),
  fmt: (n) => String(n),
  clear: (node) => { node.children = []; return node; },
  clamp: (v, a, b) => Math.min(Math.max(v, a), b),
  Sound: { on: true, vol: 0.8, toggle: () => false, setVolume: () => {} },
  Music: {
    volume: 0.3,
    menuMode: 'random',
    getMenuMode() { return this.menuMode; },
    setMenuMode(m) { this.menuMode = m; },
    setVolume() {}
  },
  Save: {
    data: {
      opt: { sound: true, sfxVolume: 0.8, musicVolume: 0.3, menuMusic: 'random', graphicsQuality: 50 }
    },
    activeSlot: 'slot_1',
    slots: () => [{ id: 'slot_1', name: 'Slot 1' }],
    listSlots: () => [{ id: 'slot_1', name: 'Slot 1' }],
    canLoadTestSave: () => false,
    write() {}
  },
  Accessibility: { enabled: () => false, systemEnabled: () => false, sync: () => {} },
  GraphicsSettings: { value: () => 50, option: () => true, remember: () => {}, sync: () => {} },
  SAVE_SLOT_LIMIT: 5,
  SAVE_SLOT_TOTAL: 5,
  SAVE_PREFIX: 'dh_slot_',
  ASSET: './'
};

const ctx = vm.createContext(sandbox);

// Load Screens object from core.js
const coreCode = fs.readFileSync(path.join(root, 'js/ui/screens/core.js'), 'utf8');
vm.runInContext(coreCode, ctx);

const Screens = vm.runInContext('Screens', ctx);
assert(Screens, 'Screens loaded');

// We simulate openSettings body generation
let capturedBody = null;
sandbox.UI = {
  modal(title, content) {
    capturedBody = content;
  }
};

(async () => {
  await Screens.openSettings();
  assert(capturedBody, 'Settings modal opened');

  const musicPanel = capturedBody.querySelector('.settings-menu-music-panel');
  assert(musicPanel, 'Menu music panel found in settings');

  const buttons = musicPanel.querySelectorAll('.settings-music-btn');
  assert.strictEqual(buttons.length, 4, '4 music buttons created (Random, Clair, Christmas, Locked Away)');

  const buttonModes = buttons.map(b => b.dataset.mode);
  assert.deepStrictEqual(buttonModes, ['random', 'clair', 'christmas', 'lockedAway']);
  console.log('✓ Found all 4 music buttons:', buttonModes);

  // Check random is active initially
  assert(buttons[0].classList.contains('active'), 'Random button active initially');

  // Click Christmas button
  buttons[2].onclick();
  assert.strictEqual(sandbox.Music.menuMode, 'christmas', 'Music.menuMode updated to christmas');
  assert(buttons[2].classList.contains('active'), 'Christmas button is now active');
  assert(!buttons[0].classList.contains('active'), 'Random button is no longer active');
  console.log('✓ Clicking Christmas button switched mode to christmas and updated UI');

  // Click Locked Away button
  buttons[3].onclick();
  assert.strictEqual(sandbox.Music.menuMode, 'lockedAway', 'Music.menuMode updated to lockedAway');
  assert(buttons[3].classList.contains('active'), 'Locked Away button is now active');
  assert(!buttons[2].classList.contains('active'), 'Christmas button is no longer active');
  console.log('✓ Clicking Locked Away button switched mode to lockedAway and updated UI');

  console.log('\nALL SETTINGS UI TESTS PASSED!');
})().catch(e => { console.error(e); process.exit(1); });
