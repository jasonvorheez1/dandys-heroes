/* GPU battle effects. The existing FX API owns timing and gameplay cues;
   this renderer owns the reusable visual bursts when WebGL is available. */
'use strict';

const EffekseerFX = (() => {
  const ROOT = 'vendor/effekseer/';
  const FILES = {
    impact: 'Simple_Ring_Shape2.efk',
    blast: 'Simple_Ring_Shape1.efk',
    slash: 'Simple_Ribbon_Sword.efk',
    butterflies: 'HATO/Butterfliesflutter/aoi-chou.efkefc',
    celebration: 'HATO/celebration/iwai-ume.efkefc',
    fireworks: 'Library/00_Basic/Simple_Turbulence_Fireworks.efkefc',
    aura: 'Library/00_Version16/Aura01.efkefc',
    barrier: 'Library/00_Version16/Barrior01.efkefc',
    vortex: 'Library/00_Version16/ForceFieldTornado.efkefc'
  };
  // One accent per skill beat. Props, hit feedback, and timing still come from
  // each character's authored battle choreography.
  const CHARACTER_EFFECTS = {
    Astro: { cast: ['aura', '#a9a5ff', .16], impact: ['aura', '#ded4ff', .09] },
    Flutter: { cast: ['butterflies', '#86e5ff', .12] },
    Sprout: { cast: ['celebration', '#c9f5a1', .10] },
    Yatta: { cast: ['fireworks', '#ffd77b', .13, 'W'] },
    Poppy: { cast: ['fireworks', '#ff94cc', .14], impact: ['fireworks', '#ffc2e3', .10] },
    Gigi: { cast: ['fireworks', '#ffd0e8', .12] },
    Goob: { cast: ['barrier', '#ffc87d', .14, 'W'] },
    Soulvester: { cast: ['barrier', '#dce9ff', .13, 'W'] },
    Tisha: { cast: ['vortex', '#a1f3ec', .15] },
    Dandy: { cast: ['celebration', '#ffe59a', .12, 'W'], impact: ['fireworks', '#fff3bd', .10] },
    Delilah: { cast: ['aura', '#c99bff', .13] },
    Eclipse: { cast: ['vortex', '#a482ed', .15] }
  };
  const effects = Object.create(null);
  const requested = new Set(['impact', 'blast', 'slash', 'fireworks']);
  const loading = new Set();
  const unavailable = new Set();
  const active = new Set();
  const expires = new Map();
  const camera = new Float32Array([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, -1000, 1]);
  const projection = new Float32Array(16);
  let canvas, gl, context, starting = false, failed = false;
  let width = 0, height = 0;
  let dirty = false;

  function requestEffect(name) {
    if (!FILES[name] || unavailable.has(name)) return;
    requested.add(name);
    if (!context || effects[name] || loading.has(name)) return;
    loading.add(name);
    const file = FILES[name];
    try {
      const effect = context.loadEffect(ROOT + 'Resources/' + file, 1,
        () => { effects[name] = effect; loading.delete(name); },
        (reason, path) => {
          loading.delete(name);
          unavailable.add(name);
          console.warn('Effekseer effect unavailable:', path || file, reason);
        });
    } catch (error) {
      loading.delete(name);
      unavailable.add(name);
      console.warn('Effekseer effect unavailable:', file, error);
    }
  }

  function warmCharacters(units) {
    for (const unit of units || []) {
      const cues = CHARACTER_EFFECTS[unit.id];
      if (!cues) continue;
      for (const cue of Object.values(cues)) requestEffect(cue[0]);
    }
  }

  function resize() {
    if (!canvas) canvas = document.getElementById('effekseerLayer');
    if (!canvas) return;
    const stage = canvas.parentElement;
    const w = Math.max(1, Math.round(stage.clientWidth || 560));
    const h = Math.max(1, Math.round(stage.clientHeight || 760));
    if (w === width && h === height) return;
    width = w; height = h;
    const density = Math.min(window.devicePixelRatio || 1, 1.5);
    canvas.width = Math.round(w * density);
    canvas.height = Math.round(h * density);
    if (gl) gl.viewport(0, 0, canvas.width, canvas.height);
    projection.fill(0);
    projection[0] = 2 / w;
    projection[5] = 2 / h;
    projection[10] = -2 / 2000;
    projection[14] = -1;
    projection[15] = 1;
    if (context) {
      context.setProjectionMatrix(projection);
      context.setCameraMatrix(camera);
    }
  }

  function prepare() {
    if (starting || failed || context || !window.effekseer) return;
    canvas = document.getElementById('effekseerLayer');
    if (!canvas) return;
    gl = canvas.getContext('webgl2', { alpha: true, antialias: false, premultipliedAlpha: true }) ||
      canvas.getContext('webgl', { alpha: true, antialias: false, premultipliedAlpha: true });
    if (!gl) { failed = true; return; }
    starting = true;
    resize();
    effekseer.initRuntime(ROOT + 'effekseer.wasm', () => {
      try {
        context = effekseer.createContext();
        context.init(gl, { instanceMaxCount: 1000, squareMaxCount: 4000 });
        // This canvas has no other WebGL renderer, so state restoration only
        // adds driver work after every effect draw.
        context.setRestorationOfStatesFlag(false);
        resize();
        context.setProjectionMatrix(projection);
        context.setCameraMatrix(camera);
        for (const name of requested) requestEffect(name);
      } catch (error) {
        failed = true;
        console.warn('Effekseer initialization failed:', error);
      }
    }, error => {
      failed = true;
      console.warn('Effekseer runtime unavailable:', error);
    });
  }

  function colorBytes(color) {
    if (typeof color !== 'string') return [255, 255, 255, 255];
    const hex = color.trim();
    if (/^#[0-9a-f]{3}$/i.test(hex)) return [1, 2, 3].map(i => parseInt(hex[i] + hex[i], 16)).concat(255);
    if (/^#[0-9a-f]{6}$/i.test(hex)) return [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16)).concat(255);
    return [255, 255, 255, 255];
  }

  function play(name, x, y, size, color, options = {}) {
    if (!context || !effects[name] || !canvas || failed || active.size >= 28 ||
      !Number.isFinite(x) || !Number.isFinite(y) ||
      document.documentElement.classList.contains('accessibility-reduced-effects')) return false;
    if (canvas.closest('#battle[hidden], #battle.story-tb')) return false;
    resize();
    try {
      const handle = context.play(effects[name], x - width / 2, height / 2 - y, 0);
      if (!handle) return false;
      const scale = Math.max(2, Math.min(120, (size || 50) *
        (Number.isFinite(options.scale) ? options.scale : name === 'slash' ? .28 : .16)));
      handle.setScale(scale, scale, scale);
      if (options.angle) handle.setRotation(0, 0, -options.angle * Math.PI / 180);
      handle.setAllColor(...colorBytes(color));
      active.add(handle);
      expires.set(handle, performance.now() + (options.durationMs || 1800));
      dirty = true;
      return true;
    } catch (error) {
      console.warn('Effekseer playback failed:', error);
      failed = true;
      return false;
    }
  }

  function playCharacter(id, phase, x, y, options = {}) {
    if (typeof FX !== 'undefined' && (FX.offscreen || FX.reducedEffects ||
        FX._denseVisualSafe || FX.particleMode === 'off' || FX.graphicsQuality <= 33)) return false;
    const cue = CHARACTER_EFFECTS[id]?.[phase];
    if (!cue || (cue[3] && cue[3] !== options.key)) return false;
    requestEffect(cue[0]);
    const size = Math.min(150, (options.size || 90) * (options.key === 'W' ? 1.18 : .9));
    return play(cue[0], x, y, size, cue[1], { scale: cue[2], durationMs: 1100 });
  }

  function burst(x, y, count, color, options = {}) {
    if (!context || !effects.fireworks || failed || !canvas ||
        canvas.closest('#battle[hidden], #battle.story-tb')) return false;
    // A dense fight can generate many simultaneous decorative bursts. If the
    // GPU budget is full, omit this one instead of rebuilding a DOM particle
    // cluster on the CPU.
    if (active.size >= 18) return true;
    const palette = Array.isArray(color) ? color : [color];
    const tint = palette[Math.floor(Math.random() * palette.length)] || '#ffffff';
    const size = Math.max(28, Math.min(95, 30 + count * 3));
    return play('fireworks', x, y, size, tint,
      { scale: options.scale || .09, durationMs: 650 });
  }

  function update(dt) {
    if (!context || failed || !canvas || canvas.closest('#battle[hidden], #battle.story-tb')) return;
    if (!active.size && !dirty) return;
    resize();
    try {
      const now = performance.now();
      for (const handle of active) {
        if (!handle.exists || now >= expires.get(handle)) {
          if (handle.exists) handle.stop();
          active.delete(handle);
          expires.delete(handle);
        }
      }
      if (active.size) context.update(Math.max(0, Math.min(3, dt * 60)));
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
      if (active.size) context.draw();
      dirty = active.size > 0;
    } catch (error) {
      failed = true;
      console.warn('Effekseer rendering failed:', error);
    }
  }

  function clear() {
    for (const handle of active) handle.stop();
    active.clear();
    expires.clear();
    dirty = false;
    if (context) context.stopAll();
    if (gl && canvas) {
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    }
  }

  return { prepare, resize, warmCharacters, play, playCharacter, burst, update, clear };
})();
