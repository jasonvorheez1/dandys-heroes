/* badges_extra.js - badges for the additional Friendship Campaigns. */
'use strict';

defBadge({
  id: 'toodles_shelly', owner: 'Toodles', friend: 'Shelly',
  name: "Shelly's Fossil Token", icon: '🦴', image: 'assets/toodles-shelly-badge.svg', color: '#ffd28b',
  desc: 'A fossil Shelly labeled for Toodles after Toodles finally learned to listen.',
  stat: lvl => `+${(12 + lvl * 6).toFixed(0)}% Attack · +${(10 + lvl * 5).toFixed(0)}% Shield Power`,
  effect: "Shelly's field notes turn Toodles' guesses into a battle plan! At battle start, Toodles exposes the highest-Attack enemy and shreds 40% of their Defense and Magic Defense for 6s. Every Lucky Boost gives the lowest-HP ally a Fossil Shell (18%+ Max HP shield), cleanses 2 debuffs, grants Ward and 20+ Energy (6s cooldown). Lucky Strike dispels 2 enemy buffs, deals bonus Magic Damage, and stuns for 1.2s.",
  apply(u, B, lvl) {
    u.flat.atkP = (u.flat.atkP || 0) + .12 + lvl * .06;
    u.flat.shieldPowP = (u.flat.shieldPowP || 0) + .10 + lvl * .05;
    u.dirty = true;
    u._shellyFossilAt = -Infinity;

    const survey = () => {
      if (!u.alive) return;
      const target = B.highestStat(B.enemiesOf(u), 'atk');
      if (!target || !target.alive) return;
      B.applyStatus(u, target, 'exposed', 6);
      B.applyStatus(u, target, 'defdown', 6, { stacks: 2 });
      B.applyStatus(u, target, 'magdown', 6, { stacks: 2 });
      B.fxRing(target.x, target.y - 40, 90, '#ffd28b', .35);
      B.fxFloatIcon(target.x, target.y - 100, '🦴 SURVEYED', '#ffd28b');
    };
    B.after(.15, survey);

    B.on(u, 'luckyBoost', () => {
      if (!u.alive || B.t < u._shellyFossilAt) return;
      const ally = B.lowestHp(B.alliesOf(u));
      if (!ally) return;
      u._shellyFossilAt = B.t + 6;
      B.shield(u, ally, u.max.hp * (.18 + lvl * .04), 7);
      B.cleanse(ally, 2);
      B.applyStatus(u, ally, 'ward', 6);
      B.energy(ally, 20 + lvl * 5);
      B.fxSparkle(ally.x, ally.y - 45, 8, '#ffd28b');
      B.fxFloatIcon(ally.x, ally.y - 100, '🦴 FOSSIL SHELL', '#ffd28b');
    });

    B.on(u, 'dealDamage', ev => {
      if (!ev || ev.tag !== 'Lucky Strike' || !ev.target || !ev.target.alive) return;
      B.dispel(ev.target, 2);
      B.damage(u, ev.target, u.st.mag * (.6 + lvl * .2), { type: 'magic', tag: 'Fossil Break' });
      B.applyStatus(u, ev.target, 'stun', 1.2);
      B.fxSparkle(ev.target.x, ev.target.y - 45, 9, '#ffd28b');
      B.fxFloatIcon(ev.target.x, ev.target.y - 100, '🦴 FOSSIL BREAK', '#ffd28b');
    });
  }
});

defBadge({
  id: 'cocoa_rudie', owner: 'Cocoa', friend: 'Rudie',
  name: "Rudie's Saved Bonbon Bag", icon: '👜', color: '#f0ae78',
  desc: 'A little supply bag Cocoa kept because Rudie finally admitted that saving things can help.',
  stat: lvl => `+${(12 + lvl * 6).toFixed(0)}% Healing Power · +${(10 + lvl * 5).toFixed(0)}% Move Speed`,
  effect: "Rudie's emergency bag ensures no treat goes to waste! When Cocoa prepares or delivers BonBons, the two lowest-HP allies are cleansed of all debuffs, healed for 16%+ of Cocoa's Max HP, and given a Holiday Care Shield for 6s. In addition, when an ally consumes a BonBon, they gain Rudie's Sleigh Rush (+40% Move Speed and immunity to Slow/Root) for 5s.",
  apply(u, B, lvl) {
    u.flat.healPowP = (u.flat.healPowP || 0) + (0.12 + lvl * 0.06);
    u.flat.msP = (u.flat.msP || 0) + (0.10 + lvl * 0.05);
    u.dirty = true;
    u._bonbonBagAt = 0;

    B.on(u, 'cast', ev => {
      if (ev.key !== 'G' && ev.key !== 'W') return;
      if (B.t < u._bonbonBagAt) return;
      u._bonbonBagAt = B.t + Math.max(4.0, 7.5 - lvl * .4);
      Sound.play('item_pop', { vol: .45, throttle: 100 });
      const targets = B.alliesOf(u).sort((a, b) => a.hpPct - b.hpPct).slice(0, 2);
      targets.forEach(a => {
        B.cleanse(a, 2);
        B.heal(u, a, u.max.hp * (.16 + lvl * .035), { tag: 'Saved Bonbon Bag' });
        B.shield(u, a, u.max.hp * (.15 + lvl * .03), 6);
        B.applyStatus(u, a, 'speedup', 5);
        B.fxSparkle(a.x, a.y - 40, 10, '#f0ae78');
      });
      B.fxFloatIcon(u.x, u.y - 105, '👜 EMERGENCY CARE', '#f0ae78');
    });

    B.on(u, 'bonbonDelivered', ev => {
      const a = ev && ev.target;
      if (!a || a.team !== u.team || !a.alive) return;
      B.applyStatus(u, a, 'speedup', 5, { stacks: 2 });
      B.applyStatus(u, a, 'ccimmune', 2.5);
      B.fxFloatIcon(a.x, a.y - 95, '🛷 SLEIGH RUSH', '#f0ae78');
    });
  }
});

defBadge({
  id: 'cocoa_soulvester', owner: 'Cocoa', friend: 'Soulvester',
  name: "Soulvester's Knightly Bonbon", icon: '⚔️', color: '#d9b58d',
  desc: 'A BonBon stamped with a tiny knightly crest, meant to be shared before the next quest begins.',
  stat: lvl => `+${(12 + lvl * 6).toFixed(0)}% Healing Power · +${(10 + lvl * 5).toFixed(0)}% Defense`,
  effect: "Soulvester's chivalrous knightly training imbues Cocoa's confectionery with resolute martial fortitude! Whenever an ally consumes a Bonbon or when Cocoa casts an active skill, the ally gains 2 stacks of Fortify, Ward for 5s, and a Knightly Crest Shield (16%+ Max HP for 6s). When an ally with this Shield takes damage, Soulvester's spectral blade parries the attacker: deals Magic Damage, shreds 30% Armor for 5s, and restores 15 Energy to Cocoa. Cocoa gains +25% Attack Speed whenever she delivers a treat.",
  apply(u, B, lvl) {
    u.flat.healPowP = (u.flat.healPowP || 0) + (0.12 + lvl * 0.06);
    u.flat.defP = (u.flat.defP || 0) + (0.10 + lvl * 0.05);
    u.dirty = true;
    u._knightlyParryAt = 0;

    const grantKnightlyBuffs = target => {
      if (!target || target.team !== u.team || !target.alive) return;
      B.applyStatus(u, target, 'fortify', 6, { stacks: 2 });
      B.applyStatus(u, target, 'ward', 5);
      B.shield(u, target, u.max.hp * (.16 + lvl * .04), 6);
      target._hasKnightlyShield = true;
      B.fxFloatIcon(target.x, target.y - 105, '⚔️ KNIGHTLY CREST', '#d9b58d');
    };

    B.on(u, 'bonbonDelivered', ev => {
      const a = ev && ev.target;
      grantKnightlyBuffs(a);
      B.applyStatus(u, u, 'speedup', 5);
    });

    B.on(u, 'cast', ev => {
      if (!['W', 'G'].includes(ev.key)) return;
      const low = B.lowestHp(B.alliesOf(u));
      grantKnightlyBuffs(low);
    });

    B.on(u, 'allyDamaged', ev => {
      if (!ev || !ev.unit || !ev.unit._hasKnightlyShield || !ev.src || ev.src.team === u.team || !ev.src.alive) return;
      if (B.t < u._knightlyParryAt) return;
      u._knightlyParryAt = B.t + Math.max(2.5, 4.5 - lvl * .35);
      Sound.play('sword_clash', { vol: .48, throttle: 150 });
      B.damage(u, ev.src, u.st.def * (1.2 + lvl * 0.25), { type: 'magic', tag: 'Knightly Parry' });
      B.applyStatus(u, ev.src, 'defdown', 5, { val: 0.30 });
      B.energy(u, 15);
      B.fxSparkle(ev.src.x, ev.src.y - 45, 8, '#d9b58d');
      B.fxFloatIcon(ev.src.x, ev.src.y - 100, '⚔️ PARRY', '#d9b58d');
    });
  }
});

defBadge({
  id: 'qom_soulvester_gourdy', owner: 'QOMSoulvester', friend: 'QOMGourdy',
  name: "Gourdy's Encore Crest", icon: '🎼', color: '#bd82e8',
  desc: 'A crest Gourdy added to Soulvester’s armor, timed to the final beat of their new song.',
  stat: lvl => `+${(12 + lvl * 6).toFixed(0)}% Defense · +${(10 + lvl * 5).toFixed(0)}% Shield Power`,
  effect: "Gourdy's resonant pumpkin bass drum rhythms reinforce Soulvester's guitar shield with thunderous acoustic vibrations! Whenever Soulvester dodges, parries, or drops below 50% HP, Gourdy's crest detonates in an Encore Shockwave: knocks back all nearby enemies, interrupts them, shreds Magic Defense by 25% for 6s, and deals Magic Damage. In addition, the lowest-HP ally gains an Encore Barrier (18%+ Max HP), cleanses 2 debuffs, and gains 3s CC Immunity.",
  apply(u, B, lvl) {
    u.flat.defP = (u.flat.defP || 0) + (0.12 + lvl * 0.06);
    u.flat.shieldPowP = (u.flat.shieldPowP || 0) + (0.10 + lvl * 0.05);
    u.dirty = true;
    u._qomEncoreCrestAt = -Infinity;

    const triggerEncoreShockwave = () => {
      if (B.t < u._qomEncoreCrestAt) return;
      u._qomEncoreCrestAt = B.t + Math.max(3.2, 5.5 - lvl * .35);
      Sound.play('bass_drop', { vol: .52, throttle: 180 });
      B.enemiesOf(u).forEach(foe => {
        if (!foe.alive || Math.abs(foe.x - u.x) > 220) return;
        B.interrupt(foe);
        B.knockback(u, foe, 90);
        B.damage(u, foe, u.st.def * (1.1 + lvl * 0.22), { type: 'magic', area: true, tag: 'Encore Shockwave' });
        B.applyStatus(u, foe, 'magdown', 6, { val: 0.25 });
        B.fxSparkle(foe.x, foe.y - 45, 6, '#bd82e8');
      });
      const ally = B.lowestHp(B.alliesOf(u)) || u;
      B.cleanse(ally, 2);
      B.applyStatus(u, ally, 'ccimmune', 3.0);
      B.shield(u, ally, u.max.hp * (.18 + lvl * .04), 6);
      B.fxFloatIcon(u.x, u.y - 110, '🎼 ENCORE BLAST', '#bd82e8');
      B.fxRing(u.x, u.y - 40, 220, '#bd82e8', .5);
    };

    B.on(u, 'dodged', ev => {
      if (!ev || !ev.src || ev.src.team === u.team) return;
      triggerEncoreShockwave();
    });

    B.on(u, 'damaged', () => {
      if (u.hpPct <= 0.50) triggerEncoreShockwave();
    });
  }
});

defBadge({
  id: 'qom_ribecca_gourdy', owner: 'QOMRibecca', friend: 'QOMGourdy',
  name: "Gourdy's Bass Drum Key", icon: '🎹', color: '#a9f482',
  desc: "A bone-carved tuning key Ribecca fastened to Gourdy's bass drum pedal, locking their tempos together.",
  stat: lvl => `+${(12 + lvl * 6).toFixed(0)}% Defense · +${(10 + lvl * 5).toFixed(0)}% Shield Power`,
  effect: "Ribecca's keytar chords synchronize with Gourdy's drum kit into an unbreakable rhythm section! Whenever Ribecca triggers a Sound Barrier redirect or Gourdy strikes Beat 4, a concussive Keytar Bass Drop ripples across the stage: knocks back all nearby enemies, interrupts them, shreds Magic Defense by 25% for 6s, and deals Magic Damage scaling with Ribecca's Defense. In addition, Gourdy instantly gains 1 Encore stack, and all allies receive a Harmonic Shield (18%+ Max HP) and cleanse 2 debuffs.",
  apply(u, B, lvl) {
    u.flat.defP = (u.flat.defP || 0) + (0.12 + lvl * 0.06);
    u.flat.shieldPowP = (u.flat.shieldPowP || 0) + (0.10 + lvl * 0.05);
    u.dirty = true;
    u._qomRhythmDropAt = -Infinity;

    const triggerBassDrop = () => {
      if (B.t < u._qomRhythmDropAt) return;
      u._qomRhythmDropAt = B.t + Math.max(3.2, 5.5 - lvl * .35);
      Sound.play('bass_drop', { vol: .55, throttle: 180 });
      B.enemiesOf(u).forEach(foe => {
        if (!foe.alive || Math.abs(foe.x - u.x) > 230) return;
        B.interrupt(foe);
        B.knockback(u, foe, 80);
        B.damage(u, foe, u.st.def * (1.15 + lvl * 0.22), { type: 'magic', area: true, tag: 'Keytar Bass Drop' });
        B.applyStatus(u, foe, 'magdown', 6, { val: 0.25 });
        B.fxSparkle(foe.x, foe.y - 45, 6, '#a9f482');
      });
      const allies = B.alliesOf(u);
      allies.forEach(a => {
        if (!a.alive) return;
        B.cleanse(a, 2);
        B.shield(u, a, u.max.hp * (.18 + lvl * .04), 6);
      });
      const gourdy = allies.find(a => a.alive && a.id === 'QOMGourdy');
      if (gourdy) B.applyStatus(u, gourdy, 'qom_encore', 999);
      B.fxFloatIcon(u.x, u.y - 110, '🎹 BASS DROP', '#a9f482');
      B.fxRing(u.x, u.y - 40, 230, '#a9f482', .5);
    };

    B.on(u, 'damaged', ev => {
      if (ev.redirected || u.hpPct <= 0.50) triggerBassDrop();
    });

    B.on(u, 'allyCast', a => {
      if (a && a.id === 'QOMGourdy' && a._qomBeat === 4) triggerBassDrop();
    });
  }
});

