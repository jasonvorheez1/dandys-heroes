/* Connie's battle cutout: original render for every visible part. */
'use strict';
const ConnieRig = (() => {
  const NS = 'http://www.w3.org/2000/svg';
  const node = (tag, attrs = {}, parent) => {
    const el = document.createElementNS(NS, tag);
    for (const [key, value] of Object.entries(attrs)) el.setAttribute(key, value);
    if (parent) parent.appendChild(el);
    return el;
  };
  const clamp = (n, a = 0, b = 1) => Math.min(b, Math.max(a, n));
  const pulse = n => Math.sin(Math.PI * clamp(n));
  const rot = (el, a, x, y) => el.setAttribute('transform', `rotate(${a.toFixed(2)} ${x} ${y})`);
  let serial = 0;
  class Spring {
    constructor(x = 0) { this.x = x; this.v = 0; }
    step(target, dt, k = 140, damping = 18) {
      const steps = Math.max(1, Math.ceil(dt / .008)), h = dt / steps;
      for (let i = 0; i < steps; i++) {
        this.v += (target - this.x) * k * h;
        this.v *= Math.exp(-damping * h);
        this.x += this.v * h;
      }
      return this.x;
    }
  }
  class Rig {
    constructor(host) {
      this.time = Math.random() * 5;
      this.hurt = 0;
      this.lastHit = 0;
      this.blinkT = 2 + Math.random() * 2.5;
      this.mood = '';
      this.s = Object.fromEntries(['float', 'sway', 'head', 'hair', 'tail', 'armNear', 'foreNear', 'armFar',
        'recoil', 'sx', 'sy'].map(k => [k, new Spring(k === 'sx' || k === 'sy' ? 1 : 0)]));
      const id = `connie-rig-${++serial}`;
      const svg = node('svg', { viewBox: '0 0 267 328', class: 'rig-svg', 'aria-hidden': 'true' }, host);
      const defs = node('defs', {}, svg);
      const src = (typeof ASSET === 'string' ? ASSET : './') + 'assets/toon-art/Connie/Connie.png';
      const cut = (name, d, parent) => {
        const cid = `${id}-${name}`;
        node('path', { d }, node('clipPath', { id: cid, clipPathUnits: 'userSpaceOnUse' }, defs));
        const g = node('g', {}, parent);
        node('image', { href: src, width: 267, height: 328, 'clip-path': `url(#${cid})` }, g);
        return g;
      };
      const grad = node('linearGradient', { id: `${id}-ghost`, x1: '5%', y1: '0%', x2: '90%', y2: '100%' }, defs);
      [[0, '#b1e4e1'], [.55, '#86cac9'], [1, '#5bafb0']].forEach(([offset, color]) => node('stop', { offset, 'stop-color': color }, grad));
      const ghost = `url(#${id}-ghost)`;
      this.root = node('g', {}, svg);
      this.floatBody = node('g', {}, this.root);
      this.hair = cut('back-hair', 'M54 37 Q108 16 172 44 L171 172 Q154 212 121 257 Q89 286 55 288 Q26 271 13 272 L12 245 Q40 228 66 245 L66 148 Z', this.floatBody);
      this.tail = node('g', {}, this.floatBody);
      cut('lower-tail', 'M46 239 Q107 230 144 235 Q173 257 170 303 Q158 327 121 328 Q79 316 43 302 Z', this.tail);
      this.torso = node('g', {}, this.floatBody);
      this.armFar = node('g', {}, this.torso);
      cut('far-arm', 'M154 187 Q168 187 172 211 L175 251 L164 269 L151 242 Z', this.armFar);
      this.armNear = node('g', {}, this.torso);
      node('path', { d: 'M118 184 Q137 179 142 197 L132 220 L151 239 L139 257 Q110 241 101 220 Z', fill: ghost }, this.armNear);
      cut('near-upper-arm', 'M115 179 Q141 176 149 193 L140 220 L118 233 L95 220 Z', this.armNear);
      this.foreNear = node('g', {}, this.armNear);
      node('path', { d: 'M124 213 Q143 207 152 226 L155 245 Q149 257 138 258 L121 236 Z', fill: ghost }, this.foreNear);
      cut('near-forearm', 'M113 209 Q141 205 155 224 L159 256 L138 263 L117 245 Z', this.foreNear);
      cut('dress', 'M129 178 Q154 175 165 188 L168 234 L161 258 Q143 263 125 250 L115 217 Z', this.torso);
      this.head = node('g', {}, this.torso);
      cut('head', 'M83 31 Q143 25 191 44 Q221 71 217 132 Q208 171 174 184 Q127 191 97 171 Q72 146 77 96 Z', this.head);
      this.hat = cut('hat', 'M56 10 Q129 -2 216 8 L216 37 Q187 48 147 50 Q96 56 57 72 Z', this.head);
      this.face = node('g', {}, this.head);
      this.drawFace('original');
    }

    drawFace(mood) {
      if (mood === this.mood) return;
      this.mood = mood;
      const g = this.face;
      g.replaceChildren();
      if (mood === 'original') return;
      const pale = '#f0efee', black = '#100e12';
      const line = (d, w = 2.3, col = black) => node('path', { d, fill: 'none', stroke: col, 'stroke-width': w, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, g);
      // The changes fit inside the two existing eye shapes. Hair, lashes,
      // nose and the original tiny teeth stay in place.
      if (mood === 'blink' || mood === 'sleep') {
        node('path', { d: 'M151 97 Q175 91 195 98 L196 137 Q178 148 157 138 Z M198 93 L217 91 L216 137 L201 138 Z', fill: '#9ed7d4' }, g);
        line('M156 118 Q175 129 193 117 M202 117 Q209 124 216 115', 2.8);
      } else if (mood === 'smile') {
        line('M157 115 Q176 136 191 114', 3, pale);
        line('M200 112 Q208 124 216 111', 2.2, pale);
      } else if (mood === 'surprise') {
        node('ellipse', { cx: 177, cy: 119, rx: 11, ry: 15, fill: pale }, g);
        node('ellipse', { cx: 208, cy: 117, rx: 4, ry: 12, fill: pale }, g);
      } else if (mood === 'focus') {
        line('M154 105 Q174 99 194 103', 3);
      }
    }

    update(u, elapsed) {
      const dt = clamp(elapsed || 0, 0, .05);
      if (!dt) return;
      this.time += dt;
      const s = this.s, idle = Math.sin(this.time * 2.2);
      const action = u.animT > 0 ? u.animState : '';
      const progress = action ? 1 - clamp(u.animT / Math.max(.01, u.animDur || 1)) : 0;
      const wind = action === 'wind' ? pulse(progress) : 0;
      const attack = action === 'attack' ? pulse(progress) : 0;
      const cast = action === 'cast' || action === 'spin' ? pulse(progress) : u.casting ? .6 : 0;
      const moving = u.moving ? 1 : 0, sleep = u.visualSleep ? 1 : 0;
      if ((u.hitT || 0) > this.lastHit + .02) { s.recoil.v = -80; this.hurt = .26; }
      this.lastHit = u.hitT || 0;
      this.hurt = Math.max(0, this.hurt - dt);
      const recoil = s.recoil.step(0, dt);
      const float = s.float.step(idle * 2.2 - moving * 1.5 - wind * 3 - cast * 2 + recoil * .35, dt);
      const sway = s.sway.step(idle * 1.4 + moving * 3 - wind * 3 + attack * 5 + recoil * .1, dt);
      const head = s.head.step(-idle * 1.1 - moving * 2 + wind * 3 - attack * 4 + cast * 2 + sleep * 8, dt);
      const hair = s.hair.step(-sway * .45 - moving * 3 + idle * 1.5, dt, 65, 9);
      const tail = s.tail.step(-sway * .2 - moving * 1.5 + idle * .7 - attack * 1.5, dt, 70, 10);
      const armNear = s.armNear.step(idle * 1.5 + moving * 5 + wind * 5 - attack * 13 + cast * 12, dt);
      const foreNear = s.foreNear.step(-attack * 7 + cast * 8, dt);
      const armFar = s.armFar.step(-idle * .6 - moving * 2 + attack * 4 - cast * 4, dt);
      const sx = s.sx.step(1 + wind * .02 - attack * .015, dt);
      const sy = s.sy.step(1 - wind * .03 + attack * .025, dt);
      this.root.setAttribute('transform', `translate(135 318) scale(${sx.toFixed(3)} ${sy.toFixed(3)}) translate(-135 -318)`);
      this.floatBody.setAttribute('transform', `translate(0 ${float.toFixed(2)})`);
      rot(this.hair, hair, 111, 154);
      rot(this.tail, tail, 150, 292);
      rot(this.torso, sway, 143, 247);
      rot(this.armFar, armFar, 153, 190);
      rot(this.armNear, armNear, 125, 191);
      rot(this.foreNear, foreNear, 134, 221);
      rot(this.head, head, 149, 177);
      this.blinkT -= dt;
      const blinking = this.blinkT < 0 && this.blinkT > -.1;
      if (this.blinkT < -.1) this.blinkT = 2.3 + Math.random() * 3;
      const mood = sleep ? 'sleep' : this.hurt > 0 ? 'surprise' : cast > .17 ? 'smile' : attack > .15 ? 'focus' : blinking ? 'blink' : 'original';
      this.drawFace(mood);
    }
  }
  const enabled = () => { try { return !!Save.data.opt.animatedChars; } catch (_) { return true; } };
  return { enabled, create: host => new Rig(host) };
})();
