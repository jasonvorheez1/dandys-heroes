/* badges.js - Friendship Badges: one unique badge per Hero+friend pair, earned
   by clearing that pair's Friendship Campaign (campaigns.js). Like a Trinket
   in that it equips into a slot and applies a small always-on effect, but a
   Badge is tied to a *specific* Hero (only they can wear it) and levels up by
   spending the friend's shards rather than drops/rank-merging. Enemies can
   also be dressed in a Badge - see Depths.badgeForFloor() in meta/modes.js -
   which is how a run keeps some pressure on badge-heavy player teams.
   `friend` is campaign/upgrade metadata only; Badge effects are self-contained
   and never look for that friend in the active team. */
'use strict';

const BADGE_MAX_LVL = 5;
function badgeUpgradeCost(lvl) { return 40 + lvl * 35; }

const BADGES = {};
function defBadge(o) { BADGES[o.id] = o; return o; }
function BADGE_IDS_FOR(ownerId) { return Object.keys(BADGES).filter(id => BADGES[id].owner === ownerId); }

/* A small control-oriented badge trait used by the Dyle/Shrimpo pair. It is
   intentionally a short opening pulse plus a cooldown-gated retaliation: a
   multi-hit attack should not lock an attacker in an endless stun loop. */
function badgeOpeningStunGuard(u, B, lvl) {
  B.foeTeam().filter(t => !t.minion && HEROES[t.id]).forEach(t => {
    B.applyStatus(u, t, 'stun', 1.25 + lvl * .12, { unresistable: true });
  });
  B.fxFloatIcon(u.x, u.y - 108, '😵', '#ffe27a');
  B.on(u, 'damaged', ev => {
    if (!ev || ev.dot || !ev.src || ev.src.team === u.team || !ev.src.alive) return;
    if (B.t < (u._badgeStunGuardAt || 0)) return;
    u._badgeStunGuardAt = B.t + Math.max(.8, 1.45 - lvl * .1);
    B.applyStatus(u, ev.src, 'stun', .65 + lvl * .1, { unresistable: true });
    B.fxFloatIcon(ev.src.x, ev.src.y - 94, '😵', '#ffe27a');
  });
}

/** A generated visual for a Badge - there's no drawn icon art for these, so
    each one gets a colored medallion (from its own `icon`/`color`) instead
    of pointing at a Hero sprite or sitting as bare text. Pass a level to also
    ring the medallion with a fill (see .badgeIcon-lvl in game.css). */
function badgeIconHtml(id, lvl) {
  const b = BADGES[id]; if (!b) return '';
  const pct = lvl ? Math.round((lvl / BADGE_MAX_LVL) * 100) : 0;
  return `<div class="badgeIcon" style="background:radial-gradient(circle at 32% 28%, ${b.color}, #2a2416 78%);
      ${lvl ? `--fill:${pct}%` : ''}">
    ${b.image ? `<img class="bi-art" src="${b.image}" alt="${b.name}">` : `<span class="bi-emoji">${b.icon}</span>`}
    ${lvl ? `<span class="bi-lvl">${lvl}</span>` : ''}
  </div>`;
}

defBadge({
  id: 'shelly_vee', owner: 'Shelly', friend: 'Vee',
  name: "Vee's Upgrade Chip",
  icon: '🔌', color: '#7ad1ff',
  desc: "A little logic board Vee soldered together. She insists it's nothing.",
  stat: lvl => `+${(lvl * 3).toFixed(0)}% Shield Power`,
  effect: 'Inspiration also shields the team and adds a flat Attack bonus, both scaling with Badge level.',
  apply(u, B, lvl) {
    u.flat.shieldPowP = (u.flat.shieldPowP || 0) + lvl * .03;
    u.dirty = true;
    B.on(u, 'cast', ev => {
      if (ev.key !== 'G') return;
      B.alliesOf(u).forEach(a => {
        B.shield(u, a, u.st.mag * (.18 + lvl * .05), 10);
        a.flat.atkP2 = (a.flat.atkP2 || 0) + .015 * lvl;
        a.dirty = true;
      });
    });
  }
});