defBadge({
  id: 'kairi_cocoa', owner: 'Kairi', friend: 'Cocoa',
  name: "Cocoa's Heartful Wayfinder", icon: '🌸', color: '#ffd0ed',
  desc: 'A small wayfinder Cocoa gave Kairi so she would remember that a heart can find its way back to the people it loves.',
  stat: lvl => `+${(12 + lvl * 6).toFixed(0)}% Energy Generation · +${(10 + lvl * 5).toFixed(0)}% Healing Received`,
  effect: "Cocoa's sweet confections anchor Kairi's light, connecting hearts across distant worlds! Kairi's shields and Gleam marks forge a Heart Connection between all active allies. Connected allies gain Inspire (+15% damage, +30% Energy Gen) and Lucky (+25% Crit, +12% Evasion) for 6s. If a connected ally drops below 40% HP, Kairi cleanses all debuffs, wraps them in a Heart Light Shield (20%+ Max HP), heals for 18% Max HP, and feeds them a Sugar Rush (+35% Attack Speed, 25 Energy).",
  apply(u, B, lvl) {
    u.flat.energyGen = (u.flat.energyGen || 0) + (0.12 + lvl * 0.06);
    u.flat.healRecv = (u.flat.healRecv || 0) + (0.10 + lvl * 0.05);
    u.dirty = true;
    u._kairiCocoaLinkAt = {};
    u._kairiCocoaRescueAt = {};

    const connect = a => {
      if (!a || a.team !== u.team || !a.alive) return;
      const uid = a.uid || a.id;
      a.kairiCocoaLinkUntil = B.t + 6.0;
      if (B.t < (u._kairiCocoaLinkAt[uid] || 0)) return;
      u._kairiCocoaLinkAt[uid] = B.t + Math.max(2.5, 4.0 - lvl * .2);
      B.applyStatus(u, a, 'inspired', 6.0);
      B.applyStatus(u, a, 'lucky', 6.0);
      B.energy(a, 6 + lvl * 2);
      B.fxFloatIcon(a.x, a.y - 105, '🌸 HEART LINK', '#ffd0ed');
    };

    B.on(u, 'shieldDone', ev => connect(ev && ev.target));
    B.on(u, 'statusApplied', ev => {
      if (!ev || ev.src !== u || ev.id !== 'gleam' || !ev.unit || ev.unit.team === u.team) return;
      B.alliesOf(u).forEach(connect);
    });

    B.on(u, 'allyDamaged', ev => {
      const a = ev && ev.unit;
      if (!a || !a.alive || a.team !== u.team || a.hpPct >= 0.40) return;
      const uid = a.uid || a.id;
      if (B.t < (u._kairiCocoaRescueAt[uid] || 0)) return;
      u._kairiCocoaRescueAt[uid] = B.t + Math.max(5.0, 8.0 - lvl * .4);
      Sound.play('cure_all', { vol: .48 });
      B.cleanse(a, 4);
      B.shield(u, a, u.max.hp * (.20 + lvl * .05), 6);
      B.heal(u, a, a.max.hp * (.18 + lvl * .04), { tag: 'Heartful Wayfinder Rescue' });
      B.applyStatus(u, a, 'sugarrush', 6);
      B.energy(a, 25);
      B.fxRing(a.x, a.y - 40, 140, '#ffd0ed', .55);
      B.fxFloatIcon(a.x, a.y - 110, '🌸 HEART RESCUE', '#ffd0ed');
    });
  }
});

defBadge({
  id: 'astro_pebble', owner: 'Astro', friend: 'Pebble',
  name: "Pebble's Starlit Tag", icon: '🐾', color: '#ffd166',
  desc: 'A little tag Pebble wears proudly, kept close enough to help Astro find the way back through the dark.',
  stat: lvl => `+${(12 + lvl * 6).toFixed(0)}% Healing Power · +${(10 + lvl * 5).toFixed(0)}% Evasion`,
  effect: "Pebble's loyal puppy instincts guide Astro's cosmic telescope through dark blackouts! Astro's heals and shields mark allies with Starlit Pack Tag: grants Ward (-30% damage taken), +20% Evasion, and regenerates 3% Max HP per second for 6s. Whenever an enemy casts an ultimate or an ally drops below 45% HP, Pebble's astral bark echoes: Blinds and Slows all enemies for 4s, interrupts the highest-Attack target, and grants Astro and the lowest-HP ally 30 Energy and an 18%+ Starlit Shield.",
  apply(u, B, lvl) {
    u.flat.healPowP = (u.flat.healPowP || 0) + (0.12 + lvl * 0.06);
    u.flat.evaP = (u.flat.evaP || 0) + (0.10 + lvl * 0.05);
    u.dirty = true;
    u._astroPackTagAt = {};
    u._astroPackBarkAt = 0;

    const tagAlly = a => {
      if (!a || a.team !== u.team || !a.alive) return;
      const uid = a.uid || a.id;
      if (B.t < (u._astroPackTagAt[uid] || 0)) return;
      u._astroPackTagAt[uid] = B.t + Math.max(2.2, 3.8 - lvl * .2);
      B.applyStatus(u, a, 'ward', 5.0);
      B.applyStatus(u, a, 'lucky', 5.0);
      B.applyStatus(u, a, 'regen', 5.0, { val: a.max.hp * 0.03 });
      B.energy(a, 5 + lvl);
      B.fxFloatIcon(a.x, a.y - 105, '🐾 STARLIT PACK', '#ffd166');
    };

    B.on(u, 'healDone', ev => tagAlly(ev && ev.target));
    B.on(u, 'shieldDone', ev => tagAlly(ev && ev.target));

    const triggerPackBark = () => {
      if (B.t < u._astroPackBarkAt) return;
      u._astroPackBarkAt = B.t + Math.max(4.5, 7.5 - lvl * .4);
      Sound.play('dog_bark', { vol: .52, throttle: 200 });
      B.enemiesOf(u).forEach(e => {
        B.applyStatus(u, e, 'blind', 4.0);
        B.applyStatus(u, e, 'slow', 4.0);
        B.fxFloatIcon(e.x, e.y - 95, '🐾 BARK', '#ffd166');
      });
      const topAtk = B.highestStat(B.enemiesOf(u), 'atk');
      if (topAtk) B.interrupt(topAtk);
      const low = B.lowestHp(B.alliesOf(u)) || u;
      [u, low].forEach(target => {
        B.shield(u, target, u.max.hp * (.18 + lvl * .04), 6);
        B.energy(target, 30);
      });
      B.fxRing(u.x, u.y - 40, 240, '#ffd166', .5);
      B.fxFloatIcon(u.x, u.y - 110, '🐾 ASTRAL BARK', '#ffd166');
    };

    B.on(u, 'enemyCast', ev => {
      if (ev && ev.energyCost >= 90) triggerPackBark();
    });

    B.on(u, 'allyDamaged', ev => {
      if (ev && ev.unit && ev.unit.team === u.team && ev.unit.hpPct < 0.45) triggerPackBark();
    });
  }
});

defBadge({
  id: 'brusha_tisha', owner: 'Brusha', friend: 'Tisha',
  name: "Tisha's Color Coded Ruler", icon: '📏', color: '#9fe8e3',
  desc: 'A ruler Tisha marked with Brusha\'s colors: useful, readable, and only slightly crooked.',
  stat: lvl => `+${(10 + lvl * 5).toFixed(0)}% Accuracy & +${(12 + lvl * 6).toFixed(0)}% Magic Damage`,
  effect: 'Magic damage strikes cleave in a straight geometric line, fracturing shields and permanently shredding enemy defenses. When casting Masterpiece Sweep or Palette Flurry, allies gain Cleanstep, Accuracy Up, and a barrier while enemies on the canvas suffer true damage.',
  apply(u, B, lvl) {
    u.flat.accP = (u.flat.accP || 0) + (0.10 + lvl * 0.05);
    u.flat.magP = (u.flat.magP || 0) + (0.12 + lvl * 0.06);
    u.dirty = true;

    // Geometric Cleave & Shield Fracture
    B.on(u, 'dealDamage', ev => {
      if (!ev.target || ev.target.team === u.team || ev.dot || ev.tag === 'Ruler Cleave') return;
      const t = ev.target;
      const cleaveRatio = 0.25 + lvl * 0.08;
      if (t.shield && t.shield > 0) {
        B.crackShield(t, t.shield * cleaveRatio);
        Sound.play('glass_break', { vol: .32, throttle: 180 });
      }

      // Cleave adjacent enemies in a geometric line
      B.enemiesOf(u).forEach(foe => {
        if (!foe.alive || foe === t || Math.abs(foe.x - t.x) > 160 || Math.abs(foe.depth - t.depth) * B.depthSpan > 60) return;
        B.damage(u, foe, ev.amount * cleaveRatio, { type: 'magic', area: true, tag: 'Ruler Cleave' });
        B.applyStatus(u, foe, 'magdown', 5, { val: 0.03 + lvl * 0.015 });
        B.applyStatus(u, foe, 'defdown', 5, { val: 0.03 + lvl * 0.015 });
      });
      B.fxFloatIcon(t.x, t.y - 100, '📏', '#9fe8e3');
    });

    // Team Canvas Buffer
    B.on(u, 'cast', ev => {
      if (!['W', 'G'].includes(ev.key)) return;
      Sound.play('sweep', { vol: .38 });
      B.alliesOf(u).forEach(a => {
        B.applyStatus(u, a, 'cleanstep', 3.5 + lvl * 0.4);
        B.applyStatus(u, a, 'accup', 3.5 + lvl * 0.4);
        B.shield(u, a, u.st.mag * (0.22 + lvl * 0.06), 6);
        B.fxSparkle(a.x, a.y - 35, 8, '#9fe8e3');
      });
      B.enemiesOf(u).forEach(foe => {
        B.damage(u, foe, u.st.mag * (0.16 + lvl * 0.04), { type: 'true', area: true, tag: 'Canvas Friction' });
        B.fxFloatIcon(foe.x, foe.y - 95, '🎨', '#ff5fa8');
      });
    });
  }
});

defBadge({
  id: 'tisha_blot', owner: 'Tisha', friend: 'Blot',
  name: "Blot's Squeaky Wheel", icon: '🛞', color: '#9f8bff',
  desc: 'A repaired cart wheel that still squeaks, because working is more important than being quiet.',
  stat: lvl => `+${(12 + lvl * 6).toFixed(0)}% Control Duration & +${(10 + lvl * 5).toFixed(0)}% Skill Haste`,
  effect: 'Enemies crossing lines or made Misplaced slip on Blot\'s hazardous Ink Slick, suffering heavy Slow and Attack Speed loss. Trying to move causes them to slip, getting Stunned and siphoning Energy to Tisha. Ultimate cleanses allies, boosts speed, and heals.',
  apply(u, B, lvl) {
    u.ccDurBonus = (u.ccDurBonus || 0) + (0.12 + lvl * 0.06);
    u.flat.cdr = (u.flat.cdr || 0) + (0.10 + lvl * 0.05);
    u.dirty = true;

    // Ink Slick & Slip Stun
    B.on(u, 'statusApplied', ev => {
      if (ev.src !== u || ev.id !== 'misplaced' || !ev.unit || ev.unit.team === u.team) return;
      const t = ev.unit;
      B.applyStatus(u, t, 'slow', 4.5 + lvl * 0.4);
      B.applyStatus(u, t, 'armslow', 4.0 + lvl * 0.4);
      B.fxRing(t.x, t.y - 25, 90, '#9f8bff', .45);

      const now = B.t;
      if (now < (u._squeakyWheelAt || 0)) return;
      u._squeakyWheelAt = now + Math.max(2.5, 4.5 - lvl * 0.35);

      // Slip Stun & Energy Siphon
      B.applyStatus(u, t, 'stun', 1.2 + lvl * 0.2);
      B.energy(t, -(10 + lvl * 3));
      B.energy(u, 12 + lvl * 4);
      Sound.play('slip', { vol: .42, throttle: 180 });
      B.fxFloatIcon(t.x, t.y - 105, '🛞 SLIP!', '#9f8bff');
    });

    // Overdrive on Ultimate
    B.on(u, 'cast', ev => {
      if (ev.key !== 'W') return;
      Sound.play('dash', { vol: .45 });
      B.alliesOf(u).forEach(a => {
        B.cleanse(a, 2);
        B.applyStatus(u, a, 'cleanstep', 5);
        B.applyStatus(u, a, 'speedup', 5);
        B.heal(u, a, a.max.hp * (0.10 + lvl * 0.04));
        B.fxSparkle(a.x, a.y - 35, 10, '#85e8ed');
      });
      B.fxFloatIcon(u.x, u.y - 110, '🛞 OVERDRIVE', '#9f8bff');
    });
  }
});

defBadge({
  id: 'bobette_cocoa', owner: 'Bobette', friend: 'Cocoa',
  name: "Cocoa's Shared Bonbon", icon: '🍬', color: '#f0ae78',
  desc: 'A Bonbon Cocoa pressed into Bobette’s wrapping paper, with a note to share it before she starts worrying.',
  stat: lvl => `+${(12 + lvl * 6).toFixed(0)}% Healing Received · +${(10 + lvl * 5).toFixed(0)}% Shield Power`,
  effect: "Cocoa's warm bonbons melt Bobette's frozen worries! Whenever Bobette shields or protects an ally, they gain Sugar Rush (+35% Attack Speed, +25% Move Speed), 2 stacks of Fortify, and a warm Bonbon that heals for 12%+ Max HP over 5s. When a shielded ally takes heavy damage (>15% Max HP in one blow), Bobette's gift box bursts: shatters 40% of the attacker's shields, roots them for 2.5s, dispels 2 buffs, and grants Bobette 25 Energy.",
  apply(u, B, lvl) {
    u.flat.healRecv = (u.flat.healRecv || 0) + (0.12 + lvl * 0.06);
    u.flat.shieldPowP = (u.flat.shieldPowP || 0) + (0.10 + lvl * 0.05);
    u.dirty = true;
    u._boxBurstAt = 0;

    B.on(u, 'shieldDone', ev => {
      const a = ev && ev.target;
      if (!a || a.team !== u.team || !a.alive) return;
      B.applyStatus(u, a, 'sugarrush', 6);
      B.applyStatus(u, a, 'fortify', 6, { stacks: 2 });
      B.applyStatus(u, a, 'regen', 5, { val: a.max.hp * (.12 + lvl * .03) / 5 });
      B.fxFloatIcon(a.x, a.y - 100, '🍬 WARM BONBON', '#f0ae78');
      B.fxSparkle(a.x, a.y - 40, 8, '#f0ae78');
    });

    B.on(u, 'allyDamaged', ev => {
      if (!ev || !ev.unit || ev.unit.team !== u.team || !ev.src || ev.src.team === u.team || !ev.src.alive) return;
      if ((ev.amount / ev.unit.max.hp) < 0.15 && ev.unit.hpPct > 0.40) return;
      if (B.t < u._boxBurstAt) return;
      u._boxBurstAt = B.t + Math.max(3.5, 6.0 - lvl * .4);
      Sound.play('glass_break', { vol: .45 });
      if (ev.src.shield > 0) B.crackShield(ev.src, ev.src.shield * 0.40);
      B.dispel(ev.src, 2);
      B.applyStatus(u, ev.src, 'root', 2.5);
      B.energy(u, 25);
      B.fxFloatIcon(ev.src.x, ev.src.y - 100, '🎁 SURPRISE POP!', '#f0ae78');
      B.fxSparkle(ev.src.x, ev.src.y - 40, 10, '#f0ae78');
    });
  }
});

