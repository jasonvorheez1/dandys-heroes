/* Shared progression corrections. Numeric combat values, upgrade previews
   and AI all continue to use the same native skill parameter pipeline. */
'use strict';
const SkillProgression = (() => {
  const originalGrowth=skillGrowthParams;
  const fixedGates=new Set(['need','finishNeed','ccNeed','cost','selfCost','tapeCost']);
  // These are activation thresholds, not capacities granted by levelling.
  for(const [id,key]of [['Coal','P'],['Blot','P'],['Looey','R']]){
    const skill=HEROES[id]?.skills[key];if(skill)skill.fixedP=[...new Set([...(skill.fixedP||[]),'max'])];
  }
  const anchorSkill=HEROES.Coal.skills.P;
  Object.assign(anchorSkill.p,{range:300,share:.25,aggro:1.2});
  anchorSkill.progression={...(anchorSkill.progression||{}),share:{max:.45}};
  anchorSkill.desc=(S,P)=>`At ${P.max} Weight, Coal becomes immovable and removes Slow. While anchored, he takes ${pcn(P.share*100)}% of the damage dealt to nearby allies within ${pcn(P.range)} range and gains ${pcn(P.aggro)} Aggro. Skill levels improve protection and reach; the Weight requirement stays fixed.`;
  anchorSkill.passive=(u,B,S,P)=>{
    B.on(u,'damaged',()=>B.applyStatus(u,u,'weight',999,{stacks:1}));
    B.every(u,.5,()=>{const w=u.getStatus('weight'),active=w&&w.stacks>=P.max;u.immovable=!!active;u.flat.aggro=active?P.aggro:.5;if(active)B.removeStatus(u,'slow');u.dirty=true;});
    B.on(u,'allyDamaged',ev=>{const w=u.getStatus('weight');if(!w||w.stacks<P.max||ev.unit===u||!u.alive||B.distance(ev.unit,u)>P.range)return;const amount=ev.amount*P.share;ev.amount-=amount;B.damage(ev.src,u,amount,{type:'true',redirected:true,tag:'anchor'});});
  };
  function intervalKey(key){return SKILL_INTERVAL_KEYS.has(key)||key==='interval'||/(?:Cd|Cooldown|Interval|Every)$/.test(key);}
  skillGrowthParams=function(skill,level){
    const out=originalGrowth(skill,level);
    for(const [key,value] of Object.entries(skill?.p||{})){
      if(typeof value!=='number'||!Number.isFinite(value)||skill.fixedP?.includes(key))continue;
      const rule=skill.progression?.[key];
      if(rule?.fixed||fixedGates.has(key))out[key]=value;
      else if(rule?.type==='cooldown'||intervalKey(key))out[key]=Math.round(value*skillCooldownMult(level)*1000)/1000;
      else if(!SKILL_COUNT_KEYS.has(key)){
        const grown=value*skillUtilityMult(level);
        out[key]=Math.round((['thr','full','crit'].includes(key)?Math.min(.95,grown):grown)*100000)/100000;
      }
      if(key==='basicEvery')out[key]=Math.max(1,Math.ceil(out[key]));
      if(rule?.max!=null)out[key]=Math.min(rule.max,out[key]);
      if(rule?.min!=null)out[key]=Math.max(rule.min,out[key]);
    }
    return out;
  };

  // defHero supplies mastery for rule-only skills, but its old bag key was
  // not a recognized modifier. Migrate it before native stat recomputation.
  const recompute=Unit.prototype.recompute;
  Unit.prototype.recompute=function(){
    for(const key of Object.keys(this.flat||{}))if(/^skillMastery[WGBPR]$/.test(key)){
      this.flat['cdr'+key[0].toUpperCase()+key.slice(1)]=this.flat[key];delete this.flat[key];
    }
    return recompute.apply(this,arguments);
  };

  const labels={dropAtk:'Portal drop damage',relayAtk:'Gel ricochet damage',cubeAtk:'Cube / rocket damage',capAtk:'Redirect damage cap',bounceAtk:'Repulsion damage',guardPct:'Portal damage reduction',flingRatio:'Fling chain damage',loopBonus:'Infinite Fall bonus',mastery:'Skill Haste',disDur:'Disorientation',escapeCd:'Escape cooldown',momentumEva:'Momentum evasion',momentumMs:'Momentum movement speed',blueEvasion:'Repulsion evasion',orangeAspd:'Propulsion attack speed',orangeMs:'Propulsion movement speed'};
  const chellLabels={
    W:{ramAtk:'Travel distance bonus',bigAtk:'Heavy target bonus',count:'Portal targets',momentum:'Movement buff duration'},
    G:{cubeAtk:'Rocket damage',redirect:'Returned damage',capAtk:'Return damage cap',cover:'Cover duration',coverPct:'Cover damage reduction',drain:'Energy drained'},
    B:{slowDur:'Slow duration',evasionDur:'Evasion duration',spread:'Clustering range',dur:'Propulsion duration',redHaste:'Red Skill Haste',redDrain:'Red Energy drain'},
    P:{cubeAtk:'Bonus cube damage',evaPct:'Evasion',guardDur:'Protection duration',cubeStun:'Cube interrupt duration',redEnergy:'Red Energy gain'},
    R:{dropAtk:'Override drop damage',hpPct:'Max HP bonus',evaPct:'Evasion bonus',hastePct:'Skill Haste bonus',bridgeDr:'Bridge damage reduction',bridgeDur:'Bridge duration',stun:'Landing stun'}
  };
  for(const [key,names]of Object.entries(chellLabels))HEROES.Chell.skills[key].valueLabels=names;
  function unitFor(key,kind,skill){
    if(key==='basicEvery')return 'number';
    if(intervalKey(key)||SKILL_DURATION_KEYS.has(key)||/(?:Dur|Duration|Stun|Sleep|Root|Silence|Blind|Fear)$/.test(key)||key==='momentum'||key==='cover')return 'seconds';
    if(kind==='p'&&(SKILL_COUNT_KEYS.has(key)||SKILL_AREA_KEYS.has(key)))return 'number';
    if(skill?.desc&&new RegExp('\\b'+(kind==='p'?'P':'S')+'\\.'+key+'\\s*\\*\\s*100\\b').test(String(skill.desc)))return 'ratio';
    if(/Pct$/.test(key))return 'points';
    if(/(?:ratio|atk|mag|damage|dmg|heal|shield|regen|reduction|eva|crit|aspd|mastery|bonus|guardPct|orangeMs|momentumMs|flingRatio|bridgeDr|redirect|chance|perStack|^per$|^thr$|^full$|^share$|exec)/i.test(key))return 'ratio';
    return 'number';
  }
  const clean=(n,d)=>d>0?n.toFixed(d).replace(/\.?0+$/,''):n.toFixed(0);
  function pair(key,kind,a,b,skill){
    const unit=unitFor(key,kind,skill);if(unit==='ratio'){a*=100;b*=100;}
    let digits=unit==='number'&&Number.isInteger(a)&&Number.isInteger(b)?0:1;
    while(digits<4&&a.toFixed(digits)===b.toFixed(digits))digits++;
    const suffix=unit==='ratio'||unit==='points'?'%':unit==='seconds'?'s':'';
    return [clean(a,digits)+suffix,clean(b,digits)+suffix];
  }
  SkillDesc.rankPreview=function(skill,level,stats,to,limit){
    if(!skill||level>=SKILL_EFFECTIVE_MAX_LEVEL)return '';
    const next=Math.min(SKILL_EFFECTIVE_MAX_LEVEL,to||level+1),a=this.safeParams(skill,level,stats),b=this.safeParams(skill,next,stats),changes=[];
    for(const [kind,now,later] of [['v',a.S,b.S],['p',a.P,b.P]])for(const key of Object.keys(now)){
      if(changes.length>=(limit||3)||!Number.isFinite(now[key])||!Number.isFinite(later[key])||Math.abs(now[key]-later[key])<.000001)continue;
      const [before,after]=pair(key,kind,now[key],later[key],skill);
      const label=skill.valueLabels?.[key]||labels[key]||key.replace(/([A-Z])/g,' $1').replace(/^./,c=>c.toUpperCase());
      changes.push(`<div class="sk-next-item"><span class="sk-next-label">${label}</span> <b class="sk-next-diff">${before} → ${after}</b></div>`);
    }
    if(skill.cd&&changes.length<(limit||3)){
      const [before,after]=pair('cooldown','p',this.cooldown(skill,level,stats),this.cooldown(skill,next,stats));
      changes.push(`<div class="sk-next-item"><span class="sk-next-label">Cooldown</span> <b class="sk-next-diff">${before} → ${after}</b></div>`);
    }
    return changes.join('');
  };
  const oldFormat=SkillDesc.format;
  SkillDesc.format=function(heroId,key,skill,level,spec){
    const html=oldFormat.apply(this,arguments);
    if(!skill||key==='basic')return html;
    const stats=this.getStats(heroId,spec),lv=Math.max(1,level||1);
    let next=Math.min(SKILL_EFFECTIVE_MAX_LEVEL,lv+1);
    if(typeof Save!=='undefined'&&Save.data&&typeof Progress!=='undefined'){
      const hero=Save.hero(heroId);
      if(hero?.skills?.[key]>=Progress.skillCap(heroId))next=lv;
    }
    const now=this.safeParams(skill,lv,stats),later=this.safeParams(skill,next,stats),low=this.safeParams(skill,1,stats),high=this.safeParams(skill,SKILL_EFFECTIVE_MAX_LEVEL,stats);
    const rows=[];
    for(const [kind,a,b,first,last] of [['v',now.S,later.S,low.S,high.S],['p',now.P,later.P,low.P,high.P]])for(const name of Object.keys(a)){
      if(!Number.isFinite(a[name])||!Number.isFinite(b[name])||Math.abs(first[name]-last[name])<.000001)continue;
      const [before,after]=pair(name,kind,a[name],b[name],skill);const label=skill.valueLabels?.[name]||labels[name]||name.replace(/([A-Z])/g,' $1').replace(/^./,c=>c.toUpperCase());
      rows.push(`<tr><th scope="row">${label}</th><td>${before}</td>${next>lv?`<td class="${Math.abs(a[name]-b[name])<.000001?'unchanged':''}">${after}</td>`:''}</tr>`);
    }
    if(skill.cd){const [a,b]=pair('cooldown','p',this.cooldown(skill,lv,stats),this.cooldown(skill,next,stats));rows.push(`<tr><th scope="row">Cooldown</th><td>${a}</td>${next>lv?`<td>${b}</td>`:''}</tr>`);}
    if(!rows.length)return html;
    return html+`<section class="skill-rank-values" aria-label="Skill level values"><b>Skill level values</b><table><thead><tr><th>Effect</th><th>Lv ${lv}</th>${next>lv?`<th>Lv ${next}</th>`:''}</tr></thead><tbody>${rows.join('')}</tbody></table>${rows.some(row=>row.includes('unchanged'))?'<small>Some counts increase only at later ranks.</small>':''}</section>`;
  };
  function statusText(s){
    const v=s?.chellValues;if(!v)return null;const pct=n=>(n*100).toFixed(1).replace(/\.0$/,'')+'%';
    if(s.id==='chell_momentum')return `Evasion +${pct(v.eva)}; Movement Speed +${pct(v.ms)}.`;
    if(s.id==='chell_portal_guard'||s.id==='chell_cover'||s.id==='chell_bridge')return `Damage Reduction: ${pct(v.reduction)}.`;
    if(s.id==='chell_repulsion')return `Evasion +${pct(v.eva)} from Repulsion Gel.`;
    if(s.id==='chell_propulsion')return `Movement Speed +${pct(v.ms)}; Attack Speed +${pct(v.aspd)}${v.haste?`; Skill Haste +${pct(v.haste)}`:''}.`;
    return null;
  }
  function withStatusText(statuses,fn){
    const original=new Map();
    for(const s of statuses){const text=statusText(s);if(text&&STATUS[s.id]){if(!original.has(s.id))original.set(s.id,STATUS[s.id].desc);STATUS[s.id].desc=text;}}
    try{return fn();}finally{for(const [id,desc]of original)STATUS[id].desc=desc;}
  }
  const chip=battleStatusChip;
  battleStatusChip=function(s){const args=arguments;return withStatusText([s],()=>chip.apply(this,args));};
  const statusDetails=Battle.prototype.showStatusDetails;
  Battle.prototype.showStatusDetails=function(unit,id){const args=arguments;return withStatusText(unit.statuses.filter(s=>id==='__all__'||s.id===id),()=>statusDetails.apply(this,args));};
  return {intervalKey,previewPair:pair,statusText};
})();
