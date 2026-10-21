/* modes.js - The Ichor Depths, Arena and Trials.
   Every mode funnels into the same reward buckets so one battle always moves
   several systems at once. */
'use strict';

/** Deterministic equipment for generated endgame opponents. Enemy Trinkets
    use plain {id, rank} records (players use inventory UIDs); Battle accepts
    both shapes. The same seed powers previews and combat, so disclosed gear
    can never silently change after the player presses Fight. */
function equipEnemyLoadout(spec, depth, rng, opt) {
  if (!spec) return spec;
  if (HEROES[spec.id] && HEROES[spec.id].noTrinket) { spec.trinkets = []; return spec; }
  opt = opt || {};
  rng = rng || seeded(`enemy-loadout:${spec.id}:${depth}`);
  const level = Math.max(1, Number(spec.level) || Number(depth) || 1);
  const kind = opt.kind || spec.kind || (spec.boss ? 'boss' : spec.elite ? 'elite' : 'normal');
  // A few authored event/arena specs do not come through makeTwisted. Keep
  // their dossier and combat stats on the same visible rarity ladder.
  if (spec.rarity == null) {
    spec.rarity = kind === 'boss' ? (level >= 220 ? 6 : 5)
      : kind === 'elite' ? clamp(4 + Math.floor(level / 220), 4, 6)
      : clamp(2 + Math.floor(level / 90), 1, 6);
  }
  spec.rarity = clamp(Number(spec.rarity) || 1, 1, 6);
  if (spec.rarityPlus == null) spec.rarityPlus = rarityPlusForLevel(level, spec.rarity, `${spec.id}-${kind}-${depth}`);
  if (spec.stars == null) spec.stars = kind === 'boss' ? 5 : clamp(1 + Math.floor(level / 70), 1, 5);
  if (spec.skillLv == null) spec.skillLv = Math.max(1, Math.round(level * (kind === 'boss' ? 1.1 : kind === 'elite' ? .95 : .8)));
  const rank = clamp(opt.rank || (1 + Math.floor(Math.max(0, depth - 8) / 28)), 1, TRINKET_MAX_RANK);
  let count = opt.trinketCount;
  if (count == null) {
    count = depth >= 38 ? (rng.chance(.55) ? 2 : 1)
      : depth >= 8 ? 1 : rng.chance(Math.max(0, depth - 3) * .07) ? 1 : 0;
  }
  // Standard hostile encounters should always show at least one piece of
  // gear. Tutorial Buds explicitly clear this after hardening, so they keep
  // their teaching-only loadout while every normal mode has visible gear.
  if (opt.allowEmpty !== true) count = Math.max(1, count);
  const owned = trinketsForOwner(spec.id).filter(id => !TRINKETS[id].eventOnly);
  const generic = rng.shuffle(TRINKET_IDS.filter(id => !TRINKETS[id].owner && !TRINKETS[id].eventOnly));
  const pool = owned.concat(generic).filter((id, i, a) => a.indexOf(id) === i);
  spec.trinkets = rng.shuffle(pool).slice(0, count).map(id => ({ id, rank }));

  const badgeIds = BADGE_IDS_FOR(spec.id);
  const badgeChance = opt.badgeChance == null ? clamp(.04 + depth * .006, .04, .55) : opt.badgeChance;
  if (badgeIds.length && rng.chance(badgeChance)) {
    spec.badge = { id: rng.pick(badgeIds), lvl: clamp(opt.badgeLvl || (1 + Math.floor(depth / 15)), 1, BADGE_MAX_LVL) };
  }
  return spec;
}

function enemyLoadoutParts(spec) {
  const trinkets = (spec && spec.trinkets || []).map(worn => {
    const copy = typeof worn === 'string' ? Save.data.trinketInv[worn] : worn;
    const def = copy && TRINKETS[copy.id];
    return def ? { id: copy.id, rank: copy.rank || 1, name: def.name, icon: trinketIcon(copy.id) } : null;
  }).filter(Boolean);
  const badgeRefs = spec && Array.isArray(spec.badges) && spec.badges.length ? spec.badges : spec && spec.badge ? [spec.badge] : [];
  const badges = badgeRefs.slice(-1).map(ref => {
    const id = typeof ref === 'string' ? ref : ref && ref.id;
    return id && BADGES[id] ? { id, lvl: typeof ref === 'string' ? Save.badgeLvl(id) : ref.lvl,
      name: BADGES[id].name, icon: BADGES[id].icon } : null;
  }).filter(Boolean);
  return { trinkets, badges, badge: badges[0] || null };
}

function enemyLoadoutChips(spec) {
  const gear = enemyLoadoutParts(spec);
  return gear.trinkets.map(t => `<span class="enemy-gear-chip" title="${t.name} · Rank ${t.rank}"><img src="${t.icon}" alt=""><i>R${t.rank}</i></span>`).join('') +
    gear.badges.map(b => `<span class="enemy-gear-chip badge" title="${b.name} · Level ${b.lvl}"><b>${b.icon}</b><i>L${b.lvl}</i></span>`).join('');
}

function enemyLoadoutText(spec) {
  const gear = enemyLoadoutParts(spec);
  const parts = gear.trinkets.map(t => `${t.name} R${t.rank}`);
  gear.badges.forEach(b => parts.push(`${b.name} L${b.lvl}`));
  return parts.length ? parts.join(' · ') : 'No Trinkets or Friendship Badge';
}

function enemyPreviewDescription(skill, key, skillLv) {
  if (!skill) return '';
  if (key === 'basic') {
    const source = skill.type === 'magic' ? 'Magic Attack' : 'Attack';
    return formatSkillSeconds(`${skill.note || ''} Deals <em>${Math.round(skill.ratio * 100)}%</em> of ${source}.`);
  }
  const S = {};
  for (const k in (skill.v || {})) S[k] = skill.v[k] * skillMult(skillLv);
  try { return formatSkillSeconds(skill.desc ? skill.desc(S, skillGrowthParams(skill, skillLv)) : ''); }
  catch (e) { return ''; }
}

function openEnemyPreview(spec) {
  const d = HEROES[spec.id]; if (!d) return;
  const skillLv = Math.max(1, spec.skillLv || 1);
  const rarity = clamp(spec.rarity || 1, 1, 6);
  const rarityPlus = spec.rarityPlus == null ? rarityPlusForLevel(spec.level || 1, rarity, spec.id) : spec.rarityPlus;
  const rarityText = rarityLabel(rarity, rarityPlus);
  const gear = enemyLoadoutParts(spec);
  const body = el('div', 'enemy-preview');
  const head = el('div', 'enemy-preview-head');
  head.innerHTML = `<div class="enemy-preview-art"><img src="${spec.artSrc || Art.unit(spec.id, spec.twisted)}" alt=""></div>
    <div class="grow"><small>ENEMY DOSSIER</small><h2>${d.name}</h2>
      <span>LV ${spec.level || 1} · ${'★'.repeat(spec.stars || 1)} · SKILL LV ${skillLv} · ${rarityText.toUpperCase()}</span></div>`;
  body.appendChild(head);

  const moves = el('section', 'enemy-preview-section');
  moves.innerHTML = `<div class="enemy-preview-section-title"><b>MOVESET</b><span>${rarityText.toUpperCase()}</span></div>`;
  const moveList = el('div', 'enemy-preview-moves');
  const entries = [{ key: 'basic', skill: d.basic, unlocked: true }].concat(
    SKILL_ORDER.filter(key => d.skills && d.skills[key]).map(key => ({
      key, skill: d.skills[key], unlocked: rarity >= SKILL_RARITY[key]
    }))
  );
  entries.forEach(({ key, skill, unlocked }) => {
    const row = el('article', 'enemy-preview-move' + (unlocked ? '' : ' locked'));
    const label = key === 'basic' ? 'BASIC' : `${RARITY_NAMES[SKILL_RARITY[key]]} SKILL`;
    const meta = key === 'basic'
      ? `${skill.range || 0} RANGE`
      : skill.cd ? `${skillCooldown(skill, skillLv).toFixed(1)}s CD`
        : skill.energy ? '100 ENERGY' : 'PASSIVE';
    row.innerHTML = `<div class="enemy-preview-move-top"><span>${label}</span><b>${skill.name}</b><i>${unlocked ? meta : 'LOCKED'}</i></div>
      ${unlocked ? `<div class="enemy-preview-move-desc">${tagifyStatuses(enemyPreviewDescription(skill, key, skillLv))}</div>` : `<div class="enemy-preview-move-desc">Unlocks at ${RARITY_NAMES[SKILL_RARITY[key]]} rarity.</div>`}`;
    moveList.appendChild(row);
  });
  moves.appendChild(moveList); body.appendChild(moves);

  const equipment = el('section', 'enemy-preview-section');
  equipment.innerHTML = '<div class="enemy-preview-section-title"><b>GEAR</b><span>REVEALED LOADOUT</span></div>';
  const gearList = el('div', 'enemy-preview-gear-list');
  gear.trinkets.forEach(t => {
    const def = TRINKETS[t.id];
    const row = el('div', 'enemy-preview-gear');
    row.innerHTML = `<img src="${t.icon}" alt=""><div class="grow"><b>${t.name} <small>RANK ${t.rank}</small></b>
      <span>${trinketStatText(def, t.rank)}</span><p>${def && (def.effect || def.desc) || ''}</p></div>`;
    gearList.appendChild(row);
  });
  gear.badges.forEach(b => {
    const def = BADGES[b.id], row = el('div', 'enemy-preview-gear badge');
    row.innerHTML = `<strong>${b.icon}</strong><div class="grow"><b>${b.name} <small>LEVEL ${b.lvl}</small></b>
      <span>${def && def.stat ? def.stat(b.lvl) : ''}</span><p>${def && def.effect || ''}</p></div>`;
    gearList.appendChild(row);
  });
  if (!gearList.children.length) gearList.appendChild(el('div', 'enemy-preview-empty', 'No Trinkets or Friendship Badge detected.'));
  equipment.appendChild(gearList); body.appendChild(equipment);
  UI.modal(d.name + ' · Enemy Preview', body, { className: 'enemy-preview-modal' });
}

function bindEnemyPreview(node, spec, tap) {
  let timer = 0, suppressClick = false;
  node.classList.add('enemy-preview-pressable');
  node.title = 'Tap for gear summary · press and hold for moveset';
  const cancel = () => { if (timer) { clearTimeout(timer); timer = 0; } };
  node.addEventListener('pointerdown', e => {
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    cancel();
    timer = setTimeout(() => {
      timer = 0; suppressClick = true;
      openEnemyPreview(spec);
    }, 560);
  });
  node.addEventListener('pointerup', cancel);
  node.addEventListener('pointercancel', cancel);
  node.addEventListener('pointerleave', cancel);
  node.addEventListener('contextmenu', e => { if (timer || suppressClick) e.preventDefault(); });
  node.addEventListener('click', e => {
    if (suppressClick) { e.preventDefault(); e.stopPropagation(); suppressClick = false; return; }
    if (tap) tap();
  });
}

