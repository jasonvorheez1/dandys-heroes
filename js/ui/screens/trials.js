/* screens/trials.js - compact division cards and trial setup/launch.
   The main screen stays focused: details and old-stage replay live behind
   each card's info button instead of filling the page with controls. */
'use strict';

Object.assign(Screens, {

  /* ============================================================ TRIALS */
  trials(s) {
    if (Save.data.mastery < MODE_UNLOCKS.trials.mastery) return this.beginnerTrials(s);
    const visuals = [
      { accent: '#ef6a72', deep: '#451c23', bg: 'maps/rainbow-rooms.png' },
      { accent: '#65a9dc', deep: '#162d47', bg: 'maps/warehouse.png' },
      { accent: '#d6bb3e', deep: '#423b16', bg: 'maps/greenhouse.png' },
      { accent: '#66ba76', deep: '#173a26', bg: 'maps/shelly-floor.png' },
      { accent: '#ba79c9', deep: '#3a2041', bg: 'maps/art-floor.png' },
      { accent: '#e4874e', deep: '#452619', bg: 'maps/vee-floor.png' }
    ];

    const root = el('div', 'trials-screen');
    root.innerHTML = `<header class="trials-head">
      <div class="trials-kicker">DIVISION BATTLES</div>
      <h1>TRIALS</h1>
      <div class="trials-sub">NEW DIVISIONS IN <b id="trialsReset">--</b></div>
    </header>`;

    const deck = el('div', 'trial-deck');
    const addTrialCard = (t, index) => {
      const st = Trials.state(t.id);
      const owned = Trials.eligible(t).sort((a, b) => Progress.power(b) - Progress.power(a));
      const possible = PLAYABLE_IDS.filter(id => trialAllows(t, id));
      const artId = owned[0] || possible[0] || Save.ownedIds()[0] || STARTERS[0];
      const artLocked = !Save.owns(artId);
      const cleared = Math.min(st.stage, Trials.STAGES);
      const complete = cleared >= Trials.STAGES;
      const canEnter = !t.tags.length ? Save.ownedIds().length > 0 : owned.length > 0;
      const v = visuals[index % visuals.length];
      const trialBg = t.apexBg ? ASSET + t.apexBg : Art.bg(v.bg);

      const card = el('article', 'trial-card' + (t.endgame ? ' trial-card-endgame' : ''));
      card.style.setProperty('--trial-accent', v.accent);
      card.style.setProperty('--trial-deep', v.deep);
      card.style.backgroundImage = `linear-gradient(180deg,rgba(8,11,13,.15),${v.deep}ee),url("${trialBg}")`;

      const dots = Array.from({ length: Trials.STAGES }, (_, i) => {
        const cls = i < cleared ? ' done' : (!complete && i === cleared ? ' next' : '');
        return `<i class="${cls.trim()}"></i>`;
      }).join('');
      card.innerHTML = `
        <div class="trial-card-top">
          <div class="trial-card-name">${t.name}<small>${t.endgame ? 'MASTERY ' + t.requiredMastery + '+' : 'WEEKLY DIVISION'}</small></div>
          <button class="trial-info" aria-label="${t.name} details" title="Details">i</button>
        </div>
        <div class="trial-art${artLocked ? ' locked' : ''}">
          <img src="${Art.hero(artId)}" alt="${artLocked ? '' : HEROES[artId].name}">
          ${artLocked ? '<span>???</span>' : ''}
        </div>
        <div class="trial-card-foot">
          <div class="trial-rule">${t.rule}</div>
          <div class="trial-count">${canEnter ? owned.length + ' READY' : 'NO ELIGIBLE HEROES'}</div>
          <div class="trial-progress" aria-label="${cleared} of ${Trials.STAGES} stages cleared">${dots}</div>
          <button class="trial-play${canEnter ? '' : ' need'}">${canEnter ? 'CHOOSE STAGE' : 'VIEW STAGES'}</button>
        </div>`;

      $('.trial-info', card).onclick = () => { Sound.play('ui_move'); this.trialInfo(t); };
      $('.trial-play', card).onclick = () => {
        Sound.play(canEnter ? 'ui_ok' : 'ui_err'); this.trialInfo(t);
      };
      deck.appendChild(card);
    };
    weeklyTrials().forEach((t, index) => addTrialCard(t, index));
    (typeof APEX_TRIALS !== 'undefined' ? APEX_TRIALS : [ENDGAME_TRIAL])
      .filter(t => Save.data.mastery >= t.requiredMastery)
      .sort((a, b) => a.requiredMastery - b.requiredMastery)
      .forEach((t, i) => addTrialCard(t, 6 + i));

    root.appendChild(deck);
    root.appendChild(el('div', 'trial-swipe', Save.data.mastery >= 600
      ? 'THREE RANDOM DIVISIONS EVERY WEEK · APEX 600 / 700 / 800'
      : 'THREE RANDOM DIVISIONS EVERY WEEK · APEX CHALLENGES AT MASTERY 600+'));
    s.appendChild(root);
    this.liveClocks([{ selector: '#trialsReset', kind: 'week' }]);
  },

  beginnerTrials(s) {
    const root = el('div', 'trials-screen trials-beginner');
    root.innerHTML = `<header class="trials-head">
      <div class="trials-kicker">BEGINNER ACCESS</div>
      <h1>TRAINING TRIALS</h1>
      <div class="trials-sub">WEEKLY DIVISIONS UNLOCK AT <b>MASTERY ${MODE_UNLOCKS.trials.mastery}</b></div>
    </header>`;
    const card = el('article', 'trial-grind-card');
    card.innerHTML = `<div class="trial-grind-icon">⚗</div>
      <small>REPEATABLE PRACTICE</small><h2>TRAINING TRIAL</h2>
      <p>Take on a manageable Twisted squad and build your account before the full weekly ladder opens.</p>
      <div class="trial-grind-rewards"><span>${RES.exp.icon} EXP Bottles</span><span>${RES.core.icon} Rarity Cores</span><span>🔧 Trinkets</span><span>🏅 Mastery XP</span></div>
      <div class="trial-grind-note">Any owned Hero may enter · no stage limit</div>`;
    const play = el('button', 'trial-grind-play', 'START TRAINING TRIAL ›');
    play.disabled = !Save.ownedIds().length;
    play.onclick = () => { Sound.play('ui_ok'); this.trialGrindSetup(); };
    card.appendChild(play);
    const raid = el('button', 'trial-grind-raid', `⚡ RAID TICKET · ${fmt(Save.res('raidTicket'))} HELD`);
    raid.disabled = !Save.ownedIds().length || !Save.res('raidTicket');
    raid.onclick = () => { Sound.play(raid.disabled ? 'ui_err' : 'ui_ok'); this.trialGrindRaidSetup(); };
    card.appendChild(raid);
    root.appendChild(card);
    root.appendChild(el('div', 'trial-swipe', 'CLEAR IT AGAIN FOR MORE REWARDS'));
    s.appendChild(root);
  },

  trialGrindSetup() {
    if (!Save.ownedIds().length) { UI.toast('Recruit a Hero first'); Sound.play('ui_err'); return; }
    this.openTeamEditor(() => true, team => this.trialGrindFight(team), 'Training Trial · Any Hero');
  },

  trialGrindFight(team) {
    const b = BattleScreen.launch({
      team: playerTeamSpecs(team),
      foes: Trials.grindEnemies(),
      meta: { title: 'Training Trial', floorLabel: 'Training Trial', bg: Art.bg('maps/warehouse.png'),
        skillStartEnergy: 65, skillTempo: 1.25 },
      rewards: () => Trials.grindRewards(),
      onDone: res => {
        if (res.win) {
          payoutBattle(team, Trials.grindRewards(), { mastery: 150, pass: 20 });
          const drops = Depths.trinketDrops(b, { bonus: .25 });
          if (!drops.length) UI.toast('Training cleared · try again for a Trinket drop');
        }
        this.render();
      }
    });
  },

  trialGrindRaidSetup() {
    if (!Save.ownedIds().length) { UI.toast('Recruit a Hero first'); Sound.play('ui_err'); return; }
    if (!Save.res('raidTicket')) { UI.toast('You need a Raid Ticket'); Sound.play('ui_err'); return; }
    this.openTeamEditor(() => true, team => this.trialGrindRaidFight(team), 'Training Trial · Raid Ticket');
  },

  trialGrindRaidFight(team) {
    this.openRaidTicketQuantity('Training Trial', amount =>
      this.runRaidTicket('Training Trial', 0, team, { id: 'grind', name: 'Training Trial', tags: [], hard: false }, amount));
  },

  /** Rules, eligible owned Heroes, and replay access without crowding the deck. */
  trialInfo(trial) {
    const st = Trials.state(trial.id);
    const owned = Trials.eligible(trial).sort((a, b) => Progress.power(b) - Progress.power(a));
    const teamPower = Progress.teamPower((Save.data.team || []).filter(Boolean));
    const body = el('div', 'trial-info-body');

    const summary = el('div', 'trial-info-summary');
    const tagRow = el('div', 'trial-info-tags');
    if (trial.tags.length) trial.tags.forEach(key => {
      const info = tagInfo(key); if (info) tagRow.appendChild(UI.tagChip(info));
    });
    else tagRow.appendChild(el('span', 'pill', '🌍 Any Hero'));
    if (trial.hard) tagRow.appendChild(el('span', 'pill', '🔥 Stronger enemies'));
    if (trial.endgame) tagRow.appendChild(el('span', 'pill', '☠ Mastery ' + trial.requiredMastery + '+'));
    summary.appendChild(tagRow);
    summary.appendChild(el('div', 'tiny muted', trial.rule));
    if (trial.endgame) summary.appendChild(el('div', 'tiny muted', 'Rare encounters: ⚙ machine cogs · 🧪 Delilah · 🗝 Riku, Sora & Kairi'));
    const masteryBonus = Math.round((Trials.rewardScale(trial, 0).mastery - 1) * 100);
    summary.appendChild(el('div', 'tiny muted', `Mastery reward bonus: +${masteryBonus}%`));
    const currentRecommended = Progress.recommendedPower(Trials.enemyLevel(trial, st.stage), { factor: trial.endgame ? 1.15 : 1 });
    const currentUnderRecommended = teamPower < currentRecommended;
    summary.appendChild(el('div', `stage-power-readout${currentUnderRecommended ? ' under' : ''}`, `<span><small>YOUR POWER</small><b>${fmt(teamPower)}</b></span><i>/</i><span><small>RECOMMENDED POWER</small><b>${fmt(currentRecommended)}</b></span><em>${currentUnderRecommended ? 'UNDER POWER' : 'READY'}</em>`));
    body.appendChild(summary);

    body.appendChild(el('div', 'trial-info-label', 'YOUR ELIGIBLE HEROES'));
    const heroes = el('div', 'trial-ready-heroes');
    if (owned.length) owned.forEach(id => {
      const img = el('img'); img.src = Art.icon(id); img.alt = HEROES[id].name; img.title = HEROES[id].name;
      heroes.appendChild(img);
    });
    else heroes.appendChild(el('div', 'tiny muted', 'Recruit a matching Hero to enter.'));
    body.appendChild(heroes);

    body.appendChild(el('div', 'trial-info-label', 'CHALLENGE ROUTE'));
    const stages = el('div', 'trial-stage-list');
    const stageNames = ['Arrival', 'Pressure', 'Crossroads', 'Break Point', 'Gauntlet', 'Overdrive', 'Last Stand', 'Finale'];
    const rewardKeys = trial.endgame ? ['diamond', 'core', 'manual'] : ['exp', 'core', 'diamond'];
    for (let i = 0; i < Trials.STAGES; i++) {
      const unlocked = true;
      const done = i < st.stage;
      const current = st.stage < Trials.STAGES && i === st.stage;
      const reward = Trials.rewards(trial, i);
      const recommendedPower = Progress.recommendedPower(Trials.enemyLevel(trial, i), { factor: trial.endgame ? 1.15 : 1 });
      const underRecommended = teamPower < recommendedPower;
      const background = trial.apexBg ? ASSET + trial.apexBg : Art.bg(BACKGROUNDS[(i + (trial.endgame ? 7 : 0)) % BACKGROUNDS.length]);
      const status = done ? 'MASTERED' : current ? 'NEXT' : 'OPEN';
      const b = el('button', 'trial-stage-row' + (done ? ' done' : '') + (current ? ' current' : ''));
      b.type = 'button';
      b.innerHTML = `<span class="trial-stage-thumb" style="background-image:linear-gradient(90deg,#10171855,#101718aa),url('${background}')"><b>${i + 1}</b><small>${status}</small></span>
        <span class="trial-stage-copy"><b>${stageNames[i]}</b><small>Difficulty ${Trials.enemyLevel(trial, i)} · ⚡ <em class="stage-power-label${underRecommended ? ' under' : ''}">${fmt(recommendedPower)} POWER</em></small><i>Mastery Reward · Stage Clear</i></span>
        <span class="trial-stage-rewards"><small>REWARDS</small>${rewardKeys.map(key => RES[key] ? `<i title="${RES[key].name}">${RES[key].icon}<b>${fmt(reward[key])}</b></i>` : '').join('')}</span>`;
      b.disabled = !unlocked;
      b.title = done ? 'Replay stage ' + (i + 1) : current ? 'Current stage' : 'Play stage ' + (i + 1);
      b.onclick = () => { UI.closeModal(); this.trialSetup(trial, i); };
      const stageActions = el('div', 'trial-stage-action-row');
      stageActions.appendChild(b);
      const raid = el('button', 'trial-stage-raid', `⚡ RAID <small>${fmt(Save.res('raidTicket'))}</small>`);
      raid.type = 'button'; raid.disabled = !Save.res('raidTicket');
      raid.title = raid.disabled ? 'You need a Raid Ticket' : 'Use a Raid Ticket on this stage';
      raid.onclick = e => { e.stopPropagation(); if (raid.disabled) return; UI.closeModal(); this.trialRaidSetup(trial, i); };
      stageActions.appendChild(raid);
      stages.appendChild(stageActions);
    }
    body.appendChild(stages);
    UI.modal(trial.icon + ' ' + trial.name, body);
  },

  trialSetup(trial, stage) {
    if (trial.requiredMastery && Save.data.mastery < trial.requiredMastery) {
      UI.toast(`Reach Mastery ${trial.requiredMastery} to enter this Trial`); Sound.play('ui_err'); return;
    }
    if (!Trials.eligible(trial).length && trial.tags.length) {
      UI.toast('You own no Heroes matching this Trial'); Sound.play('ui_err'); return;
    }
    if (!Save.ownedIds().length) { UI.toast('You own no Heroes'); Sound.play('ui_err'); return; }
    // Only Heroes carrying one of the Trial's required tags are selectable.
    this.openTeamEditor(id => trialAllows(trial, id), (team) => {
      this.trialFight(trial, stage, team);
    }, trial.name + ' · Stage ' + (stage + 1));
  },

  trialFight(trial, stage, team) {
    const serviceWeek = currentWeek();
    const b = BattleScreen.launch({
      team: playerTeamSpecs(team),
      foes: Trials.makeEnemies(trial, stage),
      music: trial.apexMusic || undefined,
      meta: { title: trial.name + ' · Stage ' + (stage + 1),
        bg: trial.apexBg ? ASSET + trial.apexBg : Art.bg(seeded('trial-bg-' + currentWeek() + '-' + trial.id).pick(BACKGROUNDS)),
        mods: stage >= 4 ? [pick(FLOOR_MODS.filter(m => !m.good)).id] : [],
        // Trials are the skill showcase mode: start with enough Energy to
        // demonstrate kits and keep the rotation moving between cooldowns.
        skillStartEnergy: trial.endgame ? 80 : 65,
        skillTempo: trial.endgame ? 1.38 : 1.25,
        postIntroCue: trial.endgame ? 'apex_trial_warning' : null },
      rewards: () => Trials.rewards(trial, stage),
      onReady: battle => {
        if (trial.apexDebuffs) Trials.applyApexDebuffs(battle, trial);
      },
      onDone: res => {
        if (res.win) {
          if (currentWeek() === serviceWeek) Trials.complete(trial, stage);
          else {
            Save.give(Trials.rewards(trial, stage));
            Pass.addXp(70);
            UI.toast('Weekly rotation changed. Rewards kept; expired stage progress was not carried over.');
          }
          payoutBattle(team, {}, { mastery: 120, pass: 0 });
          Trials.rareEventLoot(b, trial);
          Depths.trinketDrops(b);
        }
        this.render();
      }
    });
  },

  trialRaidSetup(trial, stage) {
    if (trial.requiredMastery && Save.data.mastery < trial.requiredMastery) {
      UI.toast(`Reach Mastery ${trial.requiredMastery} to enter this Trial`); Sound.play('ui_err'); return;
    }
    if (!Save.res('raidTicket')) { UI.toast('You need a Raid Ticket'); Sound.play('ui_err'); return; }
    if (!Save.ownedIds().length || (trial.tags.length && !Trials.eligible(trial).length)) {
      UI.toast('You own no Heroes matching this Trial'); Sound.play('ui_err'); return;
    }
    this.openTeamEditor(id => trialAllows(trial, id), team => this.trialRaidFight(trial, stage, team), trial.name + ' · Stage ' + (stage + 1) + ' · Raid Ticket');
  },

  trialRaidFight(trial, stage, team) {
    this.openRaidTicketQuantity(`${trial.name} · Stage ${stage + 1}`, amount =>
      this.runRaidTicket(trial.name, stage, team, trial, amount));
  },

  openRaidTicketQuantity(label, onConfirm) {
    const max = Math.max(1, Save.res('raidTicket'));
    const body = el('div', 'raid-ticket-quantity');
    body.innerHTML = `<p>How many Raid Tickets should ${label} use?</p><small>Each attempt still runs the real battle simulation. You currently have ${fmt(max)}.</small>`;
    const input = el('input');
    input.type = 'number'; input.min = '1'; input.max = String(max); input.value = '1'; input.inputMode = 'numeric';
    input.setAttribute('aria-label', 'Raid Ticket amount');
    const actions = el('div', 'raid-ticket-quantity-actions');
    const cancel = el('button', 'btn', 'Cancel');
    const confirm = el('button', 'btn go', `Run ${fmt(1)} Raid Ticket`);
    const sync = () => {
      const value = clamp(Math.floor(Number(input.value) || 1), 1, max);
      input.value = String(value); confirm.textContent = `Run ${fmt(value)} Raid Ticket${value === 1 ? '' : 's'}`;
      return value;
    };
    input.oninput = sync;
    cancel.onclick = () => UI.closeModal();
    confirm.onclick = () => { const value = sync(); UI.closeModal(); onConfirm(value); };
    actions.append(cancel, confirm); body.append(input, actions);
    UI.modal('Raid Ticket Amount', body, { className: 'raid-ticket-quantity-modal' });
    input.focus(); input.select();
  },

  runRaidTicket(label, stage, team, trial, amount) {
    if (this._raidTicketRunning) return;
    this._raidTicketRunning = true;
    const body = el('div', 'raid-ticket-running');
    body.innerHTML = `<div class="raid-ticket-spinner">⚡</div><b>RUNNING RAID SIM</b><p>${label} · Battle rules active · 10,000× off screen</p>`;
    UI.modal('Raid Ticket', body, { dismissOnBackdrop: false });
    setTimeout(async () => {
      let result;
      let grindSpent = false;
      const ticketBalanceBefore = Save.res('raidTicket');
      try {
        const runOne = () => trial.id === 'grind'
          ? (async () => {
            const sim = new Battle({ offscreen: true });
            if (!Save.spend({ raidTicket: 1 })) return { win: false, why: 'No Raid Tickets', consumed: false };
            grindSpent = true;
            const battle = await sim.simulateOffscreenAsync(playerTeamSpecs(team), Trials.grindEnemies(), { title: 'Training Trial · Raid Ticket', floorLabel: 'Training Trial · Raid Sim', bg: Art.bg('maps/warehouse.png'), skillStartEnergy: 65, skillTempo: 1.25 }, {});
            if (battle && battle.win) {
              payoutBattle(team, Trials.grindRewards(), { mastery: 150, pass: 20 });
              const drops = Depths.trinketDrops(sim, { bonus: .25 });
              if (!drops.length) UI.toast('Training Raid cleared · no Trinket drop this time');
            }
            return Object.assign({}, battle, { consumed: true, speed: RaidTicket.SPEED });
          })()
          : RaidTicket.runTrial(trial, stage, team);
        result = await RaidTicket.runBatch(runOne, amount || 1);
      } catch (error) {
        console.error('Raid Ticket failed before resolution', error);
        if (grindSpent && typeof RaidTicket.refund === 'function') RaidTicket.refund();
        if (Save.res('raidTicket') < ticketBalanceBefore && typeof RaidTicket.refund === 'function') RaidTicket.refund();
        result = { win: false, why: 'The raid simulation could not be completed. Your Raid Ticket was returned.', consumed: false, refunded: true };
      } finally {
        this._raidTicketRunning = false;
      }
      UI.closeModal();
      this.render();
      this.showRaidTicketResult(label, result, trial, stage);
    }, 40);
  },

  showRaidTicketResult(label, result, trial, stage, rewardOverride) {
    if (result && result.batch) return this.showRaidTicketBatchResult(label, result, trial, stage, rewardOverride);
    const body = el('div', 'raid-ticket-result');
    const rewards = result && result.win
      ? (rewardOverride || (trial.id === 'grind' ? Trials.grindRewards() : Trials.rewards(trial, stage))) : {};
    const rewardLines = Object.keys(rewards).filter(k => rewards[k] && RES[k]).map(k => `<span>${RES[k].icon} <b>+${fmt(rewards[k])}</b> ${RES[k].name}</span>`).join('');
    const shardLines = result && result.win
      ? Object.entries(result.shardDrops || {}).map(([id, amount]) => `<span>◈ <b>+${fmt(amount)}</b> ${HEROES[id].name} shards</span>`).join('')
      : '';
    const campaignLines = result && result.win
      ? (result.campaignAdvanced ? '<span>🤝 <b>Chapter cleared</b> Friendship Campaign progress</span>' : '')
        + (result.badgeEarned ? '<span>🤝 <b>Friendship Badge earned</b></span>' : '')
      : '';
    const eventLine = result && result.win && result.tokenReward
      ? `<span>${Raid.currencyIcon(trial)} <b>+${fmt(result.tokenReward)}</b> ${trial.isQOM ? 'Backstage Passes' : trial.isPhantasia ? 'Wish Coins' : trial.isUnknownWorld ? 'Gears' : 'Event Tokens'}</span>`
      : '';
    body.innerHTML = result && result.win
      ? `<div class="raid-ticket-result-icon win">✓</div><h3>RAID CLEARED</h3><p>${label} resolved successfully at ${fmt(RaidTicket.SPEED)}× speed.</p><div class="raid-ticket-rewards">${campaignLines}${eventLine}${shardLines}${rewardLines}</div>`
      : `<div class="raid-ticket-result-icon loss">×</div><h3>RAID FAILED</h3><p>${label} followed the real battle sim, but this team could not clear it. No rewards were paid.</p><div class="raid-ticket-failure">${result && result.why ? result.why : 'Team defeated or timed out'}${result && result.consumed ? ' · Raid Ticket spent' : ''}</div>`;
    UI.modal('Raid Ticket Result', body);
  },

  showRaidTicketBatchResult(label, result, trial, stage, rewardOverride) {
    const baseRewards = rewardOverride || (trial.id === 'grind' ? Trials.grindRewards() : Trials.rewards(trial, stage));
    const rewards = Object.keys(result.rewards || {}).length
      ? result.rewards
      : Object.fromEntries(Object.entries(baseRewards).map(([key, value]) => [key, value * (result.wins || 0)]));
    const rewardLines = Object.keys(rewards).filter(k => rewards[k] && RES[k])
      .map(k => `<span>${RES[k].icon} <b>+${fmt(rewards[k])}</b> ${RES[k].name}</span>`).join('');
    const shardLines = Object.entries(result.shardDrops || {}).map(([id, amount]) =>
      HEROES[id] ? `<span>◈ <b>+${fmt(amount)}</b> ${HEROES[id].name} shards</span>` : '').join('');
    const eventLine = result.tokenReward
      ? `<span>${Raid.currencyIcon(trial)} <b>+${fmt(result.tokenReward)}</b> ${trial.isQOM ? 'Backstage Passes' : trial.isPhantasia ? 'Wish Coins' : trial.isUnknownWorld ? 'Gears' : 'Event Tokens'}</span>` : '';
    const technical = result.technical ? `<span class="raid-ticket-batch-warning">⚠ ${result.technical} technical run returned</span>` : '';
    const body = el('div', 'raid-ticket-result');
    body.innerHTML = `<div class="raid-ticket-result-icon ${result.wins ? 'win' : 'loss'}">${result.wins ? '✓' : '×'}</div>
      <h3>RAID BATCH COMPLETE</h3><p>${label} resolved ${fmt(result.completed)} of ${fmt(result.requested)} selected attempt${result.requested === 1 ? '' : 's'}.</p>
      <div class="raid-ticket-batch-stats"><span>✓ <b>${fmt(result.wins)}</b> cleared</span><span>× <b>${fmt(result.losses)}</b> failed</span><span>⚡ <b>${fmt(result.consumedCount || 0)}</b> tapes spent</span></div>
      <div class="raid-ticket-rewards">${technical}${eventLine}${shardLines}${rewardLines}</div>`;
    UI.modal('Raid Ticket Results', body);
  }

});
