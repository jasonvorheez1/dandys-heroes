// Balance harness for the endgame (Jevil x Spamton NEO): node tools/flowery/endgame_sim.js [runs]
// Autoplay for the party; quick-time events resolved at random with skill QTE (0..1): perfect with QTE, else good half the time.
const fs = require('fs'), vm = require('vm'), path = require('path');
const dir = path.join(__dirname, '..', '..', 'js', 'story');
const files = ['story-engine.js', 'ch2-engine.js', 'story-nodes.js', 'ch2-toons.js', 'ch2-nodes.js', 'ch3-toons.js', 'ch3-engine.js', 'ch3-nodes.js'];
const stub = 'const ST_STORY = {}; const ST_STATUS_ICON = {}; const ItemSheet = { url: id => id }; var window = globalThis;\n'
  + 'const StoryBattleUI = { art() {}, makeUnit() {}, refreshUnit() {}, play() {}, closeBattle() {}, say() {} };\n';
const src = stub + files.map(f => fs.readFileSync(path.join(dir, f), 'utf8')).join('\n;\n')
  + '\n' + fs.readFileSync(path.join(dir, 'ch3-expansion.js'), 'utf8')
  + '\n;' + fs.readFileSync(path.join(dir, '..', 'flowery-storyboss.js'), 'utf8')
  + '\n;' + fs.readFileSync(path.join(dir, '..', 'flowery-endgame.js'), 'utf8')
  + '\n;({ StoryBattle, FlEndgame: window.FlEndgame });';
const X = vm.runInThisContext(src);
const runs = +process.argv[2] || 150;
const T = X.FlEndgame.TUNE, QM = X.FlEndgame.QTE_MULT;
const mult = { hp: +(process.env.HP || T.mult.hp), atk: +(process.env.ATK || T.mult.atk), def: +(process.env.DEF || T.mult.def) };
const teams = { trio: ['Scraps', 'Ginger', 'Yatta', 'Ralsei'], tank: ['Pebble', 'Ralsei', 'Scraps', 'Sprout'], mixed: ['Gourdy', 'Ginger', 'Yatta', 'Ralsei'] };
const skills = (process.env.QTE || '0,.5,.8').split(',').map(Number);
for (const [name, ids] of Object.entries(teams)) for (const q of skills) {
  let wins = 0, turns = 0, left = 0;
  for (let r = 0; r < runs; r++) {
    const B = new X.StoryBattle({ party: ids.map(id => ({ id, lv: T.lv, rank: 3, tm: {}, row: 'front', bond: 0 })),
      foes: [['egJevil', T.flv, { boss: true, mult }], ['egSneo', T.flv, { boss: true, mult }]],
      items: { bandage: 3, medkit: 2, pop: 3, jumper: 2, barrier: 2, jawbreaker: 2, tonic: 2 }, tier: 5, seed: (r + 1) * 7919, unlocked: () => true });
    B.eg = true;
    let g = 0;
    while (!B.over && g++ < 2000) {
      const nx = B.next(); if (nx.skip || B.over) continue;
      if (nx.actor.side === 'p') { B.act(nx.actor, B.autoAction(nx.actor)); continue; }
      const u = nx.actor, plan = B.egPick(u), firing = !!u.tele || !plan.tele;
      if (!u.tele) u._plan = plan;
      if (firing && plan.qte) { const res = Math.random() < q ? 'perfect' : (Math.random() < .5 && plan.qte.type !== 'fake') ? 'good' : 'fail'; B.qte = { res, mult: plan.qte.type === 'pick' && res === 'perfect' ? 0 : QM[res] }; } else B.qte = null;
      B.egAct(u);
    }
    if (B.win) { wins++; turns += B.turn; }
    left += B.foes().filter(f => f.key === 'egJevil' || f.key === 'egSneo').reduce((a, f) => a + (f.alive ? f.hp / f.max.hp : 0), 0) / 2;
  }
  console.log(`${name.padEnd(6)} QTE ${String(q).padEnd(4)} win ${(wins / runs * 100).toFixed(0).padStart(3)}%  turns(win) ${(wins ? turns / wins : 0).toFixed(0).padStart(3)}  boss HP left ${(left / runs * 100).toFixed(0)}%`);
}
