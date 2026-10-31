const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

const bundle = fs.readFileSync('js/game.js', 'utf8');
const scripts = new Map(JSON.parse(bundle.split('var S=')[1].split(';\nfor(var i=')[0]));
const modes = scripts.get('meta/modes.js');
const arenaSource = modes.slice(modes.indexOf('const Arena = {'), modes.indexOf('/* ============================================================ TRIALS */'));
let day = 280, writes = 0, grants = [], spent = 0, passXp = 0;
const bot = { identity: 'bot:280:0', name: 'Bot', team: ['A'], rank: 1900, beaten: false };
const saved = { saved: true, savedDefense: { user_id: 'real-player', username: 'Rival' }, name: 'Rival', team: ['B'], rank: 1800, beaten: false };
const data = { mastery: 650, team: ['A', 'B'], res: { ichor: 5000, arenaCoin: 2000 }, arena: {
  rank: 2000, wins: 0, losses: 0, day, resetCycle: 10, teamVersion: 13,
  dailyWinsDay: day, dailyWins: 0, dailyClaimed: false, featuredClaimed: false,
  seasonBest: 2000, seasonWins: 0, seasonLosses: 0, opponents: [bot, saved]
} };
const ctx = vm.createContext({
  dayIndex: () => day, Date, Math,
  Save: {
    data, write: () => { writes++; },
    give: reward => { grants.push({ ...reward }); Object.entries(reward).forEach(([key, value]) => { data.res[key] = (data.res[key] || 0) + value; }); },
    spend: cost => { if (Object.entries(cost).some(([key, value]) => (data.res[key] || 0) < value)) return false; Object.entries(cost).forEach(([key, value]) => { data.res[key] -= value; if (key === 'ichor') spent += value; }); return true; },
    owns: id => ['A', 'B'].includes(id), hero: id => ({ level: id === 'A' ? 100 : 80 }),
    addTrinketCopy: (id, rank) => { data.lastTrinket = [id, rank]; writes++; return 'new'; }
  },
  Pass: { addXp: n => { passXp += n; } }, UI: { toast() {} },
  clamp: (n, lo, hi) => Math.max(lo, Math.min(hi, n)),
  masteryRewardValue: n => n, masteryRewardBundle: reward => reward,
  Screens: {}, HEROES: { A: { role: 'Tank' }, B: { role: 'Damage' } }, PLAYABLE_IDS: ['A', 'B'],
  TRINKETS: { alarm: { name: 'Alarm' }, wrench: { name: 'Wrench' }, thinkingcap: { name: 'Thinking Cap' }, machinemanual: { name: 'Machine Manual' }, researchmap: { name: 'Research Map' } },
  TRINKET_MAX_RANK: 20, CLASS_MAX_RANK: 50, SKILL_MAX_LEVEL: 800, BADGE_MAX_LVL: 20,
  SKILL_ORDER: ['W', 'G', 'B', 'P', 'R'],
  ENEMY_CLASS_POOLS: { Tank: ['Vanguard', 'Bastion'], Damage: ['Duelist', 'Striker'] },
  ENEMY_SUBCLASS_POOLS: { Tank: ['Sturdy', 'Heavy'], Damage: ['Sharp', 'Swift'] },
  enemySkillLevel: level => Math.round(level * .95),
  enemyTraining: (id, level) => ({ cls: id === 'A' ? 'Vanguard' : 'Duelist', subcls: id === 'A' ? 'Sturdy' : 'Sharp' }),
  rivalSpec: (id, level, options) => ({ id, level, ...options }),
  equipEnemyLoadout: (spec, depth, rng, options) => { spec.trinkets = options.trinketCount ? [{ id: 'alarm', rank: options.rank }] : []; return spec; },
  trinketsForOwner: () => [],
  currentWeek: () => 'test-week',
  STARTERS: ['A'], COLLAB_HERO_IDS: new Set(), obtainKey: () => 'Common',
  seeded: () => ({ i: lo => lo, f: () => .5, chance: () => false, pick: items => items[0], shuffle: items => items }),
  sum: values => values.reduce((a, b) => a + b, 0)
});
vm.runInContext(arenaSource, ctx);
const Arena = vm.runInContext('Arena', ctx);
const dailyBoards = [];
for (let rotation = 0; rotation < 3; rotation++) {
  data.arena.rotation = rotation;
  dailyBoards.push(...Arena.generate(day).filter(opp => !opp.saved).map(opp => opp.identity));
}
assert.equal(new Set(dailyBoards).size, 18, 'daily refresh draws from eighteen fixed bot identities');
data.arena.boardRank = 800;
const strongerBoard = Arena.generate(day);
const rankedBot = strongerBoard.find(opp => !opp.saved);
assert.ok(rankedBot.levels.every(level => level >= Arena.rankLevelCap(rankedBot.rank) * .8), 'established rivals train near their ladder level');
data.arena.boardRank = 2000;
const built = Arena.specs({ identity: 'bot:280:build', name: 'Builder', rank: 650, arch: 'wall', rookie: false, team: ['A', 'B'], levels: [400, 600] });
assert.equal(built[0].cls, 'Bastion', 'frontline archetype trains a defensive class');
assert.ok(built[0].classRank >= 20 && built[1].classRank >= 30, 'class ranks keep up with high level rivals');
assert.equal(built[0].trinkets[0].id, 'wrench');
assert.equal(built[1].trinkets[0].id, 'researchmap');
assert.ok(built[1].skillLevels.W > built[1].skillLevels.G, 'a damage build invests most in its signature skill');
assert.equal(Arena.specs({ identity: 'bot:280:rookie', name: 'Rookie', rank: 1950, arch: 'rookie', rookie: true, team: ['A'], levels: [20] })[0].trinkets.length, 0, 'new rivals do not arrive with endgame gear');
data.arena.rotation = 0;
Arena.generate = currentDay => [{ identity: `bot:${currentDay}:${data.arena.rotation || 0}`, name: 'Rotating Bot', team: ['A'], rank: 1900 }];
assert.equal(Arena.league(250).name, 'MASTER');
assert.equal(Arena.league(800).name, 'GOLD');
assert.equal(Arena.scout({ team: ['A', 'B'], levels: [120, 120] }).estimate, 'Tougher', 'scouting estimate uses deployed team levels');

