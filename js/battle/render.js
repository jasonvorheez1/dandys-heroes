/* render.js - battle screen controller: launching fights, speed toggles,
   the result screen and reward payout hand-off. */
'use strict';

const BattleScreen = {
  active: null,
  onDone: null,

  /**
   * launch({team, foes, meta, onDone})
   * team/foes are combat specs; onDone(result) fires after the result panel.
   */
  launch(cfg) {
    // A double click during the loading hand-off must not create two battles
    // with two reward callbacks. The existing battle remains the only owner
    // until it closes.
    if (this.active) return this.active;
    const b = new Battle();
    b.loading = true;
    this.active = b;
    let callbackUsed = false;
    this.onDone = result => {
      if (callbackUsed) return;
      callbackUsed = true;
      if (cfg.onDone) cfg.onDone(result);
    };
    // Combat owns both the viewport and music until close().
    if (typeof Screens !== 'undefined') {
      clearInterval(Screens._liveClock);
      Screens._liveClock = null;
    }
    $('#battle').hidden = false;
    $('#app').hidden = true;
    $('#battle').classList.toggle('kh-battle', !!(cfg.meta && (cfg.meta.collabTheme || cfg.meta.collabEntrance)));
    $('#battle').classList.toggle('unknown-world-battle', !!(cfg.meta && cfg.meta.unknownWorld));
    $('#battle').classList.toggle('qom-battle', !!(cfg.meta && cfg.meta.qom));
    $('#battleHud').classList.remove('wave-exit');
    // Result animations are reused across battles. Never carry the previous
    // result's closed elevator state into the next Apex/trial result screen.
    $('#battleEnd').classList.remove('elevator-closing', 'wrap-win', 'wrap-loss', 'machine-result-screen');
    // Older saves could reopen at 2x/3x, which made new cast visuals finish
    // before they could be read. Reset that legacy preference once; choices
    // made with the gentler speed steps below remain persistent.
    if (!Save.data.opt.paceV2) {
      Save.data.opt.speed = 1;
      Save.data.opt.paceV2 = true;
      Save.write();
    }
    b.speed = Save.data.opt.speed || 1;
    $('#btnSpeed i').textContent = b.speed + 'x';
    $('#btnAuto i').textContent = '⏸';
    $('#btnAuto').classList.remove('on');
    const finishBattle = (res) => {
      // Chained victories can hand off directly to the next room, but a loss
      // still needs its results card so the player can see what happened and
      // deliberately leave the run.
      if (cfg.skipResults && res.win) {
        if (res.win) {
          b.exitWalk(() => {
            this.close({ keepAppHidden: true });
            try {
              if (cfg.onDone) cfg.onDone(res);
            } catch (err) {
              // A malformed legacy run should not turn a successful chained
              // handoff into a blank screen. Keep a new battle untouched if
              // the callback already launched one; otherwise rebuild the
              // current route, with Home as the last safe fallback.
              console.error('battle handoff failed', err);
              if (!this.active && typeof Screens !== 'undefined') {
                try { Screens.render(); }
                catch (renderErr) {
                  console.error('screen recovery failed', renderErr);
                  try { Screens.cur = 'home'; Screens.render(); } catch (_) { /* reveal below */ }
                }
              }
            } finally {
              // Chained encounters deliberately keep the app hidden while the
              // next battle takes ownership. If the callback only rerenders
              // the Endless/Event screen, reveal the app here or the host is
              // left on the blank outer canvas after a perfectly valid win.
              if (!this.active) $('#app').hidden = false;
            }
          });
        }
      } else this.showResult(res, cfg);
    };
    b.onEnd = (res) => {
      if (res.win && cfg.postBanter) b.playBanter(cfg.postBanter, () => finishBattle(res));
      else finishBattle(res);
    };
    const creatureCues = [...new Set((cfg.foes || [])
      .flatMap(f => Object.values(TWISTED_AUDIO[f.id] || {}).concat(Object.values(COLLAB_AUDIO[f.id] || {}))))];
    // Friendly collaboration voices normally warm themselves during attacks,
    // but a down line may first be needed during a sudden wipe. Warm only that
    // one cue per Hero instead of eagerly allocating every dialogue pool.
    const teamDownCues = [...new Set((cfg.team || []).map(f => (COLLAB_AUDIO[f.id] || {}).down).filter(Boolean))];
    const unknownWorldCues = cfg.meta && cfg.meta.unknownWorld && typeof UNKNOWN_WORLD_SKILL_AUDIO !== 'undefined'
      ? [...new Set(Object.values(UNKNOWN_WORLD_SKILL_AUDIO).concat('machine_speak', 'unknown_world_explode'))] : [];
    const cookieCues = [...(cfg.team || []), ...(cfg.foes || [])].some(f => f && f.id === 'ShadowMilkCookie')
      ? ['cookie_darkmagic_ability', 'cookie_darkmagic_spread'] : [];
    const hasQom = [...(cfg.team || []), ...(cfg.foes || [])].some(f => f && /^QOM/.test(f.id));
    const qomCues = hasQom ? ['qom_hey', 'qom_crash', 'qom_snare', 'qom_riff', 'qom_guard',
      'qom_bone', 'qom_counter', 'qom_ghost', 'qom_candy'] : [];
    Sound.warm(['hit_slash', 'hit_blunt', 'hit_magic', 'swing_light', 'step', 'crit', 'heal',
      'heal_soft', 'sparkle', 'shrink2', 'spectral', 'shatter', 'beam_charge',
      'beam_fire', 'flash', 'blot_ink_cast', 'blot_mime_wall', 'blot_ink_burst', 'throwsomething', 'sweep', 'pop2', 'down', 'blood', 'cleanse',
      'guard', 'shock', 'shock_big', 'toon_death', 'toodles_gamble', 'rudie_wind', 'rudie_hoofstep', 'rudie_red_nose', 'apex_trial_warning', ...creatureCues, ...teamDownCues, ...unknownWorldCues, ...qomCues, ...cookieCues]);
    const begin = () => {
      if (this.active !== b) return;
      b.loading = false;
      if (cfg.meta && cfg.meta.machinePrelude) Music.stop();
      else Music.play(cfg.music && MUSIC_TRACKS[cfg.music] ? cfg.music : 'battle');
      b.start(cfg.team, cfg.foes, cfg.meta);
      if (cfg.onReady) {
        try { cfg.onReady(b); }
        catch (e) { console.warn('battle ready hook failed', e); }
      }
      if (cfg.meta && cfg.meta.machinePrelude) b.startMachinePrelude(cfg.meta.machinePrelude);
    };
    LoadingScreen.run({
      kicker: cfg.meta && cfg.meta.collabTheme ? 'OPENING THE DOOR' : 'NEXT ENCOUNTER',
      title: cfg.meta && (cfg.meta.floorLabel || cfg.meta.title) || 'Preparing the battle',
      message: 'Calling the cast',
      assets: Preload.battleBundle(cfg),
      portraits: (cfg.team || []).slice(0, 3).map(s => Art.hero(s.id))
    }, begin);
    return b;
  },

  quit() {
    if (!this.active || this.active.over) return;
    this.active.stopBattle();
    this.close();
    if (this.onDone) this.onDone({ win: false, why: 'Retreat', quit: true });
  },

  close(opt) {
    opt = opt || {};
    document.querySelectorAll('.battle-status-detail').forEach(n => n.remove());
    if (typeof DandyCoach !== 'undefined') DandyCoach.clear();
    LoadingScreen.hide();
    FX.clear();
    Sound.stopBuses(['movement', 'impact', 'ability', 'creature', 'ambience']);
    $('#battle').hidden = true;
    $('#battle').classList.remove('kh-battle');
    $('#battle').classList.remove('unknown-world-battle');
    $('#battleHud').classList.remove('wave-exit');
    $('#battleEnd').classList.remove('elevator-closing');
    if (!opt.keepAppHidden) $('#app').hidden = false;
    this.active = null;
  },

  /**
   * The results card: the title slams in on its own, then the panel drops and
   * the stat lines pop one at a time, finishing on the Ichor total.
   * Tapping SKIP RESULTS jumps straight to the finished state.
   */
  showResult(res, cfg) {
    const b = this.active;
    if (!cfg.endless) Music.stop();
    const box = $('#battleEnd');
    box.hidden = false; clear(box);
    box.classList.remove('elevator-closing');
    box.classList.toggle('wrap-win', !!res.win);
    box.classList.toggle('wrap-loss', !res.win);
    box.classList.toggle('machine-result-screen', !!cfg.machine);

    box.appendChild(el('div', 'wrap-tape top'));
    box.appendChild(el('div', 'wrap-tape bot'));
    const elevatorDoors = el('div', 'wrap-elevator-doors');
    elevatorDoors.innerHTML = '<i class="wrap-elevator-door left"></i><i class="wrap-elevator-door right"></i><b></b>';
    box.appendChild(elevatorDoors);
    const inner = el('div', 'wrap-inner');
    box.appendChild(inner);

    const isTreadmill = !!(cfg.machine && cfg.machine.machineType === 'treadmill');
    const machineTitle = res.machineSuccess
      ? (isTreadmill ? 'TREADMILL CHARGED!' : 'EXTRACTION COMPLETE!')
      : res.machineReduced
        ? (isTreadmill ? 'TRIPPED ON BELT!' : 'CHECK FAILED!')
        : 'MACHINE INTERRUPTED!';
    const machineKicker = isTreadmill ? 'TREADMILL GENERATOR // PAYOUT' : 'ICHOR MACHINE // PAYOUT';
    const title = el('div', 'wrap-title' + (res.win ? '' : ' lose'),
      cfg.machine ? machineTitle : (res.win ? "THAT'S A WRAP!" : 'LIGHTS OUT!'));
    inner.appendChild(title);
    inner.appendChild(el('div', 'wrap-kicker', cfg.machine ? machineKicker : 'RESULTS'));

    if (res.win) Sound.play('cheer_big', { vol: .72 });
    else Sound.play('twisted_caught', { vol: .58, priority: true });
    FX.shake(20, .4);

    const rewards = (cfg.rewards && res.win) ? cfg.rewards(res) : {};
    const foes = b.units.filter(u => u.team === TEAM_E && !u.minion);
    const mine = b.units.filter(u => u.team === TEAM_P && !u.minion);
    const dealt = Math.round(sum(mine.map(u => u.dmgDone)));
    const healingDone = Math.round(sum(mine.map(u => u.healDone)));
    const healingReceived = Math.round(sum(mine.map(u => u.healReceived)));
    const damageTaken = Math.round(sum(mine.map(u => u.dmgTaken)));
    const st = b.stat || { crits: 0, superCrits: 0, hits: 0 };

    // Only actual Twisteds drop their matching Hero shard. Event challengers
    // such as Collab visitors use their own Event Shop progression instead.
    const shardDrops = typeof collectTwistedShardDrops === 'function' ? collectTwistedShardDrops(b) : {};
    const rodgerResearch = mine
      .filter(u => u.id === 'Rodger' && u.research)
      .reduce((best, rodger) => {
        Object.keys(rodger.research).forEach(uid => { best[uid] = Math.max(best[uid] || 0, rodger.research[uid] || 0); });
        return best;
      }, {});
    const rodgerMultipliers = [1, 2, 4, 8, 12, 20];
    const researchedShardBonus = {};
    foes.filter(u => !u.alive && u.twisted && HEROES[u.id]).forEach(u => {
      const research = clamp(Math.max(Number(rodgerResearch[u.uid]) || 0, Number(u._rodgerResearchAtDefeat) || 0), 0, 5);
      if (research >= 1) researchedShardBonus[u.id] = { research, multiplier: masteryRewardValue(rodgerMultipliers[research]) };
    });

    // the stat roll-call, Ichor deliberately last and largest
    const lines = [];
    if (cfg.machine) {
      lines.push([
        isTreadmill ? 'Generator Payout...' : 'Machine Payout...',
        res.machineSuccess ? 'FULL REWARD LOCKED IN!' : res.machineReduced ? '10% REWARD · BATTLE ALERTED!' : 'ROOM CLOSED BEFORE EXTRACTION.'
      ]);
    }
    lines.push(['You Survived...', b.meta.survivedLabel || (b.meta.title || 'the room')]);
    lines.push(['You Encountered...', b.meta.encounteredLabel ||
      (foes.length + ' Twisted' + (foes.length === 1 ? '' : 's') + '!')]);
    lines.push(['Damage Dealt...', fmt(dealt)]);
    lines.push(['Healing Done...', fmt(healingDone)]);
    lines.push(['Healing Received...', fmt(healingReceived)]);
    lines.push(['Damage Received...', fmt(damageTaken)]);
    if (st.crits) lines.push(['You Landed...', fmt(st.crits) + ' Critical Hits!']);
    if (st.superCrits) lines.push(['You Spiked...', fmt(st.superCrits) + ' Super Crits!']);
    lines.push(['Your Team Held...', mine.filter(u => u.alive).length + ' of ' + mine.length + '!']);
    const shardNames = Object.entries(shardDrops).map(([id, n]) => HEROES[id].name + ' ×' + n);
    if (shardNames.length) lines.push(['You Collected...', '◈ ' + shardNames.join(', ') + '!']);
    const researchNames = Object.entries(researchedShardBonus).map(([id, data]) => `${HEROES[id].name} Research ${data.research} · ×${data.multiplier}`);
    if (researchNames.length) lines.push(['Rodger Filed...', researchNames.join(' · ') + '!']);
    Object.keys(rewards).forEach(k => {
      if (!rewards[k] || !RES[k] || k === 'ichor') return;
      lines.push(['You Picked Up...', fmt(rewards[k]) + ' ' + RES[k].name + '!']);
    });

    const panel = el('div', 'wrap-panel ' + (res.win ? 'win' : 'loss'));
    panel.appendChild(el('div', 'wrap-head', 'FINAL TALLY'));
    const lineEls = lines.map(([a, v]) => {
      const n = el('div', 'wrap-line');
      n.appendChild(el('span', 'wrap-label', a));
      n.appendChild(el('b', '', v));
      n.style.visibility = 'hidden';
      panel.appendChild(n);
      return n;
    });
    const earn = el('div', 'wrap-line big',
      res.win ? 'You Earned... ' + fmt(rewards.ichor || 0) + ' Ichor!' : 'You Earned... nothing.');
    earn.style.visibility = 'hidden';
    panel.appendChild(earn);

    // Detailed combat report: the tally above answers "how did the run go?"
    // while this keeps each Hero's contribution visible instead of reducing
    // the whole team to one damage number.
    const perf = el('section', 'wrap-perf');
    perf.style.visibility = 'hidden';
    perf.appendChild(el('div', 'wrap-report-title', 'COMBAT REPORT'));
    const reportStats = el('div', 'wrap-report-stats');
    [
      ['DAMAGE DEALT', dealt, 'damage'],
      ['DAMAGE RECEIVED', damageTaken, 'danger'],
      ['HEALING DONE', healingDone, 'heal'],
      ['HEALING RECEIVED', healingReceived, 'heal-soft']
    ].forEach(([label, value, kind]) => {
      const card = el('div', 'wrap-stat ' + kind);
      card.appendChild(el('b', '', fmt(value)));
      card.appendChild(el('span', '', label));
      reportStats.appendChild(card);
    });
    perf.appendChild(reportStats);

    const roster = el('div', 'wrap-roster');
    const rosterHead = el('div', 'wrap-roster-head');
    ['HERO', 'DMG', 'TAKEN', 'HEAL', 'IN'].forEach(label => rosterHead.appendChild(el('span', '', label)));
    roster.appendChild(rosterHead);
    mine.slice().sort((a, z) => z.dmgDone - a.dmgDone).forEach(u => {
      const row = el('div', 'wrap-roster-row');
      const hero = el('div', 'wrap-hero-name');
      const icon = document.createElement('img');
      icon.src = Art.icon(u.id); icon.alt = '';
      hero.appendChild(icon); hero.appendChild(el('span', '', u.name));
      row.appendChild(hero);
      [[u.dmgDone, 'damage'], [u.dmgTaken, 'danger'], [u.healDone, 'heal'], [u.healReceived, 'heal-soft']].forEach(([value, kind]) => {
        const cell = el('span', 'wrap-roster-stat ' + kind, fmt(value));
        row.appendChild(cell);
      });
      row.classList.toggle('ko', !u.alive);
      roster.appendChild(row);
    });
    perf.appendChild(roster);
    const reportNote = el('div', 'wrap-report-note', 'DMG = damage dealt · TAKEN = damage to HP · HEAL = restored by this Hero · IN = restored to this Hero');
    perf.appendChild(reportNote);
    panel.appendChild(perf);

    const btns = el('div', 'wrap-btns');
    btns.style.visibility = 'hidden';
    const go = el('button', 'btn pri wide', res.win ? 'CONTINUE' : 'BACK');
    go.onclick = () => {
      if (box.classList.contains('elevator-closing')) return;
      Sound.play('ui_ok');
      box.classList.add('elevator-closing');
      setTimeout(() => {
        // Results must never strand the player behind the closed elevator
        // doors. Apex runs have extra post-win loot/progression handlers, so
        // keep the viewport cleanup independent from that callback and always
        // restore the app if a reward handler has malformed legacy data.
        const done = this.onDone;
        this.onDone = null;
        const forceRevealApp = () => {
          $('#battleEnd').hidden = true;
          $('#battle').hidden = true;
          $('#battleHud').classList.remove('wave-exit');
          $('#app').hidden = false;
          this.active = null;
        };
        try {
          this.close();
        } catch (err) {
          console.error('battle result cleanup failed', err);
          forceRevealApp();
        }
        if (done) {
          try { done(res); }
          catch (err) {
            // A payout issue should not leave the result screen covering the
            // whole app. The battle is already closed; let the current screen
            // remain usable and report the underlying error for debugging.
            console.error('battle result handoff failed', err);
            forceRevealApp();
          }
        }
      }, 430);
    };
    btns.appendChild(go);

    const skip = el('button', 'wrap-skip', 'SKIP RESULTS');
    box.appendChild(skip);

    const timers = [];
    const at = (ms, fn) => timers.push(setTimeout(fn, ms));
    const reveal = (n, delay) => at(delay, () => {
      n.style.visibility = 'visible';
      n.style.animation = 'none'; void n.offsetWidth; n.style.animation = '';
    });

    let t = 900;
    at(t, () => {
      title.classList.add('settled');
      inner.appendChild(panel);
      inner.appendChild(btns);
      Sound.play('get_item', { vol: res.win ? .42 : .3, priority: true });
      Sound.play('ui_open');
    });
    t += 380;
    lineEls.forEach((n, i) => {
      reveal(n, t + i * 165);
      at(t + i * 165, () => Sound.play('ichor_gain', { vol: .34, rate: 1 + i * .06, throttle: 0 }));
    });
    t += lineEls.length * 165 + 220;
    at(t, () => {
      earn.style.visibility = 'visible';
      Sound.play('ichor_gain', { vol: .48, priority: true });
      if (res.win) FX.confetti(b.W / 2, b.H * .45, 70);
      FX.shake(10, .3);
    });
    reveal(perf, t + 320);
    reveal(btns, t + 460);

    // SKIP drops everything into place at once
    const finish = () => {
      timers.forEach(clearTimeout); timers.length = 0;
      title.classList.add('settled');
      if (!panel.parentNode) { inner.appendChild(panel); inner.appendChild(btns); }
      lineEls.forEach(n => { n.style.visibility = 'visible'; n.style.animation = 'none'; });
      [earn, perf, btns].forEach(n => { n.style.visibility = 'visible'; n.style.animation = 'none'; });
      skip.remove();
    };
    skip.onclick = () => { Sound.play('ui_back'); finish(); };
    at(t + 500, () => skip.remove());
  },

  bindHud() {
    $('#btnSpeed').onclick = () => {
      const b = this.active; if (!b || (b.paused && b._dandyCoach && b._dandyCoach.classList.contains('show'))) return;
      b.speed = b.speed === 1 ? 1.5 : b.speed === 1.5 ? 2 : b.speed === 2 ? 3 : 1;
      Save.data.opt.speed = b.speed; Save.write();
      $('#btnSpeed i').textContent = b.speed + 'x';
      Sound.play('ui_move');
    };
    $('#btnAuto').onclick = (e) => {
      const b = this.active; if (!b || (b.paused && b._dandyCoach && b._dandyCoach.classList.contains('show'))) return;
      b.paused = !b.paused;
      e.currentTarget.classList.toggle('on', b.paused);
      $('#btnAuto i').textContent = b.paused ? '▶' : '⏸';
      Sound.play('ui_move');
    };
    $('#btnQuit').onclick = () => {
      UI.confirm('Leave the battle?', 'Progress in this fight is lost.', () => this.quit());
    };
  }
};

