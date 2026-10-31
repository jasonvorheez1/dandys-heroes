/* Soulvester's battle puppet. The original render supplies the visible art;
   narrow joint fills only complete parts hidden behind the standing pose. */
'use strict';
const SoulvesterRig = (() => {
  const NS = 'http://www.w3.org/2000/svg';
  const node = (tag, attrs = {}, parent) => {
    const el = document.createElementNS(NS, tag);
    for (const [key, value] of Object.entries(attrs)) el.setAttribute(key, value);
    if (parent) parent.appendChild(el);
    return el;
  };
  const clamp = (n, a = 0, b = 1) => Math.min(b, Math.max(a, n));
  const pose = n => Math.sin(Math.PI * clamp(n));
  const rot = (part, a, x, y) => part.setAttribute('transform', `rotate(${a.toFixed(2)} ${x} ${y})`);
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
      this.time = Math.random() * 6;
      this.phase = 0;
      this.hurt = 0;
      this.lastHit = 0;
      this.mood = '';
      this.blinkT = 2 + Math.random() * 2;
      this.s = Object.fromEntries(['run', 'bob', 'lean', 'head', 'swordArm', 'swordElbow', 'swordWrist', 'hipArm', 'hipElbow',
        'legNear', 'legFar', 'recoil', 'sx', 'sy', 'fx', 'tail', 'tip'].map(k => [k, new Spring()]));
      this.s.sx.x = 1; this.s.sy.x = 1;
      const id = this.id = `soulv-rig-${++serial}`;
      const svg = node('svg', { viewBox: '0 0 214 313', class: 'rig-svg', 'aria-hidden': 'true' }, host);
      const defs = node('defs', {}, svg);
      const src = (typeof ASSET === 'string' ? ASSET : './') + 'assets/toon-art/Soulvester/Soulvester.png';
      const sword = (typeof ASSET === 'string' ? ASSET : './') + 'assets/uploads/image-31.png';
      const cut = (name, d, parent) => {
        const cid = `${id}-${name}`;
        node('path', { d }, node('clipPath', { id: cid, clipPathUnits: 'userSpaceOnUse' }, defs));
        const g = node('g', {}, parent);
        node('image', { href: src, width: 214, height: 313, 'clip-path': `url(#${cid})` }, g);
        return g;
      };
      const fill = (name, stops) => {
        const g = node('linearGradient', { id: `${id}-${name}`, x1: '0%', y1: '0%', x2: '100%', y2: '100%' }, defs);
        stops.forEach(([offset, color]) => node('stop', { offset, 'stop-color': color }, g));
        return `url(#${id}-${name})`;
      };
      const mint = fill('mint', [[0, '#a7e7d2'], [.55, '#83ccb5'], [1, '#5a9f88']]);
      const armor = fill('armor', [[0, '#27282a'], [.6, '#191a1b'], [1, '#0e0f10']]);
      this.root = node('g', {}, svg);
      this.body = node('g', {}, this.root);

      // The ponytail and both legs stay pixel-identical to the source at rest.
      this.tail = node('g', {}, this.body);
      cut('tail-base', 'M25 14 Q62 4 103 15 L103 52 Q77 72 77 104 L63 123 Q23 83 23 35 Z', this.tail);
      this.tip = cut('tail-tip', 'M51 86 Q70 95 80 126 L76 150 Q63 126 53 109 Z', this.tail);
      this.legFar = node('g', {}, this.body);
      node('path', { d: 'M144 247 Q156 245 161 254 L158 274 Q168 281 164 293 L155 297 L140 292 Z', fill: armor }, this.legFar);
      cut('leg-far', 'M144 246 Q160 240 167 256 L160 273 Q167 281 166 294 Q157 302 140 299 L137 268 Z', this.legFar);
      this.legNear = node('g', {}, this.body);
      node('path', { d: 'M118 243 Q131 239 143 249 L142 279 L139 309 L112 309 Z', fill: armor }, this.legNear);
      cut('leg-near', 'M113 243 Q129 238 145 248 L143 281 L143 313 L109 313 L108 269 Z', this.legNear);

      this.upper = node('g', {}, this.body);
      // Hidden shoulders and elbows are completed underneath the original pixels.
      const arm = (name, upperD, lowerD, upperFill, lowerFill, sx, sy, ex, ey) => {
        const shoulder = node('g', {}, this.upper);
        node('path', { d: upperFill, fill: name === 'sword' ? mint : armor }, shoulder);
        cut(`${name}-upper`, upperD, shoulder);
        const elbowRot = node('g', {}, shoulder);
        node('path', { d: lowerFill, fill: armor }, elbowRot);
        cut(`${name}-lower`, lowerD, elbowRot);
        return { shoulder, elbowRot, sx, sy, ex, ey };
      };
      this.hipArm = arm('hip',
        'M151 191 Q166 187 171 207 L177 226 L167 233 L149 212 Z',
        'M156 216 Q172 210 177 226 Q185 242 174 253 L153 250 Z',
        'M153 194 Q163 190 168 206 L169 220 L157 224 Z',
        'M160 220 Q174 216 177 232 L175 246 L161 248 Z', 156, 200, 162, 221);
      this.swordArm = arm('sword',
        'M104 176 Q119 175 121 194 L113 225 L91 220 Z',
        'M91 210 Q107 213 117 220 L119 263 L94 269 L91 246 Z',
        'M105 181 Q116 179 118 195 L110 222 L93 218 Z',
        'M94 216 Q109 212 116 225 L117 260 L95 262 Z', 108, 187, 104, 219);
      cut('torso', 'M109 152 Q135 152 158 163 L166 196 L155 222 L154 252 Q134 261 115 252 L116 228 L108 208 L103 178 Z', this.upper);
      this.head = node('g', {}, this.upper);
      cut('head', 'M102 38 Q145 25 179 40 L198 99 L183 122 Q180 146 154 158 L142 175 L104 180 L100 164 Q67 153 59 126 Q46 96 61 72 Q77 46 102 38 Z', this.head);
      this.face = node('g', {}, this.head);
      this.drawFace('neutral');
      // The sword is layered above the torso only during its short action.
      // Its nested pivots match the cutout arm, keeping the hilt in the fist.
      this.swordOverShoulder = node('g', {}, this.upper);
      this.swordOverElbow = node('g', {}, this.swordOverShoulder);
      this.wrist = node('g', {}, this.swordOverElbow);
      node('image', { href: sword, width: 91, height: 91, x: 86, y: 178 }, this.wrist);
      this.swordOverShoulder.style.display = 'none';
    }

    drawFace(mood) {
      if (mood === this.mood) return;
      this.mood = mood;
      const g = this.face;
      g.replaceChildren();
      // Keep the original eyes and visor. Small dark lids follow the existing
      // white eye contours; no replacement face or invented eye geometry.
      const dark = '#0c0d0e';
      const lid = (d) => node('path', { d, fill: dark }, g);
      if (mood === 'sleep' || mood === 'blink') {
        lid('M111 99 Q127 94 148 99 L149 126 Q134 135 115 123 Z');
        lid('M157 99 Q169 94 180 96 L179 126 Q169 132 157 123 Z');
        node('path', { d: 'M114 121 Q132 129 148 119 M157 120 Q169 127 178 118', fill: 'none', stroke: '#d1d2d0', 'stroke-width': 2.3, 'stroke-linecap': 'round' }, g);
      } else if (mood === 'smug' || mood === 'focus' || mood === 'angry') {
        const depth = mood === 'smug' ? 8 : mood === 'angry' ? 11 : 6;
        lid(`M110 99 Q129 95 150 100 L150 ${100 + depth} Q131 ${106 + depth} 111 ${101 + depth} Z`);
        lid(`M157 98 Q170 94 180 97 L180 ${99 + depth} Q168 ${104 + depth} 157 ${100 + depth} Z`);
      } else if (mood === 'hurt') {
        node('path', { d: 'M117 105 L141 126 M141 105 L117 126 M160 106 L177 124 M176 105 L160 125', fill: 'none', stroke: '#e7e7e4', 'stroke-width': 2.7, 'stroke-linecap': 'round' }, g);
      }
    }

    update(u, elapsed) {
      const dt = clamp(elapsed || 0, 0, .05);
      if (!dt) return;
      this.time += dt;
      const s = this.s;
      const speed = Math.hypot(u.vx || 0, u.vy || 0);
      const moving = s.run.step(u.moving ? 1 : 0, dt, 135, 20);
      this.phase += dt * (7 + Math.min(speed, 145) * .05);
      const stride = Math.sin(this.phase), idle = Math.sin(this.time * 2.2), step = Math.abs(stride);
      const action = u.animT > 0 ? u.animState : '';
      const progress = action ? 1 - clamp(u.animT / Math.max(.01, u.animDur || 1)) : 0;
      const wind = action === 'wind' ? pose(progress) : 0;
      const attack = action === 'attack' ? pose(progress) : 0;
      const cast = action === 'cast' || action === 'spin' ? pose(progress) : u.casting ? .7 : 0;
      const sleep = u.visualSleep ? 1 : 0;
      if ((u.hitT || 0) > this.lastHit + .02) { s.recoil.v = -120; this.hurt = .38; s.tail.v += 220; s.sy.v -= 3; }
      this.lastHit = u.hitT || 0;
      this.hurt = Math.max(0, this.hurt - dt);
      const recoil = s.recoil.step(0, dt);

      // idle personality: a slow breath, then now and then a proud chest-out clank
      const beat = this.time % 7.5, proud = beat > 6.2 ? pose((beat - 6.2) / 1.0) : 0;
      const calm = (1 - moving) * (1 - attack) * (1 - cast) * (1 - wind) * (1 - sleep);

      const bob = s.bob.step(idle * .8 * calm - step * moving * 5 - cast * 2 - wind * 8 - sleep * 7 + recoil * .8 - proud * 2, dt);
      const lean = s.lean.step(stride * moving * 3.5 - wind * 8 + attack * 15 + cast * -2 + sleep * 5 + recoil * .22 - proud * 2, dt);
      const head = s.head.step(-idle * 1.2 * calm - stride * moving * 3 + wind * 7 - attack * 9 + sleep * 22 + proud * -4 + recoil * .26, dt);
      const swordShoulder = s.swordArm.step(idle * 1.5 * calm - stride * moving * 15 + wind * 12 - attack * 32 + cast * -26 + proud * 6 + sleep * 4, dt, 210, 17);
      const swordElbow = s.swordElbow.step(-moving * 6 - attack * 20 - cast * 24 - wind * 14, dt, 175, 16);
      const swordWrist = s.swordWrist.step(0 + moving * stride * -8 + wind * -18 + attack * 38 - cast * 20, dt, 150, 14);
      const hipShoulder = s.hipArm.step(idle * 1.4 * calm + stride * moving * 12 + attack * -25 + cast * -29 + proud * 8 + sleep * -15 + recoil * .2, dt, 190, 16);
      const hipElbow = s.hipElbow.step(-moving * 12 + attack * -10 - cast * 4 - sleep * 18 - proud * 6, dt, 175, 16);
      const legNear = s.legNear.step(stride * moving * 26 - attack * 8 + wind * 5, dt);
      const legFar = s.legFar.step(-stride * moving * 26 + attack * 12 - wind * 4, dt);
      // squash and stretch about the feet: crouch on wind-up, stretch on the strike, tiny stomp on each step
      const sy = s.sy.step(1 - wind * .08 + attack * .05 + cast * .04 - step * moving * .03 + idle * .008 * calm - Math.abs(recoil) * .004, dt, 180, 13);
      const sx = s.sx.step(1 + wind * .06 - attack * .04 - cast * .03 + step * moving * .02 - idle * .006 * calm, dt, 180, 13);
      const fx = s.fx.step(attack * 7 - wind * 4 + recoil * .12 + (cast ? Math.sin(this.time * 55) * 1.1 : 0), dt, 200, 17);

      this.root.setAttribute('transform', `translate(${(130 + fx).toFixed(2)} 309) scale(${sx.toFixed(3)} ${sy.toFixed(3)}) translate(-130 -309)`);
      this.body.setAttribute('transform', `translate(0 ${bob.toFixed(2)})`);
      const lift = v => Math.max(0, v) * 4 * moving;
      this.legFar.setAttribute('transform', `translate(0 ${(-lift(-stride)).toFixed(2)}) rotate(${legFar.toFixed(2)} 154 250)`);
      this.legNear.setAttribute('transform', `translate(0 ${(-lift(stride)).toFixed(2)}) rotate(${legNear.toFixed(2)} 126 250)`);
      rot(this.upper, lean, 133, 247);
      rot(this.swordArm.shoulder, swordShoulder, 108, 187);
      rot(this.swordArm.elbowRot, swordElbow, 104, 219);
      rot(this.swordOverShoulder, swordShoulder, 108, 187);
      rot(this.swordOverElbow, swordElbow, 104, 219);
      rot(this.wrist, swordWrist, 112, 247);
      this.swordOverShoulder.style.display = attack > .08 || cast > .08 || wind > .08 ? '' : 'none';
      rot(this.hipArm.shoulder, hipShoulder, 156, 200);
      rot(this.hipArm.elbowRot, hipElbow, 162, 221);
      rot(this.head, head, 128, 158);
      // ponytail trails the head: springy base, looser tip
      const wag = -head * .4 - lean * .2 + (-fx * .4) + idle * 1.7 * calm + stride * moving * 3 - attack * 5 + wind * 4 + sleep * 10;
      rot(this.tail, s.tail.step(wag, dt, 70, 5.5), 82, 55);
      rot(this.tip, s.tip.step(s.tail.x * -.5 + Math.sin(this.time * 3.1) * 3 * (1 - sleep), dt, 55, 4.5), 65, 103);

      // Blink and expression overlays move with the original helmet.
      this.blinkT -= dt;
      const blinking = this.blinkT < 0 && this.blinkT > -.11;
      if (this.blinkT < -.11) this.blinkT = 2.4 + Math.random() * 3;
      const base = sleep ? 'sleep' : this.hurt > 0 ? 'hurt' : cast > .2 ? 'angry' : attack > .12 ? 'focus' :
        wind > .2 ? 'angry' : proud > .4 ? 'smug' : moving > .5 ? 'neutral' : (this.time % 11 > 8.6 ? 'smug' : 'neutral');
      const mood = blinking && (base === 'neutral' || base === 'smug') ? 'blink' : base;
      this.drawFace(mood);
    }
  }
  const enabled = () => { try { return !!Save.data.opt.animatedChars; } catch (_) { return true; } };
  return { enabled, create: host => new Rig(host) };
})();
