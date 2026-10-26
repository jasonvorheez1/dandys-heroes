/* A Hero's aura shows the tier of the Prism Class pair they rolled (Common..Legendary). */
window.RarityAura = {
  tierOf(hero) {
    if (!hero || !hero.cls2 || !hero.rainbowUnlocked) return 0;
    return Math.max(1, Math.min(4, Math.floor(Number(hero.prismTier) || 1)));
  },
  markup(tier, seed = '') {
    tier = Math.max(0, Math.min(4, Math.floor(Number(tier) || 0)));
    if (tier < 2) return '';
    const hash = [...String(seed)].reduce((value, letter) => value + letter.charCodeAt(0), 0);
    const ring = '<img class="rarity-aura-ring" src="assets/aura/ring-' + tier + '.png" alt="">';
    return `<span class="rarity-aura rarity-aura-${tier}" style="--aura-delay:-${(hash % 37) / 10}s" aria-hidden="true">${ring}<img class="rarity-aura-art" src="assets/aura/aura-${tier}.webp" alt=""></span>`;
  }
};
