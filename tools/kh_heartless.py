"""Procedural Heartless sprites -> feet-anchored strips (idle/move/attack/hurt)."""
import math, json
from PIL import Image, ImageDraw, ImageFilter
OUT = '/workspace/assets/kh/units/'
S = 4; C = 160  # supersample, cell size
BODY = (12, 11, 20, 255); RIM = (52, 50, 84, 255); EYE = (255, 214, 58, 255); RED = (196, 30, 44, 255)

def layer(): return Image.new('RGBA', (C * S, C * S), (0, 0, 0, 0))
def P(*pts): return [(x * S, y * S) for x, y in pts]
def E(d, cx, cy, rx, ry, fill, outline=None): d.ellipse([(cx - rx) * S, (cy - ry) * S, (cx + rx) * S, (cy + ry) * S], fill=fill, outline=outline)

def eyes(d, cx, cy, gap, r, blink=False):
    for sx in (-1, 1):
        x = cx + sx * gap
        E(d, x, cy, r, r * (.25 if blink else 1.15), EYE)
        if not blink: E(d, x, cy, r * .26, r * .95, (30, 20, 0, 255))

def emblem(d, cx, cy, s, col=RED):
    E(d, cx - s * .3, cy - s * .25, s * .36, s * .36, col); E(d, cx + s * .3, cy - s * .25, s * .36, s * .36, col)
    d.polygon(P((cx - s * .62, cy - s * .12), (cx + s * .62, cy - s * .12), (cx + s * .02, cy + s * .75)), fill=col)
    d.line(P((cx - s * .35, cy - s * .55), (cx + s * .3, cy + s * .35)), fill=(20, 4, 8, 255), width=int(S * s * .12))

def tentacle(d, x0, y0, x1, y1, bend, w):
    pts = []
    for i in range(13):
        t = i / 12; pts.append(((x0 + (x1 - x0) * t + math.sin(t * math.pi) * bend) * S, (y0 + (y1 - y0) * t) * S))
    d.line(pts, fill=BODY, width=int(w * S), joint='curve')
    E(d, x1, y1, w * .55, w * .55, BODY)

# ---- individual bodies; each draws upright with feet on y=140, centred on x=80 ----
def shadow(d, p):
    sq = p.get('sq', 1); bob = p.get('bob', 0); sway = p.get('sway', 0); reach = p.get('reach', 0)
    cy = 112 + bob
    E(d, 80, cy, 30 / sq ** .5 * (1 + (sq - 1) * .5), 24 * sq, BODY)        # crouched body
    E(d, 80, cy - 20, 22, 18 * sq, BODY)
    for s_ in (-1, 1):                                                  # antennae
        tentacle(d, 80 + s_ * 8, cy - 36 * sq, 80 + s_ * (28 + sway * 4), cy - 62 * sq - abs(sway) * 2, s_ * 6, 3.4)
        tentacle(d, 80 + s_ * 18, cy + 8, 80 + s_ * (36 + reach * (s_ > 0)), 132 + bob * .5 - reach * 0.2, s_ * 5, 5)   # arms / claws
        d.polygon(P((80 + s_ * (36 + reach * (s_ > 0)) - 6, 132), (80 + s_ * (36 + reach * (s_ > 0)) + 6, 132), (80 + s_ * (38 + reach * (s_ > 0)), 142)), fill=BODY)
        E(d, 80 + s_ * 14, 134, 9, 7, BODY)                              # feet
    E(d, 80, cy - 22, 24, 19, None, RIM) if False else None
    eyes(d, 80, cy - 22, 11, 6.2, p.get('blink'))
def gigas(d, p):
    p = dict(p); shadow(d, p)
    by = 112 + p.get('bob', 0)
    d.arc([(80 - 16) * S, (by - 14) * S, (80 + 16) * S, (by - 2) * S], 15, 165, fill=(255, 214, 58, 255), width=int(2.2 * S))
    E(d, 66, by - 8, 4, 4, (50, 48, 80, 255)); E(d, 94, by - 8, 4, 4, (50, 48, 80, 255))
