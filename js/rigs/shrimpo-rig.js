/* Shrimpo's battle cutout: the painted shrimp stays intact while his fists,
   feet, tail fins and face react to a very short temper. */
'use strict';
const ShrimpoRig = (() => {
  const NS = 'http://www.w3.org/2000/svg';
  const node = (tag, attrs, parent) => {
    const el = document.createElementNS(NS, tag);
    for (const [key, value] of Object.entries(attrs || {})) el.setAttribute(key, value);
    if (parent) parent.appendChild(el);
    return el;
  };
  const clamp = (n, a = 0, b = 1) => Math.min(b, Math.max(a, n));
  const ease = n => { n = clamp(n); return n * n * (3 - 2 * n); };
  const hold = n => ease(n / .22) * (1 - ease((n - .75) / .25));
  let nextId = 0;

  class Spring {
    constructor() { this.x = 0; this.v = 0; }
    step(target, dt, stiffness = 170, damping = 19) {
      const count = Math.max(1, Math.ceil(dt / .008)), h = dt / count;
      for (let i = 0; i < count; i++) {
        this.v += (target - this.x) * stiffness * h;
        this.v *= Math.exp(-damping * h);
        this.x += this.v * h;
      }
      return this.x;
    }
  }

  class Rig {
    constructor(host) {
      this.time = Math.random() * 3;
      this.phase = 0;
      this.lastHit = 0;
      this.hurt = 0;
      this.mood = '';
      this.s = Object.fromEntries(['bob', 'lean', 'head', 'tailL', 'tailR', 'armNear', 'armFar', 'legNear', 'legFar', 'recoil'].map(k => [k, new Spring()]));
      const id = `shrimpo-rig-${++nextId}`;
      const svg = node('svg', { viewBox: '0 0 466 614', class: 'rig-svg', 'aria-hidden': 'true' }, host);
      const defs = node('defs', {}, svg);
      const src = (typeof ASSET === 'string' ? ASSET : './') + 'assets/toon-art/Shrimpo/Shrimpo.png';
      const faceMaskId = `${id}-face-mask`;
      const faceMask = node('mask', { id: faceMaskId, x: 0, y: 0, width: 466, height: 614,
        maskUnits: 'userSpaceOnUse', style: 'mask-type:alpha' }, defs);
      node('image', { href: src, width: 466, height: 614 }, faceMask);
      const piece = (name, path, parent) => {
        const clipId = `${id}-${name}`;
        node('path', { d: path }, node('clipPath', { id: clipId, clipPathUnits: 'userSpaceOnUse' }, defs));
        const group = node('g', {}, parent);
        node('image', { href: src, width: 466, height: 614, 'clip-path': `url(#${clipId})` }, group);
        return group;
      };
      const mouthShade = node('radialGradient', { id: `${id}-mouth-shade` }, defs);
      node('stop', { offset: 0, 'stop-color': '#b8b8ba' }, mouthShade);
      node('stop', { offset: .65, 'stop-color': '#bababc' }, mouthShade);
      node('stop', { offset: 1, 'stop-color': '#bababc', 'stop-opacity': 0 }, mouthShade);
      const eyeShade = node('radialGradient', { id: `${id}-eye-shade` }, defs);
      node('stop', { offset: 0, 'stop-color': '#d5d5d6' }, eyeShade);
      node('stop', { offset: .67, 'stop-color': '#d5d5d6' }, eyeShade);
      node('stop', { offset: 1, 'stop-color': '#d5d5d6', 'stop-opacity': 0 }, eyeShade);
      this.mouthShade = `url(#${id}-mouth-shade)`;
      this.eyeShade = `url(#${id}-eye-shade)`;

      this.root = node('g', {}, svg);
      this.legFar = piece('leg-far', 'M233 463 H315 V594 H231 Z', this.root);
      this.legNear = piece('leg-near', 'M163 468 H254 V593 H163 Z', this.root);
      this.upper = node('g', {}, this.root);
      this.armFar = piece('arm-far', 'M274 365 H343 V517 H274 Z', this.upper);
      this.torso = piece('shirt', 'M188 373 H314 V493 H188 Z', this.upper);
      this.armNear = piece('arm-near', 'M198 369 L211 380 L194 406 L176 426 L174 468 L220 480 L228 520 L206 534 L169 528 L158 471 L159 416 Z', this.upper);
      this.headRig = node('g', {}, this.upper);
      this.tailR = piece('tail-far', 'M119 40 H170 V178 H119 Z', this.headRig);
      this.tailL = piece('tail-near', 'M38 31 H143 V178 H38 Z', this.headRig);
      this.head = piece('head', 'M102 119 Q158 126 206 164 Q316 157 361 213 Q382 256 370 335 Q356 388 310 395 Q218 404 151 355 Q97 310 101 224 Z', this.headRig);
      this.face = node('g', { mask: `url(#${faceMaskId})` }, this.headRig);
      // The jab crosses in front of his huge head, like his authored punch pose.
      this.punchArm = piece('punch-arm', 'M198 369 L211 380 L194 406 L176 426 L174 468 L220 480 L228 520 L206 534 L169 528 L158 471 L159 416 Z', this.upper);
      this.punchArm.setAttribute('opacity', '0');
      this.drawFace('idle');
    }

    drawFace(mood) {
      if (mood === this.mood) return;
      this.mood = mood;
      this.face.replaceChildren();
      if (mood === 'idle') return;
      const g = this.face;
      const line = (d, width = 5, parent = g) => node('path', { d, fill: 'none', stroke: '#111214', 'stroke-width': width,
        'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, parent);
      if (mood === 'closed' || mood === 'sleep') {
        node('ellipse', { cx: 286, cy: 286, rx: 68, ry: 82, fill: this.eyeShade }, g);
        line('M236 281 Q282 341 326 280', 5.5);
        line('M274 224 L314 249', 5);
      }
      const mouth = node('g', { transform: 'translate(-11 0)' }, g);
      node('ellipse', { cx: 340, cy: 347, rx: 38, ry: 35, fill: this.mouthShade }, mouth);
      if (mood === 'teeth') {
        node('path', { d: 'M312 340 Q337 323 365 340 Q354 359 320 356 Z', fill: '#e8e7e6',
          stroke: '#121315', 'stroke-width': 4, 'stroke-linejoin': 'round' }, mouth);
        line('M331 333 L333 354 M347 334 L348 353', 2.5, mouth);
      } else if (mood === 'roar') {
        node('path', { d: 'M326 333 Q346 323 359 339 Q365 361 347 368 Q327 370 321 354 Z',
          fill: '#743b40', stroke: '#111214', 'stroke-width': 4.5 }, mouth);
        node('path', { d: 'M328 357 Q342 351 357 359 Q350 370 335 367 Z', fill: '#e88f89' }, mouth);
      } else if (mood === 'shout') {
        line('M313 356 L326 335 Q333 345 342 343 Q351 340 359 329 L365 354', 5, mouth);
      } else if (mood === 'closed' || mood === 'sleep') {
        line('M311 349 Q339 320 363 346 M312 348 Q307 353 314 357 M363 346 Q368 350 361 356', 4.5, mouth);
      } else {
        line('M315 350 L340 329 L361 352', 5, mouth);
      }
    }

    update(u, elapsed) {
      const dt = clamp(elapsed || 0, 0, .05);
      if (!dt) return;
      this.time += dt;
      const speed = Math.hypot(u.vx || 0, u.vy || 0);
      const moving = u.moving ? 1 : 0;
      this.phase += dt * (8.5 + Math.min(speed, 150) * .055);
      const stride = Math.sin(this.phase), idle = Math.sin(this.time * 4.1);
      const action = u.animT > 0 ? u.animState : '';
      const progress = action ? 1 - clamp(u.animT / Math.max(.01, u.animDur || 1)) : 0;
      const wind = action === 'wind' ? hold(progress) : 0;
      const attack = action === 'attack' ? hold(progress) : 0;
      const cast = action === 'cast' || action === 'spin' ? hold(progress) : u.casting ? .7 : 0;
      if ((u.hitT || 0) > this.lastHit + .02) { this.s.recoil.v = -150; this.hurt = .35; }
      this.lastHit = u.hitT || 0;
      this.hurt = Math.max(0, this.hurt - dt);
      const s = this.s, recoil = s.recoil.step(0, dt);
      const tantrum = cast * Math.sin(this.time * 24);
      const bob = s.bob.step(idle * .7 - Math.abs(stride) * moving * 5 - wind * 7 - attack * 3 - Math.abs(tantrum) * 5 + recoil, dt);
      const lean = s.lean.step(idle * 1.3 + moving * 8 - wind * 11 + attack * 15 + tantrum * 9 + recoil * .26, dt);
      const head = s.head.step(-idle * 1.8 - moving * 5 + wind * 7 - attack * 8 + tantrum * 10 + recoil * .32 + (u.visualSleep ? 12 : 0), dt);
      const tailL = s.tailL.step(-idle * 2.5 - moving * 8 - attack * 20 + tantrum * 18, dt, 90, 10);
      const tailR = s.tailR.step(idle * 2 - moving * 5 + attack * 12 - tantrum * 13, dt, 95, 11);
      const armNear = s.armNear.step(idle * 2 + stride * moving * 24 + wind * 24 - attack * 105 + tantrum * 66, dt, 235, 18);
      const armFar = s.armFar.step(-idle * 2 - stride * moving * 20 + wind * 35 + attack * 12 - tantrum * 72, dt, 225, 18);
      const legNear = s.legNear.step(stride * moving * 25 - wind * 9 + attack * 14 + tantrum * 9, dt);
      const legFar = s.legFar.step(-stride * moving * 25 + wind * 9 - attack * 12 - tantrum * 9, dt);
      const rotate = (part, deg, x, y) => part.setAttribute('transform', `rotate(${deg.toFixed(2)} ${x} ${y})`);
      this.root.setAttribute('transform', `translate(0 ${bob.toFixed(2)})`);
      rotate(this.legFar, legFar, 273, 482); rotate(this.legNear, legNear, 216, 483);
      rotate(this.upper, lean, 245, 466);
      rotate(this.armFar, armFar, 294, 390); rotate(this.armNear, armNear, 207, 390);
      const punch = clamp(attack * 1.4);
      this.armNear.setAttribute('opacity', (1 - punch).toFixed(2));
      this.punchArm.setAttribute('opacity', punch.toFixed(2));
      this.punchArm.setAttribute('transform', `translate(207 390) rotate(${armNear.toFixed(2)}) scale(${(1 + punch * .5).toFixed(2)}) translate(-207 -390)`);
      rotate(this.headRig, head, 241, 379);
      rotate(this.tailL, tailL, 132, 158); rotate(this.tailR, tailR, 137, 158);
      const idleBeat = this.time % 6.3;
      const mood = u.visualSleep ? 'sleep' : this.hurt > 0 ? 'teeth' : cast > .18 ? 'roar' :
        attack > .2 ? 'shout' : wind > .18 ? 'teeth' : idleBeat > 4.8 && idleBeat < 5.25 && !moving ? 'closed' : 'idle';
      this.drawFace(mood);
    }
  }
  const enabled = () => { try { return !!Save.data.opt.animatedChars; } catch (_) { return true; } };
  return { enabled, create: host => new Rig(host) };
})();
