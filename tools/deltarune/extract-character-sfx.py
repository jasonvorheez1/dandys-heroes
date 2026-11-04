"""Copy the small Deltarune character cues out of the existing Flower Kingdom pack."""
from __future__ import annotations

import json
import struct
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
PACK = ROOT / "assets/flowery/flowery.bin"
OUT = ROOT / "assets/deltarune/sfx"
NAMES = (
    "select", "swing", "rudebuster_hit", "weaponpull_fast", "spare", "graze",
    "power", "spellcast", "magicsprinkle", "mercyadd", "great_shine", "revival",
)

with PACK.open("rb") as source:
    if source.read(8) != b"DHFLWR01":
        raise ValueError("Unexpected Flower Kingdom pack")
    header_size = struct.unpack("<I", source.read(4))[0]
    header = json.loads(source.read(header_size))
    base = 12 + header_size
    entries = {entry["name"]: entry for entry in header["files"]}
    OUT.mkdir(parents=True, exist_ok=True)
    for name in NAMES:
        entry = entries[f"sfx/{name}.ogg"]
        source.seek(base + entry["off"])
        (OUT / f"{name}.ogg").write_bytes(source.read(entry["len"]))
