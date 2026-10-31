/* Evens out the loudness of everything the Aperture event plays.
   Sound packs (assets/aperture/sfx/*-sfx.bin + *index.json): every clip is measured (ffmpeg volumedetect) and gained to the same average level,
   but never past a peak ceiling, so a quiet click and a long voice line sit together. The bins and indexes are rewritten in place.
   Music (assets/aperture/music/*.mp3): gained to an average of -18 dB, peak ceiling -1 dB (the bundled ffmpeg is too old for loudnorm).
   usage: node tools/portal/normalize-sfx.js [--music] [--sfx]      (default: both; needs ffmpeg) */
'use strict';
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..', '..');
const SFX = path.join(ROOT, 'assets', 'aperture', 'sfx');
const MUSIC = path.join(ROOT, 'assets', 'aperture', 'music');
const TMP = path.join(require('os').tmpdir(), 'aperture-norm');
fs.rmSync(TMP, { recursive: true, force: true });
fs.mkdirSync(TMP, { recursive: true });
const args = process.argv.slice(2), both = !args.includes('--music') && !args.includes('--sfx');
const TARGET_MEAN = -20, PEAK_CEIL = -1.5;

const PACKS = [['aperture-sfx.bin', 'index.json'], ['mia-sfx.bin', 'mia-index.json'], ['void-sfx.bin', 'void-index.json'], ['shop-sfx.bin', 'shop-index.json']];

function measure(file) {
  const r = spawnSync('ffmpeg', ['-i', file, '-af', 'volumedetect', '-f', 'null', '-'], { encoding: 'utf8' });
  const mean = /mean_volume: (-?[\d.]+) dB/.exec(r.stderr), max = /max_volume: (-?[\d.]+) dB/.exec(r.stderr);
  return mean && max ? { mean: +mean[1], max: +max[1] } : null;
}

if (both || args.includes('--sfx')) {
  for (const [binName, idxName] of PACKS) {
    const binPath = path.join(SFX, binName), idxPath = path.join(SFX, idxName);
    if (!fs.existsSync(binPath)) continue;
    const bin = fs.readFileSync(binPath), index = JSON.parse(fs.readFileSync(idxPath, 'utf8'));
    const out = {}, chunks = [];
    let offset = 0, changed = 0;
    for (const [name, [at, len, secs]] of Object.entries(index)) {
      const src = path.join(TMP, 'in.ogg'), dst = path.join(TMP, 'out.ogg');
      fs.writeFileSync(src, bin.subarray(at, at + len));
      let data = bin.subarray(at, at + len);
      const m = measure(src);
      if (m) {
        const gain = Math.max(-20, Math.min(24, Math.min(TARGET_MEAN - m.mean, PEAK_CEIL - m.max)));
        if (Math.abs(gain) >= .5) {
          const r = spawnSync('ffmpeg', ['-y', '-v', 'error', '-i', src, '-af', `volume=${gain.toFixed(2)}dB`, '-c:a', 'libvorbis', '-q:a', '3', dst]);
          if (r.status === 0 && fs.existsSync(dst)) { data = fs.readFileSync(dst); changed++; }
        }
      }
      out[name] = [offset, data.length, secs]; chunks.push(Buffer.from(data)); offset += data.length;
    }
    fs.writeFileSync(binPath, Buffer.concat(chunks));
    fs.writeFileSync(idxPath, JSON.stringify(out));
    console.log(`${binName}: ${Object.keys(out).length} clips, ${changed} re-gained, ${(offset / 1024).toFixed(0)} KB`);
  }
}

if (both || args.includes('--music')) {
  for (const f of fs.readdirSync(MUSIC).filter(n => n.endsWith('.mp3'))) {
    const src = path.join(MUSIC, f), dst = path.join(TMP, f), m = measure(src);
    if (!m) { console.log('music ' + f + ' skipped'); continue; }
    const gain = Math.max(-20, Math.min(20, Math.min(-18 - m.mean, -1 - m.max)));
    if (Math.abs(gain) < .5) { console.log('music ' + f + ' already even'); continue; }
    const r = spawnSync('ffmpeg', ['-y', '-v', 'error', '-i', src, '-af', 'volume=' + gain.toFixed(2) + 'dB', '-c:a', 'libmp3lame', '-q:a', '2', dst]);
    if (r.status === 0 && fs.existsSync(dst)) { fs.copyFileSync(dst, src); console.log('music ' + f + ' ' + m.mean + ' dB -> ' + (m.mean + gain).toFixed(1) + ' dB'); }
    else console.log('music ' + f + ' skipped');
  }
}
