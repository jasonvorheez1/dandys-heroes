/* Scraps [Poppy] Friendship Disk — the claw caps from Made to Last. */
'use strict';

defBadge({
  id: 'scraps_poppy', owner: 'Scraps', friend: 'Poppy',
  name: "Poppy's Painted Claw Caps", icon: '💅', color: '#8de8ef',
  desc: 'Poppy painted the caps to match their repaired display. Scraps sealed every color so it would stay, even when the room shook.',
  stat: lvl => `+${12 + lvl * 6}% Attack · +${10 + lvl * 5}% Shield Power`,
  effect: "Poppy's bubbles reinforce Scraps' Crafty Grapple. At battle start and whenever she Grapples, all allies gain a Bubble Stitch shield, cleanse 1 debuff, and gain Speed Up. While shielded, Scraps' craft hits can burst into a Painted Pop every 4s: nearby enemies take Physical Damage, lose 1 buff, and become Slowed and Exposed. When one of her shields breaks, its wearer is healed, cleansed, and gains Speed Up once every 8s.",
  apply(u, B, lvl) {
    u.flat.atkP = (u.flat.atkP || 0) + .12 + lvl * .06;
    u.flat.shieldPowP = (u.flat.shieldPowP || 0) + .10 + lvl * .05;
    u.dirty = true;
    u._paintedPopAt = -Infinity;
    u._bubbleSeamAt = -Infinity;

    const bubbleStitch = () => {
      if (!u.alive) return;
      Sound.play('bounce', { vol: .34, throttle: 180 });
      B.fxRing(u.x, u.y - 40, 190, '#8de8ef', .42);
      B.alliesOf(u).filter(a => a.alive).forEach(a => {
        B.shield(u, a, u.max.hp * (.18 + lvl * .04), 8);
        B.cleanse(a, 1);
        B.applyStatus(u, a, 'speedup', 5);
        B.fxSparkle(a.x, a.y - 40, 7, '#8de8ef');
      });
      B.fxFloatIcon(u.x, u.y - 110, '🫧 BUBBLE STITCH', '#8de8ef');
    };

    B.after(.2, bubbleStitch);
    B.on(u, 'cast', ev => {
      if (ev && ev.key === 'W') bubbleStitch();
    });

    B.on(u, 'dealDamage', ev => {
      if (!ev || !ev.target || !ev.target.alive || ev.target.team === u.team || ev.dot) return;
      if (u.shieldTotal <= 0 || B.t < u._paintedPopAt) return;
      if (!/Crafty Grapple|Claws|Flail|Yarn Ball|Craft Circle|Craft Class Crash|Scissor/i.test(ev.tag || '')) return;
      u._paintedPopAt = B.t + 4;
      const center = ev.target;
      Sound.play('campaign_bubble_pop', { vol: .42, throttle: 120 });
      B.fxRing(center.x, center.y - 40, 145, '#8de8ef', .42);
      B.fxSparkle(center.x, center.y - 45, 12, '#ff9fce');
      B.fxFloatIcon(center.x, center.y - 100, '💅 PAINTED POP', '#8de8ef');
      B.enemiesOf(u).filter(e => e.alive && B.distance(e, center) <= 145).forEach(e => {
        B.damage(u, e, u.st.atk * (.62 + lvl * .16), { type: 'physical', area: true, tag: 'Painted Pop' });
        if (!e.alive) return;
        B.dispel(e, 1);
        B.applyStatus(u, e, 'slow', 3);
        B.applyStatus(u, e, 'exposed', 5);
      });
    });

    B.on(u, 'allyShieldBreak', ev => {
      if (!ev || !ev.unit || !ev.unit.alive || !ev.shield || ev.shield.src !== u || B.t < u._bubbleSeamAt) return;
      u._bubbleSeamAt = B.t + 8;
      const ally = ev.unit;
      B.heal(u, ally, ally.max.hp * (.10 + lvl * .025), { tag: 'Bubble Seam' });
      B.cleanse(ally, 2);
      B.applyStatus(u, ally, 'speedup', 5);
      B.fxRing(ally.x, ally.y - 40, 105, '#8de8ef', .35);
      B.fxFloatIcon(ally.x, ally.y - 102, '🧵 SEAM HOLDS!', '#8de8ef');
    });
  }
});
