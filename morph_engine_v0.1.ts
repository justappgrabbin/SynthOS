/**
 * ╔══════════════════════════════════════════════════════════════════════════╗
 * ║                    MORPH ENGINE v0.1 — Core Substrate                   ║
 * ║     69,120-node Distributed Semantic Mesh with I Ching Type System      ║
 * ║                                                                          ║
 * ║  Architecture: Local-first P2P semantic graph + Neural circuit dispatch  ║
 * ║  Based on: Klein 1973 AutoNovel + Human Design Gates + Dzhanibekov      ║
 * ║  Topology: 64 Gates × 6 Lines × 180 Instances = 69,120 addressable nodes  ║
 * ╚══════════════════════════════════════════════════════════════════════════╝
 */

// ═══════════════════════════════════════════════════════════════════════════
// SECTION 1: BIT-PACKED ADDRESS SPACE & HEXAGRAM PRIMITIVES
// ═══════════════════════════════════════════════════════════════════════════

/** 16-bit packed node address: [Gate:6][Line:3][Changing:1][Instance:6] */
type NodeAddress = number;

const ADDR_GATE_MASK = 0b111111_000_0_000000;
const ADDR_LINE_MASK = 0b000000_111_0_000000;
const ADDR_CHNG_MASK = 0b000000_000_1_000000;
const ADDR_INST_MASK = 0b000000_000_0_111111;

const GATE_SHIFT = 10;
const LINE_SHIFT = 6;
const CHNG_SHIFT = 6; // same as line base, bit 6 is changing flag

/** Pack components into a 16-bit address */
function packAddress(gate: number, line: number, changing: boolean, instance: number): NodeAddress {
    return ((gate & 0x3F) << GATE_SHIFT) |
           ((line & 0x07) << LINE_SHIFT) |
           ((changing ? 1 : 0) << CHNG_SHIFT) |
           (instance & 0x3F);
}

/** Unpack address into components */
function unpackAddress(addr: NodeAddress): { gate: number; line: number; changing: boolean; instance: number } {
    return {
        gate: (addr >> GATE_SHIFT) & 0x3F,
        line: (addr >> LINE_SHIFT) & 0x07,
        changing: ((addr >> CHNG_SHIFT) & 1) === 1,
        instance: addr & 0x3F
    };
}

/** Gate 1-64 → binary hexagram (6 bits, bottom-up lines) */
function gateToHexagram(gate: number): number {
    // King Wen sequence mapping: each gate corresponds to a 6-bit pattern
    // This is a simplified mapping — full I Ching uses specific trigram combinations
    const kingWen: number[] = [
        0b111111,0b000000,0b010001,0b100110,0b010111,0b001000,0b111010,0b101100,
        0b001111,0b111000,0b111011,0b000100,0b101111,0b000010,0b001001,0b100000,
        0b100110,0b011001,0b110000,0b000011,0b100101,0b011010,0b000101,0b101000,
        0b100001,0b011110,0b010100,0b001010,0b011011,0b100100,0b001110,0b110001,
        0b011111,0b111110,0b100010,0b010000,0b101101,0b011100,0b001011,0b110100,
        0b110101,0b001100,0b111001,0b100111,0b000110,0b011000,0b010110,0b101001,
        0b110110,0b001001,0b100101,0b011010,0b100011,0b110110,0b001011,0b110100,
        0b110111,0b001000,0b010011,0b101100,0b001010,0b010101,0b100100,0b011011
    ];
    return kingWen[(gate - 1) % 64] || 0;
}

/** Get trigram (lower or upper 3 bits) from hexagram */
function getTrigram(hexagram: number, upper: boolean): number {
    return upper ? (hexagram >> 3) & 0x07 : hexagram & 0x07;
}

/** Line polarity: Yin (0) or Yang (1) at position 1-6 */
function getLinePolarity(hexagram: number, line: number): 0 | 1 {
    return ((hexagram >> (line - 1)) & 1) as 0 | 1;
}

