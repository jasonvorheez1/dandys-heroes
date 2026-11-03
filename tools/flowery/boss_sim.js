// Balance harness for the Flower Kingdom boss on the Main Story battle: node tools/flowery/boss_sim.js [runs]
// Same engine files as tools/st3_sim.js, plus js/flowery-storyboss.js. Autoplay (B.autoAction) for the party.
const fs = require('fs'), vm = require('vm'), path = require('path');
const dir = path.join(__dirname, '..', '..', 'js', 'story');
const files = ['story-engine.js', 'ch2-engine.js', 'story-nodes.js', 'ch2-toons.js', 'ch2-nodes.js', 'ch3-toons.js', 'ch3-engine.js', 'ch3-nodes.js'];
const stub = 'const ST_STORY = {}; const ST_STATUS_ICON = {}; const ItemSheet = { url: id => id }; var window = globalThis;\n'
  + 'const StoryBattleUI = { art() {}, makeUnit() {}, refreshUnit() {}, play() {}, closeBattle() {} };\n';
const src = stub + files.map(f => fs.readFileSync(path.join(dir, f), 'utf8')).join('\n;\n')
  + '\n' + fs.readFileSync(path.join(dir, 'ch3-expansion.js'), 'utf8')
  + '\n;' + fs.readFileSync(path.join(dir, '..', 'flowery-storyboss.js'), 'utf8')
  + '\n;({ StoryBattle, ST_ENEMIES, FlStoryBoss: window.FlStoryBoss });';
const X = vm.runInThisContext(src);
const runs = +process.argv[2] || 200;
if (process.env.NO) X.ST_ENEMIES.flFloweryHard.moves = X.ST_ENEMIES.flFloweryHard.moves.filter(m => !process.env.NO.split(',').includes(m.kind));
const CFG = {
  easy: { plv: 50, flv: 48, rank: 2, bond: 20, foe: 'flFlowery', items: { bandage: 3, medkit: 2, pop: 2, jumper: 1, barrier: 2, jawbreaker: 1 } },
  hard: { plv: 56, flv: +(process.env.FLV || X.FlStoryBoss.TUNE.hard.flv), rank: 3, bond: 0, foe: 'flFloweryHard', items: { bandage: 2, medkit: 1, pop: 1, jumper: 1, barrier: 3, jawbreaker: 1 } }
};
const only = process.argv[3];
Object.entries(CFG).forEach(([mode, c]) => {
  if (only && only !== mode) return;
  const T = X.FlStoryBoss.TUNE[mode];
  const src = {}; let partyDmg = 0, edits = 0;
  let wins = 0, turns = 0, bar = 0, hpLeft = 0, kos = 0, lethal = 0, steals = 0;
  for (let r = 0; r < runs; r++) {
    const B = new X.StoryBattle({ party: ['Scraps', 'Ginger', 'Yatta'].map(id => ({ id, lv: c.plv, rank: c.rank, tm: {}, row: 'front', bond: c.bond })),
      foes: [[c.foe, c.flv, { boss: true, mult: { hp: +(process.env.HP || T.mult.hp), atk: +(process.env.ATK || T.mult.atk), def: +(process.env.DEF || T.mult.def), spd: +(process.env.SPD || 1) } }]], items: Object.assign({}, c.items), tier: 5, seed: (r + 1) * 9973, unlocked: () => true });
    B.fl = mode; B.flReloaded = {};
    const H = { hazardTurns: 0 };
    let g = 0;
    while (!B.over && g++ < 1500) {
      const nx = B.next(); if (nx.skip || B.over) continue;
      X.FlStoryBoss.UI.storyHazard.call(H, B); if (B.over) continue;
      if (nx.actor.side === 'p') { const ev = B.act(nx.actor, B.autoAction(nx.actor)); if (process.env.DEBUG) ev.forEach(e => { if (e.t === 'dmg') partyDmg += e.amount; }); }
      else { const ev = B.enemyAct(nx.actor); lethal += ev.filter(e => e.t === 'lethal').length; steals += ev.filter(e => e.k === 'steal').length;
        if (process.env.DEBUG) ev.forEach(e => { if (e.t === 'dmg') { const k = nx.actor.name + ':' + (ev.find(x => x.t === 'act') || {}).name; src[k] = (src[k] || 0) + e.amount; } }); }
    }
    const f = B.foes()[0];
    if (B.win) { wins++; turns += B.turn; }
    bar += f.flBar || 1; hpLeft += f.alive ? f.hp / f.max.hp : 0; kos += B.party().filter(u => !u.alive).length;
  }
  if (process.env.DEBUG) { console.log('party dmg/run', Math.round(partyDmg / runs)); Object.entries(src).sort((a, b) => b[1] - a[1]).slice(0, 12).forEach(([k, v]) => console.log('  ', k.padEnd(40), Math.round(v / runs))); }
  console.log(`${mode.padEnd(5)} win ${(wins / runs * 100).toFixed(0).padStart(3)}%  turns(win) ${(wins ? turns / wins : 0).toFixed(0)}  bar reached ${(bar / runs).toFixed(2)}  boss HP left ${(hpLeft / runs * 100).toFixed(0)}%  KOs/run ${(kos / runs).toFixed(1)}  lethal/run ${(lethal / runs).toFixed(2)}  steals/run ${(steals / runs).toFixed(1)}`);
});
