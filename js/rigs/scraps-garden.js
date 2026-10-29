/* Garden Bouquet changes Scraps' cutout textures; the original rig keeps
   every joint, spring, attack pose and Story Mode animation. */
'use strict';

const GARDEN_BOUQUET = {
  id: 'garden-bouquet', name: 'Garden Bouquet',
  art: 'Characters/scraps/scraps-garden-portrait.png',
  battleArt: 'Characters/scraps/scraps-garden-still.png',
  description: 'A flower crown, petal dress and leafy paws for Scraps. Clear Hall of Mirrors on Hard to unlock.',
  get available() { return MainStory.withCh(2, () => MainStory.hardDone('k7')); }
};

/* Keep Pastel Bow as a separate appearance. Its painted portrait is static;
   Garden Bouquet is the one that uses Scraps' moving cutout. */
HERO_SKINS.Scraps.noRig = true;

const ScrapsGarden = { pending: undefined };
{
  const originalSkin = Art.skin;
  Art.skin = function (id, costume) {
    if (id !== 'Scraps') return originalSkin.apply(this, arguments);
    const selected = arguments.length > 1 ? costume : Save.data?.heroes?.Scraps?.costume;
    ScrapsGarden.pending = selected;
    if (selected === GARDEN_BOUQUET.id) return GARDEN_BOUQUET.available ? GARDEN_BOUQUET : null;
    return originalSkin.apply(this, arguments);
  };
}

/* Scraps has separate default portrait and action poses. Keep that distinction
   for the garden costume so previews and combat use their matching poses. */
{
  const originalBattleHero = Art.battleHero;
  Art.battleHero = function (id, costume) {
    if (id === 'Scraps') {
      const skin = arguments.length > 1 ? Art.skin(id, costume) : Art.skin(id);
      if (skin?.id === GARDEN_BOUQUET.id) return ASSET + GARDEN_BOUQUET.battleArt;
    }
    return originalBattleHero.apply(this, arguments);
  };
}

/* Same atlas layout as scraps-rig.png, recolored and decorated (flower crown, leaf ears,
   green paws, coral petal dress), so every joint and animation is Scraps' own. */
const GARDEN_ATLAS = 'Characters/scraps/scraps-garden-rig.png';

function gardenRig(rig) {
  const R = rig.R;
  if (!R?.svg) return rig;
  R.svg.classList.add('garden-bouquet-rig');
  R.svg.querySelectorAll('image').forEach(img => {
    img.setAttribute('href', ASSET + GARDEN_ATLAS);
    img.removeAttributeNS('http://www.w3.org/1999/xlink', 'href');
  });
  // lids and cheek ticks are vector, so match them to the new pink face
  R.eye.forEach(eye => {
    eye.low.setAttribute('fill', '#f4ccc8');
    eye.lid.querySelector('rect')?.setAttribute('fill', '#f4ccc8');
    eye.st.setAttribute('fill', '#e86e78');
  });
  return rig;
}

{
  const originalCreate = ScrapsRig.create;
  ScrapsRig.create = function (host, costume) {
    const selected = arguments.length > 1 ? costume
      : ScrapsGarden.pending === undefined ? Save.data?.heroes?.Scraps?.costume : ScrapsGarden.pending;
    ScrapsGarden.pending = undefined;
    const rig = originalCreate.call(this, host);
    return selected === GARDEN_BOUQUET.id && GARDEN_BOUQUET.available ? gardenRig(rig) : rig;
  };
}

/* The Hero page offers Garden Bouquet alongside the existing Pastel Bow. */
{
  const originalExtras = HeroPage.extrasTab;
  HeroPage.extrasTab = function (id) {
    const wrap = originalExtras.call(this, id);
    if (id !== 'Scraps') return wrap;
    const equipped = Save.hero(id).costume === GARDEN_BOUQUET.id;
    const unlocked = GARDEN_BOUQUET.available;
    const card = el('div', 'card hero-skin-card');
    card.innerHTML = `<div class="hero-skin-kicker">HARD MODE APPEARANCE</div>
      <div class="hero-skin-layout"><div class="hero-skin-swatches"><img src="${Art.defaultHero(id)}" alt="Default Scraps"><img src="${ASSET + GARDEN_BOUQUET.art}" alt="Garden Bouquet skin"></div>
        <div class="hero-skin-copy"><div class="row"><div class="grow"><b>Garden Bouquet</b><small class="muted">Scraps skin</small></div><span class="hero-skin-status">${equipped ? 'EQUIPPED' : unlocked ? 'UNLOCKED' : 'LOCKED'}</span></div>
        <p class="mini muted">Clear Hall of Mirrors on Hard.</p></div></div>`;
    const button = el('button', 'btn small hero-skin-button', equipped ? 'USE DEFAULT' : unlocked ? 'EQUIP SKIN' : 'LOCKED');
    button.type = 'button'; button.disabled = !unlocked;
    button.onclick = () => {
      if (!GARDEN_BOUQUET.available) return;
      Save.hero(id).costume = equipped ? null : GARDEN_BOUQUET.id;
      Save.write(); Sound.play('ui_ok'); this.draw();
    };
    card.appendChild(button);
    const pastel = wrap.querySelector('.hero-skin-card');
    if (pastel) pastel.after(card); else wrap.prepend(card);
    const skinLabel = [...wrap.querySelectorAll('.gear-summary-grid > div')].find(node => node.querySelector('small')?.textContent === 'SKIN');
    if (skinLabel && equipped) skinLabel.querySelector('b').textContent = GARDEN_BOUQUET.name;
    return wrap;
  };
}
