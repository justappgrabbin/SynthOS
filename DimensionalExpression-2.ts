// ═══════════════════════════════════════════════════════════════════════════
// DimensionalExpression.ts — 5D Stack + 13 Planets + 2 Extras
// ═══════════════════════════════════════════════════════════════════════════

import {
  GateNumber, Dimension, Planet,
  DIMENSIONS, PLANET_TO_DIMENSION, GATE_EXPRESSIONS,
  PersonalGraph, CenterName,
} from './HDGraphEngine';

// ── The 5 Dimensions + 2 Extras ────────────────────────────────────────────
// D1-D5: The core expression stack
// D6 (Trajectory): Where you're going — North Node path
// D7 (Persona): The faces you show — Profile masks

export type ExtraDimension = 'D6' | 'D7';
export type AllDimension = Dimension | ExtraDimension;

export const EXTRA_DIMENSIONS: Record<ExtraDimension, {
  name: string;
  nature: string;
  keynote: string;
  source: string;
  description: string;
}> = {
  D6: {
    name: 'Trajectory',
    nature: 'Where you are going',
    keynote: 'I Become',
    source: 'North Node / South Node',
    description: 'The evolutionary path — where your growth is heading',
  },
  D7: {
    name: 'Persona',
    nature: 'The faces you show',
    keynote: 'I Appear',
    source: 'Profile (e.g., 1/3, 4/6)',
    description: 'The masks and roles you wear in different contexts',
  },
};

// ── Planet Ephemeris Interface ───────────────────────────────────────────────
export interface PlanetPosition {
  planet: Planet;
  gate: GateNumber;
  line: number;      // 1-6
  color: number;     // 1-6
  tone: number;      // 1-6
  base: number;      // 1-5
  longitude: number; // 0-360 degrees
  latitude: number;  // degrees
  speed: number;     // degrees per day
  retrograde: boolean;
}

// ── Real-time Transit Tracker ────────────────────────────────────────────────
export class TransitTracker {
  private ephemeris: Map<string, PlanetPosition[]> = new Map();
  private lastUpdate: number = 0;
  private updateInterval: number = 3600000; // 1 hour

  // In production, this would call Swiss Ephemeris or an API
  // For now, we use deterministic generation based on date

  async getCurrentTransits(date: Date = new Date()): Promise<PlanetPosition[]> {
    const dateKey = date.toISOString().split('T')[0];

    if (this.ephemeris.has(dateKey) && Date.now() - this.lastUpdate < this.updateInterval) {
      return this.ephemeris.get(dateKey)!;
    }

    const transits = this.generateTransits(date);
    this.ephemeris.set(dateKey, transits);
    this.lastUpdate = Date.now();
    return transits;
  }

  private generateTransits(date: Date): PlanetPosition[] {
    const planets: Planet[] = [
      'Sun', 'Earth', 'Moon', 'NorthNode', 'SouthNode',
      'Mercury', 'Venus', 'Mars', 'Jupiter', 'Saturn',
      'Uranus', 'Neptune', 'Pluto',
    ];

    const hash = this.hashString(date.toISOString());
    const transits: PlanetPosition[] = [];

    for (let i = 0; i < planets.length; i++) {
      const planet = planets[i];
      const gate = ((hash + i * 17) % 64 + 1) as GateNumber;
      const line = ((hash + i * 13) % 6) + 1;
      const color = ((hash + i * 7) % 6) + 1;
      const tone = ((hash + i * 5) % 6) + 1;
      const base = ((hash + i * 3) % 5) + 1;

      transits.push({
        planet,
        gate,
        line,
        color,
        tone,
        base,
        longitude: ((hash + i * 11) % 360),
        latitude: ((hash + i * 19) % 180) - 90,
        speed: ((hash + i * 23) % 100) / 10,
        retrograde: ((hash + i) % 7) === 0,
      });
    }

    return transits;
  }

  // Get which dimension a planet is currently expressing through
  getPlanetDimension(planet: Planet): Dimension {
    return PLANET_TO_DIMENSION[planet];
  }

  // Get all planets currently activating a specific gate
  getPlanetsForGate(gate: GateNumber, transits: PlanetPosition[]): Planet[] {
    return transits.filter(t => t.gate === gate).map(t => t.planet);
  }

  // Get all gates activated by a specific planet
  getGatesForPlanet(planet: Planet, transits: PlanetPosition[]): GateNumber[] {
    return transits.filter(t => t.planet === planet).map(t => t.gate);
  }

