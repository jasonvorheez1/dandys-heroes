/* heroes_holloway.js - Mrs. Holloway (SS Tier Damage/Control) and Mr. Holloway (B Tier Tank).
   Includes defining Spirals mechanic, HP Shield generation, distraction, revivals,
   and the Memory Locket event trinket. */
'use strict';

/* ============================================================ STATUS DEFINITIONS */

// Mrs. Holloway's signature supernatural Spiral mechanic (up to 15 stacks)
STATUS.holloway_spiral = {
  icon: '🌀',
  name: 'Spiral',
  kind: 'debuff',
  max: 15,
  desc: 'Supernatural spiral energy. Each stack reduces Accuracy by 2% and increases damage taken from Mrs. Holloway’s skills by 3%.',
  mods: (m, s) => {
    m.accP -= 0.02 * s.stacks;
  },
  onDamaged: (u, s, ev) => {
    if (ev.src && ev.src.id === 'MrsHolloway' && !ev.basic) {
      ev.amount *= (1 + 0.03 * s.stacks);
    }
  }
};

// Enemy distraction specific to Holloway parents
STATUS.holloway_distracted = {
  icon: '💫',
  name: 'Distracted',
  kind: 'debuff',
  desc: 'Forced to prioritize attacking the Holloway parent. Deals reduced damage.',
  mods: (m, s) => {
    if (s.dmgReduction) m.dmgDealt -= s.dmgReduction;
    if (s.skillHasteDown) m.cdr -= s.skillHasteDown;
  },
  onDealDamage: (u, s, ev) => {
    if (s.dmgReduction) ev.amount *= (1 - s.dmgReduction);
  }
};

// Mother's Embrace teamwide empowerment & CC immunity
STATUS.holloway_embrace = {
  icon: '💜',
  name: "Mother's Embrace",
  kind: 'buff',
  desc: 'Surrounded by protective purple spirals. Attack +30%, empowered basic attacks apply Spirals, and immune to Stun, Silence, Blind, and Charm.',
  mods: (m, s) => {
    m.atkP += 0.30;
    if (s.haste) m.cdr += s.haste;
  },
  flags: { ccImmune: true }
};

// Mr. Holloway's defensive buildup
STATUS.holloway_fortitude = {
  icon: '🛡',
  name: 'Fortitude',
  kind: 'buff',
  max: 5,
  desc: 'Mr. Holloway’s defensive buildup. Armor increased by 5% per stack.',
  mods: (m, s) => {
    m.defP += 0.05 * s.stacks;
  }
};

// Autumn Downpour damage conversion
STATUS.holloway_downpour = {
  icon: '🍂',
  name: 'Autumn Downpour',
  kind: 'buff',
  desc: 'Swirling autumn leaves reduce damage taken by 25% and convert 35% of incoming damage into HP Shields.',
  mods: m => {
    m.dmgTaken -= 0.25;
  }
};

// Still Standing survival state
STATUS.holloway_stillstanding = {
  icon: '🎃',
  name: 'Still Standing',
  kind: 'buff',
  desc: 'Last Harvest Shield protects Mr. Holloway with 1 HP. Surviving 5s heals him for remaining Shield.',
  mods: (m, s) => {
    m.aspdP -= 0.20;
    if (s.dmgReduction) m.dmgTaken -= s.dmgReduction;
  }
};

// Holloway Protection emergency evasion
STATUS.holloway_protection = {
  icon: '💨',
  name: 'Holloway Protection',
  kind: 'buff',
  desc: 'Emergency defensive surge. Evasion +30%.',
  mods: m => {
    m.evaP += 0.30;
  }
};


/* ============================================================ HELPER FUNCTIONS */

function applySpiral(src, tgt, B, count) {
  if (!tgt || !tgt.alive || !B.isTargetable(tgt)) return;
  const stacks = Math.max(1, count || 1);
  B.applyStatus(src, tgt, 'holloway_spiral', 12, { stacks });
  B.fxRing(tgt.x, tgt.y - 45, 120, '#c070ed', .35);
  B.fxFloatIcon(tgt.x, tgt.y - 85, '🌀', '#d894ff');

  // Lingering Presence (Mrs. Holloway Red Skill)
  if (src && src.id === 'MrsHolloway' && src.skills && src.skills.R) {
    src._hollowayLingeringStacks = (src._hollowayLingeringStacks || 0) + stacks;
    const bonusTiers = Math.min(20, Math.floor(src._hollowayLingeringStacks / 10));
    const powerBonus = bonusTiers * 0.03; // up to 60%
    if (powerBonus > (src._hollowayLingeringBonus || 0)) {
      src._hollowayLingeringBonus = powerBonus;
      src.flat.skillPowerLingering = powerBonus;
      src.dirty = true;
      B.fxFloatIcon(src.x, src.y - 110, 'LINGERING +' + Math.round(powerBonus * 100) + '%', '#e9b5ff');
    }
  }
}

function getSpiralStacks(target) {
  if (!target || !target.alive) return 0;
  const s = target.getStatus ? target.getStatus('holloway_spiral') : null;
  return s ? s.stacks : 0;
}


/* ============================================================ MRS. HOLLOWAY
   SS Tier - Damage / Control - Backline */

