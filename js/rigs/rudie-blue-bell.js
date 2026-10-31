/* Blue bell is Rudie's Chapter 2 Hard appearance. Its cutout keeps his
   prance, charge and attack animation while using the supplied front pose. */
'use strict';

const BLUE_BELL = {
  id: 'blue-bell', name: 'Blue bell',
  art: 'assets/toon-art/Rudie/rudie-blue-bell.png',
  description: 'A blue-nosed look for Rudie. Clear The Reserve on Hard to unlock.',
  get available() { return MainStory.withCh(2, () => MainStory.hardDone('k11')); }
};

const RudieBlueBell = { pending: undefined };
{
  const originalSkin = Art.skin;
  Art.skin = function (id, costume) {
    if (id !== 'Rudie') return originalSkin.apply(this, arguments);
    const selected = arguments.length > 1 ? costume : Save.data?.heroes?.Rudie?.costume;
    RudieBlueBell.pending = selected;
    if (selected === BLUE_BELL.id) return BLUE_BELL.available ? BLUE_BELL : null;
    return originalSkin.apply(this, arguments);
  };
}

const BlueBellRig = (() => {
  const NS = 'http://www.w3.org/2000/svg';
  const art = ASSET + BLUE_BELL.art;
  const clamp = (n, low = 0, high = 1) => Math.max(low, Math.min(high, n));
  const pulse = p => Math.sin(Math.PI * clamp(p));
  let nextId = 0;
  function node(tag, attrs, parent) {
    const element = document.createElementNS(NS, tag);
    Object.entries(attrs || {}).forEach(([key, value]) => element.setAttribute(key, value));
    if (parent) parent.appendChild(element);
    return element;
  }

  class Rig {
    constructor(host) {
      const id = `blue-bell-${++nextId}`;
      const svg = node('svg', { class: 'rig-svg blue-bell-rig', viewBox: '0 0 264 397', 'aria-hidden': 'true' }, host);
      const defs = node('defs', null, svg);
      const piece = (name, path, parent) => {
        const clipId = `${id}-${name}`;
        node('path', { d: path }, node('clipPath', { id: clipId, clipPathUnits: 'userSpaceOnUse' }, defs));
        const group = node('g', null, parent);
        node('image', { href: art, width: 264, height: 397, 'clip-path': `url(#${clipId})` }, group);
        return group;
      };
      const glow = node('radialGradient', { id: `${id}-glow` }, defs);
      node('stop', { offset: 0, 'stop-color': '#9ce5ff', 'stop-opacity': .9 }, glow);
      node('stop', { offset: .42, 'stop-color': '#3974ee', 'stop-opacity': .48 }, glow);
      node('stop', { offset: 1, 'stop-color': '#3974ee', 'stop-opacity': 0 }, glow);
      this.aura = node('ellipse', { cx: 132, cy: 255, rx: 113, ry: 136, fill: `url(#${id}-glow)`, opacity: 0 }, svg);
      this.root = node('g', null, svg);
      this.legL = piece('leg-l', 'M89 309 H133 V397 H89 Z', this.root);
      this.legR = piece('leg-r', 'M131 309 H181 V397 H131 Z', this.root);
      this.upper = node('g', null, this.root);
      this.body = piece('body', 'M88 218 H177 V342 H88 Z', this.upper);
      this.armL = piece('arm-l', 'M56 224 Q91 219 108 258 L111 314 Q99 331 70 324 Q48 315 51 281 Z', this.upper);
      this.armR = piece('arm-r', 'M158 227 Q193 223 211 253 L221 293 Q216 323 190 325 L161 313 Z', this.upper);
      this.head = node('g', null, this.upper);
      this.earL = piece('ear-l', 'M2 65 Q49 54 91 79 L99 118 Q44 128 6 99 Z', this.head);
      this.earR = piece('ear-r', 'M171 81 Q209 55 262 76 L263 101 Q230 128 178 118 Z', this.head);
      this.antlerL = piece('antler-l', 'M74 6 H119 V84 H75 Z', this.head);
      this.antlerR = piece('antler-r', 'M140 5 H193 V90 H140 Z', this.head);
      this.face = piece('face', 'M57 78 Q88 68 108 76 Q145 72 177 80 Q205 97 209 140 Q216 187 187 212 Q133 233 81 211 Q48 190 54 139 Z', this.head);
      this.noseGlow = node('ellipse', { cx: 134, cy: 167, rx: 24, ry: 20, fill: `url(#${id}-glow)`, opacity: 0 }, this.head);
      this.time = 0;
      this.hit = 0;
      this.lastHit = 0;
    }

    update(u, elapsed) {
      const dt = clamp(elapsed || 0, 0, .05);
      this.time += dt;
      const moving = !!u.moving;
      const momentum = Math.min(12, u._rudieVisualMomentum || 0);
      const speed = Math.hypot(u.vx || 0, u.vy || 0);
      const phase = this.time * (moving ? 10 + Math.min(speed, 150) * .05 : 2.5);
      const stride = Math.sin(phase);
      const action = u.animT > 0 ? u.animState : '';
      const progress = action ? 1 - clamp(u.animT / Math.max(.01, u.animDur || 1)) : 0;
      const beat = pulse(progress);
      const rush = action === 'wind' ? beat : 0;
      const attack = action === 'attack' ? beat : 0;
      const cast = action === 'cast' || u.casting ? beat || .45 : 0;
      if ((u.hitT || 0) > this.lastHit + .02) this.hit = .26;
      this.lastHit = u.hitT || 0;
      this.hit = Math.max(0, this.hit - dt);

      const bob = moving ? -Math.abs(stride) * 5 : stride * 1.5;
      const recoil = this.hit * 18;
      this.root.setAttribute('transform', `translate(${(rush * 12 - recoil).toFixed(1)} ${(bob - attack * 4 - cast * 5).toFixed(1)})`);
      this.upper.setAttribute('transform', `rotate(${(stride * (moving ? 3 : 1) + rush * 9 + attack * 6 - recoil).toFixed(1)} 133 319)`);
      this.head.setAttribute('transform', `rotate(${(-stride * (moving ? 4 : 2) + rush * 13 - cast * 9 + recoil * .6 + (u.visualSleep ? 10 : 0)).toFixed(1)} 132 216)`);
      this.earL.setAttribute('transform', `rotate(${(stride * 6 - rush * 11).toFixed(1)} 84 93)`);
      this.earR.setAttribute('transform', `rotate(${(-stride * 6 + rush * 11).toFixed(1)} 182 93)`);
      this.antlerL.setAttribute('transform', `rotate(${(stride * 2 + attack * 6).toFixed(1)} 98 76)`);
      this.antlerR.setAttribute('transform', `rotate(${(-stride * 2 + attack * 6).toFixed(1)} 162 79)`);
      this.armL.setAttribute('transform', `rotate(${(stride * (moving ? 16 : 3) - attack * 24 + cast * 15).toFixed(1)} 94 246)`);
      this.armR.setAttribute('transform', `rotate(${(-stride * (moving ? 16 : 3) + attack * 30 - cast * 18).toFixed(1)} 174 247)`);
      this.legL.setAttribute('transform', `translate(0 ${(-Math.max(0, stride) * (moving ? 8 : 0)).toFixed(1)}) rotate(${(stride * (moving ? 24 : 0) - attack * 25).toFixed(1)} 111 325)`);
      this.legR.setAttribute('transform', `translate(0 ${(-Math.max(0, -stride) * (moving ? 8 : 0)).toFixed(1)}) rotate(${(-stride * (moving ? 24 : 0) + attack * 25).toFixed(1)} 153 325)`);
      const glow = clamp(momentum / 12 * .7 + cast * .3 + rush * .22);
      this.aura.setAttribute('opacity', glow.toFixed(2));
      this.noseGlow.setAttribute('opacity', clamp(glow + cast * .35).toFixed(2));
    }
  }

  return { create(host) { return new Rig(host); } };
})();

