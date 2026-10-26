/* Dandy's flower puppet uses the original battle render as articulated art.
   The five supplied close-ups guide his surprise, smile, laugh, grin, and
   sleepy expressions; the screenshots themselves are not drawn in battle. */
'use strict';
const DandyRig = (() => {
  const NS = 'http://www.w3.org/2000/svg';
  const node = (tag, attrs = {}, parent) => {
    const element = document.createElementNS(NS, tag);
    for (const [key, value] of Object.entries(attrs)) element.setAttribute(key, value);
    if (parent) parent.appendChild(element);
    return element;
  };
  const clamp = (n, a = 0, b = 1) => Math.max(a, Math.min(b, n));
  const ease = n => { n = clamp(n); return n * n * (3 - 2 * n); };
  const pulse = n => Math.sin(Math.PI * clamp(n));
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
      this.s = Object.fromEntries([
        'move', 'bob', 'lean', 'head', 'red', 'purple', 'blue', 'orange', 'yellow',
        'armL', 'armR', 'legL', 'legR', 'face', 'recoil'
      ].map(name => [name, new Spring()]));
      const id = `dandy-rig-${++nextId}`;
      const svg = node('svg', { viewBox: '0 0 268 371', class: 'rig-svg', 'aria-hidden': 'true' }, host);
      const defs = node('defs', {}, svg);
      const src = (typeof ASSET === 'string' ? ASSET : './') + 'Characters/Dandy/Dandy.png';
      const piece = (name, path, parent) => {
        const clipId = `${id}-${name}`;
        node('path', { d: path }, node('clipPath', { id: clipId, clipPathUnits: 'userSpaceOnUse' }, defs));
        const group = node('g', {}, parent);
        node('image', { href: src, width: 268, height: 371, 'clip-path': `url(#${clipId})` }, group);
        return group;
      };
      const cloth = node('linearGradient', { id: `${id}-cloth`, x1: '0%', y1: '0%', x2: '100%', y2: '100%' }, defs);
      node('stop', { offset: 0, 'stop-color': '#49c957' }, cloth);
      node('stop', { offset: .6, 'stop-color': '#20a93f' }, cloth);
      node('stop', { offset: 1, 'stop-color': '#138938' }, cloth);
      const faceFill = node('linearGradient', { id: `${id}-face`, x1: '0%', y1: '0%', x2: '90%', y2: '100%' }, defs);
      node('stop', { offset: 0, 'stop-color': '#c1bea6' }, faceFill);
      node('stop', { offset: .58, 'stop-color': '#b5b39b' }, faceFill);
      node('stop', { offset: 1, 'stop-color': '#92927c' }, faceFill);

      this.root = node('g', {}, svg);
      this.legR = piece('leg-r', 'M129 300 H177 V371 H129 Z', this.root);
      this.legL = piece('leg-l', 'M96 300 H139 V371 H96 Z', this.root);
      this.upper = node('g', {}, this.root);
      // Painted torso under the lifted arms, so their old positions cannot
      // remain visible when the shoulders turn.
      node('path', { d: 'M114 226 Q150 220 177 234 Q186 251 178 272 Q150 284 112 277 Q102 260 107 241 Z', fill: `url(#${id}-cloth)` }, this.upper);
      this.torso = piece('torso', 'M95 216 H202 V313 H95 Z', this.upper);
      const armMask = node('mask', { id: `${id}-arms-mask`, maskUnits: 'userSpaceOnUse', x: 0, y: 0, width: 268, height: 371 }, defs);
      node('rect', { x: 0, y: 0, width: 268, height: 371, fill: 'white' }, armMask);
      node('path', { d: 'M82 241 Q96 242 107 249 Q120 252 135 246 Q145 247 150 259 L150 272 Q134 284 108 282 Q82 282 80 266 Z M173 225 Q188 228 197 243 L201 264 Q197 286 178 294 Q169 293 168 281 L173 252 Z', fill: 'black' }, armMask);
      this.torso.setAttribute('mask', `url(#${id}-arms-mask)`);
      this.armR = piece('arm-r', 'M171 224 Q188 226 198 242 L202 266 Q198 288 177 296 Q166 294 167 279 L171 250 Z', this.upper);
      this.armL = piece('arm-l', 'M81 241 Q95 239 108 248 Q120 251 135 245 Q148 245 152 259 L152 272 Q136 284 108 283 Q80 282 79 265 Z', this.upper);

      this.head = node('g', {}, this.upper);
      this.purple = piece('purple', 'M39 47 Q70 37 101 54 L118 99 L112 163 L77 174 Q41 159 40 111 Z', this.head);
      this.blue = piece('blue', 'M47 145 Q74 138 105 148 L124 201 L117 251 Q73 262 50 216 Z', this.head);
      this.red = piece('red', 'M94 8 Q136 -1 166 20 Q181 43 174 86 L151 106 L108 92 Z', this.head);
      this.orange = piece('orange', 'M164 49 Q200 37 218 69 Q232 103 208 136 L178 139 L158 93 Z', this.head);
      this.yellow = piece('yellow', 'M187 126 Q222 124 227 160 Q229 202 204 219 L177 216 L171 166 Z', this.head);
      this.faceArt = piece('face', 'M145 68 Q186 70 198 114 Q211 170 191 199 Q175 225 142 224 Q105 221 91 184 Q81 147 96 105 Q111 72 145 68 Z', this.head);
      this.expression = node('g', { opacity: 0 }, this.head);
      node('path', { d: 'M145 71 Q183 71 196 113 Q207 164 190 197 Q175 220 143 220 Q108 218 96 182 Q86 146 99 107 Q111 76 145 71 Z', fill: `url(#${id}-face)` }, this.expression);
      node('ellipse', { cx: 111, cy: 179, rx: 12, ry: 9, fill: '#84b795', opacity: .72 }, this.expression);
      this.features = node('g', {}, this.expression);
      this.drawFace('smile');
    }

    drawFace(mood) {
      if (this.mood === mood) return;
      this.mood = mood;
      const g = this.features;
      g.replaceChildren();
      const line = (d, width = 3) => node('path', { d, fill: 'none', stroke: '#1c1b19', 'stroke-width': width, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, g);
      if (mood === 'sleepy' || mood === 'blink') {
        const eyelid = mood === 'sleepy' ? 'M110 146 Q132 160 157 139 M175 136 Q187 148 196 133' : 'M108 143 Q133 165 158 141 M173 140 Q186 154 198 136';
        line(eyelid, 3.5);
        line(mood === 'sleepy' ? 'M142 187 Q157 201 176 183' : 'M146 187 Q158 197 174 185', 3.2);
        if (mood === 'sleepy') {
          line('M111 115 L137 112 M178 111 L191 113', 2.5);
          return;
        }
        return;
      }
      const eyes = mood === 'surprise' ? [[134, 139, 25, 35], [184, 137, 14, 31]] : [[134, 141, 24, 34], [184, 137, 13, 31]];
      eyes.forEach(([x, y, rx, ry], i) => {
        node('ellipse', { cx: x, cy: y, rx, ry, fill: '#f5f5f0', stroke: '#1d1c1b', 'stroke-width': i ? 3.1 : 3.7 }, g);
        const offset = mood === 'surprise' ? (i ? 1 : 7) : mood === 'laugh' ? -7 : mood === 'happy' ? -3 : 1;
        node('ellipse', { cx: x + offset, cy: y + 2, rx: i ? 7 : 13, ry: i ? 19 : 23, fill: '#151515' }, g);
      });
      if (mood === 'surprise') {
        node('path', { d: 'M153 179 Q167 167 180 181 Q187 198 174 205 Q158 208 151 196 Q148 187 153 179 Z', fill: '#6a363c', stroke: '#252020', 'stroke-width': 3.2 }, g);
        node('path', { d: 'M159 199 Q168 194 178 200', fill: 'none', stroke: '#e0a0a2', 'stroke-width': 3 }, g);
      } else if (mood === 'laugh') {
        node('path', { d: 'M143 179 Q162 185 190 171 Q190 201 172 207 Q153 207 143 179 Z', fill: '#69343a', stroke: '#241e1d', 'stroke-width': 3 }, g);
        node('path', { d: 'M146 180 Q165 184 187 174 L182 185 Q166 194 152 188 Z', fill: '#f3f0e9', stroke: '#24201f', 'stroke-width': 2 }, g);
        node('path', { d: 'M164 201 Q174 195 181 199', fill: 'none', stroke: '#dd929a', 'stroke-width': 3 }, g);
      } else {
        node('path', { d: 'M146 177 Q163 185 189 171 Q184 198 169 203 Q151 203 146 177 Z', fill: '#743c42', stroke: '#241f1e', 'stroke-width': 3 }, g);
        node('path', { d: 'M150 183 Q168 186 186 177', fill: 'none', stroke: '#f6f1e8', 'stroke-width': 4, 'stroke-linecap': 'round' }, g);
      }
    }

    update(u, elapsed) {
      const dt = clamp(elapsed || 0, 0, .05);
      if (!dt) return;
      this.time += dt;
      const s = this.s;
      const moving = s.move.step(u.moving ? 1 : 0, dt, 110, 19);
      const speed = Math.hypot(u.vx || 0, u.vy || 0);
      this.phase += dt * (8 + Math.min(speed, 130) * .05);
      const stride = Math.sin(this.phase);
      const idle = Math.sin(this.time * 2.3);
      const action = u.animT > 0 ? u.animState : '';
      const progress = action ? 1 - clamp(u.animT / Math.max(.01, u.animDur || 1)) : 0;
      const swing = action === 'attack' ? pulse(progress) : 0;
      const wind = action === 'wind' ? pulse(progress) : 0;
      const cast = action === 'cast' || action === 'spin' || u.casting ? pulse(progress || .5) : 0;
      if ((u.hitT || 0) > this.lastHit + .02) { s.recoil.v = -75; this.hurt = .34; }
      this.lastHit = u.hitT || 0;
      this.hurt = Math.max(0, this.hurt - dt);
      const recoil = s.recoil.step(0, dt);
      const bob = s.bob.step(-Math.abs(stride) * moving * 5 + idle * 1.5 - cast * 7 - swing * 4 + recoil, dt);
      const lean = s.lean.step(idle * 1.8 + stride * moving * 3 - wind * 9 + swing * 13 + cast * 4 + recoil * .18, dt);
      const head = s.head.step(-idle * 2.6 - stride * moving * 4 + wind * 7 - swing * 7 - cast * 7 + recoil * .3 + (u.visualSleep ? 11 : 0), dt);
      const bloom = cast * 1.2 + swing * .35;
      const red = s.red.step(-idle * 2.2 - bloom * 9, dt, 105, 13);
      const purple = s.purple.step(idle * 2.3 - stride * moving * 4 - bloom * 10, dt, 105, 13);
      const blue = s.blue.step(-idle * 2.5 + stride * moving * 5 - bloom * 8, dt, 110, 14);
      const orange = s.orange.step(-idle * 2 + stride * moving * 4 + bloom * 10, dt, 105, 13);
      const yellow = s.yellow.step(idle * 2.5 - stride * moving * 5 + bloom * 11, dt, 110, 14);
      const armL = s.armL.step(idle * 3 + stride * moving * 15 + wind * 20 - swing * 37 + cast * 30, dt);
      const armR = s.armR.step(-idle * 4 - stride * moving * 14 - wind * 16 - swing * 56 - cast * 45, dt);
      const legL = s.legL.step(stride * moving * 20 + swing * 4, dt);
      const legR = s.legR.step(-stride * moving * 19 - swing * 6, dt);
      const rotate = (part, angle, x, y) => part.setAttribute('transform', `rotate(${angle.toFixed(2)} ${x} ${y})`);
      this.root.setAttribute('transform', `translate(0 ${bob.toFixed(2)})`);
      rotate(this.legR, legR, 143, 297);
      rotate(this.legL, legL, 113, 298);
      rotate(this.upper, lean, 138, 294);
      rotate(this.armL, armL, 104, 250);
      rotate(this.armR, armR, 181, 239);
      rotate(this.head, head, 146, 222);
      rotate(this.red, red, 137, 82);
      rotate(this.purple, purple, 106, 111);
      rotate(this.blue, blue, 109, 196);
      rotate(this.orange, orange, 176, 103);
      rotate(this.yellow, yellow, 187, 174);
      const beat = this.time % 6.6;
      const mood = u.visualSleep ? 'sleepy' : this.hurt ? 'surprise' : cast > .12 ? 'happy' : swing > .12 ? 'laugh' :
        wind > .15 ? 'surprise' : moving > .25 ? '' : beat < .13 ? 'blink' : beat > 4.5 && beat < 5.8 ? 'sleepy' : '';
      if (mood && mood !== this.mood) this.drawFace(mood);
      const face = s.face.step(mood ? 1 : 0, dt, 210, 23);
      this.expression.setAttribute('opacity', clamp(face).toFixed(2));
    }
  }
  const enabled = () => { try { return !!Save.data.opt.animatedChars; } catch (_) { return true; } };
  return { enabled, create: host => new Rig(host) };
})();