defHero({
  id: 'MrsHolloway',
  name: 'Mrs. Holloway',
  folder: 'MrsHolloway',
  file: 'MrsHolloway',
  icon: 'MrsHolloway',
  role: 'Damage',
  roleLabel: 'Damage / Control',
  tier: 'SS',
  position: 'Backline',
  element: 'Spirit',
  blurb: 'Gourdy’s mother, adorned in a spiral bandana. Her mysterious supernatural spirals disrupt enemies, empower allies, and burst into devastating spectral explosions.',
  base: { hp: 4120, atk: 140, def: 210, mag: 435, mdef: 340, spd: 112, acc: 195, eva: 138 },
  hidden: { range: 310, aspd: 0.95, ms: 68, aggro: 0.65, crit: .08, critDmg: 1.55, healPow: 1.15, shieldPow: 1.25, cdr: .12, ccRes: .20, kbRes: .40, armorPen: .05, magPen: .18 },
  growth: { hp: .088, atk: .045, def: .075, mag: .105, mdef: .095 },
  move: { gait: 'float', bob: 8, freq: 1.2, lean: 2, squash: .04, hover: 12, idle: 'shake', step: null,
    particles: 'sparkle', pcol: '#c070ed', trail: { on: true, col: '#a855f7', rate: .12 }, brake: .2 },
  basic: {
    name: 'Spiraling Energy',
    type: 'magic',
    ratio: .75,
    range: 310,
    proj: 'orb',
    pcol: '#c070ed',
    sfx: 'whoosh',
    hit: 'hit_magic',
    wind: .2,
    note: 'Releases swirling purple energy that applies 2 Spiral stacks.',
    onHit: (u, t, B) => {
      applySpiral(u, t, B, 2);
    }
  },
  skills: {
    // ---------------- WHITE SKILL: Spiraling Memories
    W: {
      name: 'Spiraling Memories',
      type: 'Magic Damage / Control',
      energy: 100,
      v: { ratio: 1.25, stackRatio: .18 },
      p: { stunDur: 3, kb: 160 },
      desc: (S, P) => `<span class="sk-pas">Passive: Basic Attacks release swirling purple energy, dealing Magic Damage and applying 2 stacks of Spiral (max 15). Each stack reduces enemy Accuracy by 2% and increases damage received from Mrs. Holloway’s skills by 3%.</span>
Active: Mrs. Holloway raises her paws and releases an enormous spectral explosion, dealing <em>${pcn(S.ratio * 100)}</em> Magic Damage to all enemies and Knocking them Back. Enemies take an additional <em>${pcn(S.stackRatio * 100)}</em> Magic Damage per Spiral stack. Enemies with at least 8 stacks are Stunned for <em>${P.stunDur}s</em>. After the explosion, all enemies retain half of their Spiral stacks, rounded up.`,
      passive: (u, B, S, P) => {
        // Red Skill upgrade (The Holloway Legacy)
        B.every(u, 3, () => {
          if (!u.alive) return;
          const hasRed = u.skills && u.skills.R;
          if (!hasRed) return;
          const foes = B.enemiesOf(u).filter(e => e.alive);
          foes.forEach(e => {
            const stacks = getSpiralStacks(e);
            if (stacks > 0) {
              B.damage(u, e, u.st.mag * (0.08 * stacks), { type: 'magic', dot: true, tag: 'Holloway Legacy Eruption' });
              // Strip one removable buff
              const buff = (e.statuses || []).find(st => STATUS[st.id] && STATUS[st.id].kind === 'buff' && st.id !== 'shield');
              if (buff) B.removeStatus(e, buff.id);
            }
          });
        });
      },
      cast: (u, B, S, P) => {
        B.anim(u, 'cast', .85, 'mrsHollowayExplosion');
        Sound.play('beam_fire', { vol: .85, priority: true });
        B.flash('#e0b0ff', .4, .25);
        B.shake(14, .45);

        const foes = B.enemiesOf(u).filter(e => e.alive);
        const hasRed = u.skills && u.skills.R;

        foes.forEach(e => {
          const stacks = getSpiralStacks(e);
          const totalDmg = u.st.mag * (S.ratio + stacks * S.stackRatio);
          B.damage(u, e, totalDmg, { type: 'magic', area: true, tag: 'Spiraling Memories' });
          B.knockback(u, e, P.kb);

          // Stun condition: 8+ stacks (or all enemies hit if Red skill active)
          if (hasRed) {
            B.applyStatus(u, e, 'stun', 2);
          } else if (stacks >= 8) {
            B.applyStatus(u, e, 'stun', P.stunDur);
          }

          // Retain half stacks rounded up
          const spiralStatus = e.getStatus ? e.getStatus('holloway_spiral') : null;
          if (spiralStatus) {
            spiralStatus.stacks = Math.ceil(spiralStatus.stacks / 2);
            e.dirty = true;
          }
        });

        if (B.fxMrsHollowayExplosion) B.fxMrsHollowayExplosion(u.x, u.y - 45, 340, { dur: 0.8 });
        else B.fxSpiralBurst(u.x, u.y - 45, 340, { dur: 0.8 });
        B.fxRing(u.x, u.y - 45, 340, '#a855f7', .65);
        B.fxFloatIcon(u.x, u.y - 120, '💥 SPECTRAL BURST', '#e0b0ff');
      }
    },

    // ---------------- GREEN SKILL: A Familiar Face
    G: {
      name: 'A Familiar Face',
      type: 'Magic Damage / Control',
      cd: 12,
      v: { ratio: .88 },
      p: { dur: 6, dmgRed: .45 },
      desc: (S, P) => `Mrs. Holloway creates an enormous spiral-shaped apparition behind herself, illuminating the battlefield with a strange purple glow. All enemies take <em>${pcn(S.ratio * 100)}</em> Magic Damage and become Blinded and Distracted for ${P.dur}s. Distracted enemies prioritize attacking Mrs. Holloway. During this effect, Mrs. Holloway takes ${Math.round(P.dmgRed * 100)}% reduced Damage. Every time an enemy attempts to damage her, they receive 2 Spiral stacks. If an enemy misses her, they receive 2 additional stacks and lose 100 Energy. Once per activation, taking a Critical Hit makes her untargetable for 2s and releases another burst of Magic Damage against the attacker.`,
      ai: { prio: 65, cond: (u, B) => B.enemiesOf(u).length > 0 },
      cast: (u, B, S, P) => {
        B.anim(u, 'cast', .75, 'mrsHollowayApparition');
        Sound.play('spirit_aura', { vol: .78 });
        if (B.fxMrsHollowayApparition) B.fxMrsHollowayApparition(u.x, u.y);
        if (B.fxMrsHollowayExplosion) B.fxMrsHollowayExplosion(u.x, u.y - 45, 300, { dur: 0.75, rev: true });
        else B.fxSpiralBurst(u.x, u.y - 45, 300, { dur: 0.75, rev: true });
        B.fxRing(u.x, u.y - 45, 300, '#c070ed', .8);

        const foes = B.enemiesOf(u).filter(e => e.alive);
        const hasRed = u.skills && u.skills.R;

        foes.forEach(e => {
          B.damage(u, e, u.st.mag * S.ratio, { type: 'magic', area: true, tag: 'A Familiar Face' });
          B.applyStatus(u, e, 'blind', P.dur);

          e._distractor = u;
          e._distractUntil = B.t + P.dur;
          B.applyStatus(u, e, 'holloway_distracted', P.dur, {
            dmgReduction: hasRed ? .20 : 0,
            skillHasteDown: hasRed ? .25 : 0
          });
        });

        // Buff Mrs. Holloway
        u._familiarFaceUntil = B.t + P.dur;
        u._critCounterAvailable = true;
        B.applyStatus(u, u, 'ward', P.dur);

        const onAttackAttempt = B.on(u, 'damaged', ev => {
          if (B.t > (u._familiarFaceUntil || 0)) return;
          if (ev.src && ev.src.team !== u.team && ev.src.alive) {
            applySpiral(u, ev.src, B, 2);
          }
          // Crit counter: untargetable for 2s & retaliate
          if (ev.crit && u._critCounterAvailable && ev.src && ev.src.alive) {
            u._critCounterAvailable = false;
            B.applyStatus(u, u, 'untargetable', 2);
            B.damage(u, ev.src, u.st.mag * S.ratio * 1.2, { type: 'magic', tag: 'Spectral Retaliation' });
            B.fxFloatIcon(u.x, u.y - 110, 'COUNTER BURST', '#e0b0ff');
          }
        });

        const onMiss = B.on(u, 'evaded', ev => {
          if (B.t > (u._familiarFaceUntil || 0)) return;
          if (ev.src && ev.src.alive) {
            applySpiral(u, ev.src, B, 2);
            B.energy(ev.src, -100);
            B.fxFloatIcon(ev.src.x, ev.src.y - 90, '-100 ⚡', '#ffd54d');
          }
        });

        B.after(P.dur, () => {
          if (typeof onAttackAttempt === 'function') onAttackAttempt();
          if (typeof onMiss === 'function') onMiss();
        });
      }
    },

    // ---------------- BLUE SKILL: Mother's Embrace
    B: {
      name: "Mother's Embrace",
      type: 'Support / Magic Damage',
      cd: 14,
      v: { bonusAtk: .30, shieldRatio: .25 },
      p: { dur: 9 },
      desc: (S, P) => `Mrs. Holloway surrounds herself and her allies with glowing purple spirals, increasing their Attack by ${Math.round(S.bonusAtk * 100)}% and granting Empowered Basic Attacks for ${P.dur}s. Empowered Basic Attacks deal additional Magic Damage and apply a Spiral stack. During this effect, all allies are immune to Stun, Silence, Blind, and Charm. Whenever an ally damages an enemy with 10 or more Spiral stacks, the ally restores HP and gains 50 Energy. When Mother's Embrace expires, Mrs. Holloway grants a Shield worth <em>${pcn(S.shieldRatio * 100)}</em> of her Max HP to the ally with the lowest HP.`,
      ai: { prio: 60, cond: (u, B) => B.alliesOf(u).length > 0 },
      cast: (u, B, S, P) => {
        B.anim(u, 'cast', .7, 'mrsHollowayEmbrace');
        Sound.play('spirit_heal', { vol: .75 });

        const allies = B.alliesOf(u).filter(a => a.alive);
        const hasRed = u.skills && u.skills.R;

        allies.forEach(a => {
          B.applyStatus(u, a, 'holloway_embrace', P.dur, { haste: hasRed ? .20 : 0 });
          if (B.fxMrsHollowayEmbrace) B.fxMrsHollowayEmbrace(a.x, a.y, P.dur);
          else B.fxRing(a.x, a.y - 45, 140, '#c070ed', .5);
        });

        // Empowered basic attack callback
        const empowerOff = B.on(u, 'dealDamage', ev => {
          if (B.t > u._embraceUntil) return;
          if (!ev.basic || !ev.target || !ev.target.alive) return;
          const ally = ev.src;
          if (!ally || ally.team !== u.team) return;

          // Additional magic damage and spiral stack
          B.damage(ally, ev.target, ally.st.mag * .25, { type: 'magic', silent: true, tag: 'Empowered Spiral' });
          applySpiral(ally, ev.target, B, hasRed ? 2 : 1);

          // 10+ spiral synergy: heal and +50 energy
          if (getSpiralStacks(ev.target) >= 10) {
            B.heal(u, ally, ally.max.hp * .06, { silent: true, tag: 'Mother’s Grace' });
            B.energy(ally, 50);
            B.fxFloatIcon(ally.x, ally.y - 95, '+50 ⚡', '#ffea79');
          }
        });

        u._embraceUntil = B.t + P.dur;

        B.after(P.dur, () => {
          if (typeof empowerOff === 'function') empowerOff();
          // Expiration shield to lowest-HP ally
          const livingAllies = B.alliesOf(u).filter(a => a.alive);
          const weakest = livingAllies.sort((a, b) => (a.hp / a.max.hp) - (b.hp / b.max.hp))[0];
          if (weakest) {
            B.shield(u, weakest, u.max.hp * S.shieldRatio, 6);
            B.fxRing(weakest.x, weakest.y - 45, 160, '#e0b0ff', .6);
            B.fxFloatIcon(weakest.x, weakest.y - 100, '🛡 EMBRACE SHIELD', '#e0b0ff');
          }
        });
      }
    },

    // ---------------- PURPLE SKILL: Gone, But Not Forgotten
    P: {
      name: 'Gone, But Not Forgotten',
      type: 'Healing / Survival / Magic Damage',
      v: { reviveHp: .55, aspdSlow: .30 },
      p: { invulnDur: 4 },
      desc: (S, P) => `Once per wave, when Mrs. Holloway would be defeated, her body dissolves into purple spirals instead. She becomes untargetable and cannot attack for 3 seconds. Upon returning, she Revives with <em>${pcn(S.reviveHp * 100)}</em> Max HP, immediately gains 500 Energy, and becomes Invincible for ${P.invulnDur}s, restoring additional HP each second.
Upon disappearing, she applies 5 Spiral stacks to all enemies. Upon returning, she creates an explosion dealing Magic Damage based on the total number of Spiral stacks on the enemy team, reduces enemy Attack Speed by ${Math.round(S.aspdSlow * 100)}% for 6s, and gains a protective Spectral Shield equal to 30% Max HP plus 300 bonus Energy.`,
      passive: (u, B, S, P) => {
        u._hollowayReviveUsed = false;

        B.on(u, 'lethal', ev => {
          if (u._hollowayReviveUsed) return;
          u._hollowayReviveUsed = true;
          ev.prevented = true;
          u.hp = 1;

          // Dissolve into purple spirals
          B.anim(u, 'idle', 3, 'dissolve');
          B.applyStatus(u, u, 'untargetable', 3);
          u.flags.noAct = true;
          if (u.el) u.el.style.opacity = '0.2';
          Sound.play('spirit_aura', { vol: .85, priority: true });
          B.fxFloatIcon(u.x, u.y - 110, 'DISSOLVING IN SPIRALS...', '#e0b0ff');

          // Apply 5 Spiral stacks to all enemies upon disappearing
          B.enemiesOf(u).filter(e => e.alive).forEach(e => applySpiral(u, e, B, 5));

          B.after(3, () => {
            if (!B.active) return;
            u.flags.noAct = false;
            if (u.el) u.el.style.opacity = '1';

            const hasRed = u.skills && u.skills.R;
            const reviveRatio = S.reviveHp + (hasRed ? .15 : 0); // +15% with Red
            u.hp = u.max.hp * reviveRatio;
            if (hasRed) B.cleanse(u, 99);

            B.energy(u, 500);
            B.applyStatus(u, u, 'ward', P.invulnDur); // Heavy damage reduction / invincibility
            B.applyStatus(u, u, 'untargetable', P.invulnDur);

            // Restore HP each second for 4 seconds
            B.every(u, 1, () => {
              if (u.alive) B.heal(u, u, u.max.hp * .08, { silent: true, tag: 'Gone But Not Forgotten' });
            });

            // Explosion based on enemy team total spiral stacks
            let totalStacks = 0;
            const foes = B.enemiesOf(u).filter(e => e.alive);
            foes.forEach(e => { totalStacks += getSpiralStacks(e); });

            const explosionDmg = u.st.mag * (1.1 + totalStacks * 0.12);
            foes.forEach(e => {
              B.damage(u, e, explosionDmg, { type: 'magic', area: true, tag: 'Gone But Not Forgotten Return' });
              B.applyStatus(u, e, 'armslow', 6);
            });

            // Self-empowerment shield & bonus energy
            B.shield(u, u, u.max.hp * .30, 8);
            B.energy(u, 300);
            B.fxFloatIcon(u.x, u.y - 100, '🛡 SPIRIT SHIELD +300 ⚡', '#e0b0ff');

            B.flash('#f0c0ff', .5, .3);
            B.shake(16, .5);
            Sound.play('fanfare', { vol: .85 });
            B.fxFloatIcon(u.x, u.y - 120, '✨ REVIVED: GONE, BUT NOT FORGOTTEN', '#ffffff');
          });
        });
      }
    },

    // ---------------- RED SKILL: The Holloway Legacy
    R: {
      name: 'The Holloway Legacy',
      type: 'Magic Damage / Control / Support',
      v: { statBoost: .15 },
      p: {},
      desc: (S) => `Mrs. Holloway’s Spiral effects become significantly more dangerous:
• Spiraling Memories now Stuns all enemies hit for 2 seconds, regardless of Spiral stacks.
• Every 3 seconds, enemies with Spiral stacks take Magic Damage based on stacks and lose one removable buff.
• A Familiar Face reduces enemy Skill Haste by 25% and makes Distracted enemies deal 20% reduced Damage to allies.
• Mother's Embrace grants allies 20% Skill Haste and makes Empowered Basic Attacks apply an additional Spiral stack.
• Gone, But Not Forgotten restores an additional 15% Max HP and Cleanses all removable debuffs upon revival.
• <strong>New Effect: Lingering Presence.</strong> For every 10 Spiral stacks applied to enemies, Mrs. Holloway permanently gains 3% Skill Power for the remainder of the battle, up to 60%.
• Whenever an enemy with at least 5 Spiral stacks is defeated, their accumulated stacks erupt, dealing Magic Damage to nearby enemies and transferring half their stacks to the enemy with the highest HP.`,
      passive: (u, B, S) => {
        // Permanent stat boosts
        u.flat.magP = (u.flat.magP || 0) + S.statBoost;
        u.flat.hpP = (u.flat.hpP || 0) + S.statBoost;
        u.flat.mdefP = (u.flat.mdefP || 0) + S.statBoost;
        u.dirty = true;

        // Enemy defeat eruption & stack transfer
        B.on(u, 'defeatedEnemy', foe => {
          const stacks = getSpiralStacks(foe);
          if (stacks >= 5) {
            // Erupt damage to nearby enemies
            const livingFoes = B.enemiesOf(u).filter(e => e.alive && e !== foe);
            livingFoes.forEach(e => {
              B.damage(u, e, u.st.mag * (.45 + stacks * .08), { type: 'magic', area: true, tag: 'Holloway Stack Eruption' });
            });
            B.fxRing(foe.x, foe.y - 45, 200, '#a855f7', .6);
            B.fxFloatIcon(foe.x, foe.y - 100, '💥 STACK ERUPTION', '#e0b0ff');

            // Transfer half stacks to enemy with highest HP
            if (livingFoes.length > 0) {
              const highestHpFoe = livingFoes.sort((a, b) => b.hp - a.hp)[0];
              applySpiral(u, highestHpFoe, B, Math.ceil(stacks / 2));
            }
          }
        });
      }
    }
  }
});


