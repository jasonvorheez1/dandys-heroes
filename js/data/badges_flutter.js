/* badges_flutter.js - Flutter and Flyte's shared scrapbook badge. */
'use strict';

defBadge({
  id: 'flutter_flyte', owner: 'Flutter', friend: 'Flyte',
  name: "Flyte's Shared Scrapbook", icon: '📖', color: '#a8ecff',
  desc: 'A scrapbook with two versions of every daring story, because Flutter and Flyte never remember the same landing.',
  stat: lvl => `+${(lvl * 1.5).toFixed(1)}% Evasion`,
  effect: 'Flutter gains Evasion. When she dodges an enemy Skill, she restores Energy and leaves a brief gust trail.',
  apply(u, B, lvl) {
    u.flat.evaP = (u.flat.evaP || 0) + lvl * .015;
    u.dirty = true;
    B.on(u, 'dodged', ev => {
      if (!ev || !ev.src || ev.src.team === u.team) return;
      B.energy(u, 1 + Math.floor(lvl / 2));
      if (typeof flutterCreateTrail === 'function') flutterCreateTrail(u, B, { trailDur: 1.2 + lvl * .18 });
      B.fxFloatIcon(u.x, u.y - 105, '📖', '#a8ecff');
    });
  }
});

defBadge({
  id: 'flyte_brightney', owner: 'Flyte', friend: 'Brightney',
  name: "Brightney's Steady Light", icon: '💡', color: '#ffe59a',
  desc: 'A carefully shaded bulb Brightney lent Flyte, with a reminder that looking after others includes looking after yourself.',
  stat: lvl => `+${(lvl * 2).toFixed(0)}% Shield Power`,
  effect: 'When Flyte shields an ally, Brightney’s steady light grants that ally Skill Haste for a short time. Brightney does not need to be on the team.',
  apply(u, B, lvl) {
    u.flat.shieldPowP = (u.flat.shieldPowP || 0) + lvl * .02;
    u.dirty = true;
    B.on(u, 'shieldDone', ev => {
      const ally = ev && ev.target;
      if (!ally || ally.team !== u.team || !ally.alive) return;
      B.applyStatus(u, ally, 'haste', 3 + lvl * .3);
      B.fxFloatIcon(ally.x, ally.y - 100, '💡', '#ffe59a');
    });
  }
});
