/* badges.js - Friendship Badges: one unique badge per Hero+friend pair, earned
   by clearing that pair's Friendship Campaign (campaigns.js). Like a Trinket
   in that it equips into a slot and applies a small always-on effect, but a
   Badge is tied to a *specific* Hero (only they can wear it) and levels up by
   spending the friend's shards rather than drops/rank-merging. Enemies can
   also be dressed in a Badge by equipEnemyLoadout() in meta/modes.js,
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
    ${b.image ? `<img class="bi-art" src="${b.image}" alt="${b.name}" loading="lazy" decoding="async">` : `<span class="bi-emoji">${b.icon}</span>`}
    ${lvl ? `<span class="bi-lvl">${lvl}</span>` : ''}
  </div>`;
}

defBadge({
  id: 'shelly_vee', owner: 'Shelly', friend: 'Vee',
  name: "Vee's Upgrade Chip",
  icon: '🔌', color: '#7ad1ff',
  desc: "A little logic board Vee soldered together. She insists it's nothing.",
  stat: lvl => `+${(12 + lvl * 6).toFixed(0)}% Shield Power · +${(10 + lvl * 5).toFixed(0)}% Skill Haste`,
  effect: "Vee's high-tech microcircuitry overclocks Shelly's supportive archaeology! Casting Encouragement or at wave start deploys an Overclocked Field, granting all allies an 18%+ Max HP Shield for 8s, cleansing 1 debuff, and granting +25% Attack Speed and +20% Attack for 6s. Whenever Shelly or a shielded ally takes damage, the chip triggers an Electrostatic Discharge: shocks the attacker for Magic Damage, stuns them for 1.2s, drains 15 Energy, and dispels 1 buff.",
  apply(u, B, lvl) {
    u.flat.shieldPowP = (u.flat.shieldPowP || 0) + (0.12 + lvl * 0.06);
    u.flat.cdr = (u.flat.cdr || 0) + (0.10 + lvl * 0.05);
    u.dirty = true;

    const deployOverclock = () => {
      if (!u.alive) return;
      Sound.play('get_rare', { vol: 0.42 });
      B.fxRing(u.x, u.y - 35, 180, '#7ad1ff', 0.45);
      B.alliesOf(u).forEach(a => {
        B.shield(u, a, u.max.hp * (0.18 + lvl * 0.05), 8);
        B.cleanse(a, 1);
        B.applyStatus(u, a, 'haste', 6);
        B.applyStatus(u, a, 'atkup', 6, { val: 0.20 });
        B.fxSparkle(a.x, a.y - 45, 8, '#7ad1ff');
      });
      B.fxFloatIcon(u.x, u.y - 110, '🔌 OVERCLOCK', '#7ad1ff');
    };

    B.after(0.2, deployOverclock);
    B.on(u, 'cast', ev => {
      if (ev.key === 'G') deployOverclock();
    });

    // Retaliatory Electrostatic Discharge
    B.on(u, 'damaged', ev => {
      if (!ev.src || ev.src.team === u.team || ev.dot || !ev.src.alive) return;
      if (B.t < (u._veeDischargeAt || 0)) return;
      u._veeDischargeAt = B.t + Math.max(2.5, 4.5 - lvl * 0.3);
      Sound.play('hit_magic', { vol: 0.45 });
      B.damage(u, ev.src, u.st.mag * (0.45 + lvl * 0.15), { type: 'magic', tag: 'Electrostatic Discharge' });
      B.applyStatus(u, ev.src, 'stun', 1.2);
      B.dispel(ev.src, 1);
      B.energy(ev.src, -15);
      B.fxSparkle(ev.src.x, ev.src.y - 45, 10, '#7ad1ff');
      B.fxFloatIcon(ev.src.x, ev.src.y - 100, '⚡ SHOCK', '#7ad1ff');
    });
  }
});

defBadge({
  id: 'poppy_boxten', owner: 'Boxten', friend: 'Poppy',
  name: "Poppy's Lucky Charm",
  icon: '🍀', color: '#ffb3d1',
  desc: "Something Poppy found under a table and pressed into his hand, insisting it was good luck.",
  stat: lvl => `+${(lvl * 3).toFixed(0)}% Skill Haste · +${(lvl * 2.5).toFixed(1)}% Evasion`,
  effect: 'Boxten’s Music Box Melody triggers a Clockwork Crescendo: cleanses 2 debuffs from all allies, grants 2 stacks of Tempo, and reduces all allies\' skill cooldowns by 1.2s+. When any ally under Tempo lands an ability, a Lucky Bubble bursts over the target, dealing magic damage, draining 15 Energy, and charming them for 1.2s.',
  apply(u, B, lvl) {
    u.flat.cdr = (u.flat.cdr || 0) + lvl * .03;
    u.flat.evaP = (u.flat.evaP || 0) + lvl * .025;
    u.dirty = true;
    B.on(u, 'cast', ev => {
      if (ev.key !== 'G') return;
      Sound.play('ticktock', { vol: .45 });
      Sound.play('get_rare', { vol: .35, priority: true });
      B.alliesOf(u).forEach(a => {
        B.cleanse(a, 2);
        B.applyStatus(u, a, 'tempo', 8 + lvl * .5, { stacks: 2 + (lvl >= 4 ? 1 : 0) });
        B.applyStatus(u, a, 'speedup', 4 + lvl * .4);
        B.reduceCd(a, 1.2 + lvl * .35);
        B.fxSparkle(a.x, a.y - 40, 8, '#ffb3d1');
      });
      B.fxRing(u.x, u.y - 35, 140, '#ffb3d1', .4);
      B.fxFloatIcon(u.x, u.y - 105, '🍀', '#ffb3d1');
    });

    B.on(u, 'allyDamageDealt', ev => {
      if (!ev || !ev.src || !ev.target || ev.basic || ev.dot || !ev.target.alive) return;
      if (!ev.src.hasStatus || !ev.src.hasStatus('tempo')) return;
      const now = B.t;
      if (now < (ev.target._luckyBubbleAt || 0)) return;
      ev.target._luckyBubbleAt = now + Math.max(3.0, 5.5 - lvl * .4);
      Sound.play('bubblepop', { vol: .4, throttle: 120 });
      B.fxRing(ev.target.x, ev.target.y - 35, 75, '#ffb3d1', .3);
      B.damage(u, ev.target, u.st.mag * (.60 + lvl * .18), { type: 'magic', tag: 'Lucky Bubble' });
      B.applyStatus(u, ev.target, 'charm', 1.2);
      ev.target.energy = Math.max(0, ev.target.energy - 15);
      B.fxFloatIcon(ev.target.x, ev.target.y - 100, '🫧', '#ffb3d1');
    });
  }
});

defBadge({
  id: 'poppy_toodles', owner: 'Poppy', friend: 'Toodles',
  name: "Toodles' Magnifying Glass",
  icon: '🔍', color: '#ffe27a',
  desc: "Toodles lent it to her for a case. Poppy never quite gave it back.",
  stat: lvl => `+${(12 + lvl * 6).toFixed(0)}% Critical Hit Chance · +${(10 + lvl * 5).toFixed(0)}% Movement Speed`,
  effect: "Toodles' forensic lens reveals every enemy flaw through Poppy's bubbles! When Bubble Bounce pops or hits an enemy, it dispels 2 buffs from all enemies struck, Weakens them by 25%+ for 5s, and applies 🎯 Exposed for 6s. Whenever Poppy or an ally falls below 45% HP, Poppy immediately encases them in a Protective Clue Bubble (18%+ Max HP shield, 3s CC Immunity, and 12%+ Max HP heal) while restoring 30 Energy to Poppy.",
  apply(u, B, lvl) {
    u.flat.crit = (u.flat.crit || 0) + (0.12 + lvl * 0.06);
    u.flat.msP = (u.flat.msP || 0) + (0.10 + lvl * 0.05);
    u.dirty = true;

    // Magnifying Glass Pop Debuffs & Expose
    const applyEvidence = target => {
      if (!target || !target.alive || target.team === u.team) return;
      B.dispel(target, 2);
      B.applyStatus(u, target, 'weaken', 5, { val: 0.25 + lvl * 0.05 });
      B.applyStatus(u, target, 'exposed', 6);
      B.fxFloatIcon(target.x, target.y - 100, '🔍 EVIDENCE', '#ffe27a');
    };

    B.on(u, 'poppyBubblePop', () => {
      if (!u.alive) return;
      Sound.play('bubblepop', { vol: 0.45 });
      B.enemiesOf(u).forEach(e => {
        if (Math.abs(e.x - u.x) < 260) applyEvidence(e);
      });
    });

    B.on(u, 'dealDamage', ev => {
      if (!ev.target || ev.target.team === u.team || ev.dot) return;
      if (ev.tag && ev.tag.includes('Bubble')) applyEvidence(ev.target);
    });

    // Mystery Clue Rescue Bubble (<45% HP)
    B.on(u, 'allyDamaged', ev => {
      const a = ev.unit;
      if (!a || !a.alive || a.team !== u.team || B.t < (u._toodlesClueRescueAt || 0)) return;
      if (a.hpPct <= 0.45) {
        u._toodlesClueRescueAt = B.t + 10;
        Sound.play('get_rare', { vol: 0.48 });
        B.shield(u, a, u.max.hp * (0.18 + lvl * 0.05), 6);
        B.applyStatus(u, a, 'ccimmune', 3);
        B.heal(u, a, a.max.hp * (0.12 + lvl * 0.04), { tag: 'Clue Rescue' });
        B.energy(u, 30);
        B.fxRing(a.x, a.y - 35, 120, '#ffe27a', 0.4);
        B.fxFloatIcon(a.x, a.y - 105, '🔍 RESCUE!', '#ffe27a');
      }
    });
  }
});

defBadge({
  id: 'dyle_shrimpo', owner: 'Dyle', friend: 'Shrimpo',
  name: "Shrimpo's Whistle",
  icon: '🚨', color: '#ffce54',
  desc: "Shrimpo swears he didn't leave it behind on purpose. Dyle kept it anyway.",
  stat: lvl => `+${(12 + lvl * 6).toFixed(0)}% Armor Penetration · +${(10 + lvl * 5).toFixed(0)}% Attack`,
  effect: "Shrimpo's conductor whistle commands absolute track discipline! At battle start, Dyle blows the whistle: Stuns all enemies for 1.5s+, interrupts channeled skills, and immediately marks the highest-Attack enemy with 🚂 Rail Marker. When Dyle is hit, the attacker is knocked back, Stunned for 1.2s, and suffers 25%+ Armor shred for 5s. Damaging a Rail Marker enemy restores 15+ Energy and grants Dyle +30% Attack Speed for 4s.",
  apply(u, B, lvl) {
    u.flat.armorPen = (u.flat.armorPen || 0) + (0.12 + lvl * 0.06);
    u.flat.atkP = (u.flat.atkP || 0) + (0.10 + lvl * 0.05);
    u.dirty = true;
    badgeOpeningStunGuard(u, B, lvl);

    // Opening Whistle Blast
    B.after(0.15, () => {
      if (!u.alive) return;
      Sound.play('warn', { vol: 0.5 });
      Sound.play('steam', { vol: 0.6 });
      B.shake(8, 0.25);
      B.enemiesOf(u).forEach(e => {
        B.applyStatus(u, e, 'stun', 1.5 + lvl * 0.25);
        B.interrupt(e);
        B.fxFloatIcon(e.x, e.y - 95, '🚨 HALT!', '#ffce54');
      });
      const t = B.highestStat(B.enemiesOf(u), 'atk');
      if (t) {
        B.markRail(u, t);
        B.dispel(t, 2);
      }
    });

    // Whistle Blast Retaliation
    B.on(u, 'damaged', ev => {
      if (!ev.src || ev.src.team === u.team || ev.dot || !ev.src.alive) return;
      if (B.t < (u._shrimpoWhistleAt || 0)) return;
      u._shrimpoWhistleAt = B.t + Math.max(2.5, 4.0 - lvl * 0.3);
      Sound.play('whistle', { vol: 0.45 });
      B.knockback(u, ev.src, 110);
      B.applyStatus(u, ev.src, 'stun', 1.2);
      B.applyStatus(u, ev.src, 'defdown', 5, { val: 0.25 + lvl * 0.05 });
      B.fxFloatIcon(ev.src.x, ev.src.y - 100, '🚨', '#ffce54');
    });

    // Express Boarding on Rail Marker
    B.on(u, 'dealDamage', ev => {
      if (!ev.target || ev.target.team === u.team || ev.dot) return;
      if (ev.target.hasStatus('railmarker')) {
        B.energy(u, 15 + lvl * 5);
        B.applyStatus(u, u, 'haste', 4);
        B.fxSparkle(u.x, u.y - 45, 6, '#ffce54');
      }
    });
  }
});

defBadge({
  id: 'squirm_cocoa', owner: 'Squirm', friend: 'Cocoa',
  name: "Cocoa's Emergency Bonbon",
  icon: '🍬', color: '#e99a66',
  desc: 'A Bonbon Cocoa set aside for the next time Squirm starts worrying himself in circles.',
  stat: lvl => `+${(12 + lvl * 6).toFixed(0)}% Max HP · +${(12 + lvl * 6).toFixed(0)}% Healing Received`,
  effect: "Cocoa's soothing treat turns panic into comforting fortitude! Whenever Squirm is hit by Crowd Control or drops below 50% HP, he consumes an Emergency Bonbon: cleanses all CC and 2 debuffs, gains 3s CC Immunity, heals for 16%+ Max HP, and gains a 15%+ Max HP Shield for 6s. Casting Please Don't Hurt Me or Nervous Flailing scatters sweet crumbs: granting all allies 2 stacks of Fortify, +25% Move Speed, and regenerating 8%+ Max HP over 4s.",
  apply(u, B, lvl) {
    u.flat.hpP = (u.flat.hpP || 0) + (0.12 + lvl * 0.06);
    u.flat.healRecv = (u.flat.healRecv || 0) + (0.12 + lvl * 0.06);
    u.dirty = true;

    // Emergency Bonbon Surge
    const eatEmergencyBonbon = () => {
      if (!u.alive || B.t < (u._bonbonAt || 0)) return;
      u._bonbonAt = B.t + Math.max(6, 10 - lvl * 0.8);
      Sound.play('get_rare', { vol: 0.48 });
      Sound.play('squirm_book_chomp', { vol: 0.55 });
      B.cleanse(u, 3);
      B.applyStatus(u, u, 'ccimmune', 3);
      B.heal(u, u, u.max.hp * (0.16 + lvl * 0.04), { tag: 'Emergency Bonbon' });
      B.shield(u, u, u.max.hp * (0.15 + lvl * 0.04), 6);
      B.fxFloatIcon(u.x, u.y - 110, '🍬 EMERGENCY BONBON', '#f3ad78');
      B.fxRing(u.x, u.y - 35, 120, '#f3ad78', 0.4);
    };

    B.on(u, 'statusApplied', ev => {
      if (ev.unit === u && STATUS[ev.id] && STATUS[ev.id].cc) eatEmergencyBonbon();
    });

    B.on(u, 'damaged', () => {
      if (u.hpPct <= 0.50) eatEmergencyBonbon();
    });

    // Shared Bonbon Crumbs on G or B
    B.on(u, 'cast', ev => {
      if (ev.key !== 'G' && ev.key !== 'B') return;
      Sound.play('get_food', { vol: 0.42 });
      B.alliesOf(u).forEach(a => {
        B.applyStatus(u, a, 'fortify', 5, { stacks: 2 });
        B.applyStatus(u, a, 'speedup', 4);
        B.applyStatus(u, a, 'regen', 4, { val: a.max.hp * (0.08 + lvl * 0.02) });
        B.fxSparkle(a.x, a.y - 45, 6, '#e99a66');
      });
      B.fxFloatIcon(u.x, u.y - 105, '🍬 CRUMBS', '#e99a66');
    });
  }
});

defBadge({
  id: 'bassie_shelly', owner: 'Bassie', friend: 'Shelly',
  name: "Shelly's Trilobite",
  icon: '🦴', color: '#b99272',
  desc: 'A tiny fossil Shelly tucked into Bassie\'s basket for good company.',
  stat: lvl => `+${(12 + lvl * 6).toFixed(0)}% Shield Power · +${(10 + lvl * 5).toFixed(0)}% Max HP`,
  effect: "Shelly's ancient fossil reinforces Bassie's supplies into impenetrable prehistoric armor! Every Supply handed to an ally cleanses 2 debuffs, grants 2 stacks of Fortify, and wraps them in a Trilobite Shell Shield (16%+ of Bassie's Max HP for 6s). Casting Packed for Everyone unearths a Fossil Discovery: grants all allies 3s CC Immunity and 25 Energy, plus a Ward barrier for the lowest-HP ally. Once per battle, a shielded ally defys lethal damage, healing for 20% Max HP.",
  apply(u, B, lvl) {
    u.flat.shieldPowP = (u.flat.shieldPowP || 0) + (0.12 + lvl * 0.06);
    u.flat.hpP = (u.flat.hpP || 0) + (0.10 + lvl * 0.05);
    u.dirty = true;

    // Supply Trilobite Shield & Cleanse
    B.on(u, 'statusApplied', ev => {
      if (ev.id !== 'regen' || ev.src !== u || !ev.unit || !ev.unit.alive) return;
      B.cleanse(ev.unit, 2);
      B.applyStatus(u, ev.unit, 'fortify', 6, { stacks: 2 });
      B.shield(u, ev.unit, u.max.hp * (0.16 + lvl * 0.05), 6);
      ev.unit._trilobiteAegis = true;
      B.fxFloatIcon(ev.unit.x, ev.unit.y - 105, '🦴 TRILOBITE', '#d2ae84');
      B.fxSparkle(ev.unit.x, ev.unit.y - 45, 6, '#d2ae84');
    });

    // Packed for Everyone Fossil Discovery
    B.on(u, 'cast', ev => {
      if (ev.key !== 'G') return;
      Sound.play('get_rare', { vol: 0.44 });
      B.alliesOf(u).forEach(a => {
        B.applyStatus(u, a, 'ccimmune', 3);
        B.energy(a, 25);
        B.fxSparkle(a.x, a.y - 45, 8, '#d2ae84');
      });
      const lowest = B.lowestHp(B.alliesOf(u));
      if (lowest) B.applyStatus(u, lowest, 'ward', 6);
      B.fxFloatIcon(u.x, u.y - 110, '🦴 FOSSIL DISCOVERY', '#d2ae84');
    });

    // Death Defiance
    u._trilobiteSaveUsed = false;
    B.on(u, 'allyLethal', ev => {
      if (u._trilobiteSaveUsed || !ev || !ev.unit || !ev.unit._trilobiteAegis) return;
      u._trilobiteSaveUsed = true;
      ev.prevented = true;
      const target = ev.unit;
      target.hp = target.max.hp * 0.20;
      B.applyStatus(u, target, 'untargetable', 2);
      B.applyStatus(u, target, 'ccimmune', 2.5);
      B.applyStatus(u, target, 'ward', 3);
      B.cleanse(target, 4);
      Sound.play('revive', { vol: 0.5 });
      B.fxRing(target.x, target.y - 45, 140, '#d2ae84', 0.5);
      B.fxFloatIcon(target.x, target.y - 115, '🦴 FOSSIL SHIELD DEFIED DEATH!', '#d2ae84');
    });
  }
});

defBadge({
  id: 'eclipse_pebble', owner: 'Eclipse', friend: 'Pebble',
  name: "Pebble's Pack Tag",
  icon: '🐾', color: '#8d79d9',
  desc: 'A tag Pebble wears proudly, even though Dandy insists it was already his.',
  stat: lvl => `+${(12 + lvl * 6).toFixed(0)}% Attack Speed · +${(10 + lvl * 5).toFixed(0)}% Evasion`,
  effect: "Pebble's loyal pack bond echoes through the dark! When Eclipse enters Blackout or drops below 50% HP, Pebble's howl cleanses all debuffs, restores 35+ Energy, grants an 18%+ Max HP Pack Shield for 6s, and slashes nearby enemies for Physical Damage, Blinding them for 4s. While Blackout is active, Eclipse gains +35% Critical Chance, attacks shred 25% Armor for 5s, and every hit siphons 8 Energy.",
  apply(u, B, lvl) {
    u.flat.aspdP = (u.flat.aspdP || 0) + (0.12 + lvl * 0.06);
    u.flat.evaP = (u.flat.evaP || 0) + (0.10 + lvl * 0.05);
    u.dirty = true;

    // Pack Howl on Blackout or <50% HP
    const triggerPackHowl = () => {
      if (!u.alive || B.t < (u._pebbleHowlAt || 0)) return;
      u._pebbleHowlAt = B.t + 8;
      Sound.play('pebble_bark', { vol: 0.52 });
      Sound.play('get_rare', { vol: 0.42 });
      B.cleanse(u, 99);
      B.energy(u, 35 + lvl * 10);
      B.shield(u, u, u.max.hp * (0.18 + lvl * 0.05), 6);
      B.fxRing(u.x, u.y - 35, 160, '#8d79d9', 0.45);
      B.fxFloatIcon(u.x, u.y - 110, '🐾 PACK HOWL', '#b9a7ff');

      B.enemiesOf(u).forEach(foe => {
        if (Math.abs(foe.x - u.x) < 240) {
          B.damage(u, foe, u.st.atk * (0.75 + lvl * 0.20), { type: 'physical', tag: 'Shadow Pack Slash' });
          B.applyStatus(u, foe, 'blind', 4);
          B.fxSparkle(foe.x, foe.y - 45, 8, '#8d79d9');
        }
      });
    };

    B.on(u, 'statusApplied', ev => {
      if (ev.unit === u && ev.id === 'blackout') triggerPackHowl();
    });

    B.on(u, 'damaged', () => {
      if (u.hpPct <= 0.50) triggerPackHowl();
    });

    // Blackout Hunting Enhancements
    B.on(u, 'dealDamage', ev => {
      if (!ev.target || ev.target.team === u.team || ev.dot) return;
      if (u.hasStatus('blackout')) {
        B.applyStatus(u, ev.target, 'defdown', 5, { val: 0.25 });
        B.energy(u, 8);
        B.applyStatus(u, u, 'lucky', 3);
      }
    });
  }
});

defBadge({
  id: 'finn_shelly', owner: 'Finn', friend: 'Shelly',
  name: "Shelly's Fossil Hook",
  icon: '🦴', color: '#b99272',
  desc: 'A fossil Shelly identified with Finn, safely tied to his line for the next discovery.',
  stat: lvl => `+${(12 + lvl * 6).toFixed(0)}% Control Duration · +${(10 + lvl * 5).toFixed(0)}% Magic Damage`,
  effect: "Shelly's sharpened trilobite barb snags deep into enemy defenses! When Finn hooks, pulls, or splashes an enemy, the fossil hook rips away up to 2 buffs, Silences them for 2.5s, and restores 25+ Energy to Finn. Enemies hit by Finn's tidal splash suffer 25%+ Magic Defense shred for 6s and are Slowed by 35%, while Finn steals +25% Attack for 6s.",
  apply(u, B, lvl) {
    u.ccDurBonus = (u.ccDurBonus || 0) + (0.12 + lvl * 0.06);
    u.flat.magP = (u.flat.magP || 0) + (0.10 + lvl * 0.05);
    u.dirty = true;

    B.on(u, 'statusApplied', ev => {
      if (ev.src !== u || !ev.unit || ev.unit.team === u.team) return;
      if (['hooked', 'barnabysplash', 'root', 'stun'].includes(ev.id)) {
        B.energy(u, 25 + lvl * 8);
        B.dispel(ev.unit, 2);
        B.applyStatus(u, ev.unit, 'silence', 2.5);
        B.applyStatus(u, ev.unit, 'magdown', 6, { val: 0.25 + lvl * 0.05 });
        B.applyStatus(u, ev.unit, 'slow', 4);
        B.applyStatus(u, u, 'atkup', 6, { val: 0.25 });
        B.fxSparkle(ev.unit.x, ev.unit.y - 45, 8, '#b99272');
        B.fxFloatIcon(u.x, u.y - 105, '🦴 FOSSIL BARB', '#d2ae84');
      }
    });
  }
});

defBadge({
  id: 'sora_dandy', owner: 'Sora', friend: 'Dandy',
  name: "Dandy's Golden Key",
  icon: '🔑', color: '#f2c45c',
  desc: 'A little golden key Dandy pressed into Sora\'s hand before the elevator descended.',
  stat: lvl => `+${(12 + lvl * 6).toFixed(0)}% Critical Damage · +${(10 + lvl * 5).toFixed(0)}% Attack`,
  effect: "Dandy's elevator key unlocks high-speed Keyblade mastery! Striking enemies marked with Neglect or Attention deals 35%+ bonus True Damage, applies 🎯 Exposed for 5s, dispels 1 buff, and siphons 15 Energy to Sora. At wave start or on casting Trinity Limit, Sora gains +30% Attack Speed and +25% Evasion for 6s and projects a 16%+ Max HP Golden Key Barrier over the lowest-HP ally. Whenever an ally takes damage, Sora counter-strikes the attacker for Magic Damage and stuns them for 1.2s.",
  apply(u, B, lvl) {
    u.flat.critDmg = (u.flat.critDmg || 0) + (0.12 + lvl * 0.06);
    u.flat.atkP = (u.flat.atkP || 0) + (0.10 + lvl * 0.05);
    u.dirty = true;

    // Keyblade Drive Opener & Barrier
    const driveOpener = () => {
      if (!u.alive) return;
      Sound.play('get_rare', { vol: 0.45 });
      B.applyStatus(u, u, 'haste', 6);
      B.applyStatus(u, u, 'speedup', 6);
      const lowest = B.lowestHp(B.alliesOf(u)) || u;
      B.shield(u, lowest, u.max.hp * (0.16 + lvl * 0.05), 6);
      B.fxRing(u.x, u.y - 35, 140, '#f2c45c', 0.4);
      B.fxFloatIcon(u.x, u.y - 110, '🔑 KEYBLADE DRIVE', '#f2c45c');
    };

    B.after(0.2, driveOpener);
    B.on(u, 'cast', ev => {
      if (ev.key === 'W') driveOpener();
    });

    // Attention / Neglect Siphon
    B.on(u, 'dealDamage', ev => {
      const t = ev.target;
      if (!t || t.team === u.team || ev.dot) return;
      if (t.hasStatus('neglect') || t.hasStatus('attention')) {
        ev.amount *= (1.35 + lvl * 0.10);
        B.energy(u, 15);
        B.dispel(t, 1);
        B.applyStatus(u, t, 'exposed', 5);
        B.fxSparkle(t.x, t.y - 45, 8, '#f2c45c');
        B.fxFloatIcon(t.x, t.y - 105, '🔑 KEY STRIKE', '#f2c45c');
      } else if (!ev.basic && B.t >= (u._gardenviewKeyAt || 0)) {
        u._gardenviewKeyAt = B.t + Math.max(3.5, 6.0 - lvl * 0.45);
        B.applyStatus(u, t, 'neglect', 4);
      }
    });

    // Retaliatory Keyblade Spark
    B.on(u, 'allyDamaged', ev => {
      if (!ev.src || ev.unit === u || ev.src.team === u.team || !ev.src.alive) return;
      if (B.t < (u._keybladeCounterAt || 0)) return;
      u._keybladeCounterAt = B.t + Math.max(3.0, 5.0 - lvl * 0.4);
      Sound.play('hit_magic', { vol: 0.44 });
      B.damage(u, ev.src, u.st.atk * (0.50 + lvl * 0.15), { type: 'magic', tag: 'Keyblade Spark' });
      B.applyStatus(u, ev.src, 'stun', 1.2);
      B.applyStatus(u, ev.src, 'attention', 4);
      B.fxFloatIcon(ev.src.x, ev.src.y - 105, '🔑 SPARK', '#f2c45c');
    });
  }
});

defBadge({
  id: 'scraps_yatta', owner: 'Scraps', friend: 'Yatta',
  name: "Yatta's Signed Marker",
  icon: '🖍️', color: '#ff9fb9',
  desc: 'Yatta signed the back of the restored poster and handed the marker to Scraps.',
  stat: lvl => `+${(12 + lvl * 6).toFixed(0)}% Attack · +${(10 + lvl * 5).toFixed(0)}% Armor Penetration`,
  effect: "Yatta's vibrant graffiti marker turns Scraps' craft projects into explosive celebration bursts! Every 2 Craft attacks builds Celebration. At 3 stacks, Scraps detonates a Confetti Craft Burst: cracks 40% of enemy shields, deals True Damage, applies 🎯 Exposed for 6s, and restores 20+ Energy. Whenever Scraps or an ally drops below 40% HP, Scraps attaches a Craft Patch: cleanses 2 debuffs, grants 2 stacks of Fortify, and shields them for 18%+ Max HP for 6s.",
  apply(u, B, lvl) {
    u.flat.atkP = (u.flat.atkP || 0) + (0.12 + lvl * 0.06);
    u.flat.armorPen = (u.flat.armorPen || 0) + (0.10 + lvl * 0.05);
    u.dirty = true;

    B.on(u, 'dealDamage', ev => {
      if (!ev.target || ev.target.team === u.team || ev.dot) return;
      if (!/Craft|Claws|Flail|Yarn|Glue|Scissors|Crayons|Tape/i.test(ev.tag || '')) return;
      u._signedMarkerCrafts = (u._signedMarkerCrafts || 0) + 1;
      if (u._signedMarkerCrafts % 2 !== 0) return;

      B.applyStatus(u, u, 'celebration', 8, { stacks: 1 });
      const stacks = (u.getStatus('celebration') || {}).stacks || 0;
      if (stacks >= 3) {
        Sound.play('confetti', { vol: 0.45 });
        Sound.play('cheer_big', { vol: 0.4 });
        B.fxConfetti(ev.target.x, ev.target.y - 55, 20);
        B.crackShield(ev.target, (ev.target.shield || 0) * (0.40 + lvl * 0.10));
        B.damage(u, ev.target, u.st.atk * (0.65 + lvl * 0.18), { type: 'true', area: true, tag: 'Confetti Craft Burst' });
        B.applyStatus(u, ev.target, 'exposed', 6);
        B.energy(u, 20 + lvl * 6);
        B.removeStatus(u, 'celebration');
        B.fxFloatIcon(u.x, u.y - 110, '🖍️ CRAFT BURST!', '#ff9fb9');
      }
    });

    // Craft Patch Rescue
    B.on(u, 'allyDamaged', ev => {
      const a = ev.unit;
      if (!a || !a.alive || a.team !== u.team || B.t < (u._craftPatchAt || 0)) return;
      if (a.hpPct <= 0.40) {
        u._craftPatchAt = B.t + 9;
        Sound.play('get_item', { vol: 0.45 });
        B.cleanse(a, 2);
        B.applyStatus(u, a, 'fortify', 6, { stacks: 2 });
        B.shield(u, a, u.max.hp * (0.18 + lvl * 0.05), 6);
        B.fxRing(a.x, a.y - 35, 120, '#ff9fb9', 0.4);
        B.fxFloatIcon(a.x, a.y - 105, '🖍️ CRAFT PATCH', '#ff9fb9');
      }
    });
  }
});

defBadge({
  id: 'goofy_rodger', owner: 'Goofy', friend: 'Rodger',
  name: "Rodger's Case File",
  icon: '📁', color: '#b8c6d8',
  desc: 'Rodger kept the unfinished case file open until Goofy found his way back to Sora.',
  stat: lvl => `+${(12 + lvl * 6).toFixed(0)}% Shield Power · +${(12 + lvl * 6).toFixed(0)}% Defense`,
  effect: "Rodger's forensic dossiers teach Goofy how to anticipate and intercept every enemy strike! When an ally is attacked, Goofy cleanses 2 debuffs, deflects 30% of incoming damage, and wraps them in a Case File Shield (16%+ Max HP for 6s). Goofy's retaliatory shield-bash slams the attacker for Physical Damage based on Defense, stuns them for 1.5s, and marks them 🕵 Investigated for 6s.",
  apply(u, B, lvl) {
    u.flat.shieldPowP = (u.flat.shieldPowP || 0) + (0.12 + lvl * 0.06);
    u.flat.defP = (u.flat.defP || 0) + (0.12 + lvl * 0.06);
    u.dirty = true;

    B.on(u, 'allyDamaged', ev => {
      if (!ev.unit || ev.unit.team !== u.team || !ev.src || ev.src.team === u.team || !ev.src.alive) return;
      if (B.t < (u._caseFileGuardAt || 0)) return;
      u._caseFileGuardAt = B.t + Math.max(3.0, 5.0 - lvl * 0.4);

      // Cleanse, shield and deflect
      B.cleanse(ev.unit, 2);
      const shieldAmt = u.max.hp * (0.16 + lvl * 0.05);
      B.shield(u, ev.unit, shieldAmt, 6);
      ev.amount *= 0.70;

      // Retaliatory Shield Bash
      Sound.play('guardbreak', { vol: 0.45 });
      B.damage(u, ev.src, u.st.def * (1.20 + lvl * 0.30), { type: 'physical', tag: 'Case File Shield Bash' });
      B.applyStatus(u, ev.src, 'stun', 1.5);
      B.applyStatus(u, ev.src, 'investigated', 6);
      B.knockback(u, ev.src, 90);
      B.fxFloatIcon(ev.src.x, ev.src.y - 105, '📁 CASE CLOSED', '#b8c6d8');
    });
  }
});

defBadge({
  id: 'rudie_eggson', owner: 'Rudie', friend: 'Eggson',
  name: "Eggson's Hunt Token",
  icon: '🥚', color: '#f6d58a',
  desc: 'A polished hunt token from Eggson, awarded after Rudie finally found the last package.',
  stat: lvl => `+${(12 + lvl * 6).toFixed(0)}% Movement Speed · +${(12 + lvl * 6).toFixed(0)}% Attack`,
  effect: "Eggson's veteran prize token sharpens Rudie's delivery rush into an unstoppable charge! At wave start, Rudie fills with full Energy and instantly casts Antler Rush with CC Immunity. Every 3rd hit grants 2 stacks of Momentum. Hitting an enemy marked with Found cracks 50% of their shields, dispels 2 buffs, inflicts -30% Armor shred for 5s, and splashes True Damage. Dropping below 40% HP triggers Package Protection: +35% Tenacity, an 18%+ Max HP shield, and a 140px knockback.",
  apply(u, B, lvl) {
    u.flat.msP = (u.flat.msP || 0) + (0.12 + lvl * 0.06);
    u.flat.atkP = (u.flat.atkP || 0) + (0.12 + lvl * 0.06);
    u.dirty = true;

    // Express Delivery Opener
    B.after(0.05, () => {
      if (!u.alive || u._rudieFriendshipOpening) return;
      u._rudieFriendshipOpening = true;
      B.applyStatus(u, u, 'ccimmune', 3);
      B.energy(u, u.energyMax);
      if (typeof AI !== 'undefined') AI.beginCast(u, B, 'W');
      B.fxFloatIcon(u.x, u.y - 110, '🥚 EXPRESS RUSH', '#f6d58a');
    });

    // Momentum & Found Shatter
    B.on(u, 'dealDamage', ev => {
      if (!ev.target || ev.target.team === u.team || ev.dot) return;
      u._eggHuntHits = (u._eggHuntHits || 0) + 1;
      if (u._eggHuntHits % 3 !== 0) return;

      const isFound = ev.target.hasStatus('found');
      B.applyStatus(u, u, 'momentum', 8, { stacks: 2 });
      if (isFound) {
        Sound.play('glass_break', { vol: 0.45 });
        B.crackShield(ev.target, (ev.target.shield || 0) * (0.50 + lvl * 0.10));
        B.dispel(ev.target, 2);
        B.applyStatus(u, ev.target, 'defdown', 5, { val: 0.30 });
        B.damage(u, ev.target, u.st.atk * (0.50 + lvl * 0.15), { type: 'true', area: true, tag: 'Egg Shatter' });
        B.fxSparkle(ev.target.x, ev.target.y - 45, 10, '#f6d58a');
        B.fxFloatIcon(ev.target.x, ev.target.y - 105, '🥚 SHATTER!', '#f6d58a');
      }
    });

    // Package Protection Rescue (<40% HP)
    B.on(u, 'damaged', () => {
      if (u.hpPct <= 0.40 && B.t >= (u._rudiePackageProtectionAt || 0)) {
        u._rudiePackageProtectionAt = B.t + 10;
        Sound.play('warn', { vol: 0.4 });
        B.applyStatus(u, u, 'ccimmune', 3.5);
        B.shield(u, u, u.max.hp * (0.18 + lvl * 0.05), 6);
        B.enemiesOf(u).forEach(foe => {
          if (Math.abs(foe.x - u.x) < 180) B.knockback(u, foe, 140);
        });
        B.fxFloatIcon(u.x, u.y - 110, '🥚 PACKAGE SAVED!', '#f6d58a');
      }
    });
  }
});

defBadge({
  id: 'shrimpo_waxwell', owner: 'Shrimpo', friend: 'Waxwell',
  name: "Waxwell's Singed Match", icon: '🕯️', color: '#ff9c3e',
  desc: 'A blackened match Waxwell insists was part of a much more dangerous plan.',
  stat: lvl => `+${(10 + lvl * 5).toFixed(0)}% Attack & +${(12 + lvl * 6).toFixed(0)}% Tenacity`,
  effect: 'Temper Tantrum erupts in a Molten Shockwave that deals True Fire Damage, applies Lit Up, shreds Armor, and burns Energy. Below 55% HP, Shrimpo ignites into Molten Fury, gaining a flame barrier, rapid cooldowns, and scorching attackers who strike him.',
  apply(u, B, lvl) {
    u.flat.atkP = (u.flat.atkP || 0) + (0.10 + lvl * 0.05);
    u.flat.tenacity = (u.flat.tenacity || 0) + (0.12 + lvl * 0.06);
    u.dirty = true;
    badgeOpeningStunGuard(u, B, lvl);

    // 1. Temper Tantrum Molten Shockwave
    B.on(u, 'cast', ev => {
      if (ev.key !== 'W') return;
      Sound.play('fire', { vol: .42, throttle: 200 });
      B.fxSparkle(u.x, u.y - 45, 14, '#ff9c3e');
      B.fxRing(u.x, u.y - 35, 260, '#ff9c3e', .45);
      B.enemiesOf(u).forEach(foe => {
        if (!foe.alive || Math.hypot(foe.x - u.x, (foe.depth - u.depth) * B.depthSpan) > 280) return;
        B.damage(u, foe, u.st.atk * (0.45 + lvl * 0.15), { type: 'true', area: true, tag: 'Molten Shockwave' });
        B.applyStatus(u, foe, 'litup', 4 + lvl * 0.5);
        B.applyStatus(u, foe, 'defdown', 4 + lvl * 0.5, { val: 0.20 + lvl * 0.05 });
        B.energy(foe, -(15 + lvl * 5));
        B.fxFloatIcon(foe.x, foe.y - 95, '🔥', '#ff4824');
      });
    });

    // 2. Molten Fury Ignition under 55% HP
    const triggerIgnition = () => {
      if (!u.alive || B.t < (u._moltenIgnitionAt || 0)) return;
      u._moltenIgnitionAt = B.t + 10;
      Sound.play('warn', { vol: .38 });
      Sound.play('fire', { vol: .48, throttle: 180 });
      B.applyStatus(u, u, 'waxignited', 5);
      B.shield(u, u, u.max.hp * (0.15 + lvl * 0.03), 5);
      B.cleanse(u, 2);
      B.fxRing(u.x, u.y - 45, 160, '#ff4824', .5);
      B.fxFloatIcon(u.x, u.y - 110, '🕯️ IGNITED', '#ff9c3e');
    };

    B.on(u, 'damaged', ev => {
      if (ev.dot || !ev.src || ev.src.team === u.team) return;
      if (u.hpPct < 0.55) triggerIgnition();

      // Singed Retaliation
      if (B.t < (u._singedMatchAt || 0)) return;
      u._singedMatchAt = B.t + Math.max(0.8, 2.0 - lvl * 0.18);
      B.applyStatus(u, ev.src, 'litup', 3.0 + lvl * 0.45);
      B.applyStatus(u, ev.src, 'armslow', 2.5 + lvl * 0.35);
      if (u.hasStatus('waxignited')) {
        B.damage(u, ev.src, u.st.atk * (0.35 + lvl * 0.10), { type: 'true', tag: 'Singed Match' });
        B.applyStatus(u, ev.src, 'blind', 2);
      }
      B.fxFloatIcon(ev.src.x, ev.src.y - 105, '🕯️', '#ff9c3e');
    });
  }
});

defBadge({
  id: 'waxwell_soulvester', owner: 'Waxwell', friend: 'Soulvester',
  name: "Soulvester's Dungeon Key", icon: '🗝️', color: '#aeb8c9',
  desc: 'A heavy key Soulvester gave Waxwell after surviving the very first dungeon.',
  stat: lvl => `+${(12 + lvl * 6).toFixed(0)}% Magic Damage · +${(10 + lvl * 5).toFixed(0)}% Skill Haste`,
  effect: "Soulvester's iron key forges Waxwell's melting wax into molten armor and fiery wrath! When Waxwell applies Root or Snuffs an enemy, the heavy key locks them in place: dispels 2 buffs, roots them for an extra 1.5s, shreds their Magic Defense by 25%+ for 6s, burns 20 Energy, and grants Waxwell Ignited and 25 Energy. When Waxwell takes direct damage, he gains a Molten Shield (15%+ Max HP for 5s), reflects 35% damage back as True Fire Damage, and blinds melee attackers for 2.5s.",
  apply(u, B, lvl) {
    u.flat.magP = (u.flat.magP || 0) + (0.12 + lvl * 0.06);
    u.flat.cdr = (u.flat.cdr || 0) + (0.10 + lvl * 0.05);
    u.dirty = true;

    // Molten Dungeon Cage
    B.on(u, 'statusApplied', ev => {
      if (ev.src !== u || !ev.unit || ev.unit.team === u.team || !ev.unit.alive) return;
      if (['root', 'waxsnuffed', 'waxcooldowns'].includes(ev.id)) {
        Sound.play('lock', { vol: 0.45 });
        Sound.play('fire', { vol: 0.42 });
        B.dispel(ev.unit, 2);
        B.applyStatus(u, ev.unit, 'root', 1.5);
        B.applyStatus(u, ev.unit, 'magdown', 6, { val: 0.25 + lvl * 0.05 });
        B.energy(ev.unit, -20);
        B.applyStatus(u, u, 'waxignited', 3.5 + lvl * 0.5);
        B.energy(u, 25);
        B.fxFloatIcon(ev.unit.x, ev.unit.y - 105, '🗝️ LOCKED IN MOLTEN WAX', '#aeb8c9');
      }
    });

    // Knightly Candle Armor
    B.on(u, 'damaged', ev => {
      if (ev.dot || !ev.src || ev.src.team === u.team || !ev.src.alive) return;
      if (B.t < (u._dungeonKeyArmorAt || 0)) return;
      u._dungeonKeyArmorAt = B.t + 6;
      Sound.play('guard', { vol: 0.45 });
      B.shield(u, u, u.max.hp * (0.15 + lvl * 0.04), 5);
      B.applyStatus(u, u, 'reflect', 5, { val: 0.35 });
      if (Math.abs(ev.src.x - u.x) < 200) {
        B.applyStatus(u, ev.src, 'blind', 2.5);
      }
      B.fxFloatIcon(u.x, u.y - 110, '🗝️ MOLTEN KEY ARMOR', '#aeb8c9');
    });
  }
});

defBadge({
  id: 'yatta_looey', owner: 'Yatta', friend: 'Looey',
  name: "Looey's Repaired Ribbon", icon: '🎀', color: '#ff8fb0',
  desc: 'A stitched ribbon from the recovered banner. It is a little crooked, but it is still theirs.',
  stat: lvl => `+${(12 + lvl * 6).toFixed(0)}% Critical Hit Chance · +${(10 + lvl * 5).toFixed(0)}% Movement Speed`,
  effect: "Looey's elastic balloon ribbon gives Yatta acrobatic circus momentum! When Yatta Dizzies or Stuns an enemy, the repaired ribbon snaps in an explosive balloon pop: dispels 2 buffs, deals Magic Damage, grants Yatta Encouraged and +35% Attack Speed for 5s, and restores 25+ Energy. Whenever Yatta dodges an attack or dashes, she gains a Helium Ribbon Shield (14%+ Max HP for 5s) and tangles the nearest attacker, rooting them for 2s.",
  apply(u, B, lvl) {
    u.flat.crit = (u.flat.crit || 0) + (0.12 + lvl * 0.06);
    u.flat.msP = (u.flat.msP || 0) + (0.10 + lvl * 0.05);
    u.dirty = true;

    // Dizzying Pop Finale
    B.on(u, 'statusApplied', ev => {
      if (ev.src !== u || !ev.unit || ev.unit.team === u.team || !ev.unit.alive) return;
      if (['dizzy', 'stun'].includes(ev.id)) {
        Sound.play('pop2', { vol: 0.5 });
        B.dispel(ev.unit, 2);
        B.damage(u, ev.unit, u.st.atk * (0.75 + lvl * 0.20), { type: 'magic', tag: 'Ribbon Pop' });
        B.applyStatus(u, u, 'encouraged', 5);
        B.applyStatus(u, u, 'speedup', 5);
        B.energy(u, 25 + lvl * 8);
        B.fxSparkle(ev.unit.x, ev.unit.y - 45, 10, '#ff8fb0');
        B.fxFloatIcon(u.x, u.y - 105, '🎀 RIBBON POP!', '#ff8fb0');
      }
    });

    // Ribbon Acrobatics on Dodge or Dash
    const ribbonAcrobatics = attacker => {
      if (!u.alive || B.t < (u._ribbonAcrobaticsAt || 0)) return;
      u._ribbonAcrobaticsAt = B.t + 4;
      Sound.play('bounce', { vol: 0.42 });
      B.shield(u, u, u.max.hp * (0.14 + lvl * 0.04), 5);
      if (attacker && attacker.alive && attacker.team !== u.team) {
        B.applyStatus(u, attacker, 'root', 2);
        B.fxFloatIcon(attacker.x, attacker.y - 95, '🎀 TANGLED', '#ff8fb0');
      }
      B.fxFloatIcon(u.x, u.y - 110, '🎀 ACROBATICS', '#ff8fb0');
    };

    B.on(u, 'dodge', ev => {
      ribbonAcrobatics(ev.src);
    });

    B.on(u, 'cast', ev => {
      if (ev.key === 'W' || ev.key === 'G') {
        const nearestFoe = B.nearest(u, B.enemiesOf(u));
        ribbonAcrobatics(nearestFoe);
      }
    });
  }
});

defBadge({
  id: 'sprout_cosmo', owner: 'Sprout', friend: 'Cosmo',
  name: "Cosmo's Pastry Tin", icon: '🧁', color: '#ffd7a0',
  desc: "Cosmo insisted he measured right this time. Sprout adjusted the flour, finished the tray, and makes sure everyone gets exactly one.",
  stat: lvl => `+${(12 + lvl * 6).toFixed(0)}% Healing Power · +${(10 + lvl * 5).toFixed(0)}% Max HP`,
  effect: "Whenever Sprout heals an ally, Cosmo's warm recipe cleanses 1 debuff and wraps them in a Sugar Glaze Shield for 5s (absorbing 8%+ of Sprout's Max HP, doubled if below 50% HP). At the start of each wave, Sprout serves a Finished Tray: every ally receives a Cosmo Pastry token that automatically consumes when dropping below 50% HP, healing for 15%+ Max HP, granting 2 stacks of Fortify, and granting +25% Move Speed. Whenever Sprout saves an ally from lethal damage with I've Got You, Sprout refunds 60+ Energy and shields both of them for 8s.",
  apply(u, B, lvl) {
    u.flat.healPowP = (u.flat.healPowP || 0) + (0.12 + lvl * 0.06);
    u.flat.hpP = (u.flat.hpP || 0) + (0.10 + lvl * 0.05);
    u.dirty = true;

    // 1. Fresh Sugar Glaze Shield & Cleanse on heal
    B.on(u, 'healDone', ev => {
      if (!ev || !ev.target || !ev.target.alive || ev.target.team !== u.team) return;
      const t = ev.target;
      const now = B.t;
      if (now < (t._cosmoGlazeAt || 0)) return;
      t._cosmoGlazeAt = now + 1.2;

      B.cleanse(t, 1);
      const isLow = t.hpPct < 0.50;
      const shieldRatio = (0.08 + lvl * 0.025) * (isLow ? 2 : 1);
      B.shield(u, t, u.max.hp * shieldRatio, 5);
      if (isLow) {
        B.applyStatus(u, t, 'ward', 4);
      }
      B.fxFloatIcon(t.x, t.y - 100, '🧁', '#ffd7a0');
      B.fxSparkle(t.x, t.y - 45, 6, '#ffd7a0');
    });

    // 2. Wave start: "One Each" Finished Tray (Cosmo Pastry token for all allies)
    const servePastryTray = () => {
      if (!u.alive) return;
      Sound.play('get_food', { vol: 0.45 });
      B.fxRing(u.x, u.y - 35, 180, '#ffd7a0', 0.45);
      B.alliesOf(u).forEach(a => {
        a._cosmoPastryToken = true;
        B.fxFloatIcon(a.x, a.y - 90, '🥐', '#ffd7a0');
      });
    };

    B.after(0.2, servePastryTray);

    // Watch allies for the Cosmo Pastry trigger (when dropping below 50% HP)
    B.on(u, 'allyDamaged', ev => {
      const a = ev.unit;
      if (!a || !a.alive || a.team !== u.team || !a._cosmoPastryToken) return;
      if (a.hpPct <= 0.50) {
        a._cosmoPastryToken = false;
        Sound.play('heal', { vol: 0.5 });
        Sound.play('get_rare', { vol: 0.35 });
        const healAmt = a.max.hp * (0.15 + lvl * 0.04);
        B.heal(u, a, healAmt, { tag: "Cosmo's Pastry" });
        B.cleanse(a, 1 + Math.floor(lvl / 3));
        B.applyStatus(u, a, 'fortify', 5 + lvl * 0.4, { stacks: 2 });
        B.applyStatus(u, a, 'speedup', 4);
        B.fxFloatIcon(a.x, a.y - 105, '🍰', '#ffe27a');
        B.fxSparkle(a.x, a.y - 50, 10, '#ffd7a0');
        B.fxRing(a.x, a.y - 35, 120, '#ffd7a0', 0.35);
      }
    });

    // 3. Synergy with "I've Got You" (KO rescue)
    B.on(u, 'allyLethal', ev => {
      if (!ev.unit || ev.unit === u) return;
      B.after(0.05, () => {
        if (!u.alive) return;
        B.energy(u, 60 + lvl * 20);
        const shieldAmt = u.max.hp * (0.15 + lvl * 0.05);
        B.shield(u, u, shieldAmt, 8);
        if (ev.unit.alive) {
          B.shield(u, ev.unit, shieldAmt, 8);
          B.applyStatus(u, ev.unit, 'ward', 5);
          B.fxFloatIcon(ev.unit.x, ev.unit.y - 110, '🛡️', '#ffd7a0');
        }
        B.fxFloatIcon(u.x, u.y - 110, '✨', '#ffd7a0');
        Sound.play('cheer_big', { vol: 0.5 });
      });
    });
  }
});

defBadge({
  id: 'wishbeargigi_gourdy', owner: 'WishBearGigi', friend: 'Gourdy',
  name: "Gourdy's Wishing Pumpkin", icon: '🎃', color: '#ff9d4d',
  desc: "A glowing pumpkin bucket stuffed with star candies and a handwritten note from Gourdy: 'Wish for whatever you want, but don't eat the vibrating jellybeans.'",
  stat: lvl => `+${(12 + lvl * 6).toFixed(0)}% Magic Damage · +${(10 + lvl * 5).toFixed(0)}% Skill Haste`,
  effect: "Gourdy's sweet chaos supercharges Gigi's prize wheel! At battle start, Gigi begins with a Primed Jackpot and +30% Attack Speed. Whenever Gigi casts Wish Wheel or hits a Jackpot, Gourdy's Wishing Pumpkin erupts with flying Treat Candies, granting all allies 2 random Treat buffs (Attack Up, Speed Up, Fortify, or Lucky Crit) for 6s, while enemies slip on pumpkin candy, suffering 20%+ Magic Defense shred. Whenever Make a Wish or Grand Prize Rescue triggers, a Candy Pumpkin Bomb slams the lowest-HP enemy for Magic Damage, stuns them for 1.5s, and instantly restores 3 Wish Tokens to Gigi.",
  apply(u, B, lvl) {
    u.flat.magP = (u.flat.magP || 0) + (0.12 + lvl * 0.06);
    u.flat.cdr = (u.flat.cdr || 0) + (0.10 + lvl * 0.05);
    u.dirty = true;

    // 1. Battle Start: Primed Jackpot & Sugar Rush opener
    B.after(0.1, () => {
      if (!u.alive) return;
      u.wishJackpot = true;
      u.wishTokens = Math.max(u.wishTokens || 0, 3);
      B.applyStatus(u, u, 'speedup', 6);
      B.applyStatus(u, u, 'lucky', 6);
      Sound.play('get_rare', { vol: 0.45 });
      B.fxFloatIcon(u.x, u.y - 100, '🎃', '#ff9d4d');
      B.fxRing(u.x, u.y - 35, 160, '#ff9d4d', 0.4);
    });

    // 2. Wish Wheel / Jackpot: Treat Candies for team + Pumpkin Trick on enemies
    B.on(u, 'cast', ev => {
      if (ev.key !== 'W') return;
      Sound.play('get_item', { vol: 0.5 });
      Sound.play('confetti', { vol: 0.4 });
      B.fxConfetti(u.x, u.y - 60, 24);

      // Flings treat candies to all allies
      const TREAT_BUFFS = ['atkup', 'speedup', 'fortify', 'lucky'];
      B.alliesOf(u).forEach(a => {
        const buff1 = (typeof pick === 'function') ? pick(TREAT_BUFFS) : TREAT_BUFFS[0];
        const remaining = TREAT_BUFFS.filter(b => b !== buff1);
        const buff2 = (typeof pick === 'function') ? pick(remaining) : remaining[0];
        B.applyStatus(u, a, buff1, 6);
        B.applyStatus(u, a, buff2, 6);
        B.fxFloatIcon(a.x, a.y - 95, '🍬', '#ffd166');
        B.fxSparkle(a.x, a.y - 45, 6, '#ff9d4d');
      });

      // Foes slip on pumpkin candy: Magic shred and slow
      const shredVal = 0.20 + lvl * 0.05;
      B.enemiesOf(u).forEach(e => {
        B.applyStatus(u, e, 'magdown', 5, { val: shredVal });
        B.applyStatus(u, e, 'slow', 3.5);
        B.fxFloatIcon(e.x, e.y - 90, '🎃', '#ff9d4d');
      });
    });

    // 3. Candy Pumpkin Bomb on Make a Wish (B) or Lethal Rescue (R)
    const throwPumpkinBomb = () => {
      const foes = B.enemiesOf(u);
      if (!foes.length) return;
      const target = B.lowestHp(foes) || foes[0];
      if (!target || !target.alive) return;

      Sound.play('throwsomething', { vol: 0.5 });
      B.fxArc(u, target, { kind: 'food', img: 'Pumpkin', size: 36 }, () => {
        if (!target.alive) return;
        Sound.play('hit_heavy', { vol: 0.5 });
        B.shake(8, 0.2);
        B.damage(u, target, u.st.mag * (1.10 + lvl * 0.25), { type: 'magic', area: true, tag: 'Wishing Pumpkin Bomb' });
        B.applyStatus(u, target, 'stun', 1.5, { unresistable: true });
        B.fxFloatIcon(target.x, target.y - 105, '💥', '#ff9d4d');
        B.fxRing(target.x, target.y - 35, 120, '#ff9d4d', 0.4);

        // Refund 3 Wish Tokens to Gigi!
        if (u.alive) {
          u.wishTokens = Math.min(8, (u.wishTokens || 0) + 3);
          B.fxFloatIcon(u.x, u.y - 105, '+3 TOKENS! ⭐', '#ffd166');
        }
      });
    };

    B.on(u, 'cast', ev => {
      if (ev.key === 'B') {
        B.after(0.2, throwPumpkinBomb);
      }
    });

    B.on(u, 'allyLethal', ev => {
      if (!ev.unit || ev.unit === u) return;
      B.after(0.1, throwPumpkinBomb);
    });
  }
});

