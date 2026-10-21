/* screens/raid.js - weekly event board and dedicated three-wave boss dossiers. */
'use strict';

const CHEKNOV_DIALOGUE = {
  heard: [
    'WHERE, ARE, MY PARTS?!',
    'All right, show me the goods!',
    "Alright, here's what I've got for ya, now show me the goods.",
    'OH? GREAT! None of you died yet-',
    "Alright, let's see, SHOW ME THE GOODS!",
    'Ey here’s what I got for y’all now pay up.',
    'Ey you all could’d a looked worse!',
    'Ooo~ where are my goods?',
    "WOW! You've seen better days-",
    'SHOW ME THE GOODS!',
    "HEY! Here's what I got for yall! Now pay up.",
    'HOHO this better be good!',
    'OHO this better be good!'
  ],
  buy: [
    'Thank you, thank you, thank you.',
    'SEE?! With that, you look better than before!',
    'Alright put it to good use.',
    "You're gonna need it-",
    'THANK YOU, thank you, thank you.',
    "You're gonna need it.",
    'Thank you thank you thank you!'
  ],
  leave: [
    "Okay, uh, don't die out there.",
    'Put them to good use, ok?',
    "Alright, I'm done here, cya.",
    'OKAY I’m done here thank you.',
    'Alright put it to good use okay?',
    'Aight goodluck.'
  ],
  leaveEmpty: [
    "Ok fine, I'll bring the ones you like...",
    'Just letting you know, these items, cost me my life to get them.',
    "Hey just lettin y'know, these items almost costed me, my life....Yeah... it's true...",
    'Funny.',
    "Ugh fine, I'll bring the ones you like.",
    "If you're not here the next time I show up, it's not my fault.",
    "Just lettin y'know these items almost costed me, my life.",
    'Okay, your funeral.',
    'UGH FINE, I’ll bring the ones you like!'
  ],
  gas: [
    'Hey, so we got a bit of a problem here, uhm... there’s gas on this floor and it makes you tired, uh... But that’s nothing you guys can handle, I think you guys got it. Uh, you just have to get out really quick! As quick as you can- yeah- Alright, best of luck! Uh-',
    'Hey- so real problem here, this floor, it’s uh- covered in gas! and it makes you really tired, and uh, you just need to... you need to get out this... Get out as quickly as possible, uhm... you need to make sure that you get out, yeah...It’s...uh! gas...leak... *smack* *sleeping*'
  ],
  blackout: [
    'THE LIGHTS ARE OUT AGAIN! I swear this is in the budget, you just have to find the fusebox...and turn it back on... I owe you uhm... I owe you a uh de uh- OH- Oh no the connection- uhm, it’s- uhh- it’s cutting out, oh- I’m losing you... I’m losing you, OKAY BYE-',
    'OH WHERE’S OUR ELECTRICAL GUY?! *distant murmuring* HE QUIT?! *continuous murmuring* Okay.. *even more murmuring* gotcha... So it looks like you maniacs will have to take care of it. There’s a box or something you gotta flip. It will be around here somewhere, cheers.',
    'I’m not too scared of the dark, but uh- if you guys would turn the lights back on, that would really make my day! No, seriously, find the breaker box and turn them back on, thanks!'
  ],
  elevator: [
    'Agh, elevator stopped... I need fuses to start it again. Grab some and put them in the fusebox by the elevator, thanks.',
    'Oh, this elevator sure loves to act up. I’ll start repairing the elevator itself, and it looks like some fuses blew along with it. There should be some extras around here.'
  ]
};

function cheknovSay(root, text) {
  const box = $('#cheknovSpeech', root);
  if (!box) return;
  clearInterval(Screens._cheknovTalkTimer);
  root.classList.add('cheknov-talking');
  box.textContent = '';
  let at = 0;
  Screens._cheknovTalkTimer = setInterval(() => {
    box.textContent = text.slice(0, ++at);
    const ch = text[at - 1];
    if (ch && ch !== ' ' && at % 4 === 1) {
      const bright = /[!?.,]/.test(ch);
      Sound.play(bright ? 'dandy_text_bright' : 'dandy_text', { vol: bright ? .13 : .075, rate: bright ? 2.5 : 2.9, throttle: 45 });
    }
    if (at >= text.length) {
      clearInterval(Screens._cheknovTalkTimer);
      Screens._cheknovTalkTimer = null;
      root.classList.remove('cheknov-talking');
    }
  }, 13);
}