defBadge({
  id: 'ginger_scraps', owner: 'Ginger', friend: 'Scraps',
  name: "Scraps' Stitched Apron", icon: '🎨', color: '#ffb56b',
  desc: 'A heavy-duty baker’s apron Scraps reinforced with deep pockets, safety patches, and a badge: COOKIE ARTIST.',
  stat: lvl => `+${(12 + lvl * 6).toFixed(0)}% Healing Power · +${(10 + lvl * 5).toFixed(0)}% Max HP`,
  effect: "Scraps stitched heavy-duty protective pockets into Ginger's baker apron! Whenever Ginger heals or buffs an ally, she attaches a Gingerbread Armor patch (+25% Defense & Magic Defense, Fortify) and refunds 15 Energy to the target. Once per wave, when an ally would suffer lethal damage, Scraps' emergency patch intercepts the blow: grants Invulnerability for 2s, restores 30%+ Max HP, and grants Ginger full Energy!",
  apply(u, B, lvl) {
    u.flat.healPowP = (u.flat.healPowP || 0) + (0.12 + lvl * 0.06);
    u.flat.hpP = (u.flat.hpP || 0) + (0.10 + lvl * 0.05);
    u.dirty = true;
    u._craftLabelAt = {};
    u._gingerScrapsIntercept = false;

    B.on(u, 'waveStart', () => { u._gingerScrapsIntercept = false; });

    B.on(u, 'healDone', ev => {
      const a = ev && ev.target;
      if (!a || a.team !== u.team || !a.alive) return;
      const last = u._craftLabelAt[a.uid] || 0;
      if (B.t < last) return;
      u._craftLabelAt[a.uid] = B.t + Math.max(1.8, 3.4 - lvl * .22);
      B.applyStatus(u, a, 'fortify', 6 + lvl * .45, { stacks: 2 });
      B.energy(a, 15 + lvl * 2);
      B.fxFloatIcon(a.x, a.y - 100, '🎨 GINGER PATCH', '#ffb56b');
    });

    B.on(u, 'allyLethal', ev => {
      if (u._gingerScrapsIntercept || !ev || !ev.unit || ev.unit.team !== u.team) return;
      u._gingerScrapsIntercept = true;
      ev.prevented = true;
      const t = ev.unit;
      t.hp = Math.max(t.hp, t.max.hp * (.30 + lvl * .05));
      B.applyStatus(u, t, 'untargetable', 2.0);
      B.applyStatus(u, t, 'ccimmune', 3.0);
      B.energy(u, u.energyMax);
      Sound.play('cleanse', { vol: .5 });
      B.fxSparkle(t.x, t.y - 40, 20, '#ffb56b');
      B.fxFloatIcon(t.x, t.y - 110, '🛡️ PATCH INTERCEPT!', '#ffb56b');
    });
  }
});

defBadge({
  id: 'ginger_bobette', owner: 'Ginger', friend: 'Bobette',
  name: "Bobette's Festive Music Box", icon: '🎶', color: '#ff7892',
  desc: 'A wind-up music box Bobette wrapped in festive gingerbread trim and mint ribbons. It plays a gentle caroling tune that warms the entire room.',
  stat: lvl => `+${(12 + lvl * 6).toFixed(0)}% Shield Power · +${(10 + lvl * 5).toFixed(0)}% Cooldown Reduction`,
  effect: "Bobette's sweet music box fills Ginger's holiday bakes with resonant festive cheer! Whenever Ginger shields an ally, they gain 🎁 Caroled Spirits (+20% Move Speed, +25% Energy Generation) and a Frosting Resonance aura that continuously burns nearby foes for 8% Magic Damage per second. In addition, when Ginger casts Baked With Care! or an ally receives Last Bite, Bobette's music box chimes: unleashes a chiming shockwave that freezes all foes for 2s, grants all allies 50 Energy over 3s, and immediately grants Ginger 3 additional stacks of Perfect Decoration!",
  apply(u, B, lvl) {
    u.flat.shieldPowP = (u.flat.shieldPowP || 0) + (0.12 + lvl * 0.06);
    u.flat.cdrP = (u.flat.cdrP || 0) + (0.10 + lvl * 0.05);
    u.dirty = true;
    u._musicBoxAt = {};

    B.on(u, 'shieldDone', ev => {
      const a = ev && ev.target;
      if (!a || a.team !== u.team || !a.alive) return;
      const last = u._musicBoxAt[a.uid] || 0;
      if (B.t < last) return;
      u._musicBoxAt[a.uid] = B.t + Math.max(2.0, 4.0 - lvl * .25);
      B.applyStatus(u, a, 'speedup', 5.0 + lvl * .4);
      B.applyStatus(u, a, 'tenacity', 5.0 + lvl * .4);
      B.energy(a, 12 + lvl * 2);
      Sound.play('item_pop', { vol: .35, throttle: 150 });
      B.fxFloatIcon(a.x, a.y - 100, '🎶 CAROLED SPIRITS', '#ff7892');
      B.enemiesOf(u).forEach(e => {
        if (Math.hypot(e.x - a.x, e.y - a.y) < 140) {
          B.damage(u, e, u.st.mag * (0.35 + lvl * 0.05), { type: 'magic', tag: 'Frosting Resonance' });
          B.fxSparkle(e.x, e.y - 40, 8, '#ffeedb');
        }
      });
    });

    const triggerChime = () => {
      Sound.play('magiccircle', { vol: .45 });
      Sound.play('cheer', { vol: .40 });
      B.enemiesOf(u).forEach(e => {
        B.applyStatus(u, e, 'freeze', 2.0);
        B.damage(u, e, u.st.mag * (0.65 + lvl * 0.10), { type: 'magic', tag: 'Festive Music Box Chime' });
      });
      B.alliesOf(u).forEach(a => {
        B.energy(a, 50);
        B.fxSparkle(a.x, a.y - 40, 14, '#ffd166');
      });
      if (typeof gingerDecoration === 'function') {
        for (let i = 0; i < 3; i++) {
          gingerDecoration(u, B, { per: .065, cdr: .025 }, { max: 8 }, u);
        }
      }
      B.fxFloatIcon(u.x, u.y - 110, '🎶 FESTIVE CHIME!', '#ff7892');
    };

    B.on(u, 'skillCast', ev => {
      if (ev && ev.key === 'W') triggerChime();
    });

    B.on(u, 'allyLow', a => {
      if (a.hpPct <= 0.35 && (!a._musicBoxChime || B.t - a._musicBoxChime > 12)) {
        a._musicBoxChime = B.t;
        triggerChime();
      }
    });
  }
});

defBadge({
  id: 'blot_scraps', owner: 'Blot', friend: 'Scraps',
  name: "Scraps' Inked Masterpiece", icon: '🖋️', color: '#8f6bff',
  desc: 'A strange collaborative piece: part ink, part craft, and somehow better upside down.',
  stat: lvl => `+${(12 + lvl * 6).toFixed(0)}% Magic Damage · +${(10 + lvl * 5).toFixed(0)}% Control Duration`,
  effect: "Scraps' collage scissors turn Blot's caustic dark ink into an avant-garde masterpiece that melts enemy defenses! Whenever Blot applies Control (slow, blind, corrode, silence, root, sticky), Scraps pastes a Craft Label: inflicts Corrode (heavy magic DoT), 🎯 Exposed (2 stacks), and shreds Armor and Magic Defense by 25%+ for 6s. When a Controlled enemy is hit by Blot's ink pools, they erupt in a Confetti Splash dealing True Damage, draining 15 Energy, and refunding 10 Energy to Blot.",
  apply(u, B, lvl) {
    u.flat.magP = (u.flat.magP || 0) + (0.12 + lvl * 0.06);
    u.ccDurBonus = (u.ccDurBonus || 0) + (0.10 + lvl * 0.05);
    u.dirty = true;
    u._masterpieceMarks = Object.create(null);

    B.on(u, 'statusApplied', ev => {
      if (!ev || (ev.src !== u && (!ev.src || ev.src.owner !== u)) || !ev.unit || ev.unit.team === u.team) return;
      if (!['corrode', 'slow', 'blind', 'sticky', 'silence', 'taunt', 'root'].includes(ev.id)) return;
      const t = ev.unit;
      const key = t.uid || t.id;
      const now = B.t;
      if (now < (u._masterpieceMarks[key] || 0)) return;
      u._masterpieceMarks[key] = now + Math.max(3.0, 5.5 - lvl * .35);
      B.applyStatus(u, t, 'corrode', 6.0);
      B.applyStatus(u, t, 'exposed', 6.0, { stacks: 2 });
      B.applyStatus(u, t, 'defdown', 6.0, { val: 0.25 });
      B.applyStatus(u, t, 'magdown', 6.0, { val: 0.25 });
      B.energy(u, 6 + lvl * 2);
      B.fxFloatIcon(t.x, t.y - 105, '🖋️ MASTERPIECE', '#8f6bff');
      B.fxSparkle(t.x, t.y - 40, 8, '#ff5fa8');
    });

    B.on(u, 'dealDamage', ev => {
      if (!ev || !ev.target || ev.target.team === u.team || ev.tag === 'Confetti Splash') return;
      if (ev.target.hasStatus('corrode') || ev.target.hasStatus('sticky')) {
        const now = B.t;
        if (now < (ev.target._confettiSplashAt || 0)) return;
        ev.target._confettiSplashAt = now + 1.2;
        B.damage(u, ev.target, u.st.mag * (0.28 + lvl * 0.08), { type: 'true', tag: 'Confetti Splash' });
        B.energy(ev.target, -(12 + lvl * 2));
        B.energy(u, 10);
        B.fxSparkle(ev.target.x, ev.target.y - 45, 10, '#8f6bff');
      }
    });
  }
});

defBadge({
  id: 'brightney_rnd', owner: 'Brightney', friend: 'RnD',
  name: "Razzle's Chapter Marker", icon: '🔖', color: '#fff0a8',
  desc: 'A bright bookmark Razzle insisted belonged in the book, even though Brightney had already marked the page.',
  stat: lvl => `+${(12 + lvl * 6).toFixed(0)}% Shield Power · +${(10 + lvl * 5).toFixed(0)}% Magic Attack`,
  effect: "RnD's theatrical flair turns Brightney's lampshade into a dramatic stage spotlight! Blinding an enemy strips up to 2 buffs and triggers a Stage Flash: all allies gain Focus (+25% Armor & Magic Pen), +30 Energy, and +25% Attack Speed for 5s. Enemies caught in the beam suffer 25% increased damage while blinded.",
  apply(u, B, lvl) {
    u.flat.shieldPowP = (u.flat.shieldPowP || 0) + (0.12 + lvl * 0.06);
    u.flat.magP = (u.flat.magP || 0) + (0.10 + lvl * 0.05);
    u.dirty = true;
    u._chapterMarkerAt = 0;
    B.on(u, 'statusApplied', ev => {
      if (!ev || ev.src !== u || ev.id !== 'blind' || !ev.unit || ev.unit.team === u.team) return;
      if (B.t < u._chapterMarkerAt) return;
      u._chapterMarkerAt = B.t + Math.max(3.5, 6.0 - lvl * .4);
      B.dispel(ev.unit, 2);
      B.applyStatus(u, ev.unit, 'weaken', 4.0 + lvl * .4);
      Sound.play('camera_flash', { vol: .42 });
      B.alliesOf(u).forEach(a => {
        B.applyStatus(u, a, 'focus', 5);
        B.applyStatus(u, a, 'speedup', 5);
        B.energy(a, 20 + lvl * 3);
        B.fxSparkle(a.x, a.y - 40, 8, '#fff0a8');
      });
      B.fxFloatIcon(u.x, u.y - 108, '🔖 STAGE FLASH', '#fff0a8');
    });
  }
});

defBadge({
  id: 'rodger_toodles', owner: 'Rodger', friend: 'Toodles',
  name: "Toodles' Junior Case File", icon: '🕵️', color: '#8fb4ff',
  desc: 'A case file Rodger left open so Toodles could find the answer herself.',
  stat: lvl => `+${(12 + lvl * 6).toFixed(0)}% Accuracy · +${(10 + lvl * 5).toFixed(0)}% Skill Haste`,
  effect: "Toodles' bright magnifying glass and boundless detective enthusiasm help Rodger close cold cases in record time! Whenever an ally hits or applies Crowd Control to an enemy, Rodger immediately discovers 1 Clue on that enemy (1.5s ICD per target) and gains 14 Energy. When any enemy reaches 5 Clues or Rodger executes a deduction, Toodles drops a Detective Beacon: dispels all positive buffs on the enemy, roots them for 2.0s, marks them 🎯 Exposed, and all allies gain +30% Attack Speed and +25% Crit Chance for 6s.",
  apply(u, B, lvl) {
    u.flat.accP = (u.flat.accP || 0) + (0.12 + lvl * 0.06);
    u.flat.cdr = (u.flat.cdr || 0) + (0.10 + lvl * 0.05);
    u.dirty = true;
    u._juniorCaseAt = {};
    u._juniorBeaconAt = 0;

    B.on(u, 'statusApplied', ev => {
      if (!ev || !ev.unit || ev.unit.team === u.team || !ev.src || ev.src.team !== u.team) return;
      if (ev.id === 'investigated' && ev.src === u) return;
      if (!STATUS[ev.id] || !STATUS[ev.id].cc) return;
      const key = ev.unit.uid || ev.unit.id;
      if (B.t < (u._juniorCaseAt[key] || 0)) return;
      u._juniorCaseAt[key] = B.t + 1.5;
      B.energy(u, 14 + lvl * 2);
      B.applyStatus(u, u, 'haste', 3.0);
      B.fxFloatIcon(u.x, u.y - 105, '🔍 JUNIOR CLUE', '#8fb4ff');
    });

    B.on(u, 'dealDamage', ev => {
      if (!ev || !ev.target || ev.target.team === u.team || !ev.target.hasStatus('investigated')) return;
      if (B.t < u._juniorBeaconAt) return;
      u._juniorBeaconAt = B.t + Math.max(4.0, 7.0 - lvl * .4);
      Sound.play('camera_flash', { vol: .45 });
      B.dispel(ev.target, 3);
      B.applyStatus(u, ev.target, 'root', 2.0);
      B.applyStatus(u, ev.target, 'exposed', 6.0, { stacks: 2 });
      B.alliesOf(u).forEach(a => {
        B.applyStatus(u, a, 'lucky', 6.0);
        B.applyStatus(u, a, 'speedup', 6.0);
        B.fxSparkle(a.x, a.y - 40, 8, '#8fb4ff');
      });
      B.fxFloatIcon(ev.target.x, ev.target.y - 110, '🔦 CASE CLOSED!', '#8fb4ff');
    });
  }
});

