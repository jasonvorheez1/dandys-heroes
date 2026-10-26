"""Hundred Acre Wood sprites: flat storybook characters, props and Eclipse's skateboard strip."""
import math
from PIL import Image, ImageDraw
OUT = '/workspace/assets/kh/wood/'
S = 4
def canvas(w, h): return Image.new('RGBA', (w * S, h * S), (0, 0, 0, 0))
def fin(im, w, h): return im.resize((w, h), Image.LANCZOS)
def E(d, cx, cy, rx, ry, fill, outline=None, w=0):
    d.ellipse([(cx - rx) * S, (cy - ry) * S, (cx + rx) * S, (cy + ry) * S], fill=fill, outline=outline, width=int(w * S))
def R(d, x0, y0, x1, y1, fill, r=6, outline=None, w=0):
    d.rounded_rectangle([x0 * S, y0 * S, x1 * S, y1 * S], radius=r * S, fill=fill, outline=outline, width=int(w * S))
def P(d, pts, fill, outline=None, w=0):
    d.polygon([(x * S, y * S) for x, y in pts], fill=fill, outline=outline)
INK = (58, 36, 22, 255)
def face(d, cx, cy, gap, r=3.2):
    for s in (-1, 1): E(d, cx + s * gap, cy, r, r * 1.15, INK)

def pooh(w=256, h=320):
    im = canvas(w, h); d = ImageDraw.Draw(im)
    Y = (240, 178, 56, 255); Y2 = (214, 148, 36, 255); RED = (214, 58, 52, 255)
    E(d, 128, 250, 52, 20, (0, 0, 0, 40))
    E(d, 96, 285, 20, 14, Y); E(d, 160, 285, 20, 14, Y)                       # feet
    E(d, 128, 205, 64, 68, Y)                                                  # belly
    R(d, 66, 168, 190, 232, RED, 20); E(d, 128, 232, 62, 12, RED)              # shirt
    E(d, 70, 196, 18, 26, Y); E(d, 186, 196, 18, 26, Y)                        # arms
    E(d, 128, 128, 60, 52, Y)                                                  # head
    E(d, 82, 84, 15, 15, Y); E(d, 174, 84, 15, 15, Y); E(d, 82, 86, 7, 7, Y2); E(d, 174, 86, 7, 7, Y2)  # ears
    E(d, 128, 148, 28, 21, (248, 214, 140, 255))                               # snout
    E(d, 128, 138, 9, 6, INK)
    face(d, 128, 118, 22, 4.5)
    d.arc([112 * S, 150 * S, 144 * S, 168 * S], 10, 170, fill=INK, width=3 * S)
    return fin(im, w, h)

def tigger(w=256, h=320):
    im = canvas(w, h); d = ImageDraw.Draw(im)
    O = (240, 138, 40, 255); K = (40, 28, 22, 255)
    E(d, 128, 252, 50, 16, (0, 0, 0, 40))
    P(d, [(170, 236), (232, 200), (236, 150), (214, 150), (206, 188), (160, 214)], O)  # tail
    E(d, 226, 148, 12, 10, K)
    E(d, 98, 288, 22, 12, O); E(d, 158, 288, 22, 12, O)
    E(d, 128, 214, 52, 72, O); E(d, 128, 224, 30, 44, (252, 226, 170, 255))
    for y in (190, 214, 238): d.line([(92 * S, y * S), (112 * S, (y + 6) * S)], fill=K, width=5 * S); d.line([(164 * S, y * S), (144 * S, (y + 6) * S)], fill=K, width=5 * S)
    E(d, 72, 210, 14, 30, O); E(d, 184, 210, 14, 30, O)
    E(d, 128, 128, 56, 50, O)
    P(d, [(86, 100), (74, 28), (112, 84)], O); P(d, [(170, 100), (182, 28), (144, 84)], O)
    P(d, [(88, 90), (82, 44), (104, 82)], (250, 190, 140, 255)); P(d, [(168, 90), (174, 44), (152, 82)], (250, 190, 140, 255))
    E(d, 128, 146, 30, 24, (252, 236, 200, 255)); E(d, 128, 132, 11, 7, K)
    for s in (-1, 1): d.line([((128 + s * 14) * S, 100 * S), ((128 + s * 30) * S, 108 * S)], fill=K, width=4 * S)
    E(d, 108, 118, 8, 9, (255, 255, 255, 255)); E(d, 148, 118, 8, 9, (255, 255, 255, 255)); E(d, 109, 119, 3.6, 4.4, K); E(d, 149, 119, 3.6, 4.4, K)
    d.arc([112 * S, 142 * S, 144 * S, 162 * S], 10, 170, fill=K, width=3 * S)
    return fin(im, w, h)

