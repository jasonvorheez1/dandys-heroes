/* ff7.js - the Final Fantasy VII event screen and its visual novel.
   Everything here is dressed as the 1997 PlayStation menus: gradient blue
   windows with bevelled frames, a pointing-glove cursor, and right-aligned
   ": 99" counts. */
'use strict';

const FF7_EMOTES = {
  '!': { icon: '!', sfx: 'warn' }, '?': { icon: '?', sfx: 'ui_move' }, anger: { icon: '💢', sfx: 'shrink2' },
  sweat: { icon: '💧', sfx: 'pop2' }, note: { icon: '♪', sfx: 'sparkle' }, heart: { icon: '❤', sfx: 'sparkle' },
  idea: { icon: '💡', sfx: 'ult_ready' }, dots: { icon: '…', sfx: null }, tears: { icon: '😢', sfx: 'down' },
  sparkle: { icon: '✨', sfx: 'sparkle' }, shock: { icon: '‼', sfx: 'warn' }, blush: { icon: '///', sfx: 'pop2' }
};
const FF7_VOICE = {
  Vee: { cue: 'hero_vee_talk' }, Bassie: { cue: 'hero_bassie_talk' }, Bobette: { cue: 'hero_bobette_talk' }, Shelly: { cue: 'hero_shelly_talk' },
  Dandy: { tick: 'dandy_text' }, Gigi: { tick: 'dandy_text_bright', rate: 1.35 },
  Tifa: { tick: 'ui_move', rate: 1.1 }, Cloud: { tick: 'ui_move', rate: .85 }, Aerith: { tick: 'ui_move', rate: 1.2 }, CaitSith: { tick: 'ui_move', rate: 1.35 },
  Barret: { tick: 'ui_move', rate: .7 }, Sephiroth: { tick: 'ui_move', rate: .6 }, Waxwell: { tick: 'ui_move', rate: 1.15 }
};
const FF7_BG = { station: 'station', wonder: 'wonder', ghost: 'ghost', speed: 'speed', battle: 'battle', outside: 'outside' };
const FF7_MUSIC = { goldsaucer: 'ff7Menu', caitsith: 'ff7Cait', drama: 'ff7Drama', battle: 'ff7Battle' };
const FF7_GLOVE = '<i class="ff7-glove" aria-hidden="true"></i>';

function ff7Win(cls, html) { return `<section class="ff7-win ${cls || ''}">${html}</section>`; }
function ff7Name(id) { return FF7_NAMES[id] || (HEROES[id] ? HEROES[id].name : id); }
function ff7Portrait(id) { return FF7_VN_ART[id] ? ASSET + FF7_VN_ART[id] : Art.icon(id); }

