/* Heroes roster. Kept separate from the legacy game bundle so the menu can
   change without touching combat, progression, or save rules. */
'use strict';

Screens.roster = function (screen) {
  const owned = Save.ownedIds().filter(id => HEROES[id]);
  const ownedSet = new Set(owned);
  const missing = PLAYABLE_IDS.filter(id => HEROES[id] && !ownedSet.has(id));
  const team = new Set(Save.data.team || []);
  const ready = Object.fromEntries(owned.map(id => [id, rosterUpgradeState(id)]));
  const collectionReady = HeroCollections.catalogue.filter(c => HeroCollections.claimable(c)).length;
  const massLocked = !this.modeUnlocked('massUpgrade');
  const opt = Save.data.opt || (Save.data.opt = {});
  const validSorts = ['power', 'level', 'role', 'name'];
  let sortBy = validSorts.includes(opt.sort) ? opt.sort : 'power';
  let view = opt.rosterView === 'list' ? 'list' : 'grid';
  let filter = ['all', 'team', 'ready'].includes(this._rosterFilter) ? this._rosterFilter : 'all';
  let showMissing = !!this._rosterShowMissing;

  const page = document.createElement('div');
  page.className = 'hero-roster-page';
  page.innerHTML = `
    <div class="hero-roster-heading">
      <div><span class="hero-roster-kicker">COLLECTION</span><h1>Heroes</h1></div>
      <span class="hero-roster-total"><strong>${owned.length}</strong><small> / ${PLAYABLE_IDS.length}</small></span>
    </div>
    <div class="hero-roster-actions">
      <button id="rosterTeam" type="button">Edit team</button>
      <button id="rosterUpgrade" type="button">${massLocked ? '🔒 ' : ''}Mass upgrade</button>
      <button id="rosterCollections" type="button"><span>✦ Hero Collections</span><em>${collectionReady ? `${collectionReady} reward${collectionReady === 1 ? '' : 's'} ready` : 'Explore groups ›'}</em></button>
    </div>
    <div class="hero-roster-controls">
      <label class="hero-roster-sort">Sort
        <select id="rosterSort" aria-label="Sort heroes">
          <option value="power">Power</option><option value="level">Level</option>
          <option value="role">Role</option><option value="name">Name</option>
        </select>
      </label>
      <div class="hero-roster-view" role="group" aria-label="Hero view">
        <button id="rosterGridView" type="button" aria-label="Grid view" title="Grid view"><span class="roster-grid-icon" aria-hidden="true"></span></button>
        <button id="rosterListView" type="button" aria-label="List view" title="List view"><span class="roster-list-icon" aria-hidden="true"></span></button>
      </div>
    </div>
    <div class="hero-roster-search-wrap"><input id="rosterSearch" type="search" placeholder="Search heroes" aria-label="Search heroes" autocomplete="off"><span id="rosterResultCount"></span></div>
    <div class="hero-roster-filters" role="group" aria-label="Filter heroes">
      <button type="button" data-filter="all">All</button>
      <button type="button" data-filter="team">On team</button>
      <button type="button" data-filter="ready">Upgrade ready</button>
    </div>
    <div id="rosterOwned" class="hero-roster-grid"></div>
    <div id="rosterEmpty" class="hero-roster-empty" hidden></div>
    <section id="rosterMissingSection" class="hero-roster-missing-section" ${missing.length ? '' : 'hidden'}>
      <button id="rosterMissingToggle" class="hero-roster-missing-toggle" type="button" aria-expanded="false"><span>Not recruited <small id="rosterMissingCount">${missing.length}</small></span><span class="hero-roster-chevron">⌄</span></button>
      <div id="rosterMissing" class="hero-roster-grid" hidden></div>
    </section>`;
  screen.appendChild(page);

  const $r = selector => page.querySelector(selector);
  const ownedGrid = $r('#rosterOwned');
  const missingGrid = $r('#rosterMissing');
  const search = $r('#rosterSearch');
  const sort = $r('#rosterSort');
  search.value = this._rosterSearch || '';
  sort.value = sortBy;

  const makeCard = (id, isOwned) => {
    const hero = HEROES[id];
    const rank = isOwned ? Save.hero(id) : null;
    const card = document.createElement('button');
    card.type = 'button';
    card.className = 'hero-roster-card' + (isOwned ? '' : ' is-missing');
    card.dataset.heroId = id;
    card.dataset.rarity = String(rank ? rank.rarity : 0);
    card.setAttribute('aria-label', isOwned
      ? `${hero.name}, level ${rank.level}, ${heroRole(hero.role)}${team.has(id) ? ', on team' : ''}`
      : `${hero.name}, not recruited`);

    const portrait = document.createElement('span');
    portrait.className = 'hero-roster-portrait';
    const image = document.createElement('img');
    image.src = Art.icon(id);
    image.alt = '';
    image.loading = 'lazy';
    image.onerror = () => {
      image.onerror = null;
      if (image.src !== new URL(Art.hero(id), location.href).href) image.src = Art.hero(id);
    };
    portrait.appendChild(image);
    if (rank) {
      const level = document.createElement('span');
      level.className = 'hero-roster-level';
      level.textContent = rank.level;
      portrait.appendChild(level);
      if (team.has(id)) {
        const teamBadge = document.createElement('span');
        teamBadge.className = 'hero-roster-team-badge';
        teamBadge.textContent = 'TEAM';
        portrait.appendChild(teamBadge);
      }
      if (ready[id].length) {
        const upgrade = document.createElement('span');
        upgrade.className = 'hero-roster-ready';
        upgrade.textContent = '↑';
        upgrade.title = `Upgrade ready: ${ready[id].join(', ')}`;
        portrait.appendChild(upgrade);
      }
    } else {
      const lock = document.createElement('span');
      lock.className = 'hero-roster-lock';
      lock.textContent = 'LOCKED';
      portrait.appendChild(lock);
    }
    card.appendChild(portrait);

    const caption = document.createElement('span');
    caption.className = 'hero-roster-caption';
    const name = document.createElement('strong');
    name.textContent = hero.name;
    caption.appendChild(name);
    const sub = document.createElement('span');
    sub.className = 'hero-roster-sub';
    sub.textContent = isOwned ? `${heroRole(hero.role)} · ${fmt(Progress.power(id))} power` : `${Save.pending(id)} / ${obtainOf(id).unlock} shards`;
    caption.appendChild(sub);
    if (rank) {
      const stars = document.createElement('span');
      stars.className = 'hero-roster-stars';
      stars.textContent = '★'.repeat(rank.stars);
      stars.setAttribute('aria-label', `${rank.stars} stars`);
      caption.appendChild(stars);
    }
    card.appendChild(caption);
    card.addEventListener('click', () => {
      Sound.play('hero_roster_select', { vol: .46, throttle: 0 });
      if (isOwned) HeroPage.open(id);
      else UI.unlockInfo(id);
    });
    return card;
  };

  const ownedCards = owned.map(id => makeCard(id, true));
  const missingCards = missing.map(id => makeCard(id, false));
  missingCards.sort((a, b) => obtainOf(a.dataset.heroId).rank - obtainOf(b.dataset.heroId).rank)
    .forEach(card => missingGrid.appendChild(card));

  const comparators = {
    power: (a, b) => Progress.power(b) - Progress.power(a),
    level: (a, b) => Save.hero(b).level - Save.hero(a).level,
    role: (a, b) => heroRole(HEROES[a].role).localeCompare(heroRole(HEROES[b].role)),
    name: (a, b) => HEROES[a].name.localeCompare(HEROES[b].name)
  };
  const sortCards = () => {
    ownedCards.sort((a, b) => comparators[sortBy](a.dataset.heroId, b.dataset.heroId)
      || HEROES[a.dataset.heroId].name.localeCompare(HEROES[b.dataset.heroId].name));
    ownedGrid.append(...ownedCards);
  };
  const updateView = () => {
    page.classList.toggle('hero-roster-list-view', view === 'list');
    $r('#rosterGridView').setAttribute('aria-pressed', String(view === 'grid'));
    $r('#rosterListView').setAttribute('aria-pressed', String(view === 'list'));
  };
  const updateVisible = () => {
    const query = search.value.trim().toLocaleLowerCase();
    this._rosterSearch = search.value;
    this._rosterFilter = filter;
    let count = 0;
    ownedCards.forEach(card => {
      const id = card.dataset.heroId;
      const visible = HEROES[id].name.toLocaleLowerCase().includes(query)
        && (filter === 'all' || filter === 'team' && team.has(id) || filter === 'ready' && ready[id].length > 0);
      card.hidden = !visible;
      if (visible) count++;
    });
    let missingCount = 0;
    missingCards.forEach(card => {
      const visible = HEROES[card.dataset.heroId].name.toLocaleLowerCase().includes(query);
      card.hidden = !visible;
      if (visible) missingCount++;
    });
    $r('#rosterResultCount').textContent = `${count} shown`;
    const empty = $r('#rosterEmpty');
    empty.hidden = count > 0;
    empty.textContent = query ? 'No recruited heroes match your search.'
      : filter === 'team' ? 'Your team is empty. Use Edit team to add heroes.'
      : 'No upgrades are ready right now.';
    $r('#rosterMissingCount').textContent = missingCount;
    const missingSection = $r('#rosterMissingSection');
    missingSection.hidden = filter !== 'all' || missingCount === 0;
    missingGrid.hidden = !showMissing || missingSection.hidden;
    $r('#rosterMissingToggle').setAttribute('aria-expanded', String(!missingGrid.hidden));
    page.querySelectorAll('[data-filter]').forEach(button =>
      button.setAttribute('aria-pressed', String(button.dataset.filter === filter)));
  };

  $r('#rosterTeam').onclick = () => this.openTeamEditor();
  $r('#rosterUpgrade').onclick = () => massLocked ? this.showModeGate('massUpgrade') : this.massUpgrade();
  $r('#rosterCollections').onclick = () => { this._collectionId = null; this.go('collections'); };
  sort.onchange = () => {
    sortBy = sort.value;
    opt.sort = sortBy;
    Save.write();
    sortCards();
  };
  $r('#rosterGridView').onclick = () => { view = 'grid'; opt.rosterView = view; Save.write(); updateView(); };
  $r('#rosterListView').onclick = () => { view = 'list'; opt.rosterView = view; Save.write(); updateView(); };
  page.querySelectorAll('[data-filter]').forEach(button => {
    button.onclick = () => { filter = button.dataset.filter; updateVisible(); };
  });
  search.oninput = updateVisible;
  $r('#rosterMissingToggle').onclick = () => {
    showMissing = !showMissing;
    this._rosterShowMissing = showMissing;
    updateVisible();
  };

  sortCards();
  updateView();
  updateVisible();
};

Screens.leaveRoster = function (destination) {
  this._rosterInView = false;
  this.go(destination || 'home', { skipRosterExit: true });
};
