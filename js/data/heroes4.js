/* heroes4.js - Rodger, Soulvester, Gourdy, Eclipse, Sprout.
   Same contract as heroes.js/heroes2.js/heroes3.js. Rodger was previously an
   enemy-only quickCast() placeholder in twisted.js written before his real
   Skillset.txt was available (see the removed block there) - this is a full
   rewrite to match that file, now living here as a proper playable Hero.
   Soulvester, Gourdy and Eclipse are new. */
'use strict';

/* ============================================================ RODGER
   Backline Control - C Tier. Never throws a punch; wins by knowing too much. */
defHero({
  id: 'Rodger', name: 'Rodger', folder: 'Rodger', file: 'Rodger', icon: 'Rodger',
  role: 'Control', tier: 'C', element: 'Clue',
  blurb: 'Does not perform Basic Attacks. Watches, takes notes, and eventually knows exactly when to interrupt.',
  base: { hp: 3150, atk: 95, def: 190, mag: 265, mdef: 232, spd: 96, acc: 205, eva: 128 },
  hidden: { range: 300, aspd: .7, ms: 0, aggro: .30, crit: .05, critDmg: 1.4, healPow: 1, shieldPow: 1,
    cdr: .10, ccRes: .15, kbRes: .2, armorPen: .08, magPen: .12 },
  growth: { hp: .078, atk: .050, def: .078, mag: .090, mdef: .086 },
  move: { gait: 'swagger', bob: 4, freq: 1.3, lean: 4, squash: .03, idle: 'think', step: 'step',
    particles: 'none', pcol: '#8fb4ff', trail: { on: false }, brake: .4 },
  // Field Research says he doesn't attack at all - the basic here exists only
  // because the engine wants one; Rodger self-Disarms at battle start (see
  // W's passive) so it never actually fires.
  basic: { name: 'Notebook Flick', type: 'magic', ratio: .3, range: 300, proj: 'orb', pcol: '#8fb4ff',
    sfx: 'whoosh', hit: 'hit_magic', wind: .2, note: 'He never throws this - he is always Disarmed.' },
  skills: {
    W: {
      name: 'Field Research', type: 'Control', energy: 100,
      v: { caseDur: 2.4 }, p: { max: 5, every: 3, gain: 1 },
      desc: (S, P) => `<span class="sk-pas">Rodger performs no Basic Attacks and never leaves the backline. Every ${P.every}s he observes the highest-Energy enemy, gaining 1 Research on them (up to ${P.max}). Research is not a debuff - it's just what he knows.</span>
        Active: he rapidly studies the highest-Energy enemy, gaining ${P.gain + 1} Research at once, briefly interrupting them, and making them 🕵 Investigated for <em>${S.caseDur.toFixed(1)}s</em>.`,
      passive: (u, B, S, P) => {
        u.research = {}; // uid -> stacks, purely informational bookkeeping
        B.applyStatus(u, u, 'planted', 999);
        B.applyStatus(u, u, 'disarm', 999);
        u.immovable = true; // 'planted' stops him walking, but knockback() only checks this
        B.every(u, P.every, () => {
          const foes = B.enemiesOf(u);
          // Research is tied to a specific combat unit. Clear records for
          // defeated units so his active skills never select a ghost target.
          Object.keys(u.research).forEach(uid => {
            if (!foes.some(foe => String(foe.uid) === uid)) delete u.research[uid];
          });
          const t = B.highestEnergy(foes); if (!t) return;
          u.research[t.uid] = Math.min(P.max, (u.research[t.uid] || 0) + 1);
          B.anim(u, 'cast', .76, 'rodgerResearch');
          Sound.play('ding', { vol: .22, throttle: 600 });
          B.fxRodgerResearch(u, t, u.research[t.uid], true);
        });
        B.on(u, 'enemyDown', e => {
          if (e && u.research && e.uid != null) e._rodgerResearchAtDefeat = Math.max(e._rodgerResearchAtDefeat || 0, u.research[e.uid] || 0);
        });
      },
      cast: (u, B, S, P) => {
        const t = B.highestEnergy(B.enemiesOf(u)); if (!t) return;
        B.anim(u, 'cast', 1.14, 'rodgerResearch'); Sound.play('lock');
        B.fxRodgerResearch(u, t, Math.min(P.max, (u.research[t.uid] || 0) + P.gain + 1), false);
        B.after(.46, () => {
          if (!t.alive) return;
          u.research[t.uid] = Math.min(P.max, (u.research[t.uid] || 0) + P.gain + 1);
          B.applyStatus(u, t, 'investigated', S.caseDur);
          B.interrupt(t); Sound.play('guardbreak', { vol: .28, throttle: 300 }); B.fxRing(t.x, t.y - 40, 90, '#8fb4ff');
          B.fxStatusOn(t, 'SilenceEffect', { sizeMul: .88 });
        });
      }
    },
    G: {
      name: 'Research Capsule', type: 'Control', cd: 9,
      v: { base: .8, per: .35 }, p: { cdr: .18, dur: 5, seal: 4 },
      desc: (S, P) => `Throws a Capsule at the enemy Rodger has the most Research on. Stuns them for <em>${S.base.toFixed(1)}s</em> plus <em>${S.per.toFixed(1)}s</em> per Research, and makes them 🕵 Investigated for ${P.dur}s. At max Research, it also strips up to two positive effects and 🛑 Buff Seals them for ${P.seal}s, stopping their next hostile buff.`,
      ai: { prio: 55, cond: (u, B) => !!B.mostResearched(u) },
      cast: (u, B, S, P) => {
        const t = B.mostResearched(u); if (!t) return;
        const st = u.research[t.uid] || 0;
        B.anim(u, 'wind', .86, 'rodgerCapsule'); Sound.play('beam_charge', { vol: .20, throttle: 260 }); B.fxRodgerCapsuleReady(u, .72);
        B.after(.20, () => {
          if (!u.alive || !t.alive) return;
          B.anim(u, 'attack', .22, 'rodgerCapsuleRelease'); Sound.play('throwsomething', { vol: .55 });
          B.fxArc(u, t, { kind: 'obj', img: 'researchcapsule', size: 34 }, () => {
            Sound.play('icebreak'); B.hitstop(70);
            B.fxRodgerCapsuleImpact(t, st); B.fxStatusOn(t, 'StunEffect', { sizeMul: .92 });
            B.applyStatus(u, t, 'stun', S.base + S.per * st);
            B.applyStatus(u, t, 'investigated', P.dur);
            if (st >= 5) { B.dispel(t, 2); B.applyStatus(u, t, 'buffsealed', P.seal, { stacks: 1 }); B.fxStatusOn(t, 'WeakenEffect', { sizeMul: .9 }); }
          });
        });
      }
    },
    B: {
      name: 'Case File', type: 'Control', cd: 12,
      v: { dur: 6, slow: 2.5 }, p: {},
      desc: (S) => `Opens his case file on the enemy he's researched the most, making them 🕵 Investigated for <em>${S.dur.toFixed(1)}s</em> — reduced Energy Generation and Skill Haste. Whenever they cast a skill while Investigated, they're 🐢 Slowed for <em>${S.slow.toFixed(1)}s</em>.`,
      ai: { prio: 48, cond: (u, B) => !!B.mostResearched(u) },
      cast: (u, B, S, P) => {
        const t = B.mostResearched(u); if (!t) return;
        B.anim(u, 'cast', 1.12, 'rodgerCase'); Sound.play('lock'); Sound.play('ui_open', { vol: .26 });
        B.fxRodgerCaseFile(u, t);
        B.after(.48, () => {
          if (!t.alive) return;
          B.applyStatus(u, t, 'investigated', S.dur);
          B.fxStatusOn(t, 'SilenceEffect', { sizeMul: .92 });
        });
        const off = B.on(u, 'enemyCast', e => { if (e === t && t.hasStatus('investigated')) B.applyStatus(u, t, 'slow', S.slow); });
        B.after(S.dur, off);
      }
    },
    P: {
      name: 'Observant Detective', type: 'Passive',
      v: { en: 6 }, p: { chance: .10, perStack: .12, cdrOnCC: .10 },
      desc: (S, P) => `Whenever a Researched enemy begins a skill, Rodger gains ${S.en} Energy and has a chance to interrupt it - the chance grows with how much Research he has on them. Whenever an Investigated enemy is Crowd Controlled by an ally, Rodger gains Skill Haste.`,
      passive: (u, B, S, P) => {
        B.on(u, 'enemyCast', t => {
          const st = (u.research || {})[t.uid] || 0;
          if (!st) return;
          B.energy(u, S.en);
          if (chance(P.chance + P.perStack * st)) { B.interrupt(t); B.fxStatusOn(t, 'SilenceEffect', { sizeMul: .8 }); B.fxFloatObject(t.x, t.y - 100, 'Magifyingglass', '#8fb4ff'); }
        });
        B.every(u, .4, () => {
          if (B.enemiesOf(u).some(e => e.hasStatus('investigated') && e.statuses.some(s => STATUS[s.id].cc))) {
            u.flat.cdr2 = P.cdrOnCC; u.dirty = true;
          } else if (u.flat.cdr2) { u.flat.cdr2 = 0; u.dirty = true; }
        });
      }
    },
    R: {
      name: 'Complete Research', type: 'Control',
      v: {}, p: { max: 5, icd: 5, en: 25 },
      desc: (S, P) => `Whenever an enemy reaches maximum Research, Rodger immediately closes their case: they become 🎯 Exposed and lose Skill Haste and Crowd Control Resistance. For a while after, any skill they try to cast is instantly interrupted, briefly 🔇 Silenced, and drained of Energy (short cooldown per target). When an Exposed enemy falls, Rodger begins researching the enemy with the most Energy.`,
      passive: (u, B, S, P) => {
        B.every(u, .5, () => {
          B.enemiesOf(u).forEach(t => {
            if ((u.research || {})[t.uid] >= P.max && !t._rodgerClosed) {
              t._rodgerClosed = true;
              Sound.play('lock'); Sound.play('guardbreak', { vol: .35, throttle: 500 }); B.applyStatus(u, t, 'exposed', 999, { stacks: 3 });
              B.applyStatus(u, t, 'investigated', 999);
              B.fxRing(t.x, t.y - 46, 112, '#8fb4ff'); B.fxStatusOn(t, 'WeakenEffect', { sizeMul: 1.04 });
              B.fxFloatObject(t.x, t.y - 110, 'Book', '#8fb4ff');
            }
          });
        });
        B.on(u, 'enemyCast', t => {
          if (!t._rodgerClosed) return;
          if (t._rodgerIcd && B.t - t._rodgerIcd < P.icd) return;
          t._rodgerIcd = B.t;
          B.interrupt(t); B.applyStatus(u, t, 'silence', 1.15); Sound.play('guardbreak', { vol: .28, throttle: 300 }); t.energy = Math.max(0, t.energy - P.en);
          B.fxStatusOn(t, 'SilenceEffect', { sizeMul: .88 }); B.fxFloatObject(t.x, t.y - 112, 'Magifyingglass', '#8fb4ff');
        });
        B.on(u, 'enemyDown', e => {
          if (!e._rodgerClosed) return;
          const next = B.highestEnergy(B.enemiesOf(u));
          if (next) u.research[next.uid] = Math.min(4, (u.research[next.uid] || 0) + 1);
        });
      }
    }
  }
});

