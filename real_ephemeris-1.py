"""
real_ephemeris.py — Actual planetary positions, not simulated ones.

This replaces two fake modules found tonight:
  - SelfTeachingEphemeris.js (autopoetic-resonance-engine): returned a blank
    1MB ArrayBuffer and called it "downloaded NASA data"
  - swissEphemeris.ts (synthia-hd-app): computed mockLongitude = (julianDate
    * 0.1 + planet * 30) % 360 -- an arbitrary formula, not astronomy

This module uses Skyfield + a real JPL ephemeris kernel (de421.bsp, ~17MB,
covers 1900-2050, sourced directly from ssd.jpl.nasa.gov). It is verified
below against the 2017-08-21 total solar eclipse: at that exact moment,
the Sun and Moon must sit at (near) the same ecliptic longitude. Real data
passes this test by physics, not by asserting a boolean.

Gate/Line/Color/Tone/Base subdivision uses the precision constants already
correctly stated (but never actually used) in swissEphemeris.ts:
  Gate:  5.625 deg   (360 / 64)
  Line:  0.9375 deg  (5.625 / 6)
  Color: 9.375 arcmin (0.9375 deg / 6)
  Tone:  93.75 arcsec (9.375' / 6)
  Base:  15.625 arcsec (93.75" / 6)

Requires: pip install skyfield --break-system-packages
Requires: de421.bsp in the working directory (downloaded once from NASA;
see download_kernel() below).
"""

from __future__ import annotations
from dataclasses import dataclass
from datetime import datetime, timezone, timedelta
from typing import Literal
import os
import urllib.request

from skyfield.api import load

KERNEL_PATH = "de421.bsp"
KERNEL_URL = "https://ssd.jpl.nasa.gov/ftp/eph/planets/bsp/de421.bsp"

GATE_DEG = 5.625
LINE_DEG = GATE_DEG / 6
COLOR_DEG = LINE_DEG / 6
TONE_DEG = COLOR_DEG / 6
BASE_DEG = TONE_DEG / 6

# Real Human Design gate wheel order (verified against published gate/degree
# tables in an earlier session -- gate 41 anchors the wheel at 302 deg tropical)
HD_WHEEL_ORDER = [
    41, 19, 13, 49, 30, 55, 37, 63, 22, 36, 25, 17, 21, 51, 42, 3,
    27, 24, 2, 23, 8, 20, 16, 35, 45, 12, 15, 52, 39, 53, 62, 56,
    31, 33, 7, 4, 29, 59, 40, 64, 47, 6, 46, 18, 48, 57, 32, 50,
    28, 44, 1, 43, 14, 34, 9, 5, 26, 11, 10, 58, 38, 54, 61, 60,
]
WHEEL_START_DEG = 302.0  # Gate 41 begins here (tropical longitude)

PLANET_NAMES = {
    "sun": "sun", "moon": "moon", "mercury": "mercury barycenter",
    "venus": "venus barycenter", "mars": "mars barycenter",
    "jupiter": "jupiter barycenter", "saturn": "saturn barycenter",
    "uranus": "uranus barycenter", "neptune": "neptune barycenter",
    "pluto": "pluto barycenter",
}


def download_kernel() -> None:
    """One-time real download from NASA JPL -- not simulated."""
    if os.path.exists(KERNEL_PATH):
        return
    urllib.request.urlretrieve(KERNEL_URL, KERNEL_PATH)


def format_dms(decimal_degrees: float) -> str:
    """Convert decimal degrees to the degree/minute/second notation this
    system actually uses (matches the Black Book's own wheel positions,
    e.g. 13d15'00" - and Tone/Base are DEFINED in arcseconds, not decimal
    fractions). Same number either way -- 176.12 deg IS 176d07'12" exactly,
    nothing is lost -- this just presents it the way the rest of the
    system already thinks in.
    """
    degrees = int(decimal_degrees)
    remainder = abs(decimal_degrees - degrees) * 60
    minutes = int(remainder)
    seconds = (remainder - minutes) * 60
    return f"{degrees}\u00b0{minutes:02d}'{seconds:05.2f}\""


@dataclass
class GateAddress:
    gate: int
    line: int
    color: int
    tone: int
    base: int
    longitude: float  # raw tropical ecliptic longitude, for auditing

    @property
    def longitude_dms(self) -> str:
        return format_dms(self.longitude)


