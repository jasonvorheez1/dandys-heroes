/* hero.js - the Hero detail page: stats, skills, upgrades, and class. */
'use strict';

const GOURDY_SKILL_PREVIEWS = {
  W: { gourdyMode: 'treat', ally: true, projectile: false, previewActions: [{ state: 'cast', dur: .72 }],
    castCue: 'get_item', impactCue: 'sparkle', floatLabel: 'TREAT!' },
  G: { gourdyMode: 'rush', ally: true, projectile: false, previewActions: [{ state: 'cast', dur: .68 }],
    castCue: 'get_food', impactCue: 'sparkle', floatLabel: 'SUGAR RUSH!' },
  B: { gourdyMode: 'toss', ally: false, projectile: true, previewActions: [{ state: 'wind', dur: .68 }],
    castCue: 'throwsomething', impactCue: 'pop2' }
};

const TISHA_SKILL_PREVIEWS = {
  W: { ally: true, previewActions: [{ state: 'cast', dur: .72 }],
    castCue: 'tisha_wind', impactCue: 'tisha_duster_sweep', previewType: 'CLEAN LINE SWEEP', floatLabel: 'CLEAN LINES' },
  G: { ally: false, previewActions: [{ state: 'cast', dur: .72 }],
    castCue: 'tisha_formation_signal', impactCue: 'hit_heavy', previewType: 'FORMATION CONTROL', floatLabel: 'IN ITS PLACE' },
  B: { ally: false, previewActions: [{ state: 'cast', dur: .62 }],
    castCue: 'tisha_dust_cloud', impactCue: 'hit_magic', previewType: 'DUST CLOUD', floatLabel: 'BLINDED' }
};

const TOODLES_SKILL_PREVIEWS = {
  basic: { toodlesMode: 'swing', previewActions: [{ state: 'attack', dur: .28 }], castCue: 'swing_light', impactCue: 'hit_blunt', floatLabel: 'ROLLING SWING' },
  W: { toodlesMode: 'roll', previewActions: [{ state: 'cast', dur: .72 }], castCue: 'toodles_gamble', impactCue: 'sparkle', previewType: 'LUCK ROLL', floatLabel: 'LUCKY BOOST!' },
  G: { toodlesMode: 'strike', previewActions: [{ state: 'wind', dur: .38 }], dashes: true, castCue: 'dash', impactCue: 'hit_heavy', previewType: 'LUCKY STRIKE', floatLabel: 'WEAKENED!' },
  B: { toodlesMode: 'miracle', ally: true, previewActions: [{ state: 'cast', dur: .56 }], castCue: 'toodles_gamble', impactCue: 'cleanse', previewType: 'SMALL MIRACLE', floatLabel: 'SHIELDED!' },
  P: { toodlesMode: 'improve', passive: true, previewActions: [{ state: 'idle', dur: .78 }], castCue: 'sparkle', impactCue: null, previewType: 'PASSIVE GROWTH', floatLabel: 'ADAPTING' },
  R: { toodlesMode: 'charm', passive: true, previewActions: [{ state: 'idle', dur: .78 }], castCue: 'toodles_gamble', impactCue: null, previewType: 'LUCKY CHARM', floatLabel: 'NO REPEATS' }
};

function skillScalingLine(S, P, level) {
  const values = [];
  const pretty = (key, value) => {
    const label = key.replace(/([A-Z])/g, ' $1').replace(/^./, c => c.toUpperCase());
    const number = Math.abs(value) <= 1 ? pcn(value * 100) : value.toFixed(1).replace(/\.0$/, '');
    return `${label} ${number}`;
  };
  Object.entries(S || {}).forEach(([key, value]) => {
    if (typeof value === 'number' && Number.isFinite(value) && values.length < 3) values.push(pretty(key, value));
  });
  if (!values.length && level > 1) {
    Object.entries(P || {}).forEach(([key, value]) => {
      if (typeof value === 'number' && Number.isFinite(value) && values.length < 3) values.push(pretty(key, value));
    });
  }
  return values.length ? `<span class="skill-level-scaling">SKILL SCALING · <em>${values.join(' · ')}</em></span>` : '';
}

/* The profile preview is presented like a short video, but its result comes
   from the same Unit/Battle APIs as a real encounter. It runs once against a
   deterministic small battle sandbox, records the authored cast timeline, then
   the visual preview replays that recording until the next skill is chosen.
   Keeping the sandbox detached also means preview FX/audio can never leak into
   a live battle. */
const SkillPreviewSimulator = {
  run(cfg, skill, key) {
    const empty = { duration: 1.8, hitTimes: [], actions: [], damage: 0, heal: 0, shield: 0,
      targetHpPct: 1, displayValue: 0, label: '', audio: [] };
    if (!skill) return empty;

    const B = new Battle({ preview: true });
    Object.assign(B, { W: 560, H: 320, rangeScale: 1, depthSpan: 112, ground: 246,
      leftWall: 18, rightWall: 542, midX: 280, timeLimit: 4, running: false });
    B.log = () => {};
    const events = [], audio = [];
    const fxSaved = [], soundSaved = [];
    Object.keys(FX).forEach(name => { if (typeof FX[name] === 'function') fxSaved.push([name, FX[name]]); });
    Object.keys(Sound).forEach(name => { if (typeof Sound[name] === 'function') soundSaved.push([name, Sound[name]]); });
    fxSaved.forEach(([name]) => { FX[name] = () => false; });
    soundSaved.forEach(([name]) => { Sound[name] = () => false; });
    // Record authored collaboration voices for the replay, while keeping the
    // detached sandbox completely silent during simulation.
    Sound.collab = (u, action, opt) => {
      if (u && u.id && action) audio.push({ kind: 'collab', id: u.id, action, t: B.t, vol: opt && opt.vol });
      return false;
    };

    let actor, target, failure = '', startingTargetHpPct = 1;
    try {
      // Battle.kill normally also animates/removes a rendered unit. The
      // preview has no rendered unit, so retain the combat state transitions
      // and events while omitting only that DOM work.
      B.kill = (u, src) => {
        if (!u || !u.alive) return;
        u.alive = false; u.hp = 0; B._liveDirty = true;
        if (src) src.kills++;
        B.emitFor(u, 'death', { src });
        B.emitTeam(u.team, 'allyDown', u);
        B.emitFoe(u.team, 'enemyDown', u);
        u.timers = []; u.intervals = [];
        B.intervals = B.intervals.filter(i => i.owner !== u);
        B.removeListenersFor(u);
      };
      actor = B.addUnit(playerSpec(cfg.id), TEAM_P, 0);
      const targetSpec = cfg.targetId ? playerSpec(cfg.targetId) : makeWeakling('Sponge', Math.max(1, actor.level));
      // Support skills need an actual ally target. The old sandbox always put
      // this visual target on TEAM_E, so Phantasia's heals silently hit herself.
      target = B.addUnit(targetSpec, cfg.ally ? TEAM_P : TEAM_E, 0);
      const opponent = cfg.ally ? B.addUnit(makeWeakling('Training Enemy', Math.max(1, actor.level)), TEAM_E, 0) : null;
      actor.x = 150; actor.depth = .5; actor.y = B.ground - actor.depth * B.depthSpan;
      // A basic preview starts at the same engagement distance a real walk-in
      // reaches; skills keep the wider arena spacing for projectile/radius
      // checks. This prevents the basic hitbox from becoming a fake whiff.
      target.x = cfg.basic ? 300 : 410; target.depth = .5; target.y = B.ground - target.depth * B.depthSpan;
      if (opponent) { opponent.x = 410; opponent.depth = .5; opponent.y = B.ground - opponent.depth * B.depthSpan; }
      actor.target = target; actor.face = 1; target.face = -1;

      const prime = (u) => {
        if (u.cls && CLASSES[u.cls]) CLASSES[u.cls].apply(u, B, u.classRank || 1);
        if (u.subcls && SUBCLASSES[u.subcls]) SUBCLASSES[u.subcls].apply(u, B, u.subclassRank || 1);
        if (u.aura) B.applyStatus(u, u, u.aura, 999, { stacks: 3 });
        (u.trinkets || []).forEach(worn => {
          const copy = typeof worn === 'string' ? Save.data.trinketInv[worn] : worn;
          const trinket = copy && TRINKETS[copy.id];
          if (trinket) { try { trinket.apply(u, B, copy.rank); } catch (e) {} }
        });
        const badgeRefs = u.badges && u.badges.length ? u.badges : u.badge ? [u.badge] : [];
        badgeRefs.forEach(ref => {
          const bid = typeof ref === 'string' ? ref : ref && ref.id;
          const lvl = typeof ref === 'string' ? Save.badgeLvl(bid) : ref && ref.lvl;
          if (BADGES[bid] && lvl > 0) { try { BADGES[bid].apply(u, B, lvl); } catch (e) {} }
        });
        B.initPassives(u);
        u.dirty = true; u.recompute(true); u.hp = u.max.hp;
      };
      prime(actor); prime(target);
      // Prime establishes max HP and passives; make the ally wounded after
      // that step so healing/support skills have a real reason to choose it.
      if (cfg.ally) target.hp = target.max.hp * .62;
      B._liveDirty = true;
      startingTargetHpPct = clamp(target.hp / Math.max(1, target.max.hp), 0, 1);

      const originalAnim = B.anim.bind(B);
      B.anim = (u, state, dur, style) => {
        events.push({ kind: 'anim', t: B.t, state, dur: Number(dur) || .4 });
        return originalAnim(u, state, dur, style);
      };
      const originalDamage = B.damage.bind(B);
      B.damage = (src, tgt, amount, opt) => {
        const beforeHp = tgt && tgt.hp;
        const ev = originalDamage(src, tgt, amount, opt);
        if (ev) events.push({ kind: 'damage', t: B.t, amount: ev.amount || 0, type: ev.type, target: tgt,
          hpPct: tgt ? clamp(tgt.hp / Math.max(1, tgt.max.hp), 0, 1) : 1 });
        else if (tgt && tgt.alive && tgt.hp === beforeHp) events.push({ kind: 'miss', t: B.t, target: tgt });
        return ev;
      };
      const originalHeal = B.heal.bind(B);
      B.heal = (src, tgt, amount, opt) => {
        const before = tgt && tgt.hp;
        const applied = originalHeal(src, tgt, amount, opt);
        if (applied > 0) events.push({ kind: 'heal', t: B.t, amount: applied, target: tgt, before });
        return applied;
      };
      const originalShield = B.shield.bind(B);
      B.shield = (src, tgt, amount, dur, opt) => {
        const before = tgt ? tgt.shieldTotal : 0;
        const result = originalShield(src, tgt, amount, dur, opt);
        const added = tgt ? Math.max(0, tgt.shieldTotal - before) : 0;
        if (added > 0) events.push({ kind: 'shield', t: B.t, amount: added, target: tgt });
        return result;
      };
      const originalStatus = B.applyStatus.bind(B);
      B.applyStatus = (src, tgt, id, dur, opt) => {
        const before = tgt && tgt.statuses && tgt.statuses.some(s => s.id === id);
        const result = originalStatus(src, tgt, id, dur, opt);
        if (tgt && tgt.statuses && tgt.statuses.some(s => s.id === id) && !before)
          events.push({ kind: 'status', t: B.t, id, target: tgt });
        return result;
      };
      const originalDash = B.dash.bind(B);
      B.dash = (u, x, dur, opt) => {
        events.push({ kind: 'dash', t: B.t, from: u.x, to: x, dur: Number(dur) || .3 });
        return originalDash(u, x, dur, opt);
      };

      if (cfg.basic) {
        AI.beginBasic(actor, B, target);
      } else if (skill.cast) {
        actor.energy = actor.energyMax;
        AI.fire(actor, B, key);
      }

      // Advance only authored timers. No AI loop runs here, so the recording
      // contains exactly one move and not an accidental second basic attack.
      for (let frame = 0; frame < 210; frame++) {
        const dt = 1 / 60; B.t += dt;
        for (let i = B.timers.length - 1; i >= 0; i--) {
          const timer = B.timers[i]; timer.t -= dt;
          if (timer.t <= 0) { B.timers.splice(i, 1); try { timer.fn(); } catch (e) { failure = failure || (e && e.message ? e.message : String(e)); } }
        }
        for (let i = B.intervals.length - 1; i >= 0; i--) {
          const interval = B.intervals[i];
          if (interval.owner && !interval.owner.alive) { B.intervals.splice(i, 1); continue; }
          interval.t -= dt;
          if (interval.t <= 0) { interval.t += interval.every; try { interval.fn(); } catch (e) { failure = failure || (e && e.message ? e.message : String(e)); } }
        }
        // A basic attack is committed through AI's pending-hit state rather
        // than B.after(). Resolve that same state here so the preview uses the
        // real hitbox check, projectile timing, multi-hit split, and onHit
        // hooks instead of a guessed damage pulse.
        if (actor && actor.pendingHit) {
          actor.pendingHit.t -= dt;
          if (actor.pendingHit.t <= 0) {
            const pending = actor.pendingHit; actor.pendingHit = null;
            try { AI.resolveBasic(actor, B, pending); }
            catch (e) { failure = failure || (e && e.message ? e.message : String(e)); }
          }
        }
        B.units.forEach(u => { if (u.dirty) u.recompute(); });
        if (B.t > 2.8 && !B.timers.length) break;
      }
    } catch (e) {
      failure = e && e.message ? e.message : String(e);
      console.warn('skill preview simulation failed', cfg.id, key, e);
    }

    // Restore the global buses before the next frame can run.
    fxSaved.forEach(([name, fn]) => { FX[name] = fn; });
    soundSaved.forEach(([name, fn]) => { Sound[name] = fn; });
    if (!actor || !target) return Object.assign({}, empty, { error: failure });

    // Passive timers are primed in the sandbox too, but they are not part of
    // the selected move's video. A short authored move window keeps a later
    // maintenance tick from extending the clip or changing its final HP.
    const impacts = events.filter(e => e.t <= 1.8 && (e.kind === 'damage' || e.kind === 'heal' || e.kind === 'shield' || e.kind === 'status' || e.kind === 'miss'));
    const damage = events.filter(e => e.kind === 'damage').reduce((n, e) => n + e.amount, 0);
    const heal = events.filter(e => e.kind === 'heal').reduce((n, e) => n + e.amount, 0);
    const shield = events.filter(e => e.kind === 'shield').reduce((n, e) => n + e.amount, 0);
    const lastImpact = impacts.length ? impacts[impacts.length - 1].t : .9;
    const duration = Math.max(cfg.passive ? 1.65 : cfg.ultimate ? 2.2 : cfg.basic ? 1.8 : 2, lastImpact + .48);
    const hitTimes = [...new Set(impacts.map(e => clamp(e.t / duration, .12, .92).toFixed(4)))].map(Number);
    const actions = events.filter(e => e.kind === 'anim').map(e => ({ state: e.state, dur: e.dur }));
    const label = damage > 0 ? `-${fmt(Math.round(damage))}` : shield > 0 ? `+${fmt(Math.round(shield))} SHIELD` : heal > 0 ? `+${fmt(Math.round(heal))}` : events.some(e => e.kind === 'miss') ? 'MISS' : '';
    const lastDamage = events.slice().reverse().find(e => e.kind === 'damage' && e.t <= 1.8);
    const missed = damage <= 0 && events.some(e => e.kind === 'miss');
    return { duration, hitTimes, actions, damage, heal, shield, missed, error: failure, audio,
      targetHpPct: lastDamage ? lastDamage.hpPct : startingTargetHpPct,
      displayValue: Math.round(damage || shield || heal || 0), label };
  }
};

function skillRankPreview(skill, lv) {
  if (!skill || lv >= 450) return '';
  const next = lv + 1, currentS = {}, nextS = {};
  Object.keys(skill.v || {}).forEach(key => {
    currentS[key] = skill.v[key] * skillMult(lv);
    nextS[key] = skill.v[key] * skillMult(next);
  });
  const currentP = skillGrowthParams(skill, lv), nextP = skillGrowthParams(skill, next);
  const pretty = (key, value) => {
    const label = key.replace(/([A-Z])/g, ' $1').replace(/^./, c => c.toUpperCase());
    const number = Math.abs(value) < 1 ? (value * 100).toFixed(1).replace(/\.0$/, '') + '%' : value.toFixed(1).replace(/\.0$/, '');
    return label + ' ' + number;
  };
  const changes = [];
  Object.keys(currentS).forEach(key => {
    if (changes.length < 3 && Math.abs(nextS[key] - currentS[key]) > .00001) changes.push(pretty(key, currentS[key]) + ' → ' + pretty(key, nextS[key]).replace(/^[^ ]+ /, ''));
  });
  Object.keys(currentP).forEach(key => {
    if (changes.length < 3 && Math.abs(nextP[key] - currentP[key]) > .00001) changes.push(pretty(key, currentP[key]) + ' → ' + pretty(key, nextP[key]).replace(/^[^ ]+ /, ''));
  });
  if (skill.cd && changes.length < 3) changes.push('Cooldown ' + skillCooldown(skill, lv).toFixed(1) + 's → ' + skillCooldown(skill, next).toFixed(1) + 's');
  return changes.join(' · ');
}

const RODGER_SKILL_PREVIEWS = {
  W: { rodgerMode: 'research', ally: false, projectile: false, previewActions: [{ state: 'cast', dur: .78 }],
    castCue: 'lock', impactCue: 'spectral', floatLabel: '+2 RESEARCH' },
  G: { rodgerMode: 'capsule', ally: false, projectile: true, previewActions: [{ state: 'wind', dur: .68 }],
    castCue: 'throwsomething', impactCue: 'icebreak', floatLabel: 'STUNNED' },
  B: { rodgerMode: 'case', ally: false, projectile: false, previewActions: [{ state: 'cast', dur: .82 }],
    castCue: 'lock', impactCue: 'spectral', floatLabel: 'INVESTIGATED' }
};

const SHRIMPO_SKILL_PREVIEWS = {
  W: { shrimpoMode: 'tantrum', projectile: false, dashes: false, previewActions: [{ state: 'spin', dur: 1.25 }],
    castCue: 'warn', impactCue: 'hit_heavy', floatLabel: 'TAUNTED!' },
  G: { shrimpoMode: 'bully', projectile: false, dashes: true, previewActions: [{ state: 'wind', dur: .34 }, { state: 'attack', dur: .42 }],
    castCue: 'dash', impactCue: 'crit', floatLabel: 'FINISHER!' },
  B: { shrimpoMode: 'spite', passive: false, projectile: false, dashes: true, previewType: 'PASSIVE TRIGGER',
    previewActions: [{ state: 'wind', dur: .48 }, { state: 'attack', dur: .44 }], castCue: 'warn', impactCue: 'crit', floatLabel: 'TRUE DAMAGE!' }
};

const VEE_SKILL_PREVIEWS = {
  W: { veeMode: 'spotlight', ally: false, projectile: false, previewActions: [{ state: 'cast', dur: .72 }],
    castCue: 'flash', impactCue: 'beam_fire', floatLabel: 'HEADLINE!' },
  G: { veeMode: 'audience', ally: true, projectile: false, previewActions: [{ state: 'cast', dur: .76 }],
    castCue: 'cheer', impactCue: 'sparkle', floatLabel: 'AUDIENCE BOOST!' },
  B: { veeMode: 'commercial', ally: false, projectile: false, previewNoDamage: true, previewType: 'TEAM CONTROL', previewActions: [{ state: 'cast', dur: .84 }],
    castCue: 'ui_open', impactCue: 'ticktock', floatLabel: 'SLOWED!' }
};

const FLYTE_SKILL_PREVIEWS = {
  W: { flyteMode: 'gust', ally: true, projectile: false, previewActions: [{ state: 'cast', dur: .72 }],
    castCue: 'tornado_s', impactCue: 'whoosh', floatLabel: 'GUST ZONE!' },
  G: { flyteMode: 'rescue', ally: true, projectile: false, dashes: true, previewActions: [{ state: 'cast', dur: .48 }],
    castCue: 'dash', impactCue: 'guard', floatLabel: 'SHIELDED!' },
  B: { flyteMode: 'clear', ally: false, projectile: false, dashes: true, previewActions: [{ state: 'attack', dur: .68 }],
    castCue: 'dash', impactCue: 'hit_light', floatLabel: 'PUSHED!' }
};

/* Sprout's preview follows the kit's actual verbs: make a treat, rush to one
   ally, distribute two deliveries, watch the team, and intervene on a KO. */
const SPROUT_SKILL_PREVIEWS = {
  W: { sproutMode: 'bake', ally: true, previewActions: [{ state: 'cast', dur: .48 }],
    cast: 'HealEffect', impact: 'BlessedEffect', col: '#f4a261', castCue: 'get_food', impactCue: 'heal', floatLabel: 'TREAT DELIVERED' },
  G: { sproutMode: 'rush', ally: true, dashes: true, previewActions: [{ state: 'move', dur: .52 }, { state: 'cast', dur: .38 }],
    cast: 'HasteEffect', impact: 'BlessedEffect', col: '#f4a261', castCue: 'dash', impactCue: 'buff', floatLabel: 'STAY CLOSE' },
  B: { sproutMode: 'oven', ally: true, previewActions: [{ state: 'cast', dur: .70 }],
    cast: 'HealEffect', impact: 'BlessedEffect', col: '#f4a261', castCue: 'get_food', impactCue: 'heal', floatLabel: 'TWO DELIVERIES' },
  P: { sproutMode: 'watch', ally: true, passive: true, previewActions: [{ state: 'idle', dur: .78 }],
    cast: 'BlessedEffect', impact: 'BlessedEffect', col: '#ffd166', castCue: 'lock', impactCue: 'sparkle', previewType: 'PASSIVE WATCH' },
  R: { sproutMode: 'save', ally: true, dashes: true, previewActions: [{ state: 'move', dur: .38 }, { state: 'cast', dur: .56 }],
    cast: 'ShieldEffect', impact: 'BlessedEffect', col: '#ffd166', castCue: 'ult_ready', impactCue: 'cleanse', floatLabel: 'I\'VE GOT YOU' }
};

const BASSIE_SKILL_PREVIEWS = {
  W: { bassieMode: 'sharing', ally: false, previewActions: [{ state: 'cast', dur: .46 }],
    cast: 'HasteEffect', impact: 'ShockEffect', col: '#8fd9c4', castCue: 'cheer', impactCue: 'hit_light', previewType: 'SUPPLY VOLLEY', floatLabel: 'SUPPLY ×5' },
  G: { bassieMode: 'packed', ally: true, previewActions: [{ state: 'cast', dur: .58 }],
    cast: 'BlessedEffect', impact: 'HasteEffect', col: '#8fd9c4', castCue: 'get_item', impactCue: 'buff', floatLabel: 'PACKED!' },
  B: { bassieMode: 'toss', ally: false, previewActions: [{ state: 'wind', dur: .38 }, { state: 'attack', dur: .46 }],
    cast: 'RageEffect', impact: 'ShockEffect', col: '#8fd9c4', castCue: 'swing_heavy', impactCue: 'explode', floatLabel: 'DISORGANIZED!' },
  P: { bassieMode: 'prepared', ally: true, passive: true, previewActions: [{ state: 'idle', dur: .82 }],
    cast: 'ArmorEffect', impact: 'BlessedEffect', col: '#ffd166', castCue: 'lock', impactCue: 'sparkle', previewType: 'PASSIVE STOCK' },
  R: { bassieMode: 'overflow', ally: true, passive: true, previewActions: [{ state: 'cast', dur: .78 }],
    cast: 'ArmorEffect', impact: 'ShockEffect', col: '#ffd166', castCue: 'ult_ready', impactCue: 'bomb', previewType: 'PASSIVE UPGRADE', floatLabel: 'OVERFLOW READY' }
};

const WAXWELL_SKILL_PREVIEWS = {
  W: { waxMode: 'ignite', ally: false, previewActions: [{ state: 'cast', dur: .60 }],
    cast: 'BurnEffect', impact: 'BurnEffect', col: '#ff8a38', castCue: 'fire', impactCue: 'hit_magic', previewType: 'FLAME TRAIL', floatLabel: 'LIT UP' },
  G: { waxMode: 'melt', ally: false, previewActions: [{ state: 'cast', dur: .52 }],
    cast: 'SlowEffect', impact: 'SlowEffect', col: '#e7bd54', castCue: 'grow', impactCue: 'hit_water', previewType: 'SOFT WAX PATH', floatLabel: 'SLOWED' },
  B: { waxMode: 'snuffer', ally: false, previewActions: [{ state: 'cast', dur: .44 }],
    cast: 'CurseEffect', impact: 'SleepEffect', col: '#ffd27a', castCue: 'lock', impactCue: 'guardbreak', previewType: 'CANDLE SNUFFER', floatLabel: 'SNUFFED' },
  P: { waxMode: 'figure', ally: false, passive: true, previewActions: [{ state: 'idle', dur: .84 }],
    cast: 'ArmorEffect', impact: 'CurseEffect', col: '#e7bd54', castCue: 'lock', impactCue: 'spectral', previewType: 'PASSIVE FIGURES', floatLabel: 'WAX COPY' },
  R: { waxMode: 'network', ally: false, passive: true, previewActions: [{ state: 'cast', dur: .88 }],
    cast: 'BlessedEffect', impact: 'BurnEffect', col: '#ff9c3e', castCue: 'magiccircle', impactCue: 'fire', previewType: 'PASSIVE NETWORK', floatLabel: 'PATTERN LINKED' }
};