/* ============================================================ SOULVESTER
   Tank / Bruiser - S Tier. Max HP feeds Armor, Armor feeds Attack. */
defHero({
  id: 'Soulvester', name: 'Soulvester', folder: 'Soulvester', file: 'Soulvester', icon: 'Soulvester',
  role: 'Tank', tier: 'S', element: 'Steel',
  blurb: 'Does not need to be fast. His whole plan is staying in the fight and becoming harder to remove every second he does.',
  base: { hp: 5750, atk: 285, def: 355, mag: 130, mdef: 262, spd: 92, acc: 170, eva: 82 },
  hidden: { range: 185, aspd: .82, ms: 56, aggro: 1.9, crit: .05, critDmg: 1.45, healPow: 1, shieldPow: 1.30,
    cdr: .05, ccRes: .25, kbRes: .75, armorPen: 0, magPen: 0 },
  growth: { hp: .112, atk: .082, def: .104, mag: .050, mdef: .090 },
  move: { gait: 'trudge', bob: 3, freq: 1.1, lean: 3, squash: .03, idle: 'tap', step: 'step_metal',
    particles: 'dust', pcol: '#9aa2ad', trail: { on: false }, brake: .7, weight: 1.4 },
  basic: { name: 'Armored Slam', type: 'physical', ratio: 1.05, range: 185, sfx: 'swing_heavy', hit: 'hit_blunt', animStyle: 'soulvesterSlam',
    wind: .2, note: 'Every swing lands like a door closing.',
    onHit: (u, t, B) => B.fxSoulvesterSkill('slam', u, { target: t }) },
  skills: {
    W: {
      name: 'Knightly Armor', type: 'Defense', energy: 100,
      v: { hpToDef: .07, defToAtk: .16, dur: 5 }, p: {},
      desc: (S, P) => `<span class="sk-pas">Soulvester is immune to ranged Basic Attacks. At the start of each wave, he raises a brief guard around the team while reinforcing his own armor. A share of his Max HP is folded into Armor, and a share of that Armor into Attack.</span>
        Active: reinforces his armor, gaining Armor and Magic Defense, and takes 30% less damage for ${S.dur}s.`,
      passive: (u, B, S) => {
        u.rangedImmune = true;
        B.after(.24, () => {
          if (!u.alive) return;
          B.alliesOf(u).forEach(a => B.applyStatus(u, a, 'ward', 2.8));
          B.applyStatus(u, u, 'fortify', 3.8, { stacks: 2 });
          B.fxRing(u.x, u.y - 42, 300, '#c9d0da', .5);
          B.fxFloatIcon(u.x, u.y - 104, '🛡', '#c9d0da');
        });
        // Derived from baseStats (fixed) rather than the live, already-boosted
        // st.def/st.atk - a chain that fed off its own output would compound
        // every tick instead of settling on one stable bonus.
        B.every(u, 1, () => {
          const hpArmor = u.max.hp * S.hpToDef;
          const armorAtk = (u.baseStats.def + hpArmor) * S.defToAtk;
          u.flat.defP = hpArmor / Math.max(1, u.baseStats.def);
          u.flat.atkP = armorAtk / Math.max(1, u.baseStats.atk);
          u.dirty = true;
        });
      },
      cast: (u, B, S) => {
        B.anim(u, 'cast', .62, 'soulvesterArmor');
        Sound.play('guard', { vol: .48 });
        B.fxSoulvesterSkill('armor', u, { phase: 'cast', dur: S.dur });
        B.applyStatus(u, u, 'fortify', S.dur, { stacks: 3 });
        B.applyStatus(u, u, 'ward', S.dur);
        B.after(.28, () => { if (u.alive) B.fxSoulvesterSkill('armor', u, { phase: 'lock', dur: S.dur }); });
      }
    },
    G: {
      name: "A Knight's Duty", type: 'Defense', cd: 12,
      v: { redirect: .35, armorPer: .35 }, p: { dur: 6 },
      desc: (S, P) => `Soulvester guards the lowest-HP ally for ${P.dur}s, redirecting <em>${pcn(S.redirect * 100)}</em> of the damage they take to himself. He gains Armor from every point redirected - more the lower that ally's HP is.`,
      ai: { prio: 56, cond: (u, B) => B.alliesOf(u).some(a => a !== u && a.hpPct < .6) },
      cast: (u, B, S, P) => {
        const t = B.lowestHp(B.alliesOf(u).filter(a => a !== u)); if (!t) return;
        B.anim(u, 'cast', .58, 'soulvesterGuard');
        Sound.play('guard', { vol: .44 });
        B.fxSoulvesterSkill('guard', u, { target: t, phase: 'cast', dur: P.dur });
        // Reduce t's incoming damage before it lands (statuses can still see
        // the smaller amount) and route the removed share onto Soulvester
        // himself as a separate true-damage hit, same trick shields use to
        // move damage onto a shieldlink target.
        const off = B.on(t, 'damaged', ev => {
          if (ev.dot || ev.redirected || !u.alive) return;
          const moved = ev.amount * S.redirect;
          ev.amount -= moved;
          const bonus = moved * (1 + (1 - t.hpPct)) * .02;
          u.flat.defP2 = (u.flat.defP2 || 0) + bonus / Math.max(1, u.baseStats.def); u.dirty = true;
          B.fxSoulvesterSkill('redirect', u, { target: t, moved });
          B.after(0, () => B.damage(ev.src, u, moved, { type: 'true', redirected: true, tag: "A Knight's Duty" }));
        });
        B.after(P.dur, off);
      }
    },
    B: {
      name: 'Soul Sword', type: 'Physical Damage', cd: 10,
      v: { ratio: .7, hpRatio: .06, ghost: .35 }, p: { dur: 4 },
      desc: (S, P) => `Strikes the highest-Attack enemy for <em>${pcn(S.ratio * 100)}</em> Attack plus <em>${pcn(S.hpRatio * 100)}</em> of his Max HP, slowing their Attack Speed and Move Speed based on his Armor. For ${P.dur}s, his Basic Attacks against that enemy also deal Ghost damage based on his Magic Defense.`,
      ai: { prio: 50, cond: () => true },
      passive: (u, B, S) => {
        // registered once, not per-cast - reads u._soulTarget/_soulUntil (set
        // fresh by every cast below) so repeated casts don't stack listeners
        B.on(u, 'basicHit', ev => {
          if (!u._soulTarget || ev.target.uid !== u._soulTarget || B.t > (u._soulUntil || 0)) return;
          B.damage(u, ev.target, u.st.mdef * S.ghost, { type: 'true', tag: 'Soul Sword' });
        });
      },
      cast: (u, B, S, P) => {
        const t = B.highestStat(B.enemiesOf(u), 'atk'); if (!t) return;
        B.anim(u, 'wind', .55, 'soulvesterSword');
        Sound.play('swing_heavy', { vol: .44 });
        B.fxSoulvesterSkill('sword', u, { target: t, phase: 'cast' });
        B.after(.22, () => {
          Sound.play('hit_heavy', { vol: .52 }); B.hitstop(80); B.shake(8, .2);
          B.fxSlash(u, t, { col: '#c9d0da', ang: -15, big: true });
          B.damage(u, t, u.st.atk * S.ratio + u.max.hp * S.hpRatio, { type: 'physical', tag: 'Soul Sword' });
          B.applyStatus(u, t, 'slow', 4, { stacks: Math.min(3, Math.round(u.st.def / 150)) });
          u._soulTarget = t.uid; u._soulUntil = B.t + P.dur;
          B.fxSoulvesterSkill('sword', u, { target: t, phase: 'impact' });
        });
      }
    },
    P: {
      name: 'Unshaken', type: 'Passive',
      v: { atk: .12, def: .10, mdef: .10, aspd: .12, dr: .10 }, p: { thresholds: [.75, .5, .25] },
      desc: (S, P) => `Whenever Soulvester crosses ${P.thresholds.map(t => pc(t)).join(' / ')} Max HP, he gains a permanent combat bonus for the rest of the battle - Attack, then Armor and Magic Defense, then Attack Speed and Damage Reduction. Each threshold triggers once.`,
      passive: (u, B, S, P) => {
        u._unshaken = P.thresholds.slice();
        B.on(u, 'damaged', () => {
          if (!u._unshaken.length || !u.alive) return;
          if (u.hpPct > u._unshaken[0]) return;
          const idx = P.thresholds.length - u._unshaken.length;
          u._unshaken.shift();
          Sound.play('guard', { vol: .38 }); B.fxSoulvesterSkill('unshaken', u, { index: idx });
          if (idx === 0) u.flat.atkP2 = S.atk;
          else if (idx === 1) { u.flat.defP3 = S.def; u.flat.mdefP2 = S.mdef; }
          else { u.flat.aspdP = S.aspd; u.flat.dmgTaken3 = -S.dr; }
          u.dirty = true;
        });
      }
    },
    R: {
      name: "Soulvester's Resolve", type: 'Survival',
      v: { heal: .18, atk: .16, def: .16, mdef: .16 }, p: { thr: .20, dur: 6 },
      desc: (S, P) => `When Soulvester drops below ${pc(P.thr)} Max HP, he immediately heals a share of his Max HP and gains a burst of Attack, Armor and Magic Defense for ${P.dur}s - stronger the more HP he was missing. Once per battle.`,
      passive: (u, B, S, P) => {
        B.on(u, 'damaged', () => {
          if (u._resolveUsed || u.hpPct > P.thr || !u.alive) return;
          u._resolveUsed = true;
          const missing = 1 - u.hpPct;
          B.anim(u, 'cast', .78, 'soulvesterResolve');
          Sound.play('guard', { vol: .5 }); B.shake(10, .3); B.flash('#c9d0da', .25, .35);
          B.fxSoulvesterSkill('resolve', u, { phase: 'cast', missing });
          B.heal(u, u, u.max.hp * S.heal * (1 + missing), { tag: "Soulvester's Resolve" });
          u.flat.atkP4 = S.atk * (1 + missing); u.flat.defP4 = S.def * (1 + missing); u.flat.mdefP3 = S.mdef * (1 + missing);
          u.dirty = true;
          B.after(.28, () => { if (u.alive) B.fxSoulvesterSkill('resolve', u, { phase: 'impact', missing }); });
          B.after(P.dur, () => { u.flat.atkP4 = 0; u.flat.defP4 = 0; u.flat.mdefP3 = 0; u.dirty = true; });
        });
      }
    }
  }
});

