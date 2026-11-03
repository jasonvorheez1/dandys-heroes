/* Brief, in-place character poses after a finished battle. */
'use strict';

const VictorySequence = {
  active: null,

  careBearIds: new Set(['BedtimeAstro', 'CheerbearShelly', 'WishBearGigi', 'TenderheartSprout', 'ShareBearCosmo']),
  queenIds: new Set(['QOMGourdy', 'QOMEclipse', 'QOMSoulvester', 'QOMRibecca', 'QOMConnie']),
  playResultSound(battle) {
    const winners = battle?.units?.filter(u => u.team === TEAM_P && !u.minion) || [];
    const queenCount = winners.filter(u => this.queenIds.has(u.id)).length;
    const bearCount = winners.filter(u => this.careBearIds.has(u.id)).length;
    const cue = queenCount >= bearCount && queenCount ? 'qom_victory'
      : bearCount ? 'care_bears_victory' : null;
    return !!(cue && typeof Sound !== 'undefined' && Sound.play(cue, { vol: .8, priority: true }));
  },

  // Per-toon sound for the victory pose: [cue, delay ms, options]. Reuses
  // existing cues; the team jingle (playResultSound) is separate.
  poseCues: {
    QOMGourdy: [['drum_hit', 0, { vol: .7 }], ['drum_hit', 260, { vol: .6, rate: 1.1 }], ['drum_hit', 520, { vol: .75, rate: .9 }]],
    QOMEclipse: [['sparkle', 0, { vol: .6 }], ['sparkle', 380, { vol: .5, rate: 1.25 }]],
    QOMRibecca: [['sparkle', 0, { vol: .55, rate: 1.1 }], ['cheer', 250, { vol: .35 }]],
    QOMConnie: [['sparkle', 0, { vol: .5, rate: .9 }], ['drum_hit', 300, { vol: .5, rate: 1.3 }]],
    QOMSoulvester: [['cheer', 0, { vol: .4 }], ['sparkle', 300, { vol: .5 }]]
  },

  playPoseSounds(team) {
    if (typeof Sound === 'undefined') return;
    team.forEach(unit => {
      (this.poseCues[unit.id] || []).forEach(([cue, delay, opts]) => {
        setTimeout(() => { if (this.active) { try { Sound.play(cue, { throttle: 0, ...opts }); } catch (e) {} } }, delay);
      });
    });
  },

  playPreviewSound(id) {
    const cue = this.queenIds.has(id) ? 'qom_victory'
      : this.careBearIds.has(id) ? 'care_bears_victory'
      : typeof HEROES !== 'undefined' && HEROES[id]?.ff7 ? 'ff7_preview_fanfare'
      : null;
    return !!(cue && typeof Sound !== 'undefined' && Sound.play(cue, { vol: .7, priority: true }));
  },

  kind(unit) {
    // Named beats use the same artwork and joints as combat, but let the
    // cast celebrate in character instead of sharing one generic cheer.
    const character = {
      Astro: 'sleep', BedtimeAstro: 'bedtime', Coal: 'sleep',
      Goob: 'hug', ShareBearCosmo: 'share', TenderheartSprout: 'heart',
      Glisten: 'twirl', Jessie: 'twirl', Yatta: 'twirl',
      Vee: 'spotlight', Dandy: 'spotlight',
      Copper: 'salute', Soulvester: 'salute', QOMSoulvester: 'encore', Dyle: 'salute',
      Rodger: 'inspect', Shelly: 'inspect', CheerbearShelly: 'rainbow', Gigi: 'inspect', WishBearGigi: 'wish',
      Shrimpo: 'punch', Discard: 'punch',
      Looey: 'party', Gourdy: 'party', QOMGourdy: 'drum', Bobette: 'party',
      Poppy: 'party', Toodles: 'party', Rudie: 'party',
      Tisha: 'wave', Cosmo: 'wave', Sprout: 'wave', Ginger: 'wave', Cocoa: 'wave',
      Boxten: 'melody', Flutter: 'flutter', Flyte: 'flutter', Pebble: 'playbow',
      RnD: 'duet', Blot: 'mime', Teagan: 'toast', Brightney: 'shine',
      Brusha: 'paint', Squirm: 'wiggle', Eggson: 'courtly',
      QOMEclipse: 'moon', QOMRibecca: 'diva', QOMConnie: 'guitar',
      Tifa: 'punch', Cloud: 'salute', CaitSith: 'party', Aerith: 'wave'
    };
    if (character[unit.id]) return character[unit.id];
    const gait = unit.def?.move?.gait || '';
    if (/float|glide|hover|soar|drowse/.test(gait)) return 'float';
    if (/bounce|hop|spring|roll|flop/.test(gait)) return 'bounce';
    if (/stomp|trudge|guard/.test(gait) || unit.def?.role === 'Tank') return 'stomp';
    if (/swagger|poise|waddle/.test(gait) || ['Vee', 'Glisten', 'Dandy', 'Yatta', 'Jessie'].includes(unit.id)) return 'show';
    return 'hero';
  },

  sample(kind, progress) {
    const p = Math.max(0, Math.min(1, progress));
    const pulse = Math.sin(Math.PI * Math.min(1, p / .78));
    const settle = Math.max(0, Math.min(1, (p - .46) / .3));
    const open = pulse * .65 + settle * .35;
    const snap = Math.sin(Math.PI * Math.max(0, Math.min(1, (p - .15) / .6)));
    const hop = Math.max(0, Math.sin(p * Math.PI * 3));
    const beat = Math.sin(p * Math.PI * 4) * pulse;
    const pose = { x: 0, y: -5 * open, r: 0, sx: 1, sy: 1,
      joints: { head: -5 * snap, armL: -31 * open, armR: 33 * open, legL: 0, legR: 0 } };
    switch (kind) {
      case 'rainbow':
        pose.y = -18 * hop - 4 * settle; pose.r = .08 * beat;
        Object.assign(pose.joints, { head: -9 * snap, armL: -54 * open,
          armR: 57 * open, legL: -8 * hop, legR: 8 * hop });
        break;
      case 'wish':
        pose.y = -11 * pulse - 5 * settle; pose.r = -.06 * pulse;
        Object.assign(pose.joints, { head: -13 * snap, armL: -18 * open,
          armR: -56 * open, legL: -6 * pulse, legR: 8 * pulse, cap: -12 * open });
        break;
      case 'heart':
        pose.y = -8 * pulse - 3 * settle; pose.sx = 1 + .05 * pulse;
        Object.assign(pose.joints, { head: -11 * snap, armL: -47 * open,
          armR: 49 * open, legL: -5 * snap, legR: 5 * snap });
        break;
      case 'share':
        pose.y = -16 * hop - 4 * settle; pose.r = .07 * beat;
        Object.assign(pose.joints, { head: -7 * snap, armL: -48 * open,
          armR: 47 * open, legL: -9 * hop, legR: 9 * hop });
        break;
      case 'bedtime':
        pose.y = 3 * pulse - 12 * snap; pose.r = .1 * pulse - .08 * snap;
        Object.assign(pose.joints, { head: 14 * pulse - 16 * snap,
          armL: -20 * open, armR: 22 * open });
        break;
      case 'drum':
        pose.y = -5 * pulse; pose.r = .07 * beat;
        Object.assign(pose.joints, { head: -8 * beat, armL: -26 * open - 16 * beat,
          armR: 28 * open + 16 * beat });
        break;
      case 'guitar':
        pose.y = -13 * pulse - 4 * settle; pose.r = -.13 * pulse + .07 * settle;
        Object.assign(pose.joints, { head: -12 * snap, armL: -34 * open,
          armR: 22 * open + 14 * beat });
        break;
      case 'encore':
        pose.y = -8 * pulse - 4 * settle; pose.r = -.08 * pulse;
        Object.assign(pose.joints, { head: -9 * snap, armL: -19 * open,
          armR: -58 * open, legL: -5 * pulse, legR: 7 * pulse });
        break;
      case 'moon':
        pose.y = -19 * pulse - 7 * settle; pose.r = .12 * beat;
        Object.assign(pose.joints, { head: -10 * snap, armL: -49 * open,
          armR: 39 * open });
        break;
      case 'diva':
        pose.y = -12 * pulse - 5 * settle; pose.x = 7 * pulse;
        pose.r = .13 * pulse - .06 * settle;
        Object.assign(pose.joints, { head: -12 * snap, armL: -14 * open,
          armR: -59 * open });
        break;
      case 'melody': // Boxten taps out a little tune with his hands.
        pose.y = -5 * pulse - 3 * settle; pose.r = .08 * beat;
        Object.assign(pose.joints, { head: -7 * beat, armL: -20 * open + 23 * beat,
          armR: 20 * open + 23 * beat, legL: -6 * beat, legR: 6 * beat });
        break;
      case 'flutter': // The wing, rather than a pair of invented arms, leads.
        pose.y = -18 * pulse - 5 * settle; pose.r = -.09 * beat;
        Object.assign(pose.joints, { head: -8 * pulse, wing: -26 * open - 25 * beat,
          legL: -8 * pulse, legR: 8 * pulse });
        break;
      case 'playbow': // Pebble drops onto the front paws and pops back up.
        pose.y = 8 * pulse - 5 * settle; pose.r = .08 * pulse - .04 * settle;
        pose.sx = 1 + .05 * pulse; pose.sy = 1 - .08 * pulse;
        Object.assign(pose.joints, { head: -18 * snap, body: 8 * pulse,
          backLeg: -8 * pulse, frontLeg: 17 * pulse - 6 * settle });
        break;
      case 'duet': // Razz and Dazzle answer one another.
        pose.y = -7 * pulse; pose.r = .04 * beat;
        Object.assign(pose.joints, { headL: -13 * pulse + 7 * beat,
          headR: 12 * pulse + 7 * beat, armL: -31 * open - 10 * beat,
          armR: 31 * open - 10 * beat });
        break;
      case 'mime':
        pose.y = -4 * pulse; pose.r = .06 * pulse;
        Object.assign(pose.joints, { head: 9 * pulse - 7 * settle,
          armL: -46 * open, armR: -42 * open, body: -5 * pulse });
        break;
      case 'toast': // Teagan lifts an arm like a cup, then gives a small nod.
        pose.y = -5 * pulse; pose.r = -.05 * pulse;
        Object.assign(pose.joints, { head: 12 * snap, armL: -9 * open,
          armR: -58 * open });
        break;
      case 'shine':
        pose.y = -10 * pulse - 4 * settle; pose.sx = 1 + .06 * pulse;
        Object.assign(pose.joints, { head: -12 * pulse, armL: -45 * open,
          armR: 44 * open, body: 4 * beat });
        break;
      case 'paint': // Brusha finishes with two brisk brush strokes.
        pose.x = 4 * beat; pose.y = -4 * pulse; pose.r = .06 * beat;
        Object.assign(pose.joints, { head: 8 * pulse, armL: -12 * open,
          armR: -28 * open - 34 * beat });
        break;
      case 'wiggle': // Squirm's existing front and back segments sway apart.
        pose.y = -4 * pulse; pose.x = 6 * beat; pose.r = .07 * beat;
        Object.assign(pose.joints, { head: -12 * beat, body: 9 * beat,
          backLeg: -15 * beat, frontLeg: 16 * beat });
        break;
      case 'courtly':
        pose.y = 6 * pulse - 3 * settle; pose.r = .09 * pulse;
        Object.assign(pose.joints, { head: 22 * pulse - 11 * settle,
          armL: 13 * open, armR: -13 * open });
        break;
      case 'sleep': // Astro nods off, then gives a little startled wake-up.
        pose.y = 5 * pulse - 7 * snap; pose.r = .12 * pulse - .06 * snap;
        Object.assign(pose.joints, { head: 18 * pulse - 15 * snap, armL: 8 * open, armR: -8 * open });
        break;
      case 'hug': // Goob reaches out with both arms.
        pose.y = -9 * open; pose.sx = 1 + .09 * open;
        Object.assign(pose.joints, { head: -8 * snap, armL: -63 * open, armR: 65 * open });
        break;
      case 'twirl':
        pose.y = -12 * pulse - 3 * settle; pose.x = 11 * Math.sin(p * Math.PI * 1.7) * pulse;
        pose.r = .28 * Math.sin(p * Math.PI * 1.7) * pulse + .08 * settle;
        Object.assign(pose.joints, { head: -12 * snap, armL: -52 * open, armR: 24 * open,
          legL: -11 * snap, legR: 12 * snap });
        break;
      case 'spotlight':
        pose.y = -14 * open; pose.r = -.13 * pulse + .09 * settle; pose.sx = 1 + .08 * open;
        Object.assign(pose.joints, { head: -13 * snap, armL: -16 * open, armR: -70 * open });
        break;
      case 'salute':
        pose.y = 4 * pulse - 5 * settle; pose.r = -.05 * pulse;
        Object.assign(pose.joints, { head: -7 * snap, armL: -10 * open, armR: -52 * open });
        break;
      case 'inspect':
        pose.x = 7 * pulse; pose.y = -5 * pulse; pose.r = .14 * pulse - .09 * settle;
        Object.assign(pose.joints, { head: 13 * pulse - 8 * settle, armL: 4 * open, armR: -30 * open });
        break;
      case 'punch':
        pose.x = 9 * snap; pose.y = 7 * pulse - 8 * snap; pose.r = -.12 * pulse + .17 * snap;
        pose.sx = 1 + .12 * snap; pose.sy = 1 - .08 * pulse;
        Object.assign(pose.joints, { head: 9 * pulse, armL: 23 * pulse, armR: -68 * snap,
          legL: -8 * snap, legR: 8 * snap });
        break;
      case 'party':
        pose.y = -29 * hop - 4 * settle; pose.r = .14 * Math.sin(p * Math.PI * 3);
        pose.sx = 1 + .1 * pulse - .07 * hop; pose.sy = 1 - .08 * pulse + .1 * hop;
        Object.assign(pose.joints, { head: -8 * snap, armL: -48 * open, armR: 52 * open,
          legL: -12 * snap, legR: 12 * snap });
        break;
      case 'wave':
        pose.y = -7 * open; pose.r = .06 * pulse;
        Object.assign(pose.joints, { head: -7 * snap, armL: -12 * open,
          armR: (-46 + 15 * Math.sin(p * Math.PI * 5)) * open });
        break;
      case 'float':
        pose.y = -18 * pulse - 8 * settle; pose.x = 9 * Math.sin(p * Math.PI * 2) * pulse;
        pose.r = .08 * Math.sin(p * Math.PI * 2) * pulse + .035 * settle;
        break;
      case 'bounce':
        pose.y = 7 * snap - 30 * hop - 5 * settle; pose.r = .11 * Math.sin(p * Math.PI * 3);
        pose.sx = 1 + .13 * snap - .08 * hop; pose.sy = 1 - .1 * snap + .1 * hop;
        Object.assign(pose.joints, { armR: 47 * open, legL: -13 * snap, legR: 13 * snap });
        break;
      case 'stomp':
        pose.y = 8 * snap - 7 * pulse; pose.r = -.08 * snap + .045 * settle;
        pose.sx = 1 + .13 * settle; pose.sy = 1 - .07 * settle;
        Object.assign(pose.joints, { armL: -19 * open, armR: 16 * open });
        break;
      case 'show':
        pose.y = -13 * pulse - 5 * settle; pose.x = 7 * pulse;
        pose.r = .19 * Math.sin(p * Math.PI * 1.45) * pulse + .09 * settle;
        pose.sx = 1 + .08 * pulse;
        Object.assign(pose.joints, { head: -12 * snap, armL: -43 * open });
        break;
      default:
        pose.y = 7 * snap - 22 * pulse - 5 * settle;
        pose.r = -.06 * snap + .09 * pulse + .06 * settle;
        pose.sx = 1 + .08 * pulse; pose.sy = 1 - .08 * snap + .06 * pulse;
    }
    return pose;
  },

  play(battle, done, options = {}) {
    this.stop();
    const arena = document.getElementById('battle');
    const side = options.team == null ? TEAM_P : options.team;
    const team = battle.units.filter(unit => unit.alive && unit.team === side && !unit.minion && unit.el);
    if (!arena || !team.length) { done(); return; }
    if (typeof Accessibility !== 'undefined' && Accessibility.enabled()) { done(); return; }

    team.forEach(unit => {
      unit.moving = false; unit.vx = 0; unit.vy = 0; unit.target = null;
      unit.animT = 0; unit.animStyle = null; unit.casting = null;
      unit._toonSkillMotion = null; unit._clip = null; unit._clipUntil = 0;
      unit.hitT = 0; unit.shakeT = 0; unit.turnT = 0;
      unit._victoryPose = { kind: this.kind(unit), p: 0, elapsed: 0 };
    });

    const record = { arena, battle, team, frame: 0 };
    this.active = record;
    this.playPoseSounds(team);
    const duration = options.duration || 1.05;
    const poseDuration = options.poseDuration || duration;
    let start = 0, last = 0;
    const tick = now => {
      if (this.active !== record) return;
      if (!arena.isConnected || BattleScreen.active !== battle) { this.stop(); return; }
      if (!start) { start = now; last = now; }
      const elapsed = Math.min((now - start) / 1000, duration);
      const dt = Math.min((now - last) / 1000, .05);
      last = now;
      team.forEach(unit => {
        unit._victoryPose.p = Math.min(1, elapsed / poseDuration);
        unit._victoryPose.elapsed = elapsed;
      });
      try {
        battle.render(dt);
        FX.update(dt);
      } catch (error) {
        console.warn('Victory pose ended early', error);
        this.stop();
        done();
        return;
      }
      if (elapsed < duration) { record.frame = requestAnimationFrame(tick); return; }
      this.stop();
      done();
    };
    record.frame = requestAnimationFrame(tick);
  },

  stop() {
    const record = this.active;
    if (!record) return;
    this.active = null;
    cancelAnimationFrame(record.frame);
    record.team.forEach(unit => { unit._victoryPose = null; });
    if (record.battle && record.arena.isConnected) {
      try { record.battle.render(0); }
      catch (error) { console.warn('Victory pose cleanup failed', error); }
    }
  }
};
