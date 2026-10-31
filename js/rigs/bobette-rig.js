/* Bobette's battle cutout keeps the original painted sprite and articulates
   its head, mittens, sweater, and feet. Her action faces follow the supplied
   sleepy, surprised, laughing, and gift-giving references. */
'use strict';
const BobetteRig = (() => {
  const NS = 'http://www.w3.org/2000/svg';
  const n = (tag, attrs, parent) => {
    const e = document.createElementNS(NS, tag);
    for (const [k, v] of Object.entries(attrs || {})) e.setAttribute(k, v);
    if (parent) parent.appendChild(e);
    return e;
  };
  const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
  const ease = x => { x = clamp(x); return x * x * (3 - 2 * x); };
  const pulse = x => Math.sin(Math.PI * clamp(x));
  let id = 0;
  class Spring {
    constructor() { this.x = 0; this.v = 0; }
    step(target, dt, k = 135, d = 18) {
      const count = Math.max(1, Math.ceil(dt / .008)), h = dt / count;
      for (let i = 0; i < count; i++) { this.v += (target - this.x) * k * h; this.v *= Math.exp(-d * h); this.x += this.v * h; }
      return this.x;
    }
  }
  class Rig {
    constructor(host) {
      this.time = Math.random() * 4;
      this.phase = 0;
      this.s = Object.fromEntries(['bob', 'body', 'head', 'left', 'right', 'legL', 'legR', 'recoil'].map(k => [k, new Spring()]));
      this.lastHit = 0;
      const key = `bobette-${++id}`;
      const svg = n('svg', { viewBox: '0 0 251 406', class: 'rig-svg', 'aria-hidden': 'true' }, host);
      const defs = n('defs', {}, svg);
      const url = (typeof ASSET === 'string' ? ASSET : './') + 'assets/toon-art/Bobette/Bobette.png';
      const piece = (name, path, parent) => {
        const clip = `${key}-${name}`;
        n('path', { d: path }, n('clipPath', { id: clip, clipPathUnits: 'userSpaceOnUse' }, defs));
        const group = n('g', {}, parent);
        n('image', { href: url, width: 251, height: 406, 'clip-path': `url(#${clip})` }, group);
        return group;
      };
      const grad = n('linearGradient', { id: `${key}-face`, x1: '0%', y1: '0%', x2: '100%', y2: '0%' }, defs);
      n('stop', { offset: '0%', 'stop-color': '#aa1728' }, grad);
      n('stop', { offset: '65%', 'stop-color': '#b92031' }, grad);
      n('stop', { offset: '100%', 'stop-color': '#db394c' }, grad);
      this.root = n('g', {}, svg);
      this.legL = piece('leg-l', 'M70 292 H128 V405 H70 Z', this.root);
      this.legR = piece('leg-r', 'M124 292 H175 V405 H124 Z', this.root);
      this.upper = n('g', {}, this.root);
      // Original painted regions overlap at the joints, so motion never opens a gap.
      this.body = piece('body', 'M79 180 H175 V325 H79 Z', this.upper);
      this.left = piece('arm-l', 'M76 221 Q97 231 113 245 L111 272 L87 312 L39 312 L44 263 Z', this.upper);
      this.right = piece('arm-r', 'M161 225 Q180 233 201 253 L222 269 L212 298 Q189 299 159 270 Z', this.upper);
      this.head = piece('head', 'M32 11 H202 V199 H32 Z', this.upper);
      this.face = n('g', { opacity: 0 }, this.head);
      n('path', { d: 'M91 72 Q140 59 190 75 L199 124 Q186 155 145 158 Q111 153 91 132 Z', fill: `url(#${key}-face)`, style: 'filter:blur(2px)' }, this.face);
      this.eyes = n('g', {}, this.face);
      this.mouth = n('g', {}, this.face);
      this.spark = n('g', { opacity: 0 }, this.upper);
      for (let i = 0; i < 4; i++) n('path', { d: 'M0 -7 L2 -2 L7 0 L2 2 L0 7 L-2 2 L-7 0 L-2 -2 Z', fill: i % 2 ? '#fff7ca' : '#ffe474', transform: `translate(${75 + i * 34} ${186 + (i % 2) * 19}) scale(${i % 2 ? .75 : 1})` }, this.spark);
    }
    expression(which) {
      const eyes = this.eyes, mouth = this.mouth;
      eyes.replaceChildren(); mouth.replaceChildren();
      const line = (parent, d, width = 4) => n('path', { d, fill: 'none', stroke: '#181011', 'stroke-width': width, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, parent);
      if (which === 'sleep') {
        line(eyes, 'M104 104 Q128 131 151 102 M160 105 Q178 124 190 101', 5);
        line(mouth, 'M149 139 Q157 151 165 137', 3.5);
      } else if (which === 'surprise') {
        [[126, 108, 20], [179, 108, 11]].forEach(([x, y, r]) => {
          n('ellipse', { cx: x, cy: y, rx: r, ry: r * 1.08, fill: '#fff', stroke: '#181011', 'stroke-width': 4 }, eyes);
          n('ellipse', { cx: x + 4, cy: y + 3, rx: r * .62, ry: r * .77, fill: '#151414' }, eyes);
        });
        n('ellipse', { cx: 161, cy: 143, rx: 7, ry: 10, fill: '#3e1920', stroke: '#181011', 'stroke-width': 3 }, mouth);
      } else if (which === 'laugh') {
        line(eyes, 'M106 111 Q127 82 149 110 M165 109 Q179 90 192 108', 4.5);
        n('path', { d: 'M148 135 Q162 146 175 133 Q171 157 160 157 Q150 155 148 135Z', fill: '#571e29', stroke: '#181011', 'stroke-width': 3 }, mouth);
        n('ellipse', { cx: 161, cy: 152, rx: 7, ry: 3, fill: '#f6a4a9' }, mouth);
      } else {
        [[126, 106, 22], [179, 107, 11]].forEach(([x, y, r]) => {
          n('path', { d: `M${x-r} ${y+3} Q${x-r} ${y-r} ${x} ${y-r} Q${x+r} ${y-r} ${x+r} ${y+3}Z`, fill: '#fff', stroke: '#181011', 'stroke-width': 3 }, eyes);
          n('ellipse', { cx: x + 2, cy: y + 2, rx: r * .72, ry: r * .8, fill: '#151414' }, eyes);
        });
        n('path', { d: 'M146 139 Q158 128 173 136 Q171 148 159 149 Q150 148 146 139Z', fill: '#fff', stroke: '#181011', 'stroke-width': 3 }, mouth);
        line(mouth, 'M158 136 V148 M168 136 V145', 1.8);
      }
    }
    update(u, elapsed) {
      const dt = clamp(elapsed || 0, 0, .05);
      if (!dt) return;
      this.time += dt;
      const s = this.s;
      const moving = u.moving ? 1 : 0;
      this.phase += dt * (7 + Math.min(130, Math.hypot(u.vx || 0, u.vy || 0)) * .04);
      const stride = Math.sin(this.phase);
      const action = u.animT > 0 ? u.animState : '';
      const p = action ? 1 - clamp(u.animT / Math.max(.01, u.animDur || 1)) : 0;
      const style = u.animStyle || '';
      const swat = action === 'attack' || style === 'bobetteRibbonSwat' ? pulse(p) : 0;
      const wrap = style === 'bobetteWrap' && action ? pulse(p) : 0;
      const unwrap = style === 'bobetteUnwrap' && action ? pulse(p) : 0;
      const toss = style === 'bobetteToss' && action ? pulse(p) : 0;
      const cheer = style === 'bobetteCheer' && action ? pulse(p) : 0;
      const boxed = u.hasStatus && u.hasStatus('bobette_box');
      if ((u.hitT || 0) > this.lastHit + .02) s.recoil.v = -130;
      this.lastHit = u.hitT || 0;
      const recoil = s.recoil.step(0, dt);
      const idle = Math.sin(this.time * 2.3);
      const bob = s.bob.step(idle * 1.5 - Math.abs(stride) * moving * 3 + wrap * 8 - unwrap * 14 - cheer * 8 + recoil, dt);
      const body = s.body.step(idle * 1.2 + stride * moving * 2.4 - swat * 6 - wrap * 8 + unwrap * 8 + toss * 6 + recoil * .25, dt);
      const head = s.head.step(-idle * 1.7 - stride * moving * 2 + wrap * 8 - unwrap * 9 - cheer * 7 + recoil * .35 + (u.visualSleep ? 10 : 0), dt);
      const left = s.left.step(stride * moving * 11 - swat * 17 + wrap * 24 - unwrap * 31 - cheer * 47 + toss * 14, dt);
      const right = s.right.step(-stride * moving * 12 - swat * 48 - wrap * 35 + unwrap * 44 + cheer * 52 - toss * 65, dt);
      const legL = s.legL.step(stride * moving * 17 + unwrap * 7, dt);
      const legR = s.legR.step(-stride * moving * 17 - unwrap * 7, dt);
      const tf = (g, angle, x, y) => g.setAttribute('transform', `rotate(${angle.toFixed(2)} ${x} ${y})`);
      this.root.setAttribute('transform', `translate(0 ${bob.toFixed(2)})`);
      tf(this.legL, legL, 107, 307); tf(this.legR, legR, 142, 308);
      tf(this.upper, body, 124, 295); tf(this.head, head, 121, 184);
      tf(this.left, left, 91, 230); tf(this.right, right, 166, 232);
      const mood = u.visualSleep || boxed ? 'sleep' : unwrap || cheer ? 'laugh' : toss || swat ? 'grin' : wrap ? 'surprise' : '';
      if (mood !== this.mood) { this.mood = mood; if (mood) this.expression(mood); }
      this.face.setAttribute('opacity', mood ? '1' : '0');
      this.spark.setAttribute('opacity', clamp(Math.max(unwrap, cheer, toss * .5)).toFixed(2));
      this.root.setAttribute('opacity', boxed ? '.13' : '1');
    }
  }
  const enabled = () => { try { return !!Save.data.opt.animatedChars; } catch (_) { return true; } };
  return { enabled, create: host => new Rig(host) };
})();
