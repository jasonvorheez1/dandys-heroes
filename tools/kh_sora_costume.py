"""Dress the fixed Sora strips in the Halloween Town costume (reuses dress_frame)."""
import json
from PIL import Image
src = open('/workspace/tools/create_sora_halloween.py').read()
src = src[:src.index('for name, source, columns, rows in SHEETS:')].replace('ROOT / "assets"', '__import__("pathlib").Path("/tmp")')
ns = {'__file__': '/workspace/tools/create_sora_halloween.py'}
exec(compile(src, 'dress', 'exec'), ns)
M = json.load(open('/workspace/tools/kh-src/kh_meta.json'))
for clip in ['idle', 'move', 'attack', 'cast']:
    m = M['sora-' + clip]; im = Image.open('/workspace/assets/kh/units/sora-%s.png' % clip).convert('RGBA'); out = im.copy()
    for i in range(m['n']):
        fr = im.crop((i * m['cellW'], 0, (i + 1) * m['cellW'], m['cellH']))
        if fr.getbbox() is None: continue
        if ns['red_pants_box'](fr) is None: print('no pants', clip, i); continue
        out.paste(ns['dress_frame'](fr), (i * m['cellW'], 0))
    out.save('/workspace/assets/kh/units/sora-h-%s.png' % clip); print(clip, 'ok')