/* ============================================================ THE ICHOR DEPTHS */
const Depths = {

  /** The three Dandy's Buds floors are intentionally authored rather than
      random. They teach a level-1 starter pair, then a three-Toon squad,
      without importing Endless modifiers or an unlucky elite roll. */
  budStage(floor) {
    const buds = Save.data && Save.data.buds;
    const stage = buds && buds.stage || 1;
    return buds && buds.state === 'active' && stage >= 1 && stage <= 3 && (floor == null || floor === stage) ? stage : 0;
  },

  /* Ichor is the long-term level, rarity, and crate currency. Room rewards
     rose linearly while endgame upgrade costs accelerated much faster. This
     starts after Floor 60, so early progression is unchanged. */
  endgameIchorMult(floor) {
    const late = Math.max(0, floor - 60);
    return 1 + Math.min(1.8, late * .018) + Math.sqrt(late) * .06;
  },

  /** A genuinely random room layout for this floor - rolled fresh, like a
      roguelite floor should be, not the same shape every single time. */
  eventAppearance(floor) {
    floor = Math.max(1, Math.floor(Number(floor) || 1));
    const budStage = this.budStage(floor);
    if (budStage) return {
      floor, eligibleRooms: 0, perRoomChance: 0, floorChance: 0,
      expectedEvents: 0, tutorial: true
    };
    // Four interior rooms can roll an Event. The chance rises gradually as
    // Endless becomes more dangerous, while the first standard floor keeps a
    // guaranteed Machine tutorial room (three Event checks there).
    const eligibleRooms = floor === 1 ? 3 : 4;
    const perRoomChance = clamp(.12 + Math.min(.18, floor * .0045), .12, .30);
    const floorChance = 1 - Math.pow(1 - perRoomChance, eligibleRooms);
    return {
      floor, eligibleRooms, perRoomChance, floorChance,
      expectedEvents: eligibleRooms * perRoomChance, tutorial: false
    };
  },

  buildFloor(f) {
    const currentRun = Save.data && Save.data.depth;
    if (currentRun && currentRun.dandyConsequence && currentRun.dandyConsequenceFloor === f) {
      return { floor: f, nodes: ['boss'], mods: [], dandyConsequence: true,
        eventCalc: { floor: f, eligibleRooms: 0, perRoomChance: 0, floorChance: 0, expectedEvents: 0, consequence: true } };
    }
    const budStage = this.budStage(f);
    if (budStage) {
      const lessons = {
        1: ['battle', 'battle', 'rest', 'battle', 'treasure', 'battle'],
        // Floor 2 is the first time the new third Bud joins. Give the trio a
        // breather immediately after its first real fight instead of asking
        // a fragile damage Toon to carry wounds through half the lesson.
        2: ['battle', 'rest', 'treasure', 'battle', 'rest', 'battle'],
        3: ['battle', 'rest', 'battle', 'treasure', 'battle', 'battle']
      };
      return { floor: f, nodes: lessons[budStage], mods: [], buds: true };
    }
    const rng = this.roomRng(f, 0, 'layout');
    const isBossFloor = f % 5 === 0;
    const count = 6;
    const nodes = [];
    const eventCalc = this.eventAppearance(f);
    // Once the starter climb is over, some sectors can contain two events.
    // Event is rolled explicitly so the displayed floor calculation matches
    // the actual route instead of being hidden inside a weighted room pool.
    const roomPool = f >= 5 && rng.chance(.34)
      ? ['battle', 'machine', 'treasure', 'rest', 'elite']
      : ['battle', 'battle', 'treasure', 'machine', 'rest', 'elite'];
    for (let i = 0; i < count; i++) {
      if (i === count - 1) { nodes.push(isBossFloor ? 'boss' : 'elite'); continue; }
      if (i === 0) { nodes.push('battle'); continue; }
      if (f === 1 && i === 2) { nodes.push('machine'); continue; }
      nodes.push(rng.chance(eventCalc.perRoomChance) ? 'event' : rng.pick(roomPool));
    }
    const modCount = f < 3 ? 0 : f < 8 ? 1 : f < 15 ? 2 : f < 25 ? 3 : 4;
    // Rarity-gated weighted selection: deeper floors skew toward rarer mods
    const eligibleMods = FLOOR_MODS.filter(m =>
      (m.rarity === 'common') ||
      (m.rarity === 'rare'  && f >= 8) ||
      (m.rarity === 'epic'  && f >= 15));
    const rarityWeight = { common: f < 15 ? 6 : f < 25 ? 3 : 1, rare: 3, epic: f < 20 ? 1 : f < 30 ? 2 : 4 };
    const weights = eligibleMods.map(m => rarityWeight[m.rarity] || 1);
    const totalW = weights.reduce((s, w) => s + w, 0);
    const chosen = [];
    for (let pick = 0; pick < modCount && chosen.length < eligibleMods.length; pick++) {
      let roll = rng.f() * (totalW - chosen.reduce((s, m) => s + (rarityWeight[m.rarity] || 1), 0));
      let acc = 0;
      for (let i = 0; i < eligibleMods.length; i++) {
        if (chosen.includes(eligibleMods[i])) continue;
        acc += rarityWeight[eligibleMods[i].rarity] || 1;
        if (roll < acc) { chosen.push(eligibleMods[i]); break; }
      }
    }
    const mods = chosen.map(m => m.id);
    return { floor: f, nodes, mods, eventCalc };
  },

  /** Build a new run from a selected elevator deployment. The record route
      remains the default, while deliberate restarts can choose a safer or
      better-prepared starting point. */
  restartOptions() {
    const best = Math.max(0, Save.data.bestFloor || 0);
    const recordFloor = Math.max(1, best + 1);
    const checkpointFloor = Math.max(1, Math.floor(best / 5) * 5 + 1);
    const options = [
      { id: 'fresh', floor: 1, icon: '🌱', title: 'Fresh Drop', drafts: 2, scout: 0,
        desc: 'Floor 1 · Begin clean with two opening card drafts.' }
    ];
    if (checkpointFloor > 1 && checkpointFloor !== recordFloor) {
      options.push({ id: 'checkpoint', floor: checkpointFloor, icon: '⚓', title: 'Secured Checkpoint', drafts: 1, scout: 1,
        desc: `Floor ${checkpointFloor} · Start after your last boss-sector clear with the first room scouted.` });
    }
    if (recordFloor > 1) {
      options.push({ id: 'record', floor: recordFloor, icon: '🚨', title: 'Record Push', drafts: 2, scout: 0,
        desc: `Floor ${recordFloor} · Push beyond your deepest secured floor with two opening card drafts.` });
    }
    return options;
  },
  restartOption(id) {
    const options = this.restartOptions();
    return options.find(option => option.id === id) || options.find(option => option.id === 'record') || options[0];
  },
  makeRun(option) {
    option = option || this.restartOption('record');
    return {
      floor: option.floor, node: 0, hp: {}, buffs: [], scouted: option.scout || 0,
      forceElite: false, clearMods: false, startMode: option.id, startDrafts: option.drafts || 1,
      freeSkipFloors: 0, freeSkipOfferUsed: false,
      // One seed per descent keeps rooms and payouts stable through reloads.
      seed: hashStr(`depth:${Date.now()}:${Math.random()}`)
    };
  },
  makeBudsRun(stage) {
    const run = this.makeRun({ id: 'buds', floor: stage, drafts: 0, scout: 0 });
    run.deckVersion = 1;
    run.cards = {};
    run.cardHistory = [];
    run.pendingDraft = 0;
    run.draftReasons = [];
    run.rerolls = 0;
    return run;
  },

  /** Start or resume the run. A fresh run doesn't force a replay from Floor 1 -
      it picks up right past whatever floor you've already cleared, so getting
      back into the Depths after abandoning (or on a brand new save) isn't a
      grind back to where you already were. */
  run() {
    let r = Save.data.depth;
    if (!r || typeof r !== 'object' || Array.isArray(r)) {
      const buds = Save.data.buds;
      const lesson = buds && buds.state === 'active' && buds.stage >= 1 && buds.stage <= 3;
      r = Save.data.depth = lesson
        ? this.makeBudsRun(buds.stage)
        : this.makeRun(this.restartOption('record'));
    }
    // Migrate runs already in progress too. In particular, a player arriving
    // here on the old floor-121 wall immediately gets a first build choice.
    if (r.deckVersion !== 1) {
      const catchupDrafts = Math.max(r.startDrafts || 1, 1 + Math.min(4, Math.floor((r.floor - 1) / 40)));
      r.deckVersion = 1;
      r.cards = r.cards || {};
      r.cardHistory = r.cardHistory || [];
      r.pendingDraft = Math.max(catchupDrafts, r.pendingDraft || 0);
      r.draftReasons = (r.draftReasons && r.draftReasons.length) ? r.draftReasons
        : Array.from({ length: r.pendingDraft }, (_, i) => i ? 'floor' : 'first');
      r.rerolls = r.rerolls == null ? 1 : r.rerolls;
      r.draftSeq = r.draftSeq || 0;
      r.draftRoll = r.draftRoll || 0;
      r.seed = r.seed || hashStr(Date.now() + ':' + r.floor + ':' + Math.random());
      Save.write();
    }
    // Older v1 runs did not have a seed. Give them one once and preserve it
    // from then on, so migrating a save does not reroll its next room later.
    if (!r.seed) {
      r.seed = hashStr(`depth:${Date.now()}:${Math.random()}`);
      Save.write();
    }
    return r;
  },
  prepareDandyConsequence() {
    const r = this.run();
    const oldRun = Save.data.buds && Save.data.buds.previousRun;
    if (Save.data.buds && !Array.isArray(Save.data.buds.previousTeam)) {
      Save.data.buds.previousTeam = (Save.data.team || []).filter(id => id && Save.owns(id));
    }
    if (!oldRun && r && !r.dandyConsequence && (r.floor > 1 || r.node > 0 || Object.values(r.cards || {}).some(Boolean))) {
      // The consequence rewrites this live run into a one-room encounter, so
      // keep a snapshot for the normal Buds completion hand-off.
      Save.data.buds.previousRun = JSON.parse(JSON.stringify(r));
    }
    r.node = 0;
    r.hp = {};
    r.forceElite = false;
    r.clearMods = false;
    r.pendingDraft = 0;
    r.draftReasons = [];
    r.draftOptions = null;
    r.layoutData = null;
    r.layoutFloor = null;
    r.dandyConsequence = true;
    r.dandyConsequenceResolved = false;
    r.dandyConsequenceFloor = r.floor;
    Save.data.buds.dandyConsequence = true;
    Save.write();
    return r;
  },
  /** The floor layout is rolled once when a floor is first entered, then
      cached on the run so re-rendering the same screen doesn't reshuffle the
      rooms out from under the player - it only rerolls when the floor itself
      changes. */
  layout() {
    const r = this.run();
    if (r.layoutFloor !== r.floor || !r.layoutData) {
      r.layoutData = this.buildFloor(r.floor);
      r.layoutFloor = r.floor;
      Save.write();
    }
    return r.layoutData;
  },

  /** Randomness owned by a room, not by the browser session. */
  roomRng(floor, node, kind) {
    const r = this.run();
    return seeded(`depth-room:${r.seed}:${floor}:${node}:${kind || 'room'}`);
  },

  reset(startMode) {
    const buds = Save.data.buds;
    Save.data.depth = buds && buds.state === 'active'
      ? this.makeBudsRun(buds.stage)
      : this.makeRun(this.restartOption(startMode || 'record'));
    Save.write();
    return this.run();
  },

  /* ---------- run deck ---------- */
  cardStack(id) { return (this.run().cards || {})[id] || 0; },
  cardCount() { return sum(Object.values(this.run().cards || {})); },
  queueDraft(reason) {
    const r = this.run();
    r.pendingDraft = (r.pendingDraft || 0) + 1;
    (r.draftReasons || (r.draftReasons = [])).push(reason || 'floor');
    r.draftOptions = null; r.draftRoll = 0;
    Save.write();
  },
  draftReason() { const r = this.run(); return (r.draftReasons && r.draftReasons[0]) || 'floor'; },
  draftOptions() {
    const r = this.run();
    if (!r.pendingDraft) return [];
    if (r.draftOptions && r.draftOptions.length) return r.draftOptions;
    const reason = this.draftReason();
    const rng = seeded(`depth-deck:${r.seed}:${r.draftSeq}:${r.draftRoll}:${reason}`);
    const luck = this.cardStack('blind_grab');
    let pool = DEPTH_CARD_IDS.filter(id => this.cardStack(id) < (DEPTH_CARDS[id].max || 1));
    // An endless run must never reach a dead draft. Once every card is
    // mastered, non-revive cards become repeatable and the build can keep
    // growing alongside the endless enemy curve.
    if (!pool.length) pool = DEPTH_CARD_IDS.filter(id => id !== 'second_wind');
    const chosen = [];
    while (chosen.length < Math.min(3, pool.length)) {
      const left = pool.filter(id => !chosen.includes(id));
      const weights = left.map(id => {
        const rarity = DEPTH_CARDS[id].rarity;
        let w = rarity === 'common' ? 68 : rarity === 'rare' ? 26 : 6;
        if (reason === 'elite' || reason === 'cache') w *= rarity === 'common' ? .65 : rarity === 'rare' ? 1.45 : 1.8;
        if (reason === 'boss') w *= rarity === 'common' ? .35 : rarity === 'rare' ? 1.7 : 3.4;
        if (rarity === 'rare') w *= 1 + luck * .22 + Math.min(.35, r.floor / 500);
        if (rarity === 'epic') w *= 1 + luck * .42 + Math.min(.75, r.floor / 240);
        return w;
      });
      let roll = rng.f() * sum(weights), pickId = left[left.length - 1];
      for (let i = 0; i < left.length; i++) { roll -= weights[i]; if (roll <= 0) { pickId = left[i]; break; } }
      chosen.push(pickId);
    }
    r.draftOptions = chosen; Save.write();
    return chosen;
  },
  rerollDraft() {
    const r = this.run();
    if (!r.pendingDraft || r.rerolls <= 0) return false;
    r.rerolls--; r.draftRoll = (r.draftRoll || 0) + 1; r.draftOptions = null;
    Save.write(); this.draftOptions(); return true;
  },
  pickCard(id) {
    const r = this.run(), c = DEPTH_CARDS[id];
    if (!c || !r.pendingDraft || !(r.draftOptions || []).includes(id)) return false;
    const at = this.cardStack(id);
    const stillUnmastered = DEPTH_CARD_IDS.some(cid => this.cardStack(cid) < (DEPTH_CARDS[cid].max || 1));
    if (at >= c.max && stillUnmastered) return false;
    r.cards[id] = at + 1;
    r.cardHistory.push({ id, floor: r.floor });
    r.pendingDraft = Math.max(0, r.pendingDraft - 1);
    if (r.draftReasons && r.draftReasons.length) r.draftReasons.shift();
    r.draftOptions = null; r.draftSeq++; r.draftRoll = 0;
    if (id === 'blind_grab') r.rerolls++;
    if (id === 'elevator_pass') { r.clearMods = true; r.scouted = Math.max(r.scouted || 0, 2 * (at + 1)); }
    if (id === 'mapmaker') { r.scouted = Math.max(r.scouted || 0, 3 * (at + 1)); r.rerolls = (r.rerolls || 0) + at + 1; }
    if (id === 'patch_job') this.healRun(.08);
    Save.write();
    return true;
  },

  /** Permanent Trinkets get a real Depths identity: every equipped rank adds
      a small bundle of core stats, then Gem Resonance can turn equipment into
      the spine of a run. This leaves Trinket behaviour in other modes intact. */
  trinketRanksFor(u) {
    return (u.trinkets || []).reduce((n, uid) => {
      const copy = Save.data.trinketInv && Save.data.trinketInv[uid];
      return n + (copy ? copy.rank || 1 : 0);
    }, 0);
  },
  applyRunBuild(B) {
    const r = this.run(), C = id => (r.cards && r.cards[id]) || 0;
    const allies = B.units.filter(u => u.team === TEAM_P && !u.minion);
    const foes = B.units.filter(u => u.team === TEAM_E);
    allies.forEach(u => {
      const ranks = this.trinketRanksFor(u), gem = C('gem_resonance');
      const add = (k, v) => { if (v) u.flat[k + '90'] = (u.flat[k + '90'] || 0) + v; };

      // Baseline Trinket resonance: useful at rank 1, genuinely noticeable at
      // six total ranks, and different for every equipped squad.
      add('hpP', ranks * (.025 + gem * .03));
      ['atkP', 'magP', 'defP', 'mdefP'].forEach(k => add(k, ranks * (.018 + gem * .02)));

      add('cdr', C('script_doctor') * .09); add('energyGen', C('script_doctor') * .12);
      add('atkP', C('overclocked') * .12); add('magP', C('overclocked') * .12);
      add('aspdP', C('overclocked') * .06); add('hpP', C('overclocked') * -.03);
      add('accP', C('watchful_eye') * .10); add('crit', C('watchful_eye') * .04);
      add('ccRes', C('fresh_air') * .12); add('healRecv', C('fresh_air') * .08);
      add('hpP', C('reinforced_shell') * .12); add('defP', C('reinforced_shell') * .08);
      add('mdefP', C('reinforced_shell') * .08); add('dmgTaken', C('reinforced_shell') * -.03);
      add('aspdP', C('redline_dial') * .10); add('dmgDealt', C('redline_dial') * .06);
      add('evaP', C('spring_shoes') * .08); add('msP', C('spring_shoes') * .12);
      add('aspdP', C('spring_shoes') * .04);
      add('healPowP', C('patch_job') * .10); add('shieldPowP', C('patch_job') * .10);
      add('atkP', C('glass_cannon') * .18); add('magP', C('glass_cannon') * .18);
      add('crit', C('glass_cannon') * .07); add('hpP', C('glass_cannon') * -.08);
      add('armorPen', C('overkill_protocol') * .06); add('magPen', C('overkill_protocol') * .06);
      add('healRecv', C('medic_protocol') * .05); add('accP', C('enemy_analyzer') * .08);
      add('energyGen', C('battle_hymn') * .05);

      // Old event run buffs were recorded but never reached battle. Cards and
      // those event rewards now share this one run-build application point.
      (r.buffs || []).forEach(id => { if (STATUS[id]) B.applyStatus(u, u, id, 999); });
      u.recompute(false);

      const siphon = C('ichor_siphon');
      if (siphon) B.on(u, 'dealDamage', ev => {
        if (!ev || ev.dot || !ev.target || ev.target.team === u.team) return;
        B.heal(u, u, Math.min(ev.amount * .04 * siphon, u.max.hp * .05), { silent: true, pure: true });
      });
      const bright = C('bright_idea');
      if (bright) {
        u.energy = Math.min(u.energyMax, u.energy + bright * 18);
        B.on(u, 'damaged', () => {
          if (u._depthBulb || !u.alive || u.hpPct > .40) return;
          u._depthBulb = true; B.shield(u, u, u.max.hp * .14 * bright, 8);
        });
      }
      const emergency = C('emergency_kit');
      if (emergency) {
        B.energy(u, emergency * 12);
        B.shield(u, u, u.max.hp * .06 * emergency, 10);
      }
      if (C('second_wind')) B.on(u, 'lethal', ev => {
        if (u._depthSecondWind) return;
        u._depthSecondWind = true; ev.prevented = true;
        u.hp = u.max.hp * .22; B.shield(u, u, u.max.hp * .15, 7);
        B.fxFloatIcon(u.x, u.y - 90, '♥');
      });
    });
    const saver = C('power_saver');
    if (saver) foes.forEach(u => {
      u.flat.dmgDealt90 = -saver * .07;
      u.flat.energyGen90 = -saver * .08;
      u.recompute(false);
    });
    const medic = C('medic_protocol');
    if (medic) B.every(null, 6, () => {
      const target = B.lowestHp(B.playerTeam());
      if (target) B.heal(null, target, target.max.hp * .03 * medic, { silent: true });
    });
    const hymn = C('battle_hymn');
    if (hymn && allies.length) {
      allies.forEach(u => B.on(u, 'allyDamageDealt', ev => {
        if (B._depthHymnEvent === ev) return;
        B._depthHymnEvent = ev;
        B.playerTeam().forEach(t => B.energy(t, hymn));
      }));
    }
    const overkill = C('overkill_protocol');
    const analyzer = C('enemy_analyzer');
    if (overkill || analyzer) allies.forEach(u => B.on(u, 'dealDamage', ev => {
      if (!ev || !ev.target) return;
      if (overkill && ev.target.hpPct < .35) ev.amount *= 1 + overkill * .18;
      if (analyzer && (ev.target.isBoss || ev.target.isElite)) ev.amount *= 1 + analyzer * .08;
    }));
    const lastStand = C('last_stand');
    if (lastStand) allies.forEach(u => B.on(u, 'allyDown', down => {
      if (B._depthLastStandUsed || !down) return;
      B._depthLastStandUsed = down;
      B.playerTeam().forEach(t => {
        B.energy(t, lastStand * 12);
        B.shield(u, t, t.max.hp * .10 * lastStand, 8);
      });
    }));
    const sweep = C('clean_sweep');
    if (sweep) allies.forEach(u => B.on(u, 'enemyDown', down => {
      if (B._depthSweepEvent === down) return;
      B._depthSweepEvent = down;
      B.playerTeam().forEach(t => {
        B.energy(t, sweep * 4);
        B.applyStatus(u, t, 'atkup', 5, { stacks: sweep });
      });
    }));
    if (this.cardCount()) B.log(`<b>Depth Deck:</b> ${this.cardCount()} cards · ${sum(allies.map(u => this.trinketRanksFor(u)))} Trinket ranks resonating.`);
  },

  /* Enemy scaling is stretched across the full Depths journey. At Mastery
     800, Floor 121 is now roughly Lv 260-280, while Floor 1000 reaches about
     Lv 700 before the room/boss bump. The first twenty floors also blend in
     the active team's real power: rarity, gear, skills, and training can put
     a squad far ahead of its account-level cap, so a fixed Mastery-only curve
     would otherwise leave Floor 20 fighting tutorial-strength enemies. */
  enemyLevel(floor, node) {
    const currentRun = Save.data && Save.data.depth;
    if (currentRun && currentRun.dandyConsequence && currentRun.dandyConsequenceFloor === floor) return 100;
    const budStage = this.budStage(floor);
    if (budStage) {
      // These are coached level-1 lessons. Every Buds enemy uses the same
      // baseline so the tutorial teaches decisions, not hidden stat checks.
      return 1;
    }
    const cap = Save.data.mastery;
    const depth = Math.max(1, Number(floor) || 1);
    const journey = Math.pow(clamp(depth / 1000, 0, 1), .72);
    const endless = Math.sqrt(Math.max(0, depth - 1000)) * .002;
    const floorTerm = .18 + journey * .70 + endless;
    const roomRamp = 2 + Math.min(12, Math.sqrt(floor) * .35);
    const masteryBase = Math.round(cap * floorTerm + node * roomRamp);
    // Mastery should make a run's later floors matter, not let a high-account
    // player meet endgame levels in the onboarding stretch. This ceiling fades
    // out naturally by Floor 100 and is already above the normal curve around
    // the point where the Depths should become genuinely demanding.
    const earlyCeiling = depth < 100
      ? Math.round(14 + depth * 2 + Math.sqrt(Math.max(0, cap)) * .9 + node * roomRamp)
      : Infinity;
    const base = Math.min(masteryBase, earlyCeiling);
    const team = (Save.data && Array.isArray(Save.data.team) ? Save.data.team : [])
      .filter(id => id && Save.hero(id));
    const teamPower = team.length && typeof Progress !== 'undefined' && Progress.teamPower
      ? Progress.teamPower(team) : 0;
    if (!teamPower) return clamp(base, 1, 4000);

    // Progress.recommendedPower() treats 400 power as roughly one level of
    // encounter pressure. Use that same readable unit, but only blend gently
    // toward it after the early climb. The old .80 pressure value treated a
    // strong five-Hero roster's total power as a near-direct floor level,
    // which could turn Floor 24 into a level-130 encounter. Floor progression
    // stays in charge; team power now nudges the curve instead of replacing it.
    const powerLevel = teamPower / 400;
    const pressure = .36 + Math.min(.18, depth / 1000);
    const teamTarget = Math.round(powerLevel * pressure + node * roomRamp);
    const floorGate = clamp((depth - 8) / 28, 0, 1);
    const adaptive = Math.round(base + (teamTarget - base) * floorGate);
    const level = Math.max(base, adaptive);
    return clamp(Math.min(level, earlyCeiling), 1, 4000);
  },

  /** The first boss is an introduction to boss mechanics, not an endgame
      stat check. Keep later boss floors on the normal curve, but let Floor 5
      follow the actual team's level so a fresh roster is not asked to defeat
      a level-20 Red 20 wall before it has unlocked its core skills. */
  bossProfile(floor, baseLevel) {
    const standardLevel = Math.max(1, Math.round(baseLevel * 1.15));
    if (floor > 30) {
      return {
        level: standardLevel, stars: 5, rarityPlus: null,
        mult: null, addLevel: .90, trashLevel: .95, addCount: 3, trashCount: 1
      };
    }

    // Early boss rooms are progression checks, not endgame rarity checks. A
    // Lethal identity such as Dandy used to keep the full boss 2.40x HP layer
    // and Red/Rainbow stat weight on Floor 20-30, while the dossier correctly
    // advertised only the floor's readable ~26k power target. That produced
    // encounters which looked literally invincible. Ramp the boss from the
    // tutorial profile into the normal curve over these first thirty floors.
    if (floor > 5) {
      const ramp = clamp((floor - 6) / 24, 0, 1);
      return {
        level: Math.min(standardLevel, Math.round(18 + floor * 1.55)),
        stars: 3 + Math.round(ramp * 2),
        rarity: 4,
        rarityPlus: Math.round(5 + ramp * 7),
        mult: {
          hp: 1.35 + ramp * .20,
          atk: .84 + ramp * .12,
          def: 1.04 + ramp * .10
        },
        addLevel: .78, trashLevel: .82, addCount: 2, trashCount: 0
      };
    }

    const team = (Save.data && Array.isArray(Save.data.team) ? Save.data.team : [])
      .map(id => Save.hero(id))
      .filter(Boolean);
    const averageLevel = team.length
      ? sum(team.map(hero => Math.max(1, Number(hero.level) || 1))) / team.length
      : 1;
    const beginnerCap = Math.max(5, Math.round(averageLevel * 1.8 + 2));

    return {
      level: Math.min(standardLevel, beginnerCap),
      // Red rarity still unlocks Vee's complete boss kit, but a lower rank and
      // star count prevent the first boss from inheriting endgame stat weight.
      stars: 3, rarityPlus: 5,
      mult: { hp: 1.35, atk: .82, def: 1.05 },
      addLevel: .70, trashLevel: .75, addCount: 2, trashCount: 0
    };
  },

  /** Deep enemies gain strength from the level shown in the scan and from the
      equipment shown on their cards. Do not hide extra floor multipliers here. */
  harden(spec, floor, rng) {
    equipEnemyLoadout(spec, floor, rng);
    return spec;
  },

  /* The Ichor Mirror copies the strongest Hero actually taking part in the
     run. Collaboration visitors do not have Twisted forms, so an all-collab
     squad needs a deterministic, valid fallback instead of a null enemy. */
  mirrorTarget() {
    const team = (Save.data && Array.isArray(Save.data.team) ? Save.data.team : [])
      .filter(id => id && HEROES[id] && !HEROES[id].twistedOnly);
    const eligible = team.filter(id => TWISTED_IDS.includes(id));
    const ids = eligible.length ? eligible : ['Dandy'];
    return ids.slice().sort((a, b) => Progress.power(b) - Progress.power(a))[0] || 'Dandy';
  },

  makeMirrorEnemy(floor, node) {
    const r = this.run();
    const rng = seeded(`depth-mirror:${r.seed}:${floor}:${node}`);
    const level = this.enemyLevel(floor, node);
    const id = this.mirrorTarget();
    return this.harden(makeTwisted(id, level + 4, 'elite'), floor, rng);
  },

  makeEnemies(floor, node, type) {
    // The encounter is rolled from the run seed so the pre-battle scan is an
    // honest preview of the exact squad that appears after pressing Deploy.
    const r = this.run();
    const rng = seeded(`depth-encounter:${r.seed}:${floor}:${node}:${type}`);
    const lv = this.enemyLevel(floor, node);
    const budStage = this.budStage(floor);
    const normalizeBudsEnemy = spec => {
      if (!budStage || !spec) return spec;
      Object.assign(spec, {
        level: 1, stars: 1, rarity: 1, rarityPlus: 1, skillLv: 1,
        classRank: 0, subclassRank: 0, classRank2: 0, subclassRank2: 0,
        noTraining: true,
        trinkets: [], badge: null
      });
      return spec;
    };
    if (r.dandyConsequence && r.dandyConsequenceFloor === floor) {
      return [this.harden(makeTwisted('Dandy', 100, 'boss'), floor, rng)];
    }
    // An elite room previews what is coming: it draws from four floors deeper,
    // which is what makes it the gate rather than just a longer normal room.
    const pool = twistedPool(type === 'battle' ? floor : floor + 4);
    if (type === 'boss') {
      const b = bossForFloor(floor) || BOSSES[0];
      const profile = this.bossProfile(floor, lv);
      const extra = { stars: profile.stars };
      if (profile.rarity != null) extra.rarity = profile.rarity;
      if (profile.rarityPlus != null) extra.rarityPlus = profile.rarityPlus;
      const spec = this.harden(makeTwisted(b.id, profile.level, 'boss', extra), floor, rng);
      if (profile.mult) spec.mult = Object.assign({}, spec.mult, profile.mult);
      spec.boss = b; spec.name = 'Twisted ' + HEROES[b.id].name;
      // Later bosses bring three real Twisteds and a bit of trash. The first
      // boss uses a smaller, lower-level squad so the player can learn the
      // phase pattern without being buried under a full endgame formation.
      const adds = this.compose(rng, pool.filter(x => x !== b.id), profile.addCount, floor)
        .map(id => this.harden(makeTwisted(id, Math.max(1, Math.round(profile.level * profile.addLevel)), 'normal'), floor, rng));
      const trash = rng.shuffle(WEAKLING_IDS).slice(0, profile.trashCount)
        .map(id => this.harden(makeWeakling(id, Math.max(1, Math.round(profile.level * profile.trashLevel))), floor, rng));
      return [spec].concat(adds, trash);
    }
    // A brand new roster (2 Heroes now, not 5) shouldn't get outnumbered
    // 2-to-5 on Floor 1 - room size ramps up with however many Heroes are
    // actually on the team until the roster catches up to full size.
    const teamSize = clamp((Save.data && Save.data.team.filter(Boolean).length) || 5, 1, 5);
    const full = type === 'elite' ? 5 : rng.i(4, 5);
    // Dandy's Buds never outnumbers its tiny tutorial party. The purpose is
    // to learn recovery and formation, not to focus-fire Boxten off-screen.
    const n = budStage ? (budStage === 1 ? 2 : 3) : floor <= 6 ? Math.min(full, teamSize + 1) : full;
    const kind = type === 'elite' ? 'elite' : 'normal';
    // elites lean on the genuinely dangerous Twisteds
    const elites = ELITE_TWISTED.filter(id => pool.includes(id));
    const bias = type === 'elite' && elites.length >= n ? elites : pool;

    // Most of a normal room is trash; elites stay pure Twisted so the room that
    // gates a floor is still the one that demands a real team.
    const share = type === 'elite' ? 0 : weaklingShare(floor);
    let weak = Math.round(n * share);
    weak = clamp(weak, 0, n - 1);        // never an all-weakling room
    const twistedN = n - weak;

    const tIds = this.compose(rng, bias, twistedN, floor);
    const wIds = rng.shuffle(WEAKLING_IDS).slice(0, weak);

    const foes = tIds.map((id, i) => normalizeBudsEnemy(this.harden(makeTwisted(id, lv + (i === 0 ? 4 : 0), kind), floor, rng)));
    wIds.forEach(id => foes.push(normalizeBudsEnemy(this.harden(makeWeakling(id, lv), floor, rng))));
    return foes;
  },

  /* Enemy squads need a shape. A shallow room stacked with tanks and healers is
     unbreakable for a kit that has not unlocked its Blue skill yet, so early
     floors cap the number of sustain units. On top of that, obtainment rarity
     weights which Twisteds actually show up: Commons are frequent early and
     fade out, Main Character / Lethal forms are rare near their debut floor
     and become the norm the deeper the run goes. */
  compose(rng, pool, n, floor) {
    // Encounter difficulty should come from stronger, visible enemies rather
    // than randomly rolling a five-slot wall. Two sustain slots is the hard
    // limit; the remaining slots must create offensive pressure.
    const maxSustain = floor <= 2 ? 1 : 2;
    const isSustain = id => HEROES[id].role === 'Tank' || HEROES[id].role === 'Support';
    const remaining = pool.slice();
    const out = [];
    let sustain = 0;
    while (out.length < n && remaining.length) {
      const capped = remaining.filter(id => !(isSustain(id) && sustain >= maxSustain));
      const list = capped.length ? capped : remaining;   // never stall if everything left is capped
      const weights = list.map(id => twistedRankWeight(id, floor));
      let roll = rng.f() * sum(weights);
      let i = 0;
      for (; i < list.length - 1; i++) { roll -= weights[i]; if (roll <= 0) break; }
      const id = list[i];
      out.push(id);
      if (isSustain(id)) sustain++;
      remaining.splice(remaining.indexOf(id), 1);
    }
    return out;
  },

  teamSpecs() {
    const r = this.run();
    return Save.data.team.filter(Boolean).map(id => {
      const s = playerSpec(id);
      s.carryHp = r.hp[id];
      return s;
    });
  },

  rewards(floor, node, type, win) {
    if (!win) return {};
    const rng = this.roomRng(floor, node, `reward-${type}`);
    const m = 1 + floor * .22 + node * .05;
    const k = type === 'boss' ? 4.5 : type === 'elite' ? 2.1 : 1;
    const out = {
      ichor: Math.round(500 * m * k * this.endgameIchorMult(floor)),
      exp: Math.round(350 * m * k),
      tape: Math.round((2 + floor * .3) * k),
      notes: Math.round((3 + floor * .25) * k),
      star: Math.round((6 + floor * .8) * k),
      gold: type === 'boss' ? 3 : type === 'elite' ? 1 : (rng.chance(.32) ? 1 : 0),
      diamond: type === 'boss' ? 1 : (rng.chance(.09) ? 1 : 0),
      main: floor >= 20 && (type === 'boss' ? 1 : rng.chance(.025)) ? 1 : 0,
      // Rarity upgrades consume cores at every rank, so Endless needs a
      // dependable core stream rather than a rare jackpot. Every combat gives
      // a baseline core; elites and bosses add extra cores, and deeper floors
      // have a chance to push the bundle one higher.
      core: type === 'boss'
        ? 3 + Math.floor(floor / 10)
        : type === 'elite'
          ? 2 + Math.floor(floor / 12) + (rng.chance(.35 + Math.min(.25, floor * .01)) ? 1 : 0)
          : 1 + (rng.chance(.30 + Math.min(.30, floor * .012)) ? 1 : 0),
      tape: type === 'boss' ? 2 : (rng.chance(.12) ? 1 : 0),
      manual: type === 'boss' ? 9 : type === 'elite' ? 4 : 1,
      counterToken: 1
    };
    const bonus = 1 + this.cardStack('bargain_tag') * .12 + this.cardStack('elevator_pass') * .08 + this.cardStack('ichor_finder') * .10;
    Object.keys(out).forEach(k2 => { if (out[k2]) out[k2] = Math.max(1, Math.round(out[k2] * bonus)); });
    return masteryRewardBundle(out);
  },

  /* Early progression should respond to the player's actual session length.
     A flat battle-Mastery reward made a 24-win day take almost the same
     number of calendar days as a 6-win day, even though the player was doing
     four times the work. This momentum is intentionally limited to the
     onboarding climb to Mastery 55; after that, the regular room rewards
     resume so Endless does not become an infinite Mastery faucet.

     Daily.orderState().wins is read before payoutBattle records the current
     win, so the brackets below describe the win being paid out. */
  earlyMasteryReward(type) {
    const old = type === 'boss' ? 220 : type === 'elite' ? 110 : 60;
    if (Save.data.mastery >= 55 || typeof Daily === 'undefined') return old;
    const wins = Daily.orderState().wins + 1;
    const base = wins <= 6 ? 360 : wins <= 12 ? 850 : 700;
    // Room difficulty still matters, but session momentum is the larger
    // factor for a brand-new account. This keeps the target readable rather
    // than making one lucky boss floor determine the whole timetable.
    const roomBonus = type === 'boss' ? 1.25 : type === 'elite' ? 1.10 : 1;
    return Math.round(base * roomBonus);
  },

  /* A floor clear is the moment an entire sector is secured, so it pays a
     dedicated cache on top of the final room's battle loot. */
  clearRewards(floor) {
    const bossFloor = floor % 5 === 0;
    const out = {
      ichor: Math.round((1900 + floor * 520) * this.endgameIchorMult(floor)),
      exp: 1000 + floor * 340,
      tape: 10 + Math.ceil(floor * 1.4),
      notes: 12 + Math.ceil(floor * .9),
      star: 30 + floor * 5,
      // A cleared floor should fund the next round of rarity upgrades even if
      // its individual rooms were unlucky: two cores at the start, then one
      // more every five floors.
      core: 2 + Math.floor(Math.max(0, floor - 1) / 5),
      manual: 3 + floor,
      gold: bossFloor ? 3 : 1,
      tape: bossFloor ? 3 : 1,
      counterToken: 1
    };
    // Apex caches are reliable progression, not another low-odds post-boss roll.
    // Boss caches also issue an express pass. It only skips ahead once, so
    // clearing bosses remains the fastest way to build a deep run.
    if (bossFloor) { out.diamond = 1; out.core += 2; out.elevatorTicket = 1; }
    if (bossFloor && floor >= 20) out.main = 1;
    const bonus = 1 + this.cardStack('ichor_finder') * .10;
    Object.keys(out).forEach(k => { if (out[k]) out[k] = Math.max(1, Math.round(out[k] * bonus)); });
    return masteryRewardBundle(out);
  },

  /** The "grinding and defeating Twisteds" half of the trinket loop: every
      distinct Twisted defeated in a won battle has a chance to drop a fresh
      Trinket copy - toward its own Hero's trinket if one is curated,
      otherwise a generic one. */
  trinketDrops(battle, options) {
    const seen = new Set(); const got = [];
    const masteryBonus = Math.min(.28, Math.sqrt(Math.max(0, (Number(Save.data.mastery) || 1) - 1)) / 100);
    const dropBonus = this.cardStack('bargain_tag') * .08 + masteryBonus + Math.max(0, Number(options && options.bonus) || 0);
    const floor = options && options.floor != null ? options.floor : this.run().floor;
    const node = options && options.node != null ? options.node : this.run().node;
    const type = options && options.type || 'battle';
    const encounterRank = type === 'boss' ? 1 : type === 'elite' ? (floor >= 24 ? 1 : 0) : 0;
    const depthRank = Math.floor(Math.max(0, floor - 40) / 45);
    const dropRank = clamp(1 + encounterRank + depthRank, 1, TRINKET_MAX_RANK);
    const rng = this.roomRng(floor, node, `drops-${type}`);
    battle.units.filter(u => u.team === TEAM_E && u.twisted && !u.weakling).forEach(u => {
      if (seen.has(u.id)) return; seen.add(u.id);
      const owned = trinketsForOwner(u.id);
      if (owned.length && rng.chance(.35 + dropBonus)) {
        const tid = owned[0];
        got.push({ id: tid, rank: dropRank, res: Save.addTrinketCopy(tid, dropRank) });
      } else if (rng.chance(.20 + dropBonus)) {
        const generic = TRINKET_IDS.filter(k => !TRINKETS[k].owner);
        const tid = rng.pick(generic);
        got.push({ id: tid, rank: dropRank, res: Save.addTrinketCopy(tid, dropRank) });
      }
    });
    got.forEach(g => {
      if (g.res === 'new') { UI.toast('🔧 ' + TRINKETS[g.id].name + ' · Rank ' + g.rank + ' unlocked!'); Sound.play('get_rare'); }
    });
    return got;
  },

  /** Carry damage between nodes: this is what makes a floor a run, not five fights. */
  storeHp(battle) {
    const r = this.run();
    const recovery = this.cardStack('ichor_siphon') * .04 + this.cardStack('patch_job') * .05;
    battle.units.filter(u => u.team === TEAM_P && !u.minion).forEach(u => {
      r.hp[u.id] = u.alive ? clamp(u.hpPct + recovery, .15, 1) : 0;
    });
    Save.write();
  },
  healRun(pct) {
    const r = this.run();
    Save.data.team.forEach(id => { if (id) r.hp[id] = clamp((r.hp[id] == null ? 1 : r.hp[id]) + pct, 0, 1); });
    Save.write();
  },
  hurtRun(pct) {
    const r = this.run();
    Save.data.team.forEach(id => { if (id) r.hp[id] = clamp((r.hp[id] == null ? 1 : r.hp[id]) - pct, .1, 1); });
    Save.write();
  },
  reviveOne(pct) {
    const r = this.run();
    const down = Save.data.team.find(id => id && r.hp[id] === 0);
    if (down) { r.hp[down] = pct == null ? .5 : pct; Save.write(); UI.toast('💚 ' + HEROES[down].name + ' is back up'); }
  },

  /** Ichor cost to skip N floors from wherever the run currently sits -
      spending resources instead of manually clearing floors that pose no
      real threat any more. Costs climb with both the floor you're at and
      how many you're skipping at once, so it's a real trade against just
      fighting them (which pays out its own Ichor) rather than a free win. */
  skipCost(fromFloor, n) {
    let total = 0;
    for (let i = 0; i < n; i++) total += Math.round((fromFloor + i) * 360 + i * 60);
    return total;
  },
  /** A one-time catch-up assist for teams that are dramatically below the
      current floor's guidance target. It covers ten skipped floors, rather
      than ten button presses, and is intentionally not offered during Buds. */
  freeSkipInfo() {
    const r = this.run();
    const stored = clamp(Math.floor(Number(r.freeSkipFloors) || 0), 0, 10);
    if (this.budStage(r.floor)) return { remaining: 0, active: false };
    if (stored > 0) return { remaining: stored, active: true };
    if (r.freeSkipOfferUsed) return { remaining: 0, active: false };
    const team = Save.data.team.filter(Boolean);
    const teamPower = Progress.teamPower(team);
    const recommendedPower = Progress.recommendedPower(this.enemyLevel(r.floor, 0));
    const active = team.length > 0 && teamPower < recommendedPower * .60;
    return { remaining: active ? 10 : 0, active, teamPower, recommendedPower };
  },
  skipCharge(n) {
    const r = this.run(), info = this.freeSkipInfo();
    return info.remaining >= n ? 0 : this.skipCost(r.floor, n);
  },
  /** Guards against buying your way into a softlock: a fresh team spending
      every spare Ichor on skips could otherwise land many floors past
      anything it can survive, with no way back except abandoning the run.
      Generous on purpose - this only blocks skips that are clearly reckless
      (your average level under half of what that floor actually expects),
      not ones that are merely risky. */
  skipPowerReady(targetFloor, n) {
    const team = Save.data.team.filter(Boolean);
    if (!team.length) return false;
    const avgLevel = sum(team.map(id => Save.hero(id).level)) / team.length;
    const avgStars = team.reduce((s, id) => s + (Save.hero(id).stars || 0), 0) / team.length;
    // Threshold scales with how far you're skipping: min 65% at n=1, up to 90% cap
    const threshold = Math.min(0.90, 0.65 + (n || 1) * 0.025);
    return avgLevel >= this.enemyLevel(targetFloor, 0) * threshold && avgStars >= 2;
  },
  canSkip(n) {
    const r = this.run();
    const info = this.freeSkipInfo();
    const powerReady = info.remaining >= n || this.skipPowerReady(r.floor + n, n);
    return Save.can({ ichor: this.skipCharge(n) }) && powerReady;
  },
  /** Human-readable reason a skip is blocked, or null if it's allowed - lets
      the UI explain "why" instead of just greying the button out. */
  skipBlockReason(n) {
    const r = this.run();
    if (this.budStage(r.floor)) return 'Dandy wants you to clear this lesson room by room.';
    const free = this.freeSkipInfo();
    const target = r.floor + n;
    if (free.remaining < n && !this.skipPowerReady(target, n)) {
      const team = Save.data.team.filter(Boolean);
      const avgStars = team.length ? team.reduce((s, id) => s + (Save.hero(id).stars || 0), 0) / team.length : 0;
      if (avgStars < 2) return `Your heroes need at least 2 stars on average before skipping floors.`;
      return `Your team's too under-leveled for Floor ${target}. Level up more before skipping this far.`;
    }
    if (!Save.can({ ichor: this.skipCharge(n) })) return 'Not enough Ichor.';
    return null;
  },
  skippedBossFloors(fromFloor, n) {
    const floors = [];
    for (let floor = fromFloor; floor < fromFloor + n; floor++) {
      if (floor > 0 && floor % 5 === 0) floors.push(floor);
    }
    return floors;
  },
  skipRewardText(fromFloor, n) {
    const bosses = this.skippedBossFloors(fromFloor, n);
    return bosses.length
      ? 'Skipped rooms give no individual loot. Boss Floor rewards are included.'
      : 'Skipped rooms give no individual loot. Boss Floor rewards are paid when a skip crosses one.';
  },
  skipBossPayout(fromFloor, n) {
    const bosses = this.skippedBossFloors(fromFloor, n);
    const rewards = {};
    bosses.forEach(floor => {
      Object.entries(this.clearRewards(floor)).forEach(([key, amount]) => {
        rewards[key] = (rewards[key] || 0) + amount;
      });
    });
    return { bosses, rewards, pass: bosses.length * 120 };
  },
  elevatorTicketBlockReason() {
    const r = this.run();
    const n = 5;
    if (this.budStage(r.floor)) return 'Dandy wants you to clear this lesson room by room.';
    const target = r.floor + n;
    if (!this.skipPowerReady(target, n)) {
      const team = Save.data.team.filter(Boolean);
      const avgStars = team.length ? team.reduce((s, id) => s + (Save.hero(id).stars || 0), 0) / team.length : 0;
      if (avgStars < 2) return `Your heroes need at least 2 stars on average before using an Elevator Ticket.`;
      return `Your team's too under-leveled for Floor ${target}. Level up more before using an Elevator Ticket.`;
    }
    if (!Save.can({ elevatorTicket: 1 })) return 'No Elevator Tickets. Clear a boss floor to earn one.';
    return null;
  },
  applySkip(n) {
    const r = this.run();
    const fromFloor = r.floor;
    const payout = this.skipBossPayout(fromFloor, n);
    if (payout.bosses.length) {
      Save.give(payout.rewards, true);
      Pass.addXp(payout.pass);
      UI.toast('🏆 ' + payout.bosses.length + ' Boss Floor cache' + (payout.bosses.length === 1 ? '' : 's') + ' collected');
    }
    r.floor += n; r.node = 0; r.hp = {}; r.forceElite = false;
    r.layoutData = null; // force a fresh layout roll for the floor landed on
    if (r.floor - 1 > Save.data.bestFloor) Save.data.bestFloor = r.floor - 1;
    const drafts = Math.max(1, Math.ceil(n / 5));
    r.pendingDraft = (r.pendingDraft || 0) + drafts;
    for (let i = 0; i < drafts; i++) (r.draftReasons || (r.draftReasons = [])).push('floor');
    Save.write();
    return true;
  },
  /** Skips straight to the start of Floor (current + n), same as clearing
      every node along the way: team gets patched back up, Deepest Cleared
      moves with it, but there's no combat so there's no combat loot - the
      point is skipping the grind, not farming it for free. */
  skipAhead(n) {
    const r = this.run();
    if (this.budStage(r.floor)) return false;
    const free = this.freeSkipInfo();
    const cost = this.skipCharge(n);
    if (!Save.can({ ichor: cost }) || (free.remaining < n && !this.skipPowerReady(r.floor + n, n))) return false;
    if (cost) Save.spend({ ichor: cost });
    if (free.remaining >= n) {
      r.freeSkipOfferUsed = true;
      r.freeSkipFloors = Math.max(0, free.remaining - n);
    }
    return this.applySkip(n);
  },
  skipWithElevatortape() {
    const blocked = this.elevatorTicketBlockReason();
    if (blocked) return false;
    Save.spend({ elevatorTicket: 1 });
    return this.applySkip(5);
  },

  /** Returns true when this call actually finished a floor (not just a
      node), so the caller can decide whether it's worth rolling for a
      between-floors banter scene. */
  advance(win) {
    const r = this.run();
    const L = this.layout();
    if (!win) return false;
    r.node++;
    let floorCleared = false;
    if (r.node >= L.nodes.length) {
      const cleared = r.floor;
      r.node = 0; r.floor++;
      // Clearing a floor only gives a small elevator breather. Carried wounds
      // remain relevant across the whole run instead of disappearing every six rooms.
      Save.data.team.forEach(id => {
        if (!id || r.hp[id] === 0) return;
        r.hp[id] = clamp((r.hp[id] == null ? 1 : r.hp[id]) + .15, 0, 1);
      });
      if (r.floor - 1 > Save.data.bestFloor) Save.data.bestFloor = r.floor - 1;
      UI.toast('🏁 FLOOR ' + cleared + ' SECURED · Cache collected · +120 Pass XP');
      Pass.addXp(120);
      Achievements.record('floorClear', 1);
      floorCleared = true;
      // The tutorial introduces rooms and team growth first. Deck drafts
      // resume immediately after its third-floor graduation.
      if (!this.budStage(cleared)) this.queueDraft(cleared % 5 === 0 ? 'boss' : 'floor');
    }
    Save.write();
    return floorCleared;
  },

  /* ---------- event helpers exposed to EVENTS ---------- */
  api() {
    const r = this.run();
    const rng = this.roomRng(r.floor, r.node, 'event');
    return {
      give: g => Save.give(masteryRewardBundle(g)),
      healRun: p => this.healRun(p),
      hurtRun: p => this.hurtRun(p),
      reviveOne: p => this.reviveOne(p),
      scout: n => { this.run().scouted = Math.max(this.run().scouted || 0, n || 0); Save.write(); },
      queueDraft: reason => this.queueDraft(reason || 'event'),
      passXp: n => Pass.addXp(n),
      upgradeRandom: () => {
        const ids = Save.ownedIds().filter(id => Progress.canLevel(id));
        if (!ids.length) return null;
        const id = rng.pick(ids); Save.hero(id).level++; Save.write();
        return HEROES[id].name;
      },
      giveRandomShards: n => {
        const ids = Save.ownedIds().filter(id => Save.hero(id).stars < 5);
        if (!ids.length) return 'No one';
        const id = rng.pick(ids); Save.giveShards(id, n);
        return HEROES[id].name;
      },
      chance: p => rng.chance(p),
      pick: list => rng.pick(list)
    };
  }
};