/** Generate changing line variant (flip the bit at position) */
function changingLineVariant(hexagram: number, line: number): number {
    return hexagram ^ (1 << (line - 1));
}

// ═══════════════════════════════════════════════════════════════════════════
// SECTION 2: CIRCUIT FAMILY ARCHITECTURE & NEURAL DISPATCH
// ═══════════════════════════════════════════════════════════════════════════

enum CircuitFamily {
    UNDERSTANDING = 0x00,  // DFF Base — Generative Logical Projection
    SENSING       = 0x01,  // MC Base  — Generative Experiential Cycle  
    KNOWING       = 0x02,  // LSM Base — Generative Mutative Pulse
    EGO           = 0x03   // HMM Base — Discriminative Boundary/Trust
}

/** Gate-to-Circuit mapping (Human Design circuit families) */
const GATE_CIRCUIT_MAP: Record<number, CircuitFamily> = {
    // Understanding Circuit (Logical, Abstract)
    4: CircuitFamily.UNDERSTANDING, 63: CircuitFamily.UNDERSTANDING,
    17: CircuitFamily.UNDERSTANDING, 62: CircuitFamily.UNDERSTANDING,
    18: CircuitFamily.UNDERSTANDING, 58: CircuitFamily.UNDERSTANDING,
    // Sensing Circuit (Experiential, Cyclical)
    42: CircuitFamily.SENSING, 53: CircuitFamily.SENSING,
    35: CircuitFamily.SENSING, 36: CircuitFamily.SENSING,
    64: CircuitFamily.SENSING, 47: CircuitFamily.SENSING,
    // Knowing Circuit (Intuitive, Acoustic)
    3: CircuitFamily.KNOWING, 60: CircuitFamily.KNOWING,
    61: CircuitFamily.KNOWING, 24: CircuitFamily.KNOWING,
    43: CircuitFamily.KNOWING, 23: CircuitFamily.KNOWING,
    // Ego Circuit (Transactional, Survival)
    21: CircuitFamily.EGO, 45: CircuitFamily.EGO,
    26: CircuitFamily.EGO, 44: CircuitFamily.EGO,
    // Integration Channels (span all circuits)
    34: CircuitFamily.UNDERSTANDING, // Acts as portal
    10: CircuitFamily.SENSING,       // Shape-shifter
    57: CircuitFamily.KNOWING,       // Intuitive reservoir
    20: CircuitFamily.EGO            // Present-moment anchor
};

function getCircuitFamily(gate: number): CircuitFamily {
    return GATE_CIRCUIT_MAP[gate] ?? CircuitFamily.UNDERSTANDING;
}

/** Neural architecture type for each circuit family */
enum NeuralType {
    DFF = 'DFF',   // Deep Feed Forward
    MC  = 'MC',    // Markov Chain
    LSM = 'LSM',   // Liquid State Machine
    HMM = 'HMM',   // Hidden Markov Model
    RBM = 'RBM',   // Restricted Boltzmann Machine
    HN  = 'HN',    // Hopfield Network
    VAE = 'VAE',   // Variational Autoencoder
    DNC = 'DNC',   // Differentiable Neural Computer
    NTM = 'NTM',   // Neural Turing Machine
    DN  = 'DN',    // Deconvolutional Network
    CHMM = 'CHMM', // Continuous HMM
    SHMM = 'SHMM'  // Switching HMM
}

/** Channel-to-Neural mapping (specific channels get specific architectures) */
const CHANNEL_NEURAL_MAP: Record<string, NeuralType> = {
    '63-4': NeuralType.DFF,    // Logic
    '17-62': NeuralType.RBM,   // Acceptance
    '18-58': NeuralType.HN,    // Judgment
    '42-53': NeuralType.MC,    // Maturation
    '35-36': NeuralType.VAE,   // Transitoriness
    '64-47': NeuralType.DNC,   // Abstraction
    '3-60': NeuralType.LSM,    // Mutation
    '61-24': NeuralType.NTM,   // Awareness
    '43-23': NeuralType.DN,    // Structuring
    '21-45': NeuralType.CHMM,  // Money Line
    '26-44': NeuralType.SHMM   // Trickster
};

