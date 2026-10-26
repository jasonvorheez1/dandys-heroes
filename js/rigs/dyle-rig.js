/* Dyle's battle cutout uses pieces of his original painted sprite. */
'use strict';
const DyleRig = (() => {
  const NS = 'http://www.w3.org/2000/svg';
  const node = (tag, attrs, parent) => {
    const el = document.createElementNS(NS, tag);
    for (const [key, value] of Object.entries(attrs || {})) el.setAttribute(key, value);
    if (parent) parent.appendChild(el);
    return el;
  };
  const clamp = (n, a = 0, b = 1) => Math.min(b, Math.max(a, n));
  const pulse = n => Math.sin(Math.PI * clamp(n));
  const ease = n => { n = clamp(n); return n * n * (3 - 2 * n); };
  const gesture = n => ease(n / .2) * (1 - ease((n - .76) / .24));
  let nextId = 0;

  class Spring {
    constructor() { this.x = 0; this.v = 0; }
    step(target, dt, stiffness = 150, damping = 19) {
      const count = Math.max(1, Math.ceil(dt / .008));
      const h = dt / count;
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
      this.stepPhase = 0;
      this.lastHit = 0;
      this.s = Object.fromEntries(['bob', 'lean', 'head', 'left', 'right', 'point', 'legL', 'legR', 'loopL', 'loopR', 'recoil'].map(k => [k, new Spring()]));
      const id = `dyle-rig-${++nextId}`;
      const svg = node('svg', { viewBox: '0 0 341 430', class: 'rig-svg', 'aria-hidden': 'true' }, host);
      const defs = node('defs', {}, svg);
      const src = (typeof ASSET === 'string' ? ASSET : './') + 'Characters/Dyle/Dyle.png';
      const piece = (name, path, parent) => {
        const clipId = `${id}-${name}`;
        node('path', { d: path }, node('clipPath', { id: clipId, clipPathUnits: 'userSpaceOnUse' }, defs));
        const group = node('g', {}, parent);
        node('image', { href: src, width: 341, height: 430, 'clip-path': `url(#${clipId})` }, group);
        return group;
      };
      this.root = node('g', {}, svg);
      // The long loose side follows the clock; the held side follows the coat and glove.
      this.loopL = piece('loop-left', 'M0 0 H190 V43 H138 Q85 47 73 137 Q61 239 120 301 L144 352 L135 374 Q70 353 47 278 Q20 188 43 91 Z', this.root);
      this.legL = piece('leg-left', 'M136 323 H171 V426 H126 Z', this.root);
      this.legR = piece('leg-right', 'M170 326 H211 V426 H164 Z', this.root);
      this.upper = node('g', {}, this.root);
      this.loopR = piece('loop-right', 'M211 184 Q253 191 266 263 L267 380 H217 L224 306 Q235 241 202 216 Z', this.upper);
      this.coat = piece('coat', 'M122 209 H206 L218 352 H121 Z', this.upper);
      this.armL = piece('arm-left', 'M112 221 L148 215 L158 263 L136 295 L102 280 L102 246 Z', this.upper);
      // The free glove opens into a brief conductor's point. It rides with the arm.
      this.finger = node('path', {
        d: 'M117 264 Q109 267 102 273 L91 279 Q88 281 91 284 Q94 287 99 285 L113 279 Q119 278 122 272 Z',
        fill: '#151b20', stroke: '#0a0d10', 'stroke-width': 1.5, 'stroke-linejoin': 'round', opacity: 0
      }, this.armL);
      this.head = piece('clock-head', 'M147 32 Q199 28 222 79 Q241 134 226 181 Q215 218 164 228 Q111 231 89 190 Q72 148 87 92 Q103 42 147 32 Z', this.upper);
      this.armR = piece('arm-right', 'M200 189 Q231 193 245 223 L233 264 L206 282 L180 244 Z', this.upper);
    }

    update(u, elapsed) {
      const dt = clamp(elapsed || 0, 0, .05);
      if (!dt) return;
      this.time += dt;
      const speed = Math.hypot(u.vx || 0, u.vy || 0);
      const moving = u.moving ? 1 : 0;
      this.stepPhase += dt * (7.3 + Math.min(speed, 150) * .035);
      const stride = Math.sin(this.stepPhase);
      const idle = Math.sin(this.time * 1.7);
      const action = u.animT > 0 ? u.animState : '';
      const progress = action ? 1 - clamp(u.animT / Math.max(.01, u.animDur || 1)) : 0;
      const wind = action === 'wind' ? pulse(progress) : 0;
      const strike = action === 'attack' ? pulse(progress) : 0;
      const cast = action === 'cast' || u.casting ? (action ? pulse(progress) : .6) : 0;
      const idleBeat = this.time % 7.4;
      const idlePoint = !action && !moving && !u.casting && !u.visualSleep
        ? ease((idleBeat - 2.1) / .3) * (1 - ease((idleBeat - 2.85) / .4)) * .55 : 0;
      const pointTarget = u.visualSleep ? 0 : Math.max(idlePoint,
        action === 'attack' ? gesture(progress) : action === 'cast' ? gesture(progress) :
        action === 'wind' ? gesture(progress) * .45 : u.casting ? .7 : 0);
      if ((u.hitT || 0) > this.lastHit + .02) this.s.recoil.v = -100;
      this.lastHit = u.hitT || 0;
      const s = this.s;
      const recoil = s.recoil.step(0, dt);
      const point = s.point.step(pointTarget, dt, 190, 21);
      const bob = s.bob.step(idle * .8 - Math.abs(stride) * moving * 3 - strike * 2 - cast * 3 + recoil, dt);
      const lean = s.lean.step(idle * .7 + moving * 4 + stride * moving * 1.4 - wind * 5 + strike * 7 - cast * 4 + point * 2 + recoil * .3, dt);
      const head = s.head.step(-idle * 1.1 - moving * 2 - wind * 4 + strike * 3 - cast * 3 - point * 4 + (u.visualSleep ? 12 : 0) + recoil * .25, dt);
      const left = s.left.step(stride * moving * 13 - point * 128, dt, 220, 22);
      // His right glove stays around the chain grip, even while he attacks.
      const right = s.right.step(idle * .8 - stride * moving * 2 + wind * 2 - strike * 3 - cast * 4, dt, 125, 18);
      const legL = s.legL.step(stride * moving * 19 + strike * 7, dt);
      const legR = s.legR.step(-stride * moving * 19 - strike * 8, dt);
      const loopL = s.loopL.step(-idle * 1.2 - moving * 3 - strike * 9 + cast * 5, dt, 75, 12);
      const loopR = s.loopR.step(right + idle * .65 + moving * .8, dt, 75, 12);
      const rotate = (part, degrees, x, y) => part.setAttribute('transform', `rotate(${degrees.toFixed(2)} ${x} ${y})`);
      this.root.setAttribute('transform', `translate(0 ${bob.toFixed(2)})`);
      this.loopL.setAttribute('transform', `rotate(${lean.toFixed(2)} 165 326) rotate(${loopL.toFixed(2)} 162 34)`);
      rotate(this.legL, legL, 154, 337);
      rotate(this.legR, legR, 181, 338);
      rotate(this.upper, lean, 165, 326);
      rotate(this.loopR, loopR, 211, 218);
      rotate(this.armL, left, 145, 231);
      this.finger.setAttribute('opacity', clamp((point - .15) * 2.5).toFixed(2));
      rotate(this.head, head, 164, 218);
      rotate(this.armR, right, 211, 218);
    }
  }
  const enabled = () => { try { return !!Save.data.opt.animatedChars; } catch (_) { return true; } };
  return { enabled, create: host => new Rig(host) };
})();