def soldier(d, p):
    bob = p.get('bob', 0); lean = p.get('swing', 0); reach = p.get('reach', 0)
    cy = 100 + bob
    for s_ in (-1, 1):                                                  # legs (bent, dancer-like)
        d.line(P((80 + s_ * 6, cy + 14), (80 + s_ * (16 + lean * s_), cy + 26), (80 + s_ * 9, 138)), fill=BODY, width=6 * S, joint='curve')
        E(d, 80 + s_ * 11, 139, 9, 4.5, BODY)
        d.line(P((80 + s_ * 9, cy - 8), (80 + s_ * (24 + (reach if s_ > 0 else 0)), cy + 8 + lean * s_ * .5), (80 + s_ * (30 + (reach if s_ > 0 else 0)), cy + 24 - (reach * .2 if s_ > 0 else 0))), fill=BODY, width=5 * S, joint='curve')
    E(d, 80, cy, 14, 22, BODY)                                         # thin torso
    emblem(d, 80, cy + 2, 7)
    E(d, 80, cy - 28, 19, 16, BODY)                                      # head
    for s_ in (-1, 1): tentacle(d, 80 + s_ * 10, cy - 38, 80 + s_ * 24, cy - 62, s_ * 5, 3)
    eyes(d, 80, cy - 28, 8, 5, p.get('blink'))
def largebody(d, p):
    bob = p.get('bob', 0); sq = p.get('sq', 1); reach = p.get('reach', 0)
    cy = 100 + bob
    E(d, 80, cy, 48 / sq ** .5, 38 * sq, BODY)                          # huge belly
    E(d, 80, cy + 8 * sq, 40 / sq ** .5, 30 * sq, (22, 21, 36, 255))   # armoured belly sheen
    emblem(d, 80, cy + 6, 16)
    E(d, 80, cy - 40 * sq, 20, 16, BODY)
    for s_ in (-1, 1):
        E(d, 80 + s_ * 52 / sq ** .5, cy - 2 - (reach * .6 if s_ > 0 else 0), 10, 14, BODY)
        E(d, 80 + s_ * 26, 140, 17, 8, BODY)
    d.polygon(P((64, cy - 48 * sq), (80, cy - 66 * sq), (96, cy - 48 * sq)), fill=BODY)  # helmet crest
    eyes(d, 80, cy - 40 * sq, 9, 5.2, p.get('blink'))
    if p.get('angry'): d.line(P((64, cy - 50 * sq), (74, cy - 45 * sq)), fill=RED, width=3 * S); d.line(P((96, cy - 50 * sq), (86, cy - 45 * sq)), fill=RED, width=3 * S)
def nocturne(d, p):
    bob = p.get('bob', 0); cast = p.get('cast', 0); sway = p.get('sway', 0)
    cy = 92 + bob
    cloak = (150, 22, 38, 255); cloak2 = (96, 10, 26, 255)
    d.polygon(P((56, cy - 6), (104, cy - 6), (112 + sway * 3, cy + 46), (100 + sway * 4, cy + 36), (90, cy + 52), (80 + sway * 5, cy + 36), (68, cy + 50), (60 + sway * 3, cy + 36), (48 + sway * 3, cy + 46)), fill=cloak)
    d.polygon(P((66, cy), (94, cy), (100, cy + 40), (80, cy + 30), (60, cy + 40)), fill=cloak2)
    for s_ in (-1, 1):
        x1 = 80 + s_ * (34 + cast * 6); y1 = cy + 4 - cast * 22
        d.line(P((80 + s_ * 16, cy), (x1, y1)), fill=cloak, width=7 * S)
        E(d, x1, y1, 7, 7, BODY)
    E(d, 80, cy - 14, 18, 15, BODY)                                      # face
    eyes(d, 80, cy - 14, 7, 4.5, p.get('blink'))
    d.polygon(P((52, cy - 22), (108, cy - 22), (92 + sway * 3, cy - 40), (84 + sway * 6, cy - 78), (76 + sway * 8, cy - 40)), fill=cloak)   # hat
    d.polygon(P((52, cy - 22), (108, cy - 22), (106, cy - 28), (54, cy - 28)), fill=(230, 200, 90, 255))
    E(d, 84 + sway * 6, cy - 78, 4, 4, (255, 180, 60, 255))
    if cast:
        for i in range(3): E(d, 80 + (i - 1) * 16 * cast, cy - 52 - i % 2 * 6, 8 * cast, 8 * cast, (255, 130 + i * 30, 40, 220))

