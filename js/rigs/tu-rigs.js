'use strict';

/* ============================================================================
   Toon's Universe Rigs & Battlefield FX (Selena, Discard, CopperFX)
   - Spring-driven 2D rigs with continuous idle, walk, attack, hurt, and
     4-phase skill animations (Start-up -> Wind-up -> Mid-skill -> Ending).
   - SelenaFX: Highlights Mapped enemies green with tactical sonar HUD & Echo
     Trace pips (1-4), sonar wave broadcasts, and Echo Break shatter bursts.
   - DiscardFX: Flowing SVG music streams & floating notes around Discard and
     buffed allies during Good Vibes, Beat-Down, Flow, D15Crd, and Perfect Flow.
   - CopperFX: Translucent 3D Orange Orb Shield around guarded allies, orbiting
     Wicklight embers, and Blue/White/Orange flame waves.
   ============================================================================ */

var TU_Spring = class {
  constructor(val = 0, stiffness = 210, damping = 22) {
    this.x = val;
    this.v = 0;
    this.target = val;
    this.k = stiffness;
    this.d = damping;
  }
  set(t) { this.target = t; }
  impulse(dv) { this.v += dv; }
  step(dt) {
    const f = -this.k * (this.x - this.target) - this.d * this.v;
    this.v += f * dt;
    this.x += this.v * dt;
    return this.x;
  }
};

function tuClamp(n, a = 0, b = 1) { return Math.max(a, Math.min(b, n)); }
function tuLerp(a, b, t) { return a + (b - a) * tuClamp(t, 0, 1); }
function tuSmooth(p, a, b) {
  const t = tuClamp((p - a) / Math.max(0.0001, b - a), 0, 1);
  return t * t * (3 - 2 * t);
}

/* ============================================================================
   1. SELENA FX — Green Enemy Highlighting, Sonar HUD, & Echo Break
   ============================================================================ */
var SelenaFX = (() => {
  const NS = 'http://www.w3.org/2000/svg';

  function ensureEnemyHud(u) {
    if (!u || !u.el) return null;
    let hud = u._selenaHudEl;
    if (hud && hud.parentNode === u.el) return hud;
    hud = document.createElementNS(NS, 'svg');
    hud.setAttribute('viewBox', '0 0 120 140');
    hud.setAttribute('class', 'tu-selena-hud');
    hud.style.cssText = 'position:absolute;left:50%;top:50%;width:128%;height:128%;transform:translate(-50%,-54%);pointer-events:none;overflow:visible;z-index:18;display:none';
    hud.innerHTML = `
      <defs>
        <linearGradient id="selSonarGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#3cff9e" stop-opacity="0"/>
          <stop offset="50%" stop-color="#3cff9e" stop-opacity="0.38"/>
          <stop offset="100%" stop-color="#7be5bf" stop-opacity="0"/>
        </linearGradient>
      </defs>
      <!-- Green Sonar Aura Ellipse -->
      <ellipse data-role="aura" cx="60" cy="76" rx="44" ry="52" fill="rgba(52, 255, 152, 0.12)" stroke="#3cff9e" stroke-width="1.8" stroke-dasharray="6 4"/>
      <!-- Tactical Green Corner Brackets -->
      <g data-role="brackets" stroke="#4dffaa" stroke-width="2.6" fill="none" stroke-linecap="round">
        <path d="M22,34 L22,22 L36,22"/>
        <path d="M84,22 L98,22 L98,34"/>
        <path d="M22,108 L22,120 L36,120"/>
        <path d="M84,120 L98,120 L98,108"/>
      </g>
      <!-- Sweeping Green Radar Scanline -->
      <line data-role="scanline" x1="22" y1="60" x2="98" y2="60" stroke="#7affc6" stroke-width="2.2" opacity="0.85"/>
      <!-- 4 Echo Trace Pips above head -->
      <g data-role="pips" transform="translate(60, 10)">
        <polygon data-pip="0" points="-24,0 -19,-6 -14,0 -19,6" fill="#1b3a2e" stroke="#4dffaa" stroke-width="1.4"/>
        <polygon data-pip="1" points="-8,0 -3,-6 2,0 -3,6" fill="#1b3a2e" stroke="#4dffaa" stroke-width="1.4"/>
        <polygon data-pip="2" points="8,0 13,-6 18,0 13,6" fill="#1b3a2e" stroke="#4dffaa" stroke-width="1.4"/>
        <polygon data-pip="3" points="24,0 29,-6 34,0 29,6" fill="#1b3a2e" stroke="#4dffaa" stroke-width="1.4"/>
      </g>
    `;
    u.el.appendChild(hud);
    u._selenaHudEl = hud;
    return hud;
  }

  function syncUnit(u, t = 0) {
    if (!u || !u.el) return;
    const mapped = u.alive && u.hasStatus && u.hasStatus('selena_mapped');
    const traceSt = u.alive && u.getStatus ? u.getStatus('selena_trace') : null;
    const traces = traceSt ? (traceSt.stacks || 1) : 0;

    if (!mapped && traces <= 0) {
      if (u._selenaHudEl) u._selenaHudEl.style.display = 'none';
      if (u._selenaGreenFilter) {
        u._selenaGreenFilter = false;
        if (u.imgEl) u.imgEl.style.filter = '';
      }
      return;
    }

    const hud = ensureEnemyHud(u);
    if (!hud) return;
    hud.style.display = 'block';

    // Highlight mapped enemies green on their sprite!
    if (u.imgEl) {
      if (mapped) {
        const pulse = 0.65 + 0.25 * Math.sin(t * 6);
        u.imgEl.style.filter = `drop-shadow(0 0 7px rgba(60,255,158,${pulse.toFixed(2)})) drop-shadow(0 0 15px rgba(45,220,130,0.48))`;
        u._selenaGreenFilter = true;
      } else if (u._selenaGreenFilter) {
        u.imgEl.style.filter = '';
        u._selenaGreenFilter = false;
      }
    }

    const aura = hud.querySelector('[data-role="aura"]');
    const brackets = hud.querySelector('[data-role="brackets"]');
    const scan = hud.querySelector('[data-role="scanline"]');
    if (aura) aura.setAttribute('visibility', mapped ? 'visible' : 'hidden');
    if (brackets) {
      brackets.setAttribute('visibility', mapped ? 'visible' : 'hidden');
      const s = 1 + 0.03 * Math.sin(t * 5);
      brackets.setAttribute('transform', `translate(60,71) scale(${s.toFixed(3)}) translate(-60,-71)`);
    }
    if (scan) {
      scan.setAttribute('visibility', mapped ? 'visible' : 'hidden');
      const sy = 26 + ((t * 55) % 90);
      scan.setAttribute('y1', sy.toFixed(1));
      scan.setAttribute('y2', sy.toFixed(1));
    }
    const pips = hud.querySelectorAll('[data-pip]');
    pips.forEach((p, idx) => {
      const active = idx < traces;
      p.setAttribute('fill', active ? '#3cff9e' : 'rgba(20,48,36,0.55)');
      p.setAttribute('opacity', active || mapped ? '1' : '0.35');
    });
  }

  function syncBattle(B) {
    if (!B || !B.units) return;
    const t = B.t || performance.now() / 1000;
    for (const u of B.units) syncUnit(u, t);
  }

  function sonarWave(B, u, radius = 180) {
    if (!B || !u || B.offscreen) return;
    if (B.fxRing) {
      B.fxRing(u.x, u.y - 48, radius, '#3cff9e', 0.65);
      B.fxRing(u.x, u.y - 48, radius * 0.68, '#7be5bf', 0.48);
    }
    syncBattle(B);
  }

  function echoBreak(B, u, target) {
    if (!B || !target || B.offscreen) return;
    if (B.fxRing) {
      B.fxRing(target.x, target.y - 42, 110, '#3cff9e', 0.55);
      B.fxRing(target.x, target.y - 42, 72, '#b8ffe0', 0.42);
    }
    if (B.fxSparkle) B.fxSparkle(target.x, target.y - 42, 8, '#3cff9e');
    if (B.fxFloatIcon) B.fxFloatIcon(target.x, target.y - 95, '◉ ECHO BREAK', '#3cff9e');
    syncBattle(B);
  }

  function counterPulse(B, u, target) {
    if (!B || !u || !target || B.offscreen) return;
    if (B.fxRing) B.fxRing(target.x, target.y - 44, 85, '#3cff9e', 0.45);
    if (B.fxSparkle) B.fxSparkle(target.x, target.y - 44, 5, '#7be5bf');
    syncBattle(B);
  }

  return { syncUnit, syncBattle, sonarWave, echoBreak, counterPulse };
})();
window.SelenaFX = SelenaFX;

/* ============================================================================
   2. DISCARD FX — Music Streams Around Discard & Allies
   ============================================================================ */
