/* screens/daily.js - the "events" screen (Daily Deliveries, Scratch Card,
   Battle Pass) and the Scratch Card modal. Extends Screens (screens/core.js).
   Note: the screen key here is 'events' for historical reasons - this is
   the Daily hub, distinct from the Event/Raid boss screen (screens/raid.js). */
'use strict';

Object.assign(Screens, {

  /* ============================================================ EVENTS (daily / pass / scratch) */
  events(s) {
    const live = el('div', 'live-service-strip');
    live.innerHTML = `<span><i></i> LIVE</span><div>DAILY RESET <b id="dailyReset">--</b></div><div>WEEKLY RESET <b id="weeklyReset">--</b></div>`;
    s.appendChild(live);

    // Passive claims: no battles, orders, or other requirements. Each timer
    // is independent from the login streak below.
    this.section(s, 'PASSIVE REWARDS');
    const passive = el('div', 'grid3');
    const passiveDefs = [
      { kind: 'hour', icon: '⏱', label: 'HOURLY CACHE', title: 'Ichor Refill', copy: 'Free once every UTC hour.', clock: 'freeHourReset' },
      { kind: 'day', icon: '☀', label: 'DAILY CACHE', title: 'Gardenview Delivery', copy: 'Free once every UTC day.', clock: 'freeDayReset' },
      { kind: 'week', icon: '🌟', label: 'WEEKLY CACHE', title: 'Grand Supply Drop', copy: 'Free once every UTC week.', clock: 'freeWeekReset' }
    ];
    passiveDefs.forEach(def => {
      const reward = Daily.passiveReward(def.kind), ready = Daily.passiveAvailable(def.kind);
      const keys = Object.keys(reward).filter(k => RES[k]);
      const heroLine = reward.hero ? `<div class="mini" style="color:var(--gold)">◈ +${fmt(reward.shards)} ${HEROES[reward.hero].name} shards</div>` : '';
      const card = el('div', 'card');
      card.innerHTML = `<div class="row"><div class="grow"><div class="mini muted">${def.icon} ${def.label}</div><div class="b">${def.title}</div><div class="tiny muted">${def.copy}</div></div><span class="pill ${ready ? 'good' : ''}">${ready ? 'READY' : 'CLAIMED'}</span></div>
        <div class="mini muted" style="margin-top:8px">${keys.map(k => RES[k].icon + fmt(reward[k])).join('  ')}</div>${heroLine}
        <div class="tiny muted" style="margin-top:6px">${ready ? 'Available now' : 'Next in '}<b id="${def.clock}"></b></div>`;
      const button = el('button', 'btn ' + (ready ? 'go' : '') + ' wide', ready ? 'Claim Free Cache' : 'Recharging');
      button.disabled = !ready;
      button.style.marginTop = '8px';
      button.onclick = () => { if (Daily.claimPassive(def.kind)) this.render(); };
      card.appendChild(button); passive.appendChild(card);
    });
    s.appendChild(passive);

    // Daily deliveries
    this.section(s, 'DAILY DELIVERIES');
    const d = Daily.state();
    const dc = el('div', 'card');
    dc.innerHTML = `<div class="row"><div class="grow">
      <div class="b">Day ${Math.min(7, d.streak + (Daily.available() ? 1 : 0))} of 7</div>
      <div class="tiny muted">Streak resets if you miss a real UTC day.</div></div></div>`;
    const days = el('div', 'grid4');
    days.style.marginTop = '8px';
    DAILY_REWARDS.forEach((_, i) => {
      const r = Daily.deliveryReward(i);
      const got = d.streak > i && !Daily.available() ? true : d.streak > i;
      const c = el('div', 'pullcard');
      c.style.animation = 'none';
      const keys = Object.keys(r);
      c.innerHTML = `<div style="font-size:22px;height:34px;display:grid;place-items:center">${RES[keys[0]].icon}</div>
        <div class="mini b">Day ${i + 1}</div>
        <div class="mini muted">${keys.map(k => RES[k].icon + fmt(r[k])).join(' ')}</div>`;
      if (got) { c.style.opacity = .4; c.innerHTML += '<div class="mini b" style="color:var(--good)">✓</div>'; }
      if (i === d.streak && Daily.available()) c.classList.add('new');
      days.appendChild(c);
    });
    dc.appendChild(days);
    const claim = el('button', 'btn ' + (Daily.available() ? 'go' : '') + ' wide',
      Daily.available() ? 'Collect Today' : 'Collected');
    claim.style.marginTop = '8px';
    claim.disabled = !Daily.available();
    claim.onclick = () => { const r = Daily.claim(); if (r) this.render(); };
    dc.appendChild(claim);
    s.appendChild(dc);

    // Mode-agnostic wins let players make progress in the activity they enjoy.
    this.section(s, 'DAILY ORDERS');
    const os = Daily.orderState();
    const orders = Daily.orders();
    const oc = el('div', 'card');
    oc.innerHTML = `<div class="row"><div class="grow"><div class="b">${os.wins} battle win${os.wins === 1 ? '' : 's'} today</div>
      <div class="tiny muted">Win in any mode. Mastery ${Daily.mastery()} · rewards ×${Daily.rewardMultiplier().toFixed(1)}. Claiming does not reset your delivery streak.</div></div>
      <div class="pill">${os.orderClaimed.length} / ${orders.length}</div></div>`;
    orders.forEach((o, i) => {
      const claimed = os.orderClaimed.includes(i);
      const ready = os.wins >= o.need;
      const row = el('div', 'reward');
      row.style.marginTop = '7px';
      const rewardText = Object.keys(o.reward).map(k => RES[k].icon + fmt(o.reward[k])).join('  ');
      row.innerHTML = `<div class="grow"><div class="mini b">${claimed ? '✓ ' : ''}${o.label}</div>
        <div class="mini muted">${rewardText}</div></div>`;
      const b = el('button', 'btn tiny ' + (ready && !claimed ? 'go' : ''), claimed ? 'Claimed' : ready ? 'Claim' : os.wins + ' / ' + o.need);
      b.disabled = claimed || !ready;
      b.onclick = () => { if (Daily.claimOrder(i)) this.render(); };
      row.appendChild(b); oc.appendChild(row);
    });
    s.appendChild(oc);

    // Draw Gourdy's Parents Event Card
    this.section(s, "FADED MEMORIES · DRAW GOURDY'S PARENTS");
    const dpc = el('button', 'card tap wide scratch-preview');
    dpc.style.background = 'linear-gradient(135deg, rgba(58, 25, 84, 0.9), rgba(28, 17, 34, 0.95))';
    dpc.style.borderColor = 'rgba(192, 112, 237, 0.4)';
    const dpState = DrawParents.state();
    dpc.innerHTML = `<div class="scratch-preview-burst" style="background:#c070ed">🎨</div><div class="row">
      <img src="${Art.icon('MrsHolloway')}" alt="Mrs. Holloway" class="scratch-preview-hero">
      <img src="${Art.icon('MrHolloway')}" alt="Mr. Holloway" class="scratch-preview-hero">
      <div class="grow" style="text-align:left"><small>SPECIAL EVENT · 1 🎟 / STROKE</small><div class="b">Draw Gourdy's Parents</div>
      <div class="tiny muted">${Math.round(dpState.progress)}% sketched · +${fmt(DrawParents.masteryXpPerStroke())} Mastery XP per stroke · portrait bonus!</div></div>
      <div class="scratch-ticket-count" style="color:#ffd8a8">🎟 <b>${Save.res('ticket')}</b></div></div>`;
    dpc.onclick = () => this.openDrawParents();
    s.appendChild(dpc);

    // Scratch Tickets
    this.section(s, 'PRIZE PARADE');
    const sc = el('button', 'card tap wide scratch-preview');
    const heroes = Scratch.heroes();
    const scratch = Scratch.state();
    const panelsLeft = Scratch.CELLS - scratch.revealed.length;
    sc.innerHTML = `<div class="scratch-preview-burst">🎪</div><div class="row">
      ${heroes.map(h => `<img src="${Art.icon(h)}" alt="" class="scratch-preview-hero">`).join('')}
      <div class="grow" style="text-align:left"><small>ALWAYS OPEN · CARD #${Scratch.cardNumber()}</small><div class="b">${heroes.map(h => HEROES[h].name).join(' & ')}</div>
      <div class="tiny muted">${scratch.jackpot ? 'Jackpot claimed. Flip a fresh card anytime!' : panelsLeft + ' prize panels left. Find the grand prize!'} · Mastery ${scratch.rewardMastery} prizes ×${Scratch.rewardMultiplier().toFixed(2)}</div></div>
      <div class="scratch-ticket-count">🎟 <b>${Save.res('ticket')}</b></div></div>`;
    sc.onclick = () => this.openScratch();
    s.appendChild(sc);

    // Battle pass preview. The reward road has its own animation-heavy screen;
    // keeping this as a summary makes Daily fast and much easier to scan.
    this.section(s, 'BATTLE PASS');
    const p = Pass.level(), readyPass = Pass.claimable().length;
    const pc = el('button', 'card tap wide daily-pass-preview');
    const f = featured(currentWeek());
    pc.innerHTML = `<div class="row">
      ${f.pass ? `<img src="${Art.icon(f.pass)}" alt="" style="width:58px;height:58px;object-fit:contain">` : '<div style="font-size:34px">📜</div>'}
      <div class="grow" style="text-align:left"><div class="b">Level ${p.lv} / ${p.max}</div>
      <div class="tiny muted">${readyPass ? readyPass + ' reward' + (readyPass === 1 ? '' : 's') + ' ready to claim' : p.complete ? 'Season complete' : (p.into + ' / ' + p.need + ' XP to next level')}</div>
      </div><span class="btn ${readyPass ? 'gold' : ''}">View Track ›</span></div>`;
    const previewBar = el('div', 'daily-pass-bar');
    previewBar.innerHTML = `<i style="width:${Math.round(p.progress * 100)}%"></i>`;
    pc.appendChild(previewBar);
    pc.onclick = () => this.openPass('events');
    s.appendChild(pc);
    this.liveClocks([
      { selector: '#dailyReset', kind: 'day' },
      { selector: '#weeklyReset', kind: 'week' }
    ]);
    clearInterval(this._dailyFreeClock);
    const startedHour = Daily.hour(), startedDay = Daily.today(), startedWeek = currentWeek();
    const tickPassive = () => {
      if (Daily.hour() !== startedHour || Daily.today() !== startedDay || currentWeek() !== startedWeek) {
        clearInterval(this._dailyFreeClock); this._dailyFreeClock = null; this.render(); return;
      }
      const hour = $('#freeHourReset'), day = $('#freeDayReset'), week = $('#freeWeekReset');
      if (hour) hour.textContent = Daily.passiveAvailable('hour') ? '' : liveTime(Daily.passiveHourReset());
      if (day) day.textContent = Daily.passiveAvailable('day') ? '' : liveTime(untilDayReset());
      if (week) week.textContent = Daily.passiveAvailable('week') ? '' : liveTime(untilWeekReset());
    };
    tickPassive(); this._dailyFreeClock = setInterval(tickPassive, 1000);
  },

  openScratch() {
    const body = el('div');
    const st = Scratch.state();
    const heroes = Scratch.heroes();
    const info = el('div', 'scratch-modal-head');
    info.innerHTML = `<div class="scratch-modal-stars">✦ ✦ ✦</div><div class="scratch-modal-title">PRIZE PARADE</div>
      <div class="scratch-modal-feature">${heroes.map(h => `<img src="${Art.icon(h)}" alt="">`).join('')}<span>Grand prize: ${heroes.map(h => HEROES[h].name).join(' & ')} shards</span></div>
      <div class="scratch-modal-copy">One ticket flips one panel. Every card has a huge shard jackpot, premium supply prizes, and a Mastery ${st.rewardMastery} boost of ×${Scratch.rewardMultiplier().toFixed(2)}. It refreshes instantly when you find the jackpot.</div>
      <div class="scratch-modal-tapes">🎟 <b>${Save.res('ticket')}</b> tickets</div>`;
    body.appendChild(info);
    body.appendChild(el('div', 'spacer'));

    const grid = el('div', 'scr');
    const board = Scratch.board();
    const cardActions = el('div');
    const draw = () => {
      clear(grid);
      const ticketCount = $('.scratch-modal-tapes b', info);
      if (ticketCount) ticketCount.textContent = fmt(Save.res('ticket'));
      board.forEach((cell, i) => {
        const rev = st.revealed.includes(i);
        const c = el('div', 'scrcell' + (rev ? ' rev' : '') + (rev && cell.jackpot ? ' jack' : ''));
        if (!rev) c.innerHTML = '<span class="scratch-sticker">PICK!</span><b>?</b>';
        else if (cell.jackpot) c.innerHTML = `<div class="scratch-jackpot"><img src="${Art.icon(cell.hero)}" alt=""><b>+${cell.n}</b><small>SHARDS</small></div>`;
        else c.innerHTML = `<div style="text-align:center"><div>${RES[cell.res].icon}</div>
          <div class="mini b">+${fmt(cell.n)}</div></div>`;
        if (!rev && !st.jackpot) c.onclick = () => {
          const got = Scratch.scratchCell(i);
          if (!got) return;
          draw();
          UI.refreshBar(true);
          if (got.jackpot) {
            FX.confetti(window.innerWidth / 2, 260, 60);
            UI.toast('🎉 ' + HEROES[got.hero].name + ' +' + got.n + ' shards');
          }
        };
        grid.appendChild(c);
      });
      status.textContent = st.jackpot ? 'Jackpot claimed! Flip a fresh card whenever you are ready.'
        : (Scratch.CELLS - st.revealed.length) + ' prize panels left.';
      clear(cardActions);
      if (st.jackpot) {
        const fresh = el('button', 'btn go wide', '✨ Flip a Fresh Card');
        fresh.style.marginTop = '8px';
        fresh.onclick = () => { if (Scratch.newCard()) { UI.closeModal(); this.openScratch(); } };
        cardActions.appendChild(fresh);
      }
    };
    body.appendChild(grid);
    const status = el('div', 'mini muted center');
    status.style.marginTop = '8px';
    body.appendChild(status);
    body.appendChild(cardActions);
    const close = el('button', 'btn wide', 'Done');
    close.style.marginTop = '8px';
    close.onclick = () => { UI.closeModal(); this.render(); };
    body.appendChild(close);
    draw();
    UI.modal('🎪 Prize Parade', body, { sticky: true });
  }

});
