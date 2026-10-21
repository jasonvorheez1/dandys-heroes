/* screens/roster.js - the Heroes collection grid and Mass Upgrade modal.
   Extends Screens (screens/core.js). */
'use strict';

function rosterUpgradeState(id) {
  const h = Save.hero(id);
  if (!h) return [];
  const ready = [];
  if (h.level < Progress.levelCap() && Save.can({ ichor: levelCost(h.level), exp: levelExp(h.level) })) ready.push('LEVEL');
  if (Progress.canStar(id)) ready.push('STAR');
  if (Progress.canRarity(id)) ready.push('RARITY');
  if (SKILL_ORDER.some(key => h.rarity >= SKILL_RARITY[key] && (h.skills[key] || 1) < Progress.skillCap(id) && Save.can(skillCost(h.skills[key] || 1)))) ready.push('SKILL');
  return ready;
}

/* Plan with a copy of the wallet and Hero ranks. The preview never edits the
   save, and applying the plan uses the existing Progress actions. */
function rosterMassPlan(ids, selected) {
  const wallet = { ...Save.data.res };
  const initial = { ...wallet };
  const operations = ids.map(id => {
    const h = Save.hero(id);
    return { id, level: h.level, stars: h.stars, shards: h.shards, rarity: h.rarity,
      rarityPlus: h.rarityPlus, skills: { ...h.skills }, levels: 0, promotions: 0, rarities: 0, shardsSpent: 0, skillLevels: {} };
  });
  const can = cost => Object.keys(cost).every(key => (wallet[key] || 0) >= cost[key]);
  const spend = cost => { Object.keys(cost).forEach(key => { wallet[key] = (wallet[key] || 0) - cost[key]; }); };
  const levelCap = Progress.levelCap();
  const skillCap = Math.min(SKILL_MAX_LEVEL, levelCap);

  if (selected.promotions) operations.forEach(op => {
    const mult = COOKIE_HERO_IDS.includes(op.id) ? 1.2 : obtainOf(op.id).costMult;
    while (op.stars < 5) {
      const cost = { shards: Math.max(1, Math.round(STAR_COST[op.stars] * mult * Progress.promotionShardMultiplier())),
        ichor: Math.round(STAR_ICHOR[op.stars] * mult),
        star: Math.max(1, Math.round(STAR_DUST_COST[op.stars] * mult * Progress.promotionShardMultiplier())) };
      if (op.shards < cost.shards || !can({ ichor: cost.ichor, star: cost.star })) break;
      op.shards -= cost.shards; op.shardsSpent += cost.shards;
      spend({ ichor: cost.ichor, star: cost.star }); op.stars++; op.promotions++;
    }
  });
  if (selected.rarities) operations.forEach(op => {
    let next;
    while ((next = rarityNext(op.rarity, op.rarityPlus))) {
      const rank = rarityRank(next.tier, next.plus);
      const cost = { core: RARITY_CORE_STEPS[rank], ichor: RARITY_ICHOR_STEPS[rank] };
      if (!can(cost)) break;
      spend(cost); op.rarity = next.tier; op.rarityPlus = next.plus; op.rarities++;
    }
  });
  if (selected.skills) operations.forEach(op => {
    SKILL_ORDER.forEach(key => {
      if (op.rarity < SKILL_RARITY[key]) return;
      let level = op.skills[key] || 1;
      while (level < skillCap) {
        const cost = skillCost(level);
        if (!can(cost)) break;
        spend(cost); level++; op.skillLevels[key] = (op.skillLevels[key] || 0) + 1;
      }
      op.skills[key] = level;
    });
  });
  // Levels grant Mastery XP, so plan and apply them last. That keeps the
  // preview stable even when leveling unlocks a new account cap or reward.
  if (selected.levels) operations.forEach(op => {
    while (op.level < levelCap) {
      const cost = { ichor: levelCost(op.level), exp: levelExp(op.level) };
      if (!can(cost)) break;
      spend(cost); op.level++; op.levels++;
    }
  });
  const counts = { levels: 0, promotions: 0, rarities: 0, skills: 0 };
  operations.forEach(op => {
    counts.levels += op.levels; counts.promotions += op.promotions; counts.rarities += op.rarities;
    counts.skills += Object.values(op.skillLevels).reduce((a, b) => a + b, 0);
  });
  const spent = Object.fromEntries(Object.keys(initial).map(key => [key, Math.max(0, (initial[key] || 0) - (wallet[key] || 0))]));
  spent.shards = operations.reduce((total, op) => total + op.shardsSpent, 0);
  return { operations, counts, spent, total: Object.values(counts).reduce((a, b) => a + b, 0) };
}

