/* Tasque Manager's original pixel sprite, separated into articulated parts. */
'use strict';

const TasqueManagerRig = (() => {
  const NS = 'http://www.w3.org/2000/svg';
  const base = (typeof ASSET === 'string' ? ASSET : './') + 'assets/deltarune/tasque-manager-rig-';
  const clamp = (n, a, b) => Math.max(a, Math.min(b, n));
  const node = (tag, attrs, parent) => {
    const element = document.createElementNS(NS, tag);
    for (const [key, value] of Object.entries(attrs)) element.setAttribute(key, value);
    parent?.appendChild(element);
    return element;
  };
  class Spring {
    constructor() { this.x = 0; this.v = 0; }
    step(target, dt) {
      const count = Math.max(1, Math.ceil(dt / .008)), h = dt / count;
      for (let i = 0; i < count; i++) {
        this.v += (target - this.x) * 180 * h;
        this.v *= Math.exp(-20 * h);
        this.x += this.v * h;
      }
      return this.x;
    }
  }
  class Rig {
    constructor(host) {
      this.time = Math.random() * 6;
      this.lastHit = 0;
      this.s = Object.fromEntries(['bob', 'torso', 'head', 'arm', 'whip', 'feet'].map(key => [key, new Spring()]));
      const svg = node('svg', { viewBox: '0 0 139 141', class: 'rig-svg', 'aria-hidden': 'true' }, host);
      const whole = this.whole = node('g', {}, svg);
      const piece = (name, parent) => {
        const group = node('g', {}, parent);
        node('image', { href: base + name + '.png', width: 139, height: 141 }, group);
        return group;
      };
      this.feet = piece('feet', whole);
      this.upper = node('g', {}, whole);
      piece('body', this.upper);
      this.whip = piece('whip', this.upper);
      this.arm = piece('arm', this.upper);
      this.head = piece('head', this.upper);
      this.static = false;
    }

    update(u, elapsed) {
      const dt = clamp(elapsed || 0, 0, .05);
      if (!dt) return;
      this.time += dt;
      const t = this.time;
      const moving = !!u.moving || Math.hypot(u.vx || 0, u.vy || 0) > 8;
      const stride = moving ? Math.sin(t * 12) : 0;
      const active = u.animT > 0;
      const phase = active ? clamp(1 - u.animT / Math.max(.01, u.animDur || 1), 0, 1) : 0;
      const strike = active && (u.animState === 'attack' || u.animState === 'cast');
      const swing = strike ? Math.sin(Math.PI * phase) : 0;
      const wind = strike && phase < .24 ? Math.sin(Math.PI * phase / .24) : 0;
      const hurt = u.hitT > 0 ? Math.min(1, u.hitT * 4) : 0;
      const breath = Math.sin(t * 2.7);
      const s = this.s;
      const bob = s.bob.step((moving ? -Math.abs(stride) * 2.4 : breath * .7) - swing * 2 + hurt * 1.5, dt);
      const torso = s.torso.step(breath * 1.2 + stride * 2 - swing * 4 + hurt * 8, dt);
      const head = s.head.step(-breath * 2 + Math.sin(t * 1.3) * 1.2 - swing * 5 + hurt * 6, dt);
      const arm = s.arm.step(breath * 1.5 + wind * 13 - swing * 28 + hurt * 8, dt);
      const whip = s.whip.step(Math.sin(t * 2.1) * 3 + wind * 23 - swing * 69, dt);
      const feet = s.feet.step(stride * 8 - swing * 3, dt);
      this.whole.setAttribute('transform', `translate(0 ${bob.toFixed(2)})`);
      this.upper.setAttribute('transform', `rotate(${torso.toFixed(2)} 94 96)`);
      this.head.setAttribute('transform', `rotate(${head.toFixed(2)} 98 45)`);
      this.arm.setAttribute('transform', `rotate(${arm.toFixed(2)} 82 51)`);
      this.whip.setAttribute('transform', `rotate(${whip.toFixed(2)} 55 53)`);
      this.feet.setAttribute('transform', `rotate(${feet.toFixed(2)} 94 120)`);
    }
  }
  return { enabled: () => true, create: host => new Rig(host) };
})();
