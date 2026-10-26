/* story-battle.js - the Turn Based battle screen for the Main Story.
   Drives a StoryBattle (story-engine.js) on the auto battler's own arena:
   the same stage, floor, unit cutouts, HP bars, top HUD and portrait dock,
   with the Handlers standing in as their Toon's Handler skin. Each turn a
   command menu rises above the dock; actions play back as lunges, casts
   and hits on the stage. Waves carry HP and FP over. */
'use strict';

const ST_STATUS_ICON = {
  atkUp: ['⚔', 'buff', 'Attack & Magic up'], magUp: ['✦', 'buff', 'Magic up'], defUp: ['🛡', 'buff', 'Defense up'], haste: ['»', 'buff', 'Haste'],
  regen: ['✚', 'buff', 'Regen'], shield: ['◈', 'buff', 'Shield'], counter: ['↺', 'buff', 'Counter'], guard: ['▣', 'buff', 'Guarding'],
  atkDown: ['⚔', 'debuff', 'Attack down'], defDown: ['🛡', 'debuff', 'Defense down'], slow: ['«', 'debuff', 'Slow'], ink: ['💧', 'debuff', 'Ichor-soaked'],
  sleep: ['z', 'debuff', 'Asleep'], stun: ['✷', 'debuff', 'Stunned'], taunt: ['!', 'debuff', 'Taunted'], mark: ['◎', 'debuff', 'Marked']
};