/* ============================================================ MR. HOLLOWAY
   B Tier - Tank - Frontline */

function harvestClawShield(u, B) {
  if (!u || !u.alive) return;
  const maxCap = u.max.hp * 0.35;
  const shieldAmount = u.max.hp * 0.05;
  const currentShield = (u.statuses || []).filter(s => s.id === 'shield').reduce((sum, s) => sum + (s.val || 0), 0);
  if (currentShield < maxCap) {
    const toAdd = Math.min(shieldAmount, maxCap - currentShield);
    B.shield(u, u, toAdd, 8);
    B.fxFloatIcon(u.x, u.y - 95, '🛡 CLAW SHIELD', '#ffb076');
  }
}

defHero({
  id: 'MrHolloway',
  name: 'Mr. Holloway',
  folder: 'MrHolloway',
  file: 'MrHolloway',
  icon: 'MrHolloway',
  role: 'Tank',
  roleLabel: 'Tank / Frontline',
  tier: 'B',
  position: 'Frontline',
  element: 'Pumpkin',
  blurb: 'Gourdy’s father, a resilient pumpkin tank. With heavy claw swipes, tail sweeps, autumn leaf shields, and unbreakable resolve, he absorbs damage and protects his family to the very last.',
  base: { hp: 7650, atk: 235, def: 385, mag: 95, mdef: 295, spd: 85, acc: 162, eva: 95 },
  hidden: { range: 110, aspd: 0.72, ms: 58, aggro: 2.2, crit: .04, critDmg: 1.35, healPow: 1.0, shieldPow: 1.45, cdr: .05, ccRes: .35, kbRes: .85, armorPen: .10, magPen: 0 },
  growth: { hp: .125, atk: .065, def: .110, mag: .030, mdef: .090 },
  move: { gait: 'heavy', bob: 6, freq: 1.0, lean: 6, squash: .08, idle: 'settle', step: 'stomp',
    particles: 'dust', pcol: '#d97706', trail: { on: false }, brake: .65 },
  basic: {
    name: 'Heavy Claw Swipe',
    type: 'physical',
    ratio: .85,
    range: 110,
    proj: null,
    pcol: '#d97706',
    sfx: 'swing_heavy',
    hit: 'hit_heavy',
    wind: .25,
    note: 'Heavy claw swipes that deal Physical Damage and grant an HP Shield equal to 5% Max HP (capped at 35%).',
    onHit: (u, t, B) => {
      harvestClawShield(u, B);
      if (B.fxMrHollowayClaw) B.fxMrHollowayClaw(u.x, u.y, t ? t.x : u.x + 50, t ? t.y : u.y);
    }
  },
  skills: {
    // ---------------- WHITE SKILL: Harvest Crash
    W: {
      name: 'Harvest Crash',
      type: 'Physical Damage / Control / Shield',
      energy: 100,
      v: { ratio: 1.15 },
      p: { dur: 6, kb: 180, dmgRed: .15 },
      desc: (S, P) => `<span class="sk-pas">Passive: Basic Attacks grant an HP Shield equal to 5% of Max HP, capped at 35%.</span>
Active: Mr. Holloway charges forward, sweeping enemies aside with his long tail before slamming both paws into the ground. All nearby enemies take <em>${pcn(S.ratio * 100)}</em> Physical Damage, are Knocked Back, and become Distracted for ${P.dur}s. Distracted enemies prioritize attacking Mr. Holloway and deal ${Math.round(P.dmgRed * 100)}% less Damage. Each time a Distracted enemy attacks him, Mr. Holloway gains one stack of Fortitude (+5% Armor for 8s, up to 5 stacks).`,
      cast: (u, B, S, P) => {
        B.anim(u, 'cast', .8, 'mrHollowaySlam');
        Sound.play('impact_heavy', { vol: .85 });
        Sound.play('earth_quake', { vol: .75, throttle: 150 });
        B.shake(14, .45);

        const foes = B.enemiesOf(u).filter(e => e.alive);
        const hasRed = u.skills && u.skills.R;

        foes.forEach(e => {
          B.damage(u, e, u.st.atk * S.ratio, { type: 'physical', area: true, tag: 'Harvest Crash' });
          B.knockback(u, e, P.kb);

          e._distractor = u;
          e._distractUntil = B.t + P.dur;
          B.applyStatus(u, e, 'holloway_distracted', P.dur, { dmgReduction: P.dmgRed });
        });

        if (B.fxMrHollowayCrash) B.fxMrHollowayCrash(u.x, u.y - 35, 280);
        else B.fxAutumnBurst(u.x, u.y - 35, 280);
        B.fxRing(u.x, u.y - 45, 280, '#d97706', .6);

        // Fortitude accumulation when distracted enemies hit him
        const fortOff = B.on(u, 'damaged', ev => {
          if (!ev.src || !ev.src.alive) return;
          if (ev.src._distractor === u && B.t < (ev.src._distractUntil || 0)) {
            B.applyStatus(u, u, 'holloway_fortitude', 8, { stacks: 1 });
          }
        });

        // Red skill upgrade: Fortitude on enemy skill cast
        const skillOff = hasRed ? B.on(u, 'enemyCast', e => {
          if (e && e._distractor === u) {
            B.applyStatus(u, u, 'holloway_fortitude', 8, { stacks: 1 });
            B.fxFloatIcon(u.x, u.y - 95, '+FORTITUDE (SKILL)', '#ffd54d');
          }
        }) : null;

        B.after(P.dur, () => {
          if (typeof fortOff === 'function') fortOff();
          if (typeof skillOff === 'function') skillOff();
        });
      }
    },

    // ---------------- GREEN SKILL: Autumn Downpour
    G: {
      name: 'Autumn Downpour',
      type: 'Shield / Support',
      cd: 12,
      v: { dmgRed: .25, convertRate: .35, critShield: .08 },
      p: { dur: 6 },
      desc: (S, P) => `Mr. Holloway lowers his head and braces himself, surrounding his body with swirling autumn leaves for ${P.dur}s. During this time, he takes ${Math.round(S.dmgRed * 100)}% reduced Damage and converts ${Math.round(S.convertRate * 100)}% of damage received into HP Shields. Whenever he receives a Critical Hit during Autumn Downpour, he gains an additional Shield equal to ${Math.round(S.critShield * 100)}% of Max HP. At the end of the effect, he restores HP based on his remaining Shield.`,
      ai: { prio: 62, cond: (u, B) => u.hpPct < .85 },
      cast: (u, B, S, P) => {
        B.anim(u, 'cast', .65, 'mrHollowayBrace');
        Sound.play('wind_heavy', { vol: .72 });

        const hasRed = u.skills && u.skills.R;
        if (hasRed) {
          B.cleanse(u, 99);
          // Ally with lowest HP gets 15% shield
          const livingAllies = B.alliesOf(u).filter(a => a.alive);
          const weakest = livingAllies.sort((a, b) => (a.hp / a.max.hp) - (b.hp / b.max.hp))[0];
          if (weakest) {
            B.shield(u, weakest, u.max.hp * .15, 6);
            B.fxFloatIcon(weakest.x, weakest.y - 95, '🛡 FATHER’S SHIELD', '#ffb076');
          }
        }

        B.applyStatus(u, u, 'holloway_downpour', P.dur);
        if (B.fxMrHollowayCyclone) B.fxMrHollowayCyclone(u.x, u.y, P.dur);
        u._downpourUntil = B.t + P.dur;

        const downpourOff = B.on(u, 'damaged', ev => {
          if (B.t > (u._downpourUntil || 0)) return;
          // Convert 35% of damage into HP Shield
          const shieldGain = ev.amount * S.convertRate;
          B.shield(u, u, shieldGain, 6);

          // Crit gives extra 8% shield
          if (ev.crit) {
            B.shield(u, u, u.max.hp * S.critShield, 6);
            B.fxFloatIcon(u.x, u.y - 100, '+8% CRIT SHIELD', '#ffb076');
          }
        });

        B.after(P.dur, () => {
          if (typeof downpourOff === 'function') downpourOff();
          if (!u.alive) return;
          // Convert 50% of remaining shield into HP
          const currentShield = (u.statuses || []).filter(st => st.id === 'shield').reduce((sum, st) => sum + (st.val || 0), 0);
          if (currentShield > 0) {
            B.heal(u, u, currentShield * 0.5, { silent: true, tag: 'Autumn Downpour Harvest' });
            B.fxFloatIcon(u.x, u.y - 95, '🍂 HARVEST HEAL', '#6cd67a');
          }
        });
      }
    },

    // ---------------- BLUE SKILL: Rooted Resolve
    B: {
      name: 'Rooted Resolve',
      type: 'Shield / Tank',
      cd: 15,
      v: { shieldPerSec: .10, buffStat: .15 },
      p: { dur: 4 },
      desc: (S, P) => `Mr. Holloway plants his feet and curls his tail around himself, gaining an HP Shield equal to ${Math.round(S.shieldPerSec * 100)}% of Max HP every second for ${P.dur}s. During this time, he cannot be Knocked Back. When Rooted Resolve ends, if his total HP Shield exceeds 50% of Max HP, he consumes the excess Shield to permanently increase his Max HP by 10% of the Shield consumed (up to 20% bonus Max HP per wave). He then gains ${Math.round(S.buffStat * 100)}% Armor and Magic Defense for 8s.`,
      ai: { prio: 68, cond: (u, B) => true },
      cast: (u, B, S, P) => {
        B.anim(u, 'cast', .7, 'mrHollowayRoot');
        Sound.play('earth_rumble', { vol: .78 });
        if (B.fxMrHollowayRoots) B.fxMrHollowayRoots(u.x, u.y, P.dur);

        const hasRed = u.skills && u.skills.R;
        if (hasRed) {
          u.flat.defChanneling = 0.10;
          u.dirty = true;
        }

        // Immunity to knockback
        u.flat.kbResP = (u.flat.kbResP || 0) + 10;
        u.dirty = true;

        let seconds = 0;
        const tickTimer = setInterval(() => {
          if (!B.active || !u.alive || ++seconds > P.dur) {
            clearInterval(tickTimer);
            return;
          }
          B.shield(u, u, u.max.hp * S.shieldPerSec, 6);
          B.fxRing(u.x, u.y - 40, 150, '#d97706', .4);
        }, 1000);

        B.after(P.dur, () => {
          clearInterval(tickTimer);
          if (!u.alive) return;

          // Remove channel buffs
          u.flat.kbResP = Math.max(0, (u.flat.kbResP || 0) - 10);
          if (hasRed) u.flat.defChanneling = 0;
          u.dirty = true;

          // Excess shield check (>50% Max HP)
          const currentShield = (u.statuses || []).filter(st => st.id === 'shield').reduce((sum, st) => sum + (st.val || 0), 0);
          const threshold = u.max.hp * 0.50;
          if (currentShield > threshold) {
            const excess = currentShield - threshold;
            // Consume excess
            B.removeStatus(u, 'shield');
            B.shield(u, u, threshold, 6); // keep threshold amount

            // Permanently increase Max HP by 10% of excess (max 20% bonus per wave)
            u._rootedBonusHp = u._rootedBonusHp || 0;
            const maxWaveBonus = u.max.hp * 0.20;
            const bonusToAdd = Math.min(excess * 0.10, Math.max(0, maxWaveBonus - u._rootedBonusHp));
            if (bonusToAdd > 0) {
              u._rootedBonusHp += bonusToAdd;
              u.max.hp += bonusToAdd;
              u.hp += bonusToAdd;
              B.fxFloatIcon(u.x, u.y - 110, `+${Math.round(bonusToAdd)} MAX HP`, '#6cd67a');
            }

            if (hasRed) {
              B.energy(u, 35);
              B.fxFloatIcon(u.x, u.y - 80, '+35 ⚡', '#ffd54d');
            }
          }

          // +15% Armor and Magic Defense for 8s
          B.applyStatus(u, u, 'fortify', 8, { stacks: 2 });
          B.fxFloatIcon(u.x, u.y - 95, '+15% DEF / MDEF', '#ffd54d');
        });
      }
    },

    // ---------------- PURPLE SKILL: Still Standing
    P: {
      name: 'Still Standing',
      type: 'Tank / Survival',
      v: { lastShieldRatio: .45 },
      p: { dur: 5 },
      desc: (S, P) => `Once per wave, when Mr. Holloway would be defeated, he remains standing with 1 HP and gains a Last Harvest Shield equal to ${Math.round(S.lastShieldRatio * 100)}% of Max HP for ${P.dur}s. During this effect, he cannot receive additional Shields and his Attack Speed is reduced by 20%. If the Last Harvest Shield survives its full duration, Mr. Holloway heals himself for the remaining Shield amount and removes all removable debuffs. If the Shield is destroyed before the duration ends, Mr. Holloway is defeated.`,
      passive: (u, B, S, P) => {
        u._stillStandingUsed = false;

        B.on(u, 'lethal', ev => {
          if (u._stillStandingUsed) return;
          u._stillStandingUsed = true;
          ev.prevented = true;
          u.hp = 1;

          const hasRed = u.skills && u.skills.R;
          const shieldAmount = u.max.hp * S.lastShieldRatio;

          B.shield(u, u, shieldAmount, P.dur);
          B.applyStatus(u, u, 'holloway_stillstanding', P.dur, { dmgReduction: hasRed ? .20 : 0 });
          Sound.play('warn', { vol: .85 });
          B.flash('#ffb076', .4, .25);
          if (B.fxMrHollowayHarvestShield) B.fxMrHollowayHarvestShield(u.x, u.y, P.dur);
          B.fxFloatIcon(u.x, u.y - 115, '🎃 LAST HARVEST SHIELD', '#ff9d4d');

          // Guard against receiving additional shields
          u._noAdditionalShields = true;

          // Track shield survival
          B.after(P.dur, () => {
            u._noAdditionalShields = false;
            if (!u.alive) return;
            const remainingShield = (u.statuses || []).filter(st => st.id === 'shield').reduce((sum, st) => sum + (st.val || 0), 0);
            if (remainingShield > 0) {
              // Heals for remaining shield amount
              B.heal(u, u, remainingShield, { tag: 'Still Standing Harvest' });
              B.cleanse(u, 99);
              Sound.play('fanfare', { vol: .75 });
              B.fxFloatIcon(u.x, u.y - 110, '✨ STILL STANDING SURVIVED!', '#6cd67a');

              if (hasRed) {
                u._stillStandingBonusNextAttack = remainingShield;
              }
            } else {
              // Shield was broken: defeat
              u.hp = 0;
              B.kill(u, ev.src);
            }
          });
        });

        // Red Skill: bonus damage on next basic attack
        B.on(u, 'dealDamage', ev => {
          if (ev.basic && u._stillStandingBonusNextAttack) {
            ev.amount += u._stillStandingBonusNextAttack * 0.5;
            u._stillStandingBonusNextAttack = null;
            B.fxFloatIcon(u.x, u.y - 95, 'HARVEST STRIKE!', '#ff6b6b');
          }
        });
      }
    },

    // ---------------- RED SKILL: A Father's Resolve
    R: {
      name: "A Father's Resolve",
      type: 'Shield / Support / Physical Damage',
      v: { statBoost: .20 },
      p: {},
      desc: (S) => `Mr. Holloway’s defensive abilities become more effective:
• Harvest Crash grants additional Fortitude whenever a Distracted enemy uses a Skill against him.
• Autumn Downpour Cleanses removable debuffs when activated and grants the ally with lowest HP a Shield equal to 15% of Max HP.
• Rooted Resolve grants an additional 10% Armor while channeling, and consuming Shields restores 35 Energy.
• Still Standing grants 20% Damage Reduction for its duration, and if Mr. Holloway successfully survives, his next Basic Attack deals additional Physical Damage based on HP restored.
• <strong>New Effect: Holloway Protection.</strong> When receiving damage exceeding 20% of Max HP from a single attack, gains 30% Evasion for 4 seconds (triggers once every 12 seconds).
• Additional Stat Boosts: Increased Max HP, Armor, Shield strength, and Physical Damage from Harvest Crash.`,
      passive: (u, B, S) => {
        // Permanent stat boosts
        u.flat.hpP = (u.flat.hpP || 0) + S.statBoost;
        u.flat.defP = (u.flat.defP || 0) + S.statBoost;
        u.flat.shieldPowP = (u.flat.shieldPowP || 0) + S.statBoost;
        u.dirty = true;

        // Holloway Protection emergency evasion
        B.on(u, 'damaged', ev => {
          if (ev.amount > u.max.hp * .20) {
            if (B.t >= (u._hollowayProtectionCooldown || 0)) {
              u._hollowayProtectionCooldown = B.t + 12;
              B.applyStatus(u, u, 'holloway_protection', 4);
              B.fxFloatIcon(u.x, u.y - 110, '💨 HOLLOWAY PROTECTION', '#5fe0e0');
            }
          }
        });
      }
    }
  }
});


