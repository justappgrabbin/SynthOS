/**
 * RESONANCE WEAVER — Core Game Engine
 * 
 * The player studies autonomous characters' Human Design charts and places
 * Resonance Conditions on an 81-field grid. When conditions align with
 * characters' designs, Resonance Loops form, advancing the characters' goals.
 * Each loop generates Interference, making future placement harder.
 * 
 * Three fields pulse at different speeds:
 * - Mind (16-cycle): Fast, governs perception and thought
 * - Body (12-cycle): Medium, governs action and manifestation
 * - Heart (40-cycle): Slow, governs emotion and connection
 */

import { ConsciousnessOscillator, type OscillatorSnapshot, type FieldState } from '../engines/ConsciousnessOscillator';
import { ResonanceEngine } from '../engines/ResonanceEngine';
import { GATES, type GateInfo } from '../data/HumanDesignData';

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════════

export interface GameCharacter {
  id: string;
  name: string;
  archetype: string;
  designType: 'Generator' | 'Projector' | 'Manifestor' | 'Reflector';
  strategy: string;
  authority: string;
  activeGates: number[];
  definedCenters: string[];
  channels: Array<[number, number]>;
  incarnationCross: string;
  consciousnessLevel: number;
  mindEnergy: number;
  bodyEnergy: number;
  heartEnergy: number;
  energy: number;
  maxEnergy: number;
  coherence: number;
  alive: boolean;
  position: { x: number; y: number };
  goals: CharacterGoal[];
}

export interface CharacterGoal {
  id: string;
  title: string;
  description: string;
  category: 'mind' | 'body' | 'heart' | 'integration';
  targetValue: number;
  currentValue: number;
  completed: boolean;
  derivedFromGate: number;
}

export interface GameCondition {
  id: string;
  name: string;
  type: 'environment' | 'connection' | 'structure' | 'resonance' | 'flow';
  field: 'mind' | 'body' | 'heart' | 'all';
  position: { x: number; y: number };
  element: string;
  resonanceFrequency: number;
  coherenceRequired: number;
  active: boolean;
  compatibleGates: number[];
  radius: number; // Effect radius in grid cells
}

export interface GameLoop {
  id: string;
  characterId: string;
  conditionId: string;
  loopType: 'harmonic' | 'dissonant' | 'growth' | 'decay';
  strength: number;
  goalProgress: number;
  interferenceGenerated: number;
  active: boolean;
  age: number;
}

// Real HD center groupings -- not arbitrary. Awareness centers (Head, Ajna,
// Spleen) process information; motor/pressure centers (Ego, Solar, Sacral,
// Root) generate force; G and Throat are identity/expression. When one of
// these sits undefined, that's genuinely where a design takes in outside
// noise -- this is what interference should track, not a coin flip.
const ALL_CENTERS = ['Head', 'Ajna', 'Throat', 'G', 'Ego', 'Solar', 'Sacral', 'Spleen', 'Root'] as const;

const CENTER_TO_FIELD: Record<string, 'mind' | 'body' | 'heart'> = {
  Head: 'mind', Ajna: 'mind',
  Throat: 'body', G: 'body', Sacral: 'body', Root: 'body',
  Ego: 'heart', Solar: 'heart', Spleen: 'body',
};

const CENTER_MANIFESTATION: Record<string, GameInterference['manifestation']> = {
  Head: 'static',    // pressure center open -- mental noise, question-pressure with no exit
  Ajna: 'echo',      // awareness center open -- borrowed opinions repeating back
  Throat: 'flare',   // expression center open -- sudden, unregulated output
  G: 'drift',        // identity center open -- direction wanders, no fixed self
  Ego: 'flare',      // willpower center open -- overcommitting in bursts
  Solar: 'shadow',   // emotional center open -- absorbing others' moods unseen
  Sacral: 'drift',   // life-force center open -- no fixed rhythm of its own
  Spleen: 'shadow',  // awareness center open -- picks up others' fear/instinct silently
  Root: 'static',    // pressure center open -- takes on others' urgency as noise
};

export interface GameInterference {
  id: string;
  sourceLoopId: string;
  field: 'mind' | 'body' | 'heart' | 'all';
  intensity: number;
  position: { x: number; y: number };
  manifestation: 'static' | 'drift' | 'echo' | 'shadow' | 'flare';
  age: number;
}