Object.assign(Screens, {

  raid(s) {
    Raid.state();
    const events = Raid.events();
    const open = events.find(e => e.id === this._raidDossier);
    if (open) { this.raidDossier(s, open); return; }

    const board = el('div', 'event-raid');
    const ribbon = el('div', 'event-ribbon');
    const cookieCutters = typeof CookieRun !== 'undefined' && CookieRun.state ? (CookieRun.state().cutters || 0) : 0;
    ribbon.innerHTML = `
      <div class="event-brand">
        <span class="event-flower" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i></span>
        <div class="event-title-group">
          <b>EVENT BOARD</b>
          <small>GARDENVIEW WEEKLY ROTATION</small>
        </div>
      </div>
      <div class="event-wallet" aria-label="Event Currencies">
        <span class="event-status tokens-wallet" title="Event Tokens: Persistent across weekly rotations">🪙 ${fmt(Raid.tokens())} <small>Tokens</small></span>
        <span class="event-status qom-wallet" title="Backstage Passes: Queens of Mischief currency">🎟 ${fmt(Raid.currency('queens-of-mischief'))} <small>Passes</small></span>
        <span class="event-status phantasia-wallet" title="Wish Coins: Phantasia's wandering star exchange">🌠 ${fmt(Raid.currency('phantasia-wishbound'))} <small>Coins</small></span>
        <span class="event-status unknown-world-wallet" title="Gears: Unknown World machine workshop">⚙ ${fmt(Raid.currency('unknown-world'))} <small>Gears</small></span>
        <span class="event-status cookie-wallet" title="Cookie Cutters: Cookie Run collab gacha">✂️ ${fmt(cookieCutters)} <small>Cutters</small></span>
      </div>`;
    board.appendChild(ribbon);

    const windowBar = el('div', 'event-window');
    windowBar.innerHTML = `
      <div class="event-window-left">
        <span class="event-live-pill"><i></i> WEEKLY LINEUP</span>
        <span class="event-window-tip">Clear 8 stages per event · Replay unlocked stages anytime for farm rewards</span>
      </div>
      <div class="event-window-right">
        <span>ROTATION RESETS IN</span>
        <b id="eventWeekReset" class="event-timer-badge">--</b>
      </div>`;
    board.appendChild(windowBar);

    this._eventFilter = this._eventFilter || 'all';
    const filterRow = el('div', 'event-filters');
    const allCount = events.length;
    const specialCount = events.filter(e => e.isCookieRun || e.isQOM || e.isPhantasia || e.isUnknownWorld || e.isCollab || e.isDrawParents).length;
    const weeklyCount = events.filter(e => !e.isCookieRun && !e.isQOM && !e.isPhantasia && !e.isUnknownWorld && !e.isCollab && !e.isDrawParents).length;
    const unclearedCount = events.filter(e => Raid.stageProgress(e.id) < Raid.STAGES).length;

    const filters = [
      { id: 'all', label: 'All Events', count: allCount },
      { id: 'special', label: 'Specials & Collabs', count: specialCount },
      { id: 'weekly', label: 'Weekly Bosses', count: weeklyCount },
      { id: 'uncleared', label: 'Incomplete', count: unclearedCount, highlight: unclearedCount > 0 }
    ];

    filters.forEach(f => {
      const btn = el('button', 'event-filter-pill' + (this._eventFilter === f.id ? ' active' : '') + (f.highlight ? ' has-badge' : ''));
      btn.type = 'button';
      btn.innerHTML = `<span>${f.label}</span><small>${f.count}</small>`;
      btn.onclick = () => {
        Sound.play('ui_move');
        this._eventFilter = f.id;
        this.render();
      };
      filterRow.appendChild(btn);
    });
    board.appendChild(filterRow);

    const filteredEvents = events.filter(e => {
      if (this._eventFilter === 'special') return e.isCookieRun || e.isQOM || e.isPhantasia || e.isUnknownWorld || e.isCollab || e.isDrawParents;
      if (this._eventFilter === 'weekly') return !e.isCookieRun && !e.isQOM && !e.isPhantasia && !e.isUnknownWorld && !e.isCollab && !e.isDrawParents;
      if (this._eventFilter === 'uncleared') return Raid.stageProgress(e.id) < Raid.STAGES;
      return true;
    });

    const list = el('div', 'event-list');
    if (!filteredEvents.length) {
      const empty = el('div', 'card', '<div class="muted center" style="padding:24px 12px;font-size:12px;font-weight:800">🎉 All events in this category are completely cleared! Switch to "All Events" to replay.</div>');
      list.appendChild(empty);
    } else {
      filteredEvents.forEach((e, i) => {
        const boss = e.bossIds.length === 1 ? BOSSES.find(x => x.id === e.bossIds[0]) : null;
        const title = e.title || (boss ? boss.title : e.bossIds.length === 1 ? 'Twisted ' + HEROES[e.bossIds[0]].name : 'Converging Experiments');
        const targets = e.bossIds.map(id => 'Twisted ' + HEROES[id].name).join(' & ');
        const cleared = Raid.stageProgress(e.id);
        const nextStage = Raid.nextStage(e.id) + 1;
        const entryOpen = Raid.eventUnlocked(e);
        const isDelilah = e.bossIds.includes('Delilah');
        const unknownWorld = !!e.isUnknownWorld;
        const isComplete = cleared >= Raid.STAGES;

        const banner = el('button', 'event-banner' + (isDelilah ? ' delilah' : '') + (e.isCollab ? ' collab' : '') + (e.isPhantasia ? ' phantasia' : '') + (e.isCookieRun ? ' cookie-banner' : '') + (e.isQOM ? ' qom' : '') + (unknownWorld ? ' unknown-world' : '') + (e.isDrawParents ? ' draw-parents-banner' : '') + (entryOpen ? '' : ' locked'));
        banner.style.setProperty('--event-hue', String([38, 272, 214, 322][i % 4]));

        const badgeHtml = e.isDrawParents ? `<span class="event-banner-badge ready">🎨 ${Math.round(DrawParents.state().progress)}% DRAWN</span>`
          : !entryOpen ? `<span class="event-banner-badge locked">🔒 MASTERY ${e.minMastery}</span>`
          : isComplete ? `<span class="event-banner-badge complete">★ CLEARED</span>`
          : `<span class="event-banner-badge ready">STAGE ${nextStage}/8</span>`;

        banner.innerHTML = `
          ${badgeHtml}
          <span class="event-crest">${e.isDrawParents ? '🎨' : e.isCookieRun ? '🍪' : e.isQOM ? '♫' : e.isPhantasia ? '🌠' : unknownWorld ? '⚙' : isDelilah ? '⌬' : e.isCollab ? '🔑' : '!'}</span>
          <div class="event-art">${e.isDrawParents ? e.featuredIds.map(id => `<img src="${Art.hero(id)}" alt="${HEROES[id].name}">`).join('') : e.isCookieRun ? COOKIE_HERO_IDS.map(id => `<img src="${Art.hero(id)}" alt="${HEROES[id].name}">`).join('') : e.isQOM ? e.featuredIds.map(id => `<img src="${Art.hero(id)}" alt="${HEROES[id].name}">`).join('') : e.isPhantasia ? `<img src="${Art.hero('Phantasia')}" alt="Phantasia">` : unknownWorld ? e.featuredIds.map(id => `<img src="${UNKNOWN_WORLD_ART[id]}" alt="${HEROES[id].name}">`).join('') : e.bossIds.map(id => `<img src="${e.isCollab ? Art.hero(id) : Art.twisted(id)}" alt="${HEROES[id].name}">`).join('')}</div>
          <div class="event-copy">
            <small>${e.isDrawParents ? 'INTERACTIVE DRAWING EVENT' : e.isQOM ? 'THREE-SET CONCERT' : e.isPhantasia ? 'MID-GAME GRIND' : unknownWorld ? 'ENCOUNTER-ONLY INVASION' : e.isCollab ? '5:00 ENDURANCE' : 'THREE-WAVE EVENT'} · ${e.tag}</small>
            <strong>${title}</strong>
            <em>${e.isDrawParents ? 'Use Scratch Tickets to draw Gourdy’s parents · Lockets, Shards, Full Recruits' : e.isCookieRun ? 'GingerBrave’s oven · battles · Cookie gacha' : e.isQOM ? 'Backstage Passes · five variants' : e.isPhantasia ? 'Wish Coins · Phantasia rewards' : unknownWorld ? 'Gears · superior Trinkets · not recruitable' : e.isCollab ? e.bossIds.map(id => HEROES[id].name).join(' & ') : targets}</em>
          </div>
          ${unknownWorld ? '<div class="unknown-world-banner-strip"><b>⚙</b><span>FAMILIAR TARGETS DETECTED</span><i>3 WAVES</i></div>' : ''}
          <div class="event-meter">
            <span>${e.isDrawParents ? `SKETCHBOOK · ${Math.round(DrawParents.state().progress)}% COMPLETE` : entryOpen ? `${cleared} / ${Raid.STAGES} CLEARED ${isComplete ? '· ALL BEATEN' : `· NEXT ${nextStage}`}` : `🔒 MASTERY ${e.minMastery}`}</span>
            <i><u style="width:${e.isDrawParents ? DrawParents.state().progress : (cleared / Raid.STAGES * 100)}%"></u></i>
          </div>`;
        banner.onclick = () => { Sound.play('choose'); this._raidDossier = e.id; this.render(); };
        list.appendChild(banner);
      });
    }
    board.appendChild(list);
    s.appendChild(board);
    this.liveClocks([{ selector: '#eventWeekReset', kind: 'week' }]);
  },

  raidDossier(s, ev) {
    if (ev.isDrawParents) { this.drawParents(s, ev); return; }
    if (ev.isCookieRun) { this.cookieRun(s, ev); return; }
    const cleared = Raid.stageProgress(ev.id);
    this._raidStages = this._raidStages || {};
    let stage = this._raidStages[ev.id];
    if (stage == null || !Raid.stageUnlocked(ev.id, stage)) stage = Raid.nextStage(ev.id);
    this._raidStages[ev.id] = stage;
    const level = Raid.stageLevel(stage, ev);
    const teamPower = Progress.teamPower((Save.data.team || []).filter(Boolean));
    const recommendedPower = Progress.recommendedPower(level, {
      factor: ev.isQOM ? 1.3 : ev.isCollab ? 1.25 : ev.isUnknownWorld ? 1.15 : 1.1
    });
    const underRecommended = teamPower < recommendedPower;
    const powerPct = Math.round((teamPower / Math.max(1, recommendedPower)) * 100);
    const entryOpen = Raid.eventUnlocked(ev);
    const boss = ev.bossIds.length === 1 ? BOSSES.find(x => x.id === ev.bossIds[0]) : null;
    const title = ev.title || (boss ? boss.title : ev.bossIds.map(id => HEROES[id].name).join(' & '));
    const delilah = ev.bossIds.includes('Delilah');
    const phantasia = !!ev.isPhantasia;
    const unknownWorld = !!ev.isUnknownWorld;
    const bigWigVisible = unknownWorld && stage >= (ev.bigWigStage == null ? 99 : ev.bigWigStage);

    const allEvents = Raid.events();
    const evIndex = allEvents.findIndex(x => x.id === ev.id);
    const prevEv = allEvents[(evIndex - 1 + allEvents.length) % allEvents.length];
    const nextEv = allEvents[(evIndex + 1) % allEvents.length];

    const topbar = el('div', 'event-dossier-topbar');
    const back = el('button', 'event-dossier-back-btn', '← Back to Event Board');
    back.onclick = () => { Sound.play('ui_back'); this._raidDossier = null; this.render(); };

    const pager = el('div', 'event-dossier-pager');
    const prevBtn = el('button', 'event-dossier-pager-btn', '‹ Prev Event');
    prevBtn.title = `Switch to ${prevEv.title || prevEv.label}`;
    prevBtn.onclick = () => { Sound.play('ui_move'); this._raidDossier = prevEv.id; this.render(); };

    const nextBtn = el('button', 'event-dossier-pager-btn', 'Next Event ›');
    nextBtn.title = `Switch to ${nextEv.title || nextEv.label}`;
    nextBtn.onclick = () => { Sound.play('ui_move'); this._raidDossier = nextEv.id; this.render(); };

    pager.append(prevBtn, nextBtn);
    topbar.append(back, pager);
    s.appendChild(topbar);

    const page = el('div', 'event-dossier' + (delilah ? ' delilah' : '') + (ev.isCollab ? ' collab' : '') + (phantasia ? ' phantasia' : '') + (ev.isQOM ? ' qom' : '') + (unknownWorld ? ' unknown-world' : ''));
    const hero = el('section', 'event-dossier-hero');
    hero.innerHTML = `${unknownWorld ? '<div class="unknown-world-dossier-stamp"><b>⚙ INTRUDER NOTICE</b><span>MACHINES HAVE LOCKED ON</span></div>' : ''}<div class="event-dossier-art">${ev.isQOM ? ev.featuredIds.map(id => `<img src="${Art.hero(id)}" alt="${HEROES[id].name}">`).join('') : phantasia ? `<img src="${Art.hero('Phantasia')}" alt="Phantasia">` : unknownWorld ? ev.featuredIds.map(id => `<img src="${UNKNOWN_WORLD_ART[id]}" alt="${HEROES[id].name}">`).join('') + (bigWigVisible ? `<img class="big-wig-art" src="${UNKNOWN_WORLD_ART.BigWig}" alt="Big Wig">` : '') : ev.bossIds.map(id => `<img src="${ev.isCollab ? Art.hero(id) : Art.twisted(id)}" alt="${HEROES[id].name}">`).join('')}</div>
      <div class="event-dossier-copy">
        <small>${ev.tag} · STAGE ${stage + 1} OF ${Raid.STAGES}</small>
        <h1>${title}</h1>
        <p>${ev.blurb || (boss ? boss.intro : 'A dangerous weekly encounter.')}</p>
        <div class="event-dossier-pills">
          <span class="pill">Enemy Lv ${level}</span>
          <span class="pill">${entryOpen ? '✓' : '🔒'} Mastery ${ev.minMastery || 20}+</span>
          <span class="pill">${ev.isCollab ? '1 Endurance Battle' : '3 Waves'}</span>
          ${ev.isCollab ? '<span class="pill">⏱ 5:00 Limit</span>' : ''}
          ${phantasia ? '<span class="pill">🛍 Separate Shop</span>' : ''}
          ${unknownWorld ? '<span class="pill">⚙ Gear Workshop</span>' : ''}
          ${bigWigVisible ? '<span class="pill">⚖ BIG WIG COURT</span>' : ''}
        </div>
        <div class="stage-power-readout">
          <div class="stage-power-row">
            <div class="stage-power-item">
              <small>YOUR SQUAD POWER</small>
              <b>⚡ ${fmt(teamPower)}</b>
            </div>
            <span class="stage-power-status ${underRecommended ? 'under' : 'ready'}">
              ${underRecommended ? `⚡ UNDER POWER (${powerPct}%)` : `✓ COMBAT READY (${powerPct}%)`}
            </span>
            <div class="stage-power-item" style="text-align:right">
              <small>RECOMMENDED</small>
              <b>⚡ ${fmt(recommendedPower)}</b>
            </div>
          </div>
          <div class="stage-power-bar ${underRecommended ? 'under' : ''}">
            <i style="width:${Math.min(100, powerPct)}%"></i>
          </div>
        </div>
      </div>
      <div class="event-dossier-prize">
        <span>STAGE ${stage + 1} REWARD</span>
        <b>${Raid.currencyIcon(ev)} ${Raid.tokenReward(ev, stage)}</b>
        <small>${ev.isQOM ? 'Backstage Passes' : phantasia ? 'Wish Coins' : unknownWorld ? 'Gears' : 'Event Tokens'}</small>
      </div>`;
    page.appendChild(hero);

    const teamIds = (Save.data.team || []).filter(Boolean);
    const teamDock = el('div', 'event-dossier-team');
    teamDock.innerHTML = `
      <div class="event-team-head">
        <div class="event-team-label">
          <b>DEPLOYED SQUAD (${teamIds.length}/5)</b>
          <small>Heroes active in this event battle · Tap to swap squad</small>
        </div>
        <button class="event-team-edit-btn" type="button">✎ Change Team</button>
      </div>
      <div class="event-team-roster">
        ${teamIds.map(id => {
          const h = HEROES[id];
          if (!h) return '';
          const saveH = Save.hero(id);
          const lv = saveH ? saveH.lv : 1;
          const role = h.role || 'Damage';
          return `<div class="event-team-hero role-${role}" title="${h.name} (Lv ${lv} · ${role})">
            <img src="${Art.hero(id)}" alt="${h.name}">
            <span class="event-team-hero-lv">Lv ${lv}</span>
          </div>`;
        }).join('')}
      </div>`;
    const editBtn = $('.event-team-edit-btn', teamDock);
    const openEditor = () => {
      Sound.play('choose');
      this.openTeamEditor(null, () => this.render(), `${ev.title} · Squad Setup`, { persist: true });
    };
    if (editBtn) editBtn.onclick = openEditor;
    $$('.event-team-hero', teamDock).forEach(item => { item.onclick = openEditor; });
    page.appendChild(teamDock);

    this.section(page, 'STAGES');
    const stageControls = el('div', 'event-stage-controls');
    stageControls.innerHTML = `
      <span class="event-stage-controls-label">Selected: <b>Stage ${stage + 1}</b> of ${Raid.STAGES}</span>
      <div class="event-stage-jump-btns">
        <button type="button" class="event-jump-btn jump-next">⚡ Next Uncleared</button>
        <button type="button" class="event-jump-btn jump-max">★ Max Stage</button>
      </div>`;
    const jumpNext = $('.jump-next', stageControls);
    if (jumpNext) jumpNext.onclick = () => {
      Sound.play('choose');
      this._raidStages[ev.id] = Raid.nextStage(ev.id);
      this.render();
    };
    const jumpMax = $('.jump-max', stageControls);
    if (jumpMax) jumpMax.onclick = () => {
      Sound.play('choose');
      this._raidStages[ev.id] = Raid.STAGES - 1;
      this.render();
    };
    page.appendChild(stageControls);

    const stages = el('div', 'event-stage-grid');
    for (let i = 0; i < Raid.STAGES; i++) {
      const done = Raid.stageCleared(ev.id, i), current = cleared < Raid.STAGES && i === Raid.nextStage(ev.id);
      const selected = i === stage;
      const unlocked = Raid.stageUnlocked(ev.id, i);
      const button = el('button', 'event-stage' + (done ? ' done' : '') + (current ? ' current' : '') + (selected ? ' selected' : '') + (!unlocked ? ' locked' : ''));
      button.disabled = !unlocked;
      const stageRecommended = Progress.recommendedPower(Raid.stageLevel(i, ev), {
        factor: ev.isQOM ? 1.3 : ev.isCollab ? 1.25 : ev.isUnknownWorld ? 1.15 : 1.1
      });
      const stageUnderRecommended = teamPower < stageRecommended;
      button.innerHTML = `<b>${i + 1}</b><small>LV ${Raid.stageLevel(i, ev)}</small><em class="stage-power-label${stageUnderRecommended ? ' under' : ''}">⚡ ${fmt(stageRecommended)}</em>`;
      button.title = `Stage ${i + 1} · Enemy level ${Raid.stageLevel(i, ev)} · ${done ? 'Cleared (farmable)' : unlocked ? 'Available now' : 'Clear the previous stage first'}`;
      button.onclick = () => { Sound.play('choose'); this._raidStages[ev.id] = i; this.render(); };
      stages.appendChild(button);
    }
    page.appendChild(stages);

    if (ev.isPhantasia) this.phantasiaShopLink(page, ev);
    else if (ev.isUnknownWorld) this.unknownWorldShop(page, ev);
    else this.raidShop(page, ev);

    this.section(page, 'ENCOUNTER ROUTE');
    const route = el('div', 'event-wave-route');
    Raid.wavePlan(ev).forEach(w => {
      const n = el('div', 'event-wave-card');
      n.innerHTML = `<span>${ev.isCollab ? 'ENDURANCE' : 'WAVE ' + w.wave}</span><p>${w.desc}</p>`;
      route.appendChild(n);
    });
    page.appendChild(route);

    this.section(page, 'ACTIVE CONDITIONS');
    const conditions = el('div', 'event-condition-grid');
    const modIds = [...new Set(Raid.wavePlan(ev).flatMap(w => w.mods))];
    modIds.forEach(id => {
      const m = EVENT_MODIFIERS.find(x => x.id === id); if (!m) return;
      const n = el('div', 'event-condition ' + m.kind);
      n.innerHTML = `<i>${m.icon}</i><div><small>${m.kind === 'buff' ? 'HERO BUFF' : 'ENCOUNTER DEBUFF'}</small><b>${m.name}</b><p>${m.desc}</p></div>`;
      conditions.appendChild(n);
    });
    if (!ev.isCollab) {
      const patch = el('div', 'event-condition buff');
      patch.innerHTML = `<i>🩹</i><div><small>HERO BUFF</small><b>Field Patching</b><p>Surviving Heroes restore 12% Max HP after Waves 1 and 2. Knocked-out Heroes do not return.</p></div>`;
      conditions.appendChild(patch);
    }
    page.appendChild(conditions);

    this.section(page, 'BOSS MECHANICS');
    const mechanics = el('div', 'event-mechanics');
    this.raidMechanics(ev).forEach(m => {
      const n = el('div', 'event-mechanic');
      const name = el('b', null, m.name), desc = el('p'); desc.textContent = m.desc;
      n.appendChild(name); n.appendChild(desc); mechanics.appendChild(n);
    });
    page.appendChild(mechanics);

    const fightBar = el('div', 'event-dossier-fight-bar');
    const canEnter = entryOpen && Raid.stageUnlocked(ev.id, stage);
    const fightLabel = !entryOpen ? `REQUIRES MASTERY ${ev.minMastery}`
      : canEnter ? `BEGIN STAGE ${stage + 1} · ENEMY LV ${level}` : 'CLEAR THE PREVIOUS STAGE';
    const fight = el('button', 'event-fight event-dossier-fight', fightLabel);
    fight.disabled = !canEnter;
    fight.onclick = () => { if (canEnter) this.raidFight(ev.id, stage); };
    fightBar.appendChild(fight);

    const ticketsHeld = Save.res('raidTicket') || 0;
    const tapeFight = el('button', 'event-fight event-dossier-fight event-raid-ticket', `⚡ SKIP WITH RAID TICKET · ${fmt(ticketsHeld)} HELD`);
    tapeFight.disabled = !canEnter || !ticketsHeld;
    tapeFight.title = ticketsHeld ? 'Simulate battle off screen at 10,000× speed' : 'You need a Raid Ticket (earn from Daily tasks & Shop)';
    tapeFight.onclick = () => { if (canEnter) this.raidTicketSetup(ev, stage); };
    fightBar.appendChild(tapeFight);

    page.appendChild(fightBar);
    s.appendChild(page);
  },

  raidShop(page, ev) {
    this.section(page, 'EVENT SHOP');
    const shop = el('div', 'event-token-shop');
    const head = el('div', 'event-shop-head');
    head.innerHTML = `<div><b>${ev.isQOM ? 'BAND MEMBER SHARDS' : 'FEATURED SHARDS'}</b><small>${ev.isQOM ? 'Backstage Passes stay with this event.' : 'Event Tokens carry across weekly rotations.'}</small></div><strong>${Raid.currencyIcon(ev)} ${fmt(Raid.currency(ev))}</strong>`;
    shop.appendChild(head);

    const offers = el('div', 'event-shop-offers');
    ev.featuredIds.forEach(id => {
      const owned = Save.owns(id);
      const starCost = typeof Progress !== 'undefined' && Progress.starCost ? Progress.starCost(id) : null;
      const shardsHeld = owned ? (Save.hero(id) ? Save.hero(id).shards : 0) : Save.pending(id);
      const shardsTarget = owned ? (starCost ? starCost.shards : 100) : Save.unlockNeed(id);
      const shardPct = Math.min(100, Math.round((shardsHeld / Math.max(1, shardsTarget)) * 100));

      const progress = owned
        ? `${fmt(shardsHeld)} / ${starCost ? fmt(starCost.shards) : 'MAX'} promotion shards`
        : `${fmt(Save.pending(id))} / ${fmt(Save.unlockNeed(id))} to unlock`;
      const card = el('div', 'event-shop-offer');
      card.innerHTML = `<img src="${Art.hero(id)}" alt="${HEROES[id].name}">
        <div class="event-shop-copy">
          <b>${HEROES[id].name}</b>
          <small>${progress}</small>
          <div class="event-shard-bar" style="height:4px;border-radius:99px;background:#151e28;margin-top:4px;overflow:hidden;border:1px solid #283a4c">
            <i style="display:block;height:100%;background:linear-gradient(90deg,#5fe38a,#ffd452);width:${shardPct}%;border-radius:99px"></i>
          </div>
        </div>`;
      const offer = Raid.shardOffer(ev, id);
      const maxCount = Math.floor(Raid.currency(ev) / offer.cost);
      const buyRow = el('div', 'event-shop-buy-row');
      const buyOne = el('button', 'btn tiny', `BUY 1 · +${offer.amount} · ${Raid.currencyIcon(ev)} ${offer.cost}`);
      buyOne.disabled = maxCount < 1;
      const buyMax = el('button', 'btn tiny', `BUY MAX ×${maxCount} · ${Raid.currencyIcon(ev)} ${offer.cost * maxCount}`);
      buyMax.disabled = maxCount < 2;
      buyMax.title = maxCount < 2 ? 'Earn more event currency to buy multiple bundles.' : `Buy ${maxCount} bundles for ${offer.cost * maxCount} ${Raid.currencyIcon(ev)}.`;
      const buy = quantity => {
        const out = Raid.buyShards(ev.id, id, quantity);
        if (!out.ok) { UI.toast(out.reason); Sound.play('ui_err'); return; }
        if (out.result === 'new') {
          UI.toast(`🎉 ${HEROES[id].name} unlocked!`); Sound.play('get_rare');
        } else {
          UI.toast(`◈ ${out.amount} ${HEROES[id].name} shards`); Sound.play('get_item');
        }
        this.render();
      };
      buyOne.onclick = () => buy(1);
      buyMax.onclick = () => buy(maxCount);
      buyRow.append(buyOne, buyMax);
      card.appendChild(buyRow); offers.appendChild(card);
    });
    shop.appendChild(offers);
    if (ev.isQOM) {
      const title = el('div', 'qom-trinket-head', 'SIGNATURE TRINKETS');
      const gear = el('div', 'qom-trinket-grid');
      Raid.qomTrinketOffers().forEach(item => {
        const owned = Save.ownsTrinket(item.id);
        const card = el('article', 'qom-trinket-card' + (owned ? ' sold' : ''));
        card.innerHTML = `<img src="${item.img}" alt=""><div><b>${item.name}</b><small>${item.desc}</small><button class="btn tiny">${owned ? 'OWNED' : `TRADE · 🎟 ${item.cost}`}</button></div>`;
        const buy = $('button', card);
        buy.disabled = owned || Raid.currency(ev) < item.cost;
        buy.onclick = () => {
          const out = Raid.buyQomTrinketOffer(item.id);
          if (!out.ok) { UI.toast(out.reason); Sound.play('ui_err'); return; }
          UI.toast(`${item.name} acquired!`); Sound.play('get_rare'); this.render();
        };
        gear.appendChild(card);
      });
      shop.append(title, gear);
    }
    page.appendChild(shop);
  },

  phantasiaShopLink(page) {
    this.section(page, 'SHOP');
    const link = el('button', 'phantasia-shop-link');
    link.innerHTML = '<span class="phantasia-shop-link-art"><img src="uploads/image-removebg-preview_2_.png" alt="Cheknov hanging from a vent"></span><span><small>WISHBOUND SUPPLIES</small><b>OPEN SHOP</b><em>Spend 🌠 Wish Coins on Phantasia shards, her Unicorn Emblem, and resources.</em></span><strong>›</strong>';
    link.onclick = () => Screens.go('phantasia-shop');
    page.appendChild(link);
  },

  unknownWorldShop(page, ev) {
    this.section(page, 'GEAR WORKSHOP');
    const shop = el('div', 'unknown-world-workshop');
    shop.innerHTML = `<div class="unknown-world-workshop-head"><div><small>RECOVERED MACHINE PARTS</small><b>SUPERIOR TRINKETS</b></div><strong>⚙ ${Raid.currency(ev)}</strong></div><p>These rewards are stronger than ordinary Trinkets. The machines are encounter-only and cannot join your roster.</p><div class="unknown-world-offers"></div>`;
    const grid = $('.unknown-world-offers', shop);
    Raid.unknownWorldOffers().forEach(item => {
      const owned = item.unique && Save.ownsTrinket(item.id);
      const card = el('article', 'unknown-world-offer' + (owned ? ' sold' : ''));
      const art = item.img ? `<img src="${item.img}" alt="${item.name}">` : `<span>${item.icon}</span>`;
      card.innerHTML = `<div class="unknown-world-offer-art">${art}</div><div><b>${item.name}</b><small>${item.desc}</small><button class="btn tiny">${owned ? 'OWNED' : `TRADE · ⚙ ${item.cost}`}</button></div>`;
      const buy = $('button', card); buy.disabled = owned || Raid.currency(ev) < item.cost;
      buy.onclick = () => { const out = Raid.buyUnknownWorldOffer(item.id); if (!out.ok) { UI.toast(out.reason); Sound.play('ui_err'); return; } UI.toast(`${item.name} acquired!`); Sound.play('get_rare'); this.render(); };
      grid.appendChild(card);
    });
    page.appendChild(shop);
  },

  phantasiaShop(s) {
    const ev = Raid.events().find(e => e.isPhantasia);
    if (!ev) { this._phantasiaShopInStore = false; this.go('raid'); return; }
    const entering = !this._phantasiaShopInStore;
    this._phantasiaShopInStore = true;
    const root = el('div', 'phantasia-shop-screen');
    const bought = !!this._phantasiaShopBought;
    root.innerHTML = `<button class="btn tiny phantasia-shop-back" type="button">← PHANTASIA EVENT</button>
      <section class="phantasia-shop-stage">
        <div class="phantasia-shop-vent"><i></i><b>VENT ACCESS</b><img src="uploads/image-removebg-preview_2_.png" alt="Cheknov hanging from a vent"></div>
        <div class="phantasia-shop-sign"><small>WISHBOUND STATION</small><strong>SHOP</strong><em>PHANTASIA’S SUPPLY LINE</em></div>
        <div class="phantasia-shop-dialogue"><small>CHEKNOV // SHOP GUY</small><p id="cheknovSpeech"></p></div>
      </section>
      <section class="phantasia-shop-wallet"><span>🌠 WISH COINS</span><b>${Raid.currency(ev)}</b><small>EARNED FROM THE PHANTASIA EVENT</small></section>
      <section class="phantasia-shop-stock"><div class="phantasia-shop-stock-head"><div><small>CHEKNOV’S GOODS</small><h2>SHOP</h2></div><span>BUY WHAT YOU NEED<br>BEFORE HE LEAVES</span></div><div class="phantasia-shop-grid"></div></section>`;
    s.appendChild(root);

    const back = $('.phantasia-shop-back', root);
    back.onclick = () => {
      if (this._phantasiaShopLeaving) return;
      this._phantasiaShopLeaving = true; back.disabled = true;
      const line = bought ? pick(CHEKNOV_DIALOGUE.leave) : pick(CHEKNOV_DIALOGUE.leaveEmpty);
      cheknovSay(root, line);
      setTimeout(() => { this._phantasiaShopInStore = false; this._phantasiaShopLeaving = false; this.go('raid'); }, 820);
    };

    const grid = $('.phantasia-shop-grid', root);
    Raid.phantasiaOffers().forEach(item => {
      const owned = item.unique && Save.ownsTrinket('phantasia_unicornemblem');
      const card = el('article', 'phantasia-shop-item' + (owned ? ' sold' : ''));
      const art = item.id === 'phantasia-shards'
        ? `<img src="${Art.icon('Phantasia')}" alt="Phantasia character icon">`
        : item.img ? `<img src="${item.img}" alt="${item.name}">`
        : `<span>${item.icon}</span>`;
      card.innerHTML = `<div class="phantasia-shop-item-art">${art}</div><div class="phantasia-shop-item-copy"><b>${item.name}</b><small>${item.desc}</small><button class="btn tiny" ${owned ? 'disabled' : ''}>${owned ? 'OWNED' : `TRADE · 🌠 ${item.cost}`}</button></div>`;
      const buy = $('button', card);
      buy.disabled = owned || Raid.currency(ev) < item.cost;
      buy.onclick = () => {
        const out = Raid.buyPhantasiaOffer(item.id);
        if (!out.ok) { UI.toast(out.reason); Sound.play('ui_err'); return; }
        this._phantasiaShopBought = true;
        if (item.id === 'phantasia-shards' && out.result === 'new') { UI.toast('🎉 Phantasia unlocked!'); Sound.play('get_rare'); }
        else if (item.id === 'unicorn-emblem' && out.result === 'new') { UI.toast('🔧 Unicorn Emblem acquired!'); Sound.play('get_rare'); }
        else { UI.toast(`${item.name} acquired!`); Sound.play('get_item'); }
        this._phantasiaShopNextLine = pick(CHEKNOV_DIALOGUE.buy);
        this.render();
      };
      grid.appendChild(card);
    });

    const line = this._phantasiaShopNextLine || (entering ? pick(CHEKNOV_DIALOGUE.heard) : pick(CHEKNOV_DIALOGUE.heard));
    this._phantasiaShopNextLine = null;
    clearTimeout(this._cheknovStartTimer);
    this._cheknovStartTimer = setTimeout(() => {
      this._cheknovStartTimer = null;
      cheknovSay(root, line);
    }, entering ? 420 : 70);
  },

  raidMechanics(ev) {
    if (ev.isQOM) return [
      { name: 'Four-Beat Rhythm · Gourdy', desc: 'The drum kit continuously grants Energy, slows attackers, speeds cooldowns, and interrupts on every fourth beat.' },
      { name: 'Full Volume · Eclipse', desc: 'Guitar attacks build Amplification. Eclipse becomes much stronger at ten stacks and unlocks Headliner at fifteen.' },
      { name: 'Standing Ovation · Ribecca', desc: 'Her keytar redirects damage, and her Red Skill can prevent one ally from being knocked out.' },
      { name: 'Zoop, Guard, Counter · Soulvester', desc: 'He teleports to allies in danger, blocks a hit, and punishes the attacker with a sword counter.' },
      { name: 'Phantom Notes · Connie', desc: 'She earns notes through attacks and dodges, then spends them on solos, possession, and evasive strikes.' }
    ];
    if (ev.isPhantasia) return [
      { name: 'Wishbound Escalation', desc: 'Each cleared stage raises the enemy level and improves the Wish Coin payout. Early stages are approachable for mid-game teams; the last two demand a tuned squad.' },
      { name: 'Three-Wave Grind', desc: 'Every attempt is a three-wave battle. Surviving Heroes carry their health forward, so recovery and a reliable support Toon matter.' },
      { name: 'Dandy’s Star Seal', desc: 'Twisted Dandy protects the final wave with his phase changes and two elite reinforcements.' },
      { name: 'Wishbound Rewards', desc: 'Wish Coins are separate from the weekly Event Tokens and can be spent on Phantasia shards, the Unicorn Emblem, or useful supplies.' }
    ];
    if (ev.isUnknownWorld) return [
      { name: 'Lawbot Formation', desc: 'Three waves field six, eight, then ten Lawbots. Glad Hander escalates debuffs, Legal Eagle locks actions, Robber Baron taxes Power, and Pencil Pusher executes weakened targets.' },
      { name: 'Familiar Targets', desc: 'The Lawbots recognize your Toons as the same targets they have been trying to take over and make sad. The four field machines remain enemy-only encounters.' },
      { name: 'Mechanical Detonation', desc: 'When one falls, its shell detonates in a larger, brighter burst than a normal defeat. The battle continues until the full wave is cleared.' },
      { name: 'Gear Recovery', desc: 'Clear stages to earn Gears. Spend them here on superior Trinkets, EXP Bottles, Rarity Cores, and Training Manuals.' },
      ...(this._raidStages && this._raidStages[ev.id] >= (ev.bigWigStage || 99) ? [
        { name: 'Big Wig · Legal Lockdown', desc: 'The High Court joins the final wave with team-wide Silence, Sap, Power denial, buff removal, and a defense boost for every debuffed enemy. Cleanse and debuff immunity are the intended counterplay.' }
      ] : [])
    ];
    if (ev.isCollab) return [
      { name: "Trio's Last Stand", desc: 'When one challenger falls, every survivor Cleanses, fills their Energy, gains a large Shield, and permanently gains 30% Attack, 18% Skill Haste, and 12% Damage Reduction for each fallen ally.' },
      { name: 'Trio Entrance', desc: 'Riku, Sora, and Kairi perform a unique entrance here. Their playable versions never use the boss entrance.' },
      { name: 'Linked Limit', desc: 'Every 18 seconds, Riku shields, Kairi restores the weakest challenger, and Sora attacks the whole team.' },
      { name: 'Five-Minute Escalation', desc: 'The challengers gain Attack and Skill Haste every minute. The final minute is intentionally harsher than Delilah.' },
      { name: 'Three Boss Phases', desc: 'Each challenger has separate health phases, so removing one early changes the rest of the endurance test.' }
    ];
    if (ev.bossIds.includes('Delilah')) return [
      { name: 'Adaptive Test Subjects', desc: 'Two Heroes are catalogued at the start of the fight. Released Samples pursue them aggressively.' },
      { name: 'Contamination Protocol', desc: 'The highest-Energy Hero is periodically contaminated. Repeated exposure Containes them.' },
      { name: 'Manufactured Reinforcements', desc: 'Delilah releases failed samples as her health falls.' },
      { name: 'Research Phases', desc: 'Her procedure escalates at 82%, 60%, 36%, and 14% HP.' }
    ];

    const out = [];
    ev.bossIds.forEach(id => {
      const d = HEROES[id], b = BOSSES.find(x => x.id === id);
      if (b && b.phases && b.phases.length > 1) {
        b.phases.slice(1).forEach(p => out.push({ name: `${HEROES[id].name} · ${p.name}`, desc: `Begins below ${Math.round(p.at * 100)}% HP and permanently escalates the boss for the rest of the fight.` }));
      } else {
        ['W', 'G', 'B'].forEach(k => {
          const sk = d.skills[k]; if (!sk) return;
          const params = typeof SkillDesc !== 'undefined' ? SkillDesc.safeParams(sk, 1) : { safeS: sk.v || {}, safeP: sk.p || {} };
          const raw = typeof sk.desc === 'function' ? sk.desc(params.safeS, params.safeP) : (sk.desc || '');
          out.push({ name: `${HEROES[id].name} · ${sk.name}`, desc: String(raw).replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim() });
        });
      }
    });
    return out.slice(0, 6);
  },

  raidTicketSetup(ev, stage) {
    if (ev.isCookieRun) {
      if (!Raid.canEnter(ev.id, stage)) return;
      if (!Save.res('raidTicket')) { UI.toast('You need a Raid Ticket'); return; }
      this.cookieTeamSetup(ev, stage, team => this.openRaidTicketQuantity(`${ev.title} · Stage ${stage + 1}`, amount => this.raidTicketFight(ev, stage, team, amount)));
      return;
    }
    if (!Raid.canEnter(ev.id, stage)) { UI.toast('That event stage is unavailable'); Sound.play('ui_err'); return; }
    if (!Save.res('raidTicket')) { UI.toast('You need a Raid Ticket'); Sound.play('ui_err'); return; }
    this.openTeamEditor(null, team => this.openRaidTicketQuantity(`${ev.title} · Stage ${stage + 1}`, amount => this.raidTicketFight(ev, stage, team, amount)),
      `${ev.title} · Stage ${stage + 1} · Raid Ticket`, { persist: true, confirmLabel: 'Run Event Sim' });
  },

  raidTicketFight(ev, stage, team, amount) {
    if (this._raidTicketRunning) return;
    this._raidTicketRunning = true;
    const body = el('div', 'raid-ticket-running');
    body.innerHTML = `<div class="raid-ticket-spinner">⚡</div><b>RUNNING EVENT RAID SIM</b><p>${ev.title} · Every wave active · 10,000× off screen</p>`;
    UI.modal('Event Raid Ticket', body, { dismissOnBackdrop: false });
    setTimeout(async () => {
      let result;
      const ticketBalanceBefore = Save.res('raidTicket');
      try {
        result = await RaidTicket.runBatch(() => RaidTicket.runEvent(ev, stage, team), amount || 1);
      } catch (error) {
        console.error('Event Raid Ticket failed before resolution', error);
        result = { win: false, why: 'The event simulation could not be completed. Your Raid Ticket was returned.', consumed: false, refunded: true };
        if (Save.res('raidTicket') < ticketBalanceBefore && typeof RaidTicket.refund === 'function') RaidTicket.refund();
      } finally {
        this._raidTicketRunning = false;
      }
      UI.closeModal();
      this.render();
      this.showRaidTicketResult(`${ev.title} · Stage ${stage + 1}`, result, ev, stage, Raid.stageRewards(ev, stage));
    }, 40);
  },

  raidFight(id, stage, chosenTeam) {
    const ev = Raid.event(id);
    if (!Raid.stageUnlocked(id, stage)) { UI.toast('That stage is unavailable'); Sound.play('ui_err'); return; }
    if (!Raid.eventUnlocked(ev)) { UI.toast(`Mastery ${ev.minMastery} required for this event`); Sound.play('ui_err'); return; }
    if (!chosenTeam) {
      if (ev.isCookieRun) { this.cookieTeamSetup(ev, stage, team => this.raidFight(id, stage, team)); return; }
      this.openTeamEditor(null, team => this.raidFight(id, stage, team),
        `${ev.title} · Stage ${stage + 1}`, { persist: true, confirmLabel: `Begin Stage ${stage + 1}` });
      return;
    }
    const initial = ev.isCookieRun ? CookieRun.team(playerTeamSpecs(chosenTeam), stage) : playerTeamSpecs(chosenTeam);
    if (!initial.length) { UI.toast('Set a team first'); Sound.play('ui_err'); return; }

    const level = Raid.stageLevel(stage, ev), serviceWeek = currentWeek();
    const plan = Raid.wavePlan(ev);
    const run = { wave: 1, team: initial };
    const rewards = Raid.stageRewards(ev, stage);

    if (ev.isCollab) {
      BattleScreen.launch({
        team: initial, foes: Raid.equipWave(Raid.makeWave(id, 1, level, ev), id, 1, level), music: 'collabEvent',
        meta: {
          title: `Collab Endurance · Stage ${stage + 1}`,
          floorLabel: `${ev.title} · Stage ${stage + 1}`,
          roomIdx: 1, roomTotal: 1, bg: ASSET + 'uploads/traversetown.png',
          mods: ['event_collab_endurance'], timeLimit: 300, timeoutWin: true,
          survivedLabel: 'the five-minute Keyblade endurance test',
          encounteredLabel: 'Riku, Sora, and Kairi!', collabEntrance: true, collabTheme: true
        },
        rewards: () => rewards,
        onDone: res => {
          if (res.quit) { this._raidDossier = id; this.render(); return; }
          if (!res.win) { UI.toast('The trio held Gardenview'); this._raidDossier = id; this.render(); return; }
          const tokenReward = Raid.resolve(id, true, ev, stage);
          if (tokenReward) this._raidStages[id] = Raid.nextStage(id);
          payoutBattle(chosenTeam, rewards, { mastery: 260 + level, pass: 150 + Math.round(level / 2) });
          UI.toast(`Endurance cleared · 🪙 ${tokenReward} Event Tokens`);
          this._raidDossier = id; this.render();
        }
      });
      return;
    }

    const launchWave = () => {
      const wave = run.wave, info = plan[wave - 1], final = wave === 3;
      if (ev.isCookieRun) run.team = CookieRun.ensureWave(run.team, stage);
      const foes = Raid.equipWave(Raid.makeWave(id, wave, level, ev), id, wave, level);
      const rng = seeded('event-map-' + ev.id + '-' + wave);
      const bigWigFight = ev.isUnknownWorld && stage >= (ev.bigWigStage == null ? 99 : ev.bigWigStage) && wave === 3;
      const bg = ev.isCookieRun ? ASSET + 'uploads/crkbbg' + wave + '.png' : ev.isQOM ? ASSET + 'uploads/qombattlebackground.png' : ev.isUnknownWorld
        ? ASSET + 'uploads/image-41.png'
        : ev.bossIds.includes('Delilah')
        ? bgForMap(['warehouse', 'art-floor', 'library-floor'][wave - 1])
        : Art.bg(rng.pick(BACKGROUNDS));
      let battle;
      battle = BattleScreen.launch({
        team: run.team, foes,
        music: ev.isCookieRun && final ? 'cookieMoonBattle' : ev.isQOM ? 'qomBattle' : bigWigFight ? 'unknownWorldBossBattle' : ev.isUnknownWorld ? 'unknownWorldBattle' : 'eventBattle',
        meta: {
          title: `Event Stage ${stage + 1} · Wave ${wave}/3`,
          floorLabel: `${ev.title} · Stage ${stage + 1}`, roomIdx: wave, roomTotal: 3,
          bg, mods: info.mods, timeLimit: final ? 210 : 165, unknownWorld: !!ev.isUnknownWorld, qom: !!ev.isQOM,
          ...(ev.isUnknownWorld ? {
            // Machines should spend their kit during the fight, not after the
            // player has already cleared the room. Big Wig opens fully charged;
            // the bulk waves ramp into their ultimates as the event escalates.
            enemySkillStartEnergy: bigWigFight ? 100 : 54 + wave * 10,
            enemySkillTempo: bigWigFight ? 1.72 : 1.38 + wave * .16,
            enemySkillCdr: bigWigFight ? .28 : .14 + wave * .035
          } : {}),
          survivedLabel: `Wave ${wave} of 3`,
          encounteredLabel: ev.isQOM ? `Queens of Mischief · ${wave === 3 ? 'Final Chorus' : wave === 2 ? 'Second Set' : 'Opening Act'}!` : bigWigFight ? `Big Wig and ${foes.length - 1} machines who recognize their old targets!` : ev.isUnknownWorld ? `${foes.length} machines pursuing familiar targets!` : null
        },
        rewards: final ? () => rewards : () => ({}),
        skipResults: !final,
        onDone: res => {
          if (res.quit) { this._raidDossier = id; this.render(); return; }
          if (!res.win) {
            UI.toast(`Defeated on Wave ${wave}`);
            this._raidDossier = id; this.render(); return;
          }

          if (!final) {
            const hp = {};
            battle.units.filter(u => u.team === TEAM_P && !u.minion).forEach(u => { hp[u.id] = u.alive ? u.hpPct : 0; });
            run.team = run.team.filter(spec => hp[spec.id] > 0).map(spec => Object.assign({}, spec, { carryHp: Math.min(1, hp[spec.id] + .12) }));
            run.wave++;
            UI.toast(`Wave ${wave} cleared · surviving Heroes patched`);
            launchWave();
            return;
          }

          const tokenReward = Raid.resolve(id, true, ev, stage);
          if (tokenReward) this._raidStages[id] = Raid.nextStage(id);
          payoutBattle(chosenTeam, rewards, { mastery: 170 + level, pass: 95 + Math.round(level / 3) });
          UI.toast(`Stage ${stage + 1} cleared · ${Raid.currencyIcon(ev)} ${tokenReward} ${ev.isCookieRun ? 'Cookie Cutters' : ev.isQOM ? 'Backstage Passes' : ev.isPhantasia ? 'Wish Coins' : ev.isUnknownWorld ? 'Gears' : 'Event Tokens'}`);
          if (currentWeek() !== serviceWeek) UI.toast('The rotation changed during the run. Your event rewards were preserved.');
          this._raidDossier = id; this.render();
        }
      });
    };
    launchWave();
  }
});
