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
  if (!u.finnBigCatch || !target || !target.hasStatus('hooked') || !finnOnFloor(u, target) || B.t < (u.finnBigCatchAt || 0)) return false;
  u.finnBigCatchAt = B.t + u.finnBigCatchCd;
  const wasCasting = !!target.casting;
  B.fxTargetLine(u, target, '#7be0ff'); finnBarnabyLeap(u, target, B);
  B.pull(target, B.midX, .38, target.depth); B.interrupt(target);
  B.after(.28, () => {
    if (!target.alive) return;
    B.damage(u, target, u.st.atk * u.finnBigCatchRatio, { type: 'physical', tag: 'Big Catch' });
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
  role: 'Control', roleLabel: 'Disruption Control', tier: 'B', position: 'Middle', element: 'Water',
  blurb: 'A fishbowl angler with one line, one slippery plan, and one untargetable companion who never splashes where expected.',
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
    } },
  skills: {
    W: {
      name: 'Reel In', type: 'Control / Physical Damage', energy: 100,
      v: { ratio: 1.38 }, p: { splashEvery: 5.0, hook: 7.5, drain: 9, pool: 7.5 },
      desc: (S, P) => `<span class="sk-pas">Barnaby swims beside Finn, untargetable. Every ${P.splashEvery}s he splashes the highest-Energy enemy, reducing Movement, Attack Speed, and Accuracy. Finn's Slows, Hooks, and interrupts make Barnaby 🐟 Barnaby Excited; at four stacks his next splash leaps and Stuns.</span> Active: hooks the highest-Energy enemy for ${P.hook}s, dealing <em>${pcn(S.ratio * 100)}</em> Attack. Moving or repositioning drains Energy. Barnaby immediately jumps in and creates 💧 Slippery Floor.`,
      ai: { cond: (u, B) => B.enemiesOf(u).length > 0 },
      passive: (u, B, S, P) => {
        u.finnPools = []; u.finnPoolSeq = 0; u.finnHookDrain = P.drain;
        finnAttachBarnaby(u); B.every(u, .2, () => finnUpdate(u, B));
        B.every(u, P.splashEvery, () => { const t = B.highestEnergy(B.enemiesOf(u)); if (t) finnSplash(u, t, B, { dur: 5 }); });
        B.on(u, 'statusApplied', ev => {
          if (ev.src === u && (ev.id === 'slow' || ev.id === 'hooked')) finnExcite(u, B);
        });
      },
      cast: (u, B, S, P) => {
        const t = B.highestEnergy(B.enemiesOf(u)); if (!t) return;
        B.anim(u, 'cast', .64, 'finnReel'); Sound.play('throwsomething', { vol: .55 }); B.fxTargetLine(u, t, '#75dcff'); finnHookLine(u,t,B,.72);
        B.after(.24, () => {
          if (!t.alive) return;
          B.damage(u, t, u.st.atk * S.ratio, { type: 'physical', tag: 'Reel In' }); finnHook(u, t, B, P.hook);
          finnSplash(u, t, B, { dur: 5 }); finnAddPool(u, B, t.x, 110, P.pool); finnTryBigCatch(u, t, B);
        });
      }
    },
    G: {
      name: 'Barnaby, Go!', type: 'Control / Physical Damage', cd: 10,
      v: { ratio: .72 }, p: { targets: 3, dur: 6, pull: 85 },
      desc: (S, P) => `Barnaby arcs through up to ${P.targets} enemies, dealing <em>${pcn(S.ratio * 100)}</em> Attack and reducing Attack Speed and Accuracy for ${P.dur}s. He distracts the highest-Attack target, weakening and slowing their next Basic Attack. If that target is Hooked, Barnaby bites the line, drags them out of formation, and interrupts them.`,
      ai: { prio: 58, cond: (u, B) => B.enemiesOf(u).length > 0 },
      cast: (u, B, S, P) => {
        const enemies = B.enemiesOf(u); const targets = enemies.slice().sort((a, b) => b.energy - a.energy).slice(0, P.targets);
        B.anim(u, 'cast', .54, 'finnSendBarnaby'); Sound.play('whoosh', { vol: .45 });
        targets.forEach((t, i) => B.after(i * .16, () => {
          if (!t.alive) return;
          B.damage(u, t, u.st.atk * S.ratio, { type: 'physical', tag: 'Barnaby, Go!' });
          finnSplash(u, t, B, { dur: P.dur });
        }));
        const strong = B.highestStat(enemies, 'atk'); if (!strong) return;
        B.applyStatus(u, strong, 'barnabydistracted', P.dur);
        const hook = strong.getStatus('hooked');
        if (hook && hook.src === u) {
          const wasCasting = !!strong.casting;
          B.after(.34, () => {
            if (!strong.alive) return;
            B.interrupt(strong); B.dash(strong, strong.x + (strong.x < B.midX ? -P.pull : P.pull), .26, { depth: strong.depth });
            finnExcite(u, B); if (wasCasting) finnCoordination(u, B, true);
          });
        }
      }
    },
    B: {
      name: 'Slippery Floor', type: 'Control / Physical Damage', cd: 11,
      v: { ratio: .60 }, p: { dur: 9, radius: 245 },
      desc: (S, P) => `Spills water across the enemy side for ${P.dur}s, dealing <em>${pcn(S.ratio * 100)}</em> Attack on impact. Enemies standing there lose Movement Speed and Skill Haste; their first movement attempt makes them slip and interrupt themselves. Barnaby travels faster through the water, and splashing a soaked enemy spreads water and a second splash to the nearest foe.`,
      ai: { prio: 52, cond: (u, B) => B.enemiesOf(u).length >= 1 },
      cast: (u, B, S, P) => {
        const enemies = B.enemiesOf(u); if (!enemies.length) return;
        const x = sum(enemies.map(e => e.x)) / enemies.length;
        B.anim(u, 'cast', .56, 'finnSpill'); Sound.play('hit_water', { vol: .48 }); finnAddPool(u, B, x, P.radius, P.dur);
        B.fxSplash(x, B.ground - 15, '#63c8ee', 1.4);
        enemies.filter(e => Math.abs(e.x - x) <= P.radius).forEach(e => {
          B.damage(u, e, u.st.atk * S.ratio, { type: 'physical', tag: 'Slippery Spill' });
        });
      }
    },
    P: {
      name: 'Fishbowl Coordination', type: 'Skill Haste / Energy',
      v: {}, p: {},
      desc: () => `Barnaby disrupting an enemy grants Finn 🎣 Fishbowl Coordination Skill Haste. Hooked enemies slipping, missing, or losing Energy restores Finn's Energy. Splash effects last longer against high-Energy enemies. If Finn is Crowd Controlled, Barnaby immediately splashes the enemy responsible.`,
      passive: (u, B) => {
        u.finnCoordination = true;
        B.on(u, 'statusApplied', ev => {
          if (ev.unit !== u || !ev.src || ev.src.team === u.team || !STATUS[ev.id] || !STATUS[ev.id].cc) return;
          finnSplash(u, ev.src, B, { dur: 6 });
          finnExcite(u, B);
        });
      }
    },
    R: {
      name: 'Big Catch', type: 'Control / Physical Damage / Skill Haste',
      v: { ratio: 1.62 }, p: { cooldown: 6 },
      desc: (S, P) => `Barnaby circles Hooked enemies and splashes again whenever they lose Energy. Hooking an enemy on Slippery Floor triggers Big Catch once every ${P.cooldown}s: Finn pulls them toward center while Barnaby strikes for <em>${pcn(S.ratio * 100)}</em> Attack, interrupts them, and spreads the water. When Barnaby helps interrupt an enemy Skill, Finn gains stronger Skill Haste.`,
      passive: (u, B, S, P) => {
        u.finnBigCatch = true; u.finnBigCatchRatio = S.ratio; u.finnBigCatchCd = P.cooldown; u.finnBigCatchAt = 0;
      }
    }
  }
});
