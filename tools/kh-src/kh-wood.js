/* kh-wood.js - Hundred Acre Wood. Pooh's storybook: six canvas mini-games played in a
   full-screen layer, with ranks that pay Munny and Hunny. Hunny unlocks the later pages. */
'use strict';

const WOOD_W = 360, WOOD_H = 640;
const WOOD_IMGS = {
  pooh: 'assets/kh/wood/vn/pooh.webp', tigger: 'assets/kh/wood/vn/tigger.webp', piglet: 'assets/kh/wood/vn/piglet.webp',
  eeyore: 'assets/kh/wood/vn/eeyore.webp', rabbit: 'assets/kh/wood/vn/rabbit.webp', pot: 'assets/kh/wood/pot.png',
  potGold: 'assets/kh/wood/pot-gold.png', bee: 'assets/kh/wood/bee.png', crate: 'assets/kh/wood/crate.png',
  skate: 'assets/kh/wood/eclipse-skate.png', shadow: 'assets/kh/art/shadow.png', soldier: 'assets/kh/art/soldier.png',
  largebody: 'assets/kh/art/largebody.png', bg: 'uploads/hundredacrewoodsbg.jpg', house: 'uploads/poohshouse.webp'
};
/* Which tracks a page may use. The Escapade leads, but it is not the only music in the Wood. */
const WOOD_MUSIC = {
  hunny: ['khEscapade', 'khEscapade', 'khMenu'], garden: ['khEscapade', 'khTown', 'khMenu'], bounce: ['khEscapade', 'khMenu'],
  seek: ['khMenu', 'khDearly', 'khEscapade'], tail: ['khDearly', 'khMenu'], skate: ['khEscapade', 'khEscapade', 'khTown']
};
const WOOD_GAMES = [
  { id: 'hunny', name: 'Hunny Hunt', who: 'Pooh', art: 'pooh', unlock: 0, ranks: [100, 200, 320], unit: 'points',
    blurb: 'Drag Pooh under the pots. Chain catches for a bigger multiplier, grab the balloon to slow things down.' },
  { id: 'garden', name: 'Rabbit’s Garden', who: 'Rabbit', art: 'rabbit', unlock: 0, ranks: [200, 380, 560], unit: 'points',
    blurb: 'Tap the Heartless before they steal the vegetable crates. Armoured ones take more hits. Leave Rabbit alone.' },
  { id: 'bounce', name: 'Tigger’s Hop', who: 'Tigger', art: 'tigger', unlock: 4, ranks: [30, 60, 95], unit: 'points',
    blurb: 'Hold to charge, release to hop to the next pad. Land in the middle for a perfect. Lily pads sink.' },
  { id: 'seek', name: 'Piglet’s Pots', who: 'Piglet', art: 'piglet', unlock: 8, ranks: [450, 850, 1250], unit: 'points',
    blurb: 'Watch which pot Piglet hides under, follow the shuffle, then pick. Three wrong picks and you are out.' },
  { id: 'tail', name: 'Eeyore’s Tail', who: 'Eeyore', art: 'eeyore', unlock: 12, ranks: [350, 550, 700], unit: 'points',
    blurb: 'Drag the tail to Eeyore and let go on the spot. He walks, turns around, and Tigger keeps bouncing through.' },
  { id: 'skate', name: 'Eclipse’s Skate Run', who: 'Eclipse', art: 'skate', unlock: 18, ranks: [800, 1700, 2800], unit: 'points',
    blurb: 'Hold to ollie higher. Swipe in the air for different tricks. Ramps launch big, gaps swallow you, hunny pots make you fly.' }
];
/* The Wood reuses the game's own sounds. */
const WOOD_SFX = { bounce: 'bounce', bee: 'hit_light', ollie: 'jump', trick: 'spin', crash: 'dizzy', page: 'ui_open', win: 'get_item', hit: 'hit_light', pick: 'ui_ok', zap: 'shock', land: 'land' };
const WOOD_RANK = ['Try again', 'Bronze', 'Silver', 'Gold'];
const WOOD_FONT = 'Georgia, "Times New Roman", serif';

const WoodArena = {
  _imgs: null,
  load() {
    if (this._imgs) return Promise.resolve(this._imgs);
    const out = {};
    return Promise.all(Object.entries(WOOD_IMGS).map(([k, src]) => new Promise(res => {
      const im = new Image(); im.onload = im.onerror = () => { out[k] = im; res(); }; im.src = ASSET + src;
    }))).then(() => (this._imgs = out));
  },
  rankOf(game, score) { let r = 0; game.ranks.forEach((t, i) => { if (score >= t) r = i + 1; }); return r; },

  /* Runs one page in a full-screen layer. */
  play(game, hooks) {
    hooks = hooks || {};
    const track = pick(WOOD_MUSIC[game.id] || ['khEscapade']);
    this.load().then(imgs => {
      const root = el('div', 'wd');
      root.innerHTML = `<div class="wd-frame"><canvas class="wd-canvas" width="${WOOD_W}" height="${WOOD_H}"></canvas>
        <div class="wd-hud"><span class="wd-name">${game.name}</span><span class="wd-score">0</span><span class="wd-time"></span><button class="wd-leave" type="button">Leave</button></div>
        <div class="wd-goal" title="Bronze, Silver, Gold"><i></i><b style="left:${game.ranks[0] / game.ranks[2] * 100}%"></b><b style="left:${game.ranks[1] / game.ranks[2] * 100}%"></b><b style="left:100%"></b></div>
        <div class="wd-center"></div></div>`;
      document.body.appendChild(root);
      const canvas = $('.wd-canvas', root), ctx = canvas.getContext('2d');
      const scoreEl = $('.wd-score', root), timeEl = $('.wd-time', root), center = $('.wd-center', root), goalEl = $('.wd-goal i', root);
      Music.play(track);
      let raf = 0, last = performance.now(), phase = 'count', countT = 3.2, closed = false, shakeT = 0, pops = [], parts = [], flashT = 0, flashC = '#fff', g = null, elapsed = 0, shown = -1;
      const api = {
        W: WOOD_W, H: WOOD_H, imgs,
        sfx: (name, vol) => Sound.play(WOOD_SFX[name] || name, { vol: vol == null ? .6 : vol, throttle: 40 }),
        say: name => Sound.play('pooh_' + name, { vol: .7, throttle: 900 }),
        shake: (n) => { shakeT = n || .25; },
        flash: c => { flashT = .18; flashC = c || '#fff'; },
        pop: (x, y, text, color, size) => pops.push({ x, y, text, color: color || '#fff', size: size || 22, t: 0 }),
        burst: (x, y, color, n, speed) => { for (let i = 0; i < (n || 10); i++) { const a = Math.random() * 6.283, v = (speed || 140) * (.4 + Math.random() * .8); parts.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 40, life: .5 + Math.random() * .4, t: 0, c: color || '#ffe066', r: 2 + Math.random() * 3 }); } },
        finish: () => { if (phase === 'play') end(); }
      };
      g = WOOD_BUILD[game.id](api);
      const pt = e => { const r = canvas.getBoundingClientRect(); return [(e.clientX - r.left) / r.width * WOOD_W, (e.clientY - r.top) / r.height * WOOD_H]; };
      canvas.addEventListener('pointerdown', e => { e.preventDefault(); if (phase === 'play' && g.down) g.down(...pt(e)); try { canvas.setPointerCapture(e.pointerId); } catch (_) {} });
      canvas.addEventListener('pointermove', e => { if (phase === 'play' && g.move) g.move(...pt(e)); });
      const release = e => { if (phase === 'play' && g.up) g.up(...pt(e)); };
      canvas.addEventListener('pointerup', release); canvas.addEventListener('pointercancel', release);
      const keyDown = e => { if ((e.code === 'Space' || e.key === ' ') && !e.repeat) { e.preventDefault(); if (phase === 'play' && g.down) g.down(-1, -1, true); } else if (e.key === 'Escape') leave(); };
      const keyUp = e => { if (e.code === 'Space' || e.key === ' ') { if (phase === 'play' && g.up) g.up(-1, -1, true); } };
      document.addEventListener('keydown', keyDown); document.addEventListener('keyup', keyUp);
      const stop = () => { closed = true; cancelAnimationFrame(raf); document.removeEventListener('keydown', keyDown); document.removeEventListener('keyup', keyUp); root.remove(); };
      const leave = () => { if (closed) return; stop(); Music.play('khEscapade'); if (hooks.onLeave) hooks.onLeave(); };
      $('.wd-leave', root).onclick = () => { Sound.play('ui_back'); leave(); };

      const end = () => {
        phase = 'end';
        const score = Math.round(g.score), rank = this.rankOf(game, score);
        const pay = KHEvent.woodRecord(game, score, rank);
        api.sfx(rank ? 'win' : 'crash', .6); if (rank >= 2) api.say('yummy'); else if (rank === 1) api.say('ooh');
        if (rank === 3) setTimeout(() => api.say('alot'), 900);
        const next = game.ranks[rank] != null ? game.ranks[rank] : null;
        const extra = g.report ? g.report() : '';
        center.innerHTML = `<div class="wd-result"><small>${game.name}</small><h2 class="rank-${rank}">${WOOD_RANK[rank]}</h2>
          <p class="wd-big">${fmt(score)}<span> ${game.unit}</span></p>
          <p class="wd-best">${pay.newBest ? 'New best!' : 'Best ' + fmt(pay.best)}${next != null ? ` · ${WOOD_RANK[rank + 1]} at ${fmt(next)}` : ' · Top rank'}</p>
          ${extra ? `<p class="wd-extra">${extra}</p>` : ''}
          <div class="wd-pay"><span><i class="kh-munny"></i>+${fmt(pay.munny)} Munny</span><span><i class="wd-hunny"></i>+${fmt(pay.hunny)} Hunny</span></div>
          ${pay.unlocked.length ? `<p class="wd-unlock">New page: ${pay.unlocked.map(x => x.name).join(', ')}</p>` : ''}
          <div class="wd-btns"><button class="wd-btn" data-again>Play again</button><button class="wd-btn alt" data-back>Back to the book</button></div></div>`;
        $('[data-again]', center).onclick = () => { stop(); Sound.play('ui_ok'); api.say('more'); this.play(game, hooks); };
        $('[data-back]', center).onclick = () => { Sound.play('ui_back'); leave(); };
      };

      const frame = now => {
        if (closed) return;
        const dt = Math.min(.05, (now - last) / 1000); last = now;
        if (phase === 'count') {
          countT -= dt;
          center.innerHTML = countT > 0 ? `<div class="wd-count"><small>${game.who}</small><b>${countT > 2.2 ? 'Ready' : countT > 1.1 ? 'Set' : 'Go'}</b><p>${game.blurb}</p></div>` : '';
          if (countT <= 0) { phase = 'play'; center.innerHTML = ''; elapsed = 0; if (game.id === 'hunny') api.say('ooh'); }
        } else if (phase === 'play') {
          elapsed += dt; g.update(dt);
          if (g.dur && elapsed >= g.dur) end();
        }
        ctx.save();
        if (shakeT > 0) { shakeT -= dt; ctx.translate((Math.random() - .5) * 9, (Math.random() - .5) * 9); }
        ctx.clearRect(0, 0, WOOD_W, WOOD_H);
        g.draw(ctx);
        parts.forEach(p => { p.t += dt; p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 420 * dt; ctx.globalAlpha = Math.max(0, 1 - p.t / p.life); ctx.fillStyle = p.c; ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, 7); ctx.fill(); });
        parts = parts.filter(p => p.t < p.life); ctx.globalAlpha = 1;
        pops.forEach(p => {
          p.t += dt; ctx.globalAlpha = Math.max(0, 1 - p.t / .9); ctx.fillStyle = p.color; ctx.font = `italic 800 ${p.size}px ${WOOD_FONT}`; ctx.textAlign = 'center';
          ctx.strokeStyle = '#000b'; ctx.lineWidth = 4; ctx.strokeText(p.text, p.x, p.y - p.t * 46); ctx.fillText(p.text, p.x, p.y - p.t * 46);
        });
        pops = pops.filter(p => p.t < .9); ctx.globalAlpha = 1;
        if (flashT > 0) { flashT -= dt; ctx.globalAlpha = Math.max(0, flashT / .18) * .35; ctx.fillStyle = flashC; ctx.fillRect(0, 0, WOOD_W, WOOD_H); ctx.globalAlpha = 1; }
        ctx.restore();
        const sc = Math.round(g.score || 0);
        if (sc !== shown) { shown = sc; scoreEl.textContent = fmt(sc); goalEl.style.width = Math.min(100, sc / game.ranks[2] * 100) + '%'; }
        timeEl.textContent = g.dur ? Math.max(0, Math.ceil(g.dur - elapsed)) + 's' : (g.status ? g.status() : '');
        raf = requestAnimationFrame(frame);
      };
      raf = requestAnimationFrame(frame);
    });
  }
};

