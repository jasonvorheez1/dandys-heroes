/* Consolidated scripts, in original load order. */
'use strict';

/* ===== js/ff7-shadow-square.js ===== */
/* Shadow Square: Mastery 400 Battle Square challenge. The regular Square and
   its saved run are left intact; this tier has its own bank and round state. */
'use strict';

const FF7ShadowSquare = {
  rounds: 8,
  penalties: [
    { id: 'frail', icon: '🩹', name: 'Shattered Vitality', desc: 'Max HP −35%; a second stack makes it −55%.', mult: 1.25, max: 2 },
    { id: 'rust', icon: '⚔', name: 'Blunted Edge', desc: 'Attack and Magic −30%; a second stack makes it −45%.', mult: 1.25, max: 2 },
    { id: 'slow', icon: '⛓', name: 'Lead Chains', desc: 'Attack and Move Speed −30%; a second stack makes it −45%.', mult: 1.22, max: 2 },
    { id: 'armor', icon: '💔', name: 'Broken Guard', desc: 'Defense and Magic Defense −40%; a second stack makes it −60%.', mult: 1.25, max: 2 },
    { id: 'seal', icon: '🔒', name: 'Sealed Materia', desc: 'Skill Haste −40%; a second stack makes it −60%.', mult: 1.32, max: 2 },
    { id: 'wound', icon: '☠', name: 'Mako Wounds', desc: 'Healing received −65%; a second stack makes it −90%.', mult: 1.32, max: 2 },
    { id: 'drain', icon: '◆', name: 'Energy Leak', desc: 'Lose 10 Energy every 2.5s; a second stack raises it to 16.', mult: 1.3, max: 2 },
    { id: 'tough', icon: '🛡', name: 'Iron Audience', desc: 'Enemies gain 45% Max HP; a second stack makes it 70%.', mult: 1.27, max: 2 },
    { id: 'fury', icon: '🔥', name: 'Bloodthirst', desc: 'Enemies gain 30% Attack and Magic; a second stack makes it 50%.', mult: 1.32, max: 2 },
    { id: 'crowd', icon: '👥', name: 'Overflow', desc: 'One extra enemy joins; a second stack adds another.', mult: 1.35, max: 2 }
  ],
  lineups: [
    [['FF7Bandit', 2], ['Vee', 1, 'elite']],
    [['FF7Joker', 2], ['FF7Cactuar', 1], ['Tifa', 1, 'elite']],
    [['FF7Beachplug', 2], ['FF7DeathClaw', 1], ['Cloud', 1, 'elite']],
    [['FF7Grangalan', 2], ['Dandy', 1, 'boss']],
    [['FF7Bullmoter', 2], ['Barret', 1, 'elite'], ['Gigi', 1, 'elite']],
    [['FF7DeathClaw', 1], ['FF7Joker', 2], ['Aerith', 1, 'elite'], ['CaitSith', 1, 'elite']],
    [['FF7Bullmoter', 2], ['Cloud', 1, 'elite'], ['Tifa', 1, 'elite']],
    [['FF7DeathClaw', 1], ['Dandy', 1, 'elite'], ['Sephiroth', 1, 'boss']]
  ],
  darkIds: new Set(['Vee', 'Tifa', 'Cloud', 'Dandy', 'Barret', 'Gigi', 'Aerith', 'CaitSith', 'Sephiroth']),
  count(ids) {
    const counts = {};
    (ids || []).forEach(id => { counts[id] = (counts[id] || 0) + 1; });
    return counts;
  },
  label(id) { return this.penalties.find(p => p.id === id); },
  activeHtml(ids) {
    const counts = this.count(ids);
    const rows = this.penalties.filter(p => counts[p.id]);
    return rows.length ? rows.map(p => `<span title="${p.desc}">${p.icon} ${p.name} <b>×${counts[p.id]}</b></span>`).join('')
      : '<small>No penalties carried over yet.</small>';
  }
};

EVENT_MODIFIERS.push({
  id: 'ff7_sq_shadow', kind: 'debuff', icon: '☾', name: 'Shadow Slots',
  desc: 'Two severe slot penalties are added each round. Previous rolls remain active.',
  apply(B) {
    const c = FF7ShadowSquare.count(B.meta.squarePenalties);
    const value = (id, first, second) => c[id] ? first + (c[id] > 1 ? second : 0) : 0;
    B.playerTeam().forEach(u => {
      u.flat.hpP_sqShadow = -value('frail', .35, .20);
      u.flat.atkP_sqShadow = -value('rust', .30, .15);
      u.flat.magP_sqShadow = -value('rust', .30, .15);
      u.flat.aspdP_sqShadow = -value('slow', .30, .15);
      u.flat.msP_sqShadow = -value('slow', .30, .15);
      u.flat.defP_sqShadow = -value('armor', .40, .20);
      u.flat.mdefP_sqShadow = -value('armor', .40, .20);
      u.flat.cdr_sqShadow = -value('seal', .40, .20);
      u.flat.healRecv_sqShadow = -value('wound', .65, .25);
      u.dirty = true;
      if (c.drain) B.every(u, 2.5, () => { if (u.alive) B.energy(u, -(c.drain > 1 ? 16 : 10)); });
    });
    B.foeTeam().forEach(u => {
      u.flat.hpP_sqShadow = value('tough', .45, .25);
      u.flat.atkP_sqShadow = value('fury', .30, .20);
      u.flat.magP_sqShadow = value('fury', .30, .20);
      u.dirty = true;
      if (!/^Dark /.test(u.name)) return;
      let hits = 0;
      B.on(u, 'dealDamage', ev => {
        if (!ev || !ev.basic || !ev.target || !ev.target.alive || ++hits % 3) return;
        B.energy(ev.target, -12);
        B.fxFloatIcon(ev.target.x, ev.target.y - 100, 'SHADOW DRAIN', '#b59aff');
      });
      B.every(u, 12, () => { if (u.alive) B.shield(u, u, u.max.hp * .1, 5); });
    });
  }
});

Object.assign(FF7Event, {
  shadowUnlocked() { return Number(Save.data.mastery) >= 400; },
  shadowState() {
    const q = this.square();
    if (!q.shadow) q.shadow = { runs: 0, best: 0, gil: 0, run: null };
    return q.shadow;
  },
  shadowLevel(round) {
    const base = Math.max(420, this.squareLevel() * 1.12, Math.min(800, Number(Save.data.mastery) || 400) * 1.04);
    return Math.round(base * (.93 + round * .095));
  },
  shadowTeam(ids, hp) {
    const level = Math.max(400, this.squareLevel(), Math.min(800, Number(Save.data.mastery) || 400));
    return ids.slice(0, 5).filter(id => !hp || hp[id] == null || hp[id] > 0)
      .map(id => {
        const spec = this.spec(id, level);
        return hp && hp[id] != null ? Object.assign({}, spec, { carryHp: Math.min(1, hp[id] + .12) }) : spec;
      });
  },
  shadowRoll(history, exclude = []) {
    const counts = FF7ShadowSquare.count(history), picked = [];
    for (let i = 0; i < 2; i++) {
      let pool = FF7ShadowSquare.penalties.filter(p => (counts[p.id] || 0) < p.max && !picked.includes(p.id) && !exclude.includes(p.id));
      if (!pool.length) pool = FF7ShadowSquare.penalties.filter(p => (counts[p.id] || 0) < p.max && !picked.includes(p.id));
      const item = pool[Math.floor(Math.random() * pool.length)];
      if (item) picked.push(item.id);
    }
    return picked;
  },
  shadowPay(round, active) {
    const pair = active.slice(-2);
    const reel = pair.reduce((n, id) => n * (FF7ShadowSquare.label(id)?.mult || 1), 1);
    return Math.round((110 + this.shadowLevel(round) * 1.2) * (1 + round * .5) * 2.2 * (1 + active.length * .055) * reel);
  },
  shadowFoes(round, active) {
    const level = this.shadowLevel(round), foes = [];
    const entries = FF7ShadowSquare.lineups[round] || FF7ShadowSquare.lineups[0];
    const overflow = FF7ShadowSquare.count(active).crowd || 0;
    const add = (id, kind) => {
      const dark = FF7ShadowSquare.darkIds.has(id), boss = kind === 'boss', elite = kind === 'elite';
      const mult = ff7Mult(boss ? 'boss' : elite ? 'elite' : 'foe', true, round, null);
      const factor = dark ? .82 : 1.15;
      foes.push({
        id, level, name: dark ? 'Dark ' + (FF7_NAMES[id] || HEROES[id].name) : undefined,
        kind: boss ? 'boss' : undefined, elite, rarity: dark ? 6 : 5,
        rarityPlus: dark ? Math.min(30, 14 + round * 2) : 13 + round,
        stars: 5, skillLv: level, twisted: dark && !FF7_HERO_IDS.includes(id),
        encounterOnly: true,
        artSrc: dark && !FF7_HERO_IDS.includes(id) ? Art.twisted(id) : Art.hero(id, null),
        formationLine: dark ? (boss ? 1 : foes.length % 2) : foes.length % 2,
        mult: { hp: mult.hp * factor, atk: mult.atk * (dark ? .82 : 1.15),
          mag: mult.mag * (dark ? .82 : 1.15), def: mult.def * 1.15, mdef: mult.mdef * 1.15 }
      });
    };
    entries.forEach(([id, count, kind]) => { for (let i = 0; i < count; i++) add(id, kind); });
    for (let i = 0; i < overflow; i++) add(round >= 4 ? 'FF7Bullmoter' : 'FF7Bandit');
    return Raid.equipWave(foes, FF7_EVENT.id + ':shadow', round + 1, level);
  },
  shadowMeta(round, active) {
    return {
      title: `Shadow Square · Round ${round + 1}/${FF7ShadowSquare.rounds}`,
      floorLabel: 'FFVII · Shadow Square', roomIdx: round + 1, roomTotal: FF7ShadowSquare.rounds,
      bg: ASSET + 'assets/ff7/bg/battle.png', mods: ['ff7_sq_shadow'], squarePenalties: active.slice(),
      ff7: true, ff7SquareNightmare: true, timeLimit: round === 7 ? 225 : 170,
      enemySkillStartEnergy: 55 + round * 5, enemySkillTempo: 1.42 + round * .065,
      enemySkillCdr: .16 + round * .015,
      survivedLabel: `Shadow Round ${round + 1}`,
      encounteredLabel: round === 7 ? 'Dark Sephiroth!' : null
    };
  },
  shadowCashOut(run, battles, lost, rounds) {
    const q = this.shadowState(), state = this.state();
    const gil = lost ? Math.floor(run.banked * .25) : run.banked;
    const drops = this.shardDrops(battles || [], 'hard');
    state.gil += gil; this.grant(drops);
    q.runs++; q.best = Math.max(q.best, rounds || 0); q.gil += gil; q.run = null;
    Save.write();
    return { gil, drops, rounds };
  }
});

