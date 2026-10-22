/* sim.js - the 5v5 real-time auto battler.
   Fixed 60Hz logic stepping, adaptive DOM rendering, and the full API that
   hero kits use. Handhelds render at 30 FPS so the large cutout stage does
   not keep a phone's compositor working at full speed for the whole battle. */
'use strict';

const TEAM_P = 0, TEAM_E = 1;
const TICK = 1 / 60;
const BATTLE_FPS = typeof matchMedia === 'function' && matchMedia('(max-width: 700px)').matches ? 30 : 60;
const BATTLE_FRAME_MS = 1000 / BATTLE_FPS;
const COMBAT_TIME_SCALE = .76;

function scheduleBattleFrame(fn) {
  // The entrance and exit walkers consume the callback timestamp directly.
  // Passing it here keeps them on the same real-time clock as the main loop;
  // calling setTimeout(fn, ...) bare would invoke them with `undefined` and
  // make their elapsed time become NaN, skipping the walk entirely.
  const run = () => fn(performance.now());
  if (typeof document !== 'undefined' && document.hidden) return setTimeout(run, 250);
  // Desktop combat should share the browser's paint budget. Timer callbacks
  // can land just after a paint, forcing the next frame to do simulation,
  // particle work, and DOM writes back-to-back. Phones intentionally keep the
  // lighter 30 FPS cadence chosen above.
  if (BATTLE_FPS >= 60 && typeof requestAnimationFrame === 'function') return requestAnimationFrame(run);
  return setTimeout(run, BATTLE_FRAME_MS);
}

/* Inline style writes are surprisingly expensive on a stage full of large
   filtered PNGs. Keep the hot render loop from invalidating layout/compositing
   when a value did not actually change. */
function setStyleIfChanged(node, prop, value) {
  if (!node || node.style[prop] === value) return false;
  node.style[prop] = value;
  return true;
}

function battleStatusChip(s, compact) {
  const d = STATUS[s.id] || { icon: '·', name: s.id, kind: 'special', desc: '' };
  const kind = d.kind === 'buff' ? 'buff' : d.kind === 'debuff' ? 'debuff' : 'special';
  const time = Number.isFinite(s.t) ? Math.max(0, s.t) : 0;
  const seconds = time >= 900 ? '∞' : Math.max(1, Math.ceil(time));
  const duration = time >= 900 ? 100 : clamp(time / 12, 0, 1) * 100;
  const stacks = s.stacks > 1 ? `<em>×${s.stacks}</em>` : '';
  const title = `${d.name}${s.stacks > 1 ? ` · ${s.stacks} stacks` : ''}${time < 900 ? ` · ${seconds}s` : ''}${d.desc ? ` — ${d.desc}` : ''}`;
  const attr = value => String(value).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  return `<span class="status-chip ${kind}${time < 2.5 && time < 900 ? ' expiring' : ''}" data-status-id="${attr(s.id)}" data-status-kind="${kind}" role="button" tabindex="0" style="--status-life:${duration}%" title="${attr(title)}" aria-label="${attr(title)}. Tap for details."><b>${d.icon || '·'}</b><i>${compact ? '' : seconds}</i>${stacks}</span>`;
}

function battleStatusOverflowChip(count) {
  return `<span class="status-chip status-overflow" data-status-id="__all__" role="button" tabindex="0" title="${count} more status effects · tap for details" aria-label="${count} more status effects. Tap for details."><b>＋</b><i>${count}</i></span>`;
}

/* Keep the compact strip useful when a unit has many simultaneous effects.
   Crowd-control and nearly-expired effects are the most actionable, so they
   stay in the first four slots instead of being hidden behind the overflow
   chip. The original index keeps equal-priority effects stable. */
function orderedBattleStatuses(statuses) {
  return statuses.map((status, index) => ({ status, index })).sort((a, b) => {
    const ad = STATUS[a.status.id] || {};
    const bd = STATUS[b.status.id] || {};
    const at = Number.isFinite(a.status.t) ? Math.max(0, a.status.t) : 0;
    const bt = Number.isFinite(b.status.t) ? Math.max(0, b.status.t) : 0;
    const aUrgency = ad.cc ? 0 : at < 4 && at < 900 ? 1 : ad.kind === 'debuff' ? 2 : ad.kind === 'special' ? 3 : 4;
    const bUrgency = bd.cc ? 0 : bt < 4 && bt < 900 ? 1 : bd.kind === 'debuff' ? 2 : bd.kind === 'special' ? 3 : 4;
    if (aUrgency !== bUrgency) return aUrgency - bUrgency;
    if (aUrgency <= 1 && at !== bt) return at - bt;
    return a.index - b.index;
  }).map(entry => entry.status);
}

/* Two VFX flipbooks per cast make a readable 32-frame action: an authored
   casting beat on the Hero followed by a landing beat on its target. Props
   are real game art, not emoji stand-ins. Brusha, Dyle and Rodger already own
   richer bespoke sequences, so they are intentionally omitted here. */
const HERO_CINEMATICS = {
  Astro:      { cast: 'BlessedEffect', impact: 'SleepEffect', col: '#b9a4ff', s1: 'magiccircle', s2: 'sparkle' },
  Scraps:     { signature: 'scraps', ally: key => key === 'W', col: '#ffd166', s1: 'cloth', s2: 'cloth' },
  Cosmo:      { cast: 'HealEffect', impact: 'BlessedEffect', prop: { kind: 'item', img: 'Brownie' }, ally: true, col: '#ffd7a0', s1: 'get_food', s2: 'heal_soft' },
  Cocoa:      { signature: 'cocoa', ally: key => key !== 'B', col: '#c98a5a', s1: 'get_food', s2: 'sparkle' },
  Bobette:    { noSequence: true, col: '#e8536b' },
  Boxten:     { cast: 'HasteEffect', impact: 'ShockEffect', col: '#6fe3c4', s1: 'ticktock', s2: 'hit_blunt' },
  /* Brightney owns a readable lamp language: shade swings, bulb charge,
     defensive glare, and a narrow focused beam. The generic spell flipbook
     made every one of those actions look interchangeable. */
  Brightney:  { noSequence: true, col: '#fff3b0', s1: 'beam_charge', s2: 'beam_fire' },
  Coal:       { cast: 'RageEffect', impact: 'BurnEffect', col: '#ff8a3d', s1: 'fire', s2: 'hit_heavy' },
  // Connie's kit owns its own phase/haunt choreography; the generic status
  // flipbook made every one of her skills look like the same purple burst.
  Connie:     { noSequence: true, col: '#bfe9ff', s1: 'spectral', s2: 'whisper' },
  Ginger:     { cast: 'BlessedEffect', impact: 'HealEffect', prop: { kind: 'item', img: 'Honey' }, ally: true, col: '#ffd166', s1: 'get_food', s2: 'heal_soft' },
  /* Bassie owns the basket choreography: stocked supplies, ally packing, and
     the full-basket toss are clearer than generic rage/shock overlays. */
  Bassie:     { noSequence: true, col: '#8fd9c4' },
  /* Waxwell's kit owns the floor-plan visuals: wax zones, flame trails,
     snuffed targets, and moving wax figures. */
  Waxwell:    { noSequence: true, col: '#e7bd54' },
  /* Blot's mime routine is about misdirection, not generic invisibility:
     paint a false body, erect an invisible wall, then leave ink where enemies
     will regret standing. */
  Blot:       { noSequence: true, col: '#8f6bff', s1: 'blot_ink_cast', s2: 'blot_ink_burst' },
  Looey:      { cast: 'ConfusionEffect', impact: 'FearEffect', prop: { kind: 'item', img: 'Pop' }, col: '#ffcf5a', s1: 'pop2', s2: 'gasp' },
  /* Rudie's charge, hoof string, and Momentum own their visuals; the generic
     status flipbook made a speed carry look like a frosty support cast. */
  Rudie:      { noSequence: true, col: '#ffd166', s1: 'rudie_wind', s2: 'hit_heavy' },
  Shelly:     { cast: 'BlessedEffect', impact: 'WeakenEffect', prop: { kind: 'obj', img: 'Magifyingglass' }, col: '#d8b579', s1: 'lock', s2: 'hit_blunt' },
  Toodles:    { noSequence: true, col: '#ff9dd0' },
  /* Yatta's kit is a piñata performance: springy motion, party poppers, and
     a deliberately overcommitted finale. Her effects are authored in the
     kit instead of reusing the generic confusion/shock sequence. */
  Yatta:      { noSequence: true, col: '#ffc94d', s1: 'pop2', s2: 'cheer' },
  Poppy:      { signature: 'poppy', ally: key => key === 'G', col: '#ff9dca', s1: 'bounce', s2: 'pop2' },
  Gigi:       { cast: 'HasteEffect', impact: 'CharmEffect', prop: { kind: 'item', img: 'Gumballs' }, ally: true, col: '#ffb0e0', s1: 'get_item', s2: 'sparkle' },
  Squirm:     { cast: 'RageEffect', impact: 'PoisonBubble', col: '#e8d4a0', s1: 'grow', s2: 'hit_magic' },
  Eggson:     { cast: 'ArmorEffect', impact: 'ShockEffect', prop: { kind: 'item', img: 'easteregg' }, col: '#c9a35a', s1: 'lock', s2: 'hit_blunt' },
  /* Soulvester owns his own protection language: armor locking, a guard
     tether, and a deliberate blade draw are clearer than the generic
     ArmorEffect/ShockEffect flipbook. */
  Soulvester: { noSequence: true, col: '#c9d0da', s1: 'guard', s2: 'hit_heavy' },
  /* Eclipse stalks, pounces, and changes form. A generic invisible/curse
     sequence hid those beats behind the same two flipbooks used by unrelated
     heroes, so her skill data now owns the visual timing. */
  Eclipse:    { noSequence: true, col: '#8a6bff', s1: 'spectral', s2: 'whisper' },
  /* Sprout's kit owns its own food-delivery, rush, oven, and save beats. */
  Sprout:     { noSequence: true, col: '#f4a261' },
  Dandy:      { cast: 'RageEffect', impact: 'ShockEffect', prop: { kind: 'obj', img: 'Tape' }, col: '#ffd166', s1: 'warn', s2: 'hit_heavy' },
  Delilah:    { cast: 'CurseEffect', impact: 'SlowEffect', prop: { kind: 'obj', img: 'researchcapsule' }, col: '#caa2ff', s1: 'spectral', s2: 'lock' },
  RnD:        { cast: 'ConfusionEffect', impact: 'ShockEffect', col: '#d64b4b', s1: 'cloth', s2: 'hit_blunt' },
  Goob:       { cast: 'ShieldEffect', impact: 'HealEffect', ally: key => key !== 'B' && key !== 'basic', col: '#f3bd68', s1: 'grab', s2: 'heal_soft' },
  Tisha:      { cast: 'HasteEffect', impact: 'SlowEffect', prop: { kind: 'item', img: 'Trinkets/TISHA_Featherduster' }, col: '#8fe8ed', s1: 'sweep', s2: 'hit_light' }
};

/* The arena is a real 2D combat plane. `depth` is normalised 0..1 (front to
   back), while Battle.depthSpan turns it into the same pixel units as X for
   movement, targeting, and range checks. Perspective stays deliberately mild:
   depth should make units travel around the room, not look as if they float. */
const DEPTH_SPAN = 126;
const DEPTH_SCALE_FALL = .08;
const DEPTH_XCOMPRESS = .02;

/* Fallback entrance by move.gait, used by any Hero without a named entry in
   ENTRANCE_STYLES (data/tags.js). Durations run noticeably slower than a
   snappy UI animation on purpose - this plays before the battle speed
   multiplier exists, so "1x" never speeds it up the way it speeds up the
   fight itself, and a walk-on that reads as instant undercuts the whole
   point of giving each Hero a personality here. */
const GAIT_ENTRANCE = {
  float:   { dur: 1.35, stagger: .18, ease: ease.out, hop: 0,  bob: 16, jitter: 0 },
  hover:   { dur: 1.35, stagger: .18, ease: ease.out, hop: 0,  bob: 16, jitter: 0 },
  bounce:  { dur: 1.05, stagger: .13, ease: ease.out, hop: 26, bob: 0,  jitter: 0 },
  skitter: { dur: .85,  stagger: .10, ease: ease.out, hop: 0,  bob: 0,  jitter: 7 },
  march:   { dur: 1.05, stagger: .14, ease: t => t,   hop: 0,  bob: 3,  jitter: 0, stomp: true },
  trudge:  { dur: 1.55, stagger: .20, ease: ease.in,  hop: 0,  bob: 0,  jitter: 0, heavy: true },
  default: { dur: 1.15, stagger: .15, ease: ease.out, hop: 0,  bob: 0,  jitter: 0 }
};

/* Stat keys the modifier bag understands. Passive `flat` bags may use numbered
   variants (atkP2, crit2, ...) so two passives can stack without clobbering. */
const MOD_KEYS = ['hpP', 'atkP', 'defP', 'magP', 'mdefP', 'aspdP', 'msP', 'accP', 'evaP',
  'crit', 'critDmg', 'cdr', 'ccRes', 'armorPen', 'magPen', 'dmgDealt', 'dmgTaken',
  'energyGen', 'healRecv', 'healPowP', 'shieldPowP', 'aggro', 'kbRes', 'spdP'];

function newMods() { const m = {}; MOD_KEYS.forEach(k => m[k] = 0); m.dmgTaken = 0; return m; }
// Suffixes namespace passive bonuses: trailing digits ("defP98"), Queens of
// Mischief ("magPqom"), Cookie Run hero tags ("critCream"), or collab passives ("cdrCombo", "hpPRoad").
function baseKey(k) {
  for (const bk of MOD_KEYS) {
    if (k === bk || (k.startsWith(bk) && /^[A-Z0-9_]/.test(k.slice(bk.length)))) return bk;
  }
  return k.replace(/(?:qom|cookie|cream|tiger|bright|milk)[a-z]*$|\d+$/i, '');
}

/* ---------- combat math ----------
   Keep every visible number on the sheet and every number in Battle on one
   curve. Stats grow linearly from their authored per-level growth values;
   defenses then use a shared combat-level anchor, not the attacker's level
   alone. That means a high-level attacker still hits a low-level target hard
   through their much larger Attack/Magic Attack, but does not secretly get a
   second, defense-ignoring advantage from the mitigation formula. */
const DAMAGE_RULES = Object.freeze({
  defenseBase: 900,
  defensePerLevel: 14,
  penetrationCap: .78,
  outgoingFloor: -.65,
  outgoingCeiling: 1.75,
  incomingFloor: -.72,
  incomingCeiling: 1.35,
  critChanceCap: .85
});

/* Critical hits have a readable two-step ceiling: the ordinary tier is 2x,
   while one in five critical hits can spike into the 3x super-crit tier. */
const CRIT_RULES = Object.freeze({
  normalMultiplier: 2,
  superMultiplier: 3,
  superChance: .20
});

/* Shields are temporary protection, not a second uncapped health bar. The
   enemy ceiling is lower so a single hostile tank cannot stall an early fight
   indefinitely; player support shields retain a little more room for team
   composition and class bonuses. */
const SHIELD_RULES = Object.freeze({
  allyCap: .38,
  enemyCap: .26
});

function statLevelMult(growth, level) {
  return 1 + Math.max(0, growth || 0) * Math.max(0, (level || 1) - 1);
}

function defenseAnchor(attackerLevel, defenderLevel) {
  const a = Math.max(1, attackerLevel || 1), d = Math.max(1, defenderLevel || 1);
  return DAMAGE_RULES.defenseBase + ((a + d) * .5 - 1) * DAMAGE_RULES.defensePerLevel;
}

function defenseReduction(defense, attackerLevel, defenderLevel, penetration) {
  const pen = clamp(penetration || 0, 0, DAMAGE_RULES.penetrationCap);
  const effectiveDefense = Math.max(0, defense || 0) * (1 - pen);
  const anchor = defenseAnchor(attackerLevel, defenderLevel);
  return effectiveDefense / (anchor + effectiveDefense);
}

function boundedDamageMod(value, incoming) {
  const floor = incoming ? DAMAGE_RULES.incomingFloor : DAMAGE_RULES.outgoingFloor;
  const ceiling = incoming ? DAMAGE_RULES.incomingCeiling : DAMAGE_RULES.outgoingCeiling;
  return clamp(value || 0, floor, ceiling);
}

/* Combat sprite sizing, biggest to smallest: Lethal Twisteds > Main-tier
   Twisteds > every other Twisted > Twisted Gourdy/Toodles > regular Heroes >
   Weaklings > Gourdy/Toodles. Gourdy and Toodles are drawn small in their own
   art regardless of form, so they get a dedicated (smaller) rung in both the
   Twisted and non-Twisted halves of the ladder rather than sharing one with
   everyone else their tier. This is the single source of tier size - per-Hero
   art still varies a little (some source images just draw bigger than
   others), but nobody gets an extra manual scale bump on top of it. */
const SMALL_HERO_IDS = { Gourdy: 1, Toodles: 1 };
const TINY_HERO_ONLY_IDS = { Pebble: 1 };
function sizeTierMult(u) {
  if (u.minion) return 1; // minions use their own mScale, untouched here
  const small = !!SMALL_HERO_IDS[u.id] || (!u.twisted && !!TINY_HERO_ONLY_IDS[u.id]);
  if (u.twisted) {
    if (small) return 1.04;
    const key = (typeof obtainKey === 'function') ? obtainKey(u.id) : 'Common';
    if (key === 'Lethal') return 1.24;
    if (key === 'Main') return 1.15;
    return 1.08; // Common / Uncommon / Rare - "every other Twisted"
  }
  if (u.weakling) return 1; // weaklings already carry their own def.scale
  return small ? .78 : 1;
}

/* The body's <img> renders at a fixed WIDTH with height:auto, so a source
   PNG's own canvas aspect ratio (width/height of the full file, transparent
   padding included - that's what height:auto actually scales from) directly
   sets how TALL a unit reads on screen. Most character art is cropped close
   and roughly consistent, but individual files vary a fair amount - some
   canvases are notably narrower/taller than the norm (Ginger's regular art,
   Twisted Looey), some are wider/shorter (Coal, Cocoa) - so at a shared
   width they don't read as "the same height, different builds", they read
   as actually different sizes.
   These two tables were generated by measuring every real Characters/ and
   enemies/Twisteds/ PNG's canvas aspect ratio and comparing each one to the
   *median* aspect ratio for its set (regular Hero art vs. Twisted art each
   have their own norm, since Twisted portraits are cropped differently as a
   whole). The stored number is that ratio - values below 1 mean "this
   file's canvas is unusually tall for its set, shrink the rendered width to
   bring the height back down to the norm"; above 1 means the opposite. This
   is the single source of "does this one specific file read as an
   outlier" - it is not a game-balance knob like sizeTierMult above, and
   entries within ~6% of the norm are left out entirely (not worth a line). */
const HERO_ASPECT_FIX = {
  Astro: .921, Bassie: 1.203, Blot: .934, Bobette: .872, Boxten: 1.241,
  Coal: 1.594, Cocoa: 1.541, Connie: 1.149, Dyle: 1.119, Eclipse: .773,
  Eggson: .922, Flyte: 1.128, Ginger: .68, Goob: 1.256, Looey: .895, Rodger: .822,
  Pebble: 1.68, QOMGourdy: 1.79, Scraps: .848, Shelly: 1.119, Shrimpo: 1.071, Squirm: 1.371, Toodles: 1.126
};
/* The battle-only renders have their own crops and action silhouettes,
   so their width correction must be based on those files rather than on the
   portrait art retained by the rest of the UI. */
const BATTLE_ASPECT_FIX = { Scraps: 1.292, Poppy: 1.176, Cocoa: 1.522, Vee: 1.156 };
const TWISTED_ASPECT_FIX = {
  Bobette: .524, Coal: 1.297, Cocoa: 1, Connie: .722, Flutter: 1, Ginger: .655,
  Glisten: .486, Looey: .39, Ribecca: .516, Rodger: .8, Rudie: .74, Scraps: .75,
  Soulvester: .565, Yatta: .568
};
// The Twisted art set is cropped differently as a *whole* from the regular
// Hero set (its own median canvas is much closer to square), so correcting
// each Twisted file only against the Twisted median - the first version of
// this - made Twisted forms consistent with EACH OTHER but land shorter
// than regular Heroes across the board, exactly backwards from "a Twisted
// is always bigger than a Toon". This constant (Twisted median ÷ Hero
// median) re-anchors the whole Twisted set onto the same baseline height as
// Heroes, so sizeTierMult's own Twisted bonus (above) is what actually
// makes them read as bigger, on top of a matched baseline - not an
// accident of two unrelated crops.
const TWISTED_ASPECT_BASELINE = 1.411;
function artAspectFix(u, battlePose) {
  if (u.twisted) return TWISTED_ASPECT_BASELINE * (TWISTED_ASPECT_FIX[u.id] || 1);
  if (battlePose && BATTLE_HERO_ART[u.id]) return BATTLE_ASPECT_FIX[u.id] || 1;
  return HERO_ASPECT_FIX[u.id] || 1;
}

/* ============================================================ UNIT */
class Unit {
  constructor(spec, team, index, B) {
    const def = spec.defOverride || HEROES[spec.id];
    this.B = B; this.def = def; this.id = spec.id; this.team = team; this.index = index;
    this.twisted = !!spec.twisted;
    // Event bosses can carry a small, authored combat guard without changing
    // the normal Depths version of that character.
    this.phantasiaBoss = !!spec.phantasiaBoss;
    this.unknownWorld = !!spec.unknownWorld;
    this.collabBoss = !!spec.collabBoss;
    this.name = spec.name || def.name;
    this.level = spec.level || 1;
    this.stars = spec.stars || 1;
    this.rarity = spec.rarity || 1;
    this.rarityPlus = spec.rarityPlus == null ? 1 : clamp(spec.rarityPlus, 1, RARITY_TIER_MAX[this.rarity] || 1);
    this.skillLv = spec.skillLv || 1;
    this.skillLevels = spec.skillLevels || null;
    this.cls = spec.cls; this.subcls = spec.subcls;
    this.cls2 = spec.cls2; this.subcls2 = spec.subcls2;
    this.classRank = clamp(spec.classRank || (spec.cls ? 1 : 0), 0, CLASS_MAX_RANK);
    this.subclassRank = clamp(spec.subclassRank || (spec.subcls ? 1 : 0), 0, CLASS_MAX_RANK);
    this.classRank2 = clamp(spec.classRank2 || (spec.cls2 ? 1 : 0), 0, CLASS_MAX_RANK);
    this.subclassRank2 = clamp(spec.subclassRank2 || (spec.subcls2 ? 1 : 0), 0, CLASS_MAX_RANK);
    this.role = def.role; this.tier = def.tier;
    // Encounter builders can deliberately place a unit outside the row its
    // attack range would normally imply: 0 = front, 1 = middle, 2 = back.
    this.formationLine = Number.isInteger(spec.formationLine) ? clamp(spec.formationLine, 0, 2) : null;
    // Encounters may tune physical and magic profiles independently. Older
    // encounter specs only supplied `atk` / `def`, so retain those as the
    // fallback for Magic Attack / Magic Defense instead of changing them.
    this.mult = Object.assign({ hp: 1, atk: 1, mag: null, def: 1, mdef: null }, spec.mult || {});
    this.isBoss = spec.kind === 'boss';
    this.isElite = !!spec.elite && !this.isBoss; // the data already flagged this, nothing showed it
    this.immovable = !!(spec.immovable || def.immovable);
    this.boss = spec.boss || null;
    this.lethalBoss = !!spec.lethalBoss;
    this.minion = false;

    this.flat = {};
    this.statuses = [];
    this.shields = [];
    this.cds = {}; this.timers = []; this.intervals = [];
    this.energy = 0; this.energyMax = 100;
    this.face = team === TEAM_P ? 1 : -1;
    this.target = null; this.turnT = 0;
    this.alive = true; this.moving = false; this.casting = null; this._castId = 0;
    this.animState = 'idle'; this.animT = 0;
    this.dmgDone = 0; this.dmgTaken = 0; this.healDone = 0; this.healReceived = 0; this.kills = 0;
    this.paint = 0; this.spark = 0; this.prod = 0; this.exposure = 0;
    this.invuln = 0; this.rangeBonus = 0; this.dirty = true;
    this.statusVersion = 0;
    this.visualFreeze = false; this.visualPetrify = false;
    this.visualSleep = false; this.visualStun = false; this.visualLaunch = false;
    this._filterCache = null; this._renderZ = null; this._renderOpacity = null;
    this._renderFace = null; this._renderSword = null; this._renderHp = null; this._renderShield = null;
    this._renderEnergy = null; this._renderUlt = null; this._renderLow = null;
    this._renderStatusVersion = -1;
    this.vx = 0; this.vy = 0; this.hitT = 0; this.bobT = rnd(0, 10); this.sq = 1; this.rot = 0;
    this.dashUntil = 0; this.dashTo = null; this.dashFrom = 0; this.dashFromDepth = 0; this.dashToDepth = 0; this.dashDur = 0; this.dashOpt = null;
    this.lastStep = 0; this.atkCd = 0; this.windup = 0; this.pendingHit = null;
    this.plate = 0;   // vertical offset for this unit's label stack
    // A tiny fixed tilt per unit so cutouts read as hand-placed, not stamped
    // perfectly upright - deterministic (no Math.random) so replays stay stable.
    this.paperTilt = ((hashStr(this.id + '#' + index) % 11) - 5) * 0.009;
    this.artSrc = spec.artSrc || null;
    this.weakling = !!spec.weakling;
    this.trinkets = HEROES[spec.id] && HEROES[spec.id].noTrinket ? [] : (spec.trinkets || []);
    this.badge = spec.badge || null; // legacy single badge, used by generated enemies
    this.badges = Array.isArray(spec.badges) ? spec.badges.slice(-1) : [];
    this.carryHp = spec.carryHp;
    this.guards = [];

    this.computeBase();
    this.hp = this.max.hp;
    this.st = Object.assign({}, this.max);
  }

  /* ---- stat pipeline ----
     Color rarity gates skills, while each granular + rank also raises stats.
     This applies to player Heroes, Depths enemies, and Arena rivals through
     the same Unit pipeline. */
  computeBase() {
    const d = this.def, g = d.growth, lv = this.level;
    const starM = 1 + (this.stars - 1) * 0.14;
    const rarityM = rarityStatMultiplier(this.rarity, this.rarityPlus);
    const b = {};
    ['hp', 'atk', 'def', 'mag', 'mdef'].forEach(k => {
      b[k] = d.base[k] * statLevelMult(g[k], lv) * starM * rarityM;
    });
    ['spd', 'acc', 'eva'].forEach(k => { b[k] = d.base[k] * statLevelMult(.012, lv) * starM * rarityM; });
    b.hp *= this.mult.hp;
    b.atk *= this.mult.atk;
    b.mag *= this.mult.mag == null ? this.mult.atk : this.mult.mag;
    b.def *= this.mult.def;
    b.mdef *= this.mult.mdef == null ? this.mult.def : this.mult.mdef;
    const h = d.hidden;
    /* Keep the late-game extremes inside the authored stat system instead of
       correcting them with mode-only damage caps or anti-heal rules. These
       values are the values shown on the Hero sheet and apply to both teams. */
    const critDamage = 1 + Math.max(0, h.critDmg - 1) * .84;
    const healingPower = 1 + Math.max(0, h.healPow - 1) * .78;
    const shieldPower = 1 + Math.max(0, h.shieldPow - 1) * .82;
    Object.assign(b, {
      range: h.range, aspd: h.aspd, ms: h.ms, aggro: h.aggro, crit: h.crit, critDmg: critDamage,
      healPow: healingPower, shieldPow: shieldPower, cdr: h.cdr, ccRes: h.ccRes, kbRes: h.kbRes,
      armorPen: h.armorPen, magPen: h.magPen, dmgDealt: 0, dmgTaken: 0, energyGen: 1, healRecv: 1
    });
    // Tanks need a dependable baseline before their individual kits come
    // online. Their unique passives still define how they absorb pressure.
    if (d.role === 'Tank') {
      b.hp *= 1.16;
      b.def *= 1.14;
      b.mdef *= 1.14;
      b.aggro += .9;
    }
    this.baseStats = b;
    this.max = Object.assign({}, b);
    this.recompute(true);
  }

  recompute(initial) {
    const m = newMods();
    // persistent passive bag
    for (const k in this.flat) { const bk = baseKey(k); if (bk in m) m[bk] += this.flat[k]; }
    // team auras
    (this.B ? this.B.auras : []).forEach(a => { if (a.team === this.team) a.fn(m, this); });
    // statuses
    const buffAmplifier = (this.hasStatus('cookie_cream_blessing') ? .15 : 0)
      + (this.hasStatus('vanilla_gentle') ? .15 : 0);
    this.statuses.forEach(s => { const d = STATUS[s.id]; if (!d || !d.mods) return;
      if (buffAmplifier && d.kind === 'buff' && s.id !== 'cookie_cream_blessing' && s.id !== 'vanilla_gentle') {
        const before = Object.assign({}, m); d.mods(m, s, this);
        for (const key in m) if (typeof m[key] === 'number' && typeof before[key] === 'number') m[key] += (m[key] - before[key]) * buffAmplifier;
      } else d.mods(m, s, this);
    });
    // Dandy's Lethal Ward, boss phases, Distortion and per-attacker Attention
    // all reduce incoming damage. In Phantasia those layers used to combine
    // into a near-zero damage state after the final phase. Keep the intended
    // fantasy while guaranteeing a visible damage floor for the event boss.
    if (this.twisted && this.id === 'Dandy') m.dmgTaken = Math.max(m.dmgTaken, -.58);
    // class / subclass are applied as flat at spawn, already in this.flat

    const b = this.baseStats;
    const hpRatio = initial ? 1 : (this.max.hp ? this.hp / this.max.hp : 1);
    this.max.hp = b.hp * (1 + m.hpP);
    if (!initial) this.hp = clamp(this.max.hp * hpRatio, 1, this.max.hp);

    const st = this.st || (this.st = {});
    st.atk = b.atk * (1 + m.atkP);
    st.mag = b.mag * (1 + m.magP);
    st.def = Math.max(0, b.def * (1 + m.defP));
    st.mdef = Math.max(0, b.mdef * (1 + m.mdefP));
    st.spd = b.spd * (1 + m.spdP);
    st.acc = Math.max(1, b.acc * (1 + m.accP));
    st.eva = Math.max(0, b.eva * (1 + m.evaP));
    st.aspd = Math.max(.15, b.aspd * (1 + m.aspdP));
    st.ms = Math.max(0, b.ms * (1 + (m.noMsGain ? Math.min(m.msP, 0) : m.msP)));
    // Combat ranges were authored for the 560px-wide arena. Scale them down
    // on narrow phones so ranged units still need to cross part of the field.
    st.range = (b.range + (this.rangeBonus || 0)) * (this.B.rangeScale || 1);
    st.crit = clamp(b.crit + m.crit, 0, DAMAGE_RULES.critChanceCap);
    st.critDmg = clamp(b.critDmg + m.critDmg, 1.1, 3.25);
    st.cdr = clamp(b.cdr + m.cdr, -.75, .75);
    st.ccRes = clamp(b.ccRes + m.ccRes, 0, .85);
    st.kbRes = clamp(b.kbRes + m.kbRes, 0, 1);
    st.armorPen = clamp(b.armorPen + m.armorPen, 0, DAMAGE_RULES.penetrationCap);
    st.magPen = clamp(b.magPen + m.magPen, 0, DAMAGE_RULES.penetrationCap);
    st.healPow = b.healPow * (1 + m.healPowP);
    st.shieldPow = b.shieldPow * (1 + m.shieldPowP);
    st.aggro = Math.max(.05, b.aggro + m.aggro);
    st.dmgDealt = boundedDamageMod(m.dmgDealt, false);
    st.dmgTaken = boundedDamageMod(m.dmgTaken, true);
    st.energyGen = Math.max(0, 1 + m.energyGen);
    st.healRecv = Math.max(0, 1 + m.healRecv);

    // control flags
    const f = { noAct: false, noMove: false, silenced: false, disarmed: false, taunted: false,
      confused: false, charmed: false, flee: false, untargetable: false, ccImmune: false,
      airborne: false, cursed: false, noStealth: false, noDash: false };
    let visualFreeze = false, visualPetrify = false;
    let visualSleep = false, visualStun = false, visualLaunch = false;
    this.statuses.forEach(s => {
      const d = STATUS[s.id];
      if (d && d.flags) Object.assign(f, d.flags);
      visualFreeze = visualFreeze || s.id === 'freeze';
      visualPetrify = visualPetrify || s.id === 'petrify';
      visualSleep = visualSleep || s.id === 'sleep';
      visualStun = visualStun || s.id === 'stun';
      visualLaunch = visualLaunch || s.id === 'launch';
    });
    if (f.ccImmune) { f.noAct = false; f.noMove = false; f.silenced = false; f.taunted = false; f.confused = false; f.flee = false; }
    this.flags = f;
    this.visualFreeze = visualFreeze;
    this.visualPetrify = visualPetrify;
    this.visualSleep = visualSleep;
    this.visualStun = visualStun;
    this.visualLaunch = visualLaunch;
    this.dirty = false;
    if (this.B) {
      this.B._targetableDirty = true;
      this.B._targetableVersion = (this.B._targetableVersion || 0) + 1;
    }
  }

  skillLevel(key) { return Math.max(1, Number(this.skillLevels && this.skillLevels[key]) || this.skillLv || 1); }
  hasStatus(id) { return this.statuses.some(s => s.id === id); }
  getStatus(id) { return this.statuses.find(s => s.id === id); }
  get hpPct() { return this.hp / this.max.hp; }
  get shieldTotal() { return sum(this.shields.map(s => s.amt)); }
}

/* ============================================================ BATTLE */
class Battle {
  constructor(opt) {
    this.opt = opt || {};
    this.units = []; this.auras = [];
    this.listenersByEvent = Object.create(null);
    // Damage/status events can fire dozens of times in one visual frame. Keep
    // direct owner and team buckets so emitFor/emitTeam/emitFoe do not rescan
    // every passive listener on every hit.
    this.listenersByTeam = [Object.create(null), Object.create(null)];
    this.timers = []; this.intervals = [];
    this.t = 0; this.over = false; this.result = null; this.timeLimit = 180;
    this.speed = 1; this.paused = false;
    this.logLines = [];
    this.acc = 0; this.stopT = 0;
    this.el = {};
    this.nextId = 1;
    this.stat = { crits: 0, superCrits: 0, hits: 0 };   // feeds the results card
    this._liveDirty = true;
    this._targetableDirty = true;
    this._liveTeams = [[], []];
    this._combatTeams = [[], []];
    this._targetableTeams = [[], []];
    this._targetableSafeTeams = [[], []];
    this._targetableVersion = 0;
    this._targetableSafeVersion = -1;
    this.offscreen = false;
  }

