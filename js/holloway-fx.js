/* Skill-shaped battle effects for the Holloways. Battle coordinates are in
   stage pixels; effects stay in #fxFront and respect reduced-effects mode. */
'use strict';

(() => {
  const canShow = fx => fx.front && !fx.offscreen && !fx.reducedEffects && fx.effectAllowed(1);
  const place = (fx, className, x, y, width, height, markup = '') => {
    const node = document.createElement('div');
    node.className = className;
    node.style.left = `${x - width / 2}px`;
    node.style.top = `${y - height / 2}px`;
    node.style.width = `${width}px`;
    node.style.height = `${height}px`;
    node.innerHTML = markup;
    fx.front.appendChild(node);
    return node;
  };
  const expire = (node, ms) => FX.defer(() => node.remove(), ms);
  const follow = (fx, node, unit, status, dx, dy) => {
    const tick = () => {
      if (!node.isConnected) return;
      if (!unit.alive || !unit.hasStatus(status)) {
        node.classList.add('hfx-out');
        expire(node, 320);
        return;
      }
      node.style.left = `${unit.x + dx}px`;
      node.style.top = `${unit.y + dy}px`;
      fx.frame(tick);
    };
    fx.frame(tick);
  };
  const spiralPath = (turns, radius) => {
    const points = [];
    for (let i = 0; i <= 80; i++) {
      const t = i / 80;
      const a = t * Math.PI * 2 * turns - Math.PI / 2;
      const r = 6 + radius * t;
      points.push(`${i ? 'L' : 'M'}${(100 + Math.cos(a) * r).toFixed(1)} ${(100 + Math.sin(a) * r).toFixed(1)}`);
    }
    return points.join(' ');
  };
  const spiral = `<svg viewBox="0 0 200 200" aria-hidden="true"><path d="${spiralPath(2.6, 86)}"/><path d="${spiralPath(2.6, 86)}" transform="rotate(180 100 100)"/></svg>`;
  const specks = (fx, x, y, colors, count, spread, lift = 0) => {
    if (fx.graphicsQuality < 25) return;
    for (let i = 0; i < count; i++) {
      const angle = Math.PI * 2 * i / count + Math.random() * .3;
      fx.part({ x: x + Math.cos(angle) * spread * .25, y: y + Math.sin(angle) * spread * .25,
        vx: Math.cos(angle) * spread * .8, vy: Math.sin(angle) * spread * .8 - lift,
        g: lift ? 90 : 0, size: 5 + Math.random() * 8, col: colors[i % colors.length],
        life: .45 + Math.random() * .35, drag: 1.3, layer: 'f' });
    }
  };

  Object.assign(FX, {
    hollowayStackMark(x, y, stacks = 1) {
      if (!canShow(this)) return;
      const node = place(this, 'hfx-stack', x, y - 48, 48, 48,
        `<i>${spiral}</i><b>${Math.min(15, stacks)}</b>`);
      expire(node, 700);
    },
    mrsHollowaySpiralExplosion(x, y, radius = 280, opt = {}) {
      if (!canShow(this)) return;
      const size = Math.min(radius * 1.6, (this.stage?.clientWidth || 700) * .85);
      const mode = opt.rev ? ' hfx-reverse' : '';
      const node = place(this, `hfx-burst${mode}`, x, y, size, size,
        `<i class="hfx-burst-veil"></i><i class="hfx-burst-spiral">${spiral}</i><i class="hfx-burst-wave"></i><i class="hfx-burst-wave second"></i><i class="hfx-burst-core"></i>`);
      specks(this, x, y, ['#f8eaff', '#cd9cf8', '#8e4bc7'], 12, size * .48);
      expire(node, Math.max(680, (opt.dur || .8) * 1000));
    },
    mrsHollowayApparition(x, y) {
      if (!canShow(this)) return;
      const art = 'Characters/MrsHolloway/MrsHolloway.png';
      const node = place(this, 'hfx-apparition', x, y - 80, 180, 210,
        `<i class="hfx-apparition-halo">${spiral}</i><img src="${art}" alt=""><i class="hfx-apparition-eye"></i>`);
      expire(node, 1450);
    },
    hollowayBlind(x, y) {
      if (!canShow(this)) return;
      const node = place(this, 'hfx-blind', x, y - 53, 96, 68,
        '<i></i><i></i><i></i>');
      expire(node, 880);
    },
    mrsHollowayEmbrace(x, y, dur, unit) {
      if (!canShow(this)) return;
      const node = place(this, 'hfx-embrace', x, y - 49, 112, 112,
        `<i class="hfx-embrace-orbit">${spiral}</i><i class="hfx-embrace-cocoon"></i><i class="hfx-embrace-star">✦</i>`);
      if (unit) follow(this, node, unit, 'holloway_embrace', -56, -105);
      else expire(node, FX.battleMs(dur || 2));
    },
    hollowayShield(x, y, color = 'violet') {
      if (!canShow(this)) return;
      const node = place(this, `hfx-shield-bloom ${color}`, x, y - 50, 128, 128,
        '<i></i><i></i><i></i>');
      expire(node, 850);
    },
    hollowayDissolve(x, y, returning = false) {
      if (!canShow(this)) return;
      const node = place(this, `hfx-dissolve${returning ? ' returning' : ''}`, x, y - 52, 160, 160,
        `<i class="hfx-dissolve-spiral">${spiral}</i><i class="hfx-dissolve-horizon"></i>`);
      specks(this, x, y - 35, ['#fff0ff', '#b27be8', '#6a388f'], 10, 70, returning ? -30 : 75);
      expire(node, 980);
    },
    mrHollowayClawSlash(x, y, tx, ty) {
      if (!canShow(this)) return;
      const targetX = tx ?? x + 50, targetY = ty ?? y - 25;
      const node = place(this, 'hfx-claw', targetX, targetY - 15, 110, 88,
        '<i></i><i></i><i></i><b></b>');
      node.style.setProperty('--facing', targetX < x ? '-1' : '1');
      specks(this, targetX, targetY, ['#ffd37d', '#e68634', '#8a4922'], 5, 55);
      expire(node, 480);
    },
    mrHollowayEarthCrash(x, y, radius = 280) {
      if (!canShow(this)) return;
      const width = Math.min(radius * 1.7, (this.stage?.clientWidth || 700) * .9);
      const node = place(this, 'hfx-crash', x, y + 4, width, 150,
        '<i class="hfx-crash-tail"></i><i class="hfx-crash-quake"></i><i class="hfx-crack a"></i><i class="hfx-crack b"></i><i class="hfx-crack c"></i><i class="hfx-crack d"></i><i class="hfx-crash-dust"></i>');
      specks(this, x, y + 8, ['#ffc666', '#a25a26', '#5b3b29'], 12, width * .4, 65);
      expire(node, 900);
    },
    mrHollowayAutumnCyclone(x, y, dur, unit) {
      if (!canShow(this)) return;
      const leaves = Array.from({ length: 7 }, (_, i) => `<i class="hfx-leaf" style="--angle:${i * 51}deg;--delay:${(-i * .27).toFixed(2)}s"></i>`).join('');
      const node = place(this, 'hfx-downpour', x, y - 54, 142, 142,
        `<i class="hfx-downpour-shell"></i>${leaves}<i class="hfx-downpour-center"></i>`);
      if (unit) follow(this, node, unit, 'holloway_downpour', -71, -125);
      else expire(node, FX.battleMs(dur || 3));
    },
    hollowayGuardPulse(x, y) {
      if (!canShow(this)) return;
      const node = place(this, 'hfx-guard-pulse', x, y - 54, 124, 124, '<i></i><i></i>');
      expire(node, 650);
    },
    mrHollowayRootBarrier(x, y, dur, unit) {
      if (!canShow(this)) return;
      const node = place(this, 'hfx-roots', x, y - 32, 152, 126,
        '<i class="hfx-root a"></i><i class="hfx-root b"></i><i class="hfx-root c"></i><i class="hfx-root d"></i><i class="hfx-roots-shield"></i>');
      if (unit) follow(this, node, unit, 'holloway_rooted_channel', -76, -95);
      else expire(node, FX.battleMs(dur || 3));
    },
    mrHollowayHarvestShield(x, y, dur, unit) {
      if (!canShow(this)) return;
      const node = place(this, 'hfx-last-stand', x, y - 55, 144, 144,
        '<i class="hfx-last-outer"></i><i class="hfx-last-inner"></i><i class="hfx-last-leaf a"></i><i class="hfx-last-leaf b"></i><b>✦</b>');
      node.style.setProperty('--stand-dur', `${dur || 5}s`);
      if (unit) follow(this, node, unit, 'holloway_stillstanding', -72, -127);
      else expire(node, FX.battleMs(dur || 5));
    },
    hollowayLastStandEnd(x, y, survived) {
      if (!canShow(this)) return;
      const node = place(this, `hfx-stand-end ${survived ? 'survived' : 'broken'}`, x, y - 50, 180, 180,
        '<i></i><i></i><i></i>');
      specks(this, x, y - 40, survived ? ['#ffeb9e', '#ffc259', '#8ddc80'] : ['#a9673a', '#583329'], 10, 90);
      expire(node, 850);
    }
  });
})();
