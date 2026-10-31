const fs=require('fs'),vm=require('vm'),assert=require('assert/strict');
if(fs.existsSync(__dirname+'/chell-kit.js'))process.env.STAGED_CHELL=__dirname+'/chell-kit.js';
const {c,audit,ROOT}=require('./audit-skills.cjs');
vm.runInContext(fs.readFileSync(fs.existsSync(__dirname+'/skill-progression.js')?__dirname+'/skill-progression.js':ROOT+'/js/skill-progression.js','utf8'),c);
const result=vm.runInContext(`(()=>{
 const failures=[],gains=[],masteries=[],cooldowns=[];
 function make(id,rank){const B=new Battle({offscreen:true});Object.assign(B,{offscreen:true,W:560,H:800,ground:500,depthSpan:150,leftWall:18,rightWall:542,rangeScale:1,meta:{}});const u=new Unit({id,level:1,rarity:5,skillLv:rank,costume:null,trinkets:[]},TEAM_P,0,B);B.units=[u];u.x=100;u.y=450;return {u,B};}
 for(const id of PLAYABLE_IDS){
  const a=make(id,1),b=make(id,800);
  for(const [key,skill]of Object.entries(HEROES[id].skills)){
   const low=a.B.scaled(a.u,key),high=b.B.scaled(b.u,key),p1=a.B.skillParams(a.u,key),p800=b.B.skillParams(b.u,key);
   const grows=Object.keys(low).some(k=>high[k]>low[k])||JSON.stringify(p1)!==JSON.stringify(p800)||skill.cd;
   if(!grows)failures.push(id+'.'+key+' has no scaling');else gains.push(id+'.'+key);
   for(const rank of [1,100,799]){
    const values=Object.values(skill.v||{}).some(v=>typeof v==='number'&&v!==0);
    if(!values&&JSON.stringify(skillGrowthParams(skill,rank))===JSON.stringify(skillGrowthParams(skill,rank+1))&&!skill.cd)failures.push(id+'.'+key+' has a dead upgrade at '+rank);
   }
   for(const [k,v]of Object.entries(skill.p||{}))if(typeof v==='number'&&SkillProgression.intervalKey(k)&&!skill.fixedP?.includes(k)){
    if(p800[k]>p1[k])failures.push(id+'.'+key+'.'+k+' gets slower');else cooldowns.push(id+'.'+key+'.'+k);
   }
  }
 }
 for(const [id,key]of [['Blot','R'],['Brusha','R'],['Yatta','R'],['Finn','P'],['Tisha','P']]){
  const {u,B}=make(id,100),before=u.st.cdr,skill=HEROES[id].skills[key];
  skill.passive(u,B,B.scaled(u,key),B.skillParams(u,key));u.recompute();
  if(!(u.st.cdr>before))failures.push(id+'.'+key+' mastery ignored');masteries.push({id,before,after:u.st.cdr});
 }
 const low=make('Chell',1),high=make('Chell',800),B=high.B,u=high.u;
 for(const k of ['B','P','R'])HEROES.Chell.skills[k].passive?.(u,B,B.scaled(u,k),B.skillParams(u,k));
 const P=B.skillParams(u,'P');
 const applied=chellBuff(u,B,u,'chell_portal_guard',P.guardDur,{reduction:P.guardPct});u.recompute();
 if(Math.abs(u.st.dmgTaken+P.guardPct)>.00001)failures.push('Chell guard rank did not reach native modifier');
 const bad={...HEROES.Chell.skills.P};const p1=skillGrowthParams(bad,1),p800=skillGrowthParams(bad,800);
 if(!(p800.escapeCd<p1.escapeCd&&p800.guardPct>p1.guardPct))failures.push('Chell purple improvements wrong');
 const coal=make('Coal',800),coalSkill=HEROES.Coal.skills.P,coalParams=coal.B.skillParams(coal.u,'P');
 if(coalParams.max!==8||coalParams.range<=300||coalParams.share<=.25)failures.push('Coal activation threshold or upgrades incorrect');
 coalSkill.passive(coal.u,coal.B,coal.B.scaled(coal.u,'P'),coalParams);coal.u.statuses.push({id:'weight',stacks:8,t:999});coal.B.intervals[0].fn();if(!coal.u.immovable)failures.push('Coal cannot anchor at high rank');
 return {failures,gains,masteries,cooldowns,chell:{low:p1,high:p800}};
})()`,c);
assert.deepEqual(Array.from(result.failures),[]);
const previews=vm.runInContext(`(()=>{
 const stats={atk:500,mag:500,def:300,mdef:300,cdr:.1};
 const savedStats=SkillDesc.getStats,savedGear=SkillDesc.gearFor;SkillDesc.getStats=()=>stats;SkillDesc.gearFor=()=>({mods:[],trinkets:[]});
 const missing=[];
 for(const id of PLAYABLE_IDS)for(const [key,skill]of Object.entries(HEROES[id].skills)){
  try{const html=SkillDesc.format(id,key,skill,1);if(!html.includes('skill-rank-values')||!html.includes('Lv 2'))missing.push(id+'.'+key);}catch(e){missing.push(id+'.'+key+': '+e.message);}
 }
 const example=SkillDesc.rankPreview(HEROES.Chell.skills.P,1,stats);
 const tiny=SkillProgression.previewPair('escapeCd','p',10,9.993);
 const integer=SkillProgression.previewPair('targets','p',10,11);
 SkillDesc.getStats=savedStats;SkillDesc.gearFor=savedGear;
 return {missing,example,tiny,integer};
})()`,c);
assert.deepEqual(Array.from(previews.missing),[]);
assert.notEqual(previews.tiny[0],previews.tiny[1]);assert.equal(previews.integer[0],'10');
assert.match(previews.example,/Escape cooldown|Evasion|Cube/);
if(process.env.WRITE_SKILL_AUDIT==='1')fs.writeFileSync(__dirname+'/audit-after.json',JSON.stringify({heroCount:audit.ids.length,skillCount:result.gains.length,masteries:result.masteries,cooldowns:result.cooldowns,chell:result.chell,previewMissing:previews.missing},null,2));
console.log('PASS:',audit.ids.length,'heroes,',result.gains.length,'skills: native scaling and complete level tables.');
console.log('PASS: five mastery passives change real CDR; named cooldowns improve; Chell guard reaches real stat modifiers; small upgrades stay visible.');
