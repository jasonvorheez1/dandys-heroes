/* main.js - boot, preload, routing. */
'use strict';

(function boot() {
  FX.init();
  Save.load();
  Save.startAutosave();

  // Show the title screen while account data and game art prepare in the background.
  const accountReady = startAccountSync();
  revealLauncher();
  setTimeout(() => Promise.resolve().then(preloadStartupAssets)
    .catch(err => console.warn('startup art preload failed', err)), 300);

  function startAccountSync() {
    return typeof WebsimAccount !== 'undefined'
      ? WebsimAccount.init()
      : Promise.resolve();
  }

  function preloadStartupAssets() {
    const week = currentWeek();
    const firstView = [
      ...Save.data.team.filter(Boolean),
      featured(week).pass || STARTERS[0]
    ];
    const assets = [
      ...firstView.flatMap(id => [Art.hero(id), Art.icon(id)])
    ];

    return Preload.all(assets);
  }

  function revealLauncher() {
    $('#boot').classList.add('done');
    setTimeout(() => $('#boot').remove(), 550);

    const launcher = $('#launcher');
    const play = $('#launcherPlay');
    const settings = $('#launcherSettings');
    let launched = false;

    launcher.hidden = false;
    requestAnimationFrame(() => {
      launcher.classList.add('visible');
    });
    const showAccessibilityPrompt = () => setTimeout(() => Accessibility.firstRunPrompt(), 320);
    accountReady.then(showAccessibilityPrompt, showAccessibilityPrompt);

    settings.onclick = async () => {
      settings.disabled = true;
      try { await accountReady; }
      catch (err) { console.warn('account startup failed', err); }
      settings.disabled = false;
      if (!launched) Screens.openSettings();
    };
    play.onclick = async () => {
      if (launched) return;
      launched = true;
      play.disabled = true;
      settings.disabled = true;
      play.textContent = 'Opening…';

      // This click is the browser-approved gesture that unlocks game audio.
      Sound.play('ui_ok', { vol: HANDHELD_AUDIO ? .72 : .42 });
      Music.play('navigation');
      try { await accountReady; }
      catch (err) { console.warn('account startup failed', err); }
      launcher.classList.add('leaving');
      setTimeout(() => {
        launcher.hidden = true;
        enterGame();
      }, 260);
    };
  }

  function enterGame() {
    $('#app').hidden = false;
    if (typeof Lab !== 'undefined') Lab.init();

    BattleScreen.bindHud();
    $$('#navbar button').forEach((button, index) => {
      const shortcut = `Alt+${index + 1}`;
      const label = button.title || button.getAttribute('aria-label') || button.dataset.nav;
      button.dataset.navTitle = `${label} (${shortcut})`;
      button.title = button.dataset.navTitle;
      button.setAttribute('aria-keyshortcuts', shortcut);
      button.onclick = () => Screens.go(button.dataset.nav);
    });

    UI.refreshBar();
    Screens.go('home');
    showRecoveryNotice();
    bindAppEvents();

    if (!Save.data.seen.intro) {
      Save.data.seen.intro = true;
      Save.write();
    }

    console.log('%cDandy\'s Heroes', 'font:bold 18px sans-serif;color:#ffc94d',
      '\nRoster:', PLAYABLE_IDS.length, 'playable,', TWISTED_IDS.length, 'Twisted forms');
  }

  function showRecoveryNotice() {
    if (!Save.recoveryNotice) return;
    setTimeout(() => UI.toast('⚠ ' + Save.recoveryNotice), 700);
    Save.recoveryNotice = '';
  }

  function bindAppEvents() {
    // Escape closes the topmost surface.
    document.addEventListener('keydown', event => {
      // The bottom dock is always available, including while a long roster
      // or shop page has focus. Numbered Alt shortcuts are discoverable in
      // the button tooltips and avoid intercepting ordinary typing.
      if (event.altKey && !event.ctrlKey && !event.metaKey && /^Digit[1-6]$/.test(event.code)) {
        const button = $$('#navbar button')[Number(event.code.slice(-1)) - 1];
        if (button) { event.preventDefault(); button.click(); }
        return;
      }
      if (event.key !== 'Escape') return;
      const modal = $('#modal');
      if (modal && !modal.hidden) UI.closeModal();
      else if (Screens.cur === 'pass') Screens.leavePass();
    });

    // Surface render errors without leaving the player on a half-drawn panel.
    window.addEventListener('error', event => {
      const modal = $('#modal');
      if (modal && !modal.hidden && !$('#modalBox').children.length) UI.closeModal();
      UI.toast('⚠ ' + (event.message || 'error'));
      console.error('[Dandy\'s Heroes]', event.error || event.message);
    });

    // Unlock audio in browsers that gate playback until the first gesture.
    const unlockAudio = () => {
      Sound.play('ui_move', { vol: .01 });
      document.removeEventListener('pointerdown', unlockAudio);
    };
    document.addEventListener('pointerdown', unlockAudio);
    window.addEventListener('resize', resizeBattle);
  }

  function resizeBattle() {
    const battle = BattleScreen.active;
    if (!battle) return;

    const frame = $('#battle').getBoundingClientRect();
    battle.W = frame.width;
    battle.H = frame.height;
    battle.ground = battle.H - Math.min(260, battle.H * .42);
    battle.rightWall = battle.W - 18;
    battle.depthSpan = clamp(battle.H * .235, 96, DEPTH_SPAN);
    battle.rangeScale = clamp(battle.W / 560, .48, 1);
    battle.units.forEach(unit => {
      unit.dirty = true;
      unit.recompute();
    });

    const floor = $('#floorLine');
    if (floor) floor.style.height = `${battle.H - battle.ground + battle.depthSpan + 24}px`;
  }
})();
