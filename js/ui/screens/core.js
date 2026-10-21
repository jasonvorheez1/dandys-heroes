/* screens/core.js - the Screens object itself (nav plumbing) plus the Hub
   (home) screen and the Settings modal. Every other screens/*.js file
   extends this same Screens object with Object.assign - this file has to
   load first since it's what creates Screens in the first place. */
'use strict';

/* Advanced modes arrive one at a time, after the early loop has had room to
   teach itself. All checks route through Screens.go so a deep link cannot
   bypass the same friendly progression gate. */
const MODE_UNLOCKS = {
  crates: { mastery: 4, icon: '📦', name: 'Crates', desc: 'Crate pulls open after your first guided rewards have had time to build up.' },
  pass: { mastery: 5, icon: '📜', name: 'Battle Pass', desc: 'The weekly reward road unlocks after the starter climb begins.' },
  shop: { mastery: 8, icon: '🛍️', name: 'Shop', desc: 'Dandy opens the full supply counter once you have learned the basic loop.' },
  inventory: { mastery: 12, icon: '🎒', name: 'Inventory', desc: 'The gear locker unlocks after you have had time to discover your first equipment.' },
  skillBulk: { mastery: 14, icon: '📼', name: 'Max Every Skill', desc: 'Bulk skill training unlocks once your Heroes have some real growth behind them.' },
  upgradeEverything: { mastery: 20, icon: '⚡', name: 'Upgrade Everything', desc: 'The all-in-one upgrade command unlocks after the core upgrade systems are familiar.' },
  massUpgrade: { mastery: 25, icon: '🔧', name: 'Mass Upgrade', desc: 'Roster-wide upgrading unlocks once your collection has reached the midgame.' },
  arena: { mastery: 30, icon: '🏆', name: 'Arena', desc: 'The Colosseum opens once your first team has some real practice.' },
  raid: { mastery: 40, icon: '👑', name: 'Events', desc: 'Weekly boss events are for a growing roster.' },
  friendship: { mastery: 45, icon: '🤝', name: 'Friendship', desc: 'Friendship campaigns open after your team has settled in.' },
  trials: { mastery: 60, icon: '⚗', name: 'Trials', desc: 'Trials ask for specialized Heroes and stronger upgrades.' }
};