defBadge({
  id: 'goob_waxwell', owner: 'Goob', friend: 'Waxwell',
  name: "Waxwell's Safe Wick", icon: '🕯️', color: '#f3bd68',
  desc: 'A little wick Goob kept close, just in case Waxwell needed a light—or someone to stay beside him.',
  stat: lvl => `+${(12 + lvl * 6).toFixed(0)}% Healing Power · +${(10 + lvl * 5).toFixed(0)}% Max HP`,
  effect: "Waxwell's steady, unquenchable flame lights Goob's hug lines, burning away despair! Connecting an ally with Hug Line wraps both Goob and the ally in an Illuminated Aura: grants Ward (-30% damage taken), 3 Fortify stacks, and 25 Energy. Enemies trying to cross the line are Burned for Magic Damage and Blinded for 3.5s. If a linked ally drops below 35% HP, Waxwell's wick bursts: cleanses all CC, grants 3s CC Immunity, heals for 18%+ Max HP, and shields them for 20% Max HP.",
  apply(u, B, lvl) {
    u.flat.healPowP = (u.flat.healPowP || 0) + (0.12 + lvl * 0.06);
    u.flat.hpP = (u.flat.hpP || 0) + (0.10 + lvl * 0.05);
    u.dirty = true;
    u._safeWickAt = {};
    u._wickBurstAt = 0;

    B.on(u, 'statusApplied', ev => {
      if (!ev || ev.src !== u || ev.id !== 'hugline' || !ev.unit || ev.unit.team === u.team) return;
      const target = ev.unit;
      const key = target.uid || target.id;
      if (B.t < (u._safeWickAt[key] || 0)) return;
      u._safeWickAt[key] = B.t + Math.max(3.0, 5.5 - lvl * .35);
      [u, target].forEach(unit => {
        B.applyStatus(u, unit, 'ward', 5.0);
        B.applyStatus(u, unit, 'fortify', 6.0, { stacks: 3 });
        B.energy(unit, 25);
        B.fxSparkle(unit.x, unit.y - 40, 10, '#f3bd68');
      });
      B.enemiesOf(u).forEach(foe => {
        if (!foe.alive || Math.abs(foe.x - target.x) > 160) return;
        B.damage(u, foe, u.st.mag * (0.35 + lvl * 0.08), { type: 'magic', tag: 'Safe Wick Burn' });
        B.applyStatus(u, foe, 'blind', 3.5);
      });
      B.fxFloatIcon(target.x, target.y - 105, '🕯️ ILLUMINATED LINE', '#f3bd68');
    });

    B.on(u, 'allyDamaged', ev => {
      const a = ev && ev.unit;
      if (!a || a.team !== u.team || !a.alive || a.hpPct >= 0.35) return;
      if (B.t < u._wickBurstAt) return;
      u._wickBurstAt = B.t + Math.max(5.0, 8.0 - lvl * .4);
      Sound.play('fire_ignite', { vol: .48 });
      B.cleanse(a, 4);
      B.applyStatus(u, a, 'ccimmune', 3.0);
      B.heal(u, a, a.max.hp * (.18 + lvl * .04), { tag: 'Candlelight Salvation' });
      B.shield(u, a, u.max.hp * (.20 + lvl * .05), 6);
      B.fxRing(a.x, a.y - 40, 160, '#f3bd68', .5);
      B.fxFloatIcon(a.x, a.y - 110, '🕯️ WICK BURST!', '#f3bd68');
    });
  }
});

defBadge({
  id: 'gourdy_connie', owner: 'Gourdy', friend: 'Connie',
  name: "Connie's Honest Treat", icon: '🎃', color: '#ff9d4d',
  desc: 'A pumpkin treat Connie approved only after Gourdy stopped trying to carry everyone at once.',
  stat: lvl => `+${(12 + lvl * 6).toFixed(0)}% Healing Power · +${(10 + lvl * 5).toFixed(0)}% Max HP`,
  effect: "Connie's mischievous spectral blessings turn Gourdy's pumpkin treats into miraculous supernatural remedies! Giving an ally a Pumpkin Treat heals for 16%+ Max HP, cleanses 2 debuffs, grants Ward (-30% damage taken for 5s), and bestows Connie's Ghost Veil (Untargetable for 1.5s and 25 Energy). Enemies attacking a treated ally trigger a Jack-o'-Lantern Scare: stuns the attacker for 1.5s, shreds their Magic Defense by 30%, and reflects 35% of the damage back as True Damage.",
  apply(u, B, lvl) {
    u.flat.healPowP = (u.flat.healPowP || 0) + (0.12 + lvl * 0.06);
    u.flat.hpP = (u.flat.hpP || 0) + (0.10 + lvl * 0.05);
    u.dirty = true;
    u._honestTreatAt = {};
    u._pumpkinScareAt = 0;

    B.on(u, 'gourdyTreat', ev => {
      const ally = ev && ev.ally;
      if (!ally || ally.team !== u.team || !ally.alive) return;
      const key = ally.uid || ally.id;
      if (B.t < (u._honestTreatAt[key] || 0)) return;
      u._honestTreatAt[key] = B.t + Math.max(2.4, 4.5 - lvl * .35);
      B.heal(u, ally, ally.max.hp * (.16 + lvl * .04), { tag: 'Honest Treat' });
      B.shield(u, ally, ally.max.hp * (.15 + lvl * .03), 6);
      B.cleanse(ally, 2);
      B.applyStatus(u, ally, 'ward', 5.0);
      B.applyStatus(u, ally, 'untargetable', 1.5);
      B.energy(ally, 25);
      ally._hasHonestPumpkinTreat = true;
      B.fxSparkle(ally.x, ally.y - 45, 10, '#ff9d4d');
      B.fxFloatIcon(ally.x, ally.y - 105, '🎃 HONEST TREAT', '#ff9d4d');
    });

    B.on(u, 'allyDamaged', ev => {
      if (!ev || !ev.unit || !ev.unit._hasHonestPumpkinTreat || !ev.src || ev.src.team === u.team || !ev.src.alive) return;
      if (B.t < u._pumpkinScareAt) return;
      u._pumpkinScareAt = B.t + Math.max(2.5, 4.5 - lvl * .35);
      Sound.play('ghost_wail', { vol: .45, throttle: 180 });
      B.applyStatus(u, ev.src, 'stun', 1.5);
      B.applyStatus(u, ev.src, 'magdown', 5, { val: 0.30 });
      B.damage(u, ev.src, ev.amount * 0.35, { type: 'true', reflected: true, tag: 'Pumpkin Retaliation' });
      B.fxFloatIcon(ev.src.x, ev.src.y - 100, '🎃 SPOOKED!', '#ff9d4d');
    });
  }
});

defBadge({
  id: 'qom_eclipse_connie', owner: 'QOMEclipse', friend: 'QOMConnie',
  name: "Connie's Crescent Pick",
  icon: '🌙', image: './uploads/image-78.png', color: '#b49aff',
  desc: 'A crescent-moon pick Connie made for Eclipse, with a little ghostly flourish worked into the edge.',
  stat: lvl => `+${(12 + lvl * 6).toFixed(0)}% Attack Speed · +${(10 + lvl * 5).toFixed(0)}% Crit Chance`,
  effect: "Connie's translucent moonstone guitar pick lets Eclipse's riffs slice clean through shields and armor with ethereal speed! Basic attacks and skill strikes grant 1 stack of Amplification and deal bonus True Damage scaling with Amp stacks, siphoning 8 Energy per hit. Entering Blackout or reaching max Amp stacks triggers a Ghostly Shockwave: Silences all enemies for 2.5s, shreds Armor by 35% for 6s, and grants Eclipse +40% Crit Damage and 2.0s Untargetable.",
  apply(u, B, lvl) {
    u.flat.aspdP = (u.flat.aspdP || 0) + (0.12 + lvl * 0.06);
    u.flat.crit = (u.flat.crit || 0) + (0.10 + lvl * 0.05);
    u.dirty = true;
    u._connieCrescentAmpAt = 0;
    u._connieGhostWaveAt = 0;

    B.on(u, 'dealDamage', ev => {
      const target = ev && ev.target;
      if (!target || target.team === u.team || !target.alive) return;
      if (B.t >= u._connieCrescentAmpAt) {
        u._connieCrescentAmpAt = B.t + Math.max(1.8, 3.2 - lvl * .25);
        const amp = u.getStatus('qom_amp');
        const cap = u.rarity >= 5 ? 15 : 10;
        if (!amp || amp.stacks < cap) {
          B.applyStatus(u, u, 'qom_amp', 999, { stacks: 1 });
          B.fxFloatIcon(u.x, u.y - 106, '🌙', '#b49aff');
        }
      }
      const ampStacks = (u.getStatus('qom_amp') || {}).stacks || 0;
      if (ampStacks > 0 && !ev.reflected && ev.tag !== 'Crescent True Damage') {
        B.damage(u, target, u.st.atk * (0.05 + ampStacks * 0.02 + lvl * 0.015), { type: 'true', tag: 'Crescent True Damage' });
        B.energy(target, -8);
        B.energy(u, 6);
      }
    });

    const triggerGhostWave = () => {
      if (B.t < u._connieGhostWaveAt) return;
      u._connieGhostWaveAt = B.t + Math.max(5.0, 8.0 - lvl * .4);
      Sound.play('bass_drop', { vol: .52 });
      B.enemiesOf(u).forEach(e => {
        B.applyStatus(u, e, 'silence', 2.5);
        B.applyStatus(u, e, 'defdown', 6.0, { val: 0.35 });
        B.fxFloatIcon(e.x, e.y - 95, '🌙 SILENCED', '#b49aff');
      });
      B.applyStatus(u, u, 'untargetable', 2.0);
      B.applyStatus(u, u, 'lucky', 6.0);
      B.fxRing(u.x, u.y - 40, 240, '#b49aff', .5);
      B.fxFloatIcon(u.x, u.y - 110, '🌙 GHOST RIFF', '#b49aff');
    };

    B.on(u, 'statusApplied', ev => {
      if (ev && ev.unit === u && ev.id === 'blackout') triggerGhostWave();
    });
  }
});

defBadge({
  id: 'rodger_teagan', owner: 'Teagan', friend: 'Rodger',
  name: "Rodger's Quiet Notes", icon: '📓', color: '#b8d9b2',
  desc: 'A few of Rodger’s quiet observations, kept by Teagan as a reminder that he has found a place at her table. She can use the notes without Rodger in her battle party.',
  stat: lvl => `+${(12 + lvl * 6).toFixed(0)}% Skill Haste · +${(10 + lvl * 5).toFixed(0)}% Magic Attack`,
  effect: "Teagan uses Rodger's notes herself; Rodger does not need to be on the team. When she Stuns, Slows, or makes an enemy Drowsy, she marks them Investigated for 6s, drains Energy, lowers Magic Defense, and exposes them to extra damage. Tea Time gives the most injured ally a Tea-Service Shield worth 24%+ of Teagan's Max HP and Haste for 6s.",
  apply(u, B, lvl) {
    u.flat.cdr = (u.flat.cdr || 0) + (0.12 + lvl * 0.06);
    u.flat.magP = (u.flat.magP || 0) + (0.10 + lvl * 0.05);
    u.dirty = true;
    u._openDoorAt = 0;

    B.on(u, 'statusApplied', ev => {
      if (!ev || ev.src !== u || !ev.unit || ev.unit.team === u.team || !ev.unit.alive) return;
      if (!['stun', 'slow', 'drowsy'].includes(ev.id)) return;
      const target = ev.unit;
      const now = B.t;
      if (now < (target._rodgerInvestigatedAt || 0)) return;
      target._rodgerInvestigatedAt = now + 4.0;
      B.energy(target, -(20 + lvl * 3));
      B.applyStatus(u, target, 'investigated', 6);
      B.applyStatus(u, target, 'magdown', 6);
      B.applyStatus(u, target, 'exposed', 6, { stacks: 2 });
      B.fxFloatIcon(target.x, target.y - 105, '🔍 INVESTIGATED', '#b8d9b2');
    });

    B.on(u, 'cast', ev => {
      if (ev.key !== 'W') return;
      const ally = B.lowestHp(B.alliesOf(u));
      if (!ally) return;
      B.shield(u, ally, u.max.hp * (.20 + lvl * .04), 6);
      B.applyStatus(u, ally, 'haste', 6);
      B.cleanse(ally, 2);
      B.fxSparkle(ally.x, ally.y - 40, 12, '#b8d9b2');
      B.fxFloatIcon(ally.x, ally.y - 110, '📓 BRIEFING', '#b8d9b2');
    });
  }
});

defBadge({
  id: 'rnd_rudie', owner: 'RnD', friend: 'Rudie',
  name: "Rudie's Curtain Cue", icon: '🎭', color: '#d64b4b',
  desc: 'A cue card Rudie decorated for his own scene, leaving the rest of the script intact.',
  stat: lvl => `+${(12 + lvl * 6).toFixed(0)}% Attack Speed · +${(10 + lvl * 5).toFixed(0)}% Move Speed`,
  effect: "Rudie's gleaming red nose spotlights Razzle & Dazzle's theatre! Basic attacks in Comedy grant +30% Attack Speed and blind adjacent enemies; basic attacks in Tragedy grant 15%+ Max HP Shield and slow targets. Completing a full Performance triggers a Grand Encore: grants the entire team Inspire (+15% damage, +35% Energy Generation) for 7s, bowls over the opposing frontline with a stage rush dealing Physical Damage, and stuns them for 1.8s!",
  apply(u, B, lvl) {
    u.flat.aspdP = (u.flat.aspdP || 0) + (0.12 + lvl * 0.06);
    u.flat.msP = (u.flat.msP || 0) + (0.10 + lvl * 0.05);
    u.dirty = true;
    u._curtainCueAt = -Infinity;

    B.on(u, 'basicHit', ev => {
      if (!ev || !ev.target || !ev.target.alive) return;
      if (u.rndState === 'comedy') {
        B.applyStatus(u, u, 'speedup', 4, { stacks: 1 });
        if (chance(0.35)) B.applyStatus(u, ev.target, 'blind', 2.5);
      } else if (u.rndState === 'tragedy') {
        B.shield(u, u, u.max.hp * (.04 + lvl * .01), 4);
        B.applyStatus(u, ev.target, 'slow', 3);
      }
    });

    B.on(u, 'statusApplied', ev => {
      if (!ev || ev.src !== u || ev.id !== 'performance' || (u.rndPerformance || 0) < (u.rndPerfMax || 4)) return;
      if (B.t - u._curtainCueAt < Math.max(5.0, 8.5 - lvl * .45)) return;
      u._curtainCueAt = B.t;
      Sound.play('cheer', { vol: .5 });
      B.alliesOf(u).forEach(a => {
        B.applyStatus(u, a, 'inspire', 5 + lvl * .5);
        B.energy(a, 20 + lvl * 3);
        B.fxSparkle(a.x, a.y - 40, 10, '#d64b4b');
      });
      const foeFront = B.nearest(u, B.enemiesOf(u));
      if (foeFront) {
        B.damage(u, foeFront, u.st.atk * (.85 + lvl * .25), { type: 'physical', tag: 'Grand Encore' });
        B.applyStatus(u, foeFront, 'stun', 1.8);
        B.knockback(u, foeFront, 140);
      }
      B.fxFloatIcon(u.x, u.y - 110, '🎭 ENCORE!', '#d64b4b');
    });
  }
});

