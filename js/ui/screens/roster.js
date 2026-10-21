/* screens/roster.js - the Heroes collection grid and Mass Upgrade modal.
   Extends Screens (screens/core.js). */
'use strict';

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
    const sortRow = $('#collectionSort', page);
    Object.keys(sorters).forEach(k => {
      const b = el('button', 'collection-sort-btn' + (k === sortBy ? ' selected' : ''), k === 'power' ? '⚡ POWER' : k.toUpperCase());
      b.onclick = () => { Save.data.opt.sort = k; Save.write(); Sound.play('hero_roster_sort', { vol: .44, throttle: 0 }); this.render(); };
      sortRow.appendChild(b);
    });
    $('#collectionSortLabel', page).textContent = sortBy.toUpperCase();
    const grid = $('#collectionOwned', page);
    owned.slice().sort(sorters[sortBy]).forEach(id => {
      const t = UI.heroTile(id, { useIcon: true, roster: true, onClick: () => HeroPage.open(id) });
      t.style.setProperty('--tile-i', grid.children.length);
      if (Save.data.team.includes(id)) t.classList.add('collection-on-team');
      grid.appendChild(t);
    });

    if (missing.length) {
      const g2 = $('#collectionMissing', page);
      missing.sort((a, b) => obtainOf(a).rank - obtainOf(b).rank)
        .forEach(id => {
          const t = UI.heroTile(id, { useIcon: true });
          t.style.setProperty('--tile-i', g2.children.length);
          g2.appendChild(t);
        });
    }
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
    body.appendChild(el('div', 'muted tiny',
      'Spends resources across your Heroes automatically. Team members are prioritised.'));
    const mk = (label, sub, fn) => {
      const n = el('div', 'choice');
      n.innerHTML = `<b>${label}</b><div class="mini muted">${sub}</div>`;
      n.onclick = () => { fn(); UI.closeModal(); this.render(); };
      return n;
    };
    body.appendChild(mk('Level the team', 'Push all five team Heroes to the Mastery cap.', () => {
      let n = 0; Save.data.team.filter(Boolean).forEach(id => n += Progress.levelMax(id));
      UI.toast(n ? '+' + n + ' levels total' : 'Nothing to gain');
    }));
    body.appendChild(mk('Promote everyone', 'Spend all shards and Ichor on star promotions.', () => {
      let n = 0; Save.ownedIds().forEach(id => { while (Progress.canStar(id)) { Progress.starUp(id); n++; } });
      UI.toast(n ? n + ' promotions' : 'No promotions available');
    }));
    body.appendChild(mk('Raise rarity', 'Spend Rarity Cores across the roster to unlock skills.', () => {
      let n = 0;
      Save.data.team.filter(Boolean).concat(Save.ownedIds()).forEach(id => { while (Progress.canRarity(id)) { Progress.rarityUp(id); n++; } });
      UI.toast(n ? n + ' rarity upgrades' : 'Need more Rarity Cores');
    }));
    body.appendChild(mk('Burn all Tape', 'Max every skill your Tape can reach, team first.', () => {
      let n = 0;
      Save.data.team.filter(Boolean).concat(Save.ownedIds()).forEach(id => n += Progress.skillMaxAll(id));
      UI.toast(n ? '+' + n + ' skill levels' : 'Out of Tape');
    }));
    UI.modal('⚡ Mass Upgrade', body);
  }

});
