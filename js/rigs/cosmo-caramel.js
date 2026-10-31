/* Caramel Drizzle shares Cosmo's default pose across portraits and combat.
   Its cutout rig uses that same posed art for every animated state. */
'use strict';

const CARAMEL_DRIZZLE = {
  id: 'caramel-drizzle', name: 'Caramel Drizzle',
  art: 'assets/toon-art/Cosmo/cosmo-caramel-drizzle.png',
  description: 'A caramel dipped look for Cosmo. Clear Toy Workshop on Hard to unlock.',
  get available() { return MainStory.withCh(2, () => MainStory.hardDone('k10')); }
};

const CosmoCaramel = { pending: undefined };
{
  const originalSkin = Art.skin;
  Art.skin = function (id, costume) {
    if (id !== 'Cosmo') return originalSkin.apply(this, arguments);
    const selected = arguments.length > 1 ? costume : Save.data?.heroes?.Cosmo?.costume;
    CosmoCaramel.pending = selected;
    if (selected === CARAMEL_DRIZZLE.id) return CARAMEL_DRIZZLE.available ? CARAMEL_DRIZZLE : null;
    return originalSkin.apply(this, arguments);
  };
}

const CosmoCaramelRig = (() => {
  const NS = 'http://www.w3.org/2000/svg';
  const art = ASSET + CARAMEL_DRIZZLE.art;
  const clamp = (n, low, high) => Math.max(low, Math.min(high, n));
  const node = (tag, attrs, parent) => {
    const element = document.createElementNS(NS, tag);
    Object.entries(attrs || {}).forEach(([key, value]) => element.setAttribute(key, value));
    if (parent) parent.appendChild(element);
    return element;
  };
  const piece = (parent, x, y, width, height) => {
    const group = node('g', null, parent);
    const crop = node('svg', { x, y, width, height, viewBox: `${x} ${y} ${width} ${height}` }, group);
    node('image', { href: art, width: 242, height: 325 }, crop);
    return group;
  };

  class Rig {
    constructor(host) {
      const svg = node('svg', { class: 'rig-svg', viewBox: '0 0 242 325', 'aria-hidden': 'true' }, host);
      const root = node('g', null, svg);
      this.legL = piece(root, 105, 227, 34, 90);
      this.legR = piece(root, 133, 227, 45, 90);
      this.body = piece(root, 97, 153, 74, 87);
      this.head = piece(root, 7, 29, 234, 134);
      this.armL = piece(root, 95, 145, 34, 62);
      this.armR = piece(root, 151, 142, 43, 56);
      this.root = root;
      this.time = 0;
      this.hit = 0;
      this.lastHit = 0;
    }

    update(unit, dt) {
      dt = clamp(dt || 0, 0, .05);
      this.time += dt;
      const t = this.time;
      const moving = !!unit.moving;
      const state = unit.animT > 0 ? unit.animState : 'idle';
      const progress = unit.animT > 0 ? 1 - clamp(unit.animT / Math.max(.01, unit.animDur || 1), 0, 1) : 0;
      const action = Math.sin(progress * Math.PI);
      if ((unit.hitT || 0) > this.lastHit + .01) this.hit = .25;
      this.lastHit = unit.hitT || 0;
      this.hit = Math.max(0, this.hit - dt);

      let bob = Math.sin(t * (moving ? 11 : 2.8)) * (moving ? 4 : 1);
      let tilt = Math.sin(t * 1.5) * 1.1;
      let armL = Math.sin(t * 2.4) * 1.5;
      let armR = -armL;
      let legL = moving ? Math.sin(t * 11) * 8 : 0;
      let legR = -legL;
      if (state === 'attack' || state === 'wind') {
        bob -= action * 5; tilt += action * 5;
        armR -= action * 14; armL += action * 8;
      } else if (state === 'cast' || unit.casting) {
        bob -= action * 8; tilt -= action * 3;
        armL += action * 10; armR -= action * 10;
      } else if (state === 'spin') {
        tilt += progress * 20; armL += action * 10; armR -= action * 10;
      }
      if (unit.visualSleep) { bob += 5; tilt += 7; armL -= 7; armR += 7; }
      if (unit.visualStun) tilt += Math.sin(t * 13) * 7;
      if (this.hit) { tilt -= this.hit * 26; bob -= this.hit * 7; }

      this.root.setAttribute('transform', `translate(0 ${bob.toFixed(1)}) rotate(${tilt.toFixed(1)} 135 240)`);
      this.head.setAttribute('transform', `rotate(${(-tilt * .6).toFixed(1)} 125 152)`);
      this.armL.setAttribute('transform', `rotate(${armL.toFixed(1)} 109 157)`);
      this.armR.setAttribute('transform', `rotate(${armR.toFixed(1)} 179 153)`);
      this.legL.setAttribute('transform', `rotate(${legL.toFixed(1)} 121 236)`);
      this.legR.setAttribute('transform', `rotate(${legR.toFixed(1)} 151 236)`);
    }
  }

  return {
    enabled() {
      const selected = CosmoCaramel.pending === undefined
        ? Save.data?.heroes?.Cosmo?.costume : CosmoCaramel.pending;
      return Save.data?.opt?.animatedChars === true &&
        selected === CARAMEL_DRIZZLE.id && CARAMEL_DRIZZLE.available;
    },
    create(host) { CosmoCaramel.pending = undefined; return new Rig(host); }
  };
})();

{
  const originalExtras = HeroPage.extrasTab;
  HeroPage.extrasTab = function (id) {
    const wrap = originalExtras.call(this, id);
    if (id !== 'Cosmo') return wrap;
    const equipped = Save.hero(id).costume === CARAMEL_DRIZZLE.id;
    const unlocked = CARAMEL_DRIZZLE.available;
    const card = el('div', 'card hero-skin-card');
    card.innerHTML = `<div class="hero-skin-kicker">HARD MODE APPEARANCE</div>
      <div class="hero-skin-layout"><div class="hero-skin-swatches"><img src="${Art.defaultHero(id)}" alt="Default Cosmo"><img src="${ASSET + CARAMEL_DRIZZLE.art}" alt="Caramel Drizzle skin"></div>
        <div class="hero-skin-copy"><div class="row"><div class="grow"><b>Caramel Drizzle</b><small class="muted">Cosmo skin</small></div><span class="hero-skin-status">${equipped ? 'EQUIPPED' : unlocked ? 'UNLOCKED' : 'LOCKED'}</span></div>
        <p class="mini muted">Clear Toy Workshop on Hard.</p></div></div>`;
    const button = el('button', 'btn small hero-skin-button', equipped ? 'USE DEFAULT' : unlocked ? 'EQUIP SKIN' : 'LOCKED');
    button.type = 'button'; button.disabled = !unlocked;
    button.onclick = () => {
      if (!CARAMEL_DRIZZLE.available) return;
      Save.hero(id).costume = equipped ? null : CARAMEL_DRIZZLE.id;
      Save.write(); Sound.play('ui_ok'); this.draw();
    };
    card.appendChild(button);
    wrap.prepend(card);
    if (equipped) {
      const grid = wrap.querySelector('.gear-summary-grid');
      if (grid) grid.insertAdjacentHTML('beforeend', '<div><small>SKIN</small><b>Caramel Drizzle</b></div>');
    }
    return wrap;
  };
}