export interface GameState {
  characters: GameCharacter[];
  conditions: GameCondition[];
  loops: GameLoop[];
  interferences: GameInterference[];
  fieldSnapshot: OscillatorSnapshot | null;
  globalCoherence: number;
  totalLoops: number;
  totalInterferences: number;
  goalsCompleted: number;
  turn: number;
  gridSize: number;
  maxConditions: number;
  maxInterference: number;
}

// ═══════════════════════════════════════════════════════════════════════════════
// GAME ENGINE
// ═══════════════════════════════════════════════════════════════════════════════

export class GameEngine {
  private oscillator: ConsciousnessOscillator;
  private state: GameState;
  private listeners: Set<(state: GameState) => void> = new Set();
  private running = false;
  private animFrame = 0;
  private lastTime = 0;

  constructor(gridSize = 9) {
    this.oscillator = new ConsciousnessOscillator(0.25);
    this.state = {
      characters: [],
      conditions: [],
      loops: [],
      interferences: [],
      fieldSnapshot: null,
      globalCoherence: 0.5,
      totalLoops: 0,
      totalInterferences: 0,
      goalsCompleted: 0,
      turn: 0,
      gridSize,
      maxConditions: 12,
      maxInterference: 0.85,
    };
  }

  // ── Subscriptions ──
  subscribe(listener: (state: GameState) => void) {
    this.listeners.add(listener);
    listener(this.getState());
    return () => this.listeners.delete(listener);
  }

  private emit() {
    const s = this.getState();
    this.listeners.forEach(l => l(s));
  }

  getState(): GameState {
    return {
      ...this.state,
      characters: this.state.characters.map(c => ({ ...c, goals: c.goals.map(g => ({ ...g })) })),
      conditions: this.state.conditions.map(c => ({ ...c })),
      loops: this.state.loops.map(l => ({ ...l })),
      interferences: this.state.interferences.map(i => ({ ...i })),
    };
  }