// Mark shadow opponents after the normal sprite has been built. Their core
// hero IDs remain intact, so they keep their authored skills and AI.
const ff7ShadowBuildUnit = Battle.prototype.buildUnitEl;
Battle.prototype.buildUnitEl = function (unit) {
  const result = ff7ShadowBuildUnit.call(this, unit);
  if (this.meta && this.meta.ff7SquareNightmare && /^Dark /.test(unit.name) && unit.el)
    unit.el.classList.add('ff7-shadow-foe');
  return result;
};

const ff7SquareTabBase = Screens.ff7SquareTab;
Screens.ff7SquareTab = function (main) {
  ff7SquareTabBase.call(this, main);
  const open = FF7Event.shadowUnlocked(), q = FF7Event.shadowState(), state = FF7Event.state();
  const card = el('div', 'ff7-shadow-card');
  card.innerHTML = `<header><span>☾ SHADOW SQUARE</span><b>${open ? 'MASTERY 400+' : 'LOCKED'}</b></header>
    <p>${open ? 'Eight harder rounds. Two severe slot penalties each round; every roll stacks for the rest of the run. Dark Toons and FF7 fighters enter the arena. Losing keeps 25% of the bank.' : `Unlocks at account Mastery 400 · currently ${Save.data.mastery}.`}</p>
    ${open ? `<small>Best ${q.best}/${FF7ShadowSquare.rounds} · ${fmt(q.runs)} runs · ${fmt(q.gil)} Gil won${q.run ? ` · Round ${q.run.round + 1} in progress` : ''}</small>
      <div class="ff7-shadow-actions"><button class="ff7-btn ff7-shadow-team" ${q.run ? 'hidden' : ''}>Team</button><button class="ff7-btn ff7-go ff7-shadow-enter">${FF7_GLOVE}<span>${q.run ? 'Resume' : 'Enter'}</span></button></div>` : ''}`;
  main.appendChild(card);
  if (!open) return;
  card.querySelector('.ff7-shadow-enter').onclick = () => {
    Sound.play('ff7_cursor_accept');
    const roster = FF7Event.squareRoster();
    const last = (state.lastShadowTeam || []).filter(id => roster.includes(id)).slice(0, 5);
    if (q.run) this.ff7ShadowOpen(q.run.ids);
    else if (last.length) this.ff7ShadowOpen(last);
    else this.ff7ShadowSetup();
  };
  const teamButton = card.querySelector('.ff7-shadow-team');
  if (teamButton) teamButton.onclick = () => { Sound.play('ff7_cursor_accept'); this.ff7ShadowSetup(); };
};

Object.assign(Screens, {
  ff7ShadowSetup() {
    if (!FF7Event.shadowUnlocked()) return;
    const roster = FF7Event.squareRoster(), state = FF7Event.state(), max = Math.min(5, roster.length);
    let team = (state.lastShadowTeam || []).filter(id => roster.includes(id));
    roster.forEach(id => { if (team.length < max && !team.includes(id)) team.push(id); });
    team = team.slice(0, max);
    const body = el('div', 'ff7-team');
    const draw = () => {
      body.innerHTML = `<p class="ff7-sub">Choose up to ${max}. The same survivors face all eight rounds. Event loans start at Level ${Math.max(400, FF7Event.squareLevel(), Save.data.mastery)}.</p>
        <div class="ff7-team-grid">${roster.map(id => `<button data-id="${id}" class="${team.includes(id) ? 'on' : ''}">${team.includes(id) ? FF7_GLOVE : ''}<img src="${ff7Portrait(id)}" alt=""><b>${ff7Name(id)}</b><small>${Save.owns(id) ? 'LV ' + Save.hero(id).level : 'LOAN'}</small></button>`).join('')}</div>
        <div class="ff7-team-foot"><span>${team.length} / ${max}</span><button class="ff7-btn ff7-go">${FF7_GLOVE}<span>Step into Shadow Square</span></button></div>`;
      body.querySelectorAll('[data-id]').forEach(button => button.onclick = () => {
        const id = button.dataset.id;
        if (team.includes(id)) team = team.filter(x => x !== id);
        else if (team.length < max) team.push(id);
        else { Sound.play('ui_err'); return; }
        Sound.play('ff7_cursor_move'); draw();
      });
      body.querySelector('.ff7-go').onclick = () => {
        if (!team.length) { Sound.play('ui_err'); return; }
        state.lastShadowTeam = team.slice(); Save.write(); UI.closeModal({ skipHook: true });
        this.ff7ShadowOpen(team);
      };
    };
    draw(); UI.modal('Shadow Square', body, { className: 'ff7-modal' });
  },

  ff7ShadowOpen(ids) {
    if (!FF7Event.shadowUnlocked()) return;
    const q = FF7Event.shadowState(), N = FF7ShadowSquare.rounds;
    if (!q.run) q.run = { round: 0, banked: 0, ids: ids.slice(0, 5), hp: null, picks: null, penalties: [], rerolls: 1 };
    const run = q.run;
    run.penalties = Array.isArray(run.penalties) ? run.penalties : [];
    if (this._ff7SqEl) this._ff7SqEl.remove();
    const root = this._ff7SqEl = el('div', 'ff7-sq ff7-shadow-square');
    root.style.backgroundImage = `url("${ASSET}assets/ff7/bg/battle.png")`;
    document.body.appendChild(root);
    Music.play('arenaBattle');
    let ticketRunning = false, spin = null;
    const earned = {};
    const addDrops = d => Object.entries(d || {}).forEach(([key, amount]) => { earned[key] = (earned[key] || 0) + amount; });
    const lines = [
      'The lights are dimmer tonight. The first shadow is already waiting.',
      'Two new penalties. The old ones are still in force.',
      'The crowd recognizes that silhouette. It is not your ally.',
      'Halfway? Not yet. The arena is only getting darker.',
      'The shadows are starting to fight together.',
      'Keep your feet. The reels remember every roll.',
      'One round left before the black gate opens.',
      'Dark Sephiroth. This is the last gate.'
    ];
    const dio = text => `<div class="ff7-sq-dio"><img src="${ff7Portrait('Dio')}" alt=""><p>${text}</p></div>`;
    const pips = done => Array.from({ length: N }, (_, i) => `<i class="${i < done ? 'done' : i === done && done < N ? 'now' : ''}"></i>`).join('');
    const team = () => `<div class="ff7-sq-team">${run.ids.map(id => {
      const hp = run.hp && run.hp[id] != null ? run.hp[id] : 1;
      return `<span class="${hp <= 0 ? 'down' : ''}" title="${ff7Name(id)}"><img src="${ff7Portrait(id)}" alt=""><u><s style="width:${Math.round(Math.max(0, hp) * 100)}%"></s></u></span>`;
    }).join('')}</div>`;
    const leave = () => {
      if (ticketRunning) return;
      if (spin) clearInterval(spin);
      root.remove(); this._ff7SqEl = null; Music.play('ff7Menu');
      this._raidDossier = FF7_EVENT.id; this._ff7Tab = 'square'; this.render();
    };
    const summary = (kind, battle) => {
      if (spin) clearInterval(spin);
      const lost = kind === 'lost', cashed = kind === 'cash', rounds = lost || cashed ? run.round : N;
      const out = FF7Event.shadowCashOut(run, battle ? [battle] : [], lost, rounds);
      addDrops(out.drops);
      const drops = Object.entries(earned).filter(([, amount]) => amount > 0), again = run.ids.slice();
      root.innerHTML = `<section class="ff7-win ff7-sq-panel"><header><b>${lost ? 'Shadows Won' : cashed ? 'Cashed Out' : 'Dark Champion Defeated!'}</b><span class="ff7-sq-pips">${pips(rounds)}</span></header>
        ${dio(lost ? 'The bank returns one quarter. The next run starts fresh.' : cashed ? 'You kept the Gil. The shadows can wait.' : 'The black gate is open. You beat every shadow.')}
        <ul class="ff7-drops"><li><span>Rounds cleared</span><b>: ${rounds}/${N}</b></li><li><span>Gil</span><b>: +${fmt(out.gil)}</b></li>
          ${drops.map(([id, amount]) => `<li><img src="${trinketIcon(id)}" alt=""><span>${FF7_MATERIA_BY_ID[id].shard} Shard</span><b>: ${amount}</b></li>`).join('')}</ul>
        <div class="ff7-sq-foot"><span></span><button class="ff7-btn ff7-shadow-leave">Leave</button><button class="ff7-btn ff7-go ff7-shadow-again">${FF7_GLOVE}<span>Run Again</span></button></div></section>`;
      Sound.play(lost ? 'ui_back' : 'arena_fanfare', { vol: .5 });
      root.querySelector('.ff7-shadow-leave').onclick = () => { Sound.play('ui_back'); leave(); };
      root.querySelector('.ff7-shadow-again').onclick = () => { Sound.play('ff7_cursor_accept'); this.ff7ShadowOpen(again); };
    };
    const settle = (result, battle, round, pay, last, active) => {
      if (!result || result.quit || !result.win) { summary('lost', battle); return; }
      run.banked += pay;
      const hp = {};
      battle.units.filter(u => u.team === TEAM_P && !u.minion).forEach(u => { hp[u.id] = u.alive ? u.hpPct : 0; });
      const flawless = Object.values(hp).length && Object.values(hp).every(v => v > 0);
      const bonus = flawless ? Math.round(pay * .25) : 0;
      run.banked += bonus;
      if (last) { run.banked = Math.round(run.banked * 2); summary('won', battle); return; }
      const drops = FF7Event.shardDrops([battle], 'hard'); FF7Event.grant(drops); addDrops(drops);
      run.hp = hp; run.round = round + 1; run.penalties = active.slice(); run.picks = null; Save.write();
      Sound.play('arena_crowd', { vol: .5 });
      intermission(`Round ${round + 1} cleared. +${fmt(pay)} Gil${bonus ? `, plus ${fmt(bonus)} for a flawless team.` : '.'}`);
    };
    const battleArgs = () => {
      const active = run.penalties.concat(run.picks || []), round = run.round;
      return { active, round, squad: FF7Event.shadowTeam(run.ids, run.hp), foes: FF7Event.shadowFoes(round, active),
        meta: FF7Event.shadowMeta(round, active), pay: FF7Event.shadowPay(round, active), last: round === N - 1 };
    };
    const fight = () => {
      const args = battleArgs();
      if (!args.squad.length) { summary('lost'); return; }
      root.hidden = true;
      let battle = null;
      battle = BattleScreen.launch({ team: args.squad, foes: args.foes, music: 'arenaBattle', meta: args.meta,
        rewards: () => ({}), skipResults: true,
        onDone: result => {
          $('#battle').classList.remove('ff7-battle', 'ff7-nightmare-battle');
          root.hidden = false; settle(result, battle, args.round, args.pay, args.last, args.active);
        }
      });
      if (battle) $('#battle').classList.add('ff7-battle', 'ff7-nightmare-battle');
      else { root.hidden = false; intermission('The gate did not open. Try again.'); }
    };
    const fightTicket = async button => {
      const args = battleArgs();
      if (!args.squad.length) { summary('lost'); return; }
      if (!Save.spend({ raidTicket: 1 })) { UI.toast('You need a Raid Ticket'); return; }
      ticketRunning = true; button.disabled = true; button.textContent = '⚡ Simulating…'; UI.refreshBar(true);
      let battle, result;
      try {
        battle = new Battle({ offscreen: true });
        result = await battle.simulateOffscreenAsync(args.squad, args.foes, args.meta, {});
      } catch (error) {
        console.error('Shadow Square Raid Ticket failed', error);
        RaidTicket.refund(); ticketRunning = false; UI.refreshBar(true);
        UI.toast('Battle simulation failed. Your Raid Ticket was returned.'); intermission('Raid Ticket returned.'); return;
      }
      ticketRunning = false; UI.refreshBar(true);
      settle(result, battle, args.round, args.pay, args.last, args.active);
    };
    const intermission = note => {
      if (!Array.isArray(run.picks) || run.picks.length !== 2)
        run.picks = FF7Event.shadowRoll(run.penalties);
      Save.write();
      const picks = run.picks.map(id => FF7ShadowSquare.label(id));
      const active = run.penalties.concat(run.picks);
      root.innerHTML = `<section class="ff7-win ff7-sq-panel"><header><b>☾ Shadow Square</b><span class="ff7-sq-pips">${pips(run.round)}</span><button class="ff7-sq-x" type="button">Leave</button></header>
        ${dio(note ? `${note} ${lines[run.round]}` : lines[run.round])}
        <div class="ff7-shadow-roll"><small>NEW PENALTIES · BOTH STACK</small><div class="ff7-sq-slots"><span>?</span><span>?</span></div></div>
        <p class="ff7-sq-hc">&nbsp;</p>
        <div class="ff7-shadow-stack"><b>ACTIVE STACKS · ${active.length}</b><div>${FF7ShadowSquare.activeHtml(active)}</div></div>
        ${team()}
        <div class="ff7-sq-foot"><span>Round ${run.round + 1}/${N} · Banked <em>${fmt(run.banked)}</em> G</span>
          <button class="ff7-btn ff7-shadow-reroll" disabled>Reroll both ×${run.rerolls}</button>
          ${run.round > 0 ? '<button class="ff7-btn ff7-shadow-cash">Cash Out</button>' : ''}
          <button class="ff7-btn ff7-shadow-ticket" disabled>⚡ Raid Ticket · 1</button>
          <button class="ff7-btn ff7-go ff7-shadow-fight" disabled>${FF7_GLOVE}<span>Fight</span></button></div></section>`;
      const slots = [...root.querySelectorAll('.ff7-sq-slots span')], go = root.querySelector('.ff7-shadow-fight');
      const reroll = root.querySelector('.ff7-shadow-reroll'), ticket = root.querySelector('.ff7-shadow-ticket');
      ticket.title = Save.res('raidTicket') ? 'Simulate with all stacked penalties and current team HP' : 'You need a Raid Ticket';
      Sound.play('ff7_slots_spin', { vol: .5 });
      if (spin) clearInterval(spin);
      const thisSpin = spin = setInterval(() => slots.forEach(slot => { slot.textContent = pick(FF7ShadowSquare.penalties).icon; }), 70);
      setTimeout(() => {
        if (!root.isConnected || !slots[0].isConnected) { clearInterval(thisSpin); return; }
        clearInterval(thisSpin); if (spin === thisSpin) spin = null;
        slots.forEach((slot, i) => { slot.textContent = picks[i].icon; slot.classList.add('stop'); });
        root.querySelector('.ff7-sq-hc').innerHTML = `<b>${picks.map(p => p.name).join(' + ')}</b> · Round pays <em>${fmt(FF7Event.shadowPay(run.round, active))}</em> G<br><small>${picks.map(p => p.desc).join(' · ')}</small>`;
        Sound.play('ff7_slots_stop', { vol: .5 });
        go.disabled = false; reroll.disabled = run.rerolls < 1; ticket.disabled = !Save.res('raidTicket');
      }, 900);
      go.onclick = () => { if (ticketRunning) return; Sound.play('ff7_cursor_accept'); fight(); };
      ticket.onclick = () => {
        if (ticketRunning) return;
        Sound.play('ff7_cursor_accept'); go.disabled = true; reroll.disabled = true; ticket.disabled = true; fightTicket(ticket);
      };
      reroll.onclick = () => {
        if (ticketRunning || run.rerolls < 1) return;
        run.rerolls--; run.picks = FF7Event.shadowRoll(run.penalties, run.picks); intermission(note);
      };
      const cash = root.querySelector('.ff7-shadow-cash');
      if (cash) cash.onclick = () => { if (!ticketRunning) summary('cash'); };
      root.querySelector('.ff7-sq-x').onclick = () => { if (!ticketRunning) { Sound.play('ui_back'); leave(); } };
    };
    intermission(run.round > 0 ? 'The gate remembers you.' : '');
  }
});

