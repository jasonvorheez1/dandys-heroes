/* Two immediately owned friendship keepsakes for every playable Cookie; choose one to wear. */
'use strict';

defBadge({
  id: 'brave_bright_button', owner: 'GingerBrave', friend: 'GingerBright',
  name: "GingerBright's Candy Button", icon: '🍭', color: '#f799c9', cookieRun: true, skillKey: 'W',
  desc: "A bright pink candy button sewn onto GingerBrave's chest to remind him that true bravery shines brightest when protecting friends.",
  stat: lvl => `+${(12 + lvl * 6).toFixed(0)}% Attack & +${(10 + lvl * 5).toFixed(0)}% Attack Speed`,
  effect: 'Never Back Down! unleashes a Candy Pop Shockwave: knocks enemies back 140px, shatters 40%+ of enemy shields, and shreds Armor by 25% for 6s. Dashing or casting Brave Strike scatters 3 Bright Jellies: picking them up grants allies +20% Attack and restores 15+ Energy.',
  apply(u, B, lvl) {
    u.flat.atkP = (u.flat.atkP || 0) + (0.12 + lvl * 0.06);
    u.flat.aspdP = (u.flat.aspdP || 0) + (0.10 + lvl * 0.05);
    u.dirty = true;

    // Candy Pop Shockwave on Ultimate
    B.on(u, 'cast', ev => {
      if (ev.key !== 'W') return;
      Sound.play('glass_break', { vol: 0.45, throttle: 200 });
      B.after(0.4, () => {
        if (!u.alive) return;
        B.enemiesOf(u).forEach(foe => {
          if (!foe.alive) return;
          B.knockback(u, foe, 140);
          if (foe.shield && foe.shield > 0) {
            B.crackShield(foe, foe.shield * (0.40 + lvl * 0.10));
          }
          B.applyStatus(u, foe, 'defdown', 6, { val: 0.25 + lvl * 0.05 });
          B.fxSparkle(foe.x, foe.y - 45, 8, '#f799c9');
        });
        B.fxFloatIcon(u.x, u.y - 110, '🍭 CANDY POP!', '#f799c9');
      });
    });

    // Jelly Scatter on Dash / G
    B.on(u, 'cast', ev => {
      if (ev.key === 'G' || ev.key === 'B') {
        Sound.play('sparkle', { vol: 0.35, throttle: 180 });
        B.alliesOf(u).forEach(a => {
          B.applyStatus(u, a, 'atkup', 6, { val: 0.20 });
          B.energy(a, 15 + lvl * 5);
          B.fxSparkle(a.x, a.y - 40, 6, '#f799c9');
        });
        B.fxFloatIcon(u.x, u.y - 100, '🍬 CANDY JELLIES', '#f799c9');
      }
    });
  }
});

defBadge({
  id: 'bright_brave_ribbon', owner: 'GingerBright', friend: 'GingerBrave',
  name: "GingerBrave's Rally Ribbon", icon: '🎀', color: '#ffd384', cookieRun: true, skillKey: 'W',
  desc: "GingerBrave tied his rally ribbon to GingerBright's lollipop wand, infusing every swing with heroic cookie spirit.",
  stat: lvl => `+${(12 + lvl * 6).toFixed(0)}% Attack Speed & +${(10 + lvl * 5).toFixed(0)}% Movement Speed`,
  effect: 'Bright Attack or landing 6 combo hits triggers a Brave Rally Whirlwind: grants all allies +30% Attack Speed, +25% Move Speed, and 2 stacks of Fortify for 6s. While active, GingerBright deals 35%+ bonus Physical Damage and each hit siphons 8 Energy.',
  apply(u, B, lvl) {
    u.flat.aspdP = (u.flat.aspdP || 0) + (0.12 + lvl * 0.06);
    u.flat.msP = (u.flat.msP || 0) + (0.10 + lvl * 0.05);
    u.dirty = true;

    const triggerBraveRally = () => {
      if (!u.alive || B.t < (u._braveRallyAt || 0)) return;
      u._braveRallyAt = B.t + 6;
      Sound.play('drum', { vol: 0.5 });
      B.fxRing(u.x, u.y - 35, 180, '#ffd384', 0.45);
      B.alliesOf(u).forEach(a => {
        B.applyStatus(u, a, 'haste', 6);
        B.applyStatus(u, a, 'speedup', 6);
        B.applyStatus(u, a, 'fortify', 6, { stacks: 2 });
        B.fxSparkle(a.x, a.y - 45, 8, '#ffd384');
      });
      B.fxFloatIcon(u.x, u.y - 110, '🎀 BRAVE RALLY!', '#ffd384');
    };

    B.on(u, 'cast', ev => {
      if (ev.key === 'W') triggerBraveRally();
    });

    B.on(u, 'dealDamage', ev => {
      if (!ev.target || ev.target.team === u.team || ev.dot) return;
      if (B.t < (u._braveRallyAt || 0)) {
        ev.amount *= (1.35 + lvl * 0.08);
        B.energy(u, 8);
      }
    });
  }
});