/* ============================================================ BANTER */
/* Between-floor dialogue scenes (BANTER, data/banter.js). A scene only ever
   fires when its exact cast is on the current team - no substitutes, no
   partial matches - so it stays a nice surprise for the specific pairing
   it was written for instead of firing constantly for anyone in the
   ballpark. Not every floor clear rolls one, and the same scene won't
   repeat back-to-back. */
const Banter = {
  CHANCE: .35,
  eligible() {
    const team = Save.data.team.filter(Boolean);
    return BANTER.filter(b => b.cast.every(id => team.includes(id)));
  },
  /** Picks one eligible scene to show, or null if nothing fires this time -
      call after a floor genuinely clears (see Depths.advance()'s return). */
  rollFor() {
    const pool = this.eligible();
    if (!pool.length || !chance(this.CHANCE)) return null;
    const last = Save.data.seen.lastBanter;
    const pick2 = pool.length > 1 ? pool.filter(b => b.id !== last) : pool;
    const scene = pick(pick2.length ? pick2 : pool);
    Save.data.seen.lastBanter = scene.id;
    Save.write();
    return scene;
  }
};

/* ============================================================ FRIENDSHIP CAMPAIGNS */
/* Short story mode per Hero+friend pair (data/campaigns.js). Both primary
   partners must be recruited to open the story. Extra story guests can still
   be absent; each absent guest leaves that campaign party one slot short. */
