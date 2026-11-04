"""Assemble native battle sheets and portraits for Deltarune characters.

Ensures:
- Consistent scale across all frames (no sudden shrinking/enlarging)
- Stable groundY and anchor positioning (no jumping or jittering)
- Proper facing for all poses (Kris act & guard flipped so all rows face right)
- Tasque Manager icon faces right, matching portrait
- Dedicated crisp 136x136 icons for Kris, Ralsei, Tasque Manager, and Flowery
- Clean 280x320 portrait cards for all four characters
"""
from __future__ import annotations

import io
import json
import struct
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parents[2]
ART = ROOT / "assets/deltarune"
PACK = ROOT / "assets/flowery/flowery.bin"


def read_pack():
    with PACK.open("rb") as handle:
        assert handle.read(8) == b"DHFLWR01"
        header_size = struct.unpack("<I", handle.read(4))[0]
        header = json.loads(handle.read(header_size))
        base = 12 + header_size
        sheets = {}
        for index in {frame[0] for key, frame in header["frames"].items() if key.startswith("ralsei_")}:
            entry = next(f for f in header["files"] if f["name"] == f"atlas-{index}.png")
            handle.seek(base + entry["off"])
            sheets[index] = Image.open(io.BytesIO(handle.read(entry["len"]))).convert("RGBA")
        return header["frames"], sheets


FRAMES, SHEETS = read_pack()


# ----------------------------------------------------------------------
# 1. KRIS BATTLE SHEET & PORTRAITS
# ----------------------------------------------------------------------

def load_kris_pose(name, flip=False):
    im = Image.open(ART / f"kris-{name}.png").convert("RGBA")
    crop = im.crop(im.getbbox())
    if flip:
        crop = crop.transpose(Image.Transpose.FLIP_LEFT_RIGHT)
    return crop


# Load and orient Kris poses
k_idle = load_kris_pose("idle")
k_attack = load_kris_pose("attack")
k_act = load_kris_pose("act", flip=True)      # flip to face right!
k_guard = load_kris_pose("guard", flip=True)  # flip to face right!

KRIS_SCALE = 1.75 / 8.0  # source images are 8x upscaled
KRIS_CELL = 96
KRIS_GROUND = 92


def make_kris_cell(im, *, x_off=0, y_off=0):
    sw = round(im.width * KRIS_SCALE)
    sh = round(im.height * KRIS_SCALE)
    scaled = im.resize((sw, sh), Image.Resampling.NEAREST)
    cell = Image.new("RGBA", (KRIS_CELL, KRIS_CELL))
    # Place feet at KRIS_GROUND, body centered at x = 46
    px = (KRIS_CELL - sw) // 2 + x_off
    py = KRIS_GROUND - sh + y_off
    cell.alpha_composite(scaled, (px, py))
    return cell


def build_kris_battle_sheet():
    cols = 8
    rows = 10
    sheet = Image.new("RGBA", (KRIS_CELL * cols, KRIS_CELL * rows))

    k = make_kris_cell
    row_defs = [
        # Row 0: idle (4 frames)
        [k(k_idle, y_off=n) for n in (0, -1, -2, -1)],
        # Row 1: move (6 frames)
        [k(k_idle, x_off=x, y_off=y) for x, y in ((0, 0), (2, -2), (3, -1), (0, 0), (-2, -2), (-3, -1))],
        # Row 2: attack (6 frames)
        [k(im, x_off=x, y_off=y) for im, x, y in ((k_idle, -2, 0), (k_guard, -1, 0), (k_attack, 2, -2), (k_attack, 5, -2), (k_attack, 2, 0), (k_idle, 0, 0))],
        # Row 3: cast (5 frames)
        [k(im, x_off=x, y_off=y) for im, x, y in ((k_idle, 0, 0), (k_act, 0, -1), (k_act, 2, -2), (k_act, 2, -1), (k_idle, 0, 0))],
        # Row 4: guard (5 frames)
        [k(im, x_off=x, y_off=y) for im, x, y in ((k_idle, 0, 0), (k_guard, -1, -1), (k_guard, 0, -2), (k_guard, 0, -1), (k_guard, 0, 0))],
        # Row 5: hurt (3 frames)
        [k(im, x_off=x, y_off=y) for im, x, y in ((k_idle, -4, 0), (k_guard, -3, -1), (k_idle, -1, 0))],
        # Row 6: act (6 frames)
        [k(im, x_off=x, y_off=y) for im, x, y in ((k_idle, 0, 0), (k_act, 0, -1), (k_act, 2, -2), (k_act, 3, -3), (k_act, 2, -2), (k_idle, 0, 0))],
        # Row 7: xslash (7 frames)
        [k(im, x_off=x, y_off=y) for im, x, y in ((k_idle, -3, 0), (k_attack, 1, -2), (k_attack, 5, -3), (k_guard, 2, 0), (k_attack, 0, -2), (k_attack, 6, -3), (k_idle, 0, 0))],
        # Row 8: courage (5 frames)
        [k(im, x_off=x, y_off=y) for im, x, y in ((k_idle, 0, 0), (k_act, 1, -2), (k_act, 2, -4), (k_idle, 1, -2), (k_idle, 0, 0))],
    ]

    for r_idx, r_frames in enumerate(row_defs):
        for c_idx, cell in enumerate(r_frames[:cols]):
            sheet.alpha_composite(cell, (c_idx * KRIS_CELL, r_idx * KRIS_CELL))

    sheet.save(ART / "kris-battle.png", optimize=True)
    print("Saved kris-battle.png")


