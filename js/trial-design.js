/* Distinct, predictable challenges for the eight stages inside Choose Stage. */
'use strict';

const TrialDesign = {
  stages: [
    { name: 'Opening Act', icon: '✦', type: 'SKIRMISH', rule: 'Three foes. Your team opens with full Energy.', objective: 'Defeat the trio', mods: [], count: 3, time: 150, energy: 100, enemyEnergy: 25, bg: 'maps/rainbow-rooms.png', color: '#a8ed9c' },
    { name: 'Glass House', icon: '◇', type: 'DAMAGE RACE', rule: 'Everyone has less HP and hits harder.', objective: 'Win before your team shatters', mods: ['thin'], count: 4, time: 135, energy: 65, enemyEnergy: 45, bg: 'maps/art-floor.png', color: '#ffb49c' },
    { name: 'Blackout', icon: '☾', type: 'PRECISION', rule: 'Broken lights lower Accuracy for both sides.', objective: 'Fight through the misses', mods: ['dark'], count: 5, time: 165, energy: 70, enemyEnergy: 45, bg: 'maps/warehouse.png', color: '#9cc7ff' },
    { name: 'The Captain', icon: '♛', type: 'MINI BOSS', rule: 'A Twisted captain leads a shielded squad.', objective: 'Break the captain’s guard', mods: ['shielded'], count: 5, captain: true, time: 170, energy: 75, enemyEnergy: 50, bg: 'maps/shelly-floor.png', color: '#ffe38d' },
    { name: 'Hold the Line', icon: '⌛', type: 'SURVIVAL', rule: 'Poison spreads while foes regenerate. Survive 75 seconds or clear the room.', objective: 'Survive 75 seconds', mods: ['rot', 'regrowth'], count: 5, time: 75, timeoutWin: true, energy: 70, enemyEnergy: 45, bg: 'maps/greenhouse.png', color: '#b8e786' },
    { name: 'Power Circuit', icon: 'ϟ', type: 'SKILL CLASH', rule: 'Both teams start with full Energy in a Static Field.', objective: 'Time your skills', mods: ['static'], count: 5, time: 150, energy: 100, enemyEnergy: 100, tempo: 1.5, enemyTempo: 1.5, bg: 'maps/vee-floor.png', color: '#bba6ff' },
    { name: 'Rush Hour', icon: '»', type: 'SPEED RUN', rule: 'Twisteds attack faster. Beat the 100-second clock.', objective: 'Clear in 100 seconds', mods: ['flood'], count: 5, time: 100, energy: 80, enemyEnergy: 65, bg: 'maps/warehouse.png', color: '#ffad76' },
    { name: 'Final Encore', icon: '★', type: 'BOSS FINALE', rule: 'A boss and armored allies stand between you and the final reward.', objective: 'Defeat the boss', mods: ['armored'], count: 5, time: 180, energy: 85, enemyEnergy: 70, bg: 'maps/art-floor.png', color: '#ffcf78' }
  ],
  stage(index) { return this.stages[Math.max(0, Math.min(this.stages.length - 1, index | 0))]; },
  foeCount(trial, index) { return trial.endgame ? 5 : this.stage(index).count; },
  pressure(trial, index) {
    let intensity = 0;
    if (trial.endgame) {
      const tier = trial.apexTier || 800;
      const tierStrength = tier >= 800 ? 1 : tier >= 700 ? .72 : .48;
      intensity = tierStrength * (.45 + index * .09);
    } else {
      // A level-800 weekly team should still face a harder final stretch.
      const mastery = Number(Save.data.mastery) || 1;
      intensity = Math.max(0, Math.min(1, (mastery - 550) / 250))
        * Math.max(0, (index - 3) / 4) * .68;
    }
    return { hp: 1 + .24 * intensity, atk: 1 + .17 * intensity,
      def: 1 + .10 * intensity, intensity };
  },
  extraMods(trial, index) {
    const mods = [];
    if ((trial.endgame && index >= 5) ||
      (!trial.endgame && (Number(Save.data.mastery) || 0) >= 700 && index >= 6)) mods.push('vengeful');
    if (trial.endgame && (trial.apexTier || 800) >= 800 && index >= 6) mods.push('glacial');
    return mods;
  },
  rule(trial, index) {
    const plan = this.stage(index);
    return trial.endgame && index === 0
      ? 'Five foes. Your team opens with full Energy.'
      : trial.endgame && index === 1
        ? 'Five elite foes. Everyone has less HP and hits harder.'
        : plan.rule;
  },
  pressureText(trial, index) {
    const scale = this.pressure(trial, index);
    const parts = [];
    if (scale.intensity > .01) parts.push(`FOES +${Math.round((scale.hp - 1) * 100)}% HP · +${Math.round((scale.atk - 1) * 100)}% ATK · +${Math.round((scale.def - 1) * 100)}% DEF`);
    const mods = this.extraMods(trial, index);
    if (mods.includes('vengeful')) parts.push('FALLEN FOES EMPOWER SURVIVORS');
    if (mods.includes('glacial')) parts.push('FORTIFY GROWS EVERY 8S');
    return parts.join(' · ');
  },
  recommendedPower(trial, index) {
    const base = Progress.recommendedPower(Trials.enemyLevel(trial, index),
      { factor: trial.endgame ? 1.15 : 1 });
    return Math.round(base * (1 + .20 * this.pressure(trial, index).intensity));
  },
  background(trial, index) {
    return trial.apexBg ? ASSET + trial.apexBg : Art.bg(this.stage(index).bg);
  },
  meta(trial, index) {
    const plan = this.stage(index);
    return {
      title: `${trial.name} · ${plan.name}`,
      bg: this.background(trial, index),
      mods: plan.mods.concat(this.extraMods(trial, index)),
      timeLimit: plan.time,
      timeoutWin: !!plan.timeoutWin,
      trialId: trial.id,
      trialStage: index,
      skillStartEnergy: plan.energy,
      enemySkillStartEnergy: plan.enemyEnergy,
      skillTempo: plan.tempo || (trial.endgame ? 1.38 : 1.25),
      enemySkillTempo: plan.enemyTempo || (trial.endgame ? 1.38 : 1.25),
      postIntroCue: trial.endgame ? 'apex_trial_warning' : null
    };
  }
};

