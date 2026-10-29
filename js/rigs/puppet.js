/* puppet.js - the shared cutout-puppet framework for animated battle characters.

   A character is a declarative config; the framework does the rest:
     - parts      : the skeleton. Each part is an atlas piece in a parent/child tree with a pivot and
                    "drivers" (spring channels that rotate or move it). Draw order = list order.
     - channels   : named springs (stiffness, damping, rest value). Poses only set *targets* on them.
     - legs       : ground contact, so feet stay planted while the body bobs, crouches and squashes.
     - face       : eyes (sclera, pupil, lids that fade into the skin, closed-eye arcs, lashes), brows,
                    blush, mouth (teeth, tongue) and a table of expressions the face blends between.
     - props      : little vector objects parented to a part (a held treat, a sparkle...).
<<<<<<< HEAD
     - behavior   : the personality. idle / walk / wind / attack / cast / spin poses, named skill poses, and a weighted list
=======
     - behavior   : the personality. idle / walk / wind / attack / cast / spin poses plus a weighted list
>>>>>>> ccb31b9f96fec6e5b5e1509b31b66f6b3cb024e0
                    of idle events, each just a function that edits the pose targets for this frame.
   The framework owns blinking, glancing, hit reactions, status poses (sleep, stun), the spark pool and
   the per-frame spring stepping, so a new character is mostly data + a few pose functions.

   Behaviour functions receive a context: { P, T, dt, ph, k, on, run, idle, s01, vf, alt, u, sway, breath,
   beat, set(exp), emit(x, y, vx, vy, life, size), spark(n, x, y, ...), lib }. P is the target pose
   (every channel name, plus x, y, sx, sy, crouch, air, lookX, lookY and any custom field you read).
   Toggle: Save.data.opt.animatedChars (Settings > Graphics). */
'use strict';