defBadge({
  id: 'bright_vanilla_charm', owner: 'GingerBright', friend: 'PureVanillaCookie',
  name: "Pure Vanilla's Sugar Charm", icon: '✨', color: '#ffe6ad', cookieRun: true, skillKey: 'B',
  desc: "A golden sugar amulet blessed with pure vanilla light, guarding Cheese Drop and blessing candy jelly treats.",
  stat: lvl => `+${(12 + lvl * 6).toFixed(0)}% Critical Hit Chance & +${(10 + lvl * 5).toFixed(0)}% Shield Power`,
  effect: 'Cheese Drop deploys an enchanted Vanilla Sanctuary: shielded allies gain CC Immunity and +20% Evasion while active. Picking up any Candy Jelly cleanses 1 debuff, heals for 10%+ Max HP, and charges GingerBright by 12 Energy.',
  apply(u, B, lvl) {
    u.flat.crit = (u.flat.crit || 0) + (0.12 + lvl * 0.06);
    u.flat.shieldPowP = (u.flat.shieldPowP || 0) + (0.10 + lvl * 0.05);
    u.dirty = true;

    B.on(u, 'cast', ev => {
      if (ev.key !== 'B') return;
      Sound.play('cure_all', { vol: 0.44 });
      B.after(0.3, () => {
        B.alliesOf(u).forEach(a => {
          B.applyStatus(u, a, 'ccimmune', 4);
          B.applyStatus(u, a, 'evaP', 6, { val: 0.20 });
          B.cleanse(a, 1);
          B.fxSparkle(a.x, a.y - 45, 8, '#ffe6ad');
        });
        B.fxFloatIcon(u.x, u.y - 110, '✨ VANILLA SANCTUARY', '#ffe6ad');
      });
    });

    B.on(u, 'brightJellyCollected', ev => {
      if (ev && ev.ally) {
        B.cleanse(ev.ally, 1);
        B.heal(u, ev.ally, ev.ally.max.hp * (0.10 + lvl * 0.035), { tag: 'Sugar Charm' });
        B.energy(u, 12);
        B.fxSparkle(ev.ally.x, ev.ally.y - 40, 6, '#ffe6ad');
      }
    });
  }
});