;

/* ===== js/ff7-badges.js ===== */
/* FF7 friendship badges. Keep the original IDs so earned badges and levels
   survive this redesign. The first four extend their event badge definitions. */
'use strict';

const ff7BadgeTargets = (u, B) => B.enemiesOf(u).filter(e => e.alive && B.isTargetable(e));
const ff7BadgeAllies = (u, B) => B.alliesOf(u).filter(a => a.alive);
const ff7BadgeLowest = (u, B) => B.lowestHp(ff7BadgeAllies(u, B));

// The first event badges already have a signature move. These follow-ups make
// that move interact with the hero's actual kit and with the rest of the team.
function extendFF7Badge(id, effect, extra) {
  const badge = BADGES[id];
  if (!badge) return;
  const baseApply = badge.apply;
  badge.effect = effect;
  badge.apply = function (u, B, lvl) {
    baseApply.call(this, u, B, lvl);
    extra(u, B, lvl);
  };
}

extendFF7Badge('ff7_cloud_buster',
  'Every fourth Basic Attack sends out a Cross-Slash shockwave. A successful Cross-Slash mark exposes its victim, strips a buff, and refills Limit; defeating that foe rallies the team with Energy and a Shield. His Limit Break also grants Attack and Haste before unleashing Limit Surge.',
  (u, B, lvl) => {
    const marked = new WeakSet();
    B.on(u, 'statusApplied', ev => {
      if (ev.src !== u || ev.id !== 'ff_crossmark' || !ev.unit || !ev.unit.alive) return;
      marked.add(ev.unit);
      B.applyStatus(u, ev.unit, 'exposed', 6);
      B.dispel(ev.unit, 1);
      B.energy(u, 10 + lvl * 2);
      B.fxFloatIcon(ev.unit.x, ev.unit.y - 108, 'INHERITED EDGE', '#a9d7ff');
    });
    B.on(u, 'defeatedEnemy', foe => {
      if (!foe || !marked.has(foe) || !u.alive) return;
      ff7BadgeAllies(u, B).forEach(a => B.energy(a, 10 + lvl * 2));
      const ally = ff7BadgeLowest(u, B);
      if (ally) B.shield(u, ally, ally.max.hp * (.12 + lvl * .02), 6);
      B.fxRing(u.x, u.y - 42, 160, '#a9d7ff', .4);
    });
  });

extendFF7Badge('ff7_tifa_gloves',
  'Every fifth Basic Attack becomes a five-hit Beat Rush. Tifa hits Armor-broken enemies harder; a dodge snaps into a guarded counterpunch. Her Limit Break grants her a cleanse, heal, and Shield, while its momentum gives the weakest ally Haste.',
  (u, B, lvl) => {
    B.on(u, 'dealDamage', ev => {
      if (ev.dot || !ev.target || ev.target.team === u.team) return;
      if (ev.target.hasStatus('ff_armorbreak')) ev.amount *= 1.12 + lvl * .025;
    });
    let counterAt = -99;
    B.on(u, 'dodged', ev => {
      const foe = ev && ev.src;
      if (!u.alive || !foe || !foe.alive || foe.team === u.team || B.t < counterAt) return;
      counterAt = B.t + Math.max(4, 7 - lvl * .4);
      B.damage(u, foe, u.st.atk * (.85 + lvl * .12), { type: 'physical', tag: 'Seventh Heaven Counter', melee: true });
      B.shield(u, u, u.max.hp * (.07 + lvl * .01), 4);
      B.fxFloatIcon(foe.x, foe.y - 105, 'COUNTER!', '#ff9fae');
    });
    B.on(u, 'cast', ev => {
      if (ev.key !== 'W') return;
      B.after(2.6, () => {
        if (!u.alive) return;
        const ally = ff7BadgeLowest(u, B);
        if (ally && ally !== u) B.applyStatus(u, ally, 'haste', 6);
      });
    });
  });

extendFF7Badge('ff7_aerith_ribbon',
  'Every spell calls Planetary Blessing: a team heal and cleanse, with a Shield for the weakest ally. Healing Wind also grants Fortify. Once per battle, the ribbon answers a lethal blow by saving an ally, cleansing them, and wrapping them in a protective barrier.',
  (u, B, lvl) => {
    let saved = false;
    B.on(u, 'allyLethal', ev => {
      const ally = ev && ev.unit;
      if (saved || !u.alive || !ally || ally.team !== u.team || ev.prevented) return;
      saved = true;
      ev.prevented = true;
      ally.hp = Math.max(1, ally.max.hp * (.18 + lvl * .02));
      B.cleanse(ally, 3);
      B.shield(u, ally, ally.max.hp * (.16 + lvl * .025), 7);
      B.applyStatus(u, ally, 'ccimmune', 2.5);
      B.fxRing(ally.x, ally.y - 42, 150, '#ffc5df', .55);
      B.fxFloatIcon(ally.x, ally.y - 115, 'PLANET, HEAR ME', '#ffc5df');
    });
  });