/* ---------------- helpers ---------------- */
function woodSprite(c, im, cx, cy, w, ang, flip) {
  if (!im || !im.width) return;
  const h = w * im.height / im.width;
  c.save(); c.translate(cx, cy); if (ang) c.rotate(ang); if (flip) c.scale(-1, 1);
  c.drawImage(im, -w / 2, -h / 2, w, h); c.restore();
}
function woodCover(c, im, tint) {
  if (im && im.width) {
    const k = Math.max(WOOD_W / im.width, WOOD_H / im.height), w = im.width * k, h = im.height * k;
    c.drawImage(im, (WOOD_W - w) / 2, (WOOD_H - h) / 2, w, h);
  } else { c.fillStyle = '#6fb04c'; c.fillRect(0, 0, WOOD_W, WOOD_H); }
  if (tint) { c.fillStyle = tint; c.fillRect(0, 0, WOOD_W, WOOD_H); }
}
function woodText(c, text, x, y, size, color, align) {
  c.font = `italic 800 ${size}px ${WOOD_FONT}`; c.textAlign = align || 'center'; c.strokeStyle = '#000b'; c.lineWidth = 4;
  c.strokeText(text, x, y); c.fillStyle = color || '#fff'; c.fillText(text, x, y);
}
const woodRand = (a, b) => a + Math.random() * (b - a);
const woodClamp = (v, a, b) => Math.max(a, Math.min(b, v));

