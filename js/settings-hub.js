/* settings-hub.js: the Settings hub and the save safety net.
   - SaveGuard: rolling snapshots in IndexedDB (auto, manual, before-danger, deleted slots), a one-step undo copy, storage health,
     backup-file tracking and an attention list.
   - Settings: a two-pane hub (Overview, Sound, Display, Saves, Backups, Account, Advanced) that replaces Screens.openSettings.
   - Entry points: an always-visible Settings button in the top bar (with an alert dot) and a card on Home.
   Loaded last (see GAME_SCRIPTS in js/item-sheet.js). Save slots themselves are still managed by Save in the game bundle. */
'use strict';

(() => {
  const LS_LAST_FILE = 'dh-last-file-backup', LS_AUTO_AT = 'dh-guard-last-auto', LS_AUTO_REV = 'dh-guard-last-rev';
  const DB_NAME = 'dh-save-vault', STORE = 'snaps';
  const KEEP = { auto: 10, manual: 12, danger: 12, deleted: 12 };
  const DAY = 864e5;
  const num = key => { try { return Number(localStorage.getItem(key)) || 0; } catch (_) { return 0; } };
  const put = (key, value) => { try { localStorage.setItem(key, String(value)); } catch (_) { /* storage may be full; the banner covers it */ } };
  const when = t => t ? new Date(t).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' }) : 'never';
  const ago = t => {
    if (!t) return 'never';
    const s = Math.max(0, (Date.now() - t) / 1000);
    if (s < 90) return 'just now';
    if (s < 3600) return Math.round(s / 60) + ' min ago';
    if (s < 86400) return Math.round(s / 3600) + ' h ago';
    return Math.round(s / 86400) + ' days ago';
  };
  const kb = n => n > 1048576 ? (n / 1048576).toFixed(1) + ' MB' : Math.max(1, Math.round(n / 1024)) + ' KB';
  const esc = text => String(text == null ? '' : text).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const slotName = (id = Save.activeSlot) => { const s = Save.slotInfo(id); return s ? s.name : 'Save'; };

  /* ------------------------------------------------------------ the vault */
  const openDb = () => new Promise((resolve, reject) => {
    if (!window.indexedDB) { reject(new Error('IndexedDB is not available')); return; }
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(STORE, { keyPath: 'id', autoIncrement: true });
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
  const run = async (mode, fn) => {
    const db = await openDb();
    return new Promise((resolve, reject) => {
      const t = db.transaction(STORE, mode);
      let request;
      try { request = fn(t.objectStore(STORE)); } catch (e) { db.close(); reject(e); return; }
      t.oncomplete = () => { db.close(); resolve(request && request.result); };
      t.onerror = t.onabort = () => { db.close(); reject(t.error); };
    });
  };
  const pack = async text => {
    if (window.CompressionStream) {
      const stream = new Blob([text]).stream().pipeThrough(new CompressionStream('gzip'));
      return { gz: true, data: await new Response(stream).arrayBuffer() };
    }
    return { gz: false, data: text };
  };
  const unpack = async rec => {
    if (!rec.gz) return rec.data;
    return new Response(new Blob([rec.data]).stream().pipeThrough(new DecompressionStream('gzip'))).text();
  };

  let vaultError = null;
  const SaveGuard = {
    async list() { return (await run('readonly', s => s.getAll()) || []).sort((a, b) => b.at - a.at); },
    async add(slot, name, data, reason) {
      try {
        const text = JSON.stringify(data), packed = await pack(text);
        await run('readwrite', s => s.add({
          slot, slotName: name, at: Date.now(), reason, mastery: Number(data.mastery) || 0, heroes: Object.keys(data.heroes || {}).length,
          bestFloor: Number(data.bestFloor) || 0, bytes: text.length, gz: packed.gz, data: packed.data
        }));
        await this.prune();
        vaultError = null;
        return true;
      } catch (e) { vaultError = e; console.warn('snapshot failed', e); return false; }
    },
    async prune() {
      const all = await this.list(), seen = {};
      const drop = all.filter(rec => { seen[rec.reason] = (seen[rec.reason] || 0) + 1; return seen[rec.reason] > (KEEP[rec.reason] || 10); });
      for (const rec of drop) await run('readwrite', s => s.delete(rec.id));
    },
    remove(id) { return run('readwrite', s => s.delete(id)); },
    async read(rec) { return unpack(rec); },
    /** Snapshot the live save. Never the Full Test Save. */
    async snapshot(reason) {
      if (!Save.data || Save.isTestSession()) return false;
      Save.flushWrite();
      return this.add(Save.activeSlot, slotName(), Save.data, reason);
    },
    undoKey: slot => Save.slotKey(slot) + '-undo',
    hasUndo() { try { return !!localStorage.getItem(this.undoKey(Save.activeSlot)); } catch (_) { return false; } },
    keepUndo() {
      try { const raw = localStorage.getItem(Save.slotKey(Save.activeSlot)); if (raw) localStorage.setItem(this.undoKey(Save.activeSlot), raw); } catch (_) { /* nothing to keep */ }
    },
    fileBackedUpAt: () => num(LS_LAST_FILE),
    markFileBackup() { put(LS_LAST_FILE, Date.now()); updateBadge(); },
    vaultError: () => vaultError
  };

  /* Health: is the browser willing to keep this save? */
  const health = { persisted: null, usage: 0, quota: 0 };
  async function checkHealth() {
    try {
      if (navigator.storage && navigator.storage.persisted) health.persisted = await navigator.storage.persisted();
      if (navigator.storage && navigator.storage.estimate) { const e = await navigator.storage.estimate(); health.usage = e.usage || 0; health.quota = e.quota || 0; }
    } catch (_) { /* optional */ }
    updateBadge();
  }
  async function protectStorage() {
    try { if (navigator.storage && navigator.storage.persist) health.persisted = await navigator.storage.persist(); } catch (_) { /* optional */ }
    await checkHealth();
    return health.persisted;
  }

  function attention() {
    const list = [];
    if (!Save.data) return list;
    if (Save.localSaveError) list.push({ level: 'bad', text: 'This device could not store your save. Download a backup file now so your progress is safe.', go: 'backups', action: 'Open backups' });
    const real = !Save.isTestSession() && (Number(Save.data.mastery) || 0) > 1;
    const last = SaveGuard.fileBackedUpAt();
    if (real && !last) list.push({ level: 'warn', text: 'You have never saved a backup file. Browsers can clear game data without warning.', go: 'backups', action: 'Back up now' });
    else if (real && Date.now() - last > 14 * DAY) list.push({ level: 'warn', text: 'Your last backup file is ' + ago(last) + '. Save a fresh one.', go: 'backups', action: 'Back up now' });
    if (health.persisted === false) list.push({ level: 'info', text: 'The browser may clear this save if the device runs low on space.', act: protectStorage, action: 'Protect storage' });
    if (vaultError) list.push({ level: 'info', text: 'Automatic snapshots are unavailable in this browser. Backup files still work.' });
    if (typeof WebsimAccount !== 'undefined' && Save.isAccountSave()) {
      if (WebsimAccount.cloudConflict) list.push({ level: 'warn', text: 'Cloud save changed on another device. Choose which copy to keep.', go: 'cloud', action: 'Review' });
      else if (WebsimAccount.cloudError) list.push({ level: 'info', text: 'Cloud save is reconnecting.', go: 'cloud', action: 'Details' });
    }
    return list;
  }
  const worst = () => { const l = attention(); return l.some(a => a.level === 'bad') ? 'bad' : l.some(a => a.level === 'warn') ? 'warn' : l.length ? 'info' : ''; };

  /* ------------------------------------------------- automatic snapshots */
  let autoTimer = null;
  async function auto() {
    autoTimer = null;
    try {
      if (!Save.data || Save.isTestSession()) return;
      const rev = Number(Save.data._updatedAt) || 0;
      if (rev === num(LS_AUTO_REV) || Date.now() - num(LS_AUTO_AT) < 10 * 60e3) return;
      put(LS_AUTO_AT, Date.now()); put(LS_AUTO_REV, rev);
      await SaveGuard.add(Save.activeSlot, slotName(), Save.data, 'auto');
    } catch (_) { /* a missed snapshot is not an error the player needs */ }
  }
  {
    const flush = Save.flushWrite;
    Save.flushWrite = function () {
      const ok = flush.apply(this, arguments);
      if (ok && !autoTimer) autoTimer = setTimeout(auto, 15000);
      return ok;
    };
    // Anything that replaces or erases a save leaves a one-step undo copy first.
    const imp = Save.import;
    Save.import = function (json, options) {
      Save.flushWrite();
      if (!Save.isTestSession() && !(options && options.newSlot)) SaveGuard.keepUndo();
      return imp.apply(this, arguments);
    };
    const reset = Save.reset;
    Save.reset = function () { Save.flushWrite(); if (!Save.isTestSession()) SaveGuard.keepUndo(); return reset.apply(this, arguments); };
    const del = Save.deleteSlot;
    Save.deleteSlot = function (id) {
      try {
        const raw = localStorage.getItem(Save.slotKey(id)) || localStorage.getItem(Save.backupKey(id));
        const data = raw && JSON.parse(raw);
        if (data && Save.validSave(data) && !Save.isTestData(data)) SaveGuard.add(id, slotName(id), data, 'deleted');
      } catch (_) { /* nothing to keep */ }
      return del.apply(this, arguments);
    };
    document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') auto(); });
  }

  /* ------------------------------------------------------------- the UI */
  const SECTIONS = [
    ['overview', '🏠', 'Overview'], ['sound', '🔊', 'Sound'], ['display', '🖥', 'Display'], ['saves', '💾', 'Saves'],
    ['backups', '🛟', 'Backups'], ['cloud', '☁', 'Account'], ['advanced', '🧰', 'Advanced']
  ];

  function downloadSlot(id) {
    const ok = Screens.downloadSave(id);
    if (ok) SaveGuard.markFileBackup();
    return ok;
  }
  {
    const original = Screens.downloadSave;
    Screens.downloadSave = function () { const ok = original.apply(this, arguments); if (ok) SaveGuard.markFileBackup(); return ok; };
  }

  function section(name) { return Screens._shSection = name; }

  async function openSettings(startAt) {
    const current = SECTIONS.some(s => s[0] === startAt) ? startAt : (SECTIONS.some(s => s[0] === Screens._shSection) ? Screens._shSection : 'overview');
    Screens._shSection = current;
    const body = el('div', 'sh');
    const nav = el('nav', 'sh-nav'); nav.setAttribute('aria-label', 'Settings sections');
    const panel = el('div', 'sh-panel');
    body.append(nav, panel);
    const issues = attention();
    const draw = name => {
      section(name);
      clear(nav);
      SECTIONS.forEach(([id, icon, label]) => {
        const b = el('button', 'sh-tab' + (id === name ? ' on' : ''));
        b.type = 'button';
        b.innerHTML = `<i>${icon}</i><span>${label}</span>` + (id === 'backups' && issues.some(a => a.go === 'backups') ? '<em class="sh-dot"></em>' : '');
        b.onclick = () => { Sound.play('ui_move', { vol: .4 }); draw(id); };
        nav.appendChild(b);
      });
      clear(panel);
      const builder = { overview, sound, display, saves, backups, cloud, advanced }[name];
      builder(panel, () => draw(name), draw);
      panel.scrollTop = 0;
    };
    UI.modal('Settings', body, { className: 'sh-modal', dismissOnBackdrop: true });
    draw(current);
    checkHealth().then(() => { if (body.isConnected && Screens._shSection === 'overview') draw('overview'); });
  }

  /* shared control builders (they reuse the game's existing st-* look) */
  const kit = panel => {
    const heading = text => panel.appendChild(el('h3', 'st-h', text));
    const row = (label, desc, control) => {
      const r = el('div', 'st-row'), t = el('div', 'st-text');
      t.appendChild(el('b', '', label)); if (desc) t.appendChild(el('small', '', desc));
      r.appendChild(t); if (control) r.appendChild(control); panel.appendChild(r); return r;
    };
    const toggle = (label, desc, on, set) => {
      const b = el('button', 'st-switch' + (on ? ' on' : ''), on ? 'On' : 'Off');
      b.type = 'button'; b.setAttribute('role', 'switch'); b.setAttribute('aria-checked', String(on)); b.setAttribute('aria-label', label);
      b.onclick = () => set(!on); return row(label, desc, b);
    };
    const slider = (label, desc, value, min, max, step, show, oninput, onchange) => {
      const wrap = el('div', 'st-slider'), input = document.createElement('input');
      input.type = 'range'; input.min = min; input.max = max; input.step = step; input.value = value; input.setAttribute('aria-label', label);
      const out = el('output', '', show(value));
      input.oninput = () => { const v = Number(input.value); out.textContent = show(v); oninput(v); };
      input.onchange = () => onchange && onchange(Number(input.value));
      wrap.append(input, out); return row(label, desc, wrap);
    };
    const segmented = (label, desc, options, current, pick) => {
      const seg = el('div', 'st-seg'); seg.setAttribute('role', 'group'); seg.setAttribute('aria-label', label);
      options.forEach(([value, text]) => {
        const b = el('button', 'st-seg-btn' + (value === current ? ' on' : ''), text);
        b.type = 'button'; b.setAttribute('aria-pressed', String(value === current)); b.onclick = () => pick(value); seg.appendChild(b);
      });
      return row(label, desc, seg);
    };
    const button = (text, cls, fn) => { const b = el('button', 'st-btn' + (cls ? ' ' + cls : ''), text); b.type = 'button'; b.onclick = fn; return b; };
    return { heading, row, toggle, slider, segmented, button };
  };

  /* ---- Overview */
  function overview(panel, again, go) {
    const info = Save.slotInfo() || {};
    const bad = worst();
    const hero = el('div', 'sh-hero ' + (bad || 'good'));
    const status = Save.localSaveError ? 'Not saving on this device' : bad === 'warn' ? 'Saved here, back it up' : 'Saved on this device';
    hero.innerHTML = `<div class="sh-hero-mark">${bad === 'bad' ? '⚠' : bad === 'warn' ? '🛟' : '✔'}</div>
      <div class="sh-hero-copy"><small>CURRENT SAVE</small><b>${esc(info.name || 'Save')}</b>
      <span>Mastery ${fmt(Number(Save.data.mastery) || 0)} · ${fmt(Object.keys(Save.data.heroes || {}).length)} Heroes · Best floor ${fmt(Number(Save.data.bestFloor) || 0)}</span>
      <em>${status} · last write ${ago(info.updatedAt)}</em></div>`;
    panel.appendChild(hero);
    const quick = el('div', 'sh-quick');
    const back = el('button', 'sh-big', '<b>Back up now</b><small>Download a file and keep a snapshot</small>');
    back.innerHTML = '<b>Back up now</b><small>Download a file and keep a snapshot</small>';
    back.onclick = async () => { await SaveGuard.snapshot('manual'); downloadSlot(Save.activeSlot); again(); };
    const snap = el('button', 'sh-big alt', '<b>Snapshot</b><small>Keep a restore point on this device</small>');
    snap.onclick = async () => { const ok = await SaveGuard.snapshot('manual'); UI.toast(ok ? 'Snapshot saved' : Save.isTestSession() ? 'Full Test Save is not snapshotted' : 'Snapshots are unavailable here'); again(); };
    quick.append(back, snap); panel.appendChild(quick);

    const list = attention();
    if (list.length) {
      panel.appendChild(el('h3', 'st-h', 'Needs attention'));
      list.forEach(a => {
        const row = el('div', 'sh-issue ' + a.level);
        row.appendChild(el('span', '', a.text));
        if (a.action) {
          const b = el('button', 'st-btn', a.action); b.type = 'button';
          b.onclick = async () => { if (a.act) { await a.act(); again(); } else go(a.go); };
          row.appendChild(b);
        }
        panel.appendChild(row);
      });
    }
    const k = kit(panel);
    k.heading('Safety');
    const used = health.quota ? ` · using ${kb(health.usage)} of ${kb(health.quota)}` : '';
    k.row('Browser storage', health.persisted === true ? 'Protected. The browser will not clear it when space is low.' + used : health.persisted === false ? 'Not protected yet. Tap Protect storage.' + used : 'Checking…');
    k.row('Last backup file', SaveGuard.fileBackedUpAt() ? when(SaveGuard.fileBackedUpAt()) + ' (' + ago(SaveGuard.fileBackedUpAt()) + ')' : 'No backup file saved yet.');
    SaveGuard.list().then(snaps => {
      const mine = snaps.filter(s => s.slot === Save.activeSlot);
      if (!panel.isConnected) return;
      k.row('Restore points', mine.length ? mine.length + ' on this device, newest ' + ago(mine[0].at) + '.' : 'None yet. One is taken a few seconds after you play.');
    }).catch(() => k.row('Restore points', 'Not available in this browser.'));
  }

  /* ---- Sound */
  function sound(panel, again) {
    const k = kit(panel);
    k.heading('Volume');
    k.toggle('Sound', 'Turns every sound and the music on or off.', !!Sound.on, () => { Save.data.opt.sound = Sound.toggle(); Save.write(); again(); });
    k.slider('Sound effects', 'Hits, buttons, skills and character voices.', Math.round(Sound.vol * 100), 0, 100, 1, v => v + '%',
      v => Sound.setVolume(v / 100, { skipSave: true }), () => { Save.data.opt.sfxVolume = Sound.vol; Save.write(); });
    k.slider('Music', 'Background tracks only. Sound effects are not affected.', Math.round(Music.volume * 100), 0, 100, 1, v => v + '%',
      v => Music.setVolume(v / 100, { skipSave: true }), () => { Save.data.opt.musicVolume = Music.volume; Save.write(); });
    k.heading('Menu music');
    const tracks = [['random', 'Shuffle'], ['clair', 'Clair de Lune'], ['christmas', 'The Perfect Christmas'], ['lockedAway', 'Locked Away']];
    if (Music.ownsDyleRecord('kh')) tracks.push(['dyleKh', 'Dearly Beloved (KH)']);
    if (Music.ownsDyleRecord('ff7')) tracks.push(['dyleFf7', 'Main Theme (FF7)']);
    if (Music.ownsDyleRecord('ode')) tracks.push(['dyleOde', 'Ode to Joy']);
    const sel = el('select', 'st-select'); sel.setAttribute('aria-label', 'Menu music');
    tracks.forEach(([id, label]) => { const o = el('option', '', label); o.value = id; sel.appendChild(o); });
    sel.value = typeof Music.getMenuMode === 'function' ? Music.getMenuMode() : (Save.data.opt.menuMusic || 'random');
    sel.onchange = () => { if (typeof Music.setMenuMode === 'function') Music.setMenuMode(sel.value); else { Save.data.opt.menuMusic = sel.value; Save.write(); } };
    k.row('Track', 'What plays in the menus. Shuffle picks one for you.', sel);
  }

  /* ---- Display */
  function display(panel, again) {
    const k = kit(panel);
    k.heading('Performance');
    k.slider('Graphics quality', 'Lower values cut particles, shadows and filters. Try this first if battles lag.', GraphicsSettings.value(), 0, 100, 10,
      v => v <= 33 ? 'Low' : v >= 67 ? 'High' : 'Balanced',
      v => { GraphicsSettings.remember(v); Save.data.opt.graphicsQuality = v; GraphicsSettings.sync(); },
      v => { Save.data.opt.graphicsQuality = clamp(v, 0, 100); Save.write(); });
    const presets = [['battery', 'Battery saver', 25, 'off', false, false, false], ['balanced', 'Balanced', 55, 'reduced', true, true, true], ['sharp', 'Sharp', 90, 'auto', true, true, true]];
    const cur = presets.find(p => GraphicsSettings.value() === p[2] && GraphicsSettings.option('graphicsParticles') === p[3] && GraphicsSettings.option('graphicsBackground') === p[4]);
    k.segmented('Preset', 'Sets quality, particles, background, numbers and shake in one go.', presets.map(p => [p[0], p[1]]), cur ? cur[0] : null, id => {
      const [, , quality, particles, background, numbers, shake] = presets.find(p => p[0] === id);
      GraphicsSettings.remember(quality);
      Object.assign(Save.data.opt, { graphicsQuality: quality, graphicsParticles: particles, graphicsBackground: background, combatNumbers: numbers, screenShake: shake, cameraZoom: shake });
      Save.write(); GraphicsSettings.sync(); again();
    });
    k.toggle('Animated characters', 'Moving battle characters instead of still poses. Applies from the next battle.', ScrapsRig.enabled(), v => { Save.data.opt.animatedChars = v; Save.write(); again(); });
    k.heading('Battle effects');
    k.segmented('Particles', 'How many sparks and dust bits appear.', [['auto', 'Auto'], ['reduced', 'Fewer'], ['off', 'None']], GraphicsSettings.option('graphicsParticles'),
      v => { GraphicsSettings.setOption('graphicsParticles', v); again(); });
    const flag = (key, label, desc) => k.toggle(label, desc, !!GraphicsSettings.option(key), v => { GraphicsSettings.setOption(key, v); again(); });
    flag('graphicsBackground', 'Background detail', 'Stage filters, shadows and atmosphere.');
    flag('combatNumbers', 'Damage numbers', 'Shows damage, healing and shield amounts.');
    flag('screenShake', 'Screen shake', 'Small camera jolts on heavy hits.');
    flag('cameraZoom', 'Impact zoom', 'A quick zoom-in on big moments.');
    k.heading('Accessibility');
    const reducedOn = Accessibility.enabled();
    const systemDefault = Accessibility.systemEnabled() && (!Save.data || !Save.data.opt || typeof Save.data.opt.reducedEffects !== 'boolean');
    k.toggle('Reduce motion and flashing', 'Turns off flashes, shake, zoom and decorative effects, overriding the options above.' + (systemDefault ? ' Currently on because your device asks for it.' : ''), reducedOn, () => {
      if (reducedOn) UI.confirm('Turn off reduced motion?', 'Flashes, camera shake, zoom and other motion effects will come back. Only do this if it is safe for you.', () => { Accessibility.disable(); openSettings('display'); });
      else { Accessibility.enable(); again(); }
    });
  }

  /* ---- Saves (slots) */
  function saves(panel) {
    const k = kit(panel);
    k.heading('Save slots');
    const host = el('div', 'st-slots');
    Screens.drawSaveSlots(host);
    panel.appendChild(host);
  }

  /* ---- Backups */
  function snapshotCard(rec, again) {
    const card = el('div', 'sh-snap');
    const label = { auto: 'Automatic', manual: 'Manual', danger: 'Before a risky change', deleted: 'Deleted save' }[rec.reason] || rec.reason;
    card.innerHTML = `<div class="sh-snap-head"><b>${esc(rec.slotName || 'Save')}</b><em class="${rec.reason}">${label}</em></div>
      <small>${when(rec.at)} · ${ago(rec.at)}</small><p>Mastery ${fmt(rec.mastery)} · ${fmt(rec.heroes)} Heroes · Best floor ${fmt(rec.bestFloor)} · ${kb(rec.bytes)}</p>`;
    const actions = el('div', 'st-slot-actions');
    const k = kit(el('div'));
    const restore = k.button('Restore here', '', () => restoreFlow(rec, false));
    const asNew = k.button('Restore as new save', '', () => restoreFlow(rec, true));
    const download = k.button('Download', '', async () => {
      const text = await SaveGuard.read(rec);
      const blob = new Blob([JSON.stringify({ format: 'dandys-heroes-save', version: 2, exportedAt: rec.at, slot: { id: rec.slot, name: rec.slotName || 'Save' }, save: JSON.parse(text) }, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob), a = document.createElement('a');
      a.href = url; a.download = 'dandys-heroes-snapshot-' + new Date(rec.at).toISOString().slice(0, 16).replace(/[:T]/g, '-') + '.json';
      document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(url), 1000);
      SaveGuard.markFileBackup();
    });
    const remove = k.button('Delete', 'danger', () => UI.confirm('Delete this snapshot?', 'The snapshot is removed from this device. Your current save is not affected.', async () => { await SaveGuard.remove(rec.id); again(); }));
    actions.append(restore, asNew, download, remove); card.appendChild(actions);
    return card;
  }

  function restoreFlow(rec, asNew) {
    const when2 = when(rec.at);
    const body = el('div');
    body.appendChild(el('div', 'muted tiny', asNew
      ? 'This keeps your current save and adds the snapshot from ' + when2 + ' as a new save slot.'
      : 'This replaces your current save with the snapshot from ' + when2 + ' (Mastery ' + fmt(rec.mastery) + ', ' + fmt(rec.heroes) + ' Heroes). A snapshot of your current save is kept first.'));
    const cur = Number(Save.data.mastery) || 0;
    if (!asNew && cur > rec.mastery) {
      const warn = el('div', 'sh-issue warn'); warn.textContent = 'This snapshot has less progress than your current save (Mastery ' + fmt(rec.mastery) + ' vs ' + fmt(cur) + ').';
      body.appendChild(warn);
    }
    const row = el('div', 'row'); row.style.marginTop = '12px';
    const cancel = el('button', 'btn tiny grow', 'Cancel'); cancel.onclick = () => UI.closeModal();
    const go = el('button', 'btn gold tiny grow', asNew ? 'Add as new save' : 'Replace current save');
    go.onclick = async () => {
      go.disabled = true;
      try {
        await SaveGuard.snapshot('danger');
        const text = JSON.stringify(JSON.parse(await SaveGuard.read(rec)));
        const ok = asNew ? Save.import(text, { newSlot: true, name: 'Restored ' + new Date(rec.at).toLocaleDateString() }) : Save.import(text);
        if (ok) location.reload();
        else { go.disabled = false; UI.toast(text.length > 300000 ? 'That save is too large to restore in this version' : 'That snapshot could not be restored here'); Sound.play('ui_err'); }
      } catch (e) { go.disabled = false; UI.toast('That snapshot could not be read'); Sound.play('ui_err'); }
    };
    row.append(cancel, go); body.appendChild(row);
    UI.modal(asNew ? 'Restore as new save' : 'Restore snapshot', body);
  }

  function importFile(file) {
    const reader = new FileReader();
    reader.onload = () => {
      let parsed = null;
      try { parsed = JSON.parse(String(reader.result || '')); } catch (_) { parsed = null; }
      const incoming = parsed && parsed.save && typeof parsed.save === 'object' ? parsed.save : parsed;
      if (!Save.validSave(incoming)) { UI.toast('That file is not a Dandy’s Heroes save'); Sound.play('ui_err'); return; }
      if (Save.isTestData(incoming) && !Save.isTestSlot()) { UI.toast('A Full Test Save can only be restored in its own slot'); Sound.play('ui_err'); return; }
      const text = JSON.stringify(incoming);
      const body = el('div'), mastery = Number(incoming.mastery) || 0, heroes = Object.keys(incoming.heroes || {}).length, curM = Number(Save.data.mastery) || 0;
      body.innerHTML = `<div class="sh-snap"><div class="sh-snap-head"><b>${esc((parsed.slot && parsed.slot.name) || file.name)}</b><em class="manual">File</em></div>
        <small>${parsed.exportedAt ? 'Exported ' + when(parsed.exportedAt) : esc(file.name)}</small>
        <p>Mastery ${fmt(mastery)} · ${fmt(heroes)} Heroes · Best floor ${fmt(Number(incoming.bestFloor) || 0)} · ${kb(text.length)}</p></div>
        <p class="muted tiny">Your current save: Mastery ${fmt(curM)} · ${fmt(Object.keys(Save.data.heroes || {}).length)} Heroes. The file itself is never changed.</p>`;
      if (text.length > 300000) { const w = el('div', 'sh-issue bad'); w.textContent = 'This save is too large for this version to import (' + kb(text.length) + ').'; body.appendChild(w); UI.modal('Import save', body); return; }
      if (mastery < curM) { const w = el('div', 'sh-issue warn'); w.textContent = 'This file has less progress than your current save. Replacing would lower your Mastery from ' + fmt(curM) + ' to ' + fmt(mastery) + '.'; body.appendChild(w); }
      const row = el('div', 'row'); row.style.marginTop = '12px';
      const asNew = el('button', 'btn gold tiny grow', 'Import as new save');
      asNew.onclick = () => (UI.closeModal(), Screens.askSaveName('Name Imported Save', file.name.replace(/\.json$/i, '').slice(0, 24), name => {
        if (Save.import(text, { newSlot: true, name })) location.reload(); else { UI.toast('That save could not be imported'); Sound.play('ui_err'); }
      }));
      const replace = el('button', 'btn pri tiny grow', 'Replace current');
      replace.onclick = async () => { replace.disabled = true; await SaveGuard.snapshot('danger'); if (Save.import(text)) location.reload(); else { replace.disabled = false; UI.toast('That save could not be imported'); Sound.play('ui_err'); } };
      row.append(asNew, replace); body.appendChild(row);
      UI.modal('Import save', body);
    };
    reader.readAsText(file);
  }

  function backups(panel, again) {
    const k = kit(panel);
    k.heading('Back up');
    const files = el('div', 'st-files');
    files.append(
      k.button('Download backup file', 'primary', () => { downloadSlot(Save.activeSlot); again(); }),
      k.button('Keep a snapshot', '', async () => { const ok = await SaveGuard.snapshot('manual'); UI.toast(ok ? 'Snapshot saved' : Save.isTestSession() ? 'Full Test Save is not snapshotted' : 'Snapshots are unavailable here'); again(); })
    );
    k.row('This save', 'A file you can keep anywhere, or a restore point kept on this device.', files);
    const input = el('input'); input.type = 'file'; input.accept = 'application/json,.json'; input.hidden = true;
    input.onchange = () => { const f = input.files[0]; input.value = ''; if (f) importFile(f); };
    const load = k.button('Load from file…', '', () => input.click());
    const loadRow = el('div', 'st-files'); loadRow.append(load, input);
    k.row('Restore from a file', 'You see what is inside and how it compares before anything changes.', loadRow);
    if (SaveGuard.hasUndo()) {
      k.row('Undo last replace or reset', 'Brings back this slot exactly as it was before the last replace, import or reset.', k.button('Undo', '', () => UI.confirm('Undo the last replace?', 'Your current save is kept as a snapshot first.', async () => {
        await SaveGuard.snapshot('danger');
        const raw = localStorage.getItem(SaveGuard.undoKey(Save.activeSlot));
        if (raw && Save.import(raw)) location.reload(); else UI.toast('Nothing to undo');
      })));
    }
    k.heading('Restore points on this device');
    const host = el('div', 'sh-snaps'); host.appendChild(el('small', 'muted', 'Loading…')); panel.appendChild(host);
    SaveGuard.list().then(all => {
      clear(host);
      if (!all.length) { host.appendChild(el('div', 'sh-empty', 'No restore points yet. One is kept automatically a few seconds after you play, then at most every 10 minutes. Manual snapshots and anything taken before a risky change are kept longer.')); return; }
      all.forEach(rec => host.appendChild(snapshotCard(rec, again)));
    }).catch(() => { clear(host); host.appendChild(el('div', 'sh-empty', 'This browser does not allow restore points. Backup files still work.')); });
  }

  /* ---- Account and cloud */
  function cloud(panel) {
    const k = kit(panel);
    k.heading('Account');
    const acct = typeof WebsimAccount !== 'undefined' ? WebsimAccount : null;
    let state = 'Local only on this device.';
    if (Save.isTestSession()) state = 'Full Test Save is a local testing slot. It never uses your account or the cloud.';
    else if (!Save.isAccountSave()) state = 'Cloud saving covers Main Save only. This slot stays on this device.';
    else if (acct && acct.user) state = 'Signed in as @' + acct.user.username + '.';
    else state = 'Not signed in. Your progress stays on this device.';
    k.row('Websim account', state);
    if (acct && Save.isAccountSave()) {
      let cloudState = 'No cloud save yet.';
      if (acct.cloudConflict) cloudState = 'Cloud changed on another device. This device kept its own copy. Review it in Profile.';
      else if (acct.cloudError) cloudState = 'Cloud save is reconnecting.';
      else if (acct.pendingSync) cloudState = 'Saving to the cloud…';
      else if (acct.cloud) cloudState = 'Cloud save: Mastery ' + fmt(acct.cloud.mastery || 0) + ' · ' + fmt(acct.cloud.heroes || 0) + ' Heroes · ' + (acct.cloud.updated_at_ms ? when(acct.cloud.updated_at_ms) : 'earlier');
      k.row('Cloud save', cloudState);
    }
    k.row('Cloud tools and profile', 'Save now, resolve conflicts and edit your profile.', k.button('Open Profile', '', () => { UI.closeModal(); if (acct && acct.openDetails) acct.openDetails('save'); }));
    k.row('Local copy', 'Every slot is also stored in this browser, with restore points under Backups.');
  }

  /* ---- Advanced */
  function advanced(panel) {
    const k = kit(panel);
    const labOpen = typeof Lab !== 'undefined' && (!('access' in Lab) || Lab.access);
    if (labOpen || Save.canLoadTestSave()) k.heading('Testing');
    if (labOpen) k.row('Fight Lab', 'Build and test teams without changing your save.', k.button('Open Fight Lab', '', () => { UI.closeModal({ skipHook: true }); Lab.enter(); }));
    if (Save.canLoadTestSave()) {
      k.row('Full test save', 'Every Hero and plenty of resources, in its own slot.', k.button('Open full save', '', () => UI.confirm('Open full save?', 'This opens a separate Full Test Save slot with every Hero, maxed access, plentiful resources, and test Trinkets. Your current save is never overwritten.', () => { if (Save.loadTestSave()) location.reload(); })));
    }
    k.heading('Danger zone');
    const name = slotName();
    k.row('Reset this save', 'Erases every Hero, resource and bit of progress in “' + name + '”. A snapshot is kept first, and you can undo it.', k.button('Reset…', 'danger', () => {
      const body = el('div');
      body.appendChild(el('div', 'muted tiny', 'Type the save name to confirm: ' + name));
      const input = el('input', 'save-slot-input'); input.type = 'text'; input.setAttribute('aria-label', 'Type the save name'); body.appendChild(input);
      const row = el('div', 'row'); row.style.marginTop = '12px';
      const cancel = el('button', 'btn tiny grow', 'Cancel'); cancel.onclick = () => UI.closeModal();
      const go = el('button', 'btn tiny grow', 'Erase this save'); go.disabled = true;
      input.oninput = () => { go.disabled = input.value.trim().toLowerCase() !== name.toLowerCase(); };
      go.onclick = async () => { go.disabled = true; await SaveGuard.snapshot('danger'); Save.reset(); location.reload(); };
      row.append(cancel, go); body.appendChild(row); UI.modal('Reset save', body);
      setTimeout(() => input.focus(), 0);
    }));
  }

  Screens.openSettings = function (startAt) { return openSettings(typeof startAt === 'string' ? startAt : undefined); };

  /* ----------------------------------------------- entry points + banner */
  function updateBadge() {
    const btn = document.getElementById('settingsBtn');
    if (btn) { const level = worst(); btn.dataset.alert = level; btn.title = level ? 'Settings: ' + (attention()[0] || {}).text : 'Settings and saves'; }
    let banner = document.getElementById('shBanner');
    if (Save.data && Save.localSaveError) {
      if (!banner) {
        banner = el('div', 'sh-banner'); banner.id = 'shBanner';
        banner.innerHTML = '<span>⚠ Your progress could not be saved on this device.</span>';
        const b = el('button', '', 'Fix it'); b.type = 'button'; b.onclick = () => Screens.openSettings('backups');
        banner.appendChild(b); document.body.appendChild(banner);
      }
    } else if (banner) banner.remove();
  }
  function addButton() {
    const left = document.querySelector('#topbar .tb-left');
    if (!left || document.getElementById('settingsBtn')) return;
    const b = el('button', 'settings-btn'); b.id = 'settingsBtn'; b.type = 'button'; b.setAttribute('aria-label', 'Open settings and saves');
    b.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 8.5a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7Zm8.2 5.3-1.9-1.1a6.6 6.6 0 0 0 0-1.4l1.9-1.1-2-3.4-2 1.1a7 7 0 0 0-1.2-.7l-.3-2.2h-4l-.3 2.2c-.4.2-.8.4-1.2.7l-2-1.1-2 3.4 1.9 1.1a6.6 6.6 0 0 0 0 1.4l-1.9 1.1 2 3.4 2-1.1c.4.3.8.5 1.2.7l.3 2.2h4l.3-2.2c.4-.2.8-.4 1.2-.7l2 1.1 2-3.4Z" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/></svg><span class="settings-label">Settings</span><i class="settings-dot"></i>';
    b.onclick = () => { Sound.play('ui_open', { vol: .5 }); Screens.openSettings(); };
    left.appendChild(b);
    updateBadge();
  }
  {
    const home = Screens.home;
    Screens.home = function () {
      const result = home.apply(this, arguments);
      document.querySelectorAll('.home-settings').forEach(old => {
        const info = Save.slotInfo() || {}, last = SaveGuard.fileBackedUpAt(), level = worst();
        const card = el('button', 'home-settings sh-homecard' + (level ? ' ' + level : ''));
        card.type = 'button';
        card.innerHTML = `<i>⚙</i><span><b>Settings & Saves</b><small>${esc(info.name || 'Save')} · ${last ? 'file backup ' + ago(last) : 'no backup file yet'}</small></span><em>${level === 'bad' ? 'Fix now' : level === 'warn' ? 'Back up' : 'Open'}</em>`;
        card.onclick = () => Screens.openSettings();
        old.replaceWith(card);
      });
      return result;
    };
  }
  addButton();
  setInterval(() => { addButton(); updateBadge(); }, 8000);
  setTimeout(checkHealth, 3000);

  window.SaveGuard = SaveGuard;
})();
