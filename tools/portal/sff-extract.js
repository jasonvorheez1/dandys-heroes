/* Extracts every sprite from a MUGEN SFF v1 file (as used by the GLaDOS character) to PNG, with the .act palette applied
   and palette index 0 transparent. Also writes sprites.json (group, image, axis, size).
   usage: node tools/portal/sff-extract.js <file.sff> <palette.act> <outDir> */
'use strict';
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const [sffPath, actPath, outDir] = process.argv.slice(2);
if (!sffPath || !actPath || !outDir) { console.log('usage: node sff-extract.js file.sff palette.act outDir'); process.exit(1); }
const buf = fs.readFileSync(sffPath);
const act = fs.readFileSync(actPath);
fs.mkdirSync(outDir, { recursive: true });

if (buf.toString('latin1', 0, 11) !== 'ElecbyteSpr') throw new Error('not an SFF');
const imageCount = buf.readUInt32LE(0x14);
let offset = buf.readUInt32LE(0x18);

// MUGEN stores the palette as 256 RGB triplets in reverse order in .act files
const actPalette = i => { const o = (255 - i) * 3; return [act[o], act[o + 1], act[o + 2]]; };

function pcxDecode(data) {
  const xmin = data.readUInt16LE(4), ymin = data.readUInt16LE(6), xmax = data.readUInt16LE(8), ymax = data.readUInt16LE(10);
  const w = xmax - xmin + 1, h = ymax - ymin + 1, bpl = data.readUInt16LE(66);
  const pixels = Buffer.alloc(w * h);
  let p = 128;
  for (let y = 0; y < h; y++) {
    let x = 0;
    while (x < bpl) {
      let b = data[p++], n = 1;
      if (b >= 0xC0) { n = b & 0x3F; b = data[p++]; }
      for (let k = 0; k < n; k++) { if (x < w) pixels[y * w + x] = b; x++; }
    }
  }
  let palette = null;
  if (data.length >= 769 && data[data.length - 769] === 0x0C) {
    palette = []; const o = data.length - 768;
    for (let i = 0; i < 256; i++) palette.push([data[o + i * 3], data[o + i * 3 + 1], data[o + i * 3 + 2]]);
  }
  return { w, h, pixels, palette };
}

const sprites = [];
const decoded = [];
(async () => {
  for (let n = 0; n < imageCount && offset > 0 && offset < buf.length; n++) {
    const next = buf.readUInt32LE(offset), length = buf.readUInt32LE(offset + 4);
    const axisX = buf.readInt16LE(offset + 8), axisY = buf.readInt16LE(offset + 10);
    const group = buf.readUInt16LE(offset + 12), image = buf.readUInt16LE(offset + 14), linked = buf.readUInt16LE(offset + 16);
    let entry;
    if (length === 0) entry = Object.assign({}, decoded[linked] || {}, { linkOf: linked });
    else {
      const px = pcxDecode(buf.subarray(offset + 32, offset + 32 + length));
      entry = px;
    }
    entry.group = group; entry.image = image; entry.axisX = axisX; entry.axisY = axisY;
    decoded[n] = entry;
    if (entry.pixels) {
      const rgba = Buffer.alloc(entry.w * entry.h * 4);
      for (let i = 0; i < entry.pixels.length; i++) {
        const idx = entry.pixels[i], c = actPalette(idx);
        rgba[i * 4] = c[0]; rgba[i * 4 + 1] = c[1]; rgba[i * 4 + 2] = c[2]; rgba[i * 4 + 3] = idx === 0 ? 0 : 255;
      }
      const name = `g${group}_i${image}.png`;
      await sharp(rgba, { raw: { width: entry.w, height: entry.h, channels: 4 } }).png().toFile(path.join(outDir, name));
      sprites.push({ n, group, image, axisX, axisY, w: entry.w, h: entry.h, file: name });
    }
    offset = next;
    if (!next) break;
  }
  fs.writeFileSync(path.join(outDir, 'sprites.json'), JSON.stringify(sprites, null, 1));
  console.log(sprites.length + ' sprites written to ' + outDir);
})();
