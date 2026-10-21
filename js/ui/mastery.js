/* mastery.js - account-level celebrations. Kept outside Save so progress
   rules remain data-only while the presentation can be skipped safely in
   headless or early-loading contexts. */
'use strict';

const MasteryCelebration = {
  queue: [],
  active: false,
  play(level, reward, cap, from = level - 1) {
    // A large payout can cross several account levels at once. Only keep the
    // latest pending card so level-up feedback never becomes a parade.
    this.queue = [{ level, reward, cap, from }];
    if (!this.active) this.showNext();
  },
  showNext() {
    const next = this.queue.shift();
    if (!next) { this.active = false; return; }
    this.active = true;
    const { level, reward, cap, from } = next;
    const wrap = el('div', 'mastery-levelup compact');
    const rewards = Object.keys(reward || {}).filter(k => RES[k]).map(k =>
      `<span><i>${RES[k].icon}</i>${fmt(reward[k])}</span>`).join('');
    const crossed = step => Math.floor(level / step) > Math.floor(from / step);
    const milestone = crossed(75) ? 'CORE MILESTONE' : crossed(50) ? 'DIAMOND MILESTONE'
      : crossed(25) ? 'CRATE MILESTONE' : crossed(10) ? 'TRAINING MILESTONE' : 'ACCOUNT LEVEL UP';
    wrap.innerHTML = `<div class="mastery-burst" aria-hidden="true"></div><article>
      <small>${milestone}</small><div class="mastery-medal">🏅</div>
      <h2>MASTERY ${level}</h2><p>${level - from > 1 ? `+${level - from} LEVELS · ` : ''}${level >= cap ? 'CURRENT ACCOUNT CAP REACHED' : 'HERO LEVEL CAP INCREASED'}</p>
      <div class="mastery-rewards">${rewards}</div></article>`;
    document.body.appendChild(wrap);
    const dismiss = () => {
      if (!wrap.isConnected || wrap.classList.contains('leaving')) return;
      wrap.classList.add('leaving');
      setTimeout(() => { wrap.remove(); this.showNext(); }, 260);
    };
    wrap.addEventListener('click', dismiss, { once: true });
    setTimeout(dismiss, 2200);
    if (crossed(25) && typeof FX !== 'undefined') FX.confetti(window.innerWidth / 2, Math.min(window.innerHeight * .42, 310), 16);
  }
};