defBadge({
  id: 'poppy_boxten', owner: 'Boxten', friend: 'Poppy',
  name: "Poppy's Lucky Charm",
  icon: '🍀', color: '#ffb3d1',
  desc: "Something Poppy found under a table and pressed into his hand, insisting it was good luck.",
  stat: lvl => `+${(lvl * 2.5).toFixed(1)}% Evasion`,
  effect: 'Music Box Melody always grants Tempo, even on a single hit, briefly speeds Boxten up, and cleanses one debuff - all scaling with Badge level.',
  apply(u, B, lvl) {
    u.flat.evaP = (u.flat.evaP || 0) + lvl * .025;
    u.dirty = true;
    B.on(u, 'cast', ev => {
      if (ev.key !== 'G') return;
      B.applyStatus(u, u, 'tempo', 8, { stacks: 1 + Math.floor(lvl / 2) });
      B.applyStatus(u, u, 'speedup', 3 + lvl * .4);
      B.cleanse(u, 1);
    });
  }
});

defBadge({
  id: 'poppy_toodles', owner: 'Poppy', friend: 'Toodles',
  name: "Toodles' Magnifying Glass",
  icon: '🔍', color: '#ffe27a',
  desc: "Toodles lent it to her for a case. Poppy never quite gave it back.",
  stat: lvl => `+${(lvl * 1.5).toFixed(1)}% Crit Chance`,
  effect: "When Poppy's Bubble Bounce pops, the nearest enemy loses up to two buffs and is Weakened - Toodles always finds the evidence, scaling with Badge level.",
  apply(u, B, lvl) {
    u.flat.crit = (u.flat.crit || 0) + lvl * .015;
    u.dirty = true;
    B.on(u, 'poppyBubblePop', () => {
      if (!u.alive) return;
      const t = B.nearest(u, B.enemiesOf(u));
      if (t) { B.dispel(t, 1 + Math.floor(lvl / 3)); B.applyStatus(u, t, 'weaken', 2 + lvl * .4); }
    });
  }
});

defBadge({
  id: 'dyle_shrimpo', owner: 'Dyle', friend: 'Shrimpo',
  name: "Shrimpo's Whistle",
  icon: '🚨', color: '#ffce54',
  desc: "Shrimpo swears he didn't leave it behind on purpose. Dyle kept it anyway.",
  stat: lvl => `+${(lvl * 2).toFixed(0)}% Armor Pen`,
  effect: 'At battle start, Dyle stuns every opposing Hero. When Dyle is hit, the attacker is briefly Stunned; both effects scale with Badge level.',
  apply(u, B, lvl) {
    u.flat.armorPen = (u.flat.armorPen || 0) + lvl * .02;
    u.dirty = true;
    badgeOpeningStunGuard(u, B, lvl);
    B.on(u, 'cast', ev => {
      if (ev.key !== 'G') return;
      const t = B.highestStat(B.enemiesOf(u), 'atk');
      if (t) { B.markRail(u, t); B.dispel(t, 1 + (lvl >= 4 ? 1 : 0)); }
    });
  }
});

defBadge({
  id: 'squirm_cocoa', owner: 'Squirm', friend: 'Cocoa',
  name: "Cocoa's Emergency Bonbon",
  icon: '🍬', color: '#e99a66',
  desc: 'A Bonbon Cocoa set aside for the next time Squirm starts worrying himself in circles.',
  stat: lvl => `+${(lvl * 3).toFixed(0)}% Healing Received`,
  effect: 'When Squirm is crowd controlled, the Bonbon cleanses a debuff and calms him with a Heal and Shield. Strength and cooldown improve with Badge level.',
  apply(u, B, lvl) {
    u.flat.healRecv8 = (u.flat.healRecv8 || 0) + lvl * .03;
    u.dirty = true;
    B.on(u, 'statusApplied', ev => {
      if (ev.unit !== u || !STATUS[ev.id] || !STATUS[ev.id].cc || B.t < (u._bonbonAt || 0)) return;
      u._bonbonAt = B.t + Math.max(7, 12 - lvl);
      B.cleanse(u, 1 + Math.floor(lvl / 3));
      B.heal(u, u, u.max.hp * (.035 + lvl * .015), { tag: 'Emergency Bonbon' });
      B.shield(u, u, u.max.hp * (.025 + lvl * .012), 6);
      B.fxFloatIcon(u.x, u.y - 105, '🍬', '#f3ad78');
    });
  }
});

