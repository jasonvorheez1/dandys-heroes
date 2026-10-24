'use strict';

function qomRibeccaResonate(u, B) {
  B.applyStatus(u, u, 'qom_resonance', 999);
  if (qomStacks(u, 'qom_resonance') < 5) return;
  B.removeStatus(u, 'qom_resonance');
  qomShow(B, 'resonance', u);
  Sound.play('qom_guard', { vol: .5, rate: .8, throttle: 400 });
  qomWave(B, u, u.rarity >= 5 ? .68 : .46, 'magic', 'Resonance', e => {
    B.knockback(u, e, 40);
    if (u.rarity >= 5) { B.energy(e, -10); B.applyStatus(u, e, 'qom_offbeat', 5); }
  });
}

function qomRibeccaReassemble(u, B) {
  if (u._qomReassembled) return;
  u._qomReassembled = true;
  u.hp = Math.max(1, u.hp);
  u.invuln = B.t + 1.5;   // untargetable alone does not stop area and damage-over-time hits
  B.applyStatus(u, u, 'untargetable', 1.5);
  qomShow(B, 'reassemble', u);
  Sound.play('qom_bone', { vol: .7 });
  B.after(1.5, () => {
    if (!u.alive) return;
    B.removeStatus(u, 'untargetable');
    B.heal(u, u, (u.max.hp - u.hp) * .15);
    qomFoes(B, u).filter(e => B.distance(u, e) < 230).forEach(e => B.applyStatus(u, e, 'taunt', 4));
    qomShow(B, 'barrier', u);
  });
}

QOM_RIBECCA.basic.note = 'Strikes with her keytar. Every 2nd attack emits a reverberating Keytar Bass Pulse in a cone that slows enemy Attack Speed and generates 1 Resonance pip.';
QOM_RIBECCA.basic.onHit = (u, target, B) => {
  if (!target || !target.alive) return;
  u._qomRibeccaBasics = (u._qomRibeccaBasics || 0) + 1;
  if (u._qomRibeccaBasics % 2 === 0) {
    qomFoes(B, u).filter(e => B.distance(u, e) < 160).forEach(e => {
      B.damage(u, e, u.st.mag * .40, { type: 'magic', area: true, tag: 'Keytar Bass Pulse' });
      B.applyStatus(u, e, 'armslow', 3.0);
    });
    qomRibeccaResonate(u, B);
    Sound.play('qom_guard', { vol: .42, rate: 1.15, throttle: 180 });
    qomShow(B, 'pulse', u);
  }
};