Object.assign(Screens, {

  /* ============================================================ ROSTER */
  roster(s) {
    const owned = Save.ownedIds();
    const missing = PLAYABLE_IDS.filter(id => !owned.includes(id));

    const entering = !this._rosterInView;
    this._rosterInView = true;
    if (entering) {
      Sound.play('hero_roster_enter', { vol: .56, throttle: 0 });
      setTimeout(() => { if (this.cur === 'roster') Sound.play('ding', { vol: .22, throttle: 0 }); }, 210);
    }
    const page = el('div', 'collection-page' + (entering ? ' collection-entering' : ''));
    const massLocked = !this.modeUnlocked('massUpgrade');
    const cast = owned.slice(0, 5).map((id, i) =>
      `<div class="collection-cast-icon cast-${i}" style="--cast-i:${i}"><img src="${Art.icon(id)}" alt="${HEROES[id].name}"></div>`).join('');
    page.innerHTML = `
      <section class="collection-banner">
        <div class="collection-sky" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i><b>✦</b><b>✦</b></div>
        <div class="collection-banner-copy">
          <small>UNIT ROSTER</small>
          <h1>MY <b>HEROES</b></h1>
          <p>Build your formation from recruited units.</p>
        </div>
        <div class="collection-cast" aria-hidden="true">${cast}</div>
        <div class="collection-count"><b>${owned.length}</b><span>OF ${PLAYABLE_IDS.length}<br>COLLECTED</span></div>
        <div class="collection-cloud cloud-a" aria-hidden="true"></div><div class="collection-cloud cloud-b" aria-hidden="true"></div>
      </section>
      <section class="collection-toolbar">
        <div class="collection-tool-row">
          <button class="collection-action action-team" id="collectionTeam"><span>👥</span><b>EDIT TEAM</b></button>
          <button class="collection-action action-upgrade${massLocked ? ' locked' : ''}" id="collectionUpgrade"><span>${massLocked ? '🔒' : '⚡'}</span><b>MASS UPGRADE</b></button>
        </div>
        <div class="collection-progress"><i style="width:${Math.round(owned.length / Math.max(1, PLAYABLE_IDS.length) * 100)}%"></i></div>
        <div class="collection-progress-label"><span>${owned.length} UNITS RECRUITED</span><b>POWER ${fmt(Progress.teamPower(Save.data.team))}</b></div>
      </section>
      <section class="collection-shelf">
        <div class="collection-shelf-head"><div><small>RECRUITED UNITS</small><b>Unit Roster</b></div><span id="collectionSortLabel"></span></div>
        <div class="roster-find"><input id="collectionSearch" type="search" placeholder="Find a Hero" aria-label="Find a Hero" autocomplete="off"><span id="collectionVisibleCount"></span></div>
        <div class="roster-filters" id="collectionFilters" aria-label="Filter Heroes"></div>
        <div class="collection-sort" id="collectionSort"></div>
        <div class="collection-grid roster-owned-grid" id="collectionOwned"></div>
      </section>
      ${missing.length ? `<section class="collection-shelf collection-missing-shelf"><div class="collection-shelf-head"><div><small>UNRECRUITED UNITS</small><b>Available to recruit</b></div><span>${missing.length} LEFT</span></div><div class="collection-grid" id="collectionMissing"></div></section>` : ''}`;
    s.appendChild(page);

    $('#collectionTeam', page).onclick = () => { Sound.play('hero_roster_action', { vol: .48, throttle: 0 }); this.openTeamEditor(); };
    $('#collectionUpgrade', page).onclick = () => { if (massLocked) return this.showModeGate('massUpgrade'); Sound.play('hero_roster_action', { vol: .48, throttle: 0 }); this.massUpgrade(); };

    let sortBy = Save.data.opt.sort || 'power';
    const sorters = {
      power: (a, b) => Progress.power(b) - Progress.power(a),
      level: (a, b) => Save.hero(b).level - Save.hero(a).level,
      role: (a, b) => HEROES[a].role.localeCompare(HEROES[b].role),
      name: (a, b) => HEROES[a].name.localeCompare(HEROES[b].name)
    };
    if (!sorters[sortBy]) sortBy = 'power';
    const sortRow = $('#collectionSort', page);
    const sortButtons = {};
    Object.keys(sorters).forEach(k => {
      const b = el('button', 'collection-sort-btn' + (k === sortBy ? ' selected' : ''), k === 'power' ? '⚡ POWER' : k.toUpperCase());
      b.onclick = () => {
        sortBy = k; Save.data.opt.sort = k; Save.write(); Sound.play('hero_roster_sort', { vol: .44, throttle: 0 });
        ownedTiles.sort((a, b) => sorters[k](a.dataset.heroId, b.dataset.heroId)).forEach(tile => grid.appendChild(tile));
        Object.entries(sortButtons).forEach(([key, button]) => button.classList.toggle('selected', key === k));
        $('#collectionSortLabel', page).textContent = k.toUpperCase();
      };
      sortRow.appendChild(b);
      sortButtons[k] = b;
    });
    $('#collectionSortLabel', page).textContent = (sorters[sortBy] ? sortBy : 'power').toUpperCase();
    const grid = $('#collectionOwned', page);
    const ready = Object.fromEntries(owned.map(id => [id, rosterUpgradeState(id)]));
    const ownedTiles = [];
    owned.slice().sort(sorters[sortBy] || sorters.power).forEach(id => {
      const t = UI.heroTile(id, { useIcon: true, roster: true, onClick: () => HeroPage.open(id) });
      t.style.setProperty('--tile-i', grid.children.length);
      if (Save.data.team.includes(id)) t.classList.add('collection-on-team');
      if (ready[id].length) {
        const cue = el('div', 'roster-upgrade-cue', `↑ ${ready[id].join(' · ')}`);
        $('.roster-card-info', t).appendChild(cue);
      }
      t.dataset.heroId = id;
      grid.appendChild(t);
      ownedTiles.push(t);
    });

    const missingTiles = [];
    if (missing.length) {
      const g2 = $('#collectionMissing', page);
      missing.sort((a, b) => obtainOf(a).rank - obtainOf(b).rank)
        .forEach(id => {
          const t = UI.heroTile(id, { useIcon: true, onClick: () => UI.unlockInfo(id) });
          t.style.setProperty('--tile-i', g2.children.length);
          t.dataset.heroId = id;
          g2.appendChild(t);
          missingTiles.push(t);
        });
    }
    const search = $('#collectionSearch', page);
    search.value = this._rosterSearch || '';
    const filterRow = $('#collectionFilters', page);
    const filterButtons = {};
    [['all', 'ALL'], ['team', 'ON TEAM'], ['ready', 'UPGRADE READY']].forEach(([key, label]) => {
      const button = el('button', 'roster-filter', label);
      button.type = 'button';
      button.setAttribute('aria-pressed', String((this._rosterFilter || 'all') === key));
      button.onclick = () => { this._rosterFilter = key; updateVisible(); };
      filterRow.appendChild(button); filterButtons[key] = button;
    });
    const updateVisible = () => {
      const query = search.value.trim().toLocaleLowerCase();
      const filter = this._rosterFilter || 'all';
      this._rosterSearch = search.value;
      let shown = 0, missingShown = 0;
      ownedTiles.forEach(tile => {
        const id = tile.dataset.heroId;
        const show = HEROES[id].name.toLocaleLowerCase().includes(query)
          && (filter === 'all' || filter === 'team' && Save.data.team.includes(id) || filter === 'ready' && ready[id].length);
        tile.classList.toggle('roster-hidden', !show);
        if (show) shown++;
      });
      missingTiles.forEach(tile => {
        const show = filter === 'all' && HEROES[tile.dataset.heroId].name.toLocaleLowerCase().includes(query);
        tile.classList.toggle('roster-hidden', !show);
        if (show) missingShown++;
      });
      Object.entries(filterButtons).forEach(([key, button]) => button.setAttribute('aria-pressed', String(filter === key)));
      $('#collectionVisibleCount', page).textContent = `${shown} SHOWN`;
      const missingShelf = $('.collection-missing-shelf', page);
      if (missingShelf) missingShelf.classList.toggle('roster-hidden', !missingShown);
      grid.classList.toggle('roster-grid-empty', !shown);
      grid.dataset.emptyText = query ? 'No Heroes match that search.' : filter === 'team' ? 'Add Heroes to your team to see them here.' : 'No affordable upgrades right now.';
    };
    search.oninput = updateVisible;
    updateVisible();
  },

  leaveRoster(destination) {
    if (this._rosterLeaving) return;
    const dest = destination || 'home';
    if (this.cur !== 'roster') { this.go(dest, { skipRosterExit: true }); return; }
    this._rosterInView = false;
    this._rosterLeaving = true;
    const page = $('.collection-page');
    if (page) page.classList.add('collection-leaving');
    Sound.play('hero_roster_exit', { vol: .54, priority: true });
    const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
    clearTimeout(this._rosterExitTimer);
    this._rosterExitTimer = setTimeout(() => {
      this._rosterLeaving = false;
      this.go(dest, { skipRosterExit: true, silent: true });
    }, reduced ? 40 : 380);
  },

  massUpgrade() {
    if (!this.modeUnlocked('massUpgrade')) { this.showModeGate('massUpgrade'); return; }
    const body = el('div');
    const choices = { levels: true, promotions: true, rarities: true, skills: true };
    let scope = 'team';
    const intro = el('div', 'roster-mass-intro', 'Choose the Heroes and upgrades. Stars, rarity, and skills are funded before levels; your team goes first.');
    body.appendChild(intro);
    const scopeRow = el('div', 'roster-mass-scope');
    const teamButton = el('button', null, 'CURRENT TEAM');
    const allButton = el('button', null, 'FULL ROSTER');
    [teamButton, allButton].forEach(button => { button.type = 'button'; scopeRow.appendChild(button); });
    body.appendChild(scopeRow);
    const actionList = el('div', 'roster-mass-actions');
    const toggles = {};
    [['levels', 'Levels', 'EXP + Ichor'], ['promotions', 'Star promotions', 'Hero Shards + Ichor'],
      ['rarities', 'Rarity', 'Cores + Ichor'], ['skills', 'Skills', 'Tape + Notes + Ichor']].forEach(([key, label, cost]) => {
      const row = el('label', 'roster-mass-action');
      row.innerHTML = `<input type="checkbox" checked><span><b>${label}</b><small>${cost}</small></span><strong data-count="${key}">—</strong>`;
      const input = $('input', row);
      input.onchange = () => { choices[key] = input.checked; refresh(); };
      toggles[key] = input;
      actionList.appendChild(row);
    });
    body.appendChild(actionList);
    const preview = el('div', 'roster-mass-preview');
    const apply = el('button', 'btn wide gold roster-mass-apply', 'APPLY UPGRADES');
    apply.type = 'button';
    body.appendChild(preview); body.appendChild(apply);
    const targetIds = () => {
      const owned = new Set(Save.ownedIds());
      const team = [...new Set(Save.data.team.filter(id => id && owned.has(id)))];
      return scope === 'team' ? team : team.concat([...owned].filter(id => !team.includes(id)));
    };
    let plan;
    const refresh = () => {
      scopeRow.querySelectorAll('button').forEach((button, index) => button.classList.toggle('selected', scope === (index ? 'all' : 'team')));
      plan = rosterMassPlan(targetIds(), choices);
      Object.keys(choices).forEach(key => { $('[data-count="' + key + '"]', actionList).textContent = choices[key] ? '+' + fmt(plan.counts[key]) : 'OFF'; });
      const costs = Object.entries(plan.spent).filter(([, amount]) => amount > 0).map(([key, amount]) => key === 'shards' ? `◈ ${fmt(amount)} Hero Shards` : `${RES[key] ? RES[key].icon : key} ${fmt(amount)}`);
      const affected = plan.operations.filter(op => op.levels || op.promotions || op.rarities || Object.keys(op.skillLevels).length);
      preview.innerHTML = `<b>${affected.length} Hero${affected.length === 1 ? '' : 'es'} improve${affected.length === 1 ? 's' : ''}</b><span>${costs.length ? 'Estimated spend · ' + costs.join(' · ') : 'No resources spent'}</span>
        ${affected.length ? `<details><summary>SHOW HERO CHANGES</summary><div>${affected.map(op => `<span><b>${HEROES[op.id].name}</b>${[
          op.promotions ? `+${op.promotions}★` : '', op.rarities ? `+${op.rarities} rarity` : '',
          Object.values(op.skillLevels).reduce((a, b) => a + b, 0) ? `+${Object.values(op.skillLevels).reduce((a, b) => a + b, 0)} skill` : '',
          op.levels ? `+${op.levels} levels` : ''
        ].filter(Boolean).join(' · ')}</span>`).join('')}</div></details>` : ''}`;
      apply.disabled = !plan.total;
    };
    teamButton.onclick = () => { scope = 'team'; refresh(); };
    allButton.onclick = () => { scope = 'all'; refresh(); };
    apply.onclick = () => {
      const ids = targetIds();
      const current = rosterMassPlan(ids, choices);
      if (!current.total) { refresh(); return; }
      const costText = Object.entries(current.spent).filter(([, amount]) => amount > 0)
        .map(([key, amount]) => key === 'shards' ? `◈ ${fmt(amount)} Hero Shards` : `${RES[key] ? RES[key].icon : key} ${fmt(amount)}`).join(' · ');
      UI.confirm('Apply mass upgrades?', `${scope === 'team' ? 'Current team' : 'Full roster'} · ${fmt(current.total)} upgrades · ${costText}.`, () => {
        Progress._bulkQuiet = true;
        try {
          Save.batchWrite(() => {
            current.operations.forEach(op => { for (let i = 0; i < op.promotions; i++) Progress.starUp(op.id); });
            current.operations.forEach(op => { for (let i = 0; i < op.rarities; i++) Progress.rarityUp(op.id); });
            current.operations.forEach(op => SKILL_ORDER.forEach(key => {
              if (op.skillLevels[key]) Progress.skillUp(op.id, key, op.skillLevels[key]);
            }));
            current.operations.forEach(op => { if (op.levels) Progress.levelUp(op.id, op.levels); });
          });
        } finally { Progress._bulkQuiet = false; }
        Sound.play('get_rare');
        UI.toast(`⚡ ${fmt(current.total)} upgrades applied to ${scope === 'team' ? 'your team' : 'your roster'}`);
        this.render();
      });
    };
    refresh();
    UI.modal('⚡ Mass Upgrade', body);
  }

});
