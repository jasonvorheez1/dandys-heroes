/* Dango: source-pixel cutout rig. No dependencies; works from file:// as well. */
(() => {
  'use strict';
  const NS='http://www.w3.org/2000/svg';
  function create(host, options={}) {
    const data=window.DANGO_RIG_DATA;
    if(!data) throw new Error('Load rig-data.js before creating DangoRig.');
    const base=options.assetBase || (typeof ASSET==='string'?ASSET+'assets/toon-art/Dango/':'./');
    const make=(tag,attrs,parent)=>{
      const e=document.createElementNS(NS,tag);
      Object.entries(attrs||{}).forEach(([k,v])=>e.setAttribute(k,v));
      parent.appendChild(e);return e;
    };
    const svg=make('svg',{viewBox:`-95 -65 ${data.width+190} ${data.height+130}`,role:'img','aria-label':'Animated Dango character'},host);
    svg.style.cssText='display:block;width:100%;height:100%;overflow:visible';
    const root=make('g',{},svg), facing=make('g',{},root), groups={root:facing};
    const byName=Object.fromEntries(data.parts.map(p=>[p.name,p]));
    function group(name){
      if(groups[name])return groups[name];
      const p=byName[name];return groups[name]=make('g',{'data-bone':name},group(p.parent));
    }
    // Hierarchy controls transforms; explicit order controls painter's layering.
    group('torso');group('head');
    for(const name of data.drawOrder){
      const p=byName[name],g=group(name),[x,y,x2,y2]=p.rect;
      make('image',{href:base+p.src,x,y,width:x2-x,height:y2-y},g);
    }
    // Arms lie above the dress but below the head. Hair follows the head.
    groups.torso.append(groups.armL,groups.armR,groups.head);
    groups.head.append(groups.hair);
    facing.append(groups.legL, groups.legR, groups.torso);
    const sweat=make('path',{d:'M443 210 Q426 236 431 245 Q443 258 453 245 Q459 235 443 210',fill:'#b4f0e6',stroke:'#487f7c','stroke-width':3,opacity:0},groups.head);
    let time=0, mode='idle', speed=1, face=1;
    const manual={},springs={};
    function spring(name,target,dt){const s=springs[name]||(springs[name]={x:target,v:0});const n=Math.max(1,Math.ceil(dt/.008)),h=dt/n;for(let i=0;i<n;i++){s.v+=((target-s.x)*150-s.v*22)*h;s.x+=s.v*h;}return s.x;}
    const rotate=(name,a)=>{
      const [x,y]=byName[name].pivot;
      groups[name].setAttribute('transform',`rotate(${a} ${x} ${y})`);
    };
    function update(unit={},dt=1/60){
      time+=Math.max(0,Math.min(dt,.1))*speed;
      const state=unit.visualSleep?'rest':unit.hitT>0?'hurt':unit.casting?'cast':unit.moving?'walk':((unit.animState==='move'?'walk':unit.animState==='hit'?'hurt':unit.animState==='attack'?'basic':unit.animState)||mode);
      const meltdown=state==='meltdown'||unit.hasStatus?.('dango_meltdown');
      face=unit.face<0?-1:unit.face>0?1:face;
      facing.setAttribute('transform',options.preview&&face<0?`translate(${data.width} 0) scale(-1 1)`:'');
      const walk=state==='walk'||state==='run'||meltdown;
      const t=time*(meltdown?14:state==='run'?12:9),s=Math.sin(t),b=Math.sin(time*2.1);
      let angles={torso:walk?s*.7:b*.25,head:walk?-s*.9:Math.sin(time*1.6)*.7,
        hair:walk?Math.sin(t-.8)*2.4:Math.sin(time*1.6-.8)*1.1, dango:walk?Math.sin(t-.6)*1.4:Math.sin(time*1.6-.5)*.5,
        armL:walk?s*8:0,armR:walk?-s*8:0,
        forearmL:walk?4+Math.max(0,s)*12:0,forearmR:walk?-4-Math.max(0,-s)*12:0,
        legL:walk?-s*7:0,legR:walk?s*7:0,
        shinL:walk?-Math.max(0,-s)*10:0,shinR:walk?Math.max(0,s)*10:0,
        footL:walk?s*3:0,footR:walk?-s*3:0};
      let bob=walk?-Math.abs(Math.cos(t))*4:b*1.5;
      if(state==='standing'||state==='rest'){Object.keys(angles).forEach(k=>angles[k]=0);bob=0;}
      const p=Math.max(0,Math.min(1,1-(unit.animT||0)/Math.max(.01,unit.animDur||1))),pulse=Math.sin(p*Math.PI),style=unit.animStyle;
      if(state==='cast'||state==='prepare'){angles.armR=-9;angles.armL=9;angles.forearmL=30;angles.forearmR=-30;angles.head=-3;angles.hair=2;
        if(style==='dangoCream'){angles.armL=25*pulse;angles.forearmL=28*pulse;angles.armR=-20*pulse;angles.forearmR=-12*pulse;angles.head=3*pulse;}
        if(style==='dangoPerfect'){angles.armL=18+Math.sin(time*14)*8;angles.armR=-angles.armL;angles.forearmL=20;angles.forearmR=-20;angles.head=Math.sin(time*12)*2;}
        if(style==='dangoRescue'){angles.torso=-5;angles.armL=30;angles.forearmL=15;angles.head=5;}
      }
      if(state==='basic'){angles.armR=-20*pulse;angles.forearmR=-22*pulse;angles.torso=2*pulse;}
      if(state==='hurt'){angles.torso=-3;angles.head=5;angles.armL=-8;angles.armR=8;}
      if(typeof Accessibility!=='undefined'&&Accessibility.enabled()){Object.keys(angles).forEach(k=>angles[k]=0);bob=0;}
      for(const name in angles)if(byName[name])rotate(name,spring(name,manual[name]??angles[name],Math.max(0,Math.min(dt,.1))*speed));
      sweat.setAttribute('opacity',meltdown||state==='hurt'||state==='prepare'||unit.casting?.key==='B'?.85:0);
      root.setAttribute('transform',`translate(0 ${bob})`);
    }
    update({animState:'standing'},0);
    return {svg,update,setAnimation(value){mode=value;},setSpeed(value){speed=value;},
      setBone(name,degrees){if(!(name in byName))throw new Error('Unknown bone '+name);manual[name]=degrees;update({},0);},
      resetBones(){Object.keys(manual).forEach(k=>delete manual[k]);},
      destroy(){svg.remove();},get data(){return data;}};
  }
  window.DangoRig={create, enabled(){return typeof Save==='undefined' || Save.data?.opt?.animatedChars !== false;}};
})();