/* These skills target different sides of the field. Keep the preview sandbox
   honest instead of letting the generic Support fallback make every Wish look
   like an ally heal. */
const PHANTASIA_SKILL_PREVIEWS = {
  W: { ally: true, cast: 'BlessedEffect', impact: 'HealEffect', col: '#efb8ff', castCue: 'phantasia_skill', impactCue: 'heal', previewType: 'MAGIC TRICK', floatLabel: 'WISH ROLL' },
  G: { ally: false, cast: 'CurseEffect', impact: 'SlowEffect', col: '#efb8ff', castCue: 'whisper', impactCue: 'guard', previewNoDamage: true, previewType: 'PREMONITION', floatLabel: 'PREDICTED' },
  B: { ally: true, cast: 'ShieldEffect', impact: 'HealEffect', col: '#efb8ff', castCue: 'magiccircle', impactCue: 'heal', previewNoDamage: true, previewType: 'WISHLING WARD', floatLabel: 'WARD UP' },
  P: { ally: true, passive: true, cast: 'SparkleEffect', impact: null, col: '#efb8ff', castCue: null, impactCue: null, previewNoDamage: true, previewType: 'PASSIVE CARE', floatLabel: 'SPARKLE' },
  R: { ally: true, passive: true, cast: 'ShieldEffect', impact: 'BlessedEffect', col: '#fff0ff', castCue: 'phantasia_skill', impactCue: 'heal', previewNoDamage: true, previewType: 'WISH UPON ME', floatLabel: 'SAVED' }
};

const RUDIE_SKILL_PREVIEWS = {
  basic: { rudieMode: 'jab', previewActions: [{ state: 'wind', dur: .24 }, { state: 'attack', dur: .38 }], dashes: true,
    castCue: 'stab', impactCue: 'hit_slash', previewType: 'ANTLER BASIC', floatLabel: 'JAB ×2' },
  W: { rudieMode: 'rush', previewActions: [{ state: 'wind', dur: .70 }], dashes: true, hitTimes: [.40, .53, .66],
    castCue: 'rudie_wind', impactCue: 'hit_heavy', previewType: 'CHARGE THROUGH', floatLabel: 'MOMENTUM RUSH' },
  G: { rudieMode: 'hoof', previewActions: [{ state: 'wind', dur: .28 }, { state: 'attack', dur: .58 }], dashes: true, hitTimes: [.40, .48, .56, .64, .72],
    castCue: 'rudie_hoofstep', impactCue: 'hit_light', previewType: '5-HIT KICK STRING', floatLabel: 'HOOFSTEP ×5' },
  B: { rudieMode: 'boost', previewActions: [{ state: 'cast', dur: .72 }], castCue: 'rudie_red_nose', impactCue: 'buff', previewType: 'MOMENTUM SURGE', floatLabel: 'SPEED UP!' },
  P: { rudieMode: 'momentum', passive: true, previewActions: [{ state: 'idle', dur: .82 }], castCue: 'sparkle', impactCue: null, previewType: 'MOMENTUM ARMOR', floatLabel: 'STACKING SPEED' },
  R: { rudieMode: 'opener', passive: true, previewActions: [{ state: 'wind', dur: .68 }], dashes: true, hitTimes: [.46],
    castCue: 'rudie_wind', impactCue: 'hit_heavy', previewType: 'BATTLE OPENER', floatLabel: 'FASTEST DELIVERY' }
};

/* Turn the authored skill call into a compact visual cue for the preview. The
   battle simulation remains authoritative; this is only the presentation
   layer that lets a skill read as its real kind of move in a small viewport. */
function heroPreviewVisualKind(skill, source) {
  const name = String(skill && skill.name || '').toLowerCase();
  const type = String(skill && skill.type || '').toLowerCase();
  const text = `${name} ${type} ${source || ''}`.toLowerCase();
  if (/shield|buff|heal|energy|support|protect|guard|regen|fortify/.test(type + ' ' + name)) return 'support';
  if (/fxproj|fxarc|projectile|throw|toss|orb|missile|targetline|hook/.test(text)) return 'projectile';
  if (/fxslash|fxsweep|slash|spin|sweep|blade|claw|strike|jab|melee|attack|flourish/.test(text)) return 'slash';
  if (/fxring|fxpool|zone|circle|radius|area|wave|sound wave/.test(text)) return 'ring';
  if (/summon|release.*twisted|spawn|specimen/.test(text)) return 'summon';
  if (/fxboom|boom|explode|burst|smash|bomb|impact/.test(text)) return 'burst';
  if (/magic|spell|lightning|thunder|beam|starfall|curse/.test(text)) return 'magic';
  return 'impact';
}

/* Collaboration skills use authored action poses and timings instead of one
   generic attack/cast clip. The cues mirror what each kit actually does. */
const COLLAB_SKILL_PREVIEWS = {
  Sora: {
    W: { previewActions: [{ state:'attack', dur:.95 }], dashes:true, hitTimes:[.34,.40,.46,.52,.58,.64,.69],
      cast:'HasteEffect', impact:'ShockEffect', col:'#8edcff', castCue:'sora_skill', impactCue:'keyblade_hit',
      forceCinematicFx:true, floatLabel:'7-HIT FINISHER' },
    G: { previewActions: [{ state:'cast', dur:.70 }], cast:'ShockEffect', impact:'ShockEffect', col:'#a8eaff',
      castCue:'sora_magic', impactCue:'shock', forceCinematicFx:true, previewType:'3-TARGET CONTROL', floatLabel:'SHOCK ×3' },
    B: { previewActions: [{ state:'spin', dur:.72 }], cast:'ShieldEffect', impact:'ShockEffect', col:'#dff8ff',
      castCue:'sora_skill', impactCue:'hit_heavy', forceCinematicFx:true, floatLabel:'KNOCKBACK' }
  },
  Kairi: {
    W: { previewActions: [{ state:'attack', dur:.90 }], dashes:true, hitTimes:[.34,.43,.52,.61],
      cast:'BlessedEffect', impact:'ConfusionEffect', col:'#ffd0ed', castCue:'kairi_skill', impactCue:'keyblade_hit',
      forceCinematicFx:true, floatLabel:'GLEAM BURST' },
    G: { previewActions: [{ state:'cast', dur:.65 }], ally:true, previewNoDamage:true,
      cast:'ShieldEffect', impact:'BlessedEffect', col:'#ffd0ed', castCue:'kairi_protect', impactCue:'sparkle',
      forceCinematicFx:true, previewType:'ALLY ZONE', floatLabel:'RADIANT CIRCLE' },
    B: { previewActions: [{ state:'cast', dur:.50 }, { state:'attack', dur:.45 }], dashes:true,
      cast:'ShieldEffect', impact:'SlowEffect', col:'#ffb8e6', castCue:'kairi_protect', impactCue:'keyblade_hit',
      forceCinematicFx:true, previewType:'COUNTER STANCE', floatLabel:'COUNTER!' }
  },
  Goofy: {
    W: { previewActions: [{ state:'cast', dur:.70 }, { state:'attack', dur:.75 }], projectile:true,
      projectileObject:'goofy-shield', cast:'ShieldEffect', impact:'ShockEffect', col:'#8ee5ff',
      castCue:'goofy_protect', impactCue:'goofy_skill', forceCinematicFx:true, floatLabel:'SHIELD THROW' },
    G: { previewActions: [{ state:'spin', dur:.72 }], dashes:true, hitTimes:[.42,.52,.62],
      castCue:'tornado_s', impactCue:'tornado_e', floatLabel:'PUSHED BACK' },
    B: { previewActions: [{ state:'move', dur:.48 }, { state:'attack', dur:.46 }], dashes:true,
      castCue:'goofy_protect', impactCue:'hit_blunt', previewType:'ALLY INTERCEPT', floatLabel:'INTERCEPTED' }
  }
};