/* ============================================================ GOURDY
   Control / Support - B Tier. Gives you something random; every result matters. */
const GOURDY_TREATS = [
  { name: 'Attack', icon: '⚔', status: 'atkup' },
  { name: 'Speed', icon: '🏃', status: 'speedup' },
  { name: 'Defense', icon: '🧱', status: 'fortify' },
  { name: 'Magic Defense', icon: '🔰', status: 'mdefup' },
  { name: 'Critical Chance', icon: '🎯', status: 'lucky' },
  { name: 'Mana Regen', icon: '💨', status: 'overcharge' }
];
const GOURDY_TRICKS = [
  { name: 'Attack', icon: '🥀', status: 'attackdown' },
  { name: 'Attack Speed', icon: '🫳', status: 'armslow' },
  { name: 'Movement Speed', icon: '🐢', status: 'slow' },
  { name: 'Defense', icon: '💔', status: 'defdown' },
  { name: 'Resist', icon: '🪫', status: 'magdown' },
  { name: 'Mana', icon: '🕳', status: 'drain' }
];
defHero({
  id: 'Gourdy', name: 'Gourdy', folder: 'Gourdy', file: 'Gourdy', icon: 'Gourdy',
  role: 'Support', tier: 'B', element: 'Pumpkin',
  blurb: "Gives you something random. You don't control what you get, but every result is useful.",
  base: { hp: 3350, atk: 108, def: 195, mag: 195, mdef: 232, spd: 98, acc: 172, eva: 118 },
  hidden: { range: 255, aspd: .82, ms: 64, aggro: .55, crit: .05, critDmg: 1.4, healPow: 1.1, shieldPow: 1.1,
    cdr: .10, ccRes: .18, kbRes: .3, armorPen: 0, magPen: .05 },
  growth: { hp: .084, atk: .052, def: .080, mag: .062, mdef: .086 },
  move: { gait: 'bounce', bob: 9, freq: 1.8, lean: 5, squash: .08, idle: 'shake', step: 'bounce',
    particles: 'confetti', pcol: '#ff9d4d', trail: { on: false }, brake: .3 },
  basic: { name: 'Pumpkin Pat', type: 'magic', ratio: .45, range: 255, proj: 'orb', pcol: '#ff9d4d',
    sfx: 'whoosh', hit: 'hit_light', wind: .2, note: "Barely a scratch - he's not really here to fight.",
    onHit: (u, t, B) => { if (chance(.14)) B.gourdyTrick(u, t, 1); } },
  skills: {
    W: {
      name: 'Trick or Treat', type: 'Support', energy: 100,
      v: {}, p: { radius: 320, duration: 8 },
      desc: (S, P) => `<span class="sk-pas">Basic Attacks have a small chance to give the target a random Trick.</span>
        Active: every ally in range gets a random Treat buff for <em>${P.duration}s</em>, boosting one of their stats.`,
      passive: () => {},
      cast: (u, B, S, P) => {
        B.anim(u, 'cast', .72, 'gourdyTreat'); Sound.play('get_item'); B.fxGourdyTreatCast(u);
        const allies = B.alliesOf(u).filter(a => B.distance(a, u) < P.radius);
        B.after(.18, () => { B.fxConfetti(u.x, u.y - 60, 20); allies.forEach(a => B.gourdyTreat(u, a, P.duration / 8)); });
      }
    },
    G: {
      name: 'Sugar Rush', type: 'Buff',
      v: {}, p: { rushDur: 6 },
      desc: (S, P) => `At the start of combat, gives the whole team 🏃 Speed Up for <em>${P.rushDur}s</em>. Whenever the team gains a Treat, everyone gets a smaller version. Reaching full Mana refreshes it.`,
      passive: (u, B, S, P) => {
        const rush = (dur, smaller) => {
          if (smaller && B.t < (u._gourdyRushAt || 0) + .25) return;
          u._gourdyRushAt = B.t; const allies = B.alliesOf(u);
          B.anim(u, 'cast', smaller ? .42 : .68, 'gourdyRush');
          B.fxGourdyRush(u, allies, smaller);
          allies.forEach(a => B.applyStatus(u, a, 'speedup', dur));
        };
        B.after(.2, () => rush(P.rushDur, false));
        B.on(u, 'gourdyTreat', () => rush(2.5, true));
        B.on(u, 'cast', ev => { if (ev.key === 'W') rush(P.rushDur, false); });
        B.every(u, .25, () => {
          const full = u.energy >= u.energyMax;
          if (full && !u._gourdyFullMana) rush(P.rushDur, false);
          u._gourdyFullMana = full;
        });
      }
    },
    B: {
      name: 'Pumpkin Toss', type: 'Control', cd: 7,
      v: { ratio: .25 }, p: {},
      desc: (S) => `Throws a pumpkin at an enemy for a token <em>${pcn(S.ratio * 100)}</em> Magic, applying a random Control effect (Stun, Silence, Slow or Mana Drain). It prioritizes enemies holding a 🤝 Hug Line and breaks the link on impact. Enemies with more Attack or Magic Attack than Gourdy risk a second effect landing too.`,
      ai: { prio: 46, cond: (u, B) => B.enemiesOf(u).length > 0 },
      cast: (u, B, S) => {
        const foes = B.enemiesOf(u);
        const linked = foes.filter(e => e.hasStatus('hugline'));
        const t = pick(linked.length ? linked : foes); if (!t) return;
        B.anim(u, 'wind', .82, 'gourdyToss'); Sound.play('beam_charge', { vol: .22, throttle: 260 });
        B.after(.24, () => {
          if (!u.alive || !t.alive) return;
          B.anim(u, 'attack', .24, 'gourdyTossRelease'); Sound.play('throwsomething', { vol: .55 });
          B.fxArc(u, t, { kind: 'food', img: 'Pumpkin', size: 34 }, () => {
            B.damage(u, t, u.st.mag * S.ratio, { type: 'magic', tag: 'Pumpkin Toss' });
            const pool = ['stun', 'silence', 'slow', 'drain'];
            const effect = pick(pool);
            B.fxGourdyPumpkinImpact(t, effect); Sound.play('pop2', { vol: .65 });
            B.applyStatus(u, t, effect, effect === 'stun' ? 2 : 3);
            const hug = t.getStatus('hugline');
            if (hug) {
              const goob = hug.src;
              const line = goob && (goob.goobLines || []).find(item => item.target === t);
              if (line && typeof goobEndLine === 'function') goobEndLine(goob, line, B, false);
              else B.removeStatus(t, 'hugline');
              B.fxFloatIcon(t.x, t.y - 100, '🎃', '#ff9d4d');
            }
            if (Math.max(t.st.atk, t.st.mag) > u.st.mag && chance(.5)) {
              B.applyStatus(u, t, pick(pool), 2.5);
            }
          });
        });
      }
    },
    P: {
      name: "Trickster's Fortune", type: 'Passive',
      v: { base: .20, perCdr: .30 }, p: {},
      desc: (S) => `Whenever a Trick or Treat is applied, there's a chance (higher with more Mana Regen) for a second one to land as well - a different Treat for allies, another Trick for enemies.`,
      passive: (u, B, S) => { u._gourdyLucky = S; }
    },
    R: {
      name: "Halloween's Luck", type: 'Battle Opener',
      v: {}, p: { thr: .5, trickDur: 4 },
      desc: (S, P) => `Trick or Treat now rolls three Treats per ally and grants the best one for their current stats; the two leftovers become Tricks on nearby enemies for ${P.trickDur}s. Allies below ${pc(P.thr)} HP are prioritized for defensive Treats.`,
      passive: (u, B, S, P) => {
        // Keep Trickster's Fortune active at Red instead of replacing it.
        // The red flag is deliberately separate: Purple grants bonus rolls;
        // only Red changes W into the three-Treat conversion.
        u._gourdyLuck = Object.assign({}, u._gourdyLucky || {}, P, {
          trickDur: P.trickDur,
          red: true
        });
      }
    }
  }
});

