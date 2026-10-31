"""Extract the item and hero icons once, instead of cutting them on every boot."""
import json
import re
from pathlib import Path

from PIL import Image


root = Path(__file__).resolve().parents[1]
source = (root / 'js/item-sheet.js').read_text(encoding='utf-8')
sprites = json.loads(re.search(r'const MAP = (\{.*?\});', source).group(1))
images = {}

for key, (sheet, x, y, width, height) in sprites.items():
    if sheet not in images:
        images[sheet] = Image.open(root / sheet)
    category, name = key.split('/', 1)
    output = root / category / 'sprites' / f'{name}.png'
    output.parent.mkdir(parents=True, exist_ok=True)
    images[sheet].crop((x, y, x + width, y + height)).save(output)

print(f'Extracted {len(sprites)} sprites')