assert.equal(Arena.preview(bot).mode, 'ranked');
const reward = Arena.preview(bot).reward;
assert.ok(reward.ichor > 0);
assert.equal(reward.arenaCoin, Arena.rewardFor(bot).arenaCoin + 18, 'featured purse is visible before battle');
assert.ok(Arena.rewardFor({ rank: 1700 }).ichor > Arena.rewardFor({ rank: 2200 }).ichor, 'harder rivals pay more');
assert.equal(Arena.resolve(bot, true, 'ranked', reward, 'bot-win', day, {}, ['A']).firstClear, true);
assert.equal(data.arena.seasonRankedHeroes[0], 'A', 'ranked wins record actual attackers for Fresh Faces');
assert.equal(grants[0].arenaCoin, reward.arenaCoin, 'featured purse is granted once in the shown reward');
assert.equal(data.arena.wins, 1);
assert.equal(data.arena.dailyWins, 1);
assert.equal(Arena.preview(bot).mode, 'practice');
const rank = data.arena.rank, grantCount = grants.length;
assert.equal(Arena.resolve(bot, true, 'ranked', reward).firstClear, false, 'duplicate callback cannot pay again');
assert.equal(Arena.resolve(bot, false, 'practice').ranked, false, 'practice loss has no rating penalty');
assert.equal(data.arena.rank, rank);
assert.equal(grants.length, grantCount);

const savedReward = Arena.preview(saved).reward;
assert.equal(Arena.resolve(saved, true, 'ranked', savedReward).firstClear, true, 'saved defense uses ranked resolver');
assert.equal(data.arena.wins, 2);
assert.equal(data.arena.dailyWins, 2);
assert.equal(Arena.preview({ ...saved, savedDefense: { user_id: 'real-player', username: 'Renamed' } }).mode, 'practice', 'saved defense identity survives profile changes');

assert.equal(Arena.exhibitionCheck('fresh', ['A', 'B']).ok, false, 'a ranked winner no longer qualifies as a fresh face');
assert.equal(Arena.exhibitionCheck('roles', ['A', 'B']).ok, false, 'role exhibition validates the selected team');
assert.equal(Arena.exhibitionPreview('roles').claimed, false);
const exhibitionRewardCount = grants.length;
assert.equal(Arena.resolveExhibition('roles', true, 'exhibition-1', data.arena.resetCycle), true);
assert.equal(grants.length, exhibitionRewardCount + 1);
assert.equal(Arena.resolveExhibition('roles', true, 'exhibition-1', data.arena.resetCycle), false, 'repeat callbacks do not pay exhibitions twice');
assert.equal(Arena.exhibitionPreview('roles').claimed, true);
assert.equal(Arena.resolveExhibition('fresh', false, 'exhibition-loss', data.arena.resetCycle), false, 'an exhibition loss pays nothing');

const vault = Arena.coinStore().find(offer => offer.id === 'vault');
assert.ok(vault && vault.gain.modPower > 0, 'veteran exchange has a long-term mod purchase');
assert.equal(Arena.buyCoinOffer('vault').ok, true);
assert.equal(Arena.buyCoinOffer('vault').ok, false, 'season vault is single claim');
assert.equal(Arena.buyCoinOffer('trinket').ok, true);
assert.ok(data.lastTrinket && data.lastTrinket[1] === 1, 'rotating trinket grants a physical copy');
assert.equal(Arena.buyCoinOffer('trinket').ok, false, 'weekly trinket is single claim');

const loser = { identity: 'bot:280:loss', name: 'Loss', team: ['A'], rank: 1700 };
const lossGrants = grants.length, lossesBefore = data.arena.losses;
Arena.resolve(loser, false, 'ranked', {}, 'loss-1');
assert.equal(data.arena.losses, lossesBefore + 1);
assert.equal(grants.length, lossGrants + 1);
assert.equal(Arena.resolve(loser, false, 'ranked', {}, 'loss-1').duplicate, true);
assert.equal(data.arena.losses, lossesBefore + 1, 'repeated result callback cannot charge rating twice');
Arena.resolve(loser, false, 'ranked', {}, 'loss-2');
assert.equal(grants.length, lossGrants + 1, 'same rival cannot farm loss consolation');

