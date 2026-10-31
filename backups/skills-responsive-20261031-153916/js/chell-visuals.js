/* Chell: native sprite animation, personality cores, and linked portal effects.
   Combat callbacks and all visual timelines use simulation time, not wall timers. */
'use strict';
const ChellVisuals = (() => {
  const BASE=(typeof ASSET==='string'?ASSET:'')+'assets/aperture/chell/';
  const motion=new Image();motion.src=BASE+'chell-motion-v3.png';
  const props=new Image();props.src=BASE+'chell-props.png';
  let frames={};
  const ready=fetch(BASE+'chell-props.json').then(r=>r.json()).then(j=>{frames=j;}).catch(()=>{});
  const clamp01=n=>Math.max(0,Math.min(1,n));
  const lerp=(a,b,t)=>a+(b-a)*t;
  const CORES={curiosity:'core-frame-orange',intelligence:'core-frame-red',anger:'core-frame-purple',morality:'core-frame-blue'};

  // Native sound routing honors the SFX slider, mute, scene cleanup and voice limits.
  const cues={
    chell_core_curiosity:['core-squeal-0.ogg','core-squeal-6.ogg','core-squeal-8.ogg'],
    chell_core_intelligence:['core-a-10.ogg','core-a-13.ogg','core-a-18.ogg'],
    chell_core_anger:['core-b-0.ogg','core-b-3.ogg','core-b-7.ogg'],
    chell_portal_fire:['portal-gun-fire-orange.mp3'],chell_portal_open:['open.ogg'],chell_cube_hit:['clank-b.ogg']
  };
  CUE_SOURCES.push([cues,BASE+'voice/']);
  const originalMix=soundMix;
  soundMix=function(cue){
    if(cue.startsWith('chell_core_'))return {bus:'creature',gain:.82,throttle:4500,perCue:1,maxMs:3200,fadeMs:130,musicDip:[.82,1300]};
    if(cue==='chell_portal_fire')return {bus:'ability',gain:.5,throttle:180,perCue:2,maxMs:3000,fadeMs:120};
    if(cue.startsWith('chell_'))return {bus:'ability',gain:.5,throttle:180,perCue:2,maxMs:850,fadeMs:100};
    return originalMix(cue);
  };

  function anchor(B,u,feet=false){const a=B.unitFxAnchor(u);return {x:a.x,y:feet?u.y:a.y,size:a.size};}
  function state(B){
    if(B.offscreen)return null;
    if(B._chellScene)return B._chellScene;
    const host=typeof FX!=='undefined'?FX:null;
    if(!host?.front||!host?.back)return null;
    const s={effects:[],canvases:[],audio:[],bodyUnits:new Set(),lastVoice:-Infinity};
    for(const layer of ['back','front']){
      const c=document.createElement('canvas');c.className='chell-portal-layer';c.setAttribute('aria-hidden','true');
      c.style.cssText='position:absolute;inset:0;width:100%;height:100%;pointer-events:none;image-rendering:pixelated;';
      host[layer].appendChild(c);s[layer]=c;s.canvases.push(c);
    }
    return B._chellScene=s;
  }
  function effect(B,e){const s=state(B);if(s){if(s.effects.length>=48)s.effects.shift();s.effects.push(e);}return e;}
  function activate(u,B,core){(u._chellCores||=new Set()).add(core);state(B);}
  function charge(u,B,count=1){
    u._chellCharge=clamp((u._chellCharge||0)+count,0,3);
    const existing=u.getStatus?.('chell_charge');
    if(u._chellCharge===0&&existing&&B.removeStatus)B.removeStatus(u,'chell_charge');
    else if(existing){existing.stacks=u._chellCharge;u.dirty=true;}
    else if(u._chellCharge>0)B.applyStatus(u,u,'chell_charge',999,{stacks:u._chellCharge});
  }
  function spend(u,B,cost,name){
    if((u._chellCharge||0)<cost)return false;
    charge(u,B,-cost);u._chellCombo={name,until:B.t+1.8};return true;
  }
  function delivery(u,B,target){
    const gel=u._chellGel?.until>B.t?u._chellGel:null;
    charge(u,B,gel?.charged&&!gel.blue?2:1);
    if(gel?.charged&&gel.blue){
      const next=B.nearest(target,B.enemiesOf(u).filter(e=>e.alive&&e!==target&&B.distance(target,e)<200));
      if(next){u._chellCombo={name:'GEL RELAY',until:B.t+1.2};route(u,B,next,{origin:target,sprite:'cube',fling:true,duration:.45},()=>{
        B.damage(u,next,u.st.atk*.35,{type:'physical',tag:'Gel Relay'});B.applyStatus(u,next,'slow',1.5);
      });}
    }
  }
  function speak(u,B,core){
    activate(u,B,core);u._chellActiveCore={core,until:B.t+1.7};
    const s=state(B);if(!s||core==='morality'||B.over||B.paused)return;
    const now=performance.now();
    if(now-s.lastVoice<4500||Sound._voices?.some(v=>v.cue?.startsWith('chell_core_')&&!v.audio.paused&&!v.audio.ended))return;
    const cue='chell_core_'+core;
    if(Sound.play(cue,{vol:.7,priority:false})){s.lastVoice=now;const v=Sound._voices?.findLast(v=>v.cue===cue);if(v)s.audio.push(v.audio);}
  }
  function portals(u,B){
    const a=anchor(B,u,true),t=B.nearest(u,B.enemiesOf(u).filter(e=>e.alive));
    const b=t?anchor(B,t,true):{x:a.x+u.face*150,y:a.y};
    u._portal={blue:{x:a.x+u.face*55,y:a.y},orange:{x:b.x,y:b.y},at:B.t};
    activate(u,B,'curiosity');
    if(!B.offscreen)Sound.play('chell_portal_open',{vol:.35,throttle:900});
    return u._portal;
  }
  function route(u,B,target,opt={},onHit){
    if(!u._portal)portals(u,B);
    const a=anchor(B,opt.origin||u),b=anchor(B,target);
    const victim=opt.victim?anchor(B,opt.victim):a;
    const dur=opt.duration||.64;
    const e={kind:'route',owner:u,target,at:B.t,dur,from:a,entry:{x:victim.x+u.face*38,y:opt.fling?(opt.victim||u).y:victim.y},exit:{x:b.x-u.face*62,y:opt.fling?target.y:b.y},sprite:opt.sprite||'cube',rocket:!!opt.rocket,turret:!!opt.turret,fling:!!opt.fling};
    effect(B,e);u._chellBusyUntil=B.t+dur;
    if(!B.offscreen&&opt.sound!==false)Sound.play('chell_portal_fire',{vol:.4});
    B.after(dur,()=>{if(!B.over&&u.alive&&target.alive){onHit?.();if(!B.offscreen)Sound.play('chell_cube_hit',{vol:.35});}});
    return e;
  }
  function transit(u,B,target,dest,onLand,duration=.9){
    if(!u._portal)portals(u,B);
    const from=anchor(B,target,true);
    const movable=!target.immovable&&!target.noDisplace&&!target._chellTransit;
    const e={kind:'transit',owner:u,unit:target,at:B.t,dur:duration,from,dest:{x:clamp(dest.x,B.leftWall,B.rightWall),depth:dest.depth},movable};
    effect(B,e);u._chellBusyUntil=B.t+duration;
    if(movable)target._chellTransit=e;
    B.after(.25,()=>{if(!B.over&&u.alive&&target.alive&&target._chellTransit===e){if(target.immovable||target.noDisplace)e.movable=false;else B.blink(target,e.dest.x,e.dest.depth);}});
    B.after(duration,()=>{
      if(target._chellTransit===e)delete target._chellTransit;
      if(!B.over&&u.alive&&target.alive)onLand?.(e.movable);
    });
    return e;
  }
  function escape(u,B,x,depth){
    const from=anchor(B,u);B.blink(u,x,depth);const to=anchor(B,u);
    effect(B,{kind:'escape',owner:u,at:B.t,dur:.55,from,to});u._chellBusyUntil=B.t+.55;
    if(!B.offscreen)Sound.play('chell_portal_open',{vol:.32});
  }
  function gels(u,B,foes,blue,duration,onLand){
    const s=state(B);if(s)s.effects=s.effects.filter(e=>!(e.kind==='gel'&&e.owner===u));
    if(!B.offscreen)Sound.play('chell_portal_fire',{vol:.4});
    const targets=blue?foes:B.alliesOf(u).filter(a=>a.alive);
    effect(B,{kind:'gel',owner:u,at:B.t,dur:duration+.55,blue,targets});
    u._chellBusyUntil=B.t+.6;
    const token=u._chellGelToken=(u._chellGelToken||0)+1;
    B.after(.55,()=>{if(B.over||!u.alive||u._chellGelToken!==token)return;onLand?.();
      if(blue)foes.forEach(t=>{if(t.alive&&!t.immovable&&!t.noDisplace)effect(B,{kind:'bounce',owner:u,unit:t,at:B.t,dur:.65});});
    });
  }
  function bridge(u,B,duration){effect(B,{kind:'bridge',owner:u,at:B.t,dur:duration});}
  function release(B){
    const s=B._chellScene;if(!s)return;
    s.canvases.forEach(c=>c.remove());s.audio.forEach(a=>{try{a.pause();}catch(_){}});
    s.bodyUnits.forEach(u=>{if(u.bodyEl)u.bodyEl.style.transform=u._renderBodyTransform||'';delete u._chellTransit;});
    B._chellScene=null;
  }
  function sprite(ctx,name,x,y,w,h,angle=0){
    const f=frames[name];if(!f||!props.complete||!props.naturalWidth)return;
    ctx.save();ctx.translate(x,y);if(angle)ctx.rotate(angle);
    ctx.drawImage(props,f.x,f.y,f.w,f.h,-w/2,-h/2,w,h);ctx.restore();
  }
  function portal(ctx,p,color,width,floor=false,open=1){
    if(open<=0)return;ctx.save();ctx.translate(p.x,p.y);ctx.scale(open,open);
    if(floor){ctx.scale(1,.58);ctx.rotate(Math.PI/2);}
    // Original Portal sprites provide the dark interior and pixel rim.
    sprite(ctx,'portal-'+color,0,0,width*.48,width);ctx.restore();
  }
  function line(ctx,a,b,col,width=2){ctx.strokeStyle=col;ctx.lineWidth=width;ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.stroke();}
  function label(ctx,text,x,y,col='#dfefff'){ctx.save();ctx.font='bold 10px monospace';ctx.textAlign='center';ctx.fillStyle='#10202de8';const w=ctx.measureText(text).width+12;ctx.fillRect(x-w/2,y-11,w,16);ctx.fillStyle=col;ctx.fillText(text,x,y);ctx.restore();}
  function bodyMotion(s,u,y,scaleY=1){
    if(!u?.alive||!u.bodyEl)return;
    s.bodyUnits.add(u);const base=u._renderBodyTransform||'';
    u.bodyEl.style.transform=base+` translateY(${y.toFixed(1)}px) scaleY(${scaleY.toFixed(3)})`;
  }
  function render(B){
    const s=B._chellScene;if(!s||B.offscreen)return;
    if(B.over){release(B);return;}
    for(const u of s.bodyUnits){if(u.bodyEl)u.bodyEl.style.transform=u._renderBodyTransform||'';}s.bodyUnits.clear();
    // Fractional CSS stage sizes must not reset the canvas on every frame.
    const width=Math.ceil(B.W),height=Math.ceil(B.H);
    for(const layer of ['back','front']){const c=s[layer];if(c.parentNode!==FX[layer])FX[layer].appendChild(c);if(c.width!==width)c.width=width;if(c.height!==height)c.height=height;}
    const back=s.back.getContext('2d'),front=s.front.getContext('2d');
    for(const c of [back,front]){c.clearRect(0,0,B.W,B.H);c.imageSmoothingEnabled=false;}
    for(const u of B.units){
      if(u.id!=='Chell'||!u.alive||u.minion||!u._chellCores)continue;
      const a=anchor(B,u),feet=anchor(B,u,true),size=clamp(a.size*.28,22,31);
      if(u._portal&&!(u._chellBusyUntil>B.t)){
        const t=B.nearest(u,B.enemiesOf(u).filter(e=>e.alive));
        back.globalAlpha=.75;portal(back,{x:feet.x+u.face*55,y:feet.y+2},'blue',68,true);
        if(t)portal(back,anchor(B,t,true),'orange',68,true);back.globalAlpha=1;
      }
      const cores=[...u._chellCores].filter(c=>c!=='morality');
      cores.forEach((core,i)=>{
        const active=u._chellAllCoresUntil>B.t||(u._chellActiveCore?.core===core&&u._chellActiveCore.until>B.t);
        const x=a.x+(i-(cores.length-1)/2)*(size+5),y=feet.y-a.size*1.04-21+(FX.reducedEffects?0:Math.sin(B.t*2+i*1.7)*3)-(active?12:0);
        if(active){front.strokeStyle=core==='anger'?'#ffa47f':'#8ecbff';front.lineWidth=1;front.beginPath();front.arc(x,y,size*.67,0,Math.PI*2);front.stroke();}
        sprite(front,CORES[core],x,y,size,size);
        if(active&&!(u._chellCombo?.until>B.t)&&!(u._chellAllCoresUntil>B.t))label(front,core.toUpperCase(),x,y-size*.85);
      });
      if(u._chellActiveCore?.core==='morality'&&u._chellActiveCore.until>B.t){sprite(front,CORES.morality,a.x,feet.y-45,29,29);}
      const chargeY=feet.y-a.size*1.04+1;
      for(let i=0;i<3;i++){front.fillStyle=i<(u._chellCharge||0)?'#ffb270':'#1d3645';front.strokeStyle='#95d5fa';front.lineWidth=1;front.beginPath();front.arc(a.x+(i-1)*10,chargeY,3.5,0,Math.PI*2);front.fill();front.stroke();}
      if(u._chellCombo?.until>B.t)label(front,u._chellCombo.name,a.x,feet.y-a.size*1.04-53,'#ffd3a1');
      else if(u._chellCharge===3)label(front,'LOOP READY',a.x,feet.y-a.size*1.04-53,'#ffd3a1');
    }
    s.effects=s.effects.filter(e=>e.owner.alive&&B.t-e.at<e.dur);
    for(const e of s.effects){
      const elapsed=B.t-e.at,p=clamp01(elapsed/e.dur),open=Math.min(1,elapsed/.12,(e.dur-elapsed)/.14);
      if(e.kind==='route'){
        if(!e.target.alive)continue;
        const end=anchor(B,e.target);e.exit.y=e.fling?e.target.y:end.y;
        portal(back,e.entry,'blue',74,e.fling,open);portal(back,e.exit,'orange',74,e.fling,open);
        if(e.turret)sprite(front,'pixel-turret',e.from.x,e.from.y+24,31,47);
        let pos,angle=0;
        if(p<.34){const q=p/.34;pos={x:lerp(e.from.x,e.entry.x,q),y:lerp(e.from.y,e.entry.y,q)};angle=Math.atan2(e.entry.y-e.from.y,e.entry.x-e.from.x);}
        else if(p>.43){const q=(p-.43)/.57;pos={x:lerp(e.exit.x,end.x,q),y:lerp(e.exit.y,end.y,q)-(e.fling?Math.sin(q*Math.PI)*80:0)};angle=Math.atan2(end.y-e.exit.y-(e.fling?Math.cos(q*Math.PI)*Math.PI*80:0),end.x-e.exit.x);}
        if(pos){line(front,{x:pos.x-Math.cos(angle)*18,y:pos.y-Math.sin(angle)*18},pos,e.rocket?'#ffb878':'#bfe8ff',3);sprite(front,e.sprite,pos.x,pos.y,e.rocket?31:28,e.rocket?13:25,e.rocket?angle:p*1.1);}
      }else if(e.kind==='transit'){
        const target=e.unit;if(!target.alive)continue;const dest=anchor(B,target,true);
        portal(back,e.from,'blue',clamp(e.from.size||90,75,120),true,open);
        portal(back,{x:dest.x,y:dest.y-125},'orange',90,true,open);
        if(!FX.reducedEffects&&e.movable&&target._chellTransit===e){if(elapsed<.25)bodyMotion(s,target,elapsed/.25*28,1-elapsed/.25*.45);else bodyMotion(s,target,-125*Math.pow(1-clamp01((elapsed-.25)/(e.dur-.25)),2));}
        if(!e.movable)line(front,{x:dest.x,y:dest.y-118},{x:dest.x,y:dest.y-28},'#ffb371',3);
      }else if(e.kind==='escape'){
        portal(back,e.from,'blue',76,false,open);portal(back,e.to,'orange',76,false,open);
        for(let j=0;j<5;j++){const q=(p+j*.12)%1;line(front,{x:lerp(e.from.x,e.to.x,q)-4,y:lerp(e.from.y,e.to.y,q)},{x:lerp(e.from.x,e.to.x,q)+4,y:lerp(e.from.y,e.to.y,q)},'#99d5ff88',2);}
      }else if(e.kind==='gel'){
        const live=e.targets.filter(t=>t.alive);if(!live.length)continue;
        const pts=live.map(t=>anchor(B,t,true));const cx=pts.reduce((n,a)=>n+a.x,0)/pts.length,gy=pts.reduce((n,a)=>n+a.y,0)/pts.length;
        const col=e.blue?'#57b8ff':'#ff9c42',width=clamp(Math.max(...pts.map(a=>Math.abs(a.x-cx)))*2+95,100,B.W*.85);
        back.save();back.globalAlpha=Math.min(1,(e.dur-elapsed)/.5);back.fillStyle=e.blue?'#258ac43d':'#e974243d';back.beginPath();back.ellipse(cx,gy+3,width/2,14,0,0,Math.PI*2);back.fill();back.strokeStyle=col;back.lineWidth=2;back.stroke();
        for(let i=0;i<9;i++){const x=cx-width*.44+i*width*.11;back.fillStyle=col;back.beginPath();back.ellipse(x,gy+Math.sin(i*2)*4,6,2,0,0,Math.PI*2);back.fill();if(!e.blue){line(back,{x:x-3,y:gy-5},{x:x+5,y:gy},col,2);line(back,{x:x+5,y:gy},{x:x-3,y:gy+5},col,2);}}
        back.restore();
        if(elapsed<.75){const top={x:cx,y:gy-145};portal(back,top,'orange',80,true,Math.min(1,elapsed/.1));const start=anchor(B,e.owner);portal(back,{x:start.x+e.owner.face*36,y:start.y},'blue',68,false);for(let j=0;j<7;j++){const q=clamp01((elapsed-j*.055)/.3);front.fillStyle=col;front.beginPath();front.arc(top.x+Math.sin(j*3)*14,lerp(top.y,gy,q),3,0,Math.PI*2);front.fill();}}
      }else if(e.kind==='bounce'&&!FX.reducedEffects)bodyMotion(s,e.unit,-Math.sin(p*Math.PI)*48);
      else if(e.kind==='bridge'){
        const allies=B.alliesOf(e.owner).filter(a=>a.alive);if(!allies.length)continue;const pts=allies.map(t=>anchor(B,t,true)),x0=Math.min(...pts.map(a=>a.x))-40,x1=Math.max(...pts.map(a=>a.x))+40,y=pts.reduce((n,a)=>n+a.y,0)/pts.length+7;
        back.fillStyle='#50bdff29';back.fillRect(x0,y-7,x1-x0,12);line(back,{x:x0,y:y-7},{x:x1,y:y-7},'#a5e9ff',2);line(back,{x:x0,y:y+5},{x:x1,y:y+5},'#378bc1',2);
        for(let x=x0;x<x1;x+=24)line(back,{x,y:y-6},{x:x+12,y:y+4},'#71d0ff55');
      }
    }
  }

  const baseAtlases=Art.collabAtlases;
  const clip=(row,count,fps,once=false)=>({src:motion.src,cols:8,rows:8,cellW:128,cellH:160,baseW:80,groundY:156,frames:Array.from({length:count},(_,i)=>row*8+i),fps,once});
  const clips={idle:clip(0,6,6),move:clip(1,8,11),attack:clip(7,3,10,true),cast:clip(7,3,9,true),guard:clip(2,3,8,true),jump:clip(3,1,8),fall:clip(4,2,7),hurt:clip(5,1,8),land:clip(6,1,8)};
  Art.collabAtlases=function(id,costume){return id==='Chell'?clips:baseAtlases.apply(this,arguments);};
  const natural=Battle.prototype.setNaturalSprite;
  Battle.prototype.setNaturalSprite=function(u,pose,phase){
    // Brief damage ticks must not repeatedly interrupt an attack or portal cast.
    if(u.id==='Chell'&&u.alive&&u.visualLaunch)pose='fall';
    return natural.call(this,u,pose,phase);
  };
  const oldProj=Battle.prototype.fxProj;
  Battle.prototype.fxProj=function(u,target,opt,hit){
    if(u?.id==='Chell'&&!u.minion)return route(u,this,target,{sprite:u._cubeDrop?'cube-heart':'cube',sound:false},hit);
    return oldProj.apply(this,arguments);
  };
  const oldRender=Battle.prototype.render;
  Battle.prototype.render=function(){const result=oldRender.apply(this,arguments);render(this);return result;};
  const oldBuild=Battle.prototype.buildUnitEl;
  Battle.prototype.buildUnitEl=function(u){const result=oldBuild.apply(this,arguments);if(u.id==='Chell'&&u.el)u.el.classList.add('chell-core-unit');return result;};
  const oldLoop=Battle.prototype.loop;
  Battle.prototype.loop=function(){
    const s=this._chellScene;
    if(s){s.audio=s.audio.filter(a=>!a.ended);const pause=this.paused||this.over||document.hidden||!Sound.on;
      for(const a of s.audio){if(pause&&!a.paused){a.pause();a._chellPaused=true;}else if(!pause&&a._chellPaused){a._chellPaused=false;a.play().catch(()=>{});}}
    }
    return oldLoop.apply(this,arguments);
  };
  for(const method of ['finish','stopBattle','start']){const old=Battle.prototype[method];Battle.prototype[method]=function(){release(this);return old.apply(this,arguments);};}
  HEROES.Chell.nativeFace=1;
  Object.assign(HEROES.Chell.move,{particles:null,trail:null,bob:1,squash:0,idle:'still'});
  return {ready,activate,speak,portals,route,transit,escape,gels,bridge,charge,spend,delivery,render,release,clips};
})();
