"""Pack the small root sprites in item/ into two sheets plus a manifest.

Run from the project root: python3 tools/pack_items.py
Writes item/sheet-16.png and item/sheet-100.png. The name -> rect manifest is the MAP in js/item-sheet.js; the printed manifest below is for pasting there.
"""
import glob, json, math, os
from PIL import Image

SIZES = (16, 100)
manifest = {}
for size in SIZES:
    files = sorted(f for f in glob.glob('item/*.png')
                   if not os.path.basename(f).startswith('sheet-') and Image.open(f).size == (size, size))
    cols = math.ceil(math.sqrt(len(files)))
    rows = math.ceil(len(files) / cols)
    sheet = Image.new('RGBA', (cols * size, rows * size))
    for i, f in enumerate(files):
        x, y = (i % cols) * size, (i // cols) * size
        sheet.paste(Image.open(f).convert('RGBA'), (x, y))
        manifest[os.path.basename(f)[:-4]] = [f'sheet-{size}.png', x, y, size]
    sheet.save(f'item/sheet-{size}.png', optimize=True)
    print(size, len(files), sheet.size)

print(json.dumps(manifest, separators=(',', ':'), sort_keys=True))
