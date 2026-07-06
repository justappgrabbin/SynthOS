"""
resonance_color.py — Color derived from real position, not looked up.

The gap named tonight: FIELD_HEX in fieldVisuals.ts is a static dictionary
(field name -> hardcoded hex). That's a label, not a computation. This
replaces it with a real function: a gate's color comes from its actual
tropical longitude (the same real, verified position data oracle.py and
real_ephemeris.py already produce), the same way Coordinate.phaseVector in
coordinate_generated_tensor.js derives everything from position with no
registry.

The five established tones are not abandoned by going mathematical --
they're the palette the derived hue gets clamped into, so "no blue, ever"
and "mathematically derived" hold at the same time.
"""

from __future__ import annotations
from dataclasses import dataclass
from typing import Tuple

# The five real tones (locked palette). Each has a hue anchor in HSL space.
# Gold #f5c518, Amber #e8921a, Emerald #10d474, Violet #c084fc, Coral #ff5959
TONE_ANCHORS = [
    ("gold",    45.0,  "#f5c518"),
    ("amber",   33.0,  "#e8921a"),
    ("emerald", 154.0, "#10d474"),
    ("violet",  277.0, "#c084fc"),
    ("coral",   4.0,   "#ff5959"),
]


@dataclass
class DerivedColor:
    tone_name: str
    hex: str
    raw_hue: float       # the hue the longitude actually produced, pre-clamp
    source_longitude: float


def gate_to_hue(longitude: float) -> float:
    """Longitude (0-360, real tropical position) -> raw hue (0-360).
    This IS the computation -- no lookup, same principle as
    CoordinateGeneratedTensor: the position generates the value."""
    return longitude % 360


def hue_to_tone(raw_hue: float) -> Tuple[str, str]:
    """Snap a raw derived hue to whichever of the five real tones it's
    closest to on the color wheel. This is the clamp step -- the derivation
    is real, but the output space is still your five locked tones, not an
    arbitrary rainbow."""
    best_name, best_hex, best_dist = None, None, 361.0
    for name, anchor_hue, hexval in TONE_ANCHORS:
        dist = min(abs(raw_hue - anchor_hue), 360 - abs(raw_hue - anchor_hue))
        if dist < best_dist:
            best_name, best_hex, best_dist = name, hexval, dist
    return best_name, best_hex


def derive_color(longitude: float) -> DerivedColor:
    """The real entry point: real longitude in, derived (not looked-up)
    color out, clamped to the five locked tones."""
    raw = gate_to_hue(longitude)
    tone_name, hexval = hue_to_tone(raw)
    return DerivedColor(tone_name=tone_name, hex=hexval,
                         raw_hue=raw, source_longitude=longitude)


if __name__ == "__main__":
    from real_ephemeris import RealEphemeris
    from datetime import datetime, timezone

    eph = RealEphemeris()
    birth = datetime(1990, 9, 19, 4, 34, tzinfo=timezone.utc)  # real UTC-converted birth moment

    print("=== Colors derived from real planetary longitude, not looked up ===\n")
    for planet in ["sun", "moon", "mercury", "venus", "mars"]:
        lon = eph.longitude(planet, birth)
        color = derive_color(lon)
        print(f"{planet.capitalize():8s}  longitude={lon:7.2f} deg  "
              f"-> raw hue {color.raw_hue:6.2f}  -> {color.tone_name:8s} {color.hex}")
