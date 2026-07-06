/**
 * Symbolic Address System — JavaScript Mesh
 * Core implementation of the mathematical framework from:
 * angle → gate-line-color-tone-base decomposition,
 * semantic embedding, channel graph, and sentence generation.
 */

// ============================================================
// 1. CONSTANTS & SET DEFINITIONS
// ============================================================

const CONSTANTS = {
  DEG_PER_GATE: 360 / 64,        // 5.625°
  DEG_PER_SIGN: 30,              // Zodiac / House bin size
  LINES_PER_GATE: 6,
  COLORS_PER_LINE: 6,
  TONES_PER_COLOR: 6,
  BASES_PER_TONE: 5,
  MICROSTATES_PER_GATE: 6 * 6 * 6 * 5, // 1080
};

const DIMENSIONS = [
  'Movement', 'Evolution', 'Being', 'Design', 'Space'
];

const PLANETS = [
  'Sun', 'Earth', 'Moon', 'NorthNode', 'SouthNode',
  'Mercury', 'Venus', 'Mars', 'Jupiter', 'Saturn',
  'Uranus', 'Neptune', 'Pluto'
];

const ZODIAC_SIGNS = [
  'Aries', 'Taurus', 'Gemini', 'Cancer',
  'Leo', 'Virgo', 'Libra', 'Scorpio',
  'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'
];

const HOUSES = Array.from({ length: 12 }, (_, i) => i + 1);

const GATES = Array.from({ length: 64 }, (_, i) => i + 1);

const LINES = Array.from({ length: 6 }, (_, i) => i + 1);
const COLORS = Array.from({ length: 6 }, (_, i) => i + 1);
const TONES = Array.from({ length: 6 }, (_, i) => i + 1);
const BASES = Array.from({ length: 5 }, (_, i) => i + 1);

const CENTERS = [
  'Head', 'Ajna', 'Throat', 'G', 'Heart', 'SolarPlexus',
  'Spleen', 'Sacral', 'Root'
];

// Gate → Center mapping (Human Design bodygraph)
const GATE_TO_CENTER = {
  // Head (1-4)
  1: 'Head', 2: 'Head', 3: 'Head', 4: 'Head',
  // Ajna (5-8, 63-64)
  5: 'Ajna', 6: 'Ajna', 7: 'Ajna', 8: 'Ajna',
  63: 'Ajna', 64: 'Ajna',
  // Throat (9-16, 23, 56, 62)
  9: 'Throat', 10: 'Throat', 11: 'Throat', 12: 'Throat',
  13: 'Throat', 14: 'Throat', 15: 'Throat', 16: 'Throat',
  23: 'Throat', 56: 'Throat', 62: 'Throat',
  // G (17-22, 25-35, 41, 44, 51)
  17: 'G', 18: 'G', 19: 'G', 20: 'G', 21: 'G', 22: 'G',
  25: 'G', 26: 'G', 27: 'G', 28: 'G', 29: 'G', 30: 'G',
  31: 'G', 32: 'G', 33: 'G', 34: 'G', 35: 'G',
  41: 'G', 44: 'G', 51: 'G',
  // Heart (29, 30, 36, 37, 40, 54)
  36: 'Heart', 37: 'Heart', 40: 'Heart', 54: 'Heart',
  // Solar Plexus (6, 22, 36, 37, 49, 55)
  49: 'SolarPlexus', 55: 'SolarPlexus',
  // Spleen (10, 18, 28, 32, 44, 48, 50, 57)
  48: 'Spleen', 50: 'Spleen', 57: 'Spleen',
  // Sacral (2, 5, 9, 14, 29, 34, 42, 59)
  42: 'Sacral', 59: 'Sacral',
  // Root (38, 39, 52, 53, 54, 58, 60, 61)
  38: 'Root', 39: 'Root', 52: 'Root', 53: 'Root',
  58: 'Root', 60: 'Root', 61: 'Root',
};

// Complete the mapping for all 64 gates
for (let g = 1; g <= 64; g++) {
  if (!GATE_TO_CENTER[g]) GATE_TO_CENTER[g] = 'G'; // fallback
}

// ============================================================
// 2. ANGULAR DECOMPOSITION
// ============================================================

/**
 * Decompose an angle (0–360°) into gate-line-color-tone-base.
 * This is the core mixed-radix decomposition.
 */
