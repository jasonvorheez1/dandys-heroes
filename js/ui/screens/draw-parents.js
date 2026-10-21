/* screens/draw-parents.js - "Draw Gourdy's Parents" Event.
   Allows players to spend existing Scratch Tickets (1 ticket / stroke) to sketch Gourdy's parents on paper,
   with chances for Memory Lockets (5%), Hero Shards (0.2-2%), and Full Recruits (0.1%).
   Uses tapdraw sound effect and authentic drawing artwork. */
'use strict';

const DRAW_COST_PER_CLICK = 1;

const GOURDY_DRAW_LINES = {
  start: "Can you help me draw Mama and Papa? If you sketch on the paper, maybe they'll come back into focus...",
  sketching: [
    "Look! That's Papa's pumpkin coat! And Mama's purple bandana!",
    "I remember Mama's swirling purple energy... it kept us so safe.",
    "Papa was always at the front, with his big claws and autumn leaves!",
    "It's getting clearer! Keep drawing!",
    "Every line you draw brings their memory back to life!",
    "Mama's spirals... and Papa's harvest roots. I see them!",
    "We're almost there! Look at how wonderful they look together!"
  ],
  locketDrop: "MY LOCKET!! You found it! Inside is our family drawing!",
  shardsDrop: "Pieces of their memory! It's getting so much clearer!",
  fullDrop: "MAMA! PAPA! You're really here with me! Thank you!",
  complete: "YOU DREW THEM! Both of them! Our family portrait is complete! Look at Mama and Papa together!"
};

const DrawParents = {
  COST: DRAW_COST_PER_CLICK,
  _comboCount: 0,
  _comboTimer: null,

  state() {
    if (!Save.data) return { progress: 0, clicks: 0, lockets: 0, completedDrawings: 0 };
    if (!Save.data.drawParents) {
      Save.data.drawParents = {
        progress: 0,
        clicks: 0,
        lockets: 0,
        completedDrawings: 0,
        mrsShardsWon: 0,
        mrShardsWon: 0,
        fullUnlocksWon: 0
      };
    }
    return Save.data.drawParents;
  },

  performDraw(count = 1) {
    const totalCost = this.COST * count;
    if (Save.res('ticket') < totalCost) {
      return { ok: false, reason: `Need ${totalCost} Scratch Ticket${totalCost === 1 ? '' : 's'} to draw!` };
    }

    Save.spend({ ticket: totalCost });
    const st = this.state();
    const results = [];
    let completedNow = false;

    // Track combo streak for extra drawing fun
    this._comboCount = (this._comboCount || 0) + count;
    if (this._comboTimer) clearTimeout(this._comboTimer);
    this._comboTimer = setTimeout(() => { this._comboCount = 0; }, 3200);

    for (let i = 0; i < count; i++) {
      st.clicks++;
      const prevProgress = st.progress;
      // Progress gain per stroke: ~1.5% to 2.5%, with a small combo boost
      const comboBonus = Math.min(0.6, (this._comboCount || 0) * 0.04);
      const progressGain = 1.6 + Math.random() * 1.2 + comboBonus;
      st.progress = Math.min(100, st.progress + progressGain);

      const roll = Math.random();
      let drop = null;

      // 1. Full Unlock Chance (0.1% = 0.001)
      if (roll < 0.001) {
        const unowned = ['MrsHolloway', 'MrHolloway'].filter(id => !Save.owns(id));
        const heroId = unowned.length ? unowned[Math.floor(Math.random() * unowned.length)] : (Math.random() < 0.5 ? 'MrsHolloway' : 'MrHolloway');
        const unlockNeed = Save.unlockNeed(heroId);
        Save.giveShards(heroId, unlockNeed);
        st.fullUnlocksWon = (st.fullUnlocksWon || 0) + 1;
        drop = { type: 'full', hero: heroId, label: `FULL RECRUIT: ${HEROES[heroId].name}!` };
      }
      // 2. Shards Chance (0.2% - 2.0% -> roll < 0.021)
      else if (roll < 0.021) {
        const heroId = Math.random() < 0.5 ? 'MrsHolloway' : 'MrHolloway';
        const amount = Math.floor(Math.random() * 16) + 5; // 5 to 20 shards
        Save.giveShards(heroId, amount);
        if (heroId === 'MrsHolloway') st.mrsShardsWon = (st.mrsShardsWon || 0) + amount;
        else st.mrShardsWon = (st.mrShardsWon || 0) + amount;
        drop = { type: 'shards', hero: heroId, amount, label: `+${amount} ${HEROES[heroId].name} Shards` };
      }
      // 3. Memory Locket Chance (5% = 0.05 -> roll < 0.071)
      else if (roll < 0.071) {
        Save.addTrinketCopy('memory_locket', 1);
        st.lockets = (st.lockets || 0) + 1;
        drop = { type: 'locket', label: "FOUND: Gourdy's Memory Locket!" };
      }
      // 4. Consolation Reward on every stroke
      else {
        const ichorGain = 60 + Math.floor(Math.random() * 35);
        Save.give({ ichor: ichorGain }, true);
        drop = { type: 'essence', ichor: ichorGain, label: `+${ichorGain} Black Ichor` };
      }

      results.push(drop);

      // Check 100% completion milestone
      if (prevProgress < 100 && st.progress >= 100) {
        completedNow = true;
        st.completedDrawings = (st.completedDrawings || 0) + 1;
        // Milestone completion rewards
        Save.addTrinketCopy('memory_locket', 1);
        Save.giveShards('MrsHolloway', 25);
        Save.giveShards('MrHolloway', 25);
        Save.give({ star: 500, ichor: 1500 }, true);
        st.lockets = (st.lockets || 0) + 1;
        st.mrsShardsWon = (st.mrsShardsWon || 0) + 25;
        st.mrShardsWon = (st.mrShardsWon || 0) + 25;
      }
    }

    Save.write();
    return { ok: true, results, completedNow, progress: st.progress, combo: this._comboCount };
  },

  resetPaper() {
    const st = this.state();
    st.progress = 0;
    this._comboCount = 0;
    Save.write();
  }
};

