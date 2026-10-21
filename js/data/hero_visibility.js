/* hero_visibility.js - combat tier is balance data, not roster copy. */
'use strict';

/* Keep the strength tier available to combat, enemy-pool weighting, and
   balance code, but stop generic UI/data inspection from turning it into a
   visible badge. Rarity remains the player-facing progression label. */
Object.values(HEROES).forEach(hero => {
  if (!hero || !Object.prototype.propertyIsEnumerable.call(hero, 'tier')) return;
  const tier = hero.tier;
  Object.defineProperty(hero, 'tier', {
    configurable: true,
    enumerable: false,
    writable: true,
    value: tier
  });
});
