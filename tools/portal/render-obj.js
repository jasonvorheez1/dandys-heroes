/* Renders a textured OBJ model to a flat 2D PNG sprite (orthographic, z-buffered, simple lighting, 2x supersampled).
   The game has no 3D models, so every Portal prop goes through this once and ships as a plain image.
   usage: node tools/portal/render-obj.js model.obj texture.png out.png [--up z|y] [--yaw deg] [--pitch deg] [--roll deg] [--size px] [--ambient .6] [--flip] [--cutout]
     --up    which model axis points up (Source engine models are z-up, Blender exports are often y-up)
     --yaw   turn around the up axis, 0 = model front faces the camera's right; 90 = faces the camera
     --cutout  skip texels whose alpha is below half (signs and decals)
     --flip  mirror the finished sprite horizontally (use so a sprite faces the way the game expects)
   The sprite is trimmed to its content with a small margin. */
'use strict';
const fs = require('fs');
const sharp = require('sharp');

const args = process.argv.slice(2);
const [objPath, texPath, outPath] = args;
const opt = (name, def) => { const i = args.indexOf('--' + name); return i < 0 ? def : (args[i + 1] === undefined || args[i + 1].startsWith('--') ? true : args[i + 1]); };
const up = opt('up', 'z'), yaw = Number(opt('yaw', 0)) * Math.PI / 180, pitch = Number(opt('pitch', 0)) * Math.PI / 180, roll = Number(opt('roll', 0)) * Math.PI / 180;
const CUTOUT = !!opt('cutout', false), SIZE = Number(opt('size', 512)), AMBIENT = Number(opt('ambient', .6)), FLIP = !!opt('flip', false), SS = 2;
if (!objPath || !texPath || !outPath) { console.log('usage: node render-obj.js model.obj texture.png out.png [options]'); process.exit(1); }

function parse(text) {
  const v = [], vt = [], tris = [];
  for (const raw of text.split('\n')) {
    const l = raw.trim();
    if (l.startsWith('v ')) { const p = l.split(/\s+/).slice(1, 4).map(Number); v.push(p); }
    else if (l.startsWith('vt ')) { const p = l.split(/\s+/).slice(1, 3).map(Number); vt.push(p); }
    else if (l.startsWith('f ')) {
      const idx = l.split(/\s+/).slice(1).map(tok => {
        const [a, b] = tok.split('/');
        const vi = Number(a), ti = b ? Number(b) : 0;
        return [vi < 0 ? v.length + vi : vi - 1, ti ? (ti < 0 ? vt.length + ti : ti - 1) : -1];
      });
      for (let i = 1; i + 1 < idx.length; i++) tris.push([idx[0], idx[i], idx[i + 1]]);
    }
  }
  return { v, vt, tris };
}

