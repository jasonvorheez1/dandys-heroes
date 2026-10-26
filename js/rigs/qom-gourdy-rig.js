/* QOM Gourdy stays seated at the original drum kit. Every visible piece is
   clipped from the supplied render; shaded vine fills bridge hidden joints. */
'use strict';
const QOMGourdyRig = (() => {
  const NS = 'http://www.w3.org/2000/svg';
  const node = (tag, attrs = {}, parent) => {
    const el = document.createElementNS(NS, tag);
    for (const [key, value] of Object.entries(attrs)) el.setAttribute(key, value);
    if (parent) parent.appendChild(el);
    return el;
  };
  const clamp = (n, a = 0, b = 1) => Math.min(b, Math.max(a, n));
  const rot = (el, angle, x, y) => el.setAttribute('transform', `rotate(${angle.toFixed(2)} ${x} ${y})`);
  let serial = 0;

  class Spring {
    constructor(x = 0) { this.x = x; this.v = 0; }
    step(target, dt, k = 160, damping = 19) {
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
      this.time = Math.random() * 4;
      this.hurt = 0;
      this.lastHit = 0;
      this.lastBeat = 0;
      this.beatAccent = 0;
      this.blinkT = 2 + Math.random() * 2.5;
      this.mood = '';
      this.s = Object.fromEntries(['body', 'head', 'tail', 'armNear', 'wristNear', 'armFar', 'wristFar',
        'legNear', 'legFar', 'cymbalTop', 'cymbalFront', 'recoil', 'sx', 'sy'].map(k => [k, new Spring(k === 'sx' || k === 'sy' ? 1 : 0)]));
      const id = `qom-gourdy-rig-${++serial}`;
      const svg = node('svg', { viewBox: '0 0 578 432', class: 'rig-svg', 'aria-hidden': 'true' }, host);
      const defs = node('defs', {}, svg);
      const src = (typeof ASSET === 'string' ? ASSET : './') + 'uploads/gourdyQOM.png';
      const cut = (name, d, parent) => {
        const cid = `${id}-${name}`;
        node('path', { d, 'clip-rule': 'evenodd' }, node('clipPath', { id: cid, clipPathUnits: 'userSpaceOnUse' }, defs));
        const g = node('g', {}, parent);
        node('image', { href: src, width: 578, height: 432, 'clip-path': `url(#${cid})` }, g);
        return g;
      };
      const grad = (name, stops) => {
        const g = node('linearGradient', { id: `${id}-${name}`, x1: '5%', y1: '0%', x2: '90%', y2: '100%' }, defs);
        stops.forEach(([offset, color]) => node('stop', { offset, 'stop-color': color }, g));
        return `url(#${id}-${name})`;
      };
      const green = grad('green', [[0, '#79ac57'], [.55, '#3f773b'], [1, '#254c2d']]);
      const purple = grad('purple', [[0, '#b01bc3'], [.58, '#871090'], [1, '#571064']]);
      this.root = node('g', {}, svg);

      // The seat and kit are anchored to the scene. They never leave Gourdy.
      this.stool = node('g', {}, this.root);
      cut('stool', 'M129 292 Q161 281 201 294 L201 317 L192 324 L194 393 L179 393 L176 332 L151 329 L148 379 L129 379 L132 315 Z', this.stool);
      this.kitBack = node('g', {}, this.root);
      cut('bass', 'M351 226 Q407 220 479 226 L492 254 L492 370 L481 425 L461 424 L461 377 L369 377 L369 416 L355 416 Z', this.kitBack);
      cut('rear-toms', 'M319 162 Q378 154 418 163 L448 178 L455 244 L431 257 L354 256 L315 229 Z', this.kitBack);

      this.player = node('g', {}, this.root);
      this.tail = cut('tail', 'M40 244 Q77 237 102 271 Q122 302 149 297 L153 314 Q109 313 74 285 L41 265 Z', this.player);
      this.legFar = node('g', {}, this.player);
      node('path', { d: 'M181 276 Q205 268 223 295 L252 325 Q263 343 247 351 L220 347 L190 326 Z', fill: green }, this.legFar);
      cut('far-leg', 'M173 273 Q210 270 234 295 L268 328 L271 349 L220 353 L184 334 Z', this.legFar);
      this.legNear = node('g', {}, this.player);
      node('path', { d: 'M168 279 Q189 272 209 296 L222 341 L232 363 Q217 382 193 375 L174 340 Z', fill: green }, this.legNear);
      cut('near-leg', 'M158 275 Q197 268 223 295 L236 339 L242 376 L184 385 L162 351 Z', this.legNear);
      this.torso = node('g', {}, this.player);
      cut('body', 'M153 205 Q205 203 253 222 L271 251 L263 297 Q216 311 165 298 L144 270 Z M213 239 L252 163 L272 163 L235 246 Z M252 242 L284 159 L303 159 L267 250 Z', this.torso);

      // Arm segments stay underneath their original mitten and drumstick art.
      this.armFar = node('g', {}, this.torso);
      node('path', { d: 'M211 217 Q240 210 255 231 L262 253 L240 264 L212 242 Z', fill: green }, this.armFar);
      cut('far-upper-arm', 'M207 217 Q229 211 246 221 L250 242 L237 256 L207 247 Z', this.armFar);
      this.wristFar = node('g', {}, this.armFar);
      node('path', { d: 'M240 229 Q267 218 278 238 L275 257 L247 264 Z', fill: purple }, this.wristFar);
      cut('far-mitten-stick', 'M245 226 Q255 218 259 218 L286 169 Q290 158 299 159 Q304 166 296 175 L272 230 Q289 241 277 257 L242 260 L231 243 Z', this.wristFar);
      this.armNear = node('g', {}, this.torso);
      node('path', { d: 'M174 221 Q200 215 221 235 L228 258 L203 279 L175 256 Z', fill: green }, this.armNear);
      cut('near-upper-arm', 'M165 222 Q195 216 219 232 L224 252 L195 280 L163 265 Z', this.armNear);
      this.wristNear = node('g', {}, this.armNear);
      node('path', { d: 'M203 232 Q228 221 246 244 L251 270 L215 280 L198 258 Z', fill: purple }, this.wristNear);
      cut('near-mitten-stick', 'M208 225 Q219 218 223 217 L254 169 Q258 159 268 163 Q274 168 267 177 L242 232 Q264 241 259 265 L235 284 L206 272 L195 248 Z', this.wristNear);

      this.head = node('g', {}, this.torso);
      cut('head', 'M151 26 Q208 25 264 58 L275 101 L277 153 L268 188 Q268 212 237 227 L186 233 Q130 224 95 192 Q76 171 87 119 Q94 68 151 26 Z M213 237 L253 163 L272 163 L236 246 Z M251 241 L284 159 L303 159 L267 249 Z', this.head);
      // The rendered white pupil stays the default expression.
      this.face = node('g', {}, this.head);
      this.drawFace('original');

      // Front instruments occlude his lap as they do in the supplied render.
      this.kitFront = node('g', {}, this.root);
      cut('snare', 'M250 240 Q298 233 344 245 L359 265 L358 305 L343 312 L268 311 L251 293 Z', this.kitFront);
      cut('snare-stand', 'M283 298 L356 298 L358 431 L269 431 Z', this.kitFront);
      cut('tom-front', 'M347 174 Q395 168 445 176 L452 203 L453 253 L426 261 L351 254 Z', this.kitFront);
      this.cymbalTop = cut('cymbal-top', 'M318 132 Q371 125 421 136 L422 152 L319 153 Z', this.root);
      this.cymbalFront = cut('cymbal-front', 'M258 201 Q317 194 386 207 L389 226 L261 228 Z', this.root);
      cut('cymbal-hardware', 'M316 224 L337 224 L337 430 L273 431 L269 407 L301 371 L313 273 Z', this.root);
    }

    drawFace(mood) {
      if (mood === this.mood) return;
      this.mood = mood;
      const g = this.face;
      g.replaceChildren();
      if (mood === 'original') return;
      const dark = '#080909', light = '#eeeae8';
      // Only the pupil changes; the rendered eye ring, head and sunglasses do not.
      node('ellipse', { cx: 216, cy: 150, rx: 21, ry: 25, fill: dark }, g);
      if (mood === 'smile') {
        node('path', { d: 'M199 153 Q215 178 232 152', fill: 'none', stroke: light, 'stroke-width': 4.5, 'stroke-linecap': 'round' }, g);
      } else if (mood === 'focus') {
        node('ellipse', { cx: 217, cy: 155, rx: 14, ry: 15, fill: light }, g);
        node('path', { d: 'M194 133 Q214 126 237 134', fill: 'none', stroke: dark, 'stroke-width': 5 }, g);
      } else if (mood === 'surprise') {
        node('ellipse', { cx: 216, cy: 151, rx: 12, ry: 17, fill: light }, g);
      } else if (mood === 'blink' || mood === 'sleep') {
        node('path', { d: 'M199 154 Q216 161 232 150', fill: 'none', stroke: light, 'stroke-width': 3.2, 'stroke-linecap': 'round' }, g);
      }
    }

    update(u, elapsed) {
      const dt = clamp(elapsed || 0, 0, .05);
      if (!dt) return;
      this.time += dt;
      const s = this.s;
      const action = u.animT > 0 ? u.animState : '';
      const progress = action ? 1 - clamp(u.animT / Math.max(.01, u.animDur || 1)) : 0;
      const active = action === 'cast' || action === 'spin' ? Math.sin(Math.PI * progress) : action === 'attack' ? Math.sin(Math.PI * progress) * .65 : 0;
      const sleep = u.visualSleep ? 1 : 0;
      if ((u.hitT || 0) > this.lastHit + .02) { s.recoil.v = -75; this.hurt = .24; }
      this.lastHit = u.hitT || 0;
      this.hurt = Math.max(0, this.hurt - dt);
      if (u._qomBeat && u._qomBeat !== this.lastBeat) {
        this.lastBeat = u._qomBeat;
        this.beatAccent = u._qomBeat === 4 ? 1 : .55;
      }
      this.beatAccent = Math.max(0, this.beatAccent - dt * 3.8);
      const rhythm = this.time * (active > .15 ? 17 : 10);
      const leftHit = (1 - Math.cos(rhythm)) * .5;
      const rightHit = (1 + Math.cos(rhythm)) * .5;
      const accent = this.beatAccent;
      const recoil = s.recoil.step(0, dt);
      const body = s.body.step(Math.sin(rhythm * .5) * 1.3 - (leftHit + rightHit) * .45 - accent * 2 + recoil * .35, dt);
      const head = s.head.step(Math.sin(rhythm * .5 - .5) * 1.7 + accent * 2 - sleep * 7, dt);
      const armNear = s.armNear.step(-leftHit * (7 + active * 5) - accent * 4, dt);
      const wristNear = s.wristNear.step(leftHit * (15 + active * 8) + accent * 6, dt, 200, 18);
      const armFar = s.armFar.step(rightHit * (6 + active * 5) + accent * 3, dt);
      const wristFar = s.wristFar.step(-rightHit * (14 + active * 8) - accent * 6, dt, 200, 18);
      const legNear = s.legNear.step(leftHit * 2.5, dt);
      const legFar = s.legFar.step(rightHit * 2.5, dt);
      const tail = s.tail.step(Math.sin(rhythm * .5 - 1) * 3 + accent * 2, dt, 90, 12);
      const cymbalTop = s.cymbalTop.step(-accent * 4 + Math.sin(this.time * 23) * accent * 1.5, dt, 90, 13);
      const cymbalFront = s.cymbalFront.step((leftHit - rightHit) * 1.5 + accent * 3, dt, 90, 13);
      const sx = s.sx.step(1 + accent * .012, dt);
      const sy = s.sy.step(1 - accent * .015, dt);
      this.player.setAttribute('transform', `translate(0 ${body.toFixed(2)})`);
      this.torso.setAttribute('transform', `rotate(${(Math.sin(rhythm * .5) * .9).toFixed(2)} 194 286)`);
      rot(this.tail, tail, 130, 295);
      rot(this.legFar, legFar, 195, 296); rot(this.legNear, legNear, 180, 300);
      rot(this.armFar, armFar, 218, 228); rot(this.wristFar, wristFar, 255, 238);
      rot(this.armNear, armNear, 180, 233); rot(this.wristNear, wristNear, 223, 250);
      rot(this.head, head, 196, 222);
      rot(this.cymbalTop, cymbalTop, 369, 142);
      rot(this.cymbalFront, cymbalFront, 323, 215);
      this.blinkT -= dt;
      const blinking = this.blinkT < 0 && this.blinkT > -.1;
      if (this.blinkT < -.1) this.blinkT = 2.2 + Math.random() * 3;
      const mood = sleep ? 'sleep' : this.hurt > 0 ? 'surprise' : active > .5 || accent > .65 ? 'focus' : blinking ? 'blink' : Math.sin(this.time * 1.15) > .91 ? 'smile' : 'original';
      this.drawFace(mood);
      // A concert always stays a seated performance, including action frames.
      this.root.setAttribute('transform', `translate(289 431) scale(${sx.toFixed(3)} ${sy.toFixed(3)}) translate(-289 -431)`);
    }
  }
  const enabled = () => { try { return !!Save.data.opt.animatedChars; } catch (_) { return true; } };
  return { enabled, create: host => new Rig(host) };
})();
