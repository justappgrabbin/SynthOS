// ═══════════════════════════════════════════════════════════════════════════
// HDGraphEngine.ts — Personal Chart Ingestion → 5D Living Graph
// ═══════════════════════════════════════════════════════════════════════════

import { Tensor } from './Tensor'; // lightweight autograd (or use your existing)

// ── Types ──────────────────────────────────────────────────────────────────
export type GateNumber = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 |
  11 | 12 | 13 | 14 | 15 | 16 | 17 | 18 | 19 | 20 |
  21 | 22 | 23 | 24 | 25 | 26 | 27 | 28 | 29 | 30 |
  31 | 32 | 33 | 34 | 35 | 36 | 37 | 38 | 39 | 40 |
  41 | 42 | 43 | 44 | 45 | 46 | 47 | 48 | 49 | 50 |
  51 | 52 | 53 | 54 | 55 | 56 | 57 | 58 | 59 | 60 |
  61 | 62 | 63 | 64;

export type CenterName =
  'Head' | 'Ajna' | 'Throat' | 'G' | 'Heart' | 'SolarPlexus' | 'Sacral' | 'Spleen' | 'Root';

export type HDType = 'Generator' | 'ManifestingGenerator' | 'Projector' | 'Manifestor' | 'Reflector';

export type Dimension = 'D1' | 'D2' | 'D3' | 'D4' | 'D5';

export type Planet =
  'Sun' | 'Earth' | 'Moon' | 'NorthNode' | 'SouthNode' |
  'Mercury' | 'Venus' | 'Mars' | 'Jupiter' | 'Saturn' | 'Uranus' | 'Neptune' | 'Pluto';

// ── Gate-to-Center Mapping (Human Design) ──────────────────────────────────
export const GATE_TO_CENTER: Record<GateNumber, CenterName> = {
  1: 'G', 2: 'G', 3: 'Sacral', 4: 'Ajna', 5: 'Sacral', 6: 'SolarPlexus',
  7: 'G', 8: 'Throat', 9: 'Sacral', 10: 'G', 11: 'Ajna', 12: 'Throat',
  13: 'G', 14: 'Sacral', 15: 'G', 16: 'Throat', 17: 'Ajna', 18: 'Spleen',
  19: 'Root', 20: 'Throat', 21: 'Heart', 22: 'SolarPlexus', 23: 'Throat',
  24: 'Ajna', 25: 'G', 26: 'Heart', 27: 'Sacral', 28: 'Spleen', 29: 'Sacral',
  30: 'SolarPlexus', 31: 'Throat', 32: 'Spleen', 33: 'Throat', 34: 'Sacral',
  35: 'Throat', 36: 'SolarPlexus', 37: 'SolarPlexus', 38: 'Root', 39: 'Root',
  40: 'Heart', 41: 'Root', 42: 'Sacral', 43: 'Ajna', 44: 'Spleen', 45: 'Throat',
  46: 'G', 47: 'Ajna', 48: 'Spleen', 49: 'SolarPlexus', 50: 'Spleen',
  51: 'Heart', 52: 'Root', 53: 'Root', 54: 'Root', 55: 'SolarPlexus',
  56: 'Throat', 57: 'Spleen', 58: 'Root', 59: 'Sacral', 60: 'Root',
  61: 'Head', 62: 'Throat', 63: 'Head', 64: 'Head',
};

// ── The 36 Channels (Gate-to-Gate connections) ──────────────────────────────
export interface Channel {
  id: string;
  gateA: GateNumber;
  gateB: GateNumber;
  centerA: CenterName;
  centerB: CenterName;
  name: string;
  theme: string;
}

