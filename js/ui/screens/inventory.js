/* screens/inventory.js - Trinkets work like real equipment: a dedicated hub
   to browse every Trinket type, see how many copies you hold, equip copies
   onto any owned Hero (each Hero wears their own physical copy), merge
   duplicates into higher ranks, salvage spares into Scrap, and craft new
   copies outright. Extends Screens (screens/core.js). */
'use strict';

Object.assign(Screens, {

  /* ============================================================ INVENTORY */
  invTab: 'trinkets',
  inventory(s) {
    const head = el('section', 'inventory-hero');
    head.innerHTML = `<div class="inventory-hero-glow" aria-hidden="true"></div><div class="inventory-hero-copy">
      <small>STORAGE // GARDENVIEW</small><h1>Inventory</h1><p>Keep your gear close, turn spare copies into Scrap, and make every reward count.</p>
      </div><div class="inventory-scrap"><span>${RES.scrap.icon}</span><b>${fmt(Save.res('scrap'))}</b><small>SCRAP</small></div>`;
    s.appendChild(head);

    const tabs = el('nav', 'inventory-tabs');
    tabs.setAttribute('aria-label', 'Inventory sections');
    [['trinkets', '◇', 'Trinkets'], ['shards', '◈', 'Shards'], ['materials', '✦', 'Materials'], ['craft', '⚙', 'Craft']].forEach(([k, icon, label]) => {
      const b = el('button', 'inventory-tab' + (k === this.invTab ? ' active' : ''));
      b.type = 'button'; b.setAttribute('aria-current', k === this.invTab ? 'page' : 'false');
      b.innerHTML = `<i>${icon}</i><span>${label}</span>`;
      b.onclick = () => { this.invTab = k; this.render(); };
      tabs.appendChild(b);
    });
    s.appendChild(tabs);

    if (this.invTab === 'trinkets') s.appendChild(this.trinketsTab());
    else if (this.invTab === 'shards') s.appendChild(this.shardsTab());
    else if (this.invTab === 'materials') s.appendChild(this.materialsTab());
    else s.appendChild(this.craftTab());
  },

  /** One compact card per Trinket type - count owned/equipped only, no shard
      math. Tap for the detail sheet (equip / merge / salvage). */
  trinketsTab() {
    const wrap = el('div');
    const eq = Save.equippedTrinketUids();
    const owned = TRINKET_IDS.filter(id => Save.ownsTrinket(id));

    const intro = el('div', 'inventory-section-head');
    intro.innerHTML = `<div><small>EQUIPMENT LOCKER</small><h2>Trinkets</h2><p>Equip a free copy, merge matching ranks, or salvage a spare.</p></div><b>${owned.length}<small> TYPES</small></b>`;
    wrap.appendChild(intro);
    const bulkPreview = Save.trinketMergePreview();
    const bulk = el('div', 'inventory-info');
    bulk.innerHTML = `<i>⚒</i><span><b>Bulk upgrade</b><br>${bulkPreview.merges ? `${bulkPreview.merges} free merge${bulkPreview.merges === 1 ? '' : 's'} ready across your locker.` : 'No free copies are ready to merge.'}<br><small>Equipped copies are always protected.</small></span>`;
    const bulkBtn = el('button', 'btn tiny gold', 'MERGE & UPGRADE ALL');
    bulkBtn.disabled = !bulkPreview.merges;
    bulkBtn.onclick = () => this.massMergeTrinkets();
    bulk.appendChild(bulkBtn);
    wrap.appendChild(bulk);
    const grid = el('div', 'inventory-grid');
    owned.sort((a, b) => Save.trinketBestRank(b) - Save.trinketBestRank(a)).forEach(id => {
      const t = TRINKETS[id], copies = Save.trinketCopies(id);
      const wornCount = copies.filter(u => eq.has(u)).length;
      const n = el('button', 'inventory-trinket-card');
      n.type = 'button';
      n.innerHTML = `<span class="inventory-item-art"><img src="${trinketIcon(id)}" alt="${t.name}">${wornCount ? `<em>${wornCount} WORN</em>` : '<em class="free">IN BAG</em>'}</span>
        <span class="inventory-item-copy"><b>${t.name}${trinketPlaceholderBadge(id)}</b><small>${heroRole(t.owner ? (HEROES[t.owner] && HEROES[t.owner].role) : '') || 'Character Trinket'}</small><span>Best Rank ${Save.trinketBestRank(id)} · ${copies.length} cop${copies.length === 1 ? 'y' : 'ies'}</span></span>
        <strong>›</strong><span class="inventory-item-foot"><i>${wornCount ? wornCount + ' equipped' : 'Nothing equipped'}</i>${copies.length > wornCount ? `<i class="free-copy">${copies.length - wornCount} free</i>` : ''}</span>`;
      n.onclick = () => this.openTrinketDetail(id);
      grid.appendChild(n);
    });
    wrap.appendChild(grid);

    if (!owned.length) {
      const empty = el('section', 'inventory-empty');
      empty.innerHTML = `<i>◇</i><b>Your locker is empty</b><p>Discover Trinkets from Twisteds, Hero milestones, or craft one from the Craft tab.</p><button type="button">VIEW CRAFTING ›</button>`;
      $('button', empty).onclick = () => { this.invTab = 'craft'; this.render(); };
      wrap.appendChild(empty);
    }
    return wrap;
  },

  /** Confirmed bulk action for the locker or one selected Trinket type. Only
      free copies are consumed; anything equipped remains exactly where it is. */
  massMergeTrinkets(tid) {
    const preview = Save.trinketMergePreview(tid);
    if (!preview.merges) { UI.toast('No free Trinket copies can be upgraded.'); return; }
    const label = tid && TRINKETS[tid] ? TRINKETS[tid].name : 'all Trinkets';
    UI.confirm('Mass upgrade?', `Forge ${preview.merges} merge${preview.merges === 1 ? '' : 's'} for ${label}? Equipped copies stay safe.`, () => {
      const result = Save.massMergeTrinkets(tid);
      if (!result.merges) { UI.toast('No free Trinket copies can be upgraded.'); return; }
      Sound.play('get_rare');
      const ranks = Object.entries(result.byRank).sort((a, b) => Number(a[0]) - Number(b[0]))
        .map(([rank, count]) => `${count} × Rank ${rank}`).join(' · ');
      UI.toast(`⚒ Upgraded ${result.merges} Trinket${result.merges === 1 ? '' : 's'}${ranks ? ' · ' + ranks : ''}`);
      UI.closeModal();
      if (tid) this.openTrinketDetail(tid); else this.render();
    });
  },

  /** One Trinket type's detail sheet: every rank you hold copies of, with
      Equip (assign a free copy to a Hero), Merge (the rank's required free
      copies forge the next rank up), and Salvage (break a free copy into Scrap). */
  openTrinketDetail(tid) {
    const t = TRINKETS[tid];
    const eq = Save.equippedTrinketUids();
    const body = el('div');
    if (t.placeholder) body.appendChild(el('div', 'trinket-wip-note', '⚠ Placeholder artwork: this Trinket is playable, but still needs its final character-specific icon.'));
    body.appendChild(el('div', 'trinket-equip-rule', 'ⓘ ' + trinketEquipRule(tid)));
    body.appendChild(el('div', 'mini trinket-signature', '🧩 ' + trinketSignatureText(tid)));
    body.appendChild(el('div', 'mini trinket-signature-effect', trinketSignatureEffect(tid)));
    body.appendChild(el('div', 'mini muted', 'Base effect: ' + t.effect));
    body.appendChild(el('div', 'mini muted', 'Story note: ' + (t.desc || 'A useful piece of a character\'s kit.')));
    body.appendChild(el('div', 'spacer'));

    const copies = Save.trinketCopies(tid);
    if (!copies.length) {
      body.appendChild(el('div', 'tiny muted',
        `You don't own this Trinket yet. ${t.owner ? possessive((HEROES[t.owner] && HEROES[t.owner].name) || t.owner) + ' Twisted or level-ups' : 'Twisteds'} can drop it, or craft one in the Craft tab.`));
      UI.modal(t.name, body);
      return;
    }

    const bulkPreview = Save.trinketMergePreview(tid);
    if (bulkPreview.merges) {
      const bulkRow = el('div', 'row'); bulkRow.style.marginBottom = '9px';
      const bulkBtn = el('button', 'btn tiny gold grow', `UPGRADE ALL FREE · ${bulkPreview.merges}`);
      bulkBtn.onclick = () => this.massMergeTrinkets(tid);
      bulkRow.appendChild(bulkBtn); body.appendChild(bulkRow);
    }

    for (let r = 1; r <= TRINKET_MAX_RANK; r++) {
      const atRank = copies.filter(u => Save.data.trinketInv[u].rank === r);
      if (!atRank.length) continue;
      const free = atRank.filter(u => !eq.has(u));
      const wornBy = atRank.filter(u => eq.has(u)).map(u => HEROES[Save.whoWears(u)].name);
      const card = el('div', 'card');
      card.style.marginBottom = '8px';
      const mergeCost = trinketMergeCost(r);
      card.innerHTML = `<div class="row tiny"><div class="grow b">Rank ${r} · ${trinketRankLabel(r)} · ${trinketStatText(t, r)}</div>
        <div class="muted">x${atRank.length}</div></div>
        <div class="mini muted" style="margin-top:2px">${free.length} free${wornBy.length ? ' · worn by ' + wornBy.join(', ') : ''}</div>`;
      const row = el('div', 'row'); row.style.marginTop = '6px';
      if (free.length) {
        const eqBtn = el('button', 'btn tiny grow', 'Equip');
        eqBtn.onclick = () => { UI.closeModal(); this.openTrinketAssignPicker(tid, free[0]); };
        row.appendChild(eqBtn);
        const salvBtn = el('button', 'btn tiny grow', `Salvage · ⚙+${TRINKET_SALVAGE[r]}`);
        salvBtn.onclick = () => { Save.salvageTrinket(free[0]); Sound.play('ui_back'); UI.closeModal(); this.openTrinketDetail(tid); };
        row.appendChild(salvBtn);
      }
      if (free.length >= mergeCost && r < TRINKET_MAX_RANK) {
        const mergeBtn = el('button', 'btn tiny gold grow', `Merge ${mergeCost} → Rank ${r + 1}`);
        mergeBtn.onclick = () => {
          if (Save.mergeTrinkets(tid, free.slice(0, mergeCost))) { Sound.play('get_rare'); UI.toast('Forged Rank ' + (r + 1) + ' ' + trinketRankLabel(r + 1) + ' ' + t.name); }
          UI.closeModal(); this.openTrinketDetail(tid);
        };
        row.appendChild(mergeBtn);
      }
      card.appendChild(row);
      body.appendChild(card);
    }
    UI.modal(t.name, body);
  },

  /** Pick which owned Hero (and which of their 2 slots) wears a specific
      free Trinket copy. */
  openTrinketAssignPicker(tid, uid) {
    const t = TRINKETS[tid];
    const body = el('div');
    body.appendChild(el('div', 'trinket-equip-rule', 'ⓘ ' + trinketEquipRule(tid)));
    body.appendChild(el('div', 'mini trinket-signature-effect', '🧩 Fragment effect: ' + trinketSignatureEffect(tid)));
    body.appendChild(el('div', 'mini muted', 'Rank ' + Save.data.trinketInv[uid].rank + ' · ' + trinketRankLabel(Save.data.trinketInv[uid].rank) + ' · ' + trinketStatText(t, Save.data.trinketInv[uid].rank) + ' · ' + t.effect));
    body.appendChild(el('div', 'spacer'));
    const list = el('div');
    Save.ownedIds().filter(hid => !(HEROES[hid] && HEROES[hid].noTrinket)).sort((a, b) => Progress.power(b) - Progress.power(a)).forEach(hid => {
      const h = Save.hero(hid);
      const row = el('div', 'row card');
      row.style.cssText = 'margin-bottom:6px;padding:8px;align-items:center';
      row.innerHTML = `<img src="${Art.icon(hid)}" style="width:34px;height:34px;object-fit:contain">
        <div class="grow b">${HEROES[hid].name}</div>`;
      [0, 1].forEach(slot => {
        const wornSame = h.trinkets[slot] === uid;
        const b = el('button', 'pill', wornSame ? '✓ Slot ' + (slot + 1) : 'Slot ' + (slot + 1));
        if (wornSame) { b.style.background = 'var(--gold)'; b.style.color = '#2a1a00'; }
        b.onclick = () => {
          if (wornSame) Progress.unequipTrinket(hid, slot);
          else Progress.equipTrinket(hid, slot, uid);
          UI.closeModal(); this.render();
        };
        row.appendChild(b);
      });
      list.appendChild(row);
    });
    body.appendChild(list);
    UI.modal('Equip ' + t.name, body);
  },

  /** All heroes with shards. Recruited ones show current star-up progress,
      unrecruited ones show how far along to unlock they are. */
  shardsTab() {
    const wrap = el('div');
    const allIds = Object.keys(HEROES).filter(id => HEROES[id].base);
    const shardTotal = allIds.reduce((sum, id) => sum + (Save.owns(id) ? Save.hero(id).shards : Save.pending(id)), 0);
    const intro = el('div', 'inventory-section-head');
    intro.innerHTML = `<div><small>RECRUITMENT MATERIAL</small><h2>Hero Shards</h2><p>Build toward a new recruit or the next Star promotion.</p></div><b>${fmt(shardTotal)}<small> HELD</small></b>`;
    wrap.appendChild(intro);
    const note = el('div', 'inventory-info');
    note.innerHTML = `<i>◈</i><span>Gardenview Heroes drop shards from their Twisted forms. Collaboration visitors use their Event Shop instead.</span>`;
    wrap.appendChild(note);

    const withShards = [], withoutShards = [];
    allIds.forEach(id => {
      const shards = Save.owns(id) ? Save.hero(id).shards : Save.pending(id);
      if (shards > 0) withShards.push(id);
      else withoutShards.push(id);
    });

    withShards.sort((a, b) => {
      const sa = Save.owns(a) ? Save.hero(a).shards : Save.pending(a);
      const sb = Save.owns(b) ? Save.hero(b).shards : Save.pending(b);
      return sb - sa;
    });

    if (withShards.length) {
      const grid = el('div', 'inventory-grid inventory-shard-grid');
      withShards.forEach(id => {
        const owned = Save.owns(id);
        const h = owned ? Save.hero(id) : null;
        const shards = owned ? h.shards : Save.pending(id);
        const starCost = owned ? Progress.starCost(id) : null;
        const need = owned ? (starCost ? starCost.shards : null) : Save.unlockNeed(id);
        const pct = need > 0 ? Math.min(1, shards / need) : 1;
        const label = owned
          ? (starCost ? `${shards} / ${need} to ★${h.stars + 1}` : `${shards} (max stars)`)
          : `${shards} / ${need} to recruit`;

        const n = el('button', 'inventory-shard-card');
        n.type = 'button';
        n.innerHTML = `<span class="inventory-shard-top"><img src="${Art.icon(id)}" alt="${HEROES[id].name}"${owned ? '' : ' class="locked"'}><span><b>${HEROES[id].name}</b><small>${owned ? '★'.repeat(h.stars) + ' · ' + heroRole(HEROES[id].role) : 'Not recruited'}</small></span><strong>◈${fmt(shards)}</strong></span>
          <span class="inventory-meter"><i style="width:${Math.round(pct * 100)}%"></i></span><span class="inventory-shard-label">${label}</span>`;
        n.onclick = () => Screens.openHeroPage(id);
        grid.appendChild(n);
      });
      wrap.appendChild(grid);
    }

    if (withoutShards.length) {
      const more = el('details', 'inventory-more-shards');
      more.innerHTML = `<summary>NO SHARDS YET <b>${withoutShards.length}</b></summary><p>${withoutShards.map(id => HEROES[id].name).join(' · ')}</p>`;
      wrap.appendChild(more);
    }

    if (!withShards.length && !withoutShards.length) {
      wrap.appendChild(el('div', 'mini muted', 'No shards collected yet. Fight Twisteds to earn them!'));
    }

    return wrap;
  },

  materialsTab() {
    const wrap = el('div');
    const total = Object.keys(RES).reduce((sum, k) => sum + Save.res(k), 0);
    const intro = el('div', 'inventory-section-head');
    intro.innerHTML = `<div><small>RESOURCE CABINET</small><h2>Materials</h2><p>Every resource you hold, ready for the next upgrade.</p></div><b>${fmt(total)}<small> UNITS</small></b>`;
    wrap.appendChild(intro);
    const grid = el('div', 'inventory-grid inventory-material-grid');
    Object.keys(RES).forEach(k => {
      const r = RES[k];
      const n = el('article', 'inventory-material-card');
      n.innerHTML = `<span class="inventory-material-icon">${r.icon}</span><span class="inventory-material-copy"><b>${fmt(Save.res(k))}</b><strong>${r.name}</strong><small>${r.desc}</small></span>`;
      grid.appendChild(n);
    });
    wrap.appendChild(grid);
    return wrap;
  },

  /** One button per Trinket type: craft a fresh Rank 1 copy for a flat Scrap
      price - no shard math, just "can I afford a copy right now". */
  craftTab() {
    const wrap = el('div');
    const intro = el('div', 'inventory-section-head');
    intro.innerHTML = `<div><small>WORKSHOP</small><h2>Craft Trinkets</h2><p>Turn spare equipment into a fresh Rank 1 copy for any build.</p></div><b>${fmt(Save.res('scrap'))}<small> SCRAP</small></b>`;
    wrap.appendChild(intro);
    const note = el('div', 'inventory-info craft-info');
    note.innerHTML = `<i>⚙</i><span>Salvage free copies in Trinkets to earn Scrap. Ranks 1–2 merge from 2 copies; Ranks 3–4 need 3. Each craft costs <b>${CRAFT_COPY_COST} Scrap</b> and makes a Rank 1 copy.</span>`;
    wrap.appendChild(note);

    const grid = el('div', 'inventory-grid inventory-craft-grid');
    TRINKET_IDS.forEach(id => {
      const t = TRINKETS[id];
      const n = el('article', 'inventory-craft-card');
      n.innerHTML = `<span class="inventory-craft-art"><img src="${trinketIcon(id)}" alt="${t.name}"></span><span class="inventory-craft-copy"><b>${t.name}${trinketPlaceholderBadge(id)}</b><small>${Save.trinketCount(id)} owned · Rank 1 craft</small></span>`;
      const b = el('button', 'inventory-craft-button', `<span>CRAFT COPY</span><b>⚙ ${CRAFT_COPY_COST}</b>`);
      b.disabled = Save.res('scrap') < CRAFT_COPY_COST;
      b.onclick = () => {
        const res = Save.craftTrinket(id);
        if (res) { Sound.play('get_item'); if (res === 'new') UI.toast('🔧 ' + t.name + ' unlocked!'); this.render(); }
        else UI.toast('Not enough Scrap');
      };
      n.appendChild(b);
      grid.appendChild(n);
    });
    wrap.appendChild(grid);
    return wrap;
  }

});
