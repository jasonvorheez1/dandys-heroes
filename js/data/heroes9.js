/* heroes9.js - Finn and his untargetable companion Barnaby.
   Finn owns the fishing-line control; Barnaby owns the splashes. Their loop
   is deliberately disruptive and mobile without becoming a permanent lock. */
'use strict';

const BARNABY_ART = './Characters/Finn/Barnaby.png';

function finnAttachBarnaby(u) {
  if (!u.el || u.barnabyEl) return;
  const img = el('img', 'barnaby-companion');
  img.src = BARNABY_ART; img.alt = '';
  u.el.appendChild(img); u.barnabyEl = img;
}

function finnBarnabyLeap(u, target, B) {
  if (!target) return;
  if (u.barnabyEl) {
    u.barnabyEl.classList.remove('pounce');
    void u.barnabyEl.offsetWidth;
    u.barnabyEl.classList.add('pounce');
  }
  const layer = $('#fxFront'); if (!layer) return;
  const img = el('img'); img.src = BARNABY_ART; img.alt = '';
  img.style.cssText = `position:absolute;z-index:9;left:${u.x - 23}px;top:${u.y - 78}px;width:46px;height:46px;object-fit:contain;pointer-events:none;filter:drop-shadow(0 3px 2px #0009);opacity:.95;transform:${u.face < 0 ? 'scaleX(-1) ' : ''}rotate(-12deg)`;
  layer.appendChild(img);
  requestAnimationFrame(() => {
    img.style.transition = 'left .34s cubic-bezier(.2,.75,.25,1),top .34s cubic-bezier(.2,.75,.25,1),transform .34s,opacity .18s .3s';
    img.style.left = (target.x - 27) + 'px'; img.style.top = (target.y - 108) + 'px';
    img.style.transform = `${u.face < 0 ? 'scaleX(-1) ' : ''}rotate(18deg) scale(1.18)`;
    img.style.opacity = '.25';
  });
  setTimeout(() => img.remove(), 520);
}

function finnHookLine(u, target, B, dur) {
  const layer = $('#fxFront'); if (!layer || !target) return;
  const line = el('div');
  const x1 = u.x + u.face * 14, y1 = u.y - 66, x2 = target.x, y2 = target.y - 62;
  const dx = x2 - x1, dy = y2 - y1, len = Math.hypot(dx, dy);
  line.style.cssText = `position:absolute;z-index:7;left:${x1}px;top:${y1}px;width:${len}px;height:3px;transform-origin:0 50%;
    transform:rotate(${Math.atan2(dy,dx)}rad) scaleX(.08);background:linear-gradient(90deg,#dffaff,#75dcff 52%,#dffaff);
    box-shadow:0 0 7px #63c8ee;pointer-events:none;opacity:0`;
  layer.appendChild(line); requestAnimationFrame(()=>{ line.style.transition='transform .16s cubic-bezier(.15,1.5,.3,1),opacity .1s';line.style.opacity='.95';line.style.transform=`rotate(${Math.atan2(dy,dx)}rad) scaleX(1)`; });
  setTimeout(()=>{ line.style.transition='transform .24s ease-in,opacity .2s';line.style.opacity=0;line.style.transform=`rotate(${Math.atan2(dy,dx)}rad) scaleX(.55)`; },(dur||.7)*1000);
  setTimeout(()=>line.remove(),(dur||.7)*1000+280);
}

