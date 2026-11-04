/* Event milestones, extra stickers, and per-character level 500 Fan achievements. */
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
  eventAchievements.forEach(row => {
    if (typeof achievement === 'function') achievement(...row);
  });

  // Restore That Pose Again to its original icon and remove bone from Jevil
  if (typeof Achievements !== 'undefined' && Achievements.list) {
    const poseAch = Achievements.list.find(a => a.id === 'that_pose_again');
    if (poseAch) poseAch.iconReward = 'achievement-sprout-pose';

    const jevilAch = Achievements.list.find(a => a.id === 'jevil');
    if (jevilAch && jevilAch.iconReward === 'achievement-deltarune-bone') jevilAch.iconReward = '';
  }

  // Ensure hero win and team sticker achievements exist if not already registered in core bundle
  const extraHeroAchievements = [
    ['strawberry_star', 'Strawberry Star', 'Win 25 battles with Sprout and Cosmo together.', 'sproutCosmoTogether', 25, 'platinum', 'achievement-sprout-star'],
    ['tea_time', 'Tea Time', 'Win 50 battles with Teagan on the team.', 'teaganWin', 50, 'platinum', 'achievement-teagan-cup'],
    ['on_the_case', 'On the Case', 'Win 50 battles with Rodger on the team.', 'rodgerWin', 50, 'platinum', 'achievement-rodger-lens'],
    ['good_dog', 'Good Dog', 'Win 50 battles with Pebble on the team.', 'pebbleWin', 50, 'platinum', 'achievement-deltarune-bone'],
    ['sweet_sakura', 'Sweet Sakura', 'Win 50 battles with Cocoa on the team.', 'cocoaWin', 50, 'platinum', 'achievement-cocoa-pin'],
    ['stay_tuned', 'Stay Tuned', 'Win 50 battles with Vee on the team.', 'veeWin', 50, 'platinum', 'achievement-vee-smile'],
    ['prime_time', 'Prime Time', 'Win 25 battles with Vee and Shelly together.', 'veeShellyTogether', 25, 'platinum', 'achievement-vee-pop'],
    ['host_approved', 'Host Approved', 'Win 25 battles with Vee and Glisten together.', 'veeGlistenTogether', 25, 'platinum', 'achievement-vee-thumbs'],
    ['sweet_treats', 'Sweet Treats', 'Win 25 battles with Cocoa and Sprout together.', 'cocoaSproutTogether', 25, 'platinum', 'achievement-cocoa-treat']
  ];
  extraHeroAchievements.forEach(row => {
    const existing = typeof Achievements !== 'undefined' && Achievements.list?.find(a => a.id === row[0]);
    if (!existing) {
      if (typeof achievement === 'function') achievement(...row);
    } else {
      if (!existing.iconReward) existing.iconReward = row[6];
    }
  });

  // Ensure glossary icons exist (preserving That Pose Again original icon)
  if (typeof JOURNAL_ACHIEVEMENT_ICONS !== 'undefined') {
    Object.assign(JOURNAL_ACHIEVEMENT_ICONS, {
      'achievement-sprout-pose': 'assets/uploads/sproutposeicon.png',
      'achievement-sprout-star': 'assets/stickers/sprout-star.webp',
      'achievement-teagan-cup': 'assets/stickers/teagan-cup.webp',
      'achievement-rodger-lens': 'assets/stickers/rodger-lens.webp',
      'achievement-deltarune-bone': 'assets/stickers/deltarune-bone.webp',
      'achievement-cocoa-pin': 'assets/stickers/cocoa-sakura-pin.png',
      'achievement-vee-smile': 'assets/stickers/vee-screen-smile.webp',
      'achievement-vee-pop': 'assets/stickers/vee-chibi-pop.webp',
      'achievement-vee-thumbs': 'assets/stickers/vee-thumbs-up.png',
      'achievement-cocoa-treat': 'assets/stickers/cocoa-sweet-treat.png'
    });
  }

  // Ensure profile shop icons exist (preserving That Pose Again original icon)
  if (typeof PROFILE_SHOP_ICONS !== 'undefined') {
    const pAsset = typeof ASSET !== 'undefined' ? ASSET : './';
    Object.assign(PROFILE_SHOP_ICONS, {
      'achievement-sprout-pose': { src: pAsset + 'assets/uploads/sproutposeicon.png', label: 'That Pose Again' },
      'achievement-sprout-star': { src: pAsset + 'assets/stickers/sprout-star.webp', label: 'Strawberry Star' },
      'achievement-teagan-cup': { src: pAsset + 'assets/stickers/teagan-cup.webp', label: 'Teagan Cup' },
      'achievement-rodger-lens': { src: pAsset + 'assets/stickers/rodger-lens.webp', label: 'Detective Lens' },
      'achievement-deltarune-bone': { src: pAsset + 'assets/stickers/deltarune-bone.webp', label: 'Pixel Bone' },
      'achievement-cocoa-pin': { src: pAsset + 'assets/stickers/cocoa-sakura-pin.png', label: 'Cocoa Blossom Pin' },
      'achievement-vee-smile': { src: pAsset + 'assets/stickers/vee-screen-smile.webp', label: 'Broadcast Smile' },
      'achievement-vee-pop': { src: pAsset + 'assets/stickers/vee-chibi-pop.webp', label: 'Chibi Vee' },
      'achievement-vee-thumbs': { src: pAsset + 'assets/stickers/vee-thumbs-up.png', label: 'Host Approved' },
      'achievement-cocoa-treat': { src: pAsset + 'assets/stickers/cocoa-sweet-treat.png', label: 'Cocoa Sweet Treat' }
    });
  }

  // Register stickers in STICKER_SHEET if present
  if (typeof STICKER_SHEET !== 'undefined' && STICKER_SHEET.manifest) {
    Object.assign(STICKER_SHEET.manifest, {
      sprout_star: 'assets/stickers/sprout-star.webp',
      teagan_cup: 'assets/stickers/teagan-cup.webp',
      rodger_lens: 'assets/stickers/rodger-lens.webp',
      deltarune_bone: 'assets/stickers/deltarune-bone.webp',
      cocoa_pin: 'assets/stickers/cocoa-sakura-pin.png',
      vee_smile: 'assets/stickers/vee-screen-smile.webp',
      vee_pop: 'assets/stickers/vee-chibi-pop.webp',
      vee_thumbs: 'assets/stickers/vee-thumbs-up.png',
      cocoa_treat: 'assets/stickers/cocoa-sweet-treat.png'
    });
    if (STICKER_SHEET.defaultCount) {
      Object.assign(STICKER_SHEET.defaultCount, {
        sprout_star: 0,
        teagan_cup: 0,
        rodger_lens: 0,
        deltarune_bone: 0,
        cocoa_pin: 0,
        vee_smile: 0,
        vee_pop: 0,
        vee_thumbs: 0,
        cocoa_treat: 0
      });
    }
  }

  // Extend recordBattleTeam to track hero milestones if not already covered
  if (typeof Achievements !== 'undefined' && Achievements.recordBattleTeam) {
    const oldRecordBattleTeam = Achievements.recordBattleTeam;
    Achievements.recordBattleTeam = function(teamIds) {
      const res = oldRecordBattleTeam.apply(this, arguments);
      const team = new Set((teamIds || []).filter(Boolean));
      if (!oldRecordBattleTeam.toString().includes('veeWin')) {
        if (team.has('Sprout')) this.record('sproutWin', 1);
        if (team.has('Sprout') && team.has('Cosmo')) this.record('sproutCosmoTogether', 1);
        if (team.has('Teagan')) this.record('teaganWin', 1);
        if (team.has('Rodger')) this.record('rodgerWin', 1);
        if (team.has('Pebble')) this.record('pebbleWin', 1);
        if (team.has('Cocoa')) this.record('cocoaWin', 1);
        if (team.has('Vee')) this.record('veeWin', 1);
        if (team.has('Vee') && team.has('Shelly')) this.record('veeShellyTogether', 1);
        if (team.has('Vee') && team.has('Glisten')) this.record('veeGlistenTogether', 1);
        if (team.has('Cocoa') && team.has('Sprout')) this.record('cocoaSproutTogether', 1);
      }
      return res;
    };
  }

  // Obtain categories are the game's source of truth. Collabs, events, and
  // special one-off recruits do not receive a Fan achievement.
  const fanIds = PLAYABLE_IDS.filter(id => !UNOBTAINABLE_HERO_IDS.has(id)
    && !EXCLUDED_FAN_IDS.has(id)
    && !(typeof BIG_WIG_HERO_IDS !== 'undefined' && BIG_WIG_HERO_IDS.has(id)));
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

    // Hero level and campaign fallback stats
    if (kind === 'sproutWin') return Math.max(recorded, (Save.data?.heroes?.Sprout?.level || 0) >= 50 ? 50 : 0);
    if (kind === 'sproutCosmoTogether') {
      const leveled = (Save.data?.heroes?.Sprout?.level || 0) >= 50 && (Save.data?.heroes?.Cosmo?.level || 0) >= 50;
      return Math.max(recorded, leveled ? 25 : 0);
    }
    if (kind === 'teaganWin') return Math.max(recorded, (Save.data?.heroes?.Teagan?.level || 0) >= 50 ? 50 : 0);
    if (kind === 'rodgerWin') return Math.max(recorded, (Save.data?.heroes?.Rodger?.level || 0) >= 50 ? 50 : 0);
    if (kind === 'pebbleWin') return Math.max(recorded, (Save.data?.heroes?.Pebble?.level || 0) >= 50 ? 50 : 0);
    if (kind === 'cocoaWin') return Math.max(recorded, (Save.data?.heroes?.Cocoa?.level || 0) >= 50 ? 50 : 0);
    if (kind === 'veeWin') return Math.max(recorded, (Save.data?.heroes?.Vee?.level || 0) >= 50 ? 50 : 0);
    if (kind === 'veeShellyTogether') {
      const leveled = (Save.data?.heroes?.Vee?.level || 0) >= 50 && (Save.data?.heroes?.Shelly?.level || 0) >= 50;
      const campaign = typeof Save.campaignDone === 'function' && Save.campaignDone('shelly_vee');
      return Math.max(recorded, (leveled || campaign) ? 25 : 0);
    }
    if (kind === 'veeGlistenTogether') {
      const leveled = (Save.data?.heroes?.Vee?.level || 0) >= 50 && (Save.data?.heroes?.Glisten?.level || 0) >= 50;
      const campaign = typeof Save.campaignDone === 'function' && Save.campaignDone('glisten_vee');
      return Math.max(recorded, (leveled || campaign) ? 25 : 0);
    }
    if (kind === 'cocoaSproutTogether') {
      const leveled = (Save.data?.heroes?.Cocoa?.level || 0) >= 50 && (Save.data?.heroes?.Sprout?.level || 0) >= 50;
      return Math.max(recorded, leveled ? 25 : 0);
    }

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
  eventAchievements.forEach(row => { restored += (Achievements.evaluate(row[0], {quiet:true}) || 0); });
  fanIds.forEach(id => { restored += (Achievements.evaluate('fan_' + id.toLowerCase(), {quiet:true}) || 0); });

  const stickerAchievements = [
    { achId: 'strawberry_star', icon: 'achievement-sprout-star' },
    { achId: 'tea_time', icon: 'achievement-teagan-cup' },
    { achId: 'on_the_case', icon: 'achievement-rodger-lens' },
    { achId: 'good_dog', icon: 'achievement-deltarune-bone' },
    { achId: 'sweet_sakura', icon: 'achievement-cocoa-pin' },
    { achId: 'stay_tuned', icon: 'achievement-vee-smile' },
    { achId: 'prime_time', icon: 'achievement-vee-pop' },
    { achId: 'host_approved', icon: 'achievement-vee-thumbs' },
    { achId: 'sweet_treats', icon: 'achievement-cocoa-treat' }
  ];
  stickerAchievements.forEach(({ achId, icon }) => {
    restored += (Achievements.evaluate(achId, {quiet: true}) || 0);
    if (Achievements.isUnlocked(achId)) {
      if (Save.data?.profile) {
        Save.data.profile.iconUnlocks = Array.isArray(Save.data.profile.iconUnlocks) ? Save.data.profile.iconUnlocks : [];
        if (!Save.data.profile.iconUnlocks.includes(icon)) {
          Save.data.profile.iconUnlocks.push(icon);
          restored++;
        }
      }
    }
  });

  if (restored && typeof Save !== 'undefined' && Save.write) Save.write();
})();