defBadge({
  id: 'gigi_connie', owner: 'Gigi', friend: 'Connie',
  name: "Connie's Chaos Charm", icon: '👻', color: '#ff9bd2',
  desc: 'A ghostly charm Connie slipped into Gigi’s collection, ready to help whenever a prank goes just a little too far.',
  stat: lvl => `+${(12 + lvl * 6).toFixed(0)}% Skill Haste · +${(10 + lvl * 5).toFixed(0)}% Evasion`,
  effect: "Connie's ghostly mischief rigs Gigi's prize wheel with spectral luck! Gigi begins battle with 1 extra Wheel Ticket and +25% Evasion. Whenever Gigi spins the Wish Wheel, Connie haunts the board so Jackpots hit twice as often. Landing on a Jackpot causes Connie to unleash a Poltergeist Wail that Fears all enemies for 2.0s+, cuts their Attack Speed by 35%, and grants Gigi and her most injured ally a Spectral Shield with +30% Evasion and CC immunity for 5s.",
  apply(u, B, lvl) {
    u.flat.cdr = (u.flat.cdr || 0) + (0.12 + lvl * 0.06);
    u.flat.evaP = (u.flat.evaP || 0) + (0.10 + lvl * 0.05);
    u.dirty = true;
    u._chaosCharmAt = 0;

    B.after(.15, () => { if (u.alive && typeof B.gigiTicket === 'function') B.gigiTicket(u); });

    B.on(u, 'gigiPrize', prize => {
      if (!prize) return;
      if (prize.id === 'jackpot' || prize.combo >= 2) {
        if (B.t < u._chaosCharmAt) return;
        u._chaosCharmAt = B.t + Math.max(4.0, 7.0 - lvl * .4);
        Sound.play('ghost_wail', { vol: .48, throttle: 200 });
        B.enemiesOf(u).forEach(e => {
          B.applyStatus(u, e, 'fear', 2.0 + lvl * .3);
          B.applyStatus(u, e, 'slow', 4.0 + lvl * .4);
          B.fxFloatIcon(e.x, e.y - 95, '👻 FEAR', '#ff9bd2');
        });
        const ally = B.lowestHp(B.alliesOf(u)) || u;
        [u, ally].forEach(target => {
          B.shield(u, target, u.max.hp * (.18 + lvl * .04), 5);
          B.applyStatus(u, target, 'untargetable', 1.5);
          B.applyStatus(u, target, 'ccimmune', 4);
        });
        B.fxRing(u.x, u.y - 40, 260, '#ff9bd2', .5);
        B.fxFloatIcon(u.x, u.y - 110, '👻 POLTERGEIST', '#ff9bd2');
      }
    });
  }
});

defBadge({
  id: 'phantasia_dandy', owner: 'Phantasia', friend: 'Dandy',
  name: "Dandy's Wishkeeper Star", icon: '🌟', color: '#efb8ff',
  desc: 'A star-shaped token Dandy gave Phantasia after one of her wishes saved the shop from a very bad day.',
  stat: lvl => `+${(12 + lvl * 6).toFixed(0)}% Healing Power · +${(10 + lvl * 5).toFixed(0)}% Skill Haste`,
  effect: "Dandy's golden boutique star charm grants Phantasia's gentle dreams the permanence and weight of solid gold! At wave start or when Phantasia casts an active skill, she places a Golden Sanctuary on the entire team: grants 4.0s CC Immunity, cleanses 2 debuffs, and grants a Wishkeeper Shield (20%+ Max HP for 8s). While shielded, allies gain Focus (+25% Armor and Magic Pen) and +30% Attack Speed. If an ally's shield is broken, a Falling Star strikes the attacker for Magic Damage, stuns them for 1.5s, and restores 20 Energy to the ally.",
  apply(u, B, lvl) {
    u.flat.healPowP = (u.flat.healPowP || 0) + (0.12 + lvl * 0.06);
    u.flat.cdr = (u.flat.cdr || 0) + (0.10 + lvl * 0.05);
    u.dirty = true;
    u._wishSanctuaryAt = 0;
    u._starfallAt = 0;

    const deployWishSanctuary = () => {
      if (B.t < u._wishSanctuaryAt) return;
      u._wishSanctuaryAt = B.t + Math.max(5.0, 8.5 - lvl * .4);
      Sound.play('shimmer', { vol: .52 });
      B.alliesOf(u).forEach(a => {
        B.cleanse(a, 2);
        B.applyStatus(u, a, 'ccimmune', 4.0);
        B.applyStatus(u, a, 'focus', 6.0);
        B.applyStatus(u, a, 'speedup', 6.0);
        B.shield(u, a, u.max.hp * (.20 + lvl * .04), 8);
        a._hasWishkeeperShield = true;
        B.fxSparkle(a.x, a.y - 40, 10, '#efb8ff');
      });
      B.fxRing(u.x, u.y - 42, 300, '#efb8ff', .5);
      B.fxFloatIcon(u.x, u.y - 110, '🌟 WISH SANCTUARY', '#efb8ff');
    };

    B.after(.25, () => deployWishSanctuary());
    B.on(u, 'waveStart', () => deployWishSanctuary());
    B.on(u, 'cast', ev => {
      if (['W', 'G'].includes(ev.key)) deployWishSanctuary();
    });

    B.on(u, 'allyDamaged', ev => {
      if (!ev || !ev.unit || !ev.unit._hasWishkeeperShield || !ev.src || ev.src.team === u.team || !ev.src.alive) return;
      if (ev.unit.shield <= 0) {
        ev.unit._hasWishkeeperShield = false;
        if (B.t < u._starfallAt) return;
        u._starfallAt = B.t + Math.max(2.5, 4.5 - lvl * .35);
        Sound.play('camera_flash', { vol: .48 });
        B.damage(u, ev.src, u.st.mag * (1.2 + lvl * 0.25), { type: 'magic', tag: 'Starfall Strike' });
        B.applyStatus(u, ev.src, 'stun', 1.5);
        B.energy(ev.unit, 20);
        B.fxSparkle(ev.src.x, ev.src.y - 45, 12, '#efb8ff');
        B.fxFloatIcon(ev.src.x, ev.src.y - 105, '🌟 STARFALL!', '#efb8ff');
      }
    });
  }
});

/* ============================================================ HOLLOWAY PARENTS BADGES */

defBadge({
  id: 'mrsholloway_gourdy', owner: 'MrsHolloway', friend: 'Gourdy',
  name: "Gourdy's Spiraled Locket Ribbon", icon: '🌀', color: '#c070ed',
  desc: "A purple silk ribbon woven with glowing spiral threads. It hums with maternal protection and boundless spiritual energy.",
  stat: lvl => `+${(14 + lvl * 7).toFixed(0)}% Magic Damage · +${(12 + lvl * 6).toFixed(0)}% Max HP`,
  effect: "Spiritual mastery empowers every strike! At wave start, Mrs. Holloway gains a Shield equal to 25%+ Max HP for 8s and inflicts 3 Spiral stacks on all enemies. Whenever Mrs. Holloway casts an active skill, she triggers a Spectral Pulse that deals Magic Damage to all enemies with Spirals, stuns them for 1.2s, and restores 30+ Energy to herself. In addition, Mrs. Holloway gains +25% increased Magic Damage on all skills.",
  apply(u, B, lvl) {
    u.flat.magP = (u.flat.magP || 0) + (0.14 + lvl * 0.07);
    u.flat.hpP = (u.flat.hpP || 0) + (0.12 + lvl * 0.06);
    u.dirty = true;
    u._locketPulseAt = -Infinity;

    const startGuard = () => {
      if (!u.alive) return;
      B.shield(u, u, u.max.hp * (.25 + lvl * .05), 8);
      B.fxSparkle(u.x, u.y - 45, 10, '#c070ed');
      B.enemiesOf(u).filter(e => e.alive).forEach(e => {
        if (typeof applySpiral === 'function') applySpiral(u, e, B, 3);
        else B.applyStatus(u, e, 'holloway_spiral', 12, { stacks: 3 });
      });
      if (B.fxMrsHollowayExplosion) B.fxMrsHollowayExplosion(u.x, u.y - 45, 280);
      else B.fxSpiralBurst(u.x, u.y - 45, 280);
      B.fxFloatIcon(u.x, u.y - 110, '🌀 SPIRAL RIBBON', '#c070ed');
    };

    B.after(.2, startGuard);
    B.on(u, 'waveStart', startGuard);

    B.on(u, 'cast', ev => {
      if (B.t < u._locketPulseAt) return;
      u._locketPulseAt = B.t + 3.5;
      const foes = B.enemiesOf(u).filter(e => e.alive);
      foes.forEach(e => {
        const spiral = e.getStatus ? e.getStatus('holloway_spiral') : null;
        if (spiral && spiral.stacks > 0) {
          B.damage(u, e, u.st.mag * (.85 + lvl * .22), { type: 'magic', tag: 'Spectral Pulse' });
          B.applyStatus(u, e, 'stun', 1.2);
          B.fxSparkle(e.x, e.y - 40, 8, '#e0b0ff');
        }
      });
      B.energy(u, 30 + lvl * 5);
      B.fxFloatIcon(u.x, u.y - 90, `+${30 + lvl * 5} ⚡`, '#ffd54d');
    });

    B.on(u, 'dealDamage', ev => {
      if (ev && !ev.basic) {
        ev.amount *= 1.25;
      }
    });
  }
});

defBadge({
  id: 'mrsholloway_eclipse', owner: 'MrsHolloway', friend: 'Eclipse',
  name: "Eclipse's Spiritual Crest", icon: '🌙', color: '#8b5cf6',
  desc: "A crescent medallion engraved with spiraling twilight runes. It radiates an unbroken aura of spiritual defiance.",
  stat: lvl => `+${(12 + lvl * 6).toFixed(0)}% Skill Haste · +${(14 + lvl * 6).toFixed(0)}% Magic Penetration`,
  effect: "Twilight shadows and supernatural spirals merge into terrifying power! Enemies afflicted with Spiral suffer -20% Magic Defense and -15% Attack against Mrs. Holloway. Whenever Mrs. Holloway casts an active skill, she calls down a Celestial Spiral, dealing True Damage to all enemies, knocking them back, and granting herself CC Immunity and +20% Skill Power for 5s.",
  apply(u, B, lvl) {
    u.flat.cdr = (u.flat.cdr || 0) + (0.12 + lvl * 0.06);
    u.flat.magPen = (u.flat.magPen || 0) + (0.14 + lvl * 0.06);
    u.dirty = true;
    u._celestialSpiralAt = -Infinity;

    B.on(u, 'cast', ev => {
      if (B.t < u._celestialSpiralAt) return;
      u._celestialSpiralAt = B.t + 5;
      Sound.play('spirit_aura', { vol: .7 });
      if (B.fxMrsHollowayExplosion) B.fxMrsHollowayExplosion(B.centerX(), u.y - 45, 320, { dur: .75 });
      else B.fxSpiralBurst(B.centerX(), u.y - 45, 320, { dur: .75 });
      B.enemiesOf(u).filter(e => e.alive).forEach(e => {
        B.damage(u, e, u.st.mag * (.90 + lvl * .25), { type: 'true', tag: 'Celestial Spiral' });
        B.knockback(u, e, 120);
      });
      B.applyStatus(u, u, 'ccimmune', 5.0);
      B.applyStatus(u, u, 'ward', 5.0);
      B.fxSparkle(u.x, u.y - 40, 8, '#e0b0ff');
      B.fxFloatIcon(u.x, u.y - 110, '🌙 CELESTIAL SPIRAL', '#a855f7');
    });
  }
});

defBadge({
  id: 'mrholloway_gourdy', owner: 'MrHolloway', friend: 'Gourdy',
  name: "A Father's Pumpkin Charm", icon: '🎃', color: '#d97706',
  desc: "A carved wooden pumpkin talisman polished with autumn wax. It beats with the steady, protective heart of a devoted father.",
  stat: lvl => `+${(15 + lvl * 7).toFixed(0)}% Armor · +${(15 + lvl * 7).toFixed(0)}% Shield Power`,
  effect: "A father stands unflinching between danger and defeat! At wave start, Mr. Holloway taunts all enemies for 6s, gains 3 Fortitude stacks, and deploys an Autumn Barrier absorbing damage equal to 30%+ Max HP. Whenever Mr. Holloway takes damage, he immediately gains a 25%+ Max HP Shield and retaliates with a heavy Harvest Swipe that deals Physical Damage to the attacker, knocks them back, and stuns them for 1.5s (triggers every 3.5s). While shielded, Mr. Holloway takes 25% reduced Damage from all sources.",
  apply(u, B, lvl) {
    u.flat.defP = (u.flat.defP || 0) + (0.15 + lvl * 0.07);
    u.flat.shieldPowP = (u.flat.shieldPowP || 0) + (0.15 + lvl * 0.07);
    u.dirty = true;
    u._fatherInterceptAt = -Infinity;

    const startGuard = () => {
      if (!u.alive) return;
      B.applyStatus(u, u, 'holloway_fortitude', 12, { stacks: 3 });
      B.shield(u, u, u.max.hp * (.30 + lvl * .06), 10);
      B.enemiesOf(u).filter(e => e.alive).forEach(e => {
        e._distractor = u;
        e._distractUntil = B.t + 6;
        B.applyStatus(u, e, 'holloway_distracted', 6, { dmgReduction: .2 });
      });
      if (B.fxMrHollowayCrash) B.fxMrHollowayCrash(u.x, u.y - 35, 240);
      else B.fxAutumnBurst(u.x, u.y - 40, 240);
      B.fxFloatIcon(u.x, u.y - 105, '🎃 FATHER’S CHARM', '#f59e0b');
    };

    B.after(.2, startGuard);
    B.on(u, 'waveStart', startGuard);

    // Retaliate whenever Mr. Holloway takes damage
    B.on(u, 'damaged', ev => {
      if (!ev || !ev.src || ev.src.team === u.team || !ev.src.alive) return;
      if (B.t < u._fatherInterceptAt) return;
      u._fatherInterceptAt = B.t + 3.5;
      B.shield(u, u, u.max.hp * (.25 + lvl * .05), 7);
      B.damage(u, ev.src, u.st.atk * (1.2 + lvl * 0.25), { type: 'physical', tag: 'Harvest Swipe' });
      B.knockback(u, ev.src, 140);
      B.applyStatus(u, ev.src, 'stun', 1.5);
      if (B.fxMrHollowayClaw) B.fxMrHollowayClaw(u.x, u.y, ev.src.x, ev.src.y);
      else B.fxAutumnBurst(ev.src.x, ev.src.y - 35, 160);
      B.fxFloatIcon(u.x, u.y - 110, '🛡 HARVEST RETALIATION!', '#ffd54d');
    });

    // 25% damage reduction from all enemies while shielded
    B.on(u, 'damaged', ev => {
      const shieldVal = (u.statuses || []).filter(st => st.id === 'shield').reduce((sum, st) => sum + (st.val || 0), 0);
      if (shieldVal > 0) {
        ev.amount *= 0.75;
      }
    });
  }
});

