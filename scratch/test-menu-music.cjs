const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const root = path.resolve(__dirname, '..');

// 1. Verify files exist on disk
const tracks = [
  'uploads/navigationhome.mp3',
  'uploads/the_perfect_christmas.mp3',
  'uploads/locked_away.mp3'
];
tracks.forEach(t => {
  const p = path.join(root, t);
  assert(fs.existsSync(p), 'File must exist: ' + t);
  assert(fs.statSync(p).size > 100000, 'File must not be empty: ' + t);
  console.log('✓ Verified file:', t, fs.statSync(p).size, 'bytes');
});

// 2. Set up DOM / VM context to run audio.js and save.js
class FakeAudio {
  constructor(src) {
    this.src = src;
    this.loop = false;
    this.paused = true;
    this.volume = 0;
    this.preload = '';
  }
  play() {
    this.paused = false;
    return Promise.resolve();
  }
  pause() {
    this.paused = true;
  }
}

const sandbox = {
  console,
  setTimeout,
  clearTimeout,
  performance: { now: () => Date.now() },
  requestAnimationFrame: (cb) => setTimeout(() => cb(Date.now()), 16),
  cancelAnimationFrame: (id) => clearTimeout(id),
  Audio: FakeAudio,
  matchMedia: () => ({ matches: false }),
  clamp: (v, min, max) => Math.min(Math.max(v, min), max),
  ASSET: './',
  localStorage: {
    _data: {},
    getItem(k) { return this._data[k] || null; },
    setItem(k, v) { this._data[k] = String(v); },
    removeItem(k) { delete this._data[k]; }
  }
};

const ctx = vm.createContext(sandbox);

// Load js/core.js partially or define minimal needs
vm.runInContext(`
  function clamp(v, a, b) { return Math.min(Math.max(v, a), b); }
`, ctx);

// Load js/audio.js
const audioCode = fs.readFileSync(path.join(root, 'js/audio.js'), 'utf8');
vm.runInContext(audioCode, ctx);

// Check definitions
const MT = vm.runInContext('MUSIC_TRACKS', ctx);
assert(MT.navigation, 'navigation track defined');
assert(MT.navigationClairDeLune, 'navigationClairDeLune defined');
assert(MT.navigationChristmas, 'navigationChristmas defined');
assert(MT.navigationLockedAway, 'navigationLockedAway defined');
console.log('✓ MUSIC_TRACKS verified');

const MV = vm.runInContext('MUSIC_VARIANTS', ctx);
assert(Array.isArray(MV.navigation), 'MUSIC_VARIANTS.navigation is array');
assert.strictEqual(MV.navigation.length, 3, 'MUSIC_VARIANTS.navigation contains 3 tracks');
console.log('✓ MUSIC_VARIANTS verified with 3 tracks');

const Music = vm.runInContext('Music', ctx);
const Sound = vm.runInContext('Sound', ctx);
assert(typeof Music.getMenuMode === 'function', 'Music.getMenuMode exists');
assert(typeof Music.setMenuMode === 'function', 'Music.setMenuMode exists');
assert.strictEqual(Music.getMenuMode(), 'random', 'Default menuMode is random');

// Enable sound
Sound.on = true;

// Test selection of christmas
Music.setMenuMode('christmas');
assert.strictEqual(Music.getMenuMode(), 'christmas');
Music.play('navigation', { force: true });
assert(Music.audio.src.includes('the_perfect_christmas.mp3'), 'Played christmas track: ' + Music.audio.src);
console.log('✓ Successfully selected and played The Perfect Christmas');

// Test selection of lockedAway
Music.setMenuMode('lockedAway');
assert.strictEqual(Music.getMenuMode(), 'lockedAway');
Music.play('navigation', { force: true });
assert(Music.audio.src.includes('locked_away.mp3'), 'Played lockedAway track: ' + Music.audio.src);
console.log('✓ Successfully selected and played Locked Away');

// Test selection of clair
Music.setMenuMode('clair');
assert.strictEqual(Music.getMenuMode(), 'clair');
Music.play('navigation', { force: true });
assert(Music.audio.src.includes('navigationhome.mp3'), 'Played clair track: ' + Music.audio.src);
console.log('✓ Successfully selected and played Clair de Lune');

// Test random mode distribution over multiple rolls
Music.setMenuMode('random');
assert.strictEqual(Music.getMenuMode(), 'random');
const played = new Set();
for (let i = 0; i < 30; i++) {
  Music.play('navigation', { force: true });
  played.add(Music.audio.src);
}
assert(played.size >= 3, 'Random mode must play all 3 tracks over 30 rolls. Got: ' + played.size);
console.log('✓ Random mode successfully randomized all 3 tracks:');
played.forEach(s => console.log('   -', s));

console.log('\nALL MUSIC TESTS PASSED!');