{
  const originalCreate = RudieRig.create;
  RudieRig.create = function (host, costume) {
    const selected = arguments.length > 1 ? costume
      : RudieBlueBell.pending === undefined ? Save.data?.heroes?.Rudie?.costume : RudieBlueBell.pending;
    RudieBlueBell.pending = undefined;
    return selected === BLUE_BELL.id && BLUE_BELL.available
      ? BlueBellRig.create(host) : originalCreate.call(this, host);
  };
}

{
  const originalExtras = HeroPage.extrasTab;
  HeroPage.extrasTab = function (id) {
    const wrap = originalExtras.call(this, id);
    if (id !== 'Rudie') return wrap;
    const equipped = Save.hero(id).costume === BLUE_BELL.id;
    const unlocked = BLUE_BELL.available;
    const card = el('div', 'card hero-skin-card');
    card.innerHTML = `<div class="hero-skin-kicker">HARD MODE APPEARANCE</div>
      <div class="hero-skin-layout"><div class="hero-skin-swatches"><img src="${Art.defaultHero(id)}" alt="Default Rudie"><img src="${ASSET + BLUE_BELL.art}" alt="Blue bell skin"></div>
        <div class="hero-skin-copy"><div class="row"><div class="grow"><b>Blue bell</b><small class="muted">Rudie skin</small></div><span class="hero-skin-status">${equipped ? 'EQUIPPED' : unlocked ? 'UNLOCKED' : 'LOCKED'}</span></div>
        <p class="mini muted">Clear The Reserve on Hard.</p></div></div>`;
    const button = el('button', 'btn small hero-skin-button', equipped ? 'USE DEFAULT' : unlocked ? 'EQUIP SKIN' : 'LOCKED');
    button.type = 'button'; button.disabled = !unlocked;
    button.onclick = () => {
      if (!BLUE_BELL.available) return;
      Save.hero(id).costume = equipped ? null : BLUE_BELL.id;
      Save.write(); Sound.play('ui_ok'); this.draw();
    };
    card.appendChild(button);
    wrap.prepend(card);
    if (equipped) {
      const grid = wrap.querySelector('.gear-summary-grid');
      if (grid) grid.insertAdjacentHTML('beforeend', '<div><small>SKIN</small><b>Blue bell</b></div>');
    }
    return wrap;
  };
}
