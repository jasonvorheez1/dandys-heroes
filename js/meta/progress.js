/* progress.js - hero upgrades: level, stars, rarity, skills, class, friendship, mastery. */
'use strict';

const Progress = {

  /* Hero level is capped by account Mastery, which is capped by roster size.
     That is the chain that keeps the whole game moving together. */
  levelCap() { return Save.data.mastery; },

  canLevel(id) {
    const h = Save.hero(id);
    return h.level < this.levelCap();
  },

  levelUp(id, times) {
    const h = Save.hero(id);
    let done = 0;
    times = times || 1;
    while (done < times && h.level < this.levelCap()) {
      const cost = { ichor: levelCost(h.level), exp: levelExp(h.level) };
      if (!Save.can(cost)) break;
      Save.spend(cost);
      h.level++; done++;
    }
    if (done) { if (!this._bulkQuiet) Sound.play('sparkle'); this.checkTrinketMilestone(id); Save.addMasteryXp(done * 3, !!this._bulkQuiet); Achievements.record('heroLevel', done); Save.write(); }
    return done;
  },

  /** Spend everything available on this hero's level in one press. */
  levelMax(id) {
    const h = Save.hero(id);
    let n = 0;
    while (h.level < this.levelCap()) {
      const cost = { ichor: levelCost(h.level), exp: levelExp(h.level) };
      if (!Save.can(cost)) break;
      Save.spend(cost); h.level++; n++;
    }
    if (n) { Sound.play('sparkle'); UI.toast('+' + n + ' levels'); this.checkTrinketMilestone(id); Save.addMasteryXp(n * 3); Achievements.record('heroLevel', n); }
    else UI.toast(h.level >= this.levelCap() ? 'Mastery cap reached' : 'Not enough resources');
    Save.write();
    return n;
  },

  /* Every 20 levels, a Hero with a matching trinket earns a copy of it -
     the "level them up to unlock their own materia" half of the trinket loop.
     Heroes with no curated trinket simply get nothing here, silently. */
  checkTrinketMilestone(id) {
    const owners = trinketsForOwner(id);
    if (!owners.length) return;
    const h = Save.hero(id);
    const reached = Math.floor(h.level / 20);
    while ((h.trinketMilestone || 0) < reached) {
      h.trinketMilestone = (h.trinketMilestone || 0) + 1;
      owners.forEach(tid => {
        const res = Save.addTrinketCopy(tid);
        if (!this._bulkQuiet) {
          if (res === 'new') { UI.toast('🔧 ' + TRINKETS[tid].name + ' unlocked!'); Sound.play('get_rare'); }
          else { UI.toast('🔧 +1 ' + TRINKETS[tid].name); Sound.play('get_item'); }
        }
      });
    }
  },

  starCost(id) {
    const h = Save.hero(id);
    // Event shops show shards for featured Heroes before they are recruited.
    // Those offers use unlock progress instead of a promotion quote.
    if (!h || h.stars >= 5) return null;
    // Shard rewards grow with account Mastery. Scale the shard side of a
    // promotion by that same curve so high-Mastery rewards do not make every
    // star-up progressively cheaper in real play. Ichor stays on its own
    // rarity curve and is intentionally not boosted here.
    // Cookie Run's event gives focused shard packs; keep its promotions within
    // reach without changing the costs of the other Collab heroes.
    const m = COOKIE_HERO_IDS.includes(id) ? 1.2 : obtainOf(id).costMult;
    const masteryShardBoost = this.promotionShardMultiplier();
    return {
      shards: Math.max(1, Math.round(STAR_COST[h.stars] * m * masteryShardBoost)),
      ichor: Math.round(STAR_ICHOR[h.stars] * m),
      star: Math.max(1, Math.round(STAR_DUST_COST[h.stars] * m * masteryShardBoost))
    };
  },
  promotionShardMultiplier(mastery) { return masteryRewardMultiplier(mastery); },
  canStar(id) {
    const c = this.starCost(id); if (!c) return false;
    const h = Save.hero(id);
    return h.shards >= c.shards && Save.can({ ichor: c.ichor, star: c.star });
  },
  starUp(id) {
    if (!this.canStar(id)) return false;
    const h = Save.hero(id), c = this.starCost(id);
    h.shards -= c.shards; Save.spend({ ichor: c.ichor, star: c.star });
    h.stars++;
    if (!this._bulkQuiet) { Sound.play('get_rare'); UI.toast('⭐ ' + HEROES[id].name + ' is now ' + h.stars + '-star'); }
    Save.write(); return true;
  },

  rarityCost(id) {
    const h = Save.hero(id);
    const next = rarityNext(h.rarity, h.rarityPlus);
    if (!next) return null;
    const rank = rarityRank(next.tier, next.plus);
    return { core: RARITY_CORE_STEPS[rank], ichor: RARITY_ICHOR_STEPS[rank] };
  },
  canRarity(id) {
    const c = this.rarityCost(id); if (!c) return false;
    return Save.can(c);
  },
  rarityUp(id) {
    if (!this.canRarity(id)) return false;
    const h = Save.hero(id), next = rarityNext(h.rarity, h.rarityPlus), cost = this.rarityCost(id);
    Save.spend(cost);
    h.rarity = next.tier; h.rarityPlus = next.plus;
    const rank = rarityRank(next.tier, next.plus);
    const k = next.plus === 1 ? SKILL_ORDER.find(x => SKILL_RARITY[x] === next.tier) : null;
    if (!this._bulkQuiet) Sound.play('get_rare');
    if (next.tier === 6 && next.plus === 1) {
      h.rainbowUnlocked = true;
      h.classRanks = h.classRanks || {}; h.subclassRanks = h.subclassRanks || {};
      h.cls2 = Object.keys(CLASSES).find(k => k !== h.cls) || null;
      h.subcls2 = Object.keys(SUBCLASSES).find(k => k !== h.subcls) || null;
      if (h.cls2 && !h.classRanks[h.cls2]) h.classRanks[h.cls2] = 1;
      if (h.subcls2 && !h.subclassRanks[h.subcls2]) h.subclassRanks[h.subcls2] = 1;
      if (!this._bulkQuiet) UI.toast('🌈 Rainbow 1: Reforged Class path unlocked');
    } else {
      if (!this._bulkQuiet) UI.toast(rarityLabel(h.rarity, h.rarityPlus) + ': ' + (k && HEROES[id].skills[k] ? HEROES[id].skills[k].name + ' unlocked' : 'stats increased'));
    }
    Save.write(); return true;
  },

  skillCap(id) {
    if (!Save.hero(id)) return 1;
    return clamp(Math.floor(Number(Save.data.mastery) || 1), 1, SKILL_MAX_LEVEL);
  },
  skillUp(id, key, times) {
    const h = Save.hero(id);
    if (h.rarity < SKILL_RARITY[key]) { UI.toast('Raise rarity to ' + RARITY_NAMES[SKILL_RARITY[key]] + ' first'); return 0; }
    let n = 0; times = times || 1;
    while (n < times && h.skills[key] < this.skillCap(id)) {
      const c = skillCost(h.skills[key]);
      if (!Save.can(c)) break;
      Save.spend(c); h.skills[key]++; n++;
    }
    if (n) { if (!this._bulkQuiet) Sound.play('get_item'); Save.write(); }
    else if (h.skills[key] >= this.skillCap(id)) UI.toast('Skill is at the level cap');
    else {
      const cost = skillCost(h.skills[key]);
      const missing = Object.keys(cost).filter(k => Save.res(k) < cost[k]);
      UI.toast('Need ' + missing.map(k => RES[k].icon + ' ' + fmt(cost[k] - Save.res(k)) + ' ' + RES[k].name).join(' · '));
    }
    return n;
  },
  skillMaxAll(id) {
    if (!Screens.modeUnlocked('skillBulk')) {
      Screens.showModeGate('skillBulk');
      return 0;
    }
    let n = 0;
    SKILL_ORDER.forEach(k => { n += this.skillUp(id, k, 999); });
    if (n) UI.toast('+' + n + ' skill levels');
    return n;
  },

  /** One press that pushes a hero as far as current resources allow. */
  autoUpgrade(id) {
    if (!Screens.modeUnlocked('upgradeEverything')) {
      Screens.showModeGate('upgradeEverything');
      return 0;
    }
    let acted = 0;
    acted += this.levelMax(id) ? 1 : 0;
    while (this.canStar(id)) { this.starUp(id); acted++; }
    while (this.canRarity(id)) { this.rarityUp(id); acted++; }
    acted += this.skillMaxAll(id) ? 1 : 0;
    if (!acted) UI.toast('Nothing left to spend here');
    return acted;
  },

  classRank(id, cls) {
    const h = Save.hero(id); cls = cls || h.cls;
    return cls ? Math.max(0, (h.classRanks && h.classRanks[cls]) || 0) : 0;
  },
  subclassRank(id, sc) {
    const h = Save.hero(id); sc = sc || h.subcls;
    return sc ? Math.max(0, (h.subclassRanks && h.subclassRanks[sc]) || 0) : 0;
  },
  setClass(id, cls) {
    const h = Save.hero(id);
    h.classRanks = h.classRanks || {};
    if (cls && !h.classRanks[cls]) h.classRanks[cls] = 1;
    h.cls = cls; Sound.play('ui_ok'); Save.write();
  },
  setSubclass(id, sc) {
    const h = Save.hero(id);
    h.subclassRanks = h.subclassRanks || {};
    if (sc && !h.subclassRanks[sc]) h.subclassRanks[sc] = 1;
    h.subcls = sc; Sound.play('ui_ok'); Save.write();
  },
  setRainbowClass(id, cls) {
    const h = Save.hero(id);
    if (!h.rainbowUnlocked || !cls || !CLASSES[cls] || cls === h.cls) return false;
    h.classRanks = h.classRanks || {};
    if (!h.classRanks[cls]) h.classRanks[cls] = 1;
    h.cls2 = cls; Sound.play('ui_ok'); Save.write(); return true;
  },
  setRainbowSubclass(id, sc) {
    const h = Save.hero(id);
    if (!h.rainbowUnlocked || !sc || !SUBCLASSES[sc] || sc === h.subcls) return false;
    h.subclassRanks = h.subclassRanks || {};
    if (!h.subclassRanks[sc]) h.subclassRanks[sc] = 1;
    h.subcls2 = sc; Sound.play('ui_ok'); Save.write(); return true;
  },
  upgradeClass(id, cls) {
    const h = Save.hero(id); cls = cls || h.cls;
    if (!cls || !CLASSES[cls]) { UI.toast('Choose a Class first'); return false; }
    if (!this.classUnlocked(id)) { UI.toast('Classes unlock at 3★'); Sound.play('ui_err'); return false; }
    if (!this.classRank(id, cls)) this.setClass(id, cls);
    const rank = this.classRank(id, cls);
    if (rank >= CLASS_MAX_RANK) { UI.toast('Class is fully trained'); return false; }
    const cost = classUpgradeCost(rank, false);
    if (!Save.spend(cost)) { UI.toast('Not enough Training Manuals'); Sound.play('ui_err'); return false; }
    h.classRanks[cls] = rank + 1;
    Sound.play('get_item'); UI.toast(`${CLASSES[cls].icon} ${cls} Rank ${rank + 1}`); Save.write(); return true;
  },
  upgradeSubclass(id, sc) {
    const h = Save.hero(id); sc = sc || h.subcls;
    if (!sc || !SUBCLASSES[sc]) { UI.toast('Choose a Subclass first'); return false; }
    if (!this.subclassUnlocked(id)) { UI.toast('Subclasses unlock at 4★'); Sound.play('ui_err'); return false; }
    if (!this.subclassRank(id, sc)) this.setSubclass(id, sc);
    const rank = this.subclassRank(id, sc);
    if (rank >= CLASS_MAX_RANK) { UI.toast('Subclass is fully trained'); return false; }
    const cost = classUpgradeCost(rank, true);
    if (!Save.spend(cost)) { UI.toast('Not enough Training Manuals'); Sound.play('ui_err'); return false; }
    h.subclassRanks[sc] = rank + 1;
    Sound.play('get_item'); UI.toast(`${SUBCLASSES[sc].icon} ${sc} Rank ${rank + 1}`); Save.write(); return true;
  },

  /* QoL bulk training: spend as many Manuals as the selected path can use in
     one action. This deliberately uses the same per-rank costs as the normal
     button, so it cannot bypass the economy or the Rank 50 cap. */
  upgradeClassMax(id, cls) {
    const h = Save.hero(id); cls = cls || h.cls;
    if (!cls || !CLASSES[cls] || !this.classUnlocked(id)) return 0;
    if (!this.classRank(id, cls)) this.setClass(id, cls);
    let rank = this.classRank(id, cls), trained = 0, manuals = Save.res('manual');
    while (rank < CLASS_MAX_RANK) {
      const cost = classUpgradeCost(rank, false);
      if (manuals < cost.manual) break;
      manuals -= cost.manual; rank++; trained++;
    }
    if (trained) {
      Save.data.res.manual = manuals; h.classRanks[cls] = rank;
      Sound.play('get_item'); UI.toast(`${CLASSES[cls].icon} ${cls} → Rank ${rank}`); Save.write();
    } else if (rank >= CLASS_MAX_RANK) UI.toast('Class is fully trained');
    else UI.toast('Not enough Training Manuals');
    return trained;
  },
  upgradeSubclassMax(id, sc) {
    const h = Save.hero(id); sc = sc || h.subcls;
    if (!sc || !SUBCLASSES[sc] || !this.subclassUnlocked(id)) return 0;
    if (!this.subclassRank(id, sc)) this.setSubclass(id, sc);
    let rank = this.subclassRank(id, sc), trained = 0, manuals = Save.res('manual');
    while (rank < CLASS_MAX_RANK) {
      const cost = classUpgradeCost(rank, true);
      if (manuals < cost.manual) break;
      manuals -= cost.manual; rank++; trained++;
    }
    if (trained) {
      Save.data.res.manual = manuals; h.subclassRanks[sc] = rank;
      Sound.play('get_item'); UI.toast(`${SUBCLASSES[sc].icon} ${sc} → Rank ${rank}`); Save.write();
    } else if (rank >= CLASS_MAX_RANK) UI.toast('Subclass is fully trained');
    else UI.toast('Not enough Training Manuals');
    return trained;
  },

  /* ---------- trinkets ---------- */
  /** Each Trinket copy is its own item now - equipping one just needs a free
      (unequipped) copy of that type; owning several of the same Trinket lets
      different Heroes each wear their own at once. */
  equipTrinket(heroId, slot, uid) {
    if (HEROES[heroId] && HEROES[heroId].noTrinket) return false;
    const copy = Save.data.trinketInv[uid];
    if (!copy) return false;
    if (Save.equippedTrinketUids().has(uid)) return false; // already worn somewhere
    const h = Save.hero(heroId);
    h.trinkets[slot] = uid;
    Sound.play('ui_ok'); Save.write();
    return true;
  },
  /** Move an already worn copy into another slot in one save operation. */
  moveTrinket(heroId, slot, uid) {
    if (HEROES[heroId] && HEROES[heroId].noTrinket) return false;
    const target = Save.hero(heroId), copy = Save.data.trinketInv[uid];
    if (!target || !copy || !Array.isArray(target.trinkets) || slot < 0 || slot >= target.trinkets.length) return false;
    const sourceId = Save.whoWears(uid);
    if (!sourceId) return this.equipTrinket(heroId, slot, uid);
    const source = Save.hero(sourceId), sourceSlot = source && source.trinkets.indexOf(uid);
    if (sourceSlot == null || sourceSlot < 0 || (sourceId === heroId && sourceSlot === slot)) return false;
    source.trinkets[sourceSlot] = null;
    target.trinkets[slot] = uid;
    Sound.play('ui_ok'); Save.write();
    return true;
  },
  unequipTrinket(heroId, slot) {
    if (HEROES[heroId] && HEROES[heroId].noTrinket) return false;
    const h = Save.hero(heroId);
    h.trinkets[slot] = null;
    Sound.play('ui_back'); Save.write();
  },

  classUnlocked(id) { return Save.hero(id).stars >= 3; },
  subclassUnlocked(id) { return Save.hero(id).stars >= 4; },
  rainbowClassUnlocked(id) { const h = Save.hero(id); return !!h.rainbowUnlocked && h.rarity >= 6; },

  /* ---------- Friendship Badges ---------- */
  equipBadge(heroId, badgeId) { return Save.equipBadge(heroId, badgeId); },
  unequipBadge(heroId, badgeId) { return Save.unequipBadge(heroId, badgeId); },

  /* ---------- power score, used for team suggestions and arena matching ---------- */
  powerBreakdown(id) {
    const h = Save.hero(id), d = HEROES[id];
    if (!h || !d) return { total: 0, stats: 0, skills: 0, rarity: 0, training: 0, gear: 0, badge: 0, tier: 0, unlocked: 0 };

    // Mirror Unit.computeBase(): level growth, Stars, rarity rank, and the
    // Tank baseline all affect the combat stats that the player actually gets.
    const lv = Math.max(1, Number(h.level) || 1);
    const star = 1 + Math.max(0, (Number(h.stars) || 1) - 1) * .14;
    const rarity = typeof rarityStatMultiplier === 'function'
      ? rarityStatMultiplier(h.rarity, h.rarityPlus)
      : 1;
    const growth = d.growth || {}, base = d.base || {};
    const value = k => (base[k] || 0) * (k === 'spd' ? 1 : statLevelMult(['acc', 'eva'].includes(k) ? .012 : growth[k], lv) * star * rarity) *
      (d.role === 'Tank' ? ({ hp: 1.16, def: 1.14, mdef: 1.14 }[k] || 1) : 1);
    // Durability is valuable, but it does not convert into pressure as
    // directly as Attack, Magic, or skill access. Tanks already receive a
    // real HP/DEF/MDEF baseline in Unit.computeBase(), so counting all of
    // that durability at the generic rate makes defensive Heroes crowd out
    // damage and support Heroes in power sorting and team totals.
    const tank = d.role === 'Tank';
    const hpWeight = tank ? .075 : .105;
    const defenseWeight = tank ? .58 : .78;
    const rawStats = value('hp') * hpWeight + value('atk') * 1.15 + value('mag') * 1.15 +
      value('def') * defenseWeight + value('mdef') * defenseWeight + value('spd') * .18 +
      value('acc') * .08 + value('eva') * .08;
    // A support's lower personal damage buys team-wide buffs, heals, and
    // control. Rate those contributions without pretending their Attack stat
    // is as important as a damage dealer's. Tanks also protect other slots.
    const roleFactor = { Support: 1.40, Tank: 1.16, Control: 1.05, Damage: 1 }[d.role] || 1;
    const stats = rawStats * roleFactor;

    // Skills are worth something because they are unlocked, not merely
    // because a fresh save contains placeholder level-1 fields for them.
    let skills = 0, unlocked = 0;
    SKILL_ORDER.forEach(key => {
      if (!d.skills[key] || h.rarity < SKILL_RARITY[key]) return;
      unlocked++;
      const level = Math.max(1, Number(h.skills[key]) || 1);
      // Skill coefficients multiply a Hero's combat stats. Give trained
      // skills more rating as the Hero grows, while a level-1 skill never
      // gains power just because its owner gained levels.
      skills += 72 + (skillMult(level) - 1) * 330 * (1 + (lv - 1) / 95);
    });

    // Rarity already participates in the real stat multiplier above. This
    // small separate piece represents the kit access and late-rarity payoff.
    const rarityScore = Math.max(0, rarityRank(h.rarity, h.rarityPlus) - 1) * 18;
    const tierScore = ({ SS: 120, S: 90, A: 60, B: 35, C: 15, D: 0 }[d.tier] || 0);

    // Count both equipped physical copies and their ranks. Owned-but-unused
    // Trinkets should not inflate a Hero's combat rating.
    const gear = (h.trinkets || []).reduce((score, worn) => {
      const copy = typeof worn === 'string' ? (Save.data.trinketInv || {})[worn] : worn;
      if (!copy) return score;
      const rank = clamp(Number(copy.rank) || 1, 1, typeof TRINKET_MAX_RANK === 'number' ? TRINKET_MAX_RANK : 3);
      return score + trinketPowerScore(rank);
    }, 0);
    const badge = Save.equippedBadges(id).reduce((score,bid)=>score+Save.badgeLvl(bid)*42,0);
    const primaryClass = this.classRank(id), primarySubclass = this.subclassRank(id);
    const secondClass = h.cls2 ? this.classRank(id, h.cls2) : 0;
    const secondSubclass = h.subcls2 ? this.subclassRank(id, h.subcls2) : 0;
    const training = primaryClass * 52 + primarySubclass * 38 + secondClass * 22 + secondSubclass * 16;
    const total = Math.round(stats + skills + rarityScore + tierScore + gear + badge + training);
    return { total, stats: Math.round(stats), rawStats: Math.round(rawStats), roleFactor,
      skills: Math.round(skills), rarity: Math.round(rarityScore),
      training: Math.round(training), gear, badge, tier: tierScore, unlocked, level: lv };
  },
  power(id) { return this.powerBreakdown(id).total; },
  teamPowerBreakdown(ids) {
    const seen = new Set();
    const values = (ids || []).filter(id => id && !seen.has(id) && seen.add(id)).map(id => ({ id, power: this.power(id) }));
    const total = sum(values.map(item => item.power));
    return {
      total,
      count: values.length,
      average: values.length ? Math.round(total / values.length) : 0,
      strongest: values.slice().sort((a, b) => b.power - a.power)[0] || null
    };
  },
  teamPower(ids) {
    return this.teamPowerBreakdown(ids).total;
  },
  /** A readable five-Hero team target at an enemy level. Skills and rarity
      raise real teams above their level, so the curve is guidance, not a gate. */
  recommendedPower(level, options) {
    options = options || {};
    const stageLevel = Math.max(1, Number(level) || 1);
    const factor = Math.max(.5, Number(options.factor) || 1);
    const core = Math.min(stageLevel, 800);
    const perHero = 800 + 150 * core + .65 * core * core + Math.max(0, stageLevel - 800) * 1190;
    return Math.max(1, Math.round(perHero * 5 * factor));
  },
  /** Convert a whole team's rating back to an approximate encounter level.
      Depths uses this inverse so changing the display scale does not turn
      a stronger-looking team into a thousands-of-levels difficulty jump. */
  powerEquivalentLevel(teamPower) {
    const perHero = Math.max(0, Number(teamPower) || 0) / 5;
    const at800 = 800 + 150 * 800 + .65 * 800 * 800;
    if (perHero >= at800) return 800 + (perHero - at800) / 1190;
    return Math.max(1, (-150 + Math.sqrt(150 * 150 + 2.6 * Math.max(0, perHero - 800))) / 1.3);
  },

  /** Best five owned heroes with a sane role spread. */
  suggestTeam() {
    const owned = Save.ownedIds().sort((a, b) => this.power(b) - this.power(a));
    const out = [];
    const need = { Tank: 1, Support: 1 };
    owned.forEach(id => {
      if (out.length >= 5) return;
      const r = HEROES[id].role;
      if (need[r]) { out.push(id); need[r]--; }
    });
    owned.forEach(id => { if (out.length < 5 && !out.includes(id)) out.push(id); });
    return out;
  }
};