# ----------------------------------------------------------------------
# 2. RALSEI BATTLE SHEET
# ----------------------------------------------------------------------

RALSEI_SCALE = 1.75
RALSEI_CELL_W = 144
RALSEI_CELL_H = 96
RALSEI_ANCHOR_X = 42
RALSEI_GROUND_Y = 92


def make_ralsei_cell(name):
    fr = FRAMES[name]
    sheet_im = SHEETS[fr[0]]
    crop = sheet_im.crop((fr[1], fr[2], fr[1] + fr[3], fr[2] + fr[4]))

    sw = max(1, round(fr[3] * RALSEI_SCALE))
    sh = max(1, round(fr[4] * RALSEI_SCALE))
    scaled = crop.resize((sw, sh), Image.Resampling.NEAREST)

    # In 1x coords, Ralsei body anchor is at x=15, ground is at y=46
    # Relative offset:
    rel_x = fr[5] - 15
    rel_y = fr[6] - 46

    # Target position in cell:
    px = RALSEI_ANCHOR_X + round(rel_x * RALSEI_SCALE)
    py = RALSEI_GROUND_Y + round(rel_y * RALSEI_SCALE)

    cell = Image.new("RGBA", (RALSEI_CELL_W, RALSEI_CELL_H))
    cell.alpha_composite(scaled, (px, py))
    return cell


def ralsei_sequence(group, indices):
    return [make_ralsei_cell(f"ralsei_{group}_{i}") for i in indices]


def build_ralsei_battle_sheet():
    cols = 8
    rows = 10
    sheet = Image.new("RGBA", (RALSEI_CELL_W * cols, RALSEI_CELL_H * rows))

    row_defs = [
        # Row 0: idle (5 frames)
        ralsei_sequence("idle", range(5)),
        # Row 1: walk_right (4 frames)
        ralsei_sequence("walk_right", range(4)),
        # Row 2: attack (7 frames)
        ralsei_sequence("attack", range(7)),
        # Row 3: spell (8 frames)
        ralsei_sequence("spell", range(8)),
        # Row 4: defend (8 frames)
        ralsei_sequence("defend", range(8)),
        # Row 5: hurt (1 frame)
        ralsei_sequence("hurt_fixed", [0]),
        # Row 6: spellready (4) + spell (4)
        ralsei_sequence("spellready", range(4)) + ralsei_sequence("spell", range(4)),
        # Row 7: act (8 frames)
        ralsei_sequence("act", range(8)),
        # Row 8: battleintro (8 frames)
        ralsei_sequence("battleintro", range(8)),
        # Row 9: victory (8 frames)
        ralsei_sequence("victory", range(8)),
    ]

    for r_idx, r_frames in enumerate(row_defs):
        for c_idx, cell in enumerate(r_frames[:cols]):
            sheet.alpha_composite(cell, (c_idx * RALSEI_CELL_W, r_idx * RALSEI_CELL_H))

    sheet.save(ART / "ralsei-battle.png", optimize=True)
    print("Saved ralsei-battle.png")


