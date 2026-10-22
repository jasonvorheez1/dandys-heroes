/* Run with node tools/bobette-rework-test.cjs. Exercises the real battle engine. */
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
assert.equal(DW_TOON_STATS.Bobette.extraction,2);assert.equal(DW_TOON_STATS.Bobette.skill,4);
assert.equal(DW_TOON_STATS.Bobette.stamina,5);assert.equal(DW_TOON_STATS.Bobette.stealth,2);
assert.equal(HEROES.Bobette.role,'Support');
for(const key of SKILL_ORDER){const sk=HEROES.Bobette.skills[key];
  const S=Object.fromEntries(Object.entries(sk.v).map(([k,v])=>[k,v*skillMult(70)]));
  assert(typeof sk.desc(S,skillGrowthParams(sk,70))==='string');}
assert.equal(skillGrowthParams(HEROES.Bobette.skills.W,800).wrap,2.8);
assert.equal(skillGrowthParams(HEROES.Bobette.skills.W,800).healPct,.16);
assert.equal(skillGrowthParams(HEROES.Bobette.skills.P,800).cooldown,5);
assert.equal(skillGrowthParams(HEROES.Bobette.skills.R,800).revivePct,.18);
const B=new Battle({offscreen:true});
B.start([spec('Bobette'),spec('Boxten'),spec('Cosmo')],[makeTwisted('Shrimpo',70,'normal'),makeTwisted('Poppy',70,'normal')],{timeLimit:45});
const bob=B.units[0],near=B.units[1],far=B.units[2],enemy=B.enemiesOf(bob)[0];
bob.x=B.leftWall+55;near.x=bob.x+50;far.x=B.rightWall-30;
B.removeStatus(far,'festivecheer');
B.step(.55);
assert(near.hasStatus('festivecheer'));assert(!far.hasStatus('festivecheer'));
assert(bob._favored&&bob._favored.hasStatus('bobette_favor'));
near.x=B.rightWall-35;B.step(.5);assert(near.hasStatus('festivecheer'));
console.log('PASS local Festive Aura, lingering boost, and opening favor');
near.x=bob.x+45;near.invuln=0;near.shields=[];
B.damage(enemy,near,near.max.hp*.2,{type:'true',noDodge:true,bypassShield:true});
assert(near.hasStatus('festiveguard'));
console.log('PASS Ornament Protection on a nearby heavy hit');
const hp=bob.hp;
HEROES.Bobette.skills.W.cast(bob,B,B.scaled(bob,'W'),B.skillParams(bob,'W'));
assert(bob.hasStatus('bobette_box'));assert(bob.invuln>B.t);
assert.equal(B.damage(enemy,bob,2000,{type:'true',noDodge:true}),null);assert.equal(bob.hp,hp);
B.step(.05);assert(bob.flags.noAct&&bob.flags.noMove);
for(let i=0;i<65&&!B.over;i++)B.step(.05);
assert(!bob.hasStatus('bobette_box'));assert(near.shields.some(sh=>sh.src===bob));
console.log('PASS invulnerable, stationary box and protective unboxing');
const favored=bob._favored;
favored.invuln=0;favored.shields=[];favored.hp=1;
B.damage(enemy,favored,1e7,{type:'true',noDodge:true,bypassShield:true});
assert(favored.alive&&favored.hp>1);assert(bob._bobetteFavorOpened);
assert(!favored.hasStatus('bobette_favor'));
console.log('PASS once-per-wave Perfect Present rescue');
const Q=new Battle({offscreen:true});
Q.start([spec('Bobette')],[makeTwisted('Shrimpo',70,'normal')],{timeLimit:20});
const qb=Q.units[0],qe=Q.enemiesOf(qb)[0];
HEROES.Bobette.skills.B.cast(qb,Q,Q.scaled(qb,'B'),Q.skillParams(qb,'B'));
for(let i=0;i<18&&!Q.ended;i++)Q.step(.05);
assert(qe.hasStatus('wrapped'));
console.log('PASS Wrapped Surprise gift projectile');
const T=new Battle({offscreen:true});
T.start([spec('Poppy'),spec('Boxten')],[makeTwisted('Bobette',70,'elite'),makeTwisted('Shrimpo',70,'normal')],{timeLimit:45});
const tb=T.units.find(u=>u.id==='Bobette'&&u.team!==bob.team);
assert(tb&&tb.alive);
HEROES.Bobette.skills.W.cast(tb,T,T.scaled(tb,'W'),T.skillParams(tb,'W'));
assert(tb.invuln>T.t&&tb.hasStatus('bobette_box'));
for(let i=0;i<300&&!T.ended;i++)T.step(.05);
assert(T.units.every(u=>Number.isFinite(u.x)&&Number.isFinite(u.hp)));
console.log('PASS Twisted Bobette box and simulation',T.t.toFixed(2));
`, ctx, { timeout: 20000 });
assert.deepEqual(warnings, []);
