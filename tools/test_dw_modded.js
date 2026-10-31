const fs = require('fs');
const vm = require('vm');

console.log('Testing DW Modded Event System...');

const gameJs = fs.readFileSync('js/game.js', 'utf8');
const startMarker = 'var S=';
const startIdx = gameJs.indexOf(startMarker);
let endMarker = ';\nfor(var i=0;i<S.length;i++)';
let endIdx = gameJs.lastIndexOf(endMarker);
if (endIdx === -1) {
  endMarker = ';\r\nfor(var i=0;i<S.length;i++)';
  endIdx = gameJs.lastIndexOf(endMarker);
}
const jsonStr = gameJs.slice(startIdx + startMarker.length, endIdx);
const S = JSON.parse(jsonStr);

// Create VM context
const storage = {};
const sandbox = {
  window: {},
  localStorage: {
    getItem: k => storage[k] || null,
    setItem: (k, v) => { storage[k] = String(v); },
    removeItem: k => { delete storage[k]; }
  },
  document: {
    createElement: (tag) => {
      const el = {
        tagName: (tag || 'DIV').toUpperCase(),
        children: [],
        style: {},
        classList: {
          _list: new Set(),
          add: (...cls) => cls.forEach(c => el.classList._list.add(c)),
          remove: (...cls) => cls.forEach(c => el.classList._list.delete(c)),
          contains: c => el.classList._list.has(c),
          toggle: (c, force) => {
            if (force === undefined) {
              if (el.classList._list.has(c)) el.classList._list.delete(c);
              else el.classList._list.add(c);
            } else if (force) {
              el.classList._list.add(c);
            } else {
              el.classList._list.delete(c);
            }
          }
        },
        appendChild: child => { el.children.push(child); return child; },
        append: (...children) => { children.forEach(c => el.children.push(c)); },
        setAttribute: () => {},
        getAttribute: () => null,
        querySelector: () => null,
        querySelectorAll: () => []
      };
      return el;
    },
    querySelector: () => ({ textContent: '', style: {}, parentElement: { classList: { add: () => {}, remove: () => {} }, offsetWidth: 0 } }),
    querySelectorAll: () => [],
    head: { appendChild: () => {} },
    body: { appendChild: () => {} },
    documentElement: { dataset: {}, classList: { toggle: () => {} } },
    addEventListener: () => {}
  },
  console: console,
  setTimeout: setTimeout,
  clearTimeout: clearTimeout,
  Math: Math,
  Date: Date,
  ASSET: '',
  ItemSheet: { ready: Promise.resolve(), url: () => '' },
  Sound: { play: () => {} },
  UI: { toast: () => {}, refreshBar: () => {} }
};
sandbox.window = sandbox;
sandbox.global = sandbox;

const ctx = vm.createContext(sandbox);

// Execute all scripts in S
S.forEach(([name, code], idx) => {
  try {
    vm.runInContext(code, ctx);
  } catch (err) {
    // Some DOM-heavy screens might throw on initialization if DOM is not mocked, that's fine
  }
});

console.log('VM context initialized.');

// Load ToonSkillMotion
vm.runInContext(fs.readFileSync('js/toon-skill-motion.js', 'utf8'), ctx);