function decomposeAngle(theta) {
  // Normalize to [0, 360)
  const t = ((theta % 360) + 360) % 360;

  // Gate
  const gate = Math.floor(t / CONSTANTS.DEG_PER_GATE) + 1;
  const r1 = t - (gate - 1) * CONSTANTS.DEG_PER_GATE;
  const u = r1 / CONSTANTS.DEG_PER_GATE; // normalized [0,1)

  // Line
  const line = Math.floor(6 * u) + 1;
  const u1 = 6 * u - (line - 1);

  // Color
  const color = Math.floor(6 * u1) + 1;
  const u2 = 6 * u1 - (color - 1);

  // Tone
  const tone = Math.floor(6 * u2) + 1;
  const u3 = 6 * u2 - (tone - 1);

  // Base
  const base = Math.floor(5 * u3) + 1;

  return { gate, line, color, tone, base };
}

/**
 * Zodiac sign from angle.
 */
function zodiacFromAngle(theta) {
  const t = ((theta % 360) + 360) % 360;
  const idx = Math.floor(t / CONSTANTS.DEG_PER_SIGN);
  return ZODIAC_SIGNS[idx];
}

/**
 * House from angle (equal houses, given ascendant offset).
 */
function houseFromAngle(theta, ascendant = 0) {
  const t = ((theta % 360) + 360) % 360;
  const asc = ((ascendant % 360) + 360) % 360;
  const idx = Math.floor((t - asc) / CONSTANTS.DEG_PER_SIGN);
  const house = ((idx % 12) + 12) % 12 + 1;
  return house;
}

/**
 * Full decomposition: angle → (z, h, g, l, c, t, b)
 */
function fullDecompose(theta, ascendant = 0) {
  return {
    zodiac: zodiacFromAngle(theta),
    house: houseFromAngle(theta, ascendant),
    ...decomposeAngle(theta)
  };
}

// ============================================================
// 3. ADDRESS & STATE SPACE
// ============================================================

class Address {
  /**
   * Full symbolic address: (d, p, z, h, g, l, c, t, b, r)
   */
  constructor(dimension, planet, zodiac, house, gate, line, color, tone, base, center) {
    this.dimension = dimension;
    this.planet = planet;
    this.zodiac = zodiac;
    this.house = house;
    this.gate = gate;
    this.line = line;
    this.color = color;
    this.tone = tone;
    this.base = base;
    this.center = center;
  }

  /**
   * Construct from an angle (and metadata).
   */
  static fromAngle(dimension, planet, theta, ascendant = 0) {
    const dec = fullDecompose(theta, ascendant);
    const center = GATE_TO_CENTER[dec.gate] || 'G';
    return new Address(
      dimension, planet,
      dec.zodiac, dec.house,
      dec.gate, dec.line, dec.color, dec.tone, dec.base,
      center
    );
  }

  /**
   * Minimal address: (d, p, θ, r)
   */
  static minimal(dimension, planet, theta, ascendant = 0) {
    const dec = decomposeAngle(theta);
    const center = GATE_TO_CENTER[dec.gate] || 'G';
    return {
      dimension,
      planet,
      theta,
      center,
      decomposition: dec
    };
  }

  toTuple() {
    return [
      this.dimension, this.planet, this.zodiac, this.house,
      this.gate, this.line, this.color, this.tone, this.base, this.center
    ];
  }

  toString() {
    return `Addr(${this.dimension}, ${this.planet}, ${this.zodiac}/H${this.house}, Gate${this.gate}.${this.line}.${this.color}.${this.tone}.${this.base}, ${this.center})`;
  }
}

// ============================================================
// 4. SEMANTIC EMBEDDING
// ============================================================

class SemanticEmbedder {
  /**
   * Maps symbolic components to real vectors.
   * In production, these would be learned embeddings.
   * Here we use deterministic hash-based embeddings for reproducibility.
   */
  constructor(embeddingDim = 32) {
    this.m = embeddingDim;
    this.cache = new Map();
  }

  _hash(str, seed = 0) {
    // Simple seeded hash for deterministic pseudo-randomness
    let h = seed;
    for (let i = 0; i < str.length; i++) {
      h = (h * 31 + str.charCodeAt(i)) >>> 0;
    }
    return h;
  }

