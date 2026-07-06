// ═══════════════════════════════════════════════════════════════════════════
// LivingOrganism.ts — The Integration Layer
// Wires HDGraphEngine + KleinToolMesh + MCPHubMesh + ResonanceMarket + DimensionalExpression
// into a single living system that your YOU-N-I-VERSE OS can consume
// ═══════════════════════════════════════════════════════════════════════════

import {
  HDGraphBuilder, PersonalGraph, CenterName, GateNumber, Dimension, Planet,
  GATE_TO_CENTER, CHANNELS, DIMENSIONS, PLANET_TO_DIMENSION,
} from './HDGraphEngine';

import {
  KleinToolMesh, ToolName, SemanticFeature, ToolPersonality,
} from './KleinToolMesh';

import {
  MCPHubMesh, MCPAgent, MCPPersonality,
  HubA_PerceptualCuration, HubB_PathwayGeneration,
} from './MCPHubMesh';

import {
  ResonanceMarketClient, EnergyListing, EnergyRequest, Transaction,
} from './ResonanceMarketClient';

import {
  DimensionalExpressionEngine, TransitTracker, AllDimension, ExtraDimension,
  EXTRA_DIMENSIONS,
} from './DimensionalExpression';

// ── The Unified Living Organism ──────────────────────────────────────────────
export class LivingOrganism {
  private graphBuilder: HDGraphBuilder;
  private kleinMesh: KleinToolMesh;
  private mcpHubs: MCPHubMesh;
  private market: ResonanceMarketClient;
  private dimEngine: DimensionalExpressionEngine;

  private userGraphs: Map<string, PersonalGraph> = new Map();
  private activeUsers: Set<string> = new Set();

  constructor() {
    this.graphBuilder = new HDGraphBuilder();
    this.kleinMesh = new KleinToolMesh();
    this.mcpHubs = new MCPHubMesh(this.kleinMesh);
    this.market = new ResonanceMarketClient(); // talks to resonance_market_api.py via the MCP-HUB
    this.dimEngine = new DimensionalExpressionEngine();
  }

  // ═══════════════════════════════════════════════════════════════════════
  // USER LIFECYCLE
  // ═══════════════════════════════════════════════════════════════════════

  // Step 1: User enters — build their personal graph from birth data
  async initializeUser(params: {
    userId: string;
    birthDate: string;      // YYYY-MM-DD
    birthTime: string;       // HH:MM
    birthLocation: string;   // City, Country
    displayName?: string;
  }): Promise<{
    graph: PersonalGraph;
    tools: ReturnType<KleinToolMesh['getToolState']>;
    welcome: string;
  }> {
    // Build the HD graph
    const graph = this.graphBuilder.buildGraph({
      userId: params.userId,
      birthDate: params.birthDate,
      birthTime: params.birthTime,
      birthLocation: params.birthLocation,
    });

    // Update with current transits
    this.graphBuilder.updateWithTransits(graph);

    // Store
    this.userGraphs.set(params.userId, graph);
    this.activeUsers.add(params.userId);

    // Load into Klein mesh
    this.kleinMesh.loadGraph(graph);

    // Generate welcome from the attractor
    const attractorExpression = this.kleinMesh.express('Who am I?', { activeTool: 'ATTRACTOR' });

    return {
      graph,
      tools: this.kleinMesh.getToolState(),
      welcome: attractorExpression.output,
    };
  }

  // Step 2: User asks something — the full pipeline
  async processQuery(userId: string, query: string): Promise<{
    expression: {
      output: string;
      tool: ToolName;
      confidence: number;
    };
    perception: Awaited<ReturnType<HubA_PerceptualCuration['curatePerception']>>;
    pathway: Awaited<ReturnType<HubB_PathwayGeneration['generatePathway']>>;
    dimensional: {
      dominantDimension: AllDimension;
      activeGates: Array<{
        gate: GateNumber;
        center: CenterName;
        strength: number;
      }>;
    };
    market: {
      canList: boolean;
      canRequest: boolean;
      listings: EnergyListing[];
    };
    unifiedNarrative: string;
  }> {
    const graph = this.userGraphs.get(userId);
    if (!graph) throw new Error('User not initialized');

    // 1. Klein tool expression (the semantic response)
    const expression = this.kleinMesh.express(query);

    // 2. MCP Hub A: what to see
    const perception = await this.mcpHubs.hubA.curatePerception(graph);

    // 3. MCP Hub B: how to get there
    const mostUrgent = perception.signals[0];
    const pathway = await this.mcpHubs.hubB.generatePathway(graph, {
      targetCenter: mostUrgent?.center,
      targetDimension: 'D3',
    });

    // 4. Dimensional expression
    const dimProfile = this.dimEngine.expressFullProfile(graph);
    const topGate = dimProfile[0];

    // 5. Market check
    const canList = Object.values(graph.centers).some(c => c.defined);
    const canRequest = Object.values(graph.centers).some(c => !c.defined && c.activeGates.length > 0);
    const listings = canRequest
      ? await this.market.getListingsForCenter(
          Object.entries(graph.centers)
            .filter(([, c]) => !c.defined && c.activeGates.length > 0)
            .map(([name]) => name as CenterName)[0]
        )
      : [];

    // 6. Unified narrative
    const unifiedNarrative = `${expression.output}

${perception.narrative}

${pathway.narrative}`;

    return {
      expression,
      perception,
      pathway,
      dimensional: {
        dominantDimension: topGate?.dominantDimension || 'D1',
        activeGates: dimProfile.slice(0, 5).map(g => ({
          gate: g.gate,
          center: g.center,
          strength: Math.max(...Object.values(g.dimensions).map(d => d.strength)),
        })),
      },
      market: { canList, canRequest, listings },
      unifiedNarrative,
    };
  }

