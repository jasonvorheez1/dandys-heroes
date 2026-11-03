/* Vee's badge from Shelly gets its own art instead of the magnifier emoji. */
'use strict';

if (typeof BADGES !== 'undefined' && BADGES.vee_shelly) BADGES.vee_shelly.image = 'assets/vee-shelly-badge.svg';

/* The old effect only fired extra beams on two skills and was far weaker than the other friendship badges
   (+6% stats, no control, no payoff). Same theme, rebuilt around Vee's Headline. */
if (typeof BADGES !== 'undefined' && BADGES.vee_shelly) {
  Object.assign(BADGES.vee_shelly, {
    stat: lvl => '+' + (12 + lvl * 6) + '% Magic Attack · +' + (5 + lvl * 3) + '% Magic Penetration',
    effect: 'Shelly’s amber resin sets around the Headline! The Headline is Slowed by 25% for as long as Vee marks it. Spotlight On and Audience Surge fire an Amber Beam at the Headline for Magic Damage, add 2 Signal Interference stacks and crack 20% of its Shield. Every third Basic Attack on the Headline sends an Amber Pulse to up to 2 other enemies and gives Vee a Ratings stack. Once every 8s, an Amber Beam also Fossilizes the Headline, stunning it for 1.2s. When the Headline is defeated, Vee keeps the footage: +25 Energy and Prime Time for 6s.',
    apply(u, B, lvl) {
      u.flat.magP = (u.flat.magP || 0) + .12 + lvl * .06;
      u.flat.magPen = (u.flat.magPen || 0) + .05 + lvl * .03;
      u.dirty = true;
      const AMBER = '#ffb347';
      const headline = () => B.enemiesOf(u).find(e => e.alive && e.hasStatus('headline'));

      // Amber Seal: the marked target is slowed while it stays the Headline.
      B.every(u, .8, () => {
        const t = headline();
        if (!u.alive || !t) return;
        B.applyStatus(u, t, 'slow', 1.6, { val: .25 });
      });

      B.on(u, 'cast', ev => {
        if (!u.alive || (ev.key !== 'W' && ev.key !== 'G')) return;
        const t = headline();
        if (!t) return;
        B.after(.3, () => {
          if (!u.alive || !t.alive) return;
          B.damage(u, t, u.st.mag * (.6 + lvl * .1), { type: 'magic', chained: true, tag: 'Amber Beam' });
          if (!t.alive) return;
          B.applyStatus(u, t, 'vee_static', 6, { stacks: 2 });
          B.crackShield(u, t, .2, { color: AMBER });
          B.fxTargetLine({ x: u.x, y: u.y - 55 }, { x: t.x, y: t.y - 48 }, AMBER);
          B.fxSparkle(t.x, t.y - 40, 9, AMBER);
          Sound.play('laser_hit', { vol: .4, throttle: 120 });
          if (B.t >= (u._amberFossilAt || 0)) {
            u._amberFossilAt = B.t + 8;
            B.applyStatus(u, t, 'stun', 1.2);
            B.fxFloatIcon(t.x, t.y - 105, '🔶 FOSSILIZED', AMBER);
          }
        });
      });

      B.on(u, 'basicHit', ev => {
        const t = ev.target;
        if (!t || !t.alive || !t.hasStatus('headline')) return;
        u._amberVeeHits = (u._amberVeeHits || 0) + 1;
        if (u._amberVeeHits % 3 !== 0) return;
        B.enemiesOf(u).filter(e => e.alive && e !== t).slice(0, 2).forEach(e => {
          B.damage(u, e, u.st.mag * (.3 + lvl * .05), { type: 'magic', chained: true, tag: 'Amber Pulse' });
          B.fxSparkle(e.x, e.y - 40, 6, AMBER);
        });
        B.applyStatus(u, u, 'vee_ratings', 10, { stacks: 1 });
      });

      B.on(u, 'enemyDown', e => {
        if (!u.alive || !e || !e.hasStatus('headline')) return;
        B.energy(u, 25);
        B.applyStatus(u, u, 'primetime', 6);
        B.fxFloatIcon(u.x, u.y - 105, '🔶 FOOTAGE SAVED', AMBER);
      });
    }
  });
}