const PuppetRig = (() => {
  const NS = 'http://www.w3.org/2000/svg';
  const lib = {
    clamp: (v, a, b) => v < a ? a : v > b ? b : v,
    lerp: (a, b, t) => a + (b - a) * t,
    seg: (a, b, t) => lib.clamp((t - a) / (b - a), 0, 1),
    easeOut: t => 1 - (1 - t) * (1 - t),
    easeInOut: t => t < .5 ? 2 * t * t : 1 - 2 * (1 - t) * (1 - t),
    easeOutBack: t => { const c = 2.2, x = t - 1; return 1 + (c + 1) * x * x * x + c * x * x; },
    rnd: (a, b) => a + Math.random() * (b - a),
    pulse: t => Math.sin(lib.clamp(t, 0, 1) * Math.PI)
  };
  const { clamp, lerp, rnd } = lib;
  const rad = d => d * Math.PI / 180;
  const f1 = n => n.toFixed(1);
  const rotPt = (p, c, deg) => {
    const a = rad(deg), s = Math.sin(a), k = Math.cos(a), x = p[0] - c[0], y = p[1] - c[1];
    return [c[0] + x * k - y * s, c[1] + x * s + y * k];
  };
  const rotAt = (deg, p) => `rotate(${deg.toFixed(2)} ${p[0]} ${p[1]})`;
  const STAR_D = 'M0 -1L.2 -.2L1 0L.2 .2L0 1L-.2 .2L-1 0L-.2 -.2Z';
  let UID = 0;

  const node = (tag, attrs, parent) => {
    const n = document.createElementNS(NS, tag);
    if (attrs) for (const k in attrs) n.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(n);
    return n;
  };
  const tf = (n, v) => n.setAttribute('transform', v);

  /** Damped spring, sub-stepped so stiff settings stay stable at any frame rate. */
  class Spring {
    constructor(k, d, x = 0) { this.k = k; this.d = d; this.x = x; this.v = 0; }
    step(target, dt) {
      const n = Math.max(1, Math.ceil(dt / .006)), h = dt / n;
      for (let i = 0; i < n; i++) { this.v += (this.k * (target - this.x) - this.d * this.v) * h; this.x += this.v * h; }
      return this.x;
    }
    kick(v) { this.v += v; }
  }

  /* Expression table. lid/low = upper/lower lid cover, tilt = lid angle (+ angry), pup = pupil size,
     eye = eye scale, bo/bt/by = brow opacity/tilt/height, mw/mc/mo/mt = mouth half-width, curve (+ smile),
     openness, lopsided tilt, tt = teeth showing. Characters override or add entries. */
  const BASE_EXPR = {
    happy:      { lid: 0,   low: 0,   tilt: 0,  pup: 1,    eye: 1,    bo: 0, bt: 0,   by: 0, mw: 13, mc: 5,  mo: 9,  mt: 0, tt: 0 },
    grin:       { lid: 0,   low: 0,   tilt: 0,  pup: 1,    eye: 1,    bo: 0, bt: 0,   by: 0, mw: 17, mc: 3,  mo: 11, mt: 0, tt: 1 },
    content:    { lid: 1,   low: 0,   tilt: 0,  pup: 1,    eye: 1,    bo: 0, bt: 0,   by: 0, mw: 7,  mc: 4,  mo: 0,  mt: 0, tt: 0 },
    excited:    { lid: 0,   low: 0,   tilt: 0,  pup: 1.06, eye: 1.05, bo: 0, bt: 0,   by: 0, mw: 11, mc: 3,  mo: 15, mt: 0, tt: 0 },
    grumpy:     { lid: .38, low: 0,   tilt: 7,  pup: 1,    eye: 1,    bo: 1, bt: 4,   by: 2, mw: 11, mc: -5, mo: 0,  mt: 3, tt: 0 },
    surprised:  { lid: 0,   low: 0,   tilt: 0,  pup: .62,  eye: 1.1,  bo: 0, bt: 0,   by: 0, mw: 5,  mc: 0,  mo: 11, mt: 0, tt: 0 },
    worried:    { lid: .08, low: 0,   tilt: -6, pup: 1.1,  eye: 1.04, bo: 1, bt: -14, by: -4, mw: 12, mc: -5, mo: 11, mt: 0, tt: 0 },
    hurt:       { lid: .35, low: .25, tilt: -8, pup: .72,  eye: 1,    bo: 0, bt: 0,   by: 0, mw: 11, mc: -5, mo: 8,  mt: 0, tt: 0 },
    determined: { lid: .22, low: 0,   tilt: 9,  pup: 1.05, eye: 1,    bo: 1, bt: 8,   by: 4, mw: 12, mc: 3,  mo: 5,  mt: 0, tt: 1 },
    joy:        { lid: .08, low: .32, tilt: 0,  pup: 1,    eye: 1,    bo: 0, bt: 0,   by: 0, mw: 14, mc: 6,  mo: 17, mt: 0, tt: 0 },
    sleep:      { lid: 1,   low: 0,   tilt: 0,  pup: 1,    eye: 1,    bo: 0, bt: 0,   by: 0, mw: 5,  mc: 1,  mo: 0,  mt: 0, tt: 0 }
  };
  const EKEYS = Object.keys(BASE_EXPR.happy);

  /** A held or worn vector prop, drawn once into a group that rides on a part. */
  const PROPS = {
    // a freshly baked sweet: muffin with a cherry on top
    treat(g, s = 1) {
      const k = s;
      node('path', { d: `M${-9 * k} 2L${-7 * k} 12L${7 * k} 12L${9 * k} 2Z`, fill: '#e2a65c', stroke: '#6b3a1c', 'stroke-width': 1.6 * k, 'stroke-linejoin': 'round' }, g);
      node('path', { d: `M${-10 * k} 3Q${-11 * k} -6 ${-3 * k} -8Q0 -13 ${4 * k} -8Q${11 * k} -6 ${10 * k} 3Z`, fill: '#f6c9d6', stroke: '#6b3a1c', 'stroke-width': 1.6 * k, 'stroke-linejoin': 'round' }, g);
      node('circle', { cx: 1 * k, cy: -12 * k, r: 3 * k, fill: '#d6303e', stroke: '#6b3a1c', 'stroke-width': 1.2 * k }, g);
      [[-5, -3], [2, -4], [5, 0], [-1, 0]].forEach(([x, y]) => node('circle', { cx: x * k, cy: y * k, r: .9 * k, fill: '#fff' }, g));
    }
  };

  /** Catches rig-config mistakes (bad parent, missing piece, unknown channel) once, at define time. */
  function validate(C) {
    const bad = m => console.warn('PuppetRig: ' + C.img + ' - ' + m);
    const names = new Set(), chans = new Set(Object.keys(C.channels).concat(['hit', 'rx', 'ry', 'lookX', 'lookY', 'sx', 'sy', 'vf', 'T', 'ry']));
    C.parts.forEach((p, i) => {
      if (names.has(p.n)) bad('duplicate part ' + p.n);
      if (p.parent && !names.has(p.parent)) bad(p.n + ' needs its parent ' + p.parent + ' listed before it');
      if (p.piece !== false && !C.pieces[p.piece || p.n]) bad(p.n + ' has no atlas piece');
      [].concat(p.rot || [], p.tx || [], p.ty || []).forEach(([ch]) => { if (!chans.has(ch)) bad(p.n + ' drives unknown channel ' + ch); });
      names.add(p.n);
    });
    (C.legs || []).forEach(L => { if (!names.has(L.part)) bad('leg part ' + L.part + ' missing'); if (!C.channels[L.ch]) bad('leg channel ' + L.ch + ' missing'); });
    (C.props || []).forEach(pr => { if (!names.has(pr.part)) bad('prop ' + pr.n + ' sits on missing part ' + pr.part); });
    if (C.faceOn && !names.has(C.faceOn)) bad('faceOn part ' + C.faceOn + ' missing');
    const B = C.behavior || {};
    (B.events || []).forEach(e => { if (!B.event || !B.event[e.n]) bad('idle event ' + e.n + ' has no function'); });
<<<<<<< HEAD
    for (const style in (B.skills || {})) if (typeof B.skills[style] !== 'function') bad('skill pose ' + style + ' must be a function');
=======
>>>>>>> ccb31b9f96fec6e5b5e1509b31b66f6b3cb024e0
  }

  function define(C) {
    validate(C);
    const [AW, AH] = C.atlas;
    const imgUrl = () => (typeof ASSET === 'string' ? ASSET : './') + C.img;
    const EXPR = {};
    for (const k in BASE_EXPR) EXPR[k] = Object.assign({}, BASE_EXPR[k], C.expr && C.expr[k]);
    for (const k in (C.expr || {})) if (!EXPR[k]) EXPR[k] = Object.assign({}, BASE_EXPR.happy, C.expr[k]);
    const FACE = C.face, BEH = C.behavior;
    const SOLE_Y = C.ground;

    /* ---------- eyes ---------- */
    function eyeNode(parent, id, e) {
      const sk = FACE.skin;
      const clipI = node('clipPath', { id: id + 'i' }, parent.defs);
      node('ellipse', { cx: 0, cy: 0, rx: e.rx - 2, ry: e.ry - 2 }, clipI);
      const gr = node('radialGradient', { id: id + 'g', cx: '45%', cy: '40%', r: '65%' }, parent.defs);
      node('stop', { offset: 0, 'stop-color': '#ffffff' }, gr);
      node('stop', { offset: .7, 'stop-color': '#f1f1f4' }, gr);
      node('stop', { offset: 1, 'stop-color': '#cfd0d8' }, gr);
      const g = node('g', { transform: `translate(${e.c[0]} ${e.c[1]})` }, parent.g);
      const S = node('g', null, g);
      node('ellipse', { rx: e.rx, ry: e.ry, fill: `url(#${id}g)`, stroke: '#050505', 'stroke-width': e.sw || 5 }, S);
      const clipG = node('g', { 'clip-path': `url(#${id}i)` }, S);
      const pupil = node('g', null, clipG);
      node('ellipse', { cx: 0, cy: 0, rx: e.prx || e.pr, ry: e.pr, fill: '#030304' }, pupil);
      if (e.shine) node('ellipse', { cx: e.shine[0], cy: e.shine[1], rx: e.shine[2], ry: e.shine[3] || e.shine[2], fill: '#fff', opacity: .92 }, pupil);
      // the lids fade out at the eye's rim so the skin patch melts into the head
      const mg = node('radialGradient', { id: id + 'f', gradientUnits: 'userSpaceOnUse', cx: 0, cy: 0, r: e.rx + 6, gradientTransform: `scale(1 ${(e.ry + 6) / (e.rx + 6)})` }, parent.defs);
      node('stop', { offset: 0, 'stop-color': '#fff' }, mg);
      node('stop', { offset: .9, 'stop-color': '#fff' }, mg);
      node('stop', { offset: 1, 'stop-color': '#000' }, mg);
      const mk = node('mask', { id: id + 'k', maskUnits: 'userSpaceOnUse', x: -e.rx - 10, y: -e.ry - 10, width: 2 * e.rx + 20, height: 2 * e.ry + 20 }, parent.defs);
      node('rect', { x: -e.rx - 10, y: -e.ry - 10, width: 2 * e.rx + 20, height: 2 * e.ry + 20, fill: `url(#${id}f)` }, mk);
      const lids = node('g', null, node('g', { mask: `url(#${id}k)` }, g));
      const lidT = node('g', null, lids);
      node('rect', { x: -80, y: -160, width: 160, height: 160, fill: sk }, lidT);
      const edgeT = node('path', { fill: 'none', stroke: '#050505', 'stroke-width': 5, 'stroke-linecap': 'round' }, lidT);
      const lidB = node('g', null, lids);
      node('rect', { x: -80, y: 0, width: 160, height: 160, fill: sk }, lidB);
      node('path', { d: `M${-e.rx} 0H${e.rx}`, stroke: '#050505', 'stroke-width': 4, 'stroke-linecap': 'round' }, lidB);
      const closed = node('path', { fill: 'none', stroke: '#050505', 'stroke-width': 5.2, 'stroke-linecap': 'round', opacity: 0 }, g);
      const lashes = (e.lash || []).map(l => ({ l, p: node('path', { fill: 'none', stroke: '#050505', 'stroke-width': 3.4, 'stroke-linecap': 'round' }, g) }));
      return { e, g, S, pupil, lids, lidT, lidB, edgeT, closed, lashes };
    }

    /* ---------- build the SVG tree ---------- */
    function build(host) {
      const id = 'pr' + (++UID);
      const svg = node('svg', { viewBox: `0 0 ${C.vb[0]} ${C.vb[1]}`, class: 'rig-svg', 'aria-hidden': 'true' }, host);
      const defs = node('defs', null, svg);
      const R = { id, svg, parts: {}, root: node('g', null, svg) };
      const piece = (parent, name) => {
        const [ax, ay, w, h, x, y] = C.pieces[name];
        const s = node('svg', { x, y, width: w, height: h, viewBox: `${ax} ${ay} ${w} ${h}` }, parent);
        node('image', { href: imgUrl(), width: AW, height: AH }, s);
        return s;
      };
      R.piece = piece;
      C.parts.forEach(p => {
        const g = node('g', null, p.parent ? R.parts[p.parent].g : R.root);
        if (p.piece !== false) piece(g, p.piece || p.n);
        R.parts[p.n] = { spec: p, g };
        if (C.faceOn === p.n) R.face = node('g', null, g);
      });
      if (C.sourceFace && R.face) {
        const head = R.parts[C.faceOn].g;
        const mask = node('mask', { id: id + 'original', maskUnits: 'userSpaceOnUse', x: 0, y: 0, width: C.vb[0], height: C.vb[1], style: 'mask-type:alpha' }, defs);
        piece(mask, C.faceOn);
        const original = node('image', { href: (typeof ASSET === 'string' ? ASSET : './') + C.sourceFace, width: C.vb[0], height: C.vb[1], mask: `url(#${id}original)` });
        head.insertBefore(original, R.face);
        R.face.setAttribute('opacity', '0');
      }
      if (C.toothyGrin && R.face) {
        const head = R.parts[C.faceOn].g, grin = C.toothyGrin;
        const mask = node('mask', { id: id + 'grinPatch', maskUnits: 'userSpaceOnUse', x: 0, y: 0, width: C.vb[0], height: C.vb[1], style: 'mask-type:alpha' }, defs);
        node('path', { d: grin.patch, fill: '#fff', style: 'filter:blur(1px)' }, mask);
        R.grin = node('g', { opacity: 0 });
        head.insertBefore(R.grin, R.face);
        piece(node('g', { mask: `url(#${id}grinPatch)` }, R.grin), C.faceOn);
        node('path', { d: grin.shape, fill: '#fff9f3', stroke: '#171013', 'stroke-width': 3.2, 'stroke-linejoin': 'round' }, R.grin);
        node('path', { d: grin.teeth, fill: 'none', stroke: '#171013', 'stroke-width': 2.2, 'stroke-linecap': 'round' }, R.grin);
      }
      // blush and freckles
      (FACE.blush || []).forEach((b, i) => {
        let host2 = R.face;
        if (b.mask) {
          const mk = node('mask', { id: id + 'bm' + i, maskUnits: 'userSpaceOnUse', x: 0, y: 0, width: C.vb[0], height: C.vb[1], style: 'mask-type:alpha' }, defs);
          piece(mk, C.faceOn);
          host2 = node('g', { mask: `url(#${id}bm${i})` }, R.face);
        }
        node('circle', { cx: b.c[0], cy: b.c[1], r: b.r, fill: b.color, opacity: b.opacity || .75 }, host2);
        (b.dots || []).forEach(d => node('circle', { cx: b.c[0] + d[0], cy: b.c[1] + d[1], r: d[2] || 1.8, fill: b.dotColor || '#2a0b10' }, host2));
      });
      R.eye = FACE.eyes.map((e, i) => {
        const wrap = { defs, g: R.face };
        if (e.mask) {   // the far eye only shows where the head's own silhouette is
          const mk = node('mask', { id: id + 'x' + i, maskUnits: 'userSpaceOnUse', x: 0, y: 0, width: C.vb[0], height: C.vb[1], style: 'mask-type:alpha' }, defs);
          piece(mk, C.faceOn);
          wrap.g = node('g', { mask: `url(#${id}x${i})` }, R.face);
        }
        return eyeNode(wrap, id + 'e' + i, e);
      });
      R.brow = (FACE.brows || []).map(() => node('path', { d: 'M-15 0H15', stroke: '#050505', 'stroke-width': 3.8, 'stroke-linecap': 'round', fill: 'none' }, R.face));
      R.mouthClip = node('path', null, node('clipPath', { id: id + 'm' }, defs));
      // the mouth sits in its own group so a character can tilt it with the plane of the face
      const MG = FACE.mouth.rot ? node('g', { transform: `rotate(${FACE.mouth.rot} ${FACE.mouth.c[0]} ${FACE.mouth.c[1]})` }, R.face) : R.face;
      R.mouthFill = node('path', { stroke: 'none' }, MG);
      R.tongue = node('ellipse', { fill: FACE.mouth.tongue || '#e8798a', 'clip-path': `url(#${id}m)` }, MG);
      R.teeth = node('path', { stroke: '#050505', 'stroke-width': FACE.mouth.line || 2.4, 'stroke-linecap': 'round', fill: 'none' }, MG);
      R.mouth = node('path', { fill: 'none', stroke: '#050505', 'stroke-width': FACE.mouth.stroke || 3.6, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, MG);
      // form shading: the painted head gets darker toward its far side, so the flat face picks that up
      if (FACE.shade) {
        const sg = node('linearGradient', { id: id + 'sh', x1: 0, y1: 0, x2: 1, y2: 1 }, defs);
        FACE.shade.forEach(([o, c]) => node('stop', { offset: o, 'stop-color': c }, sg));
        const mk = node('mask', { id: id + 'sm', maskUnits: 'userSpaceOnUse', x: 0, y: 0, width: C.vb[0], height: C.vb[1], style: 'mask-type:alpha' }, defs);
        piece(mk, C.faceOn);
        const hg = node('g', { mask: `url(#${id}sm)`, style: 'mix-blend-mode:multiply' }, R.face);
        node('rect', { x: 0, y: 0, width: C.vb[0], height: C.vb[1], fill: `url(#${id}sh)` }, hg);
      }
      // props ride on their part
      R.props = {};
      (C.props || []).forEach(pr => {
        const g = node('g', { opacity: 0 }, R.parts[pr.part].g);
        const inner = node('g', { transform: `translate(${pr.at[0]} ${pr.at[1]})` }, g);
        const spin = node('g', null, inner);
        (typeof pr.draw === 'string' ? PROPS[pr.draw] : pr.draw)(spin, pr.scale || 1);
        R.props[pr.n] = { g, spin, spec: pr };
      });
      R.sparks = [];
      for (let i = 0; i < 8; i++) {
        const g = node('g', { opacity: 0 }, R.root);
        node('path', { d: STAR_D, fill: C.spark[0], stroke: C.spark[1], 'stroke-width': .18 }, g);
        R.sparks.push({ g, on: false, x: 0, y: 0, vx: 0, vy: 0, age: 0, life: 1, s: 6 });
      }
      return R;
    }

    class Rig {
      constructor(host) {
        this.R = build(host);
        this.T = lib.rnd(0, 20); this.phase = 0; this.run = 0; this.swing = 0;
        this.E = Object.assign({}, EXPR[C.defaultExpr || 'happy']);
        this.sp = {};
        for (const k in C.channels) { const [kk, d, x] = C.channels[k]; this.sp[k] = new Spring(kk, d, x || 0); }
        const base = { hit: [300, 11], rx: [250, 18], ry: [300, 20], lookX: [480, 30], lookY: [480, 30], sx: [380, 15, 1], sy: [380, 15, 1] };
        for (const k in base) if (!this.sp[k]) this.sp[k] = new Spring(base[k][0], base[k][1], base[k][2] || 0);
        this.blink = 0; this.nextBlink = lib.rnd(1.5, 3.5); this.blinkT = -1; this.dbl = false;
        this.nextLook = lib.rnd(.6, 1.6); this.look = { x: .3, y: 0 };
        this.idleEv = null; this.nextEv = lib.rnd(3, 6);
        this.hurtT = 0; this.burst = false;
        this.prev = { anim: 'idle', dur: 0, t: 0, hit: 0 };
        this.props = {};
      }

      emit(x, y, vx, vy, life, s) {
        const p = this.R.sparks.find(q => !q.on); if (!p) return;
        p.on = true; p.x = x; p.y = y; p.vx = vx; p.vy = vy; p.age = 0; p.life = life; p.s = s;
      }

      /** Called every render frame with the live battle unit. */
      update(u, dt) {
        dt = clamp(dt, 0, .05);
        if (!dt) return;
        const sp = this.sp, T = (this.T += dt);
        const moving = !!u.moving;
        const speed = Math.hypot(u.vx || 0, u.vy || 0);
        const s01 = clamp(speed / 120, .35, 1.25);
        const vf = clamp((u.vx || 0) * (u.face || 1) / 140, -1.2, 1.2);
        this.run += ((moving ? 1 : 0) - this.run) * clamp(dt * 9, 0, 1);
        const run = this.run, idle = 1 - run;
        const animOn = u.animT > 0;
        const anim = animOn ? u.animState : 'idle';
        const ph = animOn ? 1 - clamp(u.animT / Math.max(.01, u.animDur || 1), 0, 1) : 0;
        const casting = !!u.casting && !animOn;

        const pv = this.prev;
        if (animOn && (anim !== pv.anim || u.animDur !== pv.dur || u.animT > pv.t + .02)) {
          if (anim === 'wind' || (anim === 'attack' && pv.anim !== 'wind') || anim === 'cast') this.swing++;
          this.idleEv = null; this.burst = false;
        }
        pv.anim = anim; pv.dur = u.animDur; pv.t = u.animT;
        if ((u.hitT || 0) > pv.hit + .01) {
          this.hurtT = .4;
          const hk = C.hitKick || {};
          for (const k in hk) if (sp[k]) sp[k].kick(hk[k] * (Math.random() < .5 && hk._rand ? -1 : 1));
          if (BEH.onHit) BEH.onHit(this, lib);
        }
        pv.hit = u.hitT || 0;
        this.hurtT = Math.max(0, this.hurtT - dt);

        // the target pose: every channel defaults to its rest (0) so behaviours only write what moves
        const P = { x: 0, y: 0, sx: 1, sy: 1, crouch: 0, air: 0, lookX: this.look.x, lookY: this.look.y, legs: [0, 0], lift: [0, 0] };
        for (const k in C.channels) P[k] = C.rest && C.rest[k] != null ? C.rest[k] : 0;
        const ctx = {
<<<<<<< HEAD
          P, T, dt, ph, k: 0, on: 0, run, idle, s01, vf, u, lib, alt: this.swing % 2, anim, style: u.animStyle || '', rig: this,
=======
          P, T, dt, ph, k: 0, on: 0, run, idle, s01, vf, u, lib, alt: this.swing % 2, anim, rig: this,
>>>>>>> ccb31b9f96fec6e5b5e1509b31b66f6b3cb024e0
          sway: Math.sin(T * (C.tempo || .6)), breath: Math.sin(T * 1.9), beat: Math.sin(T * (C.beatRate || 3.6)),
          exp: this.hurtT > 0 ? (BEH.hurtExpr || 'hurt') : (C.defaultExpr || 'happy'),
          set(e) { this.exp = e; },
          emit: (...a) => this.emit(...a),
          spark: (n, x, y, vx, vy, life, s) => { for (let i = 0; i < n; i++) this.emit(x + lib.rnd(-6, 6), y + lib.rnd(-6, 6), (vx || 0) * lib.rnd(.6, 1.4), (vy || 0) * lib.rnd(.6, 1.4), life || .6, s || 5); },
          prop: (n, v) => { this.props[n] = v; }
        };
        this.props = {};

        if (!animOn && !casting) {
          this.nextEv -= dt;
          if (!this.idleEv && this.nextEv <= 0 && !moving && BEH.events && BEH.events.length) {
            const tot = BEH.events.reduce((a, e) => a + e.w, 0); let r = Math.random() * tot, pick = BEH.events[0];
            for (const e of BEH.events) { if ((r -= e.w) <= 0) { pick = e; break; } }
            this.idleEv = { n: pick.n, t: 0, d: pick.d };
            this.nextEv = lib.rnd(...(BEH.eventGap || [5, 10]));
          }
          if (moving) this.idleEv = null;
        }
        BEH.idle(ctx);
        const ev = this.idleEv;
        if (ev) {
          ev.t += dt;
          ctx.k = ev.t / ev.d; ctx.on = Math.sin(clamp(ctx.k, 0, 1) * Math.PI);
          if (ctx.k >= 1) this.idleEv = null; else BEH.event[ev.n](ctx);
        }
        if (run > .02) {
          this.phase += dt * Math.PI * 2 * (C.walkFreq[0] + C.walkFreq[1] * s01);
          ctx.phase = this.phase;
          if (BEH.walk) BEH.walk(ctx);
        }
<<<<<<< HEAD
        if ((animOn || casting) && BEH.skills && BEH.skills[ctx.style]) BEH.skills[ctx.style](ctx);
        else if (anim === 'wind' && BEH.wind) BEH.wind(ctx);
=======
        if (anim === 'wind' && BEH.wind) BEH.wind(ctx);
>>>>>>> ccb31b9f96fec6e5b5e1509b31b66f6b3cb024e0
        else if (anim === 'attack' && BEH.attack) BEH.attack(ctx);
        else if ((anim === 'cast' || casting) && BEH.cast) BEH.cast(ctx);
        else if (anim === 'spin' && BEH.spin) BEH.spin(ctx);
        else if (animOn && BEH.generic) BEH.generic(ctx);

        let exp = ctx.exp;
        if (u.visualSleep) { exp = 'sleep'; (BEH.sleep || (c => { c.P.head = (c.P.head || 0) + 15; }))(ctx); }
        else if (u.visualStun) { exp = 'hurt'; (BEH.stun || (() => {}))(ctx); P.lookX = Math.cos(T * 9); P.lookY = Math.sin(T * 9); }

        // blink and glances
        this.nextBlink -= dt; this.nextLook -= dt;
        if (this.nextBlink <= 0 && this.blinkT < 0) { this.blinkT = 0; this.nextBlink = this.dbl ? .22 : lib.rnd(...(C.blinkGap || [2, 4.8])); this.dbl = !this.dbl && Math.random() < .22; }
        if (this.blinkT >= 0) { this.blinkT += dt; const b = this.blinkT / .13; this.blink = b < 1 ? Math.sin(b * Math.PI) : 0; if (b >= 1) this.blinkT = -1; }
        if (this.nextLook <= 0 && !animOn) { this.nextLook = lib.rnd(...(C.lookGap || [.7, 2.4])); this.look = { x: lib.rnd(...(C.lookX || [-.55, 1])), y: lib.rnd(-.35, .4) }; }

        this.draw(P, exp, dt, ctx);
      }

      draw(P, exp, dt, ctx) {
        const R = this.R, sp = this.sp, T = this.T;
        const V = {};
        for (const k in C.channels) V[k] = sp[k].step(P[k], dt);
        const hit = sp.hit.step(0, dt);
        const rx = sp.rx.step(P.x, dt), ry = sp.ry.step(P.y - P.air, dt);
        const sx = sp.sx.step(P.sx, dt), sy = sp.sy.step(P.sy, dt);
        const lx = sp.lookX.step(P.lookX, dt), ly = sp.lookY.step(P.lookY, dt);
        const extra = { vf: ctx.vf, hit, T, ry, V };

        // ---- legs + ground contact ---------------------------------------------------------
        let maxSole = 0;
        const legAng = C.legs.map((L, i) => V[L.ch] + (i ? -1 : 1) * P.crouch * (L.crouch == null ? 7 : L.crouch));
        C.legs.forEach((L, i) => L.sole.forEach(p0 => {
          const q = rotPt(p0, L.hip, legAng[i]), y = q[1] - P.lift[i] + (L.up || 0);
          if (y > maxSole) maxSole = y;
        }));
        const drop = P.crouch * (C.crouchDrop || 6);
        const W = C.waist;
        tf(R.root, `translate(${f1(rx)} ${f1(ry + SOLE_Y - maxSole + drop)})translate(${W[0]} ${SOLE_Y})scale(${sx.toFixed(3)} ${sy.toFixed(3)})translate(${-W[0]} ${-SOLE_Y})`);

        // ---- part drivers --------------------------------------------------------------------
        const sum = (arr, extra2) => { let s = 0; for (const [ch, c] of arr) s += (V[ch] != null ? V[ch] : extra2[ch] || 0) * c; return s; };
        C.parts.forEach(p => {
          const g = R.parts[p.n].g;
          const li = C.legs.findIndex(L => L.part === p.n);
          if (li >= 0) { tf(g, `translate(0 ${f1(-P.lift[li])})${rotAt(legAng[li], C.legs[li].hip)}`); return; }
          if (!p.rot && !p.tx && !p.ty) return;
          const r = p.rot ? sum(p.rot, extra) : 0, x = p.tx ? sum(p.tx, extra) : 0, y = p.ty ? sum(p.ty, extra) : 0;
          tf(g, `translate(${f1(x)} ${f1(y)})${rotAt(r, p.pivot)}`);
        });
        if (C.extraDrive) C.extraDrive(R, V, extra, P, lib, tf);

        // ---- props -------------------------------------------------------------------------------
        for (const n in R.props) {
          const pr = R.props[n], v = this.props[n] || 0;
          pr.g.setAttribute('opacity', clamp(v, 0, 1).toFixed(2));
          if (v > 0) tf(pr.spin, `rotate(${(pr.spec.tilt || 0) + Math.sin(T * 4) * 4})scale(${(.7 + .3 * clamp(v, 0, 1)).toFixed(2)})`);
        }

        // ---- face ---------------------------------------------------------------------------------
        const tgt = EXPR[exp] || EXPR.happy, E = this.E, ek = clamp(dt * 16, 0, 1);
        EKEYS.forEach(k => { E[k] = lerp(E[k], tgt[k], ek); });
        const cover = clamp(Math.max(E.lid, this.blink * 1.02), 0, 1.05);
        R.eye.forEach(o => {
          const e = o.e;
          tf(o.S, `scale(${E.eye.toFixed(3)})`);
          tf(o.pupil, `translate(${f1(lx * e.tx)} ${f1(ly * e.ty)})scale(${E.pup.toFixed(3)})`);
          const oy = e.ry + 6, edge = -oy + cover * 2 * oy;
          tf(o.lids, `rotate(${(-E.tilt * (e.tiltSign || 1)).toFixed(2)})`);
          tf(o.lidT, `translate(0 ${edge.toFixed(2)})`);
          const sag = Math.pow(clamp(cover, 0, 1), 2) * e.ry * .5;
          o.edgeT.setAttribute('d', `M${-e.rx - 6} 0Q0 ${f1(sag * 2)} ${e.rx + 6} 0`);
          tf(o.lidB, `translate(0 ${(oy - E.low * 2 * oy).toFixed(2)})`);
          o.lidB.setAttribute('opacity', E.low > .02 ? 1 : 0);
          // closed eye: a curved line; lashes ride down onto it
          const w = clamp((cover - .55) / .4, 0, 1), cw = w * w * (3 - 2 * w), es = E.eye;
          const cy0 = e.ry * .1 * es, depth = e.ry * .4 * es, ax = e.rx * .95 * es;
          o.closed.setAttribute('d', `M${f1(-ax)} ${f1(cy0)}Q0 ${f1(cy0 + 2 * depth)} ${f1(ax)} ${f1(cy0)}`);
          o.closed.setAttribute('opacity', cw.toFixed(2));
          o.edgeT.setAttribute('opacity', (1 - cw).toFixed(2));
          o.lashes.forEach(({ l, p }) => {
            const x = l.f * e.rx * es, y0 = Math.sqrt(Math.max(0, 1 - l.f * l.f)) * e.ry * es;
            const t = clamp((x / ax + 1) / 2, 0, 1), yc = cy0 + 4 * t * (1 - t) * depth - 1;
            const y = lerp(y0 - 1, yc, cw), len = l.len * (1 + .12 * Math.sin(T * 2.2 + l.f * 5));
            const dx = l.f * 3.2 - 1.2, bend = (l.f < 0 ? -1.4 : 1.4) + hit * .1;
            p.setAttribute('d', `M${f1(x)} ${f1(y)}Q${f1(x + dx * .4 + bend)} ${f1(y + len * .5)} ${f1(x + dx)} ${f1(y + len)}`);
          });
        });
        (FACE.brows || []).forEach((b, i) => {
          const el = R.brow[i];
          el.setAttribute('opacity', clamp(E.bo, 0, 1).toFixed(2));
          tf(el, `translate(${b.c[0]} ${(b.c[1] + E.by).toFixed(1)})rotate(${((b.sign || 1) * E.bt).toFixed(1)})scale(${b.s || 1})`);
        });

        const M = FACE.mouth, [mx, my] = M.c, mw = E.mw * (M.scale || 1), mc = E.mc, mo = Math.max(0, E.mo * (M.scale || 1) + (exp === 'joy' ? Math.sin(T * 14) * 1.5 : 0));
        const yl = my - E.mt * .5, yr = my + E.mt * .5, xl = mx - mw, xr = mx + mw;
        const topC = my + 2 * mc * .6, cy2 = topC + mo * 1.7;
        // box mouths (a squared-off toothy grin) drop straight down from the corners and round off at the chin
        const yb = Math.max(yl, yr) + mo * 1.15, box = M.box && E.tt > .5 && mo >= 2.2;
        const d = box
          ? `M${f1(xl)} ${f1(yl)}Q${mx} ${f1(topC)} ${f1(xr)} ${f1(yr)}C${f1(xr + 1)} ${f1(yr + mo * .95)} ${f1(mx + mw * .6)} ${f1(yb)} ${mx} ${f1(yb)}C${f1(mx - mw * .6)} ${f1(yb)} ${f1(xl - 1)} ${f1(yl + mo * .95)} ${f1(xl)} ${f1(yl)}Z`
          : `M${f1(xl)} ${f1(yl)}Q${mx} ${f1(topC)} ${f1(xr)} ${f1(yr)}Q${mx} ${f1(cy2)} ${f1(xl)} ${f1(yl)}Z`;
        const open = mo >= 2.2;
        const line = M.cat && mc > 0 ? `M${f1(xl)} ${f1(yl)}Q${f1(mx - mw / 2)} ${f1(my + mc * 1.7)} ${mx} ${f1(my)}Q${f1(mx + mw / 2)} ${f1(my + mc * 1.7)} ${f1(xr)} ${f1(yr)}` : `M${f1(xl)} ${f1(yl)}Q${mx} ${f1(topC)} ${f1(xr)} ${f1(yr)}`;
        R.mouth.setAttribute('d', open ? d : line);
        R.mouthFill.setAttribute('d', open ? d : '');
        R.mouthFill.setAttribute('fill', E.tt > .5 ? '#f4f4f6' : (M.fill || '#a2303f'));
        R.mouthClip.setAttribute('d', d);
        R.tongue.setAttribute('cx', mx); R.tongue.setAttribute('cy', f1((topC + cy2) / 2 + mo * .75));
        R.tongue.setAttribute('rx', f1(mw * .55)); R.tongue.setAttribute('ry', f1(Math.max(.1, mo * .42)));
        R.tongue.setAttribute('opacity', open && E.tt < .5 && mo > 8 ? 1 : 0);
        if (open && E.tt > .5) {
          const yAt = (t, c) => (1 - t) * (1 - t) * yl + 2 * t * (1 - t) * c + t * t * yr;
          const n = M.teethCount || 2, ts = []; for (let i = 1; i <= n; i++) ts.push(i / (n + 1));
          const mid = M.teethRow ? `M${f1(xl + 2 * mw * .1)} ${f1(yAt(.1, (topC + cy2) / 2))}L${f1(xl + 2 * mw * .9)} ${f1(yAt(.9, (topC + cy2) / 2))}` : '';
          R.teeth.setAttribute('d', mid + ts.map(t => `M${f1(xl + 2 * mw * t)} ${f1(yAt(t, topC) + 1)}L${f1(xl + 2 * mw * t)} ${f1(box ? yb - mw * .08 * (1 - 4 * (t - .5) * (t - .5)) - 1.5 - (1 - t) * 0 : yAt(t, cy2) - 1)}`).join(''));
        } else R.teeth.setAttribute('d', '');

        if (R.grin) R.grin.setAttribute('opacity', ['grin', 'joy', 'excited'].includes(exp) ? '1' : '0');

        // drifting sparkles
        R.sparks.forEach(p => {
          if (!p.on) return;
          p.age += dt;
          if (p.age >= p.life) { p.on = false; p.g.setAttribute('opacity', 0); return; }
          p.x += p.vx * dt; p.y += p.vy * dt;
          const k = p.age / p.life;
          p.g.setAttribute('opacity', Math.sin(k * Math.PI).toFixed(2));
          tf(p.g, `translate(${f1(p.x)} ${f1(p.y)})rotate(${(p.age * 120).toFixed(0)})scale(${(p.s * (1 - k * .3)).toFixed(2)})`);
        });
      }
    }

    return {
      enabled() {
        try { return !!(Save && Save.data && Save.data.opt && Save.data.opt.animatedChars === true); }
        catch (e) { return true; }
      },
      create(host) { return new Rig(host); }
    };
  }

  return { define, lib, PROPS };
})();
<<<<<<< HEAD
=======

>>>>>>> ccb31b9f96fec6e5b5e1509b31b66f6b3cb024e0
