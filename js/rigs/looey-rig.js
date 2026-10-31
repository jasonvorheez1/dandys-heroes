/* Looey's battle cutout. Source pixels provide the balloon ears, face, shirt,
   tail and feet; painted joint fills keep the flexible limbs connected. */
'use strict';
const LooeyRig = (() => {
  const NS = 'http://www.w3.org/2000/svg';
  const node = (tag, attrs = {}, parent) => {
    const el = document.createElementNS(NS, tag);
    for (const [key, value] of Object.entries(attrs)) el.setAttribute(key, value);
    if (parent) parent.appendChild(el);
    return el;
  };
  const clamp = (n, a = 0, b = 1) => Math.max(a, Math.min(b, n));
  const pulse = n => Math.sin(Math.PI * clamp(n));
  const rot = (el, angle, x, y) => el.setAttribute('transform', `rotate(${angle.toFixed(2)} ${x} ${y})`);
  let serial = 0;

  class Spring {
    constructor() { this.x = 0; this.v = 0; }
    step(target, dt, stiffness = 155, damping = 18) {
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
      this.time = Math.random() * 5;
      this.phase = 0;
      this.lastHit = 0;
      this.hurt = 0;
      this.mood = '';
      this.s = Object.fromEntries(['run', 'bounce', 'lean', 'head', 'earGreen', 'earPurple', 'tail', 'armPurple', 'forePurple', 'armGreen', 'foreGreen', 'legGreen', 'legPurple', 'recoil'].map(k => [k, new Spring()]));
      const id = this.id = `looey-rig-${++serial}`;
      const svg = node('svg', { viewBox: '0 0 291 459', class: 'rig-svg', 'aria-hidden': 'true' }, host);
      const defs = node('defs', {}, svg);
      const src = (typeof ASSET === 'string' ? ASSET : './') + 'assets/toon-art/Looey/Looey.png';
      const cut = (name, d, parent) => {
        const cid = `${id}-${name}`;
        node('path', { d }, node('clipPath', { id: cid, clipPathUnits: 'userSpaceOnUse' }, defs));
        const g = node('g', {}, parent);
        node('image', { href: src, width: 291, height: 459, 'clip-path': `url(#${cid})` }, g);
        return g;
      };
      const fill = (name, stops) => {
        const g = node('linearGradient', { id: `${id}-${name}`, x1: '0%', y1: '0%', x2: '100%', y2: '100%' }, defs);
        stops.forEach(([offset, color]) => node('stop', { offset, 'stop-color': color }, g));
        return `url(#${id}-${name})`;
      };
      const green = fill('green', [[0, '#8ed85e'], [.52, '#55b645'], [1, '#29983b']]);
      const purple = fill('purple', [[0, '#be63d4'], [.55, '#9941bc'], [1, '#753197']]);
      this.root = node('g', {}, svg);
      this.tail = cut('tail', 'M65 238 Q81 233 101 250 Q124 268 135 305 L119 319 Q91 303 72 275 Z', this.root);
      this.legPurple = node('g', {}, this.root);
      node('path', { d: 'M155 338 Q174 333 177 356 L182 426 Q184 445 169 446 L156 432 Z', fill: purple }, this.legPurple);
      cut('leg-purple', 'M149 336 Q173 332 182 349 L190 427 Q191 445 179 448 L156 448 L151 412 Z', this.legPurple);
      this.legGreen = node('g', {}, this.root);
      node('path', { d: 'M131 339 Q150 331 159 350 L162 424 L152 451 L127 445 Z', fill: green }, this.legGreen);
      cut('leg-green', 'M127 337 Q149 331 161 349 L162 415 Q168 445 151 453 L125 452 L125 408 Z', this.legGreen);
      this.upper = node('g', {}, this.root);

      this.armGreen = node('g', {}, this.upper);
      node('path', { d: 'M176 307 Q188 309 194 325 L202 348 L188 354 L176 332 Z', fill: green }, this.armGreen);
      cut('green-upper', 'M171 306 Q189 305 196 323 L203 353 L184 359 L176 332 Z', this.armGreen);
      this.foreGreen = node('g', {}, this.armGreen);
      node('path', { d: 'M189 343 Q205 336 210 357 Q216 377 202 381 Q189 382 185 365 Z', fill: green }, this.foreGreen);
      cut('green-lower', 'M181 338 Q203 336 211 357 Q218 378 203 385 L183 378 L179 355 Z', this.foreGreen);
      this.armPurple = node('g', {}, this.upper);
      node('path', { d: 'M119 278 Q135 276 139 296 L136 335 L113 339 L109 302 Z', fill: purple }, this.armPurple);
      cut('purple-upper', 'M112 273 Q137 270 144 288 L140 341 L111 347 L104 310 Z', this.armPurple);
      this.forePurple = node('g', {}, this.armPurple);
      node('path', { d: 'M111 327 Q135 321 140 343 L143 377 Q140 395 121 396 Q104 393 104 375 Z', fill: purple }, this.forePurple);
      cut('purple-lower', 'M105 319 Q133 315 145 339 L146 378 Q143 397 121 402 L101 392 L101 340 Z', this.forePurple);

      // The shirt, spots, collar, and belly remain the actual supplied pixels.
      cut('torso', 'M124 257 Q148 255 180 259 L189 279 L185 315 Q179 350 163 357 L133 356 Q115 342 117 313 L119 278 Z', this.upper);
      this.head = node('g', {}, this.upper);
      this.earGreen = cut('ear-green', 'M47 24 Q64 18 82 32 Q106 39 116 90 L119 136 L91 139 Q48 110 45 71 Z', this.head);
      this.earPurple = cut('ear-purple', 'M157 42 Q181 37 200 51 Q219 70 220 100 L205 129 L179 137 L159 111 Z', this.head);
      cut('head', 'M67 128 Q91 96 140 98 Q188 94 213 125 Q231 153 226 206 Q221 248 189 265 Q149 279 110 265 Q75 241 70 204 Q64 159 67 128 Z', this.head);
      this.face = node('g', {}, this.head);
      this.drawFace('original');
    }

    drawFace(mood) {
      if (mood === this.mood) return;
      this.mood = mood;
      const g = this.face;
      g.replaceChildren();
      // Expressions add small marks to Looey's original face. Keep the
      // rendered eyes, cheek, mouth and head instead of repainting them.
      const line = (d, color = '#211a18', width = 2.6) => node('path', { d, fill: 'none', stroke: color, 'stroke-width': width, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, g);
      if (mood === 'smile' || mood === 'cheer') {
        line('M203 143 Q210 134 216 144');
        if (mood === 'cheer') line('M119 205 Q126 212 135 205', '#9b60ac', 2);
      } else if (mood === 'surprise') {
        line('M199 142 Q209 132 218 143', '#2a211d', 3.2);
        line('M127 150 Q136 139 147 145', '#2a211d', 2.4);
      } else if (mood === 'worry') {
        line('M200 143 Q207 135 216 147');
      } else if (mood === 'sleep') {
        // Gold lids match the face surface and retain the original outlines.
        node('path', { d: 'M140 175 Q143 151 160 150 Q182 150 190 175 Q191 194 180 204 Q158 213 146 199 Q140 190 140 175 Z', fill: '#c7ac68' }, g);
        node('path', { d: 'M199 177 Q201 153 211 152 Q225 153 226 178 Q225 201 215 205 Q201 202 199 177 Z', fill: '#cbb270' }, g);
        line('M145 183 Q164 198 186 183 M202 184 Q212 195 222 183', '#27201d', 3.3);
      }
    }

    update(u, elapsed) {
      const dt = clamp(elapsed || 0, 0, .05);
      if (!dt) return;
      this.time += dt;
      const s = this.s;
      const speed = Math.hypot(u.vx || 0, u.vy || 0);
      const moving = s.run.step(u.moving ? 1 : 0, dt, 120, 18);
      this.phase += dt * (9 + Math.min(speed, 150) * .055);
      const stride = Math.sin(this.phase), beat = Math.sin(this.time * 2.6);
      const action = u.animT > 0 ? u.animState : '';
      const progress = action ? 1 - clamp(u.animT / Math.max(.01, u.animDur || 1)) : 0;
      const style = u.animStyle || '';
      const wind = action === 'wind' ? pulse(progress) : 0;
      const attack = action === 'attack' ? pulse(progress) : 0;
      const cast = action === 'cast' || action === 'spin' ? pulse(progress) : u.casting ? .55 : 0;
      const inflate = style === 'looeyInflate' ? cast : 0;
      const show = style === 'looeyShow' ? cast : 0;
      const launch = attack;
      const crouch = style === 'looeyBounce' ? wind : 0;
      if ((u.hitT || 0) > this.lastHit + .02) { s.recoil.v = -145; this.hurt = .3; }
      this.lastHit = u.hitT || 0;
      this.hurt = Math.max(0, this.hurt - dt);
      const recoil = s.recoil.step(0, dt);
      const bounce = s.bounce.step(beat * 1.5 - Math.abs(stride) * moving * 8 + crouch * 6 - launch * 10 - show * 5 + recoil, dt);
      const lean = s.lean.step(beat * 1.1 + stride * moving * 5 - crouch * 10 + launch * 12 + show * 4 + recoil * .2, dt);
      const head = s.head.step(-beat * 1.6 - stride * moving * 3 + crouch * 6 - launch * 7 + show * 5 + recoil * .22, dt);
      const earGreen = s.earGreen.step(-beat * 3 - stride * moving * 13 + crouch * 12 - launch * 22 - show * 8, dt, 90, 12);
      const earPurple = s.earPurple.step(beat * 2 + stride * moving * 9 - crouch * 9 + launch * 15 + show * 11, dt, 95, 12);
      const tail = s.tail.step(beat * 3 - stride * moving * 10 - launch * 13 + show * 8, dt, 90, 12);
      const armPurple = s.armPurple.step(beat * 2 + stride * moving * 13 + crouch * 12 - launch * 27 + show * 27 + inflate * 12, dt, 190, 18);
      const forePurple = s.forePurple.step(-2 - stride * moving * 5 - launch * 9 + show * 9 + inflate * 8, dt, 165, 17);
      const armGreen = s.armGreen.step(-beat * 2 - stride * moving * 13 - crouch * 12 - launch * 29 - show * 28 - inflate * 10, dt, 185, 18);
      const foreGreen = s.foreGreen.step(2 + stride * moving * 5 - launch * 9 - show * 9 - inflate * 8, dt, 165, 17);
      const legGreen = s.legGreen.step(stride * moving * 28 + crouch * 7 - launch * 11, dt);
      const legPurple = s.legPurple.step(-stride * moving * 28 - crouch * 7 + launch * 11, dt);
      this.root.setAttribute('transform', `translate(0 ${bounce.toFixed(2)})`);
      rot(this.tail, tail, 126, 288);
      rot(this.legGreen, legGreen, 145, 349); rot(this.legPurple, legPurple, 168, 348);
      rot(this.upper, lean, 154, 343);
      rot(this.armGreen, armGreen, 179, 318); rot(this.foreGreen, foreGreen, 194, 349);
      rot(this.armPurple, armPurple, 126, 284); rot(this.forePurple, forePurple, 121, 333);
      rot(this.head, head, 151, 261);
      rot(this.earGreen, earGreen, 104, 124); rot(this.earPurple, earPurple, 184, 116);
      const idleBeat = this.time % 7.1;
      const mood = u.visualSleep ? 'sleep' : this.hurt > 0 ? 'worry' :
        inflate > .18 ? 'surprise' : show > .18 ? 'cheer' : launch > .23 ? 'cheer' :
        idleBeat > 5.8 && idleBeat < 6.65 && !moving ? 'smile' : 'original';
      this.drawFace(mood);
    }
  }
  const enabled = () => { try { return !!Save.data.opt.animatedChars; } catch (_) { return true; } };
  return { enabled, create: host => new Rig(host) };
})();
