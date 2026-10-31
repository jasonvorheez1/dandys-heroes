/* chell-kit.js - Chell (SS Tier Control / Support, Midline, Physical).
   Test Subject from the Aperture Science event. Unlocked from Dyle's shop after beating GLaDOS (see js/aperture.js).
   Core mechanics: linked blue/orange portals displace enemies; redirected attacks; gels; long-fall dodges; a Test Chamber Override finale.
   Exact numbers, forced movement and the arena override are Dandy's Heroes adaptations. Chell stays silent: no voice lines. */
'use strict';

/* ============================================================ STATUS DEFINITIONS */

STATUS.chell_disoriented = {
  icon: '🌀', name: 'Disoriented', kind: 'debuff',
  desc: 'Thrown through a portal. Accuracy -25% and Skill Haste -20%.',
  mods: m => { m.accP -= .25; m.cdr -= .20; }
};
STATUS.chell_momentum = {
  icon: '💨', name: 'Momentum', kind: 'buff',
  desc: 'Chell keeps the speed of her last portal jump: more Evasion and Movement Speed.',
  mods: m => { m.evaP += .18; m.msP += .22; }
};
STATUS.chell_portal_guard = {
  icon: '🛡', name: 'Through the Portal', kind: 'buff',
  desc: 'Took a portal this moment: 15% Damage Reduction.',
  mods: m => { m.dmgTaken -= .15; }
};
STATUS.chell_cover = {
  icon: '🔵', name: 'Portal Cover', kind: 'buff',
  desc: 'Chell redirected the attack that was aimed at you: 20% Damage Reduction.',
  mods: m => { m.dmgTaken -= .20; }
};
STATUS.chell_propulsion = {
  icon: '🟠', name: 'Propulsion Gel', kind: 'buff',
  desc: 'Orange gel under your feet: +30% Movement Speed and +20% Attack Speed.',
  mods: (m, s) => { m.msP += .30; m.aspdP += .20; if (s && s.haste) m.cdr += .15; }
};
STATUS.chell_repulsion = {
  icon: '🔷', name: 'Repulsion Gel', kind: 'buff',
  desc: 'Blue gel: a short burst of Evasion for anyone who crosses it.',
  mods: m => { m.evaP += .20; }
};
STATUS.chell_bridge = {
  icon: '🌉', name: 'Hard-Light Bridge', kind: 'buff',
  desc: 'A bridge of light: 30% Damage Reduction.',
  mods: m => { m.dmgTaken -= .30; }
};

/* ============================================================ HELPERS */

const chellRed = u => !!u._chellRed;
function chellPortals(u, B) {
  // two linked portals on the panels at the edges of the arena
  const foes = B.enemiesOf(u).filter(e => e.alive);
  const mid = foes.length ? foes.reduce((s, e) => s + e.x, 0) / foes.length : u.x + 200;
  u._portal = { blue: { x: u.x + u.face * 70, y: u.y - 70 }, orange: { x: mid, y: u.y - 210 } };
  B.fxRing(u._portal.blue.x, u._portal.blue.y, 70, '#4aa8ff', .5);
  B.fxRing(u._portal.orange.x, u._portal.orange.y, 70, '#ff9a2e', .5);
  B.fxFloatIcon(u._portal.orange.x, u._portal.orange.y - 30, '🌀', '#ff9a2e');
}
function chellDisplace(u, B, e, P) {
  if (!u.alive || !e || !e.alive) return;
  B.applyStatus(u, e, 'chell_disoriented', P ? P.disDur : 6);
  B.fxRing(e.x, e.y - 50, 60, '#4aa8ff', .3);
  u._displaced = (u._displaced || 0) + 1;
  chellCheckOverride(u, B);
}
function chellCheckOverride(u, B) {
  if (!chellRed(u) || u._overrideUsed) return;
  if ((u._redirected || 0) >= 3 || (u._displaced || 0) >= 5) {
    u._overrideUsed = true;
    chellOverride(u, B);
  }
}
function chellOverride(u, B) {
  const P = u._chellOverrideP;
  const foes = B.enemiesOf(u).filter(e => e.alive);
  if (!foes.length) return;
  const cx = foes.reduce((s, e) => s + e.x, 0) / foes.length;
  B.anim(u, 'cast', 1.3, 'chellFunnel');
  B.flash('#4aa8ff', .3, .25);
  B.fxFloatIcon(u.x, u.y - 124, '🧪 TEST CHAMBER OVERRIDE', '#ff9a2e');
  Sound.play('get_rare', { vol: .6, priority: true });
  foes.forEach(e => { B.pull(e, cx, .6, e.depth, u); B.applyStatus(u, e, 'stun', 2.6); B.fxRing(e.x, e.y - 60, 90, '#4aa8ff', .5); });
  B.after(2.4, () => {
    if (!u.alive) return;
    B.shake(8, .3);
    B.fxRing(cx, u.y - 20, 420, '#ff9a2e', .6);
    B.enemiesOf(u).forEach(e => {
      if (!e.alive) return;
      B.damage(u, e, u.st.atk * P.dropAtk, { type: 'physical', area: true, tag: 'Funnel Drop' });
      B.applyStatus(u, e, 'stun', 1.6);
    });
    B.alliesOf(u).forEach(a => { if (a.alive) B.applyStatus(u, a, 'chell_bridge', 8); });
    B.fxFloatIcon(u.x, u.y - 124, '🌉 HARD-LIGHT BRIDGE', '#4aa8ff');
  });
}

