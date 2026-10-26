/* The Petal Rush card and its live, non-raid battle entry. */
'use strict';

Object.assign(Screens, {
  codebaseCard() {
    const state = Codebase.state();
    const remaining = Codebase.LIMIT - state.attempts;
    const card = el('article', 'trial-card codebase-card');
    card.style.setProperty('--trial-accent', '#c690e9');
    card.style.setProperty('--trial-deep', '#2a1d45');
    card.style.backgroundImage = `linear-gradient(180deg,rgba(8,11,13,.15),#2a1d45ee),url("${Art.bg('maps/greenhouse.png')}")`;
    card.innerHTML = `<div class="trial-card-top">
        <div class="trial-card-name">PETAL RUSH<small>DAILY DAMAGE RACE</small></div>
      </div>
      <div class="trial-art"><img src="${ASSET + CODEBASE_ART}" alt="Whispering Flower"></div>
      <div class="trial-card-foot">
        <div class="trial-rule">Deal as much damage as you can. Rage levels and damage milestones pay EXP and rewards.</div>
        <div class="trial-count">${remaining} / ${Codebase.LIMIT} TRIES · BEST RAGE ${state.best} / ${Codebase.MAX_RAGE}</div>
        <div class="trial-count">RESETS IN <b id="codebaseReset">--</b></div>
        <button type="button" class="trial-play codebase-enter${remaining && Save.ownedIds().length ? '' : ' need'}" ${remaining && Save.ownedIds().length ? '' : 'disabled'}>${remaining ? 'ENTER' : 'BACK TOMORROW'}</button>
      </div>`;
    $('.codebase-enter', card).onclick = () => this.codebaseSetup();
    return card;
  },

  codebaseSetup() {
    if (!Codebase.remaining()) { UI.toast('All three Petal Rush attempts used today'); Sound.play('ui_err'); return; }
    if (!Save.ownedIds().length) { UI.toast('Recruit a Hero first'); Sound.play('ui_err'); return; }
    this.openTeamEditor(() => true, team => this.codebaseFight(team), 'Petal Rush · Any Hero',
      { persist: false, confirmLabel: 'Enter Petal Rush' });
  },

  codebaseFight(team) {
    if (!Codebase.remaining()) { UI.toast('All three Petal Rush attempts used today'); this.render(); return; }
    const chosen = (team || []).filter(id => id && Save.owns(id)).slice(0, 5);
    if (!chosen.length) { UI.toast('Pick at least one Hero'); this.render(); return; }
    const run = Codebase.newRun(Codebase.state().attempts + 1);
    const battle = BattleScreen.launch({
      team: playerTeamSpecs(chosen),
      foes: [Codebase.flowerSpec()],
      codebase: true,
      meta: {
        title: 'Petal Rush', floorLabel: 'Petal Rush',
        encounteredLabel: 'Whispering Flower', survivedLabel: 'Rage 0 / 30',
        bg: Art.bg('maps/greenhouse.png'), timeLimit: 50, timeoutWin: true, codebase: true,
        skillStartEnergy: 55, skillTempo: 1.18
      },
      rewardOnLoss: true,
      rewards: () => Codebase.rewards(run),
      onReady: active => Codebase.attach(active, run),
      onDone: result => {
        const hud = $('#codebaseHud'); if (hud) hud.remove();
        if (!result.quit) {
          const reward = Codebase.rewards(run);
          Codebase.finish(run);
          if (run.rage) {
            if (result.win) payoutBattle(chosen, reward, { mastery: 110 + run.rage * 30, pass: 30 + run.rage * 4 });
            else {
              Save.give(reward);
              Save.addMasteryXp(60 + run.rage * 18);
              Pass.addXp(15 + run.rage * 2);
              Save.write();
            }
            UI.toast(`Rage ${run.rage} · ${fmt(run.total)} damage`);
          }
        }
        this.render();
      }
    });
    if (battle) Codebase.spendAttempt();
  }
});