  _vector(key, seed) {
    const cacheKey = `${key}:${seed}`;
    if (this.cache.has(cacheKey)) return this.cache.get(cacheKey);

    const vec = new Float64Array(this.m);
    let h = this._hash(key, seed);
    for (let i = 0; i < this.m; i++) {
      // LCG for pseudo-randomness, then normalize-ish
      h = (h * 1103515245 + 12345) >>> 0;
      vec[i] = (h / 0xFFFFFFFF) * 2 - 1; // [-1, 1]
    }
    // L2 normalize
    const norm = Math.sqrt(vec.reduce((s, v) => s + v * v, 0));
    const normalized = norm > 0 ? Array.from(vec).map(v => v / norm) : Array.from(vec);
    this.cache.set(cacheKey, normalized);
    return normalized;
  }

  embedDimension(d) {
    return this._vector(`dim:${d}`, 1);
  }

  embedPlanet(p) {
    return this._vector(`planet:${p}`, 2);
  }

  embedZodiac(z) {
    return this._vector(`zodiac:${z}`, 3);
  }

  embedHouse(h) {
    return this._vector(`house:${h}`, 4);
  }

  embedGate(g) {
    return this._vector(`gate:${g}`, 5);
  }

  embedLine(l) {
    return this._vector(`line:${l}`, 6);
  }

  embedColor(c) {
    return this._vector(`color:${c}`, 7);
  }

  embedTone(t) {
    return this._vector(`tone:${t}`, 8);
  }

  embedBase(b) {
    return this._vector(`base:${b}`, 9);
  }

  embedCenter(r) {
    return this._vector(`center:${r}`, 10);
  }

  /**
   * Full semantic state vector: s(a) = Σ W_i φ_i(component)
   */
  embed(address, weights = null) {
    const defaultWeights = {
      dimension: 1.0, planet: 1.0, zodiac: 0.8, house: 0.8,
      gate: 1.2, line: 1.0, color: 0.7, tone: 0.7, base: 0.6, center: 1.0
    };
    const W = weights || defaultWeights;

    const vecs = [
      this.embedDimension(address.dimension).map(v => v * W.dimension),
      this.embedPlanet(address.planet).map(v => v * W.planet),
      this.embedZodiac(address.zodiac).map(v => v * W.zodiac),
      this.embedHouse(address.house).map(v => v * W.house),
      this.embedGate(address.gate).map(v => v * W.gate),
      this.embedLine(address.line).map(v => v * W.line),
      this.embedColor(address.color).map(v => v * W.color),
      this.embedTone(address.tone).map(v => v * W.tone),
      this.embedBase(address.base).map(v => v * W.base),
      this.embedCenter(address.center).map(v => v * W.center),
    ];

    // Sum component-wise
    return vecs[0].map((_, i) => vecs.reduce((sum, v) => sum + v[i], 0));
  }

  distance(a1, a2, weights = null) {
    const v1 = this.embed(a1, weights);
    const v2 = this.embed(a2, weights);
    return Math.sqrt(v1.reduce((s, _, i) => s + (v1[i] - v2[i]) ** 2, 0));
  }
}

// ============================================================
// 5. CHANNEL GRAPH
// ============================================================

class ChannelGraph {
  /**
   * Adjacency graph on gates. In Human Design, channels are
   * specific gate pairs. Here we build from a canonical list.
   */
  constructor() {
    this.adjacency = new Map(); // gate -> Set(gates)
    this._buildChannels();
  }

  _addChannel(g1, g2) {
    if (!this.adjacency.has(g1)) this.adjacency.set(g1, new Set());
    if (!this.adjacency.has(g2)) this.adjacency.set(g2, new Set());
    this.adjacency.get(g1).add(g2);
    this.adjacency.get(g2).add(g1);
  }

  _buildChannels() {
    // Canonical Human Design channels (partial core set)
    const channels = [
      [1, 8], [2, 14], [3, 60], [4, 63], [5, 15], [6, 59],
      [7, 31], [9, 52], [10, 20], [10, 34], [11, 56],
      [12, 22], [13, 33], [16, 48], [17, 62], [18, 58],
      [19, 49], [20, 34], [20, 57], [21, 45], [23, 43],
      [24, 61], [25, 51], [26, 44], [27, 50], [28, 38],
      [29, 46], [30, 41], [32, 54], [34, 57], [35, 36],
      [37, 40], [39, 55], [42, 53], [47, 64], [50, 27],
    ];
    for (const [g1, g2] of channels) {
      this._addChannel(g1, g2);
    }
  }

  isConnected(g1, g2) {
    return this.adjacency.has(g1) && this.adjacency.get(g1).has(g2);
  }

  neighbors(gate) {
    return this.adjacency.has(gate) ? Array.from(this.adjacency.get(gate)) : [];
  }