defBadge({
  id: 'cream_vanilla_bookmark', owner: 'CreamPuffCookie', friend: 'PureVanillaCookie',
  name: "Pure Vanilla's Orchid Bookmark", icon: '🌸', color: '#ffe6a6', cookieRun: true, skillKey: 'W',
  desc: "A delicate dried orchid bookmark given to Cream Puff by Pure Vanilla Cookie during her academy studies.",
  stat: lvl => `+${(12 + lvl * 6).toFixed(0)}% Healing Power & +${(10 + lvl * 5).toFixed(0)}% Magic Damage`,
  effect: 'Jellius Extrēmus summons a Holy Vanilla Blossom: heals all allies for 20%+ of Magic, cleanses all debuffs, and grants a 16%+ Max HP Sacred Orchid Shield for 6s. On Great Success or Critical casts, all enemies are Silenced for 2.5s and take 30%+ bonus Magic Damage.',
  apply(u, B, lvl) {
    u.flat.healPowP = (u.flat.healPowP || 0) + (0.12 + lvl * 0.06);
    u.flat.magP = (u.flat.magP || 0) + (0.10 + lvl * 0.05);
    u.dirty = true;

    B.on(u, 'cast', ev => {
      if (ev.key !== 'W') return;
      Sound.play('cure_all', { vol: 0.5 });
      Sound.play('get_rare', { vol: 0.4 });
      B.fxRing(u.x, u.y - 35, 200, '#ffe6a6', 0.5);
      B.alliesOf(u).forEach(a => {
        B.heal(u, a, u.st.mag * (0.20 + lvl * 0.06), { tag: 'Vanilla Blossom' });
        B.cleanse(a, 99);
        B.shield(u, a, u.max.hp * (0.16 + lvl * 0.05), 6);
        B.fxSparkle(a.x, a.y - 45, 10, '#ffe6a6');
      });
      B.fxFloatIcon(u.x, u.y - 110, '🌸 SACRED ORCHID', '#ffe6a6');

      // Check Great Success / Crit
      if (u._creamPuffGreatSuccess || u.statuses.some(s => s.id === 'lucky')) {
        B.enemiesOf(u).forEach(foe => {
          B.applyStatus(u, foe, 'silence', 2.5);
          B.damage(u, foe, u.st.mag * (0.45 + lvl * 0.15), { type: 'magic', area: true, tag: 'Orchid Silence' });
          B.fxFloatIcon(foe.x, foe.y - 95, '🌸 SILENCE', '#ffe6a6');
        });
      }
    });
  }
});

defBadge({
  id: 'cream_milk_star', owner: 'CreamPuffCookie', friend: 'ShadowMilkCookie',
  name: "Shadow Milk's Paper Star", icon: '🌟', color: '#c1b3fa', cookieRun: true, skillKey: 'G',
  desc: "A deceptively folded paper star left inside an old magic tome, whispering dramatic theatrical secrets.",
  stat: lvl => `+${(12 + lvl * 6).toFixed(0)}% Critical Hit Chance & +${(10 + lvl * 5).toFixed(0)}% Skill Haste`,
  effect: 'Magic Trick Conjuration summons mischievous Shadow Star Confetti: Stuns all enemies for 1.5s and steals 20 Energy from each. When any ally scores a Critical Hit, a Phantom Paper Star bursts for True Damage (45%+ Magic) and Weakens the target for 4s (2.5s cooldown).',
  apply(u, B, lvl) {
    u.flat.crit = (u.flat.crit || 0) + (0.12 + lvl * 0.06);
    u.flat.cdr = (u.flat.cdr || 0) + (0.10 + lvl * 0.05);
    u.dirty = true;

    B.on(u, 'cast', ev => {
      if (ev.key !== 'G') return;
      Sound.play('confetti', { vol: 0.45 });
      B.fxConfetti(u.x, u.y - 50, 20);
      let totalStolen = 0;
      B.enemiesOf(u).forEach(foe => {
        if (!foe.alive) return;
        B.applyStatus(u, foe, 'stun', 1.5);
        B.energy(foe, -20);
        totalStolen += 20;
        B.fxSparkle(foe.x, foe.y - 45, 8, '#c1b3fa');
      });
      if (totalStolen > 0) B.energy(u, Math.min(50, totalStolen * 0.5));
      B.fxFloatIcon(u.x, u.y - 110, '🌟 SHADOW CONFETTI', '#c1b3fa');
    });

    B.on(u, 'allyDamageDealt', ev => {
      if (!ev || !ev.crit || !ev.target || ev.target.team === u.team || !ev.target.alive) return;
      if (B.t < (u._shadowPaperStarAt || 0)) return;
      u._shadowPaperStarAt = B.t + 2.5;
      Sound.play('hit_magic', { vol: 0.42 });
      B.damage(u, ev.target, u.st.mag * (0.45 + lvl * 0.15), { type: 'true', tag: 'Phantom Paper Star' });
      B.applyStatus(u, ev.target, 'weaken', 4, { val: 0.25 });
      B.fxSparkle(ev.target.x, ev.target.y - 45, 10, '#c1b3fa');
      B.fxFloatIcon(ev.target.x, ev.target.y - 100, '🌟 STAR BURST', '#c1b3fa');
    });
  }
});