defBadge({
  id: 'mrholloway_connie', owner: 'MrHolloway', friend: 'Connie',
  name: "Connie's Ghost Lantern", icon: '👻', color: '#f59e0b',
  desc: "A hollowed pumpkin lantern glowing with warm spectral fire. It weaves an elusive ghostly mantle around its bearer.",
  stat: lvl => `+${(14 + lvl * 6).toFixed(0)}% Evasion · +${(12 + lvl * 6).toFixed(0)}% Attack`,
  effect: "Ghostly stealth meets crushing pumpkin power! When Mr. Holloway enters battle, casts an active skill, or takes lethal damage, a spectral shroud makes him Untargetable and grants +50% Evasion for 3.5s. Whenever Mr. Holloway attacks with Harvest Crash or strikes in combat, he triggers a Ghostly Quake: all foes take Physical Damage, become Blinded for 4s, and Mr. Holloway heals himself for 14%+ Max HP (triggers every 5s).",
  apply(u, B, lvl) {
    u.flat.evaP = (u.flat.evaP || 0) + (0.14 + lvl * 0.06);
    u.flat.atkP = (u.flat.atkP || 0) + (0.12 + lvl * 0.06);
    u.dirty = true;
    u._ghostQuakeAt = -Infinity;

    const ghostShroud = () => {
      if (!u.alive) return;
      B.applyStatus(u, u, 'untargetable', 3.5);
      B.applyStatus(u, u, 'evasion_up', 3.5, { evaBonus: .50 });
      Sound.play('ghost_vanish', { vol: .6 });
      B.fxSparkle(u.x, u.y - 45, 10, '#fef08a');
      B.fxFloatIcon(u.x, u.y - 105, '👻 GHOST SHROUD', '#fef08a');
    };

    B.after(.15, ghostShroud);

    B.on(u, 'cast', () => {
      if (Math.random() < 0.5) ghostShroud();
    });

    B.on(u, 'dealDamage', ev => {
      if (!ev || B.t < u._ghostQuakeAt) return;
      u._ghostQuakeAt = B.t + 5;
      Sound.play('earth_quake', { vol: .75 });
      B.shake(12, .4);
      B.enemiesOf(u).filter(e => e.alive).forEach(e => {
        B.damage(u, e, u.st.atk * (1.0 + lvl * .22), { type: 'physical', tag: 'Ghostly Quake' });
        B.applyStatus(u, e, 'blind', 4);
      });
      B.heal(u, u, u.max.hp * (.14 + lvl * .03));
      if (B.fxMrHollowayCrash) B.fxMrHollowayCrash(u.x, u.y - 40, 240);
      else B.fxAutumnBurst(u.x, u.y - 40, 240);
      B.fxFloatIcon(u.x, u.y - 110, '👻 GHOSTLY QUAKE!', '#fef08a');
    });
  }
});

/* ============================================================ DELILAH KEEN FRIENDSHIP BADGES (DHBM) */

defBadge({
  id: 'delilah_bassie', owner: 'Delilah', friend: 'Bassie',
  name: "Bassie's Prepared Capsule", icon: '🧺', color: '#a855f7',
  desc: "A polished Easter basket woven from sterile laboratory tubing and spring ribbons, packed by Bassie with emergency reagents. Delilah scoffed at the pastel colors, but admits its field utility is undeniable.",
  stat: lvl => `+${(14 + lvl * 7).toFixed(0)}% Skill Haste · +${(15 + lvl * 7).toFixed(0)}% Max HP`,
  effect: "Clinical resourcefulness ensures every variable is accounted for! At wave start, Delilah prepares 3 Sterile Emergency Capsules. Whenever Delilah or an active specimen falls below 50% HP or casts an active skill, she consumes a capsule to grant herself and her active specimens an Ichor Shield equal to 22%+ Max HP for 8s, cleanse all crowd control, and instantly restore 35+ Energy. In addition, Delilah's skills gain +20% Skill Power and extend all Crowd Control durations by 1.5s.",
  apply(u, B, lvl) {
    u.flat.cdr = (u.flat.cdr || 0) + (0.14 + lvl * 0.07);
    u.flat.hpP = (u.flat.hpP || 0) + (0.15 + lvl * 0.07);
    u.flat.skillPowerP = (u.flat.skillPowerP || 0) + 0.20;
    u.dirty = true;
    u._capsuleCd = -Infinity;
    u._capsulesRemaining = 3;

    const useCapsule = (tag) => {
      if (u._capsulesRemaining <= 0 || B.t < u._capsuleCd || !u.alive) return;
      u._capsulesRemaining--;
      u._capsuleCd = B.t + 4.0;
      Sound.play('cure_all', { vol: .6 });
      Sound.play('get_rare', { vol: .45 });

      const targets = [u, ...B.minionsOf(u).filter(m => m.alive)];
      targets.forEach(tgt => {
        B.cleanse(tgt, 99);
        B.shield(u, tgt, u.max.hp * (.22 + lvl * .05), 8);
        B.energy(tgt, 35 + lvl * 8);
        B.applyStatus(u, tgt, 'ward', 5);
        B.fxSparkle(tgt.x, tgt.y - 45, 8, '#caa2ff');
      });
      B.fxFloatIcon(u.x, u.y - 110, `🧺 STERILE CAPSULE (${u._capsulesRemaining} REMAIN)`, '#a855f7');
    };

    B.on(u, 'waveStart', () => {
      u._capsulesRemaining = 3;
    });

    B.on(u, 'cast', () => {
      if (Math.random() < 0.6) useCapsule('cast');
    });

    B.on(u, 'damaged', ev => {
      if (u.hpPct < 0.50) useCapsule('emergency');
    });

    // Extend CC applied by Delilah
    B.on(u, 'statusApplied', ev => {
      if (ev.src === u && STATUS[ev.id]?.cc && ev.status) {
        ev.status.dur = (ev.status.dur || 2) + 1.5;
      }
    });
  }
});

defBadge({
  id: 'delilah_dandy', owner: 'Delilah', friend: 'Dandy',
  name: "Prototype Mascot Core", icon: '🌼', color: '#eab308',
  desc: "A miniature glass syringe etched with a golden flower emblem, preserving raw Ichor from Gardenview's very first mascot prototype. The creator and the scapegoat, forever bound by the catalyst that started it all.",
  stat: lvl => `+${(15 + lvl * 7).toFixed(0)}% True Damage · +${(14 + lvl * 6).toFixed(0)}% Magic Penetration`,
  effect: "The original prototype's catalyst surges through every injection! Delilah deals +25%+ True Damage and permanently ignores 25% of enemy Magic Defense. Whenever Delilah casts Controlled Experiment or an active skill, she unleashes a Petaled Ichor Shockwave, dealing heavy True Damage to all enemies, Stunning them for 1.5s, and injecting them with 3 stacks of Contamination. Defeating any enemy restores 15%+ Max HP to Delilah and all active specimens.",
  apply(u, B, lvl) {
    u.flat.trueDmgP = (u.flat.trueDmgP || 0) + (0.25 + lvl * 0.05);
    u.flat.magPen = (u.flat.magPen || 0) + (0.14 + lvl * 0.06);
    u.dirty = true;
    u._dandyShockwaveAt = -Infinity;

    B.on(u, 'cast', ev => {
      if (B.t < u._dandyShockwaveAt) return;
      u._dandyShockwaveAt = B.t + 4.5;
      Sound.play('beam_fire', { vol: .75 });
      Sound.play('fanfare', { vol: .5 });
      B.flash('#ffd700', .35, .2);
      B.fxRing(u.x, u.y - 45, 300, '#eab308', .6);
      if (B.fxDelilahContaminationBurst) B.fxDelilahContaminationBurst(u.x, u.y - 45, 260);

      B.enemiesOf(u).filter(e => e.alive).forEach(e => {
        B.damage(u, e, u.st.mag * (.85 + lvl * .22), { type: 'true', tag: 'Petaled Ichor Shockwave' });
        B.applyStatus(u, e, 'stun', 1.5);
        B.applyStatus(u, e, 'contamination', 8, { stacks: 3 });
        B.fxSparkle(e.x, e.y - 40, 8, '#eab308');
      });
      B.fxFloatIcon(u.x, u.y - 110, '🌼 PETALED ICHOR SHOCKWAVE', '#eab308');
    });

    B.on(u, 'enemyDown', () => {
      const targets = [u, ...B.minionsOf(u).filter(m => m.alive)];
      targets.forEach(tgt => {
        B.heal(u, tgt, tgt.max.hp * (.15 + lvl * .03), { tag: 'Prototype Harvest' });
        B.fxSparkle(tgt.x, tgt.y - 45, 6, '#ffd700');
      });
      B.fxFloatIcon(u.x, u.y - 95, '🌼 PROTOTYPE HEAL', '#ffd700');
    });
  }
});

defBadge({
  id: 'connie_waxwell', owner: 'Connie', friend: 'Waxwell',
  name: "Waxwell's Melodramatic Séance Wick", icon: '🕯️', color: '#c084fc',
  desc: "A ludicrously ornate, violet candle-wick that Waxwell dramatically insisted would 'bind the unruly apparition to his infernal dominion.' Connie just uses it to light firecrackers, ruin his villainous monologues, and summon spectral trick-fire.",
  stat: lvl => `+${(14 + lvl * 7).toFixed(0)}% Evasion · +${(15 + lvl * 7).toFixed(0)}% Magic Penetration`,
  effect: "Waxwell's theatrical wick infuses Connie's phantom tricks with explosive purple fire! Connie permanently deals +25%+ Magic Damage and ignores 25% of enemy Magic Defense. Whenever Connie dodges an attack or activates an active skill, she triggers a Melodramatic Flare (4.5s cd): blasting nearby enemies for heavy Magic Damage, Blinding them for 3.5s, and leaving a pool of Scented Violet Wax that Roots enemies for 2.0s while granting Connie +25% Evasion and 30 Energy. When Connie drops below 50% HP (once per wave), she dramatically snuffs out her presence: cleansing all debuffs, gaining a 22%+ Max HP Spectral Wax Shield, and setting all enemies ablaze with violet burn.",
  apply(u, B, lvl) {
    u.flat.evaP = (u.flat.evaP || 0) + .14 + lvl * .07;
    u.flat.magPen = (u.flat.magPen || 0) + .15 + lvl * .07;
    u.flat.magP = (u.flat.magP || 0) + .25 + lvl * .05;
    u.dirty = true;
    u._waxFlareAt = 0;
    u._waxSnuffUsed = false;

    const triggerFlare = () => {
      if (!u.alive || B.t < (u._waxFlareAt || 0)) return;
      u._waxFlareAt = B.t + Math.max(2.8, 4.5 - lvl * 0.25);
      Sound.play('fire', { vol: .6 });
      Sound.play('hit_magic', { vol: .5 });
      B.flash('#c084fc', .3, .2);
      B.shake(6, .2);

      // Area blast around Connie
      const foes = B.enemiesOf(u).filter(e => e.alive && B.distance(e, u) < 240);
      foes.forEach(e => {
        B.damage(u, e, u.st.mag * (1.10 + lvl * .25), { type: 'magic', tag: 'Melodramatic Flare' });
        B.applyStatus(u, e, 'blind', 3.5);
        B.applyStatus(u, e, 'root', 2.0);
        B.fxSparkle(e.x, e.y - 45, 8, '#c084fc');
      });

      // Scented violet wax pool
      B.fxWaxZone(u.x, 'scented_violet', 110, 6.0, u.y);

      // Connie self buffs
      B.energy(u, 30);
      B.applyStatus(u, u, 'speedup', 4.0);
      B.fxFloatIcon(u.x, u.y - 110, '🕯️ MELODRAMATIC FLARE', '#c084fc');
    };

    B.on(u, 'dodged', triggerFlare);
    B.on(u, 'cast', triggerFlare);

    // Dramatic Snuff-Out save when dropping low
    const checkSnuff = () => {
      if (!u.alive || u.hpPct >= 0.50 || u._waxSnuffUsed) return;
      u._waxSnuffUsed = true;
      Sound.play('unsummon', { vol: .7 });
      Sound.play('fire', { vol: .65 });
      B.flash('#e879f9', .4, .25);
      B.cleanse(u, 99);
      B.shield(u, u, u.max.hp * (.22 + lvl * .05), 6.0);
      B.applyStatus(u, u, 'untargetable', 1.5);

      // Violet burn on all enemies
      B.enemiesOf(u).filter(e => e.alive).forEach(e => {
        B.applyStatus(u, e, 'burn', 6.0, { val: u.st.mag * (.24 + lvl * .05) });
        B.fxSparkle(e.x, e.y - 45, 6, '#c084fc');
      });
      B.fxFloatIcon(u.x, u.y - 120, '🕯️ DRAMATIC SNUFF-OUT', '#e879f9');
    };

    B.on(u, 'damaged', checkSnuff);
    B.on(u, 'waveStart', () => {
      u._waxSnuffUsed = false;
    });
  }
});

/* ============================================================ QUEENS OF MISCHIEF (DHBM DISKS) */