  /* ---------- setup ---------- */
  start(playerSpecs, enemySpecs, meta) {
    this.meta = meta || {};
    this.offscreen = !!(this.opt && this.opt.offscreen) || !!(this.meta && this.meta.offscreen);
    if (this.offscreen) {
      // simulateOffscreen supplies detached FX hosts. Keep the battle marked
      // off-screen so combat timing and rendering never touch the live arena.
      if (typeof FX !== 'undefined') FX.offscreen = true;
    } else {
      if (typeof FX !== 'undefined') FX.offscreen = false;
      FX.init(); FX.clear();
    }
    this.el.units = $('#unitLayer');
    clear(this.el.units);
    this._timerEl = $('#hudTimerText');
    // #battle is capped at the same 560px phone-frame width as #app, so on a
    // wide screen the visible stage is narrower than the raw window - measure
    // the actual frame, not window.innerWidth, or units would be placed for a
    // stage wider than what's on screen.
    const frame = $('#battle').getBoundingClientRect();
    this.W = this.offscreen ? 560 : frame.width; this.H = this.offscreen ? 760 : frame.height;
    this.rangeScale = clamp(this.W / 560, .48, 1);
    // A phone needs a little more usable floor depth because five silhouettes
    // cannot all have their own comfortable horizontal lane. Keep the extra
    // room inside the arena rather than letting the back row collapse into
    // the front row.
    this.phoneStage = this.W <= 430;
    this.compactStage = this.W <= 700;
    this.depthSpan = clamp(this.H * .235, 96, this.phoneStage ? 170 : DEPTH_SPAN);
    // The floor sits higher than before - taller stage, more room for the
    // depth axis below (see DEPTH_SPAN) to actually read as a perspective
    // floor instead of a sliver behind everyone's feet.
    this.ground = this.H - Math.min(260, this.H * 0.42);
    this.leftWall = 18; this.rightWall = this.W - 18;

    $('#bgLayer').style.backgroundImage = `url("${this.meta.bg || bgForFloor(1, 0)}")`;
    const floorEl = $('#floorLine');
    if (floorEl && !this.offscreen) floorEl.style.height = (this.H - this.ground + this.depthSpan + 24) + 'px';
    if (!this.offscreen) $('#waveText').textContent = this.meta.floorLabel
      ? `${this.meta.floorLabel}  ·  ${this.meta.roomIdx}/${this.meta.roomTotal}`
      : (this.meta.title || 'Battle');
    this.timeLimit = this.meta.timeLimit || 180;
    if (!this.offscreen) {
      this.updateTimer(true);
      $('#battleEnd').hidden = true; clear($('#battleEnd'));
      clear($('#logBox'));
    }

    playerSpecs.forEach((s, i) => this.addUnit(s, TEAM_P, i));
    enemySpecs.forEach((s, i) => this.addUnit(s, TEAM_E, i));

    // A full party is the expensive case: ten large cutouts plus their
    // nameplates, bars and effects. Keep the fixed-step simulation at its
    // normal rate, but let wider screens paint that visual layer at 30 FPS.
    // Phones already use the 30 FPS battle cadence, so this only affects the
    // desktop/tablet preview where the stage is still phone-frame sized.
    // Eight or more cutouts already saturate a phone-sized compositor. Keep
    // the fixed-step combat clock at 60 Hz, but paint the expensive DOM unit
    // layer at 30 Hz for dense desktop fights too. FX and combat timing remain
    // independent, so projectiles and hit windows do not lose precision.
    this._renderEvery = (this.units.length >= 8 || FX.graphicsQuality < 67) && BATTLE_FPS >= 60 ? 2 : 1;
    this._denseCombat = this.units.length >= 8;
    this._renderFrame = 0;
    if (!this.offscreen && FX.setCombatLoad) FX.setCombatLoad(this.units.length, this.units);
    if (!this.offscreen && Sound.setCombatLoad) Sound.setCombatLoad(this.units.length);

    // Some modes intentionally start with a little combat momentum. This is
    // applied before passive setup/recompute so it is a real starting state,
    // not a one-frame UI-only fill. Normal modes leave these unset.
    if (this.meta.skillStartEnergy != null || this.meta.skillTempo != null
      || this.meta.enemySkillStartEnergy != null || this.meta.enemySkillTempo != null) {
      const start = clamp(Number(this.meta.skillStartEnergy) || 0, 0, 100);
      const enemyStart = clamp(Number(this.meta.enemySkillStartEnergy == null ? start : this.meta.enemySkillStartEnergy), 0, 100);
      const tempo = Math.max(1, Number(this.meta.skillTempo) || 1);
      const enemyTempo = Math.max(1, Number(this.meta.enemySkillTempo == null ? tempo : this.meta.enemySkillTempo));
      const enemyCdr = Math.max(0, Number(this.meta.enemySkillCdr) || 0);
      this.units.forEach(u => {
        const isEnemy = u.team === TEAM_E;
        const unitStart = isEnemy ? enemyStart : start;
        const unitTempo = isEnemy ? enemyTempo : tempo;
        if (unitStart) u.energy = Math.max(u.energy, u.energyMax * unitStart / 100);
        if (unitTempo > 1) u.flat.energyGen = (u.flat.energyGen || 0) + unitTempo - 1;
        if (isEnemy && enemyCdr) u.flat.cdr = (u.flat.cdr || 0) + enemyCdr;
        u.dirty = true;
      });
    }

    // formation: melee forward, ranged behind, by attack range. Each side
    // camps close to its own wall, not the middle - the two teams start a
    // real no-man's-land apart and have to actually close the distance to
    // fight, instead of spawning already in range of each other.
    // frontline/midline/backline - each unit's basic-attack range (fixed by
    // their kit, not something the player picks) buckets them into one of
    // three rows, melee up close and ranged tucked back, instead of a
    // continuous range-sort that read as one loose clump.
    const LINE_GAP = this.phoneStage ? 58 : this.compactStage ? 64 : 70; // px between rows
    // Player formation uses authored range, exactly like the team editor. The
    // phone-only combat range scale must not visually move a Hero to another
    // line after the player has just confirmed where they will stand.
    const lineOf = u => {
      if (u.formationLine != null) return u.formationLine;
      const range = u.baseStats && u.baseStats.range != null ? u.baseStats.range : u.st.range;
      return range <= 210 ? 0 : range <= 260 ? 1 : 2;
    };

    // Enemy squads should not always form a single range-sorted wall. Tanks
    // remain on point, while a deterministic selection of melee attackers
    // stages from the middle or back so each encounter approaches differently.
    const foes = this.units.filter(u => u.team === TEAM_E && !u.minion && u.formationLine == null);
    const movable = foes.filter(u => lineOf(u) === 0 && u.role !== 'Tank');
    if (movable.length) {
      const formationKey = foes.map(u => `${u.id}:${u.level}:${u.isBoss ? 'boss' : u.isElite ? 'elite' : 'normal'}`).join('|') + ':' + (this.meta.floorLabel || this.meta.title || '');
      const pattern = hashStr(formationKey) % 4;
      if (pattern === 1) movable[0].formationLine = 1;
      if (pattern === 2) movable[movable.length - 1].formationLine = 2;
      if (pattern === 3) {
        movable[0].formationLine = 1;
        if (movable.length > 1) movable[movable.length - 1].formationLine = 2;
      }
    }
    // The gap between the two frontlines at spawn has to clear the longest
    // melee range in the game (210) with real room to spare, or "melee"
    // units are already standing in range the instant the fight starts and
    // never actually walk anywhere. 260 clears that with margin even before
    // knockback/dash effects are considered.
    this.midX = (this.leftWall + this.rightWall) / 2;
    const usable = this.rightWall - this.leftWall;
    const labDuel = !!this.meta.labDuel && this.units.filter(u => !u.minion).length === 2;
    const NO_MANS_GAP = labDuel ? Math.min(110, usable - 60)
      : this.phoneStage ? Math.min(180, usable - 60) : Math.min(260, usable - 60);
    // Put the two frontlines on the edges of the no-man's-land. The previous
    // extra reservation for horizontal stacking pulled this value so far
    // toward the wall that the `Math.max(30, ...)` floor collapsed front,
    // mid, and back rows onto the same x position. Same-line units now use
    // the depth axis for their spread, so the rows can keep their useful
    // horizontal spacing without eroding the frontline gap.
    const frontOffset = Math.max(30, (usable - NO_MANS_GAP) / 2);
    // On narrow screens, use the depth axis as a real second formation row.
    // The old slots were too shallow, so units with nearby x positions still
    // read as one overlapping horizontal pile.
    const depthSlots = this.phoneStage ? [.04, .28, .52, .76, .94] : [.08, .38, .70, .86, .53];
    [TEAM_P, TEAM_E].forEach(team => {
      const list = this.units.filter(u => u.team === team);
      const lineCount = [0, 0, 0];
      list.forEach(u => {
        const line = lineOf(u);
        const slot = lineCount[line]++;
        // Backline sits close to its own wall; frontline is pushed out to
        // frontOffset so the two frontlines land roughly NO_MANS_GAP apart.
        // Line 0 (shortest range) is closest to the enemy, while line 2
        // (longest range) stays home and can fire over the frontline.
        const rowOffset = Math.max(30, frontOffset - line * LINE_GAP);
        u.line = line;
        u.x = team === TEAM_P ? this.leftWall + rowOffset : this.rightWall - rowOffset;
        // safety net - real spacing above already keeps this from
        // triggering in a normal 5v5, this only guards extreme edge cases
        const centerBuffer = this.phoneStage ? 24 : 40;
        u.x = team === TEAM_P ? Math.min(u.x, this.midX - centerBuffer) : Math.max(u.x, this.midX + centerBuffer);
        u.homeX = u.x;
        // walk-in intro starts everyone off past their own wall
        u.introFrom = team === TEAM_P ? this.leftWall - 190 - (2 - line) * 42 : this.rightWall + 190 + (2 - line) * 42;
        u.x = u.introFrom;
        // Spread the formation over the floor from the opening frame. The
        // enemy ordering is mirrored so opposing units do not begin in five
        // perfectly parallel lanes.
        // Spread units within their own row rather than using the global unit
        // index. That keeps a five-unit frontline readable even when the
        // roster also contains midline and backline units.
        // Arena PvP is meant to compare builds, not give one side a hidden
        // lane matchup advantage. Keep the normal encounter offset elsewhere
        // so regular waves still have their staggered opening.
        const depthIndex = this.meta.arenaPvP
          ? (slot * 2 + line) % depthSlots.length
          : team === TEAM_P
            ? (slot * 2 + line) % depthSlots.length
            : (slot * 2 + line + 1) % depthSlots.length;
        u.depthHome = depthSlots[depthIndex]; u.depth = u.depthHome; u.depthTarget = null;
        u.y = this.ground - u.depth * this.depthSpan;
        // stagger the labels so five stacked units stay readable
        u.plate = (slot % 3) * 17;
      });
    });

    this.units.forEach(u => this.buildUnitEl(u));
    if (!this.offscreen) this.buildBars();

    // floor modifiers
    (this.meta.mods || []).forEach(mid => {
      const eventMods = typeof EVENT_MODIFIERS === 'undefined' ? [] : EVENT_MODIFIERS;
      const m = FLOOR_MODS.find(x => x.id === mid) || eventMods.find(x => x.id === mid);
      if (m) { m.apply(this); this.log('<b>' + m.name + ':</b> ' + m.desc); }
    });

    // classes, then rarity-gated passives
    this.units.forEach(u => {
      if (u.cls && CLASSES[u.cls]) CLASSES[u.cls].apply(u, this, u.classRank || 1);
      if (u.subcls && SUBCLASSES[u.subcls]) SUBCLASSES[u.subcls].apply(u, this, u.subclassRank || 1);
      if (u.rarity >= 6 && u.cls2 && CLASSES[u.cls2]) CLASSES[u.cls2].apply(u, this, u.classRank2 || 1);
      if (u.rarity >= 6 && u.subcls2 && SUBCLASSES[u.subcls2]) SUBCLASSES[u.subcls2].apply(u, this, u.subclassRank2 || 1);
      if (u.aura) this.applyStatus(u, u, u.aura, 999, { stacks: 3 });
      (u.trinkets || []).forEach(worn => {
        // Player equipment is stored by inventory UID. Generated opponents
        // carry a plain {id, rank} record because they have no save inventory.
        const copy = typeof worn === 'string' ? Save.data.trinketInv[worn] : worn;
        if (!copy) return;
        const t = TRINKETS[copy.id]; if (!t) return;
        try { t.apply(u, this, copy.rank); }
        catch (e) { console.warn('trinket apply failed', u.id, copy.id, e); }
      });
      const wornBadges = u.badges.length ? u.badges : u.badge ? [u.badge] : [];
      const applied = new Set();
      wornBadges.forEach(ref => {
        const bid = typeof ref === 'string' ? ref : ref && ref.id;
        if (!bid || applied.has(bid)) return;
        applied.add(bid);
        const lvl = typeof ref === 'string' ? Save.badgeLvl(bid) : ref.lvl;
        const b = BADGES[bid];
        if (b && lvl > 0) {
          try { b.apply(u, this, lvl); }
          catch (e) { console.warn('badge apply failed', u.id, bid, e); }
        }
      });
    });
    this.units.forEach(u => this.initPassives(u));
    this.units.filter(u => u.lethalBoss).forEach(u => this.initLethalBoss(u));
    this.units.forEach(u => {
      u.dirty = true; u.recompute(true);
      u.hp = u.max.hp * clamp(u.carryHp == null ? 1 : u.carryHp, .05, 1);
    });

    if (this.offscreen) {
      this._twistedAmbienceAt = Infinity;
      this.running = true;
      this.last = 0;
      return this;
    }

    this.log('<b>' + (this.meta.title || 'Battle') + '</b> begins.');
    if (this.meta.machinePrelude) return;
    if (!this.meta.collabEntrance) Sound.encounter(this.units.filter(u => u.team === TEAM_E));
    this.units.filter(u => u.unknownWorld).forEach((u, i) => setTimeout(() => {
      if (u.alive) this.unknownWorldDialogue(u, { force: true });
    }, 360 + i * 220));
    this._twistedAmbienceAt = 8 + rnd(0, 4);
    this.introWalk(() => {
      const startCombat = () => { this.running = true; this.last = performance.now(); this.loop(); };
      // Battles now begin as soon as their entrance is complete. Friendship
      // Campaign dialogue remains a post-victory scene via `postBanter`.
      const afterEntrance = startCombat;
      if (this.meta.collabEntrance) this.playCollabEntrance(afterEntrance);
      else afterEntrance();
    });
  }

  /** Run the exact live combat rules without starting the visual battle.
      ticket battles use normal fixed simulation ticks; x10000 means those
      ticks are consumed immediately instead of being paced by animation. */
  simulateOffscreen(playerSpecs, enemySpecs, meta, opt) {
    opt = opt || {};
    const previous = {};
    ['play', 'collab', 'twisted', 'encounter', 'warm'].forEach(key => {
      if (typeof Sound !== 'undefined' && typeof Sound[key] === 'function') {
        previous[key] = Sound[key]; Sound[key] = () => false;
      }
    });
    // Skills are allowed to author their normal FX during a ticket battle
    // (shields, telegraphs, character signatures, etc.). Point those effects
    // at detached DOM hosts instead of nulling the layers: a number of authored
    // effects append directly and would otherwise throw before combat starts.
    // The detached hosts are discarded in finally, so tape sims never paint
    // the live arena or retain thousands of cosmetic nodes.
    const fxState = typeof FX !== 'undefined' ? {
      front: FX.front, back: FX.back, pop: FX.pop, stage: FX.stage, flashEl: FX.flashEl,
      parts: FX.parts, offscreen: FX.offscreen
    } : null;
    let fxHost = null;
    if (fxState && typeof document !== 'undefined') {
      fxHost = document.createElement('div');
      FX.front = document.createElement('div');
      FX.back = document.createElement('div');
      FX.pop = document.createElement('div');
      FX.stage = fxHost;
      FX.flashEl = document.createElement('div');
      FX.parts = [];
      FX.offscreen = true;
      fxHost.append(FX.back, FX.front, FX.pop, FX.flashEl);
    }
    this.speed = 10000;
    try {
      this.start(playerSpecs, enemySpecs, Object.assign({}, meta || {}, { offscreen: true }));
      if (opt.onReady) opt.onReady(this);
      // ticket battles do not need visual-frame fidelity. Advancing the real
      // combat rules in larger off-screen slices keeps the result immediate
      // instead of making a skip wait through thousands of 60 FPS ticks.
      const simTick = this.offscreen ? TICK * 8 : TICK;
      const maxSteps = Math.ceil((this.timeLimit + 2) / simTick);
      for (let i = 0; i < maxSteps && !this.over; i++) this.step(simTick);
      if (!this.over) this.finish(!!this.meta.timeoutWin, this.meta.timeoutWin ? 'Survived' : 'Time');
      return this.result;
    } finally {
      Object.keys(previous).forEach(key => { Sound[key] = previous[key]; });
      if (fxState) {
        if (fxHost) fxHost.replaceChildren();
        FX.front = fxState.front; FX.back = fxState.back; FX.pop = fxState.pop;
        FX.stage = fxState.stage; FX.flashEl = fxState.flashEl;
        FX.parts = fxState.parts; FX.offscreen = fxState.offscreen;
      }
    }
  }

  /** Async twin for ticket batches. It uses the same setup and fixed-step
      rules as simulateOffscreen, but returns control to the browser between
      small slices so a multi-ticket run cannot freeze the page. */
  async simulateOffscreenAsync(playerSpecs, enemySpecs, meta, opt) {
    opt = opt || {};
    const previous = {};
    ['play', 'collab', 'twisted', 'encounter', 'warm'].forEach(key => {
      if (typeof Sound !== 'undefined' && typeof Sound[key] === 'function') {
        previous[key] = Sound[key]; Sound[key] = () => false;
      }
    });
    const fxState = typeof FX !== 'undefined' ? {
      front: FX.front, back: FX.back, pop: FX.pop, stage: FX.stage, flashEl: FX.flashEl,
      parts: FX.parts, offscreen: FX.offscreen
    } : null;
    let fxHost = null;
    if (fxState && typeof document !== 'undefined') {
      fxHost = document.createElement('div');
      FX.front = document.createElement('div');
      FX.back = document.createElement('div');
      FX.pop = document.createElement('div');
      FX.stage = fxHost;
      FX.flashEl = document.createElement('div');
      FX.parts = [];
      FX.offscreen = true;
      fxHost.append(FX.back, FX.front, FX.pop, FX.flashEl);
    }
    this.speed = 10000;
    try {
      this.start(playerSpecs, enemySpecs, Object.assign({}, meta || {}, { offscreen: true }));
      if (opt.onReady) opt.onReady(this);
      const simTick = this.offscreen ? TICK * 8 : TICK;
      const maxSteps = Math.ceil((this.timeLimit + 2) / simTick);
      const yieldEvery = Math.max(1, Math.floor(Number(opt.yieldEvery) || 8));
      for (let i = 0; i < maxSteps && !this.over; i++) {
        this.step(simTick);
        if (i % yieldEvery === yieldEvery - 1 && !this.over) await new Promise(resolve => setTimeout(resolve, 0));
      }
      if (!this.over) this.finish(!!this.meta.timeoutWin, this.meta.timeoutWin ? 'Survived' : 'Time');
      return this.result;
    } finally {
      Object.keys(previous).forEach(key => { Sound[key] = previous[key]; });
      if (fxState) {
        if (fxHost) fxHost.replaceChildren();
        FX.front = fxState.front; FX.back = fxState.back; FX.pop = fxState.pop;
        FX.stage = fxState.stage; FX.flashEl = fxState.flashEl;
        FX.parts = fxState.parts; FX.offscreen = fxState.offscreen;
      }
    }
  }

  playCollabEntrance(onDone) {
    const host = $('#battle');
    const scene = el('div', 'collab-boss-intro');
    scene.innerHTML = `<div class="collab-intro-keyhole"></div>
      <div class="collab-intro-title"><small>COLLAB CHALLENGE</small><b>THE DOOR OPENS</b><span>Riku · Sora · Kairi</span></div>
      <div class="collab-intro-cast"></div><button class="collab-intro-skip">SKIP</button>`;
    host.appendChild(scene);
    const cast = $('.collab-intro-cast', scene);
    const entries = [
      { id: 'Riku', src: './uploads/rikustandby.png', cols: 3, rows: 2, frames: [0, 1, 2, 3], fps: 8, ratio: 65 / 59 },
      { id: 'Sora', src: './uploads/sorawinortauntidk.png', cols: 3, rows: 2, frames: [0, 1, 2, 3, 4, 5], fps: 10, ratio: 56 / 73 },
      { id: 'Kairi', src: './uploads/kairstandby.png', cols: 3, rows: 2, frames: [0, 1, 2, 3], fps: 8, ratio: 101 / 83 }
    ];
    const actors = entries.map((d, i) => {
      const wrap = el('div', 'collab-intro-actor actor-' + d.id.toLowerCase());
      const sprite = el('div', 'collab-intro-sprite');
      sprite.style.backgroundImage = `url("${d.src}")`;
      sprite.style.backgroundSize = `${d.cols * 100}% ${d.rows * 100}%`;
      sprite.style.aspectRatio = String(d.ratio);
      wrap.appendChild(sprite); wrap.appendChild(el('b', null, d.id)); cast.appendChild(wrap);
      return { d, sprite, delay: i * .16 };
    });
    Sound.collab({ id: 'Riku' }, 'start', { vol: .82, priority: true });
    Sound.play('kairi_start', { vol: .75, delay: 650, priority: true });
    Sound.play('sora_start', { vol: .84, delay: 1300, priority: true });
    let done = false, frameTimer = 0, started = performance.now();
    const finish = () => {
      if (done) return; done = true; clearTimeout(frameTimer); scene.classList.add('leaving');
      setTimeout(() => { scene.remove(); onDone(); }, 260);
    };
    const tick = now => {
      const sec = (now - started) / 1000;
      actors.forEach(a => {
        const local = Math.max(0, sec - a.delay);
        const frame = a.d.frames[Math.floor(local * a.d.fps) % a.d.frames.length];
        const col = frame % a.d.cols, row = Math.floor(frame / a.d.cols);
        a.sprite.style.backgroundPosition = `${col / (a.d.cols - 1) * 100}% ${row / (a.d.rows - 1) * 100}%`;
      });
      if (sec >= 3.25) finish(); else frameTimer = scheduleBattleFrame(() => tick(performance.now()));
    };
    scene.onclick = finish;
    frameTimer = scheduleBattleFrame(() => tick(performance.now()));
  }