defBadge({
  id: 'tiger_brave_bell', owner: 'TigerLilyCookie', friend: 'GingerBrave',
  name: "GingerBrave's Brave Bell", icon: '🔔', color: '#f7a264', cookieRun: true, skillKey: 'G',
  desc: "A brass bell GingerBrave gave Tiger Lily so Butter Tiger can hear the call of the pack from miles away.",
  stat: lvl => `+${(12 + lvl * 6).toFixed(0)}% Attack Speed & +${(12 + lvl * 6).toFixed(0)}% Attack`,
  effect: "Butter Tiger's Pounce becomes an Unstoppable Brave Charge: knocks back all enemies in path, Stuns the primary prey for 1.8s, and inflicts -30% Armor shred for 6s. At wave start or on defeating an enemy, Tiger Lily rings the Brave Bell: grants +35% Attack Speed, +25% Move Speed, and 25 Energy to Tiger Lily and nearest ally.",
  apply(u, B, lvl) {
    u.flat.aspdP = (u.flat.aspdP || 0) + (0.12 + lvl * 0.06);
    u.flat.atkP = (u.flat.atkP || 0) + (0.12 + lvl * 0.06);
    u.dirty = true;

    // Brave Bell Ring
    const ringBraveBell = () => {
      if (!u.alive) return;
      Sound.play('get_rare', { vol: 0.48 });
      B.applyStatus(u, u, 'haste', 6);
      B.applyStatus(u, u, 'speedup', 6);
      B.energy(u, 25);
      const nearest = B.nearest(u, B.alliesOf(u).filter(a => a !== u));
      if (nearest) {
        B.applyStatus(u, nearest, 'haste', 6);
        B.applyStatus(u, nearest, 'speedup', 6);
        B.energy(nearest, 25);
        B.fxSparkle(nearest.x, nearest.y - 45, 8, '#f7a264');
      }
      B.fxFloatIcon(u.x, u.y - 110, '🔔 BRAVE BELL', '#f7a264');
    };

    B.after(0.2, ringBraveBell);
    B.on(u, 'defeatedEnemy', ringBraveBell);

    // Butter Tiger Pounce Enhancement
    B.on(u, 'cast', ev => {
      if (ev.key !== 'G') return;
      Sound.play('cookie_tiger_pounce', { vol: 0.55 });
      B.applyStatus(u, u, 'cleanstep', 3);
      B.enemiesOf(u).forEach(foe => {
        if (Math.abs(foe.x - u.x) < 220) {
          B.knockback(u, foe, 130);
          B.applyStatus(u, foe, 'defdown', 6, { val: 0.30 });
          B.fxSparkle(foe.x, foe.y - 45, 8, '#f7a264');
        }
      });
      const prey = B.nearest(u, B.enemiesOf(u));
      if (prey) {
        B.applyStatus(u, prey, 'stun', 1.8);
        B.fxFloatIcon(prey.x, prey.y - 100, '🐯 POUNCED', '#f7a264');
      }
    });
  }
});

/* ============================================================
   OVERHAULED COOKIE FRIENDSHIP DISKS (DHBM Archetypes)
   ============================================================ */

