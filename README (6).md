# ⚡ CAUSAL INFERENCE ENGINE v1.0 ⚡

## Trigram Logic × Signal Flow × Consciousness

> "The 64 gates are not personality types — they are 64 logic operators running on biological hardware."

---

## What This Is

A complete causal inference system that treats Human Design gates as **6-bit logic processors** (hexagrams) composed of two **3-bit trigram operators** (upper and lower). Each gate is a semantic particle with:

- **Binary code** (6-bit): The hexagram
- **DNA codon** (3-letter): The genetic mapping
- **Amino acid**: The protein building block
- **Organ mapping**: The biological hardware
- **Center spec**: Latency, processor type, clock speed, buffer size
- **Trigram logic**: Upper and lower 3-bit operators that define causal behavior

---

## Architecture

```
GATE (6-bit hexagram)
├── Upper Trigram (3-bit) → Logic Operator (OVERWRITE, STORE, TRIGGER, etc.)
└── Lower Trigram (3-bit) → Logic Operator

CHANNEL (2 gates connected)
├── Gate A: Upper_A over Lower_A
├── Gate B: Upper_B over Lower_B
└── FRICTION: Detected when Upper_A conflicts with Lower_B
```

### The 8 Primal Trigram Logic Operators

| Binary | Name | Function | Hardware | Latency |
|--------|------|----------|----------|---------|
| 111 | Heaven | OVERWRITE | CPU / Power Supply | Instant (0ms) |
| 000 | Earth | STORE | Database / Storage | Persistent (infinite) |
| 001 | Thunder | TRIGGER | Interrupt / Start Button | Rising edge (instant) |
| 100 | Mountain | HALT | Heat Sink / Ground | Falling edge (instant) |
| 010 | Water | ENCRYPT | Encryption / RAM | Variable (hidden) |
| 101 | Fire | RENDER | GPU / Monitor | Frame-rate (visible) |
| 011 | Wind | STREAM | Network / Cache | Continuous (adaptive) |
| 110 | Lake | BROADCAST | Speaker / Antenna | Variable (amplified) |

---

## Friction Detection

When two gates form a channel, the system detects **logic operator conflicts** between the upper trigram of the origin gate and the lower trigram of the result gate:

| Conflict | Severity | Human Experience |
|----------|----------|------------------|
| HALT vs TRIGGER | CRITICAL | Cannot sit still, endless starting without finishing |
| TRIGGER vs HALT | HIGH | Begin many things, complete few — burnout cycle |
| ENCRYPT vs RENDER | HIGH | Emotional spikes, sudden outbursts from hidden pressure |
| STREAM vs HALT | HIGH | Frustrated momentum, blocked progress |
| OVERWRITE vs STORE | MEDIUM | Restless innovation, cannot settle into routine |
| DOUBLE BROADCAST | MEDIUM | Over-sharing, broadcasting without listening |
| DOUBLE TRIGGER | MEDIUM | Too many starts, no completion, overwhelm |
| DOUBLE OVERWRITE | LOW | Inspired but unanchored, ideas without form |

---

## Coherence Scoring

Each channel receives a **coherence score (0.0–1.0)**:

- **1.00**: Crystal clear — pure signal flow, no friction
- **0.8–0.99**: Strong — minor friction, functional channel
- **0.5–0.79**: Moderate — significant friction, requires awareness
- **0.2–0.49**: Weak — high friction, potential dysfunction
- **0.0–0.19**: Broken — critical friction, channel may be blocked

### Scoring Formula

```
base = 1.0
- 0.4 for CRITICAL friction
- 0.25 for HIGH friction
- 0.15 for MEDIUM friction
- 0.05 for LOW friction
+ 0.2 if both gates in same center
= coherence (clamped to 0.0–1.0)
```

---

## Files Included

### 1. `causal_inference_engine.html` (Interactive Visualization)
- **Self-contained** — no server required, open in any browser
- **Interactive causal graph** — visual node-based channel analysis
- **Signal flow animation** — watch consciousness flow between gates
- **Coherence meter** — real-time scoring visualization
- **Channel grid** — all 36 channels with filterable quality scores
- **Trigram legend** — the 8 primal operators with hardware specs
- **Friction warnings** — highlighted when detected
- **Human experience** — natural language descriptions of what each channel feels like