/* ---------------- the six games ---------------- */
const WOOD_BUILD = {
  /* Pooh: a streak game. Catch pots to build a multiplier; missing one costs it. */
  hunny(api) {
    const { W, H, imgs } = api; const PY = H - 118;
    let x = W / 2, tx = W / 2, items = [], t = 0, spawn = .4, stun = 0, score = 0, streak = 0, bestStreak = 0, caught = 0, slow = 0, magnet = 0, puddles = [], rain = 0, wob = 0;
    const mult = () => Math.min(5, 1 + Math.floor(streak / 5));
    const spawnItem = (kind) => items.push({ x: woodRand(34, W - 34), y: -34, v: (150 + t * 3.4 + woodRand(0, 55)), k: kind, rot: woodRand(0, 6) });
    return {
      dur: 50, get score() { return score; },
      get dbg() { return { items, x }; },
      report() { return `Caught ${caught} · best streak ${bestStreak}`; },
      status() { return mult() > 1 ? 'x' + mult() : ''; },
      down(px) { if (px >= 0) tx = px; }, move(px) { tx = px; },
      update(dt) {
        t += dt; x += (tx - x) * Math.min(1, dt * 15); stun = Math.max(0, stun - dt); slow = Math.max(0, slow - dt); magnet = Math.max(0, magnet - dt); wob = Math.max(0, wob - dt * 4);
        const inRain = (t > 14 && t < 18) || (t > 33 && t < 37);
        if (inRain && rain <= 0) { api.pop(W / 2, 200, 'Hunny rain!', '#ffe066', 30); api.flash('#ffd34d'); }
        rain = inRain ? 1 : 0;
        spawn -= dt * (slow > 0 ? .6 : 1);
        if (spawn <= 0) {
          spawn = inRain ? .16 : Math.max(.24, .7 - t * .008);
          const r = Math.random();
          if (inRain) spawnItem(r < .25 ? 'gold' : 'pot');
          else if (r < .14) { const bx = woodRand(60, W - 60); for (let i = 0; i < 3; i++) items.push({ x: bx + (i - 1) * 36, y: -34 - i * 26, v: 150 + t * 3.4, k: 'bee', rot: woodRand(0, 6) }); }
          else if (r < .20) spawnItem('balloon');
          else if (r < .25) spawnItem('comb');
          else spawnItem(r < .36 ? 'gold' : 'pot');
        }
        const vmul = slow > 0 ? .55 : 1;
        items = items.filter(it => {
          it.rot += dt * 2.4; it.y += it.v * vmul * dt;
          if (magnet > 0 && (it.k === 'pot' || it.k === 'gold') && it.y > 80) it.x += (x - it.x) * Math.min(1, dt * 3.2);
          if (Math.abs(it.x - x) < 52 && Math.abs(it.y - PY) < 46) {
            if (it.k === 'bee') { if (stun <= 0) { stun = .8; streak = 0; score = Math.max(0, score - 3); api.sfx('bee'); api.shake(); api.burst(it.x, it.y, '#ff9a9a', 8); api.pop(it.x, it.y, '-3', '#ff8a8a'); } }
            else if (it.k === 'balloon') { slow = 5; api.sfx('bounce'); api.flash('#ff8a8a'); api.pop(it.x, it.y, 'Slow down!', '#ffb0b0'); }
            else if (it.k === 'comb') { magnet = 6; api.sfx('pick'); api.pop(it.x, it.y, 'Honeycomb!', '#ffe066'); }
            else {
              streak++; bestStreak = Math.max(bestStreak, streak); caught++; wob = 1;
              const v = (it.k === 'gold' ? 3 : 1) * mult(); score += v;
              api.sfx('bounce', .3); api.burst(it.x, it.y, it.k === 'gold' ? '#ffe066' : '#ffc23a', it.k === 'gold' ? 14 : 6);
              api.pop(it.x, it.y - 10, '+' + v, it.k === 'gold' ? '#ffe066' : '#fff');
              if (it.k === 'gold') api.say('yummy'); else if (streak === 10 || streak === 25) { api.say('alot'); api.pop(W / 2, 250, streak + ' in a row!', '#ffe066', 28); }
            }
            return false;
          }
          if (it.y > H - 36) {
            if (it.k === 'pot' || it.k === 'gold') { if (streak >= 5) api.pop(it.x, H - 60, 'Streak lost', '#ff8a8a', 18); streak = 0; puddles.push({ x: it.x, t: 0 }); }
            return false;
          }
          return true;
        });
        puddles.forEach(p => { p.t += dt; }); puddles = puddles.filter(p => p.t < 3);
      },
      draw(c) {
        woodCover(c, imgs.bg, slow > 0 ? 'rgba(255,120,120,.12)' : null);
        puddles.forEach(p => { c.globalAlpha = Math.max(0, 1 - p.t / 3); c.fillStyle = '#e8a41c'; c.beginPath(); c.ellipse(p.x, H - 26, 26, 7, 0, 0, 7); c.fill(); }); c.globalAlpha = 1;
        items.forEach(it => {
          if (it.k === 'bee') woodSprite(c, imgs.bee, it.x, it.y, 44, Math.sin(it.rot * 3) * .3);
          else if (it.k === 'balloon') { c.fillStyle = '#e8453c'; c.beginPath(); c.ellipse(it.x, it.y, 17, 21, 0, 0, 7); c.fill(); c.fillStyle = '#ff8b84'; c.beginPath(); c.ellipse(it.x - 5, it.y - 7, 5, 8, 0, 0, 7); c.fill(); c.strokeStyle = '#fff'; c.beginPath(); c.moveTo(it.x, it.y + 21); c.lineTo(it.x + 3, it.y + 44); c.stroke(); }
          else if (it.k === 'comb') { c.fillStyle = '#f5b82e'; for (let i = 0; i < 6; i++) { const a = i / 6 * 6.283; c.beginPath(); c.arc(it.x + Math.cos(a) * 13, it.y + Math.sin(a) * 13, 9, 0, 7); c.fill(); } c.beginPath(); c.arc(it.x, it.y, 10, 0, 7); c.fillStyle = '#ffd36a'; c.fill(); }
          else woodSprite(c, it.k === 'gold' ? imgs.potGold : imgs.pot, it.x, it.y, it.k === 'gold' ? 58 : 52, Math.sin(it.rot) * .25);
        });
        if (magnet > 0) { c.strokeStyle = 'rgba(255,224,102,.5)'; c.lineWidth = 3; c.beginPath(); c.arc(x, PY, 70 + Math.sin(t * 10) * 4, 0, 7); c.stroke(); }
        c.save(); if (stun > 0) c.globalAlpha = .55 + Math.sin(t * 40) * .3;
        const belly = 1 + Math.min(.32, score * .0016) + Math.sin(wob * 6) * .04 * wob;
        c.translate(x, PY + 14); c.rotate((tx - x) * .0016); c.scale(belly, 1 / Math.sqrt(belly) * (1 + wob * .04));
        woodSprite(c, imgs.pooh, 0, -6 + Math.sin(t * 6) * 2, 118, 0); c.restore();
        const m = mult(); if (m > 1) woodText(c, 'x' + m, x, PY - 92, 26, '#ffe066');
        if (slow > 0) woodText(c, 'Slow ' + Math.ceil(slow), 56, 96, 16, '#ffb0b0');
        if (magnet > 0) woodText(c, 'Magnet ' + Math.ceil(magnet), 56, 116, 16, '#ffe066');
        woodText(c, 'Streak ' + streak, W - 54, 96, 16, streak >= 5 ? '#ffe066' : '#fff');
      }
    };
  },

  /* Rabbit's garden: three kinds of Heartless, a thunder token, waves and combos. */
  garden(api) {
    const { W, H, imgs } = api; const xs = [66, 180, 294], ys = [300, 410, 520];
    let t = 0, spawn = .6, score = 0, carrots = 6, holes = [], combo = 0, comboT = 0, wave = 0, waveT = 0, waveBanner = 0, kills = 0, thief = [];
    xs.forEach(hx => ys.forEach(hy => holes.push({ x: hx, y: hy, up: 0, kind: null, hp: 0, life: 0, hit: 0 })));
    const stats = { shadow: { hp: 1, life: 1.3, w: 84, pts: 4, img: 'shadow' }, soldier: { hp: 2, life: 1.8, w: 86, pts: 9, img: 'soldier' }, largebody: { hp: 4, life: 2.6, w: 104, pts: 22, img: 'largebody' } };
    const kill = h => {
      combo = comboT > 0 ? combo + 1 : 1; comboT = 1.1;
      const m = Math.min(4, 1 + Math.floor(combo / 4)), pts = stats[h.kind].pts * m; score += pts; kills++;
      api.sfx('bounce', .35); api.burst(h.x, h.y - 40, '#b9a0ff', 10); api.pop(h.x, h.y - 70, '+' + pts, m > 1 ? '#ffe066' : '#fff');
      h.life = 0; h.up = Math.min(h.up, .6);
    };
    return {
      dur: 0, get score() { return score; },
      get dbg() { return { holes, t }; },
      report() { return `${kills} Heartless beaten`; },
      status() { return `${carrots} crates · wave ${Math.min(3, wave + 1)}`; },
      down(px, py) {
        if (px < 0) return;
        const hole = holes.find(h => h.life > 0 && h.up > .25 && Math.abs(px - h.x) < 52 && Math.abs(py - (h.y - 30)) < 68);
        api.burst(px, py, '#e9e0ff', 4, 90);
        if (!hole) { combo = 0; return; }
        if (hole.kind === 'friend') { score = Math.max(0, score - 12); combo = 0; hole.life = 0; api.sfx('bee', .5); api.shake(); api.pop(hole.x, hole.y - 70, 'Oh, bother!', '#ff8a8a'); return; }
        if (hole.kind === 'thunder') {
          holes.forEach(o => { if (o.life > 0 && stats[o.kind]) { o.hp = 0; kill(o); } });
          hole.life = 0; api.sfx('zap', .6); api.flash('#fff6a0'); api.shake(.35); api.pop(W / 2, 220, 'Thunder!', '#fff6a0', 34); return;
        }
        hole.hp--; hole.hit = .18; api.sfx('hit', .4);
        if (hole.hp <= 0) kill(hole); else api.pop(hole.x, hole.y - 70, 'Clang', '#cfd8dc', 18);
      },
      update(dt) {
        t += dt; comboT = Math.max(0, comboT - dt); if (comboT <= 0) combo = 0; waveT += dt; waveBanner = Math.max(0, waveBanner - dt);
        const wavesAt = [0, 16, 32], total = 48;
        if (wave < 2 && t > wavesAt[wave + 1]) { wave++; waveBanner = 1.6; api.pop(W / 2, 230, 'Wave ' + (wave + 1), '#ffe066', 32); }
        if (t > total) { api.finish(); return; }
        const breather = (t % 16) > 14.4;
        spawn -= dt;
        if (spawn <= 0 && !breather) {
          spawn = Math.max(.34, .85 - wave * .12 - (t % 16) * .008);
          const free = holes.filter(h => h.life <= 0 && h.up < .05);
          if (free.length) {
            const h = pick(free), r = Math.random();
            h.kind = r < .12 ? 'friend' : r < .17 ? 'thunder' : (wave >= 1 && r < .40 + wave * .05) ? 'soldier' : (wave >= 2 && r < .52) ? 'largebody' : 'shadow';
            const s = stats[h.kind];
            h.hp = s ? s.hp : 1; h.life = (s ? s.life : 1.5) * Math.max(.6, 1 - wave * .07); h.hit = 0;
          }
        }
        holes.forEach(h => {
          if (h.life > 0) {
            h.life -= dt; h.up = Math.min(1, h.up + dt * 8);
            if (h.life <= 0 && stats[h.kind]) {
              const lost = h.kind === 'largebody' ? 2 : 1; carrots = Math.max(0, carrots - lost); combo = 0;
              thief.push({ x: h.x, y: h.y - 40, t: 0 }); api.sfx('crash', .35); api.shake(); api.pop(h.x, h.y - 60, lost > 1 ? 'Two crates!' : 'Crate!', '#ffb066');
              if (carrots <= 0) api.finish();
            }
          } else h.up = Math.max(0, h.up - dt * 9);
          h.hit = Math.max(0, h.hit - dt);
        });
        thief.forEach(p => { p.t += dt; }); thief = thief.filter(p => p.t < 1);
      },
      draw(c) {
        woodCover(c, imgs.bg, 'rgba(20,50,10,.18)');
        for (let i = 0; i < 6; i++) { c.globalAlpha = i < carrots ? 1 : .18; woodSprite(c, imgs.crate, 36 + i * 57, 150, 50, 0); } c.globalAlpha = 1;
        holes.forEach(h => {
          c.fillStyle = 'rgba(46,26,10,.92)'; c.beginPath(); c.ellipse(h.x, h.y + 8, 46, 16, 0, 0, 7); c.fill();
          if (h.up > .02) {
            c.save(); c.beginPath(); c.rect(h.x - 70, h.y - 130, 140, 138); c.clip();
            const lift = h.up * 66;
            if (h.kind === 'thunder') { c.fillStyle = '#fff176'; c.shadowColor = '#fff176'; c.shadowBlur = 16; c.beginPath(); c.arc(h.x, h.y + 20 - lift, 24, 0, 7); c.fill(); c.shadowBlur = 0; woodText(c, '⚡', h.x, h.y + 30 - lift, 28, '#6a4a00'); }
            else {
              const im = h.kind === 'friend' ? imgs.rabbit : imgs[stats[h.kind].img], w = h.kind === 'friend' ? 74 : stats[h.kind].w;
              woodSprite(c, im, h.x + (h.hit > 0 ? Math.sin(h.hit * 90) * 5 : 0), h.y + (h.kind === 'friend' ? 54 : 44) - lift, w, 0);
              if (h.kind !== 'friend' && stats[h.kind].hp > 1) { c.fillStyle = '#0008'; c.fillRect(h.x - 24, h.y - 100 + (66 - lift) * 0 - 4, 48, 6); c.fillStyle = '#ffe066'; c.fillRect(h.x - 24, h.y - 100 - 4, 48 * h.hp / stats[h.kind].hp, 6); }
            }
            c.restore();
          }
          c.fillStyle = 'rgba(96,58,26,.96)'; c.beginPath(); c.ellipse(h.x, h.y + 10, 48, 14, 0, 0, Math.PI); c.fill();
        });
        thief.forEach(p => { c.globalAlpha = 1 - p.t; woodSprite(c, imgs.crate, p.x, p.y - p.t * 60, 46, p.t * 2); }); c.globalAlpha = 1;
        if (combo > 1) woodText(c, combo + ' combo', W / 2, 188, 24, '#ffe066');
        if (waveBanner > 0) woodText(c, 'Wave ' + (wave + 1), W / 2, 250, 36, '#fff');
      }
    };
  },

  /* Tigger: charge a hop, land on the pad. Lily pads sink; perfect landings build a multiplier. */
  bounce(api) {
    const { W, H, imgs } = api; const WATER = 540, G = 980, ANG = Math.PI * .31;
    let t = 0, score = 0, pads = [], cam = 0, hops = 0, perfects = 0, streak = 0, charge = 0, charging = false, state = 'stand', cur = 0, tx = 80, ty = 0, vx = 0, vy = 0, splash = 0, stand = 0, bonus = [], lastX = 80;
    const addPad = () => {
      const prev = pads[pads.length - 1], gap = woodRand(95, 230 + Math.min(70, pads.length * 2));
      const kind = pads.length > 4 && Math.random() < .25 ? 'moving' : Math.random() < .3 ? 'log' : 'lily';
      const w = kind === 'log' ? woodRand(82, 108) : woodRand(60, 82) - Math.min(14, pads.length * .5);
      const x = prev.x + prev.w / 2 + gap + w / 2, p = { x, w, kind, y: WATER - woodRand(0, 46), base: x, ph: woodRand(0, 6), sink: 0 };
      pads.push(p);
      if (gap > 160 && Math.random() < .7) bonus.push({ x: prev.x + (x - prev.x) / 2, y: p.y - 150, got: 0 });
    };
    pads.push({ x: 80, w: 100, kind: 'log', y: WATER - 20, base: 80, ph: 0, sink: 0 }); for (let i = 0; i < 8; i++) addPad();
    ty = pads[0].y; const power = () => 250 + charge * 330;
    const padTop = p => p.y + (p.kind === 'lily' ? p.sink * 40 : 0) + (p.kind === 'moving' ? Math.sin(t * 1.6 + p.ph) * 14 : 0);
    const padX = p => p.kind === 'moving' ? p.base + Math.sin(t * 1.3 + p.ph) * 34 : p.x;
    const mult = () => Math.min(4, 1 + Math.floor(streak / 3));
    return {
      dur: 55, get score() { return score; },
      report() { return `${hops} hops · ${perfects} perfect`; },
      status() { return mult() > 1 ? 'x' + mult() : ''; },
      down() { if (state === 'stand') { charging = true; charge = 0; } },
      up() {
        if (!charging || state !== 'stand') { charging = false; return; }
        charging = false; const P = power(); vx = Math.cos(ANG) * P; vy = -Math.sin(ANG) * P; state = 'air'; lastX = tx; api.sfx('ollie', .5); api.burst(tx, ty, '#bfe8ff', 6, 80);
      },
      update(dt) {
        t += dt; splash = Math.max(0, splash - dt);
        while (pads[pads.length - 1].x < cam + W + 300) addPad();
        if (state === 'stand') {
          const p = pads[cur]; tx = padX(p); ty = padTop(p) - 4;
          if (charging) charge = Math.min(1, charge + dt / .95);
          if (p.kind === 'lily') { stand += dt; if (stand > 1.5) { p.sink = Math.min(1, p.sink + dt * .8); if (p.sink >= 1) { state = 'fall'; vy = 0; vx = 0; } } }
        } else if (state === 'air' || state === 'fall') {
          const py = ty; vy += G * dt; tx += vx * dt; ty += vy * dt;
          if (state === 'air' && vy > 0) {
            for (let i = 0; i < pads.length; i++) {
              const p = pads[i], px = padX(p), top = padTop(p) - 4;
              if (Math.abs(tx - px) <= p.w / 2 + 8 && py <= top + 4 && ty >= top) {
                const d = Math.abs(tx - px); cur = i; state = 'stand'; stand = 0; charge = 0; ty = top; hops++;
                const perfect = d < 10;
                if (i > 0 && Math.abs(px - lastX) > 20) {
                  if (perfect) { perfects++; streak++; const v = 3 * mult(); score += v; api.pop(tx, ty - 70, 'Perfect +' + v, '#ffe066'); api.burst(tx, ty, '#ffe066', 14); api.say('ooh'); }
                  else { streak = 0; score += 1; api.pop(tx, ty - 70, '+1', '#fff'); }
                  api.sfx('land', .4);
                }
                break;
              }
            }
          }
          bonus.forEach(b => { if (!b.got && Math.hypot(b.x - tx, b.y - ty) < 34) { b.got = 1; score += 2 * mult(); api.sfx('pick', .4); api.burst(b.x, b.y, '#ffd34d', 10); api.pop(b.x, b.y - 10, '+' + 2 * mult(), '#ffd34d'); } });
          if (ty > WATER + 40) {
            splash = .6; api.sfx('crash', .4); api.burst(tx, WATER, '#8fd4ff', 18, 160); api.shake(.2); streak = 0; api.pop(tx, WATER - 40, 'Splash!', '#bfe8ff');
            if (pads[cur].sink >= 1) pads[cur].sink = 0; state = 'stand'; stand = 0; charge = 0;
          }
        }
        cam += (tx - 110 - cam) * Math.min(1, dt * 4);
      },
      draw(c) {
        woodCover(c, imgs.bg, 'rgba(20,70,110,.12)');
        const g2 = c.createLinearGradient(0, WATER, 0, H); g2.addColorStop(0, '#5ab4e8'); g2.addColorStop(1, '#1f5f96'); c.fillStyle = g2; c.fillRect(0, WATER + 8, W, H);
        c.strokeStyle = 'rgba(255,255,255,.3)'; c.lineWidth = 2;
        for (let i = 0; i < 7; i++) { c.beginPath(); c.ellipse(((i * 70 - cam * .5) % (W + 70) + W + 70) % (W + 70) - 20, WATER + 24 + (i % 3) * 22, 24, 4, 0, 0, 7); c.stroke(); }
        bonus.forEach(b => { if (b.got) return; const x = b.x - cam; woodSprite(c, imgs.potGold, x, b.y + Math.sin(t * 4 + b.x) * 4, 34, 0); });
        pads.forEach(p => {
          const x = padX(p) - cam, y = padTop(p);
          if (x < -90 || x > W + 90) return;
          if (p.kind === 'log') { c.fillStyle = '#7a4c24'; c.beginPath(); c.roundRect(x - p.w / 2, y - 2, p.w, 24, 10); c.fill(); c.fillStyle = '#a7703a'; c.fillRect(x - p.w / 2 + 6, y, p.w - 12, 5); }
          else { c.globalAlpha = 1 - p.sink * .5; c.fillStyle = '#3f8f32'; c.beginPath(); c.ellipse(x, y + 4, p.w / 2 + 4, 12, 0, 0, 7); c.fill(); c.fillStyle = p.kind === 'moving' ? '#8fd14a' : '#5cb84a'; c.beginPath(); c.ellipse(x, y + 1, p.w / 2, 9, 0, 0, 7); c.fill(); c.fillStyle = '#ff9fbf'; c.beginPath(); c.arc(x + p.w * .22, y - 3, 5, 0, 7); c.fill(); c.globalAlpha = 1; }
          c.strokeStyle = 'rgba(255,255,255,.55)'; c.lineWidth = 2; c.beginPath(); c.moveTo(x, y - 6); c.lineTo(x, y + 8); c.stroke();
        });
        const sx = tx - cam;
        if (state === 'stand' && charging) {
          const P = power(); let px = tx, py = ty - 20, pvx = Math.cos(ANG) * P, pvy = -Math.sin(ANG) * P;
          c.fillStyle = 'rgba(255,255,255,.8)';
          for (let i = 0; i < 18; i++) { px += pvx * .05; py += pvy * .05; pvy += G * .05; c.globalAlpha = 1 - i / 20; c.beginPath(); c.arc(px - cam, py, 3.2, 0, 7); c.fill(); } c.globalAlpha = 1;
          c.fillStyle = '#0008'; c.fillRect(sx - 30, ty - 120, 60, 8); c.fillStyle = charge > .85 ? '#ffe066' : '#8ee65e'; c.fillRect(sx - 30, ty - 120, 60 * charge, 8);
        }
        const squash = state === 'stand' && charging ? 1 - charge * .22 : 1, rot = state === 'air' ? Math.sin(t * 14) * .08 : 0;
        c.save(); c.translate(sx, ty); c.scale(1 / Math.sqrt(squash), squash); woodSprite(c, imgs.tigger, 0, -66, 96, rot); c.restore();
        if (splash > 0) { c.fillStyle = 'rgba(200,235,255,.7)'; c.beginPath(); c.ellipse(sx, WATER + 8, 40 * (1 - splash), 12, 0, 0, 7); c.fill(); }
        if (mult() > 1) woodText(c, 'x' + mult(), 40, 100, 24, '#ffe066');
      }
    };
  },

  /* Piglet: the shell game. Follow the pot he hides under. */
  seek(api) {
    const { W, H, imgs } = api; const ROW = 380;
    let round = 0, lives = 3, score = 0, t = 0, streak = 0, rounds = 0;
    let pots = [], n = 3, pig = 0, phase = 'show', pt = 0, swaps = [], swapI = 0, swapT = 0, swapSpeed = .5, msg = '', picked = -1, left = 55;
    const slotX = (i, count) => W / 2 + (i - (count - 1) / 2) * Math.min(86, (W - 40) / count);
    const setup = () => {
      n = Math.min(5, 3 + Math.floor(round / 3)); pig = Math.floor(Math.random() * n);
      pots = Array.from({ length: n }, (_, i) => ({ slot: i, x: slotX(i, n), y: ROW, lift: 0 }));
      swapSpeed = Math.max(.2, .5 - round * .03); swaps = []; const count = 3 + Math.floor(round * .9) + n;
      let last = -1; for (let i = 0; i < count; i++) { let a, b; do { a = Math.floor(Math.random() * n); b = Math.floor(Math.random() * n); } while (a === b || (a + b) === last); last = a + b; swaps.push([a, b]); }
      swapI = 0; swapT = 0; phase = 'show'; pt = 0; picked = -1; msg = '';
    };
    setup();
    return {
      dur: 0, get score() { return score; },
      report() { return `${rounds} rounds right`; },
      status() { return `${'♥'.repeat(lives)} · ${Math.max(0, Math.ceil(left))}s`; },
      down(px, py) {
        if (px < 0 || phase !== 'pick') return;
        const i = pots.findIndex(p => Math.hypot(p.x - px, p.y - 30 - py) < 52); if (i < 0) return;
        picked = i; phase = 'reveal'; pt = 0;
        const right = pots[i].slot === pig;
        if (right) { streak++; rounds++; const pts = 100 + round * 20 + Math.min(100, streak * 15); score += pts; api.sfx('win', .4); api.say('ooh'); api.pop(pots[i].x, ROW - 90, '+' + pts, '#ffe066', 26); api.burst(pots[i].x, ROW - 30, '#ffe066', 16); msg = 'Found him!'; round++; }
        else { streak = 0; lives--; api.sfx('crash', .45); api.shake(); msg = 'Oh dear.'; if (lives <= 0) { pt = -.6; } }
      },
      update(dt) {
        t += dt; left -= dt; if (left <= 0) { api.finish(); return; }
        pt += dt;
        if (phase === 'show') { pots.forEach(p => { p.lift = Math.min(1, pt * 3); }); if (pt > 1.6) { phase = 'cover'; pt = 0; } }
        else if (phase === 'cover') { pots.forEach(p => { p.lift = Math.max(0, 1 - pt * 4); }); if (pt > .5) { phase = 'shuffle'; pt = 0; swapT = 0; } }
        else if (phase === 'shuffle') {
          swapT += dt; const sw = swaps[swapI];
          if (sw) {
            const k = Math.min(1, swapT / swapSpeed), A = pots.find(p => p.slot === sw[0]), B = pots.find(p => p.slot === sw[1]);
            const ax = slotX(sw[0], n), bx = slotX(sw[1], n), arc = Math.sin(k * Math.PI) * 46;
            A.x = ax + (bx - ax) * k; A.y = ROW - arc; B.x = bx + (ax - bx) * k; B.y = ROW + arc * .6;
            if (swapT >= swapSpeed) { const sa = A.slot; A.slot = B.slot; B.slot = sa; A.x = slotX(A.slot, n); B.x = slotX(B.slot, n); A.y = B.y = ROW; if (pig === sw[0]) pig = sw[1]; else if (pig === sw[1]) pig = sw[0]; swapI++; swapT = 0; }
          } else { phase = 'pick'; pt = 0; }
        }
        else if (phase === 'reveal') {
          pots.forEach((p, i) => { p.lift = Math.min(1, p.lift + dt * 4); });
          if (pt > 1.3) { if (lives <= 0) { api.finish(); return; } setup(); }
        }
      },
      draw(c) {
        woodCover(c, imgs.bg, 'rgba(20,50,10,.16)');
        c.fillStyle = 'rgba(40,24,8,.28)'; c.beginPath(); c.ellipse(W / 2, ROW + 22, W * .46, 26, 0, 0, 7); c.fill();
        const order = pots.slice().sort((a, b) => a.y - b.y);
        order.forEach(p => {
          const showPig = (phase === 'show' && p.slot === pig) || (phase === 'reveal' && p.slot === pig);
          if (showPig) woodSprite(c, imgs.piglet, p.x, p.y - 24 - p.lift * 36, 62, Math.sin(t * 8) * .05);
          woodSprite(c, imgs.pot, p.x, p.y - p.lift * 54, 86, 0);
          if (phase === 'pick') { c.strokeStyle = 'rgba(255,255,255,.0)'; }
        });
        if (phase === 'pick') woodText(c, 'Where is Piglet?', W / 2, 250, 28, '#fff');
        else if (phase === 'show') woodText(c, 'Watch Piglet!', W / 2, 250, 28, '#fff');
        else if (phase === 'shuffle') woodText(c, 'Follow him...', W / 2, 250, 24, '#ffe9a0');
        else if (phase === 'reveal') woodText(c, msg, W / 2, 250, 30, msg[0] === 'F' ? '#ffe066' : '#ff8a8a');
        if (streak > 1) woodText(c, streak + ' right in a row', W / 2, 520, 18, '#ffe066');
      }
    };
  },

  /* Eeyore: he wanders and turns around; the tail swings on a spring; Tigger bounces through. */
  tail(api) {
    const { W, H, imgs } = api;
    let round = 0, left = 13, t = 0, score = 0, drag = false, state = 'play', rest = 0, pinned = false, ex = W / 2, dir = 1, turnT = 0, wait = 0, pins = 0;
    let tail = { x: W / 2, y: 590, vx: 0, vy: 0 }, pointer = { x: W / 2, y: 590 }, tig = null, wind = 0, msg = '';
    const EW = 250, socketAt = () => ({ x: ex + (dir > 0 ? -.40 : .40) * EW, y: 414 + (round >= 1 && wait <= 0 ? Math.sin(t * 8) * 4 : 0) });
    const dirSpeed = () => (round === 0 ? 0 : (30 + round * 16)) * (wait > 0 ? 0 : 1);
    const next = () => { round++; if (round >= 6) { api.finish(); return; } left = 13; state = 'play'; pinned = false; tail.x = W / 2; tail.y = 590; tail.vx = tail.vy = 0; tig = null; msg = ''; };
    return {
      dur: 0, get score() { return score; },
      report() { return `${pins} tails pinned`; },
      status() { return `${Math.min(6, round + 1)}/6 · ${Math.max(0, Math.ceil(left))}s`; },
      down(px, py) { if (px < 0 || state !== 'play') return; if (Math.hypot(px - tail.x, py - tail.y) < 90) { drag = true; pointer.x = px; pointer.y = py; } },
      move(px, py) { if (drag) { pointer.x = px; pointer.y = py; } },
      up() {
        if (!drag) return; drag = false;
        const s = socketAt(), d = Math.hypot(tail.x - s.x, (tail.y - 10) - s.y);
        if (d <= 38) {
          const pts = 60 + Math.round((38 - d) * 1.1) + Math.floor(left) * 3; score += pts; pins++; state = 'done'; rest = 1.1; pinned = true;
          api.sfx('bounce', .5); api.say('ooh'); api.burst(s.x, s.y, '#ffb0d0', 14); msg = d < 12 ? 'Thanks for noticing.' : 'It’ll do.';
          api.pop(s.x, s.y - 60, '+' + pts, d < 12 ? '#ffe066' : '#fff', 24);
        } else { api.sfx('bee', .25); tail.vy = -120; api.pop(tail.x, tail.y - 30, 'Not quite', '#ff8a8a'); }
      },
      update(dt) {
        t += dt; wind = Math.sin(t * .9) * Math.max(0, round - 1) * 30;
        if (state === 'play') {
          left -= dt;
          if (left <= 0) { drag = false; state = 'done'; rest = .9; msg = 'Out of time'; }
          // Eeyore wanders: from round 2 he walks, pauses and turns.
          if (round >= 1) {
            if (wait > 0) { wait -= dt; if (wait <= 0) { dir *= -1; } }
            else { ex += dir * dirSpeed() * dt; if (ex > W - 130 || ex < 130) { ex = woodClamp(ex, 130, W - 130); wait = .5; } else if (Math.random() < dt * .22 * round) wait = .45; }
          }
          // Tigger bounces through from round 4: touching him knocks the tail loose.
          if (round >= 3 && !tig && Math.random() < dt * .45) tig = { x: Math.random() < .5 ? -40 : W + 40, y: 300, vx: 0, t: 0 };
          if (tig) {
            tig.t += dt; if (tig.vx === 0) tig.vx = tig.x < 0 ? 150 : -150; tig.x += tig.vx * dt; tig.y = 470 - Math.abs(Math.sin(tig.t * 5)) * 150;
            if (Math.hypot(tig.x - tail.x, tig.y - 20 - tail.y) < 56) { drag = false; tail.x = W / 2; tail.y = 590; tail.vx = tail.vy = 0; api.sfx('bee', .4); api.shake(); api.pop(tig.x, tig.y - 60, 'Hoo-hoo-hoo!', '#ffb060'); tig = null; }
            else if (tig.x < -80 || tig.x > W + 80) tig = null;
          }
          // The tail hangs from the finger on a spring, so it lags and swings.
          if (drag) { const k = 190, dmp = 14; tail.vx += ((pointer.x + wind * .4) - tail.x) * k * dt; tail.vy += (pointer.y - tail.y) * k * dt; tail.vx *= Math.max(0, 1 - dmp * dt); tail.vy *= Math.max(0, 1 - dmp * dt); tail.x += tail.vx * dt; tail.y += tail.vy * dt; }
          else { tail.x += (W / 2 - tail.x) * dt * 4; tail.y += (590 - tail.y) * dt * 4; }
        } else { rest -= dt; if (rest <= 0) next(); }
      },
      draw(c) {
        woodCover(c, imgs.bg, 'rgba(20,40,10,.18)');
        const s = socketAt(), bob = Math.sin(t * 8) * (round >= 1 && wait <= 0 ? 4 : 0);
        c.save(); c.translate(ex, 360 + bob); if (dir > 0) c.scale(-1, 1); c.translate(-ex, -(360 + bob)); woodSprite(c, imgs.eeyore, ex, 360 + bob, EW, 0); c.restore();
        if (state === 'play') { c.strokeStyle = 'rgba(255,255,255,.55)'; c.lineWidth = 3; c.setLineDash([5, 5]); c.beginPath(); c.arc(s.x, s.y, 30, 0, 7); c.stroke(); c.setLineDash([]); }
        c.fillStyle = 'rgba(70,40,18,.85)'; c.beginPath(); c.roundRect(110, 578, 140, 54, 14); c.fill();
        const tx2 = pinned ? s.x : tail.x, ty2 = pinned ? s.y + 10 : tail.y, ang = pinned ? 0 : woodClamp(tail.vx * .0016, -.5, .5);
        c.save(); c.translate(tx2, ty2); c.rotate(ang); c.strokeStyle = '#6e7788'; c.lineWidth = 8; c.lineCap = 'round'; c.beginPath(); c.moveTo(0, -10); c.lineTo(0, 44); c.stroke(); c.fillStyle = '#3b3636'; c.beginPath(); c.ellipse(0, 50, 9, 14, 0, 0, 7); c.fill();
        c.fillStyle = '#ec6096'; c.beginPath(); c.moveTo(0, -4); c.lineTo(-18, -16); c.lineTo(-16, 8); c.fill(); c.beginPath(); c.moveTo(0, -4); c.lineTo(18, -16); c.lineTo(16, 8); c.fill(); c.fillStyle = '#d6407a'; c.beginPath(); c.arc(0, -4, 5, 0, 7); c.fill(); c.restore();
        if (tig) woodSprite(c, imgs.tigger, tig.x, tig.y - 50, 84, Math.sin(tig.t * 10) * .1);
        if (state === 'done' && msg) woodText(c, msg, W / 2, 230, 28, '#ffe066');
        if (round >= 3) woodText(c, 'Mind Tigger!', W / 2, 130, 16, '#ffd0a0');
      }
    };
  },

  /* Eclipse: a trick-heavy skate run. Hold to ollie higher, swipe for tricks, ramps, gaps and Hunny rush. */
  skate(api) {
    const { W, H, imgs } = api; const GY = 470, EX = 96, G = 1750;
    let pressJumped = false, t = 0, score = 0, combo = 1, comboT = 0, vy = 0, ey = GY, air = false, holdT = 0, holding = false, sx = 0, sy = 0, stumble = 0, inv = 0, grind = false, spawnIn = 280, dist = 0, boost = 0, rush = 0, fall = 0;
    let obs = [], orbs = [], ramps = [], gaps = [], pickups = [], trickList = [], banner = null, bannerT = 0, landed = 0, bestCombo = 1, airT = 0, trickAnim = null, trickPts = 0, trickUsed = [];
    const speed = () => (240 + Math.min(190, t * 3.4)) * (stumble > 0 ? .45 : 1) * (boost > 0 ? 1.28 : 1);
    const say = (txt, color) => { banner = [txt, color || '#fff']; bannerT = 1; };
    const crash = (why) => { if (inv > 0) return; stumble = .9; inv = 1.3; combo = 1; comboT = 0; trickPts = 0; trickUsed = []; trickAnim = null; air = false; grind = false; vy = 0; ey = GY; api.sfx('crash', .5); api.shake(); api.burst(EX, GY - 20, '#ffd0a0', 14); say(why || 'Wipeout', '#ff8a8a'); };
    const land = () => {
      air = false; grind = false; api.burst(EX, ey, '#fff0d0', 7, 100);
      if (trickAnim) { crash('Bailed'); return; }
      if (trickUsed.length) {
        const mix = new Set(trickUsed).size >= 2 ? 1.25 : 1, pts = Math.round(trickPts * mix * cm() * (rush > 0 ? 2 : 1)); score += pts; landed++; combo = Math.min(10, combo + 1); comboT = 4; bestCombo = Math.max(bestCombo, cm());
        api.sfx('trick', .5); api.pop(EX + 40, ey - 130, '+' + pts, '#ffe066', 26); say(trickUsed.length > 1 ? 'Mixed up! x' + cm() : 'Clean x' + cm(), '#ffe066');
      } else { api.sfx('land', .3); score += 3; }
      trickPts = 0; trickUsed = [];
    };
    const jump = (big) => { air = true; vy = big ? -1020 : -640; holding = !big; holdT = 0; grind = false; trickUsed = []; trickPts = 0; airT = 0; api.sfx('ollie', .5); api.burst(EX, ey, '#fff0d0', 6, 90); };
    const TRICKS = { up: ['Kickflip', 60, 'flip'], down: ['Heelflip', 60, 'flip'], left: ['Shove-it', 70, 'spin'], right: ['360', 90, 'spin'], tap: ['Grab', 40, 'grab'] };
    const cm = () => Math.min(5, 1 + Math.floor((combo - 1) / 2));
    const doTrick = dir => {
      if (!air || trickAnim || stumble > .4 || trickUsed.length >= 4) return;
      const tr = TRICKS[dir]; if (trickUsed.includes(tr[0])) return;
      trickUsed.push(tr[0]); trickPts += tr[1]; trickAnim = { name: tr[0], kind: tr[2], t: 0, dur: tr[2] === 'grab' ? .5 : .5 };
      api.sfx('trick', .3); api.pop(EX + 50, ey - 150, tr[0], '#fff', 18);
    };
    return {
      dur: 60, get score() { return score; },
      report() { return `${landed} tricks landed · best combo x${bestCombo}`; },
      status() { return cm() > 1 ? 'x' + cm() : ''; },
      get dbg() { return { obs, ramps, gaps, ey, air, trickAnim, trickUsed, t, vy }; },
      down(px, py, key) {
        if (stumble > .5) return;
        sx = px; sy = py;
        if (!air) { pressJumped = true; jump(false); return; }
        pressJumped = false;
        if (key) doTrick('tap');
      },
      move(px, py) {},
      up(px, py, key) {
        holding = false;
        if (pressJumped) { pressJumped = false; return; }
        if (key || px < 0) return;
        const dx = px - sx, dy = py - sy;
        if (!air) return;
        if (Math.hypot(dx, dy) < 28) { doTrick('tap'); return; }
        if (Math.abs(dx) > Math.abs(dy)) doTrick(dx > 0 ? 'right' : 'left'); else doTrick(dy < 0 ? 'up' : 'down');
      },
      update(dt) {
        t += dt; const v = speed(); dist += v * dt; stumble = Math.max(0, stumble - dt); inv = Math.max(0, inv - dt); bannerT = Math.max(0, bannerT - dt); boost = Math.max(0, boost - dt); rush = Math.max(0, rush - dt); fall = Math.max(0, fall - dt);
        if (comboT > 0) { comboT -= dt; if (comboT <= 0) combo = 1; }
        if (air) { airT += dt; holdT += dt; }
        if (trickAnim) { trickAnim.t += dt; if (trickAnim.t >= trickAnim.dur) trickAnim = null; }
        spawnIn -= v * dt;
        if (spawnIn <= 0) {
          const r = Math.random(), x = W + 70;
          if (r < .26) obs.push({ k: 'cone', x, w: 34, h: 40 });
          else if (r < .44) obs.push({ k: 'crate', x, w: 50, h: 58 });
          else if (r < .60) obs.push({ k: 'rail', x, w: 150, h: 34 });
          else if (r < .78) ramps.push({ x, w: 96, h: 58 });
          else if (r < .92) gaps.push({ x, w: 120 });
          else pickups.push({ x, y: GY - 80 });
          if (Math.random() < .6) { const base = obs.length ? obs[obs.length - 1] : null; for (let i = 0; i < 4; i++) orbs.push({ x: x + 10 + i * 28, y: GY - 120 - Math.sin(i / 3 * Math.PI) * 40, got: false }); }
          spawnIn = woodRand(320, 480);
        }
        [obs, ramps, gaps, orbs, pickups].forEach(list => list.forEach(o => { o.x -= v * dt; }));
        obs = obs.filter(o => o.x + o.w > -60); ramps = ramps.filter(o => o.x + o.w > -60); gaps = gaps.filter(o => o.x + o.w > -60); orbs = orbs.filter(o => o.x > -30 && !o.got); pickups = pickups.filter(o => o.x > -30);
        // physics
        const prevY = ey;
        if (air) { vy += (holding && vy < 0 && holdT < .26 ? G * .45 : G) * dt; ey += vy * dt; }
        let support = GY, grinding = false;
        obs.forEach(o => {
          const left = o.x - o.w / 2, right = o.x + o.w / 2, top = GY - o.h;
          if (EX + 14 > left && EX - 14 < right) {
            if (prevY <= top + 6 && vy >= 0) { support = Math.min(support, top); if (o.k === 'rail') grinding = true; }
            else if (ey > top + 8) crash();
          }
        });
        if (!air) ramps.forEach(r => { if (EX > r.x && EX < r.x + r.w && ey >= GY - 2 && inv <= 0) { jump(true); vy = -1020; } });
        if (!air && !fall) gaps.forEach(gp => { if (EX > gp.x + 8 && EX < gp.x + gp.w - 8 && support === GY && inv <= 0) { fall = .8; crash('Fell in!'); } });
        if (air) { if (ey >= support && vy >= 0) {
          // landing over a gap loses the board
          const inGap = gaps.some(gp => EX > gp.x + 8 && EX < gp.x + gp.w - 8) && support === GY;
          ey = support; vy = 0; if (inGap && inv <= 0) { air = false; fall = .8; crash('Fell in!'); } else land(); } }
        else if (ey < support - .5) { air = true; vy = 0; holding = false; }
        else ey = support;
        grind = grinding && !air;
        if (grind) { score += 22 * cm() * dt * (rush > 0 ? 2 : 1); comboT = 4; if (Math.floor(t * 10) % 2 === 0) api.burst(EX, ey, '#ffd34d', 1, 120); }
        orbs.forEach(o => { if (!o.got && Math.abs(o.x - EX) < 24 && Math.abs(o.y - (ey - 40)) < 42) { o.got = true; score += 5 * (rush > 0 ? 2 : 1); api.sfx('pick', .2); api.burst(o.x, o.y, '#ffd34d', 4); } });
        pickups.forEach(p => { if (!p.got && Math.abs(p.x - EX) < 30 && Math.abs(p.y - (ey - 40)) < 50) { p.got = true; boost = 4; rush = 4; api.say('yummy'); api.flash('#ffd34d'); say('Hunny rush!', '#ffe066'); } }); pickups = pickups.filter(p => !p.got);
      },
      draw(c) {
        const sky = c.createLinearGradient(0, 0, 0, GY); sky.addColorStop(0, '#5a3d8a'); sky.addColorStop(.5, '#e87f5a'); sky.addColorStop(1, '#ffd08a');
        c.fillStyle = sky; c.fillRect(0, 0, W, H);
        c.fillStyle = '#fff0c0'; c.beginPath(); c.arc(250, 240, 48, 0, 7); c.fill();
        // clock tower silhouette, as in Twilight Town
        const tOff = -(dist * .08) % 520; c.fillStyle = '#5d3a78';
        for (let k = 0; k < 3; k++) { const bx = tOff + k * 520 + 120; c.fillRect(bx, GY - 260, 36, 260); c.beginPath(); c.moveTo(bx - 6, GY - 260); c.lineTo(bx + 18, GY - 310); c.lineTo(bx + 42, GY - 260); c.fill(); c.fillStyle = '#f7d27a'; c.beginPath(); c.arc(bx + 18, GY - 226, 9, 0, 7); c.fill(); c.fillStyle = '#5d3a78'; }
        [['#7a4c80', .18, 150], ['#3f2858', .38, 100]].forEach(([col, sp, hh], layer) => {
          c.fillStyle = col; const off = -(dist * sp) % 160;
          for (let i = -1; i < 4; i++) { const bx = off + i * 160, bh = hh + ((i + 9) * 37 % 60); c.fillRect(bx, GY - bh, 112 - layer * 22, bh); }
        });
        c.fillStyle = '#4a4252'; c.fillRect(0, GY, W, H - GY); c.fillStyle = '#6a6074'; c.fillRect(0, GY, W, 8);
        c.fillStyle = '#d8c9a8'; const off = -(dist % 80); for (let i = -1; i < 6; i++) c.fillRect(off + i * 80, GY + 60, 40, 5);
        gaps.forEach(gp => { c.fillStyle = '#1a1020'; c.fillRect(gp.x, GY, gp.w, H - GY); c.fillStyle = '#6a6074'; c.fillRect(gp.x - 6, GY, 6, 12); c.fillRect(gp.x + gp.w, GY, 6, 12); });
        ramps.forEach(r => { c.fillStyle = '#9a6a3a'; c.beginPath(); c.moveTo(r.x, GY); c.lineTo(r.x + r.w, GY - r.h); c.lineTo(r.x + r.w, GY); c.fill(); c.strokeStyle = '#5e3a18'; c.lineWidth = 3; c.stroke(); c.fillStyle = '#ffd34d'; c.fillRect(r.x + r.w - 8, GY - r.h, 8, 6); });
        obs.forEach(o => {
          const x = o.x - o.w / 2, y = GY - o.h;
          if (o.k === 'cone') { c.fillStyle = '#ff7a2a'; c.beginPath(); c.moveTo(o.x, y); c.lineTo(x + o.w, GY); c.lineTo(x, GY); c.fill(); c.fillStyle = '#fff'; c.fillRect(o.x - 9, y + 16, 18, 6); c.fillStyle = '#3a2a22'; c.fillRect(x - 3, GY - 5, o.w + 6, 5); }
          else if (o.k === 'crate') { c.fillStyle = '#a8703a'; c.fillRect(x, y, o.w, o.h); c.strokeStyle = '#5e3a18'; c.lineWidth = 3; c.strokeRect(x + 1, y + 1, o.w - 2, o.h - 2); c.beginPath(); c.moveTo(x, y); c.lineTo(x + o.w, GY); c.moveTo(x + o.w, y); c.lineTo(x, GY); c.stroke(); }
          else { c.fillStyle = '#cfd8dc'; c.fillRect(x, y, o.w, 7); c.fillStyle = '#78909c'; c.fillRect(x + 8, y + 7, 7, o.h - 7); c.fillRect(x + o.w - 15, y + 7, 7, o.h - 7); c.fillStyle = '#fff'; c.fillRect(x, y, o.w, 2); }
        });
        orbs.forEach(o => { c.fillStyle = '#ffd34d'; c.beginPath(); c.arc(o.x, o.y, 8, 0, 7); c.fill(); c.fillStyle = '#fff6c0'; c.beginPath(); c.arc(o.x - 3, o.y - 3, 3, 0, 7); c.fill(); });
        pickups.forEach(p => woodSprite(c, imgs.potGold, p.x, p.y + Math.sin(t * 5) * 5, 50, Math.sin(t * 3) * .2));
        if (boost > 0) { c.strokeStyle = 'rgba(255,255,255,.55)'; c.lineWidth = 2; for (let i = 0; i < 9; i++) { const y = 120 + i * 40 + (t * 400 + i * 77) % 30; c.beginPath(); c.moveTo(W, y); c.lineTo(W - 70 - (i % 3) * 30, y); c.stroke(); } }
        const frameIdx = stumble > .35 ? 4 : trickAnim && trickAnim.kind === 'flip' ? 3 : grind ? 5 : trickAnim && trickAnim.kind === 'grab' ? 1 : air ? 2 : (Math.floor(t * 6) % 2 ? 1 : 0);
        const im = imgs.skate, cell = im && im.height ? im.height : 192, s = 1.05;
        if (im && im.width) {
          c.save(); c.translate(EX, ey);
          if (inv > 0 && stumble <= 0 && Math.floor(t * 20) % 2) c.globalAlpha = .5;
          if (trickAnim && trickAnim.kind === 'spin') c.rotate(trickAnim.t / trickAnim.dur * Math.PI * 2 * (trickAnim.name === 'Shove-it' ? -1 : 1));
          if (trickAnim && trickAnim.kind === 'flip') c.rotate(0);
          c.translate(0, trickAnim ? -30 : 0);
          c.drawImage(im, frameIdx * cell, 0, cell, cell, -96 * s, -176 * s, cell * s, cell * s); c.restore();
        }
        if (bannerT > 0) { c.globalAlpha = Math.min(1, bannerT * 3); woodText(c, banner[0], W / 2, 190, 30, banner[1]); c.globalAlpha = 1; }
        if (comboT > 0 && cm() > 1) { c.fillStyle = '#0008'; c.fillRect(W / 2 - 50, 205, 100, 7); c.fillStyle = '#ffe066'; c.fillRect(W / 2 - 50, 205, 100 * comboT / 4, 7); }
        if (rush > 0) woodText(c, 'Hunny rush x2', W / 2, 232, 16, '#ffe066');
      }
    };
  }
};

