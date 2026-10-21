/* screens/depths.js - the Endless Run screen: floor view, node entry,
   the battle launch for a Depths room, and the three non-combat node types
   (Event, Treasure, Rest). Extends Screens (screens/core.js). */
'use strict';

/* Canonical Dandy's World Toon Stat Registry (1★ to 5★ ratings) */
const DW_TOON_STATS = {
  Vee:        { extraction: 5, skill: 5, speed: 2, stamina: 2, stealth: 3, role: 'Master Extractor' },
  Shelly:     { extraction: 5, skill: 5, speed: 2, stamina: 2, stealth: 2, role: 'Master Extractor' },
  Delilah:    { extraction: 5, skill: 5, speed: 2, stamina: 2, stealth: 2, role: 'Master Extractor' },
  Boxten:     { extraction: 4, skill: 4, speed: 3, stamina: 3, stealth: 3, role: 'Reliable Extractor' },
  Cosmo:      { extraction: 4, skill: 4, speed: 3, stamina: 3, stealth: 2, role: 'Baker Extractor' },
  Sprout:     { extraction: 4, skill: 4, speed: 3, stamina: 3, stealth: 3, role: 'Support Extractor' },
  Brightney:  { extraction: 4, skill: 4, speed: 3, stamina: 3, stealth: 1, role: 'Illuminator' },
  Rodger:     { extraction: 4, skill: 5, speed: 2, stamina: 2, stealth: 2, role: 'Lead Researcher' },
  Connie:     { extraction: 4, skill: 3, speed: 3, stamina: 3, stealth: 5, role: 'Silent Operative' },
  Bassie:     { extraction: 4, skill: 4, speed: 2, stamina: 2, stealth: 2, role: 'Steady Extractor' },
  Eggson:     { extraction: 4, skill: 4, speed: 2, stamina: 2, stealth: 3, role: 'Methodical Extractor' },
  Dyle:       { extraction: 4, skill: 3, speed: 2, stamina: 3, stealth: 2, role: 'Heavy Extractor' },
  Gigi:       { extraction: 3, skill: 4, speed: 3, stamina: 3, stealth: 4, role: 'Lucky Gambler' },
  Glisten:    { extraction: 3, skill: 4, speed: 3, stamina: 3, stealth: 2, role: 'Perfectionist' },
  Teagan:     { extraction: 3, skill: 4, speed: 3, stamina: 3, stealth: 3, role: 'Patient Tea Host' },
  Astro:      { extraction: 3, skill: 3, speed: 3, stamina: 4, stealth: 4, role: 'Dream Support' },
  Dandy:      { extraction: 3, skill: 3, speed: 3, stamina: 3, stealth: 3, role: 'Star Host' },
  Coal:       { extraction: 3, skill: 3, speed: 3, stamina: 3, stealth: 3, role: 'Steady Worker' },
  Cocoa:      { extraction: 3, skill: 3, speed: 3, stamina: 3, stealth: 3, role: 'Sweet Runner' },
  Bobette:    { extraction: 3, skill: 3, speed: 3, stamina: 3, stealth: 3, role: 'Precision Crafter' },
  Ginger:     { extraction: 3, skill: 3, speed: 3, stamina: 3, stealth: 3, role: 'Festive Runner' },
  Brusha:     { extraction: 3, skill: 3, speed: 3, stamina: 3, stealth: 3, role: 'Painter' },
  Looey:      { extraction: 3, skill: 3, speed: 3, stamina: 3, stealth: 3, role: 'Juggler' },
  Squirm:     { extraction: 3, skill: 3, speed: 3, stamina: 3, stealth: 3, role: 'Energetic Buddy' },
  Gourdy:     { extraction: 3, skill: 3, speed: 3, stamina: 3, stealth: 3, role: 'Candy Sprinter' },
  Eclipse:    { extraction: 3, skill: 3, speed: 3, stamina: 3, stealth: 3, role: 'Solar/Lunar Operator' },
  Soulvester: { extraction: 3, skill: 3, speed: 3, stamina: 3, stealth: 3, role: 'Knight Runner' },
  Finn:       { extraction: 3, skill: 3, speed: 4, stamina: 3, stealth: 2, role: 'Swift Swimmer' },
  Yatta:      { extraction: 3, skill: 3, speed: 4, stamina: 3, stealth: 3, role: 'Party Sprinter' },
  Flyte:      { extraction: 3, skill: 3, speed: 4, stamina: 3, stealth: 4, role: 'Sky Flyer' },
  Flutter:    { extraction: 2, skill: 3, speed: 4, stamina: 3, stealth: 3, role: 'Winged Scout' },
  Poppy:      { extraction: 2, skill: 3, speed: 5, stamina: 4, stealth: 3, role: 'Champion Sprinter' },
  Goob:       { extraction: 2, skill: 3, speed: 5, stamina: 4, stealth: 2, role: 'Speed Hugger' },
  Scraps:     { extraction: 2, skill: 3, speed: 4, stamina: 4, stealth: 3, role: 'Agile Crafter' },
  Toodles:    { extraction: 2, skill: 2, speed: 4, stamina: 3, stealth: 4, role: 'Nimble Toddler' },
  Blot:       { extraction: 2, skill: 3, speed: 4, stamina: 4, stealth: 2, role: 'Inky Rusher' },
  Rudie:      { extraction: 2, skill: 2, speed: 4, stamina: 4, stealth: 3, role: 'Charging Rusher' },
  Shrimpo:    { extraction: 1, skill: 1, speed: 1, stamina: 1, stealth: 1, role: 'Angriest Bully' }
};
if (typeof window !== 'undefined') window.DW_TOON_STATS = DW_TOON_STATS;

function getDwFallback(id) {
  const d = typeof HEROES !== 'undefined' ? HEROES[id] : null;
  if (!d) return { extraction: 3, skill: 3, speed: 3, stamina: 3, stealth: 3, role: 'Operative' };
  const spd = (d.base && d.base.spd) || 80;
  const acc = (d.base && d.base.acc) || 100;
  const ms = (d.hidden && d.hidden.ms) || 70;
  return {
    extraction: clamp(Math.round(spd / 28), 1, 5),
    skill: clamp(Math.round(acc / 35), 1, 5),
    speed: clamp(Math.round(ms / 20), 1, 5),
    stamina: 3, stealth: 3, role: 'Operative'
  };
}

function machineStars(actual, expected) {
  const ratio = actual / Math.max(1, expected);
  if (ratio >= 1.25) return 5;
  if (ratio >= 1.10) return 4;
  if (ratio >= .95) return 3;
  if (ratio >= .80) return 2;
  return 1;
}

function machineToonStats(id, floor, node, machineType = 'ichor') {
  const h = (typeof Save !== 'undefined' && Save.hero(id)) || { level: 1, rarity: 1, rarityPlus: 1 };
  const d = (typeof HEROES !== 'undefined' && HEROES[id]) || { name: id };
  const canon = DW_TOON_STATS[id] || getDwFallback(id);
  const isTreadmill = machineType === 'treadmill';

  // Roguelite progression bonuses: Toon level and rarity scale effective performance
  const lvl = Math.max(1, h.level || 1);
  const lvlBonus = (lvl - 1) / 29; // 0.0 at Lv 1 -> 1.0 at Lv 30
  const rRank = typeof rarityRank === 'function' ? rarityRank(h.rarity, h.rarityPlus) : 1;
  const rBonus = Math.max(0, (rRank - 1) / 18);

  // Floor difficulty pressure: deeper floors demand higher performance
  const f = Math.max(1, floor || 1);
  const floorPressure = (f - 1) * 0.025;

  // Effective Stars (bounded 1 to 5)
  const extractionStars = clamp(Math.round(canon.extraction + lvlBonus * 0.65 + rBonus * 0.4 - floorPressure * 0.35), 1, 5);
  const skillStars = clamp(Math.round(canon.skill + lvlBonus * 0.55 + rBonus * 0.35 - floorPressure * 0.3), 1, 5);
  const speedStars = clamp(Math.round(canon.speed + lvlBonus * 0.75 + rBonus * 0.45 - floorPressure * 0.35), 1, 5);

  // Raw numerical ratings for stat display and comparisons
  const rawExtraction = Math.round(canon.extraction * 24 + lvl * 1.5 + rRank * 2);
  const rawSkill = Math.round(canon.skill * 24 + lvl * 1.2 + rRank * 1.8);
  const rawSpeed = Math.round(canon.speed * 24 + lvl * 1.6 + rRank * 2.2);

  const expectedExtraction = Math.round(72 + f * 2.2);
  const expectedSkill = Math.round(72 + f * 1.8);
  const expectedSpeed = Math.round(72 + f * 2.2);

  let rate, primaryStars, primaryLabel, primaryVal, expectedPrimary, secondaryStars, secondaryLabel, secondaryVal, expectedSecondary, rateDesc, windowDesc;

  if (isTreadmill) {
    // TREADMILL GENERATOR: Relies directly on RUN SPEED (Movement Speed)
    primaryStars = speedStars;
    primaryLabel = 'RUN SPEED';
    primaryVal = rawSpeed;
    expectedPrimary = expectedSpeed;

    secondaryStars = skillStars;
    secondaryLabel = 'CADENCE CHECK';
    secondaryVal = rawSkill;
    expectedSecondary = expectedSkill;

    // Treadmill rate: speed stars drive generator charging velocity
    rate = 4.8 + speedStars * 2.85 + (lvlBonus * 2.2);
    rateDesc = `${rate.toFixed(1)}% charge / sec · ${speedStars >= 5 ? 'blistering sprint' : speedStars >= 4 ? 'high velocity run' : speedStars >= 3 ? 'steady running pace' : 'slow jog'}`;
    windowDesc = `${skillStars >= 4 ? 'wide cadence zone' : skillStars >= 3 ? 'standard cadence zone' : 'tight cadence zone'}`;
  } else {
    // ICHOR EXTRACTION: Relies directly on EXTRACTION SPEED
    primaryStars = extractionStars;
    primaryLabel = 'EXTRACTION SPEED';
    primaryVal = rawExtraction;
    expectedPrimary = expectedExtraction;

    secondaryStars = skillStars;
    secondaryLabel = 'SKILL CHECK';
    secondaryVal = rawSkill;
    expectedSecondary = expectedSkill;

    // Ichor rate: extraction stars drive siphon pump
    rate = 5.2 + extractionStars * 2.45 + (lvlBonus * 1.8);
    rateDesc = `${rate.toFixed(1)}% tank / sec · ${extractionStars >= 5 ? 'master siphon' : extractionStars >= 4 ? 'rapid extraction' : extractionStars >= 3 ? 'standard extraction' : 'slow drip'}`;
    windowDesc = `${skillStars >= 4 ? 'wide check windows' : skillStars >= 3 ? 'standard check windows' : 'tight check windows'}`;
  }

  const floorLevel = typeof Depths !== 'undefined' && Depths.enemyLevel
    ? Depths.enemyLevel(f, Math.max(0, node || 0))
    : f;

  return {
    h, d, canon, role: canon.role, machineType, isTreadmill, floorLevel,
    primaryStars, primaryLabel, primaryVal, expectedPrimary,
    secondaryStars, secondaryLabel, secondaryVal, expectedSecondary,
    extractionStars, skillStars, speedStars,
    rawExtraction, rawSkill, rawSpeed,
    expectedExtraction, expectedSkill, expectedSpeed,
    speed: primaryVal, expectedSpeed: expectedPrimary,
    accuracy: secondaryVal, expectedAccuracy: expectedSecondary,
    rate, rateDesc, windowDesc
  };
}

