/* Cody's supplied idle PNG articulated as source-pixel cutout layers. */
'use strict';
var CodyRig=(()=>{
 const NS='http://www.w3.org/2000/svg';
 function create(host,options={}){
  const d=window.CODY_RIG_DATA,by=Object.fromEntries(d.parts.map(p=>[p.name,p]));
  const base=options.assetBase||(typeof ASSET==='string'?ASSET+'assets/toon-art/Cody/':'assets/toon-art/Cody/');
  const node=(tag,attrs,parent)=>{const e=document.createElementNS(NS,tag);for(const k in attrs)e.setAttribute(k,attrs[k]);parent?.appendChild(e);return e;};
  const svg=node('svg',{viewBox:'0 0 206 364',class:'rig-svg','aria-label':'Cody'},host);svg.style.cssText='display:block;width:100%;height:100%;overflow:visible';
  const root=node('g',{},svg),groups={root},springs={};
  function group(name){if(groups[name])return groups[name];return groups[name]=node('g',{'data-bone':name},group(by[name].parent));}
  for(const name of d.drawOrder){const p=by[name],[x,y,x2,y2]=p.rect;node('image',{href:base+p.src,x,y,width:x2-x,height:y2-y},group(name));}
  root.append(groups.legR,groups.legL,groups.torso);groups.torso.prepend(groups.armR);groups.torso.append(groups.armL,groups.head);
  groups.forearmL.prepend(groups.ball);
  let time=0;
  function spring(name,target,dt){const s=springs[name]||(springs[name]={x:0,v:0}),n=Math.max(1,Math.ceil(dt/.008)),h=dt/n;for(let i=0;i<n;i++){s.v+=((target-s.x)*140-s.v*23)*h;s.x+=s.v*h;}return s.x;}
  function update(u={},dt=1/60){
   dt=Math.min(.1,Math.max(0,dt));time+=dt;
   const move=u.moving||u.animState==='walk',p=Math.max(0,Math.min(1,1-(u.animT||0)/Math.max(.01,u.animDur||1))),strike=Math.sin(Math.PI*p),wind=Math.sin(Math.PI*Math.min(1,p/.38));
   const attack=u.animState==='attack',cast=u.animState==='cast',s=Math.sin(time*5.8);
   const a={torso:move?s*.7:Math.sin(time*.9)*.22,head:move?-s*.5:Math.sin(time*.6)*.45,armL:move?-s*5:0,forearmL:move?s*2:0,armR:move?s*5:0,forearmR:0,legL:move?s*7:0,legR:move?-s*7:0,footL:move?-s*3:0,footR:move?s*3:0,ball:Math.sin(time*(move?5.8:1.4)-.7)*(move?5:1.2)};
   if(attack||cast){
    const style=u.animStyle||'codyBasic';
    if(style==='codySetTrap'){a.torso=5*strike;a.head=-3*strike;a.armR=-20*strike;a.forearmR=-10*strike;}
    else if(style==='codyThrow'){a.torso=4*strike;a.armL=24*strike;a.forearmL=15*strike;a.ball=45*strike;}
    else if(style==='codySwing'||style==='codyFinale'){a.torso=3*strike;a.armL=-22*wind+28*strike;a.forearmL=14*strike;a.ball=70*Math.sin(p*Math.PI*2);}
    else{a.armL=-15*wind+24*strike;a.forearmL=12*strike;a.ball=-22*wind+30*strike;a.torso=3*strike;}
   }
   if(u.hitT>0){a.head=-3;a.torso=-2;}
   if(u.visualSleep||typeof Accessibility!=='undefined'&&Accessibility.enabled())for(const n in a)a[n]=0;
   for(const name in a){const [x,y]=by[name].pivot;groups[name].setAttribute('transform',`rotate(${spring(name,a[name],dt).toFixed(3)} ${x} ${y})`);}
   // No global idle bob: Cody's boots stay planted.
  }
  update({},0);return {svg,update,destroy(){svg.remove();}};
 }
 return {create,enabled(){return typeof Save==='undefined'||Save.data?.opt?.animatedChars!==false;}};
})();
window.CodyRig=CodyRig;
