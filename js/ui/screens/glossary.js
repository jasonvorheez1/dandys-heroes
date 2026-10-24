/* screens/journal.js - achievements plus the former Glossary reference
   pages. The Journal is the single place for milestones and discoveries. */
'use strict';

const JOURNAL_ACHIEVEMENT_ICONS = {
  'achievement-sprout-pose': 'uploads/sproutposeicon.png',
  'achievement-baldifer': 'uploads/baldicon.png',
  'achievement-yatta-blot': 'uploads/image-59.png'
};

Object.assign(Screens, {
  journalTab: 'achievements',

  journal(s) {
    if (this.journalTab !== 'achievements') Save.discoverGlossary(this.journalTab);
    const completed = Achievements.completed().length;
    const head = el('section', 'journal-hero');
    head.innerHTML = `<div class="journal-hero-copy"><small>GARDENVIEW RECORD</small><h1>Journal</h1></div>
      <div class="journal-hero-count"><b>${completed}</b><span>/ ${Achievements.list.length} ACHIEVEMENTS</span></div>`;
    const post = el('button', 'btn journal-post', '↗ POST JOURNAL');
    post.onclick = () => this.postJournal();
    head.appendChild(post);
    s.appendChild(head);

    const tabs = el('div', 'row journal-tabs');
    [['achievements', 'Achievements'], ['guide', 'Guide'], ['training', 'Training'], ['trinkets', 'Trinkets']].forEach(([id, label]) => {
      const b = el('button', 'pill', label);
      if (this.journalTab === id) b.classList.add('active');
      b.onclick = () => { this.journalTab = id; this.render(); };
      tabs.appendChild(b);
    });
    s.appendChild(tabs);

    if (this.journalTab === 'achievements') this.journalAchievements(s);
    else if (this.journalTab === 'training') this.glossaryTraining(s);
    else if (this.journalTab === 'trinkets') this.glossaryTrinkets(s);
    else this.glossaryGuide(s);
  },

  glossary(s) { return this.journal(s); },

  postJournal() {
    if (!window.websim || typeof window.websim.postComment !== 'function') {
      UI.toast('Account posting is unavailable here'); Sound.play('ui_err'); return;
    }
    const done = Achievements.completed(), total = Achievements.list.length;
    const profile = Save.data.profile || {};
    const profileName = profile.name || (typeof WebsimAccount !== 'undefined' && WebsimAccount.user ? '@' + WebsimAccount.user.username : 'Player');
    const favoriteHeroes = (profile.favorites && profile.favorites.heroes || []).filter(id => HEROES[id]).map(id => HEROES[id].name);
    const tiers = Object.keys(ACHIEVEMENT_TIERS).map(t => `${ACHIEVEMENT_TIERS[t].label} ${Achievements.tierCount(t)}`).join(' · ');
    const lines = [
      `${profileName}'s Dandy's Heroes Journal`,
      `Achievements: ${done.length}/${total}`,
      tiers,
      `Mastery: ${Save.data.mastery}`,
      `Favorite Heroes: ${favoriteHeroes.length ? favoriteHeroes.join(', ') : 'None selected'}`
    ];
    const content = lines.join('\n');
    window.websim.postComment({ content }).then(result => {
      if (result && result.error) { UI.toast(result.error); Sound.play('ui_err'); return; }
      UI.toast('📖 Journal posted to your account'); Sound.play('get_rare');
    }).catch(() => { UI.toast('Could not post Journal'); Sound.play('ui_err'); });
  },

  journalAchievements(s) {
    const summary = el('div', 'journal-summary card');
    const completed = Achievements.completed().length, total = Achievements.list.length;
    summary.innerHTML = `<div class="journal-summary-head"><b>Achievements</b><strong>${fmt(completed)} <span>/ ${fmt(total)}</span></strong></div>
      <div class="journal-progress"><i style="width:${total ? Math.round(completed / total * 100) : 0}%"></i></div>`;
    s.appendChild(summary);
    Object.keys(ACHIEVEMENT_TIERS).forEach(tier => {
      const info = ACHIEVEMENT_TIERS[tier];
      const group = el('section', 'journal-achievement-group');
      group.innerHTML = `<header><span class="journal-tier-emblem tier-${tier}">${info.label.slice(0, 1)}</span><div class="grow"><b>${info.label}</b><small>${Achievements.tierCount(tier)} / ${Achievements.list.filter(a => a.tier === tier).length} complete</small></div><i>+${fmt(info.masteryXp)} mastery</i></header>`;
      const grid = el('div', 'journal-achievement-grid');
      Achievements.list.filter(a => a.tier === tier).forEach(a => {
        const unlocked = Achievements.isUnlocked(a.id), progress = Achievements.progress(a);
        const card = el('article', `journal-achievement-card tier-${a.tier}${unlocked ? ' unlocked' : ''}`);
        const rewardIcon = JOURNAL_ACHIEVEMENT_ICONS[a.iconReward] ? `<img class="journal-achievement-reward-icon" src="${JOURNAL_ACHIEVEMENT_ICONS[a.iconReward]}" alt="">` : '';
        card.innerHTML = `<div class="journal-achievement-medal">${unlocked ? info.label.slice(0, 1) : '—'}</div><div class="journal-achievement-copy"><b>${a.title}</b><span>${a.desc}</span><i>${unlocked ? 'COMPLETED' : `${fmt(progress)} / ${fmt(a.target)}`}</i><em>${Achievements.rewardText(a)}</em>${rewardIcon}</div>`;
        grid.appendChild(card);
      });
      group.appendChild(grid); s.appendChild(group);
    });
  },

  glossaryGuide(s) {
    this.section(s, 'RESOURCES');
    const resources = el('div', 'grid2 journal-reference-grid');
    Object.values(RES).forEach(r => {
      const n = el('div', 'choice journal-reference-card'); n.style.margin = 0;
      n.innerHTML = `<div class="row"><div class="journal-resource-mark">${r.name.slice(0, 2).toUpperCase()}</div>
        <div class="grow"><b>${r.name}</b><div class="mini muted">${r.desc}</div></div></div>`;
      resources.appendChild(n);
    });
    s.appendChild(resources);

    this.section(s, 'BATTLE TERMS');
    const terms = [
      ['Energy', 'Heroes cast their White skill at 100 Energy. Attacking, taking damage, and some effects generate it.'],
      ['Physical Damage', 'Reduced by Defense. Armor Penetration ignores part of that protection.'],
      ['Magic Damage', 'Reduced by Magic Defense. Magic Penetration ignores part of that protection.'],
      ['True Damage', 'Ignores Defense and Magic Defense.'],
      ['Speed', 'Changes Energy gain and skill cooldown recovery. Attack Speed controls basic attacks.'],
      ['Accuracy & Evasion', 'Accuracy helps attacks connect; Evasion helps a target dodge. Guaranteed hits ignore that contest.'],
      ['Crowd Control', 'Stun, Freeze, Sleep, Root, Silence, Fear, Charm, and Knockback interrupt or restrict a unit.'],
      ['Shield', 'Temporary extra durability lost before HP. Shield Power increases shields created by that Hero.'],
      ['Critical Hit', 'A chance for an attack to deal increased damage. Crit Damage changes the bonus.']
    ];
    const list = el('div', 'grid2 journal-reference-grid');
    terms.forEach(([name, desc]) => {
      const n = el('div', 'choice journal-reference-card'); n.style.margin = 0;
      n.innerHTML = `<b>${name}</b><div class="mini muted">${desc}</div>`;
      list.appendChild(n);
    });
    s.appendChild(list);

    this.section(s, 'SKILL COLORS');
    const colors = el('div', 'card');
    colors.innerHTML = `<div class="tiny">
      <span style="color:${RARITY_COLORS[1]}">● White 1-3</span>,
      <span style="color:${RARITY_COLORS[2]}">● Green 1-5</span>,
      <span style="color:${RARITY_COLORS[3]}">● Blue 1-5</span>,
      <span style="color:${RARITY_COLORS[4]}">● Purple 1-12</span>,
      <span style="color:${RARITY_COLORS[5]}">● Red 1-20</span>, and
      <span style="color:${RARITY_COLORS[6]}">● Rainbow 1-30</span> each raise stats. Rainbow unlocks a Reforged secondary class path.</div>`;
    s.appendChild(colors);
  },

  glossaryTraining(s) {
    const note = el('div', 'card tiny muted');
    note.textContent = 'Heroes and enemies use the same Classes and Subclasses. Training Manuals raise a chosen path to Rank 50.';
    s.appendChild(note);

    this.section(s, 'CLASSES');
    const classes = el('div', 'grid2 journal-reference-grid');
    Object.entries(CLASSES).forEach(([name, d]) => {
      const n = el('div', 'choice journal-reference-card'); n.style.margin = 0;
      n.innerHTML = `<b>${name}</b><div class="mini muted">Rank 1 · ${classDesc(d, 1)}</div>
        <div class="mini" style="margin-top:4px;color:var(--accent)">Rank ${CLASS_MAX_RANK} · ${classDesc(d, CLASS_MAX_RANK)}</div>`;
      classes.appendChild(n);
    });
    s.appendChild(classes);

    this.section(s, 'SUBCLASSES');
    const subclasses = el('div', 'grid2 journal-reference-grid');
    Object.entries(SUBCLASSES).forEach(([name, d]) => {
      const n = el('div', 'choice journal-reference-card'); n.style.margin = 0;
      n.innerHTML = `<b>${name}</b><div class="mini muted">Rank 1 · ${classDesc(d, 1)}</div>
        <div class="mini" style="margin-top:4px;color:var(--accent)">Rank ${CLASS_MAX_RANK} · ${classDesc(d, CLASS_MAX_RANK)}</div>`;
      subclasses.appendChild(n);
    });
    s.appendChild(subclasses);
  },

  glossaryTrinkets(s) {
    const owned = TRINKET_IDS.filter(id => Save.ownsTrinket(id));
    const head = el('div', 'card');
    head.innerHTML = `<div class="row"><div class="grow"><b>Trinket discoveries</b>
      <div class="mini muted">Unknown Trinkets stay unidentified until you find a copy.</div></div>
      <div class="pill">${owned.length} / ${TRINKET_IDS.length}</div></div>`;
    s.appendChild(head);

    const grid = el('div', 'grid2 journal-reference-grid');
    TRINKET_IDS.forEach(id => {
      const known = Save.ownsTrinket(id), t = TRINKETS[id];
      const n = el('div', 'choice journal-reference-card'); n.style.margin = 0;
      if (!known) {
        n.style.opacity = '.68';
        n.innerHTML = `<div class="row"><div style="position:relative;width:42px;height:42px;display:grid;place-items:center">
          <img src="${trinketIcon(id)}" alt="" style="max-width:38px;max-height:38px;object-fit:contain;filter:brightness(0)">
          <b style="position:absolute;color:#fff;text-shadow:0 2px 3px #000">???</b></div>
          <div class="grow"><b>???</b><div class="mini muted">Not discovered</div></div></div>`;
      } else {
        const rank = Save.trinketBestRank(id);
        n.innerHTML = `<div class="row"><img src="${trinketIcon(id)}" alt="" style="width:42px;height:42px;object-fit:contain">
          <div class="grow"><b>${t.name}${trinketPlaceholderBadge(id)}</b><div class="mini muted">Best Rank ${rank} · x${Save.trinketCount(id)}</div></div></div>
          <div class="mini" style="margin-top:5px;color:var(--accent)">${trinketStatText(t, rank)}</div>
          <div class="mini trinket-signature">🧩 ${trinketSignatureText(id)}</div>
          <div class="mini muted">${t.effect}</div>`;
        n.onclick = () => this.openTrinketDetail(id);
      }
      grid.appendChild(n);
    });
    s.appendChild(grid);
  }
});
