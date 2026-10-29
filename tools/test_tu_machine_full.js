const fs = require('fs');
const vm = require('vm');

const gameJs = fs.readFileSync('js/game.js', 'utf8');
const startIdx = gameJs.indexOf('var S=');
let endIdx = gameJs.lastIndexOf(';\nfor(var i=0;i<S.length;i++)');
if (endIdx === -1) endIdx = gameJs.lastIndexOf(';\r\nfor(var i=0;i<S.length;i++)');
const jsonStr = gameJs.slice(startIdx + 'var S='.length, endIdx);
const S = JSON.parse(jsonStr);

const mockEl = () => ({
  appendChild: () => {},
  removeChild: () => {},
  replaceChildren: () => {},
  setAttribute: () => {},
  getAttribute: () => '',
  classList: { add: () => {}, remove: () => {}, toggle: () => {}, contains: () => false },
  style: {},
  dataset: {},
  addEventListener: () => {},
  removeEventListener: () => {},
  querySelectorAll: () => [],
  querySelector: () => null,
  getBoundingClientRect: () => ({ left: 0, top: 0, width: 100, height: 100 })
});

const sandbox = {
  window: {},
  document: {
    createElement: mockEl,
    getElementById: () => mockEl(),
    querySelector: () => mockEl(),
    querySelectorAll: () => [],
    addEventListener: () => {},
    documentElement: mockEl(),
    head: mockEl(),
    body: mockEl()
  },
  localStorage: { getItem: () => null, setItem: () => {}, removeItem: () => {} },
  navigator: { userAgent: 'node' },
  console,
  setTimeout: () => {},
  setInterval: () => {},
  clearTimeout: () => {},
  clearInterval: () => {},
  Math,
  Date,
  Array,
  Object,
  String,
  Number,
  RegExp,
  ItemSheet: { renderItemSheet: () => '', url: () => '' },
  EVENT_MODIFIERS: []
};
sandbox.window = sandbox;
sandbox.global = sandbox;
vm.createContext(sandbox);

for (let i = 0; i < S.length; i++) {
  try {
    vm.runInContext(S[i][1], sandbox, { filename: S[i][0] });
  } catch (e) {
  }
}

const testScript = `
  Save.load();
  Save.data.mastery = 60;
  Save.data.heroes['Boxten'] = { level: 50, xp: 0, stars: 1 };
  Save.data.heroes['Selena'] = { level: 50, xp: 0, stars: 1 };
  Save.data.heroes['Copper'] = { level: 50, xp: 0, stars: 1 };
  Save.data.team = ['Selena', 'Copper', 'Boxten'];

  ToonsUniverse.start(['Selena', 'Copper', 'Boxten']);
  const r = ToonsUniverse.run();
  console.log('Run started. Floor:', r.floor, 'Nodes:', r.nodes.map(n => n.title));

  // Pick opening card to exit draft mode
  const draftOpts = ToonsUniverse.draftOptions();
  console.log('Draft options:', draftOpts);
  ToonsUniverse.pickCard(draftOpts[0]);
  console.log('Draft completed. In explore phase?', r.phase);

  // 1. Test starting machine with Selena
  const nodeId = r.nodes[0].id;
  const startRes = ToonsUniverse.startMachine(nodeId, 'Selena', 'standard');
  console.log('Machine start with Selena:', startRes.ok, 'Perk:', ToonsUniverse.getOperatorPerk('Selena').name);

  // 2. Test ticking machine
  const tickRes = ToonsUniverse.tickMachine(0.1);
  console.log('Machine tick needle:', tickRes.needle, 'progress:', tickRes.progress);

  // 3. Test hitting check in Great zone
  r.machine.needle = (r.machine.greatStart + r.machine.greatEnd) / 2;
  const hit1 = ToonsUniverse.hitSkillCheck();
  console.log('Hit 1 (Great):', hit1.result, 'progress:', hit1.progress, 'msg:', hit1.message);

  // 4. Test consecutive Great hit for Flow multiplier
  r.machine.needle = (r.machine.greatStart + r.machine.greatEnd) / 2;
  const hit2 = ToonsUniverse.hitSkillCheck();
  console.log('Hit 2 (Combo Flow):', hit2.result, 'flowMultiplier:', hit2.flowMultiplier, 'progress:', hit2.progress);

  // 5. Test Copper Flame Barrier absorption
  ToonsUniverse.cancelMachine();
  ToonsUniverse.startMachine(nodeId, 'Copper', 'standard');
  r.machine.needle = 0; // miss zone
  const miss1 = ToonsUniverse.hitSkillCheck();
  console.log('Copper miss 1 (Flame Ward):', miss1.result, 'charges left:', miss1.copperShieldRemaining, miss1.message);
  const miss2 = ToonsUniverse.hitSkillCheck();
  console.log('Copper miss 2 (Flame Ward):', miss2.result, 'charges left:', miss2.copperShieldRemaining, miss2.message);
  const miss3 = ToonsUniverse.hitSkillCheck();
  console.log('Copper miss 3 (No charges left):', miss3.result, 'alert:', miss3.alert, miss3.message);

  // 6. Test useMachineItem with USB Key and Decoy
  r.armed.push('usb_bypass');
  r.armed.push('decoy');
  const usbUse = ToonsUniverse.useMachineItem('usb_bypass');
  console.log('USB Key use:', usbUse.ok, usbUse.message, 'new progress:', usbUse.progress);
  const decoyUse = ToonsUniverse.useMachineItem('decoy');
  console.log('Decoy use:', decoyUse.ok, decoyUse.message, 'new alert:', decoyUse.alert);

  // 7. Test Chekhov store buySupply
  r.phase = 'elevator';
  r.parts = 100;
  const buyCoffee = ToonsUniverse.buySupply('coffee');
  console.log('Buy Cold Brew from Chekhov:', buyCoffee, 'coffeeBuff:', r.coffeeBuff);
  const buyMedkit = ToonsUniverse.buySupply('patch');
  console.log('Buy Trauma Medkit from Chekhov:', buyMedkit);

  // 8. Test Mass Buy
  const s = ToonsUniverse.state();
  s.malachor = 500;
  const massBuy = ToonsUniverse.promote('Selena', 5);
  console.log('Mass Buy Selena shards (+25 shards):', massBuy);

  'ALL TESTS COMPLETED SUCCESSFULLY';
`;

const result = vm.runInContext(testScript, sandbox);
console.log('FINAL RESULT:', result);
