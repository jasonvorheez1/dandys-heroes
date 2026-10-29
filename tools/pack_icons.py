"""Pack icons/*.png (Hero icons of mixed sizes) into icons/sheet.png, shelf by shelf.

Run from the project root: python3 tools/pack_icons.py
Prints the name -> [sheet, x, y, w, h] entries to merge into MAP in js/item-sheet.js.
"""
import glob, json, os
from PIL import Image

WIDTH = 2048
imgs = sorted(((os.path.basename(f)[:-4], Image.open(f).convert('RGBA')) for f in glob.glob('icons/*.png')
               if os.path.basename(f) != 'sheet.png'), key=lambda t: -t[1].height)
x = y = shelf = 0
placed = {}
for name, im in imgs:
    if x + im.width > WIDTH:
        x, y, shelf = 0, y + shelf, 0
    placed[name] = (x, y)
    x += im.width
    shelf = max(shelf, im.height)
sheet = Image.new('RGBA', (WIDTH, y + shelf))
manifest = {}
for name, im in imgs:
    sheet.paste(im, placed[name])
    manifest['icons/' + name] = ['icons/sheet.png', *placed[name], im.width, im.height]
sheet.save('icons/sheet.png', optimize=True)
print(sheet.size, len(imgs), os.path.getsize('icons/sheet.png'))
print(json.dumps(manifest, separators=(',', ':'), sort_keys=True))
