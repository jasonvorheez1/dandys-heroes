// Balance harness for Chapter 2: node tools/st2_sim.js [runs] [nodeId] [mode]
const fs = require('fs'), vm = require('vm'), path = require('path');
const dir = path.join(__dirname, '..', 'js', 'story');
const src = ['story-engine.js', 'ch2-engine.js', 'story-nodes.js', 'ch2-toons.js', 'ch2-nodes.js'].map(f => fs.readFileSync(path.join(dir, f), 'utf8')).join('\n;\n')
  + '\n;({ StoryBattle, stSimulate, ST_TOONS, ST_ENEMIES, ST2_NODES, ST2_ITEMS_FOR, ST2_HARD, stChar, stHandlerStats, ST_TOON_START_LV, ST_ITEMS });';
const X = vm.runInThisContext(src);
const runs = +process.argv[2] || 30, only = process.argv[3], modes = process.argv[4] ? [process.argv[4]] : ['easy', 'hard'];
const SKILLS_BY_SCENE = {}; // all skills open for the late game; early nodes filter by scene order below
const sceneOrder = X.ST2_NODES.map(n => n.scene).filter(Boolean);
const rosterAt = i => { const s = new Set(); X.ST2_NODES.slice(0, i + 1).forEach(n => (n.join || []).forEach(x => s.add(x))); return [...s]; };
const pickTeam = (n, i) => {
  const r = rosterAt(i), team = (n.require || []).slice();
  const slots = [['Coal', 'Goob', 'Brightney', 'Tisha'], ['Dyle', 'Scraps', 'Vee', 'Rudie', 'Rodger'], ['Vee', 'Scraps', 'Dyle', 'Rodger', 'Shelly'], ['Sprout', 'Cosmo', 'Astro', 'Shelly']];
  slots.forEach(list => { if (team.length >= 4) return; const pick = list.find(id => r.includes(id) && !team.includes(id)); if (pick) team.push(pick); });
  r.forEach(id => { if (team.length < 4 && !team.includes(id)) team.push(id); });
  return team.slice(0, 4);
};
let idx = -1;
X.ST2_NODES.forEach((n, i) => {
  if (n.type !== 'battle') return;
  if (only && only !== n.id) return;
  const seenScenes = new Set(X.ST2_NODES.slice(0, i).map(m => m.scene).filter(Boolean));
  const team = pickTeam(n, i);
  modes.forEach(mode => {
    const waves = n[mode], lvF = n.lv + (mode === 'hard' ? X.ST2_HARD.lv : 0);
    const mult = Object.assign({ hp: 1, atk: 1, def: 1 }, mode === 'hard' ? X.ST2_HARD.mult : {}, (n.tune && n.tune[mode]) || {});
    const mm = { hp: ((mode === 'hard' ? X.ST2_HARD.mult.hp : 1) * ((n.tune && n.tune[mode] && n.tune[mode].hp) || 1)), atk: ((mode === 'hard' ? X.ST2_HARD.mult.atk : 1) * ((n.tune && n.tune[mode] && n.tune[mode].atk) || 1)), def: (mode === 'hard' ? X.ST2_HARD.mult.def : 1) };
    let wins = 0, tTot = 0, hpTot = 0, lost = 0;
    for (let r = 0; r < runs; r++) {
      const carry = {}; let ok = true, turns = 0, hpLeft = 0;
      let items = Object.assign({}, X.ST2_ITEMS_FOR[mode]);
      for (let w = 0; w < waves.length && ok; w++) {
        const foes = []; waves[w].forEach(([k, c, x]) => { for (let q = 0; q < c; q++) foes.push([k, lvF, Object.assign({}, x || {}, { mult: mm })]); });
        const party = team.map(id => ({ id, lv: Math.max(X.ST_TOON_START_LV, n.lv), row: ['Tisha', 'Goob', 'Dyle', 'Scraps', 'Brightney', 'Coal', 'Rudie', 'Shelly'].includes(id) ? 'front' : 'back', hp: carry[id] ? carry[id].hp : null, bond: carry[id] ? carry[id].bond : 0 }));
        const B = new X.StoryBattle({ party, foes, items, seed: (r + 1) * 9973 + w * 31, unlocked: sk => sk.unlock === 'badge' || seenScenes.has(sk.unlock) });
        B.party().forEach(u => { const c = carry[u.key]; if (c) u.fp = Math.min(u.max.fp, c.fp); });
        let g = 0;
        while (!B.over && g++ < 900) { const nx = B.next(); if (nx.skip || B.over) continue; if (nx.actor.side === 'p') B.act(nx.actor, B.autoAction(nx.actor)); else B.enemyAct(nx.actor); }
        turns += B.turn; items = B.items;
        if (!B.win) { ok = false; break; }
        B.party().forEach(u => { carry[u.key] = { hp: u.alive ? Math.min(u.max.hp, Math.round(u.hp + u.max.hp * .25)) : 0, fp: Math.min(u.max.fp, u.fp + 6), bond: u.bond }; });
        hpLeft = B.party().reduce((a, u) => a + u.hp, 0) / B.party().reduce((a, u) => a + u.max.hp, 0);
      }
      if (ok) { wins++; hpTot += hpLeft; tTot += turns; }
    }
    console.log(`${n.id.padEnd(4)} ${n.name.padEnd(18)} ${mode.padEnd(5)} lv${String(lvF).padEnd(3)} team ${team.join('/').padEnd(34)} win ${(wins / runs * 100).toFixed(0).padStart(3)}%  turns ${(wins ? tTot / wins : 0).toFixed(0).padStart(3)}  hpLeft ${(wins ? hpTot / wins * 100 : 0).toFixed(0)}%`);
  });
});