  // ── Character Management ──
  addCharacter(char: Omit<GameCharacter, 'id' | 'position' | 'goals'> & { position?: { x: number; y: number } }): GameCharacter {
    const id = `char_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
    const position = char.position || {
      x: Math.floor(Math.random() * this.state.gridSize),
      y: Math.floor(Math.random() * this.state.gridSize),
    };

    // Generate goals from active gates
    const goals = this.generateGoals(char.activeGates, char.designType);

    const fullChar: GameCharacter = {
      ...char,
      id,
      position,
      goals,
      energy: char.energy || 80,
      maxEnergy: char.maxEnergy || 100,
      coherence: char.coherence || 0.5,
      alive: true,
    };

    this.state.characters.push(fullChar);
    this.emit();
    return fullChar;
  }

  private generateGoals(activeGates: number[], designType: string): CharacterGoal[] {
    const goals: CharacterGoal[] = [];
    const goalTemplates: Record<number, Partial<CharacterGoal>> = {
      1:  { title: 'Create Authentically', category: 'integration' as const, description: 'Express your unique creative vision' },
      2:  { title: 'Find Higher Direction', category: 'mind' as const, description: 'Discover the path of least resistance' },
      3:  { title: 'Master New Skills', category: 'body' as const, description: 'Learn through trial and adaptation' },
      4:  { title: 'Answer the Call', category: 'mind' as const, description: 'Find solutions that satisfy the mind' },
      5:  { title: 'Establish Rhythm', category: 'body' as const, description: 'Create sustainable patterns' },
      6:  { title: 'Navigate Intimacy', category: 'heart' as const, description: 'Learn the art of emotional friction' },
      7:  { title: 'Lead by Example', category: 'integration' as const, description: 'Guide others through embodied wisdom' },
      8:  { title: 'Contribute Meaningfully', category: 'integration' as const, description: 'Make your unique mark on the world' },
      9:  { title: 'Focus Energy', category: 'body' as const, description: 'Direct attention to what matters' },
      10: { title: 'Love Yourself', category: 'heart' as const, description: 'Embody self-acceptance' },
      13: { title: 'Listen Deeply', category: 'heart' as const, description: 'Hear what others cannot say' },
      14: { title: 'Wealth Through Power', category: 'body' as const, description: 'Channel life force into prosperity' },
      20: { title: 'Be Present', category: 'mind' as const, description: 'Live fully in the now' },
      25: { title: 'Universal Love', category: 'heart' as const, description: 'Embody spiritual innocence' },
      28: { title: 'Find Purpose', category: 'integration' as const, description: 'Discover meaning through struggle' },
      34: { title: 'Pure Power', category: 'body' as const, description: 'Harness sacral life force' },
      43: { title: 'Inner Knowing', category: 'mind' as const, description: 'Trust unique insights' },
      50: { title: 'Hold Values', category: 'heart' as const, description: 'Maintain tribal responsibility' },
      55: { title: 'Emotional Freedom', category: 'heart' as const, description: 'Release into spirit' },
      57: { title: 'Intuitive Clarity', category: 'mind' as const, description: 'Penetrate to the truth' },
    };

    for (const gate of activeGates.slice(0, 4)) {
      const tmpl = goalTemplates[gate];
      if (tmpl) {
        goals.push({
          id: `goal_${gate}_${Date.now()}`,
          title: tmpl.title || `Goal from Gate ${gate}`,
          description: tmpl.description || `Progress through Gate ${gate}`,
          category: tmpl.category || 'integration',
          targetValue: 100,
          currentValue: 0,
          completed: false,
          derivedFromGate: gate,
        });
      }
    }

    // Add a design-type specific integration goal
    const typeGoals: Record<string, CharacterGoal> = {
      Generator: { id: `goal_type_${Date.now()}`, title: 'Satisfy the Sacral', description: 'Find work that lights up your body', category: 'integration', targetValue: 100, currentValue: 0, completed: false, derivedFromGate: 0 },
      Projector: { id: `goal_type_${Date.now()}`, title: 'Be Recognized', description: 'Wait for the invitation that sees your gift', category: 'integration', targetValue: 100, currentValue: 0, completed: false, derivedFromGate: 0 },
      Manifestor: { id: `goal_type_${Date.now()}`, title: 'Initiate Peace', description: 'Impact the world while informing others', category: 'integration', targetValue: 100, currentValue: 0, completed: false, derivedFromGate: 0 },
      Reflector: { id: `goal_type_${Date.now()}`, title: 'Reflect Truth', description: 'Sample the lunar cycle and mirror the community', category: 'integration', targetValue: 100, currentValue: 0, completed: false, derivedFromGate: 0 },
    };
    goals.push(typeGoals[designType] || typeGoals.Generator);

    return goals;
  }

  // ── Condition Placement ──
  placeCondition(
    name: string,
    type: GameCondition['type'],
    field: GameCondition['field'],
    position: { x: number; y: number },
    element: string,
    options?: { coherenceRequired?: number; radius?: number }
  ): GameCondition | null {
    // Check position bounds
    if (position.x < 0 || position.x >= this.state.gridSize || position.y < 0 || position.y >= this.state.gridSize) {
      return null;
    }

    // Check max conditions
    if (this.state.conditions.length >= this.state.maxConditions) {
      return null;
    }

    // Check for existing condition at position
    const existing = this.state.conditions.find(c => c.position.x === position.x && c.position.y === position.y);
    if (existing) {
      return null;
    }

    const condition: GameCondition = {
      id: `cond_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      name,
      type,
      field,
      position,
      element,
      resonanceFrequency: this.calculateFrequencyForElement(element),
      coherenceRequired: options?.coherenceRequired ?? 0.3,
      active: true,
      compatibleGates: ResonanceEngine.getCompatibleGates(element),
      radius: options?.radius ?? 2,
    };