(async () => {
  const { v, vt, tris } = parse(fs.readFileSync(objPath, 'utf8'));
  const tex = await sharp(texPath).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const TW = tex.info.width, TH = tex.info.height, TD = tex.data;

  // model axes -> view axes (x right, y up, z toward the camera)
  const toView = p => up === 'z' ? [p[0], p[2], -p[1]] : [p[0], p[1], p[2]];
  const rot = p => {
    let [x, y, z] = p;
    // yaw around the vertical axis
    let c = Math.cos(yaw), s = Math.sin(yaw); [x, z] = [x * c + z * s, -x * s + z * c];
    // pitch around the horizontal axis
    c = Math.cos(pitch); s = Math.sin(pitch); [y, z] = [y * c - z * s, y * s + z * c];
    // roll around the view axis
    c = Math.cos(roll); s = Math.sin(roll); [x, y] = [x * c - y * s, x * s + y * c];
    return [x, y, z];
  };
  const P = v.map(p => rot(toView(p)));
  let minX = 1e9, maxX = -1e9, minY = 1e9, maxY = -1e9;
  P.forEach(p => { minX = Math.min(minX, p[0]); maxX = Math.max(maxX, p[0]); minY = Math.min(minY, p[1]); maxY = Math.max(maxY, p[1]); });
  const span = Math.max(maxX - minX, maxY - minY), W = SIZE * SS, H = SIZE * SS, margin = 8 * SS;
  const k = (W - margin * 2) / span;
  const sx = p => (p[0] - (minX + maxX) / 2) * k + W / 2, sy = p => H / 2 - (p[1] - (minY + maxY) / 2) * k;

  const color = Buffer.alloc(W * H * 4), depth = new Float32Array(W * H).fill(-1e9);
  const light = (() => { const l = [-.4, .6, .7], n = Math.hypot(...l); return l.map(x => x / n); })();
  for (const t of tris) {
    const a = P[t[0][0]], b = P[t[1][0]], c = P[t[2][0]];
    const ax = sx(a), ay = sy(a), bx = sx(b), by = sy(b), cx = sx(c), cy = sy(c);
    const area = (bx - ax) * (cy - ay) - (cx - ax) * (by - ay);
    if (Math.abs(area) < 1e-6) continue;
    // face normal for lighting (two-sided)
    const u1 = [b[0] - a[0], b[1] - a[1], b[2] - a[2]], u2 = [c[0] - a[0], c[1] - a[1], c[2] - a[2]];
    let n = [u1[1] * u2[2] - u1[2] * u2[1], u1[2] * u2[0] - u1[0] * u2[2], u1[0] * u2[1] - u1[1] * u2[0]];
    const nl = Math.hypot(...n) || 1; n = n.map(x => x / nl);
    if (n[2] < 0) n = n.map(x => -x);
    const shade = Math.min(1.15, AMBIENT + (1 - AMBIENT) * Math.max(0, n[0] * light[0] + n[1] * light[1] + n[2] * light[2]) * 1.1);
    const uv = t.map(i => i[1] >= 0 ? vt[i[1]] : [0, 0]);
    const x0 = Math.max(0, Math.floor(Math.min(ax, bx, cx))), x1 = Math.min(W - 1, Math.ceil(Math.max(ax, bx, cx)));
    const y0 = Math.max(0, Math.floor(Math.min(ay, by, cy))), y1 = Math.min(H - 1, Math.ceil(Math.max(ay, by, cy)));
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
      const px = x + .5, py = y + .5;
      const w0 = ((bx - px) * (cy - py) - (cx - px) * (by - py)) / area, w1 = ((cx - px) * (ay - py) - (ax - px) * (cy - py)) / area, w2 = 1 - w0 - w1;
      if (w0 < -1e-4 || w1 < -1e-4 || w2 < -1e-4) continue;
      const z = w0 * a[2] + w1 * b[2] + w2 * c[2];
      const at = y * W + x;
      if (z <= depth[at]) continue;
      const u = w0 * uv[0][0] + w1 * uv[1][0] + w2 * uv[2][0], vv = w0 * uv[0][1] + w1 * uv[1][1] + w2 * uv[2][1];
      const tx = Math.min(TW - 1, Math.max(0, Math.floor((((u % 1) + 1) % 1) * TW))), ty = Math.min(TH - 1, Math.max(0, Math.floor((1 - (((vv % 1) + 1) % 1)) * TH)));
      const ti = (ty * TW + tx) * 4;
      if (CUTOUT && TD[ti + 3] < 128) continue;
      depth[at] = z;
      color[at * 4] = Math.min(255, TD[ti] * shade); color[at * 4 + 1] = Math.min(255, TD[ti + 1] * shade); color[at * 4 + 2] = Math.min(255, TD[ti + 2] * shade); color[at * 4 + 3] = 255;
    }
  }
  let img = sharp(color, { raw: { width: W, height: H, channels: 4 } }).resize(SIZE, SIZE, { kernel: 'lanczos3' });
  img = sharp(await img.png().toBuffer()).trim({ background: { r: 0, g: 0, b: 0, alpha: 0 }, threshold: 1 });
  let out = await img.png().toBuffer();
  const meta = await sharp(out).metadata();
  out = await sharp(out).extend({ top: 4, bottom: 4, left: 4, right: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } }).png().toBuffer();
  if (FLIP) out = await sharp(out).flop().png().toBuffer();
  fs.writeFileSync(outPath, out);
  console.log(outPath + ' ' + meta.width + 'x' + meta.height);
})();