/* --- QOM GOURDY --- */
defBadge({
  id: 'qom_gourdy_soulvester', owner: 'QOMGourdy', friend: 'QOMSoulvester',
  name: "Soulvester's Steel Drumsticks", icon: '🥁', color: '#bd82e8',
  desc: 'Heavy alloy drumsticks forged by Soulvester, turning Gourdy’s rock rhythms into solid acoustic protection.',
  stat: lvl => `+${(12 + lvl * 5).toFixed(0)}% Max Health · +${(10 + lvl * 4).toFixed(0)}% Skill Haste`,
  effect: "Soulvester's reinforced steel drumsticks turn Gourdy's drum beats into concussive acoustic barriers! Beat 1 shields are doubled and grant Fortify. When any ally drops below 50% HP or takes lethal damage, Gourdy triggers an immediate Knightly Beat 4 Crash, pushing attackers back 120px, stunning them for 2.0s, and granting that ally an Aegis Shield (30%+ Max HP) and Ward for 5s (10s cooldown).",
  apply(u, B, lvl) {
    u.flat.hpP = (u.flat.hpP || 0) + (0.12 + lvl * 0.05);
    u.flat.cdr = (u.flat.cdr || 0) + (0.10 + lvl * 0.04);
    u.dirty = true;
    u._qomSteelSticksAt = -Infinity;

    B.on(u, 'allyDamaged', ev => {
      const ally = ev && ev.unit;
      if (!ally || ally.team !== u.team || !ally.alive) return;
      if (ally.hpPct < 0.50 && B.t >= u._qomSteelSticksAt) {
        u._qomSteelSticksAt = B.t + Math.max(7.0, 12.0 - lvl * 0.5);
        Sound.play('qom_crash', { vol: .75 });
        Sound.play('qom_counter', { vol: .65 });
        B.enemiesOf(u).forEach(e => {
          if (!e.alive) return;
          B.interrupt(e);
          B.knockback(u, e, 120);
          B.applyStatus(u, e, 'stun', 2.0);
          B.damage(u, e, u.st.mag * (1.2 + lvl * 0.2), { type: 'magic', area: true, tag: 'Steel Drum Crash' });
        });
        B.shield(u, ally, u.max.hp * (0.30 + lvl * 0.05), 5.0);
        B.applyStatus(u, ally, 'ward', 5.0);
        B.fxFloatIcon(u.x, u.y - 110, '🥁 STEEL DRUM CRASH', '#bd82e8');
      }
    });
  }
});

defBadge({
  id: 'qom_gourdy_connie', owner: 'QOMGourdy', friend: 'QOMConnie',
  name: "Connie's Ghostly Metronome", icon: '⏱️', color: '#8cf0da',
  desc: 'A supernatural metronome provided by Connie that ticks in harmony with the spirit realm.',
  stat: lvl => `+${(12 + lvl * 6).toFixed(0)}% Magic Attack · +${(10 + lvl * 5).toFixed(0)}% Energy Generation`,
  effect: "Connie's supernatural metronome syncs Gourdy's beats with the astral plane! Beat 3 grants all allies +1 Phantom Note and heals the entire team instead of just the lowest-HP ally. In addition, triggering Trick or Treat! casts Ghostly Feedback on all enemies, silencing them for 2.2s and granting Gourdy 2 stacks of Encore.",
  apply(u, B, lvl) {
    u.flat.magP = (u.flat.magP || 0) + (0.12 + lvl * 0.06);
    u.flat.energyGen = (u.flat.energyGen || 0) + (0.10 + lvl * 0.05);
    u.dirty = true;

    B.on(u, 'cast', ev => {
      if (ev && ev.key === 'B') {
        Sound.play('qom_ghost', { vol: .55 });
        B.applyStatus(u, u, 'qom_encore', 999, { stacks: 2 });
        B.enemiesOf(u).forEach(e => {
          if (!e.alive) return;
          B.applyStatus(u, e, 'silence', 2.2);
          B.applyStatus(u, e, 'qom_feedback', 6.0);
          B.damage(u, e, u.st.mag * (0.65 + lvl * 0.15), { type: 'magic', tag: 'Ghostly Feedback' });
        });
        B.fxFloatIcon(u.x, u.y - 110, '⏱️ GHOSTLY TEMPO', '#8cf0da');
      }
    });
  }
});

/* --- QOM ECLIPSE --- */
defBadge({
  id: 'qom_eclipse_ribecca', owner: 'QOMEclipse', friend: 'QOMRibecca',
  name: "Ribecca's Bone Guitar Strap", icon: '🦴', color: '#c499f4',
  desc: 'A guitar strap threaded with enchanted skeleton vertebrae that keeps Eclipse grounded during stage dives.',
  stat: lvl => `+${(14 + lvl * 6).toFixed(0)}% Armor · +${(12 + lvl * 5).toFixed(0)}% Lifesteal`,
  effect: "Ribecca's skeletal guitar strap anchors Eclipse during her wildest solos! Taking damage while above 6 Amp stacks redirects 25% of the damage back to the attacker as Magic Damage and grants Eclipse a Keytar Fortify shield (15%+ Max HP). Activating Howling Riff or leaping during Queens of Mischief shatters nearby bones, applying Offbeat to all enemies for 6s and healing Eclipse for 18% Max HP.",
  apply(u, B, lvl) {
    u.flat.defP = (u.flat.defP || 0) + (0.14 + lvl * 0.06);
    u.flat.healRecvP = (u.flat.healRecvP || 0) + (0.12 + lvl * 0.05);
    u.dirty = true;

    B.on(u, 'damaged', ev => {
      const amp = (u.getStatus('qom_amp') || {}).stacks || 0;
      if (amp >= 6 && ev.src && !ev.reflected && ev.amount > 0 && B.t >= (u._qomBoneStrapAt || 0)) {
        u._qomBoneStrapAt = B.t + Math.max(2.5, 4.5 - lvl * 0.3);
        const ref = Math.max(1, Math.round(ev.amount * 0.25));
        B.damage(u, ev.src, ref, { type: 'magic', reflected: true, tag: 'Bone Strap Reflect' });
        B.shield(u, u, u.max.hp * (0.15 + lvl * 0.03), 6.0);
        B.fxSparkle(u.x, u.y - 45, 6, '#c499f4');
      }
    });

    B.on(u, 'cast', ev => {
      if (ev && (ev.key === 'W' || ev.key === 'B')) {
        Sound.play('qom_bone', { vol: .6 });
        B.heal(u, u, u.max.hp * (0.18 + lvl * 0.03), { tag: 'Bone Strap Mend' });
        B.enemiesOf(u).forEach(e => {
          if (!e.alive) return;
          B.applyStatus(u, e, 'qom_offbeat', 6.0);
        });
        B.fxFloatIcon(u.x, u.y - 110, '🦴 BONE STRAP REBOUND', '#c499f4');
      }
    });
  }
});

/* --- QOM RIBECCA --- */
defBadge({
  id: 'qom_ribecca_eclipse', owner: 'QOMRibecca', friend: 'QOMEclipse',
  name: "Eclipse's Overdrive Pedal", icon: '⚡', color: '#be69f6',
  desc: 'A heavily battered guitar overdrive stompbox Eclipse gifted Ribecca to blow the dust off her keytar.',
  stat: lvl => `+${(12 + lvl * 6).toFixed(0)}% Magic Attack · +${(14 + lvl * 5).toFixed(0)}% Shield Power`,
  effect: "Eclipse's fuzz distortion pedal supercharges Ribecca's keytar barriers with overdriven feedback! Whenever Ribecca redirects allied damage or absorbs a blow with Sound Barrier, an Overdrive Feedback shockwave retaliates against the attacker for 65%+ Magic Damage, burns 12 Energy, and applies Armslow for 4s. Activating Skeleton Symphony grants all allies +35% Attack and turns their next attack into an electric splash shockwave.",
  apply(u, B, lvl) {
    u.flat.magP = (u.flat.magP || 0) + (0.12 + lvl * 0.06);
    u.flat.shieldPowP = (u.flat.shieldPowP || 0) + (0.14 + lvl * 0.05);
    u.dirty = true;

    B.on(u, 'damaged', ev => {
      if (ev && ev.src && !ev.reflected && ev.amount > 0 && B.t >= (u._qomOverdriveAt || 0)) {
        u._qomOverdriveAt = B.t + Math.max(1.8, 3.5 - lvl * 0.25);
        Sound.play('qom_riff', { vol: .5 });
        B.damage(u, ev.src, u.st.mag * (0.65 + lvl * 0.15), { type: 'magic', reflected: true, tag: 'Overdrive Feedback' });
        B.energy(ev.src, -12);
        B.applyStatus(u, ev.src, 'armslow', 4.0);
        B.fxSparkle(ev.src.x, ev.src.y - 45, 8, '#be69f6');
      }
    });

    B.on(u, 'cast', ev => {
      if (ev && ev.key === 'W') {
        B.alliesOf(u).forEach(a => {
          if (!a.alive) return;
          B.applyStatus(u, a, 'atkup', 8.0, { val: 0.35 });
          B.applyStatus(u, a, 'haste', 8.0);
        });
        B.fxFloatIcon(u.x, u.y - 110, '⚡ OVERDRIVE SYMPHONY', '#be69f6');
      }
    });
  }
});

defBadge({
  id: 'qom_ribecca_gourdy', owner: 'QOMRibecca', friend: 'QOMGourdy',
  name: "Gourdy's Rhythm Backbone", icon: '🎼', color: '#bdf778',
  desc: 'A heavy metronome plate built into Ribecca’s keytar base that resonates with Gourdy’s rock beats.',
  stat: lvl => `+${(15 + lvl * 6).toFixed(0)}% Max Health · +${(10 + lvl * 4).toFixed(0)}% Damage Reduction`,
  effect: "Gourdy's bass drum heartbeat anchors Ribecca's skeletal form! Ribecca gains permanent immunity to knockbacks. Whenever Gourdy triggers Beat 4 or Ribecca reaches 5 Resonance, all allies receive an Acoustic Barrier (18%+ Max HP) and +25% Move Speed. When Standing Ovation triggers, Gourdy immediately joins in with an explosive stadium roll that Stuns all enemies for 2.5s.",
  apply(u, B, lvl) {
    u.flat.hpP = (u.flat.hpP || 0) + (0.15 + lvl * 0.06);
    u.flat.wardP = (u.flat.wardP || 0) + (0.10 + lvl * 0.04);
    u.immovable = true;
    u.st.kbRes = 1.0;
    u.dirty = true;

    B.on(u, 'statusApplied', ev => {
      if (ev && ev.id === 'qom_standing_guard' && ev.unit === u) {
        Sound.play('qom_crash', { vol: .85 });
        B.enemiesOf(u).forEach(e => {
          if (!e.alive) return;
          B.applyStatus(u, e, 'stun', 2.5);
          B.interrupt(e);
        });
        B.alliesOf(u).forEach(a => {
          B.shield(u, a, u.max.hp * (0.18 + lvl * 0.04), 8.0);
          B.applyStatus(u, a, 'speedup', 8.0);
        });
        B.fxFloatIcon(u.x, u.y - 110, '🎼 RHYTHM BACKBONE', '#bdf778');
      }
    });
  }
});

/* --- QOM SOULVESTER --- */
defBadge({
  id: 'qom_soulvester_connie', owner: 'QOMSoulvester', friend: 'QOMConnie',
  name: "Connie's Ethereal Crest", icon: '👻', color: '#e5c5ff',
  desc: 'A ghostly crest carved onto Soulvester’s shield that allows him to step halfway into the spirit world.',
  stat: lvl => `+${(14 + lvl * 5).toFixed(0)}% Magic Defense · +${(12 + lvl * 5).toFixed(0)}% Evasion`,
  effect: "Connie's spectral blessing allows Soulvester to phase through reality during his chivalric guards! Whenever Soulvester blocks an attack with Perfect Parry or Royal Intervention, he phases into the ethereal plane, gaining +35% Evasion, cleansing all debuffs, and leaving behind a Phantom Decoy. His counterattacks inflict Haunted for 7s, reducing the attacker's accuracy and making them deal 25% less damage to Soulvester.",
  apply(u, B, lvl) {
    u.flat.mdefP = (u.flat.mdefP || 0) + (0.14 + lvl * 0.05);
    u.flat.evaP = (u.flat.evaP || 0) + (0.12 + lvl * 0.05);
    u.dirty = true;

    B.on(u, 'dealDamage', ev => {
      if (ev && (ev.tag === 'Perfect Parry' || ev.tag === 'Knight Counter' || ev.tag === 'Royal Intervention') && ev.target) {
        B.applyStatus(u, ev.target, 'qom_haunted', 7.0);
        B.cleanse(u, 2);
        B.applyStatus(u, u, 'lucky', 4.0);
        B.fxSparkle(u.x, u.y - 45, 6, '#e5c5ff');
      }
    });
  }
});

/* --- QOM CONNIE --- */
defBadge({
  id: 'qom_connie_eclipse', owner: 'QOMConnie', friend: 'QOMEclipse',
  name: "Eclipse's Duet Pick", icon: '🎸', color: '#be69f6',
  desc: 'A heavy tortoiseshell rock guitar pick given by Eclipse for high-gain phantom acoustic solos.',
  stat: lvl => `+${(14 + lvl * 6).toFixed(0)}% Crit Chance · +${(18 + lvl * 7).toFixed(0)}% Crit Damage`,
  effect: "Eclipse's rock lead pick charges Connie's spectral notes with piercing electric distortion! Connie's Critical strikes build 1 Phantom Note and ignore 30% of the target's Magic Defense. When Connie triggers Ghostly Ovation or spends 5 Phantom Notes, Eclipse joins with an electric riff that grants Connie +30% Attack and reflects 30% of all damage taken for 6s.",
  apply(u, B, lvl) {
    u.flat.crit = (u.flat.crit || 0) + (0.14 + lvl * 0.06);
    u.flat.critDmg = (u.flat.critDmg || 0) + (0.18 + lvl * 0.07);
    u.flat.magPen = (u.flat.magPen || 0) + 0.30;
    u.dirty = true;

    B.on(u, 'dealDamage', ev => {
      if (ev && ev.crit && !ev.dot && !ev.reflected) {
        qomConnieNotes(u, B, 1);
      }
    });

    B.on(u, 'cast', ev => {
      if (ev && ev.key === 'W') {
        Sound.play('qom_riff', { vol: .6 });
        B.applyStatus(u, u, 'atkup', 6.0, { val: 0.30 });
        B.applyStatus(u, u, 'ward', 6.0);
        B.fxFloatIcon(u.x, u.y - 110, '🎸 DUET OVERDRIVE', '#be69f6');
      }
    });
  }
});