  pathLength(g1, g2) {
    // BFS shortest path
    if (g1 === g2) return 0;
    const visited = new Set([g1]);
    const queue = [[g1, 0]];
    while (queue.length > 0) {
      const [curr, dist] = queue.shift();
      for (const nxt of this.neighbors(curr)) {
        if (nxt === g2) return dist + 1;
        if (!visited.has(nxt)) {
          visited.add(nxt);
          queue.push([nxt, dist + 1]);
        }
      }
    }
    return Infinity;
  }

  get adjacencyMatrix() {
    const n = 64;
    const A = Array.from({ length: n }, () => new Float64Array(n));
    for (let i = 1; i <= n; i++) {
      for (const j of this.neighbors(i)) {
        A[i - 1][j - 1] = 1;
      }
    }
    return A;
  }
}

// ============================================================
// 6. CENTER ACTIVATION & BODY GRAPH
// ============================================================

class BodyGraph {
  constructor() {
    this.centers = CENTERS;
    this.gateToCenter = GATE_TO_CENTER;
    this.centerToGates = {};
    for (const [gate, center] of Object.entries(GATE_TO_CENTER)) {
      if (!this.centerToGates[center]) this.centerToGates[center] = [];
      this.centerToGates[center].push(Number(gate));
    }
  }

  /**
   * Activate centers from a set of active gates.
   * x_r = Σ_g M_{rg} x_g
   */
  activate(gates) {
    const activation = {};
    for (const c of this.centers) activation[c] = 0;
    for (const g of gates) {
      const center = this.gateToCenter[g];
      if (center) activation[center] += 1;
    }
    return activation;
  }

  activeCenters(gates, threshold = 1) {
    const act = this.activate(gates);
    return Object.entries(act)
      .filter(([, v]) => v >= threshold)
      .map(([c]) => c);
  }
}

// ============================================================
// 7. SENTENCE GENERATOR
// ============================================================

class SentenceGenerator {
  /**
   * Deterministic sentence compiler:
   * F(a) = f_D(d) ⊕ f_Z(z) ⊕ f_G(g) ⊕ f_L(l) ⊕ f_P(p) ⊕ f_H(h) ⊕ f_R(r) ⊕ f_E(a)
   */
  constructor() {
    this.lexicon = this._buildLexicon();
  }

  _buildLexicon() {
    return {
      dimensions: {
        Movement: { type: 'imperative', prefix: 'Move through' },
        Evolution: { type: 'narrative', prefix: 'You are becoming' },
        Being: { type: 'existential', prefix: 'You are' },
        Design: { type: 'structural', prefix: 'The pattern is' },
        Space: { type: 'spatial', prefix: 'In the field of' },
      },
      planets: {
        Sun: 'the core self', Moon: 'the emotional body',
        Mercury: 'the mind', Venus: 'the values',
        Mars: 'the drive', Jupiter: 'the expansion',
        Saturn: 'the structure', Uranus: 'the disruption',
        Neptune: 'the dissolution', Pluto: 'the transformation',
        Earth: 'the ground', NorthNode: 'the future', SouthNode: 'the past',
      },
      zodiac: {
        Aries: 'initiation', Taurus: 'embodiment',
        Gemini: 'exchange', Cancer: 'nurturing',
        Leo: 'expression', Virgo: 'refinement',
        Libra: 'balance', Scorpio: 'intensity',
        Sagittarius: 'exploration', Capricorn: 'mastery',
        Aquarius: 'innovation', Pisces: 'transcendence',
      },
      lines: {
        1: 'investigating', 2: 'projecting', 3: 'experimenting',
        4: 'networking', 5: 'leading', 6: 'transcending',
      },
      centers: {
        Head: 'mental pressure', Ajna: 'conceptual awareness',
        Throat: 'manifestation', G: 'identity',
        Heart: 'willpower', SolarPlexus: 'emotional wave',
        Spleen: 'intuition', Sacral: 'life force',
        Root: 'adrenaline drive',
      },
    };
  }

