/* mobile-frame.js - on a wide (desktop) window, show the game inside a
   Samsung Galaxy S25 sized frame (360x780 CSS px), portrait or turned
   sideways with the rotate button. The game runs in an
   iframe so its media queries and viewport units see a real phone viewport.
   Add ?desktop to the URL to bypass. Inside the frame this file only makes
   the websim runtime reachable. */
(function () {
  'use strict';
  const W = 360, H = 780;

  if (window.top !== window) {
    // The platform runtime is injected into the outer page; share it.
    try {
      let own;
      Object.defineProperty(window, 'websim', {
        configurable: true,
        get() {
          if (own !== undefined) return own;
          try { return window.parent.websim; } catch (e) { return undefined; }
        },
        set(v) { own = v; }
      });
    } catch (e) { /* cross-origin parent: nothing to share */ }
    return;
  }
  if (location.protocol === 'file:' || /[?&]desktop\b/.test(location.search) || window.innerWidth <= 500) return;

  // Stop the outer copy of the game from booting; the frame loads its own.
  window.stop();
  const src = location.pathname + (location.search || '?') + (location.search ? '&' : '') + 'framed=1';
  const html = document.documentElement;
  html.innerHTML = '<head><meta charset="utf-8"><title>' + document.title + '</title></head><body></body>';
  Object.assign(html.style, { height: '100%', background: '#0b0d12' });
  Object.assign(document.body.style, { margin: 0, height: '100%', display: 'flex',
    alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
    background: 'radial-gradient(circle at 50% 40%,#1b2030,#07080c 70%)' });

  const phone = document.createElement('div');
  Object.assign(phone.style, { position: 'relative', width: W + 'px', height: H + 'px', flex: 'none',
    borderRadius: '38px', background: '#000', transformOrigin: '50% 50%',
    boxShadow: '0 0 0 9px #14161c,0 0 0 11px #2a2e3a,0 30px 80px #000c' });
  const frame = document.createElement('iframe');
  frame.src = src; frame.title = 'Game';
  frame.allow = 'autoplay; fullscreen';
  Object.assign(frame.style, { width: W + 'px', height: H + 'px', border: 0, borderRadius: '38px',
    background: '#000', display: 'block' });
  phone.appendChild(frame);
  document.body.appendChild(phone);

  let sideways = false;
  try { sideways = localStorage.getItem('phoneFrameLandscape') === '1'; } catch (e) {}
  const fit = () => {
    const w = sideways ? H : W, h = sideways ? W : H;
    phone.style.width = frame.style.width = w + 'px';
    phone.style.height = frame.style.height = h + 'px';
    const k = Math.min(1, (innerHeight - 90) / (h + 22), (innerWidth - 40) / (w + 22));
    phone.style.transform = 'scale(' + k + ')';
  };
  const rotate = document.createElement('button');
  rotate.type = 'button';
  rotate.textContent = '⟳';
  rotate.title = rotate.ariaLabel = 'Rotate phone';
  Object.assign(rotate.style, { position: 'fixed', left: '50%', bottom: '14px', transform: 'translateX(-50%)',
    width: '44px', height: '44px', border: '2px solid #3a4052', borderRadius: '50%', background: '#1b1f2a',
    color: '#d8deea', font: '22px/1 Arial,sans-serif', cursor: 'pointer' });
  rotate.onclick = () => {
    sideways = !sideways;
    try { localStorage.setItem('phoneFrameLandscape', sideways ? '1' : '0'); } catch (e) {}
    fit();
  };
  document.body.appendChild(rotate);
  addEventListener('resize', fit); fit();
})();