### 2. `causal_inference_engine.py` (Python Module)
- **Importable library** — `from causal_inference_engine import CausalInferenceEngine`
- **Complete 64-gate genome** — all gates with binary, DNA, amino acid, organ, center
- **All 36 defined channels** — pre-analyzed with coherence scores
- **Friction detection** — automatic pattern matching
- **JSON export** — `engine.to_json("51-25")` for API integration
- **Filtering** — by quality, friction severity, center
- **Statistics** — system-wide coherence metrics

---

## Usage

### Python

```python
from causal_inference_engine import CausalInferenceEngine

engine = CausalInferenceEngine()

# Analyze a specific channel
analysis = engine.analyze_channel([51, 25])  # Ra's Cross!
print(f"Quality: {analysis.signal_quality}")
print(f"Coherence: {analysis.coherence_score:.2f}")
print(f"Experience: {analysis.human_experience}")

# Get all channels with friction
friction_channels = engine.get_channels_with_friction()

# Get crystal clear channels
pure = engine.get_channels_by_quality("CRYSTAL CLEAR")

# Export to JSON
json_data = engine.to_json("51-25")

# System stats
stats = engine.get_stats()
```

### HTML (Browser)

1. Open `causal_inference_engine.html` in any modern browser
2. Select a channel from the dropdown
3. Click **Visualize** to see the causal graph
4. Click **Animate Signal** to watch signal flow
5. Use **filters** to find channels by quality or friction
6. Click any channel card in the grid to analyze it

---

## Key Results

### System Statistics (All 36 Channels)

- **Total Channels**: 36
- **With Friction**: 13 (36%)
- **Crystal Clear**: 23 (64%)
- **Average Coherence**: 0.92
- **Highest Coherence**: Channel 2-14 (1.00)
- **Lowest Coherence**: Channel 18-58 (0.60)

### Notable Channels

| Channel | Gates | Coherence | Friction |
|---------|-------|-----------|----------|
| 51-25 | Shock → Innocence | 1.00 | None (Ra's Cross!) |
| 21-45 | Control → Gathering | 1.00 | None |
| 57-10 | Intuition → Behavior | 1.00 | None |
| 18-58 | Correction → Vitality | 0.60 | CRITICAL: HALT vs TRIGGER |
| 39-55 | Provocation → Spirit | 0.75 | HIGH: TRIGGER vs HALT |

---

## Integration with Synthia OS

This engine is designed to plug into the **Living Mirror** app and the broader Synthia architecture:

```
User Input (birth data)
    ↓
Roxy API → Bodygraph → Gate activations
    ↓
CAUSAL INFERENCE ENGINE
    ├── Analyzes each defined channel
    ├── Detects friction patterns
    ├── Scores coherence
    └── Generates human experience descriptions
    ↓
LLM Interpreter (Claude)
    ├── Reads fixed brain (birth chart)
    ├── Reads adaptable brain (current transits)
    └── Explains the quality of each channel's expression
    ↓
User receives personalized, causal explanation of their design
```

---

## Theoretical Foundation

This system is built on the convergence of:

1. **I Ching** (3000 years): 64 hexagrams as binary logic
2. **Human Design** (Ra Uru Hu): 64 gates as personality archetypes
3. **Genetics**: DNA codons → amino acids → proteins → organs
4. **Computer Science**: 3-bit trigrams as logic operators, 6-bit hexagrams as compiled operations
5. **Metu Neter** (Ashby): Operational mechanics of consciousness (Set vs Ausar, coherence filtering)

The insight: **The 64 gates are not personality types. They are 64 logic operators running on biological hardware.** Each gate's binary code determines its causal behavior, and channels are compiled operations where two gates interact through their trigram logic.

---

## License

MIT — Built for Synthia OS / Living Mirror

---

*"The ancient Chinese were coding in binary 3000 years ago. They just called it Yang and Yin."*
