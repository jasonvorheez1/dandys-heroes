/* Gourdy's battle cutout uses his original rendered pixels. The gradients
   underneath the moving pieces only complete hidden vine joints. */
'use strict';
const GourdyRig = (() => {
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
    step(target, dt, k = 145, damping = 18) {
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
      this.phase = 0;
      this.lastHit = 0;
      this.hurt = 0;
      this.blinkT = 1.8 + Math.random() * 2.5;
      this.mood = '';
      this.s = Object.fromEntries(['move', 'bob', 'lean', 'head', 'stem', 'leaf', 'tail', 'armNear', 'handNear',
        'armFar', 'handFar', 'legNear', 'legFar', 'recoil', 'sx', 'sy'].map(k => [k, new Spring(k === 'sx' || k === 'sy' ? 1 : 0)]));
      const id = `gourdy-rig-${++serial}`;
      const svg = node('svg', { viewBox: '0 0 206 276', class: 'rig-svg', 'aria-hidden': 'true' }, host);
      const defs = node('defs', {}, svg);
      const src = (typeof ASSET === 'string' ? ASSET : './') + 'Characters/Gourdy/Gourdy.png';
      const cut = (name, d, parent) => {
        const cid = `${id}-${name}`;
        node('path', { d }, node('clipPath', { id: cid, clipPathUnits: 'userSpaceOnUse' }, defs));
        const g = node('g', {}, parent);
        node('image', { href: src, width: 206, height: 276, 'clip-path': `url(#${cid})` }, g);
        return g;
      };
      const gradient = (name, stops) => {
        const g = node('linearGradient', { id: `${id}-${name}`, x1: '12%', y1: '0%', x2: '82%', y2: '100%' }, defs);
        stops.forEach(([offset, color]) => node('stop', { offset, 'stop-color': color }, g));
        return `url(#${id}-${name})`;
      };
      const vine = gradient('vine', [[0, '#6b9235'], [.55, '#3a6d2a'], [1, '#1f4520']]);
      const mitten = gradient('mitten', [[0, '#dc741a'], [.55, '#b95410'], [1, '#87390c']]);
      this.root = node('g', {}, svg);
      this.body = node('g', {}, this.root);

      this.tail = cut('tail', 'M8 188 Q31 187 40 212 Q45 233 72 246 L80 264 L51 258 Q16 236 8 211 Z', this.body);
      this.legFar = node('g', {}, this.body);
      node('path', { d: 'M99 200 Q113 199 116 220 L118 252 Q119 264 109 267 L95 265 Z', fill: vine }, this.legFar);
      cut('far-leg', 'M96 200 Q115 194 120 216 L124 260 Q115 274 98 269 L94 238 Z', this.legFar);
      this.legNear = node('g', {}, this.body);
      node('path', { d: 'M79 199 Q96 197 103 217 L102 256 Q98 270 80 268 L76 235 Z', fill: vine }, this.legNear);
      cut('near-leg', 'M74 200 Q100 193 108 219 L109 262 Q96 275 74 268 L72 241 Z', this.legNear);
      this.upper = node('g', {}, this.body);

      this.armFar = node('g', {}, this.upper);
      node('path', { d: 'M110 164 Q119 165 127 180 L135 202 L123 210 L111 187 Z', fill: vine }, this.armFar);
      cut('far-arm', 'M111 162 Q123 166 132 182 L140 207 L125 211 Q120 187 111 175 Z', this.armFar);
      this.handFar = node('g', {}, this.armFar);
      node('path', { d: 'M123 194 Q142 187 149 208 L150 231 Q143 250 126 251 L115 236 Z', fill: mitten }, this.handFar);
      cut('far-mitten', 'M117 194 Q141 189 150 207 L151 241 Q146 254 129 259 L116 244 Z', this.handFar);
      this.armNear = node('g', {}, this.upper);
      node('path', { d: 'M82 162 Q72 166 65 184 L59 206 L76 213 L88 184 Z', fill: vine }, this.armNear);
      cut('near-arm', 'M78 161 Q84 163 82 173 L66 207 L54 207 Q62 179 78 161 Z', this.armNear);
      this.handNear = node('g', {}, this.armNear);
      node('path', { d: 'M58 191 Q39 195 39 219 L43 242 Q54 255 71 250 L82 224 Z', fill: mitten }, this.handNear);
      cut('near-mitten', 'M43 196 Q65 187 78 201 L79 241 Q76 255 63 258 L47 245 Q37 230 43 196 Z', this.handNear);

      // Gourdy's orange body keeps the original lighting and silhouette.
      cut('body', 'M79 157 Q100 155 113 167 L119 192 Q117 210 103 214 L83 211 Q72 196 77 178 Z', this.upper);
      this.head = node('g', {}, this.upper);
      cut('pumpkin-head', 'M31 52 Q95 41 142 60 Q169 78 168 120 Q170 151 137 163 Q99 176 52 161 Q14 151 17 113 Q19 72 31 52 Z', this.head);
      this.stem = cut('stem', 'M54 4 Q69 3 76 18 L91 54 L69 60 L54 24 Z', this.head);
      this.leaf = cut('leaf', 'M83 9 Q107 5 133 6 L137 36 Q119 43 90 56 L83 49 Z', this.head);
      // Face changes use the existing black eye sockets and tiny original mouth.
      this.face = node('g', {}, this.head);
      this.drawFace('original');
    }

    drawFace(mood) {
      if (mood === this.mood) return;
      this.mood = mood;
      const g = this.face;
      g.replaceChildren();
      if (mood === 'original') return;
      const dark = '#060706', white = '#eceae6';
      // Cover just the original white eye centres. The black rendered sockets
      // and every pumpkin surface pixel remain visible around the expression.
      node('ellipse', { cx: 105, cy: 119, rx: 19, ry: 20, fill: dark }, g);
      node('ellipse', { cx: 150, cy: 115, rx: 7, ry: 17, fill: dark }, g);
      const path = (d, width = 2.5, color = white) => node('path', { d, fill: 'none', stroke: color, 'stroke-width': width, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, g);
      if (mood === 'happy') {
        path('M93 120 Q104 142 117 120', 4.2);
        path('M145 115 Q150 128 154 114', 2.7);
        path('M122 151 Q128 157 134 152', 1.5, '#261305');
      } else if (mood === 'surprise') {
        node('ellipse', { cx: 105, cy: 118, rx: 12, ry: 15, fill: white }, g);
        node('ellipse', { cx: 150, cy: 114, rx: 4.5, ry: 12, fill: white }, g);
        node('ellipse', { cx: 127, cy: 151, rx: 2.8, ry: 3.5, fill: '#281003' }, g);
      } else if (mood === 'worry') {
        node('ellipse', { cx: 105, cy: 118, rx: 13, ry: 15, fill: white }, g);
        node('ellipse', { cx: 150, cy: 114, rx: 4.5, ry: 12, fill: white }, g);
        path('M85 96 Q92 90 98 94 M141 92 Q146 88 152 94', 2.1, '#592606');
        path('M122 154 Q128 148 133 153', 1.8, '#291305');
      } else if (mood === 'focus') {
        node('ellipse', { cx: 105, cy: 120, rx: 13, ry: 13, fill: white }, g);
        node('ellipse', { cx: 150, cy: 116, rx: 4.2, ry: 10, fill: white }, g);
        path('M86 100 L104 105 M141 93 L154 97', 2.5, '#542307');
      } else if (mood === 'blink' || mood === 'sleep') {
        path('M92 120 Q105 127 117 119 M145 115 Q150 120 154 114', 2.6);
      }
    }

    update(u, elapsed) {
      const dt = clamp(elapsed || 0, 0, .05);
      if (!dt) return;
      this.time += dt;
      const s = this.s;
      const speed = Math.hypot(u.vx || 0, u.vy || 0);
      const moving = s.move.step(u.moving ? 1 : 0, dt, 120, 18);
      this.phase += dt * (8 + Math.min(speed, 130) * .045);
      const stride = Math.sin(this.phase), idle = Math.sin(this.time * 2.7);
      const action = u.animT > 0 ? u.animState : '';
      const progress = action ? 1 - clamp(u.animT / Math.max(.01, u.animDur || 1)) : 0;
      const wind = action === 'wind' ? pulse(progress) : 0;
      const attack = action === 'attack' ? pulse(progress) : 0;
      const cast = action === 'cast' || action === 'spin' ? pulse(progress) : u.casting ? .6 : 0;
      const sleep = u.visualSleep ? 1 : 0;
      if ((u.hitT || 0) > this.lastHit + .02) { s.recoil.v = -85; this.hurt = .25; }
      this.lastHit = u.hitT || 0;
      this.hurt = Math.max(0, this.hurt - dt);
      const recoil = s.recoil.step(0, dt);
      const calm = (1 - moving) * (1 -wind) * (1 - attack) * (1 - cast) * (1 - sleep);
      const bob = s.bob.step(idle * 1.1 * calm - Math.abs(stride) * moving * 4 - wind * 3 - attack * 3 - cast * 2 - sleep * 4 + recoil * .4, dt);
      const lean = s.lean.step(stride * moving * 2 - wind * 4 + attack * 6 + cast * -3 + recoil * .12, dt);
      const head = s.head.step(-idle * 1.3 * calm - stride * moving * 3 + wind * 3 - attack * 5 + cast * -3 + sleep * 8, dt);
      const armNear = s.armNear.step(stride * moving * 6 + wind * 5 - attack * 11 + cast * 10 - sleep * 5, dt);
      const handNear = s.handNear.step(-stride * moving * 3 - attack * 4 + cast * 4, dt);
      const armFar = s.armFar.step(-stride * moving * 6 - wind * 5 + attack * 10 - cast * 9 + sleep * 5, dt);
      const handFar = s.handFar.step(stride * moving * 3 + attack * 4 - cast * 4, dt);
      const legNear = s.legNear.step(stride * moving * 8 - attack * 3, dt);
      const legFar = s.legFar.step(-stride * moving * 8 + attack * 3, dt);
      const tail = s.tail.step(idle * 2 * calm - stride * moving * 6 - attack * 7 + cast * 5, dt, 70, 11);
      const stem = s.stem.step(-head * .4 - stride * moving * 3 + attack * 3, dt, 75, 12);
      const leaf = s.leaf.step(-stem * .5 + idle * 2 * calm + stride * moving * 4, dt, 60, 10);
      const sx = s.sx.step(1 + wind * .035 - attack * .025 + Math.abs(stride) * moving * .012, dt);
      const sy = s.sy.step(1 - wind * .05 + attack * .04 - Math.abs(stride) * moving * .02, dt);
      this.root.setAttribute('transform', `translate(100 265) scale(${sx.toFixed(3)} ${sy.toFixed(3)}) translate(-100 -265)`);
      this.body.setAttribute('transform', `translate(0 ${bob.toFixed(2)})`);
      rot(this.tail, tail, 68, 236);
      rot(this.legFar, legFar, 106, 213); rot(this.legNear, legNear, 88, 213);
      rot(this.upper, lean, 98, 203);
      rot(this.armFar, armFar, 117, 171); rot(this.handFar, handFar, 130, 206);
      rot(this.armNear, armNear, 78, 170); rot(this.handNear, handNear, 62, 208);
      rot(this.head, head, 96, 162);
      rot(this.stem, stem, 74, 54); rot(this.leaf, leaf, 96, 49);
      this.blinkT -= dt;
      const blinking = this.blinkT < 0 && this.blinkT > -.1;
      if (this.blinkT < -.1) this.blinkT = 2 + Math.random() * 3;
      const mood = sleep ? 'sleep' : this.hurt > 0 ? 'worry' : cast > .18 ? 'happy' : attack > .15 ? 'focus' : wind > .2 ? 'surprise' : blinking ? 'blink' : 'original';
      this.drawFace(mood);
    }
  }
  const enabled = () => { try { return !!Save.data.opt.animatedChars; } catch (_) { return true; } };
  return { enabled, create: host => new Rig(host) };
})();
