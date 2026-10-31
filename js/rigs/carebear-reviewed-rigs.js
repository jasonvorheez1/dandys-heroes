'use strict';
var ReviewedCareBearRigs=(()=>{
 const NS='http://www.w3.org/2000/svg';let serial=0;
 const design={
 CheerbearShelly:{src:'assets/uploads/Cheerbearshelly.png',size:[227,241],hip:[114,188],neck:[114,130],badge:[114,151],parts:{legs:[73,188,148,241],torso:[58,125,165,198],armL:[31,132,88,188],armR:[142,132,180,182],head:[25,0,196,133]},pivots:{armL:[76,139],armR:[148,140]}},
 WishBearGigi:{src:'assets/uploads/wishgigi.png',size:[197,299],hip:[99,233],neck:[99,163],badge:[98,202],parts:{legs:[64,226,135,299],pack:[25,151,83,232],torso:[52,158,137,236],armL:[45,165,111,242],armR:[101,169,176,260],head:[27,93,169,168],cap:[26,0,169,100]},pivots:{armL:[65,174],armR:[122,178],cap:[99,97]}},
 TenderheartSprout:{src:'assets/uploads/tenderheartsprout.png',size:[204,492],hip:[111,421],neck:[106,257],badge:[112,370],parts:{pack:[0,236,78,347],legs:[67,413,161,492],torso:[49,256,161,429],armL:[15,286,81,419],armR:[139,279,202,423],head:[0,0,204,262]},pivots:{armL:[65,291],armR:[147,291]}},
 ShareBearCosmo:{src:'assets/uploads/sharebearcosmo.png',size:[252,380],hip:[130,314],neck:[128,181],badge:[132,277],parts:{legs:[92,309,182,380],torso:[83,201,187,321],armL:[57,157,116,250],armR:[153,156,216,250],head:[0,0,252,186]},pivots:{armL:[98,213],armR:[174,213]}}
 };
 const outlines={
 CheerbearShelly:{armL:'76,130 86,142 71,164 61,184 33,188 33,173 58,160 68,144',armR:'143,137 151,144 159,152 172,157 173,174 156,174 141,160'},
 WishBearGigi:{armL:'74,180 96,181 112,203 127,233 124,249 110,260 89,255 76,238 70,214',armR:'123,174 137,170 153,182 168,219 164,246 151,254 136,249 129,223 120,199'},
 TenderheartSprout:{armL:'64,285 83,300 73,329 63,375 65,396 56,416 36,420 24,411 30,390 40,353 47,321 48,300',armR:'143,285 156,298 163,325 175,366 183,388 181,410 166,420 148,403 148,381 142,351 135,321 135,298'},
 ShareBearCosmo:{armL:'84,157 108,158 116,186 108,215 100,246 78,249 66,236 70,211 78,190',armR:'172,158 191,156 211,163 216,180 203,202 190,238 177,249 156,242 153,221 164,190'}
 };
 const smooth=t=>{t=Math.max(0,Math.min(1,t));return t*t*(3-2*t);};
 function kit(id){return{enabled(){return typeof Save==='undefined'||Save.data?.opt?.animatedChars!==false;},create(host,options={}){
  const d=design[id],[w,h]=d.size,base=typeof ASSET==='string'?ASSET:'',node=(tag,a,p)=>{const e=document.createElementNS(NS,tag);for(const k in a)e.setAttribute(k,a[k]);p?.appendChild(e);return e;},svg=node('svg',{viewBox:`0 0 ${w} ${h}`,class:'rig-svg','aria-label':id},host);svg.style.cssText='display:block;width:100%;height:100%;overflow:visible';host.style.aspectRatio=`${w}/${h}`;
  const defs=node('defs',{},svg),root=node('g',{},svg),groups={},key='cbRig'+(++serial),src=options.assetBase?options.assetBase+d.src:base+d.src;
  const pieces={...d.parts};if(pieces.legs){const b=pieces.legs;pieces.legL=[b[0],b[1],d.hip[0],b[3]];pieces.legR=[d.hip[0],b[1],b[2],b[3]];delete pieces.legs;}
  const order=['pack','legL','legR','head','armL','armR','cap'].filter(n=>pieces[n]);
  function shape(n,fill,parent){const pts=outlines[id]?.[n],box=pieces[n];return pts?node('polygon',{points:pts,fill},parent):node('rect',{x:box[0],y:box[1],width:box[2]-box[0],height:box[3]-box[1],fill},parent);}
  for(const name of ['pack','legL','legR','torso','head','armL','armR','cap'].filter(n=>pieces[n])){
   const mask=node('mask',{id:key+name,maskUnits:'userSpaceOnUse',x:0,y:0,width:w,height:h},defs);
   if(name==='torso'){node('rect',{width:w,height:h,fill:'white'},mask);order.forEach(n=>shape(n,'black',mask));}
   else{shape(name,'white',mask);order.slice(order.indexOf(name)+1).forEach(n=>shape(n,'black',mask));}
   const parent=name==='cap'&&groups.head?groups.head:['head','armL','armR'].includes(name)?groups.torso:root;
   const g=node('g',{'data-bone':name},parent);node('image',{href:src,width:w,height:h,mask:`url(#${key+name})`},g);groups[name]=g;
  }
  const badge=node('path',{fill:'none',stroke:id==='WishBearGigi'?'#ffe587':'#ffabd1','stroke-width':2,opacity:0,'data-bone':'badge-glow'},svg),[bx,by]=d.badge;badge.setAttribute('d',`M${bx} ${by+8}C${bx-19} ${by-3} ${bx-10} ${by-15} ${bx} ${by-7}C${bx+10} ${by-15} ${bx+19} ${by-3} ${bx} ${by+8}Z`);
  const props={};for(const skill of ['W','G','B']){
   const prop=node('g',{'data-bone':'skill-prop-'+skill,opacity:0},svg);props[skill]=prop;
   if(id==='WishBearGigi'){
    if(skill==='B')node('path',{d:'M0 -15 4 -5 15 -4 7 4 9 15 0 9 -9 15 -7 4 -15 -4 -4 -5Z',fill:'#ffe38a',stroke:'#b88e53','stroke-width':1.6},prop);
    else{node('circle',{r:12,fill:'#ffd86f',stroke:'#8ecdda','stroke-width':2},prop);node('path',{d:'M-12 0H12',stroke:'#fff3dd','stroke-width':3},prop);node('circle',{cx:-4,cy:-4,r:3,fill:'#fff8e0'},prop);}
   }else if(id==='CheerbearShelly'){
    if(skill==='W'){['#ee8aa6','#f6c065','#aedb99','#8cced9'].forEach((col,i)=>node('path',{d:`M${-18+i*4} 6A${18-i*4} ${18-i*4} 0 0 1 ${18-i*4} 6`,fill:'none',stroke:col,'stroke-width':4},prop));}
    else{if(skill==='G'){node('rect',{x:-19,y:-12,width:38,height:29,rx:4,fill:'#d7b684',stroke:'#9c7659','stroke-width':2},prop);node('path',{d:'M-7 -12V-19H7V-12',fill:'none',stroke:'#9c7659','stroke-width':3},prop);}node('path',{d:'M13 5C16 -14 -13 -15 -14 2C-16 18 10 18 9 3C9 -6 -5 -6 -5 2C-5 8 4 8 3 2',fill:'none',stroke:'#f8dec0','stroke-width':4,'stroke-linecap':'round'},prop);}
   }else if(id==='TenderheartSprout'){
    node('path',{d:'M0 10C-23 -3 -12 -21 0 -10C12 -21 23 -3 0 10Z',fill:'#eb5c78',stroke:'#ffe1bc','stroke-width':2},prop);if(skill==='G')node('path',{d:'M-7 -11 0 -18 7 -11',fill:'none',stroke:'#71ba8a','stroke-width':3},prop);
   }else{for(const x of skill==='G'?[-14,14]:[0]){node('circle',{cx:x,cy:0,r:11,fill:'#c596d2',stroke:'#fae5d3','stroke-width':2},prop);node('path',{d:`M${x+7} 0C${x+7} -9 ${x-8} -9 ${x-7} 1C${x-6} 8 ${x+5} 7 ${x+4} 0C${x+3} -4 ${x-3} -3 ${x-2} 1 M${x} 11V28`,fill:'none',stroke:'#fae5d3','stroke-width':2},prop);}if(skill==='W')node('path',{d:'M-20 15Q0 25 20 15',fill:'none',stroke:'#b778b4','stroke-width':4},prop);}
  }
  const still=node('image',{href:src,width:w,height:h,'data-bone':'intact-idle'},svg);
  let time=0;function update(u={},dt=1/60,B){time+=Math.max(0,Math.min(.1,dt));const t=B?B.t:time,reduced=u.visualSleep||typeof FX!=='undefined'&&FX.reducedEffects||typeof Accessibility!=='undefined'&&Accessibility.enabled(),act=u.cbAction&&!u.cbAction.cancelled&&u.cbAction.end>t?u.cbAction:u.casting&&u.cbWind?u.cbWind:null,wind=u.casting?.t>0&&!act;let charge=wind?.45:0,release=0,recovery=0;
   if(act){const age=t-act.start,p=act.plan;charge=smooth(age/Math.max(.01,p.release))*(1-smooth((age-p.release)/.14));release=Math.sin(Math.PI*smooth((age-p.release)/Math.max(.01,p.end-p.release)));recovery=smooth((age-(p.end-.23))/.23);}
   const basic=!act&&u.animState==='attack'?Math.sin(Math.PI*(1-Math.max(0,u.animT||0)/Math.max(.01,u.animDur||.4))):0;const react=u.cbReaction&&u.cbReaction.end>t?Math.sin(Math.PI*(t-u.cbReaction.start)/(u.cbReaction.end-u.cbReaction.start)):0;const moving=!!u.moving,sway=Math.sin(time*2.1),stride=Math.sin(time*7);const a={torso:-2*charge+2*release,head:-3*charge+2*release+sway*.5,armL:9*charge-15*release-5*react-8*basic,armR:-9*charge+17*release+5*react+10*basic,legL:moving?stride*5:0,legR:moving?-stride*5:0,pack:sway,cap:0};
   if(id==='TenderheartSprout'){a.armL+=act?.key==='B'?-12*charge:0;a.armR+=act?.key==='B'?12*charge:0;}
   if(id==='ShareBearCosmo'){a.armL*=.22;a.armR*=.22;a.head*=.3;}
   if(id==='WishBearGigi'&&act?.key==='W'){a.cap=-22*smooth((t-act.start)/.28)*(1-recovery);groups.cap?.setAttribute('transform',`translate(0 ${(-18*(1-recovery)*smooth((t-act.start)/.28)).toFixed(2)}) rotate(${a.cap} 99 97)`);}
   else if(groups.cap)groups.cap.setAttribute('transform','');
   if(id==='WishBearGigi'&&!act&&u.cbReaction?.key==='jackpot'&&react)groups.cap?.setAttribute('transform',`translate(0 ${-14*react}) rotate(${-15*react} 99 97)`);
   if(reduced){for(const n in a)a[n]=0;groups.cap?.setAttribute('transform','');}
   for(const [n,g]of Object.entries(groups)){if(n==='cap')continue;const p=n==='head'?d.neck:n==='torso'?d.hip:d.pivots[n]||(n==='legL'?[d.hip[0]-12,d.hip[1]]:n==='legR'?[d.hip[0]+12,d.hip[1]]:d.hip);g.setAttribute('transform',`rotate(${(a[n]||0).toFixed(3)} ${p[0]} ${p[1]})`);}
   badge.setAttribute('opacity',reduced?0:Math.min(.9,charge*.8+release*.6+react*.5).toFixed(3));const visible=!!act&&!reduced;const x=id==='WishBearGigi'?99:d.badge[0]+(id==='ShareBearCosmo'?32:20),y=id==='WishBearGigi'?96-45*charge-30*release:d.badge[1]-15-20*release;
   for(const [k,prop]of Object.entries(props)){prop.setAttribute('opacity',visible&&act.key===k?Math.max(charge,release)*(1-recovery):0);prop.setAttribute('transform',`translate(${x} ${y}) rotate(${release*12})`);}
   if(id==='WishBearGigi'&&!act&&u.cbReaction?.key==='jackpot'&&react&&!reduced){props.B.setAttribute('opacity',react);props.B.setAttribute('transform',`translate(99 ${96-28*react})`);}
   const intact=reduced||!act&&!basic&&!moving&&!react;still.setAttribute('opacity',intact?1:0);root.setAttribute('opacity',intact?0:1);
   svg.setAttribute('data-phase',act?(t<act.start+act.plan.startup?'startup':t<act.release?'windup':t<act.end-.23?'active':'recovery'):wind?'windup':'idle');
  }update({},0);return{cbReviewed:true,svg,update,destroy(){svg.remove();}};
 }};}
 return Object.fromEntries(Object.keys(design).map(id=>[id,kit(id)]));
})();window.ReviewedCareBearRigs=ReviewedCareBearRigs;