def longitude_to_address(longitude: float) -> GateAddress:
    """Convert a real tropical ecliptic longitude into gate/line/color/tone/base."""
    offset = (longitude - WHEEL_START_DEG) % 360
    wheel_index = int(offset // GATE_DEG)
    within_gate = offset % GATE_DEG

    gate = HD_WHEEL_ORDER[wheel_index]
    line = int(within_gate // LINE_DEG) + 1
    within_line = within_gate % LINE_DEG
    color = int(within_line // COLOR_DEG) + 1
    within_color = within_line % COLOR_DEG
    tone = int(within_color // TONE_DEG) + 1
    within_tone = within_color % TONE_DEG
    base = int(within_tone // BASE_DEG) + 1

    return GateAddress(gate, line, color, tone, base, longitude)


class RealEphemeris:
    """Actual planetary positions from real JPL data. No mocks, no placeholders."""

    def __init__(self, kernel_path: str = KERNEL_PATH):
        download_kernel()
        self.planets = load(kernel_path)
        self.ts = load.timescale()
        self.earth = self.planets["earth"]

    def longitude(self, planet: Literal[
        "sun", "moon", "mercury", "venus", "mars", "jupiter",
        "saturn", "uranus", "neptune", "pluto"
    ], dt: datetime) -> float:
        if dt.tzinfo is None:
            dt = dt.replace(tzinfo=timezone.utc)
        t = self.ts.from_datetime(dt)
        body = self.planets[PLANET_NAMES[planet]]
        astrometric = self.earth.at(t).observe(body)
        _, lon, _ = astrometric.ecliptic_latlon()
        return lon.degrees

    def gate_address(self, planet: str, dt: datetime) -> GateAddress:
        return longitude_to_address(self.longitude(planet, dt))

    def mean_lunar_node(self, dt: datetime) -> float:
        """Real Mean Lunar Node longitude via Meeus' polynomial (Astronomical
        Algorithms, ch. 47) -- not a placeholder, an actual published formula
        for where the Moon's orbit crosses the ecliptic, smoothed of monthly
        perturbation. Closes the gap flagged earlier: Earth and the two
        Nodes, the three real HD points beyond the 10 planets.
        """
        if dt.tzinfo is None:
            dt = dt.replace(tzinfo=timezone.utc)
        t = self.ts.from_datetime(dt)
        T = (t.tt - 2451545.0) / 36525.0  # Julian centuries since J2000.0
        omega = (125.04452 - 1934.136261 * T + 0.0020708 * T**2 + T**3 / 450000.0)
        return omega % 360

    def north_node_longitude(self, dt: datetime) -> float:
        return self.mean_lunar_node(dt)

    def south_node_longitude(self, dt: datetime) -> float:
        return (self.mean_lunar_node(dt) + 180.0) % 360

    def earth_longitude(self, dt: datetime) -> float:
        """Earth is exactly opposite the Sun -- real, exact, no approximation."""
        return (self.longitude('sun', dt) + 180.0) % 360

    def full_13_point_chart(self, dt: datetime) -> dict:
        """All 13 real HD activation points, gate-addressed -- the complete
        set, not the 10-planet subset used earlier tonight."""
        result = {}
        for p in ['sun', 'moon', 'mercury', 'venus', 'mars', 'jupiter',
                  'saturn', 'uranus', 'neptune', 'pluto']:
            result[p] = self.gate_address(p, dt)
        result['earth'] = longitude_to_address(self.earth_longitude(dt))
        result['north_node'] = longitude_to_address(self.north_node_longitude(dt))
        result['south_node'] = longitude_to_address(self.south_node_longitude(dt))
        return result

    def design_sun_datetime(self, birth_dt: datetime) -> datetime:
        """The Design Sun is ~88 degrees of solar arc before birth (~88 days,
        refined by walking backward day-by-day until the Sun is actually
        88.0 degrees earlier -- solar motion isn't perfectly 1deg/day)."""
        birth_lon = self.longitude("sun", birth_dt)
        target = (birth_lon - 88.0) % 360
        probe = birth_dt - timedelta(days=88)
        # refine with real daily positions (not an approximation left as-is)
        for _ in range(6):
            probe_lon = self.longitude("sun", probe)
            diff = (probe_lon - target + 180) % 360 - 180
            probe -= timedelta(days=diff)  # ~1 deg/day, converges fast
        return probe


def verify_against_2017_eclipse() -> bool:
    """Real data must pass this by physics. Fake data (as found tonight)
    would pass trivially regardless of correctness -- this only proves
    something if the underlying positions are real."""
    eph = RealEphemeris()
    dt = datetime(2017, 8, 21, 18, 26, 40, tzinfo=timezone.utc)
    sun_lon = eph.longitude("sun", dt)
    moon_lon = eph.longitude("moon", dt)
    diff = abs(sun_lon - moon_lon)
    print(f"Sun longitude:  {sun_lon:.4f} deg")
    print(f"Moon longitude: {moon_lon:.4f} deg")
    print(f"Difference:     {diff:.4f} deg (expect < 0.5 deg at a solar eclipse)")
    return diff < 0.5


if __name__ == "__main__":
    print("=== Verifying against the 2017 total solar eclipse ===")
    ok = verify_against_2017_eclipse()
    print("VERIFIED (real data)" if ok else "FAILED -- something is wrong")

    print("\n=== Example: gate address for that same moment ===")
    eph = RealEphemeris()
    dt = datetime(2017, 8, 21, 18, 26, 40, tzinfo=timezone.utc)
    addr = eph.gate_address("sun", dt)
    print(f"Sun: Gate {addr.gate}, Line {addr.line}, Color {addr.color}, "
          f"Tone {addr.tone}, Base {addr.base} (position {addr.longitude_dms})")
