/* Builds the Kaizo-only corruption assets from another MUGEN character (it is a source of pieces only, nothing of it appears as itself in the game): a small sprite atlas and a short sound pack.
   Only abstract pieces are used (the swirling orb, vortices, rings, static, the dark creatures); the character's photos and borrowed
   cartoon art are left out on purpose. The sounds are picked by group, short ones only, and have NOT been auditioned: see
   assets/aperture/sfx/void-names.md and delete any you do not want from void-index.json.
   Output: assets/aperture/corrupt-atlas.png + corrupt-atlas.json, assets/aperture/sfx/void-sfx.bin + void-index.json
   usage: node tools/portal/build-corruption.js <character folder>      (needs sharp and ffmpeg) */
'use strict';
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');
const sharp = require('sharp');

const SRC = process.argv[2];
if (!SRC) { console.log('usage: node build-corruption.js <folder>'); process.exit(1); }
const find = ext => fs.readdirSync(SRC).find(f => f.toLowerCase().endsWith(ext));
const sff = path.join(SRC, 'sprites.sff'), act = path.join(SRC, find('r-giygas.act') ? 'R-Giygas.act' : 'pal1.act'), snd = path.join(SRC, 'sound.snd');
const ROOT = path.resolve(__dirname, '..', '..');
const OUT = path.join(ROOT, 'assets', 'aperture');
const TMP = path.join(require('os').tmpdir(), 'aperture-giygas');
fs.rmSync(TMP, { recursive: true, force: true });
fs.mkdirSync(path.join(OUT, 'sfx'), { recursive: true });
const run = (script, args) => { const r = spawnSync(process.execPath, [path.join(__dirname, script), ...args], { stdio: 'inherit', env: process.env }); if (r.status !== 0) throw new Error(script + ' failed'); };

(async () => {
  /* sprites */
  run('sff-extract.js', [sff, act, path.join(TMP, 'spr')]);
  const pieces = {};
  const add = async (name, g, i, maxW) => {
    const f = path.join(TMP, 'spr', `g${g}_i${i}.png`);
    if (!fs.existsSync(f)) return;
    let img = sharp(f);
    const m = await img.metadata();
    if (maxW && m.width > maxW) img = img.resize({ width: maxW, kernel: 'nearest' });
    pieces[name] = await img.png().toBuffer();
  };
  await add('orb', 0, 0, 116);
  await add('swirl', 3000, 0, 160);           // the frames of this vortex are the same picture: it is rotated in code
  await add('rings', 3470, 0, 128);
  for (let i = 0; i < 26; i += 2) await add('ring-' + i / 2, 1112, i, 58);
  for (let i = 0; i < 2; i++) await add('noise-' + i, 172, i, 160);
  await add('rainbow', 3502, 0, 160);
  await add('rings2', 18015, 0, 160);
  await add('dark', 3511, 0, 102);
  await add('dark2', 198, 0, 90);
  await add('glitch', 3516, 0, 124);
  await add('boom', 2107, 0, 64);
  await add('burst', 2107, 1, 64);
  await add('diamond', 1059, 0, 32);
  await add('zigzag', 1124, 0, 48);
  await add('cross', 3040, 0, 46);
  await add('bars', 178, 0, 160);
  await add('dots', 1125, 0, 23);
  await add('checker', 900, 0, 13);
  await add('lines', 1111, 0, 256);
  await add('panel', 1055, 0, 160);
  await add('orb-1', 5030, 2, 116);
  await add('orb-2', 5001, 1, 116);
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
  await sharp({ create: { width: WIDTH, height: HEIGHT, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } }).composite(comps).png({ compressionLevel: 9 }).toFile(path.join(OUT, 'corrupt-atlas.png'));
  fs.writeFileSync(path.join(OUT, 'corrupt-atlas.json'), JSON.stringify({ width: WIDTH, height: HEIGHT, frames: index }));
  console.log(entries.length + ' sprites in a ' + WIDTH + 'x' + HEIGHT + ' atlas');

  /* sounds: short clips only, a few from each of the groups that are not the long loops */
  run('snd-extract.js', [snd, path.join(TMP, 'wav')]);
  const list = JSON.parse(fs.readFileSync(path.join(TMP, 'wav', 'sounds.json'), 'utf8'));
  const byGroup = {};
  list.filter(s => s.seconds >= .3 && s.seconds <= 3).forEach(s => { (byGroup[s.group] = byGroup[s.group] || []).push(s); });
  const BANNED = new Set(['2-21']);                  // clips that must never be shipped (one contains a racial slur)
  const picked = [];
  for (const g of Object.keys(byGroup)) {
    if (+g === 187) continue;                       // the long list of quotes: skipped
    const arr = byGroup[g], n = Math.min(8, arr.length);
    for (let k = 0; k < n; k++) { const c = arr[Math.floor(k * arr.length / n)]; if (!BANNED.has(c.group + '-' + c.number)) picked.push(c); }
  }
  const sidx = {}, chunks = [], names = [];
  let offset = 0;
  for (const s of picked) {
    const wav = path.join(TMP, 'wav', s.file), ogg = path.join(TMP, s.file.replace('.wav', '.ogg'));
    const r = spawnSync('ffmpeg', ['-y', '-v', 'error', '-i', wav, '-ac', '1', '-ar', '32000', '-c:a', 'libvorbis', '-q:a', '3', ogg]);
    if (r.status !== 0 || !fs.existsSync(ogg)) continue;
    const data = fs.readFileSync(ogg), name = `void-${s.group}-${s.number}`;
    sidx[name] = [offset, data.length, s.seconds]; chunks.push(data); offset += data.length; names.push(`${name}\t${s.seconds}s`);
  }
  fs.writeFileSync(path.join(OUT, 'sfx', 'void-sfx.bin'), Buffer.concat(chunks));
  fs.writeFileSync(path.join(OUT, 'sfx', 'void-index.json'), JSON.stringify(sidx));
  fs.writeFileSync(path.join(OUT, 'sfx', 'void-names.md'), '# Void sound pieces (not auditioned)\n\n' + names.join('\n') + '\n');
  console.log(names.length + ' sounds, ' + (offset / 1024).toFixed(0) + ' KB');
})();