extendFF7Badge('ff7_caitsith_megaphone',
  'Every skill has a chance to call a Jackpot; Slots guarantees it. Jackpot blasts all foes while giving allies Energy, Haste, and faster cooldowns. Moogle Dance also grants Fortune to the weakest ally, and Jackpot bonuses spill extra Energy to their recipients.',
  (u, B, lvl) => {
    B.on(u, 'cast', ev => {
      if (ev.key !== 'B') return;
      const ally = ff7BadgeLowest(u, B);
      if (!ally) return;
      B.applyStatus(u, ally, 'ff_fortune', 7);
      B.shield(u, ally, ally.max.hp * (.07 + lvl * .015), 6);
      B.fxFloatIcon(ally.x, ally.y - 105, 'LUCKY ENCORE', '#ffda7c');
    });
    B.on(u, 'statusApplied', ev => {
      if (ev.src !== u || ev.id !== 'ff_jackpot' || !ev.unit || !ev.unit.alive) return;
      B.energy(ev.unit, 8 + lvl * 2);
    });
  });

defBadge({
  id: 'ff7_cloud_survey_pin', owner: 'Cloud', friend: 'Shelly', ff7Event: true, skillKey: 'G',
  name: 'Survey Pin', icon: '📍', color: '#91c9df',
  desc: 'Shelly scratched a safe route through Gardenview into this pin. Cloud follows its marks when the corridors move.',
  stat: lvl => `+${12 + lvl * 6}% Attack · +${10 + lvl * 5}% Accuracy · +${6 + lvl * 3}% Armor Penetration`,
  effect: 'The pin surveys the strongest enemy at wave start. Cloud deals extra damage to the marked threat; Cross-Slash strips its defenses and Energy. When Cloud defeats it, the pin finds the next threat and rallies allies with Energy and a Shield.',
  apply(u, B, lvl) {
    u.flat.atkP = (u.flat.atkP || 0) + .12 + lvl * .06;
    u.flat.accP = (u.flat.accP || 0) + .10 + lvl * .05;
    u.flat.armorPen = (u.flat.armorPen || 0) + .06 + lvl * .03;
    u.dirty = true;
    let marked = null;
    const survey = () => {
      const foe = ff7BadgeTargets(u, B).sort((a, b) => b.st.atk - a.st.atk)[0];
      marked = foe || null;
      if (!foe) return;
      B.applyStatus(u, foe, 'exposed', 8);
      B.fxFloatIcon(foe.x, foe.y - 106, 'SURVEYED', '#91c9df');
    };
    B.after(.2, () => { if (u.alive) survey(); });
    B.on(u, 'dealDamage', ev => {
      if (ev.dot || !ev.target || ev.target !== marked) return;
      ev.amount *= 1.18 + lvl * .035;
    });
    B.on(u, 'cast', ev => {
      if (ev.key !== 'G') return;
      const foe = B.nearest(u, ff7BadgeTargets(u, B));
      if (!foe) return;
      marked = foe;
      B.applyStatus(u, foe, 'exposed', 7);
      B.applyStatus(u, foe, 'ff_armorbreak', 7, { val: .12 + lvl * .025 });
      B.dispel(foe, 1);
      B.energy(foe, -(15 + lvl * 3));
      B.fxRing(foe.x, foe.y - 40, 105, '#91c9df', .4);
    });
    B.on(u, 'defeatedEnemy', foe => {
      if (foe !== marked || !u.alive) return;
      ff7BadgeAllies(u, B).forEach(a => B.energy(a, 10 + lvl * 2));
      const ally = ff7BadgeLowest(u, B);
      if (ally) B.shield(u, ally, ally.max.hp * (.12 + lvl * .02), 6);
      survey();
    });
  }
});

defBadge({
  id: 'ff7_tifa_cue_band', owner: 'Tifa', friend: 'Vee', ff7Event: true, skillKey: 'G',
  name: 'Cue Band', icon: '⌚', color: '#ffb38d',
  desc: 'Vee built a tiny display that counts Tifa’s combinations. Tifa uses the rhythm; she ignores the score.',
  stat: lvl => `+${12 + lvl * 6}% Attack Speed · +${10 + lvl * 5}% Evasion · +${6 + lvl * 3}% Critical Chance`,
  effect: 'Every third Basic Attack hits the beat, granting team Haste and shielding the most wounded ally. Completing Beat Rush adds an Encore that strikes nearby enemies and restores Limit. Her Limit Break shares its momentum as Energy for the team.',
  apply(u, B, lvl) {
    u.flat.aspdP = (u.flat.aspdP || 0) + .12 + lvl * .06;
    u.flat.evaP = (u.flat.evaP || 0) + .10 + lvl * .05;
    u.flat.crit = (u.flat.crit || 0) + .06 + lvl * .03;
    u.dirty = true;
    let beat = 0, rush = 0, nextBeat = 0;
    B.on(u, 'basicHit', () => {
      if (++beat % 3 || B.t < nextBeat) return;
      nextBeat = B.t + 5;
      ff7BadgeAllies(u, B).forEach(a => B.applyStatus(u, a, 'haste', 4));
      const ally = ff7BadgeLowest(u, B);
      if (ally) B.shield(u, ally, ally.max.hp * (.09 + lvl * .015), 6);
      B.fxFloatIcon(u.x, u.y - 112, 'ON BEAT', '#ffb38d');
    });
    B.on(u, 'dealDamage', ev => {
      if (ev.tag !== 'Beat Rush' || ev.dot) return;
      if (++rush % 5 || !u.alive) return;
      const target = ev.target;
      B.after(.1, () => {
        if (!u.alive || !target || !target.alive) return;
        ff7BadgeTargets(u, B).filter(e => B.distance(e, target) < 130).forEach(e =>
          B.damage(u, e, u.st.atk * (.55 + lvl * .12), { type: 'physical', area: true, tag: 'Cue Band Encore' }));
        B.energy(u, 10 + lvl * 2);
        B.fxRing(target.x, target.y - 40, 130, '#ffb38d', .4);
      });
    });
    B.on(u, 'cast', ev => {
      if (ev.key === 'G') { rush = 0; return; }
      if (ev.key !== 'W') return;
      B.after(2.7, () => {
        if (!u.alive) return;
        ff7BadgeAllies(u, B).filter(a => a !== u).forEach(a => B.energy(a, 8 + lvl * 2));
      });
    });
  }
});

defBadge({
  id: 'ff7_aerith_glasshouse_seed', owner: 'Aerith', friend: 'Sprout', ff7Event: true, skillKey: 'G',
  name: 'Glasshouse Seed', icon: '🌱', color: '#aee8aa',
  desc: 'Sprout rescued a cutting from a greenhouse the Twisteds had overrun. Aerith coaxed it back to life.',
  stat: lvl => `+${12 + lvl * 6}% Magic Attack · +${10 + lvl * 5}% Skill Haste · +${8 + lvl * 4}% Healing Power`,
  effect: 'Seal Evil and Breath of the Earth plant a thorn in the nearest foe, Slow it, and heal the weakest ally. The next allied hit blooms the thorn into a root and a team heal. Healing Wind scatters seeds, cleansing allies and shielding the weakest.',
  apply(u, B, lvl) {
    u.flat.magP = (u.flat.magP || 0) + .12 + lvl * .06;
    u.flat.cdr = (u.flat.cdr || 0) + .10 + lvl * .05;
    u.flat.healPowP = (u.flat.healPowP || 0) + .08 + lvl * .04;
    u.dirty = true;
    const planted = new WeakSet();
    B.on(u, 'cast', ev => {
      if (ev.key === 'W') {
        B.after(.65, () => {
          if (!u.alive) return;
          ff7BadgeAllies(u, B).forEach(a => B.cleanse(a, 1));
          const ally = ff7BadgeLowest(u, B);
          if (ally) B.shield(u, ally, ally.max.hp * (.11 + lvl * .02), 7);
          B.fxRing(u.x, u.y - 40, 210, '#aee8aa', .55);
        });
        return;
      }
      if (ev.key !== 'G' && ev.key !== 'B') return;
      const foe = B.nearest(u, ff7BadgeTargets(u, B));
      if (!foe) return;
      planted.add(foe);
      B.damage(u, foe, u.st.mag * (.65 + lvl * .12), { type: 'magic', tag: 'Glasshouse Thorn' });
      B.applyStatus(u, foe, 'slow', 3);
      const ally = ff7BadgeLowest(u, B);
      if (ally) B.heal(u, ally, ally.max.hp * (.07 + lvl * .012), { tag: 'Glasshouse Seed' });
      B.fxFloatIcon(foe.x, foe.y - 105, 'THORN PLANTED', '#aee8aa');
    });
    B.on(u, 'allyDamageDealt', ev => {
      const foe = ev && ev.target;
      if (!foe || !foe.alive || ev.dot || ev.tag === 'Glasshouse Thorn' || !planted.has(foe)) return;
      planted.delete(foe);
      B.applyStatus(u, foe, 'root', 1.6 + lvl * .15);
      ff7BadgeAllies(u, B).forEach(a => B.heal(u, a, a.max.hp * (.04 + lvl * .008), { tag: 'Glasshouse Bloom' }));
      B.fxRing(foe.x, foe.y - 42, 125, '#aee8aa', .45);
      B.fxFloatIcon(foe.x, foe.y - 112, 'BLOOM', '#aee8aa');
    });
  }
});

defBadge({
  id: 'ff7_caitsith_case_die', owner: 'CaitSith', friend: 'Rodger', ff7Event: true, skillKey: 'B',
  name: 'Case File Die', icon: '🎲', color: '#d0b7ff',
  desc: 'Rodger numbered the clues on each face. Cait Sith insists the die is fair. Rodger knows better.',
  stat: lvl => `+${12 + lvl * 6}% Magic Attack · +${10 + lvl * 5}% Skill Haste · +${8 + lvl * 4}% Evasion`,
  effect: 'Each skill investigates the enemy with the most Energy, draining and Slowing it. Three clues close the case: the suspect loses a buff, takes Magic Damage, and is Silenced; the team gains Energy. Slots counts as two clues.',
  apply(u, B, lvl) {
    u.flat.magP = (u.flat.magP || 0) + .12 + lvl * .06;
    u.flat.cdr = (u.flat.cdr || 0) + .10 + lvl * .05;
    u.flat.evaP = (u.flat.evaP || 0) + .08 + lvl * .04;
    u.dirty = true;
    let clues = 0;
    B.on(u, 'cast', ev => {
      const foe = ff7BadgeTargets(u, B).sort((a, b) => b.energy - a.energy)[0];
      if (!foe) return;
      clues += ev.key === 'W' ? 2 : 1;
      B.energy(foe, -(15 + lvl * 3));
      B.applyStatus(u, foe, 'slow', 3);
      B.fxFloatIcon(foe.x, foe.y - 104, `CLUE ${Math.min(clues, 3)}/3`, '#d0b7ff');
      if (clues < 3) return;
      clues = 0;
      B.dispel(foe, 1);
      B.damage(u, foe, u.st.mag * (1.1 + lvl * .2), { type: 'magic', tag: 'Case Closed' });
      B.applyStatus(u, foe, 'silence', 2 + lvl * .2);
      ff7BadgeAllies(u, B).forEach(a => B.energy(a, 10 + lvl * 2));
      B.fxRing(foe.x, foe.y - 40, 155, '#d0b7ff', .5);
      B.fxFloatIcon(foe.x, foe.y - 120, 'CASE CLOSED', '#d0b7ff');
    });
  }
});