defBadge({
  id: 'milk_cream_spark', owner: 'ShadowMilkCookie', friend: 'CreamPuffCookie',
  name: "Cream Puff's Stage Spark", icon: '⭐', color: '#9ad9fa', cookieRun: true, skillKey: 'W',
  desc: "Cream Puff's dazzling star-spark fireworks turned Shadow Milk's grand finale into a show-stopping theatrical spectacle.",
  stat: lvl => `+${(10 + lvl * 5).toFixed(0)}% Magic Damage & +${(12 + lvl * 6).toFixed(0)}% Critical Damage`,
  effect: 'Puppet Show & Grand Finale trigger a Confetti Starburst that deals Magic Damage, Stuns all enemies, applies Taint, and siphons 20 Energy from each enemy to Shadow Milk and his lowest-Energy ally. Attacks weaken tainted enemies.',
  apply(u, B, lvl) {
    u.flat.magP = (u.flat.magP || 0) + (0.10 + lvl * 0.05);
    u.flat.critDmg = (u.flat.critDmg || 0) + (0.12 + lvl * 0.06);
    u.dirty = true;

    // Confetti Starburst on Ultimate
    B.on(u, 'cast', ev => {
      if (ev.key !== 'W') return;
      Sound.play('get_rare', { vol: .48, throttle: 200 });
      B.fxConfetti();
      let totalStolen = 0;
      B.enemiesOf(u).forEach(foe => {
        if (!foe.alive) return;
        B.damage(u, foe, u.st.mag * (0.50 + lvl * 0.15), { type: 'magic', area: true, tag: 'Confetti Starburst' });
        B.applyStatus(u, foe, 'stun', 1.2 + lvl * 0.2);
        B.applyStatus(u, foe, 'cookie_taint', 6);
        B.applyStatus(u, foe, 'weaken', 5, { val: 0.15 + lvl * 0.04 });
        B.energy(foe, -(15 + lvl * 5));
        totalStolen += 15 + lvl * 5;
        B.fxSparkle(foe.x, foe.y - 45, 10, '#9ad9fa');
      });
      if (totalStolen > 0) {
        B.energy(u, Math.min(50, totalStolen * 0.5));
        const lowestEnergyAlly = B.alliesOf(u).filter(a => a.alive && a !== u).sort((a, b) => a.energy - b.energy)[0];
        if (lowestEnergyAlly) B.energy(lowestEnergyAlly, Math.min(40, totalStolen * 0.5));
        B.fxFloatIcon(u.x, u.y - 110, '⭐ STARBURST', '#9ad9fa');
      }
    });

    // Weaken on dealing damage to tainted enemies
    B.on(u, 'dealDamage', ev => {
      if (!ev.target || ev.target.team === u.team || ev.dot) return;
      if (ev.target.hasStatus('cookie_taint') && !ev.target.hasStatus('weaken')) {
        B.applyStatus(u, ev.target, 'weaken', 3.5, { val: 0.15 + lvl * 0.04 });
      }
    });
  }
});

