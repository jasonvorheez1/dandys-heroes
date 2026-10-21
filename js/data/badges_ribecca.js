/* badges_ribecca.js - Cheer Bear Shelly's Friendship Badge. */
'use strict';

defBadge({
  id: 'cheerbear_shelly_ribecca', owner: 'CheerbearShelly', friend: 'Ribecca',
  name: "Ribecca's Pink Thread", icon: '🧵', color: '#ff8fc8',
  desc: 'A pink thread Ribecca left in the Cheer Bear costume as a quiet finishing touch.',
  stat: lvl => `+${(lvl * 2.5).toFixed(1)}% Shield Power`,
  effect: 'Cheer Bear Shelly gains Shield Power. When she Encourages an ally, that ally is cleansed and also gains a small burst of Energy.',
  apply(u, B, lvl) {
    u.flat.shieldPowP = (u.flat.shieldPowP || 0) + lvl * .025;
    u.dirty = true;
    B.on(u, 'statusApplied', ev => {
      if (ev.src !== u || ev.id !== 'cbencouraged' || !ev.unit || ev.unit.team !== u.team) return;
      B.cleanse(ev.unit, 1);
      B.energy(ev.unit, 3 + lvl * 2);
      B.fxFloatIcon(ev.unit.x, ev.unit.y - 100, '🧵', '#ff8fc8');
    });
  }
});

defBadge({
  id: 'ribecca_scraps', owner: 'Ribecca', friend: 'Scraps',
  name: "Scraps' Patchwork Pattern", icon: '🧷', color: '#c7a0ff',
  desc: 'A mismatched little seam that turned two strong ideas into one costume.',
  stat: lvl => `+${(lvl * 1.8).toFixed(1)}% Control Resistance`,
  effect: 'When Ribecca puts an enemy Off Rhythm, she gains a brief patchwork shield, Energy, and Focus. The fitting has a short cooldown.',
  apply(u, B, lvl) {
    u.flat.ccRes = (u.flat.ccRes || 0) + lvl * .018;
    u.dirty = true;
    u._patchworkAt = -Infinity;
    B.on(u, 'statusApplied', ev => {
      if (ev.src !== u || ev.id !== 'offrhythm' || !ev.unit || ev.unit.team === u.team) return;
      if (B.t - u._patchworkAt < Math.max(2.8, 5.4 - lvl * .35)) return;
      u._patchworkAt = B.t;
      B.shield(u, u, u.max.hp * (.025 + lvl * .01), 4.5 + lvl * .3);
      B.energy(u, 2 + lvl);
      B.applyStatus(u, u, 'focus', 2.2 + lvl * .25);
      B.fxFloatIcon(u.x, u.y - 105, '🧷', '#c7a0ff');
    });
  }
});
