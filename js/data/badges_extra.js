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
  stat: lvl => `+${(lvl * 2.5).toFixed(1)}% Attack Speed`,
  effect: 'Cocoa gains Attack Speed. Whenever a teammate eats one of her BonBons, they gain Attack Up and Speed Up. Cocoa can eat her own serving, turning the delivery into a damage-and-tempo boost for herself too.',
  apply(u, B, lvl) {
    u.flat.aspdP = (u.flat.aspdP || 0) + lvl * .025;
    u.dirty = true;
    B.on(u, 'bonbonDelivered', ev => {
      const a = ev && ev.target;
      if (!a || a.team !== u.team || !a.alive) return;
      const duration = 4.5 + lvl * .5;
      const stacks = 1 + (lvl >= 4 ? 1 : 0);
      B.applyStatus(u, a, 'atkup', duration, { stacks });
      B.applyStatus(u, a, 'speedup', duration, { stacks });
      B.fxFloatIcon(a.x, a.y - 105, '⚔️', '#d9b58d');
    });
  }
});

defBadge({
  id: 'qom_soulvester_gourdy', owner: 'QOMSoulvester', friend: 'QOMGourdy',
  name: "Gourdy's Encore Crest", icon: '🎼', color: '#bd82e8',
  desc: 'A crest Gourdy added to Soulvester’s armor, timed to the final beat of their new song.',
  stat: lvl => `+${(lvl * 2).toFixed(0)}% Armor`,
  effect: 'When Soulvester dodges an enemy Skill, Gourdy’s crest shields the most injured ally. This has a short cooldown; Gourdy does not need to be on the team.',
  apply(u, B, lvl) {
    u.flat.defP = (u.flat.defP || 0) + lvl * .02;
    u.dirty = true;
    u._qomEncoreCrestAt = -Infinity;
    B.on(u, 'dodged', ev => {
      if (!ev || !ev.src || ev.src.team === u.team || B.t < u._qomEncoreCrestAt) return;
      u._qomEncoreCrestAt = B.t + Math.max(3, 5.5 - lvl * .35);
      const ally = B.lowestHp(B.alliesOf(u));
      if (!ally) return;
      B.shield(u, ally, ally.max.hp * (.03 + lvl * .008), 4 + lvl * .3);
      B.fxFloatIcon(ally.x, ally.y - 105, '🎼', '#bd82e8');
    });
  }
});

defBadge({
  id: 'kairi_cocoa', owner: 'Kairi', friend: 'Cocoa',
  name: "Cocoa's Heartful Wayfinder", icon: '🌸', color: '#ffd0ed',
  desc: 'A small wayfinder Cocoa gave Kairi so she would remember that a heart can find its way back to the people it loves.',
  stat: lvl => `+${(lvl * 2).toFixed(0)}% Energy Generation`,
  effect: 'Kairi’s Shields and light marks create a Heart Connection. Connected allies become Inspired and regain Energy. If a connected ally falls into danger, Kairi sends them a protective Shield and another burst of Energy.',
  apply(u, B, lvl) {
    u.flat.energyGen = (u.flat.energyGen || 0) + lvl * .02;
    u.dirty = true;
    u._kairiCocoaLinkAt = {};
    u._kairiCocoaRescueAt = {};
    const connect = a => {
      if (!a || a.team !== u.team || !a.alive) return;
      const uid = a.uid || a.id;
      a.kairiCocoaLinkUntil = B.t + 5 + lvl * .45;
      if (B.t < (u._kairiCocoaLinkAt[uid] || 0)) return;
      u._kairiCocoaLinkAt[uid] = B.t + Math.max(2.1, 3.4 - lvl * .18);
      B.applyStatus(u, a, 'inspired', 3.5 + lvl * .4);
      B.energy(a, 2 + lvl);
      B.fxFloatIcon(a.x, a.y - 105, '🌸', '#ffd0ed');
    };
    B.on(u, 'shieldDone', ev => connect(ev && ev.target));
    B.on(u, 'statusApplied', ev => {
      if (!ev || ev.src !== u || ev.id !== 'gleam' || !ev.unit || ev.unit.team === u.team) return;
      connect(B.lowestHp(B.alliesOf(u)));
    });
    B.on(u, 'allyLow', a => {
      if (!a || !a.alive || B.t > (a.kairiCocoaLinkUntil || 0)) return;
      const uid = a.uid || a.id;
      if (B.t < (u._kairiCocoaRescueAt[uid] || 0)) return;
      u._kairiCocoaRescueAt[uid] = B.t + Math.max(4.5, 7 - lvl * .35);
      B.shield(u, a, u.max.hp * (.018 + lvl * .003), 3 + lvl * .3);
      B.energy(a, 4 + lvl * 2);
      B.fxRing(a.x, a.y - 40, 66, '#ffd0ed', .55);
    });
  }
});