/* ============================================================ ECLIPSE
   DPS - S Tier. Hunts whatever's already wounded, and gets worse to fight the longer it lasts. */
defHero({
  id: 'Eclipse', name: 'Eclipse', folder: 'Eclipse', file: 'Eclipse', icon: 'Eclipse',
  role: 'Damage', tier: 'S', element: 'Moon',
  blurb: 'Calm until something is wounded. Then she is not calm at all.',
  base: { hp: 4050, atk: 485, def: 238, mag: 130, mdef: 210, spd: 142, acc: 220, eva: 170 },
  hidden: { range: 180, aspd: 1.10, ms: 96, aggro: 1.05, crit: .18, critDmg: 1.7, healPow: 1, shieldPow: 1,
    cdr: .11, ccRes: .20, kbRes: .36, armorPen: .18, magPen: 0 },
  growth: { hp: .088, atk: .112, def: .080, mag: .050, mdef: .074 },
  move: { gait: 'skitter', bob: 5, freq: 2.8, lean: 8, squash: .06, idle: 'jitter', step: 'step_soft',
    particles: 'dust', pcol: '#8a6bff', trail: { on: true, col: '#8a6bff', rate: .08 }, brake: .5, jitter: 1.6 },
  basic: { name: 'Claw Rake', type: 'physical', ratio: 1.02, range: 180, sfx: 'swing_light', hit: 'hit_slash',
    wind: .12, animStyle: 'eclipseRake', note: 'Faster and meaner once something is already hurt.',
    onHit: (u, t, B) => {
      u._eclipseRendAt = u._eclipseRendAt || {};
      if (B.t >= (u._eclipseRendAt[t.uid] || 0)) {
        u._eclipseRendAt[t.uid] = B.t + 5;
        B.crackShield(u, t, .12, { color: '#8a6bff' });
        B.dispel(t, 1);
        B.applyStatus(u, t, 'grief', 3.5);
      }
      const low = t.hpPct < (u._eclipseThr || .3);
      if (low) {
        u.focus = t.uid; u.eclipseFocusTarget = t;
        B.applyStatus(u, t, 'marked', 6.5);
        B.applyStatus(u, t, 'exposed', 4.5);
        B.fxFloatIcon(t.x, t.y - 90, '🌘');
      }
      if (u.hasStatus('blackout')) {
        u._eclipseBlackoutHits = (u._eclipseBlackoutHits || 0) + 1;
        B.applyStatus(u, t, 'bleed', 4.5, { stacks: 1, val: u.st.atk * .065 });
        if (u._eclipseBlackoutHits % 2 !== 0) return;
        B.after(.08, () => { if (t.alive) { Sound.play('hit_slash', { vol: .4 });
          B.damage(u, t, u.st.atk * .42, { type: 'physical', tag: 'Blackout Claw' });
          B.applyStatus(u, t, 'bleed', 4.5, { stacks: 1, val: u.st.atk * .065 }); } });
      }
    } },
  skills: {
    W: {
      name: 'Moonlit Hunt', type: 'Physical Damage', energy: 100,
      v: { ratio: .64, dmgBonus: .34 }, p: { thr: .34, hits: 5, dur: 5 },
      desc: (S, P) => `<span class="sk-pas">Eclipse deals <em>${pcn(S.dmgBonus * 100)}</em> more non-Damage-over-Time damage to enemies below ${pc(P.thr)} HP. Her Basic Attacks Mark and Focus prey below that threshold, making her ordinary attacks prioritize it. When Focused prey is KO'd, Focus immediately shifts to the enemy with the lowest HP.</span>
        Active: Eclipse lunges to the lowest-HP enemy, striking ${P.hits} times for <em>${pcn(S.ratio * 100)}</em> Attack each. Each successive strike grows stronger, applies Rend, and can retarget a new low-HP enemy if the original prey falls. She then returns to her exact starting position, gains 3 stacks of Attack Speed and Move Speed plus Haste for ${P.dur}s, and enters 🌑 Blackout.
        <span class="sk-pas">Blackout: Basic Attacks deal additional Physical Damage, apply Rend, and every second claw strike creates an extra claw hit.</span>`,
      passive: (u, B, S, P) => {
        u._eclipseThr = P.thr;
        B.on(u, 'dealDamage', ev => { if (!ev.dot && ev.target.hpPct < P.thr) ev.amount *= 1 + S.dmgBonus; });
        B.on(u, 'enemyDown', e => {
          if (u.focus === (e && e.uid)) {
            const next = B.lowestHp(B.enemiesOf(u));
            u.focus = next ? next.uid : null; u.eclipseFocusTarget = next || null;
          }
        });
      },
      cast: (u, B, S, P) => {
        const t = B.lowestHp(B.enemiesOf(u)); if (!t) return;
        const start = u.x;
        const startDepth = u.depth;
        u.face = t.x >= u.x ? 1 : -1;
        u.focus = t.uid; u.eclipseFocusTarget = t; B.applyStatus(u, t, 'marked', P.dur + 2);
        B.anim(u, 'cast', .48, 'eclipseHunt'); Sound.play('spectral', { vol: .28 }); Sound.play('dash');
        B.fxEclipseSkill('hunt', u, { target: t }); B.blink(u, t.x - u.face * 40, t.depth);
        B.repeat(P.hits, .1, i => {
          const victim = t.alive ? t : B.lowestHp(B.enemiesOf(u));
          if (!victim) return;
          u.face = victim.x >= u.x ? 1 : -1;
          Sound.play('hit_slash', { vol: .5, throttle: 10 }); B.fxEclipseSkill('rake', u, { target: victim, index: i });
          B.damage(u, victim, u.st.atk * S.ratio * (1 + i * .08), { type: 'physical', tag: 'Moonlit Hunt' });
          B.applyStatus(u, victim, 'bleed', 4.5, { stacks: 1, val: u.st.atk * .06 });
          if (victim.hpPct < P.thr) B.applyStatus(u, victim, 'marked', P.dur + 2);
        });
        B.after(P.hits * .1 + .05, () => {
          u.x = start; u.depth = startDepth; u.moving = false;
          B.fxEclipseSkill('return', u); B.applyStatus(u, u, 'speedup', P.dur, { stacks: 3 });
          B.applyStatus(u, u, 'haste', P.dur, { stacks: 1 });
          B.applyStatus(u, u, 'blackout', P.dur); Sound.play('beam_charge', { vol: .26 });
        });
      }
    },
    G: {
      name: 'Moon Rush', type: 'Physical Damage', cd: 9,
      v: { ratio: .52, leap: .78, kb: 78 }, p: { dur: 4 },
      desc: (S, P) => `Charges toward the lowest-HP enemy, hitting every enemy in her path for <em>${pcn(S.ratio * 100)}</em> Attack and applying Rend. She then leaps onto her target for <em>${pcn(S.leap * 100)}</em> more, Marks them, and Knocks them Back. Eclipse gains 2 stacks of Attack Speed and Move Speed plus Haste for ${P.dur}s. During 🌑 Blackout, the charge deals 45% more damage, applies extra Rend and Expose to enemies it catches, and the leap applies Defense Down.`,
      ai: { prio: 54, cond: () => true },
      cast: (u, B, S, P) => {
        const t = B.lowestHp(B.enemiesOf(u)); if (!t) return;
        const dark = u.hasStatus('blackout');
        u.face = t.x >= u.x ? 1 : -1;
        B.anim(u, 'cast', .45, 'eclipseRush'); Sound.play('dash'); B.fxEclipseSkill('rush', u, { target: t });
        const hit = new Set();
        B.dash(u, t.x - u.face * 40, .3, { depth: t.depth, onMove: () => B.enemiesOf(u).forEach(e => {
          if (hit.has(e) || B.distance(e, u) > 50) return; hit.add(e);
          Sound.play('hit_light', { vol: .5, throttle: 12 });
          B.damage(u, e, u.st.atk * S.ratio * (dark ? 1.45 : 1), { type: 'physical', tag: 'Moon Rush' });
          B.applyStatus(u, e, 'bleed', 4, { stacks: dark ? 2 : 1, val: u.st.atk * .05 });
          if (dark) B.applyStatus(u, e, 'exposed', 3.5);
        }) });
        B.after(.32, () => {
          if (!t.alive) return;
          Sound.play('hit_heavy'); B.fxEclipseSkill('pounce', u, { target: t });
          B.damage(u, t, u.st.atk * S.leap * (dark ? 1.35 : 1), { type: 'physical', tag: 'Moon Rush' });
          B.knockback(u, t, S.kb);
          B.applyStatus(u, t, 'marked', 5.5);
          if (dark) B.applyStatus(u, t, 'defdown', 4, { stacks: 2 });
        });
        B.applyStatus(u, u, 'speedup', P.dur, { stacks: 2 }); B.applyStatus(u, u, 'haste', P.dur, { stacks: 1 });
      }
    },
    B: {
      name: 'Savage Swipe', type: 'Physical Damage', cd: 6,
      v: { ratio: .46, finisher: .78 }, p: { bleed: 4.5 },
      desc: (S) => `Rapidly slashes the closest enemy three times for <em>${pcn(S.ratio * 100)}</em> Attack each. Every hit applies Rend; the final strike deals <em>${pcn(S.finisher * 100)}</em> more and applies Defense Down. During 🌑 Blackout, the final strike also damages nearby enemies, Rends them, and Slows them.`,
      ai: { prio: 50, cond: () => true },
      cast: (u, B, S) => {
        const t = B.nearest(u, B.enemiesOf(u)); if (!t) return;
        const dark = u.hasStatus('blackout');
        B.anim(u, 'cast', .42, 'eclipseSwipe'); Sound.play('sweep', { vol: .4 });
        B.repeat(3, .1, i => {
          if (!t.alive) return;
          Sound.play('hit_slash', { vol: .45, throttle: 8 }); B.fxEclipseSkill('swipe', u, { target: t, index: i });
          const last = i === 2;
          B.damage(u, t, u.st.atk * S.ratio * (last ? 1 + S.finisher : 1), { type: 'physical', tag: 'Savage Swipe' });
          B.applyStatus(u, t, 'bleed', P.bleed, { stacks: last ? 2 : 1, val: u.st.atk * .055 });
          if (last) B.applyStatus(u, t, 'defdown', 4.5, { stacks: 1 });
          if (last && dark) B.enemiesOf(u).forEach(e => { if (e !== t && B.distance(e, u) < 170) {
            B.damage(u, e, u.st.atk * S.ratio * 1.12, { type: 'physical', tag: 'Savage Swipe' });
            B.applyStatus(u, e, 'bleed', P.bleed, { stacks: 1, val: u.st.atk * .045 });
            B.applyStatus(u, e, 'slow', 1.8);
          } });
        });
      }
    },
    P: {
      name: "Predator's Instinct", type: 'Passive',
      v: { dmg: .24 }, p: { en: 35, dur: 5 },
      desc: (S, P) => `Deals <em>${pcn(S.dmg * 100)}</em> more damage to enemies below the Moonlit Hunt threshold, Marks them, and keeps Eclipse Focused on them; her attacks cannot be evaded by her Focused prey. Every 5s per target, her Basic Attacks also crack 12% of an active Shield, strip one removable buff, and apply 🥺 Grief for 3.5s. When an enemy phases out and returns, Eclipse strikes them once. Whenever Eclipse personally KOs an enemy, she gains ${P.en} Energy, 2 stacks of Attack Speed, Haste, and partial cooldown recovery for her other skills.`,
      passive: (u, B, S, P) => {
        u.antiDodge = target => !!(target && target === u.eclipseFocusTarget);
        u._eclipsePhaseAt = u._eclipsePhaseAt || {};
        B.on(u, 'statusExpired', ev => {
          const t = ev.unit;
          if (!t || t.team === u.team || !['untargetable', 'stealth'].includes(ev.id) || !t.alive || B.t < (u._eclipsePhaseAt[t.uid] || 0)) return;
          u._eclipsePhaseAt[t.uid] = B.t + 4;
          B.damage(u, t, u.st.atk * .62, { type: 'physical', tag: 'Predator’s Return' });
          B.applyStatus(u, t, 'grief', 3.5);
          B.fxEclipseSkill('rake', u, { target: t });
        });
        B.on(u, 'dealDamage', ev => {
          if (ev.dot || !ev.target || ev.target.hpPct >= (u._eclipseThr || .3)) return;
          ev.amount *= 1 + S.dmg;
          u.focus = ev.target.uid; u.eclipseFocusTarget = ev.target;
          B.applyStatus(u, ev.target, 'marked', P.dur + 1);
        });
        B.on(u, 'enemyDown', e => {
          if (!e || e._lastHitBy !== u) return;
          B.energy(u, P.en); B.applyStatus(u, u, 'speedup', P.dur, { stacks: 2 });
          B.applyStatus(u, u, 'haste', P.dur, { stacks: 1 }); B.reduceCd(u, 1.8);
        });
      }
    },
    R: {
      name: 'Total Eclipse', type: 'Transformation',
      v: { atk: .30, aspd: .24, ms: .24, hp: .26, cleave: .55, crit: .12 }, p: { extend: 3, en: 25 },
      desc: (S, P) => `At the start of 🌑 Blackout, Eclipse transforms into her werewolf form. She gains <em>${pcn(S.atk * 100)}</em> Attack, <em>${pcn(S.aspd * 100)}</em> Attack Speed, <em>${pcn(S.ms * 100)}</em> Movement Speed, <em>${pcn(S.hp * 100)}</em> Max HP, and <em>${pcn(S.crit * 100)}</em> Critical Chance. Her Basic Attacks gain <em>${pcn(S.cleave * 100)}</em> Physical damage, hit nearby enemies, and spread Rend. Eclipse cannot have her Movement Speed reduced during Blackout. Whenever she personally KOs an enemy during Blackout, she restores ${P.en} Energy, gains a burst of Speed, and extends the transformation by ${P.extend}s. When Blackout ends, she returns to normal form.`,
      passive: (u, B, S, P) => {
        // statusApplied/statusExpired broadcast to every listener regardless of
        // whose status it is (see Battle.emitAll) - filter to Eclipse's own.
        B.on(u, 'statusApplied', ev => {
          if (ev.unit !== u || ev.id !== 'blackout' || u._eclipseForm) return;
          u._eclipseForm = true;
          B.anim(u, 'cast', .62, 'eclipseBlackout');
          Sound.play('grow', { vol: .34 }); Sound.play('beam_charge', { vol: .3 }); B.fxEclipseSkill('blackout', u, { dur: 2.5 }); B.shake(4, .16);
          u.flat.atkP3 = S.atk; u.flat.aspdP2 = S.aspd; u.flat.msP2 = S.ms; u.flat.hpP2 = S.hp; u.flat.crit2 = S.crit;
          B.applyStatus(u, u, 'eclipsefooting', 999);
          u.dirty = true;
          if (u.imgEl) { const src = u.artSrc || Art.unit(u.id, u.twisted); u.imgEl.src = src.replace('Eclipse.png', 'Eclipse_TRANSFORM.png'); }
        });
        B.on(u, 'basicHit', ev => {
          if (!u._eclipseForm) return;
          B.enemiesOf(u).forEach(e => { if (e !== ev.target && B.distance(e, u) < 175) {
            B.damage(u, e, u.st.atk * S.cleave, { type: 'physical', tag: 'Total Eclipse' });
            B.applyStatus(u, e, 'bleed', 4.5, { stacks: 1, val: u.st.atk * .055 });
          } });
        });
        B.on(u, 'enemyDown', e => {
          if (!u._eclipseForm || !e || e._lastHitBy !== u) return;
          B.energy(u, P.en);
          const s = u.statuses.find(st => st.id === 'blackout'); if (s) s.t += P.extend;
          B.applyStatus(u, u, 'speedup', 3.5, { stacks: 2 });
          B.fxFloatIcon(u.x, u.y - 105, '🌑', '#8a6bff');
        });
        B.on(u, 'statusExpired', ev => {
          if (ev.unit !== u || ev.id !== 'blackout' || !u._eclipseForm) return;
          u._eclipseForm = false;
          B.fxEclipseSkill('return', u); Sound.play('spectral', { vol: .18 });
          B.removeStatus(u, 'eclipsefooting');
          u.flat.atkP3 = 0; u.flat.aspdP2 = 0; u.flat.msP2 = 0; u.flat.hpP2 = 0; u.flat.crit2 = 0; u._eclipseBlackoutHits = 0; u.dirty = true;
          if (u.imgEl) u.imgEl.src = u.artSrc || Art.unit(u.id, u.twisted);
        });
      }
    }
  }
});

