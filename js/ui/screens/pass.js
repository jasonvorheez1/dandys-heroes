/* screens/pass.js - a dedicated, animated weekly Battle Pass reward road. */
'use strict';

function passRewardMarkup(reward) {
  const bonuses = Object.keys(reward).filter(key => RES[key] && Number(reward[key]) > 0);
  const bonusLabel = bonuses.length > 1 ? ` · +${bonuses.length - 1} bonus` : '';
  if (reward.hero) {
    const h = HEROES[reward.hero];
    return `<div class="pass-reward-art hero"><span class="pass-shard">◈</span><img src="${Art.icon(reward.hero)}" alt=""></div>
      <strong>${h ? h.name : reward.hero}</strong><small>${reward.shards} shards${bonuses.length ? ` · ${bonuses.length} supply bonus${bonuses.length === 1 ? '' : 'es'}` : ''}</small>`;
  }
  const k = Object.keys(reward).find(key => RES[key]);
  if (!k) return '<div class="pass-reward-art">?</div><strong>Mystery</strong><small>Reward</small>';
  return `<div class="pass-reward-art resource">${RES[k].icon}</div><strong>${RES[k].name}</strong><small>+${fmt(reward[k])}${bonusLabel}</small>`;
}

Object.assign(Screens, {
  openPass(returnTo) {
    if (this.cur === 'pass' || this._passLoading) return;
    if (!this.modeUnlocked('pass')) { this.showModeGate('pass'); return; }
    this._passReturn = returnTo === 'events' ? 'events' : 'home';
    this._passLoading = true;
    const f = featured(currentWeek()), hero = f.pass;
    LoadingScreen.run({
      kicker: 'WEEKLY REWARD ROAD',
      title: 'Opening Battle Pass',
      message: 'Laying out rewards',
      assets: hero ? [Art.hero(hero), Art.icon(hero)] : [],
      portraits: hero ? [Art.hero(hero)] : []
    }, () => {
      this._passLoading = false;
      this._passNeedsIntro = true;
      this.go('pass', { skipPassExit: true });
    });
  },

  leavePass(destination) {
    if (this._passLeaving) return;
    const dest = destination || this._passReturn || 'home';
    if (this.cur !== 'pass') { this.go(dest, { skipPassExit: true }); return; }
    this._passLeaving = true;
    clearInterval(this._liveClock); this._liveClock = null;
    const page = $('.battle-pass-page');
    if (page) page.classList.add('leaving');
    Sound.play('ui_back');
    const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
    clearTimeout(this._passExitTimer);
    this._passExitTimer = setTimeout(() => {
      this._passLeaving = false;
      this.go(dest, { skipPassExit: true, silent: true });
    }, reduced ? 40 : 410);
  },

  pass(s) {
    const info = Pass.level(), track = Pass.track(), state = Pass.state();
    const claimed = new Set(state.claimed), ready = Pass.claimable();
    const f = featured(currentWeek()), hero = f.pass;
    const entering = !!this._passNeedsIntro;
    this._passNeedsIntro = false;
    this._passBusy = false;

    const page = el('div', 'battle-pass-page' + (entering ? ' entering' : ' updating'));
    page.style.setProperty('--pass-count', track.length);

    if (entering) {
      const intro = el('div', 'pass-intro');
      intro.setAttribute('aria-hidden', 'true');
      intro.innerHTML = `<div class="pass-intro-stripe"></div><div class="pass-intro-copy">
        <small>WEEKLY REWARD ROAD</small><b>BATTLE<br>PASS</b><span>WEEKLY TRACK</span></div>`;
      page.appendChild(intro);
    }

    const heroPanel = el('section', 'pass-hero');
    heroPanel.innerHTML = `
      <div class="pass-hatch"></div>
      <button class="pass-back" type="button" aria-label="Leave Battle Pass">‹ <span>Back</span></button>
      <div class="pass-season"><b>BATTLE PASS</b><span>Resets in <strong id="passReset">--</strong></span></div>
      ${hero ? `<img class="pass-featured" src="${Art.hero(hero)}" alt="${HEROES[hero].name}">` : ''}
      <div class="pass-hero-copy">
        <span>WEEKLY FEATURE</span>
        <h1>${hero ? HEROES[hero].name : 'Resource Rush'}</h1>
        <p>${hero ? 'Collect Hero shards at every fifth checkpoint.' : 'Climb the road for upgrade materials.'}</p>
      </div>`;
    $('.pass-back', heroPanel).onclick = () => this.leavePass();
    page.appendChild(heroPanel);

    const dashboard = el('section', 'pass-dashboard');
    const nextLabel = info.complete ? 'All levels reached' : `${info.into} / ${info.need} XP`;
    dashboard.innerHTML = `
      <div class="pass-level-medal"><small>LEVEL</small><b>${info.lv}</b><span>/ ${info.max}</span></div>
      <div class="pass-progress-copy"><div><b>${info.complete ? 'All rewards claimed!' : 'Next reward'}</b><span>${nextLabel}</span></div>
        <div class="pass-progress" role="progressbar" aria-label="Progress to next Battle Pass level" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${Math.round(info.progress * 100)}"><i style="width:${Math.round(info.progress * 100)}%"></i><em></em></div>
        <small>${info.total.toLocaleString()} weekly XP earned · Mastery ${Pass.rewardMastery()} rewards ×${Pass.rewardMultiplier().toFixed(2)}</small></div>
      <div class="pass-ready-count ${ready.length ? 'hot' : ''}"><b>${ready.length}</b><span>${ready.length === 1 ? 'REWARD' : 'REWARDS'}<br>READY</span></div>`;
    page.appendChild(dashboard);

    const tools = el('div', 'pass-tools');
    const title = el('div', 'pass-track-title');
    title.innerHTML = '<small>REWARD ROAD</small><b>30 weekly checkpoints</b>';
    const jump = el('button', 'pass-tool-button', ready.length ? 'Jump to ready' : info.complete ? 'View finale' : 'Jump to next');
    jump.type = 'button';
    const claimAll = el('button', 'pass-claim-all' + (ready.length ? ' ready' : ''),
      ready.length ? `Claim ${ready.length} reward${ready.length === 1 ? '' : 's'}` : info.complete ? 'Everything claimed' : 'No rewards ready');
    claimAll.type = 'button'; claimAll.disabled = !ready.length;
    tools.append(title, jump, claimAll);
    page.appendChild(tools);

    const roadShell = el('div', 'pass-road-shell');
    const road = el('div', 'pass-road');
    road.setAttribute('role', 'list');
    track.forEach((entry, i) => {
      const isClaimed = claimed.has(i), unlocked = info.lv >= entry.lv;
      const isReady = unlocked && !isClaimed;
      const isNext = !info.complete && i === info.lv;
      const card = el('button', 'pass-tier ' + (isClaimed ? 'claimed' : isReady ? 'ready' : isNext ? 'next' : 'locked'));
      card.type = 'button'; card.dataset.tier = i; card.style.setProperty('--tier-i', i);
      card.setAttribute('role', 'listitem');
      card.setAttribute('aria-label', `Level ${entry.lv}: ${isClaimed ? 'claimed' : isReady ? 'ready to claim' : isNext ? 'next reward' : 'locked'}`);
      card.disabled = !isReady;
      card.innerHTML = `<span class="pass-tier-level">${entry.lv}</span><span class="pass-node"><i></i></span>
        <span class="pass-card-face">${passRewardMarkup(entry.reward)}
        <em>${isClaimed ? '✓ CLAIMED' : isReady ? 'TAP TO CLAIM' : isNext ? 'NEXT' : 'LOCKED'}</em></span>`;
      if (entry.lv % 5 === 0) card.classList.add('milestone');
      if (isReady) card.onclick = () => {
        if (this._passBusy || !Pass.claim(i)) return;
        this._passBusy = true; card.classList.add('claiming');
        const rect = card.getBoundingClientRect();
        FX.confetti(rect.left + rect.width / 2, rect.top + rect.height / 2, entry.reward.hero ? 22 : 10);
        this._passRestoreX = road.scrollLeft;
        setTimeout(() => { if (this.cur === 'pass') this.render(); }, 360);
      };
      road.appendChild(card);
    });
    roadShell.appendChild(road); page.appendChild(roadShell);

    const sources = el('section', 'pass-sources');
    sources.innerHTML = `<div><small>HOW TO EARN XP</small><b>Play the way you like</b></div>
      <span>📅 Daily delivery <b>+40</b></span><span>✓ Daily orders <b>+25</b></span>
      <span>⚔ Battles & modes <b>+XP</b></span>`;
    page.appendChild(sources);
    s.appendChild(page);

    const focusIndex = ready.length ? ready[0].i : info.complete ? track.length - 1 : Math.min(info.lv, track.length - 1);
    const centerTier = (smooth) => {
      const card = $(`.pass-tier[data-tier="${focusIndex}"]`, road);
      if (!card) return;
      const left = card.offsetLeft - (road.clientWidth - card.offsetWidth) / 2;
      road.scrollTo({ left: Math.max(0, left), behavior: smooth ? 'smooth' : 'auto' });
    };
    jump.onclick = () => centerTier(true);
    claimAll.onclick = () => {
      if (this._passBusy || !ready.length) return;
      this._passBusy = true;
      const taken = Pass.claimAll();
      if (!taken.length) { this._passBusy = false; return; }
      taken.forEach(i => { const card = $(`.pass-tier[data-tier="${i}"]`, road); if (card) card.classList.add('claiming'); });
      FX.confetti(window.innerWidth / 2, Math.min(window.innerHeight * .55, 420), Math.min(60, 16 + taken.length * 3));
      this._passRestoreX = road.scrollLeft;
      setTimeout(() => { if (this.cur === 'pass') this.render(); }, 440);
    };

    requestAnimationFrame(() => {
      if (Number.isFinite(this._passRestoreX)) {
        road.scrollLeft = this._passRestoreX; this._passRestoreX = null;
      } else if (!entering) centerTier(false);
    });
    if (entering) setTimeout(() => { if (this.cur === 'pass' && road.isConnected) centerTier(true); }, 1050);
    this.liveClocks([{ selector: '#passReset', kind: 'week' }]);
  }
});
