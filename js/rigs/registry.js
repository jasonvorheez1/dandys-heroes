/* The same character rigs are used by battles and Story Mode. */
'use strict';

function rigKitFor(id) {
  if(typeof ReviewedCareBearRigs!=='undefined'&&ReviewedCareBearRigs[id])return ReviewedCareBearRigs[id];
  // Caramel Drizzle has its own painted cutout. Default Cosmo uses the
  // canonical sprite rig below; the costume kit disables itself otherwise.
  if (id === 'Cosmo') {
    const caramel = typeof CosmoCaramelRig !== 'undefined' ? CosmoCaramelRig : null;
    if (caramel && caramel.enabled()) return caramel;
    return typeof ToonCutoutRigs !== 'undefined' ? ToonCutoutRigs.Cosmo : null;
  }
  const kits = {
    Copper: typeof CopperRig !== 'undefined' ? CopperRig : null,
    Discard: typeof ToonsUniverseRigs !== 'undefined' ? ToonsUniverseRigs.Discard : null,
    Selena: typeof ToonsUniverseRigs !== 'undefined' ? ToonsUniverseRigs.Selena : null,
    Nugget: typeof NuggetRig !== 'undefined' ? NuggetRig : null,
    Cody: typeof CodyRig !== 'undefined' ? CodyRig : null,
    Dango: typeof DangoRig !== 'undefined' ? DangoRig : null,
    Scraps: typeof ScrapsRig !== 'undefined' ? ScrapsRig : null,
    Cosmo: typeof CosmoCaramelRig !== 'undefined' ? CosmoCaramelRig : null,
    Astro: typeof AstroRigs !== 'undefined' ? AstroRigs.Astro : null,
    BedtimeAstro: typeof AstroRigs !== 'undefined' ? AstroRigs.BedtimeAstro : null,
    Shelly: typeof ShellyRigs !== 'undefined' ? ShellyRigs.Shelly : null,
    CheerbearShelly: typeof ShellyRigs !== 'undefined' ? ShellyRigs.CheerbearShelly : null,
    Goob: typeof GoobRig !== 'undefined' ? GoobRig : null,
    Sprout: typeof SproutRig !== 'undefined' ? SproutRig : null,
    Gigi: typeof GigiRigs !== 'undefined' ? GigiRigs.Gigi : null,
    WishBearGigi: typeof GigiRigs !== 'undefined' ? GigiRigs.WishBearGigi : null,
    Bobette: typeof BobetteRig !== 'undefined' ? BobetteRig : null,
    Dyle: typeof DyleRig !== 'undefined' ? DyleRig : null,
    Vee: typeof VeeRig !== 'undefined' ? VeeRig : null,
    Shrimpo: typeof ShrimpoRig !== 'undefined' ? ShrimpoRig : null,
    Ginger: typeof GingerRig !== 'undefined' ? GingerRig : null,
    Dandy: typeof DandyRig !== 'undefined' ? DandyRig : null,
    Rudie: typeof RudieRig !== 'undefined' ? RudieRig : null,
    Finn: typeof FinnRig !== 'undefined' ? FinnRig : null,
    Looey: typeof LooeyRig !== 'undefined' ? LooeyRig : null,
    Soulvester: typeof SoulvesterRig !== 'undefined' ? SoulvesterRig : null,
    QOMSoulvester: typeof QOMSoulvesterRig !== 'undefined' ? QOMSoulvesterRig : null,
    Gourdy: typeof GourdyRig !== 'undefined' ? GourdyRig : null,
    QOMGourdy: typeof QOMGourdyRig !== 'undefined' ? QOMGourdyRig : null,
    Connie: typeof ConnieRig !== 'undefined' ? ConnieRig : null,
    QOMConnie: typeof QOMConnieRig !== 'undefined' ? QOMConnieRig : null,
    Cocoa: typeof CocoaRig !== 'undefined' ? CocoaRig : null,
    Jessie: typeof JessieRig !== 'undefined' ? JessieRig : null,
    TenderheartSprout: typeof ToonCutoutRigs !== 'undefined' ? ToonCutoutRigs.TenderheartSprout : null,
    ShareBearCosmo: typeof ToonCutoutRigs !== 'undefined' ? ToonCutoutRigs.ShareBearCosmo : null
  };
  return kits[id] || (typeof ToonCutoutRigs !== 'undefined' ? ToonCutoutRigs[id] : null) || null;
}

