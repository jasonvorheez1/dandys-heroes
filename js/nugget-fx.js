'use strict';
var NuggetFX=(()=>{
 function hotdog(B,u,a){if(B.offscreen||typeof document==='undefined')return;const host=document.getElementById('fxFront');if(!host)return;
  const n=document.createElement('div');n.style.cssText=`position:absolute;left:${u.x-18}px;top:${u.y-65}px;width:36px;height:16px;pointer-events:none;z-index:3`;
  n.innerHTML='<svg viewBox="0 0 60 26"><rect x="2" y="3" width="56" height="21" rx="10" fill="#d99e55" stroke="#80552e" stroke-width="2"/><rect x="3" y="7" width="54" height="10" rx="5" fill="#a54732"/><path d="M8 14 Q13 3 18 14 T28 14 T38 14 T48 14" fill="none" stroke="#f4d252" stroke-width="3"/></svg>';host.appendChild(n);
  n.animate?.([{transform:'translate(0,0) rotate(-12deg)',opacity:1},{transform:`translate(${a.x-u.x}px,${a.y-u.y-18}px) rotate(12deg)`,opacity:1,offset:.8},{transform:`translate(${a.x-u.x}px,${a.y-u.y-8}px) scale(.8)`,opacity:0}],{duration:420,fill:'forwards'});B.after(.45,()=>n.remove());
 }
 function charge(B,u,a){if(!B.offscreen&&a)B.fxSlash(u,a,{col:'#e8c778',small:true});}
 function guard(B,u,a){if(!B.offscreen&&a)B.fxTargetLine(u,a,'#f3cf77');}
 function pack(B,u){if(!B.offscreen)B.fxFloatIcon(u.x,u.y-110,'THE WHOLE PACK!','#f3cf77');}
 return {hotdog,charge,guard,pack};
})();window.NuggetFX=NuggetFX;
