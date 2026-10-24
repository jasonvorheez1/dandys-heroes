/* Rudie [Scraps] Friendship Disk — the star bell from A Star to Follow. */
'use strict';

defBadge({
  id: 'rudie_scraps', owner: 'Rudie', friend: 'Scraps',
  name: "Scraps's Star Bell", icon: '🔔', color: '#ffe18a',
  desc: 'Scraps stitched a paper star around Rudie’s bell. When the lights failed, he held still long enough for its sound to bring them together.',
  stat: lvl => `+${12 + lvl * 6}% Max HP · +${10 + lvl * 5}% Skill Haste`,
  effect: "Scraps' star bell turns Rudie's speed into a route home. At battle start and every 8s when Rudie casts Antler Rush, allies gain Energy and Speed Up while the most injured ally is shielded and cleansed. Antler Rush and Hoofstep Barrage Fray and Slow enemies; every third hit rings the bell, damaging nearby foes and lowering their Defense. Once every 10s, an ally who falls below 40% HP gains an emergency shield, a cleanse, Fortify, and Energy.",
  apply(u, B, lvl) {
    u.flat.hpP = (u.flat.hpP || 0) + .12 + lvl * .06;
    u.flat.cdr = (u.flat.cdr || 0) + .10 + lvl * .05;
    u.dirty = true;
    u._starRouteAt = -Infinity;
    u._starBellHits = 0;
    u._starBellBurstAt = -Infinity;
    u._starBellRescueAt = -Infinity;

    const guideRoute = () => {
      if (!u.alive || B.t < u._starRouteAt) return;
      u._starRouteAt = B.t + 8;
      Sound.play('cloth', { vol: .35, throttle: 180 });
      B.fxRing(u.x, u.y - 42, 200, '#ffe18a', .42);
      const allies = B.alliesOf(u).filter(a => a.alive);
      allies.forEach(a => {
        B.energy(a, 12 + lvl * 4);
        B.applyStatus(u, a, 'speedup', 5);
        B.fxSparkle(a.x, a.y - 40, 6, '#ffe18a');
      });
      const lost = B.lowestHp(allies);
      if (lost) {
        B.shield(u, lost, u.max.hp * (.16 + lvl * .04), 7);
        B.cleanse(lost, 1);
      }
      B.fxFloatIcon(u.x, u.y - 108, '⭐ STITCHED ROUTE', '#ffe18a');
    };

    B.after(.2, guideRoute);
    B.on(u, 'cast', ev => {
      if (ev && ev.key === 'W') guideRoute();
    });

    B.on(u, 'dealDamage', ev => {
      if (!ev || !ev.target || !ev.target.alive || ev.target.team === u.team || ev.dot) return;
      if (ev.tag !== 'Antler Rush' && ev.tag !== 'Hoofstep Barrage') return;
      B.applyStatus(u, ev.target, 'frayed', 5, { stacks: 1 });
      B.applyStatus(u, ev.target, 'slow', 3);
      u._starBellHits++;
      if (u._starBellHits % 3 || B.t < u._starBellBurstAt) return;
      u._starBellBurstAt = B.t + 5;
      const center = ev.target;
      Sound.play('hit_heavy', { vol: .36, throttle: 140 });
      B.fxRing(center.x, center.y - 40, 155, '#ffe18a', .42);
      B.fxFloatIcon(center.x, center.y - 100, '🔔 STAR BELL!', '#ffe18a');
      B.enemiesOf(u).filter(e => e.alive && B.distance(e, center) <= 155).forEach(e => {
        B.damage(u, e, u.st.atk * (.55 + lvl * .15), { type: 'physical', area: true, tag: 'Star Bell Burst' });
        if (e.alive) B.applyStatus(u, e, 'defdown', 5, { stacks: lvl >= 4 ? 2 : 1 });
      });
    });

    B.on(u, 'allyDamaged', ev => {
      const ally = ev && ev.unit;
      if (!ally || !ally.alive || ally.team !== u.team || B.t < u._starBellRescueAt) return;
      // allyDamaged fires before damage leaves the target's HP. Check the
      // projected result so the bell catches the hit that crosses 40%.
      const hpAfterHit = ally.hp - Math.max(0, (ev.amount || 0) - ally.shieldTotal);
      if (hpAfterHit / ally.max.hp >= .40) return;
      u._starBellRescueAt = B.t + 10;
      B.cleanse(ally, 2);
      B.shield(u, ally, u.max.hp * (.18 + lvl * .05), 7);
      B.applyStatus(u, ally, 'fortify', 6, { stacks: 2 });
      B.energy(ally, 18 + lvl * 5);
      B.fxRing(ally.x, ally.y - 40, 115, '#ffe18a', .4);
      B.fxFloatIcon(ally.x, ally.y - 105, '⭐ WAY HOME!', '#ffe18a');
    });
  }
});