const StoryBattleUI = {
  speed: 1, auto: false,

  wait(ms) { return new Promise(r => setTimeout(r, ms / this.speed)); },

  start(i, mode, ids) {
    if (typeof BattleScreen !== 'undefined' && BattleScreen.active) return;
    const n = MainStory.nodes[i];
    MainStory.floor(ids, n.lv);
    const items = MainStory.itemsFor(mode), base = Object.assign({}, items), stock = {};
    if (MainStory.ch === 2) Object.entries(MainStory.state().shop.items).forEach(([k, v]) => { if (v > 0) { stock[k] = v; items[k] = (items[k] || 0) + v; } });
    this.run = { i, n, mode, ids, wave: 0, carry: {}, items, base, stock, exp: 0, killed: 0, ch: MainStory.ch };
    StoryUI.overlay = true;
    this.build();
    this.launchWave();
  },

  /* Borrow the auto battler's arena: same stage, HUD and dock, with a thin
     turn-based overlay (turn order, banner, command menu, cut-ins) on top. */
  build() {
    document.querySelectorAll('.ms-tb').forEach(x => x.remove());
    if (typeof Screens !== 'undefined') { clearInterval(Screens._liveClock); Screens._liveClock = null; }
    const r = this.run, arena = $('#battle');
    this.arena = arena;
    arena.hidden = false; $('#app').hidden = true;
    arena.classList.remove('kh-battle', 'unknown-world-battle', 'qom-battle', 'stb-lost');
    arena.classList.add('story-tb');
    $('#battleEnd').hidden = true; clear($('#battleEnd'));
    $('#battleHud').classList.remove('wave-exit');
    clear($('#unitLayer')); clear($('#allyDock')); clear($('#logBox'));
    $('#bgLayer').style.backgroundImage = `url("${stBg(r.n.bg)}")`;
    const root = el('div', 'ms-tb');
    root.innerHTML = `<div class="stb-vfx" aria-hidden="true"></div><div class="stb-order"><small>NEXT</small><div class="stb-order-in"></div></div>
      <div class="ms-tb-banner"></div><div class="ms-tb-cmd"></div><div class="ms-tb-cutin"></div><div class="ms-tb-flash"></div>`;
    arena.appendChild(root);
    this.root = root;
    const Q = s => root.querySelector(s);
    this.el = { units: $('#unitLayer'), dock: $('#allyDock'), log: $('#logBox'), stage: $('#stage'), vfx: Q('.stb-vfx'), cmd: Q('.ms-tb-cmd'), order: Q('.stb-order-in'),
      banner: Q('.ms-tb-banner'), wave: $('#waveText'), turn: $('#hudTimerText'), cutin: Q('.ms-tb-cutin'), flash: Q('.ms-tb-flash') };
    const speedB = $('#btnSpeed'), autoB = $('#btnAuto');
    $('i', speedB).textContent = this.speed + 'x';
    speedB.onclick = () => { this.speed = this.speed === 1 ? 2 : 1; $('i', speedB).textContent = this.speed + 'x'; Sound.play('ui_move'); };
    const syncAuto = () => { autoB.classList.toggle('on', this.auto); $('i', autoB).textContent = this.auto ? 'AUTO' : 'MANUAL'; autoB.setAttribute('aria-pressed', String(this.auto)); };
    syncAuto();
    autoB.onclick = () => {
      this.auto = !this.auto; syncAuto(); Sound.play(this.auto ? 'auto_on' : 'auto_off');
      if (this.auto && this.pendingPick) this.pendingPick(this.B.autoAction(this.pendingActor));
    };
    $('#btnQuit').onclick = () => this.confirmQuit();
    this.measure();
  },

  /* Same staging numbers as the auto battler (sim.js): a ground line with a
     depth band above it; depth sets height, size and paint order. */
  measure() {
    const f = this.arena.getBoundingClientRect();
    this.W = f.width; this.H = f.height;
    this.phone = this.W <= 430;
    this.ground = this.H - Math.min(250, this.H * .4);
    this.depthSpan = clamp(this.H * .2, 80, this.phone ? 150 : 130);
    const floor = $('#floorLine'); if (floor) floor.style.height = (this.H - this.ground + this.depthSpan + 24) + 'px';
  },

  launchWave() {
    const r = this.run, n = r.n, waves = n[r.mode], w = r.wave, st = MainStory.state();
    const flv = MainStory.foeLevel(n, r.mode), mult = MainStory.foeMult(n, r.mode);
    const foes = [];
    waves[w].forEach(([k, cnt, x]) => { for (let c = 0; c < cnt; c++) foes.push([k, flv, Object.assign({}, x || {}, { mult })]); });
    const party = r.ids.map(id => ({
      id, lv: MainStory.lv(id).lv, row: st.rows[id], hp: r.carry[id] ? r.carry[id].hp : null, bond: r.carry[id] ? r.carry[id].bond : 0
    }));
    this.B = new StoryBattle({ party, foes, items: r.items, improvised: !!n.improvised, unlocked: sk => MainStory.skillOpen(sk) });
    this.B.party().forEach(u => { const c = r.carry[u.key]; if (c) u.fp = Math.min(u.max.fp, c.fp); });
    this.el.wave.textContent = `${n.name}  ·  ${r.mode === 'hard' ? 'HARD' : 'EASY'} ${w + 1}/${waves.length}`;
    this.el.turn.textContent = 'TURN 1';
    if (w === 0) clear(this.el.units);
    else this.el.units.querySelectorAll('.unit.foe').forEach(x => x.remove());
    this.drawParty(); this.drawFoes(); this.drawDock(); this.drawOrder();
    this.el.cmd.innerHTML = '';
    const boss = foes.some(f => ST_ENEMIES[f[0]].boss);
    Music.play(stTrack(n.music));
    this.banner(w === 0 ? (n.improvised ? 'NO BADGES. IMPROVISE!' : 'BATTLE START') : boss ? 'BOSS INCOMING' : `WAVE ${w + 1}`, boss ? 'boss' : '');
    Sound.play(boss ? 'apex_trial_warning' : 'endless_enter', { vol: .45 });
    setTimeout(() => this.loop(), 1300);
  },

  /* ---------- the stage ---------- */
  unitEl(u) { return u && this.el.units.querySelector(`[data-uid="${u.uid}"]`); },
  art(u) { return u.side === 'p' ? stBattleUrl(u.key) : stEnemyArt(u.key); },
  makeUnit(u) {
    const foe = u.side === 'e', w = Math.round(98 * (this.phone ? .82 : 1) * (u.boss ? 1.3 : 1)), top = w * 1.32;
    const n = el('div', `unit ${foe ? 'foe' : 'ally'}${u.boss ? ' boss' : ''}${foe && u.def.art[0] === 'w' ? ' inky' : ''} stb-unit stb-enter`);
    n.dataset.uid = u.uid;
    n.style.setProperty('--w', w + 'px');
    n.style.setProperty('--stb-color', u.side === 'p' ? stChar(u.key).color : '#ed617f');
    n.innerHTML = `<div class="shadow"></div>
      <div class="body" style="width:${w}px;margin-left:${-w / 2}px"><img src="${this.art(u)}" alt="" draggable="false"></div>
      <div class="nameplate${u.boss ? ' rankBoss' : ''}" style="bottom:${top + 14}px">${u.boss ? '<i class="rankIcon">👑</i>' : ''}${u.name}${foe ? ` <small>LV ${u.lv}</small>` : ''}</div>
      <div class="hpmini" style="bottom:${top + 3}px"><i style="width:100%"></i><b style="width:0"></b></div>
      ${foe ? `<div class="stb-sg" style="bottom:${top - 3}px"><i></i></div>` : ''}
      <div class="stats ms-st" style="bottom:${top - 20}px"></div>
      <i class="stb-arrow" style="bottom:${top + 30}px">▼</i><i class="stb-charge" style="bottom:${top * .6}px">!</i>
      <span class="ms-pops" style="bottom:${top * .72}px"></span>`;
    n.addEventListener('click', () => { if (n.classList.contains('stb-target') && this._targetPick) this._targetPick(u); });
    this.el.units.appendChild(n);
    requestAnimationFrame(() => requestAnimationFrame(() => n.classList.remove('stb-enter')));
    return n;
  },
  /* Foot position for a unit: the party holds the left half (front row
     nearer the middle), enemies spread over the right half. */
  spot(u) {
    const W = this.W, B = this.B;
    const lanes = cnt => cnt <= 1 ? [.45] : cnt === 2 ? [.2, .72] : cnt === 3 ? [.08, .48, .9] : cnt === 4 ? [.04, .36, .66, .96] : [.02, .52, .26, .78, 1];
    let x, d;
    if (u.side === 'p') {
      const row = B.party().filter(x => x.row === u.row), k = row.indexOf(u);
      d = lanes(row.length)[k];
      x = W * (u.row === 'front' ? (this.phone ? .34 : .36) : (this.phone ? .15 : .17)) + (k % 2 ? -1 : 1) * W * .04 + d * W * .03;
    } else {
      const list = B.foes().filter(f => f.alive || f === u), k = Math.max(0, list.indexOf(u)), cnt = list.length;
      d = lanes(cnt)[k];
      x = cnt === 1 ? W * .72 : W * (.6 + .27 * k / (cnt - 1));
      x -= d * W * .03;
    }
    return { x, y: this.ground - d * this.depthSpan, d };
  },
  place(u, ms) {
    const n = this.unitEl(u); if (!n) return;
    const p = this.spot(u);
    u._home = p;
    n.style.transition = ms ? `transform ${ms}ms ease` : '';
    n.style.transform = `translate(${p.x.toFixed(1)}px,${p.y.toFixed(1)}px) scale(${(1 - p.d * .08).toFixed(3)})`;
    n.style.zIndex = 220 - Math.round(p.d * 160) + (u.boss ? 4 : 0);
  },
  moveTo(u, x, y, ms) {
    const n = this.unitEl(u); if (!n || !u._home) return;
    n.style.transition = `transform ${ms / this.speed}ms cubic-bezier(.3,.8,.4,1)`;
    n.style.transform = `translate(${x.toFixed(1)}px,${y.toFixed(1)}px) scale(${(1 - u._home.d * .08).toFixed(3)})`;
    n.style.zIndex = 300;
  },
  drawParty() {
    this.B.party().forEach(u => { if (!this.unitEl(u)) this.makeUnit(u); this.place(u); this.refreshUnit(u); });
  },
  drawFoes() {
    this.B.foes().forEach(u => { if (!this.unitEl(u) && u.alive) this.makeUnit(u); });
    this.layoutFoes(0);
  },
  layoutFoes(ms) { this.B.foes().filter(u => u.alive).forEach(u => { this.place(u, ms); this.refreshUnit(u); }); },
  drawDock() {
    this.el.dock.innerHTML = this.B.party().map(u => {
      const h = stChar(u.key);
      return `<div class="unitcard stb-card" data-card="${u.uid}" style="--hc:${h.color};--ha:${h.accent}" title="${h.name}">
        <div class="uc-lv">${u.lv}</div><div class="uc-port"><img src="${stCharUrl(u.key)}" alt=""></div>
        <div class="stb-card-name">${h.name}</div>
        <div class="uc-hpwrap"><i class="uc-hp" style="width:100%"></i></div>
        <div class="uc-enwrap stb-fp" title="FP"><i class="uc-en" style="width:0"></i></div>
        <div class="stb-bond"><i></i></div></div>`;
    }).join('');
    this.el.dock.querySelectorAll('[data-card]').forEach(c => c.onclick = () => {
      const u = this.B.units.find(x => x.uid == c.dataset.card);
      if (c.classList.contains('stb-target') && this._targetPick) this._targetPick(u);
    });
    this.B.party().forEach(u => this.refreshUnit(u));
  },
  card(u) { return u && this.el.dock.querySelector(`[data-card="${u.uid}"]`); },
  refreshUnit(u) {
    const node = this.unitEl(u); if (!node) return;
    const pct = Math.max(0, u.hp / u.max.hp * 100);
    node.querySelector('.hpmini i').style.width = pct + '%';
    node.querySelector('.hpmini').classList.toggle('low', u.alive && pct < 30);
    const sh = u.st.shield && u.st.shield.t > 0 ? u.st.shield.amt || u.st.shield.v || 0 : 0;
    node.querySelector('.hpmini b').style.width = Math.min(100, sh / u.max.hp * 100) + '%';
    node.classList.toggle('dead', !u.alive);
    if (u.side === 'p') {
      const c = this.card(u);
      if (c) {
        const hp = c.querySelector('.uc-hp'); hp.style.width = pct + '%'; hp.classList.toggle('low', pct < 30);
        c.querySelector('.uc-en').style.width = (u.fp / u.max.fp * 100) + '%';
        c.querySelector('.stb-fp').dataset.fp = u.fp;
        c.querySelector('.stb-bond i').style.width = u.bond + '%';
        c.classList.toggle('ult-ready', u.bond >= 100 && u.alive);
        c.classList.toggle('ko', !u.alive);
      }
    } else {
      node.querySelector('.stb-sg i').style.width = (u.stagger.broken ? 100 : u.stagger.cur / u.stagger.max * 100) + '%';
      node.classList.toggle('stb-broken', !!u.stagger.broken);
      node.classList.toggle('stb-charging', !!u.tele);
    }
    const sts = Object.keys(u.st).filter(k => ST_STATUS_ICON[k] && u.st[k].t > 0);
    if (u.guard) sts.push('guard');
    node.querySelector('.ms-st').innerHTML = sts.map(k => `<i class="${ST_STATUS_ICON[k][1]} s-${k}" title="${ST_STATUS_ICON[k][2]}">${ST_STATUS_ICON[k][0]}</i>`).join('');
  },
  refreshAll() { this.B.units.forEach(u => this.refreshUnit(u)); },
  drawOrder() {
    const list = this.B.preview(7);
    this.el.order.innerHTML = list.map((u, k) =>
      `<span class="is-${u.side}${k === 0 ? ' first' : ''}${u.tele ? ' charging' : ''}${u.side === 'e' && u.def.art[0] === 'w' ? ' inky' : ''}" title="${u.name}"><img src="${this.art(u)}" alt=""></span>`).join('');
  },
  setTurn(u) {
    this.root.parentNode.querySelectorAll('.stb-turn').forEach(x => x.classList.remove('stb-turn'));
    [this.unitEl(u), this.card(u)].forEach(x => x && x.classList.add('stb-turn'));
    this.el.turn.textContent = 'TURN ' + Math.max(1, this.B.turn || 1);
  },
  banner(text, cls) {
    const b = this.el.banner; b.className = 'ms-tb-banner' + (cls ? ' is-' + cls : ''); b.innerHTML = `<b>${text}</b>`;
    void b.offsetWidth; b.classList.add('show');
    clearTimeout(this._banT); this._banT = setTimeout(() => b.classList.remove('show'), 1500 / this.speed);
  },
  say(text, cls) {
    const l = el('div', cls || '', text);
    this.el.log.appendChild(l);
    while (this.el.log.children.length > 3) this.el.log.firstChild.remove();
  },
  pop(u, text, cls) {
    const node = this.unitEl(u); if (!node) return;
    const p = el('span', 'ms-pop ' + (cls || ''), text);
    p.style.setProperty('--dx', rnd(-18, 18) + 'px');
    node.querySelector('.ms-pops').appendChild(p);
    setTimeout(() => p.remove(), 1300);
  },
  shake(big) { const s = this.el.stage; s.classList.remove('stb-shake', 'stb-shake-big'); void s.offsetWidth; s.classList.add(big ? 'stb-shake-big' : 'stb-shake'); },
  flash(col) { const f = this.el.flash; f.style.background = col || '#fff'; f.classList.remove('go'); void f.offsetWidth; f.classList.add('go'); },
  slash(u, kind) {
    const node = this.unitEl(u); if (!node) return;
    const s = el('i', 'ms-slash ' + (kind || ''));
    node.appendChild(s); setTimeout(() => s.remove(), 500);
  },
  flinch(u) { const n = this.unitEl(u); if (n) { n.classList.remove('hurt', 'stb-flinch'); void n.offsetWidth; n.classList.add('hurt', 'stb-flinch'); setTimeout(() => n.classList.remove('hurt'), 120); } },

  fxReduced() {
    return document.documentElement.classList.contains('accessibility-reduced-effects') ||
      (window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches);
  },
  fxColor(key) {
    return key === 'foe' ? '#ee5a82' : stChar(key) ? stChar(key).color : '#ffe36d';
  },
  fxPoint(u) {
    const node = this.unitEl(u), root = this.root;
    if (!node || !root) return null;
    const body = node.querySelector('.body img') || node.querySelector('.body');
    const box = body.getBoundingClientRect(), frame = root.getBoundingClientRect();
    if (box.width && box.height) return { x: box.left + box.width / 2 - frame.left, y: box.top + box.height * .52 - frame.top };
    return u._home ? { x: u._home.x, y: u._home.y - 48 } : null;
  },
  fxAdd(type, point, key, lifetime) {
    if (this.fxReduced() || !point || !this.el.vfx) return null;
    const node = el('span', `stb-vfx-${type} fx-${key.toLowerCase()}`);
    node.style.setProperty('--fx-color', this.fxColor(key));
    node.style.left = point.x + 'px'; node.style.top = point.y + 'px';
    node.style.setProperty('--fx-time', (lifetime / this.speed) + 'ms');
    this.el.vfx.appendChild(node);
    setTimeout(() => node.remove(), lifetime / this.speed + 80);
    return node;
  },
  fxWindup(u, kind) {
    const key = u.side === 'p' ? u.key : 'foe';
    const ring = this.fxAdd('windup', this.fxPoint(u), key, kind === 'bond' ? 850 : 520);
    if (ring) ring.classList.add('is-' + kind);
  },
  async fxShot(a, t, skill) {
    if (this.fxReduced()) return;
    const from = this.fxPoint(a), to = this.fxPoint(t);
    if (!from || !to) return;
    const key = a.side === 'p' ? a.key : 'foe';
    const shot = this.fxAdd('shot', from, key, 180);
    if (!shot) return;
    if (skill) shot.classList.add('skill-' + skill);
    shot.style.setProperty('--fx-dx', (to.x - from.x) + 'px');
    shot.style.setProperty('--fx-dy', (to.y - from.y) + 'px');
    await this.wait(180);
  },
  fxBurst(u, key, type, large, skill) {
    const burst = this.fxAdd('burst', this.fxPoint(u), key, large ? 850 : 670);
    if (!burst) return;
    burst.classList.add('is-' + type);
    if (large) burst.classList.add('is-large');
    if (skill) burst.classList.add('skill-' + skill);
    const count = large ? 12 : 7, distance = large ? 72 : 47;
    for (let i = 0; i < count; i++) {
      const part = el('i');
      const angle = (i / count) * Math.PI * 2;
      part.style.setProperty('--fx-x', (Math.cos(angle) * distance).toFixed(1) + 'px');
      part.style.setProperty('--fx-y', (Math.sin(angle) * distance).toFixed(1) + 'px');
      part.style.setProperty('--fx-delay', (i % 3) * 18 + 'ms');
      burst.appendChild(part);
    }
  },

  /* Physical moves dash in front of the first target and strike there;
     everything else casts from where the unit stands. */
  async lunge(a, events, from) {
    const hit = events.slice(from + 1).find(e => e.t === 'dmg' && e.src === a.uid);
    if (!hit || hit.kind === 'mag') return false;
    const t = this.B.units.find(x => x.uid === hit.target);
    if (!t || !t._home || t.side === a.side) return false;
    const face = a.side === 'p' ? 1 : -1, w = parseFloat(getComputedStyle(this.unitEl(t)).getPropertyValue('--w')) || 90;
    this.moveTo(a, t._home.x - face * (w * .62 + 26), t._home.y + 2, 190);
    Sound.play('swing_light', { vol: .35, throttle: 60 });
    await this.wait(200);
    return true;
  },
  goHome(a) { if (a && a.alive !== undefined) { this.place(a, 260 / this.speed); } },

  /* ---------- turn loop ---------- */
  async loop() {
    const B = this.B, alive = () => this.B === B && this.root && this.root.isConnected;
    while (!B.over && alive()) {
      this._fxAction = null;
      const nx = B.next();
      this.drawOrder();
      const actor = nx.actor;
      this.setTurn(actor);
      if (nx.events.length) await this.play(nx.events);
      if (!alive()) return;
      if (B.over) break;
      if (nx.skip) { this.refreshAll(); await this.wait(250); continue; }
      let ev;
      if (actor.side === 'p') {
        const action = this.auto ? (await this.wait(260), B.autoAction(actor)) : await this.pick(actor);
        if (!alive()) return;
        ev = B.act(actor, action);
      } else {
        await this.wait(340);
        if (!alive()) return;
        ev = B.enemyAct(actor);
      }
      await this.play(ev);
      if (!alive()) return;
      this.refreshAll();
      this.drawOrder();
      await this.wait(120);
    }
    if (alive()) this.endWave();
  },

  /* ---------- the command menu ---------- */
  pick(u) {
    return new Promise(resolve => {
      this.pendingActor = u;
      this.pendingPick = a => { this.pendingPick = null; this.el.cmd.innerHTML = ''; this.clearTargets(); resolve(a); };
      this.menu(u);
    });
  },
  menu(u) {
    const B = this.B, h = stChar(u.key), cmd = this.el.cmd;
    const items = Object.keys(B.items).filter(k => B.items[k] > 0);
    cmd.innerHTML = `<div class="ms-cmd-who" style="--hc:${h.color}"><b>${h.name}</b><small>${ST_ROLE_ICON[h.role]} ${h.role} · ${u.fp}/${u.max.fp} FP</small></div>
      <div class="ms-cmd-row">
        <button data-c="attack" class="atk"><i>⚔</i><b>${B.improvised ? h.improvised : 'Attack'}</b><small>+3 FP</small></button>
        <button data-c="skills" ${u.skills.length ? '' : 'disabled'}><i>✦</i><b>Skills</b><small>${u.skills.length ? u.skills.length + ' known' : 'No badge'}</small></button>
        <button data-c="guard"><i>▣</i><b>Guard</b><small>½ dmg</small></button>
        <button data-c="item" ${items.length ? '' : 'disabled'}><i>✚</i><b>Items</b><small>${items.reduce((a, k) => a + B.items[k], 0)} left</small></button>
        <button data-c="bond" class="bond${u.bond >= 100 ? ' ready' : ''}" ${u.bond >= 100 ? '' : 'disabled'}><i>❀</i><b>${u.bond >= 100 ? h.bond.name : 'Bond'}</b><small>${u.bond >= 100 ? 'READY!' : u.bond + '%'}</small></button>
      </div>`;
    Sound.play('ui_open', { vol: .25, throttle: 80 });
    cmd.querySelectorAll('[data-c]').forEach(b => b.onclick = () => {
      if (b.disabled) return Sound.play('ui_err');
      Sound.play('ui_click', { vol: .4 });
      const c = b.dataset.c;
      if (c === 'attack') this.target(u, 'enemy', t => this.pendingPick({ type: 'attack', target: t }), () => this.menu(u));
      else if (c === 'guard') this.pendingPick({ type: 'guard' });
      else if (c === 'skills') this.skillMenu(u);
      else if (c === 'item') this.itemMenu(u);
      else if (c === 'bond') this.pendingPick({ type: 'bond' });
    });
  },
  subMenu(u, title, rows, back) {
    const cmd = this.el.cmd;
    cmd.innerHTML = `<div class="ms-cmd-sub"><header><button data-back>‹</button><b>${title}</b></header><div class="ms-cmd-list">${rows.map((r, k) => `<button data-k="${k}" ${r.off ? 'disabled' : ''}>${r.icon ? `<img src="${r.icon}" alt="">` : ''}<span><b>${r.name}</b><small>${r.desc}</small></span><em>${r.tag}</em></button>`).join('')}</div></div>`;
    cmd.querySelector('[data-back]').onclick = () => { Sound.play('ui_back'); back(); };
    cmd.querySelectorAll('[data-k]').forEach(b => b.onclick = () => { if (b.disabled) return Sound.play('ui_err'); Sound.play('ui_click', { vol: .4 }); rows[+b.dataset.k].go(); });
  },
  skillMenu(u) {
    const B = this.B;
    this.subMenu(u, 'Skills', u.skills.map(sk => ({
      name: sk.name, desc: sk.desc, tag: sk.fp + ' FP', off: u.fp < sk.fp || (sk.target === 'ko' && !B.party().some(x => !x.alive)),
      go: () => {
        if (['enemy', 'ally', 'ko'].includes(sk.target)) this.target(u, sk.target, t => this.pendingPick({ type: 'skill', id: sk.id, target: t }), () => this.skillMenu(u));
        else this.pendingPick({ type: 'skill', id: sk.id });
      }
    })), () => this.menu(u));
  },
  itemMenu(u) {
    const B = this.B;
    this.subMenu(u, 'Items', Object.keys(B.items).filter(k => B.items[k] > 0).map(k => {
      const it = ST_ITEMS[k];
      return { name: it.name, desc: it.desc, tag: '×' + B.items[k], icon: ASSET + it.icon, off: it.target === 'ko' && !B.party().some(x => !x.alive),
        go: () => it.target === 'allies' ? this.pendingPick({ type: 'item', id: k }) : this.target(u, it.target, t => this.pendingPick({ type: 'item', id: k, target: t }), () => this.itemMenu(u)) };
    }), () => this.menu(u));
  },
  target(u, kind, done, back) {
    const B = this.B;
    const pool = kind === 'enemy' ? B.living('e') : kind === 'ally' ? B.living('p') : B.party().filter(x => !x.alive);
    if (pool.length === 1) { done(pool[0].uid); return; }
    this.el.cmd.innerHTML = `<div class="ms-cmd-target"><button data-back>‹ Back</button><b>${kind === 'enemy' ? 'Tap an enemy' : kind === 'ko' ? 'Tap a fallen ally' : 'Tap an ally'}</b></div>`;
    this.el.cmd.querySelector('[data-back]').onclick = () => { Sound.play('ui_back'); this.clearTargets(); back(); };
    pool.forEach(t => [this.unitEl(t), this.card(t)].forEach(n => n && n.classList.add('stb-target')));
    this._targetPick = t => {
      if (!pool.includes(t)) return;
      Sound.play('choose', { vol: .45 }); this.clearTargets(); done(t.uid);
    };
  },
  clearTargets() {
    this._targetPick = null;
    if (this.arena) this.arena.querySelectorAll('.stb-target').forEach(n => n.classList.remove('stb-target'));
  },

  /* ---------- event playback ---------- */
  async play(events) {
    const B = this.B, U = id => B.units.find(x => x.uid === id);
    let away = null;
    const back = async () => { if (away) { const w = away; away = null; this.goHome(w); await this.wait(240); } };
    for (let ei = 0; ei < events.length; ei++) {
      const e = events[ei];
      if (!this.root || !this.root.isConnected) return;
      const t = e.target != null ? U(e.target) : null, a = e.actor != null ? U(e.actor) : null;
      switch (e.t) {
        case 'act': {
          await back();
          const node = this.unitEl(a);
          this._fxAction = { actor: a.uid, key: a.side === 'p' ? a.key : 'foe', skill: e.skill || '' };
          if (node) { node.classList.remove('stb-act'); void node.offsetWidth; node.classList.add('stb-act'); }
          this.fxWindup(a, e.kind);
          if (e.kind === 'guard') this.fxBurst(a, a.side === 'p' ? a.key : 'foe', 'guard');
          if (e.kind !== 'guard' && e.kind !== 'item' && await this.lunge(a, events, ei)) away = a;
          else if (node && e.kind !== 'guard') { node.classList.add('casting'); setTimeout(() => node.classList.remove('casting'), 700 / this.speed); }
          const label = a.side === 'p' ? `<b style="color:${stChar(a.key).color}">${a.name}</b> · ${e.name}` : `<b class="foe">${a.name}</b> · ${e.name}`;
          this.say(label, e.kind === 'bond' ? 'bond' : e.big ? 'big' : '');
          if (a.side === 'e') { this.banner(e.name, e.big ? 'big' : 'enemy'); Sound.play(e.big ? 'tw_rnd_attack' : 'swish_attack', { vol: .4 }); await this.wait(e.big ? 650 : 380); }
          else if (e.kind === 'skill') { Sound.play('beam_charge', { vol: .28 }); this.banner(e.name, 'skill'); await this.wait(330); }
          else if (e.kind === 'item') { Sound.play('item_used', { vol: .5 }); await this.wait(260); }
          else if (e.kind === 'guard') { Sound.play('guard', { vol: .5 }); await this.wait(220); }
          else await this.wait(200);
          break;
        }
        case 'cutin': await this.cutin(a, e); break;
        case 'charge':
          this.say(`<b class="foe">${a.name}</b> · ${e.text}`, 'big');
          this.banner('⚠ ' + e.name, 'charge'); Sound.play('warn', { vol: .5 });
          this.refreshUnit(a); await this.wait(900); break;
        case 'dmg': {
          const src = U(e.src);
          const skill = src && this._fxAction && this._fxAction.actor === src.uid ? this._fxAction.skill : '';
          const heavy = e.crit || ['tackle', 'fossil', 'live'].includes(skill);
          if (src && e.kind === 'mag') await this.fxShot(src, t, skill);
          if (src) this.fxBurst(t, src.side === 'p' ? src.key : 'foe', e.kind, heavy, skill);
          this.slash(t, src && src.side === 'p' ? (e.kind === 'mag' ? 'mag' : 'phys') : 'foe');
          this.pop(t, e.amount + (e.crit ? '!' : ''), (e.crit ? 'crit ' : '') + (t.side === 'p' ? 'hurt' : 'dmg'));
          if (e.soaked) this.pop(t, `◈${e.soaked}`, 'shield');
          if (e.fieldNotes) this.pop(t, 'FIELD NOTES', 'tag');
          if (e.streak >= 2) this.pop(t, `RATINGS ×${e.streak}`, 'tag');
          this.flinch(t);
          Sound.play(e.crit ? 'crit' : e.kind === 'mag' ? 'hit_magic' : 'hit_blunt', { vol: .42, throttle: 30 });
          if (t.side === 'p') this.shake(e.amount > t.max.hp * .25);
          else if (heavy) this.shake(false);
          this.refreshUnit(t); await this.wait(e.kind === 'mag' ? 145 : 200); break;
        }
        case 'miss': this.pop(t, 'MISS', 'miss'); Sound.play('miss', { vol: .4 }); await this.wait(200); break;
        case 'heal': if (e.amount > 0) { this.fxBurst(t, this._fxAction ? this._fxAction.key : 'Sam', 'heal'); this.pop(t, '+' + e.amount, 'heal'); Sound.play('heal_soft', { vol: .35, throttle: 60 }); } this.refreshUnit(t); await this.wait(140); break;
        case 'fp': this.pop(t, `+${e.amount} FP`, 'fp'); this.refreshUnit(t); await this.wait(90); break;
        case 'dot': this.pop(t, e.amount, 'ink'); Sound.play('hit_water', { vol: .3 }); this.refreshUnit(t); await this.wait(260); break;
        case 'status': {
          const ic = ST_STATUS_ICON[e.k];
          if (ic && !e.resisted) { this.fxBurst(t, this._fxAction ? this._fxAction.key : t.side === 'p' ? t.key : 'foe', ic[1]); this.pop(t, ic[2].toUpperCase(), ic[1] === 'buff' ? 'buff' : 'debuff'); Sound.play(ic[1] === 'buff' ? 'buff' : 'spectral', { vol: .25, throttle: 60 }); }
          this.refreshUnit(t); await this.wait(85); break;
        }
        case 'expire': case 'cleanse': case 'recover': this.refreshUnit(t); if (e.t === 'cleanse') this.pop(t, 'CLEANSED', 'buff'); break;
        case 'stagger': this.refreshUnit(t); break;
        case 'break':
          this.fxBurst(t, 'Shannon', 'break', true);
          this.pop(t, 'BREAK!', 'break'); this.flash('#ffe36d'); this.shake(true);
          Sound.play('shatter', { vol: .55 }); Sound.play('guardbreak', { vol: .4 });
          this.banner(e.cancelled ? 'BREAK! ATTACK CANCELLED' : 'BREAK!', 'break');
          this.refreshUnit(t); await this.wait(650); break;
        case 'ko':
          if (t.side === 'e') {
            await back();
            const node = this.unitEl(t); if (node) { node.classList.add('stb-gone'); setTimeout(() => node.remove(), 700); }
            Sound.play('tw_blot_down', { vol: .45 }); this.run.killed++;
            await this.wait(480); this.layoutFoes(320); this.drawOrder();
          } else { this.pop(t, 'DOWN', 'hurt'); Sound.play('toon_death', { vol: .45 }); this.refreshUnit(t); await this.wait(420); }
          break;
        case 'revive': this.fxBurst(t, 'Sam', 'heal', true); this.pop(t, 'REVIVED', 'heal'); Sound.play('heal', { vol: .5 }); this.refreshUnit(t); await this.wait(300); break;
        case 'summon': this.drawFoes(); this.layoutFoes(320); Sound.play('tw_blot_skill', { vol: .45 }); this.say(`<b class="foe">${U(e.by).name}</b> calls more Ichor!`); await this.wait(420); break;
        case 'phase':
          this.flash('#000'); this.shake(true); this.banner(e.text, 'phase'); this.say(e.text, 'big');
          Sound.play('twisted_found', { vol: .5 }); await this.wait(1300); break;
        case 'text': this.say(e.text, e.cls || ''); await this.wait(420); break;
        case 'end': break;
      }
    }
    await back();
  },

  async cutin(a, e) {
    const h = stChar(a.key), c = this.el.cutin;
    c.style.setProperty('--hc', h.color); c.style.setProperty('--ha', h.accent);
    c.innerHTML = `<div class="ms-ci-band"></div>${h.kind === 'toon' ? '' : `<img class="ms-ci-h" src="${ASSET + h.art}" alt="">`}<img class="ms-ci-t${h.kind === 'toon' ? ' solo' : ''}" src="${h.kind === 'toon' ? stCharUrl(a.key) : stToonArt(h.toon)}" alt="">
      <div class="ms-ci-copy"><small>${e.line}</small><b>${e.name}</b></div>`;
    c.classList.remove('go'); void c.offsetWidth; c.classList.add('go');
    Sound.play('ult', { vol: .55 }); Sound.play(ST_VOICE[h.toon] && ST_VOICE[h.toon].cue || 'sparkle', { vol: .5, delay: 250 });
    await this.wait(1700);
    this.flash(h.color);
    c.classList.remove('go');
  },

  /* ---------- wave / result ---------- */
  async endWave() {
    const r = this.run, B = this.B, n = r.n;
    this.el.cmd.innerHTML = '';
    r.items = B.items;
    if (!B.win) { await this.wait(400); this.defeat(); return; }
    this.arena.querySelectorAll('.stb-turn').forEach(x => x.classList.remove('stb-turn'));
    // Experience is shared out per wave so a loss still keeps what was earned.
    const expW = B.foes().reduce((a, u) => a + (u.exp || 1) * (8 + u.lv * 4), 0) * (r.mode === 'hard' ? 1.6 : 1);
    r.exp += expW;
    B.party().forEach(u => { r.carry[u.key] = { hp: u.alive ? Math.min(u.max.hp, Math.round(u.hp + u.max.hp * .25)) : 0, fp: Math.min(u.max.fp, u.fp + 6), bond: u.bond }; });
    if (r.wave < n[r.mode].length - 1) {
      this.banner('WAVE CLEAR', 'win'); Sound.play('get_item', { vol: .45 });
      await this.wait(1400);
      r.wave++; this.launchWave(); return;
    }
    this.victory();
  },

  /* Shop stock is used after the free supplies; spend whatever the fight consumed. */
  settleStock() {
    const r = this.run; if (!r || !r.stock) return;
    const st = MainStory.state(); if (!st.shop) return;
    Object.keys(r.stock).forEach(k => {
      const used = Math.max(0, (r.base[k] || 0) + r.stock[k] - (r.items[k] || 0)), spent = Math.min(r.stock[k], Math.max(0, used - (r.base[k] || 0)));
      if (spent > 0) st.shop.items[k] = Math.max(0, (st.shop.items[k] || 0) - spent);
    });
    r.stock = null; Save.write();
  },

  victory() {
    const r = this.run, n = r.n, c = MainStory.state().cleared[r.i] || {}, first = !c[r.mode];
    this.settleStock();
    const tapesBefore = MainStory.ch === 2 ? ST2_TAPES.filter(t => MainStory.tapeOpen(t)).length : 0;
    const stockBefore = MainStory.ch === 2 ? new Set(ST2_SHOP.filter(p => MainStory.shopItemOpen(p)).map(p => p.id)) : null;
    const ups = {};
    r.ids.forEach(id => { ups[id] = MainStory.addExp(id, r.exp); });
    const rew = MainStory.rewards(n, r.mode, first);
    Save.give(rew, true);
    MainStory.mark(r.i, r.mode);
    const skin = r.mode === 'hard' && first && n.skin ? ST_SKINS[n.skin] : null;
    Sound.play('arena_fanfare', { vol: .5 });
    if (MainStory.ch === 2) ST2_TAPES.filter(t => MainStory.tapeOpen(t)).slice(tapesBefore).forEach((t, k) => setTimeout(() => UI.toast(`📼 New tape: ${t.title}`), 1200 + k * 600));
    if (stockBefore) {
      const newStock = ST2_SHOP.filter(p => !stockBefore.has(p.id) && MainStory.shopItemOpen(p)).map(p => ST_ITEMS[p.id].name);
      if (newStock.length) setTimeout(() => UI.toast(`🔓 Dandy’s Shop: ${newStock.join(', ')}`), 1900);
    }
    this.closeBattle();
    StoryUI.sel = MainStory.nodes[r.i + 1] ? r.i + 1 : r.i;
    StoryUI.pendingResult = { win: true, n, mode: r.mode, first, rew, ups, exp: Math.round(r.exp), ids: r.ids, skin, next: first && r.mode === 'easy' && MainStory.nodes[r.i + 1] ? r.i + 1 : null };
    if (Screens.cur === 'story') Screens.render(); else Screens.go('story');
  },

  defeat() {
    const r = this.run;
    this.settleStock();
    r.ids.forEach(id => MainStory.addExp(id, r.exp * .5));
    Save.write();
    this.arena.classList.add('stb-lost');
    Music.play('stEmotional');
    this.el.cmd.innerHTML = `<div class="ms-defeat"><b>THE ICHOR TAKES YOU</b><p>${r.exp ? `${MainStory.ch === 2 ? 'The Toons' : 'The Handlers'} keep ${fmt(Math.round(r.exp * .5))} EXP from the attempt.` : 'Guard when hurt, and Break enemies that are charging.'}</p>
      <div><button data-d="retry">Try again</button><button data-d="leave">Leave</button></div></div>`;
    this.el.cmd.querySelector('[data-d="retry"]').onclick = () => { Sound.play('choose'); const { i, mode, ids } = r; this.closeBattle(true); this.start(i, mode, ids); };
    this.el.cmd.querySelector('[data-d="leave"]').onclick = () => { Sound.play('ui_back'); this.closeBattle(); if (Screens.cur === 'story') Screens.render(); else Screens.go('story'); };
  },

  confirmQuit() {
    if (this.root.querySelector('.ms-quit')) return;
    const q = el('div', 'ms-quit', '<div><b>Retreat?</b><p>This battle’s progress will be lost.</p><button data-q="y">Retreat</button><button data-q="n">Keep fighting</button></div>');
    Sound.play('ui_open', { vol: .3 });
    this.root.appendChild(q);
    q.querySelector('[data-q="n"]').onclick = () => q.remove();
    q.querySelector('[data-q="y"]').onclick = () => { Sound.play('ui_back'); this.closeBattle(); if (Screens.cur === 'story') Screens.render(); else Screens.go('story'); };
  },

  /* Hand the arena back to the auto battler exactly as it found it. */
  closeBattle(keepOverlay) {
    if (this.root) this.root.remove();
    this.root = null; this.pendingPick = null; this._targetPick = null; this.B = null;
    clearTimeout(this._banT);
    const arena = this.arena || $('#battle');
    arena.classList.remove('story-tb', 'stb-lost');
    this.el.stage.classList.remove('stb-shake', 'stb-shake-big');
    clear($('#unitLayer')); clear($('#allyDock')); clear($('#logBox'));
    $('#hudTimerText').textContent = '3:00';
    if (typeof BattleScreen !== 'undefined') BattleScreen.bindHud();
    if (keepOverlay) return;
    arena.hidden = true; $('#app').hidden = false;
    StoryUI.overlay = false; Music.play(StoryUI.hubTrack());
  },

  showResult(r) {
    const box = el('div', 'ms-result');
    box.innerHTML = `<h3>${r.first ? 'VICTORY' : 'CLEARED'}</h3><small>${r.n.name} · ${r.mode === 'hard' ? 'HARD' : 'EASY'}</small>
      <div class="ms-res-party">${r.ids.map(id => { const l = MainStory.lv(id); return `<span style="--hc:${stChar(id).color}"><img src="${stCharUrl(id)}" alt=""><b>LV ${l.lv}</b>${r.ups[id] ? `<em>LEVEL UP${r.ups[id] > 1 ? ' ×' + r.ups[id] : ''}!</em>` : ''}<u><s style="width:${Math.round(l.exp / stExpNeed(l.lv) * 100)}%"></s></u></span>`; }).join('')}</div>
      <p class="ms-res-exp">+${fmt(r.exp)} ${MainStory.ch === 2 ? 'Toon' : 'Handler'} EXP each</p>
      <div class="ms-rewards"><div>${Object.keys(r.rew).filter(k => RES[k]).map(k => `<span>${RES[k].icon}<b>${fmt(r.rew[k])}</b></span>`).join('')}</div></div>
      ${r.skin ? `<div class="ms-res-skin"><img src="${ASSET + r.skin.art}" alt=""><div><small>SKIN UNLOCKED</small><b>${r.skin.name}</b><p>Equip it on ${Object.keys(ST_SKINS).find(k => ST_SKINS[k] === r.skin)}’s Hero page.</p></div></div>` : ''}
      <button class="ms-go" type="button">${r.next != null ? 'Continue the story ›' : 'Done'}</button>`;
    if (r.skin) { Sound.play('get_rare', { vol: .6 }); this.confetti(box); }
    box.querySelector('.ms-go').onclick = () => {
      UI.closeModal({ skipHook: true });
      if (r.next != null) { const nx = MainStory.nodes[r.next]; if (nx.type === 'story') StoryUI.playScene(r.next, true); else StoryUI.prep(r.next); }
    };
    UI.modal('', box, { className: 'ms-modal ms-result-modal', bare: true });
  },
  confetti(box) {
    for (let k = 0; k < 24; k++) { const p = el('i', 'ms-confetti'); p.style.left = rnd(0, 100) + '%'; p.style.background = ['#ff5a5f', '#f3b04a', '#46d65a', '#6f8cff', '#d9dde2'][k % 5]; p.style.animationDelay = rnd(0, .6) + 's'; box.appendChild(p); }
  }
};
