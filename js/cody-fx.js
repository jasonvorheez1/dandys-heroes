'use strict';
var CodyFX=(()=>{
 const NS='http://www.w3.org/2000/svg';
 function root(B,x,y,w,h,life){
  if(B.offscreen||typeof document==='undefined'||typeof FX!=='undefined'&&FX.reducedEffects)return;
  const host=document.getElementById('fxBack');if(!host)return;
  const e=document.createElementNS(NS,'svg');e.setAttribute('viewBox',`0 0 ${w} ${h}`);e.style.cssText=`position:absolute;left:${x-w/2}px;top:${y-h/2}px;width:${w}px;height:${h}px;pointer-events:none;overflow:visible`;host.appendChild(e);B.after(life,()=>e.remove());return e;
 }
 function ground(B,depth){return B.ground+((depth||.5)-.5)*(B.depthSpan||100);}
 function trap(B,u,_,p){const e=root(B,p.x,ground(B,p.depth),52,26,20);if(!e)return;p.el=e;
  e.innerHTML='<ellipse cx="26" cy="16" rx="24" ry="9" fill="#1b1b1b" opacity=".3"/><path d="M4 15 Q26 -2 48 15 L42 14 39 7 34 12 30 5 26 11 22 5 18 12 13 7 10 14Z" fill="#71747a" stroke="#26272a" stroke-width="1.4"/><path d="M4 15 Q26 32 48 15 L42 16 39 23 34 18 30 25 26 19 22 25 18 18 13 23 10 16Z" fill="#8d9197" stroke="#26272a" stroke-width="1.4"/><rect x="22" y="11" width="8" height="7" rx="1" fill="#ae7734"/>';
  e.style.opacity='.42';
 }
 function snap(B,u,t,p){if(p.el){p.el.style.opacity='1';p.el.animate?.([{transform:'scaleY(1)'},{transform:'scaleY(.18)'},{transform:'scaleY(.45)'}],{duration:160,fill:'forwards'});B.after(.35,()=>p.el?.remove());}if(!B.offscreen)B.fxSlash(u,t,{col:'#c9cbd0',small:true});}
 function chain(B,u,t){const x=(u.x+t.x)/2,y=(u.y+t.y)/2-48,w=Math.max(20,Math.abs(t.x-u.x)+30),e=root(B,x,y,w,50,.45);if(!e)return;
  const left=t.x>u.x?10:w-10,right=t.x>u.x?w-10:10;
  e.innerHTML=`<path d="M${left} 25 Q${w/2} 40 ${right} 25" fill="none" stroke="#242629" stroke-width="7"/><path d="M${left} 25 Q${w/2} 40 ${right} 25" fill="none" stroke="#94989d" stroke-width="4" stroke-dasharray="5 4"/><image href="Characters/Cody/parts/ball.png" x="${right-17}" y="8" width="34" height="34"/>`;
 }
 function sweep(B,u){if(B.offscreen)return;const e=root(B,u.x,u.y-35,150,60,.35);if(e)e.innerHTML='<path d="M8 15 Q75 87 142 15" fill="none" stroke="#b2b4ba" stroke-width="6" stroke-linecap="round" opacity=".65"/>';}
 function slam(B,u,t){if(!B.offscreen){B.fxSlash(u,t,{col:'#d5bb8b',big:true});B.shake(3,.12);}}
 return {trap,snap,chain,sweep,slam};
})();
window.CodyFX=CodyFX;
