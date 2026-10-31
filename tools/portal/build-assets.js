/* Builds assets/aperture/ from the raw Portal files: the 3D models, the MUGEN GLaDOS character and the Chell sprite sheet.
   Everything ends up as plain 2D PNG, and the many small sprites are packed into ONE atlas (atlas.png + atlas.json) to keep the file count down.
   Output: atlas.png, atlas.json, wheatley.png and glados.png (story portraits), chell/Chell.png and chell/icon.png (the hero), backgrounds.
   usage (from the game folder): node tools/portal/build-assets.js <path to the portal folder>
   needs sharp (npm i sharp, or set NODE_PATH). The Chell sheet is read from <portal folder>/4pi5xfr6zecb1.png. Sprite sheets are pixel art, so
   they are enlarged with nearest-neighbour only. Anything facing left in the source is flipped so every sprite faces right. */
'use strict';
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');
const sharp = require('sharp');

const SRC = process.argv[2];
if (!SRC) { console.log('usage: node tools/portal/build-assets.js <portal folder>'); process.exit(1); }
const ROOT = path.resolve(__dirname, '..', '..');
const OUT = path.join(ROOT, 'assets', 'aperture');
const TMP = path.join(require('os').tmpdir(), 'aperture-build');
const LOOSE = path.join(TMP, 'loose');
fs.rmSync(LOOSE, { recursive: true, force: true });
fs.mkdirSync(path.join(OUT, 'chell'), { recursive: true });
fs.mkdirSync(path.join(OUT, 'bg'), { recursive: true });
fs.mkdirSync(LOOSE, { recursive: true });

const run = (script, args) => { const r = spawnSync(process.execPath, [path.join(__dirname, script), ...args], { stdio: 'inherit', env: process.env }); if (r.status !== 0) throw new Error(script + ' failed'); };
const render = (obj, tex, out, extra) => run('render-obj.js', [path.join(SRC, obj), tex, path.join(LOOSE, out), ...extra]);
const up = async (file, k) => { const m = await sharp(file).metadata(); return sharp(file).resize(m.width * k, m.height * k, { kernel: 'nearest' }).png().toBuffer(); };

