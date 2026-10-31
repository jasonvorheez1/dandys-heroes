/* Compatibility bridge for embedded hosts. Layout uses the real viewport;
   desktop windows are no longer replaced by a simulated phone iframe. */
(function () {
  'use strict';
  if (window.top === window) return;
  try {
    let own;
    Object.defineProperty(window, 'websim', {
      configurable: true,
      get() {
        if (own !== undefined) return own;
        try { return window.parent.websim; } catch (_) { return undefined; }
      },
      set(value) { own = value; }
    });
  } catch (_) { /* An isolated host can supply its own runtime. */ }
})();
