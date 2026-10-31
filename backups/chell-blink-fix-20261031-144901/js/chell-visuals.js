/* Real source-sheet animation using the game's existing natural-sprite renderer. */
'use strict';
(() => {
  const base=Art.collabAtlases;
  const sheetImage=new Image();sheetImage.src='assets/aperture/chell/chell-motion.png';
  const clip=(row,count,fps,once=false)=>({src:'assets/aperture/chell/chell-motion.png',cols:8,rows:8,cellW:96,cellH:160,baseW:64,anchorX:48,groundY:156,frames:Array.from({length:count},(_,i)=>row*8+i),fps,once});
  const clips={idle:clip(0,6,6),move:clip(1,8,11),attack:clip(2,3,10,true),cast:clip(3,5,9,true),hurt:clip(4,1,8,true),jump:clip(5,1,8,true),fall:clip(6,2,7),guard:clip(7,1,8,true)};
  Art.collabAtlases=function(id,costume){return id==='Chell'?clips:base.apply(this,arguments);};
  const natural=Battle.prototype.setNaturalSprite;
  Battle.prototype.setNaturalSprite=function(u,pose,phase){
    if(u.id==='Chell'&&u.alive){
      if(u.hitT>0){pose='hurt';phase=0;}
      else if(u.animT>0&&u.animStyle==='chellRedirect')pose='attack';
      else if(u.animT>0&&u.animStyle==='chellGel')pose='guard';
      else if(u.visualLaunch)pose='fall';
    }
    return natural.call(this,u,pose,phase);
  };
  // Remove unrelated sparkles/trails and preserve silent, practical characterization.
  HEROES.Chell.nativeFace=1;
  Object.assign(HEROES.Chell.move,{particles:null,trail:null,bob:1,squash:0,idle:'still'});
  // Visible cubes use supplied artwork rather than an emoji as the attack itself.
  const cubeImage=new Image();cubeImage.src='assets/aperture/chell/cube.png';
  function cube(B,u,t,delay=.3){if(B.offscreen)return;const img=document.createElement('img');img.src=cubeImage.src;img.alt='';img.className='chell-cube-fx';
    img.style.left=t.x+'px';img.style.top=(t.y-175)+'px';img.style.setProperty('--fall-time',delay+'s');
    const host=document.querySelector('#fxFront');if(host){host.appendChild(img);setTimeout(()=>img.remove(),delay*1000+250);}}
  const basic=HEROES.Chell.basic.onHit;HEROES.Chell.basic.onHit=function(u,t,B){if(u._cubeDrop)cube(B,u,t,.35);return basic.apply(this,arguments);};
})();