var DiscardFX = (() => {
  const NS = 'http://www.w3.org/2000/svg';

  function ensureStreamOverlay(u) {
    if (!u || !u.el) return null;
    let ov = u._discardStreamEl;
    if (ov && ov.parentNode === u.el) return ov;
    ov = document.createElementNS(NS, 'svg');
    ov.setAttribute('viewBox', '0 0 140 150');
    ov.setAttribute('class', 'tu-discard-stream');
    ov.style.cssText = 'position:absolute;left:50%;top:50%;width:142%;height:142%;transform:translate(-50%,-52%);pointer-events:none;overflow:visible;z-index:17;display:none';
    ov.innerHTML = `
      <defs>
        <linearGradient id="disStreamCyan" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stop-color="#7be5ff" stop-opacity="0"/>
          <stop offset="30%" stop-color="#7be5ff" stop-opacity="0.88"/>
          <stop offset="70%" stop-color="#c39bff" stop-opacity="0.88"/>
          <stop offset="100%" stop-color="#ff6ad5" stop-opacity="0"/>
        </linearGradient>
        <linearGradient id="disStreamPink" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stop-color="#ff6ad5" stop-opacity="0"/>
          <stop offset="40%" stop-color="#ff6ad5" stop-opacity="0.82"/>
          <stop offset="80%" stop-color="#7be5ff" stop-opacity="0.82"/>
          <stop offset="100%" stop-color="#7be5ff" stop-opacity="0"/>
        </linearGradient>
      </defs>
      <!-- Stationary Beat-Down Ground Equalizer Ring -->
      <ellipse data-role="beat-ring" cx="70" cy="126" rx="54" ry="15" fill="rgba(123,229,255,0.12)" stroke="#7be5ff" stroke-width="2.2" stroke-dasharray="10 6" visibility="hidden"/>
      <!-- Flowing Music Stream Ribbons -->
      <path data-role="stream1" d="M12,92 C38,68 102,112 128,82" fill="none" stroke="url(#disStreamCyan)" stroke-width="3.2" stroke-linecap="round"/>
      <path data-role="stream2" d="M16,64 C46,88 94,42 124,68" fill="none" stroke="url(#disStreamPink)" stroke-width="2.4" stroke-linecap="round" stroke-dasharray="8 5"/>
      <!-- Floating Music Notes -->
      <text data-note="0" x="24" y="62" fill="#7be5ff" font-size="16" font-weight="bold">♪</text>
      <text data-note="1" x="108" y="54" fill="#ff6ad5" font-size="15" font-weight="bold">♫</text>
      <text data-note="2" x="68" y="32" fill="#c39bff" font-size="14" font-weight="bold">♬</text>
    `;
    u.el.appendChild(ov);
    u._discardStreamEl = ov;
    return ov;
  }

  function syncUnit(u, t = 0) {
    if (!u || !u.el) return;
    const isDiscard = u.id === 'Discard' && u.alive;
    const hasBeat = u.alive && u.hasStatus && (u.hasStatus('discard_beat') || u.hasStatus('discard_performing'));
    const hasFlow = u.alive && u.hasStatus && (u.hasStatus('discard_flow') || u.hasStatus('discard_track') || u.hasStatus('discard_perfect'));
    const hasVibes = u.alive && u.hasStatus && u.hasStatus('discard_vibes');
    const active = isDiscard || hasBeat || hasFlow || hasVibes;

    if (!active) {
      if (u._discardStreamEl) u._discardStreamEl.style.display = 'none';
      return;
    }

    const ov = ensureStreamOverlay(u);
    if (!ov) return;
    ov.style.display = 'block';

    const intense = hasBeat || hasFlow || (isDiscard && u.hasStatus && u.hasStatus('discard_performing'));
    const speed = intense ? 5.5 : 2.8;
    const s1 = ov.querySelector('[data-role="stream1"]');
    const s2 = ov.querySelector('[data-role="stream2"]');
    const bRing = ov.querySelector('[data-role="beat-ring"]');

    const w1 = Math.sin(t * speed) * 14;
    const w2 = Math.cos(t * speed * 0.9) * 14;
    if (s1) {
      s1.setAttribute('d', `M10,${(88 + w1 * 0.5).toFixed(1)} C42,${(62 - w1).toFixed(1)} 98,${(114 + w1).toFixed(1)} 130,${(78 - w1 * 0.5).toFixed(1)}`);
      s1.setAttribute('opacity', intense ? '0.95' : '0.55');
    }
    if (s2) {
      s2.setAttribute('d', `M14,${(62 - w2 * 0.5).toFixed(1)} C48,${(90 + w2).toFixed(1)} 92,${(38 - w2).toFixed(1)} 126,${(66 + w2 * 0.5).toFixed(1)}`);
      s2.setAttribute('opacity', intense ? '0.88' : '0.42');
    }
    if (bRing) {
      const showRing = isDiscard && u.hasStatus && (u.hasStatus('discard_performing') || u.hasStatus('discard_perfect'));
      bRing.setAttribute('visibility', showRing ? 'visible' : 'hidden');
      if (showRing) {
        const rx = 52 + Math.sin(t * 8) * 5;
        bRing.setAttribute('rx', rx.toFixed(1));
      }
    }

    const notes = ov.querySelectorAll('[data-note]');
    notes.forEach((n, idx) => {
      const phase = t * (intense ? 3.6 : 2.0) + idx * 2.1;
      const nx = (idx === 0 ? 22 : idx === 1 ? 106 : 66) + Math.sin(phase * 1.3) * 8;
      const ny = (idx === 0 ? 68 : idx === 1 ? 62 : 38) - ((phase * 12) % 28);
      const op = Math.sin(((phase * 12) % 28) / 28 * Math.PI) * (intense ? 0.95 : 0.55);
      n.setAttribute('x', nx.toFixed(1));
      n.setAttribute('y', ny.toFixed(1));
      n.setAttribute('opacity', Math.max(0, op).toFixed(2));
    });
  }

  function syncBattle(B) {
    if (!B || !B.units) return;
    const t = B.t || performance.now() / 1000;
    for (const u of B.units) syncUnit(u, t);
  }

  function pulse(B, u, kind = 'vibes') {
    if (!B || !u || B.offscreen) return;
    const palette = {
      note:    ['#7be5ff', '#c39bff', 85,  '♪'],
      vibes:   ['#7be5ff', '#ff6ad5', 135, '♫ GOOD VIBES'],
      beat:    ['#ff6ad5', '#7be5ff', 210, '♫ BEAT-DOWN'],
      flow:    ['#7be5ff', '#8affc1', 155, '♬ FLOW'],
      back:    ['#ffe066', '#7be5ff', 130, '♪ BACK ON BEAT'],
      track:   ['#c39bff', '#7be5ff', 145, '♫ D15CRD'],
      easy:    ['#8affc1', '#7be5ff', 110, '♪ CHILL'],
      perfect: ['#ff6ad5', '#ffe066', 240, '♬ PERFECT FLOW']
    };
    const [c1, c2, rad, label] = palette[kind] || palette.vibes;
    if (B.fxRing) {
      B.fxRing(u.x, u.y - 44, rad, c1, 0.55);
      B.fxRing(u.x, u.y - 44, rad * 0.72, c2, 0.42);
    }
    if (B.fxSparkle) B.fxSparkle(u.x, u.y - 48, kind === 'perfect' ? 10 : 5, c1);
    if (B.fxFloatIcon && ['beat', 'flow', 'perfect'].includes(kind)) {
      B.fxFloatIcon(u.x, u.y - 96, label, c1);
    }
    syncBattle(B);
  }

  return { syncUnit, syncBattle, pulse };
})();
window.DiscardFX = DiscardFX;

/* ============================================================================
   3. COPPER FX — Translucent 3D Orange Orb Shield & Multi-Color Flame Waves
   ============================================================================ */
var CopperFX = (() => {
  const NS = 'http://www.w3.org/2000/svg';

  function ensureOrbOverlay(u) {
    if (!u || !u.el) return null;
    let ov = u._copperOrbEl;
    if (ov && ov.parentNode === u.el) return ov;
    ov = document.createElementNS(NS, 'svg');
    ov.setAttribute('viewBox', '0 0 140 150');
    ov.setAttribute('class', 'tu-copper-orb');
    ov.style.cssText = 'position:absolute;left:50%;top:50%;width:142%;height:142%;transform:translate(-50%,-53%);pointer-events:none;overflow:visible;z-index:19;display:none';
    const uid = 'copOrb_' + Math.random().toString(36).slice(2, 8);
    ov.innerHTML = `
      <defs>
        <radialGradient id="${uid}" cx="38%" cy="32%" r="65%">
          <stop offset="0%" stop-color="#fff6d6" stop-opacity="0.48"/>
          <stop offset="38%" stop-color="#ff9e3d" stop-opacity="0.26"/>
          <stop offset="78%" stop-color="#ff6a14" stop-opacity="0.44"/>
          <stop offset="100%" stop-color="#ff4500" stop-opacity="0.72"/>
        </radialGradient>
      </defs>
      <!-- 3D Orange Orb Shield -->
      <g data-role="orb" visibility="hidden">
        <circle cx="70" cy="78" r="54" fill="url(#${uid})" stroke="#ffa038" stroke-width="2.8"/>
        <circle cx="70" cy="78" r="50" fill="none" stroke="#ffe194" stroke-width="1.3" stroke-dasharray="14 8" opacity="0.8"/>
        <!-- Specular Gloss Highlight on Upper-Left of Orb -->
        <path d="M38,48 A42,42 0 0,1 86,36" fill="none" stroke="#fff8e7" stroke-width="4" stroke-linecap="round" opacity="0.65"/>
        <ellipse cx="48" cy="48" rx="10" ry="5" transform="rotate(-32 48 48)" fill="#ffffff" opacity="0.45"/>
      </g>
      <!-- Orbiting Wicklight Embers (for Copper) -->
      <g data-role="wick-embers" visibility="hidden">
        <circle data-ember="0" cx="70" cy="78" r="4.5" fill="#ffb347" stroke="#fff5cc" stroke-width="1.2"/>
        <circle data-ember="1" cx="70" cy="78" r="4.5" fill="#ff8c24" stroke="#fff5cc" stroke-width="1.2"/>
        <circle data-ember="2" cx="70" cy="78" r="4.5" fill="#ffb347" stroke="#fff5cc" stroke-width="1.2"/>
        <circle data-ember="3" cx="70" cy="78" r="4.5" fill="#ff6a14" stroke="#fff5cc" stroke-width="1.2"/>
        <circle data-ember="4" cx="70" cy="78" r="4.5" fill="#ffe082" stroke="#fff5cc" stroke-width="1.2"/>
      </g>
    `;
    u.el.appendChild(ov);
    u._copperOrbEl = ov;
    return ov;
  }

  function syncUnit(u, t = 0) {
    if (!u || !u.el) return;
    const guarded = u.alive && u.hasStatus && u.hasStatus('copper_guard');
    const wickSt = u.alive && u.getStatus ? u.getStatus('copper_wick') : null;
    const wicks = wickSt ? (wickSt.stacks || 1) : 0;

    if (!guarded && wicks <= 0) {
      if (u._copperOrbEl) u._copperOrbEl.style.display = 'none';
      return;
    }

    const ov = ensureOrbOverlay(u);
    if (!ov) return;
    ov.style.display = 'block';

    const orb = ov.querySelector('[data-role="orb"]');
    if (orb) {
      orb.setAttribute('visibility', guarded ? 'visible' : 'hidden');
      if (guarded) {
        const s = 1 + 0.035 * Math.sin(t * 5.2);
        orb.setAttribute('transform', `translate(70,78) scale(${s.toFixed(3)}) translate(-70,-78)`);
      }
    }

    const emberGroup = ov.querySelector('[data-role="wick-embers"]');
    if (emberGroup) {
      emberGroup.setAttribute('visibility', wicks > 0 ? 'visible' : 'hidden');
      if (wicks > 0) {
        const embers = emberGroup.querySelectorAll('[data-ember]');
        embers.forEach((em, idx) => {
          if (idx >= wicks) {
            em.setAttribute('visibility', 'hidden');
            return;
          }
          em.setAttribute('visibility', 'visible');
          const ang = t * 2.8 + (idx * Math.PI * 2) / Math.max(1, wicks);
          const ex = 70 + Math.cos(ang) * 44;
          const ey = 76 + Math.sin(ang) * 18;
          em.setAttribute('cx', ex.toFixed(1));
          em.setAttribute('cy', ey.toFixed(1));
        });
      }
    }
  }

  function syncBattle(B) {
    if (!B || !B.units) return;
    const t = B.t || performance.now() / 1000;
    for (const u of B.units) syncUnit(u, t);
  }

  function guardOrb(B, u, target) {
    if (!B || !target || B.offscreen) return;
    if (B.fxRing) {
      B.fxRing(target.x, target.y - 44, 115, '#ff9436', 0.55);
      B.fxRing(target.x, target.y - 44, 78, '#ffe082', 0.45);
    }
    if (B.fxSparkle) B.fxSparkle(target.x, target.y - 44, 7, '#ff9e3d');
    if (B.fxFloatIcon) B.fxFloatIcon(target.x, target.y - 95, '🛡 GUARD ORB', '#ffe7a1');
    syncBattle(B);
  }

  function flameWave(B, u, mode = 'orange') {
    if (!B || !u || B.offscreen) return;
    u._copperFlameMode = mode;
    u._copperFlameUntil = (B.t || 0) + 6.5;
    const colors = {
      blue:   ['#5ec8ff', '#bcebff', '🔥 BLUE FLAME'],
      white:  ['#fff8e7', '#ffd98a', '🔥 WHITE FLAME'],
      orange: ['#ff8c24', '#ffe082', '🔥 ORANGE FLAME']
    };
    const [c1, c2, label] = colors[mode] || colors.orange;
    if (B.fxRing) {
      B.fxRing(u.x, u.y - 46, 175, c1, 0.62);
      B.fxRing(u.x, u.y - 46, 125, c2, 0.48);
    }
    if (B.fxSparkle) B.fxSparkle(u.x, u.y - 50, 9, c1);
    if (B.fxFloatIcon) B.fxFloatIcon(u.x, u.y - 95, label, c2);
    syncBattle(B);
  }

  return { syncUnit, syncBattle, guardOrb, flameWave };
})();
window.CopperFX = CopperFX;

