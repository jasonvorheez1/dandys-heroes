/* Run with node tools/glisten-rework-test.cjs. Exercises the real battle engine. */
const fs = require('fs');
const vm = require('vm');
const assert = require('assert');
const path = require('path');
const root = path.resolve(__dirname, '..');
function node() { return {
  style: { setProperty() {}, removeProperty() {} },
  classList: { add() {}, remove() {}, toggle() {}, contains() { return false; } },
  dataset: {}, children: [], append(...v) { this.children.push(...v); },
  appendChild(v) { this.children.push(v); return v; }, removeChild() {}, replaceChildren() { this.children = []; }, remove() {},
  querySelector() { return node(); }, querySelectorAll() { return []; }, setAttribute() {}, getAttribute() { return ''; }, addEventListener() {},
  getBoundingClientRect() { return { width: 560, height: 760, left: 0, top: 0 }; },
  get firstChild() { return null; }, parentElement: { classList: { toggle() {} } }, clientWidth: 560, clientHeight: 760, hidden: true
}; }
const nodes = {};
const doc = { querySelector(s) { return nodes[s] || (nodes[s] = node()); }, querySelectorAll() { return []; },
  createElement: node, documentElement: node(), body: node(), addEventListener() {} };
const warnings = [];
const ctx = vm.createContext({
  console: { log: console.log, error: console.error, warn(...a) { warnings.push(a.map(v => v?.stack || String(v)).join(' ')); } },
  document: doc, window: null, localStorage: { getItem() { return null; }, setItem() {}, removeItem() {} },
  navigator: { userAgent: 'node', hardwareConcurrency: 4 }, location: { search: '', href: 'http://localhost' },
  performance, URL, URLSearchParams, Image: class {}, Audio: class {}, setTimeout: () => 0, clearTimeout() {},
  setInterval: () => 0, clearInterval() {}, requestAnimationFrame: () => 0, cancelAnimationFrame() {},
  matchMedia: () => ({ matches: false, addEventListener() {} }), innerWidth: 560, innerHeight: 760, assert
});
ctx.window = ctx; ctx.addEventListener = () => {};
const scripts = [...fs.readFileSync(path.join(root, 'index.html'), 'utf8').matchAll(/<script src="([^"]+)"/g)]
  .map(m => m[1]).filter(s => !['js/main.js', 'js/websim.js'].includes(s));
for (const file of scripts) vm.runInContext(fs.readFileSync(path.join(root, file), 'utf8'), ctx, { filename: file });
vm.runInContext(`
Save.data=Save.fresh(); Save.write=()=>{}; Save.addMasteryXp=()=>{}; UI.queueHeroUnlock=()=>{}; UI.toast=()=>{}; Achievements.record=()=>{};
Object.keys(FX).forEach(k=>{if(typeof FX[k]==='function')FX[k]=()=>{};});
Object.keys(Sound).forEach(k=>{if(typeof Sound[k]==='function')Sound[k]=()=>false;});
const spec=id=>({id,level:70,rarity:5,rarityPlus:1,stars:3,skillLv:70});
assert.equal(HEROES.Scraps.role,'Damage');
assert.equal(DW_TOON_STATS.Scraps.extraction,3);assert.equal(DW_TOON_STATS.Scraps.skill,2);
assert.equal(DW_TOON_STATS.Scraps.speed,2);assert.equal(DW_TOON_STATS.Scraps.stamina,5);
assert.equal(skillGrowthParams(HEROES.Scraps.skills.W,800).every,3);
for(const key of SKILL_ORDER){const sk=HEROES.Scraps.skills[key];
  const S=B=>B.scaled(B.units[0],key), P=skillGrowthParams(sk,70);
  assert(typeof sk.desc(Object.fromEntries(Object.entries(sk.v).map(([k,v])=>[k,v*skillMult(70)])),P)==='string');}
const B=new Battle({offscreen:true});
B.start([spec('Scraps'),spec('Boxten')],[makeTwisted('Shrimpo',70,'normal'),makeTwisted('Poppy',70,'normal')],{timeLimit:45});
const s=B.units[0],a=B.units[1],e=B.enemiesOf(s)[0],e2=B.enemiesOf(s)[1];
s.x=B.leftWall+40;a.x=B.centerX();a.depth=s.depth;e.x=a.x+35;e.depth=a.depth;
a.hp=a.max.hp*.4;e.st.eva=0;
const hp=e.hp;
HEROES.Scraps.skills.W.cast(s,B,B.scaled(s,'W'),B.skillParams(s,'W'));
assert(s.invuln>B.t&&s.dashTo!==null);
assert(Math.abs(s.dashTo-a.x)<45);const landingX=s.dashTo;
const finishGrapple=s.dashOpt.onEnd;s.x=landingX;s.depth=a.depth;s.dashTo=null;s.dashUntil=0;s.dashOpt=null;
finishGrapple();
assert(Math.abs(s.x-landingX)<1);
assert(e.hp<hp);
assert(e.hasStatus('frayed'));
console.log('PASS ally-directed invulnerable grapple and landing damage');
assert.equal(s.scrapsCraft,'cardboard');
HEROES.Scraps.skills.G.cast(s,B,B.scaled(s,'G'),B.skillParams(s,'G'));
assert.equal(s.scrapsCraft,'cup');
HEROES.Scraps.skills.G.cast(s,B,B.scaled(s,'G'),B.skillParams(s,'G'));
assert.equal(s.scrapsCraft,'yarn');
for(let i=0;i<3;i++)B.emitFor(s,'basicHit',{target:e2});
assert(e2.hasStatus('frayed')&&e2.hasStatus('slow'));
console.log('PASS rotating crafts and every-third-basic yarn hit');
const oldRadius=s.scrapsRadius;
B.emitFor(s,'cast',{key:'G'});
assert(s.scrapsRadius>oldRadius);
assert(s.scrapsBurstUntil>B.t);
const aura=B.intervals.find(i=>i.owner===s&&i.every===1);
assert(aura);
a.x=s.x+25;a.depth=s.depth;e2.x=s.x+30;e2.depth=s.depth;
aura.fn();
assert(a.hasStatus('scraps_craftbeat'));
assert(e2.hasStatus('frayed'));
assert(s.flat.atkPScraps>0);
console.log('PASS growing damage circle, ally attack speed, and enemy pressure');
e2.x=s.x+25;e2.depth=s.depth;const before=e2.hp;
HEROES.Scraps.skills.B.cast(s,B,B.scaled(s,'B'),B.skillParams(s,'B'));
for(let i=0;i<8&&!B.ended;i++)B.step(.05);
assert(e2.hp<before);
console.log('PASS Craft Class Crash area damage');
const T=new Battle({offscreen:true});
T.start([spec('Boxten'),spec('Cosmo')],[makeTwisted('Scraps',70,'elite'),makeTwisted('Shrimpo',70,'normal')],{timeLimit:40});
const twisted=T.units.find(u=>u.id==='Scraps'&&u.team!==s.team);
const partner=T.alliesOf(twisted).find(u=>u!==twisted);
assert(twisted&&partner);
partner.hp=partner.max.hp*.4;
HEROES.Scraps.skills.W.cast(twisted,T,T.scaled(twisted,'W'),T.skillParams(twisted,'W'));
assert(twisted.invuln>T.t);
for(let i=0;i<320&&!T.ended;i++)T.step(.05);
assert(T.units.every(u=>Number.isFinite(u.x)&&Number.isFinite(u.hp)));
console.log('PASS Twisted Scraps grapple and simulation',T.t.toFixed(2));
`, ctx, { timeout: 20000 });
assert.deepEqual(warnings, []);
