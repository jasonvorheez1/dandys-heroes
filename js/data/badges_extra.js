/* badges_extra.js - badges for the additional Friendship Campaigns. */
'use strict';

defBadge({
  id: 'cocoa_rudie', owner: 'Cocoa', friend: 'Rudie',
  name: "Rudie's Saved Bonbon Bag", icon: '👜', color: '#f0ae78',
  desc: 'A little supply bag Cocoa kept because Rudie finally admitted that saving things can help.',
  stat: lvl => `+${(lvl * 2).toFixed(0)}% Healing Power`,
  effect: 'Cocoa gets a small Healing Power boost. When she gives the team a BonBon, the lowest-HP ally is cleansed and also receives a small Shield.',
  apply(u, B, lvl) {
    u.flat.healPowP = (u.flat.healPowP || 0) + lvl * .02;
    u.dirty = true;
    B.on(u, 'cast', ev => {
      if (ev.key !== 'G') return;
      const a = B.lowestHp(B.alliesOf(u));
      if (a) { B.cleanse(a, 1); B.shield(u, a, a.max.hp * (.025 + lvl * .008), 3 + lvl * .35); }
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
  stat: lvl => `+${(lvl * 2).toFixed(0)}% Accuracy`,
  effect: 'Brusha gains Accuracy. Her team buffs also briefly grant Cleanstep and Accuracy Up, helping allies cross the battlefield safely and hit evasive targets.',
  apply(u, B, lvl) {
    u.flat.accP = (u.flat.accP || 0) + lvl * .02;
    u.dirty = true;
    B.on(u, 'cast', ev => {
      if (!['W', 'G'].includes(ev.key)) return;
      B.alliesOf(u).forEach(a => { B.applyStatus(u, a, 'cleanstep', 2.5 + lvl * .35); B.applyStatus(u, a, 'accup', 2.5 + lvl * .35); });
    });
  }
});

defBadge({
  id: 'tisha_blot', owner: 'Tisha', friend: 'Blot',
  name: "Blot's Squeaky Wheel", icon: '🛞', color: '#9f8bff',
  desc: 'A repaired cart wheel that still squeaks, because working is more important than being quiet.',
  stat: lvl => `+${(lvl * 2).toFixed(0)}% Control Duration`,
  effect: 'Tisha gains Control Duration. The first enemy she makes Misplaced periodically gives her Energy.',
  apply(u, B, lvl) {
    u.ccDurBonus = (u.ccDurBonus || 0) + lvl * .02;
    u.dirty = true;
    B.on(u, 'statusApplied', ev => {
      if (ev.src !== u || ev.id !== 'misplaced' || !ev.unit || ev.unit.team === u.team) return;
      const now = B.t;
      if (now < (u._squeakyWheelAt || 0)) return;
      u._squeakyWheelAt = now + Math.max(3.5, 6 - lvl * .35);
      B.energy(u, 2 + lvl);
      B.fxFloatIcon(u.x, u.y - 105, '🛞', '#9f8bff');
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
  name: "Scraps' Craft Label", icon: '🎨', color: '#ffb56b',
  desc: 'A tiny label Scraps made for Ginger’s decorated work: COOKIE ARTIST.',
  stat: lvl => `+${(lvl * 2.5).toFixed(1)}% Healing Power`,
  effect: 'Ginger’s healing applies Attack Up to the ally she heals and restores a little Energy. Stronger badges grant more Attack Up stacks.',
  apply(u, B, lvl) {
    u.flat.healPowP = (u.flat.healPowP || 0) + lvl * .025;
    u.dirty = true;
    u._craftLabelAt = {};
    B.on(u, 'healDone', ev => {
      const a = ev && ev.target;
      if (!a || a.team !== u.team || !a.alive) return;
      const last = u._craftLabelAt[a.uid] || 0;
      if (B.t < last) return;
      u._craftLabelAt[a.uid] = B.t + Math.max(1.8, 3.4 - lvl * .22);
      B.applyStatus(u, a, 'atkup', 6 + lvl * .45, { stacks: 1 + (lvl >= 3 ? 1 : 0) });
      B.energy(u, 1 + Math.floor(lvl / 2));
      B.fxFloatIcon(a.x, a.y - 100, '🎨', '#ffb56b');
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
      if (!ev || ev.src !== u || !ev.unit || ev.unit.team === u.team) return;
      if (!['corrode', 'slow', 'blind', 'sticky', 'silence'].includes(ev.id)) return;
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
  stat: lvl => `+${(lvl * 2.5).toFixed(1)}% Shield Power`,
  effect: 'When Brightney blinds an enemy, her reading light grants the team Focus and a burst of Energy. Higher Badge levels extend Focus and increase the Energy burst.',
  apply(u, B, lvl) {
    u.flat.shieldPowP = (u.flat.shieldPowP || 0) + lvl * .025;
    u.dirty = true;
    u._chapterMarkerAt = 0;
    B.on(u, 'statusApplied', ev => {
      if (!ev || ev.src !== u || ev.id !== 'blind' || !ev.unit || ev.unit.team === u.team) return;
      if (B.t < u._chapterMarkerAt) return;
      u._chapterMarkerAt = B.t + Math.max(3.5, 6.5 - lvl * .45);
      const duration = 3 + lvl * .45;
      B.alliesOf(u).forEach(a => {
        B.applyStatus(u, a, 'focus', duration);
        B.energy(a, 2 + lvl * 2);
      });
      B.fxFloatIcon(u.x, u.y - 108, '🔖', '#fff0a8');
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
  stat: lvl => `+${(lvl * 2).toFixed(0)}% Skill Haste`,
  effect: 'When Teagan Crowd Controls an enemy, she helps the most injured ally with a small Shield. Rodger does not need to be on the team.',
  apply(u, B, lvl) {
    u.flat.cdr = (u.flat.cdr || 0) + lvl * .02;
    u.dirty = true;
    u._openDoorAt = 0;
    B.on(u, 'statusApplied', ev => {
      if (!ev || ev.src !== u || !ev.unit || ev.unit.team === u.team) return;
      if (!STATUS[ev.id] || !STATUS[ev.id].cc || B.t < u._openDoorAt) return;
      const ally = B.lowestHp(B.alliesOf(u));
      if (!ally) return;
      u._openDoorAt = B.t + Math.max(3.5, 6 - lvl * .4);
      B.shield(u, ally, u.max.hp * (.025 + lvl * .006), 4 + lvl * .35);
      B.fxFloatIcon(ally.x, ally.y - 105, '🍵', '#b8d9b2');
    });
  }
});

defBadge({
  id: 'rnd_rudie', owner: 'RnD', friend: 'Rudie',
  name: "Rudie's Curtain Cue", icon: '🎭', color: '#d64b4b',
  desc: 'A cue card Rudie decorated for his own scene, leaving the rest of the script intact.',
  stat: lvl => `+${(lvl * 2).toFixed(0)}% Attack Speed`,
  effect: 'Razzle & Dazzle gain Attack Speed. Completing a full Performance triggers an Encore cue: Energy and Inspire briefly reward both sides working together.',
  apply(u, B, lvl) {
    u.flat.aspdP = (u.flat.aspdP || 0) + lvl * .02;
    u.dirty = true;
    u._curtainCueAt = -Infinity;
    B.on(u, 'statusApplied', ev => {
      if (!ev || ev.src !== u || ev.id !== 'performance' || (u.rndPerformance || 0) < (u.rndPerfMax || 4)) return;
      if (B.t - u._curtainCueAt < Math.max(4.5, 8 - lvl * .45)) return;
      u._curtainCueAt = B.t;
      B.applyStatus(u, u, 'inspire', 3 + lvl * .35);
      B.energy(u, 4 + lvl * 2);
      B.fxFloatIcon(u.x, u.y - 108, '🎭', '#d64b4b');
    });
  }
});

defBadge({
  id: 'gigi_connie', owner: 'Gigi', friend: 'Connie',
  name: "Connie's Chaos Charm", icon: '👻', color: '#ff9bd2',
  desc: 'A ghostly charm Connie slipped into Gigi’s collection, ready to help whenever a prank goes just a little too far.',
  stat: lvl => `+${(lvl * 2).toFixed(0)}% Skill Haste`,
  effect: 'If two spins in a row award the same prize, the badge gives Gigi’s most injured ally a temporary shield. This can trigger again after a short cooldown; Connie does not need to be on the team.',
  apply(u, B, lvl) {
    u.flat.cdr = (u.flat.cdr || 0) + lvl * .02;
    u.dirty = true;
    u._chaosCharmAt = 0;
    B.on(u, 'gigiPrize', prize => {
      if (!prize || prize.combo < 2 || B.t < u._chaosCharmAt) return;
      const ally = B.lowestHp(B.alliesOf(u));
      if (!ally) return;
      u._chaosCharmAt = B.t + Math.max(3, 5.5 - lvl * .4);
      B.shield(u, ally, ally.max.hp * (.025 + lvl * .012), 4 + lvl * .35);
      B.fxFloatIcon(ally.x, ally.y - 105, '👻', '#ff9bd2');
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