export const CHANNELS: Channel[] = [
  { id: '1-8', gateA: 1, gateB: 8, centerA: 'G', centerB: 'Throat', name: 'Inspiration', theme: 'Creative manifestation' },
  { id: '2-14', gateA: 2, gateB: 14, centerA: 'G', centerB: 'Sacral', name: 'Beat', theme: 'Direction through vitality' },
  { id: '3-60', gateA: 3, gateB: 60, centerA: 'Sacral', centerB: 'Root', name: 'Mutation', theme: 'Innovation under pressure' },
  { id: '4-63', gateA: 4, gateB: 63, centerA: 'Ajna', centerB: 'Head', name: 'Logic', theme: 'Mental certainty' },
  { id: '5-15', gateA: 5, gateB: 15, centerA: 'Sacral', centerB: 'G', name: 'Rhythm', theme: 'Flow through patterns' },
  { id: '6-59', gateA: 6, gateB: 59, centerA: 'SolarPlexus', centerB: 'Sacral', name: 'Intimacy', theme: 'Emotional openness' },
  { id: '7-31', gateA: 7, gateB: 31, centerA: 'G', centerB: 'Throat', name: 'Alpha', theme: 'Leadership' },
  { id: '9-52', gateA: 9, gateB: 52, centerA: 'Sacral', centerB: 'Root', name: 'Concentration', theme: 'Focused energy' },
  { id: '10-20', gateA: 10, gateB: 20, centerA: 'G', centerB: 'Throat', name: 'Awakening', theme: 'Self-love in action' },
  { id: '10-34', gateA: 10, gateB: 34, centerA: 'G', centerB: 'Sacral', name: 'Exploration', theme: 'Following your nature' },
  { id: '10-57', gateA: 10, gateB: 57, centerA: 'G', centerB: 'Spleen', name: 'Perfected Form', theme: 'Survival through love' },
  { id: '11-56', gateA: 11, gateB: 56, centerA: 'Ajna', centerB: 'Throat', name: 'Curiosity', theme: 'Seeking stories' },
  { id: '12-22', gateA: 12, gateB: 22, centerA: 'Throat', centerB: 'SolarPlexus', name: 'Openness', theme: 'Emotional expression' },
  { id: '13-33', gateA: 13, gateB: 33, centerA: 'G', centerB: 'Throat', name: 'Prodigal', theme: 'Witnessing and sharing' },
  { id: '16-48', gateA: 16, gateB: 48, centerA: 'Throat', centerB: 'Spleen', name: 'Wavelength', theme: 'Depth of talent' },
  { id: '17-62', gateA: 17, gateB: 62, centerA: 'Ajna', centerB: 'Throat', name: 'Acceptance', theme: 'Organizing details' },
  { id: '18-58', gateA: 18, gateB: 58, centerA: 'Spleen', centerB: 'Root', name: 'Judgment', theme: 'Correcting patterns' },
  { id: '19-49', gateA: 19, gateB: 49, centerA: 'Root', centerB: 'SolarPlexus', name: 'Synthesis', theme: 'Need meets principle' },
  { id: '20-34', gateA: 20, gateB: 34, centerA: 'Throat', centerB: 'Sacral', name: 'Charisma', theme: 'Now is the time' },
  { id: '20-57', gateA: 20, gateB: 57, centerA: 'Throat', centerB: 'Spleen', name: 'Brainwave', theme: 'Intuitive action' },
  { id: '21-45', gateA: 21, gateB: 45, centerA: 'Heart', centerB: 'Throat', name: 'Money', theme: 'Material control' },
  { id: '23-43', gateA: 23, gateB: 43, centerA: 'Throat', centerB: 'Ajna', name: 'Structuring', theme: 'Individual knowing' },
  { id: '24-61', gateA: 24, gateB: 61, centerA: 'Ajna', centerB: 'Head', name: 'Awareness', theme: 'Rationalizing mystery' },
  { id: '25-51', gateA: 25, gateB: 51, centerA: 'G', centerB: 'Heart', name: 'Initiation', theme: 'Shock of love' },
  { id: '26-44', gateA: 26, gateB: 44, centerA: 'Heart', centerB: 'Spleen', name: 'Surrender', theme: 'Transmitting history' },
  { id: '27-50', gateA: 27, gateB: 50, centerA: 'Sacral', centerB: 'Spleen', name: 'Preservation', theme: 'Caring for community' },
  { id: '28-38', gateA: 28, gateB: 38, centerA: 'Spleen', centerB: 'Root', name: 'Struggle', theme: 'Finding purpose' },
  { id: '29-46', gateA: 29, gateB: 46, centerA: 'Sacral', centerB: 'G', name: 'Discovery', theme: 'Commitment to experience' },
  { id: '30-41', gateA: 30, gateB: 41, centerA: 'SolarPlexus', centerB: 'Root', name: 'Recognition', theme: 'Emotional dreams' },
  { id: '32-54', gateA: 32, gateB: 54, centerA: 'Spleen', centerB: 'Root', name: 'Transformation', theme: 'Ambition rooted in instinct' },
  { id: '34-57', gateA: 34, gateB: 57, centerA: 'Sacral', centerB: 'Spleen', name: 'Power', theme: 'Intuitive vitality' },
  { id: '35-36', gateA: 35, gateB: 36, centerA: 'Throat', centerB: 'SolarPlexus', name: 'Transitoriness', theme: 'Experience through emotion' },
  { id: '37-40', gateA: 37, gateB: 40, centerA: 'SolarPlexus', centerB: 'Heart', name: 'Community', theme: 'Family and friendship' },
  { id: '39-55', gateA: 39, gateB: 55, centerA: 'Root', centerB: 'SolarPlexus', name: 'Emoting', theme: 'Moodiness as provocation' },
  { id: '42-53', gateA: 42, gateB: 53, centerA: 'Sacral', centerB: 'Root', name: 'Maturation', theme: 'Development through trial' },
  { id: '47-64', gateA: 47, gateB: 64, centerA: 'Ajna', centerB: 'Head', name: 'Abstraction', theme: 'Making sense of confusion' },
];