  private hashString(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash);
  }
}

// ── The 5D Expression Engine ─────────────────────────────────────────────────
export class DimensionalExpressionEngine {
  private transitTracker: TransitTracker;

  constructor() {
    this.transitTracker = new TransitTracker();
  }

  // Express a gate through all 5 dimensions (plus extras)
  expressGate(
    gate: GateNumber,
    graph: PersonalGraph,
    date: Date = new Date()
  ): Record<AllDimension, {
    expression: string;
    active: boolean;
    strength: number;
    planets: Planet[];
    narrative: string;
  }> {
    const transits = this.transitTracker.getCurrentTransits(date);
    const center = this.getGateCenter(gate);
    const centerNode = graph.centers[center];

    const result = {} as Record<AllDimension, any>;

    // D1-D5: Core dimensions
    for (const dim of Object.keys(DIMENSIONS) as Dimension[]) {
      const planets = transits
        .filter(t => t.gate === gate && PLANET_TO_DIMENSION[t.planet] === dim)
        .map(t => t.planet);

      const dimActivation = centerNode.dimensionalState[dim];
      const isActive = dimActivation > 0.3 || planets.length > 0;

      const baseExpression = GATE_EXPRESSIONS[gate]?.[dim] || `Gate ${gate} in ${dim}`;
      const narrative = this.generateNarrative(gate, dim, planets, graph, baseExpression);

      result[dim] = {
        expression: baseExpression,
        active: isActive,
        strength: Math.min(1, dimActivation + planets.length * 0.15),
        planets,
        narrative,
      };
    }

    // D6: Trajectory (North Node / South Node)
    const northNode = transits.find(t => t.planet === 'NorthNode');
    const southNode = transits.find(t => t.planet === 'SouthNode');
    const trajectoryActive = northNode?.gate === gate || southNode?.gate === gate;
    const trajectoryStrength = trajectoryActive ? 0.8 : 0.2;

    result['D6'] = {
      expression: `Your trajectory toward ${northNode ? `Gate ${northNode.gate}` : 'the unknown'}`,
      active: trajectoryActive,
      strength: trajectoryStrength,
      planets: ['NorthNode', 'SouthNode'].filter(p => transits.find(t => t.planet === p && t.gate === gate)?.planet === p) as Planet[],
      narrative: trajectoryActive
        ? `You are being pulled toward ${GATE_EXPRESSIONS[northNode!.gate]?.D1 || 'new territory'}. Your past (Gate ${southNode?.gate}) is releasing you.`
        : 'Your trajectory is stable. No major nodal activation.',
    };

    // D7: Persona (Profile)
    const profile = graph.profile; // e.g., "1/3"
    const [conscious, unconscious] = profile.split('/').map(Number);
    const personaActive = this.isPersonaActive(gate, conscious, unconscious);

    result['D7'] = {
      expression: `Your ${profile} persona expressing Gate ${gate}`,
      active: personaActive,
      strength: personaActive ? 0.7 : 0.1,
      planets: [],
      narrative: personaActive
        ? `As a ${profile}, you wear this gate as a mask. Others see it before they see you.`
        : `This gate is not part of your ${profile} persona. It expresses more privately.`,
    };

    return result;
  }

  // Express all active gates for a user through all dimensions
  expressFullProfile(
    graph: PersonalGraph,
    date: Date = new Date()
  ): Array<{
    gate: GateNumber;
    center: CenterName;
    dimensions: Record<AllDimension, {
      expression: string;
      active: boolean;
      strength: number;
      planets: Planet[];
      narrative: string;
    }>;
    dominantDimension: AllDimension;
  }> {
    const allGates = new Set<GateNumber>();
    for (const center of Object.values(graph.centers)) {
      for (const gate of center.activeGates) {
        allGates.add(gate);
      }
    }

    const results = [];
    for (const gate of allGates) {
      const dims = this.expressGate(gate, graph, date);

      // Find dominant dimension
      let dominant: AllDimension = 'D1';
      let maxStrength = 0;
      for (const [dim, data] of Object.entries(dims)) {
        if (data.strength > maxStrength) {
          maxStrength = data.strength;
          dominant = dim as AllDimension;
        }
      }

      results.push({
        gate,
        center: this.getGateCenter(gate),
        dimensions: dims,
        dominantDimension: dominant,
      });
    }

    return results.sort((a, b) => {
      const aMax = Math.max(...Object.values(a.dimensions).map(d => d.strength));
      const bMax = Math.max(...Object.values(b.dimensions).map(d => d.strength));
      return bMax - aMax;
    });
  }