/* ============================================================ MEMORY LOCKET TRINKET
   Event-only equippable Trinket */

if (typeof defTrinket === 'function') {
  defTrinket({
    id: 'memory_locket',
    name: 'Memory Locket',
    owner: 'Gourdy',
    file: 'MemoryLocket.png',
    eventOnly: true,
    desc: 'A pumpkin-shaped locket holding a faded sketch of Gourdy’s parents, stained in mysterious ink.',
    stat: r => `+${(r * 3.2).toFixed(1)}% Max HP, Magic Attack, and Shield Power`,
    effect: 'Taking or dealing damage periodically summons protective Holloway Spirals, Shielding the wearer and applying Spiral stacks to nearby enemies.',
    apply(u, B, r) {
      u.flat.hpP = (u.flat.hpP || 0) + r * .032;
      u.flat.magP = (u.flat.magP || 0) + r * .032;
      u.flat.shieldPowP = (u.flat.shieldPowP || 0) + r * .032;
      u.dirty = true;

      B.on(u, 'damaged', ev => {
        if (!trinketReady(u, B, '_memLocketAt', Math.max(5, 8.5 - r * .3))) return;
        B.shield(u, u, u.max.hp * (.08 + r * .015), 5);
        B.enemiesOf(u).filter(e => e.alive && B.distance(e, u) < 260).forEach(e => {
          applySpiral(u, e, B, 1 + (r >= 3 ? 1 : 0));
        });
        B.fxRing(u.x, u.y - 45, 240, '#c070ed', .5);
        B.fxFloatIcon(u.x, u.y - 100, '🧡', '#ffb076');
      });
    }
  });
}


