/* raid-ticket.js - one shared front end for every Raid Ticket batch:
   amount picker, live progress with a Stop button, and a single result
   panel. The engine (RaidTicket in meta/modes.js) owns spending and refunds. */
'use strict';

Object.assign(Screens, {
  raidTicketPrefs() {
    const opt = Save.data.opt || (Save.data.opt = {});
    if (typeof opt.raidStopOnLoss !== 'boolean') opt.raidStopOnLoss = true;
    opt.raidAmount = clamp(Math.floor(Number(opt.raidAmount) || 1), 1, 999);
    return opt;
  },

  /* onConfirm(amount, { stopOnLoss }) */
  openRaidTicketQuantity(label, onConfirm) {
    const prefs = this.raidTicketPrefs();
    const held = Save.res('raidTicket');
    if (!held) { UI.toast('You need a Raid Ticket'); Sound.play('ui_err'); return; }
    const body = el('div', 'raid-ticket-quantity');
    body.innerHTML = `<p>${label}</p>
      <div class="rtq-held">⚡ <b>${fmt(held)}</b> Raid Ticket${held === 1 ? '' : 's'} held · ${RaidEconomy.remaining()} more can be earned today</div>
      <div class="rtq-stepper"><button type="button" class="rtq-step" data-d="-1" aria-label="Fewer">−</button>
        <input type="number" min="1" max="${held}" inputmode="numeric" aria-label="Raid Ticket amount">
        <button type="button" class="rtq-step" data-d="1" aria-label="More">+</button></div>
      <div class="rtq-presets"></div>
      <label class="rtq-check"><input type="checkbox"><span>Stop at the first defeat</span></label>
      <small class="rtq-note"></small>`;
    const input = $('input[type=number]', body), check = $('input[type=checkbox]', body);
    const note = $('.rtq-note', body);
    check.checked = prefs.raidStopOnLoss;
    const actions = el('div', 'raid-ticket-quantity-actions');
    const cancel = el('button', 'btn', 'Cancel');
    const confirm = el('button', 'btn go');
    const sync = value => {
      const v = clamp(Math.floor(Number(value) || 1), 1, held);
      input.value = String(v);
      confirm.textContent = `Run ${fmt(v)} Raid Ticket${v === 1 ? '' : 's'}`;
      note.textContent = check.checked
        ? `Every attempt is a real battle sim. Stops on the first defeat; ${fmt(held - v)} left if all run.`
        : `Every attempt is a real battle sim. Stops after ${RaidTicket.LOSS_STREAK} defeats in a row; ${fmt(held - v)} left if all run.`;
      return v;
    };
    [1, 5, 10].filter(n => n < held).concat([held]).forEach(n => {
      const b = el('button', 'rtq-preset', n === held ? `MAX ${fmt(n)}` : String(n));
      b.type = 'button'; b.onclick = () => sync(n);
      $('.rtq-presets', body).appendChild(b);
    });
    body.querySelectorAll('.rtq-step').forEach(b => { b.onclick = () => sync(Number(input.value) + Number(b.dataset.d)); });
    input.oninput = () => { if (input.value !== '') sync(input.value); };
    input.onblur = () => sync(input.value);
    check.onchange = () => sync(input.value);
    cancel.onclick = () => UI.closeModal();
    confirm.onclick = () => {
      const amount = sync(input.value);
      prefs.raidAmount = amount; prefs.raidStopOnLoss = check.checked; Save.write();
      UI.closeModal();
      onConfirm(amount, { stopOnLoss: check.checked });
    };
    actions.append(cancel, confirm); body.appendChild(actions);
    sync(Math.min(prefs.raidAmount, held));
    UI.modal('Raid Ticket', body, { className: 'raid-ticket-quantity-modal' });
    input.focus(); input.select();
  },

  /* The one place a batch is started. cfg:
       title, label, runOne(i) -> engine result, amount, opts, ctx (result view),
       again(amount, opts) restarts the same run from the result panel. */
  startRaidTicketRun(cfg) {
    if (this._raidTicketRunning) return;
    this._raidTicketRunning = true;
    const amount = clamp(Math.floor(Number(cfg.amount) || 1), 1, 999);
    const control = { stop: false };
    const body = el('div', 'raid-ticket-running');
    body.innerHTML = `<div class="raid-ticket-spinner">⚡</div><b>RUNNING RAID SIM</b><p>${cfg.label} · battle rules active · ${fmt(RaidTicket.SPEED)}× off screen</p>
      <div class="rtr-bar"><i></i></div><div class="rtr-count">Attempt 1 of ${fmt(amount)}</div>`;
    const stop = el('button', 'btn rtr-stop', 'Stop after this run');
    stop.type = 'button';
    stop.hidden = amount < 2;
    stop.onclick = () => { control.stop = true; stop.disabled = true; stop.textContent = 'Stopping…'; };
    body.appendChild(stop);
    UI.modal(cfg.title || 'Raid Ticket', body, { dismissOnBackdrop: false });
    const fill = $('.rtr-bar i', body), count = $('.rtr-count', body);
    const progress = p => {
      fill.style.width = (p.done / p.requested * 100) + '%';
      count.textContent = p.done < p.requested
        ? `Attempt ${fmt(p.done + 1)} of ${fmt(p.requested)} · ${fmt(p.wins)} cleared · ${fmt(p.losses)} failed`
        : `${fmt(p.wins)} cleared · ${fmt(p.losses)} failed`;
    };
    setTimeout(async () => {
      let result;
      try {
        result = await RaidTicket.runBatch(cfg.runOne, amount, Object.assign({}, cfg.opts, { control, onProgress: progress }));
      } catch (error) {
        // runBatch refunds leaked tickets itself; this is only a last-resort net.
        console.error('Raid Ticket batch failed', error);
        result = { batch: true, requested: amount, completed: 0, wins: 0, losses: 0, technical: 1, returned: 0,
          results: [], outcomes: [], rewards: {}, shardDrops: {}, tokenReward: 0, win: false, consumed: false,
          blocked: 'The raid simulation could not be completed.' };
      } finally {
        this._raidTicketRunning = false;
      }
      UI.closeModal();
      UI.refreshBar(true);
      this.render();
      if (result.badgeEarned && cfg.ctx && cfg.ctx.badgeName) UI.toast('🤝 Friendship Badge earned: ' + cfg.ctx.badgeName);
      this.showRaidTicketResult(cfg.label, result, Object.assign({}, cfg.ctx, {
        again: cfg.again ? () => cfg.again(Math.min(amount, Save.res('raidTicket')), cfg.opts) : null
      }));
    }, 40);
  },

  raidTicketFight(ev, stage, team, amount, opts) {
    const label = `${ev.title} · Stage ${stage + 1}`;
    this.startRaidTicketRun({
      title: 'Event Raid Ticket', label, amount, opts,
      runOne: () => RaidTicket.runEvent(ev, stage, team),
      ctx: { currencyIcon: Raid.currencyIcon(ev), currencyName: ev.isQOM ? 'Backstage Passes' : ev.isPhantasia ? 'Wish Coins' : ev.isUnknownWorld ? 'Gears' : 'Event Tokens' },
      again: (n, o) => this.raidTicketFight(ev, stage, team, n, o)
    });
  },

  runRaidTicket(label, stage, team, trial, amount, opts) {
    this.startRaidTicketRun({
      title: 'Raid Ticket', label: `${label}${trial.id === 'grind' ? '' : ' · Stage ' + (stage + 1)}`, amount, opts,
      runOne: () => trial.id === 'grind' ? RaidTicket.runGrind(team) : RaidTicket.runTrial(trial, stage, team),
      ctx: {},
      again: (n, o) => this.runRaidTicket(label, stage, team, trial, n, o)
    });
  },

  campaignRaidTicketFight(c, stageIdx, team, amount, opts) {
    const label = `${c.title} · Chapter ${stageIdx + 1}`;
    this.startRaidTicketRun({
      title: 'Friendship Raid Ticket', label, amount, opts,
      runOne: () => RaidTicket.runCampaign(c, stageIdx, team),
      ctx: { badgeName: c.badge && BADGES[c.badge] ? BADGES[c.badge].name : '', friendship: true },
      again: (n, o) => this.campaignRaidTicketFight(c, stageIdx, team, n, o)
    });
  },

  showRaidTicketResult(label, result, ctx) {
    ctx = ctx || {};
    const r = result || {};
    const runs = r.completed || 0, wins = r.wins || 0, losses = r.losses || 0;
    const left = Save.res('raidTicket');
    // Nominal raidTicket rewards are converted by RaidEconomy; show what was really earned.
    const rewardLines = Object.keys(r.rewards || {}).filter(k => r.rewards[k] && RES[k] && k !== 'raidTicket')
      .map(k => `<span>${RES[k].icon} <b>+${fmt(r.rewards[k])}</b> ${RES[k].name}</span>`).join('');
    const shardLines = Object.entries(r.shardDrops || {}).map(([id, n]) =>
      HEROES[id] ? `<span>◈ <b>+${fmt(n)}</b> ${HEROES[id].name} shards</span>` : '').join('');
    const tokenLine = r.tokenReward && ctx.currencyName
      ? `<span>${ctx.currencyIcon || ''} <b>+${fmt(r.tokenReward)}</b> ${ctx.currencyName}</span>` : '';
    const trinkets = (r.results || []).reduce((n, x) => n + (x.trinkets || 0), 0);
    const trinketLine = trinkets ? `<span>🔧 <b>+${fmt(trinkets)}</b> Trinket${trinkets === 1 ? '' : 's'}</span>` : '';
<<<<<<< HEAD
    const modLines = Mods.rewardRows(r.modHaul).map(row =>
      `<span>${row.icon} <b>+${fmt(row.amount)}</b> ${row.name}${row.mod && row.amount !== 1 ? 's' : ''}</span>`).join('');
=======
>>>>>>> ccb31b9f96fec6e5b5e1509b31b66f6b3cb024e0
    const campaignLines = ctx.friendship
      ? (r.campaignAdvanced ? '<span>🤝 <b>Chapter cleared</b> Friendship Campaign progress</span>' : '')
        + (r.badgeEarned ? '<span>🤝 <b>Friendship Badge earned</b></span>' : '') : '';
    const stopNote = {
      defeat: 'Stopped at the first defeat to save your remaining tickets.',
      streak: `Stopped after ${RaidTicket.LOSS_STREAK} defeats in a row to save your remaining tickets.`,
      cancelled: 'Stopped early on request.'
    }[r.stopped] || '';
    const state = !runs ? 'none' : wins === runs ? 'win' : wins ? 'part' : 'loss';
    const head = { none: 'NO RAID RUN', win: runs > 1 ? 'ALL CLEARED' : 'RAID CLEARED', part: 'PARTIAL CLEAR', loss: 'RAID FAILED' }[state];
    const sub = !runs
      ? (r.blocked || r.why || 'Nothing was run.')
      : `${label} · ${fmt(runs)} attempt${runs === 1 ? '' : 's'} at ${fmt(RaidTicket.SPEED)}× speed.`;
    const pips = (r.outcomes || []).length > 1
      ? `<div class="rt-pips">${r.outcomes.slice(0, 60).map(w => `<i class="${w ? 'w' : 'l'}"></i>`).join('')}</div>` : '';
    const ticketLine = r.ticketsEarned ? `<span>⚡ <b>+${fmt(r.ticketsEarned)}</b> Raid Ticket${r.ticketsEarned === 1 ? '' : 's'} earned</span>` : '';
<<<<<<< HEAD
    const loot = ticketLine + tokenLine + shardLines + rewardLines + trinketLine + modLines + campaignLines;
=======
    const loot = ticketLine + tokenLine + shardLines + rewardLines + trinketLine + campaignLines;
>>>>>>> ccb31b9f96fec6e5b5e1509b31b66f6b3cb024e0
    const body = el('div', 'raid-ticket-result');
    body.innerHTML = `<div class="raid-ticket-result-icon ${state === 'win' ? 'win' : state === 'part' ? 'part' : 'loss'}">${state === 'win' ? '✓' : state === 'part' ? '½' : '×'}</div>
      <h3>${head}</h3><p>${sub}</p>${pips}
      <div class="raid-ticket-batch-stats">
        <span>✓ <b>${fmt(wins)}</b> cleared</span><span>× <b>${fmt(losses)}</b> failed</span>
        <span>⚡ <b>${fmt(r.consumedCount || 0)}</b> spent</span>${r.returned ? `<span>↩ <b>${fmt(r.returned)}</b> returned</span>` : ''}
        <span>🎟 <b>${fmt(left)}</b> left</span></div>
      ${stopNote ? `<div class="raid-ticket-batch-warning">${stopNote}</div>` : ''}
      ${r.technical ? `<div class="raid-ticket-batch-warning">⚠ A technical error stopped the run; the affected ticket was returned.</div>` : ''}
      ${runs && !wins ? '<div class="raid-ticket-failure">No rewards were paid. Try a stronger team before spending more tickets.</div>' : ''}
      ${loot ? `<div class="raid-ticket-rewards">${loot}</div>` : ''}`;
    const row = el('div', 'raid-ticket-quantity-actions rt-result-actions');
    const close = el('button', 'btn', 'Close'); close.onclick = () => UI.closeModal();
    row.appendChild(close);
    if (ctx.again && left > 0 && runs) {
      const again = el('button', 'btn go', `Run again · ${fmt(Math.min(left, r.requested || 1))}`);
      again.onclick = () => { UI.closeModal(); ctx.again(); };
      row.appendChild(again);
    }
    body.appendChild(row);
    UI.modal('Raid Ticket Results', body);
  }
});