// ── Planet-to-Dimension Mapping (Ra Uru Hu's 13-planet system) ─────────────
export const PLANET_TO_DIMENSION: Record<Planet, Dimension> = {
  Sun: 'D1',        // Movement/Individuality — core expression
  Earth: 'D2',      // Evolution/Mind — grounding/counterpoint
  Moon: 'D3',       // Being/Body — cyclical, emotional
  NorthNode: 'D4',  // Design — trajectory, where you're going
  SouthNode: 'D5',  // Space — persona, where you came from
  Mercury: 'D1',    // Movement — communication, expression
  Venus: 'D3',      // Being — relating, values
  Mars: 'D1',       // Movement — drive, action
  Jupiter: 'D2',    // Evolution — expansion, wisdom
  Saturn: 'D4',     // Design — discipline, structure
  Uranus: 'D5',     // Space — revolution, individuality
  Neptune: 'D2',    // Evolution — transcendence, illusion
  Pluto: 'D4',      // Design — transformation, power
};

// ── 5 Dimensions with their properties ─────────────────────────────────────
export const DIMENSIONS: Record<Dimension, {
  name: string;
  nature: string;
  keynote: string;
  crystal: string;
  sense: string;
  element: string;
}> = {
  D1: { name: 'Movement', nature: 'Energy is Creation', keynote: 'I Define', crystal: 'Magnetic Monopole', sense: 'Seeing', element: 'Fire' },
  D2: { name: 'Evolution', nature: 'Gravity is Memory', keynote: 'I Remember', crystal: 'Personality Crystal', sense: 'Taste', element: 'Water' },
  D3: { name: 'Being', nature: 'Matter is Touch', keynote: 'I Am', crystal: 'The Atom', sense: 'Touch', element: 'Earth' },
  D4: { name: 'Design', nature: 'Structure is Progress', keynote: 'I Design', crystal: 'Design Crystal', sense: 'Smell', element: 'Air' },
  D5: { name: 'Space', nature: 'Form is Illusion', keynote: 'I Think', crystal: 'Personality Crystal', sense: 'Hearing', element: 'Ether' },
};

