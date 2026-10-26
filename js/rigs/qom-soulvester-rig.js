/* Queens of Mischief Soulvester. The supplied render is cut into moving parts;
   shaded fills only complete joints that the standing image hides. */
'use strict';
const QOMSoulvesterRig = (() => {
  const NS = 'http://www.w3.org/2000/svg';
  const node = (tag, attrs = {}, parent) => {
    const el = document.createElementNS(NS, tag);
    for (const [key, value] of Object.entries(attrs)) el.setAttribute(key, value);
    if (parent) parent.appendChild(el);
    return el;
  };
  const clamp = (n, a = 0, b = 1) => Math.min(b, Math.max(a, n));
  const pulse = n => Math.sin(Math.PI * clamp(n));
  const rot = (part, degrees, x, y) => part.setAttribute('transform', `rotate(${degrees.toFixed(2)} ${x} ${y})`);
  let serial = 0;

  class Spring {
    constructor(x = 0) { this.x = x; this.v = 0; }
    step(target, dt, stiffness = 145, damping = 19) {
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
      this.blinkT = 2 + Math.random() * 2;
      this.mood = '';
      this.s = Object.fromEntries(['moving', 'bob', 'lean', 'head', 'plume', 'armNear', 'foreNear', 'armFar', 'foreFar',
        'legNear', 'legFar', 'recoil', 'sx', 'sy'].map(k => [k, new Spring(k === 'sx' || k === 'sy' ? 1 : 0)]));
      const id = `qom-soulvester-rig-${++serial}`;
      const svg = node('svg', { viewBox: '0 0 370 436', class: 'rig-svg', 'aria-hidden': 'true' }, host);
      const defs = node('defs', {}, svg);
      const src = (typeof ASSET === 'string' ? ASSET : './') + 'uploads/SoulvesterQOM.png';
      const cut = (name, d, parent) => {
        const cid = `${id}-${name}`;
        node('path', { d }, node('clipPath', { id: cid, clipPathUnits: 'userSpaceOnUse' }, defs));
        const g = node('g', {}, parent);
        node('image', { href: src, width: 370, height: 436, 'clip-path': `url(#${cid})` }, g);
        return g;
      };
      const grad = (name, stops) => {
        const g = node('linearGradient', { id: `${id}-${name}`, x1: '8%', y1: '0%', x2: '95%', y2: '100%' }, defs);
        stops.forEach(([offset, color]) => node('stop', { offset, 'stop-color': color }, g));
        return `url(#${id}-${name})`;
      };
      const glove = grad('glove', [[0, '#795390'], [.5, '#5d3676'], [1, '#3e2355']]);
      const sleeve = grad('sleeve', [[0, '#d834db'], [.55, '#b124ca'], [1, '#802291']]);
      const boot = grad('boot', [[0, '#754696'], [.55, '#5a2d80'], [1, '#401c60']]);

      this.root = node('g', {}, svg);
      this.body = node('g', {}, this.root);
      this.legFar = node('g', {}, this.body);
      node('path', { d: 'M218 326 Q235 319 246 335 L249 379 Q258 392 245 404 L222 404 Z', fill: boot }, this.legFar);
      cut('far-leg', 'M218 322 Q246 318 255 341 L255 383 Q256 404 234 407 L212 403 L210 350 Z', this.legFar);
      this.legNear = node('g', {}, this.body);
      node('path', { d: 'M191 322 Q213 316 229 333 L231 394 Q236 414 224 432 L194 432 L187 405 Z', fill: boot }, this.legNear);
      cut('near-leg', 'M184 321 Q212 313 236 333 L237 389 L240 436 L183 436 L183 375 Z', this.legNear);

      this.upper = node('g', {}, this.body);
      // Each arm has two pivots. The small fills sit underneath source pixels.
      this.armFar = node('g', {}, this.upper);
      node('path', { d: 'M243 290 Q257 289 266 306 L267 327 L250 335 L240 309 Z', fill: sleeve }, this.armFar);
      cut('far-arm-upper', 'M237 283 Q258 280 267 303 L268 328 L248 340 L238 319 Z', this.armFar);
      this.foreFar = node('g', {}, this.armFar);
      node('path', { d: 'M249 316 Q267 313 270 328 L269 347 Q258 358 244 342 Z', fill: glove }, this.foreFar);
      cut('far-arm-lower', 'M241 314 Q265 308 273 326 L273 352 L243 357 L235 332 Z', this.foreFar);
      this.armNear = node('g', {}, this.upper);
      node('path', { d: 'M180 282 Q197 282 205 301 L204 330 L171 332 L167 308 Z', fill: sleeve }, this.armNear);
      cut('near-arm-upper', 'M168 273 Q197 273 209 298 L209 337 L164 344 L160 306 Z', this.armNear);
      this.foreNear = node('g', {}, this.armNear);
      node('path', { d: 'M169 317 Q195 311 202 332 L203 365 Q197 379 174 379 L163 362 Z', fill: glove }, this.foreNear);
      cut('near-arm-lower', 'M159 314 Q193 310 205 329 L207 375 L163 384 L157 356 Z', this.foreNear);

      // Shirt print, collar, belt and necklace are all from the original art.
      cut('torso', 'M183 243 Q218 240 248 260 L260 298 L252 331 Q223 346 189 334 L169 316 L169 277 Z', this.upper);
      this.head = node('g', {}, this.upper);
      this.plume = cut('plume', 'M33 13 Q105 -1 165 20 Q181 43 179 87 L163 146 L118 164 Q67 121 32 132 Z', this.head);
      cut('helmet-face', 'M106 48 Q209 34 269 65 Q299 104 296 161 L275 207 L296 226 L289 255 L266 260 Q243 251 227 260 L182 276 Q140 251 100 226 Q74 207 79 151 Q82 84 106 48 Z', this.head);
      const eyeClip = `${id}-visor`;
      node('path', { d: 'M174 165 L280 151 L281 214 L181 233 Z' }, node('clipPath', { id: eyeClip }, defs));
      this.face = node('g', { 'clip-path': `url(#${eyeClip})` }, this.head);
      this.drawFace('neutral');
      // This little chain hangs from the original right gauntlet, not a new prop.
      this.chain = cut('chain', 'M231 330 Q263 315 287 325 L292 358 L274 383 L231 382 Z', this.foreFar);
    }

    drawFace(mood) {
      if (mood === this.mood) return;
      this.mood = mood;
      const g = this.face;
      g.replaceChildren();
      // Helmet and eyes stay rendered. Dark lids change their expression
      // within the original visor instead of repainting a new face.
      const dark = '#15111c';
      if (mood === 'blink' || mood === 'sleep') {
        node('path', { d: 'M184 177 Q212 165 242 172 L243 210 Q218 221 188 218 Z M251 166 Q268 158 279 161 L280 202 Q267 211 251 206 Z', fill: dark }, g);
        node('path', { d: 'M190 207 Q216 216 241 201 M252 199 Q265 204 276 192', fill: 'none', stroke: '#d6c9e5', 'stroke-width': 2.8, 'stroke-linecap': 'round' }, g);
      } else if (mood === 'focus' || mood === 'guard') {
        node('path', { d: mood === 'guard'
          ? 'M188 183 Q213 176 240 178 M253 172 Q267 167 276 169'
          : 'M187 180 Q213 174 242 176 M252 169 Q267 165 277 167',
          fill: 'none', stroke: dark, 'stroke-width': 4, 'stroke-linecap': 'round' }, g);
      } else if (mood === 'hurt') {
        node('path', { d: 'M189 189 Q213 186 239 182 M253 177 Q267 175 276 172', fill: 'none', stroke: dark, 'stroke-width': 4.2, 'stroke-linecap': 'round' }, g);
      }
    }

    update(u, elapsed) {
      const dt = clamp(elapsed || 0, 0, .05);
      if (!dt) return;
      this.time += dt;
      const s = this.s;
      const speed = Math.hypot(u.vx || 0, u.vy || 0);
      const moving = s.moving.step(u.moving ? 1 : 0, dt, 115, 18);
      this.phase += dt * (6.5 + Math.min(speed, 140) * .045);
      const stride = Math.sin(this.phase), idle = Math.sin(this.time * 2.1);
      const action = u.animT > 0 ? u.animState : '';
      const progress = action ? 1 - clamp(u.animT / Math.max(.01, u.animDur || 1)) : 0;
      const wind = action === 'wind' ? pulse(progress) : 0;
      const attack = action === 'attack' ? pulse(progress) : 0;
      const cast = action === 'cast' || action === 'spin' ? pulse(progress) : u.casting ? .6 : 0;
      const sleep = u.visualSleep ? 1 : 0;
      if ((u.hitT || 0) > this.lastHit + .02) { s.recoil.v = -75; this.hurt = .28; }
      this.lastHit = u.hitT || 0;
      this.hurt = Math.max(0, this.hurt - dt);
      const recoil = s.recoil.step(0, dt);
      const calm = (1 - moving) * (1 - attack) * (1 - cast) * (1 - wind) * (1 - sleep);
      const bob = s.bob.step(idle * 1.1 * calm - Math.abs(stride) * moving * 4 - wind * 4 - attack * 2 - sleep * 5 + recoil * .45, dt);
      const lean = s.lean.step(stride * moving * 2 - wind * 3 + attack * 5 + cast * -3 + sleep * 4 + recoil * .15, dt);
      const head = s.head.step(-idle * 1.2 * calm - stride * moving * 2 + wind * 3 - attack * 4 + sleep * 11, dt);
      const plume = s.plume.step(-head * .35 + idle * 1.5 * calm - stride * moving * 3 - attack * 4, dt, 65, 9);
      const armNear = s.armNear.step(stride * moving * 9 - wind * 10 - attack * 20 + cast * -14 + sleep * 5, dt);
      const foreNear = s.foreNear.step(-stride * moving * 4 - attack * 10 - cast * 7, dt);
      const armFar = s.armFar.step(-stride * moving * 8 + wind * 8 + attack * 16 + cast * 16 - sleep * 8, dt);
      const foreFar = s.foreFar.step(stride * moving * 4 + attack * 8 + cast * 8, dt);
      const legNear = s.legNear.step(stride * moving * 17 - attack * 5, dt);
      const legFar = s.legFar.step(-stride * moving * 17 + attack * 6, dt);
      const sx = s.sx.step(1 + wind * .025 - attack * .018 + moving * Math.abs(stride) * .01, dt);
      const sy = s.sy.step(1 - wind * .035 + attack * .025 - moving * Math.abs(stride) * .016, dt);
      this.root.setAttribute('transform', `translate(205 431) scale(${sx.toFixed(3)} ${sy.toFixed(3)}) translate(-205 -431)`);
      this.body.setAttribute('transform', `translate(0 ${bob.toFixed(2)})`);
      rot(this.legFar, legFar, 231, 337);
      rot(this.legNear, legNear, 211, 337);
      rot(this.upper, lean, 216, 327);
      rot(this.armFar, armFar, 250, 298);
      rot(this.foreFar, foreFar, 255, 328);
      rot(this.armNear, armNear, 185, 293);
      rot(this.foreNear, foreNear, 182, 330);
      rot(this.head, head, 207, 252);
      rot(this.plume, plume, 143, 90);
      this.blinkT -= dt;
      const blinking = this.blinkT < 0 && this.blinkT > -.1;
      if (this.blinkT < -.1) this.blinkT = 2.5 + Math.random() * 2.8;
      const mood = sleep ? 'sleep' : this.hurt > 0 ? 'hurt' : cast > .15 ? 'guard' : attack > .13 || wind > .2 ? 'focus' : blinking ? 'blink' : 'neutral';
      this.drawFace(mood);
    }
  }
  const enabled = () => { try { return !!Save.data.opt.animatedChars; } catch (_) { return true; } };
  return { enabled, create: host => new Rig(host) };
})();
