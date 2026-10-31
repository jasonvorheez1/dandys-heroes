/* Extracts the sprites of a MUGEN SFF v2 file (MUGEN 1.1 characters) that use the PNG formats and linked sprites, to PNG with the sprite's own palette
   applied and palette index 0 transparent. Writes g<group>_i<item>.png and sprites.json (group, item, size, axis). RLE/LZ5 formats are skipped
   (the Morshu file does not use them). usage: node tools/portal/sff2-extract.js <file.sff> <outDir> [palette index override] */
'use strict';
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const zlib = require('zlib');

/* The palette inside an SFF v2 PNG8 is not the sprite's palette: swap it for an identity ramp so the decoded value of each pixel IS its palette index. */
function indexPng(png) {
  const out = [png.subarray(0, 8)];
  let p = 8;
  while (p < png.length) {
    const len = png.readUInt32BE(p), type = png.toString('latin1', p + 4, p + 8);
    if (type === 'PLTE') {
      const n = len / 3, body = Buffer.alloc(len);
      for (let i = 0; i < n; i++) { body[i * 3] = i; body[i * 3 + 1] = i; body[i * 3 + 2] = i; }
      const head = Buffer.alloc(8); head.writeUInt32BE(len, 0); head.write('PLTE', 4, 'latin1');
      const crc = Buffer.alloc(4); crc.writeUInt32BE(zlib.crc32(Buffer.concat([Buffer.from('PLTE'), body])) >>> 0, 0);
      out.push(head, body, crc);
    } else out.push(png.subarray(p, p + 12 + len));
    p += 12 + len;
    if (type === 'IEND') break;
  }
  return Buffer.concat(out);
}

const [sffPath, outDir, palOverride] = process.argv.slice(2);
if (!sffPath || !outDir) { console.log('usage: node sff2-extract.js file.sff outDir [palette]'); process.exit(1); }
const buf = fs.readFileSync(sffPath);
fs.mkdirSync(outDir, { recursive: true });
if (buf.toString('latin1', 0, 11) !== 'ElecbyteSpr' || buf[15] !== 2) throw new Error('not an SFF v2');
const first = buf.readUInt32LE(0x24), count = buf.readUInt32LE(0x28), palFirst = buf.readUInt32LE(0x2C), palCount = buf.readUInt32LE(0x30);
const ldata = buf.readUInt32LE(0x34), tdata = buf.readUInt32LE(0x3C);

const palettes = [];
for (let i = 0; i < palCount; i++) {
  const o = palFirst + i * 16, n = buf.readUInt16LE(o + 4), linked = buf.readUInt16LE(o + 6), off = buf.readUInt32LE(o + 8), len = buf.readUInt32LE(o + 12);
  palettes.push({ n, linked, off, len });
}
const paletteOf = i => {
  let p = palettes[i];
  if (p && p.len === 0 && p.linked !== i && palettes[p.linked]) p = palettes[p.linked];
  if (!p || !p.len) return null;
  const out = [];
  for (let c = 0; c < Math.min(256, p.n || 256); c++) { const o = ldata + p.off + c * 4; out.push([buf[o], buf[o + 1], buf[o + 2]]); }
  return out;
};

const nodes = [];
for (let i = 0; i < count; i++) {
  const o = first + i * 28;
  nodes.push({ group: buf.readUInt16LE(o), item: buf.readUInt16LE(o + 2), w: buf.readUInt16LE(o + 4), h: buf.readUInt16LE(o + 6), ax: buf.readInt16LE(o + 8), ay: buf.readInt16LE(o + 10),
    linked: buf.readUInt16LE(o + 12), fmt: buf[o + 14], depth: buf[o + 15], off: buf.readUInt32LE(o + 16), len: buf.readUInt32LE(o + 20), pal: buf.readUInt16LE(o + 24), flags: buf.readUInt16LE(o + 26) });
}

(async () => {
  const list = [];
  for (let i = 0; i < nodes.length; i++) {
    let n = nodes[i];
    const src = n.len === 0 && n.linked !== i && nodes[n.linked] ? nodes[n.linked] : n;
    if (![10, 11, 12].includes(src.fmt)) continue;
    const base = (src.flags & 1 ? tdata : ldata) + src.off;
    let data = buf.subarray(base, base + src.len);
    const sig = data.indexOf(Buffer.from([0x89, 0x50, 0x4e, 0x47]));
    if (sig < 0) continue;
    data = data.subarray(sig);
    try {
      let img;
      if (src.fmt === 10) {
        const pal = paletteOf(palOverride != null ? +palOverride : n.pal) || paletteOf(src.pal);
        const raw = await sharp(indexPng(data)).raw().toBuffer({ resolveWithObject: true });
        const { width: w, height: h, channels } = raw.info, out = Buffer.alloc(w * h * 4);
        for (let p = 0; p < w * h; p++) {
          const idx = raw.data[p * channels];
          const c = pal && pal[idx] ? pal[idx] : [idx, idx, idx];
          out[p * 4] = c[0]; out[p * 4 + 1] = c[1]; out[p * 4 + 2] = c[2]; out[p * 4 + 3] = idx === 0 ? 0 : 255;
        }
        img = sharp(out, { raw: { width: w, height: h, channels: 4 } });
      } else img = sharp(data).ensureAlpha();
      const file = `g${n.group}_i${n.item}.png`;
      await img.png().toFile(path.join(outDir, file));
      list.push({ group: n.group, item: n.item, file, w: n.w, h: n.h, ax: n.ax, ay: n.ay });
    } catch (e) { /* a sprite that will not decode is skipped */ }
  }
  fs.writeFileSync(path.join(outDir, 'sprites.json'), JSON.stringify(list));
  console.log(list.length + ' of ' + nodes.length + ' sprites written to ' + outDir);
})();
