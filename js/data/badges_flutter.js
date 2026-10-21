/* badges_flutter.js - Flutter and Flyte's shared scrapbook badge. */
'use strict';

defBadge({
  id: 'flutter_flyte', owner: 'Flutter', friend: 'Flyte',
  name: "Flyte's Shared Scrapbook", icon: '📖', color: '#a8ecff',
  desc: 'A scrapbook with two versions of every daring story, because Flutter and Flyte never remember the same landing.',
  stat: lvl => `+${(lvl * 3).toFixed(0)}% Evasion · +${(lvl * 2.5).toFixed(1)}% Critical Chance`,
  effect: 'When Flutter uses Floaty Dash or dodges an attack, Flyte coordinates an Airstrike Divebomb on the target area, dealing physical damage, knocking enemies back, and creating a Slipstream that grants all allies +30% Move Speed and +25% Attack Speed for 4.5s. Striking 2+ enemies refunds 50% of the Dash cooldown.',
  apply(u, B, lvl) {
    u.flat.evaP = (u.flat.evaP || 0) + lvl * .03;
    u.flat.crit = (u.flat.crit || 0) + lvl * .025;
    u.dirty = true;

    const triggerDivebomb = (targetX, targetY) => {
      if (!u.alive) return;
      const tx = targetX != null ? targetX : (u.target ? u.target.x : u.x + u.face * 100);
      const ty = targetY != null ? targetY : (u.target ? u.target.y : u.y);
      Sound.play('sweep', { vol: .4 });
      Sound.play('hit_heavy', { vol: .42, throttle: 120 });
      B.fxRing(tx, ty - 35, 140, '#a8ecff', .4);
      B.fxSparkle(tx, ty - 45, 12, '#a8ecff');
      B.fxFloatIcon(u.x, u.y - 105, '📖', '#a8ecff');

      let hits = 0;
      const dmg = u.st.atk * (.85 + lvl * .25);
      B.enemiesOf(u).filter(e => e.alive && Math.hypot(e.x - tx, (e.depth - u.depth) * B.depthSpan) < 160).forEach(foe => {
        hits++;
        B.damage(u, foe, dmg, { type: 'physical', tag: 'Flyte Divebomb' });
        B.knockback(u, foe, 110 + lvl * 15);
        B.applyStatus(u, foe, 'slow', 3);
      });

      // Slipstream team speed boost
      B.alliesOf(u).forEach(a => {
        B.applyStatus(u, a, 'speedup', 4.5);
        B.applyStatus(u, a, 'haste', 4.5);
        B.fxSparkle(a.x, a.y - 40, 6, '#a8ecff');
      });

      if (hits >= 2 && u.cds && u.cds.W > 0) {
        u.cds.W = Math.max(0, u.cds.W * .5);
        Sound.play('get_rare', { vol: .3 });
      }
    };

    B.on(u, 'cast', ev => {
      if (ev.key === 'W') triggerDivebomb(u.x, u.y);
    });

    B.on(u, 'dodged', ev => {
      if (!ev || !ev.src || ev.src.team === u.team) return;
      B.energy(u, 2 + lvl);
      if (B.t >= (u._flyteAirstrikeAt || 0)) {
        u._flyteAirstrikeAt = B.t + Math.max(3, 6 - lvl * .5);
        triggerDivebomb(ev.src.x, ev.src.y);
      }
    });
  }
});

defBadge({
  id: 'flyte_brightney', owner: 'Flyte', friend: 'Brightney',
  name: "Brightney's Steady Light", icon: '💡', color: '#ffe59a',
  desc: 'A carefully shaded bulb Brightney lent Flyte, with a reminder that looking after others includes looking after yourself.',
  stat: lvl => `+${(lvl * 3.5).toFixed(1)}% Shield Power · +${(lvl * 2).toFixed(0)}% Skill Haste`,
  effect: 'Brightney’s light radiates through Flyte’s barriers. Whenever Flyte shields an ally, a Prismatic Flash Blinds all nearby enemies for 2.5s+ and strips a buff. While protected by Flyte\'s shields, allies reflect a percentage of all incoming damage back as Magic Damage.',
  apply(u, B, lvl) {
    u.flat.shieldPowP = (u.flat.shieldPowP || 0) + lvl * .035;
    u.flat.cdr = (u.flat.cdr || 0) + lvl * .02;
    u.dirty = true;

    B.on(u, 'shieldDone', ev => {
      const ally = ev && ev.target;
      if (!ally || ally.team !== u.team || !ally.alive) return;
      B.applyStatus(u, ally, 'haste', 4 + lvl * .4);
      B.fxFloatIcon(ally.x, ally.y - 100, '💡', '#ffe59a');

      // Prismatic flash on shielded target
      Sound.play('beam_fire', { vol: .32, throttle: 100 });
      B.fxRing(ally.x, ally.y - 40, 180, '#ffe59a', .45);
      B.fxSparkle(ally.x, ally.y - 40, 10, '#fff3b0');

      B.enemiesOf(u).filter(e => e.alive && Math.hypot(e.x - ally.x, (e.depth - ally.depth) * B.depthSpan) < 220).forEach(e => {
        B.applyStatus(u, e, 'blind', 2.5 + lvl * .4);
        B.dispel(e, 1);
      });
    });

    // Damage deflection for shielded allies
    const reflectPct = .20 + lvl * .04;
    B.on(u, 'allyDamaged', ev => {
      if (!ev || !ev.unit || ev.unit.team !== u.team || !ev.src || ev.src.team === u.team || !ev.src.alive) return;
      if (!ev.unit.shields || !ev.unit.shields.some(sh => sh.src === u)) return;
      if (ev.redirected || ev.dot) return;
      const reflected = Math.max(1, Math.round((ev.amount || 0) * reflectPct));
      B.damage(u, ev.src, reflected, { type: 'magic', redirected: true, tag: 'Prismatic Deflection' });
      B.fxSparkle(ev.src.x, ev.src.y - 40, 4, '#ffe59a');
    });
  }
});