function finnPools(u) { return u.finnPools || (u.finnPools = []); }
function finnOnFloor(u, target) {
  return finnPools(u).some(p => Math.abs(target.x - p.x) <= p.radius);
}
function finnBuffCount(target) {
  return target.statuses.filter(s => STATUS[s.id] && STATUS[s.id].kind === 'buff').length;
}
function finnQuarry(u, B) {
  const foes = B.enemiesOf(u);
  const marked = foes.find(e => { const s = e.getStatus('finnquarry'); return s && s.src === u; });
  return marked || foes.slice().sort((a, b) => finnBuffCount(b) - finnBuffCount(a)
    || b.energy - a.energy || a.hpPct - b.hpPct)[0] || null;
}
function finnMark(u, target, B, dur) {
  if (!target || !target.alive) return;
  B.units.filter(e => e.alive && e.team !== u.team && e !== target).forEach(e => {
    const mark = e.getStatus('finnquarry');
    if (mark && mark.src === u) B.removeStatus(e, 'finnquarry');
  });
  B.applyStatus(u, target, 'finnquarry', dur);
  B.fxFloatIcon(target.x, target.y - 98, '🎯', '#75dcff');
}
function finnAddPool(u, B, x, radius, dur) {
  const pools = finnPools(u); x = clamp(x, B.leftWall, B.rightWall);
  const old = pools.find(p => Math.abs(p.x - x) <= p.radius + radius * .55);
  if (old) {
    const left = Math.min(old.x - old.radius, x - radius), right = Math.max(old.x + old.radius, x + radius);
    old.x = (left + right) / 2; old.radius = Math.min(270, (right - left) / 2); old.until = Math.max(old.until, B.t + dur);
    B.fxPool(old.x, Math.max(.5, old.until - B.t), '#63c8ee', old.radius); return old;
  }
  const p = { id: ++u.finnPoolSeq, x, radius, until: B.t + dur };
  pools.push(p); B.fxPool(x, dur, '#63c8ee', radius); return p;
}

function finnExcite(u, B) {
  B.applyStatus(u, u, 'barnabyexcited', 999, { stacks: 1 });
  const s = u.getStatus('barnabyexcited');
  if (s && s.stacks >= 4) B.fxFloatIcon(u.x, u.y - 112, '🐟!', '#75dcff');
}

function finnCoordination(u, B, strong) {
  if (!u.finnCoordination) return;
  B.applyStatus(u, u, 'fishcoordination', strong ? 6 : 4);
}

function finnSplash(u, target, B, opt) {
  if (!target || !target.alive) return;
  opt = opt || {};
  const excited = u.getStatus('barnabyexcited');
  const leap = excited && excited.stacks >= 4;
  if (leap) B.removeStatus(u, 'barnabyexcited');
  const dur = (opt.dur || 5) + (u.finnCoordination && target.energy >= 70 ? 2 : 0);
  finnBarnabyLeap(u, target, B);
  B.after(.28, () => {
    if (!target.alive) return;
    Sound.play('hit_water', { vol: .48 }); B.fxSplash(target.x, target.y - 18, '#75dcff', 1);
    B.applyStatus(u, target, 'barnabysplash', dur);
    if (leap) { B.applyStatus(u, target, 'stun', .75); finnCoordination(u, B, true); }
    else finnCoordination(u, B, false);
    if (opt.spread !== false && finnOnFloor(u, target)) {
      const near = B.nearest(target, B.enemiesOf(u).filter(e => e !== target && !e.hasStatus('barnabysplash')));
      if (near) { finnAddPool(u, B, near.x, 62, 5); finnSplash(u, near, B, { dur: dur * .8, spread: false }); }
    }
  });
}

function finnLoseEnergy(u, target, B, amount) {
  const before = target.energy;
  target.energy = Math.max(0, target.energy - amount);
  const lost = before - target.energy;
  if (lost <= 0) return 0;
  B.fxFloatIcon(target.x, target.y - 98, '−⚡', '#75dcff');
  if (u.finnCoordination) B.energy(u, Math.min(8, lost * .35));
  if (u.finnBigCatch && B.t >= (target._barnabyCircleAt || 0)) {
    target._barnabyCircleAt = B.t + 1.1; finnSplash(u, target, B, { dur: 3.5 });
  }
  return lost;
}

function finnTryBigCatch(u, target, B) {
  const mark = target && target.getStatus('finnquarry');
  if (!u.finnBigCatch || !target || !mark || mark.src !== u || !target.hasStatus('hooked')
    || !finnOnFloor(u, target) || B.t < (u.finnBigCatchAt || 0)) return false;
  u.finnBigCatchAt = B.t + u.finnBigCatchCd;
  const wasCasting = !!target.casting;
  B.fxTargetLine(u, target, '#7be0ff'); finnBarnabyLeap(u, target, B);
  B.pull(target, B.midX, .38, target.depth); B.interrupt(target);
  B.after(.28, () => {
    if (!target.alive) return;
    const bonus = Math.min(target.max.hp * (u.finnBigCatchMaxHp || 0), u.st.atk * 1.5);
    B.damage(u, target, u.st.atk * u.finnBigCatchRatio + bonus, { type: 'physical', tag: 'Big Catch' });
    finnAddPool(u, B, target.x, 125, 7); B.fxSplash(target.x, target.y - 20, '#5dc8ee', 1.35);
    if (wasCasting) finnCoordination(u, B, true);
  });
  finnExcite(u, B); return true;
}