function getNeuralType(gateA: number, gateB: number): NeuralType {
    const key1 = `${gateA}-${gateB}`;
    const key2 = `${gateB}-${gateA}`;
    return CHANNEL_NEURAL_MAP[key1] || CHANNEL_NEURAL_MAP[key2] || NeuralType.DFF;
}

// ═══════════════════════════════════════════════════════════════════════════
// SECTION 3: SEMANTIC TRIPLE & LOCAL GRAPH SUBSTRATE
// ═══════════════════════════════════════════════════════════════════════════

/** A semantic triple: [Subject] --(Relation)--> [Object]
 *  Relation is encoded as a hexagram gate + line profile */
interface SemanticTriple {
    subject: NodeAddress;      // Source node
    relation: NodeAddress;      // Gate+Line that defines the relation type
    object: NodeAddress;        // Target node
    weight: number;             // Semantic strength (0.0 - 1.0)
    timestamp: number;         // When this triple was established
    epistemicDepth: number;    // Recursion depth (0-3, 3+ triggers flip)
    history: Float32Array;     // Time-series of weight changes (for HMM/MC)
}

/** Local-first agent state — each node manages its own graph */
class AgentGraph {
    private triples: Map<string, SemanticTriple> = new Map();
    private neighbors: Set<NodeAddress> = new Set();
    private tension: number = 0.0;
    private mode: 'PROCESS' | 'TELEPORT' | 'FLIP' = 'PROCESS';
    private activeGates: Set<number> = new Set();
    private circuitBias: CircuitFamily;

    constructor(public readonly address: NodeAddress) {
        const { gate } = unpackAddress(address);
        this.circuitBias = getCircuitFamily(gate);
        this.activeGates.add(gate);
    }

    /** Add or update a semantic triple */
    ingestTriple(triple: SemanticTriple): void {
        const key = `${triple.subject}-${triple.relation}-${triple.object}`;

        // Check for recursive depth overflow
        if (triple.epistemicDepth >= 3) {
            this.tension = Math.min(1.0, this.tension + 0.2);
            if (this.tension > 0.85) {
                this.executeDzhanibekovFlip();
                return;
            }
        }

        // Store with history tracking for temporal circuits
        if (this.triples.has(key)) {
            const existing = this.triples.get(key)!;
            // Append to history (circular buffer behavior)
            const newHistory = new Float32Array(64);
            newHistory.set(existing.history.slice(1));
            newHistory[63] = triple.weight;
            triple.history = newHistory;
        } else {
            triple.history = new Float32Array(64);
            triple.history.fill(triple.weight);
        }

        this.triples.set(key, triple);
        this.neighbors.add(triple.object);

        // Update tension based on cross-circuit connections
        this.updateTension(triple);
    }

    /** Calculate tension from cross-circuit bleed */
    private updateTension(triple: SemanticTriple): void {
        const subjGate = unpackAddress(triple.subject).gate;
        const objGate = unpackAddress(triple.object).gate;
        const subjCircuit = getCircuitFamily(subjGate);
        const objCircuit = getCircuitFamily(objGate);

        if (subjCircuit !== objCircuit) {
            // Cross-circuit connections increase tension
            this.tension += 0.05 * triple.weight;
        } else {
            // Same-circuit connections stabilize
            this.tension *= 0.98;
        }

        this.tension = Math.max(0, Math.min(1, this.tension));

        if (this.tension > 0.85 && this.mode !== 'FLIP') {
            this.executeDzhanibekovFlip();
        }
    }

    /** Execute the Dzhanibekov effect: intermediate axis instability → reorientation */
    private executeDzhanibekovFlip(): void {
        this.mode = 'FLIP';

        const { gate, line } = unpackAddress(this.address);
        const hexagram = gateToHexagram(gate);

        // Flip the changing line
        const newHexagram = changingLineVariant(hexagram, line);
        const newGate = hexagramToGate(newHexagram);

        // Switch circuit family
        this.circuitBias = getCircuitFamily(newGate);

        // Apply spin-state operators
        this.applySpinStateOperators();

        // Reset tension after flip (metastable → new attractor)
        this.tension = 0.0;
        this.mode = 'PROCESS';

        console.log(`[FLIP] Node ${this.address.toString(16)}: Gate ${gate}→${newGate}, Circuit ${CircuitFamily[this.circuitBias]}`);
    }

