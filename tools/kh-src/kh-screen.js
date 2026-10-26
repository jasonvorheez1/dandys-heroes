/* kh-screen.js - the Kingdom Hearts · Halloween Town event screen and its
   visual novel. Dressed as the Kingdom Hearts II menus: royal-blue backdrop,
   slanted command bars with a chevron tip, HP gauges and an Information bar.
   The original Door Opens event keeps living here as the Classic tab. */
'use strict';

const KH_VOICE = {
  Sora: { tick: 'kh_blip', rate: 1.05 }, Goofy: { tick: 'kh_blip', rate: .8 }, Donald: { tick: 'kh_blip', rate: 1.45 },
  JackSkellington: { tick: 'kh_blip', rate: .7 }, OogieBoogie: { tick: 'kh_blip', rate: .55 }, LockShockBarrel: { tick: 'kh_blip', rate: 1.5 },
  Dandy: { tick: 'dandy_text' }, TwistedDandy: { tick: 'kh_blip', rate: .5 },
  Eclipse: { tick: 'kh_blip', rate: 1.1 }, Pooh: { tick: 'kh_blip', rate: .8 }, Tigger: { tick: 'kh_blip', rate: 1.3 }, Piglet: { tick: 'kh_blip', rate: 1.55 }, Eeyore: { tick: 'kh_blip', rate: .6 }, Rabbit: { tick: 'kh_blip', rate: 1.05 }, Vee: { cue: 'hero_vee_talk' }, Bassie: { cue: 'hero_bassie_talk' }, Bobette: { cue: 'hero_bobette_talk' }, Shelly: { cue: 'hero_shelly_talk' }
};
/* The shared emote table uses water-drop pops for sweat, tears and blush; the KH story gets drier ones. */
const KH_EMOTE_SFX = { anger: 'step_heavy', sweat: 'cloth', tears: 'ui_back', blush: 'ding' };
const KH_ALIAS = { Lock: 'LockShockBarrel', Shock: 'LockShockBarrel', Barrel: 'LockShockBarrel' };
const KH_MUSIC = { menu: 'khMenu', town: 'khTown', night: 'khNight', dearly: 'khDearly', battle: 'khBattle', boss: 'khBoss' };
const KH_CHEVRON = '<i class="kh-chev" aria-hidden="true"></i>';

function khWin(cls, html) { return `<section class="kh-win ${cls || ''}">${html}</section>`; }
function khName(id) { return KH_NAMES[id] || (HEROES[id] ? HEROES[id].name : id); }
function khPortrait(id) {
  if (KH_ART[id]) return ASSET + KH_ART[id];
  if (id === 'TwistedDandy') return Art.twisted('Dandy');
  if (typeof FF7_VN_ART !== 'undefined' && FF7_VN_ART[id]) return ASSET + FF7_VN_ART[id];
  return Art.icon(id);
}
function khCast(id) { return KH_ALIAS[id] || id; }
function khIsPixel(id) { return !!KH_ART[id] && !(FF7_VN_ART && FF7_VN_ART[id]); }

