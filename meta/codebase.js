/* Petal Rush: a daily damage-race Trial against the Whispering Flower. */
'use strict';

const CODEBASE_ART = 'uploads/whispering-flower.png';
SPECIAL_HERO_ART.WhisperingFlower = CODEBASE_ART;
SPECIAL_HERO_ICONS.WhisperingFlower = CODEBASE_ART;

// This encounter-only definition is registered after the playable roster is
// snapshotted. It can use the ordinary battle AI without entering crates,
// collection counts, random Twisted pools, or raid simulations.
defHero({
  id: 'WhisperingFlower', name: 'Whispering Flower', icon: 'WhisperingFlower',
  folder: null, file: null, twistedOnly: true, role: 'Control', tier: 'SS',
  element: 'Fire / Earth', scale: 3.6, // a giant that towers over the field
  base: { hp: 5400, atk: 420, def: 480, mag: 700, mdef: 480, spd: 120, acc: 220, eva: 70 },
  growth: { hp: .09, atk: .075, def: .08, mag: .09, mdef: .08 },
  hidden: { range: 480, aspd: 1.05, ms: 48, aggro: 2, crit: .05, critDmg: 1.5,
    healPow: 1, shieldPow: 1, cdr: 0, ccRes: .78, kbRes: 1,
    armorPen: 0, magPen: .1 },
  move: { gait: 'float', bob: 4, freq: .9, lean: 3, squash: .03,
    idle: 'breathe', step: 'step', particles: 'sparkle', pcol: '#9f80df', brake: .8 },
  basic: { name: 'Water Whisper', type: 'magic', ratio: .9, range: 480,
    proj: 'orb', pcol: '#74d9ef', sfx: 'whoosh', hit: 'hit_magic', wind: .28,
    onHit: (u, target, battle) => {
      if (chance(.4)) battle.applyStatus(u, target, 'slow', 3);
    } },
  skills: {}
});

