/* Shared rankings from signed-in players' cloud saves. */
'use strict';

Object.assign(Screens, {
  async openLeaderboard() {
    if (Save.isTestSession()) {
      const message = el('div', 'leaderboard-status', 'Full Test Save is local. Open your Main Save to view account rankings.');
      UI.modal('The Leaderboards', message);
      return;
    }
    const tabs = [
      { id: 'toons', icon: '🎭', label: 'Most Used Toons', detail: 'Winning battle appearances across all players', unit: 'uses' },
      { id: 'mastery', icon: '🏅', label: 'Highest Mastery', detail: 'Account mastery level', unit: 'mastery' },
      { id: 'stages', icon: '🗺️', label: 'Stages Completed', detail: 'Friendship chapters, trial stages, and event clears', unit: 'stages' },
      { id: 'arena', icon: '⚔️', label: 'Arena Wins', detail: 'Lifetime Colosseum victories', unit: 'wins' },
      { id: 'floors', icon: '🛗', label: 'Highest Floor', detail: 'Deepest Endless floor cleared', unit: 'floor' }
    ];
    this._leaderboardTab = this._leaderboardTab || 'toons';

    const body = el('div', 'leaderboard-shell');
    const header = el('header', 'leaderboard-head');
    const brand = el('div', 'leaderboard-brand');
    brand.append(el('small', '', 'GARDENVIEW · GLOBAL RANKINGS'), el('h2', '', 'The Leaderboards'));
    const audience = el('span', 'leaderboard-audience', 'Loading players…');
    const close = el('button', 'leaderboard-close', '×');
    close.type = 'button';
    close.setAttribute('aria-label', 'Close leaderboard');
    close.onclick = () => UI.closeModal();
    header.append(brand, audience, close);

    const tabBar = el('div', 'leaderboard-tabs');
    tabBar.setAttribute('role', 'tablist');
    tabBar.setAttribute('aria-label', 'Leaderboard categories');
    const summary = el('div', 'leaderboard-summary');
    const summaryIcon = el('i', 'leaderboard-summary-icon');
    const summaryCopy = el('div', 'leaderboard-summary-copy');
    const summaryTitle = el('b');
    const summaryDetail = el('small');
    summaryCopy.append(summaryTitle, summaryDetail);
    const search = el('label', 'leaderboard-search');
    const searchIcon = el('i', '', '⌕');
    const searchInput = el('input');
    searchInput.type = 'search';
    searchInput.placeholder = 'Find a Toon';
    searchInput.setAttribute('aria-label', 'Search Toons');
    search.append(searchIcon, searchInput);
    summary.append(summaryIcon, summaryCopy, search);

    const status = el('div', 'leaderboard-status', 'Connecting to the rankings…');
    status.setAttribute('role', 'status');
    const retry = el('button', 'leaderboard-retry', 'Try again');
    retry.type = 'button';
    retry.hidden = true;
    const podium = el('section', 'leaderboard-podium');
    podium.setAttribute('aria-label', 'Top three');
    const listHead = el('div', 'leaderboard-list-head');
    const listLabel = el('b');
    const listCount = el('small');
    listHead.append(listLabel, listCount);
    const list = el('ol', 'leaderboard-list');
    body.append(header, tabBar, summary, status, retry, podium, listHead, list);
    UI.modal('', body, { className: 'leaderboard-modal', bare: true });

    let data = null;
    const rankedRows = tab => {
      if (!data) return [];
      if (tab.id === 'toons') {
        const usage = new Map((data.toons || []).map(row => [row.id, Number(row.score) || 0]));
        return PLAYABLE_IDS.map(id => ({ id, score: usage.get(id) || 0 }))
          .sort((a, b) => b.score - a.score || HEROES[a.id].name.localeCompare(HEROES[b.id].name))
          .map((row, index) => ({ ...row, rank: index + 1 }));
      }
      return (data[tab.id] || []).map((row, index) => ({ ...row, rank: index + 1 }));
    };

    const identity = (row, toon, prominent = false) => {
      const name = toon ? HEROES[row.id]?.name || row.id : String(row.username || 'Player');
      const node = el(toon ? 'div' : 'a', 'leaderboard-identity' + (prominent ? ' prominent' : ''));
      if (!toon) {
        node.href = `https://websim.com/@${encodeURIComponent(name)}`;
        node.target = '_blank';
        node.rel = 'noopener noreferrer';
      }
      const avatar = el('img', 'leaderboard-avatar');
      avatar.alt = '';
      avatar.src = toon
        ? Art.icon(row.id)
        : `https://images.websim.com/avatar/${encodeURIComponent(name)}`;
      const label = el('span');
      label.textContent = toon ? name : '@' + name;
      node.append(avatar, label);
      if (row.you) node.appendChild(el('em', 'leaderboard-you', 'YOU'));
      return node;
    };

    const render = () => {
      if (!body.isConnected) return;
      const selected = tabs.find(tab => tab.id === this._leaderboardTab) || tabs[0];
      const toon = selected.id === 'toons';
      tabBar.querySelectorAll('button').forEach(button => {
        const active = button.dataset.tab === selected.id;
        button.classList.toggle('active', active);
        button.setAttribute('aria-selected', String(active));
        button.tabIndex = active ? 0 : -1;
      });

      summaryIcon.textContent = selected.icon;
      summaryTitle.textContent = selected.label;
      summaryDetail.textContent = selected.detail;
      search.hidden = !toon;
      audience.textContent = data
        ? `${fmt(data.playerCount || 0)} ${Number(data.playerCount) === 1 ? 'player' : 'players'}`
        : 'Loading players…';
      clear(podium);
      clear(list);
      listHead.hidden = !data;
      retry.hidden = true;
      if (!data) return;

      const allRows = rankedRows(selected);
      const query = toon ? searchInput.value.trim().toLocaleLowerCase() : '';
      const visibleRows = query
        ? allRows.filter(row => HEROES[row.id]?.name.toLocaleLowerCase().includes(query))
        : allRows;
      const maxScore = Math.max(0, ...allRows.map(row => row.score));
      status.textContent = visibleRows.length ? '' : query ? 'No Toons match that search.' : 'No scores yet.';
      listLabel.textContent = toon ? (query ? 'MATCHING TOONS' : 'EVERY PLAYABLE TOON') : 'PLAYER RANKINGS';
      listCount.textContent = toon
        ? `${fmt(visibleRows.length)} of ${fmt(allRows.length)}`
        : `${fmt(visibleRows.length)} players`;

      const podiumRows = visibleRows.slice(0, 3);
      [podiumRows[1], podiumRows[0], podiumRows[2]].filter(Boolean).forEach(row => {
        const place = row.rank;
        const card = el('article', `leaderboard-podium-card place-${place}`);
        const medal = el('span', 'leaderboard-medal', place === 1 ? '♛' : place === 2 ? 'Ⅱ' : 'Ⅲ');
        const profile = identity(row, toon, true);
        const total = el('b', 'leaderboard-podium-score', fmt(row.score));
        const unit = el('small', 'leaderboard-podium-unit', selected.unit);
        card.append(medal, profile, total, unit);
        podium.appendChild(card);
      });
      podium.hidden = !podiumRows.length;

      visibleRows.slice(3).forEach(row => {
        const item = el('li', 'leaderboard-row' + (row.you ? ' you' : ''));
        const rank = el('b', 'leaderboard-rank', String(row.rank).padStart(2, '0'));
        const profile = identity(row, toon);
        const meter = el('span', 'leaderboard-meter');
        const fill = el('i');
        fill.style.width = maxScore ? `${row.score ? Math.max(2, row.score / maxScore * 100) : 0}%` : '0%';
        meter.appendChild(fill);
        const score = el('span', 'leaderboard-score');
        score.append(el('b', '', fmt(row.score)), el('small', '', selected.unit));
        item.append(rank, profile, meter, score);
        list.appendChild(item);
      });
    };

    tabs.forEach(tab => {
      const button = el('button', '', `<i>${tab.icon}</i><span>${tab.label}</span>`);
      button.type = 'button';
      button.dataset.tab = tab.id;
      button.setAttribute('role', 'tab');
      button.onclick = () => { this._leaderboardTab = tab.id; Sound.play('ui_move'); render(); };
      tabBar.appendChild(button);
    });
    searchInput.addEventListener('input', render);
    retry.onclick = () => load();
    render();

    const load = async () => {
      status.textContent = 'Connecting to the rankings…';
      retry.hidden = true;
      try {
        if (typeof WebsimAccount !== 'undefined') {
          await WebsimAccount.start();
          if (WebsimAccount.cloudEligible() && WebsimAccount.pendingSync) {
            await WebsimAccount.upload({ silent: true });
          }
        }
        const response = await fetch('/api/leaderboard', { cache: 'no-store' });
        if (!response.ok) throw new Error(`Leaderboard returned ${response.status}`);
        data = await response.json();
        render();
      } catch (error) {
        console.warn('Leaderboard unavailable', error);
        if (!body.isConnected) return;
        status.textContent = 'Could not load rankings.';
        retry.hidden = false;
      }
    };
    await load();
  }
});
