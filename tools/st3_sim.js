// Balance + data harness for Chapter 3: node tools/st3_sim.js [runs] [nodeId] [mode]
const fs = require('fs'), vm = require('vm'), path = require('path');
const dir = path.join(__dirname, '..', 'js', 'story');
const files = ['story-engine.js', 'ch2-engine.js', 'story-nodes.js', 'ch2-toons.js', 'ch2-nodes.js', 'ch3-toons.js', 'ch3-engine.js', 'ch3-nodes.js'];
const stub = 'const ST_STORY = {}; const ST_STATUS_ICON = {}; const ItemSheet = { url: id => id };\n';
const src = stub + files.map(f => fs.readFileSync(path.join(dir, f), 'utf8')).join('\n;\n')
  + '\n' + fs.readFileSync(path.join(dir, 'ch3-script.js'), 'utf8')
  + '\n' + fs.readFileSync(path.join(dir, 'ch3-expansion.js'), 'utf8')
  + '\n;({ StoryBattle, ST_TOONS, ST_HANDLERS, ST_ENEMIES, ST_STORY, ST_BG, ST3_NODES, ST3_ITEMS_FOR, ST3_HARD, ST3_TAPES, ST3_IMAGES, ST3_HORROR, ST3_SQUADS, ST3_IDS, ST3_DYLE, st3Hazard, stChar, stHandlerStats, ST_CH3_START_LV, ST_ITEMS });';
const X = vm.runInThisContext(src);
const runs = +process.argv[2] || 20, only = process.argv[3], modes = process.argv[4] ? [process.argv[4]] : ['easy', 'hard'];

/* ---------- data checks ---------- */
let bad = 0; const err = m => { bad++; console.log('DATA ERROR:', m); };
const scenes = new Set();
X.ST3_NODES.forEach(n => {
  if (n.type === 'story') { scenes.add(n.scene); if (!X.ST_STORY[n.scene]) err('missing scene ' + n.scene); }
  else { ['easy', 'hard'].forEach(m => n[m].forEach(w => w.forEach(([k]) => { if (!X.ST_ENEMIES[k]) err(n.id + ' unknown foe ' + k); }))); if (!(n.bg in X.ST_BG)) err(n.id + ' unknown bg ' + n.bg); }
  [].concat(n.join || [], n.leave || [], n.only || []).forEach(id => { if (!X.stChar(id)) err('unknown id ' + id); });
});
Object.keys(X.ST_STORY).filter(k => k.startsWith('c3')).forEach(k => { if (!scenes.has(k)) err('scene not in nodes ' + k); });
X.ST3_TAPES.forEach(t => { if (!scenes.has(t.unlock)) err('tape unlock ' + t.unlock); });
const speakers = new Set();
Object.keys(X.ST_STORY).filter(k => k.startsWith('c3')).forEach(k => {
  const sc = X.ST_STORY[k];
  sc.script.split('\n').map(l => l.trim()).forEach((line, i) => {
    let m;
    if (line[0] === '@') {
      const [cmd, ...rest] = line.slice(1).split(' '), arg = rest.join(' ');
      if (!['bg', 'music', 'stop', 'enter', 'move', 'exit', 'exitall', 'fx', 'sfx', 'card', 'wait', 'choice', 'image', 'horror', 'imgoff'].includes(cmd)) err(`${k}:${i} bad cmd ${cmd}`);
      if (cmd === 'bg' && !(arg in X.ST_BG)) err(`${k}:${i} bg ${arg}`);
      if (cmd === 'image' && !X.ST3_IMAGES[arg]) err(`${k}:${i} image ${arg}`);
      if (cmd === 'horror' && !X.ST3_HORROR[arg]) err(`${k}:${i} horror ${arg}`);
      if (cmd === 'enter') speakers.add(rest[0]);
    } else if (line[0] === '>') { /* narration */ } else if ((m = /^(?:[12]>\s?)?([A-Za-z]+)(~)?\s*(?:\[([^\]]+)\])?\s*(?:\(([^)]+)\))?\s*:\s*(.*)$/.exec(line))) {
      if (!line.match(/^[12]>/) || true) { if (!m[2]) speakers.add(m[1]); }
      if (m[3] && !['!', '?', 'anger', 'sweat', 'note', 'heart', 'idea', 'dots', 'tears', 'sparkle', 'shock', 'blush'].includes(m[3])) err(`${k}:${i} emote ${m[3]}`);
    } else if (!/^[12]>/.test(line) && line) err(`${k}:${i} unparsed: ${line.slice(0, 50)}`);
  });
});
console.log('speakers:', [...speakers].join(' '));
console.log(bad ? `${bad} data errors` : 'data OK');
if (process.argv[2] === 'data') process.exit(0);

