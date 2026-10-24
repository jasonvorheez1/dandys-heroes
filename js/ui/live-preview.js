/* live-preview.js - the hero file's skill previewer.
   It does not draw an imitation: it moves the real #battle arena into the
   preview box, starts a real Battle with the Hero against training dummies and
   makes the Hero perform the selected move through the same AI entry points a
   fight uses (AI.beginBasic / AI.beginCast). Every effect, projectile, sound,
   status and number on screen is the one combat produces. Passives run a short
   free fight, because they only exist while combat is happening. */
'use strict';

const LivePreview = {
  host: null, battle: null, battleEl: null, home: null,
  token: 0, poll: null, timers: [],
  speed: 1, paused: false, VIEW: 320, viewX: 54,

  /** Put the real arena inside `host` (a .skill-preview-live box). */
  mount(host) {
    const arena = $('#battle') || this.battleEl;
    if (!arena) return false;
    if (!this.home) this.home = { parent: arena.parentNode, next: arena.nextSibling };
    this.battleEl = arena;
    host.appendChild(arena);
    arena.hidden = false;
    arena.classList.add('live-preview');
    this.host = host;
    // Battle.start measures #battle: it must be unscaled at that moment.
    this.stageEl = host.closest('.skill-preview-live');
    this.stageEl.style.setProperty('--live-k', 1); this.stageEl.style.setProperty('--live-x', '0px');
    return true;
  },

  /** Scale the fixed 560x260 arena so a VIEW-wide slice of it (centred on the
      action, this.viewX) fills the box. Combat still runs on the full stage. */
  fit() {
    const st = this.stageEl;
    if (!st || !st.isConnected) return;
    const w = st.clientWidth;
    if (w <= 0) return;
    const k = w / this.VIEW;
    st.style.setProperty('--live-k', k.toFixed(4));
    st.style.setProperty('--live-x', (-this.viewX * k).toFixed(1) + 'px');
  },

  /** Hand the arena back to the page and silence whatever was playing. */
  stop() {
    this.token++;
    clearInterval(this.poll); this.poll = null;
    this.timers.forEach(clearTimeout); this.timers = [];
    this.retire(this.battle); this.battle = null;
    if (this.battleEl && this.home) {
      this.battleEl.classList.remove('live-preview', 'kh-battle', 'unknown-world-battle', 'qom-battle');
      this.battleEl.hidden = true;
      this.home.parent.insertBefore(this.battleEl, this.home.next && this.home.next.parentNode === this.home.parent ? this.home.next : null);
      FX.clear();
    }
    if (this.ro) { this.ro.disconnect(); this.ro = null; }
    this.host = null; this.stageEl = null;
  },

  /** A finished battle keeps pumping FX for a moment; cut that off so it can
      never paint over the next run that reuses the same arena elements. */
  retire(b) {
    if (!b) return;
    b.running = false; b.over = true; b._fxGrace = 0; b._exitWalking = false;
  },

  after(ms, fn) { const t = setTimeout(fn, ms); this.timers.push(t); return t; },

  /** (Re)start the preview in `stage`; `stage._live` = { id, key, skill }. */
  play(stage) {
    if (!stage || !stage.isConnected || !stage._live) return;
    const { id, key } = stage._live;
    const token = ++this.token;
    clearInterval(this.poll); this.poll = null;
    this.timers.forEach(clearTimeout); this.timers = [];
    this.retire(this.battle); this.battle = null;
    if (!this.mount($('.live-arena', stage))) return;
    const passive = key !== 'basic' && !(stage._live.skill && stage._live.skill.cast);

    const hero = playerSpec(id);
    // Previewing a skill the Hero has not unlocked yet is allowed.
    if (key !== 'basic') hero.rarity = Math.max(hero.rarity, SKILL_RARITY[key] || 1);
    const lvl = Math.max(1, hero.level);
    const dummy = n => Object.assign(makeWeakling('Sponge', lvl), { name: 'Training Dummy ' + n, mult: { hp: 80, atk: 1, def: 1 } });
    const ally = Object.assign(makeWeakling('Sponge', lvl), { name: 'Training Buddy', carryHp: .55, mult: { hp: 6, atk: 1, def: 1 } });
    const b = new Battle();
    this.battle = b;
    b.speed = this.speed; b.paused = this.paused;
    b.autoWhite = false;
    // No walk-in: place everyone for the move and start the real loop.
    b.introWalk = onDone => {
      const [h, a, d1, d2] = b.units;
      const reach = clamp(h.st.range * b.rangeScale * .85, 110, 160);
      const place = (u, x, depth, face) => {
        u.x = x; u.homeX = x; u.depth = depth; u.y = b.ground - depth * b.depthSpan; u.face = face;
        u.moving = false; u._introLanded = true;
        if (u._introOpacity === 0) { u._introOpacity = 1; u._introRevealed = true; }
        u._introYOffset = 0;
      };
      // Sit the floor low in the box so tall Heroes keep their heads in view.
      b.ground = 232;
      const floorEl = $('#floorLine');
      if (floorEl) floorEl.style.height = (b.H - b.ground + b.depthSpan + 24) + 'px';
      const lx = b.leftWall + 96;
      place(h, lx, .5, 1);
      place(a, b.leftWall + 34, .18, 1);
      place(d1, Math.min(lx + reach, b.rightWall - 70), .5, -1);
      place(d2, Math.min(lx + reach + 50, b.rightWall - 22), .82, -1);
      this.viewX = clamp((h.x - 50 + d2.x + 50) / 2 - this.VIEW / 2, 0, 560 - this.VIEW);
      h.previewActor = true;
      if (!passive) { h.previewHold = true; [a, d1, d2].forEach(u => { u.previewDummy = true; }); }
      else { a.previewDummy = true; }
      onDone();
    };
    // Report the logical stage size: layout transforms (this box's scale, the
    // modal's pop-in) must never leak into combat distances.
    const arena = this.battleEl, measured = arena.getBoundingClientRect;
    arena.getBoundingClientRect = () => ({ x: 0, y: 0, left: 0, top: 0, right: 560, bottom: 300, width: 560, height: 300 });
    try { b.start([hero, ally], [dummy(1), dummy(2)], { preview: true, title: 'Preview', timeLimit: 9999, bg: this.backdrop(id) }); }
    finally { arena.getBoundingClientRect = measured; }
    $('#battleEnd').hidden = true;
    this.fit();
    if (!this.ro && typeof ResizeObserver !== 'undefined') {
      this.ro = new ResizeObserver(() => this.fit());
      this.ro.observe(this.stageEl);
    }
    const actor = b.units[0], foe = b.units[2];
    let firedAt = null, firedOk = true;
    const runs = passive ? 7.5 : 6;

    this.after(650, () => {
      if (token !== this.token || !actor.alive) return;
      actor.energy = actor.energyMax;
      firedAt = b.t;
      if (passive) return;                    // real combat takes over
      if (key === 'basic') AI.beginBasic(actor, b, foe);
      else firedOk = AI.beginCast(actor, b, key, true) !== false;
    });
    // Replay once the move has fully played out (or the cap is reached).
    this.poll = setInterval(() => {
      if (token !== this.token) return;
      if (!stage.isConnected) { this.stop(); return; }
      if (firedAt == null || b.paused) return;
      const since = b.t - firedAt;
      const settled = !actor.casting && !actor.pendingHit && !b.timers.length;
      if (since > runs || (!passive && since > 1.6 && settled) || (!firedOk && since > .5)) {
        clearInterval(this.poll); this.poll = null;
        this.after(900, () => { if (token === this.token) this.play(stage); });
      }
    }, 120);
  },

  /** A bright, readable room per Hero (the battle arenas are tuned dark). */
  backdrop(id) {
    const maps = ['rainbow-rooms', 'art-floor', 'library-floor', 'vee-floor', 'greenhouse'];
    const hash = id.split('').reduce((n, c) => n + c.charCodeAt(0), 0);
    return bgForMap(maps[hash % maps.length]);
  },

  setSpeed(v) { this.speed = v; if (this.battle) this.battle.speed = v; },
  setPaused(on) { this.paused = !!on; if (this.battle) this.battle.paused = !!on; }
};