(async () => {
  const pieces = {};            // name -> PNG buffer
  const addFile = async (name, file, k = 1) => { pieces[name] = k === 1 ? fs.readFileSync(file) : await up(file, k); };

  /* GLaDOS (MUGEN SFF) */
  const raw = path.join(TMP, 'glados');
  run('sff-extract.js', [path.join(SRC, 'GLaDOS', 'GLaDOS.sff'), path.join(SRC, 'GLaDOS', 'GLaDOS.act'), raw]);
  const keep = {
    'glados-0': 'g1_i0', 'glados-1': 'g1_i1', 'glados-2': 'g1_i2', 'glados-3': 'g1_i3', 'glados-4': 'g1_i4',
    'portal-blue': 'g2_i0', 'portal-orange': 'g2_i1',
    'core-orange': 'g10001_i0', 'core-blue': 'g10002_i0', 'core-red': 'g10003_i0',
    'core-orange-1': 'g10001_i1', 'core-blue-1': 'g10002_i1', 'core-red-1': 'g10003_i1',
    'rocket': 'g2010_i0', 'laser': 'g2002_i0',
    'boom-0': 'g2011_i0', 'boom-1': 'g2011_i1', 'boom-2': 'g2011_i2', 'boom-3': 'g2011_i3', 'boom-4': 'g2011_i4',
    'incinerator-off': 'g2200_i0', 'incinerator-on': 'g2200_i1'
  };
  for (const [name, file] of Object.entries(keep)) await addFile(name, path.join(raw, file + '.png'));

  /* 3D props -> 2D. Source models are z-up except the pedestal and the radio. */
  const turretTex = path.join(SRC, 'EDITOR_turret.png');
  render('EDITOR_turret_sentry.obj', turretTex, 'turret.png', ['--up', 'z', '--yaw', '205', '--size', '180']);
  render('EDITOR_turret_frankenturret.obj', turretTex, 'frankenturret.png', ['--up', 'z', '--yaw', '0', '--size', '128']);
  run('render-obj.js', [path.join(SRC, 'Pedestal Button', 'ModelsResource', 'switch.obj'), path.join(SRC, 'Pedestal Button', 'ModelsResource', 'switch.png'), path.join(LOOSE, 'pedestal.png'), '--up', 'y', '--yaw', '0', '--size', '200']);
  render('Radio.obj', path.join(SRC, 'Radio1.png'), 'radio.png', ['--up', 'y', '--yaw', '0', '--size', '128']);
  render('aperture_sign_02.obj', path.join(SRC, 'aperture_sign_02.png'), 'aperture-sign.png', ['--up', 'y', '--yaw', '0', '--size', '700', '--cutout']);
  render('personality_sphere_angry.obj', path.join(SRC, 'personality_sphere_angry.png'), 'core-anger.png', ['--up', 'z', '--yaw', '320', '--size', '160']);
  // There is no Wheatley model in the folder: he is the same sphere with the texture turned from red to blue and lightened.
  const wheatleyTex = path.join(TMP, 'wheatley-tex.png');
  await sharp(path.join(SRC, 'personality_sphere_angry.png')).modulate({ hue: 205, brightness: 1.35, saturation: 1.05 }).png().toFile(wheatleyTex);
  render('personality_sphere_angry.obj', wheatleyTex, 'wheatley.png', ['--up', 'z', '--yaw', '320', '--size', '160']);
  for (const name of ['turret', 'frankenturret', 'pedestal', 'radio', 'aperture-sign', 'core-anger']) await addFile(name, path.join(LOOSE, name + '.png'));
  fs.copyFileSync(path.join(LOOSE, 'wheatley.png'), path.join(OUT, 'wheatley.png'));
  await addFile('wheatley', path.join(LOOSE, 'wheatley.png'));

  /* Chell (pixel sprite sheet). Parts are numbered by slice-sheet.js (--gap 1 --min 150), top to bottom. */
  const sliced = path.join(TMP, 'chell');
  run('slice-sheet.js', [path.join(SRC, '4pi5xfr6zecb1.png'), sliced, '--gap', '1', '--min', '150']);
  const part = n => path.join(sliced, 'part-' + String(n).padStart(2, '0') + '.png');
  const K = 3;
  for (let i = 0; i < 6; i++) await addFile('chell-idle-' + i, part(2 + i));
  for (let i = 0; i < 8; i++) await addFile('chell-walk-' + i, part(8 + i));
  // the crouch pair is one blob: split it down the middle
  { const m = await sharp(part(16)).metadata(), half = Math.floor(m.width / 2);
    pieces['chell-crouch-0'] = await sharp(part(16)).extract({ left: 0, top: 0, width: half, height: m.height }).png().toBuffer();
    pieces['chell-crouch-1'] = await sharp(part(16)).extract({ left: half, top: 0, width: m.width - half, height: m.height }).png().toBuffer(); }
  const chellNamed = { 'chell-hit': 17, 'chell-jump': 18, 'chell-fall': 19, 'chell-fall-1': 20, 'chell-lose-0': 32, 'chell-lose-1': 33, 'chell-win-0': 34, 'chell-win-1': 35, 'chell-win-2': 36,
    'chell-cakes': 37, 'chell-portals-orange': 38, 'chell-gun': 40, 'chell-portals-blue': 49, 'cube': 55, 'cube-heart': 61, 'pixel-turret': 46, 'pixel-turret-aim': 47,
    'bullet-orange': 48, 'bullet-red': 60, 'core-frame-blue': 63, 'core-frame-red': 64, 'core-frame-orange': 65, 'core-frame-purple': 66, 'moon': 72 };
  for (const [name, n] of Object.entries(chellNamed)) await addFile(name, part(n));
  // the hero: enlarge with nearest-neighbour so the pixels stay crisp, then trim.
  const heroBase = part(3);
  fs.writeFileSync(path.join(OUT, 'chell', 'Chell.png'), await up(heroBase, 5));
  { const big = await up(part(3), 8), m = await sharp(big).metadata();
    fs.writeFileSync(path.join(OUT, 'chell', 'icon.png'), await sharp(big).extract({ left: 0, top: 0, width: m.width, height: Math.min(m.height, Math.round(m.width * 1.0)) }).resize(160, 160, { fit: 'contain', kernel: 'nearest', background: { r: 0, g: 0, b: 0, alpha: 0 } }).png().toBuffer()); }
  fs.writeFileSync(path.join(OUT, 'glados.png'), await up(path.join(raw, 'g1_i0.png'), 2));

  /* Pack the pieces into one atlas (shelf packing, 2px padding). */
  const entries = [];
  for (const [name, buf] of Object.entries(pieces)) { const m = await sharp(buf).metadata(); entries.push({ name, buf, w: m.width, h: m.height }); }
  entries.sort((a, b) => b.h - a.h);
  const WIDTH = 1024, PAD = 2;
  let x = 0, y = 0, rowH = 0;
  const index = {}, comps = [];
  for (const e of entries) {
    if (x + e.w + PAD > WIDTH) { x = 0; y += rowH + PAD; rowH = 0; }
    index[e.name] = { x, y, w: e.w, h: e.h };
    comps.push({ input: e.buf, left: x, top: y });
    x += e.w + PAD; rowH = Math.max(rowH, e.h);
  }
  const HEIGHT = y + rowH + PAD;
  await sharp({ create: { width: WIDTH, height: HEIGHT, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } }).composite(comps).png({ compressionLevel: 9 }).toFile(path.join(OUT, 'atlas.png'));
  fs.writeFileSync(path.join(OUT, 'atlas.json'), JSON.stringify({ width: WIDTH, height: HEIGHT, frames: index }));
  console.log(entries.length + ' sprites in a ' + WIDTH + 'x' + HEIGHT + ' atlas. Wrote ' + OUT);
})();
