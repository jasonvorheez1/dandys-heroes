import math, random
from PIL import Image, ImageDraw, ImageFilter
import numpy as np
W, H = 1000, 560; OUT = '/workspace/assets/kh/bg/'
def grad(stops, h=H):
    a = np.zeros((h, W, 3), float)
    ys = np.linspace(0, 1, h)
    for c in range(3):
        a[:, :, c] = np.interp(ys, [s[0] for s in stops], [s[1][c] for s in stops])[:, None]
    return Image.fromarray(a.astype('uint8')).convert('RGBA')
def glow(im, xy, r, col, a=160):
    g = Image.new('RGBA', im.size, (0, 0, 0, 0)); d = ImageDraw.Draw(g)
    d.ellipse([xy[0] - r, xy[1] - r, xy[0] + r, xy[1] + r], fill=col + (a,))
    g = g.filter(ImageFilter.GaussianBlur(r * .45)); im.alpha_composite(g)
def stars(im, n, rng, ymax):
    d = ImageDraw.Draw(im)
    for _ in range(n):
        x, y = rng.randint(0, W), rng.randint(0, ymax); r = rng.choice([1, 1, 1, 2]); d.ellipse([x, y, x + r, y + r], fill=(255, 245, 220, rng.randint(120, 255)))
def fog(im, y, col, a, seed):
    rng = random.Random(seed); f = Image.new('RGBA', im.size, (0, 0, 0, 0)); d = ImageDraw.Draw(f)
    for _ in range(26): x = rng.randint(-100, W); d.ellipse([x, y + rng.randint(-20, 30), x + rng.randint(180, 400), y + rng.randint(40, 90)], fill=col + (a,))
    im.alpha_composite(f.filter(ImageFilter.GaussianBlur(26)))
def pumpkin(d, x, y, r, lit=True):
    d.ellipse([x - r, y - r * .8, x + r, y + r * .8], fill=(226, 104, 18, 255)); d.ellipse([x - r * .5, y - r * .8, x + r * .5, y + r * .8], outline=(170, 70, 10, 255), width=2)
    if lit:
        d.polygon([(x - r * .5, y - r * .1), (x - r * .25, y - r * .4), (x - r * .05, y - r * .1)], fill=(255, 230, 90, 255))
        d.polygon([(x + r * .5, y - r * .1), (x + r * .25, y - r * .4), (x + r * .05, y - r * .1)], fill=(255, 230, 90, 255))
        d.polygon([(x - r * .55, y + r * .2), (x - r * .3, y + r * .4), (x, y + r * .25), (x + r * .3, y + r * .4), (x + r * .55, y + r * .2), (x + r * .3, y + r * .55), (x - r * .3, y + r * .55)], fill=(255, 220, 80, 255))
    d.rectangle([x - 3, y - r * .95, x + 3, y - r * .75], fill=(60, 90, 30, 255))
def building(d, x, base, w, h, rng, col=(14, 10, 24, 255)):
    lean = rng.randint(-14, 14)
    d.polygon([(x, base), (x + w, base), (x + w + lean, base - h), (x + lean, base - h)], fill=col)
    d.polygon([(x - 8 + lean, base - h), (x + w + 8 + lean, base - h), (x + w / 2 + lean * 1.4, base - h - rng.randint(60, 120))], fill=col)
    for _ in range(rng.randint(2, 5)):
        wx = x + rng.randint(8, max(9, w - 22)) + lean * .4; wy = base - rng.randint(40, max(41, h - 20))
        d.rectangle([wx, wy, wx + 12, wy + 18], fill=(255, 168, 54, rng.choice([200, 255])))
def spiral_hill(im, cx, base, r):
    d = ImageDraw.Draw(im); d.ellipse([cx - r, base - r * .55, cx + r, base + r * 1.6], fill=(9, 7, 17, 255))
    pts = []
    for i in range(160):
        t = i / 159 * 5.2 * math.pi; rr = r * .08 + r * .62 * (i / 159)
        pts.append((cx + math.cos(t) * rr * .9, base + r * .05 - math.sin(t) * rr * .36 - (i / 159) * r * .25))
    d.line(pts, fill=(236, 232, 244, 255), width=6)
