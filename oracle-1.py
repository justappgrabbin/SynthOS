"""
oracle.py — The single calibration system.

Birth data goes in once. Everything else — planetary positions, gate
activations, defined centers, active channels, Type, Strategy — calibrates
off that one input. No manual re-wiring per feature; every downstream piece
reads from one calibrated Chart object.

Built entirely on pieces verified tonight, not invented fresh:
  - real_ephemeris.py: actual NASA JPL positions (verified against the 2017
    solar eclipse), not the fake mocks found in three other codebases
  - GATE_TO_CENTER: the Ego/Solar-standardized mapping fixed tonight
  - CHANNELS: the real 36-channel table, including the 29-46 (Discovery)
    channel that was missing from the earlier neural-network mapping doc
  - Type derivation: the real connected-components algorithm confirmed
    against SharpAstrology.HumanDesign's verified implementation

Requires: pip install skyfield --break-system-packages
"""

from __future__ import annotations
from dataclasses import dataclass, field
from datetime import datetime, timezone
from typing import Dict, List, Literal, Optional, Set
from collections import defaultdict

from real_ephemeris import RealEphemeris, GateAddress

# ── Verified reference data (ported from HDGraphEngine.ts, fixed tonight) ──

CenterName = Literal["Head", "Ajna", "Throat", "G", "Ego", "Solar",
                      "Sacral", "Spleen", "Root"]

GATE_TO_CENTER: Dict[int, CenterName] = {
    1: "G", 2: "G", 3: "Sacral", 4: "Ajna", 5: "Sacral", 6: "Solar",
    7: "G", 8: "Throat", 9: "Sacral", 10: "G", 11: "Ajna", 12: "Throat",
    13: "G", 14: "Sacral", 15: "G", 16: "Throat", 17: "Ajna", 18: "Spleen",
    19: "Root", 20: "Throat", 21: "Ego", 22: "Solar", 23: "Throat",
    24: "Ajna", 25: "G", 26: "Ego", 27: "Sacral", 28: "Spleen", 29: "Sacral",
    30: "Solar", 31: "Throat", 32: "Spleen", 33: "Throat", 34: "Sacral",
    35: "Throat", 36: "Solar", 37: "Solar", 38: "Root", 39: "Root",
    40: "Ego", 41: "Root", 42: "Sacral", 43: "Ajna", 44: "Spleen", 45: "Throat",
    46: "G", 47: "Ajna", 48: "Spleen", 49: "Solar", 50: "Spleen",
    51: "Ego", 52: "Root", 53: "Root", 54: "Root", 55: "Solar",
    56: "Throat", 57: "Spleen", 58: "Root", 59: "Sacral", 60: "Root",
    61: "Head", 62: "Throat", 63: "Head", 64: "Head",
}

# (gateA, gateB, centerA, centerB, name) -- the real 36, including 29-46
CHANNELS: List[tuple] = [
    (1, 8, "G", "Throat", "Inspiration"), (2, 14, "G", "Sacral", "Beat"),
    (3, 60, "Sacral", "Root", "Mutation"), (4, 63, "Ajna", "Head", "Logic"),
    (5, 15, "Sacral", "G", "Rhythm"), (6, 59, "Solar", "Sacral", "Intimacy"),
    (7, 31, "G", "Throat", "Alpha"), (9, 52, "Sacral", "Root", "Concentration"),
    (10, 20, "G", "Throat", "Awakening"), (10, 34, "G", "Sacral", "Exploration"),
    (10, 57, "G", "Spleen", "Perfected Form"), (11, 56, "Ajna", "Throat", "Curiosity"),
    (12, 22, "Throat", "Solar", "Openness"), (13, 33, "G", "Throat", "Prodigal"),
    (16, 48, "Throat", "Spleen", "Wavelength"), (17, 62, "Ajna", "Throat", "Acceptance"),
    (18, 58, "Spleen", "Root", "Judgment"), (19, 49, "Root", "Solar", "Synthesis"),
    (20, 34, "Throat", "Sacral", "Charisma"), (20, 57, "Throat", "Spleen", "Brainwave"),
    (21, 45, "Ego", "Throat", "Money"), (23, 43, "Throat", "Ajna", "Structuring"),
    (24, 61, "Ajna", "Head", "Awareness"), (25, 51, "G", "Ego", "Initiation"),
    (26, 44, "Ego", "Spleen", "Surrender"), (27, 50, "Sacral", "Spleen", "Preservation"),
    (28, 38, "Spleen", "Root", "Struggle"), (29, 46, "Sacral", "G", "Discovery"),
    (30, 41, "Solar", "Root", "Recognition"), (32, 54, "Spleen", "Root", "Transformation"),
    (34, 57, "Sacral", "Spleen", "Power"), (35, 36, "Throat", "Solar", "Transitoriness"),
    (37, 40, "Solar", "Ego", "Community"), (39, 55, "Root", "Solar", "Emoting"),
    (42, 53, "Sacral", "Root", "Maturation"), (47, 64, "Ajna", "Head", "Abstraction"),
]

MOTOR_CENTERS: Set[str] = {"Ego", "Solar", "Sacral", "Root"}

PLANETS = ["sun", "moon", "mercury", "venus", "mars", "jupiter",
           "saturn", "uranus", "neptune", "pluto"]

# HD also requires Earth (exactly opposite the Sun) and the Lunar Nodes.
# Earth is trivial (180 deg from Sun) and included below. The Nodes require
# real orbital-element computation beyond a simple body lookup -- not done
# here yet; flagged honestly rather than faked.