/* ============================================================ SPROUT
   Healer / Support - SS Tier. Emergency healer who watches his allies' HP
   at all times and intervenes the moment anyone needs help. Baking is how
   he helps. Every heal is a freshly made treat. */
defHero({
  id: 'Sprout', name: 'Sprout', folder: 'Sprout', file: 'Sprout', icon: 'Sprout',
  role: 'Support', tier: 'SS', element: 'Craft',
  blurb: 'Overprotective to a fault. Sprout is always watching, and he will not let anyone go down without doing everything he can.',
  base: { hp: 3500, atk: 108, def: 220, mag: 335, mdef: 290, spd: 116, acc: 160, eva: 122 },
  hidden: { range: 250, aspd: .82, ms: 76, aggro: .35, crit: .04, critDmg: 1.30,
    healPow: 1.55, shieldPow: 1.10, cdr: .10, ccRes: .15, kbRes: .25, armorPen: 0, magPen: 0 },
  growth: { hp: .085, atk: .044, def: .082, mag: .096, mdef: .091 },
  move: { gait: 'walk', bob: 3.5, freq: 1.2, lean: 2, squash: .02, idle: 'look', step: 'step',
    particles: 'none', pcol: '#f4a261', trail: { on: false }, brake: .35 },
  basic: { name: 'Baked Sweets', type: 'magic', ratio: .28, range: 250, proj: 'orb', pcol: '#f4a261',
    sfx: 'throwsomething', hit: 'hit_magic', wind: .15 },
  skills: {
    W: {
      name: 'Baked Sweets', type: 'Healing', energy: 100,
      v: { heal: .46, healLow: .68, lowThreshold: .40 },
      p: { triageThreshold: .70, triageHeal: .14, triageLowBonus: .08 },
      desc: (S, P) => `<span class="sk-pas">Sprout always knows his allies' HP. When any ally drops below ${pc(P.triageThreshold)} HP, his next Basic Attack instead rushes a treat to that ally, healing them for ${pc(P.triageHeal)} of their Max HP (${pc(P.triageHeal + P.triageLowBonus)} if below 50%).</span>
        <b>Active:</b> Sprout immediately gives the lowest-HP ally a freshly made treat, healing for ${pc(S.heal)} of their Max HP. Increased to ${pc(S.healLow)} if they are below ${pc(S.lowThreshold)} HP.`,
      cast: (u, B, S) => {
        const ally = B.alliesOf(u).sort((a, b) => a.hpPct - b.hpPct)[0];
        if (!ally) return;
        B.anim(u, 'cast', .4);
        const ratio = ally.hpPct < S.lowThreshold ? S.healLow : S.heal;
        B.fxSproutSkill('bake', u, ally);
        B.heal(u, ally, ally.max.hp * ratio, { tag: 'Baked Sweets' });
        B.fxFloatIcon(ally.x, ally.y - 90, '🍰');
        B.fxSparkle(ally.x, ally.y - 50, 8, '#f4a261');
        if (u._tryHpBoost) u._tryHpBoost(ally);
        Sound.play('heal');
      },
      passive: (u, B, S, P) => {
        u._triageReady = false;
        B.every(u, .3, () => {
          if (!u._triageReady) {
            const inNeed = B.alliesOf(u).some(a => a !== u && a.hpPct < P.triageThreshold);
            if (inNeed) u._triageReady = true;
          }
        });
        B.on(u, 'basicHit', () => {
          if (!u._triageReady) return;
          const ally = B.alliesOf(u).filter(a => a !== u && a.hpPct < P.triageThreshold)
            .sort((a, b) => a.hpPct - b.hpPct)[0];
          if (!ally) { u._triageReady = false; return; }
          const bonus = ally.hpPct < .50 ? P.triageLowBonus : 0;
          B.heal(u, ally, ally.max.hp * (P.triageHeal + bonus), { silent: true, tag: 'triage' });
          B.fxSproutSkill('delivery', u, ally);
          B.fxFloatIcon(ally.x, ally.y - 80, '🍞');
          if (u._tryHpBoost) u._tryHpBoost(ally);
          u._triageReady = false;
        });
      }
    },
    G: {
      name: 'Stay Close', type: 'Healing / Buff', cd: 10,
      v: { regenVal: .028, regenDur: 5, fortStacks: 2, speedPct: .40, buffDur: 5, selfSpeedDur: 3 },
      desc: (S, P) => `Sprout rushes to the most injured ally, healing them over ${S.regenDur}s (${pc(S.regenVal)}/s of Max HP), granting ${S.fortStacks} stacks of 🧱 Fortify and ${pc(S.speedPct)} Move Speed for ${S.buffDur}s.
        Sprout also gains ${pc(S.speedPct)} Move Speed for ${S.selfSpeedDur}s to quickly reach the next ally in need.`,
      cast: (u, B, S) => {
        const ally = B.alliesOf(u).sort((a, b) => a.hpPct - b.hpPct)[0];
        if (!ally) return;
        B.anim(u, 'wind', .3); B.fxSproutSkill('rush', u, ally); Sound.play('dash');
        B.fxArc(u, ally, { col: '#f4a261', size: 9, speed: 520 }, () => {
          if (!ally.alive) return;
          B.applyStatus(u, ally, 'regen', S.regenDur, { val: ally.max.hp * S.regenVal });
          B.applyStatus(u, ally, 'fortify', S.buffDur, { stacks: S.fortStacks });
          B.applyStatus(u, ally, 'speedup', S.buffDur);
          B.fxFloatIcon(ally.x, ally.y - 95, '🧁');
          B.fxSparkle(ally.x, ally.y - 40, 6, '#f4a261');
          if (u._tryHpBoost) u._tryHpBoost(ally);
        });
        B.applyStatus(u, u, 'speedup', S.selfSpeedDur);
        Sound.play('heal');
      }
    },
    B: {
      name: 'Fresh Out of the Oven', type: 'Healing', cd: 12,
      v: { heal: .36, bonusHeal: .22, healRecvBuff: .28, buffDur: 6, threshold: .35 },
      desc: (S, P) => `Distributes fresh treats to the <b>2 allies missing the most HP</b>, healing each for ${pc(S.heal)} of their Max HP and granting ${pc(S.healRecvBuff)} increased Healing Received for ${S.buffDur}s.
        Each ally below ${pc(S.threshold)} HP receives an additional ${pc(S.bonusHeal)} heal.`,
      cast: (u, B, S) => {
        B.anim(u, 'cast', .4);
        Sound.play('heal');
        const targets = B.alliesOf(u)
          .sort((a, b) => (b.max.hp - b.hp) - (a.max.hp - a.hp))
          .slice(0, 2);
        B.fxSproutSkill('oven', u, null, targets);
        targets.forEach((a, i) => {
          B.after(i * .20, () => {
            if (!a.alive) return;
            B.heal(u, a, a.max.hp * S.heal, { tag: 'Fresh Out of the Oven' });
            // Temporary healing-received boost via flat modifier
            a.flat.healRecv = (a.flat.healRecv || 0) + S.healRecvBuff; a.dirty = true;
            B.after(S.buffDur, () => { a.flat.healRecv = (a.flat.healRecv || 0) - S.healRecvBuff; a.dirty = true; });
            B.fxFloatIcon(a.x, a.y - 90, '🍩');
            if (u._tryHpBoost) u._tryHpBoost(a);
            if (a.hpPct < S.threshold) {
              B.after(.35, () => {
                if (!a.alive) return;
                B.heal(u, a, a.max.hp * S.bonusHeal, { tag: 'Fresh Out of the Oven (bonus)' });
                B.fxFloatIcon(a.x, a.y - 110, '✨');
                if (u._tryHpBoost) u._tryHpBoost(a);
              });
            }
          });
        });
      }
    },
    P: {
      name: 'Overprotective', type: 'Healing / Max HP',
      v: { woundedThreshold: .60, healPowPerAlly: .14, hpBonus: .03, maxBoosts: 3, energyOnLethal: 35 },
      desc: (S, P) => `<span class="sk-pas">At the start of each wave, Sprout gives the whole team a small Fresh Batch heal and temporary increased Healing Received. He also gains +${pc(S.healPowPerAlly)} Heal Power for each ally below ${pc(S.woundedThreshold)} HP (up to 4 allies). Whenever Sprout heals an ally, they permanently gain +${pc(S.hpBonus)} Max HP for this wave (max ${S.maxBoosts}× per ally). If any ally is about to be KO'd, Sprout instantly gains ${S.energyOnLethal} Energy.</span>`,
      passive: (u, B, S) => {
        u._hpBoosts = {};
        u._tryHpBoost = (ally) => {
          const count = u._hpBoosts[ally.id] || 0;
          if (count >= S.maxBoosts) return;
          ally.flat.hpP = (ally.flat.hpP || 0) + S.hpBonus;
          ally.dirty = true;
          u._hpBoosts[ally.id] = count + 1;
        };
        B.after(.24, () => {
          if (!u.alive) return;
          B.alliesOf(u).forEach(a => {
            B.heal(u, a, a.max.hp * .06, { tag: 'Fresh Batch' });
            B.applyStatus(u, a, 'receptive', 5, { val: .14 });
            B.fxFloatIcon(a.x, a.y - 86, '🍞', '#f4a261');
          });
          B.fxRing(u.x, u.y - 42, 280, '#f4a261', .42);
        });
        B.every(u, .5, () => {
          const wounded = Math.min(B.alliesOf(u).filter(a => a !== u && a.hpPct < S.woundedThreshold).length, 4);
          u.flat.healPowP2 = wounded * S.healPowPerAlly;
          u.dirty = true;
        });
        B.on(u, 'allyLethal', ev => {
          if (!ev.unit || ev.unit === u) return;
          B.energy(u, S.energyOnLethal);
          B.fxFloatIcon(u.x, u.y - 80, '💛');
        });
      }
    },
    R: {
      name: "I've Got You", type: 'Healing / Max HP',
      v: { reviveHp: .35, fortStacks: 3, fortDur: 6, otherHeal: .25, maxUses: 2, healPowGain: .20 },
      desc: (S, P) => `When an ally would be KO'd, Sprout immediately intervenes. The KO is prevented, they recover ${pc(S.reviveHp)} Max HP, and gain ${S.fortStacks} stacks of 🧱 Fortify for ${S.fortDur}s. All other allies are healed for ${pc(S.otherHeal)} Max HP.
        Can only trigger ${S.maxUses}× per wave and never twice for the same ally. Each save increases Sprout's Heal Power by ${pc(S.healPowGain)} for this wave.`,
      passive: (u, B, S) => {
        u._igySaves = 0;
        u._igySaved = new Set();
        B.on(u, 'allyLethal', ev => {
          const t = ev.unit;
          if (!t || t === u) return;
          if (u._igySaves >= S.maxUses) return;
          if (u._igySaved.has(t.id)) return;
          ev.prevented = true;
          t.hp = t.max.hp * S.reviveHp;
          u._igySaves++;
          u._igySaved.add(t.id);
          B.fxSproutSkill('save', u, t, B.alliesOf(u), { ultimate: true });
          B.applyStatus(u, t, 'fortify', S.fortDur, { stacks: S.fortStacks });
          B.fxFloatIcon(t.x, t.y - 100, '💛');
          B.flash('#f4a261', .28, .3);
          B.fxSparkle(t.x, t.y - 50, 14, '#f4a261');
          B.fxRing(t.x, t.y - 30, 180, '#f4a261', .5);
          B.alliesOf(u).forEach(a => {
            if (a.alive && a !== t) {
              B.heal(u, a, a.max.hp * S.otherHeal, { tag: "I've Got You" });
              B.fxFloatIcon(a.x, a.y - 75, '🍰');
            }
          });
          u.flat.healPowP3 = (u.flat.healPowP3 || 0) + S.healPowGain;
          u.dirty = true;
          Sound.play('heal');
          B.log(`<b>I've Got You</b> saves ${t.name}.`);
        });
      }
    }
  }
});
