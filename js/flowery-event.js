/* flowery-event.js - "Flower Kingdom", the Dandy's Heroes x DELTARUNE Chapter 5 event: its card in the Events tab, its menu, and
   the player that runs the ten segments (js/flowery-story*.js) on the overworld (js/flowery-world.js).
   Everything the event draws or plays is in assets/flowery/flowery.bin, which loads only when the event is opened.
   Progress is saved in Raid.state().flowery: seg (segments finished), done, losses (boss), beaten. */
'use strict';

(() => {
  const ID = 'flower-kingdom-event';
  const TITLE = 'Flower Kingdom';
  const state = () => {
    const raid = Raid.state();
    const s = raid.flowery || (raid.flowery = {});
    s.seg = Math.max(0, Math.min(FL_STORY.length, Number(s.seg) || 0));
    s.done = !!s.done;
    return s;
  };

  /* ---------------------------------------------------------------- playing */
  let playing = false;
  async function play(from) {
    if (playing) return;
    playing = true;
    const st = state();
    const root = document.createElement('div'); root.className = 'fk-root';
    document.body.appendChild(root);
    let quit = false;
    const leave = () => {
      if (quit) return; quit = true;
      FW.close(); root.remove(); playing = false;
      try { Music.screen(Screens.cur); } catch (_) { /* optional */ }
      Screens._raidDossier = ID; try { Screens.render(); } catch (_) { /* optional */ }
    };
    FW.open(root, { onSave: () => { st.savedAt = st.cur; try { Save.write(); } catch (_) { /* optional */ } }, onQuit: () => { if (window.confirm('Leave? You\'ll start this part over next time.')) leave(); } });
    for (let i = from; i < FL_STORY.length && !quit; i++) {
      const S = FW.S; if (!S) break;
      Object.assign(S.fx, { petals: false, ichor: 0, tint: null, glitch: 0, fade: 1, fadeTo: 1 });
      S.overlays.length = 0; S.party = []; Object.keys(S.actors).forEach(k => delete S.actors[k]);
      st.cur = i; try { Save.write(); } catch (_) { /* optional */ }
      const r = await FW.play(FL_STORY[i].script);
      if (quit || r === 'abort') break;
      st.seg = Math.max(st.seg, i + 1);
      if (i === FL_STORY.length - 1) st.done = true;
      try { Save.write(); } catch (_) { /* optional */ }
    }
    leave();
  }

  /* ---------------------------------------------------------------- the menu */
  function banner(cv) {
    let t0 = null;
    const frame = now => {
      if (!cv.isConnected) return;
      if (t0 == null) t0 = now;
      const t = (now - t0) / 1000, ctx = cv.getContext('2d');
      const r = cv.getBoundingClientRect(), k = Math.max(1, Math.ceil(r.height / 150));
      const W = Math.ceil(r.width / r.height * 150);
      if (cv.width !== W * k) { cv.width = W * k; cv.height = 150 * k; }
      ctx.setTransform(k, 0, 0, k, 0, 0); ctx.imageSmoothingEnabled = false;
      FW.sunsetSky(ctx, { x: t * 8 }, t, { cliffY: 120, castle: true, cloudY: 40 });
      FW.tileFill(ctx, FW.TX.grass, 0, 112, W, 40, t * 6, 0);
      FlPack.draw(ctx, 'flowery_idle3_' + (Math.floor(t * 6) % 5), W * .62, 140, { s: 1 });
      [['Scraps', .28], ['Ginger', .2], ['Yatta', .36]].forEach(([id, x], i) => {
        const im = FW.toonImg[id]; if (!im || !im.naturalWidth) return;
        const h = 40, w = im.naturalWidth / im.naturalHeight * h;
        ctx.save(); ctx.imageSmoothingEnabled = true; ctx.drawImage(im, W * x - w / 2, 142 - h - Math.abs(Math.sin(t * 2 + i)) * 2, w, h); ctx.restore();
      });
      FlowerCuts.drawPetals(ctx, t, .9);
      requestAnimationFrame(frame);
    };
    requestAnimationFrame(frame);
  }
  function dossier(s) {
    const st = state();
    const root = el('div', 'fl-wrap');
    root.innerHTML = `<header class="fl-hero"><canvas></canvas><button class="fl-back" type="button" aria-label="Back">‹</button>
        <div class="fl-title"><small>DANDY'S HEROES × DELTARUNE</small><h2>FLOWER KINGDOM</h2><p>Scraps · Ginger · Yatta</p></div></header>
      <div class="fl-grid"><section class="fl-panel"><h3>STORY</h3><div class="fl-load"></div>
        <button class="fl-go" type="button">${st.done ? 'AGAIN' : st.seg ? 'CONTINUE' : 'START'}</button>
        <div class="fl-chapters">${FL_STORY.map((c, i) => `<button type="button" class="fl-ch ${i > st.seg ? 'lock' : ''} ${i === st.seg && !st.done ? 'cur' : ''}" data-i="${i}"><b>${i + 1}</b><span>${i > st.seg ? '???' : c.title}</span><small style="margin-left:auto;color:#888">${i > st.seg ? '' : c.place}</small></button>`).join('')}</div></section>
        <section class="fl-panel"><h3>ABOUT</h3><p class="fl-meta">Yatta found a door in the vents.</p>
        <p class="fl-meta">[Z] Confirm · [X] Cancel · Arrows to move</p>
        <p class="fl-meta">${st.beaten ? '* Flowery has been beaten. He says it doesn\'t count.' : ''}</p></section></div>`;
    s.appendChild(root);
    $('.fl-back', root).onclick = () => { Screens._raidDossier = null; Screens.go('raid'); try { Music.screen(Screens.cur); } catch (_) { /* optional */ } };
    const load = $('.fl-load', root), go = $('.fl-go', root);
    const ready = () => { load.innerHTML = ''; banner($('canvas', root)); };
    if (FlPack.ok) ready();
    else {
      go.disabled = true; load.innerHTML = '<p class="fl-meta">LOADING <b>0%</b></p>';
      FlPack.onProgress = p => { const b = load.querySelector('b'); if (b) b.textContent = Math.round(p * 100) + '%'; };
      FlPack.load().then(() => { go.disabled = false; if (root.isConnected) ready(); });
    }
    go.onclick = () => { if (!FlPack.ok) return; FW.sfx('select'); play(st.done ? 0 : Math.min(st.seg, FL_STORY.length - 1)); };
    $$('.fl-ch', root).forEach(b => b.onclick = () => { const i = +b.dataset.i; if (i > st.seg || !FlPack.ok) return; FW.sfx('select'); play(i); });
  }

  /* ---------------------------------------------------------------- hooks into the game (same pattern as js/aperture.js) */
  {
    const weekly = weeklyEvents;
    weeklyEvents = function (week) {
      return [{ id: ID, label: TITLE, kind: 'flowery', isFlowery: true, bossIds: [], featuredIds: ['Scraps', 'Ginger', 'Yatta'], tag: 'STORY · CROSSOVER', minMastery: 1, stageLevels: [1], rewardMult: 1,
        title: TITLE, blurb: 'A door in the vents.' }, ...weekly.call(this, week)];
    };
  }
  {
    const raid = Screens.raid;
    Screens.raid = function (s) {
      const result = raid.apply(this, arguments);
      const old = [...s.querySelectorAll('.eb')].find(b => b.querySelector('.eb-title') && b.querySelector('.eb-title').textContent === TITLE);
      if (old) {
        const st = state();
        const card = this.ebCard({
          kind: 'Story', accent: '#ffd23a', title: TITLE, sub: 'Scraps · Ginger · Yatta',
          art: [ItemSheet.icon('Scraps'), ItemSheet.icon('Ginger'), ItemSheet.icon('Yatta')],
          status: st.done ? 'Cleared' : st.seg ? (st.seg + 1) + ' / ' + FL_STORY.length : 'New', tone: st.done ? 'done' : 'ready',
          progress: st.seg / FL_STORY.length, cls: 'fl-event-card'
        });
        card.onclick = () => { Screens._raidDossier = ID; Screens.render(); };
        old.replaceWith(card);
      }
      return result;
    };
    const dossierFn = Screens.raidDossier;
    Screens.raidDossier = function (s, ev) { if (ev && ev.isFlowery) { dossier(s); return; } return dossierFn.apply(this, arguments); };
  }

  window.FlowerKingdom = { ID, state, play };
})();