const originalTrialEnemies = Trials.makeEnemies;
Trials.makeEnemies = function (trial, stage) {
  if (trial.id === 'grind') return originalTrialEnemies.call(this, trial, stage);
  const plan = TrialDesign.stage(stage);
  const foes = originalTrialEnemies.call(this, trial, stage).slice(0, TrialDesign.foeCount(trial, stage));
  // Rare Apex visitors can replace the original finale boss. Keep a boss in
  // the promised boss stage without removing the rare encounter from slot 1.
  const needsBoss = plan.captain || stage === Trials.STAGES - 1 &&
    !foes.some(spec => spec.boss || spec.isBoss || spec.collabBoss);
  if (needsBoss) {
    const bosses = BOSSES.filter(b => !b.eventOnly);
    if (bosses.length) {
      const boss = seeded(`trial-boss:${currentWeek()}:${trial.id}:${stage}`).pick(bosses);
      const levelScale = plan.captain ? 1.04 : 1.10;
      const spec = makeTwisted(boss.id, Math.round(this.enemyLevel(trial, stage) * levelScale), 'boss');
      spec.boss = boss;
      spec.name = (plan.captain ? 'Captain ' : 'Twisted ') + HEROES[boss.id].name;
      foes[foes.length - 1] = equipEnemyLoadout(spec, 24 + stage * 8,
        seeded(`trial-boss-loadout:${currentWeek()}:${trial.id}:${stage}`),
        { trinketCount: trial.endgame ? 3 : 1, rank: trial.endgame ? 4 : 2,
          badgeChance: trial.endgame ? .9 : .35, badgeLvl: trial.endgame ? 4 : 1 });
    }
  }
  const scale = TrialDesign.pressure(trial, stage);
  if (scale.intensity > .01) foes.forEach(spec => {
    const original = spec.mult || {};
    spec.mult = Object.assign({}, original, {
      hp: (original.hp == null ? 1 : original.hp) * scale.hp,
      atk: (original.atk == null ? 1 : original.atk) * scale.atk,
      def: (original.def == null ? 1 : original.def) * scale.def,
      mag: original.mag == null ? null : original.mag * scale.atk,
      mdef: original.mdef == null ? null : original.mdef * scale.def
    });
  });
  return foes;
};

