"""Re-slice the Kingdom Hearts sheets into feet-anchored strips.
Every frame is anchored on its ground shadow (fallback: lowest pixels), so
clips line up and nothing slides around inside its cell."""
import json, sys
from PIL import Image
import numpy as np
U = '/workspace/uploads/'
OUT = '/workspace/assets/kh/units/'

def anchor(a):
    al = a[..., 3] > 40
    ys, xs = np.nonzero(al)
    if len(ys) == 0: return None
    yb = ys.max()
    band = np.zeros_like(al); band[max(0, yb - 9):yb + 1] = True
    dark = band & al & (a[..., :3].max(axis=2) < 70)
    sel = dark if dark.sum() > 12 else (band & al)
    sy, sx = np.nonzero(sel)
    return float(sx.mean()), float(yb - 3)

def cut(img, cw, ch, cols, idx):
    c, r = idx % cols, idx // cols
    return img.crop((c * cw, r * ch, (c + 1) * cw, (r + 1) * ch))

def build(name, frames_imgs, fixed_anchor=None):
    """frames_imgs: list of RGBA images. Returns atlas meta."""
    anchors = []
    for im in frames_imgs:
        a = np.array(im)
        anc = anchor(a)
        anchors.append(anc or (im.width / 2, im.height - 2))
    if fixed_anchor: anchors = [fixed_anchor] * len(anchors)
    L = max(ax for ax, ay in anchors); R = max(im.width - ax for im, (ax, ay) in zip(frames_imgs, anchors))
    T = max(ay for ax, ay in anchors); Bt = max(im.height - ay for im, (ax, ay) in zip(frames_imgs, anchors))
    L, R, T, Bt = int(np.ceil(L)) + 1, int(np.ceil(R)) + 1, int(np.ceil(T)) + 1, int(np.ceil(Bt)) + 1
    cw, ch = L + R, T + Bt
    sheet = Image.new('RGBA', (cw * len(frames_imgs), ch), (0, 0, 0, 0))
    for i, (im, (ax, ay)) in enumerate(zip(frames_imgs, anchors)):
        sheet.alpha_composite(im, (i * cw + L - int(round(ax)), T - int(round(ay))))
    sheet.save(OUT + name + '.png')
    return dict(src='assets/kh/units/' + name + '.png', cols=len(frames_imgs), rows=1, cellW=cw, cellH=ch, anchorX=L, groundY=T, n=len(frames_imgs))

def nonempty(im): return im.getbbox() is not None

meta = {}
def sheet(name, f, cw, ch, cols, idxs):
    img = Image.open(U + f).convert('RGBA')
    fr = [cut(img, cw, ch, cols, i) for i in idxs]
    fr = [x for x in fr if nonempty(x)]
    meta[name] = build(name, fr)

# Sora
sheet('sora-idle', 'soraidle.png', 60, 73, 3, [0, 1, 2, 3])
sheet('sora-move', '335000105_standby.png', 81, 68, 3, [0, 1, 2, 3])
sheet('sora-attack', 'sorattack.png', 247, 127, 3, [0, 1, 2, 3, 4, 5])
sheet('sora-cast', 'soramagic.png', 99, 71, 3, [0, 1, 2, 3])
# Riku (real grids: 3 columns x 2 rows)
sheet('riku-idle', 'rikuidle.png', 48, 69, 3, [0, 1, 2, 3, 4, 5])
sheet('riku-move', 'unit_standby_335000405.png', 57, 72, 3, [0, 1, 2, 3, 4, 5])
sheet('riku-attack', 'rikuattarck.png', 220, 101, 3, [6, 7, 8, 9, 10, 11])
sheet('riku-cast', 'rikumagic.png', 73, 61, 3, [0, 1, 2, 3])
# Kairi: her idle/move sheets are medallion art and her attack sheet's frames straddle
# the nominal grid, so she is cut from explicit windows (A: hover, B/C: aerial combo, D: guard).
kimg = Image.open(U + 'kairiattackspritesheet.png').convert('RGBA')
def kwin(y0, y1): return [kimg.crop((i * 302, y0, (i + 1) * 302, y1)) for i in range(3)]
KA, KB, KC, KD = kwin(900, 1012), kwin(1004, 1156), kwin(1158, 1296), kwin(1322, 1420)
meta['kairi-idle'] = build('kairi-idle', [KA[0], KA[1], KA[0], KA[1]])
meta['kairi-move'] = build('kairi-move', [KA[1], KA[2], KA[0], KA[2]])
meta['kairi-attack'] = build('kairi-attack', KB + KC)
def fixed(im):
    bb = im.getbbox(); return im, (float((bb[0] + bb[2]) / 2), float(bb[3] + 18))