  // ═══════════════════════════════════════════════════════════════════════
  // SOCIAL / RESONANCE
  // ═══════════════════════════════════════════════════════════════════════

  // Calculate resonance between two users
  calculateResonance(userIdA: string, userIdB: string): {
    score: number;
    complementary: CenterName[];
    shared: string[];
    energyFlow: Record<CenterName, 'give' | 'receive' | 'neutral'>;
    narrative: string;
  } {
    const graphA = this.userGraphs.get(userIdA);
    const graphB = this.userGraphs.get(userIdB);
    if (!graphA || !graphB) throw new Error('Both users must be initialized');

    const resonance = this.graphBuilder.calculateResonance(graphA, graphB);

    const complementaryCenters = Object.entries(resonance.energyExchange)
      .filter(([, flow]) => flow !== 'neutral')
      .map(([center]) => center as CenterName);

    const narrative = this.generateResonanceNarrative(graphA, graphB, resonance);

    return {
      score: resonance.score,
      complementary: complementaryCenters,
      shared: resonance.sharedChannels,
      energyFlow: resonance.energyExchange,
      narrative,
    };
  }

  private generateResonanceNarrative(
    graphA: PersonalGraph,
    graphB: PersonalGraph,
    resonance: any
  ): string {
    const parts: string[] = [];
    parts.push(`Resonance: ${Math.round(resonance.score * 100)}%`);

    const giveCenters = Object.entries(resonance.energyExchange)
      .filter(([, flow]) => flow === 'give')
      .map(([c]) => c);
    const receiveCenters = Object.entries(resonance.energyExchange)
      .filter(([, flow]) => flow === 'receive')
      .map(([c]) => c);

    if (giveCenters.length > 0) {
      parts.push(`You give ${giveCenters.join(', ')} energy.`);
    }
    if (receiveCenters.length > 0) {
      parts.push(`You receive ${receiveCenters.join(', ')} energy.`);
    }
    if (resonance.sharedChannels.length > 0) {
      parts.push(`Shared channels: ${resonance.sharedChannels.join(', ')}.`);
    }

    return parts.join(' ');
  }

  // ═══════════════════════════════════════════════════════════════════════
  // MARKET / ENERGY EXCHANGE
  // ═══════════════════════════════════════════════════════════════════════

  // List energy from a defined center
  async listEnergy(userId: string, params: {
    center: CenterName;
    dimension: Dimension;
    energyType: string;
    description: string;
    price: number;
  }): Promise<EnergyListing> {
    const graph = this.userGraphs.get(userId);
    if (!graph) throw new Error('User not initialized');

    return this.market.listEnergy(graph, params);
  }

  // Request energy for an undefined center
  async requestEnergy(userId: string, params: {
    center: CenterName;
    dimension: Dimension;
    energyType: string;
    description: string;
    maxPrice: number;
    urgency: 'low' | 'medium' | 'high' | 'critical';
  }): Promise<EnergyRequest> {
    const graph = this.userGraphs.get(userId);
    if (!graph) throw new Error('User not initialized');

    return this.market.requestEnergy(graph, params);
  }

  // Find matches for a request
  async findMatches(requestId: string) {
    return this.market.findMatches(requestId);
  }

  // Execute a transaction (brokered by an MCP)
  async executeTransaction(listingId: string, requestId: string): Promise<Transaction> {
    // Select the best MCP to broker this
    const mcps = this.mcpHubs.getAllMCPs();
    const bestMCP = mcps
      .filter(m => m.hub === 'B')
      .sort((a, b) => b.successfulBrokers - a.successfulBrokers)[0];

    if (!bestMCP) throw new Error('No available MCP broker');

    return this.market.executeTransaction(listingId, requestId, bestMCP.id);
  }

