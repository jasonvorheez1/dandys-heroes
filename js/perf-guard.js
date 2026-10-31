/* perf-guard.js - keeps phones cool. Loaded first, no game dependencies.

   1. Many menu decorations are endless CSS loops that animate paint-heavy
      properties (filter glows, box-shadow pulses, scrolling backgrounds).
      Each one repaints its layer every frame for as long as the screen is
      open, which is what keeps a phone GPU warm while idling in a menu.
      On touch devices those loops now play a few cycles when they appear and
      then rest on their normal style. Battle-state signals (ult ready, low
      HP) are not in the list and keep pulsing.
   2. Every CSS animation is paused while the app is in the background.
   3. Scripted (requestAnimationFrame) loops are capped at 60 FPS on touch
      devices, so 120 Hz phones do not run them twice as often. */
'use strict';

(() => {
  const root = document.documentElement;
  const coarse = typeof matchMedia === 'function' && matchMedia('(pointer: coarse)').matches;
  if (coarse) root.classList.add('touch-device');

  const syncHidden = () => root.classList.toggle('app-hidden', document.hidden);
  document.addEventListener('visibilitychange', syncHidden);
  syncHidden();

  /* 3. High-refresh phones (the S24 Ultra runs at 120 Hz) would otherwise run
        every scripted animation loop 120 times a second. Batch rAF callbacks
        onto at most 60 deliveries per second. Callbacks still receive the
        real frame timestamp, so time-based animation keeps its speed. */
  if (coarse && typeof window.requestAnimationFrame === 'function') {
    const nativeRaf = window.requestAnimationFrame.bind(window);
    const nativeCancel = window.cancelAnimationFrame.bind(window);
    const MIN_GAP = 1000 / 60 - 2;
    let queue = new Map(), nextId = 1, pending = 0, lastFlush = 0;
    const flush = now => {
      pending = 0;
      if (now - lastFlush < MIN_GAP) { pending = nativeRaf(flush); return; }
      lastFlush = now;
      const run = queue; queue = new Map();
      run.forEach(cb => { try { cb(now); } catch (e) { setTimeout(() => { throw e; }); } });
    };
    window.requestAnimationFrame = cb => {
      const id = nextId++;
      queue.set(id, cb);
      if (!pending) pending = nativeRaf(flush);
      return id;
    };
    window.cancelAnimationFrame = id => {
      queue.delete(id);
      if (!queue.size && pending) { nativeCancel(pending); pending = 0; }
    };
  }

  if (!coarse || typeof document.getAnimations !== 'function') return;

  const HEAVY = new Set(["arenaLivePulse", "arenaSky", "biblioPulse", "bpSealPulse", "budGlow", "ch3Pulse", "dandyDirectivePulse", "dandyPointerPulse", "deckReady", "diversionShimmer", "endlessAlarm", "endlessCurrentRoom", "endlessPulse", "endlessRuleGlitch", "endlessThreatPulse", "endlessWire", "ff7-limit-flash", "fissureFlicker", "friendMeter", "friendStagePulse", "fxCrt", "fxRainbow", "goobLineWiggle", "hcReadyGlow", "homeReady", "homeReadyGlow", "journalIridescentPulse", "journalTierShift", "kh-pulse", "kh-ready", "leadStarGlow", "livePulse", "masteryShimmer", "msAlarm", "msChargeGlow", "msDrip", "msGlow", "msHeart", "newGlow", "nodePulse", "passReadyPulse", "plPulse", "poolShimmer", "poppyBubbleFloat", "prismPulse", "prismRainbow", "qomHum", "raidTicketPulse", "rainbowCardBorder", "rainbowRarityBorder", "rootThrum", "rzAlarm", "rzThreatPulse", "treadmillHazardBlink", "trialGrindPulse", "trialSurvivalPulse", "tu-flow-pulse", "tuAlarm", "violetWaxHeat", "wall-grand-glow", "waxFlicker", "waxZoneHeat", "waxwellPlanPin"]);
  const PLAY_MS = 6000;
  const seen = new WeakSet();
  let timer = 0;

  const settle = () => {
    timer = 0;
    if (document.hidden) return;
    const arena = document.getElementById('battle');
    if (arena && !arena.hidden) return;
    let list;
    try { list = document.getAnimations(); } catch (_) { return; }
    for (const anim of list) {
      if (seen.has(anim) || !anim.animationName || !HEAVY.has(anim.animationName)) continue;
      seen.add(anim);
      try {
        const timing = anim.effect.getTiming();
        if (timing.iterations !== Infinity) continue;
        const duration = Number(timing.duration) || 1000;
        anim.effect.updateTiming({ iterations: Math.max(2, Math.ceil(PLAY_MS / duration)) });
      } catch (_) { /* a removed element can throw; nothing to cap */ }
    }
  };
  const queue = () => { if (!timer) timer = setTimeout(settle, 350); };

  const watch = () => {
    // Battle DOM churns every frame; its own perf-lite mode handles it.
    const battle = document.getElementById('battle');
    new MutationObserver(records => {
      for (const r of records) {
        if (battle && battle.contains(r.target)) continue;
        queue();
        return;
      }
    }).observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['class', 'hidden'] });
    queue();
  };
  if (document.body) watch();
  else document.addEventListener('DOMContentLoaded', watch, { once: true });
})();