defBadge({
  id: 'qom_connie_soulvester', owner: 'QOMConnie', friend: 'QOMSoulvester',
  name: "Soulvester's Chivalric Charm", icon: '🛡️', color: '#c9b4ff',
  desc: 'A spectral knightly talisman blessed by Soulvester to shield Connie’s delicate ghostly frame.',
  stat: lvl => `+${(12 + lvl * 5).toFixed(0)}% Max Health · +${(15 + lvl * 6).toFixed(0)}% Evasion`,
  effect: "Soulvester's knightly oath guards Connie even across the ghostly divide! Whenever Connie's Dodge Guard activates or she triggers Untouchable, Soulvester's spectral shield wards her, granting a Chivalric Barrier (22%+ Max HP) and Ward for 5s. If an enemy targets Connie with hard CC, Soulvester counter-slashes them from behind, dealing 140%+ Physical Damage and stunning them for 1.5s.",
  apply(u, B, lvl) {
    u.flat.hpP = (u.flat.hpP || 0) + (0.12 + lvl * 0.05);
    u.flat.evaP = (u.flat.evaP || 0) + (0.15 + lvl * 0.06);
    u.dirty = true;

    B.on(u, 'dodged', () => {
      if (B.t >= (u._connieSoulShieldAt || 0)) {
        u._connieSoulShieldAt = B.t + Math.max(3.0, 6.0 - lvl * 0.4);
        Sound.play('qom_counter', { vol: .5 });
        B.shield(u, u, u.max.hp * (0.22 + lvl * 0.04), 5.0);
        B.applyStatus(u, u, 'ward', 5.0);
        B.fxFloatIcon(u.x, u.y - 110, '🛡️ CHIVALRIC BARRIER', '#c9b4ff');
      }
    });

    B.on(u, 'statusApplied', ev => {
      if (ev && ev.unit === u && ev.src && ev.src.team !== u.team && STATUS[ev.id] && STATUS[ev.id].cc) {
        if (B.t >= (u._connieSoulCounterAt || 0)) {
          u._connieSoulCounterAt = B.t + 6.0;
          Sound.play('qom_counter', { vol: .65 });
          B.damage(u, ev.src, u.st.atk * (1.4 + lvl * 0.25), { type: 'physical', tag: 'Chivalric Retribution' });
          B.applyStatus(u, ev.src, 'stun', 1.5);
          B.cleanse(u, 1);
          B.fxFloatIcon(ev.src.x, ev.src.y - 95, '⚔️ KNIGHT INTERVENTION', '#c9b4ff');
        }
      }
    });
  }
});

defBadge({
  id: 'vee_shelly', owner: 'Vee', friend: 'Shelly',
  name: "Shelly's Amber Broadcast Lens", icon: '🔍', color: '#ffb347',
  desc: "Shelly fitted an amber lens to Vee's camera. The old resin makes flaws in the picture easier to see.",
  stat: lvl => '+' + (6 + lvl * 3) + '% Magic Attack · +' + (3 + lvl * 2) + '% Magic Penetration',
  effect: 'Spotlight On and Audience Surge fire an extra amber beam at the Headline, adding two Signal Interference stacks. Every third Basic Attack against the Headline sends a smaller amber pulse to another enemy.',
  apply(u, B, lvl) {
    u.flat.magP = (u.flat.magP || 0) + .06 + lvl * .03;
    u.flat.magPen = (u.flat.magPen || 0) + .03 + lvl * .02;
    u.dirty = true;
    B.on(u, 'cast', ev => {
      if (!u.alive || (ev.key !== 'W' && ev.key !== 'G')) return;
      const t = B.enemiesOf(u).find(e => e.alive && e.hasStatus('headline'));
      if (!t) return;
      B.damage(u, t, u.st.mag * (.48 + lvl * .06), { type: 'magic', chained: true, tag: 'Amber Broadcast' });
      if (t.alive) B.applyStatus(u, t, 'vee_static', 6, { stacks: 2 });
      B.fxSparkle(t.x, t.y - 40, 9, '#ffb347');
      Sound.play('laser_hit', { vol: .4, throttle: 120 });
    });
    B.on(u, 'basicHit', ev => {
      const t = ev.target;
      if (!t || !t.hasStatus('headline')) return;
      u._amberVeeHits = (u._amberVeeHits || 0) + 1;
      if (u._amberVeeHits % 3 !== 0) return;
      const next = B.enemiesOf(u).find(e => e.alive && e !== t);
      if (!next) return;
      B.damage(u, next, u.st.mag * (.24 + lvl * .04), { type: 'magic', chained: true, tag: 'Amber Pulse' });
      B.fxSparkle(next.x, next.y - 40, 6, '#ffb347');
    });
  }
});

defBadge({
  id: 'cocoa_squirm', owner: 'Cocoa', friend: 'Squirm',
  name: "Squirm's Pressed Book-Ribbon", icon: '🔖', color: '#cba76c',
  desc: "A neat ribbon Squirm pressed inside a favorite book for Cocoa. It smells slightly like vanilla and paper glue.",
  stat: lvl => `+${(12 + lvl * 5).toFixed(0)}% Max HP · +${(10 + lvl * 5).toFixed(0)}% Healing Power`,
  effect: "Squirm's careful reading habits turn Cocoa's delivery into an organized feast! Whenever Cocoa delivers a Bonbon or casts Bonbon Delivery, the recipient gains an Erudite Bookmark Shield (18%+ of Cocoa's Max HP for 8s), dispels 2 debuffs, and gains +25% Attack and +20% Skill Haste. Whenever an ally drops below 40% HP, Squirm's bookmark triggers an emergency chapter break: grants the ally Invulnerability for 1.5s, restores 20% Max HP, and feeds 25 Energy to Cocoa.",
  apply(u, B, lvl) {
    u.flat.hpP = (u.flat.hpP || 0) + (0.12 + lvl * 0.05);
    u.flat.healPowP = (u.flat.healPowP || 0) + (0.10 + lvl * 0.05);
    u.dirty = true;

    B.on(u, 'bonbonDelivered', ev => {
      if (!ev || !ev.target || !ev.target.alive) return;
      Sound.play('get_rare', { vol: 0.42 });
      B.shield(u, ev.target, u.max.hp * (0.18 + lvl * 0.04), 8);
      B.cleanse(ev.target, 2);
      B.applyStatus(u, ev.target, 'atkup', 6, { val: 0.25 });
      B.applyStatus(u, ev.target, 'haste', 6, { stacks: 2 });
      B.fxSparkle(ev.target.x, ev.target.y - 45, 8, '#cba76c');
      B.fxFloatIcon(ev.target.x, ev.target.y - 100, '🔖 BOOKMARK SHIELD', '#cba76c');
    });

    B.on(u, 'allyLow', a => {
      if (!a.alive || a.hpPct > 0.40) return;
      if (B.t < (u._squirmRibbonAt || 0)) return;
      u._squirmRibbonAt = B.t + Math.max(8.0, 14.0 - lvl * 1.0);
      Sound.play('get_food', { vol: 0.55 });
      B.applyStatus(u, a, 'invulnerable', 1.5);
      B.heal(u, a, u.max.hp * (0.20 + lvl * 0.04), { tag: 'Emergency Chapter' });
      B.energy(u, 25);
      B.cleanse(a, 99);
      B.fxSparkle(a.x, a.y - 45, 12, '#cba76c');
      B.fxFloatIcon(a.x, a.y - 110, '🔖 CHAPTER BREAK!', '#cba76c');
    });
  }
});

defBadge({
  id: 'glisten_goob', owner: 'Glisten', friend: 'Goob',
  name: "Goob's Plush Mirror Cozy", icon: '🧸', color: '#ffb3d9',
  desc: "A hand-knitted, ultra-soft plush sleeve Goob crafted for Glisten's golden handle. Glisten insists he only keeps it to avoid fingerprints, but he secretly treasures how soft and safe it feels.",
  stat: lvl => `+${(12 + lvl * 6).toFixed(0)}% Shield Power · +${(10 + lvl * 5).toFixed(0)}% Max HP`,
  effect: "Goob's plush craftwork cushions Glisten's fragile glass against recoil and hard landings! Glisten is completely immune to Dizzy. Whenever Glisten casts Reflection! or activates Right on Time, Goob's yarn wrap cushions the impact: Glisten and his teleport target gain a Plush Hug Shield (18%+ Max HP for 7s), Ward, and +30% Damage Reduction for 4s. In addition, when Glisten's Perfect Reflection counters an attack, a soft yarn ball entangles and taunts the attacker for 2.5s, healing the lowest-HP ally for 10%+ Max HP.",
  apply(u, B, lvl) {
    u.flat.shieldPowP = (u.flat.shieldPowP || 0) + (0.12 + lvl * 0.06);
    u.flat.hpP = (u.flat.hpP || 0) + (0.10 + lvl * 0.05);
    u.dirty = true;

    // Prevent / cleanse Dizzy on Glisten (soft landings)
    B.every(u, 0.15, () => {
      if (!u.alive) return;
      if (u.hasStatus('glisten_dizzy')) {
        B.removeStatus(u, 'glisten_dizzy');
        B.shield(u, u, u.max.hp * (0.16 + lvl * 0.04), 6);
        B.applyStatus(u, u, 'ward', 4);
        B.fxFloatIcon(u.x, u.y - 100, '🧸 SOFT LANDING!', '#ffb3d9');
      }
    });

    // When Glisten rescues or jumps to an ally (W or R)
    B.on(u, 'cast', () => {
      if (!u.alive) return;
      const partner = glistenPartner(u, B);
      if (!partner) return;
      const shieldAmt = u.max.hp * (0.18 + lvl * 0.04);
      B.shield(u, partner, shieldAmt, 7);
      B.applyStatus(u, partner, 'ward', 4);
      B.applyStatus(u, partner, 'defup', 4, { val: 0.30 });
      B.shield(u, u, shieldAmt * 0.6, 7);
      B.applyStatus(u, u, 'ward', 4);
      B.fxSparkle(partner.x, partner.y - 45, 12, '#ffb3d9');
      B.fxFloatIcon(partner.x, partner.y - 110, '🧸 PLUSH HUG SHIELD', '#ffb3d9');
    });

    // When Perfect Reflection counters damage
    B.on(u, 'dealDamage', ev => {
      if (!ev || ev.tag !== 'Perfect Reflection' || !ev.target || !ev.target.alive) return;
      if (B.t < (u._goobPlushCounterAt || 0)) return;
      u._goobPlushCounterAt = B.t + 1.2;
      B.applyStatus(u, ev.target, 'slow', 2.5, { val: 0.45 });
      B.applyStatus(u, ev.target, 'taunt', 2, { src: u });
      const lowest = B.lowestHp(B.alliesOf(u));
      if (lowest && lowest.alive) {
        B.heal(u, lowest, u.max.hp * (0.10 + lvl * 0.02), { tag: 'Plush Fluff' });
        B.cleanse(lowest, 1);
        B.fxFloatIcon(lowest.x, lowest.y - 95, '🧸 HEALING FLUFF', '#ffb3d9');
      }
      B.fxFloatIcon(ev.target.x, ev.target.y - 100, '🧶 ENTANGLED', '#ffb3d9');
    });
  }
});

defBadge({
  id: 'glisten_vee', owner: 'Glisten', friend: 'Vee',
  name: "Vee's Studio Broadcast Filter", icon: '📺', color: '#7be0ff',
  desc: "A polarized broadcast-grade studio lens Vee calibrated for Glisten. She claimed his natural glare was ruining her camera exposure, but it focuses his reflections into pure primetime broadcast lasers.",
  stat: lvl => `+${(12 + lvl * 6).toFixed(0)}% Magic Attack · +${(10 + lvl * 5).toFixed(0)}% Skill Haste`,
  effect: "Vee's television optics turn Glisten's mirror into a high-powered studio spotlight! Glisten's 🪞 Audience is permanently Exposed (taking 20%+ Magic Damage) and has their Attack Speed slowed by 25%. When Glisten casts Prismatic Close-Up, an overhead Studio Spotlight strikes the target for 90%+ Magic Damage, Shocks all enemies hit for 4s, and steals 20 Energy from the Audience to grant to all allies. When Perfect Reflection counters, an electrostatic burst dispels 1 buff, Silences the attacker for 1.5s, and grants Glisten +15% Magic Attack (stacks 3x).",
  apply(u, B, lvl) {
    u.flat.magP = (u.flat.magP || 0) + (0.12 + lvl * 0.06);
    u.flat.cdr = (u.flat.cdr || 0) + (0.10 + lvl * 0.05);
    u.dirty = true;

    // Audience Exposure & debuff
    B.every(u, 0.4, () => {
      if (!u.alive) return;
      const aud = glistenAudience(u);
      if (!aud || !aud.alive) return;
      if (!aud.hasStatus('vee_exposed')) {
        B.applyStatus(u, aud, 'exposed', 999, { val: 0.20 + lvl * 0.04 });
        B.applyStatus(u, aud, 'vee_exposed', 999);
        B.applyStatus(u, aud, 'slow', 999, { val: 0.25 });
        B.fxFloatIcon(aud.x, aud.y - 115, '🔴 PRIMETIME AUDIENCE', '#7be0ff');
      }
    });

    // When Prismatic Close-Up deals damage: fire Studio Spotlight
    B.on(u, 'dealDamage', ev => {
      if (!ev || ev.tag !== 'Prismatic Close-Up' || !ev.target || !ev.target.alive) return;
      if (B.t < (u._glistenVeeSpotlightAt || 0)) return;
      u._glistenVeeSpotlightAt = B.t + 3.5;
      Sound.play('beam_fire', { vol: 0.5 });
      B.damage(u, ev.target, u.st.mag * (0.90 + lvl * 0.25), { type: 'magic', tag: 'Studio Spotlight' });
      B.applyStatus(u, ev.target, 'shock', 4);
      B.fxRing(ev.target.x, ev.target.y - 30, 150, '#7be0ff', 0.55);
      B.fxFloatIcon(ev.target.x, ev.target.y - 120, '💡 PRIMETIME SPOTLIGHT!', '#7be0ff');
      const aud = glistenAudience(u);
      if (aud && aud.alive) {
        B.energy(aud, -20);
        B.alliesOf(u).forEach(a => B.energy(a, 15 + lvl * 5));
      }
    });

    // When Perfect Reflection counters: electrostatic feedback
    B.on(u, 'dealDamage', ev => {
      if (!ev || ev.tag !== 'Perfect Reflection' || !ev.target || !ev.target.alive) return;
      if (typeof B.dispel === 'function') B.dispel(ev.target, 1);
      else if (ev.target.statuses) {
        const buff = ev.target.statuses.find(s => STATUS[s.id] && STATUS[s.id].kind === 'buff');
        if (buff) B.removeStatus(ev.target, buff.id);
      }
      B.applyStatus(u, ev.target, 'silence', 1.5);
      B.applyStatus(u, u, 'magup', 6, { val: 0.15, maxStacks: 3 });
      B.fxFloatIcon(u.x, u.y - 105, '📺 OVERCHARGED!', '#7be0ff');
    });
  }
});