/* ============================================================ ROSTER & DATA REGISTRATION */

// Special hero art mappings
if (typeof SPECIAL_HERO_ART !== 'undefined') {
  SPECIAL_HERO_ART.MrsHolloway = 'Characters/MrsHolloway/MrsHolloway.png';
  SPECIAL_HERO_ART.MrHolloway = 'Characters/MrHolloway/MrHolloway.png';
}
if (typeof SPECIAL_HERO_ICONS !== 'undefined') {
  SPECIAL_HERO_ICONS.MrsHolloway = 'icons/MrsHolloway.png';
  SPECIAL_HERO_ICONS.MrHolloway = 'icons/MrHolloway.png';
}

// Obtainment
if (typeof HERO_OBTAIN !== 'undefined') {
  HERO_OBTAIN.MrsHolloway = 'Event';
  HERO_OBTAIN.MrHolloway = 'Event';
}

// Tags
if (typeof HERO_GENDER !== 'undefined') {
  HERO_GENDER.MrsHolloway = 'Female';
  HERO_GENDER.MrHolloway = 'Male';
}
if (typeof HERO_COLOR !== 'undefined') {
  HERO_COLOR.MrsHolloway = 'Purple';
  HERO_COLOR.MrHolloway = 'Orange';
}
if (typeof HERO_THEME_TAGS !== 'undefined' && HERO_THEME_TAGS.Halloween) {
  HERO_THEME_TAGS.Halloween.ids.add('MrsHolloway');
  HERO_THEME_TAGS.Halloween.ids.add('MrHolloway');
}

// Enroll in snapshot lists
if (typeof HERO_IDS !== 'undefined') {
  if (!HERO_IDS.includes('MrsHolloway')) HERO_IDS.push('MrsHolloway');
  if (!HERO_IDS.includes('MrHolloway')) HERO_IDS.push('MrHolloway');
}
if (typeof PLAYABLE_IDS !== 'undefined') {
  if (!PLAYABLE_IDS.includes('MrsHolloway')) PLAYABLE_IDS.push('MrsHolloway');
  if (!PLAYABLE_IDS.includes('MrHolloway')) PLAYABLE_IDS.push('MrHolloway');
}