/* ============================================================================
   4. SELENA & DISCARD RIGS (window.ToonsUniverseRigs)
   ============================================================================ */
var ToonsUniverseRigs = (() => {
  const NS = 'http://www.w3.org/2000/svg';
  const Spring = TU_Spring;
  const clamp = (n, a = 0, b = 1) => Math.max(a, Math.min(b, n));
  const lerp = (a, b, t) => a + (b - a) * clamp(t, 0, 1);
  const smooth = (p, a, b) => {
    const t = clamp((p - a) / Math.max(0.0001, b - a), 0, 1);
    return t * t * (3 - 2 * t);
  };

  /* --------------------------------------------------------------------------
     SELENA RIG (338 x 481)
     -------------------------------------------------------------------------- */
  function createSelenaRig(host, options = {}) {
    const d = (window.TU_RIG_DATA && window.TU_RIG_DATA.Selena) || {
      width: 338, height: 481,
      parts: [
        { name: 'wingL', pivot: [156, 238], src: 'parts/wingL.png' },
        { name: 'wingR', pivot: [180, 238], src: 'parts/wingR.png' },
        { name: 'body',  pivot: [167, 290], src: 'parts/body.png' },
        { name: 'chest', pivot: [168, 234], src: 'parts/chest.png' },
        { name: 'head',  pivot: [168, 228], src: 'parts/head.png' }
      ]
    };
    const base = options.assetBase || (typeof ASSET === 'string' ? ASSET : '') + 'assets/toon-art/Selena/';
    const svg = document.createElementNS(NS, 'svg');
    svg.setAttribute('viewBox', '72 68 195 398');
    svg.style.cssText = 'display:block;width:100%;height:100%;overflow:visible';
    svg.setAttribute('aria-label', 'Selena');
    host.appendChild(svg);

    const rootG = document.createElementNS(NS, 'g');
    svg.appendChild(rootG);

    // Subtle green sonar ground shadow/ripple
    const shadow = document.createElementNS(NS, 'ellipse');
    shadow.setAttribute('cx', '168');
    shadow.setAttribute('cy', '452');
    shadow.setAttribute('rx', '42');
    shadow.setAttribute('ry', '10');
    shadow.setAttribute('fill', 'rgba(60, 255, 158, 0.18)');
    rootG.appendChild(shadow);

    const groups = {};
    const springs = {};
    for (const p of d.parts) {
      const g = document.createElementNS(NS, 'g');
      g.setAttribute('data-bone', p.name);
      const im = document.createElementNS(NS, 'image');
      im.setAttribute('href', base + p.src);
      im.setAttribute('width', d.width);
      im.setAttribute('height', d.height);
      g.appendChild(im);
      rootG.appendChild(g);
      groups[p.name] = g;
      springs[p.name] = {
        r: new TU_Spring(0, 220, 21),
        x: new TU_Spring(0, 210, 22),
        y: new TU_Spring(0, 210, 22),
        sx: new TU_Spring(1, 220, 22),
        sy: new TU_Spring(1, 220, 22)
      };
    }

    // Add expressive SVG Eye & Sonar Ear Ring overlay onto Selena's head bone
    const faceG = document.createElementNS(NS, 'g');
    faceG.setAttribute('data-role', 'selena-face-fx');
    faceG.innerHTML = `
      <!-- Glowing Emerald Sonar Pupil Ring (visible during casts/analysis) -->
      <ellipse data-fx="eye-ring" cx="188" cy="209" rx="7" ry="8" fill="none" stroke="#4dffaa" stroke-width="1.8" opacity="0"/>
      <!-- Natural Purple Eyelid for Blinks & Analytical Narrowed Gaze -->
      <path data-fx="eyelid" d="M174,199 Q188,195 201,203 L201,197 Q188,192 174,197 Z" fill="#4e2e5c" opacity="0"/>
      <!-- Focused Brow Line -->
      <path data-fx="brow" d="M174,198 Q189,195 201,202" fill="none" stroke="#2a1435" stroke-width="2.6" stroke-linecap="round" opacity="0"/>
      <!-- Ear Tip Sonar Broadcast Rings -->
      <circle data-fx="sonar-wave-1" cx="182" cy="105" r="12" fill="none" stroke="#3cff9e" stroke-width="2" opacity="0"/>
      <circle data-fx="sonar-wave-2" cx="182" cy="105" r="24" fill="none" stroke="#7be5bf" stroke-width="1.5" opacity="0"/>
    `;
    if (groups.head) groups.head.appendChild(faceG);

    // Add Wing Slash Emerald Arc overlay onto rootG
    const slashArc = document.createElementNS(NS, 'path');
    slashArc.setAttribute('d', 'M140,175 Q245,225 160,315');
    slashArc.setAttribute('fill', 'none');
    slashArc.setAttribute('stroke', '#3cff9e');
    slashArc.setAttribute('stroke-width', '5');
    slashArc.setAttribute('stroke-linecap', 'round');
    slashArc.setAttribute('opacity', '0');
    rootG.appendChild(slashArc);

    const idleImage = document.createElementNS(NS, 'image');
    idleImage.setAttribute('data-static-idle', 'Selena');
    idleImage.setAttribute('href', base + 'Selena.png');
    idleImage.setAttribute('width', d.width);
    idleImage.setAttribute('height', d.height);
    idleImage.setAttribute('visibility', 'hidden');
    svg.appendChild(idleImage);

    const rootSp = {
      x: new TU_Spring(0, 190, 20),
      y: new TU_Spring(0, 190, 20),
      r: new TU_Spring(0, 190, 20),
      wingOp: new TU_Spring(0, 180, 20)
    };

    let t = Math.random() * 10;
    let lastStyle = '';

    function update(u = {}, dt = 1 / 60, battle = null) {
      const step = Math.min(0.08, Math.max(0.001, dt));
      t += step;
      if (battle) SelenaFX.syncBattle(battle);

      const reduced = !!(u.visualSleep || (typeof Accessibility !== 'undefined' && Accessibility.enabled()));
      if (reduced) {
        idleImage.setAttribute('visibility', 'visible');
        rootG.setAttribute('visibility', 'hidden');
        return;
      }
      idleImage.setAttribute('visibility', 'hidden');
      rootG.setAttribute('visibility', 'visible');

      const walk = !!(u.moving || u.animState === 'walk');
      const style = u.animT > 0 ? (u.animStyle || u.animState || '') : (u.casting ? 'cast' : '');
      const prog = u.animT > 0 && u.animDur > 0 ? tuClamp(1 - u.animT / u.animDur, 0, 1) : 0;
      const hurt = (u.hitT || 0) > 0;
      const evasive = !!(u.hasStatus && u.hasStatus('selena_evasion'));
      const observing = !!(u.hasStatus && u.hasStatus('selena_observe'));

      if (style && style !== lastStyle) {
        rootSp.y.impulse(-35);
      }
      lastStyle = style;

      // Default Hovering Idle Pose
      const hover = Math.sin(t * 2.4);
      const breathe = Math.sin(t * 2.4 - 0.6);
      let rx = 0, ry = hover * 5.5 - (evasive ? 7 : 0), rr = 0;
      let headR = Math.sin(t * 1.6) * 2.2 + (observing ? -3.5 : 0);
      let headX = 0, headY = breathe * 1.2;
      let chestR = breathe * 1.4, chestX = 0, chestY = 0, chestSX = 1 + breathe * 0.015, chestSY = 1;
      let bodyR = Math.sin(t * 2.4 - 1.1) * 2.8, bodyX = 0, bodyY = 0;
      let wingLR = -42, wingRR = 42, wingOp = evasive ? 0.65 : 0.0;
      let eyeRingOp = observing ? 0.85 : 0;
      let eyelidOp = 0, browOp = observing ? 0.85 : 0;
      let sonarWaveOp = 0, slashOp = 0;

      // Periodic natural blink in idle
      const blinkCycle = (t * 0.85) % 4.2;
      if (blinkCycle > 4.02) eyelidOp = Math.sin(((blinkCycle - 4.02) / 0.18) * Math.PI);

      // Walk / Glide Forward
      if (walk && !style) {
        rx = 6;
        ry = hover * 4 - 6;
        rr = 7;
        headR = -5 + Math.sin(t * 6) * 2;
        chestR = 5 + Math.sin(t * 6) * 2.5;
        bodyR = -11 + Math.cos(t * 6) * 4.5;
        wingOp = 0.45;
        wingLR = -22 + Math.sin(t * 9) * 14;
        wingRR = 22 - Math.sin(t * 9) * 14;
      }

      // 4-Phase Skill & Basic Attack Choreography:
      // Phase 1: Start-up (0.00 - 0.18)
      // Phase 2: Wind-up  (0.18 - 0.38)
      // Phase 3: Mid-skill(0.38 - 0.76)
      // Phase 4: Ending   (0.76 - 1.00)
      if (style === 'basic' || u.animState === 'attack') {
        const isClaw = !!u.selenaClaw;
        wingOp = 1.0;
        browOp = 0.9;
        eyeRingOp = 0.7;
        if (prog < 0.20) {
          // Start-up: focus & gather
          const k = tuSmooth(prog, 0, 0.20);
          rx = -4 * k; ry = 3 * k; headR = -6 * k; chestR = -5 * k;
          wingLR = tuLerp(-35, -18, k); wingRR = tuLerp(35, 18, k);
        } else if (prog < 0.40) {
          // Wind-up: raise wings / coil claw
          const k = tuSmooth(prog, 0.20, 0.40);
          rx = tuLerp(-4, -9, k); ry = tuLerp(3, -8, k);
          headR = tuLerp(-6, -10, k);
          chestR = tuLerp(-5, -12, k);
          wingLR = tuLerp(-18, -32, k); wingRR = tuLerp(18, 30, k);
        } else if (prog < 0.74) {
          // Mid-skill: Wing Slash or Claw Swipe!
          const k = tuSmooth(prog, 0.40, 0.74);
          rx = tuLerp(-9, isClaw ? 18 : 12, Math.sin(k * Math.PI));
          ry = tuLerp(-8, isClaw ? 2 : -4, k);
          rr = (isClaw ? 14 : 9) * Math.sin(k * Math.PI);
          headR = 8 * Math.sin(k * Math.PI);
          chestR = (isClaw ? 14 : 10) * Math.sin(k * Math.PI);
          bodyR = -14 * Math.sin(k * Math.PI);
          wingLR = tuLerp(-32, 24, Math.sin(k * Math.PI));
          wingRR = tuLerp(30, -24, Math.sin(k * Math.PI));
          slashOp = Math.sin(k * Math.PI) * 0.9;
        } else {
          // Ending: fold wings back into cloak
          const k = tuSmooth(prog, 0.74, 1.0);
          wingOp = 1 - k;
          wingLR = tuLerp(10, -40, k);
          wingRR = tuLerp(-10, 40, k);
        }
      } else if (style === 'selenaSonar' || style === 'selenaEcho') {
        // W: Sonar / P: Echo-Location
        wingOp = 1.0;
        eyeRingOp = 1.0;
        browOp = 0.85;
        if (prog < 0.18) {
          // Start-up: crouch & wrap cloak tightly, ears perked
          const k = tuSmooth(prog, 0, 0.18);
          ry = 6 * k; chestSX = 1 - 0.06 * k; headR = -8 * k;
          wingLR = -38; wingRR = 38;
        } else if (prog < 0.36) {
          // Wind-up: ascend high into the air and unfurl wings wide
          const k = tuSmooth(prog, 0.18, 0.36);
          ry = tuLerp(6, -24, k);
          headR = tuLerp(-8, -4, k);
          chestR = -6 * k;
          bodyR = 10 * k;
          wingLR = tuLerp(-38, -28, k);
          wingRR = tuLerp(38, 28, k);
        } else if (prog < 0.76) {
          // Mid-skill: 3 rhythmic sonar wing-pulse broadcasts from ears & wings
          const k = (prog - 0.36) / 0.40;
          const pulse = Math.sin(k * Math.PI * 3);
          ry = -24 - Math.abs(pulse) * 6;
          headR = -4 + pulse * 6;
          chestR = pulse * 5;
          bodyR = -pulse * 8;
          wingLR = -10 + pulse * 26;
          wingRR = 10 - pulse * 26;
          sonarWaveOp = Math.abs(pulse);
        } else {
          // Ending: swooping aerial dive slash & graceful landing
          const k = tuSmooth(prog, 0.76, 1.0);
          const dive = Math.sin(k * Math.PI);
          rx = 16 * dive;
          ry = tuLerp(-20, 0, k);
          rr = 14 * dive;
          chestR = 10 * dive;
          bodyR = -15 * dive;
          wingLR = tuLerp(12, -38, k);
          wingRR = tuLerp(-12, 38, k);
          wingOp = tuLerp(1.0, 0.15, k);
          slashOp = dive * 0.85;
        }
      } else if (style === 'selenaPursuit') {
        // G: Pinpoint Pursuit — Target lock -> Delta fold -> Multi-slash flurry -> Evasive backflip
        wingOp = 1.0;
        eyeRingOp = 1.0;
        browOp = 1.0;
        if (prog < 0.16) {
          // Start-up: target lock crouch
          const k = tuSmooth(prog, 0, 0.16);
          rx = -8 * k; ry = 5 * k; headR = 7 * k; chestR = 6 * k;
          wingLR = -30 * k; wingRR = 30 * k;
        } else if (prog < 0.32) {
          // Wind-up: fold wings back into delta-wing dash posture
          const k = tuSmooth(prog, 0.16, 0.32);
          rx = tuLerp(-8, 14, k); ry = tuLerp(5, -14, k); rr = 14 * k;
          headR = -8 * k; chestR = 12 * k; bodyR = -18 * k;
          wingLR = -24; wingRR = 24;
        } else if (prog < 0.76) {
          // Mid-skill: rapid 4-hit alternating wing/claw combo + downward finisher dive!
          const k = (prog - 0.32) / 0.44;
          const flurry = Math.sin(k * Math.PI * 4);
          rx = 18 + flurry * 10;
          ry = -14 + Math.cos(k * Math.PI * 2) * 8;
          rr = 12 + flurry * 8;
          headR = flurry * 7;
          chestR = 10 + flurry * 9;
          bodyR = -16 - flurry * 10;
          wingLR = flurry * 28;
          wingRR = -flurry * 28;
          slashOp = Math.abs(flurry) * 0.95;
        } else {
          // Ending: evasive backflip glide back to position
          const k = tuSmooth(prog, 0.76, 1.0);
          const arc = Math.sin(k * Math.PI);
          rx = tuLerp(16, 0, k) - 10 * arc;
          ry = -18 * arc;
          rr = -14 * arc;
          wingLR = tuLerp(-20, -35, k);
          wingRR = tuLerp(20, 35, k);
          wingOp = tuLerp(1.0, 0.6, k);
        }
      } else if (style === 'selenaObserve' || style === 'selenaObserveFinale') {
        // B: Calculated Response — Analytical cloak wrap & counter-pulse / finale beam
        const isFinale = style === 'selenaObserveFinale';
        eyeRingOp = 1.0;
        browOp = 0.95;
        if (!isFinale) {
          if (prog < 0.25) {
            // Start-up: draw cloak wings in
            const k = tuSmooth(prog, 0, 0.25);
            ry = -4 * k; chestSX = 1 - 0.08 * k; headR = -6 * k;
          } else if (prog < 0.75) {
            // Mid-skill: composed analytical scan with sonar pulse from ears
            const k = (prog - 0.25) / 0.50;
            ry = -6 + Math.sin(k * Math.PI * 2) * 3;
            headR = -5 + Math.sin(k * Math.PI * 2) * 4;
            chestSX = 0.93;
            eyelidOp = 0.38; // Analytical narrowed gaze
            sonarWaveOp = Math.abs(Math.sin(k * Math.PI * 2)) * 0.85;
          } else {
            const k = tuSmooth(prog, 0.75, 1.0);
            ry = tuLerp(-6, 0, k); chestSX = tuLerp(0.93, 1.0, k);
          }
        } else {
          // Finale precision strike
          wingOp = Math.sin(prog * Math.PI);
          const hit = Math.sin(prog * Math.PI);
          rx = 12 * hit; ry = -10 * hit; rr = 10 * hit;
          wingLR = -20 * hit; wingRR = 26 * hit;
          sonarWaveOp = hit;
          slashOp = hit * 0.85;
        }
      } else if (style === 'selenaFinal') {
        // R: Perfect Reading — Full-spectrum aerial ascension + double wing shockwave
        wingOp = 1.0;
        eyeRingOp = 1.0;
        browOp = 1.0;
        if (prog < 0.22) {
          // Start-up: gather & crouch
          const k = tuSmooth(prog, 0, 0.22);
          ry = 8 * k; chestSX = 0.92; headR = -10 * k;
          wingLR = -36; wingRR = 36;
        } else if (prog < 0.45) {
          // Wind-up: soar high with full majestic wingspan
          const k = tuSmooth(prog, 0.22, 0.45);
          ry = tuLerp(8, -30, k);
          headR = -6;
          wingLR = tuLerp(-36, -32, k);
          wingRR = tuLerp(36, 32, k);
          sonarWaveOp = k;
        } else if (prog < 0.80) {
          // Mid-skill: twin sweeping aerial sonar strikes
          const k = (prog - 0.45) / 0.35;
          const sweep = Math.sin(k * Math.PI * 2);
          rx = sweep * 14;
          ry = -28 + Math.abs(sweep) * 10;
          rr = sweep * 12;
          chestR = sweep * 10;
          bodyR = -sweep * 14;
          wingLR = sweep * 28;
          wingRR = -sweep * 28;
          sonarWaveOp = 1.0;
          slashOp = Math.abs(sweep);
        } else {
          // Ending: descend into poised hover
          const k = tuSmooth(prog, 0.80, 1.0);
          ry = tuLerp(-22, 0, k);
          wingOp = tuLerp(1.0, 0.3, k);
        }
      }

      if (hurt) {
        rx -= 7; headR = -12; chestR = -8; eyelidOp = 0.7;
      }

      // Step springs
      rootSp.x.set(rx); rootSp.y.set(ry); rootSp.r.set(rr); rootSp.wingOp.set(wingOp);
      const sRx = rootSp.x.step(step);
      const sRy = rootSp.y.step(step);
      const sRr = rootSp.r.step(step);
      const sWOp = tuClamp(rootSp.wingOp.step(step), 0, 1);

      rootG.setAttribute('transform', `translate(${sRx.toFixed(2)} ${sRy.toFixed(2)}) rotate(${sRr.toFixed(2)} 168 320)`);
      shadow.setAttribute('rx', (42 - sRy * 0.4).toFixed(1));

      const targets = {
        wingL: { r: wingLR, x: 0, y: 0, sx: 0.65 + 0.35 * sWOp, sy: 0.8 + 0.2 * sWOp },
        wingR: { r: wingRR, x: 0, y: 0, sx: 0.65 + 0.35 * sWOp, sy: 0.8 + 0.2 * sWOp },
        body:  { r: bodyR,  x: bodyX, y: bodyY, sx: 1, sy: 1 },
        chest: { r: chestR, x: chestX, y: chestY, sx: chestSX, sy: chestSY },
        head:  { r: headR,  x: headX, y: headY, sx: 1, sy: 1 }
      };

      for (const p of d.parts) {
        const sp = springs[p.name];
        const tg = targets[p.name];
        sp.r.set(tg.r); sp.x.set(tg.x); sp.y.set(tg.y); sp.sx.set(tg.sx); sp.sy.set(tg.sy);
        const r = sp.r.step(step);
        const x = sp.x.step(step);
        const y = sp.y.step(step);
        const sx = sp.sx.step(step);
        const sy = sp.sy.step(step);
        const [px, py] = p.pivot;
        const g = groups[p.name];
        g.setAttribute('transform', `translate(${(px + x).toFixed(2)} ${(py + y).toFixed(2)}) rotate(${r.toFixed(2)}) scale(${sx.toFixed(3)} ${sy.toFixed(3)}) translate(${-px} ${-py})`);
        if (p.name === 'wingL' || p.name === 'wingR') {
          g.setAttribute('opacity', sWOp.toFixed(3));
        }
      }

      // Update head FX overlays
      const eyeRing = faceG.querySelector('[data-fx="eye-ring"]');
      const eyelid = faceG.querySelector('[data-fx="eyelid"]');
      const brow = faceG.querySelector('[data-fx="brow"]');
      const sw1 = faceG.querySelector('[data-fx="sonar-wave-1"]');
      const sw2 = faceG.querySelector('[data-fx="sonar-wave-2"]');
      if (eyeRing) eyeRing.setAttribute('opacity', eyeRingOp.toFixed(2));
      if (eyelid) eyelid.setAttribute('opacity', eyelidOp.toFixed(2));
      if (brow) brow.setAttribute('opacity', browOp.toFixed(2));
      if (sw1 && sw2) {
        const wPhase = (t * 3.5) % 1;
        sw1.setAttribute('r', (8 + wPhase * 28).toFixed(1));
        sw1.setAttribute('opacity', (sonarWaveOp * (1 - wPhase)).toFixed(2));
        const wPhase2 = (t * 3.5 + 0.5) % 1;
        sw2.setAttribute('r', (8 + wPhase2 * 28).toFixed(1));
        sw2.setAttribute('opacity', (sonarWaveOp * (1 - wPhase2)).toFixed(2));
      }
      slashArc.setAttribute('opacity', slashOp.toFixed(2));
    }

    update({}, 1 / 60);
    return { svg, update, destroy() { svg.remove(); } };
  }

  /* --------------------------------------------------------------------------
     DISCARD RIG (554 x 710)
     -------------------------------------------------------------------------- */
  function createDiscardRig(host, options = {}) {
    const d = (window.TU_RIG_DATA && window.TU_RIG_DATA.Discard) || {
      width: 554, height: 710,
      parts: [
        { name: 'tail',  pivot: [356, 438], src: 'parts/tail.png' },
        { name: 'armR',  pivot: [422, 255], src: 'parts/armR.png' },
        { name: 'legs',  pivot: [385, 378], src: 'parts/legs.png' },
        { name: 'torso', pivot: [382, 368], src: 'parts/torso.png' },
        { name: 'head',  pivot: [378, 190], src: 'parts/head.png' },
        { name: 'armL',  pivot: [372, 236], src: 'parts/armL.png' }
      ]
    };
    const base = options.assetBase || (typeof ASSET === 'string' ? ASSET : '') + 'assets/toon-art/Discard/';
    const svg = document.createElementNS(NS, 'svg');
    svg.setAttribute('viewBox', '65 15 445 675');
    svg.style.cssText = 'display:block;width:100%;height:100%;overflow:visible';
    svg.setAttribute('aria-label', 'Discard');
    host.appendChild(svg);

    const rootG = document.createElementNS(NS, 'g');
    svg.appendChild(rootG);

    // Back Music Stream Ribbon Layer (behind Discard)
    const backStreamG = document.createElementNS(NS, 'g');
    backStreamG.innerHTML = `
      <ellipse data-fx="stage-ring" cx="380" cy="665" rx="115" ry="24" fill="rgba(123,229,255,0.14)" stroke="#7be5ff" stroke-width="3" stroke-dasharray="14 8" opacity="0.35"/>
      <path data-fx="back-ribbon" d="M120,440 C240,340 440,510 520,370" fill="none" stroke="#c39bff" stroke-width="5" stroke-linecap="round" opacity="0.45"/>
    `;
    rootG.appendChild(backStreamG);

    const groups = {};
    const springs = {};
    for (const p of d.parts) {
      const g = document.createElementNS(NS, 'g');
      g.setAttribute('data-bone', p.name);
      const im = document.createElementNS(NS, 'image');
      im.setAttribute('href', base + p.src);
      im.setAttribute('width', d.width);
      im.setAttribute('height', d.height);
      g.appendChild(im);
      rootG.appendChild(g);
      groups[p.name] = g;
      springs[p.name] = {
        r: new TU_Spring(0, 210, 20),
        x: new TU_Spring(0, 200, 21),
        y: new TU_Spring(0, 200, 21),
        sx: new TU_Spring(1, 210, 22),
        sy: new TU_Spring(1, 210, 22)
      };
    }

    // Cool Glasses Equalizer Glint & Headphone Sound Rings on head bone
    const headFxG = document.createElementNS(NS, 'g');
    headFxG.innerHTML = `
      <!-- Angular Shades Equalizer Glint -->
      <line data-fx="shades-glint" x1="422" y1="142" x2="438" y2="118" stroke="#7be5ff" stroke-width="3.5" stroke-linecap="round" opacity="0.6"/>
      <!-- Headphone Soundwave Rings -->
      <circle data-fx="hp-ring-1" cx="384" cy="134" r="24" fill="none" stroke="#7be5ff" stroke-width="2.5" opacity="0"/>
      <circle data-fx="hp-ring-2" cx="384" cy="134" r="42" fill="none" stroke="#ff6ad5" stroke-width="2" opacity="0"/>
    `;
    if (groups.head) groups.head.appendChild(headFxG);

    // Front Music Stream Ribbon & Notes Layer (in front of Discard)
    const frontStreamG = document.createElementNS(NS, 'g');
    frontStreamG.innerHTML = `
      <path data-fx="front-ribbon" d="M150,360 C275,460 425,280 530,350" fill="none" stroke="#7be5ff" stroke-width="4.5" stroke-linecap="round" stroke-dasharray="16 8" opacity="0.55"/>
      <text data-fx="note-a" x="485" y="260" fill="#7be5ff" font-size="30" font-weight="bold" opacity="0.7">♪</text>
      <text data-fx="note-b" x="255" y="210" fill="#ff6ad5" font-size="28" font-weight="bold" opacity="0.7">♫</text>
      <text data-fx="note-c" x="465" y="140" fill="#ffe066" font-size="26" font-weight="bold" opacity="0">♬</text>
    `;
    rootG.appendChild(frontStreamG);

    const idleImage = document.createElementNS(NS, 'image');
    idleImage.setAttribute('data-static-idle', 'Discard');
    idleImage.setAttribute('href', base + 'Discard.png');
    idleImage.setAttribute('width', d.width);
    idleImage.setAttribute('height', d.height);
    idleImage.setAttribute('visibility', 'hidden');
    svg.appendChild(idleImage);

    const rootSp = {
      x: new TU_Spring(0, 190, 20),
      y: new TU_Spring(0, 190, 20),
      r: new TU_Spring(0, 190, 20)
    };

    let t = Math.random() * 10;

    function update(u = {}, dt = 1 / 60, battle = null) {
      const step = Math.min(0.08, Math.max(0.001, dt));
      t += step;
      if (battle) DiscardFX.syncBattle(battle);

      const reduced = !!(u.visualSleep || (typeof Accessibility !== 'undefined' && Accessibility.enabled()));
      if (reduced) {
        idleImage.setAttribute('visibility', 'visible');
        rootG.setAttribute('visibility', 'hidden');
        return;
      }
      idleImage.setAttribute('visibility', 'hidden');
      rootG.setAttribute('visibility', 'visible');

      const walk = !!(u.moving || u.animState === 'walk');
      const style = u.animT > 0 ? (u.animStyle || u.animState || '') : (u.casting ? 'cast' : '');
      const prog = u.animT > 0 && u.animDur > 0 ? tuClamp(1 - u.animT / u.animDur, 0, 1) : 0;
      const hurt = (u.hitT || 0) > 0;
      const performing = !!(u.hasStatus && u.hasStatus('discard_performing'));
      const perfect = !!(u.hasStatus && u.hasStatus('discard_perfect'));
      const flowing = !!(u.hasStatus && u.hasStatus('discard_flow'));

      // Chill Laid-Back Idle Groove
      const beatFreq = performing || perfect ? 6.8 : 3.2;
      const groove = Math.sin(t * beatFreq);
      const bob = Math.abs(Math.sin(t * beatFreq * 0.5));

      let rx = 0, ry = -bob * 4, rr = 0;
      let headR = groove * 3.2, headX = 0, headY = bob * 2;
      let torsoR = groove * 1.6, torsoY = bob * 1.5;
      let armLR = groove * 2.5; // Hand resting on headphone cup
      let armRR = -groove * 3.5;
      let legsR = 0, legsY = 0;
      let tailR = Math.sin(t * beatFreq - 0.8) * 6.5;
      let streamIntense = (performing || perfect || flowing) ? 1.0 : 0.45;
      let hpRingOp = (performing || perfect) ? 0.85 : 0.0;

      // Stationary Beat-Down Performance (must stand still on feet while upper body jams!)
      if (performing && !style) {
        ry = Math.sin(t * 8) * 4;
        headR = Math.sin(t * 8) * 7.5;
        torsoR = Math.sin(t * 4) * 4.5;
        armLR = Math.sin(t * 8) * 5; // Holds headphone cup steady
        armRR = -18 + Math.sin(t * 8) * 14; // Pumps free hand to the beat (never -165 upside down!)
        legsR = 0; // Feet planted firmly on the ground!
        tailR = Math.sin(t * 8 - 0.6) * 12;
        streamIntense = 1.0;
        hpRingOp = 0.9;
      }

      // Walk / Stride
      if (walk && !style && !performing) {
        const stride = Math.sin(t * 7.5);
        rx = 5;
        ry = -Math.abs(stride) * 6;
        rr = 4;
        headR = 3 + stride * 3;
        torsoR = 4 + stride * 2;
        armLR = -4 + stride * 6;
        armRR = stride * 18;
        legsR = -stride * 7;
        tailR = -stride * 11;
      }

      // 4-Phase Skill & Basic Attack Choreography:
      // Start-up -> Wind-up -> Mid-skill -> Ending
      if (style === 'basic' || u.animState === 'attack') {
        // Offbeat Note: Touch headphones -> Coil -> Flick sound note -> Settle
        streamIntense = 0.85;
        if (prog < 0.22) {
          // Start-up: touch headphone cup & nod back
          const k = tuSmooth(prog, 0, 0.22);
          headR = -6 * k; armLR = -5 * k; torsoR = -3 * k;
        } else if (prog < 0.42) {
          // Wind-up: coil torso and draw armL ready
          const k = tuSmooth(prog, 0.22, 0.42);
          rx = -6 * k; headR = tuLerp(-6, -9, k); torsoR = -6 * k; armLR = -10 * k; tailR = -10 * k;
        } else if (prog < 0.74) {
          // Mid-skill: flick armL forward & release Offbeat Note!
          const k = tuSmooth(prog, 0.42, 0.74);
          const snap = Math.sin(k * Math.PI);
          rx = 10 * snap;
          headR = 9 * snap;
          torsoR = 7 * snap;
          armLR = 28 * snap;
          armRR = -16 * snap;
          tailR = 14 * snap;
          hpRingOp = snap * 0.85;
        } else {
          // Ending: chill return to headphones
          const k = tuSmooth(prog, 0.74, 1.0);
          armLR = tuLerp(12, 0, k);
          headR = tuLerp(4, 0, k);
        }
      } else if (style === 'discardBeatDown') {
        // W: Beat-Down — Plant feet -> Cue headphones -> Drop the stationary bass aura -> Groove
        streamIntense = 1.0;
        hpRingOp = 1.0;
        if (prog < 0.20) {
          // Start-up: plant feet firmly & crouch slightly
          const k = tuSmooth(prog, 0, 0.20);
          ry = 6 * k; headR = -5 * k; armLR = -4 * k; legsR = 0;
        } else if (prog < 0.40) {
          // Wind-up: lift head & raise right hand to cue the beat drop
          const k = tuSmooth(prog, 0.20, 0.40);
          ry = tuLerp(6, -6, k);
          headR = tuLerp(-5, -12, k);
          torsoR = -6 * k;
          armLR = -6;
          armRR = -32 * k;
          tailR = -12 * k;
        } else if (prog < 0.78) {
          // Mid-skill: BASS DROP! Stationary DJ bounce
          const k = (prog - 0.40) / 0.38;
          const drop = Math.sin(k * Math.PI * 3);
          ry = Math.abs(drop) * 6;
          headR = 11 * drop;
          torsoR = 6 * drop;
          armLR = 4 * drop;
          armRR = -22 + 16 * drop;
          tailR = 15 * drop;
        } else {
          // Ending: transition smoothly into continuous Beat-Down groove
          const k = tuSmooth(prog, 0.78, 1.0);
          headR = tuLerp(8, 3, k);
          armRR = tuLerp(-20, -10, k);
        }
      } else if (style === 'discardFlow' || style === 'discardBackOnBeat') {
        // G: Flow — Smooth evasive glide passing music streams to allies
        streamIntense = 1.0;
        hpRingOp = 0.85;
        if (prog < 0.20) {
          // Start-up: lean into low skater/wave posture
          const k = tuSmooth(prog, 0, 0.20);
          rx = -8 * k; ry = 4 * k; torsoR = -6 * k; headR = -5 * k;
        } else if (prog < 0.75) {
          // Wind-up & Mid-skill: smooth S-curve evasive wave glide
          const k = (prog - 0.20) / 0.55;
          const wave = Math.sin(k * Math.PI * 2);
          rx = wave * 14;
          ry = -10 * Math.sin(k * Math.PI);
          rr = wave * 8;
          headR = wave * 8;
          torsoR = wave * 6;
          armLR = 22 * Math.sin(k * Math.PI);
          armRR = -24 * Math.sin(k * Math.PI);
          tailR = -wave * 16;
        } else {
          // Ending: Back on Beat tempo snap
          const k = tuSmooth(prog, 0.75, 1.0);
          rx = tuLerp(6, 0, k);
          armLR = tuLerp(14, 0, k);
        }
      } else if (style === 'discardTrack' || style === 'discardEasy') {
        // B: D15Crd / P: Take It Easy — Tune headphones & broadcast rhythmic track pulses
        streamIntense = 1.0;
        hpRingOp = 0.95;
        if (prog < 0.22) {
          // Start-up: tune headphone dial
          const k = tuSmooth(prog, 0, 0.22);
          headR = -8 * k; armLR = -6 * k; torsoR = -4 * k;
        } else if (prog < 0.78) {
          // Mid-skill: rhythmic multi-beat pulse projection
          const k = (prog - 0.22) / 0.56;
          const beat = Math.sin(k * Math.PI * 4);
          rx = 6 * Math.abs(beat);
          ry = -5 * Math.abs(beat);
          headR = beat * 9;
          torsoR = beat * 5;
          armLR = 16 * Math.abs(beat);
          armRR = -20 * Math.abs(beat);
          tailR = beat * 14;
        } else {
          // Ending: final chord settle
          const k = tuSmooth(prog, 0.78, 1.0);
          headR = tuLerp(6, 0, k);
          armLR = tuLerp(10, 0, k);
        }
      } else if (style === 'discardPerfect') {
        // R: Keep the Music Going! — Full-stage acoustic levitation jam
        streamIntense = 1.0;
        hpRingOp = 1.0;
        const arc = Math.sin(prog * Math.PI);
        const jam = Math.sin(prog * Math.PI * 4);
        ry = -18 * arc;
        rr = jam * 7;
        headR = jam * 10;
        torsoR = jam * 6;
        armLR = 20 * arc + jam * 8;
        armRR = -26 * arc - jam * 10;
        tailR = -jam * 16;
      }

      if (hurt) {
        rx -= 8; headR = -11; torsoR = -7;
      }

      rootSp.x.set(rx); rootSp.y.set(ry); rootSp.r.set(rr);
      const sRx = rootSp.x.step(step);
      const sRy = rootSp.y.step(step);
      const sRr = rootSp.r.step(step);
      rootG.setAttribute('transform', `translate(${sRx.toFixed(2)} ${sRy.toFixed(2)}) rotate(${sRr.toFixed(2)} 380 420)`);

      const targets = {
        tail:  { r: tailR,  x: 0, y: 0 },
        armR:  { r: armRR,  x: 0, y: 0 },
        legs:  { r: legsR,  x: 0, y: legsY },
        torso: { r: torsoR, x: 0, y: torsoY },
        head:  { r: headR,  x: headX, y: headY },
        armL:  { r: armLR,  x: 0, y: 0 }
      };

      for (const p of d.parts) {
        const sp = springs[p.name];
        const tg = targets[p.name];
        sp.r.set(tg.r); sp.x.set(tg.x); sp.y.set(tg.y);
        const r = sp.r.step(step);
        const x = sp.x.step(step);
        const y = sp.y.step(step);
        const [px, py] = p.pivot;
        groups[p.name].setAttribute('transform', `translate(${(px + x).toFixed(2)} ${(py + y).toFixed(2)}) rotate(${r.toFixed(2)}) translate(${-px} ${-py})`);
      }

      // Animate in-rig music streams & notes
      const backRibbon = backStreamG.querySelector('[data-fx="back-ribbon"]');
      const stageRing = backStreamG.querySelector('[data-fx="stage-ring"]');
      const frontRibbon = frontStreamG.querySelector('[data-fx="front-ribbon"]');
      const noteA = frontStreamG.querySelector('[data-fx="note-a"]');
      const noteB = frontStreamG.querySelector('[data-fx="note-b"]');
      const noteC = frontStreamG.querySelector('[data-fx="note-c"]');
      const hp1 = headFxG.querySelector('[data-fx="hp-ring-1"]');
      const hp2 = headFxG.querySelector('[data-fx="hp-ring-2"]');

      const w = Math.sin(t * 4.5) * 35;
      if (backRibbon) {
        backRibbon.setAttribute('d', `M120,${(440 + w).toFixed(1)} C250,${(320 - w).toFixed(1)} 430,${(520 + w).toFixed(1)} 525,${(365 - w).toFixed(1)}`);
        backRibbon.setAttribute('opacity', (streamIntense * 0.65).toFixed(2));
      }
      if (frontRibbon) {
        frontRibbon.setAttribute('d', `M145,${(355 - w).toFixed(1)} C280,${(475 + w).toFixed(1)} 425,${(265 - w).toFixed(1)} 535,${(355 + w).toFixed(1)}`);
        frontRibbon.setAttribute('opacity', (streamIntense * 0.85).toFixed(2));
      }
      if (stageRing) {
        stageRing.setAttribute('opacity', (performing || perfect ? 0.85 : 0.25).toFixed(2));
        stageRing.setAttribute('rx', (112 + Math.sin(t * 7) * 8).toFixed(1));
      }
      if (noteA) {
        noteA.setAttribute('y', (265 - ((t * 40) % 55)).toFixed(1));
        noteA.setAttribute('opacity', (streamIntense * 0.85).toFixed(2));
      }
      if (noteB) {
        noteB.setAttribute('y', (225 - (((t * 40) + 25) % 55)).toFixed(1));
        noteB.setAttribute('opacity', (streamIntense * 0.8).toFixed(2));
      }
      if (noteC) {
        noteC.setAttribute('y', (155 - (((t * 45) + 12) % 45)).toFixed(1));
        noteC.setAttribute('opacity', (hpRingOp * 0.9).toFixed(2));
      }
      if (hp1 && hp2) {
        const p1 = (t * 2.8) % 1;
        const p2 = (t * 2.8 + 0.5) % 1;
        hp1.setAttribute('r', (16 + p1 * 38).toFixed(1));
        hp1.setAttribute('opacity', (hpRingOp * (1 - p1)).toFixed(2));
        hp2.setAttribute('r', (16 + p2 * 38).toFixed(1));
        hp2.setAttribute('opacity', (hpRingOp * (1 - p2)).toFixed(2));
      }
    }

    update({}, 1 / 60);
    return { svg, update, destroy() { svg.remove(); } };
  }


  function createCopperRig(host, options = {}) {
    const d = window.COPPER_RIG_DATA || {
      width: 1152, height: 1366,
      parts: [
        { name: 'tail',  pivot: [686, 882], src: 'parts/tail.png' },
        { name: 'legs',  pivot: [585, 855], src: 'parts/legs.png' },
        { name: 'torso', pivot: [585, 845], src: 'parts/torso.png' },
        { name: 'arms',  pivot: [595, 675], src: 'parts/arms.png' },
        { name: 'head',  pivot: [565, 492], src: 'parts/head.png' },
        { name: 'flame', pivot: [414, 112], src: 'parts/flame.png' }
      ]
    };
    const base = options.assetBase || (typeof ASSET === 'string' ? ASSET : '') + 'assets/toon-art/Copper/';
    const svg = document.createElementNS(NS, 'svg');
    svg.setAttribute('viewBox', '260 20 840 1335');
    svg.setAttribute('aria-label', 'Copper');
    svg.style.cssText = 'display:block;width:100%;height:100%;overflow:visible';
    host.appendChild(svg);

    const rootG = document.createElementNS(NS, 'g');
    svg.appendChild(rootG);

    // Warm Illuminate ground lantern glow under Copper
    const groundGlow = document.createElementNS(NS, 'ellipse');
    groundGlow.setAttribute('cx', '580');
    groundGlow.setAttribute('cy', '1315');
    groundGlow.setAttribute('rx', '210');
    groundGlow.setAttribute('ry', '42');
    groundGlow.setAttribute('fill', 'rgba(255, 158, 61, 0.20)');
    rootG.appendChild(groundGlow);

    const groups = {};
    const springs = {};
    for (const p of d.parts) {
      const g = document.createElementNS(NS, 'g');
      g.setAttribute('data-bone', p.name);
      const im = document.createElementNS(NS, 'image');
      im.setAttribute('href', base + p.src);
      im.setAttribute('width', d.width);
      im.setAttribute('height', d.height);
      g.appendChild(im);
      if (p.name === 'flame' && groups.head) {
        // Attach forehead flame to head bone so it always tracks her head wick seamlessly!
        groups.head.appendChild(g);
      } else {
        rootG.appendChild(g);
      }
      groups[p.name] = g;
      springs[p.name] = {
        r: new Spring(0, 210, 21),
        x: new Spring(0, 200, 21),
        y: new Spring(0, 200, 21),
        sx: new Spring(1, 210, 22),
        sy: new Spring(1, 210, 22)
      };
    }

    // Add dynamic SVG multi-color candle flame & expressive eyelid overlay onto head/flame
    const wickFx = document.createElementNS(NS, 'g');
    wickFx.innerHTML = `
      <ellipse data-fx="flame-halo" cx="414" cy="78" rx="48" ry="62" fill="rgba(255,155,50,0.32)"/>
      <path data-fx="flame-outer" d="M414,18 C382,58 386,105 414,114 C442,105 446,58 414,18 Z" fill="#ff8c24" opacity="0.88"/>
      <path data-fx="flame-inner" d="M414,42 C396,68 398,100 414,108 C430,100 432,68 414,42 Z" fill="#fff4c2" opacity="0.95"/>
    `;
    if (groups.flame) groups.flame.appendChild(wickFx);

    // Cream Eyelids for Shy Blinks & Protective Brow on head bone
    const eyeFx = document.createElementNS(NS, 'g');
    eyeFx.innerHTML = `
      <!-- Cream Eyelids over her rectangular orange eyes -->
      <path data-fx="eyelid-main" d="M415,285 Q475,268 538,298 L538,268 Q475,250 415,268 Z" fill="#f0d596" opacity="0"/>
      <!-- Determined / Shy Brow Line -->
      <path data-fx="brow-main" d="M418,282 Q475,268 536,294" fill="none" stroke="#6c0d12" stroke-width="8" stroke-linecap="round" opacity="0"/>
    `;
    if (groups.head) groups.head.appendChild(eyeFx);

    // In-rig Orange Orb Shield Projection Aura (pulses around Copper when casting Guard! / Rescue)
    const orbCastG = document.createElementNS(NS, 'g');
    orbCastG.setAttribute('opacity', '0');
    orbCastG.innerHTML = `
      <circle cx="560" cy="720" r="390" fill="rgba(255, 148, 54, 0.16)" stroke="#ff9436" stroke-width="10"/>
      <circle cx="560" cy="720" r="360" fill="none" stroke="#ffe082" stroke-width="5" stroke-dasharray="36 20"/>
      <path d="M310,490 A320,320 0 0,1 690,410" fill="none" stroke="#fff8e7" stroke-width="14" stroke-linecap="round" opacity="0.65"/>
    `;
    rootG.appendChild(orbCastG);

    const idle = document.createElementNS(NS, 'image');
    idle.setAttribute('href', base + 'Copper.png');
    idle.setAttribute('width', d.width);
    idle.setAttribute('height', d.height);
    idle.setAttribute('data-static-idle', 'Copper');
    idle.setAttribute('visibility', 'hidden');
    svg.appendChild(idle);

    const rootSp = {
      x: new Spring(0, 190, 20),
      y: new Spring(0, 190, 20),
      r: new Spring(0, 190, 20)
    };

    let time = Math.random() * 10;

    function update(u = {}, dt = 1 / 60, battle = null) {
      const step = Math.min(0.08, Math.max(0.001, dt));
      time += step;
      if (battle && typeof CopperFX !== 'undefined') CopperFX.syncBattle(battle);

      const reduced = !!(u.visualSleep || (typeof Accessibility !== 'undefined' && Accessibility.enabled()));
      if (reduced) {
        idle.setAttribute('visibility', 'visible');
        rootG.setAttribute('visibility', 'hidden');
        return;
      }
      idle.setAttribute('visibility', 'hidden');
      rootG.setAttribute('visibility', 'visible');

      const walk = !!(u.moving || u.animState === 'walk');
      const style = u.animT > 0 ? (u.animStyle || u.animState || '') : (u.casting ? 'cast' : '');
      const prog = u.animT > 0 && u.animDur > 0 ? clamp(1 - u.animT / u.animDur, 0, 1) : 0;
      const hurt = (u.hitT || 0) > 0;
      const guarded = !!(u.hasStatus && u.hasStatus('copper_guard'));

      // Note: Copper's native art faces left (-1).
      // Positive SVG rotation tilts her backward (right); negative tilts her forward (left).
      const breathe = Math.sin(time * 2.6);
      const nervous = Math.sin(time * 5.2);

      let rx = 0, ry = breathe * 6, rr = 0;
      let headR = breathe * 2.2 + Math.sin(time * 1.4) * 1.8;
      let headX = 0, headY = breathe * 3;
      let torsoR = breathe * 1.4, torsoY = breathe * 2;
      let armsR = breathe * 2.8 + nervous * 0.8; // Shyly hugging her arms close
      let armsX = 0, armsY = 0;
      let legsR = 0;
      let tailR = Math.sin(time * 2.9 - 0.8) * 6.5;
      let flameR = Math.sin(time * 9.5) * 7;
      let flameScale = 1 + Math.sin(time * 13) * 0.12;
      let orbCastOp = guarded ? 0.38 : 0;
      let eyelidOp = 0, browOp = 0;

      // Shy periodic double-blink
      const blinkC = (time * 0.9) % 3.8;
      if (blinkC > 3.6) eyelidOp = Math.sin(((blinkC - 3.6) / 0.2) * Math.PI);

      // Walk / Shy Dragon Scurry
      if (walk && !style) {
        const scurry = Math.sin(time * 8.5);
        rx = -14;
        ry = -Math.abs(scurry) * 14;
        rr = -4;
        headR = -4 + scurry * 3.5;
        torsoR = -3 + scurry * 2.5;
        armsR = 6 + scurry * 9;
        legsR = scurry * 10;
        tailR = -scurry * 14;
        flameR = 14 + scurry * 8;
      }

      // 4-Phase Skill & Basic Attack Choreography:
      // Phase 1: Start-up -> Phase 2: Wind-up -> Phase 3: Mid-skill -> Phase 4: Ending
      if (style === 'basic' || u.animState === 'attack') {
        // Wick Spark: Shy lean back -> Wick flare -> Flick warm spark -> Relieved settle
        if (prog < 0.22) {
          // Start-up: shy lean back
          const k = smooth(prog, 0, 0.22);
          rx = 16 * k; headR = 6 * k; torsoR = 4 * k; armsR = 10 * k;
        } else if (prog < 0.42) {
          // Wind-up: wick flares bright as she prepares to flick a spark
          const k = smooth(prog, 0.22, 0.42);
          rx = lerp(16, 24, k); headR = lerp(6, 9, k); armsR = lerp(10, 16, k);
          flameScale = 1.45;
        } else if (prog < 0.74) {
          // Mid-skill: flicks a warm spark forward!
          const k = smooth(prog, 0.42, 0.74);
          const snap = Math.sin(k * Math.PI);
          rx = -28 * snap;
          ry = -10 * snap;
          headR = -9 * snap;
          torsoR = -6 * snap;
          armsR = -22 * snap;
          tailR = -16 * snap;
          flameScale = 1.55;
          browOp = 0.75 * snap;
        } else {
          // Ending: pulls hands back to chest with a shy blink
          const k = smooth(prog, 0.74, 1.0);
          armsR = lerp(-8, 2, k);
          eyelidOp = Math.sin(k * Math.PI) * 0.6;
        }
      } else if (style === 'copperGuard' || style === 'copperRescue') {
        // W: Guard! / R: I've Got You! — Protective gasp -> Dash forward -> Project Orange Orb Shield -> Relieved nod
        const isRescue = style === 'copperRescue';
        browOp = 0.9;
        if (prog < 0.18) {
          // Start-up: protective gasp & perk up
          const k = smooth(prog, 0, 0.18);
          ry = -14 * k; headR = 8 * k; armsR = 14 * k;
          flameScale = 1 + 0.5 * k;
        } else if (prog < 0.36) {
          // Wind-up: protective lunge toward threatened ally
          const k = smooth(prog, 0.18, 0.36);
          rx = lerp(0, isRescue ? -48 : -28, k);
          ry = lerp(-14, -22, k);
          headR = lerp(8, -6, k);
          torsoR = -6 * k;
          armsR = lerp(14, 18, k);
          flameScale = 1.65;
        } else if (prog < 0.78) {
          // Mid-skill: arms open wide projecting the 3D Orange Orb Shield!
          const k = (prog - 0.36) / 0.42;
          const pulse = Math.sin(k * Math.PI);
          rx = (isRescue ? -48 : -28) - 10 * pulse;
          ry = -22 - 8 * pulse;
          headR = -8;
          torsoR = -7;
          armsR = -24 * pulse;
          armsX = -18 * pulse;
          tailR = -18 * pulse;
          flameScale = 1.85;
          orbCastOp = 0.92 * pulse;
        } else {
          // Ending: hugs scarf with a relieved nod
          const k = smooth(prog, 0.78, 1.0);
          rx = lerp(-24, 0, k);
          armsR = lerp(-12, 4, k);
          orbCastOp = lerp(0.5, guarded ? 0.38 : 0, k);
        }
      } else if (style === 'copperHeads') {
        // G: Heads Up! — Spot dangerous enemy -> Coil -> Dash & Flame Knockback -> Scurry back
        browOp = 0.95;
        if (prog < 0.18) {
          // Start-up: alert perk-up
          const k = smooth(prog, 0, 0.18);
          headR = -7 * k; ry = -8 * k; flameScale = 1.35;
        } else if (prog < 0.36) {
          // Wind-up: crouch & coil tail
          const k = smooth(prog, 0.18, 0.36);
          rx = 22 * k; ry = 12 * k; torsoR = 7 * k; armsR = 16 * k; tailR = 18 * k;
        } else if (prog < 0.74) {
          // Mid-skill: lunging flame burst & knockback!
          const k = smooth(prog, 0.36, 0.74);
          const hit = Math.sin(k * Math.PI);
          rx = -44 * hit;
          ry = -16 * hit;
          rr = -8 * hit;
          headR = -11 * hit;
          torsoR = -9 * hit;
          armsR = -26 * hit;
          tailR = -20 * hit;
          flameScale = 1.75;
          orbCastOp = 0.55 * hit;
        } else {
          // Ending: quick scurry back to midline
          const k = smooth(prog, 0.74, 1.0);
          rx = lerp(-20, 0, k);
          legsR = Math.sin(k * Math.PI * 2) * 8;
        }
      } else if (style === 'copperFlame' || style === 'copperIlluminate') {
        // B: A Change of Flame / P: Illuminate — Deep breath -> Wick color shift -> Radiant team wave -> Warm afterglow
        if (prog < 0.22) {
          // Start-up: close eyes & take a deep breath
          const k = smooth(prog, 0, 0.22);
          ry = 8 * k; headR = 7 * k; armsR = 12 * k; eyelidOp = 0.85 * k;
        } else if (prog < 0.42) {
          // Wind-up: wick flares into a bright colored beacon
          const k = smooth(prog, 0.22, 0.42);
          ry = lerp(8, -20, k);
          headR = lerp(7, -6, k);
          armsR = lerp(12, -16, k);
          flameScale = lerp(1.1, 1.9, k);
        } else if (prog < 0.78) {
          // Mid-skill: sweeps arms upward releasing Blue/White/Orange flame wave!
          const k = (prog - 0.42) / 0.36;
          const wave = Math.sin(k * Math.PI);
          ry = -22 - 10 * wave;
          headR = -8 + Math.sin(k * Math.PI * 2) * 4;
          torsoR = -5 * wave;
          armsR = -22 * wave;
          armsY = -12 * wave;
          tailR = -14 * wave;
          flameScale = 2.0;
        } else {
          // Ending: warm settle
          const k = smooth(prog, 0.78, 1.0);
          ry = lerp(-18, 0, k);
          flameScale = lerp(1.8, 1.1, k);
        }
      }

      if (hurt) {
        rx += 22; headR = 12; torsoR = 8; armsR = 14; eyelidOp = 0.75;
      }

      rootSp.x.set(rx); rootSp.y.set(ry); rootSp.r.set(rr);
      const sRx = rootSp.x.step(step);
      const sRy = rootSp.y.step(step);
      const sRr = rootSp.r.step(step);
      rootG.setAttribute('transform', `translate(${sRx.toFixed(2)} ${sRy.toFixed(2)}) rotate(${sRr.toFixed(2)} 585 950)`);

      const targets = {
        tail:  { r: tailR,  x: 0,     y: 0,      sx: 1,          sy: 1 },
        legs:  { r: legsR,  x: 0,     y: 0,      sx: 1,          sy: 1 },
        torso: { r: torsoR, x: 0,     y: torsoY, sx: 1,          sy: 1 },
        arms:  { r: armsR,  x: armsX, y: armsY,  sx: 1,          sy: 1 },
        head:  { r: headR,  x: headX, y: headY,  sx: 1,          sy: 1 },
        flame: { r: flameR, x: 0,     y: 0,      sx: flameScale, sy: flameScale }
      };

      for (const p of d.parts) {
        const sp = springs[p.name];
        const tg = targets[p.name];
        sp.r.set(tg.r); sp.x.set(tg.x); sp.y.set(tg.y); sp.sx.set(tg.sx); sp.sy.set(tg.sy);
        const r = sp.r.step(step);
        const x = sp.x.step(step);
        const y = sp.y.step(step);
        const sx = sp.sx.step(step);
        const sy = sp.sy.step(step);
        const [px, py] = p.pivot;
        groups[p.name].setAttribute('transform', `translate(${(px + x).toFixed(2)} ${(py + y).toFixed(2)}) rotate(${r.toFixed(2)}) scale(${sx.toFixed(3)} ${sy.toFixed(3)}) translate(${-px} ${-py})`);
      }

      // Dynamic flame color based on Copper's active A Change of Flame mode!
      const mode = (u._copperFlameMode && (!u._copperFlameUntil || (battle && battle.t < u._copperFlameUntil))) ? u._copperFlameMode : 'orange';
      const flameColors = {
        blue:   { halo: 'rgba(94, 200, 255, 0.38)', outer: '#38b6ff', inner: '#e0f7ff' },
        white:  { halo: 'rgba(255, 248, 231, 0.42)', outer: '#ffd98a', inner: '#ffffff' },
        orange: { halo: 'rgba(255, 155, 50, 0.34)',  outer: '#ff8c24', inner: '#fff4c2' }
      }[mode] || { halo: 'rgba(255, 155, 50, 0.34)', outer: '#ff8c24', inner: '#fff4c2' };

      const fHalo = wickFx.querySelector('[data-fx="flame-halo"]');
      const fOuter = wickFx.querySelector('[data-fx="flame-outer"]');
      const fInner = wickFx.querySelector('[data-fx="flame-inner"]');
      if (fHalo) fHalo.setAttribute('fill', flameColors.halo);
      if (fOuter) fOuter.setAttribute('fill', flameColors.outer);
      if (fInner) fInner.setAttribute('fill', flameColors.inner);
      groundGlow.setAttribute('fill', flameColors.halo);

      const eyelid = eyeFx.querySelector('[data-fx="eyelid-main"]');
      const brow = eyeFx.querySelector('[data-fx="brow-main"]');
      if (eyelid) eyelid.setAttribute('opacity', eyelidOp.toFixed(2));
      if (brow) brow.setAttribute('opacity', browOp.toFixed(2));
      orbCastG.setAttribute('opacity', orbCastOp.toFixed(2));
    }

    update({}, 1 / 60);
    return { svg, update, destroy() { svg.remove(); } };
  }

  const Copper = {
    enabled() { return typeof Save === 'undefined' || Save.data?.opt?.animatedChars !== false; },
    create: createCopperRig
  };

  return {
    Selena: {
      enabled() { return typeof Save === 'undefined' || Save.data?.opt?.animatedChars !== false; },
      create: createSelenaRig
    },
    Copper,
    Discard: {
      enabled() { return typeof Save === 'undefined' || Save.data?.opt?.animatedChars !== false; },
      create: createDiscardRig
    }
  };
})();
window.ToonsUniverseRigs = ToonsUniverseRigs;

window.CopperRig = ToonsUniverseRigs.Copper;