/* ---------------- the tab ---------------- */
Object.assign(Screens, {
  khWoodTab(main) {
    const w = KHEvent.woodState();
    main.innerHTML = `<div class="wd-book"><div class="wd-book-head" style="background-image:linear-gradient(180deg,#0000 30%,#0c1a0acc),url('${ASSET}uploads/poohshouse.webp')">
        <div><small>Pooh’s book</small><h3>Hundred Acre Wood</h3></div>
        <span class="wd-hunny-count"><i class="wd-hunny"></i>${fmt(w.hunny)} Hunny</span></div>
      <button class="wd-raid" type="button"><img src="${ASSET}assets/kh/art/largebody.png" alt=""><span><b>Raid the Wood</b><small>Two Heartless waves · LV ${KHEvent.woodLevel()} · earn Munny and Hearts</small></span><strong>Fight ›</strong></button>
      <p class="wd-intro">Short games for Munny and Hunny. Hunny opens the later pages. Rank up for better pay; repeat plays pay half.</p>
      <div class="wd-pages"></div>
      <button class="wd-replay" type="button">Replay the opening</button></div>`;
    const host = main.querySelector('.wd-pages');
    main.querySelector('.wd-raid').onclick = () => { KHSnd.play('select'); this.khWoodRaidSetup(); };
    const thumbOf = a => a === 'skate' ? 'assets/kh/wood/eclipse-skate.png' : `assets/kh/wood/vn/${a}.webp`;
    WOOD_GAMES.forEach(game => {
      const open = w.hunny >= game.unlock, best = w.best[game.id], rank = best ? best.rank : 0;
      const b = el('button', 'wd-page' + (open ? '' : ' locked'));
      b.type = 'button'; b.disabled = !open;
      const thumb = game.art === 'skate'
        ? `<span class="wd-thumb skate" style="background-image:url('${ASSET}assets/kh/wood/eclipse-skate.png')"></span>`
        : `<img class="wd-thumb" src="${ASSET}${thumbOf(game.art)}" alt="">`;
      b.innerHTML = `${thumb}<span class="wd-page-text"><b>${game.name}</b><small>${open ? game.blurb : `Opens at ${game.unlock} Hunny`}</small>
        <span class="wd-page-foot">${open ? `<em class="wd-rank r${rank}">${best ? WOOD_RANK[rank] : 'Not played'}</em>${best ? `<span>Best ${fmt(best.score)}</span>` : ''}` : `<em class="wd-rank">${fmt(w.hunny)} / ${game.unlock} Hunny</em>`}</span></span>`;
      this.khHover(b, open ? game.blurb : `Collect ${game.unlock} Hunny to open this page.`);
      b.onclick = () => {
        KHSnd.play('select'); Sound.play('ui_open', { vol: .5 });
        WoodArena.play(game, { onLeave: () => this.render() });
      };
      host.appendChild(b);
    });
    main.querySelector('.wd-replay').onclick = () => this.khPlayScene('w1');
  },

  khWoodRaidSetup() {
    const roster = KHEvent.woodRaidRoster(), st = KHEvent.state(), node = KHEvent.woodRaidNode(), max = Math.min(5, roster.length);
    let team = (st.woodRaidTeam || []).filter(id => roster.includes(id)).slice(0, max);
    roster.forEach(id => { if (team.length < max && !team.includes(id)) team.push(id); });
    const body = el('div', 'kh-team');
    const draw = () => {
      body.innerHTML = `<p class="kh-sub">Choose up to ${max}. Unowned friends join as event loans at LV ${node.lv}.</p>
        <div class="kh-team-grid">${roster.map(id => `<button data-id="${id}" class="${team.includes(id) ? 'on' : ''}"><img src="${khPortrait(id)}" alt=""><b>${khName(id)}</b><small>${Save.owns(id) ? 'LV ' + Math.max(Save.hero(id).level, Math.round(node.lv * .8)) : 'LOAN · LV ' + node.lv}</small></button>`).join('')}</div>
        <div class="kh-team-foot"><span>${team.length} / ${max}</span><button class="kh-btn kh-go">${KH_CHEVRON}<span>Begin Raid</span></button></div>`;
      body.querySelectorAll('[data-id]').forEach(b => b.onclick = () => {
        const id = b.dataset.id;
        if (team.includes(id)) team = team.filter(x => x !== id);
        else if (team.length < max) team.push(id);
        else { Sound.play('ui_err'); return; }
        KHSnd.play('move'); draw();
      });
      body.querySelector('.kh-go').onclick = () => {
        if (!team.length) { Sound.play('ui_err'); return; }
        st.woodRaidTeam = team.slice(); Save.write(); UI.closeModal({ skipHook: true });
        this.khWoodRaidFight(team);
      };
    };
    draw();
    UI.modal('Hundred Acre Wood Raid', body, { className: 'kh-modal' });
  },

  khWoodRaidFight(ids) {
    const node = KHEvent.woodRaidNode(), roster = KHEvent.woodRaidRoster();
    const run = { wave: 0, team: ids.filter(id => roster.includes(id)).slice(0, 5).map(id => KHEvent.spec(id, node.lv)), battles: [] };
    if (!run.team.length) { UI.toast('Set a team first'); return; }
    const total = KHEvent.waves(node, 'easy');
    const rewards = masteryRewardBundle({ ichor: Math.round(850 + node.lv * 12), exp: Math.round(650 + node.lv * 8), star: 25 + Math.round(node.lv * .2), manual: 2 + Math.round(node.lv / 60) });
    const finish = (win, quit) => {
      const hearts = KHEvent.heartsReleased(run.battles), st = KHEvent.state();
      st.hearts += hearts;
      if (win) {
        const munny = KHEvent.munnyReward(node, 'easy', false);
        st.munny += munny;
        KHEvent.woodState().raids = (KHEvent.woodState().raids || 0) + 1;
        const owned = ids.filter(id => Save.owns(id));
        if (owned.length) payoutBattle(owned, rewards, { mastery: 110 + Math.round(node.lv / 2), pass: 60 + Math.round(node.lv / 4) });
        this._khResult = { win: true, name: node.name, munny, hearts };
      } else if (!quit) this._khResult = { lose: true, wave: run.wave + 1, hearts };
      Save.write(); this._raidDossier = KH_EVENT.id; this._khTab = 'wood'; this.render();
    };
    const launchWave = () => {
      const wave = run.wave, final = wave === total - 1;
      let battle = null;
      battle = BattleScreen.launch({
        team: run.team, foes: KHEvent.wave(node, 'easy', wave), music: final ? 'khBoss' : 'khBattle',
        meta: KHEvent.meta(node, 'easy', wave), rewards: final ? () => rewards : () => ({}), skipResults: !final,
        onDone: res => {
          $('#battle').classList.remove('kh-battle');
          if (battle) run.battles.push(battle);
          if (res.quit || !res.win) { finish(false, res.quit); return; }
          if (final) { finish(true, false); return; }
          const hp = {};
          battle.units.filter(u => u.team === TEAM_P && !u.minion).forEach(u => { hp[u.id] = u.alive ? u.hpPct : 0; });
          run.team = run.team.filter(sp => hp[sp.id] > 0).map(sp => Object.assign({}, sp, { carryHp: Math.min(1, hp[sp.id] + .15) }));
          run.wave++; UI.toast(`Wave ${wave + 1} cleared`); launchWave();
        }
      });
      if (battle) $('#battle').classList.add('kh-battle');
    };
    launchWave();
  }
});
