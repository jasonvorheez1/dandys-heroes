'use strict';
var NuggetRig=(()=>{
 const NS='http://www.w3.org/2000/svg';
 function create(host,options={}){
  const d=window.NUGGET_RIG_DATA,by=Object.fromEntries(d.parts.map(p=>[p.name,p])),base=options.assetBase||(typeof ASSET==='string'?ASSET+'Characters/Nugget/':'Characters/Nugget/');
  const node=(tag,a,p)=>{const n=document.createElementNS(NS,tag);for(const k in a)n.setAttribute(k,a[k]);p?.appendChild(n);return n;};
  const svg=node('svg',{viewBox:'0 0 188 332',class:'rig-svg','aria-label':'Nugget'},host);svg.style.cssText='display:block;width:100%;height:100%;overflow:visible';
  const root=node('g',{},svg),groups={root},springs={};
  function group(name){if(groups[name])return groups[name];return groups[name]=node('g',{'data-bone':name},group(by[name].parent));}
  for(const name of d.drawOrder){const p=by[name],[x,y,x2,y2]=p.rect;node('image',{href:base+p.src,x,y,width:x2-x,height:y2-y},group(name));}
  root.append(groups.legL,groups.legR,groups.torso);groups.torso.prepend(groups.armR);groups.torso.append(groups.armL,groups.head);
  const hotdog=node('g',{opacity:0},groups.forearmL);
  node('rect',{x:38,y:232,width:32,height:13,rx:6,fill:'#d69c58',stroke:'#755332','stroke-width':1},hotdog);
  node('rect',{x:39,y:235,width:30,height:6,rx:3,fill:'#a74631'},hotdog);
  node('path',{d:'M41 239 Q45 232 49 239 T57 239 T65 239',fill:'none',stroke:'#f6d25a','stroke-width':2},hotdog);
  let time=0;
  function spring(name,target,dt){const s=springs[name]||(springs[name]={x:0,v:0}),steps=Math.max(1,Math.ceil(dt/.008)),h=dt/steps;for(let i=0;i<steps;i++){s.v+=((target-s.x)*150-s.v*23)*h;s.x+=s.v*h;}return s.x;}
  function update(u={},dt=1/60){dt=Math.min(.1,Math.max(0,dt));time+=dt;const walk=u.moving||u.animState==='walk',s=Math.sin(time*7),b=Math.sin(time*1.8),p=Math.max(0,Math.min(1,1-(u.animT||0)/Math.max(.01,u.animDur||1))),pulse=Math.sin(p*Math.PI);
   const a={torso:walk?s*.7:b*.3,head:walk?-s*.9:Math.sin(time*1.3)*.7,earL:Math.sin(time*(walk?7:2)-.5)*(walk?3:1.2),earR:Math.sin(time*(walk?7:2)-1)*(walk?3:1.2),armL:walk?-s*7:0,armR:walk?s*7:0,forearmL:walk?s*3:0,forearmR:0,apron:Math.sin(time*(walk?7:2)-.8)*(walk?1.5:.4),legL:walk?s*7:0,legR:walk?-s*7:0};
   const style=u.animStyle||'';let offer=false;
   if(u.animState==='cast'){
    if(/Delivery|Toppings|Pack/.test(style)){offer=true;a.armL=-14*pulse;a.forearmL=-12*pulse;a.armR=8*pulse;a.head=-2*pulse;a.earL+=3*pulse;a.earR-=2*pulse;}
    else{a.torso=5*pulse;a.head=-3*pulse;a.armL=6*pulse;a.armR=-6*pulse;}
   }
   if(u.animState==='attack'){a.head=5*pulse;a.torso=3*pulse;}
   if(u.hitT>0){a.head=-3;a.earL=-4;a.earR=-4;}
   if(u.visualSleep||typeof Accessibility!=='undefined'&&Accessibility.enabled()){for(const n in a)a[n]=0;offer=false;}
   for(const n in a){const [x,y]=by[n].pivot;groups[n].setAttribute('transform',`rotate(${spring(n,a[n],dt).toFixed(3)} ${x} ${y})`);}
   hotdog.setAttribute('opacity',offer?1:0);
  }
  update({},0);return {svg,update,destroy(){svg.remove();}};
 }
 return {create,enabled(){return typeof Save==='undefined'||Save.data?.opt?.animatedChars!==false;}};
})();window.NuggetRig=NuggetRig;
