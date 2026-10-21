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

QOM_SOULVESTER.skills = {
  W: {
    name: 'Knight of Mischief', type: 'Physical / Control / Shield', energy: 100,
    v: { ratio: 2.2 }, p: {},
    desc: () => 'Begins with his shield raised. Critical hits against allies build Valor. Active: instantly appears beside the lowest-HP ally, blocks their next hit, Stuns and Challenges the attacker, and drains Energy if the hit was a Skill.',
    passive(u, B) {
      B.applyStatus(u, u, 'qom_opening_guard', 6);
      B.on(u, 'allyDamaged', ev => { if (ev.unit !== u && ev.crit) B.applyStatus(u, u, 'qom_valor', 10); });
    },
    cast(u, B, S) {
      const ally = qomLow(qomAllies(B, u)); if (!ally) return;
      B.applyStatus(u, u, 'untargetable', .24);
      qomShow(B, 'guard', u, ally);
      Sound.play('qom_ghost', { vol: .4, rate: 1.25 });
      B.after(.14, () => {
        if (!u.alive || !ally.alive) return;
        B.blink(u, ally.x - u.face * 22, ally.depth);
        B.removeStatus(u, 'untargetable');
        u._qomGuardUntil = B.t + 6;
        B.shield(u, ally, u.max.hp * .15, 6);
        const stop = B.on(u, 'allyDamaged', ev => {
          if (ev.unit !== ally || !ev.src || B.t > u._qomGuardUntil) return;
          u._qomGuardUntil = 0;
          ev.amount = 0;
          qomSoulCounter(u, B, ev.src, ally, S.ratio, 'guard');
          if (!ev.basic) B.energy(ev.src, -20);
          stop();
        });
        B.after(6, stop);
      });
    }
  },
  G: {
    name: 'Perfect Parry', type: 'Physical / Control', cd: 10,
    v: { ratio: 1.3 }, p: {},
    desc: () => 'For two seconds Soulvester braces behind his shield. The first attacker is fully blocked; he teleports in for two sword strikes and Armor reduction. Parrying a Skill interrupts it and heals him. If untouched, he gains a Shield.',
    cast(u, B, S) {
      u._qomParried = false;
      u._qomParryUntil = B.t + 2;
      B.applyStatus(u, u, 'qom_parry_guard', 2);
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
        B.applyStatus(u, attacker, 'defdown', 8);
        if (!ev.basic) { B.interrupt(attacker); B.heal(u, u, (u.max.hp - u.hp) * .12); }
        stop();
      });
      B.after(2, () => {
        stop();
        if (u.alive && !u._qomParried) B.shield(u, u, u.max.hp * .12, 6);
      });
    }
  },
  B: {
    name: 'Royal Intervention', type: 'Physical / Support / Control', cd: 12,
    v: { ratio: 1.55 }, p: { dur: 12 },
    desc: () => 'Soulvester guards the highest-Attack ally, redirecting 25% of damage. When a Skill targets them, he teleports in, heavily cuts the damage, countercharges, and Knocks the attacker Back. At Red rank he can intercept two distinct hits.',
    cast(u, B, S, P) {
      const ally = qomTop(qomAllies(B, u).filter(a => a !== u), 'atk'); if (!ally) return;
      let uses = u.rarity >= 5 ? 2 : 1;
      let lastTag = null, lastAt = -99;
      qomShow(B, 'guard', u, ally);
      const stop = B.on(u, 'allyDamaged', ev => {
        if (ev.unit !== ally || !ev.src || ev.redirected) return;
        const source = ev.src;
        const moved = ev.amount * .25;
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
    name: 'Unyielding Knight', type: 'Tank / Counterattack', v: { hp: .17 }, p: {},
    desc: () => 'Gains Max HP and Armor. Guards and counters build Knightly Resolve for damage reduction and stronger retaliation. At three stacks his next counter cleaves nearby foes. Ranged Basics hurt less while he is healthy.',
    passive(u, B, S) {
      u.flat.hpPqom = S.hp; u.flat.defPqom = .18; u.dirty = true;
      B.on(u, 'damaged', ev => {
        if (ev.basic && !ev.melee && u.hpPct > .5) ev.amount *= .70;
        // Knightly Resolve: each stack hardens him by 6%.
        const resolve = Math.min(3, qomStacks(u, 'qom_resolve'));
        if (resolve && !ev.dot) ev.amount *= 1 - resolve * .06;
      });
    }
  },
  R: {
    name: 'Curtain Call Counter', type: 'Physical / Control / Support', v: { atk: .13 }, p: {},
    desc: () => 'Parries grant Energy and accelerate Royal Intervention; guarded allies gain extra protection. Below 35% HP once per wave, Last Stand absorbs attacks for five seconds before a powered Grand Riposte, healing Soulvester and Taunting the target.',
    passive(u, B, S) {
      u.flat.atkPqom = S.atk; u.flat.defPqomR = .14; u.dirty = true;
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
            B.damage(u, foe, Math.min(u.st.atk * 4.2, u.st.atk * 1.8 + u._qomLastDamage * .7), { type: 'physical', tag: 'Grand Riposte' });
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

