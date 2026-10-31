/* QOM Connie keeps her original guitar, clothes, cap and ghost silhouette.
   Only covered shoulder and elbow joints receive matching shaded fills. */
'use strict';
const QOMConnieRig = (() => {
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
      this.hurt = 0;
      this.lastHit = 0;
      this.blinkT = 2 + Math.random() * 2.8;
      this.mood = '';
      this.s = Object.fromEntries(['float', 'body', 'head', 'hair', 'tail', 'guitar', 'armStrum', 'handStrum',
        'armFret', 'handFret', 'recoil', 'sx', 'sy'].map(k => [k, new Spring(k === 'sx' || k === 'sy' ? 1 : 0)]));
      const id = `qom-connie-rig-${++serial}`;
      const svg = node('svg', { viewBox: '0 0 432 578', class: 'rig-svg', 'aria-hidden': 'true' }, host);
      const defs = node('defs', {}, svg);
      const src = (typeof ASSET === 'string' ? ASSET : './') + 'assets/uploads/ConnieQOM.png';
      const cut = (name, d, parent) => {
        const cid = `${id}-${name}`;
        node('path', { d }, node('clipPath', { id: cid, clipPathUnits: 'userSpaceOnUse' }, defs));
        const g = node('g', {}, parent);
        node('image', { href: src, width: 432, height: 578, 'clip-path': `url(#${cid})` }, g);
        return g;
      };
      const gradient = (name, stops) => {
        const g = node('linearGradient', { id: `${id}-${name}`, x1: '10%', y1: '0%', x2: '90%', y2: '100%' }, defs);
        stops.forEach(([offset, color]) => node('stop', { offset, 'stop-color': color }, g));
        return `url(#${id}-${name})`;
      };
      const skin = gradient('skin', [[0, '#c5e5b8'], [.6, '#a6d09c'], [1, '#719f73']]);
      const sleeve = gradient('sleeve', [[0, '#9c2dc0'], [.55, '#751c9a'], [1, '#48116f']]);
      this.root = node('g', {}, svg);
      this.floatBody = node('g', {}, this.root);
      this.tail = cut('ghost-tail', 'M73 432 Q145 424 209 440 Q265 441 282 468 Q278 497 246 507 Q170 519 109 479 L72 461 Z', this.floatBody);
      this.hair = cut('back-hair', 'M91 234 Q128 232 188 258 L230 311 L220 377 Q181 424 106 428 L82 408 Q103 378 96 343 Z', this.floatBody);
      this.torso = node('g', {}, this.floatBody);
      cut('shirt', 'M143 265 Q188 259 236 273 L272 304 L269 347 Q226 367 172 352 L138 329 Z', this.torso);

      this.armStrum = node('g', {}, this.torso);
      node('path', { d: 'M149 290 Q169 280 183 298 L187 329 L170 350 L143 325 Z', fill: sleeve }, this.armStrum);
      cut('strum-upper', 'M137 281 Q173 278 190 297 L191 337 L153 353 L133 322 Z', this.armStrum);
      this.armFret = node('g', {}, this.torso);
      node('path', { d: 'M251 287 Q274 285 293 309 L318 324 L312 340 L276 333 L249 312 Z', fill: sleeve }, this.armFret);
      cut('fret-upper', 'M244 279 Q273 279 299 304 L320 327 L305 343 L266 325 L241 306 Z', this.armFret);

      // This is the guitar in Connie's actual render. The strap, neck and
      // body are separate cutouts so they can rock together without new art.
      this.guitar = node('g', {}, this.torso);
      cut('strap', 'M225 265 L242 265 L330 322 L324 333 L304 321 L224 282 Z', this.guitar);
      cut('guitar-neck', 'M188 357 L350 282 L390 274 L398 291 L382 310 L226 387 Z', this.guitar);
      cut('guitar-body', 'M91 379 Q110 347 162 337 L204 330 Q240 340 264 372 L280 411 Q266 447 215 457 L138 466 Q96 457 91 420 Z', this.guitar);

      this.handStrum = node('g', {}, this.armStrum);
      node('path', { d: 'M175 333 Q194 323 207 345 L210 371 Q200 384 182 378 L166 356 Z', fill: skin }, this.handStrum);
      cut('strum-hand', 'M162 330 Q192 322 213 340 L218 378 L185 391 L160 365 Z', this.handStrum);
      this.handFret = node('g', {}, this.armFret);
      node('path', { d: 'M298 306 Q320 303 337 320 L340 344 Q327 356 309 348 L294 329 Z', fill: skin }, this.handFret);
      cut('fret-hand', 'M293 303 Q325 296 345 315 L347 348 L313 360 L289 337 Z', this.handFret);

      this.head = node('g', {}, this.torso);
      cut('head', 'M178 47 Q241 40 291 73 Q324 101 328 165 L324 213 Q320 253 285 271 Q219 291 162 262 Q107 258 91 217 Q84 173 113 117 Q130 75 178 47 Z', this.head);
      this.face = node('g', {}, this.head);
      this.drawFace('original');
    }

    drawFace(mood) {
      if (mood === this.mood) return;
      this.mood = mood;
      const g = this.face;
      g.replaceChildren();
      if (mood === 'original') return;
      const dark = '#16131a', pale = '#eeecec';
      const line = (d, width = 3, color = dark) => node('path', { d, fill: 'none', stroke: color, 'stroke-width': width, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, g);
      // These sit over the original pupils only; the pink lids, tear marks,
      // teeth, cap and rendered skin remain the supplied artwork.
      if (mood === 'blink' || mood === 'sleep') {
        node('path', { d: 'M208 184 Q235 177 262 183 L264 216 Q239 227 211 218 Z M275 181 Q289 178 304 183 L304 219 L278 220 Z', fill: dark }, g);
        line('M211 210 Q236 218 261 206 M279 209 Q290 216 302 206', 2.8, pale);
      } else if (mood === 'focus') {
        line('M209 181 Q235 175 263 183 M279 182 Q292 179 303 184', 3.4);
      } else if (mood === 'surprise') {
        node('ellipse', { cx: 240, cy: 199, rx: 14, ry: 17, fill: pale }, g);
        node('ellipse', { cx: 290, cy: 199, rx: 5, ry: 13, fill: pale }, g);
      } else if (mood === 'smile') {
        // The original grin already carries this expression.
      }
    }

    update(u, elapsed) {
      const dt = clamp(elapsed || 0, 0, .05);
      if (!dt) return;
      this.time += dt;
      const s = this.s, moving = u.moving ? 1 : 0;
      const action = u.animT > 0 ? u.animState : '';
      const progress = action ? 1 - clamp(u.animT / Math.max(.01, u.animDur || 1)) : 0;
      const wind = action === 'wind' ? pulse(progress) : 0;
      const attack = action === 'attack' ? pulse(progress) : 0;
      const cast = action === 'cast' || action === 'spin' ? pulse(progress) : u.casting ? .6 : 0;
      const sleep = u.visualSleep ? 1 : 0;
      if ((u.hitT || 0) > this.lastHit + .02) { s.recoil.v = -80; this.hurt = .24; }
      this.lastHit = u.hitT || 0;
      this.hurt = Math.max(0, this.hurt - dt);
      const recoil = s.recoil.step(0, dt);
      const rhythm = this.time * (cast > .15 ? 15 : 8);
      const strum = Math.sin(rhythm);
      const beat = Math.sin(rhythm * .5);
      const float = s.float.step(beat * 2 - moving * 2 - wind * 3 - cast * 2 + recoil * .4, dt);
      const body = s.body.step(beat * 1.4 + moving * 3 - wind * 2 + attack * 4 + recoil * .14, dt);
      const head = s.head.step(-beat * 2 - moving * 2 + attack * -3 + cast * 2 + sleep * 9, dt);
      const hair = s.hair.step(-body * .55 + beat * 2 - moving * 3, dt, 65, 9);
      const tail = s.tail.step(-body * .6 + beat * 3 - moving * 4 - attack * 3, dt, 75, 10);
      const guitar = s.guitar.step(-beat * 1.1 + attack * 2 + cast * 2, dt);
      const armStrum = s.armStrum.step(strum * 3 - attack * 7 + cast * 4, dt);
      const handStrum = s.handStrum.step(strum * (6 + cast * 4 + attack * 2), dt, 185, 17);
      const armFret = s.armFret.step(-beat * 2 + cast * 3 - attack * 3, dt);
      const handFret = s.handFret.step(strum * 2 + cast * 2, dt);
      const sx = s.sx.step(1 + wind * .02 - attack * .012, dt);
      const sy = s.sy.step(1 - wind * .03 + attack * .018, dt);
      this.root.setAttribute('transform', `translate(218 490) scale(${sx.toFixed(3)} ${sy.toFixed(3)}) translate(-218 -490)`);
      this.floatBody.setAttribute('transform', `translate(0 ${float.toFixed(2)})`);
      rot(this.hair, hair, 162, 279);
      rot(this.tail, tail, 212, 448);
      rot(this.torso, body, 213, 356);
      rot(this.guitar, guitar, 217, 368);
      rot(this.armStrum, armStrum, 158, 303);
      rot(this.handStrum, handStrum, 182, 345);
      rot(this.armFret, armFret, 269, 303);
      rot(this.handFret, handFret, 308, 326);
      rot(this.head, head, 208, 266);
      this.blinkT -= dt;
      const blinking = this.blinkT < 0 && this.blinkT > -.1;
      if (this.blinkT < -.1) this.blinkT = 2.5 + Math.random() * 2.8;
      const mood = sleep ? 'sleep' : this.hurt > 0 ? 'surprise' : cast > .35 ? 'smile' : attack > .2 ? 'focus' : blinking ? 'blink' : 'original';
      this.drawFace(mood);
    }
  }
  const enabled = () => { try { return !!Save.data.opt.animatedChars; } catch (_) { return true; } };
  return { enabled, create: host => new Rig(host) };
})();
