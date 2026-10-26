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
  folder: null, file: null, twistedOnly: true, role: 'Control', tier: 'S',
  element: 'Fire / Water', scale: 1.18,
  base: { hp: 5400, atk: 190, def: 220, mag: 305, mdef: 225, spd: 95, acc: 180, eva: 70 },
  growth: { hp: .09, atk: .075, def: .08, mag: .09, mdef: .08 },
  hidden: { range: 315, aspd: .78, ms: 48, aggro: 2, crit: .05, critDmg: 1.5,
    healPow: 1, shieldPow: 1, cdr: 0, ccRes: .78, kbRes: 1,
    armorPen: 0, magPen: .1 },
  move: { gait: 'float', bob: 4, freq: .9, lean: 3, squash: .03,
    idle: 'breathe', step: 'step', particles: 'sparkle', pcol: '#9f80df', brake: .8 },
  basic: { name: 'Water Whisper', type: 'magic', ratio: .65, range: 315,
    proj: 'orb', pcol: '#74d9ef', sfx: 'whoosh', hit: 'hit_magic', wind: .32,
    onHit: (u, target, battle) => {
      if (chance(.28)) battle.applyStatus(u, target, 'slow', 3);
    } },
  skills: {}
});

const Codebase = {
  LIMIT: 3,
  MAX_RAGE: 30,

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
    const level = clamp(Math.round((Number(Save.data.mastery) || 1) * .85), 1, 800);
    return { id: 'WhisperingFlower', name: 'Whispering Flower', level,
      kind: 'boss', rarity: 4, rarityPlus: 1, stars: 3, skillLv: level,
      immovable: true, artSrc: ASSET + CODEBASE_ART,
      mult: { hp: 1.25, atk: .9, mag: .9, def: 1, mdef: 1 } };
  },
  MILESTONES: [
    { x: 3, rewards: { exp: 1, ichor: 1 } },
    { x: 8, rewards: { exp: 1.6, ichor: 1.4, manual: 3 } },
    { x: 16, rewards: { exp: 2.4, ichor: 2, core: 1, star: 8 } },
    { x: 30, rewards: { exp: 3.6, ichor: 3, core: 2, manual: 6 } },
    { x: 55, rewards: { exp: 5.4, ichor: 4.5, core: 3, diamond: 1 } },
    { x: 100, rewards: { exp: 8, ichor: 7, core: 4, manual: 10, diamond: 2 } },
    { x: 180, rewards: { exp: 12, ichor: 10, core: 6, diamond: 3 } },
    { x: 320, rewards: { exp: 18, ichor: 15, core: 8, manual: 16, diamond: 5 } }
  ],
  expUnit() { return 60000 + Math.round(clamp(Number(Save.data.mastery) || 1, 1, 800) * 1500); },
  milestoneGoal(boss, i) { return Math.round(boss.max.hp * this.MILESTONES[i].x); },
  newRun(attempt) {
    return { day: dayIndex(), attempt, rage: 0, damage: 0, total: 0, milestone: 0,
      rewards: { exp: 0, ichor: 0, tape: 0, notes: 0, star: 0, core: 0, manual: 0, diamond: 0 },
      rng: seeded(`codebase:${dayIndex()}:${attempt}:${Save.data.mastery}`), castTurn: 0 };
  },
  threshold(boss, rage) {
    return Math.max(180, Math.round(boss.max.hp * (.075 + rage * .006)));
  },
  rewardForLevel(run, rage) {
    const fifth = rage % 5 === 0;
    const mastery = clamp(Number(Save.data.mastery) || 1, 1, 800);
    const reward = run.rewards;
    reward.exp += Math.round((1 + rage * .35 + (fifth ? 6 + rage * .5 : 0)) * (4200 + mastery * 95));
    reward.ichor += Math.round((1 + rage * .3) * (1400 + mastery * 30));
    const extra = run.rng.pick(['tape', 'notes', 'star']);
    reward[extra] += fifth ? 12 + rage * 2 : 3 + Math.ceil(rage / 2);
    if (fifth) {
      reward.core += 1 + Math.floor(rage / 10);
      reward.manual += 2 + Math.floor(rage / 5);
      if (rage >= 10) reward.diamond += 1;
    }
  },
  rewardForMilestone(run, i) {
    const unit = this.expUnit();
    Object.entries(this.MILESTONES[i].rewards).forEach(([key, n]) => {
      run.rewards[key] += key === 'exp' || key === 'ichor' ? Math.round(n * unit * (key === 'exp' ? 1 : .35)) : n;
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
        boss.flat[stat] = (boss.flat[stat] || 0) + (stat === 'aspdP' ? .018 : .035);
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

    // Its normal attack is Water Whisper. Fire arrives even at low Rage;
    // every fifth level expands the rotating special attack list.
    battle.every(boss, 8, () => {
      if (battle.over || !boss.alive) return;
      const unlocked = ['ember'];
      if (run.rage >= 5) unlocked.push('rain');
      if (run.rage >= 10) unlocked.push('steam');
      if (run.rage >= 15) unlocked.push('wildfire');
      if (run.rage >= 20) unlocked.push('flood');
      if (run.rage >= 25) unlocked.push('boil');
      if (run.rage >= 30) unlocked.push('finale');
      this.cast(battle, boss, unlocked[run.castTurn++ % unlocked.length], run.rage);
    });
    update();
  },

  cast(battle, boss, kind, rage) {
    const foes = battle.enemiesOf(boss).filter(u => u.alive);
    if (!foes.length) return;
    const fire = ['ember', 'wildfire', 'boil', 'finale'].includes(kind);
    const color = fire ? '#ff9360' : '#76d8ee';
    const names = { ember: 'Ember Pollen', rain: 'Scalding Rain', steam: 'Steam Veil',
      wildfire: 'Wildfire Bloom', flood: 'Floodline', boil: 'Boiling Bloom', finale: 'Last Petal' };
    const picked = ['ember', 'steam'].includes(kind) ? [battle.lowestHp(foes) || foes[0]] : foes;
    const power = { ember: .48, rain: .42, steam: .72, wildfire: .78,
      flood: .68, boil: .95, finale: 1.12 }[kind];
    battle.anim(boss, 'cast', .68);
    battle.log(`<b>${boss.name}:</b> ${names[kind]}`);
    battle.fxFloatIcon(boss.x, boss.y - 108, fire ? '🔥' : '💧', color);
    battle.after(.42, () => {
      if (!boss.alive || battle.over) return;
      picked.forEach(target => {
        if (!target.alive) return;
        battle.fxSparkle(target.x, target.y - 50, 9, color);
        battle.damage(boss, target, boss.st.mag * power * (1 + rage * .012),
          { type: 'magic', tag: names[kind] });
        if (fire) battle.applyStatus(boss, target, 'burn', 4, { stacks: kind === 'finale' ? 3 : 1 });
        else battle.applyStatus(boss, target, 'slow', 3.5, { stacks: kind === 'flood' ? 2 : 1 });
      });
      if (!battle.offscreen) Sound.play(fire ? 'hit_magic' : 'paint_splash', { vol: .5, throttle: 100 });
    });
  }
};