const Campaign = {
  list() { return Object.values(CAMPAIGNS); },
  unlocked(c) { return !!c && Save.owns(c.a) && Save.owns(c.b); },
  requiredIds(camp) {
    return [...new Set([camp && camp.a, camp && camp.b, ...(camp && Array.isArray(camp.guests) ? camp.guests : [])]
      .filter(id => id && HEROES[id]))];
  },
  team(camp, team) {
    const required = this.requiredIds(camp);
    const ownedRequired = required.filter(id => Save.owns(id));
    const free = (team || []).filter((id, i, list) => id && Save.owns(id) && !required.includes(id) && list.indexOf(id) === i);
    // Every story-present character owns a formation slot. An absent guest
    // leaves that slot empty; owning the guest locks them into the story team.
    const partySize = Math.max(1, 5 - required.filter(id => !Save.owns(id)).length);
    return ownedRequired.slice(0, partySize).concat(free.slice(0, Math.max(0, partySize - ownedRequired.length)));
  },
  ownedTeam(camp, team) { return this.team(camp, team); },
  teamSpecs(camp, team) {
    return this.team(camp, team).map(id => playerSpec(id));
  },

  /** A loose, randomized enemy squad around the campaign's recommended level -
      not floor-locked, since a campaign can be played the moment its two
      Heroes are owned. */
  foes(camp, stageIdx) {
    const rng = liveRng();
    const lvl = Math.max(1, Math.round(camp.recLevel * (0.75 + rng.f() * 0.6)));
    const pseudoFloor = clamp(Math.round(lvl / 3), 1, 200);
    const pool = twistedPool(pseudoFloor);
    const n = clamp(3 + Math.floor(stageIdx / 2), 3, 5);
    const ids = Depths.compose(rng, pool, Math.min(n, pool.length), pseudoFloor);
    const kind = stageIdx === camp.stages.length - 1 ? 'elite' : 'normal';
    return ids.map((id, i) => equipEnemyLoadout(
      makeTwisted(id, lvl, kind), pseudoFloor, seeded(`campaign-loadout:${camp.id}:${stageIdx}:${i}`), {
        trinketCount: stageIdx >= camp.stages.length - 2 ? 2 : 1,
        rank: clamp(1 + Math.floor(pseudoFloor / 28), 1, TRINKET_MAX_RANK),
        badgeChance: stageIdx === camp.stages.length - 1 ? .7 : .2,
        badgeLvl: clamp(1 + Math.floor(stageIdx / 3), 1, BADGE_MAX_LVL)
      }
    ));
  },

  /** The featured pair is the hard story gate; guests only reserve party slots. */
  requirementMet(camp) { return this.unlocked(camp); },

  start(campId, stageIdx, team, onDone) {
    const camp = CAMPAIGNS[campId];
    if (!camp || !this.unlocked(camp)) return;
    const deployed = this.team(camp, team);
    const stage = camp.stages[stageIdx];
    const foes = this.foes(camp, stageIdx);
    BattleScreen.launch({
      team: this.teamSpecs(camp, deployed),
      foes,
      meta: {
        title: camp.title + ' · ' + stage.name,
        floorLabel: 'Friendship: ' + stage.name,
        roomIdx: stageIdx + 1, roomTotal: camp.stages.length,
        bg: bgForFloor(Math.max(1, Math.round(camp.recLevel / 4)), 0)
      },
      postBanter: {
        id: campId + '-' + stageIdx, title: stage.name,
        label: `Chapter ${stageIdx + 1} cleared`, cast: stage.cast || [camp.a, camp.b], guests: stage.guests || camp.guests || [],
        lines: stage.lines, post: true
      },
      rewards: () => masteryRewardBundle({ ichor: 300 + camp.recLevel * 8, exp: 250 + camp.recLevel * 6 }),
      onDone: (res) => {
        if (res.win) {
          const wasDone = Save.campaignDone(campId);
          payoutBattle(this.ownedTeam(camp, deployed), masteryRewardBundle({ ichor: 300 + camp.recLevel * 8, exp: 250 + camp.recLevel * 6 }),
            { mastery: 80, pass: 30 });
          /* Cleared chapters are replayable from the new story path. A replay
             still pays battle rewards, but only the current next chapter may
             move campaign progress forward. */
          if (Save.campaignStage(campId) === stageIdx) Save.advanceCampaign(campId);
          if (!wasDone && Save.campaignDone(campId)) UI.toast('🤝 Friendship Badge earned: ' + BADGES[camp.badge].name);
        }
        onDone(res);
      }
    });
  }
};

/* ============================================================ ARENA */
/* Simulated ladder. Generated bots and saved player defenses share the daily
   lineup; bot opponents never contain duplicate heroes. */
const Arena = {
  TEAM_VERSION: 9,
  liveDefenses: [],
  liveDefenseSignature: '',
  // Arena uses a subjective roster read rather than copying the authored
  // combat tier. This keeps the ladder feeling like a set of personalities and
  // team identities, while the actual battle stats still come from HEROES.
  PERSONAL_TIERS: {
    SS: ['Dandy', 'Pebble', 'Scraps', 'Astro', 'Connie', 'Cocoa', 'Flutter', 'Rudie', 'Delilah', 'Dyle', 'Sprout', 'BigWig'],
    S: ['Shelly', 'Brusha', 'Waxwell', 'Gigi', 'Glisten', 'Teagan', 'Toodles', 'Yatta', 'Riku', 'Kairi', 'CheerbearShelly', 'BedtimeAstro', 'WishBearGigi', 'Tisha'],
    A: ['Vee', 'Cosmo', 'Ginger', 'Bassie', 'Blot', 'Flyte', 'Eclipse', 'Soulvester', 'Goofy', 'Sora', 'Phantasia', 'Finn', 'Squirm', 'GladHander', 'LegalEagle', 'RobberBaron', 'PencilPusher'],
    B: ['Bobette', 'Brightney', 'Coal', 'Looey', 'Poppy', 'Ribecca', 'Gourdy', 'Eggson', 'RnD'],
    C: ['Rodger', 'Shrimpo', 'Boxten', 'Goob']
  },
  // Curated ladder cores keep the Arena readable and strategically distinct.
  // They also make the personal tier list visible instead of relying only on
  // random weighted picks to communicate the roster's strengths.
  CURATED_TEAMS: {
    balanced: ['Dandy', 'Cocoa', 'Scraps', 'Connie', 'Tisha'],
    wall: ['Pebble', 'Soulvester', 'Astro', 'Blot', 'BigWig'],
    rush: ['Rudie', 'Flutter', 'Eclipse', 'Yatta', 'Brusha'],
    lock: ['Waxwell', 'Glisten', 'Teagan', 'Shelly', 'Delilah'],
    whale: ['Dyle', 'Cocoa', 'Scraps', 'Astro', 'BigWig'],
    visitors: ['Riku', 'Sora', 'Kairi', 'Goofy', 'Phantasia']
  },
  ARCHETYPES: [
    { key: 'balanced', label: 'Balanced', tag: '', roles: ['Tank', 'Damage', 'Damage', 'Support', 'Control'] },
    { key: 'wall', label: 'Frontline', tag: 'tagC', roles: ['Tank', 'Tank', 'Support', 'Damage', 'Control'] },
    { key: 'rush', label: 'All In', tag: 'tagO', roles: ['Damage', 'Damage', 'Damage', 'Control', 'Support'] },
    { key: 'lock', label: 'Lockdown', tag: 'tagC', roles: ['Control', 'Control', 'Tank', 'Support', 'Damage'] },
    { key: 'whale', label: 'Overinvested', tag: 'tagW', roles: ['Tank', 'Damage', 'Damage', 'Support', 'Control'] },
    { key: 'visitors', label: 'Visiting Squad', tag: 'tagC', roles: ['Tank', 'Damage', 'Control', 'Support', 'Control'], prefer: 'collab', anchor: 'Sora' }
  ],
  // The first stretch of the ladder should look like a real early roster:
  // familiar Common Toons with partial kits, not collaboration visitors or a
  // fully geared endgame composition wearing a low-rank card.
  ROOKIE_ARCHETYPES: [
    { key: 'rookie', label: 'Neighborhood Crew', tag: '', rookie: true, roles: ['Tank', 'Damage', 'Damage', 'Support', 'Control'] },
    { key: 'practice', label: 'Practice Team', tag: '', rookie: true, roles: ['Tank', 'Damage', 'Support', 'Damage', 'Control'] },
    { key: 'starter', label: 'Starter Squad', tag: '', rookie: true, roles: ['Tank', 'Damage', 'Damage', 'Control', 'Support'] }
  ],
  NAMES: ['Aster', 'Marlow', 'Clover', 'Nico', 'June', 'Mina',
    'Theo', 'Parker', 'Reed', 'Sloane', 'Casey', 'Rory',
    'Quinn', 'Avery', 'Mika', 'Drew'],

  setLiveDefenses(defenses) {
    const next = (Array.isArray(defenses) ? defenses : []).map(defense => {
      const team = (defense && defense.team || []).filter(slot => slot && HEROES[slot.id]).slice(0, 5);
      if (!team.length) return null;
      return Object.assign({}, defense, { team });
    }).filter(Boolean);
    const signature = next.map(defense => `${defense.user_id || defense.username}:${defense.updated_at_ms || 0}:${defense.arena_rank || 2000}`).join('|');
    this.liveDefenses = next;
    if (signature === this.liveDefenseSignature) return false;
    this.liveDefenseSignature = signature;
    const a = Save.data && Save.data.arena;
    if (a && a.day === dayIndex()) {
      a.opponents = this.generate(a.day);
      Save.write();
      if (typeof Screens !== 'undefined' && Screens.cur === 'arena') Screens.render();
    }
    return true;
  },

  today() {
    const a = Save.data.arena, d = dayIndex(), resetCycle = Math.floor(d / 2);
    if (a.resetCycle !== resetCycle) {
      a.resetCycle = resetCycle;
      a.rank = 2000;
      a.day = -1;
      a.opponents = [];
      Save.write();
    }
    if (a.day !== d || a.teamVersion !== this.TEAM_VERSION) {
      a.day = d; a.teamVersion = this.TEAM_VERSION; a.opponents = this.generate(d); Save.write();
    }
    return a;
  },

  roleTags(id) {
    const d = HEROES[id] || {}, text = `${d.role || ''} ${d.roleLabel || ''}`.toLowerCase();
    const tags = [];
    if (/tank|frontline|shield/.test(text)) tags.push('tank');
    if (/damage|dps|attacker|bruiser/.test(text)) tags.push('damage');
    if (/support|healer|healing|rescue/.test(text)) tags.push('support');
    if (/control|disruption|formation/.test(text)) tags.push('control');
    return tags.length ? tags : ['damage'];
  },

  weightedPick(rng, ids, weight) {
    const weights = ids.map(id => Math.max(.01, weight(id)));
    let roll = rng.f() * sum(weights);
    for (let i = 0; i < ids.length; i++) { roll -= weights[i]; if (roll <= 0) return ids[i]; }
    return ids[ids.length - 1];
  },

  personalTier(id) {
    for (const tier of ['SS', 'S', 'A', 'B', 'C']) {
      if (this.PERSONAL_TIERS[tier].includes(id)) return tier;
    }
    return 'D';
  },

  rookieLadder() {
    // Rank counts down toward #1. A new account should meet this band at any
    // rank; established players meet it once they reach the low-rank ladder.
    return Save.data.mastery <= 100 || Save.data.arena.rank <= 1000;
  },

  rookieLevelCap(rank) {
    // Ranks 1-1000 resolve to a deliberately readable Level 10-100 range.
    // It makes the beginner band feel like actual developing rosters.
    return clamp(Math.round(10 + Math.min(1000, Math.max(1, rank)) * .09), 10, 100);
  },

  pickTeamHero(rng, pool, used, role, arch, appearances) {
    let candidates = pool.filter(id => !used.has(id) && this.roleTags(id).includes(role.toLowerCase()));
    if (arch.prefer === 'collab') {
      const visitors = candidates.filter(id => COLLAB_HERO_IDS.has(id));
      if (visitors.length) candidates = visitors;
    }
    if (!candidates.length) candidates = pool.filter(id => !used.has(id));
    if (!candidates.length) return null;
    const tierWeight = { SS: 1.30, S: 1.18, A: 1, B: .82, C: .65, D: .48 };
    return this.weightedPick(rng, candidates, id => {
      let w = arch.rookie ? 1 : (tierWeight[this.personalTier(id)] || 1);
      if (arch.rookie && STARTERS.includes(id)) w *= 3.1;
      if (arch.key === 'whale' && ['SS', 'S'].includes(this.personalTier(id))) w *= 1.45;
      if (arch.key === 'rush' && this.roleTags(id).includes('damage')) w *= 1.25;
      if (arch.prefer === 'collab') w *= COLLAB_HERO_IDS.has(id) ? 7 : .35;
      else if (COLLAB_HERO_IDS.has(id)) w *= 1.18;
      return w / (1 + (appearances[id] || 0) * 1.6);
    });
  },

  generate(day) {
    const a = Save.data.arena;
    const rookie = this.rookieLadder();
    const rookieCap = this.rookieLevelCap(a.rank);
    // Arena opponents must follow the squad actually entering the match, not
    // account Mastery. Mastery can be far ahead of a newly levelled team,
    // which previously produced level-100+ opponents for level-30 toons.
    const activeTeam = (Save.data.team || []).map(id => Save.hero(id)).filter(Boolean);
    const teamAverage = activeTeam.length
      ? sum(activeTeam.map(h => Math.max(1, Number(h.level) || 1))) / activeTeam.length : 1;
    const teamHighest = activeTeam.length
      ? Math.max(...activeTeam.map(h => Math.max(1, Number(h.level) || 1))) : 1;
    const ladderPressure = clamp((1000 - Math.min(1000, Math.max(1, a.rank))) / 250, 0, 4);
    const teamCap = Math.max(5, Math.round(Math.max(
      teamAverage * 1.12 + teamHighest * .10 + 3 + ladderPressure,
      teamAverage + 8 + ladderPressure
    )));
    // Account-new players still get the readable rookie band. Established
    // players are capped from their active squad, with a modest pressure
    // bump for climbing the ladder rather than a Mastery-based level jump.
    const cap = rookie
      ? Math.min(teamCap, Save.data.mastery <= 100 ? Math.min(rookieCap, Save.data.mastery) : rookieCap)
      : Math.min(800, teamCap);
    // Arena is a sparring service, not a live obtainment pool. Seasonal and
    // collab Heroes belong here year-round, which lets visitors like Sora
    // appear in normal ladder teams.
    const pool = (rookie ? PLAYABLE_IDS.filter(id => obtainKey(id) === 'Common') : PLAYABLE_IDS)
      .filter(id => HEROES[id] && !HEROES[id].twistedOnly);
    const out = [];
    const appearances = {};
    const rotation = seeded('arena-archetypes-' + day + '-' + Math.floor(a.rank / 100))
      .shuffle(rookie ? this.ROOKIE_ARCHETYPES : this.ARCHETYPES);
    for (let i = 0; i < 6; i++) {
      const rng = seeded('arena-' + day + '-' + i + '-' + Math.floor(a.rank / 100));
      const arch = rotation[i % rotation.length];
      const used = new Set();
      const curated = !rookie && this.CURATED_TEAMS[arch.key]
        ? this.CURATED_TEAMS[arch.key].filter(id => pool.includes(id))
        : [];
      const team = curated.length === 5 ? curated.slice() : [];
      let anchorUsed = false;
      if (!team.length) arch.roles.forEach(role => {
        const anchorFits = arch.anchor && !anchorUsed && !used.has(arch.anchor) && this.roleTags(arch.anchor).includes(role.toLowerCase());
        const id = anchorFits ? arch.anchor : this.pickTeamHero(rng, pool, used, role, arch, appearances);
        if (!id) return;
        if (id === arch.anchor) anchorUsed = true;
        used.add(id); team.push(id);
      });
      team.forEach(id => appearances[id] = (appearances[id] || 0) + 1);
      // Teams can still have a weak link, but the core now stays competitive
      // instead of rolling several near-empty roster slots.
      const coreLv = rookie ? Math.round(cap * (.54 + rng.f() * .30))
        : arch.key === 'whale' ? cap : Math.round(cap * (.68 + rng.f() * .24));
      const levels = team.map((id, j) => {
        const minLevel = rookie ? 1 : 5;
        if (arch.key === 'whale') return clamp(cap - rng.i(0, 6), minLevel, cap);
        if (!rookie && rng.chance(.12) && j > 0) return clamp(Math.round(coreLv * (.58 + rng.f() * .15)), minLevel, cap);
        return clamp(coreLv + rng.i(rookie ? -7 : -12, rookie ? 7 : 12), minLevel, cap);
      });
      out.push({
        name: rng.pick(this.NAMES) + (rng.chance(.4) ? rng.i(2, 99) : ''),
        arch: arch.key, label: arch.label, tag: arch.tag,
        team, levels,
        rank: clamp(a.rank + rng.i(-260, 180), 1, 99999), rookie,
        beaten: false
      });
    }
    const saved = seeded('arena-saved-defenses-' + day + '-' + Math.floor(a.rank / 100))
      .shuffle(this.liveDefenses.filter(defense => defense && Array.isArray(defense.team) && defense.team.length))
      .slice(0, Math.min(2, out.length));
    saved.forEach((defense, index) => {
      const team = defense.team.map(slot => slot.id).filter(Boolean).slice(0, 5);
      const levels = defense.team.slice(0, team.length).map(slot => clamp(Math.floor(Number(slot.level) || 1), 1, 1000));
      if (!team.length) return;
      out[(index * 3) % out.length] = {
        name: String(defense.username || 'Player'), arch: 'saved', label: 'Saved Player', tag: 'tagC',
        team, levels,
        rank: clamp(Math.floor(Number(defense.arena_rank) || 2000), 1, 99999),
        rookie: false, saved: true, savedDefense: defense, beaten: false
      };
    });
    return out.sort((x, y) => x.rank - y.rank);
  },

  specs(opp) {
    if (opp && opp.savedDefense && typeof ArenaLive !== 'undefined') return ArenaLive.snapshotSpecs(opp.savedDefense);
    return opp.team.map((id, i) => {
      const level = opp.levels[i];
      const spec = rivalSpec(id, level, {
        buildSeed: `${opp.name}-${i}`,
        mult: { hp: 1, atk: 1, def: 1 },
        rarity: opp.arch === 'whale' ? (level >= 220 ? 6 : 5) : clamp(1 + Math.floor(level / (opp.rookie ? 35 : 60)), 1, opp.rookie ? 3 : 6),
        stars: opp.arch === 'whale' ? 5 : clamp(1 + Math.floor(level / (opp.rookie ? 45 : 70)), 1, opp.rookie ? 3 : 5)
      });
      const rng = seeded(`arena-loadout:${opp.name}:${opp.rank}:${i}`);
      return equipEnemyLoadout(spec, Math.max(8, Math.round(level / 3)), rng, {
        trinketCount: opp.rookie ? 1 : opp.arch === 'whale' ? 2 : 1,
        rank: clamp(1 + Math.floor(level / 160), 1, TRINKET_MAX_RANK),
        badgeChance: opp.rookie ? 0 : opp.arch === 'whale' ? 1 : .55,
        badgeLvl: clamp(1 + Math.floor(level / 100), 1, BADGE_MAX_LVL)
      });
    });
  },

  rewards() {
    const ichor = Math.round(2700 * (1 + Math.min(3, Math.max(0, Save.data.mastery - 100) * .01)));
    const arenaCoin = Math.round(18 + Math.min(22, Save.data.mastery / 40));
    const core = 3 + Math.min(5, Math.floor(Math.max(0, Save.data.mastery - 20) / 80));
    const exp = Math.round(4800 + Save.data.mastery * 22);
    return { ichor, arenaCoin, exp, core, star: masteryRewardValue(90), tape: masteryRewardValue(1), manual: masteryRewardValue(6), diamond: chance(.3) ? masteryRewardValue(1) : 0 };
  },

  coinStore() {
    return [
      { id: 'ichor', cost: 8, gain: masteryRewardBundle({ ichor: 8000 }) },
      { id: 'tape', cost: 10, gain: masteryRewardBundle({ tape: 24 }) },
      { id: 'notes', cost: 9, gain: masteryRewardBundle({ notes: 36 }) },
      { id: 'stardust', cost: 14, gain: masteryRewardBundle({ star: 85 }) },
      { id: 'exp', cost: 8, gain: masteryRewardBundle({ exp: 8000 }) },
      { id: 'manual', cost: 12, gain: masteryRewardBundle({ manual: 5 }) },
      { id: 'tape', cost: 11, gain: masteryRewardBundle({ tape: 2 }) },
      { id: 'core', cost: 24, gain: masteryRewardBundle({ core: 2 }) },
      { id: 'gold', cost: 42, gain: masteryRewardBundle({ gold: 1 }) },
      { id: 'diamond', cost: 70, gain: masteryRewardBundle({ diamond: 1 }) },
      { id: 'main', cost: 135, gain: masteryRewardBundle({ main: 1 }) }
    ];
  },

  buyCoinOffer(id) {
    const offer = this.coinStore().find(x => x.id === id);
    if (!offer) return { ok: false, reason: 'That exchange offer is unavailable.' };
    if (!Save.spend({ arenaCoin: offer.cost })) return { ok: false, reason: 'Not enough Arena Coins.' };
    Save.give(offer.gain, true);
    return { ok: true, offer };
  },

  resolve(opp, win, reward) {
    const a = Save.data.arena;
    if (win) {
      a.wins++;
      const gain = Math.max(8, Math.round((a.rank - opp.rank) * .35) + 20);
      a.rank = Math.max(1, a.rank - gain);
      opp.beaten = true;
      Save.give(reward || this.rewards());
      Pass.addXp(80);
      UI.toast('🏆 Rank ' + a.rank);
    } else {
      a.losses++;
      a.rank = Math.min(99999, a.rank + 30);
      Save.give(masteryRewardBundle({ ichor: 500, exp: 1200 }));
    }
    Save.write();
  }
};

