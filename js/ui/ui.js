/* ui.js - shared widgets: toasts, modals, resource bar, hero tiles, team picker. */
'use strict';

const UI = {
  screen: 'home',
  _modalCloseHook: null,
  heroUnlockQueue: [],
  heroUnlockActive: false,
  heroUnlockTimer: 0,

  /* First-time recruits arrive through several reward systems. Queue the
     presentation here so bulk rewards still play one readable reveal at a
     time instead of racing each other or interrupting their parent screen. */
  queueHeroUnlock(id) {
    if (!id || !HEROES[id] || this.heroUnlockQueue.includes(id)) return;
    this.heroUnlockQueue.push(id);
    if (!this.heroUnlockTimer) {
      this.heroUnlockTimer = setTimeout(() => {
        this.heroUnlockTimer = 0;
        this.showNextHeroUnlock();
      }, 0);
    }
  },

  showNextHeroUnlock() {
    if (this.heroUnlockActive) return;
    const id = this.heroUnlockQueue.shift();
    if (!id) return;
    const hero = HEROES[id], obtain = obtainOf(id);
    const wrap = el('div', 'hero-unlock');
    wrap.style.setProperty('--hero-color', obtain.color || '#ffe36d');
    wrap.innerHTML = `<div class="hero-unlock-rays" aria-hidden="true"></div>
      <div class="hero-unlock-sparkles" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i></div>
      <article role="dialog" aria-label="New hero ${hero.name}">
        <div class="hero-unlock-kicker">NEW HERO RECRUITED</div>
        <div class="hero-unlock-art"><span class="hero-unlock-ring"></span><span class="hero-unlock-ring ring-two"></span>
          <img src="${Art.hero(id)}" alt="${hero.name}"><b>${obtain.icon}</b></div>
          <div class="hero-unlock-copy"><small>${obtain.name.toUpperCase()} · ${heroRole(hero.role)}</small>
          <h1>${hero.name}</h1><p>${hero.blurb || 'A new Toon is ready for the roster.'}</p></div>
        <button class="hero-unlock-dismiss" type="button">WELCOME ${hero.name.toUpperCase()}</button>
      </article>`;
    document.body.appendChild(wrap);
    this.heroUnlockActive = true;

    const dismiss = () => {
      if (!wrap.isConnected || wrap.classList.contains('leaving')) return;
      wrap.classList.add('leaving');
      setTimeout(() => {
        wrap.remove();
        this.heroUnlockActive = false;
        this.showNextHeroUnlock();
      }, 300);
    };
    $('.hero-unlock-dismiss', wrap).onclick = dismiss;
    wrap.onclick = e => { if (e.target === wrap) dismiss(); };
    requestAnimationFrame(() => {
      wrap.classList.add('play');
      $('.hero-unlock-dismiss', wrap).focus();
    });
    Sound.play('get_rare');
    if (typeof FX !== 'undefined') FX.confetti(window.innerWidth / 2, window.innerHeight * .38, 54);
  },

  /* ---------- chrome ---------- */
  refreshBar(bump) {
    const r = Save.data.res;
    const set = (sel, v) => {
      const n = $(sel); if (!n) return;
      if (n.textContent !== fmt(v)) {
        n.textContent = fmt(v);
        if (bump) { const p = n.parentElement; p.classList.remove('bump'); void p.offsetWidth; p.classList.add('bump'); }
      }
    };
    set('#resIchor', r.ichor); set('#resTape', r.tape); set('#resNotes', r.notes); set('#resStar', r.star); set('#resTicket', r.ticket); set('#resRaidTicket', r.raidTicket); set('#resCounterToken', r.counterToken);
    const mastery = $('#tbAcctLvl');
    if (mastery && mastery.textContent !== String(Save.data.mastery)) mastery.textContent = Save.data.mastery;
  },

  toast(msg, opts) {
    opts = opts || {};
    const box = $('#toasts');
    const t = el('div', 'toast' + (opts.className ? ' ' + opts.className : ''), msg);
    box.appendChild(t);
    setTimeout(() => t.remove(), 2000);
  },

  /* Modals may hide their close button when the room must be resolved by a
     choice. Backdrop taps and Escape still use the room's safe close hook. */
  modal(title, bodyNode, opts) {
    opts = opts || {};
    const m = $('#modal'), b = clear($('#modalBox'));
    this._modalCloseHook = opts.onClose || null;
    b.className = opts.className || '';
    m.dataset.heroModal = opts.className === 'hero-profile-box' ? '1' : '';
    m.dataset.heroClosing = '';
    m.hidden = false;
    if (!opts.bare) {
      const h = el('div', 'row');
      h.style.marginBottom = '10px';
      h.innerHTML = `<div class="grow b" style="font-size:16px">${title || ''}</div>`;
      if (opts.closeButton !== false) {
        const x = el('button', 'btn', '✕');
        x.style.padding = '4px 10px';
        x.onclick = () => this.closeModal();
        h.appendChild(x);
      }
      b.appendChild(h);
    }
    b.appendChild(bodyNode);
    Sound.play('ui_open');
    // Backdrop clicks must not dismiss stateful screens by accident. Endless
    // rooms and events attach close hooks that intentionally handle an
    // explicit close, so letting an outside click trigger them can strand the
    // app on a blank/grey screen. Opt in per modal when backdrop dismissal is
    // genuinely safe.
    const dismissOnBackdrop = opts.dismissOnBackdrop === true;
    m.onclick = e => {
      if (e.target === m && dismissOnBackdrop) this.closeModal();
    };
    return b;
  },
  closeModal(opts) {
    opts = opts || {};
    const m = $('#modal');
    if (!m || m.hidden) return;
    const heroBox = $('#modalBox.hero-profile-box');
    if (heroBox && !opts.instant && !m.dataset.heroClosing) {
      m.dataset.heroClosing = '1';
      heroBox.classList.add('hero-profile-leaving');
      Sound.play('hero_file_close');
      setTimeout(() => this.closeModal(Object.assign({}, opts, { instant: true })), 300);
      return;
    }
    const hook = opts.skipHook ? null : this._modalCloseHook;
    this._modalCloseHook = null;
    const wasHero = m.dataset.heroModal === '1';
    m.hidden = true; const b = clear($('#modalBox')); b.className = ''; m.dataset.heroModal = ''; m.dataset.heroClosing = '';
    if (!wasHero) Sound.play('ui_close');
    if (hook) hook();
  },

  confirm(title, text, onYes) {
    const body = el('div');
    body.appendChild(el('div', 'muted tiny', text));
    const row = el('div', 'row'); row.style.marginTop = '12px';
    const no = el('button', 'btn grow', 'Cancel');
    const yes = el('button', 'btn pri grow', 'Confirm');
    let resolved = false;
    no.onclick = () => { if (resolved) return; resolved = true; this.closeModal(); };
    yes.onclick = () => { if (resolved) return; resolved = true; this.closeModal(); onYes(); };
    row.appendChild(no); row.appendChild(yes);
    body.appendChild(row);
    this.modal(title, body);
  },

  /* ---------- hero tile ---------- */
  heroTile(id, opt) {
    opt = opt || {};
    const owned = Save.owns(id);
    const h = owned ? Save.hero(id) : null;
    const o = obtainOf(id);
    const rarityClass = h ? ` rarity-border-${h.rarity}${h.rarity >= 6 ? ' rarity-rainbow' : ''}` : '';
    const rosterClass = opt.roster ? ' roster-tile' : '';
    const n = el('div', 'htile role-' + HEROES[id].role + rosterClass + (owned ? '' : ' locked') + rarityClass);
    n.style.borderColor = o.color;
    const stars = h ? '★'.repeat(h.stars) : '';
    const bank = !owned ? Save.pending(id) : 0;
    const art = opt.useIcon ? Art.icon(id) : Art.hero(id);
    const rosterPower = opt.roster && h ? `<span class="roster-power">⚡ ${fmt(Progress.power(id))}</span>` : '';
    const rosterGear = opt.roster && h ? `<div class="roster-gear" aria-label="Equipped Trinkets">
      ${[0, 1].map(slot => {
        const uid = (h.trinkets || [])[slot];
        const copy = uid && Save.data.trinketInv && Save.data.trinketInv[uid];
        const trinket = copy && TRINKETS[copy.id];
        return trinket
          ? `<span class="roster-gear-slot filled" title="${trinket.name} · Rank ${copy.rank || 1}"><img src="${trinketIcon(copy.id)}" alt="${trinket.name}"><i>R${copy.rank || 1}</i></span>`
          : '<span class="roster-gear-slot">+</span>';
      }).join('')}</div>` : '';
    n.innerHTML =
      `<div class="por"><img src="${art}" loading="lazy" alt="">${!owned ? '<div class="lock-q">???</div>' : ''}</div>
       <div class="obt" title="${o.name}">${o.icon}</div>
       ${h ? `<div class="lv">${h.level}</div>` : ''}
       ${h ? `<div class="rar-label">${rarityLabel(h.rarity, h.rarityPlus)}</div>` : ''}
       ${h && h.shards ? `<div class="shd">◈${h.shards}</div>` : ''}
       ${!owned ? `<div class="shd">◈${bank}/${o.unlock}</div>` : ''}
       <div class="stars">${stars}</div>
       <div class="nm">${owned ? HEROES[id].name : '???'}</div>
       ${opt.roster ? `<div class="roster-card-info"><div class="roster-card-head"><b>${owned ? HEROES[id].name : '???'}</b>${rosterPower}</div><small>${owned ? `${heroRole(HEROES[id].role)} · LEVEL ${h.level}` : 'LOCKED HERO'}</small>${rosterGear}</div>` : ''}`;
    if (opt.onClick) n.onclick = () => { Sound.play('hero_roster_select', { vol: .46, throttle: 0 }); opt.onClick(id); };
    if (opt.dim) n.style.opacity = .4;
    return n;
  },

  /** Where an unowned Hero stands: rarity, shard bank, and where to find them. */
  unlockInfo(id) {
    const o = obtainOf(id);
    const have = Save.pending(id), need = o.unlock;
    const body = el('div');
    const head = el('div', 'row');
    head.innerHTML = `<div style="width:84px;height:96px;display:grid;place-items:center;
      background:linear-gradient(180deg,#59626e,#31363d);border-radius:16px;border:3px solid var(--edge)">
      <img src="${Art.hero(id)}" style="max-width:92%;max-height:92%;object-fit:contain;filter:grayscale(.7) brightness(.8)"></div>
      <div class="grow"><div class="b" style="font-size:17px">${HEROES[id].name}</div>
      <div class="tiny b" style="color:${o.color}">${o.icon} ${o.name}</div>
      <div class="mini muted">${heroRole(HEROES[id].role)}</div></div>`;
    body.appendChild(head);
    body.appendChild(el('div', 'spacer'));

    const directVisitor = id === 'Phantasia';
    const prog = el('div', 'card');
    prog.innerHTML = directVisitor
      ? `<div class="row tiny"><div class="grow b">Recruitment</div><div class="b" style="color:${o.color}">SHOP VISITOR</div></div>`
      : `<div class="row tiny"><div class="grow b">Shards collected</div><div class="b" style="color:${o.color}">${have} / ${need}</div></div>`;
    const bar = this.bar(directVisitor ? 0 : have / need, 'linear-gradient(180deg,#fff6,' + o.color + ')');
    bar.style.marginTop = '5px';
    prog.appendChild(bar);
    prog.appendChild(el('div', 'mini muted', directVisitor
      ? 'Her first shop purchase recruits the complete Hero. Later appearances sell regular promotion shards.'
      : 'Reaching ' + need + ' shards recruits them outright. Extra shards carry over into promotions.'));
    body.appendChild(prog);

    const where = el('div', 'card');
    const crates = o.crates.map(c => c === 'gold' ? '📦 Gold Crates' : c === 'main' ? '🌟 Main Character Crates' : '💎 Diamond Crates').join(' and ');
    let txt = id === 'Phantasia'
      ? 'Occasionally visits Dandy’s regular shop. She is a collaboration visitor, but is not part of the Kingdom Hearts event and has no Twisted form.'
      : CARE_BEAR_HERO_IDS.has(id)
      ? 'Available through the 🌈 Care Bears Collection packs in Dandy’s regular shop.'
      : COLLAB_HERO_IDS.has(id)
      ? `Available only through the ${(eventOf(id) || COLLAB_EVENT).icon} ${(eventOf(id) || COLLAB_EVENT).name} Event Shop. Collab visitors do not have Twisted forms.`
      : BIG_WIG_HERO_IDS.has(id)
      ? 'Unlocked at 4★ through the ⚙ Toontown Cogs Pack after clearing Big Wig.'
      : id === 'Dandy'
        ? 'Found in Main Character Crates and special Dandy encounters.'
      : id === 'MrsHolloway' || id === 'MrHolloway'
        ? "Recruited through Draw Gourdy's Parents. They can also appear as rare elite enemies in the Depths."
      : o.rank === OBTAIN.Lethal.rank
        ? 'Earn shards from the dedicated Lethal boss encounters.'
        : `Found in ${crates}.`;
    where.innerHTML = `<div class="tiny">${txt}</div>`;
    body.appendChild(where);

    const ok = el('button', 'btn wide', 'Got it');
    ok.onclick = () => this.closeModal();
    body.appendChild(ok);
    this.modal('Not Recruited', body);
  },

  roleTag(role, label) {
    const cols = { Tank: '#5aa9ff', Damage: '#ff6b6b', Support: '#7bd66a', Control: '#c17bff' };
    const ics = { Tank: '🛡', Damage: '⚔', Support: '💚', Control: '🌀' };
    const canonical = heroRole(role);
    const p = el('span', 'pill role-pill role-' + canonical, ics[canonical] + ' ' + canonical);
    p.style.color = cols[canonical]; p.style.borderColor = cols[canonical] + '55';
    return p;
  },

  /** Small pill for one character tag (see tags.js), e.g. '⚡ Fast'. */
  tagChip(tag) {
    const p = el('span', 'pill', (tag.icon || '') + ' ' + tag.label);
    if (tag.color) { p.style.color = tag.color; p.style.borderColor = tag.color + '55'; }
    return p;
  },

  rarityDots(r) {
    const n = el('div', 'rdots');
    for (let i = 1; i <= 5; i++) n.appendChild(el('i', i <= r ? 'on' + i : ''));
    return n;
  },

  bar(pct, col) {
    const n = el('div', 'bar');
    n.innerHTML = `<i style="width:${clamp(pct, 0, 1) * 100}%;background:${col || 'var(--gold)'}"></i>`;
    return n;
  },

  /* ---------- team picker ---------- */
  /** The same range buckets used by Battle's spawn formation. */
  formationLine(id) {
    const range = HEROES[id] && HEROES[id].hidden ? HEROES[id].hidden.range : 250;
    return range <= 210
      ? { key: 'front', label: 'Front', icon: '◆' }
      : range <= 260
        ? { key: 'middle', label: 'Middle', icon: '●' }
        : { key: 'back', label: 'Back', icon: '▲' };
  },

  teamPicker(opts) {
    opts = opts || {};
    const filter = opts.filter || (() => true);
    const maxSize = Math.max(1, Math.min(5, Math.floor(Number(opts.maxSize) || 5)));
    // Required entries are still subject to the picker limit. The old code
    // could render a required roster larger than maxSize, then silently drop
    // one of those heroes when the next selection was made.
    const required = [...new Set((opts.required || []).filter(id => HEROES[id] && filter(id) && Save.owns(id)))].slice(0, maxSize);
    const seed = (opts.team || Save.data.team).filter((id, i, a) => id && Save.owns(id) && filter(id) && a.indexOf(id) === i);
    required.forEach(id => { if (!seed.includes(id)) seed.unshift(id); });
    const cur = seed.slice(0, maxSize);
    while (cur.length < maxSize) cur.push(null);
    const original = cur.slice();
    const wrap = el('div', 'team-builder');
    const stage = el('section', 'team-stage');
    stage.innerHTML = `<div class="team-stage-shade"></div>
      <div class="team-line team-line-back"><b>BACK</b><span>Ranged</span></div>
      <div class="team-line team-line-middle"><b>MIDDLE</b><span>Flexible</span></div>
      <div class="team-line team-line-front"><b>FRONT</b><span>Close range</span></div>
      <div class="team-stage-empty"><b>Your formation is empty</b><span>Choose a Hero below</span></div>
      <div class="team-stage-units"></div>`;
    const units = $('.team-stage-units', stage);
    const empty = $('.team-stage-empty', stage);

    const summary = el('div', 'team-summary');
    const count = el('div', 'team-count');
    const power = el('div', 'team-power');
    const balance = el('div', 'team-balance');
    summary.appendChild(count); summary.appendChild(power); summary.appendChild(balance);

    /* Build kit tags from the authored skill definitions themselves. Status
       tags come from STATUS, not a hand-maintained list, while skill types are
       read directly from each skill's `type` field. This makes a new status or
       skill type appear in the picker automatically. */
    const normalizeKitText = value => String(value || '').toLowerCase().replace(/[^a-z0-9]+/g, '');
    const skillText = id => {
      const hero = HEROES[id];
      return Object.values((hero && hero.skills) || {}).map(skill => [
        skill.name || '', skill.type || '',
        typeof skill.desc === 'function' ? skill.desc.toString() : skill.desc || '',
        typeof skill.cast === 'function' ? skill.cast.toString() : '',
        typeof skill.passive === 'function' ? skill.passive.toString() : ''
      ].join(' ')).join(' ');
    };
    const kitMetaByKey = {};
    const skillTagCache = new Map();
    const addKitMeta = meta => { if (!kitMetaByKey[meta.key]) kitMetaByKey[meta.key] = meta; };
    const statusEntries = typeof STATUS === 'undefined' ? [] : Object.entries(STATUS);
    const skillTags = id => {
      const hero = HEROES[id]; if (!hero) return [];
      const skills = Object.values(hero.skills || {});
      const raw = skillText(id), text = raw.toLowerCase(), normalized = normalizeKitText(raw);
      const keys = [];
      const add = (key, label, short, icon, color, group) => {
        addKitMeta({ key, label, short, icon, color, group });
        if (!keys.includes(key)) keys.push(key);
      };
      /* Combat signals are deliberately separate from raw status names. A
         player usually wants to find "Damage Up" or "Damage Down", not hunt
         through every authored status and skill label. These are inferred
         from the real skill descriptions/functions, so new Heroes inherit
         the filters without another roster-maintenance list. */
      const combatSignals = [
        ['signal:damage-up', 'Damage Up', 'DMG UP', '↗', '#ffad88', /\b(?:damage|attack|power|crit(?:ical)? damage)\s*(?:up|boost|bonus|increase|increased|rises?|raised|gain|more)\b|\b(?:deal|deals|dealing|does|do)\s+(?:\w+\s+){0,5}(?:more|bonus|increased)\s+damage\b|\bbonus damage\b|\bdamage dealt\b[^.!?]{0,35}\b(?:up|increased|more)\b/i],
        ['signal:damage-down', 'Damage Down', 'DMG DOWN', '↘', '#9edfff', /\b(?:damage|attack|power)\s*(?:down|reduction|reduced|decrease|decreased|falls?|lower|less)\b|\b(?:deal|deals|dealing)\s+(?:\w+\s+){0,5}(?:less|reduced)\s+damage\b|\bdamage reduction\b|\bdamage dealt\b[^.!?]{0,35}\b(?:down|reduced|less)\b/i],
        ['signal:damage-taken-up', 'Damage Taken Up', 'TAKEN UP', '↑', '#ff8f9b', /\b(?:damage taken|take|takes|receives?|suffers?)\s+(?:\w+\s+){0,4}(?:more|increased|extra)\b|\b(?:more|increased|extra) damage\s+(?:from|to)\b|\b(?:exposed|vulnerable)\b/i],
        ['signal:damage-taken-down', 'Damage Taken Down', 'TAKEN DOWN', '↓', '#9be58d', /\b(?:damage taken|take|takes|receives?|suffers?)\s+(?:\w+\s+){0,4}(?:less|reduced)\b|\bdamage reduction\b|\b(?:resistance|fortify)\b/i]
      ];
      combatSignals.forEach(([key, label, short, icon, color, pattern]) => {
        if (pattern.test(text)) add(key, label, short, icon, color, 'Combat signals');
      });
      const typeLabels = new Set();
      skills.forEach(skill => String(skill.type || '').split('/').map(v => v.trim()).filter(Boolean).forEach(type => typeLabels.add(type)));
      typeLabels.forEach(type => {
        const key = 'type:' + normalizeKitText(type);
        add(key, 'Type · ' + type, type, '◆', '#c6d4cf', 'Skill types');
      });
      statusEntries.forEach(([statusId, status]) => {
        const idNeedle = normalizeKitText(statusId), nameNeedle = normalizeKitText(status.name);
        const direct = new RegExp(`(?:applyStatus|hasStatus|getStatus|removeStatus)\\s*\\([^)]*['"]${statusId}['"]`, 'i').test(raw);
        if (!direct && !normalized.includes(idNeedle) && (!nameNeedle || !normalized.includes(nameNeedle))) return;
        const kind = status.kind === 'debuff' ? 'Debuff' : status.kind === 'buff' ? 'Buff' : 'Special';
        add('status:' + statusId, `${kind} · ${status.name}`, status.name, status.icon || '✦', status.kind === 'debuff' ? '#ff9a9a' : status.kind === 'buff' ? '#9be58d' : '#d2c0ff', 'Status effects');
      });
      const mechanics = [
        ['mechanic:healing', 'Healing', '♥', '#8ee28b', /\b(?:heal|healing|regen|restore[^.!?]{0,40}(?:health|hp))\b/i],
        ['mechanic:energy', 'Energy', '⚡', '#ffe17d', /\b(?:energy|energize|energy gain|energy restore)\b/i],
        ['mechanic:cooldown', 'Cooldown / Haste', '⏱', '#ffd166', /\b(?:cooldown|skill haste|refresh|cdr)\b/i],
        ['mechanic:control', 'Control', '◈', '#d2a0ff', /\b(?:control|knockback|interrupt|crowd control)\b/i],
        ['mechanic:cleanse', 'Cleanse / Dispel', '✧', '#b9f0ff', /\b(?:cleanse|dispel|remove a debuff|lose one debuff)\b/i],
        ['mechanic:summon', 'Summon', '♟', '#e4b5ff', /\b(?:summon|calls? in|creates? a copy|spawn)\b/i],
        ['mechanic:revive', 'Revival', '↻', '#fff0a0', /\b(?:revive|revival|resurrect|survives? one lethal)\b/i],
        ['mechanic:shield', 'Shield', '🛡', '#9edfff', /\b(?:shield|barrier|ward)\b/i],
      ];
      mechanics.forEach(([key, label, icon, color, pattern]) => { if (pattern.test(text)) add(key, label, label.toUpperCase(), icon, color, 'Mechanics'); });
      const priority = { 'Combat signals': 0, 'Status effects': 1, Mechanics: 2, 'Skill types': 3 };
      const groupPriority = key => priority[kitMetaByKey[key] && kitMetaByKey[key].group] ?? 9;
      return keys.sort((a, b) => groupPriority(a) - groupPriority(b));
    };
    const cachedSkillTags = id => {
      if (!skillTagCache.has(id)) skillTagCache.set(id, skillTags(id));
      return skillTagCache.get(id);
    };

    const initialKitIds = [...new Set(Save.ownedIds().filter(id => filter(id)).concat(required))];
    initialKitIds.forEach(cachedSkillTags);
    const skillMeta = Object.values(kitMetaByKey).sort((a, b) => a.group.localeCompare(b.group) || a.label.localeCompare(b.label));
    const skillMetaByKey = Object.fromEntries(skillMeta.map(tag => [tag.key, tag]));

    const toolbar = el('div', 'team-toolbar');
    const searchLine = el('div', 'team-search-line');
    const search = el('input', 'team-search');
    search.type = 'search'; search.placeholder = 'Name or kit'; search.setAttribute('aria-label', 'Search Heroes by name or kit');
    const clearSearch = el('button', 'team-search-clear', '×');
    clearSearch.type = 'button'; clearSearch.setAttribute('aria-label', 'Clear search'); clearSearch.hidden = true;

    let role = 'All', scope = 'All', lineFilter = 'All', skillFilter = 'All', sortBy = 'power';
    const filterToggle = el('button', 'team-filter-toggle');
    filterToggle.type = 'button'; filterToggle.setAttribute('aria-expanded', 'false');
    const filterToggleTitle = el('b', '', 'FILTERS');
    const filterToggleState = el('small', '', 'ALL HEROES · POWER');
    const filterToggleArrow = el('strong', '', '⌄');
    filterToggle.appendChild(filterToggleTitle); filterToggle.appendChild(filterToggleState); filterToggle.appendChild(filterToggleArrow);
    const searchBox = el('div', 'team-search-box');
    searchBox.appendChild(search); searchBox.appendChild(clearSearch);
    searchLine.appendChild(searchBox); searchLine.appendChild(filterToggle);
    const filterPanel = el('div', 'team-filter-panel'); filterPanel.hidden = true;

    const rolebar = el('div', 'team-filterbar');
    rolebar.setAttribute('aria-label', 'Filter by role');
    rolebar.appendChild(el('span', 'team-filter-label', 'ROLE'));
    const skillbar = el('div', 'team-kit-filter');
    skillbar.appendChild(el('span', 'team-filter-label', 'KIT'));
    const roleButtons = [];
    const updateFilterSummary = () => {
      const active = [];
      if (role !== 'All') active.push(role);
      if (scope !== 'All') active.push(scope === 'Team' ? 'On team' : 'Bench');
      if (lineFilter !== 'All') active.push(lineFilter);
      if (skillFilter !== 'All') {
        const tag = skillMetaByKey[skillFilter];
        active.push(tag ? tag.short : 'Kit');
      }
      if (sortBy !== 'power') {
        const tag = sortBy.startsWith('skill:') ? skillMetaByKey[sortBy.slice(6)] : null;
        active.push(tag ? 'Sort · ' + tag.short : ({ level: 'Level', name: 'A–Z', team: 'Team' }[sortBy] || 'Sort'));
      }
      filterToggleState.textContent = active.length ? active.join(' · ').toUpperCase() : 'ALL HEROES · POWER';
      filterToggle.classList.toggle('active', active.length > 0);
    };
    filterToggle.onclick = () => {
      filterPanel.hidden = !filterPanel.hidden;
      filterToggle.setAttribute('aria-expanded', String(!filterPanel.hidden));
      filterToggleArrow.textContent = filterPanel.hidden ? '⌄' : '⌃';
    };
    ['All', 'Tank', 'Damage', 'Support', 'Control'].forEach(name => {
      const b = el('button', 'team-filter' + (name === role ? ' selected' : ''), name);
      b.type = 'button'; b.onclick = () => {
        role = name;
        roleButtons.forEach(x => x.classList.toggle('selected', x === b));
        updateFilterSummary();
        drawRoster();
      };
      roleButtons.push(b); rolebar.appendChild(b);
    });
    const scopebar = el('div', 'team-filterbar team-scopebar');
    scopebar.appendChild(el('span', 'team-filter-label', 'ROSTER'));
    const scopeButtons = [];
    ['All', 'Team', 'Bench'].forEach(name => {
      const b = el('button', 'team-filter' + (name === scope ? ' selected' : ''), name === 'All' ? 'All' : name === 'Team' ? 'On team' : 'Bench');
      b.type = 'button'; b.onclick = () => {
        scope = name;
        scopeButtons.forEach(x => x.classList.toggle('selected', x === b));
        updateFilterSummary(); drawRoster();
      };
      scopeButtons.push(b); scopebar.appendChild(b);
    });
    const linebar = el('div', 'team-filterbar team-linebar');
    linebar.appendChild(el('span', 'team-filter-label', 'POSITION'));
    const lineButtons = [];
    ['All', 'Front', 'Middle', 'Back'].forEach(name => {
      const b = el('button', 'team-filter' + (name === lineFilter ? ' selected' : ''), name === 'All' ? 'Any' : name);
      b.type = 'button'; b.onclick = () => {
        lineFilter = name;
        lineButtons.forEach(x => x.classList.toggle('selected', x === b));
        updateFilterSummary(); drawRoster();
      };
      lineButtons.push(b); linebar.appendChild(b);
    });
    const groups = {};
    skillMeta.forEach(tag => (groups[tag.group] ||= []).push(tag));
    const kitTrigger = el('button', 'team-kit-trigger');
    kitTrigger.type = 'button'; kitTrigger.setAttribute('aria-expanded', 'false');
    kitTrigger.setAttribute('aria-label', 'Filter by actual skillset');
    const kitMenu = el('div', 'team-kit-menu'); kitMenu.hidden = true;
    const kitButtons = [];
    const quickButtons = [];
    const updateKitTrigger = () => {
      const tag = skillFilter === 'All' ? null : skillMetaByKey[skillFilter];
      kitTrigger.innerHTML = tag
        ? `<span class="team-kit-trigger-icon">${tag.icon}</span><span><small>SKILL SIGNAL</small><b>${tag.label}</b></span><strong>⌄</strong>`
        : '<span class="team-kit-trigger-icon">✦</span><span><small>SKILL SIGNAL</small><b>Any ability</b></span><strong>⌄</strong>';
      kitButtons.forEach(b => b.classList.toggle('selected', b.dataset.value === skillFilter));
    };
    function syncQuickButtons() {
      quickButtons.forEach(b => b.classList.toggle('selected', b.dataset.value === skillFilter));
    }
    const chooseKit = (value) => {
      skillFilter = value; updateKitTrigger(); kitMenu.hidden = true;
      kitTrigger.setAttribute('aria-expanded', 'false'); syncQuickButtons(); updateFilterSummary(); drawRoster();
    };
    const quickbar = el('div', 'team-quickbar');
    quickbar.setAttribute('aria-label', 'Quick kit filters');
    [['signal:damage-up', '↗ DMG UP'], ['signal:damage-down', '↘ DMG DOWN'], ['signal:damage-taken-up', '↑ TAKEN'], ['signal:damage-taken-down', '↓ TAKEN'], ['mechanic:healing', '♥ HEAL'], ['mechanic:shield', '🛡 SHIELD'], ['mechanic:control', '◈ CONTROL']].forEach(([value, label]) => {
      if (!skillMetaByKey[value]) return;
      const b = el('button', 'team-quick-chip' + (skillFilter === value ? ' selected' : ''), label);
      b.type = 'button'; b.dataset.value = value;
      b.onclick = () => chooseKit(value);
      quickButtons.push(b); quickbar.appendChild(b);
    });
    const addKitButton = (parent, label, value, icon, color, all) => {
      const b = el('button', 'team-kit-chip' + (skillFilter === value ? ' selected' : ''), (icon ? icon + ' ' : '') + label);
      b.type = 'button'; b.dataset.value = value;
      if (color) b.style.setProperty('--chip-color', color);
      b.onclick = () => chooseKit(value);
      kitButtons.push(b);
      parent.appendChild(b);
      return b;
    };
    addKitButton(kitMenu, 'Any ability', 'All', '✦', '#ffe27a', true);
    Object.keys(groups).forEach(group => {
      const groupWrap = el('div', 'team-kit-group');
      groupWrap.appendChild(el('small', '', group.toUpperCase()));
      const chips = el('div', 'team-kit-chips');
      groups[group].forEach(tag => addKitButton(chips, tag.label, tag.key, tag.icon, tag.color));
      groupWrap.appendChild(chips); kitMenu.appendChild(groupWrap);
    });
    kitTrigger.onclick = () => {
      kitMenu.hidden = !kitMenu.hidden;
      kitTrigger.setAttribute('aria-expanded', String(!kitMenu.hidden));
      if (!kitMenu.hidden) {
        sortMenu.hidden = true;
        sortMore.setAttribute('aria-expanded', 'false');
      }
    };
    updateKitTrigger();
    skillbar.appendChild(kitTrigger); skillbar.appendChild(kitMenu);

    const sortRow = el('div', 'team-sort-row');
    const sortLabel = el('span', 'team-filter-label', 'SORT');
    const sortControl = el('div', 'team-sort-control');
    const sortChoices = el('div', 'team-sort-chips');
    const sortMenu = el('div', 'team-sort-menu'); sortMenu.hidden = true;
    const sortButtons = [];
    const sortMore = el('button', 'team-sort-more', '✦ KIT SNIPPETS');
    sortMore.type = 'button'; sortMore.setAttribute('aria-expanded', 'false');
    const setSort = value => {
      sortBy = value; updateSortButtons(); sortMenu.hidden = true;
      sortMore.setAttribute('aria-expanded', 'false'); updateFilterSummary(); drawRoster();
    };
    const addSortButton = (parent, label, value, cls) => {
      const b = el('button', 'team-sort-chip' + (cls ? ' ' + cls : ''), label);
      b.type = 'button'; b.dataset.value = value; b.onclick = () => setSort(value);
      sortButtons.push(b); parent.appendChild(b); return b;
    };
    const updateSortButtons = () => {
      sortButtons.forEach(b => b.classList.toggle('selected', b.dataset.value === sortBy));
      const tag = sortBy.startsWith('skill:') ? skillMetaByKey[sortBy.slice(6)] : null;
      sortMore.textContent = tag ? '✦ ' + tag.short : '✦ KIT SNIPPETS';
      sortMore.classList.toggle('selected', !!tag);
    };
    [['power', 'POWER'], ['level', 'LEVEL'], ['name', 'A–Z'], ['team', 'TEAM']].forEach(([value, label]) => addSortButton(sortChoices, label, value));
    sortMore.dataset.value = 'more'; sortButtons.push(sortMore); sortChoices.appendChild(sortMore);
    Object.keys(groups).forEach(group => {
      const groupWrap = el('div', 'team-sort-group');
      groupWrap.appendChild(el('small', '', group.toUpperCase()));
      const chips = el('div', 'team-sort-chips');
      groups[group].forEach(tag => addSortButton(chips, tag.icon + ' ' + tag.label, 'skill:' + tag.key));
      groupWrap.appendChild(chips); sortMenu.appendChild(groupWrap);
    });
    sortMore.onclick = () => {
      sortMenu.hidden = !sortMenu.hidden;
      sortMore.setAttribute('aria-expanded', String(!sortMenu.hidden));
      if (!sortMenu.hidden) {
        kitMenu.hidden = true;
        kitTrigger.setAttribute('aria-expanded', 'false');
      }
    };
    sortControl.appendChild(sortChoices); sortControl.appendChild(sortMenu);
    updateSortButtons();
    const resetFilters = el('button', 'team-filter-reset', 'Reset');
    resetFilters.type = 'button'; resetFilters.onclick = () => {
      role = 'All'; scope = 'All'; lineFilter = 'All'; skillFilter = 'All'; sortBy = 'power'; search.value = '';
      roleButtons.forEach((b, i) => b.classList.toggle('selected', i === 0));
      scopeButtons.forEach((b, i) => b.classList.toggle('selected', i === 0));
      lineButtons.forEach((b, i) => b.classList.toggle('selected', i === 0));
      updateKitTrigger(); syncQuickButtons(); updateSortButtons(); kitMenu.hidden = true; sortMenu.hidden = true;
      kitTrigger.setAttribute('aria-expanded', 'false'); sortMore.setAttribute('aria-expanded', 'false'); drawRoster();
      updateFilterSummary();
    };
    sortRow.appendChild(sortLabel); sortRow.appendChild(sortControl); sortRow.appendChild(resetFilters);
    filterPanel.appendChild(scopebar); filterPanel.appendChild(rolebar); filterPanel.appendChild(linebar); filterPanel.appendChild(skillbar); filterPanel.appendChild(sortRow);
    toolbar.appendChild(searchLine); toolbar.appendChild(quickbar); toolbar.appendChild(filterPanel);
    updateFilterSummary();

    const rosterMeta = el('div', 'team-roster-meta');
    const roster = el('div', 'team-roster');
    const actions = el('div', 'team-actions');
    const auto = el('button', 'btn tiny', '✨ Auto Build');
    const reset = el('button', 'btn tiny', '↶ Reset');
    const clearBtn = el('button', 'btn tiny', 'Clear');
    actions.appendChild(auto); actions.appendChild(reset); actions.appendChild(clearBtn);

    const setTeam = ids => {
      const next = [];
      required.forEach(id => { if (!next.includes(id)) next.push(id); });
      ids.forEach(id => { if (id && filter(id) && Save.owns(id) && !next.includes(id) && next.length < maxSize) next.push(id); });
      for (let i = 0; i < maxSize; i++) cur[i] = next[i] || null;
    };
    const remove = id => {
      if (required.includes(id)) { this.toast(HEROES[id].name + ' is required'); Sound.play('ui_err'); return; }
      const at = cur.indexOf(id);
      if (at < 0) return;
      cur[at] = null; Sound.play('ui_back'); redrawSelection();
    };
    const toggle = id => {
      if (cur.includes(id)) { remove(id); return; }
      const open = cur.indexOf(null);
      if (open < 0) { this.toast('Team is full. Remove someone first'); Sound.play('ui_err'); return; }
      cur[open] = id; Sound.play('choose'); redrawSelection();
    };

    const drawStage = () => {
      clear(units);
      const selected = cur.filter(Boolean);
      empty.hidden = selected.length > 0;
      const grouped = { front: [], middle: [], back: [] };
      selected.forEach((id, teamIndex) => grouped[this.formationLine(id).key].push({ id, teamIndex }));
      const baseX = { back: 25, middle: 50, front: 75 };
      Object.keys(grouped).forEach(key => {
        const group = grouped[key];
        group.forEach(({ id, teamIndex }, lineIndex) => {
          const spread = lineIndex - (group.length - 1) / 2;
          const unit = el('button', `team-stage-unit line-${key}${required.includes(id) ? ' required' : ''}`);
          unit.style.setProperty('--unit-x', (baseX[key] + spread * 10) + '%');
          unit.style.setProperty('--unit-y', (2 + ((teamIndex * 7) % 3) * 3) + '%');
          unit.style.setProperty('--unit-z', String(20 + teamIndex));
          unit.style.setProperty('--unit-delay', (teamIndex * -.23) + 's');
          unit.setAttribute('aria-label', `${HEROES[id].name}, ${this.formationLine(id).label} line${required.includes(id) ? ', required' : ''}`);
          unit.innerHTML = `<span class="team-standee"><img src="${Art.hero(id)}" alt=""></span>
            <span class="team-unit-name"><b>${required.includes(id) ? '🔒 ' : ''}${HEROES[id].name}</b><small>${this.formationLine(id).label} · ${HEROES[id].role}</small></span>
            ${required.includes(id) ? '' : '<i>−</i>'}`;
          unit.onclick = () => remove(id);
          units.appendChild(unit);
        });
      });

      const roles = {};
      selected.forEach(id => { const role = heroRole(HEROES[id].role); roles[role] = (roles[role] || 0) + 1; });
      count.innerHTML = `<b>${selected.length}<span>/${maxSize}</span></b><small>HEROES</small>`;
      const powerInfo = Progress.teamPowerBreakdown(cur);
      power.innerHTML = `<b>${fmt(powerInfo.total)}</b><small>TEAM POWER</small>`;
      power.title = powerInfo.count
        ? `${powerInfo.count} heroes · Average ${fmt(powerInfo.average)} · Highest ${fmt(powerInfo.strongest.power)}`
        : 'Add heroes to calculate team power';
      const front = grouped.front.length, mid = grouped.middle.length, back = grouped.back.length;
      balance.innerHTML = `<span><i class="front"></i>${front} Front</span><span><i class="middle"></i>${mid} Middle</span><span><i class="back"></i>${back} Back</span>`;
      balance.classList.toggle('warning', selected.length > 2 && (!roles.Tank || !roles.Support));
      balance.title = balance.classList.contains('warning') ? 'A Tank and Support are recommended' : 'Formation line counts';
    };

    const drawRoster = () => {
      clear(roster);
      const q = search.value.trim().toLowerCase();
      clearSearch.hidden = !q;
      const eligible = Save.ownedIds().filter(id => filter(id));
      const stats = new Map();
      const stat = id => {
        if (!stats.has(id)) {
          const h = Save.hero(id);
          stats.set(id, { level: h ? Number(h.level) || 0 : 0, power: Progress.power(id), tags: cachedSkillTags(id) });
        }
        return stats.get(id);
      };
      const visible = eligible
        .filter(id => scope === 'All' || (scope === 'Team' ? cur.includes(id) : !cur.includes(id)))
        .filter(id => role === 'All' || heroRole(HEROES[id].role) === role)
        .filter(id => lineFilter === 'All' || this.formationLine(id).label === lineFilter)
        .filter(id => skillFilter === 'All' || stat(id).tags.includes(skillFilter))
        .filter(id => !q || [HEROES[id].name, HEROES[id].role, this.formationLine(id).label, ...stat(id).tags.map(key => (skillMetaByKey[key] || {}).label || key)].join(' ').toLowerCase().includes(q));
      const compare = (a, b) => {
        const sa = stat(a), sb = stat(b);
        if (sortBy === 'name') return HEROES[a].name.localeCompare(HEROES[b].name);
        if (sortBy === 'level' && sb.level !== sa.level) return sb.level - sa.level;
        if (sortBy === 'team') {
          const ai = cur.indexOf(a), bi = cur.indexOf(b);
          if ((ai >= 0) !== (bi >= 0)) return ai >= 0 ? -1 : 1;
          if (ai >= 0 && ai !== bi) return ai - bi;
        }
        if (sortBy.startsWith('skill:')) {
          const key = sortBy.slice(6);
          const aHas = sa.tags.includes(key), bHas = sb.tags.includes(key);
          if (aHas !== bHas) return aHas ? -1 : 1;
        }
        if (sb.power !== sa.power) return sb.power - sa.power;
        return HEROES[a].name.localeCompare(HEROES[b].name);
      };
      visible.sort(compare);
      const selectedCount = cur.filter(Boolean).length;
      rosterMeta.textContent = `${visible.length} shown · ${eligible.length} eligible · ${selectedCount}/${maxSize} selected`;
      visible.forEach(id => {
        const inTeam = cur.includes(id), locked = required.includes(id), line = this.formationLine(id);
        const tags = stat(id).tags.slice(0, 3).map(key => {
          const tag = skillMetaByKey[key];
          return `<i title="${tag.label}" style="--tag-color:${tag.color}">${tag.short}</i>`;
        }).join('');
        const card = el('button', `team-pick${inTeam ? ' selected' : ''}${locked ? ' required' : ''}`);
        card.type = 'button';
        card.dataset.hero = id;
        card.setAttribute('aria-pressed', String(inTeam));
        card.setAttribute('aria-label', `${HEROES[id].name}${inTeam ? ', selected' : ''}${locked ? ', required' : ''}`);
        card.innerHTML = `<span class="team-pick-art"><img src="${Art.hero(id)}" alt=""></span>
          <span class="team-pick-copy"><b>${HEROES[id].name}</b><small>${heroRole(HEROES[id].role)} · ${line.label}</small>
            <span class="team-pick-tags">${tags || '<i class="none">BASIC</i>'}</span><em>⚡ ${fmt(stat(id).power)}</em></span>
          <span class="team-pick-state">${locked ? '🔒' : inTeam ? '✓' : '+'}</span>`;
        card.onclick = () => toggle(id);
        roster.appendChild(card);
      });
      if (!visible.length) roster.appendChild(el('div', 'team-no-results', q ? 'No Heroes match those filters.' : 'No eligible Heroes found.'));
    };
    // Selection used to rebuild every roster card. That restarted all card
    // entrance animations, dropped keyboard focus, and caused visible flicker
    // on mobile. Keep the existing card DOM for normal sorts and only update
    // its semantic/visual state; a team sort still redraws because ordering
    // genuinely changes.
    const syncRosterSelection = () => {
      const selected = new Set(cur.filter(Boolean));
      $$('.team-pick', roster).forEach(card => {
        const id = card.dataset.hero;
        const inTeam = selected.has(id);
        const locked = required.includes(id);
        card.classList.toggle('selected', inTeam);
        card.classList.toggle('required', locked);
        card.setAttribute('aria-pressed', String(inTeam));
        card.setAttribute('aria-label', `${HEROES[id].name}${inTeam ? ', selected' : ''}${locked ? ', required' : ''}`);
        const state = $('.team-pick-state', card);
        if (state) state.textContent = locked ? '🔒' : inTeam ? '✓' : '+';
      });
      const shown = $$('.team-pick', roster).length;
      const eligible = Save.ownedIds().filter(id => filter(id)).length;
      rosterMeta.textContent = `${shown} shown · ${eligible} eligible · ${selected.size}/${maxSize} selected`;
    };
    const redrawSelection = () => {
      drawStage();
      if (sortBy === 'team') drawRoster();
      else syncRosterSelection();
    };
    const redraw = () => { drawStage(); drawRoster(); };
    search.oninput = drawRoster;
    clearSearch.onclick = () => { search.value = ''; search.focus(); drawRoster(); };
    auto.onclick = () => {
      const suggested = Progress.suggestTeam().filter(id => filter(id));
      const rest = Save.ownedIds().filter(id => filter(id)).sort((a, b) => Progress.power(b) - Progress.power(a));
      setTeam(suggested.concat(rest)); Sound.play('ui_ok'); redraw();
    };
    reset.onclick = () => { setTeam(original.filter(Boolean)); Sound.play('ui_back'); redraw(); };
    clearBtn.onclick = () => { setTeam([]); Sound.play('ui_back'); redraw(); };

    const stageHead = el('div', 'team-stage-head');
    stageHead.innerHTML = '<div><small>LIVE FORMATION</small><b>Your Toons on the field</b></div><span>Positions match battle</span>';
    wrap.appendChild(stageHead); wrap.appendChild(stage); wrap.appendChild(summary);
    wrap.appendChild(el('div', 'team-builder-hint', 'Tap a Toon in the room or roster to remove them. Formation lines are assigned automatically from attack range.'));
    wrap.appendChild(actions); wrap.appendChild(toolbar); wrap.appendChild(rosterMeta); wrap.appendChild(roster);
    redraw();
    return { node: wrap, team: cur, get valid() { return cur.filter(Boolean).length > 0; } };
  },

  /* ---------- reward reveal ---------- */
  showPulls(results, title) {
    const body = el('div');
    const newCount = results.filter(r => r.isNew).length;
    const summary = el('div', 'pull-summary', `${results.length} reveal${results.length === 1 ? '' : 's'}${newCount ? ` · ${newCount} NEW Hero${newCount === 1 ? '' : 'es'}` : ''}`);
    summary.setAttribute('role', 'status');
    body.appendChild(summary);
    const grid = el('div', 'grid4');
    const fragment = document.createDocumentFragment();
    results.forEach((r, i) => {
      const rarity = (r.type === 'hero' || r.type === 'shards') && r.id ? obtainOf(r.id).rank : 0;
      const c = el('div', 'pullcard pull-result' + (r.isNew ? ' new' : ''));
      c.dataset.type = r.type || 'resource';
      if (rarity) c.dataset.rarity = rarity;
      c.style.animationDelay = (i * .05) + 's';
      const bonus = r.bonus && typeof r.bonus === 'object'
        ? Object.entries(r.bonus).filter(([key, value]) => RES[key] && Number(value) > 0)
        : [];
      const bonusMarkup = bonus.length ? `<div class="mini" style="color:var(--gold)">✦ SUPPLY CACHE · ${bonus.slice(0, 2).map(([key, value]) => RES[key].icon + fmt(value)).join(' ')}${bonus.length > 2 ? ' +' + (bonus.length - 2) : ''}</div>` : '';
      if (r.type === 'hero' || r.type === 'shards') {
        c.innerHTML = `<img src="${Art.icon(r.id)}" loading="eager" decoding="async" alt="${HEROES[r.id].name}">
          <div class="mini b">${HEROES[r.id].name}</div>
          <div class="mini" style="color:var(--gold)">◈ ${r.n}</div>
          ${r.isNew ? '<div class="mini b" style="color:var(--gold)">NEW</div>' : ''}${bonusMarkup}`;
      } else {
        c.innerHTML = `<div style="font-size:32px;height:52px;display:grid;place-items:center">${RES[r.k].icon}</div>
          <div class="mini b">${RES[r.k].name}</div><div class="mini" style="color:var(--gold)">+${fmt(r.n)}</div>${bonusMarkup}`;
      }
      fragment.appendChild(c);
    });
    grid.appendChild(fragment);
    body.appendChild(grid);
    const ok = el('button', 'btn pri wide', 'Nice');
    ok.style.marginTop = '12px';
    ok.onclick = () => { this.closeModal(); Screens.render(); };
    body.appendChild(ok);
    this.modal(title || 'Crate Results', body, { sticky: true });
  }
};
