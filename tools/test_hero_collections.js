const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

const bundle = fs.readFileSync('js/game.js', 'utf8');
const scripts = new Map(JSON.parse(bundle.split('var S=')[1].split(';\nfor(var i=')[0]));
const heroes = Object.fromEntries(['A','B','C','D','E','F'].map(id => [id, {
  name: id, role: id === 'A' ? 'Tank' : 'Damage', base: { atk: 100, mag: 20 }, hidden: { range: 200 }
}]));
const owned = new Set(['A','B','C','D','E','F']);
let writes = 0;
const data = { mastery: 650, heroes: {}, profile: { iconUnlocks: [] }, res: {}, heroCollections: { wins: {}, claimed: {}, seen: [] } };
const ctx = vm.createContext({
  HEROES: heroes, PLAYABLE_IDS: Object.keys(heroes), HERO_GENDER: { A:'Female',B:'Female',C:'Female',D:'Female',E:'Female',F:'Female' },
  KH_CAST_IDS: [], FF7_HERO_IDS: [], DW_MODDED_HERO_IDS: new Set(),
  heroRole: role => role, TEAM_P: 0, TEAM_E: 1,
  statTags: () => ({ sturdy: new Set(), swift: new Set(), arcane: new Set(), frontline: new Set(), support: new Set() }),
  HERO_MOTIF_TAGS: { Performer: { ids: new Set() }, Food: { ids: new Set() }, Healer: { ids: new Set() }, Tragic: { ids: new Set() } },
  HERO_ANIMAL: {},
  Save: { data, owns: id => owned.has(id), write: () => { writes++; } },
  Screens: {},
  UI: { toast() {}, refreshBar() {} }, Sound: { play() {} },
  masteryRewardBundle: reward => Object.fromEntries(Object.entries(reward).map(([k, n]) => [k, n * 2])),
  clamp: (n, a, b) => Math.max(a, Math.min(b, n)),
  statLevelMult: () => 1, progressionStatMultiplier: () => 1, heroBaseStatMultiplier: () => 1,
  BATTLE_HP_SCALE: 1, Math
});
ctx.ease = { out: n => n, in: n => n, back: n => n, elastic: n => n };
vm.runInContext(scripts.get('hero-collections.js'), ctx);
const collections = vm.runInContext('HeroCollections', ctx);
vm.runInContext(scripts.get('hero-collections-screen.js'), ctx);
assert.equal(vm.runInContext('collectionReadyCount({ready:8,needed:5})', ctx), 5);
assert.match(vm.runInContext("collectionEarnedBonusText({stat:'hp'},4)", ctx), /All owned Heroes: \+0\.5% Max HP/);
assert.equal(typeof ctx.Screens.collections, 'function');
const physical = collections.catalogue.find(c => c.id === 'physical');
assert.deepEqual([...collections.members(physical)], Object.keys(heroes));
assert.equal(collections.needed({ members: () => ['A','B','C','D'] }, collections.tiers[3]), 3, 'small collections never require every member');
const battle = (key, units, extra = {}) => ({ _collectionBattleKey: key, result: { win: true }, units, ...extra });
const fighter = (id, extra = {}) => ({ id, team: 0, minion: false, collectionOwned: true, alive: true, ...extra });

const first = battle('one', [fighter('A', { alive: false }), fighter('B'), fighter('C', { collectionOwned: false }), fighter('D', { minion: true }), { id: 'E', team: 1, collectionOwned: true }]);
assert.equal(collections.recordVictory(first), true);
assert.equal(collections.recordVictory(first), false, 'same callback cannot count twice');
assert.equal(data.heroCollections.wins.A, 1, 'fallen deployed hero counts');
assert.equal(data.heroCollections.wins.B, 1);
assert.equal(data.heroCollections.wins.C || 0, 0, 'borrowed hero does not count');
assert.equal(data.heroCollections.wins.D || 0, 0, 'summon does not count');
assert.equal(data.heroCollections.wins.E || 0, 0, 'enemy copy does not count');
const early = collections.progress(physical, collections.tiers[0]);
assert.equal(early.filled, 2, 'partial victories move the progress meter');
assert.equal(early.total, 6, 'each required member has an individual cap');
assert.equal(collections.recordVictory(battle('one', [fighter('A')])), false, 'saved battle key cannot count twice');
assert.equal(collections.recordVictory(battle('sim', [fighter('A')], { offscreen: true })), false);
assert.equal(collections.recordVictory(battle('lost', [fighter('A')], { result: { win: false } })), false);