/* ============================================================ TRIALS */
const Trials = {
  state(id) {
    const t = Save.data.trials && typeof Save.data.trials === 'object' && !Array.isArray(Save.data.trials)
      ? Save.data.trials
      : (Save.data.trials = {});
    const week = currentWeek();
    if (!t[id]) t[id] = { stage: 0, best: 0, week };
    if (!t[id] || typeof t[id] !== 'object' || Array.isArray(t[id])) t[id] = { stage: 0, best: 0, week };
    t[id].stage = clamp(Math.floor(Number(t[id].stage) || 0), 0, this.STAGES);
    t[id].best = clamp(Math.floor(Number(t[id].best) || 0), 0, this.STAGES);
    if (typeof isApexTrialId === 'function' && isApexTrialId(id)) {
      if (t[id].week !== 'permanent') { t[id].week = 'permanent'; Save.write(); }
      return t[id];
    }
    if (t[id].week !== week) {
      t[id] = { stage: 0, best: t[id].best || 0, week };
      Save.write();
    }
    return t[id];
  },
  STAGES: 8,

  grindEnemies() {
    return this.makeEnemies({ id: 'grind', hard: false }, 0);
  },

  grindRewards() {
    const mastery = Save.data.mastery;
    const out = {
      ichor: 700 + mastery * 21,
      tape: 10,
      notes: 8,
      exp: 600 + mastery * 18,
      core: 1,
      manual: 2,
      star: 12,
      raidTicket: 1
    };
    ['tape', 'notes', 'core', 'manual', 'star', 'raidTicket'].forEach(key => { out[key] = masteryRewardValue(out[key]); });
    return out;
  },

  eligible(trial) {
    return Save.ownedIds().filter(id => trialAllows(trial, id));
  },

  /* Apex stages occasionally pull an encounter from the event roster. The
     roll is deterministic per stage, so previews and replays agree while the
     pool still feels like a rare surprise during a clear. */
  rareEventEncounter(trial, stage, rng) {
    if (!trial || !trial.endgame || stage < 1) return null;
    const tier = trial.apexTier || 800;
    const base = tier >= 800 ? .10 : tier >= 700 ? .085 : .07;
    const stageFactor = stage >= 5 ? 1.35 : stage >= 3 ? 1.15 : 1;
    const machine = base * .52 * stageFactor;
    const delilah = base * .28 * stageFactor;
    const kingdom = base * .20 * stageFactor;
    const roll = rng.f();
    if (roll < machine) return 'machines';
    if (roll < machine + delilah) return 'delilah';
    if (roll < machine + delilah + kingdom) return 'kingdom';
    return null;
  },

  enemyLevel(trial, stage) {
    const cap = Save.data.mastery;
    if (trial.endgame) return (trial.apexLevelCurve || [650, 680, 710, 740, 765, 785, 800, 800])[clamp(stage, 0, 7)];
    const bump = trial.hard ? 1.15 : 1;
    // Early stages track a newer player's current Mastery gently; later
    // stages become a real endgame ladder and reach the new 800 ceiling.
    const stageScale = [.48, .58, .68, .79, .91, 1.04, 1.18, 1.32][clamp(stage, 0, 7)];
    return clamp(Math.round(cap * stageScale * bump), 1, 800);
  },

  makeEnemies(trial, stage) {
    const rng = seeded('trial-' + currentWeek() + '-' + trial.id + '-' + stage);
    const lv = this.enemyLevel(trial, stage);
    const depth = 4 + stage * 2;
    const pool = twistedPool(depth);
    const kind = trial.endgame ? (stage >= 1 ? 'elite' : 'normal') : stage >= 3 ? 'elite' : 'normal';
    const elites = ELITE_TWISTED.filter(i => pool.includes(i));
    const ids = Depths.compose(rng, trial.endgame && elites.length >= 5 ? elites : stage >= 4 && elites.length >= 5 ? elites : pool, 5, depth);
    const out = ids.map(id => makeTwisted(id, lv, kind));
    if (stage === this.STAGES - 1) {
      const trialBosses = BOSSES.filter(b => !b.eventOnly);
      const b = trialBosses[rng.i(0, trialBosses.length - 1)];
      out[0] = makeTwisted(b.id, Math.round(lv * 1.1), 'boss');
      out[0].boss = b; out[0].name = 'Twisted ' + HEROES[b.id].name;
    }

    const encounter = this.rareEventEncounter(trial, stage, rng);
    if (encounter === 'machines') {
      const machineIds = ['GladHander', 'LegalEagle', 'RobberBaron', 'PencilPusher'];
      const count = stage >= 5 ? 3 : 2;
      const wave = stage >= 5 ? 3 : stage >= 3 ? 2 : 1;
      const machines = machineIds.slice(0, count).map((id, i) => Raid.makeUnknownWorldFoe(id, lv, wave, i));
      out.splice(0, count, ...machines);
    } else if (encounter === 'delilah') {
      out[0] = Raid.makeBoss('Delilah', Math.round(lv * 1.06), 1);
    } else if (encounter === 'kingdom') {
      const visitors = Raid.makeCollabFoes(lv, { stageLevels: [lv] });
      out.splice(0, visitors.length, ...visitors);
    }
    return out.map((spec, i) => equipEnemyLoadout(spec, trial.endgame ? 34 + stage * 8 : 8 + stage * 8,
      seeded(`trial-loadout:${currentWeek()}:${trial.id}:${stage}:${i}`), {
        trinketCount: trial.endgame ? (stage >= 6 ? 4 : stage >= 3 ? 3 : 2) : Math.max(1, stage >= 7 ? 3 : stage >= 5 ? 2 : stage >= 3 ? 1 : 0),
        rank: trial.endgame ? (stage >= 6 ? 5 : stage >= 3 ? 4 : 3) : stage >= 7 ? 4 : stage >= 5 ? 3 : stage >= 3 ? 2 : 1,
        badgeChance: trial.endgame ? .98 : stage >= 6 ? .85 : stage >= 4 ? .4 : 0,
        badgeLvl: trial.endgame ? clamp(stage + 1, 3, BADGE_MAX_LVL) : clamp(stage - 1, 1, BADGE_MAX_LVL)
      }));
  },

  /* Rare Apex encounters pay out their matching event materials after a
     victory. The encounter itself is uncommon; once it appears, the reward
     is guaranteed so the surprise is worth respecting. */
  rareEventLoot(battle, trial) {
    if (!battle || !trial || !trial.endgame) return;
    const foes = (battle.units || []).filter(u => u.team === TEAM_E);
    const machines = foes.filter(u => u.unknownWorld && !u.isBoss);
    const hasDelilah = foes.some(u => u.id === 'Delilah' && u.twisted);
    const hasKingdom = foes.some(u => u.collabBoss);
    if (!machines.length && !hasDelilah && !hasKingdom) return;

    const tier = trial.apexTier || 800;
    const messages = [];
    if (machines.length) {
      const base = tier >= 800 ? 72 : tier >= 700 ? 58 : 46;
      const gears = masteryRewardValue(base + Math.max(0, machines.length - 2) * 10);
      const r = Raid.state();
      r.unknownWorldGears = (r.unknownWorldGears || 0) + gears;
      messages.push('⚙ +' + gears + ' Gears');
    }
    if (hasDelilah) {
      const shards = masteryRewardValue(tier >= 800 ? 20 : tier >= 700 ? 16 : 12);
      Save.giveShards('Delilah', shards);
      messages.push('🧪 Delilah +' + shards + ' shards');
    }
    if (hasKingdom) messages.push('🗝 Kingdom Hearts trio defeated');
    Save.write();
    UI.refreshBar(true);
    UI.toast('Rare Apex haul · ' + messages.join('  '));
  },

  rewardScale(trial, stage) {
    const mastery = Number(Save.data.mastery) || 1;
    const enemyLevel = this.enemyLevel(trial, stage);
    const stageScale = (1 + stage * .5) * (1 + stage * .20);
    const difficultyScale = 1 + clamp(enemyLevel / 800, .08, 1) * .18;
    // Fixed Trial rewards now keep pace with the account, up to +70% at the
    // current mastery cap, while stage and difficulty still do the heavy work.
    const masteryScale = masteryRewardMultiplier(mastery);
    const challengeScale = trial.endgame ? 1.22 : trial.hard ? 1.06 : 1;
    const apexRewardScale = trial.endgame ? (trial.apexRewardMult == null ? 1 : trial.apexRewardMult) : 1;
    return { total: stageScale * difficultyScale * masteryScale * challengeScale * apexRewardScale, mastery: masteryScale };
  },

  rewards(trial, stage) {
    const scale = this.rewardScale(trial, stage);
    const endgame = !!trial.endgame;
    const apexTier = trial.apexTier || 0;
    const stageDrop = 1 + stage * .10;
    const apexCrates = endgame
      ? (apexTier >= 800
        ? { gold: 4 + Math.floor(stage / 3), diamond: stage >= 5 ? 3 : stage >= 2 ? 2 : 1, main: stage >= 6 ? 2 : stage >= 3 ? 1 : 0 }
        : apexTier >= 700
        ? { gold: 3 + Math.floor(stage / 4), diamond: stage >= 5 ? 2 : 1, main: stage >= 5 ? 1 : 0 }
        : { gold: 3, diamond: stage >= 5 ? 1 : 0, main: stage >= 6 ? 1 : 0 })
      : { gold: 2, diamond: stage >= 6 ? 2 : stage >= 3 ? 1 : 0, main: stage >= 7 ? 2 : stage >= 5 ? 1 : 0 };
    return {
      ichor: Math.round((endgame ? 6000 : 4000) * scale.total),
      exp: Math.round((endgame ? 9000 : 12500) * scale.total),
      tape: Math.round((endgame ? 28 : 24) * scale.total * stageDrop),
      notes: Math.round((endgame ? 24 : 14) * scale.total * stageDrop),
      star: Math.round((endgame ? 130 : 80) * scale.total * stageDrop),
      core: masteryRewardValue((endgame ? 6 : 2) + Math.floor(stage / 2) + (stage >= 6 ? 2 : 0)),
      diamond: masteryRewardValue(apexCrates.diamond),
      gold: masteryRewardValue(apexCrates.gold),
      main: masteryRewardValue(apexCrates.main),
      tape: masteryRewardValue(endgame ? (stage >= 5 ? 5 : 2) : (stage >= 5 ? 2 : 0)),
      raidTicket: masteryRewardValue(endgame ? (stage >= 5 ? 2 : 1) : (stage >= 4 ? 1 : 0)),
      manual: Math.round((endgame ? 28 + stage * 5 : 6 + stage * 3) * stageDrop * scale.mastery * (endgame ? 1.1 : 1.08))
    };
  },

  applyApexDebuffs(battle, trial) {
    if (!battle || !trial || !trial.apexDebuffs) return;
    const names = [];
    const ids = trial.apexDebuffs.map(rule => rule.id).filter(id => STATUS[id]);
    battle.playerTeam().forEach(u => trial.apexDebuffs.forEach(rule => {
      const status = STATUS[rule.id];
      if (!status) return;
      battle.applyStatus(null, u, rule.id, 999, {
        stacks: rule.stacks || 1, ignoreGuards: true, unresistable: true, apexLocked: true
      });
      u.apexTrialDebuffs = ids.slice();
      u.apexSpriteFilter = ids.includes('weaken')
        ? 'grayscale(.22) sepia(.38) hue-rotate(188deg) saturate(1.7) brightness(.84) contrast(1.18) drop-shadow(0 0 7px #6f8cff99)'
        : 'grayscale(.12) sepia(.32) hue-rotate(286deg) saturate(1.8) brightness(.88) contrast(1.2) drop-shadow(0 0 7px #ce70ff99)';
      if (u.el) u.el.classList.add('apex-altered');
      names.push(status.name + (rule.stacks > 1 ? ' ×' + rule.stacks : ''));
    }));
    if (names.length) battle.log('<b>' + trial.name + ':</b> ' + [...new Set(names)].join(' + ') + ' affects your team from the opening bell.');
  },

  complete(trial, stage) {
    const s = this.state(trial.id);
    if (stage >= s.stage) s.stage = Math.min(this.STAGES, stage + 1);
    s.best = Math.max(s.best, stage + 1);
    Save.give(this.rewards(trial, stage));
    Pass.addXp(70);
    Save.write();
  }
};

