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

QOM_RIBECCA.skills = {
  W: {
    name: 'Skeleton Symphony', type: 'Magic / Shield / Control', energy: 100,
    v: { ratio: 1.35 }, p: { dur: 8 },
    desc: () => 'Starts with a Sound Barrier worth 30% Max HP. While it holds, Ribecca redirects and softens allied damage. Absorbed hits build Resonance for a knockback wave. Active: refreshes personal Sound Barrier, grants team Shields and damage reduction for eight seconds, retaliatory sound pulses, then a bass note powered by absorbed damage.',
    passive(u, B) {
      B.shield(u, u, u.max.hp * .30, 15);
      B.on(u, 'waveStart', () => {
        if (!qomHasShieldFrom(u, u)) B.shield(u, u, u.max.hp * .30, 15);
      });
      B.on(u, 'allyDamaged', ev => {
        if (!ev.unit || !ev.src || ev.src.team === u.team || ev.redirected) return;
        const ally = ev.unit;
        if (ally !== u && qomHasShieldFrom(u, u) && !ally.hasStatus('qom_backstage_protected')) {
          const moved = ev.amount * .28;
          ev.amount -= moved;
          B.damage(ev.src, u, moved * .68, { type: 'true', redirected: true, noDodge: true, tag: 'Sound Barrier Redirect' });
        }
        if (B.t < (u._qomSymphonyUntil || 0) && qomHasShieldFrom(ally, u)) {
          u._qomSymphonyAbsorbed += Math.min(ally.shieldTotal, Math.max(0, ev.amount));
          if (B.t >= (ally._qomSoundPulseAt || 0)) {
            ally._qomSoundPulseAt = B.t + .6;
            B.damage(u, ev.src, u.st.mag * .40, { type: 'magic', reflected: true, tag: 'Keytar Pulse' });
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
        B.shield(u, a, u.max.hp * .22, P.dur);
        B.applyStatus(u, a, 'qom_sound_field', P.dur);
      });
      B.shield(u, u, u.max.hp * .30, P.dur + 4);
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
    name: 'Bone Rattler', type: 'Physical / Control', cd: 8.5, v: { ratio: 1.45 }, p: { dur: 6 },
    desc: () => 'Ribecca sends her detached arm at the strongest foe, Stunning them, then it bounces to two others and leaves them Offbeat. Reattaching grants Armor. An already Offbeat first target is Stunned longer and heals her.',
    cast(u, B, S, P) {
      const foes = qomFoes(B, u);
      const first = qomTop(foes, 'atk'); if (!first) return;
      const offbeat = first.hasStatus('qom_offbeat');
      [first, ...foes.filter(e => e !== first).slice(0, 2)].forEach((e, i) => B.after(i * .16, () => {
        if (!u.alive || !e.alive) return;
        B.damage(u, e, u.st.atk * S.ratio * (i ? .65 : 1), { type: 'physical', tag: 'Bone Rattler' });
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
    v: { shield: .28 }, p: { dur: 8 },
    desc: () => 'Keytar chords Shield the two most wounded allies. While protected, 40% of damage is redirected to Ribecca and softened; attackers lose Attack. A broken Shield heals Ribecca and leaves the ally with damage reduction.',
    cast(u, B, S, P) {
      qomAllies(B, u).sort((a, b) => a.hpPct - b.hpPct).slice(0, 2).forEach(a => {
        B.applyStatus(u, a, 'qom_backstage_protected', P.dur);
        B.shield(u, a, u.max.hp * S.shield, P.dur, {
          onBreak: () => {
            if (u.alive) B.heal(u, u, u.max.hp * .08);
            if (a.alive) B.applyStatus(u, a, 'qom_sound_field', 4);
            qomShow(B, 'backstage', u, a);
          },
          onExpire: () => {
            if (u.alive) { B.heal(u, u, u.max.hp * .04); B.energy(u, 6); }
          }
        });
        qomShow(B, 'backstage', u, a);
      });
      Sound.play('qom_guard', { vol: .5 });
    }
  },
  P: {
    name: 'The Undead', type: 'Tank / Support', v: { hp: .12 }, p: {},
    desc: () => 'Ribecca ignores removable debuffs and turns them into stacking Armor and Magic Defense. Every third resisted debuff heals her. Once per wave below 40% HP, she separates, becomes untargetable, reassembles, heals, and Taunts nearby enemies.',
    passive(u, B, S) {
      u.flat.hpPqom = S.hp; u.dirty = true;
      u.guards.push((id, def) => {
        if (def.kind !== 'debuff') return false;
        B.applyStatus(u, u, 'qom_resilience', 10);
        u._qomResists = (u._qomResists || 0) + 1;
        if (u._qomResists % 3 === 0) B.heal(u, u, u.max.hp * .06);
        qomShow(B, 'reassemble', u);
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
    name: 'Unbreakable Performance', type: 'Shield / Control / Magic Damage', v: { hp: .16 }, p: {},
    desc: () => 'Every 14 seconds, Ribecca Shields and reinforces the whole team. Five Resonance also drains enemy Energy and applies Offbeat. Once per wave, Standing Ovation prevents an ally’s KO, Taunts every foe, and ends in a healing shockwave.',
    passive(u, B, S) {
      u.flat.hpPqomR = S.hp; u.flat.defPqomR = .18; u.flat.mdefPqomR = .18; u.dirty = true;
      B.on(u, 'waveStart', () => { u._qomStandingOvation = false; });
      B.every(u, 14, () => {
        qomAllies(B, u).forEach(a => {
          B.shield(u, a, u.max.hp * .14, 8);
          B.applyStatus(u, a, 'qom_keytar_fortify', 8);
        });
        qomShow(B, 'barrier', u);
      });
      B.on(u, 'allyLethal', ev => {
        if (u._qomStandingOvation || !ev.unit || !ev.unit.alive) return;
        u._qomStandingOvation = true;
        ev.prevented = true;
        const ally = ev.unit;
        ally.hp = Math.max(1, ally.max.hp * .18);
        B.shield(u, ally, u.max.hp * .32, 8);
        B.applyStatus(u, u, 'qom_standing_guard', 5);
        B.applyStatus(u, u, 'qom_energy_lock', 5);
        qomFoes(B, u).forEach(e => B.applyStatus(u, e, 'taunt', 5));
        qomMark(u, B, 'STANDING OVATION', '#c7fa87');
        qomShow(B, 'ovation', u, ally);
        Sound.play('qom_guard', { vol: .72 });
        B.after(5, () => {
          if (!u.alive) return;
          qomWave(B, u, .80, 'magic', 'Standing Ovation', e => B.knockback(u, e, 80));
          B.heal(u, u, u.max.hp * .12);
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
    const moved = ev.amount * .40;
    ev.amount -= moved;
    B.damage(ev.src, u, moved * .65, { type: 'true', redirected: true, noDodge: true, tag: 'Backstage Redirect' });
    B.applyStatus(u, ev.src, 'attackdown', 6, { val: .10, stacks: 1 });
    qomShow(B, 'backstage', u, ev.unit);
  });
};