kd = [fixed(x) for x in KD]
for im, anc in kd: pass
meta['kairi-cast'] = build('kairi-cast', [KD[0], KD[1], KD[2], KD[1]], fixed_anchor=(151.0, float(max(x.getbbox()[3] for x in KD) + 18)))
# Goofy
g = Image.open(U + 'goofy-sprites-transparent.png').convert('RGBA')
def rects(name, rs):
    fr = [g.crop((r['x'], r['y'], r['x'] + r['w'], r['y'] + r['h'])) for r in rs]
    out = []
    for im in fr:  # no shadow on this sheet: anchor on lowest pixels / bbox centre
        a = np.array(im); al = a[..., 3] > 40; ys, xs = np.nonzero(al)
        out.append((im, (float(xs.mean()) if len(xs) else im.width / 2, float(ys.max()) if len(ys) else im.height)))
    L = max(ax for _, (ax, ay) in out); R = max(im.width - ax for im, (ax, ay) in out)
    T = max(ay for _, (ax, ay) in out); Bt = max(im.height - ay for im, (ax, ay) in out)
    L, R, T, Bt = int(np.ceil(L)) + 1, int(np.ceil(R)) + 1, int(np.ceil(T)) + 1, int(np.ceil(Bt)) + 1
    sh = Image.new('RGBA', ((L + R) * len(out), T + Bt), (0, 0, 0, 0))
    for i, (im, (ax, ay)) in enumerate(out): sh.alpha_composite(im, (i * (L + R) + L - int(round(ax)), T - int(round(ay))))
    sh.save(OUT + name + '.png')
    meta[name] = dict(src='assets/kh/units/' + name + '.png', cols=len(out), rows=1, cellW=L + R, cellH=T + Bt, anchorX=L, groundY=T, n=len(out))
R = lambda *a: [dict(x=x, y=y, w=w, h=h) for x, y, w, h in a]
rects('goofy-idle', R((48, 150, 44, 64), (87, 150, 47, 64), (130, 150, 53, 64), (179, 150, 45, 64)))
rects('goofy-move', R((109, 343, 45, 69), (147, 343, 37, 69), (175, 343, 35, 69), (202, 343, 37, 69), (232, 343, 40, 69), (264, 343, 43, 69), (299, 343, 45, 69)))
rects('goofy-attack', R((122, 77, 67, 74), (178, 77, 50, 74), (226, 77, 72, 74), (292, 77, 70, 74), (369, 77, 75, 74), (446, 77, 66, 74)))
rects('goofy-cast', R((37, 1, 46, 77), (75, 1, 45, 77), (112, 8, 55, 70), (159, 1, 46, 77), (198, 1, 46, 77)))

# ---- GIF actors: unpack to strips with a stable foot anchor per clip ----
from PIL import ImageSequence
def gif_frames(f):
    im = Image.open(U + f); out = []; ms = im.info.get('duration', 100)
    for fr in ImageSequence.Iterator(im): out.append(fr.convert('RGBA'))
    return out, ms
def feet_x(im):
    a = np.array(im); al = a[..., 3] > 40; ys, xs = np.nonzero(al)
    if len(ys) == 0: return im.width / 2, im.height
    yb = ys.max(); sel = ys >= yb - 5
    return float(xs[sel].mean()), float(yb)