defBadge({
  id: 'astro_pebble', owner: 'Astro', friend: 'Pebble',
  name: "Pebble's Starlit Tag", icon: '🐾', color: '#ffd166',
  desc: 'A little tag Pebble wears proudly, kept close enough to help Astro find the way back through the dark.',
  stat: lvl => `+${(lvl * 2.5).toFixed(1)}% Healing Power`,
  effect: 'Astro’s healing and Shields create a Starlit Connection. Connected allies become Inspired and regain Energy. If a connected ally falls into danger, Astro gives them a protective Ward and another burst of Energy.',
  apply(u, B, lvl) {
    u.flat.healPowP = (u.flat.healPowP || 0) + lvl * .025;
    u.dirty = true;
    u._astroDandyLinkAt = {};
    u._astroDandyRescueAt = {};
    const connect = a => {
      if (!a || a.team !== u.team || !a.alive) return;
      const uid = a.uid || a.id;
      a._astroDandyLinkUntil = B.t + 5 + lvl * .45;
      if (B.t < (u._astroDandyLinkAt[uid] || 0)) return;
      u._astroDandyLinkAt[uid] = B.t + Math.max(2.1, 3.4 - lvl * .18);
      B.applyStatus(u, a, 'inspired', 3.5 + lvl * .4);
      B.energy(a, 2 + lvl);
      B.fxFloatIcon(a.x, a.y - 105, '🐾', '#ffd166');
    };
    B.on(u, 'healDone', ev => connect(ev && ev.target));
    B.on(u, 'shieldDone', ev => connect(ev && ev.target));
    B.on(u, 'allyLow', a => {
      if (!a || !a.alive || B.t > (a._astroDandyLinkUntil || 0)) return;
      const uid = a.uid || a.id;
      if (B.t < (u._astroDandyRescueAt[uid] || 0)) return;
      u._astroDandyRescueAt[uid] = B.t + Math.max(4.5, 7 - lvl * .35);
      B.applyStatus(u, a, 'ward', 2.5 + lvl * .3);
      B.energy(a, 4 + lvl * 2);
      B.fxRing(a.x, a.y - 40, 66, '#ffd166', .55);
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
  stat: lvl => `+${(lvl * 2.5).toFixed(1)}% Healing Received`,
  effect: 'Bobette’s shields give protected allies Sugar Rush and a small Attack boost, turning her careful protection into shared support.',
  apply(u, B, lvl) {
    u.flat.healRecv8 = (u.flat.healRecv8 || 0) + lvl * .025;
    u.dirty = true;
    B.on(u, 'shieldDone', ev => {
      const a = ev && ev.target;
      if (!a || a.team !== u.team || !a.alive) return;
      B.applyStatus(u, a, 'sugarrush', 5 + lvl * .45);
      B.applyStatus(u, a, 'atkup', 5 + lvl * .4, { stacks: 1 + (lvl >= 4 ? 1 : 0) });
      B.fxFloatIcon(a.x, a.y - 100, '🍬', '#f0ae78');
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
  stat: lvl => `+${(lvl * 2).toFixed(0)}% Magic Attack`,
  effect: 'Blot’s first control effect on each enemy creates a Masterpiece mark, briefly Exposing them and restoring Blot’s Energy. Higher Badge levels strengthen the mark and the Energy return.',
  apply(u, B, lvl) {
    u.flat.magP = (u.flat.magP || 0) + lvl * .02;
    u.dirty = true;
    u._masterpieceMarks = Object.create(null);
    B.on(u, 'statusApplied', ev => {
      if (!ev || (ev.src !== u && (!ev.src || ev.src.owner !== u)) || !ev.unit || ev.unit.team === u.team) return;
      if (!['corrode', 'slow', 'blind', 'sticky', 'silence', 'taunt'].includes(ev.id)) return;
      const key = ev.unit.uid || ev.unit.id;
      if (u._masterpieceMarks[key]) return;
      u._masterpieceMarks[key] = true;
      B.applyStatus(u, ev.unit, 'exposed', 2.5 + lvl * .35, { stacks: 1 + (lvl >= 4 ? 1 : 0) });
      B.energy(u, 3 + lvl * 2);
      B.fxFloatIcon(ev.unit.x, ev.unit.y - 105, '🖋️', '#8f6bff');
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
  stat: lvl => `+${(lvl * 2).toFixed(0)}% Accuracy`,
  effect: 'Rodger gains Accuracy. When an ally Crowd Controls an enemy Rodger has Investigated, he gains Energy and Haste, as if the whole team had found a new lead.',
  apply(u, B, lvl) {
    u.flat.accP = (u.flat.accP || 0) + lvl * .02;
    u.dirty = true;
    u._juniorCaseAt = {};
    B.on(u, 'statusApplied', ev => {
      if (!ev || !ev.unit || ev.unit.team === u.team || !ev.src || ev.src.team !== u.team) return;
      if (ev.id === 'investigated' && ev.src === u) return;
      if (!STATUS[ev.id] || !STATUS[ev.id].cc || !ev.unit.hasStatus('investigated')) return;
      const key = ev.unit.uid || ev.unit.id;
      if (B.t < (u._juniorCaseAt[key] || 0)) return;
      u._juniorCaseAt[key] = B.t + Math.max(3.2, 5.8 - lvl * .35);
      B.energy(u, 4 + lvl * 2);
      B.applyStatus(u, u, 'haste', 2 + lvl * .3);
      B.fxFloatIcon(u.x, u.y - 105, '🕵️', '#8fb4ff');
    });
  }
});

defBadge({
  id: 'goob_waxwell', owner: 'Goob', friend: 'Waxwell',
  name: "Waxwell's Safe Wick", icon: '🕯️', color: '#f3bd68',
  desc: 'A little wick Goob kept close, just in case Waxwell needed a light—or someone to stay beside him.',
  stat: lvl => `+${(lvl * 2.5).toFixed(1)}% Healing Power`,
  effect: 'Goob gains Healing Power. When he creates a Hug Line, the connected ally gains Ward and Energy, turning a rescue into a safer place to stand.',
  apply(u, B, lvl) {
    u.flat.healPowP = (u.flat.healPowP || 0) + lvl * .025;
    u.dirty = true;
    u._safeWickAt = {};
    B.on(u, 'statusApplied', ev => {
      if (!ev || ev.src !== u || ev.id !== 'hugline' || !ev.unit || ev.unit.team !== u.team) return;
      const key = ev.unit.uid || ev.unit.id;
      if (B.t < (u._safeWickAt[key] || 0)) return;
      u._safeWickAt[key] = B.t + Math.max(3.5, 6.5 - lvl * .4);
      B.applyStatus(u, ev.unit, 'ward', 2.5 + lvl * .35);
      B.energy(ev.unit, 2 + lvl * 2);
      B.fxFloatIcon(ev.unit.x, ev.unit.y - 105, '🕯️', '#f3bd68');
    });
  }
});

defBadge({
  id: 'gourdy_connie', owner: 'Gourdy', friend: 'Connie',
  name: "Connie's Honest Treat", icon: '🎃', color: '#ff9d4d',
  desc: 'A pumpkin treat Connie approved only after Gourdy stopped trying to carry everyone at once.',
  stat: lvl => `+${(lvl * 4).toFixed(0)}% Healing Power`,
  effect: 'Gourdy gains Healing Power. Whenever he gives an ally a Treat, it also heals and shields them, restores Energy, grants Ward, and cleanses debuffs. Each ally can receive this bonus once every few seconds.',
  apply(u, B, lvl) {
    u.flat.healPowP = (u.flat.healPowP || 0) + lvl * .04;
    u.dirty = true;
    u._honestTreatAt = {};
    B.on(u, 'gourdyTreat', ev => {
      const ally = ev && ev.ally;
      if (!ally || ally.team !== u.team || !ally.alive) return;
      const key = ally.uid || ally.id;
      if (B.t < (u._honestTreatAt[key] || 0)) return;
      u._honestTreatAt[key] = B.t + Math.max(2.4, 4.8 - lvl * .45);
      B.heal(u, ally, ally.max.hp * (.04 + lvl * .024), { tag: 'Connie Approved Treat' });
      B.shield(u, ally, ally.max.hp * (.025 + lvl * .02), 5 + lvl * .4);
      B.cleanse(ally, 1 + Math.floor(lvl / 3));
      B.applyStatus(u, ally, 'ward', 3 + lvl * .5);
      B.energy(ally, 2 + lvl);
      B.fxFloatIcon(ally.x, ally.y - 105, '🎃', '#ff9d4d');
    });
  }
});

defBadge({
  id: 'qom_eclipse_connie', owner: 'QOMEclipse', friend: 'QOMConnie',
  name: "Connie's Crescent Pick",
  icon: '🌙', image: './uploads/image-78.png', color: '#b49aff',
  desc: 'A crescent-moon pick Connie made for Eclipse, with a little ghostly flourish worked into the edge.',
  stat: lvl => `+${(lvl * 2).toFixed(0)}% Attack Speed`,
  effect: 'Eclipse gains Amplification when her Skills hit, once every few seconds. Connie’s badge works with Eclipse in any team.',
  apply(u, B, lvl) {
    u.flat.aspdP = (u.flat.aspdP || 0) + lvl * .02;
    u.dirty = true;
    u._connieCrescentAmpAt = 0;
    B.on(u, 'dealDamage', ev => {
      const target = ev && ev.target;
      if (!target || target.team === u.team || ev.basic || ev.dot) return;
      if (B.t < u._connieCrescentAmpAt) return;
      const amp = u.getStatus('qom_amp');
      const cap = u.rarity >= 5 ? 15 : 10;
      if (amp && amp.stacks >= cap) return;
      u._connieCrescentAmpAt = B.t + Math.max(3.5, 6 - lvl * .4);
      B.applyStatus(u, u, 'qom_amp', 999, { stacks: 1 });
      B.fxFloatIcon(u.x, u.y - 106, '🌙', '#b49aff');
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
  stat: lvl => `+${(lvl * 2).toFixed(0)}% Healing Power`,
  effect: 'At the start of each wave, Phantasia grants all allies 4 seconds of debuff immunity. The immunity duration is fixed; Healing Power scales with Badge level.',
  apply(u, B, lvl) {
    u.flat.healPowP = (u.flat.healPowP || 0) + lvl * .02;
    u.dirty = true;
    B.after(.24, () => {
      if (!u.alive) return;
      const until = B.t + 4;
      B.alliesOf(u).forEach(a => {
        B.applyStatus(u, a, 'ccimmune', 4);
        const guard = (id, d) => {
          if (B.t >= until) {
            a.guards = (a.guards || []).filter(g => g !== guard);
            return false;
          }
          if (!d || d.kind !== 'debuff') return false;
          B.fxFloatIcon(a.x, a.y - 92, '🌟', '#efb8ff');
          return true;
        };
        a.guards = a.guards || [];
        a.guards.push(guard);
      });
      B.fxRing(u.x, u.y - 42, 300, '#efb8ff', .48);
    });
  }
});
