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

/* ============================================================ FLYTE [FLUTTER] DISK (DHBM) */
defBadge({
  id: 'flyte_flutter', owner: 'Flyte', friend: 'Flutter',
  name: "Flutter's Field Diary", icon: '🦋', color: '#7ce8f7',
  desc: "Flutter's handwritten diary containing her perspective on every aerial mission, complete with corrections to Flyte's embellished landing stories.",
  stat: lvl => `+${(lvl * 3.5).toFixed(1)}% Stun Duration · +${(lvl * 3.0).toFixed(1)}% Max Health`,
  effect: 'Whenever Flutter dashes or Flyte casts Wing Slam, both gain an aerodynamic Gale Barrier and refund 50% of the other\'s skill cooldown (once every 8s). While Flutter is alive, Flyte\'s Stuns inflict 2 stacks of Turbulence, and Mocking Swoop heals Flutter for 50% of Flyte\'s self-heal.',
  apply(u, B, lvl) {
    u.flat.hpP = (u.flat.hpP || 0) + lvl * .03;
    u.dirty = true;

    B.on(u, 'cast', ev => {
      if (ev.key === 'G') {
        const flutter = B.alliesOf(u).find(a => a.id === 'Flutter' && a.alive);
        if (flutter && B.t >= (u._flyteFlutterSyncAt || 0)) {
          u._flyteFlutterSyncAt = B.t + 8.0;
          const shieldVal = u.max.hp * (.15 + lvl * .03) + u.st.mag * .4;
          B.shield(u, u, shieldVal, 5.0);
          B.shield(u, flutter, shieldVal, 5.0);
          B.applyStatus(u, flutter, 'speedup', 4.0);
          if (flutter.cds && flutter.cds.W > 0) flutter.cds.W *= .5;
          B.fxSparkle(flutter.x, flutter.y - 40, 8, '#7ce8f7');
          B.fxFloatIcon(flutter.x, flutter.y - 100, '🦋 FLIGHT SYNC', '#7ce8f7');
        }
      }
    });

    B.on(u, 'statusApplied', ev => {
      if (ev && ev.id === 'stun' && ev.src === u && ev.unit && ev.unit.team !== u.team) {
        B.applyStatus(u, ev.unit, 'turbulence', 6.0, { stacks: 2 });
      }
    });
  }
});

/* ============================================================ FLYTE [BASSIE] DISK (DHBM) */
defBadge({
  id: 'flyte_bassie', owner: 'Flyte', friend: 'Bassie',
  name: "Bassie's Emergency Rations", icon: '🧺', color: '#ffeaa7',
  desc: 'An emergency ration basket packed tight by Bassie, because even stubborn flyers need fuel on long descent runs.',
  stat: lvl => `+${(lvl * 4.0).toFixed(1)}% Shield Power · +${(lvl * 2.5).toFixed(1)}% Damage Reduction`,
  effect: 'Whenever Flyte\'s Gale Barrier breaks or expires on an ally, it drops a Ration Basket that heals that ally for 16% Max HP + Magic and grants 25 Energy. Additionally, when Flyte triggers Mocking Swoop, Bassie hurls a smoke bomb that Blinds all nearby foes for 3.5s.',
  apply(u, B, lvl) {
    u.flat.shieldPowP = (u.flat.shieldPowP || 0) + lvl * .04;
    u.flat.wardP = (u.flat.wardP || 0) + lvl * .025;
    u.dirty = true;

    B.on(u, 'shieldDone', ev => {
      const ally = ev && ev.target;
      if (!ally || ally.team !== u.team || !ally.alive) return;
      const healAmt = ally.max.hp * (.16 + lvl * .02) + u.st.mag * .3;
      B.heal(u, ally, healAmt, { tag: 'Emergency Rations' });
      B.energy(ally, 25);
      B.fxFloatIcon(ally.x, ally.y - 100, '🧺 RATIONS +25⚡', '#ffeaa7');
      B.fxSparkle(ally.x, ally.y - 40, 8, '#ffeaa7');
    });

    B.on(u, 'cast', ev => {
      if (ev.key === 'B') {
        Sound.play('bomb', { vol: .4 });
        B.enemiesOf(u).filter(e => e.alive && B.distance(e, u) < 240).forEach(e => {
          B.applyStatus(u, e, 'blind', 3.5);
          B.fxSparkle(e.x, e.y - 40, 6, '#ffeaa7');
        });
        B.fxFloatIcon(u.x, u.y - 110, '💨 SMOKE SCREEN', '#ffeaa7');
      }
    });
  }
});
