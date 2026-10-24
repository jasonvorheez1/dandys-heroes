/* ff7-victory.js - when Cloud, Tifa, Cait Sith or Aerith are on a winning
   team, the results card becomes FF7's own victory screens: "Gained EXP and
   AP." then "Received Gil and items.", with the Victory Fanfare. Everyone on
   the team gets a row, FF7 cast or not. */
'use strict';

const FF7Victory = {
  applies(b) { return !!(b && b.units.some(u => u.team === TEAM_P && !u.minion && u.def && u.def.ff7)); },

  show(screen, res, cfg) {
    const b = screen.active;
    Music.stop();
    Music.play('ff7Victory', { force: true });
    const box = $('#battleEnd');
    box.hidden = false; clear(box);
    box.classList.remove('elevator-closing', 'wrap-loss', 'machine-result-screen');
    box.classList.add('ff7-victory');

    const rewards = cfg.rewards ? cfg.rewards(res) : {};
    const mine = b.units.filter(u => u.team === TEAM_P && !u.minion);
    const foes = b.units.filter(u => u.team === TEAM_E && !u.minion);
    const shards = typeof collectTwistedShardDrops === 'function' ? collectTwistedShardDrops(b) : {};
    const exp = rewards.exp || 0, ap = rewards.star || 0, gil = rewards.ichor || 0;
    const win = (cls, html) => `<div class="ff7-win ${cls}">${html}</div>`;
    const num = n => `${fmt(Math.round(n))}<small>p</small>`;

    const rows = mine.map(u => {
      const h = Save.owns(u.id) && !u.temporary ? Save.hero(u.id) : null;
      const lv = h ? h.level : u.level;
      const need = typeof levelExp === 'function' ? levelExp(lv) : 1000;
      const have = h ? h.exp || 0 : 0;
      const pic = u.def.ff7 && FF7_VN_ART[u.id] ? ASSET + FF7_VN_ART[u.id] : Art.icon(u.id);
      return win('ff7v-row' + (u.alive ? '' : ' ko'), `<img src="${pic}" alt="">
        <div class="ff7v-who"><b>${u.name}</b><span>Level:<em>${lv}</em></span></div>
        <div class="ff7v-exp"><span>EXP:</span><em data-count="${have}">${num(0)}</em>
          <u><s data-fill="${clamp(have / Math.max(1, need), 0, 1)}"></s></u>
          <span>next level:</span><em>${h ? num(Math.max(0, need - have)) : 'LOAN'}</em></div>`);
    }).join('');

    const items = [];
    Object.keys(rewards).forEach(k => { if (rewards[k] && RES[k] && !['ichor', 'exp', 'star'].includes(k)) items.push([RES[k].name, rewards[k]]); });
    Object.entries(shards).forEach(([id, n]) => items.push([(HEROES[id] ? HEROES[id].name : id) + ' Shard', n]));

    const page1 = el('div', 'ff7v-page');
    page1.innerHTML = win('ff7v-msg', 'Gained EXP and AP.') +
      `<div class="ff7v-totals">${win('', `<span>EXP</span><em data-count="${exp}">${num(0)}</em>`)}${win('', `<span>AP</span><em data-count="${ap}">${num(0)}</em>`)}</div>` + rows;
    const page2 = el('div', 'ff7v-page');
    page2.innerHTML = win('ff7v-msg', 'Received Gil and items.') +
      `<div class="ff7v-totals">${win('', `<span>Gil</span><em data-count="${gil}">${fmt(0)}</em>`)}${win('', `<span>Defeated</span><em>${foes.filter(f => !f.alive).length}</em>`)}</div>` +
      win('ff7v-items', items.length ? items.map(([n, v]) => `<p><i class="ff7v-bag"></i><span>${n}</span><b>×${fmt(v)}</b></p>`).join('') : '<p><span>Nothing else dropped.</span></p>');
    box.appendChild(page1);

    let page = 1, timers = [];
    const countUp = root => {
      root.querySelectorAll('[data-count]').forEach(n => {
        const to = Number(n.dataset.count) || 0, unit = n.innerHTML.includes('<small>');
        const start = performance.now(), dur = 1100;
        const tick = now => {
          const k = clamp((now - start) / dur, 0, 1), v = to * k;
          n.innerHTML = unit ? num(v) : fmt(Math.round(v));
          if (k < 1 && n.isConnected) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
      });
      root.querySelectorAll('[data-fill]').forEach(s => { timers.push(setTimeout(() => { s.style.width = (Number(s.dataset.fill) * 100) + '%'; }, 200)); });
      Sound.play('ichor_gain', { vol: .3 });
    };
    timers.push(setTimeout(() => countUp(page1), 450));

    const close = () => {
      timers.forEach(clearTimeout);
      box.removeEventListener('click', next);
      document.removeEventListener('keydown', key);
      box.classList.remove('ff7-victory');
      const done = screen.onDone;
      screen.onDone = null;
      try { screen.close(); }
      catch (err) {
        console.error('ff7 result cleanup failed', err);
        $('#battleEnd').hidden = true; $('#battle').hidden = true; $('#app').hidden = false; screen.active = null;
      }
      if (done) {
        try { done(res); }
        catch (err) { console.error('battle result handoff failed', err); $('#app').hidden = false; }
      }
    };
    const next = () => {
      Sound.play('ff7_cursor_move', { vol: .4 });
      if (page === 1) { page = 2; clear(box); box.appendChild(page2); countUp(page2); }
      else close();
    };
    const key = e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); next(); } };
    box.addEventListener('click', next);
    document.addEventListener('keydown', key);
  }
};
