/* badges_ribecca.js - Cheer Bear Shelly & Ribecca Friendship Badges (DHBM Standards). */
'use strict';

defBadge({
  id: 'cheerbear_shelly_ribecca', owner: 'CheerbearShelly', friend: 'Ribecca',
  name: "Ribecca's Pink Thread", icon: '🧵', color: '#ff8fc8',
  desc: 'A pink thread Ribecca left in the Cheer Bear costume as a quiet finishing touch.',
  stat: lvl => `+${(12 + lvl * 6).toFixed(0)}% Shield Power · +${(10 + lvl * 5).toFixed(0)}% Healing Power`,
  effect: "Ribecca's couture thread weaves a Harmonic Quilt of empathy! When Cheer Bear Shelly casts Encouragement or Cheer Beam, she wraps all allies in a Quilted Rainbow Shield (absorbing 18%+ Max HP for 8s), dispels 2 debuffs, reduces damage taken by 25% for 6s, and restores 30+ Energy. When an ally drops below 40% HP, a protective keytar echo stuns the attacker for 1.5s and grants the ally a Ward barrier and 20% heal.",
  apply(u, B, lvl) {
    u.flat.shieldPowP = (u.flat.shieldPowP || 0) + (0.12 + lvl * 0.06);
    u.flat.healPowP = (u.flat.healPowP || 0) + (0.10 + lvl * 0.05);
    u.dirty = true;

    // Harmonic Quilt on W / G
    const triggerHarmonicQuilt = () => {
      if (!u.alive) return;
      Sound.play('cure_all', { vol: 0.5 });
      Sound.play('get_rare', { vol: 0.4 });
      B.fxRing(u.x, u.y - 35, 180, '#ff8fc8', 0.45);
      B.alliesOf(u).forEach(a => {
        B.shield(u, a, u.max.hp * (0.18 + lvl * 0.05), 8);
        B.cleanse(a, 2);
        B.applyStatus(u, a, 'ward', 6);
        B.energy(a, 30 + lvl * 8);
        B.fxSparkle(a.x, a.y - 45, 8, '#ff8fc8');
      });
      B.fxFloatIcon(u.x, u.y - 110, '🧵 HARMONIC QUILT', '#ff8fc8');
    };

    B.on(u, 'cast', ev => {
      if (ev.key === 'W' || ev.key === 'G') triggerHarmonicQuilt();
    });

    B.on(u, 'statusApplied', ev => {
      if (ev.src === u && ev.id === 'cbencouraged' && ev.unit && ev.unit.team === u.team) {
        B.cleanse(ev.unit, 2);
        B.energy(ev.unit, 20 + lvl * 5);
        B.fxFloatIcon(ev.unit.x, ev.unit.y - 100, '🧵', '#ff8fc8');
      }
    });

    // Keytar Echo Emergency Rescue (<40% HP)
    B.on(u, 'allyDamaged', ev => {
      const a = ev.unit;
      if (!a || !a.alive || a.team !== u.team || B.t < (u._keytarRescueAt || 0)) return;
      if (a.hpPct <= 0.40) {
        u._keytarRescueAt = B.t + 10;
        Sound.play('cheer_big', { vol: 0.45 });
        B.applyStatus(u, a, 'ward', 5);
        B.heal(u, a, a.max.hp * (0.20 + lvl * 0.05), { tag: 'Keytar Echo' });
        if (ev.src && ev.src.alive && ev.src.team !== u.team) {
          B.applyStatus(u, ev.src, 'stun', 1.5);
          B.fxFloatIcon(ev.src.x, ev.src.y - 95, '🎵 ECHO STUN', '#ff8fc8');
        }
        B.fxFloatIcon(a.x, a.y - 105, '🧵 QUILT RESCUE!', '#ff8fc8');
      }
    });
  }
});

defBadge({
  id: 'ribecca_scraps', owner: 'Ribecca', friend: 'Scraps',
  name: "Scraps' Patchwork Pattern", icon: '🧷', color: '#c7a0ff',
  desc: 'A mismatched little seam that turned two strong ideas into one costume.',
  stat: lvl => `+${(12 + lvl * 6).toFixed(0)}% Control Resistance · +${(10 + lvl * 5).toFixed(0)}% Skill Haste`,
  effect: "Scraps' craft stitching turns Ribecca's ribbons into a Stage Armor barrier! When Ribecca applies Off Rhythm or casts Solo, she gains a Patchwork Barrier (20%+ Max HP for 6s), 3 stacks of Fortify, Focus, and reflects 30% of incoming damage for 5s. Enemies under Off Rhythm have Armor and Magic Defense shredded by 25%+ and take 50% extra True Damage from allied critical hits.",
  apply(u, B, lvl) {
    u.flat.ccRes = (u.flat.ccRes || 0) + (0.12 + lvl * 0.06);
    u.flat.cdr = (u.flat.cdr || 0) + (0.10 + lvl * 0.05);
    u.dirty = true;

    const triggerPatchworkArmor = () => {
      if (!u.alive || B.t < (u._patchworkStageAt || 0)) return;
      u._patchworkStageAt = B.t + 5;
      Sound.play('guard', { vol: 0.45 });
      B.shield(u, u, u.max.hp * (0.20 + lvl * 0.05), 6);
      B.applyStatus(u, u, 'fortify', 6, { stacks: 3 });
      B.applyStatus(u, u, 'focus', 5);
      B.applyStatus(u, u, 'reflect', 5, { val: 0.30 });
      B.energy(u, 25);
      B.fxFloatIcon(u.x, u.y - 110, '🧷 STAGE BARRIER', '#c7a0ff');
    };

    B.on(u, 'statusApplied', ev => {
      if (ev.src !== u || ev.id !== 'offrhythm' || !ev.unit || ev.unit.team === u.team) return;
      triggerPatchworkArmor();
      B.applyStatus(u, ev.unit, 'defdown', 6, { val: 0.25 + lvl * 0.05 });
      B.applyStatus(u, ev.unit, 'magdown', 6, { val: 0.25 + lvl * 0.05 });
    });

    B.on(u, 'cast', ev => {
      if (ev.key === 'W' || ev.key === 'G') triggerPatchworkArmor();
    });

    // 50% True Damage on Off Rhythm Crits
    B.on(u, 'allyDamageDealt', ev => {
      if (!ev || ev.chained || ev.tag === 'Patchwork Resonance' || !ev.crit || !ev.target || ev.target.team === u.team || !ev.target.alive) return;
      if (ev.target.hasStatus('offrhythm')) {
        B.damage(u, ev.target, ev.amount * 0.50, { type: 'true', chained: true, tag: 'Patchwork Resonance' });
        B.fxSparkle(ev.target.x, ev.target.y - 45, 6, '#c7a0ff');
      }
    });
  }
});
