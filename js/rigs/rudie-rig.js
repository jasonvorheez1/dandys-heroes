/* Rudie's battle puppet: prancing hooves, trailing tail, twitching ears and
   candy-cane antlers. The supplied close-ups guide his action expressions. */
'use strict';
const RudieRig = (() => {
  const NS = 'http://www.w3.org/2000/svg';
  const node = (tag, attrs = {}, parent) => {
    const element = document.createElementNS(NS, tag);
    for (const [key, value] of Object.entries(attrs)) element.setAttribute(key, value);
    if (parent) parent.appendChild(element);
    return element;
  };
  const clamp = (value, min = 0, max = 1) => Math.max(min, Math.min(max, value));
  const ease = value => { value = clamp(value); return value * value * (3 - 2 * value); };
  const pulse = value => Math.sin(Math.PI * clamp(value));
  let nextId = 0;

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
      this.lastHit = 0;
      this.hurt = 0;
      this.mood = '';
      this.s = Object.fromEntries([
        'move', 'bob', 'lean', 'head', 'earL', 'earR', 'antlerL', 'antlerR',
        'tail', 'armL', 'armR', 'legL', 'legR', 'liftL', 'liftR', 'face', 'nose', 'recoil'
      ].map(name => [name, new Spring()]));
      const id = `rudie-rig-${++nextId}`;
      const svg = node('svg', { viewBox: '0 0 267 398', class: 'rig-svg', 'aria-hidden': 'true' }, host);
      const defs = node('defs', {}, svg);
      const src = (typeof ASSET === 'string' ? ASSET : './') + 'Characters/Rudie/Rudie.png';
      const piece = (name, path, parent) => {
        const clipId = `${id}-${name}`;
        node('path', { d: path }, node('clipPath', { id: clipId, clipPathUnits: 'userSpaceOnUse' }, defs));
        const group = node('g', {}, parent);
        node('image', { href: src, width: 267, height: 398, 'clip-path': `url(#${clipId})` }, group);
        return group;
      };
      const fur = node('linearGradient', { id: `${id}-fur`, x1: '0%', y1: '0%', x2: '100%', y2: '0%' }, defs);
      node('stop', { offset: 0, 'stop-color': '#54321e' }, fur);
      node('stop', { offset: .65, 'stop-color': '#462817' }, fur);
      node('stop', { offset: 1, 'stop-color': '#352010' }, fur);
      const muzzle = node('linearGradient', { id: `${id}-muzzle`, x1: '0%', y1: '0%', x2: '100%', y2: '100%' }, defs);
      node('stop', { offset: 0, 'stop-color': '#9a7659' }, muzzle);
      node('stop', { offset: 1, 'stop-color': '#795941' }, muzzle);
      const glow = node('radialGradient', { id: `${id}-glow` }, defs);
      node('stop', { offset: 0, 'stop-color': '#ffb7a0', 'stop-opacity': .95 }, glow);
      node('stop', { offset: .36, 'stop-color': '#ff3445', 'stop-opacity': .7 }, glow);
      node('stop', { offset: 1, 'stop-color': '#ff3445', 'stop-opacity': 0 }, glow);

      const aura = node('radialGradient', { id: `${id}-aura` }, defs);
      node('stop', { offset: 0, 'stop-color': '#fff0ae', 'stop-opacity': .75 }, aura);
      node('stop', { offset: .55, 'stop-color': '#ffd166', 'stop-opacity': .4 }, aura);
      node('stop', { offset: 1, 'stop-color': '#ff5b7f', 'stop-opacity': 0 }, aura);
      this.aura = node('ellipse', { cx: 132, cy: 250, rx: 118, ry: 150, fill: `url(#${id}-aura)`, opacity: 0 }, svg);
      this.streaks = node('g', { opacity: 0 }, svg);
      this.streakLines = [[70, 30], [110, 52], [175, 22], [235, 44], [290, 26], [340, 40]].map(([y, len]) =>
        node('rect', { x: 0, y, width: len, height: 5, rx: 2.5, fill: y % 2 ? '#ffd166' : '#ff9ab0' }, this.streaks));
      this.root = node('g', {}, svg);
      this.legR = piece('leg-r', 'M124 325 H167 V398 H124 Z', this.root);
      this.legL = piece('leg-l', 'M91 325 H133 V398 H91 Z', this.root);
      this.upper = node('g', {}, this.root);
      this.tail = piece('tail', 'M44 242 Q69 239 96 253 L110 289 L98 336 L51 328 L39 286 Z', this.upper);
      // The original arm and tail pixels are masked from the still torso,
      // leaving a matching fur layer visible when those parts swing away.
      node('path', { d: 'M111 223 Q149 216 167 250 L171 309 Q149 337 108 324 Q89 291 102 247 Z', fill: `url(#${id}-fur)` }, this.upper);
      this.body = piece('body', 'M84 214 H177 V340 H84 Z', this.upper);
      const bodyMask = node('mask', { id: `${id}-body-mask`, maskUnits: 'userSpaceOnUse', x: 0, y: 0, width: 267, height: 398 }, defs);
      node('rect', { x: 0, y: 0, width: 267, height: 398, fill: 'white' }, bodyMask);
      node('path', { d: 'M44 242 Q70 239 98 251 L110 289 L102 333 L44 334 Z M88 227 Q105 225 121 243 L126 292 L113 338 Q94 340 79 322 L83 269 Z M156 245 Q175 255 176 283 L174 320 Q163 327 156 315 Z', fill: 'black' }, bodyMask);
      this.body.setAttribute('mask', `url(#${id}-body-mask)`);
      this.armR = piece('arm-r', 'M155 243 Q174 250 177 281 L176 321 Q164 328 155 316 L154 272 Z', this.upper);
      this.armL = piece('arm-l', 'M89 225 Q108 223 122 243 L126 291 L115 339 Q93 342 78 323 L82 270 Z', this.upper);
      this.head = node('g', {}, this.upper);
      this.antlerL = piece('antler-l', 'M112 11 H140 V90 H111 Z', this.head);
      this.antlerR = piece('antler-r', 'M139 16 H187 V95 H137 Z', this.head);
      this.earL = piece('ear-l', 'M45 55 Q69 52 93 67 L120 91 L100 116 Q64 117 47 89 Z', this.head);
      this.earR = piece('ear-r', 'M159 69 Q187 68 207 84 L208 118 Q191 132 166 112 Z', this.head);
      // A round fur patch fills the roots of the ears when they flick.
      node('path', { d: 'M111 76 Q163 63 189 97 Q211 133 202 178 Q186 213 136 215 Q82 210 67 172 Q58 121 88 90 Z', fill: '#51311e' }, this.head);
      this.faceArt = piece('face', 'M94 72 Q160 59 195 101 Q217 146 203 181 Q190 213 135 217 Q80 210 66 173 Q56 123 89 88 Z', this.head);
      const headMask = node('mask', { id: `${id}-head-mask`, maskUnits: 'userSpaceOnUse', x: 0, y: 0, width: 267, height: 398 }, defs);
      node('rect', { x: 0, y: 0, width: 267, height: 398, fill: 'white' }, headMask);
      node('path', { d: 'M45 54 Q76 52 102 70 L108 91 Q91 111 61 104 Q46 94 45 54 Z M170 78 Q189 75 207 88 Q209 108 195 121 L179 111 Z M111 9 H141 V78 H110 Z M138 14 H188 V84 H138 Z', fill: 'black' }, headMask);
      this.faceArt.setAttribute('mask', `url(#${id}-head-mask)`);
      this.expression = node('g', { opacity: 0 }, this.head);
      node('path', { d: 'M179 166 Q195 160 203 168 Q208 181 199 196 Q184 201 174 188 Z', fill: `url(#${id}-muzzle)` }, this.expression);
      this.mouth = node('g', {}, this.expression);
      this.noseGlow = node('g', { opacity: 0 }, this.head);
      node('ellipse', { cx: 195, cy: 157, rx: 25, ry: 22, fill: `url(#${id}-glow)` }, this.noseGlow);
      node('ellipse', { cx: 195, cy: 157, rx: 7.8, ry: 7.5, fill: '#f83b42', opacity: .88 }, this.noseGlow);
      this.drawMouth('smile');
    }

    drawMouth(mood) {
      if (mood === this.mood) return;
      this.mood = mood;
      const g = this.mouth;
      g.replaceChildren();
      const outline = (d, width = 2.6) => node('path', { d, fill: 'none', stroke: '#21180f', 'stroke-width': width, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, g);
      if (mood === 'surprise') {
        node('ellipse', { cx: 190, cy: 181, rx: 7, ry: 10, fill: '#602d2a', stroke: '#21180f', 'stroke-width': 2.5 }, g);
        node('path', { d: 'M187 188 Q191 184 195 188', fill: 'none', stroke: '#df8989', 'stroke-width': 2 }, g);
      } else if (mood === 'grin') {
        node('path', { d: 'M177 175 Q189 174 203 169 Q201 191 190 193 Q181 190 177 175 Z', fill: '#f4f0e7', stroke: '#21180f', 'stroke-width': 2.7 }, g);
        outline('M181 181 L188 190 M191 177 L194 190', 1.6);
      } else if (mood === 'laugh') {
        node('path', { d: 'M176 173 Q188 183 205 169 Q203 196 189 199 Q179 198 176 173 Z', fill: '#703433', stroke: '#21180f', 'stroke-width': 2.7 }, g);
        node('path', { d: 'M182 191 Q190 185 198 191', fill: 'none', stroke: '#d98c8a', 'stroke-width': 2.6 }, g);
      } else if (mood === 'focus') {
        outline('M181 183 Q191 180 200 181', 2.8);
      } else {
        outline('M181 178 Q191 190 202 175', 2.7);
      }
    }

    update(u, elapsed) {
      const dt = clamp(elapsed || 0, 0, .05);
      if (!dt) return;
      this.time += dt;
      const s = this.s;
      const speed = Math.hypot(u.vx || 0, u.vy || 0);
      const moving = s.move.step(u.moving ? 1 : 0, dt, 120, 18);
      const momentum = Math.min(12, u._rudieVisualMomentum || 0);
      this.phase += dt * (9 + Math.min(speed, 150) * .075 + momentum * .15);
      const stride = Math.sin(this.phase);
      const idle = Math.sin(this.time * 2.8);
      const action = u.animT > 0 ? u.animState : '';
      const progress = action ? 1 - clamp(u.animT / Math.max(.01, u.animDur || 1)) : 0;
      const style = u.animStyle || '';
      const rush = action === 'wind' && (style === 'rudieRush' || style === 'rudieOpener') ? ease(progress / .32) * (1 - ease((progress - .78) / .22)) : 0;
      const wind = action === 'wind' ? pulse(progress) : 0;
      const barrage = action === 'attack' && style === 'rudieHoof';
      const kickT = barrage ? clamp(progress / .9) * 6 : 0;
      const kick = barrage && progress < .9 ? pulse(kickT - Math.floor(kickT)) : 0;
      const kickL = Math.floor(kickT) % 2 === 0 ? kick : 0;
      const kickR = Math.floor(kickT) % 2 ? kick : 0;
      const hoof = action === 'attack' && style !== 'rudieJab' ? (barrage ? kick * .6 : pulse(progress)) : 0;
      const jab = action === 'attack' && style === 'rudieJab' ? pulse(progress) : 0;
      const redNose = action === 'cast' || style === 'rudieRedNose' ? pulse(progress) : u.casting ? .65 : 0;
      if ((u.hitT || 0) > this.lastHit + .02) { s.recoil.v = -75; this.hurt = .32; }
      this.lastHit = u.hitT || 0;
      this.hurt = Math.max(0, this.hurt - dt);
      const recoil = s.recoil.step(0, dt);
      const bob = s.bob.step(-Math.abs(stride) * moving * (4.5 + momentum * .18) + idle * 1.4 - hoof * 5 - redNose * 6 + recoil, dt);
      const lean = s.lean.step(jab * 9 + idle * 1.5 + stride * moving * 3 + wind * (1 - rush) * 8 + rush * 5 + hoof * 10 + recoil * .22, dt);
      const head = s.head.step(jab * 14 - idle * 2.5 - stride * moving * 4 + rush * 20 + wind * (1 - rush) * 12 - hoof * 8 - redNose * 11 + recoil * .32 + (u.visualSleep ? 13 : 0), dt);
      const tail = s.tail.step(-idle * 5 - stride * moving * 12 - rush * 24 + hoof * 14, dt, 110, 13);
      const earL = s.earL.step(idle * 3 - stride * moving * 5 - rush * 13 + hoof * 6 + recoil * .12, dt, 110, 13);
      const earR = s.earR.step(-idle * 2 + stride * moving * 4 + rush * 12 - redNose * 7, dt, 110, 13);
      const antlerL = s.antlerL.step(jab * 10 - idle * 1.6 - stride * moving * 2.5 + rush * 8, dt, 105, 13);
      const antlerR = s.antlerR.step(jab * 10 + idle * 1.5 + stride * moving * 2 - rush * 7, dt, 105, 13);
      const armL = s.armL.step(idle * 3 + stride * moving * 15 - rush * 21 - hoof * 22 + redNose * 24, dt);
      const armR = s.armR.step(-jab * 55 - idle * 3 - stride * moving * 13 + rush * 18 - hoof * 27 - redNose * 20, dt);
      const legL = s.legL.step(stride * moving * 24 + rush * 16 - (barrage ? kickL * 85 : hoof * 48), dt, 185, 19);
      const legR = s.legR.step(-stride * moving * 22 - rush * 16 + (barrage ? -kickR * 85 : hoof * 28), dt, 185, 19);
      const liftL = s.liftL.step(Math.max(0, stride) * moving * 8 + (barrage ? kickL * 16 : hoof * 12), dt);
      const liftR = s.liftR.step(Math.max(0, -stride) * moving * 8 + (barrage ? kickR * 16 : 0) + redNose * 5, dt);
      const rotate = (part, degrees, x, y) => part.setAttribute('transform', `rotate(${degrees.toFixed(2)} ${x} ${y})`);
      const charge = clamp(momentum / 12);
      const sx = 1 + rush * .07 + kick * .03, sy = 1 - rush * .05 - kick * .02;
      this.root.setAttribute('transform', `translate(${(-rush * 24 + jab * 8).toFixed(2)} ${bob.toFixed(2)}) translate(133 398) scale(${sx.toFixed(3)} ${sy.toFixed(3)}) translate(-133 -398)`);
      // Momentum glow breathes behind him; speed streaks stream back while he runs or charges.
      this.aura.setAttribute('opacity', clamp(charge * (.45 + .15 * Math.sin(this.time * 7)) + rush * .35 + redNose * .25).toFixed(2));
      const streak = clamp(Math.max(rush, redNose * .5, moving * charge * .9, charge > .5 ? .35 : 0));
      this.streaks.setAttribute('opacity', streak.toFixed(2));
      this.streakLines.forEach((line, i) => {
        const run = (this.time * (4 + i * .7) + i * .37) % 1;
        line.setAttribute('x', (50 - run * 80).toFixed(1));
        line.setAttribute('opacity', (1 - run).toFixed(2));
      });
      this.legR.setAttribute('transform', `translate(0 ${(-liftR).toFixed(2)}) rotate(${legR.toFixed(2)} 141 329)`);
      this.legL.setAttribute('transform', `translate(0 ${(-liftL).toFixed(2)}) rotate(${legL.toFixed(2)} 108 329)`);
      rotate(this.upper, lean, 131, 319);
      rotate(this.tail, tail, 91, 270);
      rotate(this.armR, armR, 161, 253);
      rotate(this.armL, armL, 105, 241);
      rotate(this.head, head, 128, 211);
      rotate(this.earL, earL, 101, 87);
      rotate(this.earR, earR, 170, 95);
      rotate(this.antlerL, antlerL, 125, 78);
      rotate(this.antlerR, antlerR, 154, 82);
      const mood = this.hurt ? 'surprise' : redNose > .12 ? 'laugh' : hoof > .12 ? 'grin' : rush > .12 || wind > .2 ? 'focus' : '';
      if (mood && mood !== this.mood) this.drawMouth(mood);
      const face = s.face.step(mood ? 1 : 0, dt, 220, 23);
      this.expression.setAttribute('opacity', clamp(face).toFixed(2));
      const nose = s.nose.step(redNose + momentum * .025, dt, 175, 19);
      this.noseGlow.setAttribute('opacity', clamp(nose).toFixed(2));
    }
  }
  const enabled = () => { try { return !!Save.data.opt.animatedChars; } catch (_) { return true; } };
  return { enabled, create: host => new Rig(host) };
})();
