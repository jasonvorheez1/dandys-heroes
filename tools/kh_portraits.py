"""Cut portrait PNGs (first idle frame, trimmed, padded square) for the KH cast."""
import json
from PIL import Image
M = json.load(open('/workspace/tools/kh-src/kh_meta.json'))
U = '/workspace/assets/kh/units/'; OUT = '/workspace/assets/kh/art/'
SRC = {'sora': 'sora-idle', 'riku': 'riku-idle', 'kairi': 'kairi-idle', 'goofy': 'goofy-idle', 'donald': 'donald-idle', 'jack': 'jack-idle',
       'oogie': 'oogie-idle', 'lsb': 'lsb-idle', 'shadow': 'heartless-shadow-idle', 'gigas': 'heartless-gigas-idle', 'soldier': 'heartless-soldier-idle',
       'stealth': 'heartless-stealth-idle', 'largebody': 'heartless-largebody-idle', 'nocturne': 'heartless-nocturne-idle'}
for name, key in SRC.items():
    m = M[key]; im = Image.open(U + key + '.png').convert('RGBA').crop((0, 0, m['cellW'], m['cellH']))
    bb = im.getbbox(); im = im.crop(bb)
    side = int(max(im.size) * 1.12); k = max(1, int(256 / side)) if side < 200 else 1
    can = Image.new('RGBA', (side, side), (0, 0, 0, 0)); can.alpha_composite(im, ((side - im.width) // 2, side - im.height - int(side * .04)))
    if k > 1: can = can.resize((side * k, side * k), Image.NEAREST)
    can.save(OUT + name + '.png'); print(name, can.size)
