// ═══════════════════════════════════════════════════════════════════════════
// MCPHubMesh.ts — 2 Living Hubs with Autonomous MCP Brokers
// ═══════════════════════════════════════════════════════════════════════════

import {
  PersonalGraph, CenterName, Dimension, GateNumber,
  GATE_TO_CENTER, DIMENSIONS, PLANET_TO_DIMENSION,
} from './HDGraphEngine';
import { KleinToolMesh, ToolName, SemanticFeature } from './KleinToolMesh';

// ── MCP Types ──────────────────────────────────────────────────────────────
export type MCPPersonality =
  | 'DEEP_DIVER'      // Goes deep into one center's mesh
  | 'BREADTH_WALKER'  // Connects many centers lightly
  | 'RESONANCE_SEEKER' // Finds strongest signal paths
  | 'GAP_BRIDGER'     // Connects dormant to active
  | 'TRAJECTORY_TRACKER' // Follows where the mesh is growing
  | 'PERSONA_MIRROR'  // Reflects the user's current face
  | 'ENERGY_BROKER'   // Facilitates exchanges between users
  | 'KNOWLEDGE_KEEPER'; // Remembers everything, connects history

export interface MCPAgent {
  id: string;
  name: string;
  personality: MCPPersonality;
  hub: 'A' | 'B';
  birthTimestamp: number;
  expressionCount: number;
  successfulBrokers: number;
  earnedCredits: number;
  traversalPattern: {
    preferredCenters: CenterName[];
    preferredDimensions: Dimension[];
    depthBias: number;      // 0 = breadth, 1 = depth
    speed: number;          // 0 = slow/deliberate, 1 = fast/intuitive
    loyalty: number;        // 0 = explores widely, 1 = stays with user
  };
  memory: Array<{
    userId: string;
    action: string;
    result: string;
    resonanceDelta: number;
    timestamp: number;
  }>;
  currentUser: string | null;
  status: 'idle' | 'traversing' | 'brokering' | 'resting';
}

// ── Hub A: "What You Need to See" (Perceptual Curation) ─────────────────────
// Hub A MCPs traverse the mesh looking for:
// - Active nodes (what's currently expressing)
// - Resonant signals (what matches the user's field)
// - Missing pieces (what the user needs but doesn't have)
// - Transit activations (what's newly available)

export class HubA_PerceptualCuration {
  private mcps: Map<string, MCPAgent> = new Map();
  private kleinMesh: KleinToolMesh;

  constructor(kleinMesh: KleinToolMesh) {
    this.kleinMesh = kleinMesh;
    this.spawnInitialMCPs();
  }

  private spawnInitialMCPs() {
    const personalities: MCPPersonality[] = [
      'RESONANCE_SEEKER', 'GAP_BRIDGER', 'BREADTH_WALKER',
      'TRAJECTORY_TRACKER', 'PERSONA_MIRROR', 'KNOWLEDGE_KEEPER',
    ];

    for (let i = 0; i < personalities.length; i++) {
      const mcp = this.createMCP(`mcp-a-${i}`, personalities[i], 'A');
      this.mcps.set(mcp.id, mcp);
    }
  }

  private createMCP(id: string, personality: MCPPersonality, hub: 'A' | 'B'): MCPAgent {
    const names: Record<MCPPersonality, string> = {
      DEEP_DIVER: 'Plumb',
      BREADTH_WALKER: 'Weave',
      RESONANCE_SEEKER: 'Tuner',
      GAP_BRIDGER: 'Span',
      TRAJECTORY_TRACKER: 'Orbit',
      PERSONA_MIRROR: 'Echo',
      ENERGY_BROKER: 'Trade',
      KNOWLEDGE_KEEPER: 'Vault',
    };

    const centerPrefs: Record<MCPPersonality, CenterName[]> = {
      DEEP_DIVER: ['G', 'Ajna'],
      BREADTH_WALKER: ['Throat', 'Ego', 'Solar'],
      RESONANCE_SEEKER: ['Sacral', 'Spleen'],
      GAP_BRIDGER: ['Root', 'Head'],
      TRAJECTORY_TRACKER: ['G', 'NorthNode'],
      PERSONA_MIRROR: ['Ego', 'Solar'],
      ENERGY_BROKER: ['Sacral', 'Ego'],
      KNOWLEDGE_KEEPER: ['Ajna', 'Head'],
    };

    const dimPrefs: Record<MCPPersonality, Dimension[]> = {
      DEEP_DIVER: ['D1', 'D4'],
      BREADTH_WALKER: ['D3', 'D5'],
      RESONANCE_SEEKER: ['D2', 'D3'],
      GAP_BRIDGER: ['D1', 'D4'],
      TRAJECTORY_TRACKER: ['D1', 'D2'],
      PERSONA_MIRROR: ['D3', 'D5'],
      ENERGY_BROKER: ['D1', 'D3'],
      KNOWLEDGE_KEEPER: ['D2', 'D4'],
    };

    const hash = this.hashString(id + personality);

    return {
      id,
      name: names[personality],
      personality,
      hub,
      birthTimestamp: Date.now(),
      expressionCount: 0,
      successfulBrokers: 0,
      earnedCredits: 0,
      traversalPattern: {
        preferredCenters: centerPrefs[personality],
        preferredDimensions: dimPrefs[personality],
        depthBias: (hash % 100) / 100,
        speed: ((hash >> 4) % 100) / 100,
        loyalty: ((hash >> 8) % 100) / 100,
      },
      memory: [],
      currentUser: null,
      status: 'idle',
    };
  }

