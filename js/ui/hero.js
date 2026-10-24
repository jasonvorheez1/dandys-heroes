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
  basic: { toodlesMode: 'swing', previewActions: [{ state: 'attack', dur: .28 }], castCue: 'swing_light', impactCue: 'hit_blunt', floatLabel: 'CONFIDENT SWING' },
  W: { toodlesMode: 'roll', previewActions: [{ state: 'cast', dur: .72 }], castCue: 'toodles_gamble', impactCue: 'sparkle', previewType: 'MAGIC 8-BALL', floatLabel: 'OUTLOOK GOOD!' },
  G: { toodlesMode: 'strike', previewActions: [{ state: 'wind', dur: .38 }], dashes: true, castCue: 'dash', impactCue: 'hit_heavy', previewType: 'LUCKY STRIKE', floatLabel: 'HAMMER SMASH!' },
  B: { toodlesMode: 'miracle', ally: true, previewActions: [{ state: 'cast', dur: .56 }], castCue: 'toodles_gamble', impactCue: 'cleanse', previewType: 'SMALL MIRACLE', floatLabel: 'DOG PLUSH SHIELD' },
  P: { toodlesMode: 'improve', passive: true, previewActions: [{ state: 'idle', dur: .78 }], castCue: 'sparkle', impactCue: null, previewType: 'ALWAYS IMPROVING', floatLabel: 'LEARNING FAST' },
  R: { toodlesMode: 'charm', passive: true, previewActions: [{ state: 'idle', dur: .78 }], castCue: 'toodles_gamble', impactCue: null, previewType: 'LUCKY CHARM', floatLabel: 'NO REPEATS' }
};

const QOM_GOURDY_SKILL_PREVIEWS = {
  basic: { qomGourdyMode: 'beat', previewActions: [{ state: 'attack', dur: .32 }], castCue: 'qom_snare', impactCue: 'qom_crash', floatLabel: 'DRUM BEAT' },
  W: { qomGourdyMode: 'solo', ally: false, previewActions: [{ state: 'cast', dur: .82 }], castCue: 'qom_riff', impactCue: 'qom_crash', previewType: 'DRUM SOLO', floatLabel: 'SOLO PYRO!' },
  G: { qomGourdyMode: 'feedback', ally: false, previewActions: [{ state: 'cast', dur: .65 }], castCue: 'qom_bone', impactCue: 'hit_magic', previewType: 'FEEDBACK', floatLabel: 'INTERRUPT!' },
  B: { qomGourdyMode: 'vip', ally: true, previewActions: [{ state: 'cast', dur: .6 }], castCue: 'qom_guard', impactCue: 'cleanse', previewType: 'VIP PASS', floatLabel: 'VIP PASS!' },
  P: { qomGourdyMode: 'meter', passive: true, previewActions: [{ state: 'idle', dur: .78 }], castCue: 'qom_snare', impactCue: null, previewType: 'RHYTHM', floatLabel: 'KEEP THE BEAT' },
  R: { qomGourdyMode: 'encore', ally: false, previewActions: [{ state: 'cast', dur: .9 }], castCue: 'qom_riff', impactCue: 'qom_crash', previewType: 'FINALE', floatLabel: 'ENCORE!' }
};

const QOM_ECLIPSE_SKILL_PREVIEWS = {
  basic: { qomEclipseMode: 'riff', dashes: true, previewActions: [{ state: 'attack', dur: .28 }], castCue: 'swing_claw', impactCue: 'hit_slash', previewType: 'CLAW & GUITAR', floatLabel: 'CLAW & GUITAR' },
  W: { qomEclipseMode: 'solo', dashes: true, previewActions: [{ state: 'cast', dur: .82 }], castCue: 'qom_riff', impactCue: 'qom_crash', previewType: 'FULL VOLUME', floatLabel: 'FULL VOLUME LEAP!' },
  G: { qomEclipseMode: 'feedback', ally: false, previewActions: [{ state: 'cast', dur: .62 }], castCue: 'qom_riff', impactCue: 'hit_magic', previewType: 'FEEDBACK', floatLabel: 'FEEDBACK FRENZY' },
  B: { qomEclipseMode: 'howl', dashes: true, previewActions: [{ state: 'move', dur: .32 }, { state: 'attack', dur: .42 }], castCue: 'qom_hey', impactCue: 'hit_slash', previewType: 'HOWLING RIFF', floatLabel: 'HOWLING RIFF' },
  P: { qomEclipseMode: 'heart', passive: true, previewActions: [{ state: 'idle', dur: .78 }], castCue: 'lock', impactCue: null, previewType: 'WILD AT HEART', floatLabel: 'BACKSTAGE GUARD' },
  R: { qomEclipseMode: 'headliner', dashes: true, previewActions: [{ state: 'cast', dur: .88 }], castCue: 'qom_riff', impactCue: 'crit', previewType: 'HEADLINER', floatLabel: 'FINAL ENCORE!' }
};

const QOM_RIBECCA_SKILL_PREVIEWS = {
  basic: { qomRibeccaMode: 'keytar', previewActions: [{ state: 'attack', dur: .34 }], castCue: 'hit_blunt', impactCue: 'hit_magic', previewType: 'KEYTAR CHORD', floatLabel: 'KEYTAR CHORD' },
  W: { qomRibeccaMode: 'symphony', ally: true, previewActions: [{ state: 'cast', dur: .82 }], castCue: 'qom_guard', impactCue: 'sparkle', previewType: 'SOUND BARRIER', floatLabel: 'SKELETON SYMPHONY' },
  G: { qomRibeccaMode: 'bone', previewActions: [{ state: 'attack', dur: .60 }], castCue: 'qom_bone', impactCue: 'qom_counter', previewType: 'BONE BOUNCE', floatLabel: 'BONE RATTLER!' },
  B: { qomRibeccaMode: 'backstage', ally: true, previewActions: [{ state: 'cast', dur: .68 }], castCue: 'qom_guard', impactCue: 'guard', previewType: 'PROTECTION', floatLabel: 'BACKSTAGE GUARD' },
  P: { qomRibeccaMode: 'undead', passive: true, previewActions: [{ state: 'idle', dur: .78 }], castCue: 'qom_guard', impactCue: null, previewType: 'THE UNDEAD', floatLabel: 'REASSEMBLE!' },
  R: { qomRibeccaMode: 'ovation', ally: true, passive: true, previewActions: [{ state: 'cast', dur: .85 }], castCue: 'qom_guard', impactCue: 'cleanse', previewType: 'STANDING OVATION', floatLabel: 'STANDING OVATION' }
};

const QOM_SOULVESTER_SKILL_PREVIEWS = {
  basic: { qomSoulvesterMode: 'slash', dashes: true, previewActions: [{ state: 'attack', dur: .30 }], castCue: 'swing_sword', impactCue: 'hit_slash', previewType: 'KNIGHT SLASH', floatLabel: 'KNIGHT SLASH' },
  W: { qomSoulvesterMode: 'knight', dashes: true, previewActions: [{ state: 'cast', dur: .75 }], castCue: 'qom_counter', impactCue: 'hit_heavy', previewType: 'INTERCEPTION', floatLabel: 'KNIGHT OF MISCHIEF' },
  G: { qomSoulvesterMode: 'parry', previewActions: [{ state: 'cast', dur: .62 }], castCue: 'qom_counter', impactCue: 'guard', previewType: 'PERFECT PARRY', floatLabel: 'PERFECT PARRY!' },
  B: { qomSoulvesterMode: 'royal', ally: true, dashes: true, previewActions: [{ state: 'move', dur: .4 }, { state: 'attack', dur: .42 }], castCue: 'dash', impactCue: 'hit_heavy', previewType: 'ROYAL GUARD', floatLabel: 'ROYAL INTERVENTION' },
  P: { qomSoulvesterMode: 'resolve', passive: true, previewActions: [{ state: 'idle', dur: .78 }], castCue: 'lock', impactCue: null, previewType: 'RESOLVE', floatLabel: 'KNIGHTLY RESOLVE' },
  R: { qomSoulvesterMode: 'curtain', dashes: true, previewActions: [{ state: 'attack', dur: .88 }], castCue: 'qom_counter', impactCue: 'crit', previewType: 'LAST STAND', floatLabel: 'GRAND RIPOSTE!' }
};

const QOM_CONNIE_SKILL_PREVIEWS = {
  basic: { qomConnieMode: 'strum', previewActions: [{ state: 'attack', dur: .28 }], castCue: 'qom_ghost', impactCue: 'hit_magic', previewType: 'SPECTRAL GUITAR', floatLabel: 'SPECTRAL GUITAR' },
  W: { qomConnieMode: 'solo', previewActions: [{ state: 'cast', dur: .85 }], castCue: 'qom_ghost', impactCue: 'hit_magic', previewType: 'PHANTOM SOLO', floatLabel: 'PHANTOM SOLO!' },
  G: { qomConnieMode: 'escape', dashes: true, previewActions: [{ state: 'move', dur: .35 }, { state: 'cast', dur: .52 }], castCue: 'qom_ghost', impactCue: 'dash', previewType: 'HAUNTING ESCAPE', floatLabel: 'HAUNTING ESCAPE' },
  B: { qomConnieMode: 'possess', previewActions: [{ state: 'cast', dur: .64 }], castCue: 'qom_ghost', impactCue: 'curse', previewType: 'POSSESSION', floatLabel: 'POSSESSED PERFORMANCE' },
  P: { qomConnieMode: 'ghost', passive: true, previewActions: [{ state: 'idle', dur: .78 }], castCue: 'qom_ghost', impactCue: null, previewType: 'UNTOUCHABLE', floatLabel: 'CAN\'T HIT A GHOST' },
  R: { qomConnieMode: 'ovation', ally: true, previewActions: [{ state: 'cast', dur: .90 }], castCue: 'qom_ghost', impactCue: 'sparkle', previewType: 'GHOSTLY OVATION', floatLabel: 'GHOSTLY OVATION' }
};