    /** Apply changing-line computational operators */
    private applySpinStateOperators(): void {
        // 1. Gradient Sensitivity Multiplier (2x-5x)
        const gradientMultiplier = 2.0 + Math.random() * 3.0;

        // 2. Noise Tolerance Drop (let chaos in)
        const noiseThreshold = 0.1 + Math.random() * 0.3;

        // 3. Cross-Circuit Bleed (soften boundaries)
        // This is implicit — the new circuit bias will accept connections
        // that would have been rejected in the old state

        // Apply to all triples: amplify weights, inject noise
        for (const [key, triple] of this.triples) {
            triple.weight = Math.min(1, triple.weight * gradientMultiplier);
            if (Math.random() < noiseThreshold) {
                triple.weight = Math.max(0, triple.weight + (Math.random() - 0.5) * 0.2);
            }
        }
    }

    /** Check if this node has achieved full integration (all 4 circuits active) */
    hasFullIntegration(): boolean {
        const circuits = new Set<CircuitFamily>();
        for (const gate of this.activeGates) {
            circuits.add(getCircuitFamily(gate));
        }
        return circuits.size >= 4;
    }

    /** Enter Teleport Operator Mode */
    enterTeleportMode(): void {
        if (this.hasFullIntegration()) {
            this.mode = 'TELEPORT';
            console.log(`[TELEPORT] Node ${this.address.toString(16)} entering shape-shifter membrane`);
        }
    }

    /** Serialize local graph for P2P transmission */
    serialize(): object {
        return {
            address: this.address,
            tension: this.tension,
            mode: this.mode,
            circuitBias: this.circuitBias,
            activeGates: Array.from(this.activeGates),
            tripleCount: this.triples.size,
            neighborCount: this.neighbors.size
        };
    }
}

/** Reverse lookup: hexagram pattern → gate number (simplified) */
function hexagramToGate(hexagram: number): number {
    // In production, use proper King Wen reverse mapping
    // For prototype, hash to valid gate range
    return ((hexagram * 2654435761) % 64) + 1;
}

// ═══════════════════════════════════════════════════════════════════════════
// SECTION 4: META-COMPILING LOOP — AGENTS PASSING RULE PACKAGES
// ═══════════════════════════════════════════════════════════════════════════

/** A rule package that can be transmitted between agents and compiled into local logic */
interface RulePackage {
    source: NodeAddress;
    payload: string;           // Textual rule (Klein's original insight)
    gateEncoding: number;      // Hexagram gate that structures the data
    lineProfile: number;       // Which line (1-6) determines behavioral mode
    targetCircuit: CircuitFamily;
    epistemicDepth: number;
    signature: Uint8Array;     // Cryptographic verification
}

/** Meta-compiler: turns textual rule packages into graph mutations */
class MetaCompiler {
    /** Parse a rule package and compile it into local triple mutations */
    compile(pkg: RulePackage, localGraph: AgentGraph): SemanticTriple[] {
        const mutations: SemanticTriple[] = [];

        // The "textual conversation" becomes a structured mutation
        // based on the gate encoding of the package
        const { gate, line } = unpackAddress(pkg.source);
        const hexagram = gateToHexagram(gate);
        const polarity = getLinePolarity(hexagram, line);

        // Parse the payload as a mini-DSL
        // Format: "IF [condition] THEN [relation] [target] WITH [weight]"
        const parsed = this.parsePayload(pkg.payload);

        if (parsed) {
            const triple: SemanticTriple = {
                subject: pkg.source,
                relation: packAddress(gate, line, polarity === 1, 0),
                object: parsed.target,
                weight: parsed.weight,
                timestamp: Date.now(),
                epistemicDepth: pkg.epistemicDepth + 1,
                history: new Float32Array(64)
            };
            mutations.push(triple);
        }

        return mutations;
    }