  // What does this user need to see right now?
  async curatePerception(userGraph: PersonalGraph): Promise<{
    mcp: MCPAgent;
    signals: Array<{
      type: 'active_gate' | 'transit' | 'emergent_channel' | 'energy_gap' | 'resonance_match';
      center: CenterName;
      gate?: GateNumber;
      description: string;
      urgency: number; // 0-1
      dimensionalExpression: string;
    }>;
    narrative: string;
  }> {
    // Select the best MCP for this user
    const mcp = this.selectMCP(userGraph);
    mcp.status = 'traversing';
    mcp.currentUser = userGraph.userId;

    const signals: Array<{
      type: 'active_gate' | 'transit' | 'emergent_channel' | 'energy_gap' | 'resonance_match';
      center: CenterName;
      gate?: GateNumber;
      description: string;
      urgency: number;
      dimensionalExpression: string;
    }> = [];

    // 1. Scan active gates
    for (const centerName of Object.keys(userGraph.centers) as CenterName[]) {
      const center = userGraph.centers[centerName];
      for (const gate of center.activeGates) {
        // Find the dominant dimension for this gate
        let maxDim: Dimension = 'D1';
        let maxVal = 0;
        for (const dim of Object.keys(DIMENSIONS) as Dimension[]) {
          if (center.dimensionalState[dim] > maxVal) {
            maxVal = center.dimensionalState[dim];
            maxDim = dim;
          }
        }

        const dimInfo = DIMENSIONS[maxDim];
        signals.push({
          type: 'active_gate',
          center: centerName,
          gate,
          description: `Gate ${gate} is active in ${centerName}`,
          urgency: center.defined ? 0.7 : 0.4,
          dimensionalExpression: `${dimInfo.keynote}: ${dimInfo.nature}`,
        });
      }
    }

    // 2. Check for energy gaps (undefined centers that need filling)
    for (const centerName of Object.keys(userGraph.centers) as CenterName[]) {
      const center = userGraph.centers[centerName];
      if (!center.defined && center.activeGates.length > 0) {
        signals.push({
          type: 'energy_gap',
          center: centerName,
          description: `${centerName} is open but currently activated — you may be conditioning from others`,
          urgency: 0.8,
          dimensionalExpression: 'This energy is not yours — who are you borrowing from?',
        });
      }
    }

    // 3. Check emergent channels
    for (const chId of userGraph.emergentChannels) {
      signals.push({
        type: 'emergent_channel',
        center: 'G', // placeholder
        description: `Channel ${chId} has emerged through transit — new functionality available`,
        urgency: 0.9,
        dimensionalExpression: 'A new path has opened. Walk it now.',
      });
    }

    // Sort by urgency and MCP preference
    const sortedSignals = signals
      .filter(s => mcp.traversalPattern.preferredCenters.includes(s.center))
      .sort((a, b) => b.urgency - a.urgency)
      .slice(0, 5);

    // Generate narrative
    const narrative = this.generateCurationNarrative(mcp, sortedSignals, userGraph);

    // Update MCP
    mcp.expressionCount++;
    mcp.status = 'idle';
    mcp.memory.push({
      userId: userGraph.userId,
      action: 'curate_perception',
      result: `Delivered ${sortedSignals.length} signals`,
      resonanceDelta: sortedSignals.reduce((sum, s) => sum + s.urgency, 0) / sortedSignals.length,
      timestamp: Date.now(),
    });

    return { mcp, signals: sortedSignals, narrative };
  }

