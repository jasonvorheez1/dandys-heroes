import math
from PIL import Image, ImageDraw, ImageFilter
SRC = Image.open('/workspace/assets/kh/vn/eclipse.webp').convert('RGBA')
CELL = 384; SS = 2; N = CELL * SS
K = .27 * SS            # source px -> working px

def mask_poly(pts):
    m = Image.new('L', SRC.size, 0); ImageDraw.Draw(m).polygon(pts, fill=255)
    return m.filter(ImageFilter.GaussianBlur(1.2))
def cut(mask):
    a = SRC.copy(); alpha = Image.composite(a.getchannel('A'), Image.new('L', SRC.size, 0), mask); a.putalpha(alpha); return a

W, H = SRC.size
def vfade(y0, y1, up=True):
    """Alpha ramp over y0..y1 (0->255 going down if up else 255->0)."""
    m = Image.new('L', SRC.size, 0); px = m.load()
    for y in range(H):
        v = 0 if y < y0 else 255 if y > y1 else int(255 * (y - y0) / (y1 - y0))
        v = v if up else 255 - v
        for x in range(W): px[x, y] = v
    return m
from PIL import ImageChops
def both(m1, m2): return ImageChops.multiply(m1, m2)
IMG_HEAD = cut(mask_poly([(0, 0), (W, 0), (W, 478), (0, 478)]))
IMG_ARM = cut(mask_poly([(0, 515), (222, 515), (222, 610), (205, 748), (0, 748)]))
IMG_TAIL = cut(mask_poly([(338, 580), (W, 580), (W, 830), (338, 830)]))
_t = mask_poly([(60, 440), (400, 440), (400, 590), (340, 600), (340, 800), (60, 800)])
_arm_hole = ImageChops.invert(mask_poly([(0, 535), (186, 555), (156, 640), (134, 705), (110, 748), (0, 748)]))
IMG_TORSO = cut(both(_t, _arm_hole))
IMG_LEGL = cut(both(mask_poly([(40, 700), (292, 700), (292, H), (40, H)]), vfade(738, 780, True)))
IMG_LEGR = cut(both(mask_poly([(292, 700), (480, 700), (480, H), (292, H)]), vfade(738, 780, True)))

def put(canvas, part, pivot, at, ang=0, sx=1, sy=1):
    """Draw part so its pivot (source px) lands at `at` (working px), rotated ang degrees (clockwise)."""
    w, h = part.size
    p = part.resize((max(1, round(w * K * sx)), max(1, round(h * K * sy))), Image.LANCZOS)
    pv = (pivot[0] * K * sx, pivot[1] * K * sy)
    R = int(math.hypot(p.width, p.height)) + 4
    tmp = Image.new('RGBA', (2 * R, 2 * R), (0, 0, 0, 0))
    tmp.alpha_composite(p, (round(R - pv[0]), round(R - pv[1])))
    tmp = tmp.rotate(-ang, resample=Image.BICUBIC, center=(R, R))
    canvas.alpha_composite(tmp, (round(at[0] - R), round(at[1] - R)))

