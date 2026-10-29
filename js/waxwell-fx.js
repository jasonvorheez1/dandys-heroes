/* Waxwell's readable battle language: poured wax, live flame, and a drawn
   control plan. Keep these decorations on the existing FX layers so battle
   quality and reduced effects continue to govern them. */
(() => {
  'use strict';
  if (typeof FX === 'undefined') return;

  const allowed = fx => fx.front && !fx.offscreen && !fx._denseVisualSafe &&
    !fx.reducedEffects && fx.effectAllowed(1);
  const piece = (parent, className, x, y, lifetime, html = '') => {
    const node = document.createElement('div');
    node.className = className;
    node.style.left = x + 'px';
    node.style.top = y + 'px';
    node.innerHTML = html;
    parent.appendChild(node);
    FX.defer(() => node.remove(), lifetime);
    return node;
  };
  const marker = (fx, className, x, y, lifetime = 760) =>
    piece(fx.front, 'waxwell-mark ' + className, x, y, lifetime,
      '<i></i><i></i><i></i><i></i><b></b>');

  const oldZone = FX.waxZone;
  FX.waxZone = function (x, y, type, radius, duration) {
    const zone = oldZone.call(this, x, y, type, radius, duration);
    if (!zone || !allowed(this)) return zone;
    zone.classList.add('waxwell-sculpted');
    const flame = zone.classList.contains('flame') || zone.classList.contains('violet-flame');
    const details = document.createElement('span');
    details.className = flame ? 'waxwell-zone-fire' : 'waxwell-zone-plan';
    details.innerHTML = flame
      ? '<i></i><i></i><i></i><i></i><i></i>'
      : '<i></i><i></i><i></i><i></i>';
    zone.appendChild(details);
    return zone;
  };

  const oldTrail = FX.waxTrail;
  FX.waxTrail = function (...args) {
    const previous = this.front && this.front.lastElementChild;
    const result = oldTrail.apply(this, args);
    if (!allowed(this)) return result;
    const trail = this.front.lastElementChild;
    if (!trail || trail === previous || !trail.classList.contains('fx-wax-trail')) return result;
    trail.classList.add('waxwell-sculpted');
    const isFlame = trail.classList.contains('flame');
    const detail = document.createElement('span');
    detail.className = isFlame ? 'waxwell-trail-fire' : 'waxwell-trail-plan';
    detail.innerHTML = '<i></i><i></i><i></i><i></i><i></i><i></i>';
    trail.appendChild(detail);
    return result;
  };

  const oldFigure = FX.waxFigure;
  FX.waxFigure = function (kind, record, target, opt) {
    const result = oldFigure.call(this, kind, record, target, opt);
    if (kind === 'spawn' && record && record.fxEl && allowed(this)) {
      record.fxEl.classList.add('waxwell-carved');
      const cracks = document.createElement('span');
      cracks.className = 'waxwell-figure-cracks';
      cracks.innerHTML = '<i></i><i></i><i></i>';
      record.fxEl.appendChild(cracks);
    }
    return result;
  };

  const oldSkill = FX.waxwellSkill;
  FX.waxwellSkill = function (kind, x, y, opt) {
    const result = oldSkill.call(this, kind, x, y, opt);
    if (!allowed(this)) return result;
    opt = opt || {};
    if (kind === 'ignite') {
      marker(this, 'waxwell-ignite-mark', x, y - 104, 850);
      for (const target of [opt.first, opt.second]) {
        if (target) marker(this, 'waxwell-flame-target', target.x, target.y - 30, 950);
      }
    } else if (kind === 'run') {
      const streak = piece(this.front, 'waxwell-run-streak', x, y - 83, 650,
        '<i></i><i></i><i></i><i></i>');
      streak.style.setProperty('--face', opt.face || 1);
    } else if (kind === 'melt') {
      marker(this, 'waxwell-pour-mark', x + (opt.face || 1) * 22, y - 22, 780);
      if (Number.isFinite(opt.endX)) marker(this, 'waxwell-pool-target', opt.endX,
        (Number.isFinite(opt.endY) ? opt.endY : y) - 10, 960);
    } else if (kind === 'snuffer' || kind === 'snuffHit') {
      const targets = kind === 'snuffer' ? opt.targets || [] : [opt.target];
      for (const target of targets) {
        if (target) marker(this, kind === 'snuffer' ? 'waxwell-snuffer-mark' :
          opt.flame ? 'waxwell-snuff-flame' : 'waxwell-snuff-wax',
          target.x, target.y - 72, kind === 'snuffer' ? 900 : 640);
      }
    } else if (kind === 'network' && Number.isFinite(opt.endX)) {
      const endY = Number.isFinite(opt.endY) ? opt.endY : y;
      const dx = opt.endX - x, dy = endY - y;
      const line = piece(this.front, 'waxwell-blueprint-line', x, y - 20, 1050,
        '<i></i><i></i><i></i><i></i><i></i>');
      line.style.width = Math.max(36, Math.hypot(dx, dy)) + 'px';
      line.style.setProperty('--angle', Math.atan2(dy, dx) + 'rad');
      marker(this, 'waxwell-network-node', opt.endX, endY - 20, 1080);
    } else if (kind === 'trap' && opt.target) {
      marker(this, 'waxwell-trap-mark', opt.target.x, opt.target.y - 56, 1250);
    } else if (kind === 'figure' || kind === 'meltFigure') {
      const px = Number.isFinite(opt.x) ? opt.x : x + (opt.face || 1) * 54;
      const py = Number.isFinite(opt.y) ? opt.y : y;
      marker(this, kind === 'figure' ? 'waxwell-figure-mark' : 'waxwell-break-mark',
        px, py - 58, kind === 'figure' ? 1000 : 620);
    }
    return result;
  };
})();