// ── Gate Expressions (each gate's meaning shifts per dimension) ──────────────
export const GATE_EXPRESSIONS: Record<GateNumber, Record<Dimension, string>> = {
  1: { D1: 'I initiate uniquely in the now', D2: 'My soul's evolution is creative initiation', D3: 'I embody creative power through action', D4: 'I structure my creative expression', D5: 'I think about creativity as pure potential' },
  2: { D1: 'I receive direction from my unique response', D2: 'My evolution guides others through direction', D3: 'I am the direction of the body', D4: 'I design the path for collective movement', D5: 'I hold the vision of where we are going' },
  3: { D1: 'I create order from chaos through action', D2: 'My evolution transforms through mutation', D3: 'I embody the mutation in matter', D4: 'I design systems that accept change', D5: 'I see the pattern in all change' },
  4: { D1: 'I answer questions through my unique logic', D2: 'My evolution seeks answers to life's mysteries', D3: 'I am the answer that the body knows', D4: 'I design the formulas that solve problems', D5: 'I formulate the questions that need asking' },
  5: { D1: 'I set patterns through my unique rhythm', D2: 'My evolution flows through universal patterns', D3: 'I am the rhythm of the body', D4: 'I design the habits that sustain life', D5: 'I perceive the pattern in all things' },
  6: { D1: 'I create intimacy through my emotional wave', D2: 'My evolution deepens through emotional connection', D3: 'I am the intimacy of the body', D4: 'I design the bonds that hold community', D5: 'I feel the potential in all connection' },
  7: { D1: 'I lead through my unique role', D2: 'My evolution guides the collective direction', D3: 'I am the leadership of the body', D4: 'I design the structures of power', D5: 'I see the role that needs filling' },
  8: { D1: 'I contribute through my unique style', D2: 'My evolution expresses through creative contribution', D3: 'I am the contribution of the body', D4: 'I design the work that inspires others', D5: 'I hold the vision of what must be shared' },
  9: { D1: 'I focus energy through my unique concentration', D2: 'My evolution deepens through sustained attention', D3: 'I am the focus of the body', D4: 'I design the details that matter', D5: 'I see the detail that changes everything' },
  10: { D1: 'I love myself through my unique behavior', D2: 'My evolution is self-love in action', D3: 'I am the self-love of the body', D4: 'I design the self that others see', D5: 'I hold the identity of the tribe' },
  // ... (all 64 gates would be fully populated here)
} as any;

// ── The Personal Graph ───────────────────────────────────────────────────────
export interface CenterNode {
  name: CenterName;
  defined: boolean;        // persistent (colored in) or open (white)
  gates: GateNumber[];     // which gates are in this center
  activeGates: GateNumber[]; // currently activated by transit/conditioning
  channels: string[];      // channel IDs connected to this center
  kleinToolActive: boolean; // is the tool expressing?
  dimensionalState: Record<Dimension, number>; // activation level per dimension (0-1)
  semanticSignature: Float32Array; // Klein Boolean feature vector (64-dim)
}

export interface PersonalGraph {
  userId: string;
  birthDate: string;
  birthTime: string;
  birthLocation: string;
  type: HDType;
  authority: string;
  profile: string;         // e.g., "1/3", "4/6"
  incarnationCross: string;
  centers: Record<CenterName, CenterNode>;
  definedChannels: string[];
  undefinedChannels: string[];
  emergentChannels: string[]; // channels that appear through interaction
  planetaryActivations: Record<Planet, GateNumber | null>;
  monopolePosition: { x: number; y: number; z: number }; // attractor field coordinates
  resonanceField: Float32Array; // 64-dim attractor geometry
  lastUpdated: number;
}

// ── HD Graph Builder ─────────────────────────────────────────────────────────
export class HDGraphBuilder {
  private ephemeris: Map<string, Record<Planet, GateNumber>> = new Map();

  constructor() {
    // Initialize with basic ephemeris data (would be replaced with real API)
    this.loadEphemeris();
  }

  private loadEphemeris() {
    // Placeholder: real implementation would load Swiss Ephemeris or similar
    // For now, we generate deterministic "transit" data based on date
  }

  // Build a personal graph from birth data
  buildGraph(params: {
    userId: string;
    birthDate: string;      // YYYY-MM-DD
    birthTime: string;       // HH:MM
    birthLocation: string;   // City, Country
  }): PersonalGraph {
    // In production, this would call an HD calculation API
    // (Jovian Archive, Genetic Matrix, or custom ephemeris)
    // For now, we build a deterministic graph based on the input

    const hash = this.hashString(params.birthDate + params.birthTime + params.birthLocation);
    const definedCenters = this.determineDefinedCenters(hash);
    const activeGates = this.determineActiveGates(hash, params.birthDate);
    const type = this.determineType(definedCenters);

    const centers: Record<CenterName, CenterNode> = {} as any;

    for (const centerName of Object.keys(GATE_TO_CENTER) as CenterName[]) {
      const centerGates = (Object.entries(GATE_TO_CENTER)
        .filter(([, c]) => c === centerName)
        .map(([g]) => parseInt(g) as GateNumber));

      const activeInCenter = activeGates.filter(g => centerGates.includes(g));
      const isDefined = definedCenters.includes(centerName);

      // Build semantic signature (Klein Boolean feature vector)
      const signature = new Float32Array(64);
      for (const g of activeInCenter) {
        signature[g - 1] = 1.0;
      }
      // Add dimensional modulation
      for (let i = 0; i < 64; i++) {
        if (signature[i] > 0) {
          signature[i] += (hash % 100) / 1000; // subtle variation per person
        }
      }

      centers[centerName] = {
        name: centerName,
        defined: isDefined,
        gates: centerGates,
        activeGates: activeInCenter,
        channels: [],
        kleinToolActive: isDefined, // tool is active if center is defined
        dimensionalState: {
          D1: isDefined ? (hash % 10) / 10 : 0.1,
          D2: isDefined ? ((hash >> 4) % 10) / 10 : 0.1,
          D3: isDefined ? ((hash >> 8) % 10) / 10 : 0.1,
          D4: isDefined ? ((hash >> 12) % 10) / 10 : 0.1,
          D5: isDefined ? ((hash >> 16) % 10) / 10 : 0.1,
        },
        semanticSignature: signature,
      };
    }

    // Determine channels
    const definedChannels: string[] = [];
    const undefinedChannels: string[] = [];

    for (const ch of CHANNELS) {
      const centerA = centers[ch.centerA];
      const centerB = centers[ch.centerB];
      const hasGateA = centerA.activeGates.includes(ch.gateA);
      const hasGateB = centerB.activeGates.includes(ch.gateB);

      if (hasGateA && hasGateB) {
        definedChannels.push(ch.id);
        centerA.channels.push(ch.id);
        centerB.channels.push(ch.id);
      } else if (hasGateA || hasGateB) {
        undefinedChannels.push(ch.id);
      }
    }

    // Planetary activations (simplified — real version uses ephemeris)
    const planets: Planet[] = ['Sun', 'Earth', 'Moon', 'NorthNode', 'SouthNode', 'Mercury', 'Venus', 'Mars', 'Jupiter', 'Saturn', 'Uranus', 'Neptune', 'Pluto'];
    const planetaryActivations: Record<Planet, GateNumber | null> = {} as any;
    for (let i = 0; i < planets.length; i++) {
      const gateNum = ((hash + i * 7) % 64) + 1;
      planetaryActivations[planets[i]] = gateNum as GateNumber;
    }

    // Monopole position (attractor field coordinates)
    const monopolePosition = {
      x: (hash % 1000) / 1000,
      y: ((hash >> 10) % 1000) / 1000,
      z: ((hash >> 20) % 1000) / 1000,
    };

    // Resonance field (64-dim attractor geometry)
    const resonanceField = new Float32Array(64);
    for (let i = 0; i < 64; i++) {
      resonanceField[i] = Math.sin(hash * (i + 1) * 0.01) * 0.5 + 0.5;
    }

    return {
      userId: params.userId,
      birthDate: params.birthDate,
      birthTime: params.birthTime,
      birthLocation: params.birthLocation,
      type,
      authority: this.determineAuthority(definedCenters),
      profile: `${(hash % 6) + 1}/${((hash >> 3) % 6) + 1}`,
      incarnationCross: `Cross of ${this.getCrossName(hash)}`,
      centers,
      definedChannels,
      undefinedChannels,
      emergentChannels: [],
      planetaryActivations,
      monopolePosition,
      resonanceField,
      lastUpdated: Date.now(),
    };
  }

  // Update graph with current transits
  updateWithTransits(graph: PersonalGraph): PersonalGraph {
    const now = new Date();
    const dateKey = now.toISOString().split('T')[0];
    const transitHash = this.hashString(dateKey + 'transit');

    // Activate additional gates based on transit
    const transitGates: GateNumber[] = [];
    for (let i = 0; i < 13; i++) {
      transitGates.push(((transitHash + i * 13) % 64 + 1) as GateNumber);
    }

    // Update center active gates
    for (const centerName of Object.keys(graph.centers) as CenterName[]) {
      const center = graph.centers[centerName];
      const centerGates = center.gates;
      const newActive = [...center.activeGates];

      for (const tg of transitGates) {
        if (centerGates.includes(tg) && !newActive.includes(tg)) {
          newActive.push(tg);
        }
      }

      center.activeGates = newActive;

      // Update dimensional state based on transit
      for (const dim of Object.keys(DIMENSIONS) as Dimension[]) {
        const dimGates = newActive.filter(g => {
          const planet = Object.entries(graph.planetaryActivations)
            .find(([, gate]) => gate === g)?.[0] as Planet;
          return planet && PLANET_TO_DIMENSION[planet] === dim;
        });
        center.dimensionalState[dim] = Math.min(1, center.dimensionalState[dim] + dimGates.length * 0.1);
      }
    }

    // Check for emergent channels (transit-created connections)
    const newEmergent: string[] = [];
    for (const ch of CHANNELS) {
      if (!graph.definedChannels.includes(ch.id) && !graph.undefinedChannels.includes(ch.id)) {
        const centerA = graph.centers[ch.centerA];
        const centerB = graph.centers[ch.centerB];
        if (centerA.activeGates.includes(ch.gateA) && centerB.activeGates.includes(ch.gateB)) {
          newEmergent.push(ch.id);
        }
      }
    }
    graph.emergentChannels = [...new Set([...graph.emergentChannels, ...newEmergent])];

    graph.lastUpdated = Date.now();
    return graph;
  }

  // Calculate resonance between two personal graphs
  calculateResonance(graphA: PersonalGraph, graphB: PersonalGraph): {
    score: number;
    complementaryChannels: string[];
    sharedChannels: string[];
    energyExchange: Record<CenterName, 'give' | 'receive' | 'neutral'>;
    dimensionalAlignment: Record<Dimension, number>;
  } {
    // Shared defined channels
    const sharedChannels = graphA.definedChannels.filter(ch => graphB.definedChannels.includes(ch));

    // Complementary channels (one has defined, other has undefined)
    const complementaryChannels = graphA.definedChannels.filter(ch => graphB.undefinedChannels.includes(ch))
      .concat(graphB.definedChannels.filter(ch => graphA.undefinedChannels.includes(ch)));

    // Energy exchange per center
    const energyExchange: Record<CenterName, 'give' | 'receive' | 'neutral'> = {} as any;
    for (const centerName of Object.keys(graphA.centers) as CenterName[]) {
      const aDefined = graphA.centers[centerName].defined;
      const bDefined = graphB.centers[centerName].defined;
      if (aDefined && !bDefined) energyExchange[centerName] = 'give';
      else if (!aDefined && bDefined) energyExchange[centerName] = 'receive';
      else energyExchange[centerName] = 'neutral';
    }

    // Dimensional alignment
    const dimensionalAlignment: Record<Dimension, number> = {} as any;
    for (const dim of Object.keys(DIMENSIONS) as Dimension[]) {
      let alignment = 0;
      for (const centerName of Object.keys(graphA.centers) as CenterName[]) {
        alignment += Math.abs(graphA.centers[centerName].dimensionalState[dim] - graphB.centers[centerName].dimensionalState[dim]);
      }
      dimensionalAlignment[dim] = 1 - (alignment / 9); // normalize
    }

    // Overall resonance score
    const sharedScore = sharedChannels.length * 0.15;
    const complementaryScore = complementaryChannels.length * 0.25;
    const dimScore = Object.values(dimensionalAlignment).reduce((a, b) => a + b, 0) / 5 * 0.3;
    const fieldScore = this.cosineSimilarity(graphA.resonanceField, graphB.resonanceField) * 0.3;

    const score = Math.min(1, sharedScore + complementaryScore + dimScore + fieldScore);

    return { score, complementaryChannels, sharedChannels, energyExchange, dimensionalAlignment };
  }

  // Cosine similarity between two Float32Arrays
  private cosineSimilarity(a: Float32Array, b: Float32Array): number {
    let dot = 0, normA = 0, normB = 0;
    for (let i = 0; i < a.length; i++) {
      dot += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }
    return dot / (Math.sqrt(normA) * Math.sqrt(normB) + 1e-8);
  }

  // Helper methods
  private hashString(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash);
  }

  private determineDefinedCenters(hash: number): CenterName[] {
    const allCenters: CenterName[] = ['Head', 'Ajna', 'Throat', 'G', 'Heart', 'SolarPlexus', 'Sacral', 'Spleen', 'Root'];
    const defined: CenterName[] = [];
    for (let i = 0; i < allCenters.length; i++) {
      if ((hash >> i) & 1) defined.push(allCenters[i]);
    }
    // Ensure at least 2 centers are defined (minimum for a valid chart)
    if (defined.length < 2) {
      defined.push('Sacral', 'G');
    }
    return defined;
  }

  private determineActiveGates(hash: number, birthDate: string): GateNumber[] {
    const gates: GateNumber[] = [];
    const dateHash = this.hashString(birthDate);
    for (let i = 0; i < 26; i++) { // ~26 gates active in a typical chart
      const gate = ((hash + i * dateHash) % 64) + 1;
      if (!gates.includes(gate as GateNumber)) {
        gates.push(gate as GateNumber);
      }
    }
    return gates;
  }

  private determineType(definedCenters: CenterName[]): HDType {
    const hasSacral = definedCenters.includes('Sacral');
    const hasHeart = definedCenters.includes('Heart');
    const hasG = definedCenters.includes('G');
    const hasThroat = definedCenters.includes('Throat');

    if (hasSacral && hasHeart && hasThroat) return 'ManifestingGenerator';
    if (hasSacral && hasHeart) return 'Generator';
    if (hasSacral) return 'Generator';
    if (hasG && hasThroat) return 'Projector';
    if (hasHeart && hasThroat) return 'Manifestor';
    return 'Reflector';
  }

  private determineAuthority(definedCenters: CenterName[]): string {
    if (definedCenters.includes('SolarPlexus')) return 'Emotional Authority';
    if (definedCenters.includes('Sacral')) return 'Sacral Authority';
    if (definedCenters.includes('Spleen')) return 'Splenic Authority';
    if (definedCenters.includes('Heart')) return 'Ego Authority';
    if (definedCenters.includes('G')) return 'Self-Projected Authority';
    if (definedCenters.includes('Ajna')) return 'Mental Authority';
    return 'Lunar Authority';
  }

  private getCrossName(hash: number): string {
    const crosses = ['The Sleeping Phoenix', 'The Sphinx', 'The Vessel of Love', 'The Four Ways', 'Tension', 'The Unexpected', 'Consciousness', 'The Laws', 'The Quarter of Initiation', 'The Quarter of Civilization', 'The Quarter of Duality', 'The Quarter of Mutation'];
    return crosses[hash % crosses.length];
  }
}

// ── Singleton instance ───────────────────────────────────────────────────────
export const hdGraphBuilder = new HDGraphBuilder();
