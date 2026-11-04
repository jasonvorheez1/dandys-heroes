/* Deltarune battle poses and pixel effects, all timed to the battle simulation. */
'use strict';

const DeltaruneVisuals = (() => {
  // These are original Deltarune cues already shipped in the Flower Kingdom pack.
  // Keep character combat independent of that event's much larger lazy-loaded pack.
  const soundFiles = ['select', 'swing', 'rudebuster_hit', 'weaponpull_fast', 'spare', 'graze',
    'power', 'spellcast', 'magicsprinkle', 'mercyadd', 'great_shine', 'revival'];
  CUE_SOURCES.push([Object.fromEntries(soundFiles.map(name => ['dr_' + name, [name + '.ogg']])),
    (typeof ASSET === 'string' ? ASSET : './') + 'assets/deltarune/sfx/']);
  const previousMix = soundMix;
  soundMix = function (cue) {
    if (!cue.startsWith('dr_')) return previousMix(cue);
    const impact = cue === 'dr_swing' || cue === 'dr_rudebuster_hit';
    return { bus: impact ? 'impact' : 'ability', gain: impact ? .55 : .47,
      throttle: cue === 'dr_magicsprinkle' ? 280 : impact ? 80 : 180,
      perCue: impact ? 2 : 1,
      maxMs: cue === 'dr_revival' ? 6500 : cue === 'dr_great_shine' ? 2300 : 1500,
      fadeMs: cue === 'dr_revival' ? 250 : 130 };
  };
  function play(B, name, vol = .7) {
    if (!B || B.offscreen || B.paused || B.over) return;
    Sound.play('dr_' + name, { vol });
  }
  const clamp01 = x => Math.max(0, Math.min(1, x));
  const ease = x => 1 - Math.pow(1 - clamp01(x), 3);
  const sheet = id => (typeof ASSET === 'string' ? ASSET : './') + 'assets/deltarune/' + id.toLowerCase() + '-battle.png';
  const frames = (row, count) => Array.from({ length: count }, (_, i) => row * 8 + i);
  const clip = (id, row, count, fps, once = false) => ({ src: sheet(id), cols: 8, rows: 10, cellW: 96, cellH: 96,
    baseW: 96, bodyScale: 1.08, groundY: 94, frames: frames(row, count), fps, once });
  const atlases = {
    Kris: {
      idle: clip('Kris', 0, 4, 4), move: clip('Kris', 1, 6, 11), attack: clip('Kris', 2, 6, 12, true),
      cast: clip('Kris', 3, 5, 9, true), guard: clip('Kris', 4, 5, 9, true), hurt: clip('Kris', 5, 3, 9, true),
      act: clip('Kris', 6, 6, 10, true), xslash: clip('Kris', 7, 7, 12, true), courage: clip('Kris', 8, 5, 8, true)
    },
    Ralsei: {
      idle: clip('Ralsei', 0, 5, 5), move: clip('Ralsei', 1, 4, 10), attack: clip('Ralsei', 2, 7, 12, true),
      cast: clip('Ralsei', 3, 8, 11, true), guard: clip('Ralsei', 4, 8, 11, true), hurt: clip('Ralsei', 5, 1, 1, true),
      prayer: clip('Ralsei', 6, 8, 10, true), pacify: clip('Ralsei', 7, 8, 10, true),
      revive: clip('Ralsei', 8, 8, 10, true), prince: clip('Ralsei', 9, 8, 10, true)
    }
  };
  const oldAtlases = Art.collabAtlases;
  Art.collabAtlases = function (id) { return atlases[id] || oldAtlases.apply(this, arguments); };
  HEROES.Kris.nativeFace = 1;
  HEROES.Ralsei.nativeFace = 1;

  function anchor(B, u) {
    if (!u) return { x: 0, y: 0, size: 90 };
    if (B.unitFxAnchor) return B.unitFxAnchor(u);
    return { x: u.x, y: u.y - 48, size: 90 };
  }
  function state(B) {
    if (!B || B.offscreen || !FX.front) return null;
    if (B._deltaruneVisuals) return B._deltaruneVisuals;
    const canvas = document.createElement('canvas');
    canvas.className = 'deltarune-fx-layer';
    canvas.setAttribute('aria-hidden', 'true');
    canvas.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;pointer-events:none;image-rendering:pixelated;';
    FX.front.appendChild(canvas);
    return (B._deltaruneVisuals = { canvas, effects: [] });
  }
  function release(B) {
    const s = B._deltaruneVisuals;
    if (!s) return;
    s.canvas.remove(); s.effects.length = 0; B._deltaruneVisuals = null;
  }
  function add(B, kind, owner, target, duration, options = {}) {
    const s = state(B);
    if (!s) return;
    if (s.effects.length >= 50) s.effects.shift();
    const a = anchor(B, target || owner);
    s.effects.push({ kind, owner, target, at: B.t, duration, x: a.x, y: a.y, ...options });
  }
  function pose(u, B, name, duration) {
    if (!u || !atlases[u.id]?.[name]) return;
    u._clip = name; u._clipUntil = B.t + duration;
  }
  const styles = {
    krisAct: 'act', krisXSlash: 'xslash', krisDefend: 'guard', krisCourage: 'courage',
    ralseiBasic: 'cast', ralseiDual: 'cast', ralseiPacify: 'pacify', ralseiGuard: 'guard',
    ralseiPrayer: 'prayer', ralseiRevive: 'revive', ralseiPrince: 'prince'
  };
  const oldAnim = Battle.prototype.anim;
  Battle.prototype.anim = function (u, kind, duration, style) {
    const result = oldAnim.apply(this, arguments);
    if (styles[style]) pose(u, this, styles[style], duration);
    return result;
  };
  const oldDamage = Battle.prototype.damage;
  Battle.prototype.damage = function (src, target, amount, options) {
    const result = oldDamage.apply(this, arguments);
    if (result?.basic && result.amount > 0 && src?.id === 'Kris' && target?.team !== src.team) {
      add(this, 'basic', src, target, .24);
    }
    return result;
  };

  const INK = '#080711', WHITE = '#fff9e9', RED = '#ff426d', CYAN = '#7df5f5';
  const MINT = '#9cf8bd', GOLD = '#ffe4a2', LILAC = '#cbbdff';
  const heartBits = ['0110110', '1111111', '1111111', '0111110', '0011100', '0001000'];
  const R = n => Math.round(n);
  function box(ctx, x, y, w, h, color) { ctx.fillStyle = INK; ctx.fillRect(R(x), R(y), R(w), R(h)); ctx.strokeStyle = color; ctx.lineWidth = 2; ctx.strokeRect(R(x)+1, R(y)+1, R(w)-2, R(h)-2); }
  function pixel(ctx, x, y, size, color) { ctx.fillStyle = color; ctx.fillRect(R(x), R(y), size, size); }
  function line(ctx, x0, y0, x1, y1, color, width = 2) { ctx.strokeStyle = color; ctx.lineWidth = width; ctx.beginPath(); ctx.moveTo(R(x0), R(y0)); ctx.lineTo(R(x1), R(y1)); ctx.stroke(); }
  function poly(ctx, points, color) { ctx.fillStyle = color; ctx.beginPath(); ctx.moveTo(R(points[0][0]), R(points[0][1])); for (let i=1;i<points.length;i++) ctx.lineTo(R(points[i][0]),R(points[i][1])); ctx.closePath(); ctx.fill(); }
  function heart(ctx, x, y, size, color) { heartBits.forEach((row, iy) => { for(let ix=0;ix<7;ix++) if(row[ix]==='1') pixel(ctx,x+(ix-3)*size,y+(iy-2)*size,size,color); }); }
  function sparkle(ctx, x, y, size, color) { pixel(ctx,x-size/2,y-size/2,size,color); pixel(ctx,x-1,y-size*1.5,2,size,color); pixel(ctx,x-1,y+size*.5,2,size,color); pixel(ctx,x-size*1.5,y-1,size,2,color); pixel(ctx,x+size*.5,y-1,size,2,color); }
  function diamond(ctx,x,y,rx,ry,color,width=2){ctx.strokeStyle=color;ctx.lineWidth=width;ctx.beginPath();ctx.moveTo(R(x),R(y-ry));ctx.lineTo(R(x+rx),R(y));ctx.lineTo(R(x),R(y+ry));ctx.lineTo(R(x-rx),R(y));ctx.closePath();ctx.stroke();}
  function label(ctx, text, x, y, color=WHITE, marker='*') {
    ctx.font='bold 11px monospace'; ctx.textBaseline='middle';
    const w=R(ctx.measureText(text).width)+30, left=R(x-w/2), top=R(y-11);
    box(ctx,left,top,w,23,WHITE); pixel(ctx,left+4,top+4,3,color);
    ctx.fillStyle=color;ctx.textAlign='left';ctx.fillText(marker,left+11,top+12);
    ctx.fillStyle=WHITE;ctx.fillText(text,left+23,top+12);
  }
  function rays(ctx,x,y,p,count,color,max=55){
    for(let i=0;i<count;i++) {const angle=i*Math.PI*2/count, d=10+max*p, dx=Math.cos(angle),dy=Math.sin(angle);line(ctx,x+dx*d,y+dy*d,x+dx*(d+10*(1-p)),y+dy*(d+10*(1-p)),color,i%3===0?3:2);}
  }
  function flecks(ctx,x,y,p,count,color,spread=40,rise=45){
    for(let i=0;i<count;i++){const angle=i*2.399, radius=(8+(i*13)%spread)*(0.4+p*.8), drift=Math.sin(i*21.3)*8*p;const fx=x+Math.cos(angle)*radius+drift,fy=y+22-p*(rise+(i%4)*10)+Math.sin(angle)*radius*.3; if(i%4===0)sparkle(ctx,fx,fy,3,color);else pixel(ctx,fx,fy,i%3===0?3:2,color);}
  }
  function targetPoint(B,e){return e.target?.alive?anchor(B,e.target):{x:e.x,y:e.y,size:90};}
  function meter(ctx,a,value,color,icon){
    const x=a.x-18,y=a.y+28;box(ctx,x,y,39,8,WHITE);ctx.fillStyle=color;ctx.fillRect(R(x+3),R(y+3),R(33*clamp01(value/100)),2);
    if(icon==='heart')heart(ctx,x-9,y+3,1,color);else sparkle(ctx,x-6,y+3,3,color);
  }
  function shield(ctx,x,y,w,h,color,fill=false){
    const pts=[[x,y-h],[x+w,y-h*.48],[x+w*.75,y+h*.54],[x,y+h],[x-w*.75,y+h*.54],[x-w,y-h*.48]];
    if(fill)poly(ctx,pts,fill);ctx.strokeStyle=color;ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(R(pts[0][0]),R(pts[0][1]));for(let i=1;i<pts.length;i++)ctx.lineTo(R(pts[i][0]),R(pts[i][1]));ctx.closePath();ctx.stroke();
  }
  function delta(ctx,x,y,size,color){
    poly(ctx,[[x,y-size],[x+size*.65,y+size*.55],[x-size*.65,y+size*.55]],color);
    poly(ctx,[[x,y-size*.43],[x+size*.27,y+size*.34],[x-size*.27,y+size*.34]],INK);
    pixel(ctx,x-size*.84,y-size*.16,4,color);pixel(ctx,x+size*.7,y-size*.16,4,color);
    line(ctx,x-size*.5,y+size*.73,x+size*.5,y+size*.73,color,3);
  }
  function drawPersistent(ctx,B){
    const reduced=!!FX.reducedEffects;
    for(const u of B.units){
      if(!u.alive||u.minion)continue;
      const a=anchor(B,u),t=B.t;
      if(u.id==='Kris'){
        if(u._krisTP>0)meter(ctx,a,u._krisTP,RED,'heart');
        if(u.hasStatus('kris_defend')){ctx.globalAlpha=.72;shield(ctx,a.x,a.y,34,43,'#ffafbc');heart(ctx,a.x,a.y,1,RED);ctx.globalAlpha=1;}
        if(u.hasStatus('kris_determination')){ctx.globalAlpha=.8;for(let i=0;i<(reduced?2:4);i++){const q=t*1.9+i*Math.PI/2;sparkle(ctx,a.x+Math.cos(q)*36,a.y+Math.sin(q)*36,3,RED);}ctx.globalAlpha=1;}
      }else if(u.id==='Ralsei'){
        if(u._ralseiTP>0)meter(ctx,a,u._ralseiTP,MINT,'star');
        if(u.hasStatus('ralsei_prince')){ctx.globalAlpha=.65;delta(ctx,a.x,a.y-48,9,GOLD);ctx.globalAlpha=1;}
      }
      const fluffy=u.getStatus?.('ralsei_fluffy');
      if(fluffy){ctx.globalAlpha=.7;shield(ctx,a.x,a.y,33,39,'#c5ffe0');for(let i=0;i<Math.min(3,fluffy.ralseiCharges||0);i++)pixel(ctx,a.x-10+i*8,a.y-50,4,MINT);ctx.globalAlpha=1;}
      if(u.hasStatus('ralsei_drowsy')){ctx.globalAlpha=.8;const x=a.x+20,y=a.y-47+(reduced?0:Math.sin(t*2)*2);diamond(ctx,x,y,8,8,LILAC,3);pixel(ctx,x+5,y-9,9,INK);pixel(ctx,x+13,y-15,2,WHITE);ctx.globalAlpha=1;}
      if(u.hasStatus('kris_checked')){const x=a.x,y=a.y;for(const sx of [-1,1])for(const sy of [-1,1]){line(ctx,x+sx*28,y+sy*32,x+sx*17,y+sy*32,WHITE,2);line(ctx,x+sx*28,y+sy*32,x+sx*28,y+sy*21,WHITE,2);}}
    }
  }
  function drawEffect(ctx,B,e){
    const p=clamp01((B.t-e.at)/e.duration),a=targetPoint(B,e),x=a.x,y=a.y;
    const fade=clamp01((1-p)*3.2);ctx.save();ctx.globalAlpha=fade;
    if(e.kind==='check'){
      const r=50-24*ease(p);for(const sx of [-1,1])for(const sy of [-1,1]){line(ctx,x+sx*r,y+sy*r,x+sx*(r-13),y+sy*r,CYAN,3);line(ctx,x+sx*r,y+sy*r,x+sx*r,y+sy*(r-13),CYAN,3);}
      line(ctx,x-28,y-23+p*46,x+28,y-23+p*46,WHITE,2);
      if(p<.65)label(ctx,'CHECK',x,y-73, CYAN);
      sparkle(ctx,x,y,3,WHITE);
    }else if(e.kind==='act'){
      const from=anchor(B,e.owner), col=e.command==='SPARE'?GOLD:e.command==='DISTRACT'?CYAN:LILAC;
      if(p<.83)label(ctx,'ACT / '+e.command,from.x,from.y-72,col,'>');
      for(let i=0;i<9;i++){const q=(i+1)/10;if(q>Math.min(1,p*2.2))break;pixel(ctx,from.x+(x-from.x)*q,from.y-10+(y-from.y+10)*q,3,i%2?col:WHITE);}
      if(e.command==='SPARE'){heart(ctx,x,y-10-p*30,3,GOLD);rays(ctx,x,y-10,Math.min(1,p*2),6,GOLD,30);}
      else if(e.command==='DISTRACT'){for(let i=0;i<3;i++)sparkle(ctx,x+Math.sin(i*2.4+p*5)*25,y-25-i*12,3,CYAN);}
      else {box(ctx,x-21,y-20,42,28,LILAC);pixel(ctx,x-11,y-9,5,WHITE);pixel(ctx,x+7,y-9,5,WHITE);}
    }else if(e.kind==='slash'){
      const flip=e.hit===2?-1:1, sweep=ease(Math.min(1,p*2));
      const ox=(1-sweep)*flip*35, oy=(1-sweep)*-24;
      ctx.translate(R(x+ox),R(y+oy));ctx.rotate(flip*.72);
      poly(ctx,[[-56,-7],[23,-7],[57,0],[23,7],[-56,7]],INK);
      poly(ctx,[[-54,-5],[20,-5],[51,0],[20,5],[-54,5]],e.hit===2?RED:CYAN);
      poly(ctx,[[-49,-2],[33,-2],[46,0],[33,2],[-49,2]],WHITE);
      ctx.restore();ctx.save();ctx.globalAlpha=fade;
      for(let i=0;i<(FX.reducedEffects?3:8);i++){const q=i*2.399;pixel(ctx,x+Math.cos(q)*(12+p*52),y+Math.sin(q)*(10+p*38),i%3?3:5,i%2?CYAN:RED);}
      if(e.hit===2&&p<.5){heart(ctx,x,y,2,RED);rays(ctx,x,y,p*2,8,WHITE,32);}
    }else if(e.kind==='basic'){
      const travel=ease(p),dx=(1-travel)*-18;
      line(ctx,x-23+dx,y+18,x+21+dx,y-22,INK,7);
      line(ctx,x-23+dx,y+18,x+21+dx,y-22,CYAN,4);
      line(ctx,x-20+dx,y+16,x+19+dx,y-24,WHITE,2);
      sparkle(ctx,x+22,y-23,3,WHITE);
    }else if(e.kind==='guard'){
      const col=e.color||'#ffb3c4',w=18+ease(p)*22,h=24+ease(p)*26;
      shield(ctx,x,y,w,h,col,'#0c1022bb');
      if(e.color===MINT||e.color==='#baf4ce')sparkle(ctx,x,y,7,WHITE);else heart(ctx,x,y,2,RED);
      for(let i=0;i<4;i++)pixel(ctx,x+(i-1.5)*15,y+h+5+p*15,3,col);
    }else if(e.kind==='soul'){
      const sy=y-16-p*38;box(ctx,x-24,sy-22,48,44,WHITE);heart(ctx,x,sy,4,RED);
      line(ctx,x-31,sy-29,x-20,sy-29,RED,3);line(ctx,x+20,sy+29,x+31,sy+29,RED,3);
      if(p<.5)rays(ctx,x,sy,p*2,8,RED,23);
    }else if(e.kind==='courage'||e.kind==='prince'){
      const prince=e.kind==='prince',col=prince?MINT:RED,second=prince?GOLD:CYAN;
      if(p<.65)label(ctx,prince?'PRINCE OF THE DARK':'COURAGE',x,y-82,second);
      delta(ctx,x,y-18-p*20,17+14*Math.sin(Math.min(1,p*2)*Math.PI/2),second);
      rays(ctx,x,y-12,p,FX.reducedEffects?8:14,col,30+75*p);
      for(const ally of B.alliesOf(e.owner).filter(u=>u.alive&&!u.minion)){const b=anchor(B,ally);if(b.x===x&&b.y===y)continue;const q=Math.min(1,p*1.5);line(ctx,x,y+8,b.x,b.y+10,second,2);sparkle(ctx,b.x,b.y-34+14*(1-q),3,col);}
    }else if(e.kind==='heal'||e.kind==='prayer'||e.kind==='revive'){
      const big=e.kind!=='heal',revive=e.kind==='revive',col=revive?GOLD:MINT;
      if(big&&p<.7)label(ctx,revive?'REVIVESONG':e.miracle?'MIRACLE PRAYER':'HEAL PRAYER',x,y-81,col);
      const source=anchor(B,e.owner);
      if(e.owner!==e.target&&e.kind!=='revive')for(let i=1;i<=9;i++){
        const q=i/10;if(q>Math.min(1,p*2.2))break;
        const bx=source.x+(x-source.x)*q,by=source.y+(y-source.y)*q-33*Math.sin(Math.PI*q);
        if(i%3===0)sparkle(ctx,bx,by,3,WHITE);else pixel(ctx,bx,by,3,col);
      }
      const floor=e.target?.y||y+45;
      diamond(ctx,x,floor-7,18+26*p,5+8*p,col,3);
      for(let i=0;i<(big?3:2);i++){const side=i%2?-1:1,shift=(i===2?0:side*(14+12*p));line(ctx,x+shift,floor-3,x+shift*(.6+Math.sin(p*4+i)*.12),y-16-42*p,col,3);}
      flecks(ctx,x,y,p,FX.reducedEffects?5:big?18:10,col,big?52:30,big?78:46);
      if(big){heart(ctx,x,y-15-25*p,revive?4:3,revive?GOLD:WHITE);rays(ctx,x,y-10,p,8,WHITE,revive?46:32);}
      else if(p>.2&&p<.7)sparkle(ctx,x,y-5-p*28,6,WHITE);
    }else if(e.kind==='dual'){
      if(p<.7)label(ctx,e.empowered?'EMPOWERED DUALHEAL':'DUALHEAL',x,y-82,e.empowered?GOLD:MINT);
      const radius=20+70*ease(p);diamond(ctx,x,y+13,radius,radius*.42,MINT,3);
      diamond(ctx,x,y+13,radius*.72,radius*.3,WHITE,2);
      for(let i=0;i<(FX.reducedEffects?4:8);i++){const q=i*Math.PI*2/8+p*1.5;const sx=x+Math.cos(q)*radius,sy=y+13+Math.sin(q)*radius*.42;sparkle(ctx,sx,sy,3,i%2?MINT:WHITE);}
      delta(ctx,x,y-20,12,MINT);
    }else if(e.kind==='pacify'){
      if(p<.75)label(ctx,e.spared?'PACIFY':'DROWSY',x,y-78,LILAC);
      const cx=x+3,cy=y-18-p*15;diamond(ctx,cx,cy,20+10*p,20+10*p,LILAC,2);
      poly(ctx,[[cx-10,cy-12],[cx-16,cy-4],[cx-15,cy+6],[cx-7,cy+13],[cx+4,cy+12],[cx+11,cy+5],[cx+2,cy+7],[cx-5,cy+3],[cx-7,cy-4]],LILAC);
      for(let i=0;i<5;i++)sparkle(ctx,x+Math.sin(i*2.4+p*3)*(12+i*5),y+14-p*(29+i*8),i%2?2:3,LILAC);
      if(e.spared)heart(ctx,x,y+2-p*24,2,GOLD);
    }else if(e.kind==='block'){
      shield(ctx,x,y,31-15*p,39-18*p,MINT,'#eafff299');
      for(let i=0;i<(FX.reducedEffects?4:9);i++){const q=i*2.399,r=12+p*49;poly(ctx,[[x+Math.cos(q)*r,y+Math.sin(q)*r],[x+Math.cos(q)*r+6,y+Math.sin(q)*r-3],[x+Math.cos(q)*r+2,y+Math.sin(q)*r+7]],i%2?MINT:WHITE);}
    }
    ctx.restore();
  }
  function render(B) {
    const s = B._deltaruneVisuals;
    if (!s || B.offscreen) return;
    if (B.over) { release(B); return; }
    if (s.canvas.parentNode !== FX.front) FX.front.appendChild(s.canvas);
    const width = Math.ceil(B.W), height = Math.ceil(B.H);
    if (s.canvas.width !== width) s.canvas.width = width;
    if (s.canvas.height !== height) s.canvas.height = height;
    const ctx = s.canvas.getContext('2d');
    ctx.clearRect(0, 0, B.W, B.H); ctx.imageSmoothingEnabled = false;
    drawPersistent(ctx, B);
    s.effects = s.effects.filter(e => B.t - e.at < e.duration);
    for (const effect of s.effects) drawEffect(ctx, B, effect);
  }
  const oldRender = Battle.prototype.render;
  Battle.prototype.render = function () { const result = oldRender.apply(this, arguments); render(this); return result; };
  const oldBuild = Battle.prototype.buildUnitEl;
  Battle.prototype.buildUnitEl = function (u) {
    const result = oldBuild.apply(this, arguments);
    if ((u.id === 'Kris' || u.id === 'Ralsei') && !u.minion) {
      u.el?.classList.add('deltarune-unit', 'deltarune-' + u.id.toLowerCase());
      state(this);
    }
    return result;
  };
  for (const method of ['finish', 'stopBattle', 'start']) {
    const original = Battle.prototype[method];
    Battle.prototype[method] = function () { release(this); return original.apply(this, arguments); };
  }

  return {
    pose,
    check: (u, B, foe) => { add(B, 'check', u, foe, .65); play(B, 'select', .55); },
    act: (u, B, foe, command) => { add(B, 'act', u, foe, .85, { command }); play(B, command === 'SPARE' ? 'spare' : 'select'); },
    slash: (u, B, foe, hit) => { add(B, 'slash', u, foe, .34, { hit }); play(B, hit === 2 ? 'rudebuster_hit' : 'swing'); },
    guard: (u, B, ally) => { add(B, 'guard', u, u, .65, { color: '#ffc0c8' }); if (ally && ally !== u) add(B, 'guard', u, ally, .65, { color: '#ffc0c8' }); play(B, 'weaponpull_fast', .6); },
    soul: (u, B) => { add(B, 'soul', u, u, .65); play(B, 'graze', .5); },
    courage: (u, B) => { add(B, 'courage', u, u, 1.1); play(B, 'power', .75); },
    heal: (u, B, ally) => { add(B, 'heal', u, ally, .7); play(B, 'magicsprinkle', .55); },
    dual: (u, B, empowered = false) => { add(B, 'dual', u, u, 1.1, { empowered }); play(B, 'spellcast', .75); },
    pacify: (u, B, foe, spared) => { add(B, 'pacify', u, foe, .9, { spared }); play(B, spared ? 'spare' : 'spellcast'); },
    fluffy: (u, B, ally) => { add(B, 'guard', u, ally, .7, { color: '#baf4ce' }); play(B, 'power', .55); },
    block: (u, B, ally) => { add(B, 'block', u, ally, .45); play(B, 'graze', .5); },
    prayer: (u, B, ally, miracle = false) => { add(B, 'prayer', u, ally, .95, { miracle }); play(B, 'great_shine', .65); },
    revive: (u, B, ally) => { add(B, 'revive', u, ally, 1.25); play(B, 'revival', .8); },
    prince: (u, B) => { add(B, 'prince', u, u, 1.35); play(B, 'mercyadd', .75); }
  };
})();