Object.assign(Screens, {
  /* ============================================================ BOARD BANNER */
  khBanner(e, entryOpen) {
    const cleared = Raid.stageProgress(e.id), stageCount = Raid.stageCount(e), isComplete = cleared >= stageCount;
    const b = this.ebCard({
      kind: 'Collab · Story', accent: '#ff8a2a', title: 'Halloween Town', sub: 'Sora, Jack, Oogie and the Heartless',
      art: ['Sora', 'JackSkellington', 'OogieBoogie', 'LockShockBarrel'].map(id => khPortrait(id)), locked: !entryOpen,
      status: !entryOpen ? `Opens at Mastery ${e.minMastery}` : isComplete ? 'Cleared' : `Chapter ${KHEvent.current() + 1} of ${stageCount}`,
      tone: !entryOpen ? 'locked' : isComplete ? 'done' : 'ready', progress: cleared / Math.max(1, stageCount)
    });
    b.onclick = () => { KHSnd.play('select'); Sound.play('choose'); this._raidDossier = e.id; this.render(); };
    return b;
  },
  /* A back-link at the top of the classic Door Opens dossier. */
  khClassicBar(topbar) {
    const b = el('button', 'kh-classic-back', `${KH_CHEVRON}<span>Halloween Town</span>`);
    b.onclick = () => { KHSnd.play('back'); this._raidDossier = KH_EVENT.id; this._khTab = 'classic'; this.render(); };
    topbar.appendChild(b);
  },

  /* ============================================================ EVENT SCREEN */
  khEvent(s, ev) {
    const st = KHEvent.state();
    this._khTab = this._khTab && this._khTab !== 'classic' ? this._khTab : 'story';
    if (this._khSel == null || !KHEvent.unlocked(this._khSel)) this._khSel = KHEvent.current();
    const page = el('section', 'kh-event');
    page.dataset.music = this._khTab === 'wood' ? 'khEscapade' : 'khMenu';
    const tabs = [['story', 'Story', '📖'], ['party', 'Party', '🗝'], ['heartless', 'Heartless', '❤'], ['shop', 'Shop', '💰'], ['wood', 'Wood', '🍯']];
    page.innerHTML = `
      <div class="kh-sky" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i><i></i></div>
      <header class="kh-head">
        <div class="kh-logo"><b>HALLOWEEN TOWN</b><small>Kingdom Hearts · The Pumpkin King</small></div>
        <div class="kh-wallet"><span title="Munny"><i class="kh-munny"></i>${fmt(st.munny)}<small>MUNNY</small></span><span title="Hearts released"><i class="kh-heart">❤</i>${fmt(st.hearts)}<small>HEARTS</small></span></div>
      </header>
      <div class="kh-grid">
        <aside class="kh-side">
          <div class="kh-cmd-title"><small>COMMAND</small></div>
          <nav class="kh-cmd">${tabs.map(([k, n, ic]) => `<button data-kh-tab="${k}" class="${this._khTab === k ? 'on' : ''}"><span class="kh-ic">${ic}</span><b>${n}</b>${KH_CHEVRON}</button>`).join('')}
            <button data-kh-exit class="kh-exit"><span class="kh-ic">↩</span><b>Exit</b>${KH_CHEVRON}</button></nav>
          <div class="kh-party-win"><div class="kh-party"></div></div>
        </aside>
        <div class="kh-mainwrap">
          <div class="kh-main"><div class="kh-main-inner"></div></div>
          <div class="kh-info"><small>INFORMATION</small><p class="kh-info-text"></p></div>
        </div>
      </div>`;
    s.appendChild(page);
    if (!Screens._khIntroSeen) {
      Screens._khIntroSeen = true;
      const intro = el('div', 'kh-intro', '<i class="kh-intro-moon"></i><b>HALLOWEEN TOWN</b><small>Kingdom Hearts</small>');
      page.appendChild(intro); KHSnd.play('get', .5); setTimeout(() => intro.remove(), 2300);
    }
    const help = page.querySelector('.kh-info-text');
    this._khHelp = text => { help.textContent = text || ''; };
    page.querySelectorAll('[data-kh-tab]').forEach(b => {
      b.onmouseenter = () => KHSnd.play('move', .3);
      b.onclick = () => { KHSnd.play('select'); this._khTab = b.dataset.khTab; this.render(); };
    });
    page.querySelector('[data-kh-exit]').onclick = () => { KHSnd.play('back'); this._raidDossier = null; this.go('raid'); };
    this.khPartyPanel(page.querySelector('.kh-party'), this._khTab === 'story' ? this._khSel : KHEvent.current());
    const main = page.querySelector('.kh-main-inner');
    if (this._khTab === 'party') this.khPartyTab(main);
    else if (this._khTab === 'heartless') this.khHeartlessTab(main);
    else if (this._khTab === 'shop') this.khShopTab(main);
    else if (this._khTab === 'wood') this.khWoodTab(main);
    else if (this._khTab === 'classic') this.khClassicTab(main);
    else this.khStoryTab(main);
    if (this._khResult) { const r = this._khResult; this._khResult = null; this.khShowResult(r); }
  },

  khHover(node, text) {
    node.addEventListener('mouseenter', () => { KHSnd.play('move', .28); if (this._khHelp) this._khHelp(text); });
    node.addEventListener('focus', () => { if (this._khHelp) this._khHelp(text); });
  },

  /* HP-gauge party column (the Sora-face gauges from the KH2 HUD). */
  khPartyPanel(root, nodeIdx) {
    const n = KH_NODES[nodeIdx], roster = KHEvent.roster(nodeIdx);
    const lvl = n.type === 'battle' ? KHEvent.level(n, this._khMode || 'easy') : (KH_NODES[nodeIdx + 1] && KH_NODES[nodeIdx + 1].lv) || 45;
    root.innerHTML = roster.map(id => {
      const owned = Save.owns(id), h = owned ? Save.hero(id) : null;
      const lv = owned ? Math.max(h.level, Math.round(lvl * .8)) : lvl;
      return `<article class="kh-member"><div class="kh-face"><img src="${khPortrait(id)}" alt=""></div>
        <div class="kh-gauge-box"><b>${khName(id)}</b><div class="kh-gauge"><span>HP</span><u><s></s></u></div>
        <small><i>LV</i> ${lv}${owned ? '' : ' <em>LOAN</em>'}</small></div></article>`;
    }).join('');
  },

  /* ---------------- story ---------------- */
  khStoryTab(main) {
    const sel = this._khSel, list = el('div', 'kh-list');
    let chap = 0;
    KH_NODES.forEach((n, i) => {
      const open = KHEvent.unlocked(i), done = KHEvent.nodeDone(i), c = KHEvent.state().cleared[i] || {};
      if (n.type === 'story') chap++;
      const label = n.type === 'story' ? KH_STORY[n.scene].title : n.name;
      const row = el('button', 'kh-row' + (i === sel ? ' sel' : '') + (open ? '' : ' locked') + (n.type === 'story' ? ' story' : ' battle'));
      row.innerHTML = `<span class="kh-kind">${n.type === 'story' ? '📖' : '⚔'}</span><span class="kh-label">${open ? label : '? ? ?'}</span>
        <span class="kh-count">${n.type === 'story' ? (done ? 'SEEN' : open ? 'NEW' : '') : `<em class="${c.easy ? 'ok' : ''}">E</em><em class="${c.hard ? 'ok hard' : ''}">H</em>`}</span>${KH_CHEVRON}`;
      row.disabled = !open;
      this.khHover(row, open ? (n.type === 'story' ? `Story · Chapter ${chap}. ${done ? 'Replay this scene.' : 'Watch to unlock the next battle.'}` : `Battle · ${n.name}. Recommended LV ${n.lv} (Easy) / ${KHEvent.level(n, 'hard')} (Hard).`) : 'Clear the previous stage to unlock.');
      row.onclick = () => {
        if (!open) { Sound.play('ui_err'); return; }
        KHSnd.play('select');
        if (this._khSel === i && n.type === 'story') { this.khPlayScene(i); return; }
        this._khSel = i; this.render();
      };
      list.appendChild(row);
    });
    main.appendChild(list);
    const n = KH_NODES[sel], detail = el('div', 'kh-detail');
    if (n.type === 'story') {
      const sc = KH_STORY[n.scene];
      detail.innerHTML = `<h3>${sc.title}</h3><p>${KHEvent.nodeDone(sel) ? 'Seen. Replay any time.' : 'Story scene · unlocks the next battle.'}</p><button class="kh-btn kh-go">${KH_CHEVRON}<span>${KHEvent.nodeDone(sel) ? 'Replay' : 'Watch'}</span></button>`;
      detail.querySelector('.kh-go').onclick = () => { KHSnd.play('select'); this.khPlayScene(sel); };
    } else this.khBattleDetail(detail, sel);
    main.appendChild(detail);
    if (this._khHelp) this._khHelp(n.type === 'story' ? 'Story scene. Watch it to unlock the next battle.' : `${n.name}: Easy LV ${n.lv}, Hard LV ${KHEvent.level(n, 'hard')}. Only the visiting Toons and the Kingdom Hearts cast can fight here.`);
    requestAnimationFrame(() => { const r = list.querySelector('.sel'); if (r) list.scrollTop = r.offsetTop - list.clientHeight / 2; });
  },

  khBattleDetail(detail, i) {
    const n = KH_NODES[i], c = KHEvent.state().cleared[i] || {};
    const mode = this._khMode = c.easy ? (this._khMode || 'easy') : 'easy';
    const waves = mode === 'hard' ? n.hard : n.easy, foes = {};
    waves.flat().forEach(([id, count, kind, name]) => { const k = name || id; foes[k] = foes[k] || { id, count: 0, kind, name: name || khName(id) }; foes[k].count += count; });
    const first = !c[mode], shards = first ? KHEvent.firstClearShards(n) : [];
    detail.innerHTML = `<h3>${n.name}</h3>
      <div class="kh-modes">${['easy', 'hard'].map(m => `<button data-mode="${m}" class="${mode === m ? 'on' : ''}" ${m === 'hard' && !c.easy ? 'disabled' : ''}>${m === 'easy' ? 'Easy' : 'Hard'} <small>LV ${KHEvent.level(n, m)}</small>${c[m] ? ' ✓' : ''}</button>`).join('')}</div>
      <p class="kh-sub">${waves.length} waves</p>
      <ul class="kh-enemies">${Object.values(foes).map(f => `<li data-enemy="${f.id}"><img src="${f.id === 'TwistedDandy' ? Art.twisted('Dandy') : khPortrait(f.id)}" alt=""><span>${f.name}${f.kind === 'boss' ? ' <i>BOSS</i>' : f.kind === 'elite' ? ' <i>ELITE</i>' : ''}</span><b>×${f.count}</b></li>`).join('')}</ul>
      <p class="kh-reward"><i class="kh-munny"></i> Munny <em>${fmt(KHEvent.munnyReward(n, mode, first))}</em>${first ? ' · first clear' : ''}${shards.length ? ' · ' + shards.map(h => khName(h.id)).join(', ') + ' shards' : ''}</p>
      <button class="kh-btn kh-go">${KH_CHEVRON}<span>Fight</span></button>`;
    detail.querySelectorAll('[data-mode]').forEach(b => b.onclick = () => { if (b.disabled) { Sound.play('ui_err'); return; } KHSnd.play('select'); this._khMode = b.dataset.mode; this.render(); });
    detail.querySelectorAll('[data-enemy]').forEach(li => {
      const id = li.dataset.enemy, h = HEROES[id];
      this.khHover(li, KH_HEARTLESS[id] || (h && h.blurb) || '');
      if (h) li.onclick = () => this.khKit(h.id, { level: KHEvent.level(n, mode), skillLv: KHEvent.level(n, mode) });
    });
    if (!c.easy) this.khHover(detail.querySelector('[data-mode="hard"]'), 'Clear Easy first to open Hard mode.');
    detail.querySelector('.kh-go').onclick = () => { KHSnd.play('select'); this.khTeamSetup(i, mode); };
  },

  khTeamSetup(i, mode) {
    const n = KH_NODES[i], roster = KHEvent.roster(i), st = KHEvent.state(), max = Math.min(5, roster.length);
    let team = (st.lastTeam || []).filter(id => roster.includes(id));
    (n.join || []).forEach(id => { if (roster.includes(id) && !team.includes(id)) team.unshift(id); });
    roster.forEach(id => { if (team.length < max && !team.includes(id)) team.push(id); });
    team = team.slice(0, max);
    const body = el('div', 'kh-team');
    const draw = () => {
      const lvl = KHEvent.level(n, mode);
      body.innerHTML = `<p class="kh-sub">Choose up to ${max}. Friends you have not recruited join as event loans at LV ${lvl}.</p>
        <div class="kh-team-grid">${roster.map(id => {
          const on = team.includes(id), owned = Save.owns(id);
          return `<button data-id="${id}" class="${on ? 'on' : ''}"><img src="${khPortrait(id)}" alt=""><b>${khName(id)}</b><small>${owned ? 'LV ' + Math.max(Save.hero(id).level, Math.round(lvl * .8)) : 'LOAN · LV ' + lvl}</small></button>`;
        }).join('')}</div>
        <div class="kh-team-foot"><span>${team.length} / ${max}</span><button class="kh-btn kh-kits">Skills</button><button class="kh-btn kh-go">${KH_CHEVRON}<span>Begin</span></button></div>`;
      body.querySelectorAll('[data-id]').forEach(b => b.onclick = () => {
        const id = b.dataset.id;
        if (team.includes(id)) team = team.filter(x => x !== id);
        else if (team.length < max) team.push(id);
        else { Sound.play('ui_err'); return; }
        KHSnd.play('move'); draw();
      });
      body.querySelector('.kh-kits').onclick = () => { const id = team[0] || roster[0]; this.khKit(id, KHEvent.spec(id, lvl)); };
      body.querySelector('.kh-go').onclick = () => {
        if (!team.length) { Sound.play('ui_err'); return; }
        st.lastTeam = team.slice(); Save.write(); UI.closeModal({ skipHook: true });
        this.khFight(i, mode, team);
      };
    };
    draw();
    UI.modal(`${n.name} · ${mode === 'hard' ? 'Hard' : 'Easy'}`, body, { className: 'kh-modal' });
  },

  khFight(i, mode, ids) {
    const n = KH_NODES[i];
    const run = { wave: 0, team: KHEvent.team(i, ids, mode), battles: [] };
    if (!run.team.length) { UI.toast('Set a team first'); return; }
    const total = KHEvent.waves(n, mode), first = !(KHEvent.state().cleared[i] || {})[mode], level = KHEvent.level(n, mode);
    const rewards = masteryRewardBundle({ ichor: Math.round(1300 + level * 17), exp: Math.round(950 + level * 11), star: 42 + Math.round(level * .3), manual: 4 + Math.round(level / 40) });
    const launchWave = () => {
      Art.forceSkin = { Sora: [3, 5, 7, 9, 11, 13].includes(i) };
      const w = run.wave, final = w === total - 1, foes = KHEvent.wave(n, mode, w);
      let battle = null;
      battle = BattleScreen.launch({
        team: run.team, foes, music: KHEvent.musicFor(n, foes), meta: KHEvent.meta(n, mode, w, i),
        rewards: final ? () => rewards : () => ({}), skipResults: !final,
        onDone: res => {
          $('#battle').classList.remove('kh-battle'); Art.forceSkin = null;
          if (battle) run.battles.push(battle);
          if (res.quit || !res.win) {
            const hearts = KHEvent.heartsReleased(run.battles);
            KHEvent.state().hearts += hearts; Save.write();
            if (!res.quit) this._khResult = { lose: true, wave: w + 1, hearts };
            this._raidDossier = KH_EVENT.id; this.render(); return;
          }
          if (!final) {
            const hp = {};
            battle.units.filter(u => u.team === TEAM_P && !u.minion).forEach(u => { hp[u.id] = u.alive ? u.hpPct : 0; });
            run.team = run.team.filter(sp => hp[sp.id] > 0).map(sp => Object.assign({}, sp, { carryHp: Math.min(1, hp[sp.id] + .15) }));
            run.wave++; UI.toast(`Wave ${w + 1} cleared`); launchWave(); return;
          }
          const st = KHEvent.state(), munny = KHEvent.munnyReward(n, mode, first), hearts = KHEvent.heartsReleased(run.battles);
          st.munny += munny; st.hearts += hearts;
          const heroShards = first ? KHEvent.firstClearShards(n) : [];
          heroShards.forEach(h => Save.giveShards(h.id, h.amount, true));
          KHEvent.markDone(i, mode);
          const owned = ids.filter(id => Save.owns(id));
          if (owned.length) payoutBattle(owned, rewards, { mastery: 155 + Math.round(level / 2), pass: 85 + Math.round(level / 4) });
          Save.write();
          if (KH_NODES[i + 1]) this._khSel = i + 1;
          this._khResult = { win: true, munny, hearts, heroShards, mode, name: n.name };
          this._raidDossier = KH_EVENT.id; this.render();
        }
      });
      if (battle) {
        $('#battle').classList.add('kh-battle');
        setTimeout(() => { if (battle.running !== false && !battle.over) KHFX.banner(battle, foes.some(f => f.kind === 'boss') ? 'Boss Heartless!' : (w === 0 ? 'Heartless Detected' : 'Wave ' + (w + 1)), 'enemy'); }, 1400);
      }
    };
    launchWave();
  },

  khShowResult(r) {
    const body = el('div', 'kh-result');
    body.innerHTML = `${r.win ? `<h3>Victory · ${r.name}</h3><p><i class="kh-munny"></i> Gained <em>${fmt(r.munny)}</em> Munny</p>` : '<h3>Defeat</h3><p>The Heartless held the line at wave ' + r.wave + '.</p>'}
      <p><span class="kh-heart">❤</span> Hearts released <em>${fmt(r.hearts)}</em></p>
      ${(r.heroShards || []).length ? `<ul class="kh-drops">${r.heroShards.map(h => `<li><img src="${khPortrait(h.id)}" alt=""><span>${khName(h.id)} Shards</span><b>×${h.amount}</b></li>`).join('')}</ul>` : ''}`;
    if (r.win) KHSnd.play('get');
    UI.modal(r.win ? 'Results' : 'Defeat', body, { className: 'kh-modal' });
  },

  /* ---------------- party / bestiary / shop / classic ---------------- */
  khPartyTab(main) {
    const joined = KHEvent.joined(KHEvent.current());
    main.innerHTML = `<div class="kh-list kh-cast">${KH_PARTY.map(id => {
      const owned = Save.owns(id), known = joined.has(id) || owned, h = HEROES[id];
      return `<button class="kh-row${known ? '' : ' locked'}" data-id="${id}" ${known ? '' : 'disabled'}><img src="${khPortrait(id)}" alt=""><span class="kh-label">${known ? khName(id) : '? ? ?'}${known ? `<small>${h.roleLabel || h.role}</small>` : ''}</span><span class="kh-count">${owned ? 'OWNED' : known ? 'LOAN' : ''}</span>${KH_CHEVRON}</button>`;
    }).join('')}</div>`;
    main.querySelectorAll('[data-id]').forEach(b => {
      const h = HEROES[b.dataset.id];
      this.khHover(b, b.disabled ? 'Not met yet.' : h.blurb);
      b.onclick = () => { if (b.disabled) return; KHSnd.play('select'); this.khKit(h.id, Save.owns(h.id) ? playerSpec(h.id) : KHEvent.spec(h.id, 60)); };
    });
  },

  khHeartlessTab(main) {
    this._khBeast = this._khBeast || KH_ENEMY_IDS[0];
    const list = el('div', 'kh-list kh-cast');
    KH_ENEMY_IDS.forEach(id => {
      const row = el('button', 'kh-row' + (id === this._khBeast ? ' sel' : ''));
      row.innerHTML = `<img src="${khPortrait(id)}" alt=""><span class="kh-label">${khName(id)}</span><span class="kh-count">${HEROES[id].role === 'Support' ? 'SUPPORT' : 'HEARTLESS'}</span>${KH_CHEVRON}`;
      this.khHover(row, KH_HEARTLESS[id]);
      row.onclick = () => { KHSnd.play('select'); this._khBeast = id; this.render(); };
      list.appendChild(row);
    });
    main.appendChild(list);
    const id = this._khBeast, h = HEROES[id], d = el('div', 'kh-detail kh-beast');
    d.innerHTML = `<div class="kh-beast-art"><img src="${khPortrait(id)}" alt=""></div><h3>${h.name}</h3><p class="kh-lore">${KH_HEARTLESS[id]}</p>
      <ul class="kh-skillnames">${SKILL_ORDER.filter(k => h.skills[k]).map(k => `<li style="--rc:${RARITY_COLORS[SKILL_RARITY[k]]}"><i></i>${h.skills[k].name}</li>`).join('')}</ul>
      <button class="kh-btn kh-kits">${KH_CHEVRON}<span>Abilities</span></button>`;
    d.querySelector('.kh-kits').onclick = () => { KHSnd.play('select'); this.khKit(id, { level: 100, skillLv: 80 }); };
    main.appendChild(d);
    if (this._khHelp) this._khHelp(KH_HEARTLESS[id]);
  },

  khShopTab(main) {
    const st = KHEvent.state();
    main.innerHTML = `<div class="kh-list kh-shop">${KH_SHOP.map(o => {
      const owned = Save.owns(o.id), h = owned ? Save.hero(o.id) : null, cost = Progress.starCost ? Progress.starCost(o.id) : null;
      const prog = owned ? (h.stars >= 5 ? 'MAX ⭐' : `${h.stars}⭐ · ${fmt(h.shards)}/${fmt(cost ? cost.shards : 100)}`) : `${fmt(Save.pending(o.id))}/${fmt(Save.unlockNeed(o.id))} to recruit`;
      return `<div class="kh-row" data-id="${o.id}"><img src="${khPortrait(o.id)}" alt=""><span class="kh-label">${khName(o.id)}<small>Shards ×${o.amount} · ${prog}</small></span><button class="kh-btn" ${st.munny < o.cost * o.amount || (h && h.stars >= 5) ? 'disabled' : ''}>${fmt(o.cost * o.amount)} <i class="kh-munny"></i></button></div>`;
    }).join('')}</div><p class="kh-sub">Earn Munny from every battle. Hard mode pays double. The Halloween Town friends can only be recruited here.</p>`;
    main.querySelectorAll('[data-id]').forEach(row => {
      const id = row.dataset.id; this.khHover(row, HEROES[id].blurb);
      row.querySelector('button').onclick = () => {
        const out = KHEvent.buy(id);
        if (!out.ok) { Sound.play('ui_err'); UI.toast(out.reason); return; }
        KHSnd.play('get'); if (out.res === 'new') UI.toast(`${khName(id)} joined your roster!`);
        this.render();
      };
    });
  },

  khClassicTab(main) {
    const old = Raid.events().find(e => e.isKHClassic), done = old ? Raid.stageProgress(old.id) : 0, total = old ? Raid.stageCount(old) : 0;
    main.innerHTML = `<div class="kh-detail kh-classic"><div class="kh-classic-art">${['Riku', 'Sora', 'Kairi'].map(id => `<img src="${khPortrait(id)}" alt="">`).join('')}</div>
      <h3>The Door Opens</h3><p class="kh-lore">The original Kingdom Hearts challenge. Three Keyblade wielders crossed into Gardenview. Survive their full team for five minutes, or defeat all three before time runs out.</p>
      <p class="kh-sub">${done} / ${total} stages cleared · five-minute endurance · Event Tokens</p>
      <button class="kh-btn kh-go">${KH_CHEVRON}<span>Enter the Classic Challenge</span></button></div>`;
    main.querySelector('.kh-go').onclick = () => { KHSnd.play('select'); if (old) { this._raidDossier = old.id; this.render(); } };
    if (this._khHelp) this._khHelp('The original Door Opens endurance event lives on, in its new coat of paint.');
  },

  khKit(id, spec) {
    const body = el('div', 'kh-kit'), h = HEROES[id], lv = spec ? (spec.skillLv || spec.level || 30) : 30;
    body.innerHTML = `<header><img src="${khPortrait(id)}" alt=""><p>${h.blurb || ''}</p></header>`;
    SKILL_ORDER.forEach(key => {
      const skill = h.skills[key]; if (!skill) return;
      const desc = typeof SkillDesc !== 'undefined' ? SkillDesc.format(id, key, skill, lv, spec) : (typeof skill.desc === 'function' ? skill.desc(skill.v, skill.p) : '');
      body.appendChild(el('article', 'kh-skill', `<small style="color:${RARITY_COLORS[SKILL_RARITY[key]]}">${RARITY_NAMES[SKILL_RARITY[key]].toUpperCase()} · ${skill.type}</small><h4>${skill.name}</h4><div class="sk-desc-root sk-mode-both">${desc}</div>`));
    });
    UI.modal(h.name, body, { className: 'kh-modal' });
  },

  /* ============================================================ VISUAL NOVEL */
  khBustNode(id) {
    const gif = KH_VN_GIF[id], art = khPortrait(id);
    const cls = 'kh-bust ' + (KH_ART[id] && !gif ? 'kh-pix ' : gif ? 'kh-pix kh-gif ' : 'toon ') + 'b-' + id.toLowerCase();
    const node = el('div', cls);
    const vnArt = id === 'Sora' && this._khHalloween ? KH_VN_ART.SoraHalloween : KH_VN_ART[id];
    if (vnArt) { node.className = 'kh-bust kh-art-bust b-' + id.toLowerCase(); const img = el('img', ''); img.src = ASSET + vnArt; img.alt = khName(id); node.appendChild(img); node.appendChild(el('span', 'kh-emote')); return node; }
    const strip = KH_ATLAS[{ Sora: 'sora-idle', Goofy: 'goofy-idle', Riku: 'riku-idle', Kairi: 'kairi-idle' }[id]];
    if (strip && !gif) {
      const f = el('div', 'kh-strip'); f.style.aspectRatio = `${strip.cellW} / ${strip.cellH}`;
      f.style.backgroundImage = `url("${ASSET}${strip.src}")`; f.style.backgroundSize = `${strip.n * 100}% 100%`;
      let k = 0; const t = setInterval(() => { if (!f.isConnected && k > 2) { clearInterval(t); return; } k = (k + 1) % strip.n; f.style.backgroundPosition = `${strip.n > 1 ? k / (strip.n - 1) * 100 : 0}% 0`; }, 170);
      node.appendChild(f);
    } else { const img = el('img', ''); img.src = gif ? ASSET + gif : art; img.alt = khName(id); node.appendChild(img); }
    node.appendChild(el('span', 'kh-emote'));
    return node;
  },

  khPlayScene(i) {
    const standalone = typeof i === 'string';
    const n = standalone ? null : KH_NODES[i], scene = KH_STORY[standalone ? i : n.scene];
    if (!scene) return;
    document.querySelectorAll('.kh-vn').forEach(x => x.remove());
    const vn = el('div', 'kh-vn');
    vn.innerHTML = `<div class="kh-vn-bg"></div><div class="kh-vn-fx"></div><div class="kh-vn-stage"></div>
      <div class="kh-vn-box"><b class="kh-vn-name"></b><p class="kh-vn-text"></p><i class="kh-vn-next">▼</i></div>
      <div class="kh-vn-card"></div><button class="kh-vn-skip" type="button">Skip »</button>`;
    document.body.appendChild(vn);
    const bg = vn.querySelector('.kh-vn-bg'), stage = vn.querySelector('.kh-vn-stage'), fx = vn.querySelector('.kh-vn-fx');
    const box = vn.querySelector('.kh-vn-box'), nameEl = vn.querySelector('.kh-vn-name'), textEl = vn.querySelector('.kh-vn-text'), card = vn.querySelector('.kh-vn-card');
    this._khHalloween = !!scene.halloween;
    const cast = {}, narrow = innerWidth < 600;
    const slots = narrow ? { farleft: 14, left: 30, center: 50, right: 70, farright: 86 } : { farleft: 10, left: 28, center: 50, right: 72, farright: 90 };
    let at = 0, typing = null, full = '', waiting = false, closed = false;
    const freeSlot = () => ['left', 'right', 'center', 'farleft', 'farright'].find(sl => !Object.values(cast).some(c => c.slot === sl)) || 'center';
    const enter = (who, slot) => {
      who = khCast(who);
      if (!KH_ART[who] && !KH_VN_ART[who] && !(FF7_VN_ART && FF7_VN_ART[who]) && who !== 'TwistedDandy') return null;
      slot = slot || (cast[who] && cast[who].slot) || freeSlot();
      let c = cast[who];
      if (!c) {
        // Keep the stage readable: the person who has been quiet longest steps out.
        const present = Object.keys(cast);
        if (present.length >= 4) exit(present.sort((a, b) => (cast[a].talkedAt || 0) - (cast[b].talkedAt || 0))[0]);
        const node = this.khBustNode(who); stage.appendChild(node);
        c = cast[who] = { node, slot }; node.style.left = slots[slot] + '%';
        requestAnimationFrame(() => node.classList.add('in'));
      }
      c.slot = slot; c.node.style.left = slots[slot] + '%';
      return c;
    };
    const exit = who => { who = khCast(who); const c = cast[who]; if (!c) return; delete cast[who]; c.node.classList.remove('in'); c.node.classList.add('out'); setTimeout(() => c.node.remove(), 400); };
    const effect = kind => {
      const retrig = c => { vn.classList.remove(c); void vn.offsetWidth; vn.classList.add(c); };
      if (kind === 'flash') retrig('flash');
      else if (kind === 'shake') { retrig('shake'); Sound.play('hit_blunt', { vol: .4 }); }
      else if (kind === 'night') vn.classList.add('night');
      else if (kind === 'day') vn.classList.remove('night', 'spooky', 'dark');
      else if (kind === 'spooky') vn.classList.add('spooky');
      else if (kind === 'heartless') { vn.classList.add('dark'); Sound.play('warn', { vol: .35 }); setTimeout(() => vn.classList.remove('dark'), 2600); }
      else if (kind === 'gleam') { retrig('gleam'); Sound.play('sparkle', { vol: .6 }); KHSnd.play('get'); }
      else if (kind === 'fog') { const f = el('div', 'kh-fog'); fx.appendChild(f); setTimeout(() => f.remove(), 9000); }
      else if (kind === 'hearts') {
        for (let k = 0; k < 16; k++) setTimeout(() => { const h = el('i', 'kh-rise', '❤'); h.style.left = rnd(8, 92) + '%'; h.style.fontSize = rnd(16, 38) + 'px'; h.style.animationDuration = rnd(2.4, 4.2) + 's'; fx.appendChild(h); setTimeout(() => h.remove(), 4400); }, k * 160);
      }
    };
    const emote = (c, key) => {
      const e = FF7_EMOTES[key]; if (!c || !e) return;
      const span = c.node.querySelector('.kh-emote');
      span.textContent = e.icon; span.className = 'kh-emote show e-' + key.replace(/[^a-z]/g, 'x');
      const sfx = KH_EMOTE_SFX[key] !== undefined ? KH_EMOTE_SFX[key] : e.sfx;
      if (sfx) Sound.play(sfx, { vol: .4, throttle: 60 });
      clearTimeout(c.emoteT); c.emoteT = setTimeout(() => { span.className = 'kh-emote'; }, 1500);
    };
    const anim = (c, a) => { if (!c || !a) return; c.node.classList.remove('a-' + c.lastAnim); void c.node.offsetWidth; c.lastAnim = a; c.node.classList.add('a-' + a); };
    const voice = (who, ch, idx) => {
      const v = KH_VOICE[khCast(who)]; if (!v) return;
      if (v.cue && idx === 0) Sound.play(v.cue, { vol: .5, throttle: 200 });
      if (v.tick && idx % 3 === 0 && /\S/.test(ch)) Sound.play(v.tick, { vol: who === 'Dandy' ? .35 : .16, rate: (v.rate || 1) * rnd(.95, 1.05), throttle: 40 });
    };
    const type = (who, text) => {
      full = text; textEl.textContent = ''; let k = 0; vn.classList.remove('can-next'); clearInterval(typing);
      typing = setInterval(() => {
        k++; textEl.textContent = full.slice(0, k); voice(who, full[k - 1] || '', k - 1);
        if (k >= full.length) { clearInterval(typing); typing = null; vn.classList.add('can-next'); }
      }, 24);
    };
    const finish = () => {
      if (closed) return; closed = true; clearInterval(typing); vn.classList.add('closing'); Music.clearDuck(true);
      setTimeout(() => vn.remove(), 450);
      if (standalone) { KHEvent.woodState().seen = true; Save.write(); Music.play('khEscapade'); this._khTab = 'wood'; this.render(); return; }
      const first = !KHEvent.nodeDone(i), rew = first ? KHEvent.storyReward(i) : null;
      KHEvent.markDone(i, 'story');
      if (rew) UI.toast(`Chapter complete · +${rew.munny} Munny`);
      if (first && i === KH_NODES.length - 1) setTimeout(() => UI.toast('🎃 Sora\u2019s Halloween Town costume unlocked: equip it in his Gear tab'), 1200);
      if (KH_NODES[i + 1]) this._khSel = i + 1;
      Music.play('khMenu'); this.render();
    };
    const step = () => {
      if (closed) return;
      while (at < scene.script.length) {
        const line = scene.script[at++];
        if (line[0] === '@') {
          const [cmd, ...rest] = line.slice(1).split(' '), arg = rest.join(' ');
          if (cmd === 'bg') bg.style.backgroundImage = `url("${ASSET}${KH_BG[arg] || arg}")`;
          else if (cmd === 'music') Music.play(KH_MUSIC[arg] || arg);
          else if (cmd === 'enter') enter(rest[0], rest[1]);
          else if (cmd === 'exit') exit(arg);
          else if (cmd === 'exitall') Object.keys(cast).forEach(exit);
          else if (cmd === 'fx') effect(arg);
          else if (cmd === 'sfx') { if (arg === 'surprise') Sound.play('warn', { vol: .5 }); else if (arg === 'happy') KHSnd.play('small'); else if (arg === 'drama') KHSnd.play('get', .5); }
          else if (cmd === 'title') {
            card.textContent = arg; card.classList.remove('show'); void card.offsetWidth; card.classList.add('show');
            box.classList.add('hide'); Sound.play('ult', { vol: .4 });
            waiting = true; setTimeout(() => { waiting = false; box.classList.remove('hide'); step(); }, 2000);
            return;
          }
          continue;
        }
        Object.values(cast).forEach(c => c.node.classList.remove('talk'));
        if (line[0] === '>') { box.classList.add('narrate'); nameEl.textContent = ''; type(null, line.slice(1).trim()); Object.values(cast).forEach(c => c.node.classList.add('dim')); return; }
        const m = line.match(/^([A-Za-z]+)\s*(?:\[([^\]]+)\])?\s*(?:\(([^)]+)\))?\s*:\s*(.*)$/);
        if (!m) continue;
        const [, who, emo, an, text] = m;
        box.classList.remove('narrate'); nameEl.textContent = khName(who);
        nameEl.className = 'kh-vn-name' + (KH_NEW_HERO_IDS.includes(khCast(who)) || ['Sora', 'Goofy'].includes(who) ? ' kh' : who === 'TwistedDandy' ? ' dark' : ' toon');
        const c = cast[khCast(who)] || enter(who);
        Object.entries(cast).forEach(([k, x]) => x.node.classList.toggle('dim', k !== khCast(who)));
        if (c) { c.node.classList.add('talk'); c.talkedAt = performance.now(); emote(c, emo); anim(c, an || 'nod'); }
        type(who, text); return;
      }
      finish();
    };
    const advance = () => {
      if (closed || waiting) return;
      if (typing) { clearInterval(typing); typing = null; textEl.textContent = full; vn.classList.add('can-next'); return; }
      KHSnd.play('move', .25); step();
    };
    vn.addEventListener('click', e => { if (e.target.closest('.kh-vn-skip')) return; advance(); });
    vn.querySelector('.kh-vn-skip').onclick = () => { KHSnd.play('back'); finish(); };
    const key = e => {
      if (closed) { document.removeEventListener('keydown', key); return; }
      if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); advance(); }
      else if (e.key === 'Escape') finish();
    };
    document.addEventListener('keydown', key);
    step();
  }
});