  /** Full visual-novel scene. Regular floor banter can still introduce a
      battle, while Friendship Campaigns pass `post:true` and play only after
      the round has been won. */
  playBanter(scene, onDone) {
    const stage = $('#battle');
    const dim = el('div', 'banterScene' + (scene.post ? ' post-battle' : ' pre-battle'));
    dim.setAttribute('role', 'dialog');
    dim.setAttribute('aria-label', scene.title || 'Story dialogue');
    stage.appendChild(dim);
    const heroId = who => who === 'Razzle' || who === 'Dazzle' || who === 'Razzle & Dazzle' ? 'RnD' : who;
    const castIds = [];
    [...(scene.cast || []), ...(scene.guests || []), ...scene.lines.map(line => line.who)].forEach(who => {
      const id = heroId(who);
      if (HEROES[id] && !castIds.includes(id)) castIds.push(id);
    });
    const top = el('div', 'vn-top');
    top.innerHTML = `<small>${scene.label || (scene.post ? 'ROUND CLEARED' : 'STORY SCENE')}</small><b>${scene.title || this.meta.title || 'Team Story'}</b>`;
    dim.appendChild(top);
    const cast = el('div', 'vn-cast count-' + Math.min(5, castIds.length));
    const portraits = {};
    castIds.slice(0, 5).forEach(id => {
      const figure = el('figure', 'vn-portrait');
      figure.dataset.id = id;
      figure.innerHTML = `<img src="${Art.icon(id)}" alt="${HEROES[id].name}"><figcaption>${HEROES[id].name}</figcaption><i></i>`;
      cast.appendChild(figure); portraits[id] = figure;
    });
    dim.appendChild(cast);
    const box = el('div', 'banterBox');
    dim.appendChild(box);
    let i = 0;
    const formatText = text => String(text || '')
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/\*([^*]+)\*/g, '<em class="bb-action">$1</em>');
    const show = () => {
      const line = scene.lines[i];
      const id = heroId(line.who), narrator = line.who === 'Narrator' || (!HEROES[id] && !(scene.guests || []).includes(line.who));
      Object.values(portraits).forEach(n => n.classList.toggle('active', !narrator && n.dataset.id === id));
      const castIndex = castIds.indexOf(id);
      const align = narrator || castIndex < 0 ? 'center' : castIndex < castIds.length / 2 ? 'left' : 'right';
      box.classList.toggle('narrator', narrator);
      box.dataset.align = align;
      box.innerHTML = `${narrator ? '' : `<div class="bb-speaker" aria-hidden="true"><img class="bb-icon" src="${Art.icon(id)}" alt=""><i></i></div>`}
        <div class="bb-body">
          <div class="bb-name">${narrator ? 'SCENE' : line.who}</div>
          <div class="bb-text">${formatText(line.text)}</div>
        </div>
        <div class="bb-progress">${i + 1} / ${scene.lines.length}</div>
        <div class="bb-next">▼</div>`;
      box.style.animation = 'none'; void box.offsetWidth; box.style.animation = '';
      Sound.play('campaign_bubble_pop', { vol: .7, rate: .94 + (i % 4) * .035, priority: true });
    };
    const advance = () => {
      Sound.play('campaign_bubble_tick', { vol: .42, rate: .92 + (i % 3) * .06, priority: true });
      i++;
      if (i >= scene.lines.length) { cleanup(); onDone(); return; }
      show();
    };
    const key = e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); advance(); } };
    const cleanup = () => { document.removeEventListener('keydown', key); dim.remove(); };
    dim.onclick = advance;
    document.addEventListener('keydown', key);
    const skip = el('button', 'vn-skip', 'SKIP STORY');
    skip.onclick = e => { e.stopPropagation(); Sound.play('ui_back'); cleanup(); onDone(); };
    dim.appendChild(skip);
    show();
  }

  /** The machine room uses the live battle stage as its event board. Combat
      is deliberately not running yet: the selected Toon works at the prop,
      while the rest of the cast and Twisteds stay hidden until a miss alerts
      the room. */
  startMachinePrelude(data) {
    if (!data || this._machineState) return;
    const selected = this.units.find(u => u.team === TEAM_P && u.id === data.toonId) || this.units.find(u => u.team === TEAM_P);
    if (!selected) return;
    const isTreadmill = data.machineType === 'treadmill';
    const speedStars = data.speedStars || data.primaryStars || 1;
    const skillStars = data.skillStars || data.secondaryStars || 1;
    const extractionStars = data.extractionStars || data.primaryStars || 1;

    const state = this._machineState = {
      selected, data, progress: 0, great: 0, check: null, raf: 0,
      tick: 0, checkTimer: 0, haltUntil: 0, settled: false, isTreadmill
    };
    const host = $('#battle');
    const prop = el('div', 'machine-battle-prop' + (isTreadmill ? ' treadmill-prop' : ''));
    if (isTreadmill) {
      prop.innerHTML = '<span class="treadmill-beacon" aria-hidden="true"></span><img src="uploads/treadmill-machine.png" alt="Treadmill Generator"><b>TREADMILL GENERATOR</b>';
    } else {
      prop.innerHTML = '<img src="uploads/image-36.png" alt="Ichor Machine"><b>ICHOR MACHINE</b>';
    }
    host.appendChild(prop);

    const ui = el('div', 'machine-battle-ui' + (isTreadmill ? ' treadmill-ui' : ''));
    ui.innerHTML = `<div class="machine-battle-head">
        <span>${isTreadmill ? 'FLOOR EVENT // TREADMILL GENERATOR ONLINE' : 'FLOOR EVENT // EXTRACTION ONLINE'}</span>
        <b>${selected.name.toUpperCase()} ${isTreadmill ? 'SPRINTING ON BELT' : 'AT THE MACHINE'}</b>
      </div>
      <div class="machine-battle-tank ${isTreadmill ? 'treadmill-tank' : ''}">
        <div><span>${isTreadmill ? 'GENERATOR CHARGE' : 'ICHOR TANK'}</span><b><strong>0</strong>%</b></div>
        <i><em></em></i>
      </div>
      <div class="machine-battle-alert ${isTreadmill ? 'treadmill-alert' : ''}" aria-live="polite">
        ${isTreadmill ? 'A STRIDE FAULT WILL ALERT NEARBY TWISTEDS' : 'A MISS WILL ALERT NEARBY TWISTEDS'}
      </div>
      <div class="machine-battle-check ${isTreadmill ? 'treadmill-check' : ''}" hidden>
        <div>
          <b>${isTreadmill ? 'CADENCE CHECK' : 'SKILL CHECK'}</b>
          <span>${isTreadmill ? 'HIT THE GOLDEN STRIDE ZONE' : 'HIT THE GOLDEN CORE FOR A GREAT JOB'}</span>
        </div>
        <button class="machine-battle-track" type="button" aria-label="Hit the moving check cursor">
          <i class="machine-battle-silver"></i>
          <i class="machine-battle-gold"></i>
          <i class="machine-battle-cursor"></i>
        </button>
        <small>${isTreadmill ? 'Silver = Steady Cadence · Gold = Speed Surge' : 'Silver = Good · Gold = Great'}</small>
        <button class="machine-battle-tap ${isTreadmill ? 'treadmill-tap' : ''}" type="button">${isTreadmill ? 'HOLD STRIDE' : 'HIT CHECK'}</button>
      </div>
      <div class="machine-battle-foot">
        ${isTreadmill
          ? `<span>🏃 ${'★'.repeat(speedStars)} RUN SPEED</span><span>✦ ${'★'.repeat(skillStars)} CADENCE CHECK</span>`
          : `<span>🏃 ${'★'.repeat(extractionStars)} EXTRACTION</span><span>✦ ${'★'.repeat(skillStars)} SKILL CHECK</span>`}
      </div>`;
    host.appendChild(ui);
    state.prop = prop; state.ui = ui;

    const cleanup = () => {
      clearInterval(state.tick); clearTimeout(state.checkTimer); cancelAnimationFrame(state.raf);
      state.tick = state.checkTimer = state.raf = 0;
      if (state.keyHandler) host.removeEventListener('keydown', state.keyHandler);
      if (state.prop) state.prop.remove();
      if (state.ui) state.ui.remove();
      if (selected) selected.moving = false;
      if (this._machineState === state) this._machineState = null;
      this._machineCleanup = null;
    };
    this._machineCleanup = cleanup;

    const revealForMachineResult = () => {
      this.units.forEach(u => {
        u._renderOpacity = null; u.moving = false;
        if (u.team === TEAM_P) {
          u._introOpacity = 1; u.x = u.homeX;
        } else {
          u._introOpacity = 0;
          if (u.el) { u.el.style.opacity = '0'; u.el.style.visibility = 'hidden'; }
        }
      });
      this.render(0);
    };

    this.units.forEach(u => {
      u._introOpacity = 0; u._renderOpacity = null; u.moving = false;
    });
    selected._introOpacity = 1; selected._renderOpacity = null;
    selected.depth = .40;

    if (isTreadmill) {
      selected.x = clamp(this.W * .24, 92, this.W - 200);
      selected.moving = true; // Actively sprint on the treadmill belt!
      prop.style.left = clamp(selected.x - 32, 24, this.W - 145) + 'px';
      prop.style.top = Math.max(76, this.ground - selected.depth * this.depthSpan - 158) + 'px';
    } else {
      selected.x = clamp(this.W * .23, 92, this.W - 200);
      selected.moving = false;
      prop.style.left = clamp(selected.x - 54, 34, this.W - 132) + 'px';
      prop.style.top = Math.max(82, this.ground - selected.depth * this.depthSpan - 150) + 'px';
    }

    this.render(0);
    Sound.play('machine_start', { priority: true });

    const checkPosition = now => {
      const c = state.check; return c ? Math.min(100, (now - c.started) / c.period * 100) : 0;
    };
    const hideCheck = () => {
      cancelAnimationFrame(state.raf); state.raf = 0; state.check = null;
      const panel = $('.machine-battle-check', ui); if (panel) panel.hidden = true;
    };

    const rewardNow = () => {
      const reward = Object.assign({}, data.reward);
      const bonusMult = isTreadmill ? speedStars : (data.skillStars || 1);
      reward.ichor += state.great * (32 + bonusMult * 8);
      reward.exp += state.great * 200;
      if (state.great >= 2) {
        reward.core = (reward.core || 0) + 1;
        reward.notes = (reward.notes || 0) + 12;
        reward.tape = (reward.tape || 0) + 16;
        reward.star = (reward.star || 0) + 25;
      }
      if (state.great >= 3 && Math.random() < 0.5) {
        reward.gold = (reward.gold || 0) + 1;
      }
      return reward;
    };

    const lockReward = () => {
      const reward = rewardNow();
      Object.keys(data.reward).forEach(k => delete data.reward[k]);
      Object.assign(data.reward, reward);
    };

    const success = () => {
      if (state.settled) return;
      state.settled = true; lockReward(); cleanup();
      revealForMachineResult(); this._machineSuccess = true;
      Sound.play('get_rare', { priority: true }); FX.confetti(this.W / 2, this.H * .42, 50);
      if (state.great >= 2) {
        UI.toast(isTreadmill ? '⚡ SPEED OVERCLOCK COMPLETE! Bonus items earned.' : '✨ SUPERCHARGE COMPLETE! Bonus items earned.');
      }
      this.finish(true, isTreadmill ? 'Treadmill complete' : 'Machine complete');
    };

    const fail = () => {
      if (state.settled) return;
      state.settled = true; lockReward(); cleanup();
      this._machineReduced = true; this.meta.machinePrelude = null;
      Sound.play('machine_fail', { priority: true });
      UI.toast(isTreadmill ? '⚠ TRIPPED ON BELT · Nearby Twisteds alerted! Rewards reduced to 10%.' : '⚠ FAILED CHECK · Nearby Twisteds alerted! Rewards are reduced to 10%.');
      Music.play('battle');
      Sound.encounter(this.units.filter(u => u.team === TEAM_E));
      this._twistedAmbienceAt = 8 + rnd(0, 4);
      this.units.forEach(u => { if (u.depthHome != null) u.depth = u.depthHome; });
      this.introWalk(() => {
        const startCombat = () => { this.running = true; this.last = performance.now(); this.loop(); };
        startCombat();
      });
    };

    const resolveCheck = () => {
      if (!state.check || state.settled) return;
      const c = state.check, pos = checkPosition(performance.now());
      if (pos >= c.goldLeft && pos <= c.goldLeft + c.goldWidth) {
        state.great++;
        const boost = isTreadmill ? (6.5 + speedStars * 1.4) : (5 + c.stars * .8);
        state.progress = Math.min(100, state.progress + boost);
        Sound.play('get_rare', { vol: .46 });
        UI.toast(isTreadmill ? '⚡ SPEED SURGE! Stride locked in.' : '✨ GREAT JOB! Machine surged forward.');
      } else if (pos >= c.silverLeft && pos <= c.silverLeft + c.silverWidth) {
        Sound.play('ding', { vol: .5 });
        UI.toast(isTreadmill ? 'STEADY STRIDE!' : 'GOOD JOB!');
      } else {
        hideCheck(); fail(); return;
      }
      hideCheck();
      if (state.progress >= 100) { success(); return; }
      clearTimeout(state.checkTimer);
      state.checkTimer = setTimeout(showCheck, isTreadmill ? (1800 + Math.random() * 1600) : (2200 + Math.random() * 1800));
    };

    const animateCheck = now => {
      if (!state.check || state.settled) return;
      const cursor = $('.machine-battle-cursor', ui); if (cursor) cursor.style.left = checkPosition(now) + '%';
      if (checkPosition(now) >= 100) { resolveCheck(); return; }
      state.raf = requestAnimationFrame(animateCheck);
    };

    function showCheck() {
      if (state.settled || state.check) return;
      const stars = skillStars;
      const silverWidth = isTreadmill ? (16 + stars * 4.8) : (15 + stars * 5);
      const silverLeft = 8 + Math.random() * (84 - silverWidth);
      const goldWidth = Math.max(5, silverWidth * (.22 + stars * .026));
      const period = isTreadmill
        ? Math.max(1650, 2750 - speedStars * 130 - stars * 75)
        : Math.max(1800, 2850 - stars * 150);
      state.check = {
        stars, silverLeft, silverWidth,
        goldLeft: silverLeft + silverWidth / 2 - goldWidth / 2,
        goldWidth, started: performance.now(), period
      };
      const panel = $('.machine-battle-check', ui), silver = $('.machine-battle-silver', ui), gold = $('.machine-battle-gold', ui);
      panel.hidden = false; silver.style.left = silverLeft + '%'; silver.style.width = silverWidth + '%';
      gold.style.left = state.check.goldLeft + '%'; gold.style.width = goldWidth + '%';
      state.raf = requestAnimationFrame(animateCheck);
    }

    const checkButton = $('.machine-battle-tap', ui), track = $('.machine-battle-track', ui);
    checkButton.onclick = track.onclick = resolveCheck;
    const keyHandler = e => { if ((e.key === ' ' || e.key === 'Enter') && state.check && !e.repeat) { e.preventDefault(); resolveCheck(); } };
    state.keyHandler = keyHandler; host.addEventListener('keydown', keyHandler); host.tabIndex = 0; host.focus();
    state.tick = setInterval(() => {
      const now = performance.now(), dt = Math.min(.15, (now - (state.last || now)) / 1000); state.last = now;
      if (!state.check && Date.now() >= state.haltUntil) state.progress = Math.min(100, state.progress + dt * (data.rate || 7));
      const fill = $('.machine-battle-tank i em', ui), pct = $('.machine-battle-tank strong', ui);
      if (fill) fill.style.width = state.progress + '%'; if (pct) pct.textContent = Math.floor(state.progress);
      if (state.progress >= 100) success();
    }, 50);
    state.checkTimer = setTimeout(showCheck, isTreadmill ? (1800 + Math.random() * 1600) : (2200 + Math.random() * 1800));
  }

  stopMachinePrelude() {
    if (this._machineCleanup) this._machineCleanup();
    this._machineState = null;
  }

  /** Both sides march in from their own wall before the fight actually
      starts - allies from the left, enemies from the right, staggered so it
      reads as a team striding in together rather than a synchronized slide.
      Runs its own tiny render loop (no AI, no timers ticking, this.t stays
      at 0) so nothing scores a hit or expends a cooldown before the fight is
      officially on. */
  introWalk(onDone) {
    // A per-Hero entrance (ENTRANCE_STYLES, data/tags.js) wins when authored;
    // otherwise a per-gait default (from the same move.gait every hero already
    // writes for their normal walk animation) picks something in-character
    // instead of one generic slide for everyone. Everything here runs noticeably
    // slower than the numbers might suggest at a glance - this whole sequence
    // plays before the battle speed multiplier (1x/2x/3x) applies to anything,
    // so "1x" never speeds it up the way it does the fight itself.
    this.units.forEach(u => {
      if (u.def && u.def.noIntro) {
        // Some Heroes have a battle kit that supplies their own entrance.
        // Keep them completely absent from the shared walk-in; their first
        // authored action is responsible for revealing them.
        u.x = u.homeX; u.moving = false; u._introLanded = true;
        u._introRevealed = false; u._introTeleported = false; u._introOpacity = 0; u._introYOffset = 0;
        u._introBeat = -1; u._introPaintBeat = -1;
        u._introStyle = { dur: 0, stagger: 0, ease: t => t };
        return;
      }
      // Paint the off-stage pose before the first animation tick so the
      // entrance reads as a walk-in instead of a unit appearing in place.
      u.x = u.introFrom;
      u.moving = false; u._introLanded = false; u._introTeleported = false;
      u._introBeat = -1; u._introPaintBeat = -1;
      u._introYOffset = 0; u._introOpacity = 1;
      u._introStyle = (typeof ENTRANCE_STYLES !== 'undefined' && ENTRANCE_STYLES[u.id])
        || GAIT_ENTRANCE[(u.def && u.def.move && u.def.move.gait) || ''] || GAIT_ENTRANCE.default;
    });
    Sound.play('ui_start');
    this.render(0);
    let elapsed = 0, last = performance.now(), settled = false, introWatchdog = 0;
    const maxT = Math.max(0, ...this.units.map(u => { const st = u._introStyle || GAIT_ENTRANCE.default; return u.index * st.stagger + st.dur; }));
    const settleIntro = () => {
      if (settled) return;
      settled = true;
      if (introWatchdog) clearTimeout(introWatchdog);
      this.units.forEach(u => {
        u.x = u.homeX; u._introYOffset = 0;
        u._introOpacity = u.def && u.def.noIntro && !u._introRevealed ? 0 : 1;
        u.moving = false;
      });
      Sound.play('ui_ok'); FX.flash('#fff', .55, .16); FX.shake(7, .22); FX.punchZoom(.07, .28);
      if (this.meta.postIntroCue) Sound.play(this.meta.postIntroCue, { vol: .88, priority: true, throttle: 0 });
      setTimeout(onDone, 220);
    };
    // Keep the pre-combat walk on a timer. Some embedded previews pause
    // requestAnimationFrame while they are settling the document, which can
    // otherwise strand the battle before its simulation loop is even started.
    const scheduleIntroFrame = () => setTimeout(() => tick(performance.now()), BATTLE_FRAME_MS);
    // An entrance is presentation-only. If a hidden/throttled tab or a missed
    // animation frame prevents the walker from receiving its final callback,
    // do not leave the real combat clock parked at t=0 forever. The timer
    // path still settles first; this is only a bounded safety handoff.
    introWatchdog = setTimeout(() => settleIntro(), Math.max(2500, (maxT + 1.25) * 1000));
    const tick = (now) => {
      if (settled) return;
      const dt = Math.min((now - last) / 1000, .05);
      last = now; elapsed += dt;
      this.units.forEach(u => {
        if (u.def && u.def.noIntro) {
          u.x = u.homeX; u.moving = false; u._introOpacity = u._introRevealed ? 1 : 0; u._introYOffset = 0;
          return;
        }
        const st = u._introStyle || GAIT_ENTRANCE.default;
        const local = elapsed - u.index * st.stagger;
        if (local <= 0) { u.moving = false; return; }
        const p = clamp(local / st.dur, 0, 1);
        u.moving = p < 1 && !st.teleport;
        if (st.teleport) {
          // absent, then a flash and a hard cut to the landing spot - no lerp
          const arrived = p >= (st.appearAt || .55);
          u._introOpacity = arrived ? 1 : 0;
          if (arrived && !u._introTeleported) {
            u._introTeleported = true; u.x = u.homeX; u._introLanded = true;
            FX.ring(u.x, u.y - 20, 90, st.col || '#b9a4ff', .3); FX.flash('#fff', .18, .1);
            Sound.play('magiccircle', { vol: .5 });
          } else if (!arrived) u.x = u.introFrom;
        } else if (st.phase) {
          u.x = lerp(u.introFrom, u.homeX, st.ease(p));
          u._introOpacity = .35 + Math.abs(Math.sin(elapsed * 6)) * .5;
        } else if (st.hesitant) {
          // creeps forward, stalls, creeps again - never a smooth single lerp
          const wobble = Math.sin(elapsed * 3.2) * .5 + .5;
          const creep = clamp(p + (wobble - .5) * .12 * (1 - p), 0, 1);
          u.x = lerp(u.introFrom, u.homeX, st.ease(creep));
        } else {
          u.x = lerp(u.introFrom, u.homeX, st.ease(p));
        }
        // a little personality on top of the straight walk-in
        if (st.hop) u._introYOffset = -Math.sin(p * Math.PI) * st.hop;
        else if (st.bob) u._introYOffset = -Math.sin(elapsed * 9) * st.bob * (1 - p);
        if (st.jitter) u.x += Math.sin(elapsed * 55 + u.index) * st.jitter * (1 - p);
        // no-man's-land boundary: whatever a style's path does (jitter, hop,
        // a hesitant creep), nobody's foot crosses the middle of the stage
        // before the fight has even started.
        u.x = u.team === TEAM_P ? Math.min(u.x, this.midX - 40) : Math.max(u.x, this.midX + 40);
        if (p >= 1 && !u._introLanded && !st.teleport) {
          u._introLanded = true;
          u._introYOffset = 0; u._introOpacity = 1;
          FX.dust(u.x, u.y || this.ground, u.team === TEAM_P ? 1 : -1);
          const creatureStep = u.twisted && Sound.twisted(u, 'step', { vol: st.heavy ? .55 : .38, throttle: 170 });
          if (!creatureStep) Sound.play('step', { vol: st.heavy ? .5 : .32, rate: st.heavy ? rnd(.75, .9) : rnd(.9, 1.1), throttle: 75 });
          if (st.heavy) FX.shake(st.pounce ? 6 : 4, .12);
        } else if (st.stomp && p < 1) {
          // marching feet land on a fixed beat rather than drifting continuously
          const beat = Math.floor(local / .22);
          if (beat !== u._introBeat) { u._introBeat = beat; FX.dust(u.x, u.y, u.team === TEAM_P ? 1 : -1); }
        }
        if (st.paintTrail && p < 1) {
          const beat = Math.floor(local / .14);
          if (beat !== u._introPaintBeat) {
            u._introPaintBeat = beat;
            FX.paintMark(u.x, u.y - 5, ['#ff5fa8', '#5fd0ff', '#ffd166'], .38, true);
          }
        }
      });
      FX.update(dt);
      this.render(dt);
      if (elapsed < maxT) { scheduleIntroFrame(); return; }
      settleIntro();
    };
    scheduleIntroFrame();
  }

  addUnit(spec, team, index) {
    if (team === TEAM_E && typeof ensureEnemyTraining === 'function') {
      ensureEnemyTraining(spec, `${this.meta && (this.meta.floorLabel || this.meta.title || 'battle')}-${index}`);
    }
    const u = new Unit(spec, team, index, this);
    u.uid = this.nextId++;
    if (spec.boss) {
      u.boss = spec.boss; u.phase = 0;
      const opening = spec.boss.phases && spec.boss.phases[0];
      for (const k in ((opening && opening.mods) || {})) {
        if (k in newMods()) u.flat[k + '98'] = opening.mods[k];
      }
    }
    this.units.push(u);
    this._liveDirty = true;
    return u;
  }

  initPassives(u) {
    if (u.role === 'Tank') {
      // A tank keeps nearby opponents' attention and responds to attacks on
      // adjacent allies with a short guard shield and renewed taunt.
      this.every(u, 2.2, () => {
        this.enemiesOf(u).forEach(e => {
          if (e.alive && this.distance(u, e) <= 300) this.applyStatus(u, e, 'taunt', 2.45);
        });
      });
      u._tankGuardAt = {};
      this.on(u, 'allyDamaged', ev => {
        if (!ev || !ev.src || !ev.src.alive || !ev.unit || ev.unit === u || ev.redirected) return;
        if (this.distance(u, ev.unit) > 285) return;
        const key = ev.unit.uid;
        if (this.t < (u._tankGuardAt[key] || 0)) return;
        u._tankGuardAt[key] = this.t + 2.4;
        this.shield(u, ev.unit, u.max.hp * .035, 2.5);
        this.applyStatus(u, ev.src, 'taunt', 2.25);
      });
    }
    const sk = u.def.skills;
    SKILL_ORDER.forEach(k => {
      const s = sk[k]; if (!s) return;
      if (u.rarity < SKILL_RARITY[k]) return;
      if (s.passive) {
        try { s.passive(u, this, this.scaled(u, k), this.skillParams(u, k)); }
        catch (e) { console.warn('passive failed', u.id, k, e); }
      }
    });
  }

  /** Level-scaled `v` values for a skill and its utility parameters. */
  scaled(u, key) {
    const s = u.def.skills[key]; if (!s) return {};
    const mult = skillMult(u.skillLevel(key));
    const out = {};
    for (const k in (s.v || {})) {
      const statMult = SKILL_STAT_SCALING_KEYS.has(k) ? skillStatPowerMultiplier(s, u.st, k) : 1;
      out[k] = s.v[k] * mult * statMult;
    }
    return out;
  }

  skillParams(u, key) {
    const s = u.def.skills[key];
    return s ? skillGrowthParams(s, u.skillLevel(key)) : {};
  }

  /* ---------- dom ---------- */
  buildUnitEl(u) {
    const n = el('div', 'unit ' + (u.team === TEAM_E ? 'foe' : 'ally')
      + (u.isBoss ? ' boss' : u.isElite ? ' elite' : '')
      + (u.delilahSample ? ' delilah-sample' : '')
      + (u.id === 'Brightney' && !u.twisted ? ' brightney-unit' : ''));
    // A full 5v5 is the worst mobile case: ten desktop-width cutouts leave
    // no readable breathing room. Scale the art footprint, not the gameplay
    // arena, so hit ranges and targeting remain consistent while the stage
    // can show all combatants at once.
    const mobileArtScale = this.phoneStage ? .82 : this.compactStage ? .9 : 1;
    const w = 98 * mobileArtScale * (u.def.scale || 1) * sizeTierMult(u) * artAspectFix(u, false) * (u.isBoss ? 1.3 : u.isElite ? 1.1 : 1) * (u.minion ? (u.mScale || .6) : 1);
    const naturalAtlases = !u.minion && typeof COLLAB_SPRITES !== 'undefined' ? COLLAB_SPRITES[u.id] : null;
    const natural = !!naturalAtlases;
    const visual = natural ? `<div class="natural-sprite ${u.id.toLowerCase()}-natural" aria-hidden="true"></div>` : `<img src="${u.artSrc || Art.unit(u.id, u.twisted)}" alt="">`;
    const carriedSword = u.id === 'Soulvester' && !u.twisted && !u.minion
      ? `<img class="soulvester-carried-sword" src="${ASSET}uploads/image-31.png" alt="" aria-hidden="true">` : '';
    // Minions (decoys, Phantom copies, summons) skip the nameplate/HP-bar
    // chrome entirely - a screen with several of them next to real Heroes
    // was turning into a wall of overlapping name labels, and a minion's
    // name/HP was never the useful information there anyway.
    const build = u.team === TEAM_E && u.cls && u.subcls
      ? `<i class="buildIcon" title="${u.cls} Rank ${u.classRank} · ${u.subcls} Rank ${u.subclassRank}">${CLASSES[u.cls].icon}${SUBCLASSES[u.subcls].icon}</i>` : '';
    const enemyGear = u.team === TEAM_E ? enemyLoadoutChips(u) : '';
    // Canonical art is the readable idle silhouette. The three authored
    // battle poses are deliberately transient and only appear while their
    // owner is actually performing an action (see render()).
    const art = u.artSrc || Art.unit(u.id, u.twisted);
    const sampleHud = u.delilahSample ? `<div class="sample-id" style="bottom:${w * 1.30 + 18}px"><i>🧪</i>${u.sampleType || u.id}</div>
      <div class="hpmini sample-hp" style="bottom:${w * 1.30 + 9}px"><i style="width:100%"></i><b style="width:0%"></b></div>` : '';
    n.innerHTML = u.minion
      ? `<div class="shadow"></div>
         <div class="body" style="width:${w}px;margin-left:${-w / 2}px">
           <img src="${art}" alt="">
         </div>${sampleHud}`
      : `<div class="shadow"></div>
         <div class="body" style="width:${w}px;margin-left:${-w / 2}px">
           ${visual}${carriedSword}
         </div>
         <div class="hpmini" style="bottom:${w * 1.32 + u.plate}px"><i style="width:100%"></i><b style="width:100%"></b></div>
         ${enemyGear ? `<div class="unit-loadout" style="bottom:${w * 1.32 + u.plate + 22}px" title="${enemyLoadoutText(u)}">${enemyGear}</div>` : ''}
         <div class="nameplate${u.isBoss ? ' rankBoss' : u.isElite ? ' rankElite' : ''}" style="bottom:${w * 1.32 + u.plate + 9}px">${u.isBoss ? '<i class="rankIcon">👑</i>' : u.isElite ? '<i class="rankIcon">⭐</i>' : ''}${build}${u.name}</div>
         <div class="stats" style="bottom:${w * 1.32 + u.plate - 14}px"></div>
         ${typeof QOM_METER !== 'undefined' && QOM_METER[u.id] ? `<div class="qom-meter" style="bottom:${w * 1.32 + u.plate - 25}px"></div>` : ''}`;
    if (u.id === 'ShadowMilkCookie' && !u.minion)
      n.innerHTML += `<img class="cookie-eye" src="${ASSET}uploads/shadow_milk_effectBigeye.png" alt="" aria-hidden="true" style="bottom:${w * 1.1}px">`;
    this.el.units.appendChild(n);
    if (u.id === 'TigerLilyCookie' && !u.minion) {
      const tigerNode = el('div', 'cookie-butter-tiger' + (u.team === TEAM_E ? ' foe' : ''));
      tigerNode.innerHTML = `
        <div class="butter-tiger-shadow" aria-hidden="true"></div>
        <div class="butter-tiger-body" aria-hidden="true">
          <img src="${ASSET}uploads/buttertiger.png" alt="" aria-hidden="true">
        </div>`;
      this.el.units.appendChild(tigerNode);
      u.cookieButterTigerEl = tigerNode;
      u.cookieButterTigerBodyEl = $('.butter-tiger-body', tigerNode);
    }
    u.el = n; u.bodyEl = $('.body', n); u.imgEl = natural ? $('.natural-sprite', n) : $('img', n);
    u.swordEl = $('.soulvester-carried-sword', n);
    u.hpEl = $('.hpmini i', n); u.shEl = $('.hpmini b', n); u.stsEl = $('.stats', n);
    u.qomMeterEl = $('.qom-meter', n);
    u.cookieEyeEl = $('.cookie-eye', n);
    if (!u.cookieButterTigerEl) u.cookieButterTigerEl = $('.cookie-butter-tiger', n);
    u.bodyW = w;
    u.naturalSprite = natural;
    u.naturalAtlases = naturalAtlases;
    u.idleArtSrc = art;
    u.actionArtSrc = !u.artSrc && !u.twisted && BATTLE_HERO_ART[u.id] ? Art.battleHero(u.id) : null;
    u.actionBodyW = u.actionArtSrc ? w / artAspectFix(u, false) * artAspectFix(u, true) : w;
    u.defaultActionArtSrc = u.actionArtSrc;
    u.defaultActionBodyW = u.actionBodyW;
    u.shownArtSrc = art;
    if (natural) this.setNaturalSprite(u, 'idle', 0);
    if (u.twisted) u.imgEl.style.filter = (u.imgEl.style.filter || '') + ' saturate(1.25) contrast(1.1)';
    if (u.def.move && u.def.move.glow) u.imgEl.style.filter += ` drop-shadow(0 0 10px ${u.def.move.glow})`;
    u.baseFilter = u.imgEl.style.filter || '';
    u._filterCache = u.baseFilter;
  }

  setNaturalSprite(u, clip, actionPhase) {
    if (!u.naturalSprite) return;
    const atlas = u.naturalAtlases[clip] || u.naturalAtlases.idle;
    const changed = u.naturalClip !== clip;
    if (changed) {
      u.naturalClip = clip; u.naturalClipAt = performance.now() / 1000;
      u.naturalFrameKey = null;
      u.imgEl.style.backgroundImage = `url("${atlas.src}")`;
      const poseW = u.bodyW * (atlas.bodyScale || atlas.scale || 1);
      u.bodyEl.style.width = `${poseW}px`; u.bodyEl.style.marginLeft = `${-poseW / 2}px`;
      if (!atlas.rects) {
        if (atlas.baseW) {
          // The effects-heavy attack sheets have much wider cells than their
          // idle sheets. Keep source pixels at one scale and let the cell grow
          // around the fighter, instead of enlarging the fighter to fill it.
          const scale = poseW / atlas.baseW;
          const frameW = atlas.cellW * scale;
          u.imgEl.style.width = `${frameW}px`;
          // Some effects sheets deliberately use a very wide canvas. Anchor
          // those frames at the fighter's feet instead of centering the whole
          // blast canvas, which would slide Sora far off his ground marker.
          const anchorX = atlas.anchorX == null ? null : atlas.anchorX * scale;
          u.imgEl.style.marginLeft = anchorX == null ? `${(poseW - frameW) / 2}px` : `${-anchorX}px`;
          u.imgEl.style.marginBottom = atlas.groundY == null ? '0px' : `${-(atlas.cellH - atlas.groundY) * scale}px`;
          u.imgEl.style.transformOrigin = anchorX == null ? '50% 100%' : `${anchorX}px 100%`;
          u.imgEl.style.height = `${atlas.cellH * scale}px`;
          u.imgEl.style.backgroundSize = `${atlas.cols * atlas.cellW * scale}px ${atlas.rows * atlas.cellH * scale}px`;
        } else {
          u.imgEl.style.width = '100%';
          u.imgEl.style.marginLeft = '0px';
          u.imgEl.style.marginBottom = '0px';
          u.imgEl.style.transformOrigin = '50% 100%';
          u.imgEl.style.backgroundSize = `${atlas.cols * 100}% ${atlas.rows * 100}%`;
          u.imgEl.style.height = `${poseW * atlas.cellH / atlas.cellW}px`;
        }
      }
    }
    const elapsed = performance.now() / 1000 - (u.naturalClipAt || 0);
    const raw = atlas.once && actionPhase != null
      ? Math.floor(clamp(actionPhase, 0, .999) * atlas.frames.length)
      : Math.floor(elapsed * atlas.fps) % atlas.frames.length;
    const frame = atlas.frames[clamp(raw, 0, atlas.frames.length - 1)];
    // Combat renders at 60Hz, while these authored sheets run at 5-28fps.
    // Rewriting an unchanged background forced expensive repaints of large
    // atlas textures between every actual animation frame.
    const frameKey = clip + ':' + frame;
    if (u.naturalFrameKey === frameKey) return;
    u.naturalFrameKey = frameKey;
    if (atlas.rects) {
      const rect = atlas.rects[frame];
      if (!rect) return;
      const poseW = u.bodyW * (atlas.scale || 1);
      // Irregular atlases must retain one pixel scale across every frame.
      // Scaling each crop to `poseW` made narrow walk poses balloon while
      // wide shield-spin effects shrank the character. `baseW` is the source
      // canvas width represented by poseW; the tight frame itself is then
      // centered inside that stable canvas and bottom-aligns naturally.
      const scale = poseW / (atlas.baseW || rect.w);
      const frameW = rect.w * scale;
      u.imgEl.style.width = `${frameW}px`;
      u.imgEl.style.marginLeft = `${(poseW - frameW) / 2}px`;
      u.imgEl.style.height = `${rect.h * scale}px`;
      u.imgEl.style.backgroundSize = `${atlas.sheetW * scale}px ${atlas.sheetH * scale}px`;
      u.imgEl.style.backgroundPosition = `${-rect.x * scale}px ${-rect.y * scale}px`;
      return;
    }
    const col = frame % atlas.cols, row = Math.floor(frame / atlas.cols);
    if (atlas.baseW) {
      // Pixel offsets land on exact cell boundaries, preventing a sliver of
      // the neighbouring frame from bleeding into the current one.
      const poseW = u.bodyW * (atlas.bodyScale || atlas.scale || 1);
      const scale = poseW / atlas.baseW;
      u.imgEl.style.backgroundPosition = `${-col * atlas.cellW * scale}px ${-row * atlas.cellH * scale}px`;
      return;
    }
    const px = atlas.cols <= 1 ? 0 : col / (atlas.cols - 1) * 100;
    const py = atlas.rows <= 1 ? 0 : row / (atlas.rows - 1) * 100;
    u.imgEl.style.backgroundPosition = `${px}% ${py}%`;
  }

  /** The bottom hero portrait dock. Only the player's own team gets cards here -
      enemies stay as floating bars over their sprites, same as every reference. */
  buildBars() {
    const box = clear($('#allyDock'));
    this.units.filter(u => u.team === TEAM_P && !u.minion).forEach(u => {
      const role = String((u.def && u.def.role) || 'Damage').toLowerCase();
      const c = el('div', `unitcard role-${role}`);
      const stars = '★'.repeat(u.stars || 1);
      c.innerHTML = `
        <div class="uc-lv">${u.level}</div>
        <div class="uc-port"><img src="${Art.icon(u.id)}" alt=""></div>
        <div class="uc-stars">${stars}</div>
        <div class="uc-hpwrap"><i class="uc-hp" style="width:100%"></i></div>
        <div class="uc-enwrap" role="progressbar" aria-label="Energy" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0" title="Energy"><i class="uc-en" style="width:0"></i></div>
        <div class="uc-sts"></div>`;
      box.appendChild(c);
      u.bar = c; u.barHp = $('.uc-hp', c); u.barEn = $('.uc-en', c); u.barSts = $('.uc-sts', c);
    });
  }

  bindStatusHold(host, unit) {
    if (!host || host._statusHoldBound) return;
    host._statusHoldBound = true;
    let timer = 0, startX = 0, startY = 0, moved = false, opened = false;
    const cancel = () => {
      if (timer) clearTimeout(timer);
      timer = 0;
    };
    const chipFrom = target => target && target.closest ? target.closest('.status-chip') : null;
    host.addEventListener('pointerdown', e => {
      const chip = chipFrom(e.target);
      if (!chip || (e.pointerType === 'mouse' && e.button !== 0)) return;
      startX = e.clientX; startY = e.clientY;
      moved = false; opened = false;
      cancel();
      timer = setTimeout(() => {
        timer = 0;
        opened = true;
        this.showStatusDetails(unit, chip.dataset.statusId, e.clientX, e.clientY);
      }, 520);
    });
    host.addEventListener('pointermove', e => {
      if (timer && Math.hypot(e.clientX - startX, e.clientY - startY) > 10) { moved = true; cancel(); }
    });
    host.addEventListener('pointerup', e => {
      const chip = chipFrom(e.target);
      const tap = !!timer && !moved && !opened;
      cancel();
      if (tap && chip) this.showStatusDetails(unit, chip.dataset.statusId, e.clientX, e.clientY);
    });
    host.addEventListener('pointercancel', cancel);
    host.addEventListener('pointerleave', cancel);
    host.addEventListener('keydown', e => {
      if (e.key !== 'Enter' && e.key !== ' ') return;
      const chip = chipFrom(e.target);
      if (!chip) return;
      e.preventDefault();
      this.showStatusDetails(unit, chip.dataset.statusId, e.clientX || window.innerWidth / 2, e.clientY || window.innerHeight / 2);
    });
  }

  showStatusDetails(unit, statusId, x, y) {
    document.querySelectorAll('.battle-status-detail').forEach(n => n.remove());
    const statuses = statusId === '__all__' ? unit.statuses : unit.statuses.filter(s => s.id === statusId);
    if (!statuses.length) return;
    const detail = el('div', 'battle-status-detail');
    detail.setAttribute('role', 'dialog');
    detail.setAttribute('aria-label', statusId === '__all__' ? `${unit.name}'s status effects` : 'Status effect details');
    const rows = statuses.map(s => {
      const d = STATUS[s.id] || { icon: '·', name: s.id, kind: 'special', desc: 'No description available.' };
      const kind = d.kind === 'buff' ? 'buff' : d.kind === 'debuff' ? 'debuff' : 'special';
      const time = Number.isFinite(s.t) ? Math.max(0, s.t) : 0;
      const duration = time >= 900 ? 'Permanent' : `${Math.max(1, Math.ceil(time))}s remaining`;
      const stackText = s.stacks > 1 ? ` · ${s.stacks} stacks` : '';
      const safe = value => String(value || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
      const source = s.src && s.src !== unit && s.src.name ? ` · From ${s.src.name}` : '';
      return `<div class="battle-status-detail-row ${kind}"><span class="status-detail-icon">${d.icon || '·'}</span><div><b>${safe(d.name)}</b><small>${kind.toUpperCase()} · ${duration}${stackText}${safe(source)}</small><p>${safe(d.desc || 'No description available.')}</p></div></div>`;
    }).join('');
    detail.innerHTML = `<div class="battle-status-detail-head"><b>${statusId === '__all__' ? `${unit.name}'s effects` : 'Status effect'}</b><button type="button" class="battle-status-detail-close" aria-label="Close status details">×</button><span>Tap an icon for details</span></div>${rows}`;
    document.body.appendChild(detail);
    detail.querySelector('.battle-status-detail-close')?.addEventListener('click', () => detail.remove());
    const bounds = detail.getBoundingClientRect();
    const left = clamp((x || window.innerWidth / 2) - bounds.width / 2, 8, window.innerWidth - bounds.width - 8);
    const top = clamp((y || window.innerHeight / 2) + 14, 8, window.innerHeight - bounds.height - 8);
    detail.style.left = `${left}px`;
    detail.style.top = `${top}px`;
    const close = e => { if (!detail.contains(e.target)) detail.remove(); };
    document.addEventListener('pointerdown', close, { once: true });
    setTimeout(() => detail.remove(), 7000);
  }

  /* ---------- main loop ---------- */
  paintFrame(dt) {
    FX.update(dt);
    this._renderFrame = (this._renderFrame || 0) + 1;
    const every = this._renderEvery || 1;
    if (every === 1 || this._renderFrame % every === 0) this.render(dt * every);
  }

  loop() {
    const now = performance.now();
    let dt = Math.min((now - this.last) / 1000, .1);
    this.last = now;
    // Do not keep simulating/rendering a full battle while the browser has
    // moved the tab or app into the background. This is especially important
    // on phones, where a hidden tab can otherwise keep the CPU and compositor
    // warm for the entire time the player is away.
    if (document.hidden) {
      scheduleBattleFrame(() => this.loop());
      return;
    }
    if (this.over) {
      // exitWalk owns rendering once the survivors start crossing into the
      // next area. Letting the results grace loop render at the same time
      // would advance their walk cycles twice per frame.
      if (this._exitWalking) return;
      // `running` already flipped false the instant combat ended, so
      // without this the loop just stopped scheduling itself cold - and
      // whatever was mid-flight right then (a death explosion, the killing
      // blow's hit spark, a whiff puff) froze on screen, unanimated and
      // unremoved, for the entire results sequence. Keep pumping FX/render
      // a little longer so anything already playing gets to finish and
      // clean itself up like normal, then actually stop.
      this._fxGrace = this._fxGrace == null ? 1.2 : this._fxGrace - dt;
      if (this._fxGrace <= 0) return;
      scheduleBattleFrame(() => this.loop());
      this.paintFrame(dt);
      return;
    }
    if (!this.running) return;
    scheduleBattleFrame(() => this.loop());
    if (this.paused) return;

    if (this.stopT > 0) { this.stopT -= dt; this.paintFrame(dt); return; }

    // Simulation deliberately runs a little behind the render clock at 1x.
    // This leaves room to read windups, projectiles and status flipbooks
    // without making the optional 1.5x/2x buttons feel unresponsive.
    const scaled = dt * this.speed * COMBAT_TIME_SCALE;
    this.acc += scaled;
    let steps = 0;
    // A stalled tab can otherwise spend the next frame replaying a long
    // backlog of simulation ticks, which makes an already-busy 5v5 feel like
    // it has frozen. Preserve a small amount of catch-up, then discard only
    // excess wall-clock backlog so the live fight remains responsive.
    // Dense fights should never spend an entire frame replaying a backlog;
    // dropping excess wall-clock catch-up is less harmful than turning one
    // missed frame into a visible freeze.
    const maxSteps = this.units.length >= 8 ? 5 : 8;
    while (this.acc >= TICK && steps < maxSteps) { this.step(TICK); this.acc -= TICK; steps++; }
    if (steps >= maxSteps && this.acc > TICK * 2) this.acc = TICK * 2;
    this.paintFrame(dt);
  }

  step(dt) {
    if (this.over) return;
    this.t += dt;

    // Creature beds are accents, not loops: at most one living Twisted gets a
    // short idle line every 10-15 seconds, and the ambience bus cannot stack.
    if (this.t >= (this._twistedAmbienceAt || Infinity)) {
      const voiced = this.units.filter(u => u.alive && u.twisted && TWISTED_AUDIO[u.id] && TWISTED_AUDIO[u.id].idle);
      if (voiced.length) Sound.twisted(pick(voiced), 'idle', { vol: .5 });
      this._twistedAmbienceAt = this.t + rnd(10, 15);
    }

    // scheduled callbacks
    for (let i = this.timers.length - 1; i >= 0; i--) {
      const T = this.timers[i]; T.t -= dt;
      if (T.t <= 0) { this.timers.splice(i, 1); try { T.fn(); } catch (e) { console.warn(e); } }
    }
    for (let i = this.intervals.length - 1; i >= 0; i--) {
      const I = this.intervals[i];
      if (!I) { this.intervals.splice(i, 1); continue; }
      if (I.owner && !I.owner.alive) {
        if (I.owner._vanillaPendingRevive) continue;
        this.intervals.splice(i, 1); continue;
      }
      I.t -= dt;
      if (I.t <= 0) { I.t += I.every; try { I.fn(); } catch (e) { console.warn(e); }
        if (I.times != null && --I.times <= 0) this.intervals.splice(i, 1); }
    }

    // Use a stable length just like Array#forEach: a summon created by a
    // callback joins the next simulation tick instead of being stepped twice
    // during the current pass.
    const unitCount = this.units.length;
    for (let i = 0; i < unitCount; i++) {
      const u = this.units[i];
      if (u.alive) this.stepUnit(u, dt);
    }
    for (let i = 0; i < unitCount; i++) {
      const u = this.units[i];
      if (u.dirty) {
        // Some authored passives adjust stacks directly and mark the unit
        // dirty without going through applyStatus(). This keeps the compact
        // status HUD in sync without polling it every render frame.
        u.statusVersion++;
        u.recompute();
      }
    }
    this.checkEnd();
  }

  stepUnit(u, dt) {
    // statuses
    for (let i = u.statuses.length - 1; i >= 0; i--) {
      // Expiry callbacks can cleanse or add statuses while this loop runs.
      const s = u.statuses[i];
      if (!s) continue;
      const d = STATUS[s.id];
      // A stale status should not be able to stop the whole battle loop. This
      // also makes older saves safe if a status was renamed or removed.
      if (!d) {
        u.statuses.splice(i, 1); u.statusVersion++; u.dirty = true;
        continue;
      }
      // Bad or missing durations should expire instead of becoming permanent
      // NaN timers. This is especially useful for old skill/trinket data.
      if (!Number.isFinite(s.t)) { s.t = 0; u.statusVersion++; u.dirty = true; }
      if (d.tick) { try { d.tick(u, s, dt, this); } catch (e) { console.warn(e); } }
      if (!u.statuses.includes(s)) continue;
      if (s.t < 900 && !s.apexLocked) {
        s.t -= dt;
        const displayTime = Math.max(1, Math.ceil(s.t));
        if (s._displayTime !== displayTime) { s._displayTime = displayTime; u.statusVersion++; }
        if (s.t <= 0) {
          const at=u.statuses.indexOf(s);
          if(at<0)continue;
          u.statuses.splice(at, 1); u.statusVersion++; u.dirty = true;
          if (d.flags && d.flags.untargetable) this._targetableVersion++;
          if (d.onExpire) { try { d.onExpire(u, s, this); } catch (e) { console.warn(e); } }
          this.emitAll('statusExpired', { unit: u, id: s.id, src: s.src });
        }
      }
    }
    // shields
    for (let i = u.shields.length - 1; i >= 0; i--) {
      const sh = u.shields[i]; sh.t -= dt;
      if (sh.t <= 0 || sh.amt <= 0) { u.shields.splice(i, 1); if (sh.amt <= 0) this.onShieldPopped(u, sh); }
    }
    if (!u.shields.length && u.hasStatus('shield')) this.removeStatus(u, 'shield');

    // boss phases
    if (u.boss) this.stepBoss(u);

    // energy
    if (!u.flags.noAct && !u.noEnergy) {
      u.energy = Math.min(u.energyMax, u.energy + 3.2 * dt * u.st.energyGen);
    }

    // cooldowns
    for (const k in u.cds) if (u.cds[k] > 0) u.cds[k] -= dt * (1 + u.st.cdr);

    // dash / forced movement overrides everything
    if (u.dashUntil > this.t) {
      const p = 1 - (u.dashUntil - this.t) / u.dashDur;
      u.x = lerp(u.dashFrom, u.dashTo, ease.out(clamp(p, 0, 1)));
      u.depth = lerp(u.dashFromDepth, u.dashToDepth, ease.out(clamp(p, 0, 1)));
      u.moving = true;
      if (u.dashOpt && u.dashOpt.onMove) u.dashOpt.onMove();
      if (u.dashOpt && u.dashOpt.arc) u.yOff = -Math.sin(p * Math.PI) * 120;
      return;
    } else if (u.dashTo != null) {
      u.x = u.dashTo;
      if (u.dashToDepth != null) u.depth = u.dashToDepth;
      // Clear the completed dash before firing its callback. A callback may
      // immediately begin another dash (Pebble circles, then tackles again);
      // clearing after the callback used to erase that new dash's own onEnd.
      const completedDash = u.dashOpt;
      u.dashTo = null; u.yOff = 0; u.dashOpt = null;
      u.movingY = false; u.vx = 0; u.vy = 0;
      if (completedDash && completedDash.onEnd) completedDash.onEnd();
    }

    if (u.flags.noAct && u.flags.noMove) { u.moving = false; return; }

    // AI
    AI.think(u, this, dt);
    if (u.movingY) u.moving = true;   // walk cycle also plays for foreground/background travel
    this.separate(u, dt);
  }

  /* Focus fire makes everyone walk to the same spot, which turns a fight into an
     unreadable pile. A soft push keeps allies legible without breaking targeting. */
  separate(u, dt) {
    if (u.dashUntil > this.t || u.immovable) return;
    const unitRadius = this.hitRadius(u);
    const MIN = Math.max(44, unitRadius + 30);
    let pushX = 0, pushY = 0;
    const friends = this.liveTeam(u.team);
    for (let i = 0; i < friends.length; i++) {
      const o = friends[i];
      if (o === u || !o.alive || o.team !== u.team) continue;
      let dx = u.x - o.x, dy = (u.depth - o.depth) * this.depthSpan;
      let d = Math.hypot(dx, dy);
      const pairMin = Math.max(MIN, unitRadius + this.hitRadius(o));
      if (d >= pairMin) continue;
      if (d < .01) {
        const a = ((u.index * 97 + o.index * 37) % 360) * Math.PI / 180;
        dx = Math.cos(a); dy = Math.sin(a); d = 1;
      }
      const force = pairMin - d;
      pushX += dx / d * force; pushY += dy / d * force;
    }
    if (pushX || pushY) {
      u.x = clamp(u.x + clamp(pushX, -50, 50) * dt * 3.2, this.leftWall, this.rightWall);
      u.depth = clamp(u.depth + clamp(pushY, -50, 50) * dt * 3.2 / this.depthSpan, .04, .92);
    }
  }

  stepBoss(u) {
    const ph = u.boss.phases;
    while (u.phase < ph.length - 1 && u.hpPct <= ph[u.phase + 1].at) {
      u.phase++;
      const p = ph[u.phase];
      this.log('<b>' + u.name + ': ' + p.name + '</b>');
      for (const k in (p.mods || {})) {
        if (k === 'hpRegen') this.applyStatus(u, u, 'regen', 999, { val: u.max.hp * p.mods[k] });
        else if (k in newMods()) u.flat[k + '98'] = p.mods[k];
      }
      u.dirty = true;
      if (!this.offscreen) { FX.flash('#ff2b6b', .5, .4); FX.shake(18, .7); }
      Sound.play('warn');
      if (p.onEnter) { try { p.onEnter(u, this); } catch (e) { console.warn(e); } }
      if (u.lethalBoss) this.after(.5, () => { if (u.alive) this.lethalAction(u); });
    }
  }

  /** Lethals have an encounter-only move in addition to their normal Hero
      kit. It is intentionally outside HEROES[] so recruiting Dandy/Dyle does
      not grant a player the boss version of the move. */
  initLethalBoss(u) {
    this.applyStatus(u, u, 'fortify', 999, { stacks: 3 });
    // Dandy's Ward is an opening advantage, not permanent immunity. A
    // permanent 30% reduction stacked with his phase and Attention rules made
    // long Twisted fights stall forever; Dyle keeps the full Lethal Ward.
    this.applyStatus(u, u, 'ward', u.id === 'Dandy' ? 32 : 999);
    this.every(u, 6.2, () => this.lethalAction(u));
  }

  lethalAction(u) {
    if (!u || !u.alive || u.casting || u.pendingHit) return;
    const foes = this.enemiesOf(u); if (!foes.length) return;
    const phaseMult = 1 + (u.phase || 0) * .22;
    if (u.id === 'Dyle') {
      const dir = u.face || -1;
      this.anim(u, 'wind', .7); Sound.play('warn'); Sound.play('steam', { delay: 160, vol: .7 });
      this.after(.48, () => {
        if (!u.alive) return;
        this.fxTrainPass(u, dir, 1.05); this.shake(14, .45);
        const span = this.rightWall - this.leftWall;
        foes.forEach(e => {
          const p = clamp((e.x - this.leftWall) / span, 0, 1);
          this.after(.05 + (dir > 0 ? p : 1 - p) * .48, () => {
            if (!e.alive) return;
            Sound.play('hit_heavy', { vol: .7, throttle: 20 });
            this.fxStatusOn(e, 'ShockEffect', { sizeMul: 1.1 });
            this.damage(u, e, u.st.atk * .92 * phaseMult, { type: 'physical', tag: 'Terminal Express' });
            this.applyStatus(u, e, 'delayed', 5, { stacks: 2 }); this.knockback(u, e, 135);
          });
        });
      });
      return;
    }

    // Dandy's shop floor becomes a collection field: every Toon pays a
    // little at once, then carries the debuff into the next regular cast.
    this.anim(u, 'wind', .7); Sound.play('warn');
    this.after(.5, () => {
      if (!u.alive) return;
      Sound.play('ult', { vol: .7 }); this.flash('#ffd166', .38, .36); this.shake(12, .4);
      foes.forEach(e => {
        this.fxStatusOn(e, 'CurseEffect', { sizeMul: 1.08 });
        this.damage(u, e, (u.st.mag * .82 + u.st.atk * .24) * phaseMult, { type: 'magic', tag: 'Debt Collection' });
        this.applyStatus(u, e, 'drain', 5); this.applyStatus(u, e, 'weaken', 5, { stacks: 2 });
      });
    });
  }

  /* ============================================================ COMBAT API */

  /** A single targetability check for AI, focus caches, taunts, and summons.
      Read the status list as well as cached flags so a new untargetable effect
      is respected during the same simulation tick it was applied. */
  isTargetable(u) {
    return !!(u && u.alive && !(u.flags && u.flags.untargetable)
      && !u.hasStatus('untargetable') && !u.hasStatus('stealth'));
  }

  liveTeam(team) {
    if (this._liveDirty) {
      this._liveTeams[TEAM_P].length = 0;
      this._liveTeams[TEAM_E].length = 0;
      this._combatTeams[TEAM_P].length = 0;
      this._combatTeams[TEAM_E].length = 0;
      this.units.forEach(u => {
        if (u.alive) {
          this._liveTeams[u.team].push(u);
          if (!u.minion) this._combatTeams[u.team].push(u);
        }
      });
      this._liveDirty = false;
      this._targetableDirty = true;
      this._targetableSafeVersion = -1;
    }
    return this._liveTeams[team] || [];
  }
  all() { return this.liveTeam(TEAM_P).concat(this.liveTeam(TEAM_E)); }
  playerTeam() { this.liveTeam(TEAM_P); return this._combatTeams[TEAM_P]; }
  foeTeam() { this.liveTeam(TEAM_E); return this._combatTeams[TEAM_E]; }
  alliesOf(u) { this.liveTeam(u.team); return this._combatTeams[u.team]; }
  targetableTeam(team) {
    this.liveTeam(team);
    if (this._targetableDirty) {
      this._targetableTeams[TEAM_P] = this._liveTeams[TEAM_P].filter(u => this.isTargetable(u));
      this._targetableTeams[TEAM_E] = this._liveTeams[TEAM_E].filter(u => this.isTargetable(u));
      this._targetableDirty = false;
      this._targetableSafeVersion = -1;
    }
    // Status flags are recomputed at the end of the simulation tick. Filter
    // once more here so a newly applied Ethereal/Hidden effect cannot remain in
    // the cached target list for the rest of that tick.
    if (this._targetableSafeVersion !== this._targetableVersion) {
      this._targetableSafeTeams[TEAM_P] = (this._targetableTeams[TEAM_P] || []).filter(u => this.isTargetable(u));
      this._targetableSafeTeams[TEAM_E] = (this._targetableTeams[TEAM_E] || []).filter(u => this.isTargetable(u));
      this._targetableSafeVersion = this._targetableVersion;
    }
    return this._targetableSafeTeams[team] || [];
  }
  enemiesOf(u) { return this.targetableTeam(u.team === TEAM_P ? TEAM_E : TEAM_P); }
  minionsOf(u) { return this.liveTeam(u.team).filter(a => a.owner === u && !a.trinketSample); }

  lowestHp(l) { return l.length ? l.reduce((a, b) => b.hpPct < a.hpPct ? b : a) : null; }
  lowestEnergy(l) { return l && l.length ? l.reduce((a, b) => (b.energy || 0) < (a.energy || 0) ? b : a) : null; }
  highestHp(l) { return l.length ? l.reduce((a, b) => b.hpPct > a.hpPct ? b : a) : null; }
  highestEnergy(l) { return l.length ? l.reduce((a, b) => b.energy > a.energy ? b : a) : null; }
  highestStat(l, k) { return l.length ? l.reduce((a, b) => b.st[k] > a.st[k] ? b : a) : null; }
  topN(l, k, n) { return l.slice().sort((a, b) => b.st[k] - a.st[k]).slice(0, n); }
  depthDelta(a, b) { return ((b && b.depth) || 0) * this.depthSpan - ((a && a.depth) || 0) * this.depthSpan; }
  /* Stable body radius for gameplay. Action art can have a wider transparent
     canvas, so this stays tied to the idle silhouette instead of changing
     during an animation swap. */
  hitRadius(u) {
    if (!u) return 0;
    const width = Number(u.bodyW) || 98;
    const scale = u.minion ? .72 : 1;
    const key = width + ':' + (u.minion ? 1 : 0);
    if (u._hitRadiusKey === key && u._hitRadiusValue != null) return u._hitRadiusValue;
    const radius = clamp(width * .34 * scale, u.minion ? 16 : 24, u.minion ? 34 : 58);
    u._hitRadiusKey = key;
    u._hitRadiusValue = radius;
    return radius;
  }
  attackReach(a, b) {
    return Math.max(1, (a && a.st && a.st.range) || 0) + this.hitRadius(a) + this.hitRadius(b);
  }
  distance(a, b) {
    return (!a || !b || !Number.isFinite(a.x) || !Number.isFinite(b.x))
      ? Infinity : Math.hypot(b.x - a.x, this.depthDelta(a, b));
  }
  nearest(u, l) { return l.length ? l.reduce((a, b) => this.distance(u, b) < this.distance(u, a) ? b : a) : null; }
  nearestN(u, l, n) { return l.slice().sort((a, b) => this.distance(u, a) - this.distance(u, b)).slice(0, n); }
  farthestN(u, l, n) { return l.slice().sort((a, b) => this.distance(u, b) - this.distance(u, a)).slice(0, n); }
  avgX(l) { return l.length ? sum(l.map(x => x.x)) / l.length : this.W / 2; }
  centerX() { return this.W / 2; }

  /** The team's agreed kill target, refreshed twice a second.
      Without this, five heroes spread damage across five enemies and healers
      out-sustain everything. Focus fire is what makes an auto battler resolve. */
  focusOf(team) {
    this._focus = this._focus || {};
    const cache = this._focus[team];
    if (cache && cache.t > this.t - .5 && this.isTargetable(cache.u)) return cache.u;
    const foes = this.targetableTeam(team === TEAM_P ? TEAM_E : TEAM_P);
    if (!foes.length) { this._focus[team] = null; return null; }
    const teamUnits = this.liveTeam(team);
    const anchor = this.avgX(teamUnits);
    const teamDepth = teamUnits.length ? sum(teamUnits.map(a => a.depth || 0)) / teamUnits.length : .5;
    let best = null, bestScore = -Infinity;
    foes.forEach(f => {
      // effective HP is the honest measure of "closest to dying"
      const ehp = (f.hp + f.shieldTotal) * (1 + f.st.def / 2200);
      let s = -ehp / 90;
      s -= Math.hypot(f.x - anchor, ((f.depth || 0) - teamDepth) * this.depthSpan) * .05;
      s += f.minion ? -40 : 0;
      if (f.role === 'Support') s += 55;          // cut the healing first
      if (f.role === 'Tank') s += 95;             // frontliners hold the line
      if (f.hasStatus('marked')) s += 140;
      if (f.hasStatus('headline')) s += 110;
      if (f.hasStatus('exposed') || f.hasStatus('messy')) s += 50;
      s += (f.st.aggro - 1) * (f.role === 'Tank' ? 55 : 30);
      if (s > bestScore) { bestScore = s; best = f; }
    });
    this._focus[team] = { u: best, t: this.t };
    return best;
  }

  /** Target selection honouring taunt, marks, aggro and role behaviour. */
  bestTarget(u) {
    const foes = this.enemiesOf(u);
    if (!foes.length) return null;
    if (u.def.cookiePrey) { const prey = foes.filter(t => t.role === u.def.cookiePrey && this.isTargetable(t)); if (prey.length) return this.nearest(u, prey); }
    // Dandy does not need a conventional taunt. An enemy that repeatedly
    // ignores him becomes his active, highest-priority grievance.
    if (u.id === 'Dandy') {
      const maxNeglect = foes.filter(f => {
        const s = f.statuses.find(x => x.id === 'neglect' && x.src === u);
        return s && s.stacks >= (u.dandyMax || 5);
      });
      if (maxNeglect.length) return this.lowestHp(maxNeglect) || maxNeglect[0];
    }
    // Delilah's released samples never wander off a documented specimen. This
    // is deliberately before generic focus-fire: their target priority is part
    // of the controller kit, not a global aggro override.
    if (u.delilahSample) {
      if (u.forcedTarget && u.forcedTarget.alive && foes.includes(u.forcedTarget)) return u.forcedTarget;
      const contaminated = foes.filter(f => f.hasStatus('contamination'));
      if (contaminated.length) return this.nearest(u, contaminated) || contaminated[0];
    }
    // Glisten's Audience is a personal focus lock: his own skills and Basic
    // Attacks keep returning to the marked priority target until it falls.
    if (u.id === 'Glisten' && u.glistenAudience && u.glistenAudience.alive
      && foes.includes(u.glistenAudience) && this.isTargetable(u.glistenAudience)) return u.glistenAudience;
    // Eclipse's low-health Focus is personal: it should override team focus
    // for her ordinary attacks until that prey is defeated.
    if (u.id === 'Eclipse' && u.eclipseFocusTarget && u.eclipseFocusTarget.alive
      && foes.includes(u.eclipseFocusTarget) && this.isTargetable(u.eclipseFocusTarget)) return u.eclipseFocusTarget;
    // A taunt from a unit that just entered a dash, bubble, stealth, or other
    // untargetable state must stop controlling aggro immediately. Otherwise
    // the attacker keeps walking at an invisible target until the status ends.
    const taunts = u.statuses
      .filter(s => s.id === 'taunt' && s.src && s.src.team !== u.team && foes.includes(s.src) && this.isTargetable(s.src))
      .sort((a, b) => (b.t || 0) - (a.t || 0));
    if (taunts.length) return taunts[0].src;
    if (u.flags.charmed) { const al = this.alliesOf(u).filter(a => a !== u); if (al.length) return pick(al); }
    if (u.forcedTarget && u.forcedTarget.alive && foes.includes(u.forcedTarget)) return u.forcedTarget;
    if (u.id === 'TigerLilyCookie') {
      const prey = foes.find(f => this.isTargetable(f) && f.statuses.some(s => s.id === 'cookie_tiger_prey' && s.src === u));
      if (prey) return prey;
    }

    // Threat specialists are meant to override ordinary focus-fire. Shrimpo's
    // Aggro Magnet raises him well above the normal range; without this guard
    // the global support/tank priorities could still send enemies elsewhere.
    const threat = foes.filter(f => f.st.aggro >= 3.5);
    if (threat.length) {
      const maxThreat = Math.max(...threat.map(f => f.st.aggro));
      return this.nearest(u, threat.filter(f => f.st.aggro >= maxThreat - .35)) || threat[0];
    }

    // Tanks hold the line and hit whatever is in front of them; everyone else
    // converges on the team focus unless it is unreachably far.
    if (u.role !== 'Tank') {
      const f = this.focusOf(u.team);
      if (f && foes.includes(f)) {
        const near = this.nearest(u, foes);
        // a target more than a full screen away is not worth abandoning position for
        if (this.distance(f, u) < 620 || !near) return f;
        return chance(.7) ? f : near;
      }
    }
    let best = null, bestScore = -Infinity;
    foes.forEach(f => {
      let s = f.st.aggro * 100;
      s -= this.distance(f, u) * .22;
      s += (1 - f.hpPct) * 70;
      if (f.hasStatus('marked')) s += 120;
      if (f.hasStatus('headline')) s += 90;
      if (s > bestScore) { bestScore = s; best = f; }
    });
    return best;
  }

  /** Floating combat text, but stacked: every number aimed at the same unit
      within a short window cascades upward into a clean vertical list
      instead of landing on the exact same spot and turning into an
      unreadable pile the moment several hits land at once (a multi-hit
      combo, an AoE, several attackers). Capped so a long combo doesn't
      launch numbers off the top of the screen. */
  floatNum(tgt, dy, txt, kind, crit, superCrit) {
    // this.t is legitimately 0 in the opening instant of a battle, so the
    // "first time" check has to be null-specific - a falsy-check here would
    // reset the stack on every single call at t=0 and never actually stack.
    if (tgt._fxStackT == null || this.t - tgt._fxStackT > .45) tgt._fxStackN = 0;
    tgt._fxStackT = this.t;
    const n = Math.min(tgt._fxStackN++, 6);
    FX.number(tgt.x + rnd(-8, 8), tgt.y + dy - n * 24, txt, kind, crit, superCrit);
  }

  /* ---------- damage ---------- */
  damage(src, tgt, amount, opt) {
    opt = opt || {};
    if (src && src.def && src.def.noDamage) return null;
    if (!tgt || !tgt.alive || this.over) return null;
    if (tgt.invuln > this.t && !opt.selfharm) {
      this.floatNum(tgt, -90, 'IMMUNE', 'block'); Sound.play('block', { vol: .3, throttle: 55 }); return null;
    }
    if (opt.basic && !opt.melee && tgt.rangedImmune) {
      this.floatNum(tgt, -90, 'IMMUNE', 'block'); Sound.play('block', { vol: .3, throttle: 55 }); return null;
    }
    const ev = {
      src, target: tgt, amount, type: opt.type || 'physical', crit: false, superCrit: false,
      dot: !!opt.dot, melee: !!opt.melee, basic: !!opt.basic, area: !!opt.area, tag: opt.tag, forceCrit: opt.forceCrit,
      armorPen: opt.armorPen || 0, chained: opt.chained, reflected: opt.reflected,
      redirected: opt.redirected, selfharm: opt.selfharm, noDodge: opt.noDodge, silent: opt.silent
    };

    const applyCrit = () => {
      ev.crit = true;
      ev.superCrit = chance(CRIT_RULES.superChance);
      ev.amount *= ev.superCrit ? CRIT_RULES.superMultiplier : CRIT_RULES.normalMultiplier;
    };

    if (src && src !== tgt && !ev.dot && !ev.selfharm) {
      // accuracy vs evasion
      if (!ev.noDodge && src.antiDodge && src.antiDodge(tgt, ev)) ev.noDodge = true;
        if (!ev.noDodge && !opt.pierceAll) {
        if (tgt.dodgeGuard && tgt.dodgeGuard(ev)) {
          this.floatNum(tgt, -95, 'DODGE', 'miss');
          Sound.play('miss', { vol: .34, rate: rnd(.94, 1.08), throttle: 35 });
          this.emitFor(tgt, 'dodged', { src, forced: true }); this.emitFor(src, 'missed', { target: tgt });
          return null;
        }
        let hitP = clamp(src.st.acc / (src.st.acc + tgt.st.eva * 1.15), .35, 1);
        // Clear View is deliberately positional: it should help allies hit
        // through Tisha's cloud, not give them free accuracy everywhere.
        if (src.hasStatus && tgt.hasStatus && src.hasStatus('cleanfocus') && tgt.hasStatus('dustcloud'))
          hitP = clamp(hitP + .24, .35, 1);
        if (!chance(hitP)) {
          this.floatNum(tgt, -95, 'MISS', 'miss');
          Sound.play('miss', { vol: .34, rate: rnd(.94, 1.08), throttle: 35 });
          this.emitFor(tgt, 'dodged', { src }); this.emitFor(src, 'missed', { target: tgt });
          return null;
        }
      }
      // crit
      const critC = ev.forceCrit ? 1 : clamp(src.st.crit + (Number(opt.critBonus) || 0) + (tgt.hasStatus('marked') ? .15 : 0), 0, 1);
      if (chance(critC)) applyCrit();
    }

    // outgoing hooks
    if (src) {
      ev.amount *= 1 + boundedDamageMod(src.st.dmgDealt, false);
      // Attention is personal: only the Dandy who earned the stack gains the
      // mitigation. This applies before defense so it matters to true damage too.
      if (tgt.id === 'Dandy') {
        const attention = src.statuses.find(s => s.id === 'attention' && s.src === tgt);
        if (attention) ev.amount *= 1 - Math.min(.52, attention.stacks * .085);
      }
      if (src.id === 'Dandy') {
        const neglect = tgt.statuses.find(s => s.id === 'neglect' && s.src === src);
        if (neglect) ev.amount *= 1 + neglect.stacks * .075;
      }
      if (src.delilahSample && tgt.hasStatus('contamination')) ev.amount *= 1.32;
      src.statuses.forEach(s => { const d = STATUS[s.id]; if (d.onDealDamage) d.onDealDamage(src, s, ev, this); });
      this.emitFor(src, 'dealDamage', ev);
      if (src.team !== tgt.team) this.emitTeam(src.team, 'allyDamageDealt', ev);
    }
    if (ev.forceCrit && !ev.crit) applyCrit();

    // Research is a skill-specific weakness. Basic attacks still provide the
    // steady damage floor, but Shelly's analysis only magnifies abilities and
    // lets them cut through a fully studied enemy's defenses.
    let researchBonus = 0;
    if (src && src.team !== tgt.team && !ev.basic) {
      const research = tgt.getStatus && tgt.getStatus('research');
      if (research) researchBonus += .018 * research.stacks;
      if (tgt.hasStatus && tgt.hasStatus('fullyresearched')) {
        researchBonus += .12;
        ev.armorPen += .08;
      }
    }
    if (researchBonus) ev.amount *= 1 + researchBonus;

    // mitigation
    if (ev.type !== 'true' && !opt.pierceAll) {
      const pen = clamp((src ? (ev.type === 'magic' ? src.st.magPen : src.st.armorPen) : 0) + ev.armorPen, 0, DAMAGE_RULES.penetrationCap);
      const defv = (ev.type === 'magic' ? tgt.st.mdef : tgt.st.def) * (1 - pen);
      const k = defenseAnchor(src ? src.level : tgt.level, tgt.level);
      ev.amount *= k / (k + defv);
    }
    ev.amount *= 1 + boundedDamageMod(tgt.st.dmgTaken, true);
    if (ev.amount < 0) ev.amount = 0;

    // incoming hooks (freeze bonus, reflect, crumble...)
    tgt.statuses.slice().forEach(s => { const d = STATUS[s.id]; if (d && d.onDamaged) d.onDamaged(tgt, s, ev, this); });
    this.emitFor(tgt, 'damaged', ev);
    if (!ev.redirected) this.emitTeam(tgt.team, 'allyDamaged', Object.assign(ev, { unit: tgt }));
    // A Failed Variable hurt a prior sample. Its next assigned sample keeps
    // the clinical record and resists that enemy specifically.
    if (tgt.delilahSample && tgt.failedVariable === src) ev.amount *= .55;

    let dmg = Math.max(0, Math.round(ev.amount));
    ev.amount = dmg;

    // shields absorb first
    if (!opt.pierceAll && !opt.bypassShield) {
      for (let i = tgt.shields.length - 1; i >= 0 && dmg > 0; i--) {
        const sh = tgt.shields[i];
        if (!sh || sh.amt <= 0) continue;
        if (!ev.redirected && sh.redirect && sh.redirect.to && sh.redirect.to !== tgt && sh.redirect.to.alive) {
          const moved = dmg * sh.redirect.pct; dmg -= moved;
          this.damage(src, sh.redirect.to, moved, { type: 'true', redirected: true, tag: 'shieldlink' });
        }
        const used = Math.min(sh.amt, dmg);
        sh.amt -= used; dmg -= used;
        if (sh.amt <= 0) { tgt.shields.splice(i, 1); this.onShieldPopped(tgt, sh); Sound.play('icebreak', { vol: .4 }); Sound.play('shatter', { vol: .28, throttle: 60 }); }
      }
      if (!tgt.shields.length) this.removeStatus(tgt, 'shield');
    }

    tgt.hp -= dmg;
    tgt.dmgTaken += dmg;
    if (src) { src.dmgDone += ev.amount; }
    if (src && src.team === TEAM_P && !ev.dot && dmg > 0) {
      this.stat.hits++;
      if (ev.crit) this.stat.crits++;
      if (ev.superCrit) this.stat.superCrits++;
    }
    tgt.hitT = .10;
    const lethalHit = tgt.hp <= 0;

    // energy from being hit
    if (!ev.dot && dmg > 0 && !tgt.noEnergy) tgt.energy = Math.min(tgt.energyMax, tgt.energy + clamp(dmg / tgt.max.hp * 90, .5, 12) * tgt.st.energyGen);
    if (src && src !== tgt && !ev.dot && !src.noEnergy) src.energy = Math.min(src.energyMax, src.energy + 2 * src.st.energyGen);

    // numbers
    if (!ev.silent && dmg > 0) {
      const kind = ev.superCrit ? 'supercrit' : ev.crit ? 'crit' : ev.dot ? 'dot' : ev.type === 'true' ? 'true' : 'dmg';
      this.floatNum(tgt, -100, fmt(dmg), kind, ev.crit, ev.superCrit);
      if (ev.crit) {
        FX.punchZoom(ev.superCrit ? .06 : .035, ev.superCrit ? .24 : .18);
        Sound.play('crit', { vol: ev.superCrit ? .68 : .5, rate: ev.superCrit ? .84 : 1 });
      }
      // every solid hit gets a real impact punch, not just the ones where the
      // calling skill separately drew a slash/boom - this is what makes plain
      // basic attacks feel like they land instead of just ticking a number down
      // A lethal hit immediately receives the stronger knockout burst below;
      // stacking the universal spark on top multiplied DOM work during wipes.
      if (!lethalHit && !ev.dot && !ev.chained) {
        const eCol = ev.superCrit ? '#ff714d' : ev.crit ? '#ffd166' : ev.type === 'magic' ? '#c9a8ff' : ev.type === 'true' ? '#ff9ad6' : '#fff';
        FX.hitSpark(tgt.x + rnd(-6, 6), tgt.y - 62, eCol, { big: ev.crit });
        FX.shake(ev.superCrit ? 8 : ev.crit ? 6 : 2, ev.superCrit ? .14 : .1);
      }
    }
    if (ev.crit && !ev.dot) FX.hitstop(ev.superCrit ? 92 : 60);
    if (src && src !== tgt && src.id !== 'GingerBrave' && !ev.basic && !ev.dot && !ev.silent && dmg > 0) {
      const strongHit = ev.superCrit || dmg >= tgt.max.hp * .16;
      Sound.play(strongHit ? 'skill_hit_strong' : 'skill_hit_normal', { vol: strongHit ? .34 : .28 });
    }

    // low-hp signal for guardian passives
    if (tgt.hpPct < .40) this.emitTeam(tgt.team, 'allyLow', tgt);

    if (tgt.hp <= 0) this.tryKill(tgt, src, dmg);
    return ev;
  }

  tryKill(u, src, amount) {
    const ev = { unit: u, src, amount: amount || 0, prevented: false };
    this.emitFor(u, 'lethal', ev);
    if (!ev.prevented) this.emitTeam(u.team, 'allyLethal', ev);
    if (ev.prevented) { u.hp = Math.max(u.hp, 1); return; }
    this.kill(u, src);
  }

  kill(u, src) {
    if (!u.alive) return;
    u._lastHitBy = src || null;
    u.alive = false; u.hp = 0;
    // Invalidate an in-progress activation before death hooks run. This keeps
    // a revive or delayed callback from inheriting a dead unit's windup.
    u._castId = (u._castId || 0) + 1;
    u.casting = null; u.pendingHit = null; u.moving = false; u.movingY = false;
    u.animState = 'idle'; u.animT = 0; u.animDur = 0; u.animStyle = null;
    if (u.poppyBubbleEl) this.poppyBubblePop(u, true);
    this._liveDirty = true;
    if (src) { src.kills++; if (src.team !== u.team) this.emitFor(src, 'defeatedEnemy', u); }
    if (!this.offscreen) {
      const newDeathBatch = this._deathFxT == null || Math.abs(this.t - this._deathFxT) > TICK * 1.5;
      if (newDeathBatch) {
        this._deathFxT = this.t; this._deathFxN = 0;
      }
      const deathFxIndex = this._deathFxN++;
      const deathParts = deathFxIndex === 0 ? 14 : deathFxIndex === 1 ? 8 : 4;
      const isCollab = typeof COLLAB_AUDIO !== 'undefined' && !!COLLAB_AUDIO[u.id];
      const isUnknownWorld = !!u.unknownWorld;
      const isCookie = !!u.def.cookieRun;
      const fxX = u.x, fxY = u.y - 50, fxGroundY = u.y;
      // Combat resolution must finish in one tick, but cosmetic DOM/audio work
      // does not. Stagger simultaneous knockouts by roughly one frame so a wipe
      // never constructs every particle and starts every voice before painting.
      setTimeout(() => {
        if (deathFxIndex === 0) FX.trimParts(this.W <= 430 ? 40 : 90);
        if (isCookie) {
          Sound.play('down', { vol: .45 });
        } else if (isUnknownWorld) {
          Sound.play('unknown_world_explode', { vol: .9, rate: rnd(.82, 1.05), throttle: 0,
            tag: ':unknown-world:' + u.id + ':' + deathFxIndex, priority: true });
          const bossBurst = !!u.isBoss;
          FX.robotBurst(fxX, fxY, fxGroundY, { amount: (deathParts + 12) * (bossBurst ? 2 : 1), boss: bossBurst });
          this.hitstop(bossBurst ? 135 : 82);
          FX.punchZoom(bossBurst ? .12 : .055, bossBurst ? .38 : .24);
        } else if (isCollab) {
          const voiced = Sound.collab(u, 'down', { vol: .68, priority: u.isBoss });
          if (!voiced) Sound.play('down', { vol: .55 });
          FX.burst(fxX, fxY, deathParts, u.team === TEAM_P ? '#8fb4ff' : '#ff6b6b', { lift: 130, spMax: 320 });
        } else {
          Sound.play('toon_death', { vol: u.minion ? .48 : .82, rate: rnd(.94, 1.05),
            throttle: 0, tag: ':' + u.id + ':' + deathFxIndex, priority: u.isBoss || deathFxIndex < 2 });
          FX.ichorBurst(fxX, fxY, fxGroundY, { amount: deathParts });
        }
        if (deathFxIndex === 0) FX.shake(6, .25);
      }, deathFxIndex * 28);
      if (isCookie && u.dialogueEl) { u.dialogueEl.remove(); u.dialogueEl = null; }
      if (u.cookieButterTigerEl) {
        const tigerNode = u.cookieButterTigerEl;
        tigerNode.style.transition = 'opacity .35s ease-out';
        tigerNode.style.opacity = '0';
        setTimeout(() => { if (tigerNode.parentNode) tigerNode.remove(); }, 380);
        u.cookieButterTigerEl = null;
        u.cookieButterTigerBodyEl = null;
      }
      u.el.classList.add('dead');
      u.el.style.transition = isCookie ? (Accessibility.enabled() ? 'opacity .25s' : 'transform .9s ease-in, opacity .2s .7s') : isUnknownWorld ? 'opacity .08s, transform .16s cubic-bezier(.1,1.5,.2,1)' : isCollab ? 'opacity .42s, transform .42s' : 'opacity .14s .04s, transform .2s cubic-bezier(.3,0,.8,.2)';
      u.el.style.opacity = 0;
      if (isCookie) {
        if (!Accessibility.enabled()) u.el.style.transform += ' translate(' + (u.face * 450) + 'px,-850px) rotate(' + (u.face * 900) + 'deg)';
        setTimeout(() => { if (!u.alive && u.el) u.el.style.display = 'none'; }, 950);
      } else if (isUnknownWorld) {
        u.el.style.transform += ' scale(.08) rotate(' + (u.face * 28) + 'deg)';
        setTimeout(() => { if (!u.alive && u.el) { u.el.style.display = 'none'; if (u.imgEl) u.imgEl.removeAttribute('src'); } }, 155);
      } else if (!isCollab) {
        // The ink burst replaces the body rather than leaving a knocked-out
        // sprite on the floor. Release its image shortly after the splat lands.
        u.el.style.transform += ' scale(.22) rotate(' + (u.face * 18) + 'deg)';
        setTimeout(() => {
          if (!u.alive && u.el) { u.el.style.display = 'none'; if (u.imgEl) u.imgEl.removeAttribute('src'); }
        }, 230);
      } else if (u.naturalSprite) {
        // Rotating an effects-wide atlas cell creates a huge compositing layer.
        // Fade/drop it, then release the background texture after the transition.
        u.imgEl.style.willChange = 'auto'; u.imgEl.style.filter = 'none';
        u.bodyEl.style.willChange = 'auto';
        u.el.style.transform += ' translateY(20px)';
        setTimeout(() => {
          if (!u.alive && u.imgEl) { u.imgEl.style.backgroundImage = 'none'; u.el.style.display = 'none'; }
        }, 460);
      } else {
        u.el.style.transform += ' rotate(' + (u.face * 55) + 'deg) translateY(24px)';
      }
      if (u.bar) u.bar.classList.add('gone');
    }
    this.log(u.name + ' is down.');
    this.emitFor(u, 'death', { src });
    if (u.minion) {
      if (!u.trinketSample) this.emitFor(u.owner, 'minionDown', { minion: u, src });
      if (u.onDeathFn) u.onDeathFn(u);
    }
    else {
      this.emitTeam(u.team, 'allyDown', u);
      this.emitFoe(u.team, 'enemyDown', u);
    }
    this.units.filter(m => m.owner === u && m.alive).forEach(m => { if (!m.inherit) this.kill(m); });
    if (!u._vanillaPendingRevive) {
      u.timers = []; u.intervals = [];
      this.intervals = this.intervals.filter(i => i.owner !== u);
      // All death hooks have fired. Do not make the survivor scan every fallen
      // unit's inert listeners on each later combat event.
      this.removeListenersFor(u);
    }
  }

  aoe(src, x, radius, foeTeamId, amount, opt) {
    const anchor = this.units.find(t => t.alive && Math.abs(t.x - x) < 2) || src;
    this.units.filter(t => t.alive && t.team !== src.team && Math.hypot(t.x - x, this.depthDelta(anchor, t)) <= radius)
      .forEach(t => this.damage(src, t, amount, Object.assign({}, opt || {}, { area: true })));
  }
  aoeStatus(src, x, radius, id, dur, o) {
    const anchor = this.units.find(t => t.alive && Math.abs(t.x - x) < 2) || src;
    this.units.filter(t => t.alive && t.team !== src.team && Math.hypot(t.x - x, this.depthDelta(anchor, t)) <= radius)
      .forEach(t => this.applyStatus(src, t, id, dur, o));
  }

  /* ---------- healing / shields ---------- */
  heal(src, tgt, amount, opt) {
    opt = opt || {};
    if (!tgt || !tgt.alive || amount <= 0) return 0;
    if (src && src.noSelfHeal && src === tgt && !opt.pure) return 0;
    let amt = amount * (src ? src.st.healPow : 1);
    if (!opt.pure) amt *= tgt.st.healRecv;
    const ev = Object.assign({ src, target: tgt, amount: amt }, opt);
    tgt.statuses.slice().forEach(s => { const d = STATUS[s.id]; if (d.onHealed) d.onHealed(tgt, s, ev, this); });
    amt = Math.max(0, ev.amount);
    const missing = tgt.max.hp - tgt.hp;
    const applied = Math.min(missing, amt);
    const over = amt - applied;
    tgt.hp += applied;
    if (over > 0) this.emitTeam(tgt.team, 'allyOverheal', { src, target: tgt, amount: over });
    if (over > 0 && (opt.overheal === 'shield' || (src && src.overhealShield))) {
      this.shield(src, tgt, over * .4, 8);
    }
    if (src) src.healDone += applied;
    tgt.healReceived += applied;
    if (src) this.emitFor(src, 'healDone', { target: tgt, amount: applied });
    if (!opt.silent && applied > 1) {
      this.floatNum(tgt, -110, '+' + fmt(applied), 'heal');
      this.fxStatusOn(tgt, 'HealEffect', { sizeMul: .72 });
      const majorHeal = applied >= tgt.max.hp * .12;
      Sound.play(majorHeal ? 'light_magic' : 'heal_soft', { vol: majorHeal ? .4 : .38 });
    }
    if (tgt.hp >= tgt.max.hp) this.emitTeam(tgt.team, 'allyFull', tgt);
    return applied;
  }

  shield(src, tgt, amount, dur, opt) {
    opt = opt || {};
    if (!tgt || !tgt.alive) return;
    const amt = amount * (src ? src.st.shieldPow : 1);
    if (!Number.isFinite(amt) || amt <= 0) return;
    // A shield is represented by both a shield record and a positive status.
    // Ask the status gate first, before mutating the record, so Buff Sealed
    // and Teagan’s Fatigue cannot leave behind an invisible working shield.
    if (src && (tgt._teaganFatigue || tgt.statuses.some(s => s.id === 'buffsealed' && s.src && s.src.team !== src.team))) {
      this.applyStatus(src, tgt, 'shield', dur || 8);
      return;
    }
    // Saved Arena defenses run on the AI side, but they are still player-built
    // teams. Do not weaken them with the normal hostile shield ceiling just
    // because their units occupy TEAM_E in the local PvP battle.
    const cap = tgt.max.hp * (tgt.team === TEAM_E && !tgt.pvpDefense ? SHIELD_RULES.enemyCap : SHIELD_RULES.allyCap);
    // Recasting the same ordinary shield refreshes it instead of creating an
    // unlimited stack. Different protectors can still combine shields, and
    // authored redirect/on-break shields retain their individual behaviour.
    const existing = !opt.redirect && !opt.onBreak
      ? tgt.shields.find(sh => sh.src === src && !sh.redirect && !sh.onBreak)
      : null;
    const otherTotal = tgt.shieldTotal - (existing ? existing.amt : 0);
    const room = Math.max(0, cap - otherTotal);
    const cappedAmt = Math.min(amt, room);
    if (existing) {
      const before = existing.amt;
      existing.amt = Math.max(existing.amt, cappedAmt);
      existing.t = Math.max(existing.t, dur || 8);
      this.applyStatus(src, tgt, 'shield', existing.t);
      this.floatNum(tgt, -112, '↻' + fmt(existing.amt), 'shield');
      if (src) this.emitFor(src, 'shieldDone', { target: tgt, amount: Math.max(0, existing.amt - before) });
      return;
    }
    if (cappedAmt <= 0) return;
    tgt.shields.push({ amt: cappedAmt, t: dur || 8, src, onBreak: opt.onBreak, redirect: opt.redirect });
    this.applyStatus(src, tgt, 'shield', dur || 8);
    this.floatNum(tgt, -112, '+' + fmt(cappedAmt), 'shield');
    FX.ring(tgt.x, tgt.y - 40, 90, '#7be0ff', .35);
    Sound.play('shield_cast', { vol: .5 });
    if (src) this.emitFor(src, 'shieldDone', { target: tgt, amount: cappedAmt });
  }
  refreshShields(u) { u.shields.forEach(s => s.t = Math.max(s.t, 6)); }

  /** Fired whenever a shield is actually popped by damage (not just expired). */
  onShieldPopped(u, sh) {
    if (sh.onBreak) sh.onBreak();
    // Trinkets and other passives can react to a real shield break without
    // guessing from the preceding damage event (the shield still exists at
    // that point). Expiration is intentionally not reported as a break.
    this.emitFor(u, 'shieldBreak', { shield: sh });
    this.emitTeam(u.team, 'allyShieldBreak', { unit: u, shield: sh });
    if (u.onShieldBreakBonus) this.applyStatus(u, u, 'fortify', 4, { stacks: 2 });
  }

  /** Remove a percentage of an active shield without replacing the skill's
      normal damage, control, or support effects. Shield-counter skills use
      this instead of globally making all attacks pierce protection. */
  crackShield(src, tgt, fraction, opt) {
    opt = opt || {};
    if (!tgt || !tgt.alive || !tgt.shields.length) return 0;
    const before = tgt.shieldTotal;
    const pct = clamp(Number(fraction) || 0, 0, 1);
    let remaining = before * pct;
    if (remaining <= 0) return 0;
    for (let i = tgt.shields.length - 1; i >= 0 && remaining > 0; i--) {
      const sh = tgt.shields[i];
      const removed = Math.min(sh.amt, remaining);
      sh.amt -= removed; remaining -= removed;
      if (sh.amt <= 0) {
        tgt.shields.splice(i, 1);
        this.onShieldPopped(tgt, sh);
      }
    }
    const removed = Math.max(0, before - tgt.shieldTotal);
    if (!tgt.shields.length) this.removeStatus(tgt, 'shield');
    if (!removed) return 0;
    tgt.dirty = true;
    this.floatNum(tgt, -124, `-${fmt(removed)} SHIELD`, 'block');
    FX.ring(tgt.x, tgt.y - 40, 104, opt.color || '#ffe083', .42);
    Sound.play('icebreak', { vol: opt.vol == null ? .34 : opt.vol, throttle: 90 });
    this.emitAll('shieldCracked', { src, unit: tgt, amount: removed });
    return removed;
  }

  /* ---------- statuses ---------- */
  applyStatus(src, tgt, id, dur, opt) {
    opt = opt || {};
    const d = STATUS[id];
    if (!d || !tgt || !tgt.alive) return;
    const numericDur = Number(dur);
    dur = Number.isFinite(numericDur) ? Math.max(0, numericDur) : 0;
    // Shelly’s Encouraged allies resist the duration of incoming debuffs;
    // Hope is consumed to soften one debuff completely and visibly.
    if (d.kind === 'debuff') {
      if (tgt.hasStatus('cbhope')) {
        dur *= .52;
        this.removeStatus(tgt, 'cbhope');
      } else if (tgt.hasStatus('cbencouraged')) dur *= .72;
    }
    if (d.kind === 'buff' && src && tgt.statuses) {
      const seal = tgt.statuses.find(s => s.id === 'buffsealed' && s.src && s.src.team !== src.team);
      if (seal) {
        if (seal.stacks > 1) seal.stacks--;
        else this.removeStatus(tgt, 'buffsealed');
        tgt.dirty = true;
        this.floatNum(tgt, -92, 'BUFF DENIED', 'block');
        FX.floatIcon(tgt.x, tgt.y - 80, '🚫');
        Sound.play('guard', { vol: .42, throttle: 120 });
        this.emitAll('buffBlocked', { src, unit: tgt, id });
        return;
      }
    }
    if (d.kind === 'buff' && tgt._teaganFatigue) {
      tgt._teaganFatigue = false; this.removeStatus(tgt, 'fatigue');
      this.floatNum(tgt, -92, 'FATIGUED', 'block'); this.emitAll('buffBlocked', { src, unit: tgt, id }); return;
    }
    if (d.kind === 'buff' && tgt.flags && tgt.flags.cursed) { FX.floatIcon(tgt.x, tgt.y - 80, '🌑'); return; }
    // A generic block hook trinkets/passives can register into (e.g. a trinket
    // that gives a chance to shrug off the next debuff). Any guard returning
    // true stops the debuff from landing at all.
    if (d.kind === 'debuff' && !opt.ignoreGuards && tgt.guards && tgt.guards.length) {
      for (let i = 0; i < tgt.guards.length; i++) {
        if (tgt.guards[i](id, d, this)) {
          this.floatNum(tgt, -92, 'BLOCKED', 'block'); Sound.play('guard', { vol: .4 });
          this.emitAll('debuffBlocked', { src, unit: tgt, id }); return;
        }
      }
    }
    // These encounter machines are built to be a hard event, not a row of
    // helpless targets. Hard control still works, but it is short and starts
    // a brief Control Guard so repeated player stuns cannot erase their whole
    // turn cycle. Visual hit flashes never reach this code path.
    const hostileControl = d.cc && src && src.team !== tgt.team;
    const hardControl = hostileControl && !!(d.flags && d.flags.noAct);
    if (tgt.unknownWorld && hostileControl && !opt.bypassControlGuard) {
      if (hardControl && this.t < (tgt._unknownControlGuardUntil || 0)) {
        this.floatNum(tgt, -92, 'CONTROL RESIST', 'block');
        Sound.play('guard', { vol: .28, throttle: 150 });
        return;
      }
      if (hardControl) {
        dur = Math.min(dur * (tgt.isBoss ? .38 : .58), tgt.isBoss ? .65 : .9);
        tgt._unknownControlGuardUntil = this.t + (tgt.isBoss ? 2.8 : 1.85);
      } else {
        dur *= tgt.isBoss ? .62 : .78;
      }
    }
    if (d.cc && !opt.unresistable) {
      if (tgt.flags && tgt.flags.ccImmune) { this.floatNum(tgt, -92, 'RESIST', 'block'); return; }
      const isDelilahControl = src && (src.id === 'Delilah' || (src.owner && src.owner.id === 'Delilah'));
      const ccRes = isDelilahControl && tgt.hasStatus('testsubject') ? tgt.st.ccRes * .35 : tgt.st.ccRes;
      if (chance(ccRes)) { this.floatNum(tgt, -92, 'RESIST', 'block'); Sound.play('guard', { vol: .4 }); return; }
      dur *= (1 - ccRes * .5) * (1 + (src && src.ccDurBonus ? src.ccDurBonus : 0));
    }
    if (src && src.debuffDurMult && d.kind === 'debuff') dur *= src.debuffDurMult;

    // A control effect that lands during the windup must cancel the pending
    // activation. Otherwise the unit appears stunned/silenced, then fires
    // the skill as soon as the status expires because its old cast timer was
    // left intact. Explicit interrupts still use B.interrupt() directly, but
    // this covers ordinary Stun/Freeze/Sleep/Petrify/Fear/Silence applications.
    if (tgt.casting && dur > 0 && (hardControl || (id === 'silence' && hostileControl))) this.interrupt(tgt, src);

    // Buff seals belong to the team that placed them. Keep separate sources
    // separate so two controllers can each contribute a denial window.
    const cur = id === 'buffsealed' || id === 'statshare' || id === 'cookie_tiger_prey' || id === 'cookie_tiger_mark' || id === 'vanilla_truth' || id === 'vanilla_illuminated'
      ? tgt.statuses.find(s => s.id === id && s.src === src)
      : (tgt.statuses.find(s => s.id === id && s.src === src) || tgt.statuses.find(s => s.id === id));
    if (cur) {
      const currentDur = Number.isFinite(cur.t) ? cur.t : 0;
      cur.t = cur.apexLocked || opt.apexLocked ? 999 : Math.max(currentDur, dur);
      cur.apexLocked = cur.apexLocked || !!opt.apexLocked;
      if (d.max) {
        const maxStacks = id === 'momentum' && tgt.rudieMomentumCap ? tgt.rudieMomentumCap : d.max;
        cur.stacks = Math.min(maxStacks, cur.stacks + (opt.stacks || 1));
      }
      if (opt.val != null) cur.val = Math.max(cur.val || 0, opt.val);
      if (opt.overheal) cur.overheal = opt.overheal;
      tgt.statusVersion++;
    } else {
      const maxStacks = id === 'momentum' && tgt.rudieMomentumCap ? tgt.rudieMomentumCap : (d.max || 1);
      const s = { id, t: dur, stacks: Math.min(maxStacks, opt.stacks || 1), src: src || tgt,
        val: opt.val, acc: 0, overheal: opt.overheal, sticky: src && src.stickyDebuffs && d.kind === 'debuff',
        apexLocked: !!opt.apexLocked };
      tgt.statuses.push(s);
      tgt.statusVersion++;
      if (d.onApply) d.onApply(tgt, s, this);
      const vfx = STATUS_VFX[id];
      if (vfx) this.fxStatusOn(tgt, vfx);
      else if (d.cc || d.kind === 'debuff') FX.floatIcon(tgt.x, tgt.y - 78, d.icon);
      // Dandysworldcommon status sounds: CC lands with a crunch, buffs shimmer, magic debuffs hiss
      if (d.cc)                       Sound.play('shrink2',  { vol: .32, throttle: 120 });
      else if (d.kind === 'buff')     Sound.play('sparkle',  { vol: .22, throttle: 160 });
      else if (d.kind === 'debuff')   Sound.play('spectral', { vol: .20, throttle: 150 });
    }
    tgt.dirty = true;
    if (d.flags && d.flags.untargetable) this._targetableVersion++;
    this.emitAll('statusApplied', { src, unit: tgt, id });
  }

  removeStatus(u, id) {
    // There can be multiple source-specific copies of a status (notably
    // buffsealed). Remove a removable copy even if an Apex-locked copy is
    // earlier in the list.
    const i = u.statuses.findIndex(s => s.id === id && !s.apexLocked);
    if (i < 0) return false;
    u.statuses.splice(i, 1); u.statusVersion++; u.dirty = true;
    if (id === 'untargetable' || id === 'stealth') this._targetableVersion++;
    return true;
  }
  cleanse(u, n) {
    if (u.noCleanse > this.t) return 0;
    let c = 0;
    for (let i = u.statuses.length - 1; i >= 0 && c < n; i--) {
      const s = u.statuses[i];
      if (STATUS[s.id] && STATUS[s.id].kind === 'debuff' && !s.sticky && !s.apexLocked) {
        u.statuses.splice(i, 1); u.statusVersion++; c++;
        // The sample is designed to punish a deliberate cleanse, but not an
        // expiration or a dispel. Fire after removal so it cannot re-cleanse.
        if (s.id === 'contamination' && s.src && s.src.id === 'Delilah') {
          this.after(0, () => { if (u.alive) this.applyStatus(s.src, u, 'stun', 1.35); });
        }
      }
    }
    if (c) { u.dirty = true; Sound.play('cleanse', { vol: .5 }); FX.sparkle(u.x, u.y - 50, 6, '#fff'); }
    return c;
  }
  cleanseAll(u) { return this.cleanse(u, 99); }
  dispel(u, n) {
    const priority = ['secondwind', 'ward', 'overcharge', 'focus', 'artfury', 'braverywish', 'computerwish', 'speedwish', 'inspired', 'inspire', 'sweetsupport', 'fortify', 'mdefup', 'shield', 'rally', 'haste', 'lucky', 'accup', 'speedup', 'magup', 'atkup'];
    const rank = id => { const i = priority.indexOf(id); return i < 0 ? 0 : priority.length - i; };
    const candidates = u.statuses
      .map((s, i) => ({ s, i }))
      .filter(x => STATUS[x.s.id] && STATUS[x.s.id].kind === 'buff' && !x.s.apexLocked && x.s.id !== 'cookie_cream_guarded_jelly'
        && !(u._cocoaBuffGuardUntil && u._cocoaBuffGuardUntil > this.t))
      .sort((a, b) => rank(b.s.id) - rank(a.s.id) || b.s.t - a.s.t)
      .slice(0, n);
    candidates.sort((a, b) => b.i - a.i).forEach(x => { u.statuses.splice(x.i, 1); u.statusVersion++; });
    const c = candidates.length;
    if (c) {
      u.dirty = true;
      FX.floatIcon(u.x, u.y - 80, '💨');
      this.floatNum(u, -92, c === 1 ? 'BUFF REMOVED' : `${c} BUFFS REMOVED`, 'block');
      Sound.play('cleanse', { vol: .34, throttle: 120 });
      this.emitAll('buffRemoved', { unit: u, count: c, ids: candidates.map(x => x.s.id) });
    }
    return c;
  }
  dispelAll(u) { return this.dispel(u, 99); }

  energy(u, amt) {
    if (!u || !u.alive || u.noEnergy) return;
    if (amt < 0 && u.hasStatus('qom_energy_lock')) return;
    const was = u.energy;
    u.energy = clamp(u.energy + amt * (amt > 0 ? u.st.energyGen : 1), 0, u.energyMax);
    if (amt < 0 && was > u.energy) {
      const ev = { unit: u, amount: was - u.energy };
      this.emitFor(u, 'energyLost', ev);
      this.emitFoe(u.team, 'enemyEnergyLost', ev);
    }
    // Play the charge-up sound the first moment a player hero hits max energy
    if (u.team === TEAM_P && was < u.energyMax && u.energy >= u.energyMax)
      Sound.play('beam_charge', { vol: .35, throttle: 500 });
  }

  /* ---------- movement ---------- */
  dash(u, x, dur, opt) {
    dur = Math.max(.06, Number(dur) || .24);
    if (u.flags.noDash) return;
    // immovable is the "nothing moves this unit, full stop" flag (Rodger and
    // anchored boss mechanics) - checking it once here covers every dash
    // caller, not just the two (knockback/pull) that remembered to check it.
    if (u.immovable) return;
    opt = opt || {};
    u.dashFrom = u.x; u.dashTo = clamp(x, this.leftWall, this.rightWall);
    u.dashFromDepth = u.depth || 0; u.dashToDepth = clamp(opt.depth == null ? u.dashFromDepth : opt.depth, .04, .92);
    u.dashDur = dur; u.dashUntil = this.t + dur; u.dashOpt = opt;
    Sound.play('dash', { vol: .4 });
    u.trailBurst = .3;
  }
  leap(u, x, dur, onLand, depth) {
    this.dash(u, x, dur, { arc: true, onEnd: onLand, depth });
  }
  blink(u, x, depth, force) {
    if (u.immovable && !force) return;
    FX.burst(u.x, u.y - 40, 8, '#fff', { spMax: 200 });
    // A bad authored target coordinate must never turn a live unit's
    // position into NaN. Once x becomes invalid, distance checks, rendering,
    // movement, and attacks all fail together and the unit appears frozen.
    const fallbackX = Number.isFinite(u.x) ? u.x : (Number.isFinite(u.homeX) ? u.homeX : this.centerX());
    const nextX = Number.isFinite(x) ? x : fallbackX;
    u.x = clamp(nextX, this.leftWall, this.rightWall); u.trailBurst = .25;
    if (depth != null) {
      const fallbackDepth = Number.isFinite(u.depth) ? u.depth : (Number.isFinite(u.depthHome) ? u.depthHome : .5);
      u.depth = clamp(Number.isFinite(depth) ? depth : fallbackDepth, .04, .92);
    }
  }
  pull(u, x, dur, depth, src) {
    if (src) this.emitFor(u, 'pullAttempt', { src, x });
    if (u.immovable) return;
    Sound.play('chain', { vol: .5 });
    this.dash(u, x, dur || .3, { depth });
  }
  knockback(src, tgt, dist) {
    this.emitFor(tgt, 'knockbackAttempt', { src, dist });
    if (tgt.immovable) return;
    const d = dist * (1 - (tgt.st ? tgt.st.kbRes : 0)) * (src ? (src.face || 1) : 1);
    if (Math.abs(d) < 4) return;
    this.dash(tgt, tgt.x + d, .22, {});
    this.emitFor(tgt, 'knockedBack', { src, dist: d });
  }
  shakeUnit(u, dur) { u.shakeT = dur; }
  spinUnit(u, dur) { u.spinT = dur; }

  interrupt(u, src) {
    if (u.hasStatus('cookie_stage_guard')) return;
    if (u.casting) {
      u.casting = null; u._castId = (u._castId || 0) + 1; u.windup = 0;
      u.animState = 'idle'; u.animT = 0; u.animDur = 0; u.animStyle = null; u.moving = false;
      FX.floatIcon(u.x, u.y - 90, '❌'); Sound.play('guardbreak');
    }
  }
  reduceCd(u, sec) { for (const k in u.cds) u.cds[k] = Math.max(0, u.cds[k] - sec); }
  resetCd(u, key) { u.cds[key] = 0; }

  /* ---------- summons ---------- */
  summon(u, def) {
    const spec = { id: def.protoId || u.id, level: u.level, stars: u.stars, rarity: 1, skillLv: u.skillLv,
      twisted: def.twisted != null ? def.twisted : u.twisted, name: def.name };
    const targetTeam = def.team != null ? def.team : u.team;
    if (targetTeam === TEAM_E && typeof ensureEnemyTraining === 'function') {
      ensureEnemyTraining(spec, `summon-${u.id}-${this.units.length}`);
    }
    const m = new Unit(spec, targetTeam, 90 + this.units.length, this);
    m.uid = this.nextId++;
    m.minion = true; m.owner = u; m.mScale = def.scale || .6;
    m.artSrc = def.art;
    m.baseStats.hp = def.hp; m.max.hp = def.hp; m.hp = def.hp;
    ['atk', 'def', 'mag', 'mdef'].forEach(k => { if (def[k] != null) { m.baseStats[k] = def[k]; m.st[k] = def[k]; } });
    m.baseStats.aggro = def.taunt ? 3 : 1;
    m.noEnergy = !!def.noEnergy; m.noSkills = !!def.noSkills;
    m.delilahSample = !!def.delilahSample; m.sampleType = def.sampleType || null;
    m.forcedTarget = def.follow || null;
    m.life = def.life || 10; m.followTarget = def.follow;
    m.onDeathFn = def.onDeath; m.offset = def.offset || 0;
    if (m.team === TEAM_E) {
      if (m.cls && CLASSES[m.cls]) CLASSES[m.cls].apply(m, this, m.classRank || 1);
      if (m.subcls && SUBCLASSES[m.subcls]) SUBCLASSES[m.subcls].apply(m, this, m.subclassRank || 1);
    }
    if (def.immovable) { m.immovable = true; m.flags.noMove = true; m.flags.noAct = true; }
    m.x = clamp(def.x != null ? def.x : u.x + u.face * (60 + (def.offset || 0)), this.leftWall, this.rightWall);
    m.depth = clamp(def.depth != null ? def.depth : u.depth + rnd(-.08, .08), .04, .92); m.depthHome = m.depth;
    m.y = this.ground - m.depth * this.depthSpan;
    m.recompute(true); m.hp = def.hp; m.max.hp = def.hp;
    this.units.push(m);
    this._liveDirty = true;
    if (!this.offscreen) this.buildUnitEl(m);
    if (def.tint && m.imgEl) {
      m.imgEl.style.filter = `drop-shadow(0 0 8px ${def.tint})`;
      m.baseFilter = m.imgEl.style.filter;
      m._filterCache = m.baseFilter;
    }
    if (def.taunt) {
      this.enemiesOf(m).forEach(e => {
        if (this.distance(e, m) < def.taunt) this.applyStatus(m, e, 'taunt', 4);
      });
      this.every(m, 2, () => this.enemiesOf(m).forEach(e => {
        if (this.distance(e, m) < def.taunt) this.applyStatus(m, e, 'taunt', 2.2);
      }));
    }
    if (def.life && def.life < 900) this.after(def.life, () => { if (m.alive) this.kill(m); });
    if (def.onTick) def.onTick(m);
    FX.ring(m.x, m.y - 20, 120, def.tint || '#fff', .4);
    return m;
  }
  summonAdds(boss, ids, n) {
    for (let i = 0; i < n; i++) {
      const id = ids[i % ids.length];
      if (!HEROES[id]) continue;
      const spec = makeTwisted(id, Math.round(boss.level * .8), 'normal');
      const u = this.addUnit(spec, boss.team, this.units.length);
      u.x = clamp(boss.x + boss.face * (110 + i * 70), this.leftWall, this.rightWall);
      u.depth = clamp(boss.depth + (i % 2 ? .16 : -.16), .05, .9); u.depthHome = u.depth;
      u.y = this.ground - u.depth * this.depthSpan; u.homeX = u.x;
      if (!this.offscreen) this.buildUnitEl(u); this.initPassives(u);
      FX.ring(u.x, u.y - 20, 150, '#ff6b6b', .5);
    }
    Sound.play('summon');
    if (!this.offscreen) this.buildBars();
    this.log('<b>Reinforcements.</b>');
  }

  /* ---------- scheduling / events ---------- */
  after(sec, fn) { this.timers.push({ t: sec, fn }); }
  repeat(times, interval, fn) {
    for (let i = 0; i < times; i++) this.after(i * interval, () => fn(i));
  }
  every(owner, interval, fn) {
    this.intervals.push({ owner, every: interval, t: interval, fn });
  }
  on(owner, evt, fn) {
    const L = { owner, evt, fn };
    const bucket = this.listenersByEvent[evt] || (this.listenersByEvent[evt] = []);
    bucket.push(L);
    if (owner) {
      const ownerEvents = owner._eventListeners || (owner._eventListeners = Object.create(null));
      (ownerEvents[evt] || (ownerEvents[evt] = [])).push(L);
      const teamEvents = this.listenersByTeam[owner.team] || (this.listenersByTeam[owner.team] = Object.create(null));
      (teamEvents[evt] || (teamEvents[evt] = [])).push(L);
    }
    const remove = () => this._removeListener(L);
    L.remove = remove;
    return remove;
  }
  _removeListener(L) {
    if (!L || L.removed) return;
    L.removed = true;
    const removeFrom = (list) => {
      if (!list) return;
      const i = list.indexOf(L);
      if (i >= 0) list.splice(i, 1);
    };
    removeFrom(this.listenersByEvent[L.evt]);
    if (L.owner) {
      removeFrom(L.owner._eventListeners && L.owner._eventListeners[L.evt]);
      removeFrom(this.listenersByTeam[L.owner.team] && this.listenersByTeam[L.owner.team][L.evt]);
    }
  }
  removeListenersFor(owner) {
    for (const evt in this.listenersByEvent) {
      const bucket = this.listenersByEvent[evt];
      for (let i = bucket.length - 1; i >= 0; i--) {
        if (bucket[i].owner === owner) this._removeListener(bucket[i]);
      }
    }
  }
  _fire(L, payload) { try { L.fn(payload); } catch (e) { console.warn('listener', L.evt, e); } }
  emitFor(unit, evt, payload) {
    if (!unit) return;
    const list = unit._eventListeners && unit._eventListeners[evt];
    if (!list) return;
    for (let i = 0; i < list.length; i++) {
      const L = list[i];
      // Death callbacks run after kill() marks the unit dead.
      if (L.owner === unit && (L.owner.alive || evt === 'death')) this._fire(L, payload);
    }
  }
  emitTeam(team, evt, payload) {
    const list = this.listenersByTeam[team] && this.listenersByTeam[team][evt];
    if (!list) return;
    for (let i = 0; i < list.length; i++) {
      const L = list[i];
      if (L.owner && L.owner.team === team && L.owner.alive) this._fire(L, payload);
    }
  }
  emitFoe(team, evt, payload) {
    const foeTeam = team === 0 ? 1 : 0;
    const list = this.listenersByTeam[foeTeam] && this.listenersByTeam[foeTeam][evt];
    if (!list) return;
    for (let i = 0; i < list.length; i++) {
      const L = list[i];
      if (L.owner && L.owner.alive) this._fire(L, payload);
    }
  }
  emitAll(evt, payload) {
    const list = this.listenersByEvent[evt];
    if (!list) return;
    for (let i = 0; i < list.length; i++) {
      const L = list[i];
      if (L.owner && L.owner.alive) this._fire(L, payload);
    }
  }
  teamAura(u, fn, extra) {
    const a = { team: u.team, fn, owner: u, extra };
    this.auras.push(a);
    this.on(u, 'death', () => { const i = this.auras.indexOf(a); if (i >= 0) this.auras.splice(i, 1);
      this.units.forEach(x => x.dirty = true); });
    this.units.forEach(x => x.dirty = true);
  }

  /* ---------- kit sugar ---------- */
  spark(u, n) {
    u.spark = Math.min((u.spark || 0) + n, u.sparkMax || 12);
    u.flat.hpP = u.spark * (u.sparkHp || 0);
    u.flat.defP = u.spark * (u.sparkDef || 0);
    u.dirty = true;
  }
  paint(u, t) { t.paint = Math.min((t.paint || 0) + 1, u.paintMax || 3); FX.floatIcon(t.x, t.y - 70, '🎨'); }
  tempo(u) { this.emitTeam(u.team, 'allyBasic', u); }

  /** Cocoa's stock. Capped, with a chance to refund on spend at Purple. */
  bonbon(u, n) {
    const max = u.bonbonMax || 4;
    u.bonbons = Math.min(max, (u.bonbons || 0) + n);
    if (u.cocoaOverflow && u.bonbons >= max) {
      const a = this.lowestHp(this.alliesOf(u)) || u;
      if (a) {
        this.applyStatus(u, a, 'sugarrush', u.cocoaOverflowDur || 8);
        this.energy(a, 10);
        this.heal(u, a, u.max.hp * 0.12, { tag: 'Bonbon Overflow' });
        this.emitFor(u, 'bonbonDelivered', { target: a, repeated: true });
        this.fxFloatIcon(a.x, a.y - 88, '🍬 SWEET OVERFLOW', '#c98a5a');
        u.bonbons = max - 1;
      }
    }
  }

  /** Bassie's stock. Preparing while full creates an Overflow Supply at Red. */
  supply(u, n) {
    const max = u.supplyMax || 5;
    if ((u.supplies || 0) >= max) {
      if (u.supplyBoth) {
        u.overflow = Math.min(6, (u.overflow || 0) + n);
        this.fxBassieSkill('overflow', u, { count: u.overflow });
      }
      return;
    }
    u.supplies = Math.min(max, (u.supplies || 0) + n);
    this.fxBassieSkill('stock', u, { count: u.supplies });
  }

  /** Toodles shakes her Magic 8-Ball for an adaptive fortune boost: Damage (Outlook Good!), Defense (It is Certain!), Speed (Signs Point to Yes!), Support (Without a Doubt!), or an All Signs Point to Yes! fortune. */
  luckyBoost(u, dur, forceAll) {
    // A Boost applies buffs, and Toodles rolls a Boost when buffs are applied.
    // Without this guard the two feed each other into an infinite cascade.
    if (u._rollingBoost) return;
    u._rollingBoost = true;
    this.after(0.01, () => { u._rollingBoost = false; });
    dur = dur || 9;
    u._luckRollCount = (u._luckRollCount || 0) + 1;
    const isAllSigns = forceAll || (u._luckRollCount % 5 === 0 && chance(.45)) || chance(0.12 + (u.st && u.st.crit || 0) * 0.25 + (u._luckCounters || 0) * 0.02);
    if (isAllSigns) {
      u.lastBoost = 'all';
      this.applyStatus(u, u, 'atkup', dur + 3, { stacks: 3 });
      this.applyStatus(u, u, 'lucky', dur + 3);
      this.applyStatus(u, u, 'fortify', dur + 3, { stacks: 3 });
      this.applyStatus(u, u, 'ward', dur + 3);
      this.applyStatus(u, u, 'speedup', dur + 3, { stacks: 3 });
      this.applyStatus(u, u, 'haste', dur + 3);
      this.applyStatus(u, u, 'rally', dur + 3, { stacks: 1 });
      this.applyStatus(u, u, 'overcharge', dur + 3);
      this.alliesOf(u).forEach(a => {
        if (a !== u && this.distance(a, u) < 360) {
          this.applyStatus(u, a, 'atkup', dur, { stacks: 1 });
          this.applyStatus(u, a, 'fortify', dur, { stacks: 1 });
          this.applyStatus(u, a, 'speedup', dur, { stacks: 1 });
          this.applyStatus(u, a, 'rally', dur, { stacks: 1 });
        }
      });
      Sound.play('get_rare', { vol: .75 });
      Sound.play('sparkle', { vol: .65 });
      if (FX.toodlesEightBallFortune) FX.toodlesEightBallFortune(u.x, u.y, 'all', true);
      FX.floatIcon(u.x, u.y - 110, '🎱 ALL SIGNS POINT TO YES!', '#ffd700');
      this.emitFor(u, 'luckyBoost', 'all');
      return;
    }

    let kinds = ['damage', 'defense', 'speed', 'support'];
    if (u.noRepeatBoost && u.lastBoost) kinds = kinds.filter(k => k !== u.lastBoost);
    const kind = pick(kinds);
    u.lastBoost = kind;
    const share = (id, st) => {
      this.applyStatus(u, u, id, dur, { stacks: st });
      if (u.boostShare) this.alliesOf(u).forEach(a => {
        if (a !== u && this.distance(a, u) < 320) this.applyStatus(u, a, id, dur, { stacks: 1 });
      });
    };
    if (kind === 'damage') {
      share('atkup', 3);
      this.applyStatus(u, u, 'lucky', dur);
    } else if (kind === 'defense') {
      share('fortify', 3);
      this.applyStatus(u, u, 'ward', dur);
    } else if (kind === 'speed') {
      share('speedup', 3);
      this.applyStatus(u, u, 'haste', dur);
    } else {
      share('rally', 2);
      this.applyStatus(u, u, 'overcharge', dur);
      const hurt = this.lowestHp(this.alliesOf(u));
      if (hurt) this.heal(u, hurt, u.max.hp * .08);
    }
    Sound.play('sparkle', { vol: .55 });
    if (FX.toodlesEightBallFortune) FX.toodlesEightBallFortune(u.x, u.y, kind, false);
    const fortuneLabels = {
      damage: '⚔ OUTLOOK GOOD!',
      defense: '🛡 IT IS CERTAIN!',
      speed: '🏃 SIGNS POINT YES!',
      support: '💚 WITHOUT A DOUBT!'
    };
    FX.floatIcon(u.x, u.y - 100, fortuneLabels[kind] || '🎱');
    this.emitFor(u, 'luckyBoost', kind);
  }

  /** Dyle's Rail Marker: only one enemy carries it at a time. */
  markRail(u, t) {
    if (!t || !t.alive) return;
    this.enemiesOf(u).forEach(e => { if (e !== t) this.removeStatus(e, 'railmarker'); });
    if (!t.hasStatus('railmarker')) { Sound.play('lock', { vol: .5 }); this.applyStatus(u, t, 'railmarker', 999, { src: u }); }
  }

  /** Gigi's roulette: charge tapes, roll a visible prize, then resolve it. */
  gigiTicket(u) {
    const max = u.gigiMax || 3;
    u.gigiTickets = u.gigiTickets || 0;
    if (u.gigiTickets >= max) return false;
    u.gigiTickets++;
    FX.floatIcon(u.x, u.y - 92, `🎟 ${u.gigiTickets}`, '#ffe08a');
    Sound.play('coin', { vol: .24, throttle: 420 });
    return true;
  }
  gigiSpin(u, mult) {
    const tapes = Math.max(1, Math.min(u.gigiMax || 3, u.gigiTickets || 0));
    u.gigiTickets = Math.max(0, (u.gigiTickets || 0) - tapes);
    const prizes = [];
    for (let i = 0; i < tapes; i++) {
      const wheel = GIGI_WHEEL;
      const forced = (u.gigiMisses || 0) >= 2 || u.gigiHouseCall;
      let prize;
      if (forced) {
        const unseen = u.gigiHouseCall && u.gigiSeen ? wheel.filter(p => p.id !== 'jackpot' && !u.gigiSeen.has(p.id)) : [];
        prize = unseen.length ? pick(unseen) : wheel.find(p => p.id === 'jackpot');
        u.gigiHouseCall = false;
      } else {
        const weights = [18, 15, 14, 14, 14, 10, 10, 5 + (u.gigiWheelBonus ? 7 : 0)];
        let roll = Math.random() * weights.reduce((a, b) => a + b, 0);
        prize = wheel[wheel.length - 1];
        for (let j = 0; j < wheel.length; j++) { roll -= weights[j]; if (roll < 0) { prize = wheel[j]; break; } }
      }
      const combo = prize.id === u.gigiLastPrize ? (u.gigiCombo || 1) + 1 : 1;
      u.gigiLastPrize = prize.id; u.gigiCombo = combo;
      const strength = (mult || 1) * (u.gigiBoostNext || 1) * (combo > 1 ? Math.min(2, 1 + (combo - 1) * .3) : 1);
      u.gigiBoostNext = 1;
      if (prize.id === 'jackpot') u.gigiMisses = 0; else u.gigiMisses = (u.gigiMisses || 0) + 1;
      prizes.push({ id: prize.id, name: prize.name, icon: prize.icon, color: prize.color, combo, index: GIGI_WHEEL.indexOf(prize) });
      this.gigiPrize(u, prize, strength);
      this.emitFor(u, 'gigiPrize', { ...prize, combo, strength });
    }
    this.anim(u, 'cast', .86, 'gigiWheel');
    Sound.play('gigi_ability', { vol: .44, priority: true });
    if (FX.gigiRoulette) FX.gigiRoulette(u.x, u.y - 12, prizes);
    return prizes;
  }
  gigiPrize(u, prize, mult) {
    const allies = this.alliesOf(u), foes = this.enemiesOf(u);
    const hurt = this.lowestHp(allies), target = hurt || u;
    const leader = this.highestStat(foes, 'atk');
    this.fxConfetti(u.x, u.y - 50, prize.id === 'jackpot' ? 24 : 7);
    this.fxFloatIcon(u.x, u.y - 108, prize.icon, prize.color);
    if (prize.id === 'heart') {
      this.heal(u, target, target.max.hp * .16 * mult, { tag: 'Lucky Spin' }); this.cleanse(target, 2);
    } else if (prize.id === 'shield') {
      this.shield(u, target, target.max.hp * .15 * mult, 6); this.applyStatus(u, target, 'fortify', 6, { stacks: 1 });
    } else if (prize.id === 'tempo') {
      allies.forEach(a => { this.applyStatus(u, a, 'haste', 5); this.applyStatus(u, a, 'speedup', 5); });
    } else if (prize.id === 'energy') {
      allies.forEach(a => this.energy(a, 18 * mult));
    } else if (prize.id === 'power') {
      allies.forEach(a => this.applyStatus(u, a, 'atkup', 7, { stacks: 1 }));
    } else if (prize.id === 'jinx') {
      if (leader) { this.damage(u, leader, u.st.mag * .55 * mult, { type: 'magic', tag: 'Jinx Prize' }); this.applyStatus(u, leader, 'weaken', 6, { stacks: 2 }); this.applyStatus(u, leader, 'blind', 4); }
    } else if (prize.id === 'double') {
      allies.forEach(a => { this.energy(a, 10 * mult); this.applyStatus(u, a, 'lucky', 6); });
      if (hurt) this.heal(u, hurt, hurt.max.hp * .08 * mult, { tag: 'Double Prize' });
    } else if (prize.id === 'jackpot') {
      allies.forEach(a => { this.heal(u, a, a.max.hp * .14 * mult, { tag: 'Jackpot' }); this.energy(a, 22); this.applyStatus(u, a, 'atkup', 9, { stacks: 2 }); this.applyStatus(u, a, 'lucky', 9); });
      foes.forEach(e => this.applyStatus(u, e, 'weaken', 5, { stacks: 1 }));
      Sound.play('get_rare', { vol: .72, priority: true }); this.shake(5, .18);
    }
    if (prize.id !== 'jackpot' && u.gigiFortune) allies.forEach(a => this.applyStatus(u, a, 'inspire', 4));
  }

  /** The enemy Rodger has the most (informational, not a status) Research on. */
  mostResearched(u) {
    const foes = this.enemiesOf(u).filter(e => (u.research || {})[e.uid]);
    if (!foes.length) return null;
    return foes.reduce((a, b) => u.research[b.uid] > u.research[a.uid] ? b : a);
  }
  gourdyTrick(u, t, mult) {
    if (!t || !t.alive) return;
    const trick = pick(GOURDY_TRICKS);
    Sound.play('whisper', { vol: .3 }); this.fxFloatIcon(t.x, t.y - 90, trick.icon);
    this.applyStatus(u, t, trick.status, 4 * (mult || 1));
    const bonusStat = Math.max(0, u.st.cdr || 0, (u.st.energyGen || 1) - 1);
    if (u._gourdyLucky && chance(u._gourdyLucky.base + u._gourdyLucky.perCdr * bonusStat)) {
      const other = pick(GOURDY_TRICKS.filter(x => x !== trick));
      this.applyStatus(u, t, other.status, 3 * (mult || 1));
    }
  }
  gourdyTreat(u, t, mult) {
    if (!t || !t.alive) return;
    const bonusStat = Math.max(0, u.st.cdr || 0, (u.st.energyGen || 1) - 1);
    // Halloween's Luck (R): roll three Treats instead of one, keep whichever
    // fits the ally best, and turn the two leftovers into Tricks on enemies
    // instead of wasting them.
    if (u._gourdyLuck && u._gourdyLuck.red) {
      const rolled = pickN(GOURDY_TREATS, 3);
      const scoreTreat = treat => {
        if (t.hpPct < u._gourdyLuck.thr && (treat.status === 'fortify' || treat.status === 'mdefup')) return 100;
        if (treat.status === 'overcharge') return Math.max(1, 40 - t.energy);
        if (treat.status === 'atkup') return t.st.atk > t.st.mag ? 30 : 12;
        if (treat.status === 'lucky') return t.st.crit < .15 ? 26 : 8;
        return treat.status === 'speedup' ? 20 : 14;
      };
      const chosen = rolled.reduce((best, treat) => scoreTreat(treat) > scoreTreat(best) ? treat : best, rolled[0]);
      Sound.play('get_item', { vol: .55 }); this.fxFloatIcon(t.x, t.y - 90, chosen.icon);
      this.fxGourdyTreat(u, t, chosen);
      this.applyStatus(u, t, chosen.status, 8 * (mult || 1));
      this.emitFor(u, 'gourdyTreat', { ally: t, treat: chosen });
      rolled.filter(r => r !== chosen).forEach(() => {
        const foe = pick(this.enemiesOf(u).filter(e => e.alive));
        const trick = pick(GOURDY_TRICKS);
        if (foe) {
          Sound.play('whisper', { vol: .28 }); this.fxFloatIcon(foe.x, foe.y - 90, trick.icon);
          this.applyStatus(u, foe, trick.status, u._gourdyLuck.trickDur);
        }
      });
      if (u._gourdyLucky && chance(u._gourdyLucky.base + u._gourdyLucky.perCdr * bonusStat)) {
        const other = pick(GOURDY_TREATS.filter(x => x !== chosen));
        this.fxGourdyTreat(u, t, other, true);
        this.applyStatus(u, t, other.status, 6 * (mult || 1));
        this.emitFor(u, 'gourdyTreat', { ally: t, treat: other, smaller: true });
      }
      return;
    }
    const treat = pick(GOURDY_TREATS);
    Sound.play('get_item', { vol: .5 }); this.fxFloatIcon(t.x, t.y - 90, treat.icon);
    this.fxCandyBurst(u.x, u.y - 35, 4);
    this.fxGourdyTreat(u, t, treat);
    this.applyStatus(u, t, treat.status, 8 * (mult || 1));
    this.emitFor(u, 'gourdyTreat', { ally: t, treat });
    if (u._gourdyLucky && chance(u._gourdyLucky.base + u._gourdyLucky.perCdr * bonusStat)) {
      const other = pick(GOURDY_TREATS.filter(x => x !== treat));
      this.fxGourdyTreat(u, t, other, true);
      this.applyStatus(u, t, other.status, 6 * (mult || 1));
      this.emitFor(u, 'gourdyTreat', { ally: t, treat: other, smaller: true });
    }
  }

  anim(u, kind, dur, style) {
    u.animState = kind; u.animT = dur; u.animDur = dur;
    u.animStyle = style || null;
    if (kind === 'cast' && u.alive) {
      const col = u.team === TEAM_P ? '#8fe7ff' : '#ff8b9a';
      FX.ring(u.x, u.y - 48, 58, col, .24);
      FX.sparkle(u.x, u.y - 48, 3, col);
    }
  }

  /** A bubble attached to the unit instead of the screen follows Poppy through
      the 2.5D arena. The sprite remains visible inside, so this reads as an
      actual transformation rather than a detached status icon. */
  poppyBubble(u, big) {
    if (!u || !u.el) return null;
    this.poppyBubblePop(u, true);
    const n = el('div', 'poppy-sprite-bubble' + (big ? ' biggest' : ''));
    const w = (u.bodyW || 98) * (big ? 1.62 : 1.28);
    n.style.width = `${w}px`; n.style.height = `${w * (big ? 1.12 : 1.28)}px`;
    n.style.left = `${-w / 2}px`; n.style.bottom = `${big ? -20 : -10}px`;
    u.el.appendChild(n); u.poppyBubbleEl = n;
    return n;
  }

  poppyBubblePop(u, quiet, expected) {
    const n = u && u.poppyBubbleEl;
    if (!n) return;
    if (expected && n !== expected) return;
    u.poppyBubbleEl = null;
    if (quiet) { n.remove(); return; }
    n.classList.add('popping');
    setTimeout(() => n.remove(), 280);
  }

  heroDialogue(u, text) {
    if (!u || !text || !u.alive) return null;
    const a = this.unitFxAnchor(u);
    return FX.heroDialogue(a.x, a.y + a.size * .42, text, { owner: u, face: u.face, size: a.size });
  }

  unknownWorldDialogue(u, opt) {
    if (!u || !u.unknownWorld || !u.alive || !UNKNOWN_WORLD_DIALOGUE.length) return null;
    opt = opt || {};
    const gap = opt.force ? 2.6 : 4.2;
    if (!opt.force && this.t - (u._unknownDialogueAt || -99) < gap) return null;
    u._unknownDialogueAt = this.t;
    // Speech bubbles are a real machine beat, not just a text decoration.
    // This used to be missing entirely, so ordinary machine chatter became
    // silent even though skill recordings still worked.
    Sound.play('machine_speak', {
      vol: opt.force ? .52 : .44,
      rate: rnd(.94, 1.06),
      throttle: opt.force ? 650 : 850,
      priority: !!opt.force,
      tag: ':machine-speech:' + u.id
    });
    const a = this.unitFxAnchor(u);
    return FX.machineDialogue(a.x, a.y + a.size * .42, pick(UNKNOWN_WORLD_DIALOGUE), { owner: u, face: u.face, size: a.size, duration: opt.force ? 1450 : 1180 });
  }

  log(txt) {
    this.logLines.unshift(txt);
    if (this.logLines.length > 5) this.logLines.pop();
    if (this.offscreen) return;
    // A wipe can add several lines synchronously. Render the completed batch
    // once instead of clearing and rebuilding this DOM for every casualty.
    if (this._logRaf) return;
    this._logRaf = requestAnimationFrame(() => {
      this._logRaf = null;
      const box = $('#logBox'); if (!box) return;
      clear(box);
      this.logLines.forEach(l => box.appendChild(el('div', null, l)));
    });
  }

  /* ---------- fx passthrough ---------- */
  shake(m, d) { if (!this.offscreen) FX.shake(m, d); }
  // Keep combat resolution live through impact effects. A hit reaction is
  // visual flavor, never an unstated stun on the opposing side.
  hitstop(ms) { if (!this.offscreen) FX.hitstop(ms); }
  tint(c, a, d) { if (!this.offscreen) FX.tint(c, a, d); }
  flash(c, a, d) { if (!this.offscreen) FX.flash(c, a, d); }
  flashAt(x, y, col) { if (!this.offscreen) FX.boom(x, y, .7, col); }
  fxSlash(u, t, o) { if (!t) return; FX.slash((u.x + t.x) / 2 + rnd(-10, 10), t.y - 55, o); }
  fxBoom(x, y, s, c) { FX.boom(x, y, s, c); }
  fxThunder(t, opt) {
    if (!t) return;
    const a = this.unitFxAnchor(t);
    FX.thunder(a.x, t.y - 18, opt);
  }
  fxRing(x, y, s, c, d) { FX.ring(x, y, s, c, d); }
  fxQomSkill(kind, u, opt) {
    if (!this.offscreen && u) {
      FX.qomSkill(kind, u.x, u.y, Object.assign({ face: u.face }, opt || {}));
      FX.qomPerform(kind, u.id, u.bodyEl, u.x, u.y, u.face, u.bodyW || 98);
    }
  }
  fxQomBasic(u, target, type) {
    if (!this.offscreen && u && target) FX.qomBasic(u.id, u.x, u.y, target.x, target.y, type);
  }
  fxGlistenMirror(x, y, s, face, opt) { if (!this.offscreen) FX.glistenMirror(x, y, s, face, opt); }
  fxSparkle(x, y, n, c) { if (!this.offscreen) FX.sparkle(x, y, n, c); }
  fxFloatIcon(x, y, ch, c) { if (!this.offscreen) FX.floatIcon(x, y, ch, c); }
  fxFloatItem(x, y, img) { if (!this.offscreen) FX.floatItem(x, y, img); }
  fxFloatObject(x, y, img, col) { if (!this.offscreen) FX.floatObject(x, y, img, col); }
  fxTargetLine(from, to, col) { if (!this.offscreen) FX.targetLine(from, to, col); }
  fxSpiralBurst(x, y, s, opt) { if (!this.offscreen) { if (FX.mrsHollowaySpiralExplosion) FX.mrsHollowaySpiralExplosion(x, y, s, opt); else FX.hollowaySpiral(x, y, s, opt); } }
  fxAutumnBurst(x, y, s, opt) { if (!this.offscreen) { if (FX.mrHollowayEarthCrash) FX.mrHollowayEarthCrash(x, y, s); else FX.hollowayAutumn(x, y, s, opt); } }
  fxMrsHollowayExplosion(x, y, s, opt) { if (!this.offscreen && FX.mrsHollowaySpiralExplosion) FX.mrsHollowaySpiralExplosion(x, y, s, opt); }
  fxMrsHollowayApparition(x, y) { if (!this.offscreen && FX.mrsHollowayApparition) FX.mrsHollowayApparition(x, y); }
  fxMrsHollowayEmbrace(x, y, dur) { if (!this.offscreen && FX.mrsHollowayEmbrace) FX.mrsHollowayEmbrace(x, y, dur); }
  fxMrHollowayCrash(x, y, s) { if (!this.offscreen && FX.mrHollowayEarthCrash) FX.mrHollowayEarthCrash(x, y, s); }
  fxMrHollowayCyclone(x, y, dur) { if (!this.offscreen && FX.mrHollowayAutumnCyclone) FX.mrHollowayAutumnCyclone(x, y, dur); }
  fxMrHollowayRoots(x, y, dur) { if (!this.offscreen && FX.mrHollowayRootBarrier) FX.mrHollowayRootBarrier(x, y, dur); }
  fxMrHollowayHarvestShield(x, y, dur) { if (!this.offscreen && FX.mrHollowayHarvestShield) FX.mrHollowayHarvestShield(x, y, dur); }
  fxMrHollowayClaw(x, y, tx, ty) { if (!this.offscreen && FX.mrHollowayClawSlash) FX.mrHollowayClawSlash(x, y, tx, ty); }
  fxDelilahContaminationBurst(x, y, s, opt) { if (!this.offscreen && FX.delilahContaminationBurst) FX.delilahContaminationBurst(x, y, s, opt); }
  fxDelilahContainment(x, y, dur) { if (!this.offscreen && FX.delilahContainmentStasis) FX.delilahContainmentStasis(x, y, dur); }
  fxDelilahSpill(x, y, dur) { if (!this.offscreen && FX.delilahIchorSpill) FX.delilahIchorSpill(x, y, dur); }
  fxShellyFossil(x, y, s, opt) { if (!this.offscreen && FX.shellyFossilExcavation) FX.shellyFossilExcavation(x, y, s, opt); }
  fxShellyInspiration(x, y, dur) { if (!this.offscreen && FX.shellyInspirationWhistle) FX.shellyInspirationWhistle(x, y, dur); }
  fxShellyAmber(x, y, dur) { if (!this.offscreen && FX.shellyAmberStasis) FX.shellyAmberStasis(x, y, dur); }
  fxCandyBurst(x, y, n) { if (!this.offscreen) FX.candyBurst(x, y, n); }
  fxGingerHeartBurst(x, y, s, opt) { if (!this.offscreen && FX.gingerHeartBurst) FX.gingerHeartBurst(x, y, s, opt); }
  fxGingerRoyalIcing(x, y, s, dur) { if (!this.offscreen && FX.gingerRoyalIcing) FX.gingerRoyalIcing(x, y, s, dur); }
  fxGingerPeppermintHearth(x, y, dur) { if (!this.offscreen && FX.gingerPeppermintHearth) FX.gingerPeppermintHearth(x, y, dur); }
  fxGingerLastBite(x, y) { if (!this.offscreen && FX.gingerLastBite) FX.gingerLastBite(x, y); }
  fxVeeLiveBroadcast(x, y) { if (!this.offscreen && FX.veeLiveBroadcast) FX.veeLiveBroadcast(x, y); }
  fxSquirmBiblioPanic(x, y) { if (!this.offscreen && FX.squirmBiblioPanic) FX.squirmBiblioPanic(x, y); }
  unitFxAnchor(u) {
    if (!u) return { x: this.W ? this.W / 2 : 280, y: (this.ground || 300) - 45, size: 75 };
    const scale = u.depth != null ? 1 - u.depth * DEPTH_SCALE_FALL : 1;
    const x = u.depth != null ? this.W / 2 + (u.x - this.W / 2) * (1 - u.depth * DEPTH_XCOMPRESS) : u.x;
    const aspect = u.imgEl && u.imgEl.naturalWidth ? u.imgEl.naturalHeight / u.imgEl.naturalWidth : 1.32;
    const w = (u.bodyW || 98) * scale, h = w * aspect;
    return { x, y: u.y - h * .56, size: clamp(Math.max(w * 1.15, h * .62), 58, 146) };
  }
  fxStatusOn(u, folder, opt) {
    if (!u) return;
    const a = this.unitFxAnchor(u), o = opt || {};
    FX.statusBurst(a.x, a.y, folder, { size: o.size || a.size * (o.sizeMul || 1), layer: o.layer });
  }
  fxConnieSkill(kind, u, opt) {
    if (!u) return;
    const a = this.unitFxAnchor(u);
    FX.connieSkill(kind, a.x, a.y, Object.assign({ face: u.face, twisted: u.twisted, size: a.size }, opt || {}));
  }
  fxEclipseSkill(kind, u, opt) {
    if (!u) return;
    const a = this.unitFxAnchor(u);
    FX.eclipseSkill(kind, a.x, a.y, Object.assign({ face: u.face, size: a.size, owner: u }, opt || {}));
  }
  fxYattaSkill(kind, u, opt) {
    if (!u) return;
    const a = this.unitFxAnchor(u);
    FX.yattaSkill(kind, a.x, a.y, Object.assign({ face: u.face, size: a.size, owner: u }, opt || {}));
  }
  fxSoulvesterSkill(kind, u, opt) {
    if (!u) return;
    const a = this.unitFxAnchor(u);
    FX.soulvesterSkill(kind, a.x, a.y, Object.assign({ face: u.face, size: a.size, owner: u }, opt || {}));
  }
  fxBrightneySkill(kind, u, opt) {
    if (!u) return;
    const a = this.unitFxAnchor(u);
    FX.brightneySkill(kind, a.x, a.y, Object.assign({ face: u.face, size: a.size, owner: u }, opt || {}));
  }
  fxTeaganSkill(kind, u, opt) {
    if (!u) return;
    const a = this.unitFxAnchor(u);
    const point = target => {
      if (!target) return null;
      const p = this.unitFxAnchor(target);
      return Object.assign({ alive: target.alive, uid: target.uid }, p);
    };
    const o = Object.assign({ face: u.face, size: a.size, owner: u }, opt || {});
    if (o.target) o.target = point(o.target);
    if (o.allies) o.allies = o.allies.map(point).filter(Boolean);
    if (o.targets) o.targets = o.targets.map(point).filter(Boolean);
    FX.teaganSkill(kind, a.x, a.y, o);
  }
  fxShellySkill(kind, u, opt) {
    if (!u) return;
    const a = this.unitFxAnchor(u);
    const point = target => {
      if (!target) return null;
      const p = this.unitFxAnchor(target);
      return Object.assign({ alive: target.alive, uid: target.uid }, p);
    };
    const o = Object.assign({ face: u.face, size: a.size, owner: u }, opt || {});
    if (o.target) o.target = point(o.target);
    if (o.ally) o.ally = point(o.ally);
    if (o.corrected) o.corrected = point(o.corrected);
    if (o.allies) o.allies = o.allies.map(point).filter(Boolean);
    if (o.targets) o.targets = o.targets.map(point).filter(Boolean);
    FX.shellySkill(kind, a.x, a.y, o);
  }
  fxBlotSkill(kind, u, opt) {
    if (!u) return;
    const a = this.unitFxAnchor(u);
    FX.blotSkill(kind, a.x, a.y, Object.assign({ face: u.face, size: a.size, owner: u }, opt || {}));
  }
  fxRudieSkill(kind, u, opt) {
    if (!u) return;
    const a = this.unitFxAnchor(u), o = Object.assign({ face: u.face, size: a.size, owner: u }, opt || {});
    if (o.target) {
      const targetAnchor = this.unitFxAnchor(o.target);
      o.targetX = targetAnchor.x; o.targetY = targetAnchor.y; o.targetSize = targetAnchor.size;
    }
    FX.rudieSkill(kind, a.x, a.y, o);
  }
  fxScrapsCircle(u, radius, craft, powered) {
    if (u) FX.scrapsCircle(u.x, u.y - 6, radius, craft, powered);
  }
  fxScrapsShards(e, radius) { if (e) FX.scrapsShards(e.x, e.y - 6, radius); }
  fxScrapsCraftSwap(u, craft) { if (u) FX.scrapsCraftSwap(u.x, u.y - 6, craft); }
  heroSequence(u, key, castId) {
    const c = HERO_CINEMATICS[u.id];
    if (!c || c.noSequence) return;
    const allyTarget = typeof c.ally === 'function' ? c.ally(key) : c.ally;
    const target = allyTarget ? (u.id === 'Poppy' ? u : u.id === 'Scraps'
      ? (this.lowestHp(this.alliesOf(u).filter(a => a !== u && !a.minion)) || u)
      : this.lowestHp(this.alliesOf(u)))
      : (u.target && u.target.alive ? u.target : this.bestTarget(u));
    const castA = this.unitFxAnchor(u);
    const scrapsCraft = u.id === 'Scraps' && key === 'G'
      ? ['cardboard', 'cup', 'yarn'][((u.scrapsCraftIndex || 0) + 1) % 3] : u.scrapsCraft;
    const scrapsTarget = u.id === 'Scraps' && target ? this.unitFxAnchor(target) : null;
    if (c.signature) FX.heroSignature(c.signature, 'cast', castA.x, castA.y,
      { size: castA.size * (key === 'W' ? 1.12 : .92), face: u.face, ultimate: key === 'W',
        key, craft: scrapsCraft, targetX: scrapsTarget?.x, targetY: scrapsTarget?.y });
    else this.fxStatusOn(u, c.cast, { sizeMul: key === 'W' ? 1.08 : .90 });
    if (c.prop) FX.castProp(u.x + u.face * 22, u.y, c.prop, c.col, key === 'W' ? .56 : .42);
    Sound.play(c.s1, { vol: key === 'W' ? .38 : .22, throttle: 140 });
    this.after(key === 'W' ? .34 : .24, () => {
      if (!u.alive || (castId != null && u._castId !== castId) || !target || !target.alive) return;
      if (c.signature) {
        const hitA = this.unitFxAnchor(target);
        FX.heroSignature(c.signature, 'impact', hitA.x, hitA.y,
          { size: hitA.size * (key === 'W' ? 1.08 : .86), face: u.face, ultimate: key === 'W',
            key, craft: scrapsCraft });
      } else {
        this.fxStatusOn(target, c.impact, { sizeMul: key === 'W' ? 1.02 : .82 });
        FX.ring(target.x, target.y - 40, key === 'W' ? 120 : 82, c.col, .36);
      }
      Sound.play(c.s2, { vol: key === 'W' ? .34 : .18, throttle: 140 });
    });
  }
  fxStatusBurst(x, y, folder, opt) { FX.statusBurst(x, y, folder, opt); }
  fxTrainPass(u, dir, dur) {
    FX.trainPass(dir, this.leftWall, this.rightWall, this.ground, dur || .8, u);
  }
  fxCrack(x, y, s) { FX.crack(x, y, s || 1); }
  fxSmoke(x, y, n, c) { FX.smoke(x, y, n, c); }
  fxSplash(x, y, c, s) { FX.splash(x, y, c, s); }
  fxConfetti(x, y, n) { FX.confetti(x, y, n); }
  fxRodgerResearch(u, target, stacks, quiet) { FX.rodgerResearch(u.x, u.y, target.x, target.y, stacks, quiet); }
  fxRodgerCapsuleReady(u, dur) { FX.rodgerCapsuleReady(u.x, u.y, u.face, dur); }
  fxRodgerCapsuleImpact(target, stacks) { FX.rodgerCapsuleImpact(target.x, target.y, stacks); }
  fxRodgerCaseFile(u, target) { FX.rodgerCaseFile(u.x, u.y, target.x, target.y); }
  fxShrimpoTantrumStart(u, dur) { FX.shrimpoTantrumStart(u.x, u.y, u.face, dur); u._shrimpoTantrumBeat = 0; }
  fxShrimpoTantrumHit(u) { FX.shrimpoTantrumHit(u.x, u.y, u.face, u._shrimpoTantrumBeat++ || 0); }
  fxShrimpoBully(u, target, finisher) { FX.shrimpoBully(u.x, u.y, target.x, target.y, finisher); }
  fxShrimpoSpiteGain(u, stacks, max) { FX.shrimpoSpiteGain(u.x, u.y, stacks, max); }
  fxShrimpoSpiteBurst(u, target) { FX.shrimpoSpiteBurst(u.x, u.y, target.x, target.y); }
  fxRibeccaBones(u, target, lane) {
    if (!u || !target) return;
    const a = this.unitFxAnchor(u), t = this.unitFxAnchor(target);
    FX.ribeccaBones(a.x, a.y, t.x, t.y, u.face, lane || 0);
  }
  fxGigiWish(u, ally, opt) {
    if (!u || !ally) return;
    const a = this.unitFxAnchor(u), t = this.unitFxAnchor(ally);
    u.face = t.x >= a.x ? 1 : -1; u._gigiWishTargetX = t.x; u.dirty = true;
    FX.gigiWish(a.x, a.y, t.x, t.y, Object.assign({ face: u.face, owner: u }, opt || {}));
  }
  fxVeeSpotlight(u, foes, headline) { FX.veeSpotlight(u.x, u.y, u.face, foes, headline); }
  fxVeeAudience(u, allies) { FX.veeAudience(u.x, u.y, u.face, allies); }
  fxVeeCommercial(u, allies, enemies) { FX.veeCommercial(u.x, u.y, u.face, this.midX, this.ground, allies, enemies); }
  fxFlyteGust(u, target, radius, dur) { FX.flyteGust(u.x, u.y, target.x, target.y, radius, dur); }
  fxFlyteRescue(u, target) { FX.flyteRescue(u.x, u.y, target.x, target.y); }
  fxFlyteClearWay(u, dest, dur) { FX.flyteClearWay(u.x, u.y, dest, dur); }
  fxFlytePass(target, ally) { FX.flytePass(target.x, target.y, ally); }
  fxFlyteCyclone(u, target, radius, dur) {
    const tx = target ? target.x : u.x, ty = target ? target.y : u.y;
    if (FX.flyteCyclone) FX.flyteCyclone(u.x, u.y, tx, ty, radius, dur);
    else FX.flyteGust(u.x, u.y, tx, ty, radius, dur);
  }
  fxFlyteWingSlam(u, target) {
    if (FX.flyteWingSlam) FX.flyteWingSlam(u.x, u.y, target.x, target.y);
    else FX.flyteRescue(u.x, u.y, target.x, target.y);
  }
  fxFlyteMockingSwoop(u, ally, dur) {
    const ax = ally ? ally.x : u.x, ay = ally ? ally.y : u.y;
    if (FX.flyteMockingSwoop) FX.flyteMockingSwoop(u.x, u.y, ax, ay, dur);
    else FX.flyteGust(u.x, u.y, ax, ay, 200, dur);
  }
  fxFlyteStubbornDowndraft(u, attacker) {
    const ax = attacker ? attacker.x : u.x + u.face * 60, ay = attacker ? attacker.y : u.y;
    if (FX.flyteStubbornDowndraft) FX.flyteStubbornDowndraft(u.x, u.y, ax, ay);
    else FX.flytePass(attacker || u, false);
  }
  fxFlutterEntry(x, y, toX, dir, dur) { FX.flutterEntry(x, y, toX, dir, dur); }
  fxFlutterDash(x, y, toX, dir, dur, returning) { FX.flutterDash(x, y, toX, dir, dur, returning); }
  fxFlutterGust(x, y, tx, ty, radius, face) { FX.flutterGust(x, y, tx, ty, radius, face); }
  fxFlutterTrail(x, y, face, dur) { FX.flutterTrail(x, y, face, dur); }
  fxFlutterWingstorm(x, y, radius, dur) { FX.flutterWingstorm(x, y, radius, dur); }
  fxFlutterHit(target, returning) { if (target) FX.flutterHit(target, returning); }
  fxFlutterIntercept(target) { if (target) FX.flutterIntercept(target); }
  fxFlutterFlyby(u) { if (u) FX.flutterFlyby(u); }
  fxFlutterSilent(a, b) { FX.flutterSilent(a, b); }
  fxFlutterLift(u, stacks, max) { if (u) FX.flutterLift(u, stacks, max); }
  fxFlutterDizzy(target) { if (target) FX.flutterDizzy(target); }
  fxTishaLines(lines, dur, permanent) { FX.tishaLines(lines, this.ground, dur || 1, permanent); }
  fxTishaSweep(u, target, wide) {
    const toX = target ? target.x : (u.face > 0 ? this.rightWall - 18 : this.leftWall + 18);
    FX.tishaSweep(u.x, toX, (target ? target.y : u.y) - 34, u.face, wide);
  }
  fxTishaDust(x, width, dur, reduced) { FX.tishaDust(x, this.ground, width, dur, reduced); }
  fxGourdyTreatCast(u) { FX.gourdyTreatCast(u.x, u.y, u.face); }
  fxBobetteSkill(kind, u, opt) {
    if (!u) return;
    const a = this.unitFxAnchor(u);
    FX.bobetteSkill(kind, a.x, a.y, Object.assign({ size: a.size, face: u.face }, opt || {}));
  }
  fxSquirmSkill(kind, u, opt) {
    if (!u) return;
    const a = this.unitFxAnchor(u);
    FX.squirmSkill(kind, a.x, a.y, Object.assign({ size: a.size }, opt || {}));
  }
  fxGourdyTreat(u, target, treat, smaller) {
    const candy = {
      atkup: 'Skillcheckcandy',
      speedup: 'Speedcandy',
      fortify: 'Staminacandy',
      haste: 'Enigmacandy',
      mdefup: 'Staminacandy',
      lucky: 'Skillcheckcandy',
      overcharge: 'Enigmacandy'
    }[treat.status] || 'Speedcandy';
    FX.gourdyTreat(u.x, u.y, target.x, target.y, candy, smaller);
  }
  fxSproutSkill(kind, u, target, targets, opt) {
    if (!u) return;
    FX.sproutSkill(kind, u.x, u.y, Object.assign({ face: u.face, target, targets }, opt || {}));
  }
  fxAstroSkill(kind, u, target, targets, opt) {
    if (!u) return;
    FX.astroSkill(kind, u.x, u.y, Object.assign({ face: u.face, target, targets }, opt || {}));
  }
  fxBassieSkill(kind, u, opt) {
    if (!u) return;
    FX.bassieSkill(kind, u.x, u.y, Object.assign({ face: u.face }, opt || {}));
  }
  fxBassieImpact(target, opt) {
    if (!target) return;
    FX.bassieImpact(target.x, target.y - 40, opt || {});
  }
  fxWaxwellSkill(kind, u, opt) {
    if (!u) return;
    FX.waxwellSkill(kind, u.x, u.y, Object.assign({ face: u.face, ground: this.ground }, opt || {}));
  }
  fxWaxwellFigure(kind, u, record, target) {
    if (!u || !record) return;
    FX.waxFigure(kind, record, target, { ground: this.ground, face: u.face });
  }
  fxPhantasiaWish(kind, target) {
    if (!target) return;
    FX.phantasiaWish(kind, target.x, target.y);
  }
  fxWaxZone(x, type, radius, dur, y) { FX.waxZone(x, y == null ? this.ground : y, type, radius, dur); }
  fxWaxTrail(u, endX, type, dur, endY) { FX.waxTrail(u.x, u.y, endX, endY == null ? u.y : endY, u.face, type, dur); }
  fxGourdyRush(u, allies, smaller) { FX.gourdyRush(u.x, u.y, allies, smaller); }
  fxGourdyPumpkinImpact(target, effect) {
    const icons = { stun: '😵', silence: '🔇', slow: '🐢', drain: '🕳' };
    FX.gourdyPumpkinImpact(target.x, target.y, icons[effect] || '🎃');
  }
  fxGourdyCandyFountain(x, y) { if (FX.gourdyCandyFountain) FX.gourdyCandyFountain(x, y); }
  fxGourdyMegaPumpkin(u, target, isFamily) { if (FX.gourdyMegaPumpkin) FX.gourdyMegaPumpkin(u, target, isFamily); }
  fxToodlesHammer(u, target, boost) { if (FX.toodlesHammerSmash) FX.toodlesHammerSmash(u.x, u.y, target.x, target.y, boost); }
  fxToodlesMiracle(target) {
    if (FX.toodlesMiracleShield) FX.toodlesMiracleShield(target.x, target.y);
    if (FX.toodlesDogPlushCheer) FX.toodlesDogPlushCheer(target.x, target.y);
  }
  fxQomDrum(x, y, beat, power) { if (FX.qomGourdyDrumBlast) FX.qomGourdyDrumBlast(x, y, beat, power); }
  fxLooeySkill(kind, u, opt) {
    if (!u) return;
    const a = this.unitFxAnchor(u), o = Object.assign({ face: u.face, size: a.size }, opt || {});
    const point = target => {
      if (!target) return null;
      const p = this.unitFxAnchor(target);
      return Object.assign({ alive: target.alive, uid: target.uid }, p);
    };
    if (o.target) o.target = point(o.target);
    if (o.allies) o.allies = o.allies.map(point).filter(Boolean);
    FX.looeySkill(kind, a.x, a.y, o);
  }
  fxNotes(x, y, n) { FX.notes(x, y, n); }
  fxBark(u, n, col) { FX.barkWave(u.x, u.y, u.face, n, col); }
  fxInkSplat(x, y) { FX.inkSplat(x, y); }
  fxScribble(x, y) { FX.scribble(x, y); }
  fxVines(x, y) { FX.vines(x, y); }
  fxShatter(u) { FX.shatter(u.x, u.y); }
  fxBlood(x, y) { FX.blood(x, y); }
  fxPool(x, dur, col, w) { FX.pool(x, dur, col, w); }
  fxSteam(x, y, n) { FX.steam(x, y, n); }
  fxAura(u, col, dur) { FX.aura(u.x, u.y, col, dur); }
  fxSweep(u, dur, col) { FX.sweep(u.x, u.y, u.face, dur, col); }
  fxBigStroke(u, col) { FX.bigStroke(u.x, u.y - 60, col, u.face); }
  fxPaintCast(u, colors, mode) { FX.paintCast(u.x, u.y, u.face, colors, mode); }
  fxPaintStroke(u, colors, full) {
    const from = full ? (u.face > 0 ? this.leftWall - 15 : this.rightWall + 15) : u.x + u.face * 18;
    const to = u.face > 0 ? this.rightWall + 20 : this.leftWall - 20;
    FX.paintStroke(from, to, u.y - 64, colors, { full: !!full });
  }
  fxPaintCanvas(u, dur, colors, full) {
    if (!u) return;
    const width = full ? this.W + 80 : Math.min(390, this.W * .72);
    const paintX = full ? this.midX : clamp(u.x + u.face * 72, this.leftWall, this.rightWall);
    FX.paintCanvas(paintX, u.y, dur, colors, width, u.x + u.face * 30);
  }
  fxPaintRibbon(from, to, colors) { FX.paintRibbon(from.x, from.y - 64, to.x, to.y - 58, colors); }
  fxPaintMark(x, y, colors, scale, ground) { FX.paintMark(x, y, colors, scale, ground); }
  fxWave(x, y, dir, col) { FX.wave(x, y, dir, col); }
  fxNet(u, foes) { if (foes.length) FX.net(u.x, foes[foes.length - 1].x, u.y); }
  fxLift(u, dur) { u.liftT = dur; }
  fxStarfall(x, y, cb) { FX.starfall(x, y); this.after(.29, () => cb && cb()); }
  fxHeartLink(a, b) { FX.heartLink(a.x, a.y - 60, b.x, b.y - 60); }
  fxCrackAt(x, y) { FX.crack(x, y, 1); }

  /** Travelling projectile.
      The hit resolves on a simulation timer so combat never depends on the
      render loop; the moving sprite is decoration layered on top. */
  fxProj(from, to, opt, onHit) {
    if (!from || !to) { onHit && onHit(to); return; }
    const dur = clamp(Math.abs(to.x - from.x) / 1400, .09, .34);
    this.after(dur, () => onHit && onHit(to));
    this._flyVisual(from, to, opt, dur, false);
  }
  fxArc(from, to, opt, onHit) {
    if (!from || !to) { onHit && onHit(to); return; }
    const dur = .42;
    this.after(dur, () => onHit && onHit(to));
    this._flyVisual(from, to, opt, dur, true);
  }
  _flyVisual(from, to, opt, dur, arc) {
    if (!FX.ok()) return;
    const sx = from.x + (arc ? 0 : from.face * 26), sy = from.y - (arc ? 70 : 62);
    const tx = to.x, ty = to.y - (arc ? 60 : 62);
    const n = FX.proj(sx, sy, opt);
    const ang = Math.atan2(ty - sy, tx - sx);
    const t0 = performance.now();
    const ms = dur * 1000 / Math.max(.35, this.speed);
    const step = () => {
      const p = clamp((performance.now() - t0) / ms, 0, 1);
      const x = lerp(sx, tx, p);
      const y = lerp(sy, ty, p) - (arc ? Math.sin(p * Math.PI) * 150 : 0);
      const spin = opt && opt.spin ? p * opt.spin : arc ? p * 10 : (opt && opt.kind === 'craft' ? p * 8 : 0);
      n.style.transform = `translate(${x}px,${y}px) rotate(${(arc ? 0 : ang) + spin}rad)`;
      if (p < 1) {
        // Projectiles are decorative; on a loaded full-party battle, update
        // them on the same lighter visual cadence as the stage instead of
        // creating one rAF callback per projectile every paint.
        if (FX._projectileFrameMs) setTimeout(step, FX._projectileFrameMs);
        else requestAnimationFrame(step);
      } else n.remove();
    };
    requestAnimationFrame(step);
    setTimeout(() => n.remove(), ms + 400);
  }

  /* ---------- end ---------- */
  checkEnd() {
    if (this.over) return;
    const p = this.units.some(u => u.alive && u.team === TEAM_P && !u.minion);
    const e = this.units.some(u => u.alive && u.team === TEAM_E && !u.minion);
    if (p && e) {
      if (this.t > this.timeLimit) { this.finish(!!this.meta.timeoutWin, this.meta.timeoutWin ? 'Survived' : 'Time'); }
      return;
    }
    if (this.units.some(u => u._vanillaPendingRevive)) return;
    this.finish(p, p ? 'Victory' : 'Defeat');
  }

  /** The countdown chip in the top HUD. Throttled since it only needs whole seconds. */
  updateTimer(force) {
    const left = Math.max(0, Math.ceil(this.timeLimit - this.t));
    if (!force && left === this._timerShown) return;
    this._timerShown = left;
    const m = Math.floor(left / 60), s = left % 60;
    const el = this._timerEl || (this._timerEl = $('#hudTimerText'));
    if (!el) return;
    el.textContent = m + ':' + (s < 10 ? '0' : '') + s;
    el.parentElement.classList.toggle('low', left <= 30);
  }

  finish(win, why) {
    if (this.over) return;
    this.over = true; this.running = false;
    const partyIds = this.units.filter(u => u.team === TEAM_P && !u.minion).map(u => u.id);
    const enemyIds = this.units.filter(u => u.team === TEAM_E && !u.minion).map(u => u.id);
    if (!this.offscreen && typeof Achievements !== 'undefined') {
      if (win && enemyIds.includes('Dandy')) Achievements.record('dandyDefeat', 1);
      if (!win && !this.units.some(u => u.team === TEAM_P && !u.minion && u.alive)) Achievements.record('partyWipe', 1);
    }
    this.result = { win, why, machineSuccess: !!this._machineSuccess, machineReduced: !!this._machineReduced,
      survivors: this.units.filter(u => u.alive && u.team === TEAM_P && !u.minion), teamIds: partyIds, enemyIds };
    if (!this.offscreen && win) FX.flash('#fff', .5, .6);   // the results card handles the fanfare
    if (!this.offscreen) setTimeout(() => this.onEnd && this.onEnd(this.result), 700);
  }

  /** Between event waves, survivors leave through the far side of the live
      battlefield. This deliberately runs outside combat time: no statuses,
      cooldowns, enemies, or timers advance while the team travels onward. */
  exitWalk(onDone) {
    const team = this.units.filter(u => u.alive && u.team === TEAM_P && !u.minion);
    if (!team.length) { onDone(); return; }
    this._exitWalking = true;
    $('#battleHud').classList.add('wave-exit');
    const starts = new Map(team.map(u => [u, u.x]));
    team.forEach(u => {
      u.face = 1; u.moving = false; u.vx = 125; u.vy = 0;
      u.animT = 0; u.animStyle = null; u.turnT = 0; u.yOff = 0;
      u._exitStarted = false;
    });

    let elapsed = 0, last = performance.now();
    const dur = 1.18, stagger = .10;
    const total = dur + (team.length - 1) * stagger;
    const tick = now => {
      const dt = Math.min((now - last) / 1000, .05);
      last = now; elapsed += dt;
      team.forEach((u, i) => {
        const local = elapsed - i * stagger;
        if (local <= 0) return;
        if (!u._exitStarted) {
          u._exitStarted = true;
          Sound.play((u.def.move && u.def.move.step) || 'step', { vol: .3, throttle: 70 });
        }
        const p = clamp(local / dur, 0, 1);
        u.moving = p < 1;
        u.x = lerp(starts.get(u), this.rightWall + 210 + i * 22, ease.in(p));
      });
      FX.update(dt); this.render(dt);
      if (elapsed < total) { scheduleBattleFrame(tick); return; }
      team.forEach(u => { u.moving = false; });
      onDone();
    };
    scheduleBattleFrame(tick);
  }

  stopBattle() { this.stopMachinePrelude(); this.running = false; this.over = true; }

  /* ---------- render ---------- */
  render(dt) {
    const t = this.t;
    this.updateTimer();
    this.units.forEach(u => {
      if (!u.el) return;
      if (!u.alive) return;
      const mv = u.def.move || {};
      // A slower clock keeps movement grounded. Earlier versions drove the
      // same springy loop at high speed both while moving and at rest, which
      // made every cutout feel like it was bouncing on a trampoline.
      u.bobT += dt * (u.moving ? (mv.freq || 1.5) * 1.65 : (mv.freq || 1.5) * .52);

      // --- movement personality -------------------------------------
      let bob = 0, lean = 0, sqx = 1, sqy = 1, rot = 0, extraY = 0, bodyOpacity = 1;
      const speedRatio = clamp(Math.hypot(u.vx, u.vy || 0) / 140, 0, 1.4);
      const g = mv.gait || 'march';
      const B1 = Math.sin(u.bobT * 2), B2 = Math.abs(Math.sin(u.bobT * 2));

      if (g === 'float' || g === 'glide') {
        bob = -(mv.hover || 10) - Math.sin(u.bobT) * (mv.bob || 6) * .42;
        rot = Math.sin(u.bobT * .7) * (mv.sway || 3) * .45 * Math.PI / 180;
        lean = -speedRatio * (mv.lean || 4);
      } else if (g === 'bounce' || g === 'hop') {
        const step = Math.sin(u.bobT * 1.25), lift = Math.max(0, step);
        bob = -lift * (mv.bob || 10) * (u.moving ? .48 : .14);
        sqy = 1 + lift * (mv.squash || .08) * .22 - (1 - lift) * (mv.squash || .08) * .12;
        sqx = 2 - sqy;
        lean = -speedRatio * (mv.lean || 5);
      } else if (g === 'stomp' || g === 'trudge') {
        bob = -B2 * (mv.bob || 3) * (u.moving ? .62 : .20);
        sqy = 1 - B2 * (mv.squash || .06) * (u.moving ? .42 : .15);
        sqx = 2 - sqy;
        lean = -speedRatio * (mv.lean || 5);
      } else if (g === 'sprint' || g === 'skitter' || g === 'march') {
        bob = -B2 * (mv.bob || 5) * (u.moving ? .58 : .18);
        lean = -speedRatio * (mv.lean || 14) * .55;
        sqx = 1 + speedRatio * .035; sqy = 2 - sqx;
        if (mv.jitter && u.moving) { bob += rnd(-mv.jitter, mv.jitter); }
      } else if (g === 'flop') {
        bob = -Math.abs(Math.sin(u.bobT * 1.3)) * (mv.bob || 10) * (u.moving ? .52 : .16);
        rot = Math.sin(u.bobT * 1.3) * (mv.wobble || 10) * .42 * Math.PI / 180;
        sqy = 1 + Math.sin(u.bobT * 2.6) * (mv.squash || .1) * .24;
        sqx = 2 - sqy;
      } else if (g === 'ooze') {
        sqy = 1 + Math.sin(u.bobT * .9) * (mv.squash || .1) * .35;
        sqx = 2 - sqy;
        bob = -Math.abs(Math.sin(u.bobT * .9)) * (mv.bob || 3) * .42;
        lean = -speedRatio * (mv.lean || 4) * .55;
      } else if (g === 'roll') {
        rot = u.x * .012;
        bob = -Math.abs(Math.sin(u.bobT * 2)) * (mv.bob || 4) * .5;
      } else if (g === 'waddle') {
        rot = Math.sin(u.bobT * 1.8) * 7 * .45 * Math.PI / 180 * (u.moving ? 1 : .25);
        bob = -B2 * (mv.bob || 6) * (u.moving ? .5 : .15);
      } else if (g === 'swagger') {
        rot = Math.sin(u.bobT * 1.4) * 4 * .45 * Math.PI / 180;
        bob = -B2 * (mv.bob || 6) * (u.moving ? .5 : .15);
        lean = -speedRatio * (mv.lean || -6) * .55;
      }

      // idle breathing on top of everything
      if (!u.moving) { const br = Math.sin(u.bobT * .8) * .005; sqy += br; sqx -= br; }
      if (u.id === 'Coal' && !u.moving && u.animT <= 0) {
        // A pet rock still shifts her weight and breathes between threats;
        // the tiny asymmetric sway keeps her from reading as a static prop.
        const settle = Math.sin(u.bobT * .72), breath = Math.sin(u.bobT * .36);
        bob -= Math.abs(settle) * 1.4; lean += settle * 2.2;
        sqx += breath * .018; sqy -= breath * .018;
      }

      // reaction states
      if (u.hitT > 0) {
        u.hitT -= dt;
        const k = u.hitT / .10;
        sqx += .16 * k; sqy -= .12 * k;
      }
      if (u.shakeT > 0) { u.shakeT -= dt; extraY = rnd(-6, 6); rot += rnd(-.12, .12); }
      if (u.spinT > 0) { u.spinT -= dt; rot += this.t * 22; }
      if (u.liftT > 0) { u.liftT -= dt; extraY = -70; }
      if (u.turnT > 0) {
        u.turnT -= dt;
        const k = clamp(u.turnT / .24, 0, 1);
        // A compressed, leaning beat conceals the sprite flip and makes the
        // change of attention read as an intentional pivot.
        sqx -= .11 * k; sqy += .08 * k; rot -= u.face * .16 * k;
      }
      if (u.animT > 0) {
        // Action atlases and their hit callbacks both live on combat time.
        // Keeping this on real time made multi-hit collaboration moves drift
        // apart as soon as the battle speed changed.
        u.animT -= dt * this.speed * COMBAT_TIME_SCALE;
        const k = clamp(u.animT, 0, 1);
        const phase = 1 - clamp(u.animT / Math.max(.01, u.animDur || 1), 0, 1);
        // Authored atlases already contain their wind-up, strike, spin and
        // recovery. Applying the generic cutout transforms on top rotated the
        // entire effects-sized cell, causing clipping and apparent frame
        // merging. Natural sprites only need their frame player here.
        if (!u.naturalSprite && u.animStyle === 'mrsHollowayExplosion') {
          const rise = Math.sin(phase * Math.PI), pulse = Math.sin(phase * Math.PI * 4);
          bob -= rise * 24; rot += u.face * pulse * rise * .08;
          sqx += rise * .24; sqy += rise * .18;
        } else if (!u.naturalSprite && u.animStyle === 'mrsHollowayApparition') {
          const glide = Math.sin(phase * Math.PI);
          lean += u.face * glide * 24; bob -= glide * 16;
          sqx += glide * .18; sqy -= glide * .10;
        } else if (!u.naturalSprite && u.animStyle === 'mrsHollowayEmbrace') {
          const embrace = Math.sin(phase * Math.PI), spin = Math.sin(phase * Math.PI * 2);
          bob -= embrace * 15; rot += u.face * spin * .06;
          sqx += embrace * .14; sqy += embrace * .12;
        } else if (!u.naturalSprite && u.animStyle === 'mrHollowaySlam') {
          const wind = phase < .42 ? Math.sin(phase / .42 * Math.PI * .5) : 0;
          const slam = phase >= .42 ? Math.sin((phase - .42) / .58 * Math.PI) : 0;
          bob -= wind * 14 - slam * 18; lean += u.face * wind * 24 - u.face * slam * 52;
          rot += u.face * (wind * .08 - slam * .15);
          sqx += slam * .28; sqy -= wind * .08 - slam * .15;
        } else if (!u.naturalSprite && u.animStyle === 'mrHollowayBrace') {
          const plant = Math.sin(phase * Math.PI), stomp = Math.abs(Math.sin(phase * Math.PI * 3));
          bob += plant * 6; lean -= u.face * plant * 14;
          rot -= u.face * stomp * .04; sqx += plant * .22; sqy -= plant * .12;
        } else if (!u.naturalSprite && u.animStyle === 'mrHollowayRoot') {
          const dig = Math.sin(phase * Math.PI);
          bob += dig * 9; sqx += dig * .20; sqy -= dig * .10;
        } else if (!u.naturalSprite && u.animStyle === 'gourdyCandyToss') {
          const hop = Math.sin(phase * Math.PI);
          bob -= hop * 18; rot += u.face * hop * .08;
          sqx += hop * .16; sqy -= hop * .08;
        } else if (!u.naturalSprite && u.animStyle === 'looeyInflate') {
          const inflate = Math.sin(phase * Math.PI);
          bob -= inflate * 13; sqx += inflate * .24; sqy -= inflate * .13;
          rot += u.face * Math.sin(phase * Math.PI * 2) * inflate * .035;
        } else if (!u.naturalSprite && u.animStyle === 'looeyBounce') {
          const wind = phase < .42 ? Math.sin(phase / .42 * Math.PI * .5) : 0;
          const launch = phase >= .42 ? Math.sin((phase - .42) / .58 * Math.PI) : 0;
          bob -= wind * 8 + launch * 16; lean += u.face * wind * 20 - u.face * launch * 35;
          sqx += wind * .12 + launch * .14; sqy -= launch * .10;
        } else if (!u.naturalSprite && u.animStyle === 'looeyLaunch') {
          const launch = Math.sin(phase * Math.PI);
          bob -= launch * 18; lean -= u.face * launch * 48; rot += u.face * launch * .10;
          sqx += launch * .18; sqy -= launch * .12;
        } else if (!u.naturalSprite && u.animStyle === 'looeyHustle') {
          const bounce = Math.abs(Math.sin(phase * Math.PI * 5));
          bob -= bounce * 12; rot += u.face * Math.sin(phase * Math.PI * 5) * .08;
        } else if (!u.naturalSprite && u.animStyle === 'looeyShow') {
          const show = Math.sin(phase * Math.PI * 4);
          bob -= Math.abs(show) * 8; rot += u.face * show * .035; sqx += Math.abs(show) * .08;
        } else if (!u.naturalSprite && u.animStyle === 'poppyBasicWind') {
          const charge = Math.sin(phase * Math.PI);
          bob += charge * 4; lean -= u.face * charge * 10;
          sqx += charge * .10; sqy += charge * .08;
        } else if (!u.naturalSprite && u.animStyle === 'poppyBasicBump') {
          const bump = Math.sin(phase * Math.PI);
          bob -= bump * 12; lean -= u.face * bump * 34;
          sqx += bump * .16; sqy -= bump * .10;
        } else if (!u.naturalSprite && u.animStyle === 'poppyBounceRush') {
          const wind = clamp(phase / .22, 0, 1);
          const hops = phase > .18 ? Math.abs(Math.sin((phase - .18) / .82 * Math.PI * 4)) : 0;
          const launch = phase > .18 ? Math.sin((phase - .18) / .82 * Math.PI) : 0;
          bob += wind * 7 - hops * 20 - launch * 5;
          lean -= u.face * wind * 18;
          rot += u.face * Math.sin((phase - .18) * Math.PI * 8) * .08;
          sqx += wind * .18 + hops * .12; sqy += wind * .14 - hops * .12;
        } else if (!u.naturalSprite && u.animStyle === 'poppyBubbleGuard') {
          const inflate = Math.sin(phase * Math.PI);
          const pulse = Math.sin(phase * Math.PI * 4);
          sqx += inflate * .30 + Math.max(0, pulse) * .035;
          sqy += inflate * .25 - Math.max(0, pulse) * .025;
          bob -= inflate * 8; rot += pulse * .025;
        } else if (!u.naturalSprite && u.animStyle === 'poppyPopShock') {
          const charge = clamp(phase / .52, 0, 1);
          const burst = phase > .52 ? Math.sin((phase - .52) / .48 * Math.PI) : 0;
          sqx -= charge * .26; sqy += charge * .32;
          sqx += burst * .48; sqy -= burst * .34; bob += charge * 9 - burst * 21;
          rot += u.face * burst * .12;
        } else if (!u.naturalSprite && u.animStyle === 'poppyPressure') {
          const swell = Math.sin(phase * Math.PI);
          sqx += swell * .24; sqy += swell * .18; bob -= swell * 10;
          rot += u.face * Math.sin(phase * Math.PI * 2) * .045;
        } else if (!u.naturalSprite && u.animStyle === 'poppyBigBubble') {
          bob -= 22 + Math.sin(phase * Math.PI * 4) * 7;
          rot += Math.sin(phase * Math.PI * 3) * .07;
          sqx += .12 + Math.sin(phase * Math.PI * 2) * .025;
          sqy += .12 - Math.sin(phase * Math.PI * 2) * .025;
        } else if (!u.naturalSprite && u.animStyle === 'poppyBurst') {
          const burst = Math.sin(phase * Math.PI);
          sqx += burst * .38; sqy += burst * .48; bob -= burst * 22;
        } else if (!u.naturalSprite && u.animStyle === 'cocoaBasicWind') {
          const prep = Math.sin(phase * Math.PI);
          bob += prep * 3; lean += u.face * prep * 12;
          rot += u.face * prep * .035; sqx += prep * .06; sqy += prep * .04;
        } else if (!u.naturalSprite && u.animStyle === 'cocoaBasicFlick') {
          const flick = Math.sin(phase * Math.PI);
          bob -= flick * 7; lean -= u.face * flick * 26;
          rot += u.face * flick * .07; sqx += flick * .13; sqy -= flick * .06;
        } else if (!u.naturalSprite && u.animStyle === 'cocoaBonbonBurst') {
          const gather = Math.sin(Math.min(1, phase / .42) * Math.PI * .5);
          const cheer = Math.sin(phase * Math.PI * 2) * Math.sin(phase * Math.PI);
          bob -= gather * 12 + Math.max(0, cheer) * 4;
          lean += u.face * gather * 16; rot += u.face * cheer * .045;
          sqx += gather * .12; sqy -= gather * .10;
        } else if (!u.naturalSprite && (u.animStyle === 'cocoaShareShield' || u.animStyle === 'cocoaShareCleanse')) {
          const share = Math.sin(phase * Math.PI);
          const pulse = Math.sin(phase * Math.PI * (u.animStyle === 'cocoaShareCleanse' ? 4 : 2));
          bob -= share * 10; lean -= u.face * share * 13;
          rot += u.face * pulse * share * .035;
          sqx += share * .14 + Math.max(0, pulse) * .025;
          sqy += share * .08 - Math.max(0, pulse) * .025;
        } else if (!u.naturalSprite && u.animStyle === 'cocoaChocolateToss') {
          const wind = phase < .42 ? Math.sin(phase / .42 * Math.PI * .5) : 0;
          const toss = phase >= .32 ? Math.sin(clamp((phase - .32) / .68, 0, 1) * Math.PI) : 0;
          bob += wind * 5 - toss * 7;
          lean += u.face * wind * 18 - u.face * toss * 35;
          rot += u.face * (wind * .07 - toss * .11);
          sqx += wind * .08 + toss * .17; sqy -= toss * .07;
        } else if (!u.naturalSprite && u.animStyle === 'delilahNoteWind') {
          const focus = Math.sin(phase * Math.PI);
          bob += focus * 2; lean -= u.face * focus * 9;
          rot += u.face * focus * .035; sqx += focus * .05; sqy += focus * .03;
        } else if (!u.naturalSprite && u.animStyle === 'delilahNote') {
          const note = Math.sin(phase * Math.PI);
          bob -= note * 5; lean -= u.face * note * 19;
          rot += u.face * note * .055; sqx += note * .10; sqy -= note * .04;
        } else if (!u.naturalSprite && u.animStyle === 'delilahExperiment') {
          const examine = Math.sin(Math.min(1, phase / .46) * Math.PI * .5);
          const pulse = Math.sin(phase * Math.PI * 4) * examine;
          bob -= examine * 11; lean += u.face * examine * 13;
          rot += u.face * pulse * .045; sqx += examine * .12; sqy -= examine * .08;
        } else if (!u.naturalSprite && (u.animStyle === 'delilahInject' || u.animStyle === 'delilahInjectRelease' || u.animStyle === 'delilahSampleRelease')) {
          const charge = u.animStyle === 'delilahInject'
            ? Math.sin(Math.min(1, phase / .62) * Math.PI * .5)
            : Math.sin(phase * Math.PI);
          const snap = u.animStyle !== 'delilahInject' ? Math.sin(phase * Math.PI) : 0;
          bob += charge * 5 - snap * 7; lean += u.face * charge * 18 - u.face * snap * 29;
          rot += u.face * (charge * .05 - snap * .08);
          sqx += charge * .09 + snap * .15; sqy -= charge * .06 + snap * .05;
        } else if (!u.naturalSprite && u.animStyle === 'delilahContainment') {
          const lock = Math.sin(phase * Math.PI), pulse = Math.sin(phase * Math.PI * 5) * lock;
          bob -= lock * 9; lean -= u.face * lock * 12;
          rot += u.face * pulse * .04; sqx += lock * .13; sqy += lock * .10;
        } else if (!u.naturalSprite && u.animStyle === 'gourdyTreat') {
          const hop = Math.sin(phase * Math.PI);
          const wiggle = Math.sin(phase * Math.PI * 4);
          bob -= hop * 20; rot += u.face * wiggle * .11;
          sqx += hop * .16; sqy += hop * .10;
        } else if (!u.naturalSprite && u.animStyle === 'gourdyRush') {
          const hop = Math.abs(Math.sin(phase * Math.PI * 3));
          bob -= hop * 24; rot += u.face * Math.sin(phase * Math.PI * 3) * .12;
          sqx += hop * .13; sqy -= hop * .08;
        } else if (!u.naturalSprite && u.animStyle === 'gourdyToss') {
          const wind = phase < .42 ? Math.sin(phase / .42 * Math.PI * .5) : Math.max(0, 1 - (phase - .42) / .58);
          const snap = phase >= .42 ? Math.sin((phase - .42) / .58 * Math.PI) : 0;
          lean += u.face * wind * 24; lean -= u.face * snap * 48;
          bob -= snap * 9; sqx += snap * .14; sqy -= wind * .09;
        } else if (!u.naturalSprite && u.animStyle === 'shellyRainbow') {
          const pulse = Math.sin(phase * Math.PI);
          bob -= pulse * 12; sqx += pulse * .16; sqy += pulse * .10;
          rot += Math.sin(phase * Math.PI * 2) * .08;
        } else if (!u.naturalSprite && u.animStyle === 'shellyPepTalk') {
          const nod = Math.sin(phase * Math.PI * 3);
          bob -= Math.max(0, nod) * 7; lean += u.face * nod * 8;
        } else if (!u.naturalSprite && u.animStyle === 'shellyBeam') {
          const focus = Math.sin(phase * Math.PI);
          lean += u.face * focus * 18; sqx += focus * .12; sqy -= focus * .06;
        } else if (!u.naturalSprite && u.animStyle === 'shellyRally') {
          const rally = Math.sin(phase * Math.PI), clap = Math.sin(phase * Math.PI * 4);
          bob -= rally * 15; lean -= u.face * rally * 12; rot += u.face * clap * rally * .045;
          sqx += rally * .14; sqy -= rally * .10;
        } else if (!u.naturalSprite && u.animStyle === 'shellyFieldAid') {
          const read = phase < .42 ? Math.sin(phase / .42 * Math.PI * .5) : 0;
          const handoff = phase >= .38 ? Math.sin((phase - .38) / .62 * Math.PI) : 0;
          lean -= u.face * read * 18; lean += u.face * handoff * 28;
          bob -= handoff * 7; sqx += handoff * .14; sqy -= read * .06;
        } else if (!u.naturalSprite && u.animStyle === 'shellyExhibit') {
          const open = Math.sin(phase * Math.PI), scan = Math.sin(phase * Math.PI * 6);
          bob -= open * 13; lean += u.face * open * 20; rot += u.face * scan * open * .045;
          sqx += open * .12; sqy -= open * .08;
        } else if (!u.naturalSprite && u.animStyle === 'shellyEncore') {
          const jump = Math.sin(phase * Math.PI), sparkle = Math.sin(phase * Math.PI * 8);
          bob -= jump * 23; lean -= u.face * sparkle * jump * 8; rot += u.face * sparkle * jump * .055;
          sqx += jump * .18; sqy -= jump * .13;
        } else if (!u.naturalSprite && u.animStyle === 'astroNap') {
          const drift = Math.sin(phase * Math.PI * 2);
          bob -= 18 + drift * 5; rot += drift * .06; sqx += Math.abs(drift) * .06;
        } else if (!u.naturalSprite && u.animStyle === 'astroWatch') {
          const watch = Math.sin(phase * Math.PI);
          lean -= u.face * watch * 12; bob -= watch * 5;
        } else if (!u.naturalSprite && u.animStyle === 'astroOrbit') {
          const orbit = Math.sin(phase * Math.PI * 2);
          rot += orbit * .16; sqx += Math.abs(orbit) * .12; bob -= Math.abs(orbit) * 6;
        } else if (!u.naturalSprite && u.animStyle === 'astroStory') {
          const story = Math.sin(phase * Math.PI), page = Math.sin(phase * Math.PI * 5);
          bob -= 15 + story * 7; lean -= u.face * story * 10; rot += page * story * .045;
          sqx += story * .10; sqy += story * .07;
        } else if (!u.naturalSprite && u.animStyle === 'astroNightlight') {
          const lamp = Math.sin(phase * Math.PI), sway = Math.sin(phase * Math.PI * 2);
          bob -= lamp * 8; lean -= u.face * lamp * 14; rot += sway * lamp * .035;
          sqx += lamp * .08; sqy -= lamp * .05;
        } else if (!u.naturalSprite && u.animStyle === 'astroConstellation') {
          const orbit = Math.sin(phase * Math.PI * 3), lift = Math.abs(Math.sin(phase * Math.PI * 1.5));
          rot += u.face * orbit * .13; bob -= lift * 16; sqx += Math.abs(orbit) * .12; sqy -= lift * .06;
        } else if (!u.naturalSprite && u.animStyle === 'astroLightsOut') {
          const blackout = Math.sin(phase * Math.PI), snap = Math.sin(phase * Math.PI * 4);
          bob -= blackout * 24; lean -= u.face * blackout * 18; rot += u.face * snap * blackout * .05;
          sqx += blackout * .16; sqy -= blackout * .12;
        } else if (!u.naturalSprite && u.animStyle === 'gigiWish') {
          const focus = Math.sin(Math.min(1, phase / .58) * Math.PI * .5), pop = Math.sin(phase * Math.PI * 3);
          bob -= focus * 10 + Math.max(0, pop) * 10;
          lean += u.face * focus * 22; rot += u.face * focus * .055 + pop * .035;
          sqx += focus * .12; sqy -= focus * .08;
        } else if (!u.naturalSprite && u.animStyle === 'gigiCapsule') {
          const toss = Math.sin(phase * Math.PI);
          lean += u.face * toss * 22; bob -= toss * 10;
        } else if (!u.naturalSprite && u.animStyle === 'gigiMakeWish') {
          const charm = Math.sin(phase * Math.PI);
          bob -= charm * 9; sqx += charm * .10; sqy += charm * .08;
        } else if (!u.naturalSprite && u.animStyle === 'gigiWheel') {
          const spin = Math.sin(phase * Math.PI * 4), pop = Math.sin(phase * Math.PI);
          bob -= pop * 17; lean += u.face * pop * 17; rot += spin * pop * .10;
          sqx += pop * .16; sqy -= pop * .10;
        } else if (!u.naturalSprite && u.animStyle === 'gigiLoaded') {
          const toss = phase < .48 ? Math.sin(phase / .48 * Math.PI * .5) : 0;
          const snap = phase >= .42 ? Math.sin((phase - .42) / .58 * Math.PI) : 0;
          lean += u.face * toss * 28; lean -= u.face * snap * 36; bob -= snap * 9;
          rot += u.face * snap * .08; sqx += snap * .13; sqy -= toss * .06;
        } else if (!u.naturalSprite && u.animStyle === 'gigiJackpot') {
          const jackpot = Math.sin(phase * Math.PI), spin = Math.sin(phase * Math.PI * 7);
          bob -= jackpot * 26; lean += u.face * spin * jackpot * 11; rot += u.face * jackpot * .13;
          sqx += jackpot * .20; sqy -= jackpot * .14;
        } else if (!u.naturalSprite && u.animStyle === 'eggsonCanePlant') {
          const plant = Math.sin(Math.min(1, phase / .32) * Math.PI * .5);
          const swing = phase >= .32 ? Math.sin((phase - .32) / .68 * Math.PI) : 0;
          lean += u.face * plant * 13; lean -= u.face * swing * 38;
          bob += plant * 5 - swing * 6; rot += u.face * swing * .09;
          sqx += swing * .16; sqy -= plant * .04;
        } else if (!u.naturalSprite && u.animStyle === 'eggsonStomp') {
          const wind = phase < .38 ? Math.sin(phase / .38 * Math.PI) : 0;
          const stomp = phase >= .38 ? Math.sin((phase - .38) / .62 * Math.PI) : 0;
          lean += u.face * wind * 9; bob += wind * 5 - stomp * 11;
          rot -= u.face * stomp * .06; sqx += stomp * .18; sqy -= stomp * .12;
        } else if (!u.naturalSprite && u.animStyle === 'eggsonStory') {
          const story = Math.sin(phase * Math.PI), sway = Math.sin(phase * Math.PI * 2);
          lean -= u.face * story * 12; bob -= story * 7; rot += u.face * sway * story * .055;
          sqx += story * .08; sqy += story * .05;
        } else if (!u.naturalSprite && u.animStyle === 'eggsonStill') {
          const proud = Math.sin(phase * Math.PI);
          bob -= proud * 8; rot += u.face * Math.sin(phase * Math.PI * 3) * proud * .045;
          sqx += proud * .10; sqy -= proud * .06;
        } else if (!u.naturalSprite && u.animStyle === 'eggsonEcho') {
          const snap = Math.sin(phase * Math.PI);
          lean -= u.face * snap * 42; bob -= snap * 5;
          rot += u.face * snap * .08; sqx += snap * .15;
        } else if (!u.naturalSprite && u.animStyle === 'shellyResearch') {
          const scan = Math.sin(phase * Math.PI), page = Math.sin(phase * Math.PI * 5);
          lean -= u.face * scan * 18; bob -= scan * 10; rot += page * scan * .045;
          sqx += scan * .12; sqy -= scan * .08;
        } else if (!u.naturalSprite && u.animStyle === 'shellyInspire') {
          const glow = Math.sin(phase * Math.PI), flutter = Math.sin(phase * Math.PI * 4);
          bob -= glow * 19; lean -= u.face * glow * 10; rot += flutter * glow * .06;
          sqx += glow * .10; sqy += glow * .08;
        } else if (!u.naturalSprite && u.animStyle === 'shellySolution') {
          const read = phase < .46 ? Math.sin(phase / .46 * Math.PI * .5) : 0;
          const handoff = phase >= .38 ? Math.sin((phase - .38) / .62 * Math.PI) : 0;
          lean -= u.face * read * 19; lean += u.face * handoff * 34;
          bob -= handoff * 8; sqx += handoff * .16; sqy -= read * .06;
        } else if (!u.naturalSprite && u.animStyle === 'shellyPassion') {
          const burst = Math.sin(phase * Math.PI), twinkle = Math.sin(phase * Math.PI * 7);
          bob -= burst * 14; rot += u.face * twinkle * burst * .075;
          sqx += burst * .13; sqy -= burst * .10;
        } else if (!u.naturalSprite && u.animStyle === 'shellyArchive') {
          const open = Math.sin(phase * Math.PI), page = Math.sin(phase * Math.PI * 6);
          bob -= open * 16; lean -= u.face * open * 12; rot += page * open * .04;
          sqx += open * .14; sqy += open * .12;
        } else if (!u.naturalSprite && u.animStyle === 'rodgerResearch') {
          const focus = Math.sin(phase * Math.PI), scan = Math.sin(phase * Math.PI * 2);
          lean -= u.face * focus * 13; bob -= focus * 7; rot += scan * .045;
          sqx -= focus * .05; sqy += focus * .08;
        } else if (!u.naturalSprite && u.animStyle === 'rodgerCapsule') {
          const wind = phase < .46 ? Math.sin(phase / .46 * Math.PI * .5) : Math.max(0, 1 - (phase - .46) / .54);
          const throwBeat = phase >= .46 ? Math.sin((phase - .46) / .54 * Math.PI) : 0;
          lean += u.face * wind * 19; lean -= u.face * throwBeat * 42;
          bob -= throwBeat * 6; sqx += throwBeat * .09;
        } else if (!u.naturalSprite && u.animStyle === 'rodgerCase') {
          const open = Math.sin(phase * Math.PI), page = Math.sin(phase * Math.PI * 4);
          bob -= open * 9; lean -= u.face * open * 9; rot += page * open * .035;
          sqx += open * .07; sqy += open * .06;
        } else if (!u.naturalSprite && u.animStyle === 'shrimpoThrash') {
          const rage = Math.sin(phase * Math.PI), stomp = Math.abs(Math.sin(phase * Math.PI * 8));
          const thrash = Math.sin(phase * Math.PI * 7) * rage;
          bob += stomp * 7 * rage; lean += u.face * thrash * 12;
          rot += thrash * .035; sqx += stomp * rage * .16; sqy -= rage * .08;
        } else if (!u.naturalSprite && u.animStyle === 'shrimpoBully') {
          const brace = phase < .45 ? Math.sin(phase / .45 * Math.PI) : 0;
          const slam = phase >= .45 ? Math.sin((phase - .45) / .55 * Math.PI) : 0;
          lean += u.face * brace * 22; lean -= u.face * slam * 49;
          bob += brace * 8 - slam * 7; sqx += slam * .20; sqy -= brace * .14;
        } else if (!u.naturalSprite && u.animStyle === 'shrimpoSpiteGain') {
          const recoil = Math.sin(phase * Math.PI);
          bob += recoil * 5; rot += u.face * Math.sin(phase * Math.PI * 5) * recoil * .12;
          sqx += recoil * .14; sqy -= recoil * .12;
        } else if (!u.naturalSprite && u.animStyle === 'shrimpoSpiteBurst') {
          const charge = phase < .48 ? phase / .48 : Math.max(0, 1 - (phase - .48) / .52);
          const snap = phase >= .48 ? Math.sin((phase - .48) / .52 * Math.PI) : 0;
          rot += Math.sin(phase * Math.PI * (9 + charge * 12)) * charge * .10;
          lean += u.face * charge * 15; lean -= u.face * snap * 60;
          bob += charge * 5 - snap * 13; sqx += charge * .13 + snap * .25; sqy -= charge * .12;
        } else if (!u.naturalSprite && u.animStyle === 'shrimpoPunchWindup') {
          const prep = Math.sin(Math.min(1, phase / .54) * Math.PI * .5);
          bob += prep * 7; lean += u.face * prep * 30; rot += u.face * prep * .07;
          sqx -= prep * .12; sqy += prep * .08;
        } else if (!u.naturalSprite && u.animStyle === 'shrimpoPunchCharge') {
          const punch = Math.sin(phase * Math.PI), recoil = phase > .72 ? Math.sin((phase - .72) / .28 * Math.PI * .5) : 0;
          lean -= u.face * punch * 54; bob -= punch * 7; rot -= u.face * punch * .11;
          sqx += punch * .22; sqy -= punch * .08 + recoil * .04;
        } else if (!u.naturalSprite && u.animStyle === 'ribeccaLooseBones') {
          const gather = Math.sin(Math.min(1, phase / .42) * Math.PI * .5);
          const throwBeat = phase >= .34 ? Math.sin((phase - .34) / .66 * Math.PI) : 0;
          lean += u.face * gather * 13 - u.face * throwBeat * 27;
          bob += gather * 4 - throwBeat * 5; rot += u.face * throwBeat * .06;
          sqx += throwBeat * .13; sqy -= gather * .06;
        } else if (!u.naturalSprite && u.animStyle === 'soulvesterSlam') {
          const brace = phase < .42 ? Math.sin(phase / .42 * Math.PI) : 0;
          const impact = phase >= .34 ? Math.sin((phase - .34) / .66 * Math.PI) : 0;
          lean += u.face * brace * 12 - u.face * impact * 45;
          bob += brace * 5 - impact * 11;
          rot += u.face * (brace * .05 - impact * .10);
          sqx += impact * .20; sqy -= brace * .10;
        } else if (!u.naturalSprite && u.animStyle === 'soulvesterArmor') {
          const lock = Math.sin(phase * Math.PI), clank = Math.sin(phase * Math.PI * 8) * lock;
          bob -= lock * 8; rot += clank * .035; lean -= u.face * lock * 6;
          sqx += lock * .08; sqy += lock * .06;
        } else if (!u.naturalSprite && u.animStyle === 'soulvesterGuard') {
          const plant = Math.sin(phase * Math.PI), brace = Math.sin(phase * Math.PI * 2);
          bob -= plant * 6; lean -= u.face * plant * 15;
          rot += u.face * brace * plant * .035; sqx += plant * .07; sqy -= plant * .06;
        } else if (!u.naturalSprite && u.animStyle === 'soulvesterSword') {
          const draw = phase < .48 ? Math.sin(phase / .48 * Math.PI) : 0;
          const cut = phase >= .35 ? Math.sin((phase - .35) / .65 * Math.PI) : 0;
          lean += u.face * draw * 18 - u.face * cut * 58;
          bob += draw * 5 - cut * 8; rot += u.face * (draw * .08 - cut * .16);
          sqx += cut * .24; sqy -= draw * .08;
        } else if (!u.naturalSprite && u.animStyle === 'soulvesterResolve') {
          const rise = Math.sin(phase * Math.PI), brace = Math.sin(phase * Math.PI * 9) * rise;
          bob -= rise * 15; lean -= u.face * rise * 9; rot += brace * .04;
          sqx += rise * .13; sqy += rise * .08;
        } else if (!u.naturalSprite && u.animStyle === 'brightneyBash') {
          const wind = phase < .42 ? Math.sin(phase / .42 * Math.PI * .5) : 0;
          const swing = phase >= .34 ? Math.sin((phase - .34) / .66 * Math.PI) : 0;
          lean += u.face * wind * 17 - u.face * swing * 48;
          bob += wind * 5 - swing * 7;
          rot += u.face * (wind * .06 - swing * .12);
          sqx += swing * .18; sqy -= wind * .08;
        } else if (!u.naturalSprite && u.animStyle === 'brightneyFlash') {
          const charge = phase < .58 ? Math.sin(phase / .58 * Math.PI * .5) : 0;
          const release = phase >= .48 ? Math.sin((phase - .48) / .52 * Math.PI) : 0;
          bob -= charge * 12 - release * 9;
          lean -= u.face * charge * 9;
          rot += u.face * (charge * .045 - release * .07);
          sqx += charge * .12 + release * .16; sqy += charge * .10 - release * .05;
        } else if (!u.naturalSprite && u.animStyle === 'brightneyGuard') {
          const brace = Math.sin(phase * Math.PI), flicker = Math.sin(phase * Math.PI * 8);
          bob -= brace * 7; lean -= u.face * brace * 13;
          rot += u.face * flicker * brace * .035;
          sqx += brace * .08; sqy += brace * .06;
        } else if (!u.naturalSprite && u.animStyle === 'brightneyBeam') {
          const aim = phase < .46 ? Math.sin(phase / .46 * Math.PI * .5) : 0;
          const fire = phase >= .35 ? Math.sin((phase - .35) / .65 * Math.PI) : 0;
          lean += u.face * aim * 12 - u.face * fire * 23;
          bob -= aim * 8 - fire * 4;
          rot += u.face * (aim * .04 - fire * .06);
          sqx += fire * .11; sqy -= aim * .05;
        } else if (!u.naturalSprite && u.animStyle === 'blotFlick') {
          const wind = phase < .42 ? Math.sin(phase / .42 * Math.PI * .5) : 0;
          const snap = phase >= .32 ? Math.sin((phase - .32) / .68 * Math.PI) : 0;
          lean += u.face * wind * 13 - u.face * snap * 32;
          bob += wind * 4 - snap * 4; rot += u.face * (wind * .05 - snap * .08);
          sqx += snap * .12; sqy -= wind * .06;
        } else if (!u.naturalSprite && u.animStyle === 'blotDecoy') {
          const paint = Math.sin(clamp(phase / .62, 0, 1) * Math.PI), finish = phase > .58 ? Math.sin((phase - .58) / .42 * Math.PI) : 0;
          lean -= u.face * paint * 15; bob -= paint * 9 - finish * 5;
          rot += u.face * Math.sin(phase * Math.PI * 5) * paint * .045;
          sqx += paint * .12 + finish * .08; sqy += paint * .08;
        } else if (!u.naturalSprite && u.animStyle === 'blotWall') {
          const brace = Math.sin(phase * Math.PI), hold = Math.sin(phase * Math.PI * 7) * brace;
          lean -= u.face * brace * 16; bob -= brace * 6; rot += u.face * hold * .035;
          sqx += brace * .09; sqy += brace * .07;
        } else if (!u.naturalSprite && u.animStyle === 'blotTrail') {
          const pour = Math.sin(clamp((phase - .04) / .78, 0, 1) * Math.PI);
          lean += u.face * pour * 19; bob += pour * 4; rot -= u.face * pour * .06;
          sqx += pour * .10; sqy -= pour * .06;
        } else if (!u.naturalSprite && u.animStyle === 'rudieJab') {
          const brace = phase < .34 ? Math.sin(phase / .34 * Math.PI * .5) : 0;
          const jab = phase >= .24 ? Math.sin(clamp((phase - .24) / .48, 0, 1) * Math.PI) : 0;
          lean += u.face * brace * 18 - u.face * jab * 54;
          bob += brace * 4 - jab * 5; rot += u.face * (brace * .05 - jab * .12);
          sqx += brace * .08 + jab * .17; sqy -= brace * .06 + jab * .08;
        } else if (!u.naturalSprite && u.animStyle === 'rudieRush') {
          const lower = phase < .28 ? Math.sin(phase / .28 * Math.PI * .5) : 0;
          const charge = Math.sin(clamp((phase - .16) / .58, 0, 1) * Math.PI);
          const settle = phase >= .70 ? Math.sin((phase - .70) / .30 * Math.PI) : 0;
          lean += u.face * lower * 22 - u.face * charge * 58 - u.face * settle * 18;
          bob += lower * 6 - charge * 8 - settle * 5;
          rot += u.face * (lower * .07 + Math.sin(phase * Math.PI * 8) * charge * .055);
          sqx += lower * .10 + charge * .22; sqy -= lower * .10 + charge * .10;
        } else if (!u.naturalSprite && u.animStyle === 'rudieOpener') {
          const charge = Math.sin(clamp((phase - .08) / .60, 0, 1) * Math.PI);
          bob -= charge * 12; lean -= u.face * charge * 52;
          rot += u.face * Math.sin(phase * Math.PI * 7) * charge * .07;
          sqx += charge * .22; sqy -= charge * .12;
        } else if (!u.naturalSprite && u.animStyle === 'rudieHoof') {
          const wind = phase < .28 ? Math.sin(phase / .28 * Math.PI * .5) : 0;
          const kicks = Math.abs(Math.sin(clamp((phase - .20) / .54, 0, 1) * Math.PI * 5));
          const active = Math.sin(clamp((phase - .16) / .68, 0, 1) * Math.PI);
          lean += u.face * wind * 16 - u.face * kicks * active * 14;
          bob += wind * 5 + kicks * active * 5 - active * 4;
          rot += u.face * Math.sin(phase * Math.PI * 10) * active * .08;
          sqx += wind * .08 + kicks * active * .10; sqy -= wind * .06 + active * .06;
        } else if (!u.naturalSprite && u.animStyle === 'rudieRedNose') {
          const shine = Math.sin(phase * Math.PI), jitter = Math.sin(phase * Math.PI * 12) * shine;
          bob -= shine * 9; lean -= u.face * shine * 10; rot += jitter * .045;
          sqx += shine * .12; sqy += shine * .10;
        } else if (!u.naturalSprite && u.animStyle === 'toodlesSwing') {
          const hop = Math.sin(phase * Math.PI), swat = Math.sin(Math.max(0, phase - .28) / .72 * Math.PI);
          bob -= hop * 13; rot += u.face * (hop * .12 - swat * .38);
          lean -= u.face * swat * 44; sqx += swat * .22; sqy += hop * .06;
        } else if (!u.naturalSprite && u.animStyle === 'toodlesLuckRoll') {
          const hop = Math.sin(phase * Math.PI), tumble = Math.sin(phase * Math.PI * 2.5);
          const coinFlip = Math.sin(phase * Math.PI * 6) * hop;
          bob -= hop * 27; rot += u.face * (phase * Math.PI * 2.35 + tumble * .14);
          lean += u.face * tumble * 15; sqx += hop * .16 + Math.max(0, coinFlip) * .04; sqy -= hop * .11;
        } else if (!u.naturalSprite && u.animStyle === 'toodlesLuckyStrike') {
          const brace = phase < .46 ? Math.sin(phase / .46 * Math.PI) : 0;
          const spring = phase >= .30 ? Math.sin((phase - .30) / .70 * Math.PI) : 0;
          const snap = Math.sin(phase * Math.PI * 3) * spring;
          bob += brace * 8 - spring * 14; rot += u.face * (brace * .11 - spring * .38 + snap * .035);
          lean += u.face * brace * 18 - u.face * spring * 56; sqx += spring * .23; sqy -= brace * .13;
        } else if (!u.naturalSprite && u.animStyle === 'toodlesMiracle') {
          const reach = Math.sin(phase * Math.PI), sparkle = Math.sin(phase * Math.PI * 5) * reach;
          bob -= reach * 16; rot += u.face * sparkle * .065;
          lean -= u.face * reach * 18; sqx += reach * .10; sqy += reach * .12;
        } else if (!u.naturalSprite && u.animStyle === 'squirmNibble') {
          const recoil = phase < .38 ? Math.sin(phase / .38 * Math.PI * .5) : 0;
          const snap = phase >= .30 ? Math.sin((phase - .30) / .70 * Math.PI) : 0;
          bob += recoil * 8 - snap * 8; lean += u.face * recoil * 18 - u.face * snap * 31;
          rot += u.face * (recoil * .08 - snap * .11); sqx += snap * .13; sqy -= recoil * .10;
        } else if (!u.naturalSprite && u.animStyle === 'squirmEat') {
          const chew = Math.abs(Math.sin(phase * Math.PI * 8)), cower = Math.sin(phase * Math.PI);
          bob += chew * 3 + cower * 5; rot += u.face * Math.sin(phase * Math.PI * 6) * .045;
          sqx += cower * .17; sqy -= cower * .14;
        } else if (!u.naturalSprite && u.animStyle === 'squirmJolt') {
          const charge = phase < .45 ? Math.sin(phase / .45 * Math.PI * .5) : 0;
          const jolt = phase >= .42 ? Math.sin((phase - .42) / .58 * Math.PI) : 0;
          bob += charge * 9 - jolt * 16; lean += u.face * charge * 19 - u.face * jolt * 48;
          rot += u.face * (charge * .09 - jolt * .17); sqx += jolt * .24; sqy -= charge * .15;
        } else if (!u.naturalSprite && u.animStyle === 'squirmCurl') {
          const curl = Math.sin(phase * Math.PI), tremble = Math.sin(phase * Math.PI * 9) * curl;
          bob += curl * 10; rot += u.face * tremble * .09; sqx += curl * .22; sqy -= curl * .20;
        } else if (!u.naturalSprite && u.animStyle === 'squirmFlailRoll') {
          // Squirm coils, commits to one visible tumble, then lands. Keeping
          // the rotation at a whole turn after the roll makes the end pose
          // visually upright without cancelling the roll halfway through.
          const coil = phase < .16 ? Math.sin(phase / .16 * Math.PI * .5) : 0;
          const rollT = clamp((phase - .10) / .62, 0, 1);
          const roll = rollT * rollT * (3 - 2 * rollT);
          const arc = Math.sin(rollT * Math.PI);
          const land = phase >= .70 ? Math.sin((phase - .70) / .30 * Math.PI) : 0;
          bob += coil * 8 - arc * 18 - land * 7;
          rot += u.face * roll * Math.PI * 2;
          lean += u.face * coil * 18 + u.face * Math.sin(rollT * Math.PI * 2) * 12 - u.face * land * 18;
          sqx += coil * .14 + arc * .18 + land * .16;
          sqy -= coil * .12 + arc * .14 - land * .10;
        } else if (!u.naturalSprite && u.animStyle === 'bobetteRibbonSwat') {
          const wind = phase < .40 ? Math.sin(phase / .40 * Math.PI * .5) : 0;
          const swat = phase >= .32 ? Math.sin((phase - .32) / .68 * Math.PI) : 0;
          bob += wind * 4 - swat * 6; lean += u.face * wind * 17 - u.face * swat * 38;
          rot += u.face * (wind * .07 - swat * .13); sqx += swat * .12;
        } else if (!u.naturalSprite && u.animStyle === 'bobetteWrap') {
          // A quick gather-and-tuck sells Bobette disappearing into the gift,
          // while the package FX carries the longer sealed hold.
          const gather = phase < .42 ? Math.sin(phase / .42 * Math.PI * .5) : 0;
          const tuck = phase >= .24 ? Math.sin((phase - .24) / .76 * Math.PI * .5) : 0;
          const knot = phase >= .48 ? Math.sin((phase - .48) / .52 * Math.PI) : 0;
          bob += gather * 5 + tuck * 4 - knot * 5;
          lean += u.face * gather * 18 - u.face * tuck * 26;
          rot += u.face * (gather * .06 - tuck * .08 + knot * .04);
          sqx += gather * .08 + tuck * .22; sqy -= tuck * .20;
        } else if (!u.naturalSprite && u.animStyle === 'bobetteUnwrap') {
          const charge = phase < .28 ? Math.sin(phase / .28 * Math.PI * .5) : 0;
          const pop = phase >= .18 ? Math.sin((phase - .18) / .82 * Math.PI * .5) : 0;
          const settle = phase >= .68 ? Math.sin((phase - .68) / .32 * Math.PI) : 0;
          bob += charge * 7 - pop * 18 + settle * 5;
          lean += u.face * charge * 12 + u.face * pop * 22 - u.face * settle * 15;
          rot += u.face * (charge * .05 + pop * .10 - settle * .05);
          sqx += charge * .10 + pop * .25; sqy -= charge * .08 - pop * .18;
        } else if (!u.naturalSprite && u.animStyle === 'bobetteCheer') {
          const cheer = Math.sin(phase * Math.PI), bounce = Math.abs(Math.sin(phase * Math.PI * 4));
          bob -= cheer * 13 + bounce * cheer * 4; rot += u.face * Math.sin(phase * Math.PI * 3) * cheer * .055;
          sqx += cheer * .12; sqy += cheer * .08;
        } else if (!u.naturalSprite && u.animStyle === 'bobetteToss') {
          const wind = phase < .48 ? Math.sin(phase / .48 * Math.PI * .5) : 0;
          const toss = phase >= .42 ? Math.sin((phase - .42) / .58 * Math.PI) : 0;
          bob += wind * 6 - toss * 8; lean += u.face * wind * 19 - u.face * toss * 45;
          rot += u.face * (wind * .08 - toss * .14); sqx += toss * .14; sqy -= wind * .08;
        } else if (!u.naturalSprite && u.animStyle === 'finnBowlBump') {
          const bobble = Math.sin(phase * Math.PI), tap = phase > .35 ? Math.sin((phase-.35)/.65*Math.PI) : 0;
          bob -= bobble * 7; lean += u.face * bobble * 10 - u.face * tap * 28; rot += u.face * (bobble*.06-tap*.10); sqx += tap*.10;
        } else if (!u.naturalSprite && u.animStyle === 'finnReel') {
          const cast = phase < .42 ? Math.sin(phase/.42*Math.PI*.5) : 0, reel = phase >= .36 ? Math.sin((phase-.36)/.64*Math.PI*2) : 0;
          bob -= cast * 7; lean += u.face * cast * 20 - u.face * reel * 13; rot += u.face * reel * .09; sqx += cast*.10;
        } else if (!u.naturalSprite && u.animStyle === 'finnSendBarnaby') {
          const point = Math.sin(phase*Math.PI), flick = Math.sin(phase*Math.PI*4)*point;
          bob -= point*8; lean -= u.face*point*23; rot += u.face*flick*.07; sqx += point*.10;
        } else if (!u.naturalSprite && u.animStyle === 'finnSpill') {
          const tip = Math.sin(phase*Math.PI), shake = Math.sin(phase*Math.PI*6)*tip;
          bob += tip*4; lean += u.face*tip*17; rot += u.face*shake*.10; sqx += tip*.07; sqy -= tip*.06;
        } else if (!u.naturalSprite && u.animStyle === 'veeSpotlight') {
          const direct = Math.sin(phase * Math.PI), lock = Math.sin(Math.min(1, phase * 1.7) * Math.PI);
          bob -= direct * 8; lean -= u.face * direct * 11; rot -= u.face * lock * .06;
          sqx += direct * .08; sqy += direct * .05;
        } else if (!u.naturalSprite && u.animStyle === 'veeAudience') {
          const applause = Math.sin(phase * Math.PI), bounce = Math.abs(Math.sin(phase * Math.PI * 4));
          bob -= applause * 10 + bounce * applause * 4; rot += Math.sin(phase * Math.PI * 4) * applause * .06;
          lean -= u.face * applause * 8; sqx += applause * .07; sqy += applause * .08;
        } else if (!u.naturalSprite && u.animStyle === 'veeCommercial') {
          const cut = Math.sin(phase * Math.PI), snap = phase > .28 ? Math.sin((phase - .28) / .72 * Math.PI) : 0;
          bob -= cut * 7; lean += u.face * snap * 16; rot += u.face * (snap - cut * .35) * .08;
          sqx += snap * .09; sqy += cut * .06;
        } else if (!u.naturalSprite && u.animStyle === 'flyteGust') {
          const lift = Math.sin(phase * Math.PI), drift = Math.sin(phase * Math.PI * 5);
          bob -= lift * 21 + drift * lift * 3; lean += u.face * drift * lift * 9; rot += drift * lift * .08;
          sqx += lift * .09; sqy += lift * .12;
        } else if (!u.naturalSprite && u.animStyle === 'flyteRescue') {
          const dive = phase < .48 ? Math.sin(phase / .48 * Math.PI) : 0;
          const brace = phase >= .36 ? Math.sin((phase - .36) / .64 * Math.PI) : 0;
          bob -= dive * 14 + brace * 8; lean -= u.face * dive * 42; lean += u.face * brace * 16;
          sqx += dive * .18 + brace * .09; sqy -= dive * .14;
        } else if (!u.naturalSprite && u.animStyle === 'flyteClear') {
          const sweep = Math.sin(phase * Math.PI), flutter = Math.sin(phase * Math.PI * 7);
          bob -= sweep * 17 + flutter * sweep * 3; lean -= u.face * sweep * 48; rot += flutter * sweep * .07;
          sqx += sweep * .27; sqy -= sweep * .17;
        } else if (!u.naturalSprite && u.animStyle === 'yattaSwing') {
          const bounce = phase < .34 ? Math.sin(phase / .34 * Math.PI * .5) : 0;
          const swat = phase >= .24 ? Math.sin(clamp((phase - .24) / .60, 0, 1) * Math.PI) : 0;
          bob -= bounce * 12 - swat * 5; lean += u.face * bounce * 15 - u.face * swat * 43;
          rot += u.face * (bounce * .09 - swat * .18); sqx += bounce * .11 + swat * .16; sqy += bounce * .08 - swat * .07;
        } else if (!u.naturalSprite && u.animStyle === 'yattaParty') {
          const hop = Math.abs(Math.sin(phase * Math.PI * 4));
          const tumble = Math.sin(phase * Math.PI * 4);
          bob -= hop * 25; lean -= u.face * tumble * 25; rot += u.face * tumble * .16;
          sqx += hop * .14; sqy += hop * .10;
        } else if (!u.naturalSprite && u.animStyle === 'yattaCrash') {
          const coil = phase < .58 ? Math.sin(phase / .58 * Math.PI * .5) : 0;
          const launch = phase >= .48 ? Math.sin((phase - .48) / .52 * Math.PI) : 0;
          bob += coil * 10 - launch * 24; lean += u.face * coil * 22 - u.face * launch * 58;
          rot += u.face * (coil * .10 - launch * .16); sqx += coil * .15 + launch * .28; sqy -= coil * .17 + launch * .18;
        } else if (!u.naturalSprite && u.animStyle === 'yattaSpring') {
          const spring = Math.sin(phase * Math.PI), wobble = Math.sin(phase * Math.PI * 7) * spring;
          bob -= spring * 20; rot += wobble * .14; lean += u.face * wobble * 15;
          sqx += spring * .18; sqy += spring * .15;
        } else if (!u.naturalSprite && u.animStyle === 'eclipseRake') {
          const prowl = phase < .35 ? Math.sin(phase / .35 * Math.PI * .5) : 0;
          const rake = phase >= .26 ? Math.sin(clamp((phase - .26) / .60, 0, 1) * Math.PI) : 0;
          lean += u.face * prowl * 15 - u.face * rake * 49;
          bob += prowl * 5 - rake * 7; rot += u.face * (prowl * .05 - rake * .12);
          sqx += prowl * .08 + rake * .18; sqy -= prowl * .08 + rake * .09;
        } else if (!u.naturalSprite && u.animStyle === 'eclipseHunt') {
          const coil = phase < .38 ? Math.sin(phase / .38 * Math.PI * .5) : 0;
          const spring = phase >= .30 ? Math.sin(clamp((phase - .30) / .58, 0, 1) * Math.PI) : 0;
          lean += u.face * coil * 19 - u.face * spring * 56;
          bob += coil * 7 - spring * 18; rot += u.face * (coil * .06 - spring * .14);
          sqx += coil * .12 + spring * .26; sqy -= coil * .13 + spring * .18;
        } else if (!u.naturalSprite && u.animStyle === 'eclipseRush') {
          const crouch = phase < .24 ? Math.sin(phase / .24 * Math.PI * .5) : 0;
          const run = Math.sin(clamp((phase - .14) / .68, 0, 1) * Math.PI);
          lean += u.face * crouch * 20 - u.face * run * 60;
          bob += crouch * 7 - run * 10; rot += u.face * (crouch * .07 - run * .12);
          sqx += crouch * .14 + run * .25; sqy -= crouch * .13 + run * .10;
        } else if (!u.naturalSprite && u.animStyle === 'eclipseSwipe') {
          const brace = phase < .24 ? Math.sin(phase / .24 * Math.PI * .5) : 0;
          const flurry = Math.sin(clamp((phase - .18) / .68, 0, 1) * Math.PI * 3);
          const active = Math.sin(clamp((phase - .18) / .70, 0, 1) * Math.PI);
          lean += u.face * brace * 14 - u.face * flurry * active * 37;
          bob += brace * 4 - active * 7; rot += u.face * flurry * active * .13;
          sqx += brace * .08 + active * .16; sqy -= brace * .06 + active * .08;
        } else if (!u.naturalSprite && u.animStyle === 'eclipseBlackout') {
          const rise = Math.sin(phase * Math.PI), tremor = Math.sin(phase * Math.PI * 9) * rise;
          bob -= rise * 20; lean -= u.face * rise * 13; rot += tremor * .07;
          sqx += rise * .18; sqy += rise * .16;
        } else if (!u.naturalSprite && u.animStyle === 'connieEscape') {
          const vanish = Math.sin(Math.min(1, phase / .72) * Math.PI * .5);
          bodyOpacity = 1 - vanish * .82;
          bob -= vanish * 12; rot += u.face * Math.sin(phase * Math.PI * 3) * .06;
          sqx += vanish * .12; sqy -= vanish * .16;
        } else if (!u.naturalSprite && u.animStyle === 'connieReturn') {
          const returnBeat = Math.sin(phase * Math.PI);
          bodyOpacity = .35 + phase * .65;
          bob -= returnBeat * 15; rot += u.face * Math.sin(phase * Math.PI * 4) * .06;
          sqx += returnBeat * .18; sqy += returnBeat * .12;
        } else if (!u.naturalSprite && u.animStyle === 'conniePrankWindup') {
          const prep = Math.sin(Math.min(1, phase / .55) * Math.PI * .5);
          const flicker = Math.sin(phase * Math.PI * 5) * prep;
          lean += u.face * prep * 26; bob += prep * 5 - flicker * 3;
          rot += u.face * prep * .08; sqx -= prep * .12; sqy += prep * .08;
        } else if (!u.naturalSprite && u.animStyle === 'conniePrankStrike') {
          const strike = Math.sin(phase * Math.PI), ghostTurn = Math.sin(phase * Math.PI * 2);
          lean -= u.face * strike * 58; bob -= strike * 10;
          rot += u.face * strike * .13 + ghostTurn * .06;
          sqx += strike * .24; sqy -= strike * .12;
        } else if (!u.naturalSprite && u.animStyle === 'conniePrank') {
          const lunge = phase < .58 ? Math.sin(phase / .58 * Math.PI * .5) : 0;
          const snap = phase >= .45 ? Math.sin((phase - .45) / .55 * Math.PI) : 0;
          lean += u.face * lunge * 25 - u.face * snap * 52;
          bob -= lunge * 8 - snap * 7; rot += u.face * snap * .12;
          sqx += snap * .22; sqy -= lunge * .12;
        } else if (!u.naturalSprite && u.animStyle === 'connieDrift') {
          const phaseWave = Math.sin(phase * Math.PI), flutter = Math.sin(phase * Math.PI * 5);
          bob -= phaseWave * 20; rot += flutter * phaseWave * .09;
          sqx += phaseWave * .10; sqy += phaseWave * .08;
        } else if (!u.naturalSprite && u.animStyle === 'gingerFlick') {
          const prep = phase < .42 ? Math.sin(phase / .42 * Math.PI * .5) : 0;
          const flick = phase >= .30 ? Math.sin(clamp((phase - .30) / .44, 0, 1) * Math.PI) : 0;
          bob += prep * 4 - flick * 3; lean += u.face * prep * 13 - u.face * flick * 24;
          rot += u.face * (prep * .035 - flick * .06);
          sqx += prep * .06 + flick * .12; sqy -= prep * .05 + flick * .06;
        } else if (!u.naturalSprite && u.animStyle === 'gingerHeart') {
          const offer = Math.sin(phase * Math.PI), lift = Math.sin(Math.min(1, phase / .38) * Math.PI * .5);
          bob -= offer * 10; lean -= u.face * lift * 12; rot += u.face * Math.sin(phase * Math.PI * 2) * .025;
          sqx += offer * .10; sqy -= offer * .08;
        } else if (!u.naturalSprite && (u.animStyle === 'gingerTreats' || u.animStyle === 'gingerCleansingTreats')) {
          const cheer = Math.sin(phase * Math.PI), toss = Math.sin(Math.min(1, phase / .48) * Math.PI * .5);
          const cleanse = u.animStyle === 'gingerCleansingTreats' ? Math.sin(Math.min(1, phase / .72) * Math.PI) : 0;
          bob -= cheer * 9 - cleanse * 3; lean += u.face * Math.sin(phase * Math.PI * 2) * 5;
          rot += u.face * toss * .045; sqx += cheer * .12 + cleanse * .08; sqy -= cheer * .10 + cleanse * .05;
        } else if (!u.naturalSprite && u.animStyle === 'gingerPrep') {
          const stir = Math.sin(phase * Math.PI * 2), settle = Math.sin(phase * Math.PI);
          bob -= settle * 6; lean += u.face * stir * 5; rot += u.face * stir * .035;
          sqx += settle * .08; sqy -= settle * .06;
        } else if (!u.naturalSprite && u.animStyle === 'gingerLastBite') {
          const reach = phase < .42 ? Math.sin(phase / .42 * Math.PI * .5) : 0;
          const snap = phase >= .28 ? Math.sin(clamp((phase - .28) / .72, 0, 1) * Math.PI) : 0;
          bob += reach * 5 - snap * 6; lean += u.face * reach * 17 - u.face * snap * 22;
          rot += u.face * (reach * .04 - snap * .05); sqx += snap * .13; sqy -= snap * .08;
        } else if (!u.naturalSprite && u.animStyle === 'coalBonk') {
          // Coal braces, commits her whole little body, then settles back
          // onto her feet. It should feel like a stubborn headbutt, not a
          // generic sword swing.
          const brace = phase < .34 ? Math.sin(phase / .34 * Math.PI * .5) : 0;
          const bonk = phase >= .24 ? Math.sin(clamp((phase - .24) / .52, 0, 1) * Math.PI) : 0;
          const settle = phase >= .68 ? Math.sin((phase - .68) / .32 * Math.PI) : 0;
          bob += brace * 7 - bonk * 4 + settle * 2;
          lean += u.face * brace * 12 - u.face * bonk * 28;
          rot += u.face * (brace * .04 - bonk * .07);
          sqx += brace * .10 + bonk * .18; sqy -= brace * .10 + bonk * .08;
        } else if (!u.naturalSprite && u.animStyle === 'coalRoll') {
          // Rolling is reserved for the named skill: a short brace, a low
          // deliberate tuck, then a heavy landing at the target.
          const brace = phase < .22 ? Math.sin(phase / .22 * Math.PI * .5) : 0;
          const tuck = phase >= .16 && phase < .38 ? Math.sin((phase - .16) / .22 * Math.PI) : 0;
          const roll = phase >= .22 ? Math.sin(clamp((phase - .22) / .62, 0, 1) * Math.PI) : 0;
          const land = phase >= .72 ? Math.sin((phase - .72) / .28 * Math.PI) : 0;
          bob += brace * 6 - tuck * 4 - roll * 10 - land * 4;
          lean += u.face * (brace * 18 - roll * 10 + land * 14);
          rot += u.face * (brace * .08 + roll * Math.PI * 1.9 - land * .12);
          sqx += brace * .15 + tuck * .08 + roll * .18 + land * .12;
          sqy -= brace * .12 + roll * .08;
        } else if (!u.naturalSprite && u.animStyle === 'coalGuard') {
          // Her shield is a protective cuddle: feet planted, shoulder turned
          // toward the ally, with a small breathing pulse around the guard.
          const plant = Math.sin(Math.min(1, phase / .35) * Math.PI * .5);
          const shelter = phase >= .28 ? Math.sin((phase - .28) / .72 * Math.PI) : 0;
          bob -= shelter * 5; lean -= u.face * plant * 10;
          rot += u.face * Math.sin(phase * Math.PI * 2) * .025;
          sqx += plant * .15 + shelter * .08; sqy += plant * .12 + shelter * .08;
        } else if (!u.naturalSprite && u.animStyle === 'coalToss') {
          // Coal launches her own body like a compact, determined boulder.
          const crouch = phase < .4 ? Math.sin(phase / .4 * Math.PI * .5) : 0;
          const launch = phase >= .32 ? Math.sin(clamp((phase - .32) / .68, 0, 1) * Math.PI) : 0;
          bob += crouch * 8 - launch * 15;
          lean += u.face * crouch * 15 - u.face * launch * 50;
          rot += u.face * (crouch * .05 - launch * .10);
          sqx += crouch * .17 + launch * .20; sqy -= crouch * .18 + launch * .12;
        } else if (!u.naturalSprite && u.animStyle === 'coalProtect') {
          // The opener is a quiet, immovable promise rather than a flashy
          // cast: Coal settles into the space between her ward and danger.
          const settle = Math.sin(phase * Math.PI);
          const plant = phase < .35 ? Math.sin(phase / .35 * Math.PI * .5) : Math.max(0, 1 - (phase - .35) / .65);
          bob -= settle * 6; lean -= u.face * plant * 10;
          sqx += settle * .13; sqy += settle * .10;
        } else if (!u.naturalSprite && u.animStyle === 'coalRescue') {
          // When her chosen ally would fall, she visibly throws herself in
          // front of the hit and lands in a broad guard stance.
          const step = phase < .32 ? Math.sin(phase / .32 * Math.PI * .5) : 0;
          const brace = phase >= .22 ? Math.sin(clamp((phase - .22) / .78, 0, 1) * Math.PI) : 0;
          bob += step * 8 - brace * 8; lean += u.face * step * 16 - u.face * brace * 30;
          rot += u.face * (step * .05 - brace * .06);
          sqx += step * .16 + brace * .13; sqy -= step * .12 + brace * .08;
        } else if (!u.naturalSprite && u.animState === 'wind') {
          // Shared basic-attack anticipation: the cutout leans away before
          // the strike, so even characters without authored choreography have
          // a readable start point.
          const prep = Math.sin(phase * Math.PI * .5);
          lean += u.face * 18 * prep; bob += prep * 4; rot += u.face * prep * .05;
          sqx += prep * .08; sqy -= prep * .06;
        } else if (!u.naturalSprite && u.animState === 'attack') {
          // A short forward snap followed by a visible recovery reads as a
          // hit instead of a sprite simply tilting in one direction.
          const prep = phase < .34 ? Math.sin(phase / .34 * Math.PI * .5) : 0;
          const strike = phase >= .25 ? Math.sin(clamp((phase - .25) / .43, 0, 1) * Math.PI) : 0;
          const recover = phase >= .68 ? Math.sin((phase - .68) / .32 * Math.PI * .5) : 0;
          lean += u.face * prep * 16 - u.face * strike * 44 + u.face * recover * 7;
          bob += prep * 4 - strike * 6 + recover * 2;
          rot += u.face * (prep * .05 - strike * .11 + recover * .03);
          sqx += prep * .08 + strike * .16; sqy -= prep * .06 + strike * .08;
        }
        else if (!u.naturalSprite && u.animState === 'cast') { bob -= 14 * Math.sin((1 - k) * Math.PI); sqy += .1 * k; sqx -= .08 * k; }
        else if (!u.naturalSprite && u.animState === 'spin') { rot += this.t * 26; }
        if (u.animT <= 0) u.animStyle = null;
      }
      if (u.naturalSprite) {
        const naturalPhase = u.animT > 0 ? 1 - clamp(u.animT / Math.max(.01, u.animDur || 1), 0, 1) : null;
        const naturalClip = u.animT > 0
          ? (u.animState === 'cast' ? 'cast' : 'attack')
          : u.moving ? 'move' : 'idle';
        this.setNaturalSprite(u, naturalClip, naturalPhase);
      }
      if (u.flags.untargetable) bodyOpacity = Math.min(bodyOpacity, .38);
      setStyleIfChanged(u.bodyEl, 'opacity', String(bodyOpacity));
      const casting = !!u.casting || (u.animT > 0 && (u.animState === 'wind' || u.animState === 'cast'));
      const targeting = !!(u.target && u.target.alive);
      const hurt = u.hitT > 0;
      const combatState = `${casting ? 1 : 0}${targeting ? 1 : 0}${hurt ? 1 : 0}`;
      if (u._renderCombatState !== combatState) {
        u._renderCombatState = combatState;
        u.el.classList.toggle('casting', casting);
        u.el.classList.toggle('targeting', targeting);
        u.el.classList.toggle('hurt', hurt);
      }
      // Air Pressure visibly fills Poppy between casts instead of existing
      // only as an icon. The growth is restrained so her hitbox stays honest.
      if (u.id === 'Poppy' && u.poppyPressure) {
        const fill = clamp(u.poppyPressure, 0, 1);
        sqx += fill * .065; sqy += fill * .045;
        if (fill >= 1) bob -= Math.sin(u.bobT * 1.3) * 3;
      }
      // Ignite's flame is anchored to Waxwell's wick, not a full-screen flash.
      const waxwellRunner = u.id === 'Waxwell' && t < (u.wickBurningUntil || 0);
      if (u._waxwellRunner !== waxwellRunner) {
        u._waxwellRunner = waxwellRunner;
        u.el.classList.toggle('waxwell-runner', waxwellRunner);
      }
      // Swap to the purpose-built action render for the exact attack/cast
      // window, then settle back to the original character image at idle.
      // Each crop gets its own corrected width so the swap preserves height.
      const actionPose = !u.naturalSprite && u.actionArtSrc && u.animT > 0 &&
        (u.animState === 'wind' || u.animState === 'attack' || u.animState === 'cast' || u.animState === 'spin');
      let wantedArt = u.naturalSprite ? null : actionPose ? u.actionArtSrc : u.idleArtSrc;
      let cookieBravePose = null;
      if (u.id === 'GingerBrave') {
        const dashing = u.dashUntil > this.t;
        const attacking = !dashing && (u.casting || (u.animT > 0 &&
          (u.animState === 'wind' || u.animState === 'attack' || u.animState === 'cast' || u.animState === 'spin')));
        // Let the supplied attack GIF finish its full 1.04-second cycle.
        if (dashing) { u._cookieBraveAttackUntil = 0; u._cookieBraveWasAttacking = false; }
        if (attacking && !u._cookieBraveWasAttacking) u._cookieBraveAttackUntil = this.t + 1.04;
        u._cookieBraveWasAttacking = attacking;
        cookieBravePose = dashing ? 'run' : attacking || this.t < (u._cookieBraveAttackUntil || 0) ? 'attack' : u.moving ? 'run' : 'idle';
        wantedArt = ASSET + COOKIE_BRAVE_ANIMS[cookieBravePose];
      }
      if (u.id === 'ShadowMilkCookie') wantedArt = ASSET + (u.hasStatus('untargetable') ? 'uploads/shadow_milk_teleportinportal.gif' : u.casting || u.animState === 'cast' ? 'uploads/shadow_milk_raisestaff.gif' : u.moving ? 'uploads/shadow_milk_run.gif' : u.animState === 'attack' ? 'uploads/shadow_milk_twirlstaffanddosomething.gif' : 'uploads/Shadow_milk_idle.gif');
      let cookieBrightPose = null;
      if (u.id === 'GingerBright') {
        cookieBrightPose = this.t < (u._brightPoseUntil || 0) ? u._brightPose
          : u.casting?.key === 'G' ? 'skill2' : u.casting?.key === 'B' ? 'skill3'
          : u.casting || (u.animT > 0 && (u.animState === 'attack' || u.animState === 'wind')) ? 'attack' : 'idle';
        wantedArt = ASSET + COOKIE_BRIGHT_ANIMS[cookieBrightPose];
      }
      let cookieCreamPose = null;
      if (u.id === 'CreamPuffCookie') {
        cookieCreamPose = this.t < (u._creamPoseUntil || 0) ? u._creamPose : u.casting?.key === 'W' ? 'skill2' : u.casting || (u.animT > 0 && (u.animState === 'attack' || u.animState === 'wind' || u.animState === 'cast')) ? 'skill1' : u.moving ? 'run' : 'idle';
        wantedArt = ASSET + COOKIE_CREAM_ANIMS[cookieCreamPose];
      }
      let cookieVanillaPose = null;
      if (u.id === 'PureVanillaCookie') {
        cookieVanillaPose = this.t < (u._vanillaPoseUntil || 0) ? u._vanillaPose
          : u.casting?.key === 'W' ? 'skill3'
          : u.casting?.key === 'B' ? 'skill2'
          : u.casting ? 'skill1' : u.moving ? 'run' : 'idle';
        wantedArt = ASSET + COOKIE_VANILLA_ANIMS[cookieVanillaPose];
      }
      let cookieTigerPose = null;
      if (u.id === 'TigerLilyCookie') {
        const mounted = u.hasStatus('cookie_tiger_mounted');
        const acting = this.t < (u._tigerSkillUntil || 0) || u.casting || (u.animT > 0 && (u.animState === 'attack' || u.animState === 'wind' || u.animState === 'cast'));
        cookieTigerPose = mounted ? acting ? 'mountedSkill' : u.moving || u.dashUntil > this.t ? 'mountedRun' : 'mountedIdle'
          : acting ? 'skill' : u.moving || u.dashUntil > this.t ? 'run' : 'idle';
        wantedArt = ASSET + COOKIE_TIGER_ANIMS[cookieTigerPose];
        if (u.cookieButterTigerEl) {
          if (!u.alive || mounted) {
            u.cookieButterTigerEl.style.display = 'none';
          } else {
            u.cookieButterTigerEl.style.display = '';
            const tigerFace = u.face || 1;
            const isSwiping = this.t < (u._tigerSwipeUntil || 0);
            const isPouncing = this.t < (u._tigerPounceUntil || 0);

            let targetX = u.x - tigerFace * 50;
            let targetDepth = Math.max(0, Math.min(1, (u.depth != null ? u.depth : 0.5) + 0.025));

            if (isPouncing && u._tigerPounceTarget && u._tigerPounceTarget.alive) {
              targetX = u._tigerPounceTarget.x - tigerFace * 24;
              if (u._tigerPounceTarget.depth != null) targetDepth = u._tigerPounceTarget.depth;
            } else if (isSwiping && u._tigerSwipeTarget && u._tigerSwipeTarget.alive) {
              targetX = u._tigerSwipeTarget.x - tigerFace * 36;
              if (u._tigerSwipeTarget.depth != null) targetDepth = u._tigerSwipeTarget.depth;
            }

            if (u._tigerX == null) {
              u._tigerX = targetX;
              u._tigerDepth = targetDepth;
              u._tigerFacing = tigerFace;
            }

            const followSpeed = (isPouncing || isSwiping) ? 14 : (u.moving ? 8.5 : 6);
            const followFactor = Math.min(1, Math.max(0.04, (dt || 0.016) * followSpeed));
            u._tigerX += (targetX - u._tigerX) * followFactor;
            u._tigerDepth += (targetDepth - u._tigerDepth) * Math.min(1, (dt || 0.016) * 7);

            const moveDiff = targetX - u._tigerX;
            if (Math.abs(moveDiff) > 4) {
              u._tigerFacing = moveDiff > 0 ? 1 : -1;
            } else {
              u._tigerFacing = tigerFace;
            }

            const tDepth = clamp(u._tigerDepth, 0, 1);
            const cx = this.W / 2;
            const tigerScreenX = cx + (u._tigerX - cx) * (1 - tDepth * DEPTH_XCOMPRESS);
            const tigerGroundY = this.ground - tDepth * this.depthSpan;
            const tigerDepthScale = 1 - tDepth * DEPTH_SCALE_FALL;

            let arcY = 0;
            if (isPouncing) {
              const pounceDur = 0.58;
              const prog = 1 - Math.max(0, (u._tigerPounceUntil - this.t) / pounceDur);
              arcY = -Math.sin(prog * Math.PI) * 38;
            } else if (Math.abs(moveDiff) > 3 || u.moving) {
              arcY = -Math.abs(Math.sin(this.t * 11)) * 4.5;
            } else {
              arcY = Math.sin(this.t * 3.2) * 1.5;
            }

            const tigerScreenY = tigerGroundY + arcY;
            const tigerZ = 220 - Math.round(tDepth * 160) - 2;

            if (u._renderTigerZ !== tigerZ) {
              u._renderTigerZ = tigerZ;
              u.cookieButterTigerEl.style.zIndex = tigerZ;
            }

            const tigerTransform = `translate(${tigerScreenX.toFixed(1)}px,${tigerScreenY.toFixed(1)}px) scale(${tigerDepthScale.toFixed(3)})`;
            if (u._renderTigerTransform !== tigerTransform) {
              u._renderTigerTransform = tigerTransform;
              u.cookieButterTigerEl.style.transform = tigerTransform;
            }

            if (u.cookieButterTigerBodyEl) {
              const bodyTransform = `scaleX(${u._tigerFacing < 0 ? -1 : 1})`;
              if (u._renderTigerBody !== bodyTransform) {
                u._renderTigerBody = bodyTransform;
                u.cookieButterTigerBodyEl.style.transform = bodyTransform;
              }
            }

            if (u._tigerSwipingClass !== isSwiping) {
              u._tigerSwipingClass = isSwiping;
              u.cookieButterTigerEl.classList.toggle('swiping', isSwiping);
            }
            if (u._tigerPouncingClass !== isPouncing) {
              u._tigerPouncingClass = isPouncing;
              u.cookieButterTigerEl.classList.toggle('pouncing', isPouncing);
            }

            if (u._introOpacity != null && u._tigerRenderOpacity !== u._introOpacity) {
              u._tigerRenderOpacity = u._introOpacity;
              u.cookieButterTigerEl.style.opacity = u._introOpacity;
            }
          }
        }
      }
      if (u.cookieEyeEl && u._cookieEyeRendered !== !!u._cookieEyeDeceit) {
        u._cookieEyeRendered = !!u._cookieEyeDeceit;
        u.cookieEyeEl.classList.toggle('deceit',u._cookieEyeRendered);
      }
      if (wantedArt && u.shownArtSrc !== wantedArt) {
        const poseW = cookieTigerPose ? u.bodyW * (cookieTigerPose === 'mountedSkill' ? 1.65 : cookieTigerPose === 'mountedRun' ? 1.55 : cookieTigerPose === 'mountedIdle' ? 1.55 : cookieTigerPose === 'skill' ? 1.24 : cookieTigerPose === 'run' ? 1.03 : 1)
          : cookieBrightPose ? u.bodyW * (cookieBrightPose === 'skill3' ? 1.48 : cookieBrightPose === 'skill2' ? 1.22 : cookieBrightPose === 'attack' ? 1.42 : 1)
          : cookieBravePose ? u.bodyW * (cookieBravePose === 'attack' ? 1.5 : cookieBravePose === 'run' ? .91 : 1)
          : cookieCreamPose ? u.bodyW * (cookieCreamPose === 'skill1' ? 1.35 : cookieCreamPose === 'skill2' ? 1.32 : cookieCreamPose === 'run' ? 1.17 : 1)
          : cookieVanillaPose ? u.bodyW * (cookieVanillaPose === 'skill2' ? 1.62 : cookieVanillaPose === 'skill3' ? 1.3 : cookieVanillaPose === 'skill1' ? 1.12 : cookieVanillaPose === 'run' ? 1.15 : 1)
          : actionPose ? u.actionBodyW : u.bodyW;
        u.imgEl.src = wantedArt;
        u.bodyEl.style.width = `${poseW}px`;
        u.bodyEl.style.marginLeft = `${-poseW / 2}px`;
        u.shownArtSrc = wantedArt;
      }
      // Squirm can survive lethal hits and temporarily changes his max HP.
      // Older battle runs could leave his released portrait node blank after
      // one of those state changes, even though he was still alive. Restore
      // only the missing live image; dead units remain untouched.
      if (u.id === 'Squirm' && u.alive && u._introOpacity >= 1 && !u.naturalSprite) {
        if (u.el.style.display === 'none') u.el.style.display = '';
        if (!u.imgEl.getAttribute('src')) { u.imgEl.src = u.idleArtSrc; u.shownArtSrc = u.idleArtSrc; }
        if (u.el.style.opacity === '0') { u.el.style.opacity = '1'; u._renderOpacity = 1; }
      }
      if (u.flags.airborne || u.visualLaunch) extraY -= 80;
      if ((u.visualSleep || u.visualStun) && u.animStyle !== 'poppyBigBubble') rot += u.face * .22;
      // Filters are among the most expensive properties on these cutouts.
      // Compose the transient hit/status filter once, instead of rewriting it
      // for every unit on every animation frame.
      let filter = u.baseFilter || '';
      if (u.apexSpriteFilter) filter += (filter ? ' ' : '') + u.apexSpriteFilter;
      if (u.visualPetrify) {
        filter = 'grayscale(1) contrast(1.4)';
      } else if (u.visualFreeze) {
        filter = 'brightness(1.2) sepia(1) hue-rotate(160deg) saturate(3)';
      } else if (u.hitT > 0) {
        const k = u.hitT / .10;
        filter = `brightness(${1 + .32 * k}) saturate(${1 - .12 * k})`;
      }
      setStyleIfChanged(u.imgEl, 'filter', filter);
      u._filterCache = filter;

      // apply
      const yy = (u.yOff || 0) + bob + extraY;
      // A tiny paper-cutout tilt gives static portraits life, but rotating a
      // several-hundred-pixel atlas cell also rotates all of its transparent
      // effects padding and can clip the neighbouring action space.
      if (!u.naturalSprite) rot += u.paperTilt;

      // 2.5D staging: depth drives screen height, size and paint order.
      // Minions that don't carry a depth (set explicitly by summon()) just
      // render at their own fixed y, unaffected.
      let screenX = u.x, depthScale = 1;
      if (u.depth != null) {
        // introWalk() layers a personality hop/bob on top via _introYOffset -
        // added here, not written to u.y directly, so this depth recompute
        // (which runs every frame regardless) doesn't stomp it out.
        u.y = this.ground - u.depth * this.depthSpan + (u._introYOffset || 0);
        depthScale = 1 - u.depth * DEPTH_SCALE_FALL;
        const cx = this.W / 2;
        screenX = cx + (u.x - cx) * (1 - u.depth * DEPTH_XCOMPRESS);
        const z = 220 - Math.round(u.depth * 160) + (u.minion ? -8 : 0);
        if (u._renderZ !== z) { u._renderZ = z; u.el.style.zIndex = z; }
      }
      if (u.def.cookieRun && u.dialogueEl) {
        const anchor = this.unitFxAnchor(u);
        u.dialogueEl.style.left = `${anchor.x}px`;
        u.dialogueEl.style.top = `${anchor.y - anchor.size * .5 + yy}px`;
      }
      if (u.x == null || u.y == null) return;
      if (u._introOpacity != null && u._renderOpacity !== u._introOpacity) {
        u._renderOpacity = u._introOpacity; u.el.style.opacity = u._introOpacity;
      }
      const unitTransform = `translate(${screenX.toFixed(1)}px,${u.y.toFixed(1)}px) scale(${depthScale.toFixed(3)})`;
      if (u._renderUnitTransform !== unitTransform) {
        u._renderUnitTransform = unitTransform; u.el.style.transform = unitTransform;
      }
      const bodyTransform = `translateY(${yy.toFixed(1)}px) rotate(${(rot + lean * Math.PI / 180 * u.face).toFixed(3)}rad) scale(${sqx.toFixed(3)},${sqy.toFixed(3)})`;
      if (u._renderBodyTransform !== bodyTransform) {
        u._renderBodyTransform = bodyTransform; u.bodyEl.style.transform = bodyTransform;
      }
      // All source cutouts face right. This overrides the old team-wide CSS
      // flip so either side can now look toward its actual current target.
      const nativeFace = actionPose && SKILL_HERO_NATIVE_FACE[u.id]
        ? SKILL_HERO_NATIVE_FACE[u.id] : (u.def.nativeFace || 1);
      const faceTransform = `scaleX(${u.face * nativeFace < 0 ? -1 : 1})`;
      if (u._renderFace !== faceTransform) {
        u._renderFace = faceTransform; u.imgEl.style.transform = faceTransform;
      }
      if (u.swordEl) {
        // The weapon is a sibling of the character art, so it needs the same
        // live facing update without inheriting the art image's flip inline.
        const swordTransform = `scaleX(${u.face * nativeFace < 0 ? -1 : 1})`;
        if (u._renderSword !== swordTransform) {
          u._renderSword = swordTransform; u.swordEl.style.transform = swordTransform;
        }
      }

      // trails
      if (mv.trail && mv.trail.on && (u.moving || u.trailBurst > 0)) {
        u.trailT = (u.trailT || 0) - dt;
        if (u.trailBurst > 0) u.trailBurst -= dt;
        if (u.trailT <= 0) {
          u.trailT = (mv.trail.rate || .1) * (this._denseCombat ? 1.8 : 1);
          this.ghost(u, mv.trail.col);
        }
      }
      // ambient particles
      if (mv.particles && mv.particles !== 'none') {
        u.pT = (u.pT || 0) - dt;
        if (u.pT <= 0) {
          u.pT = (u.moving ? .22 : .65) * (this._denseCombat ? 1.8 : 1);
          this.ambient(u, mv);
        }
      }
      // footsteps
      if (u.moving && mv.step) {
        u.stepT = (u.stepT || 0) - dt * Math.abs(u.vx) / 70;
        if (u.stepT <= 0) {
          u.stepT = .42 * (this._denseCombat ? 1.35 : 1);
          const creatureStep = u.twisted && Sound.twisted(u, 'step', { vol: .34, rate: rnd(.96, 1.04), throttle: 180 });
          if (!creatureStep) Sound.play(mv.step, { vol: .18, rate: rnd(.9, 1.12), throttle: 90 });
          if (mv.shakeStep) FX.shake(mv.shakeStep, .1);
          FX.burst(u.x, u.y, 3, '#6b5a48', { dir: -Math.PI / 2, spread: .7, spMax: 90, sMax: 4, life: .35 });
        }
      }

      // bars - minions have no nameplate/HP-bar chrome (see buildUnitEl)
      if (u.hpEl) {
        // A tenth of a percent is below the useful resolution of these bars,
        // and avoids restyling them while energy/status ticks are the only
        // thing changing.
        const hp = Math.round(clamp(u.hpPct, 0, 1) * 1000) / 10;
        if (u._renderHp !== hp) {
          u._renderHp = hp; u.hpEl.style.width = hp + '%';
        }
        const hpLow = hp < 30 && u.alive;
        if (u._renderLow !== hpLow) {
          u._renderLow = hpLow; u.hpEl.parentElement.classList.toggle('low', hpLow);
        }
        const shield = Math.round(clamp(u.shieldTotal / u.max.hp, 0, 1) * 1000) / 10;
        if (u.shEl && u._renderShield !== shield) {
          u._renderShield = shield; u.shEl.style.width = shield + '%';
        }
        if (u.barHp) {
          const barLow = hp < 35;
          if (u._renderBarLow !== barLow) {
            u._renderBarLow = barLow; u.barHp.classList.toggle('low', barLow);
          }
          if (u._renderBarHp !== hp) {
            u._renderBarHp = hp; u.barHp.style.width = hp + '%';
          }
          const energy = Math.round(clamp(u.energy / u.energyMax, 0, 1) * 1000) / 10;
          if (u._renderEnergy !== energy) {
            u._renderEnergy = energy; u.barEn.style.width = energy + '%';
            u.barEn.parentElement.setAttribute('aria-valuenow', energy);
          }
          const ult = u.energy >= u.energyMax && u.alive;
          if (u._renderUlt !== ult) {
            u._renderUlt = ult; u.bar.classList.toggle('ult-ready', ult);
          }
        }
        if (u.qomMeterEl) {
          const m = qomMeterHtml(u);
          if (m && u._renderQomMeter !== m.key) {
            const thump = u.id === 'QOMGourdy' && u._renderQomMeter;
            u._renderQomMeter = m.key;
            u.qomMeterEl.className = 'qom-meter ' + m.cls + (m.accent ? ' hot' : '');
            u.qomMeterEl.innerHTML = m.html;
            if (thump) { void u.qomMeterEl.offsetWidth; u.qomMeterEl.classList.add('thump'); }
          }
        }
        // status icons
        if (u._renderStatusVersion !== u.statusVersion) {
          u._renderStatusVersion = u.statusVersion;
          const ordered = orderedBattleStatuses(u.statuses);
          // Summons/minions intentionally omit the floating status strip.
          // Their status list still updates for gameplay, but it must not
          // throw during rendering just because that optional node is absent.
          if (u.stsEl) {
            const overheadShown = ordered.slice(0, 4);
            const overheadExtra = ordered.length - overheadShown.length;
            u.stsEl.innerHTML = overheadShown.map(s => battleStatusChip(s, false)).join('') + (overheadExtra > 0 ? battleStatusOverflowChip(overheadExtra) : '');
            this.bindStatusHold(u.stsEl, u);
          }
          if (u.barSts) {
            const shown = ordered.slice(0, 4);
            const extra = ordered.length - shown.length;
            u.barSts.innerHTML = shown.map(s => battleStatusChip(s, true)).join('') + (extra > 0 ? battleStatusOverflowChip(extra) : '');
            this.bindStatusHold(u.barSts, u);
          }
        }
      }
    });
  }

  ghost() {
    // Full-sprite afterimages looked like white reflections below the unit.
    // Movement remains readable through the gait, dust, and projectiles.
  }

  ambient(u, mv) {
    const x = u.x + rnd(-22, 22), y = u.y - rnd(10, 70);
    const c = mv.pcol || '#fff';
    switch (mv.particles) {
      case 'sparkle': FX.part({ x, y, vx: rnd(-20, 20), vy: rnd(-50, -14), g: 30, size: rnd(9, 14),
        col: c, life: .8, shape: 'txt', char: pick(['✦', '·', '✧']), spin: rnd(-3, 3) }); break;
      case 'ember': FX.part({ x, y: u.y - rnd(0, 40), vx: rnd(-24, 24), vy: rnd(-90, -40), g: -30,
        size: rnd(3, 7), col: pick(['#ff8a3d', '#ffd166', '#ff5a1f']), life: rnd(.5, 1) }); break;
      case 'dust': FX.part({ x, y: u.y, vx: rnd(-40, 40), vy: rnd(-40, -8), g: 200, size: rnd(4, 9),
        col: c, life: .5, drag: 2, layer: 'b' }); break;
      case 'ink': FX.part({ x, y: u.y - rnd(0, 20), vx: rnd(-14, 14), vy: rnd(-8, 24), g: 300,
        size: rnd(4, 10), col: '#2a1740', life: .6, layer: 'b' }); break;
      case 'crumbs': FX.part({ x, y: u.y - 20, vx: rnd(-60, 60), vy: rnd(-70, -10), g: 700,
        size: rnd(3, 6), col: c, life: .7, shape: 'sq', spin: rnd(-10, 10) }); break;
      case 'confetti': FX.part({ x, y, vx: rnd(-70, 70), vy: rnd(-110, -30), g: 600, size: rnd(4, 8),
        col: pick(['#ff5b7f', '#ffc94d', '#6fe3c4', '#8f7fff']), life: 1, shape: 'sq', spin: rnd(-14, 14) }); break;
      case 'splash': FX.part({ x, y: u.y, vx: rnd(-70, 70), vy: rnd(-110, -30), g: 800, size: rnd(3, 7),
        col: c, life: .5 }); break;
      case 'steam': FX.part({ x, y: u.y - 60, vx: rnd(-14, 14), vy: rnd(-46, -18), g: -20,
        size: rnd(11, 22), col: c, life: 1.1, drag: 1.5, dscale: .7, layer: 'b' }); break;
      case 'notes': FX.part({ x, y, vx: rnd(-30, 30), vy: rnd(-60, -24), g: 40, size: rnd(12, 17),
        col: c, life: 1, shape: 'txt', char: pick(['♪', '♫']), spin: rnd(-3, 3) }); break;
      case 'glow': FX.part({ x, y, vx: rnd(-16, 16), vy: rnd(-30, -6), g: -10, size: rnd(5, 11),
        col: c, life: .8, drag: 1 }); break;
      case 'paint': FX.part({ x, y: u.y - rnd(0, 40), vx: rnd(-30, 30), vy: rnd(-20, 30), g: 500,
        size: rnd(4, 9), col: pick(['#ff5fa8', '#5fd0ff', '#ffd166']), life: .6, layer: 'b' }); break;
      case 'leaf': FX.part({ x, y, vx: rnd(-30, 30), vy: rnd(-40, -10), g: 90, size: rnd(8, 13),
        col: c, life: 1.2, shape: 'txt', char: pick(['🍃', '🌿']), spin: rnd(-4, 4) }); break;
      case 'petal': FX.part({ x, y, vx: rnd(-30, 30), vy: rnd(-40, -10), g: 80, size: rnd(9, 14),
        col: c, life: 1.1, shape: 'txt', char: '✿', spin: rnd(-4, 4) }); break;
      case 'pop': FX.part({ x, y, vx: rnd(-90, 90), vy: rnd(-140, -40), g: 700, size: rnd(4, 8),
        col: c, life: .6 }); break;
      case 'static': FX.part({ x, y, vx: rnd(-90, 90), vy: rnd(-30, 30), g: 0, size: rnd(2, 5),
        col: c, life: .18, drag: 4 }); break;
    }
  }
}
