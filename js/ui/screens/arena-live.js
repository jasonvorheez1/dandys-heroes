/* arena-live.js - persistent AI defenses backed by the project database. */
'use strict';

function arenaLiveEsc(value) {
  return String(value == null ? '' : value).replace(/[&<>"']/g, char => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[char]));
}

function arenaLiveSnapshotTeam(ids) {
  return ids.filter(Boolean).slice(0, 5).map(id => {
    const h = Save.hero(id);
    const spec = Object.assign({}, playerSpec(id), { artSrc: Art.hero(id), twisted: false });
    const inventory = Save.data.trinketInv || {};
    spec.trinkets = (h.trinkets || []).map(uid => {
      const item = inventory[uid];
      return item && item.id ? { id: item.id, rank: Math.max(1, Number(item.rank) || 1) } : null;
    }).filter(Boolean);
    const badgeId = Save.equippedBadges(id)[0];
    spec.badge = badgeId ? { id: badgeId, lvl: Math.max(1, Number(Save.badgeLvl(badgeId)) || 1) } : null;
    spec.badges = spec.badge ? [spec.badge] : [];
    return spec;
  });
}

const ArenaLive = {
  mounted: null,
  renderQueued: false,
  persistentDefenses: null,
  defenseRequest: null,
  defenseSnapshot: null,

  loadDefenses() {
    if (this.defenseRequest) return this.defenseRequest;
    this.defenseRequest = fetch('/api/arena/defenses')
      .then(response => response.ok ? response.json() : Promise.reject(new Error(`defenses ${response.status}`)))
      .then(body => {
        this.persistentDefenses = Array.isArray(body.defenses) ? body.defenses : [];
        if (typeof Arena !== 'undefined') Arena.setLiveDefenses(this.persistentDefenses);
        this.refresh();
      })
      .catch(error => {
        console.warn('[ArenaDefense] saved defenses unavailable', error);
        this.persistentDefenses = [];
        if (typeof Arena !== 'undefined') Arena.setLiveDefenses([]);
        this.refresh();
      })
      .finally(() => { this.defenseRequest = null; });
    return this.defenseRequest;
  },

  publishDefense(ids) {
    const team = arenaLiveSnapshotTeam(ids);
    if (!team.length) { UI.toast('Choose at least one Hero for your defense.'); Sound.play('ui_err'); return; }
    return fetch('/api/arena/defense', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ team, arenaRank: Arena.today().rank })
    }).then(async response => {
      const body = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(body.error || `defense ${response.status}`);
      this.defenseSnapshot = body.defense || { team };
      this.persistentDefenses = (this.persistentDefenses || []).filter(item => item.user_id !== this.defenseSnapshot.user_id);
      this.persistentDefenses.unshift(this.defenseSnapshot);
      if (typeof Arena !== 'undefined') Arena.setLiveDefenses(this.persistentDefenses);
      this.refresh();
      Sound.play('ui_ok');
      UI.toast('Defense snapshot published.');
    }).catch(error => {
      console.warn('[ArenaDefense] publish failed', error);
      UI.toast(error.message || 'Could not publish your defense.');
      Sound.play('ui_err');
    });
  },

  openDefenseEditor() {
    if (typeof Screens === 'undefined' || !Screens.openTeamEditor) return;
    Screens.openTeamEditor(null, team => this.publishDefense(team), 'Set Defense Team', {
      persist: false,
      confirmLabel: 'Publish Defense'
    });
  },

  snapshotSpecs(defense) {
    return (defense && defense.team || []).map(slot => {
      if (!slot || !HEROES[slot.id]) return null;
      const badge = slot.badge && BADGES[slot.badge.id] && BADGES[slot.badge.id].owner === slot.id
        ? { id: slot.badge.id, lvl: clamp(Number(slot.badge.lvl) || 1, 1, BADGE_MAX_LVL) } : null;
      return Object.assign({}, slot, {
        id: slot.id,
        level: Math.max(1, Number(slot.level) || 1),
        artSrc: Art.hero(slot.id),
        twisted: false,
        pvpDefense: true,
        mult: { hp: 1, atk: 1, def: 1 },
        trinkets: Array.isArray(slot.trinkets) ? slot.trinkets.slice(0, 3)
          .filter(item => item && TRINKETS[item.id] && (!TRINKETS[item.id].owner || TRINKETS[item.id].owner === slot.id))
          .map(item => ({ id: item.id, rank: clamp(Number(item.rank) || 1, 1, TRINKET_MAX_RANK) })) : [],
        badge,
        badges: badge ? [badge] : []
      });
    }).filter(Boolean).slice(0, 5);
  },

  render() {
    const root = this.mounted;
    if (!root) return;
    const defenses = this.persistentDefenses === null
      ? '<div class="arena-live-empty">Loading saved defenses…</div>'
      : this.persistentDefenses.length ? this.persistentDefenses.slice(0, 8).map((defense, index) => {
        const team = (defense.team || []).filter(slot => slot && HEROES[slot.id]).slice(0, 5);
        const username = String(defense.username || 'Player');
        const profile = `https://websim.com/@${encodeURIComponent(username)}`;
        const teamIcons = team.map(slot => `<img src="${Art.icon(slot.id)}" alt="${arenaLiveEsc(HEROES[slot.id].name)}" title="${arenaLiveEsc(HEROES[slot.id].name)} · Lv ${Math.max(1, Number(slot.level) || 1)}">`).join('');
        const rank = Math.max(1, Number(defense.arena_rank) || 2000);
        return `<article class="arena-defense-card"><div class="arena-defense-head"><a class="arena-defense-user" href="${profile}" target="_blank" rel="noopener"><img src="https://images.websim.com/avatar/${encodeURIComponent(username)}" alt=""><span>@${arenaLiveEsc(username)}</span></a><small>#${rank.toLocaleString('en-US')} · ${team.length} HERO${team.length === 1 ? '' : 'ES'}</small></div><div class="arena-defense-team">${teamIcons || '<em>NO TEAM</em>'}</div><button class="arena-defense-attack" type="button" data-defense-index="${index}">ATTACK</button></article>`;
      }).join('') : '<div class="arena-live-empty">No saved defenses yet. Publish yours first.</div>';

    root.innerHTML = `<div class="arena-live-head"><div><small>AI PVP · DATABASE SNAPSHOTS</small><h2>SAVED DEFENSES</h2></div><button class="arena-live-defense" type="button">🛡 SET DEFENSE <small>PUBLISH SNAPSHOT</small></button></div>
      <section class="arena-saved-defenses"><div class="arena-saved-defenses-head"><div><small>OTHER PLAYERS' TEAMS</small><h3>ATTACK AN AI DEFENSE</h3></div><button class="arena-defenses-refresh" type="button" title="Refresh saved defenses">↻</button></div><div class="arena-defenses-list">${defenses}</div></section>`;
    $$('.arena-defense-attack', root).forEach(button => {
      button.onclick = () => {
        const defense = this.persistentDefenses && this.persistentDefenses[Number(button.dataset.defenseIndex)];
        if (defense && typeof Screens !== 'undefined' && Screens.arenaDefenseFight) Screens.arenaDefenseFight(defense);
      };
    });
    $('.arena-live-defense', root).onclick = () => this.openDefenseEditor();
    $('.arena-defenses-refresh', root).onclick = () => { this.persistentDefenses = null; this.loadDefenses(); this.refresh(); };
  },

  refresh() {
    if (!this.mounted || this.renderQueued) return;
    this.renderQueued = true;
    requestAnimationFrame(() => { this.renderQueued = false; this.render(); });
  },

  mount(root) {
    this.mounted = root;
    this.render();
    if (this.persistentDefenses === null) this.loadDefenses();
  },

  unmount() {
    this.mounted = null;
  }
};

