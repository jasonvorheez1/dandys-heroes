import json
import struct
from PIL import Image
import io

with open('dandys heroes/assets/flowery/flowery.bin', 'rb') as f:
    f.seek(8)
    hsize = struct.unpack('<I', f.read(4))[0]
    header = json.loads(f.read(hsize))
    base = 12 + hsize
    files = {entry['name']: entry for entry in header['files']}

    def payload(name):
        entry = files[name]
        f.seek(base + entry['off'])
        return f.read(entry['len'])

    sheets = {
        i: Image.open(io.BytesIO(payload(f'atlas-{i}.png'))).convert('RGBA')
        for i in range(5)
    }

def frame(name, flip=False):
    sheet, x, y, w, h, ox, oy, full_w, full_h = header['frames'][name]
    canvas = Image.new('RGBA', (full_w, full_h))
    canvas.alpha_composite(sheets[sheet].crop((x, y, x + w, y + h)), (ox, oy))
    bbox = canvas.getbbox()
    if bbox:
        canvas = canvas.crop(bbox)
    if flip:
        canvas = canvas.transpose(Image.Transpose.FLIP_LEFT_RIGHT)
    return canvas

battle_path = 'dandys heroes/assets/deltarune/flowery-battle.png'
old_sheet = Image.open(battle_path).convert('RGBA')

# Create 10-row sheet (768 x 960)
new_sheet = Image.new('RGBA', (768, 960), (0, 0, 0, 0))
# Copy only rows 0-3 (normal Flowery idle, move, attack, cast)
new_sheet.paste(old_sheet.crop((0, 0, 768, 96 * 4)), (0, 0))

def place(canvas, image, x, y, scale=1.0):
    if scale != 1.0:
        image = image.resize((round(image.width * scale), round(image.height * scale)), Image.Resampling.NEAREST)
    px = round(x - image.width / 2)
    py = round(y - image.height)
    canvas.alpha_composite(image, (px, py))

def put_row(row_idx, specs):
    for col_idx, (fname, flip, cx, cy, scale) in enumerate(specs):
        cell = Image.new('RGBA', (96, 96))
        im = frame(fname, flip=flip)
        place(cell, im, cx, cy, scale=scale)
        new_sheet.paste(cell, (96 * col_idx, 96 * row_idx))

# Row 4: Guard / Brace (normal Flowery facing right)
put_row(4, [
    ('flowery_fists_0', True, 48, 92, 1.1),
    ('flowery_idle2_0', True, 48, 92, 1.1),
    ('flowery_idle2_1', True, 48, 92, 1.1),
])

# Row 5: Hurt / Recoil (normal Flowery facing right)
put_row(5, [
    ('flowery_hurt_0', True, 48, 92, 1.1),
    ('flowery_deflected_0', True, 48, 92, 1.1),
    ('flowery_hurt_0', True, 46, 92, 1.1),
])

# Row 6: Recruit / Cheer ("My RECRUITs!" - normal Flowery gesturing & clapping, facing right)
put_row(6, [
    ('flowery_gestureup_right_0', False, 48, 92, 1.1),
    ('flowery_pose_point_cooler_right_0', False, 48, 92, 1.1),
    ('flowery_clap_0', False, 48, 92, 1.1),
    ('flowery_clap_1', False, 48, 92, 1.1),
])

# Row 7: Powerup / Victory (normal Flowery powering up & grinning, facing right)
put_row(7, [
    ('flowery_poweringup_0', True, 48, 92, 1.1),
    ('flowery_poweringup_1', True, 48, 92, 1.1),
    ('flowery_poweringup_2', True, 48, 92, 1.1),
    ('flowery_teethshine_0', False, 48, 92, 1.1),
])

# Row 8: JARONA Windup (5 frames: flowery_punch_windup_0..4 flipped to face right)
put_row(8, [
    (f'flowery_punch_windup_{i}', True, 48, 92, 1.1)
    for i in range(5)
])

# Row 9: JARONA Punch & Combo (all facing right, proper scale)
put_row(9, [
    ('flowery_puuunch_0', False, 48, 88, 1.12),
    ('flowery_puuunch_0', False, 52, 86, 1.15),
    ('flowery_punch_up_chase_0', False, 48, 88, 1.1),
    ('flowery_punch_up_chase_0', False, 48, 80, 1.12),
    ('flowery_kick_crescent_0', False, 48, 88, 1.0),
])

new_sheet.save(battle_path, optimize=True)
print('Successfully generated clean 10-row flowery-battle.png! Size:', new_sheet.size)
