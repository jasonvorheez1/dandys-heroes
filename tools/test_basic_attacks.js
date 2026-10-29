/* Focused checks for the basic-attack code embedded in js/game.js. */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const bundle = fs.readFileSync(path.join(__dirname, '../js/game.js'), 'utf8');
const start = bundle.indexOf('var S=') + 6;
const end = bundle.indexOf('];\nfor(var i=', start) + 1;
const aiCode = new Map(JSON.parse(bundle.slice(start, end))).get('battle/ai.js');
const context = {
  Sound: { play: () => true },
  FX: { burst() {}, shake() {} },
  chance: () => false,
  rnd: (a, b) => (a + b) / 2,
  TEAM_E: 1,
  TEAM_P: 0
};
const AI = vm.runInNewContext(aiCode + '\nAI', context);

function fixture(basic, options = {}) {
  const target = { alive: true, team: 1, x: 100, y: 100 };
  const other = { alive: true, team: 1, x: 120, y: 100 };
  const unit = {
    id: 'Test', alive: true, team: 0, x: 0, y: 100, face: 1,
    st: { atk: 100, mag: 80 }, def: { basic }, ...options
  };
  const battle = {
    timers: [], damageCalls: [], projectiles: [], events: [],
    after(_delay, fn) { this.timers.push(fn); },
    fxProj(_from, to, _opt, onHit) {
      this.projectiles.push(to);
      this.after(.1, onHit);
    },
    damage(_source, to, amount, opt) {
      this.damageCalls.push({ to, amount, opt });
      return this.miss ? null : { crit: false };
    },
    isTargetable(to) { return !!(to && to.alive && !to.untargetable); },
    enemiesOf() { return [target, other]; },
    distance() { return 20; },
    energy() {}, fxSlash() {}, emitFor() {},
    emitTeam(_team, event) { this.events.push(event); },
    emitFoe() {}
  };
  const step = () => { const fn = battle.timers.shift(); assert.ok(fn); fn(); };
  return { unit, target, other, battle, step };
}

{
  const f = fixture({ type: 'physical', ratio: 1, range: 232, proj: 'orb' });
  AI.resolveBasic(f.unit, f.battle, { tgt: f.target });
  f.step();
  assert.equal(f.battle.projectiles.length, 1, 'physical projectile should launch');
  assert.equal(f.battle.damageCalls.length, 0, 'damage waits for projectile impact');
  f.step();
  assert.equal(f.battle.damageCalls[0].opt.melee, false);
  assert.equal(f.battle.damageCalls[0].opt.basic, true);
}

{
  const f = fixture({ type: 'physical', ratio: 1, range: 100 });
  f.unit.basicRedirect = () => f.other;
  AI.resolveBasic(f.unit, f.battle, { tgt: f.target });
  f.target.alive = false;
  f.step();
  assert.equal(f.battle.damageCalls[0].to, f.other, 'a committed redirect survives the original target');
}

{
  const f = fixture({ type: 'physical', ratio: 1, range: 100 });
  AI.resolveBasic(f.unit, f.battle, { tgt: f.target });
  f.target.untargetable = true;
  f.step();
  assert.equal(f.battle.damageCalls.length, 0, 'basics do not hit an untargetable unit');
}

{
  const f = fixture({ type: 'physical', ratio: 1, range: 100 });
  f.battle.miss = true;
  AI.resolveBasic(f.unit, f.battle, { tgt: f.target });
  f.step();
  assert.ok(!f.battle.events.includes('allyBasic'), 'misses do not trigger allied hit reactions');
}

{
  const f = fixture({ type: 'physical', ratio: 1, range: 100 }, { pierce: true });
  AI.resolveBasic(f.unit, f.battle, { tgt: f.target });
  f.step();
  assert.equal(f.battle.damageCalls.length, 2);
  assert.equal(f.battle.damageCalls[1].to, f.other);
  assert.equal(f.battle.damageCalls[1].opt.basic, true, 'pierce retains basic damage rules');
  assert.equal(f.battle.damageCalls[1].opt.area, true);
}

{
  const f = fixture({ type: 'physical', ratio: 1, range: 100 }, { pierce: true });
  const ally = { alive: true, team: 0, x: 20, y: 100 };
  f.unit.basicRedirect = () => ally;
  AI.resolveBasic(f.unit, f.battle, { tgt: f.target });
  f.step();
  assert.equal(f.battle.damageCalls.length, 1, 'friendly fire cannot pierce the enemy team');
  assert.ok(!f.battle.events.includes('allyBasic'), 'friendly fire does not trigger allied hit reactions');
}

console.log('basic attack checks passed');
