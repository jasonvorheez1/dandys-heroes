/* ============================================================================
 *  JessieRig — 3/4-Right 2.5D Cutout Puppet + 3D-Baked Expression Plates
 *  ----------------------------------------------------------------------------
 *  Articulated battle rig for Jessie Platter (Dandy's World: Modded).
 *  Uses cohesive 3/4-right 3D-rendered body layers and 7 3D-baked UV facial
 *  expression plates (smug, happy, wink, shocked, unamused, annoyed, blink)
 *  underneath her articulated green lettuce hair bang, driven by critically
 *  damped springs.
 * ============================================================================ */
'use strict';

var JessieRig = (function () {
  var NS = 'http://www.w3.org/2000/svg';
  var XLINK = 'http://www.w3.org/1999/xlink';

  var SHEET = 'assets/toon-art/Jessie/jessie-rig.png';
  var SW = 1024, SH = 620;
  var VW = 460, VH = 500;

  // [sx, sy, sw, sh, dx, dy] in 460x500 viewBox space
  var ATLAS = {
    bunL:          [0, 0, 190, 317, 0, 39],
    bunR:          [192, 0, 212, 316, 196, 45],
    legFar:        [637, 0, 80, 187, 199, 279],
    legNear:       [719, 0, 81, 187, 179, 278],
    armFar:        [0, 319, 85, 167, 230, 212],
    torso:         [160, 488, 56, 100, 200, 208],
    skirt:         [326, 488, 127, 75, 167, 269],
    collar:        [218, 488, 106, 79, 177, 217],
    armNear:       [87, 319, 88, 162, 135, 210],
    head:          [406, 0, 229, 204, 117, 23],
    lettuce:       [802, 0, 169, 182, 224, 59],
    face_happy:    [177, 319, 158, 130, 158, 90],
    face_wink:     [337, 319, 158, 130, 158, 90],
    face_shocked:  [497, 319, 158, 130, 158, 90],
    face_unamused: [657, 319, 158, 130, 158, 90],
    face_annoyed:  [817, 319, 158, 130, 158, 90],
    face_blink:    [0, 488, 158, 130, 158, 90]
  };

  var FACE_KEYS = ['happy', 'wink', 'shocked', 'unamused', 'annoyed', 'blink'];

  // Joint pivots in 460x500 space (facing 3/4 right)
  var WAIST    = [230.0, 282.3];
  var NECK     = [229.4, 221.3];
  var SKIRT_P  = [230.0, 274.2];
  var COLLAR_P = [230.0, 229.4];
  var BUN_L    = [142.7, 114.2];
  var BUN_R    = [261.9, 117.4];
  var LETTUCE  = [278.9, 86.5];
  var ARM_NEAR = [205.0, 237.0];
  var ARM_FAR  = [252.6, 238.3];
  var LEG_NEAR = [217.5, 299.1];
  var LEG_FAR  = [241.6, 299.7];
  var GROUND   = 465.0;

  var uid = 0;

  function clamp(v, a, b) { return v < a ? a : (v > b ? b : v); }
  function lerp(a, b, t) { return a + (b - a) * t; }
  function ease(n) { n = clamp(n, 0, 1); return n * n * (3 - 2 * n); }
  function seg(a, b, t) { return ease((t - a) / Math.max(0.001, b - a)); }
  function pulse(t) { return Math.sin(clamp(t, 0, 1) * Math.PI); }

  function sheetUrl() {
    return (typeof ASSET === 'string' ? ASSET : './') + SHEET;
  }

  function el(tag, attrs, parent) {
    var e = document.createElementNS(NS, tag);
    if (attrs) {
      for (var k in attrs) {
        if (k === 'xlink:href') e.setAttributeNS(XLINK, 'href', attrs[k]);
        else e.setAttribute(k, attrs[k]);
      }
    }
    if (parent) parent.appendChild(e);
    return e;
  }

  function makePart(defs, parent, idPrefix, key) {
    var r = ATLAS[key];
    var cid = idPrefix + '-cp-' + key;
    var cp = el('clipPath', { id: cid, clipPathUnits: 'userSpaceOnUse' }, defs);
    el('rect', { x: r[4], y: r[5], width: r[2], height: r[3] }, cp);
    var g = el('g', { 'clip-path': 'url(#' + cid + ')' }, parent);
    var url = sheetUrl();
    el('image', {
      href: url,
      'xlink:href': url,
      x: r[4] - r[0],
      y: r[5] - r[1],
      width: SW,
      height: SH,
      preserveAspectRatio: 'none'
    }, g);
    return g;
  }

  function tf(node, x, y, deg, px, py, sx, sy) {
    var s = '';
    if (x || y) s += 'translate(' + x.toFixed(2) + ' ' + y.toFixed(2) + ') ';
    if (deg) s += 'rotate(' + deg.toFixed(2) + ' ' + px + ' ' + py + ') ';
    if ((sx !== undefined && sx !== 1) || (sy !== undefined && sy !== 1)) {
      var ux = sx === undefined ? 1 : sx;
      var uy = sy === undefined ? ux : sy;
      s += 'translate(' + px + ' ' + py + ') scale(' + ux.toFixed(3) + ' ' + uy.toFixed(3) + ') translate(' + (-px) + ' ' + (-py) + ')';
    }
    if (s) node.setAttribute('transform', s.trim());
    else node.removeAttribute('transform');
  }

  class Spring {
    constructor(x) {
      this.x = x || 0;
      this.v = 0;
    }
    step(target, dt, stiffness, damping) {
      var k = stiffness || 160;
      var d = damping || 19;
      var steps = Math.max(1, Math.ceil(dt / 0.008));
      var h = dt / steps;
      for (var i = 0; i < steps; i++) {
        this.v += (target - this.x) * k * h;
        this.v *= Math.exp(-d * h);
        this.x += this.v * h;
      }
      return this.x;
    }
  }

  function buildRadioProp(parent) {
    // Articulated Annoying Radio tucked slightly behind/beside Jessie at [122, 430]
    // so it frames her without blocking her forward-right action space.
    var wrap = el('g', { 'class': 'jessie-radio-prop' }, parent);
    var rig = el('g', null, wrap);

    var rShadow = el('ellipse', {
      cx: '122', cy: '463', rx: '38', ry: '8',
      fill: 'rgba(18,8,24,0.30)'
    }, rig);

    var auraG = el('g', { opacity: '0.65' }, rig);
    var ring1 = el('ellipse', {
      cx: '122', cy: '460', rx: '52', ry: '13',
      fill: 'none', stroke: '#ff4d79', 'stroke-width': '2.2', 'stroke-dasharray': '9 6'
    }, auraG);
    var ring2 = el('ellipse', {
      cx: '122', cy: '460', rx: '74', ry: '18',
      fill: 'none', stroke: '#7ae582', 'stroke-width': '1.8', 'stroke-dasharray': '6 8', opacity: '0.6'
    }, auraG);

    var body = el('g', null, rig);

    // Antenna (pivots at [142, 412])
    var antG = el('g', null, body);
    el('line', {
      x1: '142', y1: '414', x2: '156', y2: '372',
      stroke: '#d9e2ec', 'stroke-width': '3.2', 'stroke-linecap': 'round'
    }, antG);
    var antTip = el('circle', {
      cx: '156', cy: '370', r: '4.8',
      fill: '#ff3366', stroke: '#23151c', 'stroke-width': '2'
    }, antG);

    var wavesG = el('g', { opacity: '0' }, antG);
    el('path', {
      d: 'M 146,362 Q 156,352 166,362',
      fill: 'none', stroke: '#ffe66d', 'stroke-width': '2.4', 'stroke-linecap': 'round'
    }, wavesG);
    el('path', {
      d: 'M 140,355 Q 156,340 172,355',
      fill: 'none', stroke: '#ff4d79', 'stroke-width': '2.2', 'stroke-linecap': 'round'
    }, wavesG);

    // Handle
    el('path', {
      d: 'M 96,414 L 96,401 Q 122,394 148,401 L 148,414',
      fill: 'none', stroke: '#7ec850', 'stroke-width': '5.2', 'stroke-linecap': 'round', 'stroke-linejoin': 'round'
    }, body);
    el('path', {
      d: 'M 96,414 L 96,401 Q 122,394 148,401 L 148,414',
      fill: 'none', stroke: '#23151c', 'stroke-width': '2', 'stroke-linecap': 'round'
    }, body);

    // Boombox chassis
    el('rect', {
      x: '82', y: '412', width: '80', height: '48', rx: '10', ry: '10',
      fill: '#e0313c', stroke: '#23151c', 'stroke-width': '2.8'
    }, body);
    el('path', {
      d: 'M 84,420 Q 96,427 108,420 Q 122,428 136,420 Q 148,427 160,420 L 160,415 Q 160,412 153,412 L 91,412 Q 84,412 84,415 Z',
      fill: '#8bd450', stroke: '#23151c', 'stroke-width': '2'
    }, body);

    // Tuner window
    el('rect', {
      x: '110', y: '423', width: '24', height: '13', rx: '3',
      fill: '#1e1524', stroke: '#fff0d6', 'stroke-width': '1.5'
    }, body);
    var vu1 = el('rect', { x: '113', y: '428', width: '3.5', height: '6', fill: '#7ae582' }, body);
    var vu2 = el('rect', { x: '118', y: '425', width: '3.5', height: '9', fill: '#ffe66d' }, body);
    var vu3 = el('rect', { x: '123', y: '424', width: '3.5', height: '10', fill: '#ff4d79' }, body);
    var vu4 = el('rect', { x: '128', y: '427', width: '3.5', height: '7', fill: '#7ae582' }, body);

    var spkL = el('g', null, body);
    el('circle', { cx: '97', cy: '440', r: '12', fill: '#261822', stroke: '#fff0d6', 'stroke-width': '2.2' }, spkL);
    el('circle', { cx: '97', cy: '440', r: '4.8', fill: '#ff4d79' }, spkL);

    var spkR = el('g', null, body);
    el('circle', { cx: '147', cy: '440', r: '12', fill: '#261822', stroke: '#fff0d6', 'stroke-width': '2.2' }, spkR);
    el('circle', { cx: '147', cy: '440', r: '4.8', fill: '#ff4d79' }, spkR);

    var notesG = el('g', { opacity: '0' }, rig);
    var note1 = el('text', {
      x: '86', y: '390', fill: '#ff4d79', 'font-size': '20', 'font-weight': '900',
      stroke: '#23151c', 'stroke-width': '1'
    }, notesG);
    note1.textContent = '♪';
    var note2 = el('text', {
      x: '146', y: '378', fill: '#7ae582', 'font-size': '22', 'font-weight': '900',
      stroke: '#23151c', 'stroke-width': '1'
    }, notesG);
    note2.textContent = '♫';

    return {
      wrap: wrap, rig: rig, body: body, rShadow: rShadow,
      auraG: auraG, ring1: ring1, ring2: ring2,
      antG: antG, antTip: antTip, wavesG: wavesG,
      spkL: spkL, spkR: spkR,
      vu: [vu1, vu2, vu3, vu4],
      notesG: notesG, notes: [note1, note2]
    };
  }

  function buildRigDOM(idPrefix) {
    var svg = el('svg', {
      'class': 'rig-svg jessie-rig-svg',
      viewBox: '0 0 ' + VW + ' ' + VH,
      'aria-hidden': 'true',
      style: 'overflow:visible'
    });
    var defs = el('defs', null, svg);

    var spotGradId = idPrefix + '-spot-grad';
    var rg = el('radialGradient', { id: spotGradId, cx: '50%', cy: '50%', r: '50%' }, defs);
    el('stop', { offset: '0%', 'stop-color': '#ffe66d', 'stop-opacity': '0.48' }, rg);
    el('stop', { offset: '55%', 'stop-color': '#ff4d79', 'stop-opacity': '0.18' }, rg);
    el('stop', { offset: '100%', 'stop-color': '#ff4d79', 'stop-opacity': '0' }, rg);

    var shadow = el('ellipse', {
      cx: '230', cy: GROUND, rx: '86', ry: '15',
      fill: 'rgba(18,8,24,0.32)'
    }, svg);

    var spotFloor = el('ellipse', {
      cx: '230', cy: GROUND, rx: '120', ry: '24',
      fill: 'url(#' + spotGradId + ')', opacity: '0'
    }, svg);

    // Radio prop sits behind Jessie on her stage-right side
    var radio = buildRadioProp(svg);

    var root = el('g', null, svg);

    var backAura = el('g', { opacity: '0' }, root);
    el('circle', {
      cx: '230', cy: '250', r: '145',
      fill: 'url(#' + spotGradId + ')'
    }, backAura);

    // 1. Giant Croissant Twin-Tails (behind body & head)
    var bunL = el('g', null, root);
    makePart(defs, bunL, idPrefix, 'bunL');
    var bunR = el('g', null, root);
    makePart(defs, bunR, idPrefix, 'bunR');

    // 2. Cohesive Legs (thigh + strawberry flared leg-warmer + foot)
    var legFar = el('g', null, root);
    makePart(defs, legFar, idPrefix, 'legFar');
    var legNear = el('g', null, root);
    makePart(defs, legNear, idPrefix, 'legNear');

    // 3. Upper Body (pivots at WAIST)
    var upper = el('g', null, root);

    // Far arm (right side, behind torso) + seamless shoulder cap
    var armFar = el('g', null, upper);
    el('circle', { cx: ARM_FAR[0], cy: ARM_FAR[1], r: '9', fill: '#eac294' }, armFar);
    makePart(defs, armFar, idPrefix, 'armFar');

    // Torso, Skirt, Sailor Collar + Bow
    var torso = el('g', null, upper);
    // Short neck fill so head tilts never expose a gap
    el('path', { d: 'M216 205 H244 V228 H216 Z', fill: '#eac294' }, torso);
    makePart(defs, torso, idPrefix, 'torso');

    var skirt = el('g', null, upper);
    makePart(defs, skirt, idPrefix, 'skirt');

    var collar = el('g', null, upper);
    makePart(defs, collar, idPrefix, 'collar');

    // 4. Head + 3D-Baked Expression Plates + Lettuce Hair Bang
    var headG = el('g', null, upper);
    var headMesh = el('g', null, headG);
    makePart(defs, headMesh, idPrefix, 'head');

    // 3D-rendered face expression plates (placed on headMesh UNDERNEATH lettuce!)
    var facePlates = {};
    for (var i = 0; i < FACE_KEYS.length; i++) {
      var fk = FACE_KEYS[i];
      var fg = makePart(defs, headG, idPrefix, 'face_' + fk);
      fg.setAttribute('opacity', '0');
      facePlates[fk] = fg;
    }

    // Articulated green lettuce hair bang (on top of head & facePlates!)
    var lettuce = el('g', null, headG);
    makePart(defs, lettuce, idPrefix, 'lettuce');

    // Royal Crown (visible during Spotlight / Perfect Reception / Royal Broadcast)
    var crownG = el('g', { opacity: '0', transform: 'translate(226, 46) rotate(-4)' }, headG);
    el('path', {
      d: 'M -28,0 L -22,-24 L -9,-10 L 0,-28 L 9,-10 L 22,-24 L 28,0 Z',
      fill: '#ffd93d', stroke: '#23151c', 'stroke-width': '2.8', 'stroke-linejoin': 'round'
    }, crownG);
    el('circle', { cx: '0', cy: '-13', r: '4', fill: '#ff3366' }, crownG);

    // Near arm (left side, in front of torso so she can rest hand on hip or brush hair)
    var armNear = el('g', null, upper);
    el('circle', { cx: ARM_NEAR[0], cy: ARM_NEAR[1], r: '9', fill: '#f3cda0' }, armNear);
    makePart(defs, armNear, idPrefix, 'armNear');

    return {
      svg: svg,
      shadow: shadow,
      spotFloor: spotFloor,
      backAura: backAura,
      root: root,
      bunL: bunL,
      bunR: bunR,
      legFar: legFar,
      legNear: legNear,
      upper: upper,
      torso: torso,
      skirt: skirt,
      collar: collar,
      armFar: armFar,
      armNear: armNear,
      headG: headG,
      facePlates: facePlates,
      lettuce: lettuce,
      crownG: crownG,
      radio: radio
    };
  }

  function JessieRigInstance(host) {
    this.time = Math.random() * 5;
    this.walkPhase = 0;
    this.lastHit = 0;
    this.hurtT = 0;
    this.blinkT = 2.2 + Math.random() * 2.4;
    this.expr = 'smug';

    this.s = {
      move:    new Spring(0),
      x:       new Spring(0),
      y:       new Spring(0),
      lean:    new Spring(0),
      sx:      new Spring(1),
      sy:      new Spring(1),
      skirt:   new Spring(0),
      collar:  new Spring(0),
      head:    new Spring(0),
      headX:   new Spring(0),
      headY:   new Spring(0),
      lettuce: new Spring(0),
      letX:    new Spring(0),
      letY:    new Spring(0),
      bunL:    new Spring(0),
      bunR:    new Spring(0),
      armNear: new Spring(0),
      armFar:  new Spring(0),
      legNear: new Spring(0),
      legFar:  new Spring(0),
      liftNear:new Spring(0),
      liftFar: new Spring(0),
      recoil:  new Spring(0)
    };

    var idPrefix = 'jes-' + (++uid);
    this.R = buildRigDOM(idPrefix);
    this.svg = this.R.svg;
    if (host && typeof host.appendChild === 'function') {
      host.innerHTML = '';
      host.appendChild(this.R.svg);
    }
    this.el = host || this.R.svg;
  }

  JessieRigInstance.prototype.setExpression = function (mood) {
    if (mood === this.expr) return;
    this.expr = mood;
    var plates = this.R.facePlates;
    for (var i = 0; i < FACE_KEYS.length; i++) {
      var k = FACE_KEYS[i];
      plates[k].setAttribute('opacity', k === mood ? '1' : '0');
    }
  };

  JessieRigInstance.prototype.update = function (u, elapsed, battle) {
    var dt = clamp(elapsed || 0.016, 0, 0.05);
    if (!dt) return;
    this.time += dt;
    var t = this.time;
    var s = this.s;
    var R = this.R;

    var alive = u ? u.alive !== false : true;
    var moving = !!(u && u.moving && alive);
    var stunned = !!(u && (u.visualStun || u.stun > 0));
    var asleep = !!(u && (u.visualSleep || u.asleep > 0 || u.sleep > 0));

    // Check active Jessie buffs/statuses
    var hasSpotlight = false, hasUntouchable = false, hasAnnoyingRadio = false;
    var hasPerfectReception = false, hasRoyalBroadcast = false;
    var stsList = (u && (u.statuses || u.sts)) || [];
    for (var si = 0; si < stsList.length; si++) {
      var st = stsList[si];
      if (!st || (st.t !== undefined && st.t <= 0)) continue;
      if (st.id === 'jessie_spotlight') hasSpotlight = true;
      else if (st.id === 'jessie_untouchable') hasUntouchable = true;
      else if (st.id === 'jessie_radio_active') hasAnnoyingRadio = true;
      else if (st.id === 'jessie_perfect_reception') hasPerfectReception = true;
      else if (st.id === 'jessie_royal_broadcast') hasRoyalBroadcast = true;
    }

    // Hit recoil detection
    var hitNow = (u && u.hitT) || 0;
    if (hitNow > this.lastHit + 0.02) {
      s.recoil.v = -115;
      this.hurtT = 0.34;
    }
    this.lastHit = hitNow;
    this.hurtT = Math.max(0, this.hurtT - dt);
    var recoil = s.recoil.step(0, dt, 150, 17);

    // Smooth walk blend
    var run = s.move.step(moving && !stunned && !asleep ? 1 : 0, dt, 125, 18);
    var speed = u ? Math.hypot(u.vx || 0, u.vy || 0) : 0;
    this.walkPhase += dt * (7.8 + Math.min(speed, 140) * 0.042);
    var stride = Math.sin(this.walkPhase);
    var stepCos = Math.cos(this.walkPhase);

    // Active skill animation state
    var action = (u && u.animT > 0) ? u.animState : '';
    var style = (u && u.animT > 0 && u.animStyle) ? u.animStyle : '';
    var p = action ? 1 - clamp(u.animT / Math.max(0.01, u.animDur || 1), 0, 1) : 0;
    var acting = action ? 1 : 0;
    var calm = (1 - run) * (1 - acting) * (asleep ? 0 : 1);

    // 1. Poised, grounded Idle & Walk targets (zero random arm flailing!)
    var breath = Math.sin(t * 2.5);
    var sway = Math.sin(t * 1.7 + 0.6);

    var P = {
      x:       sway * 1.8 * calm + stepCos * 2.5 * run + recoil * 0.15,
      y:       breath * 2.2 * calm - Math.abs(stride) * 6.5 * run + recoil * 0.25,
      lean:    sway * 1.5 * calm + (4.5 + stepCos * 2.5) * run + recoil * 0.18,
      sx:      1 + breath * 0.01 * calm,
      sy:      1 - breath * 0.012 * calm,
      skirt:   -sway * 2.2 * calm + stride * 6.5 * run,
      collar:  sway * 1.2 * calm - Math.abs(stride) * 3.0 * run,
      head:    -breath * 2.0 * calm - stride * 3.2 * run + recoil * 0.28 + (asleep ? 11 : 0),
      headX:   0,
      headY:   0,
      lettuce: Math.sin(t * 2.2 + 0.5) * 2.4 * calm - Math.abs(stride) * 5.0 * run,
      letX:    0,
      letY:    0,
      bunL:    Math.sin(t * 2.0 - 0.4) * 3.2 * calm - stride * 8.0 * run,
      bunR:    -Math.sin(t * 2.0 - 0.4) * 3.2 * calm + stride * 8.0 * run,
      // Arms rest naturally at her sides in idle (only +-2.5 deg breathing),
      // and swing smoothly opposite the legs when walking (+-18 deg).
      armNear: (2 + breath * 2.6) * calm - stride * 18 * run,
      armFar:  (-2 - breath * 2.4) * calm + stride * 18 * run,
      legNear: stride * 23 * run,
      legFar:  -stride * 23 * run,
      liftNear:Math.max(0, -stepCos) * 5.5 * run,
      liftFar: Math.max(0, stepCos) * 5.5 * run
    };

    var mood = 'smug';

    // Subtle idle personality beats (poised & vain, no wild arm flailing)
    var idleCycle = t % 7.5;
    if (calm > 0.6 && !stunned) {
      if (hasAnnoyingRadio) {
        // Gentle upbeat groove while Annoying Radio is playing
        var groove = Math.sin(t * 6.5);
        P.y -= Math.abs(groove) * 3.5 * calm;
        P.head += groove * 3.5 * calm;
        P.armNear -= Math.abs(groove) * 8 * calm;
        P.armFar -= Math.abs(groove) * 8 * calm;
        mood = 'happy';
      } else if (idleCycle > 3.2 && idleCycle < 4.5) {
        // Condescending side-eye ("Ugh, peasants...")
        var lookEnv = pulse((idleCycle - 3.2) / 1.3);
        P.head -= 4 * lookEnv * calm;
        P.lean -= 2.5 * lookEnv * calm;
        mood = lookEnv > 0.25 ? 'unamused' : 'smug';
      } else if (idleCycle > 5.6 && idleCycle < 7.0) {
        // Gentle hair-brush & wink
        var brushEnv = pulse((idleCycle - 5.6) / 1.4);
        P.armNear -= 34 * brushEnv * calm;
        P.head += 5 * brushEnv * calm;
        P.lettuce -= 18 * brushEnv * calm;
        P.letY -= 4 * brushEnv * calm;
        mood = brushEnv > 0.25 ? 'wink' : 'smug';
      }
    }

    if (run > 0.35) {
      mood = hasAnnoyingRadio ? 'happy' : 'smug';
    }

    // 2. Skill-Specific Choreography (expressive whole-body poses with clean arm arcs)
    var radioX = 0, radioY = 0, radioRot = 0, radioScale = 1;
    var radioNotes = (hasAnnoyingRadio || hasPerfectReception || hasRoyalBroadcast) ? 0.9 : 0.25;

    if (acting && alive) {
      if (style === 'jessieBasic' || (!style && (action === 'attack' || action === 'wind'))) {
        // Basic Attack: Haughty lean-back windup -> forward step + dismissive wave + radio pulse
        var wind = p < 0.32 ? pulse(p / 0.32) : 0;
        var flick = p >= 0.26 ? pulse((p - 0.26) / 0.74) : 0;
        P.x += -10 * wind + 18 * flick;
        P.y += 3 * wind - 9 * flick;
        P.lean += -8 * wind + 11 * flick;
        P.head += -6 * wind + 7 * flick;
        P.armFar += 18 * wind - 46 * flick;
        P.armNear += 10 * wind - 18 * flick;
        P.legFar += 10 * wind - 18 * flick;
        P.legNear += -8 * wind + 14 * flick;
        P.lettuce += 8 * wind - 16 * flick;
        P.bunL += 8 * wind - 14 * flick;
        P.bunR += -8 * wind + 16 * flick;
        P.sx += 0.04 * wind - 0.03 * flick;
        P.sy += -0.04 * wind + 0.04 * flick;
        radioX += 10 * flick;
        radioY -= 10 * flick;
        radioScale = 1 + 0.15 * flick;
        radioNotes = 1;
        mood = flick > 0.2 ? 'annoyed' : 'unamused';
      }

      else if (style === 'jessiePose') {
        // White Skill (Peasants, Make Way!): Crouch to tap radio -> Spotlight diva pose (hand brushing hair, wink/happy)
        var crouch = seg(0, 0.25, p) * (1 - seg(0.25, 0.42, p));
        var poseHold = seg(0.24, 0.45, p) * (1 - seg(0.80, 1.0, p));
        P.x += -8 * crouch + 10 * poseHold;
        P.y += 10 * crouch - 18 * poseHold;
        P.lean += 9 * crouch - 10 * poseHold;
        P.head += 8 * crouch - 9 * poseHold;
        // Left hand brushes lettuce bang aside, right arm poses gracefully outward
        P.armNear += 18 * crouch - 44 * poseHold;
        P.armFar += 22 * crouch - 38 * poseHold;
        P.lettuce += -22 * poseHold;
        P.letY += -6 * poseHold;
        P.bunL += -14 * poseHold;
        P.bunR += 18 * poseHold;
        P.legNear += 12 * poseHold;
        P.legFar += -16 * poseHold;
        P.liftFar += 8 * poseHold;
        P.sx += 0.06 * crouch - 0.04 * poseHold;
        P.sy += -0.06 * crouch + 0.06 * poseHold;
        radioY -= 14 * poseHold;
        radioScale = 1 + 0.2 * poseHold;
        radioNotes = 1;
        mood = crouch > 0.3 ? 'unamused' : (p < 0.65 ? 'wink' : 'happy');
      }

      else if (style === 'jessieDismiss') {
        // Spotlight Expiry Knockback: Condescending forward sweep wave
        var sweep = pulse(p);
        P.x += 20 * sweep;
        P.y -= 8 * sweep;
        P.lean += 13 * sweep;
        P.head += 6 * sweep;
        P.armFar -= 50 * sweep;
        P.armNear += 16 * sweep;
        P.legNear += 16 * sweep;
        P.legFar -= 16 * sweep;
        P.lettuce -= 16 * sweep;
        mood = p < 0.55 ? 'annoyed' : 'unamused';
      }

      else if (style === 'jessieHairFlip') {
        // Green Skill (Look, Don't Touch!): Brushes aside lettuce hair + smug rhythmic groove step
        var flip = seg(0, 0.22, p) * (1 - seg(0.45, 0.65, p));
        var dance = seg(0.35, 0.55, p) * (1 - seg(0.84, 1.0, p));
        var groove = Math.sin(p * Math.PI * 3) * dance;
        P.x += -6 * flip + groove * 12;
        P.y += -8 * flip - Math.abs(groove) * 12;
        P.lean += -9 * flip + groove * 8;
        P.head += -10 * flip - groove * 6;
        // Hand brushes hair cleanly, then settles to sassy hip groove
        P.armNear += -46 * flip + (-22 + groove * 16) * dance;
        P.armFar += -18 * flip + (-24 - groove * 16) * dance;
        P.lettuce += -26 * flip - 12 * dance;
        P.letY += -7 * flip;
        P.bunL += -14 * flip + groove * 12;
        P.bunR += 18 * flip + groove * 12;
        P.legNear += groove * 18;
        P.legFar += -groove * 18;
        mood = flip > 0.25 ? 'wink' : 'happy';
      }

      else if (style === 'jessieCounterTeleport') {
        // 5th Dodge Counter Shockwave: Dynamic dash & shockwave strike
        var strike = pulse(p);
        P.x += 26 * strike;
        P.y -= 16 * strike;
        P.lean += 15 * strike;
        P.head += 8 * strike;
        P.armFar -= 52 * strike;
        P.armNear -= 28 * strike;
        P.legNear += 20 * strike;
        P.legFar -= 22 * strike;
        P.liftNear += 8 * strike;
        P.lettuce -= 20 * strike;
        P.bunL -= 18 * strike;
        P.bunR += 20 * strike;
        radioX += 18 * strike;
        radioY -= 16 * strike;
        radioScale = 1 + 0.22 * strike;
        radioNotes = 1;
        mood = p < 0.6 ? 'annoyed' : 'wink';
      }

      else if (style === 'jessieRadioJam') {
        // Blue Skill (Annoying Radio): Tunes radio dial -> upbeat rhythmic bounce
        var tune = seg(0, 0.22, p) * (1 - seg(0.32, 0.48, p));
        var jam = seg(0.28, 0.46, p) * (1 - seg(0.84, 1.0, p));
        var beat = Math.sin(p * Math.PI * 4) * jam;
        P.x += -10 * tune + beat * 8;
        P.y += 8 * tune - Math.abs(beat) * 15;
        P.lean += -7 * tune + beat * 7;
        P.head += 8 * tune - Math.abs(beat) * 8;
        P.armNear += 18 * tune + (-28 + beat * 14) * jam;
        P.armFar += 14 * tune + (-28 - beat * 14) * jam;
        P.legNear += beat * 16;
        P.legFar += -beat * 16;
        P.liftNear += Math.max(0, beat) * 6;
        P.liftFar += Math.max(0, -beat) * 6;
        P.bunL += -Math.abs(beat) * 14;
        P.bunR += Math.abs(beat) * 14;
        radioY -= Math.abs(beat) * 16;
        radioRot += beat * 10;
        radioScale = 1 + (tune + Math.abs(beat)) * 0.18;
        radioNotes = 1;
        mood = tune > 0.3 ? 'wink' : 'happy';
      }

      else if (style === 'jessiePerfectReception') {
        // Purple Skill (Above Everyone Else): Levitating broadcast pose
        var rise = pulse(p);
        P.y -= 22 * rise;
        P.lean -= 7 * rise;
        P.head -= 6 * rise;
        P.armNear -= 42 * rise;
        P.armFar -= 44 * rise;
        P.lettuce -= 22 * rise;
        P.letY -= 5 * rise;
        P.bunL -= 18 * rise;
        P.bunR += 20 * rise;
        P.legNear += 10 * rise;
        P.legFar -= 12 * rise;
        P.liftNear += 10 * rise;
        P.liftFar += 10 * rise;
        radioY -= 20 * rise;
        radioScale = 1 + 0.24 * rise;
        radioNotes = 1;
        mood = p < 0.5 ? 'wink' : 'happy';
      }

      else if (style === 'jessieRoyalBroadcast' || style === 'jessieRoyalFinale') {
        // Red Skill (It's All About Me!): Regal levitating diva broadcast & shockwave finale
        var wave = pulse(p);
        var swayR = Math.sin(p * Math.PI * 2) * wave;
        P.x += swayR * 10;
        P.y -= 24 * wave;
        P.lean += -8 * wave + swayR * 6;
        P.head += -7 * wave;
        P.armNear += -46 * wave + swayR * 10;
        P.armFar += -48 * wave - swayR * 10;
        P.lettuce -= 24 * wave;
        P.letY -= 6 * wave;
        P.bunL -= 20 * wave;
        P.bunR += 22 * wave;
        P.liftNear += 12 * wave;
        P.liftFar += 12 * wave;
        radioY -= 22 * wave;
        radioRot += swayR * 12;
        radioScale = 1 + 0.26 * wave;
        radioNotes = 1;
        mood = style === 'jessieRoyalFinale' ? 'annoyed' : 'happy';
      }

      else {
        // Generic cast/spin fallback
        var gen = pulse(p);
        P.y -= 12 * gen;
        P.armNear -= 32 * gen;
        P.armFar -= 34 * gen;
        P.lettuce -= 14 * gen;
        mood = 'happy';
      }
    }

    // 3. Status & Blink Expression Priority
    this.blinkT -= dt;
    var blinking = false;
    if (this.blinkT <= 0) {
      blinking = true;
      if (this.blinkT < -0.13) {
        this.blinkT = 2.4 + Math.random() * 2.6;
        blinking = false;
      }
    }

    if (asleep) {
      mood = 'blink';
    } else if (this.hurtT > 0 || stunned) {
      mood = 'shocked';
      if (stunned) {
        P.head += Math.sin(t * 9) * 6;
        P.lean += Math.cos(t * 9) * 4;
      }
    } else if (blinking && !acting) {
      mood = 'blink';
    }

    this.setExpression(mood);

    // 4. Step Springs & Apply Transforms
    var vx       = s.x.step(P.x, dt, 155, 19);
    var vy       = s.y.step(P.y, dt, 165, 19);
    var vLean    = s.lean.step(P.lean, dt, 155, 18);
    var vsx      = s.sx.step(P.sx, dt, 180, 20);
    var vsy      = s.sy.step(P.sy, dt, 180, 20);
    var vSkirt   = s.skirt.step(P.skirt - vLean * 0.35, dt, 115, 13);
    var vCollar  = s.collar.step(P.collar - vLean * 0.25, dt, 120, 14);
    var vHead    = s.head.step(P.head, dt, 155, 18);
    var vHeadX   = s.headX.step(P.headX, dt, 160, 19);
    var vHeadY   = s.headY.step(P.headY, dt, 160, 19);
    var vLettuce = s.lettuce.step(P.lettuce - vHead * 0.35, dt, 95, 11);
    var vLetX    = s.letX.step(P.letX, dt, 120, 15);
    var vLetY    = s.letY.step(P.letY, dt, 120, 15);
    var vBunL    = s.bunL.step(P.bunL - vLean * 0.4 - vHead * 0.3, dt, 85, 10);
    var vBunR    = s.bunR.step(P.bunR - vLean * 0.4 - vHead * 0.3, dt, 85, 10);
    var vArmNear = s.armNear.step(P.armNear, dt, 165, 19);
    var vArmFar  = s.armFar.step(P.armFar, dt, 165, 19);
    var vLegNear = s.legNear.step(P.legNear, dt, 175, 19);
    var vLegFar  = s.legFar.step(P.legFar, dt, 175, 19);
    var vLiftNear= s.liftNear.step(P.liftNear, dt, 180, 20);
    var vLiftFar = s.liftFar.step(P.liftFar, dt, 180, 20);

    tf(R.root, vx, vy, 0, WAIST[0], GROUND, vsx, vsy);
    tf(R.bunL, 0, 0, vBunL, BUN_L[0], BUN_L[1]);
    tf(R.bunR, 0, 0, vBunR, BUN_R[0], BUN_R[1]);
    tf(R.legFar, 0, -vLiftFar, vLegFar, LEG_FAR[0], LEG_FAR[1]);
    tf(R.legNear, 0, -vLiftNear, vLegNear, LEG_NEAR[0], LEG_NEAR[1]);
    tf(R.upper, 0, 0, vLean, WAIST[0], WAIST[1]);
    tf(R.skirt, 0, 0, vSkirt, SKIRT_P[0], SKIRT_P[1]);
    tf(R.collar, 0, 0, vCollar, COLLAR_P[0], COLLAR_P[1]);
    tf(R.armFar, 0, 0, vArmFar, ARM_FAR[0], ARM_FAR[1]);
    tf(R.armNear, 0, 0, vArmNear, ARM_NEAR[0], ARM_NEAR[1]);
    tf(R.headG, vHeadX, vHeadY, vHead, NECK[0], NECK[1]);
    tf(R.lettuce, vLetX, vLetY, vLettuce, LETTUCE[0], LETTUCE[1]);

    // Ground shadow tracks horizontal shift & jump height
    var shadowScale = clamp(1 + vy * 0.006, 0.72, 1.12);
    R.shadow.setAttribute('cx', (230 + vx).toFixed(1));
    R.shadow.setAttribute('rx', (86 * shadowScale).toFixed(1));

    // Spotlight / Royal Broadcast aura & crown
    var showAura = (hasSpotlight || hasPerfectReception || hasRoyalBroadcast || style === 'jessiePose' || style === 'jessieRoyalBroadcast') ? 1 : 0;
    R.spotFloor.setAttribute('opacity', (showAura * 0.75).toFixed(2));
    R.backAura.setAttribute('opacity', (showAura * 0.65).toFixed(2));
    R.crownG.setAttribute('opacity', showAura.toFixed(2));

    // Animate Radio Prop
    var rad = R.radio;
    var rPulse = Math.abs(Math.sin(t * (hasAnnoyingRadio ? 7.5 : 3.5)));
    var ry = radioY - rPulse * (hasAnnoyingRadio ? 4.5 : 1.5);
    var rrot = radioRot + Math.sin(t * (hasAnnoyingRadio ? 7.5 : 3.5)) * (hasAnnoyingRadio ? 3.5 : 1.0);
    var rsc = radioScale * (1 + rPulse * (hasAnnoyingRadio ? 0.05 : 0.018));
    tf(rad.body, radioX, ry, rrot, 122, 460, rsc, 2 - rsc);
    tf(rad.antG, 0, 0, Math.sin(t * 9) * (hasAnnoyingRadio ? 10 : 3), 142, 412);
    rad.wavesG.setAttribute('opacity', (radioNotes * (0.5 + 0.5 * Math.sin(t * 10))).toFixed(2));
    rad.notesG.setAttribute('opacity', radioNotes.toFixed(2));
    for (var ni = 0; ni < rad.notes.length; ni++) {
      var ny = -((t * 28 + ni * 16) % 36);
      var nx = Math.sin(t * 4 + ni * 2) * 6;
      rad.notes[ni].setAttribute('transform', 'translate(' + nx.toFixed(1) + ' ' + ny.toFixed(1) + ')');
    }
  };

  function enabled() {
    try { return !!(typeof Save !== 'undefined' && Save.data && Save.data.opt && Save.data.opt.animatedChars); }
    catch (_) { return true; }
  }

  return {
    enabled: enabled,
    create: function (host) { return new JessieRigInstance(host); },
    Rig: JessieRigInstance
  };
})();

if (typeof window !== 'undefined') window.JessieRig = JessieRig;
if (typeof globalThis !== 'undefined') globalThis.JessieRig = JessieRig;
