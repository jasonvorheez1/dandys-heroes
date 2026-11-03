/* flowery-pack.js - reads assets/flowery/flowery.bin (built by tools/flowery/build-pack.py) for the "Flower Kingdom" event.
   One file holds every sprite the event uses (packed atlas sheets) plus any music. Frames keep their original canvas size,
   so animation frames line up: draw(name, x, y) anchors on the bottom centre of the original canvas by default. */
'use strict';

(() => {
  const URL_BIN = (typeof ASSET !== 'undefined' ? ASSET : './') + 'assets/flowery/flowery.bin';
  const P = { frames: {}, sheets: [], music: {}, voice: {}, sfx: {}, raw: {}, buf: {}, ok: false, tints: {} };
  let readyResolve;
  P.ready = new Promise(r => { readyResolve = r; });
  let started = false;
  P.load = () => {
    if (started) return P.ready;
    started = true;
    fetch(URL_BIN).then(r => { if (!r.ok) throw new Error('flowery.bin ' + r.status); return r.arrayBuffer(); }).then(buf => {
      const u8 = new Uint8Array(buf);
      const magic = String.fromCharCode(...u8.slice(0, 8));
      if (magic !== 'DHFLWR01') throw new Error('bad pack');
      const hlen = new DataView(buf).getUint32(8, true);
      const head = JSON.parse(new TextDecoder().decode(u8.slice(12, 12 + hlen)));
      const base = 12 + hlen;
      P.frames = head.frames;
      const sheetJobs = [];
      head.files.forEach(f => {
        const blob = new Blob([buf.slice(base + f.off, base + f.off + f.len)], { type: f.type });
        const url = URL.createObjectURL(blob);
        if (f.name.startsWith('atlas-')) {
          const i = parseInt(f.name.slice(6), 10), img = new Image();
          P.sheets[i] = img;
          sheetJobs.push(new Promise(res => { img.onload = img.onerror = res; img.src = url; }));
        } else if (f.name.startsWith('music/')) {
          P.music[f.name.slice(6).replace(/\.ogg$/, '')] = url;
        } else if (f.name.startsWith('voice/') || f.name.startsWith('sfx/')) {
          const kind = f.name.startsWith('voice/') ? 'voice' : 'sfx', key = f.name.slice(kind.length + 1).replace(/\.ogg$/, '');
          P[kind][key] = url;
          P.raw[kind + ':' + key] = buf.slice(base + f.off, base + f.off + f.len);
        }
      });
      return Promise.all(sheetJobs);
    }).then(() => { P.ok = true; readyResolve(P); }).catch(e => { console.warn('[flowery] pack failed', e); readyResolve(P); });
    return P.ready;
  };

  P.has = n => !!P.frames[n];
  P.size = n => { const f = P.frames[n]; return f ? { w: f[7], h: f[8] } : { w: 0, h: 0 }; };

  /* tinted copy of a whole sheet region, cached (Omega Flowery's white pieces, silhouettes, flashes) */
  function tinted(n, color) {
    const key = n + '|' + color;
    if (P.tints[key]) return P.tints[key];
    const f = P.frames[n], src = P.sheets[f[0]];
    const c = document.createElement('canvas'); c.width = f[3]; c.height = f[4];
    const x = c.getContext('2d');
    x.drawImage(src, f[1], f[2], f[3], f[4], 0, 0, f[3], f[4]);
    x.globalCompositeOperation = 'source-atop'; x.fillStyle = color; x.fillRect(0, 0, f[3], f[4]);
    return (P.tints[key] = c);
  }

  /* o: s (scale), ax/ay (anchor 0..1 of the ORIGINAL canvas, default .5/1), flip, alpha, rot, tint (css colour, fills the shape),
        mul (css colour multiplied over), add (lighter glow colour) */
  P.draw = (ctx, n, x, y, o = {}) => {
    const f = P.frames[n];
    if (!f || !P.sheets[f[0]]) return false;
    const s = o.s || 1, ax = o.ax == null ? .5 : o.ax, ay = o.ay == null ? 1 : o.ay;
    ctx.save();
    ctx.translate(Math.round(x), Math.round(y));
    if (o.rot) ctx.rotate(o.rot);
    if (o.flip) ctx.scale(-1, 1);
    if (o.sx || o.sy) ctx.scale(o.sx || 1, o.sy || 1);
    if (o.alpha != null) ctx.globalAlpha *= o.alpha;
    if (o.blend) ctx.globalCompositeOperation = o.blend;
    const dx = (f[5] - f[7] * ax) * s, dy = (f[6] - f[8] * ay) * s, w = f[3] * s, h = f[4] * s;
    if (o.tint) ctx.drawImage(tinted(n, o.tint), dx, dy, w, h);
    else ctx.drawImage(P.sheets[f[0]], f[1], f[2], f[3], f[4], dx, dy, w, h);
    if (o.add) { ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha *= o.addA == null ? .5 : o.addA; ctx.drawImage(tinted(n, o.add), dx, dy, w, h); }
    ctx.restore();
    return true;
  };
  /* a rectangle of a sheet sprite (tileset regions), in source pixels */
  P.blit = (ctx, n, sx, sy, sw, sh, dx, dy, dw, dh) => {
    const f = P.frames[n];
    if (!f || !P.sheets[f[0]]) return;
    ctx.drawImage(P.sheets[f[0]], f[1] + sx - f[5], f[2] + sy - f[6], sw, sh, Math.round(dx), Math.round(dy), dw == null ? sw : dw, dh == null ? sh : dh);
  };
  /* a data URL of one frame (event card art) */
  P.url = (n, s = 2) => {
    const f = P.frames[n];
    if (!f || !P.sheets[f[0]]) return '';
    const c = document.createElement('canvas'); c.width = f[7] * s; c.height = f[8] * s;
    const x = c.getContext('2d'); x.imageSmoothingEnabled = false;
    x.drawImage(P.sheets[f[0]], f[1], f[2], f[3], f[4], f[5] * s, f[6] * s, f[3] * s, f[4] * s);
    return c.toDataURL('image/png');
  };
  /* short sounds play through Web Audio (no lag on text blips); decoded the first time they are needed */
  let AC = null;
  P.ctx = () => { try { AC = AC || new (window.AudioContext || window.webkitAudioContext)(); if (AC.state === 'suspended') AC.resume(); } catch (_) { AC = null; } return AC; };
  P.decode = id => {
    if (P.buf[id] || !P.raw[id] || !P.ctx()) return P.buf[id];
    const raw = P.raw[id]; P.raw[id] = null;
    AC.decodeAudioData(raw.slice(0)).then(b => { P.buf[id] = b; }).catch(() => {});
    return null;
  };
  P.warm = () => { Object.keys(P.raw).forEach(id => { if (id.startsWith('sfx:') || /voice:noise/.test(id)) P.decode(id); }); };
  P.play = (id, vol = .6, rate = 1) => {
    const b = P.decode(id) || P.buf[id];
    if (!b || !AC) return false;
    try {
      const g = AC.createGain(), src = AC.createBufferSource();
      const master = typeof Sound !== 'undefined' ? (Sound.on === false ? 0 : (typeof Sound.vol === 'number' ? Sound.vol : 1)) : 1;
      g.gain.value = vol * master; src.buffer = b; src.playbackRate.value = rate;
      src.connect(g); g.connect(AC.destination); src.start();
      return src;
    } catch (_) { return false; }
  };
  P.anim = (base, n, t, fps = 8) => base + '_' + (Math.floor(t * fps) % n);

  window.FlPack = P;
})();