// Run Tests in VM Context
const testScript = `
(() => {
  console.log('--- 1. Testing Event Registration ---');
  if (typeof Save !== 'undefined' && Save.init) Save.init();
  Save.data = Save.data || { raid: {}, heroes: {}, trinkets: {}, res: { ichor: 1000, tape: 0, notes: 0, star: 0, ticket: 0, raidTicket: 5, counterToken: 0 } };
  Save.data.res = Save.data.res || { ichor: 1000, tape: 0, notes: 0, star: 0, ticket: 0, raidTicket: 5, counterToken: 0 };
  const events = Raid.events();
  const dw = events.find(e => e.id === 'dw-modded-event');
  if (!dw) throw new Error('dw-modded-event not found in Raid.events()');
  console.log('Found dw-modded-event:', dw.title, 'isDWModded:', dw.isDWModded);
  if (!dw.featuredIds.includes('Jessie') || !dw.featuredIds.includes('Cody') || !dw.featuredIds.includes('Nugget') || !dw.featuredIds.includes('Dango')) {
    throw new Error('dw-modded-event does not have all 4 featured heroes');
  }

  console.log('--- 2. Testing Currency & Icons ---');
  Save.data.raid = Save.data.raid || {};
  Save.data.raid.dwModdedTapes = 500;
  const currency = Raid.currency(dw);
  const icon = Raid.currencyIcon(dw);
  console.log('Currency:', currency, 'Icon:', icon);
  if (currency !== 500 || icon !== '📼') throw new Error('Currency or Icon mismatch for dw-modded-event');

  console.log('--- 3. Testing Wave Plan & Composition ---');
  const plan = Raid.wavePlan(dw, 0);
  console.log('Wave Plan:', plan.map(w => w.desc));
  if (plan.length !== 3) throw new Error('Wave plan should have 3 waves');

  const wave1 = Raid.makeWave('dw-modded-event', 1, 25, dw);
  const wave2 = Raid.makeWave('dw-modded-event', 2, 25, dw);
  const wave3 = Raid.makeWave('dw-modded-event', 3, 25, dw);

  console.log('Wave 1 foes:', wave1.map(f => f.id));
  console.log('Wave 2 foes:', wave2.map(f => f.id));
  console.log('Wave 3 foes:', wave3.map(f => f.id));

  if (wave1.length !== 2 || wave1[0].id !== 'Dango' || wave1[1].id !== 'Nugget') throw new Error('Wave 1 composition incorrect');
  if (wave2.length !== 3 || wave2[0].id !== 'Cody') throw new Error('Wave 2 composition incorrect');
  if (wave3.length !== 4 || wave3[0].id !== 'Jessie') throw new Error('Wave 3 composition incorrect');

  console.log('--- 4. Testing Wave Equipment & Combat Mods ---');
  const equipped = Raid.equipWave(wave3, 'dw-modded-event', 3, 150);
  console.log('Equipped Wave 3:', equipped.map(f => ({ id: f.id, badges: f.badges?.length, trinkets: f.trinkets?.length })));

  console.log('--- 5. Testing Resolve & Rewards ---');
  const initialTapes = Raid.currency(dw);
  const reward = Raid.resolve('dw-modded-event', true, dw, 0);
  console.log('Rewarded tapes:', reward, 'New balance:', Raid.currency(dw));
  if (Raid.currency(dw) !== initialTapes + reward) throw new Error('Resolve did not credit dwModdedTapes correctly');

  console.log('--- 6. Testing VIP Boutique Offers ---');
  const offers = Raid.dwModdedOffers();
  console.log('Offers count:', offers.length);
  const contracts = offers.filter(o => o.type === 'contract');
  const trinketOffers = offers.filter(o => o.type === 'trinket');
  if (contracts.length !== 4) throw new Error('Expected 4 recruitment contracts');
  if (trinketOffers.length !== 4) throw new Error('Expected 4 signature trinket offers');

  console.log('--- 7. Testing Hero Recruitment Contract ---');
  // Make sure Cody is not owned initially
  delete Save.data.heroes['Cody'];
  if (Save.owns('Cody')) throw new Error('Cody should not be owned initially');

  const buyRes = Raid.buyDwModdedOffer('dw_contract_cody');
  console.log('Buy Cody Contract result:', buyRes);
  if (!buyRes.ok || !Save.owns('Cody')) throw new Error('Recruitment contract failed to unlock Cody');
  if (Save.data.heroes['Cody'].shards !== 20) throw new Error('Cody should have 20 shards after recruitment');

  console.log('--- 8. Testing Shard Mass Buy ---');
  const shardOffer = Raid.shardOffer(dw, 'Cody');
  console.log('Shard offer for Cody:', shardOffer);
  const buyShardsRes = Raid.buyShards(dw.id, 'Cody', 5);
  console.log('Buy 5x bundles of Cody shards:', buyShardsRes);
  if (!buyShardsRes.ok || buyShardsRes.amount !== 25) throw new Error('Mass buy shards failed');
  if (Save.data.heroes['Cody'].shards !== 45) throw new Error('Cody should now have 45 shards');

  console.log('--- 9. Testing Signature Trinkets in TRINKETS ---');
  ['jessie_radio', 'nugget_mustard', 'cody_beartrap', 'dango_skewer'].forEach(id => {
    const t = TRINKETS[id];
    if (!t) throw new Error('Trinket ' + id + ' not found in TRINKETS');
    console.log('Trinket:', t.id, t.name, 'owner:', t.owner, 'icon:', trinketIcon(id));
    if (typeof t.stat !== 'function' || typeof t.apply !== 'function') throw new Error('Trinket ' + id + ' missing stat or apply function');
  });

  console.log('--- 10. Testing Signature Trinket Purchase ---');
  Save.data.raid.dwModdedTapes += 500;
  const trinketBuy = Raid.buyDwModdedOffer('cody_beartrap');
  console.log('Buy Cody Bear Trap:', trinketBuy);
  if (!trinketBuy.ok || !Save.ownsTrinket('cody_beartrap')) throw new Error('Failed to buy signature trinket');

  console.log('--- 11. Testing ToonSkillMotion Poses ---');
  ['Jessie', 'Cody', 'Nugget', 'Dango'].forEach(id => {
    ['W', 'G', 'B', 'P', 'R'].forEach(key => {
      const u = { id, alive: true, face: 1, st: {} };
      ToonSkillMotion.begin(u, key, 0, 1);
      const s = ToonSkillMotion.sample(u, 0.5);
      if (!s) throw new Error('Pose sample returned null for ' + id + ' ' + key);
    });
    console.log('ToonSkillMotion validated for:', id);
  });

  console.log('--- 12. Testing Almost Home Merged Storybook & Writing Guidelines ---');
  if (typeof AlmostHome === 'undefined') throw new Error('AlmostHome is undefined');
  if (AlmostHome.story.length !== 6) throw new Error('Expected 6 story chapters');
  if (AlmostHome.bonus.length !== 4) throw new Error('Expected 4 bonus memories');

  const allStory = AlmostHome.story.map(s => s.script).join('\\n');
  const allBonus = AlmostHome.bonus.map(b => b.script).join('\\n');
  const fullText = allStory + '\\n' + allBonus;

  // Characterization assertions:
  if (!fullText.toLowerCase().includes('filthy peasant') && !fullText.toLowerCase().includes('filthy peasants')) throw new Error('Missing "filthy peasant"');
  if (!fullText.includes('My Space')) throw new Error('Missing "My Space"');
  if (!fullText.includes('7/24/1998')) throw new Error('Missing "7/24/1998"');
  if (!fullText.toLowerCase().includes('chains are fashion') && !fullText.toLowerCase().includes('fashion statement')) throw new Error('Missing chains as fashion');
  if (!fullText.toLowerCase().includes('boyfriend')) throw new Error('Missing Cody/Nugget boyfriend dynamic');
  if (!fullText.includes('hot dog') && !fullText.includes('hot dogs')) throw new Error('Missing Nugget hot dogs');
  if (!fullText.includes('Dango') || !fullText.includes('tea')) throw new Error('Missing Dango tea');
  if (!fullText.includes('Vee') || !fullText.includes('Bassie') || !fullText.includes('Shelly') || !fullText.includes('Gigi')) throw new Error('Missing Gardenview crew');
  console.log('✓ Character dialogue and relationship guidelines validated');

  console.log('--- 13. Testing Unified Dossier All 5 Tabs Render ---');
  const container = document.createElement('div');
  ['story', 'stages', 'bonus', 'boutique', 'posters'].forEach(tab => {
    Screens._dwTab = tab;
    container.children = [];
    Screens.dwModdedDossier(container, dw);
    if (container.children.length === 0) throw new Error('Dossier failed to render tab: ' + tab);
  });
  console.log('✓ All 5 dossier tabs rendered without errors');

  console.log('ALL TESTS PASSED SUCCESSFULLY! ✓');
})();
`;

// Load AlmostHome script into VM before running testScript
vm.runInContext(fs.readFileSync('js/almost-home.js', 'utf8'), ctx);

vm.runInContext(testScript, ctx);