def piglet(w=256, h=320):
    im = canvas(w, h); d = ImageDraw.Draw(im)
    PK = (248, 178, 190, 255); PK2 = (232, 140, 160, 255); STR = (214, 96, 130, 255)
    E(d, 128, 262, 44, 14, (0, 0, 0, 40))
    E(d, 104, 290, 16, 11, PK); E(d, 152, 290, 16, 11, PK)
    E(d, 128, 232, 46, 52, PK); R(d, 84, 214, 172, 252, STR, 14)
    for y in (226, 240): d.line([(86 * S, y * S), (170 * S, y * S)], fill=(250, 220, 226, 255), width=3 * S)
    E(d, 80, 226, 12, 24, PK); E(d, 176, 226, 12, 24, PK)
    E(d, 128, 150, 54, 48, PK)
    P(d, [(84, 126), (60, 60), (116, 112)], PK2); P(d, [(172, 126), (196, 60), (140, 112)], PK2)
    P(d, [(86, 118), (70, 78), (108, 110)], (252, 214, 222, 255)); P(d, [(170, 118), (186, 78), (148, 110)], (252, 214, 222, 255))
    E(d, 128, 170, 20, 15, PK2); E(d, 120, 170, 3, 4.5, INK); E(d, 136, 170, 3, 4.5, INK)
    face(d, 128, 142, 24, 4.2)
    return fin(im, w, h)

def eeyore(w=256, h=320):
    im = canvas(w, h); d = ImageDraw.Draw(im)
    G = (130, 142, 158, 255); G2 = (176, 186, 198, 255)
    E(d, 128, 262, 66, 16, (0, 0, 0, 40))
    for x in (74, 108, 148, 182): R(d, x - 9, 220, x + 9, 280, G, 6)
    for x in (74, 108, 148, 182): R(d, x - 10, 272, x + 10, 286, (70, 60, 56, 255), 4)
    E(d, 128, 200, 78, 52, G)
    E(d, 128, 218, 52, 30, G2)
    # head, drooping
    E(d, 200, 138, 40, 44, G); E(d, 226, 162, 24, 22, G2); E(d, 232, 156, 6, 4, INK)
    P(d, [(184, 108), (176, 38), (206, 100)], G); P(d, [(214, 100), (240, 40), (232, 112)], G)
    E(d, 198, 130, 5, 6, INK); d.line([(184 * S, 118 * S), (208 * S, 124 * S)], fill=INK, width=3 * S)
    d.arc([212 * S, 168 * S, 238 * S, 180 * S], 190, 350, fill=INK, width=3 * S)
    # tail with bow
    d.line([(52 * S, 176 * S), (30 * S, 230 * S)], fill=G, width=8 * S); E(d, 30, 236, 8, 12, (70, 60, 56, 255))
    P(d, [(46, 176), (28, 164), (30, 190)], (236, 96, 150, 255)); P(d, [(46, 176), (66, 164), (64, 190)], (236, 96, 150, 255)); E(d, 46, 177, 5, 5, (214, 70, 126, 255))
    return fin(im, w, h)

def rabbit(w=256, h=320):
    im = canvas(w, h); d = ImageDraw.Draw(im)
    T = (214, 176, 108, 255); T2 = (240, 214, 160, 255); GR = (86, 150, 78, 255)
    E(d, 128, 262, 48, 14, (0, 0, 0, 40))
    E(d, 100, 290, 18, 11, T); E(d, 156, 290, 18, 11, T)
    E(d, 128, 232, 48, 56, T); R(d, 90, 214, 166, 262, GR, 14)
    E(d, 128, 150, 52, 46, T)
    E(d, 100, 70, 14, 56, T); E(d, 156, 70, 14, 56, T); E(d, 100, 72, 6, 40, T2); E(d, 156, 72, 6, 40, T2)
    E(d, 128, 164, 28, 20, T2); E(d, 128, 156, 7, 5, INK); face(d, 128, 138, 20, 3.6)
    E(d, 118, 176, 4, 6, (255, 255, 255, 255)); E(d, 138, 176, 4, 6, (255, 255, 255, 255))
    return fin(im, w, h)

def pot(gold=False, w=128, h=128):
    im = canvas(w, h); d = ImageDraw.Draw(im)
    B = (255, 214, 64, 255) if gold else (176, 108, 54, 255); B2 = (255, 240, 150, 255) if gold else (206, 140, 78, 255)
    E(d, 64, 108, 38, 10, (0, 0, 0, 50))
    E(d, 64, 78, 44, 40, B); R(d, 28, 38, 100, 52, B2, 6)
    P(d, [(36, 40), (92, 40), (88, 28), (40, 28)], (250, 244, 224, 255))
    E(d, 64, 82, 26, 18, (252, 236, 190, 255)); d.text((42 * S, 74 * S), "HUNNY", fill=(120, 72, 28, 255))
    for x, hh in ((46, 22), (66, 30), (84, 18)): R(d, x - 5, 36, x + 5, 36 + hh, (255, 190, 40, 255), 5)
    if gold:
        for ang in range(0, 360, 45):
            x = 64 + math.cos(math.radians(ang)) * 56; y = 70 + math.sin(math.radians(ang)) * 56
            E(d, x, y, 3, 3, (255, 250, 200, 255))
    return fin(im, w, h)

