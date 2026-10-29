/* Jointed cutouts for Toons whose source art is a single transparent image.
   Every part samples the original image through an SVG clip path. At rest the
   parts reassemble the exact supplied sprite; no substitute face or anatomy is
   drawn. Coordinates were measured against each project's canonical art. */
'use strict';

const ToonCutoutRigs = (() => {
  const NS = 'http://www.w3.org/2000/svg';
  const cfg = {
    // [source, width, height, head cut, hip cut, left torso edge, right torso edge, kind, motion]
    Bassie:       ['Characters/Bassie/Bassie.png',329,386,.60,.77,.34,.68,'human',.78],
    Blot:         ['Characters/Blot/Blot.png',239,361,.53,.77,.32,.71,'human',.72],
    Boxten:       ['Characters/Boxten/Boxten.png',306,348,.58,.79,.32,.69,'human',.75],
    Brightney:    ['Characters/Brightney/Brightney.png',237,319,.56,.79,.31,.69,'human',.78],
    Brusha:       ['Characters/Brusha/Brusha.png',306,426,.55,.79,.31,.70,'human',.8],
    Coal:         ['Characters/Coal/Coal.png',428,379,.64,.82,.30,.72,'animal',.63],
    Cosmo:        ['Characters/Cosmo/Cosmo.png',242,325,.60,.82,.36,.68,'human',.78],
    Delilah:      ['Characters/Delilah/Delilah.png',436,1011,.38,.76,.33,.70,'human',.65],
    Eclipse:      ['Characters/Eclipse/Eclipse.png',224,409,.48,.78,.31,.69,'human',1.05],
    Eggson:       ['Characters/Eggson/Eggson.png',268,410,.55,.78,.34,.68,'human',.7],
    Flutter:      ['uploads/Fltuter.png',383,358,.54,.79,.45,.70,'wing',.96],
    Flyte:       ['Characters/Flyte/Flyte.png',358,448,.56,.78,.45,.69,'wing',1.05],
    Glisten:      ['uploads/Glisten.png',280,376,.50,.80,.34,.69,'human',.82],
    MrHolloway:  ['Characters/MrHolloway/MrHolloway.png',432,578,.51,.78,.33,.70,'human',.8],
    MrsHolloway: ['Characters/MrsHolloway/MrsHolloway.png',432,578,.51,.78,.33,.70,'human',.76],
    Pebble:       ['Characters/Pebble/Pebble.png',343,242,.58,.79,.38,.70,'animal',1.12],
    Phantasia:    ['uploads/Phantasia.png',391,379,.48,.80,.35,.68,'human',.88],
    Poppy:        ['Characters/Poppy/Poppy.png',270,391,.55,.79,.33,.68,'human',1.02],
    Ribecca:      ['uploads/Ribecca.png',235,373,.53,.77,.32,.70,'human',.8],
    RnD:          ['Characters/RnD/RnD.png',386,434,.55,.79,.34,.68,'duo',.77],
    Rodger:       ['Characters/Rodger/Rodger.png',198,340,.48,.78,.34,.70,'human',.7],
    Squirm:       ['Characters/Squirm/Squirm.png',409,421,.55,.79,.33,.69,'crawler',1.04],
    Teagan:       ['Characters/Teagan/Teagan.png',310,378,.48,.78,.34,.69,'human',.72],
    Tisha:        ['uploads/image-removebg-preview-3.png',288,354,.63,.81,.33,.69,'human',.88],
    Toodles:      ['Characters/Toodles/Toodles.png',264,331,.54,.80,.32,.70,'human',1.1],
    Waxwell:      ['Characters/Waxwell/Waxwell.png',263,405,.51,.79,.32,.70,'human',.82],
    Yatta:        ['Characters/Yatta/Yatta.png',281,406,.52,.78,.32,.70,'human',1.12],
    TenderheartSprout: ['uploads/tenderheartsprout.png',204,492,.52,.79,.32,.69,'human',.85],
    ShareBearCosmo:    ['uploads/sharebearcosmo.png',252,380,.56,.81,.33,.68,'human',.82]
  };
  const clamp = (n, a = 0, b = 1) => Math.min(b, Math.max(a, n));
  const pulse = p => Math.sin(Math.PI * clamp(p));
  const node = (tag, attrs, parent) => {
    const e = document.createElementNS(NS, tag);
    for (const [k, v] of Object.entries(attrs || {})) e.setAttribute(k, v);
    if (parent) parent.appendChild(e);
    return e;
  };
  let serial = 0;
  class Spring {
    constructor() { this.x = 0; this.v = 0; }
    step(target, dt) {
      const steps = Math.max(1, Math.ceil(dt / .008)), h = dt / steps;
      for (let i = 0; i < steps; i++) {
        this.v += (target - this.x) * 140 * h;
        this.v *= Math.exp(-18 * h);
        this.x += this.v * h;
      }
      return this.x;
    }
  }
  const ACTIONS = {
    reach: 'reach reel fetch tether grapple catch hug offer share deliver send',
    force: 'charge rush sprint dash tackle gallop slam crash stomp shock burst sweep stroke hoof claw sword cane flail rattle spite tantrum bully hunt',
    defend: 'guard armor shell contain wall root block ward resolve ready cower dodge',
    lift: 'flash flare glow pulse stars eclipse blaze ignite sparkle harvest roots spores bloom downpour melt trail dust miracle wish',
    show: 'melody rhythm applause cheer stage curtain encore audience broadcast circus party flip luck wager jackpot swirl twirl',
    craft: 'rummage knead decorate tidy stack read study scavenge inspect dossier observe foresee reveal bake feast pour banquet treat wrap present',
    float: 'vanish drift float glide hover soar flap swoop storm flutter inflate bounce pop'
  };
  const actionOf = pose => Object.keys(ACTIONS).find(k => ACTIONS[k].split(' ').includes(pose)) || 'show';

  function build(id, host) {
    const [path, W, H, headRate, hipRate, leftRate, rightRate, kind, energy] = cfg[id];
    host.style.aspectRatio = `${W} / ${H}`;
    const svg = node('svg', { viewBox: `0 0 ${W} ${H}`, class: 'rig-svg toon-cutout-svg', 'aria-hidden': 'true' }, host);
    const defs = node('defs', {}, svg);
    const root = node('g', {}, svg);
    const key = `tc${++serial}`;
    const url = (typeof ASSET === 'string' ? ASSET : './') + path;
    const X = n => n * W, Y = n => n * H;
    const headY = Y(headRate), hipY = Y(hipRate), leftX = X(leftRate), rightX = X(rightRate), mid = W * .5;
    const parts = {};
    const rect = (x0,y0,x1,y1) => `M${x0} ${y0}H${x1}V${y1}H${x0}Z`;
    function part(name, shape, pivot, parent = root) {
      const clipId = `${key}-${name}`;
      node('path', { d: shape }, node('clipPath', { id: clipId, clipPathUnits: 'userSpaceOnUse' }, defs));
      const g = node('g', {}, parent);
      node('image', { href: url, width: W, height: H, 'clip-path': `url(#${clipId})` }, g);
      parts[name] = { g, pivot };
    }
    if (kind === 'animal' || kind === 'crawler') {
      const split = X(kind === 'crawler' ? .52 : id === 'Pebble' ? .62 : .66);
      part('backLeg', rect(0, hipY - 10, mid + 5, H), [X(.34), hipY]);
      part('frontLeg', rect(mid - 5, hipY - 10, W, H), [X(.70), hipY]);
      part('body', rect(0, 0, split + 5, hipY + 7), [X(.47), Y(.66)]);
      part('head', rect(split - 4, 0, W, hipY + 7), [split, Y(.54)]);
    } else if (kind === 'wing') {
      const wingX = X(.46);
      part('wing', rect(0, 0, wingX + 6, hipY + 8), [wingX, Y(.50)]);
      part('legL', rect(wingX - 5, hipY - 8, mid + 6, H), [X(.48), hipY]);
      part('legR', rect(mid - 4, hipY - 8, W, H), [X(.62), hipY]);
      part('body', rect(wingX - 3, headY - 5, W, hipY + 9), [X(.61), Y(.68)]);
      part('head', rect(wingX - 3, 0, W, headY + 8), [X(.63), headY - 8]);
    } else if (kind === 'duo') {
      part('legL', rect(0, hipY - 8, mid + 5, H), [X(.42), hipY]);
      part('legR', rect(mid - 5, hipY - 8, W, H), [X(.59), hipY]);
      part('armL', rect(0, headY - 5, leftX + 6, hipY + 8), [leftX, headY + 8]);
      part('body', rect(leftX - 5, headY - 5, rightX + 5, hipY + 9), [mid, hipY]);
      part('armR', rect(rightX - 6, headY - 5, W, hipY + 8), [rightX, headY + 8]);
      part('headL', rect(0, 0, mid + 7, headY + 8), [X(.40), headY - 5]);
      part('headR', rect(mid - 7, 0, W, headY + 8), [X(.61), headY - 5]);
    } else {
      part('legL', rect(0, hipY - 8, mid + 5, H), [X(.43), hipY]);
      part('legR', rect(mid - 5, hipY - 8, W, H), [X(.57), hipY]);
      part('armL', rect(0, headY - 6, leftX + 6, hipY + 8), [leftX, headY + 7]);
      part('body', rect(leftX - 5, headY - 6, rightX + 5, hipY + 9), [mid, hipY]);
      part('armR', rect(rightX - 6, headY - 6, W, hipY + 8), [rightX, headY + 7]);
      part('head', rect(0, 0, W, headY + 8), [mid, headY - 6]);
    }
    // Poppy and Tisha already have painted per-skill cutouts. Reveal those at
    // the impact beat, between this rig's jointed anticipation and recovery.
    const actionArt = (id === 'Poppy' || id === 'Tisha')
      ? node('image', { x: 0, y: 0, width: W, height: H, opacity: 0,
        preserveAspectRatio: 'xMidYMax meet' }, svg) : null;
    return { root, parts, kind, energy, actionArt };
  }

  class Rig {
    constructor(id, host) {
      this.id = id;
      this.art = build(id, host);
      this.t = Math.random() * 5;
      this.stride = 0;
      this.lastHit = 0;
      this.springs = Object.create(null);
      for (const name of ['bob', ...Object.keys(this.art.parts)]) this.springs[name] = new Spring();
    }
    update(u, elapsed, battle) {
      const dt = clamp(elapsed || 0, 0, .05);
      if (!dt) return;
      this.t += dt;
      const moving = !!u.moving;
      const speed = Math.hypot(u.vx || 0, u.vy || 0);
      this.stride += dt * (4.6 + Math.min(speed, 160) * .023);
      const step = Math.sin(this.stride) * (moving ? 1 : 0);
      const idle = Math.sin(this.t * (this.id === 'Blot' ? 1.35 : this.id === 'Toodles' ? 3.2 : 2.05));
      const s = this.springs, P = Object.fromEntries(Object.keys(this.art.parts).map(n => [n, 0]));
      let bob = -Math.abs(step) * 4 + idle * 1.6;
      if (this.art.kind === 'wing') bob -= 5 + Math.sin(this.t * 3.5) * 3;
      if (this.art.kind === 'animal' || this.art.kind === 'crawler') bob += Math.abs(step) * 2;
      if (P.head != null) P.head = -idle * 2.4 + (u.visualSleep ? 8 : 0);
      if (P.headL != null) { P.headL = -idle * 2; P.headR = idle * 2; }
      if (P.armL != null) { P.armL = step * 15; P.armR = -step * 15; }
      if (P.legL != null) { P.legL = -step * 16; P.legR = step * 16; }
      if (P.backLeg != null) { P.backLeg = -step * 13; P.frontLeg = step * 13; }
      if (P.wing != null) P.wing = -8 + Math.sin(this.t * 5) * 12;

      if ((u.hitT || 0) > this.lastHit + .02) s.bob.v = -70;
      this.lastHit = u.hitT || 0;
      const skill = u._toonSkillMotion;
      const active = skill && battle && battle.t < skill.end && typeof ToonSkillMotion !== 'undefined';
      if (active) {
        const p = clamp((battle.t - skill.start) / Math.max(.12, skill.end - skill.start));
        const k = pulse(p), prep = pulse(p / .48), release = pulse((p - .24) / .62);
        const pose = ToonSkillMotion.sample(u, battle.t)?.pose;
        const action = actionOf(pose);
        const e = this.art.energy;
        const armL = P.armL != null ? 'armL' : P.wing != null ? 'wing' : 'backLeg';
        const armR = P.armR != null ? 'armR' : 'frontLeg';
        const head = P.head != null ? 'head' : P.headL != null ? 'headL' : 'head';
        if (action === 'reach') {
          P[armR] -= 55 * release * e; P[armL] += 19 * prep * e; P[head] += 8 * k;
        } else if (action === 'force') {
          P[armR] += (35 * prep - 70 * release) * e;
          P[armL] -= 22 * release * e; P.body = -12 * release * e;
          bob += 5 * prep - 8 * release;
        } else if (action === 'defend') {
          P[armL] -= 33 * k * e; P[armR] += 33 * k * e;
          P[head] += 9 * k; bob += 5 * k;
        } else if (action === 'lift') {
          P[armL] -= 47 * k * e; P[armR] += 48 * k * e;
          P[head] -= 8 * k; bob -= 7 * k;
        } else if (action === 'craft') {
          P[armR] += Math.sin(p * Math.PI * 6) * 24 * k * e;
          P[head] += 12 * k; P.body += 4 * Math.sin(p * Math.PI * 4) * k;
        } else if (action === 'float') {
          P[armL] -= 27 * k * e; P[armR] += 26 * k * e;
          P[head] += 11 * Math.sin(p * Math.PI * 2) * k;
          bob -= 10 * k;
        } else {
          P[armL] -= 29 * Math.sin(p * Math.PI * 3) * k * e;
          P[armR] += 34 * Math.sin(p * Math.PI * 3) * k * e;
          P[head] -= 7 * k; bob -= 5 * k;
        }
        if (P.wing != null) P.wing += Math.sin(p * Math.PI * 8) * 18 * k;
        if (P.headR != null) P.headR -= P.headL * .7;
        if (P.legL != null && (action === 'force' || action === 'show')) {
          P.legL -= 10 * release; P.legR += 12 * release;
        }
      } else if (u.animT > 0 && u.animState === 'attack') {
        const p = 1 - clamp(u.animT / Math.max(.01, u.animDur || 1));
        const k = pulse(p);
        if (P.armR != null) P.armR -= 40 * k;
        if (P.frontLeg != null) P.frontLeg += 19 * k;
        if (P.head != null) P.head += 6 * k;
      }
      if (u.visualStun) bob += Math.sin(this.t * 13) * 2;
      const overlay = this.art.actionArt;
      if (overlay) {
        const key = active ? skill.key : null;
        const art = key && typeof Art !== 'undefined' ? Art.skillHero(this.id, key) : null;
        if (art && art !== this.actionSrc) { this.actionSrc = art; overlay.setAttribute('href', art); }
        const p = active ? clamp((battle.t - skill.start) / Math.max(.12, skill.end - skill.start)) : 0;
        const amount = art ? Math.sin(Math.PI * clamp((p - .28) / .52)) * .82 : 0;
        overlay.setAttribute('opacity', amount.toFixed(2));
        this.art.root.setAttribute('opacity', (1 - amount).toFixed(2));
      }
      const rootBob = s.bob.step(bob, dt);
      this.art.root.setAttribute('transform', `translate(0 ${rootBob.toFixed(2)})`);
      for (const [name, part] of Object.entries(this.art.parts)) {
        const angle = s[name].step(P[name] || 0, dt);
        part.g.setAttribute('transform', `rotate(${angle.toFixed(2)} ${part.pivot[0].toFixed(1)} ${part.pivot[1].toFixed(1)})`);
      }
    }
  }
  const enabled = () => { try { return !!Save.data.opt.animatedChars; } catch (_) { return true; } };
  return Object.fromEntries(Object.keys(cfg).map(id => [id, {
    baseOnly: true,
    enabled,
    create: host => new Rig(id, host)
  }]));
})();