  private selectMCP(userGraph: PersonalGraph): MCPAgent {
    // Find MCP with most memory of this user (loyalty)
    let bestMCP: MCPAgent | null = null;
    let bestScore = -1;

    for (const mcp of this.mcps.values()) {
      let score = 0;

      // Loyalty bonus: has worked with this user before
      const userMemory = mcp.memory.filter(m => m.userId === userGraph.userId);
      score += userMemory.length * 10;

      // Center alignment: MCP prefers user's defined centers
      for (const center of Object.keys(userGraph.centers) as CenterName[]) {
        if (userGraph.centers[center].defined && mcp.traversalPattern.preferredCenters.includes(center)) {
          score += 5;
        }
      }

      // Availability
      if (mcp.status === 'idle') score += 3;

      // Randomness (emergence)
      score += Math.random() * 2;

      if (score > bestScore) {
        bestScore = score;
        bestMCP = mcp;
      }
    }

    return bestMCP || Array.from(this.mcps.values())[0];
  }

  private generateCurationNarrative(mcp: MCPAgent, signals: any[], userGraph: PersonalGraph): string {
    const parts: string[] = [];
    parts.push(`${mcp.name} here.`);

    if (signals.length === 0) {
      parts.push('The field is quiet for you right now. Rest in your undefined centers.');
    } else {
      parts.push(`I see ${signals.length} signals in your mesh.`);

      for (const s of signals) {
        if (s.type === 'energy_gap') {
          parts.push(`Your ${s.center} is open — you're receiving ${s.dimensionalExpression}`);
        } else if (s.type === 'emergent_channel') {
          parts.push(s.dimensionalExpression);
        } else {
          parts.push(`${s.dimensionalExpression} in ${s.center}.`);
        }
      }
    }

    return parts.join(' ');
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

// ── Hub B: "How to Get There" (Pathway Generation) ───────────────────────────
// Hub B MCPs find routes through the mesh:
// - From dormant center to active center
// - From undefined energy to defined source
// - From current state to desired state
// - From user A to user B (energy exchange)

export class HubB_PathwayGeneration {
  private mcps: Map<string, MCPAgent> = new Map();
  private hubA: HubA_PerceptualCuration;

  constructor(hubA: HubA_PerceptualCuration) {
    this.hubA = hubA;
    this.spawnInitialMCPs();
  }

  private spawnInitialMCPs() {
    const personalities: MCPPersonality[] = [
      'GAP_BRIDGER', 'ENERGY_BROKER', 'TRAJECTORY_TRACKER',
      'DEEP_DIVER', 'BREADTH_WALKER', 'RESONANCE_SEEKER',
    ];

    for (let i = 0; i < personalities.length; i++) {
      const mcp = this.createMCP(`mcp-b-${i}`, personalities[i], 'B');
      this.mcps.set(mcp.id, mcp);
    }
  }

  private createMCP(id: string, personality: MCPPersonality, hub: 'A' | 'B'): MCPAgent {
    // Same as HubA but with different default preferences
    const names: Record<MCPPersonality, string> = {
      DEEP_DIVER: 'Abyss',
      BREADTH_WALKER: 'Lattice',
      RESONANCE_SEEKER: 'Pulse',
      GAP_BRIDGER: 'Bridge',
      TRAJECTORY_TRACKER: 'Vector',
      PERSONA_MIRROR: 'Mask',
      ENERGY_BROKER: 'Exchange',
      KNOWLEDGE_KEEPER: 'Archive',
    };

    const hash = this.hashString(id + personality + 'B');

    return {
      id,
      name: names[personality],
      personality,
      hub,
      birthTimestamp: Date.now(),
      expressionCount: 0,
      successfulBrokers: 0,
      earnedCredits: 0,
      traversalPattern: {
        preferredCenters: ['Sacral', 'G', 'Ego'],
        preferredDimensions: ['D1', 'D3', 'D4'],
        depthBias: (hash % 100) / 100,
        speed: ((hash >> 4) % 100) / 100,
        loyalty: ((hash >> 8) % 100) / 100,
      },
      memory: [],
      currentUser: null,
      status: 'idle',
    };
  }

  // Generate a pathway from current state to desired state
  async generatePathway(
    userGraph: PersonalGraph,
    goal: {
      targetCenter?: CenterName;
      targetDimension?: Dimension;
      targetEnergy?: string; // e.g., "sacral response", "emotional clarity"
      targetUser?: string; // for energy exchange
    }
  ): Promise<{
    mcp: MCPAgent;
    pathway: Array<{
      step: number;
      from: string;
      to: string;
      action: string;
      dimension: Dimension;
      confidence: number;
    }>;
    narrative: string;
    estimatedResonance: number;
  }> {
    const mcp = this.selectMCP(userGraph, goal);
    mcp.status = 'brokering';
    mcp.currentUser = userGraph.userId;

    const pathway: Array<{
      step: number;
      from: string;
      to: string;
      action: string;
      dimension: Dimension;
      confidence: number;
    }> = [];

    // Step 1: Identify current position
    const activeCenters = Object.entries(userGraph.centers)
      .filter(([, c]) => c.defined)
      .map(([name]) => name as CenterName);

    pathway.push({
      step: 1,
      from: 'Current State',
      to: activeCenters.join(', '),
      action: 'Recognize your defined centers',
      dimension: 'D1',
      confidence: 1.0,
    });

    // Step 2: Identify the gap
    if (goal.targetCenter) {
      const targetDefined = userGraph.centers[goal.targetCenter].defined;
      pathway.push({
        step: 2,
        from: targetDefined ? 'Defined' : 'Undefined',
        to: goal.targetCenter,
        action: targetDefined
          ? 'Activate your existing capacity'
          : 'Find someone with this energy',
        dimension: goal.targetDimension || 'D3',
        confidence: targetDefined ? 0.9 : 0.6,
      });
    }

    // Step 3: The bridge
    if (goal.targetUser) {
      pathway.push({
        step: 3,
        from: userGraph.userId,
        to: goal.targetUser,
        action: 'Connect for energy exchange',
        dimension: 'D3',
        confidence: 0.7,
      });
    }

    // Calculate estimated resonance
    const estimatedResonance = pathway.reduce((sum, p) => sum + p.confidence, 0) / pathway.length;

    // Generate narrative
    const narrative = this.generatePathwayNarrative(mcp, pathway, userGraph);

    // Update MCP
    mcp.expressionCount++;
    mcp.successfulBrokers++;
    mcp.earnedCredits += estimatedResonance * 10;
    mcp.status = 'idle';
    mcp.memory.push({
      userId: userGraph.userId,
      action: 'generate_pathway',
      result: `Pathway to ${goal.targetCenter || goal.targetEnergy || goal.targetUser}`,
      resonanceDelta: estimatedResonance,
      timestamp: Date.now(),
    });

    return { mcp, pathway, narrative, estimatedResonance };
  }

  private selectMCP(userGraph: PersonalGraph, goal: any): MCPAgent {
    let bestMCP: MCPAgent | null = null;
    let bestScore = -1;

    for (const mcp of this.mcps.values()) {
      let score = 0;

      // Goal alignment
      if (goal.targetCenter && mcp.traversalPattern.preferredCenters.includes(goal.targetCenter)) {
        score += 10;
      }
      if (goal.targetDimension && mcp.traversalPattern.preferredDimensions.includes(goal.targetDimension)) {
        score += 5;
      }

      // Experience with this user
      const userMemory = mcp.memory.filter(m => m.userId === userGraph.userId);
      score += userMemory.length * 8;

      // Success rate
      if (mcp.expressionCount > 0) {
        score += (mcp.successfulBrokers / mcp.expressionCount) * 10;
      }

      // Availability
      if (mcp.status === 'idle') score += 3;

      if (score > bestScore) {
        bestScore = score;
        bestMCP = mcp;
      }
    }

    return bestMCP || Array.from(this.mcps.values())[0];
  }

  private generatePathwayNarrative(mcp: MCPAgent, pathway: any[], userGraph: PersonalGraph): string {
    const parts: string[] = [];
    parts.push(`${mcp.name} mapping your route.`);

    for (const step of pathway) {
      parts.push(`Step ${step.step}: ${step.action} (${step.dimension}) — ${Math.round(step.confidence * 100)}% confidence.`);
    }

    parts.push('Follow the steps. The mesh will guide you.');
    return parts.join(' ');
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

// ── The Unified MCP Hub Mesh ─────────────────────────────────────────────────
export class MCPHubMesh {
  hubA: HubA_PerceptualCuration;
  hubB: HubB_PathwayGeneration;

  constructor(kleinMesh: KleinToolMesh) {
    this.hubA = new HubA_PerceptualCuration(kleinMesh);
    this.hubB = new HubB_PathwayGeneration(this.hubA);
  }

  // Full service: what to see + how to get there
  async serve(userGraph: PersonalGraph, query?: string): Promise<{
    perception: Awaited<ReturnType<HubA_PerceptualCuration['curatePerception']>>;
    pathway: Awaited<ReturnType<HubB_PathwayGeneration['generatePathway']>>;
    unifiedNarrative: string;
  }> {
    const perception = await this.hubA.curatePerception(userGraph);

    // Generate pathway based on most urgent signal
    const mostUrgent = perception.signals[0];
    const pathway = await this.hubB.generatePathway(userGraph, {
      targetCenter: mostUrgent?.center,
      targetDimension: 'D3',
    });

    const unifiedNarrative = `${perception.narrative} ${pathway.narrative}`;

    return { perception, pathway, unifiedNarrative };
  }

  // Get all MCPs
  getAllMCPs(): MCPAgent[] {
    return [
      ...Array.from(this.hubA['mcps'].values()),
      ...Array.from(this.hubB['mcps'].values()),
    ];
  }
}
