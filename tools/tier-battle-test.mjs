const port = Number(process.env.TIER_CDP_PORT || 9245);
const start = Number(process.env.TIER_BATCH_START || 0);
const size = Number(process.env.TIER_BATCH_SIZE || 8);
const trials = Number(process.env.TIER_TRIALS || 3);
const timeLimit = Number(process.env.TIER_TIME_LIMIT || 45000);

const tabs = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json();
const tab = tabs.find(item => item.type === 'page');
if (!tab) throw new Error('No CDP page found');

const ws = new WebSocket(tab.webSocketDebuggerUrl);
let sequence = 0;
const pending = new Map();
ws.onmessage = event => {
  const message = JSON.parse(event.data);
  if (message.id && pending.has(message.id)) {
    pending.get(message.id)(message);
    pending.delete(message.id);
  }
};

const command = (method, params = {}) => new Promise((resolve, reject) => {
  const id = ++sequence;
  pending.set(id, message => message.error ? reject(new Error(JSON.stringify(message.error))) : resolve(message));
  ws.send(JSON.stringify({ id, method, params }));
});

await new Promise((resolve, reject) => { ws.onopen = resolve; ws.onerror = reject; });
await command('Page.enable');
await command('Runtime.enable');
await command('Page.navigate', { url: 'http://localhost:8081/' });
await new Promise(resolve => setTimeout(resolve, 6500));

