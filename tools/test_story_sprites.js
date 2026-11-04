const fs = require('fs');
const vm = require('vm');

const fd = fs.openSync('assets/flowery/flowery.bin', 'r');
const h = Buffer.alloc(12);
fs.readSync(fd, h, 0, 12, 0);
const jsonLen = h.readUInt32LE(8);
const buf = Buffer.alloc(jsonLen);
fs.readSync(fd, buf, 0, jsonLen, 12);
fs.closeSync(fd);
const pack = JSON.parse(buf.toString('utf8'));

let warnings = [];
const mockCtx = {
  drawImage() {},
  save() {},
  restore() {},
  translate() {},
  rotate() {},
  scale() {},
  fillRect() {},
  strokeRect() {},
  fillText() {},
  strokeText() {},
  beginPath() {},
  closePath() {},
  moveTo() {},
  lineTo() {},
  fill() {},
  stroke() {},
  ellipse() {},
  rect() {},
  clip() {},
  measureText: () => ({ width: 50 }),
  setTransform() {},
  createLinearGradient: () => ({ addColorStop() {} })
};

const packMock = {
  frames: pack.frames,
  sheets: [{}, {}, {}, {}, {}],
  has(n) { return !!pack.frames[n]; },
  size(n) { const f = pack.frames[n]; return f ? { w: f[7], h: f[8] } : { w: 0, h: 0 }; },
  draw(ctx, n, x, y, o) {
    if (!pack.frames[n]) {
      warnings.push(`P().draw missing frame: '${n}' at (${x}, ${y})`);
      return false;
    }
    return true;
  },
  blit() {}
};

global.window = {
  FlPack: packMock,
  devicePixelRatio: 1,
  addEventListener: () => {},
  removeEventListener: () => {}
};
global.FlPack = packMock;
global.Image = class { constructor() { this.naturalWidth = 100; this.naturalHeight = 100; } };
global.document = {
  addEventListener: () => {},
  removeEventListener: () => {}
};
global.requestAnimationFrame = (cb) => {
  setImmediate(() => {
    if (FW.S) FW.step ? FW.step(0.1) : null;
    cb(performance.now());
  });
  return 1;
};
global.cancelAnimationFrame = () => {};

const fwCode = fs.readFileSync('js/flowery-world.js', 'utf8');
const cutsCode = fs.readFileSync('js/flowery-cuts.js', 'utf8');
const s1Code = fs.readFileSync('js/flowery-story.js', 'utf8');
const s2Code = fs.readFileSync('js/flowery-story2.js', 'utf8');

vm.runInThisContext(fwCode);
FW.test = true;
FW.testChoice = 0;
FW.testLog = [];

FW.BATTLES.floradinn = async () => {};
FW.BATTLES.ichorSmall = async () => {};
FW.BATTLES.ichor1 = async () => {};
FW.BATTLES.ichor2 = async () => {};
FW.BATTLES.flowery = async () => {};

vm.runInThisContext(cutsCode);
Object.keys(FW.CUTS).forEach(k => { FW.CUTS[k] = async () => {}; });

vm.runInThisContext(s1Code);
vm.runInThisContext(s2Code);

const mockRoot = {
  querySelector: (sel) => ({
    getBoundingClientRect: () => ({ width: 640, height: 480 }),
    getContext: () => mockCtx,
    classList: { add() {}, remove() {}, toggle() {} },
    querySelectorAll: () => [],
    addEventListener: () => {},
    removeEventListener: () => {},
    style: {}
  }),
  querySelectorAll: () => []
};

async function testAll() {
  for (let sIdx = 0; sIdx < FL_STORY.length; sIdx++) {
    const seg = FL_STORY[sIdx];
    console.log(`=== Testing Segment ${sIdx + 1}: ${seg.id} (${seg.title}) ===`);
    FW.open(mockRoot, {});
    FW.S.ctx = mockCtx;
    FW.S.cv = { width: 640, height: 480, getContext: () => mockCtx };

    const r = await FW.play(seg.script);
    console.log(`Segment ${sIdx + 1} finished with:`, r);

    // Verify all actors in FW.S.actors
    for (const [id, a] of Object.entries(FW.S.actors)) {
      if (a.hidden) continue;
      if (a.c.toon) {
        if (a.frame && !packMock.has(a.frame)) {
          warnings.push(`[Seg ${sIdx+1} ${seg.id}] Toon actor ${id} has invalid frame '${a.frame}'`);
        }
      } else {
        const f = a.frame || (a.c.idle && a.c.idle[a.dir]) || (a.c.idle && a.c.idle.down) || (a.c.walk && a.c.walk[a.dir] && a.c.walk[a.dir][0] + '0');
        if (!a.frame && !a.anim && !f) {
          warnings.push(`[Seg ${sIdx+1} ${seg.id}] Actor ${id} has NO valid frame or idle in dir ${a.dir}`);
        } else if (f && !packMock.has(f)) {
          warnings.push(`[Seg ${sIdx+1} ${seg.id}] Actor ${id} frame '${f}' missing from pack`);
        }
      }
    }
  }

  console.log('\n--- Simulation Complete ---');
  if (warnings.length === 0) {
    console.log('ZERO warnings across all 10 segments!');
  } else {
    console.log(`Found ${warnings.length} warnings:`);
    warnings.forEach(w => console.log('  ' + w));
  }
}

testAll().catch(e => console.error('Simulation error:', e));
