/* Big Wig's two Cog friendship badges are owned immediately, with no campaign. */
'use strict';

defBadge({
  id: 'bigwig_legaleagle', owner: 'BigWig', friend: 'LegalEagle', upgradeCurrency: 'unknownWorldGears', immediate: true,
  name: "Legal Eagle's Appeal Brief", icon: '⚖️', color: '#8dc4e8', skillKey: 'B',
  desc: 'A court brief signed by Legal Eagle and filed under Big Wig’s bench.',
  stat: lvl => `+${10 + lvl * 5}% Defense · +${10 + lvl * 5}% Magic Defense`,
  effect: 'Power Trip shields all allies for 5 seconds based on Big Wig’s max HP and cleanses 1 debuff from each.',
  apply(u, B, lvl) {
    u.flat.defP = (u.flat.defP || 0) + .10 + lvl * .05;
    u.flat.mdefP = (u.flat.mdefP || 0) + .10 + lvl * .05;
    u.dirty = true;
    B.on(u, 'cast', ev => {
      if (ev.key !== 'B') return;
      B.after(.35, () => {
        if (!u.alive) return;
        B.alliesOf(u).forEach(ally => {
          if (!ally.alive) return;
          B.shield(u, ally, u.max.hp * (.06 + lvl * .015), 5);
          B.cleanse(ally, 1);
        });
      });
    });
  }
});

defBadge({
  id: 'bigwig_pencilpusher', owner: 'BigWig', friend: 'PencilPusher', upgradeCurrency: 'unknownWorldGears', immediate: true,
  name: "Pencil Pusher's Case Ledger", icon: '📋', color: '#9db49c', skillKey: 'W',
  desc: 'Pencil Pusher’s meticulous ledger keeps every conviction on the record.',
  stat: lvl => `+${10 + lvl * 4}% Skill Haste · +${10 + lvl * 5}% Magic Attack`,
  effect: 'When Big Wig Convicts an enemy, he drains Power from that enemy and gains Power himself. Triggers at most once every 4 seconds.',
  apply(u, B, lvl) {
    u.flat.cdr = (u.flat.cdr || 0) + .10 + lvl * .04;
    u.flat.magP = (u.flat.magP || 0) + .10 + lvl * .05;
    u.dirty = true;
    B.on(u, 'statusApplied', ev => {
      if (ev.src !== u || ev.id !== 'convicted' || !ev.unit || ev.unit.team === u.team || !ev.unit.alive) return;
      if (B.t < (u._caseLedgerAt || 0)) return;
      u._caseLedgerAt = B.t + 4;
      B.energy(ev.unit, -(10 + lvl * 3));
      B.energy(u, 6 + lvl * 2);
    });
  }
});