Object.assign(Screens, {
  ff7Event(s, ev) {
    const st = FF7Event.state();
    this._ff7Tab = this._ff7Tab || 'sequence';
    if (this._ff7Sel == null || !FF7Event.unlocked(this._ff7Sel)) this._ff7Sel = FF7Event.current();
    const page = el('section', 'ff7-event');
    page.dataset.music = 'ff7Menu';
    const tabs = [['sequence', 'Sequence'], ['party', 'Party'], ['materia', 'Materia'], ['shop', 'Shop']];
    page.innerHTML = `
      <div class="ff7-top">
        ${ff7Win('ff7-commands', `<nav>${tabs.map(([k, n]) => `<button data-ff7-tab="${k}" class="${this._ff7Tab === k ? 'on' : ''}">${this._ff7Tab === k ? FF7_GLOVE : ''}<span>${n}</span></button>`).join('')}<button data-ff7-exit class="ff7-exit"><span>Exit</span></button></nav>`)}
        ${ff7Win('ff7-place', `<b>Gold Saucer</b><small>Gil <em>${fmt(st.gil)}</em></small>`)}
      </div>
      ${ff7Win('ff7-help', '<p class="ff7-help-text"></p>')}
      <div class="ff7-body">
        ${ff7Win('ff7-party-win', '<div class="ff7-party"></div>')}
        ${ff7Win('ff7-main', '<div class="ff7-main-inner"></div>')}
      </div>`;
    s.appendChild(page);
    const help = page.querySelector('.ff7-help-text');
    this._ff7Help = text => { help.textContent = text || ''; };
    page.querySelectorAll('[data-ff7-tab]').forEach(b => {
      b.onmouseenter = () => Sound.play('ff7_cursor_move', { vol: .35, throttle: 40 });
      b.onclick = () => { Sound.play('ff7_cursor_accept'); this._ff7Tab = b.dataset.ff7Tab; this.render(); };
    });
    page.querySelector('[data-ff7-exit]').onclick = () => { Sound.play('ui_back'); this._raidDossier = null; this.go('raid'); };
    this.ff7PartyPanel(page.querySelector('.ff7-party'), this._ff7Tab === 'sequence' ? this._ff7Sel : FF7Event.current());
    const main = page.querySelector('.ff7-main-inner');
    if (this._ff7Tab === 'party') this.ff7PartyTab(main);
    else if (this._ff7Tab === 'materia') this.ff7MateriaTab(main);
    else if (this._ff7Tab === 'shop') this.ff7ShopTab(main);
    else this.ff7SequenceTab(main);
    if (this._ff7Result) { const r = this._ff7Result; this._ff7Result = null; this.ff7ShowResult(r); }
  },

  ff7Hover(node, text) {
    node.addEventListener('mouseenter', () => { Sound.play('ff7_cursor_move', { vol: .3, throttle: 40 }); if (this._ff7Help) this._ff7Help(text); });
    node.addEventListener('focus', () => { if (this._ff7Help) this._ff7Help(text); });
  },

  ff7PartyPanel(root, nodeIdx) {
    const n = FF7_NODES[nodeIdx];
    const roster = FF7Event.roster(nodeIdx);
    const lvl = n.type === 'battle' ? FF7Event.level(n, this._ff7Mode || 'easy') : (FF7_NODES[nodeIdx + 1] && FF7_NODES[nodeIdx + 1].lv) || 40;
    const missing = (n.missing || []);
    root.innerHTML = roster.concat(missing).map(id => {
      const owned = Save.owns(id), h = owned ? Save.hero(id) : null;
      const lv = owned ? Math.max(h.level, Math.round(lvl * .8)) : lvl;
      const lost = missing.includes(id);
      return `<article class="ff7-member${lost ? ' lost' : ''}"><img src="${ff7Portrait(id)}" alt=""><div><b>${ff7Name(id)}</b>
        <p><span class="ff7-lv">LV</span> ${lv}${owned ? '' : ' <i class="ff7-loan">LOAN</i>'}</p>
        <p><span class="ff7-hp">HP</span> <u><s style="width:${lost ? 0 : 100}%"></s></u></p>
        ${lost ? '<p class="ff7-status">Missing…</p>' : ''}</div></article>`;
    }).join('');
  },

  ff7SequenceTab(main) {
    const sel = this._ff7Sel;
    const list = el('div', 'ff7-list');
    let chap = 0;
    FF7_NODES.forEach((n, i) => {
      const open = FF7Event.unlocked(i), done = FF7Event.nodeDone(i), c = FF7Event.state().cleared[i] || {};
      if (n.type === 'story') chap++;
      const label = n.type === 'story' ? FF7_STORY[n.scene].title : n.name;
      const row = el('button', 'ff7-row' + (i === sel ? ' sel' : '') + (open ? '' : ' locked') + (n.type === 'story' ? ' story' : ' battle'));
      row.innerHTML = `${i === sel ? FF7_GLOVE : ''}<span class="ff7-kind">${n.type === 'story' ? '📖' : '⚔️'}</span><span class="ff7-label">${open ? label : '? ? ?'}</span>
        <span class="ff7-count">${n.type === 'story' ? (done ? 'SEEN' : open ? 'NEW' : '') : `<em class="${c.easy ? 'ok' : ''}">E</em><em class="${c.hard ? 'ok hard' : ''}">H</em>`}</span>`;
      row.disabled = !open;
      this.ff7Hover(row, open ? (n.type === 'story' ? `Story · Chapter ${chap}. ${done ? 'Replay this scene.' : 'Watch to unlock the next battle.'}` : `Battle · ${n.name}. Recommended LV ${n.lv} (Easy) / ${FF7Event.level(n, 'hard')} (Hard).`) : 'Clear the previous stage to unlock.');
      row.onclick = () => {
        if (!open) { Sound.play('ui_err'); return; }
        Sound.play('ff7_cursor_accept');
        if (this._ff7Sel === i && n.type === 'story') { this.ff7PlayScene(i); return; }
        this._ff7Sel = i; this.render();
      };
      list.appendChild(row);
    });
    main.appendChild(list);
    const n = FF7_NODES[sel];
    const detail = el('div', 'ff7-detail');
    if (n.type === 'story') {
      const sc = FF7_STORY[n.scene];
      detail.innerHTML = `<h3>${sc.title}</h3><p>${FF7Event.nodeDone(sel) ? 'Seen. Replay any time.' : 'Story stage · unlocks the next battle.'}</p><button class="ff7-btn ff7-go">${FF7_GLOVE}<span>${FF7Event.nodeDone(sel) ? 'Replay' : 'Watch'}</span></button>`;
      detail.querySelector('.ff7-go').onclick = () => { Sound.play('ff7_cursor_accept'); this.ff7PlayScene(sel); };
    } else this.ff7BattleDetail(detail, sel);
    main.appendChild(detail);
    if (this._ff7Help) this._ff7Help(n.type === 'story' ? 'Story stage. Watch it to unlock the next battle.' : `${n.name}: Easy LV ${n.lv}, Hard LV ${FF7Event.level(n, 'hard')}. Only the visiting Toons and the FF7 party can fight here.`);
    requestAnimationFrame(() => { const r = list.querySelector('.sel'); if (r) list.scrollTop = r.offsetTop - list.clientHeight / 2; });
  },

  ff7BattleDetail(detail, i) {
    const n = FF7_NODES[i], c = FF7Event.state().cleared[i] || {};
    const mode = this._ff7Mode = c.easy ? (this._ff7Mode || 'easy') : 'easy';
    const waves = mode === 'hard' ? n.hard : n.easy;
    const foes = {};
    waves.flat().forEach(([id, count, kind, name]) => { const k = name || id; foes[k] = foes[k] || { id, count: 0, kind, name: name || HEROES[id].name }; foes[k].count += count; });
    const first = !c[mode];
    detail.innerHTML = `<h3>${n.name}</h3>
      <div class="ff7-modes">${['easy', 'hard'].map(m => `<button data-mode="${m}" class="${mode === m ? 'on' : ''}" ${m === 'hard' && !c.easy ? 'disabled' : ''}>${mode === m ? FF7_GLOVE : ''}${m === 'easy' ? 'Easy' : 'Hard'} <small>LV ${FF7Event.level(n, m)}</small>${c[m] ? ' ✓' : ''}</button>`).join('')}</div>
      <p class="ff7-sub">${waves.length} waves${n.only ? ' · only ' + n.only.map(ff7Name).join(' & ') : ''}${n.missing ? ' · ' + n.missing.map(ff7Name).join(', ') + ' is missing' : ''}</p>
      <ul class="ff7-enemies">${Object.values(foes).map(f => `<li data-enemy="${f.id}"><img src="${Art.hero(f.id)}" alt=""><span>${f.name}${f.kind === 'boss' ? ' <i>BOSS</i>' : f.kind === 'elite' ? ' <i>ELITE</i>' : ''}</span><b>: ${String(f.count).padStart(2, ' ')}</b></li>`).join('')}</ul>
      <p class="ff7-reward">Gil <em>${fmt(FF7Event.gilReward(n, mode, first))}</em>${first ? ' · first clear' : ''} · Materia Shards${first && FF7Event.firstClearShards(n).length ? ' · ' + FF7Event.firstClearShards(n).map(h => ff7Name(h.id)).join(', ') + ' shards' : ''}</p>
      <button class="ff7-btn ff7-go">${FF7_GLOVE}<span>Fight</span></button>`;
    detail.querySelectorAll('[data-mode]').forEach(b => b.onclick = () => { if (b.disabled) { Sound.play('ui_err'); return; } Sound.play('ff7_cursor_accept'); this._ff7Mode = b.dataset.mode; this.render(); });
    detail.querySelectorAll('[data-enemy]').forEach(li => {
      const h = HEROES[li.dataset.enemy];
      this.ff7Hover(li, h.blurb);
      li.onclick = () => this.ff7Kit(h.id, { level: FF7Event.level(n, mode), skillLv: FF7Event.level(n, mode) });
    });
    if (!c.easy) this.ff7Hover(detail.querySelector('[data-mode="hard"]'), 'Clear Easy first to open Hard mode.');
    detail.querySelector('.ff7-go').onclick = () => { Sound.play('ff7_cursor_accept'); this.ff7TeamSetup(i, mode); };
  },

  ff7TeamSetup(i, mode) {
    const n = FF7_NODES[i], roster = FF7Event.roster(i), st = FF7Event.state();
    const max = Math.min(5, roster.length);
    let team = (st.lastTeam || []).filter(id => roster.includes(id));
    if (n.only) team = roster.slice();
    // New allies are pulled into the lineup the first time they can fight.
    (n.join || []).forEach(id => { if (roster.includes(id) && !team.includes(id)) team.unshift(id); });
    roster.forEach(id => { if (team.length < max && !team.includes(id)) team.push(id); });
    team = team.slice(0, max);
    const body = el('div', 'ff7-team');
    const draw = () => {
      const lvl = FF7Event.level(n, mode);
      body.innerHTML = `<p class="ff7-sub">Choose up to ${max}. Unowned members join as event loans at LV ${lvl}.</p>
        <div class="ff7-team-grid">${roster.map(id => {
          const on = team.includes(id), owned = Save.owns(id);
          return `<button data-id="${id}" class="${on ? 'on' : ''}" ${n.only ? 'disabled' : ''}>${on ? FF7_GLOVE : ''}<img src="${ff7Portrait(id)}" alt=""><b>${ff7Name(id)}</b><small>${owned ? 'LV ' + Math.max(Save.hero(id).level, Math.round(lvl * .8)) : 'LOAN · LV ' + lvl}</small></button>`;
        }).join('')}</div>
        <div class="ff7-team-foot"><span>${team.length} / ${max}</span><button class="ff7-btn ff7-kits">Skills</button><button class="ff7-btn ff7-go">${FF7_GLOVE}<span>Begin</span></button></div>`;
      body.querySelectorAll('[data-id]').forEach(b => b.onclick = () => {
        const id = b.dataset.id;
        if (team.includes(id)) team = team.filter(x => x !== id);
        else if (team.length < max) team.push(id);
        else { Sound.play('ui_err'); return; }
        Sound.play('ff7_cursor_move'); draw();
      });
      body.querySelector('.ff7-kits').onclick = () => { const id = team[0] || roster[0]; this.ff7Kit(id, FF7Event.spec(id, lvl)); };
      body.querySelector('.ff7-go').onclick = () => {
        if (!team.length) { Sound.play('ui_err'); return; }
        if (!n.only) st.lastTeam = team.slice();
        Save.write(); UI.closeModal({ skipHook: true });
        this.ff7Fight(i, mode, team);
      };
    };
    draw();
    UI.modal(`${n.name} · ${mode === 'hard' ? 'Hard' : 'Easy'}`, body, { className: 'ff7-modal' });
  },

  ff7Fight(i, mode, ids) {
    const n = FF7_NODES[i];
    const run = { wave: 0, team: FF7Event.team(i, ids, mode), battles: [] };
    if (!run.team.length) { UI.toast('Set a team first'); return; }
    const total = FF7Event.waves(n, mode);
    const first = !(FF7Event.state().cleared[i] || {})[mode];
    const level = FF7Event.level(n, mode);
    const rewards = masteryRewardBundle({ ichor: Math.round(1200 + level * 16), exp: Math.round(900 + level * 10), star: 40 + Math.round(level * .3), manual: 4 + Math.round(level / 40) });
    const launchWave = () => {
      const w = run.wave, final = w === total - 1;
      const foes = FF7Event.wave(n, mode, w);
      let battle = null;
      battle = BattleScreen.launch({
        team: run.team, foes, music: foes.some(f => f.kind === 'boss') ? 'ff7Boss' : 'ff7Battle', meta: FF7Event.meta(n, mode, w, i),
        rewards: final ? () => rewards : () => ({}), skipResults: !final,
        onDone: res => {
          $('#battle').classList.remove('ff7-battle');
          if (battle) run.battles.push(battle);
          if (res.quit || !res.win) {
            const drops = FF7Event.shardDrops(run.battles, mode);
            FF7Event.grant(drops); Save.write();
            if (!res.quit) this._ff7Result = { lose: true, wave: w + 1, drops };
            this._raidDossier = FF7_EVENT.id; this.render(); return;
          }
          if (!final) {
            const hp = {};
            battle.units.filter(u => u.team === TEAM_P && !u.minion).forEach(u => { hp[u.id] = u.alive ? u.hpPct : 0; });
            run.team = run.team.filter(sp => hp[sp.id] > 0).map(sp => Object.assign({}, sp, { carryHp: Math.min(1, hp[sp.id] + .15) }));
            run.wave++;
            UI.toast(`Wave ${w + 1} cleared`);
            launchWave(); return;
          }
          const st = FF7Event.state();
          const gil = FF7Event.gilReward(n, mode, first);
          const drops = FF7Event.shardDrops(run.battles, mode);
          st.gil += gil; FF7Event.grant(drops);
          const heroShards = first ? FF7Event.firstClearShards(n) : [];
          heroShards.forEach(h => Save.giveShards(h.id, h.amount, true));
          FF7Event.markDone(i, mode);
          const owned = ids.filter(id => Save.owns(id));
          if (owned.length) payoutBattle(owned, rewards, { mastery: 150 + Math.round(level / 2), pass: 80 + Math.round(level / 4) });
          Save.write();
          if (FF7_NODES[i + 1]) this._ff7Sel = i + 1;
          this._ff7Result = { win: true, gil, drops, heroShards, mode, name: n.name };
          this._raidDossier = FF7_EVENT.id; this.render();
        }
      });
      if (battle) $('#battle').classList.add('ff7-battle');
    };
    launchWave();
  },

  ff7ShowResult(r) {
    const body = el('div', 'ff7-result');
    const shards = Object.entries(r.drops || {}).filter(([, v]) => v > 0);
    body.innerHTML = `${r.win ? `<h3>Victory · ${r.name}</h3><p>Gained <em>${fmt(r.gil)}</em> Gil</p>` : `<h3>Defeat</h3><p>Reached wave ${r.wave}. You keep the shards earned so far.</p>`}
      ${shards.length ? `<ul class="ff7-drops">${shards.map(([id, v]) => `<li><img src="${trinketIcon(id)}" alt=""><span>${FF7_MATERIA_BY_ID[id].shard} Shard</span><b>: ${v}</b></li>`).join('')}</ul>` : ''}
      ${(r.heroShards || []).length ? `<ul class="ff7-drops">${r.heroShards.map(h => `<li><img src="${ff7Portrait(h.id)}" alt=""><span>${ff7Name(h.id)} Shards</span><b>: ${h.amount}</b></li>`).join('')}</ul>` : ''}`;
    if (r.win) FF7FX.sfx('boss_kill', .4);
    UI.modal(r.win ? 'Results' : 'Defeat', body, { className: 'ff7-modal' });
  },

  ff7PartyTab(main) {
    const roster = FF7_PARTY;
    const joined = FF7Event.joined(FF7Event.current());
    main.innerHTML = `<div class="ff7-list ff7-cast">${roster.map(id => {
      const owned = Save.owns(id), known = (FF7_TOONS.includes(id) && id !== 'Waxwell') || joined.has(id) || owned;
      const h = HEROES[id];
      return `<button class="ff7-row${known ? '' : ' locked'}" data-id="${id}" ${known ? '' : 'disabled'}><img src="${ff7Portrait(id)}" alt=""><span class="ff7-label">${known ? ff7Name(id) : '? ? ?'}</span><span class="ff7-count">${known ? (h.roleLabel || h.role) : ''}${owned ? ' · OWNED' : known ? ' · LOAN' : ''}</span></button>`;
    }).join('')}</div>`;
    main.querySelectorAll('[data-id]').forEach(b => {
      const h = HEROES[b.dataset.id];
      this.ff7Hover(b, b.disabled ? 'Not met yet.' : h.blurb);
      b.onclick = () => { if (b.disabled) return; Sound.play('ff7_cursor_accept'); this.ff7Kit(h.id, Save.owns(h.id) ? playerSpec(h.id) : FF7Event.spec(h.id, 60)); };
    });
  },

  ff7MateriaTab(main) {
    const st = FF7Event.state();
    main.innerHTML = `<div class="ff7-list ff7-materia">${FF7_MATERIA.map(m => {
      const have = st.shards[m.id] || 0, copies = Save.trinketCount ? Save.trinketCount(m.id) : (Save.ownsTrinket(m.id) ? 1 : 0);
      return `<div class="ff7-row ff7-mat ${m.color}" data-id="${m.id}"><img src="${trinketIcon(m.id)}" alt=""><span class="ff7-label">${m.name}<small>${TRINKETS[m.id].effect}</small></span>
        <span class="ff7-count">${fmt(have)}/${FF7_SHARD_COST}<small>${copies ? 'Owned ×' + copies : ''}</small></span>
        <button class="ff7-btn" ${have < FF7_SHARD_COST ? 'disabled' : ''}>Craft</button></div>`;
    }).join('')}</div>
    <p class="ff7-sub">Materia equips like a Trinket from any Hero's gear. Craft more copies to merge them into higher ranks.</p>`;
    main.querySelectorAll('[data-id]').forEach(row => {
      const m = FF7_MATERIA_BY_ID[row.dataset.id];
      const sources = m.from === 'boss' ? 'bosses and elites' : [m.from, ...Object.keys(FF7_EXTRA_MATERIA_DROPS).filter(id => FF7_EXTRA_MATERIA_DROPS[id] === m.id)].map(id => HEROES[id].name + 's').join(' and ');
      this.ff7Hover(row, `${TRINKETS[m.id].stat(1)} at Rank 1. Shards drop from ${sources}.`);
      row.querySelector('button').onclick = () => {
        const out = FF7Event.craft(m.id);
        if (!out.ok) { Sound.play('ui_err'); UI.toast(out.reason); return; }
        Sound.play('ff7_cursor_equip', { vol: .62 }); UI.toast(`${m.name} crafted!`); this.render();
      };
    });
  },

  ff7ShopTab(main) {
    const st = FF7Event.state();
    main.innerHTML = `<div class="ff7-list ff7-shop">${FF7_SHOP.map(o => {
      const owned = Save.owns(o.id), h = owned ? Save.hero(o.id) : null;
      const cost = Progress.starCost ? Progress.starCost(o.id) : null;
      const prog = owned ? (h.stars >= 5 ? 'MAX ★' : `${h.stars}★ · ${fmt(h.shards)}/${fmt(cost ? cost.shards : 100)}`) : `${fmt(Save.pending(o.id))}/${fmt(Save.unlockNeed(o.id))} to recruit`;
      return `<div class="ff7-row" data-id="${o.id}"><img src="${ff7Portrait(o.id)}" alt=""><span class="ff7-label">${ff7Name(o.id)} Shards ×${o.amount}<small>${prog}</small></span><span class="ff7-count">${fmt(o.cost * o.amount)} G</span><button class="ff7-btn" ${st.gil < o.cost * o.amount || (h && h.stars >= 5) ? 'disabled' : ''}>Buy</button></div>`;
    }).join('')}</div><p class="ff7-sub">Earn Gil from every battle. Hard mode pays double.</p>`;
    main.querySelectorAll('[data-id]').forEach(row => {
      const id = row.dataset.id;
      this.ff7Hover(row, HEROES[id].blurb);
      row.querySelector('button').onclick = () => {
        const out = FF7Event.buy(id);
        if (!out.ok) { Sound.play('ui_err'); UI.toast(out.reason); return; }
        Sound.play('ff7_purchase', { vol: .65 });
        if (out.res === 'new') UI.toast(`${ff7Name(id)} joined your roster!`);
        this.render();
      };
    });
  },

  ff7Kit(id, spec) {
    const body = el('div', 'ff7-kit');
    const lv = spec ? (spec.skillLv || spec.level || 30) : 30;
    const h = HEROES[id];
    body.innerHTML = `<header><img src="${FF7_VN_ART[id] ? ASSET + FF7_VN_ART[id] : Art.hero(id)}" alt=""><p>${h.blurb || ''}</p></header>`;
    SKILL_ORDER.forEach(key => {
      const skill = h.skills[key]; if (!skill) return;
      const desc = typeof SkillDesc !== 'undefined' ? SkillDesc.format(id, key, skill, lv, spec) : (typeof skill.desc === 'function' ? skill.desc(skill.v, skill.p) : '');
      body.appendChild(el('article', 'ff7-skill', `<small style="color:${RARITY_COLORS[SKILL_RARITY[key]]}">${RARITY_NAMES[SKILL_RARITY[key]].toUpperCase()} · ${skill.type}</small><h4>${skill.name}</h4><div class="sk-desc-root sk-mode-both">${desc}</div>`));
    });
    UI.modal(h.name, body, { className: 'ff7-modal' });
  },

  /* ============================================================ VISUAL NOVEL */
  ff7PlayScene(i) {
    const n = FF7_NODES[i], scene = FF7_STORY[n.scene];
    if (!scene) return;
    document.querySelectorAll('.ff7-vn').forEach(x => x.remove());
    const vn = el('div', 'ff7-vn');
    vn.innerHTML = `<div class="ff7-vn-bg"></div><div class="ff7-vn-fx"></div><div class="ff7-vn-stage"></div>
      <div class="ff7-vn-box ff7-win"><b class="ff7-vn-name"></b><p class="ff7-vn-text"></p><i class="ff7-vn-next">▼</i></div>
      <div class="ff7-vn-card"></div><button class="ff7-vn-skip" type="button">Skip »</button>`;
    document.body.appendChild(vn);
    const bg = vn.querySelector('.ff7-vn-bg'), stage = vn.querySelector('.ff7-vn-stage'), fx = vn.querySelector('.ff7-vn-fx');
    const box = vn.querySelector('.ff7-vn-box'), nameEl = vn.querySelector('.ff7-vn-name'), textEl = vn.querySelector('.ff7-vn-text');
    const card = vn.querySelector('.ff7-vn-card');
    const cast = {};
    const narrow = innerWidth < 600;
    const slots = narrow ? { farleft: 14, left: 30, center: 50, right: 70, farright: 86 } : { farleft: 10, left: 28, center: 50, right: 72, farright: 90 };
    let at = 0, typing = null, full = '', waiting = false, closed = false;
    const freeSlot = () => ['left', 'right', 'center', 'farleft', 'farright'].find(sl => !Object.values(cast).some(c => c.slot === sl)) || 'center';
    const enter = (who, slot) => {
      if (!FF7_VN_ART[who]) return null;
      slot = slot || (cast[who] && cast[who].slot) || freeSlot();
      let c = cast[who];
      if (!c) {
        const node = el('div', 'ff7-bust ' + (who === 'Sephiroth' ? 'ff7-cast seph' : FF7_HERO_IDS.includes(who) ? 'ff7-cast' : 'toon') + ' b-' + who.toLowerCase(), `<img src="${ASSET + FF7_VN_ART[who]}" alt="${ff7Name(who)}"><span class="ff7-emote"></span>`);
        stage.appendChild(node);
        c = cast[who] = { node, slot };
        node.style.left = slots[slot] + '%';
        requestAnimationFrame(() => node.classList.add('in'));
      }
      c.slot = slot; c.node.style.left = slots[slot] + '%';
      return c;
    };
    const exit = who => { const c = cast[who]; if (!c) return; delete cast[who]; c.node.classList.remove('in'); c.node.classList.add('out'); setTimeout(() => c.node.remove(), 400); };
    const effect = kind => {
      if (kind === 'flash') { vn.classList.remove('flash'); void vn.offsetWidth; vn.classList.add('flash'); }
      else if (kind === 'shake') { vn.classList.remove('shake'); void vn.offsetWidth; vn.classList.add('shake'); Sound.play('hit_blunt', { vol: .4 }); }
      else if (kind === 'night') vn.classList.add('night');
      else if (kind === 'day') vn.classList.remove('night', 'sand');
      else if (kind === 'sand') vn.classList.add('sand');
      else if (kind === 'vision') { vn.classList.add('vision'); Music.duck(.5, 120000); FF7FX.sfx('cast_magic', .35); }
      else if (kind === 'endvision') { vn.classList.remove('vision'); Music.clearDuck(true); }
      else if (kind === 'glitch') { const c = cast.CaitSith; if (c) { c.node.classList.remove('glitch'); void c.node.offsetWidth; c.node.classList.add('glitch'); } Sound.play('shock', { vol: .3 }); }
      else if (kind === 'fall') { vn.classList.remove('fall'); void vn.offsetWidth; vn.classList.add('fall'); Sound.play('whoosh', { vol: .5 }); }
      else if (kind === 'door') { const d = el('div', 'ff7-door'); fx.appendChild(d); setTimeout(() => d.remove(), 2600); Sound.play('sparkle', { vol: .6 }); }
      else if (kind === 'fireworks') {
        for (let k = 0; k < 7; k++) setTimeout(() => {
          const f = el('div', 'ff7-firework'); f.style.left = rnd(10, 90) + '%'; f.style.top = rnd(8, 45) + '%'; f.style.setProperty('--h', Math.floor(rnd(0, 360)));
          for (let p = 0; p < 14; p++) { const sp = el('i'); sp.style.setProperty('--a', (p / 14 * 360) + 'deg'); f.appendChild(sp); }
          fx.appendChild(f); Sound.play('pop2', { vol: .35 }); setTimeout(() => f.remove(), 1600);
        }, k * 380);
      }
    };
    const emote = (c, key) => {
      const e = FF7_EMOTES[key]; if (!c || !e) return;
      const span = c.node.querySelector('.ff7-emote');
      span.textContent = e.icon; span.className = 'ff7-emote show e-' + key.replace(/[^a-z]/g, 'x');
      if (e.sfx) Sound.play(e.sfx, { vol: .4, throttle: 60 });
      clearTimeout(c.emoteT); c.emoteT = setTimeout(() => { span.className = 'ff7-emote'; }, 1500);
    };
    const anim = (c, a) => { if (!c || !a) return; c.node.classList.remove('a-' + c.lastAnim); void c.node.offsetWidth; c.lastAnim = a; c.node.classList.add('a-' + a); };
    const voice = (who, ch, idx) => {
      const v = FF7_VOICE[who]; if (!v) return;
      if (v.cue && idx === 0) Sound.play(v.cue, { vol: .5, throttle: 200 });
      if (v.tick && idx % 3 === 0 && /\S/.test(ch)) Sound.play(v.tick, { vol: who === 'Dandy' || who === 'Gigi' ? .35 : .16, rate: (v.rate || 1) * rnd(.95, 1.05), throttle: 40 });
    };
    const type = (who, text) => {
      full = text; textEl.textContent = ''; let k = 0;
      vn.classList.remove('can-next');
      clearInterval(typing);
      typing = setInterval(() => {
        k++; textEl.textContent = full.slice(0, k); voice(who, full[k - 1] || '', k - 1);
        if (k >= full.length) { clearInterval(typing); typing = null; vn.classList.add('can-next'); }
      }, 24);
    };
    const finish = () => {
      if (closed) return; closed = true;
      clearInterval(typing);
      vn.classList.add('closing'); Music.clearDuck(true);
      setTimeout(() => vn.remove(), 450);
      const first = !FF7Event.nodeDone(i);
      const rew = first ? FF7Event.storyReward(i) : null;
      FF7Event.markDone(i, 'story');
      if (rew) UI.toast(`Chapter complete · +${rew.gil} Gil`);
      if (FF7_NODES[i + 1]) this._ff7Sel = i + 1;
      Music.play('ff7Menu');
      this.render();
    };
    const step = () => {
      if (closed) return;
      while (at < scene.script.length) {
        const line = scene.script[at++];
        if (line[0] === '@') {
          const [cmd, ...rest] = line.slice(1).split(' ');
          const arg = rest.join(' ');
          if (cmd === 'bg') bg.style.backgroundImage = `url("${ASSET}assets/ff7/bg/${FF7_BG[arg] || arg}.png")`;
          else if (cmd === 'music') Music.play(FF7_MUSIC[arg] || arg);
          else if (cmd === 'enter') enter(rest[0], rest[1]);
          else if (cmd === 'exit') exit(arg);
          else if (cmd === 'exitall') Object.keys(cast).forEach(exit);
          else if (cmd === 'fx') effect(arg);
          else if (cmd === 'sfx') { if (arg === 'slots') Sound.play('ff7_slots_spin', { vol: .5 }); else if (arg === 'surprise') Sound.play('warn', { vol: .5 }); else if (arg === 'happy') FF7FX.sfx('item', .5); else if (arg === 'drama') FF7FX.sfx('boss_kill', .45); }
          else if (cmd === 'title') {
            card.textContent = arg; card.classList.remove('show'); void card.offsetWidth; card.classList.add('show');
            box.classList.add('hide'); Sound.play('ult', { vol: .4 });
            waiting = true; setTimeout(() => { waiting = false; box.classList.remove('hide'); step(); }, 1900);
            return;
          }
          continue;
        }
        Object.values(cast).forEach(c => c.node.classList.remove('talk'));
        if (line[0] === '>') {
          box.classList.add('narrate'); nameEl.textContent = ''; type(null, line.slice(1).trim());
          Object.values(cast).forEach(c => c.node.classList.add('dim'));
          return;
        }
        const m = line.match(/^([A-Za-z]+)\s*(?:\[([^\]]+)\])?\s*(?:\(([^)]+)\))?\s*:\s*(.*)$/);
        if (!m) continue;
        const [, who, emo, an, text] = m;
        box.classList.remove('narrate');
        nameEl.textContent = ff7Name(who);
        nameEl.className = 'ff7-vn-name' + (who === 'Sephiroth' ? ' seph' : FF7_HERO_IDS.includes(who) ? ' ff7' : FF7_VN_ART[who] ? ' toon' : ' extra');
        const c = cast[who] || enter(who);
        Object.entries(cast).forEach(([k, x]) => x.node.classList.toggle('dim', k !== who));
        if (c) { c.node.classList.add('talk'); emote(c, emo); anim(c, an || 'nod'); }
        type(who, text);
        return;
      }
      finish();
    };
    const advance = () => {
      if (closed || waiting) return;
      if (typing) { clearInterval(typing); typing = null; textEl.textContent = full; vn.classList.add('can-next'); return; }
      Sound.play('ff7_cursor_move', { vol: .25 });
      step();
    };
    vn.addEventListener('click', e => { if (e.target.closest('.ff7-vn-skip')) return; advance(); });
    vn.querySelector('.ff7-vn-skip').onclick = () => { Sound.play('ui_back'); finish(); };
    const key = e => {
      if (closed) { document.removeEventListener('keydown', key); return; }
      if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); advance(); }
      else if (e.key === 'Escape') finish();
    };
    document.addEventListener('keydown', key);
    step();
  }
});