defBadge({
  id: 'milk_tiger_thread', owner: 'ShadowMilkCookie', friend: 'TigerLilyCookie',
  name: "Tiger Lily's Snare Thread", icon: '🧵', color: '#b392ed', cookieRun: true, skillKey: 'B',
  desc: "Wild jungle vine fibers woven into puppet strings so strong even the largest beast cannot break free.",
  stat: lvl => `+${(10 + lvl * 5).toFixed(0)}% Skill Haste & +${(12 + lvl * 6).toFixed(0)}% Tenacity`,
  effect: 'Using Master of Puppets or every 8s, Tiger Lily\'s Bramble Threads snare the highest-damage enemy: Roots and Silences them for 3s+. When snared strings snap, they constrict for Max HP True Damage to adjacent foes, refunding 25 Energy.',
  apply(u, B, lvl) {
    u.flat.cdr = (u.flat.cdr || 0) + (0.10 + lvl * 0.05);
    u.flat.tenacity = (u.flat.tenacity || 0) + (0.12 + lvl * 0.06);
    u.dirty = true;

    const applyBrambleSnare = () => {
      if (!u.alive) return;
      const foes = B.enemiesOf(u).filter(e => e.alive);
      if (!foes.length) return;
      const target = foes.sort((a, b) => (b.st.atk + b.st.mag) - (a.st.atk + a.st.mag))[0];
      if (!target) return;

      Sound.play('whip', { vol: .42 });
      B.applyStatus(u, target, 'root', 2.5 + lvl * 0.4);
      B.applyStatus(u, target, 'silence', 2.0 + lvl * 0.3);
      B.applyStatus(u, target, 'cookie_stringbound', 4, { val: 0.35 + lvl * 0.05 });
      B.fxRing(target.x, target.y - 30, 85, '#b392ed', .45);
      B.fxFloatIcon(target.x, target.y - 105, '🧵 SNARED', '#b392ed');

      // Snapped constriction
      B.after(2.5, () => {
        if (!u.alive || !target.alive) return;
        B.damage(u, target, target.max.hp * (0.06 + lvl * 0.02), { type: 'true', tag: 'Bramble Snap' });
        B.enemiesOf(u).forEach(foe => {
          if (foe === target || !foe.alive || Math.abs(foe.x - target.x) > 130) return;
          B.damage(u, foe, target.max.hp * (0.04 + lvl * 0.015), { type: 'true', area: true, tag: 'Bramble Snap' });
        });
        B.energy(u, 25);
        Sound.play('hit_heavy', { vol: .38, throttle: 120 });
      });
    };

    B.on(u, 'cast', ev => {
      if (ev.key === 'B') applyBrambleSnare();
    });

    B.every(u, Math.max(6, 9 - lvl * 0.5), () => {
      applyBrambleSnare();
    });
  }
});

defBadge({
  id: 'vanilla_cream_ribbon', owner: 'PureVanillaCookie', friend: 'CreamPuffCookie',
  name: "Cream Puff's Spell Ribbon", icon: '🎗️', color: '#ffdf9e', cookieRun: true, skillKey: 'W',
  desc: "An enchanted spell ribbon woven with protective warding magic from the Parfaedia Magic Academy.",
  stat: lvl => `+${(12 + lvl * 6).toFixed(0)}% Shield Power & +${(10 + lvl * 5).toFixed(0)}% Max HP`,
  effect: 'Love & Peace grants all allies a Sanctuary Aegis that confers CC & Debuff immunity while active. Once per battle, when an ally takes lethal damage, the Spell Ribbon grants them Invulnerability, restores 25% HP, and refills PV\'s Energy.',
  apply(u, B, lvl) {
    u.flat.shieldPowP = (u.flat.shieldPowP || 0) + (0.12 + lvl * 0.06);
    u.flat.hpP = (u.flat.hpP || 0) + (0.10 + lvl * 0.05);
    u.dirty = true;

    // Sanctuary Aegis on Ultimate
    B.on(u, 'cast', ev => {
      if (ev.key !== 'W') return;
      Sound.play('cure_all', { vol: .48 });
      B.alliesOf(u).forEach(a => {
        B.shield(u, a, u.st.mag * (0.35 + lvl * 0.10), 6);
        B.cleanse(a, 3);
        B.applyStatus(u, a, 'vanilla_salvation', 6);
        B.applyStatus(u, a, 'cleanstep', 6);
        B.fxSparkle(a.x, a.y - 45, 10, '#ffdf9e');
      });
      B.fxFloatIcon(u.x, u.y - 110, '🎗️ SANCTUARY', '#ffdf9e');
    });

    // Miraculous Death Save
    u._creamDeathSaveUsed = false;
    B.on(u, 'allyLethal', ev => {
      if (u._creamDeathSaveUsed || !ev || !ev.unit || !ev.unit.alive) return;
      u._creamDeathSaveUsed = true;
      ev.prevented = true;
      const target = ev.unit;
      target.hp = Math.max(1, target.max.hp * (0.20 + lvl * 0.05));
      B.applyStatus(u, target, 'invuln', 2.5);
      B.cleanse(target, 5);
      B.energy(u, 40);
      Sound.play('revive', { vol: .52, priority: true });
      B.fxRing(target.x, target.y - 45, 140, '#ffdf9e', .6);
      B.fxFloatIcon(target.x, target.y - 115, '🎗️ DEATH DEFIED!', '#ffdf9e');
    });
  }
});

