"""Build the unreleased Halloween Town Sora combat sheets from his existing poses.

The original frame layout is preserved so the combat and preview animators can
switch costumes without changing timing, hit effects, or frame coordinates.
"""

from pathlib import Path
from PIL import Image, ImageChops, ImageDraw


ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "assets" / "skins" / "sora-halloween"
OUT.mkdir(parents=True, exist_ok=True)

SHEETS = (
    ("idle", "uploads/soraidle.png", 3, 2),
    ("move", "uploads/335000105_standby.png", 3, 2),
    ("attack", "uploads/sorattack.png", 3, 7),
    ("cast", "uploads/soramagic.png", 3, 2),
    ("entrance", "uploads/sorawinortauntidk.png", 3, 2),
)

# Attack cells 6-18 are later combo poses. Some put the blue Keyblade grip
# above Sora's head, so automatic eye finding mistakes it for his face.
# Explicit face anchors keep the pumpkin mask on him through the whole sheet.
ATTACK_FACES = (
    (194, 72), (195, 73), (191, 72),
    (164, 83), (164, 84), (163, 79),
    (151, 70), (149, 73), (118, 77),
    (114, 77), (134, 72), (133, 71),
    (136, 75), (137, 73), (108, 75),
    (106, 77), (105, 79), (106, 77),
    (154, 61),
)


def red_pants_box(frame):
    width, height = frame.size
    points = []
    for y in range(height // 2, height):
        for x in range(width):
            r, g, b, a = frame.getpixel((x, y))
            if a > 120 and r > 105 and r > g * 1.8 and r > b * 1.6 and g < 90 and b < 110:
                points.append((x, y))
    if not points:
        return None
    return min(x for x, _ in points), min(y for _, y in points), max(x for x, _ in points), max(y for _, y in points)


def blue_eye(frame, pants):
    left, _, right, bottom = pants
    candidates = []
    for y in range(max(0, bottom - 50), max(0, bottom - 10)):
        for x in range(max(0, left - 14), min(frame.width, right + 15)):
            r, g, b, a = frame.getpixel((x, y))
            if a > 120 and b > 110 and b > r * 1.5 and b > g * 1.25 and g > 35:
                candidates.append((y, x))
    if not candidates:
        return ((left + right) // 2, max(5, bottom - 32))
    eye_y = min(y for y, _ in candidates)
    eye_xs = [x for y, x in candidates if y <= eye_y + 2]
    return (round(sum(eye_xs) / len(eye_xs)), eye_y)


def dress_frame(frame, face=None):
    pants = red_pants_box(frame)
    if pants is None:
        return frame
    eye_x, eye_y = face or blue_eye(frame, pants)
    pants_bottom = pants[3]

    # The little bat wing sits behind the original animation silhouette.
    result = Image.new("RGBA", frame.size)
    wing = ImageDraw.Draw(result)
    wing.polygon([
        (eye_x - 3, eye_y + 10), (eye_x - 11, eye_y + 4),
        (eye_x - 21, eye_y + 1), (eye_x - 17, eye_y + 10),
        (eye_x - 20, eye_y + 14), (eye_x - 13, eye_y + 11),
        (eye_x - 9, eye_y + 17),
    ], fill="#14121e", outline="#545361")

    recolored = frame.copy()
    pixels = recolored.load()
    body_left = max(0, min(eye_x - 28, pants[0] - 6))
    body_right = min(frame.width, max(eye_x + 38, pants[2] + 17))
    for y in range(max(0, eye_y + 5), min(frame.height, pants_bottom + 13)):
        for x in range(body_left, body_right):
            r, g, b, a = pixels[x, y]
            if a < 40:
                continue
            brightness = max(r, g, b)
            if r > 85 and r > g * 1.45 and r > b * 1.3 and g < 120 and b < 125:
                # The bright red trousers become the costume's black ones.
                value = max(19, min(116, int(brightness * .46)))
                pixels[x, y] = (value, value + 1, value + 6, a)
            elif y >= pants_bottom - 5 and r > 125 and g > 70 and b < 145 and r > b * 1.35:
                # Yellow shoes become dark, silver-trimmed boots.
                value = max(35, min(165, int(brightness * .62)))
                pixels[x, y] = (value, value + 1, value + 7, a)
            elif b > r * 1.3 and b > g * 1.2 and b > 65:
                # Tone the blue jacket down to charcoal.
                value = max(24, min(122, int(brightness * .58)))
                pixels[x, y] = (value, value + 2, value + 7, a)
    result.alpha_composite(recolored)

    details = ImageDraw.Draw(result)
    # Pumpkin mask is pushed to the far side of the face so his blue eye stays visible.
    mask_x, mask_y = eye_x - 9, eye_y - 5
    details.ellipse((mask_x, mask_y, mask_x + 8, mask_y + 7), fill="#db6a22", outline="#4f241a")
    details.line((mask_x + 3, mask_y + 1, mask_x + 4, mask_y + 5), fill="#f5aa44")
    details.polygon([(mask_x + 2, mask_y + 3), (mask_x + 3, mask_y + 4), (mask_x + 2, mask_y + 5)], fill="#21131a")
    details.polygon([(mask_x + 5, mask_y + 3), (mask_x + 6, mask_y + 4), (mask_x + 5, mask_y + 5)], fill="#21131a")
    details.line((mask_x + 2, mask_y + 6, mask_x + 6, mask_y + 6), fill="#21131a")
    details.line((mask_x + 4, mask_y - 1, mask_x + 5, mask_y + 1), fill="#bd5a22")
    # Jagged pale collar, the most legible part of the outfit at game scale.
    details.line((eye_x - 5, eye_y + 9, eye_x - 3, eye_y + 13, eye_x - 1, eye_y + 10), fill="#d5d5c9", width=1)
    details.line((eye_x + 2, eye_y + 9, eye_x + 4, eye_y + 13, eye_x + 6, eye_y + 10), fill="#d5d5c9", width=1)
    return result


for name, source, columns, rows in SHEETS:
    original = Image.open(ROOT / source).convert("RGBA")
    cell_w, cell_h = original.width // columns, original.height // rows
    output = original.copy()
    for index in range(columns * rows):
        x, y = index % columns * cell_w, index // columns * cell_h
        frame = original.crop((x, y, x + cell_w, y + cell_h))
        if frame.getbbox() is None:
            continue
        if red_pants_box(frame) is None:
            raise ValueError(f"Unconverted {name} frame {index}: Sora was not found")
        face = ATTACK_FACES[index] if name == "attack" else None
        dressed = dress_frame(frame, face)
        if ImageChops.difference(frame, dressed).getbbox() is None:
            raise ValueError(f"Unconverted {name} frame {index}: output is unchanged")
        output.paste(dressed, (x, y))
    output.save(OUT / f"{name}.png", optimize=True)
