"""Build the small, self-contained Flowery combat assets from flowery.bin."""
from io import BytesIO
from pathlib import Path
import json
import struct

from PIL import Image


ROOT = Path(__file__).resolve().parents[2]
data = (ROOT / 'assets/flowery/flowery.bin').read_bytes()
header_len = struct.unpack_from('<I', data, 8)[0]
header = json.loads(data[12:12 + header_len])
base = 12 + header_len
files = {entry['name']: entry for entry in header['files']}
out = ROOT / 'assets/deltarune'
voice_out = out / 'flowery-voice'
voice_out.mkdir(exist_ok=True)


def payload(name):
    entry = files[name]
    return data[base + entry['off']:base + entry['off'] + entry['len']]


voices = (
    'hah', 'hoo', 'my_jarona', 'jarona1', 'jarona2', 'jarona3', 'jarona4',
    'last_jarona', 'leaf_it', 'hey_guys', 'just_kidding', 'omega',
)
for key in voices:
    (voice_out / f'{key}.ogg').write_bytes(payload(f'voice/{key}.ogg'))

sheets = {
    i: Image.open(BytesIO(payload(f'atlas-{i}.png'))).convert('RGBA')
    for i in range(5)
}


def frame(name):
    sheet, x, y, w, h, ox, oy, full_w, full_h = header['frames'][name]
    canvas = Image.new('RGBA', (full_w, full_h))
    canvas.alpha_composite(sheets[sheet].crop((x, y, x + w, y + h)), (ox, oy))
    return canvas


for name, source in (
    ('flowery-thorns.png', 'rising_thorns_a_3'),
    ('flowery-petal.png', 'spin_petal_0'),
    ('flowery-bullet.png', 'flowery_bullet_0'),
):
    frame(source).save(out / name)


def colorize(image, color, opacity=1):
    result = Image.new('RGBA', image.size, color)
    alpha = image.getchannel('A')
    if opacity != 1:
        alpha = alpha.point(lambda a: round(a * opacity))
    result.putalpha(alpha)
    return result


colorize(frame('bamboo_wall_0'), '#78d863').save(out / 'flowery-bamboo.png')


FLOWERS = (
    ('green', '#5cff6a', -16, -2),
    ('aqua', '#4ff4ff', -10, 4),
    ('seth', '#b07bff', 10, -8),
    ('yellow', '#ffd23a', 6, -14),
    ('blue', '#7f9bff', 16, -2),
    ('orange', '#ff8a4a', -2, 8),
)


def place(canvas, image, x, y, scale=1):
    if scale != 1:
        image = image.resize((round(image.width * scale), round(image.height * scale)), Image.Resampling.NEAREST)
    px = round(x - image.width / 2)
    py = round(y - image.height)
    canvas.alpha_composite(image, (px, py))


# The playable hero uses the ordinary idle, not the caped finale stance.
# Trim each frame's transparent padding before anchoring it at the feet;
# otherwise the five frames appear to hop above the battle floor.
battle_path = out / 'flowery-battle.png'
battle_sheet = Image.open(battle_path).convert('RGBA')
for index in range(5):
    cell = Image.new('RGBA', (96, 96))
    idle = frame(f'flowery_idle2_{index}')
    idle = idle.crop(idle.getbbox())
    place(cell, idle, 48, 96)
    battle_sheet.paste(cell, (96 * index, 0))
battle_sheet.save(battle_path, optimize=True)

# Use the same relaxed pose for roster cards and the event shop. The old
# "idle" asset was a lunging attack frame.
portrait = Image.new('RGBA', (205, 330))
idle = frame('flowery_idle2_0')
idle = idle.crop(idle.getbbox())
place(portrait, idle, 102, 315, 5)
portrait.save(out / 'flowery-idle.png', optimize=True)


poses = ('idle', 'jarona', 'powerup', 'punch')
omega_sheet = Image.new('RGBA', (160 * 3, 160 * len(poses)))
for row, pose in enumerate(poses):
    for index in range(3):
        cell = Image.new('RGBA', (160, 160))
        for flower, color, dx, dy in FLOWERS:
            body = frame(f'omegaf_{flower}_{index}')
            outline = frame(f'omegaf_{flower}_o_{index}')
            x, y = 80 + dx * 1.5, 132 + dy * 1.5
            place(cell, colorize(outline, color, .8), x, y + 2, 1.15)
            place(cell, colorize(body, '#f6f3e9', .9), x, y, 1.1)
        main = frame(f'omegaflowery_{pose}_{index}')
        place(cell, colorize(main, '#f6d665', .8), 81, 133, 1.22)
        place(cell, main, 80, 132, 1.13)
        omega_sheet.alpha_composite(cell, (160 * index, 160 * row))
omega_sheet.save(out / 'flowery-omega-battle.png', optimize=True)
omega_sheet.crop((0, 0, 160, 160)).save(out / 'flowery-omega-card.png', optimize=True)
print('Extracted Flowery combat art and', len(voices), 'voice clips.')