/* ============================================================ HERO DEFINITION: CHELL */

defHero({
  id: 'Chell',
  name: 'Chell',
  folder: 'Chell',
  file: 'Chell',
  icon: 'Chell',
  role: 'Control',
  roleLabel: 'Control / Support',
  tier: 'SS',
  position: 'Midline',
  element: 'Aperture',
  eventOnly: true,
  noVoice: true,
  blurb: 'A silent test subject with a handheld portal device. She wins by moving things: enemies, rockets, momentum, and herself.',
  base: { hp: 5100, atk: 330, def: 290, mag: 140, mdef: 270, spd: 124, acc: 235, eva: 180 },
  hidden: { range: 235, aspd: 1.0, ms: 82, aggro: .9, crit: .12, critDmg: 1.6, healPow: 1.0, shieldPow: 1.1, cdr: .12, ccRes: .2, kbRes: .4, armorPen: .05, magPen: .03 },
  growth: { hp: .09, atk: .098, def: .084, mag: .05, mdef: .088 },
  move: { gait: 'strut', bob: 5, freq: 1.5, lean: 4, squash: .03, idle: 'sway', step: 'step_soft',
    particles: 'sparkle', pcol: '#4aa8ff', trail: { on: true, col: '#ff9a2e', rate: .12 }, brake: .3 },
  basic: {
    name: 'Portal Shot',
    type: 'physical',
    style: 'chellBasic',
    ratio: .85,
    range: 235,
    proj: 'orb',
    pcol: '#4aa8ff',
    sfx: 'vee_pulse',
    hit: 'hit_blunt',
    wind: .2,
    note: 'Fires a portal shot at the target. After a dodge through a portal, the next shot drops a Weighted Storage Cube instead.',
    onHit: (u, t, B) => {
      if (!u.alive || !t || !t.alive || !u._cubeDrop) return;
      u._cubeDrop = false;
      B.fxFloatIcon(t.x, t.y - 100, '🟦 CUBE DROP', '#9db4d6');
      B.damage(u, t, u.st.atk * (u._cubeAtk || .9), { type: 'physical', tag: 'Cube Drop' });
      B.applyStatus(u, t, 'stun', .6);
    }
  },
  skills: {
    /* ---------------- WHITE: Thinking With Portals ---------------- */
    W: {
      name: 'Thinking With Portals',
      type: 'Physical Damage / Control',
      energy: 100,
      v: { dropAtk: 1.25, ramAtk: .55, bigAtk: .6 },
      p: { disDur: 6, stun: 1.6, count: 3, momentum: 8, energyDrain: 20 },
      desc: (S, P) => `<b>Passive:</b> At the start of the battle Chell opens two linked portals. Enemies she displaces become <em>Disoriented</em> for ${P.disDur}s (-25% Accuracy, -20% Skill Haste). <b>Active:</b> the ${P.count} closest enemies fall through one portal and crash down from the other: Physical Damage from their travel plus a ${P.stun}s Stun. The enemy with the highest Attack hits harder and knocks nearby enemies back. Chell gains <em>Momentum</em> for ${P.momentum}s. Already-Disoriented enemies lose ${P.energyDrain} Energy.`,
      passive: (u, B, S, P) => {
        u._chellRed = u._chellRed || false;
        B.after(.6, () => { if (u.alive) chellPortals(u, B); });
      },
      cast: (u, B, S, P) => {
        const foes = B.enemiesOf(u).filter(e => e.alive).sort((a, b) => B.distance(u, a) - B.distance(u, b)).slice(0, P.count + (chellRed(u) ? 1 : 0));
        if (!foes.length) return;
        B.anim(u, 'cast', 1.0, 'chellPortal');
        Sound.play('ui_open', { vol: .5 });
        if (!u._portal) chellPortals(u, B);
        const top = foes.slice().sort((a, b) => (b.st.atk || 0) - (a.st.atk || 0))[0];
        foes.forEach((e, i) => {
          const wasDis = e.hasStatus && e.hasStatus('chell_disoriented');
          chellDisplace(u, B, e, { disDur: P.disDur + (chellRed(u) ? 2 : 0) });
          B.fxFloatIcon(e.x, e.y - 92, '🌀', '#4aa8ff');
          B.after(.35 + i * .08, () => {
            if (!u.alive || !e.alive) return;
            const crash = u.st.atk * S.dropAtk * (e === top ? 1 + S.bigAtk : 1) * (1 + S.ramAtk * Math.min(1, Math.abs(e.x - u.x) / 400));
            B.fxRing(e.x, e.y - 20, e === top ? 220 : 120, '#ff9a2e', .4);
            B.damage(u, e, crash, { type: 'physical', tag: e === top ? 'Heavy Landing' : 'Portal Drop' });
            B.applyStatus(u, e, 'stun', P.stun);
            if (e === top) B.enemiesOf(u).forEach(n => { if (n !== e && n.alive && B.distance(e, n) < 180) B.knockback(u, n, 90); });
            if (wasDis) B.energy(e, -P.energyDrain);
          });
        });
        B.applyStatus(u, u, 'chell_momentum', P.momentum);
      }
    },

    /* ---------------- GREEN: Speedy Thing Goes In ---------------- */
    G: {
      name: 'Speedy Thing Goes In',
      type: 'Physical Damage / Control / Support',
      cd: 9,
      first: 3.5,
      v: { redirect: .9, cubeAtk: 1.1, capAtk: 3.2 },
      p: { stun: .9, cover: 6, drain: 15 },
      desc: (S, P) => `Chell puts a portal in the way of the last ranged attack against her team and sends it back at the enemy with the highest Attack for ${fmt(S.redirect * 100)}% of its damage (capped). The attacker becomes <em>Disoriented</em> and loses ${P.drain} Energy, and the ally it was aimed at takes 20% less damage for ${P.cover}s. With nothing to redirect she launches a Weighted Storage Cube at the closest enemy instead (${P.stun}s Stun).${''}`,
      passive: (u, B, S, P) => {
        u._lastRanged = null;
        B.on(u, 'allyDamageTaken', ev => {
          if (!ev || !ev.src || !ev.unit || ev.src.team === u.team || ev.dot || !(ev.amount > 0)) return;
          if (B.distance(ev.src, ev.unit) < 170 && ev.type !== 'magic') return;
          u._lastRanged = { src: ev.src, victim: ev.unit, amount: ev.amount, at: B.t };
        });
      },
      cast: (u, B, S, P) => {
        const foes = B.enemiesOf(u).filter(e => e.alive);
        if (!foes.length) return;
        const rec = u._lastRanged;
        const fresh = rec && B.t - rec.at < 5 && rec.src.alive;
        B.anim(u, 'cast', .9, 'chellRedirect');
        if (fresh) {
          const top = foes.slice().sort((a, b) => (b.st.atk || 0) - (a.st.atk || 0))[0];
          const amount = Math.min(rec.amount * S.redirect, u.st.atk * S.capAtk);
          B.fxTargetLine(rec.src, top, '#4aa8ff');
          B.after(.25, () => {
            if (!top.alive) return;
            B.fxRing(top.x, top.y - 50, 100, '#ff9a2e', .4);
            B.damage(u, top, amount, { type: 'physical', tag: 'Redirected' });
          });
          chellDisplace(u, B, rec.src, { disDur: 6 });
          B.energy(rec.src, -P.drain);
          if (rec.victim && rec.victim.alive) B.applyStatus(u, rec.victim, 'chell_cover', P.cover);
          B.fxFloatIcon(rec.src.x, rec.src.y - 100, '↩ SPEEDY THING GOES IN', '#4aa8ff');
          u._redirected = (u._redirected || 0) + 1;
          u._lastRanged = null;
          chellCheckOverride(u, B);
        } else {
          const t = B.nearest(u, foes);
          B.fxFloatIcon(t.x, t.y - 100, '🟦 CUBE', '#9db4d6');
          B.after(.3, () => {
            if (!u.alive || !t.alive) return;
            B.damage(u, t, u.st.atk * S.cubeAtk, { type: 'physical', tag: 'Weighted Cube' });
            B.applyStatus(u, t, 'stun', P.stun);
          });
        }
      }
    },

    /* ---------------- BLUE: Mobility Gels ---------------- */
    B: {
      name: 'Mobility Gels',
      type: 'Physical Damage / Control / Support',
      cd: 13,
      first: 5,
      v: { bounceAtk: .7 },
      p: { dur: 8, spread: 190 },
      desc: (S, P) => `Chell switches on a gel dispenser through a portal. If enemies are bunched up she coats them in <em>Repulsion Gel</em>: they bounce, take Physical Damage and are slowed, while allies gain Evasion. If they are spread out she uses <em>Propulsion Gel</em>: allies get +30% Movement Speed and +20% Attack Speed for ${P.dur}s and enemies that charge through become Disoriented. Only one gel field at a time.`,
      passive: () => {},
      cast: (u, B, S, P) => {
        const foes = B.enemiesOf(u).filter(e => e.alive);
        if (!foes.length) return;
        const cx = foes.reduce((s, e) => s + e.x, 0) / foes.length;
        const spread = Math.max(...foes.map(e => Math.abs(e.x - cx)));
        const clustered = spread < P.spread / 2;
        B.anim(u, 'cast', .9, 'chellGel');
        if (clustered) {
          B.fxRing(cx, u.y - 10, 300, '#4aa8ff', .5);
          foes.forEach(e => {
            B.damage(u, e, u.st.atk * S.bounceAtk, { type: 'physical', tag: 'Repulsion Landing' });
            B.applyStatus(u, e, 'slow', 3);
            B.fxFloatIcon(e.x, e.y - 90, '🔷', '#4aa8ff');
          });
          B.alliesOf(u).forEach(a => { if (a.alive) B.applyStatus(u, a, 'chell_repulsion', 4); });
          if (chellRed(u)) foes.forEach(e => B.energy(e, -12));
        } else {
          B.fxRing(u.x, u.y - 10, 300, '#ff9a2e', .5);
          B.alliesOf(u).forEach(a => { if (a.alive) B.applyStatus(u, a, 'chell_propulsion', P.dur, { haste: chellRed(u) }); });
          foes.forEach(e => { if (Math.abs(e.x - cx) > P.spread / 2) { B.applyStatus(u, e, 'chell_disoriented', 4); B.damage(u, e, u.st.atk * S.bounceAtk * .6, { type: 'physical', tag: 'Gel Collision' }); } });
        }
        B.fxFloatIcon(u.x, u.y - 116, clustered ? '🔷 REPULSION GEL' : '🟠 PROPULSION GEL', clustered ? '#4aa8ff' : '#ff9a2e');
      }
    },

    /* ---------------- PURPLE: Long Fall Boots ---------------- */
    P: {
      name: 'Long Fall Boots',
      type: 'Evasion / Control / Survival',
      v: { cubeAtk: .9 },
      p: { evaPct: 25, guardDur: 5, escapeCd: 10 },
      desc: (S, P) => `Chell gains +${P.evaPct}% Evasion. When she Dodges a melee attack she steps through a portal and appears behind the attacker; her next Basic Attack becomes a <em>Cube Drop</em> (extra Physical Damage and a short interrupt). Every portal trip gives 15% Damage Reduction for ${P.guardDur}s. If a Critical Hit would land while a portal is open, she slips away and the hit is refunded (once every ${P.escapeCd}s).`,
      passive: (u, B, S, P) => {
        u.flat.evaP_purple = P.evaPct / 100;
        u.dirty = true;
        u._cubeAtk = S.cubeAtk;
        B.on(u, 'dodged', ev => {
          if (!u.alive) return;
          const a = ev && ev.src;
          if (a && a.alive && a.team !== u.team && B.distance(u, a) < 200) {
            B.blink(u, a.x - (a.face || 1) * 40, a.depth);
            B.fxRing(u.x, u.y - 40, 70, '#4aa8ff', .3);
          }
          u._cubeDrop = true;
          B.applyStatus(u, u, 'chell_portal_guard', P.guardDur);
          if (chellRed(u)) B.energy(u, 10);
        });
        B.on(u, 'allyDamageTaken', ev => {
          if (!ev || ev.unit !== u || !ev.crit || !u._portal) return;
          if (u._escapeAt && B.t - u._escapeAt < P.escapeCd) return;
          u._escapeAt = B.t;
          B.heal(u, u, ev.amount, { silent: true, tag: 'Portal Escape' });
          B.fxFloatIcon(u.x, u.y - 100, '🌀 ESCAPE', '#4aa8ff');
          B.applyStatus(u, u, 'chell_portal_guard', P.guardDur);
        });
      }
    },

    /* ---------------- RED: Aperture Science Testing Initiative ---------------- */
    R: {
      name: 'Aperture Science Testing Initiative',
      type: 'Physical Damage / Control / Support',
      v: { dropAtk: 3.2 },
      p: { hpPct: 12, evaPct: 6, hastePct: 10 },
      desc: (S, P) => `Her portal system is upgraded: Thinking With Portals displaces one more enemy and for longer, Mobility Gels add Skill Haste and drain Energy, and Long Fall Boots grant Energy on a portal dodge. <b>Test Chamber Override</b> (once per wave): after three redirects or five displacements the funnel pulls every enemy to the middle, Stuns them, then drops them for heavy Physical Damage while a Hard-Light Bridge gives all allies 30% Damage Reduction for 8s. +${P.hpPct}% Max HP, +${P.evaPct}% Evasion, +${P.hastePct}% Skill Haste.`,
      passive: (u, B, S, P) => {
        u._chellRed = true;
        u._chellOverrideP = { dropAtk: S.dropAtk };
        u.flat.hpP_red = P.hpPct / 100;
        u.flat.evaP_red = P.evaPct / 100;
        u.flat.cdr_red = P.hastePct / 100;
        u.dirty = true;
      }
    }
  }
});

/* ============================================================ ROSTER & DATA REGISTRATION */

if (typeof SPECIAL_HERO_ART !== 'undefined') SPECIAL_HERO_ART.Chell = 'assets/aperture/chell/Chell.png';
if (typeof SPECIAL_HERO_ICONS !== 'undefined') SPECIAL_HERO_ICONS.Chell = 'assets/aperture/chell/icon.png';
if (typeof HERO_IDS !== 'undefined' && !HERO_IDS.includes('Chell')) HERO_IDS.push('Chell');
if (typeof PLAYABLE_IDS !== 'undefined' && !PLAYABLE_IDS.includes('Chell')) PLAYABLE_IDS.push('Chell');
if (typeof COLLAB_HERO_IDS !== 'undefined') COLLAB_HERO_IDS.add('Chell');
{
  // Chell is recruited through Dyle's shop, not shards. She shows as an event Hero.
  const obtain = obtainOf;
  obtainOf = function (id) {
    if (id === 'Chell') return Object.assign({}, OBTAIN.Event, { icon: '🌀', color: '#ff9a2e' });
    return obtain.apply(this, arguments);
  };
}
