/* fx-toons.js - bespoke cast/impact language for Cosmo, Coal, Boxten and Eggson.
   Each reads from the toon's kit: Cosmo bakes and shares, Coal is a small
   dependable rock, Boxten is a wind-up music box, Eggson is a cane-tapping
   elder. Hooked in through FX.heroSignature so HERO_CINEMATICS drives them. */
'use strict';

(function () {
  const baseSignature = FX.heroSignature;

  /** A prop that pops out, drifts and fades. img is an item/object PNG url. */
  function popImg(x, y, url, size, o) {
    if (!FX.front) return;
    o = o || {};
    const n = el('div');
    n.style.cssText = `position:absolute;left:${x - size / 2}px;top:${y - size / 2}px;width:${size}px;height:${size}px;
      pointer-events:none;opacity:0;z-index:7;transform:translate(0,6px) rotate(${o.rot0 || -20}deg) scale(.3);
      filter:drop-shadow(0 3px 2px #0009)`;
    n.innerHTML = `<img src="${url}" style="width:100%;height:100%;object-fit:contain">`;
    FX.front.appendChild(n);
    const dx = o.dx || 0, dy = o.dy || -size * .7;
    setTimeout(() => {
      n.style.transition = 'transform .32s cubic-bezier(.15,1.45,.35,1),opacity .12s';
      n.style.opacity = 1;
      n.style.transform = `translate(${dx}px,${dy}px) rotate(${o.rot1 || 12}deg) scale(1)`;
    }, o.delay || 0);
    setTimeout(() => {
      n.style.transition = 'transform .3s ease-in,opacity .26s';
      n.style.opacity = 0;
      n.style.transform = `translate(${dx}px,${dy - 14}px) rotate(${(o.rot1 || 12) * 2}deg) scale(.7)`;
    }, (o.delay || 0) + (o.hold || 420));
    setTimeout(() => n.remove(), (o.delay || 0) + (o.hold || 420) + 340);
  }

  /** Flat ground ellipse that expands and fades (shockwave on the floor). */
  function groundWave(x, y, w, col, dur, delay) {
    if (!FX.back) return;
    const n = el('div');
    n.style.cssText = `position:absolute;left:${x - w / 2}px;top:${y - w * .17}px;width:${w}px;height:${w * .34}px;
      border-radius:50%;border:3px solid ${col};box-shadow:0 0 12px ${col}aa,inset 0 0 14px ${col}55;
      pointer-events:none;opacity:0;transform:scale(.2)`;
    FX.back.appendChild(n);
    setTimeout(() => {
      n.style.transition = `transform ${dur}s cubic-bezier(.1,.8,.3,1),opacity ${dur}s ease-out`;
      n.style.opacity = .9; n.style.transform = 'scale(1)';
      requestAnimationFrame(() => { n.style.opacity = 0; });
    }, delay || 0);
    setTimeout(() => n.remove(), (delay || 0) + dur * 1000 + 80);
  }

  const toons = {
    /* Cosmo: a baker. Flour puffs, warm steam, a pastry passed over and a
       soft honey-gold glow with hearts where it is received. */
    cosmoSignature(phase, x, y, opt) {
      if (!this.front) return;
      opt = opt || {}; const size = opt.size || 90, ult = opt.ultimate;
      if (phase === 'cast') {
        this.burst(x, y - size * .1, ult ? 12 : 7, ['#fff6e5', '#f7e2c0'],
          { spMin: 40, spMax: 140, lift: 60, sMin: 5, sMax: 11, life: .7, g: 120, alpha: .75, dscale: .1 });
        popImg(x + (opt.face || 1) * size * .25, y - size * .2, Art.item(ult ? 'Bread' : 'Brownie'), size * .38,
          { dx: (opt.face || 1) * size * .35, dy: -size * .45 });
        this.ring(x, y + size * .24, size * 1.05, '#ffd7a0', .5);
        return;
      }
      if (ult) Sound.play('crowd_aww', { vol: .5, throttle: 600 });
      const glow = el('div');
      glow.style.cssText = `position:absolute;left:${x - size * .6}px;top:${y - size * .65}px;width:${size * 1.2}px;height:${size * 1.2}px;
        border-radius:50%;pointer-events:none;opacity:0;transform:scale(.4);
        background:radial-gradient(circle,#fff3cf 0 14%,#ffd98a88 36%,#ffb86a33 58%,transparent 70%)`;
      this.front.appendChild(glow);
      requestAnimationFrame(() => { glow.style.transition = 'transform .4s ease-out,opacity .16s'; glow.style.opacity = 1; glow.style.transform = 'scale(1)'; });
      setTimeout(() => { glow.style.transition = 'opacity .45s'; glow.style.opacity = 0; }, 340);
      setTimeout(() => glow.remove(), 860);
      this.floatIcon && this.floatIcon(x, y - size * .55, '♥', '#ff9db0');
      this.burst(x, y - size * .3, ult ? 14 : 8, ['#ffe9b8', '#ffcf7a', '#fff'],
        { shape: 'dot', spMin: 30, spMax: 120, lift: 90, sMin: 3, sMax: 6, life: .9, g: -40 });
      this.sparkle(x, y - size * .3, ult ? 8 : 4, '#ffe9b8');
    },

    /* Coal: a pet rock. Gritty dust, tumbling pebbles, a cracked floor. */
    coalSignature(phase, x, y, opt) {
      if (!this.front) return;
      opt = opt || {}; const size = opt.size || 90, ult = opt.ultimate;
      const rock = ['#6e6a66', '#8a847d', '#4f4b48', '#a39d94'];
      if (phase === 'cast') {
        this.dust(x, y + size * .3, -1); this.dust(x, y + size * .3, 1);
        this.burst(x, y + size * .2, ult ? 9 : 5, rock,
          { shape: 'shard', spMin: 60, spMax: 200, lift: 150, sMin: 5, sMax: 10, life: .6, g: 800 });
        groundWave(x, y + size * .3, size * 1.1, '#b8a58a', .45);
        return;
      }
      Sound.play('skill_impact', { vol: ult ? .6 : .45, throttle: 200 });
      this.crack(x, y + size * .3, ult ? 1.4 : .9);
      groundWave(x, y + size * .3, size * (ult ? 1.7 : 1.2), '#c9b79a', .5);
      this.burst(x, y + size * .1, ult ? 18 : 10, rock,
        { shape: 'shard', spMin: 90, spMax: 300, lift: 220, sMin: 5, sMax: 12, life: .8, g: 900 });
      this.smoke && this.smoke(x, y + size * .25, ult ? 5 : 3, '#a79c8c');
      this.shake && this.shake(ult ? 7 : 4, .2);
    },

    /* Boxten: a music box. A key winds up, ticks, then sound waves ripple out. */
    boxtenSignature(phase, x, y, opt) {
      if (!this.front) return;
      opt = opt || {};
      if (phase === 'cast') this.boxtenFx(opt.key === 'W' ? 'wind' : 'tick', x, y, { face: opt.face, big: opt.ultimate });
      else this.boxtenFx(opt.key === 'G' ? 'plink' : 'echo', x, y, { face: opt.face });
    },

    /* Eggson: an old-timer with a cane. A firm tap, a gold shockwave and
       a pop of the egg he is so fond of. */
    eggsonSignature(phase, x, y, opt) {
      if (!this.front) return;
      opt = opt || {}; const size = opt.size || 90, ult = opt.ultimate, face = opt.face || 1;
      const gold = '#e0b85a';
      if (phase === 'cast') {
        if (opt.key === 'B') Sound.play('fist_up', { vol: .6, throttle: 400 });
        groundWave(x + face * size * .3, y + size * .3, size * .7, gold, .4);
        this.dust(x + face * size * .3, y + size * .3, face);
        this.burst(x, y - size * .2, ult ? 10 : 5, ['#ffe9a8', '#e0b85a', '#fff'],
          { shape: 'dot', spMin: 40, spMax: 150, lift: 80, sMin: 3, sMax: 6, life: .6 });
        return;
      }
      this.hitSpark && this.hitSpark(x, y - size * .1, gold);
      groundWave(x, y + size * .3, size * (ult ? 1.7 : 1.2), gold, .5);
      popImg(x, y - size * .4, Art.item('easteregg'), size * .3, { dy: -size * .3, hold: 380 });
      this.burst(x, y - size * .1, ult ? 14 : 8, ['#ff9ec4', '#9ee0ff', '#ffe08a', '#b8f09a'],
        { shape: 'sq', spMin: 70, spMax: 220, lift: 140, sMin: 4, sMax: 8, life: .8, g: 600 });
      this.shake && this.shake(ult ? 6 : 3, .16);
    }
  };


  /* Goofy: orange/bronze armour, grey steel shield, green vest. His effects
     are all about the round shield: an aegis disc that holds, clanging
     blocks, a spinning tornado of shield glints. */
  const GOOFY_ORANGE = '#f29a2e', GOOFY_STEEL = '#b9c4cf', GOOFY_GREEN = '#8fd13a';
  function goofyDisc(x, y, size, dur, face) {
    if (!FX.front) return;
    const n = el('div');
    n.style.cssText = `position:absolute;left:${x + face * size * .15 - size / 2}px;top:${y - size * .55}px;width:${size}px;height:${size}px;
      border-radius:50%;pointer-events:none;opacity:0;transform:scale(.3);z-index:6;
      background:radial-gradient(circle,#e9eef444 0 38%,#9aa7b455 40% 62%,${GOOFY_ORANGE}66 66% 72%,transparent 74%);
      border:4px solid ${GOOFY_ORANGE};box-shadow:0 0 18px ${GOOFY_ORANGE}99,inset 0 0 22px ${GOOFY_STEEL}88`;
    for (let i = 0; i < 6; i++) {
      const r = el('i'); const a = i * Math.PI / 3;
      r.style.cssText = `position:absolute;left:${50 + Math.cos(a) * 41 - 3}%;top:${50 + Math.sin(a) * 41 - 3}%;width:6%;height:6%;
        border-radius:50%;background:${GOOFY_STEEL};box-shadow:0 0 4px #fff`;
      n.appendChild(r);
    }
    FX.front.appendChild(n);
    requestAnimationFrame(() => { n.style.transition = 'transform .28s cubic-bezier(.12,1.5,.3,1),opacity .12s'; n.style.opacity = 1; n.style.transform = 'scale(1)'; });
    setTimeout(() => { n.style.transition = 'transform .35s ease-in,opacity .3s'; n.style.opacity = 0; n.style.transform = 'scale(1.15)'; }, Math.max(300, dur * 1000 - 320));
    setTimeout(() => n.remove(), dur * 1000 + 100);
  }
  FX.goofySkill = function (kind, x, y, opt) {
    if (!this.front) return;
    opt = opt || {}; const face = opt.face || 1, size = opt.size || 110;
    if (kind === 'guard') {
      goofyDisc(x, y, size * 1.5, opt.dur || 5, face);
      groundWave(x, y + size * .3, size * 1.5, GOOFY_ORANGE, .5);
      this.burst(x, y, 10, [GOOFY_ORANGE, GOOFY_STEEL, '#fff'], { shape: 'sq', spMin: 60, spMax: 180, lift: 90, sMin: 4, sMax: 8, life: .6 });
    } else if (kind === 'block') {
      this.hitSpark && this.hitSpark(x + face * size * .35, y - size * .1, '#fff3c0');
      this.ring(x + face * size * .3, y - size * .1, size * .9, GOOFY_STEEL, .3);
      this.burst(x + face * size * .35, y - size * .1, 8, ['#fff3c0', GOOFY_STEEL, GOOFY_ORANGE],
        { dir: face > 0 ? 0 : Math.PI, spread: .9, shape: 'streak', spMin: 120, spMax: 280, sMin: 3, sMax: 6, life: .35, g: 200 });
    } else if (kind === 'throw') {
      for (let i = 0; i < 5; i++) setTimeout(() => this.part({ x: x + face * (size * .4 + i * 50), y: y - size * .1 + rnd(-8, 8),
        vx: face * 40, vy: rnd(-20, 20), g: 0, size: 10, col: GOOFY_STEEL, life: .35, shape: 'streak', rot: face > 0 ? 0 : Math.PI }), i * 40);
      groundWave(x + face * size * 1.2, y + size * .3, size * 1.8, GOOFY_STEEL, .5, 120);
    } else if (kind === 'tornado') {
      const R = opt.radius || 175;
      for (let i = 0; i < 14; i++) {
        const a = i / 14 * Math.PI * 2, d = R * (.35 + (i % 4) * .17);
        setTimeout(() => this.part({ x: x + Math.cos(a) * d * .3, y: y + size * .2 + Math.sin(a) * d * .12 - (i % 5) * 8,
          vx: -Math.sin(a) * 340, vy: -40 - (i % 4) * 22, g: 0, size: 7 + (i % 3) * 3,
          col: i % 3 === 0 ? GOOFY_STEEL : i % 3 === 1 ? GOOFY_ORANGE : GOOFY_GREEN, life: .5, shape: i % 2 ? 'streak' : 'dot', drag: 1.6 }), i * 18);
      }
      groundWave(x, y + size * .3, R * 2, GOOFY_ORANGE, .55);
      groundWave(x, y + size * .3, R * 1.3, GOOFY_STEEL, .45, 80);
      this.smoke && this.smoke(x, y + size * .25, 4, '#d9c9aa');
    } else if (kind === 'intercept') {
      this.crack && this.crack(x, y + size * .3, 1);
      groundWave(x, y + size * .3, size * 1.4, GOOFY_ORANGE, .45);
      this.burst(x, y, 12, [GOOFY_ORANGE, GOOFY_STEEL, GOOFY_GREEN], { shape: 'shard', spMin: 90, spMax: 260, lift: 160, sMin: 5, sMax: 10, life: .7, g: 800 });
    }
  };

  /* Connie: a teal ghost. Mist, translucent afterimages of her own sprite and
     a small drawn ghost mark replace the old rings, emoji and shouted words. */
  function mist(x, y, r, col, dur, delay, o) {
    if (!FX.front) return;
    o = o || {};
    const n = el('div');
    n.style.cssText = `position:absolute;left:${x - r}px;top:${y - r * (o.flat || .8)}px;width:${r * 2}px;height:${r * 2 * (o.flat || .8)}px;
      border-radius:50%;pointer-events:none;opacity:0;z-index:${o.z || 5};transform:translate(0,${o.rise ? 10 : 0}px) scale(${o.from || .3});
      background:radial-gradient(ellipse,${col}cc 0 18%,${col}66 42%,${col}18 66%,transparent 74%);filter:blur(${o.blur == null ? 2 : o.blur}px)`;
    FX.front.appendChild(n);
    setTimeout(() => {
      n.style.transition = `transform ${dur}s cubic-bezier(.15,.7,.3,1),opacity ${dur * .35}s ease-out`;
      n.style.opacity = o.alpha || .8; n.style.transform = `translate(0,${o.rise ? -r * .5 : 0}px) scale(${o.to || 1})`;
      setTimeout(() => { n.style.transition = `opacity ${dur * .65}s ease-in`; n.style.opacity = 0; }, dur * 330);
    }, delay || 0);
    setTimeout(() => n.remove(), (delay || 0) + dur * 1000 + 160);
  }
  /** Little cartoon ghost glyph (round head, wavy hem, two eyes). */
  function ghostMark(x, y, col, size, o) {
    if (!FX.front) return;
    o = o || {};
    const n = el('div'); const w = size || 22;
    n.style.cssText = `position:absolute;left:${x - w / 2}px;top:${y - w}px;width:${w}px;height:${w * 1.1}px;pointer-events:none;z-index:8;opacity:0;
      background:${col};border-radius:50% 50% 8% 8%;filter:drop-shadow(0 0 5px ${o.glow || col}) drop-shadow(0 1px 1px #0008);
      -webkit-mask:radial-gradient(circle at 25% 100%,transparent 0 22%,#000 24%) 0 0/50% 100%,radial-gradient(circle at 75% 100%,transparent 0 22%,#000 24%) 100% 0/50% 100%;
      -webkit-mask-repeat:no-repeat;mask:radial-gradient(circle at 25% 100%,transparent 0 22%,#000 24%) 0 0/50% 100%,radial-gradient(circle at 75% 100%,transparent 0 22%,#000 24%) 100% 0/50% 100%;mask-repeat:no-repeat;
      transform:translate(0,8px) scale(.4)`;
    n.innerHTML = `<i style="position:absolute;left:24%;top:36%;width:15%;height:20%;border-radius:50%;background:#173f44"></i>
      <i style="position:absolute;left:61%;top:36%;width:15%;height:20%;border-radius:50%;background:#173f44"></i>`;
    FX.front.appendChild(n);
    requestAnimationFrame(() => { n.style.transition = 'transform .28s cubic-bezier(.15,1.5,.3,1),opacity .12s'; n.style.opacity = 1; n.style.transform = 'translate(0,0) scale(1)'; });
    setTimeout(() => { n.style.transition = 'transform .5s ease-out,opacity .45s'; n.style.opacity = 0; n.style.transform = 'translate(0,-16px) scale(1.1)'; }, o.hold || 520);
    setTimeout(() => n.remove(), (o.hold || 520) + 560);
  }

  FX.connieSkill = function (kind, x, y, opt) {
    if (!this.front) return;
    opt = opt || {};
    const tw = !!opt.twisted, size = opt.size || 92, face = opt.face || 1, target = opt.target;
    const col = tw ? '#e0559f' : '#5fcfd0', pale = tw ? '#ffc4e2' : '#dcfbf7', deep = tw ? '#7a2f63' : '#2a8c98';
    const ty = t => t.y - 44;
    const afterimage = (gx, gy, scale, life, delay, alpha) => setTimeout(() => {
      const n = el('img'), w = size * (scale || .85);
      n.src = Art.unit('Connie', tw); n.alt = '';
      n.style.cssText = `position:absolute;left:${gx - w / 2}px;top:${gy - w * .92}px;width:${w}px;height:${w * 1.16}px;object-fit:contain;
        pointer-events:none;z-index:6;opacity:0;mix-blend-mode:screen;
        filter:${tw ? 'hue-rotate(290deg) saturate(1.4)' : 'saturate(1.3) brightness(1.25)'} drop-shadow(0 0 9px ${col});
        transform:translate(${-face * 10}px,8px) scaleX(${face})`;
      this.front.appendChild(n);
      requestAnimationFrame(() => { n.style.transition = `transform ${life}s ease-out,opacity .14s`; n.style.opacity = alpha || .5;
        n.style.transform = `translate(${face * 6}px,-${size * .06}px) scaleX(${face})`; });
      setTimeout(() => { n.style.transition = 'transform .4s ease-out,opacity .34s'; n.style.opacity = 0;
        n.style.transform = `translate(${face * 16}px,-${size * .22}px) scaleX(${face})`; }, life * 1000);
      setTimeout(() => n.remove(), life * 1000 + 440);
    }, delay || 0);
    const motes = (cx, cy, n, lift) => { for (let i = 0; i < n; i++) this.part({
      x: cx + rnd(-size * .38, size * .38), y: cy + rnd(-size * .1, size * .3), vx: rnd(-26, 26), vy: rnd(-(lift || 70), -20), g: -10,
      size: rnd(4, 8), col: pick([col, pale]), life: rnd(.5, .95), shape: 'dot', alpha: .8, drag: .4 }); };

    const sfx = (cue, vol, throttle) => Sound.play(cue, { vol, throttle: throttle || 120 });
    if (kind === 'escape') {
      if (opt.phase === 'cast') {
        sfx('connie_vanish', .6, 300);
        // She thins out: afterimage rises, mist pools at her tail.
        afterimage(x, y, 1, .3, 0, .6); afterimage(x, y - 10, .9, .4, 110, .4);
        mist(x, y + size * .2, size * .62, col, .55, 0, { flat: .45, from: .4, to: 1.2 });
        mist(x, y - size * .1, size * .4, pale, .6, 80, { rise: true, flat: 1.2 });
        motes(x, y, 12, 110);
      } else if (opt.phase === 'burst') {
        sfx('connie_return', .7, 300);
        // She returns with a chilling breath: one wide soft wave, no shouting.
        mist(x, y + size * .1, size * 1.15, col, .6, 0, { flat: .55, from: .2, to: 1.3, alpha: .7 });
        mist(x, y - size * .1, size * .55, pale, .45, 0, { flat: 1, from: .4, to: 1.1 });
        afterimage(x, y, 1.05, .22, 0, .55);
        motes(x, y, tw ? 18 : 14, 130);
        ghostMark(x, y - size * .65, pale, 24);
      } else {
        mist(x, y + size * .12, size * .9, col, .5, 0, { flat: .5, from: .3, to: 1.3 });
        ghostMark(x, y - size * .62, pale, 22);
      }
      return;
    }
    if (kind === 'prank') {
      if (target && opt.phase === 'cast') {
        sfx('connie_vanish', .45, 250);
        mist(x, y + size * .1, size * .5, col, .4, 0, { flat: .9 });
        afterimage(x, y, .8, .22, 0, .5);
        // she reappears behind the target
        mist(target.x - face * 26, ty(target) + 10, size * .5, deep, .45, 150, { flat: .9 });
        afterimage(target.x - face * 28, target.y, .8, .4, 170, .55);
      } else if (target) {
        sfx('connie_prank', .6, 250);
        const tx = target.x, tyy = ty(target);
        mist(tx, tyy, size * .62, col, .4, 0, { flat: .9, to: 1.2 });
        [-1, 0, 1].forEach((n, i) => setTimeout(() => this.slash(tx + n * size * .14, tyy - 2,
          { col: i === 1 ? pale : col, ang: face * (-30 + i * 30), small: i !== 1 }), i * 45));
        this.burst(tx, tyy, tw ? 10 : 8, [col, pale], { shape: 'dot', spMin: 60, spMax: 190, lift: 40, sMin: 3, sMax: 6, life: .5 });
        ghostMark(tx, tyy - size * .4, pale, 20, { glow: col });   // Haunted
      }
      return;
    }
    if (kind === 'drift') {
      if (opt.phase === 'cast') {
        sfx('connie_phase', .55, 250);
        mist(x, y + size * .25, size * .7, col, .6, 0, { flat: .4, alpha: .6 });
        afterimage(x - face * 18, y, .9, .55, 0, .35); afterimage(x - face * 36, y + 2, .85, .55, 110, .25);
        motes(x, y, 8, 60);
      } else if (opt.phase === 'end') {
        mist(x, y + size * .2, size * .8, deep, .5, 0, { flat: .45, to: 1.3, alpha: .5 });
      }
      return;
    }
    if (kind === 'presence') {
      sfx('connie_fright', .6, 300);
      // A cold fog rolls across the floor and each foe gets a small shiver.
      mist(x, y + size * .3, size * 1.8, deep, .9, 0, { flat: .3, from: .3, to: 1.4, alpha: .55, blur: 4 });
      mist(x, y + size * .15, size * 1.2, col, .7, 80, { flat: .4, from: .3, to: 1.3, alpha: .5 });
      (opt.targets || []).slice(0, 5).forEach((t, i) => setTimeout(() => {
        if (!t || !t.alive) return;
        mist(t.x, t.y + 6, 40, col, .5, 0, { flat: .35, alpha: .6 });
        ghostMark(t.x, ty(t) - 26, pale, 16, { hold: 380, glow: col });
      }, 140 + i * 80));
      return;
    }
    if (kind === 'fear' && target) {
      sfx('connie_fright', .4, 220);
      const tx = target.x, tyy = ty(target);
      mist(tx, tyy + 14, 36, col, .4, 0, { flat: .5, alpha: .55 });
      this.part({ x: tx + rnd(-10, 10), y: tyy - 30, vx: rnd(-16, 16), vy: -50, g: -6, size: 11, col: pale, life: .7, shape: 'txt', char: '!' });
      return;
    }
    if (kind === 'dodge') {
      sfx('connie_phase', .4, 160);
      afterimage(x - face * 18, y + 2, .85, .3, 0, .5);
      motes(x, y, 5, 50);
      return;
    }
    if (kind === 'veil') {
      sfx('connie_veil', .55, 300);
      // A translucent teal veil settles over Connie and each ally it covers.
      mist(x, y - size * .1, size * .75, col, .7, 0, { flat: 1.15, from: .5, to: 1, alpha: .55, blur: 1 });
      motes(x, y, 8, 80);
      (opt.allies || []).filter(a => a && a.alive && a !== opt.owner).slice(0, 5).forEach((a, i) => setTimeout(() =>
        mist(a.x, a.y - 44, size * .5, col, .6, 0, { flat: 1.15, from: .5, alpha: .45, blur: 1 }), 90 + i * 60));
      return;
    }
    if (kind === 'phantom') {
      sfx('connie_return', .4, 250);
      mist(x, y + size * .15, size * .55, col, .45, 0, { flat: .6 });
      afterimage(x + rnd(-size * .25, size * .25), y + 6, .85, .6, 0, .6);
      ghostMark(x, y - size * .7, pale, 20);
    }
  };

  /* Scraps: a yellow paper-craft cat with pink claws. Her three crafts are
     drawn (kraft cardboard, a red cup, a pink yarn ball) instead of emoji,
     and her Craft Circle reads as a stitched cutting mat. */
  const CRAFT = { cardboard: '#d9a566', cup: '#e5547a', yarn: '#ee7fae' };
  const PAPER = ['#f6c85a', '#fff1c8', '#e5547a', '#d9a566', '#ffffff'];
  function craftIcon(craft, x, y, size, o) {
    if (!FX.front) return;
    o = o || {};
    const n = el('div'); const w = size;
    const looks = {
      cardboard: `background:repeating-linear-gradient(90deg,#c8924f 0 3px,#dcae71 3px 6px);border:2px solid #8a5d2d;border-radius:3px;`,
      cup: `background:linear-gradient(90deg,#b6254d,#f0597f 45%,#b6254d);clip-path:polygon(8% 0,92% 0,76% 100%,24% 100%);`,
      yarn: `border-radius:50%;background:repeating-linear-gradient(35deg,#f08cb7 0 3px,#d4558a 3px 6px);box-shadow:inset -3px -3px 6px #7d1f4a88;`
    };
    n.style.cssText = `position:absolute;left:${x - w / 2}px;top:${y - w / 2}px;width:${w}px;height:${craft === 'cup' ? w * 1.1 : w}px;
      ${looks[craft] || looks.cardboard}pointer-events:none;z-index:7;opacity:0;filter:drop-shadow(0 3px 2px #0009);
      transform:translate(0,8px) rotate(${o.rot0 || -30}deg) scale(.3)`;
    FX.front.appendChild(n);
    requestAnimationFrame(() => {
      n.style.transition = 'transform .26s cubic-bezier(.15,1.5,.3,1),opacity .1s'; n.style.opacity = 1;
      n.style.transform = `translate(${o.dx || 0}px,${o.dy || -w * .5}px) rotate(${o.rot1 || 25}deg) scale(1)`;
    });
    setTimeout(() => { n.style.transition = 'transform .26s ease-in,opacity .24s'; n.style.opacity = 0;
      n.style.transform = `translate(${(o.dx || 0) * 1.4}px,${(o.dy || -w * .5) - 12}px) rotate(${(o.rot1 || 25) * 2}deg) scale(.7)`; }, o.hold || 360);
    setTimeout(() => n.remove(), (o.hold || 360) + 300);
  }
  /** A line of yarn between two points (twisted stripes, slight sag). */
  function yarnLine(x1, y1, x2, y2, col, dur) {
    if (!FX.front) return;
    const dx = x2 - x1, dy = y2 - y1, len = Math.hypot(dx, dy);
    if (len < 16) return;
    const n = el('div'), ang = Math.atan2(dy, dx);
    n.style.cssText = `position:absolute;left:${x1}px;top:${y1 - 2.5}px;width:${len}px;height:5px;border-radius:3px;
      background:repeating-linear-gradient(90deg,${col} 0 5px,#fff2 5px 7px);transform-origin:0 50%;
      transform:rotate(${ang}rad) scaleX(.05);opacity:0;pointer-events:none;z-index:6;filter:drop-shadow(0 1px 1px #421b2d)`;
    FX.front.appendChild(n);
    requestAnimationFrame(() => { n.style.transition = `transform ${dur * .5}s cubic-bezier(.2,.8,.3,1),opacity .08s`;
      n.style.opacity = 1; n.style.transform = `rotate(${ang}rad) scaleX(1)`; });
    setTimeout(() => { n.style.transition = 'opacity .22s'; n.style.opacity = 0; }, dur * 1000);
    setTimeout(() => n.remove(), dur * 1000 + 260);
  }
  function snips(x, y, col, n) {
    for (let i = 0; i < (n || 3); i++) setTimeout(() => FX.slash(x + (i - 1) * 16, y,
      { col: i === 1 ? '#fff1c8' : col, ang: -34 + i * 34, small: i !== 1 }), i * 40);
  }
  const bits = (x, y, n, cols, o) => FX.burst(x, y, n, cols || PAPER,
    Object.assign({ shape: 'paper', spMin: 70, spMax: 210, lift: 70, sMin: 4, sMax: 10, life: .6, g: 460 }, o || {}));

  FX.scrapsSignature = function (phase, x, y, opt) {
    if (!this.front || this._denseVisualSafe) return;
    opt = opt || {};
    const size = opt.size || 92, craft = opt.craft || 'cardboard', col = CRAFT[craft] || CRAFT.cardboard;
    const face = opt.face || 1;
    if (opt.key === 'W') {
      if (phase === 'cast') {
        Sound.play('scraps_grapple', { vol: .55, throttle: 250 });
        const tx = opt.targetX, ty = opt.targetY;
        if (Number.isFinite(tx) && Number.isFinite(ty)) yarnLine(x, y - 8, tx, ty - 20, '#ee7fae', .42);
        groundWave(x, y + size * .3, size * 1.0, '#ee7fae', .35);
        bits(x, y, 6, PAPER, { spMax: 120, life: .4 });
      } else {
        Sound.play('scraps_slam', { vol: .65, throttle: 250 });
        groundWave(x, y + size * .3, size * 1.6, '#f6c85a', .45);
        groundWave(x, y + size * .3, size * 1.0, '#e5547a', .35, 70);
        snips(x, y - size * .2, '#e5547a', 3);
        bits(x, y, 9, PAPER, { spMax: 230 });
      }
      return;
    }
    if (opt.key === 'B') {
      if (phase === 'cast') {
        Sound.play('scraps_snip', { vol: .55, throttle: 250 });
        // a whirl of cut paper rises around her
        for (let i = 0; i < 14; i++) setTimeout(() => {
          const a = i / 14 * Math.PI * 2;
          this.part({ x: x + Math.cos(a) * size * .5, y: y + Math.sin(a) * size * .18 - size * .1,
            vx: -Math.sin(a) * 260, vy: -50 - (i % 4) * 18, g: 0, drag: 1.4, size: 6 + (i % 3) * 3,
            col: PAPER[i % PAPER.length], life: .5, shape: 'paper', spin: 14 });
        }, i * 16);
        groundWave(x, y + size * .3, size * 1.3, '#d9a566', .45);
      } else {
        snips(x, y - size * .15, '#fff1c8', 3);
        bits(x, y, 10, PAPER, { shape: 'shard', spMax: 240 });
      }
      return;
    }
    if (phase === 'cast') {
      Sound.play(craft === 'cup' ? 'scraps_cup' : craft === 'yarn' ? 'scraps_yarn' : 'scraps_snip', { vol: .5, throttle: 180 });
      craftIcon(craft, x + face * size * .38, y - size * .1, size * .34, { dx: face * size * .22 });
      groundWave(x, y + size * .3, size * .9, col, .3);
      bits(x, y, 5, [col, '#fff1c8'], { spMax: 120, life: .4 });
      return;
    }
    if (craft === 'cardboard') {
      snips(x, y, col, 3);
      bits(x, y, 7, ['#d9a566', '#fff1c8'], { spMax: 200 });
    } else if (craft === 'cup') {
      groundWave(x, y + size * .3, size * 1.3, col, .38);
      this.burst(x, y, 8, ['#e5547a', '#fff1c8'], { shape: 'dot', spMin: 80, spMax: 220, lift: 60, sMin: 3, sMax: 7, life: .5 });
    } else {
      yarnLine(x - size * .3, y + 8, x + size * .3, y - 4, '#ee7fae', .35);
      yarnLine(x + size * .3, y + 10, x - size * .3, y - 8, '#d4558a', .35);
      groundWave(x, y + size * .3, size * .9, col, .35);
    }
  };

  FX.scrapsCircle = function (x, y, radius, craft, powered) {
    if (!this.back || this._denseVisualSafe || this.reducedEffects || !this.effectAllowed(2)) return;
    const col = CRAFT[craft] || '#f6c85a';
    const width = Math.max(140, Math.min(650, radius * 2)), height = width * .44;
    const mat = el('div');
    // A self-healing green-less cutting mat: faint grid, stitched border, corner ticks.
    mat.style.cssText = `position:absolute;left:${x - width / 2}px;top:${y - height / 2}px;width:${width}px;height:${height}px;
      border:3px dashed ${col};border-radius:50%;pointer-events:none;opacity:0;transform:scale(.7);z-index:1;
      background:repeating-linear-gradient(0deg,transparent 0 13px,${col}22 13px 14px),repeating-linear-gradient(90deg,transparent 0 13px,${col}22 13px 14px),
        radial-gradient(ellipse,${col}33 0 40%,${col}12 70%,transparent 75%);
      box-shadow:inset 0 0 14px ${col}66${powered ? `,0 0 18px ${col}99` : ''}`;
    // Scissor blades orbit the rim as small paper cutouts.
    const blades = powered ? 5 : 3, orbit = [];
    for (let i = 0; i < blades; i++) {
      const b = el('i'), a = i / blades * Math.PI * 2;
      b.style.cssText = `position:absolute;left:${50 + Math.cos(a) * 49}%;top:${50 + Math.sin(a) * 49}%;width:12px;height:12px;
        background:${PAPER[i % PAPER.length]};clip-path:polygon(50% 0,100% 100%,50% 70%,0 100%);transform:translate(-50%,-50%) rotate(${i * 72}deg);
        filter:drop-shadow(0 1px 1px #0008)`;
      mat.appendChild(b); orbit.push(b);
    }
    this.back.appendChild(mat);
    if (mat.animate) mat.animate([{ transform: 'scale(1) rotate(0deg)' }, { transform: 'scale(1.03) rotate(8deg)' }],
      { duration: 1150, easing: 'ease-out', fill: 'forwards', delay: 400 });
    orbit.forEach((b, i) => { if (b.animate) b.animate([{ opacity: 0 }, { opacity: 1, offset: .25 }, { opacity: 0 }],
      { duration: 1000, delay: i * 60, fill: 'forwards' }); });
    requestAnimationFrame(() => { mat.style.transition = 'transform .4s cubic-bezier(.18,.8,.3,1),opacity .15s';
      mat.style.opacity = powered ? .95 : .7; mat.style.transform = 'scale(1)'; });
    setTimeout(() => { mat.style.transition = 'opacity .3s'; mat.style.opacity = 0; }, 850);
    setTimeout(() => mat.remove(), 1200);
  };

  FX.scrapsShards = function (x, y, radius) {
    if (!this.front || this._denseVisualSafe || this.reducedEffects || !this.effectAllowed(3)) return;
    Sound.play('scraps_shred', { vol: .55, throttle: 160 });
    const r = Math.max(60, Math.min(220, radius || 120));
    groundWave(x, y + 10, r * 1.5, '#fff1c8', .4);
    bits(x, y - 30, 16, PAPER, { shape: 'shard', spMin: 110, spMax: 300, lift: 90, sMin: 5, sMax: 12, life: .8, g: 520 });
    bits(x, y - 30, 8, PAPER, { spMin: 80, spMax: 220 });
    snips(x, y - 28, '#e5547a', 3);
  };

  FX.scrapsCraftSwap = function (x, y, craft) {
    if (!this.front || this._denseVisualSafe || this.reducedEffects || !this.effectAllowed(2)) return;
    Sound.play('scraps_swap', { vol: .45, throttle: 200 });
    craftIcon(craft, x, y - 70, 32, { rot0: -90, rot1: 20, hold: 420, dy: -22 });
    bits(x, y - 40, 7, [CRAFT[craft] || '#f6c85a', '#fff1c8'], { spMax: 130, life: .5 });
  };

  /* Big Wig: a Lawbot judge in a navy suit. Everything is court furniture:
     a thrown law book, red rubber stamps, a bench slam and a drawn scales
     mark for Convicted. Navy, violet and brass; no emoji. */
  const WIG = { navy: '#2a2346', violet: '#8f7bd0', brass: '#d8b45a', paper: '#f3ecd8', red: '#b83a4b' };
  function lawBook(x, y, size) {
    const n = el('div');
    n.style.cssText = `position:absolute;left:${x - size / 2}px;top:${y - size * .38}px;width:${size}px;height:${size * .76}px;z-index:8;pointer-events:none;
      border-radius:3px 6px 6px 3px;background:linear-gradient(90deg,#171230 0 12%,#2f2756 12% 100%);
      border:2px solid ${WIG.brass};box-shadow:inset 0 0 0 3px #1c1638,0 3px 5px #0009;will-change:transform`;
    n.innerHTML = `<i style="position:absolute;left:28%;top:30%;width:44%;height:40%;border:2px solid ${WIG.brass};border-radius:50%;box-sizing:border-box"></i>
      <i style="position:absolute;left:12%;right:0;bottom:-5px;height:5px;background:${WIG.paper};border-radius:0 0 4px 0"></i>`;
    FX.front.appendChild(n);
    return n;
  }
  function scalesMark(x, y, o) {
    if (!FX.front) return;
    o = o || {};
    const n = el('div'), w = 26;
    n.style.cssText = `position:absolute;left:${x - w / 2}px;top:${y - w}px;width:${w}px;height:${w}px;pointer-events:none;z-index:8;opacity:0;
      filter:drop-shadow(0 0 5px ${WIG.violet}) drop-shadow(0 1px 1px #000a);transform:translateY(8px) scale(.4)`;
    // post, beam and two hanging pans
    n.innerHTML = `<i style="position:absolute;left:46%;top:8%;width:8%;height:86%;background:${WIG.brass}"></i>
      <i style="position:absolute;left:8%;top:18%;width:84%;height:7%;background:${WIG.brass};border-radius:3px"></i>
      <i style="position:absolute;left:4%;top:26%;width:26%;height:20%;border:2px solid ${WIG.brass};border-top:0;border-radius:0 0 50% 50%;box-sizing:border-box;background:${WIG.violet}88"></i>
      <i style="position:absolute;left:70%;top:26%;width:26%;height:20%;border:2px solid ${WIG.brass};border-top:0;border-radius:0 0 50% 50%;box-sizing:border-box;background:${WIG.violet}88"></i>
      <i style="position:absolute;left:30%;top:90%;width:40%;height:8%;background:${WIG.brass};border-radius:2px"></i>`;
    FX.front.appendChild(n);
    requestAnimationFrame(() => { n.style.transition = 'transform .3s cubic-bezier(.15,1.5,.3,1),opacity .12s'; n.style.opacity = 1; n.style.transform = 'translateY(0) scale(1)'; });
    setTimeout(() => { n.style.transition = 'transform .5s ease-out,opacity .45s'; n.style.opacity = 0; n.style.transform = 'translateY(-14px) scale(1.1)'; }, o.hold || 700);
    setTimeout(() => n.remove(), (o.hold || 700) + 560);
  }
  function stampSeal(x, y, size) {
    if (!FX.front) return;
    const n = el('div');
    n.style.cssText = `position:absolute;left:${x - size / 2}px;top:${y - size / 2}px;width:${size}px;height:${size}px;z-index:8;pointer-events:none;opacity:0;
      border:4px solid ${WIG.red};border-radius:50%;box-sizing:border-box;color:${WIG.red};display:grid;place-items:center;
      font:900 ${Math.round(size * .17)}px/1 Georgia,serif;letter-spacing:1px;text-shadow:0 0 1px ${WIG.red};
      box-shadow:inset 0 0 0 3px #b83a4b55,0 0 12px #b83a4b88;background:radial-gradient(circle,#b83a4b22,transparent 70%);
      transform:translateY(-30px) rotate(-18deg) scale(1.9)`;
    n.textContent = 'DENIED';
    FX.front.appendChild(n);
    requestAnimationFrame(() => { n.style.transition = 'transform .16s cubic-bezier(.5,0,.9,.4),opacity .08s'; n.style.opacity = .92; n.style.transform = 'translateY(0) rotate(-12deg) scale(1)'; });
    setTimeout(() => { n.style.transition = 'opacity .35s'; n.style.opacity = 0; }, 620);
    setTimeout(() => n.remove(), 1000);
  }
  const wigPaper = (x, y, n, o) => FX.burst(x, y, n, [WIG.paper, '#ffffff', WIG.violet, WIG.brass],
    Object.assign({ shape: 'paper', spMin: 70, spMax: 230, lift: 90, sMin: 5, sMax: 11, life: .7, g: 420 }, o || {}));

  FX.bigWigSkill = function (kind, x, y, opt) {
    if (!this.front) return;
    opt = opt || {};
    const size = opt.size || 100, face = opt.face || 1, t = opt.target;
    if (kind === 'book' && t) {
      const book = lawBook(x, y - size * .5, size * .46);
      const sx = x + face * size * .3, sy = y - size * .5, ex = t.x, ey = t.y - 40;
      const t0 = performance.now(), dur = 400;
      const fly = now => {
        const k = Math.min(1, (now - t0) / dur), e = k * k * (3 - 2 * k);
        const px = sx + (ex - sx) * e, py = sy + (ey - sy) * e - Math.sin(k * Math.PI) * 60;
        book.style.transform = `translate(${px - sx}px,${py - sy}px) rotate(${k * 540 * face}deg)`;
        if (k < 1) requestAnimationFrame(fly); else book.remove();
      };
      requestAnimationFrame(fly);
      groundWave(x, y + size * .3, size * .9, WIG.violet, .35);
      return;
    }
    if (kind === 'bookHit' && t) {
      Sound.play('bigwig_book', { vol: .6, throttle: 200 });
      groundWave(t.x, t.y + 10, size * 1.5, WIG.violet, .45);
      wigPaper(t.x, t.y - 30, 12);
      scalesMark(t.x, t.y - 70, { hold: 900 });
      this.shake && this.shake(5, .18);
      return;
    }
    if (kind === 'stampCast') {
      groundWave(x, y + size * .3, size * 1.1, WIG.red, .4);
      wigPaper(x, y - size * .4, 6, { spMax: 140 });
      return;
    }
    if (kind === 'stamp' && t) {
      Sound.play('bigwig_stamp', { vol: .55, throttle: 70 });
      stampSeal(t.x, t.y - 46, size * .8);
      setTimeout(() => { groundWave(t.x, t.y + 8, size * .9, WIG.red, .3); wigPaper(t.x, t.y - 30, 5, { spMax: 150 }); }, 150);
      return;
    }
    if (kind === 'trip') {
      groundWave(x, y + size * .3, size * 1.3, WIG.brass, .45);
      this.dust(x, y + size * .3, -1); this.dust(x, y + size * .3, 1);
      return;
    }
    if (kind === 'tripHit') {
      Sound.play('bigwig_gavel', { vol: .65, throttle: 250 });
      groundWave(x, y + size * .3, size * 3.4, WIG.violet, .7);
      groundWave(x, y + size * .3, size * 2.1, WIG.brass, .55, 80);
      this.burst(x, y - 10, 14, [WIG.brass, WIG.violet, WIG.paper], { shape: 'shard', spMin: 90, spMax: 280, lift: 130, sMin: 5, sMax: 11, life: .7, g: 700 });
      this.shake && this.shake(9, .28);
      return;
    }
    if (kind === 'wag' && t) {
      this.ring && this.ring(t.x, t.y - 40, size * .6, WIG.violet, .3);
      this.slash && this.slash(t.x, t.y - 44, { col: WIG.paper, ang: face * -30, small: true });
      this.part({ x: t.x, y: t.y - 90, vx: 0, vy: -50, g: -8, size: 15, col: WIG.brass, life: .6, shape: 'txt', char: '!' });
    }
  };

  Object.assign(FX, toons, {
    heroSignature(kind, phase, x, y, opt) {
      const fn = toons[kind + 'Signature'];
      return fn ? fn.call(this, phase, x, y, opt) : baseSignature.call(this, kind, phase, x, y, opt);
    }
  });
})();
