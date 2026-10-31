/* Vee's battle cutout: original TV sprite, animated antennae and limbs,
   with screen expressions based on her supplied expression references. */
'use strict';
const VeeRig = (() => {
  const NS = 'http://www.w3.org/2000/svg';
  const GREEN = '#79ff57';
  const node = (tag, attrs, parent) => {
    const el = document.createElementNS(NS, tag);
    for (const [key, value] of Object.entries(attrs || {})) el.setAttribute(key, value);
    if (parent) parent.appendChild(el);
    return el;
  };
  const clamp = (n, a = 0, b = 1) => Math.min(b, Math.max(a, n));
  const ease = n => { n = clamp(n); return n * n * (3 - 2 * n); };
  const pose = n => ease(n / .18) * (1 - ease((n - .78) / .22));
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
      this.s = Object.fromEntries(['bob', 'torso', 'head', 'antL', 'antR', 'armL', 'armR', 'legL', 'legR', 'point', 'mic', 'recoil'].map(k => [k, new Spring()]));
      const id = `vee-rig-${++nextId}`;
      const svg = node('svg', { viewBox: '0 0 307 454', class: 'rig-svg', 'aria-hidden': 'true' }, host);
      const defs = node('defs', {}, svg);
      const src = (typeof ASSET === 'string' ? ASSET : './') + 'assets/toon-art/Vee/Vee.png';
      const piece = (name, path, parent) => {
        const clipId = `${id}-${name}`;
        node('path', { d: path }, node('clipPath', { id: clipId, clipPathUnits: 'userSpaceOnUse' }, defs));
        const group = node('g', {}, parent);
        node('image', { href: src, width: 307, height: 454, 'clip-path': `url(#${clipId})` }, group);
        return group;
      };
      this.root = node('g', {}, svg);
      this.legL = piece('leg-left', 'M133 337 H164 V452 H128 Z', this.root);
      this.legR = piece('leg-right', 'M161 337 H205 V452 H156 Z', this.root);
      this.upper = node('g', {}, this.root);
      // The cable exits behind her torso like a tail; its head is a real mic,
      // rather than a third antenna or an unattached handheld prop.
      this.micWire = node('path', { fill: 'none', stroke: '#24272a', 'stroke-width': 6,
        'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, this.upper);
      this.micWireShine = node('path', { fill: 'none', stroke: '#4b5351', 'stroke-width': 1.2,
        'stroke-linecap': 'round' }, this.upper);
      this.armL = piece('arm-left', 'M130 265 H166 L169 339 H126 Z', this.upper);
      this.armR = piece('arm-right', 'M184 267 H222 V346 H180 Z', this.upper);
      this.torso = piece('torso', 'M137 262 H215 V358 H130 Z', this.upper);
      this.headRig = node('g', {}, this.upper);
      this.antL = piece('antenna-left', 'M38 30 H143 V128 H112 L83 98 L38 61 Z', this.headRig);
      this.antR = piece('antenna-right', 'M144 29 H171 V129 H145 Z', this.headRig);
      this.head = piece('tv-head', 'M35 106 H268 V281 H35 Z', this.headRig);
      this.face = node('g', { style: 'filter:drop-shadow(0 0 1.6px #5dff4f)' }, this.headRig);
      // A small inset covers the baked face while leaving the painted bezel intact.
      node('path', { d: 'M125 149 L241 147 L247 240 L139 252 Z', fill: '#0a0a0a' }, this.face);
      this.features = node('g', {}, this.face);
      // The raised on-air arm is drawn in her original colors, then eased out
      // from the same shoulder as the resting sleeve.
      this.pointArm = node('g', { opacity: 0 }, this.upper);
      node('path', { d: 'M198 284 Q213 279 229 267 L254 251', fill: 'none', stroke: '#17181b', 'stroke-width': 12, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, this.pointArm);
      node('path', { d: 'M248 250 Q251 244 258 241 L266 240 L281 234 Q285 234 286 238 Q286 241 282 243 L269 248 L278 249 Q281 251 279 254 Q277 257 273 255 L266 254 Q266 260 261 262 L254 262 Q248 259 246 255 Z', fill: '#5de43c', stroke: '#358f2b', 'stroke-width': 1.2, 'stroke-linejoin': 'round' }, this.pointArm);
      this.mic = node('g', {}, this.upper);
      const grilleId = `${id}-mic-grille`;
      node('circle', { cx: 0, cy: -39, r: 17 }, node('clipPath', { id: grilleId }, defs));
      // Her mic is a round charcoal grille on a thick, muted green stem.
      node('path', { d: 'M-6 -27 L-8 -7 Q-8 0 -3 2 L3 2 Q8 0 8 -7 L6 -27 Z',
        fill: '#405b4e', stroke: '#222c29', 'stroke-width': 2, 'stroke-linejoin': 'round' }, this.mic);
      node('path', { d: 'M-5 -25 L-6 -7 Q-5 -2 -3 -2', fill: 'none', stroke: '#637969',
        'stroke-width': 1.5, 'stroke-linecap': 'round', opacity: .5 }, this.mic);
      node('path', { d: 'M-9 -27 Q0 -31 9 -27 L8 -22 Q0 -20 -8 -22 Z',
        fill: '#252a2a', stroke: '#171b1b', 'stroke-width': 1 }, this.mic);
      node('circle', { cx: 0, cy: -39, r: 17, fill: '#303136', stroke: '#1e2023',
        'stroke-width': 2.2 }, this.mic);
      const grille = node('g', { 'clip-path': `url(#${grilleId})`, fill: 'none',
        stroke: '#202227', 'stroke-width': 2, 'stroke-linecap': 'round', opacity: .62 }, this.mic);
      node('path', { d: 'M-16 -45 Q0 -43 16 -46 M-17 -36 Q0 -34 17 -37 M-12 -27 Q0 -29 12 -28' }, grille);
      node('path', { d: 'M-9 -55 Q-5 -39 -10 -23 M3 -56 Q7 -39 3 -22 M13 -52 Q10 -40 14 -28' }, grille);
      node('path', { d: 'M-11 -48 Q-8 -54 -2 -55', fill: 'none', stroke: '#55565b',
        'stroke-width': 2, 'stroke-linecap': 'round', opacity: .34 }, this.mic);
      this.drawFace('smug');
    }

    drawFace(mood) {
      if (mood === this.mood) return;
      this.mood = mood;
      this.features.replaceChildren();
      const g = this.features;
      const line = (d, width = 3.3) => node('path', { d, fill: 'none', stroke: GREEN, 'stroke-width': width, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, g);
      const wide = mood === 'live' || mood === 'surprise';
      if (mood === 'blink' || mood === 'sleep') {
        line('M143 185 Q162 193 183 185 M197 181 Q216 190 236 180', 3.4);
      } else {
        const left = wide ? 'M143 168 Q162 160 182 172 Q188 190 175 201 Q152 207 144 186 Z'
          : 'M143 175 Q163 176 182 173 Q182 192 171 200 Q154 203 146 190 Z';
        const right = wide ? 'M195 166 Q216 159 236 170 Q242 188 230 199 Q208 205 197 187 Z'
          : 'M196 171 Q216 173 235 169 Q236 188 226 197 Q207 202 199 188 Z';
        [[left, 166, 185], [right, 221, 183]].forEach(([path, x, y]) => {
          const clip = node('clipPath', {}, g);
          const clipId = `vee-eye-${++nextId}`;
          clip.setAttribute('id', clipId);
          node('path', { d: path }, clip);
          const iris = node('g', { 'clip-path': `url(#${clipId})` }, g);
          node('ellipse', { cx: x + (mood === 'pout' ? 5 : mood === 'live' ? 1 : 3), cy: y, rx: wide ? 10 : 9, ry: wide ? 13 : 12, fill: GREEN }, iris);
          line(path, wide ? 3.6 : 3.2);
        });
        line('M140 174 L151 177 L146 169 M195 170 L206 174 L200 165', 3);
        if (wide) line('M151 156 L157 150 L170 153 M210 151 L217 148 L230 152', 2.8);
      }
      if (mood === 'talk') {
        line('M184 215 Q193 219 205 214 Q207 233 197 237 Q188 236 184 215 Z', 3.4);
      } else if (mood === 'teeth') {
        line('M181 216 Q195 212 210 217 Q209 230 196 232 Q185 231 181 216 Z M190 216 L190 230 M201 216 L202 230', 3.1);
      } else if (mood === 'pout') {
        line('M188 219 Q186 230 192 230 Q197 231 199 226 Q203 233 208 229 Q212 225 207 218', 3.6);
      } else if (mood === 'live') {
        line('M180 212 Q196 220 215 210 Q210 237 198 240 Q186 235 180 212 Z', 3.7);
      } else if (mood === 'surprise') {
        line('M194 218 Q199 214 204 219 Q207 232 200 234 Q194 231 194 218 Z', 3.6);
      } else if (mood === 'sleep') {
        line('M192 218 Q199 223 205 218', 3);
      } else {
        line('M182 217 Q192 231 206 217 L210 208', 3.6);
      }
    }

    update(u, elapsed) {
      const dt = clamp(elapsed || 0, 0, .05);
      if (!dt) return;
      this.time += dt;
      const moving = u.moving ? 1 : 0;
      const speed = Math.hypot(u.vx || 0, u.vy || 0);
      this.phase += dt * (7.5 + Math.min(speed, 140) * .045);
      const stride = Math.sin(this.phase), idle = Math.sin(this.time * 2.3);
      const action = u.animT > 0 ? u.animState : '';
      const progress = action ? 1 - clamp(u.animT / Math.max(.01, u.animDur || 1)) : 0;
      const wind = action === 'wind' ? pose(progress) : 0;
      const attack = action === 'attack' ? pose(progress) : 0;
      const cast = action === 'cast' ? pose(progress) : u.casting ? .6 : 0;
      if ((u.hitT || 0) > this.lastHit + .02) { this.s.recoil.v = -105; this.hurt = .3; }
      this.lastHit = u.hitT || 0;
      this.hurt = Math.max(0, this.hurt - dt);
      const s = this.s, recoil = s.recoil.step(0, dt);
      const point = s.point.step(Math.max(attack, wind * .35), dt, 185, 20);
      const micBeat = this.time % 7.6;
      const idleMic = !moving && !action && !u.casting && !u.visualSleep
        ? ease((micBeat - 4.75) / .38) * (1 - ease((micBeat - 6.1) / .5)) : 0;
      const micLift = s.mic.step(Math.max(cast, idleMic), dt, 140, 19);
      const bob = s.bob.step(idle * 1.5 - Math.abs(stride) * moving * 4 - attack * 3 - cast * 6 + recoil, dt);
      const torso = s.torso.step(idle * 1.2 + moving * 4 + attack * 4 - cast * 4 + recoil * .25, dt);
      const head = s.head.step(-idle * 1.7 - moving * 3 - wind * 4 + attack * 3 - cast * 4 + recoil * .3 + (u.visualSleep ? 10 : 0), dt);
      const antL = s.antL.step(idle * 4 - moving * 7 - attack * 13 + cast * 12, dt, 85, 10);
      const antR = s.antR.step(-idle * 2 + moving * 5 + attack * 8 - cast * 10, dt, 95, 12);
      const armL = s.armL.step(stride * moving * 15 + wind * 22 - cast * 33, dt);
      const armR = s.armR.step(-stride * moving * 13 + attack * 12 - micLift * 60, dt);
      const legL = s.legL.step(stride * moving * 18, dt);
      const legR = s.legR.step(-stride * moving * 18, dt);
      const rotate = (part, deg, x, y) => part.setAttribute('transform', `rotate(${deg.toFixed(2)} ${x} ${y})`);
      this.root.setAttribute('transform', `translate(0 ${bob.toFixed(2)})`);
      rotate(this.legL, legL, 150, 350); rotate(this.legR, legR, 177, 350);
      rotate(this.upper, torso, 171, 342);
      const tailX = 86 + micLift * 151 + Math.sin(this.time * 2.2) * (1 - micLift) * 4;
      const tailY = 332 - micLift * 40 + Math.sin(this.time * 1.8) * (1 - micLift) * 3;
      const cable = `M150 328 C107 350 ${55 + micLift * 157} ${369 - micLift * 18} ${tailX.toFixed(1)} ${tailY.toFixed(1)}`;
      this.micWire.setAttribute('d', cable);
      this.micWireShine.setAttribute('d', cable);
      this.mic.setAttribute('transform', `translate(${tailX.toFixed(1)} ${tailY.toFixed(1)}) rotate(${(20 + Math.sin(this.time * 2.1) * (1 - micLift) * 4).toFixed(1)})`);
      rotate(this.armL, armL, 145, 277); rotate(this.armR, armR, 193, 279);
      this.armR.setAttribute('opacity', (1 - clamp(point * 1.4)).toFixed(2));
      this.pointArm.setAttribute('opacity', clamp(point * 1.5).toFixed(2));
      this.pointArm.setAttribute('transform', `rotate(${(-7 * (1 - point)).toFixed(2)} 200 283)`);
      rotate(this.headRig, head, 168, 270);
      rotate(this.antL, antL, 133, 119); rotate(this.antR, antR, 158, 119);
      const blink = this.time % 3.9 < .11;
      const idlePout = this.time % 7.6 > 5.5 && this.time % 7.6 < 6.2;
      const mood = u.visualSleep ? 'sleep' : this.hurt > 0 ? 'teeth' : cast > .15 ? 'live' :
        attack > .15 ? 'talk' : wind > .15 ? 'teeth' : blink ? 'blink' : idlePout ? 'pout' : 'smug';
      this.drawFace(mood);
    }
  }
  const enabled = () => { try { return !!Save.data.opt.animatedChars; } catch (_) { return true; } };
  return { enabled, create: host => new Rig(host) };
})();