@dataclass
class Chart:
    """The one calibrated object. Everything else in the app reads from this."""
    birth_datetime: datetime
    design_datetime: datetime
    personality_gates: Dict[str, GateAddress]  # planet -> address
    design_gates: Dict[str, GateAddress]
    active_gates: Set[int]
    defined_centers: Set[str]
    active_channels: List[tuple]
    type: str
    strategy: str


class Oracle:
    """Birth data in, calibrated chart out. This is the whole point:
    you don't re-derive Type, centers, or channels by hand each time --
    call calibrate() once and every downstream piece reads Chart."""

    def __init__(self):
        self.eph = RealEphemeris()

    def calibrate(self, birth_dt: datetime) -> Chart:
        if birth_dt.tzinfo is None:
            birth_dt = birth_dt.replace(tzinfo=timezone.utc)

        design_dt = self.eph.design_sun_datetime(birth_dt)

        personality_gates = {p: self.eph.gate_address(p, birth_dt) for p in PLANETS}
        design_gates = {p: self.eph.gate_address(p, design_dt) for p in PLANETS}

        # Earth: exactly opposite the Sun -- a real, required HD point
        from real_ephemeris import longitude_to_address
        personality_gates["earth"] = longitude_to_address(
            (personality_gates["sun"].longitude + 180) % 360)
        design_gates["earth"] = longitude_to_address(
            (design_gates["sun"].longitude + 180) % 360)

        active_gates: Set[int] = set()
        for addr in list(personality_gates.values()) + list(design_gates.values()):
            active_gates.add(addr.gate)

        active_channels = [
            ch for ch in CHANNELS if ch[0] in active_gates and ch[1] in active_gates
        ]

        defined_centers = self._defined_centers(active_channels)
        chart_type = self._derive_type(defined_centers, active_channels)
        strategy = self._strategy_for_type(chart_type)

        return Chart(
            birth_datetime=birth_dt, design_datetime=design_dt,
            personality_gates=personality_gates, design_gates=design_gates,
            active_gates=active_gates, defined_centers=defined_centers,
            active_channels=active_channels, type=chart_type, strategy=strategy,
        )

    def _defined_centers(self, active_channels: List[tuple]) -> Set[str]:
        """A center is defined if it has at least one complete channel
        touching it (both gates of that channel active)."""
        defined = set()
        for gateA, gateB, centerA, centerB, name in active_channels:
            defined.add(centerA)
            defined.add(centerB)
        return defined

    def _connected_components(self, defined_centers: Set[str],
                               active_channels: List[tuple]) -> Dict[str, int]:
        """Union-find over defined centers connected by active channels --
        the same graph-connectivity approach verified against
        SharpAstrology.HumanDesign's real Type-derivation logic."""
        parent = {c: c for c in defined_centers}

        def find(x):
            while parent[x] != x:
                parent[x] = parent[parent[x]]
                x = parent[x]
            return x

        def union(a, b):
            ra, rb = find(a), find(b)
            if ra != rb:
                parent[ra] = rb

        for gateA, gateB, centerA, centerB, name in active_channels:
            union(centerA, centerB)

        return {c: find(c) for c in defined_centers}

    def _derive_type(self, defined_centers: Set[str], active_channels: List[tuple]) -> str:
        if not defined_centers:
            return "Reflector"

        components = self._connected_components(defined_centers, active_channels)

        sacral_defined = "Sacral" in defined_centers
        throat_defined = "Throat" in defined_centers

        if not sacral_defined:
            if not throat_defined:
                return "Projector"
            throat_component = components["Throat"]
            for motor in ("Ego", "Solar", "Root"):
                if motor in defined_centers and components[motor] == throat_component:
                    return "Manifestor"
            return "Projector"

        # Sacral defined
        if not throat_defined:
            return "Generator"
        throat_component = components["Throat"]
        for motor in ("Ego", "Solar", "Root"):
            if motor in defined_centers and components[motor] == throat_component:
                return "ManifestingGenerator"
        if components["Sacral"] == throat_component:
            return "ManifestingGenerator"
        return "Generator"

    def _strategy_for_type(self, chart_type: str) -> str:
        return {
            "Generator": "Wait to respond",
            "ManifestingGenerator": "Wait to respond, then inform",
            "Projector": "Wait for the invitation",
            "Manifestor": "Inform before acting",
            "Reflector": "Wait a full lunar cycle",
        }[chart_type]


if __name__ == "__main__":
    oracle = Oracle()

    # Birth data from memory: Sept 18, 1990, 9:34 PM, San Francisco.
    # September = PDT = UTC-7, so 21:34 PDT = 04:34 UTC on Sep 19.
    # (Using the raw local time as if it were UTC -- an easy, real mistake --
    # would silently shift every gate in the chart. Flagging it explicitly
    # rather than letting it pass quietly.)
    birth = datetime(1990, 9, 19, 4, 34, tzinfo=timezone.utc)
    chart = oracle.calibrate(birth)

    print(f"Birth: {chart.birth_datetime}")
    print(f"Design (88° solar arc earlier): {chart.design_datetime}")
    print(f"\nActive gates: {sorted(chart.active_gates)}")
    print(f"Defined centers: {sorted(chart.defined_centers)}")
    print(f"\nActive channels:")
    for gateA, gateB, centerA, centerB, name in chart.active_channels:
        print(f"  {gateA}-{gateB} ({name}): {centerA} <-> {centerB}")
    print(f"\nType: {chart.type}")
    print(f"Strategy: {chart.strategy}")