def render(fn, p, tint=None, alpha=1.0, scale=1.0, rot=0, shadow_=True):
    im = layer(); d = ImageDraw.Draw(im); fn(d, p)
    # soft rim light
    edge = im.filter(ImageFilter.GaussianBlur(S * 1.6))
    r, g, b, a = im.split()
    if tint:
        px = im.load()
        if tint == 'ghost':
            ar = a.point(lambda v: int(v * alpha)); im = Image.merge('RGBA', (r.point(lambda v: min(255, v + 36)), g.point(lambda v: min(255, v + 48)), b.point(lambda v: min(255, v + 90)), ar))
    if rot or scale != 1:
        w, h = im.size; im = im.rotate(rot, resample=Image.BICUBIC, center=(w / 2, 140 * S))
        if scale != 1:
            ns = im.resize((int(w * scale), int(h * scale)), Image.BICUBIC); big = layer(); big.alpha_composite(ns, (int(w / 2 - w * scale / 2), int(140 * S - 140 * S * scale))); im = big
    sh = Image.new('RGBA', im.size, (0, 0, 0, 0)); sd = ImageDraw.Draw(sh)
    if shadow_: sd.ellipse([(80 - 38) * S, 134 * S, (80 + 38) * S, 146 * S], fill=(0, 0, 0, 90))
    sh.alpha_composite(im)
    return sh.resize((C, C), Image.LANCZOS)

ANIMS = {
  'idle':   [dict(bob=0, sway=0), dict(bob=-2, sway=1, sq=1.04), dict(bob=-3, sway=2), dict(bob=-1, sway=1, sq=.98, blink=True)],
  'move':   [dict(bob=0, swing=3, sway=-2, reach=0), dict(bob=-5, swing=-3, sway=0, sq=1.06), dict(bob=0, swing=3, sway=2), dict(bob=-5, swing=-3, sway=0, sq=1.06)],
  'attack': [dict(bob=2, sq=.9, reach=-6), dict(bob=-4, sq=1.08, reach=14, swing=8), dict(bob=0, sq=.94, reach=22, swing=10, rot=-6), dict(bob=-1, reach=6)],
}
DEF = {
  'shadow': (shadow, {}), 'gigas': (gigas, {'scale': 1.0}), 'soldier': (soldier, {}),
  'stealth': (soldier, {'tint': 'ghost', 'alpha': .85}), 'largebody': (largebody, {}), 'nocturne': (nocturne, {}),
}
meta = {}
for key, (fn, o) in DEF.items():
    for clip, frames in ANIMS.items():
        imgs = []
        for pose in frames:
            p = dict(pose); rot = p.pop('rot', 0)
            if key == 'nocturne' and clip == 'attack': p['cast'] = {2: 1, 1: .6}.get(frames.index(pose), .2)
            if key == 'largebody' and clip == 'attack': p['angry'] = True
            imgs.append(render(fn, p, o.get('tint'), o.get('alpha', 1), 1.0, rot))
        sh = Image.new('RGBA', (C * len(imgs), C), (0, 0, 0, 0))
        for i, im in enumerate(imgs): sh.alpha_composite(im, (i * C, 0))
        name = f'heartless-{key}-{clip}'; sh.save(OUT + name + '.png')
        meta[name] = dict(src=f'assets/kh/units/{name}.png', cols=len(imgs), rows=1, cellW=C, cellH=C, anchorX=80, groundY=140, n=len(imgs))
json.dump(meta, open('/tmp/kh_hl_meta.json', 'w'))
# contact sheet
cs = Image.new('RGBA', (C * 4 * 2, C * 3 * 3), (60, 58, 96, 255))
for k, key in enumerate(DEF):
    for j, clip in enumerate(ANIMS):
        im = Image.open(OUT + f'heartless-{key}-{clip}.png'); cs.alpha_composite(im, ((k % 2) * C * 4, ((k // 2) * 3 + j) * C))
cs.save('/tmp/prev/heartless.png')