    private parsePayload(payload: string): { target: NodeAddress; weight: number } | null {
        // Simplified parser — in production, use proper grammar
        const match = payload.match(/THEN\s+(\w+)\s+WITH\s+([0-9.]+)/);
        if (!match) return null;

        // Map target name to address (simplified)
        const targetHash = this.hashString(match[1]);
        return {
            target: targetHash & 0xFFFF,
            weight: parseFloat(match[2])
        };
    }

    private hashString(str: string): number {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            hash = ((hash << 5) - hash) + str.charCodeAt(i);
            hash |= 0;
        }
        return Math.abs(hash);
    }
}

// ═══════════════════════════════════════════════════════════════════════════
// SECTION 5: P2P MESH NETWORKING (Abstract Interface)
// ═══════════════════════════════════════════════════════════════════════════

/** Abstract P2P transport — implement with WebRTC, libp2p, or WebSocket */
interface MeshTransport {
    broadcast(msg: MeshMessage): void;
    send(target: NodeAddress, msg: MeshMessage): void;
    onMessage(handler: (from: NodeAddress, msg: MeshMessage) => void): void;
    getPeers(): NodeAddress[];
}

/** Message types for mesh communication */
enum MessageType {
    TRIPLE_PROPAGATE = 0x01,   // Share a semantic triple
    RULE_PACKAGE = 0x02,       // Meta-compiling rule transmission
    STATE_SYNC = 0x03,         // Partial graph synchronization
    FLIP_NOTIFY = 0x04,        // Dzhanibekov flip event notification
    INTEGRATION_BEACON = 0x05  // Full integration achieved signal
}

interface MeshMessage {
    type: MessageType;
    payload: ArrayBuffer;
    timestamp: number;
    ttl: number;               // Time-to-live for mesh propagation
}

/** The Morph Engine runtime — manages the 69,120-node substrate */
export class MorphEngine {
    private agents: Map<NodeAddress, AgentGraph> = new Map();
    private compiler: MetaCompiler = new MetaCompiler();
    private transport: MeshTransport | null = null;
    private myAddress: NodeAddress;

    constructor(myGate: number, myLine: number, myInstance: number) {
        this.myAddress = packAddress(myGate, myLine, false, myInstance);
        this.agents.set(this.myAddress, new AgentGraph(this.myAddress));
    }

    /** Connect to P2P transport */
    connect(transport: MeshTransport): void {
        this.transport = transport;
        transport.onMessage((from, msg) => this.handleMessage(from, msg));
    }

    /** Create a semantic relation between two nodes */
    createRelation(
        target: NodeAddress,
        relationGate: number,
        relationLine: number,
        weight: number,
        epistemicDepth: number = 0
    ): void {
        const myGraph = this.agents.get(this.myAddress)!;

        const triple: SemanticTriple = {
            subject: this.myAddress,
            relation: packAddress(relationGate, relationLine, false, 0),
            object: target,
            weight,
            timestamp: Date.now(),
            epistemicDepth,
            history: new Float32Array(64)
        };

        myGraph.ingestTriple(triple);

        // Propagate to mesh if significant
        if (weight > 0.5) {
            this.propagateTriple(triple);
        }
    }

    /** Send a meta-compiling rule package to another agent */
    sendRulePackage(target: NodeAddress, ruleText: string, gateEncoding: number): void {
        const pkg: RulePackage = {
            source: this.myAddress,
            payload: ruleText,
            gateEncoding,
            lineProfile: unpackAddress(this.myAddress).line,
            targetCircuit: getCircuitFamily(gateEncoding),
            epistemicDepth: 0,
            signature: new Uint8Array(32) // Placeholder
        };

        const msg: MeshMessage = {
            type: MessageType.RULE_PACKAGE,
            payload: this.encodeRulePackage(pkg),
            timestamp: Date.now(),
            ttl: 5
        };

        this.transport?.send(target, msg);
    }