def bee(w=96, h=96):
    im = canvas(w, h); d = ImageDraw.Draw(im)
    E(d, 34, 30, 18, 12, (200, 235, 255, 200)); E(d, 62, 30, 18, 12, (200, 235, 255, 200))
    E(d, 48, 52, 24, 18, (250, 200, 40, 255))
    for x in (40, 52, 62): R(d, x - 3, 36, x + 3, 68, INK, 2)
    E(d, 76, 54, 6, 6, INK); P(d, [(24, 52), (8, 54), (24, 58)], INK)
    E(d, 74, 51, 2, 2, (255, 255, 255, 255))
    return fin(im, w, h)

def carrot(w=96, h=128):
    im = canvas(w, h); d = ImageDraw.Draw(im)
    P(d, [(26, 40), (70, 40), (48, 120)], (240, 128, 36, 255))
    for y in (58, 76, 94): d.line([(34 * S, y * S), (52 * S, (y + 4) * S)], fill=(200, 96, 24, 255), width=3 * S)
    for ang, ln in ((-30, 28), (0, 34), (30, 28)):
        x = 48 + math.sin(math.radians(ang)) * ln; y = 40 - math.cos(math.radians(ang)) * ln
        d.line([(48 * S, 42 * S), (x * S, y * S)], fill=(80, 168, 70, 255), width=7 * S)
    return fin(im, w, h)

def tail(w=96, h=128):
    im = canvas(w, h); d = ImageDraw.Draw(im)
    d.line([(48 * S, 10 * S), (48 * S, 92 * S)], fill=(130, 142, 158, 255), width=9 * S)
    E(d, 48, 100, 10, 18, (70, 60, 56, 255))
    P(d, [(48, 18), (22, 6), (24, 34)], (236, 96, 150, 255)); P(d, [(48, 18), (74, 6), (72, 34)], (236, 96, 150, 255)); E(d, 48, 19, 6, 6, (214, 70, 126, 255))
    return fin(im, w, h)

def skate_strip():
    cell = 192; im = Image.new('RGBA', (cell * 6, cell), (0, 0, 0, 0))
    src = Image.open('/workspace/assets/kh/vn/eclipse.webp').convert('RGBA')
    src = src.crop(src.getbbox())
    def figure(h):
        w = round(src.width * h / src.height); return src.resize((w, h), Image.LANCZOS)
    def board(w=104, hflip=False):
        b = canvas(w + 12, 40); d = ImageDraw.Draw(b)
        thick = 4 if hflip else 11
        R(d, 6, 14, w + 6, 14 + thick, (222, 70, 84, 255), 5, outline=(60, 20, 30, 255), w=2)
        if not hflip:
            E(d, 30, 29, 8, 8, (240, 240, 230, 255), (40, 40, 40, 255), 2); E(d, w - 18 + 6, 29, 8, 8, (240, 240, 230, 255), (40, 40, 40, 255), 2)
            E(d, w // 2 + 6, 19, 5, 5, (255, 236, 160, 255))
        return fin(b, w + 12, 40)
    def frame(i, fig_h, fig_rot, board_rot, hflip=False, off=(0, 0), crash=False):
        f = Image.new('RGBA', (cell, cell), (0, 0, 0, 0))
        bd = board(hflip=hflip)
        if board_rot: bd = bd.rotate(board_rot, resample=Image.BICUBIC, expand=True)
        fg = figure(fig_h)
        if fig_rot: fg = fg.rotate(fig_rot, resample=Image.BICUBIC, expand=True)
        bx = cell // 2 - bd.width // 2 + off[0]; by = 164 - bd.height // 2 + off[1]
        fx = cell // 2 - fg.width // 2 + (30 if crash else 0); fy = by - fg.height + 24 + (20 if crash else 0)
        f.alpha_composite(bd, (bx, by)); f.alpha_composite(fg, (fx, max(0, fy)))
        im.alpha_composite(f, (i * cell, 0))
    frame(0, 150, 0, 0)
    frame(1, 134, 4, 0)
    frame(2, 146, -8, -16, off=(0, -8))
    frame(3, 144, 0, 0, hflip=True, off=(0, -6))
    frame(4, 130, 74, 24, crash=True, off=(-20, 4))
    frame(5, 144, 8, 0, off=(0, -4))
    return im

if __name__ == '__main__':
    for name, im in [('pooh', pooh()), ('tigger', tigger()), ('piglet', piglet()), ('eeyore', eeyore()), ('rabbit', rabbit()),
                     ('pot', pot()), ('pot-gold', pot(True)), ('bee', bee()), ('carrot', carrot()), ('tail', tail())]:
        im.save(OUT + name + '.png', optimize=True)
    skate_strip().save(OUT + 'eclipse-skate.png', optimize=True)
    print('wood art done')