Object.assign(Screens, {
  arenaDefenseFight(defense, chosenTeam) {
    const defenderSpecs = ArenaLive.snapshotSpecs(defense);
    if (!defenderSpecs.length) { UI.toast('That defense is no longer available.'); Sound.play('ui_err'); return; }
    const defenderName = defense && defense.username || 'Player';
    if (!chosenTeam) {
      this.openTeamEditor(null, team => this.arenaDefenseFight(defense, team),
        `Saved PvP · Attack ${defenderName}`, { persist: false, confirmLabel: 'Attack Defense' });
      return;
    }
    const team = playerTeamSpecs(chosenTeam);
    if (!team.length) { UI.toast('Set an attacker team first'); Sound.play('ui_err'); return; }
    const opponent = { name: defenderName, team: defenderSpecs.map(spec => spec.id) };
    const reward = { arenaCoin: 30, exp: 120 };
    this.arenaMatchIntro(opponent, chosenTeam, () => {
      BattleScreen.launch({
        team, foes: defenderSpecs, music: 'arena',
        meta: { title: `Saved PvP · ${defenderName}`, bg: 'uploads/arenabackground.png', floorLabel: 'SAVED DEFENSE · AI COMBAT', arenaPvP: true, skillStartEnergy: 18, enemySkillStartEnergy: 0 },
        rewards: () => reward,
        onDone: res => {
          if (!res.quit && res.win) payoutBattle(chosenTeam, reward, { mastery: 60, pass: 0 });
          this._arenaReturn = res.win ? `DEFENSE BROKEN · ${defenderName} HOLDS NO MORE!` : 'THE DEFENSE HOLDS · BUILD A STRONGER ATTACK TEAM.';
          this.render();
        }
      });
    });
  }
});