/* ============================================================ RAID TICKETS */
/* A Raid Ticket spends the tape first, then runs the real Battle class with
   rendering/audio disabled. No power estimate or auto-win shortcut is used:
   skills, movement, cooldowns, statuses, phases, summons, and normal time
   limits still decide both Trial and Event results. */
const RaidTicket = {
  SPEED: 10000,

  count() { return Save.res('raidTicket'); },

  /* A tape is only a cost for a completed simulation attempt. If the
     off-screen battle throws (for example after a data/content update), put
     the tape back so a transient technical error can never eat a player's
     resource. */
  refund() { Save.give({ raidTicket: 1 }, true); },

  /* Resolve a user-selected number of identical tape attempts. A technical
     failure stops the batch immediately and is already refunded by the single
     run method; ordinary defeats still count as completed attempts. Yield
     between attempts so large batches do not monopolize the browser thread. */
  async runBatch(run, amount) {
    const requested = clamp(Math.floor(Number(amount) || 1), 1, 99);
    const results = [];
    for (let i = 0; i < requested; i++) {
      // Let the spinner, resource bar, and browser event queue update between
      // tape simulations. The simulation itself remains synchronous and
      // bounded by Battle.simulateOffscreen's fixed step budget.
      if (i > 0) await new Promise(resolve => setTimeout(resolve, 0));
      let result;
      const ticketBalanceBefore = Save.res('raidTicket');
      try { result = await run(); }
      catch (error) {
        console.error('Raid Ticket batch run failed', error);
        result = { win: false, why: 'The raid simulation hit a technical error. Your Raid Ticket was returned.', consumed: false, refunded: true };
        if (Save.res('raidTicket') < ticketBalanceBefore && typeof this.refund === 'function') this.refund();
      }
      if (!result) break;
      if (result.consumed || result.refunded) results.push(result);
      if (result.refunded || !result.consumed) break;
    }
    const wins = results.filter(r => r.win).length;
    const losses = results.filter(r => !r.win && r.consumed).length;
    const technical = results.filter(r => r.refunded).length;
    const rewards = {};
    const shardDrops = {};
    let tokenReward = 0;
    results.forEach(r => {
      Object.entries(r.rewards || {}).forEach(([key, value]) => { rewards[key] = (rewards[key] || 0) + value; });
      Object.entries(r.shardDrops || {}).forEach(([key, value]) => { shardDrops[key] = (shardDrops[key] || 0) + value; });
      tokenReward += Number(r.tokenReward) || 0;
    });
    const last = results[results.length - 1] || { win: false, why: 'No Raid Tickets', consumed: false };
    return Object.assign({}, last, {
      batch: true, requested, completed: results.length, wins, losses, technical,
      results, rewards, shardDrops, tokenReward,
      win: wins > 0, consumed: results.some(r => r.consumed),
      consumedCount: results.filter(r => r.consumed).length
    });
  },

  trialMeta(trial, stage) {
    return {
      title: trial.name + ' · Stage ' + (stage + 1) + ' · Raid Ticket',
      floorLabel: trial.name + ' · Raid Sim',
      bg: trial.apexBg ? ASSET + trial.apexBg : Art.bg(seeded('trial-bg-' + currentWeek() + '-' + trial.id).pick(BACKGROUNDS)),
      mods: stage >= 4 ? [seeded('trial-tape-mod-' + currentWeek() + '-' + trial.id + '-' + stage).pick(FLOOR_MODS.filter(m => !m.good)).id] : [],
      skillStartEnergy: trial.endgame ? 80 : 65,
      skillTempo: trial.endgame ? 1.38 : 1.25,
      postIntroCue: trial.endgame ? 'apex_trial_warning' : null,
      timeLimit: 180
    };
  },

  eventMeta(event, stage, wave, level) {
    const final = event.isCollab || wave === 3;
    const bigWigFight = event.isUnknownWorld && stage >= (event.bigWigStage == null ? 99 : event.bigWigStage) && wave === 3;
    const rng = seeded('event-map-' + event.id + '-' + wave);
    const bg = event.isCookieRun ? ASSET + 'uploads/crkbbg' + wave + '.png' : event.isQOM ? ASSET + 'uploads/qombattlebackground.png' : event.isUnknownWorld
      ? ASSET + 'uploads/image-41.png'
      : event.bossIds.includes('Delilah')
        ? bgForMap(['warehouse', 'art-floor', 'library-floor'][wave - 1])
        : Art.bg(rng.pick(BACKGROUNDS));
    const plan = Raid.wavePlan(event);
    return {
      title: `Event Stage ${stage + 1} · ${event.isCollab ? 'Endurance' : 'Wave ' + wave}`,
      floorLabel: `${event.title} · Stage ${stage + 1}`,
      roomIdx: wave, roomTotal: event.isCollab ? 1 : 3,
      bg, mods: (plan[wave - 1] && plan[wave - 1].mods) || [],
      timeLimit: event.isCollab ? 300 : final ? 210 : 165,
      timeoutWin: !!event.isCollab,
      unknownWorld: !!event.isUnknownWorld, qom: !!event.isQOM,
      ...(event.isUnknownWorld ? {
        enemySkillStartEnergy: bigWigFight ? 100 : 54 + wave * 10,
        enemySkillTempo: bigWigFight ? 1.72 : 1.38 + wave * .16,
        enemySkillCdr: bigWigFight ? .28 : .14 + wave * .035
      } : {})
    };
  },

  async runEvent(event, stage, team) {
    if (!event || !Number.isFinite(stage) || stage < 0 || stage >= Raid.STAGES) return null;
    const ids = (team || []).filter(id => id && Save.owns(id)).slice(0, 5);
    if (!ids.length) return { win: false, why: 'No team selected', consumed: false };
    if (!Raid.canEnter(event.id, stage)) return { win: false, why: 'That event stage is locked', consumed: false };
    if (!Save.spend({ raidTicket: 1 })) return { win: false, why: 'No Raid Tickets', consumed: false };

    const level = Raid.stageLevel(stage, event);
    const waveCount = event.isCollab ? 1 : 3;
    let specs = playerTeamSpecs(ids), battle = null, result = null;
    if (event.isCookieRun) specs = CookieRun.team(specs, stage);
    const battles = [];
    try {
      for (let wave = 1; wave <= waveCount; wave++) {
        battle = new Battle({ offscreen: true });
        if (event.isCookieRun) specs = CookieRun.ensureWave(specs, stage);
        const foes = Raid.equipWave(Raid.makeWave(event.id, wave, level, event), event.id, wave, level);
        result = await battle.simulateOffscreenAsync(specs, foes, this.eventMeta(event, stage, wave, level), {});
        battles.push(battle);
        if (!result || !result.win) {
          return Object.assign({}, result || { win: false, why: 'Event simulation failed' }, {
            consumed: true, speed: this.SPEED, team: ids, battle
          });
        }
        if (wave < waveCount) {
          const hp = {};
          battle.units.filter(u => u.team === TEAM_P && !u.minion).forEach(u => { hp[u.id] = u.alive ? u.hpPct : 0; });
          specs = specs.filter(spec => hp[spec.id] > 0).map(spec => Object.assign({}, spec, {
            carryHp: Math.min(1, hp[spec.id] + .12)
          }));
          if (!specs.length) return { win: false, why: 'The whole team fell between waves', consumed: true, speed: this.SPEED, team: ids, battle };
        }
      }
    } catch (error) {
      console.error('Event Raid Ticket simulation failed', error);
      this.refund();
      return { win: false, why: 'The event simulation hit a technical error. Your Raid Ticket was returned.', consumed: false, refunded: true, team: ids, battle };
    }

    const shardDrops = {};
    battles.forEach(waveBattle => Object.entries(collectTwistedShardDrops(waveBattle)).forEach(([id, amount]) => {
      shardDrops[id] = (shardDrops[id] || 0) + amount;
    }));
    const tokenReward = Raid.resolve(event.id, true, event, stage);
    const rewards = Raid.stageRewards(event, stage);
    const mastery = event.isCollab ? 260 + level : 170 + level;
    const pass = event.isCollab ? 150 + Math.round(level / 2) : 95 + Math.round(level / 3);
    payoutBattle(ids, rewards, { mastery, pass });
    Save.write();
    return { win: true, consumed: true, speed: this.SPEED, team: ids, battle, tokenReward, rewards, shardDrops };
  },

  async runTrial(trial, stage, team) {
    if (!trial || !Number.isFinite(stage) || stage < 0 || stage >= Trials.STAGES) return null;
    const ids = (team || []).filter(id => id && Save.owns(id)).slice(0, 5);
    if (!ids.length) return { win: false, why: 'No team selected', consumed: false };
    if (!Save.spend({ raidTicket: 1 })) return { win: false, why: 'No Raid Tickets', consumed: false };

    const serviceWeek = currentWeek();
    const battle = new Battle({ offscreen: true });
    let result;
    try {
      result = await battle.simulateOffscreenAsync(
        playerTeamSpecs(ids),
        Trials.makeEnemies(trial, stage),
        this.trialMeta(trial, stage),
        { onReady: b => { if (trial.apexDebuffs) Trials.applyApexDebuffs(b, trial); } }
      );
    } catch (error) {
      console.error('Trial Raid Ticket simulation failed', error);
      this.refund();
      return { win: false, why: 'The trial simulation hit a technical error. Your Raid Ticket was returned.', consumed: false, refunded: true, team: ids, battle };
    }

    let shardDrops = {};
    if (result && result.win) {
      shardDrops = collectTwistedShardDrops(battle);
      if (currentWeek() === serviceWeek) Trials.complete(trial, stage);
      else {
        Save.give(Trials.rewards(trial, stage));
        Pass.addXp(70);
      }
      payoutBattle(ids, {}, { mastery: 120, pass: 0 });
      Trials.rareEventLoot(battle, trial);
      if (typeof Depths !== 'undefined' && Depths.trinketDrops) Depths.trinketDrops(battle);
      Save.write();
    }
    return Object.assign({}, result || { win: false, why: 'Simulation failed' }, { consumed: true, speed: this.SPEED, battle, team: ids, shardDrops });
  },

  async runCampaign(camp, stage, team) {
    if (!camp || !Array.isArray(camp.stages) || !Number.isFinite(stage) || stage < 0 || stage >= camp.stages.length) return null;
    if (!Campaign.unlocked(camp)) return { win: false, why: 'Own both featured Heroes first', consumed: false };
    const ids = Campaign.team(camp, team);
    if (!Save.spend({ raidTicket: 1 })) return { win: false, why: 'No Raid Tickets', consumed: false };

    const stageDef = camp.stages[stage];
    const battle = new Battle({ offscreen: true });
    let result;
    try {
      result = await battle.simulateOffscreenAsync(
        Campaign.teamSpecs(camp, ids),
        Campaign.foes(camp, stage),
        {
          title: camp.title + ' · ' + stageDef.name + ' · Raid Ticket',
          floorLabel: 'Friendship: ' + stageDef.name + ' · Raid Sim',
          roomIdx: stage + 1, roomTotal: camp.stages.length,
          bg: bgForFloor(Math.max(1, Math.round(camp.recLevel / 4)), 0),
          timeLimit: 180
        },
        {}
      );
    } catch (error) {
      console.error('Friendship Raid Ticket simulation failed', error);
      this.refund();
      return { win: false, why: 'The Friendship battle simulation hit a technical error. Your Raid Ticket was returned.', consumed: false, refunded: true, speed: this.SPEED, battle, team: ids };
    }

    let shardDrops = {};
    let rewards = {};
    let campaignAdvanced = false;
    let badgeEarned = false;
    if (result && result.win) {
      shardDrops = collectTwistedShardDrops(battle);
      rewards = masteryRewardBundle({ ichor: 300 + camp.recLevel * 8, exp: 250 + camp.recLevel * 6 });
      const wasDone = Save.campaignDone(camp.id);
      const wasNext = Save.campaignStage(camp.id) === stage;
      payoutBattle(Campaign.ownedTeam(camp, ids), rewards, { mastery: 80, pass: 30 });
      if (wasNext) {
        Save.advanceCampaign(camp.id);
        campaignAdvanced = true;
      }
      badgeEarned = !wasDone && Save.campaignDone(camp.id);
      Save.write();
    }
    return Object.assign({}, result || { win: false, why: 'Simulation failed' }, {
      consumed: true, speed: this.SPEED, battle, team: ids,
      shardDrops, rewards, campaignAdvanced, badgeEarned
    });
  }
};

/* ============================================================ EVENT RAID */
/* An eight-stage event campaign. Every stage is a three-wave run at a fixed
   enemy level and costs one shared Stamina to enter. Victories pay persistent
   Event Tokens, which the player spends on the current featured Heroes rather
   than receiving a predetermined shard drop.

   The live roster below is generated from the current real week: one Lethal
   spotlight, one general spotlight, and one random duo. */
function weeklyEvents(week) {
  week = week == null ? currentWeek() : week;
  const rng = seeded('weekly-events-' + week);
  const roster = TWISTED_IDS.filter(id => HEROES[id]);
  const randomRoster = roster.filter(id => !EVENT_ONLY_TWISTED.has(id));
  const lethals = roster.filter(id => obtainKey(id) === 'Lethal');
  const lethal = rng.pick(lethals);
  const spotlight = rng.pick(randomRoster.filter(id => id !== lethal && obtainKey(id) !== 'Lethal'));
  const duo = rng.pickN(randomRoster.filter(id => id !== lethal && id !== spotlight), 2);
  const phantasiaEvent = {
    id: 'phantasia-wishbound', label: 'Phantasia', kind: 'phantasia', isPhantasia: true,
    bossIds: ['Dandy'], featuredIds: ['Phantasia'], tag: 'WISHBOUND EVENT', minMastery: 40,
    stageLevels: [42, 58, 78, 104, 136, 174, 220, 275], rewardMult: 1.15,
    title: 'Phantasia: Wishbound',
    blurb: 'Phantasia has opened a wandering star gate. Fight through its increasingly difficult floors, collect Wish Coins, and trade them for her shards, the Unicorn Emblem, and supplies.'
  };
  const qomEvent = {
    id: 'queens-of-mischief', label: 'Queens of Mischief', kind: 'qom', isQOM: true,
    bossIds: QOM_IDS, featuredIds: QOM_IDS, tag: 'LIVE PERFORMANCE', minMastery: 40,
    stageLevels: [44, 62, 86, 118, 160, 218, 292, 386], rewardMult: 1.2,
    title: 'Queens of Mischief',
    blurb: 'The band takes the stage. Gourdy keeps the beat, Ribecca holds the line, Soulvester intercepts threats, and Eclipse and Connie bring the guitars. Fight three escalating sets to earn Backstage Passes and recruit the five event variants.'
  };
  const unknownWorldEvent = {
    id: 'unknown-world', label: 'Unknown World', kind: 'unknown-world', isUnknownWorld: true,
    bossIds: [], featuredIds: ['GladHander', 'LegalEagle', 'RobberBaron', 'PencilPusher'], tag: 'SEALED WORLD', minMastery: 40,
    stageLevels: [44, 62, 86, 118, 160, 218, 292, 386], bigWigStage: 5, rewardMult: 1.18,
    title: 'Unknown World: Familiar Targets',
    blurb: 'A sealed door opens onto an office-world invasion. The machines recognize your Toons as the same targets they have been trying to take over and make sad. They call in bulk reinforcements. Clear three brutal waves, recover Gears, and trade them for superior Trinkets.'
  };
  return [COOKIE_EVENT, qomEvent, phantasiaEvent, unknownWorldEvent,
    { id: 'collab-door-opens', label: 'The Door Opens', kind: 'collab', isCollab: true,
      bossIds: ['Riku', 'Sora', 'Kairi'], featuredIds: ['Sora', 'Riku', 'Kairi', 'Goofy'],
      tag: 'COLLAB ENDURANCE', rewardMult: 1.8, minMastery: 100,
      stageLevels: [100, 155, 225, 315, 420, 535, 655, 760],
      title: 'The Door Opens',
      blurb: 'Three Keyblade wielders have crossed into Gardenview. Survive their full team for five minutes, or defeat all three before time runs out.' },
    { id: `w${week}-lethal-${lethal}`, label: HEROES[lethal].name, kind: 'solo',
      bossIds: [lethal], featuredIds: [lethal], tag: 'LETHAL SPOTLIGHT', minMastery: 100,
      stageLevels: [100, 155, 225, 315, 420, 535, 655, 760],
      title: 'Twisted ' + HEROES[lethal].name,
      blurb: 'This week\'s Lethal file is open. Defeat it before the rotation changes.' },
    { id: `w${week}-spot-${spotlight}`, label: HEROES[spotlight].name, kind: 'solo',
      bossIds: [spotlight], featuredIds: [spotlight], tag: 'WEEKLY SPOTLIGHT',
      title: 'Twisted ' + HEROES[spotlight].name,
      blurb: HEROES[spotlight].name + ' has taken over this week\'s featured floor.' },
    { id: `w${week}-duo-${duo.join('-')}`, label: 'Collision', kind: 'group',
      bossIds: duo, featuredIds: duo, tag: 'RANDOM DUO', softMult: .82, rewardMult: 1.5,
      minMastery: 60, stageLevels: [60, 105, 170, 255, 360, 480, 620, 760],
      title: 'Converging Experiments',
      blurb: duo.map(id => HEROES[id].name).join(' and ') + ' collide for one week only.' }
  ];
}

/* Event-only rules shown in the boss dossier and applied by Battle.start().
   They never enter the random Depths modifier pool. */