defBadge({
  id: 'ff7_barret_armature', owner: 'Barret', friend: 'Waxwell', ff7Event: true, skillKey: 'P',
  name: 'Spare Armature', icon: '🔩', color: '#f2bf79',
  desc: 'Waxwell rebuilt this gun-arm brace from parts found beneath Corel. Barret recognized the workmanship immediately.',
  stat: lvl => `+${12 + lvl * 6}% Attack · +${10 + lvl * 5}% Defense · +${8 + lvl * 4}% Max HP`,
  effect: 'Suppressed enemies take heavier fire. At three Suppressive Fire stacks, the armature tears off a buff, shreds Armor, and refills Barret’s Energy. Catastrophe shields the most wounded ally. Below half Health, the brace shields Barret and fires back at his attacker.',
  apply(u, B, lvl) {
    u.flat.atkP = (u.flat.atkP || 0) + .12 + lvl * .06;
    u.flat.defP = (u.flat.defP || 0) + .10 + lvl * .05;
    u.flat.hpP = (u.flat.hpP || 0) + .08 + lvl * .04;
    u.dirty = true;
    const cracked = new WeakMap();
    B.on(u, 'dealDamage', ev => {
      if (ev.dot || !ev.target || !ev.target.getStatus) return;
      const stacks = (ev.target.getStatus('ff_suppress') || {}).stacks || 0;
      if (stacks) ev.amount *= 1 + Math.min(.24, stacks * (.045 + lvl * .008));
    });
    B.on(u, 'statusApplied', ev => {
      if (ev.src !== u || ev.id !== 'ff_suppress' || !ev.unit || !ev.unit.alive) return;
      const stacks = (ev.unit.getStatus('ff_suppress') || {}).stacks || 0;
      if (stacks < 3 || B.t < (cracked.get(ev.unit) || -99)) return;
      cracked.set(ev.unit, B.t + 5);
      B.dispel(ev.unit, 1);
      B.applyStatus(u, ev.unit, 'ff_armorbreak', 6, { val: .18 + lvl * .02 });
      B.energy(u, 8 + lvl * 2);
      B.fxFloatIcon(ev.unit.x, ev.unit.y - 110, 'ARMOR CRACKED', '#f2bf79');
    });
    B.on(u, 'cast', ev => {
      if (ev.key !== 'W') return;
      const ally = ff7BadgeLowest(u, B);
      if (ally) {
        B.shield(u, ally, ally.max.hp * (.13 + lvl * .02), 7);
        B.applyStatus(u, ally, 'fortify', 6);
        B.fxRing(ally.x, ally.y - 40, 115, '#f2bf79', .45);
      }
    });
    let braceAt = -99, pending = false;
    B.on(u, 'damaged', ev => {
      if (!u.alive || B.t < braceAt || pending) return;
      pending = true;
      B.after(.01, () => {
        pending = false;
        if (!u.alive || u.hpPct >= .5 || B.t < braceAt) return;
        braceAt = B.t + Math.max(8, 12 - lvl * .5);
        B.shield(u, u, u.max.hp * (.16 + lvl * .025), 6);
        B.applyStatus(u, u, 'fortify', 5);
        if (ev.src && ev.src.alive && ev.src.team !== u.team)
          B.damage(u, ev.src, u.st.atk * (1 + lvl * .12), { type: 'physical', tag: 'Armature Recoil' });
        B.fxFloatIcon(u.x, u.y - 112, 'BRACE!', '#f2bf79');
      });
    });
  }
});

defBadge({
  id: 'ff7_sephiroth_hollow_mirror', owner: 'Sephiroth', friend: 'Connie', ff7Event: true, skillKey: 'G',
  name: 'Hollow Mirror', icon: '🪞', color: '#cbb5f2',
  desc: 'Connie passed this shard through a sealed wall. It reflects corridors that Gardenview no longer has.',
  stat: lvl => `+${12 + lvl * 6}% Magic Attack · +${10 + lvl * 5}% Evasion · +${8 + lvl * 4}% Critical Damage`,
  effect: 'Shadow Flare and Pale Horse mirror Calamity onto the two strongest foes and drain their Energy. Each Calamity stack sharpens Sephiroth’s damage. Direct attackers suffer a reflected curse; Super Nova echoes stacked Calamity as extra blasts and shields him.',
  apply(u, B, lvl) {
    u.flat.magP = (u.flat.magP || 0) + .12 + lvl * .06;
    u.flat.evaP = (u.flat.evaP || 0) + .10 + lvl * .05;
    u.flat.critDmg = (u.flat.critDmg || 0) + .08 + lvl * .04;
    u.dirty = true;
    let mirrorAt = -99;
    B.on(u, 'cast', ev => {
      if (ev.key === 'G' || ev.key === 'B') {
        const foes = ff7BadgeTargets(u, B).sort((a, b) => b.st.atk - a.st.atk).slice(0, 2);
        foes.forEach(foe => {
          B.applyStatus(u, foe, 'ff_calamity', 9);
          B.energy(foe, -(10 + lvl * 3));
          B.fxRing(foe.x, foe.y - 42, 105, '#cbb5f2', .35);
        });
      } else if (ev.key === 'W') {
        B.after(.72, () => {
          if (!u.alive) return;
          let consumed = 0;
          ff7BadgeTargets(u, B).forEach(foe => {
            const stacks = (foe.getStatus('ff_calamity') || {}).stacks || 0;
            if (stacks < 3) return;
            consumed++;
            B.damage(u, foe, u.st.mag * (.45 + lvl * .10) * Math.min(5, stacks),
              { type: 'magic', area: true, tag: 'Mirror Nova' });
            B.dispel(foe, 1);
            B.fxRing(foe.x, foe.y - 42, 125, '#cbb5f2', .45);
          });
          if (consumed) B.shield(u, u, u.max.hp * Math.min(.32, .10 + consumed * .04 + lvl * .015), 6);
        });
      }
    });
    B.on(u, 'dealDamage', ev => {
      if (ev.dot || !ev.target || !ev.target.getStatus) return;
      const stacks = (ev.target.getStatus('ff_calamity') || {}).stacks || 0;
      if (stacks) ev.amount *= 1 + Math.min(.25, stacks * (.035 + lvl * .005));
    });
    B.on(u, 'damaged', ev => {
      const foe = ev && ev.src;
      if (!u.alive || !foe || !foe.alive || foe.team === u.team || ev.dot || B.t < mirrorAt) return;
      mirrorAt = B.t + Math.max(5, 8 - lvl * .4);
      B.applyStatus(u, foe, 'ff_calamity', 9);
      B.applyStatus(u, foe, 'slow', 3);
      B.damage(u, foe, u.st.mag * (.55 + lvl * .1), { type: 'magic', tag: 'Hollow Reflection' });
      B.fxFloatIcon(foe.x, foe.y - 108, 'REFLECTED', '#cbb5f2');
    });
  }
});

;

/* ===== js/ff7-voices.js ===== */
/* Supplied FF7 voice recordings, attached to the existing battle actions. */
'use strict';

const FF7_VOICE_CUES = {
  ff7_tifa_attack: [
    'tifaattackgrunt__1_.wav', 'tifaattackgrunt__2_.wav',
    'tifaattackgrunt__3_.wav', 'tifaattackgrunt__4_.wav'
  ],
  ff7_tifa_rush: ['tifaheregoes.wav'],
  ff7_tifa_kick: ['tifatakethat.wav'],
  ff7_tifa_limit: ['tifabreakingmylimits.wav'],
  ff7_cloud_attack: [
    'cloudattackgrunt__1_.wav', 'cloudattackgrunt__2_.wav',
    'cloudattackgrunt__3_.wav'
  ],
  ff7_cloud_cross: ['cloudoverhere.wav'],
  ff7_cloud_stab: ['cloudyouregone.wav'],
  ff7_cloud_meteor: ['cloudraindown.wav'],
  ff7_cloud_omni: ['cloudstars.wav'],
  ff7_cloud_finish: ['cloudbreakingmylimits.wav'],
  ff7_barret_attack: [
    'barretattack__1_.wav', 'barretattack__2_.wav',
    'barretattack__3_.wav', 'barretattack__4_.wav'
  ],
  ff7_barret_catastrophe: ['barretilltakeyouallon.wav'],
  ff7_barret_bigshot: ['barretcomegetsome.wav'],
  ff7_barret_mindblow: ['barretwantsomemore.wav'],
  ff7_barret_grenade: ['barretdontstopnow.wav'],
  ff7_seph_attack: ['sephirothhmph.wav'],
  ff7_seph_nova: ['sephirothtothepromisedland.wav'],
  ff7_seph_flare: ['sephirothfearnot.wav'],
  ff7_seph_horse: ['sephirothtoolateforlaments.wav', 'sephirothyoulookgood.wav']
};
CUE_SOURCES.push([FF7_VOICE_CUES, ASSET + 'uploads/']);

function playFF7Voice(unit, battle, cue, basic = false) {
  if (!unit || !unit.alive || !battle || battle.offscreen || !Sound.on) return;
  if (basic && Math.random() > .38) return;
  const now = battle.t;
  if (now - (unit._ff7VoiceAt ?? -99) < (basic ? 3 : .75)) return;
  if (Sound.play(cue, { vol: basic ? .48 : .7, priority: !basic, throttle: basic ? 1100 : 350 })) {
    unit._ff7VoiceAt = now;
    if (!basic && typeof Music !== 'undefined') Music.duck(.82, 1050);
  }
}

