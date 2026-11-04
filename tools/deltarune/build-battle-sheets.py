"""Assemble native battle sheets from the project's existing Deltarune art."""
from __future__ import annotations

import io
import json
import struct
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[2]
ART = ROOT / "assets/deltarune"
PACK = ROOT / "assets/flowery/flowery.bin"
CELL = 96
COLS = 8
ROWS = 10


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


def pose(name):
    image = Image.open(ART / f"{name}.png").convert("RGBA")
    return image.crop(image.getbbox())


def pack_frame(name):
    frame = FRAMES[name]
    image = SHEETS[frame[0]]
    return image.crop((frame[1], frame[2], frame[1] + frame[3], frame[2] + frame[4]))


def make_cell(image, *, pixels=None, x=0, y=0, flip=False):
    image = image.copy()
    if flip:
        image = image.transpose(Image.Transpose.FLIP_LEFT_RIGHT)
    if pixels:
        scale = min(pixels / image.height, 90 / image.width)
        image = image.resize((max(1, round(image.width * scale)), max(1, round(image.height * scale))), Image.Resampling.NEAREST)
    cell = Image.new("RGBA", (CELL, CELL))
    cell.alpha_composite(image, ((CELL - image.width) // 2 + x, CELL - image.height - 2 + y))
    return cell


def sheet(rows, output):
    image = Image.new("RGBA", (CELL * COLS, CELL * ROWS))
    for row, sequence in enumerate(rows):
        for column, cell in enumerate(sequence[:COLS]):
            image.alpha_composite(cell, (column * CELL, row * CELL))
    image.save(ART / output, optimize=True)


idle, act, attack, guard = (pose(f"kris-{key}") for key in ("idle", "act", "attack", "guard"))
k = lambda im, **options: make_cell(im, pixels=86, **options)
sheet([
    [k(idle, y=n) for n in (0, -1, -2, -1)],
    [k(idle, x=x, y=y) for x, y in ((0, 0), (2, -2), (3, -1), (0, 0), (-2, -2), (-3, -1))],
    [k(im, x=x, y=y) for im, x, y in ((idle, -3, 1), (guard, -2, 0), (attack, 1, -2), (attack, 4, -3), (attack, 2, -1), (idle, 0, 0))],
    [k(im, x=x, y=y) for im, x, y in ((idle, 0, 0), (act, -2, -1), (act, 0, -2), (act, 1, -1), (idle, 0, 0))],
    [k(im, y=y) for im, y in ((idle, 0), (guard, -1), (guard, -2), (guard, -1), (guard, 0))],
    [k(im, x=x, y=y) for im, x, y in ((idle, 2, 0), (guard, -3, -1), (idle, 1, 0))],
    [k(im, x=x, y=y) for im, x, y in ((idle, 0, 0), (act, -2, -1), (act, 0, -2), (act, 1, -3), (act, 0, -2), (idle, 0, 0))],
    [k(im, x=x, y=y) for im, x, y in ((idle, -4, 0), (attack, -2, -2), (attack, 3, -3), (guard, -1, 0), (attack, -3, -2), (attack, 4, -3), (idle, 0, 0))],
    [k(im, y=y) for im, y in ((idle, 0), (act, -2), (act, -4), (idle, -2), (idle, 0))],
], "kris-battle.png")


def ralsei(group, indexes, *, pixels=None):
    return [make_cell(pack_frame(f"ralsei_{group}_{index}"), pixels=pixels, y=-1 if index % 3 == 1 else 0) for index in indexes]


sheet([
    ralsei("idle", range(5), pixels=82),
    ralsei("walk_right", range(4), pixels=82),
    ralsei("attack", range(7), pixels=88),
    ralsei("spell", range(8), pixels=88),
    ralsei("defend", range(8), pixels=86),
    ralsei("hurt_fixed", [0], pixels=84),
    ralsei("spellready", range(4), pixels=86) + ralsei("spell", range(4), pixels=88),
    ralsei("act", range(8), pixels=86),
    ralsei("battleintro", range(8), pixels=86),
    ralsei("victory", range(8), pixels=88),
], "ralsei-battle.png")
