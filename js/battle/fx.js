/* fx.js - particles, slashes, shakes, hit pause, screen tints.
   Everything is DOM nodes driven by a single rAF pump so a PNG can carry a fight. */
'use strict';

const FX_TARGET_FRAME_SEC = 1 / 60;

const FX = {
  back: null, front: null, pop: null, stage: null, flashEl: null,
  parts: [], shakeMag: 0, shakeT: 0, stop: 0, zoom: 1, zoomT: 0, panX: 0, lastFlash: -Infinity,
  quality: 1, reducedEffects: false, graphicsQuality: 50,
  particleMode: 'auto', combatNumbers: true, screenShake: true, cameraZoom: true,

  init() {
    this.back = $('#fxBack'); this.front = $('#fxFront'); this.pop = $('#popLayer');
    this.stage = $('#stage'); this.flashEl = $('#flash');
    this.parts.length = 0;
    const width = this.stage && this.stage.clientWidth || 560;
    // Keep the simulation clock independent, but start visual effects conservatively
    // on handheld-sized stages. Glowing DOM particles are expensive on phones.
    this._qualityMax = width <= 430 ? .46 : width <= 700 ? .68 : 1;
    this.quality = this._qualityMax;
    this._particleInterval = width <= 700 ? 1 / 30 : 1 / 60;
    this._baseParticleInterval = this._particleInterval;
    this._particleMin = width <= 430 ? 18 : width <= 700 ? 28 : 40;
    this._particleBase = width <= 430 ? 36 : width <= 700 ? 54 : 85;
    this._popCap = width <= 430 ? 16 : width <= 700 ? 24 : 32;
    this._particleAccum = 0;
    this._stageTransform = '';
    this._slowFrames = 0;
    this._qualityRecover = 0;
    this._combatLoad = 0;
    this._projectileFrameMs = 0;
    this._smallSparkInterval = 0;
    this._lastSmallSpark = -Infinity;
    this._denseNumberStamps = Object.create(null);
    this._effectWindowAt = -Infinity;
    this._effectWindowCount = 0;
    this._effectWindowCap = 999;
    this._denseParty = false;
    this._denseVisualSafe = false;
    this._particleCooldownUntil = 0;
    this._particleTripAt = Infinity;
    this._graphicsBudgetApplied = false;
    // Battle starts can happen after a cloud/local save reconciliation. Read
    // the persisted setting again instead of trusting FX's previous in-memory
    // value, which may still be the default from the boot screen.
    const savedQuality = typeof GraphicsSettings !== 'undefined'
      ? GraphicsSettings.value() : this.graphicsQuality;
    this.setGraphicsQuality(savedQuality);
    if (typeof GraphicsSettings !== 'undefined' && GraphicsSettings.option) {
      this.setGraphicsOptions({
        particles: GraphicsSettings.option('graphicsParticles'),
        combatNumbers: GraphicsSettings.option('combatNumbers') !== false,
        screenShake: GraphicsSettings.option('screenShake') !== false,
        cameraZoom: GraphicsSettings.option('cameraZoom') !== false
      });
    }
  },
  _applyGraphicsBudget() {
    if (!this._qualityMax) return;
    if (!this._graphicsBudgetApplied) {
      this._baseParticleMin = this._particleMin;
      this._baseParticleBase = this._particleBase;
      this._basePopCap = this._popCap;
      this._graphicsBudgetApplied = true;
    }
    const level = clamp(this.graphicsQuality, 0, 100) / 100;
    this._particleInterval = Math.max(this._baseParticleInterval, 1 / 18 - level * (1 / 18 - 1 / 60));
    const modeScale = this.particleMode === 'off' ? .08 : this.particleMode === 'reduced' ? .48 : 1;
    const particleScale = (.25 + level * .75) * modeScale;
    this._particleMin = Math.max(12, Math.round(this._baseParticleMin * (.65 + level * .35)));
    this._particleBase = Math.max(this._particleMin, Math.round(this._baseParticleBase * particleScale));
    this._popCap = Math.max(8, Math.round(8 + this._basePopCap * level));
    this._effectWindowCap = Math.max(4, Math.round(4 + 14 * level));
    this._projectileFrameMs = level < .67 ? 64 : 0;
  },
  setGraphicsQuality(value) {
    const numeric = Number(value);
    this.graphicsQuality = clamp(Math.round(Number.isFinite(numeric) ? numeric : 50), 0, 100);
    if (typeof document !== 'undefined' && document.documentElement) {
      document.documentElement.classList.toggle('graphics-lite', this.graphicsQuality <= 66);
      document.documentElement.classList.toggle('graphics-low', this.graphicsQuality <= 33);
      document.documentElement.dataset.graphicsQuality = String(this.graphicsQuality);
    }
    if (!this._qualityMax) return;
    this._applyGraphicsBudget();
    const ceiling = Math.min(this._qualityMax, .22 + this.graphicsQuality / 100 * .78);
    this.quality = this.reducedEffects ? Math.min(ceiling, .28) : ceiling;
    if (this.graphicsQuality <= 33 && this.parts && this.parts.length) {
      this.parts.forEach(p => { if (p && p.n) p.n.remove(); });
      this.parts.length = 0;
    }
  },
  setGraphicsOptions(options) {
    options = options || {};
    if (options.particles === 'off' || options.particles === 'reduced' || options.particles === 'auto') this.particleMode = options.particles;
    if (options.combatNumbers != null) this.combatNumbers = options.combatNumbers !== false;
    if (options.screenShake != null) this.screenShake = options.screenShake !== false;
    if (options.cameraZoom != null) this.cameraZoom = options.cameraZoom !== false;
    this._applyGraphicsBudget();
    if (this.particleMode === 'off' && this.parts && this.parts.length) {
      this.parts.forEach(p => { if (p && p.n) p.n.remove(); });
      this.parts.length = 0;
    }
  },
  graphicsCeiling() {
    return Math.min(this._qualityMax || 1, .22 + clamp(this.graphicsQuality, 0, 100) / 100 * .78);
  },
  setCombatLoad(unitCount, units) {
    // Seven combatants are already enough for the authored Vee/Waxwell
    // effects to overlap heavily (four allies plus three foes is a common
    // campaign shape). Treat that board as dense so transient DOM effects
    // get the same short-window budget as larger parties.
    const denseParty = Number(unitCount) >= 7;
    const fullParty = Number(unitCount) >= 10;
    this._denseParty = denseParty;
    this._combatLoad = denseParty ? 1 : 0;
    this._projectileFrameMs = fullParty && this._qualityMax > .7 ? 32 : 0;
    this._smallSparkInterval = denseParty ? (fullParty ? 32 : 22) : 0;
    this._effectWindowCap = fullParty ? 18 : denseParty ? 8 : 999;
    this._applyGraphicsBudget();
    // _applyGraphicsBudget derives a quality-based cap for normal battles;
    // dense boards need the stricter override after that calculation.
    if (denseParty && !fullParty) this._effectWindowCap = 8;
    // Waxwell's terrain and copied-figure layers are persistent DOM artwork,
    // unlike ordinary hit effects. On a dense live board they can saturate
    // the compositor even after their gameplay records have expired. Keep
    // the battle fully simulated, but route optional FX to detached hosts for
    // this specific high-risk composition (the normal stage remains intact).
    const hasWaxwell = Array.isArray(units) && units.some(u => u && u.id === 'Waxwell');
    if (denseParty && hasWaxwell && this.front && this.front.isConnected && typeof document !== 'undefined') {
      this._denseVisualSafe = true;
      this.front = document.createElement('div');
      this.back = document.createElement('div');
      this.pop = document.createElement('div');
    }
    if (!denseParty) return;
    // Ambient particles are independent of authored impact effects. Updating
    // their transforms at 30 Hz is visually sufficient on a crowded board
    // and leaves the compositor room for the ten character layers.
    this._particleInterval = Math.max(this._particleInterval, 1 / 30);
    // Dense boards can saturate a desktop compositor just as easily as a
    // phone. Keep authored impacts, but lower optional visual work on 4v3s
    // and 5v5s.
    if (fullParty) {
      this.quality = Math.min(this.quality, this.graphicsQuality < 67 ? .42 : this._qualityMax > .7 ? .82 : this._qualityMax);
      this._particleBase = Math.max(this._particleMin, Math.round(this._particleBase * .72));
      this._popCap = Math.min(this._popCap, 28);
    }
    this._particleTripAt = Math.max(this._particleMin, Math.floor(this.particleCap() * .82));
  },
  clear() {
    clear(this.back); clear(this.front); clear(this.pop);
    this.parts.length = 0; this.shakeMag = 0; this.stop = 0; this.zoom = 1; this.zoomT = 0; this.panX = 0; this._camY = 0; this.lastFlash = -Infinity; this._particleAccum = 0;
    this._stageTransform = '';
    this._lastSmallSpark = -Infinity;
    this._denseNumberStamps = Object.create(null);
    this._effectWindowAt = -Infinity;
    this._effectWindowCount = 0;
    this._particleCooldownUntil = 0;
    this._particleTripAt = Infinity;
    // FX can be reset while the battle view is being replaced. In that brief
    // transition the stage layers have already left the DOM, so reset the
    // pieces that still exist instead of throwing before combat can start.
    if (this.stage) this.stage.style.transform = '';
    if (this.flashEl) this.flashEl.style.opacity = 0;
  },
  setReducedEffects(on) {
    this.reducedEffects = !!on;
    if (this.reducedEffects) {
      this.shakeMag = 0; this.shakeT = 0; this.stop = 0;
      this.zoom = 1; this.zoomT = 0; this.panX = 0; this._camY = 0;
      if (this.flashEl) this.flashEl.style.opacity = 0;
    }
    if (this._qualityMax) {
      const ceiling = this.graphicsCeiling();
      this.quality = this.reducedEffects ? Math.min(ceiling, .28) : ceiling;
    }
  },

  /* ---------- camera ---------- */
  shake(mag, dur) {
    if (this.reducedEffects || !this.screenShake) return;
    this.shakeMag = Math.max(this.shakeMag, Math.min(mag, 4) * this.quality);
    this.shakeT = Math.max(this.shakeT, Math.min(dur, .22));
  },
  // Impact beats are camera-only. Pausing the combat clock here made a fast
  // string of pretty hit effects behave like accidental crowd control.
  hitstop(ms) { if (!this.reducedEffects) this.punchZoom(Math.min(.028, (ms || 0) / 3500), Math.min(.18, (ms || 0) / 520)); },
  punchZoom(amt, dur) { if (this.reducedEffects || !this.cameraZoom) return; this.zoom = 1 + amt; this.zoomT = dur; },
  /* Full-stage flashes can stack during a fast battle into a strobe. Keep
     them as soft, infrequent color cues instead of instantaneous whiteouts. */
  flash(col, alpha, dur) {
    if (this.reducedEffects) return;
    const f = this.flashEl;
    if (!f) return;
    const now = performance.now();
    if (now - this.lastFlash < 650) return;
    this.lastFlash = now;
    const safeAlpha = Math.min(alpha || .22, .28);
    const safeDur = Math.max(dur || .35, .45);
    f.style.background = col; f.style.transition = 'opacity .12s ease-out'; f.style.opacity = safeAlpha;
    setTimeout(() => { f.style.transition = 'opacity ' + safeDur + 's ease-out'; f.style.opacity = 0; }, 120);
  },
  tint(col, alpha, dur) {
    if (this.reducedEffects) return;
    const n = el('div');
    n.style.cssText = `position:absolute;inset:0;background:${col};opacity:0;pointer-events:none;mix-blend-mode:multiply;transition:opacity .12s`;
    this.back.appendChild(n);
    requestAnimationFrame(() => { n.style.opacity = alpha; });
    setTimeout(() => { n.style.transition = 'opacity ' + dur + 's'; n.style.opacity = 0; }, 120);
    setTimeout(() => n.remove(), (dur + .3) * 1000 + 140);
  },

  /** Plays a 16-frame VFX flipbook (see Art.vfx) once over a unit, e.g. a
      burst of real burn/freeze/stun artwork the moment that status lands,
      instead of just an emoji floater. Self-removes when it finishes. */
  statusBurst(x, y, folder, opt) {
    if (!this.front || this.reducedEffects || !this.effectAllowed(2)) return;
    opt = opt || {};
    const size = opt.size || 68;
    const n = el('div');
    n.style.cssText = `position:absolute;left:${x}px;top:${y}px;width:${size}px;height:${size}px;
      margin-left:${-size / 2}px;margin-top:${-size / 2}px;pointer-events:none;opacity:0;
      transition:opacity .1s;filter:drop-shadow(0 2px 4px rgba(0,0,0,.5))`;
    const img = el('img');
    img.style.cssText = 'width:100%;height:100%;object-fit:contain';
    img.src = Art.vfx(folder, 0);
    n.appendChild(img);
    (opt.layer === 'b' ? this.back : this.front).appendChild(n);
    requestAnimationFrame(() => { n.style.opacity = 1; });
    const FRAMES = 16;
    // Status art is decorative and can be requested by several units in the
    // same impact window. On a full board, advance two source frames at a
    // time so each burst uses fewer interval callbacks without changing its
    // short, readable lifespan.
    const FRAME_STEP = this._combatLoad ? 2 : 1;
    const FPS = this._combatLoad ? 14 : 20;
    let i = 1;
    const iv = setInterval(() => {
      if (i >= FRAMES) {
        clearInterval(iv);
        n.style.transition = 'opacity .16s'; n.style.opacity = 0;
        setTimeout(() => n.remove(), 200);
        return;
      }
      img.src = Art.vfx(folder, i);
      i += FRAME_STEP;
    }, 1000 / FPS);
    return n;
  },

  /** Character-authored cast/impact language for Heroes whose kits should
      never read as a renamed generic status effect. These are deliberately
      local, matte effects: no full-screen white flash and no rapid flicker. */
  qomSkill(kind, x, y, opt) {
    if (!this.front) return;
    opt = opt || {};
    const groups = {
      beat: 'drums', chorus: 'drums', finalChorus: 'drums', snare: 'drums', candy: 'drums',
      riff: 'eclipse', feedback: 'eclipse', charge: 'eclipse', solo: 'eclipse',
      barrier: 'keytar', bone: 'keytar', backstage: 'keytar', reassemble: 'keytar', ovation: 'keytar',
      guard: 'sword', parry: 'sword', rush: 'sword', riposte: 'sword',
      phantom: 'connie', vanish: 'connie', possess: 'connie', counter: 'connie', finale: 'connie',
      trick: 'drums', resonance: 'keytar'
    };
    const palette = {
      drums: ['#bbfa79', '#e5a8ff', 'uploads/gourdydrums.png'],
      eclipse: ['#be69f6', '#f6e285', 'uploads/eclipseguitar.png'],
      keytar: ['#a9f482', '#c499f4', 'uploads/ribeccakeytar.png'],
      sword: ['#c9b4ff', '#fcf3d1', 'item/Trinkets/SOULVESTER_SoulSword.png'],
      connie: ['#e4b4ff', '#8cf0da', 'uploads/connieguitarqom.png']
    };
    const group = groups[kind] || 'eclipse';
    const [primary, accent, art] = palette[group];
    const target = opt.target;
    const centerY = y - 56;
    const broad = ['chorus', 'finalChorus', 'solo', 'barrier', 'ovation', 'finale', 'resonance'].includes(kind);
    this.qomStage(kind, group, x, centerY, y, opt, primary, accent);
    this.ring(x, centerY, broad ? 240 : 110, primary, broad ? .52 : .33);
    if (target) this.targetLine({ x, y: centerY }, { x: target.x, y: target.y - 54 }, primary);
    if (kind === 'beat' || kind === 'snare') {
      if (kind === 'snare' || opt.beat === 4) this.burst(x, centerY, 5, [primary, accent], { spMin: 40, spMax: 130, life: .38 });
      this.floatIcon(x + (opt.face || 1) * 26, centerY - 12, kind === 'snare' ? '♬' : String(opt.beat || '♪'), primary);
    } else if (kind === 'candy') {
      this.floatIcon(x, centerY - 18, '🍬', accent);
      this.burst(x, centerY, 8, [primary, accent], { spMin: 55, spMax: 160, life: .5 });
    } else if (kind === 'bone') {
      this.floatIcon(target ? target.x : x + 40, target ? target.y - 78 : centerY, '🦴', accent);
    } else if (kind === 'guard' || kind === 'backstage' || kind === 'barrier' || kind === 'ovation') {
      this.floatIcon(target ? target.x : x, target ? target.y - 85 : centerY - 28, '⬡', accent);
      if (target) this.ring(target.x, target.y - 52, 94, accent, .38);
    } else if (kind === 'vanish' || kind === 'reassemble') {
      this.burst(x, centerY, 10, [primary, accent], { spMin: 35, spMax: 160, lift: 90, life: .55 });
    } else if (kind === 'parry' || kind === 'riposte' || kind === 'rush') {
      if (target) this.slash(target.x, target.y - 55, { col: accent, ang: -28 * (opt.face || 1), big: true });
    } else {
      this.burst(target ? target.x : x, target ? target.y - 56 : centerY, broad ? 11 : 6,
        [primary, accent], { spMin: 55, spMax: broad ? 210 : 145, life: .48 });
      this.floatIcon(x + (opt.face || 1) * 34, centerY - 15, group === 'connie' ? '♩' : '♪', accent);
    }
    if (kind === 'beat' || kind === 'snare' || !this.effectAllowed(2)) return;
    const size = broad ? 76 : 58;
    const prop = el('img', 'qom-skill-prop');
    prop.src = ASSET + art;
    prop.alt = '';
    prop.style.cssText = `position:absolute;left:${x - size / 2}px;top:${centerY - size / 2}px;width:${size}px;height:${size}px;
      object-fit:contain;pointer-events:none;z-index:8;opacity:0;filter:drop-shadow(0 0 8px ${primary});`;
    this.front.appendChild(prop);
    const tilt = group === 'sword' ? 45 : kind === 'charge' ? -32 : -18;
    if (prop.animate) prop.animate([
      { opacity: 0, transform: `translateY(18px) rotate(${tilt}deg) scale(.55)` },
      { opacity: .95, transform: 'translateY(-8px) rotate(6deg) scale(1.05)', offset: .34 },
      { opacity: .9, transform: `translateY(-10px) rotate(${-tilt / 2}deg) scale(1)`, offset: .7 },
      { opacity: 0, transform: `translateY(-35px) rotate(${-tilt}deg) scale(.8)` }
    ], { duration: broad ? 820 : 600, easing: 'ease-out', fill: 'forwards' });
    setTimeout(() => prop.remove(), broad ? 850 : 630);
  },

  /** Instrument-specific stage language layered under the shared QoM burst:
      drumhead shockwaves, amp soundwaves, keytar keys, sword glints, and
      drifting phantom notes. All local, short, and skipped in lite mode. */
  qomStage(kind, group, x, cy, gy, opt, primary, accent) {
    if (!this.front || this.reducedEffects || !this.effectAllowed(2)) return;
    const face = opt.face || 1, target = opt.target;
    const add = (css, frames, ms, host) => {
      const n = el('div');
      n.style.cssText = 'position:absolute;pointer-events:none;' + css;
      (host || this.front).appendChild(n);
      if (n.animate) n.animate(frames, { duration: ms, easing: 'cubic-bezier(.15,.8,.3,1)', fill: 'forwards' });
      setTimeout(() => n.remove(), ms + 40);
      return n;
    };
    // Expanding arcs pointed the way the soundwave travels.
    const arcs = (ax, ay, dir, col, count, reach) => {
      for (let i = 0; i < count; i++) setTimeout(() => {
        const size = 46;
        add(`left:${ax - size / 2}px;top:${ay - size / 2}px;width:${size}px;height:${size}px;border-radius:50%;
          border:3px solid transparent;border-${dir > 0 ? 'right' : 'left'}-color:${col};z-index:7;filter:drop-shadow(0 0 6px ${col})`,
          [{ opacity: .95, transform: 'translateX(0) scale(.5)' },
           { opacity: 0, transform: `translateX(${dir * reach}px) scale(${1.8 + i * .3})` }], 520);
      }, i * 85);
    };
    const notes = (nx, ny, col, count, glyphs) => {
      for (let i = 0; i < count; i++) {
        const dx = (Math.random() - .5) * 70, rise = 55 + Math.random() * 45;
        const n = add(`left:${nx - 8}px;top:${ny - 10}px;z-index:9;color:${col};font:900 ${15 + Math.random() * 8}px/1 Georgia,serif;
          text-shadow:0 0 6px ${col},1px 1px #1b0b25`,
          [{ opacity: 0, transform: 'translate(0,8px) scale(.5)' },
           { opacity: 1, transform: `translate(${dx * .4}px,-${rise * .35}px) scale(1.05) rotate(${dx * .2}deg)`, offset: .3 },
           { opacity: 0, transform: `translate(${dx}px,-${rise}px) scale(.85) rotate(${dx * .5}deg)` }], 900 + i * 60);
        n.textContent = glyphs[i % glyphs.length];
      }
    };
    const floorWave = (fx, fy, col, size) => add(`left:${fx - size / 2}px;top:${fy - size * .14}px;width:${size}px;height:${size * .28}px;
      border-radius:50%;border:4px solid ${col};box-shadow:0 0 14px ${col},inset 0 0 10px ${col};z-index:2`,
      [{ opacity: .9, transform: 'scale(.15)' }, { opacity: 0, transform: 'scale(1)' }], 560, this.back);

    if (group === 'drums') {
      if (kind === 'beat' && opt.beat === 4) { floorWave(x, gy, accent, 230); notes(x, cy - 10, primary, 2, ['♪', '♫']); }
      else if (kind === 'beat') floorWave(x, gy, primary, 70 + (opt.beat || 1) * 18);
      else if (kind === 'chorus' || kind === 'finalChorus') {
        floorWave(x, gy, primary, 320); setTimeout(() => floorWave(x, gy, accent, 260), 140);
        notes(x, cy - 20, kind === 'finalChorus' ? accent : primary, kind === 'finalChorus' ? 7 : 4, ['♪', '♫', '♬']);
      } else if (kind === 'snare' && target) arcs(target.x, target.y - 56, face, primary, 2, 30);
      else if ((kind === 'candy' || kind === 'trick') && target) {
        const tx = target.x, ty = target.y - 70;
        const n = add(`left:${x - 11}px;top:${cy - 11}px;z-index:10;font:22px/1 serif;filter:drop-shadow(0 0 5px ${kind === 'trick' ? accent : primary})`,
          [{ transform: 'translate(0,0) rotate(0) scale(.6)' },
           { transform: `translate(${(tx - x) / 2}px,${(ty - cy) / 2 - 60}px) rotate(280deg) scale(1.1)`, offset: .5 },
           { transform: `translate(${tx - x}px,${ty - cy}px) rotate(560deg) scale(.9)`, opacity: .2 }], 520);
        n.textContent = kind === 'trick' ? '🎃' : '🍬';
        setTimeout(() => this.burst(tx, ty, 7, [primary, accent, '#fff3a8'], { spMin: 40, spMax: 140, life: .45 }), 500);
      }
    } else if (group === 'eclipse') {
      const ax = target ? target.x : x, ay = target ? target.y - 56 : cy;
      arcs(target ? x : x, cy, face, primary, kind === 'solo' ? 5 : 3, kind === 'solo' ? 220 : 130);
      if (kind === 'solo' || kind === 'feedback') arcs(x, cy, -face, accent, 3, 130);
      if (kind === 'riff' || kind === 'solo') {
        // Little electric zigzag at the point of impact.
        const n = add(`left:${ax - 22}px;top:${ay - 30}px;width:44px;height:60px;z-index:9;
          background:linear-gradient(${face > 0 ? 115 : 65}deg,transparent 42%,${accent} 44% 50%,transparent 52%),
          linear-gradient(${face > 0 ? 65 : 115}deg,transparent 46%,#fff 48% 51%,transparent 53%);filter:drop-shadow(0 0 6px ${primary})`,
          [{ opacity: 0, transform: 'scale(.4) rotate(-10deg)' }, { opacity: 1, transform: 'scale(1.1) rotate(4deg)', offset: .25 },
           { opacity: 0, transform: 'scale(.9) rotate(10deg)' }], 340);
      }
      if (kind === 'solo') notes(x, cy - 10, accent, 5, ['♫', '♬', '⚡']);
    } else if (group === 'keytar') {
      if (kind === 'barrier' || kind === 'resonance' || kind === 'ovation') {
        const host = target || null, hx = host ? host.x : x, hy = host ? host.y - 56 : cy;
        const size = host ? 96 : 150;
        add(`left:${hx - size / 2}px;top:${hy - size / 2}px;width:${size}px;height:${size}px;border-radius:50%;z-index:6;
          background:radial-gradient(circle,transparent 55%,${primary}40 66%,${primary}aa 70%,transparent 74%);
          box-shadow:0 0 16px ${primary}66`,
          [{ opacity: 0, transform: 'scale(.6)' }, { opacity: 1, transform: 'scale(1.05)', offset: .35 }, { opacity: 0, transform: 'scale(1.15)' }], 700);
        if (kind === 'resonance') { floorWave(x, gy, accent, 300); arcs(x, cy, 1, accent, 2, 120); arcs(x, cy, -1, accent, 2, 120); }
        if (!host) notes(x, cy - 30, accent, kind === 'ovation' ? 6 : 3, ['♩', '♪', '♫']);
      } else if (kind === 'bone' && target) {
        const n = add(`left:${x - 12}px;top:${cy - 12}px;z-index:10;font:22px/1 serif`,
          [{ transform: 'translate(0,0) rotate(0)' }, { transform: `translate(${target.x - x}px,${target.y - 70 - cy}px) rotate(${face * 720}deg)` }], 260);
        n.textContent = '🦴';
      } else if (kind === 'reassemble') notes(x, cy, '#f2f2e6', 5, ['🦴', '💀']);
    } else if (group === 'sword') {
      const sx = target ? target.x : x, sy = target ? target.y - 60 : cy;
      add(`left:${sx - 3}px;top:${sy - 45}px;width:6px;height:90px;border-radius:3px;z-index:9;
        background:linear-gradient(180deg,transparent,#fff 45%,${primary} 55%,transparent);box-shadow:0 0 12px ${primary}`,
        [{ opacity: 0, transform: `rotate(${face * 40}deg) scaleY(.2)` }, { opacity: 1, transform: `rotate(${face * 40}deg) scaleY(1.1)`, offset: .3 },
         { opacity: 0, transform: `rotate(${face * 40}deg) scaleY(1.3)` }], 380);
      if (kind === 'guard') {
        const hx = target ? target.x : x, hy = target ? target.y - 56 : cy;
        add(`left:${hx - 30}px;top:${hy - 36}px;width:60px;height:72px;z-index:7;
          clip-path:polygon(50% 0,100% 15%,92% 62%,50% 100%,8% 62%,0 15%);background:linear-gradient(160deg,${accent}cc,${primary}66);
          filter:drop-shadow(0 0 8px ${primary})`,
          [{ opacity: 0, transform: 'scale(.5)' }, { opacity: .85, transform: 'scale(1.05)', offset: .3 }, { opacity: 0, transform: 'scale(1)' }], 650);
      }
    } else if (group === 'connie') {
      if (kind === 'vanish') {
        add(`left:${x - 50}px;top:${cy - 70}px;width:100px;height:140px;border-radius:50% 50% 40% 40%;z-index:6;
          background:radial-gradient(ellipse at 50% 60%,${primary}88,${accent}33 50%,transparent 70%);filter:blur(3px)`,
          [{ opacity: .9, transform: 'scale(.7,.9)' }, { opacity: 0, transform: 'scale(1.3,1.5) translateY(-30px)' }], 800);
        notes(x, cy, accent, 4, ['♩', '♪']);
      } else if (kind === 'possess' && target) {
        add(`left:${target.x - 34}px;top:${target.y - 120}px;width:68px;height:68px;border-radius:50%;z-index:9;
          border:2px dashed ${primary};box-shadow:0 0 12px ${primary},inset 0 0 12px ${accent}`,
          [{ opacity: 0, transform: 'rotate(0) scale(.4)' }, { opacity: 1, transform: 'rotate(160deg) scale(1)', offset: .4 },
           { opacity: 0, transform: 'rotate(320deg) scale(.6)' }], 760);
      } else {
        arcs(x, cy, face, kind === 'finale' ? primary : accent, kind === 'finale' ? 4 : 2, kind === 'finale' ? 200 : 110);
        if (kind === 'finale') notes(x, cy - 10, primary, 6, ['♫', '♬', '♪']);
        else if (kind === 'counter' && target) notes(target.x, target.y - 70, accent, 2, ['♩', '♪']);
      }
    }
  },

  /** Body acting for each Queen. Animations compose with the unit's own
      transform so movement and facing are untouched. Big moments add a stage
      spotlight, sweeping lights and a short shake. */
  qomPerform(kind, id, body, x, y, face, w) {
    if (this.reducedEffects || !body || !body.animate) return;
    face = face || 1;
    const move = (frames, ms, easing) => {
      const opt = { duration: ms, easing: easing || 'ease-out' };
      const motion = frames.map(f => f.offset == null ? { transform: f.transform || 'none' } : { transform: f.transform || 'none', offset: f.offset });
      try { body.animate(motion, Object.assign({ composite: 'add' }, opt)); } catch (e) {}
      // Opacity is not additive; fade the art itself instead.
      if (frames.some(f => f.opacity != null) && body.firstElementChild && body.firstElementChild.animate)
        body.firstElementChild.animate(frames.map(f => f.offset == null ? { opacity: f.opacity == null ? 1 : f.opacity } : { opacity: f.opacity == null ? 1 : f.opacity, offset: f.offset }), opt);
    };
    const glow = (col, ms) => {
      const img = body.firstElementChild;
      if (img && img.animate) img.animate([{ filter: 'brightness(1)' }, { filter: `brightness(1.35) drop-shadow(0 0 12px ${col})`, offset: .3 }, { filter: 'brightness(1)' }], { duration: ms, easing: 'ease-out' });
    };
    const big = ['chorus', 'finalChorus', 'solo', 'ovation', 'finale', 'resonance'].includes(kind);
    if (big) this.qomSpotlight(x, y, w, id, kind === 'finalChorus' || kind === 'solo' || kind === 'finale' || kind === 'ovation');

    if (id === 'QOMGourdy') {
      if (kind === 'beat') move([{ transform: 'translateY(0) scale(1,1)' }, { transform: 'translateY(3px) scale(1.06,.92)', offset: .25 }, { transform: 'translateY(0) scale(1,1)' }], 200);
      else if (kind === 'chorus' || kind === 'finalChorus') {
        move([0, 1, 2, 3, 4, 5, 6, 7, 8].map((i, n) => ({ transform: n % 2 ? 'translateY(-10px) rotate(-4deg)' : 'translateY(2px) rotate(3deg) scale(1.04,.95)' })), kind === 'finalChorus' ? 1500 : 1100, 'linear');
        glow('#bbfa79', 900); this.shake(2, .18);
      } else if (kind === 'candy' || kind === 'trick') move([{ transform: 'rotate(0)' }, { transform: `rotate(${face * -14}deg) translateX(${-face * 6}px)`, offset: .35 }, { transform: `rotate(${face * 10}deg)`, offset: .6 }, { transform: 'rotate(0)' }], 420);
      else if (kind === 'snare') move([{ transform: 'translateY(0)' }, { transform: 'translateY(-8px) rotate(-6deg)', offset: .3 }, { transform: 'translateY(2px) scale(1.05,.94)', offset: .55 }, { transform: 'none' }], 360);
    } else if (id === 'QOMEclipse') {
      if (kind === 'riff' || kind === 'feedback') move([{ transform: 'rotate(0)' }, { transform: `rotate(${face * 12}deg) translateY(4px)`, offset: .3 }, { transform: `rotate(${face * -6}deg)`, offset: .65 }, { transform: 'rotate(0)' }], 380);
      else if (kind === 'charge') { move([{ transform: 'scale(1)' }, { transform: `scale(1.12,.88) translateX(${-face * 10}px)`, offset: .3 }, { transform: `scale(.94,1.08) translateX(${face * 16}px)`, offset: .6 }, { transform: 'scale(1)' }], 420); glow('#be69f6', 420); }
      else if (kind === 'solo') {
        move([{ transform: 'rotate(0)' }, { transform: `rotate(${face * -18}deg) translateY(-14px)`, offset: .25 }, { transform: `rotate(${face * 14}deg) translateY(3px)`, offset: .5 }, { transform: `rotate(${face * -10}deg) translateY(-8px)`, offset: .75 }, { transform: 'rotate(0)' }], 900);
        glow('#f6e285', 900); this.shake(3, .2); this.flash('#9a3fd0', .14, .5);
      }
    } else if (id === 'QOMRibecca') {
      if (kind === 'barrier' || kind === 'backstage' || kind === 'resonance' || kind === 'ovation') {
        move([{ transform: 'rotate(0)' }, { transform: `rotate(${face * -7}deg) translateY(-4px)`, offset: .35 }, { transform: `rotate(${face * 5}deg)`, offset: .7 }, { transform: 'rotate(0)' }], 620);
        glow('#a9f482', 600);
        if (kind === 'ovation') this.shake(2, .16);
      } else if (kind === 'bone') move([{ transform: 'rotate(0)' }, { transform: `rotate(${face * 16}deg) translateX(${face * 8}px)`, offset: .3 }, { transform: 'rotate(0)' }], 320);
      else if (kind === 'reassemble') move([{ transform: 'none', opacity: 1 }, { transform: 'translateY(14px) scale(1.1,.6) rotate(8deg)', opacity: .55, offset: .3 }, { transform: 'translateY(10px) scale(1.05,.7) rotate(-6deg)', opacity: .6, offset: .6 }, { transform: 'translateY(-6px) scale(.95,1.08)', offset: .85 }, { transform: 'none', opacity: 1 }], 900);
    } else if (id === 'QOMSoulvester') {
      if (kind === 'guard') { move([{ transform: 'scale(1)' }, { transform: `scale(1.06,.95) translateX(${face * 6}px)`, offset: .3 }, { transform: 'scale(1)' }], 380); glow('#c9b4ff', 420); }
      else if (kind === 'parry' || kind === 'rush') move([{ transform: 'rotate(0)' }, { transform: `rotate(${face * -10}deg) translateX(${-face * 8}px)`, offset: .2 }, { transform: `rotate(${face * 14}deg) translateX(${face * 14}px)`, offset: .5 }, { transform: 'rotate(0)' }], 360);
      else if (kind === 'riposte') { move([{ transform: 'none' }, { transform: 'translateY(-22px) rotate(-12deg)', offset: .35 }, { transform: `translateY(4px) rotate(${face * 18}deg) scale(1.08,.92)`, offset: .6 }, { transform: 'none' }], 560); glow('#fcf3d1', 560); this.shake(3, .2); }
    } else if (id === 'QOMConnie') {
      if (kind === 'vanish') move([{ opacity: 1, transform: 'none' }, { opacity: .15, transform: 'translateY(-10px) scale(.92,1.08) skewX(8deg)', offset: .5 }, { opacity: .5, transform: 'translateY(-4px) skewX(-6deg)', offset: .75 }, { opacity: 1, transform: 'none' }], 700);
      else if (kind === 'phantom' || kind === 'counter') move([{ transform: 'none' }, { transform: `translateX(${face * 5}px) skewX(${face * -6}deg)`, offset: .3 }, { transform: 'none' }], 300);
      else if (kind === 'possess') { move([{ transform: 'none' }, { transform: 'translateY(-12px) rotate(-5deg)', offset: .4 }, { transform: 'none' }], 520); glow('#e4b4ff', 520); }
      else if (kind === 'finale') { move([{ transform: 'none' }, { transform: 'translateY(-18px) rotate(-8deg) scale(1.06)', offset: .3 }, { transform: 'translateY(-10px) rotate(8deg)', offset: .65 }, { transform: 'none' }], 900); glow('#8cf0da', 900); this.shake(2, .18); }
    }
  },

  /** A cone of stage light plus two sweeping colored beams behind a Queen. */
  qomSpotlight(x, y, w, id, sweep) {
    if (!this.back || !this.effectAllowed(2)) return;
    const cols = { QOMGourdy: '#bbfa79', QOMEclipse: '#be69f6', QOMRibecca: '#a9f482', QOMSoulvester: '#c9b4ff', QOMConnie: '#8cf0da' };
    const col = cols[id] || '#c47cf2', cw = Math.max(110, w * 1.5), ch = 300;
    const cone = el('div');
    cone.style.cssText = `position:absolute;left:${x - cw / 2}px;top:${y - ch}px;width:${cw}px;height:${ch}px;pointer-events:none;z-index:1;
      clip-path:polygon(38% 0,62% 0,100% 100%,0 100%);background:linear-gradient(180deg,${col}00,${col}38 55%,${col}66);mix-blend-mode:screen;opacity:0`;
    this.back.appendChild(cone);
    if (cone.animate) cone.animate([{ opacity: 0 }, { opacity: 1, offset: .2 }, { opacity: .8, offset: .7 }, { opacity: 0 }], { duration: 1300, fill: 'forwards' });
    setTimeout(() => cone.remove(), 1350);
    if (!sweep) return;
    [-1, 1].forEach((side, i) => {
      const beam = el('div');
      beam.style.cssText = `position:absolute;left:${x + side * 170 - 22}px;top:${y - 360}px;width:44px;height:380px;pointer-events:none;z-index:1;
        transform-origin:50% 0;background:linear-gradient(180deg,#fff0,${i ? '#e5a8ff' : col}55,#fff0);mix-blend-mode:screen;opacity:0;filter:blur(2px)`;
      this.back.appendChild(beam);
      if (beam.animate) beam.animate([
        { opacity: 0, transform: `rotate(${side * 30}deg)` },
        { opacity: .9, transform: `rotate(${side * 8}deg)`, offset: .3 },
        { opacity: .8, transform: `rotate(${side * -22}deg)`, offset: .7 },
        { opacity: 0, transform: `rotate(${side * -6}deg)` }], { duration: 1500, easing: 'ease-in-out', fill: 'forwards' });
      setTimeout(() => beam.remove(), 1550);
    });
  },

  qomBasic(id, x, y, tx, ty, type) {
    if (!this.front) return;
    const colors = id === 'QOMRibecca' ? ['#b9f681', '#bb8aef']
      : id === 'QOMSoulvester' ? ['#dccaff', '#fff3d1']
      : id === 'QOMConnie' ? ['#e2b3ff', '#8cf2d8']
      : id === 'QOMGourdy' ? ['#bcf87b', '#e3afff'] : ['#c370f4', '#f4e481'];
    if (type === 'physical') this.slash(tx, ty - 58, { col: colors[0], ang: id === 'QOMSoulvester' ? -32 : 28, small: true });
    else {
      this.targetLine({ x, y: y - 55 }, { x: tx, y: ty - 55 }, colors[0]);
      this.ring(tx, ty - 55, 66, colors[1], .25);
    }
    if (id === 'QOMGourdy') this.floatIcon(x, y - 95, '♪', colors[0]);
  },

  qomGourdyDrumBlast(x, y, beat, power) {
    if (!this.front) return;
    power = power || 1;
    const colors = ['#a7f05f', '#ba59e0', '#8cf0da', '#f4ffd9'];
    const col = colors[(beat - 1) % 4] || '#a7f05f';
    const r = beat === 4 ? 220 * Math.min(1.5, power) : (80 + beat * 28) * Math.min(1.3, power);
    this.ring(x, y - 40, r, col, beat === 4 ? .45 : .28);
    if (beat === 4) {
      this.shake(2, .18);
      this.floatIcon(x, y - 110, '💥 CRASH!', '#f4ffd9');
    } else {
      const symbols = ['🥁 BASS', '🎵 HI-HAT', '🎶 TOM'];
      this.floatIcon(x, y - 95, symbols[beat - 1] || '♪', col);
    }
  },

  heroSignature(kind, phase, x, y, opt) {
    if (kind === 'scraps') return this.scrapsSignature(phase, x, y, opt);
    if (kind === 'poppy') return this.poppySignature(phase, x, y, opt);
    if (kind === 'cocoa') return this.cocoaSignature(phase, x, y, opt);
    if (kind === 'vee') return this.veeSignature(phase, x, y, opt);
  },

  /** Glisten's mirror is a single pearlescent panel, not a particle wall.
      The soft lavender glass and restrained star glints follow the supplied
      reference while staying cheap enough for the project's low-graphics mode. */
  glistenMirror(x, y, size, face, opt) {
    if (!this.front || this.reducedEffects || !this.effectAllowed(2)) return;
    opt = opt || {};
    const w = Math.max(54, size || 108), h = w * 1.38, dir = face < 0 ? -1 : 1;
    const n = el('div', 'glisten-mirror-live');
    const startTransform = `translateX(${-dir * 22}px) scale(.42,.76) rotateY(${dir * 82}deg) rotate(${dir * -8}deg)`;
    n.style.cssText = `position:absolute;left:${x - w * .5}px;top:${y - h * .78}px;width:${w}px;height:${h}px;
      z-index:7;pointer-events:none;opacity:0;transform:translateX(${-dir * 22}px) scale(.42,.76) rotate(${dir * -8}deg);
      transform-origin:50% 82%;transform-style:preserve-3d;perspective:520px;filter:drop-shadow(0 5px 5px #28184d88)`;
    n.innerHTML = `<i style="position:absolute;inset:4% 15%;border:3px solid #f6eaffcc;border-radius:48% 48% 42% 42%;
      background:linear-gradient(135deg,#ffffffd8 0 12%,#d9b9ffbb 30%,#8965c988 57%,#fff0ffcc 74%,#aa7bd9aa);
      box-shadow:inset 0 0 0 3px #ffffff55,inset 10px -8px 18px #6b459977,0 0 18px #e5b9ff99;display:block;"></i>
      <b style="position:absolute;left:26%;top:20%;color:#fff;font:900 ${Math.max(16, w * .2)}px Georgia,serif;text-shadow:0 0 8px #fff,0 0 14px #d7a8ff;">✦</b>
      <b style="position:absolute;right:20%;top:42%;color:#fff;font:900 ${Math.max(10, w * .12)}px Georgia,serif;text-shadow:0 0 7px #fff,0 0 12px #d7a8ff;">✧</b>`;
    const host = opt.behind && this.back ? this.back : this.front;
    host.appendChild(n);
    requestAnimationFrame(() => {
      if (opt.spin && n.animate) {
        n.animate([
          { opacity: 0, transform: startTransform },
          { opacity: .94, offset: .28, transform: `translateX(${-dir * 8}px) scale(.78,.95) rotateY(${dir * 18}deg) rotate(${dir * -4}deg)` },
          { opacity: .96, offset: .66, transform: `translateX(0) scale(1) rotateY(${dir * -10}deg) rotate(${dir * 2}deg)` },
          { opacity: .9, transform: `translateX(0) scale(1) rotateY(${dir * 360}deg) rotate(${dir * -2}deg)` }
        ], { duration: (opt.inDur || .72) * 1000, easing: 'cubic-bezier(.14,1.25,.28,1)', fill: 'forwards' });
      } else {
        n.style.transition = `transform ${opt.inDur || .28}s cubic-bezier(.14,1.25,.28,1),opacity .12s`;
        n.style.opacity = '.9'; n.style.transform = `translateX(0) scale(1) rotate(${dir * -2}deg)`;
      }
    });
    const life = (opt.life || .58) * 1000;
    setTimeout(() => {
      if (opt.spin && n.getAnimations) n.getAnimations().forEach(a => a.cancel());
      n.style.transition = 'transform .26s ease-in,opacity .22s'; n.style.opacity = 0;
      n.style.transform = `translateX(${dir * 12}px) scale(.86,.98) rotate(${dir * 5}deg)`;
    }, life);
    setTimeout(() => n.remove(), life + 360);
  },

  /** Teagan’s combat language is hospitality under pressure: the tea service
      is warm and precise, corrections are a sharp porcelain tap, and Proper
      Seating visibly places a guest at her table. */
  teaganSkill(kind, x, y, opt) {
    if (!this.front) return;
    opt = opt || {};
    const size = opt.size || 100, face = opt.face || 1;
    const target = opt.target;
    const allies = (opt.allies || []).filter(a => a && a.alive);
    const targets = (opt.targets || []).filter(a => a && a.alive);
    const tea = '#c9955d', cream = '#fff0c4', sage = '#9be36b', red = '#c96e62', blue = '#b8dcff';
    const ty = t => t && t.y - 42;

    const cup = (cx, cy, delay, color) => setTimeout(() => {
      const n = el('i');
      n.textContent = '☕';
      n.style.cssText = `position:absolute;left:${cx - 18}px;top:${cy - 28}px;z-index:10;
        color:${color || cream};font:26px/1 Georgia,serif;text-shadow:0 2px 3px #24160e,0 0 8px ${tea};
        pointer-events:none;opacity:0;transform:translateY(15px) rotate(-18deg) scale(.45)`;
      this.front.appendChild(n);
      requestAnimationFrame(() => { n.style.transition = 'transform .28s cubic-bezier(.16,1.4,.3,1),opacity .12s'; n.style.opacity = '.98'; n.style.transform = 'translateY(0) rotate(5deg) scale(1)'; });
      setTimeout(() => { n.style.transition = 'transform .28s ease-in,opacity .2s'; n.style.opacity = 0; n.style.transform = 'translateY(-25px) rotate(25deg) scale(.72)'; }, 580);
      setTimeout(() => n.remove(), 930);
    }, delay || 0);

    const plaque = (tx, py, text, color, life) => {
      const n = el('div');
      n.style.cssText = `position:absolute;left:${tx - 76}px;top:${py - 78}px;width:152px;
        padding:6px 7px;border:2px solid ${color};border-radius:7px;color:#fff7dc;background:#2a2019e8;
        box-shadow:0 3px #110d0a,0 0 12px ${color}66;text-align:center;font:1000 8px/1.1 Arial,sans-serif;
        letter-spacing:1px;pointer-events:none;opacity:0;transform:translateY(8px) scale(.72)`;
      n.textContent = text; this.front.appendChild(n);
      requestAnimationFrame(() => { n.style.transition = 'transform .2s cubic-bezier(.16,1.4,.3,1),opacity .1s'; n.style.opacity = '.96'; n.style.transform = 'translateY(0) scale(1)'; });
      setTimeout(() => { n.style.transition = 'opacity .22s,transform .22s'; n.style.opacity = 0; n.style.transform = 'translateY(-8px) scale(1.04)'; }, (life || .72) * 1000);
      setTimeout(() => n.remove(), (life || .72) * 1000 + 300);
    };

    if (kind === 'tea') {
      this.castProp(x + face * 20, y, { kind: 'item', img: 'Trinkets/FancyPurse', size: 48 }, tea, .72);
      this.ring(x, y - 30, size * 1.05, tea, .48);
      this.aura(x, y, '#d9a66a', 1.7);
      for (let i = 0; i < 9; i++) this.part({ x: x + rnd(-size * .38, size * .38), y: y - rnd(30, 72), vx: rnd(-12, 12), vy: rnd(-55, -22), g: -18, size: rnd(3, 7), col: i % 2 ? cream : tea, life: rnd(.55, 1.0), shape: 'txt', char: '·' });
      allies.forEach((a, i) => { cup(a.x, ty(a), 110 + i * 55, cream); this.ring(a.x, ty(a), size * .42, sage, .3); });
      targets.forEach((t, i) => setTimeout(() => { this.ring(t.x, ty(t), size * .48, tea, .3); this.floatIcon(t.x, ty(t) - 60, 'ETIQUETTE', cream); }, 150 + i * 40));
      plaque(x, y - 42, 'TEA IS SERVED', cream, .9);
      return;
    }

    if (kind === 'tape') {
      this.ring(x, y - 35, size * .4, tea, .24);
      this.floatIcon(x, y - 90, '📼 TAPE +' + (opt.count || 1), cream);
      this.burst(x, y - 55, 5, [tea, cream, sage], { shape: 'paper', spMin: 25, spMax: 90, lift: 42, sMin: 3, sMax: 7, life: .48 });
      return;
    }

    if (kind === 'correction' && target) {
      this.targetLine({ x: x + face * 20, y: y - 20 }, target, cream);
      cup(target.x, ty(target), 100, cream);
      this.ring(target.x, ty(target), size * .62, red, .34);
      this.burst(target.x, ty(target) - 18, 8, [cream, red, tea], { shape: 'streak', spMin: 45, spMax: 150, lift: 45, sMin: 2, sMax: 7, life: .52 });
      this.floatIcon(target.x, ty(target) - 66, 'MIND YOUR MANNERS', cream);
      plaque(target.x, ty(target), 'PLEASE. SIT. DOWN.', red, .78);
      return;
    }

    if (kind === 'seating' && target) {
      this.targetLine({ x, y }, target, blue);
      this.ring(target.x, ty(target), size * .78, blue, .46);
      this.ring(target.x, ty(target) + 15, size * .48, tea, .7);
      this.burst(target.x, ty(target) - 22, 12, [blue, cream, tea], { shape: 'shard', spMin: 45, spMax: 170, lift: 62, sMin: 3, sMax: 8, life: .62 });
      this.floatIcon(target.x, ty(target) - 70, 'PROPERLY SEATED', cream);
      plaque(target.x, ty(target), 'YOUR TABLE AWAITS', blue, 1.0);
      return;
    }

    if (kind === 'shield' && target) {
      this.ring(target.x, ty(target), size * .62, cream, .36);
      this.ring(target.x, ty(target), size * .48, sage, .58);
      this.floatIcon(target.x, ty(target) - 62, 'HOSTED', cream);
      return;
    }

    if (kind === 'guard') {
      this.ring(x, y - 30, size * .82, cream, .48);
      this.burst(x, y - 50, 12, [cream, tea, sage], { shape: 'streak', spMin: 35, spMax: 135, lift: 55, sMin: 2, sMax: 7, life: .6 });
      this.floatIcon(x, y - size * .9, 'DEBUFF DECLINED', cream);
      plaque(x, y - 42, 'NOT AT MY TABLE', cream, .82);
    }
  },

  /** Shelly’s effects are a readable little morale show: rainbow arcs for
      Encouraged, fossil-card callouts for Correction, and a warm lecture
      zone that turns enemy pressure into a visible boundary. Keep the
      effects local to the caster/targets so a five-person fight stays legible. */
  shellySkill(kind, x, y, opt) {
    if (!this.front) return;
    opt = opt || {};
    const size = opt.size || 100, face = opt.face || 1;
    const target = opt.target || opt.ally;
    const allies = (opt.allies || []).filter(a => a && a.alive);
    const targets = (opt.targets || []).filter(a => a && a.alive);
    const pink = '#ff78c8', coral = '#ff9f86', gold = '#ffd36b', mint = '#a6f0b2';
    const blue = '#83dfff', violet = '#a995ff', bone = '#ffe6ab';
    const rainbow = [pink, coral, gold, mint, blue, violet];
    const ty = t => t && t.y - 42;

    const arc = (cx, cy, radius, color, delay, life, tilt) => {
      setTimeout(() => {
        const n = el('i');
        n.style.cssText = `position:absolute;left:${cx - radius}px;top:${cy - radius * .72}px;
          width:${radius * 2}px;height:${radius * 1.44}px;border:3px solid transparent;
          border-top-color:${color};border-radius:50%;pointer-events:none;opacity:0;
          transform:rotate(${tilt || 0}deg) scale(.35);filter:drop-shadow(0 0 6px ${color});`;
        this.front.appendChild(n);
        requestAnimationFrame(() => {
          n.style.transition = 'transform .34s cubic-bezier(.12,1.35,.3,1),opacity .12s';
          n.style.opacity = '.9'; n.style.transform = `rotate(${tilt || 0}deg) scale(1)`;
        });
        setTimeout(() => { n.style.transition = 'transform .28s ease-in,opacity .22s'; n.style.opacity = 0; n.style.transform = `rotate(${(tilt || 0) + 12}deg) scale(1.16)`; }, (life || .62) * 1000);
        setTimeout(() => n.remove(), (life || .62) * 1000 + 360);
      }, delay || 0);
    };

    const shield = (a, delay, label) => {
      if (!a) return;
      setTimeout(() => {
        this.ring(a.x, ty(a), size * .50, blue, .34);
        this.ring(a.x, ty(a), size * .38, pink, .52);
        this.burst(a.x, ty(a) - 8, 5, [blue, pink, gold], { shape: 'streak', spMin: 25, spMax: 90, lift: 38, sMin: 2, sMax: 5, life: .42 });
        if (label) this.floatIcon(a.x, ty(a) - 62, label, '#fff2c4');
      }, delay || 0);
    };

    if (kind === 'encourage' && target) {
      this.targetLine({ x, y }, target, pink);
      arc(target.x, ty(target), size * .52, pink, 0, .72, -10);
      arc(target.x, ty(target), size * .62, gold, 65, .72, 8);
      arc(target.x, ty(target), size * .72, blue, 130, .72, -4);
      this.floatIcon(target.x, ty(target) - 66, 'ENCOURAGED', '#ffe6f4');
      this.burst(target.x, ty(target) - 24, 7, rainbow, { shape: 'txt', char: '♥', spMin: 22, spMax: 88, lift: 52, sMin: 7, sMax: 12, life: .66 });
      return;
    }

    if (kind === 'gloom' && target) {
      this.ring(target.x, ty(target), size * (.34 + (opt.stacks || 1) * .035), violet, .24);
      this.burst(target.x, ty(target) - 4, 3 + (opt.stacks || 1), ['#4d3d71', '#77708f', violet], { shape: 'txt', char: '·', spMin: 18, spMax: 70, lift: 24, sMin: 5, sMax: 9, life: .45 });
      if ((opt.stacks || 0) >= 5) this.floatIcon(target.x, ty(target) - 64, 'DISHEARTENED', '#ffd0e7');
      return;
    }

    if (kind === 'fact' && target) {
      this.ring(target.x, ty(target), size * .72, bone, .34);
      this.burst(target.x, ty(target) - 18, 10, [bone, gold, pink], { shape: 'shard', spMin: 45, spMax: 150, lift: 70, sMin: 3, sMax: 8, life: .58 });
      this.floatIcon(target.x, ty(target) - 78, 'FOSSIL FACT!', bone);
      return;
    }

    if (kind === 'inspiration') {
      this.aura(x, y, pink, 1.6);
      rainbow.forEach((col, i) => arc(x, y - 8, size * (.72 + i * .105), col, i * 34, 1.15, i % 2 ? 5 : -5));
      this.ring(x, y - 8, size * 1.12, gold, .48);
      this.burst(x, y - 28, 18, rainbow, { shape: 'streak', spMin: 45, spMax: 180, lift: 65, sMin: 2, sMax: 7, life: .68 });
      allies.forEach((a, i) => shield(a, i * 62, 'ENCOURAGED'));
      targets.forEach((t, i) => setTimeout(() => {
        this.ring(t.x, ty(t), size * .56, violet, .30);
        this.floatIcon(t.x, ty(t) - 58, t.hasStatus && t.hasStatus('cbdisheartened') ? 'LISTEN UP' : 'GLOOM', '#e3d9ff');
      }, 130 + i * 48));
      if (opt.lecture) this.shellySkill('lecture', x, y, opt);
      return;
    }

    if (kind === 'encore') {
      this.aura(x, y, gold, 1.9);
      rainbow.forEach((col, i) => arc(x, y - 12, size * (.78 + i * .12), col, i * 42, .92, i % 2 ? 8 : -8));
      this.ring(x, y - 10, size * 1.18, gold, .52);
      this.burst(x, y - 32, 26, rainbow, { shape: 'txt', char: '★', spMin: 55, spMax: 220, lift: 105, sMin: 7, sMax: 13, life: .82 });
      allies.forEach((a, i) => shield(a, i * 54, 'ENCORE'));
      targets.forEach((t, i) => setTimeout(() => {
        this.ring(t.x, ty(t), size * (.48 + i * .025), violet, .34);
        this.floatIcon(t.x, ty(t) - 62, 'DISHEARTENED', '#ffd0e7');
      }, 120 + i * 40));
      return;
    }

    if (kind === 'pep') {
      const a = target;
      if (a) {
        this.targetLine({ x, y }, a, gold);
        arc(a.x, ty(a), size * .54, gold, 0, .72, -8);
        arc(a.x, ty(a), size * .66, mint, 75, .72, 7);
        shield(a, 120, 'HOPE');
      }
      if (opt.corrected) {
        this.ring(opt.corrected.x, ty(opt.corrected), size * .54, bone, .32);
        this.floatIcon(opt.corrected.x, ty(opt.corrected) - 64, 'CORRECTED', bone);
        this.burst(opt.corrected.x, ty(opt.corrected) - 12, 7, [bone, gold, '#9a7952'], { shape: 'shard', spMin: 35, spMax: 110, lift: 45, sMin: 3, sMax: 7, life: .52 });
      }
      return;
    }

    if (kind === 'beam') {
      this.ring(x + face * 22, y - 34, size * .48, gold, .28);
      this.floatIcon(x + face * 22, y - size * .92, 'CHEER STARE', '#fff2c4');
      targets.forEach((t, i) => {
        const line = el('i');
        const x1 = x + face * 26, y1 = y - 45, x2 = t.x, y2 = ty(t);
        const len = Math.max(1, Math.hypot(x2 - x1, y2 - y1));
        line.style.cssText = `position:absolute;left:${x1}px;top:${y1 - 5}px;width:${len}px;height:10px;
          transform-origin:0 50%;transform:rotate(${Math.atan2(y2 - y1, x2 - x1)}rad) scaleX(.02);opacity:0;
          border-radius:99px;background:linear-gradient(90deg,${pink},${gold},${blue},transparent);
          box-shadow:0 0 13px ${pink},0 0 22px ${blue};pointer-events:none;`;
        this.front.appendChild(line);
        setTimeout(() => {
          line.style.transition = 'transform .22s cubic-bezier(.1,1.3,.3,1),opacity .08s';
          line.style.opacity = '.94'; line.style.transform = `rotate(${Math.atan2(y2 - y1, x2 - x1)}rad) scaleX(1)`;
        }, i * 40);
        setTimeout(() => { line.style.transition = 'opacity .22s'; line.style.opacity = 0; }, 300 + i * 40);
        setTimeout(() => line.remove(), 600 + i * 40);
        setTimeout(() => {
          this.ring(t.x, ty(t), size * .62, pink, .32);
          this.burst(t.x, ty(t), 8, rainbow, { shape: 'streak', spMin: 55, spMax: 175, lift: 45, sMin: 2, sMax: 7, life: .5 });
          this.floatIcon(t.x, ty(t) - 58, t.hasStatus && t.hasStatus('cbgloom') ? 'SILENCED' : 'BRIGHTENED', '#fff0c7');
        }, 230 + i * 40);
      });
      return;
    }

    if (kind === 'lecture') {
      const zone = el('div', 'shelly-lecture-zone-live');
      const width = Math.max(230, size * 3.4);
      zone.style.cssText = `left:${x - width / 2}px;top:${y - 120}px;width:${width}px;height:145px;`;
      zone.innerHTML = '<i></i><i></i><b>RAINBOW LECTURE</b><span>FOSSIL FACT IN PROGRESS</span>';
      this.back.appendChild(zone);
      requestAnimationFrame(() => zone.classList.add('active'));
      if (opt.owner) opt.owner._shellyZoneFx = zone;
      targets.forEach((t, i) => setTimeout(() => {
        this.ring(t.x, ty(t), size * .45, gold, .28);
        this.floatIcon(t.x, ty(t) - 58, 'LISTEN', '#ffe8a9');
      }, i * 55));
      setTimeout(() => { zone.classList.remove('active'); zone.classList.add('leaving'); }, 1100);
      setTimeout(() => zone.remove(), 1600);
      return;
    }

    if (kind === 'hope') {
      const a = target;
      if (!a) return;
      rainbow.forEach((col, i) => arc(a.x, ty(a), size * (.46 + i * .06), col, i * 28, .86, i % 2 ? 8 : -8));
      this.ring(a.x, ty(a), size * .72, gold, .38);
      this.floatIcon(a.x, ty(a) - 68, 'HOPE', '#fff1a7');
      this.burst(a.x, ty(a) - 25, 10, [gold, pink, mint], { shape: 'txt', char: '♥', spMin: 32, spMax: 120, lift: 68, sMin: 7, sMax: 13, life: .7 });
      return;
    }

    if (kind === 'save') {
      const a = target;
      if (!a) return;
      this.aura(a.x, ty(a), pink, 2.1);
      this.ring(a.x, ty(a), size * 1.12, gold, .62);
      this.ring(a.x, ty(a), size * .76, blue, 1.05);
      this.burst(a.x, ty(a) - 30, 22, rainbow, { shape: 'shard', spMin: 45, spMax: 210, lift: 100, sMin: 3, sMax: 9, life: .82 });
      this.floatIcon(a.x, ty(a) - 94, 'NO ONE LEFT BEHIND', '#fff2c4');
    }
  },

  /** Brightney's effects are built around an actual desk lamp: the shade
      swings like a blunt weapon, the bulb visibly overcharges, the shade
      angles into a guard, and the beam stays narrow enough to read as a
      deliberate target lock instead of another full-screen spell. */
  brightneySkill(kind, x, y, opt) {
    if (!this.front) return;
    opt = opt || {};
    const size = opt.size || 100, face = opt.face || 1, target = opt.target;
    const targets = (opt.targets || []).filter(t => t && t.alive);
    const col = '#fff3b0', hot = '#fffbe0', gold = '#ffd86b', shadow = '#c59b42';
    const targetY = t => t && (t.y - 46);
    const line = (x1, y1, x2, y2, width, life, color) => {
      const dx = x2 - x1, dy = y2 - y1, len = Math.max(1, Math.hypot(dx, dy));
      const n = el('i');
      n.style.cssText = `position:absolute;left:${x1}px;top:${y1 - width / 2}px;width:${len}px;height:${width}px;
        border-radius:99px;background:linear-gradient(90deg,transparent 0%,${hot} 18%,${color || col} 56%,transparent 100%);
        box-shadow:0 0 ${Math.max(5, width * .9)}px ${color || col};opacity:0;pointer-events:none;transform-origin:0 50%;
        transform:rotate(${Math.atan2(dy, dx)}rad) scaleX(.04)`;
      this.front.appendChild(n);
      requestAnimationFrame(() => {
        n.style.transition = 'transform .16s cubic-bezier(.12,1.4,.3,1),opacity .08s';
        n.style.opacity = '.9'; n.style.transform = `rotate(${Math.atan2(dy, dx)}rad) scaleX(1)`;
      });
      setTimeout(() => { n.style.transition = 'opacity .18s,transform .18s'; n.style.opacity = '0'; n.style.transform += ' scaleX(1.04)'; }, (life || .34) * 1000);
      setTimeout(() => n.remove(), (life || .34) * 1000 + 260);
      return n;
    };
    const rays = (cx, cy, count, radius, width, color) => {
      for (let i = 0; i < count; i++) {
        const a = i / count * Math.PI * 2 + .08;
        const reach = radius * rnd(.82, 1.08);
        const x1 = cx + Math.cos(a) * radius * .24, y1 = cy + Math.sin(a) * radius * .24;
        line(x1, y1, cx + Math.cos(a) * reach, cy + Math.sin(a) * reach, width, .26 + i * .012, color || gold);
      }
    };
    const shade = (angle, life) => {
      const w = size * .78, h = size * .38, n = el('i');
      n.style.cssText = `position:absolute;left:${x - w / 2}px;top:${y - h * .58}px;width:${w}px;height:${h}px;
        border:3px solid ${shadow};border-top-color:${hot};border-radius:55% 55% 24% 24%;
        background:linear-gradient(180deg,#fffbe0d9,#e1b958aa 52%,#9b71375e);box-shadow:inset 0 3px #fff9,0 0 11px ${gold}88;
        opacity:0;pointer-events:none;transform-origin:50% 100%;transform:translate(${face * -18}px,12px) scale(.45) rotate(${angle - face * 20}deg)`;
      this.front.appendChild(n);
      requestAnimationFrame(() => {
        n.style.transition = 'transform .2s cubic-bezier(.14,1.45,.3,1),opacity .1s';
        n.style.opacity = '.94'; n.style.transform = `translate(${face * 4}px,0) scale(1) rotate(${angle}deg)`;
      });
      setTimeout(() => { n.style.transition = 'transform .2s ease-in,opacity .18s'; n.style.opacity = '0'; n.style.transform = `translate(${face * 25}px,-16px) scale(.82) rotate(${angle + face * 14}deg)`; }, (life || .42) * 1000);
      setTimeout(() => n.remove(), (life || .42) * 1000 + 280);
    };

    if (kind === 'bash' && target) {
      const ty = targetY(target);
      shade(-face * 34, .28);
      this.slash(target.x, ty, { col: hot, ang: face * -24, small: false });
      this.ring(target.x, ty, size * .62, col, .25);
      this.burst(target.x, ty, 7, [col, gold, shadow], { shape: 'streak', spMin: 55, spMax: 170, lift: 42, sMin: 2, sMax: 6, life: .4 });
      return;
    }

    if (kind === 'flash') {
      if (opt.phase === 'charge') {
        this.castProp(x + face * 16, y + 4, { kind: 'item', img: 'Trinkets/BRIGHTNEY_SpareBulb', size: 44 }, col, .48);
        this.ring(x, y - 8, size * .62, gold, .28);
        this.ring(x, y - 8, size * .96, col, .48);
        this.floatIcon(x, y - size * .82, 'OVERCHARGE', hot);
        this.burst(x, y - 28, 6, [col, gold], { shape: 'streak', spMin: 30, spMax: 105, lift: 45, sMin: 2, sMax: 5, life: .45 });
      } else {
        rays(x, y - 8, 10, size * 1.45, Math.max(3, size * .045), col);
        this.ring(x, y - 8, size * 1.05, hot, .28);
        this.ring(x, y - 8, size * 1.72, gold, .45);
        this.burst(x, y - 22, 15, [hot, col, gold], { shape: 'shard', spMin: 70, spMax: 260, lift: 80, sMin: 3, sMax: 8, life: .58 });
        targets.forEach((t, i) => setTimeout(() => {
          if (!t || !t.alive) return;
          const ty = targetY(t);
          this.ring(t.x, ty, size * (.52 + i * .04), hot, .24);
          this.floatIcon(t.x, ty - 54, 'BLINDED', gold);
        }, i * 42));
      }
      return;
    }

    if (kind === 'guard') {
      if (opt.phase === 'cast') {
        shade(-face * 6, Math.max(1.2, opt.dur || 5));
        this.ring(x, y + 8, size * .84, col, .32);
        this.aura(x, y, col, Math.max(1.2, opt.dur || 5));
        this.floatIcon(x, y - size * .82, 'SHADE UP', hot);
        this.burst(x + face * 12, y - 28, 7, [col, gold], { shape: 'streak', dir: face * -.1, spread: .5, spMin: 25, spMax: 100, lift: 48, sMin: 2, sMax: 5, life: .5 });
      } else if (target) {
        const ty = targetY(target);
        this.ring(x, y - 18, size * .6, hot, .22);
        this.ring(target.x, ty, size * .46, gold, .22);
        line(target.x, ty, x + face * 18, y - 20, Math.max(3, size * .035), .32, gold);
        this.floatIcon(target.x, ty - 48, 'SLOWED', gold);
      }
      return;
    }

    if (kind === 'guardHit') {
      shade(face * 23, .25);
      this.ring(x + face * 22, y - 30, size * .62, hot, .24);
      this.burst(x + face * 28, y - 30, 6, [hot, gold], { shape: 'streak', dir: face * Math.PI, spread: .55, spMin: 50, spMax: 160, lift: 30, sMin: 2, sMax: 6, life: .38 });
      return;
    }

    if (kind === 'beam' && target) {
      const ty = targetY(target);
      if (opt.phase === 'charge') {
        this.castProp(x + face * 20, y - 2, { kind: 'item', img: 'Trinkets/BRIGHTNEY_SpareBulb', size: 38 }, col, .42);
        this.ring(x, y - 34, size * .58, gold, .3);
        this.ring(target.x, ty, size * .52, col, .36);
        line(x + face * 23, y - 42, target.x, ty, Math.max(3, size * .05), .3, gold);
      } else if (opt.phase === 'fire') {
        line(x + face * 24, y - 45, target.x, ty, Math.max(7, size * .10), .42, hot);
        line(x + face * 24, y - 45, target.x, ty, Math.max(2, size * .035), .46, gold);
        this.burst(x + face * 24, y - 45, 5, [hot, gold], { shape: 'streak', dir: face, spread: .3, spMin: 40, spMax: 120, lift: 20, sMin: 2, sMax: 5, life: .32 });
      } else {
        this.ring(target.x, ty, size * .86, hot, .3);
        this.burst(target.x, ty, 10, [hot, col, gold], { shape: 'streak', spMin: 70, spMax: 220, lift: 55, sMin: 3, sMax: 8, life: .52 });
        this.floatIcon(target.x, ty - 58, 'DEFENSE DOWN', gold);
      }
      return;
    }

    if (kind === 'overcharge') {
      this.ring(x, y - 8, size * 1.2, gold, .35);
      (opt.allies || []).filter(a => a && a.alive).forEach((a, i) => setTimeout(() => {
        this.targetLine({ x, y: y - 20 }, { x: a.x, y: a.y - 44 }, col);
        this.ring(a.x, a.y - 44, size * .46, hot, .26);
        this.floatIcon(a.x, a.y - 92, 'CHARGED', gold);
      }, i * 55));
    }
  },

  /** Blot's visuals are deliberately theatrical and slightly fake: a mime
      frame, a painted duplicate, an invisible barrier, and ink placed under
      the enemy who thinks they are safe. */
  blotSkill(kind, x, y, opt) {
    if (!this.front) return;
    opt = opt || {};
    const size = opt.size || 100, face = opt.face || 1, target = opt.target;
    const ink = '#8f6bff', deep = '#3b2560', pale = '#d7caff', black = '#171225';
    const targetY = t => t && (t.y - 46);
    const wall = (life, scale) => {
      const w = size * .15, h = size * 1.18, n = el('div');
      n.innerHTML = '<i></i><i></i><i></i>';
      n.style.cssText = `position:absolute;left:${x + face * size * .35 - w / 2}px;top:${y - h * .80}px;width:${w}px;height:${h}px;
        border:3px solid ${pale};border-left-color:${ink};border-right-color:${ink};border-radius:8px;background:linear-gradient(90deg,${ink}33,${pale}22,${ink}33);
        box-shadow:0 0 16px ${ink}99,inset 0 0 12px ${pale}33;opacity:0;pointer-events:none;transform:translateX(${face * -22}px) scaleY(.16)`;
      [...n.children].forEach((mark, i) => { mark.style.cssText = `position:absolute;left:${i * 34 - 3}px;top:${12 + i * 24}px;width:${w * 1.3}px;height:3px;background:${pale};opacity:.7;transform:rotate(${i % 2 ? -14 : 12}deg)`; });
      this.front.appendChild(n);
      requestAnimationFrame(() => { n.style.transition = 'transform .22s cubic-bezier(.12,1.45,.3,1),opacity .12s'; n.style.opacity = '.86'; n.style.transform = 'translateX(0) scaleY(1)'; });
      setTimeout(() => { n.style.transition = 'transform .35s ease-in,opacity .26s'; n.style.opacity = '0'; n.style.transform = `translateX(${face * 14}px) scaleY(.86)`; }, (life || 1.1) * 1000);
      setTimeout(() => n.remove(), (life || 1.1) * 1000 + 420);
    };

    if (kind === 'flick' && target) {
      const ty = targetY(target);
      this.slash(target.x, ty, { col: pale, ang: face * -18, small: true });
      this.ring(target.x, ty, size * .46, ink, .22);
      this.burst(target.x, ty, 6, [ink, pale, deep], { shape: 'dot', spMin: 50, spMax: 160, lift: 36, sMin: 3, sMax: 7, life: .42 });
      return;
    }

    if (kind === 'decoy') {
      this.ring(x, y - 14, size * .64, ink, .32);
      this.castProp(x + face * 18, y + size * .18, { kind: 'obj', img: 'canvas', size: 48 }, ink, .44);
      this.scribble(x + face * 24, y - 38);
      this.burst(x + face * 20, y - 22, 8, [ink, pale, deep], { shape: 'ink', spMin: 30, spMax: 120, lift: 50, sMin: 3, sMax: 8, life: .6 });
      this.floatIcon(x + face * 22, y - size * .86, 'DECOY', pale);
      return;
    }

    if (kind === 'decoySpawn') {
      this.ring(x, y - 18, size * .82, pale, .3);
      this.burst(x, y - 22, 10, [ink, pale, deep], { shape: 'ink', spMin: 35, spMax: 150, lift: 55, sMin: 3, sMax: 8, life: .58 });
      return;
    }

    if (kind === 'decoyBurst') {
      this.inkSplat(x, y);
      this.ring(x, y - 22, size * 1.05, ink, .34);
      this.burst(x, y - 28, 13, [ink, pale, deep], { shape: 'ink', spMin: 55, spMax: 230, lift: 70, sMin: 4, sMax: 12, life: .72 });
      this.floatIcon(x, y - size * .88, 'INK POP', pale);
      return;
    }

    if (kind === 'wall') {
      wall(opt.dur || 6, 1);
      this.ring(x + face * size * .35, y - 28, size * .46, pale, .26);
      this.floatIcon(x + face * size * .35, y - size * .92, 'WALL', pale);
      this.burst(x + face * size * .35, y - 34, 7, [ink, pale], { shape: 'streak', dir: face * Math.PI / 2, spread: .5, spMin: 24, spMax: 90, lift: 42, sMin: 2, sMax: 5, life: .48 });
      return;
    }

    if (kind === 'shield' && target) {
      this.targetLine({ x: x + face * size * .35, y: y - 28 }, { x: target.x, y: targetY(target) }, ink);
      this.ring(target.x, targetY(target), size * .48, pale, .28);
      this.burst(target.x, targetY(target), 4, [ink, pale], { shape: 'streak', spMin: 20, spMax: 82, lift: 30, sMin: 2, sMax: 5, life: .4 });
      return;
    }

    if (kind === 'wallHit') {
      wall(.34, 1);
      this.ring(x + face * size * .35, y - 28, size * .58, pale, .25);
      this.burst(x + face * size * .35, y - 34, 6, [pale, ink], { shape: 'streak', dir: -face, spread: .6, spMin: 40, spMax: 140, lift: 30, sMin: 2, sMax: 6, life: .36 });
      return;
    }

    if (kind === 'trail') {
      const cx = opt.x == null ? x + face * 52 : opt.x;
      this.pool(cx, opt.dur || 8, deep, 190);
      this.scribble(cx, y - 20);
      this.ring(cx, y - 6, size * .66, ink, .28);
      this.burst(cx, y - 12, 9, [ink, deep, pale], { shape: 'ink', spMin: 25, spMax: 120, lift: 30, sMin: 3, sMax: 9, life: .58 });
      this.floatIcon(cx, y - size * .75, 'SLIPPERY', pale);
      return;
    }

    if (kind === 'mimic') {
      const stacks = opt.stacks || 1;
      this.ring(x, y - 20, size * (.52 + stacks * .08), ink, .24);
      this.burst(x, y - 34, 4 + stacks, [ink, pale], { shape: 'txt', char: '↻', spMin: 24, spMax: 90, lift: 48, sMin: 9, sMax: 14, life: .62 });
      this.floatIcon(x, y - size * .83, `MIMICRY ${stacks}`, pale);
      return;
    }

    if (kind === 'silence' && target) {
      const ty = targetY(target);
      this.scribble(target.x, ty - 10);
      this.ring(target.x, ty, size * .58, pale, .28);
      this.floatIcon(target.x, ty - 58, 'SILENCED', pale);
    }
  },

  /** Soulvester's kit is about weight, protection, and refusing to leave the
      line. These are deliberately local effects: layered steel plates and
      guard links explain the mechanics without another generic spell burst. */
  soulvesterSkill(kind, x, y, opt) {
    if (!this.front) return;
    opt = opt || {};
    const size = opt.size || 100, face = opt.face || 1;
    const steel = '#c9d0da', bright = '#f2f5e8', blue = '#9ed9ff', gold = '#e7c875';
    const target = opt.target;
    const targetY = t => t && (t.y - 42);
    const plate = (angle, delay) => {
      setTimeout(() => {
        const n = el('i'), w = size * .22, h = size * .52;
        n.style.cssText = `position:absolute;left:${x - w / 2}px;top:${y - h * .66}px;width:${w}px;height:${h}px;
          border:3px solid ${steel};border-radius:45% 45% 20% 20%;background:linear-gradient(135deg,#f6f7ee,#71808d 58%,#28313a);
          box-shadow:inset 2px 0 #fff8,0 0 9px ${blue}88;opacity:0;pointer-events:none;transform-origin:50% 90%;transform:rotate(${angle - face * 35}deg) translateY(18px) scale(.35)`;
        this.front.appendChild(n);
        requestAnimationFrame(() => {
          n.style.transition = 'transform .28s cubic-bezier(.14,1.5,.3,1),opacity .12s';
          n.style.opacity = .94; n.style.transform = `rotate(${angle}deg) translateY(0) scale(1)`;
        });
        setTimeout(() => { n.style.transition = 'transform .38s ease-in,opacity .28s'; n.style.opacity = 0; n.style.transform = `rotate(${angle + face * 15}deg) translateY(-22px) scale(.8)`; }, 560);
        setTimeout(() => n.remove(), 980);
      }, delay || 0);
    };

    if (kind === 'armor') {
      this.ring(x, y + 10, size * 1.02, steel, .42);
      if (opt.phase === 'cast') {
        this.telegraph(x, y + 12, size * 1.25, steel, .55);
        this.aura(x, y, blue, Math.max(1.2, opt.dur || 4));
        [-62, -31, 0, 31, 62].forEach((a, i) => plate(a, i * 45));
        this.floatIcon(x, y - size * .82, 'ARMOR UP', bright);
        this.burst(x, y - 22, 7, [steel, blue, bright], { shape: 'shard', spMin: 35, spMax: 120, lift: 50, sMin: 3, sMax: 7, life: .48 });
      } else {
        this.ring(x, y - 2, size * 1.55, bright, .48);
        this.burst(x, y - 28, 11, [steel, blue, gold], { shape: 'sq', spMin: 55, spMax: 180, lift: 85, sMin: 3, sMax: 8, life: .65 });
        this.floatIcon(x, y - size * .96, 'FORTIFIED', blue);
      }
      return;
    }

    if (kind === 'guard') {
      this.ring(x, y + 8, size * .86, steel, .38);
      if (target) {
        this.targetLine({ x, y: y - 18 }, { x: target.x, y: targetY(target) }, blue);
        this.ring(target.x, targetY(target), size * .78, blue, .44);
        this.floatIcon(target.x, targetY(target) - 48, 'GUARDED', bright);
      }
      if (opt.phase === 'cast') {
        this.aura(x, y, steel, opt.dur || 5);
        this.floatIcon(x, y - size * .82, 'HOLD THE LINE', steel);
        this.burst(x, y - 24, 6, [steel, blue], { shape: 'streak', spMin: 25, spMax: 110, lift: 45, sMin: 2, sMax: 5, life: .5 });
      }
      return;
    }

    if (kind === 'redirect' && target) {
      const ty = targetY(target);
      this.targetLine({ x: target.x, y: ty }, { x, y: y - 20 }, steel);
      this.ring(target.x, ty, size * .72, blue, .22);
      this.ring(x, y - 20, size * .62, steel, .28);
      this.burst(x + (target.x - x) * .35, y - 24, 5, [steel, bright], { shape: 'streak', spMin: 40, spMax: 125, lift: 20, sMin: 2, sMax: 5, life: .34 });
      this.floatIcon(x, y - size * .86, 'TAKEN', steel);
      return;
    }

    if (kind === 'sword') {
      if (opt.phase === 'cast') {
        this.castProp(x + face * 20, y, { kind: 'item', img: 'sword3', size: 58 }, steel, .64);
        this.ring(x, y - 6, size * 1.05, gold, .34);
        this.floatIcon(x, y - size * .85, 'SOUL SWORD', bright);
        this.burst(x + face * 18, y - 45, 5, [gold, steel], { shape: 'streak', dir: face ? face * -.15 : 0, spread: .5, spMin: 45, spMax: 125, lift: 20, sMin: 2, sMax: 6, life: .42 });
      } else if (target) {
        const ty = targetY(target);
        this.ring(target.x, ty, size * 1.08, blue, .34);
        this.floatIcon(target.x, ty - 60, 'GHOST CUT', blue);
        this.burst(target.x, ty, 10, [steel, blue, bright], { shape: 'streak', spMin: 80, spMax: 230, lift: 45, sMin: 3, sMax: 8, life: .55 });
      }
      return;
    }

    if (kind === 'slam' && target) {
      const ty = targetY(target);
      this.crack(x + face * 22, y + 18, .6);
      this.ring(target.x, ty, size * .82, steel, .28);
      this.burst(x + face * 26, y + 10, 8, [steel, gold, '#77838d'], { shape: 'shard', dir: face * -.1, spread: 1.1, spMin: 60, spMax: 210, lift: 60, sMin: 3, sMax: 9, life: .48 });
      return;
    }

    if (kind === 'unshaken') {
      this.aura(x, y, steel, 1.5);
      this.ring(x, y - 6, size * (1.05 + (opt.index || 0) * .12), opt.index === 2 ? gold : blue, .48);
      this.burst(x, y - 30, 7 + (opt.index || 0) * 2, [steel, blue, gold], { shape: 'sq', spMin: 35, spMax: 135, lift: 70, sMin: 3, sMax: 8, life: .58 });
      this.floatIcon(x, y - size * .9, opt.index === 2 ? 'UNSHAKEN' : 'STILL STANDING', bright);
      [-48, -16, 16, 48].forEach((a, i) => plate(a, i * 35));
      return;
    }

    if (kind === 'resolve') {
      const force = 1 + (opt.missing || 0);
      if (opt.phase === 'cast') {
        this.aura(x, y, gold, 2.2);
        this.ring(x, y, size * (1.1 + force * .18), gold, .58);
        this.floatIcon(x, y - size * .9, 'HOLD THE LINE', bright);
        [-58, -29, 0, 29, 58].forEach((a, i) => plate(a, i * 38));
      } else {
        this.ring(x, y - 8, size * (1.55 + force * .12), bright, .52);
        this.burst(x, y - 28, 15, [gold, steel, bright], { shape: 'streak', spMin: 60, spMax: 230, lift: 110, sMin: 3, sMax: 10, life: .72 });
        this.floatIcon(x, y - size * 1.05, 'RESOLVE', gold);
      }
    }
  },

  /** Connie's effects are about absence, misdirection, and the ghost that is
      still present after she leaves. Keep the language thin and translucent
      so the battlefield remains readable, then let Twisted Connie invert it
      into a bruised magenta instead of just tinting the same generic burst. */
  connieSkill(kind, x, y, opt) {
    if (!this.front) return;
    opt = opt || {};
    const twisted = !!opt.twisted;
    const col = twisted ? '#df4c9e' : '#bfe9ff';
    const deep = twisted ? '#71315f' : '#7666c7';
    const pale = twisted ? '#ffb1db' : '#effdff';
    const size = opt.size || 92, face = opt.face || 1;
    const target = opt.target;
    const targetY = t => t && (t.y - 44);
    const ghost = (gx, gy, scale, life, delay) => {
      setTimeout(() => {
        const n = el('img');
        const src = Art.unit('Connie', twisted);
        const w = size * (scale || .75);
        n.src = src; n.alt = '';
        n.style.cssText = `position:absolute;left:${gx - w / 2}px;top:${gy - w * .92}px;width:${w}px;height:${w * 1.16}px;
          object-fit:contain;pointer-events:none;z-index:6;opacity:0;filter:${twisted
            ? 'saturate(1.5) hue-rotate(286deg) brightness(.82) drop-shadow(0 0 10px #df4c9e)'
            : 'grayscale(.22) brightness(1.18) drop-shadow(0 0 10px #bfe9ff)'};
          transform:translate(${face * -8}px,12px) scaleX(${face}) scale(.72)`;
        this.front.appendChild(n);
        requestAnimationFrame(() => {
          n.style.transition = `transform ${life || .42}s cubic-bezier(.12,.8,.25,1),opacity .12s`;
          n.style.opacity = twisted ? '.42' : '.52';
          n.style.transform = `translate(${face * 8}px,-${size * .08}px) scaleX(${face}) scale(1)`;
        });
        setTimeout(() => {
          n.style.transition = 'transform .32s ease-out,opacity .28s';
          n.style.opacity = 0; n.style.transform = `translate(${face * 22}px,-${size * .28}px) scaleX(${face}) scale(1.08)`;
        }, (life || .42) * 1000);
        setTimeout(() => n.remove(), (life || .42) * 1000 + 360);
      }, delay || 0);
    };
    const wisps = (count, lift) => {
      for (let i = 0; i < count; i++) this.part({
        x: x + rnd(-size * .42, size * .42), y: y + rnd(-size * .12, size * .34),
        vx: rnd(-42, 42), vy: rnd(-(lift || 80), -18), g: -18,
        size: rnd(4, 9), col: pick([col, pale, deep]), life: rnd(.42, .82),
        shape: 'txt', char: pick(['·', '✦', '◌']), layer: 'f'
      });
    };

    if (kind === 'escape') {
      if (opt.phase === 'cast') {
        this.ring(x, y + size * .18, size * .92, col, .32);
        this.ring(x, y + size * .18, size * 1.34, deep, .54);
        wisps(14, 110);
        ghost(x - face * 14, y + 5, 1.02, .28, 0);
        ghost(x - face * 30, y + 8, .82, .38, 90);
      } else if (opt.phase === 'burst') {
        this.ring(x, y + size * .12, size * 1.02, pale, .38);
        this.ring(x, y + size * .12, size * 1.68, deep, .55);
        this.burst(x, y - 2, twisted ? 22 : 18, [col, pale, deep], {
          shape: 'streak', spMin: 65, spMax: 230, lift: 86, sMin: 3, sMax: 9, life: .72
        });
        wisps(twisted ? 16 : 13, 145);
        ghost(x, y + 2, 1.08, .18, 0);
        this.floatIcon(x, y - size * .86, 'VANISH!', pale);
      } else {
        this.ring(x, y + size * .18, size * 1.65, pale, .44);
        this.burst(x, y - 4, twisted ? 18 : 14, [col, pale, deep],
          { shape: 'streak', spMin: 65, spMax: 210, lift: 80, sMin: 3, sMax: 8, life: .65 });
        this.floatIcon(x, y - size * .82, 'BOO!', pale);
      }
      return;
    }

    if (kind === 'prank') {
      if (target && opt.phase === 'cast') {
        this.targetLine({ x, y }, target, col);
        this.ring(target.x, targetY(target), size * .52, deep, .28);
        ghost(target.x - face * 20, targetY(target) + 8, .64, .32, 80);
        ghost(x + face * 28, y + 3, .72, .34, 0);
      } else if (target) {
        const tx = target.x, ty = targetY(target);
        this.ring(tx, ty, size * .92, col, .38);
        [-1, 0, 1].forEach((n, i) => setTimeout(() => this.slash(
          tx + n * size * .18, ty - 3, { col: i === 1 ? pale : col, ang: face * (-35 + i * 35), small: i !== 1 }
        ), i * 38));
        this.burst(tx, ty, twisted ? 12 : 9, [col, pale, deep],
          { shape: 'streak', spMin: 80, spMax: 240, lift: 60, sMin: 3, sMax: 8, life: .55 });
        this.floatIcon(tx, ty - size * .78, '👁', pale);
      }
      return;
    }

    if (kind === 'drift') {
      if (opt.phase === 'cast') {
        this.aura(x, y + 8, col, opt.dur || 7);
        this.ring(x, y + size * .14, size * 1.05, col, .34);
        this.ring(x, y + size * .14, size * .72, pale, .44);
        wisps(10, 72);
        for (let i = 0; i < 3; i++) ghost(x + Math.sin(i * 2.1) * size * .35, y + 6, .52, .72, i * 90);
      } else if (opt.phase === 'end') {
        this.ring(x, y + size * .14, size * 1.18, deep, .36);
        this.burst(x, y, 8, [col, deep], { shape: 'txt', char: '◌', spMin: 35, spMax: 110, lift: 35, sMin: 5, sMax: 10, life: .5 });
      }
      return;
    }

    if (kind === 'presence') {
      this.ring(x, y + size * .18, size * 1.4, deep, .55);
      this.ring(x, y + size * .18, size * 2.15, col, .75);
      this.floatIcon(x, y - size * .82, '👻', pale);
      (opt.targets || []).slice(0, 5).forEach((t, i) => setTimeout(() => {
        if (!t || !t.alive) return;
        this.targetLine({ x, y }, t, deep);
        this.ring(t.x, targetY(t), 62 + i * 4, col, .35);
      }, i * 70));
      return;
    }

    if (kind === 'fear' && target) {
      const tx = target.x, ty = targetY(target);
      this.ring(tx, ty, 76, twisted ? '#ff7bbb' : '#c7b8ff', .32);
      this.floatIcon(tx, ty - 74, '😱', pale);
      this.part({ x: tx + rnd(-12, 12), y: ty - 24, vx: rnd(-20, 20), vy: -55,
        g: -8, size: 9, col: pale, life: .65, shape: 'txt', char: '!' });
      return;
    }

    if (kind === 'dodge') {
      ghost(x - face * 18, y + 4, .66, .35, 0);
      this.burst(x, y, 5, [col, pale], { shape: 'streak', spMin: 30, spMax: 100, lift: 36, sMin: 2, sMax: 6, life: .4 });
      return;
    }

    if (kind === 'veil') {
      this.ring(x, y + size * .16, size * 1.12, col, .46);
      this.ring(x, y + size * .16, size * 1.66, deep, .62);
      wisps(12, 92);
      (opt.allies || []).filter(a => a && a.alive && a !== opt.owner).slice(0, 5).forEach((a, i) => setTimeout(() => {
        this.targetLine({ x, y }, { x: a.x, y: a.y - 44 }, col);
        this.ring(a.x, a.y - 44, 68, pale, .32);
      }, i * 55));
      this.floatIcon(x, y - size * .86, 'VEIL', pale);
      return;
    }

    if (kind === 'phantom') {
      this.ring(x, y + size * .18, 82, col, .32);
      ghost(x + rnd(-size * .28, size * .28), y + 8, .82, .58, 0);
      this.burst(x, y, twisted ? 12 : 9, [col, pale, deep],
        { shape: 'txt', char: '✦', spMin: 45, spMax: 150, lift: 68, sMin: 3, sMax: 8, life: .62 });
      this.floatIcon(x, y - size * .8, 'PHANTOM', pale);
    }
  },

  /** Eclipse is not a generic shadow caster: she circles wounded prey,
      springs in a quick animal-like burst, then lets the moonlight collapse
      into her Blackout form. The shapes stay local and low-opacity so the
      player can follow a fast multi-hit without losing the battlefield. */
  eclipseSkill(kind, x, y, opt) {
    if (!this.front) return;
    opt = opt || {};
    const size = opt.size || 94, face = opt.face || 1, target = opt.target;
    const violet = '#8a6bff', deep = '#33204f', pale = '#eee9ff', silver = '#c9c6df';
    const targetY = t => t && (t.y - 50);
    const crescent = (cx, cy, scale, angle, life, dark) => {
      const d = size * scale;
      const n = el('i'), cut = el('i');
      n.style.cssText = `position:absolute;left:${cx - d / 2}px;top:${cy - d / 2}px;width:${d}px;height:${d}px;
        border-radius:50%;background:radial-gradient(circle at 33% 30%,${pale} 0 12%,${silver} 28%,${violet} 68%,${deep} 100%);
        pointer-events:none;z-index:7;opacity:0;transform:rotate(${angle || 0}deg) scale(.18);
        filter:drop-shadow(0 0 ${Math.max(5, d * .14)}px ${violet})`;
      cut.style.cssText = `position:absolute;left:${d * (dark ? .18 : .31)}px;top:${-d * .05}px;width:${d * .98}px;height:${d * 1.04}px;
        border-radius:50%;background:${dark ? '#140c27' : '#211535'};box-shadow:0 0 0 2px #8a6bff22`;
      n.appendChild(cut); this.front.appendChild(n);
      requestAnimationFrame(() => { n.style.transition = 'transform .18s cubic-bezier(.13,1.5,.28,1),opacity .08s';
        n.style.opacity = dark ? '.92' : '.82'; n.style.transform = `rotate(${angle || 0}deg) scale(1)`; });
      setTimeout(() => { n.style.transition = 'transform .26s ease-in,opacity .22s'; n.style.opacity = 0;
        n.style.transform = `rotate(${(angle || 0) + face * 26}deg) scale(1.32)`; }, (life || .34) * 1000);
      setTimeout(() => n.remove(), (life || .34) * 1000 + 320);
    };
    const shadow = (sx, sy, dx, dy, delay, scale) => {
      setTimeout(() => {
        const n = el('i'), w = size * (scale || .84), h = w * .32;
        const ang = Math.atan2(dy, dx), len = Math.max(w, Math.hypot(dx, dy));
        n.style.cssText = `position:absolute;left:${sx}px;top:${sy - h / 2}px;width:${len}px;height:${h}px;border-radius:50%;
          background:linear-gradient(90deg,${deep}00 0%,${violet}66 32%,${pale}aa 66%,${violet}00 100%);
          pointer-events:none;z-index:5;opacity:0;transform-origin:0 50%;transform:rotate(${ang}rad) scaleX(.08);filter:blur(1px)`;
        this.back.appendChild(n);
        requestAnimationFrame(() => { n.style.transition = 'transform .16s ease-out,opacity .07s'; n.style.opacity = .8;
          n.style.transform = `rotate(${ang}rad) scaleX(1)`; });
        setTimeout(() => { n.style.transition = 'opacity .2s'; n.style.opacity = 0; }, 160);
        setTimeout(() => n.remove(), 400);
      }, delay || 0);
    };
    const claw = (t, idx, big) => {
      if (!t) return;
      const tx = t.x, ty = targetY(t), a = face * (-36 + idx * 32);
      this.slash(tx + face * (idx - 1) * size * .09, ty, { col: idx === 1 ? pale : violet, ang: a, small: !big });
      this.ring(tx, ty, size * (big ? .74 : .42), idx === 1 ? pale : violet, big ? .34 : .20);
    };

    if (kind === 'basic') {
      if (target) claw(target, opt.blackout ? 1 : 0, !!opt.blackout);
      return;
    }
    if (kind === 'hunt') {
      this.aura(x, y, violet, .65);
      this.ring(x, y + size * .18, size * .70, silver, .24);
      if (target) {
        const ty = targetY(target);
        shadow(x + face * size * .18, y - size * .13, target.x - x - face * 12, ty - y, 25, 1);
        crescent(target.x - face * size * .16, ty - size * .10, .38, face * -20, .30);
      }
      return;
    }
    if (kind === 'rake') { claw(target, opt.index || 0, false); return; }
    if (kind === 'rush') {
      this.ring(x, y + size * .18, size * .72, violet, .22);
      if (target) shadow(x + face * size * .20, y - size * .16, target.x - x - face * 12, targetY(target) - y, 0, 1.15);
      return;
    }
    if (kind === 'pounce') {
      if (target) {
        const ty = targetY(target);
        crescent(target.x - face * size * .12, ty - size * .10, .66, face * -42, .40);
        claw(target, 1, true);
        this.burst(target.x, ty, 11, [violet, pale, deep], { shape: 'streak', spMin: 80, spMax: 220, lift: 72, sMin: 3, sMax: 8, life: .54 });
      }
      return;
    }
    if (kind === 'swipe') {
      if (target) claw(target, opt.index || 0, (opt.index || 0) === 2);
      return;
    }
    if (kind === 'blackout') {
      this.tint('#130a26', .12, .86);
      this.aura(x, y, violet, Math.max(.9, opt.dur || 2.4));
      this.ring(x, y + size * .20, size * .92, silver, .28);
      this.ring(x, y + size * .20, size * 1.44, violet, .50);
      crescent(x + face * size * .12, y - size * .42, .78, face * -18, .64, true);
      this.burst(x, y - size * .24, 15, [violet, silver, deep], { shape: 'streak', spMin: 45, spMax: 190, lift: 100, sMin: 3, sMax: 9, life: .72 });
      this.floatIcon(x, y - size * .96, 'BLACKOUT', pale);
      return;
    }
    if (kind === 'return') {
      this.ring(x, y + size * .18, size * 1.10, silver, .34);
      this.burst(x, y - size * .22, 8, [silver, violet], { shape: 'dot', spMin: 35, spMax: 120, lift: 54, sMin: 3, sMax: 7, life: .48 });
    }
  },

  /** Yatta performs like a firecracker that learned choreography yesterday:
      every beat has a bounce, a streamer, or a too-big landing. These use her
      Party Popper art and readable confetti lanes rather than a generic magic
      overlay, while keeping the particles sparse enough for her rapid combo. */
  yattaSkill(kind, x, y, opt) {
    if (!this.front) return;
    opt = opt || {};
    const size = opt.size || 92, face = opt.face || 1, target = opt.target;
    const gold = '#ffd166', pink = '#ff8fb0', aqua = '#6fe3c4', purple = '#9b7bff', cream = '#fff4c9';
    const colors = [gold, pink, aqua, purple, cream];
    const targetY = t => t && (t.y - 48);
    const streamer = (sx, sy, dir, delay, wide) => {
      setTimeout(() => {
        const n = el('i'), len = size * (wide ? 1.42 : .90), h = Math.max(4, size * .055);
        n.style.cssText = `position:absolute;left:${sx}px;top:${sy}px;width:${len}px;height:${h}px;border-radius:99px;
          background:linear-gradient(90deg,${cream},${pick(colors)},transparent);pointer-events:none;z-index:8;opacity:0;
          transform-origin:0 50%;transform:rotate(${dir * rnd(-46,46)}deg) scaleX(.08);filter:drop-shadow(0 1px 1px #4f274488)`;
        this.front.appendChild(n);
        requestAnimationFrame(() => { n.style.transition = 'transform .18s cubic-bezier(.12,1.35,.3,1),opacity .08s';
          n.style.opacity = .9; n.style.transform = `rotate(${dir * rnd(-46,46)}deg) scaleX(1)`; });
        setTimeout(() => { n.style.transition = 'transform .26s ease-in,opacity .22s'; n.style.opacity = 0; n.style.transform += ' scaleX(.65)'; }, 180);
        setTimeout(() => n.remove(), 480);
      }, delay || 0);
    };
    const pop = (cx, cy, amount, scale) => {
      const n = amount || 8;
      for (let i = 0; i < n; i++) this.part({
        x: cx + rnd(-size * .13, size * .13), y: cy + rnd(-size * .14, size * .08),
        vx: rnd(-120, 120) * (scale || 1), vy: rnd(-165, -55) * (scale || 1), g: 370,
        size: rnd(3, 8) * (scale || 1), col: pick(colors), life: rnd(.42, .78),
        shape: i % 3 === 0 ? 'streak' : 'sq', spin: rnd(-12, 12), layer: i % 2 ? 'f' : 'b'
      });
    };
    const impact = (t, index, big) => {
      if (!t) return;
      const tx = t.x, ty = targetY(t), s = big ? 1.25 : .78;
      this.ring(tx, ty, size * s, big ? gold : pink, big ? .38 : .22);
      this.slash(tx + face * size * .08, ty, { col: index % 2 ? gold : cream, ang: face * (-32 + (index || 0) * 22), small: !big });
      streamer(tx - face * size * .10, ty - size * .12, face, 0, big);
      pop(tx, ty, big ? 16 : 5, big ? 1.12 : .72);
    };

    if (kind === 'basic') {
      impact(target, opt.index || 0, !!opt.celebration);
      return;
    }
    if (kind === 'party') {
      this.castProp(x + face * size * .16, y + size * .14, { kind: 'item', img: 'Trinkets/YATTA_PartyPopper', size: 52 }, gold, .48);
      this.ring(x, y + size * .17, size * .78, gold, .28);
      [0, 1, 2, 3].forEach(i => streamer(x + face * size * .12, y - size * .22, face, i * 42, true));
      pop(x + face * size * .18, y - size * .20, 11, .86);
      return;
    }
    if (kind === 'partyHit') { impact(target, opt.index || 0, (opt.index || 0) === (opt.last || 7)); return; }
    if (kind === 'crashStart') {
      this.ring(x, y + size * .20, size * .62, aqua, .20);
      this.ring(x, y + size * .20, size * .94, pink, .32);
      streamer(x, y - size * .18, face, 0, false);
      return;
    }
    if (kind === 'crash') {
      impact(target, opt.chain || 0, true);
      if (target) {
        this.boom(target.x, targetY(target), 1.0 + (opt.chain || 0) * .14, pink);
        this.floatIcon(target.x, targetY(target) - size * .72, opt.low ? 'JACKPOT!' : 'CRASH!', gold);
      }
      return;
    }
    if (kind === 'spring') {
      this.aura(x, y, pink, Math.max(1, opt.dur || 3));
      this.ring(x, y + size * .20, size * .86, aqua, .34);
      this.ring(x, y + size * .20, size * 1.32, pink, .52);
      pop(x, y - size * .25, 10, .78);
      this.floatIcon(x, y - size * .92, 'BOING!', cream);
      return;
    }
    if (kind === 'finish') {
      this.ring(x, y - size * .10, size * 1.48, gold, .44);
      this.burst(x, y - size * .16, 22, colors, { shape: 'paper', spMin: 75, spMax: 280, lift: 130, sMin: 4, sMax: 11, life: .84, g: 410 });
      [0, 1, 2, 3, 4].forEach(i => streamer(x, y - size * .16, i % 2 ? 1 : -1, i * 28, true));
      this.floatIcon(x, y - size * 1.02, 'BIG FINISH!', gold);
    }
  },

  poppySignature(phase, x, y, opt) {
    if (!this.front) return;
    opt = opt || {};
    const size = opt.size || 90;
    this.ring(x, y, phase === 'cast' ? size * .82 : size * 1.08, '#ffb6df', .34);
    for (let i = 0; i < (opt.ultimate ? 9 : 6); i++) {
      const bubble = el('i');
      const d = rnd(size * .10, size * .25), a = rnd(0, Math.PI * 2), r = rnd(size * .18, size * .52);
      bubble.style.cssText = `position:absolute;left:${x + Math.cos(a) * r - d / 2}px;top:${y + Math.sin(a) * r - d / 2}px;
        width:${d}px;height:${d}px;border-radius:50%;border:2px solid #ffe8f6;
        background:radial-gradient(circle at 31% 27%,#fff 0 7%,#ffb6df66 10% 34%,#80ddf355 70%,transparent 74%);
        box-shadow:inset -2px -3px 5px #f38fc366;opacity:0;pointer-events:none;transform:scale(.35)`;
      this.front.appendChild(bubble);
      requestAnimationFrame(() => {
        bubble.style.transition = `transform ${rnd(.32, .48)}s cubic-bezier(.16,1.4,.3,1),opacity .12s`;
        bubble.style.opacity = .92; bubble.style.transform = `translate(${rnd(-10, 10)}px,${rnd(-28, -12)}px) scale(1)`;
      });
      setTimeout(() => { bubble.style.transition = 'transform .28s ease-in,opacity .2s';
        bubble.style.transform += ' scale(1.45)'; bubble.style.opacity = 0; }, 330 + i * 18);
      setTimeout(() => bubble.remove(), 680 + i * 18);
    }
  },

  scrapsSignature(phase, x, y, opt) {
    if (!this.front) return;
    opt = opt || {};
    const size = opt.size || 92;
    const craft = opt.craft || 'cardboard';
    const color = { cardboard: '#e9b86d', cup: '#ff80a7', yarn: '#ce78b4' }[craft] || '#ffd166';
    if (opt.key === 'W') {
      if (phase === 'cast') {
        // Her real grapple travels to a friend. A stitched thread makes that
        // path readable before the dash, then the landing supplies the impact.
        const tx = opt.targetX, ty = opt.targetY;
        if (Number.isFinite(tx) && Number.isFinite(ty)) {
          const dx = tx - x, dy = ty - y, length = Math.hypot(dx, dy);
          if (length > 20 && this.effectAllowed(2)) {
            const thread = el('div');
            const angle = Math.atan2(dy, dx);
            thread.style.cssText = `position:absolute;left:${x}px;top:${y}px;width:${length}px;height:0;
              border-top:4px dashed #e75591;transform-origin:0 50%;transform:rotate(${angle}rad) scaleX(.08);
              filter:drop-shadow(0 1px 1px #421b2d) drop-shadow(0 0 5px #ffb1cc);
              opacity:0;pointer-events:none;z-index:6`;
            this.front.appendChild(thread);
            requestAnimationFrame(() => { thread.style.transition = 'transform .28s ease-out,opacity .1s';
              thread.style.opacity = 1; thread.style.transform = `rotate(${angle}rad) scaleX(1)`; });
            setTimeout(() => { thread.style.transition = 'opacity .18s'; thread.style.opacity = 0; }, 360);
            setTimeout(() => thread.remove(), 570);
          }
        }
        this.ring(x, y + size * .18, size * .95, '#e75591', .35);
        this.floatIcon(x, y - size * .55, '🧶', '#ffbed3');
      } else {
        this.ring(x, y + size * .22, size * 1.12, '#e75591', .3);
        this.burst(x, y, 5, ['#fff2c8', '#ff9fbb'], { shape: 'paper', spMax: 105, life: .35 });
      }
      return;
    }
    if (opt.key === 'B') {
      this.ring(x, y + size * .20, size * (phase === 'cast' ? 1.35 : 1.08), '#ffd166', .4);
      this.burst(x, y, phase === 'cast' ? 12 : 9, ['#ff8eae', '#f5d17b', '#fff0cf'],
        { shape: 'paper', spMin: 70, spMax: 195, lift: 70, sMin: 4, sMax: 11, life: .62, g: 440 });
      if (phase === 'impact') this.slash(x, y, { col: '#fff0cf', ang: -22, big: true });
      return;
    }
    if (phase === 'cast') {
      const prop = craft === 'cardboard' ? { kind: 'obj', img: 'cardboard', size: 52 }
        : craft === 'cup' ? { kind: 'item', img: 'Stein', size: 48 } : null;
      if (prop) this.castProp(x, y + size * .18, prop, color, .38);
      else this.floatIcon(x, y - size * .42, '🧶', color);
      this.ring(x, y + size * .24, size * 1.12, color, .34);
      this.burst(x, y, 7, [color, '#fff1c8'],
        { shape: 'paper', spMin: 40, spMax: 125, lift: 55, sMin: 4, sMax: 9, life: .48 });
      return;
    }
    if (craft === 'cardboard') {
      [-20, 0, 20].forEach((offset, i) => setTimeout(() => this.slash(x + offset, y,
        { col: i === 1 ? '#fff1c2' : color, ang: -25 + i * 24, small: true }), i * 30));
    } else if (craft === 'cup') {
      this.ring(x, y + size * .15, size * 1.25, color, .33);
    } else {
      this.floatIcon(x, y - size * .30, '🧶', color);
      this.ring(x, y + size * .15, size, color, .33);
    }
    this.burst(x, y, 8, [color, '#fff1c8'],
      { shape: 'paper', spMin: 75, spMax: 180, lift: 55, sMin: 4, sMax: 10, life: .55 });
  },

  scrapsCircle(x, y, radius, craft, powered) {
    if (!this.back || this.reducedEffects || !this.effectAllowed(2)) return;
    const color = { cardboard: '#e9b86d', cup: '#ff80a7', yarn: '#ce78b4' }[craft] || '#ffd166';
    const width = Math.max(140, Math.min(650, radius * 2));
    const height = width * .44;
    const token = { cardboard: '📦', cup: '🥤', yarn: '🧶' }[craft] || '✂️';
    const ring = el('div');
    ring.style.cssText = `position:absolute;left:${x - width / 2}px;top:${y - height / 2}px;
      width:${width}px;height:${height}px;border:3px dashed ${color};border-radius:50%;
      background:radial-gradient(ellipse,${color}26 0 28%,${color}10 55%,transparent 72%);
      box-shadow:inset 0 0 16px ${color}77,0 0 ${powered ? 22 : 10}px ${color}88;
      pointer-events:none;opacity:0;transform:scale(.72);z-index:1`;
    // Counter-rotating stitched inner rim: reads as a sewn pattern, not a flat ring.
    const inner = el('div');
    inner.style.cssText = `position:absolute;left:12%;top:12%;width:76%;height:76%;border-radius:50%;
      border:2px dotted #fff1c8;opacity:${powered ? .85 : .5};pointer-events:none`;
    ring.appendChild(inner);
    if (powered) {
      const rim = el('div');
      rim.style.cssText = `position:absolute;left:-6px;top:-6px;right:-6px;bottom:-6px;border-radius:50%;
        border:2px solid ${color}cc;box-shadow:0 0 14px ${color};pointer-events:none`;
      ring.appendChild(rim);
    }
    // Craft tokens drift around the rim like pinned paper scraps.
    const tokens = [];
    const count = powered ? 4 : 3;
    for (let i = 0; i < count; i++) {
      const t = el('div');
      const a = (i / count) * Math.PI * 2 + Math.random() * .4;
      t.textContent = token;
      t.style.cssText = `position:absolute;left:${50 + Math.cos(a) * 48}%;top:${50 + Math.sin(a) * 48}%;
        font-size:${powered ? 20 : 16}px;line-height:1;transform:translate(-50%,-50%) rotate(${i * 40}deg);
        filter:drop-shadow(0 2px 2px #0008);pointer-events:none`;
      ring.appendChild(t); tokens.push(t);
    }
    this.back.appendChild(ring);
    if (inner.animate) inner.animate([{ transform: 'rotate(0deg)' }, { transform: 'rotate(-120deg)' }],
      { duration: 1150, easing: 'linear', fill: 'forwards' });
    if (ring.animate) ring.animate([{ transform: 'scale(1) rotate(0deg)' }, { transform: 'scale(1.03) rotate(6deg)' }],
      { duration: 1150, easing: 'ease-out', fill: 'forwards', delay: 420 });
    tokens.forEach((t, i) => { if (t.animate) t.animate([{ offset: 0, opacity: 0, transform: t.style.transform + ' scale(.4)' },
      { offset: .25, opacity: 1 }, { offset: 1, opacity: 0, transform: t.style.transform + ' translateY(-14px) scale(1.05)' }],
      { duration: 1000, delay: i * 70, fill: 'forwards' }); });
    requestAnimationFrame(() => { ring.style.transition = 'transform .42s cubic-bezier(.18,.8,.3,1),opacity .15s';
      ring.style.opacity = powered ? .95 : .66; ring.style.transform = 'scale(1)'; });
    setTimeout(() => { ring.style.transition = 'opacity .3s'; ring.style.opacity = 0; }, 850);
    setTimeout(() => ring.remove(), 1200);
  },

  /** Paper-shard explosion for Every Piece Counts when a foe falls inside the circle. */
  scrapsShards(x, y, radius) {
    if (!this.front || this.reducedEffects || !this.effectAllowed(3)) return;
    const r = Math.max(60, Math.min(220, radius || 120));
    this.ring(x, y, r * 1.6, '#fff1c8', .28);
    this.burst(x, y - 30, 16, ['#e9b86d', '#ff9fbb', '#fff1c8', '#ce78b4'],
      { shape: 'paper', spMin: 110, spMax: 300, lift: 90, sMin: 5, sMax: 12, life: .8, g: 520 });
    [-1, 1].forEach((d, i) => setTimeout(() => this.slash(x + d * 26, y - 28,
      { col: i ? '#ff9fbb' : '#fff1c8', ang: d * 38, small: true }), i * 45));
  },

  /** Quick craft-change flourish so G's new weapon is readable at a glance. */
  scrapsCraftSwap(x, y, craft) {
    if (!this.front || this.reducedEffects || !this.effectAllowed(2)) return;
    const color = { cardboard: '#e9b86d', cup: '#ff80a7', yarn: '#ce78b4' }[craft] || '#ffd166';
    this.ring(x, y + 12, 96, color, .3);
    this.burst(x, y - 40, 9, [color, '#fff1c8'],
      { shape: 'paper', spMin: 50, spMax: 140, lift: 70, sMin: 4, sMax: 9, life: .55 });
  },

  cocoaSignature(phase, x, y, opt) {
    if (!this.front) return;
    opt = opt || {};
    const size = opt.size || 92, count = opt.ultimate ? 5 : 3;
    if (phase === 'cast') {
      // BonBons orbit Cocoa in a gentle hand-off arc with real item art instead
      // of a generic haste glyph.
      for (let i = 0; i < count; i++) {
        const bon = el('div'); const s = size * (i % 2 ? .29 : .25);
        bon.style.cssText = `position:absolute;left:${x - s / 2}px;top:${y - s / 2}px;width:${s}px;height:${s}px;
          pointer-events:none;opacity:0;z-index:7;transform:translate(0,12px) rotate(-35deg) scale(.25);
          filter:drop-shadow(0 3px 2px #2b130faa)`;
        bon.innerHTML = `<img src="${Art.item('Bonbon')}" style="width:100%;height:100%;object-fit:contain">`;
        this.front.appendChild(bon);
        const a = -Math.PI * .92 + i * (Math.PI * 1.05 / Math.max(1, count - 1));
        setTimeout(() => {
          bon.style.transition = 'transform .34s cubic-bezier(.15,1.45,.35,1),opacity .12s'; bon.style.opacity = 1;
          bon.style.transform = `translate(${Math.cos(a) * size * .62}px,${Math.sin(a) * size * .46}px) rotate(${i * 55}deg) scale(1)`;
        }, i * 35);
        setTimeout(() => { bon.style.transition = 'transform .28s ease-in,opacity .22s'; bon.style.opacity = 0;
          bon.style.transform = `translate(${Math.cos(a) * size * .2}px,${-size * .72}px) rotate(${i * 90 + 80}deg) scale(.65)`; }, 360 + i * 28);
        setTimeout(() => bon.remove(), 760);
      }
      this.ring(x, y + size * .24, size * 1.15, '#c98a5a', .5);
      return;
    }

    // The delivery lands as a chocolate seal with candy crumbs, warm and
    // readable without a bright screen flash.
    const seal = el('div');
    seal.style.cssText = `position:absolute;left:${x - size * .46}px;top:${y - size * .23}px;width:${size * .92}px;height:${size * .46}px;
      border-radius:50%;background:radial-gradient(ellipse,#f3c795 0 14%,#9b532f 18% 43%,#542719 47% 58%,transparent 62%);
      pointer-events:none;opacity:0;transform:scale(.2);filter:drop-shadow(0 3px 2px #0008)`;
    this.front.appendChild(seal);
    requestAnimationFrame(() => { seal.style.transition = 'transform .2s cubic-bezier(.12,1.55,.3,1),opacity .1s';
      seal.style.opacity = .92; seal.style.transform = 'scale(1)'; });
    setTimeout(() => { seal.style.transition = 'transform .34s,opacity .32s'; seal.style.transform = 'scale(1.18)'; seal.style.opacity = 0; }, 260);
    setTimeout(() => seal.remove(), 680);
    this.burst(x, y, opt.ultimate ? 16 : 9, ['#5b2c1d', '#a9653d', '#e8b98a'],
      { shape: 'dot', spMin: 70, spMax: 220, lift: 80, sMin: 4, sMax: 10, life: .7, g: 470 });
    this.sparkle(x, y - size * .18, opt.ultimate ? 8 : 5, '#f3c795');
  },

  /** Soft rising steam wisps: the signature of food that was just made. */
  sproutSteam(x, y, n, col) {
    if (!this.front || this.reducedEffects || !this.effectAllowed(2)) return;
    for (let i = 0; i < (n || 4); i++) setTimeout(() => this.part({
      x: x + (Math.random() - .5) * 26, y, vx: (Math.random() - .5) * 18, vy: -(44 + Math.random() * 40),
      g: -12, drag: .65, size: 11 + Math.random() * 9, col: col || '#fff2dc', shape: 'dot',
      alpha: .6, life: .95 + Math.random() * .4, scale: .6, dscale: 1.15 }), i * 55);
  },

  /** Little hearts that float up off a freshly healed ally. */
  sproutHearts(x, y, n) {
    if (!this.front || this.reducedEffects || !this.effectAllowed(2)) return;
    for (let i = 0; i < (n || 3); i++) setTimeout(() => this.part({
      x: x + (Math.random() - .5) * 34, y, vx: (Math.random() - .5) * 36, vy: -(55 + Math.random() * 45),
      g: -18, drag: .55, size: 13 + Math.random() * 6, col: i % 2 ? '#ff758f' : '#ffd166', shape: 'txt',
      char: i % 3 ? '♥' : '✦', life: .95 + Math.random() * .3, spin: (Math.random() - .5) * 40 }), i * 75);
  },

  /** Fresh mint strawberry sprout leaves fluttering up during heals & saves. */
  sproutLeaves(x, y, n, opt) {
    if (!this.front || this.reducedEffects || !this.effectAllowed(2)) return;
    opt = opt || {};
    const cols = ['#80ed99', '#57cc99', '#b7efc5', '#70e000'];
    const chars = ['🌱', '🍃', '☘️', '✦'];
    for (let i = 0; i < (n || 4); i++) setTimeout(() => this.part({
      x: x + (Math.random() - .5) * (opt.spread || 32),
      y: y + (Math.random() - .5) * 12,
      vx: (Math.random() - .5) * (opt.sp || 50),
      vy: -(opt.lift || 48) - Math.random() * 32,
      g: 35, drag: 1.1, size: 12 + Math.random() * 6,
      col: cols[i % cols.length], shape: 'txt',
      char: chars[i % chars.length],
      life: .9 + Math.random() * .4,
      spin: (Math.random() - .5) * 160
    }), i * 60);
  },

  /** Golden protective dome with strawberry vine shimmer that settles over the person Sprout is saving. */
  sproutDome(x, y, radius, dur) {
    if (!this.front || this.reducedEffects || !this.effectAllowed(3)) return;
    const w = radius * 1.8, h = radius * 1.45;
    const n = el('div');
    n.style.cssText = `position:absolute;left:${x - w / 2}px;top:${y - h * .85}px;width:${w}px;height:${h}px;
      border-radius:50% 50% 46% 46%;border:3.5px solid #ffd166dd;pointer-events:none;opacity:0;z-index:5;
      background:radial-gradient(ellipse at 50% 38%,#fff8e777 0 25%,#ffd16633 55%,transparent 75%);
      box-shadow:0 0 32px #f4a261dd, 0 0 16px #80ed99aa, inset 0 0 26px #fff2cf88;transform:scale(.35);transform-origin:50% 90%`;
    this.front.appendChild(n);
    requestAnimationFrame(() => {
      n.style.transition = 'transform .38s cubic-bezier(.15,1.5,.35,1),opacity .18s';
      n.style.opacity = .98;
      n.style.transform = 'scale(1)';
    });
    setTimeout(() => {
      n.style.transition = 'opacity .45s,transform .45s';
      n.style.opacity = 0;
      n.style.transform = 'scale(1.15)';
    }, Math.max(300, (dur || 1.2) * 1000 - 450));
    setTimeout(() => n.remove(), (dur || 1.2) * 1000 + 100);
  },

  /** Sprout's combat language is delivery and protection: recognizable food
      leaves his hands, allies get a warm tether, and the emergency save forms
      a barrier around the person he protects. Keep these beats local so his
      healer kit does not look like a generic green magic spell. */
  sproutSkill(kind, x, y, opt) {
    if (!this.front) return;
    opt = opt || {};
    const col = '#f4a261', target = opt.target, targets = opt.targets || [];
    const face = opt.face || 1;
    const food = opt.food || (kind === 'delivery' ? 'Bread' : 'Brownie');
    const mark = (t, size) => {
      if (!t) return;
      this.ring(t.x, t.y - 34, size || 78, col, .35);
      this.sparkle(t.x, t.y - 58, opt.ultimate ? 12 : 7, '#ffd7a0');
      this.sproutHearts(t.x, t.y - 60, opt.ultimate ? 6 : 4);
      this.sproutLeaves(t.x, t.y - 56, opt.ultimate ? 5 : 3);
    };
    // Crumbs shed along the flight of a thrown treat.
    const crumbTrail = (x1, y1, x2, y2, dur) => {
      for (let i = 1; i <= 4; i++) setTimeout(() => this.burst(x1 + (x2 - x1) * i / 5, y1 + (y2 - y1) * i / 5 - 30 * Math.sin(i / 5 * Math.PI), 2,
        ['#ffd7a0', '#e9b97c', '#fff2cf'], { spMin: 10, spMax: 45, lift: 10, sMin: 2, sMax: 4, life: .4, g: 260 }), dur * 1000 * i / 5);
    };
    if (kind === 'bake' || kind === 'delivery') {
      this.castProp(x + face * 18, y, { kind: 'item', img: food, size: 48 }, col, .38);
      this.sproutSteam(x + face * 18, y - 70, kind === 'bake' ? 5 : 3);
      this.sproutLeaves(x + face * 18, y - 60, 3);
      if (target) {
        this.itemArc(x + face * 24, y - 62, target.x, target.y - 62, food,
          { size: 28, dur: .40, arc: 54, col, spin: 260 });
        crumbTrail(x + face * 24, y - 62, target.x, target.y - 62, .40);
        setTimeout(() => {
          mark(target, 84);
          this.sproutSteam(target.x, target.y - 60, 3);
          this.floatItem(target.x, target.y - 88, food, col);
        }, 380);
      } else {
        this.ring(x, y - 34, 70, col, .28);
      }
      return;
    }
    if (kind === 'rush') {
      this.ring(x, y - 28, 68, col, .28);
      this.sproutLeaves(x, y - 40, 4);
      if (target) {
        this.heartLink(x + face * 20, y - 52, target.x, target.y - 54);
        // Hurried dust puffs, crumbs, and mint leaves chase the dash path.
        for (let i = 0; i < 4; i++) setTimeout(() => {
          this.burst(x + (target.x - x) * (i + 1) / 5, y - 6, 3, ['#ffe6c2', '#fff2cf', '#ffd166'],
            { spMin: 20, spMax: 70, lift: 25, sMin: 3, sMax: 6, life: .4, g: 220 });
          this.sproutHearts(x + (target.x - x) * (i + 1) / 5, y - 50, 1);
          this.sproutLeaves(x + (target.x - x) * (i + 1) / 5, y - 44, 1);
        }, i * 70);
        setTimeout(() => {
          if (target.alive) {
            mark(target, 110);
            this.ring(target.x, target.y - 32, 115, '#ffd166', .45);
            this.sproutDome(target.x, target.y, 64, .9);
            this.aura(target.x, target.y, col, 4.8);
            this.sproutSteam(target.x, target.y - 60, 4);
            this.floatItem(target.x, target.y - 92, 'Proteinbar', '#ffd166');
          }
        }, 360);
      }
      this.burst(x, y - 35, 8, ['#f4a261', '#ffd7a0', '#fff2cf'],
        { spMin: 40, spMax: 130, lift: 45, sMin: 3, sMax: 7, life: .5, g: 330 });
      return;
    }
    if (kind === 'oven') {
      this.ring(x, y - 30, 118, '#ff9f43', .45);
      this.sproutSteam(x + face * 14, y - 62, 8, '#ffe9cc');
      this.sproutLeaves(x + face * 14, y - 55, 5);
      this.burst(x + face * 14, y - 48, 12, ['#ffbf69', '#ff9f43', '#fff2cf', '#ff758f'],
        { spMin: 35, spMax: 130, lift: 75, sMin: 3, sMax: 7, life: .55, g: 240 });
      targets.slice(0, 2).forEach((t, i) => {
        setTimeout(() => {
          if (!t || !t.alive) return;
          const treatItem = i ? 'Brownie' : 'Bread';
          this.itemArc(x + face * 18, y - 62, t.x, t.y - 62, treatItem,
            { size: 26, dur: .42, arc: 70 - i * 12, col, spin: i ? -280 : 280 });
          crumbTrail(x + face * 18, y - 62, t.x, t.y - 62, .42);
          setTimeout(() => {
            mark(t, 82);
            this.sproutSteam(t.x, t.y - 60, 4);
            this.floatItem(t.x, t.y - 88, treatItem, col);
          }, 390);
        }, i * 150);
      });
      this.castProp(x + face * 18, y, { kind: 'item', img: food, size: 50 }, col, .52);
      return;
    }
    if (kind === 'batch') {
      // Wave-start Fresh Batch: a warm kitchen pulse that reaches every ally.
      this.ring(x, y - 42, 160, col, .5);
      this.ring(x, y - 42, 280, '#ffd7a0', .65);
      this.ring(x, y - 42, 360, '#ff758f', .7);
      this.sproutSteam(x, y - 70, 8, '#fff2dc');
      this.sproutLeaves(x, y - 60, 8);
      targets.filter(t => t && t.alive).forEach((t, i) => setTimeout(() => {
        this.ring(t.x, t.y - 34, 76, col, .35);
        this.sproutHearts(t.x, t.y - 56, 3);
        this.sproutLeaves(t.x, t.y - 56, 3);
        this.sparkle(t.x, t.y - 56, 5, '#ffd7a0');
        this.floatItem(t.x, t.y - 82, 'Bread', '#ffd166');
      }, 120 + i * 70));
      return;
    }
    if (kind === 'save') {
      if (target) {
        this.flash('#ffb3c1', .25, .3);
        this.ring(target.x, target.y - 30, opt.ultimate ? 180 : 140, '#ffd166', .6);
        this.ring(target.x, target.y - 30, opt.ultimate ? 270 : 200, '#fff2cf', .75);
        this.aura(target.x, target.y, '#f4a261', 1.4);
        this.heartLink(x + face * 18, y - 62, target.x, target.y - 62);
        this.sproutDome(target.x, target.y, opt.ultimate ? 104 : 82, 1.4);
        this.burst(target.x, target.y - 38, opt.ultimate ? 22 : 14,
          ['#f4a261', '#ffd166', '#fff2cf', '#ff758f', '#80ed99'],
          { spMin: 90, spMax: 280, lift: 95, sMin: 4, sMax: 10, life: .8, g: 420 });
        this.sproutHearts(target.x, target.y - 70, opt.ultimate ? 9 : 6);
        this.sproutLeaves(target.x, target.y - 65, opt.ultimate ? 8 : 5);
        this.sproutSteam(target.x, target.y - 50, 6, '#fff7e6');
        this.floatItem(target.x, target.y - 105, 'Trinkets/SPROUT_SavoryCharm', '#ffd166');
        this.shake(3.5, .2);
      }
      targets.filter(t => t && t !== target && t.alive).forEach((t, i) =>
        setTimeout(() => mark(t, 72), 170 + i * 50));
    }
  },

  /** Astro's celestial drifting stardust motes and crescent moon particles. */
  astroStardust(x, y, n, col, opt) {
    if (!this.front || this.reducedEffects || !this.effectAllowed(2)) return;
    opt = opt || {};
    const cols = col ? [col] : ['#b9a4ff', '#dcd0ff', '#8f7fff', '#ffffff', '#ffd166'];
    const glyphs = ['✦', '✧', '⭐', '🌙', '·'];
    for (let i = 0; i < (n || 5); i++) setTimeout(() => {
      const a = (opt.dir != null ? opt.dir : Math.random() * Math.PI * 2) + (Math.random() - .5) * (opt.spread || 2.5);
      const sp = (opt.spMin || 35) + Math.random() * ((opt.spMax || 110) - (opt.spMin || 35));
      this.part({
        x: x + (Math.random() - .5) * (opt.jitter || 24),
        y: y + (Math.random() - .5) * (opt.jitter || 16),
        vx: Math.cos(a) * sp,
        vy: Math.sin(a) * sp - (opt.lift == null ? 35 : opt.lift),
        g: opt.g != null ? opt.g : 40,
        drag: 1.15,
        size: 11 + Math.random() * 8,
        col: cols[i % cols.length],
        shape: 'txt',
        char: glyphs[i % glyphs.length],
        life: .9 + Math.random() * .4,
        spin: (Math.random() - .5) * 140
      });
    }, i * 45);
  },

  /** Drowsy / sleep status: soft sleepy glyphs and lavender dream mist circling head. */
  astroDrowsy(target) {
    if (!target || !this.front || this.reducedEffects || !this.effectAllowed(2)) return;
    const glyphs = ['💤', '🌙', '💤', '✦'];
    for (let i = 0; i < 4; i++) {
      const a = (i / 4) * Math.PI * 2;
      this.part({
        x: target.x + Math.cos(a) * 22,
        y: target.y - 92 + Math.sin(a) * 8,
        vx: -Math.sin(a) * 75,
        vy: Math.cos(a) * 20 - 15,
        g: 10,
        drag: 1.25,
        size: 13,
        col: '#dcd0ff',
        shape: 'txt',
        char: glyphs[i],
        life: .95,
        fade: true
      });
    }
  },

  /** Lunar crescent barrier shield that encases Astro or his protected allies. */
  astroMoonShield(x, y, radius, dur) {
    if (!this.front || this.reducedEffects || !this.effectAllowed(3)) return;
    const w = radius * 1.7, h = radius * 1.5;
    const n = el('div');
    n.style.cssText = `position:absolute;left:${x - w / 2}px;top:${y - h * .82}px;width:${w}px;height:${h}px;
      border-radius:50%;border:3px dashed #b9a4ffcc;pointer-events:none;opacity:0;z-index:5;
      background:radial-gradient(ellipse at 42% 38%,#f3eaff66 0 25%,#7c4dff26 60%,transparent 76%);
      box-shadow:0 0 28px #7c4dffcc,inset 0 0 20px #b9a4ff88;transform:scale(.35);transform-origin:50% 85%`;
    this.front.appendChild(n);
    requestAnimationFrame(() => {
      n.style.transition = 'transform .36s cubic-bezier(.15,1.5,.35,1),opacity .18s';
      n.style.opacity = .95;
      n.style.transform = 'scale(1)';
    });
    setTimeout(() => {
      n.style.transition = 'opacity .45s,transform .45s';
      n.style.opacity = 0;
      n.style.transform = 'scale(1.15)';
    }, Math.max(300, (dur || 1.2) * 1000 - 450));
    setTimeout(() => n.remove(), (dur || 1.2) * 1000 + 100);
  },

  /** Falling shooting star diving from the night sky with stardust streak and impact burst. */
  starfall(x, y, opt) {
    if (!this.front || this.reducedEffects) return;
    opt = opt || {};
    const col = opt.col || '#b9a4ff';
    const sx = x - 55 + (Math.random() - .5) * 20;
    const sy = y - 240;
    const n = el('div');
    n.style.cssText = `position:absolute;left:${sx}px;top:${sy}px;width:6px;height:52px;
      border-radius:99px;background:linear-gradient(180deg,#ffffff,#ffd166 40%,${col});
      box-shadow:0 0 16px ${col},0 0 8px #ffffff;transform:rotate(24deg);transform-origin:50% 0;
      pointer-events:none;opacity:0;transition:transform .26s cubic-bezier(.2,.8,.4,1),opacity .08s;z-index:6;`;
    this.front.appendChild(n);
    requestAnimationFrame(() => {
      n.style.opacity = 1;
      n.style.transform = `translate(${x - sx}px,${y - sy - 40}px) rotate(24deg) scaleY(1.4)`;
    });
    setTimeout(() => {
      n.style.opacity = 0;
      n.remove();
      this.burst(x, y - 36, 12, ['#ffffff', '#ffd166', '#b9a4ff', '#7c4dff'],
        { spMin: 60, spMax: 190, lift: 55, sMin: 3, sMax: 8, life: .5, g: 320 });
      this.ring(x, y - 30, 84, col, .35);
      this.astroStardust(x, y - 40, 5, col, { spMin: 40, spMax: 130, lift: 45 });
    }, 250);
  },

  /** Astro's signature celestial support language:
      Deep dream pulse waves, orbiting sleep glyphs, shooting starfalls,
      and starlight star pillows cushioning wounded allies. */
  astroSkill(kind, x, y, opt) {
    if (!this.front) return;
    opt = opt || {};
    const col = '#b9a4ff', target = opt.target, targets = opt.targets || [];
    if (kind === 'pulse') {
      this.ring(x, y - 40, 180, '#7c4dff', .45);
      this.ring(x, y - 40, 340, '#b9a4ff', .6);
      this.ring(x, y - 40, 520, '#dcd0ff', .75);
      this.astroStardust(x, y - 50, 14, '#b9a4ff', { spread: Math.PI * 2, spMin: 60, spMax: 220, lift: 40 });
      this.floatItem(x, y - 96, 'Trinkets/ASTRO_Starpillow', '#b9a4ff');
      targets.forEach((t, i) => {
        if (!t || !t.alive) return;
        setTimeout(() => {
          if (opt.isAlly) {
            this.ring(t.x, t.y - 34, 76, '#b9a4ff', .35);
            this.sparkle(t.x, t.y - 50, 8, '#dcd0ff');
            this.astroStardust(t.x, t.y - 50, 4, '#b9a4ff');
            this.floatItem(t.x, t.y - 88, 'Trinkets/ASTRO_Starpillow', '#b9a4ff');
          } else {
            this.astroDrowsy(t);
            this.ring(t.x, t.y - 34, 70, '#7c4dff', .3);
          }
        }, i * 40);
      });
      return;
    }
    if (kind === 'slumber') {
      if (target) {
        this.ring(target.x, target.y - 45, 115, '#7f6bd6', .45);
        this.ring(target.x, target.y - 45, 160, '#b9a4ff', .55);
        this.astroDrowsy(target);
        this.astroStardust(target.x, target.y - 55, 8, '#7f6bd6');
        this.floatItem(target.x, target.y - 96, 'Trinkets/ASTRO_Starpillow', '#7f6bd6');
        this.floatIcon(target.x, target.y - 120, '💤 SLUMBER', '#b9a4ff');
      }
      return;
    }
    if (kind === 'starfall') {
      if (target) {
        this.starfall(target.x, target.y, { col: '#b9a4ff' });
      }
      return;
    }
    if (kind === 'rested') {
      if (target) {
        this.ring(target.x, target.y - 34, 82, '#b9a4ff', .38);
        this.sparkle(target.x, target.y - 50, 7, '#dcd0ff');
        this.astroStardust(target.x, target.y - 50, 4, '#ffd166');
        this.floatItem(target.x, target.y - 88, 'Trinkets/ASTRO_Starpillow', '#ffd166');
      }
      return;
    }
    if (kind === 'shield') {
      if (target) {
        this.ring(target.x, target.y - 35, 120, '#b9a4ff', .45);
        this.astroMoonShield(target.x, target.y, 76, opt.dur || 1.3);
        this.astroStardust(target.x, target.y - 50, 6, '#b9a4ff');
        this.floatItem(target.x, target.y - 94, 'Trinkets/ASTRO_Starpillow', '#b9a4ff');
      }
      return;
    }
    if (kind === 'save') {
      if (target) {
        this.flash('#2b2160', .35, .35);
        this.ring(target.x, target.y - 35, 150, '#ffffff', .6);
        this.ring(target.x, target.y - 35, 230, '#b9a4ff', .75);
        this.aura(target.x, target.y, '#7c4dff', 1.8);
        this.astroMoonShield(target.x, target.y, 90, 1.8);
        this.burst(target.x, target.y - 40, 20, ['#ffffff', '#ffd166', '#b9a4ff', '#7c4dff'],
          { spMin: 90, spMax: 260, lift: 90, sMin: 4, sMax: 10, life: .8, g: 400 });
        this.astroStardust(target.x, target.y - 60, 10, '#ffffff', { spMin: 60, spMax: 200, lift: 60 });
        this.floatItem(target.x, target.y - 105, 'Trinkets/ASTRO_Starpillow', '#ffffff');
        this.floatIcon(target.x, target.y - 128, '🌙 SAVED', '#dcd0ff');
        this.shake(4, .22);
      }
    }
  },

  /** Bassie's basket is a resource container first and a weapon second. The
      visible food stock, ally packing pulse, and full-basket flight make that
      economy legible without turning every cast into the same explosion. */
  bassieSkill(kind, x, y, opt) {
    if (!this.front) return;
    opt = opt || {};
    const col = '#8fd9c4', face = opt.face || 1;
    const basket = { kind: 'item', img: 'Baskets', size: 54 };
    if (kind === 'stock' || kind === 'overflow') {
      this.castProp(x + face * 12, y, basket, col, .32);
      this.ring(x, y - 34, kind === 'overflow' ? 86 : 62, kind === 'overflow' ? '#ffd166' : col, .28);
      const n = Math.min(3, Math.max(1, opt.count || 1));
      for (let i = 0; i < n; i++) setTimeout(() =>
        this.floatItem(x + face * (18 + i * 12), y - 78 - i * 4, i % 2 ? 'Bread' : 'Apple', col), i * 55);
      return;
    }
    if (kind === 'supply') {
      if (opt.target) {
        this.heartLink(x + face * 18, y - 58, opt.target.x, opt.target.y - 58);
        this.ring(opt.target.x, opt.target.y - 34, 74, col, .30);
      }
      return;
    }
    if (kind === 'jab') {
      this.castProp(x + face * 28, y, basket, col, .20);
      return;
    }
    if (kind === 'sharing') {
      this.castProp(x + face * 14, y, basket, col, .56);
      this.ring(x, y - 36, 104, col, .42);
      const n = Math.min(8, Math.max(1, opt.count || 1));
      for (let i = 0; i < n; i++) setTimeout(() =>
        this.floatItem(x + face * (18 + rnd(-12, 12)), y - 72, ['Apple', 'Bread', 'Cherry', 'Pretzel'][i % 4], col), i * 72);
      return;
    }
    if (kind === 'packed') {
      this.castProp(x + face * 14, y, basket, col, .48);
      this.ring(x, y - 30, 116, col, .46);
      (opt.targets || []).filter(t => t && t.alive).forEach((t, i) => {
        setTimeout(() => {
          this.heartLink(x + face * 16, y - 56, t.x, t.y - 56);
          this.ring(t.x, t.y - 34, 96, col, .38);
          this.aura(t.x, t.y, col, 8.2);
          this.sparkle(t.x, t.y - 52, 7, '#d9fff1');
        }, i * 70);
      });
      return;
    }
    if (kind === 'toss') {
      const tx = opt.targetX == null ? x + face * 220 : opt.targetX;
      const ty = opt.targetY == null ? y - 60 : opt.targetY;
      this.castProp(x + face * 14, y, basket, col, .26);
      this.itemArc(x + face * 28, y - 64, tx, ty, 'Baskets',
        { kind: 'item', size: 58, dur: .40, arc: 96, col, spin: 520 });
      setTimeout(() => this.itemArc(tx, ty, x + face * 28, y - 64, 'Baskets',
        { kind: 'item', size: 58, dur: .42, arc: 64, col, spin: -460 }), 440);
      this.ring(tx, ty, 132, col, .42);
    }
  },

  bassieImpact(x, y, opt) {
    if (!this.front) return;
    opt = opt || {};
    const col = opt.overflow ? '#ffd166' : '#8fd9c4';
    this.ring(x, y, opt.overflow ? 156 : 126, col, .48);
    this.burst(x, y, opt.overflow ? 20 : 12,
      opt.overflow ? ['#ffd166', '#fff2bd', '#8fd9c4'] : ['#8fd9c4', '#d9fff1', '#fff'],
      { spMin: 100, spMax: opt.overflow ? 360 : 260, lift: 100, sMin: 4, sMax: 11, life: .72, g: 500 });
  },

  /** Waxwell's floor pieces are physical, glossy terrain rather than flat
      gradients: soft wax has pooled rims and drips, while Flame Trail has a
      bright core, hot embers, and a directionally flowing wick. */
  waxZone(x, anchorY, type, radius, dur) {
    if (!this.back) return;
    const isViolet = type === 'scented_violet' || type === 'violet_flame';
    const flame = type === 'flame' || isViolet, w = Math.max(58, radius * 2), h = flame ? 29 : 24;
    const n = el('div');
    n.className = 'fx-wax-zone ' + (isViolet ? 'violet-flame' : flame ? 'flame' : 'soft');
    n.style.cssText = `position:absolute;left:${x - w / 2}px;top:${anchorY - h - 4}px;width:${w}px;height:${h}px;
      z-index:2;pointer-events:none;opacity:0;transform:scaleX(.22) scaleY(.55);transform-origin:50% 100%;border-radius:50%;
      border:2px solid ${isViolet ? '#c084fc' : flame ? '#ffbc54' : '#f8d875'};background:${isViolet
        ? 'radial-gradient(ellipse at 50% 66%,#f5d0fe 0 9%,#c084fc 22%,#9333ea 48%,#581c87 70%,transparent 80%)'
        : flame
        ? 'radial-gradient(ellipse at 50% 66%,#fff7bd 0 9%,#ffbf45 18%,#fa6b2f 43%,#a9271e 63%,transparent 74%)'
        : 'radial-gradient(ellipse at 35% 28%,#fff8c8 0 5%,#f6d56d 15%,#c98d38 43%,#74401e 68%,transparent 75%)'};
      box-shadow:inset 0 3px 4px #fff8,inset 0 -5px 8px ${isViolet ? '#581c87' : flame ? '#8b1e18' : '#5e3018'}aa,0 0 ${flame ? (isViolet ? 22 : 19) : 12}px ${isViolet ? '#a855f7cc' : flame ? '#ff642fbb' : '#e7bd54aa'}`;
    n.innerHTML = '<b></b><b></b><b></b>' + (flame ? '<i></i><i></i><i></i><i></i>' : '<em></em><em></em>');
    this.back.appendChild(n);
    n.querySelectorAll('b').forEach((b, k) => b.style.cssText = `position:absolute;left:${13 + k * 27}%;top:${flame ? 11 + (k % 2) * 3 : 7 + (k % 2) * 5}px;width:${flame ? 16 : 20}px;height:${flame ? 4 : 5}px;border-radius:50%;background:${isViolet ? '#f5d0feaa' : flame ? '#fff3a2aa' : '#fff4b477'};filter:blur(1px);`);
    if (flame) n.querySelectorAll('i').forEach((i, k) => {
      i.style.cssText = `position:absolute;left:${11 + k * 23}%;bottom:${4 + (k % 2) * 2}px;width:${9 + (k % 2) * 2}px;height:${15 + (k % 3) * 5}px;
        border-radius:65% 35% 60% 40%;background:${isViolet ? 'linear-gradient(#faf5ff 0 22%,#e9d5ff 31%,#c084fc 66%,#7e22ce)' : 'linear-gradient(#fffbd0 0 22%,#ffd35b 31%,#ff7131 66%,#b9231d)'};transform:rotate(${(k - 1.5) * 8}deg);filter:${isViolet ? 'drop-shadow(0 0 8px #c084fc)' : 'drop-shadow(0 0 6px #ff8a38)'};animation:waxFlicker ${.42 + k * .07}s ease-in-out infinite alternate;`;
    }); else n.querySelectorAll('em').forEach((e, k) => e.style.cssText = `position:absolute;left:${28 + k * 32}%;bottom:-5px;width:${7 + k * 2}px;height:${9 + k * 4}px;border-radius:0 0 60% 60%;background:#a96428;opacity:.72;`);
    requestAnimationFrame(() => { n.style.transition = 'transform .22s cubic-bezier(.1,1.3,.3,1),opacity .16s'; n.style.opacity = .92; n.style.transform = 'scaleX(1) scaleY(1)'; });
    setTimeout(() => { n.style.transition = 'opacity .6s'; n.style.opacity = 0; }, Math.max(200, dur * 1000 - 600));
    setTimeout(() => n.remove(), Math.max(760, dur * 1000 + 220));
    return n;
  },

  waxTrail(x1, y1, x2, y2, face, type, dur) {
    if (!this.front) return;
    const flame = type === 'flame', h = flame ? 14 : 9;
    const dx = x2 - x1, dy = y2 - y1, width = Math.max(42, Math.hypot(dx, dy));
    const angle = Math.atan2(dy, dx) * 180 / Math.PI;
    const n = el('div');
    n.className = 'fx-wax-trail ' + (flame ? 'flame' : 'soft');
    n.style.cssText = `position:absolute;left:${x1}px;top:${y1 - h * .5}px;width:${width}px;height:${h}px;
      z-index:5;pointer-events:none;opacity:0;transform:rotate(${angle}deg) scaleX(.05);transform-origin:0 50%;
      border-radius:99px;border:1px solid ${flame ? '#ffc85c' : '#f5d982'};background:${flame ? 'linear-gradient(90deg,#fff7bd,#ffd35b 18%,#ff812f 52%,#c82b20 80%,transparent)' : 'linear-gradient(90deg,transparent,#fff3af 10%,#e7bd54 42%,#a35f28 78%,transparent)'};
      box-shadow:inset 0 2px 2px #fff8,0 0 ${flame ? 17 : 10}px ${flame ? '#ff6b32cc' : '#e7bd5488'}`;
    this.front.appendChild(n);
    for (let i = 1; i < Math.min(8, Math.ceil(width / 70)); i++) {
      const dot = el('i'); dot.style.cssText = `position:absolute;left:${i * 70 - 9}px;top:${flame ? -8 : -5}px;width:${flame ? 19 : 17}px;height:${flame ? 19 : 17}px;border-radius:50%;
        border:2px solid ${flame ? '#ffd166' : '#f5d982'};background:${flame ? '#ff8a3833' : '#fff0a533'};box-shadow:0 0 9px ${flame ? '#ff7b38' : '#e7bd54'};opacity:.88`;
      n.appendChild(dot);
    }
    requestAnimationFrame(() => { n.style.transition = 'transform .36s cubic-bezier(.15,.8,.25,1),opacity .15s'; n.style.opacity = .92; n.style.transform = `rotate(${angle}deg) scaleX(1)`; });
    setTimeout(() => { n.style.transition = 'opacity .6s'; n.style.opacity = 0; }, Math.max(300, dur * 1000 - 600));
    setTimeout(() => n.remove(), Math.max(880, dur * 1000 + 240));
  },

  /* A Wax Figure persists while its gameplay record exists. Its amber
     silhouette and explicit label distinguish it from a real summoned unit. */
  waxFigure(kind, record, target, opt) {
    opt = opt || {};
    // A figure is updated every 250ms while it follows its copied target.
    // On a seven-unit board those persistent image layers can outlive their
    // owners and eventually lock the compositor. The gameplay record still
    // exists and is simulated normally; only this optional visual is omitted
    // for dense boards.
    if (this._denseParty) return;
    if (kind === 'move' && record.fxEl) {
      record.fxEl.style.transform = `translate3d(${record.x}px,${(record.y == null ? opt.ground : record.y) - 122}px,0)`;
      return;
    }
    if (kind === 'melt') {
      const n = record.fxEl; if (!n) return;
      n.classList.add('melting');
      n.style.transform += ' scaleY(.3)';
      setTimeout(() => n.remove(), 430);
      record.fxEl = null;
      return;
    }
    if (!this.back || kind !== 'spawn') return;
    const n = el('div', 'fx-wax-figure');
    const src = target && target.imgEl && target.imgEl.src ? target.imgEl.src : Art.hero(target && target.id);
    n.innerHTML = `<div class="wax-figure-halo"></div><img src="${src}" alt=""><div class="wax-figure-wick"></div><b>WAX FIGURE</b><i>♟</i>`;
    n.style.transform = `translate3d(${record.x}px,${(record.y == null ? opt.ground : record.y) - 122}px,0)`;
    n.querySelector('img').style.transform = `scaleX(${opt.face || 1})`;
    this.back.appendChild(n);
    record.fxEl = n;
    requestAnimationFrame(() => n.classList.add('shown'));
  },

  waxwellSkill(kind, x, y, opt) {
    if (!this.front) return;
    opt = opt || {};
    const gold = '#e7bd54', fire = '#ff8a38';
    if (kind === 'run') {
      this.burst(x + (opt.face || 1) * 34, y - 88, 12, ['#fff7bd', '#ffca55', '#ff782f'], { dir: opt.face > 0 ? 0 : Math.PI, spread: .58, spMin: 80, spMax: 220, lift: 88, shape: 'shard', sMin: 3, sMax: 8, life: .55 });
      this.ring(x, y - 30, 88, fire, .36);
      return;
    }
    if (kind === 'ignite') {
      this.burst(x + (opt.face || 1) * 42, y - 60, 10, ['#fff3aa', '#ffbd4a', '#ff6b31'], { dir: opt.face > 0 ? 0 : Math.PI, spread: .55, spMin: 90, spMax: 260, lift: 70, sMin: 3, sMax: 8, shape: 'shard', life: .52 });
      [opt.first, opt.second].filter(Boolean).forEach((t, i) => {
        this.ring(t.x, t.y - 34, i ? 118 : 98, fire, .42);
        this.burst(t.x, t.y - 34, i ? 12 : 8, ['#fff2a5', '#ffca55', '#ff7b32', '#d83c26'], { spMin: 50, spMax: 190, lift: 76, sMin: 3, sMax: 8, shape: 'shard', life: .58, g: 390 });
      });
      return;
    }
    if (kind === 'melt') {
      this.ring(x, y - 24, 76, gold, .32);
      this.burst(x + (opt.face || 1) * 36, y - 45, 7, ['#fff4b0', '#e7bd54', '#a86428'], { dir: opt.face > 0 ? 0 : Math.PI, spread: .65, spMin: 70, spMax: 180, lift: 36, shape: 'dot', life: .48 });
      return;
    }
    if (kind === 'snuffer' || kind === 'snuffHit') {
      const targets = kind === 'snuffer' ? (opt.targets || []) : [opt.target];
      targets.filter(Boolean).forEach((t, i) => {
        if (kind === 'snuffer') this.waxTrail(x, y, t.x, t.y, opt.face || 1, 'soft', 1.8);
        this.ring(t.x, t.y - 48, kind === 'snuffer' ? 76 : 92, opt.flame ? fire : gold, .30);
        const lock = el('div');
        lock.style.cssText = `position:absolute;left:${t.x - 34}px;top:${t.y - 112}px;width:68px;height:68px;border:3px solid ${opt.flame ? '#ff9c3e' : '#f5d982'};
          border-radius:50%;pointer-events:none;opacity:0;transform:scale(.42) rotate(-18deg);background:radial-gradient(circle,${opt.flame ? '#ff8a3822' : '#e7bd5422'} 0 42%,transparent 44%);box-shadow:inset 0 0 14px ${opt.flame ? '#ff8a38' : '#e7bd54'}88,0 0 16px ${opt.flame ? '#ff8a38' : '#e7bd54'}`;
        lock.innerHTML = '<i></i><i></i><i></i><i></i>';
        lock.querySelectorAll('i').forEach((q, k) => q.style.cssText = `position:absolute;left:${k % 2 ? 46 : 4}px;top:${k < 2 ? 4 : 46}px;width:10px;height:10px;border-color:${opt.flame ? '#ffb347' : '#fff0a5'};border-style:solid;border-width:${k === 0 ? '3px 0 0 3px' : k === 1 ? '3px 3px 0 0' : k === 2 ? '0 0 3px 3px' : '0 3px 3px 0'}`);
        this.front.appendChild(lock);
        requestAnimationFrame(() => { lock.style.transition = 'transform .18s cubic-bezier(.1,1.5,.3,1),opacity .12s'; lock.style.opacity = .9; lock.style.transform = `scale(1) rotate(${i * 8 - 12}deg)`; });
        setTimeout(() => { lock.style.transition = 'opacity .28s,transform .28s'; lock.style.opacity = 0; lock.style.transform = 'scale(1.22) rotate(12deg)'; }, 360);
        setTimeout(() => lock.remove(), 760);
        this.burst(t.x, t.y - 70, kind === 'snuffer' ? 9 : 5, opt.flame ? ['#fff2a5', '#ff9c3e', '#e44525'] : ['#fff4b0', '#e7bd54', '#a87832'], { spMin: 55, spMax: 160, lift: 45, shape: 'shard', sMin: 3, sMax: 7, life: .46 });
      });
      return;
    }
    if (kind === 'figure' || kind === 'meltFigure') {
      const t = opt.target; if (!t) return;
      // Melt effects need to happen at the copied figure's stored location,
      // not back at Waxwell's own feet after the original has moved away.
      const figureX = opt.x == null ? x + (opt.face || 1) * 54 : opt.x;
      const figureY = opt.y == null ? y : opt.y;
      const src = t.imgEl && t.imgEl.src ? t.imgEl.src : Art.hero(t.id);
      const ghost = el('img'); ghost.src = src; ghost.alt = '';
      ghost.style.cssText = `position:absolute;left:${figureX - 34}px;top:${figureY - 126}px;width:68px;height:110px;object-fit:contain;
        pointer-events:none;opacity:0;filter:sepia(1) saturate(1.8) hue-rotate(350deg) brightness(1.1) drop-shadow(0 0 10px #e7bd54);transform:translateY(12px) scaleX(${opt.face || 1})`;
      this.back.appendChild(ghost);
      requestAnimationFrame(() => { ghost.style.transition = 'transform .24s cubic-bezier(.12,1.4,.3,1),opacity .14s'; ghost.style.opacity = .66; ghost.style.transform = `translateY(0) scaleX(${opt.face || 1})`; });
      setTimeout(() => { ghost.style.transition = 'opacity .3s,transform .3s'; ghost.style.opacity = 0; ghost.style.transform = `translateY(-16px) scaleX(${opt.face || 1})`; }, kind === 'figure' ? 1200 : 120);
      setTimeout(() => ghost.remove(), kind === 'figure' ? 1650 : 500);
      this.ring(figureX, figureY - 22, kind === 'figure' ? 82 : 112, gold, .35);
      this.burst(figureX, figureY - 50, kind === 'figure' ? 9 : 14, ['#fff4b0', '#e7bd54', '#a86428'], { spMin: 55, spMax: 190, lift: 65, shape: 'shard', sMin: 3, sMax: 8, life: .55 });
    }
  },

  /** Rudie's VFX are built around one idea: speed leaves a visible wake.
      Generated wind and hoof sprites keep his rushes distinct from generic
      red buffs while the small impact bursts stay cheap during multi-hits. */
  rudieSkill(kind, x, y, opt) {
    if (!this.front) return;
    opt = opt || {};
    const face = opt.face || 1, size = opt.size || 108;
    const windSrc = ASSET + 'assets/fx/rudie-wind-rush.png';
    const hoofSrc = ASSET + 'assets/fx/rudie-hoof-barrage.png';
    const sprite = (src, sx, sy, w, h, life, rotate) => {
      const n = el('img'); n.src = src; n.alt = '';
      n.style.cssText = `position:absolute;left:${sx - w / 2}px;top:${sy - h / 2}px;width:${w}px;height:${h}px;object-fit:contain;
        pointer-events:none;z-index:9;opacity:0;transform:translate3d(${face * -18}px,8px,0) scale(.28) rotate(${rotate - face * 12}deg);
        filter:drop-shadow(0 4px 4px #25120c99);will-change:transform,opacity`;
      this.front.appendChild(n);
      requestAnimationFrame(() => { n.style.transition = 'transform .22s cubic-bezier(.12,1.45,.3,1),opacity .10s'; n.style.opacity = '.94'; n.style.transform = `translate3d(${face * 8}px,-5px,0) scale(1) rotate(${rotate + face * 5}deg)`; });
      setTimeout(() => { n.style.transition = 'transform .28s ease-in,opacity .22s'; n.style.opacity = '0'; n.style.transform = `translate3d(${face * 32}px,-28px,0) scale(.84) rotate(${rotate + face * 18}deg)`; }, Math.max(100, life * 1000 - 250));
      setTimeout(() => n.remove(), Math.max(520, life * 1000 + 120));
      return n;
    };
    if (kind === 'rush' || kind === 'opener') {
      sprite(windSrc, x + face * 18, y - size * .50, size * 1.22, size * .82, opt.dur || .78, face * -7);
      this.ring(x, y - 34, 72, '#ffd166', .30);
      this.burst(x + face * 20, y - 46, 7, ['#fff3b0', '#ffd166', '#ff5b7f'], { dir: face > 0 ? 0 : Math.PI, spread: .55, spMin: 65, spMax: 180, lift: 42, shape: 'shard', life: .42, g: 330 });
      return;
    }
    if (kind === 'rushHit' || kind === 'hoofHit') {
      const tx = opt.targetX == null ? x + face * 44 : opt.targetX;
      const ty = opt.targetY == null ? y - 48 : opt.targetY;
      this.ring(tx, ty, kind === 'rushHit' ? 76 : 58, kind === 'rushHit' ? '#ffd166' : '#ff5b7f', .24);
      this.burst(tx, ty, kind === 'rushHit' ? 7 : 4, ['#fff3b0', '#ffd166', '#ff5b7f'], { dir: face > 0 ? 0 : Math.PI, spread: .75, spMin: 70, spMax: 210, lift: 45, shape: 'shard', life: .36, g: 350 });
      return;
    }
    if (kind === 'hoof') {
      const tx = opt.targetX == null ? x + face * 82 : opt.targetX;
      const ty = opt.targetY == null ? y - 48 : opt.targetY;
      sprite(hoofSrc, tx, ty, Math.max(92, (opt.targetSize || size) * 1.18), Math.max(72, (opt.targetSize || size) * .94), .70, face * -9);
      this.ring(tx, ty + 8, 82, '#ff5b7f', .28);
      return;
    }
    if (kind === 'boost') {
      this.ring(x, y - 42, 98, '#ff5b7f', .46);
      sprite(windSrc, x, y - size * .52, size * .84, size * .60, opt.dur || .72, face * 4);
      this.sparkle(x + face * 18, y - size * .86, 7, '#fff1a4');
      return;
    }
    if (kind === 'momentum') {
      const stacks = Math.max(1, opt.stacks || 1), count = Math.min(6, 2 + Math.ceil(stacks / 2));
      this.ring(x, y - 35, 52 + Math.min(34, stacks * 3), stacks >= 5 ? '#ff5b7f' : '#ffd166', .22);
      for (let i = 0; i < count; i++) setTimeout(() => this.sparkle(
        x + Math.cos(i * Math.PI * 2 / count) * (24 + stacks),
        y - 50 + Math.sin(i * Math.PI * 2 / count) * 20,
        1, stacks >= 5 ? '#ff5b7f' : '#ffd166'
      ), i * 32);
    }
  },

  /* A named seal makes Phantasia's random White-skill result readable rather
     than looking like an unexplained stat change. */
  phantasiaWish(kind, x, y) {
    if (!this.front) return;
    const data = {
      computer: ['💻', 'COMPUTER SPELL', '#7bd6ff'], speed: ['🏃', 'SPEED SPELL', '#ffe26f'],
      bravery: ['🛡', 'BRAVERY SPELL', '#ff9fd5'], healing: ['💚', 'HEALING SPELL', '#a9f4b3']
    }[kind] || ['✨', 'MAGIC TRICK', '#efb8ff'];
    const n = el('div', 'fx-phantasia-wish');
    n.style.cssText = `position:absolute;left:${x - 48}px;top:${y - 126}px;width:96px;pointer-events:none;opacity:0;transform:translateY(13px) scale(.72);text-align:center;`;
    n.innerHTML = `<i>${data[0]}</i><b>${data[1]}</b>`;
    n.querySelector('i').style.cssText = `display:block;font-style:normal;font-size:24px;filter:drop-shadow(0 0 7px ${data[2]});`;
    n.querySelector('b').style.cssText = `display:inline-block;margin-top:1px;padding:3px 5px;border:2px solid #392049;border-radius:5px;color:#281131;background:${data[2]};box-shadow:inset 0 1px #fff9,0 2px #23102c,0 0 10px ${data[2]};font:900 6px/1 Arial,sans-serif;letter-spacing:.45px;white-space:nowrap;`;
    this.front.appendChild(n);
    requestAnimationFrame(() => { n.style.transition = 'transform .18s cubic-bezier(.12,1.5,.3,1),opacity .12s'; n.style.opacity = .98; n.style.transform = 'translateY(0) scale(1)'; });
    setTimeout(() => { n.style.transition = 'transform .3s ease-in,opacity .3s'; n.style.opacity = 0; n.style.transform = 'translateY(-18px) scale(.94)'; }, 640);
    setTimeout(() => n.remove(), 980);
    this.ring(x, y - 38, 92, data[2], .38);
    this.sparkle(x, y - 55, 8, data[2]);
  },

  /* Compact speech-card callouts for White skills. They borrow the reference
     card's heavy ink edge, warm paper fill, diagonal print texture, and
     outlined lettering while staying small enough not to cover the fight. */
  heroDialogue(x, y, text, opt) {
    if (!this.front || !text) return null;
    opt = opt || {};
    const owner = opt.owner;
    if (owner && owner.dialogueEl && typeof owner.dialogueEl.remove === 'function') owner.dialogueEl.remove();
    const n = el('div', 'hero-skill-dialogue');
    n.textContent = text;
    n.style.left = `${x}px`;
    n.style.top = `${y - (opt.size || 90) * .92}px`;
    n.dataset.face = opt.face < 0 ? 'left' : 'right';
    this.front.appendChild(n);
    if (owner) owner.dialogueEl = n;
    requestAnimationFrame(() => n.classList.add('visible'));
    const fadeAt = opt.duration || 920;
    setTimeout(() => {
      if (!n.isConnected) return;
      n.classList.remove('visible'); n.classList.add('leaving');
      if (owner && owner.dialogueEl === n) owner.dialogueEl = null;
    }, fadeAt);
    setTimeout(() => { if (n.isConnected) n.remove(); }, fadeAt + 260);
    return n;
  },

  machineDialogue(x, y, text, opt) {
    if (!this.front || !text) return null;
    opt = opt || {};
    const owner = opt.owner;
    if (owner && owner.dialogueEl) owner.dialogueEl.remove();
    const n = el('div', 'unknown-world-dialogue');
    n.textContent = text;
    n.style.left = `${x}px`;
    n.style.top = `${y - (opt.size || 90) * .96}px`;
    n.dataset.face = opt.face < 0 ? 'left' : 'right';
    this.front.appendChild(n);
    if (owner) owner.dialogueEl = n;
    requestAnimationFrame(() => n.classList.add('visible'));
    const fadeAt = opt.duration || 1280;
    setTimeout(() => {
      if (!n.isConnected) return;
      n.classList.remove('visible'); n.classList.add('leaving');
      if (owner && owner.dialogueEl === n) owner.dialogueEl = null;
    }, fadeAt);
    setTimeout(() => { if (n.isConnected) n.remove(); }, fadeAt + 260);
    return n;
  },

  veeSignature(phase, x, y, opt) {
    if (!this.front) return;
    opt = opt || {};
    const size = opt.size || 94, w = size * 1.12, h = size * .78;
    // A single smooth CRT scan and camera frame, with no flickering static or
    // repeated luminance changes, important for the game's reduced-flash mix.
    const frame = el('div');
    frame.style.cssText = `position:absolute;left:${x - w / 2}px;top:${y - h / 2}px;width:${w}px;height:${h}px;
      border:4px solid ${phase === 'cast' ? '#75e65f' : '#7be0ff'};border-radius:10px;pointer-events:none;opacity:0;
      overflow:hidden;background:linear-gradient(180deg,rgba(7,18,18,.42),rgba(7,18,18,.08));
      box-shadow:inset 0 0 0 2px #16251e,0 0 0 2px rgba(0,0,0,.55);transform:scale(.55) rotate(${phase === 'cast' ? -5 : 3}deg)`;
    const scan = el('i');
    scan.style.cssText = `position:absolute;left:5%;right:5%;top:-12%;height:9%;border-radius:99px;
      background:${phase === 'cast' ? '#75e65f' : '#7be0ff'};opacity:.75;box-shadow:0 0 9px currentColor`;
    frame.appendChild(scan); this.front.appendChild(frame);
    requestAnimationFrame(() => {
      frame.style.transition = 'transform .24s cubic-bezier(.15,1.45,.35,1),opacity .12s';
      frame.style.opacity = .9; frame.style.transform = `scale(1) rotate(${phase === 'cast' ? 2 : -2}deg)`;
      scan.style.transition = 'transform .48s ease-in-out'; scan.style.transform = `translateY(${h * 1.05}px)`;
    });
    setTimeout(() => { frame.style.transition = 'transform .3s ease-out,opacity .28s';
      frame.style.opacity = 0; frame.style.transform = `scale(1.12) rotate(${phase === 'cast' ? 4 : -4}deg)`; }, 470);
    setTimeout(() => frame.remove(), 820);

    const bars = opt.ultimate ? 7 : 4;
    for (let i = 0; i < bars; i++) {
      const bar = el('div'); const bh = h * (.15 + (i % 3) * .09);
      bar.style.cssText = `position:absolute;left:${x - w * .42 + i * (w * .84 / Math.max(1, bars - 1))}px;top:${y + h * .34 - bh}px;
        width:${Math.max(3, size * .045)}px;height:${bh}px;background:${i % 2 ? '#75e65f' : '#7be0ff'};
        pointer-events:none;opacity:0;transform:scaleY(.15);transform-origin:50% 100%;border-radius:3px`;
      this.front.appendChild(bar);
      setTimeout(() => { bar.style.transition = 'transform .22s ease-out,opacity .1s'; bar.style.opacity = .72;
        bar.style.transform = 'scaleY(1)'; }, 70 + i * 28);
      setTimeout(() => { bar.style.transition = 'opacity .28s'; bar.style.opacity = 0; }, 390 + i * 18);
      setTimeout(() => bar.remove(), 760);
    }
    if (phase === 'impact') this.burst(x, y, opt.ultimate ? 12 : 6, ['#75e65f', '#7be0ff'],
      { shape: 'sq', spMin: 55, spMax: 155, lift: 20, sMin: 3, sMax: 7, life: .55, g: 120 });
  },

  /** A large object crossing the whole stage. Used for authored set-piece
      actions such as Dyle's locomotive, where moving the caster would make
      the action read like a normal dash instead of a summoned attack. */
  objectPass(img, fromX, toX, y, dur, opt) {
    if (!this.front) return;
    opt = opt || {};
    const w = opt.width || 260, h = opt.height || 120;
    const n = el('div');
    n.style.cssText = `position:absolute;left:0;top:0;width:${w}px;height:${h}px;z-index:${opt.z || 6};
      pointer-events:none;opacity:0;will-change:transform;filter:drop-shadow(0 7px 5px rgba(0,0,0,.45))`;
    n.innerHTML = `<img src="${Art.object(img)}" style="width:100%;height:100%;object-fit:contain;
      transform:${opt.flip ? 'scaleX(-1)' : 'none'}">`;
    this.front.appendChild(n);
    const start = `translate(${fromX - w / 2}px,${y - h}px)`;
    const end = `translate(${toX - w / 2}px,${y - h}px)`;
    n.style.transform = start;
    requestAnimationFrame(() => {
      n.style.transition = `transform ${dur}s cubic-bezier(.12,.7,.25,1),opacity .06s`;
      n.style.opacity = 1; n.style.transform = end;
    });
    setTimeout(() => { n.style.transition = 'opacity .12s'; n.style.opacity = 0; }, Math.max(0, dur - .1) * 1000);
    setTimeout(() => n.remove(), (dur + .16) * 1000);
  },

  /** A locomotive pass is more than a large projectile: the rails arrive,
      its lamp sweeps the field, steam follows the chimney, then the engine
      carries the impact line across the stage. */
  trainPass(dir, left, right, ground, dur, anchor) {
    if (!this.front || !this.back) return;
    // The engine runs along Dyle's actual depth lane, rather than a fixed
    // centre stripe. It can still sweep the whole field, but now visibly
    // belongs to the Toon who called it.
    const laneY = anchor && anchor.y != null ? anchor.y : ground;
    const from = dir > 0 ? left - 300 : right + 300;
    const to = dir > 0 ? right + 300 : left - 300;
    const rail = el('div');
    rail.style.cssText = `position:absolute;left:-8%;right:-8%;top:${laneY - 22}px;height:42px;opacity:0;
      pointer-events:none;z-index:1;background:
      repeating-linear-gradient(90deg,transparent 0 22px,rgba(60,49,44,.86) 23px 29px,transparent 30px 52px),
      linear-gradient(to bottom,transparent 8px,rgba(201,212,224,.86) 9px 12px,transparent 13px 27px,rgba(201,212,224,.75) 28px 31px,transparent 32px);
      filter:drop-shadow(0 2px 2px rgba(0,0,0,.7));transition:opacity .16s`;
    this.back.appendChild(rail);
    requestAnimationFrame(() => { rail.style.opacity = 1; });
    setTimeout(() => { rail.style.transition = 'opacity .35s'; rail.style.opacity = 0; }, (dur + .18) * 1000);
    setTimeout(() => rail.remove(), (dur + .62) * 1000);

    const w = 460, h = 205;
    const lamp = el('div');
    const lampOffset = dir > 0 ? w / 2 - 10 : -w / 2 + 10;
    lamp.style.cssText = `position:absolute;left:0;top:0;width:145px;height:82px;z-index:5;opacity:0;
      pointer-events:none;background:radial-gradient(ellipse at center,rgba(255,245,184,.95),rgba(255,211,89,.34) 28%,transparent 72%);
      filter:blur(2px);will-change:transform`;
    this.front.appendChild(lamp);
    const lampStart = `translate(${from + lampOffset - 72}px,${laneY - 168}px)`;
    const lampEnd = `translate(${to + lampOffset - 72}px,${laneY - 168}px)`;
    lamp.style.transform = lampStart;
    requestAnimationFrame(() => {
      lamp.style.transition = `transform ${dur}s cubic-bezier(.12,.7,.25,1),opacity .08s`;
      lamp.style.opacity = 1; lamp.style.transform = lampEnd;
    });
    setTimeout(() => { lamp.style.transition = 'opacity .12s'; lamp.style.opacity = 0; }, Math.max(0, dur - .08) * 1000);
    setTimeout(() => lamp.remove(), (dur + .16) * 1000);

    this.objectPass('DYLELargetrain', from, to, laneY + 18, dur, { width: w, height: h, flip: dir < 0, z: 6 });
    for (let i = 0; i < 7; i++) {
      const p = i / 6;
      setTimeout(() => {
        const x = lerp(from, to, p) - dir * 58;
        this.smoke(x, laneY - 126, 3, '#b7c1c9');
      }, p * dur * 1000);
    }
  },

  /** Physical prop used inside a cast choreography. Unlike a floating UI
      glyph, this enters from the caster's hands, hangs for a beat, and is
      swallowed by the cast VFX. */
  castProp(x, y, prop, col, dur) {
    // Held props are one of the most expensive Vee beats (image decode,
    // filter and a pair of transitions). On a dense board they are optional
    // decoration, so let the shared authored-effect budget drop them before
    // they can pile up behind the important hit/status feedback.
    if (!this.front || !prop || !this.effectAllowed(2)) return;
    const size = prop.size || 48;
    const resolve = prop.kind === 'obj' ? Art.object : Art.item;
    const n = el('div');
    n.style.cssText = `position:absolute;left:${x}px;top:${y - 70}px;width:${size}px;height:${size}px;
      margin-left:${-size / 2}px;pointer-events:none;z-index:7;opacity:0;will-change:transform;
      transform:translateY(16px) rotate(-18deg) scale(.45);filter:drop-shadow(0 3px 3px rgba(0,0,0,.55))`;
    n.innerHTML = `<img src="${resolve(prop.img)}" style="width:100%;height:100%;object-fit:contain">`;
    this.front.appendChild(n);
    requestAnimationFrame(() => {
      n.style.transition = 'transform .22s cubic-bezier(.2,1.55,.4,1),opacity .12s';
      n.style.opacity = 1; n.style.transform = 'translateY(-12px) rotate(7deg) scale(1)';
    });
    setTimeout(() => {
      n.style.transition = 'transform .24s ease-in,opacity .2s'; n.style.opacity = 0;
      n.style.transform = 'translateY(-42px) rotate(30deg) scale(.72)';
    }, (dur || .46) * 1000);
    setTimeout(() => n.remove(), ((dur || .46) + .28) * 1000);
    this.sparkle(x, y - 68, 4, col || '#fff');
  },

  /** Squirm's effects are paper-and-panic rather than a reused spell flash.
      The generated page burst is kept to decisive beats; ongoing defence is
      represented by a quiet shell ring so it remains easy on mobile GPUs. */
  squirmSkill(kind, x, y, opt) {
    if (!this.front) return;
    opt = opt || {};
    const size = opt.size || 106;
    if (kind === 'eat' || kind === 'jolt' || kind === 'revive') {
      const n = el('img');
      n.src = ASSET + 'assets/fx/squirm-bookburst.png';
      n.style.cssText = `position:absolute;left:${x}px;top:${y - size * .56}px;width:${size}px;height:${size}px;
        margin-left:${-size / 2}px;pointer-events:none;z-index:8;object-fit:contain;opacity:0;
        filter:drop-shadow(0 4px 3px #20160aaa);will-change:transform,opacity`;
      this.front.appendChild(n);
      const burst = kind !== 'eat';
      requestAnimationFrame(() => {
        n.style.transition = `transform ${burst ? '.16s' : '.26s'} cubic-bezier(.18,1.45,.3,1),opacity .1s`;
        n.style.opacity = burst ? '.94' : '.70';
        n.style.transform = burst ? 'translateY(-9px) rotate(9deg) scale(1.12)' : 'translateY(4px) rotate(-7deg) scale(.72)';
      });
      setTimeout(() => {
        n.style.transition = 'transform .28s ease-in,opacity .22s'; n.style.opacity = 0;
        n.style.transform = burst ? 'translateY(-38px) rotate(24deg) scale(1.42)' : 'translateY(-15px) rotate(8deg) scale(.52)';
      }, burst ? 180 : Math.max(420, (opt.dur || .9) * 1000 - 260));
      setTimeout(() => n.remove(), Math.max(560, (opt.dur || .9) * 1000 + 90));
      if (burst) this.burst(x, y - 36, kind === 'revive' ? 12 : 8, ['#f4e7bb', '#c9a979', '#a9c68b'],
        { shape:'paper', spMin:65, spMax:180, lift:70, sMin:4, sMax:10, life:.62, g:430 });
      return;
    }
    if (kind === 'curl' || kind === 'break') {
      const ring = el('div');
      const s = kind === 'break' ? size * 1.15 : size;
      ring.style.cssText = `position:absolute;left:${x - s / 2}px;top:${y - s * .72}px;width:${s}px;height:${s * .72}px;
        border:${kind === 'break' ? 4 : 5}px ${kind === 'break' ? 'dashed' : 'solid'} #f5e5b2;border-radius:50%;
        background:repeating-conic-gradient(from 0deg,#f1d99b44 0 14deg,transparent 14deg 31deg);box-shadow:inset 0 0 17px #d5b67d77,0 0 12px #f1dfaf88;
        pointer-events:none;z-index:7;opacity:0;transform:scale(.34)`;
      this.front.appendChild(ring);
      requestAnimationFrame(() => { ring.style.transition = 'transform .2s cubic-bezier(.15,1.45,.3,1),opacity .1s'; ring.style.opacity = .9; ring.style.transform = 'scale(1) rotate(15deg)'; });
      setTimeout(() => { ring.style.transition = 'transform .34s ease-in,opacity .28s'; ring.style.opacity = 0; ring.style.transform = `scale(${kind === 'break' ? 1.42 : 1.16}) rotate(${kind === 'break' ? 90 : 42}deg)`; }, kind === 'break' ? 180 : 480);
      setTimeout(() => ring.remove(), 850);
      if (kind === 'break') this.burst(x, y - 35, 9, ['#fff3c8', '#cba76c', '#89a985'], { shape:'paper', spMin:60, spMax:190, lift:60, sMin:3, sMax:8, life:.56, g:410 });
      return;
    }
    if (kind === 'flail') {
      // The paper fragments follow the same direction as the new tumble:
      // two loose arcs during the roll and a heavier scatter on landing.
      for (let i = 0; i < 5; i++) setTimeout(() => this.slash(
        x + Math.cos(i * 1.25) * (18 + i * 5),
        y - 34 - Math.sin(i * 1.25) * (12 + i * 4),
        { col: i % 2 ? '#f4e7bb' : '#a9c68b', ang: i * 72 - 128, small: true }
      ), i * 92);
      this.ring(x, y - 34, 48, '#f4e7bb', .22);
      setTimeout(() => this.burst(x, y - 24, 8, ['#f4e7bb', '#c9a979', '#a9c68b'],
        { shape:'paper', spMin:55, spMax:150, lift:55, sMin:3, sMax:8, life:.56, g:390 }), 620);
    }
  },

  /** Bobette's language is wrapping and releasing protection. The package is
      built as a small authored scene so the skill reads as a transformation:
      gather, seal, breathe, then burst open. The hold remains one DOM node. */
  bobetteSkill(kind, x, y, opt) {
    if (!this.front) return;
    opt = opt || {};
    const size = opt.size || 108, face = opt.face || 1;
    if (kind === 'wrap') {
      const box = el('div', 'bobette-package-hold');
      box.style.cssText = `left:${x - size * .68}px;top:${y - size * .84}px;width:${size * 1.36}px;height:${size * 1.36}px`;
      box.innerHTML = `<i class="bp-hold-aura"></i>
        <img class="bp-package-art" src="${Art.item('christmaspresent')}" alt="">
        <i class="bp-ribbon-sheen"></i><b class="bp-seal">✦</b>
        <i class="bp-paper one"></i><i class="bp-paper two"></i><i class="bp-paper three"></i>
        <small class="bp-hold-tag">PACKED WITH CARE</small>`;
      this.front.appendChild(box);
      requestAnimationFrame(() => box.classList.add('bp-ready'));
      const releaseAt = Math.max(240, (opt.dur || 1) * 1000 - 180);
      setTimeout(() => box.classList.add('bp-releasing'), releaseAt);
      setTimeout(() => box.remove(), Math.max(680, (opt.dur || 1) * 1000 + 90));
      return;
    }
    if (kind === 'open' || kind === 'favor') {
      const n = el('div', 'bobette-package-release');
      n.style.cssText = `left:${x - size * .74}px;top:${y - size * .90}px;width:${size * 1.48}px;height:${size * 1.48}px`;
      n.innerHTML = `<i class="bp-release-glow"></i>
        <img class="bp-present-burst" src="${ASSET}assets/fx/bobette-presentburst.png" alt="">
        <b class="bp-release-star">✦</b>`;
      this.front.appendChild(n);
      setTimeout(() => n.remove(), 720);
      this.burst(x, y - 42, kind === 'favor' ? 8 : 13, ['#e8536b', '#f5c860', '#fff0bf'], { shape:'paper', spMin:65, spMax:200, lift:82, sMin:4, sMax:10, life:.65, g:450 });
      return;
    }
    if (kind === 'cheer') {
      this.ring(x, y - 35, size * 1.65, '#e8536b', .46);
      this.sparkle(x, y - 62, 10, '#f5c860');
      return;
    }
    if (kind === 'toss') {
      this.castProp(x + face * 21, y + 4, { kind:'item', img:'christmaspresent', size:48 }, '#e8536b', .34);
    }
  },

  /** A real inventory sprite following a readable cartoon arc. Gourdy uses
      this instead of generic glowing orbs so every Treat remains identifiable
      all the way from his hands to its recipient. */
  itemArc(x1, y1, x2, y2, img, opt) {
    if (!this.front) return;
    opt = opt || {};
    const size = opt.size || 24, dur = opt.dur || .46, arc = opt.arc || 58;
    const n = el('div');
    n.style.cssText = `position:absolute;left:0;top:0;z-index:9;width:${size}px;height:${size}px;
      margin-left:${-size / 2}px;margin-top:${-size / 2}px;pointer-events:none;opacity:0;will-change:transform,opacity`;
    const resolve = opt.kind === 'obj' ? Art.object : Art.item;
    n.innerHTML = `<img src="${resolve(img)}" style="width:100%;height:100%;object-fit:contain;
      filter:drop-shadow(0 2px 2px #000a) drop-shadow(0 0 5px ${opt.col || '#ffb04d'})">`;
    this.front.appendChild(n);
    const start = performance.now();
    const step = now => {
      const p = clamp((now - start) / (dur * 1000), 0, 1), eased = ease.out(p);
      const x = lerp(x1, x2, eased), y = lerp(y1, y2, eased) - Math.sin(p * Math.PI) * arc;
      const scale = Math.sin(p * Math.PI) * .28 + (opt.small ? .68 : .86);
      n.style.opacity = String(Math.min(1, p * 9, (1 - p) * 10));
      n.style.transform = `translate(${x}px,${y}px) rotate(${(opt.spin || 420) * p * (opt.flip ? -1 : 1)}deg) scale(${scale})`;
      if (p < 1) requestAnimationFrame(step); else n.remove();
    };
    requestAnimationFrame(step);
    setTimeout(() => n.remove(), dur * 1000 + 250);
  },

  gourdyTreatCast(x, y, face) {
    this.castProp(x + face * 18, y, { kind: 'item', img: 'Pumpkin', size: 46 }, '#ff9d4d', .62);
    ['Skillcheckcandy', 'Speedcandy', 'Staminacandy'].forEach((img, i) => {
      setTimeout(() => this.floatItem(x + face * (7 + i * 13), y - 62 - (i % 2) * 9, img, '#ffc46b'), 60 + i * 55);
    });
    this.confetti(x, y - 62, 11);
  },

  gourdyTreat(x1, y1, x2, y2, candy, smaller) {
    this.itemArc(x1 + 12, y1 - 62, x2, y2 - 68, candy, {
      size: smaller ? 18 : 24, dur: smaller ? .34 : .46, arc: smaller ? 35 : 66, small: !!smaller, col: '#ffbd68'
    });
    setTimeout(() => {
      this.ring(x2, y2 - 34, smaller ? 56 : 78, '#ffb357', .3);
      this.sparkle(x2, y2 - 58, smaller ? 3 : 6, '#ffe5a8');
    }, (smaller ? 270 : 390));
  },

  gourdyRush(x, y, allies, smaller) {
    const list = (allies || []).slice(0, 5);
    this.ring(x, y - 32, smaller ? 82 : 126, '#ff9d4d', .42);
    list.forEach((ally, i) => {
      setTimeout(() => {
        this.itemArc(x, y - 58, ally.x, ally.y - 58, i % 2 ? 'Staminacandy' : 'Speedcandy', {
          size: smaller ? 15 : 21, dur: smaller ? .30 : .42, arc: 38 + i * 4, small: !!smaller, col: '#ffcf67', flip: i % 2
        });
        this.burst(ally.x, ally.y - 34, smaller ? 3 : 5, ['#ff9d4d', '#ffd166', '#8fd36b'], {
          shape: 'shard', spMin: 38, spMax: 115, lift: 30, sMin: 3, sMax: 7, life: .45
        });
      }, i * 38);
    });
  },

  gourdyPumpkinImpact(x, y, icon) {
    this.ring(x, y - 36, 105, '#ff8c36', .34);
    this.burst(x, y - 58, 15, ['#ff8c36', '#ffc14f', '#5e9d45', '#7d4828'], {
      shape: 'shard', spMin: 75, spMax: 230, lift: 58, sMin: 4, sMax: 10, life: .62, g: 430
    });
    this.floatIcon(x, y - 98, icon, '#ffd08a');
    this.sparkle(x, y - 58, 5, '#ffcf7a');
  },

  gourdyCandyFountain(x, y) {
    if (!this.front) return;
    const candies = ['Skillcheckcandy', 'Speedcandy', 'Staminacandy', 'Enigmacandy'];
    for (let i = 0; i < 7; i++) {
      setTimeout(() => {
        const c = candies[i % candies.length];
        const ang = -60 - (i * 12) + (Math.random() * 10 - 5);
        const rad = (ang * Math.PI) / 180;
        const dist = 45 + Math.random() * 55;
        const tx = x + Math.cos(rad) * dist * (i % 2 === 0 ? 1 : -1);
        const ty = y - 40 + Math.sin(rad) * dist;
        this.itemArc(x, y - 45, tx, ty, c, {
          size: 20 + (i % 3) * 3, dur: .42 + i * .04, arc: 40 + (i % 3) * 10, col: '#ff9d4d'
        });
        this.sparkle(tx, ty, 3, '#ffd08a');
      }, i * 45);
    }
    this.confetti(x, y - 50, 18);
    this.ring(x, y - 25, 90, '#ff9d4d', .35);
  },

  gourdyMegaPumpkin(u, target, isFamily) {
    if (!this.front || !target) return;
    const tx = target.x, ty = target.y;
    this.ring(tx, ty - 32, 130, '#ff7d1a', .45);
    this.burst(tx, ty - 50, 22, ['#ff7d1a', '#ffb834', '#60a638', '#9333ea', '#fff'], {
      shape: 'shard', spMin: 90, spMax: 260, lift: 70, sMin: 5, sMax: 12, life: .7, g: 420
    });
    this.floatIcon(tx, ty - 105, isFamily ? '🎃💜' : '🎃💥', '#ffa534');
    this.sparkle(tx, ty - 50, 8, '#ffe17d');
    if (isFamily) {
      this.ring(tx, ty - 35, 175, '#be69f6', .55);
      this.sparkle(tx, ty - 60, 12, '#e9b6ff');
    }
    const n = el('div', 'gourdy-mega-pumpkin');
    n.style.cssText = `left:${tx - 38}px;top:${ty - 88}px;`;
    n.innerHTML = '<span class="gourdy-pumpkin-face">🎃</span>';
    this.front.appendChild(n);
    requestAnimationFrame(() => n.classList.add('active'));
    setTimeout(() => { n.classList.remove('active'); n.classList.add('leaving'); }, 350);
    setTimeout(() => n.remove(), 600);
  },

  toodlesEightBallFortune(x, y, kind, isSuper) {
    if (!this.front) return;
    const fortuneTexts = {
      damage: 'OUTLOOK GOOD!',
      defense: 'IT IS CERTAIN!',
      speed: 'SIGNS POINT YES!',
      support: 'NO DOUBT!',
      all: 'ALL SIGNS YES!'
    };
    const fortuneColors = {
      damage: '#ff6b6b',
      defense: '#4ea8de',
      speed: '#ffd166',
      support: '#06d6a0',
      all: '#ffd700'
    };
    const col = fortuneColors[kind] || '#ffe27a';
    const text = fortuneTexts[kind] || 'OUTLOOK GOOD!';

    const ball = el('div', 'toodles-magic-eightball' + (isSuper ? ' super' : ''));
    ball.style.cssText = `left:${x - 30}px;top:${y - 85}px;--fortune-col:${col};`;
    ball.innerHTML = `
      <div class="eightball-sphere">
        <div class="eightball-front">
          <div class="eightball-white-circle">
            <span class="eightball-number">8</span>
          </div>
        </div>
        <div class="eightball-window">
          <div class="eightball-liquid">
            <div class="eightball-triangle">
              <span class="eightball-fortune-text">${text}</span>
            </div>
          </div>
        </div>
      </div>
    `;
    this.front.appendChild(ball);
    requestAnimationFrame(() => ball.classList.add('shaking'));
    setTimeout(() => {
      ball.classList.remove('shaking');
      ball.classList.add('reveal');
      this.ring(x, y - 55, isSuper ? 130 : 80, col, .35);
      this.sparkle(x, y - 60, isSuper ? 12 : 6, col);
    }, 380);
    setTimeout(() => {
      ball.classList.remove('reveal');
      ball.classList.add('leaving');
    }, 1100);
    setTimeout(() => ball.remove(), 1450);
  },

  toodlesDogPlushCheer(x, y) {
    if (!this.front) return;
    const plush = el('div', 'toodles-dogplush-cheer');
    plush.style.cssText = `left:${x - 22}px;top:${y - 95}px;`;
    plush.innerHTML = '<span class="dogplush-icon">🐶</span><span class="dogplush-heart">💖</span><span class="dogplush-star">✨</span>';
    this.front.appendChild(plush);
    requestAnimationFrame(() => plush.classList.add('active'));
    this.sparkle(x, y - 70, 6, '#ffd166');
    setTimeout(() => { plush.classList.remove('active'); plush.classList.add('leaving'); }, 850);
    setTimeout(() => plush.remove(), 1200);
  },

  toodlesHammerSmash(x, y, tx, ty, boost) {
    if (!this.front) return;
    const isSuper = boost === 'all';
    const hammer = el('div', 'toodles-live-hammer' + (isSuper ? ' super' : ''));
    hammer.style.cssText = `left:${tx - 26}px;top:${ty - 135}px;`;
    hammer.innerHTML = '<div class="hammer-head"></div><div class="hammer-handle"></div>';
    this.front.appendChild(hammer);
    requestAnimationFrame(() => hammer.classList.add('slamming'));
    setTimeout(() => {
      hammer.classList.remove('slamming');
      hammer.classList.add('impact');
      this.ring(tx, ty - 32, isSuper ? 120 : 85, isSuper ? '#ffd700' : '#ffe27a', .32);
      this.burst(tx, ty - 45, isSuper ? 16 : 10, ['#ffe27a', '#ff9dd0', '#ff6b8b', '#fff'], {
        shape: 'shard', spMin: 55, spMax: 180, lift: 45, sMin: 3, sMax: 8, life: .45
      });
      const pow = el('div', 'toodles-pow-starburst');
      pow.style.cssText = `left:${tx - 40}px;top:${ty - 85}px;`;
      pow.textContent = isSuper ? 'ALL SIGNS YES!' : (boost === 'damage' ? 'BONK!' : 'POW!');
      this.front.appendChild(pow);
      requestAnimationFrame(() => pow.classList.add('active'));
      setTimeout(() => pow.remove(), 650);

      const dizzy = el('div', 'toodles-dizzy-stars');
      dizzy.style.cssText = `left:${tx - 28}px;top:${ty - 90}px;`;
      dizzy.innerHTML = '<span>⭐</span><span>💫</span><span>⭐</span>';
      this.front.appendChild(dizzy);
      setTimeout(() => dizzy.remove(), 800);
    }, 220);
    setTimeout(() => hammer.remove(), 600);
  },

  toodlesMiracleShield(tx, ty) {
    if (!this.front) return;
    this.ring(tx, ty - 35, 96, '#a7ef67', .4);
    this.ring(tx, ty - 35, 120, '#ffe27a', .45);
    this.sparkle(tx, ty - 60, 10, '#fff5bd');
    const orb = el('div', 'toodles-miracle-orb');
    orb.style.cssText = `left:${tx - 45}px;top:${ty - 88}px;`;
    orb.innerHTML = '<span class="clover-orbit c1">🍀</span><span class="clover-orbit c2">✨</span><span class="clover-orbit c3">🧲</span>';
    this.front.appendChild(orb);
    requestAnimationFrame(() => orb.classList.add('active'));
    setTimeout(() => { orb.classList.remove('active'); orb.classList.add('leaving'); }, 900);
    setTimeout(() => orb.remove(), 1250);
  },

  qomGourdyDrumBlast(x, y, beat, power) {
    if (!this.front) return;
    const colors = { 1: '#a7f05f', 2: '#ba59e0', 3: '#8cf0da', 4: '#f4ffd9' };
    const col = colors[beat] || '#bbfa79';
    const rad = beat === 4 ? 140 : 85 + beat * 12;
    this.ring(x, y - 40, rad, col, beat === 4 ? .45 : .3);
    const blast = el('div', 'qom-drum-blast beat-' + beat);
    blast.style.cssText = `left:${x - 30}px;top:${y - 85}px;--blast-col:${col};`;
    const label = beat === 1 ? '🥁 BASS' : beat === 2 ? '🎵 HI-HAT' : beat === 3 ? '🎶 TOM' : '💥 CRASH!';
    blast.innerHTML = `<span>${label}</span>`;
    this.front.appendChild(blast);
    requestAnimationFrame(() => blast.classList.add('active'));
    if (beat === 4) {
      this.burst(x, y - 55, 18, ['#f4ffd9', '#d9a5ff', '#bbfa79', '#fff'], {
        shape: 'spark', spMin: 65, spMax: 200, lift: 50, sMin: 3, sMax: 7, life: .55
      });
      this.shake(3, .22);
    }
    setTimeout(() => blast.remove(), 650);
  },

  /** Looey's actions are physical comedy: inflate, launch, ricochet, then
      turn the whole arena into a small circus stage. */
  looeySkill(kind, x, y, opt) {
    if (!this.front) return;
    opt = opt || {};
    const size = opt.size || 100, face = opt.face || 1;
    if (kind === 'inflate' || kind === 'bounceWindup') {
      const n = el('div', 'looey-inflate-live');
      n.style.cssText = `left:${x + face * 10 - size * .42}px;top:${y - size * 1.05}px;width:${size * .84}px;height:${size * 1.02}px;`;
      n.innerHTML = '<i></i><b></b><em></em>';
      this.front.appendChild(n);
      requestAnimationFrame(() => n.classList.add('active'));
      setTimeout(() => { n.classList.remove('active'); n.classList.add('leaving'); }, kind === 'inflate' ? 760 : 430);
      setTimeout(() => n.remove(), kind === 'inflate' ? 1120 : 760);
      this.ring(x, y - 38, kind === 'inflate' ? 90 : 72, '#fff8fb', .26);
      return;
    }
    if (kind === 'bounceHit' && opt.target) {
      const t = opt.target;
      this.ring(t.x, t.y - 40, 68, '#ff8fb0', .28);
      this.burst(t.x, t.y - 56, 6, ['#fff', '#ff8fb0', '#ffd166'], { shape: 'dot', spMin: 45, spMax: 130, lift: 46, sMin: 3, sMax: 7, life: .4 });
      return;
    }
    if (kind === 'show') {
      const stage = el('div', 'looey-show-stage');
      stage.style.cssText = `left:${x - size * 1.45}px;top:${y - size * 1.28}px;width:${size * 2.9}px;height:${size * 1.34}px;`;
      stage.innerHTML = '<i class="looey-show-spotlight"></i><b class="looey-show-ball one"></b><b class="looey-show-ball two"></b><b class="looey-show-ball three"></b><span>BIG TOP!</span>';
      this.front.appendChild(stage);
      requestAnimationFrame(() => stage.classList.add('active'));
      const dur = Math.max(2.2, Number(opt.dur) || 8) * 1000;
      setTimeout(() => { stage.classList.remove('active'); stage.classList.add('leaving'); }, Math.max(900, dur - 480));
      setTimeout(() => stage.remove(), dur + 220);
      this.burst(x, y - 68, 12, ['#ff8fb0', '#ffd166', '#8fe8ff', '#fff'], { shape: 'paper', spMin: 38, spMax: 150, lift: 70, sMin: 3, sMax: 8, life: .7 });
    }
  },

  rodgerResearch(x, y, tx, ty, stacks, quiet) {
    this.rodgerBookStudy(x, y, quiet ? .92 : 1.28);
    if (!quiet) {
      ['paper', 'paper'].forEach((img, i) => setTimeout(() => this.itemArc(x + 5, y - 66, tx + (i ? 18 : -18), ty - 74,
        img, { size: 18, dur: .43 + i * .05, arc: 46 + i * 9, spin: 250, flip: !!i, col: '#a8c9ff' }), 360 + i * 75));
    }
    const readDelay = quiet ? 360 : 560;
    setTimeout(() => {
      this.targetLine({ x, y }, { x: tx, y: ty }, '#8fb4ff');
      this.itemArc(tx - 48, ty - 98, tx + 38, ty - 80, 'Magifyingglass', {
        kind: 'obj', size: quiet ? 24 : 34, dur: quiet ? .38 : .54, arc: 10, spin: quiet ? 90 : 150, col: '#8fb4ff'
      });
    }, readDelay);
    setTimeout(() => {
      this.ring(tx, ty - 38, quiet ? 64 : 98, '#8fb4ff', .34);
      this.sparkle(tx, ty - 67, quiet ? 3 : 7, '#c5dcff');
      this.floatIcon(tx, ty - 103, `R${Math.max(1, stacks || 1)}`, '#b9d5ff');
    }, quiet ? 650 : 930);
  },

  /** Rodger's book is an action prop, not a static icon: it rises into his
      hands, opens into readable pages, and gets scanned before disappearing. */
  rodgerBookStudy(x, y, dur) {
    if (!this.front) return;
    dur = Math.max(.82, dur || 1.1);
    const size = 64, n = el('div');
    n.style.cssText = `position:absolute;left:${x + 8}px;top:${y - 88}px;width:${size}px;height:${size * .72};
      margin-left:${-size / 2}px;pointer-events:none;z-index:8;opacity:0;transform:translateY(20px) scale(.45) rotate(-12deg);filter:drop-shadow(0 3px 3px #0008)`;
    const pages = el('div');
    pages.style.cssText = 'position:absolute;left:4%;top:16%;width:92%;height:68%;display:flex;transform:scaleX(.12);transform-origin:50% 50%;opacity:.96';
    const pageStyle = 'position:relative;display:block;width:50%;height:100%;border:2px solid #526f9b;border-radius:5px 2px 2px 5px;background:repeating-linear-gradient(170deg,#f7fbff 0 7px,#c6dcf4 8px 10px);box-shadow:inset 0 0 8px #7894b855';
    const left = el('i'), right = el('i'); left.style.cssText = pageStyle; right.style.cssText = pageStyle + 'border-radius:2px 5px 5px 2px;transform:scaleX(-1)';
    pages.appendChild(left); pages.appendChild(right);
    const cover = el('img'); cover.src = Art.object('Book'); cover.style.cssText = 'position:absolute;inset:8% 14%;width:72%;height:84%;object-fit:contain;opacity:.88;transform:scale(.9)';
    const lens = el('img'); lens.src = Art.object('Magifyingglass'); lens.style.cssText = 'position:absolute;left:50%;top:28%;width:24px;height:24px;object-fit:contain;opacity:0;transform:translateX(-50%) rotate(-22deg) scale(.55);filter:drop-shadow(0 2px 2px #0008)';
    n.appendChild(cover); n.appendChild(pages); n.appendChild(lens); this.front.appendChild(n);
    requestAnimationFrame(() => {
      n.style.transition = 'transform .28s cubic-bezier(.18,1.45,.3,1),opacity .12s';
      n.style.opacity = '.98'; n.style.transform = 'translateY(-8px) scale(1) rotate(3deg)';
      setTimeout(() => {
        pages.style.transition = 'transform .34s cubic-bezier(.16,1.35,.3,1)'; pages.style.transform = 'scaleX(1)';
        cover.style.transition = 'opacity .18s,transform .22s'; cover.style.opacity = '.16'; cover.style.transform = 'scale(.72)';
      }, 180);
      setTimeout(() => {
        lens.style.transition = 'left .42s ease-in-out,opacity .12s,transform .22s'; lens.style.opacity = '.92'; lens.style.left = '25%'; lens.style.transform = 'translateX(-50%) rotate(18deg) scale(1)';
        setTimeout(() => { lens.style.left = '74%'; lens.style.transform = 'translateX(-50%) rotate(-12deg) scale(1)'; }, 430);
      }, 390);
    });
    setTimeout(() => { n.style.transition = 'transform .24s ease-in,opacity .22s'; n.style.opacity = 0; n.style.transform = 'translateY(-42px) scale(.72) rotate(14deg)'; }, dur * 1000 - 240);
    setTimeout(() => n.remove(), dur * 1000 + 80);
  },

  rodgerCapsuleReady(x, y, face, dur) {
    this.castProp(x + face * 20, y, { kind: 'obj', img: 'researchcapsule', size: 40 }, '#8fb4ff', dur || .68);
    this.ring(x + face * 18, y - 44, 52, '#8fb4ff', .24);
  },

  rodgerCapsuleImpact(x, y, stacks) {
    this.boom(x, y - 58, .72, '#759ed8');
    this.ring(x, y - 37, 104, '#8fb4ff', .34);
    this.burst(x, y - 57, 13, ['#252b35', '#53657c', '#8fb4ff', '#d5e6ff'], {
      shape: 'shard', spMin: 75, spMax: 235, lift: 62, sMin: 3, sMax: 9, life: .60, g: 460
    });
    this.floatIcon(x, y - 103, `${Math.max(1, stacks || 1)}×`, '#c7ddff');
  },

  rodgerCaseFile(x, y, tx, ty) {
    this.rodgerBookStudy(x, y, 1.18);
    this.targetLine({ x, y }, { x: tx, y: ty }, '#8fb4ff');
    for (let i = 0; i < 3; i++) {
      setTimeout(() => this.itemArc(x + 8, y - 65, tx + (i - 1) * 22, ty - 70 - (i % 2) * 16, 'paper', {
        size: 20, dur: .46 + i * .05, arc: 42 + i * 12, spin: 340, flip: i % 2 === 1, col: '#9fc4ff'
      }), 360 + i * 70);
    }
    setTimeout(() => {
      this.castProp(tx, ty - 4, { kind: 'obj', img: 'Magifyingglass', size: 42 }, '#8fb4ff', .60);
      this.ring(tx, ty - 38, 116, '#8fb4ff', .42);
      this.floatIcon(tx, ty - 108, 'CASE', '#c4dcff');
    }, 920);
  },

  shrimpoTantrumStart(x, y, face, dur) {
    this.castProp(x + face * 13, y, { kind: 'item', img: 'Trinkets/SHRIMPO_Brick', size: 38 }, '#ff4735', Math.min(.72, dur || .72));
    this.ring(x, y - 30, 116, '#ff3d2d', .42);
    this.burst(x, y - 52, 9, ['#ff3a2b', '#ff8b42', '#fff0a1'], {
      shape: 'shard', spMin: 42, spMax: 142, lift: 44, sMin: 3, sMax: 7, life: .48
    });
  },

  shrimpoTantrumHit(x, y, face, beat) {
    const side = beat % 2 ? 1 : -1;
    this.itemArc(x + face * 8, y - 63, x + side * (48 + beat * 3), y - 38, 'Trinkets/SHRIMPO_Brick', {
      size: 21, dur: .28, arc: 27 + (beat % 3) * 6, spin: 390, flip: side < 0, col: '#ff4a36', small: true
    });
    this.ring(x + side * 20, y - 28, 58, '#ff4937', .22);
    this.burst(x + side * 24, y - 36, 4, ['#ff3d2d', '#ffb14a', '#fff1a0'], {
      shape: 'shard', spMin: 42, spMax: 116, lift: 32, sMin: 3, sMax: 6, life: .36
    });
  },

  ribeccaBones(x, y, tx, ty, face, lane) {
    const spread = ((lane || 0) % 3) - 1;
    this.targetLine({ x: x + face * 18, y: y - 58 }, { x: tx, y: ty - 58 }, '#e8ddff');
    for (let i = 0; i < 3; i++) {
      const offset = (i - 1) * 15 + spread * 4;
      setTimeout(() => this.itemArc(
        x + face * (18 + i * 8), y - 58 - i * 5,
        tx + offset, ty - 60 - (i % 2) * 9,
        'Trinkets/PEBBLE_Bone',
        { size: 22 + (i === 1 ? 3 : 0), dur: .38 + i * .035, arc: 32 + i * 9,
          spin: 420 + i * 80, flip: (i + (lane || 0)) % 2 === 1, col: '#e8ddff' }
      ), i * 48);
    }
    setTimeout(() => {
      this.ring(tx, ty - 38, 78, '#d8c8ff', .28);
      this.burst(tx, ty - 56, 5, ['#fff', '#e8ddff', '#b8a7ff'], {
        shape: 'shard', spMin: 38, spMax: 110, lift: 38, sMin: 3, sMax: 6, life: .38
      });
    }, 470);
  },

  shrimpoBully(x, y, tx, ty, finisher) {
    this.targetLine({ x, y }, { x: tx, y: ty }, '#ff4937');
    this.ring(tx, ty - 34, finisher ? 134 : 98, finisher ? '#fff09b' : '#ff4937', .34);
    this.boom(tx, ty - 55, finisher ? .86 : .64, '#ff3828');
    this.burst(tx, ty - 50, finisher ? 15 : 10, ['#ff392a', '#ff8b3f', '#6b2119', '#fff0a0'], {
      shape: 'shard', spMin: 78, spMax: finisher ? 255 : 195, lift: 56, sMin: 3, sMax: 9, life: .58, g: 460
    });
    for (let i = 0; i < (finisher ? 4 : 2); i++) {
      this.itemArc(tx, ty - 55, tx + (i - 1.5) * 34, ty - 27 - (i % 2) * 18, 'Trinkets/SHRIMPO_Brick', {
        size: 17, dur: .31 + i * .025, arc: 34 + i * 7, spin: 470, flip: i % 2 === 1, col: '#ff4937', small: true
      });
    }
    if (finisher) this.floatIcon(tx, ty - 108, 'FINISHER!', '#fff1a0');
  },

  shrimpoSpiteGain(x, y, stacks, max) {
    const full = stacks >= max;
    this.ring(x, y - 35, full ? 106 : 58 + stacks * 3, full ? '#fff09a' : '#ff4332', .25);
    this.sparkle(x, y - 58, full ? 7 : 3, full ? '#fff0a0' : '#ff4a37');
    this.floatIcon(x, y - 92, `${stacks}×`, full ? '#fff0a0' : '#ff725d');
  },

  shrimpoSpiteBurst(x, y, tx, ty) {
    this.targetLine({ x, y }, { x: tx, y: ty }, '#fff09a');
    this.ring(tx, ty - 35, 156, '#ff2f25', .44);
    this.boom(tx, ty - 56, 1.02, '#ff2f25');
    this.burst(tx, ty - 54, 18, ['#fff1a0', '#ff5a32', '#ff251f', '#681510'], {
      shape: 'shard', spMin: 95, spMax: 285, lift: 68, sMin: 4, sMax: 11, life: .68, g: 490
    });
    for (let i = 0; i < 5; i++) this.itemArc(tx, ty - 54, tx + (i - 2) * 39, ty - 18 - (i % 2) * 24, 'Trinkets/SHRIMPO_Brick', {
      size: 18, dur: .34 + i * .025, arc: 43 + i * 8, spin: 560, flip: i % 2 === 1, col: '#ff3529', small: true
    });
    this.floatIcon(tx, ty - 116, 'SPITE!', '#fff1a0');
  },

  gigiWish(x, y, tx, ty, opt) {
    if (!this.front) return;
    opt = opt || {};
    const face = opt.face || 1, star = el('div');
    star.className = 'gigi-wish-star-live';
    star.style.cssText = `position:absolute;left:0;top:0;z-index:10;width:34px;height:34px;
      margin-left:-17px;margin-top:-17px;pointer-events:none;opacity:0;
      transform:translate(${x + face * 24}px,${y - 68}px) scale(.18) rotate(-28deg);
      filter:drop-shadow(0 2px 2px #51223f) drop-shadow(0 0 8px #ffd166)`;
    star.innerHTML = '<b style="display:block;color:#fff4a8;font:1000 32px/34px Arial;text-align:center">★</b>';
    this.front.appendChild(star);
    requestAnimationFrame(() => {
      star.style.transition = 'transform .46s cubic-bezier(.14,1.45,.3,1),opacity .14s';
      star.style.opacity = '.98';
      star.style.transform = `translate(${tx}px,${ty - 98}px) scale(1) rotate(12deg)`;
    });
    setTimeout(() => {
      this.sparkle(tx, ty - 98, opt.quiet ? 3 : 6, '#ffd166');
      this.ring(tx, ty - 40, opt.quiet ? 48 : 74, '#ffb0e0', .26);
      star.style.transition = 'transform .3s ease-in,opacity .24s';
      star.style.opacity = '0'; star.style.transform = `translate(${tx}px,${ty - 122}px) scale(1.22) rotate(26deg)`;
    }, 520);
    setTimeout(() => star.remove(), 900);
  },

  gigiRoulette(x, y, results) {
    if (!this.front || !results || !results.length) return;
    const wheel = el('div');
    wheel.className = 'gigi-roulette-live';
    wheel.style.cssText = `position:absolute;left:0;top:0;z-index:24;width:156px;height:184px;margin-left:-78px;margin-top:-170px;
      pointer-events:none;opacity:0;transform:translate(${x}px,${y}px) scale(.72);filter:drop-shadow(0 5px 8px #45163288);`;
    const wedges = ['#ff719d','#61d8dc','#ffd166','#9d8bff','#ff9d58','#a5aac4','#73c889','#fff0a0'];
    const marks = ['♥','◆','➤','⚡','★','☁','×2','✦'];
    const gradient = wedges.map((c, i) => `${c} ${i * 45}deg ${(i + 1) * 45}deg`).join(',');
    wheel.innerHTML = `<div style="position:absolute;left:11px;top:6px;font:900 11px/1 Arial;letter-spacing:2px;color:#fff4cf;text-shadow:0 2px 3px #41132d">GIGI'S LUCKY WHEEL</div>
      <div class="gigi-roulette-disc" style="position:absolute;left:9px;top:25px;width:138px;height:138px;border:5px solid #fff0c1;border-radius:50%;box-sizing:border-box;background:conic-gradient(${gradient});box-shadow:inset 0 0 0 3px #8b345b,0 0 0 3px #7c2148;">
        ${marks.map((m,i)=>`<b style="position:absolute;left:50%;top:50%;width:26px;height:20px;margin-left:-13px;margin-top:-10px;display:block;text-align:center;color:#542846;font:1000 16px/20px Arial;text-shadow:0 1px 0 #fff9" data-wedge="${i}">${m}</b>`).join('')}
        <i style="position:absolute;left:50%;top:50%;width:36px;height:36px;margin:-18px;border-radius:50%;background:radial-gradient(circle at 35% 30%,#fff8d7,#f5b2cb 52%,#9b315e 100%);border:3px solid #fff4d0;box-sizing:border-box;box-shadow:0 2px 4px #4a1732"></i>
      </div><div style="position:absolute;left:72px;top:18px;width:0;height:0;border-left:9px solid transparent;border-right:9px solid transparent;border-top:18px solid #fff6d3;filter:drop-shadow(0 2px 1px #672647)"></div>
      <strong style="position:absolute;left:0;right:0;top:164px;text-align:center;font:1000 14px/18px Arial;color:#fff5d6;text-shadow:0 2px 4px #451632;white-space:nowrap"></strong>`;
    this.front.appendChild(wheel);
    const disc = wheel.querySelector('.gigi-roulette-disc');
    wheel.querySelectorAll('[data-wedge]').forEach(mark => {
      const i = Number(mark.dataset.wedge), a = (i * 45 + 22.5) * Math.PI / 180;
      mark.style.transform = `translate(${Math.sin(a) * 43}px,${-Math.cos(a) * 43}px)`;
    });
    requestAnimationFrame(() => {
      wheel.style.transition = 'opacity .12s,transform .2s cubic-bezier(.2,1.4,.4,1)'; wheel.style.opacity = '1'; wheel.style.transform = `translate(${x}px,${y}px) scale(1)`;
      setTimeout(() => { wheel.style.transition = ''; }, 230);
    });
    results.forEach((result, i) => {
      setTimeout(() => {
        if (!wheel.isConnected) return;
        const stop = ((360 - ((result.index || 0) * 45 + 22.5)) % 360) + 360 * (4 + i);
        disc.style.transition = 'transform 1.05s cubic-bezier(.08,.72,.16,1)';
        disc.style.transform = `rotate(${stop}deg)`;
        setTimeout(() => {
          const label = wheel.querySelector('strong');
          label.textContent = `${result.name.toUpperCase()}${result.combo > 1 ? `  ×${result.combo}` : ''}`;
          label.style.color = result.color || '#fff5d6';
          this.sparkle(x, y - 65, result.id === 'jackpot' ? 12 : 5, result.color || '#fff0a0');
        }, 980);
      }, i * 1120);
    });
    setTimeout(() => {
      wheel.style.transition = 'opacity .24s,transform .24s ease-in'; wheel.style.opacity = '0'; wheel.style.transform = `translate(${x}px,${y - 18}px) scale(.9)`;
      setTimeout(() => wheel.remove(), 260);
    }, 1180 + results.length * 1120);
  },

  veePanel(x, y, eyebrow, title, col, dur, small) {
    if (!this.front) return;
    const w = small ? 122 : 184, h = small ? 78 : 122;
    const isSpotlight = /SPOTLIGHT|HEADLINE/i.test(title + ' ' + eyebrow);
    const isAudience = /APPLAUSE|BOOSTED|FAN FAVORITE/i.test(title + ' ' + eyebrow);
    const isCommercial = /BACK|SLOWED|AD BREAK/i.test(title + ' ' + eyebrow);
    const art = isSpotlight
      ? (small ? 'veepopup1.png' : 'LOOKATME-Vee.webp')
      : isAudience
        ? (small ? 'veepopup2.png' : 'veepopup4.png')
        : (small ? 'veepopup2.png' : 'veepopup3.png');
    const kicker = isCommercial ? 'VEE\'S NETWORK' : isAudience ? 'VEE LIVE' : 'VEE BROADCAST';
    const action = isCommercial ? 'STAY TUNED' : isAudience ? 'SMILE!' : 'LOOK AT ME!';
    const n = el('div', `vee-ad-popup${small ? ' vee-ad-popup-small' : ''}`);
    n.style.cssText = `left:${x - w / 2}px;top:${y - h / 2}px;width:${w}px;--vee-accent:${col || '#7be0ff'};--vee-ad-life:${Math.max(.28, dur || .8)}s`;
    n.innerHTML = `<div class="vee-ad-top"><span>${kicker}</span><i>● ON AIR</i></div>
      <div class="vee-ad-art"><img src="${ASSET}uploads/${art}" alt=""><b>${action}</b></div>
      <div class="vee-ad-copy"><small>${eyebrow}</small><strong>${title}</strong><em>${isCommercial ? 'PLEASE WAIT FOR THE SHOW' : 'YOUR ATTENTION IS REQUIRED'}</em></div>
      <div class="vee-ad-meter"><i></i></div>`;
    this.front.appendChild(n);
    const meter = $('.vee-ad-meter i', n);
    if (typeof Sound !== 'undefined') Sound.play('vee_ad_pop', { vol: small ? .28 : .42 });
    requestAnimationFrame(() => {
      n.classList.add('is-live');
      meter.style.width = '78%';
    });
    setTimeout(() => n.classList.add('is-leaving'), (dur || .8) * 1000);
    setTimeout(() => n.remove(), ((dur || .8) + .3) * 1000);
  },

  veeLight(x, y, col, size, delay) {
    // The broadcast cards remain readable in LOW, but the decorative light
    // beams are optional. Avoid rebuilding a full field of glowing DOM nodes
    // when the player has explicitly chosen a light particle profile.
    if (!this.front || this.reducedEffects || this.particleMode === 'off' || this.graphicsQuality <= 33) return;
    setTimeout(() => {
      const density = this.graphicsQuality <= 66 ? .78 : 1;
      const s = (size || 82) * density, glow = col || '#7be0ff', n = el('div');
      n.style.cssText = `position:absolute;left:${x - s / 2}px;top:${y - s / 2}px;width:${s}px;height:${s}px;z-index:8;
        pointer-events:none;opacity:0;transform:scale(.25) rotate(-18deg);mix-blend-mode:screen;
        background:
          radial-gradient(ellipse at 50% 50%,#fff 0 2.5%,${glow} 4%,transparent 16%),
          radial-gradient(ellipse at 50% 50%,transparent 0 20%,${glow}66 36%,transparent 70%),
          linear-gradient(90deg,transparent 0 47%,#ffffffd9 49% 51%,transparent 53%),
          linear-gradient(0deg,transparent 0 47%,#ffffffd9 49% 51%,transparent 53%);
        filter:drop-shadow(0 0 7px ${glow})`;
      this.front.appendChild(n);
      requestAnimationFrame(() => { n.style.transition = 'transform .22s cubic-bezier(.15,1.5,.3,1),opacity .1s'; n.style.opacity = .9; n.style.transform = 'scale(1) rotate(5deg)'; });
      setTimeout(() => { n.style.transition = 'transform .28s ease-out,opacity .24s'; n.style.opacity = 0; n.style.transform = 'scale(1.45) rotate(18deg)'; }, 300);
      setTimeout(() => n.remove(), 620);
    }, delay || 0);
  },

  veeSpotlight(x, y, face, foes, headline) {
    this.castProp(x + face * 18, y, { kind: 'item', img: 'Trinkets/VEE_Veemote', size: 42 }, '#75e65f', .65);
    this.veePanel(x, y - 106, 'ON AIR', 'SPOTLIGHT ON', '#7be0ff', .82);
    const maxTargets = this.graphicsQuality >= 67 ? 5 : 2;
    const orderedFoes = (foes || []).slice().sort((a, b) => (b === headline ? 1 : 0) - (a === headline ? 1 : 0));
    orderedFoes.slice(0, maxTargets).forEach((foe, i) => {
      const isHeadline = foe === headline || (foe.hasStatus && foe.hasStatus('headline'));
      this.veeLight(foe.x, foe.y - 58, isHeadline ? '#75e65f' : '#7be0ff', isHeadline ? 122 : 82, 95 + i * 35);
      setTimeout(() => {
        if (this.graphicsQuality > 33 && this.particleMode !== 'off') this.ring(foe.x, foe.y - 35, isHeadline ? 116 : 72, isHeadline ? '#75e65f' : '#7be0ff', .34);
        if (isHeadline) {
          if (this.graphicsQuality > 33 && this.particleMode !== 'off') this.targetLine({ x, y }, foe, '#75e65f');
          this.veePanel(foe.x, foe.y - 112, 'PRIORITY TARGET', 'HEADLINE', '#75e65f', .72, true);
        }
      }, 170 + i * 35);
    });
  },

  veeAudience(x, y, face, allies) {
    this.castProp(x + face * 18, y, { kind: 'item', img: 'Trinkets/VEE_Veemote', size: 42 }, '#75e65f', .70);
    this.veePanel(x, y - 108, 'LIVE AUDIENCE', 'APPLAUSE!', '#75e65f', .90);
    const maxAllies = this.graphicsQuality >= 67 ? 3 : 2;
    (allies || []).slice(0, maxAllies).forEach((ally, i) => setTimeout(() => {
      if (this.graphicsQuality > 33 && this.particleMode !== 'off') this.targetLine({ x, y }, ally, '#75e65f');
      this.veeLight(ally.x, ally.y - 58, '#75e65f', 86, 0);
      if (this.graphicsQuality > 33 && this.particleMode !== 'off') this.ring(ally.x, ally.y - 34, 82, '#75e65f', .34);
      this.sparkle(ally.x, ally.y - 58, this.graphicsQuality >= 67 ? 5 : 3, '#caffb8');
      this.veePanel(ally.x, ally.y - 105, 'FAN FAVORITE', 'BOOSTED', '#75e65f', .62, true);
    }, 120 + i * 70));
  },

  veeCommercial(x, y, face, midX, ground, allies, enemies) {
    this.castProp(x + face * 18, y, { kind: 'item', img: 'Trinkets/VEE_Veemote', size: 44 }, '#7be0ff', .74);
    this.veePanel(midX, ground - 142, "VEE'S NETWORK", "WE'LL BE RIGHT BACK", '#7be0ff', 1.18);
    const maxTargets = this.graphicsQuality >= 67 ? 5 : 2;
    (enemies || []).slice(0, maxTargets).forEach((foe, i) => setTimeout(() => {
      if (this.graphicsQuality > 33 && this.particleMode !== 'off') this.ring(foe.x, foe.y - 32, 68, '#7be0ff', .32);
      this.veePanel(foe.x, foe.y - 98, 'AD BREAK', 'SLOWED', '#7be0ff', .64, true);
    }, 120 + i * 40));
    (allies || []).slice(0, maxTargets).forEach((ally, i) => setTimeout(() => {
      if (this.graphicsQuality > 33 && this.particleMode !== 'off') this.ring(ally.x, ally.y - 32, 70, '#75e65f', .32);
      this.sparkle(ally.x, ally.y - 55, this.graphicsQuality >= 67 ? 3 : 2, '#aef6a8');
    }, 150 + i * 34));
  },

  flyteWindRibbon(x1, y1, x2, y2, dur, col, delay) {
    if (!this.front) return;
    setTimeout(() => {
      const dx = x2 - x1, dy = y2 - y1, len = Math.max(30, Math.hypot(dx, dy));
      const n = el('div', 'flyte-wind-ribbon-live');
      n.style.cssText += `left:${x1}px;top:${y1}px;width:${len}px;--flyte-ribbon:${col || '#bfefff'};
        transform:rotate(${Math.atan2(dy, dx)}rad) scaleX(.08);transition:transform ${dur || .38}s cubic-bezier(.12,.8,.25,1),opacity .12s`;
      this.front.appendChild(n);
      requestAnimationFrame(() => { n.style.opacity = .9; n.style.transform = `rotate(${Math.atan2(dy, dx)}rad) scaleX(1)`; });
      setTimeout(() => { n.style.transition = 'opacity .24s,filter .24s'; n.style.opacity = 0; n.style.filter = 'blur(5px)'; }, (dur || .38) * 1000);
      setTimeout(() => n.remove(), (dur || .38) * 1000 + 300);
    }, delay || 0);
  },

  flyteGust(x, y, tx, ty, radius, dur) {
    if (!this.back) return;
    this.flyteWindRibbon(x, y - 58, tx, ty - 45, .42, '#bfefff');
    const size = clamp(radius || 180, 126, 230), zone = el('div', 'flyte-gust-zone-live');
    zone.style.cssText += `left:${tx - size / 2}px;top:${ty - size * .24}px;width:${size}px;height:${size * .48}px`;
    zone.innerHTML = '<i></i><i></i><i></i><i></i><span></span>';
    this.back.appendChild(zone);
    requestAnimationFrame(() => zone.classList.add('active'));
    this.ring(tx, ty - 24, size * .72, '#bfefff', .42);
    this.sparkle(tx, ty - 55, 7, '#e9ffff');
    setTimeout(() => { zone.classList.remove('active'); zone.classList.add('leaving'); }, Math.max(.7, (dur || 5) - .45) * 1000);
    setTimeout(() => zone.remove(), (dur || 5) * 1000 + 120);
  },

  flyteRescue(x, y, tx, ty) {
    this.flyteWindRibbon(x, y - 58, tx, ty - 56, .24, '#dffcff');
    this.flyteWindRibbon(x, y - 43, tx, ty - 35, .27, '#86dff5', 25);
    const dome = el('div', 'flyte-rescue-dome-live');
    dome.style.cssText += `left:${tx - 57}px;top:${ty - 124}px`;
    dome.innerHTML = '<i></i><i></i><i></i>';
    this.front.appendChild(dome);
    requestAnimationFrame(() => dome.classList.add('active'));
    this.ring(tx, ty - 33, 118, '#bfefff', .38);
    setTimeout(() => { dome.classList.remove('active'); dome.classList.add('leaving'); }, 650);
    setTimeout(() => dome.remove(), 980);
    this.floatIcon(tx, ty - 111, 'SHIELD', '#dffcff');
  },

  flyteClearWay(x, y, toX, dur) {
    const dir = toX >= x ? 1 : -1;
    for (let i = 0; i < 4; i++) this.flyteWindRibbon(x - dir * i * 14, y - 76 + i * 18, toX, y - 68 + i * 15,
      (dur || .38) + i * .025, i % 2 ? '#8de0f4' : '#e5ffff', i * 18);
    this.sweep(x - dir * 35, y, dir, dur || .38, '#8de0f4');
  },

  flytePass(x, y, ally) {
    this.ring(x, y - 34, ally ? 76 : 94, ally ? '#8be4a0' : '#bfefff', .30);
    this.burst(x, y - 50, ally ? 4 : 7, ally ? ['#8be4a0', '#dfffc5'] : ['#bfefff', '#82d8ee', '#fff'], {
      shape: 'streak', spMin: 55, spMax: ally ? 130 : 190, lift: 30, sMin: 3, sMax: 7, life: .42
    });
    this.floatIcon(x, y - 96, ally ? 'HASTE' : 'PUSH', ally ? '#bdf5c7' : '#dffcff');
  },

  flyteCyclone(x, y, tx, ty, radius, dur) {
    if (!this.back) return;
    const size = clamp(radius || 260, 180, 360);
    this.flyteWindRibbon(x, y - 65, tx, ty - 50, .45, '#bfefff');
    this.flyteWindRibbon(x, y - 45, tx, ty - 35, .50, '#86dff5', 20);

    const storm = el('div', 'flyte-cyclone-vanguard active');
    storm.style.cssText += `left:${tx - size / 2}px;top:${ty - size * .32}px;width:${size}px;height:${size * .64}px`;
    storm.innerHTML = '<div class="cyclone-eye"></div><div class="cyclone-swirl c1"></div><div class="cyclone-swirl c2"></div><div class="cyclone-swirl c3"></div><div class="cyclone-rings"></div>';
    this.back.appendChild(storm);

    this.ring(tx, ty - 30, size * .75, '#bfefff', .55);
    this.ring(tx, ty - 30, size * .45, '#e9ffff', .45);
    this.sparkle(tx, ty - 60, 14, '#e9ffff');
    Sound.play('tornado_s', { vol: .65 });

    setTimeout(() => {
      storm.classList.remove('active');
      storm.classList.add('leaving');
    }, Math.max(.7, (dur || 8) - .5) * 1000);
    setTimeout(() => storm.remove(), (dur || 8) * 1000 + 150);
  },

  flyteWingSlam(x, y, tx, ty) {
    this.flyteWindRibbon(x, y - 60, tx, ty - 55, .20, '#dffcff');
    this.flyteWindRibbon(x, y - 40, tx, ty - 35, .24, '#7ee8f7', 15);
    const slam = el('div', 'flyte-wing-slam active');
    slam.style.cssText += `left:${tx - 65}px;top:${ty - 110}px;width:130px;height:130px`;
    slam.innerHTML = '<div class="slam-shockwave"></div><div class="slam-feathers"></div><div class="slam-crater"></div>';
    this.front.appendChild(slam);

    this.ring(tx, ty - 32, 130, '#80e5ff', .45);
    this.ring(tx, ty - 32, 70, '#fff', .3);
    this.burst(tx, ty - 45, 12, ['#bfefff', '#80e5ff', '#fff'], {
      shape: 'streak', spMin: 120, spMax: 260, lift: 45, sMin: 4, sMax: 9, life: .45
    });
    this.floatIcon(tx, ty - 115, '🦅 WING SLAM!', '#80e5ff');

    setTimeout(() => { slam.classList.remove('active'); slam.classList.add('leaving'); }, 420);
    setTimeout(() => slam.remove(), 700);
  },

  flyteMockingSwoop(x, y, tx, ty, dur) {
    this.flyteWindRibbon(x, y - 60, tx, ty - 55, .28, '#ffe066');
    this.flyteWindRibbon(x, y - 40, tx, ty - 35, .32, '#80e5ff', 20);

    const shield = el('div', 'flyte-mocking-diversion active');
    shield.style.cssText += `left:${tx - 70}px;top:${ty - 130}px;width:140px;height:140px`;
    shield.innerHTML = '<div class="diversion-aura"></div><div class="diversion-prisms"></div><div class="diversion-glyph">🦋</div>';
    this.front.appendChild(shield);

    this.ring(tx, ty - 32, 140, '#ffe066', .45);
    this.sparkle(tx, ty - 50, 10, '#fff3b0');
    this.floatIcon(tx, ty - 120, '🦋 MOCKING SWOOP', '#ffe066');

    setTimeout(() => { shield.classList.remove('active'); shield.classList.add('leaving'); }, Math.max(.5, (dur || 4.5) - .4) * 1000);
    setTimeout(() => shield.remove(), (dur || 4.5) * 1000 + 120);
  },

  flyteStubbornDowndraft(x, y, ax, ay) {
    const down = el('div', 'flyte-stubborn-downdraft active');
    down.style.cssText += `left:${ax - 60}px;top:${ay - 120}px;width:120px;height:130px`;
    down.innerHTML = '<div class="downdraft-cone"></div><div class="downdraft-impact"></div>';
    this.front.appendChild(down);

    this.ring(ax, ay - 30, 110, '#80e5ff', .4);
    this.burst(ax, ay - 40, 10, ['#80e5ff', '#bfefff', '#fff'], {
      shape: 'streak', spMin: 90, spMax: 210, lift: -20, sMin: 3, sMax: 8, life: .38
    });
    this.floatIcon(ax, ay - 105, '🌪️ TURBULENCE', '#80e5ff');

    setTimeout(() => { down.classList.remove('active'); down.classList.add('leaving'); }, 400);
    setTimeout(() => down.remove(), 680);
  },

  /** Drifting wing/feather particles shared by every Flutter effect. */
  flutterFeathers(x, y, n, col, opt) {
    if (!this.front || this.reducedEffects || !this.effectAllowed(2)) return;
    opt = opt || {};
    const cols = col ? [col] : ['#f1ffff', '#bff6ff', '#8fe6f3'];
    for (let i = 0; i < n; i++) {
      const a = (opt.dir != null ? opt.dir : Math.random() * Math.PI * 2) + (Math.random() - .5) * (opt.spread || 2.4);
      const sp = (opt.spMin || 40) + Math.random() * ((opt.spMax || 130) - (opt.spMin || 40));
      this.part({ x: x + (Math.random() - .5) * (opt.jitter || 14), y: y + (Math.random() - .5) * 10,
        vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - (opt.lift == null ? 30 : opt.lift), g: 120, drag: 1.1,
        size: 11 + Math.random() * 8, col: cols[i % cols.length], shape: 'txt', char: i % 3 ? '🪶' : '🪽',
        life: .9 + Math.random() * .5, spin: (Math.random() - .5) * 220, rot: Math.random() * 360 });
    }
  },

  /** Lift stack gained: a rising wing chevron whose size follows the stack count. */
  flutterLift(u, stacks, max) {
    if (!u || !this.front || this.reducedEffects || !this.effectAllowed(2)) return;
    const full = stacks >= max;
    this.ring(u.x, u.y - 46, 56 + stacks * 9, full ? '#ffffff' : '#a8effb', full ? .42 : .26);
    this.flutterFeathers(u.x, u.y - 55, full ? 14 : 3 + stacks, full ? '#ffffff' : null,
      { dir: -Math.PI / 2, spread: 1.7, spMin: 30, spMax: full ? 170 : 95, lift: 20 });
    this.floatIcon(u.x, u.y - 96, '🪽'.repeat(Math.min(5, stacks)), full ? '#ffffff' : '#bff6ff');
  },

  /** Off Balance: a dizzy ring of stars circles the enemy's head. */
  flutterDizzy(target) {
    if (!target || !this.front || this.reducedEffects || !this.effectAllowed(2)) return;
    for (let i = 0; i < 4; i++) {
      const a = i / 4 * Math.PI * 2;
      this.part({ x: target.x + Math.cos(a) * 20, y: target.y - 92 + Math.sin(a) * 6,
        vx: -Math.sin(a) * 90, vy: Math.cos(a) * 24, g: 0, drag: 1.4, size: 12, col: '#e9ffff',
        shape: 'txt', char: i % 2 ? '💫' : '✦', life: .75, fade: true });
    }
  },

  flutterEntry(x, y, toX, dir, dur) {
    if (!this.front) return;
    this.flyteWindRibbon(x, y - 78, toX, y - 72, dur || .52, '#d8fbff', 0);
    this.flyteWindRibbon(x, y - 56, toX, y - 50, (dur || .52) + .06, '#7ee8f7', 18);
    this.burst(x, y - 62, 15, ['#eaffff', '#9cecf8', '#6bd5ea'], { shape: 'streak', spMin: 100, spMax: 260, lift: 42, sMin: 3, sMax: 8, life: .5 });
    this.ring(x, y - 42, 84, '#d8fbff', .32);
    this.flutterFeathers(x, y - 62, 12, null, { dir: dir > 0 ? Math.PI : 0, spread: 1.4, spMin: 80, spMax: 220 });
  },

  flutterDash(x, y, toX, dir, dur, returning) {
    if (!this.front) return;
    const col = returning ? '#f1ffff' : '#a8effb';
    this.flyteWindRibbon(x, y - 70, toX, y - 65, dur || .36, col, returning ? 15 : 0);
    this.flyteWindRibbon(x, y - 45, toX, y - 40, (dur || .36) + .05, returning ? '#73d9ed' : '#d9fcff', returning ? 30 : 22);
    this.sweep(x, y - 54, dir || 1, dur || .36, col);
    // Feathers are shed along the whole flight path, not just at the start.
    const steps = returning ? 6 : 5, d = (dur || .36) * 1000;
    for (let i = 0; i < steps; i++) setTimeout(() =>
      this.flutterFeathers(x + (toX - x) * ((i + .5) / steps), y - 58, returning ? 3 : 2, col,
        { dir: dir > 0 ? Math.PI : 0, spread: 1.2, spMin: 20, spMax: 90, lift: 10 }), d * i / steps);
  },

  flutterGust(x, y, tx, ty, radius, face) {
    if (!this.back) return;
    const size = Math.max(110, Math.min(360, radius || 250));
    this.flyteWindRibbon(x, y - 56, tx, ty - 50, .42, '#baf6ff', 0);
    this.wave(tx, ty - 46, size, '#baf6ff', .42);
    this.flutterFeathers(tx, ty - 52, 9, null, { dir: face > 0 ? 0 : Math.PI, spread: 1.1, spMin: 90, spMax: 240, jitter: size * .35 });
    const n = el('div');
    n.className = 'flutter-gust-live';
    n.style.cssText = `left:${Math.min(x, tx) - size * .24}px;top:${Math.min(y, ty) - 96}px;width:${size}px;height:92px;--flutter-face:${face || 1}`;
    n.innerHTML = '<i></i><i></i><i></i><b>WINGBEAT</b>';
    this.back.appendChild(n);
    requestAnimationFrame(() => n.classList.add('active'));
    setTimeout(() => n.classList.add('leaving'), 260);
    setTimeout(() => n.remove(), 650);
  },

  flutterTrail(x, y, face, dur) {
    if (!this.back) return;
    const n = el('div');
    n.className = 'flutter-trail-live';
    n.style.cssText = `left:${x - 42}px;top:${y - 55}px;--flutter-face:${face || 1}`;
    this.back.appendChild(n);
    this.flutterFeathers(x, y - 50, 2, null, { dir: face > 0 ? Math.PI : 0, spread: .9, spMin: 10, spMax: 55, lift: 5 });
    requestAnimationFrame(() => n.classList.add('active'));
    setTimeout(() => n.classList.add('leaving'), Math.max(120, (dur || .42) * 1000));
    setTimeout(() => n.remove(), Math.max(360, (dur || .42) * 1000 + 260));
  },

  flutterWingstorm(x, y, radius, dur) {
    if (!this.back) return;
    const size = Math.max(180, Math.min(430, (radius || 280) * 1.55));
    const n = el('div');
    n.className = 'flutter-wingstorm-live';
    n.style.cssText = `left:${x - size / 2}px;top:${y - size * .60}px;width:${size}px;height:${size * .72}px`;
    n.innerHTML = '<i></i><i></i><i></i><i></i><b>WINGSTORM</b>';
    this.back.appendChild(n);
    this.ring(x, y - 40, size * .9, '#ffffff', .5);
    this.flutterFeathers(x, y - 50, 22, null, { spread: Math.PI * 2, spMin: 80, spMax: 260, jitter: size * .5, lift: 50 });
    // The storm keeps shedding feathers for its whole duration.
    const total = Math.max(1, Math.min(8, Math.round((dur || 5.5) * .9)));
    for (let i = 1; i <= total; i++) setTimeout(() =>
      this.flutterFeathers(x, y - 50, 5, null, { spread: Math.PI * 2, spMin: 40, spMax: 160, jitter: size * .55, lift: 40 }),
      (dur || 5.5) * 1000 * i / (total + 1));
    requestAnimationFrame(() => n.classList.add('active'));
    setTimeout(() => n.classList.add('leaving'), Math.max(400, (dur || 5.5) * 1000 - 360));
    setTimeout(() => n.remove(), Math.max(700, (dur || 5.5) * 1000 + 120));
  },

  flutterHit(target, returning) {
    if (!target) return;
    this.ring(target.x, target.y - 42, returning ? 112 : 86, returning ? '#f1ffff' : '#9cecf8', .28);
    this.burst(target.x, target.y - 54, returning ? 11 : 7, ['#f1ffff', '#8fe6f3', '#5ec9df'], { shape: 'streak', spMin: 65, spMax: 180, lift: 26, life: .34 });
    [-1, 1].forEach((d, i) => setTimeout(() => this.slash(target.x + d * 12, target.y - 52,
      { col: i ? '#9cecf8' : '#ffffff', ang: d * 32, small: !returning }), i * 40));
    this.flutterFeathers(target.x, target.y - 54, returning ? 8 : 5);
  },

  flutterIntercept(target) {
    if (!target) return;
    this.ring(target.x, target.y - 45, 88, '#f1ffff', .3);
    this.floatIcon(target.x, target.y - 100, '✖ AIR CUT', '#d8fbff');
    this.burst(target.x, target.y - 55, 9, ['#fff', '#a8effb'], { shape: 'streak', spMin: 70, spMax: 190, lift: 24, life: .3 });
    this.slash(target.x, target.y - 52, { col: '#ffffff', ang: -32, small: true });
    this.slash(target.x, target.y - 52, { col: '#a8effb', ang: 32, small: true });
    this.flutterFeathers(target.x, target.y - 55, 6);
  },

  flutterFlyby(u) {
    if (!u) return;
    this.sweep(u.x, u.y - 52, u.face || 1, .38, '#baf6ff');
    this.flutterFeathers(u.x, u.y - 52, 6, null, { dir: u.face > 0 ? Math.PI : 0, spread: 1, spMin: 40, spMax: 150 });
    this.floatIcon(u.x, u.y - 105, 'FLY-BY', '#eaffff');
  },

  flutterSilent(a, b) {
    if (a) { this.floatIcon(a.x, a.y - 102, 'DISTRACTED', '#d8fbff'); this.flutterDizzy(a); }
    if (b) { this.floatIcon(b.x, b.y - 102, 'SKILL DELAY', '#b5eaf5'); this.ring(b.x, b.y - 50, 74, '#b5eaf5', .3); }
  },

  /** A short, quiet target line. It makes retargeting readable without
      becoming a permanent HUD element across the middle of the fight. */
  targetLine(from, to, col) {
    if (!this.front || !from || !to) return;
    const x1 = from.x, y1 = from.y - 62, x2 = to.x, y2 = to.y - 62;
    const dx = x2 - x1, dy = y2 - y1, len = Math.hypot(dx, dy);
    const n = el('div');
    n.style.cssText = `position:absolute;left:${x1}px;top:${y1}px;width:${len}px;height:2px;
      transform-origin:0 50%;transform:rotate(${Math.atan2(dy, dx)}rad) scaleX(.2);opacity:0;
      pointer-events:none;background:linear-gradient(90deg,${col || '#e9f6ff'},transparent);
      box-shadow:0 0 6px ${col || '#e9f6ff'};z-index:5`;
    this.front.appendChild(n);
    requestAnimationFrame(() => { n.style.transition = 'transform .12s ease-out,opacity .1s'; n.style.opacity = .72; n.style.transform = `rotate(${Math.atan2(dy, dx)}rad) scaleX(1)`; });
    setTimeout(() => { n.style.transition = 'opacity .18s'; n.style.opacity = 0; }, 120);
    setTimeout(() => n.remove(), 340);
  },

  /* ---------- primitives ---------- */
  ok() { return !!this.front; },

  particleCap() {
    // The stage width is stable for a battle. Reading clientWidth from every
    // particle spawn could force layout after the render loop writes styles.
    const base = this._particleBase || 150;
    return Math.max(this._particleMin || 36, Math.round(base * this.quality));
  },

  // A few authored effects create several animated DOM nodes at once. During
  // a dense 5v5, cap those transient clusters per short time slice while
  // leaving the particle pool and important hit sparks intact.
  effectAllowed(cost) {
    if (!this._combatLoad) return true;
    const now = performance.now();
    if (now - this._effectWindowAt >= 90) {
      this._effectWindowAt = now;
      this._effectWindowCount = 0;
    }
    cost = cost || 1;
    if (this._effectWindowCount + cost > this._effectWindowCap) return false;
    this._effectWindowCount += cost;
    return true;
  },

  trimPops() {
    const keep = this._popCap || 36;
    while (this.pop && this.pop.children && this.pop.children.length >= keep) {
      const first = this.pop.firstElementChild || this.pop.children[0];
      if (first && typeof first.remove === 'function') {
        first.remove();
      } else if (this.pop.children && this.pop.children.shift) {
        this.pop.children.shift();
      } else {
        break;
      }
    }
  },

  trimParts(max) {
    const keep = Math.max(0, max == null ? this.particleCap() : max);
    while (this.parts.length > keep) {
      const p = this.parts.shift();
      if (p && p.n) p.n.remove();
    }
  },

  particlesSuppressed() {
    return this.particleMode === 'off' || this.graphicsQuality <= 33 || this._particleCooldownUntil > performance.now();
  },

  tripParticleBreaker() {
    const now = performance.now();
    if (!this._denseParty || this._particleCooldownUntil > now) return;
    // Remove every active physics particle immediately. This is deliberately
    // separate from trimParts(): the next twenty seconds must not refill the
    // pool through a delayed multi-hit or scheduled skill callback.
    for (let i = 0; i < this.parts.length; i++) {
      const p = this.parts[i];
      if (p && p.n) p.n.remove();
    }
    this.parts.length = 0;
    this._particleCooldownUntil = now + 20000;
  },

  node(layer, css, life) {
    const n = el('div', 'p'); n.style.cssText = css;
    (layer === 'f' ? this.front : this.back).appendChild(n);
    if (life) setTimeout(() => n.remove(), life * 1000);
    return n;
  },

  /** Physics particle. opt: {x,y,vx,vy,g,size,col,life,shape,fade,spin,scale} */
  part(opt) {
    if (!this.front || this.reducedEffects || this.particlesSuppressed()) return;
    const cap = this.particleCap();
    if (this._denseParty && this.parts.length >= Math.min(cap, this._particleTripAt)) {
      this.tripParticleBreaker();
      return;
    }
    if (this.parts.length >= cap) return;
    const n = el('div', 'p');
    const s = opt.size || 6;
    const shape = opt.shape || 'dot';
    const alpha = clamp(opt.alpha == null ? 1 : opt.alpha, 0, 1);
    // Particle positions are applied by the update transform below. Keeping
    // the element anchored at the FX layer origin avoids adding x/y twice,
    // which was pushing floor effects toward the bottom edge of the stage.
    let css = `left:0;top:0;width:${s}px;height:${s}px;opacity:${alpha};transform-origin:50% 50%;will-change:transform,opacity;`;
    if (shape === 'dot') {
      css += `border-radius:50%;background:radial-gradient(circle at 32% 27%,#fff9 0 9%,${opt.col} 28%,${opt.col}cc 66%,transparent 100%);`;
      if (this.quality > .52) css += `filter:drop-shadow(0 0 ${Math.max(2, s * .7)}px ${opt.col});`;
    }
    else if (shape === 'sq') css += `border-radius:${Math.max(1, s * .12)}px;background:linear-gradient(135deg,#fff8 0 12%,${opt.col} 30% 72%,#0004);box-shadow:0 1px 2px #0008;`;
    else if (shape === 'streak') css += `width:${Math.max(s * 2.8, 9)}px;height:${Math.max(2, s / 3)}px;background:linear-gradient(90deg,transparent 0%,${opt.col}66 35%,#fff9 58%,${opt.col} 100%);border-radius:99px;filter:drop-shadow(0 0 ${Math.max(1, s * .55)}px ${opt.col});`;
    else if (shape === 'ring') css += `border:2px solid ${opt.col};border-radius:50%;background:radial-gradient(circle,transparent 50%,${opt.col}22 75%,transparent 76%);`;
    else if (shape === 'txt') { css += `font-size:${s}px;line-height:1;width:auto;height:auto;color:${opt.col};text-shadow:0 1px 2px #000,0 0 5px ${opt.col};`; }
    else if (shape === 'paper') { css += `background:${opt.col};border-radius:1px;
      box-shadow:inset 1px 1px #fff8,0 0 0 1px rgba(0,0,0,.4),1px 2px 2px rgba(0,0,0,.35);`; }
    else if (shape === 'ink') { css += `background:${opt.col};border-radius:62% 38% 57% 43% / 46% 61% 39% 54%;
      box-shadow:inset 2px 1px #fff2,0 1px 0 #050507,1px 2px 2px rgba(0,0,0,.52);`; }
    else if (shape === 'shard') { css += `background:linear-gradient(135deg,#fff9 0 9%,${opt.col} 24% 72%,#0005);
      clip-path:polygon(50% 0%,100% 38%,82% 100%,18% 100%,0% 38%);
      filter:drop-shadow(0 0 ${Math.max(1, s * .45)}px ${opt.col}) drop-shadow(1px 1px 0 rgba(0,0,0,.4));`; }
    n.style.cssText = css;
    if (shape === 'txt') n.textContent = opt.char || '✦';
    (opt.layer === 'b' ? this.back : this.front).appendChild(n);
    this.parts.push({
      n, x: opt.x, y: opt.y, vx: opt.vx || 0, vy: opt.vy || 0, g: opt.g == null ? 900 : opt.g,
      life: opt.life || .6, t: 0, spin: opt.spin || 0, rot: opt.rot || 0,
      scale: opt.scale == null ? 1 : opt.scale, dscale: opt.dscale || 0,
      alpha, drag: opt.drag == null ? 0 : opt.drag, fade: opt.fade !== false
    });
    return n;
  },

  burst(x, y, n, col, opt) {
    if (this.reducedEffects || this.particlesSuppressed()) return;
    opt = opt || {};
    n = Math.round(n * this.quality);
    for (let i = 0; i < n; i++) {
      const a = opt.dir != null ? opt.dir + rnd(-opt.spread || -.7, opt.spread || .7) : rnd(0, Math.PI * 2);
      const sp = rnd(opt.spMin || 90, opt.spMax || 340);
      this.part({
        x: x + rnd(-6, 6), y: y + rnd(-6, 6),
        vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - (opt.lift || 0),
        g: opt.g == null ? 700 : opt.g, size: rnd(opt.sMin || 3, opt.sMax || 8),
        col: Array.isArray(col) ? pick(col) : col, life: rnd(.3, opt.life || .8),
        shape: opt.shape || 'dot', spin: rnd(-12, 12),
        dscale: opt.dscale == null ? rnd(-.18, .16) : opt.dscale,
        alpha: opt.alpha == null ? rnd(.78, 1) : opt.alpha,
        drag: opt.drag == null ? .06 : opt.drag
      });
    }
  },

  /* ---------- update pump ---------- */
  update(dt) {
    if (this._denseVisualSafe) {
      // Detached hosts protect authored DOM effects; also skip the particle
      // transform pump so a high-frequency Waxwell fight cannot monopolize
      // the main thread on its render path.
      this.parts.length = 0;
      return;
    }
    // If the browser misses several frames in a row, reduce only new particle
    // bursts. The simulation and authored action timing stay deterministic,
    // while the next few impacts stop adding work to an already busy frame.
    const qualityCeiling = this.graphicsCeiling();
    if (dt > FX_TARGET_FRAME_SEC * 1.35) {
      this._slowFrames++;
      this._qualityRecover = 0;
      if (this._slowFrames >= 4 && this.quality > .62) {
        this.quality = Math.max(.62, this.quality - .12);
        this.trimParts();
      }
    } else if (this.quality < qualityCeiling) {
      this._slowFrames = 0;
      this._qualityRecover += dt;
      if (this._qualityRecover > 1.8) {
        this.quality = Math.min(qualityCeiling, this.quality + .06);
        this._qualityRecover = 0;
      }
    } else {
      this._slowFrames = 0;
    }
    // camera
    if (this.shakeT > 0) {
      this.shakeT -= dt;
      const d = this.shakeMag * Math.min(1, this.shakeT * 5);
      this.panX = rnd(-d, d);
      this._camY = rnd(-d, d);
      if (this.shakeT <= 0) { this.shakeMag = 0; this.panX = 0; this._camY = 0; }
    }
    if (this.zoomT > 0) { this.zoomT -= dt; this.zoom = lerp(this.zoom, 1, dt * 8); if (this.zoomT <= 0) this.zoom = 1; }
    const stageTransform =
      `translate(${this.panX.toFixed(1)}px,${(this._camY || 0).toFixed(1)}px) scale(${this.zoom.toFixed(3)})`;
    if (stageTransform !== this._stageTransform) {
      this._stageTransform = stageTransform;
      this.stage.style.transform = stageTransform;
    }

    // Particles do not need the full simulation render rate. Updating their
    // transforms at 30 FPS on handhelds cuts a large amount of per-frame DOM
    // style work while keeping short bursts visually smooth enough.
    this._particleAccum += dt;
    if (this._particleAccum < this._particleInterval) return;
    const particleDt = this._particleAccum;
    this._particleAccum = 0;

    // particles
    for (let i = this.parts.length - 1; i >= 0; i--) {
      const p = this.parts[i];
      p.t += particleDt;
      if (p.t >= p.life) { p.n.remove(); this.parts.splice(i, 1); continue; }
      if (p.drag) { p.vx -= p.vx * p.drag * particleDt; p.vy -= p.vy * p.drag * particleDt; }
      p.vy += p.g * particleDt;
      p.x += p.vx * particleDt; p.y += p.vy * particleDt;
      p.rot += p.spin * particleDt;
      const k = 1 - p.t / p.life;
      const sc = p.scale + p.dscale * (1 - k);
      p.n.style.transform = `translate(${p.x.toFixed(1)}px,${p.y.toFixed(1)}px) rotate(${p.rot.toFixed(2)}rad) scale(${sc.toFixed(2)})`;
      if (p.fade) p.n.style.opacity = (p.alpha * (k < .35 ? k / .35 : 1)).toFixed(2);
    }
  },

  /* ---------- composed effects ---------- */

  /** An 8-point comic star polygon used by hitSpark/boom - the "impact" shape
      that ties the whole FX pass to the paper-cutout look (flat fill, hard
      points) instead of the soft airbrushed blobs it replaces. */
  _starClip: 'polygon(50% 0%,61% 28%,90% 22%,72% 45%,100% 50%,72% 55%,90% 78%,61% 72%,' +
    '50% 100%,39% 72%,10% 78%,28% 55%,0% 50%,28% 45%,10% 22%,39% 28%)',

  slash(x, y, opt) {
    opt = opt || {};
    if (!this.effectAllowed(2)) return;
    const w = opt.big ? 260 : opt.small ? 100 : 175;
    const h = opt.big ? 26 : opt.small ? 10 : 16;
    const col = opt.col || '#fff';
    const ang = opt.ang || 0;
    const draw = (delay, fade) => {
      const n = el('div', 'slash');
      n.style.cssText = `left:${x - w / 2}px;top:${y - h / 2}px;width:${w}px;height:${h}px;
        background:linear-gradient(90deg,transparent,${col},#fff,${col},transparent);
        border-radius:50%;filter:blur(1px) drop-shadow(0 0 10px ${col});
        transform:rotate(${ang}deg) scaleX(.15);opacity:0`;
      this.front.appendChild(n);
      setTimeout(() => {
        n.style.transition = 'transform .11s cubic-bezier(.1,.9,.3,1),opacity .11s';
        n.style.transform = `rotate(${ang}deg) scaleX(1.1)`;
        n.style.opacity = fade;
        setTimeout(() => { n.style.transition = 'opacity .16s,transform .16s'; n.style.opacity = 0;
          n.style.transform = `rotate(${ang}deg) scaleX(1.35)`; }, 100);
      }, delay);
      setTimeout(() => n.remove(), delay + 340);
    };
    draw(0, 1);
    // a fainter, slightly offset ghost fired a beat later reads as motion blur
    if (!this._combatLoad || this.effectAllowed(1)) draw(45, .45);
    this.burst(x, y, 8, col, { spMin: 120, spMax: 340, sMin: 2, sMax: 6, shape: 'streak', g: 300 });
    // note: no hitSpark here - Battle.damage() already fires one on every
    // solid hit, and slash() is almost always paired with a damage() call an
    // instant later, so adding one here would just double it up.
  },

  boom(x, y, scale, col) {
    scale = scale || 1;
    if (!this.effectAllowed(3)) return;
    const r = 70 * scale;
    const n = el('div');
    n.style.cssText = `position:absolute;left:${x - r}px;top:${y - r}px;width:${r * 2}px;height:${r * 2}px;
      border-radius:50%;background:radial-gradient(circle,#fff 0%,${col} 35%,transparent 70%);
      transform:scale(.2);opacity:1;pointer-events:none`;
    this.front.appendChild(n);
    requestAnimationFrame(() => {
      n.style.transition = 'transform .26s cubic-bezier(.1,.8,.3,1),opacity .3s';
      n.style.transform = 'scale(1.15)'; n.style.opacity = 0;
    });
    setTimeout(() => n.remove(), 400);
    // a jagged comic sunburst punched through the soft glow, cutout-style
    const star = el('div');
    const sr = r * 1.6;
    star.style.cssText = `position:absolute;left:${x - sr / 2}px;top:${y - sr / 2}px;width:${sr}px;height:${sr}px;
      background:${col};clip-path:${this._starClip};opacity:.9;transform:scale(.3) rotate(${rnd(-20, 20)}deg);
      pointer-events:none;filter:drop-shadow(0 2px 0 rgba(0,0,0,.35))`;
    this.front.appendChild(star);
    requestAnimationFrame(() => {
      star.style.transition = 'transform .22s cubic-bezier(.1,1.5,.3,1),opacity .3s';
      star.style.transform = `scale(1) rotate(${rnd(-8, 8)}deg)`; star.style.opacity = 0;
    });
    setTimeout(() => star.remove(), 380);
    this.ring(x, y, r * 2.4, col, .35);
    this.burst(x, y, 14 * scale, col, { spMin: 150, spMax: 420 * scale, lift: 60, sMax: 9, shape: 'shard' });
  },

  /** A target-bound lightning strike. Unlike boom(), this reads from the sky
      down to the target so magic attacks have a distinct elemental silhouette
      instead of looking like another orange impact explosion. */
  thunder(x, y, opt) {
    if (!this.front || !this.back) return;
    opt = opt || {};
    if (!this.effectAllowed(3)) return;
    const size = opt.size || 112;
    const col = opt.col || '#8edcff';
    const delay = opt.delay || 0;
    const top = y - size * 1.62;
    const bolts = [
      { dx: 0, w: .34, h: 1, opacity: .98, col: '#f4ffff' },
      { dx: -size * .16, w: .18, h: .82, opacity: .72, col },
      { dx: size * .15, w: .15, h: .72, opacity: .62, col: '#c4f5ff' }
    ];
    const clip = 'polygon(42% 0,68% 0,55% 27%,78% 27%,39% 58%,52% 58%,15% 100%,28% 61%,7% 61%,43% 29%,25% 29%)';
    (this._combatLoad ? bolts.slice(0, 1) : bolts).forEach((b, i) => {
      const w = size * b.w, h = size * (1.62 * b.h);
      const n = el('div');
      n.style.cssText = `position:absolute;left:${x - w / 2 + b.dx}px;top:${top + (1 - b.h) * size * .42}px;
        width:${w}px;height:${h}px;background:linear-gradient(90deg,transparent 0%,${b.col} 38%,#fff 52%,${b.col} 68%,transparent 100%);
        clip-path:${clip};filter:drop-shadow(0 0 8px ${col}) drop-shadow(0 0 16px ${col});
        transform:translateY(-18px) scaleY(.18);transform-origin:50% 100%;opacity:0;pointer-events:none`;
      this.front.appendChild(n);
      setTimeout(() => {
        requestAnimationFrame(() => {
          n.style.transition = 'transform .12s cubic-bezier(.1,1.3,.3,1),opacity .05s';
          n.style.transform = 'translateY(0) scaleY(1)';
          n.style.opacity = b.opacity;
        });
      }, delay + i * 18);
      setTimeout(() => {
        n.style.transition = 'opacity .16s,transform .16s';
        n.style.opacity = 0; n.style.transform = 'translateY(8px) scaleY(1.08)';
      }, delay + 130 + i * 18);
      setTimeout(() => n.remove(), delay + 340 + i * 18);
    });
    this.ring(x, y, size * .92, col, .28);
    this.hitSpark(x, y - 24, '#efffff', { big: true });
    this.burst(x, y - 20, 10, [col, '#efffff', '#6fc8ff'], {
      spMin: 80, spMax: 240, lift: 45, sMin: 2, sMax: 7, shape: 'streak', life: .42
    });
  },

  /** The universal "something just got hit" punch - fired on every solid
      combat hit, not just the composed slash/boom skill effects, so ordinary
      basic attacks carry real impact instead of just a floating number. */
  hitSpark(x, y, col, opt) {
    opt = opt || {};
    const big = !!opt.big;
    // Basic attacks can land in a dense cluster during an AoE or multi-hit
    // sequence. Keep the authored large impacts, but coalesce tiny generic
    // sparks so ten simultaneous attackers do not build a second DOM burst
    // layer on top of the actual damage feedback.
    if (!big && this._smallSparkInterval) {
      const now = performance.now();
      if (now - this._lastSmallSpark < this._smallSparkInterval) return;
      this._lastSmallSpark = now;
    }
    const s = big ? 62 : 30;
    const n = el('div');
    n.style.cssText = `position:absolute;left:${x - s / 2}px;top:${y - s / 2}px;width:${s}px;height:${s}px;
      background:${col};clip-path:${this._starClip};
      filter:drop-shadow(0 0 5px ${col});transform:scale(.25) rotate(${rnd(-18, 18)}deg);
      opacity:0;pointer-events:none`;
    this.front.appendChild(n);
    requestAnimationFrame(() => {
      n.style.transition = 'transform .08s cubic-bezier(.1,1.9,.3,1),opacity .06s';
      n.style.transform = `scale(${big ? 1.25 : 1}) rotate(${rnd(-8, 8)}deg)`;
      n.style.opacity = 1;
      setTimeout(() => {
        n.style.transition = 'transform .15s ease-out,opacity .15s';
        n.style.opacity = 0;
        n.style.transform += ' scale(1.35)';
      }, big ? 90 : 55);
    });
    setTimeout(() => n.remove(), (big ? 90 : 55) + 200);
    if (big) {
      const core = el('div');
      const cs = s * .7;
      core.style.cssText = `position:absolute;left:${x - cs / 2}px;top:${y - cs / 2}px;width:${cs}px;height:${cs}px;
        border-radius:50%;background:radial-gradient(circle,#fff,${col} 60%,transparent 75%);
        transform:scale(.3);opacity:1;pointer-events:none`;
      this.front.appendChild(core);
      requestAnimationFrame(() => { core.style.transition = 'transform .14s,opacity .2s';
        core.style.transform = 'scale(1.5)'; core.style.opacity = 0; });
      setTimeout(() => core.remove(), 280);
    }
    this.burst(x, y, big ? 6 : 3, col, { spMax: big ? 230 : 140, lift: big ? 35 : 12,
      shape: 'shard', sMin: 3, sMax: big ? 9 : 6, life: .35 });
  },

  ring(x, y, size, col, dur) {
    dur = dur || .45;
    if (!this.effectAllowed(1)) return;
    const n = el('div');
    n.style.cssText = `position:absolute;left:${x}px;top:${y}px;width:${size}px;height:${size * .4}px;
      margin-left:${-size / 2}px;margin-top:${-size * .2}px;border:3px solid ${col};border-radius:50%;
      transform:scale(.1);opacity:.95;pointer-events:none;box-shadow:0 0 18px ${col}`;
    this.back.appendChild(n);
    requestAnimationFrame(() => {
      n.style.transition = `transform ${dur}s cubic-bezier(.1,.8,.3,1),opacity ${dur}s`;
      n.style.transform = 'scale(1)'; n.style.opacity = 0;
    });
    setTimeout(() => n.remove(), dur * 1000 + 80);
  },

  /** Ground telegraph that grows for the FULL windup duration then snaps
      away right as the hit lands - unlike ring() (which fades as it grows,
      meant as an impact pop), this stays visible through the whole windup
      so the player can read "how long until this actually connects". */
  telegraph(x, y, size, col, dur) {
    dur = dur || .3;
    const n = el('div');
    n.style.cssText = `position:absolute;left:${x}px;top:${y}px;width:${size}px;height:${size * .4}px;
      margin-left:${-size / 2}px;margin-top:${-size * .2}px;border:2px dashed ${col};border-radius:50%;
      transform:scale(.15);opacity:.85;pointer-events:none;box-shadow:0 0 10px ${col} inset`;
    this.back.appendChild(n);
    requestAnimationFrame(() => {
      n.style.transition = `transform ${dur}s linear,opacity ${Math.max(.08, dur * .2)}s ease ${dur * .8}s`;
      n.style.transform = 'scale(1)'; n.style.opacity = 0;
    });
    setTimeout(() => n.remove(), dur * 1000 + 80);
    return n;
  },

  /** A footstep puff at ground level - used when a unit lands its walk-in. */
  dust(x, groundY, dir) {
    for (let i = 0; i < 5 * this.quality; i++) {
      this.part({ x: x - dir * rnd(4, 16), y: groundY - rnd(0, 6), vx: -dir * rnd(30, 90), vy: rnd(-60, -10),
        g: 260, size: rnd(5, 10), col: 'rgba(200,190,175,.7)', life: rnd(.35, .6), shape: 'dot', drag: 1.2 });
    }
  },

  sparkle(x, y, n, col) {
    for (let i = 0; i < n * this.quality; i++) {
      this.part({ x: x + rnd(-34, 34), y: y + rnd(-34, 34), vx: rnd(-40, 40), vy: rnd(-140, -40),
        g: 120, size: rnd(8, 15), col, life: rnd(.5, 1), shape: 'txt', char: pick(['✦', '✧', '·', '✳']), spin: rnd(-5, 5) });
    }
  },

  floatIcon(x, y, char, col) {
    if (!this.pop) return;
    if (!this.combatNumbers && typeof char === 'string' && char.length > 2) return;
    this.trimPops();
    const str = String(char != null ? char : '');
    const isGlyph = str.length <= 2 && !/[A-Za-z0-9]/.test(str);
    const n = el('div', 'pop ' + (isGlyph ? 'pop-glyph' : 'pop-banner'));
    n.style.left = x + 'px';
    n.style.top = y + 'px';
    if (col) {
      if (isGlyph) {
        n.style.color = col;
      } else {
        n.style.borderColor = col;
        n.style.color = col;
        n.style.boxShadow = `0 4px 12px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,255,255,0.25), 0 0 8px ${col}44`;
      }
    }
    n.textContent = str;
    this.pop.appendChild(n);
    setTimeout(() => { if (n.parentNode) n.remove(); }, 660);
  },

  /** Same beat as floatIcon, but a real item PNG instead of an emoji glyph -
      used by Gigi's item-based kit now that actual Dandy's World item art
      exists. Small and lively on purpose: it's a held item popping up for a
      moment, not a sprite standing on the field, so it gets a soft glow, a
      spin-in, a little sparkle burst and a gentle idle wobble rather than
      just sitting there as a flat static icon. */
  floatItem(x, y, img, col, resolver) {
    if (!this.pop) return;
    this.trimPops();
    const n = el('div', 'pop');
    n.style.cssText = `left:${x}px;top:${y}px;width:20px;height:20px;margin-left:-10px;margin-top:-10px;
      transform:translate(0,0) rotate(-50deg) scale(.2);opacity:0`;
    n.innerHTML = `<div style="position:absolute;inset:-6px;border-radius:50%;
        background:radial-gradient(circle,${col || '#fff3cc'}55,transparent 70%);filter:blur(1px)"></div>
      <img src="${(resolver || Art.item)(img)}" style="position:relative;width:100%;height:100%;object-fit:contain;
        filter:drop-shadow(0 2px 3px rgba(0,0,0,.5))">`;
    this.pop.appendChild(n);
    this.sparkle(x, y, 3, col || '#fff3cc');
    requestAnimationFrame(() => {
      n.style.transition = 'transform .32s cubic-bezier(.2,1.8,.35,1),opacity .2s';
      n.style.transform = 'translate(0,-28px) rotate(8deg) scale(1)'; n.style.opacity = 1;
      setTimeout(() => {
        n.style.transition = 'transform .9s ease-in-out';
        n.style.transform = 'translate(0,-40px) rotate(-6deg) scale(1)';
      }, 320);
      setTimeout(() => { n.style.transition = 'transform .4s,opacity .4s'; n.style.opacity = 0;
        n.style.transform = 'translate(0,-60px) rotate(10deg) scale(.8)'; }, 900);
    });
    setTimeout(() => n.remove(), 1350);
  },

  /** Same pop as floatItem, but pulls from OBJECT/ instead of item/. */
  floatObject(x, y, img, col) { return this.floatItem(x, y, img, col, Art.object); },

  /** Damage / heal number. */
  number(x, y, txt, kind, crit, superCrit) {
    if (!this.combatNumbers || !this.pop) return;
    // Damage-over-time ticks are intentionally quieter in a full battle. The
    // status/effect still resolves and crit/heal/shield numbers remain exact;
    // this only prevents ten nearby periodic ticks from spawning nearly
    // identical text nodes in the same 90ms window.
    if (this._combatLoad && kind === 'dot' && !crit && !superCrit) {
      const key = Math.round(x / 26) + ':' + Math.round(y / 26);
      const now = performance.now();
      if (now - (this._denseNumberStamps[key] || -Infinity) < 90) return;
      this._denseNumberStamps[key] = now;
    }
    this.trimPops();
    let kindCls = 'pop-dmg';
    if (superCrit) kindCls = 'supercrit';
    else if (crit) kindCls = 'crit';
    else if (kind === 'magic') kindCls = 'pop-magic';
    else if (kind === 'true') kindCls = 'pop-true';
    else if (kind === 'dot') kindCls = 'pop-dot';
    else if (kind === 'heal') kindCls = 'pop-heal';
    else if (kind === 'shield') kindCls = 'pop-shield';
    else if (kind === 'miss' || kind === 'block') kindCls = 'pop-' + kind;

    const n = el('div', 'pop pop-num ' + kindCls + (crit ? ' crit' : '') + (superCrit ? ' supercrit' : ''));
    const jitterX = Math.round(rnd(-4, 4));
    n.style.left = (x + jitterX) + 'px';
    n.style.top = y + 'px';
    n.textContent = txt;
    this.pop.appendChild(n);
    const lifeMs = superCrit || crit ? 640 : 560;
    setTimeout(() => { if (n.parentNode) n.remove(); }, lifeMs);
  },

  /* projectile: returns a node the sim animates */
  proj(x, y, opt) {
    opt = opt || {};
    const kind = opt.kind || 'orb';
    const col = opt.col || '#fff';
    const n = el('div');
    let css = `position:absolute;left:0;top:0;pointer-events:none;will-change:transform;`;
    if (kind === 'food' && opt.img) {
      const s = opt.size || 20;
      n.innerHTML = `<img src="${Art.item(opt.img)}" style="width:${s}px;height:${s}px;object-fit:contain;
        filter:drop-shadow(0 1px 2px rgba(0,0,0,.5))">`;
      css += `transform:translate(${x}px,${y}px) rotate(${rnd(-25, 25)}deg)`;
    } else if (kind === 'obj' && opt.img) {
      const s = opt.size || 26;
      n.innerHTML = `<img src="${Art.object(opt.img)}" style="width:${s}px;height:${s}px;object-fit:contain;
        filter:drop-shadow(0 1px 2px rgba(0,0,0,.5))">`;
      css += `transform:translate(${x}px,${y}px) rotate(${rnd(-30, 30)}deg)`;
    } else if (kind === 'spear') {
      css += `width:46px;height:9px;clip-path:polygon(0 34%,68% 34%,68% 0,100% 50%,68% 100%,68% 66%,0 66%);
        background:linear-gradient(90deg,#8b5834 0 62%,#f8d36d 63% 70%,#f9f3d8 71%);transform:translate(${x}px,${y}px)`;
    } else if (kind === 'beam') {
      css += `width:34px;height:5px;border-radius:3px;background:linear-gradient(90deg,transparent,${col});
        box-shadow:0 0 12px ${col};transform:translate(${x}px,${y}px)`;
    } else if (kind === 'note' || kind === 'dice') {
      css += `font-size:19px;transform:translate(${x}px,${y}px)`;
      n.textContent = kind === 'note' ? pick(['♪', '♫', '♩']) : pick(['⚀', '⚁', '⚂', '⚃', '⚄', '⚅']);
    } else if (kind === 'craft') {
      css += `width:18px;height:18px;background:${col};transform:translate(${x}px,${y}px) rotate(0deg);
        box-shadow:0 0 10px ${col}`;
    } else {
      const s = kind === 'kernel' ? 10 : 15;
      css += `width:${s}px;height:${s}px;border-radius:50%;background:radial-gradient(circle,#fff,${col});
        box-shadow:0 0 14px ${col};transform:translate(${x}px,${y}px)`;
    }
    n.style.cssText = css;
    this.front.appendChild(n);
    return n;
  },

  pool(x, dur, col, w) {
    w = w || 260;
    const n = el('div');
    n.style.cssText = `position:absolute;left:${x - w}px;bottom:6px;width:${w * 2}px;height:34px;
      border-radius:50%;background:radial-gradient(ellipse,${col} 0%,transparent 72%);opacity:0;
      pointer-events:none;filter:blur(2px)`;
    this.back.appendChild(n);
    requestAnimationFrame(() => { n.style.transition = 'opacity .3s'; n.style.opacity = .78; });
    setTimeout(() => { n.style.transition = 'opacity .6s'; n.style.opacity = 0; }, dur * 1000);
    setTimeout(() => n.remove(), dur * 1000 + 700);
  },

  crack(x, y, scale) {
    for (let i = 0; i < 7 * this.quality; i++) {
      const w = rnd(30, 90) * scale, a = rnd(-.4, .4);
      const n = el('div');
      n.style.cssText = `position:absolute;left:${x}px;top:${y - 4}px;width:${w}px;height:3px;
        background:linear-gradient(90deg,#1a0f22,transparent);transform-origin:0 50%;
        transform:rotate(${a + (i % 2 ? Math.PI : 0)}rad) scaleX(0);opacity:.85;pointer-events:none`;
      this.back.appendChild(n);
      requestAnimationFrame(() => { n.style.transition = 'transform .18s cubic-bezier(.1,.9,.3,1)';
        n.style.transform = `rotate(${a + (i % 2 ? Math.PI : 0)}rad) scaleX(1)`; });
      setTimeout(() => { n.style.transition = 'opacity .8s'; n.style.opacity = 0; }, 400);
      setTimeout(() => n.remove(), 1300);
    }
    this.burst(x, y, 16 * scale, ['#6b5540', '#4a3a2c', '#8a7258'], { lift: 130, spMax: 300, shape: 'sq', sMax: 9 });
  },

  smoke(x, y, n, col) {
    col = col || '#8a8a9a';
    for (let i = 0; i < n * this.quality; i++) {
      this.part({ x: x + rnd(-30, 30), y: y - rnd(0, 50), vx: rnd(-30, 30), vy: rnd(-70, -18),
        g: -25, size: rnd(14, 34), col, life: rnd(.7, 1.5), drag: 1.6, dscale: 1.1, layer: 'b' });
    }
  },

  splash(x, y, col, scale) {
    scale = scale || 1;
    this.burst(x, y, 16 * scale, col, { dir: -Math.PI / 2, spread: 1.1, spMin: 140, spMax: 400 * scale, lift: 90, sMax: 10 });
    this.ring(x, y, 120 * scale, col, .35);
  },

  confetti(x, y, n) {
    const cols = ['#ff5b7f', '#ffc94d', '#6fe3c4', '#8f7fff', '#7bd66a'];
    for (let i = 0; i < n * this.quality; i++) {
      this.part({ x, y, vx: rnd(-260, 260), vy: rnd(-380, -110), g: 780, size: rnd(5, 11),
        col: pick(cols), life: rnd(.9, 1.7), shape: 'sq', spin: rnd(-16, 16) });
    }
  },

  notes(x, y, n) {
    for (let i = 0; i < n * this.quality; i++) {
      this.part({ x: x + rnd(-20, 20), y, vx: rnd(-60, 60), vy: rnd(-130, -60), g: 60,
        size: rnd(13, 20), col: '#ffd166', life: rnd(.8, 1.4), shape: 'txt', char: pick(['♪', '♫', '♩', '♬']), spin: rnd(-4, 4) });
    }
  },

  /** Pebble's bark is a directional pressure wave, not a screen flash. */
  barkWave(x, y, dir, count, col) {
    if (!this.front) return;
    count = count || 3; col = col || '#d9dde2'; dir = dir || 1;
    for (let i = 0; i < count; i++) {
      const wave = el('div');
      const w = 34 + i * 12, h = 58 + i * 8;
      wave.style.cssText = `position:absolute;left:${x + dir * (18 + i * 6) - w / 2}px;top:${y - 74 - h / 2}px;
        width:${w}px;height:${h}px;border:3px solid ${col};border-left-color:${dir > 0 ? 'transparent' : col};
        border-right-color:${dir < 0 ? 'transparent' : col};border-radius:50%;opacity:0;pointer-events:none;
        transform:scale(.35) translateX(0);filter:drop-shadow(0 1px 2px #0007)`;
      this.front.appendChild(wave);
      setTimeout(() => {
        wave.style.transition = 'transform .34s ease-out,opacity .12s ease-out';
        wave.style.opacity = .82 - i * .12;
        wave.style.transform = `scale(${1.1 + i * .16}) translateX(${dir * (34 + i * 15)}px)`;
      }, i * 45);
      setTimeout(() => { wave.style.transition = 'opacity .22s'; wave.style.opacity = 0; }, 250 + i * 45);
      setTimeout(() => wave.remove(), 620);
    }
    this.burst(x + dir * 30, y - 68, 5, ['#f1f1f1', '#9da4aa'],
      { dir: dir > 0 ? 0 : Math.PI, spread: .7, spMin: 50, spMax: 150, sMax: 5, life: .3, g: 30 });
  },

  /** Brusha's bespoke prop choreography. The real canvas and paintbrush art
      appear as tools she is actively using, surrounded by pigment dabs rather
      than generic magic rings. */
  paintCast(x, y, dir, colors, mode) {
    colors = colors && colors.length ? colors : ['#ff5fa8', '#5fd0ff', '#ffd166'];
    const grand = mode === 'masterpiece';
    this.castProp(x - dir * 12, y + 3, { kind: 'obj', img: 'canvas', size: grand ? 76 : 58 }, colors[0], grand ? .72 : .52);
    const size = grand ? 82 : 64;
    const brush = el('div');
    brush.style.cssText = `position:absolute;left:${x - size / 2}px;top:${y - 92}px;width:${size}px;height:${size}px;
      z-index:8;pointer-events:none;opacity:0;will-change:transform;filter:drop-shadow(0 4px 3px #0009);
      transform:translate(${-dir * 32}px,18px) rotate(${dir > 0 ? -42 : 42}deg) scale(.55)`;
    brush.innerHTML = `<img src="${Art.object('paintbrush')}" style="width:100%;height:100%;object-fit:contain">`;
    this.front.appendChild(brush);
    requestAnimationFrame(() => {
      brush.style.transition = `transform ${grand ? .42 : .3}s cubic-bezier(.15,1.35,.35,1),opacity .12s`;
      brush.style.opacity = 1;
      brush.style.transform = `translate(${dir * (grand ? 40 : 24)}px,-8px) rotate(${dir > 0 ? 34 : -34}deg) scale(1)`;
    });
    setTimeout(() => {
      brush.style.transition = 'transform .22s ease-in,opacity .18s'; brush.style.opacity = 0;
      brush.style.transform = `translate(${dir * 58}px,-24px) rotate(${dir > 0 ? 62 : -62}deg) scale(.8)`;
    }, grand ? 520 : 360);
    setTimeout(() => brush.remove(), grand ? 820 : 650);
    colors.forEach((col, i) => {
      this.part({ x: x + dir * (10 + i * 12), y: y - 65 + (i % 2 ? 10 : -6), vx: dir * rnd(35, 90), vy: rnd(-100, -35),
        g: 300, size: grand ? rnd(10, 17) : rnd(7, 12), col, life: rnd(.5, .85), drag: 1.4 });
    });
  },

  /** A layered, irregular brush stroke with the physical brush travelling at
      its leading edge. It is intentionally matte and pigment-like: no white
      flash core, bloom, or rapid full-screen luminance change. */
  paintStroke(fromX, toX, y, colors, opt) {
    if (!this.front) return;
    opt = opt || {}; colors = colors && colors.length ? colors : ['#ff5fa8'];
    const dir = toX >= fromX ? 1 : -1;
    const left = Math.min(fromX, toX) - 18, width = Math.max(80, Math.abs(toX - fromX) + 36);
    const bands = opt.full ? 5 : 3;
    for (let i = 0; i < bands; i++) {
      const n = el('div');
      const col = colors[i % colors.length], h = opt.full ? rnd(11, 20) : rnd(8, 15);
      const yy = y - (bands - 1) * 8 + i * 16 + rnd(-4, 4);
      n.style.cssText = `position:absolute;left:${left}px;top:${yy}px;width:${width}px;height:${h}px;
        pointer-events:none;opacity:.88;background:linear-gradient(90deg,transparent 0 1%,${col} 5% 89%,transparent 100%);
        border-radius:${rndi(35, 70)}% ${rndi(25, 60)}% ${rndi(35, 70)}% ${rndi(25, 60)}%;
        clip-path:polygon(0 35%,4% 8%,22% 20%,39% 0,61% 18%,82% 5%,100% 42%,96% 86%,73% 72%,48% 100%,21% 78%,2% 94%);
        transform-origin:${dir > 0 ? '0%' : '100%'} 50%;transform:rotate(${rnd(-2.5, 2.5)}deg) scaleX(0)`;
      this.front.appendChild(n);
      setTimeout(() => {
        n.style.transition = `transform ${opt.full ? .28 : .2}s cubic-bezier(.1,.9,.25,1)`;
        n.style.transform = n.style.transform.replace('scaleX(0)', 'scaleX(1)');
      }, i * 28);
      setTimeout(() => { n.style.transition = 'opacity .42s'; n.style.opacity = 0; }, (opt.full ? 430 : 330) + i * 24);
      setTimeout(() => n.remove(), 980);
    }
    const brushSize = opt.full ? 86 : 66;
    const brush = el('div');
    brush.style.cssText = `position:absolute;left:0;top:0;width:${brushSize}px;height:${brushSize}px;z-index:8;
      pointer-events:none;filter:drop-shadow(0 4px 3px #0009);opacity:.98;
      transform:translate(${fromX - brushSize / 2}px,${y - brushSize * .72}px) rotate(${dir > 0 ? -50 : 50}deg)`;
    brush.innerHTML = `<img src="${Art.object('paintbrush')}" style="width:100%;height:100%;object-fit:contain;transform:${dir < 0 ? 'scaleX(-1)' : 'none'}">`;
    this.front.appendChild(brush);
    requestAnimationFrame(() => {
      brush.style.transition = `transform ${opt.full ? .36 : .28}s cubic-bezier(.18,.72,.25,1)`;
      brush.style.transform = `translate(${toX - brushSize / 2}px,${y - brushSize * .72}px) rotate(${dir > 0 ? 35 : -35}deg)`;
    });
    setTimeout(() => { brush.style.transition = 'opacity .16s'; brush.style.opacity = 0; }, opt.full ? 370 : 290);
    setTimeout(() => brush.remove(), 610);
    const drops = opt.full ? 18 : 9;
    for (let i = 0; i < drops; i++) {
      const p = (i + .5) / drops, col = colors[i % colors.length];
      this.part({ x: lerp(fromX, toX, p) + rnd(-10, 10), y: y + rnd(-20, 22), vx: dir * rnd(20, 100), vy: rnd(-130, -35),
        g: 520, size: rnd(4, opt.full ? 11 : 8), col, life: rnd(.38, .72), drag: 1.2 });
    }
  },

  /** Persistent painted floor/canvas left by Masterpiece Sweep. */
  paintCanvas(x, groundY, dur, colors, width, canvasX) {
    if (!this.back) return;
    colors = colors && colors.length ? colors : ['#ff5fa8', '#5fd0ff', '#ffd166'];
    width = width || 420;
    const paint = el('div');
    paint.style.cssText = `position:absolute;left:${x - width / 2}px;top:${groundY - 21}px;width:${width}px;height:38px;
      pointer-events:none;opacity:0;border-radius:48% 52% 45% 55%;filter:blur(.4px);
      background:radial-gradient(ellipse at 18% 55%,${colors[0]}dd 0 14%,transparent 32%),
        radial-gradient(ellipse at 52% 48%,${colors[1 % colors.length]}d9 0 18%,transparent 37%),
        radial-gradient(ellipse at 83% 58%,${colors[2 % colors.length]}d8 0 15%,transparent 34%)`;
    this.back.appendChild(paint);
    const canvas = el('div');
    const canvasAt = canvasX == null ? x : canvasX;
    canvas.style.cssText = `position:absolute;left:${canvasAt - 34}px;top:${groundY - 62}px;width:68px;height:68px;pointer-events:none;
      opacity:0;transform:translateY(-10px) rotate(-7deg) scale(.8);filter:drop-shadow(0 5px 3px #0008)`;
    canvas.innerHTML = `<img src="${Art.object('canvas')}" style="width:100%;height:100%;object-fit:contain">`;
    this.back.appendChild(canvas);
    requestAnimationFrame(() => {
      paint.style.transition = 'opacity .28s'; paint.style.opacity = .76;
      canvas.style.transition = 'opacity .22s,transform .3s cubic-bezier(.2,1.4,.4,1)'; canvas.style.opacity = .92;
      canvas.style.transform = 'translateY(0) rotate(-3deg) scale(1)';
    });
    setTimeout(() => { paint.style.transition = 'opacity .55s'; canvas.style.transition = 'opacity .45s'; paint.style.opacity = 0; canvas.style.opacity = 0; }, dur * 1000);
    setTimeout(() => { paint.remove(); canvas.remove(); }, dur * 1000 + 650);
  },

  /** Pigment travelling from Brusha to a selected ally for Color Palette. */
  paintRibbon(x1, y1, x2, y2, colors) {
    if (!this.front) return;
    colors = colors && colors.length ? colors : ['#ff5fa8', '#5fd0ff', '#ffd166'];
    const dx = x2 - x1, dy = y2 - y1, len = Math.hypot(dx, dy), ang = Math.atan2(dy, dx);
    colors.forEach((col, i) => {
      const n = el('div');
      n.style.cssText = `position:absolute;left:${x1}px;top:${y1 + (i - 1) * 5}px;width:${len}px;height:${3 + i}px;
        pointer-events:none;opacity:.9;border-radius:8px;background:linear-gradient(90deg,${col},${col}aa,transparent);
        transform-origin:0 50%;transform:rotate(${ang}rad) scaleX(0)`;
      this.front.appendChild(n);
      setTimeout(() => { n.style.transition = 'transform .22s ease-out'; n.style.transform = `rotate(${ang}rad) scaleX(1)`; }, i * 35);
      setTimeout(() => { n.style.transition = 'opacity .3s'; n.style.opacity = 0; }, 310 + i * 35);
      setTimeout(() => n.remove(), 700);
    });
    this.paintMark(x2, y2, colors, .7, false);
  },

  /** Small readable paint impact, also used as Brusha's walk-in footprints. */
  paintMark(x, y, colors, scale, ground) {
    if (!this.front || !this.back) return;
    colors = colors && colors.length ? colors : ['#ff5fa8']; scale = scale || 1;
    const layer = ground ? this.back : this.front;
    colors.slice(0, 3).forEach((col, i) => {
      const n = el('div'); const w = (24 + i * 8) * scale, h = (ground ? 8 : 15 + i * 3) * scale;
      n.style.cssText = `position:absolute;left:${x - w / 2 + rnd(-10, 10) * scale}px;top:${y - h / 2 + rnd(-8, 8) * scale}px;
        width:${w}px;height:${h}px;pointer-events:none;opacity:.88;background:${col};border-radius:60% 35% 65% 40%;
        transform:rotate(${rnd(-35, 35)}deg) scale(.25)`;
      layer.appendChild(n);
      requestAnimationFrame(() => { n.style.transition = 'transform .14s cubic-bezier(.15,1.5,.3,1),opacity .4s'; n.style.transform = n.style.transform.replace('scale(.25)', 'scale(1)'); });
      setTimeout(() => { n.style.opacity = 0; }, ground ? 300 : 230);
      setTimeout(() => n.remove(), 720);
    });
    if (!ground) this.burst(x, y, 5 * scale, colors, { spMin: 45, spMax: 170 * scale, lift: 35, sMin: 3, sMax: 7, g: 460 });
  },

  inkSplat(x, y) {
    for (let i = 0; i < 9 * this.quality; i++) {
      const s = rnd(16, 44);
      this.part({ x: x + rnd(-40, 40), y: y - rnd(10, 60), vx: rnd(-40, 40), vy: rnd(-40, 40),
        g: 200, size: s, col: '#2a1740', life: rnd(.5, 1.1), drag: 3, dscale: .5 });
    }
    this.burst(x, y - 30, 12, '#8f6bff', { spMax: 260 });
  },

  scribble(x, y) {
    for (let i = 0; i < 8; i++) {
      const n = el('div');
      const w = rnd(50, 110);
      n.style.cssText = `position:absolute;left:${x - w / 2}px;top:${y + rnd(-40, 40)}px;width:${w}px;height:4px;
        background:#2a1740;transform:rotate(${rnd(-1, 1)}rad) scaleX(0);pointer-events:none;border-radius:3px`;
      this.front.appendChild(n);
      const d = i * 22;
      setTimeout(() => { n.style.transition = 'transform .09s'; n.style.transform = n.style.transform.replace('scaleX(0)', 'scaleX(1)'); }, d);
      setTimeout(() => { n.style.transition = 'opacity .3s'; n.style.opacity = 0; }, 420 + d);
      setTimeout(() => n.remove(), 900 + d);
    }
    Sound.play('swing_light', { vol: .4 });
  },

  vines(x, y) {
    for (let i = 0; i < 5; i++) {
      const h = rnd(60, 130);
      const n = el('div');
      n.style.cssText = `position:absolute;left:${x + rnd(-40, 40)}px;bottom:${-y + 6}px;width:7px;height:${h}px;
        background:linear-gradient(#6ede77,#2c5a2c);transform-origin:50% 100%;transform:scaleY(0) rotate(${rnd(-.3, .3)}rad);
        border-radius:4px;pointer-events:none`;
      n.style.bottom = '6px';
      this.back.appendChild(n);
      requestAnimationFrame(() => { n.style.transition = 'transform .2s cubic-bezier(.1,1.4,.3,1)';
        n.style.transform = `scaleY(1) rotate(${rnd(-.3, .3)}rad)`; });
      setTimeout(() => { n.style.transition = 'opacity .5s,transform .5s'; n.style.opacity = 0; }, 1600);
      setTimeout(() => n.remove(), 2200);
    }
  },

  shatter(x, y) {
    this.burst(x, y - 40, 20, ['#bfe9ff', '#7be0ff', '#fff'], { spMax: 420, lift: 120, shape: 'sq', sMax: 11 });
  },
  blood(x, y) {
    this.burst(x, y, 10, ['#c22', '#8a1414'], { spMax: 300, lift: 60, sMax: 7 });
  },

  robotBurst(x, y, groundY, opt) {
    if (!this.front || !this.back) return;
    opt = opt || {};
    const amount = Math.max(12, opt.amount || 18);
    const boss = !!opt.boss;
    this.flash(boss ? '#fff3c2' : '#fff1b0', boss ? .9 : .72, boss ? .18 : .12);
    this.ring(x, y, boss ? 190 : 118, '#ff9a36', boss ? .48 : .32);
    this.ring(x, y, boss ? 92 : 58, '#ffe169', boss ? .32 : .2);
    if (boss) this.ring(x, y, 42, '#fff8c7', .18);
    this.burst(x, y, amount, ['#fff0a4', '#ffb52e', '#ef5d28', '#687684', '#dce7ef'], {
      shape: 'sq', spMin: boss ? 170 : 120, spMax: boss ? 620 : 470, lift: boss ? 220 : 165, sMin: 4, sMax: boss ? 16 : 13, life: boss ? 1.05 : .82, g: 720
    });
    this.burst(x, y - 8, Math.ceil(amount * (boss ? .75 : .55)), ['#ffefb0', '#ff6b2d', '#46515d'], {
      shape: 'streak', spMin: boss ? 130 : 95, spMax: boss ? 500 : 390, lift: boss ? 150 : 110, sMin: 3, sMax: boss ? 11 : 8, life: boss ? .72 : .56, g: 570
    });
    this.burst(x, groundY - 8, boss ? 24 : 12, ['#3b4650', '#9eaebd', '#ff8e32'], {
      shape: 'sq', spMin: 35, spMax: boss ? 300 : 210, lift: boss ? 52 : 34, sMin: 3, sMax: boss ? 12 : 9, life: boss ? .78 : .6, g: 460
    });
    this.shake(boss ? 24 : 12, boss ? .52 : .34);
  },

  /** A Toon does not leave a body behind: their silhouette pops into heavy
      black-purple Ichor blobs, fine pink spray, and a puddle that quickly
      soaks away. Kept matte and irregular so it reads as ink, not sparks. */
  ichorBurst(x, y, groundY, opt) {
    if (!this.front || !this.back) return;
    opt = opt || {};
    const amount = Math.max(6, opt.amount || 12);
    const colors = ['#110d14', '#25101f', '#51102f', '#8e174a', '#d53678'];

    // The central silhouette-splat bridges the character disappearing and the
    // droplets taking over, avoiding a plain opacity fade between the two.
    const core = el('div');
    core.style.cssText = `position:absolute;left:${x - 42}px;top:${y - 42}px;width:84px;height:84px;
      pointer-events:none;opacity:.94;background:radial-gradient(circle at 46% 48%,#120d14 0 26%,#51102f 48%,#d53678 67%,transparent 70%);
      clip-path:polygon(50% 0,59% 25%,78% 10%,73% 34%,100% 38%,77% 51%,94% 72%,67% 67%,62% 100%,48% 74%,29% 94%,31% 66%,3% 72%,24% 51%,0 35%,30% 33%,24% 7%,43% 25%);
      filter:drop-shadow(0 3px 1px rgba(0,0,0,.7));transform:scale(.18) rotate(-12deg)`;
    this.front.appendChild(core);
    requestAnimationFrame(() => {
      core.style.transition = 'transform .14s cubic-bezier(.1,1.5,.25,1),opacity .1s';
      core.style.transform = 'scale(1.16) rotate(5deg)';
    });
    setTimeout(() => { core.style.transition = 'transform .24s ease-in,opacity .2s';
      core.style.transform = 'scale(.72) rotate(14deg)'; core.style.opacity = 0; }, 150);
    setTimeout(() => core.remove(), 430);

    // Thick drops arc outward and fall; smaller flecks hang briefly above the
    // puddle. Particle caps in part() remain the final wipe-safety net.
    for (let i = 0; i < amount; i++) {
      const a = rnd(-Math.PI * .92, -Math.PI * .08), sp = rnd(105, 350);
      this.part({ x: x + rnd(-9, 9), y: y + rnd(-8, 10), vx: Math.cos(a) * sp,
        vy: Math.sin(a) * sp - rnd(15, 70), g: rnd(650, 930), size: rnd(6, 15),
        col: pick(colors), life: rnd(.55, .95), shape: 'ink', spin: rnd(-8, 8), drag: .12 });
    }
    this.burst(x, y - 5, Math.ceil(amount * .55), ['#e34b89', '#8e174a', '#24101f'],
      { spMin: 100, spMax: 390, lift: 85, sMin: 2, sMax: 5, life: .62, g: 520, shape: 'ink' });

    const puddle = el('div');
    const pw = 92 + amount * 2;
    puddle.style.cssText = `position:absolute;left:${x - pw / 2}px;top:${groundY - 7}px;width:${pw}px;height:19px;
      pointer-events:none;border-radius:48%;opacity:0;background:radial-gradient(ellipse,#120d14 0 34%,#51102f 55%,#d5367866 69%,transparent 73%);
      transform:scale(.16);filter:drop-shadow(0 2px 1px rgba(0,0,0,.65))`;
    this.back.appendChild(puddle);
    requestAnimationFrame(() => { puddle.style.transition = 'transform .24s cubic-bezier(.12,1.4,.3,1),opacity .1s';
      puddle.style.opacity = .88; puddle.style.transform = 'scale(1)'; });
    setTimeout(() => { puddle.style.transition = 'transform .55s ease-in,opacity .5s';
      puddle.style.transform = 'scale(.72)'; puddle.style.opacity = 0; }, 700);
    setTimeout(() => puddle.remove(), 1300);
    this.ring(x, y, 82, '#9f1f58', .25);
  },

  sweep(fromX, y, dir, dur, col) {
    const n = el('div');
    n.style.cssText = `position:absolute;left:${fromX}px;bottom:0;width:150px;height:100%;
      background:linear-gradient(90deg,transparent,${col}55,transparent);pointer-events:none;
      filter:blur(3px);transform:translateX(0)`;
    this.back.appendChild(n);
    requestAnimationFrame(() => {
      n.style.transition = `transform ${dur}s linear`;
      n.style.transform = `translateX(${dir * 900}px)`;
    });
    setTimeout(() => { n.style.transition = 'opacity .3s'; n.style.opacity = 0; }, dur * 1000);
    setTimeout(() => n.remove(), dur * 1000 + 400);
  },

  bigStroke(x, y, col, dir) {
    const n = el('div');
    n.style.cssText = `position:absolute;left:0;top:${y - 40}px;width:100%;height:70px;
      background:linear-gradient(90deg,transparent,${col},#fff,${col},transparent);
      filter:blur(2px) drop-shadow(0 0 24px ${col});transform:scaleX(0) skewX(-12deg);
      transform-origin:${dir > 0 ? '0%' : '100%'} 50%;pointer-events:none;border-radius:40px`;
    this.front.appendChild(n);
    requestAnimationFrame(() => { n.style.transition = 'transform .13s cubic-bezier(.1,.9,.3,1)';
      n.style.transform = 'scaleX(1) skewX(-12deg)'; });
    setTimeout(() => { n.style.transition = 'opacity .3s,transform .3s'; n.style.opacity = 0;
      n.style.transform = 'scaleX(1.1) skewX(-12deg)'; }, 150);
    setTimeout(() => n.remove(), 520);
  },

  wave(x, y, dir, col) {
    for (let i = 0; i < 4; i++) setTimeout(() => this.ring(x + dir * i * 70, y - 10, 200 + i * 60, col, .5), i * 55);
    this.burst(x, y, 22, col, { dir: dir > 0 ? 0 : Math.PI, spread: .9, spMin: 200, spMax: 520, lift: 100, sMax: 11 });
  },

  net(x1, x2, y) {
    const n = el('div');
    const w = Math.abs(x2 - x1) + 60;
    n.style.cssText = `position:absolute;left:${Math.min(x1, x2) - 30}px;top:${y - 110}px;width:${w}px;height:120px;
      border:3px dashed #ffd166;border-radius:12px;opacity:0;transform:scaleY(.2);pointer-events:none;
      box-shadow:0 0 20px #ffd16688`;
    this.front.appendChild(n);
    requestAnimationFrame(() => { n.style.transition = 'transform .16s cubic-bezier(.1,1.4,.3,1),opacity .16s';
      n.style.transform = 'scaleY(1)'; n.style.opacity = 1; });
    setTimeout(() => { n.style.transition = 'opacity .4s'; n.style.opacity = 0; }, 500);
    setTimeout(() => n.remove(), 1000);
  },

  aura(x, y, col, dur) {
    const n = el('div');
    n.style.cssText = `position:absolute;left:${x - 60}px;top:${y - 130}px;width:120px;height:140px;
      border-radius:50%;background:radial-gradient(circle,${col}44,transparent 68%);pointer-events:none;
      animation:cFloat 1.1s ease-in-out infinite`;
    this.back.appendChild(n);
    setTimeout(() => { n.style.transition = 'opacity .4s'; n.style.opacity = 0; }, dur * 1000);
    setTimeout(() => n.remove(), dur * 1000 + 500);
    return n;
  },

  starfall(x, y, onHit) {
    const n = el('div');
    n.style.cssText = `position:absolute;left:${x}px;top:-60px;font-size:26px;pointer-events:none;
      filter:drop-shadow(0 0 12px #b9a4ff);transform:translate(-50%,0)`;
    n.textContent = '✦';
    this.front.appendChild(n);
    requestAnimationFrame(() => { n.style.transition = 'top .28s cubic-bezier(.5,0,1,.5)'; n.style.top = (y - 40) + 'px'; });
    setTimeout(() => { n.remove(); this.burst(x, y - 40, 10, '#b9a4ff', { spMax: 240, lift: 40 });
      this.ring(x, y - 20, 90, '#b9a4ff', .3); onHit && onHit(); }, 290);
  },

  lift(unitEl, dur) {
    if (!unitEl) return;
    unitEl.style.transition = `transform ${dur * .3}s cubic-bezier(.2,1.3,.4,1)`;
  },

  heartLink(x1, y1, x2, y2) {
    const dx = x2 - x1, dy = y2 - y1;
    const len = Math.hypot(dx, dy), ang = Math.atan2(dy, dx);
    const n = el('div');
    n.style.cssText = `position:absolute;left:${x1}px;top:${y1}px;width:${len}px;height:5px;border-radius:3px;
      background:linear-gradient(90deg,#ffd7a0,#ff8fb0);transform-origin:0 50%;
      transform:rotate(${ang}rad) scaleX(0);box-shadow:0 0 14px #ffd7a0;pointer-events:none`;
    this.front.appendChild(n);
    requestAnimationFrame(() => { n.style.transition = 'transform .18s'; n.style.transform = `rotate(${ang}rad) scaleX(1)`; });
    setTimeout(() => { n.style.transition = 'opacity .4s'; n.style.opacity = 0; }, 320);
    setTimeout(() => n.remove(), 800);
  },

  /** Tisha briefly reveals her otherwise invisible Clean Lines as crisp floor
      rulers. They are lightweight DOM strips rather than a particle flood. */
  tishaLines(lines, groundY, dur, permanent) {
    if (!this.back) return;
    (lines || []).forEach((x, i) => {
      const line = el('div');
      line.style.cssText = `position:absolute;left:${x - 3}px;top:${groundY - 132}px;width:6px;height:144px;
        z-index:3;pointer-events:none;opacity:0;transform:scaleY(.05);transform-origin:50% 100%;
        background:repeating-linear-gradient(180deg,#eaffff 0 8px,#65d7dc 8px 13px,transparent 13px 19px);
        border-radius:99px;filter:drop-shadow(0 0 ${permanent ? 8 : 5}px #78e7e9)`;
      this.back.appendChild(line);
      setTimeout(() => {
        line.style.transition = 'transform .22s cubic-bezier(.15,1.2,.3,1),opacity .16s';
        line.style.opacity = permanent ? .82 : .62; line.style.transform = 'scaleY(1)';
      }, i * 55);
      setTimeout(() => { line.style.transition = 'opacity .38s'; line.style.opacity = 0; }, dur * 1000);
      setTimeout(() => line.remove(), dur * 1000 + 450);
    });
  },

  /** A real feather-duster sweep travels through the formation, trailing soft
      dust puffs and speed lines so the direction of Tisha's reposition is clear. */
  tishaSweep(fromX, toX, y, dir, wide) {
    if (!this.front) return;
    dir = dir || (toX >= fromX ? 1 : -1);
    const size = wide ? 88 : 64, duster = el('div');
    duster.style.cssText = `position:absolute;left:0;top:0;width:${size}px;height:${size}px;z-index:10;
      pointer-events:none;opacity:0;filter:drop-shadow(0 5px 3px #0009);
      transform:translate(${fromX - size / 2}px,${y - size * .72}px) rotate(${dir > 0 ? -48 : 48}deg) scale(.7)`;
    duster.innerHTML = `<img src="${Art.item('Trinkets/TISHA_Featherduster')}" alt="" style="width:100%;height:100%;object-fit:contain;${dir < 0 ? 'transform:scaleX(-1)' : ''}">`;
    this.front.appendChild(duster);
    requestAnimationFrame(() => {
      duster.style.transition = `transform ${wide ? .38 : .24}s cubic-bezier(.15,.75,.25,1),opacity .1s`;
      duster.style.opacity = 1;
      duster.style.transform = `translate(${toX - size / 2}px,${y - size * .82}px) rotate(${dir > 0 ? 38 : -38}deg) scale(1)`;
    });
    const puffs = wide ? 14 : 7;
    for (let i = 0; i < puffs; i++) {
      const p = (i + .5) / puffs;
      this.part({ x: lerp(fromX, toX, p) + rnd(-12, 12), y: y + rnd(-22, 10), vx: dir * rnd(25, 90),
        vy: rnd(-80, -20), g: 40, size: rnd(8, wide ? 17 : 13), col: pick(['#dff3ea', '#b7d8d0', '#8fe8ed']),
        life: rnd(.38, .72), drag: 2, layer: i % 2 ? 'f' : 'b' });
    }
    setTimeout(() => { duster.style.transition = 'opacity .16s'; duster.style.opacity = 0; }, wide ? 400 : 270);
    setTimeout(() => duster.remove(), wide ? 650 : 510);
  },

  /** Wide, low-opacity battlefield dust. It hangs for the authored duration
      without continuously creating particles, keeping long battles cheap. */
  tishaDust(x, groundY, width, dur, reduced) {
    if (!this.back) return;
    const cloud = el('div');
    cloud.style.cssText = `position:absolute;left:${x - width / 2}px;top:${groundY - 124}px;width:${width}px;height:128px;
      z-index:4;pointer-events:none;opacity:0;transform:scale(.72) translateY(12px);border-radius:50%;
      background:radial-gradient(ellipse at 18% 66%,#b8ccc0aa 0 12%,transparent 32%),
        radial-gradient(ellipse at 47% 45%,#dce7dfaa 0 19%,transparent 42%),
        radial-gradient(ellipse at 76% 64%,#9fbab2aa 0 15%,transparent 36%);
      filter:blur(${reduced ? 4 : 2}px) drop-shadow(0 0 7px #8fe8ed55)`;
    this.back.appendChild(cloud);
    requestAnimationFrame(() => {
      cloud.style.transition = 'opacity .25s,transform .55s cubic-bezier(.15,1,.3,1)';
      cloud.style.opacity = reduced ? .42 : .67; cloud.style.transform = 'scale(1) translateY(0)';
    });
    for (let i = 0; i < (reduced ? 7 : 13); i++) this.part({ x: x + rnd(-width * .42, width * .42),
      y: groundY - rnd(15, 92), vx: rnd(-45, 45), vy: rnd(-55, -12), g: -5, size: rnd(9, 20),
      col: pick(['#dce7df', '#a9c3bb', '#8fe8ed']), life: rnd(.65, 1.25), drag: 2, layer: 'b' });
    setTimeout(() => { cloud.style.transition = 'opacity .48s'; cloud.style.opacity = 0; }, Math.max(.4, dur - .45) * 1000);
    setTimeout(() => cloud.remove(), dur * 1000 + 120);
  },

  steam(x, y, n) { this.smoke(x, y, n, '#e0d0b8'); },

  hollowaySpiral(x, y, radius, opt) {
    if (!this.front || this.reducedEffects) return;
    opt = opt || {};
    const rad = radius || 140;
    const dur = opt.dur || 0.65;
    const n = el('div');
    n.style.cssText = `position:absolute;left:${x - rad}px;top:${y - rad}px;width:${rad * 2}px;height:${rad * 2}px;
      border-radius:50%;pointer-events:none;z-index:8;opacity:0;
      border: 3px dashed #c070ed;
      box-shadow: 0 0 25px rgba(192, 112, 237, 0.6), inset 0 0 20px rgba(168, 85, 247, 0.4);
      transform: scale(0.2) rotate(0deg);`;
    this.front.appendChild(n);
    requestAnimationFrame(() => {
      n.style.transition = `transform ${dur}s cubic-bezier(0.1, 0.8, 0.2, 1), opacity ${dur * 0.4}s ease-out`;
      n.style.opacity = '0.9';
      n.style.transform = `scale(1) rotate(${opt.rev ? -360 : 360}deg)`;
    });
    const pCount = Math.min(12, Math.round(rad / 15));
    for (let i = 0; i < pCount; i++) {
      const ang = (i / pCount) * Math.PI * 2;
      const dist = rad * 0.75;
      this.part({
        x: x + Math.cos(ang) * dist,
        y: y + Math.sin(ang) * dist,
        vx: Math.cos(ang + Math.PI / 2) * 50,
        vy: Math.sin(ang + Math.PI / 2) * 50,
        g: 0,
        size: rnd(7, 14),
        col: pick(['#e0b0ff', '#c070ed', '#a855f7', '#ffd54d']),
        life: rnd(0.4, 0.8),
        drag: 1.5,
        layer: 'f'
      });
    }
    setTimeout(() => {
      n.style.transition = 'opacity 0.25s, transform 0.25s ease-in';
      n.style.opacity = '0';
      n.style.transform = `scale(1.25) rotate(${opt.rev ? -450 : 450}deg)`;
    }, (dur - 0.25) * 1000);
    setTimeout(() => n.remove(), dur * 1000 + 100);
  },

  hollowayAutumn(x, y, radius, opt) {
    if (!this.front || this.reducedEffects) return;
    opt = opt || {};
    const rad = radius || 160;
    const dur = opt.dur || 0.75;
    const n = el('div');
    n.style.cssText = `position:absolute;left:${x - rad}px;top:${y - rad}px;width:${rad * 2}px;height:${rad * 2}px;
      border-radius:50%;pointer-events:none;z-index:7;opacity:0;
      border: 2px solid rgba(245, 158, 11, 0.4);
      background: radial-gradient(circle, rgba(217, 119, 6, 0.25) 0%, rgba(180, 83, 9, 0.1) 60%, transparent 75%);
      box-shadow: 0 0 20px rgba(245, 158, 11, 0.4);
      transform: scale(0.3) rotate(0deg);`;
    this.front.appendChild(n);
    requestAnimationFrame(() => {
      n.style.transition = `transform ${dur}s ease-out, opacity 0.2s ease-out`;
      n.style.opacity = '0.85';
      n.style.transform = `scale(1) rotate(180deg)`;
    });
    const leaves = ['🍂', '🍁'];
    const pCount = Math.min(10, Math.round(rad / 18));
    for (let i = 0; i < pCount; i++) {
      const ang = (i / pCount) * Math.PI * 2 + rnd(-0.2, 0.2);
      this.floatIcon(x + Math.cos(ang) * (rad * 0.5), y + Math.sin(ang) * (rad * 0.4) - 20, pick(leaves), '#f59e0b');
      this.part({
        x: x + rnd(-rad * 0.5, rad * 0.5),
        y: y + rnd(-rad * 0.3, rad * 0.3),
        vx: rnd(-60, 60),
        vy: rnd(-75, -20),
        g: 25,
        size: rnd(8, 16),
        col: pick(['#f59e0b', '#d97706', '#b45309', '#fed7aa']),
        life: rnd(0.5, 0.9),
        drag: 1.8,
        layer: 'f'
      });
    }
    setTimeout(() => {
      n.style.transition = 'opacity 0.3s, transform 0.3s ease-in';
      n.style.opacity = '0';
      n.style.transform = 'scale(1.2) rotate(240deg)';
    }, (dur - 0.3) * 1000);
    setTimeout(() => n.remove(), dur * 1000 + 100);
  },

  candyBurst(x, y, count) {
    if (!this.front || this.reducedEffects) return;
    const n = Math.min(count || 6, 12);
    const candies = ['🍬', '🍭', '🍫', '🎃'];
    for (let i = 0; i < n; i++) {
      const angle = rnd(-Math.PI * 0.85, -Math.PI * 0.15);
      const speed = rnd(60, 140);
      this.part({
        x: x + rnd(-10, 10),
        y: y + rnd(-10, 10),
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        g: 110,
        size: rnd(14, 22),
        col: pick(['#ff9d4d', '#ff6b6b', '#ffd54d', '#c070ed']),
        life: rnd(0.6, 1.1),
        drag: 0.8,
        layer: 'f'
      });
    }
    Sound.play('candy_pop', { vol: 0.55, rate: rnd(0.9, 1.1), throttle: 120 });
  },

  /* Mrs. Holloway Spectral Spiral Explosion */
  mrsHollowaySpiralExplosion(x, y, radius, opt) {
    if (!this.front || this.reducedEffects) return;
    opt = opt || {};
    const rad = radius || 280;
    const dur = opt.dur || 0.75;
    const v = el('div', 'mrs-holloway-spiral-vortex');
    v.style.cssText = `left:${x - rad}px;top:${y - rad}px;width:${rad * 2}px;height:${rad * 2}px;`;
    v.innerHTML = `
      <div class="spiral-vortex-core"></div>
      <div class="spiral-vortex-ring r1"></div>
      <div class="spiral-vortex-ring r2"></div>
      <div class="spiral-vortex-ring r3"></div>
    `;
    this.front.appendChild(v);
    requestAnimationFrame(() => v.classList.add('active'));

    const runes = ['🌀', '✨', '💜', '🔮'];
    const pCount = Math.min(16, Math.round(rad / 15));
    for (let i = 0; i < pCount; i++) {
      const ang = (i / pCount) * Math.PI * 2 + rnd(-0.2, 0.2);
      const dist = rad * rnd(0.3, 0.75);
      this.floatIcon(x + Math.cos(ang) * dist, y + Math.sin(ang) * dist - 15, pick(runes), '#d8b4fe');
      this.part({
        x: x + Math.cos(ang) * dist,
        y: y + Math.sin(ang) * dist,
        vx: Math.cos(ang + Math.PI / 2) * 65,
        vy: Math.sin(ang + Math.PI / 2) * 65,
        g: 0,
        size: rnd(8, 18),
        col: pick(['#f3e8ff', '#d8b4fe', '#c084fc', '#a855f7', '#7e22ce']),
        life: rnd(0.45, 0.85),
        drag: 1.2,
        layer: 'f'
      });
    }

    setTimeout(() => {
      v.classList.remove('active');
      v.classList.add('leaving');
    }, Math.max(100, (dur - 0.25) * 1000));
    setTimeout(() => v.remove(), dur * 1000 + 120);
  },

  /* Mrs. Holloway Phantom Apparition (A Familiar Face) */
  mrsHollowayApparition(x, y) {
    if (!this.front || this.reducedEffects) return;
    const ap = el('div', 'mrs-holloway-apparition');
    ap.style.cssText = `left:${x - 60}px;top:${y - 140}px;`;
    ap.innerHTML = `
      <div class="apparition-silhouette">
        <div class="apparition-eyes">
          <div class="apparition-eye"></div>
          <div class="apparition-eye"></div>
        </div>
      </div>
    `;
    this.front.appendChild(ap);
    requestAnimationFrame(() => ap.classList.add('active'));

    // Expanding purple pulse waves
    this.ring(x, y - 50, 260, '#c084fc', 0.6);
    this.ring(x, y - 50, 340, '#a855f7', 0.8);

    setTimeout(() => {
      ap.classList.remove('active');
      ap.classList.add('leaving');
    }, 1100);
    setTimeout(() => ap.remove(), 1550);
  },

  /* Mrs. Holloway Mother's Embrace Aura */
  mrsHollowayEmbrace(x, y, dur) {
    if (!this.front || this.reducedEffects) return;
    const duration = dur || 2.5;
    const ea = el('div', 'mrs-holloway-embrace-aura');
    ea.style.cssText = `left:${x - 40}px;top:${y - 50}px;`;
    ea.innerHTML = `
      <div class="embrace-heart h1">💜</div>
      <div class="embrace-heart h2">✨</div>
    `;
    this.front.appendChild(ea);
    requestAnimationFrame(() => ea.classList.add('active'));

    setTimeout(() => {
      ea.classList.remove('active');
      ea.classList.add('leaving');
    }, Math.max(100, (duration - 0.25) * 1000));
    setTimeout(() => ea.remove(), duration * 1000 + 100);
  },

  /* Mr. Holloway Ground Slam Earth Fissure (Harvest Crash) */
  mrHollowayEarthCrash(x, y, radius) {
    if (!this.front || this.reducedEffects) return;
    const rad = radius || 240;
    const gf = el('div', 'mr-holloway-ground-fissure');
    gf.style.cssText = `left:${x - rad * 0.5}px;top:${y - 20}px;width:${rad}px;height:40px;`;

    // Multiple jagged glowing cracks radiating outward
    const angles = [-35, -15, 0, 18, 35];
    angles.forEach(deg => {
      const crack = el('div', 'fissure-crack');
      const len = rad * rnd(0.35, 0.55);
      crack.style.cssText = `left:50%;top:50%;width:${len}px;transform:rotate(${deg + rnd(-8, 8)}deg);`;
      gf.appendChild(crack);
    });

    this.front.appendChild(gf);
    requestAnimationFrame(() => gf.classList.add('active'));

    // Flying autumn leaves & rock sparks
    const leaves = ['🍁', '🍂'];
    for (let i = 0; i < 8; i++) {
      const ang = rnd(-Math.PI * 0.85, -Math.PI * 0.15);
      const dist = rnd(30, rad * 0.45);
      this.floatIcon(x + Math.cos(ang) * dist, y + Math.sin(ang) * dist - 15, pick(leaves), '#f59e0b');
      this.part({
        x: x + rnd(-30, 30),
        y: y + rnd(-10, 10),
        vx: Math.cos(ang) * rnd(60, 140),
        vy: Math.sin(ang) * rnd(80, 160),
        g: 130,
        size: rnd(10, 20),
        col: pick(['#f59e0b', '#d97706', '#b45309', '#fed7aa', '#78350f']),
        life: rnd(0.5, 0.95),
        drag: 0.9,
        layer: 'f'
      });
    }

    setTimeout(() => {
      gf.classList.remove('active');
      gf.classList.add('leaving');
    }, 600);
    setTimeout(() => gf.remove(), 950);
  },

  /* Mr. Holloway Autumn Cyclone (Autumn Downpour) */
  mrHollowayAutumnCyclone(x, y, dur) {
    if (!this.front || this.reducedEffects) return;
    const duration = dur || 3.0;
    const cyc = el('div', 'mr-holloway-autumn-cyclone');
    cyc.style.cssText = `left:${x - 55}px;top:${y - 65}px;`;
    this.front.appendChild(cyc);
    requestAnimationFrame(() => cyc.classList.add('active'));

    const leaves = ['🍂', '🍁'];
    for (let i = 0; i < 6; i++) {
      this.floatIcon(x + rnd(-40, 40), y + rnd(-50, 0), pick(leaves), '#f59e0b');
    }

    setTimeout(() => {
      cyc.classList.remove('active');
      cyc.classList.add('leaving');
    }, Math.max(100, (duration - 0.3) * 1000));
    setTimeout(() => cyc.remove(), duration * 1000 + 100);
  },

  /* Mr. Holloway Root Barricade (Rooted Resolve) */
  mrHollowayRootBarrier(x, y, dur) {
    if (!this.front || this.reducedEffects) return;
    const duration = dur || 2.5;
    const rb = el('div', 'mr-holloway-root-barricade');
    rb.style.cssText = `left:${x - 48}px;top:${y - 35}px;`;
    rb.innerHTML = `
      <div class="root-tendril t1"></div>
      <div class="root-tendril t2"></div>
      <div class="root-tendril t3"></div>
      <div class="root-tendril t4"></div>
    `;
    this.front.appendChild(rb);
    requestAnimationFrame(() => rb.classList.add('active'));

    this.ring(x, y - 20, 160, '#854d0e', 0.5);

    setTimeout(() => {
      rb.classList.remove('active');
      rb.classList.add('leaving');
    }, Math.max(100, (duration - 0.25) * 1000));
    setTimeout(() => rb.remove(), duration * 1000 + 100);
  },

  /* Mr. Holloway Harvest Shield (Still Standing) */
  mrHollowayHarvestShield(x, y, dur) {
    if (!this.front || this.reducedEffects) return;
    const duration = dur || 3.0;
    const hs = el('div', 'mr-holloway-harvest-shield');
    hs.style.cssText = `left:${x - 42}px;top:${y - 55}px;`;
    hs.innerHTML = `<div class="harvest-shield-pumpkin">🎃</div>`;
    this.front.appendChild(hs);
    requestAnimationFrame(() => hs.classList.add('active'));

    setTimeout(() => {
      hs.classList.remove('active');
      hs.classList.add('leaving');
    }, Math.max(100, (duration - 0.25) * 1000));
    setTimeout(() => hs.remove(), duration * 1000 + 100);
  },

  /* Mr. Holloway Heavy Claw Slash */
  mrHollowayClawSlash(x, y, tx, ty) {
    if (!this.front || this.reducedEffects) return;
    const targetX = tx != null ? tx : x + 50;
    const targetY = ty != null ? ty : y - 25;
    const cs = el('div', 'mr-holloway-claw-slash');
    cs.style.cssText = `left:${targetX - 32}px;top:${targetY - 32}px;`;
    cs.innerHTML = `
      <div class="claw-slash-trail c1"></div>
      <div class="claw-slash-trail c2"></div>
      <div class="claw-slash-trail c3"></div>
    `;
    this.front.appendChild(cs);
    requestAnimationFrame(() => cs.classList.add('active'));

    this.part({
      x: targetX,
      y: targetY,
      vx: rnd(-40, 40),
      vy: rnd(-50, -10),
      g: 50,
      size: rnd(10, 16),
      col: '#f59e0b',
      life: 0.45,
      drag: 1.2,
      layer: 'f'
    });

    setTimeout(() => {
      cs.classList.remove('active');
      cs.classList.add('leaving');
    }, 180);
    setTimeout(() => cs.remove(), 360);
  },

  /* Delilah Keen Ichor Contamination Burst */
  delilahContaminationBurst(x, y, radius, opt) {
    if (!this.front || this.reducedEffects) return;
    opt = opt || {};
    const rad = radius || 180;
    const dur = opt.dur || 0.65;
    const v = el('div', 'delilah-contamination-burst');
    v.style.cssText = `left:${x - rad}px;top:${y - rad}px;width:${rad * 2}px;height:${rad * 2}px;`;
    v.innerHTML = `
      <div class="contamination-core"></div>
      <div class="contamination-shockwave s1"></div>
      <div class="contamination-shockwave s2"></div>
      <div class="contamination-mist"></div>
    `;
    this.front.appendChild(v);
    requestAnimationFrame(() => v.classList.add('active'));

    const runes = ['☣️', '🧪', '💜', '⚡'];
    const pCount = Math.min(14, Math.round(rad / 14));
    for (let i = 0; i < pCount; i++) {
      const ang = (i / pCount) * Math.PI * 2 + rnd(-0.25, 0.25);
      const dist = rad * rnd(0.25, 0.7);
      this.floatIcon(x + Math.cos(ang) * dist, y + Math.sin(ang) * dist - 10, pick(runes), '#caa2ff');
      this.part({
        x: x + Math.cos(ang) * dist,
        y: y + Math.sin(ang) * dist,
        vx: Math.cos(ang) * rnd(40, 90),
        vy: Math.sin(ang) * rnd(40, 90),
        g: 20,
        size: rnd(8, 16),
        col: pick(['#caa2ff', '#bd82ff', '#00e5a3', '#10b981', '#3b0764']),
        life: rnd(0.4, 0.75),
        drag: 1.25,
        layer: 'f'
      });
    }

    setTimeout(() => {
      v.classList.remove('active');
      v.classList.add('leaving');
    }, Math.max(100, (dur - 0.2) * 1000));
    setTimeout(() => v.remove(), dur * 1000 + 100);
  },

  /* Delilah Keen Containment Stasis Cell */
  delilahContainmentStasis(x, y, dur) {
    if (!this.front || this.reducedEffects) return;
    const duration = dur || 3.5;
    const cell = el('div', 'delilah-containment-stasis');
    cell.style.cssText = `left:${x - 48}px;top:${y - 95}px;`;
    cell.innerHTML = `
      <div class="containment-stasis-ring top"></div>
      <div class="containment-stasis-bars">
        <div class="bar b1"></div>
        <div class="bar b2"></div>
        <div class="bar b3"></div>
        <div class="bar b4"></div>
      </div>
      <div class="containment-stasis-ring bot"></div>
      <div class="containment-stasis-glyph">⛓️</div>
    `;
    this.front.appendChild(cell);
    requestAnimationFrame(() => cell.classList.add('active'));

    this.ring(x, y - 40, 110, '#bd82ff', 0.45);
    this.ring(x, y - 40, 140, '#00e5a3', 0.6);

    setTimeout(() => {
      cell.classList.remove('active');
      cell.classList.add('leaving');
    }, Math.max(150, (duration - 0.3) * 1000));
    setTimeout(() => cell.remove(), duration * 1000 + 120);
  },

  /* Delilah Keen Ichor Spill Pool */
  delilahIchorSpill(x, y, dur) {
    if (!this.back || this.reducedEffects) return;
    const duration = dur || 8.0;
    const pool = el('div', 'delilah-ichor-pool');
    pool.style.cssText = `left:${x - 65}px;top:${y - 25}px;`;
    pool.innerHTML = `
      <div class="ichor-pool-liquid"></div>
      <div class="ichor-pool-bubble b1"></div>
      <div class="ichor-pool-bubble b2"></div>
      <div class="ichor-pool-bubble b3"></div>
    `;
    this.back.appendChild(pool);
    requestAnimationFrame(() => pool.classList.add('active'));

    setTimeout(() => {
      pool.classList.remove('active');
      pool.classList.add('leaving');
    }, Math.max(200, (duration - 0.5) * 1000));
    setTimeout(() => pool.remove(), duration * 1000 + 100);
  },

  /* Shelly Prehistoric Fossil Excavation */
  shellyFossilExcavation(x, y, radius, opt) {
    if (!this.front || this.reducedEffects) return;
    opt = opt || {};
    const rad = radius || 260;
    const dur = opt.dur || 0.85;
    const v = el('div', 'shelly-fossil-matrix');
    v.style.cssText = `left:${x - rad}px;top:${y - rad}px;width:${rad * 2}px;height:${rad * 2}px;`;
    v.innerHTML = `
      <div class="fossil-matrix-core"></div>
      <div class="fossil-matrix-strata r1"></div>
      <div class="fossil-matrix-strata r2"></div>
      <div class="fossil-matrix-strata r3"></div>
      <div class="fossil-matrix-amber"></div>
    `;
    this.front.appendChild(v);
    requestAnimationFrame(() => v.classList.add('active'));

    const runes = ['🐚', '🦴', '🦖', '🔍', '✨', '💎'];
    const pCount = Math.min(16, Math.round(rad / 16));
    for (let i = 0; i < pCount; i++) {
      const ang = (i / pCount) * Math.PI * 2 + rnd(-0.2, 0.2);
      const dist = rad * rnd(0.25, 0.75);
      this.floatIcon(x + Math.cos(ang) * dist, y + Math.sin(ang) * dist - 12, pick(runes), '#d8b579');
      this.part({
        x: x + Math.cos(ang) * dist,
        y: y + Math.sin(ang) * dist,
        vx: Math.cos(ang) * rnd(45, 95),
        vy: Math.sin(ang) * rnd(45, 95) - 20,
        g: 35,
        size: rnd(10, 18),
        col: pick(['#fef08a', '#f59e0b', '#d97706', '#d8b579', '#78350f']),
        life: rnd(0.45, 0.8),
        drag: 1.2,
        layer: 'f'
      });
    }

    setTimeout(() => {
      v.classList.remove('active');
      v.classList.add('leaving');
    }, Math.max(120, (dur - 0.25) * 1000));
    setTimeout(() => v.remove(), dur * 1000 + 100);
  },

  /* Shelly Relentless Inspiration Whistle */
  shellyInspirationWhistle(x, y, dur) {
    if (!this.front || this.reducedEffects) return;
    const duration = dur || 2.5;
    const w = el('div', 'shelly-inspiration-aura');
    w.style.cssText = `left:${x - 55}px;top:${y - 65}px;`;
    w.innerHTML = `
      <div class="inspiration-sun-core"></div>
      <div class="inspiration-radiance-ring"></div>
      <div class="inspiration-whistle-glyph">🌞</div>
    `;
    this.front.appendChild(w);
    requestAnimationFrame(() => w.classList.add('active'));

    this.ring(x, y - 40, 220, '#f59e0b', 0.55);
    this.ring(x, y - 40, 320, '#fef08a', 0.7);

    setTimeout(() => {
      w.classList.remove('active');
      w.classList.add('leaving');
    }, Math.max(150, (duration - 0.4) * 1000));
    setTimeout(() => w.remove(), duration * 1000 + 100);
  },

  /* Shelly Prehistoric Amber Stasis */
  shellyAmberStasis(x, y, dur) {
    if (!this.front || this.reducedEffects) return;
    const duration = dur || 3.5;
    const gem = el('div', 'shelly-amber-stasis');
    gem.style.cssText = `left:${x - 45}px;top:${y - 85}px;`;
    gem.innerHTML = `
      <div class="amber-stasis-facet f1"></div>
      <div class="amber-stasis-facet f2"></div>
      <div class="amber-stasis-crystal">💎</div>
    `;
    this.front.appendChild(gem);
    requestAnimationFrame(() => gem.classList.add('active'));

    this.ring(x, y - 35, 110, '#fef08a', 0.45);
    this.ring(x, y - 35, 145, '#f59e0b', 0.6);

    setTimeout(() => {
      gem.classList.remove('active');
      gem.classList.add('leaving');
    }, Math.max(150, (duration - 0.3) * 1000));
    setTimeout(() => gem.remove(), duration * 1000 + 120);
  },

  /* ============================================================
     GINGER CONFECTION ARTISAN LIVE COMBAT VISUAL FX (DHBM)
     ============================================================ */

  /* Ginger Radiant Heart Burst (Baked With Care!) */
  gingerHeartBurst(x, y, s, opt) {
    if (!this.front || this.reducedEffects) return;
    const size = s || 135;
    const burst = el('div', 'ginger-heart-burst');
    burst.style.cssText = `left:${x - size / 2}px;top:${y - size / 2}px;width:${size}px;height:${size}px;`;
    burst.innerHTML = `
      <div class="ginger-heart-core"></div>
      <div class="ginger-heart-shockwave s1"></div>
      <div class="ginger-heart-shockwave s2"></div>
      <div class="ginger-heart-glyph">💖</div>
    `;
    this.front.appendChild(burst);
    requestAnimationFrame(() => burst.classList.add('active'));

    this.ring(x, y, size * 1.15, '#ffd166', 0.45);
    this.ring(x, y, size * 1.45, '#ff7892', 0.65);
    this.sparkle(x, y, 16, '#ffd166');

    setTimeout(() => {
      burst.classList.remove('active');
      burst.classList.add('leaving');
    }, 450);
    setTimeout(() => burst.remove(), 750);
  },

  /* Ginger Royal Icing Barrier */
  gingerRoyalIcing(x, y, s, dur) {
    if (!this.front || this.reducedEffects) return;
    const size = s || 105;
    const duration = dur || 4.5;
    const ring = el('div', 'ginger-royal-icing');
    ring.style.cssText = `left:${x - size / 2}px;top:${y - size / 2}px;width:${size}px;height:${size}px;`;
    ring.innerHTML = `
      <div class="icing-barrier-core"></div>
      <div class="icing-piping-ring"></div>
      <div class="icing-sugar-stars">✨</div>
    `;
    this.front.appendChild(ring);
    requestAnimationFrame(() => ring.classList.add('active'));

    this.ring(x, y, size * 1.1, '#ffeedb', 0.4);

    setTimeout(() => {
      ring.classList.remove('active');
      ring.classList.add('leaving');
    }, Math.max(150, (duration - 0.3) * 1000));
    setTimeout(() => ring.remove(), duration * 1000 + 100);
  },

  /* Ginger Peppermint Swirl Hearth */
  gingerPeppermintHearth(x, y, dur) {
    if (!this.back || this.reducedEffects) return;
    const duration = dur || 5.0;
    const hearth = el('div', 'ginger-peppermint-hearth');
    hearth.style.cssText = `left:${x - 70}px;top:${y - 24}px;`;
    hearth.innerHTML = `
      <div class="peppermint-hearth-glow"></div>
      <div class="peppermint-mote m1">🍬</div>
      <div class="peppermint-mote m2">✨</div>
      <div class="peppermint-mote m3">🍪</div>
    `;
    this.back.appendChild(hearth);
    requestAnimationFrame(() => hearth.classList.add('active'));

    this.sparkle(x, y - 20, 12, '#ffb56b');

    setTimeout(() => {
      hearth.classList.remove('active');
      hearth.classList.add('leaving');
    }, Math.max(150, (duration - 0.4) * 1000));
    setTimeout(() => hearth.remove(), duration * 1000 + 100);
  },

  /* Ginger Emergency Last Bite */
  gingerLastBite(x, y) {
    if (!this.front || this.reducedEffects) return;
    this.gingerHeartBurst(x, y, 120);
    this.floatItem(x, y - 30, 'Trinkets/GINGER_PeppermintIcing', '#ff7892');
    this.sparkle(x, y - 20, 20, '#ffd166');
    this.floatIcon(x, y - 85, '🍪 EMERGENCY LAST BITE!', '#ff7892');
  },

  /* Vee Live Broadcast Climax Transformation */
  veeLiveBroadcast(x, y) {
    if (!this.front || this.reducedEffects) return;
    const size = 160;
    const broadcast = el('div', 'vee-live-broadcast');
    broadcast.style.cssText = `left:${x - size / 2}px;top:${y - size / 2}px;width:${size}px;height:${size}px;`;
    broadcast.innerHTML = `
      <div class="vee-live-aura"></div>
      <div class="vee-live-scanlines"></div>
      <div class="vee-live-sign"><i></i>LIVE</div>
    `;
    this.front.appendChild(broadcast);
    requestAnimationFrame(() => broadcast.classList.add('active'));

    this.ring(x, y, 180, '#ff2b6b', 0.55);
    this.ring(x, y, 240, '#7be0ff', 0.75);
    this.sparkle(x, y, 20, '#7be0ff');

    setTimeout(() => {
      broadcast.classList.remove('active');
      broadcast.classList.add('leaving');
    }, 1800);
    setTimeout(() => broadcast.remove(), 2200);
  },

  /* Squirm Full Biblio-Panic Climax Transformation */
  squirmBiblioPanic(x, y) {
    if (!this.front || this.reducedEffects) return;
    const size = 160;
    const panic = el('div', 'squirm-biblio-panic');
    panic.style.cssText = `left:${x - size / 2}px;top:${y - size / 2}px;width:${size}px;height:${size}px;`;
    panic.innerHTML = `
      <div class="squirm-biblio-aura"></div>
      <div class="squirm-biblio-pages"></div>
      <div class="squirm-biblio-sign">📚 BIBLIO-PANIC!</div>
    `;
    this.front.appendChild(panic);
    requestAnimationFrame(() => panic.classList.add('active'));

    this.ring(x, y, 170, '#f5e5b2', 0.55);
    this.ring(x, y, 230, '#cba76c', 0.75);
    this.burst(x, y - 30, 16, ['#f4e7bb', '#c9a979', '#a9c68b', '#fff'],
      { shape: 'paper', spMin: 70, spMax: 200, lift: 80, sMin: 5, sMax: 12, life: 0.75, g: 420 });

    setTimeout(() => {
      panic.classList.remove('active');
      panic.classList.add('leaving');
    }, 1800);
    setTimeout(() => panic.remove(), 2200);
  }
};