const FF7_BASIC_VOICE = {
  Tifa: 'ff7_tifa_attack',
  Cloud: 'ff7_cloud_attack',
  Barret: 'ff7_barret_attack',
  Sephiroth: 'ff7_seph_attack'
};

const FF7_SKILL_VOICE = {
  Tifa: { W: 'ff7_tifa_limit', G: 'ff7_tifa_rush', B: 'ff7_tifa_kick' },
  Cloud: { W: 'ff7_cloud_cross', G: 'ff7_cloud_cross', B: 'ff7_cloud_stab' },
  Barret: {
    W: 'ff7_barret_catastrophe', G: 'ff7_barret_bigshot',
    B: 'ff7_barret_mindblow', P: 'ff7_barret_grenade'
  },
  Sephiroth: { W: 'ff7_seph_nova', G: 'ff7_seph_flare', B: 'ff7_seph_horse' }
};

for (const id of Object.keys(FF7_BASIC_VOICE)) {
  const hero = HEROES[id];
  if (!hero) continue;
  const originalStart = hero.basic.onStart;
  hero.basic.onStart = function (unit, battle, target) {
    if (originalStart) originalStart.call(this, unit, battle, target);
    playFF7Voice(unit, battle, FF7_BASIC_VOICE[id], true);
  };
  for (const [key, cue] of Object.entries(FF7_SKILL_VOICE[id])) {
    const skill = hero.skills[key];
    if (!skill || !skill.cast) continue;
    const originalCast = skill.cast;
    skill.cast = function (unit, battle, scaled, params) {
      let selected = cue;
      if (id === 'Cloud' && key === 'W') {
        selected = unit._ff7FinishNext ? 'ff7_cloud_finish'
          : ['ff7_cloud_cross', 'ff7_cloud_stab', 'ff7_cloud_meteor', 'ff7_cloud_omni'][(unit._ff7Lv || 1) - 1];
      }
      playFF7Voice(unit, battle, selected);
      return originalCast.call(this, unit, battle, scaled, params);
    };
  }
}

;

/* ===== js/ff7-skill-vfx.js ===== */
/* Extra FF7 battle choreography. Visual only: skill damage and timing stay in
   the original definitions. Nodes live in the battle FX layers and are capped
   so a crowded fight cannot accumulate an unlimited number of animations. */
'use strict';

