/* Cuts a ripped sprite sheet (flat green background, text labels) into separate transparent PNGs.
   It keys out the two sheet greens, joins nearby pixels into blobs, drops text-sized blobs, and writes one PNG per blob, ordered top to bottom,
   left to right, plus parts.json with each blob's position so frames can be picked by looking at a contact sheet.
   usage: node tools/portal/slice-sheet.js <sheet.png> <outDir> [--min area] [--gap px] */
'use strict';
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const [sheet, outDir] = process.argv.slice(2);
const arg = (name, def) => { const i = process.argv.indexOf('--' + name); return i < 0 ? def : Number(process.argv[i + 1]); };
const MIN = arg('min', 260), GAP = arg('gap', 2);
fs.mkdirSync(outDir, { recursive: true });

(async () => {
  const { data, info } = await sharp(sheet).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const W = info.width, H = info.height;
  const isBg = i => { const r = data[i], g = data[i + 1], b = data[i + 2]; return (r === 128 && g === 255 && b === 128) || (r === 64 && g === 128 && b === 0) || data[i + 3] < 10; };
  const fg = new Uint8Array(W * H);
  for (let p = 0; p < W * H; p++) fg[p] = isBg(p * 4) ? 0 : 1;
  // dilate to join parts of one sprite (gun, hair, shadow)
  const joined = new Uint8Array(W * H);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    if (!fg[y * W + x]) continue;
    for (let dy = -GAP; dy <= GAP; dy++) for (let dx = -GAP; dx <= GAP; dx++) {
      const yy = y + dy, xx = x + dx;
      if (yy >= 0 && yy < H && xx >= 0 && xx < W) joined[yy * W + xx] = 1;
    }
  }
  const label = new Int32Array(W * H).fill(0);
  const blobs = [];
  for (let start = 0; start < W * H; start++) {
    if (!joined[start] || label[start]) continue;
    const id = blobs.length + 1, stack = [start];
    label[start] = id;
    let minX = W, maxX = 0, minY = H, maxY = 0, area = 0;
    while (stack.length) {
      const p = stack.pop(), x = p % W, y = (p / W) | 0;
      if (fg[p]) area++;
      if (x < minX) minX = x; if (x > maxX) maxX = x; if (y < minY) minY = y; if (y > maxY) maxY = y;
      for (const q of [p - 1, p + 1, p - W, p + W, p - W - 1, p - W + 1, p + W - 1, p + W + 1]) {
        if (q < 0 || q >= W * H || !joined[q] || label[q]) continue;
        if (Math.abs((q % W) - x) > 1) continue;
        label[q] = id; stack.push(q);
      }
    }
    blobs.push({ id, minX, maxX, minY, maxY, area });
  }
  const keep = blobs.filter(b => b.area >= MIN && (b.maxX - b.minX) > 8 && (b.maxY - b.minY) > 8)
    .sort((a, b) => (Math.round(a.minY / 24) - Math.round(b.minY / 24)) || a.minX - b.minX);
  const parts = [];
  for (let n = 0; n < keep.length; n++) {
    const b = keep[n], w = b.maxX - b.minX + 1, h = b.maxY - b.minY + 1, out = Buffer.alloc(w * h * 4);
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const p = (b.minY + y) * W + b.minX + x;
      if (label[p] !== b.id || !fg[p]) continue;
      const o = (y * w + x) * 4;
      out[o] = data[p * 4]; out[o + 1] = data[p * 4 + 1]; out[o + 2] = data[p * 4 + 2]; out[o + 3] = 255;
    }
    const file = 'part-' + String(n).padStart(2, '0') + '.png';
    await sharp(out, { raw: { width: w, height: h, channels: 4 } }).png().toFile(path.join(outDir, file));
    parts.push({ n, file, x: b.minX, y: b.minY, w, h, area: b.area });
  }
  fs.writeFileSync(path.join(outDir, 'parts.json'), JSON.stringify(parts, null, 1));
  console.log(parts.length + ' parts from a ' + W + 'x' + H + ' sheet');
})();