/* ---------------- spec builders ---------------- */

/** Combat spec for one of the player's owned heroes. */
function playerSpec(id) {
  const h = Save.hero(id);
  return {
    id, level: h.level, stars: h.stars, rarity: h.rarity, rarityPlus: h.rarityPlus,
    skillLv: Math.round(sum(SKILL_ORDER.map(k => h.skills[k] || 1)) / 5),
    skillLevels: Object.assign({}, h.skills),
    cls: h.cls, subcls: h.subcls, cls2: h.cls2, subcls2: h.subcls2,
    classRank: h.cls ? Progress.classRank(id, h.cls) : 0,
    subclassRank: h.subcls ? Progress.subclassRank(id, h.subcls) : 0,
    classRank2: h.cls2 ? Progress.classRank(id, h.cls2) : 0,
    subclassRank2: h.subcls2 ? Progress.subclassRank(id, h.subcls2) : 0,
    trinkets: (h.trinkets || []).filter(Boolean),
    badge: h.badge || null,
    badges: Save.equippedBadges(id),
    mult: { hp: 1, atk: 1, def: 1 }
  };
}
function playerTeamSpecs(ids) { return ids.filter(Boolean).map(playerSpec); }

/** Combat spec for an arena opponent's hero (no save data behind it).
    Arena rivals use the playable Hero body and the same real moveset, with
    generated investment layered on top - no enemy-only Twisted replacement
    and no Depths-style stat multiplier. */
