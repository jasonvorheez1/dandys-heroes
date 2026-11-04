/* friendship-expansion.js — Complete Friendship Badges & Campaigns Expansion
   Provides unique friendship badges and multi-stage friendship campaigns for all
   playable characters previously lacking badges or campaigns, ensuring 100% full
   coverage across the entire roster.
   
   Includes:
   - 16 brand new Friendship Badges (Cosmo, Coal, Looey, Eggson, Soulvester, Pebble,
     Riku, Donald, Barret, Sephiroth, BedtimeAstro, Cody, Nugget, Discard, Selena, Copper)
     featuring Wave Start power surges, continuous DPS / shredding / DoTs, team stat sharing,
     and buff/debuff denial.
   - 37 authored Friendship Campaigns with rich multi-stage story progression and
     in-character dialogue nodes.
   - 37 dedicated opening greeting scenes in FRIENDSHIP_GREETING_LINES.
   - Automatic save migration ensuring all heroes have access to their badges and campaigns. */
'use strict';

(() => {
  const isServer = typeof window === 'undefined';
  const getGlobal = name => (typeof window !== 'undefined' ? window[name] : (typeof global !== 'undefined' ? global[name] : undefined));

  const badges = getGlobal('BADGES') || (typeof BADGES !== 'undefined' ? BADGES : null);
  const campaigns = getGlobal('CAMPAIGNS') || (typeof CAMPAIGNS !== 'undefined' ? CAMPAIGNS : null);
  const greetings = getGlobal('FRIENDSHIP_GREETING_LINES') || (typeof FRIENDSHIP_GREETING_LINES !== 'undefined' ? FRIENDSHIP_GREETING_LINES : null);

  const safePlay = (id, opts) => {
    if (typeof Sound !== 'undefined' && Sound && typeof Sound.play === 'function') {
      try { Sound.play(id, opts); } catch (e) {}
    }
  };

  const onWaveAndStart = (u, B, fn) => {
    B.after(0.12, () => { if (u && u.alive) fn(); });
    B.on(u, 'waveStart', () => { if (u && u.alive) fn(); });
  };

  const applyTeamStatShare = (u, B, statName, fraction) => {
    if (!u || !B) return;
    B.alliesOf(u).filter(a => a.alive && a !== u).forEach(a => {
      B.applyStatus(u, a, 'statshare', 999, { val: fraction });
    });
  };

  const calcRecLevel = (a, b) => {
    if (typeof friendshipRecLevel === 'function') {
      try { return friendshipRecLevel(a, b); } catch (e) {}
    }
    return 80;
  };

  /* =========================================================================
     PART 1: NEW FRIENDSHIP BADGES (16 HEROES)
     ========================================================================= */

  /* 1. COSMO — Sprout's Strawberry Seeds (cosmo_sprout) */
  defBadge({
    id: 'cosmo_sprout', owner: 'Cosmo', friend: 'Sprout', immediate: true,
    name: "Sprout's Strawberry Seeds", icon: '🍓', color: '#ff5c7c',
    desc: "A small pouch of heirloom strawberry seeds Sprout harvested from the sunniest garden corner for Cosmo's fresh tarts.",
    stat: lvl => `+${(18 + lvl * 6).toFixed(0)}% Shield Power · +${(15 + lvl * 5).toFixed(0)}% Magic Power · +${(20 + lvl * 6).toFixed(0)}% Max HP`,
    effect: "Sprout's ripe garden harvest supercharges Cosmo's culinary alchemy! At wave start: Sprout's berry vines flourish, granting all allies a Strawberry Shield equal to 22%+ Max HP for 8s, +20% Move Speed, and immunity to Bleed and Burn. Cosmo shares 20% of his Magic Power with all allies. Cosmo's pastry attacks and abilities inflict Sweet Glaze, burning enemies for 45%+ Magic Damage per second for 5s and shredding 20% Magic Defense. When enemies hit with Sweet Glaze attempt to gain buffs, their next 2 buffs are denied (Buff Sealed).",
    apply(u, B, lvl) {
      u.flat.shieldPowP = (u.flat.shieldPowP || 0) + 0.18 + lvl * 0.06;
      u.flat.magP = (u.flat.magP || 0) + 0.15 + lvl * 0.05;
      u.flat.hpP = (u.flat.hpP || 0) + 0.20 + lvl * 0.06;
      u.dirty = true;

      // Bleed and burn guard
      u.guards = u.guards || [];
      u.guards.push((id, def) => (id === 'burn' || id === 'bleed' || (def && (def.dot === 'burn' || def.dot === 'bleed'))));

      const berryBloom = () => {
        if (!u.alive) return;
        safePlay('get_rare', { vol: 0.45 });
        const shieldAmt = u.max.hp * (0.22 + lvl * 0.05);
        B.alliesOf(u).forEach(a => {
          B.shield(u, a, shieldAmt, 8);
          B.applyStatus(u, a, 'haste', 8, { val: 0.20 });
          B.cleanse(a, 1);
          B.fxSparkle(a.x, a.y - 45, 6, '#ff5c7c');
        });
        applyTeamStatShare(u, B, 'mag', 0.20 + lvl * 0.02);
        B.fxFloatIcon(u.x, u.y - 110, '🍓 STRAWBERRY BLOOM', '#ff5c7c');
      };

      onWaveAndStart(u, B, berryBloom);

      // Sweet Glaze DoT & Buff Denial
      B.on(u, 'dealDamage', ev => {
        if (!ev.target || ev.target.team === u.team || ev.dot || !ev.target.alive) return;
        B.applyStatus(u, ev.target, 'mdefdown', 5, { val: 0.20 });
        B.applyStatus(u, ev.target, 'buffsealed', 6, { stacks: 2 });
        B.damage(u, ev.target, u.st.mag * (0.45 + lvl * 0.15), { type: 'magic', dot: 'sweet_glaze', tag: 'Sweet Glaze' });
      });
    }
  });

  /* 2. COAL — Bobette's Knitted Mittens (coal_bobette) */
  defBadge({
    id: 'coal_bobette', owner: 'Coal', friend: 'Bobette', immediate: true,
    name: "Bobette's Knitted Mittens", icon: '🧤', color: '#ff8a50',
    desc: "Extra-thick yarn mittens Bobette knitted with heat-resistant fleece so Coal doesn't singe his knuckles tending the boiler.",
    stat: lvl => `+${(20 + lvl * 6).toFixed(0)}% Defense · +${(18 + lvl * 5).toFixed(0)}% Magic Defense · +${(15 + lvl * 4).toFixed(0)}% Damage Reduction`,
    effect: "Bobette's loving handiwork insulates Coal's blazing furnace core! At wave start: ignites the Hearthfire, granting Coal and all allies +35% Tenacity, +25% Armor for 8s, and cleansing 1 debuff from all allies. Coal shares 20% of his Defense with all allies. Nearby enemies within 180px take 60%+ Defense as True Fire Damage every 1.5s. When any ally is afflicted with hard Crowd Control, the mittens radiate protective warmth, immediately cleansing the CC and granting 3s CC Immunity (8s cooldown).",
    apply(u, B, lvl) {
      u.flat.defP = (u.flat.defP || 0) + 0.20 + lvl * 0.06;
      u.flat.mdefP = (u.flat.mdefP || 0) + 0.18 + lvl * 0.05;
      u.flat.dmgRedP = (u.flat.dmgRedP || 0) + 0.15 + lvl * 0.04;
      u.dirty = true;

      const hearthfire = () => {
        if (!u.alive) return;
        safePlay('fire_ignite', { vol: 0.5 });
        B.fxRing(u.x, u.y - 30, 200, '#ff8a50', 0.5);
        B.alliesOf(u).forEach(a => {
          B.applyStatus(u, a, 'tenacity', 8, { val: 0.35 });
          B.applyStatus(u, a, 'defup', 8, { val: 0.25 });
          B.cleanse(a, 1);
        });
        applyTeamStatShare(u, B, 'def', 0.20 + lvl * 0.02);
        B.fxFloatIcon(u.x, u.y - 110, '🧤 HEARTHFIRE AURA', '#ff8a50');
      };

      onWaveAndStart(u, B, hearthfire);

      // Continuous furnace aura DPS
      B.every(1.5, () => {
        if (!u.alive) return;
        B.enemiesOf(u).filter(e => e.alive && Math.abs(e.x - u.x) <= 180).forEach(e => {
          B.damage(u, e, u.st.def * (0.60 + lvl * 0.15), { type: 'true', tag: 'Hearth Scorch' });
          B.fxSparkle(e.x, e.y - 30, 4, '#ff8a50');
        });
      });

      // CC protection for team
      B.on(u, 'allyDebuffed', ev => {
        if (!ev.target || !ev.target.alive || B.t < (u._coalMittenCleanseAt || 0)) return;
        if (ev.id === 'stun' || ev.id === 'freeze' || ev.id === 'daze' || ev.id === 'sleep') {
          u._coalMittenCleanseAt = B.t + 8;
          B.cleanseAll(ev.target);
          B.applyStatus(u, ev.target, 'ccimmune', 3.0);
          B.fxFloatIcon(ev.target.x, ev.target.y - 90, '✨ WARM RESCUE', '#ff8a50');
        }
      });
    }
  });

  /* 3. LOOEY — Yatta's Party Horn (looey_yatta) */
  defBadge({
    id: 'looey_yatta', owner: 'Looey', friend: 'Yatta', immediate: true,
    name: "Yatta's Party Horn", icon: '🎉', color: '#ff69b4',
    desc: "A rainbow spiral horn Yatta saved from the biggest circus carnival. Squeaks with deafening festive vigor.",
    stat: lvl => `+${(22 + lvl * 7).toFixed(0)}% Attack Speed · +${(18 + lvl * 5).toFixed(0)}% Crit Chance · +${(20 + lvl * 5).toFixed(0)}% Move Speed`,
    effect: "Yatta's festive carnival spirit turns Looey's clowning into an unstoppable show! At wave start: blasts the Grand Fanfare, stunning the 2 farthest enemies for 1.8s, dispelling 2 buffs from each, and granting all allies +35% Attack Speed and +25% Move Speed for 7s. Looey shares 20% of his Attack Speed with all allies. Looey is immune to Slow and Attack Speed debuffs. Critical hits unleash Confetti Bursts, dealing 120%+ Attack Physical AoE Damage to all enemies within 160px and denying enemy buffs (Buff Sealed).",
    apply(u, B, lvl) {
      u.flat.aspdP = (u.flat.aspdP || 0) + 0.22 + lvl * 0.07;
      u.flat.crit = (u.flat.crit || 0) + 0.18 + lvl * 0.05;
      u.flat.spd = (u.flat.spd || 0) + 0.20 + lvl * 0.05;
      u.dirty = true;

      // Slow immunity
      u.guards = u.guards || [];
      u.guards.push((id) => (id === 'slow' || id === 'aspddown'));

      const partyFanfare = () => {
        if (!u.alive) return;
        safePlay('pop_horn', { vol: 0.6 });
        const targets = B.enemiesOf(u).filter(e => e.alive).sort((a, b) => Math.abs(b.x - u.x) - Math.abs(a.x - u.x)).slice(0, 2);
        targets.forEach(t => {
          B.applyStatus(u, t, 'stun', 1.8);
          B.dispel(t, 2);
          B.applyStatus(u, t, 'buffsealed', 6, { stacks: 2 });
          B.fxFloatIcon(t.x, t.y - 100, '🎉 STUNNED', '#ff69b4');
        });
        B.alliesOf(u).forEach(a => {
          B.applyStatus(u, a, 'haste', 7, { val: 0.35 });
        });
        applyTeamStatShare(u, B, 'aspd', 0.20 + lvl * 0.02);
        B.fxFloatIcon(u.x, u.y - 110, '🎉 GRAND FANFARE', '#ff69b4');
      };

      onWaveAndStart(u, B, partyFanfare);

      // Confetti burst on crit
      B.on(u, 'dealDamage', ev => {
        if (!ev.crit || !ev.target || ev.target.team === u.team || !ev.target.alive) return;
        safePlay('pop_balloon', { vol: 0.4 });
        B.fxRing(ev.target.x, ev.target.y - 30, 160, '#ff69b4', 0.35);
        B.enemiesOf(u).filter(e => e.alive && Math.abs(e.x - ev.target.x) <= 160).forEach(e => {
          B.damage(u, e, u.st.atk * (1.20 + lvl * 0.30), { type: 'physical', tag: 'Confetti Pop' });
          B.applyStatus(u, e, 'buffsealed', 4, { stacks: 1 });
        });
      });
    }
  });

  /* 4. EGGSON — Rudie's Red Bulb (eggson_rudie) */
  defBadge({
    id: 'eggson_rudie', owner: 'Eggson', friend: 'Rudie', immediate: true,
    name: "Rudie's Red Bulb", icon: '🔴', color: '#ff3344',
    desc: "A spare glowing red nose bulb Rudie gifted Eggson so he never loses his footing in pitch-black storage rooms.",
    stat: lvl => `+${(20 + lvl * 6).toFixed(0)}% Armor Penetration · +${(18 + lvl * 5).toFixed(0)}% Attack · +${(15 + lvl * 5).toFixed(0)}% Skill Haste`,
    effect: "Rudie's luminous beacon sharpens Eggson's detective scrutiny! At wave start: fires an intense Spotting Spotlight illuminating all enemies, stripping 2 buffs and decreasing their Armor and Magic Defense by 35% for 8s. Eggson shares 20% of his Armor Penetration and Attack with all allies. Eggson is immune to Blind, Silence, and Accuracy penalties. Attacks inflict Red Tracer, dealing 40%+ Attack Physical Damage every second for 4s and causing all ally attacks against them to deal +18% bonus damage.",
    apply(u, B, lvl) {
      u.flat.arpenP = (u.flat.arpenP || 0) + 0.20 + lvl * 0.06;
      u.flat.atkP = (u.flat.atkP || 0) + 0.18 + lvl * 0.05;
      u.flat.cdr = (u.flat.cdr || 0) + 0.15 + lvl * 0.05;
      u.dirty = true;

      // Blind & silence immunity
      u.guards = u.guards || [];
      u.guards.push(id => id === 'blind' || id === 'silence');

      const spotlight = () => {
        if (!u.alive) return;
        safePlay('laser_shoot', { vol: 0.5 });
        B.enemiesOf(u).filter(e => e.alive).forEach(e => {
          B.dispel(e, 2);
          B.applyStatus(u, e, 'defdown', 8, { val: 0.35 });
          B.applyStatus(u, e, 'mdefdown', 8, { val: 0.35 });
          B.fxSparkle(e.x, e.y - 40, 8, '#ff3344');
        });
        applyTeamStatShare(u, B, 'atk', 0.20 + lvl * 0.02);
        applyTeamStatShare(u, B, 'arpen', 0.20 + lvl * 0.02);
        B.fxFloatIcon(u.x, u.y - 110, '🔴 SPOTTING BEACON', '#ff3344');
      };

      onWaveAndStart(u, B, spotlight);

      B.on(u, 'dealDamage', ev => {
        if (!ev.target || ev.target.team === u.team || ev.dot || !ev.target.alive) return;
        B.damage(u, ev.target, u.st.atk * (0.40 + lvl * 0.10), { type: 'physical', dot: 'red_tracer', tag: 'Red Tracer' });
        B.applyStatus(u, ev.target, 'vuln', 4, { val: 0.18 });
      });
    }
  });

  /* 5. SOULVESTER — Connie's Spectral Ribbon (soulvester_connie) */
  defBadge({
    id: 'soulvester_connie', owner: 'Soulvester', friend: 'Connie', immediate: true,
    name: "Connie's Spectral Ribbon", icon: '🎗️', color: '#a88beb',
    desc: "An enchanted ethereal ribbon Connie tied to Soulvester's broadsword hilt to ward off spectral chills.",
    stat: lvl => `+${(20 + lvl * 6).toFixed(0)}% Magic Power · +${(20 + lvl * 6).toFixed(0)}% Magic Defense · +${(18 + lvl * 5).toFixed(0)}% Max HP`,
    effect: "Connie's spectral enchantment empowers Soulvester's ghostly chivalry! At wave start: deploys the Phantom Bastion, granting all allies a 22%+ Max HP Spectral Shield and CC Immunity for 5s. Soulvester shares 20% of his Magic Defense with all allies. When Soulvester or any shielded ally takes damage, Connie's ribbon retaliates with Ghostly Thrust, dealing 90%+ Magic Damage to the attacker, dispelling 1 buff, draining 15 Energy, and denying incoming buffs (Buff Sealed).",
    apply(u, B, lvl) {
      u.flat.magP = (u.flat.magP || 0) + 0.20 + lvl * 0.06;
      u.flat.mdefP = (u.flat.mdefP || 0) + 0.20 + lvl * 0.06;
      u.flat.hpP = (u.flat.hpP || 0) + 0.18 + lvl * 0.05;
      u.dirty = true;

      const phantomBastion = () => {
        if (!u.alive) return;
        safePlay('ghost_swoop', { vol: 0.45 });
        const shieldAmt = u.max.hp * (0.22 + lvl * 0.05);
        B.alliesOf(u).forEach(a => {
          B.shield(u, a, shieldAmt, 8);
          B.applyStatus(u, a, 'ccimmune', 5.0);
        });
        applyTeamStatShare(u, B, 'mdef', 0.20 + lvl * 0.02);
        B.fxFloatIcon(u.x, u.y - 110, '🎗️ PHANTOM BASTION', '#a88beb');
      };

      onWaveAndStart(u, B, phantomBastion);

      // Retaliatory Ghostly Thrust
      B.on(u, 'damaged', ev => {
        if (!ev.src || ev.src.team === u.team || !ev.src.alive || ev.dot) return;
        if (B.t < (u._ghostThrustAt || 0)) return;
        u._ghostThrustAt = B.t + Math.max(1.8, 3.5 - lvl * 0.25);
        safePlay('hit_magic', { vol: 0.45 });
        B.damage(u, ev.src, u.st.mag * (0.90 + lvl * 0.25), { type: 'magic', tag: 'Ghostly Thrust' });
        B.dispel(ev.src, 1);
        B.energy(ev.src, -15);
        B.applyStatus(u, ev.src, 'buffsealed', 5, { stacks: 1 });
        B.fxFloatIcon(ev.src.x, ev.src.y - 95, '⚔️ GHOST THRUST', '#a88beb');
      });
    }
  });

  /* 6. PEBBLE — Dandy's Golden Whistle (pebble_dandy) */
  defBadge({
    id: 'pebble_dandy', owner: 'Pebble', friend: 'Dandy', immediate: true,
    name: "Dandy's Golden Whistle", icon: '🐕', color: '#ffd700',
    desc: "A polished brass whistle Dandy uses to call his favorite puppy for treats, belly rubs, and grand stage entrances.",
    stat: lvl => `+${(25 + lvl * 8).toFixed(0)}% Max HP · +${(18 + lvl * 5).toFixed(0)}% Damage Reduction · +${(20 + lvl * 6).toFixed(0)}% Tenacity`,
    effect: "Dandy's proud commands inspire Pebble to be the best boy! At wave start: Pebble emits a Loyal Bark, taunting the highest-damage enemy for 4.5s, granting Pebble +40% Defense for 8s, and giving the team Knockback and Charm Immunity. Pebble shares 20% of his Max HP with all allies. Pebble's bites deal bonus Physical Damage equal to 8%+ of Pebble's Max HP. Whenever attacked, Pebble counter-barks, dealing 120%+ Defense Physical Damage to nearby enemies, interrupting casts, and sealing enemy buffs (Buff Sealed).",
    apply(u, B, lvl) {
      u.flat.hpP = (u.flat.hpP || 0) + 0.25 + lvl * 0.08;
      u.flat.dmgRedP = (u.flat.dmgRedP || 0) + 0.18 + lvl * 0.05;
      u.flat.tenacity = (u.flat.tenacity || 0) + 0.20 + lvl * 0.06;
      u.dirty = true;

      // Immunity to knockback and charm
      B.grantTeamKnockbackImmunity(u);
      u.guards = u.guards || [];
      u.guards.push(id => id === 'charm' || id === 'fear');

      const loyalBark = () => {
        if (!u.alive) return;
        safePlay('pebble_bark', { vol: 0.65 });
        const strongest = B.enemiesOf(u).filter(e => e.alive).sort((a, b) => b.st.atk - a.st.atk)[0];
        if (strongest) {
          B.applyStatus(u, strongest, 'taunt', 4.5, { target: u });
          B.applyStatus(u, strongest, 'buffsealed', 6, { stacks: 2 });
          B.fxFloatIcon(strongest.x, strongest.y - 100, '🐕 TAUNTED', '#ffd700');
        }
        B.applyStatus(u, u, 'defup', 8, { val: 0.40 });
        applyTeamStatShare(u, B, 'hp', 0.20 + lvl * 0.02);
        B.fxFloatIcon(u.x, u.y - 110, '🐕 LOYAL BARK', '#ffd700');
      };

      onWaveAndStart(u, B, loyalBark);

      // Max HP scaling damage
      B.on(u, 'dealDamage', ev => {
        if (!ev.target || ev.target.team === u.team || ev.dot || !ev.target.alive) return;
        const bonusDmg = u.max.hp * (0.08 + lvl * 0.02);
        B.damage(u, ev.target, bonusDmg, { type: 'physical', tag: 'Chomp Bonus' });
      });

      // Retaliatory counter-bark
      B.on(u, 'damaged', ev => {
        if (!ev.src || ev.src.team === u.team || ev.dot || !ev.src.alive) return;
        if (B.t < (u._pebbleCounterAt || 0)) return;
        u._pebbleCounterAt = B.t + Math.max(2.0, 3.8 - lvl * 0.25);
        safePlay('dog_bark', { vol: 0.5 });
        B.enemiesOf(u).filter(e => e.alive && Math.abs(e.x - u.x) <= 180).forEach(e => {
          B.damage(u, e, u.st.def * (1.20 + lvl * 0.30), { type: 'physical', tag: 'Counter Bark' });
          B.applyStatus(u, e, 'buffsealed', 4, { stacks: 1 });
        });
      });
    }
  });

  /* 7. RIKU — Way to the Dawn Charm (riku_sora) */
  defBadge({
    id: 'riku_sora', owner: 'Riku', friend: 'Sora', immediate: true,
    name: "Way to the Dawn Charm", icon: '🗝️', color: '#4a69bd',
    desc: "A silver paopu-fruit keepsake representing Riku's oath to walk the twilight road to dawn and protect his friends.",
    stat: lvl => `+${(22 + lvl * 7).toFixed(0)}% Attack · +${(18 + lvl * 5).toFixed(0)}% Crit Damage · +${(18 + lvl * 5).toFixed(0)}% Magic Power`,
    effect: "The bond between Destiny Island champions stirs Riku's twilight resolve! At wave start: surges with Dark Aura Awakening, granting +40% Attack, +30% Skill Haste, and CC Immunity for 10s. Riku shares 20% of his Attack and Magic with all allies. Basic attacks have a 40% chance to unleash Dark Firaga, detonating for 160%+ Hybrid Damage, dispelling 2 buffs, burning enemies, and denying incoming buffs (Buff Sealed). Riku is guarded against Blind and Darkness.",
    apply(u, B, lvl) {
      u.flat.atkP = (u.flat.atkP || 0) + 0.22 + lvl * 0.07;
      u.flat.critdmg = (u.flat.critdmg || 0) + 0.18 + lvl * 0.05;
      u.flat.magP = (u.flat.magP || 0) + 0.18 + lvl * 0.05;
      u.dirty = true;

      u.guards = u.guards || [];
      u.guards.push(id => id === 'blind' || id === 'darkness');

      const darkAura = () => {
        if (!u.alive) return;
        safePlay('kh_dark_aura', { vol: 0.6 });
        B.applyStatus(u, u, 'atkup', 10, { val: 0.40 });
        B.applyStatus(u, u, 'haste', 10, { val: 0.30 });
        B.applyStatus(u, u, 'ccimmune', 10.0);
        applyTeamStatShare(u, B, 'atk', 0.20 + lvl * 0.02);
        applyTeamStatShare(u, B, 'mag', 0.20 + lvl * 0.02);
        B.fxFloatIcon(u.x, u.y - 110, '🗝️ DARK AURA', '#4a69bd');
      };

      onWaveAndStart(u, B, darkAura);

      B.on(u, 'dealDamage', ev => {
        if (!ev.target || ev.target.team === u.team || ev.dot || !ev.target.alive) return;
        if (Math.random() < 0.40) {
          safePlay('kh_dark_fire', { vol: 0.5 });
          const hybrid = (u.st.atk + u.st.mag) * 0.5 * (1.60 + lvl * 0.40);
          B.damage(u, ev.target, hybrid, { type: 'magic', tag: 'Dark Firaga' });
          B.dispel(ev.target, 2);
          B.applyStatus(u, ev.target, 'buffsealed', 6, { stacks: 2 });
          B.applyStatus(u, ev.target, 'burn', 4, { val: 0.15 });
          B.fxRing(ev.target.x, ev.target.y - 35, 140, '#4a69bd', 0.4);
        }
      });
    }
  });

  /* 8. DONALD — Royal Court Insignia (donald_goofy) */
  defBadge({
    id: 'donald_goofy', owner: 'Donald', friend: 'Goofy', immediate: true,
    name: "Royal Court Insignia", icon: '⚡', color: '#00a8ff',
    desc: "The royal court magician crest worn proudly alongside Captain Goofy across countless world voyages.",
    stat: lvl => `+${(22 + lvl * 7).toFixed(0)}% Magic Power · +${(20 + lvl * 6).toFixed(0)}% Skill Haste · +${(16 + lvl * 5).toFixed(0)}% Magic Penetration`,
    effect: "Donald's royal arcane masteries unleash tempestuous fury! At wave start: casts Zettaflare Surge, striking all enemies for 140%+ Magic Damage, dispelling 2 buffs, shocking them for 4s, and sealing their buffs. Donald shares 20% of his Magic and Skill Haste with all allies. Donald is immune to Silence and Energy Drain. Casting any skill restores 15 Energy to the nearest ally and amplifies enemy Magic Damage taken by 25%+ for 6s.",
    apply(u, B, lvl) {
      u.flat.magP = (u.flat.magP || 0) + 0.22 + lvl * 0.07;
      u.flat.cdr = (u.flat.cdr || 0) + 0.20 + lvl * 0.06;
      u.flat.mpenP = (u.flat.mpenP || 0) + 0.16 + lvl * 0.05;
      u.dirty = true;

      u.guards = u.guards || [];
      u.guards.push(id => id === 'silence');

      const zettaSurge = () => {
        if (!u.alive) return;
        safePlay('thunder_strike', { vol: 0.6 });
        B.enemiesOf(u).filter(e => e.alive).forEach(e => {
          B.damage(u, e, u.st.mag * (1.40 + lvl * 0.35), { type: 'magic', tag: 'Zettaflare Surge' });
          B.dispel(e, 2);
          B.applyStatus(u, e, 'stun', 1.0);
          B.applyStatus(u, e, 'buffsealed', 6, { stacks: 2 });
          B.fxSparkle(e.x, e.y - 45, 10, '#00a8ff');
        });
        applyTeamStatShare(u, B, 'mag', 0.20 + lvl * 0.02);
        applyTeamStatShare(u, B, 'cdr', 0.20 + lvl * 0.02);
        B.fxFloatIcon(u.x, u.y - 110, '⚡ ZETTAFLARE SURGE', '#00a8ff');
      };

      onWaveAndStart(u, B, zettaSurge);

      B.on(u, 'cast', () => {
        const nearest = B.alliesOf(u).filter(a => a.alive && a !== u).sort((a, b) => B.distance(a, u) - B.distance(b, u))[0];
        if (nearest) {
          B.energy(nearest, 15);
          B.fxFloatIcon(nearest.x, nearest.y - 80, '+15 ENERGY', '#00a8ff');
        }
        B.enemiesOf(u).filter(e => e.alive).forEach(e => {
          B.applyStatus(u, e, 'mdefdown', 6, { val: 0.25 + lvl * 0.05 });
        });
      });
    }
  });

  /* 9. BARRET — AVALANCHE Dogtags (barret_cloud) */
  defBadge({
    id: 'barret_cloud', owner: 'Barret', friend: 'Cloud', immediate: true,
    name: "AVALANCHE Dogtags", icon: '🎖️', color: '#e67e22',
    desc: "Cloud's spare military dogtags etched with the Avalanche crest, symbolizing the front-line fight for the Planet's life.",
    stat: lvl => `+${(22 + lvl * 7).toFixed(0)}% Attack · +${(20 + lvl * 6).toFixed(0)}% Armor Penetration · +${(18 + lvl * 5).toFixed(0)}% Max HP`,
    effect: "Barret's fiery passion rallies the vanguard! At wave start: unleashes Heavy Gatling Salvo, spraying all enemies with suppressive fire that shreds 35% Armor for 8s and knocks them back. Barret shares 20% of his Attack and Armor Penetration with all allies. Barret is immune to Knockback and Stun. Barret's attacks deal 30%+ bonus Physical Damage against shielded foes or foes above 50% HP, and critical hits crack enemy shields by 35%.",
    apply(u, B, lvl) {
      u.flat.atkP = (u.flat.atkP || 0) + 0.22 + lvl * 0.07;
      u.flat.arpenP = (u.flat.arpenP || 0) + 0.20 + lvl * 0.06;
      u.flat.hpP = (u.flat.hpP || 0) + 0.18 + lvl * 0.05;
      u.dirty = true;

      B.grantTeamKnockbackImmunity(u);
      u.guards = u.guards || [];
      u.guards.push(id => id === 'stun');

      const gatlingSalvo = () => {
        if (!u.alive) return;
        safePlay('gun_barrage', { vol: 0.6 });
        B.enemiesOf(u).filter(e => e.alive).forEach(e => {
          B.damage(u, e, u.st.atk * (0.80 + lvl * 0.20), { type: 'physical', tag: 'Gatling Salvo' });
          B.applyStatus(u, e, 'defdown', 8, { val: 0.35 });
          B.applyStatus(u, e, 'slow', 4, { val: 0.30 });
          B.fxSparkle(e.x, e.y - 35, 6, '#e67e22');
        });
        applyTeamStatShare(u, B, 'atk', 0.20 + lvl * 0.02);
        applyTeamStatShare(u, B, 'arpen', 0.20 + lvl * 0.02);
        B.fxFloatIcon(u.x, u.y - 110, '🎖️ HEAVY GATLING', '#e67e22');
      };

      onWaveAndStart(u, B, gatlingSalvo);

      B.on(u, 'dealDamage', ev => {
        if (!ev.target || ev.target.team === u.team || ev.dot || !ev.target.alive) return;
        if ((ev.target.shields && ev.target.shields.length > 0) || (ev.target.hp / ev.target.max.hp > 0.50)) {
          B.damage(u, ev.target, ev.amount * (0.30 + lvl * 0.08), { type: 'physical', tag: 'Heavy Impact' });
        }
        if (ev.crit) {
          B.crackShield(u, ev.target, 0.35);
        }
      });
    }
  });

  /* 10. SEPHIROTH — Black One-Winged Feather (sephiroth_cloud) */
  defBadge({
    id: 'sephiroth_cloud', owner: 'Sephiroth', friend: 'Cloud', immediate: true,
    name: "Black One-Winged Feather", icon: '🪶', color: '#2c3e50',
    desc: "A single pitch-black pinion feather radiating cold Jenova resonance and transcendent swordsmanship.",
    stat: lvl => `+${(25 + lvl * 8).toFixed(0)}% Attack · +${(22 + lvl * 7).toFixed(0)}% Magic Power · +${(20 + lvl * 6).toFixed(0)}% Crit Chance`,
    effect: "The legendary One-Winged Angel descends upon the battlefield! At wave start: terrifying pressure overwhelms enemies (-25% enemy Attack & Attack Speed for 7s), while Sephiroth gains +40% Attack & Magic and CC Immunity for 10s. Sephiroth shares 20% of his Magic Penetration and Attack with all allies. Attacks inflict Scintilla Rupture, dealing 80%+ True Damage over 4s, stripping all enemy shields, and sealing incoming buffs (Buff Sealed). Critical hits execute non-boss enemies below 15% HP.",
    apply(u, B, lvl) {
      u.flat.atkP = (u.flat.atkP || 0) + 0.25 + lvl * 0.08;
      u.flat.magP = (u.flat.magP || 0) + 0.22 + lvl * 0.07;
      u.flat.crit = (u.flat.crit || 0) + 0.20 + lvl * 0.06;
      u.dirty = true;

      const oneWingDescent = () => {
        if (!u.alive) return;
        safePlay('sephiroth_descend', { vol: 0.65 });
        B.enemiesOf(u).filter(e => e.alive).forEach(e => {
          B.applyStatus(u, e, 'atkdown', 7, { val: 0.25 });
          B.applyStatus(u, e, 'aspddown', 7, { val: 0.25 });
          B.fxSparkle(e.x, e.y - 50, 8, '#2c3e50');
        });
        B.applyStatus(u, u, 'atkup', 10, { val: 0.40 });
        B.applyStatus(u, u, 'magup', 10, { val: 0.40 });
        B.applyStatus(u, u, 'ccimmune', 10.0);
        applyTeamStatShare(u, B, 'atk', 0.20 + lvl * 0.02);
        applyTeamStatShare(u, B, 'mpen', 0.20 + lvl * 0.02);
        B.fxFloatIcon(u.x, u.y - 110, '🪶 ONE-WINGED ANGEL', '#2c3e50');
      };

      onWaveAndStart(u, B, oneWingDescent);

      B.on(u, 'dealDamage', ev => {
        if (!ev.target || ev.target.team === u.team || ev.dot || !ev.target.alive) return;
        B.damage(u, ev.target, (u.st.atk + u.st.mag) * 0.5 * (0.80 + lvl * 0.20), { type: 'true', dot: 'scintilla', tag: 'Scintilla Rupture' });
        B.crackShield(u, ev.target, 1.0);
        B.applyStatus(u, ev.target, 'buffsealed', 6, { stacks: 2 });
        // Execute threshold
        if (ev.crit && !ev.target.isBoss && ev.target.hp / ev.target.max.hp < 0.15) {
          B.damage(u, ev.target, ev.target.hp + 9999, { type: 'true', tag: 'Octaslash Execute' });
          B.fxFloatIcon(ev.target.x, ev.target.y - 100, '💀 EXECUTED', '#2c3e50');
        }
      });
    }
  });

  /* 11. BEDTIME ASTRO — Slumber Moon Pillow (bedtimeastro_astro) */
  defBadge({
    id: 'bedtimeastro_astro', owner: 'BedtimeAstro', friend: 'Astro', immediate: true,
    name: "Slumber Moon Pillow", icon: '🌙', color: '#9b59b6',
    desc: "A super-fluffy lavender plush pillow scented with chamomile and cosmic stardust for the deepest, sweet slumber.",
    stat: lvl => `+${(20 + lvl * 6).toFixed(0)}% Healing Power · +${(22 + lvl * 7).toFixed(0)}% Max HP · +${(18 + lvl * 5).toFixed(0)}% Shield Power`,
    effect: "Bedtime Astro's gentle lullaby brings tranquil peace to every battlefield! At wave start: spreads Starlight Lullaby, inflicting Drowsy on all enemies (-30% Attack Speed & -25% Move Speed for 6s) and shielding all allies for 20%+ Max HP for 8s. Bedtime Astro shares 20% of his Max HP and Healing Power with all allies. The team takes 15% reduced damage while shielded. When shielded allies attack, they release Dream Sparks dealing 50%+ Magic Damage and dispelling 1 debuff from themselves.",
    apply(u, B, lvl) {
      u.flat.healPowP = (u.flat.healPowP || 0) + 0.20 + lvl * 0.06;
      u.flat.hpP = (u.flat.hpP || 0) + 0.22 + lvl * 0.07;
      u.flat.shieldPowP = (u.flat.shieldPowP || 0) + 0.18 + lvl * 0.05;
      u.dirty = true;

      u.guards = u.guards || [];
      u.guards.push(id => id === 'sleep' || id === 'daze');

      const lullaby = () => {
        if (!u.alive) return;
        safePlay('magic_chime', { vol: 0.5 });
        B.enemiesOf(u).filter(e => e.alive).forEach(e => {
          B.applyStatus(u, e, 'aspddown', 6, { val: 0.30 });
          B.applyStatus(u, e, 'slow', 6, { val: 0.25 });
        });
        const shieldAmt = u.max.hp * (0.20 + lvl * 0.05);
        B.alliesOf(u).forEach(a => {
          B.shield(u, a, shieldAmt, 8);
          B.cleanse(a, 1);
        });
        applyTeamStatShare(u, B, 'hp', 0.20 + lvl * 0.02);
        B.fxFloatIcon(u.x, u.y - 110, '🌙 SWEET DREAMS', '#9b59b6');
      };

      onWaveAndStart(u, B, lullaby);

      B.on(u, 'dealDamage', ev => {
        if (!ev.target || ev.target.team === u.team || !ev.target.alive) return;
        B.damage(u, ev.target, u.st.mag * (0.50 + lvl * 0.15), { type: 'magic', tag: 'Dream Sparks' });
        B.cleanse(u, 1);
      });
    }
  });

  /* 12. CODY — Dango's Animated Flipbook (cody_dango) */
  defBadge({
    id: 'cody_dango', owner: 'Cody', friend: 'Dango', immediate: true,
    name: "Dango's Animated Flipbook", icon: '📖', color: '#e056fd',
    desc: "A pocket cartoon flipbook sketched by Dango featuring Cody doing exaggerated acrobatic jumps and heroic poses.",
    stat: lvl => `+${(20 + lvl * 6).toFixed(0)}% Attack · +${(18 + lvl * 5).toFixed(0)}% Skill Haste · +${(18 + lvl * 5).toFixed(0)}% Attack Speed`,
    effect: "Dango's energetic doodles leap right into action! At wave start: Cartoon Zoom grants all allies +35% Move Speed and +25% Attack Speed for 7s. Cody shares 20% of his Attack and Skill Haste with all allies. Cody is immune to Slow and Root. Attacks apply Sketch Cracks, reducing enemy Armor by 6% per hit (stacks up to 6 times, max 36% shred). At max stacks, the cracks burst into an ink splatter dealing 80%+ Attack AoE Physical Damage and cleansing 1 debuff from all nearby allies.",
    apply(u, B, lvl) {
      u.flat.atkP = (u.flat.atkP || 0) + 0.20 + lvl * 0.06;
      u.flat.cdr = (u.flat.cdr || 0) + 0.18 + lvl * 0.05;
      u.flat.aspdP = (u.flat.aspdP || 0) + 0.18 + lvl * 0.05;
      u.dirty = true;

      u.guards = u.guards || [];
      u.guards.push(id => id === 'slow' || id === 'root');

      const cartoonZoom = () => {
        if (!u.alive) return;
        safePlay('cartoon_whistle', { vol: 0.5 });
        B.alliesOf(u).forEach(a => {
          B.applyStatus(u, a, 'haste', 7, { val: 0.25 });
        });
        applyTeamStatShare(u, B, 'atk', 0.20 + lvl * 0.02);
        applyTeamStatShare(u, B, 'cdr', 0.20 + lvl * 0.02);
        B.fxFloatIcon(u.x, u.y - 110, '📖 CARTOON DASH', '#e056fd');
      };

      onWaveAndStart(u, B, cartoonZoom);

      B.on(u, 'dealDamage', ev => {
        if (!ev.target || ev.target.team === u.team || ev.dot || !ev.target.alive) return;
        ev.target._sketchStacks = (ev.target._sketchStacks || 0) + 1;
        B.applyStatus(u, ev.target, 'defdown', 5, { val: 0.06 });
        if (ev.target._sketchStacks >= 6) {
          ev.target._sketchStacks = 0;
          B.damage(u, ev.target, u.st.atk * (0.80 + lvl * 0.20), { type: 'physical', tag: 'Ink Splatter' });
          B.alliesOf(u).filter(a => Math.abs(a.x - u.x) < 200).forEach(a => B.cleanse(a, 1));
          B.fxFloatIcon(ev.target.x, ev.target.y - 95, '🎨 INK BURST', '#e056fd');
        }
      });
    }
  });

  /* 13. NUGGET — Copper's Golden Crayon (nugget_copper) */
  defBadge({
    id: 'nugget_copper', owner: 'Nugget', friend: 'Copper', immediate: true,
    name: "Copper's Golden Crayon", icon: '🖍️', color: '#f1c40f',
    desc: "A solid gold wax crayon Copper uncovered during a deep dig, gifted to Nugget for mapping rare treasures.",
    stat: lvl => `+${(20 + lvl * 6).toFixed(0)}% Defense · +${(18 + lvl * 5).toFixed(0)}% Shield Power · +${(18 + lvl * 5).toFixed(0)}% Attack`,
    effect: "Copper's golden gift sketches an impregnable bastion! At wave start: draws the Golden Fortress, granting all allies a 20%+ Max HP Golden Shield and 5s complete CC Immunity. Nugget shares 20% of his Defense with all allies. Attacks strike with golden resonance, healing the lowest-HP ally for 60%+ Defense and dealing 70%+ Defense Holy Damage to nearby enemies. Basic attacks dispel 1 enemy buff.",
    apply(u, B, lvl) {
      u.flat.defP = (u.flat.defP || 0) + 0.20 + lvl * 0.06;
      u.flat.shieldPowP = (u.flat.shieldPowP || 0) + 0.18 + lvl * 0.05;
      u.flat.atkP = (u.flat.atkP || 0) + 0.18 + lvl * 0.05;
      u.dirty = true;

      const goldenFort = () => {
        if (!u.alive) return;
        safePlay('coin_ping', { vol: 0.5 });
        const shieldAmt = u.max.hp * (0.20 + lvl * 0.05);
        B.alliesOf(u).forEach(a => {
          B.shield(u, a, shieldAmt, 8);
          B.applyStatus(u, a, 'ccimmune', 5.0);
          B.fxSparkle(a.x, a.y - 45, 8, '#f1c40f');
        });
        applyTeamStatShare(u, B, 'def', 0.20 + lvl * 0.02);
        B.fxFloatIcon(u.x, u.y - 110, '🖍️ GOLDEN FORTRESS', '#f1c40f');
      };

      onWaveAndStart(u, B, goldenFort);

      B.on(u, 'dealDamage', ev => {
        if (!ev.target || ev.target.team === u.team || ev.dot || !ev.target.alive) return;
        B.dispel(ev.target, 1);
        const lowest = B.alliesOf(u).filter(a => a.alive).sort((a, b) => (a.hp / a.max.hp) - (b.hp / b.max.hp))[0];
        if (lowest) {
          B.heal(u, lowest, u.st.def * (0.60 + lvl * 0.15));
        }
        B.damage(u, ev.target, u.st.def * (0.70 + lvl * 0.20), { type: 'magic', tag: 'Gold Resonance' });
      });
    }
  });

  /* 14. DISCARD — Selena's Prism Shard (discard_selena) */
  defBadge({
    id: 'discard_selena', owner: 'Discard', friend: 'Selena', immediate: true,
    name: "Selena's Prism Shard", icon: '💎', color: '#00d2d3',
    desc: "A triangular glass prism Selena carved to focus ambient starlight through Discard's patchwork body.",
    stat: lvl => `+${(20 + lvl * 6).toFixed(0)}% Magic Defense · +${(18 + lvl * 5).toFixed(0)}% Cooldown Reduction · +${(18 + lvl * 5).toFixed(0)}% Attack Speed`,
    effect: "Starlight refracts through scrap glass into radiant aurora beams! At wave start: Refraction Flash blinds all enemies for 4s (50% miss chance), dispels 2 buffs from each, and grants all allies +25% Evasion for 7s. Discard shares 20% of his Magic Defense and Evasion with all allies. Discard is immune to Blind and Accuracy reduction. Basic attacks refract into rainbow lasers striking up to 3 enemies for 70%+ Magic Defense damage and burning them.",
    apply(u, B, lvl) {
      u.flat.mdefP = (u.flat.mdefP || 0) + 0.20 + lvl * 0.06;
      u.flat.cdr = (u.flat.cdr || 0) + 0.18 + lvl * 0.05;
      u.flat.aspdP = (u.flat.aspdP || 0) + 0.18 + lvl * 0.05;
      u.dirty = true;

      u.guards = u.guards || [];
      u.guards.push(id => id === 'blind');

      const refractionFlash = () => {
        if (!u.alive) return;
        safePlay('crystal_chime', { vol: 0.55 });
        B.enemiesOf(u).filter(e => e.alive).forEach(e => {
          B.applyStatus(u, e, 'blind', 4.0);
          B.dispel(e, 2);
          B.fxSparkle(e.x, e.y - 40, 8, '#00d2d3');
        });
        B.alliesOf(u).forEach(a => {
          B.applyStatus(u, a, 'evasion', 7, { val: 0.25 });
        });
        applyTeamStatShare(u, B, 'mdef', 0.20 + lvl * 0.02);
        B.fxFloatIcon(u.x, u.y - 110, '💎 REFRACTION FLASH', '#00d2d3');
      };

      onWaveAndStart(u, B, refractionFlash);

      B.on(u, 'dealDamage', ev => {
        if (!ev.target || ev.target.team === u.team || ev.dot || !ev.target.alive) return;
        const foes = B.enemiesOf(u).filter(e => e.alive && e !== ev.target).slice(0, 2);
        foes.forEach(f => {
          B.damage(u, f, u.st.mdef * (0.70 + lvl * 0.20), { type: 'magic', tag: 'Prism Refraction' });
          B.applyStatus(u, f, 'burn', 4, { val: 0.12 });
        });
      });
    }
  });

  /* 15. SELENA — Discard's Patchwork Heart (selena_discard) */
  defBadge({
    id: 'selena_discard', owner: 'Selena', friend: 'Discard', immediate: true,
    name: "Discard's Patchwork Heart", icon: '💖', color: '#ff9ff3',
    desc: "A plush heart lovingly stitched by Discard from velvet remnants to give Selena steadfast courage under the night sky.",
    stat: lvl => `+${(22 + lvl * 7).toFixed(0)}% Magic Power · +${(20 + lvl * 6).toFixed(0)}% Healing Power · +${(18 + lvl * 5).toFixed(0)}% Max HP`,
    effect: "Discard's stitched heart radiates infinite cosmic warmth! At wave start: Patchwork Blessing heals all allies for 15%+ Max HP, grants +25% Magic Power for 8s, and cleanses 2 debuffs from every ally. Selena shares 20% of her Magic Power with all allies. Selena's abilities brand enemies with Celestial Thread: branded enemies take 50%+ Magic Damage whenever attacked by any ally and cannot receive buffs (Buff Sealed, 2 stacks). Selena is immune to Charm and Silence.",
    apply(u, B, lvl) {
      u.flat.magP = (u.flat.magP || 0) + 0.22 + lvl * 0.07;
      u.flat.healPowP = (u.flat.healPowP || 0) + 0.20 + lvl * 0.06;
      u.flat.hpP = (u.flat.hpP || 0) + 0.18 + lvl * 0.05;
      u.dirty = true;

      u.guards = u.guards || [];
      u.guards.push(id => id === 'charm' || id === 'silence');

      const patchworkBlessing = () => {
        if (!u.alive) return;
        safePlay('heart_pulse', { vol: 0.5 });
        B.alliesOf(u).forEach(a => {
          B.heal(u, a, a.max.hp * (0.15 + lvl * 0.04));
          B.applyStatus(u, a, 'magup', 8, { val: 0.25 });
          B.cleanse(a, 2);
          B.fxSparkle(a.x, a.y - 45, 8, '#ff9ff3');
        });
        applyTeamStatShare(u, B, 'mag', 0.20 + lvl * 0.02);
        B.fxFloatIcon(u.x, u.y - 110, '💖 PATCHWORK BLESSING', '#ff9ff3');
      };

      onWaveAndStart(u, B, patchworkBlessing);

      B.on(u, 'dealDamage', ev => {
        if (!ev.target || ev.target.team === u.team || ev.dot || !ev.target.alive) return;
        B.applyStatus(u, ev.target, 'buffsealed', 6, { stacks: 2 });
        B.damage(u, ev.target, u.st.mag * (0.50 + lvl * 0.15), { type: 'magic', tag: 'Celestial Thread' });
      });
    }
  });

  /* 16. COPPER — Nugget's Golden Compass (copper_nugget) */
  defBadge({
    id: 'copper_nugget', owner: 'Copper', friend: 'Nugget', immediate: true,
    name: "Nugget's Golden Compass", icon: '🧭', color: '#e1b12c',
    desc: "A solid brass compass whose needle spins towards friends, precious veins, and glorious underground adventure.",
    stat: lvl => `+${(22 + lvl * 7).toFixed(0)}% Max HP · +${(20 + lvl * 6).toFixed(0)}% Defense · +${(18 + lvl * 5).toFixed(0)}% Tenacity`,
    effect: "Nugget's loyal navigation guides Copper's stalwart mining charges! At wave start: activates the Magnetic Perimeter, granting all allies +30% Armor & Magic Defense for 8s, reflecting 25% of all incoming damage back to attackers, and stripping 1 shield from all enemies. Copper shares 20% of his Max HP and Defense with all allies. Copper is immune to Knockback and Stun. Stomping attacks release seismic tremors dealing 100%+ Defense Physical Damage and slowing enemies by 35%.",
    apply(u, B, lvl) {
      u.flat.hpP = (u.flat.hpP || 0) + 0.22 + lvl * 0.07;
      u.flat.defP = (u.flat.defP || 0) + 0.20 + lvl * 0.06;
      u.flat.tenacity = (u.flat.tenacity || 0) + 0.18 + lvl * 0.05;
      u.dirty = true;

      B.grantTeamKnockbackImmunity(u);
      u.guards = u.guards || [];
      u.guards.push(id => id === 'stun');

      const magneticPerimeter = () => {
        if (!u.alive) return;
        safePlay('anvil_strike', { vol: 0.55 });
        B.enemiesOf(u).filter(e => e.alive).forEach(e => {
          B.crackShield(u, e, 0.40);
        });
        B.alliesOf(u).forEach(a => {
          B.applyStatus(u, a, 'defup', 8, { val: 0.30 });
          B.applyStatus(u, a, 'mdefup', 8, { val: 0.30 });
        });
        applyTeamStatShare(u, B, 'hp', 0.20 + lvl * 0.02);
        applyTeamStatShare(u, B, 'def', 0.20 + lvl * 0.02);
        B.fxFloatIcon(u.x, u.y - 110, '🧭 MAGNETIC PERIMETER', '#e1b12c');
      };

      onWaveAndStart(u, B, magneticPerimeter);

      // Thorns damage reflect
      B.on(u, 'damaged', ev => {
        if (!ev.src || ev.src.team === u.team || ev.dot || !ev.src.alive) return;
        B.damage(u, ev.src, ev.amount * 0.25, { type: 'physical', tag: 'Magnetic Thorns' });
      });

      // Seismic tremors
      B.on(u, 'dealDamage', ev => {
        if (!ev.target || ev.target.team === u.team || ev.dot || !ev.target.alive) return;
        B.damage(u, ev.target, u.st.def * (1.00 + lvl * 0.25), { type: 'physical', tag: 'Seismic Tremor' });
        B.applyStatus(u, ev.target, 'slow', 3, { val: 0.35 });
      });
    }
  });


  /* =========================================================================
     PART 2: AUTHORING MISSING FRIENDSHIP CAMPAIGNS (37 CAMPAIGNS)
     ========================================================================= */

  /* 1. Cosmo & Sprout */
  defCampaign({
    id: 'cosmo_sprout', badge: 'cosmo_sprout', a: 'Cosmo', b: 'Sprout',
    recLevel: calcRecLevel('Cosmo', 'Sprout'), title: 'Bake & Bloom',
    stages: [
      { name: 'Seedling Selection', lines: [
        { who: 'Cosmo', text: "Sprout! Did the new strawberry patch arrive?" },
        { who: 'Sprout', text: "Right here in the greenhouse! Sun-ripened and ready." },
        { who: 'Cosmo', text: "These will make the sweetest glaze for today's tart." }
      ]},
      { name: 'Dough & Dirt', lines: [
        { who: 'Sprout', text: "Careful with the flour, Cosmo! It's dusting my leaves!" },
        { who: 'Cosmo', text: "Think of it as powdered sugar snow! Very festive." },
        { who: 'Sprout', text: "I prefer rainwater, but I admit... the pastry smells heavenly." }
      ]},
      { name: 'Oven Warmth', lines: [
        { who: 'Cosmo', text: "The crust needs exactly eight minutes of gentle heat." },
        { who: 'Sprout', text: "I'll keep watch. No wandering Toon is swiping this slice." }
      ]},
      { name: 'Secret Ingredient', lines: [
        { who: 'Cosmo', text: "A pinch of starlight sugar and Sprout's sweetest berry." },
        { who: 'Sprout', text: "Together, we make the best recipes on any floor." }
      ]},
      { name: 'Fresh Slice', lines: [
        { who: 'Cosmo', text: "Here! The first slice is for you, Sprout." },
        { who: 'Sprout', text: "Delicious! We should bake for the whole courtyard tomorrow." }
      ]}
    ]
  });

  /* 2. Coal & Bobette */
  defCampaign({
    id: 'coal_bobette', badge: 'coal_bobette', a: 'Coal', b: 'Bobette',
    recLevel: calcRecLevel('Coal', 'Bobette'), title: 'The Hearth Beneath',
    stages: [
      { name: 'Basement Chill', lines: [
        { who: 'Bobette', text: "Coal? You've been stoking the furnace down here for hours." },
        { who: 'Coal', text: "Someone has to keep the upper floors warm." },
        { who: 'Bobette', text: "Not while your hands freeze. Put these mittens on." }
      ]},
      { name: 'Gentle Embers', lines: [
        { who: 'Coal', text: "The yarn... it won't catch fire?" },
        { who: 'Bobette', text: "I spun it with spun quartz and wool. Fireproof and snug." },
        { who: 'Coal', text: "It's... really soft. Thank you, Bobette." }
      ]},
      { name: 'Soot & Stitches', lines: [
        { who: 'Bobette', text: "Hold still, let me brush the chimney ash off your collar." },
        { who: 'Coal', text: "I'm just a lump of coal, Bobette. You don't have to fuss." },
        { who: 'Bobette', text: "You're our warm hearth. Of course I fuss." }
      ]},
      { name: 'The Long Winter', lines: [
        { who: 'Coal', text: "The pipes are whistling. The cold is pressing in." },
        { who: 'Bobette', text: "Then we add another log and keep each other company." }
      ]},
      { name: 'Glowing Embers', lines: [
        { who: 'Coal', text: "Look. The fire's steady now. The whole floor is warm." },
        { who: 'Bobette', text: "And so are we. Best team in the building." }
      ]}
    ]
  });

  /* 3. Looey & Yatta */
  defCampaign({
    id: 'looey_yatta', badge: 'looey_yatta', a: 'Looey', b: 'Yatta',
    recLevel: calcRecLevel('Looey', 'Yatta'), title: 'Circus Grand Finale',
    stages: [
      { name: 'Call Time', lines: [
        { who: 'Yatta', text: "Looey! Grab your squeaker, the spotlight is turning!" },
        { who: 'Looey', text: "*Honk honk!* I'm ready! Confetti cannon is primed!" }
      ]},
      { name: 'Acrobatic Flub', lines: [
        { who: 'Looey', text: "*Tumbles over a bowling pin* Ta-da! Intentional pratfall!" },
        { who: 'Yatta', text: "Haha! The crowd loved it! Now hand me the juggler rings!" }
      ]},
      { name: 'Balloon Menagerie', lines: [
        { who: 'Yatta', text: "Can you twist a balloon poodle for that scared little Toon?" },
        { who: 'Looey', text: "*Squeak squeak* One glowing rainbow balloon dog, coming right up!" }
      ]},
      { name: 'Big Top Ruckus', lines: [
        { who: 'Looey', text: "Uh oh, stage crashers approaching stage left!" },
        { who: 'Yatta', text: "Give them the grand confetti fanfare, Looey!" }
      ]},
      { name: 'Standing Ovation', lines: [
        { who: 'Yatta', text: "Take a bow, Looey! They're cheering our names!" },
        { who: 'Looey', text: "*Honks joyfully* Best show on earth!" }
      ]}
    ]
  });

  /* 4. Eggson & Rudie */
  defCampaign({
    id: 'eggson_rudie', badge: 'eggson_rudie', a: 'Eggson', b: 'Rudie',
    recLevel: calcRecLevel('Eggson', 'Rudie'), title: 'Midnight Vault Patrol',
    stages: [
      { name: 'Dark Hallways', lines: [
        { who: 'Eggson', text: "Storage corridor C is pitch black tonight. Stay sharp, Rudie." },
        { who: 'Rudie', text: "No problem! *click* Red nose headlight activated!" },
        { who: 'Eggson', text: "Incredible visibility. Now let's inspect the vault door." }
      ]},
      { name: 'Peculiar Scratches', lines: [
        { who: 'Rudie', text: "Eggson, look down. Fresh claw marks along the baseboard." },
        { who: 'Eggson', text: "Classic unauthorized tinkering. We're on the trail." }
      ]},
      { name: 'Red Beam Trap', lines: [
        { who: 'Eggson', text: "Aim your bulb at that corner reflector, Rudie." },
        { who: 'Rudie', text: "Got it! Wow, the light bounce illuminated the entire room!" }
      ]},
      { name: 'Cornered Culprit', lines: [
        { who: 'Eggson', text: "Halt! You're caught in the beam of justice!" },
        { who: 'Rudie', text: "Case closed! Detective Eggson solves another mystery!" }
      ]},
      { name: 'Night Beat Wrap-Up', lines: [
        { who: 'Eggson', text: "Good patrol tonight, Rudie. That beacon never fails." },
        { who: 'Rudie', text: "Anytime, partner! The halls are safe with us." }
      ]}
    ]
  });

  /* 5. Soulvester & Connie */
  defCampaign({
    id: 'soulvester_connie', badge: 'soulvester_connie', a: 'Soulvester', b: 'Connie',
    recLevel: calcRecLevel('Soulvester', 'Connie'), title: "The Knight's Vow",
    stages: [
      { name: 'Hallowed Courtyard', lines: [
        { who: 'Soulvester', text: "Lady Connie. The mist thickens across the parapet." },
        { who: 'Connie', text: "Then we walk together, Sir Soulvester. No spirit wanders alone." }
      ]},
      { name: 'Ribbon of Warding', lines: [
        { who: 'Connie', text: "Hold your sword still. I tied a silk blessing around the hilt." },
        { who: 'Soulvester', text: "A token of chivalry. I shall guard it with my eternal honor." }
      ]},
      { name: 'Shadow Incursion', lines: [
        { who: 'Soulvester', text: "Foul phantoms approach! Stand behind my spectral shield!" },
        { who: 'Connie', text: "Beside you, Sir Knight. We banish this sorrow together." }
      ]},
      { name: 'Ancient Tournament', lines: [
        { who: 'Connie', text: "Do you remember the jousting grandstands from old times?" },
        { who: 'Soulvester', text: "I do. But protecting our friends today is the highest honor." }
      ]},
      { name: 'Dawn in the Mist', lines: [
        { who: 'Soulvester', text: "The shadows disperse. Our bastion holds fast." },
        { who: 'Connie', text: "Well struck, Sir Soulvester. Let us return to the courtyard." }
      ]}
    ]
  });

  /* 6. Pebble & Dandy */
  defCampaign({
    id: 'pebble_dandy', badge: 'pebble_dandy', a: 'Pebble', b: 'Dandy',
    recLevel: calcRecLevel('Pebble', 'Dandy'), title: "Pebble's Golden Day",
    stages: [
      { name: 'Morning Bark', lines: [
        { who: 'Dandy', text: "Good morning, Pebble! Ready for your courtyard walk?" },
        { who: 'Pebble', text: "Arf! Arf! *wags tail excitedly*" },
        { who: 'Dandy', text: "Don't dig up the flowerbeds this time, you little rascal." }
      ]},
      { name: 'Fetch the Ribbon', lines: [
        { who: 'Dandy', text: "Go get the golden ball, Pebble! Fetch!" },
        { who: 'Pebble', text: "*Dashes across the grass, returning with a giant stick instead*" },
        { who: 'Dandy', text: "Haha! Well, that is quite an impressive branch." }
      ]},
      { name: 'Guard Dog Duty', lines: [
        { who: 'Pebble', text: "Grrr... WOOF! *stands firmly in front of Dandy's cart*" },
        { who: 'Dandy', text: "Look at you protecting the shop wares! What a brave boy." }
      ]},
      { name: 'Pebble Bath Time', lines: [
        { who: 'Dandy', text: "Time for your soap scrub, Pebble! Come here!" },
        { who: 'Pebble', text: "*Runs in playful circles, splashing suds all over Dandy*" },
        { who: 'Dandy', text: "Pebble! Now we both need a bath!" }
      ]},
      { name: 'Golden Whistle Treat', lines: [
        { who: 'Dandy', text: "*Blows golden whistle* Treat time, champ. Extra biscuits today." },
        { who: 'Pebble', text: "Woof! *nuzzles happily against Dandy*" }
      ]}
    ]
  });

  /* 7. Riku & Sora */
  defCampaign({
    id: 'riku_sora', badge: 'riku_sora', a: 'Riku', b: 'Sora',
    recLevel: calcRecLevel('Riku', 'Sora'), title: 'Road to Dawn',
    stages: [
      { name: 'Destiny Paopu', lines: [
        { who: 'Sora', text: "Riku! Look what I found in the gear stash!" },
        { who: 'Riku', text: "A paopu charm. Takes me back to the islands, Sora." }
      ]},
      { name: 'Twilight Sparring', lines: [
        { who: 'Riku', text: "Ready your Keyblade. Show me how much stronger you've gotten." },
        { who: 'Sora', text: "Don't hold back, Riku! I'm not going easy on you either!" }
      ]},
      { name: 'Dark Corridor', lines: [
        { who: 'Riku', text: "The dark corridors are shifting. Stay close to my aura." },
        { who: 'Sora', text: "I've got your back, always. We walk this path together." }
      ]},
      { name: 'Heartless Swarm', lines: [
        { who: 'Riku', text: "Dark Firaga! Sora, now! Finish it!" },
        { who: 'Sora', text: "Got it! Trinity strike!" }
      ]},
      { name: 'The Dawn Horizon', lines: [
        { who: 'Riku', text: "The darkness doesn't scare me anymore. Because you're here." },
        { who: 'Sora', text: "Our hearts are connected, Riku. No matter where we go." }
      ]}
    ]
  });

  /* 8. Donald & Goofy */
  defCampaign({
    id: 'donald_goofy', badge: 'donald_goofy', a: 'Donald', b: 'Goofy',
    recLevel: calcRecLevel('Donald', 'Goofy'), title: "Court Magician's Honor",
    stages: [
      { name: 'Royal Dispatch', lines: [
        { who: 'Donald', text: "Goofy! The radar picked up strange anomalies on floor five!" },
        { who: 'Goofy', text: "Gawrsh, Donald, don't get your feathers ruffled! I got my shield ready." }
      ]},
      { name: 'Thunder Mishap', lines: [
        { who: 'Donald', text: "Thunder! *ZAP* Oops... sorry about your shield handle, Goofy." },
        { who: 'Goofy', text: "A-hyuck! It's just a little toasted. Adds flavor!" }
      ]},
      { name: 'Shield Charge', lines: [
        { who: 'Goofy', text: "Hold onto your hat, Donald! Shield charge coming through!" },
        { who: 'Donald', text: "WAAAK! Warn me before you rocket launch us forward!" }
      ]},
      { name: 'Arcane Mastery', lines: [
        { who: 'Donald', text: "Stand aside! Donald Duck doesn't miss twice! ZETTAFLARE!" },
        { who: 'Goofy', text: "Now that's what I call a fireworks show!" }
      ]},
      { name: 'Royal High Five', lines: [
        { who: 'Donald', text: "All clear! The King would be proud of us." },
        { who: 'Goofy', text: "You betcha! We make the finest court guard around." }
      ]}
    ]
  });

  /* 9. Barret & Cloud */
  defCampaign({
    id: 'barret_cloud', badge: 'barret_cloud', a: 'Barret', b: 'Cloud',
    recLevel: calcRecLevel('Barret', 'Cloud'), title: "Echoes of the Planet",
    stages: [
      { name: 'Briefing in the Slums', lines: [
        { who: 'Barret', text: "Listen up, SOLDIER boy! The planet's dyin' and we got work to do." },
        { who: 'Cloud', text: "I'm here for the job, Barret. Tell me where to point the blade." }
      ]},
      { name: 'Heavy Ordnance', lines: [
        { who: 'Barret', text: "Hear that hum? Shinra machinery crawling around the perimeter." },
        { who: 'Cloud', text: "They're armored. You crack the plating, I'll take the core." }
      ]},
      { name: 'Mako Exhaust', lines: [
        { who: 'Barret', text: "Ain't no gettin' offa this train we're on! Fire in the hole!" },
        { who: 'Cloud', text: "Stay focused. Keep your burst fire steady." }
      ]},
      { name: 'Avalanche Pride', lines: [
        { who: 'Barret', text: "You got a cold face, Cloud, but you got a warrior's heart." },
        { who: 'Cloud', text: "...Just don't make me listen to your speeches all night." }
      ]},
      { name: 'Victory at Sunset', lines: [
        { who: 'Barret', text: "Look at that sunset over the sector wall. We saved it today." },
        { who: 'Cloud', text: "Yeah. Drink is on you at Seventh Heaven." }
      ]}
    ]
  });

  /* 10. Sephiroth & Cloud */
  defCampaign({
    id: 'sephiroth_cloud', badge: 'sephiroth_cloud', a: 'Sephiroth', b: 'Cloud',
    recLevel: calcRecLevel('Sephiroth', 'Cloud'), title: 'One-Winged Echo',
    stages: [
      { name: 'Reunion Call', lines: [
        { who: 'Sephiroth', text: "Cloud... do you remember the promised land?" },
        { who: 'Cloud', text: "Stay where you belong... in my memories." },
        { who: 'Sephiroth', text: "I will never be a memory." }
      ]},
      { name: 'Silver Flurry', lines: [
        { who: 'Cloud', text: "That Masamune blade hasn't slowed down." },
        { who: 'Sephiroth', text: "Nor has your stubborn will. Show me the strength of your grief." }
      ]},
      { name: 'Feather of Darkness', lines: [
        { who: 'Sephiroth', text: "A single black feather falls. Does despair grasp your chest?" },
        { who: 'Cloud', text: "I've moved past despair. I have people to protect." }
      ]},
      { name: 'Octaslash Tempest', lines: [
        { who: 'Sephiroth', text: "Shall I give you despair? Witness Octaslash!" },
        { who: 'Cloud', text: "Omnislash! I won't let you dictate our fate!" }
      ]},
      { name: 'The Eternal Duel', lines: [
        { who: 'Sephiroth', text: "Fascinating. We are two sides of the same fateful coin." },
        { who: 'Cloud', text: "As long as you return, my sword will be waiting." }
      ]}
    ]
  });

  /* 11. Bedtime Astro & Astro */
  defCampaign({
    id: 'bedtimeastro_astro', badge: 'bedtimeastro_astro', a: 'BedtimeAstro', b: 'Astro',
    recLevel: calcRecLevel('BedtimeAstro', 'Astro'), title: 'Starfall Dreams',
    stages: [
      { name: 'Yawning Stars', lines: [
        { who: 'BedtimeAstro', text: "*Yawns softly* Astro... the constellation clock says bedtime." },
        { who: 'Astro', text: "Just five more minutes! I'm charting the Orion drift!" }
      ]},
      { name: 'Fluffy Pillows', lines: [
        { who: 'BedtimeAstro', text: "Look, I brought the lavender cloud pillow. Extra squishy." },
        { who: 'Astro', text: "Whoa... okay, that really does look like the coziest cloud." }
      ]},
      { name: 'Dream Patrol', lines: [
        { who: 'BedtimeAstro', text: "Bad dreams stay outside our starry blanket fort." },
        { who: 'Astro', text: "My telescope will spot any nightmares before they even arrive!" }
      ]},
      { name: 'Nightcap Magic', lines: [
        { who: 'BedtimeAstro', text: "Tuck the tassel in. Stardust dreams incoming." },
        { who: 'Astro', text: "The stars are shining so peacefully tonight..." }
      ]},
      { name: 'Cosmic Lullaby', lines: [
        { who: 'BedtimeAstro', text: "Goodnight, little star. Sweet dreams until morning light." },
        { who: 'Astro', text: "*Snore*... cosmic... adventure... zzz..." }
      ]}
    ]
  });

  /* 12. Cody & Dango */
  defCampaign({
    id: 'cody_dango', badge: 'cody_dango', a: 'Cody', b: 'Dango',
    recLevel: calcRecLevel('Cody', 'Dango'), title: 'Animated Escapades',
    stages: [
      { name: 'Blank Canvas', lines: [
        { who: 'Dango', text: "Cody! I've got my pencils ready for the new comic strip!" },
        { who: 'Cody', text: "Awesome! Draw me doing a quadruple backflip off a flagpole!" }
      ]},
      { name: 'Inky Mishaps', lines: [
        { who: 'Dango', text: "Whoops! An ink bottle spilled into a puddle of monsters!" },
        { who: 'Cody', text: "Don't worry! I'll skate right through them! Action hero time!" }
      ]},
      { name: 'Speedlines', lines: [
        { who: 'Dango', text: "Adding action speedlines to your boots! +50% zoom factor!" },
        { who: 'Cody', text: "WHOA! That actually made me run faster! Keep sketching!" }
      ]},
      { name: 'The Boss Page', lines: [
        { who: 'Cody', text: "Turn the page, Dango! Give me an anvil drop on three!" },
        { who: 'Dango', text: "Page turned! Anvil incoming from the top panel!" }
      ]},
      { name: 'Comic Book Cover', lines: [
        { who: 'Dango', text: "And that's the final panel! Look at this cover art!" },
        { who: 'Cody', text: "We're bestsellers, Dango! Next issue drops tomorrow!" }
      ]}
    ]
  });

  /* 13. Nugget & Copper */
  defCampaign({
    id: 'nugget_copper', badge: 'nugget_copper', a: 'Nugget', b: 'Copper',
    recLevel: calcRecLevel('Nugget', 'Copper'), title: 'Expedition Gold',
    stages: [
      { name: 'Pickaxe & Crayon', lines: [
        { who: 'Copper', text: "Shaft 7 is uncharted. Nugget, mark our route on the parchment." },
        { who: 'Nugget', text: "Using my gold crayon! Bright yellow for treasures, red for traps!" }
      ]},
      { name: 'Deep Rumblings', lines: [
        { who: 'Copper', text: "Hold up. The cavern walls are vibrating. Cave-in warning." },
        { who: 'Nugget', text: "I'll draw a safety arch! *scratches golden crayon barrier*" }
      ]},
      { name: 'Golden Geode', lines: [
        { who: 'Copper', text: "*CLANG!* Nugget, shine your lantern over here. Look at this." },
        { who: 'Nugget', text: "A massive glittering crystal geode! We struck the motherlode!" }
      ]},
      { name: 'Minecart Chase', lines: [
        { who: 'Nugget', text: "Minecart rolling! Jump in, Copper! Fasten your helmet!" },
        { who: 'Copper', text: "Hang on tight, Nugget! Full speed down the rail!" }
      ]},
      { name: 'Surface Sunshine', lines: [
        { who: 'Copper', text: "We made it out with a cart full of gold and rare ores." },
        { who: 'Nugget', text: "Best mining expedition ever! High five, Copper!" }
      ]}
    ]
  });

  /* 14. Discard & Selena */
  defCampaign({
    id: 'discard_selena', badge: 'discard_selena', a: 'Discard', b: 'Selena',
    recLevel: calcRecLevel('Discard', 'Selena'), title: 'Fragments of Light',
    stages: [
      { name: 'The Scrap Pile', lines: [
        { who: 'Discard', text: "Selena... you don't have to look through old junk with me." },
        { who: 'Selena', text: "It's not junk, Discard. Look how this broken glass catches the moon." }
      ]},
      { name: 'Polishing Prism', lines: [
        { who: 'Selena', text: "If we smooth this edge, it turns ordinary light into rainbows." },
        { who: 'Discard', text: "Rainbows... from a bottle shard? That's amazing." }
      ]},
      { name: 'Dark Room Shadows', lines: [
        { who: 'Discard', text: "The shadows in this warehouse are creeping closer." },
        { who: 'Selena', text: "Hold up your prism. Let's illuminate every dark corner." }
      ]},
      { name: 'Refraction Beam', lines: [
        { who: 'Discard', text: "It worked! The shadows vanished in the rainbow flash!" },
        { who: 'Selena', text: "You did that, Discard. You turned scrap into pure brilliance." }
      ]},
      { name: 'Constellation Mosaic', lines: [
        { who: 'Discard', text: "We made a whole stained-glass star on the wall." },
        { who: 'Selena', text: "Nothing is ever truly discarded as long as we can love it." }
      ]}
    ]
  });

  /* 15. Selena & Discard */
  defCampaign({
    id: 'selena_discard', badge: 'selena_discard', a: 'Selena', b: 'Discard',
    recLevel: calcRecLevel('Selena', 'Discard'), title: 'Starlight Quilt',
    stages: [
      { name: 'Velvet Scraps', lines: [
        { who: 'Selena', text: "Discard, what are you sewing so quietly over there?" },
        { who: 'Discard', text: "A... a little heart. From soft purple velvet scraps." },
        { who: 'Selena', text: "Oh! It is beautiful! Is it for the observatory display?" }
      ]},
      { name: 'For You', lines: [
        { who: 'Discard', text: "No... it's for you, Selena. For always being kind to me." },
        { who: 'Selena', text: "Discard... thank you. I'll carry it on every stargaze." }
      ]},
      { name: 'Meteor Night', lines: [
        { who: 'Selena', text: "Look up! The Perseid meteor shower is beginning!" },
        { who: 'Discard', text: "Make a wish! Quick, before the stardust fades!" }
      ]},
      { name: 'Warding the Sky', lines: [
        { who: 'Selena', text: "Rogue cloud fiends are obscuring the telescope lens!" },
        { who: 'Discard', text: "Not while I'm here! Celestial threads, clear the sky!" }
      ]},
      { name: 'Endless Cosmos', lines: [
        { who: 'Selena', text: "The sky is crystal clear. Look at the Milky Way galaxy." },
        { who: 'Discard', text: "With you and this heart, I feel like I belong under the stars." }
      ]}
    ]
  });

  /* 16. Copper & Nugget */
  defCampaign({
    id: 'copper_nugget', badge: 'copper_nugget', a: 'Copper', b: 'Nugget',
    recLevel: calcRecLevel('Copper', 'Nugget'), title: 'Treasures of the Mine',
    stages: [
      { name: 'Compass Calibration', lines: [
        { who: 'Copper', text: "Nugget, check your brass compass. Which heading?" },
        { who: 'Nugget', text: "Needle points North-Northwest, straight toward the crystal cavern!" }
      ]},
      { name: 'Seismic Shock', lines: [
        { who: 'Copper', text: "Heavy stomp! *BOOM* That stabilized the shale ceiling." },
        { who: 'Nugget', text: "Whoa, awesome tremors! The enemy bugs got knocked right over!" }
      ]},
      { name: 'Vein of Electrum', lines: [
        { who: 'Nugget', text: "Copper! The rock face is gleaming with natural electrum alloy!" },
        { who: 'Copper', text: "Set the drill wedges. We harvest this carefully." }
      ]},
      { name: 'Underground Lake', lines: [
        { who: 'Copper', text: "Subterranean lake ahead. Watch your footing on the wet gravel." },
        { who: 'Nugget', text: "The water reflects our lanterns like a pool of molten gold." }
      ]},
      { name: 'Miners True North', lines: [
        { who: 'Copper', text: "Compass never lied once. Led us right back to camp." },
        { who: 'Nugget', text: "Partners for life, Copper! Let's polish our gems!" }
      ]}
    ]
  });

  /* 17. Kris & Ralsei */
  defCampaign({
    id: 'kris_ralsei', badge: 'kris_ralsei', a: 'Kris', b: 'Ralsei',
    recLevel: calcRecLevel('Kris', 'Ralsei'), title: 'Heroes of Light',
    stages: [
      { name: 'The Dark Fountain', lines: [
        { who: 'Ralsei', text: "Kris! Welcome back to Castle Town! I've been waiting for you." },
        { who: 'Narrator', text: 'Kris nods quietly and adjusts their sword scabbard.' },
        { who: 'Ralsei', text: "The Dark Fountain's balance is shifting. Let's investigate together." }
      ]},
      { name: 'Fluffy Healing', lines: [
        { who: 'Ralsei', text: "Watch out, Kris! Rogue Darkners from the cyber plains!" },
        { who: 'Narrator', text: 'Kris steps forward and parries an incoming attack.' },
        { who: 'Ralsei', text: "Heal Prayer! Don't push yourself too hard, Kris." }
      ]},
      { name: 'Tea & Manuals', lines: [
        { who: 'Ralsei', text: "I baked a butterscotch-cinnamon pie for our break!" },
        { who: 'Narrator', text: 'Kris takes a large slice with visible enthusiasm.' },
        { who: 'Ralsei', text: "I'm so glad you like it. I revised chapter four of my manual too!" }
      ]},
      { name: 'The Legend', lines: [
        { who: 'Ralsei', text: "Once upon a time, a human, a monster, and a prince from the dark..." },
        { who: 'Narrator', text: 'Kris places a comforting hand on Ralsei\'s shoulder.' },
        { who: 'Ralsei', text: "No matter what fate awaits us, I'm honored to be your companion, Kris." }
      ]},
      { name: 'Light & Shadow', lines: [
        { who: 'Narrator', text: 'Kris ties Ralsei\'s fluffy pink scarf warmly around their neck.' },
        { who: 'Ralsei', text: "It looks wonderful on you! Let's seal the fountain and bring peace." }
      ]}
    ]
  });

  /* 18. Ralsei & Kris */
  defCampaign({
    id: 'ralsei_kris', badge: 'ralsei_kris', a: 'Ralsei', b: 'Kris',
    recLevel: calcRecLevel('Ralsei', 'Kris'), title: 'The Prophecy Town',
    stages: [
      { name: 'Castle Town Preparations', lines: [
        { who: 'Ralsei', text: "Kris, look around! The town has grown so lively with our new recruits!" },
        { who: 'Narrator', text: 'Kris inspects the newly furnished rooms on the second floor.' },
        { who: 'Ralsei', text: "I made sure your bed has extra blankets and a nightlight." }
      ]},
      { name: 'Shadow Crystal Charm', lines: [
        { who: 'Narrator', text: 'Kris hands Ralsei a curious dark glass shard that glints with purple light.' },
        { who: 'Ralsei', text: "A Shadow Crystal? Kris, this holds immense cosmic power..." },
        { who: 'Ralsei', text: "I'll craft a protective pendant with it so darkness never harms us." }
      ]},
      { name: 'Royal Guard Training', lines: [
        { who: 'Ralsei', text: "Halt, training dummies! Observe my Pacify technique!" },
        { who: 'Narrator', text: 'Kris demonstrates a flawless tactical slash, splitting the target.' },
        { who: 'Ralsei', text: "Amazing form, Kris! You truly are a natural leader." }
      ]},
      { name: 'Dark Fountain Defense', lines: [
        { who: 'Ralsei', text: "Chaos rumbles from the outer courtyard! Kris, to me!" },
        { who: 'Narrator', text: 'Kris unsheathes their blade, eyes glowing with determination.' },
        { who: 'Ralsei', text: "With our hearts aligned, no shadow can overpower us!" }
      ]},
      { name: 'Peaceful Dusk', lines: [
        { who: 'Ralsei', text: "The stars in the Dark World never truly fade." },
        { who: 'Narrator', text: 'Kris sits quietly beside Ralsei, listening to the fountain gentle hum.' },
        { who: 'Ralsei', text: "Thank you for being my dearest friend, Kris." }
      ]}
    ]
  });

  /* 19. Tasque Manager & Dyle */
  defCampaign({
    id: 'tasquemanager_dyle', badge: 'tasquemanager_dyle', a: 'TasqueManager', b: 'Dyle',
    recLevel: calcRecLevel('TasqueManager', 'Dyle'), title: 'Order on the Subway',
    stages: [
      { name: 'Station Inspection', lines: [
        { who: 'TasqueManager', text: "Chaos! Disarray! Look at these loose electrical cables across the platform!" },
        { who: 'Dyle', text: "Woah there, Miss Whip! The subway runs right on time, don't worry." },
        { who: 'TasqueManager', text: "Running on time is meaningless if the wires are tangled! Tidy up!" }
      ]},
      { name: 'Whip & Whistle', lines: [
        { who: 'Dyle', text: "*Blows conductor whistle* All passengers, stand behind the yellow line!" },
        { who: 'TasqueManager', text: "*CRACK!* Correct! Now organize yourselves alphabetically by shoe size!" },
        { who: 'Dyle', text: "Haha! You don't mess around, do you?" }
      ]},
      { name: 'Rogue Tasques', lines: [
        { who: 'TasqueManager', text: "Tasques! Return to your designated docking perches immediately!" },
        { who: 'Dyle', text: "I'll block the turnstiles so they don't scamper onto the tracks." },
        { who: 'TasqueManager', text: "Excellent coordination, stationmaster." }
      ]},
      { name: 'Full Throttle', lines: [
        { who: 'Dyle', text: "Express train approaching! Keep the line clear!" },
        { who: 'TasqueManager', text: "Every cable routed, every ticket punched. Perfect synchronization." }
      ]},
      { name: 'Model Terminal', lines: [
        { who: 'TasqueManager', text: "I must confess, Dyle. Your station is now the tidiest in the city." },
        { who: 'Dyle', text: "Couldn't have done it without your strict whip hand! Anytime!" }
      ]}
    ]
  });

  /* 20. Flowery & Dandy */
  defCampaign({
    id: 'flowery_dandy', badge: 'flowery_dandy', a: 'Flowery', b: 'Dandy',
    recLevel: calcRecLevel('Flowery', 'Dandy'), title: 'Center Stage Duel',
    stages: [
      { name: 'Petal Rivalry', lines: [
        { who: 'Flowery', text: "Well, well! If it isn't Dandy, the supposed star of this venue!" },
        { who: 'Dandy', text: "Flowery! Care to step aside? The spotlight naturally gravitates toward me." },
        { who: 'Flowery', text: "Ha! We'll see whose grand illusions steal the show!" }
      ]},
      { name: 'Tap Dance Duel', lines: [
        { who: 'Dandy', text: "*Tap-tap-tappity-tap!* Follow that tempo, dramatic friend!" },
        { who: 'Flowery', text: "*Summons twirling floral clones* I don't just follow tempo, I orchestrate it!" }
      ]},
      { name: 'Unwelcome Hecklers', lines: [
        { who: 'Flowery', text: "Ugh, unruly critics in the second row! Ruining my grand entrance!" },
        { who: 'Dandy', text: "Allow me! A bouquet explosion and a blinding flash!" },
        { who: 'Flowery', text: "Splendid flair! Now for my JARONA finale!" }
      ]},
      { name: 'Double Encore', lines: [
        { who: 'Dandy', text: "The applause is deafening! They want both of us!" },
        { who: 'Flowery', text: "Naturally. Greatness recognizing greatness on a single stage." }
      ]},
      { name: 'Grand Bow', lines: [
        { who: 'Dandy', text: "Same time tomorrow for the evening revue?" },
        { who: 'Flowery', text: "I wouldn't miss outshining you for the world, Dandy." }
      ]}
    ]
  });

  /* 21. Chell & Boxten */
  defCampaign({
    id: 'chell_boxten', badge: 'chell_boxten', a: 'Chell', b: 'Boxten',
    recLevel: calcRecLevel('Chell', 'Boxten'), title: 'Aperture Resonance',
    stages: [
      { name: 'Test Chamber 01', lines: [
        { who: 'Boxten', text: "Where... where did those glowing orange and blue rings come from?" },
        { who: 'Narrator', text: 'Chell fires a portal onto the ceiling and gestures toward the button.' },
        { who: 'Boxten', text: "You want me to step through? Okay... winding up my courage." }
      ]},
      { name: 'Terminal Velocity', lines: [
        { who: 'Boxten', text: "WAAAAAAAH! I'm falling forever! No wait, I'm soaring!" },
        { who: 'Narrator', text: 'Chell catches Boxten neatly as he lands on the exit elevator.' },
        { who: 'Boxten', text: "*Pants* That was... terrifying and completely exhilarating!" }
      ]},
      { name: 'Companion Melodies', lines: [
        { who: 'Boxten', text: "I'll play my music box melody while you calibrate the lasers." },
        { who: 'Narrator', text: 'Chell sits beside the Weighted Companion Cube, smiling faintly.' },
        { who: 'Boxten', text: "Music makes even cold test chambers feel a little warmer, doesn't it?" }
      ]},
      { name: 'Turret Corridor', lines: [
        { who: 'Boxten', text: "Red lasers ahead! 'I see you'—are those talking guns?!" },
        { who: 'Narrator', text: 'Chell drops a portal under the turrets, flipping them upside down.' },
        { who: 'Boxten', text: "Quick thinking! Clean portal maneuver!" }
      ]},
      { name: 'The Escape Hatch', lines: [
        { who: 'Boxten', text: "Look! Fresh air and daylight through that broken vent!" },
        { who: 'Narrator', text: 'Chell gives Boxten a firm thumbs up as they step out into the sun.' }
      ]}
    ]
  });

  /* 22. QOMRibecca & QOMGourdy */
  defCampaign({
    id: 'qom_ribecca_gourdy', badge: 'qom_ribecca_gourdy', a: 'QOMRibecca', b: 'QOMGourdy',
    recLevel: calcRecLevel('QOMRibecca', 'QOMGourdy'), title: 'Royal Masquerade',
    stages: [
      { name: 'Midnight Banquet', lines: [
        { who: 'QOMRibecca', text: "Lord Gourdy. The autumnal moon aligns with our royal court." },
        { who: 'QOMGourdy', text: "Indeed, Your Majesty. The pumpkin lanterns are lit with eerie fire." }
      ]},
      { name: 'Poison Apple Punch', lines: [
        { who: 'QOMGourdy', text: "Careful with the spiced punch. It has quite an explosive kick." },
        { who: 'QOMRibecca', text: "I reign over mysteries, Gourdy. Explosions are merely theatrical flair." }
      ]},
      { name: 'Court Intrigue', lines: [
        { who: 'QOMRibecca', text: "Shadow spies lurk in the royal tapestry gallery." },
        { who: 'QOMGourdy', text: "Allow my carved pumpkins to bite their spectral ankles!" }
      ]},
      { name: 'The Queen\'s Decree', lines: [
        { who: 'QOMRibecca', text: "All disloyal ghouls shall be banished until next Halloween!" },
        { who: 'QOMGourdy', text: "Hear hear! Long live the Queen of Mystery!" }
      ]},
      { name: 'Royal Toast', lines: [
        { who: 'QOMRibecca', text: "To another glorious season of autumn sovereignty." },
        { who: 'QOMGourdy', text: "To darkness, cider, and pumpkin majesty." }
      ]}
    ]
  });

  /* 23. QOMRibecca & QOMEclipse */
  defCampaign({
    id: 'qom_ribecca_eclipse', badge: 'qom_ribecca_eclipse', a: 'QOMRibecca', b: 'QOMEclipse',
    recLevel: calcRecLevel('QOMRibecca', 'QOMEclipse'), title: 'Crown in Shadow',
    stages: [
      { name: 'Solar Obscuration', lines: [
        { who: 'QOMRibecca', text: "The sun falters. The celestial crown descends upon my court." },
        { who: 'QOMEclipse', text: "Solar and lunar polarities inverted. Eclipse threshold reached." }
      ]},
      { name: 'Corona Flames', lines: [
        { who: 'QOMEclipse', text: "Warning: Solar flare spikes approaching perimeter." },
        { who: 'QOMRibecca', text: "My royal shroud bends all stray photons to my will." }
      ]},
      { name: 'Shadow Scepter', lines: [
        { who: 'QOMRibecca', text: "Channel your coronal gravity into my royal scepter, Eclipse." },
        { who: 'QOMEclipse', text: "Gravity field locked. Discharging void singularity." }
      ]},
      { name: 'Celestial Cleansing', lines: [
        { who: 'QOMRibecca', text: "Look upon our dominion. Even starlight bows before us." },
        { who: 'QOMEclipse', text: "Orbital stability restored. All intruders suppressed." }
      ]},
      { name: 'Ascendant Throne', lines: [
        { who: 'QOMRibecca', text: "Well done, Eclipse. You are a worthy vanguard of the crown." },
        { who: 'QOMEclipse', text: "I remain vigilant until the next planetary conjunction." }
      ]}
    ]
  });

  /* 24. Vee & Shelly */
  defCampaign({
    id: 'vee_shelly', badge: 'vee_shelly', a: 'Vee', b: 'Shelly',
    recLevel: calcRecLevel('Vee', 'Shelly'), title: 'Field Data Archive',
    stages: [
      { name: 'Sector Scan', lines: [
        { who: 'Vee', text: "Shelly, my hard drive detected an anomalous magnetic reading." },
        { who: 'Shelly', text: "Fossils! Or maybe ancient recording cylinders!" },
        { who: 'Vee', text: "Or simply old rusty pipes. Do not get overexcited." }
      ]},
      { name: 'The Excavation', lines: [
        { who: 'Shelly', text: "Look! A genuine prehistoric ammonite embedded in concrete!" },
        { who: 'Vee', text: "Fascinating. Recording high-definition holographic schematics." }
      ]},
      { name: 'Data Corruption Alert', lines: [
        { who: 'Vee', text: "Warning: Signal interference from floor broadcast tower." },
        { who: 'Shelly', text: "Stay behind me, Vee! I'll block the EMP with my shell!" }
      ]},
      { name: 'Overclock Synchrony', lines: [
        { who: 'Vee', text: "Discharging electrostatic EMP pulse! Shelly, brace!" },
        { who: 'Shelly', text: "Shield held firm! Signal cleared!" }
      ]},
      { name: 'Saved to Archive', lines: [
        { who: 'Vee', text: "Field record #842 saved: 'Adventures with Shelly'." },
        { who: 'Shelly', text: "Aw, Vee! You really do have a soft spot in your circuits!" }
      ]}
    ]
  });

  /* 25. ShareBearCosmo & TenderheartSprout */
  defCampaign({
    id: 'sharebear_sprout', badge: 'sharebear_sprout', a: 'ShareBearCosmo', b: 'TenderheartSprout',
    recLevel: calcRecLevel('ShareBearCosmo', 'TenderheartSprout'), title: 'Care-A-Lot Harmony',
    stages: [
      { name: 'Rainbow Cloudway', lines: [
        { who: 'ShareBearCosmo', text: "Sharing is caring! Sprout, taste these sweet star cupcakes!" },
        { who: 'TenderheartSprout', text: "Thank you, Share Bear! Nothing warms the heart like good baking." }
      ]},
      { name: 'Caring Stare', lines: [
        { who: 'TenderheartSprout', text: "Clouds of gloom are rolling in from the dreary valley." },
        { who: 'ShareBearCosmo', text: "Time for a double belly badge beam! Share the love!" }
      ]},
      { name: 'Baking Warmth', lines: [
        { who: 'ShareBearCosmo', text: "One cup of joy, two tablespoons of friendship!" },
        { who: 'TenderheartSprout', text: "And a whole bushel of loving care to tie it together!" }
      ]},
      { name: 'Gloom Dispersal', lines: [
        { who: 'TenderheartSprout', text: "The clouds are parting! Rainbows shining bright!" },
        { who: 'ShareBearCosmo', text: "Hooray! Smiles returned to everyone's faces!" }
      ]},
      { name: 'Bear Hugs', lines: [
        { who: 'TenderheartSprout', text: "Big Care Bear hug, Cosmo!" },
        { who: 'ShareBearCosmo', text: "Best friends forever in Care-A-Lot!" }
      ]}
    ]
  });

  /* 26. Boxten & Poppy */
  defCampaign({
    id: 'boxten_poppy', badge: 'poppy_boxten', a: 'Boxten', b: 'Poppy',
    recLevel: calcRecLevel('Boxten', 'Poppy'), title: 'A Melody in the Box',
    stages: [
      { name: 'Winding Key', lines: [
        { who: 'Boxten', text: "Poppy, my wind-up key is a little stiff today." },
        { who: 'Poppy', text: "Here! Let me polish it with my shiny bubble ribbon!" }
      ]},
      { name: 'Popping Bubbles', lines: [
        { who: 'Poppy', text: "POP! POP! Dance along with my bubble parade, Boxten!" },
        { who: 'Boxten', text: "*Plays lively chime melody* That rhythm actually syncs up nicely!" }
      ]},
      { name: 'Stage Jitters', lines: [
        { who: 'Boxten', text: "There are so many spectators out there... what if my spring jams?" },
        { who: 'Poppy', text: "I'll be right beside you blowing bubbles! You'll be great!" }
      ]},
      { name: 'Grand Duet', lines: [
        { who: 'Boxten', text: "The music box springs into full harmony! Listen to that sound!" },
        { who: 'Poppy', text: "Everyone is clapping and dancing along!" }
      ]},
      { name: 'Encore Bow', lines: [
        { who: 'Boxten', text: "Thank you for believing in me, Poppy." },
        { who: 'Poppy', text: "Anytime, Boxten! Our melody is the happiest in the world!" }
      ]}
    ]
  });

  /* 27. Kairi & Cocoa */
  defCampaign({
    id: 'kairi_cocoa', badge: 'kairi_cocoa', a: 'Kairi', b: 'Cocoa',
    recLevel: calcRecLevel('Kairi', 'Cocoa'), title: 'Islands of Cocoa',
    stages: [
      { name: 'Seashells & Sweets', lines: [
        { who: 'Kairi', text: "Cocoa! Look at this iridescent thalassa shell I found!" },
        { who: 'Cocoa', text: "It's so pretty! It looks like frosted sugar candy!" }
      ]},
      { name: 'Island Recipe', lines: [
        { who: 'Cocoa', text: "I tried making hot chocolate with coconut milk from your island." },
        { who: 'Kairi', text: "Mmm! It's so smooth and tropical! Sora and Riku will love this." }
      ]},
      { name: 'Heartless by the Shore', lines: [
        { who: 'Kairi', text: "Shadow Heartless crawling onto the beach! Destiny's Embrace!" },
        { who: 'Cocoa', text: "Marshmallow barrage incoming! Stand back, shadows!" }
      ]},
      { name: 'Light in the Waves', lines: [
        { who: 'Kairi', text: "The ocean reflects the light of our hearts." },
        { who: 'Cocoa', text: "And sweet chocolate warms up anyone feeling down." }
      ]},
      { name: 'Sunset Vow', lines: [
        { who: 'Kairi', text: "Whenever you feel lonely, look at the ocean waves, Cocoa." },
        { who: 'Cocoa', text: "And have a warm mug of cocoa! Friends forever!" }
      ]}
    ]
  });

  /* 28. Cloud & Dandy */
  defCampaign({
    id: 'ff7_cloud_dandy', badge: 'ff7_cloud_buster', a: 'Cloud', b: 'Dandy',
    recLevel: calcRecLevel('Cloud', 'Dandy'), title: 'Mercenary in the Spotlight',
    stages: [
      { name: 'Showman Meets SOLDIER', lines: [
        { who: 'Dandy', text: "A spiky blonde hero with a colossal broadsword! What an entrance!" },
        { who: 'Cloud', text: "I'm not a performer. Just point me toward the contract targets." }
      ]},
      { name: 'Stage Combat', lines: [
        { who: 'Dandy', text: "Remember to pose for the back row when you swing that sword!" },
        { who: 'Cloud', text: "Posing gets you killed. Clean slashes get results." }
      ]},
      { name: 'Braver Flash', lines: [
        { who: 'Cloud', text: "Braver! *Splits heavy armored automaton in two*" },
        { who: 'Dandy', text: "Sensational! The theatrical lighting was spectacular!" }
      ]},
      { name: 'Unexpected Applause', lines: [
        { who: 'Dandy', text: "Listen to the crowd roar for Cloud Strife!" },
        { who: 'Cloud', text: "...Hmph. Didn't know people here appreciated sword forms." }
      ]},
      { name: 'Curtain Call', lines: [
        { who: 'Dandy', text: "Come back whenever you need fresh spotlights, mercenary." },
        { who: 'Cloud', text: "If the pay is right, I'll be around." }
      ]}
    ]
  });

  /* 29. Tifa & Bobette */
  defCampaign({
    id: 'ff7_tifa_bobette', badge: 'ff7_tifa_gloves', a: 'Tifa', b: 'Bobette',
    recLevel: calcRecLevel('Tifa', 'Bobette'), title: 'Seventh Heaven Hearth',
    stages: [
      { name: 'Comfort in the Cold', lines: [
        { who: 'Tifa', text: "Bobette! It gets so chilly down in these basement halls." },
        { who: 'Bobette', text: "Sit by the hearth, dear! I have fresh knitted shawls." }
      ]},
      { name: 'Martial Focus', lines: [
        { who: 'Tifa', text: "Training my knuckle strikes keeps the blood flowing!" },
        { who: 'Bobette', text: "My goodness, what power in those gloves! Zangan would be proud." }
      ]},
      { name: 'Beat Rush', lines: [
        { who: 'Tifa', text: "Somersault! Waterkick! Clear the room!" },
        { who: 'Bobette', text: "Knitting needles at the ready, dear! Stitched barriers deployed!" }
      ]},
      { name: 'Bar Talk', lines: [
        { who: 'Tifa', text: "Back at Seventh Heaven, I loved listening to everyone's stories." },
        { who: 'Bobette', text: "A kind listening ear is the greatest gift of all." }
      ]},
      { name: 'Warm Friendship', lines: [
        { who: 'Tifa', text: "Thank you for the warm mittens and tea, Bobette." },
        { who: 'Bobette', text: "Anytime, Tifa. You're always welcome by my fire." }
      ]}
    ]
  });

  /* 30. Aerith & Bassie */
  defCampaign({
    id: 'ff7_aerith_bassie', badge: 'ff7_aerith_ribbon', a: 'Aerith', b: 'Bassie',
    recLevel: calcRecLevel('Aerith', 'Bassie'), title: 'Ancient Petals',
    stages: [
      { name: 'Yellow Flowers', lines: [
        { who: 'Aerith', text: "Bassie! Look at these lovely little yellow flowers growing by the path!" },
        { who: 'Bassie', text: "They look so delicate... how do they survive in this concrete?" }
      ]},
      { name: 'Prayer & Music', lines: [
        { who: 'Aerith', text: "Flowers grow where people care for them. Play a sweet tune for them!" },
        { who: 'Bassie', text: "*Plays gentle bass melody* The petals are opening up!" }
      ]},
      { name: 'Healing Wind', lines: [
        { who: 'Aerith', text: "Healing Wind! May light wash away all wounds and fatigue." },
        { who: 'Bassie', text: "I feel so invigorated! My notes sound brighter than ever." }
      ]},
      { name: 'Ancient Echoes', lines: [
        { who: 'Aerith', text: "Can you hear the voice of the planet beneath the floorboards?" },
        { who: 'Bassie', text: "It sounds like a deep, gentle rhythm... like a heartbeat." }
      ]},
      { name: 'Slum Garden', lines: [
        { who: 'Aerith', text: "Let's plant a whole row of seedlings together!" },
        { who: 'Bassie', text: "I'll provide the morning music every day!" }
      ]}
    ]
  });

  /* 31. Cait Sith & Gigi */
  defCampaign({
    id: 'ff7_caitsith_gigi', badge: 'ff7_caitsith_megaphone', a: 'CaitSith', b: 'Gigi',
    recLevel: calcRecLevel('CaitSith', 'Gigi'), title: 'Dice & Slot Shenanigans',
    stages: [
      { name: 'Fortune Teller', lines: [
        { who: 'CaitSith', text: "Step right up! Cait Sith will tell your lucky fortune today!" },
        { who: 'Gigi', text: "Oooh! Pick a card! Let's see what the slot wheels say!" }
      ]},
      { name: 'Dice Roll Chaos', lines: [
        { who: 'CaitSith', text: "*Rolls giant dice* Double sixes! Jackpot!" },
        { who: 'Gigi', text: "Yay! Coins and glitter raining down from the ceiling!" }
      ]},
      { name: 'Moogle Stomp', lines: [
        { who: 'CaitSith', text: "Megaphone shouting: ATTACK, MOOGLE! Stomp those intruders!" },
        { who: 'Gigi', text: "Haha! The giant stuffed moogle sat right on them!" }
      ]},
      { name: 'Gold Saucer Games', lines: [
        { who: 'CaitSith', text: "Nothing beats the glamour of the Golden Saucer amusement park." },
        { who: 'Gigi', text: "We should build a roller coaster right down this stairwell!" }
      ]},
      { name: 'Lucky Stars', lines: [
        { who: 'CaitSith', text: "My fortune says: lifelong friends who bring immense joy." },
        { who: 'Gigi', text: "Best fortune ever! Let's roll again!" }
      ]}
    ]
  });

  /* 32. GingerBrave & GingerBright */
  defCampaign({
    id: 'gingerbrave_bright', badge: 'brave_bright_button', a: 'GingerBrave', b: 'GingerBright',
    recLevel: calcRecLevel('GingerBrave', 'GingerBright'), title: 'Sweet Escape',
    stages: [
      { name: 'Witch\'s Oven Escape', lines: [
        { who: 'GingerBrave', text: "GingerBright! The oven door is swinging open! RUN!" },
        { who: 'GingerBright', text: "Right behind you! Grab your candy cane stick!" }
      ]},
      { name: 'Jumping Obstacles', lines: [
        { who: 'GingerBrave', text: "Slide under the rolling pin, jump over the butter blocks!" },
        { who: 'GingerBright', text: "Double jump! We're making it to the kitchen counter!" }
      ]},
      { name: 'Candy Button Mend', lines: [
        { who: 'GingerBright', text: "Wait! Your candy button came loose during the slide." },
        { who: 'GingerBrave', text: "Good catch! Sew it tight with strawberry frosting!" }
      ]},
      { name: 'Freedom Sprint', lines: [
        { who: 'GingerBrave', text: "The window sill is in sight! Sunshine and open meadows!" },
        { who: 'GingerBright', text: "No more baking trays! We are free cookies!" }
      ]},
      { name: 'Brave Future', lines: [
        { who: 'GingerBrave', text: "As long as we run together, nothing can stop us." },
        { who: 'GingerBright', text: "To the Cookie Kingdom and beyond!" }
      ]}
    ]
  });

  /* 33. GingerBright & GingerBrave */
  defCampaign({
    id: 'gingerbright_brave', badge: 'bright_brave_ribbon', a: 'GingerBright', b: 'GingerBrave',
    recLevel: calcRecLevel('GingerBright', 'GingerBrave'), title: 'Bright Courage',
    stages: [
      { name: 'Pink Ribbon Charm', lines: [
        { who: 'GingerBright', text: "GingerBrave, look at this shiny lollipop ribbon!" },
        { who: 'GingerBrave', text: "Bright pink and courageous! It suits your quick feet." }
      ]},
      { name: 'Sugar Jelly Trail', lines: [
        { who: 'GingerBright', text: "Follow the sugar jellies! They lead straight to safety!" },
        { who: 'GingerBrave', text: "Watch out for fork traps! I'll knock them aside with my cane!" }
      ]},
      { name: 'Cheerful Encouragement', lines: [
        { who: 'GingerBright', text: "Whenever you feel tired, remember why we started running!" },
        { who: 'GingerBrave', text: "Your smile keeps the whole team running at top speed!" }
      ]},
      { name: 'Outrunning the Spoons', lines: [
        { who: 'GingerBright', text: "Giant silver spoons dropping from above!" },
        { who: 'GingerBrave', text: "Slide and dash! Teamwork makes the dream work!" }
      ]},
      { name: 'Sweet Sunshine', lines: [
        { who: 'GingerBright', text: "We made it! Golden sugar fields as far as the eye can see." },
        { who: 'GingerBrave', text: "We're the bravest, brightest cookies in the world!" }
      ]}
    ]
  });

  /* 34. ShadowMilkCookie & CreamPuffCookie */
  defCampaign({
    id: 'shadowmilk_creampuff', badge: 'milk_cream_spark', a: 'ShadowMilkCookie', b: 'CreamPuffCookie',
    recLevel: calcRecLevel('ShadowMilkCookie', 'CreamPuffCookie'), title: 'Shadows and Spells',
    stages: [
      { name: 'Library of Illusions', lines: [
        { who: 'CreamPuffCookie', text: "Eep! Mister Shadow Milk, are these floating spellbooks yours?" },
        { who: 'ShadowMilkCookie', text: "Hehehe, little sorceress! Do you dare peer into forbidden illusions?" }
      ]},
      { name: 'Cream Conjuring', lines: [
        { who: 'CreamPuffCookie', text: "My wand is ready! Whipped Cream Tornado!" },
        { who: 'ShadowMilkCookie', text: "Splendid dramatic flourish! Now add a dash of twilight shadow!" }
      ]},
      { name: 'Mischievous Puppets', lines: [
        { who: 'ShadowMilkCookie', text: "Dance, little shadow marionettes! Confuse our foes!" },
        { who: 'CreamPuffCookie', text: "They're actually kind of cute... in a spooky way!" }
      ]},
      { name: 'Exam Day Magic', lines: [
        { who: 'CreamPuffCookie', text: "If the Magic Academy professors saw this, I'd get detention!" },
        { who: 'ShadowMilkCookie', text: "Rules are meant to be bent, child. True magic knows no script." }
      ]},
      { name: 'Twilit Star', lines: [
        { who: 'ShadowMilkCookie', text: "You have genuine talent, Cream Puff. Don't let boring wizards dim it." },
        { who: 'CreamPuffCookie', text: "Thank you! I'll practice my star charms even harder!" }
      ]}
    ]
  });

  /* 35. CreamPuffCookie & PureVanillaCookie */
  defCampaign({
    id: 'creampuff_purevanilla', badge: 'cream_vanilla_bookmark', a: 'CreamPuffCookie', b: 'PureVanillaCookie',
    recLevel: calcRecLevel('CreamPuffCookie', 'PureVanillaCookie'), title: 'Sanctuary of Truth',
    stages: [
      { name: 'The Vanilla Sanctuary', lines: [
        { who: 'CreamPuffCookie', text: "Pure Vanilla Cookie! I brought my ancient history scrolls!" },
        { who: 'PureVanillaCookie', text: "Welcome, dear student. Sit and enjoy some fragrant tea." }
      ]},
      { name: 'Patience & Practice', lines: [
        { who: 'CreamPuffCookie', text: "*Spell fizzles into cream puffs* Oh no... another clumsy attempt!" },
        { who: 'PureVanillaCookie', text: "Mistakes are sweet reminders that our magic has room to bloom." }
      ]},
      { name: 'Shield of Healing', lines: [
        { who: 'PureVanillaCookie', text: "Raise your staff. Focus on protecting those you cherish." },
        { who: 'CreamPuffCookie', text: "Cream puff barrier! It's glowing with radiant golden light!" }
      ]},
      { name: 'Ancient Library Study', lines: [
        { who: 'CreamPuffCookie', text: "These ancient bookmarks hold notes from past archmages." },
        { who: 'PureVanillaCookie', text: "And one day, your notes will inspire the next generation." }
      ]},
      { name: 'Graduation Blessings', lines: [
        { who: 'CreamPuffCookie', text: "I promise to use my magic to heal and bring joy, Headmaster!" },
        { who: 'PureVanillaCookie', text: "I have never doubted you for a moment, Cream Puff." }
      ]}
    ]
  });

  /* 36. TigerLilyCookie & GingerBrave */
  defCampaign({
    id: 'tigerlily_gingerbrave', badge: 'tiger_brave_bell', a: 'TigerLilyCookie', b: 'GingerBrave',
    recLevel: calcRecLevel('TigerLilyCookie', 'GingerBrave'), title: 'Wild Jungle Run',
    stages: [
      { name: 'Jungle Canopy', lines: [
        { who: 'TigerLilyCookie', text: "Grrr! Swift cookie entering butter tiger territory!" },
        { who: 'GingerBrave', text: "Wait! I'm friendly! I love running through the jungle trees!" }
      ]},
      { name: 'Spear & Cane', lines: [
        { who: 'TigerLilyCookie', text: "Show wild agility! Leap across spiked brambles!" },
        { who: 'GingerBrave', text: "Vaulting with my candy cane! Check this out!" }
      ]},
      { name: 'Butter Tiger Roar', lines: [
        { who: 'TigerLilyCookie', text: "ROAR! Butter tiger approves of your brave spirit!" },
        { who: 'GingerBrave', text: "Haha! Pet the big kitty! He's made of delicious creamy butter!" }
      ]},
      { name: 'Chasm Crossing', lines: [
        { who: 'TigerLilyCookie', text: "Vines snapping! Grab spear end!" },
        { who: 'GingerBrave', text: "Got it! Pulled across! That was a close one!" }
      ]},
      { name: 'Jungle Kinship', lines: [
        { who: 'TigerLilyCookie', text: "You run like wild jungle wind, GingerBrave." },
        { who: 'GingerBrave', text: "Anytime you want to race across the kingdom, I'm ready!" }
      ]}
    ]
  });

  /* 37. PureVanillaCookie & CreamPuffCookie */
  defCampaign({
    id: 'purevanilla_creampuff', badge: 'vanilla_cream_ribbon', a: 'PureVanillaCookie', b: 'CreamPuffCookie',
    recLevel: calcRecLevel('PureVanillaCookie', 'CreamPuffCookie'), title: 'Light of Forgiveness',
    stages: [
      { name: 'Morning Meditation', lines: [
        { who: 'PureVanillaCookie', text: "The dawn light carries peace to the sanctuary gardens." },
        { who: 'CreamPuffCookie', text: "The flowers are blooming with golden vanilla scent!" }
      ]},
      { name: 'Healing Warmth', lines: [
        { who: 'PureVanillaCookie', text: "Remember, little one: true strength lies in a forgiving heart." },
        { who: 'CreamPuffCookie', text: "Even when enemies are mean? It's hard sometimes..." },
        { who: 'PureVanillaCookie', text: "Especially then. Light guides those who have lost their way." }
      ]},
      { name: 'Warding the Sanctuary', lines: [
        { who: 'PureVanillaCookie', text: "Darkness tests our walls. Stand beside me, Cream Puff." },
        { who: 'CreamPuffCookie', text: "Vanilla Starlight Barrier! We protect our home!" }
      ]},
      { name: 'Gentle Dawn', lines: [
        { who: 'PureVanillaCookie', text: "The shadows disperse in the gentle warmth of forgiveness." },
        { who: 'CreamPuffCookie', text: "Look at the rainbow over the stained glass window!" }
      ]},
      { name: 'Eternal Beacon', lines: [
        { who: 'PureVanillaCookie', text: "Your warm heart shines brighter than any ancient spell." },
        { who: 'CreamPuffCookie', text: "I'll always carry your lessons in my heart, Pure Vanilla!" }
      ]}
    ]
  });


  /* =========================================================================
     PART 3: GREETING LINES (FRIENDSHIP_GREETING_LINES)
     ========================================================================= */

  if (typeof FRIENDSHIP_GREETING_LINES !== 'undefined' && FRIENDSHIP_GREETING_LINES) {
    Object.assign(FRIENDSHIP_GREETING_LINES, {
      cosmo_sprout: [
        { who: 'Narrator', text: "Cosmo arranges strawberry tarts on the counter as Sprout enters with fresh leaves." },
        { who: 'Cosmo', text: "Sprout! Taste this glaze before the others arrive!" },
        { who: 'Sprout', text: "Mmm! Perfectly sweet. The harvest paid off." }
      ],
      coal_bobette: [
        { who: 'Narrator', text: "Bobette gently hands a pair of warm knitted mittens to Coal beside the boiler." },
        { who: 'Bobette', text: "Put them on, Coal. No more freezing down here." },
        { who: 'Coal', text: "They're... so soft. Thank you, Bobette." }
      ],
      looey_yatta: [
        { who: 'Narrator', text: "Looey squeaks a party horn while Yatta juggles rainbow rings." },
        { who: 'Yatta', text: "Ready for the big finale, Looey?" },
        { who: 'Looey', text: "*Honk honk!* Confetti primed and ready to pop!" }
      ],
      eggson_rudie: [
        { who: 'Narrator', text: "Eggson clicks his notebook open while Rudie's red nose bulb glows brightly." },
        { who: 'Eggson', text: "Keep the beam steady, Rudie. Storage corridor inspection begins." },
        { who: 'Rudie', text: "Got it, detective! Clear light ahead!" }
      ],
      soulvester_connie: [
        { who: 'Narrator', text: "Soulvester bows chivalrously as Connie floats into the mist." },
        { who: 'Soulvester', text: "Lady Connie. My spectral broadsword is at your command." },
        { who: 'Connie', text: "Then let us walk together, Sir Soulvester." }
      ],
      pebble_dandy: [
        { who: 'Narrator', text: "Pebble bounds happily around Dandy, barking with high excitement." },
        { who: 'Dandy', text: "Who's my golden champion? Come on, boy, let's explore!" },
        { who: 'Pebble', text: "Arf! Arf! *wags tail excitedly*" }
      ],
      riku_sora: [
        { who: 'Narrator', text: "Riku holds out a silver paopu charm toward Sora on the beach." },
        { who: 'Riku', text: "Sora. The road to dawn is open. Ready?" },
        { who: 'Sora', text: "Always ready when I'm with you, Riku!" }
      ],
      donald_goofy: [
        { who: 'Narrator', text: "Donald adjusts his blue wizard hat as Goofy checks his knight shield." },
        { who: 'Donald', text: "Goofy! Stay in formation and don't drop your guard!" },
        { who: 'Goofy', text: "A-hyuck! You can count on me, Donald!" }
      ],
      barret_cloud: [
        { who: 'Narrator', text: "Barret checks the ammo drum on his gun-arm while Cloud checks his Buster Sword." },
        { who: 'Barret', text: "Stay sharp, SOLDIER! We got a planet to defend!" },
        { who: 'Cloud', text: "Just keep your fire off my back." }
      ],
      sephiroth_cloud: [
        { who: 'Narrator', text: "A single black feather drifts between Sephiroth and Cloud." },
        { who: 'Sephiroth', text: "Cloud... fate weaves our swords together once more." },
        { who: 'Cloud', text: "I'm ready for you, Sephiroth." }
      ],
      bedtimeastro_astro: [
        { who: 'Narrator', text: "Bedtime Astro fluffs a large star-pattern pillow beside Astro's telescope." },
        { who: 'BedtimeAstro', text: "*Yawns* Sleepy stargazing time, Astro..." },
        { who: 'Astro', text: "Just one more galaxy chart, Bedtime Astro!" }
      ],
      cody_dango: [
        { who: 'Narrator', text: "Dango flips through an action-packed comic page featuring Cody." },
        { who: 'Dango', text: "Look at this double-page spread I drew of you!" },
        { who: 'Cody', text: "Epic! Let's go pull off that exact stunt right now!" }
      ],
      nugget_copper: [
        { who: 'Narrator', text: "Nugget unrolls an ancient mining parchment as Copper raises his pickaxe." },
        { who: 'Nugget', text: "X marks the golden vein on this map, Copper!" },
        { who: 'Copper', text: "Then let's dig, partner! Gold awaits!" }
      ],
      discard_selena: [
        { who: 'Narrator', text: "Discard nervously holds up a crystal prism for Selena to inspect." },
        { who: 'Discard', text: "Selena... do you think this glass shard is pretty?" },
        { who: 'Selena', text: "It's magnificent, Discard. It reflects the entire cosmos." }
      ],
      selena_discard: [
        { who: 'Narrator', text: "Selena holds a soft patchwork velvet heart against her chest." },
        { who: 'Selena', text: "Discard sewn this for me. It warms my soul under the stars." },
        { who: 'Discard', text: "I'm so happy you like it, Selena." }
      ],
      copper_nugget: [
        { who: 'Narrator', text: "Copper taps his heavy brass compass against Nugget's helmet." },
        { who: 'Copper', text: "Heading set, Nugget. Underground shafts await." },
        { who: 'Nugget', text: "Right behind you, Copper! Let's find some gems!" }
      ],
      kris_ralsei: [
        { who: 'Narrator', text: "Kris adjusts their blue cape as Ralsei waves warmly from the castle steps." },
        { who: 'Ralsei', text: "Kris! I'm so glad you came back to the Dark World!" },
        { who: 'Narrator', text: "Kris gives a subtle, reassuring nod." }
      ],
      ralsei_kris: [
        { who: 'Narrator', text: "Ralsei displays a freshly baked Butterscotch-Cinnamon pie." },
        { who: 'Ralsei', text: "Kris, I made this specially for our journey today!" },
        { who: 'Narrator', text: "Kris takes a comforting slice and readies their sword." }
      ],
      tasquemanager_dyle: [
        { who: 'Narrator', text: "Tasque Manager cracks her electric whip rhythmically on the subway platform." },
        { who: 'TasqueManager', text: "Order and precision! Are the trains running on schedule, Dyle?" },
        { who: 'Dyle', text: "Down to the second, ma'am! All tracks cleared!" }
      ],
      flowery_dandy: [
        { who: 'Narrator', text: "Flowery twirls onto the center stage opposite Dandy's grand bow." },
        { who: 'Flowery', text: "Let's see whose petals shine brighter today, Dandy!" },
        { who: 'Dandy', text: "May the best floral showman win the audience!" }
      ],
      chell_boxten: [
        { who: 'Narrator', text: "Chell places a Weighted Companion Cube beside Boxten's music box." },
        { who: 'Boxten', text: "Your companion cube seems very fond of my melodies, Chell." },
        { who: 'Narrator', text: "Chell gives a quiet, knowing nod." }
      ],
      qom_ribecca_gourdy: [
        { who: 'Narrator', text: "Queen of Mystery Ribecca raises her royal scepter toward Gourdy's lantern." },
        { who: 'QOMRibecca', text: "Lord Gourdy. The masquerade banquet begins." },
        { who: 'QOMGourdy', text: "The pumpkin fires burn at your command, Your Majesty." }
      ],
      qom_ribecca_eclipse: [
        { who: 'Narrator', text: "QOM Ribecca watches the darkening sun alongside Eclipse." },
        { who: 'QOMRibecca', text: "The celestial eclipse aligns with our sovereignty." },
        { who: 'QOMEclipse', text: "Coronal perimeter secure. The crown remains supreme." }
      ],
      vee_shelly: [
        { who: 'Narrator', text: "Vee synchronizes her holographic display with Shelly's fossil notebook." },
        { who: 'Vee', text: "Shelly, my archive is ready to log today's findings." },
        { who: 'Shelly', text: "Let's find some ancient treasures together, Vee!" }
      ],
      sharebear_sprout: [
        { who: 'Narrator', text: "Share Bear Cosmo offers a rainbow berry cupcake to Tenderheart Sprout." },
        { who: 'ShareBearCosmo', text: "Sharing makes every garden bloom sweeter, Sprout!" },
        { who: 'TenderheartSprout', text: "Care and friendship are the finest fertilizers in the world!" }
      ],
      boxten_poppy: [
        { who: 'Narrator', text: "Boxten turns his wind-up key as Poppy prepares a bubble wand." },
        { who: 'Boxten', text: "Poppy, let's play our cheerful duet for the courtyard." },
        { who: 'Poppy', text: "I'll make the biggest, shiniest bubbles to match your tune!" }
      ],
      kairi_cocoa: [
        { who: 'Narrator', text: "Kairi examines a cup of steaming hot cocoa decorated with thalassa shells." },
        { who: 'Kairi', text: "Cocoa, this tastes like warm sunshine on Destiny Island!" },
        { who: 'Cocoa', text: "Yay! Hot chocolate brings everyone closer together!" }
      ],
      ff7_cloud_dandy: [
        { who: 'Narrator', text: "Dandy waves a spotlight over Cloud's immense Buster Sword." },
        { who: 'Dandy', text: "Welcome to the grand stage, Cloud! Give us a heroic strike!" },
        { who: 'Cloud', text: "Just making sure the perimeter is clean." }
      ],
      ff7_tifa_bobette: [
        { who: 'Narrator', text: "Tifa straps on her leather fighting gloves beside Bobette's warm hearth." },
        { who: 'Tifa', text: "Thanks for the warm tea, Bobette. Feeling fully energized!" },
        { who: 'Bobette', text: "Knock them out, dear! I'll have more tea waiting when you return." }
      ],
      ff7_aerith_bassie: [
        { who: 'Narrator', text: "Aerith kneels beside a small yellow flower as Bassie plays gentle chords." },
        { who: 'Aerith', text: "Listen to the music, little flower. Bassie has a beautiful melody for you." },
        { who: 'Bassie', text: "I hope the plants enjoy the bassline!" }
      ],
      ff7_caitsith_gigi: [
        { who: 'Narrator', text: "Cait Sith rattles a pair of giant dice while Gigi laughs." },
        { who: 'CaitSith', text: "Lady luck is on our side today, Gigi!" },
        { who: 'Gigi', text: "Roll them! Let's see what amazing prize we win!" }
      ],
      gingerbrave_bright: [
        { who: 'Narrator', text: "GingerBrave readies his candy cane while GingerBright ties her pink ribbon." },
        { who: 'GingerBrave', text: "Oven door is behind us! Full speed ahead, GingerBright!" },
        { who: 'GingerBright', text: "Right beside you, Brave! We'll never get caught!" }
      ],
      gingerbright_brave: [
        { who: 'Narrator', text: "GingerBright points toward the sunlit meadow as GingerBrave smiles." },
        { who: 'GingerBright', text: "Look at the open fields, GingerBrave! Freedom!" },
        { who: 'GingerBrave', text: "Let's run as far as our cookie legs can carry us!" }
      ],
      shadowmilk_creampuff: [
        { who: 'Narrator', text: "Shadow Milk Cookie levitates glowing spell cards as Cream Puff grips her wand." },
        { who: 'ShadowMilkCookie', text: "Ready to test the boundaries of stage magic, little sorceress?" },
        { who: 'CreamPuffCookie', text: "I'll do my absolute best! Watch my cream tornado!" }
      ],
      creampuff_purevanilla: [
        { who: 'Narrator', text: "Pure Vanilla Cookie gently reviews Cream Puff Cookie's spell scrolls." },
        { who: 'PureVanillaCookie', text: "Your heart is sincere, Cream Puff. That is the greatest magic of all." },
        { who: 'CreamPuffCookie', text: "Thank you, Headmaster! I'll protect everyone with my barrier!" }
      ],
      tigerlily_gingerbrave: [
        { who: 'Narrator', text: "Tiger Lily Cookie stands atop her butter tiger as GingerBrave dashes up." },
        { who: 'TigerLilyCookie', text: "Brave cookie! Jungle trial begins now!" },
        { who: 'GingerBrave', text: "Try to keep up, Tiger Lily! I'm the fastest cookie alive!" }
      ],
      purevanilla_creampuff: [
        { who: 'Narrator', text: "Pure Vanilla Cookie raises his staff, casting a gentle golden ward over Cream Puff." },
        { who: 'PureVanillaCookie', text: "Peace and healing shine upon our sanctuary." },
        { who: 'CreamPuffCookie', text: "I'll stand with you and heal everyone who needs help!" }
      ],
      tenderheart_sharebear_cosmo: [
        { who: 'Narrator', text: "Tenderheart Sprout and Share Bear Cosmo wave cheerful paws under a rainbow." },
        { who: 'TenderheartSprout', text: "A warm heart and a generous treat can brighten anyone's day!" },
        { who: 'ShareBearCosmo', text: "Baking together is twice the fun, Tenderheart!" }
      ],
      qom_gourdy_connie: [
        { who: 'Narrator', text: "QOM Gourdy balances a carved pumpkin lantern as QOM Connie floats softly past." },
        { who: 'QOMGourdy', text: "The autumn winds whistle through the castle corridors, Connie." },
        { who: 'QOMConnie', text: "Let us guide any lost wandering souls to the harvest feast." }
      ],
      qom_soulvester_connie: [
        { who: 'Narrator', text: "QOM Soulvester salutes with his spectral broadsword before QOM Connie." },
        { who: 'QOMSoulvester', text: "My blade remains your shield, Lady Connie, through every trial." },
        { who: 'QOMConnie', text: "And my phantom ribbons will lend you swift grace, Sir Knight." }
      ],
      qom_connie_eclipse: [
        { who: 'Narrator', text: "QOM Connie watches the moon eclipse the courtyard stars with QOM Eclipse." },
        { who: 'QOMConnie', text: "Even when the skies go dark, our spirits glow with gentle light." },
        { who: 'QOMEclipse', text: "Coronal perimeter holding. No shadow passes unseen." }
      ],
      qom_connie_soulvester: [
        { who: 'Narrator', text: "QOM Connie floats alongside QOM Soulvester as mist swirls around their armor." },
        { who: 'QOMConnie', text: "Ready to inspect the castle walls, Sir Soulvester?" },
        { who: 'QOMSoulvester', text: "Always, Lady Connie. Honor and chivalry guide our steps." }
      ],
      jessie_shrimpo: [
        { who: 'Narrator', text: "Jessie tosses a soft sponge toward Shrimpo, who grumbles while scrubbing." },
        { who: 'Jessie', text: "Cheer up, Shrimpo! You missed a spot behind that locker!" },
        { who: 'Shrimpo', text: "I didn't miss anything! STOP TELLING ME WHAT TO DO!" }
      ],
      dango_bassie: [
        { who: 'Narrator', text: "Dango taps his pencil against Bassie's bass strings to test the acoustics." },
        { who: 'Dango', text: "Bassie! That low frequency gives my sketches so much dramatic energy!" },
        { who: 'Bassie', text: "I'll keep the rhythm going while you ink the action panels!" }
      ],
      dango_jessie: [
        { who: 'Narrator', text: "Dango shows Jessie a funny caricature drawn on a paper napkin." },
        { who: 'Dango', text: "Jessie, look! I drew you holding ten brooms at once!" },
        { who: 'Jessie', text: "Haha! With the mess around here, I might actually need that many!" }
      ],
      copper_phantasia: [
        { who: 'Narrator', text: "Copper lights a small candle wick beside Phantasia's glittering tea table." },
        { who: 'Copper', text: "Sister. Even when we squabble, our wicks burn brighter together." },
        { who: 'Phantasia', text: "Of course, Copper. Let us share Weffle's pastries and plan our next expedition." }
      ],
      discard_copper: [
        { who: 'Narrator', text: "Discard tinkers with a small brass gear as Copper cleans her mining pickaxe." },
        { who: 'Discard', text: "Copper... I found this sturdy brass cog in the scrap heap." },
        { who: 'Copper', text: "Good find, Discard! That'll fit right into our mine cart winch!" }
      ]
    });
  }


  /* =========================================================================
     PART 4: SAVE FILE AUTO-ENROLLMENT
     ========================================================================= */

  if (typeof Save !== 'undefined' && Save.data && Save.data.badges) {
    const newBadgeList = [
      'cosmo_sprout', 'coal_bobette', 'looey_yatta', 'eggson_rudie',
      'soulvester_connie', 'pebble_dandy', 'riku_sora', 'donald_goofy',
      'barret_cloud', 'sephiroth_cloud', 'bedtimeastro_astro', 'cody_dango',
      'nugget_copper', 'discard_selena', 'selena_discard', 'copper_nugget'
    ];
    newBadgeList.forEach(bid => {
      if (!Save.data.badges[bid]) {
        Save.data.badges[bid] = { lvl: 1 };
      }
    });
  }

  console.log('[FriendshipExpansion] Loaded 16 new Friendship Badges and 37 Friendship Campaigns.');
})();