function finnHook(u, target, B, dur) {
  B.applyStatus(u, target, 'hooked', dur);
  const memory = target._finnHookListeners || (target._finnHookListeners = {});
  if (!memory[u.uid]) {
    memory[u.uid] = true;
    B.on(target, 'missed', () => {
      const hook = target.getStatus('hooked');
      if (u.alive && hook && hook.src === u && u.finnCoordination) B.energy(u, 6);
    });
  }
}

function finnUpdate(u, B) {
  u.finnPools = finnPools(u).filter(p => p.until > B.t);
  B.enemiesOf(u).forEach(e => {
    const stateAll = e._finnState || (e._finnState = {});
    const state = stateAll[u.uid] || (stateAll[u.uid] = { slipped: {}, hookAt: -99, lastX: e.x });
    const activePools = u.finnPools.filter(p => Math.abs(e.x - p.x) <= p.radius);
    if (activePools.length) {
      B.applyStatus(u, e, 'slipperyfloor', .45);
      activePools.forEach(p => {
        if (!state.slipped[p.id] && (e.moving || e.dashUntil > B.t || Math.abs(e.x - state.lastX) > 7)) {
          state.slipped[p.id] = true;
          const wasCasting = !!e.casting; B.interrupt(e);
          B.fxFloatIcon(e.x, e.y - 96, '💦', '#75dcff'); B.applyStatus(u, e, 'slow', 2, { stacks: 2 });
          const hook = e.getStatus('hooked');
          if (u.finnCoordination && hook && hook.src === u) B.energy(u, 6);
          if (wasCasting) finnCoordination(u, B, true);
        }
      });
      const hook = e.getStatus('hooked');
      if (hook && hook.src === u) {
        finnTryBigCatch(u, e, B);
      }
    }
    const hook = e.getStatus('hooked');
    if (hook && hook.src === u && (e.moving || e.dashUntil > B.t || Math.abs(e.x - state.lastX) > 7) && B.t - state.hookAt >= .7) {
      state.hookAt = B.t; finnLoseEnergy(u, e, B, u.finnHookDrain || 9);
    }
    state.lastX = e.x;
  });
}