/* Battle rigs share one update budget and an optional skill clip layer. A clip
   moves the outer SVG; each character rig remains responsible for its joints.
   Registering a new skill needs only its animation style and a few poses:
   [progress, x, y, rotation, scaleX, scaleY]. */
const RigMotion = (() => {
  const clips = Object.create(null);
  const clamp01 = n => Math.max(0, Math.min(1, n));
  const motion = {
    strike: [[0, 0, 0, 0, 1, 1], [.22, -5, 2, -6, 1, 1], [.48, 8, -3, 9, 1.06, .96], [.76, 2, -1, 2, 1, 1], [1, 0, 0, 0, 1, 1]],
    throw: [[0, 0, 0, 0, 1, 1], [.3, -4, 2, -7, .98, 1.02], [.55, 5, -4, 8, 1.04, .96], [1, 0, 0, 0, 1, 1]],
    guard: [[0, 0, 0, 0, 1, 1], [.28, -2, 3, -4, 1.08, .94], [.7, -2, 3, -4, 1.08, .94], [1, 0, 0, 0, 1, 1]],
    lift: [[0, 0, 0, 0, 1, 1], [.35, 0, -8, -3, .96, 1.08], [.68, 0, -10, 3, .96, 1.09], [1, 0, 0, 0, 1, 1]],
    rush: [[0, 0, 0, 0, 1, 1], [.25, -6, 3, -9, 1.08, .94], [.58, 11, -2, 10, 1.1, .94], [1, 0, 0, 0, 1, 1]],
    float: [[0, 0, 0, 0, 1, 1], [.3, -3, -7, -5, 1, 1], [.68, 4, -10, 5, 1, 1], [1, 0, 0, 0, 1, 1]]
  };
  function register(id, styles, frames) {
    if (!clips[id]) clips[id] = Object.create(null);
    for (const style of Array.isArray(styles) ? styles : [styles]) clips[id][style] = frames;
  }
  register('Vee', ['veeAudience', 'veeCommercial'], motion.lift);
  register('Vee', 'veeSpotlight', motion.float);
  register('Vee', 'veeStrike', motion.strike);
  register('Gourdy', ['gourdyCandyToss', 'gourdyToss'], motion.throw);
  register('Gourdy', 'gourdyRush', motion.rush);
  register('Gourdy', 'gourdyTreat', motion.lift);
  register('Connie', ['connieDrift', 'connieEscape', 'connieReturn'], motion.float);
  register('Connie', ['conniePrank', 'conniePrankWindup'], motion.throw);
  register('Connie', 'conniePrankStrike', motion.strike);
  register('Soulvester', ['soulvesterArmor', 'soulvesterGuard'], motion.guard);
  register('Soulvester', 'soulvesterResolve', motion.lift);
  register('Soulvester', ['soulvesterSlam', 'soulvesterSword'], motion.strike);
  register('Shrimpo', ['shrimpoBully', 'shrimpoPunchCharge', 'shrimpoPunchWindup', 'shrimpoSpiteGain'], motion.guard);
  register('Shrimpo', ['shrimpoThrash', 'shrimpoSpiteBurst'], motion.strike);
  register('Ginger', ['gingerTreats', 'gingerCleansingTreats', 'gingerHeart'], motion.lift);
  register('Ginger', ['gingerPrep', 'gingerLastBite'], motion.guard);
  register('Ginger', 'gingerFlick', motion.throw);
  register('Jessie', ['jessiePose', 'jessiePerfectReception', 'jessieRoyalBroadcast'], motion.lift);
  register('Jessie', ['jessieHairFlip', 'jessieRadioJam'], motion.float);
  register('Jessie', ['jessieBasic', 'jessieDismiss', 'jessieCounterTeleport', 'jessieRoyalFinale'], motion.strike);
  register('Selena', ['selenaSonar', 'selenaEcho', 'selenaFinal'], motion.lift);
  register('Selena', ['selenaObserve', 'selenaObserveFinale'], motion.guard);
  register('Selena', ['selenaPursuit'], motion.rush);
  register('Copper', ['copperGuard', 'copperRescue'], motion.guard);
  register('Copper', ['copperFlame', 'copperIlluminate'], motion.lift);
  register('Copper', ['copperHeads'], motion.rush);
  register('Discard', ['discardBeatDown', 'discardPerfect'], motion.lift);
  register('Discard', ['discardFlow', 'discardBackOnBeat'], motion.float);
  register('Discard', ['discardTrack', 'discardEasy'], motion.throw);

  function drawClip(u, battle) {
    if(u.rig?.cbReviewed){const svg=u.imgEl.querySelector('svg');if(svg)svg.style.transform='';u._rigClipActive=false;return;}
    const style = u.animT > 0 && !FX.reducedEffects ? u.animStyle : null;
    const frames = style && clips[u.id] && clips[u.id][style];
    const toon = typeof ToonSkillMotion !== 'undefined' ? ToonSkillMotion.sample(u, battle.t) : null;
    if (!frames && !toon && !u._rigClipActive) return;
    const svg = u._rigMotionSvg || (u._rigMotionSvg = u.imgEl.querySelector('svg'));
    if (!svg) return;
    if (!frames && !toon) {
      svg.style.transform = '';
      svg.style.willChange = '';
      u._rigClipActive = false;
      u._rigClipTransform = null;
      return;
    }
    let x = 0, y = 0, r = 0, sx = 1, sy = 1;
    if (frames) {
      const progress = clamp01(1 - u.animT / Math.max(.01, u.animDur || 1));
      let i = 1;
      while (i < frames.length - 1 && progress > frames[i][0]) i++;
      const a = frames[i - 1], b = frames[i];
      const t = clamp01((progress - a[0]) / Math.max(.001, b[0] - a[0]));
      const v = n => a[n] + (b[n] - a[n]) * t;
      x = v(1); y = v(2); r = v(3); sx = v(4); sy = v(5);
    }
    if (toon) {
      // Joint rigs retain their authored pose; this is its skill-specific
      // silhouette and follow-through, softened when a clip already exists.
      const weight = frames ? .55 : .8;
      x += toon.x * weight; y += toon.y * weight; r += toon.r * weight;
      sx += (toon.sx - 1) * weight; sy += (toon.sy - 1) * weight;
    }
    const transform = `translate3d(${x.toFixed(1)}px,${y.toFixed(1)}px,0) rotate(${r.toFixed(1)}deg) scale(${sx.toFixed(3)},${sy.toFixed(3)})`;
    if (u._rigClipTransform !== transform) {
      u._rigClipTransform = transform;
      svg.style.transform = transform;
    }
    if (!u._rigClipActive) { svg.style.transformOrigin = '50% 80%'; svg.style.willChange = 'transform'; }
    u._rigClipActive = true;
  }

  function update(u, dt, battle) {
    const active = u.animT > 0 || !!u.casting || !!u.moving || u.hitT > 0 || !!u._toonSkillMotion;
    const action = u.animT > 0 ? `${u.animState}:${u.animStyle || ''}` : u.casting ? `cast:${u.casting.key || ''}` : u.moving ? 'move' : u.hitT > 0 ? 'hit' : 'idle';
    const interval = active ? 1 / 30 : battle._renderEvery > 1 ? 1 / 15 : 1 / 20;
    u._rigAccum = Math.min(.05, (u._rigAccum || 0) + dt * Math.min(battle.speed || 1, 3));
    if (action === u._rigAction && u._rigAccum + .0005 < interval) return;
    u._rigAction = action;
    const step = u._rigAccum;
    u._rigAccum = 0;
    u.rig.update(u, step, battle);
    if (typeof ToonRigJoints !== 'undefined') ToonRigJoints.update(u, battle);
    drawClip(u, battle);
  }
  return { register, update };
})();
