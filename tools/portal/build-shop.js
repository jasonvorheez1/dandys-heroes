/* Builds the Kaizo intro's props from a MUGEN 1.1 character: a small sprite atlas (an oil bottle, explosions, a rainbow; no character poses) and a sound pack of its short clips. Only cartoon pieces are used; the character's real-photo and borrowed sprites are left out.
   The sounds have NOT been auditioned: the game plays none of them until assets/aperture/sfx/shop-approved.json exists
   (write it with tools/portal/audition-void.html?pack=shop).
   Output: assets/aperture/shop-atlas.png + shop-atlas.json, assets/aperture/sfx/shop-sfx.bin + shop-index.json + shop-names.md
   usage: node tools/portal/build-shop.js <character folder>      (needs sharp and ffmpeg) */
'use strict';
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');
const sharp = require('sharp');

const SRC = process.argv[2];
if (!SRC) { console.log('usage: node build-shop.js <folder>'); process.exit(1); }
const find = ext => fs.readdirSync(SRC).find(f => f.toLowerCase().endsWith(ext));
const ROOT = path.resolve(__dirname, '..', '..');
const OUT = path.join(ROOT, 'assets', 'aperture');
const TMP = path.join(require('os').tmpdir(), 'aperture-shop');
fs.rmSync(TMP, { recursive: true, force: true });
fs.mkdirSync(path.join(OUT, 'sfx'), { recursive: true });
const run = (script, args) => { const r = spawnSync(process.execPath, [path.join(__dirname, script), ...args], { stdio: 'inherit', env: process.env }); if (r.status !== 0) throw new Error(script + ' failed'); };

(async () => {
  run('sff2-extract.js', [path.join(SRC, find('.sff')), path.join(TMP, 'spr')]);
  const pieces = {};
  const add = async (name, g, i, maxH) => {
    const f = path.join(TMP, 'spr', `g${g}_i${i}.png`);
    if (!fs.existsSync(f)) return;
    let img = sharp(f).trim({ threshold: 1 });
    const m = await img.metadata();
    if (maxH && m.height > maxH) img = img.resize({ height: maxH });
    pieces[name] = await img.png().toBuffer();
  };
  await add('oil', 14, 0, 90);
  await add('oil-side', 13, 0, 70);
  await add('rainbow', 100, 22, 90);
  for (let i = 1; i <= 11; i++) await add('boom-' + i, 4577, i, 160);

  const entries = [];
  for (const [name, buf] of Object.entries(pieces)) { const m = await sharp(buf).metadata(); entries.push({ name, buf, w: m.width, h: m.height }); }
  entries.sort((a, b) => b.h - a.h);
  const WIDTH = 1024, PAD = 2;
  let x = 0, y = 0, rowH = 0;
  const index = {}, comps = [];
  for (const e of entries) {
    if (x + e.w + PAD > WIDTH) { x = 0; y += rowH + PAD; rowH = 0; }
    index[e.name] = { x, y, w: e.w, h: e.h }; comps.push({ input: e.buf, left: x, top: y });
    x += e.w + PAD; rowH = Math.max(rowH, e.h);
  }
  const HEIGHT = y + rowH + PAD;
  await sharp({ create: { width: WIDTH, height: HEIGHT, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } }).composite(comps).png({ compressionLevel: 9 }).toFile(path.join(OUT, 'shop-atlas.png'));
  fs.writeFileSync(path.join(OUT, 'shop-atlas.json'), JSON.stringify({ width: WIDTH, height: HEIGHT, frames: index }));
  console.log(entries.length + ' sprites in a ' + WIDTH + 'x' + HEIGHT + ' atlas');

  run('snd-extract.js', [path.join(SRC, find('.snd')), path.join(TMP, 'wav')]);
  const KEEP = new Set(['33-33', '5000-1', '235-235', '93-93', '24-24']);   // the only clips that were auditioned and approved
  const list = JSON.parse(fs.readFileSync(path.join(TMP, 'wav', 'sounds.json'), 'utf8')).filter(s => KEEP.has(s.group + '-' + s.number));
  const sidx = {}, chunks = [], names = [];
  let offset = 0;
  for (const s of list) {
    const wav = path.join(TMP, 'wav', s.file), ogg = path.join(TMP, s.file.replace('.wav', '.ogg'));
    const r = spawnSync('ffmpeg', ['-y', '-v', 'error', '-i', wav, '-ac', '1', '-ar', '32000', '-c:a', 'libvorbis', '-q:a', '3', ogg]);
    if (r.status !== 0 || !fs.existsSync(ogg)) continue;
    const data = fs.readFileSync(ogg), name = `shop-${s.group}-${s.number}`;
    sidx[name] = [offset, data.length, s.seconds]; chunks.push(data); offset += data.length; names.push(`${name}\t${s.seconds}s`);
  }
  fs.writeFileSync(path.join(OUT, 'sfx', 'shop-sfx.bin'), Buffer.concat(chunks));
  fs.writeFileSync(path.join(OUT, 'sfx', 'shop-index.json'), JSON.stringify(sidx));
  fs.writeFileSync(path.join(OUT, 'sfx', 'shop-names.md'), '# Shop sound pieces (not auditioned)\n\n' + names.join('\n') + '\n');
  console.log(names.length + ' sounds, ' + (offset / 1024).toFixed(0) + ' KB');
})();
