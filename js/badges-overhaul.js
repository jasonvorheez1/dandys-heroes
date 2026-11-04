/* badges-overhaul.js — Comprehensive Friendship Badges Overhaul & Expansion
   Enhances existing friendship badges with Wave Start triggers, Opening Power Surges,
   DPS amplification / shredding, Buff & Debuff blocking, and Team Stat Sharing.
   Also adds dedicated immediate friendship badges for Kris, Ralsei, Tasque Manager,
   Flowery, and Chell. */
'use strict';

(() => {
  if (typeof BADGES === 'undefined') return;

  // Helper to ensure an effect runs both at battle start and on subsequent wave starts
  const onWaveAndStart = (u, B, fn) => {
    B.after(0.12, () => { if (u.alive) fn(); });
    B.on(u, 'waveStart', () => { if (u.alive) fn(); });
  };

  // Helper to share a percentage of wearer's stat to living allies
  const applyTeamStatShare = (u, B, statName, fraction) => {
    B.alliesOf(u).filter(a => a.alive && a !== u).forEach(a => {
      B.applyStatus(u, a, 'statshare', 999, { val: fraction });
    });
  };

  /* =========================================================================
     1. BOXTEN — Poppy's Lucky Charm (poppy_boxten)
     ========================================================================= */
  if (BADGES.poppy_boxten) {
    Object.assign(BADGES.poppy_boxten, {
      stat: lvl => `+${(14 + lvl * 6).toFixed(0)}% Skill Haste · +${(12 + lvl * 5).toFixed(0)}% Evasion · +${(10 + lvl * 4).toFixed(0)}% Max HP`,
      effect: "Poppy's lucky charm fills Boxten's melody with clockwork perfection! At wave start and on Music Box Melody: cleanses all debuffs from the team, grants 4s CC Immunity, 30 Energy, and shares 20% of Boxten's Skill Haste and Defense to all allies. When any ally under Tempo lands an ability, a Lucky Bubble bursts over the target for 140%+ Magic Damage, shreds 25% Armor and Magic Defense for 6s, drains 20 Energy, and Charms them for 1.5s.",
      apply(u, B, lvl) {
        u.flat.cdr = (u.flat.cdr || 0) + (0.14 + lvl * 0.06);
        u.flat.evaP = (u.flat.evaP || 0) + (0.12 + lvl * 0.05);
        u.flat.hpP = (u.flat.hpP || 0) + (0.10 + lvl * 0.04);
        u.dirty = true;

        const clockworkOverture = () => {
          if (!u.alive) return;
          Sound.play('ticktock', { vol: 0.45 });
          Sound.play('get_rare', { vol: 0.38, priority: true });
          B.alliesOf(u).filter(a => a.alive).forEach(a => {
            B.cleanse(a, 99);
            B.applyStatus(u, a, 'ccimmune', 4.0);
            B.applyStatus(u, a, 'tempo', 8 + lvl * 0.6, { stacks: 2 + (lvl >= 4 ? 1 : 0) });
            B.applyStatus(u, a, 'speedup', 5 + lvl * 0.5);
            B.energy(a, 30);
            B.reduceCd(a, 1.5 + lvl * 0.4);
            B.applyStatus(u, a, 'statshare', 999, { val: 0.16 + lvl * 0.03 });
            B.fxSparkle(a.x, a.y - 40, 8, '#ffb3d1');
          });
          B.fxRing(u.x, u.y - 35, 160, '#ffb3d1', 0.45);
          B.fxFloatIcon(u.x, u.y - 110, '🍀 CLOCKWORK OVERTURE', '#ffb3d1');
        };

        onWaveAndStart(u, B, clockworkOverture);

        B.on(u, 'cast', ev => {
          if (ev.key === 'G' || ev.key === 'W') clockworkOverture();
        });

        B.on(u, 'allyDamageDealt', ev => {
          if (!ev || !ev.src || !ev.target || ev.basic || ev.dot || !ev.target.alive) return;
          if (!ev.src.hasStatus || !ev.src.hasStatus('tempo')) return;
          const now = B.t;
          if (now < (ev.target._luckyBubbleAt || 0)) return;
          ev.target._luckyBubbleAt = now + Math.max(2.5, 4.5 - lvl * 0.4);
          Sound.play('bubblepop', { vol: 0.45, throttle: 120 });
          B.fxRing(ev.target.x, ev.target.y - 35, 90, '#ffb3d1', 0.35);
          B.damage(u, ev.target, u.st.mag * (0.90 + lvl * 0.25), { type: 'magic', tag: 'Lucky Bubble' });
          B.applyStatus(u, ev.target, 'charm', 1.5);
          B.applyStatus(u, ev.target, 'defdown', 6, { val: 0.25 });
          B.applyStatus(u, ev.target, 'mdefdown', 6, { val: 0.25 });
          B.energy(ev.target, -20);
          B.fxFloatIcon(ev.target.x, ev.target.y - 100, '🫧 CHARM & SHRED', '#ffb3d1');
        });
      }
    });
  }

  /* =========================================================================
     2. BIG WIG — Legal Eagle's Appeal Brief (bigwig_legaleagle)
     ========================================================================= */
  if (BADGES.bigwig_legaleagle) {
    Object.assign(BADGES.bigwig_legaleagle, {
      stat: lvl => `+${(16 + lvl * 6).toFixed(0)}% Defense · +${(16 + lvl * 6).toFixed(0)}% Magic Defense · +${(12 + lvl * 5).toFixed(0)}% Max HP`,
      effect: "Legal Eagle's certified injunction enforces absolute court authority! Shares 20% of Big Wig's massive Defense and Magic Defense to all allies. At wave start: issues a Court Injunction blocking all incoming enemy buffs for 6s (Buff Denied!), cleanses debuffs from all allies, and grants Big Wig an opening Taunt barrier (30%+ Max HP). Casting Power Trip shields all allies for 15%+ Max HP, cleanses 2 debuffs, and stuns attackers for 1.2s.",
      apply(u, B, lvl) {
        u.flat.defP = (u.flat.defP || 0) + 0.16 + lvl * 0.06;
        u.flat.mdefP = (u.flat.mdefP || 0) + 0.16 + lvl * 0.06;
        u.flat.hpP = (u.flat.hpP || 0) + 0.12 + lvl * 0.05;
        u.dirty = true;

        const courtInjunction = () => {
          if (!u.alive) return;
          Sound.play('gavel', { vol: 0.55 });
          B.shake(6, 0.25);
          B.alliesOf(u).filter(a => a.alive).forEach(a => {
            B.cleanse(a, 99);
            B.applyStatus(u, a, 'statshare', 999, { val: 0.16 + lvl * 0.03 });
            B.applyStatus(u, a, 'fortify', 8, { stacks: 2 });
          });
          B.shield(u, u, u.max.hp * (0.24 + lvl * 0.06), 8);
          B.enemiesOf(u).filter(e => e.alive).forEach(e => {
            B.applyStatus(u, e, 'buffsealed', 6, { stacks: 3 });
            B.fxFloatIcon(e.x, e.y - 95, '⚖️ INJUNCTION', '#8dc4e8');
          });
          B.fxRing(u.x, u.y - 35, 200, '#8dc4e8', 0.5);
          B.fxFloatIcon(u.x, u.y - 110, '⚖️ COURT INJUNCTION', '#8dc4e8');
        };

        onWaveAndStart(u, B, courtInjunction);

        B.on(u, 'cast', ev => {
          if (ev.key !== 'B' && ev.key !== 'W') return;
          B.after(0.35, () => {
            if (!u.alive) return;
            B.alliesOf(u).forEach(ally => {
              if (!ally.alive) return;
              B.shield(u, ally, u.max.hp * (0.12 + lvl * 0.04), 6);
              B.cleanse(ally, 2);
              B.fxSparkle(ally.x, ally.y - 40, 6, '#8dc4e8');
            });
          });
        });
      }
    });
  }

  /* =========================================================================
     3. BIG WIG — Pencil Pusher's Case Ledger (bigwig_pencilpusher)
     ========================================================================= */
  if (BADGES.bigwig_pencilpusher) {
    Object.assign(BADGES.bigwig_pencilpusher, {
      stat: lvl => `+${(15 + lvl * 6).toFixed(0)}% Skill Haste · +${(15 + lvl * 6).toFixed(0)}% Magic Attack · +${(12 + lvl * 4).toFixed(0)}% Magic Penetration`,
      effect: "Pencil Pusher's relentless audit leaves no loophole unpunished! At wave start: gains 35 Energy and a Surge of Evidence (+35% Magic Attack for 8s). Basic attacks deal bonus True Damage equal to 8%+ of Big Wig's Max HP. Convicted enemies take 30% amplified damage from all sources, have their Magic Defense shredded by 25%, lose 2 buffs, and have 25 Energy drained.",
      apply(u, B, lvl) {
        u.flat.cdr = (u.flat.cdr || 0) + 0.15 + lvl * 0.06;
        u.flat.magP = (u.flat.magP || 0) + 0.15 + lvl * 0.06;
        u.flat.magPen = (u.flat.magPen || 0) + 0.12 + lvl * 0.04;
        u.dirty = true;

        onWaveAndStart(u, B, () => {
          B.energy(u, 35);
          B.applyStatus(u, u, 'atkup', 8, { val: 0.35 });
          B.fxFloatIcon(u.x, u.y - 110, '📋 AUDIT SURGE', '#9db49c');
        });

        B.on(u, 'dealDamage', ev => {
          if (!ev.target || ev.target.team === u.team || !ev.target.alive) return;
          if (ev.basic) {
            ev.amount += u.max.hp * (0.06 + lvl * 0.02);
          }
          if (ev.target.hasStatus && ev.target.hasStatus('convicted')) {
            ev.amount *= 1.30;
          }
        });

        B.on(u, 'statusApplied', ev => {
          if (ev.src !== u || ev.id !== 'convicted' || !ev.unit || ev.unit.team === u.team || !ev.unit.alive) return;
          if (B.t < (u._caseLedgerAt || 0)) return;
          u._caseLedgerAt = B.t + 3.0;
          B.dispel(ev.unit, 2);
          B.applyStatus(u, ev.unit, 'mdefdown', 7, { val: 0.25 });
          B.energy(ev.unit, -(15 + lvl * 5));
          B.energy(u, 12 + lvl * 4);
          B.fxFloatIcon(ev.unit.x, ev.unit.y - 95, '📋 AUDITED -25⚡', '#9db49c');
        });
      }
    });
  }

  /* =========================================================================
     4. FLUTTER — Flyte's Shared Scrapbook (flutter_flyte)
     ========================================================================= */
  if (BADGES.flutter_flyte) {
    Object.assign(BADGES.flutter_flyte, {
      stat: lvl => `+${(15 + lvl * 6).toFixed(0)}% Evasion · +${(14 + lvl * 5).toFixed(0)}% Critical Hit Chance · +${(12 + lvl * 5).toFixed(0)}% Attack Speed`,
      effect: "The shared scrapbook turns aerial landings into unstoppable coordinated strikes! At wave start: glides in with Tailwind (+40% Attack Speed and +35% Move Speed for 8s) and shares 20% of Flutter's Evasion and Speed with the team. When Flutter dashes, dodges, or at wave start, an Airstrike Divebomb bombs the enemy front for 160%+ Physical Damage, knocks enemies back, shreds 25% Armor for 6s, and gives Flutter 4s of guaranteed Critical Hits.",
      apply(u, B, lvl) {
        u.flat.evaP = (u.flat.evaP || 0) + 0.15 + lvl * 0.06;
        u.flat.crit = (u.flat.crit || 0) + 0.14 + lvl * 0.05;
        u.flat.aspdP = (u.flat.aspdP || 0) + 0.12 + lvl * 0.05;
        u.dirty = true;

        const triggerDivebomb = (tx, ty) => {
          if (!u.alive) return;
          Sound.play('sweep', { vol: 0.42 });
          Sound.play('hit_heavy', { vol: 0.45, throttle: 100 });
          B.fxRing(tx, ty - 35, 160, '#a8ecff', 0.45);
          B.fxSparkle(tx, ty - 45, 14, '#a8ecff');
          B.fxFloatIcon(u.x, u.y - 105, '📖 AIRSTRIKE!', '#a8ecff');

          B.enemiesOf(u).filter(e => e.alive && Math.abs(e.x - tx) < 180).forEach(foe => {
            B.damage(u, foe, u.st.atk * (1.2 + lvl * 0.35), { type: 'physical', tag: 'Flyte Divebomb' });
            B.knockback(u, foe, 120);
            B.applyStatus(u, foe, 'defdown', 6, { val: 0.25 });
            B.applyStatus(u, foe, 'slow', 4);
          });

          B.applyStatus(u, u, 'lucky', 4.0);
          B.alliesOf(u).forEach(a => {
            B.applyStatus(u, a, 'speedup', 6.0);
            B.applyStatus(u, a, 'haste', 6.0);
            B.applyStatus(u, a, 'statshare', 999, { val: 0.15 + lvl * 0.02 });
          });
        };

        onWaveAndStart(u, B, () => {
          B.applyStatus(u, u, 'haste', 8.0);
          B.applyStatus(u, u, 'speedup', 8.0);
          triggerDivebomb(u.x + u.face * 160, u.y);
        });

        B.on(u, 'cast', ev => {
          if (ev.key === 'W') triggerDivebomb(u.x + u.face * 80, u.y);
        });

        B.on(u, 'dodged', ev => {
          if (!ev || !ev.src || ev.src.team === u.team) return;
          B.energy(u, 10 + lvl * 3);
          if (B.t >= (u._flyteAirstrikeAt || 0)) {
            u._flyteAirstrikeAt = B.t + Math.max(2.5, 5.0 - lvl * 0.4);
            triggerDivebomb(ev.src.x, ev.src.y);
          }
        });
      }
    });
  }

  /* =========================================================================
     5. FLYTE — Brightney's Steady Light (flyte_brightney)
     ========================================================================= */
  if (BADGES.flyte_brightney) {
    Object.assign(BADGES.flyte_brightney, {
      stat: lvl => `+${(16 + lvl * 6).toFixed(0)}% Shield Power · +${(14 + lvl * 5).toFixed(0)}% Skill Haste · +${(12 + lvl * 5).toFixed(0)}% Magic Attack`,
      effect: "Brightney's beacon illuminates Flyte's defense with dazzling radiance! At wave start: emits a Prismatic Flare that dispels 2 buffs from all enemies and grants the entire team 5s of Debuff Immunity. Shielded allies reflect 35%+ of all incoming damage as Magic Damage and gain +20% damage dealt. Shares 20% of Flyte's Magic Attack with all allies.",
      apply(u, B, lvl) {
        u.flat.shieldPowP = (u.flat.shieldPowP || 0) + 0.16 + lvl * 0.06;
        u.flat.cdr = (u.flat.cdr || 0) + 0.14 + lvl * 0.05;
        u.flat.magP = (u.flat.magP || 0) + 0.12 + lvl * 0.05;
        u.dirty = true;

        const prismaticFlare = () => {
          if (!u.alive) return;
          Sound.play('beam_fire', { vol: 0.45 });
          B.flash('#ffe59a', 0.25, 0.3);
          B.enemiesOf(u).filter(e => e.alive).forEach(e => {
            B.dispel(e, 2);
            B.applyStatus(u, e, 'blind', 4.0);
          });
          B.alliesOf(u).forEach(a => {
            B.cleanse(a, 99);
            B.applyStatus(u, a, 'ccimmune', 5.0);
            B.applyStatus(u, a, 'statshare', 999, { val: 0.18 + lvl * 0.02 });
          });
          B.fxFloatIcon(u.x, u.y - 110, '💡 PRISMATIC FLARE', '#ffe59a');
        };

        onWaveAndStart(u, B, prismaticFlare);

        B.on(u, 'shieldDone', ev => {
          const ally = ev && ev.target;
          if (!ally || ally.team !== u.team || !ally.alive) return;
          B.applyStatus(u, ally, 'haste', 5 + lvl * 0.5);
          B.applyStatus(u, ally, 'atkup', 5, { val: 0.20 });
          B.fxSparkle(ally.x, ally.y - 40, 8, '#ffe59a');
        });

        const reflectPct = 0.30 + lvl * 0.05;
        B.on(u, 'allyDamaged', ev => {
          if (!ev || !ev.unit || ev.unit.team !== u.team || !ev.src || ev.src.team === u.team || !ev.src.alive) return;
          if (!ev.unit.shields || !ev.unit.shields.some(sh => sh.src === u)) return;
          if (ev.redirected || ev.dot) return;
          const reflected = Math.max(1, Math.round((ev.amount || 0) * reflectPct));
          B.damage(u, ev.src, reflected, { type: 'magic', redirected: true, tag: 'Prismatic Deflection' });
          B.fxSparkle(ev.src.x, ev.src.y - 40, 4, '#ffe59a');
        });
      }
    });
  }

  /* =========================================================================
     6. FLYTE — Flutter's Field Diary (flyte_flutter)
     ========================================================================= */
  if (BADGES.flyte_flutter) {
    Object.assign(BADGES.flyte_flutter, {
      stat: lvl => `+${(16 + lvl * 6).toFixed(0)}% Control Duration · +${(15 + lvl * 6).toFixed(0)}% Max Health · +${(12 + lvl * 5).toFixed(0)}% Attack Speed`,
      effect: "Flyte's field notes orchestrate flawless team flight dynamics! Works with ANY team. At wave start: launches a Gale Squall that knocks all enemies back, stuns them for 2s, strips shields, and wraps Flyte and his most injured ally in aerodynamic Gale Barriers (22%+ Max HP). Stuns inflict Turbulence, causing foes to bleed for 4% Max HP True Damage per second for 5s.",
      apply(u, B, lvl) {
        u.flat.hpP = (u.flat.hpP || 0) + 0.15 + lvl * 0.06;
        u.flat.aspdP = (u.flat.aspdP || 0) + 0.12 + lvl * 0.05;
        u.dirty = true;

        const galeSquall = () => {
          if (!u.alive) return;
          Sound.play('sweep', { vol: 0.5 });
          B.enemiesOf(u).filter(e => e.alive).forEach(e => {
            B.knockback(u, e, 130);
            B.applyStatus(u, e, 'stun', 2.0);
            B.crackShield(u, e, 0.40);
            B.fxFloatIcon(e.x, e.y - 95, '🌪 SQUALL', '#7ce8f7');
          });
          const targetAlly = B.lowestHp(B.alliesOf(u)) || u;
          const barrier = u.max.hp * (0.20 + lvl * 0.05);
          B.shield(u, u, barrier, 6.0);
          B.shield(u, targetAlly, barrier, 6.0);
          B.applyStatus(u, targetAlly, 'speedup', 5.0);
          B.fxFloatIcon(u.x, u.y - 110, '🦋 GALE BARRIER', '#7ce8f7');
        };

        onWaveAndStart(u, B, galeSquall);

        B.on(u, 'cast', ev => {
          if (ev.key === 'G') galeSquall();
        });

        B.on(u, 'statusApplied', ev => {
          if (ev && ev.id === 'stun' && ev.src === u && ev.unit && ev.unit.team !== u.team) {
            B.applyStatus(u, ev.unit, 'turbulence', 5.0, { stacks: 2 });
            B.damage(u, ev.unit, ev.unit.max.hp * (0.04 + lvl * 0.01), { type: 'true', dot: true, tag: 'Turbulence Bleed' });
          }
        });
      }
    });
  }

  /* =========================================================================
     7. FLYTE — Bassie's Emergency Rations (flyte_bassie)
     ========================================================================= */
  if (BADGES.flyte_bassie) {
    Object.assign(BADGES.flyte_bassie, {
      stat: lvl => `+${(18 + lvl * 6).toFixed(0)}% Shield Power · +${(14 + lvl * 5).toFixed(0)}% Damage Reduction · +${(14 + lvl * 5).toFixed(0)}% Max HP`,
      effect: "Emergency provisions keep the party flying at peak strength! At wave start: distributes Emergency Rations to the whole team, healing 18%+ Max HP, cleansing 2 debuffs, granting 30 Energy, and conferring Slow/Silence/Root immunity for 5s. Whenever an ally's shield breaks or expires, a ration basket heals them for 20%+ Max HP and grants 25 Energy. Casting Wing Flap releases a Smoke Screen blinding all enemies for 4s.",
      apply(u, B, lvl) {
        u.flat.shieldPowP = (u.flat.shieldPowP || 0) + 0.18 + lvl * 0.06;
        u.flat.wardP = (u.flat.wardP || 0) + 0.14 + lvl * 0.05;
        u.flat.hpP = (u.flat.hpP || 0) + 0.14 + lvl * 0.05;
        u.dirty = true;

        const distributeRations = () => {
          if (!u.alive) return;
          Sound.play('heal', { vol: 0.45 });
          B.alliesOf(u).filter(a => a.alive).forEach(a => {
            B.heal(u, a, a.max.hp * (0.16 + lvl * 0.03), { tag: 'Emergency Rations' });
            B.cleanse(a, 2);
            B.energy(a, 30);
            B.applyStatus(u, a, 'statshare', 999, { val: 0.15 });
            B.fxSparkle(a.x, a.y - 40, 8, '#ffeaa7');
          });
          B.fxFloatIcon(u.x, u.y - 110, '🧺 TEAM RATIONS', '#ffeaa7');
        };

        onWaveAndStart(u, B, distributeRations);

        B.on(u, 'shieldDone', ev => {
          const ally = ev && ev.target;
          if (!ally || ally.team !== u.team || !ally.alive) return;
          const healAmt = ally.max.hp * (0.18 + lvl * 0.03) + u.st.mag * 0.4;
          B.heal(u, ally, healAmt, { tag: 'Emergency Rations' });
          B.energy(ally, 25);
          B.cleanse(ally, 1);
          B.fxFloatIcon(ally.x, ally.y - 100, '🧺 RATIONS +25⚡', '#ffeaa7');
        });

        B.on(u, 'cast', ev => {
          if (ev.key === 'B') {
            Sound.play('bomb', { vol: 0.45 });
            B.enemiesOf(u).filter(e => e.alive).forEach(e => {
              B.applyStatus(u, e, 'blind', 4.0);
              B.fxSparkle(e.x, e.y - 40, 6, '#ffeaa7');
            });
            B.fxFloatIcon(u.x, u.y - 110, '💨 SMOKE SCREEN', '#ffeaa7');
          }
        });
      }
    });
  }

  /* =========================================================================
     8. JACK SKELLINGTON — Gourdy's Candy Lantern (jack_gourdy)
     ========================================================================= */
  if (BADGES.jack_gourdy) {
    Object.assign(BADGES.jack_gourdy, {
      stat: lvl => `+${(16 + lvl * 6).toFixed(0)}% Magic Attack · +${(15 + lvl * 5).toFixed(0)}% Max HP · +${(14 + lvl * 5).toFixed(0)}% Skill Haste`,
      effect: "The Pumpkin King's candy lantern turns Halloween chills into blazing nightmare fires! At wave start: unleashes Pumpkin Fire on all foes (dealing continuous Magic Damage, reducing enemy damage dealt by 25%, and shredding 25% Magic Defense), while shielding all allies for 20%+ Max HP. Jack shares 20% of his Magic Attack to all allies. Attacking Scared foes deals bonus True Damage and feeds treat candies to allies.",
      apply(u, B, lvl) {
        u.flat.magP = (u.flat.magP || 0) + 0.16 + lvl * 0.06;
        u.flat.hpP = (u.flat.hpP || 0) + 0.15 + lvl * 0.05;
        u.flat.cdr = (u.flat.cdr || 0) + 0.14 + lvl * 0.05;
        u.dirty = true;

        const pumpkinIgnition = () => {
          if (!u.alive) return;
          Sound.play('fire', { vol: 0.5 });
          B.flash('#ff7b25', 0.25, 0.3);
          B.enemiesOf(u).filter(e => e.alive).forEach(e => {
            B.applyStatus(u, e, 'weaken', 8, { val: 0.25 });
            B.applyStatus(u, e, 'mdefdown', 8, { val: 0.25 });
            B.damage(u, e, u.st.mag * (0.8 + lvl * 0.2), { type: 'magic', dot: true, tag: 'Pumpkin Flame' });
            B.fxFloatIcon(e.x, e.y - 95, '🎃 PUMPKIN FIRE', '#ff7b25');
          });
          B.alliesOf(u).forEach(a => {
            B.shield(u, a, a.max.hp * (0.18 + lvl * 0.04), 8);
            B.applyStatus(u, a, 'statshare', 999, { val: 0.16 + lvl * 0.02 });
          });
          B.fxFloatIcon(u.x, u.y - 110, '🎃 SPOOKY SURPRISE', '#ff7b25');
        };

        onWaveAndStart(u, B, pumpkinIgnition);

        B.on(u, 'dealDamage', ev => {
          if (!ev.target || ev.target.team === u.team || !ev.target.alive) return;
          if (ev.target.hasStatus && ev.target.hasStatus('scared')) {
            ev.amount *= 1.30;
            const ally = B.lowestHp(B.alliesOf(u));
            if (ally) {
              B.heal(u, ally, ally.max.hp * 0.06, { tag: 'Halloween Treat' });
              B.energy(ally, 8);
            }
          }
        });
      }
    });
  }

  /* =========================================================================
     9. OOGIE BOOGIE — Cocoa's Fair Share Tin (oogie_cocoa)
     ========================================================================= */
  if (BADGES.oogie_cocoa) {
    Object.assign(BADGES.oogie_cocoa, {
      stat: lvl => `+${(18 + lvl * 6).toFixed(0)}% Max HP · +${(16 + lvl * 6).toFixed(0)}% Healing Received · +${(14 + lvl * 5).toFixed(0)}% Defense`,
      effect: "Cocoa's tin turns Oogie's ravenous appetite into boundless team fortitude! Shares 20% of Oogie's colossal Max HP and Defense with all allies. At wave start: cracks the emergency cookie tin, shielding all allies for 22%+ Max HP, cleansing 2 debuffs, and taunting the highest-Attack foe for 4s. Whenever Oogie eats bugs or takes damage, he belches a toxic swamp burst dealing True Damage to nearby enemies and cutting enemy healing by 50%.",
      apply(u, B, lvl) {
        u.flat.hpP = (u.flat.hpP || 0) + 0.18 + lvl * 0.06;
        u.flat.healRecv = (u.flat.healRecv || 0) + 0.16 + lvl * 0.06;
        u.flat.defP = (u.flat.defP || 0) + 0.14 + lvl * 0.05;
        u.dirty = true;

        const openCookieTin = () => {
          if (!u.alive) return;
          Sound.play('crunch', { vol: 0.5 });
          B.alliesOf(u).filter(a => a.alive).forEach(a => {
            B.shield(u, a, u.max.hp * (0.20 + lvl * 0.05), 8);
            B.cleanse(a, 2);
            B.applyStatus(u, a, 'statshare', 999, { val: 0.18 + lvl * 0.03 });
            B.fxSparkle(a.x, a.y - 40, 8, '#78c257');
          });
          const highest = B.highestStat(B.enemiesOf(u), 'atk');
          if (highest) {
            B.applyStatus(u, highest, 'taunt', 4.0);
            B.fxFloatIcon(highest.x, highest.y - 95, '🎲 TAUNTED', '#78c257');
          }
          B.fxFloatIcon(u.x, u.y - 110, '🍪 COOKIE FEAST', '#78c257');
        };

        onWaveAndStart(u, B, openCookieTin);

        B.on(u, 'damaged', ev => {
          if (!ev.src || ev.src.team === u.team || !ev.src.alive) return;
          if (B.t < (u._oogieBurpAt || 0)) return;
          u._oogieBurpAt = B.t + 3.0;
          Sound.play('slurp', { vol: 0.45 });
          B.enemiesOf(u).filter(e => e.alive && Math.abs(e.x - u.x) < 200).forEach(e => {
            B.damage(u, e, u.max.hp * 0.08, { type: 'true', tag: 'Toxic Belch' });
            B.applyStatus(u, e, 'healdown', 6, { val: 0.50 });
            B.fxSparkle(e.x, e.y - 40, 6, '#78c257');
          });
        });
      }
    });
  }

  /* =========================================================================
     10. LOCK, SHOCK & BARREL — Waxwell's Villain Contract (lockshockbarrel_waxwell)
     ========================================================================= */
  if (BADGES.lockshockbarrel_waxwell) {
    Object.assign(BADGES.lockshockbarrel_waxwell, {
      stat: lvl => `+${(16 + lvl * 6).toFixed(0)}% Critical Hit Chance · +${(15 + lvl * 5).toFixed(0)}% Skill Haste · +${(14 + lvl * 5).toFixed(0)}% Attack`,
      effect: "Waxwell's contract turns juvenile delinquency into deadly explosive sabotage! At wave start: tosses Trick-or-Treat explosive booby traps, stunning 2 enemies for 2s, purging 2 buffs, and granting the trio +40% Critical Damage for 8s. Critical hits splash scalding wax for 140%+ Attack True Fire Damage and permanently shred 20% Armor. Casting All Caught Up wraps all allies in a 20%+ Max HP Wax Shield.",
      apply(u, B, lvl) {
        u.flat.crit = (u.flat.crit || 0) + 0.16 + lvl * 0.06;
        u.flat.cdr = (u.flat.cdr || 0) + 0.15 + lvl * 0.05;
        u.flat.atkP = (u.flat.atkP || 0) + 0.14 + lvl * 0.05;
        u.dirty = true;

        const trickOrTreat = () => {
          if (!u.alive) return;
          Sound.play('bomb', { vol: 0.5 });
          B.shake(6, 0.25);
          B.enemiesOf(u).slice(0, 2).forEach(e => {
            B.applyStatus(u, e, 'stun', 2.0);
            B.dispel(e, 2);
            B.damage(u, e, u.st.atk * (1.2 + lvl * 0.3), { type: 'true', tag: 'Trick Trap' });
            B.fxFloatIcon(e.x, e.y - 95, '💥 BOOBY TRAP!', '#ff5c5c');
          });
          B.applyStatus(u, u, 'critdmgup', 8, { val: 0.40 });
          B.fxFloatIcon(u.x, u.y - 110, '🎭 TRICK OR TREAT!', '#ff5c5c');
        };

        onWaveAndStart(u, B, trickOrTreat);

        B.on(u, 'dealDamage', ev => {
          if (!ev.target || ev.target.team === u.team || !ev.target.alive || !ev.crit) return;
          if (B.t < (u._waxSplashedAt || 0)) return;
          u._waxSplashedAt = B.t + 2.0;
          Sound.play('fire', { vol: 0.4 });
          B.enemiesOf(u).filter(e => e.alive && Math.abs(e.x - ev.target.x) < 160).forEach(e => {
            B.damage(u, e, u.st.atk * (0.8 + lvl * 0.2), { type: 'true', tag: 'Scalding Wax' });
            B.applyStatus(u, e, 'defdown', 8, { val: 0.20 });
            B.fxSparkle(e.x, e.y - 40, 6, '#ffaa44');
          });
        });

        B.on(u, 'cast', ev => {
          if (ev.key === 'W' || ev.key === 'B') {
            B.alliesOf(u).forEach(a => B.shield(u, a, a.max.hp * (0.16 + lvl * 0.04), 6));
          }
        });
      }
    });
  }

  /* =========================================================================
     11. DANDY — Brusha's Spotlight Palette (dandy_brusha)
     ========================================================================= */
  if (BADGES.dandy_brusha) {
    Object.assign(BADGES.dandy_brusha, {
      stat: lvl => `+${(18 + lvl * 6).toFixed(0)}% Attack · +${(15 + lvl * 5).toFixed(0)}% Skill Haste · +${(14 + lvl * 5).toFixed(0)}% Armor Penetration`,
      effect: "Brusha's vivid palette puts Dandy dead center in the spotlight! At wave start: marks the strongest enemy with Spotlight Neglect, completely purges their shields and buffs, and grants Dandy +40% Attack and guaranteed Critical Hits for 8s. Painted enemies suffer 30% amplified damage from all allies. Dandy shares 18% of his Attack with the two lowest-Attack teammates.",
      apply(u, B, lvl) {
        u.flat.atkP = (u.flat.atkP || 0) + 0.18 + lvl * 0.06;
        u.flat.cdr = (u.flat.cdr || 0) + 0.15 + lvl * 0.05;
        u.flat.armorPen = (u.flat.armorPen || 0) + 0.14 + lvl * 0.05;
        u.dirty = true;

        const paintSpotlight = () => {
          if (!u.alive) return;
          Sound.play('applause', { vol: 0.48 });
          const boss = B.highestStat(B.enemiesOf(u), 'atk');
          if (boss) {
            B.dispelAll(boss);
            B.crackShield(u, boss, 1.0);
            B.applyStatus(u, boss, 'neglect', 999, { stacks: 3 });
            B.applyStatus(u, boss, 'exposed', 8.0);
            B.fxFloatIcon(boss.x, boss.y - 95, '🎨 SPOTLIGHT NEGLECT', '#ff7eb6');
          }
          B.applyStatus(u, u, 'atkup', 8, { val: 0.40 });
          B.applyStatus(u, u, 'lucky', 8);
          // Share Attack to lowest teammates
          B.alliesOf(u).filter(a => a.alive && a !== u).sort((a, b) => a.st.atk - b.st.atk).slice(0, 2).forEach(a => {
            B.applyStatus(u, a, 'statshare', 999, { val: 0.18 });
            B.fxSparkle(a.x, a.y - 40, 8, '#ff7eb6');
          });
          B.fxFloatIcon(u.x, u.y - 110, '🌟 CENTER OF ATTENTION', '#ff7eb6');
        };

        onWaveAndStart(u, B, paintSpotlight);

        B.on(u, 'dealDamage', ev => {
          if (ev.target && ev.target.hasStatus && (ev.target.hasStatus('neglect') || ev.target.hasStatus('exposed'))) {
            ev.amount *= 1.30;
          }
        });
      }
    });
  }

  /* =========================================================================
     12. DANDY — Pebble's Lookout Bell (dandy_pebble)
     ========================================================================= */
  if (BADGES.dandy_pebble) {
    Object.assign(BADGES.dandy_pebble, {
      stat: lvl => `+${(18 + lvl * 6).toFixed(0)}% Max HP · +${(15 + lvl * 5).toFixed(0)}% Evasion · +${(14 + lvl * 5).toFixed(0)}% Defense`,
      effect: "Pebble's faithful bell sounds the alarm to defend the pack! At wave start: rings across the stage, granting all allies a 22%+ Max HP Lookout Shield, cleansing all debuffs, and granting Debuff & CC Immunity while shielded. When an enemy strikes any ally, the bell retaliates with a concussive shockwave dealing 140%+ Attack damage, taunting the attacker, and granting Dandy 15 Energy.",
      apply(u, B, lvl) {
        u.flat.hpP = (u.flat.hpP || 0) + 0.18 + lvl * 0.06;
        u.flat.evaP = (u.flat.evaP || 0) + 0.15 + lvl * 0.05;
        u.flat.defP = (u.flat.defP || 0) + 0.14 + lvl * 0.05;
        u.dirty = true;

        const ringLookout = () => {
          if (!u.alive) return;
          Sound.play('bell', { vol: 0.55 });
          B.alliesOf(u).filter(a => a.alive).forEach(a => {
            B.cleanseAll(a);
            B.shield(u, a, u.max.hp * (0.18 + lvl * 0.04), 8);
            B.applyStatus(u, a, 'ccimmune', 5.0);
            B.applyStatus(u, a, 'statshare', 999, { val: 0.16 + lvl * 0.02 });
            B.fxSparkle(a.x, a.y - 40, 8, '#f4d17d');
          });
          B.fxRing(u.x, u.y - 35, 180, '#f4d17d', 0.5);
          B.fxFloatIcon(u.x, u.y - 110, '🔔 LOOKOUT ALARM', '#f4d17d');
        };

        onWaveAndStart(u, B, ringLookout);

        B.on(u, 'allyDamaged', ev => {
          if (!ev.src || ev.src.team === u.team || !ev.src.alive) return;
          if (B.t < (u._pebbleBellCounterAt || 0)) return;
          u._pebbleBellCounterAt = B.t + 2.5;
          Sound.play('bark', { vol: 0.5 });
          B.damage(u, ev.src, u.st.atk * (1.2 + lvl * 0.2), { type: 'physical', tag: 'Bell Retaliation' });
          B.applyStatus(u, ev.src, 'taunt', 3.0);
          B.energy(u, 15);
          B.fxFloatIcon(ev.src.x, ev.src.y - 95, '🔔 BARK!', '#f4d17d');
        });
      }
    });
  }

  /* =========================================================================
     13. CLOUD — Buster Sword Charm (ff7_cloud_buster)
     ========================================================================= */
  if (BADGES.ff7_cloud_buster) {
    Object.assign(BADGES.ff7_cloud_buster, {
      stat: lvl => `+${(18 + lvl * 6).toFixed(0)}% Attack · +${(14 + lvl * 5).toFixed(0)}% Attack Speed · +${(14 + lvl * 5).toFixed(0)}% Armor Penetration`,
      effect: "The legacy of SOLDIER First Class blazes through the Buster Sword! At wave start: triggers SOLDIER Surge (+40% Attack, +30% Attack Speed, 40 Energy, and CC Immunity for 8s) and shares 20% of Cloud's Attack with all frontline allies. Every 3rd basic attack unleashes Cross-Slash for 220%+ Attack, knocks enemies back, and shreds 30% Armor. Limit Surge deals 260%+ Attack and blasts through enemy shields.",
      apply(u, B, lvl) {
        u.flat.atkP = (u.flat.atkP || 0) + 0.18 + lvl * 0.06;
        u.flat.aspdP = (u.flat.aspdP || 0) + 0.14 + lvl * 0.05;
        u.flat.armorPen = (u.flat.armorPen || 0) + 0.14 + lvl * 0.05;
        u.dirty = true;

        const soldierSurge = () => {
          if (!u.alive) return;
          Sound.play('sword_sheath', { vol: 0.5 });
          B.applyStatus(u, u, 'atkup', 8.0, { val: 0.40 });
          B.applyStatus(u, u, 'haste', 8.0);
          B.applyStatus(u, u, 'ccimmune', 8.0);
          B.energy(u, 40);
          applyTeamStatShare(u, B, 'atk', 0.20 + lvl * 0.02);
          B.fxRing(u.x, u.y - 40, 200, '#6fa8ff', 0.5);
          B.fxFloatIcon(u.x, u.y - 120, '⚔ SOLDIER 1ST CLASS', '#6fa8ff');
        };

        onWaveAndStart(u, B, soldierSurge);

        let hits = 0;
        B.on(u, 'basicHit', ev => {
          if (++hits % 3) return;
          const t = ev && ev.target; if (!t || !t.alive) return;
          Sound.play('hit_heavy', { vol: 0.65 });
          B.shake(10, 0.25);
          B.fxRing(t.x, t.y - 40, 180, '#9fc8ff', 0.45);
          B.fxFloatIcon(t.x, t.y - 120, '⚔ CROSS-SLASH', '#9fc8ff');
          B.enemiesOf(u).filter(e => e.alive && Math.abs(e.x - t.x) <= 180).forEach(e => {
            B.damage(u, e, u.st.atk * (1.8 + lvl * 0.35), { type: 'physical', tag: 'Cross-Slash' });
            B.knockback(u, e, 55);
            B.applyStatus(u, e, 'defdown', 7, { val: 0.30 });
          });
        });

        B.on(u, 'cast', ev => {
          if (ev.key !== 'W') return;
          B.after(0.4, () => {
            if (!u.alive) return;
            Sound.play('explode', { vol: 0.65 });
            B.flash('#9fc8ff', 0.35, 0.3);
            B.shake(14, 0.4);
            B.fxRing(u.x, u.y - 40, 280, '#6fa8ff', 0.55);
            B.enemiesOf(u).filter(e => e.alive && Math.abs(e.x - u.x) <= 280).forEach(e => {
              B.crackShield(u, e, 0.50);
              B.damage(u, e, u.st.atk * (2.6 + lvl * 0.35), { type: 'physical', tag: 'Limit Surge' });
            });
            B.fxFloatIcon(u.x, u.y - 130, '✦ LIMIT SURGE', '#6fa8ff');
          });
        });
      }
    });
  }

  /* =========================================================================
     14. TIFA — Seventh Heaven Gloves (ff7_tifa_gloves)
     ========================================================================= */
  if (BADGES.ff7_tifa_gloves) {
    Object.assign(BADGES.ff7_tifa_gloves, {
      stat: lvl => `+${(18 + lvl * 6).toFixed(0)}% Attack · +${(15 + lvl * 5).toFixed(0)}% Attack Speed · +${(14 + lvl * 5).toFixed(0)}% Critical Hit Chance`,
      effect: "Seventh Heaven's martial techniques unleash relentless pressure! At wave start: gains Unbridled Strength (+40% Attack Speed and +30% Critical Damage for 8s) and 35 Energy. Beat Rush delivers 7 lightning punches (80%+ Attack each) that stagger and shred 25% Armor. Dodging or casting cleanses 2 debuffs and grants 3s CC Immunity.",
      apply(u, B, lvl) {
        u.flat.atkP = (u.flat.atkP || 0) + 0.18 + lvl * 0.06;
        u.flat.aspdP = (u.flat.aspdP || 0) + 0.15 + lvl * 0.05;
        u.flat.crit = (u.flat.crit || 0) + 0.14 + lvl * 0.05;
        u.dirty = true;

        onWaveAndStart(u, B, () => {
          B.applyStatus(u, u, 'haste', 8.0);
          B.applyStatus(u, u, 'critdmgup', 8.0, { val: 0.30 });
          B.applyStatus(u, u, 'ccimmune', 4.0);
          B.energy(u, 35);
          B.fxFloatIcon(u.x, u.y - 120, '🥊 UNBRIDLED STRENGTH', '#ff8fa3');
        });

        let hits = 0;
        B.on(u, 'basicHit', ev => {
          if (++hits % 4) return;
          const t = ev && ev.target; if (!t || !t.alive) return;
          B.fxFloatIcon(u.x, u.y - 120, '👊 BEAT RUSH', '#ff8fa3');
          B.applyStatus(u, t, 'defdown', 6, { val: 0.25 });
          for (let i = 0; i < 7; i++) B.after(0.06 + i * 0.08, () => {
            if (!u.alive || !t.alive) return;
            B.damage(u, t, u.st.atk * (0.80 + lvl * 0.12), { type: 'physical', tag: 'Beat Rush', melee: true });
            Sound.play(i === 6 ? 'hit_heavy' : 'hit_light', { vol: 0.45, throttle: 0 });
            B.fxSparkle(t.x, t.y - 45, 4, '#ff8fa3');
          });
        });

        B.on(u, 'dodged', () => {
          B.cleanse(u, 2);
          B.applyStatus(u, u, 'ccimmune', 3.0);
        });

        B.on(u, 'cast', ev => {
          if (ev.key === 'W') {
            B.after(2.0, () => {
              if (!u.alive) return;
              B.heal(u, u, u.max.hp * (0.16 + lvl * 0.04), { tag: 'Second Wind' });
              B.shield(u, u, u.max.hp * 0.20, 6);
              B.cleanse(u, 99);
              Sound.play('heal', { vol: 0.5 });
              B.fxFloatIcon(u.x, u.y - 130, '💗 SECOND WIND', '#ff8fa3');
            });
          }
        });
      }
    });
  }

  /* =========================================================================
     15. AERITH — Pink Ribbon (ff7_aerith_ribbon)
     ========================================================================= */
  if (BADGES.ff7_aerith_ribbon) {
    Object.assign(BADGES.ff7_aerith_ribbon, {
      stat: lvl => `+${(18 + lvl * 6).toFixed(0)}% Magic Attack · +${(18 + lvl * 6).toFixed(0)}% Magic Defense · +${(15 + lvl * 5).toFixed(0)}% Skill Haste`,
      effect: "The legendary Ribbon grants Aerith complete immunity to all Crowd Control (Stun, Silence, Charm, Sleep, Fear, Blind)! Shares 20% of Aerith's Magic Defense and Magic Attack with all allies. At wave start: invokes Planet's Protection, healing the whole team for 20%+ Max HP, granting 35 Energy, and cleansing all debuffs. Every spell cast grants allies Fortify and shields the most injured ally.",
      apply(u, B, lvl) {
        u.flat.magP = (u.flat.magP || 0) + 0.18 + lvl * 0.06;
        u.flat.mdefP = (u.flat.mdefP || 0) + 0.18 + lvl * 0.06;
        u.flat.cdr = (u.flat.cdr || 0) + 0.15 + lvl * 0.05;
        u.dirty = true;

        // Permanent CC Immunity via status guard
        u.guards = u.guards || [];
        u.guards.push((id, def) => {
          if (def && def.cc) return true;
          return false;
        });

        const planetsProtection = () => {
          if (!u.alive) return;
          Sound.play('heal', { vol: 0.55 });
          Sound.play('sparkle', { vol: 0.45 });
          B.flash('#ffb3d9', 0.25, 0.25);
          B.alliesOf(u).filter(a => a.alive).forEach(a => {
            B.heal(u, a, a.max.hp * (0.18 + lvl * 0.04), { tag: "Planet's Protection" });
            B.cleanseAll(a);
            B.energy(a, 35);
            B.applyStatus(u, a, 'statshare', 999, { val: 0.18 + lvl * 0.03 });
            B.fxSparkle(a.x, a.y - 45, 8, '#ffb3d9');
          });
          B.fxRing(u.x, u.y - 40, 260, '#ffb3d9', 0.6);
          B.fxFloatIcon(u.x, u.y - 130, "🌸 PLANET'S PROTECTION", '#ffb3d9');
        };

        onWaveAndStart(u, B, planetsProtection);

        B.on(u, 'cast', ev => {
          B.after(0.3, () => {
            if (!u.alive) return;
            const allies = B.alliesOf(u).filter(a => a.alive);
            allies.forEach(a => {
              B.heal(u, a, a.max.hp * (0.10 + lvl * 0.02), { tag: 'Planetary Blessing' });
              B.cleanse(a, 1);
              B.applyStatus(u, a, 'fortify', 8, { stacks: 2 });
            });
            const low = B.lowestHp(allies);
            if (low) B.shield(u, low, low.max.hp * 0.16, 6);
          });
        });
      }
    });
  }

  /* =========================================================================
     16. CAIT SITH — Moogle Megaphone (ff7_caitsith_megaphone)
     ========================================================================= */
  if (BADGES.ff7_caitsith_megaphone) {
    Object.assign(BADGES.ff7_caitsith_megaphone, {
      stat: lvl => `+${(16 + lvl * 6).toFixed(0)}% Skill Haste · +${(18 + lvl * 6).toFixed(0)}% Magic Attack · +${(14 + lvl * 5).toFixed(0)}% Evasion`,
      effect: "The Moogle rolls triple 7s for catastrophic casino luck! At wave start: guarantees a 777 Jackpot, granting all allies 35 Energy, +30% Skill Haste, a 20%+ Max HP Shield, and sharing 20% Skill Haste to the team. Lucky Jackpot blasts all enemies for 250%+ Magic Attack, dispels 2 enemy buffs, cracks 35% of enemy shields, and Silences them for 3s.",
      apply(u, B, lvl) {
        u.flat.cdr = (u.flat.cdr || 0) + 0.16 + lvl * 0.06;
        u.flat.magP = (u.flat.magP || 0) + 0.18 + lvl * 0.06;
        u.flat.evaP = (u.flat.evaP || 0) + 0.14 + lvl * 0.05;
        u.dirty = true;

        const rollJackpot = () => {
          if (!u.alive) return;
          Sound.play('coin', { vol: 0.55 });
          Sound.play('cheer_big', { vol: 0.5 });
          B.flash('#ffd166', 0.3, 0.3);
          B.shake(12, 0.35);
          B.alliesOf(u).filter(a => a.alive).forEach(a => {
            B.energy(a, 35);
            B.applyStatus(u, a, 'haste', 7);
            B.shield(u, a, a.max.hp * (0.18 + lvl * 0.04), 7);
            B.reduceCd(a, 3.5);
            B.applyStatus(u, a, 'statshare', 999, { val: 0.18 });
            B.fxSparkle(a.x, a.y - 45, 8, '#ffd166');
          });
          B.enemiesOf(u).filter(e => e.alive).forEach(e => {
            B.damage(u, e, u.st.mag * (2.2 + lvl * 0.4), { type: 'magic', tag: 'Jackpot' });
            B.dispel(e, 2);
            B.crackShield(u, e, 0.35);
            B.applyStatus(u, e, 'silence', 3.0);
          });
          B.fxRing(u.x, u.y - 40, 300, '#ffd166', 0.65);
          B.fxFloatIcon(u.x, u.y - 130, '🎰 777 JACKPOT!', '#ffd166');
        };

        onWaveAndStart(u, B, rollJackpot);

        B.on(u, 'cast', ev => {
          if (ev.key === 'W' || Math.random() < 0.35) rollJackpot();
        });
      }
    });
  }

  /* =========================================================================
     17. VEE — Shelly's Upgrade Chip (vee_shelly)
     ========================================================================= */
  if (BADGES.vee_shelly) {
    Object.assign(BADGES.vee_shelly, {
      stat: lvl => `+${(16 + lvl * 6).toFixed(0)}% Magic Attack · +${(14 + lvl * 5).toFixed(0)}% Magic Penetration · +${(14 + lvl * 5).toFixed(0)}% Skill Haste`,
      effect: "Shelly's amber resin overclocks Vee's broadcasting antenna! At wave start: immediately marks the primary threat as Headline, grants Vee Prime Time (+40% Magic Attack & +30% Attack Speed for 8s), and shares 18% of her Magic Attack with backline allies. Amber Beams pierce the Headline for 160%+ Magic Damage, crack 30% of its Shield, stun/fossilize for 1.5s, and send pulses to 2 other foes. Defeating the Headline cleanses the party and refills 30 Energy.",
      apply(u, B, lvl) {
        u.flat.magP = (u.flat.magP || 0) + 0.16 + lvl * 0.06;
        u.flat.magPen = (u.flat.magPen || 0) + 0.14 + lvl * 0.05;
        u.flat.cdr = (u.flat.cdr || 0) + 0.14 + lvl * 0.05;
        u.dirty = true;
        const AMBER = '#ffb347';
        const headline = () => B.enemiesOf(u).find(e => e.alive && e.hasStatus && e.hasStatus('headline')) || B.enemiesOf(u)[0];

        onWaveAndStart(u, B, () => {
          const t = headline();
          if (t) {
            B.applyStatus(u, t, 'headline', 999);
            B.applyStatus(u, t, 'slow', 6.0, { val: 0.30 });
          }
          B.applyStatus(u, u, 'atkup', 8, { val: 0.40 });
          B.applyStatus(u, u, 'haste', 8);
          applyTeamStatShare(u, B, 'mag', 0.18 + lvl * 0.02);
          B.fxFloatIcon(u.x, u.y - 110, '📺 PRIME TIME', AMBER);
        });

        B.on(u, 'cast', ev => {
          if (!u.alive || (ev.key !== 'W' && ev.key !== 'G')) return;
          const t = headline();
          if (!t) return;
          B.after(0.3, () => {
            if (!u.alive || !t.alive) return;
            B.damage(u, t, u.st.mag * (1.1 + lvl * 0.25), { type: 'magic', chained: true, tag: 'Amber Beam' });
            B.crackShield(u, t, 0.30);
            B.dispel(t, 2);
            B.applyStatus(u, t, 'stun', 1.5);
            Sound.play('laser_hit', { vol: 0.45, throttle: 120 });
            B.fxFloatIcon(t.x, t.y - 105, '🔶 FOSSILIZED', AMBER);
          });
        });

        B.on(u, 'kill', () => {
          B.alliesOf(u).forEach(a => { B.cleanse(a, 2); B.energy(a, 30); });
        });
      }
    });
  }

  /* =========================================================================
     18. DYLE — Shrimpo's Whistle (dyle_shrimpo)
     ========================================================================= */
  if (BADGES.dyle_shrimpo) {
    Object.assign(BADGES.dyle_shrimpo, {
      stat: lvl => `+${(18 + lvl * 6).toFixed(0)}% Armor Penetration · +${(16 + lvl * 6).toFixed(0)}% Attack · +${(14 + lvl * 5).toFixed(0)}% Defense`,
      effect: "Shrimpo's conductor whistle commands absolute railway track discipline! At wave start: blows the whistle, stunning all enemies for 2s, interrupting channeled abilities, stripping 2 buffs, and marking the highest-Attack foe with Rail Marker. Dyle gains 5s CC Immunity at wave start. Damaging the marked target deals 160%+ Attack True Damage, permanently shreds 30% Armor, and boosts Dyle's Attack Speed by 40%.",
      apply(u, B, lvl) {
        u.flat.armorPen = (u.flat.armorPen || 0) + 0.18 + lvl * 0.06;
        u.flat.atkP = (u.flat.atkP || 0) + 0.16 + lvl * 0.06;
        u.flat.defP = (u.flat.defP || 0) + 0.14 + lvl * 0.05;
        u.dirty = true;

        const blowWhistle = () => {
          if (!u.alive) return;
          Sound.play('warn', { vol: 0.5 });
          Sound.play('steam', { vol: 0.6 });
          B.shake(8, 0.3);
          B.applyStatus(u, u, 'ccimmune', 5.0);
          B.enemiesOf(u).filter(e => e.alive).forEach(e => {
            B.applyStatus(u, e, 'stun', 2.0);
            B.interrupt(e);
            B.dispel(e, 2);
            B.fxFloatIcon(e.x, e.y - 95, '🚨 ALL ABOARD!', '#ffce54');
          });
          const target = B.highestStat(B.enemiesOf(u), 'atk');
          if (target) {
            B.applyStatus(u, target, 'railmarker', 999);
            B.applyStatus(u, target, 'defdown', 8, { val: 0.30 });
          }
          B.fxFloatIcon(u.x, u.y - 110, '🚂 RAIL DISCIPLINE', '#ffce54');
        };

        onWaveAndStart(u, B, blowWhistle);

        B.on(u, 'dealDamage', ev => {
          if (ev.target && ev.target.hasStatus && ev.target.hasStatus('railmarker')) {
            ev.amount += u.st.atk * (0.60 + lvl * 0.20);
            B.applyStatus(u, u, 'haste', 4.0);
            B.energy(u, 15);
          }
        });
      }
    });
  }

  /* =========================================================================
     19. SQUIRM — Cocoa's Emergency Bonbon (squirm_cocoa)
     ========================================================================= */
  if (BADGES.squirm_cocoa) {
    Object.assign(BADGES.squirm_cocoa, {
      stat: lvl => `+${(18 + lvl * 6).toFixed(0)}% Max HP · +${(16 + lvl * 6).toFixed(0)}% Healing Received · +${(14 + lvl * 5).toFixed(0)}% Defense`,
      effect: "Cocoa's soothing treat converts panic into fortified courage! Shares 20% of Squirm's Max HP with the weakest ally. At wave start and when CC'd: consumes an Emergency Bonbon, cleansing all CC and debuffs, gaining 4s CC Immunity, an 18%+ Max HP Shield, and scattering crumbs that give all allies +30% Move Speed and a 15% Max HP Shield. Flailing deals 15% Max HP True Damage to attackers.",
      apply(u, B, lvl) {
        u.flat.hpP = (u.flat.hpP || 0) + 0.18 + lvl * 0.06;
        u.flat.healRecv = (u.flat.healRecv || 0) + 0.16 + lvl * 0.06;
        u.flat.defP = (u.flat.defP || 0) + 0.14 + lvl * 0.05;
        u.dirty = true;

        const eatBonbon = () => {
          if (!u.alive) return;
          Sound.play('crunch', { vol: 0.45 });
          B.cleanseAll(u);
          B.applyStatus(u, u, 'ccimmune', 4.0);
          B.shield(u, u, u.max.hp * (0.20 + lvl * 0.05), 6);
          B.alliesOf(u).forEach(a => {
            B.shield(u, a, a.max.hp * 0.15, 6);
            B.applyStatus(u, a, 'speedup', 5.0);
            B.applyStatus(u, a, 'statshare', 999, { val: 0.18 });
          });
          B.fxFloatIcon(u.x, u.y - 110, '🍬 EMERGENCY BONBON', '#f4a460');
        };

        onWaveAndStart(u, B, eatBonbon);

        B.on(u, 'damaged', ev => {
          if (!ev.src || ev.src.team === u.team || !ev.src.alive) return;
          if (B.t < (u._squirmFlailAt || 0)) return;
          u._squirmFlailAt = B.t + 2.5;
          B.damage(u, ev.src, u.max.hp * 0.12, { type: 'true', tag: 'Panic Flail' });
          B.fxSparkle(ev.src.x, ev.src.y - 40, 6, '#f4a460');
        });
      }
    });
  }

  /* =========================================================================
     20. FINN — Shelly's Fossil Hook (finn_shelly)
     ========================================================================= */
  if (BADGES.finn_shelly) {
    Object.assign(BADGES.finn_shelly, {
      stat: lvl => `+${(18 + lvl * 6).toFixed(0)}% Control Duration · +${(16 + lvl * 6).toFixed(0)}% Magic Damage · +${(14 + lvl * 5).toFixed(0)}% Magic Penetration`,
      effect: "Shelly's barbed fossil hook rips open enemy defensive lines! At wave start: a tidal undertow pulls backline foes forward, dispels 2 buffs from all enemies, and silences them for 3s. Splashed enemies suffer 30% Magic Defense shred and take 35% amplified Magic Damage for 8s. Shares 18% of Finn's Magic Attack with all allies.",
      apply(u, B, lvl) {
        u.flat.ccDur = (u.flat.ccDur || 0) + 0.18 + lvl * 0.06;
        u.flat.magP = (u.flat.magP || 0) + 0.16 + lvl * 0.06;
        u.flat.magPen = (u.flat.magPen || 0) + 0.14 + lvl * 0.05;
        u.dirty = true;

        const tidalPull = () => {
          if (!u.alive) return;
          Sound.play('splash', { vol: 0.55 });
          B.enemiesOf(u).filter(e => e.alive).forEach(e => {
            B.dispel(e, 2);
            B.applyStatus(u, e, 'silence', 3.0);
            B.applyStatus(u, e, 'mdefdown', 8, { val: 0.30 });
            B.knockback(u, e, -70);
            B.fxFloatIcon(e.x, e.y - 95, '⚓ HOOKED & SILENCED', '#5bc0be');
          });
          applyTeamStatShare(u, B, 'mag', 0.18 + lvl * 0.02);
          B.fxFloatIcon(u.x, u.y - 110, '🌊 TIDAL HOOK', '#5bc0be');
        };

        onWaveAndStart(u, B, tidalPull);

        B.on(u, 'dealDamage', ev => {
          if (ev.target && ev.target.team !== u.team && ev.type === 'magic') {
            ev.amount *= 1.35;
          }
        });
      }
    });
  }

  /* =========================================================================
     21. SCRAPS — Yatta's Signed Marker (scraps_yatta)
     ========================================================================= */
  if (BADGES.scraps_yatta) {
    Object.assign(BADGES.scraps_yatta, {
      stat: lvl => `+${(18 + lvl * 6).toFixed(0)}% Attack · +${(16 + lvl * 6).toFixed(0)}% Armor Penetration · +${(14 + lvl * 5).toFixed(0)}% Attack Speed`,
      effect: "Yatta's vibrant graffiti marker turns Scraps' craft projects into fiery festival bursts! At wave start: gains Craft Frenzy (+40% Attack Speed and +30% Attack for 8s) and shares 18% Attack with allies. Craft hits burst into festive fireworks dealing 160%+ Attack Physical Damage and burning enemies for 4% Max HP True Damage per second for 5s.",
      apply(u, B, lvl) {
        u.flat.atkP = (u.flat.atkP || 0) + 0.18 + lvl * 0.06;
        u.flat.armorPen = (u.flat.armorPen || 0) + 0.16 + lvl * 0.06;
        u.flat.aspdP = (u.flat.aspdP || 0) + 0.14 + lvl * 0.05;
        u.dirty = true;

        onWaveAndStart(u, B, () => {
          B.applyStatus(u, u, 'haste', 8.0);
          B.applyStatus(u, u, 'atkup', 8.0, { val: 0.30 });
          applyTeamStatShare(u, B, 'atk', 0.18 + lvl * 0.02);
          B.fxFloatIcon(u.x, u.y - 110, '🎉 GRAFFITI BURST', '#ff6b6b');
        });

        B.on(u, 'dealDamage', ev => {
          if (!ev.target || ev.target.team === u.team || !ev.target.alive || ev.dot) return;
          if (B.t < (u._graffitiBurstAt || 0)) return;
          u._graffitiBurstAt = B.t + 2.5;
          Sound.play('fireworks', { vol: 0.45 });
          B.enemiesOf(u).filter(e => e.alive && Math.abs(e.x - ev.target.x) < 180).forEach(e => {
            B.damage(u, e, u.st.atk * (1.0 + lvl * 0.25), { type: 'physical', tag: 'Graffiti Burst' });
            B.damage(u, e, e.max.hp * 0.04, { type: 'true', dot: true, tag: 'Festival Burn' });
            B.fxSparkle(e.x, e.y - 40, 8, '#ff6b6b');
          });
        });
      }
    });
  }

  /* =========================================================================
     22. SCRAPS — Poppy's Painted Claw Caps (scraps_poppy)
     ========================================================================= */
  if (BADGES.scraps_poppy) {
    Object.assign(BADGES.scraps_poppy, {
      stat: lvl => `+${(18 + lvl * 6).toFixed(0)}% Attack · +${(16 + lvl * 5).toFixed(0)}% Shield Power · +${(14 + lvl * 5).toFixed(0)}% Max HP`,
      effect: "Poppy's painted caps weave seamless bubble stitching around the party! At wave start and on Crafty Grapple: grants all allies a Bubble Stitch Shield (22%+ Max HP), cleanses debuffs, grants Speed Up, and shares 18% of Scraps' Attack with the team. While shielded, craft attacks unleash Painted Pop, dealing 150%+ Attack Physical Damage, stripping 1 buff, and inflicting Exposed (+25% damage taken).",
      apply(u, B, lvl) {
        u.flat.atkP = (u.flat.atkP || 0) + 0.18 + lvl * 0.06;
        u.flat.shieldPowP = (u.flat.shieldPowP || 0) + 0.16 + lvl * 0.05;
        u.flat.hpP = (u.flat.hpP || 0) + 0.14 + lvl * 0.05;
        u.dirty = true;

        const bubbleStitch = () => {
          if (!u.alive) return;
          Sound.play('bounce', { vol: 0.38, throttle: 180 });
          B.fxRing(u.x, u.y - 40, 200, '#8de8ef', 0.45);
          B.alliesOf(u).filter(a => a.alive).forEach(a => {
            B.shield(u, a, u.max.hp * (0.20 + lvl * 0.05), 8);
            B.cleanse(a, 2);
            B.applyStatus(u, a, 'speedup', 6);
            B.applyStatus(u, a, 'statshare', 999, { val: 0.18 });
            B.fxSparkle(a.x, a.y - 40, 8, '#8de8ef');
          });
          B.fxFloatIcon(u.x, u.y - 110, '🫧 BUBBLE STITCH', '#8de8ef');
        };

        onWaveAndStart(u, B, bubbleStitch);

        B.on(u, 'cast', ev => {
          if (ev && ev.key === 'W') bubbleStitch();
        });

        B.on(u, 'dealDamage', ev => {
          if (!ev || !ev.target || !ev.target.alive || ev.target.team === u.team || ev.dot) return;
          if (B.t < (u._paintedPopAt || 0)) return;
          u._paintedPopAt = B.t + 3.0;
          const center = ev.target;
          B.enemiesOf(u).filter(e => e.alive && B.distance(e, center) <= 160).forEach(e => {
            B.damage(u, e, u.st.atk * (1.1 + lvl * 0.25), { type: 'physical', area: true, tag: 'Painted Pop' });
            B.dispel(e, 1);
            B.applyStatus(u, e, 'exposed', 6);
          });
          B.fxFloatIcon(center.x, center.y - 100, '💅 PAINTED POP', '#8de8ef');
        });
      }
    });
  }

  /* =========================================================================
     23. WAXWELL — Soulvester's Dungeon Key (waxwell_soulvester)
     ========================================================================= */
  if (BADGES.waxwell_soulvester) {
    Object.assign(BADGES.waxwell_soulvester, {
      stat: lvl => `+${(18 + lvl * 6).toFixed(0)}% Magic Attack · +${(16 + lvl * 5).toFixed(0)}% Skill Haste · +${(14 + lvl * 5).toFixed(0)}% Defense`,
      effect: "Soulvester's iron key forges melting wax into an impenetrable molten fortress! At wave start: slams down prison gates, rooting all enemies for 2.5s, applying Lit Up, and granting Waxwell a 25%+ Max HP Molten Shield. Waxwell cannot be Slowed or Silenced. Burning enemies suffer 30% Magic Defense reduction and take 40% amplified damage over time.",
      apply(u, B, lvl) {
        u.flat.magP = (u.flat.magP || 0) + 0.18 + lvl * 0.06;
        u.flat.cdr = (u.flat.cdr || 0) + 0.16 + lvl * 0.05;
        u.flat.defP = (u.flat.defP || 0) + 0.14 + lvl * 0.05;
        u.dirty = true;

        const gateSlam = () => {
          if (!u.alive) return;
          Sound.play('metal_clang', { vol: 0.5 });
          B.enemiesOf(u).filter(e => e.alive).forEach(e => {
            B.applyStatus(u, e, 'root', 2.5);
            B.applyStatus(u, e, 'litup', 6.0);
            B.applyStatus(u, e, 'mdefdown', 8.0, { val: 0.30 });
            B.damage(u, e, u.st.mag * (0.8 + lvl * 0.2), { type: 'magic', tag: 'Molten Gate' });
            B.fxFloatIcon(e.x, e.y - 95, '⛓️ IMPRISONED', '#ff9f43');
          });
          B.shield(u, u, u.max.hp * (0.24 + lvl * 0.05), 8);
          applyTeamStatShare(u, B, 'mag', 0.18);
          B.fxFloatIcon(u.x, u.y - 110, '🕯️ MOLTEN KEY', '#ff9f43');
        };

        onWaveAndStart(u, B, gateSlam);

        B.on(u, 'dealDamage', ev => {
          if (ev.target && ev.target.hasStatus && ev.target.hasStatus('litup')) {
            ev.amount *= 1.40;
          }
        });
      }
    });
  }

  /* =========================================================================
     24. YATTA — Looey's Repaired Ribbon (yatta_looey)
     ========================================================================= */
  if (BADGES.yatta_looey) {
    Object.assign(BADGES.yatta_looey, {
      stat: lvl => `+${(18 + lvl * 6).toFixed(0)}% Critical Hit Chance · +${(16 + lvl * 5).toFixed(0)}% Movement Speed · +${(14 + lvl * 5).toFixed(0)}% Attack`,
      effect: "Looey's balloon ribbon gives Yatta dazzling circus acrobatic flair! At wave start: leaps into the arena, dazzling all enemies (Blinding them and reducing Accuracy by 30% for 6s), while granting Yatta +40% Critical Damage and +25% Attack for 8s. Critical hits unleash festive confetti fireworks, striking up to 3 nearby foes for 120%+ Attack damage and restoring 12 Energy.",
      apply(u, B, lvl) {
        u.flat.crit = (u.flat.crit || 0) + 0.18 + lvl * 0.06;
        u.flat.msP = (u.flat.msP || 0) + 0.16 + lvl * 0.05;
        u.flat.atkP = (u.flat.atkP || 0) + 0.14 + lvl * 0.05;
        u.dirty = true;

        onWaveAndStart(u, B, () => {
          B.enemiesOf(u).filter(e => e.alive).forEach(e => {
            B.applyStatus(u, e, 'blind', 5.0);
            B.applyStatus(u, e, 'acc_down', 6.0, { val: 0.30 });
          });
          B.applyStatus(u, u, 'critdmgup', 8.0, { val: 0.40 });
          B.applyStatus(u, u, 'atkup', 8.0, { val: 0.25 });
          applyTeamStatShare(u, B, 'spd', 0.18);
          B.fxFloatIcon(u.x, u.y - 110, '🎪 CIRCUS ENTRANCE', '#ff78ae');
        });

        B.on(u, 'dealDamage', ev => {
          if (!ev.target || ev.target.team === u.team || !ev.target.alive || !ev.crit) return;
          if (B.t < (u._confettiBurstAt || 0)) return;
          u._confettiBurstAt = B.t + 2.0;
          B.enemiesOf(u).filter(e => e.alive && e !== ev.target).slice(0, 3).forEach(e => {
            B.damage(u, e, u.st.atk * (0.9 + lvl * 0.25), { type: 'physical', tag: 'Confetti Pop' });
            B.fxSparkle(e.x, e.y - 40, 6, '#ff78ae');
          });
          B.energy(u, 12);
        });
      }
    });
  }

  /* =========================================================================
     25. JESSIE — Shrimpo's Hater Megaphone (jessie_shrimpo)
     ========================================================================= */
  if (BADGES.jessie_shrimpo) {
    Object.assign(BADGES.jessie_shrimpo, {
      stat: lvl => `+${(18 + lvl * 6).toFixed(0)}% Skill Power · +${(16 + lvl * 5).toFixed(0)}% Evasion · +${(14 + lvl * 5).toFixed(0)}% Attack`,
      effect: "Shrimpo's hater megaphone transforms insults into concussive acoustic shockwaves! At wave start: blasts the megaphone, taunting nearest foes, granting Jessie 4 Attention stacks, +35% Skill Haste, and a 25%+ Max HP barrier. Reflected damage deals 200%+ Magic True Damage and shreds 25% enemy defenses. Shares 20% of Jessie's Skill Power with the highest-Attack ally.",
      apply(u, B, lvl) {
        u.flat.magP = (u.flat.magP || 0) + 0.18 + lvl * 0.06;
        u.flat.evaP = (u.flat.evaP || 0) + 0.16 + lvl * 0.05;
        u.flat.atkP = (u.flat.atkP || 0) + 0.14 + lvl * 0.05;
        u.dirty = true;

        onWaveAndStart(u, B, () => {
          B.shield(u, u, u.max.hp * (0.22 + lvl * 0.05), 8);
          B.applyStatus(u, u, 'haste', 8.0);
          B.applyStatus(u, u, 'attention', 999, { stacks: 4 });
          const nearest = B.enemiesOf(u).filter(e => e.alive).sort((a, b) => B.distance(a, u) - B.distance(b, u))[0];
          if (nearest) B.applyStatus(u, nearest, 'taunt', 4.0);
          const topAlly = B.highestStat(B.alliesOf(u).filter(a => a !== u), 'atk');
          if (topAlly) B.applyStatus(u, topAlly, 'statshare', 999, { val: 0.20 });
          B.fxFloatIcon(u.x, u.y - 110, '📢 HATER BROADCAST', '#ff4757');
        });

        B.on(u, 'damaged', ev => {
          if (!ev.src || ev.src.team === u.team || !ev.src.alive) return;
          B.damage(u, ev.src, (ev.amount || 100) * (1.5 + lvl * 0.3), { type: 'true', tag: 'Acoustic Backlash' });
          B.applyStatus(u, ev.src, 'defdown', 6, { val: 0.25 });
        });
      }
    });
  }

  /* =========================================================================
     26. BASSIE — Shelly's Trilobite (bassie_shelly)
     ========================================================================= */
  if (BADGES.bassie_shelly) {
    Object.assign(BADGES.bassie_shelly, {
      stat: lvl => `+${(18 + lvl * 6).toFixed(0)}% Shield Power · +${(18 + lvl * 6).toFixed(0)}% Max HP · +${(14 + lvl * 5).toFixed(0)}% Defense`,
      effect: "Shelly's ancient fossil reinforces Bassie's pack into an impenetrable prehistoric bunker! Shares 20% of Bassie's Max HP with the entire team. At wave start: distributes Prehistoric Supplies granting all allies a 22%+ Max HP Trilobite Shield, 30 Energy, and 4s CC Immunity. Once per battle, prevents lethal damage on any ally and restores them to 25% Max HP.",
      apply(u, B, lvl) {
        u.flat.shieldPowP = (u.flat.shieldPowP || 0) + 0.18 + lvl * 0.06;
        u.flat.hpP = (u.flat.hpP || 0) + 0.18 + lvl * 0.06;
        u.flat.defP = (u.flat.defP || 0) + 0.14 + lvl * 0.05;
        u.dirty = true;

        const distributeSupplies = () => {
          if (!u.alive) return;
          Sound.play('get_rare', { vol: 0.45 });
          B.alliesOf(u).filter(a => a.alive).forEach(a => {
            B.shield(u, a, u.max.hp * (0.20 + lvl * 0.05), 8);
            B.energy(a, 30);
            B.cleanse(a, 2);
            B.applyStatus(u, a, 'ccimmune', 4.0);
            B.applyStatus(u, a, 'statshare', 999, { val: 0.18 + lvl * 0.02 });
            B.fxSparkle(a.x, a.y - 40, 8, '#7bed9f');
          });
          B.fxFloatIcon(u.x, u.y - 110, '🦴 PREHISTORIC PACK', '#7bed9f');
        };

        onWaveAndStart(u, B, distributeSupplies);

        B.on(u, 'allyLethal', ev => {
          if (u._trilobiteSaveUsed || !u.alive || !ev.unit || ev.unit.team !== u.team) return;
          u._trilobiteSaveUsed = true;
          ev.prevented = true;
          ev.unit.hp = Math.max(1, ev.unit.max.hp * 0.25);
          B.shield(u, ev.unit, ev.unit.max.hp * 0.30, 8);
          B.applyStatus(u, ev.unit, 'ccimmune', 4.0);
          Sound.play('revival', { vol: 0.6 });
          B.fxFloatIcon(ev.unit.x, ev.unit.y - 105, '🦴 FOSSIL RESCUE!', '#7bed9f');
        });
      }
    });
  }

  /* =========================================================================
     27. ECLIPSE — Pebble's Pack Tag (eclipse_pebble)
     ========================================================================= */
  if (BADGES.eclipse_pebble) {
    Object.assign(BADGES.eclipse_pebble, {
      stat: lvl => `+${(18 + lvl * 6).toFixed(0)}% Attack Speed · +${(16 + lvl * 5).toFixed(0)}% Evasion · +${(14 + lvl * 5).toFixed(0)}% Critical Hit Chance`,
      effect: "Pebble's loyal pack bond echoes through the shadowed arena! At wave start: enters Blackout immediately with +45% Attack Speed and +30% Evasion for 8s. Basic attacks shred 25% Armor, siphon 10 Energy, and deal bonus physical damage equal to 12%+ missing enemy HP. Dodging restores 15 Energy and slashes nearby enemies.",
      apply(u, B, lvl) {
        u.flat.aspdP = (u.flat.aspdP || 0) + 0.18 + lvl * 0.06;
        u.flat.evaP = (u.flat.evaP || 0) + 0.16 + lvl * 0.05;
        u.flat.crit = (u.flat.crit || 0) + 0.14 + lvl * 0.05;
        u.dirty = true;

        onWaveAndStart(u, B, () => {
          B.applyStatus(u, u, 'haste', 8.0);
          B.applyStatus(u, u, 'blackout', 8.0);
          B.energy(u, 30);
          applyTeamStatShare(u, B, 'spd', 0.18);
          B.fxFloatIcon(u.x, u.y - 110, '🌑 BLACKOUT SURGE', '#2ed573');
        });

        B.on(u, 'dealDamage', ev => {
          if (!ev.target || ev.target.team === u.team || !ev.target.alive) return;
          const missing = Math.max(0, ev.target.max.hp - ev.target.hp);
          ev.amount += missing * (0.08 + lvl * 0.02);
          B.applyStatus(u, ev.target, 'defdown', 6, { val: 0.25 });
          B.energy(u, 10);
        });
      }
    });
  }

  /* =========================================================================
     28. BRUSHA — Tisha's Color Coded Ruler (brusha_tisha)
     ========================================================================= */
  if (BADGES.brusha_tisha) {
    Object.assign(BADGES.brusha_tisha, {
      stat: lvl => `+${(18 + lvl * 6).toFixed(0)}% Accuracy · +${(18 + lvl * 6).toFixed(0)}% Magic Attack · +${(14 + lvl * 5).toFixed(0)}% Magic Penetration`,
      effect: "Tisha's color-coded ruler aligns Brusha's strokes into geometrically lethal precision! At wave start: cleanses all debuffs from allies, gives the team +30% Accuracy and Cleanstep. Attacks cleave in straight geometric lines, ignoring 35% of Magic Defense, shattering shields, and dealing True Damage to all foes on the canvas line.",
      apply(u, B, lvl) {
        u.flat.accP = (u.flat.accP || 0) + 0.18 + lvl * 0.06;
        u.flat.magP = (u.flat.magP || 0) + 0.18 + lvl * 0.06;
        u.flat.magPen = (u.flat.magPen || 0) + 0.14 + lvl * 0.05;
        u.dirty = true;

        onWaveAndStart(u, B, () => {
          B.alliesOf(u).forEach(a => {
            B.cleanseAll(a);
            B.applyStatus(u, a, 'accup', 8, { val: 0.30 });
            B.applyStatus(u, a, 'statshare', 999, { val: 0.18 });
          });
          B.fxFloatIcon(u.x, u.y - 110, '📏 GEOMETRIC ALIGNMENT', '#1e90ff');
        });

        B.on(u, 'dealDamage', ev => {
          if (ev.target && ev.target.team !== u.team) {
            B.crackShield(u, ev.target, 0.30);
            ev.amount *= 1.25;
          }
        });
      }
    });
  }

  /* =========================================================================
     29. TISHA — Blot's Squeaky Wheel (tisha_blot)
     ========================================================================= */
  if (BADGES.tisha_blot) {
    Object.assign(BADGES.tisha_blot, {
      stat: lvl => `+${(18 + lvl * 6).toFixed(0)}% Control Duration · +${(16 + lvl * 5).toFixed(0)}% Skill Haste · +${(14 + lvl * 5).toFixed(0)}% Movement Speed`,
      effect: "Tisha's spotless cleaning regimen keeps the entire team grounded and enemies on ice! The team is completely immune to Knockback. At wave start: cleans the stage with Squeaky Soap, granting all allies +30% Move Speed and cleansing debuffs, while enemies slip and are knocked down for 2s. Enemies walking over the soapy slick have their buffs stripped.",
      apply(u, B, lvl) {
        B.grantTeamKnockbackImmunity(u);
        u.flat.ccDur = (u.flat.ccDur || 0) + 0.18 + lvl * 0.06;
        u.flat.cdr = (u.flat.cdr || 0) + 0.16 + lvl * 0.05;
        u.flat.msP = (u.flat.msP || 0) + 0.14 + lvl * 0.05;
        u.dirty = true;

        onWaveAndStart(u, B, () => {
          B.alliesOf(u).forEach(a => {
            B.cleanse(a, 2);
            B.applyStatus(u, a, 'speedup', 7);
          });
          B.enemiesOf(u).filter(e => e.alive).forEach(e => {
            B.dispel(e, 2);
            B.applyStatus(u, e, 'stun', 2.0);
            B.applyStatus(u, e, 'slow', 5.0);
            B.fxFloatIcon(e.x, e.y - 95, '🧼 SLIPPED!', '#70a1ff');
          });
          B.fxFloatIcon(u.x, u.y - 110, '🧽 SQUEAKY CLEAN', '#70a1ff');
        });
      }
    });
  }

  /* =========================================================================
     30. TEAGAN — Rodger's Quiet Notes (rodger_teagan)
     ========================================================================= */
  if (BADGES.rodger_teagan) {
    Object.assign(BADGES.rodger_teagan, {
      stat: lvl => `+${(18 + lvl * 6).toFixed(0)}% Skill Haste · +${(18 + lvl * 6).toFixed(0)}% Magic Attack · +${(14 + lvl * 5).toFixed(0)}% Magic Penetration`,
      effect: "Teagan studies Rodger's investigative dossiers to dismantle enemy schemes! At wave start: investigates the entire enemy formation, cutting their Magic Defense by 30% and delaying enemy skills. Investigated enemies take 35% amplified Magic Damage. Teagan shares 20% of her Skill Haste with all allies.",
      apply(u, B, lvl) {
        u.flat.cdr = (u.flat.cdr || 0) + 0.18 + lvl * 0.06;
        u.flat.magP = (u.flat.magP || 0) + 0.18 + lvl * 0.06;
        u.flat.magPen = (u.flat.magPen || 0) + 0.14 + lvl * 0.05;
        u.dirty = true;

        onWaveAndStart(u, B, () => {
          B.enemiesOf(u).filter(e => e.alive).forEach(e => {
            B.applyStatus(u, e, 'investigated', 8.0);
            B.applyStatus(u, e, 'mdefdown', 8.0, { val: 0.30 });
            B.energy(e, -15);
          });
          applyTeamStatShare(u, B, 'cdr', 0.20 + lvl * 0.02);
          B.fxFloatIcon(u.x, u.y - 110, '📑 DOSSIER BRIEFING', '#a29bfe');
        });

        B.on(u, 'dealDamage', ev => {
          if (ev.target && ev.target.hasStatus && ev.target.hasStatus('investigated')) {
            ev.amount *= 1.35;
          }
        });
      }
    });
  }

  /* =========================================================================
     31. GIGI — Connie's Chaos Charm (gigi_connie)
     ========================================================================= */
  if (BADGES.gigi_connie) {
    Object.assign(BADGES.gigi_connie, {
      stat: lvl => `+${(18 + lvl * 6).toFixed(0)}% Skill Haste · +${(16 + lvl * 5).toFixed(0)}% Evasion · +${(14 + lvl * 5).toFixed(0)}% Magic Attack`,
      effect: "Connie's ghostly luck rigs Gigi's prize wheel with supernatural fortune! At wave start: grants 2 extra Wheel Tickets, +35% Magic Attack for 8s, and an 18%+ Max HP Spectral Shield. Spinning the wheel dispels 2 enemy buffs and heals all allies for 15% Max HP. Shares 18% Evasion with all allies.",
      apply(u, B, lvl) {
        u.flat.cdr = (u.flat.cdr || 0) + 0.18 + lvl * 0.06;
        u.flat.evaP = (u.flat.evaP || 0) + 0.16 + lvl * 0.05;
        u.flat.magP = (u.flat.magP || 0) + 0.14 + lvl * 0.05;
        u.dirty = true;

        onWaveAndStart(u, B, () => {
          u.gigiTickets = (u.gigiTickets || 0) + 2;
          B.applyStatus(u, u, 'atkup', 8, { val: 0.35 });
          B.shield(u, u, u.max.hp * (0.18 + lvl * 0.04), 8);
          applyTeamStatShare(u, B, 'eva', 0.18);
          B.fxFloatIcon(u.x, u.y - 110, '🎡 RIGGED WHEEL', '#fd79a8');
        });

        B.on(u, 'cast', ev => {
          if (ev.key === 'W') {
            B.enemiesOf(u).forEach(e => B.dispel(e, 2));
            B.alliesOf(u).forEach(a => B.heal(u, a, a.max.hp * 0.15, { tag: 'Wheel Fortune' }));
          }
        });
      }
    });
  }

  /* =========================================================================
     32. POPPY — Toodles' Magnifying Glass (poppy_toodles)
     ========================================================================= */
  if (BADGES.poppy_toodles) {
    Object.assign(BADGES.poppy_toodles, {
      stat: lvl => `+${(18 + lvl * 6).toFixed(0)}% Critical Hit Chance · +${(16 + lvl * 5).toFixed(0)}% Movement Speed · +${(14 + lvl * 5).toFixed(0)}% Attack`,
      effect: "Toodles' forensic lens exposes every enemy weakness through Poppy's bubbles! At wave start: bursts bubbles across the stage, dispelling all shields and buffs from enemies and applying Exposed (+30% damage taken) for 8s. Shares 20% Movement Speed and Critical Chance with all allies. Popping bubbles deals 120%+ Attack True Damage. Rescue bubble grants 22% Max HP shield, heal, and 4s CC Immunity.",
      apply(u, B, lvl) {
        u.flat.crit = (u.flat.crit || 0) + 0.18 + lvl * 0.06;
        u.flat.msP = (u.flat.msP || 0) + 0.16 + lvl * 0.05;
        u.flat.atkP = (u.flat.atkP || 0) + 0.14 + lvl * 0.05;
        u.dirty = true;

        const exposeLineup = () => {
          if (!u.alive) return;
          Sound.play('bubblepop', { vol: 0.5 });
          B.enemiesOf(u).filter(e => e.alive).forEach(e => {
            B.dispelAll(e);
            B.crackShield(u, e, 1.0);
            B.applyStatus(u, e, 'exposed', 8.0);
            B.applyStatus(u, e, 'weaken', 6.0, { val: 0.25 });
            B.fxFloatIcon(e.x, e.y - 95, '🔍 EXPOSED', '#ffe27a');
          });
          B.alliesOf(u).forEach(a => {
            B.applyStatus(u, a, 'statshare', 999, { val: 0.18 });
          });
          B.fxFloatIcon(u.x, u.y - 110, '🔍 FORENSIC SWEEP', '#ffe27a');
        };

        onWaveAndStart(u, B, exposeLineup);

        B.on(u, 'dealDamage', ev => {
          if (ev.target && ev.target.team !== u.team && ev.tag && ev.tag.includes('Bubble')) {
            ev.amount += u.st.atk * (0.8 + lvl * 0.2);
          }
        });

        B.on(u, 'allyDamaged', ev => {
          const a = ev.unit;
          if (!a || !a.alive || a.team !== u.team || B.t < (u._toodlesClueRescueAt || 0)) return;
          if (a.hpPct <= 0.45) {
            u._toodlesClueRescueAt = B.t + 8;
            Sound.play('get_rare', { vol: 0.48 });
            B.shield(u, a, u.max.hp * (0.22 + lvl * 0.05), 6);
            B.applyStatus(u, a, 'ccimmune', 4);
            B.heal(u, a, a.max.hp * (0.16 + lvl * 0.04), { tag: 'Clue Rescue' });
            B.energy(u, 35);
          }
        });
      }
    });
  }

  /* =========================================================================
     33. KRIS — Ralsei's Fluffy Scarf (kris_ralsei) [NEW BADGE]
     ========================================================================= */
  defBadge({
    id: 'kris_ralsei', owner: 'Kris', friend: 'Ralsei', immediate: true,
    name: "Ralsei's Fluffy Scarf", icon: '🧣', color: '#ff8fb3',
    desc: "A warm pink scarf hand-knitted by Ralsei. It smells faintly of butterscotch and cinnamon.",
    stat: lvl => `+${(16 + lvl * 6).toFixed(0)}% Attack · +${(15 + lvl * 5).toFixed(0)}% Evasion · +${(14 + lvl * 5).toFixed(0)}% Skill Haste`,
    effect: "Ralsei's knitted scarf fills Kris with determination and protective resolve! At wave start: Kris gains 30 TP, +35% Attack for 8s, and immediately CHECKs two enemy threats. Whenever Kris dodges or casts DEFEND, the scarf radiates Kindness, sharing 20% of Kris's Defense and Evasion with all allies and cleansing 1 debuff. Attacks on CHECKED foes deal bonus True Damage and restore 5 Energy to the lowest-Energy ally.",
    apply(u, B, lvl) {
      u.flat.atkP = (u.flat.atkP || 0) + 0.16 + lvl * 0.06;
      u.flat.evaP = (u.flat.evaP || 0) + 0.15 + lvl * 0.05;
      u.flat.cdr = (u.flat.cdr || 0) + 0.14 + lvl * 0.05;
      u.dirty = true;

      const scarfWaveStart = () => {
        if (!u.alive) return;
        Sound.play('dr_great_shine', { vol: 0.5 });
        if (typeof krisTP === 'function') krisTP(u, B, 30);
        B.applyStatus(u, u, 'atkup', 8, { val: 0.35 });
        applyTeamStatShare(u, B, 'def', 0.18 + lvl * 0.02);
        B.enemiesOf(u).slice(0, 2).forEach(e => {
          B.applyStatus(u, e, 'kris_checked', 999);
        });
        B.fxFloatIcon(u.x, u.y - 110, '🧣 FLUFFY SCARF +30 TP', '#ff8fb3');
      };

      onWaveAndStart(u, B, scarfWaveStart);

      B.on(u, 'dodged', () => {
        B.alliesOf(u).forEach(a => {
          B.cleanse(a, 1);
          B.applyStatus(u, a, 'statshare', 999, { val: 0.18 });
        });
      });

      B.on(u, 'dealDamage', ev => {
        if (ev.target && ev.target.hasStatus && ev.target.hasStatus('kris_checked')) {
          ev.amount += u.st.atk * (0.50 + lvl * 0.15);
          const ally = B.lowestHp(B.alliesOf(u));
          if (ally) B.energy(ally, 5);
        }
      });
    }
  });

  /* =========================================================================
     34. RALSEI — Kris's Red SOUL Badge (ralsei_kris) [NEW BADGE]
     ========================================================================= */
  defBadge({
    id: 'ralsei_kris', owner: 'Ralsei', friend: 'Kris', immediate: true,
    name: "Kris's Red SOUL Badge", icon: '♥', color: '#ff6277',
    desc: "A glowing red SOUL emblem entrusted by Kris. It pulses with quiet, unwavering courage.",
    stat: lvl => `+${(18 + lvl * 6).toFixed(0)}% Magic Attack · +${(16 + lvl * 6).toFixed(0)}% Healing Power · +${(14 + lvl * 5).toFixed(0)}% Magic Defense`,
    effect: "The warmth of the human SOUL empowers the Prince of the Dark! At wave start: Ralsei gains 35 TP, grants all allies a Miracle Aegis (22%+ Max HP Shield) for 8s, and confers CC Immunity for 4s. Ralsei shares 20% of his Magic Defense and Magic Attack with the whole team. Basic healing attacks cleanse 1 debuff, restore 10 Energy, and deal 80% Magic Damage to the nearest enemy.",
    apply(u, B, lvl) {
      u.flat.magP = (u.flat.magP || 0) + 0.18 + lvl * 0.06;
      u.flat.healPowP = (u.flat.healPowP || 0) + 0.16 + lvl * 0.06;
      u.flat.mdefP = (u.flat.mdefP || 0) + 0.14 + lvl * 0.05;
      u.dirty = true;

      const soulAegis = () => {
        if (!u.alive) return;
        Sound.play('dr_revival', { vol: 0.55 });
        if (typeof ralseiGain === 'function') ralseiGain(u, B, 35);
        B.alliesOf(u).filter(a => a.alive).forEach(a => {
          B.shield(u, a, a.max.hp * (0.20 + lvl * 0.05), 8);
          B.cleanseAll(a);
          B.applyStatus(u, a, 'ccimmune', 4.0);
          B.applyStatus(u, a, 'statshare', 999, { val: 0.18 + lvl * 0.02 });
          B.fxSparkle(a.x, a.y - 40, 8, '#ff6277');
        });
        B.fxFloatIcon(u.x, u.y - 110, '♥ RED SOUL AEGIS', '#ff6277');
      };

      onWaveAndStart(u, B, soulAegis);

      B.on(u, 'healDone', ev => {
        if (ev.target && ev.target.team === u.team) {
          B.cleanse(ev.target, 1);
          B.energy(ev.target, 10);
        }
      });
    }
  });

  /* =========================================================================
     35. TASQUE MANAGER — Dyle's Conductor Baton (tasquemanager_dyle) [NEW BADGE]
     ========================================================================= */
  defBadge({
    id: 'tasquemanager_dyle', owner: 'TasqueManager', friend: 'Dyle', immediate: true,
    name: "Dyle's Conductor Baton", icon: '🪄', color: '#68f2ff',
    desc: "A polished silver conductor's baton from the Cyber City express. Perfect for keeping strict order.",
    stat: lvl => `+${(18 + lvl * 6).toFixed(0)}% Magic Attack · +${(16 + lvl * 5).toFixed(0)}% Skill Haste · +${(14 + lvl * 5).toFixed(0)}% Max HP`,
    effect: "Strict railway cadence sharpens the Tasques' coordination into perfection! At wave start: summons Tasques to maximum capacity, gives all Tasques +40% Attack Speed and +25% Damage Reduction, and places the two highest-Attack foes Under Management. When a Charmed enemy attacks, it purges 2 buffs from its target and siphons 15 Energy to Tasque Manager.",
    apply(u, B, lvl) {
      u.flat.magP = (u.flat.magP || 0) + 0.18 + lvl * 0.06;
      u.flat.cdr = (u.flat.cdr || 0) + 0.16 + lvl * 0.05;
      u.flat.hpP = (u.flat.hpP || 0) + 0.14 + lvl * 0.05;
      u.dirty = true;

      const conductorCommand = () => {
        if (!u.alive) return;
        Sound.play('dr_weaponpull_fast', { vol: 0.5 });
        if (typeof summonTasque === 'function') {
          u._tasques = (u._tasques || []).filter(t => t.alive);
          while (u._tasques.length < 2) {
            summonTasque(u, B, u._tasques.length);
          }
        }
        (u._tasques || []).forEach(p => {
          B.applyStatus(u, p, 'haste', 8.0);
          B.applyStatus(u, p, 'speedup', 8.0);
        });
        B.enemiesOf(u).slice(0, 2).forEach(e => {
          B.applyStatus(u, e, 'tasque_under', 8.0);
        });
        applyTeamStatShare(u, B, 'mag', 0.18);
        B.fxFloatIcon(u.x, u.y - 110, '⚡ BATON ORDER!', '#68f2ff');
      };

      onWaveAndStart(u, B, conductorCommand);

      B.on(u, 'dealDamage', ev => {
        if (ev.target && ev.target.hasStatus && ev.target.hasStatus('charm')) {
          B.dispel(ev.target, 2);
          B.energy(u, 15);
        }
      });
    }
  });

  /* =========================================================================
     36. FLOWERY — Dandy's Friendship Flower (flowery_dandy) [NEW BADGE]
     ========================================================================= */
  defBadge({
    id: 'flowery_dandy', owner: 'Flowery', friend: 'Dandy', immediate: true,
    name: "Dandy's Friendship Flower", icon: '🌼', color: '#ffdd67',
    desc: "A golden stage blossom given by Dandy Himself. Its impossible glow fuels Flowery's swagger.",
    stat: lvl => `+${(18 + lvl * 6).toFixed(0)}% Attack · +${(16 + lvl * 5).toFixed(0)}% Skill Haste · +${(15 + lvl * 5).toFixed(0)}% Critical Hit Chance`,
    effect: "Dandy's vibrant stage presence fuels Flowery's grand illusions! At wave start: Flowery gains 2 free JARONA charges, +40% Critical Damage for 8s, and refreshes a 25%+ Max HP Illusory Shield. Flowery shares 18% of his Attack with all allies while Maximum Stats is active. When the shield breaks, it dispels 2 buffs from all nearby enemies and Blinds them for 4s.",
    apply(u, B, lvl) {
      u.flat.atkP = (u.flat.atkP || 0) + 0.18 + lvl * 0.06;
      u.flat.cdr = (u.flat.cdr || 0) + 0.16 + lvl * 0.05;
      u.flat.crit = (u.flat.crit || 0) + 0.15 + lvl * 0.05;
      u.dirty = true;

      const flowerShow = () => {
        if (!u.alive) return;
        Sound.play('flowery_voice_my_jarona', { vol: 0.8 });
        u._flowCharges = (u._flowCharges || 0) + 2;
        B.applyStatus(u, u, 'critdmgup', 8, { val: 0.40 });
        if (typeof flowShield === 'function') flowShield(u, B, u.max.hp * (0.25 + lvl * 0.05));
        applyTeamStatShare(u, B, 'atk', 0.18 + lvl * 0.02);
        B.fxFloatIcon(u.x, u.y - 110, '🌼 STAGE FLOWER', '#ffdd67');
      };

      onWaveAndStart(u, B, flowerShow);

      B.on(u, 'dealDamage', ev => {
        if (ev.target && ev.target.team !== u.team && ev.tag && ev.tag.includes('JARONA')) {
          B.dispel(ev.target, 1);
          B.crackShield(u, ev.target, 0.25);
        }
      });
    }
  });

  /* =========================================================================
     37. CHELL — Aperture Companion Cube (chell_boxten) [NEW BADGE]
     ========================================================================= */
  defBadge({
    id: 'chell_boxten', owner: 'Chell', friend: 'Boxten', immediate: true,
    name: "Aperture Companion Cube", icon: '📦', color: '#ff85a2',
    desc: "The Weighted Companion Cube will accompany you through the test chamber. It will never threaten to stab you.",
    stat: lvl => `+${(18 + lvl * 6).toFixed(0)}% Defense · +${(16 + lvl * 5).toFixed(0)}% Evasion · +${(15 + lvl * 5).toFixed(0)}% Skill Haste`,
    effect: "The faithful Companion Cube protects Chell across every dimensional portal! At wave start: deploys the Companion Cube, granting Chell and her nearest ally a 25%+ Max HP Portal Shield for 8s, cleansing all debuffs, and granting Knockback and Stun Immunity for 5s. Whenever Chell teleports or dodges, the Cube pulses with incinerator heat, dealing 150%+ Defense Physical Damage and shredding 25% Armor.",
    apply(u, B, lvl) {
      u.flat.defP = (u.flat.defP || 0) + 0.18 + lvl * 0.06;
      u.flat.evaP = (u.flat.evaP || 0) + 0.16 + lvl * 0.05;
      u.flat.cdr = (u.flat.cdr || 0) + 0.15 + lvl * 0.05;
      u.dirty = true;

      const deployCube = () => {
        if (!u.alive) return;
        Sound.play('portal_open', { vol: 0.5 });
        const partner = B.alliesOf(u).filter(a => a.alive && a !== u).sort((a, b) => B.distance(a, u) - B.distance(b, u))[0] || u;
        const shieldAmt = u.max.hp * (0.22 + lvl * 0.05);
        [u, partner].forEach(target => {
          B.shield(u, target, shieldAmt, 8);
          B.cleanseAll(target);
          B.applyStatus(u, target, 'ccimmune', 5.0);
        });
        applyTeamStatShare(u, B, 'def', 0.20);
        B.fxFloatIcon(u.x, u.y - 110, '📦 COMPANION CUBE', '#ff85a2');
      };

      onWaveAndStart(u, B, deployCube);

      B.on(u, 'dodged', () => {
        Sound.play('portal_shoot', { vol: 0.45 });
        B.enemiesOf(u).filter(e => e.alive && Math.abs(e.x - u.x) < 220).forEach(e => {
          B.damage(u, e, u.st.def * (1.2 + lvl * 0.3), { type: 'physical', tag: 'Incinerator Pulse' });
          B.applyStatus(u, e, 'defdown', 6, { val: 0.25 });
        });
      });
    }
  });

  // Ensure Save automatically registers newly declared immediate badges for existing save files
  if (typeof Save !== 'undefined' && Save.data && Save.data.badges) {
    ['kris_ralsei', 'ralsei_kris', 'tasquemanager_dyle', 'flowery_dandy', 'chell_boxten'].forEach(bid => {
      if (!Save.data.badges[bid]) {
        Save.data.badges[bid] = { lvl: 1 };
      }
    });
  }
})();

