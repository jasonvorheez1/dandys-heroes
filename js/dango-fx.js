/* Simulation-owned cream splats on the battlefield floor. */
'use strict';
var DangoFX=(()=>{
 const NS='http://www.w3.org/2000/svg';
 function svg(B,x,y,w,h,life){
  if(B.offscreen||typeof document==='undefined'||typeof FX!=='undefined'&&FX.reducedEffects)return;
  const host=document.getElementById('fxBack');if(!host)return;
  const e=document.createElementNS(NS,'svg');e.setAttribute('viewBox','0 0 160 60');e.style.cssText=`position:absolute;left:${x-w/2}px;top:${y-h/2}px;width:${w}px;height:${h}px;overflow:visible;pointer-events:none`;
  e.innerHTML='<path d="M8 33 Q1 16 26 18 Q32 1 57 14 Q78 -1 100 14 Q126 5 130 20 Q158 15 155 34 Q166 50 134 48 Q116 65 94 49 Q65 63 50 49 Q15 59 17 44 Q0 47 8 33 Z" fill="#fff3d9" stroke="#d5bda1" stroke-width="2"/><path d="M30 26 Q57 10 84 22 M105 31 Q119 22 134 29" fill="none" stroke="#fffdf4" stroke-width="4" stroke-linecap="round"/>';
  host.appendChild(e);e.animate?.([{opacity:0,transform:'scale(.65)'},{opacity:.85,transform:'scale(1)',offset:.08},{opacity:.85,offset:.85},{opacity:0}],{duration:life*1000,fill:'forwards'});
  B.after(life,()=>e.remove());
 }
 return {puddle(B,x,depth,dur,radius){svg(B,x,B.ground+((depth||.5)-.5)*(B.depthSpan||100),radius*2,32,dur);},splash(B,x,y){svg(B,x,y-8,58,36,.4);}};
})();
window.DangoFX=DangoFX;
