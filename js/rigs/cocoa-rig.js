/* Cocoa's battle puppet. Visible parts are clipped from Cocoa.png; the
   shaded joint fills sit underneath the original chocolate bunny pixels. */
'use strict';
const CocoaRig = (() => {
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
    step(target, dt, stiffness = 145, damping = 18) {
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
      this.hurt = 0;
      this.lastHit = 0;
      this.blinkT = 2 + Math.random() * 2.5;
      this.mood = '';
      this.s = Object.fromEntries(['moving', 'bob', 'lean', 'head', 'earBack', 'earFront', 'armNear', 'handNear',
        'armFar', 'legNear', 'legFar', 'recoil', 'sx', 'sy'].map(k => [k, new Spring(k === 'sx' || k === 'sy' ? 1 : 0)]));
      const id = `cocoa-rig-${++serial}`;
      const svg = node('svg', { viewBox: '0 0 380 348', class: 'rig-svg', 'aria-hidden': 'true' }, host);
      const defs = node('defs', {}, svg);
      const src = (typeof ASSET === 'string' ? ASSET : './') + 'assets/toon-art/Cocoa/Cocoa.png';
      const cut = (name, d, parent) => {
        const cid = `${id}-${name}`;
        node('path', { d }, node('clipPath', { id: cid, clipPathUnits: 'userSpaceOnUse' }, defs));
        const g = node('g', {}, parent);
        node('image', { href: src, width: 380, height: 348, 'clip-path': `url(#${cid})` }, g);
        return g;
      };
      const chocolate = node('linearGradient', { id: `${id}-chocolate`, x1: '5%', y1: '0%', x2: '90%', y2: '100%' }, defs);
      [[0, '#9b532f'], [.5, '#774027'], [1, '#4d281c']].forEach(([offset, color]) => node('stop', { offset, 'stop-color': color }, chocolate));
      const brown = `url(#${id}-chocolate)`;
      this.root = node('g', {}, svg);
      this.body = node('g', {}, this.root);

      this.legFar = node('g', {}, this.body);
      node('path', { d: 'M229 273 Q252 267 258 288 L259 322 Q257 336 240 337 L226 321 Z', fill: brown }, this.legFar);
      cut('far-leg', 'M224 270 Q253 267 267 286 L270 327 Q257 343 227 340 L221 303 Z', this.legFar);
      this.legNear = node('g', {}, this.body);
      node('path', { d: 'M201 272 Q229 269 238 291 L244 330 Q237 348 210 347 L198 316 Z', fill: brown }, this.legNear);
      cut('near-leg', 'M193 269 Q226 265 249 289 L252 348 L195 348 L190 309 Z', this.legNear);
      this.upper = node('g', {}, this.body);
      // The original head hides this short neck. It keeps the collar seated
      // when a nod exposes a few pixels between the two cutouts.
      node('path', { d: 'M207 171 Q234 172 257 181 L258 214 L201 214 Z', fill: brown }, this.upper);
      this.earBack = cut('back-ear', 'M62 4 Q140 -12 207 16 L205 44 Q158 61 147 125 L161 232 L117 257 Q61 245 48 186 Q34 90 62 4 Z', this.upper);
      this.earFront = cut('front-ear', 'M115 43 Q154 34 183 48 L185 215 Q179 253 132 248 Q101 224 96 168 Q91 95 115 43 Z', this.upper);

      this.armFar = node('g', {}, this.upper);
      node('path', { d: 'M249 219 Q266 218 271 240 L274 266 Q270 286 258 288 L246 267 Z', fill: brown }, this.armFar);
      cut('far-arm', 'M244 212 Q267 209 277 235 L280 278 L256 293 L244 267 Z', this.armFar);
      this.armNear = node('g', {}, this.upper);
      node('path', { d: 'M198 213 Q218 206 232 223 L231 257 L219 280 L199 272 L187 242 Z', fill: brown }, this.armNear);
      cut('near-upper-arm', 'M190 207 Q221 202 236 222 L238 259 L208 273 L186 248 Z', this.armNear);
      this.handNear = node('g', {}, this.armNear);
      node('path', { d: 'M211 246 Q234 235 246 253 L246 284 Q239 302 217 303 L204 282 Z', fill: brown }, this.handNear);
      cut('near-hand', 'M199 242 Q235 234 249 252 L252 296 L216 310 L195 283 Z', this.handNear);
      cut('torso', 'M198 192 Q229 191 257 207 L266 243 Q265 279 247 292 L207 290 Q184 267 186 230 Z', this.upper);

      this.head = node('g', {}, this.upper);
      cut('head', 'M168 28 Q220 15 273 45 Q310 67 315 119 Q317 153 284 176 Q265 192 254 204 L211 204 Q188 192 184 182 Q148 171 150 119 Q145 67 168 28 Z', this.head);
      this.face = node('g', {}, this.head);
      this.drawFace('original');
    }

    drawFace(mood) {
      if (mood === this.mood) return;
      this.mood = mood;
      const g = this.face;
      g.replaceChildren();
      if (mood === 'original') return;
      const dark = '#140f11';
      const line = (d, w = 2.4, color = dark) => node('path', { d, fill: 'none', stroke: color, 'stroke-width': w, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, g);
      // Small lids and mouth marks follow the side-facing source eye. The
      // rendered chocolate, cheek patch, lashes and nose are never replaced.
      if (mood === 'happy') {
        line('M296 150 Q305 156 312 149', 2);
      } else if (mood === 'focus') {
        line('M245 67 Q264 62 287 75', 2.1, '#4f291e');
      } else if (mood === 'surprise') {
        node('ellipse', { cx: 302, cy: 149, rx: 3.2, ry: 4.5, fill: dark }, g);
      } else if (mood === 'blink' || mood === 'sleep') {
        node('path', { d: `M241 70 Q264 60 289 80 L289 ${mood === 'sleep' ? 108 : 97} Q266 ${mood === 'sleep' ? 102 : 90} 243 ${mood === 'sleep' ? 109 : 98} Z`, fill: '#965031' }, g);
        line(mood === 'sleep' ? 'M245 110 Q266 117 287 104' : 'M245 98 Q266 105 287 95', 2.7);
      }
    }

    update(u, elapsed) {
      const dt = clamp(elapsed || 0, 0, .05);
      if (!dt) return;
      this.time += dt;
      const s = this.s;
      const speed = Math.hypot(u.vx || 0, u.vy || 0);
      const moving = s.moving.step(u.moving ? 1 : 0, dt, 120, 18);
      this.phase += dt * (7 + Math.min(speed, 140) * .04);
      const stride = Math.sin(this.phase);
      const idle = Math.sin(this.time * 3.2);
      const sway = Math.sin(this.time * 2.1 + .8);
      const earFlick = Math.pow(Math.max(0, Math.sin(this.time * 1.35)), 10);
      const action = u.animT > 0 ? u.animState : '';
      const progress = action ? 1 - clamp(u.animT / Math.max(.01, u.animDur || 1)) : 0;
      const style = action ? u.animStyle : '';
      const cocoaAction = !!style && style.startsWith('cocoa');
      const wind = !cocoaAction && action === 'wind' ? pulse(progress) : 0;
      const attack = !cocoaAction && action === 'attack' ? pulse(progress) : 0;
      const cast = !cocoaAction && (action === 'cast' || action === 'spin') ? pulse(progress) : !action && u.casting ? .6 : 0;
      const sleep = u.visualSleep ? 1 : 0;
      if ((u.hitT || 0) > this.lastHit + .02) { s.recoil.v = -100; this.hurt = .25; }
      this.lastHit = u.hitT || 0;
      this.hurt = Math.max(0, this.hurt - dt);
      const recoil = s.recoil.step(0, dt);
      const calm = (1 - moving) * (cocoaAction ? 0 : 1 - wind) * (1 - attack) * (1 - cast) * (1 - sleep);
      const pose = {
        bob: (idle * 3.8 - earFlick * 2.5) * calm - Math.abs(stride) * moving * 5 - wind * 5 - attack * 5 + recoil * .4,
        lean: sway * 1.8 * calm + stride * moving * 3.5 - wind * 6 + attack * 8 - cast * 3 + recoil * .12,
        head: (-idle * 3.2 + earFlick * 2.5) * calm - stride * moving * 4 + wind * 5 - attack * 6 + sleep * 9,
        earBack: -stride * moving * 8 + (sway * 7 - earFlick * 5) * calm - attack * 8,
        earFront: -stride * moving * 6 + (idle * 5 + earFlick * 3) * calm - attack * 5,
        armNear: (idle * 5 + earFlick * 3) * calm + stride * moving * 13 - wind * 12 - attack * 24 + cast * 19,
        handNear: idle * 3 * calm - attack * 12 + cast * 10,
        armFar: -sway * 4 * calm - stride * moving * 12 + wind * 9 + attack * 19 - cast * 15,
        legNear: stride * moving * 21 - attack * 6,
        legFar: -stride * moving * 21 + attack * 7,
        sx: 1 + idle * .012 * calm + wind * .04 - attack * .025,
        sy: 1 - idle * .018 * calm - wind * .06 + attack * .04
      };
      // Skill poses use Cocoa's original clipped parts. The arms move from
      // their shoulders, and the hand remains parented to the near arm.
      if (style === 'cocoaBasicWind' || (style === 'cocoaBasicFlick' && action === 'wind')) {
        const charge = Math.sin(progress * Math.PI * .5);
        pose.bob += charge * 7; pose.lean -= charge * 10; pose.head -= charge * 5;
        pose.armNear += charge * 19; pose.armFar += charge * 10;
        pose.earBack += charge * 9; pose.sy -= charge * .07; pose.sx += charge * .05;
      } else if (style === 'cocoaBasicFlick' && action === 'attack') {
        const flick = pulse(progress);
        pose.bob -= flick * 17; pose.lean += flick * 13; pose.head += flick * 6;
        pose.armNear -= flick * 40; pose.handNear -= flick * 17; pose.armFar += flick * 10;
        pose.earBack -= flick * 15; pose.earFront -= flick * 8;
        pose.sy += flick * .07;
      } else if (style === 'cocoaBonbonBurst') {
        const hop = Math.abs(Math.sin(progress * Math.PI * 2));
        const spread = pulse(progress);
        pose.bob -= hop * 24; pose.lean += Math.sin(progress * Math.PI * 4) * 6;
        pose.head -= hop * 7; pose.armNear += spread * 35; pose.armFar -= spread * 32;
        pose.handNear += spread * 10; pose.earBack -= hop * 16; pose.earFront -= hop * 11;
        pose.legNear += hop * 8; pose.legFar -= hop * 8; pose.sy += hop * .09;
      } else if (style === 'cocoaShareShield' || style === 'cocoaShareCleanse') {
        const share = pulse(progress), rock = Math.sin(progress * Math.PI * 3) * share;
        pose.bob -= share * 10; pose.lean += rock * 9; pose.head -= share * 7;
        pose.armNear += share * 33; pose.armFar -= share * 35;
        pose.handNear += share * 12; pose.earBack += rock * 13; pose.earFront -= rock * 10;
        pose.sx += share * .06; pose.sy += share * .035;
      } else if (style === 'cocoaChocolateToss') {
        const charge = Math.sin(Math.min(1, progress / .42) * Math.PI * .5) * (1 - clamp((progress - .42) / .16));
        const lob = progress > .36 ? Math.sin(clamp((progress - .36) / .64) * Math.PI) : 0;
        pose.bob += charge * 9 - lob * 20; pose.lean -= charge * 17; pose.lean += lob * 25;
        pose.head -= charge * 8; pose.head += lob * 10;
        pose.armNear += charge * 22; pose.armNear -= lob * 45;
        pose.armFar += charge * 17; pose.armFar -= lob * 31;
        pose.handNear -= lob * 13; pose.earBack += charge * 12 - lob * 18;
        pose.earFront += charge * 8 - lob * 12; pose.sy -= charge * .09; pose.sy += lob * .09;
      } else if (style === 'cocoaBonbonDelivery') {
        const toss = pulse(progress);
        pose.bob -= toss * 12; pose.lean += toss * 10; pose.head += toss * 5;
        pose.armNear -= toss * 35; pose.handNear -= toss * 13;
        pose.earBack -= toss * 11; pose.earFront -= toss * 7;
      }
      const bob = s.bob.step(pose.bob, dt);
      const lean = s.lean.step(pose.lean, dt);
      const head = s.head.step(pose.head, dt);
      const earBack = s.earBack.step(pose.earBack - head * .4, dt, 65, 9);
      const earFront = s.earFront.step(pose.earFront - head * .25, dt, 75, 10);
      const armNear = s.armNear.step(pose.armNear, dt);
      const handNear = s.handNear.step(pose.handNear, dt);
      const armFar = s.armFar.step(pose.armFar, dt);
      const legNear = s.legNear.step(pose.legNear, dt);
      const legFar = s.legFar.step(pose.legFar, dt);
      const sx = s.sx.step(pose.sx, dt);
      const sy = s.sy.step(pose.sy, dt);
      this.root.setAttribute('transform', `translate(230 343) scale(${sx.toFixed(3)} ${sy.toFixed(3)}) translate(-230 -343)`);
      this.body.setAttribute('transform', `translate(0 ${bob.toFixed(2)})`);
      rot(this.legFar, legFar, 242, 287); rot(this.legNear, legNear, 215, 285);
      rot(this.upper, lean, 230, 277);
      rot(this.earBack, earBack, 158, 48); rot(this.earFront, earFront, 160, 65);
      rot(this.armFar, armFar, 254, 228);
      rot(this.armNear, armNear, 207, 224); rot(this.handNear, handNear, 222, 257);
      rot(this.head, head, 235, 178);
      this.blinkT -= dt;
      const blinking = this.blinkT < 0 && this.blinkT > -.1;
      if (this.blinkT < -.1) this.blinkT = 2.4 + Math.random() * 2.8;
      const mood = sleep ? 'sleep' : this.hurt > 0 ? 'surprise' : style === 'cocoaBonbonBurst' || style === 'cocoaShareCleanse' || style === 'cocoaShareShield' ? 'happy' : style === 'cocoaChocolateToss' || style === 'cocoaBasicFlick' ? 'focus' : cast > .18 ? 'happy' : attack > .17 ? 'focus' : blinking ? 'blink' : 'original';
      this.drawFace(mood);
    }
  }
  const enabled = () => { try { return !!Save.data.opt.animatedChars; } catch (_) { return true; } };
  return { enabled, create: host => new Rig(host) };
})();