INK = (60, 20, 30, 255)
def board(canvas, cx, cy, ang=0, thin=False):
    """Skateboard seen side-on; (cx, cy) is the middle of the deck top."""
    b = Image.new('RGBA', (N, N), (0, 0, 0, 0)); d = ImageDraw.Draw(b)
    L = 150 * SS; t = (6 if thin else 14) * SS; y = N // 2; x0 = N // 2 - L // 2; x1 = N // 2 + L // 2
    def curve(xs, kick):  # deck top edge height at x: flat in the middle, kicked up at the ends
        u = min(xs - x0, x1 - xs) / (28 * SS)
        return y - kick * SS * max(0, 1 - u) ** 2 * 1.0
    top = [(x, curve(x, 17)) for x in range(x0, x1 + 1, 2 * SS)]
    bot = [(x, curve(x, 17) + t) for x in range(x1, x0 - 1, -2 * SS)]
    d.polygon(top + bot, fill=(236, 78, 92, 255), outline=INK)
    d.line(top + [bot[0]] + bot + [top[0]], fill=INK, width=2 * SS, joint='curve')
    if not thin:
        d.line([(x, curve(x, 17) + 3.5 * SS) for x in range(x0 + 6 * SS, x1 - 5 * SS, 2 * SS)], fill=(255, 160, 170, 255), width=2 * SS)
        cx0, cy0 = N // 2, y + t // 2
        d.ellipse([cx0 - 5 * SS, cy0 - 4 * SS, cx0 + 5 * SS, cy0 + 4 * SS], fill=(255, 232, 150, 255), outline=INK, width=SS)
        for wx in (x0 + 36 * SS, x1 - 36 * SS):
            d.rectangle([wx - 9 * SS, y + t - SS, wx + 9 * SS, y + t + 6 * SS], fill=(150, 152, 164, 255), outline=INK, width=SS)   # trucks
            d.ellipse([wx - 12 * SS, y + t + 2 * SS, wx + 12 * SS, y + t + 26 * SS], fill=(246, 244, 232, 255), outline=INK, width=2 * SS)
            d.ellipse([wx - 4 * SS, y + t + 10 * SS, wx + 4 * SS, y + t + 18 * SS], fill=(200, 80, 90, 255))
    if ang: b = b.rotate(-ang, resample=Image.BICUBIC)
    canvas.alpha_composite(b, (round(cx - N // 2), round(cy - N // 2)))

# --- rig pivots in source px
P_HEAD = (290, 455); P_TORSO = (230, 760); P_TAIL = (350, 690); P_ARM = (175, 585); P_HIPL = (215, 740); P_HIPR = (355, 740)


def rot(v, a):
    a = math.radians(a); return (v[0] * math.cos(a) - v[1] * math.sin(a), v[0] * math.sin(a) + v[1] * math.cos(a))

DECK = 322 * SS
def pose(crouch=1.0, lean=0, head=0, hdx=0, hdy=0, arm=0, tailA=0, lsy=None, rsy=None, la=0, ra=0, spread=34,
         board_ang=0, bx=0, by=0, thin=False, fig_rot=0, fig_dx=0, fig_dy=0):
    lsy = lsy if lsy is not None else crouch; rsy = rsy if rsy is not None else crouch
    board_l = Image.new('RGBA', (N, N), (0, 0, 0, 0)); fig = Image.new('RGBA', (N, N), (0, 0, 0, 0))
    deck = DECK + by
    board(board_l, N // 2 + bx, deck + 7 * SS, board_ang, thin)
    cx = N // 2 + bx
    LEG = 260 * K
    avg = (lsy + rsy) / 2
    FOOT = deck + 12 * SS
    root = (cx, FOOT - LEG * avg + 30 * K)
    tp = rot(((350 - 285) * K, (690 - 770) * K), lean)
    put(fig, IMG_TAIL, P_TAIL, (root[0] + tp[0], root[1] + tp[1]), tailA + lean * .5)
    put(fig, IMG_TORSO, (285, 770), root, lean)
    for part, pv, sy_, sgn, a in ((IMG_LEGR, P_HIPR, rsy, 1, ra), (IMG_LEGL, P_HIPL, lsy, -1, la)):
        hx = cx + (pv[0] - 285) * K + sgn * spread * SS * .5
        put(fig, part, pv, (hx, FOOT - LEG * sy_), a, 1, sy_)
    sh = rot(((175 - 285) * K, (585 - 770) * K), lean)
    put(fig, IMG_ARM, P_ARM, (root[0] + sh[0], root[1] + sh[1]), arm + lean * .6)
    nk = rot(((290 - 285) * K, (462 - 770) * K), lean)
    put(fig, IMG_HEAD, (290, 462), (root[0] + nk[0] + hdx * SS, root[1] + nk[1] + hdy * SS), head + lean)
    if fig_rot:
        PRE = 130 * SS      # slide left first so the rotated body stays inside the canvas
        fig = fig.transform(fig.size, Image.AFFINE, (1, 0, PRE, 0, 1, 0))
        fig = fig.rotate(-fig_rot, resample=Image.BICUBIC, center=(cx - PRE, deck))
        fig = fig.transform(fig.size, Image.AFFINE, (1, 0, -(fig_dx + 130) * SS, 0, 1, -fig_dy * SS))
    elif fig_dx or fig_dy: fig = fig.transform(fig.size, Image.AFFINE, (1, 0, -fig_dx * SS, 0, 1, -fig_dy * SS))
    out = Image.new('RGBA', (N, N), (0, 0, 0, 0)); out.alpha_composite(board_l); out.alpha_composite(fig)
    return out.resize((CELL, CELL), Image.LANCZOS)

FRAMES = [
    dict(crouch=.88, lean=7, head=3, arm=-12, tailA=10),
    dict(crouch=.97, lean=3, head=-2, hdy=-2, arm=14, tailA=-6, rsy=.94, ra=-4),
    dict(crouch=.86, lean=8, head=4, arm=-4, tailA=-12),
    dict(crouch=.95, lean=4, head=-1, hdy=-2, arm=-24, tailA=8, lsy=.92, la=3),
    dict(crouch=.66, lean=16, head=-5, hdy=2, arm=34, tailA=24, spread=44),
    dict(crouch=.78, lean=-9, head=-6, arm=46, tailA=34, board_ang=-14, spread=40),
    dict(crouch=.68, lean=-2, head=-3, arm=58, tailA=22, spread=40, by=-2),
    dict(crouch=.86, lean=6, head=2, arm=26, tailA=-22, board_ang=11, spread=38),
    dict(crouch=.58, lean=22, head=-10, hdy=3, arm=-78, tailA=30, spread=46, lsy=.55, rsy=.62),
    dict(crouch=.74, lean=-12, head=6, arm=40, tailA=16, spread=40),
    dict(crouch=.74, lean=12, head=-6, arm=-20, tailA=-16, spread=40),
    dict(crouch=.84, lean=0, head=12, arm=40, tailA=30, fig_rot=62, fig_dx=-30, fig_dy=-34, board_ang=24, bx=-40, by=20),
    dict(crouch=.84, lean=0, head=20, arm=60, tailA=40, fig_rot=88, fig_dx=-60, fig_dy=-78, board_ang=-8, bx=-30, by=20),
]
def strip():
    im = Image.new('RGBA', (CELL * len(FRAMES), CELL), (0, 0, 0, 0))
    for i, f in enumerate(FRAMES): im.alpha_composite(pose(**f), (i * CELL, 0))
    return im
if __name__ == '__main__':
    s = strip(); s.save('/tmp/rig/strip.png')
    bg = Image.new('RGBA', s.size, (232, 190, 150, 255)); bg.alpha_composite(s)
    bg.crop((0, 0, CELL * 7, CELL)).save('/tmp/rig/prev1.png'); bg.crop((CELL * 7, 0, CELL * 13, CELL)).save('/tmp/rig/prev2.png')
