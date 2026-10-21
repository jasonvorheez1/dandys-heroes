/* screens/arena.js - animated Colosseum ladder and battle hand-off. */
'use strict';

function arenaCrowd(count) {
  return Array.from({ length: count || 36 }, (_, i) => `<i style="--crowd:${i};--delay:${(i % 9) * -.19}s;--h:${32 + (i % 4) * 7}px;--lean:${(i % 3 - 1) * 12}deg"></i>`).join('');
}

function arenaPortraits(ids, enemy) {
  return ids.filter(Boolean).slice(0, 5).map(id => `<img src="${Art.icon(id)}" alt="${HEROES[id].name}" class="${enemy ? 'enemy' : ''}">`).join('');
}

Object.assign(Screens, {

  /* ============================================================ ARENA */
  arena(s) {
    const a = Arena.today();
    const stage = el('section', 'arena-colosseum' + (this._arenaReturn ? ' returning' : ''));
    stage.id = 'arenaColosseum';
    stage.innerHTML = `<div class="arena-sky"></div><div class="arena-crowd">${arenaCrowd(42)}</div>
      <div class="arena-sand"><i></i><i></i><i></i></div><div class="arena-vignette"></div>`;

    const top = el('header', 'arena-marquee');
    top.innerHTML = `<div class="arena-laurel">✦</div><div class="arena-title"><small>GARDENVIEW GRAND</small><h1>COLOSSEUM</h1><span>THE CROWD IS WAITING</span></div>
      <div class="arena-record"><small>CURRENT RANK</small><b>#${fmt(a.rank)}</b><span>${a.wins}W · ${a.losses}L</span><em>🪙 ${fmt(Save.res('arenaCoin'))}</em></div>`;
    stage.appendChild(top);

    const reward = Arena.rewards();
    const briefing = el('section', 'arena-briefing');
      briefing.innerHTML = `<div><small>TONIGHT'S PURSE</small><b>${RES.ichor.icon} ${fmt(reward.ichor)} ICHOR · ${RES.exp.icon} ${fmt(reward.exp)} EXP · ${RES.core.icon} ${fmt(reward.core)} CORES · 🪙 ${fmt(reward.arenaCoin)}</b><span>Choose an attacker team to challenge the bot ladder and naturally rotated saved player defenses.</span></div>
      <button class="arena-refresh" title="Spend 1,500 Ichor for new challengers">↻<small>NEW CHALLENGERS · ${RES.ichor.icon} 1,500</small></button>`;
    $('.arena-refresh', briefing).onclick = () => {
      if (!Save.spend({ ichor: 1500 })) { UI.toast('Not enough Ichor'); Sound.play('ui_err'); return; }
      Save.data.arena.opponents = Arena.generate(dayIndex() + rndi(1, 9999));
      Save.write(); Sound.play('cheer'); this.render();
    };
    stage.appendChild(briefing);

    const live = el('section', 'arena-live');
    live.id = 'arenaLive';
    stage.appendChild(live);
    if (typeof ArenaLive !== 'undefined') ArenaLive.mount(live);

    const challenges = el('div', 'arena-challenges');
    a.opponents.forEach((opp, index) => {
      const specs = Arena.specs(opp);
      const card = el('article', 'arena-challenge' + (opp.beaten ? ' beaten' : ''));
      card.style.setProperty('--card-delay', (index * .11) + 's');
      const roster = el('div', 'arena-opponent-roster');
      opp.team.forEach((id, i) => {
        const spec = specs[i], fighter = el('button', 'arena-fighter');
        const rarityText = rarityLabel(spec.rarity, spec.rarityPlus);
        fighter.classList.add(`rarity-border-${spec.rarity}`);
        if (spec.rarity >= 6) fighter.classList.add('rarity-rainbow');
        fighter.innerHTML = `<img src="${Art.icon(id)}" alt="${HEROES[id].name}"><strong class="arena-rarity-badge">${rarityText}</strong><span>LV ${spec.level}</span>${enemyLoadoutChips(spec)}`;
        fighter.title = `${HEROES[id].name} · ${rarityText} · Lv ${spec.level} · ${spec.stars || 1}★ · Skill Lv ${spec.skillLv} · ${enemyLoadoutText(spec)}`;
        bindEnemyPreview(fighter, spec, () => UI.toast(`${HEROES[id].name} · ${rarityText} · Lv ${spec.level} · ${spec.stars || 1}★ · Skill Lv ${spec.skillLv} · ${enemyLoadoutText(spec)}`));
        roster.appendChild(fighter);
      });
      const avg = Math.round(sum(opp.levels) / opp.levels.length);
      card.innerHTML = `<div class="arena-challenge-head"><small>${opp.saved ? 'SAVED DEFENDER' : `DEFENDER ${index + 1}`}</small><span class="arena-role-pill">${opp.saved ? 'PLAYER SNAPSHOT' : 'DEFENDER TEAM'}</span>${opp.tag ? `<span class="arena-tag ${opp.tag}">${opp.label}</span>` : '<span class="arena-tag">LADDER</span>'}</div>
        <div class="arena-challenger"><b>${opp.name}</b><span>Rank #${fmt(opp.rank)} · Avg Lv ${avg}</span></div>`;
      card.appendChild(roster);
      const fight = el('button', 'arena-fight' + (opp.beaten ? ' rematch' : ''), opp.beaten ? 'RE-ATTACK' : 'ATTACK DEFENDER');
      fight.onclick = () => this.arenaFight(opp);
      card.appendChild(fight);
      challenges.appendChild(card);
    });
    stage.appendChild(challenges);

    const exchange = el('section', 'arena-exchange');
    exchange.innerHTML = `<header><div><small>GRAND COLOSSEUM</small><h2>ARENA EXCHANGE</h2></div><b>🪙 ${fmt(Save.res('arenaCoin'))}</b></header>`;
    const offers = el('div', 'arena-exchange-offers');
    Arena.coinStore().forEach(offer => {
      const key = Object.keys(offer.gain)[0], amount = offer.gain[key], res = RES[key];
      const buy = el('button', 'arena-exchange-offer');
      buy.disabled = Save.res('arenaCoin') < offer.cost;
      buy.innerHTML = `<i>${res.icon}</i><span><b>${fmt(amount)} ${res.name}</b><small>🪙 ${offer.cost}</small></span>`;
      buy.onclick = () => {
        const out = Arena.buyCoinOffer(offer.id);
        if (!out.ok) { UI.toast(out.reason); Sound.play('ui_err'); return; }
        Sound.play('coin'); UI.toast(`Exchanged 🪙 ${offer.cost} for ${res.icon} ${fmt(amount)} ${res.name}.`); this.render();
      };
      offers.appendChild(buy);
    });
    exchange.appendChild(offers); stage.appendChild(exchange);
    s.appendChild(stage);

    requestAnimationFrame(() => stage.classList.add('entered'));
    if (!this._arenaMounted) {
      this._arenaMounted = true;
      Sound.play('arena_fanfare', { vol: .36 });
      Sound.play('arena_crowd', { vol: .26, delay: 260 });
    }
    if (this._arenaReturn) {
      const note = el('div', 'arena-return-note', this._arenaReturn);
      stage.appendChild(note); Sound.play('cheer_big', { vol: .56 });
      this._arenaReturn = null;
      setTimeout(() => note.remove(), 1800);
    }
  },

  leaveArena(next) {
    const stage = $('#arenaColosseum');
    if (!stage) { this.go(next, { skipArenaExit: true }); return; }
    if (typeof ArenaLive !== 'undefined') ArenaLive.unmount();
    stage.classList.add('arena-leaving'); Sound.play('arena_gate', { vol: .48 });
    this._arenaMounted = false;
    setTimeout(() => this.go(next, { skipArenaExit: true }), 430);
  },

  arenaMatchIntro(opp, chosenTeam, launch) {
    const layer = el('div', 'arena-match-intro');
    const myIds = chosenTeam.filter(Boolean), rivalIds = opp.team.filter(Boolean);
    layer.innerHTML = `<div class="arena-intro-bg"></div><div class="arena-intro-crowd">${arenaCrowd(52)}</div>
      <div class="arena-intro-copy"><small>THE CROWD RISES</small><b>MAKE SOME NOISE!</b></div>
      <div class="arena-versus"><section class="arena-intro-side player"><small>ATTACKER TEAM</small><div>${arenaPortraits(myIds)}</div></section>
      <strong>VS</strong><section class="arena-intro-side rival"><small>DEFENDER TEAM</small><div>${arenaPortraits(rivalIds, true)}</div><b>${opp.name}</b></section></div>
      <div class="arena-intro-bell">⚔</div>`;
    $('#app').appendChild(layer);
    Music.play('arena'); Sound.play('arena_fanfare', { vol: .52 }); Sound.play('arena_crowd', { vol: .56, delay: 180 });
    requestAnimationFrame(() => layer.classList.add('play'));
    setTimeout(() => { layer.classList.add('depart'); Sound.play('arena_gate', { vol: .55 }); }, 1450);
    setTimeout(() => { layer.remove(); launch(); }, 1920);
  },

  arenaFight(opp, chosenTeam) {
    if (opp && opp.saved && opp.savedDefense) return this.arenaDefenseFight(opp.savedDefense, chosenTeam);
    if (!chosenTeam) {
      this.openTeamEditor(null, team => this.arenaFight(opp, team),
        `Predetermined PvP · Attack ${opp.name}`, { persist: true, confirmLabel: 'Deploy Attacker' });
      return;
    }
    const team = playerTeamSpecs(chosenTeam);
    if (!team.length) { UI.toast('Set a team first'); Sound.play('ui_err'); return; }
    const reward = Arena.rewards();
    this.arenaMatchIntro(opp, chosenTeam, () => {
      BattleScreen.launch({
        team, foes: Arena.specs(opp), music: 'arena',
        meta: { title: 'Predetermined PvP · ' + opp.name, bg: 'uploads/arenabackground.png', floorLabel: 'PREDETERMINED PVP · ATTACKER VS DEFENDER', arenaPvP: true, skillStartEnergy: 18, enemySkillStartEnergy: 0 },
        rewards: () => reward,
        onDone: res => {
          if (!res.quit) {
            Arena.resolve(opp, res.win, reward);
            if (res.win) payoutBattle(chosenTeam, {}, { mastery: 100, pass: 0 });
          }
          this._arenaReturn = res.win ? 'VICTORY LAP · THE CROWD ERUPTS!' : 'THE GATES OPEN · TRAIN AND RETURN.';
          this.render();
        }
      });
    });
  }
});
