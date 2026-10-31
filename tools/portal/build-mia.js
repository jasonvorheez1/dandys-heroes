/* Builds the second sound pack, used only by the Kaizo fight: the sounds of the "Mia" MUGEN character, cut into short pieces.
   Mia.snd holds only three long sounds (a 3.5 s clip, an 8.6 s clip with a beat, and a short one), so the long ones are cut where the
   beat hits (or evenly, when there is no beat) into pieces of at most 1.2 s. Output: assets/aperture/sfx/mia-sfx.bin + mia-index.json
   (name -> [offset, length, seconds]); names are mia-<group>-<piece>.
   usage: node tools/portal/build-mia.js <Mia.snd>      (needs ffmpeg on the PATH) */
'use strict';
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const sndFile = process.argv[2];
if (!sndFile) { console.log('usage: node build-mia.js <Mia.snd>'); process.exit(1); }
const ROOT = path.resolve(__dirname, '..', '..');
const OUT = path.join(ROOT, 'assets', 'aperture', 'sfx');
const TMP = path.join(require('os').tmpdir(), 'aperture-mia');
fs.rmSync(TMP, { recursive: true, force: true });
fs.mkdirSync(TMP, { recursive: true });
fs.mkdirSync(OUT, { recursive: true });
const ext = spawnSync(process.execPath, [path.join(__dirname, 'snd-extract.js'), sndFile, path.join(TMP, 'wav')], { stdio: 'inherit' });
if (ext.status !== 0) throw new Error('extract failed');
const list = JSON.parse(fs.readFileSync(path.join(TMP, 'wav', 'sounds.json'), 'utf8'));

/* where the loud hits start: a 10 ms energy envelope that jumps well above the last 50 ms */
function onsets(wav) {
  const raw = path.join(TMP, 'env.raw');
  spawnSync('ffmpeg', ['-y', '-v', 'error', '-i', wav, '-ac', '1', '-ar', '8000', '-f', 's16le', raw]);
  const b = fs.readFileSync(raw), n = b.length / 2, win = 80, env = [];
  for (let i = 0; i + win <= n; i += win) { let s = 0; for (let k = 0; k < win; k++) { const v = b.readInt16LE((i + k) * 2); s += v * v; } env.push(Math.sqrt(s / win)); }
  const out = [0];
  for (let i = 5; i < env.length; i++) {
    const prev = env.slice(i - 5, i).reduce((a, c) => a + c, 0) / 5;
    if (env[i] > 6000 && env[i] > prev * 1.5 && i * .01 - out[out.length - 1] > .35) out.push(i * .01);
  }
  return out;
}

const pieces = [];   // { name, from, to, wav }
for (const s of list) {
  const wav = path.join(TMP, 'wav', s.file);
  if (s.seconds <= 1.2) { pieces.push({ name: `mia-${s.group}-0`, from: 0, to: s.seconds, wav }); continue; }
  const marks = onsets(wav);
  marks.push(s.seconds);
  let k = 0;
  for (let i = 0; i < marks.length - 1; i++) {
    const from = Math.max(0, marks[i] - .015), to = marks[i + 1], len = to - from;
    const parts = Math.max(1, Math.ceil(len / 1.2));
    for (let p = 0; p < parts; p++) {
      const a = from + len / parts * p, z = from + len / parts * (p + 1);
      if (z - a >= .12) pieces.push({ name: `mia-${s.group}-${k++}`, from: a, to: z, wav });
    }
  }
}

const index = {}, chunks = [];
let offset = 0;
for (const p of pieces) {
  const ogg = path.join(TMP, p.name + '.ogg'), dur = p.to - p.from;
  const r = spawnSync('ffmpeg', ['-y', '-v', 'error', '-ss', String(p.from), '-t', String(dur), '-i', p.wav, '-ac', '1', '-ar', '32000',
    '-af', `afade=t=in:d=0.008,afade=t=out:st=${Math.max(0, dur - .02)}:d=0.02`, '-c:a', 'libvorbis', '-q:a', '3', ogg]);
  if (r.status !== 0 || !fs.existsSync(ogg)) { console.log('skipped ' + p.name); continue; }
  const data = fs.readFileSync(ogg);
  index[p.name] = [offset, data.length, Math.round(dur * 100) / 100];
  chunks.push(data); offset += data.length;
}
fs.writeFileSync(path.join(OUT, 'mia-sfx.bin'), Buffer.concat(chunks));
fs.writeFileSync(path.join(OUT, 'mia-index.json'), JSON.stringify(index));
console.log(Object.keys(index).length + ' pieces, ' + (offset / 1024).toFixed(0) + ' KB');