defHero({
  id: 'Finn', name: 'Finn', folder: 'Finn', file: 'Finn', icon: 'Finn',
  role: 'Control', roleLabel: 'Catch / Control', tier: 'A', position: 'Middle', element: 'Water',
  blurb: 'Finn singles out the biggest catch, reels it into a slippery trap, and lets Barnaby snatch away its advantages. Every takedown gives him a burst of speed.',
  base: { hp: 4220, atk: 315, def: 252, mag: 188, mdef: 255, spd: 112, acc: 188, eva: 124 },
  hidden: { range: 245, aspd: 1.04, ms: 78, aggro: .76, crit: .10, critDmg: 1.55, healPow: 1,
    shieldPow: 1, cdr: .06, ccRes: .22, kbRes: .35, armorPen: .12, magPen: .02 },
  growth: { hp: .089, atk: .086, def: .080, mag: .067, mdef: .082 },
  move: { gait: 'waddle', bob: 6, freq: 1.25, lean: 5, squash: .07, idle: 'sway', step: 'step_soft',
    particles: 'none', pcol: '#75dcff', trail: { on: true, col: '#63c8ee', rate: .16 }, brake: .42 },
  basic: { name: 'Bowl Bump', type: 'physical', ratio: 1.02, range: 245, sfx: 'swing_light', hit: 'hit_water', animStyle:'finnBowlBump',
    wind: .24, onHit: (u, t, B) => {
      if (t.hasStatus('slipperyfloor')) B.applyStatus(u, t, 'slow', 2);
      if (t.hasStatus('hooked') || t.hasStatus('barnabysplash')) B.energy(u, 4);
      if (t.hasStatus('finnquarry')) B.applyStatus(u, t, 'slow', 2);
    } },
  skills: {
    W: {
      name: 'Reel In', type: 'Control / Physical Damage', energy: 100,
      v: { ratio: 1.54 }, p: { splashEvery: 5.8, hook: 7, net: 1.6, drain: 9, pool: 7.5 },
      desc: (S, P) => `<span class="sk-pas">Barnaby swims beside Finn, untargetable, and splashes Finn's marked catch every ${P.splashEvery}s. If no catch is marked, they pursue the enemy with the most buffs. Each enemy takedown triggers Finn's Reel In burst: +35% Movement Speed for 10s.</span> Active: Finn marks the enemy with the most buffs, then highest Energy, as 🎯 Big Catch for ${P.hook}s. He hooks and pulls them for <em>${pcn(S.ratio * 100)}</em> Attack, Roots them for ${P.net}s, and leaves a Slippery Floor. Finn and Barnaby deal 16% more direct damage to Big Catch.`,
      ai: { cond: (u, B) => B.enemiesOf(u).length > 0 },
      passive: (u, B, S, P) => {
        u.finnPools = []; u.finnPoolSeq = 0; u.finnHookDrain = P.drain;
        finnAttachBarnaby(u); B.every(u, .2, () => finnUpdate(u, B));
        B.every(u, P.splashEvery, () => { const t = finnQuarry(u, B); if (t) finnSplash(u, t, B, { dur: 5 }); });
        B.on(u, 'statusApplied', ev => {
          if (ev.src === u && (ev.id === 'slow' || ev.id === 'hooked')) finnExcite(u, B);
        });
        B.on(u, 'enemyDown', () => {
          if (!u.alive) return;
          B.applyStatus(u, u, 'finnreelin', 10);
          const next = finnQuarry(u, B);
          if (next) finnMark(u, next, B, P.hook);
        });
      },
      cast: (u, B, S, P) => {
        const t = finnQuarry(u, B); if (!t) return;
        B.anim(u, 'cast', .64, 'finnReel'); Sound.play('throwsomething', { vol: .55 }); B.fxTargetLine(u, t, '#75dcff'); finnHookLine(u,t,B,.72);
        B.after(.24, () => {
          if (!t.alive) return;
          finnMark(u, t, B, P.hook);
          B.damage(u, t, u.st.atk * S.ratio, { type: 'physical', tag: 'Reel In' });
          B.pull(t, B.midX, .34, t.depth); B.interrupt(t);
          B.after(.34, () => { if (t.alive) B.applyStatus(u, t, 'root', P.net); });
          finnHook(u, t, B, P.hook);
          finnSplash(u, t, B, { dur: 5 }); finnAddPool(u, B, t.x, 110, P.pool); finnTryBigCatch(u, t, B);
        });
      }
    },
    G: {
      name: 'Barnaby, Go!', type: 'Control / Physical Damage / Dispel', cd: 10,
      v: { ratio: 1.16, heal: .065 }, p: { dur: 6, strip: 3 },
      desc: (S, P) => `Barnaby leaps onto Big Catch, or the enemy with the most buffs, dealing <em>${pcn(S.ratio * 100)}</em> Attack, removing up to ${P.strip} buffs, and soaking them for ${P.dur}s. Finn heals <em>${pcn(S.heal * 100)}</em> Max HP. A Hooked catch is dragged and interrupted.`,
      ai: { prio: 58, cond: (u, B) => B.enemiesOf(u).length > 0 },
      cast: (u, B, S, P) => {
        const t = finnQuarry(u, B); if (!t) return;
        B.anim(u, 'cast', .54, 'finnSendBarnaby'); Sound.play('whoosh', { vol: .45 });
        finnBarnabyLeap(u, t, B);
        B.after(.28, () => {
          if (!t.alive) return;
          B.damage(u, t, u.st.atk * S.ratio, { type: 'physical', tag: 'Barnaby, Go!' });
          B.fxSplash(t.x, t.y - 18, '#75dcff', .95);
          B.dispel(t, P.strip);
          B.applyStatus(u, t, 'barnabysplash', P.dur);
          B.applyStatus(u, t, 'barnabydistracted', P.dur);
          B.heal(u, u, u.max.hp * S.heal, { tag: 'Barnaby, Go!' });
          finnCoordination(u, B, true); finnExcite(u, B);
          const hook = t.getStatus('hooked');
          if (hook && hook.src === u) {
            const wasCasting = !!t.casting;
            B.interrupt(t); B.pull(t, B.midX, .28, t.depth);
            if (wasCasting) finnCoordination(u, B, true);
          }
        });
      }
    },
    B: {
      name: 'Tide Pool Trap', type: 'Control / Physical Damage', cd: 11,
      v: { ratio: .88 }, p: { dur: 9, radius: 245, snare: 1.8 },
      desc: (S, P) => `Finn spills water under Big Catch for ${P.dur}s, dealing <em>${pcn(S.ratio * 100)}</em> Attack to nearby enemies. The marked enemy is interrupted and Rooted for ${P.snare}s. Enemies on the pool lose Movement and Skill Haste, then slip when they try to move. Barnaby's splash can spread the pool.`,
      ai: { prio: 52, cond: (u, B) => B.enemiesOf(u).length >= 1 },
      cast: (u, B, S, P) => {
        const enemies = B.enemiesOf(u); if (!enemies.length) return;
        const t = finnQuarry(u, B), x = t ? t.x : sum(enemies.map(e => e.x)) / enemies.length;
        B.anim(u, 'cast', .56, 'finnSpill'); Sound.play('hit_water', { vol: .48 }); finnAddPool(u, B, x, P.radius, P.dur);
        B.fxSplash(x, B.ground - 15, '#63c8ee', 1.4);
        enemies.filter(e => Math.abs(e.x - x) <= P.radius).forEach(e => {
          B.damage(u, e, u.st.atk * S.ratio, { type: 'physical', tag: 'Slippery Spill' });
        });
        if (t && t.alive) { B.interrupt(t); B.applyStatus(u, t, 'root', P.snare); }
      }
    },
    P: {
      name: 'Fishbowl Coordination', type: 'Skill Haste / Anti-Stealth',
      v: {}, p: {},
      desc: () => `Barnaby disrupting an enemy grants Finn 🎣 Fishbowl Coordination Skill Haste. Hooked enemies slipping, missing, or losing Energy restores his Energy. If an enemy hides, Barnaby reveals and marks them as Big Catch. When Finn is Crowd Controlled, Barnaby splashes the enemy responsible.`,
      passive: (u, B) => {
        u.finnCoordination = true;
        B.on(u, 'statusApplied', ev => {
          if (ev.id === 'stealth' && ev.unit && ev.unit.team !== u.team && ev.unit.alive && u.alive) {
            B.removeStatus(ev.unit, 'stealth');
            finnMark(u, ev.unit, B, 7);
            B.fxSplash(ev.unit.x, ev.unit.y - 18, '#75dcff', .8);
            finnExcite(u, B);
          }
          if (ev.unit === u && ev.src && ev.src.team !== u.team && STATUS[ev.id] && STATUS[ev.id].cc) {
            finnSplash(u, ev.src, B, { dur: 6 });
            finnExcite(u, B);
          }
        });
      }
    },
    R: {
      name: 'Big Catch', type: 'Control / Physical Damage / Skill Haste',
      v: { ratio: 1.78, maxHp: .035 }, p: { cooldown: 6 },
      desc: (S, P) => `Barnaby circles Hooked enemies and splashes again whenever they lose Energy. Hooking Big Catch on Slippery Floor triggers a follow-up every ${P.cooldown}s: Finn reels it in, Barnaby interrupts it and strikes for <em>${pcn(S.ratio * 100)}</em> Attack plus up to <em>${pcn(S.maxHp * 100)}</em> of its Max HP, and the water spreads.`,
      passive: (u, B, S, P) => {
        u.finnBigCatch = true; u.finnBigCatchRatio = S.ratio; u.finnBigCatchMaxHp = S.maxHp;
        u.finnBigCatchCd = P.cooldown; u.finnBigCatchAt = 0;
      }
    }
  }
});
