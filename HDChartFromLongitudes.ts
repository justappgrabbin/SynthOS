// ═════════════════════════════════════════════════════════════════════════
// HDChartFromLongitudes.ts  (added 2026-10-19, branch fill/synthos-20261019)
//
// Fills the shell in HDGraphEngine.ts, where HDGraphBuilder.loadEphemeris() says
//   "// Placeholder: real implementation would load Swiss Ephemeris or similar
//    // For now, we generate deterministic "transit" data based on date"
// and buildGraph() builds gates, centers and planets from a hash of the birth
// text. Same code in HDGraphEngine-2.ts, her later copy, which is the one that
// parses (HDGraphEngine.ts line 128 has an unescaped apostrophe in 'soul's'
// and does not compile). This file imports HDGraphEngine-2.ts. Neither file
// is edited; her hash path is still there.
//
// What this adds: given real ecliptic longitudes (from any ephemeris), it
// computes the actual gate.line.color.tone.base of each body, the defined
// channels and centers, and passes the real defined centers into HER
// determineType()/determineAuthority() rules, unchanged.
//
// It does not compute planet positions. INVESTIGATING: there is no ephemeris
// in this repo; longitudes must come from Swiss Ephemeris or similar.
// No birth data is stored in this file or its tests.
// ═════════════════════════════════════════════════════════════════════════

import {
  CHANNELS, GATE_TO_CENTER, HDGraphBuilder,
  type CenterName, type GateNumber, type HDType, type Planet,
} from './HDGraphEngine-2';

// ── Gate wheel ───────────────────────────────────────────────────────────
// SOURCE: research/hd-math-verification.md s.1 (three published tables +
// human-design-py, 0 mismatches): gate 41 starts at 302.0 deg tropical, each
// gate 5.625 deg, line 0.9375, color 0.15625, tone 93.75", base 18.75".
// Black Book (Ra Uru Hu 1991, her Drive copy) p.16: "These Gates and the
// Constellations/Hexagrams of the Wheels are identical."
export const WHEEL_ORDER_FROM_41: GateNumber[] = [
  41,19,13,49,30,55,37,63,22,36,25,17,21,51,42,3,27,24,2,23,8,20,16,35,45,12,15,52,39,53,62,56,
  31,33,7,4,29,59,40,64,47,6,46,18,48,57,32,50,28,44,1,43,14,34,9,5,26,11,10,58,38,54,61,60,
] as GateNumber[];
export const GATE_41_START = 302.0;
export const GATE_ARC = 360 / 64;          // 5.625
export const LINE_ARC = GATE_ARC / 6;      // 0.9375
export const COLOR_ARC = LINE_ARC / 6;     // 0.15625
export const TONE_ARC = COLOR_ARC / 6;     // 93.75 arcsec
export const BASE_ARC = TONE_ARC / 5;      // 18.75 arcsec

// ZODIAC FLAG: the 302 deg anchor is TROPICAL. Alexis's requirement is
// Fagan-Bradley sidereal; mainstream HD tools use tropical. This file reads
// gates from the longitude it is given and does not convert. Which zodiac
// the gates should be read on: investigating (her decision).

export interface Activation {
  longitude: number;
  gate: GateNumber; line: number; color: number; tone: number; base: number;
  address: string;
}

export function activationFromLongitude(lonDeg: number): Activation {
  if (!Number.isFinite(lonDeg)) throw new Error(`bad longitude ${lonDeg}`);
  const lon = ((lonDeg % 360) + 360) % 360;
  const fromStart = ((lon - GATE_41_START) % 360 + 360) % 360;
  const k = Math.min(63, Math.floor(fromStart / GATE_ARC + 1e-12));
  let r = fromStart - k * GATE_ARC;
  const line = Math.min(6, Math.floor(r / LINE_ARC + 1e-12) + 1); r -= (line - 1) * LINE_ARC;
  const color = Math.min(6, Math.floor(r / COLOR_ARC + 1e-12) + 1); r -= (color - 1) * COLOR_ARC;
  const tone = Math.min(6, Math.floor(r / TONE_ARC + 1e-12) + 1); r -= (tone - 1) * TONE_ARC;
  const base = Math.min(5, Math.floor(r / BASE_ARC + 1e-12) + 1);
  const gate = WHEEL_ORDER_FROM_41[k];
  return { longitude: lon, gate, line, color, tone, base, address: `${gate}.${line}.${color}.${tone}.${base}` };
}