def gif_clip(name, f, fixed_canvas=False, keep=None):
    frs, ms = gif_frames(f)
    if keep: frs = [frs[i] for i in keep]
    frs = [x for x in frs if x.getbbox()]
    if fixed_canvas:
        bb = [x.getbbox() for x in frs]; ux = int(np.median([(b[0] + b[2]) / 2 for b in bb])); uy = max(b[3] for b in bb)
        anchors = [(ux, uy)] * len(frs)
    else:
        xs = [feet_x(x) for x in frs]; ax = float(np.median([x for x, y in xs])); ay = max(y for x, y in xs)
        anchors = [(ax, ay)] * len(frs)
    L = max(ax for ax, ay in anchors); R = max(im.width - ax for im, (ax, ay) in zip(frs, anchors))
    T = max(ay for ax, ay in anchors); Bt = max(im.height - ay for im, (ax, ay) in zip(frs, anchors))
    L, R, T, Bt = int(np.ceil(L)) + 1, int(np.ceil(R)) + 1, int(np.ceil(T)) + 1, int(np.ceil(Bt)) + 1
    cw, ch = L + R, T + Bt
    sh = Image.new('RGBA', (cw * len(frs), ch), (0, 0, 0, 0))
    for i, (im, (ax, ay)) in enumerate(zip(frs, anchors)): sh.alpha_composite(im, (i * cw + L - int(round(ax)), T - int(round(ay))))
    sh.save(OUT + name + '.png')
    meta[name] = dict(src='assets/kh/units/' + name + '.png', cols=len(frs), rows=1, cellW=cw, cellH=ch, anchorX=L, groundY=T, n=len(frs), fps=round(1000 / ms, 1))
gif_clip('donald-idle', 'donald_duck_idle_front.gif'); gif_clip('donald-cast', 'donald_duck_staff_cast.gif')
gif_clip('donald-hurt', 'donald_duck_recoil.gif'); gif_clip('donald-move', 'donald_duck_tumble.gif'); gif_clip('donald-flash', 'donald_duck_pale_flash_pose.gif')
gif_clip('jack-idle', 'jack_skellington_front_gestures.gif'); gif_clip('jack-move', 'jack_skellington_walk_front.gif'); gif_clip('jack-run', 'jack_skellington_run_front.gif')
gif_clip('jack-attack', 'jack_skellington_low_attack.gif'); gif_clip('jack-cast', 'jack_skellington_action_poses.gif')
# Alternate combat loops use the supplied frames at 1:1 pixel resolution.
# Repeating a held pose calms the idle; the dedicated scare has its own timing.
gif_clip('jack-idle-v2', 'jack_skellington_front_gestures.gif', keep=[0, 0, 0, 1, 1, 0, 0, 3, 3, 0])
gif_clip('jack-scare', 'jack_skellington_action_poses.gif', keep=[2, 1, 6, 4, 0])
gif_clip('oogie-idle', 'oogie_boogie_idle_front_pose.gif'); gif_clip('oogie-attack', 'oogie_boogie_arm_sweep.gif'); gif_clip('oogie-cast', 'oogie_boogie_laugh_and_point.gif')
gif_clip('oogie-eat', 'oogie_boogie_inflate_and_deflate.gif'); gif_clip('oogie-bomb', 'oogie_boogie_bomb.gif')
gif_clip('oogie-idle-v2', 'oogie_boogie_laugh_and_point.gif', keep=[0, 0, 0, 2, 2, 0, 0, 3, 2, 0])
gif_clip('oogie-shuffle', 'oogie_boogie_arm_sweep.gif', keep=[5, 4, 3, 4, 5, 0, 1, 0])
gif_clip('oogie-fright', 'oogie_boogie_inflate_and_deflate.gif', keep=[0, 1, 2, 3, 4, 5, 7, 9, 10])
gif_clip('dice-orange', 'oogie_boogie_orange_dice_spin.gif'); gif_clip('dice-purple1', 'oogie_boogie_purple_dice_faces_1.gif'); gif_clip('dice-purple2', 'oogie_boogie_purple_dice_faces_2.gif')
gif_clip('oogie-blade', 'oogie_boogie_hanging_blade.gif')
gif_clip('lsb-idle', 'lockshockbarrelidle.gif', True); gif_clip('lsb-move', 'lockshockbarrelwalk.gif', True); gif_clip('lsb-cast', 'lockshockbarrelskill1_loop_a.gif', True)
json.dump(meta, open('/tmp/kh_meta.json', 'w'), indent=1)
print(json.dumps(meta))
