/* sprout-rig.js - Sprout's battle sprite (Characters/Sprout/Sprout.png) cut into head, leaf, scarf, torso,
   arms and legs (Characters/Sprout/sprout-rig.png) and driven by the shared PuppetRig framework (puppet.js). */
'use strict';

/* ============================================================ SPROUT
   An anxious little baker: overprotective, always scanning for who needs a treat, wringing his
   hands, hopping to the rescue. Hand-me-down keywords: fret, offer, scurry. */
const SproutRig = PuppetRig.define({
  img: 'Characters/Sprout/sprout-rig.png', sourceFace: 'Characters/Sprout/Sprout.png', atlas: [684, 153], vb: [291, 414],
  pieces: {"legB":[4,4,40,122,139,280],"legF":[52,4,28,122,120,280],"torso":[88,4,57,103,115,216],"armLu":[153,4,45,68,81,230],"armLf":[206,4,60,60,61,286],"armR":[274,4,44,58,172,260],"scarf":[326,4,69,51,109,198],"head":[403,4,141,145,69,70],"leaf":[552,4,128,95,86,16]},
  faceOn: 'head', ground: 402, waist: [143, 300], crouchDrop: 7, tempo: .7, beatRate: 4.4,
  walkFreq: [1.9, 2.2], lookGap: [.4, 1.5], lookX: [-.9, 1], blinkGap: [1.6, 4],
  defaultExpr: 'happy',
  toothyGrin: {
    patch: 'M155 160 Q183 154 209 163 L209 204 Q183 213 157 202 Z',
    shape: 'M159 169 Q179 161 204 169 L203 187 Q199 202 181 202 Q164 200 160 185 Z',
    teeth: 'M173 166 L175 198 M188 166 L190 199'
  },
  channels: {           // name: [stiffness, damping, rest]
    headR: [170, 13], headX: [200, 15], headY: [220, 15], torso: [190, 14],
    aL: [300, 15], fL: [260, 12], aR: [300, 15],
    leaf: [110, 5], scarf: [90, 6], legF: [280, 18], legB: [280, 18]
  },
  hitKick: { headR: -260, sy: -3, sx: 3, leaf: -420, scarf: 300, aL: -300, aR: 300 },
  parts: [
    { n: 'legB', piece: 'legB' },
    { n: 'legF', piece: 'legF' },
    { n: 'torso', piece: 'torso', pivot: [143, 300], rot: [['torso', 1]] },
    { n: 'armLu', parent: 'torso', pivot: [108, 242], rot: [['aL', 1]] },
    { n: 'armLf', parent: 'armLu', pivot: [90, 296], rot: [['fL', 1]] },
    { n: 'armR', parent: 'torso', pivot: [172, 263], rot: [['aR', 1]] },
    { n: 'scarf', parent: 'torso', pivot: [143, 216], rot: [['scarf', 1]] },
    { n: 'head', pivot: [143, 214], rot: [['headR', 1], ['torso', .5]], tx: [['headX', 1], ['torso', .3]], ty: [['headY', 1]] },
    { n: 'leaf', parent: 'head', pivot: [150, 90], rot: [['leaf', 1]] }
  ],
  legs: [
    { part: 'legF', ch: 'legF', hip: [134, 302], sole: [[122, 400], [150, 401]], up: 0 },
    { part: 'legB', ch: 'legB', hip: [156, 300], sole: [[148, 388], [176, 392]], up: 9 }
  ],
  props: [
    { n: 'treat', part: 'armR', at: [214, 316], draw: 'treat', scale: 1.5, tilt: -15 }
  ],
  face: {
    shade: [[0, '#ffffff'], [.5, '#f1dfdf'], [1, '#b87a82']],
    skin: '#a63640',
    eyes: [
      { c: [151, 130], rx: 28, ry: 29, prx: 20.5, pr: 21.5, tx: 4, ty: 4, sw: 4.2 },
      { c: [203, 130], rx: 16, ry: 31, prx: 11.5, pr: 22, tx: 2.5, ty: 4, sw: 3.8, mask: true }
    ],
    brows: [{ c: [150, 92], s: 1.2 }, { c: [204, 94], s: .9 }],
    mouth: { c: [172, 179], rot: -20, stroke: 3, line: 2.2, box: true, fill: '#f4f4f6', tongue: '#ee8a98', scale: 1, teethCount: 3 },
    blush: [
      { c: [127, 165], r: 12, color: '#7a2230', opacity: .7, dots: [[-5, -4, 1.9], [3, -1, 1.9], [-2, 6, 1.9]] },
      { c: [208, 154], r: 10, color: '#7a2230', opacity: .7, mask: true, dots: [[-2, -3, 1.6], [2, 3, 1.6]] }
    ]
  },
  spark: ['#fff3c9', '#f2a65a'],
  expr: {
    happy:     { mw: 21, mc: 1, mo: 20, mt: 0, tt: 1 },
    excited:   { mw: 21, mc: 1, mo: 22, mt: 0, tt: 1 },
    grin:      { mw: 21, mc: 2, mo: 18, mt: 0, tt: 1 },
    joy:       { mw: 22, mc: 2, mo: 23, mt: 0, tt: 1 },
    worried:   { lid: .05, tilt: -6, bo: 1, bt: -15, by: -6, mw: 16, mc: -6, mo: 9, mt: 0 },
    startled:  { lid: 0, pup: .5, eye: 1.1, bo: 1, bt: 0, by: -8, mw: 4, mc: -1, mo: 7, mt: 3 },
    nervous:   { lid: .05, pup: .85, eye: 1.08, bo: 1, bt: -12, by: -6, mw: 21, mc: 0, mo: 9, mt: 0, tt: 1 },
    annoyed:   { lid: .4, tilt: 7, bo: 1, bt: 8, by: 4, mw: 19, mc: -2, mo: 8, mt: 5, tt: 1 },
    wince:     { lid: 1, bo: 0, mw: 19, mc: -1, mo: 8, mt: 0, tt: 1 },
    hurt:      { lid: .45, low: .15, tilt: -8, pup: .8, bo: 1, bt: -14, by: -2, mw: 18, mc: -4, mo: 8, tt: 1 },
    determined:{ lid: .22, tilt: 8, bo: 1, bt: 9, by: 4, mw: 22, mc: 2, mo: 8, mt: 0, tt: 1 },
    sleep:     { mw: 8, mc: 1, mo: 4, tt: 0 }
  },
  behavior: {
    hurtExpr: 'wince',
    events: [
      { n: 'fret', w: 3, d: 2.6 }, { n: 'wave', w: 2, d: 2.2 }, { n: 'offer', w: 2, d: 2.4 },
      { n: 'check', w: 3, d: 2 }, { n: 'hop', w: 1.5, d: .9 }
    ],
    eventGap: [3.5, 7],
    idle(c) {
      const { P, sway, breath, beat, idle, lib: L } = c, bob = Math.max(0, beat);
      // anxious bounce on his toes, hands never quite still
      P.x += sway * 2.4 * idle; P.torso += (sway * 2 + beat * .8) * idle; P.headR = (-sway * 2 + beat * 1.4) * idle;
      P.sy += (breath * .012 - bob * .016) * idle; P.sx -= (breath * .006 - bob * .01) * idle;
      P.y -= bob * 2.2 * idle; P.headY += breath * .6 * idle;
      P.aL = (4 + sway * 5 - beat * 3) * idle; P.fL = (sway * 7 + beat * 3) * idle; P.aR = (-4 - sway * 4 + beat * 3) * idle;
      P.legF = sway * 1.4 * idle; P.legB = -sway * 1.4 * idle;
      P.leaf = Math.sin(c.T * 2.2) * 3 * idle; P.scarf = Math.sin(c.T * 1.3 + 1) * 2 * idle;
    },
    event: {
      fret(c) {   // wrings his hands, shakes his head
        const { P, T, on } = c;
        P.aL = 52 * on; P.fL = 70 * on + Math.sin(T * 13) * 9 * on; P.aR = -46 * on + Math.sin(T * 13) * 8 * on;
        P.headR += Math.sin(T * 8) * 5 * on; P.headX += Math.sin(T * 8) * 2.5 * on; P.torso -= 3 * on;
        P.lookX = Math.sin(T * 5) * .9; P.lookY = .3; c.set(on > .2 ? 'worried' : 'happy');
      },
      wave(c) {   // a bright little wave
        const { P, T, on } = c, up = c.lib.easeOut(c.lib.seg(0, .2, c.k)) * (1 - c.lib.easeInOut(c.lib.seg(.84, 1, c.k)));
        P.aR = -128 * up + Math.sin(T * 14) * 12 * up; P.headR += 6 * up; P.lookX = .9; P.lookY = -.1;
        if (up > .5) c.set('excited');
      },
      offer(c) {  // pulls out a fresh bake and holds it out
        const { P, T, on, lib: L } = c, up = L.easeOut(L.seg(0, .25, c.k)) * (1 - L.easeInOut(L.seg(.85, 1, c.k)));
        P.aR = -62 * up + Math.sin(T * 6) * 3 * up; P.torso += 8 * up; P.headR += 4 * up; P.x += 5 * up;
        P.lookX = 1; c.prop('treat', up * 1.2); if (up > .4) c.set('excited');
        if (up > .8 && Math.random() < c.dt * 3) c.emit(222 + L.rnd(-6, 8), 300 + L.rnd(-10, 6), 6, -22, .7, 4);
      },
      check(c) {  // anxious head-swivel: is everyone okay?
        const { P, T, on } = c;
        P.lookX = Math.sin(T * 7) * 1.1; P.lookY = -.1; P.headR += Math.sin(T * 7) * 6 * on; P.headX += Math.sin(T * 7) * 3 * on;
        P.legF += Math.sin(T * 14) * 3 * on; c.set(on > .3 ? 'nervous' : 'happy');
      },
      hop(c) {
        const { P, k, lib: L } = c, h = Math.sin(L.clamp(k, 0, 1) * Math.PI), air = L.seg(.22, .78, k);
        P.crouch = (k < .22 ? Math.sin(L.seg(0, .22, k) * Math.PI) * .8 : 0) + (k > .78 ? Math.sin(L.seg(.78, 1, k) * Math.PI) * .7 : 0);
        P.air = Math.sin(air * Math.PI) * 15 * (k > .22 && k < .78 ? 1 : 0);
        P.aL += 35 * h; P.aR -= 35 * h; c.set('excited'); P.leaf = 10 * h;
      }
    },
    walk(c) {     // a quick, determined scurry
      const { P, phase: f, run, s01, lib: L } = c, sn = Math.sin(f), cs = Math.cos(f), amp = 26 + 14 * s01;
      P.legF = L.lerp(P.legF, sn * amp, run); P.legB = L.lerp(P.legB, -sn * amp, run);
      P.lift[0] = Math.max(0, cs) * 5 * run; P.lift[1] = Math.max(0, -cs) * 5 * run;
      P.y -= Math.abs(sn) * (3 + 3 * s01) * run;
      P.torso += (7 + 6 * s01) * run + cs * 2.5 * run; P.headR += (-4 + cs * 2.5) * run; P.headY += Math.abs(sn) * 2 * run;
      P.sy += ((1 - Math.abs(sn)) * -.03 + .02) * run; P.sx += ((1 - Math.abs(sn)) * .04 - .015) * run;
      P.aL = L.lerp(P.aL, 6 + sn * 38, run); P.fL = L.lerp(P.fL, 12 + sn * 20, run); P.aR = L.lerp(P.aR, -6 - sn * 38, run);
      P.leaf += Math.sin(f * 2) * 6 * run; P.scarf -= 6 * run; P.lookX = L.lerp(P.lookX, 1, run * .7); P.x += 3 * run;
      c.set('determined');
    },
    wind(c) {     // reaches behind him for a fresh treat
      const { P, ph, lib: L } = c, p = L.easeOut(ph);
      P.crouch = .5 * p; P.torso = -8 * p; P.x -= 6 * p; P.sx += .06 * p; P.sy -= .07 * p; P.headR += 5 * p;
      P.aR = 58 * p; P.aL = 20 * p; P.lookX = 1; P.lookY = 0; c.prop('treat', p * 1.1); c.set('determined');
    },
    attack(c) {   // pitches the treat to whoever needs it
      const { P, ph: q, lib: L } = c, st = L.easeOutBack(L.seg(.1, .32, q)), rec = L.easeInOut(L.seg(.55, 1, q)), hold = 1 - rec;
      P.x += L.lerp(-6, 16, st) * hold; P.torso = L.lerp(-8, 13, st) * hold; P.crouch = L.lerp(.5, .26, st) * hold;
      P.sx += L.lerp(.06, -.08, st) * hold; P.sy += L.lerp(-.07, .09, st) * hold; P.headR += L.lerp(5, -7, st) * hold; P.headX += 4 * st * hold;
      P.aR = L.lerp(L.lerp(58, -82, st), 0, rec); P.aL = L.lerp(20, -10, st) * hold;
      P.legF = L.lerp(-12, 9, st) * hold; P.legB = L.lerp(12, -9, st) * hold; P.lookX = 1;
      c.prop('treat', q < .3 ? 1.1 : 1.1 * (1 - L.seg(.3, .5, q)));
      c.set(q < .7 ? 'determined' : 'grin');
      if (!c.rig.burst && q > .24) { c.rig.burst = true; c.spark(4, 232, 285, 70, -16, .55, 5); }
    },
    cast(c) {     // serves a whole tray: both arms up, hop, treats everywhere
      const { P, ph, lib: L } = c, p = c.u.casting && !c.u.animT ? .5 : ph;
      const crouch = Math.sin(L.seg(0, .28, p) * Math.PI * .5) * (1 - L.seg(.28, .4, p)), jump = Math.sin(L.seg(.28, .85, p) * Math.PI);
      const land = p > .85 ? Math.sin(L.seg(.85, 1, p) * Math.PI) : 0, rs = jump + crouch * .3;
      P.crouch = crouch * .9 + land * .7; P.air = jump * 24;
      P.sx += crouch * .12 - jump * .08 + land * .1; P.sy += -crouch * .14 + jump * .12 - land * .1;
      P.aL = 125 * rs; P.fL = 20 * rs; P.aR = -128 * rs; P.headR -= 7 * jump; P.torso -= 4 * jump; P.lookX = .2; P.lookY = -.3 * jump;
      P.legF = 10 * jump; P.legB = -10 * jump; P.lift = [4 * jump, 4 * jump]; P.leaf = 14 * jump;
      c.prop('treat', rs * 1.2); c.set('grin');
      if (jump > .15 && Math.random() < c.dt * 12) c.emit(143 + L.rnd(-70, 70), 180 + L.rnd(-50, 40), L.rnd(-8, 8), L.rnd(-34, -14), L.rnd(.7, 1.1), L.rnd(4, 8));
    },
    sleep(c) { const { P } = c; P.headR = 18; P.torso += 5; P.headY += 5; P.aL = 3; P.aR = -2; P.lookX = 0; },
    stun(c) { const { P, T } = c; P.headR += Math.sin(T * 4.5) * 9; P.torso += Math.sin(T * 4.5) * 5; }
  }
});