Object.assign(Screens, {

  /* ============================================================ ENDLESS RUN */
  depths(s) {
    const recoveredReward = this.repairDandysBudsRun();
    if (recoveredReward) {
      this.go('home', { skipDepthExit: true, silent: true });
      setTimeout(() => this.openBudReward(recoveredReward), 0);
      return;
    }
    const r = Depths.run();
    const enteringVisit = !this._depthsInView;
    this._depthsInView = true;
    const L = Depths.layout();
    const eventCalc = L.eventCalc || Depths.eventAppearance(r.floor);
    const eventCount = L.nodes.filter(type => type === 'event').length;
    const activeType = L.nodes[r.node] || 'battle';
    const battleType = r.forceElite && activeType === 'battle' ? 'elite' : activeType;
    const activeInfo = NODE[battleType] || NODE[activeType] || NODE.battle;
    const isCombat = ['battle', 'elite', 'boss'].includes(battleType);
    const previewFoes = isCombat ? Depths.makeEnemies(r.floor, r.node, battleType) : [];
    const knownRooms = r.node + (r.scouted || 0);
    const ownedCards = Object.keys(r.cards || {}).filter(id => r.cards[id] && DEPTH_CARDS[id]);
    const cardFan = ownedCards.slice(-4).map((id, i) =>
      `<img src="${DEPTH_CARDS[id].icon}" style="--i:${i}" alt="">`).join('');
    const team = Save.data.team.filter(Boolean);
    const livingTeam = team.filter(id => r.hp[id] == null || r.hp[id] > 0);
    const canEnterCombat = !isCombat || livingTeam.length > 0;
    const runPct = Math.round(((r.node + 1) / L.nodes.length) * 100);
    const modIds = L.mods.filter(id => !r.clearMods);
    const averageLevel = team.length ? Math.round(sum(team.map(id => Save.hero(id).level)) / team.length) : 0;
    const enemyLevel = Depths.enemyLevel(r.floor, r.node);
    const teamPower = Progress.teamPower(team);
    const recommendedPower = Progress.recommendedPower(enemyLevel, {
      factor: battleType === 'boss' ? 1.25 : battleType === 'elite' ? 1.12 : 1
    });
    const underRecommended = isCombat && teamPower < recommendedPower;
    const freeSkipInfo = Depths.freeSkipInfo();
    const ratio = enemyLevel / Math.max(1, averageLevel);
    const threat = battleType === 'boss' ? 'APEX' : battleType === 'elite' ? 'LETHAL'
      : ratio > 1.18 ? 'LETHAL' : ratio > .92 ? 'SEVERE' : ratio > .72 ? 'HIGH' : 'GUARDED';
    const zoneTier = r.floor >= 31 ? 3 : r.floor >= 16 ? 2 : r.floor >= 7 ? 1 : 0;
    const zone = [
      { name: 'GARDEN ACCESS', state: 'ALL CLEAR', icon: '✓' },
      { name: 'LOWER HALLS', state: 'STAY SHARP', icon: '!' },
      { name: 'DANGER DECK', state: 'HIGH RISK', icon: '▲' },
      { name: 'RED ZONE', state: 'RED ALERT', icon: '◆' }
    ][zoneTier];
    const zoneWords = zone.name.split(' ');
    const zoneLead = zoneWords.shift();
    const zoneAccent = zoneWords.join(' ');
    const activeMachineVariant = Depths.roomRng(r.floor, r.node, 'machine_variant').chance(0.5) ? 'treadmill' : 'ichor';
    const isTreadmillRoom = activeMachineVariant === 'treadmill';
    const roomCopy = {
      battle: ['HOSTILE CONTACT', 'A Twisted squad blocks the shaft. Damage carries into the next room.'],
      elite: ['ELITE INTERCEPT', 'A reinforced squad with higher stats and no weaklings.'],
      boss: ['BOSS LOCKDOWN', 'A phased boss and its escort. Expect the room to escalate.'],
      event: ['UNKNOWN SIGNAL', 'A decision waits beyond the door. Outcomes may injure the whole squad.'],
      treasure: ['SUPPLY CACHE', 'No hostiles detected. Claim the cache and choose a run card.'],
      rest: ['SAFE ROOM', 'Recover part of the squad. This is not a full heal.'],
      machine: isTreadmillRoom
        ? ['TREADMILL GENERATOR', 'An industrial extraction treadmill waits in the chamber. Send your fastest runner to power it up!']
        : ['ICHOR MACHINE', 'A classic extraction machine hums in the corner. Send a skilled extractor to work it.']
    }[battleType] || ['UNMAPPED ROOM', 'No reliable scan is available.'];
    const nextStep = r.pendingDraft
      ? ['1', 'Choose a run card', 'Then the elevator can move.']
      : isCombat
        ? canEnterCombat
          ? ['1', 'Review your team, then enter', 'Battle runs automatically.']
          : ['!', 'Edit your team or recover', 'Swap in a healthy Toon, use a Safe Room, or redeploy.']
        : ['1', `Open the ${String(activeInfo.label || 'room').toLowerCase()}`, 'Follow the room prompt, then continue.'];
    const enterLabel = r.pendingDraft ? 'CHOOSE RUN CARD' : isCombat
      ? canEnterCombat ? 'REVIEW TEAM & ENTER' : 'RECOVER TEAM FIRST'
      : battleType === 'machine'
        ? (isTreadmillRoom ? 'OPEN TREADMILL ROOM' : 'OPEN ICHOR MACHINE')
        : 'OPEN ' + String(activeInfo.label || 'ROOM').toUpperCase();

    const page = el('div', `endless-page redzone-tier-${zoneTier}`);
    const buds = Save.data.buds || {};
    const budStage = Depths.budStage(r.floor);
    const budActive = !!budStage;
    const budLesson = {
      1: ['STARTER SQUAD', 'Poppy and Boxten are ready for this lesson. Learn the rooms, then recruit a third buddy.'],
      2: ['THREE BUDDIES', `${buds.chosen || 'Your new Toon'} joins the starter pair. Clear this floor to choose a first Trinket.`],
      3: ['GROWING STRONGER', 'Use your three-Toon squad one more time, then choose the supplies that fit your next step.']
    }[budStage];
    page.style.setProperty('--depth-danger', Math.min(1, Math.max(0, (r.floor - 1) / 35)).toFixed(2));
    page.innerHTML = `
      <section class="endless-hero">
        <div class="redzone-backdrop" aria-hidden="true"><i></i><i></i><i></i><i></i></div>
        <div class="redzone-lift-shadow" aria-hidden="true"></div>
        <div class="redzone-lift" aria-hidden="true">
          <span class="redzone-lift-light"></span><span class="redzone-lift-cable"></span>
          <div class="redzone-lift-face"><i>${zone.icon}</i><b>${String(r.floor).padStart(2, '0')}</b></div>
          <div class="redzone-lift-doors"><i></i><i></i></div>
          <small>RZ</small>
        </div>
        <div class="redzone-arrival-fx" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i></div>
        <div class="endless-hero-top"><span>GARDENVIEW DESCENT // ${String(r.floor).padStart(3, '0')}</span><b>${zone.state}</b></div>
        <div class="endless-title"><small>SECTOR ${String(zoneTier + 1).padStart(2, '0')}</small>
          <h1>${zoneLead} <b>${zoneAccent}</b></h1></div>
        <div class="endless-floor-stamp"><small>CURRENT FLOOR</small><b>${r.floor}</b>
          <span>DEPTH RECORD ${Math.max(Save.data.bestFloor || 0, r.floor - 1)}</span></div>
        <div class="endless-alarm" aria-hidden="true"></div>
      </section>

      <section class="endless-command">
        <div class="endless-command-head"><div><small>NEXT ROOM // ${r.node + 1} OF ${L.nodes.length}</small>
          <b>${r.pendingDraft ? 'CARD DRAFT WAITING' : roomCopy[0]}</b></div>
          <span class="endless-pulse threat-${threat.toLowerCase()}">${r.pendingDraft ? 'CHOICE' : threat}</span></div>
        <p>${r.pendingDraft ? 'Choose one card before the elevator can move.' : roomCopy[1]}</p>
        <div class="endless-next-step"><i>${nextStep[0]}</i><div><small>YOUR NEXT STEP</small><b>${nextStep[1]}</b><span>${nextStep[2]}</span></div></div>
        ${isCombat ? `<div class="endless-power-check${underRecommended ? ' under' : ''}">
          <span><small>YOUR POWER</small><b>${fmt(teamPower)}</b></span><i>/</i>
          <span><small>RECOMMENDED</small><b>${fmt(recommendedPower)}</b></span>
          <em>${underRecommended ? 'UNDER POWER' : 'READY TO FIGHT'}</em>
        </div>` : ''}
        <div class="endless-run-meter"><div><span>FLOOR ${r.floor} · ROOM ${r.node + 1}</span><b>${runPct}%</b></div>
          <i><em style="width:${runPct}%"></em></i></div>
        <div class="endless-command-actions"><button class="endless-enter${!canEnterCombat ? ' blocked' : ''}" id="endlessEnter">
          ${enterLabel} <b>›</b></button>
          <button class="endless-team" id="endlessTeam" aria-label="Edit team"><b>${team.length}/5</b><span>EDIT TEAM</span></button></div>
      </section>

      ${budActive ? DandyCoach.menuCard(budStage, r.node, battleType, L.nodes.length) : ''}

      ${isCombat ? `<section class="endless-threat-card">
        <div class="endless-section-head"><div><small>${isCombat ? 'ENCOUNTER SCAN' : 'ROOM SCAN'}</small>
          <b>${isCombat ? 'Enemies behind the door' : roomCopy[0]}</b></div>
          <span>${isCombat ? `LV ${enemyLevel} · ${previewFoes.length} TARGETS` : 'NO COMBAT'}</span></div>
        <div class="endless-foes" id="endlessFoes">
          ${isCombat ? previewFoes.map((foe, i) => `<button class="endless-foe rarity-border-${foe.rarity || 1}${foe.rarity >= 6 ? ' rarity-rainbow' : ''} ${foe.kind || (foe.weakling ? 'weakling' : 'normal')}" type="button" data-foe="${i}">
            <span class="endless-foe-art"><img src="${foe.artSrc || Art.unit(foe.id, foe.twisted)}" alt=""></span>
            <b>${foe.name}</b><small class="${foe.rarity >= 6 ? 'rarity-rainbow' : ''}">LV ${foe.level} · ${'★'.repeat(foe.stars || 1)} · ${rarityLabel(foe.rarity, foe.rarityPlus)}</small>
            <span class="endless-foe-gear">${enemyLoadoutChips(foe) || '<i>NO GEAR</i>'}</span></button>`).join('')
            : `<div class="endless-room-scan"><strong>${activeInfo.icon}</strong><div><b>${activeInfo.label}</b><span>${roomCopy[1]}</span></div></div>`}
        </div>
        ${isCombat ? `<div class="endless-threat-note"><b>${threat} THREAT</b><span>Tap an enemy for gear details · press and hold for their moveset.</span></div>` : ''}
      </section>` : ''}

      <section class="endless-route-card">
        <div class="endless-section-head"><div><small>FLOOR MAP</small><b>Room path</b></div>
          <span>${knownRooms >= L.nodes.length - 1 ? 'PATH REVEALED' : 'SCOUTED ' + Math.min(knownRooms + 1, L.nodes.length) + ' / ' + L.nodes.length}</span></div>
        <div class="endless-route" id="endlessRoute"></div>
        <div class="endless-event-odds">
          <div><small>EVENT APPEARANCE // FLOOR ${r.floor}</small><b>${eventCalc.consequence ? 'GUARANTEED BOSS' : eventCalc.tutorial ? 'TUTORIAL ROUTE' : Math.round(eventCalc.floorChance * 100) + '% FLOOR CHANCE'}</b></div>
          <span>${eventCalc.consequence ? 'Dandy’s consequence overrides the normal room roll.' : eventCalc.tutorial ? 'Events are disabled during Dandy’s Buds.' : `${eventCount} rolled · ${Math.round(eventCalc.perRoomChance * 100)}% per eligible room · ${eventCalc.eligibleRooms} checks`}</span>
        </div>
        ${modIds.length ? '<div class="endless-mods"><small>FLOOR CONDITIONS</small><div id="endlessMods"></div></div>' : ''}
      </section>

      <section class="endless-build-card" id="endlessDeck">
        <div class="endless-build-fan">${cardFan || '<i>?</i>'}</div>
        <div class="grow"><small>RUN BUILD</small><b>${r.pendingDraft ? 'CARD DRAFT READY' : 'ENDLESS DECK'}</b>
          <span>${Depths.cardCount()} card${Depths.cardCount() === 1 ? '' : 's'} · ${r.rerolls || 0} reroll${r.rerolls === 1 ? '' : 's'}${r.buffs && r.buffs.length ? ' · ' + r.buffs.length + ' event boon' + (r.buffs.length === 1 ? '' : 's') : ''}</span></div>
        <strong>${r.pendingDraft ? 'PICK' : 'VIEW'} ›</strong>
      </section>

      <section class="endless-squad-card">
        <div class="endless-section-head"><div><small>SQUAD VITALS</small><b>Carried health</b></div>
          <span>${team.length} TOON${team.length === 1 ? '' : 'S'}</span></div>
        <div class="endless-squad-list" id="endlessSquad"></div>
      </section>

      <section class="endless-utility">
        <div><small>${budActive ? "DANDY'S BUDS" : 'RUN OVERRIDES'}</small><b>${budActive ? 'Your lesson and regular run are saved separately.' : freeSkipInfo.remaining ? `POWER ASSIST · ${freeSkipInfo.remaining} FREE SKIP FLOOR${freeSkipInfo.remaining === 1 ? '' : 'S'}` : 'Skip ahead or redeploy from a checkpoint.'}</b></div>
        ${budActive ? '' : '<div class="endless-skip-row" id="endlessSkipRow"></div>'}
        <button class="endless-abandon" id="endlessAbandon">${budActive ? 'PAUSE BUDS · SWITCH TOONS' : 'REDEPLOY ELEVATOR · CHOOSE START'}</button>
      </section>`;
    s.appendChild(page);
    if (enteringVisit) {
      page.classList.add('awaiting-intro');
      requestAnimationFrame(() => requestAnimationFrame(() => {
        page.classList.remove('awaiting-intro');
        page.classList.add('entering');
        if (navigator.userActivation && navigator.userActivation.hasBeenActive) Sound.play('endless_enter', { vol: .8, priority: true });
        setTimeout(() => page.classList.remove('entering'), 1550);
      }));
    }

    const route = $('#endlessRoute', page);
    L.nodes.forEach((type, i) => {
      let info = NODE[type] || NODE.battle;
      const known = i <= knownRooms;
      const state = i < r.node ? 'cleared' : i === r.node ? 'current' : known ? 'known' : 'hidden';
      const isTreadmill = type === 'machine' && Depths.roomRng(r.floor, i, 'machine_variant').chance(0.5);
      if (type === 'machine' && isTreadmill) {
        info = { icon: '🏃', label: 'Treadmill' };
      }
      const n = el('button', 'endless-room ' + type + (isTreadmill ? ' treadmill-room' : '') + ' ' + state);
      n.type = 'button'; n.disabled = state !== 'current';
      n.innerHTML = `<span class="endless-room-index">${String(i + 1).padStart(2, '0')}</span>
        <strong>${known ? info.icon : '·'}</strong><b>${known ? info.label : 'UNKNOWN'}</b>
        <small>${state === 'cleared' ? 'CLEARED' : state === 'current' ? 'NEXT' : known ? 'SCOUTED' : 'HIDDEN'}</small>`;
      if (state === 'current') n.onclick = () => { Sound.play('endless_enter', { vol: .62 }); this.enterNode(type, i); };
      route.appendChild(n);
      if (i < L.nodes.length - 1) route.appendChild(el('i', 'endless-route-link'));
    });
    // Keep the actionable room in view when a long scouted path is opened on
    // a phone. The route remains swipeable, but players never have to hunt
    // for the highlighted stop.
    requestAnimationFrame(() => {
      if (window.innerWidth <= 560) {
        const current = $('.endless-room.current', route);
        if (current) current.scrollIntoView({ behavior: 'auto', block: 'nearest', inline: 'center' });
      }
    });

    const mods = $('#endlessMods', page);
    if (mods) modIds.forEach(id => {
      const m = FLOOR_MODS.find(x => x.id === id); if (!m) return;
      const tag = el('button', 'endless-mod', m.icon + ' ' + m.name);
      tag.type = 'button'; tag.onclick = () => UI.toast(m.desc);
      mods.appendChild(tag);
    });

    const squad = $('#endlessSquad', page);
    team.forEach(id => {
      const pct = r.hp[id] == null ? 1 : r.hp[id];
      const row = el('div', 'endless-squad-row');
      row.innerHTML = `<img src="${Art.icon(id)}" alt=""><div class="grow"><b>${HEROES[id].name}</b>
        <span>${pct <= 0 ? 'DOWN' : pct < .35 ? 'CRITICAL' : 'READY'}</span></div>
        <div class="endless-hp"><i style="width:${Math.max(0, pct) * 100}%"></i></div>
        <strong>${pct <= 0 ? 'KO' : Math.round(pct * 100) + '%'}</strong>`;
      squad.appendChild(row);
    });
    if (!team.length) squad.appendChild(el('div', 'endless-empty', 'Set a squad before entering the run.'));

    $$('.endless-foe', page).forEach((node, i) => {
      const foe = previewFoes[i];
      bindEnemyPreview(node, foe, () => UI.toast(`${foe.name} · Lv ${foe.level} · ${foe.stars || 1}★ · Skill Lv ${foe.skillLv || 1} · ${enemyLoadoutText(foe)}`));
    });

    const skipRow = $('#endlessSkipRow', page);
    if (skipRow) {
    const express = el('button', 'endless-skip express', `EXPRESS +5 <span>${RES.elevatorTicket.icon} ${Save.res('elevatorTicket')}</span>`);
    express.type = 'button';
    if (Depths.elevatorTicketBlockReason()) express.classList.add('blocked');
    express.onclick = () => {
      const blocked = Depths.elevatorTicketBlockReason();
      if (blocked) { UI.toast(blocked); Sound.play('ui_err'); return; }
      UI.confirm('Use an Elevator Ticket?',
        'Jump straight to Floor ' + (r.floor + 5) + ' without spending Black Ichor. ' + Depths.skipRewardText(r.floor, 5),
        () => { if (Depths.skipWithElevatortape()) { Sound.play('ui_ok'); this.render(); } });
    };
    skipRow.appendChild(express);
    [1, 5, 10].forEach(n => {
      const cost = Depths.skipCost(r.floor, n), charge = Depths.skipCharge(n);
      const free = freeSkipInfo.remaining >= n;
      const btn = el('button', 'endless-skip' + (free ? ' free' : ''), `+${n} FLOORS <span>${free ? 'FREE' : RES.ichor.icon + ' ' + fmt(cost)}</span>`);
      btn.type = 'button';
      if (Depths.skipBlockReason(n)) btn.classList.add('blocked');
      btn.onclick = () => {
        const blocked = Depths.skipBlockReason(n);
        if (blocked) { UI.toast(blocked); Sound.play('ui_err'); return; }
        UI.confirm('Skip ' + n + ' floor' + (n > 1 ? 's' : '') + '?',
          (free ? 'Power Assist makes this skip free. ' : 'Spend ' + RES.ichor.icon + fmt(charge) + ' Black Ichor to ') + 'jump to Floor ' + (r.floor + n) + '. ' + Depths.skipRewardText(r.floor, n),
          () => { if (Depths.skipAhead(n)) { Sound.play('ui_ok'); this.render(); } });
      };
      skipRow.appendChild(btn);
    });
    }

    $('#endlessEnter', page).onclick = () => {
      Sound.play('endless_enter', { vol: .68 });
      if (isCombat && !canEnterCombat) {
        UI.toast('No healthy Toons are available. Open a Safe Room or redeploy.');
        Sound.play('ui_err');
        return;
      }
      if (r.pendingDraft) this.openDepthDraft(); else this.enterNode(activeType, r.node);
    };
    $('#endlessTeam', page).onclick = () => this.openTeamEditor();
    const deckPanel = $('#endlessDeck', page);
    deckPanel.setAttribute('role', 'button');
    deckPanel.setAttribute('tabindex', '0');
    deckPanel.setAttribute('aria-label', r.pendingDraft ? 'Choose a card for this run' : 'View the Endless Run deck');
    const openDeck = () => r.pendingDraft ? this.openDepthDraft() : this.openDepthDeck();
    deckPanel.onclick = openDeck;
    deckPanel.onkeydown = e => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openDeck(); }
    };
    const dandyAction = $('.buds-menu-coach button', page);
    const dandyCoach = $('.buds-menu-coach', page);
    if (dandyCoach) DandyCoach.point($(dandyCoach.dataset.dandyTarget, page), dandyCoach.dataset.dandyPointer);
    if (dandyAction) dandyAction.onclick = () => {
      Sound.play('ui_ok');
      if (dandyAction.dataset.dandyAction === 'team') $('#endlessTeam', page).click();
      else $('#endlessEnter', page).click();
    };
    $('#endlessAbandon', page).onclick = () => budActive ? this.pauseDandysBuds() : this.openDepthRedeploy();

    // If the browser was refreshed between the first knockout and the end of
    // its battle, restore the queued lesson on the next Buds screen visit.
    if (buds.levelTutorialPending && !this._budsLevelTutorialQueued) {
      this._budsLevelTutorialQueued = true;
      setTimeout(() => {
        this._budsLevelTutorialQueued = false;
        if (this.cur === 'depths') this.openBudsLevelTutorial();
      }, 220);
    }

  },

  leaveDepths(destination) {
    const activeRun = Save.data && Save.data.depth;
    if (activeRun && activeRun.dandyConsequence && !activeRun.dandyConsequenceResolved) return;
    if (this._endlessLeaving) return;
    this._depthChainActive = false;
    this._depthAfterDraft = null;
    this._depthsInView = false;
    const page = $('.endless-page');
    this._endlessLeaving = true;
    if (!$('#modal').hidden) UI.closeModal({ skipHook: true });
    if (!page) {
      this._endlessLeaving = false;
      this.go(destination, { skipDepthExit: true });
      return;
    }
    page.classList.add('leaving');
    Sound.play('ui_back');
    const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
    setTimeout(() => {
      this._endlessLeaving = false;
      this.go(destination, { skipDepthExit: true, silent: true });
    }, reduced ? 40 : 470);
  },

  openDepthRedeploy() {
    if (Save.data.buds && Save.data.buds.state === 'active') { this.pauseDandysBuds(); return; }
    const body = el('div', 'depth-redeploy');
    body.appendChild(el('div', 'depth-redeploy-copy', 'Everything earned stays yours. Your current run cards and carried health are replaced by the new descent.'));
    const choices = el('div', 'depth-redeploy-choices');
    Depths.restartOptions().forEach(option => {
      const button = el('button', 'depth-redeploy-choice ' + option.id);
      button.innerHTML = `<i>${option.icon}</i><span><small>START FLOOR ${option.floor}</small><b>${option.title}</b><em>${option.desc}</em></span><strong>›</strong>`;
      button.onclick = () => UI.confirm('Redeploy to Floor ' + option.floor + '?',
        'Your current run cards and carried health will be replaced. Everything already earned stays yours.',
        () => { Depths.reset(option.id); Sound.play('ui_ok'); this.render(); });
      choices.appendChild(button);
    });
    body.appendChild(choices);
    UI.modal('🚪 Redeploy Elevator', body);
  },

  openTeamEditor(filter, onSave, title, options) {
    options = options || {};
    // The Buds lesson is built around its starter pair. Merge this with any
    // caller-specific locks (such as Friendship pairs) before drawing the
    // shared picker, so Poppy and Boxten cannot be removed mid-lesson.
    const budLocks = Save.budsRequiredIds();
    options.required = [...new Set((options.required || []).concat(budLocks))];
    Save.enforceBudsTeam();
    const initial = options.team || (filter ? Save.data.team.filter(id => id && filter(id)) : Save.data.team);
    const p = UI.teamPicker({ filter, team: initial, required: options.required });
    const body = el('div', 'team-editor-body');
    const scroll = el('div', 'team-editor-scroll');
    if (budLocks.length) scroll.appendChild(DandyCoach.teamCard(Save.data.buds.stage || 1, Save.data.buds.chosen));
    scroll.appendChild(p.node);
    body.appendChild(scroll);
    const ok = el('button', 'btn go wide team-confirm', options.confirmLabel || 'Save Formation');
    ok.onclick = () => {
      if (!p.valid) { UI.toast('Pick at least one Hero'); Sound.play('ui_err'); return; }
      const team = p.team.filter(Boolean);
      if (!onSave || options.persist) { Save.data.team = team.slice(); Save.write(); }
      UI.closeModal({ skipHook: true });
      if (onSave) onSave(team);
      else this.render();
    };
    body.appendChild(ok);
    UI.modal(title || 'Edit Team', body, { className: 'team-editor-modal', onClose: options.onClose || null });
  },

  enterNode(type, i) {
    const r = Depths.run();
    if (r.pendingDraft) { this.openDepthDraft(); return; }
    if (type === 'event') return this.runEvent();
    if (type === 'machine') return this.runMachine();
    if (type === 'treasure') return this.runTreasure();
    if (type === 'rest') return this.runRest();
    const battleType = r.forceElite && type === 'battle' ? 'elite' : type;
    const scannedFoes = Depths.makeEnemies(r.floor, i, battleType);
    const labels = { battle: 'Twisted Patrol', elite: 'Elite Twisted', boss: 'Boss Room' };
    this.openTeamEditor(null, () => this.startDepthBattle(battleType, i, scannedFoes, { chain: true }),
      `Floor ${r.floor} · ${labels[battleType] || 'Battle'}`,
      { persist: true, confirmLabel: 'Enter Battle', onClose: () => {
        // Closing the formation editor is a cancel, not an exit from the
        // Endless run. Keep the route visible so the player can choose a
        // different room or reopen the squad without being bounced Home.
        if (this.cur === 'depths' && !this._endlessLeaving && !BattleScreen.active) this.render();
      }});
  },

  startDepthBattle(type, node, scannedFoes, options) {
    options = options || {};
    const chain = options.chain !== false;
    const machine = options.machine || null;
    this._depthChainActive = chain;
    const r = Depths.run();
    const L = Depths.layout();
    const team = Depths.teamSpecs().filter(sp => (r.hp[sp.id] == null || r.hp[sp.id] > 0));
    if (!team.length) { UI.toast('Everyone is down. Rest or abandon.'); Sound.play('ui_err'); return; }
    const combatType = machine ? 'battle' : type;
    const foes = options.mirror
      ? [Depths.makeMirrorEnemy(r.floor, node)]
      : scannedFoes || Depths.makeEnemies(r.floor, node, combatType);
    const titles = { battle: 'Twisted Patrol', elite: 'Elite Twisted', boss: 'BOSS' };
    const finishesFloor = node === L.nodes.length - 1;
    // Roll this once when the room is entered. The result screen and the
    // actual payout must always show the same cache, including its crates.
    const rw = machine ? machine.reward : Depths.rewards(r.floor, node, type, true);
    if (finishesFloor && !machine) {
      const cache = Depths.clearRewards(r.floor);
      Object.keys(cache).forEach(k => { rw[k] = (rw[k] || 0) + cache[k]; });
    }
    if (options.mirror) {
      rw.ichor += Math.round(1500 * (1 + r.floor * .18));
      rw.diamond = (rw.diamond || 0) + 1;
      rw.core = (rw.core || 0) + 1;
    }

    const reducedReward = () => machine
      ? Object.fromEntries(Object.entries(rw).map(([k, v]) => [k, Math.max(1, Math.floor(v * .1))]))
      : rw;
    const b = BattleScreen.launch({
      team, foes,
      meta: {
        title: machine ? `Floor ${r.floor} · Ichor Machine` : `Floor ${r.floor} · ${titles[type] || 'Battle'}`,
        floorLabel: machine ? `Floor ${r.floor} · Ichor Machine` : `Floor ${r.floor} · ${titles[type] || 'Battle'}`,
        roomIdx: node + 1, roomTotal: L.nodes.length,
        survivedLabel: `Floor ${r.floor}, Room ${node + 1}!`,
        bg: bgForFloor(r.floor, node),
        mods: r.clearMods ? [] : L.mods,
        // The machine owns the pre-battle stage. A failed check hands the
        // same Battle instance to introWalk(), so the selected Toon leaves
        // the prop, jumps to their starting spot, and the fight begins.
        machinePrelude: machine,
        endless: true
      },
      rewards: res => (res && res.machineReduced ? reducedReward() : rw),
      // Endless victories use the same entrance/exit walk as event waves and
      // skip the large results panel so the next room can begin immediately.
      // Defeats still show the results panel so the player can review the run.
      // Machine runs need to stop on their payout card. Normal endless rooms
      // keep their fast chain hand-off, but a machine completion or failure
      // must show the exact full/10% reward before the next room opens.
      machine: !!machine,
      skipResults: chain && !machine,
      onReady: battle => {
        // Asset-gated battles construct their units after the loading screen.
        // Install the run build and carried HP in that same ready frame so no
        // intro step can begin with unmodified stats.
        Depths.applyRunBuild(battle);
        battle.units.filter(u => u.team === TEAM_P).forEach(u => {
          const pct = r.hp[u.id];
          const stage = Depths.budStage(r.floor);
          // The second Bud lesson is specifically about keeping a fragile
          // backliner healthy. Its training wheels prevent old Floor 1 wounds
          // from making Boxten start the very first three-Toon exercise dead.
          const lessonFloor = stage === 2 ? (u.id === 'Boxten' ? .82 : .68) : 0;
          if (pct != null && pct < 1) u.hp = Math.max(1, u.max.hp * Math.max(pct, lessonFloor));
        });
        const stage = Depths.budStage(r.floor);
        if (stage) DandyCoach.battle(battle, { stage, node, heroName: Save.data.buds && Save.data.buds.chosen });
      },
      onDone: (res) => {
        const budsTutorialPending = !!(Save.data.buds && Save.data.buds.levelTutorialPending);
        const openBudsTutorial = () => {
          if (!budsTutorialPending) return false;
          this._depthChainActive = false;
          this.render();
          setTimeout(() => this.openBudsLevelTutorial(), 240);
          return true;
        };
        if (r.dandyConsequence && !r.dandyConsequenceResolved) {
          r.dandyConsequenceResolved = true;
          this._depthChainActive = false;
          // Winning does not earn a payout. Dandy treats the encounter as a
          // lost argument, then starts the ordinary Buds lesson himself.
          this.startDandysBudsRun({ keepPrevious: true, silent: true });
          return;
        }
        if (res.quit) {
          // Retreat no longer rewinds damage. Leaving a bad engagement is a
          // valid choice, but the run keeps every wound taken before escape.
          Depths.storeHp(b);
          if (!openBudsTutorial()) this.render();
          return;
        }
        if (res.win) {
          const payout = res.machineReduced ? reducedReward() : rw;
          const machineMult = res.machineReduced ? .1 : 1;
          payoutBattle(Save.data.team, payout, { mastery: machine ? Math.max(1, Math.round((80 + r.floor * 8) * machineMult)) : Depths.earlyMasteryReward(type),
            pass: machine ? Math.max(1, Math.round(70 * machineMult)) : type === 'boss' ? 120 : 45 });
          if (!machine) Depths.trinketDrops(b, { floor: r.floor, node, type });
          Depths.storeHp(b);
          // Forced-Elite choices survive intervening non-combat rooms and are
          // consumed only when a combat room is actually cleared.
          if (r.forceElite) r.forceElite = false;
          r.clearMods = false;
          const floorCleared = Depths.advance(true);
          if (openBudsTutorial()) return;
          if (type === 'elite' && !machine && !floorCleared) Depths.queueDraft('elite');
          const budsFinished = floorCleared && this.finishDandysBuds();
          if (chain) {
            if (budsFinished) {
              this._depthChainActive = false;
              this.render();
              setTimeout(() => this.openBudReward(budsFinished), 280);
            } else {
              this.afterDepthRoom(floorCleared);
            }
          } else {
            this.render();
            if (budsFinished) setTimeout(() => this.openBudReward(budsFinished), 280);
          }
          return;
        } else {
          const failedFloor = r.floor;
          this._depthChainActive = false;
          Depths.reset();
          UI.toast(`Run lost on Floor ${failedFloor}. Run cards erased.`);
        }
        if (!openBudsTutorial()) this.render();
      }
    });
  },

  openBudsLevelTutorial() {
    const buds = Save.data.buds;
    if (!buds || !buds.levelTutorialPending) return;

    // Resolve the pending flag before paying out so a reload or a double
    // callback can never duplicate the one-time catch-up bundle.
    buds.levelTutorialPending = false;
    const reward = { ichor: 900, exp: 10000, tape: 24, notes: 24 };
    Save.give(reward, true);
    // Mastery is the account-wide level cap. 1,800 XP takes a fresh account
    // from Mastery 1 through Mastery 10, and its normal milestone rewards are
    // deliberately preserved; quiet keeps those celebrations from covering
    // the lesson itself.
    Save.addMasteryXp(1800, true);
    Save.write();

    const body = el('div', 'buds-graduation buds-level-tutorial');
    body.innerHTML = `<img src="uploads/dandysbudicon.png" alt=""><small>FIRST WIPE · DANDY'S CATCH-UP KIT</small><h2>LET'S LEVEL UP</h2><p>A Bud going down is a signal to train before the next room. I opened the level-10 cap and left enough supplies to bring both starter Buds there.</p>
      <div class="buds-steps"><span><i>1</i><b>Open Heroes</b> and choose Poppy or Boxten.</span><span><i>2</i>Press <b>Level Up</b> until the hero reaches Lv 10.</span><span><i>3</i>Use the next Safe Room to recover, then try the route again.</span></div>
      <div class="buds-level-kit"><small>YOUR TRAINING KIT</small><span>◈ 900 Ichor</span><span>✦ 10,000 Hero XP</span><span>📼 24 Tape · 24 Notes</span><span>🏅 Mastery 10 unlocked</span></div>`;
    const openHeroes = el('button', 'buds-start', 'OPEN HEROES ›');
    openHeroes.onclick = () => { UI.closeModal(); this.go('roster'); };
    body.appendChild(openHeroes);
    UI.modal('', body, { bare: true, className: 'buds-modal' });
  },

  /* The run stays in Endless after a win. Combat rooms launch directly into
     the next room; cache, event, camp, and draft rooms briefly return to the
     Endless screen so their choice remains readable. */
  continueDepthRun(delay) {
    if (!this._depthChainActive) return;
    const r = Depths.run();
    if (r.pendingDraft) { this.openDepthDraft(); return; }
    const L = Depths.layout();
    const planned = L.nodes[r.node] || 'battle';
    const type = r.forceElite && planned === 'battle' ? 'elite' : planned;
    if (!['battle', 'elite', 'boss'].includes(type)) {
      this.render();
      setTimeout(() => {
        const modal = $('#modal');
        if (this._depthChainActive && !BattleScreen.active && modal && !modal.hidden) return;
        if (this._depthChainActive && !BattleScreen.active) this.enterNode(planned, r.node);
      }, delay == null ? 260 : delay);
      return;
    }
    const foes = Depths.makeEnemies(r.floor, r.node, type);
    this.startDepthBattle(type, r.node, foes, { chain: true });
  },

  afterDepthRoom(floorCleared) {
    if (!this._depthChainActive) { this.render(); return; }
    const r = Depths.run();
    if (r.pendingDraft) {
      this._depthAfterDraft = { floorCleared: !!floorCleared };
      this.render();
      setTimeout(() => this.openDepthDraft(), 220);
      return;
    }
    this.render();
    if (floorCleared) setTimeout(() => this.openDepthFloorChoice(), 180);
    else this.continueDepthRun(280);
  },

  finishDepthDraftStep() {
    const state = this._depthAfterDraft;
    if (!state) { this.render(); return; }
    const r = Depths.run();
    if (r.pendingDraft) {
      this.render();
      setTimeout(() => this.openDepthDraft(), 180);
      return;
    }
    this._depthAfterDraft = null;
    this.render();
    if (state.floorCleared) setTimeout(() => this.openDepthFloorChoice(), 180);
    else this.continueDepthRun(280);
  },

  openDepthFloorChoice() {
    if (!this._depthChainActive) return;
    const r = Depths.run();
    const body = el('div', 'depth-floor-choice');
    body.innerHTML = `<div class="depth-floor-choice-art">✓</div>
      <small>FLOOR ${r.floor - 1} SECURED</small><h2>THE ELEVATOR IS READY</h2>
      <p>Your rewards and cards are safe. Keep the team moving into Floor ${r.floor}, or leave the run here and return to the menu.</p>`;
    const actions = el('div', 'depth-floor-choice-actions');
    const keep = el('button', 'depth-floor-choice-btn keep', '<b>KEEP GOING</b><span>Enter Floor ' + r.floor + '</span>');
    let resolved = false;
    keep.onclick = () => { if (resolved) return; resolved = true; UI.closeModal(); Sound.play('endless_enter', { vol: .72 }); this.continueDepthRun(180); };
    const leave = el('button', 'depth-floor-choice-btn leave', '<b>LEAVE RUN</b><span>Return to menu</span>');
    leave.onclick = () => { if (resolved) return; resolved = true; UI.closeModal(); Sound.play('ui_back'); this.leaveDepths('home'); };
    actions.appendChild(keep); actions.appendChild(leave); body.appendChild(actions);
    UI.modal('', body, { bare: true, className: 'depth-floor-choice-modal' });
  },

  /* ============================================================ DANDY'S BUDS */
  repairDandysBudsRun() {
    const buds = Save.data.buds;
    if (!buds || buds.state !== 'active') return;
    const stage = Math.max(1, Math.min(3, Number(buds.stage) || 1));
    const run = Save.data.depth;
    if (!run || run.floor === stage) return;
    if (run.floor === stage + 1 && run.node === 0 && run.layoutData && run.layoutData.buds) {
      return this.finishDandysBuds();
    }
    // Older builds started a fresh lesson at the player's Endless record.
    // Keep that run if it is the only copy, then restore the actual lesson.
    if (!buds.previousRun && !run.dandyConsequence) buds.previousRun = run;
    Save.data.depth = Depths.makeBudsRun(stage);
    Save.enforceBudsTeam();
    Save.write();
    UI.toast(`Dandy's Buds is back on Floor ${stage}. Your Endless run is saved.`);
  },

  pauseDandysBuds() {
    const buds = Save.data.buds;
    if (!buds || buds.state !== 'active') return;
    const run = Save.data.depth;
    if (run && run.floor === buds.stage) buds.pausedRun = run;
    else if (run && !buds.previousRun) buds.previousRun = run;
    Save.data.depth = buds.previousRun || null;
    buds.previousRun = null;
    if (Array.isArray(buds.previousTeam)) Save.data.team = buds.previousTeam.filter(id => id && Save.owns(id)).slice(0, 5);
    buds.previousTeam = null;
    buds.state = 'paused';
    Save.write();
    UI.closeModal({ skipHook: true });
    UI.toast("Dandy's Buds paused. You can switch Toons now.");
    if (this.cur === 'depths') this.leaveDepths('home');
    else this.render();
  },

  resumeDandysBuds() {
    const buds = Save.data.buds;
    if (!buds || buds.state !== 'paused') return;
    buds.previousRun = Save.data.depth;
    buds.previousTeam = (Save.data.team || []).filter(id => id && Save.owns(id));
    buds.state = 'active';
    Save.data.team = STARTERS.filter(id => Save.owns(id));
    if (buds.chosen && Save.owns(buds.chosen) && !Save.data.team.includes(buds.chosen)) Save.data.team.push(buds.chosen);
    Save.data.depth = buds.pausedRun && buds.pausedRun.floor === buds.stage ? buds.pausedRun : null;
    buds.pausedRun = null;
    Save.enforceBudsTeam();
    Depths.run();
    Save.write();
    this.go('depths', { ignoreBudsDemand: true });
  },

  startDandysBudsRun(options) {
    options = options || {};
    const buds = Save.data.buds || (Save.data.buds = { state: 'available', stage: 1, chosen: null, startedAt: 0, completedAt: 0, previousRun: null, previousTeam: null, refusals: 0, demandShown: false, dandyConsequence: false });
    if (!options.keepPrevious) {
      const oldRun = Save.data.depth;
      const progressedRun = oldRun && !oldRun.dandyConsequence && (oldRun.floor > 1 || oldRun.node > 0 || Object.values(oldRun.cards || {}).some(Boolean));
      buds.previousRun = progressedRun ? oldRun : null;
      buds.previousTeam = (Save.data.team || []).filter(id => id && Save.owns(id));
    } else if (!Array.isArray(buds.previousTeam)) {
      buds.previousTeam = (Save.data.team || []).filter(id => id && Save.owns(id));
    }
    buds.state = 'active'; buds.stage = 1; buds.chosen = null; buds.startedAt = Date.now(); buds.dandyConsequence = false;
    // The lesson is authored for the starter pair. Keep a player's real
    // formation in previousTeam, then restore it after graduation.
    Save.data.team = STARTERS.filter(id => Save.owns(id));
    Save.enforceBudsTeam();
    Save.data.depth = null;
    const tutorialRun = Depths.run();
    tutorialRun.deckVersion = 1; tutorialRun.cards = {}; tutorialRun.cardHistory = [];
    tutorialRun.pendingDraft = 0; tutorialRun.draftReasons = []; tutorialRun.rerolls = 0;
    Save.write();
    UI.closeModal({ skipHook: true }); Sound.play('ui_ok');
    this.go('depths', { ignoreBudsDemand: true, silent: !!options.silent });
  },
  openDandysBuds() {
    const buds = Save.data.buds || (Save.data.buds = { state: 'available', stage: 1, chosen: null, startedAt: 0, completedAt: 0, previousRun: null, previousTeam: null, refusals: 0, demandShown: false, dandyConsequence: false });
    if (buds.state === 'completed') { UI.toast('You are already one of Dandy\'s Buds!'); return; }
    if (buds.state === 'chooseHero') { this.openBudCrate(); return; }
    if (buds.state === 'chooseTrinket') { this.openBudGearCrate(); return; }
    if (buds.state === 'chooseSupplies') { this.openBudSupplyCrate(); return; }
    if (buds.state === 'active') { this.go('depths'); return; }
    if (buds.state === 'paused') { this.resumeDandysBuds(); return; }

    const body = el('div', 'buds-welcome');
    body.innerHTML = `<div class="buds-welcome-art"><span class="buds-welcome-sticker">GUIDED RUN</span><img src="uploads/dandyhimself.png" alt="Dandy"><i><img src="uploads/dandysbudicon.png" alt="Dandy's Buds"><b>3 FLOORS</b></i></div>
      <small>WELCOME TO DANDY'S WORLD!</small><h2>DANDY'S BUDS</h2>
      <p>Learn the loop with Dandy beside you: clear three gentle floors, grow your starter team, and finish with rewards you can use right away.</p>
      <div class="buds-dandy-brief"><b>DANDY'S PROMISE</b><span>I will always point to the next useful button. Battles run automatically; your job is to prepare, watch health, and choose the next room.</span></div>
      <div class="buds-timeline"><span class="current"><i>1</i><b>LEARN</b><em>Rooms + battle flow</em></span><span><i>2</i><b>RECRUIT</b><em>Choose a third buddy</em></span><span><i>3</i><b>GROW</b><em>Trinket + final gift</em></span></div>
      <div class="buds-reward-strip"><small>WHAT YOU’LL GET</small><div><span><b>✦</b><em>New buddy</em></span><span><b>⌁</b><em>Starter Trinket</em></span><span><b>📦</b><em>Graduation gift</em></span></div></div>
      <div class="buds-help-note"><b>GOOD TO KNOW</b><span>Your regular Endless run is safely held while you learn and comes back after graduation.</span></div>`;
    const start = el('button', 'buds-start', 'START MY FIRST FLOOR ›');
    start.onclick = () => this.startDandysBudsRun();
    body.appendChild(start);
    UI.modal('', body, { bare: true, className: 'buds-modal' });
  },

  finishDandysBuds() {
    const buds = Save.data.buds;
    const stage = buds && buds.stage || 1;
    if (!buds || buds.state !== 'active' || Depths.run().floor !== stage + 1) return 0;
    buds.state = stage === 1 ? 'chooseHero' : stage === 2 ? 'chooseTrinket' : 'chooseSupplies';
    Save.write();
    return stage;
  },

  openBudReward(stage) {
    if (stage === 1) this.openBudCrate();
    else if (stage === 2) this.openBudGearCrate();
    else if (stage === 3) this.openBudSupplyCrate();
  },

  openBudCrate() {
    const buds = Save.data.buds;
    if (!buds || buds.state !== 'chooseHero') return;
    const body = el('div', 'bud-crate');
    body.innerHTML = `<div class="bud-crate-top"><div class="buds-modal-progress"><b class="done">1</b><i></i><b class="current">2</b><i></i><b>3</b></div><img class="bud-dandy" src="uploads/dandyhimself.png" alt="Dandy"><img class="bud-mark" src="uploads/dandysbudicon.png" alt="">
        <small>FLOOR 1 CLEARED!</small><h2>YOU'RE A BUD!</h2><p>Dandy picked out a new buddy for your team. Choose carefully!</p><div class="buds-dandy-brief"><b>DANDY SAYS</b><span>Rudie is a fast damage specialist. Tisha controls enemy formation and spacing. Both are good choices; choose the kind of help you want to practice.</span></div></div>
      <div class="bud-choice-row"></div><div class="bud-crate-foot">SELECT ONE TOON · THE OTHER CAN STILL BE RECRUITED LATER</div>`;
    const choices = $('.bud-choice-row', body);
    ['Rudie', 'Tisha'].forEach((id, index) => {
      const hero = HEROES[id], c = el('button', 'bud-hero-choice');
      c.style.setProperty('--choice-delay', index);
      c.innerHTML = `<span class="bud-choice-label">BUD CRATE</span><img src="${Art.hero(id)}" alt="${hero.name}"><b>${hero.name}</b><small>${heroRole(hero.role)}</small><em>CHOOSE ${hero.name.toUpperCase()}</em>`;
      c.onclick = () => this.claimBudHero(id);
      choices.appendChild(c);
    });
    UI.modal('', body, { bare: true, className: 'buds-modal bud-crate-modal' });
  },

  claimBudHero(id) {
    const buds = Save.data.buds;
    if (!buds || buds.state !== 'chooseHero' || !['Rudie', 'Tisha'].includes(id)) return;
    const wasOwned = Save.owns(id);
    if (!wasOwned) {
      Save.data.heroes[id] = Save.newHero(id);
      UI.queueHeroUnlock(id);
      Save.addMasteryXp(260);
      Achievements.record('heroUnlock', 1);
    } else {
      Save.giveShards(id, Math.ceil(Save.unlockNeed(id) * .5));
    }
    // A newly recruited Bud keeps the same level-1, rarity-1, skill-1
    // baseline as the starter pair. Existing owners keep their own progress.
    if (!Save.data.team.includes(id)) Save.data.team.push(id);
    buds.state = 'active'; buds.stage = 2; buds.chosen = id;
    const run = Depths.run();
    run.pendingDraft = 0; run.draftReasons = []; run.draftOptions = null;
    Save.write(); UI.refreshBar(true); Sound.play('get_rare');
    FX.confetti(window.innerWidth / 2, window.innerHeight * .42, 52);
    const body = el('div', 'buds-graduation');
    body.innerHTML = `<img src="uploads/dandysbudicon.png" alt=""><small>FLOOR 1 COMPLETE</small><h2>${wasOwned ? `${HEROES[id].name} sent shards!` : `${HEROES[id].name} joined you!`}</h2><p>Your three-Bud team is ready for Floor 2. Return Home to keep the lesson state safe, then continue from Dandy’s Buds.</p>`;
    const done = el('button', 'buds-start', 'RETURN HOME ›');
    done.onclick = () => { UI.closeModal({ skipHook: true }); this.go('home'); };
    body.appendChild(done);
    UI.modal('', body, { bare: true, className: 'buds-modal' });
  },

  openBudGearCrate() {
    const buds = Save.data.buds;
    if (!buds || buds.state !== 'chooseTrinket') return;
    const body = el('div', 'bud-crate');
    body.innerHTML = `<div class="bud-crate-top"><div class="buds-modal-progress"><b class="done">1</b><i></i><b class="done">2</b><i></i><b class="current">3</b></div><img class="bud-dandy" src="uploads/dandyhimself.png" alt="Dandy"><img class="bud-mark" src="uploads/dandysbudicon.png" alt="">
        <small>FLOOR 2 CLEARED!</small><h2>YOUR FIRST TRINKET</h2><p>Pick one keepsake for the starter team. Dandy suggests equipping it from Inventory when you are ready.</p><div class="buds-dandy-brief"><b>DANDY SAYS</b><span>Choose the keepsake for the Toon you expect to keep using. You can inspect its effect in Inventory and change equipment later.</span></div></div>
      <div class="bud-choice-row"></div><div class="bud-crate-foot">SELECT ONE TRINKET · RANK 1</div>`;
    const choices = $('.bud-choice-row', body);
    [['poppy_pinkbow', 'Poppy', 'Pink Bow'], ['boxten_bluebandana', 'Boxten', 'Blue Bandana']].forEach(([tid, owner, name], index) => {
      const c = el('button', 'bud-hero-choice bud-item-choice');
      c.style.setProperty('--choice-delay', index);
      c.innerHTML = `<span class="bud-choice-label">${owner.toUpperCase()}'S TRINKET</span><img src="${trinketIcon(tid)}" alt="${name}"><b>${name}</b><small>${trinketStatText(TRINKETS[tid], 1)}</small><em>CHOOSE ${name.toUpperCase()}</em>`;
      c.onclick = () => this.claimBudGear(tid);
      choices.appendChild(c);
    });
    UI.modal('', body, { bare: true, className: 'buds-modal bud-crate-modal' });
  },

  claimBudGear(tid) {
    const buds = Save.data.buds;
    if (!buds || buds.state !== 'chooseTrinket' || !['poppy_pinkbow', 'boxten_bluebandana'].includes(tid)) return;
    Save.addTrinketCopy(tid, 1);
    buds.state = 'active'; buds.stage = 3;
    const run = Depths.run();
    run.pendingDraft = 0; run.draftReasons = []; run.draftOptions = null;
    Save.write(); Sound.play('get_rare'); FX.confetti(window.innerWidth / 2, window.innerHeight * .42, 40);
    const body = el('div', 'buds-graduation');
    body.innerHTML = `<img src="${trinketIcon(tid)}" alt=""><small>FLOOR 2 COMPLETE</small><h2>${TRINKETS[tid].name} acquired!</h2><p>One final floor remains. Return Home to keep the lesson state safe, then continue from Dandy’s Buds.</p>`;
    const done = el('button', 'buds-start', 'RETURN HOME ›');
    done.onclick = () => { UI.closeModal({ skipHook: true }); this.go('home'); };
    body.appendChild(done);
    UI.modal('', body, { bare: true, className: 'buds-modal' });
  },

  openBudSupplyCrate() {
    const buds = Save.data.buds;
    if (!buds || buds.state !== 'chooseSupplies') return;
    const body = el('div', 'bud-crate');
    body.innerHTML = `<div class="bud-crate-top"><div class="buds-modal-progress"><b class="done">1</b><i></i><b class="done">2</b><i></i><b class="done">3</b></div><img class="bud-dandy" src="uploads/dandyhimself.png" alt="Dandy"><img class="bud-mark" src="uploads/dandysbudicon.png" alt="">
        <small>FLOOR 3 CLEARED!</small><h2>ONE LAST GIFT</h2><p>Choose what helps your new team most right now.</p><div class="buds-dandy-brief"><b>DANDY SAYS</b><span>Pick Training Supplies if you want to grow Heroes immediately. Pick the Crate Stash if you want more random recruits and materials to open later.</span></div></div>
      <div class="bud-choice-row"></div><div class="bud-crate-foot">SELECT ONE BUD BUNDLE</div>`;
    const choices = $('.bud-choice-row', body);
    [['materials', '✦', 'Training Supplies', 'Skill materials + Hero XP'], ['crates', '📦', 'Crate Stash', '4 Gold Crates + 1 Diamond Crate']].forEach(([kind, icon, title, sub], index) => {
      const c = el('button', 'bud-hero-choice bud-supply-choice');
      c.style.setProperty('--choice-delay', index);
      c.innerHTML = `<span class="bud-choice-label">FINAL BUD GIFT</span><i>${icon}</i><b>${title}</b><small>${sub}</small><em>CHOOSE ${title.toUpperCase()}</em>`;
      c.onclick = () => this.claimBudSupplies(kind);
      choices.appendChild(c);
    });
    UI.modal('', body, { bare: true, className: 'buds-modal bud-crate-modal' });
  },

  claimBudSupplies(kind) {
    const buds = Save.data.buds;
    if (!buds || buds.state !== 'chooseSupplies' || !['materials', 'crates'].includes(kind)) return;
    const chosen = buds.chosen;
    const reward = kind === 'materials'
      ? { tape: 60, notes: 60, exp: 4500, manual: 16, star: 120 }
      : { gold: 4, diamond: 1 };
    Save.give(reward, true);
    buds.state = 'completed'; buds.completedAt = Date.now();
    if (buds.previousRun) { Save.data.depth = buds.previousRun; buds.previousRun = null; }
    if (Array.isArray(buds.previousTeam)) {
      const restored = buds.previousTeam.filter(id => id && Save.owns(id));
      if (chosen && Save.owns(chosen) && !restored.includes(chosen) && restored.length < 5) restored.push(chosen);
      Save.data.team = restored;
      buds.previousTeam = null;
    }
    Save.write(); UI.refreshBar(true); Sound.play('get_rare'); FX.confetti(window.innerWidth / 2, window.innerHeight * .42, 58);
    const body = el('div', 'buds-graduation');
    body.innerHTML = `<img src="uploads/dandysbudicon.png" alt=""><small>OFFICIAL DANDY'S BUD</small><h2>Lesson complete!</h2><p>${kind === 'materials' ? 'Your training supplies are ready for Poppy, Boxten, and your new buddy.' : 'Your crate stash is waiting in the Crates room.'} You’re officially one of Dandy’s Buds, a true buddy!</p><div class="buds-dandy-brief"><b>DANDY SAYS</b><span>Now the safety rails come off. The normal Depths will use the same rhythm: prepare the team, read the room, recover when needed, and let the Toons do their work.</span></div>`;
    const done = el('button', 'buds-start', 'LET’S GROW ›');
    done.onclick = () => { UI.closeModal(); this.go('home'); };
    body.appendChild(done);
    UI.modal('', body, { bare: true, className: 'buds-modal' });
  },

  runEvent() {
    const r = Depths.run();
    let resolved = false;
    // Include the run seed so the same room position can tell a different
    // story on a later descent while remaining stable after a reload.
    const ev = seeded('event-' + r.seed + '-' + r.floor + '-' + r.node).pick(EVENTS);
    const body = el('div');
    body.appendChild(el('div', 'muted tiny', ev.text));
    body.appendChild(el('div', 'spacer'));
    ev.choices.forEach(c => {
      const n = el('button', 'choice');
      n.type = 'button';
      const affordable = !c.cost || Save.can(c.cost);
      n.innerHTML = `<b>${c.label}</b><div class="mini muted">${c.sub}</div>`;
      if (!affordable) { n.style.opacity = .45; }
      n.disabled = !affordable;
      n.onclick = () => {
        if (resolved) return;
        if (c.cost && !Save.spend(c.cost)) { UI.toast('Not enough'); Sound.play('ui_err'); return; }
        resolved = true;
        Sound.play('ui_ok');
        const out = c.act(Depths.api()) || {};
        UI.closeModal({ skipHook: true });
        UI.toast(out.msg || 'Done');
        if (out.clearMods) r.clearMods = true;
        if (out.forceElite) r.forceElite = true;
        if (out.runBuff) { r.buffs.push(out.runBuff); UI.toast(STATUS[out.runBuff].icon + ' run buff gained'); }
        if (out.queueDraft) Depths.queueDraft(out.queueDraft === true ? 'event' : out.queueDraft);
        if (out.fight) { Save.write(); this.startDepthBattle(out.mirror ? 'elite' : 'battle', r.node, null, { chain: true, mirror: !!out.mirror }); return; }
        const floorCleared = Depths.advance(true);
        if (this._depthChainActive) this.afterDepthRoom(floorCleared);
        else this.render();
      };
      body.appendChild(n);
    });
    UI.modal('❓ ' + ev.title, body, {
      sticky: true,
      closeButton: false,
      onClose: () => {
        // A dismissed event is an abandoned room, not a completed choice.
        // Clear the chain before leaving so no delayed room callback can
        // reopen Endless after the home transition finishes.
        if (this.cur === 'depths' && !this._endlessLeaving && !BattleScreen.active) this.leaveDepths('home');
      }
    });
  },

  runMachine() {
    const screen = this, r = Depths.run();
    const team = Save.data.team.filter(id => id && Save.owns(id) && (r.hp[id] == null || r.hp[id] > 0));
    if (!team.length) { UI.toast('Everyone is down. Rest before using the machine.'); Sound.play('ui_err'); return; }
    const machineType = Depths.roomRng(r.floor, r.node, 'machine_variant').chance(0.5) ? 'treadmill' : 'ichor';
    const isTreadmill = machineType === 'treadmill';
    const state = { selected: null };
    const body = el('div', 'machine-event' + (isTreadmill ? ' treadmill-theme' : ''));

    let topPickId = team[0], bestScore = -1;
    team.forEach(id => {
      const s = machineToonStats(id, r.floor, r.node, machineType);
      const score = s.primaryStars * 10 + s.secondaryStars + ((Save.hero(id).level || 1) * 0.1);
      if (score > bestScore) { bestScore = score; topPickId = id; }
    });

    const startMachine = () => {
      if (!state.selected) return;
      const s = machineToonStats(state.selected, r.floor, r.node, machineType);
      const bonus = 0;
      const reward = {
        ichor: Math.round(1050 + r.floor * 180 + bonus),
        exp: 900 + r.floor * 95,
        tape: 22 + r.floor * 2,
        notes: 14 + r.floor,
        manual: 5 + Math.ceil(r.floor / 4),
        star: 35 + r.floor * 4,
        core: 1
      };
      const roll = Depths.roomRng(r.floor, r.node, 'machine-reward');
      if (roll.chance(.22)) reward.gold = 1;
      if (roll.chance(.08)) reward.diamond = 1;
      UI.closeModal({ skipHook: true });
      screen.startDepthBattle('battle', r.node, null, {
        chain: true,
        machine: {
          machineType,
          toonId: state.selected,
          reward,
          primaryStars: s.primaryStars,
          secondaryStars: s.secondaryStars,
          extractionStars: s.extractionStars,
          skillStars: s.skillStars,
          speedStars: s.speedStars,
          rate: s.rate
        }
      });
    };

    const renderChooser = () => {
      const floorTarget = machineToonStats(team[0], r.floor, r.node, machineType);
      const machineBadgeImg = isTreadmill ? 'uploads/treadmill-machine.png' : 'uploads/image-36.png';
      const machineBadgeClass = isTreadmill ? 'machine-select-badge treadmill-badge' : 'machine-select-badge';
      const topTitle = isTreadmill ? 'TREADMILL GENERATOR' : 'ICHOR EXTRACTION';
      const topSub = isTreadmill ? 'FLOOR EVENT // HIGH-SPEED GENERATOR' : 'FLOOR EVENT // UNIQUE STATION';
      const heroKicker = isTreadmill ? 'ENDURANCE & SPEED DRILL' : 'THE ROOM HAS ONE JOB';
      const heroTitle = isTreadmill ? 'CHOOSE YOUR RUNNER' : 'CHOOSE YOUR OPERATOR';
      const heroDesc = isTreadmill
        ? 'Sprint on the industrial treadmill to generate power. <b>Run Speed</b> drives charging velocity; <b>Cadence Check</b> sets your stride timing windows.'
        : 'Pick the Toon whose build can beat this floor\'s pressure. <b>Extraction Speed</b> fills the tank faster; <b>Skill Check</b> sets the size of the check windows.';
      const demandLabel = isTreadmill ? 'BELT VELOCITY DEMAND' : 'FLOOR PRESSURE';
      const demandSub = isTreadmill
        ? `${Math.round(floorTarget.expectedPrimary)} run speed · ${Math.round(floorTarget.expectedSecondary)} cadence`
        : `${Math.round(floorTarget.expectedPrimary)} extraction · ${Math.round(floorTarget.expectedSecondary)} accuracy`;
      const payoutLabel = isTreadmill ? '100% + SPEED OVERCLOCK' : '100% + SUPERCHARGE';

      body.innerHTML = `<div class="machine-top"><div><small>${topSub}</small><b>${topTitle}</b></div></div>
        <div class="machine-select-hero">
          <div class="${machineBadgeClass}"><img src="${machineBadgeImg}" alt="${topTitle}"><i>${isTreadmill ? 'GENERATOR' : 'ONLINE'}</i></div>
          <div><small class="machine-select-kicker">${heroKicker}</small><h2>${heroTitle}</h2><p>${heroDesc}</p></div>
        </div>
        <div class="machine-targets">
          <div><span>${demandLabel}</span><b>LV ${floorTarget.floorLevel}</b><small>${demandSub}</small></div>
          <div><span>SUCCESS PAYOUT</span><b>${payoutLabel}</b><small>10% if a check fails and battle begins</small></div>
        </div>
        <div class="machine-select-label"><span>AVAILABLE OPERATORS</span><b>${team.length} READY TO WORK</b></div>
        <div class="machine-select-preview" aria-live="polite"><div class="machine-preview-empty"><b>SELECT A TOON</b><span>Compare their stars against this station before you start.</span></div></div>
        <div class="machine-toon-grid"></div><button class="machine-start" type="button" disabled>SELECT A TOON TO BEGIN ›</button>`;

      const grid = $('.machine-toon-grid', body);
      const preview = $('.machine-select-preview', body);
      const updatePreview = (id, s) => {
        const h = Save.hero(id), d = HEROES[id];
        const primaryDelta = Math.round(s.primaryVal - s.expectedPrimary);
        const secondaryDelta = Math.round(s.secondaryVal - s.expectedSecondary);
        const delta = value => value > 0 ? `+${value}` : `${value}`;
        const isTop = id === topPickId;
        preview.innerHTML = `<div class="machine-preview-art"><img src="${Art.hero(id)}" alt="${d.name}"></div>
          <div class="machine-preview-copy">
            <small>${isTreadmill ? 'SELECTED RUNNER' : 'SELECTED OPERATOR'}${isTop ? ' · ⭐ TOP PICK' : ''}</small>
            <h3>${d.name}</h3>
            <span>Lv ${h.level} · ${rarityLabel(h.rarity, h.rarityPlus)} · ${s.role}</span>
          </div>
          <div class="machine-preview-stat primary ${isTreadmill ? 'treadmill-speed' : 'extraction'}">
            <b>${'★'.repeat(s.primaryStars)}<i>${'☆'.repeat(5 - s.primaryStars)}</i></b>
            <span>${s.primaryLabel} <em>${Math.round(s.primaryVal)} vs ${Math.round(s.expectedPrimary)} <strong>${delta(primaryDelta)}</strong></em></span>
          </div>
          <div class="machine-preview-stat secondary skill">
            <b>${'★'.repeat(s.secondaryStars)}<i>${'☆'.repeat(5 - s.secondaryStars)}</i></b>
            <span>${s.secondaryLabel} <em>${Math.round(s.secondaryVal)} vs ${Math.round(s.expectedSecondary)} <strong>${delta(secondaryDelta)}</strong></em></span>
          </div>
          <div class="machine-preview-note">
            <b>PROJECTED PERFORMANCE</b>
            <span>${s.rateDesc} · ${s.windowDesc}</span>
          </div>`;
      };

      team.forEach(id => {
        const s = machineToonStats(id, r.floor, r.node, machineType);
        const h = Save.hero(id);
        const isTop = id === topPickId;
        const card = el('button', 'machine-toon' + (isTop ? ' top-pick' : ''), `
          <img src="${Art.icon(id)}" alt="">
          <span>
            <b>${HEROES[id].name}${isTop ? ' <mark class="machine-top-tag">BEST</mark>' : ''}</b>
            <small>Lv ${h.level} · ${rarityLabel(h.rarity, h.rarityPlus)}</small>
          </span>
          <i>
            <em>${'★'.repeat(s.primaryStars)}</em><small>${isTreadmill ? 'RUN SPEED' : 'EXTRACTION'}</small>
            <em>${'★'.repeat(s.secondaryStars)}</em><small>${isTreadmill ? 'CADENCE' : 'SKILL CHECK'}</small>
          </i>
        `);
        card.type = 'button';
        card.setAttribute('aria-pressed', 'false');
        card.setAttribute('aria-label', `${HEROES[id].name}. ${s.primaryStars} ${s.primaryLabel.toLowerCase()} stars, ${s.secondaryStars} ${s.secondaryLabel.toLowerCase()} stars.`);
        card.onclick = () => {
          state.selected = id;
          $$('.machine-toon', body).forEach(x => {
            const active = x === card;
            x.classList.toggle('selected', active);
            x.setAttribute('aria-pressed', String(active));
          });
          card.classList.add('selected');
          updatePreview(id, s);
          const start = $('.machine-start', body);
          start.disabled = false;
          start.textContent = isTreadmill
            ? `RUN WITH ${HEROES[id].name.toUpperCase()} ›`
            : `START WITH ${HEROES[id].name.toUpperCase()} ›`;
          Sound.play('ui_move');
        };
        grid.appendChild(card);
      });
      $('.machine-start', body).onclick = startMachine;

      // Auto-select the top pick by default so the player immediately sees optimal stats
      if (topPickId) {
        const topCard = grid.querySelector('.machine-toon.top-pick') || grid.firstElementChild;
        if (topCard) topCard.click();
      }
    };

    let introClosed = false;
    const introTimers = [];
    const playIntro = () => {
      const cast = team.map((id, i) => `<div class="machine-intro-toon toon-${i}" style="--i:${i}"><img src="${Art.hero(id)}" alt="${HEROES[id].name}"><b>${HEROES[id].name}</b></div>`).join('');
      if (isTreadmill) {
        body.innerHTML = `<div class="machine-intro treadmill-intro">
          <div class="machine-intro-kicker">FLOOR ${String(r.floor).padStart(2, '0')} // INDUSTRIAL GENERATOR</div>
          <div class="machine-intro-title"><small>THE CONVEYOR POWERS ON</small><b>TREADMILL DISCOVERED!</b></div>
          <div class="machine-intro-stage">
            <div class="machine-intro-scan"></div><div class="machine-intro-floor"></div>
            <div class="machine-intro-team">${cast}</div>
            <div class="machine-intro-machine treadmill-intro-prop">
              <span class="treadmill-intro-beacon" aria-hidden="true"></span>
              <i></i><img src="uploads/treadmill-machine.png" alt="Treadmill Generator">
              <b>TREADMILL GENERATOR</b>
            </div>
            <div class="machine-intro-caption">
              <b>TREADMILL EXTRACTION DRILL</b>
              <span>Run Speed powers the generator cylinder. Maintain steady runner cadence or Twisteds will rush the room!</span>
            </div>
          </div>
          <button class="machine-intro-skip" type="button">SKIP TO RUNNER SELECT ›</button>
        </div>`;
      } else {
        body.innerHTML = `<div class="machine-intro">
          <div class="machine-intro-kicker">FLOOR ${String(r.floor).padStart(2, '0')} // UNIDENTIFIED SIGNAL</div>
          <div class="machine-intro-title"><small>THE ROOM GOES QUIET</small><b>WHAT IS THAT THING?</b></div>
          <div class="machine-intro-stage">
            <div class="machine-intro-scan"></div><div class="machine-intro-floor"></div>
            <div class="machine-intro-team">${cast}</div>
            <div class="machine-intro-machine"><i></i><img src="uploads/image-36.png" alt="Giant Ichor Machine"><b>ICHOR MACHINE</b></div>
            <div class="machine-intro-drip drip-a"></div><div class="machine-intro-drip drip-b"></div><div class="machine-intro-drip drip-c"></div>
            <div class="machine-intro-caption"><b>ICHOR EXTRACTION STATION</b><span>One Toon can work it. Nobody knows what happens if they mess up.</span></div>
          </div>
          <button class="machine-intro-skip" type="button">SKIP TO TOON SELECT ›</button>
        </div>`;
      }
      const intro = $('.machine-intro', body);
      const finishIntro = () => {
        if (introClosed) return;
        introClosed = true; introTimers.forEach(clearTimeout); introTimers.length = 0;
        Sound.play('ui_ok', { priority: true });
        renderChooser();
      };
      $('.machine-intro-skip', body).onclick = finishIntro;
      introTimers.push(setTimeout(() => { intro.classList.add('machine-intro-awake'); Sound.play('machine_start', { priority: true }); }, 560));
      introTimers.push(setTimeout(() => intro.classList.add('machine-intro-alert'), 1450));
      introTimers.push(setTimeout(finishIntro, 3900));
    };
    const machineBox = UI.modal('', body, { bare: true, className: 'machine-modal', onClose: () => {
      introClosed = true; introTimers.forEach(clearTimeout);
      if (screen.cur === 'depths' && !screen._endlessLeaving && !BattleScreen.active) screen.render();
    } });
    machineBox.style.setProperty('--machine-bg', `url("${bgForFloor(r.floor, r.node)}")`);
    playIntro();
  },

  runTreasure() {
    const r = Depths.run();
    const roll = Depths.roomRng(r.floor, r.node, 'treasure');
    const gain = {
      ichor: Math.round(900 * (1 + r.floor * .25)), tape: 8 + r.floor,
      star: 25 + r.floor * 3, notes: 6 + r.floor, gold: 1, exp: 600 + r.floor * 80,
      counterToken: 1
    };
    if (roll.chance(.3)) gain.diamond = 1;
    if (roll.chance(.25)) gain.tape = 2;
    const body = el('div');
    body.appendChild(el('div', 'muted tiny', 'A supply cache, mostly intact. Take it to add these rewards to your run.'));
    Object.keys(gain).forEach((k, i) => {
      if (!RES[k]) return;
      const row = el('div', 'reward', `<i>${RES[k].icon}</i><div class="grow b">${RES[k].name}</div>
        <div class="b" style="color:var(--gold)">+${fmt(gain[k])}</div>`);
      row.style.animationDelay = (i * .06) + 's';
      body.appendChild(row);
    });
    let claimed = false;
    const ok = el('button', 'btn pri wide', 'Take it');
    ok.style.marginTop = '10px';
    ok.onclick = () => {
      if (claimed) return;
      claimed = true;
      Save.give(gain);
      Sound.play('endless_cache', { vol: .82, priority: true });
      Sound.play('get_rare', { delay: 120, vol: .55 });
      UI.closeModal({ skipHook: true });
      Depths.queueDraft('cache');
      const floorCleared = Depths.advance(true);
      if (this._depthChainActive) this.afterDepthRoom(floorCleared);
      else this.render();
    };
    body.appendChild(ok);
    UI.modal('🎁 Cache', body, { sticky: true, closeButton: false, onClose: () => {
      if (!claimed && this.cur === 'depths' && !this._endlessLeaving && !BattleScreen.active) this.leaveDepths('home');
    }});
  },

  runRest() {
    let resolved = false;
    const body = el('div');
    body.appendChild(el('div', 'muted tiny', 'A quiet room. You will not get another one soon.'));
    const opt = (label, sub, fn) => {
      const n = el('div', 'choice');
      n.innerHTML = `<b>${label}</b><div class="mini muted">${sub}</div>`;
      n.onclick = () => {
        if (resolved) return;
        resolved = true;
        $$('.choice', body).forEach(choice => { choice.disabled = true; choice.style.pointerEvents = 'none'; });
        Sound.play('ui_ok'); fn(); UI.closeModal({ skipHook: true });
        const floorCleared = Depths.advance(true);
        if (this._depthChainActive) this.afterDepthRoom(floorCleared);
        else this.render();
      };
      return n;
    };
    body.appendChild(opt('Sleep', 'Restore 35% HP to the squad and revive one at 25% HP.',
      () => { Depths.healRun(.35); Depths.reviveOne(.25); }));
    body.appendChild(opt('Train', 'Gain Tape and skill up a random owned Hero once.',
      () => { Save.give(masteryRewardBundle({ tape: 25, notes: 18 })); const ids = Save.ownedIds(); const run = Depths.run(); const roll = Depths.roomRng(run.floor, run.node, 'camp-train'); const id = roll.pick(ids);
        const k = roll.pick(SKILL_ORDER.filter(x => Save.hero(id).rarity >= SKILL_RARITY[x]));
        if (k) { Save.hero(id).skills[k]++; UI.toast(HEROES[id].name + ' ' + k + ' skill up'); } }));
    body.appendChild(opt('Scavenge', 'Ichor and a Gold Crate, no healing.',
      () => Save.give(masteryRewardBundle({ ichor: 1600, gold: 1 }))));
    UI.modal('🔥 Camp', body, { sticky: true, closeButton: false, onClose: () => {
      if (!resolved && this.cur === 'depths' && !this._endlessLeaving && !BattleScreen.active) this.leaveDepths('home');
    }});
  },

  /* ============================================================ DEPTH DECK */
  openDepthDraft() {
    const r = Depths.run();
    if (!r.pendingDraft) { this.openDepthDeck(); return; }
    const reason = Depths.draftReason();
    const reasonCopy = {
      first: ['BUILD THE RUN', 'Choose one card. Stack matching cards to push a build further.'],
      floor: ['FLOOR CLEARED!', 'The run deals three more tricks. Pick one.'],
      elite: ['ELITE SPOILS!', 'A stronger enemy means a stronger shot at rare cards.'],
      cache: ['CACHE CARD!', 'Something useful was tucked behind the supplies.'],
      boss: ['BOSS DEFEATED!', 'Boss drafts have greatly improved Epic odds.']
    }[reason] || ['CHOOSE A CARD', 'Add one card to this run.'];
    const body = el('div', 'depth-draft');
    const top = el('div', 'depth-draft-head');
    top.innerHTML = `<div><span>ENDLESS RUN</span><b>${reasonCopy[0]}</b><small>${reasonCopy[1]}</small></div>`;
    body.appendChild(top);

    const cards = el('div', 'depth-card-row');
    cards.setAttribute('role', 'group');
    cards.setAttribute('aria-label', 'Choose one Endless Run card');
    Depths.draftOptions().forEach((id, i) => {
      const c = DEPTH_CARDS[id], at = Depths.cardStack(id), next = at + 1;
      const n = el('button', `depth-draft-card rarity-${c.rarity}`);
      n.type = 'button';
      n.setAttribute('aria-label', `${c.name}. ${c.desc(next)} Take card.`);
      n.setAttribute('aria-pressed', 'false');
      n.style.setProperty('--deal', i);
      n.innerHTML = `<span class="depth-card-rarity">${DEPTH_CARD_RARITY[c.rarity].label}</span>
        <span class="depth-card-level">${at ? `LV ${at} → ${next}` : 'NEW'}</span>
        <span class="depth-card-art"><img src="${c.icon}" alt=""></span>
        <strong>${c.name}</strong><span class="depth-card-desc">${c.desc(next)}</span>
        <em>TAKE CARD</em>`;
      n.onclick = () => {
        if (cards.classList.contains('choosing') || !Depths.pickCard(id)) return;
        cards.classList.add('choosing'); n.classList.add('picked');
        n.setAttribute('aria-pressed', 'true');
        Array.from(cards.children).forEach(x => {
          if (x !== n) {
            x.classList.add('discarded');
            x.setAttribute('aria-pressed', 'false');
          }
        });
        Sound.play(c.rarity === 'epic' ? 'get_rare' : 'ui_ok');
        setTimeout(() => {
          // The player may dismiss the draft during the reveal delay. Do not
          // let this old timer resurrect Endless after we already went Home.
          if (this.cur !== 'depths' || this._endlessLeaving || $('#modal').hidden) return;
          UI.closeModal({ skipHook: true });
          if (this._depthAfterDraft) this.finishDepthDraftStep();
          else this.render();
        }, 620);
      };
      cards.appendChild(n);
    });
    body.appendChild(cards);

    const foot = el('div', 'depth-draft-foot');
    foot.innerHTML = `<span>${r.pendingDraft} choice${r.pendingDraft === 1 ? '' : 's'} waiting<small class="depth-draft-hint">Swipe to compare cards</small></span>`;
    const reroll = el('button', 'btn depth-reroll', `↻ REROLL · ${r.rerolls || 0}`);
    if (!r.rerolls) reroll.disabled = true;
    reroll.onclick = () => {
      if (!Depths.rerollDraft()) { Sound.play('ui_err'); return; }
      Sound.play('ui_move'); this.openDepthDraft();
    };
    foot.appendChild(reroll); body.appendChild(foot);
    UI.modal('', body, {
      bare: true,
      className: 'depth-draft-modal',
      onClose: () => {
        if (this.cur === 'depths' && !this._endlessLeaving && !BattleScreen.active) this.leaveDepths('home');
      }
    });
  },

  openDepthDeck() {
    const r = Depths.run(), ids = Object.keys(r.cards || {}).filter(id => r.cards[id] && DEPTH_CARDS[id]);
    const body = el('div', 'depth-deck-list');
    if (!ids.length) body.appendChild(el('div', 'muted tiny', 'Your first card is waiting on the Endless Run screen.'));
    ids.sort((a, b) => DEPTH_CARD_IDS.indexOf(a) - DEPTH_CARD_IDS.indexOf(b)).forEach(id => {
      const c = DEPTH_CARDS[id], stack = r.cards[id];
      const row = el('div', `depth-deck-row rarity-${c.rarity}`);
      row.innerHTML = `<img src="${c.icon}" alt=""><div class="grow"><b>${c.name}</b>
        <small>${c.desc(stack)}</small></div><i>LV ${stack}</i>`;
      body.appendChild(row);
    });
    const trinketRanks = Save.data.team.filter(Boolean).reduce((total, id) => {
      const h = Save.hero(id);
      return total + (h.trinkets || []).reduce((n, uid) => {
        const copy = uid && Save.data.trinketInv[uid];
        return n + (copy ? trinketResonance(copy.rank) : 0);
      }, 0);
    }, 0);
    const note = el('div', 'depth-resonance-note', `<b>🔧 Trinket Resonance · ${Number(trinketRanks.toFixed(1))}</b>
      <span>In Endless Run, each equipped rank through 5 adds 2.5% Max HP and 1.8% Attack, Magic, and defenses. Higher ranks add 35% as much resonance per rank. Gem Resonance amplifies it.</span>`);
    body.appendChild(note);
    UI.modal('Endless Deck', body, {
      onClose: () => {
        if (this.cur === 'depths' && !this._endlessLeaving && !BattleScreen.active) this.leaveDepths('home');
      }
    });
  }

});
