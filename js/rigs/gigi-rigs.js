/* Gigi uses her clean, side-facing game sprite as articulated cutout art.
   Wish Bear Gigi keeps her separate painted rig. The source PNGs stay intact. */
'use strict';

const GigiRigs = (() => {
  const NS = 'http://www.w3.org/2000/svg';
  const clamp = (n, lo, hi) => Math.max(lo, Math.min(hi, n));
  const ease = n => { n = clamp(n, 0, 1); return n * n * (3 - 2 * n); };
  const pulse = n => Math.sin(Math.PI * clamp(n, 0, 1));
  const segment = (start, end, value) => ease((value - start) / (end - start));
<<<<<<< HEAD
  const itemUrl = name => ItemSheet.url(name || 'Gumballs');
=======
  const itemUrl = name => (typeof ASSET === 'string' ? ASSET : './') + 'item/' + (name || 'Gumballs') + '.png';
>>>>>>> ccb31b9f96fec6e5b5e1509b31b66f6b3cb024e0
  function itemMotion(node, unit, time, progress, start, end, size, lid) {
    const active = unit._gigiLidUntil > (unit._rigBattleTime || 0) && unit.animStyle === 'gigiWheel';
    const lift = active ? segment(.13, .43, progress) : 0;
    const settle = active ? segment(.72, 1, progress) : 0;
    const visible = active ? segment(.08, .21, progress) * (1 - settle) : 0;
    const x = start[0] + (end[0] - start[0]) * lift;
    const y = start[1] + (end[1] - start[1]) * lift - Math.sin(lift * Math.PI) * 17;
    node.setAttribute('opacity', visible.toFixed(2));
    node.setAttribute('transform', `translate(${x.toFixed(1)} ${y.toFixed(1)}) rotate(${(lift * 28 + Math.sin(time * 9) * 5).toFixed(1)}) scale(${(.52 + lift * .48).toFixed(2)})`);
    lid.setAttribute('transform', active ? `translate(0 ${(-23 * segment(.03, .25, progress) * (1 - settle)).toFixed(1)}) rotate(${(-13 * segment(.03, .25, progress) * (1 - settle)).toFixed(1)} ${start[0]} ${start[1]})` : '');
  }
  const node = (tag, attributes, parent) => {
    const element = document.createElementNS(NS, tag);
    for (const [key, value] of Object.entries(attributes || {})) element.setAttribute(key, value);
    if (parent) parent.appendChild(element);
    return element;
  };
  let nextId = 0;

  // Each path follows a separate painted region of the supplied character art.
  // A little overlap at the shoulders and hips keeps the joints filled in motion.
  const designs = {
    WishBearGigi: {
      image: 'uploads/wishgigi.png', size: [197, 299], center: 99,
      ground: 291, neck: [103, 161], hips: [[105, 232], [83, 232]],
      waist: [99, 231], arms: [[63, 176], [115, 175]],
      propAt: [151, 229], capPivot: [100, 98],
      shoulder: [116, 182, 16, 20], shoulderFill: '#60bfc3',
      armScale: [.80, .89], elbows: [[-12, 22], [19, 19]],
      torsoShape: 'M70 158 C56 164 51 182 54 208 L57 232 Q87 246 123 234 L130 196 C127 172 108 156 70 158 Z',
      collar: [91, 166], star: [98, 204, 13],
      eyeFill: ['#bd3d4d', '#a03340'],
      eyes: [
        ['M78 102 Q105 99 139 105 L137 138 Q112 150 82 128 Z', 'M83 128 Q109 139 135 123'],
        ['M137 107 Q151 104 162 111 L158 140 Q148 149 137 131 Z', 'M139 128 Q149 137 159 124']
      ],
      bodyParts: [
        ['legBack', 'M96 227 L132 227 L119 270 L111 287 L87 287 L88 262 Z'],
        ['legFront', 'M70 226 L103 225 L112 267 L105 289 L72 294 L65 276 Z'],
        ['pack', 'M53 155 L77 160 L81 183 L72 202 L76 223 L43 227 L28 207 L36 181 Z']
      ],
      headParts: [
        ['earLeft', 'M57 0 H109 L109 48 L60 48 Z'],
        ['earRight', 'M111 1 H149 L149 50 L111 50 Z'],
        ['head', 'M27 88 H165 L160 136 Q150 160 113 168 L75 168 Q29 157 27 119 Z'],
        ['cap', 'M27 34 H165 V112 H27 Z']
      ]
    }
  };

  function gradient(defs, id, stops) {
    const fill = node('linearGradient', { id, x1: '8%', y1: '4%', x2: '92%', y2: '96%' }, defs);
    stops.forEach(([offset, color]) => node('stop', { offset, 'stop-color': color }, fill));
    return `url(#${id})`;
  }

  function starPath(cx, cy, r) {
    const points = [];
    for (let i = 0; i < 10; i++) {
      const angle = -Math.PI / 2 + i * Math.PI / 5;
      const radius = i % 2 ? r * .47 : r;
      points.push(`${(cx + Math.cos(angle) * radius).toFixed(1)} ${(cy + Math.sin(angle) * radius).toFixed(1)}`);
    }
    return `M${points.join(' L')}Z`;
  }

  function drawTorso(parent, design, paint, wish) {
    node('path', { d: design.torsoShape, fill: paint.sweater, stroke: '#59aeb6', 'stroke-width': 1.4 }, parent);
    const [cx, cy] = design.collar;
    node('ellipse', { cx, cy, rx: wish ? 21 : 27, ry: wish ? 8 : 10, fill: wish ? '#54b8bf' : '#4ba8ae' }, parent);
    for (let i = -1; i <= 1; i++) {
      node('ellipse', { cx: cx + i * (wish ? 11 : 14), cy: cy + (wish ? 5 : 6), rx: wish ? 9 : 11, ry: wish ? 5 : 6, fill: paint.sleeve }, parent);
    }
    if (wish) {
      node('path', { d: 'M69 171 Q91 179 114 171', fill: 'none', stroke: '#f5d65b', 'stroke-width': 6, 'stroke-linecap': 'round' }, parent);
      node('path', { d: 'M62 216 Q87 226 119 220', fill: 'none', stroke: '#f5df78', 'stroke-width': 4, opacity: .6 }, parent);
    }
    const [x, y, radius] = design.star;
    node('path', { d: starPath(x, y, radius), fill: '#fff286', stroke: wish ? '#e7bc54' : '#e9db6c', 'stroke-width': 1.5, 'stroke-linejoin': 'round' }, parent);
    node('path', { d: `M${x - radius * .25} ${y - radius * .48} Q${x} ${y - radius * .85} ${x + radius * .2} ${y - radius * .25}`, fill: 'none', stroke: '#fffbd2', 'stroke-width': 2.2, 'stroke-linecap': 'round', opacity: .8 }, parent);
    node('path', { d: wish ? 'M58 228 Q87 242 123 231' : 'M90 276 Q120 286 152 276', fill: 'none', stroke: '#2d929e', 'stroke-width': wish ? 4 : 5, opacity: .55, 'stroke-linecap': 'round' }, parent);
  }

  function drawArm(parent, design, index, paint, wish) {
    const front = index === 1;
    const [x, y] = design.arms[index];
    const scale = design.armScale[index];
    const [ex, ey] = design.elbows[index];
    const outer = node('g', {}, parent);
    const local = node('g', { transform: `translate(${x} ${y}) scale(${scale})` }, outer);
    const upperPath = front
      ? 'M-11 -5 C2 -14 20 -8 30 5 Q38 16 35 31 L17 38 Q5 25 -10 22 Q-17 10 -11 -5 Z'
      : 'M-12 -5 Q-25 -2 -27 14 Q-29 30 -16 38 L1 34 Q8 25 10 8 Q8 -7 -12 -5 Z';
    node('path', { d: upperPath, fill: paint.sleeve, stroke: '#59abb5', 'stroke-width': 1.5, 'stroke-linejoin': 'round' }, local);
    node('path', {
      d: front ? 'M-6 -4 Q12 -9 25 8 Q31 15 28 20' : 'M-13 -2 Q-24 8 -20 22',
      fill: 'none', stroke: '#d0ffff', 'stroke-width': 4, opacity: .35, 'stroke-linecap': 'round'
    }, local);
    const elbow = node('g', {}, local);
    if (wish) node('ellipse', { cx: 0, cy: 0, rx: front ? 18 : 16, ry: 9, fill: '#f3d45c', stroke: '#d6b645', 'stroke-width': 1 }, elbow);
    const mittenPath = front
      ? 'M-12 -10 C2 -16 22 -12 29 7 C35 21 37 39 30 55 Q27 65 14 62 Q1 69 -10 60 Q-20 54 -18 39 L-18 13 Q-18 -3 -12 -10 Z'
      : 'M-10 -8 C3 -14 22 -8 29 4 C36 18 29 32 16 34 Q5 40 -6 33 Q-19 29 -19 15 Q-19 0 -10 -8 Z';
    node('path', { d: mittenPath, fill: paint.mitten, stroke: '#54abb5', 'stroke-width': 1.5, 'stroke-linejoin': 'round' }, elbow);
    node('path', {
      d: front ? 'M-9 -3 Q2 -13 17 -4 Q26 2 27 14' : 'M-11 0 Q0 -9 17 0',
      fill: 'none', stroke: '#dcffff', 'stroke-width': 5, opacity: .33, 'stroke-linecap': 'round'
    }, elbow);
    const seam = front ? ['M-9 49 Q-4 57 -2 61', 'M4 52 Q8 61 12 63', 'M18 50 Q22 57 24 57']
      : ['M-6 22 Q-3 30 1 33', 'M10 22 Q13 30 17 32'];
    seam.forEach(path => node('path', { d: path, fill: 'none', stroke: '#489fac', 'stroke-width': 1.6, opacity: .46, 'stroke-linecap': 'round' }, elbow));
    if (wish) node('path', { d: front ? 'M-15 5 Q4 -2 26 8' : 'M-15 5 Q2 -1 22 6', fill: 'none', stroke: '#f6dd75', 'stroke-width': 2.4, opacity: .8, 'stroke-linecap': 'round' }, elbow);
    return { outer, elbow, elbowAt: [ex, ey] };
  }

  class Spring {
    constructor(value = 0) { this.value = value; this.velocity = 0; }
    step(target, dt, stiffness = 170, damping = 19) {
      const steps = Math.max(1, Math.ceil(dt / .008));
      const h = dt / steps;
      for (let i = 0; i < steps; i++) {
        this.velocity += (target - this.value) * stiffness * h;
        this.velocity *= Math.exp(-damping * h);
        this.value += this.velocity * h;
      }
      return this.value;
    }
  }

  class GigiRig {
    constructor(host, design, wish) {
      this.design = design;
      this.wish = wish;
      this.time = Math.random() * 10;
      this.phase = 0;
      this.travel = new Spring();
      this.hit = new Spring();
      this.bob = new Spring();
      this.head = new Spring();
      this.armBack = new Spring();
      this.armFront = new Spring();
      this.armBackElbow = new Spring();
      this.armFrontElbow = new Spring();
      this.legBack = new Spring();
      this.legFront = new Spring();
      this.torso = new Spring();
      this.pack = new Spring();
      this.hat = new Spring();
      this.ears = new Spring();
      this.nextBlink = 2 + Math.random() * 2;
      this.blinkTime = -1;
      this.previousHit = 0;
      const [width, height] = design.size;
      const id = `gigi-rig-${++nextId}`;
      const svg = node('svg', { viewBox: `0 0 ${width} ${height}`, class: 'rig-svg', 'aria-hidden': 'true' }, host);
      const defs = node('defs', {}, svg);
      this.root = node('g', {}, svg);
      this.parts = {};
      const url = (typeof ASSET === 'string' ? ASSET : './') + design.image;
      const addPiece = (name, path, parent) => {
        const clipId = `${id}-${name}`;
        node('path', { d: path }, node('clipPath', { id: clipId, clipPathUnits: 'userSpaceOnUse' }, defs));
        const group = node('g', {}, parent);
        node('image', { href: url, width, height, 'clip-path': `url(#${clipId})` }, group);
        this.parts[name] = group;
        return group;
      };
      design.bodyParts.filter(([name]) => name.startsWith('leg')).forEach(([name, path]) => addPiece(name, path, this.root));
      node('ellipse', {
        cx: design.waist[0], cy: design.waist[1], rx: wish ? 21 : 25, ry: wish ? 14 : 17,
        fill: wish ? '#c99830' : '#8f2834'
      }, this.root);
      // The entire upper body turns around one waist joint. The head and
      // arms then turn inside it, keeping their shoulders connected.
      this.upper = node('g', {}, this.root);
      design.bodyParts.filter(([name]) => !name.startsWith('leg')).forEach(([name, path]) => addPiece(name, path, this.upper));
      const paint = {
        sweater: gradient(defs, `${id}-sweater`, [['0%', '#9ce3e2'], ['52%', '#6fc9ce'], ['100%', '#3e9da9']]),
        sleeve: gradient(defs, `${id}-sleeve`, [['0%', '#aae7e8'], ['52%', '#75cdd1'], ['100%', '#4baeb9']]),
        mitten: gradient(defs, `${id}-mitten`, [['0%', '#bef2ef'], ['48%', '#82d3d6'], ['100%', '#4bafba']])
      };
      drawTorso(this.upper, design, paint, wish);
      node('ellipse', {
        cx: design.shoulder[0], cy: design.shoulder[1],
        rx: design.shoulder[2], ry: design.shoulder[3], fill: design.shoulderFill
      }, this.upper);
      const backArm = drawArm(this.upper, design, 0, paint, wish);
      this.parts.armBack = backArm.outer;
      this.backElbowNode = backArm.elbow;
      this.headJoint = node('g', {}, this.upper);
      const skinGradient = node('linearGradient', {
        id: `${id}-skin`, gradientUnits: 'userSpaceOnUse',
        x1: wish ? 70 : 105, y1: wish ? 100 : 119,
        x2: wish ? 158 : 198, y2: wish ? 151 : 164
      }, defs);
      node('stop', { offset: 0, 'stop-color': design.eyeFill[0] }, skinGradient);
      node('stop', { offset: 1, 'stop-color': design.eyeFill[1] }, skinGradient);
      design.headParts.forEach(([name, path]) => {
        if (name === 'cap') {
          this.blink = node('g', { opacity: 0 }, this.headJoint);
          design.eyes.forEach(([patch, line]) => {
            node('path', { d: patch, fill: `url(#${id}-skin)` }, this.blink);
            node('path', { d: line, fill: 'none', stroke: '#201518', 'stroke-width': wish ? 2.8 : 3.2, 'stroke-linecap': 'round' }, this.blink);
          });
        }
        addPiece(name, path, this.headJoint);
      });
      const frontArm = drawArm(this.upper, design, 1, paint, wish);
      this.parts.armFront = frontArm.outer;
      this.frontElbowNode = frontArm.elbow;
      this.lidItem = node('g', { opacity: 0 }, this.upper);
      this.lidItemImage = node('image', { href: itemUrl('Gumballs'), x: -21, y: -21, width: 42, height: 42 }, this.lidItem);
      this.lastLidItem = null;
      // The capsule follows the wrist, not just the shoulder.
      const [px, py] = design.propAt;
      const [sx, sy] = design.arms[1];
      const [ex, ey] = design.elbows[1];
      this.prizeAt = wish ? [(px - sx) / design.armScale[1] - ex, (py - sy) / design.armScale[1] - ey] : [65, 0];
      this.prize = node('g', { opacity: 0 }, this.frontElbowNode);
      const capsule = node('g', { transform: `translate(${this.prizeAt[0]} ${this.prizeAt[1]})` }, this.prize);
      node('circle', { r: wish ? 11 : 10, fill: wish ? '#fce77b' : '#f9e4f5', stroke: wish ? '#d69b3e' : '#b94d69', 'stroke-width': 2.5 }, capsule);
      if (wish) {
        node('path', { d: 'M0 -7 L1.7 -2.2 L7 -2.2 L2.7 .8 L4.3 6 L0 2.8 L-4.3 6 L-2.7 .8 L-7 -2.2 L-1.7 -2.2Z', fill: '#fffdf1' }, capsule);
      } else {
        node('path', { d: 'M-9 0 H9', stroke: '#b94d69', 'stroke-width': 2 }, capsule);
        node('circle', { cy: -4.3, r: 2.1, fill: '#fff' }, capsule);
      }
      this.sparkles = [];
      for (let i = 0; i < 4; i++) {
        const star = node('path', { d: 'M0 -8 L2 -2 L8 0 L2 2 L0 8 L-2 2 L-8 0 L-2 -2 Z', fill: wish ? '#ffeb80' : '#a9e8ef', opacity: 0 }, this.frontElbowNode);
        this.sparkles.push(star);
      }
    }

    turn(name, angle, pivot) {
      const part = this.parts[name];
      if (part) part.setAttribute('transform', `rotate(${angle.toFixed(2)} ${pivot[0]} ${pivot[1]})`);
    }

    update(unit, elapsed, battle) {
      const dt = clamp(elapsed || 0, 0, .05);
      if (!dt) return;
      const D = this.design;
      this.time += dt;
      const moving = !!unit.moving;
      const speed = Math.hypot(unit.vx || 0, unit.vy || 0);
      const run = this.travel.step(moving ? 1 : 0, dt, 130, 19);
      this.phase += dt * (8 + Math.min(speed, 130) * .055);
      const stride = Math.sin(this.phase);
      const step = Math.cos(this.phase);
      const sway = Math.sin(this.time * (this.wish ? 2.25 : 1.9));
      const breath = Math.sin(this.time * 3.4);
      const action = unit.animT > 0 ? unit.animState : unit.casting ? 'cast' : '';
      const progress = unit.animT > 0 ? 1 - clamp(unit.animT / Math.max(unit.animDur || 1, .01), 0, 1) : .45;
      unit._rigBattleTime = battle ? battle.t : (unit._rigBattleTime || 0) + dt;
      if (unit._gigiLidItem !== this.lastLidItem) {
        this.lastLidItem = unit._gigiLidItem;
        this.lidItemImage.setAttribute('href', itemUrl(this.lastLidItem));
      }
      const wind = action === 'wind' ? pulse(progress) : 0;
      const pull = action === 'attack' ? segment(.02, .25, progress) * (1 - segment(.31, .48, progress)) : 0;
      const throwPose = action === 'attack' ? segment(.25, .43, progress) * (1 - segment(.72, .98, progress)) : 0;
      const charge = action === 'cast' ? (unit.casting && !unit.animT ? .55 : segment(.03, .27, progress) * (1 - segment(.66, .91, progress))) : 0;
      const release = action === 'cast' && unit.animT > 0 ? segment(.36, .57, progress) * (1 - segment(.87, 1, progress)) : 0;
      const spin = action === 'spin' ? pulse(progress) : 0;
      const hop = this.wish ? release * 10 : release * 6;
      const impact = unit.hitT || 0;
      if (impact > this.previousHit + .02) this.hit.velocity = -125;
      this.previousHit = impact;
      const recoil = this.hit.step(0, dt, 105, 14);
      const stunned = unit.visualStun ? Math.sin(this.time * 13) * 6 : 0;
      const sleeping = unit.visualSleep ? 1 : 0;
      const actionWeight = Math.max(wind, pull, throwPose, charge, release, spin);
      const idle = 1 - clamp(Math.max(run, actionWeight), 0, 1);
      const fidget = pulse((this.time % 6 - 4.6) / .65) * idle;
      const torsoAngle = this.torso.step(sway * 1.1 * idle + step * 2.4 * run - 6 * wind - 7 * pull + 9 * throwPose - 4 * charge + 7 * release + 5 * spin + recoil * .2, dt);
      const headAngle = this.head.step(-sway * 2 * idle - stride * 2.2 * run - 7 * wind + 5 * throwPose - 8 * charge + 5 * release + 9 * spin + recoil * .48 + stunned + sleeping * 11 - 3 * fidget, dt);
      const armBackAngle = this.armBack.step(this.wish
        ? -3 + sway * 3 * idle + stride * 17 * run + 17 * wind + 16 * pull - 14 * throwPose - 49 * charge - 16 * release - 35 * spin + 9 * fidget + sleeping * 7
        : -55 + sway * 2 * idle - stride * 12 * run - 10 * wind - 8 * pull + 16 * throwPose + 35 * charge + 15 * release + 28 * spin + 5 * fidget + sleeping * 5, dt);
      const armFrontAngle = this.armFront.step(this.wish
        ? 2 - sway * 3 * idle - stride * 18 * run + 24 * wind + 27 * pull - 62 * throwPose - 70 * charge - 24 * release - 50 * spin - 8 * fidget + sleeping * 6
        : 56 - sway * 2 * idle + stride * 13 * run + 18 * wind + 10 * pull - 53 * throwPose - 104 * charge - 19 * release - 74 * spin - 6 * fidget + sleeping * 5, dt);
      const backElbowAngle = this.armBackElbow.step(this.wish
        ? -5 + stride * 7 * run + 13 * pull - 12 * throwPose - 18 * charge + 10 * release + 8 * fidget
        : 4 + stride * 6 * run + 5 * wind + 8 * pull - 10 * throwPose - 7 * charge + 5 * release + 4 * fidget, dt);
      const frontElbowAngle = this.armFrontElbow.step(this.wish
        ? 5 - stride * 9 * run + 12 * wind - 20 * pull + 19 * throwPose - 35 * charge - 15 * release - 7 * fidget
        : 2 - stride * 8 * run + 9 * wind + 12 * pull - 13 * throwPose - 13 * charge - 8 * release - 4 * fidget, dt);
      const legBackAngle = this.legBack.step(-stride * 18 * run + 6 * wind - 7 * throwPose + 7 * release, dt);
      const legFrontAngle = this.legFront.step(stride * 18 * run - 6 * wind + 7 * throwPose - 7 * release, dt);
      const packAngle = this.pack.step(-sway * 1.5 * idle + stride * 3 * run + 6 * release, dt, 85, 12);
      const hatAngle = this.hat.step(sway * .8 * idle - step * 1.8 * run + 2.5 * pull - 3 * throwPose + 3 * release + recoil * .15, dt, 85, 12);
      const earAngle = this.ears.step(-sway * 2 * idle + step * 3 * run + 5 * release + 3 * spin, dt, 65, 10);
      const legLiftBack = Math.max(0, step) * 3.8 * run;
      const legLiftFront = Math.max(0, -step) * 3.8 * run;
      const bob = this.bob.step(breath * 1.2 * idle - Math.abs(stride) * (this.wish ? 4 : 3) * run + 3 * wind + 3 * pull - hop + recoil * 1.2, dt);
      const squash = 1 + .025 * wind + .045 * pull - .055 * release + Math.abs(recoil) * .002;
      this.root.setAttribute('transform', `translate(0 ${bob.toFixed(2)}) translate(${D.center} ${D.ground}) scale(${(2 - squash).toFixed(3)} ${squash.toFixed(3)}) translate(${-D.center} ${-D.ground})`);
      this.parts.legBack.setAttribute('transform', `translate(0 ${(-legLiftBack).toFixed(2)}) rotate(${legBackAngle.toFixed(2)} ${D.hips[0].join(' ')})`);
      this.parts.legFront.setAttribute('transform', `translate(0 ${(-legLiftFront).toFixed(2)}) rotate(${legFrontAngle.toFixed(2)} ${D.hips[1].join(' ')})`);
      this.upper.setAttribute('transform', `rotate(${torsoAngle.toFixed(2)} ${D.waist.join(' ')})`);
      this.turn('pack', packAngle, [60, 178]);
      this.turn('armBack', armBackAngle, D.arms[0]);
      this.backElbowNode.setAttribute('transform', `translate(${D.elbows[0].join(' ')}) rotate(${backElbowAngle.toFixed(2)})`);
      this.headJoint.setAttribute('transform', `rotate(${headAngle.toFixed(2)} ${D.neck.join(' ')})`);
      if (unit._gigiLidUntil > unit._rigBattleTime && unit.animStyle === 'gigiWheel') {
        itemMotion(this.lidItem, unit, this.time, progress, [D.capPivot[0], D.capPivot[1] - 7], [D.propAt[0] - 4, D.propAt[1] - 29], 28, this.parts.cap);
      } else {
        this.lidItem.setAttribute('opacity', 0);
        this.turn('cap', hatAngle, D.capPivot);
      }
      if (this.wish) {
        this.turn('earLeft', earAngle, [84, 41]);
        this.turn('earRight', -earAngle * .75, [130, 45]);
      }
      this.turn('armFront', armFrontAngle, D.arms[1]);
      this.frontElbowNode.setAttribute('transform', `translate(${D.elbows[1].join(' ')}) rotate(${frontElbowAngle.toFixed(2)})`);
      this.nextBlink -= dt;
      if (this.nextBlink <= 0 && this.blinkTime < 0) {
        this.blinkTime = 0;
        this.nextBlink = 2.4 + Math.random() * 2.2;
      }
      if (this.blinkTime >= 0) this.blinkTime += dt;
      const blink = sleeping ? 1 : this.blinkTime >= 0 ? pulse(this.blinkTime / .17) : 0;
      if (this.blinkTime > .17) this.blinkTime = -1;
      this.blink.setAttribute('opacity', blink.toFixed(2));
      const showPrize = unit._gigiLidUntil > unit._rigBattleTime && unit.animStyle === 'gigiWheel'
        ? 0 : Math.max(throwPose * (1 - segment(.57, .83, progress)), charge * .65, release, spin);
      this.prize.setAttribute('opacity', clamp(showPrize, 0, 1).toFixed(2));
      const [px, py] = this.prizeAt;
      this.prize.setAttribute('transform', `translate(${(release * 7 + throwPose * 5).toFixed(1)} ${(-release * 18 - throwPose * 6).toFixed(1)}) rotate(${(this.time * 120).toFixed(1)} ${this.prizeAt.join(' ')})`);
      this.sparkles.forEach((star, index) => {
        const amount = Math.max(release, spin, throwPose * .45);
        const angle = this.time * 1.7 + index * Math.PI / 2;
        const radius = (this.wish ? 34 : 28) + 6 * Math.sin(this.time * 4 + index);
        star.setAttribute('opacity', (clamp(amount, 0, 1) * (.55 + .35 * Math.sin(this.time * 7 + index))).toFixed(2));
        star.setAttribute('transform', `translate(${(px + Math.cos(angle) * radius).toFixed(1)} ${(py - 38 + Math.sin(angle) * radius).toFixed(1)}) scale(${(this.wish ? .9 : .65).toFixed(2)})`);
      });
    }
  }

  // The battle renderer expects source art to face right. Use Gigi's original
  // transparent side view; the straight-on reference screenshot contains
  // grain and chromatic fringes that become conspicuous in motion.
  class ReferenceGigiRig {
    constructor(host) {
      this.time = 0;
      this.phase = 0;
      this.travel = new Spring();
      this.head = new Spring();
      this.body = new Spring();
      this.leftArm = new Spring();
      this.rightArm = new Spring();
      this.leftElbow = new Spring();
      this.rightElbow = new Spring();
      this.leftLeg = new Spring();
      this.rightLeg = new Spring();
      this.bob = new Spring();
      this.hit = new Spring();
      this.previousHit = 0;
      const id = `gigi-model-${++nextId}`;
      const svg = node('svg', { viewBox: '0 0 260 372', class: 'rig-svg', 'aria-hidden': 'true' }, host);
      const defs = node('defs', {}, svg);
      const url = (typeof ASSET === 'string' ? ASSET : './') + 'Characters/Gigi/Gigi.png';
      const piece = (name, path, parent) => {
        const clip = `${id}-${name}`;
        node('path', { d: path }, node('clipPath', { id: clip, clipPathUnits: 'userSpaceOnUse' }, defs));
        const group = node('g', {}, parent);
        node('image', { href: url, width: 260, height: 372, 'clip-path': `url(#${clip})` }, group);
        return group;
      };
      this.root = node('g', {}, svg);
      this.legLeft = piece('leg-left', 'M88 258 H124 V372 H88 Z', this.root);
      this.legRight = piece('leg-right', 'M118 258 H154 V372 H118 Z', this.root);
      this.upper = node('g', {}, this.root);
      this.leftShoulder = node('g', {}, this.upper);
      piece('arm-left-upper', 'M81 204 H129 V258 H81 Z', this.leftShoulder);
      this.leftForearm = node('g', {}, this.leftShoulder);
      piece('arm-left-mitten', 'M110 218 H158 V264 H110 Z', this.leftForearm);
      // Fill only the body hidden by the original crossed arms. The visible
      // sweater pixels come from the original sprite, including its shading.
      node('path', {
        d: 'M102 209 Q91 218 91 242 L94 264 Q105 281 140 279 L151 264 L147 218 Z',
        fill: '#69bec5'
      }, this.upper);
      piece('torso', 'M102 201 H149 V282 H100 L96 258 L98 228 Z', this.upper);
      piece('collar', 'M87 190 H154 V220 H87 Z', this.upper);
      this.rightShoulder = node('g', {}, this.upper);
      piece('arm-right-upper', 'M136 205 H201 V265 H136 Z', this.rightShoulder);
      this.rightForearm = node('g', {}, this.rightShoulder);
      piece('arm-right-mitten', 'M151 239 H210 V313 H151 Z', this.rightForearm);
      this.headArt = piece('head', 'M38 91 H204 V204 H38 Z', this.upper);
      node('ellipse', { cx: 120, cy: 93, rx: 70, ry: 13, fill: '#763444' }, this.upper);
      this.capArt = piece('cap', 'M38 24 H204 V113 H38 Z', this.upper);
      this.lidItem = node('g', { opacity: 0 }, this.upper);
      this.lidItemImage = node('image', { href: itemUrl('Gumballs'), x: -22, y: -22, width: 44, height: 44 }, this.lidItem);
      this.lastLidItem = null;
      this.sparkles = [];
      for (let i = 0; i < 3; i++) {
        const star = node('path', {
          d: 'M0 -7 L1.8 -1.8 L7 0 L1.8 1.8 L0 7 L-1.8 1.8 L-7 0 L-1.8 -1.8 Z',
          fill: '#fff2a4', opacity: 0
        }, this.upper);
        this.sparkles.push(star);
      }
    }

    update(unit, elapsed, battle) {
      const dt = clamp(elapsed || 0, 0, .05);
      if (!dt) return;
      this.time += dt;
      const speed = Math.hypot(unit.vx || 0, unit.vy || 0);
      const run = this.travel.step(unit.moving ? 1 : 0, dt, 130, 19);
      this.phase += dt * (7 + Math.min(130, speed) * .05);
      const stride = Math.sin(this.phase);
      const action = unit.animT > 0 ? unit.animState : unit.casting ? 'cast' : '';
      const progress = unit.animT > 0 ? 1 - clamp(unit.animT / Math.max(.01, unit.animDur || 1), 0, 1) : .45;
      unit._rigBattleTime = battle ? battle.t : (unit._rigBattleTime || 0) + dt;
      if (unit._gigiLidItem !== this.lastLidItem) {
        this.lastLidItem = unit._gigiLidItem;
        this.lidItemImage.setAttribute('href', itemUrl(this.lastLidItem));
      }
      const wind = action === 'wind' ? pulse(progress) : 0;
      const pull = action === 'attack' ? segment(.02, .25, progress) * (1 - segment(.31, .48, progress)) : 0;
      const throwPose = action === 'attack' ? segment(.25, .43, progress) * (1 - segment(.72, .98, progress)) : 0;
      const charge = action === 'cast' ? (unit.casting && !unit.animT ? .5 : segment(.03, .27, progress) * (1 - segment(.67, .9, progress))) : 0;
      const release = action === 'cast' && unit.animT > 0 ? segment(.36, .57, progress) * (1 - segment(.87, 1, progress)) : 0;
      const spin = action === 'spin' ? pulse(progress) : 0;
      if ((unit.hitT || 0) > this.previousHit + .02) this.hit.velocity = -140;
      this.previousHit = unit.hitT || 0;
      const recoil = this.hit.step(0, dt, 110, 15);
      const idle = 1 - clamp(Math.max(run, wind, pull, throwPose, charge, release, spin), 0, 1);
      const sway = Math.sin(this.time * 2.1);
      const body = this.body.step(sway * 1.2 * idle + stride * 2.5 * run - 5 * wind + 7 * throwPose - 4 * charge + 7 * release + recoil * .24, dt);
      const head = this.head.step(-sway * 2 * idle - stride * 2 * run - 7 * wind + 6 * throwPose - 5 * charge + 6 * release + recoil * .4 + (unit.visualSleep ? 9 : 0), dt);
      const left = this.leftArm.step(sway * 2 * idle - stride * 12 * run - 9 * wind + 12 * throwPose + 20 * charge + 14 * release + 16 * spin, dt);
      const right = this.rightArm.step(-sway * 2 * idle + stride * 12 * run + 14 * wind + 13 * pull - 29 * throwPose - 52 * charge - 14 * release - 30 * spin, dt);
      const leftElbow = this.leftElbow.step(2 + stride * 6 * run + 4 * wind - 7 * throwPose - 7 * charge, dt);
      const rightElbow = this.rightElbow.step(-2 - stride * 7 * run + 8 * pull - 9 * throwPose - 12 * charge - 8 * release, dt);
      const legLeft = this.leftLeg.step(stride * 18 * run - 6 * throwPose + 7 * release, dt);
      const legRight = this.rightLeg.step(-stride * 18 * run + 6 * throwPose - 7 * release, dt);
      const bob = this.bob.step(Math.sin(this.time * 3.4) * 1.2 * idle - Math.abs(stride) * 3 * run + 3 * wind - 8 * release + recoil, dt);
      const squash = 1 + .03 * pull - .045 * release;
      this.root.setAttribute('transform', `translate(0 ${bob.toFixed(2)}) translate(121 364) scale(${(2 - squash).toFixed(3)} ${squash.toFixed(3)}) translate(-121 -364)`);
      this.legLeft.setAttribute('transform', `rotate(${legLeft.toFixed(2)} 107 276)`);
      this.legRight.setAttribute('transform', `rotate(${legRight.toFixed(2)} 131 276)`);
      this.upper.setAttribute('transform', `rotate(${body.toFixed(2)} 120 273)`);
      this.headArt.setAttribute('transform', `rotate(${head.toFixed(2)} 121 190)`);
      itemMotion(this.lidItem, unit, this.time, progress, [120, 83], [172, 234], 34, this.capArt);
      this.leftShoulder.setAttribute('transform', `rotate(${left.toFixed(2)} 107 215)`);
      this.leftForearm.setAttribute('transform', `rotate(${leftElbow.toFixed(2)} 116 234)`);
      this.rightShoulder.setAttribute('transform', `rotate(${right.toFixed(2)} 148 217)`);
      this.rightForearm.setAttribute('transform', `rotate(${rightElbow.toFixed(2)} 176 252)`);
      const light = Math.max(release, spin, throwPose * .45);
      this.sparkles.forEach((star, index) => {
        const angle = this.time * 2 + index * Math.PI * 2 / 3;
        star.setAttribute('opacity', (light * (.55 + .25 * Math.sin(this.time * 8 + index))).toFixed(2));
        star.setAttribute('transform', `translate(${(194 + Math.cos(angle) * 24).toFixed(1)} ${(241 + Math.sin(angle) * 22).toFixed(1)}) scale(.55)`);
      });
    }
  }

  const enabled = () => {
    try { return !!(Save && Save.data && Save.data.opt && Save.data.opt.animatedChars === true); }
    catch (_) { return true; }
  };
  return {
    Gigi: { enabled, create: host => new ReferenceGigiRig(host) },
    WishBearGigi: { enabled, create: host => new GigiRig(host, designs.WishBearGigi, true) }
  };
})();