/* Attach screens to Screens engine */
Object.assign(Screens, {

  openDrawParents() {
    this.go('drawParents');
  },

  drawParents(s) {
    const st = DrawParents.state();
    const page = el('div', 'draw-event-page');

    // 1. Header with authentic tickets balance
    const header = el('header', 'draw-header');
    const ticketsHeld = Save.res('ticket');

    header.innerHTML = `
      <div class="draw-header-left">
        <button class="draw-back-btn" type="button">← Back</button>
        <div class="draw-title-group">
          <span>SPECIAL EVENT</span>
          <h1>DRAW GOURDY'S PARENTS</h1>
        </div>
      </div>
      <div class="draw-header-wallet">
        <div class="draw-ticket-badge" title="Existing Scratch Tickets used for drawing">
          🎟 <b id="drawTicketCount">${fmt(ticketsHeld)}</b> <small>Scratch Tickets</small>
        </div>
        ${ticketsHeld === 0 ? `
          <button class="draw-prize-parade-btn" id="openPrizeParadeQuickBtn" type="button" title="Earn tickets in Prize Parade">
            🎪 Prize Parade
          </button>
        ` : ''}
      </div>
    `;
    page.appendChild(header);

    $('.draw-back-btn', header).onclick = () => {
      this.go('raid');
    };

    const ppBtn = $('#openPrizeParadeQuickBtn', header);
    if (ppBtn) {
      ppBtn.onclick = () => {
        Screens.openScratch();
      };
    }

    // 2. Gourdy Companion Speech Box
    const companion = el('div', 'draw-gourdy-box');
    companion.innerHTML = `
      <div class="draw-gourdy-avatar" title="Click to hear Gourdy!">
        <img src="${Art.hero('Gourdy')}" alt="Gourdy">
      </div>
      <div class="draw-gourdy-speech">
        <div class="draw-gourdy-name">Gourdy</div>
        <div class="draw-gourdy-text" id="drawSpeechText">${st.progress >= 100 ? GOURDY_DRAW_LINES.complete : GOURDY_DRAW_LINES.start}</div>
        ${DrawParents._comboCount > 1 ? `<div class="draw-combo-badge" id="drawComboBadge">🔥 ${DrawParents._comboCount}x Drawing Streak!</div>` : ''}
      </div>
    `;
    page.appendChild(companion);

    $('.draw-gourdy-avatar', companion).onclick = () => {
      Sound.play('hero_gourdy_talk', { vol: .6, throttle: 1200 });
      const speechText = $('#drawSpeechText', companion);
      if (speechText) {
        speechText.textContent = pick(GOURDY_DRAW_LINES.sketching);
      }
    };

    // 3. Main Grid Layout: Canvas Board (Left) & Dossiers/Rates (Right)
    const grid = el('div', 'draw-main-grid');

    // Left: Sketchbook / Canvas Board
    const sketchBoard = el('div', 'draw-sketch-board');
    const isMasterpiece = st.progress >= 100;

    sketchBoard.innerHTML = `
      <div class="draw-paper-clip"></div>
      <div class="draw-paper ${isMasterpiece ? 'masterpiece' : ''}" id="drawPaperCanvas" title="Tap or click directly on the paper to sketch! (1 🎟)">
        
        <!-- Interactive Drawing Surface -->
        <div class="draw-art-stage">
          <!-- Hand-drawn artwork matching user upload -->
          <div class="draw-paper-sketch-wrapper">
            <img src="uploads/gourdy_parents_drawing.png" class="draw-artwork-img" id="drawArtworkImg" alt="Drawing of Gourdy's Parents" style="${this.getDrawingImageStyle(st.progress)}">
            
            <!-- Sketch overlay layer (faint outlines / gesture marks) -->
            <div class="draw-sketch-overlay" style="opacity: ${Math.max(0.15, 1 - st.progress / 90)}"></div>

            <!-- Redacted Mystery Bar Accent -->
            <div class="draw-mystery-accent" style="opacity: ${st.progress > 20 ? Math.min(1, st.progress / 60) : 0}"></div>
          </div>

          <!-- Dynamic Ink & Pencil strokes layer -->
          <div class="draw-ink-surface" id="drawInkSurface"></div>
        </div>

        ${isMasterpiece ? `
          <div class="draw-signature-label">
            Mama & Papa · by Gourdy & You
          </div>
        ` : ''}

        <div class="draw-tap-hint ${st.progress > 25 ? 'fade' : ''}">
          ✏️ Tap anywhere on the paper to draw!
        </div>
      </div>

      <!-- Drawing Progress Bar -->
      <div class="draw-progress-wrap">
        <div class="draw-progress-labels">
          <span>🎨 Drawing Progress</span>
          <b id="drawProgressText">${Math.round(st.progress)}% ${isMasterpiece ? '· Complete Masterpiece!' : ''}</b>
        </div>
        <div class="draw-progress-bar">
          <div class="draw-progress-fill" id="drawProgressFill" style="width: ${st.progress}%"></div>
          <div class="draw-milestone-marker m25" title="25% Gesture"></div>
          <div class="draw-milestone-marker m50" title="50% Contours"></div>
          <div class="draw-milestone-marker m75" title="75% Shading"></div>
          <div class="draw-milestone-marker m100" title="100% Masterpiece"></div>
        </div>
      </div>

      <!-- Action Stroke Buttons -->
      <div class="draw-action-row">
        <button class="draw-stroke-btn" id="drawStroke1Btn" type="button" ${ticketsHeld < 1 ? 'disabled' : ''}>
          <span>✏️ Sketch 1 Stroke</span>
          <small>1 🎟 Ticket</small>
        </button>
        <button class="draw-stroke-btn multi" id="drawStroke5Btn" type="button" ${ticketsHeld < 5 ? 'disabled' : ''}>
          <span>🎨 Draw 5 Strokes</span>
          <small>5 🎟 Tickets</small>
        </button>
        <button class="draw-stroke-btn burst" id="drawStroke10Btn" type="button" ${ticketsHeld < 10 ? 'disabled' : ''}>
          <span>✨ Master 10x Strokes</span>
          <small>10 🎟 Tickets</small>
        </button>
      </div>

      ${isMasterpiece ? `
        <button class="draw-frame-action" id="drawResetBtn" type="button">
          🖼️ Draw Another Portrait (Keep All Rewards & Badges)
        </button>
      ` : ''}
    `;
    grid.appendChild(sketchBoard);

    // Right: Info & Hero Showcase (NO TIERS DISPLAYED)
    const sidePanel = el('div', 'draw-side-panel');

    // Rates Card
    const ratesCard = el('div', 'draw-rates-card');
    ratesCard.innerHTML = `
      <div class="draw-card-title">
        <span>Event Drop Chances</span>
        <small style="color:var(--holloway-amber)">1 🎟 / Stroke</small>
      </div>
      <div class="draw-rate-row">
        <span>🧡 Memory Locket (Trinket)</span>
        <span class="draw-rate-val draw-rate-locket">5.0%</span>
      </div>
      <div class="draw-rate-row">
        <span>◈ Mrs. / Mr. Holloway Shards</span>
        <span class="draw-rate-val draw-rate-shards">0.2% – 2.0%</span>
      </div>
      <div class="draw-rate-row">
        <span>✨ Full Hero Recruit</span>
        <span class="draw-rate-val draw-rate-full">0.1%</span>
      </div>
      <div class="draw-rate-row">
        <span>🎨 Finished Portrait Bonus</span>
        <span class="draw-rate-val" style="background:rgba(16,185,129,0.25);color:#6ee7b7">At 100%</span>
      </div>
      <div style="margin-top:10px;font-size:11px;color:#caa5e8;line-height:1.4">
        Every stroke advances the portrait on paper and rewards guaranteed bonus Black Ichor!
      </div>
    `;
    sidePanel.appendChild(ratesCard);

    // Hero Preview Card (NO TIERS)
    const heroCard = el('div', 'draw-hero-preview-card');
    this._drawSelectedHero = this._drawSelectedHero || 'MrsHolloway';

    heroCard.innerHTML = `
      <div class="draw-card-title">
        <span>Featured Parents</span>
        <small>Exclusive Event</small>
      </div>
      <div class="draw-hero-tabs">
        <button class="draw-hero-tab-btn ${this._drawSelectedHero === 'MrsHolloway' ? 'active' : ''}" id="tabMrsBtn" type="button">
          Mrs. Holloway
        </button>
        <button class="draw-hero-tab-btn ${this._drawSelectedHero === 'MrHolloway' ? 'active' : ''}" id="tabMrBtn" type="button">
          Mr. Holloway
        </button>
      </div>
      <div id="drawHeroDossierMount"></div>
    `;
    sidePanel.appendChild(heroCard);

    grid.appendChild(sidePanel);
    page.appendChild(grid);
    s.appendChild(page);

    // Mount selected hero preview
    this.mountHeroDossier($('#drawHeroDossierMount', page), this._drawSelectedHero);

    // Tab Switching
    $('#tabMrsBtn', page).onclick = () => {
      this._drawSelectedHero = 'MrsHolloway';
      this.render();
    };
    $('#tabMrBtn', page).onclick = () => {
      this._drawSelectedHero = 'MrHolloway';
      this.render();
    };

    // Canvas click drawing - Tap to draw with tapdraw.wav!
    const paperCanvas = $('#drawPaperCanvas', page);
    paperCanvas.onclick = (e) => {
      const rect = paperCanvas.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const clickY = e.clientY - rect.top;
      this.triggerDrawAction(1, clickX, clickY, paperCanvas);
    };

    // Buttons
    $('#drawStroke1Btn', page).onclick = () => {
      this.triggerDrawAction(1, 240, 160, paperCanvas);
    };
    $('#drawStroke5Btn', page).onclick = () => {
      this.triggerDrawAction(5, 240, 160, paperCanvas);
    };
    $('#drawStroke10Btn', page).onclick = () => {
      this.triggerDrawAction(10, 240, 160, paperCanvas);
    };

    const resetBtn = $('#drawResetBtn', page);
    if (resetBtn) {
      resetBtn.onclick = () => {
        DrawParents.resetPaper();
        Sound.play('scratch_pencil', { vol: .6 });
        UI.toast('Fresh sketchpad ready! You keep all earned Lockets and Shards.');
        this.render();
      };
    }
  },

  getDrawingImageStyle(progress) {
    const p = Math.min(100, Math.max(0, progress));
    // Reveal effects:
    // Opacity scales from 0.15 to 1.0
    const opacity = 0.15 + (p / 100) * 0.85;
    // Saturation and contrast emerge as color fills in
    const grayscale = Math.max(0, 100 - p * 1.1);
    const contrast = 85 + p * 0.35;
    const blur = p < 20 ? (20 - p) * 0.1 : 0;
    return `opacity:${opacity.toFixed(2)}; filter:grayscale(${grayscale.toFixed(0)}%) contrast(${contrast.toFixed(0)}%) blur(${blur.toFixed(1)}px);`;
  },

  triggerDrawAction(count, clickX, clickY, canvasEl) {
    const outcome = DrawParents.performDraw(count);

    if (!outcome.ok) {
      Sound.play('ui_err');
      UI.toast(outcome.reason);
      return;
    }

    // Play user's requested tapdraw sound effect on every drawing action!
    Sound.play('tapdraw', { vol: .88, rate: rnd(.95, 1.05) });

    // Spawn click particles and pencil marks on canvas
    if (canvasEl) {
      this.spawnInkEffect(canvasEl, clickX, clickY, count);
    }

    // Check for high-value drops
    const lockets = outcome.results.filter(r => r.type === 'locket');
    const shards = outcome.results.filter(r => r.type === 'shards');
    const fulls = outcome.results.filter(r => r.type === 'full');

    const speechText = $('#drawSpeechText');

    if (fulls.length) {
      Sound.play('fanfare', { vol: .9 });
      FX.confetti(window.innerWidth / 2, 260, 80);
      const won = fulls[0];
      this.showFullRecruitModal(won.hero);
      if (speechText) speechText.textContent = GOURDY_DRAW_LINES.fullDrop;
    } else if (lockets.length) {
      Sound.play('get_rare', { vol: .85 });
      this.showLocketFoundModal();
      if (speechText) speechText.textContent = GOURDY_DRAW_LINES.locketDrop;
    } else if (shards.length) {
      Sound.play('get_item', { vol: .75 });
      const s = shards[0];
      UI.toast(`◈ ${s.label}!`);
      if (speechText) speechText.textContent = GOURDY_DRAW_LINES.shardsDrop;
    } else {
      if (speechText && Math.random() < 0.45) {
        const randLine = GOURDY_DRAW_LINES.sketching[Math.floor(Math.random() * GOURDY_DRAW_LINES.sketching.length)];
        speechText.textContent = randLine;
      }
    }

    if (outcome.completedNow) {
      Sound.play('fanfare', { vol: .95 });
      FX.confetti(window.innerWidth / 2, 260, 95);
      UI.toast('🎉 MASTERPIECE FINISHED! Claimed Memory Locket + 50 Holloway Shards!');
      if (speechText) speechText.textContent = GOURDY_DRAW_LINES.complete;
    }

    // Refresh display
    this.render();
  },

  spawnInkEffect(canvasEl, x, y, count) {
    const inkSurface = $('#drawInkSurface', canvasEl) || canvasEl;
    for (let i = 0; i < Math.min(count, 5); i++) {
      const offsetX = x + (Math.random() - 0.5) * 70;
      const offsetY = y + (Math.random() - 0.5) * 70;

      // Pencil sketch mark
      const stroke = el('div', 'draw-pencil-stroke');
      const rot = (Math.random() - 0.5) * 60;
      const len = 30 + Math.random() * 40;
      stroke.style.width = len + 'px';
      stroke.style.height = '3px';
      stroke.style.left = offsetX + 'px';
      stroke.style.top = offsetY + 'px';
      stroke.style.transform = `rotate(${rot}deg)`;
      stroke.style.background = Math.random() < 0.5 ? '#2d1e38' : '#7c3aed';
      inkSurface.appendChild(stroke);
      setTimeout(() => stroke.remove(), 1200);

      // Ink blot
      const ink = el('div', 'draw-ink-blot');
      const size = 25 + Math.random() * 35;
      ink.style.width = size + 'px';
      ink.style.height = size + 'px';
      ink.style.left = offsetX + 'px';
      ink.style.top = offsetY + 'px';
      inkSurface.appendChild(ink);
      setTimeout(() => ink.remove(), 700);

      // Spark text / emoji
      const spark = el('div', 'draw-click-spark');
      const sparks = ['✏️', '🌀', '🍂', '✨', '🎃', '🧡', '💜'];
      spark.textContent = pick(sparks);
      spark.style.left = offsetX + 'px';
      spark.style.top = offsetY + 'px';
      spark.style.color = Math.random() < 0.5 ? '#c070ed' : '#ff9d4d';
      inkSurface.appendChild(spark);
      setTimeout(() => spark.remove(), 850);
    }
  },

  mountHeroDossier(container, heroId) {
    if (!container || !HEROES[heroId]) return;
    const h = HEROES[heroId];
    const isMrs = heroId === 'MrsHolloway';
    const owned = Save.owns(heroId);
    const shardsHeld = owned ? (Save.hero(heroId) ? Save.hero(heroId).shards : 0) : Save.pending(heroId);
    const need = Save.unlockNeed(heroId);

    // Strictly NO tiers displayed!
    container.innerHTML = `
      <div class="draw-hero-dossier">
        <div class="draw-hero-top">
          <img class="draw-hero-thumb" src="${Art.icon(heroId)}" alt="${h.name}">
          <div class="draw-hero-meta">
            <h3>${h.name}</h3>
            <div class="draw-hero-badges">
              <span class="draw-badge-role">${h.roleLabel || h.role}</span>
              <span class="draw-badge-role">${h.position || 'Backline'}</span>
            </div>
          </div>
        </div>

        <div class="draw-hero-specialty">
          ${isMrs ? 'Specialty: Spectral explosions, spiraling illusions, enemy disruption, teamwide CC immunity, revival, and permanent scaling.'
                  : 'Specialty: HP Shields, damage conversion, enemy distraction, defensive armor growth, and last-second survival.'}
        </div>

        <div class="draw-hero-shards-held">
          <span>${owned ? 'Hero Recruited!' : 'Research Banked:'}</span>
          <b style="color:var(--holloway-amber)">◈ ${shardsHeld} / ${need}</b>
        </div>

        <button class="draw-inspect-btn" id="inspectHeroBtn" type="button">
          🔍 Inspect Full Skillset & Passives
        </button>
      </div>
    `;

    $('#inspectHeroBtn', container).onclick = () => {
      this.showSkillsetModal(heroId);
    };
  },

  showSkillsetModal(heroId) {
    const h = HEROES[heroId];
    if (!h) return;
    const body = el('div');
    body.style.padding = '8px';
    body.style.maxHeight = '70vh';
    body.style.overflowY = 'auto';

    // Strictly NO tiers displayed!
    const header = el('div', 'row', `
      <img src="${Art.icon(heroId)}" style="width:52px;height:52px;object-fit:contain;border-radius:10px;background:#181220;border:1px solid #7c3aed">
      <div class="grow" style="text-align:left;margin-left:12px">
        <div class="b" style="font-size:16px">${h.name}</div>
        <div class="mini muted">${h.roleLabel || h.role} · ${h.position || 'Backline'}</div>
      </div>
    `);
    body.appendChild(header);

    const skills = el('div');
    skills.style.marginTop = '14px';

    const skillKeys = ['W', 'G', 'B', 'P', 'R'];
    const colors = { W: '#ffffff', G: '#6cd67a', B: '#6cc4ff', P: '#c070ed', R: '#ff6b6b' };
    const skillLabels = { W: 'White (Active & Passive)', G: 'Green (Active)', B: 'Blue (Active)', P: 'Purple (Passive)', R: 'Red (Passive)' };

    skillKeys.forEach(k => {
      const sk = h.skills[k];
      if (!sk) return;
      const card = el('div');
      card.style.cssText = 'background:rgba(255,255,255,0.05);border-radius:10px;padding:10px;margin-bottom:8px;border-left:4px solid ' + colors[k];
      const descText = typeof sk.desc === 'function' ? sk.desc(sk.v || {}, sk.p || {}) : sk.desc;
      card.innerHTML = `
        <div class="row" style="margin-bottom:4px">
          <b style="color:${colors[k]};font-size:13px">${sk.name}</b>
          <span class="grow"></span>
          <small class="muted">${skillLabels[k]}</small>
        </div>
        <div class="tiny" style="color:#d8cde3;line-height:1.4">${descText}</div>
      `;
      skills.appendChild(card);
    });

    body.appendChild(skills);
    UI.modal(h.name + ' Skillset', body);
  },

  showLocketFoundModal() {
    const body = el('div', 'draw-drop-modal');
    body.innerHTML = `
      <div class="draw-drop-glow locket">
        <img src="item/Trinkets/MemoryLocket.png" alt="Memory Locket">
      </div>
      <div class="draw-drop-title" style="color:var(--holloway-orange)">
        FOUND: Gourdy's Memory Locket!
      </div>
      <div class="draw-drop-desc">
        A heart-shaped pumpkin locket etched with spiraling memories of Gourdy's parents.
        Equip it to grant HP Shields, Attack boosts, and CC immunity in battle!
      </div>
      <button class="btn gold wide" id="closeLocketModalBtn" type="button">Collect Trinket</button>
    `;
    UI.modal("✨ Special Trinket Found!", body);
    $('#closeLocketModalBtn', body).onclick = () => UI.closeModal();
  },

  showFullRecruitModal(heroId) {
    const h = HEROES[heroId];
    const body = el('div', 'draw-drop-modal');
    body.innerHTML = `
      <div class="draw-drop-glow hero">
        <img src="${Art.hero(heroId)}" alt="${h.name}">
      </div>
      <div class="draw-drop-title" style="color:#6ee7b7">
        🎉 FULL RECRUIT UNLOCKED!
      </div>
      <div class="b" style="font-size:18px;margin-bottom:6px">${h.name}</div>
      <div class="draw-drop-desc">
        Through your drawings on the paper, <strong>${h.name}</strong> has returned to Gardenview!
        They are now recruited and available for all battles!
      </div>
      <button class="btn gold wide" id="closeFullModalBtn" type="button">Welcome to the Team!</button>
    `;
    UI.modal(`✨ Recruited: ${h.name}`, body);
    $('#closeFullModalBtn', body).onclick = () => UI.closeModal();
  }

});