const HeroPage = {
  id: null,
  tab: 'skills',
  skillKey: 'W',
  _gearOpenPanel: null,
  _previewLoop: null,
  _previewRaf: null,
  _previewTimers: [],
  _heroOpenSoundPending: false,

  open(id, keepTab = false) {
    this.id = id;
    if (!keepTab) {
      this.tab = 'skills';
      this.skillKey = 'W';
    } else if (this.tab === 'skills') {
      const d = HEROES[id];
      if (this.skillKey !== 'basic' && (!d.skills || !d.skills[this.skillKey])) {
        this.skillKey = 'W';
      }
    }
    this._gearOpenPanel = null;
    this._heroOpenSoundPending = !$('#modalBox.hero-profile-box');
    const hash = id.split('').reduce((n, c) => n + c.charCodeAt(0), 0);
    const maps = ['rainbow-rooms','art-floor','library-floor','vee-floor','greenhouse'];
    const assets = Preload.heroBundle(id).concat(bgForMap(maps[Math.abs(hash) % maps.length]));
    const target = Save.ownedIds().find(x => x !== id);
    if (target) assets.push(Art.hero(target), Art.battleHero(target));
    LoadingScreen.run({
      kicker: 'OPENING HERO FILE', title: HEROES[id].name,
      message: 'Loading skill animations', assets, portraits: [Art.hero(id)]
    }, () => { if (this.id === id) this.draw(); });
  },

  stopPreview() {
    if (this._previewLoop) { clearTimeout(this._previewLoop); clearInterval(this._previewLoop); }
    if (this._previewRaf) cancelAnimationFrame(this._previewRaf);
    this._previewLoop = null;
    this._previewRaf = null;
    (this._previewTimers || []).forEach(x => { clearTimeout(x); clearInterval(x); });
    this._previewTimers = [];
  },

  close() {
    this.stopPreview();
    if (this._boundKeyHandler && typeof window !== 'undefined') {
      window.removeEventListener('keydown', this._boundKeyHandler);
      this._boundKeyHandler = null;
    }
    UI.closeModal();
  },

  moveHero(dir) {
    const ids = Save.ownedIds().sort((a, b) => HEROES[a].name.localeCompare(HEROES[b].name));
    const at = ids.indexOf(this.id);
    const next = ids[(at + dir + ids.length) % ids.length];
    Sound.play('ui_move'); Sound.play('hero_file_switch', { vol: .48, throttle: 0 });
    this.open(next, true);
  },

  toggleQuickPicker(body) {
    let picker = $('.hero-quick-picker', body);
    if (picker) {
      picker.remove();
      return;
    }
    Sound.play('ui_move');
    picker = el('div', 'hero-quick-picker');
    const ids = Save.ownedIds().sort((a, b) => HEROES[a].name.localeCompare(HEROES[b].name));

    const head = el('div', 'hero-quick-picker-head');
    head.innerHTML = `
      <div class="hero-quick-picker-search">
        <i>🔍</i><input type="text" placeholder="Search ${ids.length} heroes..." aria-label="Filter heroes">
      </div>
      <button type="button" class="hero-quick-picker-close" aria-label="Close hero picker">×</button>
    `;
    picker.appendChild(head);

    const grid = el('div', 'hero-quick-picker-grid');
    const renderItems = filterText => {
      grid.innerHTML = '';
      const query = (filterText || '').trim().toLowerCase();
      const filtered = query ? ids.filter(id => HEROES[id].name.toLowerCase().includes(query) || (HEROES[id].role || '').toLowerCase().includes(query)) : ids;
      if (!filtered.length) {
        grid.innerHTML = `<div class="hero-quick-picker-empty">No heroes match "${query}"</div>`;
        return;
      }
      filtered.forEach(id => {
        const d = HEROES[id], h = Save.hero(id);
        const onTeam = Save.data.team.includes(id);
        const card = el('button', 'hero-quick-card' + (id === this.id ? ' current' : '') + (onTeam ? ' on-team' : ''));
        card.style.setProperty('--rarity-color', RARITY_COLORS[h.rarity]);
        card.innerHTML = `
          <div class="hero-quick-card-art">
            <img src="${Art.icon(id)}" alt="${d.name}" loading="lazy" decoding="async">
            ${onTeam ? '<span class="hero-quick-team-badge" title="On active team">✓</span>' : ''}
          </div>
          <div class="hero-quick-card-info">
            <b>${d.name}</b>
            <small>Lv ${h.level} · ${'★'.repeat(h.stars)}</small>
          </div>
        `;
        card.onclick = () => {
          picker.remove();
          if (id !== this.id) {
            Sound.play('ui_ok');
            Sound.play('hero_file_switch', { vol: .48, throttle: 0 });
            this.open(id, true);
          }
        };
        grid.appendChild(card);
      });
    };
    renderItems('');
    picker.appendChild(grid);

    const input = $('input', head);
    if (input) {
      input.oninput = () => renderItems(input.value);
    }
    const closeBtn = $('.hero-quick-picker-close', head);
    if (closeBtn) closeBtn.onclick = () => picker.remove();

    body.appendChild(picker);
    setTimeout(() => { if (input && input.isConnected) input.focus(); }, 50);
  },

  draw() {
    const prevContent = typeof document !== 'undefined' ? document.querySelector('.hero-profile-content') : null;
    const prevShell = typeof document !== 'undefined' ? document.querySelector('.hero-profile-shell') : null;
    const savedContentScroll = prevContent ? prevContent.scrollTop : 0;
    const savedShellScroll = prevShell ? prevShell.scrollTop : 0;

    this.stopPreview();
    this._previewStage = null;
    const id = this.id, h = Save.hero(id), d = HEROES[id];
    const opening = this._heroOpenSoundPending;
    const body = el('div', 'hero-profile' + (opening ? ' hero-profile-enter' : ''));
    const o = obtainOf(id);
    const ownedIds = Save.ownedIds().sort((a, b) => HEROES[a].name.localeCompare(HEROES[b].name));
    const heroIndex = ownedIds.indexOf(id);

    const top = el('header', 'hero-profile-top');
    top.innerHTML = `<button class="hero-round hero-prev" aria-label="Previous Hero" title="Previous Hero (Left Arrow)">‹</button>
      <div class="hero-top-name" role="button" tabindex="0" title="Click to quickly switch Heroes" aria-label="Quick hero switcher">
        <small>HERO FILE · ${heroIndex >= 0 ? heroIndex + 1 : 1} OF ${ownedIds.length}</small>
        <b>${d.name} <span class="hero-top-caret">▾</span></b>
      </div>
      <div class="hero-top-res">
        <span title="Ichor">${RES.ichor.icon} ${fmt(Save.res('ichor'))}</span>
        <span title="Tape">📼 ${fmt(Save.res('tape'))}</span>
        <span title="Notes">✦ ${fmt(Save.res('notes'))}</span>
      </div>
      <button class="hero-round hero-next" aria-label="Next Hero" title="Next Hero (Right Arrow)">›</button>
      <button class="hero-round hero-close" aria-label="Close" title="Close Hero File (Esc)">×</button>`;
    $('.hero-prev', top).onclick = () => this.moveHero(-1);
    $('.hero-next', top).onclick = () => this.moveHero(1);
    $('.hero-close', top).onclick = () => this.close();
    $('.hero-top-name', top).onclick = () => this.toggleQuickPicker(body);
    $('.hero-top-name', top).onkeydown = e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); this.toggleQuickPicker(body); } };

    let touchStartX = 0, touchStartY = 0;
    top.ontouchstart = e => {
      if (e.touches && e.touches[0]) {
        touchStartX = e.touches[0].clientX;
        touchStartY = e.touches[0].clientY;
      }
    };
    top.ontouchend = e => {
      if (e.changedTouches && e.changedTouches[0]) {
        const dx = e.changedTouches[0].clientX - touchStartX;
        const dy = e.changedTouches[0].clientY - touchStartY;
        if (Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(dy) * 1.5) {
          if (dx > 0) this.moveHero(-1);
          else this.moveHero(1);
        }
      }
    };
    body.appendChild(top);

    const shell = el('div', 'hero-profile-shell');
    const identity = el('aside', 'hero-identity');
    identity.style.setProperty('--hero-color', RARITY_COLORS[h.rarity]);
    const powerInfo = Progress.powerBreakdown(id);
    identity.innerHTML = `<div class="hero-identity-copy"><small>LEVEL ${h.level}</small><h1>${d.name}</h1>
      <div class="hero-stars">${'★'.repeat(h.stars)}${'☆'.repeat(5 - h.stars)}</div>
      <p>${d.blurb}</p></div>
      <div class="hero-art-stage"><i></i><img src="${Art.hero(id)}" alt="${d.name}" loading="lazy" decoding="async"></div>
      <div class="hero-power" title="Stats ${fmt(powerInfo.stats)} · Skills ${fmt(powerInfo.skills)} · Gear ${fmt(powerInfo.gear)} · Training ${fmt(powerInfo.training)} · ${powerInfo.unlocked} skills unlocked"><span>POWER</span><b>${fmt(powerInfo.total)}</b></div>`;
    const chips = el('div', 'hero-identity-chips');
    chips.appendChild(UI.roleTag(d.role, d.roleLabel));
    if (d.position) chips.appendChild(el('span', 'pill', d.position));
    chips.appendChild(el('span', 'pill', d.element));
    const ob = el('span', 'pill', o.icon + ' ' + o.name);
    ob.style.color = o.color; chips.appendChild(ob);
    identity.appendChild(chips);
    const requiredForBuds = Save.budsRequiredIds().includes(id);
    const team = el('button', 'hero-team-toggle', requiredForBuds ? '🔒 REQUIRED FOR DANDY\'S BUDS' : Save.data.team.includes(id) ? '✓ ON TEAM' : '+ ADD TO TEAM');
    team.onclick = () => {
      const t = Save.data.team;
      if (requiredForBuds && t.includes(id)) { UI.toast(d.name + ' is required for Dandy\'s Buds'); Sound.play('ui_err'); return; }
      if (t.includes(id)) t.splice(t.indexOf(id), 1);
      else if (t.filter(Boolean).length >= 5) { UI.toast('Team is full'); Sound.play('ui_err'); return; }
      else t.push(id);
      Save.data.team = t.filter(Boolean); Save.write(); Sound.play('ui_ok'); Sound.play('hero_file_team', { vol: .46, throttle: 0 }); this.draw();
    };
    identity.appendChild(team);
    shell.appendChild(identity);

    const main = el('main', 'hero-profile-main');
    const tabs = el('nav', 'hero-profile-tabs');
    const tabNames = { skills: 'Skills', growth: 'Growth', stats: 'Stats', extras: 'Gear' };
    Object.keys(tabNames).forEach(t => {
      const b = el('button', t === this.tab ? 'selected' : '', tabNames[t]);
      b.onclick = () => { this.tab = t; Sound.play('hero_file_tab', { vol: .48, throttle: 0 }); this.draw(); };
      tabs.appendChild(b);
    });
    main.appendChild(tabs);
    const content = el('div', 'hero-profile-content');
    if (this.tab === 'skills') content.appendChild(this.skillsTab(id));
    else if (this.tab === 'growth') content.appendChild(this.growthTab(id));
    else if (this.tab === 'stats') content.appendChild(this.statsTab(id));
    else content.appendChild(this.extrasTab(id));
    main.appendChild(content);
    shell.appendChild(main);
    body.appendChild(shell);

    const modalBox = UI.modal(null, body, {
      bare: true,
      className: 'hero-profile-box',
      onClose: () => {
        this.stopPreview();
        if (this._boundKeyHandler && typeof window !== 'undefined') {
          window.removeEventListener('keydown', this._boundKeyHandler);
          this._boundKeyHandler = null;
        }
      }
    });

    if (!this._boundKeyHandler && typeof window !== 'undefined') {
      this._boundKeyHandler = e => {
        const modal = typeof document !== 'undefined' ? document.querySelector('#modalBox.hero-profile-box') : null;
        if (!modal || modal.hidden) return;
        const picker = modal.querySelector('.hero-quick-picker');
        if (e.target && ['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName)) {
          if (e.key === 'Escape' && picker) { e.preventDefault(); picker.remove(); }
          return;
        }
        if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
          e.preventDefault(); this.moveHero(-1);
        } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
          e.preventDefault(); this.moveHero(1);
        } else if (e.key === 'Escape') {
          e.preventDefault();
          if (picker) picker.remove();
          else this.close();
        } else if (e.key === '1') {
          e.preventDefault(); this.tab = 'skills'; Sound.play('hero_file_tab', { vol: .48, throttle: 0 }); this.draw();
        } else if (e.key === '2') {
          e.preventDefault(); this.tab = 'growth'; Sound.play('hero_file_tab', { vol: .48, throttle: 0 }); this.draw();
        } else if (e.key === '3') {
          e.preventDefault(); this.tab = 'stats'; Sound.play('hero_file_tab', { vol: .48, throttle: 0 }); this.draw();
        } else if (e.key === '4') {
          e.preventDefault(); this.tab = 'extras'; Sound.play('hero_file_tab', { vol: .48, throttle: 0 }); this.draw();
        } else if ((e.key === ' ' || e.key === 'r' || e.key === 'R') && this.tab === 'skills' && this._previewStage) {
          e.preventDefault(); Sound.play('hero_file_replay', { vol: .5, throttle: 0 }); this.playPreview(this._previewStage);
        }
      };
      window.addEventListener('keydown', this._boundKeyHandler);
    }

    const restoreScroll = () => {
      const nextContent = typeof document !== 'undefined' ? document.querySelector('.hero-profile-content') : null;
      const nextShell = typeof document !== 'undefined' ? document.querySelector('.hero-profile-shell') : null;
      if (nextContent && savedContentScroll) nextContent.scrollTop = savedContentScroll;
      if (nextShell && savedShellScroll) nextShell.scrollTop = savedShellScroll;
    };
    if (typeof requestAnimationFrame === 'function') requestAnimationFrame(restoreScroll);
    else setTimeout(restoreScroll, 0);

    if (opening) modalBox.classList.add('hero-profile-opening');
    if (this._heroOpenSoundPending) {
      this._heroOpenSoundPending = false;
      Sound.play('hero_file_open', { vol: .56, throttle: 0 });
      setTimeout(() => { if ($('#modalBox.hero-profile-box')) Sound.play('ding', { vol: .28, throttle: 0 }); }, 170);
    }
    if (this._previewStage) requestAnimationFrame(() => this.startPreview(this._previewStage));
  },

  /* ---------- skills ---------- */
  skillsTab(id) {
    const h = Save.hero(id), d = HEROES[id];
    const entries = [{ key: 'basic', name: d.basic.name, icon: '●', color: '#d6dbe2', unlocked: true, level: null }]
      .concat(SKILL_ORDER.filter(key => d.skills[key]).map(key => ({ key, name: d.skills[key].name,
        icon: { W:'★', G:'◆', B:'⬢', P:'✦', R:'✖' }[key], color: RARITY_COLORS[SKILL_RARITY[key]],
        unlocked: h.rarity >= SKILL_RARITY[key], level: h.skills[key] })));
    if (!entries.some(x => x.key === this.skillKey)) this.skillKey = entries[0].key;
    const selected = entries.find(x => x.key === this.skillKey);
    const wrap = el('div', 'hero-skills');
    const rail = el('div', 'hero-skill-rail');
    entries.forEach(entry => {
      const n = el('button', 'hero-skill-pick' + (entry.key === selected.key ? ' selected' : '') + (entry.unlocked ? '' : ' locked'));
      n.style.setProperty('--skill-color', entry.color);
      const sk = entry.key === 'basic' ? d.basic : d.skills[entry.key];
      let subtag = 'BASIC';
      if (entry.key === 'basic') {
        subtag = sk.hits > 1 ? `${sk.hits} HITS` : `${Math.round(sk.ratio * 100)}%`;
      } else if (entry.unlocked) {
        subtag = `LV ${entry.level}` + (sk.cd ? ` · ${skillCooldown(sk, entry.level).toFixed(1)}s` : sk.energy ? ' · 100EN' : !sk.cast ? ' · PASSIVE' : '');
      } else {
        subtag = '🔒 ' + RARITY_NAMES[SKILL_RARITY[entry.key]];
      }
      n.title = `${entry.name} (${entry.key === 'basic' ? 'Basic Attack' : RARITY_NAMES[SKILL_RARITY[entry.key]] + ' Skill'})`;
      n.innerHTML = `<i>${entry.icon}</i><span>${entry.name}</span><small>${subtag}</small>`;
      n.onclick = () => { this.skillKey = entry.key; Sound.play('hero_file_tab', { vol: .42, throttle: 0 }); this.draw(); };
      rail.appendChild(n);
    });
    wrap.appendChild(rail);

    const work = el('div', 'hero-skill-work');
    const key = selected.key;
    const skill = key === 'basic' ? d.basic : d.skills[key];
    const unlocked = key === 'basic' || h.rarity >= SKILL_RARITY[key];
    const descHtml = SkillDesc.format(id, key, skill, key === 'basic' ? 1 : h.skills[key]);
    const preview = this.skillPreview(id, key, skill);
    work.appendChild(preview);
    const detail = el('section', 'hero-skill-detail');
    detail.style.setProperty('--skill-color', selected.color);
    detail.innerHTML = `<div class="hero-skill-header-row">
      <div class="hero-skill-kicker">${key === 'basic' ? 'BASIC ATTACK' : RARITY_NAMES[SKILL_RARITY[key]].toUpperCase() + ' SKILL'} ${!unlocked ? '· LOCKED' : ''}</div>
      ${SkillDesc.modeToggleHtml()}
    </div>
    <h2>${skill.name}</h2><div class="hero-skill-meta">
      <span>${skill.type === 'magic' ? '✨ Magic' : skill.type || (skill.cast ? 'Active' : 'Passive')}</span>
      ${skill.range ? `<span>🎯 Range ${skill.range}</span>` : ''}${skill.hits > 1 ? `<span>💥 ${skill.hits} hits</span>` : ''}
      ${skill.cd ? `<span>⏱️ ${skillCooldown(skill, h.skills[key] || 1).toFixed(1)}s cooldown</span>` : ''}${skill.energy ? '<span>🔋 100 Energy</span>' : ''}${key !== 'basic' && !skill.cast ? '<span>📜 Passive</span>' : ''}</div>
    <div class="hero-skill-description sk-desc-root sk-mode-${SkillDesc.getMode()}">${descHtml}</div>`;
    if (!unlocked) detail.appendChild(el('div', 'hero-skill-lock', `Raise rarity to ${RARITY_NAMES[SKILL_RARITY[key]]} to unlock.`));
    if (key !== 'basic' && unlocked) {
      const lv = h.skills[key], cost = skillCost(lv), actions = el('div', 'hero-skill-actions');
      const st = SkillDesc.getStats(id);
      const preview = SkillDesc.rankPreview(skill, lv, st);
      if (preview) {
        const nextEl = el('div', 'hero-skill-next');
        nextEl.innerHTML = `<div class="sk-next-head"><span>NEXT RANK PROJECTION</span><small>LV ${lv} → ${lv + 1}</small></div><div class="sk-next-grid">${preview}</div>`;
        detail.appendChild(nextEl);
      }
      actions.innerHTML = `<div><small>SKILL LEVEL</small><b>${lv} / ${Progress.skillCap(id)}</b></div>`;
      const one = el('button', null, `UPGRADE · 📼${cost.tape} · ✦${cost.notes} · ${RES.ichor.icon}${fmt(cost.ichor)}`);
      const five = el('button', null, '+5');
      const max = el('button', null, 'MAX');
      one.onclick = () => { Progress.skillUp(id, key, 1); this.draw(); };
      five.onclick = () => { Progress.skillUp(id, key, 5); this.draw(); };
      max.onclick = () => { Progress.skillUp(id, key, 999); this.draw(); };
      if (lv >= Progress.skillCap(id)) one.disabled = five.disabled = max.disabled = true;
      actions.appendChild(one); actions.appendChild(five); actions.appendChild(max); detail.appendChild(actions);
    }
    work.appendChild(detail);
    wrap.appendChild(work);
    return wrap;
  },

  skillPreview(id, key, skill) {
    const d = HEROES[id], base = HERO_CINEMATICS[id] || {};
    const fallback = d.role === 'Support' ? { cast:'HealEffect', impact:'BlessedEffect', col:'#7ce4a0', ally:true }
      : d.role === 'Tank' ? { cast:'ArmorEffect', impact:'ShockEffect', col:'#6cc4ff' }
      : d.role === 'Control' ? { cast:'CurseEffect', impact:'SlowEffect', col:'#c99bff' }
      : { cast:'RageEffect', impact:'ShockEffect', col:'#ff7b7b' };
    const signatureFx = { scraps:'CharmEffect', cocoa:'BlessedEffect', vee:'ShockEffect' };
    const cfg = Object.assign({}, fallback, base);
    cfg.cast = cfg.cast || signatureFx[cfg.signature] || fallback.cast;
    cfg.impact = cfg.impact || fallback.impact;
    cfg.ally = typeof cfg.ally === 'function' ? cfg.ally(key) : !!cfg.ally;
    cfg.passive = key !== 'basic' && !skill.cast;
    cfg.ultimate = key === 'W' || key === 'R';
    cfg.basic = key === 'basic';
    cfg.skillName = skill.name;
    cfg.id = id;
    cfg.previewKey = key;
    cfg.originalArt = Art.hero(id);
    cfg.actionArt = Art.skillHero(id, key) || (BATTLE_HERO_ART[id] ? Art.battleHero(id) : null);
    const gourdyPreview = id === 'Gourdy' && GOURDY_SKILL_PREVIEWS[key];
    const toodlesPreview = id === 'Toodles' && TOODLES_SKILL_PREVIEWS[key];
    const rodgerPreview = id === 'Rodger' && RODGER_SKILL_PREVIEWS[key];
    const shrimpoPreview = id === 'Shrimpo' && SHRIMPO_SKILL_PREVIEWS[key];
    const veePreview = id === 'Vee' && VEE_SKILL_PREVIEWS[key];
    const flytePreview = id === 'Flyte' && FLYTE_SKILL_PREVIEWS[key];
    const sproutPreview = id === 'Sprout' && SPROUT_SKILL_PREVIEWS[key];
    const bassiePreview = id === 'Bassie' && BASSIE_SKILL_PREVIEWS[key];
    const waxwellPreview = id === 'Waxwell' && WAXWELL_SKILL_PREVIEWS[key];
    const phantasiaPreview = id === 'Phantasia' && PHANTASIA_SKILL_PREVIEWS[key];
    const rudiePreview = id === 'Rudie' && RUDIE_SKILL_PREVIEWS[key];
    const tishaPreview = id === 'Tisha' && TISHA_SKILL_PREVIEWS[key];
    const collabPreview = COLLAB_SKILL_PREVIEWS[id] && COLLAB_SKILL_PREVIEWS[id][key];
    const bespokePreview = gourdyPreview || toodlesPreview || rodgerPreview || shrimpoPreview || veePreview || flytePreview || sproutPreview || bassiePreview || waxwellPreview || phantasiaPreview || rudiePreview || tishaPreview || collabPreview;
    if (bespokePreview) Object.assign(cfg, bespokePreview);
    if (cfg.basic) {
      const hash = id.split('').reduce((n, c) => n + c.charCodeAt(0), 0);
      cfg.ally = false;
      cfg.ultimate = false;
      cfg.attackKind = skill.proj ? 'ranged' : skill.range < 240 ? 'melee' : 'reach';
      cfg.motion = skill.shake || /heavy|blade/i.test(skill.sfx || '') ? 'heavy'
        : /stab/i.test(skill.sfx || '') ? 'stab'
        : /claw|slash/i.test((skill.sfx || '') + (skill.hit || '')) ? 'claw'
        : /bounce|bump|nibble/i.test((skill.name || '') + (skill.note || '')) ? 'bounce' : 'swing';
      cfg.hitKind = /slash/i.test(skill.hit || '') ? 'slash' : /magic|water/i.test(skill.hit || '') ? 'magic' : 'blunt';
      cfg.hits = skill.hits || 1;
      cfg.variant = hash % 4;
      cfg.col = skill.pcol || cfg.col || fallback.col;
      const specialShots = {
        Cocoa: { kind:'item', img:'Bonbon' }, Gigi: { kind:'item', img:'Gumballs' },
        Gourdy: { kind:'item', img:'Pumpkin' }, Rodger: { kind:'obj', img:'Book' },
        Delilah: { kind:'obj', img:'researchcapsule' }
      };
      cfg.basicShot = skill.pimg ? { kind: skill.proj === 'obj' ? 'obj' : 'item', img: skill.pimg }
        : specialShots[id] || null;
      cfg.basicWeapon = !skill.proj && cfg.prop ? cfg.prop : (id === 'Bassie' ? { kind:'item', img:'Baskets' } : null);
    }
    /* Previews used to be silent because their animation loop never entered
       the battle sound route. Basics can use the exact authored attack pair;
       skills share the Hero's cinematic cast/impact pair used in combat. */
    cfg.castCue = cfg.basic ? (skill.sfx || (cfg.attackKind === 'ranged' ? 'whoosh' : 'swing_light'))
      : (cfg.s1 || (cfg.passive ? 'sparkle' : 'whoosh'));
    cfg.impactCue = cfg.basic ? (skill.hit || (skill.type === 'magic' ? 'hit_magic' : 'hit_light'))
      : (cfg.passive ? null : (cfg.s2 || (cfg.ally ? 'sparkle' : 'hit_magic')));
    if (bespokePreview) {
      cfg.castCue = bespokePreview.castCue;
      cfg.impactCue = bespokePreview.impactCue;
    }
    cfg.castAt = cfg.basic ? (cfg.attackKind === 'ranged' ? 180 : 150) : (cfg.passive ? 260 : 120);
    cfg.impactAt = cfg.basic ? (cfg.attackKind === 'ranged' ? 570 : 430) : cfg.ultimate ? 690 : 610;
    // Read the animation calls authored by the kit itself. A skill that calls
    // B.anim(u, 'spin', ...) now spins here; one that guards/casts uses its cast
    // pose; multi-stage skills can move through more than one real action clip.
    const castSource = skill.cast ? String(skill.cast) : skill.passive ? String(skill.passive) : '';
    cfg.visualKind = heroPreviewVisualKind(skill, castSource);
    const explicitActions = cfg.previewActions || ((!cfg.basic && typeof COLLAB_PREVIEW_ACTIONS !== 'undefined'
      && COLLAB_PREVIEW_ACTIONS[id]) ? COLLAB_PREVIEW_ACTIONS[id][key] : null);
    cfg.actions = cfg.basic ? ['attack'] : explicitActions ||
      Array.from(castSource.matchAll(/B\.anim\(u,\s*['"](\w+)['"]\s*,\s*([\d.]+)/g), m => ({ state: m[1], dur: Number(m[2]) || .4 }));
    if (!cfg.actions.length) cfg.actions = [{ state: cfg.passive ? 'idle' : cfg.ally ? 'cast' : 'attack', dur: .45 }];
    if (typeof cfg.actions[0] === 'string') cfg.actions = cfg.actions.map(state => ({ state, dur: .4 }));
    cfg.dashes = cfg.basic ? cfg.attackKind !== 'ranged'
      : !!cfg.dashes || cfg.shrimpoMode === 'bully' || cfg.shrimpoMode === 'spite' || /B\.(?:dash|blink|pull)\s*\(/.test(castSource);
    cfg.projectile = cfg.basic ? cfg.attackKind === 'ranged'
      : !!cfg.projectile || cfg.gourdyMode === 'toss' || cfg.rodgerMode === 'capsule' || /(?:fxProj|fxArc|projectile)\s*\(/i.test(castSource);
    cfg.slash = cfg.basic ? cfg.attackKind !== 'ranged' : /(?:fxSlash|spinUnit|fxRing)\s*\(/.test(castSource);
    if (!cfg.basic && !bespokePreview && cfg.visualKind === 'slash') cfg.dashes = true;
    cfg.hitCount = Math.max(1, Number(skill.hits || (skill.p && skill.p.hits) || 1));
    if (cfg.hitCount > 1 && !cfg.hitTimes) {
      const spread = Math.min(.22, .035 * (cfg.hitCount - 1));
      cfg.hitTimes = Array.from({ length: cfg.hitCount }, (_, i) =>
        .52 - spread / 2 + (i / Math.max(1, cfg.hitCount - 1)) * spread);
    }
    cfg.actorAtlases = cfg.actionArt ? null : (typeof COLLAB_SPRITES !== 'undefined' ? COLLAB_SPRITES[id] : null);
    // Only play a flipbook overlay when combat itself has that exact authored
    // status sequence. Collaboration atlases and signature Heroes already
    // carry their own effects; the old role-based fallback was the source of
    // the conspicuous placeholder smoke/rings in this preview.
    cfg.cinematicFx = (!!cfg.forceCinematicFx || !!HERO_CINEMATICS[id]) && !base.noSequence && !base.signature && !cfg.actorAtlases && !cfg.sproutMode && !cfg.bassieMode && !cfg.waxMode;
    const maps = ['rainbow-rooms','art-floor','library-floor','vee-floor','greenhouse'];
    const map = maps[Math.abs(id.split('').reduce((n, c) => n + c.charCodeAt(0), 0)) % maps.length];
    const targetId = cfg.ally ? (Save.ownedIds().find(x => x !== id) || id) : null;
    const propSrc = x => x ? (x.kind === 'obj' ? Art.object(x.img) : Art.item(x.img)) : '';
    const prop = propSrc(cfg.prop);
    const basicShot = cfg.basic ? propSrc(cfg.basicShot) : '';
    const basicWeapon = cfg.basic ? propSrc(cfg.basicWeapon) : '';
    cfg.projectileSrc = basicShot || (cfg.projectile ? prop : '');
    cfg.propSrc = prop || basicWeapon;
    if (cfg.gourdyMode === 'toss') cfg.projectileSrc = Art.item('Pumpkin');
    if (cfg.rodgerMode === 'capsule') cfg.projectileSrc = Art.object('researchcapsule');
    if (cfg.projectileObject) cfg.projectileSrc = Art.object(cfg.projectileObject);
    if (cfg.gourdyMode) cfg.propSrc = '';
    if (cfg.rodgerMode) cfg.propSrc = '';
    if (cfg.shrimpoMode) cfg.propSrc = '';
    if (cfg.veeMode) cfg.propSrc = '';
    if (cfg.flyteMode) cfg.propSrc = '';
    if (cfg.sproutMode || cfg.bassieMode || cfg.waxMode || cfg.rudieMode) { cfg.propSrc = ''; cfg.projectileSrc = ''; }
    const actorW = clamp(78 * (d.scale || 1), 78, 138);
    const targetDef = targetId ? HEROES[targetId] : null;
    cfg.actorW = actorW;
    cfg.targetW = targetDef ? clamp(54 * (targetDef.scale || 1), 62, 104) : 68;
    cfg.targetId = targetId;
    cfg.targetAtlases = targetId && typeof COLLAB_SPRITES !== 'undefined' ? COLLAB_SPRITES[targetId] : null;
    cfg.simulation = SkillPreviewSimulator.run(cfg, skill, key);
    if (cfg.simulation.actions.length) cfg.actions = cfg.simulation.actions;
    if (cfg.simulation.hitTimes.length) cfg.hitTimes = cfg.simulation.hitTimes;
    const fighter = (who, heroId, ally, atlases, width) => {
      const art = heroId ? Art.hero(heroId) : Art.weakling('Sponge');
      const name = heroId ? HEROES[heroId].name : 'Training Sponge';
      const carriedSword = heroId === 'Soulvester'
        ? `<img class="preview-carried-sword" src="${ASSET}uploads/image-31.png" alt="" aria-hidden="true">` : '';
      return `<div class="preview-combatant preview-${who}-fighter${ally ? ' ally-target' : ''}" style="--fighter-w:${width}px">
        <div class="preview-combat-shadow"></div>
        <div class="preview-combat-body">${atlases ? '<div class="preview-natural-sprite" aria-hidden="true"></div>' : `<img src="${art}" alt="">`}${carriedSword}</div>
        <div class="preview-combat-hud"><b>${name}</b><span><i></i><u></u></span></div>
      </div>`;
    };
    const gourdySprites = cfg.gourdyMode ? (() => {
      const items = cfg.gourdyMode === 'treat'
        ? ['Pumpkin', 'Skillcheckcandy', 'Speedcandy', 'Staminacandy', 'Enigmacandy']
        : cfg.gourdyMode === 'rush'
          ? ['Speedcandy', 'Staminacandy', 'Speedcandy', 'Enigmacandy', 'Speedcandy', 'Skillcheckcandy']
          : ['Pumpkin', 'Pumpkin'];
      return `<div class="preview-gourdy-layer gourdy-${cfg.gourdyMode}">${items.map((img, i) =>
        `<img class="preview-gourdy-sprite gourdy-sprite-${i}" data-sprite-index="${i}" src="${Art.item(img)}" alt="">`).join('')}
        <div class="preview-gourdy-callout"></div></div>`;
    })() : '';
    const toodlesSprites = cfg.toodlesMode ? `<div class="preview-toodles-layer toodles-${cfg.toodlesMode}">
      <i class="toodles-token damage">⚔</i><i class="toodles-token defense">🛡</i><i class="toodles-token speed">🏃</i><i class="toodles-token support">💚</i>
      <div class="preview-toodles-star">✦</div><div class="preview-toodles-callout"></div></div>` : '';
    const rodgerSprites = cfg.rodgerMode ? (() => {
      const items = cfg.rodgerMode === 'research'
        ? [{ kind:'obj', img:'Book' }, { kind:'obj', img:'Magifyingglass' }, { kind:'item', img:'paper' }, { kind:'item', img:'paper' }, { kind:'item', img:'paper' }]
        : cfg.rodgerMode === 'capsule'
          ? [{ kind:'obj', img:'researchcapsule' }, { kind:'obj', img:'researchcapsule' }, { kind:'obj', img:'Magifyingglass' }]
          : [{ kind:'obj', img:'Book' }, { kind:'item', img:'paper' }, { kind:'item', img:'paper' }, { kind:'item', img:'paper' }, { kind:'obj', img:'Magifyingglass' }];
      return `<div class="preview-rodger-layer rodger-${cfg.rodgerMode}">${items.map((item, i) =>
        `<img class="preview-rodger-sprite rodger-sprite-${i}" data-sprite-index="${i}" src="${item.kind === 'obj' ? Art.object(item.img) : Art.item(item.img)}" alt="">`).join('')}
        <div class="preview-rodger-scan"><i></i><i></i><i></i><i></i></div><div class="preview-rodger-callout"></div></div>`;
    })() : '';
    const shrimpoSprites = cfg.shrimpoMode ? `<div class="preview-shrimpo-layer shrimpo-${cfg.shrimpoMode}">
      ${Array.from({ length: 6 }, (_, i) => `<img class="preview-shrimpo-brick shrimpo-brick-${i}" src="${Art.item('Trinkets/SHRIMPO_Brick')}" alt="">`).join('')}
      <div class="preview-shrimpo-spite">${Array.from({ length: 10 }, () => '<i></i>').join('')}</div>
      <div class="preview-shrimpo-smash"><i></i><i></i><i></i><i></i><i></i><i></i></div>
      <div class="preview-shrimpo-callout"></div></div>` : '';
    const veeSprites = cfg.veeMode ? `<div class="preview-vee-layer vee-${cfg.veeMode}">
      <img class="preview-vee-remote" src="${Art.item('Trinkets/VEE_Veemote')}" alt="">
      ${[2, 4, 6].map((frame, i) => `<img class="preview-vee-light vee-light-${i}" src="${ASSET}VFX/particle/spotlight_0${frame}.png" alt="">`).join('')}
      <div class="preview-vee-signal"><i></i><i></i><i></i></div>
      <div class="preview-vee-screen"><small></small><b></b><span><i></i><i></i><i></i><i></i><i></i></span></div>
      <div class="preview-vee-crowd">${Array.from({ length: 9 }, (_, i) => `<i style="--crowd-i:${i}"></i>`).join('')}</div>
      <div class="preview-vee-reticle"><i></i><i></i><i></i><i></i></div></div>` : '';
    const flytePassId = cfg.flyteMode === 'clear' ? (Save.ownedIds().find(x => x !== id) || 'Boxten') : null;
    const flyteSprites = cfg.flyteMode ? `<div class="preview-flyte-layer flyte-${cfg.flyteMode}">
      <div class="preview-flyte-zone"><i></i><i></i><i></i><i></i></div>
      <div class="preview-flyte-wind">${Array.from({ length: 7 }, (_, i) => `<i style="--wind-i:${i}"></i>`).join('')}</div>
      <div class="preview-flyte-shield"><i></i><i></i><i></i></div>
      <div class="preview-flyte-push"><i></i><i></i><i></i><i></i></div>
      ${flytePassId ? `<img class="preview-flyte-pass-ally" src="${Art.hero(flytePassId)}" alt="">` : ''}
      <div class="preview-flyte-callout"></div><div class="preview-flyte-buff-callout">HASTE!</div></div>` : '';
    const sproutSprites = cfg.sproutMode ? `<div class="preview-sprout-layer sprout-${cfg.sproutMode}">
      ${Array.from({ length: 5 }, (_, i) => `<img class="preview-sprout-treat sprout-treat-${i}" src="${Art.item(i % 2 ? 'Brownie' : 'Proteinbar')}" alt="">`).join('')}
      <div class="preview-sprout-vines"><i></i><i></i><i></i><i></i></div>
      <div class="preview-sprout-heart"></div><div class="preview-sprout-shield"></div>
      <div class="preview-sprout-callout"></div></div>` : '';
    const bassieSprites = cfg.bassieMode ? `<div class="preview-bassie-layer bassie-${cfg.bassieMode}">
      ${Array.from({ length: 8 }, (_, i) => `<img class="preview-bassie-food bassie-food-${i}" src="${Art.item(['Apple', 'Bread', 'Cherry', 'Pretzel'][i % 4])}" alt="">`).join('')}
      <img class="preview-bassie-basket" src="${Art.item('Baskets')}" alt="">
      <div class="preview-bassie-ring"></div><div class="preview-bassie-stock">${Array.from({ length: 7 }, () => '<i></i>').join('')}</div>
      <div class="preview-bassie-callout"></div></div>` : '';
    const waxTargetArt = cfg.targetId ? Art.hero(cfg.targetId) : Art.hero('Boxten');
    const waxSprites = cfg.waxMode ? `<div class="preview-wax-layer wax-${cfg.waxMode}">
      <div class="preview-wax-trail"><i></i><i></i><i></i><i></i><i></i></div>
      <div class="preview-wax-pools"><i></i><i></i><i></i><i></i></div>
      <div class="preview-wax-lock"><i></i><i></i><i></i><i></i></div>
      <img class="preview-wax-figure" src="${waxTargetArt}" alt="">
      <div class="preview-wax-network"><i></i><i></i><i></i></div>
      <div class="preview-wax-callout"></div></div>` : '';
    const rudieSprites = cfg.rudieMode ? `<div class="preview-rudie-layer rudie-${cfg.rudieMode}">
      <img class="preview-rudie-wind" src="${ASSET}assets/fx/rudie-wind-rush.png" alt="">
      <img class="preview-rudie-hoof" src="${ASSET}assets/fx/rudie-hoof-barrage.png" alt="">
      <div class="preview-rudie-speed"><i></i><i></i><i></i><i></i><i></i></div>
      <div class="preview-rudie-callout"></div></div>` : '';
    const stage = el('div', 'skill-preview-stage live-preview' + (cfg.passive ? ' passive' : '') + (cfg.ultimate ? ' ultimate' : '')
      + (cfg.id === 'Brightney' ? ` brightney-preview brightney-preview-${String(cfg.previewKey).toLowerCase()}` : '')
      + (cfg.id === 'Blot' ? ` blot-preview blot-preview-${String(cfg.previewKey).toLowerCase()}` : '')
      + (cfg.toodlesMode ? ` toodles-preview-${cfg.toodlesMode}` : '')
      + (cfg.shrimpoMode ? ` shrimpo-preview-${cfg.shrimpoMode}` : '') + (cfg.veeMode ? ` vee-preview-${cfg.veeMode}` : '')
      + (cfg.flyteMode ? ` flyte-preview-${cfg.flyteMode}` : '') + (cfg.sproutMode ? ` sprout-preview-${cfg.sproutMode}` : '')
      + (cfg.bassieMode ? ` bassie-preview-${cfg.bassieMode}` : '') + (cfg.waxMode ? ` wax-preview-${cfg.waxMode}` : '')
      + (cfg.rudieMode ? ` rudie-preview-${cfg.rudieMode}` : '')
      + ` preview-kind-${cfg.visualKind}`);
    stage.style.cssText += `--preview-color:${cfg.col};background-image:linear-gradient(180deg,#07101359,#071013b8),url("${bgForMap(map)}")`;
    const previewType = cfg.previewType || (cfg.basic ? (cfg.attackKind === 'ranged' ? 'RANGED BASIC' : cfg.attackKind === 'melee' ? 'MELEE BASIC' : 'REACH BASIC')
      : cfg.passive ? 'PASSIVE' : cfg.ultimate ? 'ULTIMATE' : 'SKILL');
    stage.innerHTML = `<div class="skill-preview-label">
      <span><b>${cfg.skillName}</b><small>${previewType} · BATTLE REPLAY</small></span>
      <div class="skill-preview-btns">
        <button type="button" class="preview-btn preview-speed" title="Toggle Speed (1× / 0.5×)">1×</button>
        <button type="button" class="preview-btn preview-pause" title="Pause / Resume">⏸</button>
        <button type="button" class="preview-btn preview-replay" aria-label="Replay ${cfg.skillName} preview with sound" title="Replay (Space / R)">↻</button>
      </div>
    </div>
      <div class="preview-arena-floor"><i></i><i></i><i></i></div>
      ${fighter('actor', id, false, cfg.actorAtlases, cfg.actorW)}
      ${fighter('target', targetId, cfg.ally, cfg.targetAtlases, cfg.targetW)}
      ${cfg.id === 'Blot' && cfg.previewKey === 'W' ? `<img class="preview-blot-decoy" src="${ASSET}assets/fx/blot-decoy.png" alt="" aria-hidden="true">` : ''}
      <div class="preview-authored-fx" aria-hidden="true"><i></i><i></i><i></i><b></b></div>
      <div class="preview-live-fx preview-cast-fx"><img src="${Art.vfx(cfg.cast, 0)}" alt=""></div>
      <div class="preview-live-fx preview-impact-fx"><img src="${Art.vfx(cfg.impact, 0)}" alt=""></div>
      <div class="preview-live-projectile">${cfg.projectileSrc ? `<img src="${cfg.projectileSrc}" alt="">` : '<i></i>'}</div>
      ${cfg.propSrc ? `<img class="preview-live-prop" src="${cfg.propSrc}" alt="">` : '<i class="preview-live-prop energy"></i>'}
      <div class="preview-hit-burst"><i></i><i></i><i></i></div>
      <div class="preview-float-number"></div>
      ${gourdySprites}
      ${toodlesSprites}
      ${rodgerSprites}
      ${shrimpoSprites}
      ${veeSprites}
      ${flyteSprites}
      ${sproutSprites}
      ${bassieSprites}
      ${waxSprites}
      ${rudieSprites}
      <div class="preview-screen-flash"></div>
      <div class="preview-playhead"><i></i></div>`;
    stage._preview = cfg;
    stage._previewSpeed = stage._previewSpeed || 1;
    stage._previewPaused = false;
    const speedBtn = $('.preview-speed', stage);
    const pauseBtn = $('.preview-pause', stage);
    const replayBtn = $('.preview-replay', stage);
    if (speedBtn) {
      speedBtn.onclick = () => {
        stage._previewSpeed = stage._previewSpeed === 1 ? 0.5 : 1;
        speedBtn.textContent = `${stage._previewSpeed}×`;
        speedBtn.classList.toggle('active', stage._previewSpeed !== 1);
        Sound.play('ui_move');
      };
    }
    if (pauseBtn) {
      pauseBtn.onclick = () => {
        stage._previewPaused = !stage._previewPaused;
        pauseBtn.textContent = stage._previewPaused ? '▶' : '⏸';
        pauseBtn.classList.toggle('active', stage._previewPaused);
        Sound.play('ui_move');
      };
    }
    if (replayBtn) {
      replayBtn.onclick = () => {
        stage._previewPaused = false;
        if (pauseBtn) { pauseBtn.textContent = '⏸'; pauseBtn.classList.remove('active'); }
        Sound.play('hero_file_replay', { vol: .5, throttle: 0 });
        this.playPreview(stage);
      };
    }
    this._previewStage = stage;
    return stage;
  },

  playPreview(stage) {
    if (!stage || !stage.isConnected) return;
    if (this._previewRaf) cancelAnimationFrame(this._previewRaf);
    (this._previewTimers || []).forEach(x => { clearTimeout(x); clearInterval(x); });
    this._previewTimers = [];
    stage.classList.remove('playing'); void stage.offsetWidth; stage.classList.add('playing');
    const cfg = stage._preview;
    // These dimensions are stable for the life of a preview. Re-reading
    // clientWidth/clientHeight from every authored effect each frame can
    // force layout while the preview is already doing animation work.
    stage._previewW = stage.clientWidth;
    stage._previewH = stage.clientHeight;
    stage._previewSpeed = stage._previewSpeed || 1;
    if (cfg.gourdyMode === 'toss') cfg.gourdyOutcome = pick(['STUN!', 'SILENCE!', 'SLOW!', 'MANA DRAIN!']);
    const soundAt = (cue, delay, vol) => {
      if (!cue) return;
      const t = setTimeout(() => {
        if (stage.isConnected && !stage._previewPaused) Sound.play(cue, { vol, throttle: 0, tag: 'skill-preview' });
      }, delay / (stage._previewSpeed || 1));
      this._previewTimers.push(t);
    };
    const sim = cfg.simulation || {};
    const duration = Math.round((sim.duration || (cfg.passive ? 1.65 : cfg.ultimate ? 2.2 : cfg.basic ? 1.8 : 2)) * 1000);
    const actionStart = .12, actionEnd = .70;
    const actionTotal = cfg.actions.reduce((n, action) => n + Math.max(.12, Number(action.dur) || .4), 0);
    const hitAt = (sim.hitTimes && sim.hitTimes[0]) || (cfg.passive ? .48 : cfg.projectile ? .56 : cfg.basic ? .44 : .52);
    const recordedVoices = Array.isArray(sim.audio) ? sim.audio.filter(e => e && e.kind === 'collab') : [];
    const voiceAt = (voice, delay) => {
      const t = setTimeout(() => {
        if (stage.isConnected && !stage._previewPaused) Sound.collab({ id: voice.id }, voice.action,
          { vol: voice.vol == null ? .72 : Math.min(.78, voice.vol), throttle: 0, tag: 'skill-preview-voice', priority: true });
      }, delay / (stage._previewSpeed || 1));
      this._previewTimers.push(t);
    };
    if (recordedVoices.length) {
      const simSeconds = Math.max(.01, Number(sim.duration) || duration / 1000);
      recordedVoices.forEach(voice => voiceAt(voice, clamp(Number(voice.t) / simSeconds, 0, .94) * duration));
    } else soundAt(cfg.castCue, duration * actionStart, cfg.ultimate ? .48 : .36);
    soundAt(cfg.impactCue, duration * hitAt, cfg.basic ? .48 : .4);
    if (cfg.ultimate) soundAt('ult', 55, .25);
    const actor = $('.preview-actor-fighter', stage), target = $('.preview-target-fighter', stage);
    const actorBody = $('.preview-combat-body', actor), targetBody = $('.preview-combat-body', target);
    const actorImg = $('img', actorBody), targetHp = $('.preview-combat-hud i', target);
    const castFx = $('.preview-cast-fx', stage), impactFx = $('.preview-impact-fx', stage);
    const authoredFx = $('.preview-authored-fx', stage);
    const projectile = $('.preview-live-projectile', stage), prop = $('.preview-live-prop', stage);
    const burst = $('.preview-hit-burst', stage), number = $('.preview-float-number', stage);
    const blotDecoy = $('.preview-blot-decoy', stage);
    const flash = $('.preview-screen-flash', stage), playhead = $('.preview-playhead i', stage);
    const easeOut = x => 1 - Math.pow(1 - clamp(x, 0, 1), 3);
    const easeInOut = x => x < .5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
    const selectedSkill = cfg.basic ? HEROES[cfg.id].basic : HEROES[cfg.id].skills[this.skillKey];
    const displayNumber = Math.max(1, sim.displayValue || 0);
    let lastActorArt = '', lastNow = performance.now(), simElapsed = 0;
    const setFlipbook = (node, folder, local, visible) => {
      if (!node) return;
      node.style.opacity = visible ? String(Math.min(1, local * 7, (1 - local) * 7)) : '0';
      if (!visible) return;
      const img = $('img', node), frame = clamp(Math.floor(local * 16), 0, 15);
      if (img && img.dataset.frame !== String(frame)) { img.dataset.frame = frame; img.src = Art.vfx(folder, frame); }
      node.style.transform = `scale(${.62 + Math.sin(local * Math.PI) * .48}) rotate(${(local - .5) * 8}deg)`;
    };
    const tick = now => {
      if (!stage.isConnected) { this.stopPreview(); return; }
      const delta = Math.min(100, Math.max(0, now - lastNow));
      lastNow = now;
      if (!stage._previewPaused) {
        simElapsed += delta * (stage._previewSpeed || 1);
      }
      const p = clamp(simElapsed / duration, 0, 1);
      const actionP = clamp((p - actionStart) / (actionEnd - actionStart), 0, .999);
      const actionT = actionP * actionTotal;
      let actionSlot = cfg.actions.length - 1, actionOffset = 0;
      for (let i = 0, passed = 0; i < cfg.actions.length; i++) {
        const span = Math.max(.12, Number(cfg.actions[i].dur) || .4);
        if (actionT < passed + span || i === cfg.actions.length - 1) {
          actionSlot = i; actionOffset = passed; break;
        }
        passed += span;
      }
      const action = cfg.actions[actionSlot] || { state: 'idle' };
      const slotSpan = Math.max(.12, Number(action.dur) || .4);
      const slotP = clamp((actionT - actionOffset) / slotSpan, 0, 1);
      const active = p >= actionStart && p < actionEnd;
      let clip = active ? (action.state === 'cast' ? 'cast' : action.state === 'idle' ? 'idle'
        : action.state === 'move' ? 'move' : action.state === 'spin' ? 'spin' : 'attack') : 'idle';
      if (cfg.dashes && p > .055 && p < actionStart) clip = 'move';
      this.drawPreviewAtlas(actorBody, cfg.actorAtlases, clip, now / 1000, slotP, cfg.actorW);
      this.drawPreviewAtlas(targetBody, cfg.targetAtlases, 'idle', now / 1000, null, cfg.targetW);
      if (actorImg) {
        const wanted = active && cfg.actionArt ? cfg.actionArt : cfg.originalArt;
        if (lastActorArt !== wanted) { actorImg.src = wanted; lastActorArt = wanted; }
        const actionFace = active && cfg.actionArt && typeof SKILL_HERO_NATIVE_FACE !== 'undefined'
          ? (SKILL_HERO_NATIVE_FACE[cfg.id] || 1) : 1;
        const face = actionFace < 0 ? -1 : 1;
        if (actorImg.dataset.faceTransform !== String(face)) {
          actorImg.dataset.faceTransform = String(face);
          actorImg.style.transform = `scaleX(${face})`;
        }
      }

      let advance = 0;
      if (cfg.dashes) {
        const holdUntil = cfg.flyteMode === 'clear' ? .79 : .66;
        const arriveAt = cfg.flyteMode ? .30 : .28;
        if (p < arriveAt) advance = easeOut((p - .06) / (arriveAt - .06));
        else if (p < holdUntil) advance = 1;
        else advance = 1 - easeInOut((p - holdUntil) / Math.max(.01, .94 - holdUntil));
      }
        const travel = stage._previewW * (cfg.flyteMode === 'clear' ? .62 : cfg.flyteMode === 'rescue' ? .52
        : cfg.shrimpoMode && cfg.dashes ? .54 : cfg.basic && cfg.attackKind === 'reach' ? .20 : .31);
      let bob = Math.sin(now / 210) * 1.5, rot = 0, sx = 1, sy = 1;
      if (active && !cfg.actorAtlases) {
        const pulse = Math.sin(slotP * Math.PI);
        if (action.state === 'cast') { bob -= pulse * 12; sx -= pulse * .08; sy += pulse * .11; }
        else if (action.state === 'spin') rot = slotP * 360;
        else if (action.state === 'wind') { rot = -pulse * 8; sx += pulse * .08; sy -= pulse * .05; }
        else if (action.state !== 'idle') { rot = -pulse * 5; sx += pulse * .09; }
        if (cfg.visualKind === 'slash') { bob -= pulse * 5; rot -= pulse * 12; sx += pulse * .08; }
        else if (cfg.visualKind === 'ring') { bob -= pulse * 8; rot += pulse * 7; sy += pulse * .08; }
        else if (cfg.visualKind === 'support') { bob -= pulse * 5; sx += pulse * .06; sy += pulse * .06; }
        else if (cfg.visualKind === 'projectile') { rot += pulse * 10; sx += pulse * .06; sy -= pulse * .04; }
        else if (cfg.visualKind === 'summon') { bob -= pulse * 10; rot -= pulse * 5; sy += pulse * .08; }
      }
      if (cfg.gourdyMode === 'treat') {
        const hop = Math.sin(clamp((p - .08) / .54, 0, 1) * Math.PI);
        bob -= hop * 13; rot += Math.sin(p * Math.PI * 6) * hop * 5; sx += hop * .10; sy += hop * .06;
      } else if (cfg.gourdyMode === 'rush') {
        const hop = Math.abs(Math.sin(clamp((p - .08) / .72, 0, 1) * Math.PI * 3));
        bob -= hop * 18; rot += Math.sin(p * Math.PI * 6) * 5; sx += hop * .08; sy -= hop * .05;
      } else if (cfg.gourdyMode === 'toss') {
        const wind = clamp((p - .08) / .26, 0, 1), snap = Math.sin(clamp((p - .32) / .24, 0, 1) * Math.PI);
        rot -= wind * 12; rot += snap * 28; bob -= snap * 7; sx += snap * .10;
      } else if (cfg.toodlesMode === 'swing') {
        const hop = Math.sin(clamp((p - .10) / .48, 0, 1) * Math.PI), swat = Math.sin(clamp((p - .34) / .25, 0, 1) * Math.PI);
        bob -= hop * 11; rot += hop * 8 - swat * 27; sx += swat * .16; sy += hop * .05;
      } else if (cfg.toodlesMode === 'roll') {
        const hop = Math.sin(clamp((p - .06) / .66, 0, 1) * Math.PI);
        bob -= hop * 23; rot += hop * Math.sin(p * Math.PI * 2) * 16 + p * 38; sx += hop * .12; sy -= hop * .08;
      } else if (cfg.toodlesMode === 'strike') {
        const brace = Math.sin(clamp((p - .06) / .28, 0, 1) * Math.PI), spring = Math.sin(clamp((p - .30) / .28, 0, 1) * Math.PI);
        bob += brace * 6 - spring * 11; rot += brace * 9 - spring * 29; sx += spring * .19; sy -= brace * .11;
      } else if (cfg.toodlesMode === 'miracle') {
        const reach = Math.sin(clamp((p - .08) / .62, 0, 1) * Math.PI);
        bob -= reach * 13; rot += Math.sin(p * Math.PI * 4) * reach * 3; sx += reach * .07; sy += reach * .10;
      } else if (cfg.toodlesMode === 'improve' || cfg.toodlesMode === 'charm') {
        const glow = Math.sin(clamp((p - .06) / .68, 0, 1) * Math.PI);
        bob -= glow * 6; rot += Math.sin(p * Math.PI * 3) * glow * 3; sx += glow * .05; sy += glow * .05;
      } else if (cfg.rodgerMode === 'research') {
        const focus = Math.sin(clamp((p - .08) / .60, 0, 1) * Math.PI);
        bob -= focus * 8; rot += Math.sin(p * Math.PI * 4) * focus * 2.5; sx -= focus * .035; sy += focus * .06;
      } else if (cfg.rodgerMode === 'capsule') {
        const wind = clamp((p - .08) / .27, 0, 1), snap = Math.sin(clamp((p - .32) / .23, 0, 1) * Math.PI);
        rot -= wind * 8; rot += snap * 21; bob -= snap * 5; sx += snap * .07;
      } else if (cfg.rodgerMode === 'case') {
        const open = Math.sin(clamp((p - .08) / .65, 0, 1) * Math.PI);
        bob -= open * 9; rot += Math.sin(p * Math.PI * 7) * open * 2; sx += open * .045; sy += open * .045;
      } else if (cfg.shrimpoMode === 'tantrum') {
        const rage = Math.sin(clamp((p - .05) / .74, 0, 1) * Math.PI);
        bob += Math.abs(Math.sin(p * Math.PI * 12)) * 7 * rage;
        rot += Math.sin(p * Math.PI * 16) * 13 * rage;
        sx += Math.abs(Math.sin(p * Math.PI * 12)) * .16 * rage; sy -= rage * .06;
      } else if (cfg.shrimpoMode === 'bully') {
        const brace = Math.sin(clamp((p - .05) / .30, 0, 1) * Math.PI);
        const slam = Math.sin(clamp((p - .31) / .28, 0, 1) * Math.PI);
        rot += brace * 12 - slam * 25; bob += brace * 7 - slam * 5; sx += slam * .18; sy -= brace * .12;
      } else if (cfg.shrimpoMode === 'spite') {
        const charge = clamp((p - .06) / .35, 0, 1), snap = Math.sin(clamp((p - .39) / .24, 0, 1) * Math.PI);
        rot += Math.sin(p * Math.PI * (8 + charge * 16)) * charge * 7 - snap * 24;
        bob += Math.abs(Math.sin(p * Math.PI * 14)) * charge * 4 - snap * 10;
        sx += charge * .12 + snap * .20; sy -= charge * .10;
      } else if (cfg.veeMode === 'spotlight') {
        const direct = Math.sin(clamp((p - .07) / .58, 0, 1) * Math.PI);
        bob -= direct * 7; rot -= direct * 5; sx += direct * .07; sy += direct * .04;
      } else if (cfg.veeMode === 'audience') {
        const applause = Math.sin(clamp((p - .06) / .65, 0, 1) * Math.PI);
        bob -= applause * 11 + Math.abs(Math.sin(p * Math.PI * 5)) * applause * 3;
        rot += Math.sin(p * Math.PI * 4) * applause * 4; sx += applause * .06; sy += applause * .07;
      } else if (cfg.veeMode === 'commercial') {
        const cut = Math.sin(clamp((p - .06) / .68, 0, 1) * Math.PI), snap = Math.sin(clamp((p - .25) / .25, 0, 1) * Math.PI);
        bob -= cut * 6; rot += snap * 8 - cut * 3; sx += snap * .08; sy += cut * .05;
      } else if (cfg.flyteMode === 'gust') {
        const lift = Math.sin(clamp((p - .05) / .72, 0, 1) * Math.PI);
        bob -= lift * 18 + Math.sin(p * Math.PI * 6) * lift * 3;
        rot += Math.sin(p * Math.PI * 4) * lift * 8; sx += lift * .08; sy += lift * .10;
      } else if (cfg.flyteMode === 'rescue') {
        const dive = Math.sin(clamp((p - .06) / .34, 0, 1) * Math.PI), brace = Math.sin(clamp((p - .27) / .34, 0, 1) * Math.PI);
        bob -= dive * 12 + brace * 7; rot -= dive * 20; sx += dive * .16 + brace * .08; sy -= dive * .12;
      } else if (cfg.flyteMode === 'clear') {
        const sweep = Math.sin(clamp((p - .05) / .73, 0, 1) * Math.PI);
        bob -= sweep * 15 + Math.sin(p * Math.PI * 8) * sweep * 3;
        rot -= sweep * 24; sx += sweep * .24; sy -= sweep * .15;
      } else if (cfg.sproutMode === 'bake') {
        const knead = Math.sin(clamp((p - .06) / .54, 0, 1) * Math.PI);
        bob -= knead * 8; rot += Math.sin(p * Math.PI * 4) * knead * 3; sx += knead * .07; sy += knead * .06;
      } else if (cfg.sproutMode === 'rush') {
        const run = clamp((p - .05) / .25, 0, 1), settle = Math.sin(clamp((p - .34) / .36, 0, 1) * Math.PI);
        bob -= Math.abs(Math.sin(p * Math.PI * 8)) * 4 * run + settle * 6; rot -= run * 9; sx += run * .08; sy -= run * .04;
      } else if (cfg.sproutMode === 'oven') {
        const open = Math.sin(clamp((p - .07) / .58, 0, 1) * Math.PI);
        bob -= open * 10; rot += Math.sin(p * Math.PI * 5) * open * 2; sx += open * .06; sy += open * .06;
      } else if (cfg.sproutMode === 'watch') {
        const watch = Math.sin(clamp((p - .08) / .66, 0, 1) * Math.PI);
        bob -= watch * 4; rot += Math.sin(p * Math.PI * 2) * watch * 3; sx += watch * .035; sy += watch * .035;
      } else if (cfg.sproutMode === 'save') {
        const intervene = Math.sin(clamp((p - .05) / .48, 0, 1) * Math.PI);
        bob -= intervene * 14; rot -= intervene * 14; sx += intervene * .12; sy -= intervene * .08;
      } else if (cfg.bassieMode === 'sharing') {
        const open = Math.sin(clamp((p - .06) / .52, 0, 1) * Math.PI);
        bob -= open * 7; rot += Math.sin(p * Math.PI * 4) * open * 3; sx += open * .08; sy += open * .05;
      } else if (cfg.bassieMode === 'packed') {
        const open = Math.sin(clamp((p - .06) / .64, 0, 1) * Math.PI);
        bob -= open * 10; rot += Math.sin(p * Math.PI * 3) * open * 2; sx += open * .06; sy += open * .07;
      } else if (cfg.bassieMode === 'toss') {
        const wind = Math.sin(clamp((p - .05) / .24, 0, 1) * Math.PI), snap = Math.sin(clamp((p - .32) / .30, 0, 1) * Math.PI);
        bob += wind * 5 - snap * 6; rot -= wind * 10 + snap * 18; sx += snap * .12; sy -= wind * .05;
      } else if (cfg.bassieMode === 'prepared') {
        const ready = Math.sin(clamp((p - .08) / .66, 0, 1) * Math.PI);
        bob -= ready * 5; rot += Math.sin(p * Math.PI * 2) * ready * 3; sx += ready * .04; sy += ready * .05;
      } else if (cfg.bassieMode === 'overflow') {
        const charge = Math.sin(clamp((p - .05) / .72, 0, 1) * Math.PI);
        bob -= charge * 9; rot += Math.sin(p * Math.PI * 5) * charge * 4; sx += charge * .07; sy += charge * .08;
      } else if (cfg.waxMode === 'ignite') {
        const light = Math.sin(clamp((p - .06) / .62, 0, 1) * Math.PI);
        bob -= light * 8; rot += Math.sin(p * Math.PI * 3) * light * 3; sx += light * .06; sy += light * .07;
      } else if (cfg.waxMode === 'melt') {
        const pour = Math.sin(clamp((p - .06) / .62, 0, 1) * Math.PI);
        bob -= pour * 6; rot -= pour * 5; sx += pour * .08; sy += pour * .04;
      } else if (cfg.waxMode === 'snuffer') {
        const focus = Math.sin(clamp((p - .05) / .48, 0, 1) * Math.PI);
        bob -= focus * 9; rot += focus * 8; sx += focus * .08; sy += focus * .05;
      } else if (cfg.waxMode === 'figure') {
        const copy = Math.sin(clamp((p - .08) / .68, 0, 1) * Math.PI);
        bob -= copy * 4; rot += Math.sin(p * Math.PI * 2) * copy * 3; sx += copy * .04; sy += copy * .04;
      } else if (cfg.waxMode === 'network') {
        const link = Math.sin(clamp((p - .06) / .72, 0, 1) * Math.PI);
        bob -= link * 7; rot += Math.sin(p * Math.PI * 4) * link * 3; sx += link * .06; sy += link * .06;
      } else if (cfg.rudieMode === 'jab') {
        const brace = Math.sin(clamp((p - .08) / .24, 0, 1) * Math.PI * .5);
        const jab = Math.sin(clamp((p - .26) / .30, 0, 1) * Math.PI);
        bob += brace * 4 - jab * 5; rot += brace * 9 - jab * 28; sx += jab * .12;
      } else if (cfg.rudieMode === 'rush' || cfg.rudieMode === 'opener') {
        const charge = Math.sin(clamp((p - .08) / .62, 0, 1) * Math.PI), run = Math.abs(Math.sin(p * Math.PI * 10));
        bob -= charge * 13 + run * charge * 3; rot -= charge * 22; sx += charge * .18; sy -= charge * .10;
      } else if (cfg.rudieMode === 'hoof') {
        const kicks = Math.abs(Math.sin(clamp((p - .16) / .64, 0, 1) * Math.PI * 5));
        bob += kicks * 4; rot += Math.sin(p * Math.PI * 11) * kicks * 7; sx += kicks * .08;
      } else if (cfg.rudieMode === 'boost') {
        const shine = Math.sin(clamp((p - .08) / .68, 0, 1) * Math.PI);
        bob -= shine * 9; rot += Math.sin(p * Math.PI * 12) * shine * 3; sx += shine * .10; sy += shine * .08;
      } else if (cfg.rudieMode === 'momentum') {
        const pulse = Math.sin(clamp((p - .08) / .66, 0, 1) * Math.PI);
        bob -= pulse * 5; rot += Math.sin(p * Math.PI * 4) * pulse * 3; sx += pulse * .05; sy += pulse * .05;
      }
      actor.style.transform = `translate3d(${advance * travel}px,${bob}px,0) rotate(${rot}deg) scale(${sx},${sy})`;

      if (blotDecoy) {
        const summon = clamp((p - .24) / .24, 0, 1), fade = clamp((p - .78) / .18, 0, 1);
        const decoyX = stage._previewW * .38, decoyY = stage._previewH * .30;
        blotDecoy.style.opacity = String(Math.max(0, summon * (1 - fade)));
        blotDecoy.style.transform = `translate3d(${decoyX}px,${decoyY}px,0) scale(${.45 + summon * .55}) rotate(${(1 - summon) * -8}deg)`;
      }

      const hitPulse = Math.max(...(cfg.hitTimes || [hitAt]).map(at => clamp(1 - Math.abs(p - at) / .055, 0, 1)));
      const buffPulse = cfg.ally || cfg.passive ? clamp(1 - Math.abs(p - hitAt) / .18, 0, 1) : 0;
      const support = cfg.ally || cfg.passive, noDamage = !!cfg.previewNoDamage || !!sim.missed;
      target.style.transform = support
        ? `translateY(${-buffPulse * 8}px) scale(${1 + buffPulse * .07})`
        : noDamage ? `translateX(${Math.sin(hitPulse * Math.PI * 5) * hitPulse * 3}px) scale(${1 - hitPulse * .035})`
          : `translateX(${Math.sin(hitPulse * Math.PI * 7) * hitPulse * 8}px) rotate(${hitPulse * 3}deg)`;
      target.style.filter = support ? `brightness(${1 + buffPulse * .35}) drop-shadow(0 0 ${buffPulse * 13}px ${cfg.col})`
        : noDamage ? `brightness(${1 - hitPulse * .12}) saturate(${1 - hitPulse * .32}) drop-shadow(0 0 ${hitPulse * 10}px ${cfg.col})`
          : `brightness(${1 + hitPulse * 1.45})`;
      if (targetHp) targetHp.style.width = (!cfg.ally && !cfg.passive && !noDamage && p >= hitAt
        ? `${Math.round((sim.targetHpPct == null ? .68 : sim.targetHpPct) * 100)}%` : '100%');

      const castLocal = clamp((p - .10) / .34, 0, 1);
      const impactLocal = clamp((p - (hitAt - .03)) / .28, 0, 1);
      setFlipbook(castFx, cfg.cast, castLocal, cfg.cinematicFx && p >= .10 && p <= .44 && (!cfg.basic || cfg.projectile));
      setFlipbook(impactFx, cfg.impact, impactLocal, cfg.cinematicFx && p >= hitAt - .03 && p <= hitAt + .25);

      const shotP = clamp((p - .25) / Math.max(.01, hitAt - .25), 0, 1);
      const showShot = cfg.projectile && p >= .25 && p <= hitAt + .025;
      projectile.style.opacity = showShot ? '1' : '0';
      const shotArc = cfg.gourdyMode === 'toss' ? 68 : cfg.rodgerMode === 'capsule' ? 44 : 22;
      const shotSpin = cfg.gourdyMode === 'toss' ? 620 : cfg.rodgerMode === 'capsule' ? -310 : 260;
      projectile.style.transform = `translate3d(${shotP * stage._previewW * .46}px,${-Math.sin(shotP * Math.PI) * shotArc}px,0) rotate(${shotP * shotSpin}deg) scale(${.7 + shotP * .28})`;
      const showProp = !!cfg.propSrc && !cfg.projectile && active;
      prop.style.opacity = showProp ? String(Math.sin(actionP * Math.PI)) : '0';
      prop.style.transform = `translateY(${-10 - Math.sin(actionP * Math.PI) * 16}px) rotate(${actionP * 85 - 20}deg)`;

      const useGenericBurst = cfg.gourdyMode || cfg.rodgerMode || cfg.shrimpoMode || cfg.veeMode || cfg.flyteMode || cfg.sproutMode || cfg.bassieMode || cfg.waxMode || cfg.visualKind === 'impact';
      burst.style.opacity = useGenericBurst && !support && !noDamage && hitPulse ? String(hitPulse) : '0';
      burst.style.transform = `scale(${.45 + hitPulse * .9}) rotate(${(p - hitAt) * 110}deg)`;
      number.textContent = cfg.floatLabel || sim.label || (cfg.gourdyMode === 'toss' ? `-${fmt(displayNumber)}` : cfg.ally ? 'SHIELD' : cfg.passive ? 'READY' : `-${fmt(displayNumber)}`);
      number.classList.toggle('support', support);
      number.style.opacity = hitPulse || buffPulse ? String(Math.max(hitPulse, buffPulse)) : '0';
      number.style.transform = `translateY(${-Math.max(hitPulse, buffPulse) * 23}px) scale(${.75 + Math.max(hitPulse, buffPulse) * .25})`;
      flash.style.opacity = cfg.ultimate ? String(clamp(1 - Math.abs(p - hitAt) / .055, 0, 1) * .42) : '0';
      if (cfg.gourdyMode) this.drawGourdyPreview(stage, cfg, p, hitAt);
      if (cfg.toodlesMode) this.drawToodlesPreview(stage, cfg, p, hitAt);
      if (cfg.rodgerMode) this.drawRodgerPreview(stage, cfg, p, hitAt);
      if (cfg.shrimpoMode) this.drawShrimpoPreview(stage, cfg, p, hitAt);
      if (cfg.veeMode) this.drawVeePreview(stage, cfg, p, hitAt);
      if (cfg.flyteMode) this.drawFlytePreview(stage, cfg, p, hitAt);
      if (cfg.sproutMode) this.drawSproutPreview(stage, cfg, p, hitAt);
      if (cfg.bassieMode) this.drawBassiePreview(stage, cfg, p, hitAt);
      if (cfg.waxMode) this.drawWaxwellPreview(stage, cfg, p, hitAt);
      if (cfg.rudieMode) this.drawRudiePreview(stage, cfg, p, hitAt);
      this.drawAuthoredPreviewFx(stage, cfg, p, hitAt, authoredFx);
      playhead.style.width = `${p * 100}%`;
      if (p < 1) this._previewRaf = requestAnimationFrame(tick);
      else {
        this._previewRaf = null;
        stage.classList.remove('playing');
        actor.style.transform = '';
        target.style.transform = ''; target.style.filter = '';
        if (targetHp) targetHp.style.width = '100%';
        [castFx, impactFx, projectile, prop, burst, authoredFx, flash, blotDecoy].forEach(node => { if (node) node.style.opacity = '0'; });
        number.textContent = ''; number.style.opacity = '0'; playhead.style.width = '0%';
        this.drawPreviewAtlas(actorBody, cfg.actorAtlases, 'idle', now / 1000, null, cfg.actorW);
        if (actorImg) actorImg.src = cfg.originalArt;
      }
    };
    this._previewRaf = requestAnimationFrame(tick);
  },

  /* A small authored-effect layer for the many Heroes that do not have a
     dedicated action PNG. Its shape and timing come from the skill's real
     combat calls, so a slash, area wave, projectile, and support cast no
     longer collapse into the same generic glow. */
  drawAuthoredPreviewFx(stage, cfg, p, hitAt, node) {
    if (!node || cfg.gourdyMode || cfg.rodgerMode || cfg.shrimpoMode || cfg.veeMode || cfg.flyteMode || cfg.sproutMode || cfg.bassieMode || cfg.waxMode || cfg.rudieMode) return;
    const w = stage._previewW || stage.clientWidth, h = stage._previewH || stage.clientHeight;
    const hitPulse = Math.max(...(cfg.hitTimes || [hitAt]).map(at => clamp(1 - Math.abs(p - at) / .065, 0, 1)));
    const castPulse = Math.sin(clamp((p - .10) / .32, 0, 1) * Math.PI);
    const targetX = w * (cfg.ally || cfg.previewNoDamage ? .78 : .81), targetY = h * .48;
    const actorX = w * (.18 + (cfg.dashes ? clamp((p - .06) / .24, 0, 1) * .28 : 0));
    let x = targetX, y = targetY, opacity = 0, scale = .4, rotate = 0;

    if (cfg.id === 'Brightney') {
      const key = cfg.previewKey, sourceX = w * .23, sourceY = h * .49;
      const cast = Math.sin(clamp((p - .08) / .42, 0, 1) * Math.PI);
      const release = Math.sin(clamp((p - hitAt + .08) / .26, 0, 1) * Math.PI);
      if (key === 'B') {
        const beamP = clamp((p - .24) / Math.max(.08, hitAt - .24), 0, 1);
        x = lerp(sourceX + 24, targetX, beamP); y = lerp(sourceY - 38, targetY, beamP);
        opacity = p >= .20 && p <= hitAt + .12 ? Math.max(.2, cast) : release;
        scale = .62 + release * .72; rotate = Math.atan2(targetY - (sourceY - 38), targetX - (sourceX + 24)) * 180 / Math.PI;
      } else if (key === 'G') {
        x = sourceX; y = sourceY; opacity = cast; scale = .55 + cast * .9; rotate = -8 + cast * 16;
      } else if (key === 'W') {
        x = sourceX; y = sourceY - 8; opacity = Math.max(cast * .7, release); scale = .42 + Math.max(cast, release) * 1.14; rotate = p * 120;
      } else {
        x = targetX; y = targetY; opacity = release; scale = .48 + release * 1.02; rotate = -22 + release * 38;
      }
      node.style.opacity = String(clamp(opacity, 0, 1));
      node.style.transform = `translate3d(${x - 42}px,${y - 42}px,0) rotate(${rotate}deg) scale(${scale})`;
      node.style.setProperty('--fx-progress', String(Math.max(cast, release)));
      return;
    }

    if (cfg.id === 'Blot') {
      const key = cfg.previewKey, mime = Math.sin(clamp((p - .08) / .38, 0, 1) * Math.PI);
      const spill = Math.sin(clamp((p - hitAt + .06) / .25, 0, 1) * Math.PI);
      if (key === 'W') { x = actorX + w * .10; y = h * .48; opacity = mime * .8; scale = .45 + mime * .72; rotate = -8 + mime * 12; }
      else if (key === 'G') { x = actorX + w * .13; y = h * .48; opacity = mime * .8; scale = .5 + mime * .78; rotate = -8; }
      else if (key === 'B') { x = targetX; y = targetY; opacity = Math.max(mime * .35, spill); scale = .48 + Math.max(mime, spill) * .82; rotate = p * 70; }
      else if (key === 'P') { x = actorX; y = h * .48; opacity = mime; scale = .5 + mime * .5; rotate = mime * 15; }
      else if (key === 'R') { x = actorX + w * .10; y = h * .48; opacity = mime * .8; scale = .45 + mime * .72; rotate = -8 + mime * 12; }
      else { x = targetX; y = targetY; opacity = spill; scale = .45 + spill * .92; rotate = -18 + spill * 30; }
      node.style.opacity = String(clamp(opacity, 0, 1));
      node.style.transform = `translate3d(${x - 42}px,${y - 42}px,0) rotate(${rotate}deg) scale(${scale})`;
      node.style.setProperty('--fx-progress', String(Math.max(mime, spill)));
      return;
    }

    if (cfg.visualKind === 'projectile') {
      const travel = clamp((p - .20) / Math.max(.08, hitAt - .20), 0, 1);
      x = lerp(actorX + w * .06, targetX, travel); y = lerp(h * .48, targetY, travel) - Math.sin(travel * Math.PI) * h * .16;
      opacity = p >= .20 && p <= hitAt + .04 ? Math.max(.2, 1 - travel * .2) : hitPulse;
      scale = .55 + travel * .35;
    } else if (cfg.visualKind === 'support') {
      x = cfg.ally ? targetX : actorX; y = cfg.ally ? targetY : h * .50;
      opacity = Math.max(castPulse * .72, hitPulse); scale = .48 + Math.max(castPulse, hitPulse) * .78;
      rotate = p * 38;
    } else if (cfg.visualKind === 'ring' || cfg.visualKind === 'magic') {
      x = cfg.ally ? targetX : (cfg.dashes ? actorX : targetX); y = cfg.ally ? targetY : h * .50;
      opacity = Math.max(castPulse * .55, hitPulse); scale = .42 + Math.max(castPulse, hitPulse) * (cfg.visualKind === 'magic' ? .92 : 1.2);
      rotate = (p * 70) % 360;
    } else if (cfg.visualKind === 'summon') {
      x = actorX; y = h * .52; opacity = castPulse; scale = .35 + castPulse * .9; rotate = (1 - castPulse) * -12;
    } else if (cfg.visualKind === 'slash') {
      x = targetX; y = targetY; opacity = hitPulse; scale = .5 + hitPulse * 1.05; rotate = (cfg.hitCount > 1 ? Math.sin(p * 32) * 22 : -22) + (1 - hitPulse) * 16;
    } else {
      x = targetX; y = targetY; opacity = hitPulse; scale = .45 + hitPulse * .9; rotate = p * 110;
    }
    node.style.opacity = String(clamp(opacity, 0, 1));
    node.style.transform = `translate3d(${x - 42}px,${y - 42}px,0) rotate(${rotate}deg) scale(${scale})`;
    node.style.setProperty('--fx-progress', String(Math.max(castPulse, hitPulse)));
  },

  previewNodes(stage, selector) {
    const cache = stage._previewNodeCache || (stage._previewNodeCache = Object.create(null));
    return cache[selector] || (cache[selector] = $$(selector, stage));
  },

  drawSproutPreview(stage, cfg, p, hitAt) {
    const treats = this.previewNodes(stage, '.preview-sprout-treat'), vines = $('.preview-sprout-vines', stage);
    const heart = $('.preview-sprout-heart', stage), shield = $('.preview-sprout-shield', stage);
    const callout = $('.preview-sprout-callout', stage);
    if (!callout) return;
    const w = stage._previewW || stage.clientWidth, h = stage._previewH || stage.clientHeight;
    const place = (node, x, y, rot, scale, opacity) => {
      if (!node) return;
      node.style.opacity = String(clamp(opacity, 0, 1));
      node.style.transform = `translate3d(${x}px,${y}px,0) rotate(${rot}deg) scale(${scale})`;
    };
    treats.forEach(n => { n.style.opacity = '0'; });
    if (vines) vines.style.opacity = '0';
    if (heart) heart.style.opacity = '0';
    if (shield) shield.style.opacity = '0';
    const actorX = w * .23, targetX = w * .78, targetY = h * .50;
    if (cfg.sproutMode === 'bake') {
      const q = clamp((p - .20) / Math.max(.12, hitAt - .20), 0, 1);
      place(treats[0], lerp(actorX + 18, targetX, q), h * .54 - Math.sin(q * Math.PI) * 38,
        q * 300 - 16, .48 + Math.sin(q * Math.PI) * .28, p >= .20 && p <= hitAt + .08 ? 1 : 0);
    } else if (cfg.sproutMode === 'rush') {
      const q = clamp((p - .06) / .30, 0, 1), pulse = Math.sin(clamp((p - hitAt + .06) / .22, 0, 1) * Math.PI);
      if (heart) {
        heart.style.opacity = String(Math.max(q * .55, pulse));
        heart.style.transform = `translate3d(${lerp(actorX, targetX, q) - 18}px,${targetY - 44 - pulse * 12}px,0) scale(${.55 + pulse * .55}) rotate(${q * 18}deg)`;
      }
      place(treats[0], lerp(actorX, targetX, q), h * .54 - Math.sin(q * Math.PI) * 24, q * 180, .32, q * .55);
    } else if (cfg.sproutMode === 'oven') {
      treats.slice(0, 2).forEach((node, i) => {
        const q = clamp((p - (.18 + i * .09)) / .40, 0, 1);
        place(node, lerp(actorX + 18, targetX - 8 + i * 19, q), targetY - i * 18 - Math.sin(q * Math.PI) * (42 - i * 9),
          (i ? -1 : 1) * q * 330, .42 + Math.sin(q * Math.PI) * .24, q * clamp((.76 - p) / .14, 0, 1));
      });
      if (vines) { vines.style.opacity = String(Math.sin(clamp((p - .08) / .62, 0, 1) * Math.PI) * .7); vines.style.transform = `translate3d(${w * .50}px,${h * .52}px,0) scale(${.72 + p * .2})`; }
    } else if (cfg.sproutMode === 'watch') {
      const q = Math.sin(clamp((p - .08) / .66, 0, 1) * Math.PI);
      if (vines) { vines.style.opacity = String(q); vines.style.transform = `translate3d(${w * .33}px,${h * .48}px,0) scale(${.7 + q * .35})`; }
      if (heart) { heart.style.opacity = String(q * .8); heart.style.transform = `translate3d(${w * .62}px,${h * .35}px,0) scale(${.55 + q * .35})`; }
    } else if (cfg.sproutMode === 'save') {
      const q = Math.sin(clamp((p - .28) / .42, 0, 1) * Math.PI);
      if (shield) { shield.style.opacity = String(q); shield.style.transform = `translate3d(${targetX - 40}px,${targetY - 66}px,0) scale(${.55 + q * .65}) rotate(${(1 - q) * -10}deg)`; }
      if (heart) { heart.style.opacity = String(q); heart.style.transform = `translate3d(${targetX - 17}px,${targetY - 40}px,0) scale(${.55 + q * .45})`; }
      place(treats[0], lerp(actorX, targetX, clamp((p - .06) / .32, 0, 1)), h * .52 - q * 12, -18, .38, q * .7);
    }
    const pulse = cfg.sproutMode === 'watch'
      ? Math.sin(clamp((p - .08) / .66, 0, 1) * Math.PI)
      : Math.max(...(cfg.hitTimes || [hitAt]).map(at => clamp(1 - Math.abs(p - at) / .15, 0, 1)));
    callout.textContent = cfg.sproutMode === 'bake' ? 'TREAT!' : cfg.sproutMode === 'rush' ? 'FORTIFY' :
      cfg.sproutMode === 'oven' ? 'HEAL ×2' : cfg.sproutMode === 'watch' ? 'WATCHING' : 'SAVED!';
    callout.style.opacity = String(pulse);
    callout.style.transform = `translate3d(${w * .62}px,${h * .20 - pulse * 11}px,0) scale(${.7 + pulse * .35})`;
  },

  drawRudiePreview(stage, cfg, p, hitAt) {
    const wind = $('.preview-rudie-wind', stage), hoof = $('.preview-rudie-hoof', stage);
    const speed = this.previewNodes(stage, '.preview-rudie-speed i'), callout = $('.preview-rudie-callout', stage);
    if (!callout) return;
    const w = stage._previewW || stage.clientWidth, h = stage._previewH || stage.clientHeight, actorX = w * .23, targetX = w * .80, targetY = h * .50;
    const place = (node, x, y, rotate, scale, opacity) => {
      if (!node) return;
      node.style.opacity = String(clamp(opacity, 0, 1));
      node.style.transform = `translate3d(${x}px,${y}px,0) rotate(${rotate}deg) scale(${scale})`;
    };
    if (wind) wind.style.opacity = '0';
    if (hoof) hoof.style.opacity = '0';
    speed.forEach(node => { node.style.opacity = '0'; });
    const pulse = Math.max(...(cfg.hitTimes || [hitAt]).map(at => clamp(1 - Math.abs(p - at) / .15, 0, 1)));
    if (cfg.rudieMode === 'rush' || cfg.rudieMode === 'opener') {
      const q = clamp((p - .12) / .54, 0, 1), fade = clamp((.84 - p) / .16, 0, 1);
      place(wind, actorX + q * w * .22 - 58, h * .43 - Math.sin(q * Math.PI) * 12, q * 38 - 12, .42 + q * .68, Math.max(.18, q) * fade);
      speed.forEach((node, i) => {
        const trail = clamp((p - (.08 + i * .025)) / .34, 0, 1);
        place(node, w * (.18 + trail * .30), h * (.48 + (i - 2) * .035), (i % 2 ? -1 : 1) * trail * 18, .50 + trail * .20, trail * fade);
      });
    } else if (cfg.rudieMode === 'jab') {
      const q = Math.sin(clamp((p - .34) / .28, 0, 1) * Math.PI);
      place(hoof, targetX - 38, targetY - 42, -12 + q * 18, .28 + q * .28, q * .72);
      speed.slice(0, 2).forEach((node, i) => place(node, targetX - 75 + i * 20, targetY - 44 - i * 9, -8, .42 + q * .16, q));
    } else if (cfg.rudieMode === 'hoof') {
      const q = clamp((p - .30) / .42, 0, 1), fade = clamp((.86 - p) / .14, 0, 1);
      place(hoof, targetX - 58, targetY - 55, q * 9 - 8, .50 + Math.sin(q * Math.PI) * .45, q * fade);
      speed.forEach((node, i) => {
        const kick = Math.sin(clamp((p - (.22 + i * .07)) / .18, 0, 1) * Math.PI);
        place(node, lerp(actorX + 20, targetX - 20, i / Math.max(1, speed.length - 1)), h * (.50 + (i % 2 ? -.08 : .06)), (i % 2 ? -1 : 1) * kick * 24, .46 + kick * .25, kick);
      });
    } else if (cfg.rudieMode === 'boost') {
      const q = Math.sin(clamp((p - .08) / .68, 0, 1) * Math.PI);
      place(wind, actorX - 42, h * .35, p * 70, .36 + q * .50, q * .82);
      speed.forEach((node, i) => place(node, actorX - 12 + Math.cos(i * 1.2 + p * 4) * 35,
        h * .47 + Math.sin(i * 1.2 + p * 4) * 24, p * 90 + i * 25, .42 + q * .18, q * .72));
    } else if (cfg.rudieMode === 'momentum') {
      const q = Math.sin(clamp((p - .08) / .66, 0, 1) * Math.PI);
      speed.forEach((node, i) => place(node, actorX + Math.cos(i * 1.25 + p * 2) * (28 + q * 12),
        h * .47 + Math.sin(i * 1.25 + p * 2) * (21 + q * 8), p * 80 + i * 20, .44 + q * .18, q * .82));
    }
    callout.textContent = cfg.rudieMode === 'rush' ? 'CHARGE!' : cfg.rudieMode === 'opener' ? 'DELIVERY!' :
      cfg.rudieMode === 'jab' ? 'JAB ×2' : cfg.rudieMode === 'hoof' ? 'KICK ×5' : cfg.rudieMode === 'boost' ? 'SPEED UP!' : 'MOMENTUM';
    const labelPulse = cfg.rudieMode === 'boost' || cfg.rudieMode === 'momentum'
      ? Math.sin(clamp((p - .10) / .64, 0, 1) * Math.PI) : pulse;
    callout.style.opacity = String(labelPulse);
    callout.style.transform = `translate3d(${w * .60}px,${h * .18 - labelPulse * 12}px) rotate(${(1 - labelPulse) * -5}deg) scale(${.68 + labelPulse * .34})`;
  },

  drawBassiePreview(stage, cfg, p, hitAt) {
    const foods = this.previewNodes(stage, '.preview-bassie-food'), basket = $('.preview-bassie-basket', stage);
    const ring = $('.preview-bassie-ring', stage), stock = $('.preview-bassie-stock', stage);
    const callout = $('.preview-bassie-callout', stage);
    if (!callout) return;
    const w = stage._previewW || stage.clientWidth, h = stage._previewH || stage.clientHeight;
    const place = (node, x, y, rot, scale, opacity) => {
      if (!node) return;
      node.style.opacity = String(clamp(opacity, 0, 1));
      node.style.transform = `translate3d(${x}px,${y}px,0) rotate(${rot}deg) scale(${scale})`;
    };
    foods.forEach(n => { n.style.opacity = '0'; });
    if (basket) basket.style.opacity = '0';
    if (ring) ring.style.opacity = '0';
    if (stock) stock.style.opacity = '0';
    const actorX = w * .23, targetX = w * .80, targetY = h * .50;
    if (cfg.bassieMode === 'sharing') {
      place(basket, actorX - 26, h * .50, Math.sin(p * Math.PI * 4) * 4 - 8, .80, 1);
      const count = Math.min(8, foods.length);
      foods.forEach((node, i) => {
        const delay = .16 + (i % count) * .055, q = clamp((p - delay) / .34, 0, 1);
        place(node, lerp(actorX + 18, targetX, q), h * (.53 + ((i % 3) - 1) * .06) - Math.sin(q * Math.PI) * (32 + (i % 2) * 10),
          q * (i % 2 ? -360 : 360), .40 + Math.sin(q * Math.PI) * .26, q * clamp((.76 - p) / .12, 0, 1));
      });
    } else if (cfg.bassieMode === 'packed') {
      place(basket, actorX - 26, h * .50, -8 + Math.sin(p * Math.PI * 3) * 3, .84, 1);
      const pulse = Math.sin(clamp((p - .10) / .62, 0, 1) * Math.PI);
      if (ring) { ring.style.opacity = String(pulse * .75); ring.style.transform = `translate3d(${targetX - 56}px,${targetY - 55}px,0) scale(${.55 + pulse * .65})`; }
      if (stock) { stock.style.opacity = String(pulse); stock.style.transform = `translate3d(${targetX - 22}px,${targetY - 82}px,0) scale(${.7 + pulse * .3})`; }
    } else if (cfg.bassieMode === 'toss') {
      const q = clamp((p - .28) / .47, 0, 1), back = clamp((p - .70) / .23, 0, 1);
      const flight = q < .72 ? q / .72 : 1 - back;
      place(basket, lerp(actorX + 16, targetX, flight), h * .52 - Math.sin(flight * Math.PI) * 60,
        flight * 480, .72 + Math.sin(flight * Math.PI) * .18, q > .05 && p < .96 ? 1 : 0);
      const pulse = Math.sin(clamp((p - .58) / .22, 0, 1) * Math.PI);
      if (ring) { ring.style.opacity = String(pulse); ring.style.transform = `translate3d(${targetX - 58}px,${targetY - 58}px,0) scale(${.55 + pulse * .75})`; }
    } else if (cfg.bassieMode === 'prepared') {
      place(basket, actorX - 26, h * .50, -8, .86, 1);
      if (stock) { stock.style.opacity = String(.65 + Math.sin(p * Math.PI * 5) * .2); stock.style.transform = `translate3d(${actorX + 2}px,${h * .30}px,0) scale(.9)`; }
      foods.slice(0, 3).forEach((node, i) => place(node, actorX + 7 + i * 15, h * (.37 + (i % 2) * .04), (i - 1) * 22, .34, .85));
    } else if (cfg.bassieMode === 'overflow') {
      place(basket, actorX - 26, h * .50, -8 + Math.sin(p * Math.PI * 5) * 4, .90, 1);
      if (stock) { stock.style.opacity = String(.8 + Math.sin(p * Math.PI * 6) * .2); stock.style.transform = `translate3d(${actorX - 22}px,${h * .28}px,0) scale(1.02)`; }
      const pulse = Math.sin(clamp((p - .18) / .54, 0, 1) * Math.PI);
      foods.slice(0, 2).forEach((node, i) => place(node, actorX + 10 + i * 20, h * .36 - pulse * 16, i ? 28 : -24, .38 + pulse * .16, pulse));
      if (ring) { ring.style.opacity = String(pulse * .8); ring.style.transform = `translate3d(${actorX - 44}px,${h * .40}px,0) scale(${.6 + pulse * .7})`; }
    }
    const pulse = cfg.bassieMode === 'prepared' || cfg.bassieMode === 'overflow'
      ? Math.sin(clamp((p - .08) / .66, 0, 1) * Math.PI)
      : Math.max(...(cfg.hitTimes || [hitAt]).map(at => clamp(1 - Math.abs(p - at) / .15, 0, 1)));
    callout.textContent = cfg.bassieMode === 'sharing' ? 'SUPPLIES!' : cfg.bassieMode === 'packed' ? 'PACKED!' :
      cfg.bassieMode === 'toss' ? 'BASKET TOSS!' : cfg.bassieMode === 'prepared' ? 'STOCKED' : 'OVERFLOW!';
    callout.style.opacity = String(pulse);
    callout.style.transform = `translate3d(${w * .57}px,${h * .18 - pulse * 12}px) rotate(${(1 - pulse) * -5}deg) scale(${.7 + pulse * .34})`;
  },

  drawWaxwellPreview(stage, cfg, p, hitAt) {
    const trail = $('.preview-wax-trail', stage), pools = this.previewNodes(stage, '.preview-wax-pools i');
    const lock = $('.preview-wax-lock', stage), figure = $('.preview-wax-figure', stage);
    const network = $('.preview-wax-network', stage), callout = $('.preview-wax-callout', stage);
    if (!callout) return;
    const w = stage._previewW || stage.clientWidth, h = stage._previewH || stage.clientHeight, actorX = w * .22, targetX = w * .80, targetY = h * .50;
    const pulse = cfg.waxMode === 'figure' || cfg.waxMode === 'network'
      ? Math.sin(clamp((p - .08) / .68, 0, 1) * Math.PI)
      : Math.max(...(cfg.hitTimes || [hitAt]).map(at => clamp(1 - Math.abs(p - at) / .15, 0, 1)));
    if (trail) {
      const q = cfg.waxMode === 'snuffer' ? clamp((p - .12) / .38, 0, 1) : clamp((p - .10) / .54, 0, 1);
      trail.style.opacity = cfg.waxMode === 'figure' || cfg.waxMode === 'network' ? '0' : String(Math.max(.2, q));
      trail.style.transform = `translate3d(${actorX}px,${h * .64}px,0) scaleX(${Math.max(.04, q)})`;
      trail.classList.toggle('hot', cfg.waxMode === 'ignite');
    }
    pools.forEach((node, i) => {
      const q = clamp((p - .15 - i * .06) / .34, 0, 1), active = cfg.waxMode === 'melt' || cfg.waxMode === 'network';
      node.style.opacity = active ? String(q * clamp((.82 - p) / .14, 0, 1)) : '0';
      node.style.transform = `translate3d(${lerp(actorX + 20, targetX - 12, i / Math.max(1, pools.length - 1))}px,${h * (.62 + (i % 2) * .07)}px,0) scale(${.5 + q * .5})`;
    });
    if (lock) {
      const q = cfg.waxMode === 'snuffer' ? pulse : 0;
      lock.style.opacity = String(q);
      lock.style.transform = `translate3d(${targetX - 34}px,${targetY - 70}px,0) scale(${.45 + q * .7}) rotate(${(1 - q) * -16}deg)`;
    }
    if (figure) {
      const q = cfg.waxMode === 'figure' ? clamp((p - .20) / .25, 0, 1) * clamp((.83 - p) / .18, 0, 1) : 0;
      figure.style.opacity = String(q * .72);
      figure.style.transform = `translate3d(${actorX + 46}px,${h * .34 - q * 8}px,0) scaleX(-1) scale(${.65 + q * .3})`;
    }
    if (network) {
      const q = cfg.waxMode === 'network' ? pulse : 0;
      network.style.opacity = String(q * .9);
      network.style.transform = `translate3d(${w * .52 - 56}px,${h * .53 - 38}px,0) scale(${.55 + q * .7}) rotate(${p * 24}deg)`;
    }
    callout.textContent = cfg.waxMode === 'ignite' ? 'FLAME TRAIL' : cfg.waxMode === 'melt' ? 'SOFT WAX' :
      cfg.waxMode === 'snuffer' ? 'SNUFFED!' : cfg.waxMode === 'figure' ? 'WAX COPY' : 'NETWORK';
    callout.style.opacity = String(pulse);
    callout.style.transform = `translate3d(${w * .57}px,${h * .18 - pulse * 12}px) rotate(${(1 - pulse) * -5}deg) scale(${.68 + pulse * .36})`;
  },

  drawToodlesPreview(stage, cfg, p, hitAt) {
    const tokens = this.previewNodes(stage, '.toodles-token'), star = $('.preview-toodles-star', stage), callout = $('.preview-toodles-callout', stage);
    if (!tokens.length || !star || !callout) return;
    const w = stage._previewW || stage.clientWidth, h = stage._previewH || stage.clientHeight;
    const place = (node, x, y, rot, scale, opacity) => {
      node.style.opacity = String(clamp(opacity, 0, 1));
      node.style.transform = `translate3d(${x}px,${y}px,0) rotate(${rot}deg) scale(${scale})`;
    };
    const pulse = clamp(1 - Math.abs(p - hitAt) / .16, 0, 1);
    tokens.forEach(node => { node.style.opacity = '0'; });
    if (cfg.toodlesMode === 'roll' || cfg.toodlesMode === 'improve' || cfg.toodlesMode === 'charm') {
      const q = clamp((p - .10) / .46, 0, 1), fade = clamp((.82 - p) / .15, 0, 1);
      tokens.forEach((node, i) => {
        const a = -Math.PI * .9 + i * Math.PI * .60 + q * Math.PI * 1.6;
        place(node, w * .26 + Math.cos(a) * (34 + q * 28), h * .51 + Math.sin(a) * (27 + q * 18),
          q * (240 + i * 74), .54 + q * .28, q * fade);
      });
      star.style.opacity = String(q * fade);
      star.style.transform = `translate3d(${w * (.22 + q * .10)}px,${h * (.32 - q * .10)}px,0) rotate(${q * 190}deg) scale(${.4 + q * .9})`;
    } else if (cfg.toodlesMode === 'strike' || cfg.toodlesMode === 'swing') {
      const q = clamp((p - .20) / Math.max(.08, hitAt - .20), 0, 1), burst = Math.sin(q * Math.PI);
      tokens.slice(0, 2).forEach((node, i) => place(node, w * (.78 + (i ? .08 : -.08) * burst), h * (.47 - burst * .18),
        (i ? 1 : -1) * q * 330, .48 + burst * .42, burst));
      star.style.opacity = String(pulse);
      star.style.transform = `translate3d(${w * .78}px,${h * (.34 - pulse * .08)}px,0) rotate(${p * 480}deg) scale(${.5 + pulse * .8})`;
    } else {
      const q = clamp((p - .12) / .42, 0, 1), fade = clamp((.80 - p) / .12, 0, 1);
      tokens.forEach((node, i) => place(node, w * (.73 + (i - 1.5) * .055), h * (.54 - q * (.13 + (i % 2) * .04)),
        (i - 1.5) * q * 28, .48 + q * .28, q * fade));
      star.style.opacity = String(Math.max(pulse, q * fade));
      star.style.transform = `translate3d(${w * .76}px,${h * (.31 - q * .08)}px,0) rotate(${q * 150}deg) scale(${.45 + q * .75})`;
    }
    callout.textContent = cfg.floatLabel || 'LUCKY!';
    callout.style.opacity = String(Math.max(pulse, cfg.toodlesMode === 'roll' ? clamp((p - .34) / .15, 0, 1) * clamp((.84 - p) / .12, 0, 1) : 0));
    callout.style.transform = `translate3d(${w * .62}px,${h * .19 - pulse * 11}px,0) rotate(${(1 - pulse) * -6}deg) scale(${.68 + Math.max(pulse, .18) * .35})`;
  },

  drawGourdyPreview(stage, cfg, p, hitAt) {
    const sprites = this.previewNodes(stage, '.preview-gourdy-sprite'), callout = $('.preview-gourdy-callout', stage);
    if (!sprites.length || !callout) return;
    const w = stage._previewW || stage.clientWidth, h = stage._previewH || stage.clientHeight;
    const place = (node, x, y, rot, scale, opacity) => {
      node.style.opacity = String(clamp(opacity, 0, 1));
      node.style.transform = `translate3d(${x}px,${y}px,0) rotate(${rot}deg) scale(${scale})`;
    };
    sprites.forEach(n => { n.style.opacity = '0'; });

    if (cfg.gourdyMode === 'treat') {
      const lift = clamp((p - .07) / .25, 0, 1), pailFade = clamp((.58 - p) / .10, 0, 1);
      place(sprites[0], w * (.20 + lift * .08), h * (.68 - lift * .27) - Math.sin(lift * Math.PI) * 13,
        -18 + lift * 28, .55 + lift * .55, lift * pailFade);
      sprites.slice(1).forEach((node, i) => {
        const q = clamp((p - (.24 + i * .035)) / .28, 0, 1), fade = clamp((.72 - p) / .09, 0, 1);
        const x = w * lerp(.29, .77, q), y = h * lerp(.54, .42 + (i - 1.5) * .055, q) - Math.sin(q * Math.PI) * (34 + i * 4);
        place(node, x, y, q * (360 + i * 90), .45 + Math.sin(q * Math.PI) * .42, q * fade);
      });
    } else if (cfg.gourdyMode === 'rush') {
      sprites.forEach((node, i) => {
        const q = clamp((p - (.10 + i * .038)) / .43, 0, 1), fade = clamp((.70 - p) / .12, 0, 1);
        const x = w * lerp(.18, .88, q), lane = ((i % 3) - 1) * .09;
        const y = h * (.56 + lane) - Math.sin(q * Math.PI) * (26 + (i % 2) * 18);
        place(node, x, y, q * (i % 2 ? -540 : 540), .42 + Math.sin(q * Math.PI) * .28, q * fade);
      });
    } else {
      const q = clamp((p - hitAt) / .20, 0, 1), burst = Math.sin(q * Math.PI);
      sprites.forEach((node, i) => place(node, w * .82 + (i ? 1 : -1) * q * 42, h * .52 - q * (42 + i * 12),
        (i ? 1 : -1) * q * 410, .42 + burst * .32, burst));
    }

    const pulse = clamp(1 - Math.abs(p - hitAt) / .13, 0, 1);
    callout.textContent = cfg.gourdyMode === 'toss' ? cfg.gourdyOutcome : cfg.floatLabel;
    callout.style.opacity = String(pulse);
    callout.style.transform = `translate3d(${w * .67}px,${h * .24 - pulse * 13}px,0) rotate(${(1 - pulse) * -7}deg) scale(${.65 + pulse * .45})`;
  },

  drawRodgerPreview(stage, cfg, p, hitAt) {
    const sprites = this.previewNodes(stage, '.preview-rodger-sprite'), scan = $('.preview-rodger-scan', stage), callout = $('.preview-rodger-callout', stage);
    if (!sprites.length || !scan || !callout) return;
    const w = stage._previewW || stage.clientWidth, h = stage._previewH || stage.clientHeight;
    const place = (node, x, y, rot, scale, opacity) => {
      node.style.opacity = String(clamp(opacity, 0, 1));
      node.style.transform = `translate3d(${x}px,${y}px,0) rotate(${rot}deg) scale(${scale})`;
    };
    sprites.forEach(n => { n.style.opacity = '0'; });

    if (cfg.rodgerMode === 'research') {
      const open = clamp((p - .07) / .24, 0, 1), bookFade = clamp((.70 - p) / .11, 0, 1);
      place(sprites[0], w * .23, h * (.65 - open * .24), -18 + open * 23, .55 + open * .56, open * bookFade);
      const lensQ = clamp((p - .22) / .34, 0, 1), lensFade = clamp((.72 - p) / .10, 0, 1);
      place(sprites[1], w * lerp(.70, .84, lensQ), h * (.43 - Math.sin(lensQ * Math.PI) * .08), -24 + lensQ * 62,
        .58 + Math.sin(lensQ * Math.PI) * .32, lensQ * lensFade);
      sprites.slice(2).forEach((node, i) => {
        const q = clamp((p - (.20 + i * .055)) / .32, 0, 1), fade = clamp((.72 - p) / .10, 0, 1);
        place(node, w * lerp(.29, .76, q), h * lerp(.58, .46 + (i - 1) * .055, q) - Math.sin(q * Math.PI) * (25 + i * 7),
          (i % 2 ? -1 : 1) * q * 330, .42 + Math.sin(q * Math.PI) * .30, q * fade);
      });
    } else if (cfg.rodgerMode === 'capsule') {
      const q = clamp((p - hitAt) / .22, 0, 1), burst = Math.sin(q * Math.PI);
      sprites.slice(0, 2).forEach((node, i) => place(node, w * .82 + (i ? 1 : -1) * q * 45, h * .51 - q * (44 + i * 10),
        (i ? 1 : -1) * q * 430, .38 + burst * .28, burst));
      place(sprites[2], w * .81, h * (.44 - burst * .10), q * 80 - 25, .55 + burst * .35, burst);
    } else {
      const open = clamp((p - .07) / .24, 0, 1), fade = clamp((.73 - p) / .12, 0, 1);
      place(sprites[0], w * .23, h * (.66 - open * .25), -14 + open * 19, .54 + open * .61, open * fade);
      sprites.slice(1, 4).forEach((node, i) => {
        const q = clamp((p - (.21 + i * .045)) / .34, 0, 1);
        place(node, w * lerp(.30, .78, q), h * lerp(.58, .46 + (i - 1) * .052, q) - Math.sin(q * Math.PI) * (30 + i * 8),
          (i % 2 ? -1 : 1) * q * 390, .42 + Math.sin(q * Math.PI) * .31, q * fade);
      });
      const lens = clamp((p - .39) / .22, 0, 1);
      place(sprites[4], w * .81, h * (.43 - Math.sin(lens * Math.PI) * .06), -20 + lens * 38, .48 + Math.sin(lens * Math.PI) * .45, lens * fade);
    }

    const pulse = clamp(1 - Math.abs(p - hitAt) / .15, 0, 1);
    scan.style.opacity = String(pulse);
    scan.style.transform = `translate3d(${w * .81}px,${h * .48}px,0) rotate(${(1 - pulse) * -18}deg) scale(${.55 + pulse * .62})`;
    callout.textContent = cfg.floatLabel;
    callout.style.opacity = String(pulse);
    callout.style.transform = `translate3d(${w * .65}px,${h * .20 - pulse * 12}px,0) rotate(${(1 - pulse) * 5}deg) scale(${.68 + pulse * .38})`;
  },

  drawShrimpoPreview(stage, cfg, p, hitAt) {
    const bricks = this.previewNodes(stage, '.preview-shrimpo-brick'), pips = this.previewNodes(stage, '.preview-shrimpo-spite i');
    const smash = $('.preview-shrimpo-smash', stage), callout = $('.preview-shrimpo-callout', stage);
    if (!bricks.length || !smash || !callout) return;
    const w = stage._previewW || stage.clientWidth, h = stage._previewH || stage.clientHeight;
    const place = (node, x, y, rot, scale, opacity) => {
      node.style.opacity = String(clamp(opacity, 0, 1));
      node.style.transform = `translate3d(${x}px,${y}px,0) rotate(${rot}deg) scale(${scale})`;
    };
    bricks.forEach(n => { n.style.opacity = '0'; });
    pips.forEach(n => { n.style.opacity = '0'; });

    if (cfg.shrimpoMode === 'tantrum') {
      bricks.forEach((node, i) => {
        const q = clamp((p - (.08 + i * .045)) / .50, 0, 1), fade = clamp((.78 - p) / .12, 0, 1);
        const side = i % 2 ? 1 : -1, lap = q * Math.PI * (1.7 + (i % 3) * .24);
        place(node, w * .24 + Math.cos(lap) * (30 + i * 5), h * .55 + Math.sin(lap) * (17 + i * 2),
          side * q * 610, .38 + Math.sin(q * Math.PI) * .35, q * fade);
      });
    } else if (cfg.shrimpoMode === 'bully') {
      const q = clamp((p - hitAt) / .22, 0, 1), blast = Math.sin(q * Math.PI);
      bricks.forEach((node, i) => {
        const a = (-2.5 + i) * .45;
        place(node, w * .81 + Math.cos(a) * q * (30 + i * 3), h * .53 - q * (24 + Math.abs(i - 2.5) * 7),
          (i % 2 ? -1 : 1) * q * 480, .25 + blast * .33, blast);
      });
    } else {
      pips.forEach((node, i) => {
        const on = clamp((p - (.07 + i * .025)) / .07, 0, 1), pop = Math.sin(on * Math.PI);
        node.style.opacity = String(on);
        node.style.transform = `rotate(${i * 36}deg) translateY(${-42 - pop * 8}px) scale(${.65 + pop * .65})`;
      });
      const q = clamp((p - hitAt) / .22, 0, 1), blast = Math.sin(q * Math.PI);
      bricks.forEach((node, i) => place(node, w * .81 + (i - 2.5) * q * 20, h * .53 - q * (28 + (i % 3) * 11),
        (i % 2 ? -1 : 1) * q * 520, .22 + blast * .30, blast));
    }

    const pulse = cfg.shrimpoMode === 'tantrum'
      ? Math.max(0, Math.sin(clamp((p - .13) / .55, 0, 1) * Math.PI * 6))
      : clamp(1 - Math.abs(p - hitAt) / .13, 0, 1);
    smash.style.opacity = String(pulse);
    smash.style.transform = `translate3d(${w * (cfg.shrimpoMode === 'tantrum' ? .24 : .81)}px,${h * .53}px,0) rotate(${p * 210}deg) scale(${.35 + pulse * .85})`;
    callout.textContent = cfg.floatLabel;
    callout.style.opacity = String(pulse);
    callout.style.transform = `translate3d(${w * .65}px,${h * .18 - pulse * 13}px,0) rotate(${(1 - pulse) * -7}deg) scale(${.66 + pulse * .42})`;
  },

  drawVeePreview(stage, cfg, p, hitAt) {
    const remote = $('.preview-vee-remote', stage), lights = this.previewNodes(stage, '.preview-vee-light');
    const signal = $('.preview-vee-signal', stage), screen = $('.preview-vee-screen', stage);
    const crowd = $('.preview-vee-crowd', stage), reticle = $('.preview-vee-reticle', stage);
    if (!remote || !screen || !reticle) return;
    const w = stage._previewW || stage.clientWidth, h = stage._previewH || stage.clientHeight;
    const pop = (at, span) => Math.sin(clamp((p - at) / span, 0, 1) * Math.PI);
    const remoteP = pop(.07, .62);
    remote.style.opacity = String(remoteP);
    remote.style.transform = `translate3d(${w * .25}px,${h * (.57 - remoteP * .21)}px,0) rotate(${-22 + remoteP * 31}deg) scale(${.52 + remoteP * .48})`;
    lights.forEach(n => { n.style.opacity = '0'; });
    signal.style.opacity = '0'; crowd.style.opacity = '0'; reticle.style.opacity = '0'; screen.style.opacity = '0';

    if (cfg.veeMode === 'spotlight') {
      const lock = clamp((p - .19) / .34, 0, 1), fade = clamp((.80 - p) / .12, 0, 1);
      lights.forEach((node, i) => {
        const q = clamp((p - (.20 + i * .035)) / .25, 0, 1);
        node.style.opacity = String(q * fade);
        node.style.transform = `translate3d(${w * (.74 + (i - 1) * .055)}px,${h * (.47 + (i % 2) * .045)}px,0) rotate(${(i - 1) * 24}deg) scale(${.35 + q * (.75 + i * .08)})`;
      });
      reticle.style.opacity = String(lock * fade);
      reticle.style.transform = `translate3d(${w * .81}px,${h * .52}px,0) rotate(${(1 - lock) * -35}deg) scale(${1.5 - lock * .45})`;
      screen.style.opacity = String(lock * fade);
      screen.style.transform = `translate3d(${w * .58}px,${h * .15}px,0) rotate(${(1 - lock) * -5}deg) scale(${.65 + lock * .35})`;
      $('small', screen).textContent = 'ON AIR'; $('b', screen).textContent = 'HEADLINE LOCKED';
    } else if (cfg.veeMode === 'audience') {
      const cheer = clamp((p - .13) / .45, 0, 1), fade = clamp((.84 - p) / .12, 0, 1);
      crowd.style.opacity = String(cheer * fade);
      crowd.style.transform = `translate3d(${w * .49}px,${h * (.85 - cheer * .12)}px,0) scale(${.72 + cheer * .28})`;
      signal.style.opacity = String(cheer * fade);
      signal.style.transform = `translate3d(${w * .49}px,${h * .51}px,0) rotate(-8deg) scale(${.55 + cheer * .55})`;
      lights.forEach((node, i) => {
        const q = clamp((p - (.25 + i * .045)) / .24, 0, 1);
        node.style.opacity = String(q * fade * .82);
        node.style.transform = `translate3d(${w * (.77 + (i - 1) * .05)}px,${h * (.47 + (i % 2) * .04)}px,0) rotate(${i * 30}deg) scale(${.28 + q * .60})`;
      });
      screen.style.opacity = String(cheer * fade);
      screen.style.transform = `translate3d(${w * .59}px,${h * .16}px,0) rotate(${(1 - cheer) * 5}deg) scale(${.68 + cheer * .32})`;
      $('small', screen).textContent = 'LIVE AUDIENCE'; $('b', screen).textContent = 'APPLAUSE!';
    } else {
      const cut = clamp((p - .15) / .25, 0, 1), fade = clamp((.88 - p) / .12, 0, 1);
      screen.style.opacity = String(cut * fade);
      screen.style.transform = `translate3d(${w * .43}px,${h * .25}px,0) rotate(${(1 - cut) * -8}deg) scale(${.42 + cut * .92})`;
      $('small', screen).textContent = "VEE'S NETWORK"; $('b', screen).textContent = "WE'LL BE RIGHT BACK";
      signal.style.opacity = String(cut * fade);
      signal.style.transform = `translate3d(${w * .51}px,${h * .58}px,0) rotate(4deg) scale(${.65 + cut * .5})`;
      lights.forEach((node, i) => {
        const q = pop(.30 + i * .03, .35);
        node.style.opacity = String(q * .55);
        node.style.transform = `translate3d(${w * (.35 + i * .22)}px,${h * (.62 - (i % 2) * .12)}px,0) rotate(${i * 45}deg) scale(${.35 + q * .55})`;
      });
    }
  },

  drawFlytePreview(stage, cfg, p, hitAt) {
    const zone = $('.preview-flyte-zone', stage), wind = this.previewNodes(stage, '.preview-flyte-wind i');
    const shield = $('.preview-flyte-shield', stage), push = $('.preview-flyte-push', stage);
    const passAlly = $('.preview-flyte-pass-ally', stage), callout = $('.preview-flyte-callout', stage);
    const buffCallout = $('.preview-flyte-buff-callout', stage);
    if (!zone || !shield || !push || !callout || !buffCallout) return;
    const w = stage._previewW || stage.clientWidth, h = stage._previewH || stage.clientHeight;
    const pulse = (at, span) => Math.sin(clamp((p - at) / span, 0, 1) * Math.PI);
    zone.style.opacity = '0'; shield.style.opacity = '0'; push.style.opacity = '0';
    callout.style.opacity = '0'; buffCallout.style.opacity = '0';
    if (passAlly) passAlly.style.opacity = '0';
    wind.forEach(n => { n.style.opacity = '0'; });

    if (cfg.flyteMode === 'gust') {
      const grow = clamp((p - .14) / .30, 0, 1), fade = clamp((.90 - p) / .12, 0, 1);
      zone.style.opacity = String(grow * fade);
      zone.style.transform = `translate3d(${w * .81}px,${h * .69}px,0) rotateX(58deg) rotate(${p * 55}deg) scale(${.35 + grow * .92})`;
      wind.forEach((node, i) => {
        const q = clamp((p - (.10 + i * .035)) / .43, 0, 1), lane = (i % 3 - 1) * .065;
        node.style.opacity = String(q * fade);
        node.style.transform = `translate3d(${w * (.25 + q * .54)}px,${h * (.49 + lane) - Math.sin(q * Math.PI) * (18 + i * 2)}px,0) rotate(${q * 120 + i * 17}deg) scale(${.45 + Math.sin(q * Math.PI) * .45})`;
      });
      const pop = pulse(hitAt, .28);
      callout.textContent = 'HASTE · SLOW IMMUNE'; callout.style.opacity = String(pop);
      callout.style.transform = `translate3d(${w * .63}px,${h * .18 - pop * 10}px,0) scale(${.68 + pop * .34})`;
    } else if (cfg.flyteMode === 'rescue') {
      const protect = clamp((p - .24) / .24, 0, 1), fade = clamp((.88 - p) / .12, 0, 1);
      shield.style.opacity = String(protect * fade);
      shield.style.transform = `translate3d(${w * .81}px,${h * .57}px,0) scale(${.35 + protect * .83})`;
      push.style.opacity = String(protect * fade);
      push.style.transform = `translate3d(${w * .81}px,${h * .61}px,0) rotate(${(1 - protect) * -30}deg) scale(${.35 + protect * .95})`;
      wind.forEach((node, i) => {
        const q = clamp((p - (.08 + i * .018)) / .24, 0, 1), fadeTrail = clamp((.47 - p) / .08, 0, 1);
        node.style.opacity = String(q * fadeTrail);
        node.style.transform = `translate3d(${w * (.23 + q * .55)}px,${h * (.50 + (i % 3 - 1) * .05)}px,0) rotate(${q * 70}deg) scale(${.42 + q * .28})`;
      });
      const pop = pulse(hitAt, .25); callout.textContent = 'SHIELD + SPACE'; callout.style.opacity = String(pop);
      callout.style.transform = `translate3d(${w * .64}px,${h * .18 - pop * 10}px,0) scale(${.68 + pop * .34})`;
    } else {
      const passX = w * .47, allyPulse = pulse(.35, .24), impact = pulse(hitAt, .22);
      if (passAlly) {
        passAlly.style.opacity = String(clamp((p - .08) / .15, 0, 1) * clamp((.86 - p) / .12, 0, 1));
        passAlly.style.transform = `translate3d(${passX}px,${h * .52 - allyPulse * 7}px,0) scale(${.72 + allyPulse * .09})`;
      }
      wind.forEach((node, i) => {
        const q = clamp((p - (.06 + i * .025)) / .50, 0, 1), fade = clamp((.82 - p) / .12, 0, 1);
        node.style.opacity = String(q * fade);
        node.style.transform = `translate3d(${w * (.17 + q * .69)}px,${h * (.46 + (i % 4 - 1.5) * .055)}px,0) rotate(${(i % 2 ? -1 : 1) * q * 100}deg) scale(${.45 + Math.sin(q * Math.PI) * .5})`;
      });
      zone.style.opacity = String(allyPulse);
      zone.style.transform = `translate3d(${passX}px,${h * .68}px,0) rotateX(58deg) scale(${.35 + allyPulse * .54})`;
      push.style.opacity = String(impact); push.style.transform = `translate3d(${w * .82}px,${h * .57}px,0) rotate(${p * 80}deg) scale(${.4 + impact * 1.05})`;
      buffCallout.style.opacity = String(allyPulse);
      buffCallout.style.transform = `translate3d(${w * .38}px,${h * .25 - allyPulse * 10}px,0) scale(${.7 + allyPulse * .32})`;
      callout.textContent = 'KNOCKBACK!'; callout.style.opacity = String(impact);
      callout.style.transform = `translate3d(${w * .67}px,${h * .17 - impact * 10}px,0) scale(${.68 + impact * .36})`;
    }
  },

  drawPreviewAtlas(body, atlases, clip, elapsed, phase, logicalW) {
    if (!body || !atlases) return;
    const sprite = $('.preview-natural-sprite', body);
    const atlas = atlases[clip] || atlases.idle;
    if (!sprite || !atlas) return;
    // Fit against the tallest cell in the complete animation set, not the
    // currently selected frame. That keeps scale stable while guaranteeing a
    // tall attack/effect frame cannot push the fighter's head out of view.
    const stage = body.closest('.skill-preview-stage');
    if (body._previewAtlasRef !== atlases) {
      body._previewAtlasRef = atlases;
      body._previewTallestRatio = Math.max(...Object.values(atlases).map(a => {
        const h = a.rects ? Math.max(...a.rects.map(r => r.h)) : a.cellH;
        return (a.bodyScale || a.scale || 1) * h / (a.baseW || a.cellW || 1);
      }));
    }
    const tallestRatio = body._previewTallestRatio || 1;
    const fitW = stage ? Math.max(46, ((stage._previewH || stage.clientHeight) - 70) / tallestRatio) : logicalW;
    logicalW = Math.min(logicalW, fitW);
    const poseW = logicalW * (atlas.bodyScale || atlas.scale || 1);
    const raw = atlas.once && phase != null
      ? Math.floor(clamp(phase, 0, .999) * atlas.frames.length)
      : Math.floor(elapsed * atlas.fps) % atlas.frames.length;
    const frame = atlas.frames[clamp(raw, 0, atlas.frames.length - 1)];
    const frameKey = `${atlas.src}|${frame}|${poseW.toFixed(2)}|${logicalW.toFixed(2)}`;
    if (sprite._previewFrameKey === frameKey) return;
    sprite._previewFrameKey = frameKey;
    body.style.width = `${poseW}px`;
    sprite.style.backgroundImage = `url("${atlas.src}")`;
    if (atlas.rects) {
      const rect = atlas.rects[frame]; if (!rect) return;
      const scale = poseW / (atlas.baseW || rect.w), frameW = rect.w * scale;
      sprite.style.width = `${frameW}px`; sprite.style.marginLeft = `${(poseW - frameW) / 2}px`;
      sprite.style.height = `${rect.h * scale}px`;
      sprite.style.backgroundSize = `${atlas.sheetW * scale}px ${atlas.sheetH * scale}px`;
      sprite.style.backgroundPosition = `${-rect.x * scale}px ${-rect.y * scale}px`;
      return;
    }
    const scale = atlas.baseW ? poseW / atlas.baseW : poseW / atlas.cellW;
    const frameW = atlas.cellW * scale;
    const col = frame % atlas.cols, row = Math.floor(frame / atlas.cols);
    sprite.style.width = `${frameW}px`; sprite.style.marginLeft = `${(poseW - frameW) / 2}px`;
    sprite.style.height = `${atlas.cellH * scale}px`;
    sprite.style.backgroundSize = `${atlas.cols * atlas.cellW * scale}px ${atlas.rows * atlas.cellH * scale}px`;
    sprite.style.backgroundPosition = `${-col * atlas.cellW * scale}px ${-row * atlas.cellH * scale}px`;
  },

  startPreview(stage) {
    if (!stage || !stage.isConnected) return;
    this.playPreview(stage);
    const replay = () => {
      if (!stage.isConnected) { this.stopPreview(); return; }
      if (!stage._previewPaused) this.playPreview(stage);
      const simDuration = Math.round(((stage._preview && stage._preview.simulation && stage._preview.simulation.duration) || 2) * 1000);
      this._previewLoop = setTimeout(replay, simDuration + 720);
    };
    const simDuration = Math.round(((stage._preview && stage._preview.simulation && stage._preview.simulation.duration) || 2) * 1000);
    this._previewLoop = setTimeout(replay, simDuration + 720);
  },

  /* ---------- growth ---------- */
  growthTab(id) {
    const h = Save.hero(id), d = HEROES[id], wrap = el('div', 'hero-growth');
    const make = (title, value, sub, pct, color) => {
      const n = el('section', 'hero-growth-card');
      n.innerHTML = `<div><small>${title}</small><b>${value}</b><span>${sub}</span></div>`;
      n.appendChild(UI.bar(pct, color)); return n;
    };
    const lv = make('LEVEL', `${h.level} / ${Progress.levelCap()}`, `${RES.ichor.icon} ${fmt(levelCost(h.level))} · ${RES.exp.icon} ${fmt(levelExp(h.level))}`,
      h.level / Math.max(1, Progress.levelCap()), 'linear-gradient(90deg,#7be0ff,#5aa9ff)');
    const lvBtns = el('div', 'hero-growth-actions'), one = el('button', null, '+1'), five = el('button', null, '+5'), max = el('button', null, 'MAX');
    one.onclick = () => { Progress.levelUp(id, 1); this.draw(); };
    five.onclick = () => { Progress.levelUp(id, 5); this.draw(); };
    max.onclick = () => { Progress.levelMax(id); this.draw(); };
    if (h.level >= Progress.levelCap()) one.disabled = five.disabled = max.disabled = true;
    lvBtns.appendChild(one); lvBtns.appendChild(five); lvBtns.appendChild(max); lv.appendChild(lvBtns); wrap.appendChild(lv);

    const sc = Progress.starCost(id);
    const star = make('PROMOTION', '★'.repeat(h.stars) + '☆'.repeat(5 - h.stars), sc ? `◈ ${h.shards} / ${sc.shards} · ${RES.ichor.icon} ${fmt(sc.ichor)}` : 'Maximum promotion',
      sc ? h.shards / sc.shards : 1, 'linear-gradient(90deg,#ffe27a,#ffc94d)');
    const sb = el('button', 'hero-growth-main', h.stars >= 5 ? 'MAXIMUM' : `PROMOTE TO ${h.stars + 1}★`);
    sb.disabled = !Progress.canStar(id); sb.onclick = () => { Progress.starUp(id); this.draw(); }; star.appendChild(sb); wrap.appendChild(star);

    const rc = Progress.rarityCost(id), next = rarityNext(h.rarity, h.rarityPlus);
    const nextKey = next && next.plus === 1 ? SKILL_ORDER.find(k => SKILL_RARITY[k] === next.tier) : null;
    const currentRarity = rarityLabel(h.rarity, h.rarityPlus);
    const nextRarity = next && rarityLabel(next.tier, next.plus);
    const rarity = make('RARITY', currentRarity, rc ? `${RES.core.icon} ${rc.core} · ${RES.ichor.icon} ${fmt(rc.ichor)} · next ${nextRarity}${nextKey && d.skills[nextKey] ? ' · unlocks ' + d.skills[nextKey].name : ' · stats increase'}` : 'All rarity stat tiers unlocked',
      rarityRank(h.rarity, h.rarityPlus) / RARITY_TOTAL_RANKS, `linear-gradient(90deg,${RARITY_COLORS[h.rarity]},${RARITY_COLORS[next ? next.tier : h.rarity]})`);
    const rb = el('button', 'hero-growth-main', !next ? 'MAXIMUM' : `RAISE TO ${nextRarity.toUpperCase()}`);
    rb.disabled = !Progress.canRarity(id); rb.onclick = () => { Progress.rarityUp(id); this.draw(); }; rarity.appendChild(rb); wrap.appendChild(rarity);
    const tools = el('div', 'hero-growth-tools');
    const skillBulkLocked = !Screens.modeUnlocked('skillBulk');
    const allSkills = el('button', 'hero-max-skills', skillBulkLocked ? '🔒 MAX EVERY SKILL' : '📼 MAX EVERY SKILL');
    allSkills.disabled = skillBulkLocked;
    allSkills.title = skillBulkLocked ? `Unlocks at Mastery ${MODE_UNLOCKS.skillBulk.mastery}` : 'Spend Tape across every skill';
    allSkills.onclick = () => { if (skillBulkLocked) return Screens.showModeGate('skillBulk'); Progress.skillMaxAll(id); this.draw(); };
    const upgradeLocked = !Screens.modeUnlocked('upgradeEverything');
    const auto = el('button', 'hero-auto-upgrade', upgradeLocked ? '🔒 UPGRADE EVERYTHING' : '⚡ UPGRADE EVERYTHING');
    auto.disabled = upgradeLocked;
    auto.title = upgradeLocked ? `Unlocks at Mastery ${MODE_UNLOCKS.upgradeEverything.mastery}` : 'Spend available upgrade resources on this Hero';
    auto.onclick = () => { if (upgradeLocked) return Screens.showModeGate('upgradeEverything'); Progress.autoUpgrade(id); this.draw(); };
    tools.appendChild(allSkills); tools.appendChild(auto); wrap.appendChild(tools);
    return wrap;
  },

  /* ---------- stats ---------- */
  statsTab(id) {
    const h = Save.hero(id), d = HEROES[id];
    const wrap = el('div');
    // build a throwaway unit to read the real numbers the sim would use
    const fake = new Unit(playerSpec(id), 0, 0, { auras: [] });
    // The stats tab is not a live Battle, so apply the shared direct class
    // stat layer explicitly before reading the values. Authored class
    // mechanics remain battle-only; this panel reports the persistent stat
    // portion players can compare at a glance.
    if (typeof applyTrainingStatBonus === 'function') {
      if (fake.cls && CLASSES[fake.cls]) applyTrainingStatBonus(fake, 'class', fake.cls, fake.classRank);
      if (fake.subcls && SUBCLASSES[fake.subcls]) applyTrainingStatBonus(fake, 'subclass', fake.subcls, fake.subclassRank);
      if (fake.rarity >= 6 && fake.cls2 && CLASSES[fake.cls2]) applyTrainingStatBonus(fake, 'class', fake.cls2, fake.classRank2);
      if (fake.rarity >= 6 && fake.subcls2 && SUBCLASSES[fake.subcls2]) applyTrainingStatBonus(fake, 'subclass', fake.subcls2, fake.subclassRank2);
      fake.dirty = true; fake.recompute(true);
    }
    const rows = [
      ['❤ Max HP', Math.round(fake.max.hp), 12000, 'Total health pool before fainting'],
      ['⚔ Attack', Math.round(fake.st.atk), 1500, 'Primary scaling for physical attacks and skills'],
      ['✨ Magic Attack', Math.round(fake.st.mag), 1500, 'Primary scaling for magic attacks and skills'],
      ['🛡 Defense', Math.round(fake.st.def), 800, 'Reduces incoming physical damage'],
      ['🔰 Magic Defense', Math.round(fake.st.mdef), 800, 'Reduces incoming magic damage'],
      ['🏃 Speed', Math.round(fake.st.spd), 400, 'Determines turn readiness and battle pace'],
      ['🎯 Accuracy', Math.round(fake.st.acc), 120, 'Chance to hit evasive targets'],
      ['💨 Evasion', Math.round(fake.st.eva), 100, 'Chance to dodge incoming attacks']
    ];
    const c = el('div', 'card hero-stats-card');
    c.innerHTML = '<div class="mini muted b" style="letter-spacing:1.5px;margin-bottom:8px">ATTRIBUTES</div>';
    rows.forEach(([k, v, maxBench, tip]) => {
      const pct = Math.min(100, Math.max(8, Math.round((v / maxBench) * 100)));
      const r = el('div', 'hero-stat-row');
      r.title = `${k}: ${fmt(v)} — ${tip}`;
      r.innerHTML = `
        <div class="row tiny" style="margin-bottom:2px">
          <div class="grow">${k}</div><b>${fmt(v)}</b>
        </div>
        <div class="hero-stat-bar"><i class="hero-stat-bar-fill" style="width:${pct}%"></i></div>
      `;
      c.appendChild(r);
    });
    wrap.appendChild(c);

    const training = el('div', 'card');
    training.innerHTML = '<div class="mini muted b" style="letter-spacing:1.5px;margin-bottom:6px">CLASS EFFECTS &amp; STAT BONUSES</div>';
    const paths = [
      h.cls && CLASSES[h.cls] ? { path: 'class', name: h.cls, rank: Progress.classRank(id, h.cls), def: CLASSES[h.cls] } : null,
      h.subcls && SUBCLASSES[h.subcls] ? { path: 'subclass', name: h.subcls, rank: Progress.subclassRank(id, h.subcls), def: SUBCLASSES[h.subcls] } : null
    ].filter(Boolean);
    if (Progress.rainbowClassUnlocked(id)) {
      if (h.cls2 && CLASSES[h.cls2]) paths.push({ path: 'class', name: h.cls2, rank: Progress.classRank(id, h.cls2), def: CLASSES[h.cls2], secondary: true });
      if (h.subcls2 && SUBCLASSES[h.subcls2]) paths.push({ path: 'subclass', name: h.subcls2, rank: Progress.subclassRank(id, h.subcls2), def: SUBCLASSES[h.subcls2], secondary: true });
    }
    if (!paths.length) training.appendChild(el('div', 'mini muted', 'Equip a Class or Subclass to see its combat effect and stat bonus.'));
    paths.forEach(item => {
      const row = el('div', 'class-stat-breakdown');
      const stats = typeof trainingStatEntries === 'function'
        ? trainingStatEntries(item.path, item.name, item.rank).map(stat => `+${pcn(stat.percent)}% ${stat.label}`).join(' · ')
        : '';
      row.innerHTML = `<div class="row mini"><b class="grow">${item.def.icon} ${item.name}${item.secondary ? ' · REFORGED' : ''}</b><span class="muted">Rank ${item.rank}/${CLASS_MAX_RANK}</span></div>
        <div class="mini muted">${classDesc(item.def, item.rank)}${stats ? '' : ' · no direct stat bonus at Rank 1'}</div>`;
      training.appendChild(row);
    });
    wrap.appendChild(training);

    const hid = el('div', 'card');
    hid.innerHTML = '<div class="mini muted b" style="letter-spacing:1.5px;margin-bottom:6px">COMBAT VALUES</div>';
    const hrows = [
      ['Crit Chance', Math.round(fake.st.crit * 100) + '%', 'Chance to land critical hit damage'],
      ['Crit Damage', Math.round(fake.st.critDmg * 100) + '%', 'Damage multiplier applied on critical hit'],
      ['Attack Range', Math.round(fake.st.range), 'Target acquisition and reach distance'],
      ['Attack Speed', fake.st.aspd.toFixed(2), 'Frequency rate of basic attacks per second'],
      ['Move Speed', Math.round(fake.st.ms), 'Battlefield positioning and gap-close speed'],
      ['Armor Pen', Math.round(fake.st.armorPen * 100) + '%', 'Ignores a portion of target Physical Defense'],
      ['Magic Pen', Math.round(fake.st.magPen * 100) + '%', 'Ignores a portion of target Magic Defense'],
      ['CC Resist', Math.round(fake.st.ccRes * 100) + '%', 'Reduces duration of stuns, silences, and slows'],
      ['Knockback Resist', Math.round(fake.st.kbRes * 100) + '%', 'Reduces distance pushed by displacement attacks'],
      ['Healing Power', Math.round(fake.st.healPow * 100) + '%', 'Increases effectiveness of heals cast'],
      ['Shield Strength', Math.round(fake.st.shieldPow * 100) + '%', 'Increases barrier capacity granted to allies or self'],
      ['Aggro', fake.st.aggro.toFixed(2), 'Priority rating for attracting enemy focus and attacks'],
      ['Cooldown Reduction', Math.round(fake.st.cdr * 100) + '%', 'Reduces skill cooldowns']
    ];
    const g = el('div', 'grid2');
    hrows.forEach(([k, v, tip]) => {
      const r = el('div', 'mini hero-combat-val');
      r.title = `${k}: ${v} — ${tip}`;
      r.innerHTML = `<span class="muted">${k}</span> <b style="float:right">${v}</b>`;
      g.appendChild(r);
    });
    hid.appendChild(g);
    wrap.appendChild(hid);

    const mitigation = el('div', 'card');
    const physicalReduction = Math.round(defenseReduction(fake.st.def, fake.level, fake.level) * 100);
    const magicReduction = Math.round(defenseReduction(fake.st.mdef, fake.level, fake.level) * 100);
    mitigation.innerHTML = `<div class="mini muted b" style="letter-spacing:1.5px;margin-bottom:6px">DAMAGE RESOLUTION</div>
      <div class="grid2"><div class="mini"><span class="muted">Physical mitigation</span><b style="float:right">${physicalReduction}%</b></div>
      <div class="mini"><span class="muted">Magic mitigation</span><b style="float:right">${magicReduction}%</b></div>
      <div class="mini"><span class="muted">Damage dealt cap</span><b style="float:right">+${Math.round(DAMAGE_RULES.outgoingCeiling * 100)}%</b></div>
      <div class="mini"><span class="muted">Damage reduction cap</span><b style="float:right">${Math.round(-DAMAGE_RULES.incomingFloor * 100)}%</b></div></div>
      <div class="mini muted" style="margin-top:7px">Mitigation is shown against an equal-level attacker before penetration. Armor and Magic Defense now scale from both combatants’ levels.</div>`;
    wrap.appendChild(mitigation);

    const fr = el('div', 'card');
    fr.innerHTML = `<div class="row tiny"><div class="grow b">Battle History</div></div>`;
    fr.appendChild(el('div', 'mini muted', h.battles + ' battles fought together.'));
    if (h.mastery > 0) fr.appendChild(el('div', 'mini', '🏅 Mastery points: <b>' + fmt(h.mastery) + '</b>'));
    wrap.appendChild(fr);
    return wrap;
  },

  /* ---------- extras: class and subclass ---------- */
  extrasTab(id) {
    const h = Save.hero(id);
    const wrap = el('div');
    const redrawGear = () => {
      const currentContent = document.querySelector('.hero-profile-content');
      const scrollTop = currentContent ? currentContent.scrollTop : 0;
      this.draw();
      const restore = () => {
        const nextContent = document.querySelector('.hero-profile-content');
        if (nextContent) nextContent.scrollTop = scrollTop;
      };
      if (typeof requestAnimationFrame === 'function') requestAnimationFrame(restore);
      else setTimeout(restore, 0);
    };

    const skinDef = HERO_SKINS[id];
    if (skinDef) {
      const equipped = h.costume === skinDef.id;
      const skinCard = el('div', 'card hero-skin-card');
      skinCard.innerHTML = `<div class="hero-skin-kicker">APPEARANCE</div>
        <div class="hero-skin-layout">
          <div class="hero-skin-swatches"><img src="${Art.defaultHero(id)}" alt="Default ${HEROES[id].name}"><img src="${ASSET + skinDef.art}" alt="${skinDef.name} skin"></div>
          <div class="hero-skin-copy"><div class="row"><div class="grow"><b>${skinDef.name}</b><small class="muted">Scraps skin</small></div><span class="hero-skin-status">${equipped ? 'EQUIPPED' : 'OWNED'}</span></div>
            <p class="mini muted">A soft pastel bow-and-dress look for Scraps. Her default appearance is always available.</p></div>
        </div>`;
      const skinBtn = el('button', 'btn small hero-skin-button', equipped ? 'USE DEFAULT' : 'EQUIP SKIN');
      skinBtn.type = 'button';
      skinBtn.onclick = () => { h.costume = equipped ? null : skinDef.id; Save.write(); Sound.play('ui_ok'); this.draw(); };
      skinCard.appendChild(skinBtn);
      wrap.appendChild(skinCard);
    }

    const manualCount = Save.res('manual');
    const makeTrainingCard = (kind, defs, current, secondary, unlocked, unlockText, focusKey, setFocus, rankOf, upgradeOne, upgradeMax, equip) => {
      const isClass = kind === 'class';
      const focus = defs[focusKey] ? focusKey : current || Object.keys(defs)[0];
      const def = defs[focus];
      const rank = rankOf(focus);
      const isPrimary = current === focus;
      const isSecondary = secondary === focus;
      const card = el('div', 'card class-ui-card');
      card.innerHTML = `<div class="class-ui-head">
          <div class="class-ui-title"><small>${isClass ? 'PRIMARY PATH' : 'SECONDARY PATH'}</small><b>${isClass ? 'Class' : 'Subclass'}</b><span>${unlocked ? `Choose one · Rank cap ${CLASS_MAX_RANK}` : unlockText}</span></div>
          <div class="class-ui-manuals"><b>📘 ${fmt(manualCount)}</b><small>Manuals</small></div>
        </div>`;

      const choices = el('div', 'class-ui-choices');
      Object.keys(defs).forEach(k => {
        const d = defs[k], r = rankOf(k), button = el('button', 'class-ui-choice');
        const role = current === k ? 'PRIMARY' : secondary === k ? 'REFORGED' : '';
        button.type = 'button';
        button.classList.toggle('selected', k === focus);
        button.classList.toggle('equipped', !!role);
        button.classList.toggle('locked', !unlocked);
        button.setAttribute('aria-pressed', k === focus ? 'true' : 'false');
        button.innerHTML = `<b class="class-ui-icon">${d.icon}</b><span class="class-ui-choice-copy"><strong>${k}</strong><small>${r ? `Rank ${r}/${CLASS_MAX_RANK}` : 'Untrained'}</small></span>${role ? `<em>${role}</em>` : ''}`;
        button.onclick = () => {
          if (!unlocked) { UI.toast(unlockText); return; }
          setFocus(k); redrawGear();
        };
        choices.appendChild(button);
      });
      card.appendChild(choices);

      const detail = el('div', 'class-ui-detail');
      const statEntries = typeof trainingStatEntries === 'function' ? trainingStatEntries(isClass ? 'class' : 'subclass', focus, rank || 1) : [];
      const statText = statEntries.length ? statEntries.map(s => `+${pcn(s.percent)}% ${s.label}`).join(' · ') : 'No direct stat bonus at Rank 1';
      detail.innerHTML = `<div class="class-ui-detail-top"><div class="class-ui-detail-name"><span>${def.icon}</span><div><b>${focus}</b><small>${isPrimary ? 'PRIMARY EQUIPPED' : isSecondary ? 'REFORGED EQUIPPED' : rank ? 'LEARNED' : 'NOT LEARNED'}</small></div></div><strong>Rank ${rank || 0}<i>/${CLASS_MAX_RANK}</i></strong></div>
        <div class="class-ui-bar"><i style="width:${Math.max(0, Math.min(100, rank / CLASS_MAX_RANK * 100))}%"></i></div>
        <div class="class-ui-desc">${classDesc(def, rank || 1)}</div>
        <div class="class-ui-stats"><span>STAT IDENTITY</span>${statText}</div>`;

      const actions = el('div', 'class-ui-actions');
      if (!unlocked) {
        actions.appendChild(el('button', 'btn small class-ui-lock', unlockText));
      } else if (!rank) {
        const learn = el('button', 'btn small class-ui-equip', isSecondary ? 'Reforged Path' : `Learn & Equip ${isClass ? 'Class' : 'Subclass'}`);
        learn.disabled = isSecondary;
        learn.onclick = () => { this._gearOpenPanel = isClass ? 'classes' : 'subclasses'; if (equip(focus)) redrawGear(); };
        actions.appendChild(learn);
      } else {
        if (!isPrimary && !isSecondary) {
          const equipButton = el('button', 'btn small class-ui-equip', `Equip ${isClass ? 'Class' : 'Subclass'}`);
          equipButton.onclick = () => { this._gearOpenPanel = isClass ? 'classes' : 'subclasses'; if (equip(focus)) redrawGear(); };
          actions.appendChild(equipButton);
        } else {
          actions.appendChild(el('span', 'class-ui-active-note', isSecondary ? '🌈 ACTIVE REFORGED' : '✓ EQUIPPED'));
        }
        if (rank < CLASS_MAX_RANK) {
          const cost = classUpgradeCost(rank, !isClass).manual;
          const missing = Math.max(0, cost - Save.res('manual'));
          const one = el('button', 'btn small class-ui-train', missing ? `Need 📘 ${missing}` : `Train +1 · 📘 ${cost}`);
          one.disabled = missing > 0;
          one.title = missing ? `Need ${missing} more Training Manual${missing === 1 ? '' : 's'}` : `Train ${focus} to Rank ${rank + 1}`;
          one.onclick = () => { this._gearOpenPanel = isClass ? 'classes' : 'subclasses'; if (upgradeOne(id, focus)) redrawGear(); };
          actions.appendChild(one);
          const max = el('button', 'btn small class-ui-train class-ui-train-max', `Train to ${CLASS_MAX_RANK}`);
          max.disabled = missing > 0;
          max.title = missing ? `Need ${missing} more Training Manual${missing === 1 ? '' : 's'} for the next rank` : `Train ${focus} as far as current Manuals allow`;
          max.onclick = () => { this._gearOpenPanel = isClass ? 'classes' : 'subclasses'; if (upgradeMax(id, focus)) redrawGear(); };
          actions.appendChild(max);
        }
      }
      detail.appendChild(actions);
      card.appendChild(detail);
      return card;
    };

    const classFocusMap = this._classUiFocusByHero || (this._classUiFocusByHero = {});
    const classFocus = classFocusMap[id] || h.cls || Object.keys(CLASSES)[0];
    const clsCard = makeTrainingCard('class', CLASSES, h.cls, h.cls2, Progress.classUnlocked(id), 'Unlocks at 3★', classFocus,
      k => { classFocusMap[id] = k; }, k => Progress.classRank(id, k),
      (heroId, k) => Progress.upgradeClass(heroId, k), (heroId, k) => Progress.upgradeClassMax(heroId, k),
      k => { Progress.setClass(id, k); return true; });
    wrap.appendChild(clsCard);

    const subclassFocusMap = this._subclassUiFocusByHero || (this._subclassUiFocusByHero = {});
    const subclassFocus = subclassFocusMap[id] || h.subcls || Object.keys(SUBCLASSES)[0];
    const subCard = makeTrainingCard('subclass', SUBCLASSES, h.subcls, h.subcls2, Progress.subclassUnlocked(id), 'Unlocks at 4★', subclassFocus,
      k => { subclassFocusMap[id] = k; }, k => Progress.subclassRank(id, k),
      (heroId, k) => Progress.upgradeSubclass(heroId, k), (heroId, k) => Progress.upgradeSubclassMax(heroId, k),
      k => { Progress.setSubclass(id, k); return true; });
    wrap.appendChild(subCard);

    let refCard = null;
    if (Progress.rainbowClassUnlocked(id)) {
      refCard = el('div', 'card class-ui-card class-ui-reforge');
      refCard.innerHTML = `<div class="class-ui-head"><div class="class-ui-title"><small>RAINBOW PATH</small><b>🌈 Reforged choices</b><span>One extra Class and Subclass are active in battle.</span></div><div class="class-ui-manuals"><b>ACTIVE</b><small>both paths</small></div></div>`;
      const refGroups = [
        { label: 'Extra Class', defs: CLASSES, selected: h.cls2, primary: h.cls, set: k => Progress.setRainbowClass(id, k) },
        { label: 'Extra Subclass', defs: SUBCLASSES, selected: h.subcls2, primary: h.subcls, set: k => Progress.setRainbowSubclass(id, k) }
      ];
      refGroups.forEach(group => {
        const section = el('div', 'class-ui-ref-group');
        section.innerHTML = `<div class="class-ui-ref-label">${group.label} <b>${group.selected || 'Choose one'}</b></div>`;
        const list = el('div', 'class-ui-ref-list');
        Object.keys(group.defs).forEach(k => {
          const b = el('button', 'class-ui-ref-choice', `${group.defs[k].icon} ${k}`);
          b.type = 'button'; b.classList.toggle('selected', k === group.selected); b.disabled = k === group.primary;
          b.title = k === group.primary ? 'Already used by the primary path' : `Use ${k} as the reforged ${group.label.toLowerCase()}`;
          b.onclick = () => { this._gearOpenPanel = 'reforged'; if (group.set(k)) redrawGear(); };
          list.appendChild(b);
        });
        section.appendChild(list); refCard.appendChild(section);
      });
      wrap.appendChild(refCard);
    }

    const noTrinket = !!HEROES[id].noTrinket;
    let trkCard = null;
    if (!noTrinket) {
      trkCard = el('div', 'card');
      trkCard.innerHTML = `<div class="tiny b">Trinkets <span class="muted">· equip up to 2</span></div>`;
      const trkg = el('div', 'grid2');
      trkg.style.marginTop = '6px';
      for (let slot = 0; slot < 2; slot++) {
        const uid = (h.trinkets || [])[slot], copy = uid && Save.data.trinketInv[uid];
        const n = el('div', 'choice');
        n.style.cssText = 'position:relative;margin:0;padding:8px;text-align:center;cursor:pointer';
        if (copy && TRINKETS[copy.id]) {
          const t = TRINKETS[copy.id];
          n.innerHTML = `<button type="button" class="trinket-quick-off" title="Unequip Trinket" aria-label="Unequip Trinket">×</button>
            <img src="${trinketIcon(copy.id)}" style="width:40px;height:40px;object-fit:contain">
            <div class="mini b">${t.name}${trinketPlaceholderBadge(copy.id)}</div>
            <div class="mini muted">Rank ${copy.rank} · ${trinketRankLabel(copy.rank)} · ${trinketStatText(t, copy.rank)}</div>
            <div class="mini trinket-signature">${trinketSignatureText(copy.id)}</div>`;
          n.style.borderColor = 'var(--gold)';
          const offBtn = n.querySelector('.trinket-quick-off');
          if (offBtn) {
            offBtn.onclick = (e) => {
              e.stopPropagation();
              Progress.unequipTrinket(id, slot);
              Sound.play('ui_ok');
              redrawGear();
            };
          }
        } else {
          n.innerHTML = `<div style="font-size:22px;opacity:.5">+</div><div class="mini muted">Empty Slot</div>`;
        }
        n.onclick = () => this.openTrinketPicker(id, slot);
        trkg.appendChild(n);
      }
      trkCard.appendChild(trkg);
      wrap.appendChild(trkCard);
    }

    const ownBadges = BADGE_IDS_FOR(id);
    const wornBadges = Save.equippedBadges(id);
    let bdgCard = null;
    if (ownBadges.length) {
      bdgCard = el('div', 'card');
      bdgCard.innerHTML = `<div class="tiny b">🤝 Friendship Badges <span class="muted">· ${wornBadges.length}/1 equipped</span></div>`;
      ownBadges.forEach(bid => {
        const def = BADGES[bid], owned = Save.ownsBadge(bid);
        const row = el('div', 'choice');
        row.style.cssText = 'margin:6px 0;padding:8px;cursor:pointer';
        if (owned) {
          const lvl = Save.badgeLvl(bid), worn = wornBadges.includes(bid);
          const cookieBadge = COOKIE_HERO_IDS.includes(id);
          const canUnequip = !worn || !cookieBadge;
          row.innerHTML = `<div class="row" style="align-items:center;gap:8px">
              ${badgeIconHtml(bid, lvl)}
              <div class="grow">
                <div class="row tiny"><div class="grow b">${def.name}</div><div class="muted">Lv ${lvl}/${BADGE_MAX_LVL}</div></div>
                <div class="mini muted">${def.stat(lvl)} · ${def.effect}</div>
                <div class="mini" style="margin-top:4px">${worn ? '<b style="color:var(--gold)">Equipped · Tap to view</b>' : 'Tap to view details'}</div>
              </div>
              <button type="button" class="badge-quick-toggle ${worn ? 'active' : ''}" ${canUnequip ? '' : 'disabled'} title="${worn ? (cookieBadge ? 'Cookie badge equipped' : 'Unequip badge') : 'Equip badge'}">${worn ? '✕' : '✓'}</button>
            </div>`;
          if (worn) row.style.borderColor = 'var(--gold)';
          const toggleBtn = row.querySelector('.badge-quick-toggle');
          if (toggleBtn && canUnequip) {
            toggleBtn.onclick = (e) => {
              e.stopPropagation();
              const ok = worn ? Progress.unequipBadge(id, bid) : Progress.equipBadge(id, bid);
              if (ok) {
                Sound.play('ui_ok');
                redrawGear();
              }
            };
          }
          row.onclick = () => this.openBadgeViewer(id, bid);
        } else {
          const camp = Object.values(CAMPAIGNS).find(c => c.badge === bid);
          const stage = camp ? Save.campaignStage(camp.id) : 0;
          row.innerHTML = `<div class="row" style="align-items:center;gap:8px">
              ${badgeIconHtml(bid, 0)}
              <div class="grow">
                <div class="mini b">${def.name}</div>
                <div class="mini muted">Locked · clear the Friendship Campaign with ${def.friend} (${stage}/${camp ? camp.stages.length : 5})</div>
              </div>
            </div>`;
          row.style.opacity = .6;
          row.onclick = () => this.openBadgeViewer(id, bid);
        }
        bdgCard.appendChild(row);
      });
      wrap.appendChild(bdgCard);
    }

    // Keep the current loadout visible while hiding the management-heavy
    // progression grids behind compact sections.
    const equippedNames = (h.trinkets || []).map(uid => {
      const copy = uid && Save.data.trinketInv[uid];
      return copy && TRINKETS[copy.id] ? TRINKETS[copy.id].name : null;
    }).filter(Boolean);
    const gearSummary = el('div', 'gear-summary card');
    const loadoutSkinDef = HERO_SKINS[id], activeSkin = loadoutSkinDef && h.costume === loadoutSkinDef.id;
    gearSummary.innerHTML = `<div class="gear-summary-head"><div><small>LOADOUT</small><b>${HEROES[id].name}'s Gear</b></div><span>⚙</span></div>
      <div class="gear-summary-grid">
        <div><small>CLASS</small><b>${h.cls || 'Unassigned'}</b></div>
        <div><small>SUBCLASS</small><b>${h.subcls || 'Unassigned'}</b></div>
        <div><small>TRINKETS</small><b>${noTrinket ? 'None · costume variant' : equippedNames.length ? equippedNames.join(' · ') : '2 slots open'}</b></div>
        <div><small>BADGES</small><b>${wornBadges.length ? wornBadges.map(bid=>BADGES[bid].name).join(' · ') : 'None equipped'}</b></div>
        ${loadoutSkinDef ? `<div><small>SKIN</small><b>${activeSkin ? loadoutSkinDef.name : 'Default'}</b></div>` : ''}
      </div>`;
    wrap.prepend(gearSummary);

    const panelMeta = [[clsCard, 'Classes', h.cls || 'Choose a class'], [subCard, 'Subclasses', h.subcls || 'Choose a subclass']];
    if (Progress.rainbowClassUnlocked(id)) panelMeta.push([refCard, 'Reforged Path', 'Second path unlocked']);
    if (!noTrinket) panelMeta.push([trkCard, 'Trinkets', `${equippedNames.length}/2 equipped`]);
    if (ownBadges.length) panelMeta.push([bdgCard, 'Friendship Badges', `${wornBadges.length}/1 equipped`]);
    panelMeta.forEach(([card, title, subtitle], i) => {
      const panelKey = title === 'Reforged Path' ? 'reforged' : title.toLowerCase();
      const oldChildren = Array.from(card.children);
      const body = el('div', 'gear-panel-body');
      oldChildren.forEach(child => body.appendChild(child));
      const toggle = el('button', 'gear-panel-toggle');
      toggle.type = 'button';
      // Keep the Class panel visible when opening Gear. The old condition
      // hid every progression panel as soon as a Hero already had a class.
      const open = this._gearOpenPanel === panelKey || (this._gearOpenPanel == null && i === 0);
      toggle.innerHTML = `<span><b>${title}</b><small>${subtitle}</small></span><i>${open ? '−' : '＋'}</i>`;
      card.classList.add('gear-panel', open ? 'open' : 'closed');
      card.append(toggle, body);
      toggle.onclick = () => {
        const isOpen = card.classList.toggle('open');
        card.classList.toggle('closed', !isOpen);
        toggle.querySelector('i').textContent = isOpen ? '−' : '＋';
        this._gearOpenPanel = isOpen ? panelKey : '__none__';
      };
    });

    return wrap;
  },

  /** Full Friendship Badge detail view. The compact Gear row is only a
      summary; applying a Badge happens deliberately from this detail view so
      the player can see its owner, level, effect, and current state first. */
  openBadgeViewer(id, bid) {
    const def = BADGES[bid], hero = HEROES[id];
    if (!def || !hero || def.owner !== id) return;
    const owned = Save.ownsBadge(bid), lvl = owned ? Save.badgeLvl(bid) : 0;
    const worn = Save.equippedBadges(id).includes(bid);
    const cookieBadge = COOKIE_HERO_IDS.includes(id);
    const friend = Save.hero(def.friend);
    const camp = Object.values(CAMPAIGNS).find(c => c.badge === bid);
    const linkedSkill = def.skillKey || 'W';
    const skill = hero.skills && hero.skills[linkedSkill] ? hero.skills[linkedSkill].name : hero.basic.name;
    const esc = value => String(value == null ? '' : value)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
    const stars = '★'.repeat(Math.min(BADGE_MAX_LVL, Math.max(0, lvl))) +
      '☆'.repeat(Math.max(0, BADGE_MAX_LVL - Math.min(BADGE_MAX_LVL, Math.max(0, lvl))));
    const pct = owned ? Math.round(lvl / BADGE_MAX_LVL * 100) : 0;
    const body = el('div', 'friendship-badge-viewer');
    body.style.setProperty('--badge-color', def.color || '#a5f247');
    body.innerHTML = `<div class="friendship-badge-backdrop"><i></i><i></i><i></i></div>
      <header class="friendship-badge-head">
        <div><small>FRIENDSHIP BADGE</small><h1>${esc(def.name)}</h1>
          <p>BOOSTS ${esc(hero.name.toUpperCase())} · ${esc(skill.toUpperCase())}</p></div>
        <button class="friendship-badge-close" type="button" aria-label="Close">×</button>
      </header>
      <main class="friendship-badge-layout">
        <section class="friendship-badge-side badge-side-left">
          <small>LEVEL</small><b class="friendship-badge-level">${owned ? lvl : '—'}</b>
          <p>${owned ? esc(def.stat(lvl)) : 'Earn this badge by clearing the Friendship Campaign.'}</p>
          <div class="friendship-badge-owned">${owned ? friend ? `🤝 OWNED · ${esc(HEROES[def.friend].name)} SHARDS` : `🤝 OWNED · RECRUIT ${esc(HEROES[def.friend].name.toUpperCase())} TO UPGRADE` : '🔒 LOCKED'}</div>
          <p class="friendship-badge-desc">${esc(def.desc || '')}</p>
        </section>
        <section class="friendship-badge-art" aria-label="${esc(def.name)}">
          <div class="friendship-badge-ring ring-one"></div><div class="friendship-badge-ring ring-two"></div>
          <img src="${Art.hero(id)}" alt="${esc(hero.name)}">
          <div class="friendship-badge-emblem" style="background:radial-gradient(circle at 32% 28%,${def.color || '#a5f247'},#25251d 76%)"><span>${def.icon}</span></div>
          <small>${esc(hero.name)} · ${esc(def.friend)}</small>
        </section>
        <section class="friendship-badge-side badge-side-right">
          <small>STARS <span class="friendship-badge-stars">${stars}</span></small>
          <b class="friendship-badge-stat">${owned ? esc(def.stat(lvl)) + (lvl < BADGE_MAX_LVL ? ` <small class="friendship-badge-next" style="color:var(--gold,#ffd700);font-size:0.82em;font-weight:normal;">➜ ${esc(def.stat(lvl + 1))}</small>` : '') : 'UNLOCK TO VIEW'}</b>
          <div class="friendship-badge-effect"><strong>EFFECT</strong><p>${typeof SkillDesc !== 'undefined' && SkillDesc.enhanceText ? SkillDesc.enhanceText(typeof def.effect === 'function' ? def.effect(lvl) : def.effect || '') : esc(def.effect || '')}</p></div>
          <div class="friendship-badge-progress"><span>${owned ? `LEVEL ${lvl} / ${BADGE_MAX_LVL}` : 'CAMPAIGN REWARD'}</span><i><b style="width:${pct}%"></b></i></div>
        </section>
      </main>
      <footer class="friendship-badge-actions">
        <button class="friendship-badge-apply ${worn ? 'active' : ''}" type="button" ${owned && !(cookieBadge && worn) ? '' : 'disabled'}>${cookieBadge && worn ? '✓ EQUIPPED · CHOOSE OTHER BADGE' : worn ? '✕ UNEQUIP' : '✓ APPLY TO ' + esc(hero.name.toUpperCase())}</button>
        <button class="friendship-badge-upgrade" type="button" ${!owned || lvl >= BADGE_MAX_LVL || !friend || friend.shards < badgeUpgradeCost(lvl) ? 'disabled' : ''}>${lvl >= BADGE_MAX_LVL ? 'MAX LEVEL' : owned ? `＋ UPGRADE · ${badgeUpgradeCost(lvl)} ${esc(def.friend.toUpperCase())} SHARDS` : camp ? `CLEAR ${camp.stages.length} CHAPTERS TO EARN` : 'LOCKED'}</button>
      </footer>`;
    $('.friendship-badge-close', body).onclick = () => UI.closeModal();
    $('.friendship-badge-apply', body).onclick = () => {
      if (!owned) return;
      const ok = worn ? Progress.unequipBadge(id, bid) : Progress.equipBadge(id, bid);
      if (ok) { UI.toast(worn ? `${hero.name}'s badge removed` : `${def.name} applied to ${hero.name}`); UI.closeModal(); this.draw(); }
    };
    $('.friendship-badge-upgrade', body).onclick = () => {
      if (!owned || lvl >= BADGE_MAX_LVL || !friend || friend.shards < badgeUpgradeCost(lvl)) return;
      if (Save.upgradeBadge(bid)) { Sound.play('ui_ok'); UI.closeModal(); this.openBadgeViewer(id, bid); }
    };
    UI.modal(null, body, { bare: true, className: 'friendship-badge-modal' });
  },

  /** Picker sheet for one trinket slot: owned Trinket types show how many
      free copies you have to equip (any owned Hero can wear their own copy
      at once); types you don't own yet just point at the Inventory screen
      to grind or craft one. */
  openTrinketPicker(id, slot) {
    if (HEROES[id] && HEROES[id].noTrinket) return;
    const h = Save.hero(id);
    const wornUid = h.trinkets[slot];
    const body = el('div');
    body.appendChild(el('div', 'trinket-equip-rule', 'ⓘ Any Hero can equip any Trinket. The source character only determines which Signature Fragment is borrowed.'));

    if (wornUid) {
      const off = el('button', 'btn wide', 'Unequip');
      off.onclick = () => { Progress.unequipTrinket(id, slot); UI.closeModal(); this.draw(); };
      body.appendChild(off);
      body.appendChild(el('div', 'spacer'));
    }

    const list = el('div');
    TRINKET_IDS.forEach(tid => {
      const t = TRINKETS[tid];
      const wornHere = wornUid && Save.data.trinketInv[wornUid].id === tid;
      const free = Save.freeTrinketCopies(tid);
      const owned = Save.ownsTrinket(tid);
      const row = el('div', 'row card');
      row.style.cssText = 'margin-bottom:6px;padding:8px;align-items:center';
      if (owned) {
        const rank = wornHere ? Save.data.trinketInv[wornUid].rank : Save.trinketBestRank(tid);
        row.innerHTML = `<img src="${trinketIcon(tid)}" style="width:36px;height:36px;object-fit:contain">
          <div class="grow"><div class="mini b">${t.name}${trinketPlaceholderBadge(tid)}</div>
          <div class="mini muted">Rank ${rank} · ${trinketRankLabel(rank)} · ${trinketStatText(t, rank)}</div>
          <div class="mini trinket-signature">🧩 ${trinketSignatureText(tid)}</div>
          <div class="mini muted">${t.effect}</div>
          <div class="mini" style="color:${wornHere ? 'var(--gold)' : free.length ? 'var(--good)' : 'var(--dim)'}">
            ${wornHere ? 'Worn in this slot' : free.length ? free.length + ' free to equip' : 'All copies already worn'}</div></div>`;
        if (wornHere) row.style.borderColor = 'var(--gold)';
        else if (!free.length) row.style.opacity = .5;
        row.onclick = () => {
          if (wornHere) { Progress.unequipTrinket(id, slot); UI.closeModal(); this.draw(); return; }
          const best = free.reduce((a, b) => Save.data.trinketInv[b].rank > Save.data.trinketInv[a].rank ? b : a, free[0]);
          if (!best) { UI.toast('No free copies - equip one somewhere else first'); return; }
          Progress.equipTrinket(id, slot, best); UI.closeModal(); this.draw();
        };
      } else {
        row.style.opacity = .55;
        row.innerHTML = `<img src="${trinketIcon(tid)}" style="width:36px;height:36px;object-fit:contain;filter:grayscale(.8)">
          <div class="grow"><div class="mini b">${t.name}${trinketPlaceholderBadge(tid)}</div>
          <div class="mini trinket-signature">🧩 ${trinketSignatureText(tid)}</div>
          <div class="mini muted">Not owned · grind Twisteds or Craft one</div></div>`;
      }
      list.appendChild(row);
    });
    body.appendChild(list);
    UI.modal('Choose a Trinket', body);
  }
};