  // Generate a personalized narrative for a specific gate-dimension combination
  private generateNarrative(
    gate: GateNumber,
    dim: Dimension,
    planets: Planet[],
    graph: PersonalGraph,
    baseExpression: string
  ): string {
    const dimInfo = DIMENSIONS[dim];
    const center = this.getGateCenter(gate);
    const centerNode = graph.centers[center];

    const parts: string[] = [];

    // Opening: dimensional keynote
    parts.push(`${dimInfo.keynote} through ${dimInfo.name}:`);

    // Core expression
    parts.push(baseExpression);

    // Planetary influence
    if (planets.length > 0) {
      const planetNames = planets.join(', ');
      parts.push(`Activated by ${planetNames}.`);
    }

    // Center state
    if (centerNode.defined) {
      parts.push(`This is your consistent ${center} energy.`);
    } else {
      parts.push(`You are borrowing this ${center} energy.`);
    }

    // Dimensional sense
    parts.push(`Sense it through ${dimInfo.sense}.`);

    return parts.join(' ');
  }

  private getGateCenter(gate: GateNumber): CenterName {
    return GATE_TO_CENTER[gate];
  }

  private isPersonaActive(gate: GateNumber, conscious: number, unconscious: number): boolean {
    // Simplified: certain gates are more "persona" based on profile
    // In full implementation, this would use the complete profile-gate mapping
    const personaGates = [10, 20, 31, 41, 45, 56]; // commonly persona-expressed gates
    return personaGates.includes(gate);
  }

  // Get real-time transit summary for a user
  async getTransitSummary(graph: PersonalGraph): Promise<{
    date: string;
    activeTransits: Array<{
      planet: Planet;
      gate: GateNumber;
      dimension: Dimension;
      affectsCenter: CenterName;
      isPersonal: boolean; // is this gate in the user's chart?
      narrative: string;
    }>;
    emergentChannels: string[];
    recommendedFocus: AllDimension;
  }> {
    const transits = await this.transitTracker.getCurrentTransits();
    const userGates = new Set<GateNumber>();
    for (const center of Object.values(graph.centers)) {
      for (const gate of center.activeGates) {
        userGates.add(gate);
      }
    }

    const activeTransits = transits.map(t => {
      const center = this.getGateCenter(t.gate);
      const isPersonal = userGates.has(t.gate);
      const dim = PLANET_TO_DIMENSION[t.planet];

      return {
        planet: t.planet,
        gate: t.gate,
        dimension: dim,
        affectsCenter: center,
        isPersonal,
        narrative: isPersonal
          ? `${t.planet} is activating your Gate ${t.gate} in ${center}. ${DIMENSIONS[dim].keynote}.`
          : `${t.planet} is activating Gate ${t.gate} in ${center}. You don't have this gate — observe how others express it.`,
      };
    }).sort((a, b) => (b.isPersonal ? 1 : 0) - (a.isPersonal ? 1 : 0));

    // Find emergent channels
    const emergentChannels = this.findEmergentChannels(graph, transits);

    // Recommended focus dimension
    const dimCounts: Record<AllDimension, number> = {} as any;
    for (const t of activeTransits) {
      if (t.isPersonal) {
        dimCounts[t.dimension] = (dimCounts[t.dimension] || 0) + 1;
      }
    }

    let recommendedFocus: AllDimension = 'D1';
    let maxCount = 0;
    for (const [dim, count] of Object.entries(dimCounts)) {
      if (count > maxCount) {
        maxCount = count;
        recommendedFocus = dim as AllDimension;
      }
    }

    return {
      date: new Date().toISOString(),
      activeTransits,
      emergentChannels,
      recommendedFocus,
    };
  }

  private findEmergentChannels(graph: PersonalGraph, transits: PlanetPosition[]): string[] {
    // A channel emerges when both gates are activated (one by transit, one by natal)
    // Simplified: check for gate pairs that are both active
    const activeGates = new Set<GateNumber>();
    for (const center of Object.values(graph.centers)) {
      for (const gate of center.activeGates) {
        activeGates.add(gate);
      }
    }
    for (const t of transits) {
      activeGates.add(t.gate);
    }

    // Would check against CHANNELS here
    // For now, return placeholder
    return [];
  }
}

// ── Singleton ────────────────────────────────────────────────────────────────
export const dimensionalExpressionEngine = new DimensionalExpressionEngine();
