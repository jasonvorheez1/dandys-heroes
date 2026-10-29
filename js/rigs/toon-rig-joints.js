/* Skill articulation for the existing hand-built rigs. Wrappers sit around
   their painted head/arm/leg groups, so each rig keeps its own springs and
   facial animation while its five skill poses move real joints. */
'use strict';

const ToonRigJoints = (() => {
  const NS = 'http://www.w3.org/2000/svg';
  const node = (...candidates) => candidates.find(n => n && n.nodeType === 1 && n.parentNode &&
    ['g', 'svg'].includes(n.tagName?.toLowerCase())) || null;
  const clamp = n => Math.max(0, Math.min(1, n));

  function discover(r, id) {
    if (r.art) return null; // the new cutouts animate their own joints
    const R = r.R || {}, p = R.parts || {};
    const joints = {
      head: node(r.headRig, r.headJoint, r.head, R.headG, p.head?.g),
      armL: node(r.armL, r.armLu, r.armFar, r.leftShoulder, r.left, R.armLu,
        R.arm?.[0]?.u, R.armF, p.armLu?.g),
      armR: node(r.armR, r.armNear, r.rightShoulder, r.right, R.armR,
        R.arm?.[1]?.u, R.mittN, p.armR?.g),
      legL: node(r.legL, r.legFar, r.legPurple, r.legLeft, R.leg?.[0], p.legF?.g),
      legR: node(r.legR, r.legNear, r.legGreen, r.legRight, R.leg?.[1], p.legB?.g)
    };
    if (id === 'Gigi') joints.head = null; // her cap and head are separate artwork
    const svg = r.R?.svg || r.svg || r.root?.ownerSVGElement || r.head?.ownerSVGElement;
    const view = svg?.viewBox?.baseVal;
    const W = view?.width || 300, H = view?.height || 400;
    const centers = {
      head: [.5, .49], armL: [.34, .62], armR: [.68, .62],
      legL: [.43, .78], legR: [.58, .78]
    };
    if (id === 'Cocoa') centers.head = [.67, .45];
    if (id === 'Goob') { centers.armL = [.27, .55]; centers.armR = [.72, .55]; }
    if (id === 'Connie') centers.head = [.5, .45];
    const seen = new Set(), out = {};
    for (const [role, target] of Object.entries(joints)) {
      if (!target || seen.has(target)) continue;
      seen.add(target);
      const parent = target.parentNode;
      const wrap = document.createElementNS(NS, 'g');
      parent.insertBefore(wrap, target);
      wrap.appendChild(target);
      out[role] = { wrap, pivot: [W * centers[role][0], H * centers[role][1]] };
    }
    return out;
  }

  function update(u, battle) {
    if (!u.rig || u.rig.art || typeof ToonSkillMotion === 'undefined' || !ToonSkillMotion.table[u.id]) return;
    if (!u._toonSkillMotion && !u._toonJointActive) return;
    if (!u._toonJointWrap) u._toonJointWrap = discover(u.rig, u.id) || {};
    const joints = u._toonJointWrap;
    if (!Object.keys(joints).length) return;
    const pose = ToonSkillMotion.sample(u, battle.t);
    if (!pose) {
      for (const j of Object.values(joints)) j.wrap.removeAttribute('transform');
      u._toonJointActive = false;
      return;
    }
    u._toonJointActive = true;
    const run = u._toonSkillMotion;
    const progress = clamp((battle.t - run.start) / Math.max(.12, run.end - run.start));
    const lift = Math.sin(Math.PI * progress);
    const prep = Math.sin(Math.PI * clamp(progress / .48));
    const release = Math.sin(Math.PI * clamp((progress - .24) / .62));
    let head = pose.r * .35, armL = -pose.r * .45, armR = pose.r * .58;
    let legL = -pose.x * .25, legR = pose.x * .25;
    const name = pose.pose;
    if (/(guard|armor|wall|root|block|shell|contain|cower)/.test(name)) {
      armL -= 20 * lift; armR += 20 * lift; head += 5 * lift;
    } else if (/(flash|glow|pulse|stars|bloom|miracle|wish|ignite|flare)/.test(name)) {
      armL -= 25 * lift; armR += 26 * lift; head -= 5 * lift;
    } else if (/(reach|grapple|reel|fetch|hug|offer|deliver|send|toss)/.test(name)) {
      armR -= 35 * release; armL += 10 * prep;
    } else if (/(charge|rush|slam|sweep|stroke|hoof|claw|sword|spite|burst|crash)/.test(name)) {
      armR += 24 * prep - 46 * release;
      armL -= 15 * release; legL -= 7 * release; legR += 7 * release;
    } else if (/(rummage|knead|decorate|tidy|study|inspect|read)/.test(name)) {
      armR += 17 * Math.sin(progress * Math.PI * 5) * lift;
      head += 6 * lift;
    } else if (/(float|drift|vanish|swoop|flap|storm|bounce|inflate)/.test(name)) {
      armL -= 17 * lift; armR += 17 * lift;
      head += 7 * Math.sin(progress * Math.PI * 2) * lift;
    } else {
      armL -= 12 * Math.sin(progress * Math.PI * 3) * lift;
      armR += 15 * Math.sin(progress * Math.PI * 3) * lift;
    }
    // These are secondary arcs. Each rig's authored motion remains the lead.
    const scale = .48;
    const values = { head, armL, armR, legL, legR };
    for (const [role, j] of Object.entries(joints)) {
      const angle = (values[role] || 0) * scale;
      j.wrap.setAttribute('transform', `rotate(${angle.toFixed(2)} ${j.pivot[0].toFixed(1)} ${j.pivot[1].toFixed(1)})`);
    }
  }
  return { update };
})();