def ground(im, y, a, b, rng, cobble=True):
    g = grad([(0, a), (1, b)], H - y); im.alpha_composite(g, (0, y))
    if cobble:
        ov = Image.new('RGBA', im.size, (0, 0, 0, 0)); d = ImageDraw.Draw(ov)
        for yy in range(y + 14, H, 18):
            for xx in range(-20, W, 44):
                o = (yy // 18 % 2) * 22; d.rounded_rectangle([xx + o, yy, xx + o + 38, yy + 13], 5, outline=(255, 255, 255, 14), width=1)
        im.alpha_composite(ov)

def town(name, seed, moon=(760, 150), warm=True):
    rng = random.Random(seed); im = grad([(0, (8, 6, 28)), (.45, (44, 20, 70)), (.62, (150, 60, 44)), (.64, (22, 12, 30)), (1, (10, 8, 18))])
    stars(im, 90, rng, 220); glow(im, moon, 150, (255, 190, 110), 90)
    d = ImageDraw.Draw(im); d.ellipse([moon[0] - 62, moon[1] - 62, moon[0] + 62, moon[1] + 62], fill=(255, 238, 190, 255))
    for cx, cy, r in [(moon[0] - 20, moon[1] + 10, 14), (moon[0] + 22, moon[1] - 18, 10), (moon[0] + 8, moon[1] + 30, 8)]: d.ellipse([cx - r, cy - r, cx + r, cy + r], fill=(240, 216, 168, 255))
    spiral_hill(im, 250, 300, 230)
    x = -30
    while x < W: w = rng.randint(70, 130); building(d, x, 318, w, rng.randint(90, 190), rng); x += w + rng.randint(-10, 20)
    fog(im, 300, (120, 70, 130), 70, seed); ground(im, 318, (28, 20, 40), (10, 8, 18), rng)
    d = ImageDraw.Draw(im)
    for px in [70, 360, 640, 930]: pumpkin(d, px, 332 + rng.randint(0, 20), rng.randint(16, 24)); glow(im, (px, 335), 60, (255, 150, 40), 60)
    fog(im, 520, (80, 50, 100), 90, seed + 1)
    im.convert('RGB').save(OUT + name + '.png')

def lair(name, seed):
    rng = random.Random(seed); im = grad([(0, (2, 10, 6)), (.5, (6, 34, 20)), (.62, (4, 20, 12)), (1, (2, 8, 5))])
    d = ImageDraw.Draw(im)
    for r in range(380, 40, -60): d.ellipse([500 - r, 250 - r, 500 + r, 250 + r], outline=(90, 255, 140, 40 + (380 - r) // 5), width=5)
    glow(im, (500, 250), 220, (70, 255, 120), 70)
    for k in range(0, W, 62):  # hanging bulbs
        y = 60 + 30 * math.sin(k * .02); d.line([k, 0, k, y], fill=(40, 70, 50, 255), width=2); glow(im, (k, y), 26, (170, 255, 90), 140); d.ellipse([k - 5, y - 5, k + 5, y + 5], fill=(230, 255, 170, 255))
    cx, cy = 500, 235; d.ellipse([cx - 140, cy - 140, cx + 140, cy + 140], fill=(14, 40, 24, 255), outline=(120, 255, 160, 255), width=6)
    for i in range(12):
        a = i / 12 * 2 * math.pi; d.pieslice([cx - 130, cy - 130, cx + 130, cy + 130], math.degrees(a), math.degrees(a + math.pi / 12), fill=(150, 20, 40, 255) if i % 2 else (10, 20, 14, 255))
    d.ellipse([cx - 28, cy - 28, cx + 28, cy + 28], fill=(240, 220, 120, 255))
    for sx in (150, 850):  # dice
        d.rounded_rectangle([sx - 46, 300 - 46, sx + 46, 300 + 46], 10, fill=(232, 236, 220, 255)); 
        for dx, dy in [(-20, -20), (20, 20), (0, 0), (-20, 20), (20, -20)]: d.ellipse([sx + dx - 7, 300 + dy - 7, sx + dx + 7, 300 + dy + 7], fill=(20, 20, 20, 255))
    ground(im, 345, (10, 34, 22), (2, 10, 6), rng, cobble=False); d = ImageDraw.Draw(im)
    ov = Image.new('RGBA', im.size, (0, 0, 0, 0)); od = ImageDraw.Draw(ov)
    for yy in range(345, H, 40):
        for xx in range(0, W, 80):
            if ((xx // 80) + (yy // 40)) % 2 == 0: od.polygon([(xx, yy), (xx + 80, yy), (xx + 80, yy + 40), (xx, yy + 40)], fill=(120, 255, 170, 14))
    im.alpha_composite(ov)
    fog(im, 380, (40, 160, 90), 50, seed)
    im.convert('RGB').save(OUT + name + '.png')

def gate(name, seed):
    rng = random.Random(seed); im = grad([(0, (6, 8, 30)), (.5, (30, 24, 70)), (.7, (110, 60, 70)), (.71, (14, 12, 26)), (1, (6, 6, 14))])
    stars(im, 120, rng, 260); glow(im, (500, 130), 170, (170, 190, 255), 80); d = ImageDraw.Draw(im)
    d.ellipse([440, 70, 560, 190], fill=(236, 240, 255, 255))
    spiral_hill(im, 700, 330, 300); d = ImageDraw.Draw(im)
    for x in range(40, W, 140):  # graves + dead trees
        gy = 380 + rng.randint(0, 80); d.rounded_rectangle([x, gy - 40, x + 30, gy], 12, fill=(30, 26, 44, 255)); d.line([x + 15, gy - 30, x + 15, gy - 10], fill=(70, 66, 96, 255), width=3)
    for x in (120, 420, 880):
        d.line([x, 360, x + 10, 230], fill=(8, 6, 14, 255), width=14)
        for _ in range(9): a = rng.uniform(-1.3, 1.3); d.line([x + 10, 250 + rng.randint(0, 60), x + 10 + math.sin(a) * 90, 190 + rng.randint(0, 40)], fill=(8, 6, 14, 255), width=5)
    ground(im, 345, (26, 22, 40), (8, 6, 14), rng, cobble=False); fog(im, 350, (110, 90, 160), 80, seed)
    im.convert('RGB').save(OUT + name + '.png')
town('town', 3); town('square', 11, moon=(260, 130)); lair('lair', 5); gate('hill', 8)