const originalTrialInfo = Screens.trialInfo;
Screens.trialInfo = function (trial) {
  originalTrialInfo.call(this, trial);
  const modal = $('#modalBox');
  // The picker starts from the active squad, filtered by this Trial's rules.
  // Compare that squad here as well; the strongest owned Heroes may not be deployed.
  const eligible = (Save.data.team || []).filter(id => id && Save.owns(id) && trialAllows(trial, id)).slice(0, 5);
  const eligiblePower = Progress.teamPower(eligible);
  const readout = $('.stage-power-readout', modal);
  if (readout) {
    const labels = $$('small', readout);
    const values = $$('b', readout);
    const recommended = TrialDesign.recommendedPower(trial, Math.min(Trials.state(trial.id).stage, Trials.STAGES - 1));
    if (labels[0]) labels[0].textContent = 'ACTIVE ELIGIBLE POWER';
    if (values[0]) values[0].textContent = fmt(eligiblePower);
    if (values[1]) values[1].textContent = fmt(recommended);
    readout.classList.toggle('under', eligiblePower < recommended);
    const state = $('em', readout);
    if (state) state.textContent = eligiblePower < recommended ? 'BELOW TARGET' : 'AT TARGET';
  }
  $$('.trial-stage-row', modal).forEach((row, index) => {
    const plan = TrialDesign.stage(index);
    const copy = $('.trial-stage-copy', row);
    const title = copy && $('b', copy);
    const rewardNote = copy && $('i', copy);
    const thumb = $('.trial-stage-thumb', row);
    const action = row.closest('.trial-stage-action-row');
    if (title) title.textContent = `${plan.icon} ${plan.name}`;
    if (rewardNote) rewardNote.textContent = TrialDesign.rule(trial, index);
    if (thumb) thumb.style.backgroundImage = `linear-gradient(90deg,#10171855,#101718aa),url("${TrialDesign.background(trial, index)}")`;
    if (action) {
      action.style.setProperty('--stage-accent', plan.color);
      action.dataset.stageType = plan.type;
      const label = el('span', 'trial-stage-challenge', `${plan.type} · ${plan.objective}`);
      copy.appendChild(label);
      const pressure = TrialDesign.pressureText(trial, index);
      if (pressure) copy.appendChild(el('span', 'trial-stage-pressure', pressure));
    }
    const power = $('.stage-power-label', row);
    if (power) {
      const recommended = TrialDesign.recommendedPower(trial, index);
      power.textContent = `${fmt(recommended)} POWER`;
      power.classList.toggle('under', eligiblePower < recommended);
    }
    row.title = `${plan.name}: ${TrialDesign.rule(trial, index)} ${TrialDesign.pressureText(trial, index)}`;
  });
};

// A survival clear pays for the objective, but living foes did not drop loot.
const originalTrialRareLoot = Trials.rareEventLoot;
Trials.rareEventLoot = function (battle, trial) {
  if (!battle || !Array.isArray(battle.units)) return;
  const defeated = Object.assign({}, battle, {
    units: battle.units.filter(unit => unit.team !== TEAM_E || !unit.alive)
  });
  return originalTrialRareLoot.call(this, defeated, trial);
};

const originalTrinketDrops = Depths.trinketDrops;
Depths.trinketDrops = function (battle, options) {
  if (!battle || !battle.meta || battle.meta.trialStage == null || !Array.isArray(battle.units))
    return originalTrinketDrops.call(this, battle, options);
  const defeated = Object.assign({}, battle, {
    units: battle.units.filter(unit => unit.team !== TEAM_E || !unit.alive)
  });
  return originalTrinketDrops.call(this, defeated, options);
};

Screens.trialFight = function (trial, stage, team) {
  const serviceWeek = currentWeek();
  const meta = TrialDesign.meta(trial, stage);
  const b = BattleScreen.launch({
    team: playerTeamSpecs(team),
    foes: Trials.makeEnemies(trial, stage),
    music: trial.apexMusic || undefined,
    meta,
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
};

RaidTicket.trialMeta = function (trial, stage) {
  return Object.assign(TrialDesign.meta(trial, stage), {
    title: `${trial.name} · ${TrialDesign.stage(stage).name} · Raid Ticket`,
    floorLabel: trial.name + ' · Raid Sim'
  });
};
