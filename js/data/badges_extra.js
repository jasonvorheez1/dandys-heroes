/* badges_extra.js - badges for the additional Friendship Campaigns. */
'use strict';

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
  desc: 'A few of Rodger’s quiet observations, kept by Teagan as a reminder that he has found a place at her table.',
  stat: lvl => `+${(12 + lvl * 6).toFixed(0)}% Skill Haste · +${(10 + lvl * 5).toFixed(0)}% Magic Attack`,
  effect: "Rodger's forensic dossiers turn Teagan's polite parlor rules into inescapable traps! Whenever Teagan Silences, Saps, or applies Etiquette to an enemy, Rodger marks them as Investigated: they lose 25 Energy, suffer -30% Magic Defense, and take 30% increased damage from all sources for 6s. In addition, when Teagan casts Tea Time, Rodger drops a Classified Briefing that gives the most injured ally a Tea-Service Shield worth 24%+ Max HP and +30% Skill Haste for 6s.",
  apply(u, B, lvl) {
    u.flat.cdr = (u.flat.cdr || 0) + (0.12 + lvl * 0.06);
    u.flat.magP = (u.flat.magP || 0) + (0.10 + lvl * 0.05);
    u.dirty = true;
    u._openDoorAt = 0;

    B.on(u, 'statusApplied', ev => {
      if (!ev || ev.src !== u || !ev.unit || ev.unit.team === u.team || !ev.unit.alive) return;
      if (!['silence', 'sap', 'etiquette', 'buffsealed', 'teagandistracted'].includes(ev.id)) return;
      const target = ev.unit;
      const now = B.t;
      if (now < (target._rodgerInvestigatedAt || 0)) return;
      target._rodgerInvestigatedAt = now + 4.0;
      B.energy(target, -(20 + lvl * 3));
      B.applyStatus(u, target, 'magdown', 5 + lvl * .4, { val: 0.30 });
      B.applyStatus(u, target, 'weaken', 5 + lvl * .4);
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