defBadge({
  id: 'vanilla_tiger_token', owner: 'PureVanillaCookie', friend: 'TigerLilyCookie',
  name: "Tiger Lily's Tiger Token", icon: '🐯', color: '#f6d783', cookieRun: true, skillKey: 'G',
  desc: "A hand-carved tiger fang charm imbued with primal protective instincts to guard healers from dangerous predators.",
  stat: lvl => `+${(12 + lvl * 6).toFixed(0)}% Healing Power & +${(10 + lvl * 5).toFixed(0)}% Defense`,
  effect: 'When Pure Vanilla or a nearby ally is attacked by an enemy diver or on casting Light of Truth, a Spirit Tiger counter-pounces the attacker: knocks back 160px, Stuns for 1.8s, and debuffs their damage. Heals grant allies +35% Defense.',
  apply(u, B, lvl) {
    u.flat.healPowP = (u.flat.healPowP || 0) + (0.12 + lvl * 0.06);
    u.flat.defP = (u.flat.defP || 0) + (0.10 + lvl * 0.05);
    u.dirty = true;

    // Spirit Tiger Counter-Pounce
    const triggerSpiritTiger = targetEnemy => {
      if (!u.alive || !targetEnemy || !targetEnemy.alive || B.t < (u._spiritTigerAt || 0)) return;
      u._spiritTigerAt = B.t + Math.max(3.5, 6 - lvl * 0.4);
      Sound.play('cookie_tiger_pounce', { vol: .55 });
      B.damage(u, targetEnemy, u.st.mag * (0.40 + lvl * 0.12), { type: 'physical', tag: 'Spirit Tiger' });
      B.knockback(u, targetEnemy, 160);
      B.applyStatus(u, targetEnemy, 'stun', 1.5 + lvl * 0.3);
      B.applyStatus(u, targetEnemy, 'vanilla_illuminated', 6);
      B.fxRing(targetEnemy.x, targetEnemy.y - 35, 110, '#f6d783', .4);
      B.fxFloatIcon(targetEnemy.x, targetEnemy.y - 105, '🐯 POUNCE!', '#f6d783');
    };

    B.on(u, 'damaged', ev => {
      if (ev.src && ev.src.team !== u.team && !ev.dot) {
        triggerSpiritTiger(ev.src);
      }
    });

    B.on(u, 'cast', ev => {
      if (ev.key === 'G') {
        const nearestFoe = B.nearest(u, B.enemiesOf(u));
        if (nearestFoe) triggerSpiritTiger(nearestFoe);
      }
    });

    // Feral Resilience on Heal
    B.on(u, 'healDone', ev => {
      if (ev && ev.target && ev.target.alive) {
        B.applyStatus(u, ev.target, 'fortify', 4 + lvl * 0.4, { stacks: 2 });
      }
    });
  }
});

