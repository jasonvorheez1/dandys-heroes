/* Ginger's battle puppet: a gentle skipping gait, swaying frosting,
   changing expressions, and a little decorated heart cookie for her heals. */
'use strict';
const GingerRig = (() => {
  const NS = 'http://www.w3.org/2000/svg';
  const node = (tag, attrs, parent) => {
    const el = document.createElementNS(NS, tag);
    for (const [key, value] of Object.entries(attrs || {})) el.setAttribute(key, value);
    if (parent) parent.appendChild(el);
    return el;
  };
  const clamp = (n, a = 0, b = 1) => Math.min(b, Math.max(a, n));
  const ease = n => { n = clamp(n); return n * n * (3 - 2 * n); };
  const hold = n => ease(n / .19) * (1 - ease((n - .74) / .26));
  let nextId = 0;

  class Spring {
    constructor() { this.x = 0; this.v = 0; }
    step(target, dt, stiffness = 155, damping = 19) {
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
      this.time = Math.random() * 4;
      this.phase = 0;
      this.lastHit = 0;
      this.hurt = 0;
      this.mood = '';
      this.s = Object.fromEntries(['move', 'bob', 'sway', 'lean', 'head', 'icing', 'armNear', 'armFar', 'legNear', 'legFar', 'liftNear', 'liftFar', 'cookie', 'recoil'].map(k => [k, new Spring()]));
      const id = `ginger-rig-${++nextId}`;
      const svg = node('svg', { viewBox: '0 0 175 363', class: 'rig-svg', 'aria-hidden': 'true' }, host);
      const defs = node('defs', {}, svg);
      const src = (typeof ASSET === 'string' ? ASSET : './') + 'assets/toon-art/Ginger/Ginger.png';
      const piece = (name, path, parent) => {
        const clipId = `${id}-${name}`;
        node('path', { d: path }, node('clipPath', { id: clipId, clipPathUnits: 'userSpaceOnUse' }, defs));
        const group = node('g', {}, parent);
        node('image', { href: src, width: 175, height: 363, 'clip-path': `url(#${clipId})` }, group);
        return group;
      };
      const mouthShade = node('radialGradient', { id: `${id}-mouth-shade` }, defs);
      node('stop', { offset: 0, 'stop-color': '#aa673d' }, mouthShade);
      node('stop', { offset: .7, 'stop-color': '#aa673d' }, mouthShade);
      node('stop', { offset: 1, 'stop-color': '#aa673d', 'stop-opacity': 0 }, mouthShade);
      this.mouthShade = `url(#${id}-mouth-shade)`;

      this.root = node('g', {}, svg);
      this.legFar = piece('leg-far', 'M104 261 H143 V363 H103 Z', this.root);
      this.legNear = piece('leg-near', 'M74 262 H114 V363 H74 Z', this.root);
      this.upper = node('g', {}, this.root);
      // Fill the dress painted behind the crossed arms. The mask removes the
      // original stationary arms before the articulated copies are drawn.
      const dress = node('linearGradient', { id: `${id}-dress`, x1: '0%', y1: '0%', x2: '100%', y2: '0%' }, defs);
      node('stop', { offset: 0, 'stop-color': '#970d29' }, dress);
      node('stop', { offset: .55, 'stop-color': '#b40d32' }, dress);
      node('stop', { offset: 1, 'stop-color': '#890c29' }, dress);
      node('path', { d: 'M78 196 Q64 220 59 269 Q92 284 130 272 L135 214 Q116 195 78 196 Z', fill: `url(#${id}-dress)` }, this.upper);
      this.torso = piece('torso', 'M54 190 H150 V273 H54 Z M115 273 H145 V305 H115 Z', this.upper);
      const armMask = node('mask', { id: `${id}-arm-cutout`, maskUnits: 'userSpaceOnUse', x: 0, y: 0, width: 175, height: 363 }, defs);
      node('rect', { x: 0, y: 0, width: 175, height: 363, fill: 'white' }, armMask);
      node('path', { d: 'M78 193 Q92 188 101 201 L105 220 Q110 233 130 236 Q146 240 148 254 L142 268 Q133 273 121 267 L91 253 Q74 247 74 225 L72 210 Q72 199 78 193 Z M127 200 Q138 198 140 217 L141 238 Q147 255 143 276 L141 289 Q138 302 125 301 Q117 297 117 286 Q119 272 126 256 L123 228 Q120 208 127 200 Z', fill: 'black' }, armMask);
      this.torso.setAttribute('mask', `url(#${id}-arm-cutout)`);
      // The broad far-leg clip also includes the hand in the source PNG.
      this.legFar.setAttribute('mask', `url(#${id}-arm-cutout)`);
      this.armFar = piece('arm-far', 'M124 201 Q138 196 141 216 L143 237 Q149 252 145 272 L142 288 Q140 300 128 300 Q117 299 117 286 Q118 269 125 255 L123 229 Q119 209 124 201 Z', this.upper);
      this.armNear = piece('arm-near', 'M78 194 Q93 189 101 202 L106 222 Q110 233 129 236 Q145 239 148 253 L143 267 Q137 273 123 267 L91 252 Q74 245 74 225 L72 209 Q73 199 78 194 Z', this.upper);
      this.headRig = node('g', {}, this.upper);
      this.head = piece('head', 'M17 16 H174 V214 H17 Z', this.headRig);
      // The loose white frosting at the back lags a little behind head tilts.
      this.icing = piece('loose-icing', 'M18 42 H73 L75 104 L67 133 L65 171 L80 211 H18 Z', this.headRig);
      this.face = node('g', {}, this.headRig);

      this.cookie = node('g', { opacity: 0 }, this.upper);
      node('path', { d: 'M0 -8 C-5 -16 -17 -15 -19 -6 C-23 4 -12 13 0 21 C12 13 23 4 19 -6 C17 -15 5 -16 0 -8 Z',
        fill: '#b77343', stroke: '#754429', 'stroke-width': 2, 'stroke-linejoin': 'round' }, this.cookie);
      node('path', { d: 'M0 -6 C-6 -14 -15 -11 -16 -4 C-17 3 -9 10 0 16 C9 10 17 3 16 -4 C15 -11 6 -14 0 -6 Z',
        fill: '#f7f1ef', stroke: '#ead7ce', 'stroke-width': 1 }, this.cookie);
      node('path', { d: 'M0 -5 C-3 -10 -11 -10 -12 -3 C-13 2 -6 9 0 13 C6 9 13 2 12 -3 C11 -10 3 -10 0 -5 Z',
        fill: '#f39ab4' }, this.cookie);
      node('path', { d: 'M-9 -3 L-4 -1 M4 -5 L8 -2 M-3 6 L2 8 M7 4 L10 5',
        fill: 'none', stroke: '#fff4da', 'stroke-width': 1.6, 'stroke-linecap': 'round' }, this.cookie);
      this.sprinkles = node('g', { opacity: 0 }, this.upper);
      [[-12, -10, 2.2, '#fff6dc'], [11, -15, 1.7, '#ff9dbb'], [-17, 8, 1.5, '#ffaec8'],
        [18, 6, 2, '#fff6dc'], [0, -21, 1.4, '#ffb6cc']].forEach(([x, y, r, fill]) =>
        node('circle', { cx: x, cy: y, r, fill }, this.sprinkles));
      this.drawFace('idle');
    }

    drawFace(mood) {
      if (mood === this.mood) return;
      this.mood = mood;
      this.face.replaceChildren();
      if (mood === 'idle') return;
      const g = this.face;
      node('ellipse', { cx: 114, cy: 158, rx: 22, ry: 20, fill: this.mouthShade }, g);
      const line = (d, width = 2.5) => node('path', { d, fill: 'none', stroke: '#211514',
        'stroke-width': width, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, g);
      if (mood === 'cheer') {
        node('path', { d: 'M105 151 Q114 154 124 150 Q122 166 114 169 Q107 167 105 151 Z',
          fill: '#672f38', stroke: '#231619', 'stroke-width': 2.2 }, g);
        node('path', { d: 'M108 161 Q114 158 121 162 Q118 167 114 167 Q110 166 108 161 Z', fill: '#ee9ba6' }, g);
      } else if (mood === 'shy') {
        node('path', { d: 'M103 153 Q113 162 125 152 Q121 166 113 166 Q107 164 103 153 Z',
          fill: '#fff9f1', stroke: '#241717', 'stroke-width': 2.2 }, g);
        line('M114 159 L113 165', 1.2);
        node('path', { d: 'M49 143 L47 150 M56 143 L54 151 M63 144 L61 151', fill: 'none',
          stroke: '#f4a4bf', 'stroke-width': 2.4, 'stroke-linecap': 'round', opacity: .85 }, g);
      } else if (mood === 'hurt') {
        node('ellipse', { cx: 114, cy: 158, rx: 5.5, ry: 7, fill: '#642e34',
          stroke: '#251819', 'stroke-width': 2 }, g);
      } else if (mood === 'determined') {
        line('M104 160 Q114 149 124 160', 2.7);
        line('M131 88 Q143 83 153 87', 2.3);
      } else if (mood === 'sleep') {
        line('M108 159 Q114 163 120 159', 2);
        node('path', { d: 'M130 116 Q143 126 156 113', fill: 'none', stroke: '#2b1b1a',
          'stroke-width': 3.3, 'stroke-linecap': 'round' }, g);
      } else {
        line('M107 157 Q114 163 121 156', 2.5);
      }
    }

    update(u, elapsed) {
      const dt = clamp(elapsed || 0, 0, .05);
      if (!dt) return;
      this.time += dt;
      const speed = Math.hypot(u.vx || 0, u.vy || 0);
      const s = this.s;
      const moving = s.move.step(u.moving ? 1 : 0, dt, 100, 19);
      this.phase += dt * (9 + Math.min(speed, 140) * .055);
      const stride = Math.sin(this.phase), bounce = Math.abs(stride);
      const idle = Math.sin(this.time * 2.6);
      const breath = Math.sin(this.time * 3.4 + .8);
      const action = u.animT > 0 ? u.animState : '';
      const progress = action ? 1 - clamp(u.animT / Math.max(.01, u.animDur || 1)) : 0;
      const wind = action === 'wind' ? hold(progress) : 0;
      const attack = action === 'attack' ? hold(progress) : 0;
      const cast = action === 'cast' || action === 'spin' ? hold(progress) : u.casting ? .7 : 0;
      if ((u.hitT || 0) > this.lastHit + .02) { this.s.recoil.v = -65; this.hurt = .36; }
      this.lastHit = u.hitT || 0;
      this.hurt = Math.max(0, this.hurt - dt);
      const flourishTime = this.time % 6.2;
      const flourish = moving < .1 && !action && !u.casting && !u.visualSleep
        ? ease((flourishTime - 3.8) / .34) * (1 - ease((flourishTime - 5.5) / .45)) : 0;
      // Her regular pose should read even when the battle sprite is small.
      // The heel lifts land on alternating beats, while the head and icing
      // follow the body a fraction of a beat later.
      const recoil = s.recoil.step(0, dt);
      const cookie = s.cookie.step(Math.max(cast, flourish * .78, attack * .45), dt, 170, 20);
      const castDip = cast * (1 - ease((progress - .52) / .28));
      const castRelease = cast * ease((progress - .42) / .32);
      const bob = s.bob.step(-1.5 - breath * 1.7 - bounce * moving * 5.5 + castDip * 3 - castRelease * 8 - attack * 3 + recoil, dt);
      const sway = s.sway.step(idle * 2.4 * (1 - moving) + stride * moving * 2.8 + flourish * 2.8 + attack * 5, dt);
      const lean = s.lean.step(idle * 2.6 * (1 - moving) + stride * moving * 3.2 - wind * 8 + attack * 13 - castDip * 8 + castRelease * 7 + flourish * 5 + recoil * .2, dt);
      const head = s.head.step(-idle * 4 - breath * 1.2 - stride * moving * 4 + wind * 5 - castDip * 9 + castRelease * 11 + attack * 5 - flourish * 8 + recoil * .32 + (u.visualSleep ? 10 : 0), dt);
      const icing = s.icing.step(-head * .65 + stride * moving * 7 + Math.sin(this.time * 3.5) * 2.7, dt, 105, 12);
      const armNear = s.armNear.step(idle * 3.8 + stride * moving * 11 + wind * 8 - attack * 13 + cast * 12 + flourish * 8, dt, 165, 19);
      const armFar = s.armFar.step(-idle * 3.5 - stride * moving * 10 - wind * 8 - attack * 16 - cast * 15 - flourish * 9, dt, 165, 19);
      const legNear = s.legNear.step(stride * moving * 21 - attack * 6, dt);
      const legFar = s.legFar.step(-stride * moving * 19 + attack * 8, dt);
      const liftNear = s.liftNear.step(Math.max(0, stride) * moving * 6, dt);
      const liftFar = s.liftFar.step(Math.max(0, -stride) * moving * 6, dt);
      const rotate = (part, deg, x, y) => part.setAttribute('transform', `rotate(${deg.toFixed(2)} ${x} ${y})`);
      this.root.setAttribute('transform', `translate(${sway.toFixed(2)} ${bob.toFixed(2)})`);
      this.legFar.setAttribute('transform', `translate(0 ${(-liftFar).toFixed(2)}) rotate(${legFar.toFixed(2)} 115 273)`);
      this.legNear.setAttribute('transform', `translate(0 ${(-liftNear).toFixed(2)}) rotate(${legNear.toFixed(2)} 91 273)`);
      rotate(this.upper, lean, 91, 266);
      rotate(this.armFar, armFar, 130, 210);
      rotate(this.armNear, armNear, 88, 207);
      rotate(this.headRig, head, 95, 195);
      rotate(this.icing, icing, 60, 94);
      const toss = action === 'cast' ? ease((progress - .59) / .29) : 0;
      const cookieX = 133 + toss * 27 + flourish * 13 + attack * 8;
      const cookieY = 251 - toss * 70 - flourish * (13 + Math.sin(this.time * 6) * 3) - cast * 9;
      this.cookie.setAttribute('transform', `translate(${cookieX.toFixed(2)} ${cookieY.toFixed(2)}) rotate(${(-12 + cookie * 17 + toss * 35).toFixed(1)}) scale(${(.64 + cookie * .28).toFixed(2)})`);
      this.cookie.setAttribute('opacity', clamp(cookie * 1.5 * (1 - toss)).toFixed(2));
      this.sprinkles.setAttribute('transform', `translate(${cookieX.toFixed(2)} ${cookieY.toFixed(2)}) rotate(${(this.time * 24).toFixed(1)})`);
      this.sprinkles.setAttribute('opacity', clamp((cast * .8 + flourish * .35) * (1 - toss)).toFixed(2));
      const shy = flourishTime > 4.05 && flourishTime < 5.7 && moving < .1 && !action;
      const mood = u.visualSleep ? 'sleep' : this.hurt > 0 ? 'hurt' : cast > .15 ? 'cheer' :
        attack > .17 || wind > .17 ? 'determined' : shy ? 'shy' : 'idle';
      this.drawFace(mood);
    }
  }
  const enabled = () => { try { return !!Save.data.opt.animatedChars; } catch (_) { return true; } };
  return { enabled, create: host => new Rig(host) };
})();
