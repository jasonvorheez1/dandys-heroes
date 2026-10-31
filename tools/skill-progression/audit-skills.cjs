const fs=require('fs'),vm=require('vm'),path=require('path');
const ROOT=process.env.DANDYS_GAME||(fs.existsSync(path.resolve(__dirname,'../../js/game.js'))?path.resolve(__dirname,'../..'):'C:/Users/anoob/Downloads/dandy_s_heroes_by_scraps/dandys heroes');
const source=fs.readFileSync(path.join(ROOT,'js/game.js'),'utf8');
const from=source.indexOf('var S=')+6,to=source.lastIndexOf(';\nfor(var i=');
const scripts=JSON.parse(source.slice(from,to));
const node=()=>({style:{setProperty(){}},dataset:{},children:[],classList:{add(){},remove(){},toggle(){},contains(){return false}},append(){},appendChild(){},remove(){},replaceChildren(){},setAttribute(){},getAttribute(){return null},addEventListener(){},removeEventListener(){},querySelector(){return null},querySelectorAll(){return []},getBoundingClientRect(){return {width:1200,height:800,left:0,top:0}},getContext(){return {}},canPlayType(){return ''},getAnimations(){return []}});
const c={console,setTimeout:()=>0,setInterval:()=>0,clearInterval(){},clearTimeout(){},requestAnimationFrame:()=>0,cancelAnimationFrame(){},localStorage:{getItem(){return null},setItem(){},removeItem(){}},sessionStorage:{getItem(){return null},setItem(){}},document:{...node(),createElement:node,querySelector:node,getElementById:node,querySelectorAll:()=>[],documentElement:node(),body:node(),head:node(),hidden:false},navigator:{userAgent:'audit'},location:{search:'',protocol:'http:',pathname:'/'},innerWidth:1200,innerHeight:800,addEventListener(){},removeEventListener(){},matchMedia:()=>({matches:false,addEventListener(){}}),performance:{now:()=>0},Image:class{},Audio:class{canPlayType(){return ''}},MutationObserver:class{observe(){}},ResizeObserver:class{observe(){}},fetch:()=>Promise.resolve({json:()=>Promise.resolve({}),arrayBuffer:()=>Promise.resolve(new ArrayBuffer(0))}),URL,Blob,TextDecoder,TextEncoder,crypto:require('crypto').webcrypto,ItemSheet:{url:()=>'',icon:()=>'',ready:Promise.resolve()},ChellVisuals:{activate(){},portals(){}},ST_ROLE_ICON:{},ST_STORY:{},ST_TOONS:{},DyleShop:{renderSkins(){}}};
c.window=c;c.global=c;c.window.top=c;c.window.parent=c;vm.createContext(c);
const errors=[];
for(const [name,code] of scripts){if(name==='main.js')continue;try{vm.runInContext(code,c,{filename:name});}catch(e){errors.push([name,e.message]);}}
for(const file of ['js/boskers-globe.js','js/chell-kit.js']){
 try{vm.runInContext(fs.readFileSync(file==='js/chell-kit.js'&&process.env.STAGED_CHELL?process.env.STAGED_CHELL:path.join(ROOT,file),'utf8'),c,{filename:file});}catch(e){errors.push([file,e.message]);}
}
const audit=vm.runInContext(`(()=>{
const ids=PLAYABLE_IDS.filter(id=>HEROES[id]);
return {ids,heroes:ids.map(id=>({id,skills:Object.entries(HEROES[id].skills||{}).map(([key,s])=>{
 const logic=[s.cast,s.passive,s.onHit,s.perform].filter(f=>typeof f==='function').map(String).join('\\n');
 const p1=skillGrowthParams(s,1),p100=skillGrowthParams(s,100),p800=skillGrowthParams(s,800);
 const usedV=Object.keys(s.v||{}).filter(k=>new RegExp('\\\\bS\\\\.'+k+'\\\\b').test(logic));
 const usedP=Object.keys(s.p||{}).filter(k=>new RegExp('\\\\bP\\\\.'+k+'\\\\b').test(logic));
 return {key,name:s.name,v:s.v||{},p:s.p||{},fixedP:s.fixedP||[],cd:s.cd,usedV,usedP,passive:!!s.passive,cast:!!s.cast,mastery:logic.includes('skillMastery'),hasLevelGain:Object.keys(s.v||{}).some(k=>typeof s.v[k]==='number'&&s.v[k]!==0)||JSON.stringify(p1)!==JSON.stringify(p800)||!!s.cd,logic};
})}))};})()`,c);
if(require.main===module||process.env.WRITE_SKILL_AUDIT==='1')fs.writeFileSync(path.join(__dirname,'audit-before.json'),JSON.stringify({errors,...audit},null,2));
if(require.main===module){
console.log('Playable heroes:',audit.ids.length,'initialization errors:',errors.length);
console.log('No declared level gains:',audit.heroes.flatMap(h=>h.skills.filter(s=>!s.hasLevelGain).map(s=>h.id+'.'+s.key)));
console.log('Rule-only mastery passives:',audit.heroes.flatMap(h=>h.skills.filter(s=>s.mastery).map(s=>h.id+'.'+s.key)));
console.log('Unreferenced numeric parameters:',audit.heroes.flatMap(h=>h.skills.filter(s=>Object.keys(s.p).length&&!s.usedP.length&&!s.usedV.length).map(s=>h.id+'.'+s.key+' '+JSON.stringify(s.p))));
console.log('Initialization issues:',JSON.stringify(errors.slice(0,12)));
}
module.exports={c,audit,ROOT,errors};
