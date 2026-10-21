/* save.js - persistent state, local save slots, and backup-safe file handling. */
'use strict';

const SAVE_KEY = 'dandys-heroes-v1';
const SAVE_INDEX_KEY = 'dandys-heroes-slots-v1';
const SAVE_SLOT_PREFIX = 'dandys-heroes-slot-';
const SAVE_BACKUP_SUFFIX = '-backup';
const SAVE_SLOT_LIMIT = 6;
const SAVE_MAIN_SLOT_ID = 'slot-1';
const SAVE_TEST_SLOT_ID = 'full-test';

const Save = {
  data: null,
  activeSlot: 'slot-1',
  activityReady: false,
  activityAt: 0,
  recoveryNotice: '',

  fresh() {
    const week = currentWeek();
    const d = {
      v: 1, created: Date.now(), _updatedAt: 0, _saveKind: 'main',
      // New players begin with an empty economy. Dandy's Buds teaches the
      // first rewards instead of front-loading a starter resource bundle.
      res: { ichor: 0, arenaCoin: 0, tape: 0, notes: 0, star: 0, ticket: 0, raidTicket: 0, counterToken: 0, elevatorTicket: 0, exp: 0, gold: 0, diamond: 0, main: 0, thread: 0, core: 0, manual: 0, scrap: 0, gear: 0 },
      heroes: {},
      pending: {},              // shards banked toward Heroes not yet unlocked
      trinketInv: {},            // { uid: {id, rank} } - every Trinket copy you own
      trinketSeq: 1,              // next trinket instance uid
      badges: {},                // { badgeId: { lvl } } - owned Friendship Badges
      campaigns: {},              // { campaignId: stagesCleared }
      team: [],
      battleShardTurn: 0,         // rotates the mastery-scaled battle shard to the active team
      depth: null,              // active Ichor Depths run
      bestFloor: 0,
      arena: { rank: 2000, wins: 0, losses: 0, day: -1, resetCycle: -1, opponents: [] },
      trials: {},
      raid: { tokens: 0, phantasiaCoins: 0, unknownWorldGears: 0, qomPasses: 0, stages: {}, clears: {} },
      // Delivery streak and Daily Orders intentionally share one home, but
      // have independent reset/claim state.
      daily: { lastDay: -1, streak: 0, claimed: [], orderDay: -1, orderMastery: 0, wins: 0, orderClaimed: [], freeClaims: { hour: -1, day: -1, week: -1 } },
      pass: { week: -1, xp: 0, claimed: [] },
      scratch: { week: -1, card: 0, revealed: [], jackpot: false, won: {} },
      shop: { bought: {}, refreshes: {}, level: 0, packs: { claimed: {} } },
      crates: { goldPulls: 0, diamondPulls: 0, mainPulls: 0, level: 1 },
      profile: {
        name: '',
        tagline: '',
        icon: { kind: 'hero', id: STARTERS[0] },
        iconUnlocks: [],
        favorites: { heroes: STARTERS.slice(0, 2) },
        featuredAchievements: []
      },
      achievements: { unlocked: {}, stats: {} },
      // Dandy's Buds is a first-floor onboarding run. Kept separate from
      // Depths progress so claiming its recruit crate is always one-time.
      buds: { state: 'available', stage: 1, chosen: null, startedAt: 0, completedAt: 0, previousRun: null, previousTeam: null, pausedRun: null, refusals: 0, demandShown: false, dandyConsequence: false, levelTutorialShown: false, levelTutorialPending: false, dialogueSeen: {} },
      mastery: 1, masteryXp: 0, masteryTuningV2: true,
      opt: { speed: 1, paceV2: true, sound: true, musicVolume: MUSIC_DEFAULT_VOLUME, sfxVolume: HANDHELD_AUDIO ? .88 : .68, reducedEffects: false, graphicsQuality: 50, graphicsParticles: 'auto', graphicsBackground: true, combatNumbers: true, screenShake: true, cameraZoom: true },
      seen: {}
    };
    // The starting pair are genuine level-1 recruits. Dandy's Buds supplies
    // the first lessons, upgrades, and rewards instead of skipping ahead.
    STARTERS.forEach(id => {
      d.heroes[id] = this.newHero(id);
    });
    // Cookie Run badges are gifts available from the start, even before the
    // corresponding Cookie is recruited.
    Object.keys(BADGES).forEach(bid => {
      if (BADGES[bid].cookieRun) d.badges[bid] = { lvl: 1 };
    });
    d.team = STARTERS.slice(0, 5);
    return d;
  },

  newHero(id) {
    return {
      id, level: 1, stars: 1, rarity: 1, rarityPlus: 1, rainbowUnlocked: false, shards: 0, exp: 0,
      skills: { W: 1, G: 1, B: 1, P: 1, R: 1 },
      // Dormant skin fields are retained so existing collections survive while the feature is disabled.
      cls: null, subcls: null, cls2: null, subcls2: null, classRanks: {}, subclassRanks: {}, costume: null, costumes: [],
      mastery: 0, battles: 0,
      trinkets: HEROES[id] && HEROES[id].noTrinket ? [] : [null, null], trinketMilestone: 0,
      badge: COOKIE_HERO_IDS.includes(id) ? BADGE_IDS_FOR(id).find(bid => BADGES[bid].cookieRun) || null : null,
      cookieSingleBadgeV1: COOKIE_HERO_IDS.includes(id) ? true : undefined
    };
  },

  /** Poppy and Boxten lead every in-progress Dandy's Buds lesson. Keep this
      centralized so every screen that can edit the shared team agrees on
      which Toons are locked. */
  budsRequiredIds() {
    return this.data && this.data.buds && this.data.buds.state === 'active'
      ? STARTERS.filter(id => this.owns(id))
      : [];
  },

  enforceBudsTeam() {
    const required = this.budsRequiredIds();
    if (!required.length) return false;
    const team = (this.data.team || []).filter((id, i, all) => id && this.owns(id) && all.indexOf(id) === i);
    const next = required.concat(team.filter(id => !required.includes(id))).slice(0, 5);
    const changed = next.length !== team.length || next.some((id, i) => id !== team[i]);
    if (changed) this.data.team = next;
    return changed;
  },

  /* ---------- local slots ---------- */
  validSave(value) {
    return !!value && typeof value === 'object' && !Array.isArray(value)
      && value.heroes && typeof value.heroes === 'object'
      && value.res && typeof value.res === 'object';
  },

  slotKey(id) { return SAVE_SLOT_PREFIX + String(id) ; },
  backupKey(id) { return this.slotKey(id) + SAVE_BACKUP_SUFFIX; },
  cleanSlotName(name, fallback = 'New Save') {
    const clean = String(name || '').replace(/[<>]/g, '').replace(/\s+/g, ' ').trim().slice(0, 24);
    return clean || fallback;
  },
  defaultSlotName(index) { return index === 0 ? 'Main Save' : 'Save ' + (index + 1); },
  readSlotIndex() {
    try {
      const parsed = JSON.parse(localStorage.getItem(SAVE_INDEX_KEY) || 'null');
      if (!parsed || !Array.isArray(parsed.slots)) return { active: '', slots: [] };
      const slots = parsed.slots.filter(s => s && /^[a-z0-9-]+$/i.test(String(s.id)))
        .slice(0, SAVE_SLOT_LIMIT).map((s, i) => ({
          id: String(s.id), name: this.cleanSlotName(s.name, this.defaultSlotName(i)),
          createdAt: Number(s.createdAt) || Date.now(), updatedAt: Number(s.updatedAt) || 0,
          mastery: Math.max(0, Number(s.mastery) || 0), heroes: Math.max(0, Number(s.heroes) || 0),
          bestFloor: Math.max(0, Number(s.bestFloor) || 0)
        }));
      return { active: String(parsed.active || ''), slots };
    } catch (_) { return { active: '', slots: [] }; }
  },
  writeSlotIndex(index) {
    try { localStorage.setItem(SAVE_INDEX_KEY, JSON.stringify(index)); return true; }
    catch (e) { console.warn('save slot index failed', e); return false; }
  },
  ensureSlotIndex() {
    let index = this.readSlotIndex();
    if (!index.slots.length) {
      // Migrate the original single blob without deleting it until the new
      // slot has been written successfully.
      const legacy = localStorage.getItem(SAVE_KEY);
      const id = 'slot-1';
      if (legacy) {
        try { localStorage.setItem(this.slotKey(id), legacy); } catch (_) { /* load() will recover below */ }
      }
      index = { active: id, slots: [{ id, name: 'Main Save', createdAt: Date.now(), updatedAt: 0, mastery: 0, heroes: 0, bestFloor: 0 }] };
      this.writeSlotIndex(index);
    }
    if (!index.slots.some(s => s.id === index.active)) index.active = index.slots[0].id;
    return index;
  },
  slotInfo(id = this.activeSlot) {
    const index = this.ensureSlotIndex();
    return index.slots.find(s => s.id === id) || null;
  },
  isMainSlot(id = this.activeSlot) { return id === SAVE_MAIN_SLOT_ID; },
  isTestSlot(id = this.activeSlot) { return id === SAVE_TEST_SLOT_ID; },
  isTestData(data = this.data) {
    if (!data || data._saveKind === 'full-test') return true;
    // Older builds did not stamp the fixture. Recognize its deliberately
    // extreme signature so an old leaked cloud row cannot overwrite Main Save
    // during the first startup after this fix.
    const r = data.res || {}, h = data.heroes || {}, roster = typeof PLAYABLE_IDS !== 'undefined' ? PLAYABLE_IDS : [];
    return roster.length > 0 && roster.every(id => h[id])
      && Number(data.bestFloor) >= 120 && Number(r.ichor) >= 999999
      && Number(r.arenaCoin) >= 9999 && Number(r.main) >= 999
      && data.shop && Number(data.shop.level) >= 100;
  },
  listSlots() { return this.ensureSlotIndex().slots.map(s => Object.assign({}, s, { active: s.id === this.activeSlot })); },
  updateSlotInfo(index, data) {
    let meta = index.slots.find(s => s.id === this.activeSlot);
    if (!meta) {
      meta = { id: this.activeSlot, name: this.defaultSlotName(index.slots.length), createdAt: Date.now() };
      index.slots.push(meta);
    }
    meta.updatedAt = Number(data._updatedAt) || Date.now();
    meta.mastery = Math.max(0, Number(data.mastery) || 0);
    meta.heroes = Object.keys(data.heroes || {}).length;
    meta.bestFloor = Math.max(0, Number(data.bestFloor) || 0);
    index.active = this.activeSlot;
    return index;
  },

  load() {
    try {
      const index = this.ensureSlotIndex();
      this.activeSlot = index.active;
      let raw = localStorage.getItem(this.slotKey(this.activeSlot));
      if (!raw && this.activeSlot === 'slot-1') raw = localStorage.getItem(SAVE_KEY);
      let parsed = null;
      try { parsed = raw ? JSON.parse(raw) : null; } catch (_) { parsed = null; }
      if (!this.validSave(parsed)) {
        const backup = localStorage.getItem(this.backupKey(this.activeSlot));
        try { parsed = backup ? JSON.parse(backup) : null; } catch (_) { parsed = null; }
        if (this.validSave(parsed)) this.recoveryNotice = 'Recovered the last safe copy of your save.';
      }
      if (this.validSave(parsed)) { this.data = parsed; this.migrate(); this.write({ skipCloud: true, touch: false }); }
      else { this.data = this.fresh(); this.recoveryNotice = 'Started a fresh save because the active save was unreadable.'; this.write({ skipCloud: true, touch: false }); }
    } catch (e) { console.warn('save load failed, starting fresh', e); this.data = this.fresh(); this.write({ skipCloud: true, touch: false }); }
    Sound.on = this.data.opt.sound !== false;
    if (typeof Sound.setVolume === 'function') Sound.setVolume(this.data.opt.sfxVolume, { skipSave: true });
    Music.volume = clamp(Number(this.data.opt.musicVolume), 0, 1);
    if (typeof Accessibility !== 'undefined') Accessibility.sync();
    if (typeof GraphicsSettings !== 'undefined') GraphicsSettings.sync();
    this.activityReady = true;
    this.activityAt = 0;
    return this.data;
  },

  migrate() {
    const f = this.fresh();
    const oldPerformanceMode = !!(this.data.opt && this.data.opt.performanceMode === true);
    const hadGraphicsQuality = !!(this.data.opt && Object.prototype.hasOwnProperty.call(this.data.opt, 'graphicsQuality'));
    for (const k in f) if (this.data[k] === undefined) this.data[k] = f[k];
    const needsNotesGrant = !!this.data.res && this.data.res.notes === undefined;

    // Older saves may contain a valid top-level shell with one partially
    // written nested object. Normalize those containers before any system
    // reads them, so a failed write cannot strand progression behind a blank
    // screen or a missing state object.
    const stateKeys = ['res', 'arena', 'raid', 'daily', 'pass', 'scratch', 'shop', 'opt'];
    stateKeys.forEach(key => {
      if (!this.data[key] || typeof this.data[key] !== 'object' || Array.isArray(this.data[key])) this.data[key] = Object.assign({}, f[key]);
      else Object.keys(f[key] || {}).forEach(k => { if (this.data[key][k] === undefined) this.data[key][k] = f[key][k]; });
    });
    if (!hadGraphicsQuality && oldPerformanceMode) this.data.opt.graphicsQuality = 25;
    const savedGraphicsQuality = Number(this.data.opt.graphicsQuality);
    this.data.opt.graphicsQuality = clamp(
      Math.round(Number.isFinite(savedGraphicsQuality) ? savedGraphicsQuality : 50), 0, 100
    );
    const savedSfxVolume = Number(this.data.opt.sfxVolume);
    this.data.opt.sfxVolume = clamp(Number.isFinite(savedSfxVolume) ? savedSfxVolume : Number(f.opt.sfxVolume), 0, 1);
    if (!['auto', 'reduced', 'off'].includes(this.data.opt.graphicsParticles)) this.data.opt.graphicsParticles = f.opt.graphicsParticles;
    ['graphicsBackground', 'combatNumbers', 'screenShake', 'cameraZoom'].forEach(key => {
      if (typeof this.data.opt[key] !== 'boolean') this.data.opt[key] = f.opt[key];
    });
    delete this.data.opt.quality;
    delete this.data.opt.performanceMode;
    ['heroes', 'pending', 'trinketInv', 'badges', 'campaigns', 'trials', 'seen'].forEach(key => {
      if (!this.data[key] || typeof this.data[key] !== 'object' || Array.isArray(this.data[key])) this.data[key] = {};
    });
    // Grant all twelve Cookie keepsakes to existing saves immediately too.
    Object.keys(BADGES).forEach(bid => {
      if (BADGES[bid].cookieRun && !this.data.badges[bid]) this.data.badges[bid] = { lvl: 1 };
    });
    if (!this.data.achievements || typeof this.data.achievements !== 'object' || Array.isArray(this.data.achievements)) this.data.achievements = Object.assign({}, f.achievements);
    if (!Array.isArray(this.data.team)) this.data.team = [];
    if (!this.data.depth || typeof this.data.depth !== 'object' || Array.isArray(this.data.depth)) this.data.depth = null;
    if (!this.data.crates || typeof this.data.crates !== 'object' || Array.isArray(this.data.crates)) this.data.crates = Object.assign({}, f.crates);
    this.data.mastery = clamp(Math.floor(Number(this.data.mastery) || 1), 1, 800);
    this.data.masteryXp = Math.max(0, Math.floor(Number(this.data.masteryXp) || 0));
    this.data.arena.rank = clamp(Math.floor(Number(this.data.arena.rank) || 2000), 1, 99999);
    this.data.arena.wins = Math.max(0, Math.floor(Number(this.data.arena.wins) || 0));
    this.data.arena.losses = Math.max(0, Math.floor(Number(this.data.arena.losses) || 0));
    this.data.arena.resetCycle = Number.isFinite(Number(this.data.arena.resetCycle))
      ? Math.floor(Number(this.data.arena.resetCycle)) : -1;
    if (!Array.isArray(this.data.arena.opponents)) this.data.arena.opponents = [];
    Object.keys(f.res).forEach(k => { this.data.res[k] = Math.max(0, Number(this.data.res[k]) || 0); });
    ['goldPulls', 'diamondPulls', 'mainPulls', 'level'].forEach(k => { this.data.crates[k] = Math.max(0, Math.floor(Number(this.data.crates[k]) || 0)); });
    this.data.crates.level = Math.max(1, Math.min(20, this.data.crates.level));

    const needsMasteryCatchup = this.data.masteryTuningV2 !== true;
    if (needsMasteryCatchup) {
      // Older saves earned XP against a much steeper curve. Top them up to
      // the new early-game target so the balance change is felt immediately.
      const target = 34, level = Math.max(0, Math.floor(Number(this.data.mastery) || 0));
      const currentXp = Math.max(0, Number(this.data.masteryXp) || 0);
      let targetXp = 0;
      for (let lv = level; lv < target; lv++) targetXp += 80 + lv * 18;
      if (level < target) {
        for (let lv = level + 1; lv <= target; lv++) {
          const reward = this.masteryReward(lv);
          Object.keys(reward).forEach(k => { this.data.res[k] = (this.data.res[k] || 0) + reward[k]; });
        }
        this.data.mastery = target;
        this.data.masteryXp = Math.max(0, currentXp - targetXp);
      }
      this.data.masteryTuningV2 = true;
    }
    for (const k in f.res) if (this.data.res[k] === undefined) this.data.res[k] = 0;
    if (!this.data.crates || typeof this.data.crates !== 'object') this.data.crates = Object.assign({}, f.crates);
    for (const k in f.crates) if (this.data.crates[k] === undefined) this.data.crates[k] = f.crates[k];
    // Cocoa & Kairi originally registered the friendship reward as Cocoa's
    // badge. Preserve any progress, but move ownership to Kairi's corrected
    // badge so old saves do not lose the reward or leave an invalid badge
    // equipped on Cocoa.
    if (this.data.badges.cocoa_kairi) {
      const old = this.data.badges.cocoa_kairi, current = this.data.badges.kairi_cocoa;
      if (!current || (Number(old.lvl) || 0) > (Number(current.lvl) || 0)) this.data.badges.kairi_cocoa = old;
      delete this.data.badges.cocoa_kairi;
    }
    // The Astro friendship was initially keyed to Dandy by mistake. Keep
    // completed chapters, badge levels, and equipped badges under Astro's
    // intended Pebble pairing.
    if (this.data.badges.astro_dandy) {
      const old = this.data.badges.astro_dandy, current = this.data.badges.astro_pebble;
      if (!current || (Number(old.lvl) || 0) > (Number(current.lvl) || 0)) this.data.badges.astro_pebble = old;
      delete this.data.badges.astro_dandy;
    }
    if (this.data.campaigns.astro_dandy != null && this.data.campaigns.astro_pebble == null) this.data.campaigns.astro_pebble = this.data.campaigns.astro_dandy;
    delete this.data.campaigns.astro_dandy;
    const oldAstroBadge = Object.values(this.data.heroes || {}).find(h => h && h.badge === 'astro_dandy');
    if (oldAstroBadge) oldAstroBadge.badge = null;
    if (this.data.heroes.Astro && !this.data.heroes.Astro.badge && this.data.badges.astro_pebble) this.data.heroes.Astro.badge = 'astro_pebble';
    const oldKairiBadge = Object.values(this.data.heroes || {}).find(h => h && h.badge === 'cocoa_kairi');
    if (oldKairiBadge) oldKairiBadge.badge = null;
    if (this.data.heroes.Kairi && !this.data.heroes.Kairi.badge && this.data.badges.kairi_cocoa) this.data.heroes.Kairi.badge = 'kairi_cocoa';
    const oldRodgerTeaganBadge = this.data.heroes.Rodger;
    if (oldRodgerTeaganBadge && oldRodgerTeaganBadge.badge === 'rodger_teagan') {
      oldRodgerTeaganBadge.badge = null;
      if (this.data.heroes.Teagan && !this.data.heroes.Teagan.badge && this.data.badges.rodger_teagan)
        this.data.heroes.Teagan.badge = 'rodger_teagan';
    }
    Object.keys(this.data.heroes || {}).forEach(id => {
      if (HEROES[id] && HEROES[id].noTrinket) {
        this.data.heroes[id].trinkets = [];
        this.data.heroes[id].trinketMilestone = 0;
      }
    });
    // These late collaboration variants used to be incorrectly marked as
    // costume-only. Give existing saves the normal two empty slots now that
    // they are valid Trinket users.
    ['CheerbearShelly', 'BedtimeAstro', 'WishBearGigi'].forEach(id => {
      const h = this.data.heroes[id];
      if (!HEROES[id] || !h) return;
      const slots = Array.isArray(h.trinkets) ? h.trinkets : [];
      h.trinkets = [slots[0] || null, slots[1] || null];
    });
    // Move old two-slot Cookie loadouts to one badge slot, preserving a valid
    // choice and assigning the first badge if an old save has neither active.
    COOKIE_HERO_IDS.forEach(id => {
      const h = this.data.heroes[id]; if (!h) return;
      const ids = BADGE_IDS_FOR(id).filter(bid => BADGES[bid].cookieRun).slice(0, 2);
      if (!h.cookieSingleBadgeV1) {
        const oldChoice = Array.isArray(h.badges) ? h.badges.filter(bid => ids.includes(bid)).slice(-1)[0] : null;
        h.badge = ids.includes(h.badge) ? h.badge : oldChoice || ids[0] || null;
        h.cookieSingleBadgeV1 = true;
      }
      if (!ids.includes(h.badge)) h.badge = ids[0] || null;
      delete h.badges;
      delete h.cookieBadgesGranted;
    });
    if (!this.data.profile || typeof this.data.profile !== 'object') this.data.profile = f.profile;
    this.data.profile.tagline = String(this.data.profile.tagline || '').replace(/[<>]/g, '').trim().slice(0, 90);
    if (!Array.isArray(this.data.profile.featuredAchievements)) this.data.profile.featuredAchievements = [];
    this.data.profile.featuredAchievements = this.data.profile.featuredAchievements
      .filter(id => typeof id === 'string' && (!this.data.achievements || !this.data.achievements.unlocked || this.data.achievements.unlocked[id]))
      .slice(0, 3);
    if (!this.data.profile.icon || typeof this.data.profile.icon !== 'object') this.data.profile.icon = f.profile.icon;
    if (!Array.isArray(this.data.profile.iconUnlocks)) this.data.profile.iconUnlocks = [];
    const profileShopIcons = ['dandy', 'buds', 'journal', 'ichor', 'achievement-sprout-pose', 'achievement-baldifer', 'achievement-yatta-blot'];
    this.data.profile.iconUnlocks = this.data.profile.iconUnlocks
      .filter(id => typeof id === 'string' && profileShopIcons.includes(id)).slice(0, 24);
    if (!this.data.profile.favorites || typeof this.data.profile.favorites !== 'object') this.data.profile.favorites = { heroes: [] };
    if (!Array.isArray(this.data.profile.favorites.heroes)) this.data.profile.favorites.heroes = [];
    // Favorites are intentionally limited to Heroes. Remove the old gear and
    // badge lists from existing saves so they cannot silently resurface in a
    // profile post or a future picker.
    delete this.data.profile.favorites.trinkets;
    delete this.data.profile.favorites.badges;
    this.data.profile.name = String(this.data.profile.name || '').replace(/[<>]/g, '').trim().slice(0, 24);
    // Older profile builds exposed Dandy and the Journal as free selections.
    // Preserve those existing choices as legacy entitlements while routing
    // all new special icons through the shop unlock inventory.
    const legacyShopIcons = { dandy: 'dandy', journal: 'journal' };
    const legacyIcon = this.data.profile.icon;
    if (legacyIcon && legacyShopIcons[legacyIcon.kind]) {
      const id = legacyShopIcons[legacyIcon.kind];
      if (!this.data.profile.iconUnlocks.includes(id)) this.data.profile.iconUnlocks.push(id);
      this.data.profile.icon = { kind: 'shop', id };
    }
    const profileIcon = this.data.profile.icon;
    const validIcon = profileIcon && (
      (profileIcon.kind === 'hero' && this.owns(profileIcon.id)) ||
      (profileIcon.kind === 'trinket' && this.ownsTrinket(profileIcon.id)) ||
      (profileIcon.kind === 'badge' && this.data.badges && this.data.badges[profileIcon.id]) ||
      (profileIcon.kind === 'shop' && this.data.profile.iconUnlocks.includes(profileIcon.id))
    );
    if (!validIcon) this.data.profile.icon = { kind: 'hero', id: this.data.team[0] || STARTERS[0] };
    this.data.profile.favorites.heroes = this.data.profile.favorites.heroes.filter(id => this.owns(id)).slice(0, 5);
    // Existing saves receive enough notes to keep upgrading immediately when
    // the dedicated skill material is introduced.
    if (needsNotesGrant) this.data.res.notes = 65;
    // Daily Orders were added after the original delivery streak. Keep an
    // existing streak intact while giving older saves a clean order board.
    ['orderDay', 'orderMastery', 'wins', 'orderClaimed'].forEach(k => {
      if (this.data.daily[k] === undefined) this.data.daily[k] = f.daily[k];
    });
    if (!this.data.daily.freeClaims || typeof this.data.daily.freeClaims !== 'object' || Array.isArray(this.data.daily.freeClaims)) {
      this.data.daily.freeClaims = { hour: -1, day: -1, week: -1 };
    }
    // Events formerly used a per-event daily-win counter and paid shards
    // directly. Event currencies persist across weekly rotations so an older
    // save never loses shop progress.
    if (!this.data.raid.stages || typeof this.data.raid.stages !== 'object' || Array.isArray(this.data.raid.stages)) this.data.raid.stages = {};
    if (!this.data.raid.clears || typeof this.data.raid.clears !== 'object' || Array.isArray(this.data.raid.clears)) this.data.raid.clears = {};
    if (this.data.raid.phantasiaCoins == null) this.data.raid.phantasiaCoins = 0;
    if (this.data.raid.qomPasses == null) this.data.raid.qomPasses = 0;
    if (this.data.raid.unknownWorldGears == null) this.data.raid.unknownWorldGears = 0;
    delete this.data.raid.day;
    delete this.data.raid.staminaV1;
    delete this.data.raid.stamina;
    delete this.data.raid.staminaAt;
    delete this.data.raid.staminaV2;
    delete this.data.raid.attempts;
    delete this.data.raid.winOnlyV1;
    // heroes released since last session become available to pull, not auto-owned
    Object.keys(this.data.heroes).forEach(id => {
      const h = this.data.heroes[id], n = this.newHero(id);
      for (const k in n) if (h[k] === undefined) h[k] = n[k];
      h.rarity = clamp(Number(h.rarity) || 1, 1, 6);
      h.rarityPlus = clamp(Number(h.rarityPlus) || 1, 1, RARITY_TIER_MAX[h.rarity]);
      h.rainbowUnlocked = h.rainbowUnlocked === true || h.rarity >= 6;
      // The old system had equip-only class choices. Preserve those choices
      // as learned Rank 1 paths rather than making an existing build vanish.
      if (h.cls && !h.classRanks[h.cls]) h.classRanks[h.cls] = 1;
      if (h.subcls && !h.subclassRanks[h.subcls]) h.subclassRanks[h.subcls] = 1;
    });
    this.data.team = this.data.team.filter(id => id && this.data.heroes[id]).slice(0, 5);
    this.enforceBudsTeam();
    // Virtual time and its currency were retired when rotations moved to the
    // shared real UTC service clock. Old values are discarded intentionally.
    delete this.data.calendarOffset;
    delete this.data.res.chrono;
    if (this.data.shop) {
      delete this.data.shop.offset;
      delete this.data.shop.skipDay;
      delete this.data.shop.skipsToday;
    }
    if (this.data.shop && this.data.shop.level === undefined) this.data.shop.level = 0;
    if (this.data.shop && (!this.data.shop.refreshes || typeof this.data.shop.refreshes !== 'object' || Array.isArray(this.data.shop.refreshes))) this.data.shop.refreshes = {};
    if (!this.data.buds || typeof this.data.buds !== 'object') this.data.buds = { state: 'available', stage: 1, chosen: null, startedAt: 0, completedAt: 0, previousRun: null, previousTeam: null, refusals: 0, demandShown: false, dandyConsequence: false, levelTutorialShown: false, levelTutorialPending: false, dialogueSeen: {} };
    if (!this.data.achievements || typeof this.data.achievements !== 'object') this.data.achievements = { unlocked: {}, stats: {} };
    if (!this.data.achievements.unlocked || typeof this.data.achievements.unlocked !== 'object') this.data.achievements.unlocked = {};
    if (!this.data.achievements.stats || typeof this.data.achievements.stats !== 'object') this.data.achievements.stats = {};
    ['state', 'stage', 'chosen', 'startedAt', 'completedAt', 'previousRun', 'previousTeam', 'pausedRun', 'refusals', 'demandShown', 'dandyConsequence', 'levelTutorialShown', 'levelTutorialPending', 'dialogueSeen'].forEach(k => {
      if (this.data.buds[k] === undefined) this.data.buds[k] = f.buds[k];
    });
    if (!this.data.buds.dialogueSeen || typeof this.data.buds.dialogueSeen !== 'object' || Array.isArray(this.data.buds.dialogueSeen)) this.data.buds.dialogueSeen = {};
    if (!Array.isArray(this.data.buds.previousTeam)) this.data.buds.previousTeam = null;
    this.data.buds.refusals = clamp(Number(this.data.buds.refusals) || 0, 0, 8);
    this.data.buds.demandShown = this.data.buds.demandShown === true;
    this.data.buds.dandyConsequence = this.data.buds.dandyConsequence === true;
    this.data.buds.levelTutorialShown = this.data.buds.levelTutorialShown === true;
    this.data.buds.levelTutorialPending = this.data.buds.levelTutorialPending === true;
    // The first release of Dandy's Buds called the Floor 1 crate state
    // "choosing". Preserve an in-progress choice when upgrading to the
    // three-floor version instead of restarting the tutorial.
    if (this.data.buds.state === 'choosing') { this.data.buds.state = 'chooseHero'; this.data.buds.stage = 1; }
    // A migrated active lesson may have been loaded before the shared team
    // lock existed. Re-apply it after Buds state migration, not only before.
    this.enforceBudsTeam();
    // old per-hero Friendship XP/level replaced by Friendship Badges (campaigns.js)
    Object.keys(this.data.heroes).forEach(id => {
      const h = this.data.heroes[id];
      delete h.friendship; delete h.friendLv;
    });
    this.migrateTrinkets();
    Object.values(this.data.trinketInv || {}).forEach(copy => {
      if (copy.id === 'phantasia_pepperminttoken') copy.id = 'phantasia_unicornemblem';
      copy.rank = clamp(Math.floor(Number(copy.rank) || 1), 1, TRINKET_MAX_RANK);
    });
  },

  /** Old saves banked an abstract shard count per Trinket type; the
      equipment rewrite replaced that with real copies you can hold several
      of. Port whatever progress existed into one copy at the old rank, and
      re-point each Hero's equipped slots at that copy's new id so nothing
      equipped just vanishes on load. */
  migrateTrinkets() {
    if (!this.data.trinkets) return; // fresh save, or already migrated
    const madeFor = {};
    Object.keys(this.data.trinkets).forEach(tid => {
      const old = this.data.trinkets[tid];
      const uid = 't' + (this.data.trinketSeq++);
      this.data.trinketInv[uid] = { id: tid, rank: Math.max(1, old.rank || 1) };
      madeFor[tid] = uid;
    });
    this.ownedIds().forEach(hid => {
      const h = this.hero(hid);
      h.trinkets = (h.trinkets || [null, null]).map(tid => (tid && madeFor[tid]) || null);
    });
    delete this.data.trinkets;
    delete this.data.trinketPending;
    this.write();
  },

  write(options = {}) {
    // Saving is persistence only. Mastery XP must come from a validated
    // gameplay action, never from navigation, modal buttons, or any other
    // caller that happens to write the save.
    // Every real local mutation gets a revision timestamp, including edits
    // made while the account is still connecting. Cloud reconciliation uses
    // this value to distinguish a player's new progress from an old local
    // copy, so suppressing it during startup could make those edits vanish.
    if (options.touch !== false) this.data._updatedAt = Date.now();
    try {
      const key = this.slotKey(this.activeSlot);
      const next = JSON.stringify(this.data);
      const previous = localStorage.getItem(key);
      if (previous && previous !== next) {
        try { if (this.validSave(JSON.parse(previous))) localStorage.setItem(this.backupKey(this.activeSlot), previous); } catch (_) { /* keep the new save usable */ }
      }
      localStorage.setItem(key, next);
      const index = this.ensureSlotIndex();
      this.updateSlotInfo(index, this.data);
      this.writeSlotIndex(index);
    }
    catch (e) { console.warn('save failed', e); }
    // The full test slot is intentionally offline and isolated from the
    // account cloud save as well as the player's normal local save.
    // Cloud storage is the account-bound copy of Main Save only. Other local
    // slots (especially Full Test Save) must never enter the cloud queue.
    if (!options.skipCloud && this.isMainSlot() && typeof WebsimAccount !== 'undefined') WebsimAccount.noteLocalChange();
  },

  reset() { this.data = this.fresh(); this.recoveryNotice = ''; this.write(); },

  /* ---------- backup / restore ---------- */
  exportSlot(id = this.activeSlot) {
    const index = this.ensureSlotIndex();
    const slot = index.slots.find(s => s.id === id);
    if (!slot) return null;

    let data = id === this.activeSlot ? this.data : null;
    if (!data) {
      try { data = JSON.parse(localStorage.getItem(this.slotKey(id)) || 'null'); }
      catch (_) { data = null; }
      if (!this.validSave(data)) {
        try { data = JSON.parse(localStorage.getItem(this.backupKey(id)) || 'null'); }
        catch (_) { data = null; }
      }
    }
    if (!this.validSave(data)) return null;
    return JSON.stringify({
      format: 'dandys-heroes-save', version: 2, exportedAt: Date.now(),
      slot: { id, name: slot.name || 'Save' }, save: data
    }, null, 2);
  },

  export() {
    return this.exportSlot(this.activeSlot) || JSON.stringify({
      format: 'dandys-heroes-save', version: 2, exportedAt: Date.now(),
      slot: { id: this.activeSlot, name: 'Save' }, save: this.data
    }, null, 2);
  },

  /** Loads a save from a JSON string (as produced by export()). Runs it
      through migrate() so an older or hand-edited save still works. Returns
      true on success, false if the text wasn't a usable save. */
  import(json, options = {}) {
    if (String(json || '').length > 300000) return false;
    let parsed;
    try { parsed = JSON.parse(json); } catch (e) { return false; }
    const incoming = parsed && parsed.save && typeof parsed.save === 'object' ? parsed.save : parsed;
    if (!this.validSave(incoming)) return false;
    if (options.newSlot) {
      const index = this.ensureSlotIndex();
      if (index.slots.length >= SAVE_SLOT_LIMIT) return false;
      const n = index.slots.length;
      const id = 'slot-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 6);
      index.slots.push({ id, name: this.cleanSlotName(options.name, this.defaultSlotName(n)), createdAt: Date.now(), updatedAt: 0, mastery: 0, heroes: 0, bestFloor: 0 });
      this.activeSlot = id;
      index.active = id;
      this.writeSlotIndex(index);
    }
    this.data = incoming;
    this.migrate();
    this.write(options);
    // Imports can replace graphics preferences while the game is already
    // running, especially when a newer cloud save is adopted.
    if (typeof GraphicsSettings !== 'undefined') GraphicsSettings.sync();
    return true;
  },

  createSlot(name, copyCurrent = false) {
    const index = this.ensureSlotIndex();
    if (index.slots.length >= SAVE_SLOT_LIMIT) return false;
    const n = index.slots.length;
    const id = 'slot-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 6);
    const source = copyCurrent && this.data ? JSON.parse(JSON.stringify(this.data)) : this.fresh();
    source.created = Date.now(); source._updatedAt = 0;
    index.slots.push({ id, name: this.cleanSlotName(name, this.defaultSlotName(n)), createdAt: Date.now(), updatedAt: 0, mastery: 0, heroes: 0, bestFloor: 0 });
    this.activeSlot = id; this.data = source; index.active = id;
    this.writeSlotIndex(index); this.write({ touch: false });
    return id;
  },
  renameSlot(id, name) {
    const index = this.ensureSlotIndex(), slot = index.slots.find(s => s.id === id);
    if (!slot) return false;
    slot.name = this.cleanSlotName(name, slot.name); this.writeSlotIndex(index); return true;
  },
  deleteSlot(id) {
    const index = this.ensureSlotIndex();
    if (!index.slots.some(s => s.id === id) || index.slots.length <= 1 || id === this.activeSlot) return false;
    index.slots = index.slots.filter(s => s.id !== id);
    try { localStorage.removeItem(this.slotKey(id)); localStorage.removeItem(this.backupKey(id)); } catch (_) { /* index still prevents access */ }
    this.writeSlotIndex(index); return true;
  },
  switchSlot(id) {
    const index = this.ensureSlotIndex();
    if (!index.slots.some(s => s.id === id) || id === this.activeSlot) return false;
    let parsed = null;
    try { parsed = JSON.parse(localStorage.getItem(this.slotKey(id)) || 'null'); } catch (_) { parsed = null; }
    if (!this.validSave(parsed)) {
      try { parsed = JSON.parse(localStorage.getItem(this.backupKey(id)) || 'null'); } catch (_) { parsed = null; }
    }
    if (!this.validSave(parsed)) return false;
    this.activeSlot = id; this.data = parsed; this.migrate(); this.write({ touch: false });
    return true;
  },

  /** A fully-stocked save for testing: every Hero owned near max progress,
      deep resources, and a spread of Trinkets (including duplicates/ranks so
      merge, equip and salvage all have something to work with). */
  buildTestSave() {
    const d = this.fresh();
    // Same formula as globalCap() (content.js), computed directly rather than
    // through Save.ownedIds() - that reads the live Save.data, which during
    // this call is still whatever save was active before this one loads.
    d.mastery = Math.min(60 + PLAYABLE_IDS.length * 20, 800);
    d.masteryXp = 0;
    d.heroes = {};
    const classIds = Object.keys(CLASSES), subclassIds = Object.keys(SUBCLASSES);
    PLAYABLE_IDS.forEach((id, i) => {
      const h = this.newHero(id);
      h.level = d.mastery; h.stars = 5; h.rarity = 6; h.rarityPlus = 30;
      h.skills = { W: 450, G: 450, B: 450, P: 450, R: 450 };
      h.shards = 500;
      h.cls = classIds[i % classIds.length];
      h.subcls = subclassIds[i % subclassIds.length];
      classIds.forEach(k => h.classRanks[k] = CLASS_MAX_RANK);
      subclassIds.forEach(k => h.subclassRanks[k] = CLASS_MAX_RANK);
      d.heroes[id] = h;
    });
    d.team = PLAYABLE_IDS.slice(0, 5);
    Object.keys(BADGES).forEach(bid => d.badges[bid] = { lvl: 3 });
    // The test save should start after the onboarding arc, not send an
    // endgame roster back to Dandy's first lesson. Keep the chosen Bud and
    // all three reward steps represented so every Buds-gated screen reads as
    // completed.
    const now = Date.now();
    d.buds = {
      state: 'completed', stage: 3, chosen: 'Rudie', startedAt: now - 3600000,
      completedAt: now - 1800000, previousRun: null,
      previousTeam: ['Poppy', 'Boxten', 'Rudie'], refusals: 0,
      demandShown: true, dandyConsequence: false
    };
    d.seen = {
      friendshipIntros: Object.fromEntries(Object.keys(CAMPAIGNS).map(id => [id, true])),
      glossary: { guide: true, training: true, trinkets: true }
    };
    Object.values(CAMPAIGNS).forEach(c => { d.campaigns[c.id] = c.stages.length; });
    Object.keys(BADGES).forEach(bid => {
      const owner = BADGES[bid].owner;
      if (d.heroes[owner]) d.heroes[owner].badge = bid;
    });
    COOKIE_HERO_IDS.forEach(id => {
      if (!d.heroes[id]) return;
      d.heroes[id].badge = BADGE_IDS_FOR(id).find(bid => BADGES[bid].cookieRun) || null;
      d.heroes[id].cookieSingleBadgeV1 = true;
    });
    // Current weekly modes are complete as well, while keeping their records
    // week-aware so the normal rotation can still roll over on schedule.
    const week = currentWeek();
    if (typeof weeklyTrials === 'function') {
      weeklyTrials(week).forEach(t => { d.trials[t.id] = { stage: 8, best: 8, week }; });
    }
    if (typeof ENDGAME_TRIAL !== 'undefined') {
      d.trials[ENDGAME_TRIAL.id] = { stage: 8, best: 8, week: 'permanent' };
    }
    if (typeof LOWER_APEX_TRIALS !== 'undefined') LOWER_APEX_TRIALS.forEach(t => {
      d.trials[t.id] = { stage: 8, best: 8, week: 'permanent' };
    });
    d.raid.tokens = 99999;
    d.raid.phantasiaCoins = 99999; d.raid.unknownWorldGears = 99999; d.raid.qomPasses = 99999;
    if (typeof weeklyEvents === 'function') {
      weeklyEvents(week).forEach(e => {
        d.raid.stages[e.id] = 8;
        d.raid.clears[e.id] = Object.fromEntries(Array.from({ length: 8 }, (_, i) => [i, true]));
      });
    }
    if (typeof ACHIEVEMENTS !== 'undefined') {
      ACHIEVEMENTS.forEach(a => {
        d.achievements.unlocked[a.id] = true;
        d.achievements.stats[a.kind] = Math.max(Number(d.achievements.stats[a.kind]) || 0, a.target);
      });
    }
    d.profile.iconUnlocks = ['dandy', 'buds', 'journal', 'ichor', 'achievement-sprout-pose', 'achievement-baldifer', 'achievement-yatta-blot'];
    Object.assign(d.res, {
      ichor: 999999, arenaCoin: 9999, tape: 9999, notes: 9999, star: 9999, ticket: 99, raidTicket: 99, elevatorTicket: 99, exp: 99999,
      gold: 999, diamond: 999, main: 999, thread: 9999, core: 999, manual: 9999, scrap: 9999, gear: 9999
    });
    d.trinketInv = {}; let seq = 1;
    TRINKET_IDS.slice(0, 12).forEach((id, i) => {
      const rank = 1 + (i % 3), copies = 2 + (i % 2);
      for (let c = 0; c < copies; c++) { d.trinketInv['t' + seq] = { id, rank }; seq++; }
    });
    d.trinketSeq = seq;
    d.shop.level = 100;
    d.shop.bought = {};
    d.arena = { rank: 800, wins: 20, losses: 3, day: -1, opponents: [] };
    // A maxed-out roster is an endgame save, not a floor-3 one - it should
    // resume deep in the Depths, not make the player walk back up from the
    // shallows every time they load it.
    d.bestFloor = 120;
    d._saveKind = 'full-test';
    return d;
  },
  canLoadTestSave() {
    // The full save is a local testing convenience, not an account-only
    // privilege. It always lives in its own slot and never replaces the
    // player's current/main save.
    return true;
  },

  loadTestSave() {
    if (!this.canLoadTestSave()) return false;
    // Flush the currently selected local slot before changing the active-slot
    // pointer. This is deliberately local-only: opening a test fixture should
    // not create a cloud revision or make the test data look like player data.
    if (!this.isTestSlot() && this.data && this.validSave(this.data)) this.write({ skipCloud: true, touch: false });
    const index = this.ensureSlotIndex();
    let slot = index.slots.find(s => s.id === SAVE_TEST_SLOT_ID);
    if (!slot) {
      if (index.slots.length >= SAVE_SLOT_LIMIT) return false;
      slot = {
        id: SAVE_TEST_SLOT_ID, name: 'Full Test Save', createdAt: Date.now(),
        updatedAt: 0, mastery: 0, heroes: 0, bestFloor: 0
      };
      index.slots.push(slot);
    }
    this.activeSlot = SAVE_TEST_SLOT_ID;
    this.data = this.buildTestSave();
    index.active = SAVE_TEST_SLOT_ID;
    this.writeSlotIndex(index);
    this.write({ skipCloud: true, touch: false });
    return true;
  },

  /* ---------- accessors ---------- */
  hero(id) { return this.data.heroes[id]; },
  owns(id) { return !!this.data.heroes[id]; },
  ownedIds() { return Object.keys(this.data.heroes); },
  res(k) { return this.data.res[k] || 0; },

  can(cost) { return Object.keys(cost || {}).every(k => this.res(k) >= cost[k]); },
  spend(cost) {
    if (!this.can(cost)) return false;
    Object.keys(cost).forEach(k => this.data.res[k] -= cost[k]);
    Sound.play('ichor_gain', { vol: .24, throttle: 110 });
    this.write(); UI.refreshBar(); return true;
  },
  give(gain, quiet) {
    Object.keys(gain || {}).forEach(k => {
      if (k === 'shards') return;
      this.data.res[k] = (this.data.res[k] || 0) + gain[k];
    });
    if ((gain && gain.ichor || 0) > 0) Sound.play('ichor_gain', { vol: .28, throttle: 110 });
    this.write();
    UI.refreshBar(true);
    if (!quiet) {
      const parts = Object.keys(gain).filter(k => RES[k]).map(k => RES[k].icon + ' ' + fmt(gain[k]));
      if (parts.length) UI.toast(parts.join('  '));
    }
  },

  /** Shards banked toward a Hero you have not unlocked yet. */
  pending(id) { return (this.data.pending && this.data.pending[id]) || 0; },
  unlockNeed(id) { return obtainOf(id).unlock; },

  /**
   * Grant Hero shards. An unowned Hero banks them until the obtainment
   * threshold is reached, which is what makes a Main Character genuinely
   * harder to get than a Common rather than just rarer to roll.
   * Returns 'new' when the Hero unlocks, 'bank' while still collecting.
   * Reward screens with their own recruit reveal can suppress the global one.
   */
  giveShards(id, n, suppressUnlockReveal = false) {
    if (!HEROES[id]) return false;
    if (this.owns(id)) { this.data.heroes[id].shards += n; this.write(); return false; }
    if (!this.data.pending) this.data.pending = {};
    const need = this.unlockNeed(id);
    const have = (this.data.pending[id] || 0) + n;
    if (have < need) { this.data.pending[id] = have; this.write(); return 'bank'; }
    delete this.data.pending[id];
    const h = this.newHero(id);
    h.shards = have - need;           // overflow carries into promotions
    this.data.heroes[id] = h;
    if (COOKIE_HERO_IDS.includes(id)) {
      h.badge = BADGE_IDS_FOR(id).find(bid => BADGES[bid].cookieRun) || null;
      h.cookieSingleBadgeV1 = true;
    }
    if (!suppressUnlockReveal && typeof UI !== 'undefined' && UI.queueHeroUnlock) UI.queueHeroUnlock(id);
    // A new Hero raises the account-wide level cap, so recruitment is
    // meaningful Mastery progress rather than just a roster number.
    this.addMasteryXp(260);
    Achievements.record('heroUnlock', 1);
    this.write();
    return 'new';
  },

  /* ---------- trinkets: real equipment, each copy its own instance ---------- */
  trinketCopies(id) { return Object.keys(this.data.trinketInv).filter(u => this.data.trinketInv[u].id === id); },
  trinketCount(id) { return this.trinketCopies(id).length; },
  ownsTrinket(id) { return this.trinketCount(id) > 0; },
  trinketBestRank(id) { return this.trinketCopies(id).reduce((m, u) => Math.max(m, this.data.trinketInv[u].rank), 0); },

  /** uids currently worn by any Hero, so the picker/merge/salvage flows know
      which copies are actually free to use. */
  equippedTrinketUids() {
    const s = new Set();
    this.ownedIds().forEach(hid => (this.hero(hid).trinkets || []).forEach(u => { if (u) s.add(u); }));
    return s;
  },
  freeTrinketCopies(id) {
    const eq = this.equippedTrinketUids();
    return this.trinketCopies(id).filter(u => !eq.has(u));
  },
  whoWears(uid) { return this.ownedIds().find(hid => (this.hero(hid).trinkets || []).includes(uid)) || null; },

  /** A fresh copy of a Trinket type, from a Twisted drop or a Hero's own
      level-up. Returns 'new' the first time you own that type, else 'copy'. */
  addTrinketCopy(id, rank) {
    if (!TRINKETS[id]) return false;
    const wasOwned = this.ownsTrinket(id);
    const uid = 't' + (this.data.trinketSeq++);
    this.data.trinketInv[uid] = { id, rank: clamp(Math.floor(Number(rank) || 1), 1, TRINKET_MAX_RANK) };
    this.write();
    return wasOwned ? 'copy' : 'new';
  },

  /** The upgrade path: Rank 1/2 uses two copies; Rank 3/4 is a more meaningful
      investment and uses three. Accepts the old two-uid form for save/API
      compatibility, or an array from the expanded inventory UI. */
  mergeTrinkets(id, uidA, uidB) {
    const inv = this.data.trinketInv;
    const uids = (Array.isArray(uidA) ? uidA : [uidA, uidB]).filter(Boolean);
    const first = inv[uids[0]];
    if (!first || first.id !== id || first.rank >= TRINKET_MAX_RANK) return false;
    const cost = trinketMergeCost(first.rank);
    if (uids.length !== cost || new Set(uids).size !== uids.length) return false;
    const copies = uids.map(uid => inv[uid]);
    if (copies.some(copy => !copy || copy.id !== id || copy.rank !== first.rank)) return false;
    const eq = this.equippedTrinketUids();
    if (uids.some(uid => eq.has(uid))) return false;
    uids.forEach(uid => { delete inv[uid]; });
    const uid = 't' + (this.data.trinketSeq++);
    inv[uid] = { id, rank: first.rank + 1 };
    this.addMasteryXp(32 + first.rank * 18 + (cost - 2) * 12);
    Achievements.record('trinketUpgrade', 1);
    this.write();
    return uid;
  },

  /** Preview the full free-copy upgrade chain without changing the save.
      Equipped copies are deliberately excluded, so bulk upgrading can never
      quietly remove gear from a Hero. Newly forged ranks are fed back into
      the next rank of the same preview, matching the real merge order. */
  trinketMergePreview(id) {
    const ids = id ? [id] : TRINKET_IDS;
    const eq = this.equippedTrinketUids();
    const byType = {}, byRank = {};
    let merges = 0;
    ids.filter(tid => TRINKETS[tid]).forEach(tid => {
      const counts = Array(TRINKET_MAX_RANK + 1).fill(0);
      this.trinketCopies(tid).forEach(uid => {
        const copy = this.data.trinketInv[uid];
        if (!eq.has(uid) && copy) counts[clamp(Math.floor(Number(copy.rank) || 1), 1, TRINKET_MAX_RANK)]++;
      });
      let typeMerges = 0;
      for (let rank = 1; rank < TRINKET_MAX_RANK; rank++) {
        const cost = trinketMergeCost(rank);
        while (counts[rank] >= cost) {
          counts[rank] -= cost; counts[rank + 1]++;
          merges++; typeMerges++; byRank[rank + 1] = (byRank[rank + 1] || 0) + 1;
        }
      }
      if (typeMerges) byType[tid] = typeMerges;
    });
    return { merges, byType, byRank };
  },

  /** Merge every eligible free copy, either for one Trinket type or for the
      entire locker. This is intentionally one save write instead of calling
      mergeTrinkets repeatedly, which keeps the bulk action fast and avoids
      partial UI refreshes while still awarding normal mastery and progress. */
  massMergeTrinkets(id) {
    const preview = this.trinketMergePreview(id);
    if (!preview.merges) return preview;
    const ids = id ? [id] : TRINKET_IDS;
    const eq = this.equippedTrinketUids();
    const inv = this.data.trinketInv;
    const result = { merges: 0, byType: {}, byRank: {} };
    ids.filter(tid => TRINKETS[tid]).forEach(tid => {
      for (let rank = 1; rank < TRINKET_MAX_RANK; rank++) {
        const cost = trinketMergeCost(rank);
        let free = Object.keys(inv).filter(uid => {
          const copy = inv[uid];
          return copy && copy.id === tid && copy.rank === rank && !eq.has(uid);
        });
        while (free.length >= cost) {
          const used = free.splice(0, cost);
          used.forEach(uid => { delete inv[uid]; });
          const uid = 't' + (this.data.trinketSeq++);
          inv[uid] = { id: tid, rank: rank + 1 };
          result.merges++; result.byType[tid] = (result.byType[tid] || 0) + 1;
          result.byRank[rank + 1] = (result.byRank[rank + 1] || 0) + 1;
          this.addMasteryXp(32 + rank * 18 + (cost - 2) * 12);
          Achievements.record('trinketUpgrade', 1);
          // Do not include the newly forged higher-rank copy in this rank's
          // free list. It is picked up when the next rank loop starts.
        }
      }
    });
    this.write();
    return result;
  },

  /** Break an unequipped copy down into Scrap - the "shards are for crafting
      too" sink, now that shards themselves are gone. */
  salvageTrinket(uid) {
    const c = this.data.trinketInv[uid];
    if (!c || this.equippedTrinketUids().has(uid)) return false;
    delete this.data.trinketInv[uid];
    const rank = clamp(Math.floor(Number(c.rank) || 1), 1, TRINKET_MAX_RANK);
    this.data.res.scrap = (this.data.res.scrap || 0) + (TRINKET_SALVAGE[rank] || 0);
    this.write();
    return true;
  },

  /** Spend Scrap to craft a fresh rank-1 copy of a Trinket of your choice,
      so progress isn't purely at the mercy of drops or one Hero's levels. */
  craftTrinket(id) {
    if (!TRINKETS[id]) return false;
    if ((this.data.res.scrap || 0) < CRAFT_COPY_COST) return false;
    this.data.res.scrap -= CRAFT_COPY_COST;
    const res = this.addTrinketCopy(id, 1);
    this.write();
    return res;
  },

  /* ---------- Friendship Badges: earned from a Friendship Campaign, one per
     Hero+friend pair. A Badge is unique (not owned in copies like a Trinket)
     and levels up by spending the *friend's* shards, not the wearer's. */
  ownsBadge(id) { return !!this.data.badges[id]; },
  badgeLvl(id) { const b = this.data.badges[id]; return b ? b.lvl : 0; },
  grantBadge(id) {
    if (!BADGES[id] || this.ownsBadge(id)) return false;
    this.data.badges[id] = { lvl: 1 };
    this.write();
    return true;
  },
  upgradeBadge(id) {
    const b = this.data.badges[id], def = BADGES[id];
    if (!b || !def || b.lvl >= BADGE_MAX_LVL) return false;
    const friend = this.hero(def.friend);
    const cost = badgeUpgradeCost(b.lvl);
    if (!friend || friend.shards < cost) return false;
    friend.shards -= cost;
    b.lvl++;
    this.write();
    return true;
  },
  equippedBadges(heroId) {
    const h = this.hero(heroId); if (!h) return [];
    return h.badge && BADGES[h.badge] && this.ownsBadge(h.badge) ? [h.badge] : [];
  },
  /** Two Cookie badges may be owned, but only one badge is ever worn. */
  equipBadge(heroId, badgeId) {
    const def = BADGES[badgeId];
    // The friend is not a battle requirement. It only identifies the campaign
    // pair and whose shards pay for upgrades.
    if (!def || def.owner !== heroId || !this.ownsBadge(badgeId) || !this.hero(heroId)) return false;
    this.hero(heroId).badge = badgeId;
    Sound.play('ui_ok'); this.write();
    return true;
  },
  unequipBadge(heroId, badgeId) {
    const h = this.hero(heroId); if (!h) return;
    if (COOKIE_HERO_IDS.includes(heroId)) return false;
    if (badgeId && h.badge !== badgeId) return;
    h.badge = null;
    Sound.play('ui_back'); this.write();
    return true;
  },

  campaignStage(id) {
    const c = CAMPAIGNS[id];
    return c ? clamp(Math.floor(Number(this.data.campaigns[id]) || 0), 0, c.stages.length) : 0;
  },
  campaignIntroSeen(id) { return !!(this.data.seen && this.data.seen.friendshipIntros && this.data.seen.friendshipIntros[id]); },
  markCampaignIntro(id) {
    this.data.seen = this.data.seen || {};
    this.data.seen.friendshipIntros = this.data.seen.friendshipIntros || {};
    this.data.seen.friendshipIntros[id] = true;
    this.write();
  },
  campaignDone(id) { const c = CAMPAIGNS[id]; return !!c && this.campaignStage(id) >= c.stages.length; },
  advanceCampaign(id) {
    const c = CAMPAIGNS[id];
    if (!c) return;
    const at = this.campaignStage(id);
    if (at >= c.stages.length) return;
    this.data.campaigns[id] = at + 1;
    if (at + 1 >= c.stages.length) this.grantBadge(c.badge);
    this.write();
  },

  /** First visit to each Journal reference section is a one-time discovery. Keeping
      the claim keyed in the save makes opening or rerendering the page safe. */
  discoverGlossary(section) {
    if (!section) return false;
    this.data.seen = this.data.seen || {};
    this.data.seen.glossary = this.data.seen.glossary || {};
    if (this.data.seen.glossary[section]) return false;
    this.data.seen.glossary[section] = Date.now();
    const discovery = { guide: 1, training: 2, trinkets: 3 }[section];
    if (discovery) Achievements.record('glossaryDiscovery', 1);
    this.addMasteryXp(20);
    return true;
  },

  /** Every Mastery level pays a dependable baseline and milestone supplies.
      Keeping this here makes the payout universal, including big XP awards
      that cross more than one level at once. */
  masteryReward(level) {
    const reward = {
      ichor: Math.round(1800 + level * 160),
      exp: Math.round(900 + level * 125)
    };
    if (level % 2 === 0) reward.tape = 6 + Math.floor(level / 12);
    if (level % 3 === 0) reward.notes = 9 + Math.floor(level / 10);
    if (level % 5 === 0) reward.star = 18 + Math.floor(level * 2);
    if (level % 10 === 0) reward.manual = 2 + Math.floor(level / 60);
    if (level % 20 === 0) reward.tape = 1 + Math.floor(level / 120);
    if (level % 25 === 0) reward.gold = 1 + Math.floor(level / 200);
    if (level % 30 === 0) reward.raidTicket = 1 + Math.floor(level / 240);
    if (level % 50 === 0) reward.diamond = 1 + Math.floor(level / 200);
    if (level % 75 === 0) reward.core = 1 + Math.floor(level / 225);
    return reward;
  },

  addMasteryXp(n, quiet) {
    const d = this.data;
    n = Math.max(0, Math.round(n || 0));
    if (!n) return 0;
    d.masteryXp += n;
    // Several validated rewards can land in one click or one battle result.
    // Merge those pings into one calm notice instead of interrupting the player.
    if (!quiet) {
      this._masteryToastTotal = (this._masteryToastTotal || 0) + n;
      clearTimeout(this._masteryToastTimer);
      this._masteryToastTimer = setTimeout(() => {
        const total = this._masteryToastTotal || 0;
        this._masteryToastTotal = 0;
        if (!total) return;
        UI.toast('＋' + fmt(total) + ' Mastery XP', { className: 'mastery-xp-toast' });
        Sound.play('mastery_xp', { vol: .22, throttle: 1100 });
      }, 260);
    }
    const cap = globalCap();
    let gained = 0;
    while (d.mastery < cap && d.masteryXp >= this.masteryNeed(d.mastery)) {
      d.masteryXp -= this.masteryNeed(d.mastery);
      d.mastery++;
      gained++;
      const reward = this.masteryReward(d.mastery);
      this.give(reward, true);
      if (!quiet) {
        UI.toast('🏅 Mastery ' + d.mastery + ' · reward claimed');
        Sound.play('get_rare');
        if (typeof MasteryCelebration !== 'undefined') MasteryCelebration.play(d.mastery, reward, cap);
      }
    }
    if (gained) {
      clearTimeout(this._masteryToastTimer);
      this._masteryToastTimer = 0;
      this._masteryToastTotal = 0;
    }
    if (gained && typeof Screens !== 'undefined' && Screens.refreshModeLocks) Screens.refreshModeLocks();
    this.write({ activity: false });
    return gained;
  },
  // Early account levels should feel welcoming, but reaching the higher
  // beginner milestones should take a little more sustained play.
  masteryNeed(lv) { return Math.round(95 + lv * 20); }
};