const Screens = {
  cur: 'home',

  modeGate(name) { return MODE_UNLOCKS[name] || null; },
  budsNeedsAttention() {
    const buds = Save.data && Save.data.buds;
    return !!buds && buds.state === 'available' && !buds.dandyConsequence;
  },
  budsDemandCopy(refusals) {
    const copies = [
      ['A SMALL REQUEST', 'Would you kindly click Dandy\'s Buds? I have arranged a perfectly reasonable little lesson.', 'OPEN DANDY\'S BUDS'],
      ['I\'M NOT GOING TO ASK AGAIN', 'That was the first time I asked. This is the second. Please click the Buds card.', 'CLICK THE BUDS CARD'],
      ['ONE MORE TIME, KINDLY', 'One more time, kindly. I would much rather keep this pleasant, but you are making a simple request feel theatrical.', 'YES, DANDY'],
      ['DANDY IS STILL WAITING', 'The card remains exactly where I left it. Please click it and we can proceed.', 'OPEN DANDY\'S BUDS'],
      ['THIS IS GETTING TIRESOME', 'I do not enjoy repeating myself. Click the Buds card, and I shall become charming again.', 'I\'LL CLICK IT'],
      ['A MODEST REMINDER', 'The lesson is still waiting. So am I. With decreasing enthusiasm.', 'OPEN THE BUDS'],
      ['LAST COURTESY', 'This is the last courteous reminder you are receiving from me. Do be sensible.', 'FINE, DANDY'],
      ['…', '', 'OPEN THE BUDS']
    ];
    return copies[Math.max(0, Math.min(7, refusals))];
  },
  showBudsDemand(initial) {
    if (!this.budsNeedsAttention() || this.cur !== 'home' || !$('#modal').hidden) return;
    const buds = Save.data.buds;
    const firstRequest = initial && !buds.demandShown;
    buds.demandShown = true;
    if (!firstRequest && !initial) buds.refusals = clamp((Number(buds.refusals) || 0) + 1, 0, 8);
    Save.write();
    if (buds.refusals >= 8) { this.triggerBudsConsequence(); return; }
    const copy = this.budsDemandCopy(buds.refusals);
    const requestNumber = Math.min(8, buds.refusals + 1);
    const body = el('section', 'dandy-buds-demand-card');
    body.innerHTML = `<div class="dandy-demand-art"><span></span><img src="uploads/dandyhimself.png" alt="Dandy"></div>
      <small>DANDY'S BUDS · REQUEST ${requestNumber} / 8</small><h2>${copy[0]}</h2><p>${copy[1]}</p>
      <div class="dandy-demand-rule"><i></i><span>Click the Buds card to continue</span><i></i></div><div class="dandy-demand-actions"><button type="button" class="dandy-demand-open">${copy[2]} <b>›</b></button><button type="button" class="dandy-demand-later">NOT NOW</button></div>`;
    let resolved = false;
    const penalizeDismissal = () => {
      const current = Save.data && Save.data.buds;
      if (!current || current.state !== 'available' || current.dandyConsequence) return;
      current.demandShown = true;
      current.refusals = clamp((Number(current.refusals) || 0) + 1, 0, 8);
      Save.write();
      if (current.refusals >= 8) this.triggerBudsConsequence();
    };
    $('.dandy-demand-open', body).onclick = () => {
      resolved = true;
      UI.closeModal({ skipHook: true });
      this.openDandysBuds();
    };
    $('.dandy-demand-later', body).onclick = () => {
      resolved = true;
      UI.closeModal({ skipHook: true });
      penalizeDismissal();
    };
    UI.modal('', body, { bare: true, className: 'dandy-buds-demand', dismissOnBackdrop: true, onClose: () => {
      // Closing the reminder is a refusal: it remains a genuine exit, but
      // Dandy advances the same penalty counter as any other dismissal.
      if (!resolved) { resolved = true; penalizeDismissal(); }
    }});
  },
  triggerBudsConsequence() {
    const buds = Save.data.buds;
    if (!buds || buds.state !== 'available' || buds.dandyConsequence) return;
    buds.dandyConsequence = true;
    buds.demandShown = true;
    buds.refusals = 8;
    Save.write();
    // No dialogue here: the eighth refusal is Dandy's silent answer.
    setTimeout(() => {
      if (this.cur === 'home') {
        if (!$('#modal').hidden) UI.closeModal({ skipHook: true });
        this.startDandyConsequence();
      }
    }, 80);
  },
  startDandyConsequence() {
    if (typeof Depths === 'undefined' || !Depths.prepareDandyConsequence) return;
    Depths.prepareDandyConsequence();
    this.go('depths', { ignoreBudsDemand: true });
  },
  modeUnlocked(name) {
    const gate = this.modeGate(name);
    // Trials have a beginner-safe repeatable room before their weekly ladder.
    return name === 'trials' || !gate || Save.data.mastery >= gate.mastery;
  },
  showModeGate(name) {
    const gate = this.modeGate(name); if (!gate) return;
    Sound.play('ui_err');
    const body = el('div', 'mode-gate-modal');
    body.innerHTML = `<i>${gate.icon}</i><small>NOT QUITE YET</small><h2>${gate.name.toUpperCase()} UNLOCKS AT MASTERY ${gate.mastery}</h2><p>${gate.desc} You are currently Mastery ${Save.data.mastery}.</p>`;
    body.appendChild(UI.bar(Math.min(1, Save.data.mastery / gate.mastery), 'linear-gradient(90deg,#8ee86d,#ffe36d)'));
    const close = el('button', 'btn pri wide', 'KEEP GROWING'); close.onclick = () => UI.closeModal(); body.appendChild(close);
    UI.modal('', body, { bare: true, className: 'mode-gate-shell' });
  },
  refreshModeLocks() {
    $$('#navbar button').forEach(button => {
      const gate = this.modeGate(button.dataset.nav), locked = !!gate && !this.modeUnlocked(button.dataset.nav);
      button.classList.toggle('locked', locked);
      if (locked) button.title = `${gate.name} unlocks at Mastery ${gate.mastery}`;
      else if (button.dataset.nav === 'trials' && Save.data.mastery < gate.mastery) button.title = `Training Trials available · weekly divisions unlock at Mastery ${gate.mastery}`;
      else button.title = button.dataset.navTitle || button.getAttribute('aria-label') || button.dataset.nav;
    });
  },

  go(name, opt) {
    opt = opt || {};
    if (name !== 'phantasia-shop') {
      clearInterval(this._cheknovTalkTimer); this._cheknovTalkTimer = null;
      clearTimeout(this._cheknovStartTimer); this._cheknovStartTimer = null;
    }
    if (name !== 'shop') {
      clearInterval(this._shopTalkTimer); this._shopTalkTimer = null;
      clearTimeout(this._shopStartTimer); this._shopStartTimer = null;
      clearTimeout(this._shopEntranceTimer); this._shopEntranceTimer = null;
    }
    if (!opt.ignoreBudsDemand && this.cur === 'home' && name !== 'home' && this.budsNeedsAttention()) {
      this.showBudsDemand(false);
      return;
    }
    if (!opt.ignoreGate && !this.modeUnlocked(name)) { this.showModeGate(name); return; }
    if (this.cur === 'pass' && name !== 'pass' && !opt.skipPassExit) {
      this.leavePass(name); return;
    }
    if (this.cur === 'depths' && name !== 'depths' && !opt.skipDepthExit) {
      this.leaveDepths(name); return;
    }
    if (this.cur === 'roster' && name !== 'roster' && !opt.skipRosterExit) {
      this.leaveRoster(name); return;
    }
    if (this.cur === 'arena' && name !== 'arena' && !opt.skipArenaExit && this.leaveArena) {
      this.leaveArena(name); return;
    }
    if (this.cur === 'home' && name !== 'home' && !opt.skipHomeExit) {
      this.leaveHome(name, opt); return;
    }
    // Tapping Events while a dossier is open returns to the event board.
    // Leaving Events also clears that dossier, so a later visit starts there.
    if (name === 'raid' && this.cur === 'raid' && this._raidDossier) this._raidDossier = null;
    else if (this.cur === 'raid' && name !== 'raid' && name !== 'phantasia-shop') this._raidDossier = null;
    this.cur = name;
    if (name === 'home') this._homeEntrancePending = true;
    const navName = name === 'shop' ? 'home' : name === 'phantasia-shop' ? 'raid' : name === 'pass' ? (this._passReturn || 'home') : name;
    $$('#navbar button').forEach(button => {
      const active = button.dataset.nav === navName;
      button.classList.toggle('on', active);
      if (active) button.setAttribute('aria-current', 'page');
      else button.removeAttribute('aria-current');
    });
    if (!opt.silent) Sound.play('ui_move');
    this.render();
    $('#screen').scrollTop = 0;
  },

  render() {
    clearInterval(this._liveClock);
    this._liveClock = null;
    if (this._friendshipChunkTimer) {
      if (typeof cancelAnimationFrame === 'function') cancelAnimationFrame(this._friendshipChunkTimer);
      this._friendshipChunkTimer = null;
    }
    const s = clear($('#screen'));
    UI.refreshBar();
    this.refreshModeLocks();
    // A few dedicated screens use URL-style route names while their render
    // methods stay camelCase. Keep the route stable without falling through
    // to Home when Cheknov's store is opened.
    const renderName = this.cur === 'phantasia-shop' ? 'phantasiaShop' : this.cur;
    (this[renderName] || this.home).call(this, s);
    // A hidden screen may still rerender because of a service timer or an
    // account update. It can refresh its DOM, but an active battle retains
    // ownership of the soundtrack until BattleScreen.close().
    const battleOwnsMusic = typeof BattleScreen !== 'undefined' &&
      BattleScreen.active && !$('#battle').hidden;
    if (!battleOwnsMusic)
      Music.screen(this.cur, {
        cookieRun: !!s.querySelector('.cookie-event'),
        qomEvent: !!s.querySelector('.event-dossier.qom'),
        collabMenu: !!s.querySelector('.event-dossier.collab'),
        delilahEvent: !!s.querySelector('.event-dossier.delilah'),
        unknownWorldMenu: !!s.querySelector('.event-dossier.unknown-world, .event-banner.unknown-world')
      });
  },

  /** One shared second-accurate service clock for the visible screen. It also
      rerenders exactly when a real daily/weekly boundary is crossed. */
  liveClocks(items) {
    clearInterval(this._liveClock);
    const startedDay = dayIndex(), startedWeek = currentWeek();
    const tick = () => {
      if (dayIndex() !== startedDay || currentWeek() !== startedWeek) {
        this.render(); return;
      }
      let found = false;
      (items || []).forEach(item => {
        const n = $(item.selector); if (!n) return;
        found = true;
        n.textContent = item.kind === 'week' ? liveTime(untilWeekReset()) : liveTime(untilDayReset());
      });
      if (!found) { clearInterval(this._liveClock); this._liveClock = null; }
    };
    tick();
    this._liveClock = setInterval(tick, 1000);
  },

  section(parent, label) { parent.appendChild(el('h2', 'sec', label)); },

  /* The hub is a small staging scene. Let it clear the frame before the next
     screen replaces it, so the party feels like it actually headed out. */
  leaveHome(next, opt) {
    if (this._homeLeaving) return;
    if (this._homeKeyHandler) {
      window.removeEventListener('keydown', this._homeKeyHandler);
      this._homeKeyHandler = null;
    }
    const hub = $('.home-hub');
    if (!hub) { this.go(next, Object.assign({}, opt, { skipHomeExit: true })); return; }
    this._homeLeaving = true;
    hub.classList.add('home-hub-leaving');
    Sound.play('ui_back', { vol: .38, priority: true });
    Sound.play('step', { vol: .20, delay: 120, throttle: 0 });
    setTimeout(() => {
      this._homeLeaving = false;
      this.go(next, Object.assign({}, opt, { skipHomeExit: true }));
    }, 360);
  },

  /* ============================================================ HOME */
  home(s) {
    const d = Save.data;
    /* Command Hub: each action has one clear home. The legacy card stack
       below is intentionally retained as reference but bypassed. */
    const feat = featured(currentWeek()), leader = d.team[0] || feat.pass || STARTERS[0];
    const team = d.team.filter(Boolean), run = Depths.run(), layout = Depths.layout(), ar = Arena.today();
    const stageTeam = team.length ? team : [leader];
    const teamPower = team.length ? fmt(Progress.teamPower(team)) : '0';
    const nextRoom = layout.nodes[run.node] || 'battle';
    const nextRoomDef = typeof NODE !== 'undefined' && NODE[nextRoom] ? NODE[nextRoom] : null;
    const nextRoomName = nextRoomDef ? nextRoomDef.name || nextRoomDef.label || nextRoom : String(nextRoom).replace(/^./, x => x.toUpperCase());
    const nextRoomIcon = nextRoomDef ? nextRoomDef.icon || '⚔' : '⚔';
    const hub = el('main', 'home-hub home-hub-enter');
    const stage = el('button', 'home-stage');
    stage.setAttribute('aria-label', `Home Base: ${stageTeam.length} of 5 Toons ready, led by ${HEROES[leader].name}. Tap to edit formation.`);
    stage.innerHTML = `<span class="home-stage-sky"></span><span class="home-stage-cloud a" aria-hidden="true"></span><span class="home-stage-cloud b" aria-hidden="true"></span><span class="home-stage-floor"></span><span class="home-stage-rays"></span><i class="home-spark a"></i><i class="home-spark b"></i><i class="home-spark c"></i>
      <span class="home-stage-sign"><b>HOME BASE</b><small>TEAM HUDDLE</small></span>
      <span class="home-map-labels" aria-hidden="true">
        <span class="home-map-label home-map-run"><i>▶</i><b>RUN</b><small>ENDLESS</small></span>
        <span class="home-map-label home-map-events"><i>♛</i><b>EVENTS</b><small>WEEKLY</small></span>
        <span class="home-map-label home-map-trials"><i>⚗</i><b>TRIALS</b><small>DIVISIONS</small></span>
        <span class="home-map-label home-map-crates"><i>▣</i><b>CRATES</b><small>REWARDS</small></span>
        <span class="home-map-label home-map-heroes"><i>✦</i><b>ROSTER</b><small>TOONS</small></span>
      </span>
      <span class="home-stage-copy"><small>ACTIVE SQUAD</small><b>${stageTeam.length}/5 TOONS READY</b><span><i class="home-lead-star" aria-hidden="true">★</i> ${HEROES[leader].name} leads the way</span></span>
      <span class="home-stage-party">${stageTeam.map((id, i) => {
        const h = HEROES[id];
        const isLead = id === leader;
        const role = h.role || 'Attacker';
        const roleIcon = role === 'Tank' ? '🛡️' : role === 'Support' ? '💚' : '⚔️';
        const heroLvl = Save.hero(id).level;
        return `<span class="home-stage-toon${isLead ? ' lead' : ''}" data-hero="${id}" title="${h.name} · Lv ${heroLvl} · ${heroRole(role)}" style="--home-i:${i};--home-left:${stageTeam.length < 2 ? 35 : 4 + i * 70 / (stageTeam.length - 1)}%;--home-in:${.06 + i * .1}s;--home-idle:${-i * .32}s;--home-out:${i * .035}s;"><span class="home-toon-badges">${isLead ? '<i class="home-toon-crown" title="Leader">👑</i>' : ''}<span class="home-toon-role ${role.toLowerCase()}">${roleIcon}</span></span><img src="${Art.hero(id)}" alt="${h.name}"><span class="home-toon-pill"><b>${h.name}</b><small>Lv ${heroLvl}</small></span></span>`;
      }).join('')}</span>
      <span class="home-stage-dashboard"><span><small>TEAM POWER</small><b>⚡ ${teamPower}</b></span><span><small>LEAD</small><b>Lv ${Save.hero(leader).level}</b></span></span>
      <span class="home-stage-next"><small>NEXT UP</small><b><i class="home-next-icon">${nextRoomIcon}</i> ${nextRoomName}</b><em>Floor ${run.floor} · Room ${run.node + 1}/${layout.nodes.length}</em></span>
      <em class="home-stage-edit"><span>EDIT SQUAD</span> <b>›</b></em>`;

    stage.querySelectorAll('.home-stage-toon').forEach(toonEl => {
      toonEl.addEventListener('pointerdown', () => {
        toonEl.classList.add('cheer');
        Sound.play('pop', { vol: .35, priority: false });
        setTimeout(() => toonEl.classList.remove('cheer'), 420);
      });
    });
    stage.onclick = () => { Sound.play('choose', { vol: .42, priority: true }); Screens.openTeamEditor(); };
    hub.appendChild(stage);

    const buds = d.buds || { state: 'available' };
    if (buds.state !== 'completed') {
      const bud = el('button', 'home-buds' + (buds.state === 'active' ? ' active' : ''));
      const claim = ['chooseHero', 'chooseTrinket', 'chooseSupplies'].includes(buds.state);
      const stageNum = Math.max(1, Math.min(3, Number(buds.stage) || 1));
      const stageNames = { 1: 'LEARN THE ROOMS', 2: 'RECRUIT A BUDDY', 3: 'CHOOSE YOUR GIFT' };
      const rewardName = buds.state === 'chooseHero' ? 'Your buddy crate is ready!' : buds.state === 'chooseTrinket' ? 'Your first Trinket is ready!' : 'Your graduation gift is ready!';
      const headline = claim ? rewardName : ['active', 'paused'].includes(buds.state) ? `Floor ${stageNum} · ${stageNames[stageNum]}` : 'A friendly first adventure';
      const subline = claim ? 'Pick the reward that fits your team.' : buds.state === 'paused' ? 'Lesson saved. Resume whenever you like.' : buds.state === 'active' ? 'Dandy is waiting at the next room.' : 'Three guided floors, useful rewards, no guesswork.';
      const action = claim ? 'OPEN GIFT' : ['active', 'paused'].includes(buds.state) ? 'RESUME' : 'START';
      const progress = claim ? stageNum : ['active', 'paused'].includes(buds.state) ? stageNum - 1 : 0;
      bud.setAttribute('aria-label', `${headline}. ${action}`);
      bud.innerHTML = `<span class="home-buds-mark"><img src="uploads/dandysbudicon.png" alt=""><img class="home-buds-dandy" src="uploads/dandyhimself.png" alt=""></span>
        <span class="home-buds-copy grow"><small>DANDY'S BUDS · ${claim ? 'REWARD READY' : `${progress}/3 FLOORS COMPLETE`}</small><b>${headline}</b><span>${subline}</span>
          <span class="home-buds-progress" aria-label="${progress} of 3 floors complete"><i class="${progress >= 1 ? 'done' : ''}"></i><i class="${progress >= 2 ? 'done' : ''}"></i><i class="${progress >= 3 ? 'done' : ''}"></i></span></span>
        <span class="home-buds-action"><em>${action}</em><strong>›</strong></span>`;
      bud.onclick = () => Screens.openDandysBuds();
      hub.appendChild(bud);
      if (buds.state === 'active') {
        const pause = el('button', 'home-buds-pause', 'Pause Dandy’s Buds · switch Toons');
        pause.onclick = () => this.pauseDandysBuds();
        hub.appendChild(pause);
      }
    }

    if (!['active', 'chooseHero', 'chooseTrinket', 'chooseSupplies'].includes(buds.state)) {
      const cont = el('button', 'home-continue');
      cont.setAttribute('aria-label', `Continue Endless Run: Floor ${run.floor}, Room ${run.node + 1} of ${layout.nodes.length}, ${nextRoomName}`);
      cont.innerHTML = `<span class="home-continue-icon"><i>▶</i></span><span class="grow"><small>CONTINUE RUN</small><b>ENDLESS · FLOOR ${run.floor}</b><em>Room ${run.node + 1} of ${layout.nodes.length} · <i class="home-next-pill">${nextRoomIcon} ${nextRoomName}</i></em></span><span class="home-continue-end"><kbd class="home-kbd-hint" aria-hidden="true">SPACE</kbd><strong>›</strong></span>`;
      cont.onclick = () => Screens.go('depths'); hub.appendChild(cont);
    }

    const section = (kicker, title, cls) => { const n = el('section', 'home-section ' + (cls || '')); n.innerHTML = `<header><small>${kicker}</small><b>${title}</b></header>`; hub.appendChild(n); return n; };
    const play = section('PLAY', 'Choose a battle', 'play');
    const playGrid = el('div', 'home-play-grid');
    const playCard = (icon, name, sub, cls, mode, fn) => {
      const gate = this.modeGate(mode), locked = gate && !this.modeUnlocked(mode);
      const n = el('button', 'home-play-card ' + cls + (locked ? ' locked' : ''));
      n.innerHTML = `<i>${locked ? '🔒' : icon}</i><span><b>${name}</b><small>${locked ? `Mastery ${gate.mastery}` : sub}</small></span><em>${locked ? '🔒' : '›'}</em>`;
      n.onclick = locked ? () => this.showModeGate(mode) : fn; return n;
    };
    playGrid.appendChild(playCard('🏆', 'Arena', `Rank #${fmt(ar.rank)}`, 'arena', 'arena', () => Screens.go('arena')));
    playGrid.appendChild(playCard('👑', 'Event', feat?.name ? `Weekly · ${feat.name}` : 'Weekly encounters', 'event', 'raid', () => Screens.go('raid')));
    const trialBeginner = Save.data.mastery < MODE_UNLOCKS.trials.mastery;
    playGrid.appendChild(playCard('⚗', 'Trials', trialBeginner ? `Training grind · divisions at Mastery ${MODE_UNLOCKS.trials.mastery}` : Save.data.mastery >= 600 ? 'Weekly divisions · Apex 600 / 700 / 800' : 'Weekly divisions', 'trials', 'trials', () => Screens.go('trials')));
    play.appendChild(playGrid);

    const orders = Daily.orderSummary();
    const ordersReady = Daily.orders().some((o, i) => orders.wins >= o.need && !Daily.orderState().orderClaimed.includes(i));
    const passiveReady = ['hour', 'day', 'week'].some(kind => Daily.passiveAvailable && Daily.passiveAvailable(kind));
    const passInfo = Pass.level(), passReady = Pass.claimable().length;
    const collect = section('COLLECT', 'Ready now', 'collect');
    const collectGrid = el('div', 'home-collect-grid');
    const collectCard = (icon, name, sub, ready, fn, mode, badge) => {
      const gate = this.modeGate(mode), locked = gate && !this.modeUnlocked(mode);
      const n = el('button', 'home-collect-card' + (ready && !locked ? ' ready' : '') + (locked ? ' locked' : ''));
      n.innerHTML = `<i>${locked ? '🔒' : icon}</i><b>${name}</b><small>${locked ? `Mastery ${gate.mastery}` : sub}</small>${ready && !locked ? `<em class="home-collect-badge">${badge || '!'}</em>` : ''}`;
      n.onclick = locked ? () => this.showModeGate(mode) : fn; return n;
    };
    collectGrid.appendChild(collectCard('📅', 'Daily', passiveReady ? 'Free cache ready' : ordersReady ? 'Order ready' : Daily.available() ? 'Delivery ready' : `${orders.wins} wins`, passiveReady || ordersReady || Daily.available(), () => Screens.go('events'), null, '!'));
    const tapeCount = Save.res('tape');
    collectGrid.appendChild(collectCard('🎟', 'Scratch', tapeCount > 0 ? `${tapeCount} tape${tapeCount === 1 ? '' : 's'}` : '0 tapes', tapeCount > 0, () => { Screens.go('events'); setTimeout(() => Screens.openScratch(), 60); }, null, tapeCount > 0 ? tapeCount : null));
    const crateCount = Save.res('gold') + Save.res('diamond') + Save.res('main');
    collectGrid.appendChild(collectCard('📦', 'Crates', crateCount > 0 ? `${crateCount} held` : '0 held', crateCount > 0, () => Screens.go('crates'), 'crates', crateCount > 0 ? crateCount : null));
    collectGrid.appendChild(collectCard('📜', 'Pass', passReady ? `${passReady} reward${passReady === 1 ? '' : 's'}` : passInfo.complete ? 'Complete' : `Lv ${passInfo.lv}/${passInfo.max}`, passReady > 0, () => Screens.openPass('home'), 'pass', passReady > 0 ? passReady : null));
    collect.appendChild(collectGrid);

    const grow = section('GROW', 'Your collection', 'grow');
    const growGrid = el('div', 'home-grow-grid');
    const growCard = (icon, name, sub, fn, mode, pill) => {
      const gate = this.modeGate(mode), locked = gate && !this.modeUnlocked(mode);
      const n = el('button', 'home-grow-card' + (locked ? ' locked' : ''));
      n.innerHTML = `<i>${locked ? '🔒' : icon}</i><span><b>${name}</b><small>${locked ? `Mastery ${gate.mastery}` : sub}</small></span>${pill ? `<em class="home-grow-pill">${pill}</em>` : `<em>${locked ? '🔒' : '›'}</em>`}`;
      n.onclick = locked ? () => this.showModeGate(mode) : fn; return n;
    };
    const shopLevel = (d.shop && d.shop.level) || 0;
    const ownedCount = Save.ownedIds().length, totalHeroes = PLAYABLE_IDS.length;
    growGrid.appendChild(growCard('🎭', 'Heroes', `${ownedCount} / ${totalHeroes} recruited`, () => Screens.go('roster'), null, `${Math.round(ownedCount / totalHeroes * 100)}%`));
    growGrid.appendChild(growCard('🛍️', 'Shop', `Counter Lv ${shopLevel} / 100`, () => Screens.go('shop'), 'shop'));
    growGrid.appendChild(growCard('🎒', 'Inventory', 'Trinkets & materials', () => Screens.go('inventory'), 'inventory'));
    const badgeCount = Object.keys(d.badges).length;
    growGrid.appendChild(growCard('🤝', 'Friendship', `${badgeCount} badge${badgeCount === 1 ? '' : 's'} linked`, () => Screens.go('friendship'), 'friendship'));
    const achDone = Achievements.completed().length, achTotal = Achievements.list.length;
    growGrid.appendChild(growCard('📖', 'Journal', `${achDone} / ${achTotal} achievements`, () => Screens.go('journal'), null, `${Math.round(achDone / achTotal * 100)}%`));
    grow.appendChild(growGrid);

    const cap = globalCap(), next = Math.min(cap, d.mastery + 1), reward = d.mastery < cap ? Save.masteryReward(next) : null;
    const mastery = el('section', 'home-mastery');
    const masteryNeed = Save.masteryNeed(d.mastery);
    const masteryPct = Math.min(100, Math.round((d.masteryXp / masteryNeed) * 100));
    mastery.innerHTML = `<header><i>🏅</i><span class="grow"><small>ACCOUNT PROGRESS</small><b>MASTERY ${d.mastery}</b></span><span class="home-mastery-meta"><em>${masteryPct}%</em><small>CAP ${cap}</small></span></header>`;
    mastery.appendChild(UI.bar(d.masteryXp / masteryNeed, 'linear-gradient(90deg,#ff5b7f,#ffc94d)'));
    mastery.appendChild(el('div', 'home-mastery-copy', d.mastery < cap ? `${fmt(d.masteryXp)} / ${fmt(masteryNeed)} XP · Next: ${Object.keys(reward).filter(k => RES[k]).map(k => RES[k].icon + fmt(reward[k])).join(' ')}` : 'Recruit more Heroes to raise the account cap.'));
    hub.appendChild(mastery);
    const settings = el('button', 'home-settings', '⚙ Settings & Save Data'); settings.onclick = () => this.openSettings(); hub.appendChild(settings);
    s.appendChild(hub);

    // Keyboard shortcuts while Home Hub is active
    if (this._homeKeyHandler) {
      window.removeEventListener('keydown', this._homeKeyHandler);
      this._homeKeyHandler = null;
    }
    this._homeKeyHandler = (e) => {
      if (this.cur !== 'home') return;
      const modal = $('#modal');
      if (modal && !modal.hidden) return;
      if (['INPUT', 'TEXTAREA'].includes(document.activeElement?.tagName)) return;
      if (e.altKey || e.ctrlKey || e.metaKey) return;

      if (e.code === 'Space' || e.key === 'Enter') {
        const cont = $('.home-continue', hub) || $('.home-buds', hub);
        if (cont) { e.preventDefault(); cont.click(); }
      } else if (e.code === 'KeyE') {
        e.preventDefault();
        Sound.play('choose', { vol: .42, priority: true });
        Screens.openTeamEditor();
      } else if (e.code === 'KeyR') {
        e.preventDefault();
        Screens.go('roster');
      } else if (e.code === 'KeyA') {
        e.preventDefault();
        Screens.go('arena');
      }
    };
    window.addEventListener('keydown', this._homeKeyHandler);

    requestAnimationFrame(() => hub.classList.add('home-hub-ready'));
    if (this._homeEntrancePending) {
      this._homeEntrancePending = false;
      Sound.play('ui_open', { vol: .42, priority: true });
      Sound.play('sparkle', { vol: .22, delay: 110, throttle: 0 });
    }
    if (this.budsNeedsAttention()) setTimeout(() => this.showBudsDemand(true), 520);
    return;

    {
    // hero banner - your own team leads here, never a promo Hero you don't
    // own, so a new player never mistakes a Battle Pass feature for their
    // actual starting roster.
    const feat = featured(currentWeek());
    const bannerId = Save.data.team[0] || feat.pass || STARTERS[0];
    const bannerIsOwn = bannerId === Save.data.team[0] && Save.owns(bannerId);
    const banner = el('div', 'card tap');
    banner.style.cssText += `padding:0;height:192px;display:flex;align-items:flex-end;
      background:linear-gradient(180deg,#59626e,#343a42)`;
    banner.innerHTML = `
      <div style="position:absolute;inset:0;background:
        repeating-linear-gradient(135deg,rgba(255,255,255,.045) 0 14px,transparent 14px 28px)"></div>
      <div style="position:absolute;inset:0;display:grid;place-items:center;">
        <img src="${Art.hero(bannerId)}" style="height:152px;object-fit:contain;
          filter:saturate(1.12) contrast(1.06) drop-shadow(0 0 2px rgba(0,0,0,.4))
            drop-shadow(0 -1px 0 rgba(255,255,255,.25)) drop-shadow(0 10px 12px rgba(0,0,0,.6));
          transform:translateY(4px)">
      </div>
      <div style="position:absolute;inset:0;background:linear-gradient(transparent 42%,rgba(12,14,18,.92))"></div>
      <div style="position:relative;padding:12px;width:100%">
        <div class="mini b ink-s" style="color:var(--accent);letter-spacing:2px">${bannerIsOwn ? 'YOUR TEAM · TAP TO EDIT' : 'THIS WEEK'}</div>
        <div class="b ink" style="font-size:21px">${HEROES[bannerId].name}</div>
        <div class="tiny b ink-s" style="color:#dfe5ec">${heroRole(HEROES[bannerId].role)}${bannerIsOwn ? '' : ' · Battle Pass feature'}</div>
        ${bannerIsOwn ? '<div class="row" id="bannerSquad" style="margin-top:7px;gap:5px"></div>' : ''}
      </div>`;
    // the rest of the team, so the banner reads as "here's your squad"
    // rather than making it look like Boxten (or whoever leads) is the
    // only Hero a new player has.
    if (bannerIsOwn) {
      const squad = $('#bannerSquad', banner);
      Save.data.team.filter(Boolean).forEach(id => {
        const im = el('img');
        im.src = Art.icon(id);
        im.style.cssText = `width:30px;height:30px;object-fit:contain;background:#191c21;border-radius:8px;
          border:2px solid ${id === bannerId ? 'var(--accent)' : 'var(--edge)'}`;
        squad.appendChild(im);
      });
    }
    banner.onclick = () => bannerIsOwn ? Screens.openTeamEditor() : Screens.openPass('home');
    s.appendChild(banner);

    // run continue card
    const r = Depths.run();
    const L = Depths.layout();
    const cont = el('div', 'card tap');
    cont.innerHTML = `<div class="row">
        <div style="font-size:30px">▶</div>
        <div class="grow">
          <div class="b">Endless Run</div>
          <div class="tiny muted">Floor ${r.floor} · Room ${r.node + 1} of ${L.nodes.length}</div>
        </div>
        <div class="btn go">Continue</div>
      </div>`;
    cont.onclick = () => Screens.go('depths');
    s.appendChild(cont);

    // daily strip
    const strip = el('div', 'grid3');
    const mk = (icon, label, sub, screen, hot) => {
      const c = el('div', 'card tap');
      c.style.marginBottom = 0; c.style.padding = '10px 6px'; c.style.textAlign = 'center';
      c.innerHTML = `<div style="font-size:24px">${icon}</div><div class="mini b">${label}</div>
        <div class="mini" style="color:${hot ? 'var(--gold)' : 'var(--dim)'}">${sub}</div>`;
      c.onclick = () => screen();
      if (hot) c.style.borderColor = 'var(--gold)';
      return c;
    };
    const orders = Daily.orderSummary();
    const ordersReady = Daily.orders().some((o, i) => orders.wins >= o.need && !Daily.orderState().orderClaimed.includes(i));
    strip.appendChild(mk('📅', 'Daily', ordersReady ? 'Order ready' : (Daily.available() ? 'Delivery ready' : orders.wins + ' wins'),
      () => Screens.go('events'), ordersReady || Daily.available()));
    strip.appendChild(mk('🎟', 'Scratch', Save.res('tape') + ' tapes',
      () => { Screens.go('events'); setTimeout(() => Screens.openScratch(), 60); }, Save.res('tape') > 0));
    const crateCount = Save.res('gold') + Save.res('diamond') + Save.res('main');
    strip.appendChild(mk('📦', 'Crates', crateCount + ' held', () => Screens.go('crates'), crateCount > 0));
    s.appendChild(strip);
    s.appendChild(el('div', 'spacer'));

    this.section(s, 'MODES');
    const modes = el('div', 'grid2');
    const mode = (icon, name, sub, fn) => {
      const c = el('div', 'card tap');
      c.style.marginBottom = 0;
      c.innerHTML = `<div class="row"><div style="font-size:26px">${icon}</div>
        <div class="grow"><div class="b">${name}</div><div class="mini muted">${sub}</div></div></div>`;
      c.onclick = fn; return c;
    };
    const ar = Arena.today();
    modes.appendChild(mode('🏆', 'Arena', 'Rank ' + fmt(ar.rank), () => Screens.go('arena')));
    modes.appendChild(mode('⚗', 'Trials', trialBeginner ? `Training grind · Mastery ${MODE_UNLOCKS.trials.mastery} for divisions` : Save.data.mastery >= 600 ? '3 weekly divisions + Apex 600 / 700 / 800' : '3 weekly divisions', () => Screens.go('trials')));
    modes.appendChild(mode('🎭', 'Heroes', Save.ownedIds().length + ' / ' + PLAYABLE_IDS.length, () => Screens.go('roster')));
    const shopLevel = (Save.data.shop && Save.data.shop.level) || 0;
    modes.appendChild(mode('🛍️', 'Shop', 'Counter Lv ' + shopLevel + ' / 100', () => Screens.go('shop')));
    const passInfo = Pass.level(), passReady = Pass.claimable().length;
    modes.appendChild(mode('📜', 'Battle Pass', passReady ? passReady + ' reward' + (passReady === 1 ? '' : 's') + ' ready' :
      (passInfo.complete ? 'All rewards claimed' : 'Level ' + passInfo.lv + ' / ' + passInfo.max), () => Screens.openPass('home')));
    modes.appendChild(mode('🎒', 'Inventory', 'Equipment & materials', () => Screens.go('inventory')));
    modes.appendChild(mode('📖', 'Journal', `${Achievements.completed().length} / ${Achievements.list.length} achievements`, () => Screens.go('journal')));
    modes.appendChild(mode('🤝', 'Friendship', Object.keys(Save.data.badges).length + ' / ' + Object.keys(CAMPAIGNS).length + ' Badges', () => Screens.go('friendship')));
    s.appendChild(modes);

    this.section(s, 'PROGRESS');
    const prog = el('div', 'card');
    const cap = globalCap(currentWeek());
    const nextMastery = Math.min(cap, d.mastery + 1);
    const nextReward = d.mastery < cap ? Save.masteryReward(nextMastery) : null;
    const rewardText = nextReward ? Object.keys(nextReward).filter(k => RES[k])
      .map(k => `${RES[k].icon}${fmt(nextReward[k])}`).join('  ') : 'Recruit more Heroes to raise the cap.';
    prog.innerHTML = `
      <div class="row tiny"><div class="grow b">Mastery ${d.mastery}</div>
        <div class="muted">cap ${cap}</div></div>`;
    prog.appendChild(UI.bar(Save.data.masteryXp / Save.masteryNeed(d.mastery), 'linear-gradient(90deg,#ff5b7f,#ffc94d)'));
    prog.appendChild(el('div', 'mini muted', d.mastery < cap
      ? `${fmt(d.masteryXp)} / ${fmt(Save.masteryNeed(d.mastery))} XP · Next reward: ${rewardText}`
      : 'Mastery caps every Hero\'s level. Recruit more Heroes to raise it.'));
    prog.appendChild(el('div', 'mini muted', 'Wins, Toon unlocks and levels, claimed rewards, Journal discoveries, and Trinket upgrades grant Mastery XP.'));
    const stats = el('div', 'row tiny');
    stats.style.marginTop = '8px';
    stats.innerHTML = `<div class="grow">Deepest floor <b>${d.bestFloor}</b></div>
      <div class="grow">Arena <b>${ar.wins}W ${ar.losses}L</b></div>
      <div>Crate Lv <b>${Gacha.crateLevel()}</b></div>`;
    prog.appendChild(stats);
    s.appendChild(prog);

    const opt = el('div', 'row');
    const so = el('button', 'btn tiny grow', Sound.on ? '🔊 Sound On' : '🔇 Sound Off');
    so.onclick = () => { Save.data.opt.sound = Sound.toggle(); Save.write(); this.render(); };
    const set = el('button', 'btn tiny grow', '⚙ Settings');
    set.onclick = () => this.openSettings();
    opt.appendChild(so); opt.appendChild(set);
    s.appendChild(opt);
    }
  },

  /** Sound, save backup/restore as real files, and Reset - everything
      destructive or save-related lives behind one modal instead of loose
      buttons on the Hub. */
  askSaveName(title, initial, onDone) {
    const body = el('div');
    body.appendChild(el('div', 'muted tiny', 'Use a short name so this save is easy to spot later.'));
    const input = el('input', 'save-slot-input'); input.type = 'text'; input.maxLength = 24; input.value = initial || '';
    input.setAttribute('aria-label', 'Save name'); body.appendChild(input);
    const row = el('div', 'row'); row.style.marginTop = '12px';
    const cancel = el('button', 'btn tiny grow', 'Cancel');
    const ok = el('button', 'btn gold tiny grow', 'Save Name');
    cancel.onclick = () => UI.closeModal();
    ok.onclick = () => { const name = input.value.trim(); if (!name) { input.focus(); return; } UI.closeModal(); onDone(name); };
    input.onkeydown = e => { if (e.key === 'Enter') ok.click(); };
    row.append(cancel, ok); body.appendChild(row); UI.modal(title, body);
    setTimeout(() => { input.focus(); input.select(); }, 0);
  },

  downloadSave(slotId = Save.activeSlot) {
    const json = Save.exportSlot(slotId);
    if (!json) {
      Sound.play('ui_err'); UI.toast('That save could not be downloaded');
      return false;
    }
    const slot = Save.slotInfo(slotId) || {};
    const safeName = String(slot.name || 'save').toLowerCase()
      .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'save';
    const filename = 'dandys-heroes-' + safeName + '-' + new Date().toISOString().slice(0, 10) + '.json';
    const blob = new Blob([json], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url; link.download = filename; link.rel = 'noopener';
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    Sound.play('ui_ok'); UI.toast('Save downloaded');
    return true;
  },

  drawSaveSlots(host) {
    clear(host);
    const slots = Save.listSlots();
    slots.forEach(slot => {
      const card = el('div', 'save-slot-card' + (slot.active ? ' active' : ''));
      const updated = slot.updatedAt ? new Date(slot.updatedAt).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' }) : 'Not played yet';
      card.innerHTML = `<div class="save-slot-head"><div class="grow"><b>${slot.name}</b><small>${slot.active ? 'CURRENT SAVE' : 'LOCAL SLOT'} · ${updated}</small></div>${slot.active ? '<em>ACTIVE</em>' : ''}</div>
        <div class="save-slot-stats"><span><b>${fmt(slot.mastery)}</b> mastery</span><span><b>${fmt(slot.heroes)}</b> heroes</span><span><b>${fmt(slot.bestFloor)}</b> best floor</span></div>`;
      const actions = el('div', 'save-slot-actions');
      const load = el('button', 'btn tiny grow', slot.active ? '✓ Current' : 'Load');
      load.disabled = slot.active;
      load.onclick = () => UI.confirm('Load “' + slot.name + '”?', 'Your current slot stays saved. The game will reopen in the selected slot.', () => {
        if (Save.switchSlot(slot.id)) location.reload();
        else { Sound.play('ui_err'); UI.toast('That save slot could not be opened'); }
      });
      const duplicate = el('button', 'btn tiny grow', 'Copy');
      duplicate.onclick = () => this.askSaveName('Copy Save', slot.name + ' Copy', name => {
        if (Save.activeSlot !== slot.id && !Save.switchSlot(slot.id)) { UI.toast('That save slot could not be opened'); return; }
        if (Save.createSlot(name, true)) location.reload();
        else { Sound.play('ui_err'); UI.toast('All save slots are full'); }
      });
      const download = el('button', 'btn tiny', '↓ Download');
      download.title = 'Download this save as a JSON backup';
      download.onclick = () => this.downloadSave(slot.id);
      const rename = el('button', 'btn tiny', 'Rename');
      rename.onclick = () => this.askSaveName('Rename Save', slot.name, name => { if (Save.renameSlot(slot.id, name)) this.openSettings(); });
      const remove = el('button', 'btn tiny danger', 'Delete');
      remove.disabled = slot.active || slots.length <= 1;
      remove.onclick = () => UI.confirm('Delete “' + slot.name + '”?', 'This removes that local slot and its backup. Your current save is not affected.', () => {
        if (Save.deleteSlot(slot.id)) this.openSettings();
      });
      actions.append(load, duplicate, download, rename, remove); card.appendChild(actions); host.appendChild(card);
    });
    const foot = el('div', 'save-slot-foot');
    const add = el('button', 'btn gold tiny grow', '＋ New Save');
    add.onclick = () => this.askSaveName('New Save', 'Save ' + (slots.length + 1), name => {
      if (Save.createSlot(name, false)) location.reload();
      else { Sound.play('ui_err'); UI.toast('All save slots are full'); }
    });
    foot.append(add, el('small', 'muted', `${slots.length} / ${SAVE_SLOT_LIMIT} local slots · each slot keeps its own recovery backup`));
    host.appendChild(foot);
  },

  async openSettings() {
    const body = el('div', 'settings-shell');
    const settingsHero = el('section', 'settings-hero');
    settingsHero.innerHTML = `<div class="settings-hero-mark">⚙</div><div><small>BACK ROOM CONTROL</small><h2>Settings</h2><p>Tune the stage, sound, and save tools around the way you play.</p></div>`;
    body.appendChild(settingsHero);

    const audioLabel = el('div', 'settings-section-label', 'AUDIO');
    body.appendChild(audioLabel);
    const so = el('button', 'settings-master-toggle', Sound.on ? '🔊 Sound On' : '🔇 Sound Off');
    so.setAttribute('aria-pressed', String(Sound.on));
    so.onclick = () => { Save.data.opt.sound = Sound.toggle(); Save.write(); so.textContent = Sound.on ? '🔊 Sound On' : '🔇 Sound Off'; so.setAttribute('aria-pressed', String(Sound.on)); };
    body.appendChild(so);

    const audioGrid = el('div', 'settings-audio-grid');
    const sfxPanel = el('div', 'settings-audio settings-control-card');
    const sfxHead = el('div', 'settings-audio-head');
    const sfxName = el('b', '', 'Sound Effects');
    const sfxValue = el('strong', 'settings-audio-value');
    const sfxRange = document.createElement('input');
    sfxRange.type = 'range'; sfxRange.min = '0'; sfxRange.max = '100'; sfxRange.step = '1';
    sfxRange.value = String(Math.round(Sound.vol * 100)); sfxRange.setAttribute('aria-label', 'Sound effects volume');
    const syncSfx = () => { const pct = Math.round(Sound.vol * 100); sfxRange.value = String(pct); sfxValue.textContent = pct + '%'; };
    syncSfx();
    sfxRange.oninput = () => { Sound.setVolume(Number(sfxRange.value) / 100, { skipSave: true }); syncSfx(); };
    sfxRange.onchange = () => { Save.data.opt.sfxVolume = Sound.vol; Save.write(); };
    sfxHead.append(sfxName, sfxValue);
    sfxPanel.append(sfxHead, sfxRange, el('small', 'muted', 'Impacts, buttons, skills, and character cues.'));
    audioGrid.appendChild(sfxPanel);

    const musicPanel = el('div', 'settings-audio settings-control-card');
    const musicHead = el('div', 'settings-audio-head');
    const musicName = el('b', '', 'Background Music');
    const musicValue = el('strong', 'settings-audio-value');
    const musicRange = document.createElement('input');
    musicRange.type = 'range'; musicRange.min = '0'; musicRange.max = '100'; musicRange.step = '1';
    musicRange.value = String(Math.round(Music.volume * 100));
    musicRange.setAttribute('aria-label', 'Music volume');
    const syncMusic = () => {
      const pct = Math.round(Music.volume * 100);
      musicRange.value = String(pct); musicValue.textContent = pct + '%';
    };
    syncMusic();
    musicRange.oninput = () => { Music.setVolume(Number(musicRange.value) / 100, { skipSave: true }); syncMusic(); };
    musicRange.onchange = () => { Save.data.opt.musicVolume = Music.volume; Save.write(); };
    musicHead.append(musicName, musicValue);
    musicPanel.append(musicHead, musicRange, el('small', 'muted', 'Adjusts background tracks without changing sound effects.'));
    audioGrid.appendChild(musicPanel);
    body.appendChild(audioGrid);

    body.appendChild(el('div', 'settings-section-label', 'COMFORT & ACCESSIBILITY'));
    const reducedOn = Accessibility.enabled();
    const systemReduced = Accessibility.systemEnabled() && Save.data.opt.reducedEffects !== true;
    const reduced = el('button', 'settings-master-toggle settings-toggle', reducedOn ? `☑ Reduce Motion & Flashing: On${systemReduced ? ' (device)' : ''}` : '☐ Reduce Motion & Flashing: Off');
    reduced.type = 'button';
    reduced.setAttribute('aria-pressed', String(reducedOn));
    reduced.title = 'Reduces flashes, screen shake, zoom, hitstop, and decorative battle effects.';
    reduced.onclick = () => {
      if (Save.data.opt.reducedEffects === true) {
        UI.closeModal();
        UI.confirm('Safety warning', 'Disabling Reduced Motion & Flashing may expose you to screen flashes, camera shake, zoom, and other motion effects. Continue only if this is safe for you.', () => {
          Accessibility.disable(); this.openSettings();
        });
      } else if (systemReduced) {
        UI.toast('Your device is enforcing reduced motion.');
      } else {
        Accessibility.enable(); UI.closeModal(); this.openSettings();
      }
    };
    body.appendChild(reduced);
    body.appendChild(el('div', 'settings-note', 'Also follows your device’s reduced-motion preference.'));

    body.appendChild(el('div', 'settings-section-label', 'GRAPHICS')); 
    const graphicsPanel = el('div', 'settings-audio settings-control-card settings-quality-card');
    const graphicsHead = el('div', 'settings-audio-head');
    const graphicsName = el('b', '', 'Graphics Quality');
    const graphicsValue = el('strong', 'settings-audio-value');
    const graphicsRange = document.createElement('input');
    graphicsRange.type = 'range'; graphicsRange.min = '0'; graphicsRange.max = '100'; graphicsRange.step = '10';
    graphicsRange.value = String(GraphicsSettings.value());
    graphicsRange.setAttribute('aria-label', 'Graphics quality');
    const syncGraphics = () => {
      const value = GraphicsSettings.value();
      graphicsRange.value = String(value);
      graphicsValue.textContent = value <= 33 ? 'LOW' : value >= 67 ? 'HIGH' : 'BALANCED';
    };
    syncGraphics();
    graphicsRange.oninput = () => {
      const value = clamp(Number(graphicsRange.value), 0, 100);
      GraphicsSettings.remember(value);
      Save.data.opt.graphicsQuality = value;
      GraphicsSettings.sync();
      graphicsValue.textContent = value <= 33 ? 'LOW' : value >= 67 ? 'HIGH' : 'BALANCED';
    };
    graphicsRange.onchange = () => { Save.data.opt.graphicsQuality = clamp(Number(graphicsRange.value), 0, 100); Save.write(); };
    graphicsHead.append(graphicsName, graphicsValue);
    graphicsPanel.append(graphicsHead, graphicsRange, el('small', 'muted', 'Lower values reduce particles, shadows, filters, and battle repaint work.'));
    body.appendChild(graphicsPanel);

    const presetPanel = el('div', 'settings-preset-panel');
    presetPanel.innerHTML = `<div class="settings-control-heading"><div><b>Quick preset</b><small>Apply a complete visual profile in one tap.</small></div></div>`;
    const presetRow = el('div', 'settings-preset-row');
    const presets = [
      ['battery', 'Battery Saver', 'Cooler, calmer battles', 25, 'off', false, false, false],
      ['balanced', 'Balanced', 'Recommended starting point', 55, 'reduced', true, true, true],
      ['sharp', 'Sharp', 'Maximum visual detail', 90, 'auto', true, true, true]
    ];
    const presetButtons = [];
    const syncPreset = () => {
      const q = GraphicsSettings.value(), p = GraphicsSettings.option('graphicsParticles'), bg = GraphicsSettings.option('graphicsBackground');
      presetButtons.forEach((button, i) => button.classList.toggle('active', q === presets[i][3] && p === presets[i][4] && bg === presets[i][5]));
    };
    presets.forEach(([id, label, desc, quality, particles, background, numbers, shake]) => {
      const button = el('button', 'settings-preset', `<b>${label}</b><small>${desc}</small>`); button.type = 'button'; button.dataset.preset = id;
      button.onclick = () => {
        GraphicsSettings.remember(quality);
        Save.data.opt.graphicsQuality = quality;
        Save.data.opt.graphicsParticles = particles;
        Save.data.opt.graphicsBackground = background;
        Save.data.opt.combatNumbers = numbers;
        Save.data.opt.screenShake = shake;
        Save.data.opt.cameraZoom = shake;
        Save.write(); GraphicsSettings.sync(); syncGraphics(); syncOptions(); syncPreset();
      };
      presetButtons.push(button); presetRow.appendChild(button);
    });
    presetPanel.appendChild(presetRow); body.appendChild(presetPanel);

    const optionsPanel = el('div', 'settings-options-panel');
    optionsPanel.innerHTML = `<div class="settings-control-heading"><div><b>Fine controls</b><small>Keep the effects you love and trim the ones you do not.</small></div></div>`;
    const optionsGrid = el('div', 'settings-options-grid');
    const optionButtons = [];
    const optionLabel = (key, value) => {
      const current = GraphicsSettings.option(key);
      if (key === 'graphicsParticles') return current === 'off' ? 'Off' : current === 'reduced' ? 'Reduced' : 'Auto';
      return current ? 'On' : 'Off';
    };
    const addOption = (key, title, desc, values) => {
      const button = el('button', 'settings-option'); button.type = 'button'; button.dataset.option = key;
      const sync = () => { button.innerHTML = `<span><b>${title}</b><small>${desc}</small></span><strong>${optionLabel(key)}</strong>`; button.setAttribute('aria-pressed', String(GraphicsSettings.option(key) !== false && GraphicsSettings.option(key) !== 'off')); };
      button.onclick = () => {
        const current = GraphicsSettings.option(key), index = values.indexOf(current), next = values[(index + 1) % values.length];
        GraphicsSettings.setOption(key, next); syncOptions(); syncPreset();
      };
      optionButtons.push({ key, sync }); sync(); optionsGrid.appendChild(button);
    };
    const syncOptions = () => optionButtons.forEach(item => item.sync());
    addOption('graphicsParticles', 'Particles', 'Ambient and impact particle density.', ['auto', 'reduced', 'off']);
    addOption('graphicsBackground', 'Background detail', 'Stage filters, shadows, and atmosphere.', [true, false]);
    addOption('combatNumbers', 'Combat numbers', 'Damage, healing, and shield readouts.', [true, false]);
    addOption('screenShake', 'Screen shake', 'Small camera jolts on heavy impacts.', [true, false]);
    addOption('cameraZoom', 'Impact zoom', 'Subtle punch-in on critical moments.', [true, false]);
    optionsPanel.appendChild(optionsGrid); body.appendChild(optionsPanel); syncPreset();
    body.appendChild(el('div', 'settings-note', 'Reduced Motion & Flashing overrides shake, zoom, flashes, and decorative effects while it is enabled.'));

    if (typeof Lab !== 'undefined') {
      body.appendChild(el('div', 'settings-section-label', 'TESTING'));
      const labButton = el('button', 'btn wide lab-settings-btn', '🧪 Open Fight Lab');
      labButton.id = 'settingsLabBtn';
      labButton.title = 'Open the combat test room';
      labButton.onclick = () => { UI.closeModal({ skipHook: true }); Lab.enter(); };
      body.appendChild(labButton);
      body.appendChild(el('div', 'tiny muted', 'Build and test teams without changing your save.'));
      body.appendChild(el('div', 'spacer'));
    }

    body.appendChild(el('div', 'settings-section-label', 'SAVE SLOTS'));
    const slotsHost = el('div', 'save-slots');
    this.drawSaveSlots(slotsHost); body.appendChild(slotsHost);
    body.appendChild(el('div', 'spacer'));
    body.appendChild(el('div', 'settings-section-label', 'BACKUP FILE'));
    const saveRow = el('div', 'row'); saveRow.style.marginTop = '6px';
    const saveBtn = el('button', 'btn tiny grow', '💾 Save to File');
    saveBtn.onclick = () => this.downloadSave(Save.activeSlot);
    const loadBtn = el('button', 'btn tiny grow', '📂 Load from File');
    const fileInput = el('input'); fileInput.type = 'file'; fileInput.accept = 'application/json,.json'; fileInput.hidden = true;
    fileInput.onchange = () => {
      const file = fileInput.files[0]; if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        const text = String(reader.result || '');
        const choice = el('div');
        choice.appendChild(el('div', 'muted tiny', 'Choose where “' + file.name + '” should go. The original file remains untouched.'));
        const row = el('div', 'row'); row.style.marginTop = '12px';
        const current = el('button', 'btn pri tiny grow', 'Replace Current');
        current.onclick = () => UI.confirm('Replace current save?', 'A recovery backup will be kept before this save is replaced.', () => {
          if (Save.import(text)) location.reload();
          else { UI.toast('That doesn\'t look like a valid save'); Sound.play('ui_err'); }
        });
        const fresh = el('button', 'btn gold tiny grow', 'Import as New');
        fresh.onclick = () => {
          this.askSaveName('Name Imported Save', file.name.replace(/\.json$/i, '').slice(0, 24), name => {
            if (Save.import(text, { newSlot: true, name })) location.reload();
            else { UI.toast('That save could not be imported'); Sound.play('ui_err'); }
          });
        };
        row.append(current, fresh); choice.appendChild(row); UI.modal('Import Save', choice);
      };
      reader.readAsText(file);
      fileInput.value = '';
    };
    loadBtn.onclick = () => fileInput.click();
    saveRow.appendChild(saveBtn); saveRow.appendChild(loadBtn); saveRow.appendChild(fileInput);
    body.appendChild(saveRow);
    body.appendChild(el('div', 'spacer'));

    if (Save.canLoadTestSave()) {
      const test = el('button', 'btn gold wide', '★ Open Full Save');
      test.onclick = () => UI.confirm('Open full save?', 'This opens a separate Full Test Save slot with every Hero, maxed access, plentiful resources, and test Trinkets. Your current save is never overwritten.',
        () => { if (Save.loadTestSave()) location.reload(); });
      body.appendChild(test);
      body.appendChild(el('div', 'spacer'));
    }

    const rs = el('button', 'btn wide', '↺ Reset Save');
    rs.onclick = () => UI.confirm('Reset everything?', 'All Heroes, resources and progress are erased.',
      () => { Save.reset(); location.reload(); });
    body.appendChild(rs);

    UI.modal('⚙ Settings', body, { className: 'settings-modal' });
  }
};
