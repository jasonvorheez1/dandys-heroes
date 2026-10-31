/* Keeps the combat log clear of the ally dock by publishing the dock's real height. */
(() => {
  const dock = document.getElementById('allyDock'), hud = document.getElementById('battleHud');
  if (!dock || !hud || !window.ResizeObserver) return;
  const sync = () => {
    const wide = matchMedia('(orientation:landscape) and (max-height:520px)').matches;
    hud.style.setProperty('--dock-h', wide ? '0px' : Math.ceil(dock.getBoundingClientRect().height + 6) + 'px');
  };
  new ResizeObserver(sync).observe(dock);
  addEventListener('orientationchange', sync);
  addEventListener('resize', sync);
  sync();
})();