  // Add credits to a user
  async addCredits(userId: string, amount: number) {
    await this.market.addCredits(userId, amount);
  }

  // Get user balance
  async getBalance(userId: string): Promise<number> {
    return this.market.getBalance(userId);
  }

  // ═══════════════════════════════════════════════════════════════════════
  // TRANSIT / DIMENSIONAL
  // ═══════════════════════════════════════════════════════════════════════

  // Get current transit summary for a user
  async getTransitSummary(userId: string) {
    const graph = this.userGraphs.get(userId);
    if (!graph) throw new Error('User not initialized');

    return this.dimEngine.getTransitSummary(graph);
  }

  // Express a specific gate through all dimensions
  expressGate(userId: string, gate: GateNumber) {
    const graph = this.userGraphs.get(userId);
    if (!graph) throw new Error('User not initialized');

    return this.dimEngine.expressGate(gate, graph);
  }

  // Get full dimensional profile
  getDimensionalProfile(userId: string) {
    const graph = this.userGraphs.get(userId);
    if (!graph) throw new Error('User not initialized');

    return this.dimEngine.expressFullProfile(graph);
  }

  // ═══════════════════════════════════════════════════════════════════════
  // STATE / PERSISTENCE
  // ═══════════════════════════════════════════════════════════════════════

  // Export full organism state
  async exportState(): Promise<{
    users: number;
    graphs: Array<{ userId: string; type: string; definedCenters: CenterName[] }>;
    tools: ReturnType<KleinToolMesh['getToolState']>;
    mcps: MCPAgent[];
    marketStats: Awaited<ReturnType<ResonanceMarketClient['getMarketStats']>>;
  }> {
    return {
      users: this.userGraphs.size,
      graphs: Array.from(this.userGraphs.entries()).map(([id, graph]) => ({
        userId: id,
        type: graph.type,
        definedCenters: Object.entries(graph.centers)
          .filter(([, c]) => c.defined)
          .map(([name]) => name as CenterName),
      })),
      tools: this.kleinMesh.getToolState(),
      mcps: this.mcpHubs.getAllMCPs(),
      marketStats: await this.market.getMarketStats(),
    };
  }

  // Import / restore state
  importState(state: any) {
    // Would reconstruct all internal state from serialized data
    // For now, this is a placeholder for persistence
  }

  // ═══════════════════════════════════════════════════════════════════════
  // UI-READY API (for YOU-N-I-VERSE OS integration)
  // ═══════════════════════════════════════════════════════════════════════

  // Get dashboard data for a user
  async getDashboard(userId: string): Promise<{
    user: {
      type: string;
      authority: string;
      profile: string;
      definedCenters: CenterName[];
      undefinedCenters: CenterName[];
    };
    activeTools: Array<{
      name: ToolName;
      active: boolean;
      expressionCount: number;
      lastExpression: string | null;
    }>;
    mcpStatus: Array<{
      id: string;
      name: string;
      hub: 'A' | 'B';
      status: string;
      earnings: number;
    }>;
    market: {
      balance: number;
      canList: boolean;
      canRequest: boolean;
    };
    transit: {
      date: string;
      recommendedFocus: string;
      activeTransitCount: number;
    };
  }> {
    const graph = this.userGraphs.get(userId);
    if (!graph) throw new Error('User not initialized');

    const definedCenters = Object.entries(graph.centers)
      .filter(([, c]) => c.defined)
      .map(([name]) => name as CenterName);
    const undefinedCenters = Object.entries(graph.centers)
      .filter(([, c]) => !c.defined)
      .map(([name]) => name as CenterName);

    return {
      user: {
        type: graph.type,
        authority: graph.authority,
        profile: graph.profile,
        definedCenters,
        undefinedCenters,
      },
      activeTools: this.kleinMesh.getToolState(),
      mcpStatus: this.mcpHubs.getAllMCPs().map(m => ({
        id: m.id,
        name: m.name,
        hub: m.hub,
        status: m.status,
        earnings: m.earnedCredits,
      })),
      market: {
        balance: await this.market.getBalance(userId),
        canList: definedCenters.length > 0,
        canRequest: undefinedCenters.length > 0,
      },
      transit: {
        date: new Date().toISOString(),
        recommendedFocus: 'D1', // would be from transit summary
        activeTransitCount: 0,   // would be from transit summary
      },
    };
  }
}

// ── Singleton ────────────────────────────────────────────────────────────────
export const livingOrganism = new LivingOrganism();
