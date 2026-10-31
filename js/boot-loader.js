/* Show the title screen as soon as its markup is ready, while game assets load. */
'use strict';

(() => {
  const boot = document.getElementById('boot');
  const launcher = document.getElementById('launcher');
  const play = document.getElementById('launcherPlay');
  const settings = document.getElementById('launcherSettings');
  const status = document.getElementById('launcherStatus');

  launcher.hidden = false;
  requestAnimationFrame(() => launcher.classList.add('visible'));
  boot.classList.add('done');
  setTimeout(() => boot.remove(), 550);

  window.BootStatus = {
    set(message) { status.textContent = message; },
    ready() {
      play.textContent = 'Play';
      play.disabled = false;
      settings.disabled = false;
      status.hidden = true;
    },
    fail() {
      status.textContent = 'Loading failed. Please try again.';
      play.textContent = 'Retry';
      play.disabled = false;
      play.onclick = () => location.reload();
    }
  };
})();