    this.state.conditions.push(condition);
    this.recalculateLoops();
    this.emit();
    return condition;
  }

  removeCondition(conditionId: string): boolean {
    const idx = this.state.conditions.findIndex(c => c.id === conditionId);
    if (idx === -1) return false;
    this.state.conditions.splice(idx, 1);
    // Remove associated loops
    this.state.loops = this.state.loops.filter(l => l.conditionId !== conditionId);
    this.recalculateLoops();
    this.emit();
    return true;
  }

  private calculateFrequencyForElement(element: string): number {
    const freqs: Record<string, number> = {
      fire: 528, water: 396, earth: 432, metal: 741, wood: 639, aether: 852, wind: 417,
    };
    return freqs[element] || 432;
  }

  // ── Loop Detection ──
  private recalculateLoops() {
    const fieldSnap = this.state.fieldSnapshot;
    const fieldState: FieldState = fieldSnap?.fieldStrengths ?? { mind: 0.5, body: 0.5, heart: 0.5, global: 0.5 };

    // Mark all existing loops as inactive, we'll reactivate matching ones
    for (const loop of this.state.loops) {
      loop.active = false;
    }

    for (const char of this.state.characters) {
      if (!char.alive) continue;

      for (const cond of this.state.conditions) {
        if (!cond.active) continue;

        // Distance check
        const dist = Math.sqrt(
          (char.position.x - cond.position.x) ** 2 +
          (char.position.y - cond.position.y) ** 2
        );
        if (dist > cond.radius) continue;

        // Calculate resonance
        const result = ResonanceEngine.calculateResonance(
          char.activeGates,
          char.definedCenters,
          char.coherence,
          cond.element,
          cond.compatibleGates,
          cond.coherenceRequired,
          fieldState
        );

        if (result.score > 0.2) {
          // Find or create loop
          let loop = this.state.loops.find(
            l => l.characterId === char.id && l.conditionId === cond.id
          );

          if (!loop) {
            loop = {
              id: `loop_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
              characterId: char.id,
              conditionId: cond.id,
              loopType: result.loopType,
              strength: result.score,
              goalProgress: result.goalProgress,
              interferenceGenerated: result.interference,
              active: true,
              age: 0,
            };
            this.state.loops.push(loop);
            this.state.totalLoops++;
          } else {
            loop.active = true;
            loop.strength = result.score;
            loop.loopType = result.loopType;
            loop.goalProgress = result.goalProgress;
            loop.interferenceGenerated = result.interference;
          }
        }
      }
    }

    // Remove inactive loops
    this.state.loops = this.state.loops.filter(l => l.active);
  }

  // ── Interference Generation ──
  private updateInterferences() {
    // Age existing interferences
    for (const intf of this.state.interferences) {
      intf.age++;
      // Interference fades over time
      intf.intensity *= 0.998;
    }

    // Remove faded interferences
    this.state.interferences = this.state.interferences.filter(i => i.intensity > 0.05);

    // Generate new interference from active loops
    for (const loop of this.state.loops) {
      if (loop.interferenceGenerated < 0.1) continue;

      const char = this.state.characters.find(c => c.id === loop.characterId);
      const cond = this.state.conditions.find(c => c.id === loop.conditionId);
      if (!char || !cond) continue;

      // 15% chance per tick to spawn interference near the loop
      if (Math.random() < 0.15 * loop.interferenceGenerated) {
        // Resonant, not random: interference manifests through whichever of
        // this agent's centers are UNDEFINED -- that's where a real design
        // is actually open to outside noise, per HD's own teaching on
        // conditioning. A defined center has its own consistent voice and
        // isn't where static/drift/echo would naturally show up.
        const undefinedCenters = ALL_CENTERS.filter(c => !char.definedCenters.includes(c));
        const targetCenter = undefinedCenters.length > 0
          ? undefinedCenters[Math.floor(Math.random() * undefinedCenters.length)]
          : char.definedCenters[Math.floor(Math.random() * char.definedCenters.length)];

        const field = CENTER_TO_FIELD[targetCenter] ??
          (cond.field === 'all' ? (['mind', 'body', 'heart'] as const)[Math.floor(Math.random() * 3)] : cond.field);

        // Manifestation form follows from WHICH kind of center is open --
        // a pressure center left open behaves differently than an
        // awareness center left open. Real mapping, not a random pick.
        const manifestation = CENTER_MANIFESTATION[targetCenter] ??
          (['static', 'drift', 'echo', 'shadow', 'flare'] as const)[Math.floor(Math.random() * 5)];

        const intf: GameInterference = {
          id: `intf_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
          sourceLoopId: loop.id,
          field,
          intensity: loop.interferenceGenerated * (0.5 + Math.random() * 0.5),
          position: {
            x: Math.max(0, Math.min(this.state.gridSize - 1, cond.position.x + (Math.random() - 0.5) * 3)),
            y: Math.max(0, Math.min(this.state.gridSize - 1, cond.position.y + (Math.random() - 0.5) * 3)),
          },
          manifestation,
          age: 0,
        };
        this.state.interferences.push(intf);
        this.state.totalInterferences++;
      }
    }

    // Apply interference effects on nearby conditions
    for (const intf of this.state.interferences) {
      for (const cond of this.state.conditions) {
        const dist = Math.sqrt((cond.position.x - intf.position.x) ** 2 + (cond.position.y - intf.position.y) ** 2);
        if (dist < 2) {
          // Interference raises coherence requirement
          cond.coherenceRequired = Math.min(0.95, cond.coherenceRequired + intf.intensity * 0.01);
        }
      }
    }
  }

  // ── Goal Progress ──
  private updateGoals() {
    for (const loop of this.state.loops) {
      if (loop.goalProgress <= 0) continue;

      const char = this.state.characters.find(c => c.id === loop.characterId);
      if (!char) continue;

      // Find a goal matching the condition's field
      const cond = this.state.conditions.find(c => c.id === loop.conditionId);
      const field = cond?.field || 'all';

      for (const goal of char.goals) {
        if (goal.completed) continue;
        if (field !== 'all' && goal.category !== field && goal.category !== 'integration') continue;

        goal.currentValue += loop.goalProgress * loop.strength * 2;
        if (goal.currentValue >= goal.targetValue) {
          goal.currentValue = goal.targetValue;
          goal.completed = true;
          this.state.goalsCompleted++;
          // Boost character coherence on goal completion
          char.coherence = Math.min(1, char.coherence + 0.1);
        }
        break; // Only progress one goal per loop tick
      }
    }
  }

  // ── Character Autonomy ──
  private updateCharacters() {
    const snap = this.state.fieldSnapshot;
    if (!snap) return;

    for (const char of this.state.characters) {
      if (!char.alive) continue;

      // Characters drift slightly toward resonant conditions
      let attractX = 0, attractY = 0, totalWeight = 0;
      for (const cond of this.state.conditions) {
        const loop = this.state.loops.find(l => l.characterId === char.id && l.conditionId === cond.id);
        if (loop && loop.strength > 0.3) {
          const dx = cond.position.x - char.position.x;
          const dy = cond.position.y - char.position.y;
          attractX += dx * loop.strength;
          attractY += dy * loop.strength;
          totalWeight += loop.strength;
        }
      }

      if (totalWeight > 0) {
        char.position.x += (attractX / totalWeight) * 0.05;
        char.position.y += (attractY / totalWeight) * 0.05;
      }

      // Clamp to grid
      char.position.x = Math.max(0, Math.min(this.state.gridSize - 1, char.position.x));
      char.position.y = Math.max(0, Math.min(this.state.gridSize - 1, char.position.y));

      // Energy metabolism
      char.energy -= 0.02;
      if (char.energy < 30) {
        // Seek rest — move toward center
        char.position.x += (this.state.gridSize / 2 - char.position.x) * 0.02;
        char.position.y += (this.state.gridSize / 2 - char.position.y) * 0.02;
      }

      // Replenish from harmonic loops
      const totalHarmonic = this.state.loops
        .filter(l => l.characterId === char.id && l.loopType === 'harmonic')
        .reduce((s, l) => s + l.strength, 0);
      char.energy = Math.min(char.maxEnergy, char.energy + totalHarmonic * 0.1);

      // Death check
      if (char.energy <= 0) {
        char.alive = false;
        char.energy = 0;
      }

      // Update coherence based on field state
      const fieldCoherence = snap.fieldStrengths.global;
      char.coherence = char.coherence * 0.99 + fieldCoherence * 0.01;
    }
  }

  // ── Age Loops ──
  private ageLoops() {
    for (const loop of this.state.loops) {
      loop.age++;
      // Older loops generate more interference
      loop.interferenceGenerated = Math.min(0.8, loop.interferenceGenerated + 0.001 * loop.age);
    }
  }

  // ── Game Loop ──
  private tick = () => {
    if (!this.running) return;

    // Step the consciousness oscillator
    this.state.fieldSnapshot = this.oscillator.step(0.05);
    this.state.globalCoherence = this.state.fieldSnapshot.fieldStrengths.global;
    this.state.turn++;

    // Update all game systems
    this.ageLoops();
    this.updateInterferences();
    this.updateGoals();
    this.updateCharacters();
    this.recalculateLoops();

    // Check game state
    const aliveChars = this.state.characters.filter(c => c.alive);
    if (aliveChars.length === 0 && this.state.characters.length > 0) {
      // All characters dead — game over state
    }

    this.emit();
    this.animFrame = requestAnimationFrame(this.tick);
  };

  start() {
    if (this.running) return;
    this.running = true;
    this.tick();
  }

  stop() {
    this.running = false;
    cancelAnimationFrame(this.animFrame);
  }

  isRunning() {
    return this.running;
  }

  // ── Utility ──
  getCellInfo(x: number, y: number) {
    const conditions = this.state.conditions.filter(c =>
      Math.round(c.position.x) === x && Math.round(c.position.y) === y
    );
    const characters = this.state.characters.filter(c =>
      Math.round(c.position.x) === x && Math.round(c.position.y) === y && c.alive
    );
    const interferences = this.state.interferences.filter(i =>
      Math.round(i.position.x) === x && Math.round(i.position.y) === y
    );
    const loops = this.state.loops.filter(l => {
      const cond = this.state.conditions.find(c => c.id === l.conditionId);
      return cond && Math.round(cond.position.x) === x && Math.round(cond.position.y) === y && l.active;
    });

    return { conditions, characters, interferences, loops };
  }

  // Generate a preset character
  static generatePresetCharacter(preset: 'mystic' | 'builder' | 'healer' | 'leader'): Partial<GameCharacter> {
    const presets: Record<string, Partial<GameCharacter>> = {
      mystic: {
        name: 'Aeliana', archetype: 'The Mystic Wanderer',
        designType: 'Projector', strategy: 'Wait for Invitation', authority: 'Splenic',
        activeGates: [1, 13, 25, 43, 57, 61],
        definedCenters: ['Ajna', 'Head', 'G'],
        channels: [[1, 8], [13, 33]],
        incarnationCross: 'Juxtaposition Cross of Thinking',
        mindEnergy: 85, bodyEnergy: 30, heartEnergy: 70,
        coherence: 0.7,
      },
      builder: {
        name: 'Theron', archetype: 'The Earth Anchor',
        designType: 'Generator', strategy: 'Wait to Respond', authority: 'Sacral',
        activeGates: [5, 9, 14, 27, 34, 42],
        definedCenters: ['Sacral', 'Spleen', 'Root'],
        channels: [[9, 52], [27, 50]],
        incarnationCross: 'Right Angle Cross of Planning',
        mindEnergy: 30, bodyEnergy: 90, heartEnergy: 40,
        coherence: 0.6,
      },
      healer: {
        name: 'Sera', archetype: 'The Quantum Healer',
        designType: 'Generator', strategy: 'Wait to Respond', authority: 'Emotional',
        activeGates: [10, 15, 22, 37, 50, 55],
        definedCenters: ['Solar Plexus', 'G', 'Sacral'],
        channels: [[22, 12], [37, 40]],
        incarnationCross: 'Left Angle Cross of The Clarion',
        mindEnergy: 40, bodyEnergy: 50, heartEnergy: 85,
        coherence: 0.8,
      },
      leader: {
        name: 'Orion', archetype: 'The Bridge Builder',
        designType: 'Manifestor', strategy: 'Inform', authority: 'Ego',
        activeGates: [7, 21, 26, 31, 45, 51],
        definedCenters: ['Heart', 'Throat', 'Root'],
        channels: [[21, 45], [26, 44]],
        incarnationCross: 'Right Angle Cross of Explanation',
        mindEnergy: 60, bodyEnergy: 60, heartEnergy: 60,
        coherence: 0.5,
      },
    };
    return presets[preset] || presets.mystic;
  }
}