defBadge({
  id: 'bassie_shelly', owner: 'Bassie', friend: 'Shelly',
  name: "Shelly's Trilobite",
  icon: '🦴', color: '#b99272',
  desc: 'A tiny fossil Shelly tucked into Bassie\'s basket for good company.',
  stat: lvl => `+${(lvl * 3).toFixed(0)}% Shield Power`,
  effect: 'Every Supply Bassie hands out also grants a small Shield and cleanses one debuff, with its strength scaling with Badge level.',
  apply(u, B, lvl) {
    u.flat.shieldPowP = (u.flat.shieldPowP || 0) + lvl * .03;
    u.dirty = true;
    B.on(u, 'statusApplied', ev => {
      if (ev.id !== 'regen' || ev.src !== u) return;
      B.cleanse(ev.unit, 1);
      B.shield(u, ev.unit, u.st.mag * (.08 + lvl * .025), 5 + lvl * .35);
      B.fxFloatIcon(ev.unit.x, ev.unit.y - 102, '🦴', '#d2ae84');
    });
  }
});

defBadge({
  id: 'eclipse_pebble', owner: 'Eclipse', friend: 'Pebble',
  name: "Pebble's Pack Tag",
  icon: '🐾', color: '#8d79d9',
  desc: 'A tag Pebble wears proudly, even though Dandy insists it was already his.',
  stat: lvl => `+${(lvl * 2).toFixed(0)}% Attack Speed`,
  effect: 'When Eclipse enters Blackout, the pack call cleanses a debuff and grants her a Shield and Energy, scaling with Badge level.',
  apply(u, B, lvl) {
    u.flat.aspdP = (u.flat.aspdP || 0) + lvl * .02;
    u.dirty = true;
    B.on(u, 'statusApplied', ev => {
      if (ev.unit !== u || ev.id !== 'blackout') return;
      B.cleanse(u, 1);
      B.energy(u, 4 + lvl * 3);
      B.shield(u, u, u.max.hp * (.035 + lvl * .012), 4 + lvl * .4);
      B.fxFloatIcon(u.x, u.y - 110, '🐾', '#b9a7ff');
    });
  }
});

defBadge({
  id: 'finn_shelly', owner: 'Finn', friend: 'Shelly',
  name: "Shelly's Fossil Hook",
  icon: '🦴', color: '#b99272',
  desc: 'A fossil Shelly identified with Finn, safely tied to his line for the next discovery.',
  stat: lvl => `+${(lvl * 2).toFixed(0)}% Control Duration`,
  effect: 'When Finn hooks or splashes an enemy, the fossil strips a buff and helps him reel in Energy, scaling with Badge level.',
  apply(u, B, lvl) {
    u.ccDurBonus = (u.ccDurBonus || 0) + lvl * .02;
    u.dirty = true;
    B.on(u, 'statusApplied', ev => {
      if (ev.src !== u || ev.unit.team === u.team || !['hooked', 'barnabysplash'].includes(ev.id)) return;
      B.energy(u, 2 + lvl);
      B.dispel(ev.unit, 1 + (lvl >= 4 ? 1 : 0));
      B.fxFloatIcon(u.x, u.y - 105, '🦴', '#d2ae84');
    });
  }
});

defBadge({
  id: 'sora_dandy', owner: 'Sora', friend: 'Dandy',
  name: "Dandy's Golden Key",
  icon: '🔑', color: '#f2c45c',
  desc: 'A little golden key Dandy pressed into Sora\'s hand before the elevator descended.',
  stat: lvl => `+${(lvl * 2).toFixed(0)}% Critical Damage`,
  effect: 'Sora can turn Dandy\'s attention loop into momentum: marked enemies are Exposed, while Dandy\'s Neglect restores Energy when Sora hits them.',
  apply(u, B, lvl) {
    u.flat.critDmg = (u.flat.critDmg || 0) + lvl * .02;
    u.dirty = true;
    B.on(u, 'dealDamage', ev => {
      const t = ev.target;
      if (!t || t.team === u.team || ev.dot) return;
      if (t.hasStatus('neglect')) {
        B.energy(u, 2 + lvl);
        B.applyStatus(u, t, 'exposed', 2.5 + lvl * .35, { stacks: 1 + Math.floor(lvl / 3) });
        B.fxFloatIcon(t.x, t.y - 105, '🔑', '#f2c45c');
      } else if (!ev.basic && B.t >= (u._gardenviewKeyAt || 0)) {
        u._gardenviewKeyAt = B.t + Math.max(4, 7 - lvl * .45);
        B.applyStatus(u, t, 'neglect', 2.5 + lvl * .45, { stacks: 1 });
      }
    });
    B.on(u, 'allyDamaged', ev => {
      if (!ev.src || ev.unit === u || ev.src.team === u.team || B.t < (u._gardenviewGuardAt || 0)) return;
      u._gardenviewGuardAt = B.t + Math.max(4.5, 8 - lvl * .5);
      B.applyStatus(u, ev.src, 'attention', 2 + lvl * .35, { stacks: 1 });
    });
  }
});