# ----------------------------------------------------------------------
# 3. ICONS AND PORTRAITS FOR ALL FOUR CHARACTERS
# ----------------------------------------------------------------------

def build_portraits_and_icons():
    # --- KRIS ---
    kris_raw = Image.open(ART / "kris-idle.png").convert("RGBA")
    # Head icon (136x136)
    kris_head = kris_raw.crop((30, 8, 220, 198)).resize((136, 136), Image.Resampling.NEAREST)
    kris_head.save(ART / "kris-icon.png", optimize=True)

    # Portrait card (280x320)
    kris_tight = kris_raw.crop(kris_raw.getbbox())
    scale = min(280 / kris_tight.height, 240 / kris_tight.width)
    kw, kh = round(kris_tight.width * scale), round(kris_tight.height * scale)
    kris_resized = kris_tight.resize((kw, kh), Image.Resampling.NEAREST)
    kris_card = Image.new("RGBA", (280, 320))
    kris_card.alpha_composite(kris_resized, ((280 - kw) // 2, (320 - kh) // 2))
    kris_card.save(ART / "kris-portrait.png", optimize=True)
    print("Saved kris-icon.png and kris-portrait.png")

    # --- RALSEI ---
    ralsei_raw = Image.open(ART / "ralsei-idle.png").convert("RGBA")
    # Head icon (136x136)
    ralsei_head = ralsei_raw.crop((80, 54, 226, 200)).resize((136, 136), Image.Resampling.NEAREST)
    ralsei_head.save(ART / "ralsei-icon.png", optimize=True)

    # Portrait card (280x320)
    ralsei_tight = ralsei_raw.crop(ralsei_raw.getbbox())
    scale = min(280 / ralsei_tight.height, 240 / ralsei_tight.width)
    rw, rh = round(ralsei_tight.width * scale), round(ralsei_tight.height * scale)
    ralsei_resized = ralsei_tight.resize((rw, rh), Image.Resampling.NEAREST)
    ralsei_card = Image.new("RGBA", (280, 320))
    ralsei_card.alpha_composite(ralsei_resized, ((280 - rw) // 2, (320 - rh) // 2))
    ralsei_card.save(ART / "ralsei-portrait.png", optimize=True)
    print("Saved ralsei-icon.png and ralsei-portrait.png")

    # --- TASQUE MANAGER ---
    tm_portrait = Image.open(ART / "tasque-manager-portrait.png").convert("RGBA")
    # Crop head directly from portrait so it faces RIGHT and matches portrait framing!
    tm_head = tm_portrait.crop((24, 18, 178, 172)).resize((136, 136), Image.Resampling.NEAREST)
    tm_head.save(ART / "tasque-manager-icon.png", optimize=True)
    print("Saved tasque-manager-icon.png (facing right)")

    # --- FLOWERY ---
    fl_raw = Image.open(ART / "flowery-idle.png").convert("RGBA")
    # Head icon (136x136)
    fl_tight = fl_raw.crop(fl_raw.getbbox())
    fl_head = fl_raw.crop((35, 10, 175, 150)).resize((136, 136), Image.Resampling.NEAREST)
    fl_head.save(ART / "flowery-icon.png", optimize=True)

    # Portrait card (280x320)
    scale = min(280 / fl_tight.height, 240 / fl_tight.width)
    fw, fh = round(fl_tight.width * scale), round(fl_tight.height * scale)
    fl_resized = fl_tight.resize((fw, fh), Image.Resampling.NEAREST)
    fl_card = Image.new("RGBA", (280, 320))
    fl_card.alpha_composite(fl_resized, ((280 - fw) // 2, (320 - fh) // 2))
    fl_card.save(ART / "flowery-portrait.png", optimize=True)
    print("Saved flowery-icon.png and flowery-portrait.png")


def main():
    build_kris_battle_sheet()
    build_ralsei_battle_sheet()
    build_portraits_and_icons()
    print("All Deltarune art generated successfully!")


if __name__ == "__main__":
    main()