const FF7SkillVFX = {
  live: new Set(),
  ticking: false,
  reduced() {
    return document.documentElement.classList.contains('accessibility-reduced-effects') ||
      (typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches);
  },
  level() {
    const root = document.documentElement;
    return root.classList.contains('graphics-low') ? 0 : root.classList.contains('graphics-lite') ? 1 : 2;
  },
  ready(B) {
    return !!(B && !B.offscreen && !B.over && !B.ended && !this.reduced() &&
      document.getElementById('battle') && !document.getElementById('battle').hidden);
  },
  anchor(B, unit) { return B.unitFxAnchor(unit); },
  enemies(B, unit) { return B.enemiesOf(unit).filter(e => e.alive && B.isTargetable(e)); },
  allies(B, unit) { return B.alliesOf(unit).filter(a => a.alive); },
  nearest(B, unit) { return B.nearest(unit, this.enemies(B, unit)); },
  strongest(B, unit, stat) {
    return this.enemies(B, unit).sort((a, b) => (b.st[stat] || 0) - (a.st[stat] || 0))[0];
  },
  highestEnergy(B, unit) { return this.enemies(B, unit).sort((a, b) => b.energy - a.energy)[0]; },
  spawn(B, kind, x, y, options = {}) {
    if (!this.ready(B)) return null;
    const host = document.getElementById(options.back ? 'fxBack' : 'fxFront');
    if (!host) return null;
    const max = this.level() === 0 ? 24 : this.level() === 1 ? 52 : 100;
    if (this.live.size >= max) {
      const oldest = this.live.values().next().value;
      if (oldest) { oldest.node.remove(); this.live.delete(oldest); }
    }
    const node = document.createElement('div');
    node.className = 'ff7-vfx ff7-vfx-' + kind;
    node.setAttribute('aria-hidden', 'true');
    node.style.left = `${x}px`;
    node.style.top = `${y}px`;
    node.style.setProperty('--v-main', options.color || '#9edfff');
    node.style.setProperty('--v-hot', options.hot || '#ffffff');
    node.style.setProperty('--v-size', `${options.size || 100}px`);
    node.style.setProperty('--v-angle', `${options.angle || 0}deg`);
    node.style.setProperty('--v-dx', `${options.dx || 0}px`);
    node.style.setProperty('--v-dy', `${options.dy || 0}px`);
    node.style.setProperty('--v-thick', `${options.thick || 8}px`);
    if (options.text) node.textContent = options.text;
    const life = options.life || .65;
    node.style.setProperty('--v-time', `${life / ((B.speed || 1) * .76)}s`);
    host.appendChild(node);
    const entry = { node, B, until: B.t + life,
      wallUntil: performance.now() + life / ((B.speed || 1) * .76) * 1000 + 250 };
    this.live.add(entry);
    this.tick();
    return node;
  },
  tick() {
    if (this.ticking) return;
    this.ticking = true;
    const frame = () => {
      for (const item of this.live) {
        const { node, B } = item;
        // The battle clock stops on victory. Give the finishing blow enough
        // real time to play before removing its effects.
        if (!node.isConnected || (B.over || B.ended ? performance.now() >= item.wallUntil : B.t >= item.until)) {
          node.remove(); this.live.delete(item); continue;
        }
        node.style.setProperty('--v-play', B.paused && !B.over && !B.ended ? 'paused' : 'running');
      }
      if (this.live.size) requestAnimationFrame(frame);
      else this.ticking = false;
    };
    requestAnimationFrame(frame);
  },
  ring(B, a, color, size = 110, life = .65, hot) {
    return this.spawn(B, 'ring', a.x, a.y, { color, hot, size, life });
  },
  impact(B, a, color, size = 100, life = .45, hot) {
    this.spawn(B, 'impact', a.x, a.y, { color, hot, size, life });
    this.ring(B, a, color, size * .8, life + .12, hot);
  },
  slash(B, a, color, angle = -32, size = 130, life = .4, hot) {
    this.spawn(B, 'slash', a.x, a.y, { color, hot, angle, size, life });
  },
  beam(B, from, to, color, thick = 9, life = .4, hot) {
    if (!from || !to) return;
    const dx = to.x - from.x, dy = to.y - from.y;
    this.spawn(B, 'beam', from.x, from.y, {
      color, hot, size: Math.max(20, Math.hypot(dx, dy)), angle: Math.atan2(dy, dx) * 180 / Math.PI,
      thick, life
    });
  },
  sparks(B, a, color, count = 10, spread = 90, kind = 'spark', hot) {
    if (this.level() === 0) return;
    const n = this.level() === 1 ? Math.ceil(count * .5) : count;
    for (let i = 0; i < n; i++) {
      const angle = i * Math.PI * 2 / n + Math.random() * .35;
      const distance = spread * (.5 + Math.random() * .6);
      this.spawn(B, kind, a.x, a.y, {
        color, hot, size: 5 + Math.random() * 9,
        dx: Math.cos(angle) * distance, dy: Math.sin(angle) * distance,
        angle: angle * 180 / Math.PI, life: .48 + Math.random() * .34
      });
    }
  },
  glyph(B, a, text, color, size = 35, life = .7) {
    this.spawn(B, 'glyph', a.x, a.y, { color, text, size, life });
  },
  vortex(B, a, color, size = 210, life = 1.1, hot) {
    this.spawn(B, 'vortex', a.x, a.y, { color, hot, size, life });
  },
  seal(B, a, color, size = 120, life = .8, hot) {
    this.spawn(B, 'seal', a.x, a.y, { color, hot, size, life });
  },
  wash(B, color, life = .7, dark = false) {
    if (this.level() === 0) return;
    this.spawn(B, dark ? 'eclipse' : 'wash', 0, 0, { color, life, back: true });
  },
  later(B, delay, fn) { B.after(delay, () => { if (this.ready(B)) fn(); }); },

  cloud(unit, B, key) {
    const blue = '#70cbff', white = '#effcff';
    const a = this.anchor(B, unit), foes = this.enemies(B, unit);
    const lv = unit._ff7Lv || 1;
    const target = key === 'B' || (key === 'W' && lv === 2)
      ? foes.slice().sort((x, y) => y.hp - x.hp)[0]
      : key === 'W' && lv === 1 ? this.strongest(B, unit, 'atk') : this.nearest(B, unit);
    this.ring(B, a, blue, 105, .55, white);
    if (key === 'G' && target) {
      const t = this.anchor(B, target);
      this.later(B, .12, () => this.beam(B, a, t, blue, 13, .4, white));
      this.later(B, .35, () => {
        this.slash(B, this.anchor(B, target), blue, -42, 185, .4, white);
        this.slash(B, this.anchor(B, target), blue, 42, 185, .4, white);
        this.impact(B, this.anchor(B, target), blue, 125, .48, white);
        this.sparks(B, this.anchor(B, target), white, 11, 95);
      });
    } else if (key === 'B' && target) {
      this.later(B, .28, () => {
        const t = this.anchor(B, target);
        this.spawn(B, 'column', t.x, t.y, { color: blue, hot: white, size: 90, life: .55 });
        this.slash(B, t, white, -72, 210, .48, blue);
        this.sparks(B, t, blue, 12, 105);
      });
    } else if (key === 'W') {
      this.wash(B, '#5fc2ff', .7);
      if (unit._ff7FinishNext) {
        const foes = this.enemies(B, unit);
        const x = foes.length ? foes.reduce((n, e) => n + this.anchor(B, e).x, 0) / foes.length : B.W / 2;
        const y = foes.length ? foes.reduce((n, e) => n + this.anchor(B, e).y, 0) / foes.length : B.H / 2;
        const center = { x, y };
        this.vortex(B, center, blue, 270, 1.3, white);
        this.later(B, .8, () => { this.impact(B, center, white, 230, .6, blue); this.sparks(B, center, blue, 18, 170); });
      } else if ((unit._ff7Lv || 1) === 3) {
        this.vortex(B, a, blue, 150, .9, white);
        for (let i = 0; i < 6; i++) this.later(B, .35 + i * .16, () => {
          const foes = this.enemies(B, unit); if (!foes.length) return;
          const t = this.anchor(B, foes[i % foes.length]);
          this.beam(B, { x: t.x + 50, y: -30 }, t, white, 13, .4, blue);
          this.impact(B, t, blue, 90, .42, white);
        });
      } else if ((unit._ff7Lv || 1) >= 4) {
        for (let i = 0; i < (this.level() === 0 ? 5 : 11); i++) this.later(B, .25 + i * .2, () => {
          const foes = this.enemies(B, unit); if (!foes.length) return;
          const t = this.anchor(B, foes[i % foes.length]);
          this.slash(B, t, i % 2 ? blue : white, i % 2 ? 48 : -48, 130, .32, blue);
          if (i % 3 === 2) this.impact(B, t, blue, 85, .35, white);
        });
      } else if (target) {
        const t = this.anchor(B, target);
        this.later(B, .28, () => {
          this.beam(B, a, t, blue, 17, .5, white);
          this.impact(B, t, white, 145, .55, blue);
          this.sparks(B, t, blue, 12, 105);
        });
      }
    }
  },

  tifa(unit, B, key) {
    const coral = '#ff866c', gold = '#fff0b5';
    const a = this.anchor(B, unit), target = this.nearest(B, unit);
    this.ring(B, a, coral, 95, .5, gold);
    if (key === 'G' && target) {
      for (let i = 0; i < 5; i++) this.later(B, .1 + i * .13, () => {
        const t = this.anchor(B, target);
        this.slash(B, t, i % 2 ? gold : coral, i % 2 ? 24 : -24, 100, .3, gold);
        this.impact(B, t, coral, 75, .29, gold);
      });
      this.later(B, .8, () => this.sparks(B, this.anchor(B, target), gold, 14, 120));
    } else if (key === 'B') {
      const water = '#8de8ff';
      this.vortex(B, a, water, 160, .7, gold);
      if (target) this.later(B, .35, () => {
        const t = this.anchor(B, target);
        this.slash(B, t, water, -15, 190, .58, gold);
        this.ring(B, t, water, 155, .65, gold);
        this.sparks(B, t, water, 14, 130, 'drop', gold);
      });
    } else if (key === 'W') {
      this.wash(B, '#ffbf91', .75);
      this.vortex(B, a, coral, 175, 1, gold);
      this.sparks(B, a, gold, 15, 100);
      unit._ff7VfxLimitUntil = B.t + 9;
    }
  },

  cait(unit, B, key) {
    const gold = '#ffd36a', cream = '#fff6d5';
    const a = this.anchor(B, unit), foes = this.enemies(B, unit);
    if (key === 'G' && foes.length) {
      const target = foes.slice().sort((x, y) => y.hp - x.hp)[0], t = this.anchor(B, target);
      const diceCount = Math.min(6, (unit._ff7Dice || 2) + 1);
      for (let i = 0; i < diceCount; i++) this.later(B, i * .07, () => {
        const x = a.x + (i - (diceCount - 1) / 2) * 19, y = a.y - 15 - (i % 2) * 17;
        this.glyph(B, { x, y }, ['⚀', '⚁', '⚂', '⚃', '⚄', '⚅'][i], gold, 31, .75);
        this.beam(B, { x, y }, t, cream, 4, .55, gold);
      });
      this.later(B, .4, () => { this.impact(B, this.anchor(B, target), gold, 115, .5, cream); this.sparks(B, t, gold, 12, 90); });
    } else if (key === 'B') {
      this.vortex(B, a, gold, 150, .8, cream);
      this.allies(B, unit).forEach((ally, i) => this.later(B, .08 + i * .06, () => {
        const t = this.anchor(B, ally);
        this.ring(B, t, '#ffb9e0', 100, .75, cream);
        this.sparks(B, t, gold, 8, 70, 'spark', cream);
      }));
    } else if (key === 'W') {
      this.wash(B, '#ffd36a', .85);
      this.vortex(B, a, gold, 205, 1.25, cream);
      ['⚀', '⚄', '★'].forEach((symbol, i) => this.later(B, i * .22, () =>
        this.glyph(B, { x: a.x + (i - 1) * 65, y: a.y - 55 }, symbol, cream, 38, .9)));
      this.later(B, 1, () => this.sparks(B, a, gold, 20, 165, 'spark', cream));
    }
  },

  aerith(unit, B, key) {
    const green = '#9ef2b7', pink = '#ffbedf', cream = '#fff0ca';
    const a = this.anchor(B, unit);
    this.seal(B, a, green, 98, .65, cream);
    if (key === 'G') {
      const target = this.strongest(B, unit, 'mag'); if (!target) return;
      this.later(B, .25, () => {
        const t = this.anchor(B, target);
        this.seal(B, t, pink, 160, 1.1, cream);
        this.spawn(B, 'column', t.x, t.y, { color: pink, hot: cream, size: 90, life: .7 });
        this.sparks(B, t, pink, 13, 100, 'petal', cream);
      });
    } else if (key === 'B') {
      this.wash(B, green, .8);
      this.allies(B, unit).forEach((ally, i) => this.later(B, .08 + i * .08, () => {
        const t = this.anchor(B, ally);
        this.ring(B, t, green, 120, .75, cream);
        this.sparks(B, t, pink, 8, 80, 'petal', cream);
      }));
    } else if (key === 'W') {
      this.wash(B, green, 1.1);
      this.vortex(B, a, green, 220, 1.3, cream);
      this.sparks(B, a, pink, 20, 165, 'petal', cream);
      this.allies(B, unit).forEach((ally, i) => this.later(B, .3 + i * .07, () => {
        const t = this.anchor(B, ally);
        this.impact(B, t, green, 125, .65, cream);
        this.sparks(B, t, pink, 7, 75, 'petal', cream);
      }));
    }
  },

  barret(unit, B, key) {
    const orange = '#ff9c55', cream = '#ffe5a2', purple = '#b6a2ff';
    const a = this.anchor(B, unit), foes = this.enemies(B, unit);
    const target = key === 'B' ? this.highestEnergy(B, unit) : foes.slice().sort((x, y) => y.hp - x.hp)[0];
    this.impact(B, a, orange, 74, .4, cream);
    if (key === 'G' && target) this.later(B, .26, () => {
      const t = this.anchor(B, target);
      this.beam(B, a, t, orange, 24, .55, cream);
      this.impact(B, t, orange, 150, .55, cream);
      this.sparks(B, t, cream, 15, 120);
    });
    else if (key === 'B' && target) this.later(B, .26, () => {
      const t = this.anchor(B, target);
      this.beam(B, a, t, purple, 14, .55, cream);
      this.seal(B, t, purple, 145, .8, cream);
      this.sparks(B, t, purple, 12, 95);
    });
    else if (key === 'P' && foes.length) {
      const t = this.anchor(B, foes[Math.floor(foes.length / 2)]);
      this.later(B, .25, () => this.beam(B, a, t, orange, 8, .38, cream));
      this.later(B, .36, () => { this.impact(B, t, orange, 200, .7, cream); this.sparks(B, t, orange, 18, 155); });
    } else if (key === 'W') {
      this.wash(B, '#ffb36d', .8);
      for (let i = 0; i < 10; i++) this.later(B, i * .13, () => {
        const current = this.enemies(B, unit); if (!current.length) return;
        const t = this.anchor(B, current[i % Math.min(current.length, 3)]);
        this.beam(B, this.anchor(B, unit), t, orange, 7, .3, cream);
        if (i % 2 === 1) this.impact(B, t, orange, 80, .37, cream);
      });
      this.later(B, 1.28, () => {
        const current = this.enemies(B, unit); if (!current.length) return;
        const t = this.anchor(B, current[0]);
        this.impact(B, t, cream, 230, .7, orange);
        this.sparks(B, t, orange, 18, 160);
      });
    }
  },

  sephiroth(unit, B, key) {
    const violet = '#a378ed', pale = '#ead8ff';
    const a = this.anchor(B, unit), foes = this.enemies(B, unit);
    this.seal(B, a, violet, 125, .8, pale);
    this.sparks(B, a, violet, 9, 80, 'feather', pale);
    if (key === 'G') {
      const target = this.strongest(B, unit, 'atk'); if (!target) return;
      this.later(B, .22, () => {
        const t = this.anchor(B, target);
        this.vortex(B, t, violet, 175, 1, pale);
        this.spawn(B, 'column', t.x, t.y, { color: violet, hot: pale, size: 115, life: .7 });
        this.sparks(B, t, violet, 14, 115, 'feather', pale);
      });
    } else if (key === 'B') {
      const target = this.highestEnergy(B, unit); if (!target) return;
      this.later(B, .2, () => {
        const t = this.anchor(B, target);
        this.seal(B, t, pale, 150, .9, violet);
        this.beam(B, { x: t.x, y: -20 }, t, pale, 17, .55, violet);
        this.impact(B, t, violet, 110, .55, pale);
      });
    } else if (key === 'W') {
      this.wash(B, '#6e4aa3', 1.35, true);
      this.vortex(B, { x: B.W / 2, y: B.H * .42 }, violet, 290, 1.55, pale);
      this.later(B, .63, () => foes.filter(e => e.alive).forEach((enemy, i) => {
        const t = this.anchor(B, enemy);
        this.seal(B, t, violet, 120, .75, pale);
        this.spawn(B, 'column', t.x, t.y, { color: violet, hot: pale, size: 90, life: .7 });
        if (i < 5) this.sparks(B, t, violet, 7, 90, 'feather', pale);
      }));
    }
  },

  cast(unit, B, key) {
    if (!this.ready(B)) return;
    const method = this[unit.id === 'CaitSith' ? 'cait' : unit.id.toLowerCase()];
    if (typeof method === 'function') method.call(this, unit, B, key);
  }
};

for (const id of ['Cloud', 'Tifa', 'CaitSith', 'Aerith', 'Barret', 'Sephiroth']) {
  const hero = HEROES[id]; if (!hero) continue;
  for (const key of ['W', 'G', 'B', 'P']) {
    const skill = hero.skills && hero.skills[key];
    if (!skill || typeof skill.cast !== 'function') continue;
    const original = skill.cast;
    skill.cast = function (unit, battle, scaled, params) {
      FF7SkillVFX.cast(unit, battle, key);
      return original.call(this, unit, battle, scaled, params);
    };
  }
}

