/* Hero Collections screen. Extends the existing Heroes route. */
'use strict';

function collectionRewardText(reward) {
  return Object.entries(reward).filter(([, amount]) => amount > 0).map(([key, amount]) =>
    `<span class="hc-reward"><i>${RES[key]?.icon || ''}</i><b>${fmt(amount)}</b><small>${RES[key]?.name || key}</small></span>`
  ).join('');
}
function collectionStatName(c) {
  return c.stat === 'mag' ? 'Magic Attack' : c.stat === 'atk' ? 'Attack' : 'Max HP';
}
function collectionBonusText(c, tier) {
  if (tier === 2) return '+0.25% Max HP for every owned Hero; members gain another +0.5%';
  if (tier === 4) return `+0.25% ${collectionStatName(c)} for every owned Hero; members gain another +0.5%`;
  return '';
}
function collectionPortrait(id) {
  return `<img src="${Art.icon(id)}" alt="${HEROES[id].name}" loading="lazy">`;
}
function collectionReadyCount(progress) {
  return Math.min(progress.ready, progress.needed);
}
function collectionEarnedBonusText(c, claimed) {
  if (claimed < 2) return '<strong>Shared bonuses unlock at Tier 2</strong>';
  if (claimed < 4) return '<strong>All owned Heroes: +0.25% Max HP</strong><strong>Members also gain: +0.5% Max HP</strong>';
  if (c.stat === 'hp') return '<strong>All owned Heroes: +0.5% Max HP</strong><strong>Members also gain: +1% Max HP</strong>';
  return `<strong>All owned Heroes: +0.25% Max HP · +0.25% ${collectionStatName(c)}</strong><strong>Members also gain: +0.5% Max HP · +0.5% ${collectionStatName(c)}</strong>`;
}
function collectionMeter(label, progress) {
  const percent = progress.total ? Math.round(progress.filled / progress.total * 100) : 0;
  return `<span class="hc-meter" role="progressbar" aria-label="${label}" aria-valuemin="0" aria-valuemax="${progress.total}" aria-valuenow="${progress.filled}"><i style="width:${percent}%"></i></span>`;
}