const expression = String.raw`(()=>{
  const ids = PLAYABLE_IDS.slice(${start}, ${start + size});
  const fallback = ['Coal','Cocoa','Tisha','Gigi','Brusha','Delilah','Scraps','Ginger','Eclipse'];
  const enemyFallback = ['Dandy','Cocoa','Eclipse','Coal','Gourdy','Dyle','Sprout','Delilah','Bobette','Brusha'];
  const anchors = {
    Tank: ['Ginger','Brusha','Delilah','Scraps'],
    Support: ['Brusha','Scraps','Eclipse','Delilah'],
    Damage: ['Brusha','Scraps','Eclipse','Coal'],
    Control: ['Dyle','Delilah','Sprout','Brusha'],
    'All-Rounder': ['Brusha','Cocoa','Delilah','Scraps']
  };
  const role = id => HEROES[id].role || 'All-Rounder';
  const makeTeam = (id, preferred) => [id, ...[...preferred, ...fallback, ...PLAYABLE_IDS]
    .filter(x => x !== id)
    .filter((x, i, list) => list.indexOf(x) === i)].slice(0, 5);
  const makeFoes = (id, preferred) => [...preferred, ...enemyFallback, ...PLAYABLE_IDS]
    .filter(x => x !== id)
    .filter((x, i, list) => list.indexOf(x) === i)
    .slice(0, 5);
  const scenarios = [
    { name: 'control', foes: ['Dyle','Sprout','Delilah','Bobette','Brusha'], twisted: false },
    { name: 'pressure', foes: ['Dandy','Cocoa','Eclipse','Coal','Gourdy'], twisted: false },
    { name: 'twisted', foes: ['Dyle','Sprout','Delilah','Bobette','Brusha'], twisted: true }
  ];
  const makeSpec = id => Lab.makeSpec(id, 60, false, true, null);
  const clamp = (n, low = 0, high = 1) => Math.max(low, Math.min(high, n));
  const run = (id, team, scenario) => {
    const battle = new Battle({ offscreen: true });
    const result = battle.simulateOffscreen(
      team.map(makeSpec),
      makeFoes(id, scenario.foes).map(makeSpec),
      { timeLimit: ${timeLimit}, twisted: scenario.twisted, mode: 'standard' },
      {}
    );
    const allies = battle.units.filter(unit => unit.team === 0 && !unit.minion);
    const candidate = allies.find(unit => unit.id === id);
    const damage = unit => Number(unit?.dmgDone ?? unit?.damageDealt ?? 0) || 0;
    const healing = unit => Number(unit?.healDone ?? unit?.healingDone ?? 0) || 0;
    const totalDamage = allies.reduce((sum, unit) => sum + damage(unit), 0);
    const alive = allies.filter(unit => unit.alive).length;
    const timeout = !result.win && /time|timeout|draw/i.test(String(result.why || ''));
    const share = totalDamage ? damage(candidate) / totalDamage : 0;
    const currentRole = role(id);
    let contribution = currentRole === 'Damage'
      ? share * 10
      : currentRole === 'Control'
        ? share * 6 + alive / 5 * 4
        : alive / 5 * 7 + (candidate?.alive ? 3 : 0);
    if (currentRole === 'Support') {
      contribution += healing(candidate) / Math.max(1, (candidate?.max?.hp || 1) * 2) * 2;
    }
    contribution = clamp(contribution, 0, 10);
    const score = (result.win ? 60 : timeout ? 38 : 0)
      + alive / 5 * 20
      + (candidate?.alive ? 10 : 0)
      + contribution;
    return {
      win: !!result.win,
      timeout,
      alive,
      candidateAlive: !!candidate?.alive,
      score: Math.round(score * 10) / 10,
      damage: Math.round(damage(candidate)),
      healing: Math.round(healing(candidate)),
      damageShare: Math.round(share * 1000) / 1000
    };
  };
  const rows = [];
  for (const id of ids) {
    const roleName = role(id);
    const teams = {
      neutral: makeTeam(id, ['Coal','Cocoa','Tisha','Gigi']),
      roleFit: makeTeam(id, anchors[roleName] || anchors['All-Rounder'])
    };
    const tests = [];
    for (const [context, team] of Object.entries(teams)) {
      for (const scenario of scenarios) {
        const trialRows = [];
        for (let trial = 0; trial < ${trials}; trial++) {
          try {
            trialRows.push(run(id, team, scenario));
          } catch (error) {
            trialRows.push({ error: String(error) });
          }
        }
        const goodTrials = trialRows.filter(test => !test.error);
        tests.push({
          context,
          scenario: scenario.name,
          trials: goodTrials.length,
          wins: goodTrials.filter(test => test.win).length,
          avgScore: Math.round(goodTrials.reduce((sum, test) => sum + test.score, 0) / Math.max(1, goodTrials.length) * 10) / 10,
          avgAlive: Math.round(goodTrials.reduce((sum, test) => sum + test.alive, 0) / Math.max(1, goodTrials.length) * 10) / 10,
          candidateRate: Math.round(goodTrials.filter(test => test.candidateAlive).length / Math.max(1, goodTrials.length) * 100) / 100,
          avgDamage: Math.round(goodTrials.reduce((sum, test) => sum + test.damage, 0) / Math.max(1, goodTrials.length)),
          avgHealing: Math.round(goodTrials.reduce((sum, test) => sum + test.healing, 0) / Math.max(1, goodTrials.length)),
          errors: trialRows.filter(test => test.error).length
        });
      }
    }
    const good = tests.filter(test => !test.error);
    rows.push({
      id,
      role: roleName,
      authored: HEROES[id].tier,
      avg: Math.round(good.reduce((sum, test) => sum + test.avgScore, 0) / Math.max(1, good.length) * 10) / 10,
      wins: good.reduce((sum, test) => sum + test.wins, 0),
      survival: Math.round(good.reduce((sum, test) => sum + test.avgAlive, 0) / Math.max(1, good.length) / 5 * 100) / 100,
      errors: tests.reduce((sum, test) => sum + test.errors, 0),
      tests
    });
  }
  return { total: PLAYABLE_IDS.length, start: ${start}, size: ${size}, rows };
})()`;

const response = await command('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
if (response.result?.exceptionDetails) throw new Error(JSON.stringify(response.result.exceptionDetails));
console.log(JSON.stringify(response.result?.result?.value ?? response.result?.exceptionDetails));
ws.close();
