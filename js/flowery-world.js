/* flowery-world.js - the Deltarune-style overworld for "Flower Kingdom".
   Rooms are painted from the Chapter 5 tilesets and props in flowery.bin; the party walks on the plane (the leader is controlled,
   the other two follow in a line like Deltarune's), NPCs are talked to with [Z]/[Enter] or the A button, and triggers start scenes.
   Scenes are written as text scripts (js/flowery-story.js) and run by FW.run; see the command list above `const CMD`.

   World space is Deltarune's 1x (320 x 240 per screen); the canvas draws it at a whole-number scale with no smoothing.
   Scraps, Ginger and Yatta are NOT pixel art: they are the game's own smooth cutouts drawn small, on purpose (the story notices). */
'use strict';

const FW = (() => {
  const P = () => window.FlPack;
  const VW = 320, VH = 240;
  const toonArt = {
    Scraps: 'assets/toon-art/scraps/scraps.png', Ginger: 'assets/toon-art/Ginger/Ginger.png', Yatta: 'assets/toon-art/Yatta/Yatta.png'
  };
  const toonImg = {};
  Object.entries(toonArt).forEach(([k, src]) => { const i = new Image(); i.src = (typeof ASSET !== 'undefined' ? ASSET : './') + src; toonImg[k] = i; });

  /* ------------------------------------------------------------ cast: sprites per direction, portraits, voices */
  const W4 = (b, n = 4) => ({ down: [b + 'down', n], up: [b + 'up', n], left: [b + 'left', n], right: [b + 'right', n] });
  const CAST = {
    Scraps: { name: 'Scraps', toon: true, h: 46, voice: 520, color: '#ffd36b' },
    Ginger: { name: 'Ginger', toon: true, h: 44, voice: 400, color: '#ff9db0' },
    Yatta: { name: 'Yatta', toon: true, h: 46, voice: 640, color: '#ffe95c' },
    Flowery: { name: 'Flowery', walk: { down: ['flowery_walk_down_jacket_', 4], left: ['flowery_walk_left_jacket_', 4], right: ['flowery_walk_right_jacket_', 4], up: ['flowery_lookup_', 1, 'flowery_lookup_0'] },
      idle: { down: 'flowery_walk_down_jacket_0', left: 'flowery_walk_left_jacket_0', right: 'flowery_walk_right_jacket_0', up: 'flowery_lookup_0' }, voice: 300, color: '#ffe066' },
    Asgore: { name: 'Asgore', idle: { down: 'asgore_armor_sad_down_0', left: 'asgore_armor_run_left_0', right: 'asgore_expressions_right_0', up: 'asgore_lookup_documents_0' },
      walk: { left: ['asgore_armor_run_left_', 4], right: ['asgore_expressions_right_', 1], down: ['asgore_armor_sad_down_', 1], up: ['asgore_lookup_documents_', 1] }, voice: 150, color: '#f4c95d' },
    Seth: { name: 'Seth', walk: { down: ['seth_walk_down_', 4], up: ['seth_walk_up_', 4], left: ['seth_walk_left_', 2], right: ['seth_walk_right_', 2] }, voice: 360, color: '#c77dff' },
    Aqua: { name: 'Aqua', walk: { down: ['aqua_walk_down_', 4], up: ['aqua_walk_up_', 4], left: ['aqua_walk_left_', 4], right: ['aqua_walk_right_', 4] }, voice: 760, color: '#5ce1e6' },
    Blue: { name: 'Blue', walk: { down: ['blue_walk_back_', 6], up: ['blue_walk_back_', 6], left: ['blue_walk_l_', 4], right: ['blue_walk_r_', 4] },
      idle: { down: 'blue_poses_0', up: 'blue_up_0', left: 'blue_turn_head_l_0', right: 'blue_poses_r_0' }, voice: 470, color: '#8fa8ff' },
    Yellow: { name: 'Yellow', walk: W4('yellow_walk_'), idle: { down: 'yellow_centered_0', up: 'yellow_walk_up_0', left: 'yellow_quarter_0', right: 'yellow_quarter_right_0' }, voice: 230, color: '#ffcf4a' },
    Orange: { name: 'Orange', walk: W4('enemy_orange_walk_'), idle: { down: 'orange_centered_0', up: 'orange_lookup_0', left: 'enemy_orange_walk_left_0', right: 'enemy_orange_walk_right_0' }, voice: 900, color: '#ff9a3c' },
    Green: { name: 'Green', walk: { down: ['enemy_green_walk_', 4], up: ['enemy_green_walk_', 4], left: ['enemy_green_walk_', 4], right: ['enemy_green_walk_right_', 4] },
      idle: { down: 'green_centered_0', up: 'enemy_green_behind_0', left: 'enemy_green_0', right: 'enemy_green_right_0' }, voice: 260, color: '#7ee07e' },
    Pink: { name: 'Pink', walk: W4('pink_walk_'), idle: { down: 'pink_angle_0', up: 'pink_walk_up_0', left: 'pink_walk_left_0', right: 'pink_walk_right_0' }, voice: 820, color: '#ff8ad8' },
    Ralsei: { name: 'Ralsei', walk: W4('ralsei_walk_'), idle: { down: 'ralsei_walk_down_0', up: 'ralsei_walk_up_0', left: 'ralsei_walk_left_0', right: 'ralsei_walk_right_0' }, voice: 420, color: '#7fe07f' },
    Floradinn: { name: 'Floradinn', idle: { down: 'enemy_floradin_0', left: 'enemy_floradin_flipped_0', right: 'enemy_floradin_0', up: 'enemy_floradin_0' }, walk: { down: ['enemy_floradin_', 4], left: ['enemy_floradin_flipped_', 4], right: ['enemy_floradin_', 4], up: ['enemy_floradin_', 4] }, voice: 600, color: '#c6ff4a' },
    Floradinn2: { name: 'Floradinn', same: 'Floradinn' },
    Sign: { name: '', idle: { down: 'npc_sign_0' } },
    Locker: { name: '???', voice: 420, color: '#bbb' }
  };
  CAST.Floradinn2 = Object.assign({}, CAST.Floradinn);
  // Flowery's portraits (spr_face_flowery_N), by mood
  const FLOWERY_FACE = { smile: 0, look: 1, plain: 10, soft: 11, calm: 12, side: 13, cheer: 14, squint: 15, laugh: 16, gold: 17, wide: 18, serious: 19,
    happy: 2, frown: 20, snarl: 21, yell: 22, smirk: 23, small: 24, grin: 25, beam: 26, wink: 27, flat: 28, sad: 29, warm: 3, dark: 30, darksmile: 31,
    darkhurt: 32, darkgrin: 33, darkcalm: 34, blush: 4, sweat: 8, tear: 5, weep: 6, sigh: 7, ugh: 8, eh: 9, hair0: 'd_0', hair1: 'd_1', hair2: 'd_2', hair3: 'd_3', hair4: 'd_4' };
  const RALSEI_FACE = { smile: 0, blush: 1, happy: 2, wow: 12, worry: 14, annoyed: 15, plain: 16, glee: 25, content: 26, angry: 27, teary: 28, glare: 29,
    flat: 31, scream: 32, calm: 33, nervous: 36, sad: 37, wince: 38, gloom: 41, tired: 8, shock: 23, serious: 22, determined: 53, embarrassed: 58, pout: 54 };
  const BLUE_FACE = { plain: 0, soft: 1, sly: 2, sad: 3, wide: 4, cross: 5 };
  function portrait(id, face) {
    if (id === 'Flowery') { const k = FLOWERY_FACE[face] != null ? FLOWERY_FACE[face] : 0; return { pix: 'face_flowery_' + k }; }
    if (id === 'Ralsei') { const k = RALSEI_FACE[face] != null ? RALSEI_FACE[face] : 0; return { pix: 'face_r_nohat_' + k }; }
    if (id === 'Blue') { const k = BLUE_FACE[face] != null ? BLUE_FACE[face] : 0; return { pix: 'face_blue_' + k }; }
    if (CAST[id] && CAST[id].toon) return { img: (typeof ItemSheet !== 'undefined' ? ItemSheet.icon(id) : '') };
    const mini = { Seth: 'miniface_seth_0', Aqua: 'miniface_aqua_0', Yellow: 'miniface_yellow_0', Orange: 'miniface_orange_0', Green: 'miniface_green_0' }[id];
    return mini ? { pix: mini, mini: true } : null;
  }

  /* ------------------------------------------------------------ voice blips (Web Audio, square wave like the original's text) */
  let AC = null;
  // text blips: Deltarune's own text sounds from the pack (Flowery's voice noise, Asgore's), pitched per speaker; a square wave if missing
  const BLIP = { Flowery: ['voice:noise1', 'voice:noise2', 'voice:noise3'], Asgore: ['sfx:txtasg'] };
  function blip(freq, vol = .035, speaker) {
    const pk = P();
    if (pk && pk.play) {
      const set = BLIP[speaker], id = set ? set[Math.floor(Math.random() * set.length)] : 'sfx:text';
      const rate = set ? 1 : Math.max(.5, Math.min(2.2, (freq || 340) / 340));
      if (pk.play(id, set ? .55 : .45, rate)) return;
    }
    try {
      if (typeof Sound !== 'undefined' && Sound.on === false) return;
      AC = AC || new (window.AudioContext || window.webkitAudioContext)();
      const o = AC.createOscillator(), g = AC.createGain();
      o.type = 'square'; o.frequency.value = freq * (0.96 + Math.random() * .08);
      const v = vol * (typeof Sound !== 'undefined' && typeof Sound.vol === 'number' ? Sound.vol : 1);
      g.gain.setValueAtTime(v, AC.currentTime); g.gain.exponentialRampToValueAtTime(.0001, AC.currentTime + .06);
      o.connect(g); g.connect(AC.destination); o.start(); o.stop(AC.currentTime + .07);
    } catch (_) { /* audio is decoration */ }
  }
  // the scripts name sounds by the game's cue names or Deltarune's; Deltarune's (from the pack) win when there is one
  const SFXMAP = { bounce: 'jump', earth_quake: 'rumble', ui_alert: 'b', hit_light: 'hurtsmall', hit_water: 'bump', swing_light: 'smallswing', whoosh: 'wing',
    flash: 'great_shine', magiccircle: 'magicsprinkle', ui_select: 'select', ui_cancel: 'cantselect', step_metal: 'impact', cloth: 'wing', grow: 'paper_rise',
    glitch: 'noise', explode: 'badexplosion', hit_heavy: 'damage', guard: 'bump', heal: 'power', hit_slash: 'laz_c', swing_heavy: 'heavyswing', quake: 'screenshake' };
  const sfx = (cue, o = {}) => {
    const pk = P(), k = SFXMAP[cue] || cue;
    if (pk && pk.play && pk.sfx[k] && pk.play('sfx:' + k, o.vol == null ? .5 : o.vol, o.rate || 1)) return;
    try { Sound.play(cue, Object.assign({ vol: .5 }, o)); } catch (_) { /* optional */ }
  };

  /* ------------------------------------------------------------ rooms */
  // tileset rectangles [sheet, sx, sy, sw, sh]
  const TX = {
    grass: ['bg_dw_soft_cliff_grass_tileset', 40, 280, 160, 200], grassNight: ['bg_dw_soft_cliff_grass_tileset', 40, 840, 160, 160],
    grassEdgeA: ['bg_dw_soft_cliff_grass_tileset', 40, 520, 160, 120],
    cliffFace: ['tiles_cliff_dark_new', 20, 320, 140, 300], cliffFace2: ['tiles_cliff_dark_new', 200, 320, 160, 300],
    path: ['tiles_cliff_dark_new', 200, 200, 160, 120], vine: ['tiles_cliff_dark_new', 360, 200, 40, 360],
    diamond: ['tiles_cliff_dark_new', 20, 80, 140, 120],
    wallTop: ['tiles_flowercastle', 80, 20, 720, 240], wallLow: ['tiles_flowercastle', 80, 260, 720, 140], wallPaint: ['tiles_flowercastle', 80, 280, 720, 120],
    wood: ['tiles_flowercastle', 760, 1100, 200, 180], woodLeaf: ['tiles_flowercastle', 640, 1380, 340, 300], tatami: ['tiles_flowercastle', 80, 800, 220, 140],
    sand: ['tiles_flowercastle_exterior_new', 40, 440, 200, 160], stone: ['tiles_flowercastle_exterior_new', 40, 200, 200, 80],
    rail: ['tiles_flowercastle_exterior_new', 40, 700, 200, 60], stoneDark: ['tiles_flowercastle_exterior_new', 40, 1080, 200, 100],
    cafeWall: ['tiles_flowercastle_cafe', 20, 20, 240, 120]
  };
  function tileFill(ctx, t, x, y, w, h, ox = 0, oy = 0) {
    const [n, sx, sy, sw, sh] = t;
    ctx.save(); ctx.beginPath(); ctx.rect(x, y, w, h); ctx.clip();
    const x0 = x - ((ox % sw) + sw) % sw, y0 = y - ((oy % sh) + sh) % sh;
    for (let yy = y0; yy < y + h; yy += sh) for (let xx = x0; xx < x + w; xx += sw) P().blit(ctx, n, sx, sy, sw, sh, xx, yy);
    ctx.restore();
  }
  // sky backdrops are screen-fixed with a little parallax
  function sunsetSky(ctx, cam, t, opt = {}) {
    const g = ctx.createLinearGradient(0, 0, 0, VH);
    g.addColorStop(0, opt.night ? '#160c2e' : '#ff7a3a'); g.addColorStop(.55, opt.night ? '#3b1d4f' : '#ffb35a'); g.addColorStop(1, opt.night ? '#5b2a5e' : '#ffd77a');
    ctx.fillStyle = g; ctx.fillRect(0, 0, VW, VH);
    if (!opt.night) P().draw(ctx, 'sunrise_back_sky_0', VW / 2, VH * .9, { ax: .5, ay: 1, alpha: .35 });
    const px = -cam.x * .12;
    for (let i = -1; i < 3; i++) P().draw(ctx, 'sunrise_back_clouds_0', px % 1120 + i * 1120 + t * 4 % 1120, opt.cloudY || 70, { ax: 0, ay: .5, alpha: opt.night ? .25 : .8 });
    const cx = -cam.x * .2;
    for (let i = -1; i < 3; i++) P().draw(ctx, 'sunrise_back_cliffs_0', ((cx % 320) + 320) % 320 + (i - 1) * 320, opt.cliffY || 150, { ax: 0, ay: 1, alpha: opt.night ? .55 : 1 });
    if (opt.castle) P().draw(ctx, 'castle_distance_small_0', 230 - cam.x * .08, (opt.cliffY || 150) - 30, { ax: .5, ay: 1, alpha: opt.night ? .7 : 1 });
  }
  const ROOMS = {
    /* Gardenview, the lobby at night (the Dandy's Heroes side: the game's own background, not pixel art) */
    gardenview: { w: 320, h: 240, bounds: [20, 150, 300, 228], dh: true,
      back(ctx) {
        const img = ROOMS.gardenview._img || (ROOMS.gardenview._img = Object.assign(new Image(), { src: (typeof ASSET !== 'undefined' ? ASSET : './') + 'assets/uploads/backgroundlobby1.webp' }));
        ctx.fillStyle = '#120d18'; ctx.fillRect(0, 0, 320, 240);
        if (img.complete && img.naturalWidth) { ctx.save(); ctx.imageSmoothingEnabled = true; const k = Math.max(320 / img.naturalWidth, 240 / img.naturalHeight); ctx.drawImage(img, (320 - img.naturalWidth * k) / 2, 240 - img.naturalHeight * k, img.naturalWidth * k, img.naturalHeight * k); ctx.restore(); }
        ctx.fillStyle = 'rgba(10,6,30,.45)'; ctx.fillRect(0, 0, 320, 240);
      } },
    /* the first Dark World screen: a sunset cliff ledge */
    cliffs: { w: 640, h: 240, bounds: [10, 128, 630, 200], spawn: [60, 170],
      sky(ctx, cam, t) { sunsetSky(ctx, cam, t, { castle: true }); },
      back(ctx) {
        tileFill(ctx, TX.grass, 0, 118, 640, 92);
        tileFill(ctx, TX.cliffFace, 0, 206, 640, 60);
        ctx.fillStyle = 'rgba(70,20,40,.18)'; ctx.fillRect(0, 118, 640, 6);
      },
      props: [['scarecrow', 120, 140], ['grass', 210, 128], ['grass', 330, 125], ['grass', 520, 130], ['grassF', 160, 214], ['grassF', 430, 216]] },
    /* the Garden of Hopes and Dreams: glade, shrine, trees */
    garden: { w: 800, h: 300, bounds: [10, 120, 790, 280], spawn: [40, 210],
      sky(ctx, cam, t) { sunsetSky(ctx, cam, t, { cliffY: 120 }); },
      back(ctx) {
        tileFill(ctx, TX.grass, 0, 110, 800, 190);
        tileFill(ctx, TX.path, 0, 190, 800, 46);
        ctx.fillStyle = 'rgba(0,0,0,.12)'; ctx.fillRect(0, 186, 800, 4);
      },
      props: [['tree', 90, 150, 1], ['tree', 300, 140, 1], ['shrine', 520, 165, 1], ['tree', 700, 150, 1], ['plant', 180, 268], ['plant', 420, 270], ['plant', 640, 268], ['flowerA', 610, 240], ['bushF', 250, 290]] },
    /* cliff road towards the castle (Seth & Aqua) */
    road: { w: 900, h: 240, bounds: [10, 128, 890, 204], spawn: [30, 170],
      sky(ctx, cam, t) { sunsetSky(ctx, cam, t, { castle: true, cliffY: 140 }); },
      back(ctx) { tileFill(ctx, TX.grass, 0, 118, 900, 92); tileFill(ctx, TX.path, 0, 150, 900, 40); tileFill(ctx, TX.cliffFace2, 0, 206, 900, 60); },
      props: [['hang', 200, 120], ['grass', 330, 128], ['bell', 520, 120], ['grass', 640, 126], ['fox', 760, 150, 1], ['grassF', 260, 214], ['grassF', 700, 214]] },
    /* castle foyer (the flower wall) */
    foyer: { w: 320, h: 240, bounds: [20, 150, 300, 228], spawn: [160, 220],
      back(ctx) {
        P().draw(ctx, 'flower_background_0', 0, 0, { ax: 0, ay: 0 });
        tileFill(ctx, TX.wood, 0, 140, 320, 100);
        ctx.fillStyle = 'rgba(0,0,0,.18)'; ctx.fillRect(0, 140, 320, 3);
      },
      props: [['bigdoor', 160, 142, 1], ['lanternP', 60, 140], ['lanternP', 260, 140]] },
    /* the cafe (Green & Orange) */
    cafe: { w: 400, h: 240, bounds: [16, 140, 384, 228], spawn: [40, 200],
      back(ctx) {
        ctx.fillStyle = '#3a1f2a'; ctx.fillRect(0, 0, 400, 240);
        tileFill(ctx, TX.wallPaint, 0, 20, 400, 120);
        tileFill(ctx, TX.woodLeaf, 0, 136, 400, 104);
        P().draw(ctx, 'dw_cafe_flowers_0', 200, 136, { ax: .5, ay: 1, alpha: .25 });
      },
      props: [['vending', 40, 150, 1], ['tableL', 140, 190, 1], ['table', 230, 205, 1], ['tableH', 320, 185, 1], ['cafedoor', 370, 140]] },
    /* the left wing hall (Blue & Yellow): the doors */
    hall: { w: 560, h: 240, bounds: [16, 150, 544, 228], spawn: [30, 200],
      back(ctx) {
        ctx.fillStyle = '#2a1018'; ctx.fillRect(0, 0, 560, 240);
        tileFill(ctx, TX.wallTop, 0, -40, 560, 190);
        tileFill(ctx, TX.wood, 0, 146, 560, 94);
      },
      props: [['doorBlue', 150, 148], ['doorYellow', 300, 148], ['doorOrange', 450, 148]] },
    /* the zen garden / onsen at night (Pink) */
    onsen: { w: 320, h: 240, bounds: [20, 150, 300, 228], spawn: [40, 200],
      back(ctx) { ctx.fillStyle = '#0c0b18'; ctx.fillRect(0, 0, 320, 240); P().draw(ctx, 'dw_onsen_room_0', 0, 0, { ax: 0, ay: 0 }); },
      front(ctx) { P().draw(ctx, 'dw_onsen_back_0', 0, 0, { ax: 0, ay: 0, alpha: .9 }); },
      props: [['zenplant', 30, 230], ['zenplant', 290, 230]] },
    /* the courtyard at dusk (the climax) */
    courtyard: { w: 640, h: 300, bounds: [10, 140, 630, 288], spawn: [320, 270],
      sky(ctx, cam, t) { sunsetSky(ctx, cam, t, { night: true, castle: true, cliffY: 130 }); },
      back(ctx) { tileFill(ctx, TX.stone, 0, 100, 640, 40); tileFill(ctx, TX.sand, 0, 136, 640, 164); tileFill(ctx, TX.rail, 0, 118, 640, 24); },
      props: [['lanternO', 80, 150], ['lanternO', 560, 150], ['tree', 160, 160, 1], ['tree', 480, 160, 1]] },
    /* the top of the castle (Flowery) */
    roof: { w: 320, h: 240, bounds: [40, 150, 280, 220], spawn: [160, 210],
      sky(ctx, cam, t) {
        P().draw(ctx, 'castle_clouds_4_new_0', 0, 0, { ax: 0, ay: 0 });
        P().draw(ctx, 'castle_clouds_bottom_0', -((t * 6) % 320), 0, { ax: 0, ay: 0 }); P().draw(ctx, 'castle_clouds_bottom_0', 320 - ((t * 6) % 320), 0, { ax: 0, ay: 0 });
      },
      back(ctx, t) {
        P().draw(ctx, 'flowerytree_0', 160, 150, { ax: .5, ay: 1 });
        P().draw(ctx, 'castle_roof_1_0', 160, 240, { ax: .5, ay: 1 });
        P().draw(ctx, 'flowery_arena_platform_0', 160, 226, { ax: .5, ay: 1 });
        P().draw(ctx, 'fcastle_top_sideglow_' + (Math.floor(t * 4) % 3), 0, 0, { ax: 0, ay: 0, alpha: .5, blend: 'lighter' });
        P().draw(ctx, 'fcastle_top_sideglow_' + (Math.floor(t * 4) % 3), 320, 0, { ax: 0, ay: 0, alpha: .5, blend: 'lighter', flip: true });
      } },
    /* black void (falls, title cards) */
    void: { w: 320, h: 240, bounds: [0, 0, 320, 240], back(ctx) { ctx.fillStyle = '#000'; ctx.fillRect(0, 0, 320, 240); } }
  };
  // props: [frame or animation, anchor, solid footprint]
  const PROP = {
    scarecrow: { n: 'dw_scarecrow_not_enemy_sign_0', solid: [12, 6] }, grass: { n: 'dw_aquaplant_3_0' }, grassF: { n: 'dw_aquaplant_7_0', front: true },
    savepoint: { anim: ['savepoint_', 6, 8], solid: [10, 6] }, tree: { n: 'darkfruit_tree_big_0', solid: [40, 12] }, shrine: { parts: [2, 0, 3, 5, 6, 7, 8, 12, 1, 11, 14, 15, 9, 10, 13, 4].map(i => 'dw_aquashrine_' + i), solid: [50, 14] },
    plant: { n: 'dw_aquaplant_12_0' }, flowerA: { n: 'asgore_flower_0' }, bushF: { n: 'bigbush_0', front: true },
    hang: { anim: ['dw_moving_charm_cliff_', 6, 5] }, bell: { anim: ['dw_moving_bell_cliff_', 5, 5] }, shop: { n: 'dw_fox_statue_0', solid: [20, 8] },
    bigdoor: { n: 'fcastle_bigdoor_0', solid: [110, 10] }, lanternP: { anim: ['dw_moving_lantern_', 6, 5] }, lanternO: { anim: ['dw_moving_lantern_', 6, 5], solid: [12, 6] },
    vending: { n: 'bg_dw_fcastle_vending_machine_0', solid: [40, 10] }, table: { n: 'dw_cafe_table_0', solid: [36, 10] }, tableL: { n: 'dw_cafe_table_large_0', solid: [52, 10] },
    tableH: { n: 'dw_cafe_table_heart_0', solid: [36, 10] }, cafedoor: { n: 'dw_cafe_door_0' }, fox: { anim: ['dw_fox_statue_', 2, 2], solid: [20, 8] },
    doorBlue: { n: 'fcastle_left_twodoors_bluedoor_0' }, doorYellow: { n: 'fcastle_left_twodoors_yellowdoor_0' }, doorOrange: { n: 'fcastle_left_twodoors_orangedoor_0' },
    doorPink: { n: 'fcastle_pinkdoor_0' }, zenplant: { n: 'zengarden_fg_detail_1_0', front: true }, zentree: { n: 'plat_zengarden_tree1_0', solid: [30, 10] }, rock: { n: 'plat_zengarden_rock1_0', solid: [20, 6] },
    jail: { n: 'dw_fcastle_jail_bars_0' }, locker: { n: 'dw_ralseicupboard_0', solid: [26, 8] }, food: { n: 'green_omurice_0' }, cake: { n: 'green_cake_0' }
  };
  // resolve a prop frame by trying a few names (the archive's names vary); falls back to nothing
  function propFrame(p, t) {
    if (p.anim) { const [b, n, fps] = p.anim; const f = b + (Math.floor(t * fps) % n); if (P().has(f)) return f; }
    if (p.n && P().has(p.n)) return p.n;
    if (!p._alt) {
      const stem = (p.n || (p.anim && p.anim[0]) || '').replace(/_?\d*$/, '');
      p._alt = Object.keys(P().frames).find(k => k.startsWith(stem)) || '';
    }
    return p._alt;
  }

  /* ------------------------------------------------------------ state */
  let S = null;   // the live world
  function newWorld(root) {
    return { root, cv: null, ctx: null, K: 2, room: null, roomKey: '', actors: {}, party: [], trail: [], cam: { x: 0, y: 0, follow: true, tx: 0, ty: 0 },
      keys: {}, locked: true, t: 0, fx: { petals: false, ichor: 0, tint: null, fade: 0, fadeTo: 0, fadeCol: '#000', flash: 0, flashCol: '#fff', shake: 0, glitch: 0, rain: false, stars: false },
      npcs: {}, triggers: [], flags: {}, roaming: null, roams: [], finished: false, parts: [], overlays: [], speed: 1 };
  }
  function actor(id, x, y, dir = 'down') {
    const c = CAST[id] || CAST[id.replace(/\d+$/, '')] || { name: id };
    return { id, c, x, y, dir, moving: false, walkT: 0, frame: null, anim: null, z: 0, vz: 0, alpha: 1, hidden: false, s: 1, emote: null, spin: 0, flip: false, tint: null, shake: 0 };
  }

  /* ------------------------------------------------------------ input */
  const DIRK = { ArrowUp: 'up', KeyW: 'up', ArrowDown: 'down', KeyS: 'down', ArrowLeft: 'left', KeyA: 'left', ArrowRight: 'right', KeyD: 'right' };
  let confirmWaiter = null;
  function onKey(e, down) {
    if (!S) return;
    if (DIRK[e.code]) { S.keys[DIRK[e.code]] = down; e.preventDefault(); }
    if (down && (e.code === 'KeyZ' || e.code === 'Enter' || e.code === 'Space')) { e.preventDefault(); confirm(); }
    if (e.code === 'KeyX' || e.code === 'ShiftLeft' || e.code === 'ShiftRight') { S.keys.run = down; if (down) S.keys.cancel = true; }
  }
  function confirm() {
    if (confirmWaiter) { const f = confirmWaiter; confirmWaiter = null; f(); return; }
    if (S && S.roaming && !S.locked) interact();
  }
  const waitConfirm = () => new Promise(r => { confirmWaiter = r; });

  /* ------------------------------------------------------------ DOM */
  function build(root) {
    root.innerHTML = `<div class="fk-screen"><canvas class="fk-cv"></canvas><div class="fk-card"></div>
      <div class="fk-box" hidden><div class="fk-face"></div><div class="fk-text"></div><i class="fk-next"></i></div>
      <div class="fk-choice" hidden></div><div class="fk-hint"></div></div>
      <div class="fk-pad" aria-hidden="true"><button data-d="up">▲</button><button data-d="left">◀</button><button data-d="right">▶</button><button data-d="down">▼</button></div>
      <button class="fk-a" type="button" aria-label="Confirm">Z</button><button class="fk-quit" type="button" aria-label="Leave">✕</button>`;
    S.cv = root.querySelector('.fk-cv'); S.ctx = S.cv.getContext('2d');
    root.querySelectorAll('.fk-pad button').forEach(b => {
      const d = b.dataset.d, on = e => { e.preventDefault(); S.keys[d] = true; }, off = e => { e.preventDefault(); S.keys[d] = false; };
      b.addEventListener('pointerdown', on); b.addEventListener('pointerup', off); b.addEventListener('pointerleave', off); b.addEventListener('pointercancel', off);
    });
    root.querySelector('.fk-a').addEventListener('pointerdown', e => { e.preventDefault(); confirm(); });
    root.querySelector('.fk-screen').addEventListener('pointerdown', e => { if (confirmWaiter && !e.target.closest('.fk-choice')) { e.preventDefault(); confirm(); } });
    root.querySelector('.fk-quit').onclick = () => { if (S && S.onQuit) S.onQuit(); };
  }
  function resize() {
    if (!S) return;
    const box = S.root.querySelector('.fk-screen').getBoundingClientRect();
    const K = Math.max(1, Math.min(Math.floor(box.width / VW), Math.floor(box.height / VH)) || 1);
    const k = Math.min(box.width / VW, box.height / VH);
    S.K = Math.max(2, K * (window.devicePixelRatio > 1.5 ? 2 : 1));
    S.cv.width = VW * S.K; S.cv.height = VH * S.K;
    S.cv.style.width = VW * k + 'px'; S.cv.style.height = VH * k + 'px';
  }

  /* ------------------------------------------------------------ update & draw */
  const SPEED = 92;
  function step(dt) {
    S.t += dt;
    const lead = S.party.length ? S.actors[S.party[0]] : null;
    if (lead && !S.locked && S.roaming) {
      let dx = (S.keys.right ? 1 : 0) - (S.keys.left ? 1 : 0), dy = (S.keys.down ? 1 : 0) - (S.keys.up ? 1 : 0);
      if (dx || dy) {
        const sp = SPEED * (S.keys.run ? 1.6 : 1) * dt, len = Math.hypot(dx, dy);
        tryMove(lead, dx / len * sp, dy / len * sp);
        lead.dir = dy < 0 && Math.abs(dy) >= Math.abs(dx) ? 'up' : dy > 0 && Math.abs(dy) >= Math.abs(dx) ? 'down' : dx < 0 ? 'left' : 'right';
        lead.moving = true; lead.walkT += dt * (S.keys.run ? 1.6 : 1);
        checkTriggers(lead);
      } else lead.moving = false;
    }
    // caterpillar: followers walk the leader's path
    if (lead && !S.followOff) {
      const last = S.trail[0];
      if (!last || Math.hypot(last.x - lead.x, last.y - lead.y) > 1) S.trail.unshift({ x: lead.x, y: lead.y, dir: lead.dir });
      if (S.trail.length > 200) S.trail.length = 200;
      S.party.slice(1).forEach((id, i) => {
        const a = S.actors[id]; if (!a || a.scripted) return;
        const p = S.trail[Math.min(S.trail.length - 1, (i + 1) * 14)];
        if (p) { a.moving = Math.hypot(p.x - a.x, p.y - a.y) > .4; if (a.moving) a.walkT += dt; a.x = p.x; a.y = p.y; a.dir = p.dir; }
      });
    }
    Object.values(S.actors).forEach(a => {
      if (a.tween) {
        const tw = a.tween; tw.t += dt;
        const k = Math.min(1, tw.t / tw.d);
        a.x = tw.x0 + (tw.x1 - tw.x0) * k; a.y = tw.y0 + (tw.y1 - tw.y0) * k;
        a.moving = !tw.slide; a.walkT += dt * (tw.run ? 1.7 : 1);
        if (k >= 1) { a.tween = null; a.moving = false; tw.done(); }
      }
      if (a.z > 0 || a.vz) { a.vz -= 520 * dt; a.z = Math.max(0, a.z + a.vz * dt); if (a.z === 0 && a.vz < 0) a.vz = 0; }
      if (a.shake > 0) a.shake = Math.max(0, a.shake - dt * 30);
      if (a.spin) a.spinA = (a.spinA || 0) + a.spin * dt;
    });
    // camera
    const R = S.room;
    if (S.cam.follow && lead) { S.cam.tx = lead.x - VW / 2; S.cam.ty = lead.y - VH / 2 - 10; }
    if (S.cam.tween) {
      const c = S.cam.tween; c.t += dt; const k = Math.min(1, c.t / c.d), e = k * k * (3 - 2 * k);
      S.cam.tx = c.x0 + (c.x1 - c.x0) * e; S.cam.ty = c.y0 + (c.y1 - c.y0) * e; if (k >= 1) { S.cam.tween = null; c.done(); }
    }
    S.cam.x = Math.max(0, Math.min(R.w - VW, S.cam.tx)); S.cam.y = Math.max(0, Math.min(R.h - VH, S.cam.ty));
    // effects
    const fx = S.fx;
    if (fx.fade !== fx.fadeTo) { const d = Math.sign(fx.fadeTo - fx.fade) * dt / (fx.fadeD || .5); fx.fade = d > 0 ? Math.min(fx.fadeTo, fx.fade + d) : Math.max(fx.fadeTo, fx.fade + d); }
    fx.flash = Math.max(0, fx.flash - dt * 2.5); fx.shake = Math.max(0, fx.shake - dt * 18); fx.glitch = Math.max(0, fx.glitch - dt);
    if (fx.petals && Math.random() < dt * 9) S.parts.push({ k: 'petal', x: S.cam.x + Math.random() * (VW + 60) - 30, y: S.cam.y - 10, vx: -14 - Math.random() * 20, vy: 18 + Math.random() * 14, a: Math.random() * 6, life: 9 });
    if (fx.ichor > 0 && Math.random() < dt * 14 * fx.ichor) S.parts.push({ k: 'ichor', x: S.cam.x + Math.random() * VW, y: S.cam.y + VH + 4, vx: 0, vy: -10 - Math.random() * 18, a: 0, life: 7, r: 1 + Math.random() * 3 });
    S.parts.forEach(p => { p.x += p.vx * dt; p.y += p.vy * dt; p.a += dt * 3; p.life -= dt; });
    S.parts = S.parts.filter(p => p.life > 0);
  }
  function tryMove(a, dx, dy) {
    const R = S.room, b = R.bounds;
    const ok = (x, y) => x >= b[0] && x <= b[2] && y >= b[1] && y <= b[3] && !solidAt(x, y, a);
    if (ok(a.x + dx, a.y)) a.x += dx;
    if (ok(a.x, a.y + dy)) a.y += dy;
  }
  function solidAt(x, y, self) {
    for (const s of S.solids) if (x > s[0] && x < s[2] && y > s[1] && y < s[3]) return true;
    for (const id in S.actors) {
      const o = S.actors[id];
      if (o === self || o.hidden || S.party.includes(id) || o.ghost) continue;
      if (Math.abs(o.x - x) < 9 && Math.abs(o.y - y) < 5) return true;
    }
    return false;
  }
  function checkTriggers(a) {
    for (const tr of S.triggers) {
      if (tr.fired && tr.once) continue;
      const inside = a.x > tr.x && a.x < tr.x + tr.w && a.y > tr.y && a.y < tr.y + tr.h;
      if (inside && !tr.inside) { tr.inside = true; tr.fired = true; runBlock(tr.label); return; }
      if (!inside) tr.inside = false;
    }
  }
  function interact() {
    const a = S.actors[S.party[0]]; if (!a) return;
    const fx = { up: [0, -16], down: [0, 16], left: [-16, 0], right: [16, 0] }[a.dir];
    const px = a.x + fx[0], py = a.y + fx[1];
    let best = null, bd = 22;
    Object.entries(S.npcs).forEach(([id, label]) => {
      const o = S.actors[id]; if (!o || o.hidden) return;
      const d = Math.hypot(o.x - px, (o.y - py) * 1.4); if (d < bd) { bd = d; best = [id, label]; }
    });
    S.room._props.forEach(p => { if (p.label) { const d = Math.hypot(p.x - px, (p.y - py) * 1.4); if (d < bd) { bd = d; best = [null, p.label]; } } });
    if (best) {
      const o = best[0] && S.actors[best[0]];
      if (o && !o.noTurn) o.dir = { up: 'down', down: 'up', left: 'right', right: 'left' }[a.dir];
      a.moving = false;
      runBlock(best[1]);
    }
  }

  function actorFrame(a) {
    if (a.frame) return a.frame;
    if (a.anim) { const [b, n, fps, once] = a.anim; const i = Math.floor((S.t - a.animT0) * fps); return b + (once ? Math.min(n - 1, i) : i % n); }
    const c = a.c.same ? CAST[a.c.same] : a.c;
    const w = c.walk && c.walk[a.dir];
    if (a.moving && w) return w[0] + (Math.floor(a.walkT * 7) % w[1]);
    if (c.idle && c.idle[a.dir]) return c.idle[a.dir];
    if (w) return w[2] || w[0] + '0';
    return null;
  }
  function drawActor(ctx, a) {
    if (a.hidden) return;
    const x = a.x - S.cam.x + (a.shake ? (Math.random() - .5) * a.shake : 0), y = a.y - S.cam.y - a.z;
    // shadow
    ctx.fillStyle = 'rgba(0,0,0,.22)'; ctx.beginPath(); ctx.ellipse(a.x - S.cam.x, a.y - S.cam.y, 9 * a.s, 3 * a.s, 0, 0, Math.PI * 2); ctx.fill();
    if (a.c.toon && !a.frame && !a.anim) {
      const img = toonImg[a.id]; if (!img || !img.naturalWidth) return;
      const h = a.c.h * a.s, w = img.naturalWidth / img.naturalHeight * h;
      const bob = a.moving ? Math.abs(Math.sin(a.walkT * 11)) * 2.2 : Math.sin(S.t * 2 + a.x) * .4;
      const sq = a.moving ? 1 + Math.sin(a.walkT * 22) * .03 : 1;
      ctx.save(); ctx.translate(x, y - bob); ctx.globalAlpha = a.alpha;
      if (a.spinA) ctx.rotate(a.spinA);
      if (a.moving) ctx.rotate(Math.sin(a.walkT * 11) * .06);
      const face = a.dir === 'left' ? -1 : a.dir === 'right' ? 1 : (a.lastFace || 1); if (a.dir === 'left' || a.dir === 'right') a.lastFace = face;
      ctx.scale((a.flip ? -1 : 1) * face * (a.c.nativeFace || 1), 1);
      ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = 'high';
      if (a.dir === 'up') ctx.filter = 'brightness(.82)';
      ctx.drawImage(img, -w / 2, -h * sq, w, h * sq);
      ctx.filter = 'none';
      if (a.tint) { ctx.globalCompositeOperation = 'source-atop'; ctx.fillStyle = a.tint; ctx.fillRect(-w / 2, -h, w, h); }
      ctx.restore(); ctx.imageSmoothingEnabled = false;
    } else {
      const f = actorFrame(a);
      if (f) P().draw(ctx, f, x, y, { alpha: a.alpha, flip: a.flip, s: a.s, rot: a.spinA || 0, tint: a.tint || undefined });
    }
    if (a.emote) {
      const e = a.emote; ctx.fillStyle = '#fff'; ctx.font = 'bold 12px monospace'; ctx.textAlign = 'center';
      const top = a.c.toon ? a.c.h * a.s : (P().size(actorFrame(a)).h || 40) * a.s;
      ctx.strokeStyle = '#000'; ctx.lineWidth = 3; ctx.strokeText(e, x, y - top - 4); ctx.fillText(e, x, y - top - 4);
    }
  }
  function draw() {
    const ctx = S.ctx, K = S.K, R = S.room;
    ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.imageSmoothingEnabled = false;
    ctx.fillStyle = '#000'; ctx.fillRect(0, 0, S.cv.width, S.cv.height);
    const sh = S.fx.shake ? [(Math.random() - .5) * S.fx.shake, (Math.random() - .5) * S.fx.shake] : [0, 0];
    ctx.setTransform(K, 0, 0, K, sh[0] * K, sh[1] * K);
    if (R.sky) R.sky(ctx, S.cam, S.t);
    ctx.save(); ctx.translate(-Math.round(S.cam.x), -Math.round(S.cam.y));
    R.back && R.back(ctx, S.t);
    const list = [];
    R._props.forEach(p => { if (!p.def.front) list.push({ y: p.y, draw: () => { if (p.def.parts) { p.def.parts.forEach(n => P().draw(ctx, n, p.x, p.y)); return; } const f = propFrame(p.def, S.t); if (f) P().draw(ctx, f, p.x, p.y); } }); });
    ctx.restore();
    Object.values(S.actors).forEach(a => list.push({ y: a.y + (a.zBias || 0), draw: () => drawActor(ctx, a), actor: true }));
    list.sort((a, b) => a.y - b.y);
    list.forEach(o => { if (o.actor) o.draw(); else { ctx.save(); ctx.translate(-Math.round(S.cam.x), -Math.round(S.cam.y)); o.draw(); ctx.restore(); } });
    ctx.save(); ctx.translate(-Math.round(S.cam.x), -Math.round(S.cam.y));
    R._props.forEach(p => { if (p.def.front) { const f = propFrame(p.def, S.t); if (f) P().draw(ctx, f, p.x, p.y); } });
    S.parts.forEach(p => {
      if (p.k === 'petal') P().draw(ctx, 'spin_petal_' + (Math.floor(p.a) % 5), p.x, p.y, { ax: .5, ay: .5 }) || (ctx.fillStyle = '#ffb3c9', ctx.fillRect(p.x, p.y, 2, 2));
      else { ctx.fillStyle = 'rgba(10,0,20,.85)'; ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, 7); ctx.fill(); }
    });
    if (R.front) R.front(ctx, S.t);
    ctx.restore();
    S.overlays.forEach(f => f(ctx, S.t));
    if (S.fx.tint) { ctx.fillStyle = S.fx.tint; ctx.fillRect(0, 0, VW, VH); }
    if (S.fx.ichor > 0) { const g = ctx.createLinearGradient(0, VH * .5, 0, VH); g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(8,0,16,' + Math.min(.85, S.fx.ichor * .7) + ')'); ctx.fillStyle = g; ctx.fillRect(0, 0, VW, VH); }
    if (S.fx.glitch > 0) for (let i = 0; i < 6; i++) { const y = Math.random() * VH, h = 2 + Math.random() * 8; ctx.drawImage(S.cv, 0, y * K, VW * K, h * K, (Math.random() - .5) * 20, y, VW, h); }
    if (S.fx.flash > 0) { ctx.globalAlpha = Math.min(1, S.fx.flash); ctx.fillStyle = S.fx.flashCol; ctx.fillRect(0, 0, VW, VH); ctx.globalAlpha = 1; }
    if (S.fx.fade > 0) { ctx.globalAlpha = S.fx.fade; ctx.fillStyle = S.fx.fadeCol; ctx.fillRect(0, 0, VW, VH); ctx.globalAlpha = 1; }
  }
  let raf = 0, lastT = 0;
  function loop(now) {
    if (!S || !S.root.isConnected) { raf = 0; return; }
    const dt = Math.min(.05, (now - (lastT || now)) / 1000) * S.speed; lastT = now;
    step(dt); draw();
    raf = requestAnimationFrame(loop);
  }

  /* ------------------------------------------------------------ rooms in/out */
  function loadRoom(key, x, y, dir) {
    const R = ROOMS[key]; if (!R) throw new Error('no room ' + key);
    S.room = R; S.roomKey = key; S.npcs = {}; S.triggers = []; S.trail = [];
    R._props = (R.props || []).map(([k, px, py, solid]) => ({ def: PROP[k] || { n: k }, x: px, y: py, solid }));
    S.solids = R._props.filter(p => p.solid && p.def.solid).map(p => [p.x - p.def.solid[0] / 2, p.y - p.def.solid[1], p.x + p.def.solid[0] / 2, p.y + 2]);
    Object.keys(S.actors).forEach(id => { if (!S.party.includes(id)) delete S.actors[id]; });
    const sp = [x != null ? x : (R.spawn || [160, 200])[0], y != null ? y : (R.spawn || [160, 200])[1]];
    S.party.forEach((id, i) => { const a = S.actors[id] || (S.actors[id] = actor(id)); a.x = sp[0] - i * 3; a.y = sp[1]; a.dir = dir || 'right'; a.hidden = false; a.scripted = false; a.frame = null; a.anim = null; });
    S.cam.follow = true; const lead = S.actors[S.party[0]]; if (lead) { S.cam.tx = lead.x - VW / 2; S.cam.ty = lead.y - VH / 2; }
    else { S.cam.tx = 0; S.cam.ty = 0; }
  }

  /* ------------------------------------------------------------ textbox */
  const faceCache = {};
  function faceURL(p) { if (!p || !p.pix) return ''; return faceCache[p.pix] || (faceCache[p.pix] = P().url(p.pix, p.mini ? 3 : 2)); }
  async function testRoam() {
    const seen = S._seen || (S._seen = new Set());
    for (const [id, label] of Object.entries(S.npcs)) { if (seen.has(label)) continue; seen.add(label); await runBlock(label); if (S.finished) return; }
    for (const p of S.room._props) { if (!p.label || seen.has(p.label)) continue; seen.add(p.label); await runBlock(p.label); if (S.finished) return; }
    for (const [id, label] of Object.entries(S.npcs)) { if (seen.has(label + '#2')) continue; seen.add(label + '#2'); await runBlock(label); if (S.finished) return; }
    for (let i = 0; i < S.triggers.length; i++) { const tr = S.triggers[i]; if (tr.fired) continue; tr.fired = true; await runBlock(tr.label); if (S.finished) return; i = -1; }
  }
  async function say(speaker, face, text, opt = {}) {
    if (FW.test) { FW.testLog && FW.testLog.push((speaker || '*') + ': ' + text); if (speaker && !CAST[speaker]) console.warn('[flowery] unknown speaker ' + speaker); return; }
    const box = S.root.querySelector('.fk-box'), tEl = box.querySelector('.fk-text'), fEl = box.querySelector('.fk-face');
    const c = CAST[speaker];
    const p = speaker ? portrait(speaker, face) : null;
    box.hidden = false; box.classList.toggle('has-face', !!p); box.classList.toggle('mini', !!(p && p.mini)); box.classList.toggle('toon', !!(p && p.img));
    box.classList.toggle('shout', !!opt.shout); box.dataset.speaker = speaker || '';
    fEl.innerHTML = p ? `<img src="${p.img || faceURL(p)}" alt="">` : '';
    tEl.innerHTML = '';
    const name = speaker && opt.showName !== false && (!p || p.mini) ? `<b style="color:${(c && c.color) || '#fff'}">${(c && c.name) || speaker}</b>` : '';
    const lines = String(text).split(' | ');
    tEl.innerHTML = name + lines.map(() => '<p><span class="ast">*</span><span class="tx"></span></p>').join('');
    const spans = tEl.querySelectorAll('.tx');
    const voice = c && c.voice ? c.voice : 340;
    if (speaker) { const a = S.actors[speaker]; if (a) { a.talk = true; } }
    let skip = false; confirmWaiter = () => { skip = true; };
    for (let li = 0; li < lines.length; li++) {
      const L = lines[li];
      for (let i = 0; i < L.length; i++) {
        if (skip) { spans.forEach((s, k) => { s.textContent = lines[k]; }); break; }
        spans[li].textContent = L.slice(0, i + 1);
        const ch = L[i];
        if (ch !== ' ' && i % 2 === 0) blip(speaker ? voice : 280, speaker ? .03 : .018, speaker);
        await new Promise(r => setTimeout(r, (/[.!?,]/.test(ch) && L[i + 1] === ' ' ? 120 : 26) / (opt.fast ? 2 : 1)));
      }
      if (skip) break;
    }
    confirmWaiter = null;
    box.classList.add('done');
    if (opt.auto) await new Promise(r => setTimeout(r, opt.auto));
    else await waitConfirm();
    box.classList.remove('done');
    if (speaker) { const a = S.actors[speaker]; if (a) a.talk = false; }
  }
  function hideBox() { const b = S.root.querySelector('.fk-box'); if (b) b.hidden = true; }
  async function choice(opts) {
    if (FW.test) { S._cn = (S._cn || 0) + 1; return ((FW.testChoice || 0) + (S._cn > 1 && opts.length > 2 ? S._cn - 1 : 0)) % opts.length; }
    const el = S.root.querySelector('.fk-choice');
    el.hidden = false; el.innerHTML = opts.map((o, i) => `<button type="button" data-i="${i}"><i>♥</i>${o}</button>`).join('');
    let sel = 0; const btns = [...el.querySelectorAll('button')];
    const mark = () => btns.forEach((b, i) => b.classList.toggle('on', i === sel)); mark();
    return new Promise(res => {
      const pick = i => { document.removeEventListener('keydown', kd, true); el.hidden = true; sfx('ui_select'); res(i); };
      const kd = e => {
        if (e.code === 'ArrowLeft' || e.code === 'ArrowUp' || e.code === 'KeyA') { sel = (sel + btns.length - 1) % btns.length; mark(); e.stopPropagation(); }
        if (e.code === 'ArrowRight' || e.code === 'ArrowDown' || e.code === 'KeyD') { sel = (sel + 1) % btns.length; mark(); e.stopPropagation(); }
        if (e.code === 'KeyZ' || e.code === 'Enter' || e.code === 'Space') { e.preventDefault(); e.stopPropagation(); pick(sel); }
      };
      document.addEventListener('keydown', kd, true);
      btns.forEach((b, i) => b.onclick = () => pick(i));
    });
  }
  async function card(title, sub, ms = 2600) {
    if (FW.test) return;
    const el = S.root.querySelector('.fk-card');
    el.innerHTML = `<div><small>${sub || ''}</small><h2>${title}</h2></div>`; el.classList.add('on');
    await new Promise(r => setTimeout(r, ms)); el.classList.remove('on');
    await new Promise(r => setTimeout(r, 500));
  }

  /* ------------------------------------------------------------ script runner
     Lines:
       Name.face: text      dialogue (face optional; \n splits lines in one box; a trailing ! on the name shakes the box: Name!.face:)
       * text               narration
       # label              starts a block (the block before any label is "main")
       @room key [x y dir]  @party A,B,C|off   @spawn Id x y [dir]   @remove Id   @hide Id / @show Id
       @walk Id x y [secs] [run]   @slide Id x y secs    @face Id dir   @frame Id name   @anim Id base n fps [once]   @idle Id
       @jump Id [v]   @spin Id speed   @emote Id text|off   @alpha Id a   @scale Id s   @tint Id color|off   @shakeA Id
       @lead x y [dir]   @follow on|off   @cam x y secs | @cam Id secs | @cam follow
       @wait secs  @shake px  @flash [color]  @fade out|in [secs] [color]  @fx petals|ichor N|tint color|clear|glitch secs
       @music key|stop   @sfx cue   @card Title|Sub   @npc Id label   @talk label (on nearest prop: @sign x y label)
       @trigger x y w h label [repeat]   @roam   @done   @goto label   @call label   @flag name   @if name label   @ifnot name label
       @choice A|B|C  (then @if choice=N label)   @cut name   @battle name   @end
     A leading & runs a command without waiting for it. */
  const blocks = {}; let program = null;
  function parse(src) {
    const out = { main: [] }; let cur = 'main';
    String(src).split('\n').forEach(raw => {
      const line = raw.replace(/\s+$/, '');
      if (!line.trim() || line.trim().startsWith('//')) return;
      const m = line.match(/^#\s*([\w-]+)/);
      if (m) { cur = m[1]; out[cur] = out[cur] || []; return; }
      out[cur].push(line.trim());
    });
    return out;
  }
  let vars = {};
  async function runLines(lines) {
    for (let i = 0; i < lines.length; i++) {
      if (S._abort) return 'abort';
      if (S.finished) return 'stop';
      let line = lines[i], bg = false;
      if (line.startsWith('&')) { bg = true; line = line.slice(1).trim(); }
      const p = exec(line);
      if (!bg) { const r = await p; if (r === 'stop' || r === 'abort') return r; if (r && r.goto) return r; }
    }
  }
  async function runBlock(label) {
    const b = program && program[label]; if (!b) { console.warn('[flowery] no block', label); return; }
    const was = S.locked; S.locked = true;
    const lead = S.actors[S.party[0]]; if (lead) lead.moving = false;
    let r = await runLines(b);
    while (r && r.goto) r = await runLines(program[r.goto] || []);
    hideBox();
    if (S.roaming && r !== 'abort' && !S.finished) S.locked = false; else S.locked = was && !S.roaming;
    return r;
  }
  const num = v => parseFloat(v);
  const act = id => S.actors[id] || (S.actors[id] = actor(id, 160, 200));
  function walkTo(a, x, y, secs, o = {}) {
    return new Promise(res => {
      const dx = x - a.x, dy = y - a.y, d = Math.hypot(dx, dy);
      if (d < .5) { res(); return; }
      const t = FW.test ? .001 : secs != null && !isNaN(secs) ? secs : d / (o.run ? 140 : 70);
      if (!o.keepDir) a.dir = Math.abs(dy) > Math.abs(dx) ? (dy < 0 ? 'up' : 'down') : (dx < 0 ? 'left' : 'right');
      a.tween = { x0: a.x, y0: a.y, x1: x, y1: y, t: 0, d: Math.max(.05, t), done: res, run: o.run, slide: o.slide };
    });
  }
  const CUTS = {};    // name -> async (S, args) ; filled by flowery-cuts / battle files
  const BATTLES = {}; // name -> async (S, args) -> result
  async function exec(line) {
    const dm = line.match(/^([A-Z][\w]*)(!)?(?:\.([\w]*))?(!)?:\s?(.*)$/);
    if (dm) { await say(dm[1], dm[3] || '', dm[5], { shout: !!(dm[2] || dm[4]) }); return; }
    if (line.startsWith('*')) { await say(null, null, line.replace(/^\*\s?/, '')); return; }
    if (!line.startsWith('@')) { await say(null, null, line); return; }
    const parts = line.slice(1).match(/"[^"]*"|\S+/g).map(s => s.replace(/^"|"$/g, ''));
    const [cmd, ...a] = parts;
    switch (cmd) {
      case 'room': hideBox(); loadRoom(a[0], a[1] != null ? num(a[1]) : null, a[2] != null ? num(a[2]) : null, a[3]); return;
      case 'party': {
        if (a[0] === 'off') { S.party.forEach(id => { if (S.actors[id]) S.actors[id].scripted = true; }); S.followOff = true; return; }
        if (a[0] === 'on') { S.followOff = false; S.trail = []; S.party.forEach(id => { if (S.actors[id]) S.actors[id].scripted = false; }); return; }
        const ids = a[0].split(','); const lead = S.actors[S.party[0]];
        ids.forEach((id, i) => { if (!S.actors[id]) { S.actors[id] = actor(id, lead ? lead.x - i * 10 : 160, lead ? lead.y : 200); } });
        S.party = ids; S.trail = []; return;
      }
      case 'spawn': { const o = actor(a[0], num(a[1]), num(a[2]), a[3] || 'down'); S.actors[a[0]] = o; return; }
      case 'remove': delete S.actors[a[0]]; delete S.npcs[a[0]]; return;
      case 'hide': act(a[0]).hidden = true; return;
      case 'show': act(a[0]).hidden = false; return;
      case 'walk': case 'run': { const o = act(a[0]); o.frame = null; o.anim = null; o.scripted = true; await walkTo(o, num(a[1]), num(a[2]), a[3] && a[3] !== 'run' ? num(a[3]) : null, { run: cmd === 'run' || a.includes('run') }); return; }
      case 'slide': { const o = act(a[0]); o.scripted = true; await walkTo(o, num(a[1]), num(a[2]), num(a[3]), { slide: true, keepDir: true }); return; }
      case 'face': act(a[0]).dir = a[1]; act(a[0]).frame = null; act(a[0]).anim = null; return;
      case 'frame': { const o = act(a[0]); o.anim = null; o.frame = a[1] === 'off' ? null : a[1]; if (FW.test && o.frame && !P().has(o.frame)) console.warn('[flowery] missing frame ' + o.frame); return; }
      case 'anim': { const o = act(a[0]); if (FW.test && !P().has(a[1] + '0')) console.warn('[flowery] missing anim ' + a[1]); o.frame = null; o.anim = [a[1], num(a[2]), num(a[3] || 8), a[4] === 'once']; o.animT0 = S.t; if (a[4] === 'once' && !FW.test) await new Promise(r => setTimeout(r, num(a[2]) / num(a[3] || 8) * 1000)); return; }
      case 'idle': { const o = act(a[0]); o.frame = null; o.anim = null; o.scripted = false; return; }
      case 'jump': { const o = act(a[0]); o.vz = num(a[1] || 150); o.z = .01; sfx('bounce', { vol: .3 }); if (!FW.test) await new Promise(r => setTimeout(r, 420)); return; }
      case 'spin': act(a[0]).spin = num(a[1]); if (!num(a[1])) act(a[0]).spinA = 0; return;
      case 'emote': act(a[0]).emote = a[1] === 'off' ? null : a.slice(1).join(' '); if (a[1] !== 'off') { sfx('ui_alert', { vol: .25 }); } return;
      case 'alpha': act(a[0]).alpha = num(a[1]); return;
      case 'scale': act(a[0]).s = num(a[1]); return;
      case 'tint': act(a[0]).tint = a[1] === 'off' ? null : a[1]; return;
      case 'shakeA': act(a[0]).shake = num(a[1] || 6); return;
      case 'ghost': act(a[0]).ghost = a[1] !== 'off'; return;
      case 'lead': { const o = act(S.party[0]); o.x = num(a[0]); o.y = num(a[1]); if (a[2]) o.dir = a[2]; S.trail = []; S.party.slice(1).forEach((id, i) => { const f = act(id); f.x = o.x - (i + 1) * 3; f.y = o.y; f.dir = o.dir; }); return; }
      case 'follow': S.followOff = a[0] === 'off'; if (!S.followOff) S.trail = []; return;
      case 'cam': {
        if (a[0] === 'follow') { S.cam.follow = true; return; }
        S.cam.follow = false;
        let x, y, secs;
        if (isNaN(num(a[0]))) { const o = act(a[0]); x = o.x - VW / 2; y = o.y - VH / 2 - 10; secs = num(a[1] || .8); } else { x = num(a[0]); y = num(a[1]); secs = num(a[2] || .8); }
        await new Promise(res => { S.cam.tween = { x0: S.cam.x, y0: S.cam.y, x1: x, y1: y, t: 0, d: FW.test ? .001 : Math.max(.01, secs), done: res }; });
        return;
      }
      case 'wait': if (FW.test) return; await new Promise(r => setTimeout(r, num(a[0]) * 1000 / (S.speed || 1))); return;
      case 'shake': S.fx.shake = num(a[0] || 6); sfx('earth_quake', { vol: .25 }); return;
      case 'flash': S.fx.flash = 1; S.fx.flashCol = a[0] || '#fff'; return;
      case 'fade': if (FW.test) { S.fx.fadeTo = S.fx.fade = a[0] === 'out' ? 1 : 0; return; } S.fx.fadeTo = a[0] === 'out' ? 1 : 0; S.fx.fadeD = num(a[1] || .6); if (a[2]) S.fx.fadeCol = a[2]; await new Promise(r => setTimeout(r, S.fx.fadeD * 1000)); return;
      case 'fx': {
        if (a[0] === 'petals') S.fx.petals = a[1] !== 'off';
        if (a[0] === 'ichor') S.fx.ichor = num(a[1] || 0);
        if (a[0] === 'tint') S.fx.tint = a[1] === 'off' ? null : a[1];
        if (a[0] === 'glitch') { S.fx.glitch = num(a[1] || .5); sfx('glitch', { vol: .3 }); }
        if (a[0] === 'clear') Object.assign(S.fx, { petals: false, ichor: 0, tint: null });
        return;
      }
      case 'music': try { if (a[0] === 'stop') Music.stop(); else FW.music(a[0]); } catch (_) { /* optional */ } return;
      case 'sfx': sfx(a[0], { vol: num(a[1] || .5) }); return;
      case 'card': { hideBox(); const [t, s] = a.join(' ').split('|'); await card(t, s); return; }
      case 'npc': S.npcs[a[0]] = a[1]; return;
      case 'unnpc': delete S.npcs[a[0]]; return;
      case 'sign': S.room._props.push({ def: PROP[a[3]] || { n: a[3] || 'npc_sign_0' }, x: num(a[0]), y: num(a[1]), label: a[2] }); return;
      case 'trigger': S.triggers.push({ x: num(a[0]), y: num(a[1]), w: num(a[2]), h: num(a[3]), label: a[4], once: a[5] !== 'repeat' }); return;
      case 'untrigger': S.triggers = S.triggers.filter(t => t.label !== a[0]); return;
      case 'roam': {
        hideBox();
        const hint = S.root.querySelector('.fk-hint'); hint.textContent = a.length ? a.join(' ') : ''; hint.classList.toggle('on', !!a.length);
        if (FW.test) { await testRoam(); hint.classList.remove('on'); return S.finished ? 'stop' : undefined; }
        await new Promise(res => { S.roaming = { done: res }; S.roams.push(S.roaming); S.locked = false; });
        hint.classList.remove('on'); return S.finished ? 'stop' : undefined;
      }
      case 'done': if (S.roaming) { const r = S.roaming; S.roams.pop(); S.roaming = S.roams[S.roams.length - 1] || null; S.locked = true; r.done(); } return 'stop';
      case 'finish': { S.finished = true; hideBox(); const all = S.roams.splice(0); S.roaming = null; S.locked = true; all.forEach(r => r.done()); return 'stop'; }
      case 'goto': return { goto: a[0] };
      case 'call': { const b = program[a[0]]; if (b) { let r = await runLines(b); while (r && r.goto) r = await runLines(program[r.goto] || []); if (r === 'stop' || r === 'abort') return r; } return; }
      case 'flag': S.flags[a[0]] = a[1] !== 'off'; return;
      case 'if': case 'ifnot': {
        const [k, v] = a[0].split('=');
        const hit = v != null ? String(vars[k]) === v : !!S.flags[k];
        if ((cmd === 'if') === hit) return { goto: a[1] };
        return;
      }
      case 'choice': { const r = await choice(a.join(' ').split('|')); vars.choice = r + 1; return; }
      case 'cut': { hideBox(); const f = CUTS[a[0]]; if (!f) console.warn('[flowery] missing cut ' + a[0]); if (f && !FW.test) await f(S, a.slice(1), FW); return; }
      case 'battle': { hideBox(); const f = BATTLES[a[0]]; if (!f) console.warn('[flowery] missing battle ' + a[0]); if (FW.test) return; if (f) { const r = await f(S, a.slice(1), FW); vars.battle = r; if (r === 'quit') return 'abort'; } return; }
      case 'voice': { if (FW.test) { if (P().voice && !P().voice[a[0]]) console.warn('[flowery] missing voice ' + a[0]); return; } const r = voiceLine(null, a[0], a.slice(1).join(' ')); if (!line.startsWith('&')) await r; return; }
      case 'end': return 'stop';
      default: console.warn('[flowery] unknown command', line);
    }
  }

  /* ------------------------------------------------------------ Flowery's voice lines
     The real clip plays when flowery.bin has voice/<key> (tools/flowery/voice); otherwise an anime-style banner with a synthesized
     sparkle sting stands in. Either way the line is shown big on screen, the way he shows them off. */
  function sting() {
    try {
      if (typeof Sound !== 'undefined' && Sound.on === false) return;
      AC = AC || new (window.AudioContext || window.webkitAudioContext)();
      [880, 1175, 1568, 2093].forEach((f, i) => {
        const o = AC.createOscillator(), g = AC.createGain(), t0 = AC.currentTime + i * .06;
        o.type = 'triangle'; o.frequency.value = f;
        g.gain.setValueAtTime(.0001, t0); g.gain.exponentialRampToValueAtTime(.06, t0 + .02); g.gain.exponentialRampToValueAtTime(.0001, t0 + .5);
        o.connect(g); g.connect(AC.destination); o.start(t0); o.stop(t0 + .55);
      });
    } catch (_) { /* decoration */ }
  }
  // Flowery's voice clips play as plain audio (no on-screen text)
  function voiceLine(host, key, text, opt = {}) {
    const url = P() && P().voice && P().voice[key];
    if (!url || (typeof Sound !== 'undefined' && Sound.on === false)) return Promise.resolve();
    return new Promise(res => {
      try {
        const a = new Audio(url); a.volume = Math.min(1, .95 * (typeof Sound !== 'undefined' && typeof Sound.vol === 'number' ? Sound.vol : 1));
        a.addEventListener('ended', res, { once: true }); a.addEventListener('error', res, { once: true }); setTimeout(res, 6000);
        a.play().catch(res);
      } catch (_) { res(); }
    });
  }

  /* ------------------------------------------------------------ public */
  function open(rootEl, opt = {}) {
    close();
    S = newWorld(rootEl); vars = {};
    build(rootEl); resize();
    S.onQuit = opt.onQuit;
    S._kd = e => onKey(e, true); S._ku = e => onKey(e, false);
    document.addEventListener('keydown', S._kd); document.addEventListener('keyup', S._ku);
    S._rs = () => resize(); window.addEventListener('resize', S._rs);
    loadRoom('void');
    try { P().warm(); } catch (_) { /* optional */ }
    lastT = 0; raf = requestAnimationFrame(loop);
    return S;
  }
  function close() {
    if (!S) return;
    S._abort = true;
    document.removeEventListener('keydown', S._kd); document.removeEventListener('keyup', S._ku); window.removeEventListener('resize', S._rs);
    cancelAnimationFrame(raf); raf = 0; confirmWaiter = null; S = null;
  }
  async function play(script, opt = {}) {
    program = parse(script);
    S.locked = true; S.finished = false; S.roams = []; S.roaming = null;
    const r = await runBlock('main');
    return r;
  }
  // music: the bin's tracks first, then the game's own
  const FALLBACK = { flKingdom: 'stInteresting', flCliffs: 'stNeutral', flCastle: 'stClair', flFlowery: 'stBossa', flAsgore: 'stEmotional', flBattle: 'stBattle',
    flBoss: 'stBoss', flOmega: 'stColossus', flSad: 'stEmotional', flNight: 'stJournal', flTension: 'stUnknown', flHome: 'stJournal' };
  function music(key) {
    if (typeof MUSIC_TRACKS === 'undefined') return;
    const url = P() && P().music[key];
    if (url) { MUSIC_TRACKS[key] = url; Music.play(key); return; }
    const fb = FALLBACK[key] || key;
    if (MUSIC_TRACKS[fb]) Music.play(fb); else if (typeof stTrack === 'function' && MUSIC_TRACKS[stTrack(fb)]) Music.play(stTrack(fb));
  }
  return { test: false, testChoice: 0, testLog: null, open, close, play, say, voiceLine, sting, choice, card, CUTS, BATTLES, CAST, ROOMS, PROP, TX, tileFill, sunsetSky, music, blip, sfx, walkTo, act, get S() { return S; }, VW, VH, toonImg, hideBox, runBlock };
})();
window.FW = FW;