Object.assign(Screens, {
  collections(s) {
    const active = HeroCollections.catalogue.find(c => c.id === this._collectionId);
    if (active) return this.collectionDetail(s, active);
    const catalogue = HeroCollections.catalogue;
    const earned = catalogue.reduce((sum, c) => sum + HeroCollections.earned(c), 0);
    const page = el('div', 'hc-page');
    page.innerHTML = `<header class="hc-header"><button class="hc-back" type="button" aria-label="Back to Heroes">‹</button>
      <div><small>HEROES / COLLECTIONS</small><h1>Collections</h1></div>
      <span class="hc-total"><b>${earned}</b><small> / ${catalogue.length * 4} tiers</small></span></header>
      <p class="hc-intro">Win with different Heroes. Claimed bonuses help your whole roster; members gain more.</p>
      <div class="hc-grid"></div>`;
    $('.hc-back', page).onclick = () => this.go('roster');
    const grid = $('.hc-grid', page);
    catalogue.forEach((c, index) => {
      const members = HeroCollections.members(c);
      const claimed = HeroCollections.earned(c);
      const next = HeroCollections.tiers[claimed];
      const progress = next ? HeroCollections.progress(c, next) : null;
      const ready = HeroCollections.claimable(c);
      const card = el('button', 'hc-card' + (ready ? ' is-ready' : ''));
      card.type = 'button';
      card.style.setProperty('--hc-accent', c.color);
      card.style.setProperty('--hc-order', index);
      card.innerHTML = `<span class="hc-card-top"><small>FILE ${String(index + 1).padStart(2, '0')} / ${String(catalogue.length).padStart(2, '0')}</small><strong>${c.icon}</strong></span>
        <span class="hc-card-cast" aria-hidden="true">${members.slice(0, 4).map(collectionPortrait).join('')}</span>
        <span class="hc-card-copy"><b>${c.name}</b><small>${c.theme}</small></span>
        <span class="hc-card-progress"><span>Tier ${claimed} / 4</span><strong>${ready ? 'REWARD READY' : next ? `${collectionReadyCount(progress)} of ${progress.needed} Heroes ready` : 'COMPLETE'}</strong></span>
        ${next ? collectionMeter(`${c.name}: ${progress.filled} of ${progress.total} victories toward Tier ${claimed + 1}`, progress) : '<span class="hc-meter is-complete"><i></i></span>'}
        <span class="hc-card-open">OPEN FILE <b>↗</b></span>`;
      card.onclick = () => { this._collectionId = c.id; this.render(); $('#screen').scrollTop = 0; };
      grid.appendChild(card);
    });
    s.appendChild(page);
  },

  collectionDetail(s, c) {
    const members = HeroCollections.members(c);
    const claimed = HeroCollections.earned(c);
    const next = HeroCollections.tiers[claimed];
    const progress = next ? HeroCollections.progress(c, next) : null;
    const ready = HeroCollections.claimable(c);
    const page = el('div', 'hc-page hc-detail');
    page.style.setProperty('--hc-accent', c.color);
    if (this._collectionJustClaimed === c.id) { page.classList.add('hc-just-claimed'); this._collectionJustClaimed = null; }
    page.innerHTML = `<header class="hc-header hc-detail-nav"><button class="hc-back" type="button" aria-label="Back to Collections">‹</button><div><small>HEROES / COLLECTIONS</small><span>Collection file</span></div></header>
      <section class="hc-feature"><span class="hc-feature-symbol" aria-hidden="true">${c.icon}</span>
        <div class="hc-feature-art" aria-hidden="true">${members.slice(0, 5).map(collectionPortrait).join('')}</div>
        <div class="hc-feature-copy"><small>${c.theme}</small><h1>${c.name}</h1><span>${members.length} Heroes</span></div>
        <div class="hc-feature-tier"><b>${claimed}</b><small>/ 4 TIERS</small></div></section>
      <section class="hc-next"><div class="hc-section-head"><small>${next ? 'NEXT REWARD' : 'COLLECTION COMPLETE'}</small><strong>${next ? `TIER ${claimed + 1}` : '04 / 04'}</strong></div>
        ${next ? `<h2>${progress.needed} Heroes · ${next.wins} wins each</h2>
          ${collectionMeter(`${progress.filled} of ${progress.total} victories toward Tier ${claimed + 1}`, progress)}
          <p class="hc-progress-copy"><b>${collectionReadyCount(progress)} / ${progress.needed}</b> Heroes at ${next.wins} wins</p>
          <div class="hc-rewards">${collectionRewardText(HeroCollections.reward(next))}</div>
          ${collectionBonusText(c, claimed + 1) ? `<p class="hc-unlock">✦ ${collectionBonusText(c, claimed + 1)}</p>` : ''}
          ${claimed + 1 === 4 ? '<p class="hc-unlock">✦ Collection profile icon</p>' : ''}
          ${ready ? '<button class="hc-claim" type="button">CLAIM REWARD <span>↗</span></button>' : ''}`
          : '<p>Every tier earned. Shared and member bonuses stay active in PvE.</p>'}</section>
      <section class="hc-bonus-strip"><div><small>PERMANENT BONUSES FROM THIS COLLECTION</small>${collectionEarnedBonusText(c, claimed)}</div><span aria-hidden="true">✦</span></section>
      <section class="hc-section"><div class="hc-section-head"><h2>Milestones</h2><small>${claimed} / 4 EARNED</small></div><div class="hc-tiers"></div></section>
      <section class="hc-section"><div class="hc-section-head"><h2>Heroes to play</h2><small>${members.length} MEMBERS</small></div><div class="hc-members"></div></section>
      <section class="hc-rules"><p class="hc-victory-note">Owned Heroes you deploy earn credit for live wins, even if they fall.</p><details><summary>What counts as a victory? <span>⌄</span></summary><p>Each fought encounter or wave counts once. Retreats, previews, simulations, borrowed Heroes, summons and enemy copies do not count. Earlier battles cannot be counted without saved participation records.</p><p>Claimed bonuses help every owned Hero in PvE combat and Hero stats. Collection members gain an extra bonus. All collection bonuses together cap at +3% each for HP, Attack and Magic Attack. Arena PvP keeps its existing rules and saved defenses.</p></details><div class="hc-mode-links"><button type="button" data-mode="depths">Play Run ↗</button><button type="button" data-mode="raid">Play Events ↗</button></div></section>`;
    $('.hc-back', page).onclick = () => { this._collectionId = null; this.render(); $('#screen').scrollTop = 0; };
    const claim = $('.hc-claim', page);
    if (claim && ready) claim.onclick = () => { if (HeroCollections.claim(c.id)) { this._collectionJustClaimed = c.id; this.render(); $('#screen').scrollTop = 0; } };

    const tierList = $('.hc-tiers', page);
    HeroCollections.tiers.forEach((tier, index) => {
      const p = HeroCollections.progress(c, tier);
      const wasEarned = index < claimed;
      const reward = wasEarned ? HeroCollections.state().receipts[c.id]?.[index] || HeroCollections.reward(tier) : HeroCollections.reward(tier);
      const row = el('div', 'hc-tier' + (wasEarned ? ' is-earned' : index === claimed ? ' is-current' : ''));
      row.innerHTML = `<span class="hc-tier-mark">${wasEarned ? '✓' : index + 1}</span><div><b>Tier ${index + 1}<small>${p.needed} Heroes × ${tier.wins} wins</small></b>
        <span>${wasEarned ? 'EARNED' : `${collectionReadyCount(p)} / ${p.needed} READY`}</span>
        <div class="hc-tier-rewards">${collectionRewardText(reward)}</div>
        ${collectionBonusText(c, index + 1) ? `<em>${collectionBonusText(c, index + 1)}</em>` : ''}${index === 3 ? '<em>Collection profile icon</em>' : ''}</div>`;
      tierList.appendChild(row);
    });

    const wins = HeroCollections.state().wins;
    const target = next ? next.wins : HeroCollections.tiers[3].wins;
    const memberList = $('.hc-members', page);
    members.slice().sort((a, b) => {
      const group = id => !Save.owns(id) ? 2 : (wins[id] || 0) >= target ? 1 : 0;
      return group(a) - group(b) || (group(a) === 0 ? (wins[b] || 0) - (wins[a] || 0) : 0) || HEROES[a].name.localeCompare(HEROES[b].name);
    }).forEach(id => {
      const owned = Save.owns(id);
      const count = owned ? Math.max(0, Math.floor(Number(wins[id]) || 0)) : 0;
      const complete = owned && count >= target;
      const row = el('button', 'hc-member' + (owned ? '' : ' is-locked') + (complete ? ' is-done' : ''));
      row.type = 'button';
      row.setAttribute('aria-label', `${HEROES[id].name}, ${owned ? `${count} victories, ${complete ? 'ready' : `${target - count} to next tier`}. Open Hero details.` : 'not recruited. Open recruitment info.'}`);
      row.innerHTML = `${collectionPortrait(id)}<span class="hc-member-info"><b>${HEROES[id].name}</b><small>${owned ? (complete ? 'READY' : `${count} / ${target} wins`) : 'NOT RECRUITED'}</small><i style="width:${owned ? Math.min(100, count / target * 100) : 0}%"></i></span><strong>${complete ? '✓' : '↗'}</strong>`;
      row.onclick = () => owned ? HeroPage.open(id) : UI.unlockInfo(id);
      memberList.appendChild(row);
    });
    $$('.hc-mode-links button', page).forEach(button => button.onclick = () => this.go(button.dataset.mode));
    s.appendChild(page);
  }
});
