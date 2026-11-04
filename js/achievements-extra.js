/* Event milestones and per-character level 500 Fan achievements. */
'use strict';

(() => {
  const eventAchievements = [
    ['kaizo_glados', 'Kaizo Test Subject', 'Defeat GLaDOS on Kaizo difficulty.', 'kaizoGlados', 1, 'iridescent'],
    ['spamton_neo', 'BIG SHOT', 'Defeat Spamton NEO in Flower Kingdom.', 'spamtonNeoDefeat', 1, 'platinum'],
    ['jevil', 'Anything Goes', 'Defeat Jevil in Flower Kingdom.', 'jevilDefeat', 1, 'platinum'],
    ['gourdy_parents_20', 'Family Portraits', 'Finish drawing Gourdy’s parents 20 times.', 'gourdyPortraits', 20, 'gold'],
    ['gourdy_parents_40', 'A Wall of Portraits', 'Finish drawing Gourdy’s parents 40 times.', 'gourdyPortraits', 40, 'platinum'],
    ['gourdy_parents_100', 'Never Forgotten', 'Finish drawing Gourdy’s parents 100 times.', 'gourdyPortraits', 100, 'iridescent']
  ];
  eventAchievements.forEach(row => achievement(...row));

  // Obtain categories are the game's source of truth. Collabs, events, and
  // special one-off recruits do not receive a Fan achievement.
  const regular = new Set(['Common','Uncommon','Rare','Main','Lethal']);
  const fanIds = PLAYABLE_IDS.filter(id => HEROES[id] && regular.has(HERO_OBTAIN[id]) && !HEROES[id].eventOnly
    && !COLLAB_HERO_IDS.has(id) && !(typeof BIG_WIG_HERO_IDS !== 'undefined' && BIG_WIG_HERO_IDS.has(id)));
  const fans = new Map();
  fanIds.forEach(id => {
    const achievementId = 'fan_' + id.toLowerCase();
    const kind = 'fanLevel:' + id;
    fans.set(kind, id);
    achievement(achievementId, HEROES[id].name + ' Fan', 'Raise ' + HEROES[id].name + ' to level 500.', kind, 500, 'platinum');
  });

  const oldValue = Achievements.value;
  Achievements.value = function(kind) {
    const raid = Save.data?.raid || {};
    const recorded = Math.max(0, Number(this.state().stats[kind]) || 0);
    if (kind === 'kaizoGlados') return Math.max(recorded, raid.aperture?.beaten?.kaizo ? 1 : 0);
    if (kind === 'jevilDefeat' || kind === 'spamtonNeoDefeat') return Math.max(recorded, raid.flowery?.endgame ? 1 : 0);
    if (kind === 'gourdyPortraits') return Math.max(0, Number(Save.data?.drawParents?.completedDrawings) || 0);
    if (fans.has(kind)) return Math.max(0, Number(Save.data?.heroes?.[fans.get(kind)]?.level) || 0);
    return oldValue.call(this, kind);
  };

  // The drawing event already owns its persistent counter; award milestones
  // only when a full portrait is completed, including after a paper reset.
  const draw = DrawParents.performDraw;
  DrawParents.performDraw = function() {
    const result = draw.apply(this, arguments);
    if (result?.ok && result.completedNow) {
      eventAchievements.filter(row => row[3] === 'gourdyPortraits').forEach(row => Achievements.evaluate(row[0]));
      Save.write();
    }
    return result;
  };

  function checkFan(id) {
    const kind = 'fanLevel:' + id;
    if (fans.has(kind) && (Save.data?.heroes?.[id]?.level || 0) >= 500) {
      Achievements.evaluate('fan_' + id.toLowerCase());
      Save.write();
    }
  }
  for (const method of ['levelUp','levelMax']) {
    const original = Progress[method];
    Progress[method] = function(id) {
      const result = original.apply(this, arguments);
      if (result) checkFan(id);
      return result;
    };
  }

  // Older saves may have met these goals before the achievements existed.
  let restored = 0;
  eventAchievements.forEach(row => { restored += Achievements.evaluate(row[0], {quiet:true}); });
  fanIds.forEach(id => { restored += Achievements.evaluate('fan_' + id.toLowerCase(), {quiet:true}); });
  if (restored) Save.write();
})();
