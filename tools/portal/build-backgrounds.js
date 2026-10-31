/* Draws the three story backgrounds for the Aperture event (elevator shaft, test chamber, ruined chamber) as flat 2D images.
   They are drawn from simple shapes, so there is nothing to credit. usage: node tools/portal/build-backgrounds.js (needs sharp) */
'use strict';
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const OUT = path.resolve(__dirname, '..', '..', 'assets', 'aperture', 'bg');
fs.mkdirSync(OUT, { recursive: true });
const W = 1024, H = 576;
let seed = 7;
const rnd = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };

const panels = (x0, y0, x1, y1, cw, ch, fills, gap = 3) => {
  let s = '';
  for (let y = y0; y < y1; y += ch) for (let x = x0; x < x1; x += cw) {
    s += `<rect x="${x + gap / 2}" y="${y + gap / 2}" width="${cw - gap}" height="${ch - gap}" fill="${fills[Math.floor(rnd() * fills.length)]}"/>`;
  }
  return s;
};

const shaft = () => {
  let s = `<defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0b0d10"/><stop offset=".6" stop-color="#14181d"/><stop offset="1" stop-color="#1e242b"/></linearGradient>
    <linearGradient id="l" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffb347" stop-opacity="0"/><stop offset=".5" stop-color="#ffb347" stop-opacity=".9"/><stop offset="1" stop-color="#ffb347" stop-opacity="0"/></linearGradient></defs>
    <rect width="${W}" height="${H}" fill="url(#g)"/>`;
  for (let x = 120; x < W; x += 190) s += `<rect x="${x}" y="0" width="14" height="${H}" fill="#242b33"/><rect x="${x + 14}" y="0" width="3" height="${H}" fill="#3a4450"/>`;
  for (let y = 40; y < H; y += 90) s += `<rect x="0" y="${y}" width="${W}" height="10" fill="#1d232a"/>`;
  for (let i = 0; i < 14; i++) { const x = 30 + rnd() * (W - 60), y = rnd() * (H - 160); s += `<rect x="${x}" y="${y}" width="5" height="${70 + rnd() * 90}" fill="url(#l)"/>`; }
  for (let i = 0; i < 70; i++) s += `<circle cx="${rnd() * W}" cy="${rnd() * H}" r="${rnd() * 1.6 + .3}" fill="#dfe8ff" opacity="${.15 + rnd() * .4}"/>`;
  s += `<rect x="330" y="150" width="364" height="426" fill="#2b323b"/><rect x="342" y="162" width="340" height="414" fill="#0f1317"/><rect x="505" y="162" width="14" height="414" fill="#3a4450"/>`;
  return s;
};
const chamber = (ruin) => {
  const light = ruin ? ['#3a4047', '#343a41', '#2d3339', '#40464d'] : ['#dfe3e6', '#d4d9dd', '#e8ebed', '#cfd5d9'];
  let s = `<defs><linearGradient id="f" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#000" stop-opacity="${ruin ? .5 : .12}"/><stop offset=".5" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity="${ruin ? .6 : .3}"/></linearGradient></defs>
    <rect width="${W}" height="${H}" fill="${ruin ? '#23272c' : '#c4cacf'}"/>`;
  s += panels(0, 0, W, H, 128, 96, light);
  if (ruin) {
    for (let i = 0; i < 26; i++) s += `<rect x="${rnd() * W}" y="${rnd() * H}" width="${20 + rnd() * 90}" height="${14 + rnd() * 60}" fill="#14171a" opacity="${.5 + rnd() * .4}"/>`;
    for (let i = 0; i < 20; i++) { const x = rnd() * W; s += `<path d="M${x} ${H} q${rnd() * 40 - 20} ${-40 - rnd() * 90} ${rnd() * 60 - 30} ${-120 - rnd() * 160}" stroke="#3d6b3a" stroke-width="${3 + rnd() * 5}" fill="none" opacity=".8"/>`; }
    for (let i = 0; i < 40; i++) s += `<circle cx="${rnd() * W}" cy="${H - rnd() * 200}" r="${3 + rnd() * 9}" fill="#4f8a4a" opacity=".7"/>`;
    s += `<rect x="0" y="0" width="${W}" height="14" fill="#ff8a1f" opacity=".5"/>`;
  } else {
    s += `<rect x="0" y="0" width="${W}" height="18" fill="#59d2ff" opacity=".85"/><rect x="0" y="${H - 120}" width="${W}" height="120" fill="#9aa2a8"/>`;
    s += `<rect x="740" y="60" width="220" height="110" fill="#10161b"/><rect x="746" y="66" width="208" height="98" fill="#1b2a36"/>`;
  }
  s += `<rect width="${W}" height="${H}" fill="url(#f)"/>`;
  return s;
};

const write = async (name, body) => {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">${body}</svg>`;
  await sharp(Buffer.from(svg)).png({ compressionLevel: 9, palette: true, colors: 128 }).toFile(path.join(OUT, name));
  console.log(name);
};
(async () => { await write('shaft.png', shaft()); await write('chamber.png', chamber(false)); await write('ruins.png', chamber(true)); })();