const EVENT_MODIFIERS = [
  { id: 'event_momentum', kind: 'buff', icon: '⚡', name: 'Opening Momentum',
    desc: 'Wave 1: Heroes gain 18% Energy Generation and 10% Move Speed.',
    apply: B => B.playerTeam().forEach(u => { u.flat.energyGen90 = .18; u.flat.msP90 = .10; u.dirty = true; }) },
  { id: 'event_attrition', kind: 'debuff', icon: '🩸', name: 'Event Attrition',
    desc: 'Waves 2 and 3: Heroes receive 22% less healing.',
    apply: B => B.playerTeam().forEach(u => { u.flat.healRecv90 = -.22; u.dirty = true; }) },
  { id: 'event_boss_pressure', kind: 'debuff', icon: '👑', name: 'Boss Pressure',
    desc: 'Wave 3: the featured boss gains 16% Attack and 12% cooldown recovery.',
    apply: B => B.foeTeam().filter(u => u.isBoss || u.isElite).forEach(u => { u.flat.atkP90 = .16; u.flat.cdr90 = .12; u.dirty = true; }) },
  { id: 'event_lethal_pressure', kind: 'debuff', icon: '❤️‍🔥', name: 'Lethal Pressure',
    desc: 'Wave 3: Lethals gain 24% Attack, 12% Critical Chance, and 10% penetration.',
    apply: B => B.foeTeam().forEach(u => { u.flat.atkP90 = .24; u.flat.crit90 = .12; u.flat.armorPen90 = .10; u.flat.magPen90 = .10; u.dirty = true; }) },
  { id: 'event_crossfire', kind: 'debuff', icon: '⚔', name: 'Crossfire',
    desc: 'Wave 3: both bosses gain 22% Attack Speed while Heroes take 8% more damage.',
    apply: B => { B.foeTeam().forEach(u => { u.flat.aspdP90 = .22; u.dirty = true; }); B.playerTeam().forEach(u => { u.flat.dmgTaken90 = .08; u.dirty = true; }); } },
  { id: 'event_delilah_protocol', kind: 'debuff', icon: '☣', name: 'Delilah Protocol',
    desc: 'Wave 3: Test Subjects are catalogued immediately. Every 6s, Delilah contaminates the highest-Energy Hero; an already contaminated target is Contained.',
    apply: B => {
      const d = B.foeTeam().find(u => u.id === 'Delilah'); if (!d) return;
      B.topN(B.playerTeam(), 'energy', 2).forEach(t => B.applyStatus(d, t, 'testsubject', 999));
      B.every(null, 6, () => {
        if (!d.alive) return;
        const t = B.highestEnergy(B.playerTeam()); if (!t) return;
        if (t.hasStatus('contamination')) B.applyStatus(d, t, 'contained', 1.5);
        B.applyStatus(d, t, 'contamination', 8);
        B.fxFloatIcon(t.x, t.y - 100, '☣', '#b38cff');
      });
    } },
  { id: 'event_collab_endurance', kind: 'debuff', icon: '🔑', name: 'Keyblade Endurance',
    desc: 'Five-minute survival test: the trio resists control, links attacks every 18s, and grows stronger each minute. Hero healing is reduced by 35%.',
    apply: B => {
      B.playerTeam().forEach(u => { u.flat.healRecv91 = -.35; u.flat.dmgTaken91 = .06; u.dirty = true; });
      B.foeTeam().forEach(u => { u.flat.ccRes91 = .45; u.flat.cdr91 = .18; u.energy = 35; u.dirty = true; });
      let fallenSeen = 0;
      B.every(null, .2, () => {
        const living = B.foeTeam().filter(u => u.alive);
        const fallen = 3 - living.length;
        if (fallen <= fallenSeen) return;
        fallenSeen = fallen;
        living.forEach(u => {
          B.cleanseAll(u);
          u.energy = 100;
          u.flat.atkP93 = fallen * .30;
          u.flat.cdr93 = fallen * .18;
          u.flat.dmgTaken93 = fallen * -.12;
          u.dirty = true;
          B.shield(u, u, u.max.hp * (.14 + fallen * .06), 12);
          B.fxFloatIcon(u.x, u.y - 112, '🔑', '#e8fbff');
        });
        if (living.length) {
          B.log('<b>Trio\'s Last Stand:</b> the remaining challengers surge with power.');
          B.flash('#d9f7ff', .34, .22); B.shake(14, .45); Sound.play('warn');
        }
      });
      B.every(null, 18, () => {
        const sora = B.foeTeam().find(u => u.id === 'Sora' && u.alive);
        const riku = B.foeTeam().find(u => u.id === 'Riku' && u.alive);
        const kairi = B.foeTeam().find(u => u.id === 'Kairi' && u.alive);
        if (riku) B.foeTeam().forEach(a => B.shield(riku, a, riku.max.hp * .018, 6));
        if (kairi) { const weak = B.lowestHp(B.foeTeam()); if (weak) B.heal(kairi, weak, weak.max.hp * .012, { tag: 'Shared Light' }); }
        if (sora) {
          collabVoice(sora, 'limit', { vol: .8, priority: true }); B.anim(sora, 'attack', .85);
          B.playerTeam().forEach(t => { B.damage(sora, t, sora.st.atk * .32, { type: 'physical', area: true, tag: 'Team Limit' }); B.applyStatus(sora, t, 'slow', 3); });
          B.flash('#d9f7ff', .22, .18); B.shake(10, .35);
        }
      });
      B.every(null, 60, () => B.foeTeam().forEach(u => {
        if (!u.alive) return;
        u.flat.atkP92 = (u.flat.atkP92 || 0) + .10;
        u.flat.cdr92 = (u.flat.cdr92 || 0) + .08; u.dirty = true;
        B.fxFloatIcon(u.x, u.y - 112, '🔑', '#73d8ff');
      }));
    } }
];

const COLLAB_BOSS_PHASES = {
  Sora: { id: 'Sora', title: 'The Combo Master', phases: [
    { at: 1, name: 'Let’s Go', mods: { dmgTaken: -.08 } },
    { at: .72, name: 'Drive Form', mods: { atkP: .28, aspdP: .22, cdr: .18, dmgTaken: -.12 }, onEnter: (u, B) => { collabVoice(u, 'skill', { priority: true }); B.energy(u, 45); } },
    { at: .40, name: 'This Is It', mods: { atkP: .55, aspdP: .38, cdr: .35, dmgTaken: -.20 }, onEnter: (u, B) => { collabVoice(u, 'limit', { priority: true }); B.playerTeam().forEach(t => B.applyStatus(u, t, 'comboed', 8, { stacks: 3 })); } },
    { at: .15, name: 'Final Form', mods: { atkP: .88, cdr: .58, armorPen: .28, dmgTaken: -.28 }, onEnter: (u, B) => { B.energy(u, 100); B.flash('#e9fbff', .5, .3); } }
  ] },
  Riku: { id: 'Riku', title: 'The Road to Dawn', phases: [
    { at: 1, name: 'Dark Guard', mods: { dmgTaken: -.12 } },
    { at: .68, name: 'Controlled Darkness', mods: { defP: .30, mdefP: .30, cdr: .20, dmgTaken: -.18 }, onEnter: (u, B) => { collabVoice(u, 'guard', { priority: true }); B.shield(u, u, u.max.hp * .18, 12); } },
    { at: .34, name: 'Road to Dawn', mods: { atkP: .44, defP: .46, mdefP: .46, cdr: .38, dmgTaken: -.26 }, onEnter: (u, B) => { B.applyStatus(u, u, 'resolve', 999, { stacks: 6 }); B.energy(u, 100); } }
  ] },
  Kairi: { id: 'Kairi', title: 'The Oath of Light', phases: [
    { at: 1, name: 'Radiant Circle', mods: { dmgTaken: -.08 } },
    { at: .65, name: 'Princess of Heart', mods: { magP: .32, cdr: .24, dmgTaken: -.15 }, onEnter: (u, B) => { collabVoice(u, 'protect', { priority: true }); B.foeTeam().forEach(a => B.shield(u, a, u.max.hp * .10, 9)); } },
    { at: .30, name: 'Oath of Light', mods: { atkP: .35, magP: .58, cdr: .46, dmgTaken: -.24 }, onEnter: (u, B) => { B.playerTeam().forEach(t => kairiGleam(u, t, B, 3)); B.energy(u, 100); } }
  ] }
};

