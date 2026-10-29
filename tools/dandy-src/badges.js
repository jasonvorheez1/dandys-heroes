/* Dandy's two friendship badges. Only one badge can be equipped at a time. */
'use strict';

defBadge({
  id: 'dandy_brusha', owner: 'Dandy', friend: 'Brusha', skillKey: 'W',
  name: "Brusha's Spotlight Palette", icon: '🎨', image: 'assets/dandy-brusha-badge.svg', color: '#ff82bd',
  desc: 'Brusha painted a frame for Dandy, then deliberately left enough room for everyone else.',
  stat: lvl => `+${10 + lvl * 4}% Attack · +${6 + lvl * 3}% Skill Haste`,
  effect: 'At battle start, Brusha marks the strongest enemy with Neglect and paints down its defenses. Center of Attention paints the three most neglected enemies. The first hit on each painted enemy bursts paint onto nearby foes and gives two allies Vibrant Pigment and Energy.',
  apply(u, B, lvl) {
    u.flat.atkP_dandyBrusha = .10 + lvl * .04;
    u.flat.cdr_dandyBrusha = .06 + lvl * .03;
    u.dirty = true;
    const painted = new Map();
    const mark = (target, dur) => {
      if (!target || !target.alive) return;
      painted.set(target, B.t + dur);
      B.applyStatus(u, target, 'defdown', dur, { stacks: 2 });
      B.applyStatus(u, target, 'magdown', dur, { stacks: 2 });
      B.fxPaintMark(target.x, target.y - 52, ['#ff69ad', '#ffd166', '#69cfff'], .95);
      B.fxFloatIcon(target.x, target.y - 105, '🎨 PAINTED', '#ff82bd');
    };
    B.after(.2, () => {
      if (!u.alive) return;
      const target = B.highestStat(B.enemiesOf(u).filter(e => e.alive), 'atk');
      if (!target) return;
      dandyRecord(u, B, target, 'neglect', u.dandyMax || 5);
      mark(target, 6);
    });
    B.on(u, 'cast', ev => {
      if (ev.key !== 'W') return;
      const targets = B.enemiesOf(u).filter(e => e.alive)
        .sort((a, b) => dandyStacks(u, b, 'neglect') - dandyStacks(u, a, 'neglect')).slice(0, 3);
      targets.forEach(e => mark(e, 7));
      if (targets.length) { Sound.play('paint_swipe', { vol: .55 }); B.fxRing(u.x, u.y - 55, 220, '#ff82bd', .32); }
    });
    B.on(u, 'dealDamage', ev => {
      if (!ev || ev.tag !== 'Center of Attention' || !ev.target || !ev.target.alive) return;
      const expires = painted.get(ev.target);
      if (!expires || expires < B.t) return;
      painted.delete(ev.target);
      const target = ev.target;
      Sound.play('paint_splash', { vol: .45, throttle: 100 });
      B.fxPaintMark(target.x, target.y - 50, ['#ff69ad', '#69cfff', '#ffd166'], 1.1);
      B.fxRing(target.x, target.y - 45, 155, '#ff82bd', .42);
      B.enemiesOf(u).filter(e => e !== target && e.alive && Math.abs(e.x - target.x) <= 155)
        .forEach(e => B.damage(u, e, u.st.atk * (.48 + lvl * .08), { type: 'physical', area: true, tag: 'Painted Encore' }));
      B.alliesOf(u).filter(a => a.alive).sort((a, b) => a.hpPct - b.hpPct).slice(0, 2).forEach(a => {
        B.applyStatus(u, a, 'vibrant', 5 + lvl * .4);
        B.energy(a, 8 + lvl * 2);
        B.fxSparkle(a.x, a.y - 45, 7, '#ff82bd');
      });
    });
  }
});

defBadge({
  id: 'dandy_pebble', owner: 'Dandy', friend: 'Pebble', skillKey: 'G',
  name: "Pebble's Lookout Bell", icon: '🐾', image: 'assets/dandy-pebble-badge.svg', color: '#d6e4f2',
  desc: 'Pebble pushed his spare bell into Dandy’s hand. It rings whenever someone needs him.',
  stat: lvl => `+${10 + lvl * 3}% Max HP · +${8 + lvl * 2}% Evasion`,
  effect: 'Dandy begins battle with a protective shield and a burst of speed. When an enemy attacks an ally, the bell barks back: that enemy gains Neglect, is Taunted and Slowed, the ally gets a shield and speed, and Dandy gains Energy. Reaching maximum Neglect grants Dandy a brief guard and protects the weakest ally.',
  apply(u, B, lvl) {
    u.flat.hpP_dandyPebble = .10 + lvl * .03;
    u.flat.evaP_dandyPebble = .08 + lvl * .02;
    u.dirty = true;
    let barkAt = -Infinity, guardAt = -Infinity;
    B.after(.2, () => {
      if (!u.alive) return;
      B.shield(u, u, u.max.hp * (.11 + lvl * .02), 7);
      B.applyStatus(u, u, 'speedup', 5);
      B.fxFloatIcon(u.x, u.y - 115, '🐾 LOOKOUT', '#d6e4f2');
    });
    B.on(u, 'allyDamaged', ev => {
      if (!u.alive || !ev || !ev.unit || ev.unit === u || !ev.unit.alive || !ev.src || !ev.src.alive || ev.src.team === u.team || ev.dot || B.t < barkAt) return;
      barkAt = B.t + Math.max(3.5, 6 - lvl * .4);
      dandyRecord(u, B, ev.src, 'neglect', u.dandyMax || 5);
      B.applyStatus(u, ev.src, 'taunt', 1.35 + lvl * .12);
      B.applyStatus(u, ev.src, 'slow', 3);
      B.shield(u, ev.unit, u.max.hp * (.08 + lvl * .02), 5);
      B.applyStatus(u, ev.unit, 'speedup', 4);
      B.energy(u, 10 + lvl * 2);
      Sound.play('pebble_speak', { vol: .55, throttle: 300 });
      B.fxBark(u, 4, '#d6e4f2');
      B.fxFloatIcon(ev.unit.x, ev.unit.y - 106, '🐾 PROTECTED', '#d6e4f2');
    });
    B.on(u, 'statusApplied', ev => {
      if (!u.alive || !ev || ev.src !== u || ev.id !== 'neglect' || !ev.unit || B.t < guardAt) return;
      if (dandyStacks(u, ev.unit, 'neglect') < (u.dandyMax || 5)) return;
      guardAt = B.t + 6;
      B.applyStatus(u, u, 'fortify', 5, { stacks: 2 });
      B.applyStatus(u, u, 'speedup', 5);
      const ally = B.lowestHp(B.alliesOf(u).filter(a => a.alive && a !== u));
      if (ally) B.shield(u, ally, u.max.hp * (.10 + lvl * .025), 6);
      B.fxRing(u.x, u.y - 48, 150, '#d6e4f2', .38);
      B.fxFloatIcon(u.x, u.y - 116, '🐾 GOOD BOY!', '#d6e4f2');
    });
  }
});