const free = Arena.refresh();
assert.equal(free.free, true);
assert.equal(spent, 0);
assert.equal(Arena.refresh().free, false);
assert.equal(spent, 1500);
assert.equal(Arena.preview(bot).mode, 'practice', 'refresh does not restore an old reward');
Arena.refresh();
assert.equal(data.arena.rotation, 0, 'refresh cycles through a finite daily pool');
assert.ok(writes > 0 && passXp > 0);

const crossing = { identity: 'bot:280:crossing', name: 'Crossing', team: ['A'], rank: 1700 };
const crossingPreview = Arena.preview(crossing);
day = 281;
assert.equal(Arena.preview({ identity: 'bot:280:stale', name: 'Stale', team: ['A'], rank: 1700 }).mode, 'practice', 'yesterday’s bot is no longer ranked');
Arena.resolve(crossing, true, crossingPreview.mode, crossingPreview.reward, 'cross-1', crossingPreview.periodDay);
assert.equal(data.arena.dailyWins, 0, 'yesterday’s match does not fill today’s contract');
assert.equal(data.arena.rewardLedger['280|bot:280:crossing'], true);

// Existing version-12 boards pick up the stronger generated builds immediately,
// while their already claimed first clears remain claimed.
data.arena = { ...data.arena, day, teamVersion: 12, boardRank: 800, rotation: 0,
  opponents: [{ identity: 'bot:281:0', name: 'Old Build', team: ['A'], rank: 800 }],
  rewardLedger: { ...data.arena.rewardLedger, '281|bot:281:0': true } };
const upgradedBoard = Arena.today();
assert.equal(upgradedBoard.teamVersion, 13);
assert.equal(upgradedBoard.opponents[0].name, 'Rotating Bot');
assert.equal(upgradedBoard.opponents[0].beaten, true);

// A legacy displayed first clear is migrated before a versioned board rebuild.
const legacy = { rank: 1700, wins: 4, losses: 1, day, resetCycle: 10, teamVersion: 11,
  dailyWinsDay: day, opponents: [{ name: 'Old', team: ['A'], rank: 1600, beaten: true }] };
data.arena = legacy;
assert.equal(Arena.today().opponents[0].name, 'Old', 'current legacy board is preserved');
assert.equal(Arena.eligible(legacy.opponents[0]), false);

// End-of-season rewards are based on best position and granted only once.
data.arena = { rank: 420, wins: 30, losses: 5, day, resetCycle: 10, teamVersion: 13,
  dailyWinsDay: day, opponents: [], rewardLedger: {}, seasonBest: 250, seasonWins: 12, seasonLosses: 3 };
day = 308;
const before = grants.length;
Arena.today();
assert.equal(grants.length, before + 1);
assert.equal(data.arena.seasonHistory[0].league, 'MASTER');
assert.equal(data.arena.seasonHistory[0].best, 250);
assert.equal(data.arena.seasonHistory[0].exhibitions, 0);
assert.equal(data.arena.rank, 686, 'partial reset retains meaningful placement');
Arena.today();
assert.equal(grants.length, before + 1, 'season payout is not repeated');

const render = scripts.get('battle/render.js');
const reportSource = render.slice(render.indexOf('function arenaResultReport('), render.indexOf('\nconst BattleScreen ='));
const reportCtx = vm.createContext({ Save: { data: { trinketInv: {} } }, TRINKETS: { sword: { name: 'Sword' } }, BADGES: { crest: { name: 'Crest' } }, STATUS: { stun: { name: 'Stun' } }, Math });
vm.runInContext(reportSource, reportCtx);
const report = vm.runInContext('arenaResultReport', reportCtx)({
  units: [
    { id: 'A', name: 'A', team: 0, level: 10, rarity: 2, stars: 2, dmgDone: 90, healDone: 10, shieldDone: 30, controlLanded: 1, controlEffects: { stun: 1 }, kills: 1, alive: true, trinkets: [{ id: 'sword', rank: 2 }], badges: ['crest'], mods: [] },
    { id: 'B', name: 'B', team: 1, level: 11, rarity: 2, stars: 2, dmgDone: 60, healDone: 0, shieldDone: 0, controlLanded: 0, kills: 0, alive: false, trinkets: [], badges: [], mods: [] }
  ], eliminationOrder: [{ team: 1, name: 'B', by: 'A' }]
});
assert.equal(report.teams[0][0].shielding, 30);
assert.equal(report.teams[0][0].controlEffects[0], 'Stun ×1');
assert.equal(report.teams[0][0].trinkets[0], 'Sword R2');
assert.equal(report.teams[1][0].damage, 60);
assert.equal(report.eliminations[0].by, 'A');
console.log('Arena ranked loop checks passed');