QOM_RIBECCA.skills = {
  W: {
    name: 'Skeleton Symphony', type: 'Magic / Shield / Control', energy: 100,
    v: { ratio: 1.35, shield: .18 }, p: { dur: 8, resMax: 5 }, fixedP: ['resMax'],
    desc: (S, P) => `<span class="sk-pas">Passive: Enters every wave with a 🛡️ <b>Sound Barrier</b> equal to <em>22% Max HP</em> for 15s. While it holds, 22% of allied damage is redirected to Ribecca and softened by 25%. Absorbed damage builds 💀 <b>Resonance</b> (up to ${P.resMax} pips). At 5 pips, Ribecca detonates a bone-shattering shockwave: knocks foes back 40px, drains 10 Energy, and inflicts <b>Offbeat</b> for 5s!</span><br>
Active: Ribecca refreshes her personal Sound Barrier (+22% Max HP), grants all allies Sound Field shields (<em>${pcn(S.shield * 100)}% Max HP</em>) and 15% Damage Reduction for <em>${P.dur}s</em>. When shielded allies take hits, Ribecca fires retaliatory Keytar Pulses that slow the attacker. After ${P.dur}s, releases an amplified <b>Symphony Bass Note</b> that grows with absorbed damage (up to 320% Magic Damage)!`,
    passive(u, B) {
      B.shield(u, u, u.max.hp * .22, 15);
      B.on(u, 'waveStart', () => {
        if (!qomHasShieldFrom(u, u)) B.shield(u, u, u.max.hp * .22, 15);
      });
      B.on(u, 'allyDamaged', ev => {
        if (!ev.unit || !ev.src || ev.src.team === u.team || ev.redirected) return;
        const ally = ev.unit;
        if (ally !== u && qomHasShieldFrom(u, u) && !ally.hasStatus('qom_backstage_protected')) {
          const moved = ev.amount * .22;
          ev.amount -= moved;
          B.damage(ev.src, u, moved * .75, { type: 'true', redirected: true, noDodge: true, tag: 'Sound Barrier Redirect' });
        }
        if (B.t < (u._qomSymphonyUntil || 0) && qomHasShieldFrom(ally, u)) {
          u._qomSymphonyAbsorbed += Math.min(ally.shieldTotal, Math.max(0, ev.amount));
          if (B.t >= (ally._qomSoundPulseAt || 0)) {
            ally._qomSoundPulseAt = B.t + 1;
            B.damage(u, ev.src, u.st.mag * .28, { type: 'magic', reflected: true, tag: 'Keytar Pulse' });
            B.applyStatus(u, ev.src, 'armslow', 4);
            qomShow(B, 'barrier', u, ally);
          }
        }
      });
      B.on(u, 'damaged', ev => {
        if (ev.src && u.shieldTotal > 0 && !ev.dot) qomRibeccaResonate(u, B);
      });
      B.on(u, 'shieldDone', ev => {
        if (ev.target && ev.target !== u) qomShow(B, 'barrier', u, ev.target);
      });
    },
    cast(u, B, S, P) {
      u._qomSymphonyUntil = B.t + P.dur;
      u._qomSymphonyAbsorbed = 0;
      qomShow(B, 'barrier', u);
      Sound.play('qom_guard', { vol: .7, priority: true });
      qomAllies(B, u).forEach(a => {
        B.shield(u, a, u.max.hp * S.shield, P.dur);
        B.applyStatus(u, a, 'qom_sound_field', P.dur);
      });
      B.shield(u, u, u.max.hp * .22, P.dur + 4);
      B.after(P.dur, () => {
        if (!u.alive) return;
        const note = Math.min(u.st.mag * 3.2, u.st.mag * (S.ratio || 1.35) + (u._qomSymphonyAbsorbed || 0) * .20);
        qomFoes(B, u).forEach(e => B.damage(u, e, note, { type: 'magic', area: true, tag: 'Symphony Bass Note' }));
        qomShow(B, 'barrier', u);
        Sound.play('qom_guard', { vol: .58 });
      });
    }
  },
  G: {
    name: 'Bone Rattler', type: 'Physical / Control', cd: 8.5, v: { ratio: 1.45, bounceRatio: .65 }, p: { dur: 6 },
    desc: (S, P) => `Ribecca detaches her skeleton arm and hurls it at the strongest foe! Deals <em>${pcn(S.ratio * 100)}% Physical Damage</em>, Stuns for 1.25s (1.9s if already <b>Offbeat</b>), then bounces to 2 other enemies for <em>${pcn(S.ratio * S.bounceRatio * 100)}%</em> damage, leaving all targets <b>Offbeat</b> for <em>${P.dur}s</em>. Reattaching fortifies Ribecca with +35% Armor for 8s. If the primary target was Offbeat, heals Ribecca for 12% missing HP.`,
    cast(u, B, S, P) {
      const foes = qomFoes(B, u);
      const first = qomTop(foes, 'atk'); if (!first) return;
      const offbeat = first.hasStatus('qom_offbeat');
      [first, ...foes.filter(e => e !== first).slice(0, 2)].forEach((e, i) => B.after(i * .16, () => {
        if (!u.alive || !e.alive) return;
        B.damage(u, e, u.st.atk * S.ratio * (i ? S.bounceRatio : 1), { type: 'physical', tag: 'Bone Rattler' });
        B.applyStatus(u, e, 'qom_offbeat', P.dur);
        if (!i) B.applyStatus(u, e, 'stun', offbeat ? 1.9 : 1.25);
        qomShow(B, 'bone', u, e);
        if (i) Sound.play('qom_bone', { vol: .4, rate: 1 + i * .12, throttle: 90 });
      }));
      B.after(.5, () => { if (u.alive) B.applyStatus(u, u, 'qom_keytar_fortify', 8); });
      if (offbeat) B.heal(u, u, (u.max.hp - u.hp) * .12);
      Sound.play('qom_bone', { vol: .62 });
    }
  },
  B: {
    name: 'Backstage Protection', type: 'Shield / Support / Control', cd: 10,
    v: { shield: .22 }, p: { dur: 8 },
    desc: (S, P) => `Keytar chords wrap the 2 most wounded allies in 🛡️ <b>Backstage Shields</b> (<em>${pcn(S.shield * 100)}% Max HP</em> for <em>${P.dur}s</em>). While protected, 30% of their damage is redirected to Ribecca and softened by 25%, and attackers suffer -10% Attack for 6s. If a shield breaks, Ribecca heals for 5% Max HP and the ally gains a 4s Sound Field. If the shield expires unbroken, Ribecca heals for 2% Max HP and restores 6 Energy.`,
    cast(u, B, S, P) {
      qomAllies(B, u).sort((a, b) => a.hpPct - b.hpPct).slice(0, 2).forEach(a => {
        B.applyStatus(u, a, 'qom_backstage_protected', P.dur);
        B.shield(u, a, u.max.hp * S.shield, P.dur, {
          onBreak: () => {
            if (u.alive) B.heal(u, u, u.max.hp * .05);
            if (a.alive) B.applyStatus(u, a, 'qom_sound_field', 4);
            qomShow(B, 'backstage', u, a);
          },
          onExpire: () => {
            if (u.alive) { B.heal(u, u, u.max.hp * .02); B.energy(u, 6); }
          }
        });
        qomShow(B, 'backstage', u, a);
      });
      Sound.play('qom_guard', { vol: .5 });
    }
  },
  P: {
    name: 'The Undead', type: 'Tank / Support', v: { hp: .12, healOnResist: .04 }, p: { resistPips: 3 }, fixedP: ['resistPips'],
    desc: (S, P) => `<span class="sk-pas">Ribecca gains <em>+${pcn(S.hp * 100)}%</em> Max HP. She is completely immune to removable debuffs; resisted debuffs grant stacking <b>Undead Resilience</b> (+4% Def/MDef per stack) and every ${P.resistPips}rd resisted debuff heals her for <em>${pcn(S.healOnResist * 100)}% Max HP</em>.<br>
• <b>Skeleton Reassembly</b>: Once per wave upon taking lethal damage or dropping &lt;40% HP, Ribecca detaches into rattling skeleton bones, becomes Untargetable for 1.5s, then snaps back together, restoring 15% missing HP and Taunting all nearby foes for 4s!</span>`,
    passive(u, B, S) {
      u.flat.hpPqom = S.hp; u.dirty = true;
      u.guards.push((id, def) => {
        if (def.kind !== 'debuff') return false;
        B.applyStatus(u, u, 'qom_resilience', 10);
        u._qomResists = (u._qomResists || 0) + 1;
        if (u._qomResists % 3 === 0) B.heal(u, u, u.max.hp * S.healOnResist);
        qomShow(B, 'resist', u);
        return true;
      });
      B.on(u, 'waveStart', () => { u._qomReassembled = false; });
      B.on(u, 'allyLow', ally => { if (ally === u && u.hpPct < .4) qomRibeccaReassemble(u, B); });
      B.on(u, 'lethal', ev => {
        if (u._qomReassembled) return;
        ev.prevented = true;
        qomRibeccaReassemble(u, B);
      });
    }
  },
  R: {
    name: 'Unbreakable Performance', type: 'Shield / Control / Magic Damage',
    v: { hp: .12, passiveShield: .10 }, p: { interval: 18 }, fixedP: ['interval'],
    desc: (S, P) => `<span class="sk-pas">Ribecca permanently gains <em>+${pcn(S.hp * 100)}%</em> Max HP, +14% Defense, and +14% Magic Defense. Every ${P.interval}s, plays a defensive chord that grants all allies a <em>${pcn(S.passiveShield * 100)}% Max HP</em> Sound Shield and Fortify (+15% Def/MDef) for 8s.<br>
• <b>Standing Ovation</b>: Once per wave, if a teammate would suffer fatal damage, Ribecca prevents their death, leaves them with 18% Max HP, grants them an emergency shield (24% of Ribecca’s Max HP), and Taunts all enemies for 5s. After 5s, Ribecca unleashes a concussive shockwave (<em>80% Magic</em>, 80px knockback) and heals herself for 8% Max HP!</span>`,
    passive(u, B, S, P) {
      u.flat.hpPqomR = S.hp; u.flat.defPqomR = .14; u.flat.mdefPqomR = .14; u.dirty = true;
      B.on(u, 'waveStart', () => { u._qomStandingOvation = false; });
      B.every(u, P.interval, () => {
        qomAllies(B, u).forEach(a => {
          B.shield(u, a, u.max.hp * S.passiveShield, 8);
          B.applyStatus(u, a, 'qom_keytar_fortify', 8);
        });
        qomShow(B, 'barrier', u);
      });
      B.on(u, 'allyLethal', ev => {
        if (u._qomStandingOvation || !ev.unit || ev.unit === u || !ev.unit.alive) return;
        u._qomStandingOvation = true;
        ev.prevented = true;
        const ally = ev.unit;
        ally.hp = Math.max(1, ally.max.hp * .18);
        B.shield(u, ally, u.max.hp * .24, 8);
        B.applyStatus(u, u, 'qom_standing_guard', 5);
        B.applyStatus(u, u, 'qom_energy_lock', 5);
        qomFoes(B, u).forEach(e => B.applyStatus(u, e, 'taunt', 5));
        qomMark(u, B, 'STANDING OVATION', '#c7fa87');
        qomShow(B, 'ovation', u, ally);
        Sound.play('qom_guard', { vol: .72 });
        B.after(5, () => {
          if (!u.alive) return;
          qomWave(B, u, .80, 'magic', 'Standing Ovation', e => B.knockback(u, e, 80));
          B.heal(u, u, u.max.hp * .08);
          qomShow(B, 'ovation', u);
        });
      });
    }
  }
};

const qomRibeccaLiveWhite = QOM_RIBECCA.skills.W.passive;
QOM_RIBECCA.skills.W.passive = (u, B, S, P) => {
  qomRibeccaLiveWhite(u, B, S, P);
  B.on(u, 'allyDamaged', ev => {
    if (!ev.unit || ev.unit === u || !ev.src || ev.redirected || !ev.unit.hasStatus('qom_backstage_protected') || !qomHasShieldFrom(ev.unit, u)) return;
    const moved = ev.amount * .30;
    ev.amount -= moved;
    B.damage(ev.src, u, moved * .75, { type: 'true', redirected: true, noDodge: true, tag: 'Backstage Redirect' });
    B.applyStatus(u, ev.src, 'attackdown', 6, { val: .10, stacks: 1 });
    qomShow(B, 'backstage', u, ev.unit);
  });
};