  generate(address) {
    const L = this.lexicon;
    const dim = L.dimensions[address.dimension] || L.dimensions.Being;
    const planet = L.planets[address.planet] || address.planet;
    const zodiac = L.zodiac[address.zodiac] || address.zodiac;
    const line = L.lines[address.line] || `line ${address.line}`;
    const center = L.centers[address.center] || address.center;

    // Sentence type from dimension
    const sentenceType = dim.type;

    // Subject from planet
    const subject = planet;

    // Verb/archetype from gate + line
    const verb = `${line} in Gate ${address.gate}`;

    // Context from zodiac + house
    const context = `${zodiac} in House ${address.house}`;

    // Somatic anchor from center
    const somatic = `felt in the ${center}`;

    // Tonal coloring from color/tone/base
    const tonal = `color ${address.color}, tone ${address.tone}, base ${address.base}`;

    // Emergent closure
    const closure = this._closure(address);

    // Assembly
    const parts = [
      dim.prefix,
      subject,
      verb + ',',
      context + ',',
      somatic + ',',
      tonal + '.',
      closure,
    ];

    return {
      sentence: parts.join(' '),
      components: {
        sentenceType,
        subject,
        verb,
        context,
        somatic,
        tonal,
        closure,
      },
      raw: address.toString(),
    };
  }

  _closure(address) {
    // Simple emergent interference based on gate parity + line
    const g = address.gate;
    const l = address.line;
    const sum = g + l;
    if (sum % 7 === 0) return 'A harmonic resolution emerges.';
    if (sum % 5 === 0) return 'Tension invites integration.';
    if (sum % 3 === 0) return 'The pattern repeats with variation.';
    return 'The field holds potential.';
  }
}

// ============================================================
// 8. TIME EVOLUTION & CONTINUITY
// ============================================================

class Trajectory {
  constructor(embedder) {
    this.states = []; // array of { t, address, vector }
    this.embedder = embedder;
  }

  push(t, address) {
    const vec = this.embedder.embed(address);
    this.states.push({ t, address, vector: vec });
  }

  /**
   * Coherence metric: ||s(a(t+Δt)) - s(a(t))|| for small Δt
   */
  coherence(index) {
    if (index <= 0 || index >= this.states.length) return null;
    const prev = this.states[index - 1].vector;
    const curr = this.states[index].vector;
    const dt = this.states[index].t - this.states[index - 1].t;
    if (dt === 0) return null;
    const dist = Math.sqrt(prev.reduce((s, _, i) => s + (prev[i] - curr[i]) ** 2, 0));
    return dist / dt; // velocity in semantic space
  }

  coherenceSeries() {
    return this.states.map((_, i) => this.coherence(i)).filter(v => v !== null);
  }
}

// ============================================================
// 9. STATE SPACE METRICS
// ============================================================

function stateSpaceSize() {
  return {
    dimensions: DIMENSIONS.length,
    planets: PLANETS.length,
    zodiac: ZODIAC_SIGNS.length,
    houses: HOUSES.length,
    gates: GATES.length,
    lines: LINES.length,
    colors: COLORS.length,
    tones: TONES.length,
    bases: BASES.length,
    centers: CENTERS.length,
    rawUpperBound: DIMENSIONS.length * PLANETS.length * ZODIAC_SIGNS.length *
                   HOUSES.length * GATES.length * LINES.length *
                   COLORS.length * TONES.length * BASES.length * CENTERS.length,
    microstatesPerGate: CONSTANTS.MICROSTATES_PER_GATE,
  };
}

// ============================================================
// 10. EXPORT / MODULE INTERFACE
// ============================================================

const SymbolicMesh = {
  CONSTANTS,
  DIMENSIONS,
  PLANETS,
  ZODIAC_SIGNS,
  HOUSES,
  GATES,
  LINES,
  COLORS,
  TONES,
  BASES,
  CENTERS,
  GATE_TO_CENTER,

  decomposeAngle,
  zodiacFromAngle,
  houseFromAngle,
  fullDecompose,

  Address,
  SemanticEmbedder,
  ChannelGraph,
  BodyGraph,
  SentenceGenerator,
  Trajectory,

  stateSpaceSize,
};

// Node.js / ES module compatibility
if (typeof module !== 'undefined' && module.exports) {
  module.exports = SymbolicMesh;
}
if (typeof window !== 'undefined') {
  window.SymbolicMesh = SymbolicMesh;
}
if (typeof globalThis !== 'undefined') {
  globalThis.SymbolicMesh = SymbolicMesh;
}

export default SymbolicMesh;
export {
  CONSTANTS, DIMENSIONS, PLANETS, ZODIAC_SIGNS, HOUSES, GATES,
  LINES, COLORS, TONES, BASES, CENTERS, GATE_TO_CENTER,
  decomposeAngle, zodiacFromAngle, houseFromAngle, fullDecompose,
  Address, SemanticEmbedder, ChannelGraph, BodyGraph,
  SentenceGenerator, Trajectory, stateSpaceSize,
};