const Codebase = {
  LIMIT: 3,
  MAX_RAGE: 30,
  MIN_MASTERY: 100,
  unlocked() { return (Number(Save.data.mastery) || 1) >= this.MIN_MASTERY; },
  REWARD_MULT: 2.5,

  state() {
    const today = dayIndex();
    let state = Save.data.codebase;
    if (!state || typeof state !== 'object' || Array.isArray(state))
      state = Save.data.codebase = { day: today, attempts: 0, best: 0 };
    state.best = clamp(Math.floor(Number(state.best) || 0), 0, this.MAX_RAGE);
    if (state.day !== today) {
      state.day = today;
      state.attempts = 0;
      Save.write();
    }
    state.attempts = clamp(Math.floor(Number(state.attempts) || 0), 0, this.LIMIT);
    return state;
  },
  remaining() { return this.LIMIT - this.state().attempts; },
  spendAttempt() {
    const state = this.state();
    if (state.attempts >= this.LIMIT) return false;
    state.attempts++;
    Save.write();
    return true;
  },
  flowerSpec() {
    const level = clamp(Math.round((Number(Save.data.mastery) || 1) * 1.15), 1, 800);
    return { id: 'WhisperingFlower', name: 'Whispering Flower', level,
      kind: 'boss', rarity: 4, rarityPlus: 1, stars: 3, skillLv: level,
      immovable: true, artSrc: ASSET + CODEBASE_ART,
      mult: { hp: 3, atk: 1.8, mag: 1.8, def: 1.5, mdef: 1.5 } };
  },
  MILESTONES: [
    { x: 1, rewards: { exp: .5, ichor: .5, tape: 10 } },
    { x: 2, rewards: { exp: .8, ichor: .8, notes: 12, counterToken: 1 } },
    { x: 3, rewards: { exp: 1.2, ichor: 1.2, manual: 2, star: 10 } },
    { x: 5, rewards: { exp: 1.8, ichor: 1.6, manual: 4, raidTicket: 1 } },
    { x: 8, rewards: { exp: 2.6, ichor: 2.2, manual: 6, core: 1, ticket: 1 } },
    { x: 12, rewards: { exp: 3.4, ichor: 3, core: 2, star: 20, gold: 1 } },
    { x: 16, rewards: { exp: 4.4, ichor: 3.8, core: 2, manual: 8, raidTicket: 2 } },
    { x: 24, rewards: { exp: 6, ichor: 5, core: 3, gold: 2, ticket: 2 } },
    { x: 30, rewards: { exp: 8, ichor: 6.5, core: 4, manual: 12, elevatorTicket: 1 } },
    { x: 55, rewards: { exp: 12, ichor: 9, core: 5, diamond: 2, raidTicket: 3 } },
    { x: 80, rewards: { exp: 16, ichor: 12, core: 6, manual: 18, main: 1 } },
    { x: 100, rewards: { exp: 20, ichor: 15, core: 8, diamond: 3, ticket: 4 } },
    { x: 140, rewards: { exp: 26, ichor: 19, core: 10, manual: 24, raidTicket: 5 } },
    { x: 180, rewards: { exp: 34, ichor: 24, core: 12, diamond: 5, elevatorTicket: 2 } },
    { x: 250, rewards: { exp: 44, ichor: 30, core: 15, main: 2, manual: 30 } },
    { x: 320, rewards: { exp: 56, ichor: 38, core: 20, diamond: 8, raidTicket: 8 } },
    { x: 450, rewards: { exp: 72, ichor: 48, core: 25, main: 3, manual: 40, elevatorTicket: 3 } },
    { x: 600, rewards: { exp: 100, ichor: 65, core: 35, diamond: 12, main: 5, raidTicket: 12 } }
  ],
  expUnit() { return 60000 + Math.round(clamp(Number(Save.data.mastery) || 1, 1, 800) * 1500); },
  milestoneGoal(boss, i) { return Math.round(boss.max.hp * this.MILESTONES[i].x); },
  newRun(attempt) {
    return { day: dayIndex(), attempt, rage: 0, damage: 0, total: 0, milestone: 0,
      rewards: { exp: 0, ichor: 0, tape: 0, notes: 0, star: 0, core: 0, manual: 0, diamond: 0, gold: 0, main: 0, ticket: 0, raidTicket: 0, elevatorTicket: 0, counterToken: 0 },
      rng: seeded(`codebase:${dayIndex()}:${attempt}:${Save.data.mastery}`), castTurn: 0 };
  },
  threshold(boss, rage) {
    return Math.max(180, Math.round(boss.max.hp * (.075 + rage * .006)));
  },
  rewardForLevel(run, rage) {
    const fifth = rage % 5 === 0;
    const mastery = clamp(Number(Save.data.mastery) || 1, 1, 800);
    const reward = run.rewards;
    const mult = this.REWARD_MULT;
    reward.exp += Math.round((1 + rage * .35 + (fifth ? 6 + rage * .5 : 0)) * (4200 + mastery * 95) * mult);
    reward.ichor += Math.round((1 + rage * .3) * (1400 + mastery * 30) * mult);
    const extra = run.rng.pick(['tape', 'notes', 'star']);
    reward[extra] += Math.round((fifth ? 12 + rage * 2 : 3 + Math.ceil(rage / 2)) * mult);
    if (fifth) {
      reward.core += Math.round((1 + Math.floor(rage / 10)) * mult);
      reward.manual += Math.round((2 + Math.floor(rage / 5)) * mult);
      if (rage >= 10) reward.diamond += Math.round(mult);
    }
  },
  rewardForMilestone(run, i) {
    const unit = this.expUnit();
    Object.entries(this.MILESTONES[i].rewards).forEach(([key, n]) => {
      run.rewards[key] += Math.round((key === 'exp' || key === 'ichor' ? n * unit * (key === 'exp' ? 1 : .35) : n) * this.REWARD_MULT);
    });
  },
  rewards(run) {
    return Object.fromEntries(Object.entries(run.rewards).filter(([, amount]) => amount > 0));
  },
  finish(run) {
    const state = this.state();
    if (run.rage > state.best) state.best = run.rage;
    Save.write();
  },

  attach(battle, run) {
    const boss = battle.units.find(u => u.id === 'WhisperingFlower');
    if (!boss) return;
    battle.codebaseRun = run;
    battle.meta.encounteredLabel = 'Whispering Flower';
    battle.meta.survivedLabel = 'Rage 0 / 30';
    const oldHud = $('#codebaseHud');
    if (oldHud) oldHud.remove();
    const hud = el('div', 'codebase-battle-hud');
    hud.id = 'codebaseHud';
    hud.innerHTML = '<div class="codebase-battle-line"><b>RAGE <span data-rage>0</span> / 30</b><strong><span data-dmg>0</span> DAMAGE</strong></div><div class="codebase-rage-track"><i data-fill></i></div><small data-next>Damage the flower to raise its rage</small><small data-goal></small>';
    $('#battle').appendChild(hud);
    const update = () => {
      $('[data-rage]', hud).textContent = run.rage;
      $('[data-dmg]', hud).textContent = fmt(run.total);
      const ms = this.MILESTONES;
      $('[data-goal]', hud).textContent = run.milestone >= ms.length
        ? `All ${ms.length} damage milestones reached`
        : `Milestone ${run.milestone + 1} / ${ms.length} at ${fmt(this.milestoneGoal(boss, run.milestone))} damage`;
      const needed = this.threshold(boss, run.rage);
      $('[data-fill]', hud).style.width = (run.rage >= this.MAX_RAGE ? 100 : clamp(run.damage / needed * 100, 0, 100)) + '%';
      $('[data-next]', hud).textContent = run.rage >= this.MAX_RAGE
        ? 'MAX RAGE · survive until the timer ends'
        : `${fmt(Math.max(0, needed - Math.floor(run.damage)))} damage to the next level`;
    };
    battle.on(boss, 'damageTaken', ev => {
      // Every hit becomes rage progress. Restore HP before the shared lethal
      // check so the flower is truly unbeatable, including by a huge crit.
      const hit = ev.src && ev.src.team === TEAM_P
        ? Math.max(0, Number(ev.hpDamage) || 0) : 0;
      boss.hp = boss.max.hp;
      if (!hit || battle.over) return;
      run.total += hit;
      while (run.milestone < this.MILESTONES.length && run.total >= this.milestoneGoal(boss, run.milestone)) {
        this.rewardForMilestone(run, run.milestone);
        run.milestone++;
        if (!battle.offscreen) {
          battle.fxFloatIcon(boss.x, boss.y - 140, `MILESTONE ${run.milestone}`, '#ffe3a2');
          Sound.play('ui_ok', { vol: .4 });
        }
      }
      if (run.rage >= this.MAX_RAGE) { update(); return; }
      run.damage += hit;
      let climbed = 0;
      while (run.rage < this.MAX_RAGE && run.damage >= this.threshold(boss, run.rage)) {
        run.damage -= this.threshold(boss, run.rage);
        run.rage++;
        climbed++;
        this.rewardForLevel(run, run.rage);
        const stat = run.rng.pick(['atkP', 'magP', 'defP', 'mdefP', 'aspdP']);
        boss.flat[stat] = (boss.flat[stat] || 0) + (stat === 'aspdP' ? .026 : .05);
        boss.dirty = true;
        battle.timeLimit = Math.min(145, battle.timeLimit + (run.rage % 5 === 0 ? 7 : 2));
        battle.meta.survivedLabel = `Rage ${run.rage} / ${this.MAX_RAGE}`;
        if (run.rage % 5 === 0) {
          battle.log(`<b>RAGE ${run.rage}:</b> the Whispering Flower learns a new attack.`);
          if (!battle.offscreen) { battle.tint('#e78bca', .22, .28); Sound.play('warn', { vol: .4 }); }
        }
      }
      if (climbed) {
        boss.recompute();
        boss.hp = boss.max.hp;
        battle.updateTimer(true);
        if (!battle.offscreen) battle.fxFloatIcon(boss.x, boss.y - 110, `RAGE ${run.rage}`, '#f6a9e4');
      }
      update();
    });

    // Its normal attack is Water Whisper. Between attacks it throws fire and
    // earth; every fifth Rage level adds another move to the rotation.
    battle.every(boss, 5, () => {
      if (battle.over || !boss.alive) return;
      const unlocked = ['ember', 'thorns'];
      if (run.rage >= 5) unlocked.push('quake');
      if (run.rage >= 10) unlocked.push('wildfire');
      if (run.rage >= 15) unlocked.push('rootwall');
      if (run.rage >= 20) unlocked.push('magma');
      if (run.rage >= 25) unlocked.push('avalanche');
      if (run.rage >= 30) unlocked.push('finale');
      this.cast(battle, boss, unlocked[run.castTurn++ % unlocked.length], run.rage);
    });
    update();
  },

  /* SS-tier Fire / Earth moveset: embers, thorns, quakes and a final eruption. */
  cast(battle, boss, kind, rage) {
    const foes = battle.enemiesOf(boss).filter(u => u.alive);
    if (!foes.length) return;
    const fire = ['ember', 'wildfire', 'magma', 'finale'].includes(kind);
    const color = fire ? '#ff9360' : '#b98d58';
    const names = { ember: 'Ember Pollen', thorns: 'Bramble Spikes', quake: 'Root Quake', wildfire: 'Wildfire Bloom',
      rootwall: 'Rootbound Wall', magma: 'Magma Bloom', avalanche: 'Stone Petal Avalanche', finale: 'Eruption Bloom' };
    const scale = 1.3 * (1 + rage * .016);
    const hit = (targets, power, tag) => targets.forEach(target => {
      if (!target.alive) return;
      battle.fxSparkle(target.x, target.y - 50, 9, color);
      battle.damage(boss, target, boss.st.mag * power * scale, { type: 'magic', tag: tag || names[kind] });
    });
    const alive = () => battle.enemiesOf(boss).filter(u => u.alive);
    battle.anim(boss, 'cast', .68);
    battle.log(`<b>${boss.name}:</b> ${names[kind]}`);
    battle.fxFloatIcon(boss.x, boss.y - 108, fire ? '🔥' : '🪨', color);
    battle.after(.42, () => {
      if (!boss.alive || battle.over) return;
      const live = alive();
      if (!live.length) return;
      if (kind === 'ember') {
        const target = battle.lowestHp(live) || live[0];
        hit([target], .7);
        battle.applyStatus(boss, target, 'burn', 5, { stacks: 2 });
      } else if (kind === 'thorns') {
        hit(live, .45);
        live.forEach(t => battle.applyStatus(boss, t, 'defdown', 5));
      } else if (kind === 'quake') {
        hit(live, .6);
        live.forEach(t => battle.applyStatus(boss, t, 'stun', 1 + rage * .015));
      } else if (kind === 'wildfire') {
        hit(live, .8);
        live.forEach(t => battle.applyStatus(boss, t, 'burn', 4, { stacks: 1 }));
        battle.after(1.4, () => { if (!battle.over) hit(alive(), .35, 'Wildfire'); });
      } else if (kind === 'rootwall') {
        hit(live, .55);
        live.forEach(t => { battle.applyStatus(boss, t, 'root', 3.5); battle.applyStatus(boss, t, 'weaken', 5); });
      } else if (kind === 'magma') {
        hit(live, .95);
        live.forEach(t => battle.applyStatus(boss, t, 'burn', 5, { stacks: 2 }));
      } else if (kind === 'avalanche') {
        hit(live, .8);
        live.forEach(t => battle.applyStatus(boss, t, 'stun', 1.2));
        battle.after(1.2, () => { if (!battle.over) hit(alive(), .7, 'Avalanche'); });
      } else {
        hit(live, 1.25);
        live.forEach(t => { battle.applyStatus(boss, t, 'burn', 5, { stacks: 3 }); battle.applyStatus(boss, t, 'stun', 1.8); });
      }
      if (!battle.offscreen) Sound.play(fire ? 'hit_magic' : 'paint_splash', { vol: .5, throttle: 100 });
    });
  }
};