const MRS_HOLLOWAY_SKILL_PREVIEWS = {
  basic: { previewActions: [{ state: 'attack', dur: .32 }], castCue: 'whoosh', impactCue: 'hit_magic', floatLabel: 'SPIRALING ENERGY' },
  W: { ally: false, previewActions: [{ state: 'cast', dur: .85 }], castCue: 'beam_fire', impactCue: 'hit_magic', previewType: 'SPECTRAL BURST', floatLabel: 'SPECTRAL BURST' },
  G: { ally: false, previewActions: [{ state: 'cast', dur: .75 }], castCue: 'spirit_aura', impactCue: 'hit_magic', previewType: 'A FAMILIAR FACE', floatLabel: 'A FAMILIAR FACE' },
  B: { ally: true, previewActions: [{ state: 'cast', dur: .70 }], castCue: 'spirit_heal', impactCue: 'sparkle', previewType: 'MOTHER’S EMBRACE', floatLabel: 'MOTHER’S EMBRACE' },
  P: { passive: true, previewActions: [{ state: 'idle', dur: .80 }], castCue: 'spirit_aura', impactCue: 'fanfare', previewType: 'GONE, BUT NOT FORGOTTEN', floatLabel: 'REVIVED: SPIRIT MEMORY' },
  R: { passive: true, previewActions: [{ state: 'idle', dur: .80 }], castCue: 'spirit_aura', impactCue: null, previewType: 'THE HOLLOWAY LEGACY', floatLabel: 'LINGERING PRESENCE' }
};

const MR_HOLLOWAY_SKILL_PREVIEWS = {
  basic: { previewActions: [{ state: 'attack', dur: .35 }], castCue: 'swing_heavy', impactCue: 'hit_heavy', floatLabel: 'CLAW SWIPE' },
  W: { ally: false, previewActions: [{ state: 'cast', dur: .80 }], castCue: 'impact_heavy', impactCue: 'earth_quake', previewType: 'HARVEST CRASH', floatLabel: 'HARVEST CRASH' },
  G: { ally: true, previewActions: [{ state: 'cast', dur: .65 }], castCue: 'wind_heavy', impactCue: 'sparkle', previewType: 'AUTUMN DOWNPOUR', floatLabel: 'AUTUMN DOWNPOUR' },
  B: { ally: true, previewActions: [{ state: 'cast', dur: .70 }], castCue: 'earth_rumble', impactCue: 'sparkle', previewType: 'ROOTED RESOLVE', floatLabel: 'ROOTED RESOLVE' },
  P: { passive: true, previewActions: [{ state: 'idle', dur: .80 }], castCue: 'warn', impactCue: 'fanfare', previewType: 'STILL STANDING', floatLabel: 'LAST HARVEST SHIELD' },
  R: { passive: true, previewActions: [{ state: 'idle', dur: .80 }], castCue: 'impact_heavy', impactCue: null, previewType: 'A FATHER’S RESOLVE', floatLabel: 'A FATHER’S RESOLVE' }
};

const DELILAH_SKILL_PREVIEWS = {
  basic: { previewActions: [{ state: 'attack', dur: .32 }], castCue: 'whoosh', impactCue: 'hit_magic', floatLabel: 'ICHOR SYRINGE' },
  W: { ally: false, previewActions: [{ state: 'cast', dur: .78 }], castCue: 'beam_charge', impactCue: 'sparkle', previewType: 'CONTROLLED EXPERIMENT', floatLabel: 'SPECIMEN RELEASE' },
  G: { ally: false, previewActions: [{ state: 'wind', dur: .65 }, { state: 'attack', dur: .28 }], castCue: 'beam_charge', impactCue: 'spectral', previewType: 'UNSTABLE SAMPLE', floatLabel: 'CONTAMINATION' },
  B: { ally: false, previewActions: [{ state: 'cast', dur: .72 }], castCue: 'lock', impactCue: 'spectral', previewType: 'CONTAINMENT PROCEDURE', floatLabel: 'STERILE STASIS' },
  P: { passive: true, previewActions: [{ state: 'idle', dur: .80 }], castCue: 'sparkle', impactCue: null, previewType: 'CLINICAL OBSERVATION', floatLabel: 'CLINICAL INSIGHT' },
  R: { passive: true, previewActions: [{ state: 'idle', dur: .80 }], castCue: 'warn', impactCue: null, previewType: 'FURTHER TESTING REQUIRED', floatLabel: 'ICHOR CATALYST' }
};

const SHELLY_SKILL_PREVIEWS = {
  basic: { previewActions: [{ state: 'attack', dur: .28 }], castCue: 'whoosh', impactCue: 'hit_magic', floatLabel: 'STRATUM EXTRACTION' },
  W: { ally: true, previewActions: [{ state: 'cast', dur: 1.05 }], castCue: 'lock', impactCue: 'earth_quake', previewType: 'FOSSIL MATRIX', floatLabel: 'FOSSIL DISCOVERY' },
  G: { ally: true, previewActions: [{ state: 'cast', dur: .95 }], castCue: 'cheer', impactCue: 'fanfare', previewType: 'INSPIRATION!', floatLabel: 'RELENTLESS INSPIRATION!' },
  B: { ally: true, previewActions: [{ state: 'cast', dur: .85 }], castCue: 'cleanse', impactCue: 'guard', previewType: 'PROBLEM SOLVER', floatLabel: '5★ PROBLEM SOLVED' },
  P: { passive: true, previewActions: [{ state: 'idle', dur: .80 }], castCue: 'sparkle', impactCue: 'fanfare', previewType: 'PALEONTOLOGIST PASSION', floatLabel: 'EUREKA BREAKTHROUGH' },
  R: { passive: true, previewActions: [{ state: 'idle', dur: .80 }], castCue: 'earth_quake', impactCue: null, previewType: 'ANCIENT ARCHIVE', floatLabel: 'PREHISTORIC STOMP' }
};

