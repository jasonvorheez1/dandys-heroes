/* Extracts every sound from a MUGEN SND v1 file (the GLaDOS character) to .wav, named snd-<group>-<number>.wav, and writes sounds.json
   with duration and size so they can be named by hand. usage: node tools/portal/snd-extract.js <file.snd> <outDir> */
'use strict';
const fs = require('fs');
const path = require('path');

const [sndPath, outDir] = process.argv.slice(2);
if (!sndPath || !outDir) { console.log('usage: node snd-extract.js file.snd outDir'); process.exit(1); }
const buf = fs.readFileSync(sndPath);
fs.mkdirSync(outDir, { recursive: true });
if (buf.toString('latin1', 0, 11) !== 'ElecbyteSnd') throw new Error('not an SND');
const count = buf.readUInt32LE(0x10);
let offset = buf.readUInt32LE(0x14);
const list = [];
for (let i = 0; offset > 0 && offset + 16 <= buf.length && i < 5000; i++) {   // the header count is wrong in some files, so follow the chain
  const next = buf.readUInt32LE(offset), length = buf.readUInt32LE(offset + 4);
  const group = buf.readInt32LE(offset + 8), number = buf.readInt32LE(offset + 12);
  const data = buf.subarray(offset + 16, offset + 16 + (length || (next - offset - 16)));
  if (data.toString('latin1', 0, 4) === 'RIFF') {
    const name = `snd-${group}-${number}.wav`;
    fs.writeFileSync(path.join(outDir, name), data);
    // 16-bit PCM wav: duration from the fmt chunk
    const rate = data.readUInt32LE(24), bytesPerSec = data.readUInt32LE(28);
    list.push({ group, number, file: name, bytes: data.length, rate, seconds: Math.round(data.length / (bytesPerSec || rate * 2) * 100) / 100 });
  }
  if (!next) break;
  offset = next;
}
fs.writeFileSync(path.join(outDir, 'sounds.json'), JSON.stringify(list, null, 1));
console.log(list.length + ' sounds written to ' + outDir);