for (let n = 2; n <= 61; n++) collections.recordVictory(battle('win-' + n, [fighter('A'), fighter('B'), fighter('C'), fighter('D'), fighter('E')]));
assert.equal(collections.progress(physical, collections.tiers[3]).complete, true);
ctx.PLAYABLE_IDS.push('G');
ctx.HEROES.G = { name: 'G', role: 'Damage', base: { atk: 20, mag: 100 }, hidden: { range: 200 } };
owned.add('G');
assert.equal(collections.members(physical).includes('G'), false, 'new Hero is outside the collection');
const initialIchor = data.res.ichor || 0;
assert.equal(collections.claim('physical'), true);
assert.equal(collections.bonusFor('G').hp, 0, 'Tier 1 grants resources, not a hidden stat bonus');
assert.equal(collections.claim('physical'), true);
assert.equal(collections.bonusFor('G').hp, .0025, 'Tier 2 helps owned nonmembers');
assert.equal(collections.bonusFor('A').hp, .0075, 'Tier 2 gives members an extra bonus');
assert.equal(collections.claim('physical'), true);
assert.equal(collections.claim('physical'), true);
assert.equal(collections.claim('physical'), false, 'claims are one-time');
assert.ok(data.res.ichor > initialIchor);
assert.equal(data.profile.iconUnlocks.includes('collection-physical'), true);
assert.equal(data.heroCollections.receipts.physical[3].ichor, 1200000, 'exact claimed payout is remembered');
assert.equal(collections.bonusFor('A').hp, .0075, 'members receive shared and extra HP');
assert.equal(collections.bonusFor('A').atk, .0075, 'members receive shared and extra Attack');
assert.equal(collections.bonusFor('G').hp, .0025, 'nonmembers receive the shared HP bonus');
assert.equal(collections.bonusFor('G').atk, .0025, 'nonmembers receive the shared Attack bonus');
assert.equal(collections.bonusFor('Z').hp, 0, 'unowned Heroes receive no bonus');
const reloaded = JSON.parse(JSON.stringify(data));
ctx.Save.data = reloaded;
assert.equal(collections.earned(physical), 4, 'claimed tiers persist in save data');
assert.equal(collections.bonusFor('G').atk, .0025, 'shared bonus persists in save data');
assert.ok(writes > 0);
assert.equal(collections.earned(physical), 4, 'a future new member cannot revoke earned tiers');
const legacy = { mastery: 650, heroes: { A: {} }, profile: { iconUnlocks: [] }, res: { ichor: 123 } };
ctx.Save.data = legacy;
assert.equal(collections.state().wins.A || 0, 0, 'legacy save gets an empty participation ledger');
assert.equal(legacy.res.ichor, 123, 'migration leaves existing resources alone');
ctx.Save.data = reloaded;
const synthetic = Array.from({ length: 20 }, (_, i) => ({ id: `extra-${i}`, members: () => ['A'], stat: 'atk' }));
collections.catalogue.push(...synthetic);
synthetic.forEach(c => { reloaded.heroCollections.claimed[c.id] = 4; });
assert.equal(collections.bonusFor('A').atk, .03, 'overlap has a hard attack cap');
assert.equal(collections.bonusFor('G').atk, .03, 'shared bonuses obey the same cap');
collections.catalogue.splice(-synthetic.length);

// Exercise the actual Unit stat pipeline, including the PvP boundary.
vm.runInContext(scripts.get('battle/sim.js'), ctx);
const computeBase = vm.runInContext('Unit.prototype.computeBase', ctx);
const def = { base: { hp: 100, atk: 100, def: 10, mag: 100, mdef: 10, spd: 10, acc: 10, eva: 10 },
  growth: { hp: 0, atk: 0, def: 0, mag: 0, mdef: 0 }, role: 'Damage',
  hidden: { critDmg: 1.5, healPow: 1, shieldPow: 1, range: 100, aspd: 1, ms: 1, aggro: 1, crit: 0, cdr: 0, ccRes: 0, kbRes: 0, armorPen: 0, magPen: 0 } };
function stats(meta, collectionOwned, id = 'A', team = 0) {
  const unit = { def, id, team, level: 1, stars: 1, rarity: 1, rarityPlus: 1,
    mult: { hp: 1, atk: 1, mag: null, def: 1, mdef: null }, B: { meta }, collectionOwned,
    recompute() {} };
  computeBase.call(unit);
  return unit.baseStats;
}
const baseline = stats({}, false);
const boosted = stats({}, true);
assert.ok(Math.abs(boosted.hp / baseline.hp - 1.0075) < 1e-9);
assert.ok(Math.abs(boosted.atk / baseline.atk - 1.0075) < 1e-9);
assert.ok(Math.abs(stats({}, true, 'G').atk / baseline.atk - 1.0025) < 1e-9, 'nonmember gains shared Attack in combat');
assert.equal(stats({}, false, 'G').atk, baseline.atk, 'borrowed unit gains no shared bonus');
assert.equal(stats({}, true, 'G', 1).atk, baseline.atk, 'enemy copy gains no shared bonus');
assert.equal(stats({ arenaPvP: true }, true).atk, baseline.atk);
console.log('Hero Collections checks passed');