const Raid = {
  SHOP_BUNDLE: 5,
  STAGES: 8,
  STAGE_LEVELS: [20, 55, 105, 180, 280, 410, 575, 760],

  events() { return weeklyEvents(currentWeek()); },
  event(id) { const events = this.events(); return events.find(e => e.id === id) || events[0]; },
  state() {
    const r = Save.data.raid;
    if (r.tokens == null) r.tokens = 0;
    if (r.phantasiaCoins == null) r.phantasiaCoins = 0;
    if (r.qomPasses == null) r.qomPasses = 0;
    if (r.unknownWorldGears == null) r.unknownWorldGears = 0;
    if (!r.stages) r.stages = {};
    if (!r.clears) r.clears = {};
    return r;
  },
  tokens() { return Math.max(0, this.state().tokens || 0); },
  currency(eventOrId) {
    const e = typeof eventOrId === 'string' ? this.event(eventOrId) : eventOrId;
    if (e && e.isCookieRun) return CookieRun.state().cutters;
    if (e && e.isPhantasia) return Math.max(0, this.state().phantasiaCoins || 0);
    if (e && e.isQOM) return Math.max(0, this.state().qomPasses || 0);
    if (e && e.isUnknownWorld) return Math.max(0, this.state().unknownWorldGears || 0);
    return this.tokens();
  },
  currencyIcon(eventOrId) {
    const e = typeof eventOrId === 'string' ? this.event(eventOrId) : eventOrId;
    return e && e.isCookieRun ? '✂️' : e && e.isQOM ? '🎟' : e && e.isPhantasia ? '🌠' : e && e.isUnknownWorld ? '⚙' : '🪙';
  },
  eventUnlocked(eventOrId) {
    const e = typeof eventOrId === 'string' ? this.event(eventOrId) : eventOrId;
    return !!e && Save.data.mastery >= (e.minMastery || 20);
  },
  canEnter(id, stage) {
    return this.stageUnlocked(id, stage) && this.eventUnlocked(id);
  },
  clearRecord(id) {
    const r = this.state();
    if (!r.clears[id]) {
      r.clears[id] = {};
      const legacy = clamp(r.stages[id] || 0, 0, this.STAGES);
      for (let i = 0; i < legacy; i++) r.clears[id][i] = true;
    }
    return r.clears[id];
  },
  stageCleared(id, stage) { return !!this.clearRecord(id)[stage]; },
  stageProgress(id) {
    const record = this.clearRecord(id);
    let total = 0;
    for (let i = 0; i < this.STAGES; i++) if (record[i]) total++;
    return total;
  },
  nextStage(id) {
    for (let i = 0; i < this.STAGES; i++) if (!this.stageCleared(id, i)) return i;
    return this.STAGES - 1;
  },
  stageUnlocked(id, stage) {
    const e = this.event(id);
    if (!e || stage < 0 || stage >= this.STAGES) return false;
    // Every event stage is selectable from the dossier. Difficulty and the
    // normal event mastery gate still matter, but clearing an earlier stage is
    // not required before trying a later one.
    return true;
  },
  stageLevels(eventOrId) {
    const e = typeof eventOrId === 'string' ? this.event(eventOrId) : eventOrId;
    return e && e.stageLevels ? e.stageLevels : this.STAGE_LEVELS;
  },
  stageLevel(stage, eventOrId) {
    return this.stageLevels(eventOrId)[clamp(stage, 0, this.STAGES - 1)];
  },

  stageRewards(event, stage) {
    const level = this.stageLevel(stage, event);
    return masteryRewardBundle({
      ichor: Math.round(1800 + level * 22), exp: Math.round(1100 + level * 12),
      tape: 12 + Math.round(level / 25), star: 55 + Math.round(level * .45),
      manual: 6 + Math.round(level / 32), tape: stage >= 3 ? 2 : 1,
      gold: stage >= 5 ? 2 : stage >= 2 ? 1 : 0,
      diamond: stage >= 6 ? (event.tag === 'LETHAL SPOTLIGHT' ? 3 : 2) : stage >= 3 ? 1 : 0,
      main: stage >= 7 ? 1 : 0
    });
  },

  tokenReward(e, stage) {
    if (e.isCookieRun) return CookieRun.reward(stage);
    const base = e.isQOM ? 32 : e.isPhantasia ? 34 : e.isUnknownWorld ? 38 : e.isCollab ? 42 : e.bossIds.includes('Delilah') ? 30 : e.tag === 'LETHAL SPOTLIGHT' ? 22 : e.kind === 'group' ? 20 : 14;
    const stageMult = 1 + clamp(stage || 0, 0, this.STAGES - 1) * .20;
    return masteryRewardValue(Math.round(base * stageMult * (e.rewardMult || 1)));
  },

  waveMods(e, wave) {
    if (e.isQOM) return wave === 1 ? ['event_momentum'] : wave === 2 ? ['event_attrition'] : ['event_attrition','event_boss_pressure'];
    if (wave === 1) return ['event_momentum'];
    if (wave === 2) return ['event_attrition'];
    const out = ['event_attrition'];
    if (e.bossIds.includes('Delilah')) out.push('event_delilah_protocol');
    else if (e.kind === 'group') out.push('event_crossfire');
    else if (e.tag === 'LETHAL SPOTLIGHT') out.push('event_lethal_pressure');
    else out.push('event_boss_pressure');
    return out;
  },

  wavePlan(e) {
    if (e.isCookieRun) return CookieRun.plan();
    if (e.isQOM) return [
      { wave: 1, desc: 'Opening Act · Gourdy drums while Soulvester guards him. Interrupt the rhythm before it accelerates.', mods: ['event_momentum'] },
      { wave: 2, desc: 'Second Set · Ribecca raises keytar barriers while Eclipse builds Amplification with her guitar.', mods: ['event_attrition'] },
      { wave: 3, desc: 'Final Chorus · All five bandmates perform together. Connie spends Phantom Notes as the others protect the stage.', mods: ['event_attrition','event_boss_pressure'] }
    ];
    if (e.isCollab) return [
      { wave: 1, desc: 'Riku, Sora, and Kairi enter together. Defeat the trio or survive for 5:00 while their linked attacks escalate each minute.', mods: ['event_collab_endurance'] }
    ];
    if (e.isPhantasia) return [
      { wave: 1, desc: 'Wishbound scouts test the team. Opening Momentum makes the first push manageable.', mods: ['event_momentum'] },
      { wave: 2, desc: 'The star gate destabilizes. Elite Twisteds arrive while healing is reduced.', mods: ['event_attrition'] },
      { wave: 3, desc: 'Twisted Dandy guards the final seal with his shopkeeper phases and two reinforcements.', mods: ['event_attrition', 'event_boss_pressure'] }
    ];
    if (e.isUnknownWorld) return [
      { wave: 1, desc: 'Six machines flood the room at once. Momentum helps your team survive the opening rush.', mods: ['event_momentum'] },
      { wave: 2, desc: 'Eight upgraded machines arrive in formation. Attrition cuts healing while their mixed attacks pile on.', mods: ['event_attrition'] },
      { wave: 3, desc: 'Ten machines form a final bulk assault. Every defeat ends in a violent mechanical detonation.', mods: ['event_attrition', 'event_boss_pressure'] }
    ];
    const delilah = e.bossIds.includes('Delilah');
    return [
      { wave: 1, desc: 'A mobile screening wave. Momentum increases Energy generation and Move Speed.', mods: this.waveMods(e, 1) },
      { wave: 2, desc: 'Elite Twisteds arrive. Attrition reduces all healing received by your team.', mods: this.waveMods(e, 2) },
      { wave: 3, desc: delilah ? 'Twisted Delilah enters alone, then manufactures reinforcements through her own phases.' : 'The featured boss enters with its encounter rule active.', mods: this.waveMods(e, 3) }
    ];
  },
  /** One true boss unit. Authored BOSSES keep their phase kit; weekly
      spotlights without a phase file still receive boss durability and rank. */
  makeBoss(bossId, level, levelMult) {
    const b = BOSSES.find(x => x.id === bossId);
    const spec = makeTwisted(bossId, Math.round(level * (levelMult || 1)), 'boss');
    if (b) { spec.boss = b; spec.name = 'Twisted ' + HEROES[bossId].name; }
    if (bossId === 'Delilah') {
      spec.mult.hp *= 1.65; spec.mult.atk *= 1.28; spec.mult.def *= 1.30;
      spec.skillLv = Math.round(spec.skillLv * 1.20);
      spec.name = 'Twisted Delilah · Failed Experiment';
    }
    return spec;
  },
  /** Every boss an event fields, each a little softer if the event says so
      (a 'group' event with several bosses at once reads as "harder fight",
      not "double HP" if none of them get softened). */
  makeFoes(eventId, level, eventSnapshot) {
    const e = eventSnapshot || this.event(eventId);
    return e.bossIds.map(bid => {
      const spec = this.makeBoss(bid, level, e.bossIds.length > 1 ? (e.softMult || 1) : 1);
      if (spec && e.isPhantasia && bid === 'Dandy') {
        spec.phantasiaBoss = true;
        // The event dossier's power target is stage-based. Keep Dandy's
        // signature phases, but ramp his raw body from a fair early-event
        // boss into the late-event version instead of spawning a full Lethal
        // 2.40x boss on the stage-2 ~26k recommendation.
        const stage = Math.max(0, e.stageLevels.indexOf(level));
        const ramp = clamp(stage / Math.max(1, e.stageLevels.length - 1), 0, 1);
        spec.rarity = stage < 3 ? 4 : stage < 6 ? 5 : 6;
        spec.rarityPlus = stage < 3 ? 6 + stage * 2 : stage < 6 ? 12 + (stage - 3) * 3 : 20 + (stage - 6) * 3;
        spec.stars = 3 + Math.round(ramp * 2);
        spec.mult = Object.assign({}, spec.mult, {
          hp: 1.22 + ramp * .78,
          atk: .86 + ramp * .19,
          def: 1.03 + ramp * .17,
          mdef: 1.03 + ramp * .17
        });
      }
      return spec;
    });
  },

  makeUnknownWorldFoe(id, level, wave, index) {
    const waveMult = [1.24, 1.46, 1.7][wave - 1] || 1.24;
    const depthMult = 1 + Math.max(0, level - 44) * .0022;
    return { id, name: HEROES[id].name, level, stars: 5, rarity: 5, rarityPlus: 18,
      skillLv: clamp(Math.round(level * 1.08), 45, 420), kind: 'elite', elite: true,
      mult: { hp: waveMult * depthMult, atk: (1.32 + wave * .07) * depthMult, mag: (1.34 + wave * .07) * depthMult,
        def: (1.18 + wave * .05) * depthMult, mdef: (1.20 + wave * .05) * depthMult },
      artSrc: UNKNOWN_WORLD_ART[id], twisted: false, unknownWorld: true, formationLine: index % 3, encounterOnly: true };
  },

  makeBigWigFoe(level) {
    return { id: 'BigWig', name: 'Big Wig', level, stars: 6, rarity: 6, rarityPlus: 30,
      skillLv: clamp(Math.round(level * 1.42), 260, 650), kind: 'boss', boss: { id: 'BigWig', title: 'Big Wig', phases: [
        { at: 1, name: 'Court Opens', mods: { dmgTaken: -.10 } },
        { at: .72, name: 'Contempt of Court', mods: { atkP: .28, magP: .28, cdr: .20, dmgTaken: -.13 }, onEnter: (u, B) => {
          B.energy(u, 100); B.shield(u, u, u.max.hp * .12, 10);
          B.playerTeam().forEach(t => { if (t.alive) B.applyStatus(u, t, 'convicted', 6); });
        } },
        { at: .46, name: 'Appeal Denied', mods: { atkP: .48, magP: .48, cdr: .36, defP: .22, mdefP: .22, dmgTaken: -.18 }, onEnter: (u, B) => {
          B.energy(u, 100); B.shield(u, u, u.max.hp * .16, 12);
          B.playerTeam().forEach(t => { if (t.alive) B.applyStatus(u, t, 'silence', 2.1); });
        } },
        { at: .22, name: 'Court Is in Session', mods: { atkP: .72, magP: .72, cdr: .52, defP: .34, mdefP: .34, dmgTaken: -.24 }, onEnter: (u, B) => {
          B.energy(u, 100); B.shield(u, u, u.max.hp * .20, 14);
          B.playerTeam().forEach(t => { if (t.alive) { B.applyStatus(u, t, 'convicted', 9); B.applyStatus(u, t, 'slow', 5); } });
        } }
      ] }, elite: true,
      // The boss is a late-event wall, not just a larger machine. The old
      // curve let a developed team burst through him before his legal-lockdown
      // kit had time to cycle. Durability and output now rise together with the
      // stage level, while the event-only enemy skill tempo below makes the
      // kit visible from the opening seconds.
      mult: { hp: 8.8 + level * .012, atk: 3.0 + level * .0045, mag: 3.1 + level * .0045,
        def: 2.35 + level * .003, mdef: 2.4 + level * .003 },
      artSrc: UNKNOWN_WORLD_ART.BigWig, twisted: false, unknownWorld: true, encounterOnly: true, formationLine: 1 };
  },

  makeUnknownWorldWave(level, wave, eventSnapshot) {
    const pools = [
      ['GladHander', 'LegalEagle', 'RobberBaron', 'PencilPusher', 'GladHander', 'PencilPusher'],
      ['LegalEagle', 'RobberBaron', 'GladHander', 'PencilPusher', 'LegalEagle', 'RobberBaron', 'GladHander', 'PencilPusher'],
      ['RobberBaron', 'LegalEagle', 'GladHander', 'PencilPusher', 'RobberBaron', 'LegalEagle', 'GladHander', 'PencilPusher', 'GladHander', 'PencilPusher']
    ];
    const enemies = (pools[wave - 1] || pools[0]).map((id, i) => this.makeUnknownWorldFoe(id, level, wave, i));
    const bossStage = eventSnapshot && eventSnapshot.bigWigStage != null ? eventSnapshot.bigWigStage : 5;
    const stage = eventSnapshot ? this.stageLevels(eventSnapshot).indexOf(level) : -1;
    return wave === 3 && stage >= bossStage ? [this.makeBigWigFoe(level)].concat(enemies.slice(0, 8)) : enemies;
  },

  makeCollabFoes(level, eventSnapshot) {
    const stage = Math.max(0, this.stageLevels(eventSnapshot).indexOf(level));
    const endurance = 2.8 + stage * .42;
    const attack = 1.25 + stage * .07;
    const defense = 1.35 + stage * .06;
    const tune = {
      Sora: { hp: 1, atk: 1.10, def: 1 },
      Riku: { hp: 1.18, atk: .92, def: 1.18 },
      Kairi: { hp: .92, atk: 1.02, def: .96 }
    };
    return ['Riku', 'Sora', 'Kairi'].map(id => ({
      id, name: id + ' · Event Challenger', level, stars: 5, rarity: 5,
      skillLv: clamp(Math.max(120, Math.round(level * 1.08)), 120, 450), kind: 'boss', boss: COLLAB_BOSS_PHASES[id],
      mult: { hp: endurance * tune[id].hp, atk: attack * tune[id].atk, def: defense * tune[id].def },
      artSrc: Art.hero(id), twisted: false, collabBoss: true
    }));
  },

  makeWave(eventId, wave, level, eventSnapshot) {
    const e = eventSnapshot || this.event(eventId);
    if (e.isCookieRun) return CookieRun.wave(wave, level);
    if (e.isQOM) {
      const ids = wave === 1 ? ['QOMGourdy','QOMSoulvester'] : wave === 2 ? ['QOMRibecca','QOMEclipse'] : QOM_IDS;
      const stage = Math.max(0, this.stageLevels(e).indexOf(level));
      return ids.map((id,i) => ({ id, name: HEROES[id].name, level, stars: 4 + (stage >= 4 ? 1 : 0),
        rarity: stage >= 5 ? 5 : stage >= 2 ? 4 : 3, rarityPlus: 3 + Math.min(12,stage*2),
        skillLv: Math.max(35,Math.round(level*1.03)), kind: wave === 3 ? 'boss' : 'elite', elite: wave !== 3,
        mult: { hp: wave === 3 ? .94 + stage*.11 : 1.3 + stage*.12,
          atk: .84 + stage*.065, mag: .84 + stage*.065, def: 1.02 + stage*.05, mdef: 1.02 + stage*.05 },
        artSrc: Art.hero(id), twisted: false, formationLine: id === 'QOMGourdy' || id === 'QOMConnie' ? 2 : 0,
        encounterOnly: true }));
    }
    if (e.isCollab) return this.makeCollabFoes(level, e);
    if (e.isUnknownWorld) return this.makeUnknownWorldWave(level, wave, e);
    if (wave === 3) {
      const bosses = this.makeFoes(eventId, level, e);
      if (e.bossIds.includes('Delilah') || e.kind === 'group') return bosses;
      const rng = seeded('event-wave-boss-adds-' + e.id);
      const pool = TWISTED_IDS.filter(id => HEROES[id] && !EVENT_ONLY_TWISTED.has(id) && !e.bossIds.includes(id));
      const adds = rng.pickN(pool, 2).map(id => makeTwisted(id, Math.max(1, Math.round(level * .78)), 'elite'));
      return bosses.concat(adds);
    }

    if (e.bossIds.includes('Delilah') && wave === 2) {
      return ['Scraps', 'Goob', 'Poppy', 'Toodles'].map(id => makeTwisted(id, Math.max(1, Math.round(level * .88)), 'elite'));
    }

    const rng = seeded('event-wave-' + e.id + '-' + wave);
    const pool = TWISTED_IDS.filter(id => HEROES[id] && !EVENT_ONLY_TWISTED.has(id) && !e.bossIds.includes(id));
    const dangerous = ELITE_TWISTED.filter(id => pool.includes(id));
    const source = wave === 2 && dangerous.length >= 5 ? dangerous : pool;
    const ids = Depths.compose(rng, source, wave === 1 ? 4 : 5, wave === 1 ? 8 : 18);
    return ids.map(id => makeTwisted(id, Math.max(1, Math.round(level * (wave === 1 ? .70 : .88))), wave === 1 ? 'normal' : 'elite'));
  },

  equipWave(specs, eventId, wave, level) {
    const depth = Math.max(12, Math.round(level / 3));
    return specs.map((spec, i) => HEROES[spec.id]?.noDamage ? spec : equipEnemyLoadout(spec, depth,
      seeded(`event-loadout:${eventId}:${wave}:${level}:${i}`), {
        trinketCount: Math.max(1, level >= 650 ? 3 : level >= 350 ? 2 : level >= 120 ? 1 : 0),
        rank: clamp(1 + Math.floor(level / 180), 1, TRINKET_MAX_RANK),
        badgeChance: level >= 650 ? .92 : level >= 350 ? .8 : level >= 180 ? .45 : .15,
        badgeLvl: clamp(1 + Math.floor(level / 110), 1, BADGE_MAX_LVL)
      }));
  },

  recordClear(id, stage) {
    const r = this.state();
    if (!this.stageUnlocked(id, stage)) return false;
    this.clearRecord(id)[stage] = true;
    r.stages[id] = Math.max(r.stages[id] || 0, Math.min(this.STAGES, stage + 1));
    Save.write();
    return true;
  },
  resolve(id, win, eventSnapshot, stage) {
    if (!win || !this.recordClear(id, stage)) return 0;
    const e = eventSnapshot || this.event(id);
    const amount = this.tokenReward(e, stage);
    const r = this.state();
    if (e.isCookieRun) CookieRun.state().cutters += amount;
    else if (e.isPhantasia) r.phantasiaCoins += amount;
    else if (e.isQOM) r.qomPasses += amount;
    else if (e.isUnknownWorld) r.unknownWorldGears += amount;
    else r.tokens += amount;
    Save.write();
    return amount;
  },
  buyShards(eventId, heroId, quantity = 1) {
    const e = this.events().find(x => x.id === eventId);
    const unitAmount = masteryRewardValue(e && e.isQOM ? 7 : e && e.isPhantasia ? 5 : e && e.isCollab ? 3 : this.SHOP_BUNDLE);
    const unitCost = e && e.isQOM ? 24 : e && e.isPhantasia ? 38 : e && e.isCollab ? (heroId === 'Sora' ? 18 : 15) : this.SHOP_BUNDLE;
    const count = Math.max(1, Math.floor(Number(quantity) || 1));
    const amount = unitAmount * count;
    const cost = unitCost * count;
    if (!e || !e.featuredIds.includes(heroId)) return { ok: false, reason: 'That offer is no longer active.' };
    const r = this.state();
    if (this.currency(e) < cost) return { ok: false, reason: e.isQOM ? 'Not enough Backstage Passes.' : e.isPhantasia ? 'Not enough Wish Coins.' : 'Not enough Event Tokens.' };
    if (e.isPhantasia) r.phantasiaCoins -= cost;
    else if (e.isQOM) r.qomPasses -= cost;
    else r.tokens -= cost;
    const result = Save.giveShards(heroId, amount);
    Save.write();
    return { ok: true, result, amount, cost };
  },
  shardOffer(e, heroId) {
    return e && e.isQOM ? { amount: masteryRewardValue(7), cost: 24 } : e && e.isPhantasia ? { amount: masteryRewardValue(5), cost: 38 } : e && e.isCollab ? { amount: masteryRewardValue(3), cost: heroId === 'Sora' ? 18 : 15 } : { amount: masteryRewardValue(this.SHOP_BUNDLE), cost: this.SHOP_BUNDLE };
  },
  phantasiaOffers() {
    return [
      { id: 'phantasia-shards', name: 'Phantasia Shards', desc: '+5 shards toward unlocking or promoting Phantasia.', icon: '🌈', cost: 38 },
      { id: 'unicorn-emblem', name: 'Unicorn Emblem', desc: 'Phantasia’s signature Trinket · Rank 1.', img: trinketIcon('phantasia_unicornemblem'), cost: 240, unique: true },
      { id: 'wish-ichor', name: 'Black Ichor', desc: '+1,500 Black Ichor.', icon: RES.ichor.icon, cost: 32, gain: masteryRewardBundle({ ichor: 1500 }) },
      { id: 'wish-exp', name: 'EXP Bottles', desc: '+2,400 Hero EXP.', icon: RES.exp.icon, cost: 34, gain: masteryRewardBundle({ exp: 2400 }) },
      { id: 'wish-tape', name: 'Field Tape', desc: '+30 Tape.', icon: '📼', cost: 28, gain: masteryRewardBundle({ tape: 30 }) },
      { id: 'wish-notes', name: 'Skill Notes', desc: '+24 Skill Notes.', icon: '✦', cost: 28, gain: masteryRewardBundle({ notes: 24 }) },
      { id: 'wish-star', name: 'Star Dust', desc: '+40 Star Dust.', icon: '⭐', cost: 36, gain: masteryRewardBundle({ star: 40 }) },
      { id: 'wish-manual', name: 'Training Manuals', desc: '+10 Training Manuals.', icon: '📘', cost: 42, gain: masteryRewardBundle({ manual: 10 }) },
      { id: 'wish-core', name: 'Rarity Core', desc: '+1 Rarity Core.', icon: '🔩', cost: 72, gain: masteryRewardBundle({ core: 1 }) },
      { id: 'wish-gold', name: 'Gold Crate', desc: '+1 Gold Crate.', icon: '📦', cost: 110, gain: masteryRewardBundle({ gold: 1 }) }
    ];
  },
  unknownWorldOffers() {
    return [
      { id: 'badge_of_law', name: 'Badge of the Law', desc: 'Big Wig’s law badge · defenses, Energy, and Convicted pressure.', img: trinketIcon('badge_of_law'), cost: 320, unique: true },
      { id: 'badge_of_the_market', name: 'Badge of the Market', desc: 'Glad Hander’s market badge · damage and Energy from debuffs.', img: trinketIcon('badge_of_the_market'), cost: 260, unique: true },
      { id: 'badge_of_money', name: 'Badge of the Money', desc: 'Robber Baron’s money badge · Max HP, Shields, and profitable exchanges.', img: trinketIcon('badge_of_money'), cost: 280, unique: true },
      { id: 'badge_of_the_boss', name: 'Badge of the Boss', desc: 'The top-file badge · defenses, Skill Haste, and debuff pressure.', img: trinketIcon('badge_of_the_boss'), cost: 360, unique: true },
      { id: 'unknown_exp', name: 'EXP Bottles', desc: '+3,000 Hero EXP.', icon: RES.exp.icon, cost: 34, gain: masteryRewardBundle({ exp: 3000 }) },
      { id: 'unknown_core', name: 'Rarity Core', desc: '+1 Rarity Core.', icon: '🔩', cost: 80, gain: masteryRewardBundle({ core: 1 }) },
      { id: 'unknown_manual', name: 'Training Manuals', desc: '+12 Training Manuals.', icon: '📘', cost: 48, gain: masteryRewardBundle({ manual: 12 }) }
    ];
  },
  qomTrinketOffers() {
    return [
      { id: 'qom_gourdy_drums', name: 'Gourdy’s Drums', desc: 'Skill casts advance the team’s rhythm with Energy and Haste.', cost: 300 },
      { id: 'qom_eclipse_guitar', name: 'Eclipse’s Guitar', desc: 'Repeated Basics send slowing soundwaves through the enemy team.', cost: 320 },
      { id: 'qom_soulvester_sword', name: 'Soulvester’s Sword', desc: 'Intercepts a hit against an ally and strikes back.', cost: 290 },
      { id: 'qom_ribecca_keytar', name: 'Ribecca’s Keytar', desc: 'An ally taking damage triggers protective team barriers.', cost: 330 },
      { id: 'qom_connie_guitar', name: 'Connie’s Guitar', desc: 'Skill casts unleash a spectral chord and haunt foes.', cost: 340 }
    ].map(item => ({ ...item, img: trinketIcon(item.id) }));
  },
  buyQomTrinketOffer(id) {
    const offer = this.qomTrinketOffers().find(x => x.id === id), r = this.state();
    if (!offer) return { ok: false, reason: 'That backstage offer is gone.' };
    if (Save.ownsTrinket(id)) return { ok: false, reason: 'You already own that Trinket.' };
    if ((r.qomPasses || 0) < offer.cost) return { ok: false, reason: 'Not enough Backstage Passes.' };
    r.qomPasses -= offer.cost;
    const result = Save.addTrinketCopy(id, 1);
    Save.write(); UI.refreshBar(true);
    return { ok: true, result, offer };
  },
  buyUnknownWorldOffer(id) {
    const offer = this.unknownWorldOffers().find(x => x.id === id), r = this.state();
    if (!offer) return { ok: false, reason: 'That Gear Workshop offer is gone.' };
    if (offer.unique && Save.ownsTrinket(offer.id)) return { ok: false, reason: 'You already own that superior Trinket.' };
    if ((r.unknownWorldGears || 0) < offer.cost) return { ok: false, reason: 'Not enough Gears.' };
    r.unknownWorldGears -= offer.cost;
    const result = offer.unique ? Save.addTrinketCopy(offer.id, 1) : (Save.give(offer.gain, true), 'done');
    Save.write(); UI.refreshBar(true);
    return { ok: true, result, offer };
  },
  buyPhantasiaOffer(id) {
    const offer = this.phantasiaOffers().find(x => x.id === id);
    if (!offer) return { ok: false, reason: 'That Wishbound offer is gone.' };
    const r = this.state();
    if (offer.unique && Save.ownsTrinket('phantasia_unicornemblem')) return { ok: false, reason: 'You already own the Unicorn Emblem.' };
    if (r.phantasiaCoins < offer.cost) return { ok: false, reason: 'Not enough Wish Coins.' };
    r.phantasiaCoins -= offer.cost;
    let result = 'done';
    if (offer.id === 'phantasia-shards') result = Save.giveShards('Phantasia', offer.amount || 5);
    else if (offer.unique) result = Save.addTrinketCopy('phantasia_unicornemblem', 1);
    else Save.give(offer.gain, true);
    Save.write(); UI.refreshBar(true);
    return { ok: true, result, offer };
  }
};

/* ============================================================ SHARED PAYOUT */
/* Called after every winning battle anywhere in the game, so a single fight
   feeds heroes, the pass and mastery at once. */
function battleShardPayout(teamIds) {
  const ids = [...new Set((teamIds || []).filter(id => id && HEROES[id] && Save.owns(id)))];
  if (!ids.length) return null;
  const cursor = Math.max(0, Math.floor(Number(Save.data.battleShardTurn) || 0));
  const id = ids[cursor % ids.length];
  Save.data.battleShardTurn = cursor + 1;
  const mastery = clamp(Math.floor(Number(Save.data.mastery) || 1), 1, 800);
  // The active team shares one rotating shard payout. Mastery grows it from
  // 1 shard at the start to 4 shards at the current cap without duplicating
  // the reward across every Hero in a five-person formation.
  const amount = Math.min(4, 1 + Math.floor(Math.sqrt(mastery) / 9));
  const result = Save.giveShards(id, amount);
  UI.toast('◈ ' + HEROES[id].name + ' +' + amount + ' shards');
  return { id, amount, result };
}
function payoutBattle(teamIds, rewards, opt) {
  opt = opt || {};
  // Shop refreshes should be a normal part of playing, not a rare monetized
  // resource. Every successful battle pays one, regardless of the mode.
  const battleRewards = Object.assign({ counterToken: masteryRewardValue(1) }, rewards || {});
  Save.give(battleRewards);
  battleShardPayout(teamIds);
  let levelsGained = 0;
  teamIds.filter(Boolean).forEach(id => {
    const h = Save.hero(id);
    if (h) h.battles = (h.battles || 0) + 1;
    if (h && h.level < Progress.levelCap()) {
      // heroes gain a little level progress just from fighting
      const e = Math.round((battleRewards.exp || 200) * .25);
      h.exp = (h.exp || 0) + e;
      while (h.level < Progress.levelCap() && h.exp >= levelExp(h.level)) {
        h.exp -= levelExp(h.level); h.level++;
        levelsGained++;
        UI.toast('⬆ ' + HEROES[id].name + ' Lv ' + h.level);
      }
    }
  });
  Save.addMasteryXp((opt.mastery || 60) + levelsGained * 3);
  Achievements.record('battleWin', 1);
  Achievements.recordBattleTeam(teamIds);
  if (levelsGained) Achievements.record('heroLevel', levelsGained);
  Pass.addXp(opt.pass || 45);
  Daily.recordWin();
  Save.write();
}