// ── Design moment ────────────────────────────────────────────────────────
// SOURCE: Black Book p.16: "the position of the Design Sun can be found by
// going back exactly 88° of arc. This is approximately three months before
// birth." (also p.10: "exactly 88 degrees of the Sun's movement before
// birth"). The DATE when the Sun was there needs an ephemeris search
// (hd-math-verification.md s.3: 86.6-92 days, not a fixed 88 days).
export function designSunLongitude(personalitySunLon: number): number {
  return (((personalitySunLon - 88) % 360) + 360) % 360;
}

// filled in, no source: Earth taken as the point opposite the Sun. Her
// Black Book copy names the Earth in every gate's line text but no page
// found states the 180 deg rule.
export function earthFromSun(sunLon: number): number {
  return (sunLon + 180) % 360;
}

// ── Definition ───────────────────────────────────────────────────────────
// SOURCE: Black Book p.18: "(Definition: when two centers are permanently
// connected by design from birth.) Definition means the continual transfer
// of energy between two centers." A channel is defined when both of its
// gates are activated (Personality or Design); both of its centers are then
// defined. Channel list and gate->center map are HER CHANNELS and
// GATE_TO_CENTER from HDGraphEngine-2.ts, used as she wrote them.
export function definedChannelsFor(activeGates: Set<number>): string[] {
  return CHANNELS.filter((c) => activeGates.has(c.gateA) && activeGates.has(c.gateB)).map((c) => c.id);
}

export function definedCentersFor(definedChannels: string[]): CenterName[] {
  const set = new Set<CenterName>();
  for (const id of definedChannels) {
    const c = CHANNELS.find((x) => x.id === id)!;
    set.add(c.centerA); set.add(c.centerB);
  }
  return [...set];
}

export type Longitudes = Partial<Record<Planet, number>>;

export interface ChartFromLongitudes {
  personality: Partial<Record<Planet, Activation>>;
  design: Partial<Record<Planet, Activation>>;
  activeGates: GateNumber[];
  definedChannels: string[];
  definedCenters: CenterName[];
  openCenters: CenterName[];
  type: HDType;            // HER determineType(), fed real defined centers
  authority: string;       // HER determineAuthority(), fed real defined centers
  profile: { status: 'investigating'; personalitySunLine?: number; designSunLine?: number };
  notes: string[];
}

// Her center names as used in HDGraphEngine-2.ts GATE_TO_CENTER ('Ego', 'Solar', ...).
const ALL_CENTERS: CenterName[] = [...new Set(Object.values(GATE_TO_CENTER))] as CenterName[];

export function buildChartFromLongitudes(input: { personality: Longitudes; design: Longitudes }): ChartFromLongitudes {
  const personality: Partial<Record<Planet, Activation>> = {};
  const design: Partial<Record<Planet, Activation>> = {};
  for (const [p, lon] of Object.entries(input.personality)) if (lon != null) personality[p as Planet] = activationFromLongitude(lon);
  for (const [p, lon] of Object.entries(input.design)) if (lon != null) design[p as Planet] = activationFromLongitude(lon);
  const gates = new Set<number>([...Object.values(personality), ...Object.values(design)].map((a) => a!.gate));
  for (const g of gates) if (!(g in GATE_TO_CENTER)) throw new Error(`gate ${g} missing from GATE_TO_CENTER`);
  const definedChannels = definedChannelsFor(gates);
  const definedCenters = definedCentersFor(definedChannels);
  // Her rules, unchanged. They are private in TS only; called as written.
  const builder = new HDGraphBuilder() as any;
  const type: HDType = builder.determineType(definedCenters);
  const authority: string = builder.determineAuthority(definedCenters);
  return {
    personality, design,
    activeGates: [...gates].sort((a, b) => a - b) as GateNumber[],
    definedChannels, definedCenters,
    openCenters: ALL_CENTERS.filter((c) => !definedCenters.includes(c)),
    type, authority,
    // INVESTIGATING: profile (Personality Sun line / Design Sun line) is not
    // in her 1991 Black Book copy. The two lines are reported, not combined.
    profile: { status: 'investigating', personalitySunLine: personality.Sun?.line, designSunLine: design.Sun?.line },
    notes: [
      'Gates read on the tropical wheel (302 deg anchor). Her requirement is Fagan-Bradley: investigating.',
      'type/authority come from her determineType/determineAuthority in HDGraphEngine-2.ts, unchanged. See FILL_NOTES for a flag on those rules.',
    ],
  };
}