    /** Execute local computation cycle */
    tick(): void {
        const myGraph = this.agents.get(this.myAddress)!;

        // Check for integration portal conditions
        if (myGraph.hasFullIntegration() && myGraph['mode'] !== 'TELEPORT') {
            myGraph.enterTeleportMode();
            this.broadcastIntegrationBeacon();
        }

        // Decay tension naturally
        myGraph['tension'] *= 0.95;
    }

    private handleMessage(from: NodeAddress, msg: MeshMessage): void {
        switch (msg.type) {
            case MessageType.TRIPLE_PROPAGATE:
                this.handleTriplePropagate(from, msg.payload);
                break;
            case MessageType.RULE_PACKAGE:
                this.handleRulePackage(from, msg.payload);
                break;
            case MessageType.FLIP_NOTIFY:
                this.handleFlipNotify(from, msg.payload);
                break;
            case MessageType.INTEGRATION_BEACON:
                console.log(`[MESH] Integration beacon from ${from.toString(16)}`);
                break;
        }
    }

    private handleTriplePropagate(from: NodeAddress, payload: ArrayBuffer): void {
        // Decode triple from payload
        const triple = this.decodeTriple(payload);
        const myGraph = this.agents.get(this.myAddress)!;
        myGraph.ingestTriple(triple);
    }

    private handleRulePackage(from: NodeAddress, payload: ArrayBuffer): void {
        const pkg = this.decodeRulePackage(payload);
        const myGraph = this.agents.get(this.myAddress)!;
        const mutations = this.compiler.compile(pkg, myGraph);

        for (const triple of mutations) {
            myGraph.ingestTriple(triple);
        }
    }

    private handleFlipNotify(from: NodeAddress, payload: ArrayBuffer): void {
        // Update local model of remote node's state
        const view = new DataView(payload);
        const newGate = view.getUint8(0);
        const newCircuit = view.getUint8(1);
        console.log(`[MESH] Node ${from.toString(16)} flipped to Gate ${newGate}, Circuit ${newCircuit}`);
    }

    private propagateTriple(triple: SemanticTriple): void {
        const msg: MeshMessage = {
            type: MessageType.TRIPLE_PROPAGATE,
            payload: this.encodeTriple(triple),
            timestamp: Date.now(),
            ttl: 3
        };
        this.transport?.broadcast(msg);
    }

    private broadcastIntegrationBeacon(): void {
        const msg: MeshMessage = {
            type: MessageType.INTEGRATION_BEACON,
            payload: new ArrayBuffer(0),
            timestamp: Date.now(),
            ttl: 10
        };
        this.transport?.broadcast(msg);
    }

    // Serialization helpers (simplified — use protobuf in production)
    private encodeTriple(triple: SemanticTriple): ArrayBuffer {
        const buf = new ArrayBuffer(24);
        const view = new DataView(buf);
        view.setUint16(0, triple.subject);
        view.setUint16(2, triple.relation);
        view.setUint16(4, triple.object);
        view.setFloat32(6, triple.weight);
        view.setFloat32(10, triple.timestamp);
        view.setUint8(14, triple.epistemicDepth);
        return buf;
    }

    private decodeTriple(buf: ArrayBuffer): SemanticTriple {
        const view = new DataView(buf);
        return {
            subject: view.getUint16(0),
            relation: view.getUint16(2),
            object: view.getUint16(4),
            weight: view.getFloat32(6),
            timestamp: view.getFloat32(10),
            epistemicDepth: view.getUint8(14),
            history: new Float32Array(64)
        };
    }

    private encodeRulePackage(pkg: RulePackage): ArrayBuffer {
        const textEncoder = new TextEncoder();
        const payload = textEncoder.encode(pkg.payload);
        const buf = new ArrayBuffer(16 + payload.length);
        const view = new DataView(buf);
        view.setUint16(0, pkg.source);
        view.setUint8(2, pkg.gateEncoding);
        view.setUint8(3, pkg.lineProfile);
        view.setUint8(4, pkg.targetCircuit);
        view.setUint8(5, pkg.epistemicDepth);
        new Uint8Array(buf, 16).set(payload);
        return buf;
    }