function rivalSpec(id, level, opt) {
  opt = opt || {};
  const training = enemyTraining(id, level, 'rival', opt.buildSeed || id);
  const rarity = opt.rarity || clamp(1 + Math.floor(level / 70), 1, 6);
  const altClass = Object.keys(CLASSES).find(k => k !== (opt.cls || training.cls));
  const altSubclass = Object.keys(SUBCLASSES).find(k => k !== (opt.subcls || training.subcls));
  return {
    id, level, twisted: false, artSrc: Art.hero(id),
    stars: opt.stars || clamp(1 + Math.floor(level / 80), 1, 5),
    rarity,
    rarityPlus: opt.rarityPlus == null ? rarityPlusForLevel(level, rarity, opt.buildSeed || id) : opt.rarityPlus,
    skillLv: opt.skillLv || enemySkillLevel(level, 'rival'),
    cls: opt.cls || training.cls, subcls: opt.subcls || training.subcls,
    cls2: opt.cls2 || null, subcls2: opt.subcls2 || null,
    classRank: opt.classRank || training.classRank,
    subclassRank: opt.subclassRank || training.subclassRank,
    cls2: opt.cls2 || (rarity >= 6 ? altClass : null), subcls2: opt.subcls2 || (rarity >= 6 ? altSubclass : null),
    classRank2: opt.classRank2 || (rarity >= 6 ? 1 : 0), subclassRank2: opt.subclassRank2 || (rarity >= 6 ? 1 : 0),
    mult: opt.mult || { hp: 1, atk: 1, def: 1 }
  };
}
