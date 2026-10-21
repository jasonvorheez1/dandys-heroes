/* screens/crates.js - Gold/Diamond crate pulls and crate pool browsers.
   Extends Screens (screens/core.js). */
'use strict';

Object.assign(Screens, {

  /* ============================================================ CRATES */
  crates(s) {
    s.classList.add('crates-screen');
    const head = el('div', 'card');
    head.classList.add('crate-head');
    const lv = Gacha.crateLevel();
    head.innerHTML = `<div class="row"><div class="grow">
      <div class="b">Crate Resources · Level ${lv}</div>
      <div class="tiny muted">Every crate includes its reveal plus a full supply cache. Mastery ${Gacha.mastery()} rewards ×${Gacha.masteryMultiplier().toFixed(2)}; Main Character Crates count double toward the shared level.</div>
      </div></div>`;
    head.appendChild(UI.bar(1 - Gacha.nextLevelAt() / 40, 'linear-gradient(90deg,#7be0ff,#c17bff)'));
    s.appendChild(head);

    const row = el('div', 'grid3');
    [['gold', 'Gold Crate', '📦', '44% Hero research · full supply cache.'],
     ['diamond', 'Diamond Crate', '💎', '58% Hero research · premium supply cache.'],
     ['main', 'Main Character Crate', '🌟', '78% Hero research · elite supply cache.']].forEach(([k, name, ic, sub]) => {
      const c = el('article', 'crate ' + k);
      c.dataset.kind = k;
      const held = Save.res(k);
      c.innerHTML = `<div class="cbox">${ic}</div><div class="b">${name}</div>
        <div class="mini muted center" style="padding:0 4px">${sub}</div>
        <div class="pill crate-held" style="margin-top:4px">Held: <b>${held}</b></div>`;
      const btns = el('div', 'row'); btns.style.marginTop = '6px';
      const one = el('button', 'btn tiny', 'Open 1');
      const ten = el('button', 'btn gold tiny', `Open ${Math.min(10, held) || 10}`);
      const all = el('button', 'btn tiny crate-open-all', held > 10 ? `Open all · ${held}` : 'Open all');
      [one, ten, all].forEach(btn => {
        btn.type = 'button';
        btn.disabled = held < 1;
        btn.setAttribute('aria-label', `${btn.textContent} ${name}`);
      });
      one.onclick = () => this.doOpen(k, 1);
      ten.onclick = () => this.doOpen(k, Math.min(10, held));
      all.onclick = () => this.doOpen(k, Save.res(k));
      btns.appendChild(one); btns.appendChild(ten);
      c.appendChild(btns);
      c.appendChild(all);
      const buy = el('button', 'btn tiny wide', `Buy 1 · ${RES.ichor.icon}${fmt(Gacha.buyCost(k, 1).ichor)}`);
      buy.type = 'button';
      buy.setAttribute('aria-label', `Buy one ${name}`);
      buy.style.marginTop = '4px';
      buy.onclick = () => {
        if (!Save.spend(Gacha.buyCost(k, 1))) { UI.toast('Not enough Ichor'); Sound.play('ui_err'); return; }
        Save.give({ [k]: 1 }); Sound.play('gacha', { vol: .62 }); this.render();
      };
      c.appendChild(buy);
      row.appendChild(c);
    });
    s.appendChild(row);

    this.section(s, 'GOLD CRATE POOL');
    s.appendChild(this.poolGrid(cratePool('gold')));
    this.section(s, 'DIAMOND CRATE POOL');
    s.appendChild(this.poolGrid(cratePool('diamond')));
    this.section(s, 'MAIN CHARACTER CRATE POOL');
    s.appendChild(this.poolGrid(cratePool('main')));

    const note = el('div', 'card');
    note.innerHTML = `<div class="tiny muted">Rarer Heroes appear less often and need far more shards to unlock:
      a Common takes ${OBTAIN.Common.unlock}, a Main Character ${OBTAIN.Main.unlock}, a Lethal ${OBTAIN.Lethal.unlock}.
      Main Character Crates focus on ${OBTAIN.Main.name}s and Dandy. Lethals other than Dandy remain encounter rewards. Duplicates always arrive as shards, so no pull is wasted.</div>`;
    s.appendChild(note);
  },

  poolGrid(ids) {
    const g = el('div', 'grid4');
    const fragment = document.createDocumentFragment();
    ids.slice().sort((a, b) => obtainOf(a).rank - obtainOf(b).rank).forEach(id => {
      const o = obtainOf(id);
      const owned = Save.owns(id);
      const c = el('div', 'pullcard pool-card');
      c.style.animation = 'none';
      c.style.borderColor = o.color;
      c.innerHTML = `<img src="${Art.icon(id)}" loading="lazy" decoding="async" alt="${owned ? HEROES[id].name : 'Unknown hero'}" style="${owned ? '' : 'filter:brightness(0)'}"><div class="mini b">${owned ? HEROES[id].name : '???'}</div>
        <div class="mini" style="color:${o.color}">${o.icon} ${o.name}</div>`;
      if (!owned) c.style.filter = 'grayscale(.85) brightness(.7)';
      else {
        c.tabIndex = 0;
        c.setAttribute('role', 'button');
        c.setAttribute('aria-label', `View ${HEROES[id].name}`);
        c.onclick = () => HeroPage.open(id);
        c.onkeydown = e => {
          if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); HeroPage.open(id); }
        };
      }
      fragment.appendChild(c);
    });
    g.appendChild(fragment);
    return g;
  },

  doOpen(kind, n) {
    if (!['gold', 'diamond', 'main'].includes(kind) || !Number.isFinite(Number(n))) return;
    const res = Gacha.open(kind, n);
    if (!res) return;
    const opened = res.length;
    Sound.play(opened > 1 ? 'crate_reveal' : 'gacha', { vol: opened > 1 ? .46 : .7, priority: true });
    const label = kind === 'main' ? 'Main Character Crate' : kind === 'diamond' ? 'Diamond Crate' : 'Gold Crate';
    UI.showPulls(res, Gacha.icon(kind) + ' ' + opened + ' ' + label + (opened > 1 ? 's' : ''));
  }

});
