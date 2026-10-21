'use strict';

function qomSoulCounter(u, B, attacker, ally, ratio, kind) {
  if (!u.alive || !attacker || !attacker.alive) return;
  const oldResolve = qomStacks(u, 'qom_resolve');
  B.blink(u, (ally || attacker).x - u.face * 18, (ally || attacker).depth);
  qomShow(B, kind === 'parry' ? 'parry' : 'guard', u, attacker);
  B.damage(u, attacker, u.st.atk * ratio * (1 + oldResolve * .10), { type: 'physical', tag: kind === 'parry' ? 'Perfect Parry' : 'Knight Counter' });
  B.applyStatus(u, attacker, 'qom_challenged', 6);
  B.applyStatus(u, attacker, 'stun', .9);
  B.applyStatus(u, u, 'qom_resolve', 8);
  if (ally && ally.alive) {
    B.shield(u, ally, u.max.hp * .15, 5);
    if (u.rarity >= 5) B.applyStatus(u, ally, 'qom_royal_guard', 5);
  }
  if (oldResolve >= 3) {
    B.enemiesOf(u).filter(e => e.alive && e !== attacker && B.distance(e, attacker) < 170).forEach(e => {
      B.damage(u, e, u.st.atk * .55, { type: 'physical', area: true, tag: 'Riposte' });
      B.applyStatus(u, e, 'armslow', 3);
    });
    B.removeStatus(u, 'qom_resolve');
  }
  if (kind === 'parry' && u.rarity >= 5) {
    B.energy(u, 13);
    u.cds.B = Math.max(0, (u.cds.B || 0) - 1.4);
  }
  Sound.play('qom_counter', { vol: .58, throttle: 140 });
}

QOM_SOULVESTER.basic.note = 'Slashes with his spectral broadsword. Every 2nd basic attack is an empowered Shield Bash that knocks back, taunts the target for 1.5s, and grants 1 stack of Knightly Resolve.';
QOM_SOULVESTER.basic.onHit = (u, target, B) => {
  if (!target || !target.alive) return;
  u._qomSoulBasics = (u._qomSoulBasics || 0) + 1;
  if (u._qomSoulBasics % 2 === 0) {
    B.damage(u, target, u.st.atk * .45, { type: 'physical', tag: 'Shield Bash' });
    B.knockback(u, target, 28);
    B.applyStatus(u, target, 'taunt', 1.5);
    B.applyStatus(u, u, 'qom_resolve', 8);
    Sound.play('qom_counter', { vol: .42, rate: 1.2, throttle: 180 });
    B.fxSparkle(u.x, u.y - 45, 6, '#c9b4ff');
    B.fxFloatIcon(u.x, u.y - 100, '🛡️ SHIELD BASH', '#c9b4ff');
  }
};