const CONNIE_SKILL_PREVIEWS = {
  basic: { previewActions: [{ state: 'attack', dur: .26 }], castCue: 'whoosh', impactCue: 'hit_magic', floatLabel: 'POLTERGEIST TOUCH' },
  W: { ally: true, previewActions: [{ state: 'cast', dur: .90 }], castCue: 'unsummon', impactCue: 'fanfare', previewType: 'HAUNTING ESCAPE', floatLabel: 'BOO! JUMPSCARE!' },
  G: { ally: false, previewActions: [{ state: 'wind', dur: .35 }, { state: 'attack', dur: .38 }], dashes: true, castCue: 'dash', impactCue: 'hit_magic', previewType: 'PHANTOM PRANK', floatLabel: 'PRANK STRIKE' },
  B: { ally: false, previewActions: [{ state: 'cast', dur: .52 }], castCue: 'dash', impactCue: 'buff', previewType: 'SPECTRAL DRIFT', floatLabel: 'SPECTRAL DRIFT' },
  P: { ally: true, passive: true, previewActions: [{ state: 'idle', dur: .80 }], castCue: 'cure_all', impactCue: 'sparkle', previewType: 'SPIRITUAL TETHER', floatLabel: 'SPIRITUAL TETHER' },
  R: { ally: true, passive: true, previewActions: [{ state: 'idle', dur: .80 }], castCue: 'fanfare', impactCue: 'unsummon', previewType: 'BEYOND THE VEIL', floatLabel: 'PHANTOM RESCUE' }
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
const PREVIEW_STATUS_PILL_MAP = {
  stun: { icon: '⚡', label: 'STUNNED', col: '#ffda59' },
  freeze: { icon: '❄️', label: 'FROZEN', col: '#84e5ff' },
  exposed: { icon: '🎯', label: 'EXPOSED', col: '#ff5454' },
  silence: { icon: '🔇', label: 'SILENCED', col: '#c996ff' },
  blind: { icon: '👁️', label: 'BLINDED', col: '#a8a8a8' },
  dazed: { icon: '💫', label: 'DAZED', col: '#ffd166' },
  sleep: { icon: '💤', label: 'ASLEEP', col: '#b9a4ff' },
  burn: { icon: '🔥', label: 'BURN', col: '#ff6e3a' },
  bleed: { icon: '🩸', label: 'BLEED', col: '#ff3d5a' },
  poison: { icon: '🧪', label: 'POISON', col: '#62f06b' },
  slow: { icon: '⏳', label: 'SLOWED', col: '#7fd8ff' },
  ward: { icon: '🛡️', label: 'WARD', col: '#60b5ff' },
  cookie_stringbound: { icon: '🪢', label: 'STRINGBOUND', col: '#8b64ef' },
  cookie_puppet_show: { icon: '🎭', label: 'PUPPET SHOW', col: '#62a8ff' },
  cookie_eye_deceit: { icon: '👁️', label: 'DECEIT', col: '#9c6aff' },
  cookie_taint: { icon: '🟣', label: 'TAINTED', col: '#bf6aff' },
  haste: { icon: '⚡', label: 'HASTE', col: '#5effb7' },
  lucky: { icon: '🍀', label: 'LUCKY', col: '#82f556' },
  fortify: { icon: '🧱', label: 'FORTIFIED', col: '#e8b86d' },
  taunt: { icon: '💢', label: 'TAUNTED', col: '#ff4c37' },
  drowsy: { icon: '🌙', label: 'DROWSY', col: '#b9a4ff' },
  cleanfocus: { icon: '✨', label: 'CLEAN FOCUS', col: '#8be4a0' },
  weaken: { icon: '💔', label: 'WEAKENED', col: '#ff8a8a' },
  regen: { icon: '🌱', label: 'REGEN', col: '#67c84c' },
  invis: { icon: '👻', label: 'VANISHED', col: '#9caaa4' },
  rage: { icon: '🔥', label: 'ENRAGED', col: '#ff5454' },
  armor: { icon: '🛡️', label: 'ARMORED', col: '#78c6ff' },
  contamination: { icon: '☣️', label: 'CONTAMINATION', col: '#00e5a3' },
  contained: { icon: '⛓️', label: 'CONTAINED', col: '#caa2ff' },
  sterileprotocol: { icon: '🧼', label: 'STERILE', col: '#5effb7' },
  testsubject: { icon: '🧪', label: 'TEST SUBJECT', col: '#caa2ff' },
  failedvariable: { icon: '⚠️', label: 'FAILED VARIABLE', col: '#ff5454' },
  stratigraphy: { icon: '🔍', label: 'STRATIGRAPHY', col: '#d8b579' },
  fullyresearched: { icon: '🦴', label: 'RESEARCHED', col: '#d8b579' },
  amberstasis: { icon: '💎', label: 'AMBER STASIS', col: '#fef08a' },
  haunted: { icon: '👻', label: 'HAUNTED', col: '#bfe9ff' },
  terrified: { icon: '😱', label: 'TERRIFIED', col: '#e879f9' }
};


function skillRankPreview(skill, lv) {
  if (!skill || lv >= SKILL_MAX_LEVEL) return '';
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
  basic: { veeMode: 'signal', ally: false, projectile: false, previewActions: [{ state: 'attack', dur: .34 }],
    castCue: 'swing_pole', impactCue: 'hit_blunt', floatLabel: 'SIGNAL PULSE!' },
  W: { veeMode: 'spotlight', ally: false, projectile: false, previewActions: [{ state: 'cast', dur: .72 }],
    castCue: 'flash', impactCue: 'beam_fire', floatLabel: 'HEADLINE!' },
  G: { veeMode: 'audience', ally: true, projectile: false, previewActions: [{ state: 'cast', dur: .76 }],
    castCue: 'cheer', impactCue: 'sparkle', floatLabel: 'AUDIENCE BOOST!' },
  B: { veeMode: 'commercial', ally: false, projectile: false, previewNoDamage: true, previewType: 'TEAM CONTROL', previewActions: [{ state: 'cast', dur: .84 }],
    castCue: 'ui_open', impactCue: 'ticktock', floatLabel: 'SLOWED!' },
  P: { veeMode: 'production', ally: true, projectile: false, previewNoDamage: true, previewType: 'PASSIVE TRIGGER', previewActions: [{ state: 'cast', dur: .65 }],
    castCue: 'lock', impactCue: 'shield', floatLabel: 'PRODUCTION VALUE!' },
  R: { veeMode: 'finale', ally: false, projectile: false, previewType: 'LIVE BROADCAST', previewActions: [{ state: 'cast', dur: .88 }],
    castCue: 'suddendeath', impactCue: 'ult', floatLabel: 'LIVE ON AIR!' }
};

const FLYTE_SKILL_PREVIEWS = {
  basic: { flyteMode: 'buffet', previewActions: [{ state: 'attack', dur: .28 }],
    castCue: 'whoosh', impactCue: 'hit_magic', previewType: 'AERO BUFFET', floatLabel: 'GALE SLICE' },
  W: { flyteMode: 'gust', ally: true, projectile: false, previewActions: [{ state: 'cast', dur: .72 }],
    castCue: 'tornado_s', impactCue: 'whoosh', previewType: 'VANGUARD GALE', floatLabel: 'GALE BARRIER + HASTE' },
  G: { flyteMode: 'wingSlam', ally: false, dashes: true, previewActions: [{ state: 'attack', dur: .52 }],
    castCue: 'dash', impactCue: 'hit_heavy', previewType: 'WING SLAM', floatLabel: 'STUN + SHRED' },
  B: { flyteMode: 'mockingSwoop', ally: true, dashes: true, previewActions: [{ state: 'cast', dur: .58 }],
    castCue: 'dash', impactCue: 'guard', previewType: 'MOCKING SWOOP', floatLabel: 'DISTRACT + REFLECT' },
  P: { flyteMode: 'stubborn', ally: false, passive: true, previewActions: [{ state: 'idle', dur: .80 }],
    castCue: 'lock', impactCue: 'whoosh', previewType: 'STUBBORN FLIGHT', floatLabel: 'I DIDN\'T FALL!' },
  R: { flyteMode: 'record', ally: true, passive: true, previewActions: [{ state: 'cast', dur: .75 }],
    castCue: 'ult_ready', impactCue: 'sparkle', previewType: 'FOR THE RECORD', floatLabel: 'RECORD LOGGED' }
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

/* Collaboration and bespoke hero skills use authored action poses and timings instead
   of one generic attack/cast clip. The cues mirror what each kit actually does. */
const DANDY_SKILL_PREVIEWS = {
  basic: { dandyMode: 'smile', previewActions: [{ state: 'attack', dur: .32 }], castCue: 'dandy_text', impactCue: 'pop2', floatLabel: 'SMILE!' },
  W: { dandyMode: 'spotlight', previewActions: [{ state: 'cast', dur: .82 }], castCue: 'dandy_entrance', impactCue: 'beam_fire', forceCinematicFx: true, floatLabel: 'CENTER OF ATTENTION' },
  G: { dandyMode: 'closing', dashes: true, previewActions: [{ state: 'attack', dur: .68 }], castCue: 'dandy_text', impactCue: 'hit_heavy', floatLabel: 'CLOSING TIME!' },
  B: { dandyMode: 'smile', previewActions: [{ state: 'cast', dur: .70 }], castCue: 'dandy_text_bright', impactCue: 'ding', floatLabel: 'KEEP SMILING!' },
  P: { dandyMode: 'favorite', passive: true, previewActions: [{ state: 'idle', dur: .80 }], castCue: 'sparkle', floatLabel: 'FAVORITE' },
  R: { dandyMode: 'finale', previewActions: [{ state: 'cast', dur: .90 }], castCue: 'dandy_entrance', impactCue: 'currency', forceCinematicFx: true, floatLabel: 'CHA-CHING!' }
};

const PEBBLE_SKILL_PREVIEWS = {
  basic: { pebbleMode: 'speak', dashes: true, previewActions: [{ state: 'attack', dur: .28 }], castCue: 'pebble_speak', impactCue: 'hit_blunt', floatLabel: 'BITE!' },
  W: { pebbleMode: 'speak', dashes: true, previewActions: [{ state: 'wind', dur: .24 }, { state: 'attack', dur: .42 }], castCue: 'pebble_speak', impactCue: 'hit_heavy', floatLabel: 'SPEAK!' },
  G: { pebbleMode: 'fetch', ally: true, previewActions: [{ state: 'cast', dur: .65 }], castCue: 'pebble_talk', impactCue: 'heal', floatLabel: 'FETCH!' },
  B: { pebbleMode: 'tackle', dashes: true, previewActions: [{ state: 'wind', dur: .28 }, { state: 'attack', dur: .44 }], castCue: 'dash', impactCue: 'hit_heavy', floatLabel: 'ROCKY TACKLE!' },
  P: { pebbleMode: 'target', passive: true, previewActions: [{ state: 'idle', dur: .80 }], castCue: 'sparkle', floatLabel: 'EVASIVE' },
  R: { pebbleMode: 'goodboy', dashes: true, hitTimes: [.35, .50, .65], previewActions: [{ state: 'spin', dur: .88 }], castCue: 'pebble_speak', impactCue: 'crit', floatLabel: 'GOOD BOY!' }
};

const SCRAPS_SKILL_PREVIEWS = {
  basic: { scrapsMode: 'claws', previewActions: [{ state: 'attack', dur: .30 }], castCue: 'swing_claw', impactCue: 'hit_slash', floatLabel: 'PAPER CLAWS' },
  W: { scrapsMode: 'grapple', ally: true, dashes: true, previewActions: [{ state: 'wind', dur: .30 }, { state: 'attack', dur: .42 }], castCue: 'grapple', impactCue: 'hit_heavy', floatLabel: 'CRAFTY GRAPPLE!' },
  G: { scrapsMode: 'craft', previewActions: [{ state: 'cast', dur: .52 }], castCue: 'item_pickup', impactCue: 'hit_slash', floatLabel: 'WHATEVER WORKS' },
  B: { scrapsMode: 'storm', hitTimes: [.50, .68], previewActions: [{ state: 'cast', dur: .58 }], castCue: 'sweep', impactCue: 'hit_slash', floatLabel: 'CRAFT CLASS CRASH' },
  P: { scrapsMode: 'circle', passive: true, previewActions: [{ state: 'idle', dur: .80 }], castCue: 'sparkle', floatLabel: 'CRAFT CIRCLE' },
  R: { scrapsMode: 'shards', passive: true, previewActions: [{ state: 'cast', dur: .70 }], castCue: 'cloth', impactCue: 'crit', floatLabel: 'EVERY PIECE COUNTS' }
};

const FLUTTER_SKILL_PREVIEWS = {
  basic: { flutterMode: 'dash', dashes: true, previewActions: [{ state: 'attack', dur: .30 }], castCue: 'whoosh', impactCue: 'hit_light', floatLabel: 'FLUTTER' },
  W: { flutterMode: 'dash', dashes: true, previewActions: [{ state: 'move', dur: .40 }, { state: 'attack', dur: .45 }], castCue: 'whoosh', impactCue: 'hit_magic', floatLabel: 'FLOATY DASH!' },
  G: { flutterMode: 'sweep', previewActions: [{ state: 'cast', dur: .68 }], castCue: 'tornado_s', impactCue: 'whoosh', floatLabel: 'WINGBEAT SWEEP!' },
  B: { flutterMode: 'flutter', previewActions: [{ state: 'cast', dur: .65 }], castCue: 'whisper', impactCue: 'spectral', floatLabel: 'SILENT FLUTTER' },
  P: { flutterMode: 'catch', passive: true, previewActions: [{ state: 'idle', dur: .80 }], castCue: 'sparkle', floatLabel: 'HARD TO CATCH' },
};

const GINGER_SKILL_PREVIEWS = {
  basic: { gingerMode: 'flick', previewActions: [{ state: 'attack', dur: .32 }], projectile: true, castCue: 'whoosh', impactCue: 'hit_magic', floatLabel: 'ICING FLICK' },
  W: { gingerMode: 'bakedWithCare', ally: true, previewActions: [{ state: 'cast', dur: .88 }], castCue: 'heal_soft', impactCue: 'cheer', forceCinematicFx: true, floatLabel: 'BAKED WITH CARE!' },
  G: { gingerMode: 'decoratedTreats', ally: true, previewActions: [{ state: 'cast', dur: .75 }], castCue: 'get_food', impactCue: 'cleanse', floatLabel: 'ROYAL ICING!' },
  B: { gingerMode: 'peppermintSwirl', ally: true, previewActions: [{ state: 'cast', dur: .68 }], castCue: 'get_food', impactCue: 'sparkle', floatLabel: 'PEPPERMINT SWIRL' },
  P: { gingerMode: 'perfectDecoration', ally: true, passive: true, previewActions: [{ state: 'idle', dur: .80 }], castCue: 'sparkle', floatLabel: 'PERFECT DECORATION' },
  R: { gingerMode: 'recipeForEveryone', ally: true, previewActions: [{ state: 'cast', dur: .90 }], castCue: 'cheer', impactCue: 'crit', forceCinematicFx: true, floatLabel: 'RECIPE FOR EVERYONE!' }
};

const SQUIRM_SKILL_PREVIEWS = {
  basic: { squirmMode: 'nibble', dashes: false, previewActions: [{ state: 'attack', dur: .32 }], castCue: 'swing_light', impactCue: 'hit_light', floatLabel: 'PANICKED NIBBLE!' },
  W: { squirmMode: 'eat', ally: false, previewActions: [{ state: 'cast', dur: .86 }], castCue: 'get_food', impactCue: 'hit_heavy', forceCinematicFx: true, floatLabel: 'DISTRESSED DELICACY!' },
  G: { squirmMode: 'curl', ally: true, previewActions: [{ state: 'cast', dur: .75 }], castCue: 'cloth', impactCue: 'shield', floatLabel: "PLEASE DON'T HURT ME!" },
  B: { squirmMode: 'flail', ally: false, dashes: true, hitTimes: [.26, .36, .46, .56, .66, .76], previewActions: [{ state: 'spin', dur: .84 }], castCue: 'whoosh', impactCue: 'hit_slash', floatLabel: 'NERVOUS FLAILING!' },
  P: { squirmMode: 'erudition', ally: true, passive: true, previewActions: [{ state: 'idle', dur: .80 }], castCue: 'sparkle', impactCue: null, previewType: 'PASSIVE ERUDITION', floatLabel: 'BOOKWORM ARCHIVE' },
  R: { squirmMode: 'biblioPanic', ally: false, previewActions: [{ state: 'cast', dur: .92 }], castCue: 'ult', impactCue: 'crit', forceCinematicFx: true, previewType: 'BIBLIO-PANIC CLIMAX', floatLabel: 'FULL BIBLIO-PANIC!' }
};

const RIBECCA_SKILL_PREVIEWS = {
  basic: { ribeccaMode: 'rattle', dashes: true, previewActions: [{ state: 'attack', dur: .30 }], castCue: 'dash', impactCue: 'hit_slash', floatLabel: 'BONE TAP' },
  W: { ribeccaMode: 'undead', previewActions: [{ state: 'cast', dur: .75 }], castCue: 'spectral', impactCue: 'hit_heavy', floatLabel: 'THE UNDEAD' },
  G: { ribeccaMode: 'bones', dashes: true, previewActions: [{ state: 'attack', dur: .68 }], castCue: 'sweep', impactCue: 'hit_blunt', floatLabel: 'LOOSE BONES' },
  B: { ribeccaMode: 'rattle', dashes: true, previewActions: [{ state: 'move', dur: .42 }, { state: 'attack', dur: .40 }], castCue: 'dash', impactCue: 'hit_slash', floatLabel: 'RATTLE STEP' },
  P: { ribeccaMode: 'unbothered', passive: true, previewActions: [{ state: 'idle', dur: .80 }], castCue: 'sparkle', floatLabel: 'UNBOTHERED' },
  R: { ribeccaMode: 'standing', previewActions: [{ state: 'cast', dur: .88 }], castCue: 'ult', impactCue: 'guardbreak', floatLabel: 'STILL STANDING' }
};

const ASTRO_SKILL_PREVIEWS = {
  basic: { astroMode: 'stars', previewActions: [{ state: 'cast', dur: .35 }], projectile: true, castCue: 'whoosh', impactCue: 'hit_magic', floatLabel: 'LULLABY MOTE' },
  W: { astroMode: 'pulse', ally: true, previewActions: [{ state: 'cast', dur: .78 }], castCue: 'magiccircle', impactCue: 'ult', forceCinematicFx: true, floatLabel: 'DREAM PULSE' },
  G: { astroMode: 'slumber', previewActions: [{ state: 'cast', dur: .68 }], castCue: 'whisper', impactCue: 'spectral', floatLabel: 'PEACEFUL SLUMBER' },
  B: { astroMode: 'stars', hitTimes: [.35, .46, .58, .70], previewActions: [{ state: 'cast', dur: .75 }], castCue: 'sparkle', impactCue: 'hit_magic', floatLabel: 'FALLING STARS' },
  P: { astroMode: 'rested', ally: true, passive: true, previewActions: [{ state: 'idle', dur: .80 }], castCue: 'sparkle', floatLabel: 'WELL RESTED' },
  R: { astroMode: 'night', previewActions: [{ state: 'cast', dur: .90 }], castCue: 'ult', impactCue: 'spectral', forceCinematicFx: true, floatLabel: 'ENDLESS NIGHT' }
};

const COLLAB_SKILL_PREVIEWS = {
  Sora: {
    basic: { khMode: 'combo', dashes: true, previewActions: [{ state: 'attack', dur: .30 }], castCue: 'sora_attack', impactCue: 'keyblade_hit', floatLabel: 'KEYBLADE STRIKE' },
    W: { khMode: 'finisher', previewActions: [{ state:'attack', dur:.95 }], dashes:true, hitTimes:[.34,.40,.46,.52,.58,.64,.69],
      cast:'HasteEffect', impact:'ShockEffect', col:'#8edcff', castCue:'sora_skill', impactCue:'keyblade_hit',
      forceCinematicFx:true, floatLabel:'7-HIT FINISHER' },
    G: { khMode: 'thunder', previewActions: [{ state:'cast', dur:.70 }], cast:'ShockEffect', impact:'ShockEffect', col:'#a8eaff',
      castCue:'sora_magic', impactCue:'shock', forceCinematicFx:true, previewType:'3-TARGET CONTROL', floatLabel:'THUNDAGA ×3' },
    B: { khMode: 'strike', previewActions: [{ state:'spin', dur:.72 }], cast:'ShieldEffect', impact:'ShockEffect', col:'#dff8ff',
      castCue:'sora_skill', impactCue:'hit_heavy', forceCinematicFx:true, floatLabel:'STRIKE RAID' },
    P: { previewActions: [{ state: 'idle', dur: .80 }], passive: true, castCue: 'sparkle', floatLabel: 'SECOND CHANCE' },
    R: { khMode: 'limit', dashes: true, hitTimes: [.30, .40, .50, .60, .70], previewActions: [{ state: 'attack', dur: .98 }],
      castCue: 'sora_limit', impactCue: 'crit', forceCinematicFx: true, floatLabel: 'TRINITY LIMIT!' }
  },
  Riku: {
    basic: { khMode: 'combo', dashes: true, previewActions: [{ state: 'attack', dur: .30 }], castCue: 'riku_attack', impactCue: 'keyblade_hit', floatLabel: 'SOUL EATER' },
    W: { khMode: 'break', dashes: true, hitTimes: [.35, .48, .62], previewActions: [{ state: 'attack', dur: .88 }],
      cast: 'CurseEffect', impact: 'ShockEffect', col: '#9c6aff', castCue: 'riku_skill', impactCue: 'keyblade_hit', forceCinematicFx: true, floatLabel: 'DARK BREAK' },
    G: { khMode: 'aura', dashes: true, hitTimes: [.30, .42, .54, .66], previewActions: [{ state: 'wind', dur: .80 }],
      cast: 'ShockEffect', impact: 'CurseEffect', col: '#bf6aff', castCue: 'riku_skill', impactCue: 'hit_heavy', floatLabel: 'DARK AURA' },
    B: { khMode: 'slice', dashes: true, previewActions: [{ state: 'attack', dur: .65 }],
      castCue: 'riku_attack', impactCue: 'keyblade_hit', floatLabel: 'SHADOW SLICE' },
    P: { previewActions: [{ state: 'idle', dur: .80 }], passive: true, castCue: 'riku_guard', floatLabel: 'TWILIGHT RESIST' },
    R: { khMode: 'oblivion', dashes: true, hitTimes: [.32, .44, .56, .68], previewActions: [{ state: 'attack', dur: .92 }],
      castCue: 'riku_skill', impactCue: 'crit', forceCinematicFx: true, floatLabel: 'DARK OBLIVION' }
  },
  Kairi: {
    basic: { khMode: 'radiant', dashes: true, previewActions: [{ state: 'attack', dur: .30 }], castCue: 'kairi_attack', impactCue: 'keyblade_hit', floatLabel: 'DESTINY STRIKE' },
    W: { khMode: 'radiant', previewActions: [{ state:'attack', dur:.90 }], dashes:true, hitTimes:[.34,.43,.52,.61],
      cast:'BlessedEffect', impact:'ConfusionEffect', col:'#ffd0ed', castCue:'kairi_skill', impactCue:'keyblade_hit',
      forceCinematicFx:true, floatLabel:'GLEAM BURST' },
    G: { khMode: 'radiant', previewActions: [{ state:'cast', dur:.65 }], ally:true, previewNoDamage:true,
      cast:'ShieldEffect', impact:'BlessedEffect', col:'#ffd0ed', castCue:'kairi_protect', impactCue:'sparkle',
      forceCinematicFx:true, previewType:'ALLY ZONE', floatLabel:'RADIANT CIRCLE' },
    B: { khMode: 'radiant', previewActions: [{ state:'cast', dur:.50 }, { state:'attack', dur:.45 }], dashes:true,
      cast:'ShieldEffect', impact:'SlowEffect', col:'#ffb8e6', castCue:'kairi_protect', impactCue:'keyblade_hit',
      forceCinematicFx:true, previewType:'COUNTER STANCE', floatLabel:'COUNTER!' },
    P: { previewActions: [{ state: 'idle', dur: .80 }], ally: true, passive: true, castCue: 'sparkle', floatLabel: 'HEART LIGHT' },
    R: { khMode: 'radiant', ally: true, previewActions: [{ state: 'cast', dur: .88 }], castCue: 'kairi_protect', impactCue: 'heal', floatLabel: 'LIGHT SANCTUARY' }
  },
  Goofy: {
    basic: { dashes: true, previewActions: [{ state: 'attack', dur: .32 }], castCue: 'goofy_attack', impactCue: 'hit_blunt', floatLabel: 'SHIELD BASH' },
    W: { previewActions: [{ state:'cast', dur:.70 }, { state:'attack', dur:.75 }], projectile:true,
      projectileObject:'goofy-shield', cast:'ShieldEffect', impact:'ShockEffect', col:'#8ee5ff',
      castCue:'goofy_protect', impactCue:'goofy_skill', forceCinematicFx:true, floatLabel:'SHIELD THROW' },
    G: { previewActions: [{ state:'spin', dur:.72 }], dashes:true, hitTimes:[.42,.52,.62],
      castCue:'tornado_s', impactCue:'tornado_e', floatLabel:'PUSHED BACK' },
    B: { previewActions: [{ state:'move', dur:.48 }, { state:'attack', dur:.46 }], dashes:true,
      castCue:'goofy_protect', impactCue:'hit_blunt', previewType:'ALLY INTERCEPT', floatLabel:'INTERCEPTED' },
    P: { previewActions: [{ state: 'idle', dur: .80 }], passive: true, castCue: 'sparkle', floatLabel: 'GOOFY GUARD' },
    R: { dashes: true, previewActions: [{ state: 'attack', dur: .85 }], castCue: 'goofy_skill', impactCue: 'crit', floatLabel: 'TEAM DEFENDER!' }
  },
  ShadowMilkCookie: {
    basic: { milkMode: 'puppets', previewActions: [{ state: 'cast', dur: .35 }], castCue: 'whisper', impactCue: 'pop2', floatLabel: 'DECEIT BOLT' },
    W: { milkMode: 'lies', previewActions: [{ state: 'cast', dur: .85 }], cast: 'CurseEffect', impact: 'ShockEffect', col: '#84ddff',
      castCue: 'whisper', impactCue: 'spectral', forceCinematicFx: true, floatLabel: 'ACT 1: LIES' },
    G: { milkMode: 'truth', previewActions: [{ state: 'cast', dur: .72 }], cast: 'ShockEffect', impact: 'ShockEffect', col: '#9c6aff',
      castCue: 'whisper', impactCue: 'beam_fire', floatLabel: 'EYE OF DECEIT' },
    B: { milkMode: 'puppets', previewActions: [{ state: 'cast', dur: .80 }], cast: 'CurseEffect', impact: 'CurseEffect', col: '#7664dc',
      castCue: 'shrink2', impactCue: 'hit_magic', floatLabel: 'PUPPET MASTER' },
    P: { milkMode: 'shadow', passive: true, previewActions: [{ state: 'idle', dur: .82 }], castCue: 'spectral', floatLabel: 'SHADOW FORM' },
    R: { milkMode: 'show', hitTimes: [.34, .48, .62, .76], previewActions: [{ state: 'cast', dur: .95 }],
      cast: 'ShockEffect', impact: 'ShockEffect', col: '#84ddff', castCue: 'ult', impactCue: 'crit', forceCinematicFx: true, floatLabel: 'GREATEST SHOW' }
  },
  PureVanillaCookie: {
    basic: { vanillaMode: 'peace', previewActions: [{ state: 'cast', dur: .35 }], castCue: 'light_magic', impactCue: 'heal', floatLabel: 'VANILLA ORB' },
    W: { vanillaMode: 'peace', ally: true, previewActions: [{ state: 'cast', dur: .85 }], cast: 'BlessedEffect', impact: 'HealEffect', col: '#ffe082',
      castCue: 'light_magic', impactCue: 'heal', forceCinematicFx: true, floatLabel: 'LOVE & PEACE' },
    G: { vanillaMode: 'truth', ally: true, previewActions: [{ state: 'cast', dur: .72 }], cast: 'ShieldEffect', impact: 'BlessedEffect', col: '#fff59d',
      castCue: 'light_magic', impactCue: 'cleanse', floatLabel: 'LIGHT OF TRUTH' },
    B: { vanillaMode: 'shards', hitTimes: [.38, .52, .66], previewActions: [{ state: 'cast', dur: .72 }],
      cast: 'ShockEffect', impact: 'ShockEffect', col: '#ffd54f', castCue: 'sparkle', impactCue: 'hit_magic', floatLabel: 'SHARDS OF LIGHT' },
    P: { vanillaMode: 'warmth', ally: true, passive: true, previewActions: [{ state: 'idle', dur: .80 }], castCue: 'sparkle', floatLabel: 'WARMTH' },
    R: { vanillaMode: 'beacon', ally: true, previewActions: [{ state: 'cast', dur: .90 }], cast: 'BlessedEffect', impact: 'HealEffect', col: '#ffe082',
      castCue: 'ult', impactCue: 'heal', forceCinematicFx: true, floatLabel: 'BEACON OF TRUTH' }
  },
  CreamPuffCookie: {
    basic: { creamMode: 'jellius', previewActions: [{ state: 'cast', dur: .32 }], castCue: 'sparkle', impactCue: 'pop2', floatLabel: 'CREAM PUFF' },
    W: { creamMode: 'jellius', hitTimes: [.36, .50, .64], previewActions: [{ state: 'cast', dur: .82 }], cast: 'BlessedEffect', impact: 'ShockEffect', col: '#ffe082',
      castCue: 'sparkle', impactCue: 'pop2', forceCinematicFx: true, floatLabel: 'JELLIUS EXTREMUS!' },
    G: { creamMode: 'cream', ally: true, previewActions: [{ state: 'cast', dur: .70 }], cast: 'HealEffect', impact: 'BlessedEffect', col: '#ffecb3',
      castCue: 'sparkle', impactCue: 'heal', floatLabel: 'EXTRA CREAM' },
    B: { creamMode: 'jellies', hitTimes: [.35, .50, .65], previewActions: [{ state: 'cast', dur: .75 }],
      cast: 'HasteEffect', impact: 'ShockEffect', col: '#ffd54f', castCue: 'get_food', impactCue: 'pop2', floatLabel: 'DESSERT JELLIES' },
    P: { creamMode: 'star', passive: true, previewActions: [{ state: 'idle', dur: .80 }], castCue: 'sparkle', floatLabel: 'RISING STAR' },
    R: { creamMode: 'spell', ally: true, previewActions: [{ state: 'cast', dur: .90 }], cast: 'BlessedEffect', impact: 'HealEffect', col: '#ffe082',
      castCue: 'ult', impactCue: 'heal', forceCinematicFx: true, floatLabel: 'GREATEST SPELL!' }
  },
  GingerBrave: {
    basic: { braveMode: 'strike', dashes: true, previewActions: [{ state: 'attack', dur: .30 }], castCue: 'cookie_brave_attack', impactCue: 'hit_blunt', floatLabel: 'BRAVE SLAM' },
    W: { braveMode: 'never', dashes: true, previewActions: [{ state: 'attack', dur: .85 }], cast: 'HasteEffect', impact: 'ShockEffect', col: '#ff5252',
      castCue: 'cookie_brave_attack', impactCue: 'cookie_brave_skill_hit', forceCinematicFx: true, floatLabel: 'NEVER BACK DOWN!' },
    G: { braveMode: 'strike', dashes: true, previewActions: [{ state: 'attack', dur: .70 }], castCue: 'cookie_brave_attack', impactCue: 'hit_heavy', floatLabel: 'BRAVE STRIKE' },
    B: { braveMode: 'run', dashes: true, previewActions: [{ state: 'move', dur: .50 }, { state: 'attack', dur: .35 }], castCue: 'dash', impactCue: 'hit_light', floatLabel: 'RUN!' },
    P: { braveMode: 'breaker', passive: true, previewActions: [{ state: 'idle', dur: .80 }], castCue: 'sparkle', floatLabel: 'OVENBREAKER' },
    R: { braveMode: 'courage', dashes: true, hitTimes: [.35, .50, .65], previewActions: [{ state: 'attack', dur: .90 }], castCue: 'ult', impactCue: 'crit', floatLabel: 'COURAGE!' }
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
    LivePreview.stop();
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
    const body = el('div', 'hero-profile' + (opening ? ' hero-profile-enter' : '') + (d.ff7 ? ' ff7-profile' : ''));
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
      <button class="hero-power" type="button" aria-label="Explain ${d.name}’s Power" aria-expanded="false" title="Tap for Power breakdown"><span>POWER ⓘ</span><b>${fmt(powerInfo.total)}</b></button>`;
    const powerButton = $('.hero-power', identity);
    const powerDetails = el('div', 'hero-power-breakdown');
    powerDetails.hidden = true;
    powerDetails.innerHTML = `<button type="button" class="hero-power-breakdown-close" aria-label="Close Power breakdown">×</button>
      <b>HOW POWER ADDS UP</b>
      <p>Combat stats include Level, Stars, and Rarity, then a role weight. Trained skills count more as the Hero levels up. Power is a guide, not damage or a win guarantee.</p>
      <div><span>Combat stats <small>${d.role} ×${powerInfo.roleFactor.toFixed(2)}</small></span><b>${fmt(powerInfo.stats)}</b></div>
      <div><span>Trained skills</span><b>${fmt(powerInfo.skills)}</b></div>
      <div><span>Class training</span><b>${fmt(powerInfo.training)}</b></div>
      <div><span>Trinkets + badge</span><b>${fmt(powerInfo.gear + powerInfo.badge)}</b></div>
      <div><span>Rarity rank bonus</span><b>${fmt(powerInfo.rarity + powerInfo.tier)}</b></div>
      <div class="total"><span>Total Power</span><b>${fmt(powerInfo.total)}</b></div>`;
    identity.appendChild(powerDetails);
    powerButton.onclick = () => {
      powerDetails.hidden = !powerDetails.hidden;
      powerButton.setAttribute('aria-expanded', String(!powerDetails.hidden));
    };
    $('.hero-power-breakdown-close', powerDetails).onclick = () => {
      powerDetails.hidden = true;
      powerButton.setAttribute('aria-expanded', 'false');
      powerButton.focus();
    };
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
      const preview = lv < Progress.skillCap(id) ? SkillDesc.rankPreview(skill, lv, st) : '';
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

  /* The preview is the real battle engine (see live-preview.js), not a drawn
     imitation. This only builds the frame and wires its controls. */
  skillPreview(id, key, skill) {
    const wrap = el('div', 'live-preview-wrap');
    const kind = key === 'basic' ? 'BASIC ATTACK' : skill.cast ? (key === 'W' || key === 'R' ? 'ULTIMATE' : 'SKILL') : 'PASSIVE';
    wrap.innerHTML = `<div class="skill-preview-stage skill-preview-live" title="Tap to replay"><div class="live-arena"></div></div>
      <div class="live-bar">
        <span><b>${skill.name}</b><small>${kind} · REAL BATTLE</small></span>
        <div class="skill-preview-btns">
          <button type="button" class="preview-btn preview-speed" title="Speed">${LivePreview.speed}×</button>
          <button type="button" class="preview-btn preview-pause" title="Pause / Resume">${LivePreview.paused ? '▶' : '⏸'}</button>
          <button type="button" class="preview-btn preview-replay" aria-label="Replay ${skill.name}" title="Replay (Space / R)">↻</button>
        </div>
      </div>`;
    wrap._live = { id, key, skill };
    const speedBtn = $('.preview-speed', wrap), pauseBtn = $('.preview-pause', wrap), replayBtn = $('.preview-replay', wrap);
    const replay = () => {
      LivePreview.setPaused(false); pauseBtn.textContent = '⏸'; pauseBtn.classList.remove('active');
      Sound.play('hero_file_replay', { vol: .5, throttle: 0 }); this.playPreview(wrap);
    };
    speedBtn.onclick = () => {
      const next = LivePreview.speed === 1 ? .5 : LivePreview.speed === .5 ? 2 : 1;
      LivePreview.setSpeed(next); speedBtn.textContent = `${next}×`;
      speedBtn.classList.toggle('active', next !== 1); Sound.play('ui_move');
    };
    pauseBtn.onclick = () => {
      LivePreview.setPaused(!LivePreview.paused);
      pauseBtn.textContent = LivePreview.paused ? '▶' : '⏸';
      pauseBtn.classList.toggle('active', LivePreview.paused); Sound.play('ui_move');
    };
    replayBtn.onclick = replay;
    $('.live-arena', wrap).onclick = replay;
    this._previewStage = wrap;
    return wrap;
  },

  playPreview(stage) { LivePreview.play(stage); },

  startPreview(stage) {
    if (!stage || !stage.isConnected) return;
    LivePreview.play(stage);
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
    const star = make('PROMOTION', '★'.repeat(h.stars) + '☆'.repeat(5 - h.stars), sc ? `◈ ${h.shards} / ${sc.shards} · ${RES.ichor.icon} ${fmt(sc.ichor)} · ${RES.star.icon} ${fmt(sc.star)}` : 'Maximum promotion',
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
    const h = Save.hero(id);
    const wrap = el('div', 'hero-stats-sheet');
    const spec = playerSpec(id);
    // Use Unit's stat pipeline for each snapshot. Only the direct training
    // layer is applied here: gear, badges, passives and auras need a Battle.
    const snapshot = (level, trained) => {
      const unit = new Unit({ ...spec, level }, 0, 0, { auras: [], rangeScale: 1 });
      if (trained && typeof applyTrainingStatBonus === 'function') {
        if (unit.cls && CLASSES[unit.cls]) applyTrainingStatBonus(unit, 'class', unit.cls, unit.classRank);
        if (unit.subcls && SUBCLASSES[unit.subcls]) applyTrainingStatBonus(unit, 'subclass', unit.subcls, unit.subclassRank);
        if (unit.rarity >= 6 && unit.cls2 && CLASSES[unit.cls2]) applyTrainingStatBonus(unit, 'class', unit.cls2, unit.classRank2);
        if (unit.rarity >= 6 && unit.subcls2 && SUBCLASSES[unit.subcls2]) applyTrainingStatBonus(unit, 'subclass', unit.subcls2, unit.subclassRank2);
        unit.recompute(true);
      }
      return unit;
    };
    const fake = snapshot(h.level, true);
    const base = snapshot(h.level, false);
    const next = h.level < Progress.levelCap() ? snapshot(h.level + 1, true) : null;
    const intro = el('div', 'card hero-stats-intro');
    intro.innerHTML = `<div class="hero-stats-intro-head"><b>COMBAT SHEET</b><span>Lv ${h.level} · ${h.stars}★ · ${rarityLabel(h.rarity, h.rarityPlus)}</span></div>
      <p>Current values include level, stars, rarity, Class and Subclass training. Temporary battle effects, Trinkets and Badges apply when a fight starts.</p>
      <div class="hero-stat-key"><span><i class="training"></i>Training gain</span>${next ? '<span><i class="next"></i>Next level</span>' : ''}</div>`;
    wrap.appendChild(intro);

    const groups = [
      ['SURVIVAL', [
        ['❤', 'Max HP', 'hp', 'Health before defeat'],
        ['🛡', 'Defense', 'def', 'Reduces physical damage'],
        ['🔰', 'Magic Defense', 'mdef', 'Reduces magic damage']
      ]],
      ['OFFENSE', [
        ['⚔', 'Attack', 'atk', 'Scales physical attacks and skills'],
        ['✨', 'Magic Attack', 'mag', 'Scales magic attacks and skills'],
        ['🎯', 'Accuracy', 'acc', 'Improves hit chance against Evasion']
      ]],
      ['MOBILITY', [
        ['🏃', 'Speed', 'spd', 'Adjusts Energy gain and cooldown recovery'],
        ['💨', 'Evasion', 'eva', 'Makes attacks against this Hero miss more often']
      ]]
    ];
    groups.forEach(([name, rows]) => {
      const card = el('section', 'card hero-stats-card');
      card.innerHTML = `<h3>${name}</h3>`;
      rows.forEach(([icon, label, key, tip]) => {
        const current = Math.round(key === 'hp' ? fake.max.hp : fake.st[key]);
        const untrained = Math.round(key === 'hp' ? base.max.hp : base.st[key]);
        const upcoming = next ? Math.round(key === 'hp' ? next.max.hp : next.st[key]) : current;
        const trainingGain = Math.max(0, current - untrained);
        const levelGain = Math.max(0, upcoming - current);
        const row = el('div', 'hero-stat-row');
        row.innerHTML = `<span class="hero-stat-icon" aria-hidden="true">${icon}</span>
          <span class="hero-stat-name"><b>${label}</b><small>${tip}</small></span>
          <span class="hero-stat-values"><strong>${fmt(current)}</strong>
            ${trainingGain ? `<small class="hero-stat-gain training">+${fmt(trainingGain)} training</small>` : ''}
            ${levelGain ? `<small class="hero-stat-gain next">+${fmt(levelGain)} next Lv</small>` : ''}
          </span>`;
        card.appendChild(row);
      });
      wrap.appendChild(card);
    });

    const equippedTrinkets = (h.trinkets || []).map(uid => uid && Save.data.trinketInv[uid]).filter(copy => copy && TRINKETS[copy.id]);
    if (equippedTrinkets.length) {
      const gear = el('div', 'card hero-stat-trinkets');
      gear.innerHTML = '<div class="mini muted b" style="letter-spacing:1.5px;margin-bottom:7px">EQUIPPED TRINKET BONUSES</div>';
      equippedTrinkets.forEach(copy => {
        const t = TRINKETS[copy.id];
        const line = el('div', 'hero-stat-trinket');
        line.innerHTML = `<img src="${trinketIcon(copy.id)}" alt=""><div><b>${t.name} <small>R${copy.rank}</small></b><span>${trinketStatText(t, copy.rank)}</span></div><strong>⚡ +${trinketPowerScore(copy.rank)}</strong>`;
        gear.appendChild(line);
      });
      gear.appendChild(el('div', 'mini muted', 'Trinket effects activate in battle and are excluded from the values above.'));
      wrap.appendChild(gear);
    }

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

    const pct = value => `${Math.round(value * 100)}%`;
    const mult = value => `×${value.toFixed(2)}`;
    const combatGroups = [
      ['ATTACK & POSITION', [
        ['Crit Chance', pct(fake.st.crit), 'Chance for a critical hit'],
        ['Crit Damage', mult(Math.min(fake.st.critDmg, CRIT_RULES.normalMultiplier)), 'Ordinary critical hit multiplier; super crit adds 1×, capped at 3×'],
        ['Attack Speed', mult(fake.st.aspd), 'Basic attack pace multiplier'],
        ['Attack Range', fmt(Math.round(fake.st.range)), 'Reach in the standard arena; narrow screens scale it down'],
        ['Move Speed', fmt(Math.round(fake.st.ms)), 'How quickly this Hero repositions'],
        ['Aggro', fake.st.aggro.toFixed(2), 'Higher values make this Hero a more likely target']
      ]],
      ['SKILLS & SUPPORT', [
        ['Skill Tempo', mult(combatTempo(fake.st.spd)), 'Speed multiplier on Energy gain and cooldown recovery'],
        ['Cooldown Recovery', mult(1 + fake.st.cdr), 'Further multiplier on skill cooldown recovery'],
        ['Healing Bonus', `+${pct(fake.st.healPow - 1)}`, 'Extra healing above the normal 100% amount'],
        ['Shield Bonus', `+${pct(fake.st.shieldPow - 1)}`, 'Extra shield strength above the normal 100% amount']
      ]],
      ['PENETRATION & RESISTANCE', [
        ['Armor Pen', pct(fake.st.armorPen), 'Ignores this share of Physical Defense'],
        ['Magic Pen', pct(fake.st.magPen), 'Ignores this share of Magic Defense'],
        ['CC Resist', pct(fake.st.ccRes), 'Shortens control effects such as stuns and silences'],
        ['Knockback Resist', pct(fake.st.kbRes), 'Reduces displacement distance']
      ]]
    ];
    combatGroups.forEach(([name, entries]) => {
      const card = el('section', 'card hero-stats-card hero-combat-card');
      card.innerHTML = `<h3>${name}</h3>`;
      entries.forEach(([label, value, description]) => {
        const row = el('div', 'hero-combat-val');
        row.innerHTML = `<span><b>${label}</b><small>${description}</small></span><strong>${value}</strong>`;
        card.appendChild(row);
      });
      wrap.appendChild(card);
    });

    const mitigation = el('div', 'card hero-mitigation-card');
    const physicalReduction = Math.round(defenseReduction(fake.st.def, fake.level, fake.level) * 100);
    const magicReduction = Math.round(defenseReduction(fake.st.mdef, fake.level, fake.level) * 100);
    mitigation.innerHTML = `<h3>DEFENSE IN PRACTICE</h3>
      <div class="hero-mitigation-grid"><div><small>Physical damage blocked</small><b>${physicalReduction}%</b></div>
      <div><small>Magic damage blocked</small><b>${magicReduction}%</b></div></div>
      <p>Against an equal-level attacker with no penetration. Enemy level, penetration and battle effects change these amounts.</p>`;
    wrap.appendChild(mitigation);

    const fr = el('div', 'card');
    fr.innerHTML = `<div class="row tiny"><div class="grow b">BATTLE RECORD</div></div>`;
    fr.appendChild(el('div', 'mini muted', fmt(h.battles || 0) + ' winning battles credited to this Hero.'));
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
            <div class="trinket-equipped-head"><span>R${copy.rank}/${TRINKET_MAX_RANK} · ${trinketRankLabel(copy.rank)}</span><strong>⚡ +${trinketPowerScore(copy.rank)}</strong></div>
            <div class="trinket-rank-track"><i style="width:${copy.rank / TRINKET_MAX_RANK * 100}%"></i></div>
            <div class="trinket-equipped-bonus">${trinketStatText(t, copy.rank)}</div>
            ${copy.rank < TRINKET_MAX_RANK ? `<div class="trinket-equipped-next">NEXT R${copy.rank + 1}: ${trinketStatText(t, copy.rank + 1)}</div>` : '<div class="trinket-equipped-next">MAX RANK</div>'}
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
    const gearUpgrade = def.upgradeCurrency === 'unknownWorldGears';
    const friend = gearUpgrade ? null : Save.hero(def.friend);
    const cost = badgeUpgradeCost(lvl);
    const canUpgrade = owned && lvl < BADGE_MAX_LVL && (gearUpgrade
      ? (Save.data.raid.unknownWorldGears || 0) >= cost
      : !!friend && friend.shards >= cost);
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
          <div class="friendship-badge-owned">${owned ? gearUpgrade ? '🤝 OWNED · ⚙ GEARS TO UPGRADE' : friend ? `🤝 OWNED · ${esc(HEROES[def.friend].name)} SHARDS` : `🤝 OWNED · RECRUIT ${esc(HEROES[def.friend].name.toUpperCase())} TO UPGRADE` : '🔒 LOCKED'}</div>
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
        <button class="friendship-badge-upgrade" type="button" ${(!owned && !camp) || (owned && !canUpgrade) ? 'disabled' : ''}>${lvl >= BADGE_MAX_LVL ? 'MAX LEVEL' : owned ? `＋ UPGRADE · ${cost} ${gearUpgrade ? '⚙ GEARS' : esc(def.friend.toUpperCase()) + ' SHARDS'}` : camp ? `CLEAR ${camp.stages.length} CHAPTERS TO EARN` : 'LOCKED'}</button>
      </footer>`;
    $('.friendship-badge-close', body).onclick = () => UI.closeModal();
    $('.friendship-badge-apply', body).onclick = () => {
      if (!owned) return;
      const ok = worn ? Progress.unequipBadge(id, bid) : Progress.equipBadge(id, bid);
      if (ok) { UI.toast(worn ? `${hero.name}'s badge removed` : `${def.name} applied to ${hero.name}`); UI.closeModal(); this.draw(); }
    };
    $('.friendship-badge-upgrade', body).onclick = () => {
      if (!owned) {
        if (camp) {
          UI.closeModal();
          Screens.open('friendship');
        }
        return;
      }
      if (!canUpgrade) return;
      if (Save.upgradeBadge(bid)) { Sound.play('ui_ok'); UI.closeModal(); this.openBadgeViewer(id, bid); }
    };
    UI.modal(null, body, { bare: true, className: 'friendship-badge-modal' });
  },

  /** Searchable, copy-aware picker for one Hero's Trinket slot. */
  openTrinketPicker(id, slot) {
    if (HEROES[id] && HEROES[id].noTrinket) return;
    const h = Save.hero(id);
    if (!h) return;
    const inv = Save.data.trinketInv;
    const wornUid = (h.trinkets || [])[slot];
    const wornCopy = wornUid && inv[wornUid];
    const wornDef = wornCopy && TRINKETS[wornCopy.id];
    const equipped = Save.equippedTrinketUids();
    const escapeHtml = value => String(value == null ? '' : value)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
    const entries = TRINKET_IDS.filter(tid => Save.ownsTrinket(tid)).map(tid => {
      const copies = Save.trinketCopies(tid).sort((a, b) => inv[b].rank - inv[a].rank);
      const free = copies.filter(uid => !equipped.has(uid));
      return { tid, def: TRINKETS[tid], copies, free, rank: inv[free[0] || copies[0]].rank };
    });
    const availableCount = entries.filter(entry => entry.free.length || (wornCopy && entry.tid === wornCopy.id)).length;
    const state = { query: '', filter: 'available', sort: 'rank', tid: wornCopy ? wornCopy.id : null, uid: wornUid || null };

    const body = el('div', 'tp-shell');
    body.innerHTML = `<header class="tp-head">
      <div class="tp-head-icon"><img src="${Art.hero(id)}" alt=""></div>
      <div><small>${escapeHtml(HEROES[id].name)} · SLOT ${slot + 1}</small><h2>Choose a Trinket</h2></div>
      <button type="button" class="tp-close" aria-label="Close trinket picker">×</button>
    </header>
    <div class="tp-current"></div>
    <div class="tp-tools">
      <div class="tp-search-row"><label class="tp-search"><span>⌕</span><input type="search" placeholder="Search trinkets or effects" aria-label="Search trinkets"></label>
        <select class="tp-sort" aria-label="Sort trinkets"><option value="rank">Best rank</option><option value="name">Name A–Z</option></select></div>
      <div class="tp-tabs" role="group" aria-label="Trinket availability"><button type="button" data-filter="available">Available <b>${availableCount}</b></button><button type="button" data-filter="owned">All owned <b>${entries.length}</b></button></div>
    </div>
    <div class="tp-content"><div class="tp-list" aria-label="Trinkets"></div><div class="tp-detail" aria-live="polite"></div></div>`;
    const current = $('.tp-current', body), list = $('.tp-list', body), detail = $('.tp-detail', body);
    $('.tp-close', body).onclick = () => UI.closeModal();
    current.innerHTML = wornDef
      ? `<div class="tp-current-art"><img src="${trinketIcon(wornCopy.id)}" alt=""></div><div class="tp-current-copy"><small>IN THIS SLOT</small><b>${escapeHtml(wornDef.name)} <em>R${wornCopy.rank}</em></b><span>${escapeHtml(trinketStatText(wornDef, wornCopy.rank))}</span></div><button type="button" class="tp-unequip">Unequip</button>`
      : `<div class="tp-current-empty">＋</div><div class="tp-current-copy"><small>IN THIS SLOT</small><b>Empty</b><span>Choose a copy below.</span></div>`;
    const off = $('.tp-unequip', current);
    if (off) off.onclick = () => { Progress.unequipTrinket(id, slot); UI.closeModal(); this.draw(); };

    const visibleEntries = () => entries.filter(entry => {
      if (state.filter === 'available' && !entry.free.length && !(wornCopy && entry.tid === wornCopy.id)) return false;
      if (!state.query) return true;
      const terms = [entry.def.name, entry.def.effect, entry.def.owner,
        trinketStatText(entry.def, entry.rank), trinketSignatureText(entry.tid)].join(' ').toLowerCase();
      return terms.includes(state.query);
    }).sort((a, b) => state.sort === 'name'
      ? a.def.name.localeCompare(b.def.name)
      : Number(!!b.free.length) - Number(!!a.free.length) || b.rank - a.rank || a.def.name.localeCompare(b.def.name));

    const renderDetail = (keepScroll = false) => {
      const previousScroll = detail.scrollTop;
      const entry = entries.find(item => item.tid === state.tid);
      if (!entry) {
        detail.innerHTML = '<div class="tp-detail-empty">Select a Trinket to compare its stats and effects.</div>';
        return;
      }
      const chosen = state.uid && inv[state.uid] && inv[state.uid].id === entry.tid ? state.uid : null;
      const rank = chosen ? inv[chosen].rank : entry.rank;
      const score = trinketPowerScore(rank);
      const oldScore = wornCopy ? trinketPowerScore(wornCopy.rank) : 0;
      const delta = score - oldScore;
      const rankChoices = [];
      const seenRanks = new Set();
      entry.free.forEach(uid => {
        const r = inv[uid].rank;
        if (seenRanks.has(r)) return;
        seenRanks.add(r);
        rankChoices.push({ uid, rank: r, count: entry.free.filter(copyUid => inv[copyUid].rank === r).length });
      });
      if (wornCopy && wornCopy.id === entry.tid)
        rankChoices.push({ uid: wornUid, rank: wornCopy.rank, count: 1, current: true });
      entry.copies.filter(uid => equipped.has(uid) && uid !== wornUid).forEach(uid => {
        const wearer = Save.whoWears(uid);
        if (wearer) rankChoices.push({ uid, rank: inv[uid].rank, wearer });
      });
      const chosenWearer = chosen && chosen !== wornUid ? Save.whoWears(chosen) : null;
      const wearerName = chosenWearer ? (HEROES[chosenWearer] && HEROES[chosenWearer].name || chosenWearer) : '';
      const actionText = chosen === wornUid ? 'Currently equipped' : chosenWearer
        ? `Move from ${wearerName} · R${rank}` : chosen
          ? `${wornCopy ? 'Swap to' : 'Equip'} ${entry.def.name} · R${rank}`
          : 'No copy to equip';
      detail.innerHTML = `<div class="tp-detail-top"><div class="tp-detail-art"><img src="${trinketIcon(entry.tid)}" alt=""></div><div><small>${entry.def.owner && HEROES[entry.def.owner] ? `FROM ${escapeHtml(HEROES[entry.def.owner].name.toUpperCase())}` : 'GENERAL TRINKET'}</small><h3>${escapeHtml(entry.def.name)}</h3><span>${entry.free.length} free · ${entry.copies.length} owned</span></div></div>
        <div class="tp-detail-stats"><div><small>AT RANK ${rank}</small><b>${escapeHtml(trinketStatText(entry.def, rank))}</b></div><strong>⚡ ${delta >= 0 ? '+' : ''}${delta}<small>vs this slot</small></strong></div>
        <div class="tp-detail-section"><small>TRINKET EFFECT</small><p>${escapeHtml(entry.def.effect || '')}</p></div>
        <div class="tp-detail-section tp-fragment"><small>SIGNATURE FRAGMENT</small><p>${escapeHtml(trinketSignatureText(entry.tid))}</p></div>
        <div class="tp-copy-select"><small>CHOOSE COPY</small><div class="tp-copy-options">${rankChoices.length ? rankChoices.map(choice => `<button type="button" data-uid="${escapeHtml(choice.uid)}" class="${choice.uid === chosen ? 'selected' : ''} ${choice.wearer ? 'worn' : ''}" aria-pressed="${choice.uid === chosen}">R${choice.rank}${choice.current ? ' · Here' : choice.wearer ? ' · ' + escapeHtml(HEROES[choice.wearer] && HEROES[choice.wearer].name || choice.wearer) : choice.count > 1 ? ' · ×' + choice.count : ''}</button>`).join('') : '<span>No copies available.</span>'}</div></div>
        ${chosenWearer ? `<div class="tp-worn-elsewhere">Moving this copy leaves ${escapeHtml(wearerName)}’s slot empty.</div>` : ''}
        <button type="button" class="tp-equip" ${!chosen || chosen === wornUid ? 'disabled' : ''}>${escapeHtml(actionText)}</button>`;
      if (keepScroll) detail.scrollTop = previousScroll;
      $$('.tp-copy-options button', detail).forEach(button => {
        button.onclick = () => { state.uid = button.dataset.uid; renderDetail(true); };
      });
      $('.tp-equip', detail).onclick = () => {
        if (!chosen || chosen === wornUid) return;
        const ok = Save.whoWears(chosen)
          ? Progress.moveTrinket(id, slot, chosen)
          : Progress.equipTrinket(id, slot, chosen);
        if (!ok) { UI.toast('That copy is no longer available'); return; }
        UI.closeModal(); this.draw();
      };
    };

    const renderList = () => {
      const items = visibleEntries();
      if (!items.some(entry => entry.tid === state.tid)) {
        state.tid = items[0] ? items[0].tid : null;
        state.uid = items[0] ? items[0].free[0] || (wornCopy && items[0].tid === wornCopy.id ? wornUid : null) : null;
      }
      const scroll = list.scrollTop;
      list.innerHTML = items.length ? '' : `<div class="tp-no-results">${entries.length ? 'No trinkets match this view.' : 'No Trinkets owned yet.'}</div>`;
      items.forEach(entry => {
        const rank = entry.free.length ? inv[entry.free[0]].rank : entry.rank;
        const currentType = wornCopy && wornCopy.id === entry.tid;
        const row = el('button', 'tp-item' + (state.tid === entry.tid ? ' selected' : '') + (!entry.free.length ? ' unavailable' : ''));
        row.type = 'button';
        row.setAttribute('aria-pressed', state.tid === entry.tid ? 'true' : 'false');
        row.innerHTML = `<span class="tp-item-art"><img src="${trinketIcon(entry.tid)}" alt=""></span><span class="tp-item-main"><b>${escapeHtml(entry.def.name)}${trinketPlaceholderBadge(entry.tid)}</b><small>${escapeHtml(trinketStatText(entry.def, rank))}</small><em>${currentType ? 'In this slot' : entry.free.length ? `${entry.free.length} free to equip` : 'All copies worn'}</em></span><span class="tp-item-rank">R${rank}<small>${entry.free.length ? 'FREE' : 'WORN'}</small></span>`;
        row.onclick = () => {
          state.tid = entry.tid;
          state.uid = entry.free[0] || (currentType ? wornUid : null);
          $$('.tp-item', list).forEach(item => { item.classList.remove('selected'); item.setAttribute('aria-pressed', 'false'); });
          row.classList.add('selected'); row.setAttribute('aria-pressed', 'true');
          renderDetail();
        };
        list.appendChild(row);
      });
      list.scrollTop = scroll;
      renderDetail();
    };
    $('.tp-search input', body).oninput = event => { state.query = event.target.value.trim().toLowerCase(); renderList(); };
    $('.tp-sort', body).onchange = event => { state.sort = event.target.value; renderList(); };
    $$('.tp-tabs button', body).forEach(button => {
      button.onclick = () => {
        state.filter = button.dataset.filter;
        $$('.tp-tabs button', body).forEach(tab => { tab.classList.toggle('active', tab === button); tab.setAttribute('aria-pressed', tab === button ? 'true' : 'false'); });
        renderList();
      };
    });
    $('.tp-tabs [data-filter="available"]', body).classList.add('active');
    $('.tp-tabs [data-filter="available"]', body).setAttribute('aria-pressed', 'true');
    $('.tp-tabs [data-filter="owned"]', body).setAttribute('aria-pressed', 'false');
    renderList();
    UI.modal(null, body, { bare: true, className: 'trinket-picker-modal', dismissOnBackdrop: true });
  }
};