defBadge({
  id: 'brave_tiger_paw', owner: 'GingerBrave', friend: 'TigerLilyCookie',
  name: "Tiger Lily's Pawprint", icon: '🐾', color: '#efad55', cookieRun: true, skillKey: 'B',
  desc: "A muddy pawprint pressed into a brave heart, inspiring an unstoppable charge through enemy lines.",
  stat: lvl => `+${(10 + lvl * 5).toFixed(0)}% Movement Speed & +${(12 + lvl * 6).toFixed(0)}% Attack`,
  effect: 'Brave Dash becomes Unstoppable (CC immune), shatter-breaking 40%+ of enemy shields and bowling enemies back 140px. Reaching the destination grants GingerBrave and frontline allies a Pack Rampart shield and +30% Attack Speed.',
  apply(u, B, lvl) {
    u.flat.msP = (u.flat.msP || 0) + (0.10 + lvl * 0.05);
    u.flat.atkP = (u.flat.atkP || 0) + (0.12 + lvl * 0.06);
    u.dirty = true;

    B.on(u, 'cast', ev => {
      if (ev.key !== 'B') return;
      Sound.play('cookie_tiger_pounce', { vol: .52 });
      B.applyStatus(u, u, 'cleanstep', 2.5);
      B.fxRing(u.x, u.y - 35, 120, '#efad55', .4);

      // Shield fracture on charging path
      B.enemiesOf(u).forEach(foe => {
        if (!foe.alive || Math.abs(foe.x - u.x) > 220) return;
        const breakRatio = 0.30 + lvl * 0.10;
        if (foe.shield && foe.shield > 0) {
          B.crackShield(foe, foe.shield * breakRatio);
          Sound.play('glass_break', { vol: .34, throttle: 160 });
        }
        B.knockback(u, foe, 140);
        B.applyStatus(u, foe, 'slow', 3.5);
      });

      // Pack Rampart Barrier for frontline
      B.after(0.4, () => {
        if (!u.alive) return;
        Sound.play('drum', { vol: .44 });
        B.alliesOf(u).forEach(a => {
          if (!a.alive || Math.abs(a.x - u.x) > 240) return;
          B.shield(u, a, u.max.hp * (0.12 + lvl * 0.04), 5);
          B.applyStatus(u, a, 'haste', 5);
          B.fxSparkle(a.x, a.y - 35, 8, '#efad55');
        });
        B.fxFloatIcon(u.x, u.y - 110, '🐾 PACK RAMPART', '#efad55');
      });
    });
  }
});

defBadge({
  id: 'tiger_bright_compass', owner: 'TigerLilyCookie', friend: 'GingerBright',
  name: "GingerBright's Candy Compass", icon: '🧭', color: '#ffcf78', cookieRun: true, skillKey: 'W',
  desc: "A glowing candy compass that points straight to enemy weak points, leaving a sweet rejuvenating trail behind.",
  stat: lvl => `+${(12 + lvl * 6).toFixed(0)}% Critical Hit Chance & +${(10 + lvl * 5).toFixed(0)}% Attack Speed`,
  effect: 'Thrown spears pierce through enemies in a line with 100% Critical Chance against Prey or foes below 50% HP. Mounting Butter Tiger scatters a Candy Trail: crossing allies gain +35% Move Speed and regenerate HP over 4s.',
  apply(u, B, lvl) {
    u.flat.crit = (u.flat.crit || 0) + (0.12 + lvl * 0.06);
    u.flat.aspdP = (u.flat.aspdP || 0) + (0.10 + lvl * 0.05);
    u.dirty = true;

    // Guaranteed Crit on Prey / Low HP
    B.on(u, 'dealDamage', ev => {
      if (!ev.target || ev.target.team === u.team || ev.dot) return;
      const t = ev.target;
      if (t.hasStatus('cookie_tiger_prey') || t.hpPct < 0.50) {
        if (!ev.crit) {
          ev.amount *= (u.st.critDmg || 1.8);
          ev.crit = true;
          B.fxSparkle(t.x, t.y - 45, 8, '#ffcf78');
        }
      }
    });

    // Candy Trail when mounting Butter Tiger
    B.on(u, 'cast', ev => {
      if (ev.key !== 'W') return;
      Sound.play('get_rare', { vol: .42 });
      B.fxRing(u.x, u.y - 35, 150, '#ffcf78', .5);
      B.alliesOf(u).forEach(a => {
        B.applyStatus(u, a, 'speedup', 4.5);
        B.applyStatus(u, a, 'cleanstep', 4.5);
        B.heal(u, a, a.max.hp * (0.10 + lvl * 0.035));
        B.fxSparkle(a.x, a.y - 35, 8, '#ffcf78');
      });
      B.fxFloatIcon(u.x, u.y - 110, '🧭 CANDY TRAIL', '#ffcf78');
    });
  }
});
