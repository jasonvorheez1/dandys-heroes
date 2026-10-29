/* Ability poses for the Dandy's World roster. The five entries in each row
   follow W/G/B/P/R. These are keyed to the authored kits in data/heroes*.js;
   they move the character art, while the skill's own cast supplies its prop,
   projectile and impact. Existing joint rigs continue to animate underneath. */
'use strict';

const ToonSkillMotion = (() => {
  const poses = {
    Astro:       'pulse drowse stars rest eclipse',
    Scraps:      'grapple scavenge crash craft mend',
    Vee:         'spotlight applause broadcast ratings broadcast',
    Cosmo:       'offer bake comfort knead feast',
    Cocoa:       'deliver share surprise ready basket',
    Bobette:     'wrap glow toss guard present',
    Boxten:      'windup melody rhythm windup finale',
    Brightney:   'flash guard beam glow flare',
    Coal:        'roll comfort toss guard rescue',
    Connie:      'vanish prank drift tether haunt',
    Ginger:      'bake decorate swirl knead feast',
    Bassie:      'basket share toss ready overflow',
    Blot:        'vanish wall trail mime illusion',
    Brusha:      'sweep palette stroke inspire finale',
    Looey:       'inflate bounce circus float finale',
    Rudie:       'charge hoof charge gallop sprint',
    Shelly:      'discover inspire solve study archive',
    Shrimpo:     'tantrum bully spite guard burst',
    Toodles:     'stumble luck miracle learn charm',
    Yatta:       'party scatter bounce cheer burst',
    Poppy:       'pop bounce shock float inflate',
    Sprout:      'harvest roots spores root bloom',
    Dyle:        'train whistle express schedule train',
    Gigi:        'rummage flip wager luck jackpot',
    Squirm:      'nibble cower flail read panic',
    Eggson:      'cane sweep shell hunt finale',
    Flyte:       'flap slam swoop hover soar',
    Rodger:      'inspect capsule dossier observe reveal',
    Soulvester:  'armor knight sword resolve sword',
    Gourdy:      'treat rush slam prank miracle',
    Eclipse:     'hunt rush claw stalk eclipse',
    Delilah:     'inspect vial contain observe experiment',
    RnD:         'mask stage curtain switch encore',
    Goob:        'hug reach block comfort reach',
    Waxwell:     'ignite melt snuff shape blaze',
    Finn:        'reel send trap coordinate catch',
    Phantasia:   'trick foresee ward hope wish',
    Tisha:       'tidy stack dust clean sparkle',
    Flutter:     'dash sweep flutter dodge storm',
    Teagan:      'pour serve hush remember banquet',
    Ribecca:     'rise bones rattle shrug rise',
    Glisten:     'mirror prism audience pose mirror',
    Dandy:       'show close smile charm reveal',
    Pebble:      'bark fetch tackle dodge wag',
    MrsHolloway: 'spiral memory embrace haunt legacy',
    MrHolloway:  'harvest downpour root guard embrace',
    TenderheartSprout: 'beam toss yank clap rally',
    ShareBearCosmo:    'platter swirl mirror offer feast',
    Jessie:            'spotlight dodge broadcast pose encore',
    Selena:            'swoop rush observe hover soar',
    Copper:            'guard rush glow glow rescue',
    Discard:           'stage glide broadcast rest encore'
  };
  const keys = ['W', 'G', 'B', 'P', 'R'];
  const table = Object.fromEntries(Object.entries(poses).map(([id, row]) => {
    const words = row.split(' ');
    return [id, Object.fromEntries(keys.map((key, i) => [key, words[i]]))];
  }));
  // Kit names that share a physical action use one measured pose, while the
  // character's own effect layer supplies the specific item or phenomenon.
  const aliases = {
    archive: 'study', bones: 'toss', catch: 'reel',
    charm: 'glow', clean: 'tidy', coordinate: 'observe', craft: 'scavenge',
    discover: 'inspect', drowse: 'float', experiment: 'vial', finale: 'encore',
    hope: 'offer', hush: 'guard', inspire: 'cheer', knight: 'armor',
    learn: 'study', legacy: 'spiral', memory: 'spiral', mend: 'wrap',
    mime: 'stage', overflow: 'basket', palette: 'decorate', pose: 'stage',
    prism: 'flash', ratings: 'audience', ready: 'guard', remember: 'inspect',
    rescue: 'charge', resolve: 'guard', rest: 'float', rise: 'bounce',
    roll: 'charge', shape: 'melt', show: 'stage', shrug: 'guard',
    smile: 'offer', solve: 'inspect', stalk: 'hunt', surprise: 'toss',
    tether: 'reach', trap: 'roots', ward: 'guard', windup: 'rhythm'
  };
  const clamp = n => Math.max(0, Math.min(1, n));
  const bell = (p, a = 0, b = 1) => Math.sin(Math.PI * clamp((p - a) / (b - a)));

  function begin(u, key, time, duration) {
    if (!table[u.id] || !table[u.id][key] || u.twisted) return;
    u._toonSkillMotion = { key, start: time, end: time + duration };
  }
  function extend(u, key, time, duration) {
    const current = u._toonSkillMotion;
    if (!current || current.key !== key) return;
    current.end = Math.max(current.end, time + duration);
  }
  function sample(u, time) {
    const run = u._toonSkillMotion;
    if (!run || !u.alive || (typeof FX !== 'undefined' && FX.reducedEffects)) return null;
    if (time >= run.end) { u._toonSkillMotion = null; return null; }
    const named = table[u.id] && table[u.id][run.key];
    const pose = aliases[named] || named;
    if (!pose) return null;
    const p = clamp((time - run.start) / Math.max(.12, run.end - run.start));
    const a = bell(p), prep = bell(p, 0, .48), hit = bell(p, .24, .8);
    const f = u.face || 1;
    let x = 0, y = 0, r = 0, sx = 1, sy = 1;
    const lean = n => { x += f * n * a; r += f * n * .45 * a; };
    switch (pose) {
      case 'grapple': case 'reach': case 'reel': case 'fetch':
        x = f * (-7 * prep + 16 * hit); y = -7 * hit; r = f * (-10 * prep + 16 * hit); sx += .11 * hit; break;
      case 'charge': case 'rush': case 'sprint': case 'dash': case 'tackle': case 'gallop':
        x = f * (-9 * prep + 22 * hit); y = 5 * prep - 4 * hit; r = f * (-8 * prep + 19 * hit); sx += .18 * hit; sy -= .12 * prep; break;
      case 'slam': case 'crash': case 'stomp': case 'shock': case 'burst':
        y = -16 * prep + 8 * hit; r = f * (-8 * prep + 15 * hit); sx += .23 * hit; sy -= .16 * hit; break;
      case 'bounce': case 'spring': case 'pop': case 'inflate':
        y = -24 * a; r = f * 13 * Math.sin(p * Math.PI * 2) * a; sx += .13 * hit; sy += .16 * prep - .12 * hit; break;
      case 'circus':
        y = -20 * a; x = f * 9 * Math.sin(p * Math.PI * 2) * a;
        r = f * 25 * Math.sin(p * Math.PI * 2) * a; sx += .2 * hit; break;
      case 'vanish': case 'drift': case 'float': case 'glide': case 'hover': case 'soar':
        x = f * 8 * Math.sin(p * Math.PI * 2) * a; y = -19 * a; r = f * 11 * Math.sin(p * Math.PI * 2) * a; break;
      case 'flap': case 'swoop': case 'storm': case 'flutter':
        x = f * (-5 * prep + 12 * hit); y = -14 * a - 4 * Math.abs(Math.sin(p * Math.PI * 8)) * a;
        r = f * 14 * Math.sin(p * Math.PI * 4) * a; break;
      case 'toss': case 'deliver': case 'send': case 'scatter': case 'basket': case 'capsule': case 'vial':
        x = f * (-8 * prep + 11 * hit); y = -5 * prep - 9 * hit; r = f * (-17 * prep + 22 * hit); break;
      case 'sweep': case 'stroke': case 'hoof': case 'claw': case 'sword': case 'cane': case 'flail': case 'rattle':
        x = f * (-8 * prep + 15 * hit); r = f * (-24 * prep + 33 * hit); y = -5 * hit; sx += .1 * hit; break;
      case 'guard': case 'armor': case 'shell': case 'contain': case 'wall': case 'root': case 'block':
        y = 8 * a; x = -f * 4 * a; r = -f * 7 * a; sx += .17 * a; sy -= .12 * a; break;
      case 'rummage': case 'knead': case 'decorate': case 'tidy': case 'stack': case 'read': case 'study': case 'scavenge':
        y = 5 * a + 3 * Math.sin(p * Math.PI * 8) * a; r = f * 8 * Math.sin(p * Math.PI * 6) * a; sx += .09 * a; sy -= .07 * a; break;
      case 'flip': case 'luck': case 'jackpot': case 'swirl': case 'twirl': case 'party':
        y = -15 * a; r = f * 29 * Math.sin(p * Math.PI * 2) * a; sx += .09 * hit; break;
      case 'wager':
        x = f * (8 * prep - 13 * hit); y = -10 * a;
        r = f * (17 * prep - 26 * hit); sx += .12 * hit; break;
      case 'beam': case 'spotlight': case 'inspect': case 'dossier': case 'observe': case 'foresee': case 'reveal':
        x = f * 5 * hit; y = -7 * a; r = -f * 12 * prep + f * 8 * hit; sx += .08 * a; break;
      case 'train': case 'express': case 'schedule':
        x = f * (-6 * prep + 18 * hit); y = 3 * Math.sin(p * Math.PI * 8) * a; r = f * 10 * hit; sx += .1 * hit; break;
      case 'whistle':
        y = -8 * prep; x = -f * 4 * prep; r = -f * 9 * prep + f * 4 * hit;
        sx += .08 * hit; sy += .1 * prep; break;
      case 'bark': case 'wag': case 'hug': case 'comfort': case 'offer': case 'share': case 'serve': case 'embrace':
        x = f * 7 * a; y = -8 * a; r = -f * 9 * a; sx += .12 * a; sy += .04 * a; break;
      case 'cower': case 'panic': case 'stumble': case 'dodge': case 'shrub':
        x = -f * 11 * a; y = 7 * a; r = -f * 17 * a; sx += .14 * a; sy -= .13 * a; break;
      case 'melody': case 'applause': case 'cheer': case 'stage': case 'encore': case 'audience':
        y = -8 * a - 4 * Math.abs(Math.sin(p * Math.PI * 6)) * a; r = f * 10 * Math.sin(p * Math.PI * 4) * a; sx += .1 * a; break;
      case 'rhythm':
        y = -3 * Math.abs(Math.sin(p * Math.PI * 10)) * a;
        r = f * 16 * Math.sin(p * Math.PI * 6) * a; sx += .09 * a; break;
      case 'broadcast':
        x = f * 8 * a; y = -11 * a; r = -f * 14 * prep + f * 5 * hit;
        sx += .08 * hit; sy += .06 * prep; break;
      case 'curtain':
        y = 7 * prep - 15 * hit; x = -f * 5 * prep;
        r = -f * 16 * prep + f * 19 * hit; sy -= .09 * prep; break;
      case 'flash': case 'flare': case 'glow': case 'pulse': case 'stars': case 'eclipse': case 'blaze': case 'ignite': case 'sparkle':
        y = -13 * a; sx += .18 * hit; sy += .13 * prep; r = f * 8 * Math.sin(p * Math.PI * 2) * a; break;
      case 'harvest': case 'roots': case 'bloom': case 'downpour': case 'melt': case 'trail': case 'dust':
        y = 6 * prep - 8 * hit; r = f * (-12 * prep + 18 * hit); sx += .12 * hit; break;
      case 'spores':
        x = f * (-6 * prep + 8 * hit); y = -8 * a;
        r = f * (-16 * prep + 13 * hit); sx += .08 * hit; break;
      case 'wrap': case 'present': case 'bake': case 'feast': case 'pour': case 'banquet': case 'treat': case 'miracle': case 'wish':
        y = 5 * prep - 15 * hit; r = f * (-9 * prep + 10 * hit); sx += .08 * a; sy += .08 * hit; break;
      case 'prank': case 'trick': case 'illusion': case 'mask': case 'switch': case 'mirror': case 'haunt': case 'spiral':
        x = f * 10 * Math.sin(p * Math.PI * 2) * a; y = -11 * a; r = f * 21 * Math.sin(p * Math.PI * 2) * a; break;
      case 'tantrum': case 'bully': case 'nibble': case 'hunt': case 'snuff': case 'close':
        x = f * (-6 * prep + 13 * hit); y = 5 * prep - 6 * hit; r = f * (-12 * prep + 18 * hit); sx += .12 * hit; break;
      case 'spite':
        x = f * (-10 * prep + 17 * hit); y = 9 * prep - 7 * hit;
        r = f * (-19 * prep + 28 * hit); sx += .18 * hit; sy -= .1 * prep; break;
      default:
        // Quiet passives still have a readable character pose in the skill file.
        lean(7); y = -7 * a; sx += .07 * a;
    }
    const scale = run.key === 'W' ? 1.12 : run.key === 'R' ? 1.22 : run.key === 'P' ? .72 : 1;
    return { x: x * scale, y: y * scale, r: r * scale,
      sx: 1 + (sx - 1) * scale, sy: 1 + (sy - 1) * scale, pose };
  }
  return { table, begin, extend, sample };
})();