defBadge({
  id: 'scraps_yatta', owner: 'Scraps', friend: 'Yatta',
  name: "Yatta's Signed Marker",
  icon: '🖍️', color: '#ff9fb9',
  desc: 'Yatta signed the back of the restored poster and handed the marker to Scraps.',
  stat: lvl => `+${(lvl * 2).toFixed(0)}% Attack`,
  effect: 'Scraps builds Celebration while dealing Craft damage. The completed burst cracks enemy Shields and, at higher Badge levels, also restores Energy.',
  apply(u, B, lvl) {
    u.flat.atkP8 = (u.flat.atkP8 || 0) + lvl * .02;
    u.dirty = true;
    B.on(u, 'dealDamage', ev => {
      if (!ev.target || ev.target.team === u.team || ev.dot) return;
      if (!/Craft|Claws|Flail|Yarn|Glue|Scissors|Crayons|Tape/i.test(ev.tag || '')) return;
      u._signedMarkerCrafts = (u._signedMarkerCrafts || 0) + 1;
      if (u._signedMarkerCrafts % 3) return;
      B.applyStatus(u, u, 'celebration', 8 + lvl * .5, { stacks: 1 });
      B.crackShield(u, ev.target, .06 + lvl * .012, { color: '#ff9fb9' });
      if (lvl >= 3) B.energy(u, 2 + lvl);
      B.fxFloatIcon(u.x, u.y - 105, '🖍️', '#ff9fb9');
    });
  }
});

defBadge({
  id: 'goofy_rodger', owner: 'Goofy', friend: 'Rodger',
  name: "Rodger's Case File",
  icon: '📁', color: '#b8c6d8',
  desc: 'Rodger kept the unfinished case file open until Goofy found his way back to Sora.',
  stat: lvl => `+${(lvl * 2).toFixed(0)}% Shield Power`,
  effect: 'When an ally is damaged, Goofy can cleanse a debuff and turn the clue into a brief protective shield. The shield strengthens with Badge level.',
  apply(u, B, lvl) {
    u.flat.shieldPowP = (u.flat.shieldPowP || 0) + lvl * .02;
    u.dirty = true;
    B.on(u, 'allyDamaged', ev => {
      if (!ev.unit || ev.unit.team !== u.team || ev.src && ev.src.team === u.team || B.t < (u._caseFileGuardAt || 0)) return;
      u._caseFileGuardAt = B.t + Math.max(4.5, 8 - lvl * .55);
      B.cleanse(ev.unit, 1);
      B.shield(u, ev.unit, u.st.hp * (.025 + lvl * .008), 5 + lvl * .4);
      B.fxFloatIcon(ev.unit.x, ev.unit.y - 105, '📁', '#b8c6d8');
    });
  }
});

defBadge({
  id: 'rudie_eggson', owner: 'Rudie', friend: 'Eggson',
  name: "Eggson's Hunt Token",
  icon: '🥚', color: '#f6d58a',
  desc: 'A polished hunt token from Eggson, awarded after Rudie finally found the last package.',
  stat: lvl => `+${(lvl * 2).toFixed(0)}% Move Speed · Full Energy opener`,
  effect: 'At the start of each wave, Rudie is filled with Energy and immediately uses Antler Rush. Every third hit still gives Momentum; hitting an enemy with Eggson\'s Found status adds an extra stack and strips a buff.',
  apply(u, B, lvl) {
    u.flat.msP8 = (u.flat.msP8 || 0) + lvl * .02;
    u.dirty = true;
    // Battle timers begin after the intro walk, making this a true combat
    // opener while still using the normal White-skill windup and Energy cost.
    B.after(.05, () => {
      if (!u.alive || u._rudieFriendshipOpening) return;
      u._rudieFriendshipOpening = true;
      B.energy(u, u.energyMax);
      if (typeof AI !== 'undefined') AI.beginCast(u, B, 'W');
    });
    B.on(u, 'dealDamage', ev => {
      if (!ev.target || ev.target.team === u.team || ev.dot) return;
      u._eggHuntHits = (u._eggHuntHits || 0) + 1;
      if (u._eggHuntHits % 3) return;
      const extra = ev.target.hasStatus('found') ? 1 : 0;
      B.applyStatus(u, u, 'momentum', 7 + lvl * .5, { stacks: 1 + extra + Math.floor(lvl / 3) });
      if (extra) B.dispel(ev.target, 1 + (lvl >= 4 ? 1 : 0));
      B.fxFloatIcon(u.x, u.y - 105, '🥚', '#f6d58a');
    });
  }
});

