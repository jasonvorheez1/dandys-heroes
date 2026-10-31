/* Finn's battle puppet. His bowl, sailor rim and shoes retain the source art;
   the hidden shoulder, elbow and hip surfaces are drawn so every joint can move. */
'use strict';
const FinnRig = (() => {
  const NS = 'http://www.w3.org/2000/svg';
  const node = (tag, attrs = {}, parent) => {
    const el = document.createElementNS(NS, tag);
    for (const [key, value] of Object.entries(attrs)) el.setAttribute(key, value);
    if (parent) parent.appendChild(el);
    return el;
  };
  const clamp = (n, a = 0, b = 1) => Math.min(b, Math.max(a, n));
  const ease = n => { n = clamp(n); return n * n * (3 - 2 * n); };
  const pose = n => Math.sin(Math.PI * clamp(n));
  const rotate = (part, angle, x, y) => part.setAttribute('transform', `rotate(${angle.toFixed(2)} ${x} ${y})`);
  let serial = 0;

  class Spring {
    constructor() { this.x = 0; this.v = 0; }
    step(target, dt, stiffness = 160, damping = 19) {
      const steps = Math.max(1, Math.ceil(dt / .008)), h = dt / steps;
      for (let i = 0; i < steps; i++) {
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
      this.hurt = 0;
      this.lastHit = 0;
      this.mood = '';
      this.s = Object.fromEntries(['run', 'bob', 'lean', 'head', 'armNear', 'elbowNear', 'armFar', 'elbowFar', 'legNear', 'legFar', 'recoil'].map(k => [k, new Spring()]));
      const id = `finn-rig-${++serial}`;
      const svg = node('svg', { viewBox: '0 0 248 352', class: 'rig-svg', 'aria-hidden': 'true' }, host);
      const defs = node('defs', {}, svg);
      const source = (typeof ASSET === 'string' ? ASSET : './') + 'assets/toon-art/Finn/Finn.png';
      const cut = (name, d, parent) => {
        const clip = `${id}-${name}`;
        node('path', { d }, node('clipPath', { id: clip, clipPathUnits: 'userSpaceOnUse' }, defs));
        const g = node('g', {}, parent);
        node('image', { href: source, width: 248, height: 352, 'clip-path': `url(#${clip})` }, g);
        return g;
      };
      const gradient = (name, stops, attrs = {}) => {
        const g = node('linearGradient', { id: `${id}-${name}`, x1: '0%', y1: '0%', x2: '100%', y2: '100%', ...attrs }, defs);
        stops.forEach(([offset, color]) => node('stop', { offset, 'stop-color': color }, g));
        return `url(#${id}-${name})`;
      };
      const ceramic = gradient('ceramic', [[0, '#f7ffff'], [.4, '#d6f0fa'], [.75, '#a5c6dc'], [1, '#658ba8']], { x1: '76%', y1: '2%', x2: '18%', y2: '96%' });
      const armFill = gradient('arm', [[0, '#faffff'], [.5, '#d9f1fb'], [1, '#78a9ca']], { x1: '20%', y1: '0%', x2: '87%', y2: '100%' });
      const vestFill = gradient('vest', [[0, '#ff9854'], [.5, '#f36b2f'], [1, '#bc4d1d']], { x1: '10%', y1: '0%', x2: '95%', y2: '100%' });
      const blue = '#2c87bf';
      const limb = (d, parent, stroke = blue, width = 2.2) => node('path', { d, fill: armFill, stroke, 'stroke-width': width, 'stroke-linejoin': 'round' }, parent);

      this.root = node('g', {}, svg);
      // The feet come from Finn's painted sprite. Wide clips include the
      // inside edges of both shoes so a stride never cuts off a toe.
      this.legFar = cut('far-leg', 'M128 246 H169 V350 H128 Z', this.root);
      this.legNear = cut('near-leg', 'M99 246 H139 V350 H99 Z', this.root);
      this.upper = node('g', {}, this.root);
      this.armFar = node('g', {}, this.upper);
      limb('M151 188 Q160 184 165 192 Q172 202 169 216 Q164 222 157 219 Q156 205 149 198 Z', this.armFar);
      this.elbowFar = node('g', {}, this.armFar);
      node('circle', { cx: 163, cy: 216, r: 8, fill: armFill }, this.elbowFar);
      limb('M157 215 Q166 209 171 216 L175 231 Q178 245 166 249 Q154 249 153 238 Z', this.elbowFar);
      node('ellipse', { cx: 167, cy: 242, rx: 8.5, ry: 10.5, fill: armFill, stroke: blue, 'stroke-width': 2 }, this.elbowFar);

      // White shorts and orange vest are complete under the moving arms.
      node('path', { d: 'M103 235 Q126 243 158 236 L162 266 Q149 278 128 277 Q108 276 101 264 Z', fill: '#f1f3ef', stroke: '#7e9a9f', 'stroke-width': 1.2 }, this.upper);
      node('path', { d: 'M100 177 Q129 170 153 179 Q164 192 163 223 L160 247 Q132 259 99 245 Q95 212 100 177 Z', fill: vestFill, stroke: '#ba4d23', 'stroke-width': 1.7 }, this.upper);
      node('path', { d: 'M110 178 L119 178 L122 188 Z', fill: '#f5faf8' }, this.upper);
      node('path', { d: 'M99 183 Q128 188 160 181 L161 190 Q130 197 99 191 Z M98 215 Q129 221 161 214 L161 224 Q130 231 98 223 Z', fill: '#34393a', stroke: '#1b2429', 'stroke-width': 1.4 }, this.upper);
      node('path', { d: 'M148 180 L153 180 L154 191 L149 192 Z M145 216 L151 216 L152 227 L145 227 Z', fill: '#646765' }, this.upper);
      node('path', { d: 'M107 194 Q100 216 105 239', fill: 'none', stroke: '#ffad6b', 'stroke-width': 2, opacity: .36 }, this.upper);

      this.armNear = node('g', {}, this.upper);
      limb('M101 188 Q91 186 83 194 L70 205 Q67 211 73 217 Q79 223 85 217 L99 204 Q105 197 101 188 Z', this.armNear);
      this.elbowNear = node('g', {}, this.armNear);
      node('circle', { cx: 77, cy: 212, r: 7.5, fill: armFill }, this.elbowNear);
      limb('M73 207 Q81 205 86 212 Q89 223 99 229 L107 234 Q112 240 109 249 Q104 258 95 255 Q80 251 75 239 Q67 224 73 207 Z', this.elbowNear);
      // Finn's mitten has the short thumb and rounded palm seen in the references.
      node('path', { d: 'M92 229 Q100 229 107 236 Q111 240 111 248 Q107 257 98 257 Q88 255 82 245 Q79 237 84 233 L90 238 Z', fill: armFill, stroke: blue, 'stroke-width': 2.3, 'stroke-linejoin': 'round' }, this.elbowNear);
      node('path', { d: 'M87 239 Q90 242 90 246', fill: 'none', stroke: '#9ac7df', 'stroke-width': 1.8, 'stroke-linecap': 'round' }, this.elbowNear);

      this.head = node('g', {}, this.upper);
      node('path', { d: 'M33 69 Q28 89 33 115 Q39 148 62 164 Q86 181 126 181 Q165 181 187 158 Q204 140 205 108 Q204 78 191 61 Q153 48 97 53 Q53 54 33 69 Z', fill: ceramic, stroke: blue, 'stroke-width': 2.5 }, this.head);
      node('path', { d: 'M42 84 Q40 124 58 145 Q71 161 88 165', fill: 'none', stroke: '#518ab0', 'stroke-width': 6, opacity: .18, 'stroke-linecap': 'round' }, this.head);
      node('path', { d: 'M44 75 Q58 62 77 61', fill: 'none', stroke: '#fff', 'stroke-width': 5, opacity: .5, 'stroke-linecap': 'round' }, this.head);
      node('ellipse', { cx: 79, cy: 76, rx: 6.2, ry: 2.9, transform: 'rotate(-35 79 76)', fill: '#fff', opacity: .75 }, this.head);
      node('circle', { cx: 72, cy: 84, r: 2.5, fill: '#fff', opacity: .7 }, this.head);
      this.face = node('g', {}, this.head);
      // The cap is a source-art cutout above the face, preserving its exact
      // silhouette, double rim, blue highlights and three-quarter angle.
      cut('sailor-rim', 'M26 45 Q29 31 65 26 Q135 14 184 25 Q197 27 198 39 L199 53 Q199 65 191 68 Q161 58 125 60 Q76 63 42 75 Q30 76 28 63 Z', this.head);
      this.drawFace('smile');
    }

    drawFace(mood) {
      if (mood === this.mood) return;
      this.mood = mood;
      const g = this.face;
      g.replaceChildren();
      const eye = (d, pupil) => {
        node('path', { d, fill: '#f9faf9', stroke: '#111217', 'stroke-width': 2.8, 'stroke-linejoin': 'round' }, g);
        node('ellipse', { cx: pupil[0], cy: pupil[1], rx: pupil[2], ry: pupil[3], fill: '#101113' }, g);
      };
      const brow = d => node('path', { d, fill: 'none', stroke: '#111217', 'stroke-width': 2.8, 'stroke-linecap': 'round' }, g);
      const mouth = (d, fill = '#f3f0ed') => node('path', { d, fill, stroke: '#101115', 'stroke-width': 2.7, 'stroke-linejoin': 'round' }, g);
      if (mood === 'sleep') {
        brow('M100 99 Q119 112 151 99 M175 96 Q187 107 199 94');
        brow('M143 146 Q157 151 174 145');
        return;
      }
      if (mood === 'wink') {
        eye('M94 103 Q93 73 116 67 Q143 64 153 88 Q157 112 147 126 Q128 136 107 125 Q97 118 94 103 Z', [119, 99, 22, 25]);
        brow('M173 107 Q185 79 199 91 M174 107 Q185 107 201 107');
        brow('M173 68 Q184 76 196 70');
      } else if (mood === 'worried') {
        eye('M94 101 Q94 74 116 67 Q143 64 153 87 Q159 112 146 126 Q127 136 107 124 Q97 116 94 101 Z', [116, 97, 21, 25]);
        eye('M173 92 Q173 70 185 66 Q200 65 202 91 Q203 113 191 121 Q176 120 173 92 Z', [186, 93, 10, 21]);
        brow('M177 66 Q187 76 198 77');
      } else if (mood === 'surprise') {
        eye('M94 101 Q94 74 116 67 Q143 64 153 87 Q159 112 146 126 Q127 136 107 124 Q97 116 94 101 Z', [123, 82, 21, 23]);
        eye('M173 92 Q173 70 185 66 Q200 65 202 91 Q203 113 191 121 Q176 120 173 92 Z', [190, 79, 10, 19]);
      } else if (mood === 'focus') {
        eye('M94 98 Q99 74 119 68 Q143 66 153 87 Q157 111 146 125 Q126 133 107 123 Q96 113 94 98 Z', [127, 99, 22, 25]);
        eye('M173 92 Q173 72 185 67 Q200 65 202 91 Q202 111 192 121 Q178 120 173 92 Z', [192, 93, 10, 21]);
        brow('M174 68 Q184 66 198 72');
      } else {
        eye('M94 101 Q94 74 116 67 Q143 64 153 87 Q159 112 146 126 Q127 136 107 124 Q97 116 94 101 Z', [130, 99, 21, 25]);
        eye('M173 92 Q173 70 185 66 Q200 65 202 91 Q203 113 191 121 Q176 120 173 92 Z', [191, 93, 9, 21]);
      }
      if (mood === 'worried') {
        brow('M137 146 Q145 140 154 145 Q165 139 174 147');
      } else if (mood === 'surprise') {
        mouth('M149 139 Q157 132 163 139 Q170 152 163 158 Q154 161 149 151 Z', '#743c3e');
        node('path', { d: 'M152 154 Q158 148 165 154', fill: 'none', stroke: '#df858d', 'stroke-width': 2 }, g);
      } else if (mood === 'focus') {
        brow('M138 148 Q157 153 175 144');
      } else {
        mouth('M136 143 Q155 149 179 136 Q185 134 182 145 Q176 158 153 159 Q137 158 136 143 Z');
        node('path', { d: 'M166 141 L168 155 M175 139 L178 150', fill: 'none', stroke: '#17171a', 'stroke-width': 2 }, g);
      }
    }

    update(u, elapsed) {
      const dt = clamp(elapsed || 0, 0, .05);
      if (!dt) return;
      this.time += dt;
      const speed = Math.hypot(u.vx || 0, u.vy || 0);
      const moving = this.s.run.step(u.moving ? 1 : 0, dt, 135, 20);
      this.phase += dt * (8 + Math.min(speed, 145) * .055);
      const stride = Math.sin(this.phase), idle = Math.sin(this.time * 3);
      const action = u.animT > 0 ? u.animState : '';
      const progress = action ? 1 - clamp(u.animT / Math.max(.01, u.animDur || 1)) : 0;
      const style = u.animStyle || '';
      const wind = action === 'wind' ? pose(progress) : 0;
      const attack = action === 'attack' ? pose(progress) : 0;
      const cast = action === 'cast' || action === 'spin' ? pose(progress) : u.casting ? .65 : 0;
      const reel = cast && style === 'finnReel' ? cast : 0;
      const send = cast && style === 'finnSendBarnaby' ? cast : 0;
      const spill = cast && style === 'finnSpill' ? cast : 0;
      const bump = attack && style === 'finnBowlBump' ? attack : attack;
      if ((u.hitT || 0) > this.lastHit + .02) { this.s.recoil.v = -105; this.hurt = .34; }
      this.lastHit = u.hitT || 0;
      this.hurt = Math.max(0, this.hurt - dt);
      const recoil = this.s.recoil.step(0, dt);
      const s = this.s;
      const bob = s.bob.step(idle * .7 - Math.abs(stride) * moving * 4 - cast * 3 - bump * 2 + recoil, dt);
      const lean = s.lean.step(idle * .7 + stride * moving * 3 - wind * 7 + bump * 13 - reel * 8 + spill * 8 + recoil * .23, dt);
      const head = s.head.step(-idle * 1.6 - stride * moving * 2 + wind * 5 - bump * 8 + reel * 5 + send * 7 - spill * 8 + recoil * .24, dt);
      const armNear = s.armNear.step(-4 + idle * 2 + stride * moving * 22 + wind * 20 - bump * 76 - reel * 68 - send * 57 + spill * 20, dt, 210, 19);
      const elbowNear = s.elbowNear.step(-4 - stride * moving * 6 - bump * 32 - reel * 48 - send * 23 + spill * 18, dt, 175, 18);
      const armFar = s.armFar.step(idle * 1.6 - stride * moving * 18 - bump * 16 - reel * 28 - send * 62 + spill * 32, dt, 200, 18);
      const elbowFar = s.elbowFar.step(4 + stride * moving * 6 - reel * 17 - send * 24 + spill * 24, dt, 170, 17);
      const legNear = s.legNear.step(stride * moving * 25 - bump * 8 + spill * 8, dt);
      const legFar = s.legFar.step(-stride * moving * 25 + bump * 7 - spill * 6, dt);
      this.root.setAttribute('transform', `translate(0 ${bob.toFixed(2)})`);
      rotate(this.legFar, legFar, 144, 253); rotate(this.legNear, legNear, 118, 253);
      rotate(this.upper, lean, 129, 246);
      rotate(this.armFar, armFar, 155, 190); rotate(this.elbowFar, elbowFar, 163, 216);
      rotate(this.armNear, armNear, 100, 191); rotate(this.elbowNear, elbowNear, 77, 212);
      rotate(this.head, head, 126, 172);
      const beat = this.time % 5.8;
      const mood = u.visualSleep ? 'sleep' : this.hurt > 0 ? 'worried' :
        send > .2 ? 'wink' : reel > .2 ? 'focus' : spill > .2 ? 'surprise' :
        bump > .23 ? 'focus' : beat > 5.1 && beat < 5.28 && !moving ? 'wink' : 'smile';
      this.drawFace(mood);
    }
  }
  const enabled = () => { try { return !!Save.data.opt.animatedChars; } catch (_) { return true; } };
  return { enabled, create: host => new Rig(host) };
})();
