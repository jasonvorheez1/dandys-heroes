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
assert.equal(DW_TOON_STATS.Glisten.extraction,5);assert.equal(DW_TOON_STATS.Glisten.skill,2);
for(const key of SKILL_ORDER){const sk=HEROES.Glisten.skills[key];
  const S=Object.fromEntries(Object.entries(sk.v).map(([k,v])=>[k,v*skillMult(70)]));
  assert(typeof sk.desc(S,skillGrowthParams(sk,70))==='string');}
assert.equal(skillGrowthParams(HEROES.Glisten.skills.W,800).dizzyDur,2.5);
assert.equal(skillGrowthParams(HEROES.Glisten.skills.P,800).counterCd,1.25);
assert.equal(skillGrowthParams(HEROES.Glisten.skills.R,800).healPct,.16);
const B=new Battle({offscreen:true});
B.start([spec('Glisten'),spec('Boxten')],[makeTwisted('Boxten',70,'normal'),makeTwisted('Shrimpo',70,'normal')],{timeLimit:50});
const g=B.units[0],ally=B.units[1];let foes=B.enemiesOf(g);
B.step(.25);assert(g._introRevealed);assert(foes.some(e=>e.hasStatus('dazzled')));
console.log('PASS mirror entrance and dazzled targets');
ally.hp=ally.max.hp*.4;ally.x=B.leftWall+45;
const first=foes.map(e=>e.hp);
HEROES.Glisten.skills.W.cast(g,B,B.scaled(g,'W'),B.skillParams(g,'W'));
assert(Math.abs(g.x-ally.x)<55);assert(g.hasStatus('glisten_dizzy'));
assert(ally.shields.some(sh=>sh.src===g));assert(foes.some((e,i)=>e.hp<first[i]));
console.log('PASS ally teleport, dizzy drawback, shield, and reflected hits');
const attacker=foes.find(e=>e.alive);
const counterBefore=g._glistenCounterAt;
B.damage(attacker,ally,100,{type:'true',noDodge:true});
assert(g._glistenCounterAt>B.t && g._glistenCounterAt!==counterBefore);
console.log('PASS protected ally triggers mirror counter');
B.step(.25);assert(g.glistenAudience);
const marked=g.glistenAudience;
const beforeShield=ally.shieldTotal;
B.emitFor(g,'enemyCast',marked);
assert(ally.shieldTotal>=beforeShield);assert(marked.hasStatus('drowsy'));
console.log('PASS Audience reacts to enemy skill');
ally.shields=[];ally.hp=1;ally.invuln=0;
B.damage(attacker,ally,1e7,{type:'true',noDodge:true,bypassShield:true});
assert(ally.alive&&ally.hp>1);assert(g._glistenRescueUsed);assert(g.hasStatus('glisten_dizzy'));
console.log('PASS once-per-wave lethal rescue');
const T=new Battle({offscreen:true});
T.start([spec('Poppy'),spec('Boxten')],[makeTwisted('Glisten',70,'elite'),makeTwisted('Shrimpo',70,'normal')],{timeLimit:40});
for(let i=0;i<6&&!T.ended;i++)T.step(.05);
const twisted=T.units.find(u=>u.id==='Glisten'&&u.team!==g.team);
assert(twisted&&twisted.alive);
const twistedPartner=T.alliesOf(twisted).find(u=>u!==twisted);
twistedPartner.hp=twistedPartner.max.hp*.45;
HEROES.Glisten.skills.W.cast(twisted,T,T.scaled(twisted,'W'),T.skillParams(twisted,'W'));
assert(twisted.hasStatus('glisten_dizzy'));
assert(twistedPartner.shields.some(sh=>sh.src===twisted));
for(let i=0;i<300&&!T.ended;i++)T.step(.05);
assert(T.units.every(u=>Number.isFinite(u.x)&&Number.isFinite(u.hp)));
console.log('PASS Twisted Glisten teleport and simulation',T.t.toFixed(2));
`, ctx, { timeout: 20000 });
assert.deepEqual(warnings, []);