// Tifa's reel sequence has variable misses and animation lengths. Accent the
// actual connected sprite clips instead of guessing when each strike lands.
const ff7OriginalClip = FF7FX.clip;
FF7FX.clip = function (B, unit, key, options) {
  const result = ff7OriginalClip.call(this, B, unit, key, options);
  if (B && unit && unit.id === 'Tifa' && unit._ff7VfxLimitUntil > B.t &&
      typeof key === 'string' && key.startsWith('tifa-')) {
    const target = FF7SkillVFX.nearest(B, unit);
    if (target) {
      const a = FF7SkillVFX.anchor(B, target);
      const final = key === 'tifa-finalheaven';
      FF7SkillVFX.slash(B, a, final ? '#fff0b5' : '#ff866c', final ? -65 : 34, final ? 225 : 125, .52, '#ffffff');
      FF7SkillVFX.impact(B, a, final ? '#fff0b5' : '#ff866c', final ? 210 : 100, .55, '#ffffff');
      if (final) FF7SkillVFX.sparks(B, a, '#fff0b5', 19, 145);
    }
  }
  return result;
};

// The red passive skills trigger outside the normal cast path.
const ff7OriginalBanner = FF7FX.banner;
FF7FX.banner = function (B, label, tone) {
  const result = ff7OriginalBanner.call(this, B, label, tone);
  if (!FF7SkillVFX.ready(B)) return result;
  if (label === 'Heartless Angel') {
    const unit = B.units.find(u => u.id === 'Sephiroth' && u.alive && u._sephAngel);
    const a = unit ? FF7SkillVFX.anchor(B, unit) : { x: B.W / 2, y: B.H * .43 };
    FF7SkillVFX.wash(B, '#6e4aa3', 1.2, true);
    FF7SkillVFX.vortex(B, a, '#a378ed', 280, 1.3, '#ead8ff');
    FF7SkillVFX.sparks(B, a, '#a378ed', 18, 150, 'feather', '#ead8ff');
  } else if (label === 'Satellite Beam') {
    const unit = B.units.find(u => u.id === 'Barret' && u.alive && u._barretSatellite);
    if (unit) {
      const a = FF7SkillVFX.anchor(B, unit);
      FF7SkillVFX.wash(B, '#ffbb7a', .8);
      FF7SkillVFX.enemies(B, unit).forEach(enemy => {
        const t = FF7SkillVFX.anchor(B, enemy);
        FF7SkillVFX.beam(B, { x: t.x + 40, y: -20 }, t, '#ffe5a2', 14, .6, '#ff9c55');
        FF7SkillVFX.impact(B, t, '#ff9c55', 110, .55, '#ffe5a2');
      });
    }
  }
  return result;
};

;

/* ===== js/ff7-banter.js ===== */
/* Gardenview conversations for the FF7 visitors between Depths floors. */
'use strict';

BANTER.push(
  {
    id: 'ff7-cloud-shelly-tracks',
    cast: ['Cloud', 'Shelly'],
    lines: [
      { who: 'Shelly', text: 'The claw marks stop at the elevator. The footprints do not.' },
      { who: 'Cloud', text: 'Those could be ours.' },
      { who: 'Shelly', text: 'Ours have five toes. These have six, and the weight is all on the front.' },
      { who: 'Cloud', text: 'A Twisted doubled back.' },
      { who: 'Shelly', text: 'It waited for the doors. See the scratches on the inside?' },
      { who: 'Cloud', text: 'Which corner?' },
      { who: 'Shelly', text: 'Left, behind the control panel.' },
      { who: 'Cloud', text: 'Stay behind me when we open it.' },
      { who: 'Shelly', text: 'You do read my field notes.' },
      { who: 'Cloud', text: 'The useful ones.' },
      { who: 'Shelly', text: 'I will take that as a compliment.' }
    ]
  },
  {
    id: 'ff7-tifa-bassie-held-the-door',
    cast: ['Tifa', 'Bassie'],
    lines: [
      { who: 'Bassie', text: 'I froze when the Twisted came around the corner.' },
      { who: 'Tifa', text: 'You called out before it reached Gigi.' },
      { who: 'Bassie', text: 'My voice worked. My feet did not.' },
      { who: 'Tifa', text: 'Then we plan for that. Next time, take my sleeve and move with me.' },
      { who: 'Bassie', text: 'I might slow you down.' },
      { who: 'Tifa', text: 'You noticed it before any of us. I need you watching the corners.' },
      { who: 'Bassie', text: 'Even if I am scared?' },
      { who: 'Tifa', text: 'Especially then. You know what to look for.' },
      { who: 'Bassie', text: 'All right. Your sleeve, then the elevator.' },
      { who: 'Tifa', text: 'Together.' }
    ]
  },
  {
    id: 'ff7-aerith-sprout-cutting',
    cast: ['Aerith', 'Sprout'],
    lines: [
      { who: 'Sprout', text: 'The Twisteds got into the glasshouse. I thought every plant was gone.' },
      { who: 'Aerith', text: 'This one turned away from the ichor.' },
      { who: 'Sprout', text: 'A little cutting. The roots are clean, but the pot is cracked.' },
      { who: 'Aerith', text: 'I have a cup in my bag. It held a flower this morning.' },
      { who: 'Sprout', text: 'You carry a spare flower cup into battle?' },
      { who: 'Aerith', text: 'It was not spare until now.' },
      { who: 'Narrator', text: 'Aerith steadies the cutting while Sprout packs soil around its roots.' },
      { who: 'Sprout', text: 'We cannot take the whole glasshouse.' },
      { who: 'Aerith', text: 'No. We can take this one and come back with help.' },
      { who: 'Sprout', text: 'Cosmo will know where the sunny window is.' },
      { who: 'Aerith', text: 'Then let us get it to him.' }
    ]
  },
  {
    id: 'ff7-caitsith-gigi-loaded-die',
    cast: ['CaitSith', 'Gigi'],
    lines: [
      { who: 'Gigi', text: 'Left passage or right? Let the die decide.' },
      { who: 'CaitSith', text: 'Go on, then. Give it a roll.' },
      { who: 'Gigi', text: 'Six. Right passage.' },
      { who: 'CaitSith', text: 'A fine choice.' },
      { who: 'Gigi', text: 'That die always lands on six.' },
      { who: 'CaitSith', text: 'Only when the left passage has fresh Twisted tracks.' },
      { who: 'Gigi', text: 'You weighted it!' },
      { who: 'CaitSith', text: 'A fortune is no use if I let you walk into the wrong corridor.' },
      { who: 'Gigi', text: 'You could have told me about the tracks.' },
      { who: 'CaitSith', text: 'I did. You made me do it with a die.' },
      { who: 'Gigi', text: '...Fair. Keep the die.' }
    ]
  },
  {
    id: 'ff7-barret-waxwell-elevator',
    cast: ['Barret', 'Waxwell'],
    lines: [
      { who: 'Waxwell', text: 'Stop leaning on the elevator gate. I just repaired that latch.' },
      { who: 'Barret', text: 'Twisted on the other side. Gate needs to hold.' },
      { who: 'Waxwell', text: 'It will. I used the brace you told me to throw away.' },
      { who: 'Barret', text: 'I said it was bent.' },
      { who: 'Waxwell', text: 'And now it is bent in precisely the right direction.' },
      { who: 'Narrator', text: 'A blow rattles the gate. The latch stays shut.' },
      { who: 'Barret', text: 'Good work.' },
      { who: 'Waxwell', text: 'Obviously. I did not need a man with a cannon to tell me.' },
      { who: 'Barret', text: 'Still gonna tell you. You fixed my arm out in Corel, too.' },
      { who: 'Waxwell', text: 'There were monsters in my way.' },
      { who: 'Barret', text: 'Sure there were. Help me get the others upstairs.' },
      { who: 'Waxwell', text: '...The service stairs are clear. Follow me.' }
    ]
  },
  {
    id: 'ff7-sephiroth-connie-east-stairs',
    cast: ['Sephiroth', 'Connie'],
    lines: [
      { who: 'Connie', text: 'There is a Twisted behind that wall. It keeps striking where your shadow falls.' },
      { who: 'Sephiroth', text: 'Then the wall is less useful than it looks.' },
      { who: 'Connie', text: 'The others are coming down this hall.' },
      { who: 'Sephiroth', text: 'Send them to the east stairs.' },
      { who: 'Connie', text: 'For their sake?' },
      { who: 'Sephiroth', text: 'I intend to use this passage.' },
      { who: 'Connie', text: 'At least that is an honest answer.' },
      { who: 'Sephiroth', text: 'You can pass through the wall. Tell me how many are inside.' },
      { who: 'Connie', text: 'I will warn the others first. Then I might tell you.' },
      { who: 'Sephiroth', text: 'Do not take long.' },
      { who: 'Connie', text: 'Then do not follow me.' }
    ]
  },
  {
    id: 'ff7-cloud-tifa-vee-screen',
    cast: ['Cloud', 'Tifa', 'Vee'],
    lines: [
      { who: 'Vee', text: 'The camera caught a Twisted near Dandy’s shop. I can get a clearer frame.' },
      { who: 'Cloud', text: 'Leave it. We know where it is.' },
      { who: 'Vee', text: 'You know where it was. The feed is thirty seconds old.' },
      { who: 'Tifa', text: 'Vee, can you see the elevator doors?' },
      { who: 'Vee', text: 'Yes. Still open.' },
      { who: 'Tifa', text: 'Then call the others back before it crosses the lobby.' },
      { who: 'Cloud', text: 'I will take the shop side.' },
      { who: 'Tifa', text: 'I will cover the elevator. No one fights alone.' },
      { who: 'Vee', text: 'I can lock the shop shutters from here. Three seconds.' },
      { who: 'Cloud', text: 'Do it.' },
      { who: 'Vee', text: 'Done. Now you can both stop arguing with my camera.' },
      { who: 'Tifa', text: 'We were listening to it.' }
    ]
  },
  {
    id: 'ff7-aerith-barret-sprout-nursery',
    cast: ['Aerith', 'Barret', 'Sprout'],
    lines: [
      { who: 'Sprout', text: 'The nursery door will not hold another hit.' },
      { who: 'Barret', text: 'Get behind me. I can brace it.' },
      { who: 'Aerith', text: 'There is a second exit behind those shelves.' },
      { who: 'Sprout', text: 'It is packed with trays. I can clear it.' },
      { who: 'Barret', text: 'Take the seedlings you can carry. Leave the rest.' },
      { who: 'Sprout', text: 'I know. I am going.' },
      { who: 'Aerith', text: 'I will help you move the shelves. Barret, tell us when the Twisted pulls back.' },
      { who: 'Barret', text: 'You will hear me.' },
      { who: 'Narrator', text: 'The door shudders. Barret holds it while Aerith and Sprout open the rear path.' },
      { who: 'Barret', text: 'Now! It stepped away!' },
      { who: 'Sprout', text: 'Last tray is through!' },
      { who: 'Aerith', text: 'Then you come through too, Barret.' },
      { who: 'Barret', text: 'Right behind you.' }
    ]
  }
);