QOM_SOULVESTER.skills = {
  W: {
    name: 'Knight of Mischief', type: 'Physical / Control / Shield', energy: 100,
    v: { ratio: 2.4, shield: .18 }, p: { guardDur: 6 },
    desc: (S, P) => `<span class="sk-pas">Passive: Soulvester begins combat with 🛡️ <b>Opening Ward</b> (-30% damage taken for 6s). Whenever an ally is critically struck, Soulvester gains <b>Valor</b> (+10% Def, max 3 stacks).</span><br>
Active: Teleports instantly beside the lowest-HP ally, grants them a Spectral Shield (<em>${pcn(S.shield * 100)}% Max HP</em> for ${P.guardDur}s), and intercepts the next attack aimed at them. Upon interception, completely negates the incoming hit, Stuns the attacker for 1.0s, inflicts <b>Challenged</b> (-25% damage to other allies for 6s), and counters with a devastating sword slash dealing <em>${pcn(S.ratio * 100)}% Physical Damage</em>! If the intercepted hit was a Skill, burns 20 Energy from the attacker.`,
    passive(u, B) {
      B.applyStatus(u, u, 'qom_opening_guard', 6);
      B.on(u, 'allyDamaged', ev => { if (ev.unit !== u && ev.crit) B.applyStatus(u, u, 'qom_valor', 10); });
    },
    cast(u, B, S, P) {
      const ally = qomLow(qomAllies(B, u)); if (!ally) return;
      B.applyStatus(u, u, 'untargetable', .24);
      qomShow(B, 'guard', u, ally);
      Sound.play('qom_ghost', { vol: .4, rate: 1.25 });
      B.after(.14, () => {
        if (!u.alive || !ally.alive) return;
        B.blink(u, ally.x - u.face * 22, ally.depth);
        B.removeStatus(u, 'untargetable');
        u._qomGuardUntil = B.t + P.guardDur;
        B.shield(u, ally, u.max.hp * S.shield, P.guardDur);
        const stop = B.on(u, 'allyDamaged', ev => {
          if (ev.unit !== ally || !ev.src || B.t > u._qomGuardUntil) return;
          u._qomGuardUntil = 0;
          ev.amount = 0;
          qomSoulCounter(u, B, ev.src, ally, S.ratio, 'guard');
          if (!ev.basic) B.energy(ev.src, -20);
          stop();
        });
        B.after(P.guardDur, stop);
      });
    }
  },
  G: {
    name: 'Perfect Parry', type: 'Physical / Control', cd: 10,
    v: { ratio: 1.45, armorShred: .30 }, p: { stanceDur: 2.0 },
    desc: (S, P) => `Soulvester raises his guitar shield for ${P.stanceDur}s in a <b>Perfect Parry</b> stance (Ward -40% damage taken). The first incoming attack is completely negated; he teleports behind the attacker, strikes twice for <em>${pcn(S.ratio * 100 * 2)}% Physical Damage</em>, and shreds Armor by <em>${pcn(S.armorShred * 100)}%</em> for 8s. Parrying a Skill interrupts it and heals Soulvester for 12% missing HP. If no hits are received during the stance, gains a 12% Max HP Shield.`,
    cast(u, B, S, P) {
      u._qomParried = false;
      u._qomParryUntil = B.t + P.stanceDur;
      B.applyStatus(u, u, 'qom_parry_guard', P.stanceDur);
      qomShow(B, 'guard', u);
      Sound.play('qom_counter', { vol: .32, rate: 1.35 });
      const stop = B.on(u, 'damaged', ev => {
        if (u._qomParried || !ev.src || B.t > u._qomParryUntil) return;
        u._qomParried = true;
        ev.amount = 0;
        const attacker = ev.src;
        B.blink(u, attacker.x - u.face * 20, attacker.depth);
        B.repeat(2, .14, () => {
          if (u.alive && attacker.alive) qomSoulCounter(u, B, attacker, null, S.ratio, 'parry');
        });
        B.applyStatus(u, attacker, 'defdown', 8, { val: S.armorShred });
        if (!ev.basic) { B.interrupt(attacker); B.heal(u, u, (u.max.hp - u.hp) * .12); }
        stop();
      });
      B.after(P.stanceDur, () => {
        stop();
        if (u.alive && !u._qomParried) B.shield(u, u, u.max.hp * .12, 6);
      });
    }
  },
  B: {
    name: 'Royal Intervention', type: 'Physical / Support / Control', cd: 12,
    v: { ratio: 1.65, redirect: .25 }, p: { dur: 12 },
    desc: (S, P) => `Soulvester establishes a Royal Guard over the highest-Attack ally for <em>${P.dur}s</em>, redirecting <em>${pcn(S.redirect * 100)}%</em> of their damage to Soulvester. When an enemy Skill targets that ally, Soulvester teleports in, slashes the damage by 75%, and countercharges the attacker for <em>${pcn(S.ratio * 100)}% Physical Damage</em>, knocking them back 90px and granting both Soulvester and the ally +35% Move Speed and <b>Knightly Resolve</b>. (Triggers up to 2 times at 5-star).`,
    cast(u, B, S, P) {
      const ally = qomTop(qomAllies(B, u).filter(a => a !== u), 'atk'); if (!ally) return;
      let uses = u.rarity >= 5 ? 2 : 1;
      let lastTag = null, lastAt = -99;
      qomShow(B, 'guard', u, ally);
      const stop = B.on(u, 'allyDamaged', ev => {
        if (ev.unit !== ally || !ev.src || ev.redirected) return;
        const source = ev.src;
        const moved = ev.amount * S.redirect;
        ev.amount -= moved;
        B.damage(source, u, moved, { type: 'true', redirected: true, tag: 'Royal Redirect' });
        if (ev.basic || uses <= 0 || (ev.tag && ev.tag === lastTag && B.t - lastAt < .9)) return;
        uses--;
        lastTag = ev.tag; lastAt = B.t;
        ev.amount *= .25;
        B.blink(u, ally.x - u.face * 20, ally.depth);
        B.damage(u, source, u.st.atk * S.ratio, { type: 'physical', tag: 'Royal Intervention' });
        B.knockback(u, source, 90);
        B.applyStatus(u, u, 'qom_resolve', 8);
        B.applyStatus(u, u, 'speedup', 6);
        B.applyStatus(u, ally, 'speedup', 6);
        qomShow(B, 'rush', u, source);
        Sound.play('qom_counter', { vol: .65, rate: .9 });
      });
      B.after(P.dur, stop);
    }
  },
  P: {
    name: 'Unyielding Knight', type: 'Tank / Counterattack',
    v: { hp: .18, def: .20, resolveDr: .08 }, p: { maxResolve: 3 },
    desc: (S, P) => `<span class="sk-pas">Soulvester gains <em>+${pcn(S.hp * 100)}%</em> Max HP and <em>+${pcn(S.def * 100)}%</em> Defense. Ranged basic attacks deal 30% less damage to him while he is above 50% HP. Each stack of ⚔️ <b>Knightly Resolve</b> (up to ${P.maxResolve} pips) reduces all incoming damage by <em>${pcn(S.resolveDr * 100)}%</em>. At ${P.maxResolve} stacks, his next counter cleaves all nearby foes with a sweeping <b>Riposte</b> (55% Attack Physical Damage) and slows their Attack Speed!</span>`,
    passive(u, B, S, P) {
      u.flat.hpPqom = S.hp; u.flat.defPqom = S.def; u.dirty = true;
      B.on(u, 'damaged', ev => {
        if (ev.basic && !ev.melee && u.hpPct > .5) ev.amount *= .70;
        // Knightly Resolve: each stack hardens him by resolveDr.
        const resolve = Math.min(P.maxResolve, qomStacks(u, 'qom_resolve'));
        if (resolve && !ev.dot) ev.amount *= 1 - resolve * S.resolveDr;
      });
    }
  },
  R: {
    name: 'Curtain Call Counter', type: 'Physical / Control / Support',
    v: { atk: .16, riposteRatio: 3.2 }, p: { hpThr: .35 },
    desc: (S, P) => `<span class="sk-pas">Soulvester permanently gains <em>+${pcn(S.atk * 100)}%</em> Attack, +18% Defense, and +12% CDR. Parries grant 12 Energy and reduce Royal Intervention's cooldown by 1.5s.<br>
• <b>Last Stand & Grand Riposte</b>: Once per wave when dropping &lt;${Math.round(P.hpThr * 100)}% HP, Soulvester enters Last Stand for 5s (Ward, CC Immunity), absorbing and storing all incoming damage. When Last Stand ends, he leaps at the primary damage dealer with a colossal <b>Grand Riposte</b> (dealing up to <em>${pcn(S.riposteRatio * 100)}%</em> Attack scaled by stored damage), restores 20% missing HP, and Taunts the target for 4s!</span>`,
    passive(u, B, S) {
      u.flat.atkPqom = S.atk; u.flat.defPqomR = .18; u.dirty = true;
      B.on(u, 'allyLow', ally => {
        if (ally !== u || u.hpPct >= .35 || u._qomLastStand) return;
        u._qomLastStand = true;
        u._qomLastDamage = 0;
        u._qomLastAttackers = new Map();
        B.applyStatus(u, u, 'qom_last_stand', 5);
        qomMark(u, B, 'LAST STAND', '#e5c5ff');
        qomShow(B, 'guard', u);
        B.after(5, () => {
          if (!u.alive) return;
          const ranked = [...u._qomLastAttackers].sort((a, b) => b[1] - a[1]);
          const foe = ranked[0] && ranked[0][0].alive ? ranked[0][0] : qomTop(qomFoes(B, u), 'atk');
          if (!foe) return;
          B.leap(u, foe.x - u.face * 20, .26, () => {
            if (!u.alive || !foe.alive) return;
            B.damage(u, foe, Math.min(u.st.atk * 4.2, u.st.atk * S.riposteRatio * .6 + u._qomLastDamage * .7), { type: 'physical', tag: 'Grand Riposte' });
            B.heal(u, u, (u.max.hp - u.hp) * .20);
            B.applyStatus(u, foe, 'taunt', 4);
            qomShow(B, 'riposte', u, foe);
            Sound.play('qom_counter', { vol: .7 });
          }, foe.depth);
        });
      });
      B.on(u, 'damaged', ev => {
        if (!u.hasStatus('qom_last_stand') || !ev.src) return;
        u._qomLastDamage += Math.max(0, ev.amount);
        u._qomLastAttackers.set(ev.src, (u._qomLastAttackers.get(ev.src) || 0) + Math.max(0, ev.amount));
      });
    }
  }
};

