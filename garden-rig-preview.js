/* scraps-rig.js - Scraps' own battle sprite (Characters/scraps/scraps-battle-v2.png),
   cut into limbs, ears, head, dress and tail and animated like a cutout puppet.

   The pieces live in one atlas (Characters/scraps/scraps-rig.png) made from the exact
   pixels of her sprite. Only the face is redrawn in vector - round eyes, stripes and
   smile in the same style - so she can blink, look around and change expression.
   Motion comes from procedural poses plus springs (anticipation, squash & stretch,
   follow-through, overlapping action on ears, tail, head and hands).
   Toggled by Save.data.opt.animatedChars (Settings > Graphics). */
'use strict';

const ScrapsRig = (() => {
  const NS = 'http://www.w3.org/2000/svg';
  const IMG = 'Characters/scraps/scraps-rig.png', AW = 1100, AH = 399;
  // atlas rect (x, y, w, h) and where the piece sits in the 586 x 640 sprite
  const ATLAS = {"head":[0,0,247,268,225,79],"torso":[249,0,154,171,216,335],"earR":[405,0,68,156,380,28],"armRf":[475,0,144,155,430,206],"earL":[621,0,79,144,271,12],"tail3":[702,0,138,140,12,338],"eyeL":[842,0,113,135,259,149],"eyeR":[957,0,84,129,383,157],"armLf":[0,270,120,102,158,336],"thighL":[122,270,103,89,203,445],"thighR":[227,270,66,84,304,460],"pupL":[295,270,67,81,292,175],"footL":[364,270,77,80,144,547],"footR":[443,270,90,77,344,551],"pupR":[535,270,53,75,395,184],"shinL":[590,270,55,67,183,507],"shinR":[647,270,41,61,338,517],"armRu":[690,270,129,54,334,326],"armLu":[821,270,68,44,252,340],"tail1":[891,270,72,40,180,436],"tail2":[965,270,80,39,125,440],"mouthP":[0,374,59,23,346,292]};
  // joints in sprite pixels
  const HIP = [[240, 462], [338, 478]], KNEE = [[219, 520], [354, 530]], ANK = [[199, 560], [364, 564]];
  const SHO = [[303, 370], [354, 363]], ELB = [[264, 357], [451, 351]], HND = [[190, 375], [520, 272]];
  const TAIL = [[236, 458], [192, 455], [137, 464], [70, 395]];
  const WAIST = [300, 480], NECK = [338, 347], GROUND = 632;
  const SOLE = [[[165, 628], [208, 630]], [[372, 626], [416, 628]]];
  // eyes are cut from her sprite (white + outline + lashes, and the pupil as its own layer);
  // c = eye centre, o = outer outline radii (lids), i = inside radii (pupil clip), p = pupil centre
  const EYE = [
    { c: [319, 214.5], ox: 50, oy: 55.5, ix: 42, iy: 47, p: [325, 216], tx: 8, ty: 9, skin: '#eec35f', s: -1, base: 'eyeL', pup: 'pupL' },
    { c: [422.5, 220.5], ox: 36.5, oy: 51.5, ix: 28.5, iy: 43, p: [421.5, 221], tx: 5, ty: 8, skin: '#f2c968', s: 1, base: 'eyeR', pup: 'pupR' }
  ];
  const MOUTH = [375, 301];
  const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
  const lerp = (a, b, t) => a + (b - a) * t;
  const rad = d => d * Math.PI / 180;
  const seg = (a, b, t) => clamp((t - a) / (b - a), 0, 1);
  const easeOut = t => 1 - (1 - t) * (1 - t);
  const easeInOut = t => t < .5 ? 2 * t * t : 1 - 2 * (1 - t) * (1 - t);
  const easeOutBack = t => { const c = 2.2, x = t - 1; return 1 + (c + 1) * x * x * x + c * x * x; };
  const rnd = (a, b) => a + Math.random() * (b - a);
  const ang = (p, q) => Math.atan2(q[0] - p[0], q[1] - p[1]) * 180 / Math.PI;   // from straight down, + toward +x
  const rotPt = (p, c, deg) => {                                                  // SVG (clockwise) rotation
    const a = rad(deg), s = Math.sin(a), k = Math.cos(a), x = p[0] - c[0], y = p[1] - c[1];
    return [c[0] + x * k - y * s, c[1] + x * s + y * k];
  };
  const f1 = n => n.toFixed(1);
  const rotAt = (deg, p) => `rotate(${deg.toFixed(2)} ${p[0]} ${p[1]})`;
  let UID = 0;

  const node = (tag, attrs, parent) => {
    const n = document.createElementNS(NS, tag);
    if (attrs) for (const k in attrs) n.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(n);
    return n;
  };
  const tf = (n, v) => n.setAttribute('transform', v);
  const imgUrl = () => (typeof ASSET === 'string' ? ASSET : './') + IMG;

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

  /* Expressions. lid/low = upper/lower lid cover, tilt = lid angle (+ angry), pup = pupil
     size, bo/bt/by = brow opacity/tilt (+ worried)/height, mw/mc/mo/mt = mouth half-width,
     smile curve, openness, lopsided tilt. */
  const EXPR = {
    happy:      { lid: 0,   low: 0,   tilt: 0,   pup: 1,    eye: 1,    bo: 0, bt: 0,   by: 0,  mw: 27, mc: 10,  mo: 0,  mt: 0 },
    smug:       { lid: .5,  low: 0,   tilt: -4,  pup: 1,    eye: 1,    bo: 0, bt: 0,   by: 0,  mw: 31, mc: 9,   mo: 0,  mt: -9 },
    scared:     { lid: 0,   low: 0,   tilt: 0,   pup: .6,   eye: 1.07, bo: 1, bt: 22,  by: -6, mw: 20, mc: -10, mo: 30, mt: 0 },
    determined: { lid: .3,  low: 0,   tilt: 20,  pup: 1.05, eye: 1,    bo: 1, bt: -18, by: 8,  mw: 33, mc: 14,  mo: 20, mt: 0 },
    hurt:       { lid: .3,  low: .22, tilt: -12, pup: .68,  eye: 1,    bo: 1, bt: 26,  by: 0,  mw: 22, mc: -12, mo: 26, mt: 0 },
    joy:        { lid: .1,  low: .42, tilt: 0,   pup: 1,    eye: 1,    bo: 0, bt: 0,   by: 0,  mw: 34, mc: 16,  mo: 28, mt: 0 },
    run:        { lid: .1,  low: .06, tilt: 8,   pup: 1,    eye: 1,    bo: 0, bt: 0,   by: 0,  mw: 31, mc: 13,  mo: 16, mt: 0 },
    sleep:      { lid: 1,   low: 0,   tilt: 0,   pup: 1,    eye: 1,    bo: 0, bt: 0,   by: 0,  mw: 12, mc: 2,   mo: 10, mt: 0 }
  };
  const EKEYS = Object.keys(EXPR.happy);

  // rest orientations measured from the sprite itself
  const REST = {
    leg: [0, 1].map(i => [ang(HIP[i], KNEE[i]), ang(KNEE[i], ANK[i])]),
    arm: [0, 1].map(i => [ang(SHO[i], ELB[i]), ang(ELB[i], HND[i])])
  };

  function build(host) {
    const id = 'sr' + (++UID);
    const svg = node('svg', { viewBox: '0 0 586 640', class: 'rig-svg', 'aria-hidden': 'true' }, host);
    const defs = node('defs', null, svg);
    EYE.forEach((e, i) => {
      node('ellipse', { cx: e.c[0], cy: e.c[1], rx: e.ix, ry: e.iy }, node('clipPath', { id: id + 'e' + i }, defs));
      node('ellipse', { cx: e.c[0], cy: e.c[1], rx: e.ox - 3, ry: e.oy - 3 }, node('clipPath', { id: id + 'o' + i }, defs));
    });
    node('rect', { x: -200, y: -400, width: 400, height: 400 }, node('clipPath', { id: id + 'lc' }, defs));
    const mouthClip = node('path', null, node('clipPath', { id: id + 'mc' }, defs));

    const R = { id, svg };
    R.root = node('g', null, svg);
    const piece = (parent, name) => {
      const [ax, ay, w, h, x, y] = ATLAS[name];
      const s = node('svg', { x, y, width: w, height: h, viewBox: `${ax} ${ay} ${w} ${h}` }, parent);
      node('image', { href: imgUrl(), width: AW, height: AH }, s);
      return s;
    };
    const grp = parent => node('g', null, parent);

    // tail chain (behind everything)
    R.tail = [];
    let par = R.root;
    ['tail1', 'tail2', 'tail3'].forEach(n => { const g = grp(par); piece(g, n); R.tail.push(g); par = g; });
    // legs: thigh > shin > foot
    R.leg = [0, 1].map(i => {
      const side = i ? 'R' : 'L';
      const th = grp(R.root); piece(th, 'thigh' + side);
      const sh = grp(th); piece(sh, 'shin' + side);
      const ft = grp(sh); piece(ft, 'foot' + side);
      return { th, sh, ft };
    });
    // torso carries the arms, dress and head
    R.torso = grp(R.root);
    const armR = grp(R.torso); piece(armR, 'armRu');
    const armRf = grp(armR); piece(armRf, 'armRf');
    R.dress = grp(R.torso); piece(R.dress, 'torso');
    const armL = grp(R.torso); piece(armL, 'armLu');
    const armLf = grp(armL); piece(armLf, 'armLf');
    R.arm = [{ u: armL, f: armLf }, { u: armR, f: armRf }];
    R.headG = grp(R.torso);
    R.earL = grp(R.headG); piece(R.earL, 'earL');
    R.earR = grp(R.headG); piece(R.earR, 'earR');
    piece(R.headG, 'head');
    R.face = grp(R.headG);

    // face: eyes and mouth are her own pixels; lids, brows and the other mouths are drawn on top
    const stripe = '#a4062f';
    R.eye = EYE.map((e, i) => {
      const [cx, cy] = e.c;
      const sc = grp(R.face); piece(sc, e.base);
      const clipG = node('g', { 'clip-path': `url(#${id}e${i})` }, sc);
      const pupil = grp(clipG); piece(pupil, e.pup);
      const lidG = node('g', { 'clip-path': `url(#${id}o${i})` }, sc);
      const lt = node('g', { transform: `translate(${cx} ${cy})` }, lidG);
      const low = node('ellipse', { rx: e.ox + 12, ry: e.oy * 1.05, fill: e.skin, stroke: '#050505', 'stroke-width': 8 }, lt);
      const lid = grp(lt);
      node('rect', { x: -200, y: -400, width: 400, height: 400, fill: e.skin }, lid);
      const lc = node('g', { 'clip-path': `url(#${id}lc)` }, lid);
      const st = node('rect', { x: -4, y: -250, width: 8, height: 500, rx: 4, fill: stripe }, lc);
      node('path', { d: 'M-200 0H200', stroke: '#050505', 'stroke-width': 11 }, lid);
      const brow = node('path', { d: 'M-30 0Q0 -9 30 0', stroke: '#2a1220', 'stroke-width': 8, 'stroke-linecap': 'round', fill: 'none', opacity: 0 }, R.face);
      return { e, sc, pupil, low, lid, st, brow };
    });
    R.mouthP = piece(R.face, 'mouthP');
    R.tongue = node('ellipse', { fill: '#ee7d96', 'clip-path': `url(#${id}mc)` }, R.face);
    R.mouth = node('path', { fill: 'none', stroke: '#050505', 'stroke-width': 7, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, R.face);
    R.mouthClip = mouthClip;
    R.smear = node('path', { fill: '#fff7dc', opacity: 0 }, R.root);
    return R;
  }

  class Rig {
    constructor(host) {
      this.R = build(host);
      this.T = rnd(0, 20); this.phase = 0; this.run = 0;
      this.E = Object.assign({}, EXPR.happy);
      this.exp = 'happy'; this.expHold = 0;
      const S = (k, d, x) => new Spring(k, d, x);
      this.sp = {
        headR: S(170, 13), headY: S(220, 15), headX: S(200, 15), torso: S(190, 14),
        earL: S(150, 7), earR: S(150, 7), hem: S(120, 8), hit: S(300, 11),
        aU: [S(480, 26, -62), S(480, 26, 35)], aF: [S(340, 17, -34), S(340, 17, 78)],
        rx: S(260, 18), ry: S(300, 20), sx: S(380, 15, 1), sy: S(380, 15, 1),
        lookX: S(500, 30), lookY: S(500, 30)
      };
      this.tail = [0, 1, 2].map(() => new Spring(70, 6));
      this.blink = 0; this.nextBlink = rnd(1.5, 3.5); this.blinkT = -1; this.dbl = false;
      this.nextLook = rnd(.6, 1.6); this.look = { x: .3, y: 0 };
      this.nextEar = rnd(2, 5); this.idleEv = null; this.nextEv = rnd(4, 8);
      this.swing = 0; this.prev = { anim: 'idle', dur: 0, t: 0, hit: 0 };
      this.hurtT = 0; this.tailSwirl = 0; this._ry = 0; this.armFront = false;
    }

    /** Called every render frame with the live battle unit. */
    update(u, dt) {
      dt = clamp(dt, 0, .05);
      if (!dt) return;
      const sp = this.sp, K = 2.4;
      this.T += dt;
      const T = this.T;
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

      // a new action alternates which way she swings
      const pv = this.prev;
      if (animOn && (anim !== pv.anim || u.animDur !== pv.dur || u.animT > pv.t + .02)) {
        if (anim === 'wind' || (anim === 'attack' && pv.anim !== 'wind') || anim === 'cast' || anim === 'spin') this.swing++;
        this.idleEv = null;
      }
      pv.anim = anim; pv.dur = u.animDur; pv.t = u.animT;
      if ((u.hitT || 0) > pv.hit + .01) {
        this.hurtT = .38; sp.hit.kick(-9); sp.headR.kick(-260); sp.earL.kick(-420); sp.earR.kick(-420);
        sp.aU[0].kick(-340); sp.aU[1].kick(340); sp.sy.kick(-3.2); sp.sx.kick(3.2);
      }
      pv.hit = u.hitT || 0;
      this.hurtT = Math.max(0, this.hurtT - dt);
      this.expHold = Math.max(0, this.expHold - dt);

      // ---- base pose (relaxed stance) ------------------------------------------
      const breath = Math.sin(T * 1.9), sway = Math.sin(T * .55);
      const P = {
        x: 0, y: 0, sx: 1, sy: 1, torso: 0, crouch: 0, air: 0, head: 0, hx: 0, hy: 0,
        aU: [-62 - breath * 1.5, 35 + breath * 1.5], aF: [-34 - breath * 2, 78 + breath * 2],
        leg: [{ a: -8, b: -10 }, { a: 8, b: 7 }],
        tail: 0, lookX: this.look.x, lookY: this.look.y
      };
      let exp = this.hurtT > 0 ? 'hurt' : this.expHold > 0 ? this.exp : 'happy';
      let smear = 0, smearA = 0, smearB = 0, front = false;

      if (!animOn && !casting) {
        this.nextEv -= dt;
        if (!this.idleEv && this.nextEv <= 0 && !moving) {
          const r = Math.random();
          this.idleEv = { n: r < .4 ? 'claws' : r < .75 ? 'hop' : 'peek', t: 0, d: r < .4 ? 2.6 : r < .75 ? .75 : 1.9 };
          this.nextEv = rnd(6, 11);
        }
        if (moving) this.idleEv = null;
      }
      const beat = Math.sin(T * 4.2), bounce = Math.max(0, beat);
      P.x += sway * 4 * K * idle; P.torso += sway * 3 * idle; P.head += -sway * 2.4 * idle + beat * 1.5 * idle;
      P.sy += (breath * .014 - bounce * .02) * idle; P.sx -= (breath * .008 - bounce * .02) * idle;
      P.y -= bounce * 3.5 * K * idle;
      P.aU[0] += (sway * 7 - beat * 3) * idle; P.aU[1] += (sway * 7 + beat * 3) * idle;
      P.aF[0] += (sway * 10 - beat * 5) * idle; P.aF[1] += (sway * 10 + beat * 5) * idle;
      P.hy += breath * .7 * K * idle;
      const ev = this.idleEv;
      if (ev) {
        ev.t += dt;
        const k = ev.t / ev.d;
        if (k >= 1) this.idleEv = null;
        else if (ev.n === 'claws') {
          front = true;
          // lifts a paw to inspect her claws, smirks, then drops it
          const up = easeOut(seg(0, .22, k)) * (1 - easeInOut(seg(.84, 1, k)));
          P.aU[1] = lerp(P.aU[1], 118, up);
          P.aF[1] = lerp(P.aF[1], 190 + (k > .4 && k < .8 ? Math.sin(T * 14) * 14 : 0), up);
          P.head += 9 * up; P.hx += 4 * K * up; P.torso -= 3 * up;
          P.lookX = lerp(P.lookX, .55, up); P.lookY = lerp(P.lookY, .85, up);
          if (up > .6) exp = 'smug';
        } else if (ev.n === 'hop') {
          const h = Math.sin(clamp(k, 0, 1) * Math.PI), air = seg(.22, .78, k);
          P.crouch = (k < .22 ? Math.sin(seg(0, .22, k) * Math.PI) * .8 : 0) + (k > .78 ? Math.sin(seg(.78, 1, k) * Math.PI) * .7 : 0);
          P.air = Math.sin(air * Math.PI) * 16 * K * (k > .22 && k < .78 ? 1 : 0);
          P.aU[0] -= 40 * h; P.aU[1] += 40 * h; P.aF[0] -= 60 * h; P.aF[1] += 60 * h;
          exp = 'joy';
        } else if (ev.n === 'peek') {
          const lk = Math.sin(k * Math.PI * 2) * Math.sin(k * Math.PI);
          P.lookX = lk; P.head += lk * 6; P.hx += lk * 3 * K;
        }
      }
      P.tail = Math.sin(T * 1.4) * 6;
      this.nextEar -= dt;
      if (this.nextEar <= 0) { this.nextEar = rnd(2, 6); (Math.random() < .5 ? sp.earL : sp.earR).kick(-rnd(380, 520)); }

      // ---- locomotion ------------------------------------------------------
      if (run > .02) {
        this.phase += dt * Math.PI * 2 * (1.5 + 1.7 * s01);
        const f = this.phase, sn = Math.sin(f), cs = Math.cos(f), amp = 30 + 16 * s01;
        [[0, -13, 0], [1, 12, Math.PI]].forEach(([i, base, off]) => {
          const a = base + Math.sin(f + off) * amp, k = 10 + Math.pow(Math.max(0, Math.cos(f + off)), .8) * (58 + 26 * s01);
          P.leg[i].a = lerp(P.leg[i].a, a, run); P.leg[i].b = lerp(P.leg[i].b, a - k, run);
        });
        const sw = 36 + 14 * s01;
        P.aU[1] = lerp(P.aU[1], 45 - sn * sw, run); P.aF[1] = lerp(P.aF[1], 75 - sn * sw * .8, run);
        P.aU[0] = lerp(P.aU[0], -62 + sn * sw * .55, run); P.aF[0] = lerp(P.aF[0], -60 + sn * 26, run);
        P.y -= Math.abs(sn) * (4 + 5 * s01) * K * run;
        P.air += Math.abs(sn) * 5 * s01 * K * run;
        P.torso += (7 + 7 * s01) * run + cs * 3 * run;
        P.head += (-4 + cs * 2.5) * run; P.hy += Math.abs(sn) * 2.5 * K * run;
        P.sy += (1 - Math.abs(sn)) * -.04 * run + .03 * run; P.sx += (1 - Math.abs(sn)) * .05 * run - .02 * run;
        P.lookX = lerp(P.lookX, 1, run * .7);
        P.tail = lerp(P.tail, -14, run);
        P.x += 4 * K * run;
        if (!animOn) exp = this.hurtT > 0 ? 'hurt' : 'run';
      }

      // ---- actions ---------------------------------------------------------
      const alt = this.swing % 2;
      if (anim === 'wind') {
        const p = easeOut(ph);
        exp = 'determined';
        P.crouch = .85 * p; P.torso = -16 * p; P.x -= 11 * K * p; P.sx += .1 * p; P.sy -= .12 * p;
        P.head += 8 * p; P.hx -= 3 * K * p;
        P.aU[1] = lerp(P.aU[1], alt ? 125 : 165, p); P.aF[1] = lerp(P.aF[1], alt ? 170 : 200, p);
        P.aU[0] = lerp(P.aU[0], -75, p); P.aF[0] = lerp(P.aF[0], -95, p);
        P.lookX = lerp(P.lookX, 1, p); P.lookY = 0; P.tail = lerp(P.tail, 24, p);
      } else if (anim === 'attack') {
        exp = ph < .7 ? 'determined' : 'happy';
        const q = ph, st = easeOutBack(seg(.1, .32, q)), rec = easeInOut(seg(.55, 1, q)), hold = 1 - rec;
        const a0 = alt ? 125 : 165, a1 = alt ? 82 : 55, g0 = alt ? 170 : 200, g1 = alt ? 92 : 75;
        P.aU[1] = lerp(lerp(a0, a1, st), 35, rec); P.aF[1] = lerp(lerp(g0, g1, st), 78, rec);
        P.aU[0] = lerp(lerp(-75, -40, st), -62, rec); P.aF[0] = lerp(-95, -34, rec);
        P.x += lerp(-11, 32, st) * K * hold; P.torso = lerp(-16, 24, st) * hold;
        P.crouch = lerp(.55, .32, st) * hold;
        P.sx += lerp(.1, -.14, st) * hold; P.sy += lerp(-.12, .17, st) * hold;
        P.head += lerp(10, -14, st) * hold; P.hx += 8 * K * st * hold;
        P.leg[0].a = lerp(-26, 8, st) * hold - 8 * rec; P.leg[1].a = lerp(22, -16, st) * hold + 8 * rec;
        P.leg[0].b = P.leg[0].a - 8 * hold; P.leg[1].b = P.leg[1].a + 4;
        P.lookX = 1; P.lookY = .2 * hold; P.tail = lerp(20, -16, st) * hold;
        smear = Math.sin(seg(.1, .5, q) * Math.PI) * .85; smearA = a0; smearB = lerp(a0, a1, st);
      } else if (anim === 'cast' || casting) {
        exp = 'joy';
        const p = casting ? .5 : ph;
        const crouch = Math.sin(seg(0, .28, p) * Math.PI * .5) * (1 - seg(.28, .4, p));
        const jump = Math.sin(seg(.28, .85, p) * Math.PI);
        const land = p > .85 ? Math.sin(seg(.85, 1, p) * Math.PI) : 0;
        P.crouch = crouch * .9 + land * .7; P.air = jump * 30 * K;
        P.sx += crouch * .12 - jump * .1 + land * .1; P.sy += -crouch * .14 + jump * .14 - land * .1;
        const rs = jump + crouch * .3;
        P.aU[1] = lerp(P.aU[1], 150, rs); P.aF[1] = lerp(P.aF[1], 175, rs);
        P.aU[0] = lerp(P.aU[0], -150, rs); P.aF[0] = lerp(P.aF[0], -175, rs);
        P.head -= jump * 8; P.hy -= jump * 3 * K; P.torso += crouch * -6; P.lookX = 0; P.lookY = -.4 * jump;
        P.leg[0].a = -8 - 14 * jump; P.leg[1].a = 8 + 14 * jump;
        P.leg[0].b = P.leg[0].a - 40 * jump; P.leg[1].b = P.leg[1].a - 40 * jump;
        P.tail = 30 * jump; this.tailSwirl = jump;
      } else if (anim === 'spin') {
        exp = 'determined';
        P.aU = [-100, 100]; P.aF = [-100, 100];
        P.leg[0].a = -24; P.leg[1].a = 24; P.leg[0].b = -54; P.leg[1].b = -6;
        P.air = 8 * K; P.tail = 40; this.tailSwirl = 1; P.lookX = 0; P.head = Math.sin(T * 30) * 4;
      } else this.tailSwirl = 0;

      if (u.visualSleep) { exp = 'sleep'; P.head += 16; P.torso += 5; P.hy += 4 * K; P.aU = [-40, 30]; P.aF = [-20, 10]; P.lookX = 0; }
      else if (u.visualStun) { exp = 'hurt'; P.lookX = Math.cos(T * 9); P.lookY = Math.sin(T * 9); P.head += Math.sin(T * 4.5) * 9; P.torso += Math.sin(T * 4.5) * 5; }

      // blink and glances
      this.nextBlink -= dt; this.nextLook -= dt;
      if (this.nextBlink <= 0 && this.blinkT < 0) { this.blinkT = 0; this.nextBlink = this.dbl ? .22 : rnd(2, 4.8); this.dbl = !this.dbl && Math.random() < .22; }
      if (this.blinkT >= 0) { this.blinkT += dt; const b = this.blinkT / .13; this.blink = b < 1 ? Math.sin(b * Math.PI) : 0; if (b >= 1) this.blinkT = -1; }
      if (this.nextLook <= 0 && !animOn) { this.nextLook = rnd(.7, 2.4); this.look = { x: rnd(-.55, 1), y: rnd(-.35, .4) }; }

      this.draw(P, exp, dt, { smear, smearA, smearB, vf, moving, front: front || anim === 'wind' || anim === 'attack' });
    }

    draw(P, exp, dt, X) {
      const R = this.R, sp = this.sp, T = this.T;
      const headR = sp.headR.step(P.head, dt), headY = sp.headY.step(P.hy, dt), headX = sp.headX.step(P.hx, dt);
      const torso = sp.torso.step(P.torso, dt);
      const aU = [0, 1].map(i => sp.aU[i].step(P.aU[i], dt)), aF = [0, 1].map(i => sp.aF[i].step(P.aF[i], dt));
      const hit = sp.hit.step(0, dt);
      const rx = sp.rx.step(P.x, dt), ry = sp.ry.step(P.y - P.air, dt);
      const sx = sp.sx.step(P.sx, dt), sy = sp.sy.step(P.sy, dt);
      const lx = sp.lookX.step(P.lookX, dt), ly = sp.lookY.step(P.lookY, dt);
      const earBase = -(X.vf * 14) - Math.abs(hit) * 20;
      const earL = sp.earL.step(earBase + Math.sin(T * 1.3) * 2 - torso * .5 - headR * .5, dt);
      const earR = sp.earR.step(earBase + Math.sin(T * 1.3 + 1) * 2 - torso * .5 - headR * .5, dt);
      const hem = sp.hem.step(-X.vf * 3 - (ry - this._ry) * .12 - torso * .2, dt);
      this._ry = ry;

      // ---- legs + ground contact (forward kinematics) ----------------------------
      let maxSole = 0;
      const legs = [0, 1].map(i => {
        const L = P.leg[i], push = (i ? 1 : -1) * P.crouch * 28;
        const a1 = L.a + push, a2 = L.b - push;
        const rt1 = REST.leg[i][0] - a1, rt2 = (REST.leg[i][1] - a2) - rt1;
        const fr = clamp(-(rt1 + rt2) * .7, -40, 40);        // paws stay mostly flat on the floor
        const K1 = rotPt(KNEE[i], HIP[i], rt1), A2 = rotPt(rotPt(ANK[i], HIP[i], rt1), K1, rt2);
        SOLE[i].forEach(p0 => {
          const q = rotPt(rotPt(rotPt(p0, HIP[i], rt1), K1, rt2), A2, fr);
          if (q[1] > maxSole) maxSole = q[1];
        });
        return { rt1, rt2, fr };
      });
      tf(R.root, `translate(${f1(rx)} ${f1(ry + GROUND - maxSole)})translate(${WAIST[0]} ${GROUND})scale(${sx.toFixed(3)} ${sy.toFixed(3)})translate(${-WAIST[0]} ${-GROUND})`);
      legs.forEach((o, i) => {
        tf(R.leg[i].th, rotAt(o.rt1, HIP[i]));
        tf(R.leg[i].sh, rotAt(o.rt2, KNEE[i]));
        tf(R.leg[i].ft, rotAt(o.fr, ANK[i]));
      });

      // ---- torso, dress, arms, head -----------------------------------------------
      tf(R.torso, rotAt(torso, WAIST));
      tf(R.dress, `translate(300 350)skewX(${(hem * .6).toFixed(2)})translate(-300 -350)`);
      [0, 1].forEach(i => {
        const rt1 = REST.arm[i][0] - aU[i], rt2 = (REST.arm[i][1] - aF[i]) - rt1;
        tf(R.arm[i].u, rotAt(rt1, SHO[i]));
        tf(R.arm[i].f, rotAt(rt2, ELB[i]));
      });
      if (X.front !== this.armFront) {   // the striking arm comes in front of the head
        this.armFront = X.front;
        if (X.front) R.torso.appendChild(R.arm[1].u); else R.torso.insertBefore(R.arm[1].u, R.dress);
      }
      tf(R.headG, `translate(${f1(headX)} ${f1(headY)})${rotAt(headR, NECK)}`);
      tf(R.earL, rotAt(earL, [308, 125]));
      tf(R.earR, rotAt(earR, [414, 128]));

      // ---- tail chain (each joint lags the one before) ---------------------------------
      const swirl = this.tailSwirl || 0;
      this.tail.forEach((s, i) => {
        const wag = Math.sin(T * (X.moving ? 9 : 2.4) - i * .8) * (X.moving ? 10 : 6) * (i + 1) * .5;
        const r = s.step((P.tail + wag) * (1 - swirl * .4) + swirl * 22 * (i + 1), dt);
        tf(R.tail[i], rotAt(r, TAIL[i]));
      });

      // ---- face ---------------------------------------------------------------------
      const tgt = EXPR[exp] || EXPR.happy, E = this.E, ek = clamp(dt * 16, 0, 1);
      EKEYS.forEach(k => { E[k] = lerp(E[k], tgt[k], ek); });
      R.eye.forEach(o => {
        const e = o.e, [cx, cy] = e.c, cover = clamp(Math.max(E.lid, this.blink * 1.02), 0, 1.05);
        tf(o.sc, `translate(${cx} ${cy})scale(${E.eye.toFixed(3)})translate(${-cx} ${-cy})`);
        tf(o.pupil, `translate(${f1(lx * e.tx)} ${f1(ly * e.ty)})translate(${e.p[0]} ${e.p[1]})scale(${E.pup.toFixed(3)})translate(${-e.p[0]} ${-e.p[1]})`);
        const edge = -(e.oy + 14) + cover * (2 * e.oy + 14);
        const lt = (e.s < 0 ? 1 : -1) * E.tilt;
        tf(o.lid, `rotate(${lt.toFixed(2)})translate(0 ${edge.toFixed(2)})`);
        tf(o.st, `translate(0 ${(-edge).toFixed(2)})rotate(${(-lt).toFixed(2)})`);
        tf(o.low, `translate(0 ${(e.oy * 2.05 - E.low * 2 * e.oy).toFixed(2)})`);
        o.brow.setAttribute('opacity', clamp(E.bo, 0, 1).toFixed(2));
        tf(o.brow, `translate(${cx - e.s * 4} ${(cy - e.oy - 20 + E.by).toFixed(1)})rotate(${((e.s < 0 ? -1 : 1) * E.bt).toFixed(1)})`);
      });
      const [mx, my] = MOUTH, mw = E.mw, mc = E.mc, mo = Math.max(0, E.mo + (exp === 'joy' ? Math.sin(T * 14) * 2 : 0));
      const yl = my - E.mt * .5, yr = my + E.mt * .5, xl = mx - mw, xr = mx + mw;
      const topC = my + 2 * mc, botC = topC + 2 * mo;
      const d = `M${f1(xl)} ${f1(yl)}Q${mx} ${f1(topC)} ${f1(xr)} ${f1(yr)}Q${mx} ${f1(botC)} ${f1(xl)} ${f1(yl)}Z`;
      const rest = clamp(1 - (Math.abs(mw - 27) + Math.abs(mc - 10) + mo + Math.abs(E.mt)) / 4, 0, 1);
      R.mouthP.setAttribute('opacity', rest.toFixed(2)); R.mouth.setAttribute('opacity', (1 - rest).toFixed(2));
      R.mouth.setAttribute('d', mo < 2.2 ? `M${f1(xl)} ${f1(yl)}Q${mx} ${f1(topC)} ${f1(xr)} ${f1(yr)}` : d);
      R.mouth.setAttribute('fill', mo < 2.2 ? 'none' : '#6e0b28');
      R.mouthClip.setAttribute('d', d);
      R.tongue.setAttribute('cx', mx); R.tongue.setAttribute('cy', f1(my + mc + mo * 1.05));
      R.tongue.setAttribute('rx', f1(mw * .55)); R.tongue.setAttribute('ry', f1(Math.max(.1, mo * .45)));
      R.tongue.setAttribute('opacity', mo > 10 ? 1 : 0);

      // ---- strike smear along the paw's arc ---------------------------------------------
      if (X.smear > .02) {
        const cx = SHO[1][0], cy = SHO[1][1], n = 14, outer = [], inner = [];
        for (let i = 0; i <= n; i++) {
          const k = i / n, a = rad(lerp(X.smearA, X.smearB, k)), th = Math.pow(k, 1.3) * 40, r = 185;
          outer.push(`${f1(cx + Math.sin(a) * (r + th * .4))} ${f1(cy + Math.cos(a) * (r + th * .4))}`);
          inner.unshift(`${f1(cx + Math.sin(a) * (r - th * .6))} ${f1(cy + Math.cos(a) * (r - th * .6))}`);
        }
        R.smear.setAttribute('d', 'M' + outer.concat(inner).join('L') + 'Z');
        R.smear.setAttribute('opacity', X.smear.toFixed(2));
      } else R.smear.setAttribute('opacity', 0);
    }
  }

  return {
    enabled() {
      try { return !!(Save && Save.data && Save.data.opt && Save.data.opt.animatedChars === true); }
      catch (e) { return true; }
    },
    create(host) { return new Rig(host); }
  };
})();