/* ---------- battle sim ---------- */
const joined = i => { const s = new Set(); X.ST3_NODES.slice(0, i + 1).forEach(n => { (n.join || []).forEach(x => s.add(x)); (n.leave || []).forEach(x => s.delete(x)); }); return s; };
const prefs = { handlers: ['Devan', 'Veronica', 'Shannon', 'Sam', 'Austin'], residents: ['Pebble', 'Brusha', 'Vee', 'Sprout', 'Astro', 'Rodger', 'Scraps', 'Toodles'], seasonals: ['Gourdy', 'Soulvester', 'Bobette', 'Cocoa', 'Eclipse', 'Bassie'] };
const lineup = (sq, i, n) => {
  const j = joined(i), mine = n.squad === sq;
  let pool = prefs[sq].concat(mine ? n.guest || [] : []).filter(id => j.has(id));
  if (n.only && mine) pool = n.only.filter(id => j.has(id));
  const out = []; (mine ? n.require || [] : []).forEach(id => { if (pool.includes(id)) out.push(id); });
  pool.forEach(id => { if (out.length < (n.only && mine ? n.only.length : 4) && !out.includes(id)) out.push(id); });
  return out;
};
X.ST3_NODES.forEach((n, i) => {
  if (n.type !== 'battle' || (only && only !== n.id)) return;
  const squads = n.relay || [n.squad], teams = squads.map(q => lineup(q, i, n)), team = [].concat(...teams), seen = new Set();
  modes.forEach(mode => {
    const waves = n[mode], lvF = n.lv + (mode === 'hard' ? X.ST3_HARD.lv : 0);
    const t = (n.tune && n.tune[mode]) || {}, h = mode === 'hard' ? X.ST3_HARD.mult : {};
    const mm = { hp: (h.hp || 1) * (t.hp || 1), atk: (h.atk || 1) * (t.atk || 1), def: (h.def || 1) };
    let wins = 0, tTot = 0, hpTot = 0, deaths = 0, lethals = 0;
    for (let r = 0; r < runs; r++) {
      const carry = {}; let ok = true, turns = 0, hpLeft = 0, items = Object.assign({}, X.ST3_ITEMS_FOR[mode]);
      for (let w = 0; w < waves.length && ok; w++) {
        const foes = []; waves[w].forEach(([k, c, x]) => { for (let q = 0; q < c; q++) foes.push([k, lvF, Object.assign({}, x || {}, { mult: mm })]); });
        const wteam = n.relay ? teams[w] : teams[0], sqId = squads[n.relay ? w : 0];
        const party = wteam.map(id => ({ sq: sqId, tm: {}, rank: Math.min(3, Math.floor(X.ST3_NODES.slice(0, i).filter(q => q.type === 'battle').length / 3)), id, lv: Math.max(X.ST_CH3_START_LV, n.lv), row: ['Tisha', 'Dyle', 'Scraps', 'Brightney', 'Coal', 'Rudie', 'Shelly', 'Devan', 'Pebble', 'Shannon', 'Gourdy', 'Toodles', 'Eclipse', 'Soulvester', 'Brusha'].includes(id) ? 'front' : 'back', hp: carry[id] ? (carry[id].hp === 0 && X.stChar(id).kind === 'toon' ? Math.round(X.stHandlerStats(id, Math.max(40, n.lv)).hp * .35) : carry[id].hp) : null, bond: carry[id] ? carry[id].bond : 0 }));
        const B = new X.StoryBattle({ party, foes, items, tier: n.tier || 0, seed: (r + 1) * 9973 + w * 31, unlocked: () => true });
        B.party().forEach(u => { const c = carry[u.key]; if (c) u.fp = Math.min(u.max.fp, c.fp); });
        const origKill = B.kill.bind(B);
        let g = 0, hazardTurns = 0;
        while (!B.over && g++ < 1200) { const nx = B.next(); if (nx.skip || B.over) continue; if (n.hazard) X.st3Hazard(B, n.hazard, ++hazardTurns); if (B.over) continue; if (nx.actor.side === 'p') B.act(nx.actor, B.autoAction(nx.actor)); else { const ev = B.enemyAct(nx.actor); lethals += ev.filter(e => e.t === 'lethal').length; } }
        deaths += B.party().filter(u => !u.alive).length; turns += B.turn; items = B.items;
        if (!B.win) { ok = false; break; }
        B.party().forEach(u => { carry[u.key] = { hp: u.alive ? Math.min(u.max.hp, Math.round(u.hp + u.max.hp * .25)) : 0, fp: Math.min(u.max.fp, u.fp + 6), bond: u.bond }; });
        hpLeft = B.party().reduce((a, u) => a + u.hp, 0) / B.party().reduce((a, u) => a + u.max.hp, 0);
      }
      if (ok) { wins++; hpTot += hpLeft; tTot += turns; }
    }
    console.log(`${n.id.padEnd(4)} ${n.name.padEnd(18)} ${mode.padEnd(5)} lv${String(lvF).padEnd(3)} ${team.join('/').padEnd(30)} win ${(wins / runs * 100).toFixed(0).padStart(3)}%  turns ${(wins ? tTot / wins : 0).toFixed(0).padStart(3)}  hpLeft ${(wins ? hpTot / wins * 100 : 0).toFixed(0)}%  KOs/run ${(deaths / runs).toFixed(1)}  lethal/run ${(lethals / runs).toFixed(1)}`);
  });
});