defBadge({
  id: 'shrimpo_waxwell', owner: 'Shrimpo', friend: 'Waxwell',
  name: "Waxwell's Singed Match", icon: '🕯️', color: '#ff9c3e',
  desc: 'A blackened match Waxwell insists was part of a much more dangerous plan.',
  stat: lvl => `+${(lvl * 2).toFixed(0)}% Critical Damage`,
  effect: 'At battle start, Shrimpo stuns every opposing Hero. When Shrimpo is hit, the attacker is Stunned and Lit Up, losing Evasion; the effects scale with Badge level.',
  apply(u, B, lvl) {
    u.flat.critDmg = (u.flat.critDmg || 0) + lvl * .02;
    u.dirty = true;
    badgeOpeningStunGuard(u, B, lvl);
    B.on(u, 'damaged', ev => {
      if (ev.dot || !ev.src || ev.src.team === u.team || B.t < (u._singedMatchAt || 0)) return;
      u._singedMatchAt = B.t + Math.max(.8, 2.2 - lvl * .18);
      B.applyStatus(u, ev.src, 'litup', 2.5 + lvl * .45);
      B.applyStatus(u, ev.src, 'evadown', 2.5 + lvl * .35);
      if (lvl >= 3) B.energy(u, 1 + lvl);
      B.fxFloatIcon(ev.src.x, ev.src.y - 105, '🕯️', '#ff9c3e');
    });
  }
});

defBadge({
  id: 'waxwell_soulvester', owner: 'Waxwell', friend: 'Soulvester',
  name: "Soulvester's Dungeon Key", icon: '🗝️', color: '#aeb8c9',
  desc: 'A heavy key Soulvester gave Waxwell after surviving the very first dungeon.',
  stat: lvl => `+${(lvl * 2).toFixed(0)}% Magic Damage`,
  effect: 'Applying Waxwell control strips a buff, grants Ignited briefly, and restores Energy, scaling with Badge level.',
  apply(u, B, lvl) {
    u.flat.magP = (u.flat.magP || 0) + lvl * .02;
    u.dirty = true;
    B.on(u, 'statusApplied', ev => {
      if (ev.src !== u || !ev.unit || ev.unit.team === u.team || !['root', 'waxsnuffed', 'waxcooldowns'].includes(ev.id)) return;
      B.applyStatus(u, u, 'waxignited', 2.5 + lvl * .45);
      B.dispel(ev.unit, 1 + (lvl >= 4 ? 1 : 0));
      B.energy(u, 1 + lvl);
      B.fxFloatIcon(u.x, u.y - 105, '🗝️', '#aeb8c9');
    });
  }
});

defBadge({
  id: 'yatta_looey', owner: 'Yatta', friend: 'Looey',
  name: "Looey's Repaired Ribbon", icon: '🎀', color: '#ff8fb0',
  desc: 'A stitched ribbon from the recovered banner. It is a little crooked, but it is still theirs.',
  stat: lvl => `+${(lvl * 2).toFixed(0)}% Critical Chance`,
  effect: 'When Yatta Dizzies or Stuns an enemy, she strips a buff, becomes Encouraged, and regains Energy. All improve with Badge level.',
  apply(u, B, lvl) {
    u.flat.crit = (u.flat.crit || 0) + lvl * .02;
    u.dirty = true;
    B.on(u, 'statusApplied', ev => {
      if (ev.src !== u || !ev.unit || ev.unit.team === u.team || !['dizzy', 'stun'].includes(ev.id)) return;
      B.dispel(ev.unit, 1 + (lvl >= 4 ? 1 : 0));
      B.applyStatus(u, u, 'encouraged', 3 + lvl * .45);
      B.energy(u, 2 + lvl * 2);
      B.fxFloatIcon(u.x, u.y - 105, '🎀', '#ff8fb0');
    });
  }
});
