"""Extract local Tasque Manager and Tasque art from the Deltarune Wiki GIFs.

Sources: https://deltarune.wiki/w/Tasque_Manager and https://deltarune.wiki/w/Tasque
The site uses the resulting small PNGs, so battle art does not depend on the wiki at runtime.
"""
from pathlib import Path
from PIL import Image, ImageDraw, ImageChops

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / 'assets/deltarune'
HERE = Path(__file__).parent

manager = Image.open(HERE / 'manager-idle.gif')
frames = [0, 9, 18, 27, 36, 45, 54, 63]
sheet = Image.new('RGBA', (160 * len(frames), 160))
for i, index in enumerate(frames):
    manager.seek(index)
    pose = manager.convert('RGBA')
    sheet.alpha_composite(pose, (i * 160 + 10, 9))
sheet.save(OUT / 'tasque-manager-battle.png', optimize=True)

manager.seek(0)
portrait = manager.convert('RGBA').crop((14, 0, 139, 141))
portrait = portrait.resize((250, 282), Image.Resampling.NEAREST)
portrait = portrait.transpose(Image.Transpose.FLIP_LEFT_RIGHT)
card = Image.new('RGBA', (280, 320))
card.alpha_composite(portrait, (15, 20))
card.save(OUT / 'tasque-manager-portrait.png', optimize=True)

# Each part keeps its original 139 × 141 coordinates. The masks partition
# every opaque pixel exactly once, so the rig's neutral pose recreates the
# source sprite without seams or a second copy of a moving limb beneath it.
manager.seek(0)
pose = manager.convert('RGBA')
remaining = Image.new('L', pose.size, 255)
parts = {
    'head': [(71, 0), (139, 0), (139, 48), (108, 53), (91, 46), (70, 45)],
    'arm': [(49, 37), (95, 36), (100, 72), (73, 84), (47, 74)],
    'whip': [(0, 0), (56, 0), (56, 141), (0, 141)],
    'feet': [(76, 115), (113, 115), (113, 141), (76, 141)],
}
for name, polygon in parts.items():
    mask = Image.new('L', pose.size)
    ImageDraw.Draw(mask).polygon(polygon, fill=255)
    mask = ImageChops.multiply(mask, remaining)
    layer = pose.copy()
    layer.putalpha(ImageChops.multiply(pose.getchannel('A'), mask))
    layer.save(OUT / f'tasque-manager-rig-{name}.png', optimize=True)
    remaining = ImageChops.subtract(remaining, mask)
body = pose.copy()
body.putalpha(ImageChops.multiply(pose.getchannel('A'), remaining))
body.save(OUT / 'tasque-manager-rig-body.png', optimize=True)

manager.seek(0)
head = manager.convert('RGBA').crop((70, 3, 138, 71))
head.resize((136, 136), Image.Resampling.NEAREST).save(OUT / 'tasque-manager-icon.png', optimize=True)

cat = Image.open(HERE / 'tasque-idle.gif')
cat.seek(0)
cat.convert('RGBA').save(OUT / 'tasque-companion.png', optimize=True)
