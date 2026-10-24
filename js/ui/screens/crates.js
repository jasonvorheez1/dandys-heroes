/* A small crate bench with quick, inline reveals. */
'use strict';

const CRATE_CHOICES = {
  gold: { name: 'Gold Crate', short: 'Gold', mark: '01' },
  diamond: { name: 'Diamond Crate', short: 'Diamond', mark: '02' },
  main: { name: 'Main Character Crate', short: 'Main', mark: '03' }
};

Object.assign(Screens, {
  crates(s) {
    s.classList.add('crates-screen');
    const kinds = Object.keys(CRATE_CHOICES);
    const kind = kinds.includes(this._crateKind) ? this._crateKind : (kinds.find(k => Save.res(k) > 0) || 'gold');
    this._crateKind = kind;
    const info = CRATE_CHOICES[kind], held = Save.res(kind);

    const switcher = el('div', 'crate-switch');
    switcher.setAttribute('role', 'group');
    switcher.setAttribute('aria-label', 'Choose a crate');
    kinds.forEach(k => {
      const choice = CRATE_CHOICES[k];
      const button = el('button', 'crate-choice' + (k === kind ? ' active' : ''));
      button.type = 'button';
      button.dataset.kind = k;
      button.setAttribute('aria-pressed', String(k === kind));
      button.setAttribute('aria-label', `${choice.name}, ${Save.res(k)} held`);
      button.innerHTML = `<span class="crate-choice-mark" aria-hidden="true">${choice.mark}</span><span class="crate-choice-name">${choice.short}</span><b class="crate-choice-count">${fmt(Save.res(k))}</b>`;
      button.onclick = () => {
        if (this._crateOpening || this._crateKind === k) return;
        this._crateKind = k;
        this._crateLastPull = null;
        Sound.play('ui_move');
        this.render();
      };
      switcher.appendChild(button);
    });
    s.appendChild(switcher);

    const stage = el('section', 'crate-stage');
    stage.dataset.kind = kind;
    const level = Gacha.crateLevel();
    stage.innerHTML = `<div class="crate-stage-top"><div><span class="crate-eyebrow">DYLE'S DEPOT</span><h2>${info.name}</h2></div><div class="crate-level" title="${Gacha.nextLevelAt()} points to the next crate level">LV ${level}<i style="--progress:${(1 - Gacha.nextLevelAt() / 40) * 100}%"></i></div></div>`;

    const scene = el('div', 'crate-scene');
    scene.innerHTML = `<div class="crate-dyle" aria-hidden="true"><img src="Characters/Dyle/Dyle.png" alt=""></div>`;
    const object = el('button', 'crate-object');
    object.type = 'button';
    object.disabled = held < 1;
    object.setAttribute('aria-label', `Open one ${info.name}`);
    object.innerHTML = `<span class="crate-shadow" aria-hidden="true"></span><span class="crate-lid" aria-hidden="true"><i></i><em></em></span><span class="crate-body" aria-hidden="true"><i class="crate-band"></i><i class="crate-inlay"></i><i class="crate-rivet rivet-a"></i><i class="crate-rivet rivet-b"></i><i class="crate-rivet rivet-c"></i><i class="crate-rivet rivet-d"></i><b><span>${info.short.toUpperCase()}</span><small>NO. ${info.mark}</small></b></span><span class="crate-catch" aria-hidden="true"><i></i></span><span class="crate-tag" aria-hidden="true">${info.mark}</span>`;
    object.onclick = () => this.doOpen(kind, 1);
    scene.appendChild(object);
    stage.appendChild(scene);
    const odds = Gacha.odds(kind);
    const heroChance = Math.round((odds.hero + odds.shards) * 100);
    stage.appendChild(el('div', 'crate-stage-meta', `<span>${heroChance}% Hero research</span><span>${fmt(held)} held</span>`));

    const actions = el('div', 'crate-actions');
    actions.dataset.count = held > 10 ? '3' : held > 1 ? '2' : '1';
    const one = el('button', 'crate-open-one', 'Open 1');
    one.type = 'button'; one.disabled = held < 1;
    one.onclick = () => this.doOpen(kind, 1);
    actions.appendChild(one);
    if (held > 1) {
      const ten = el('button', 'crate-open-many', `Open ${Math.min(10, held)}`);
      ten.type = 'button';
      ten.onclick = () => this.doOpen(kind, Math.min(10, Save.res(kind)));
      actions.appendChild(ten);
    }
    if (held > 10) {
      const all = el('button', 'crate-open-all-new', `Open all · ${fmt(held)}`);
      all.type = 'button';
      all.onclick = () => this.doOpen(kind, Save.res(kind));
      actions.appendChild(all);
    }
    const cost = Gacha.buyCost(kind, 1).ichor;
    const buy = el('button', 'crate-buy', `Buy 1 · ${RES.ichor.icon}${fmt(cost)}`);
    buy.type = 'button';
    buy.setAttribute('aria-label', `Buy one ${info.name} for ${fmt(cost)} Ichor`);
    buy.onclick = () => {
      if (this._crateOpening) return;
      if (!Save.spend(Gacha.buyCost(kind, 1))) { UI.toast('Not enough Ichor'); Sound.play('ui_err'); return; }
      Save.give({ [kind]: 1 });
      Sound.play('gacha', { vol: .4 });
      this.render();
    };
    actions.appendChild(buy);
    stage.appendChild(actions);
    s.appendChild(stage);

    if (this._crateLastPull && this._crateLastPull.kind === kind) s.appendChild(this.crateResults(this._crateLastPull));

    const pool = el('details', 'crate-pool');
    const ids = cratePool(kind);
    pool.innerHTML = `<summary>Possible Heroes <span>${ids.length}</span></summary>`;
    pool.addEventListener('toggle', () => {
      if (pool.open && !pool.querySelector('.crate-pool-grid')) pool.appendChild(this.poolGrid(ids));
    });
    s.appendChild(pool);
  },

  crateResults(pull) {
    const tray = el('section', 'crate-results');
    tray.setAttribute('aria-live', 'polite');
    tray.innerHTML = `<div class="crate-results-head"><div><span class="crate-eyebrow">JUST OPENED</span><h3>${pull.count} ${pull.count === 1 ? 'crate' : 'crates'}</h3></div>${pull.newCount ? `<strong>${pull.newCount} NEW ${pull.newCount === 1 ? 'HERO' : 'HEROES'}</strong>` : ''}</div>`;
    const items = el('div', 'crate-find-grid');
    const sorted = pull.entries.slice().sort((a, b) => Number(b.isNew) - Number(a.isNew) || Number(b.type === 'hero') - Number(a.type === 'hero'));
    const makeCard = (entry, i) => {
      const card = el('div', 'crate-find' + (entry.isNew ? ' crate-find-new' : ''));
      card.style.setProperty('--delay', Math.min(i * 45, 360) + 'ms');
      if (entry.type === 'hero') {
        const hero = HEROES[entry.id];
        card.style.setProperty('--find-color', obtainOf(entry.id).color);
        card.innerHTML = `<div class="crate-find-art"><img src="${Art.icon(entry.id)}" alt="" loading="eager" decoding="async"></div><div class="crate-find-copy"><b>${hero.name}</b><span>+${fmt(entry.n)} shards${entry.count > 1 ? ` · ${entry.count} finds` : ''}</span></div>${entry.isNew ? '<em>NEW</em>' : ''}`;
      } else {
        const res = RES[entry.k];
        card.innerHTML = `<div class="crate-find-resource" aria-hidden="true">${res.icon}</div><div class="crate-find-copy"><b>${res.name}</b><span>+${fmt(entry.n)}</span></div>`;
      }
      return card;
    };
    sorted.slice(0, 6).forEach((entry, i) => items.appendChild(makeCard(entry, i)));
    tray.appendChild(items);
    if (sorted.length > 6) {
      const more = el('details', 'crate-more');
      more.innerHTML = `<summary>${sorted.length - 6} more ${sorted.length - 6 === 1 ? 'find' : 'finds'}</summary>`;
      const rest = el('div', 'crate-find-grid');
      sorted.slice(6).forEach((entry, i) => rest.appendChild(makeCard(entry, i + 6)));
      more.appendChild(rest);
      tray.appendChild(more);
    }
    const cache = el('details', 'crate-cache');
    cache.innerHTML = '<summary>Supply cache <span>included with every crate</span></summary>';
    const supplies = el('div', 'crate-supplies');
    Object.entries(pull.cache).filter(([, n]) => n > 0).forEach(([key, n]) => {
      if (RES[key]) supplies.appendChild(el('span', '', `${RES[key].icon} ${RES[key].name} <b>+${fmt(n)}</b>`));
    });
    cache.appendChild(supplies);
    tray.appendChild(cache);
    return tray;
  },

  summarizeCratePulls(kind, results) {
    const entries = new Map(), cache = {};
    let newCount = 0;
    results.forEach(result => {
      const isHero = result.type === 'hero' || result.type === 'shards';
      const key = isHero ? `hero:${result.id}` : `res:${result.k}`;
      if (!entries.has(key)) entries.set(key, isHero
        ? { type: 'hero', id: result.id, n: 0, count: 0, isNew: false }
        : { type: 'res', k: result.k, n: 0, count: 0, isNew: false });
      const item = entries.get(key);
      item.n += result.n;
      item.count++;
      if (result.isNew) { item.isNew = true; newCount++; }
      Object.entries(result.bonus || {}).forEach(([resource, amount]) => { cache[resource] = (cache[resource] || 0) + amount; });
    });
    return { kind, count: results.length, newCount, entries: [...entries.values()], cache };
  },

  poolGrid(ids) {
    const grid = el('div', 'crate-pool-grid');
    const fragment = document.createDocumentFragment();
    ids.slice().sort((a, b) => obtainOf(a).rank - obtainOf(b).rank).forEach(id => {
      const o = obtainOf(id), owned = Save.owns(id);
      const card = el('div', 'crate-pool-hero');
      card.style.setProperty('--pool-color', o.color);
      card.innerHTML = `<img src="${Art.icon(id)}" loading="lazy" decoding="async" alt="${owned ? HEROES[id].name : 'Unknown Hero'}" style="${owned ? '' : 'filter:brightness(0)'}"><b>${owned ? HEROES[id].name : '???'}</b><small>${o.name}</small>`;
      if (owned) {
        card.tabIndex = 0;
        card.setAttribute('role', 'button');
        card.setAttribute('aria-label', `View ${HEROES[id].name}`);
        card.onclick = () => HeroPage.open(id);
        card.onkeydown = e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); HeroPage.open(id); } };
      }
      fragment.appendChild(card);
    });
    grid.appendChild(fragment);
    return grid;
  },

  doOpen(kind, n) {
    if (this._crateOpening || !CRATE_CHOICES[kind] || !Number.isFinite(Number(n))) return;
    const results = Gacha.open(kind, n);
    if (!results) return;
    this._crateOpening = true;
    this._crateKind = kind;
    this._crateLastPull = this.summarizeCratePulls(kind, results);
    this.render();
    const screen = $('#screen'), tray = $('.crate-results', screen);
    screen.classList.add('crate-opening');
    if (tray) {
      tray.classList.add('crate-results-pending');
      tray.setAttribute('aria-hidden', 'true');
    }
    const playReveal = () => Sound.play(results.length > 1 ? 'crate_reveal' : 'gacha', { vol: results.length > 1 ? .42 : .6, priority: true });
    if (Accessibility.enabled()) playReveal();
    else setTimeout(() => { if (screen.isConnected && this.cur === 'crates' && this._crateOpening) playReveal(); }, 430);
    const finish = () => {
      this._crateOpening = false;
      if (screen.isConnected) {
        screen.classList.remove('crate-opening');
        if (this.cur === 'crates' && tray?.isConnected) {
          screen.classList.add('crate-opened');
          tray.classList.remove('crate-results-pending');
          tray.removeAttribute('aria-hidden');
          const next = $('.crate-open-one', screen);
          if (next && !next.disabled) next.focus({ preventScroll: true });
        }
      }
    };
    if (Accessibility.enabled()) finish();
    else setTimeout(finish, 900);
  }
});
