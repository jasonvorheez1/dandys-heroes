/* screens/lab.js - shared combat test room. */
'use strict';

const Lab = {
  access: true,
  checking: null,
  draftKey: 'dandys-heroes-private-lab-v3',

  async init() {
    if (!this.checking) this.checking = this.resolveAccess();
    this.access = await this.checking;
    this.refreshButton();
    return this.access;
  },

  async resolveAccess() {
    return true;
  },

  refreshButton() {
    const button = $('#settingsLabBtn');
    if (button) button.hidden = !this.access;
  },

  enter() {
    this.access = true;
    Screens.go('lab');
  },

  heroOptions() {
    return PLAYABLE_IDS.filter(id => HEROES[id] && !HEROES[id].twistedOnly);
  },

  esc(value) {
    return String(value == null ? '' : value).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  },

  readDraft() {
    try {
      const raw = localStorage.getItem(this.draftKey);
      const draft = raw ? JSON.parse(raw) : {};
      return draft && typeof draft === 'object' ? draft : {};
    } catch (_) { return {}; }
  },

  saveDraft(page) {
    if (!page) return;
    const side = key => $$(`[data-lab-row="${key}"]`, page).map(row => ({
      id: row.querySelector('[data-lab-hero]')?.value || '',
      t1: row.querySelector('[data-lab-gear="t1"]')?.value || '',
      t2: row.querySelector('[data-lab-gear="t2"]')?.value || '',
      b1: row.querySelector('[data-lab-gear="b1"]')?.value || '',
      b2: row.querySelector('[data-lab-gear="b2"]')?.value || ''
    }));
    try {
      localStorage.setItem(this.draftKey, JSON.stringify({
        choice: $('#labBadgeChoice', page)?.value || '0',
        allyLevel: $('#labAllyLevel', page)?.value || 10,
        enemyLevel: $('#labEnemyLevel', page)?.value || 10,
        allyBadgeLevel: $('#labAllyBadgeLevel', page)?.value || 5,
        enemyBadgeLevel: $('#labEnemyBadgeLevel', page)?.value || 5,
        twisted: $('#labTwisted', page)?.checked !== false,
        maxSkills: $('#labMaxSkills', page)?.checked !== false,
        maxGear: !!$('#labMaxGear', page)?.checked,
        charged: !!$('#labCharged', page)?.checked,
        linkLevels: !!$('#labLinkLevels', page)?.checked,
        ally: side('ally'), enemy: side('enemy')
      }));
    } catch (_) { /* Lab persistence is a convenience, never a blocker. */ }
  },

  defaultIds(side) {
    const pool = this.heroOptions();
    const saved = (Save.data.team || []).filter(id => pool.includes(id));
    const preferred = side === 'ally' ? saved : ['Poppy', 'Boxten', 'Ginger', 'Coal', 'Tisha'];
    return [...preferred, ...pool].filter((id, i, list) => id && list.indexOf(id) === i).slice(0, 5);
  },

  defaultGear(id) {
    const h = Save.hero(id) || {};
    const badges = typeof BADGE_IDS_FOR === 'function' ? BADGE_IDS_FOR(id) : [];
    const worn = Array.isArray(h.trinkets) ? h.trinkets.filter(Boolean) : [];
    const equipped = Save.equippedBadges(id);
    const first = equipped[0] || badges[0] || '';
    return {
      t1: worn[0] || '', t2: worn[1] || '',
      b1: first, b2: equipped[1] || badges.find(b => b !== first) || badges[1] || ''
    };
  },

  trinketCopies() {
    const inv = Save.data.trinketInv || {};
    return Object.keys(inv).map(uid => {
      const copy = inv[uid], def = copy && TRINKETS[copy.id];
      return def ? { uid, id: copy.id, rank: Number(copy.rank) || 1, name: def.name } : null;
    }).filter(Boolean).sort((a, b) => a.name.localeCompare(b.name) || b.rank - a.rank);
  },

  trinketOptionsHtml() {
    return '<option value="">— Empty —</option>' + this.trinketCopies().map(t =>
      `<option value="${this.esc(t.uid)}">${this.esc(t.name)} · R${t.rank}</option>`).join('');
  },

  badgeOptionsHtml(id, selected) {
    const ids = typeof BADGE_IDS_FOR === 'function' ? BADGE_IDS_FOR(id) : [];
    return '<option value="">— No badge —</option>' + ids.map(bid => {
      const def = BADGES[bid], locked = !Save.ownsBadge(bid);
      return `<option value="${this.esc(bid)}"${bid === selected ? ' selected' : ''}>${this.esc(def.name)}${locked ? ' · locked' : ''}</option>`;
    }).join('');
  },

  heroOptionsHtml(selected) {
    return '<option value="">— Empty slot —</option>' + this.heroOptions().map(id =>
      `<option value="${this.esc(id)}"${id === selected ? ' selected' : ''}>${this.esc(HEROES[id].name)} · ${this.esc(heroRole(HEROES[id].role))}</option>`).join('');
  },

  buildRow(side, index, record) {
    const row = el('div', 'lab-fighter-row');
    row.dataset.labRow = side;
    row.dataset.labIndex = index;
    row.innerHTML = `<div class="lab-row-top">
      <select data-lab-hero aria-label="${side} hero slot ${index + 1}">${this.heroOptionsHtml(record.id)}</select>
      <button type="button" class="lab-remove" aria-label="Clear ${side} slot ${index + 1}" title="Clear slot">×</button>
    </div>
    <div class="lab-gear-grid">
      <label><span>TRINKET 1</span><select data-lab-gear="t1">${this.trinketOptionsHtml()}</select></label>
      <label><span>TRINKET 2</span><select data-lab-gear="t2">${this.trinketOptionsHtml()}</select></label>
      <label><span>BADGE A</span><select data-lab-gear="b1">${this.badgeOptionsHtml(record.id, record.b1)}</select></label>
      <label><span>BADGE B</span><select data-lab-gear="b2">${this.badgeOptionsHtml(record.id, record.b2)}</select></label>
    </div>
    <small class="lab-row-summary"></small>`;
    this.populateRow(row, record.id, record);
    return row;
  },

  populateRow(row, id, record) {
    const hero = row.querySelector('[data-lab-hero]');
    const t1 = row.querySelector('[data-lab-gear="t1"]');
    const t2 = row.querySelector('[data-lab-gear="t2"]');
    const b1 = row.querySelector('[data-lab-gear="b1"]');
    const b2 = row.querySelector('[data-lab-gear="b2"]');
    if (hero && hero.value !== id) hero.value = id || '';
    const gear = record || (id ? this.defaultGear(id) : { t1: '', t2: '', b1: '', b2: '' });
    if (b1 && b1.dataset.hero !== id) {
      b1.innerHTML = this.badgeOptionsHtml(id, gear.b1);
      b2.innerHTML = this.badgeOptionsHtml(id, gear.b2);
      b1.dataset.hero = id; b2.dataset.hero = id;
    }
    const disabled = !id || !!(HEROES[id] && HEROES[id].noTrinket);
    [t1, t2].forEach(s => { if (s) { s.disabled = disabled; s.value = disabled ? '' : (gear[s.dataset.labGear] || ''); } });
    if (b1) b1.value = gear.b1 || '';
    if (b2) b2.value = gear.b2 || '';
    this.updateSummary(row);
  },

  updateSummary(row) {
    const values = ['t1', 't2'].map(k => row.querySelector(`[data-lab-gear="${k}"]`)?.selectedOptions[0]?.textContent)
      .filter(v => v && !v.includes('Empty'))
      .map(v => v.replace(/ · locked$/, ''));
    const badges = ['b1', 'b2'].map(k => row.querySelector(`[data-lab-gear="${k}"]`)?.selectedOptions[0]?.textContent)
      .filter(v => v && !v.includes('No badge'))
      .map((v, i) => `B${i + 1} ${v.replace(/ · locked$/, '')}`);
    const summary = row.querySelector('.lab-row-summary');
    if (summary) summary.textContent = [...values, ...badges].join(' · ') || 'No equipment selected';
  },

  readSide(page, side) {
    return $$(`[data-lab-row="${side}"]`, page).map(row => ({
      id: row.querySelector('[data-lab-hero]')?.value || '',
      t1: row.querySelector('[data-lab-gear="t1"]')?.value || '',
      t2: row.querySelector('[data-lab-gear="t2"]')?.value || '',
      b1: row.querySelector('[data-lab-gear="b1"]')?.value || '',
      b2: row.querySelector('[data-lab-gear="b2"]')?.value || ''
    }));
  },

  writeSide(page, side, records) {
    $$(`[data-lab-row="${side}"]`, page).forEach((row, i) => {
      const record = records[i] || { id: '', t1: '', t2: '', b1: '', b2: '' };
      this.populateRow(row, record.id, record);
    });
    this.saveDraft(page);
  },

  copyTrinket(uid, maxRank) {
    const copy = uid && Save.data.trinketInv && Save.data.trinketInv[uid];
    if (!copy || !TRINKETS[copy.id]) return null;
    return { id: copy.id, rank: maxRank ? TRINKET_MAX_RANK : (Number(copy.rank) || 1) };
  },

  makeSpec(id, level, twisted, maxSkills, loadout) {
    const skillLv = maxSkills ? SKILL_MAX_LEVEL : Math.max(1, Math.round(level * .9));
    let spec;
    if (twisted && typeof makeTwisted === 'function' && TWISTED_FILE[id]) {
      spec = makeTwisted(id, level, 'normal') || rivalSpec(id, level, { skillLv });
    } else {
      spec = rivalSpec(id, level, { skillLv });
      spec.twisted = !!(twisted && TWISTED_FILE[id]);
    }
    spec.level = level;
    spec.stars = 5;
    spec.rarity = 6;
    spec.rarityPlus = 30;
    spec.skillLv = skillLv;
    spec.name = twisted && spec.twisted ? 'Twisted ' + HEROES[id].name : HEROES[id].name;
    spec.trinkets = HEROES[id] && HEROES[id].noTrinket ? [] : (loadout?.trinkets || []);
    spec.badge = loadout?.badge || null;
    spec.badges = loadout?.badges || [];
    return spec;
  },

  launch(page) {
    const allyRecords = this.readSide(page, 'ally').filter(r => r.id);
    const enemyRecords = this.readSide(page, 'enemy').filter(r => r.id);
    if (!allyRecords.length || !enemyRecords.length) {
      UI.toast('Pick at least one Hero on each side.'); Sound.play('ui_err'); return;
    }
    const duplicate = records => records.map(r => r.id).find((id, i, a) => a.indexOf(id) !== i);
    if (duplicate(allyRecords) || duplicate(enemyRecords)) {
      UI.toast('Each side needs unique Heroes.'); Sound.play('ui_err'); return;
    }
    const allyLevel = clamp(Number($('#labAllyLevel', page).value) || 10, 1, 800);
    const enemyLevel = clamp(Number($('#labEnemyLevel', page).value) || allyLevel, 1, 800);
    const badgeChoice = Number($('#labBadgeChoice', page).value) === 1 ? 'b2' : 'b1';
    const maxSkills = $('#labMaxSkills', page).checked;
    const maxGear = $('#labMaxGear', page).checked;
    const startCharged = $('#labCharged', page).checked;
    const badgeLevel = side => clamp(Number($(side === 'ally' ? '#labAllyBadgeLevel' : '#labEnemyBadgeLevel', page).value) || 5, 1, BADGE_MAX_LVL);
    const loadout = (record, side) => ({
      trinkets: [record.t1, record.t2].map(uid => this.copyTrinket(uid, maxGear)).filter(Boolean),
      badge: record[badgeChoice] ? { id: record[badgeChoice], lvl: badgeLevel(side) } : null
    });
    const team = allyRecords.map(r => this.makeSpec(r.id, allyLevel, false, maxSkills, loadout(r, 'ally')));
    const foes = enemyRecords.map(r => this.makeSpec(r.id, enemyLevel, $('#labTwisted', page).checked, maxSkills, loadout(r, 'enemy')));
    this.saveDraft(page);
    const title = `Lab Test · ${badgeChoice === 'b1' ? 'Badge A' : 'Badge B'} · Lv ${allyLevel} vs ${enemyLevel}`;
    BattleScreen.launch({
      team, foes,
      meta: {
        title, floorLabel: 'PRIVATE LAB', roomIdx: 1, roomTotal: 1,
        survivedLabel: 'Lab test complete', bg: bgForFloor(1, 0),
        labDuel: allyRecords.length === 1 && enemyRecords.length === 1,
        skillStartEnergy: startCharged ? 100 : 0,
        enemySkillStartEnergy: startCharged ? 100 : 0,
        labLoadout: { badgeChoice, maxGear }
      },
      onDone: () => Screens.render()
    });
  },

  lab(s) {
    const pool = this.heroOptions(), draft = this.readDraft();
    const ids = side => {
      const saved = Array.isArray(draft[side]) ? draft[side].map(r => r && r.id).slice(0, 5) : [];
      const fallback = this.defaultIds(side);
      return Array.from({ length: 5 }, (_, i) => pool.includes(saved[i]) ? saved[i] : (fallback[i] || ''));
    };
    const records = side => ids(side).map((id, i) => {
      const saved = Array.isArray(draft[side]) && draft[side][i];
      return id && saved && saved.id === id ? saved : (id ? this.defaultGear(id) : { id: '', t1: '', t2: '', b1: '', b2: '' });
    });
    const page = el('section', 'lab-screen');
    page.innerHTML = `<div class="lab-head"><div><small>COMBAT TESTING</small><h1>Fight Lab</h1><p>Build, compare, and stress-test full combat loadouts against the live engine.</p></div><span>🧪</span></div>`;

    const toolbar = el('div', 'lab-toolbar');
    toolbar.innerHTML = `<div class="lab-toolbar-copy"><b>LOADOUT WORKBENCH</b><span>Every row supports 2 Trinkets and 2 selectable Friendship Badges.</span></div>
      <div class="lab-toolbar-actions"><button type="button" class="btn lab-tool" data-lab-action="sync">SYNC MAIN TEAM</button><button type="button" class="btn lab-tool" data-lab-action="swap">⇄ SWAP SIDES</button><button type="button" class="btn lab-tool" data-lab-action="random">RANDOMIZE</button><button type="button" class="btn lab-tool" data-lab-action="clear">CLEAR</button></div>`;
    page.appendChild(toolbar);

    const setup = el('div', 'lab-setup');
    const side = (name, key, levelId, badgeLevelId) => {
      const card = el('section', 'lab-side ' + key);
      card.innerHTML = `<header><div><small>${key === 'ally' ? 'PLAYER SIDE' : 'OPPONENT SIDE'}</small><h2>${name}</h2></div><b>${key === 'ally' ? 'YOUR BUILD' : 'TEST BUILD'}</b></header><div class="lab-column-labels"><span>HERO</span><span>TRINKETS / BADGES</span></div>`;
      const slots = el('div', 'lab-slots');
      records(key).forEach((record, i) => slots.appendChild(this.buildRow(key, i, record)));
      card.appendChild(slots);
      const controls = el('div', 'lab-side-controls');
      controls.innerHTML = `<label class="lab-level"><span>LEVEL</span><input id="${levelId}" type="number" min="1" max="800" value="${this.esc(draft[key + 'Level'] || 10)}"></label>
        <label class="lab-level"><span>BADGE LEVEL</span><input id="${badgeLevelId}" type="number" min="1" max="${BADGE_MAX_LVL}" value="${this.esc(draft[badgeLevelId.replace('lab', '').replace('Level', '').replace('Badge', 'Badge')] || 5)}"></label>`;
      // The saved property names are clearer than trying to derive them from
      // the DOM id above; this assignment is also safe for old drafts.
      controls.querySelector('#' + badgeLevelId).value = draft[key + 'BadgeLevel'] || 5;
      card.appendChild(controls);
      return card;
    };
    setup.appendChild(side('Your team', 'ally', 'labAllyLevel', 'labAllyBadgeLevel'));
    setup.appendChild(side('Practice team', 'enemy', 'labEnemyLevel', 'labEnemyBadgeLevel'));
    page.appendChild(setup);

    const options = el('section', 'lab-options');
    options.innerHTML = `<div class="lab-option-heading"><b>TEST CONTROLS</b><span>Changes stay in this browser for your next lab visit.</span></div>
      <div class="lab-option-grid"><label><input id="labTwisted" type="checkbox"${draft.twisted !== false ? ' checked' : ''}><span>Use Twisted enemy forms when available</span></label>
      <label><input id="labMaxSkills" type="checkbox"${draft.maxSkills !== false ? ' checked' : ''}><span>Max skill mastery and Rainbow rarity</span></label>
      <label><input id="labMaxGear" type="checkbox"${draft.maxGear ? ' checked' : ''}><span>Use max rank for selected Trinkets</span></label>
      <label><input id="labCharged" type="checkbox"${draft.charged ? ' checked' : ''}><span>Start both sides with full Energy</span></label>
      <label><input id="labLinkLevels" type="checkbox"${draft.linkLevels ? ' checked' : ''}><span>Link opponent level to your level</span></label>
      <label class="lab-badge-choice"><span>ACTIVE BADGE CHOICE</span><select id="labBadgeChoice"><option value="0">A · use every row's Badge A</option><option value="1">B · use every row's Badge B</option></select></label></div>`;
    page.appendChild(options);

    const note = el('div', 'lab-qol-note');
    note.innerHTML = '<b>Loadout rules:</b> the Lab clones selected Trinket copies, so testing never unequips your real roster. Badges remain one active badge per Hero; Choice A/B lets you compare two saved badge builds without rebuilding the room.';
    page.appendChild(note);

    const actions = el('div', 'lab-actions');
    const back = el('button', 'btn', '‹ Home'); back.onclick = () => Screens.go('home');
    const start = el('button', 'btn pri', 'START TEST FIGHT'); start.onclick = () => this.launch(page);
    actions.appendChild(back); actions.appendChild(start); page.appendChild(actions);
    s.appendChild(page);

    $('#labBadgeChoice', page).value = draft.choice || '0';
    const allyLevel = $('#labAllyLevel', page), enemyLevel = $('#labEnemyLevel', page);
    allyLevel.oninput = () => { if ($('#labLinkLevels', page).checked) enemyLevel.value = allyLevel.value; this.saveDraft(page); };
    enemyLevel.oninput = () => this.saveDraft(page);
    $('#labBadgeChoice', page).onchange = () => this.saveDraft(page);
    $$('[data-lab-hero]', page).forEach(select => {
      select.onchange = () => {
        const row = select.closest('[data-lab-row]');
        this.populateRow(row, select.value, select.value ? this.defaultGear(select.value) : null);
        this.saveDraft(page);
      };
    });
    $$('[data-lab-gear]', page).forEach(select => select.onchange = () => { this.updateSummary(select.closest('[data-lab-row]')); this.saveDraft(page); });
    $$('.lab-remove', page).forEach(button => button.onclick = () => { const row = button.closest('[data-lab-row]'); this.populateRow(row, '', null); this.saveDraft(page); });
    $$('input,select', options).forEach(input => input.addEventListener('change', () => this.saveDraft(page)));
    page.querySelector('[data-lab-action="sync"]').onclick = () => {
      const main = (Save.data.team || []).filter(id => pool.includes(id)).slice(0, 5);
      this.writeSide(page, 'ally', Array.from({ length: 5 }, (_, i) => main[i] ? Object.assign({ id: main[i] }, this.defaultGear(main[i])) : { id: '', t1: '', t2: '', b1: '', b2: '' }));
      UI.toast('Main team synced with equipped gear.');
    };
    page.querySelector('[data-lab-action="swap"]').onclick = () => { const a = this.readSide(page, 'ally'), e = this.readSide(page, 'enemy'); this.writeSide(page, 'ally', e); this.writeSide(page, 'enemy', a); UI.toast('Lab sides swapped.'); };
    page.querySelector('[data-lab-action="clear"]').onclick = () => { const blank = Array.from({ length: 5 }, () => ({ id: '', t1: '', t2: '', b1: '', b2: '' })); this.writeSide(page, 'ally', blank); this.writeSide(page, 'enemy', blank); UI.toast('Lab cleared.'); };
    page.querySelector('[data-lab-action="random"]').onclick = () => {
      const choose = () => this.heroOptions().slice().sort(() => Math.random() - .5).slice(0, 5).map(id => Object.assign({ id }, this.defaultGear(id)));
      this.writeSide(page, 'ally', choose()); this.writeSide(page, 'enemy', choose()); UI.toast('Random teams loaded.');
    };
  }
};

Object.assign(Screens, { lab: Lab.lab.bind(Lab) });