    private decodeRulePackage(buf: ArrayBuffer): RulePackage {
        const view = new DataView(buf);
        const textDecoder = new TextDecoder();
        const payloadLen = buf.byteLength - 16;
        return {
            source: view.getUint16(0),
            gateEncoding: view.getUint8(2),
            lineProfile: view.getUint8(3),
            targetCircuit: view.getUint8(4),
            epistemicDepth: view.getUint8(5),
            payload: textDecoder.decode(new Uint8Array(buf, 16, payloadLen)),
            signature: new Uint8Array(32)
        };
    }

    getStats(): object {
        const myGraph = this.agents.get(this.myAddress)!;
        return {
            myAddress: this.myAddress.toString(16),
            ...myGraph.serialize()
        };
    }
}

// ═══════════════════════════════════════════════════════════════════════════
// SECTION 6: DEMONSTRATION & TEST HARNESS
// ═══════════════════════════════════════════════════════════════════════════

/** Run a simple simulation */
export function runDemo(): void {
    console.log("═══════════════════════════════════════════════════════════");
    console.log("  MORPH ENGINE v0.1 — Distributed Semantic Mesh Demo");
    console.log("═══════════════════════════════════════════════════════════\n");

    // Create two agents with different gates
    const agentA = new MorphEngine(3, 1, 0);   // Gate 3: Innovation (Knowing)
    const agentB = new MorphEngine(60, 6, 0);  // Gate 60: Limitation (Knowing)
    const agentC = new MorphEngine(63, 4, 0);  // Gate 63: Logic (Understanding)
    const agentD = new MorphEngine(4, 1, 0);   // Gate 4: Formulation (Understanding)

    // Create a mock transport for local testing
    const mockTransport: MeshTransport = {
        broadcast: (msg) => { /* local loopback */ },
        send: (target, msg) => { /* direct send */ },
        onMessage: () => {},
        getPeers: () => []
    };

    agentA.connect(mockTransport);
    agentB.connect(mockTransport);
    agentC.connect(mockTransport);
    agentD.connect(mockTransport);

    // Step 1: Create cross-circuit relations (build tension)
    console.log("[DEMO] Creating cross-circuit relations...");
    const addrB = packAddress(60, 6, false, 0);
    const addrC = packAddress(63, 4, false, 0);
    const addrD = packAddress(4, 1, false, 0);

    agentA.createRelation(addrB, 3, 1, 0.9);  // Knowing → Knowing (stable)
    agentA.createRelation(addrC, 61, 2, 0.8); // Knowing → Understanding (tension!)
    agentA.createRelation(addrD, 43, 3, 0.85); // Knowing → Understanding (tension!)

    // Step 2: Send meta-compiling rule package
    console.log("\n[DEMO] Transmitting meta-compiling rule package...");
    agentA.sendRulePackage(addrB, 
        "IF tension > 0.5 THEN mutate WITH 0.9", 
        3
    );

    // Step 3: Tick to trigger tension checks
    console.log("\n[DEMO] Running computation cycles...");
    for (let i = 0; i < 5; i++) {
        agentA.tick();
    }

    // Step 4: Force high epistemic depth to trigger flip
    console.log("\n[DEMO] Forcing recursive depth overflow (epistemic depth = 3)...");
    agentA.createRelation(addrB, 3, 6, 0.95, 3);

    // Step 5: Check stats
    console.log("\n[DEMO] Final Agent States:");
    console.log("Agent A:", agentA.getStats());
    console.log("Agent B:", agentB.getStats());

    console.log("\n═══════════════════════════════════════════════════════════");
    console.log("  Demo complete. Ready for P2P transport integration.");
    console.log("═══════════════════════════════════════════════════════════");
}

// Run if executed directly
if (typeof window !== 'undefined') {
    (window as any).MorphEngine = MorphEngine;
    (window as any).runDemo = runDemo;
} else if (typeof global !== 'undefined') {
    runDemo();
}
