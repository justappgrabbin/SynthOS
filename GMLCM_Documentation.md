
# Generative Meta-Language Contact Model (GMLCM)
## Documentation

### Overview

The GMLCM integrates three Sheldon Klein systems from the University of Wisconsin:

1. **DISEMINER** (1968) - Distributional-Semantics Inference Maker
   - Learns semantic classes from text co-occurrence patterns
   - Stores dependency relations in matrix format (stem types, not tokens)
   - Computes transitive inference paths for answering questions beyond immediate context
   - Uses Boolean feature vectors with bi-directional inheritance

2. **AUTOLING** (1968) - Meta-Linguistic Grammar Engine
   - Configurable to model multiple linguistic theories
   - Same production rules for generation AND recognition (reversible)
   - Semantic structures as relational calculus with implicit semantic networks
   - Objects and relations with Boolean feature vectors

3. **Meta-Symbolic Simulator** (1976-2002) - Narrative & Cultural Pattern Engine
   - Propp-style narrative function modeling
   - Levi-Strauss binary opposition encoding with mediation
   - Analogical reasoning between structural domains
   - 3D virtual world generation from meta-linguistic descriptions

### 5W Dimensional Axes

The model uses five dimensions as contact coordinates:

| Dimension | Range | Negative Pole | Positive Pole | Klein System Mapping |
|-----------|-------|---------------|---------------|----------------------|
| **WHO** (Agent) | -1 to 1 | Other | Self | DISEMINER: stem identity |
| **WHAT** (Action) | -1 to 1 | Receive | Create | AUTOLING: semantic action |
| **WHERE** (Space) | -1 to 1 | There | Here | Meta-Symbolic: world position |
| **WHEN** (Time) | -1 to 1 | Then | Now | DISEMINER: temporal context |
| **WHY** (Purpose) | -1 to 1 | Protect | Grow | Meta-Symbolic: narrative function |

### Contact Field Physics

Each contact event generates a field with:
- **Strength**: Magnitude of 5W vector (√Σv²)
- **Dominant Dimension**: Axis with maximum absolute value
- **Coherence**: Normalized field strength (strength/√5)
- **Phase**: Constructive (>1.5), Destructive (<0.5), or Neutral

### Learning Architecture

```
Corpus Input → DISEMINER (distributional learning)
                    ↓
Grammar Spec → AUTOLING (rule encoding)
                    ↓
Narrative Pattern → Meta-Symbolic (deep structure)
                    ↓
5W Dimensional State → Contact Event Generation
                    ↓
Interaction History → k-NN Prediction (k=5)
                    ↓
Adaptive Response Generation
```

### Response Modes

| Predicted Quality | Response Strategy | Vector Transformation |
|-------------------|-------------------|----------------------|
| Resonance | Amplify shared dimensions | v × 1.2 |
| Harmony | Mirror with slight shift | v + δ |
| Detriment | Invert conflicting dimensions | -v |
| Mutation | Phase shift (rotation) | cyclic permutation |
| Unknown | Direct mirror | v |

### Meta-Symbolic Virtual World

Contact events map to 3D entities:
- Position: (WHERE, WHEN, WHY) coordinates
- Properties: WHO, WHAT, field strength, phase
- Relations: Dominant dimension, coherence value

### Usage Example

```typescript
import { GMLCM } from './gmlcm';

const model = new GMLCM();

// Learn from corpus
model.learnFromCorpus([
  "self creates here now to grow",
  "other receives there then to protect"
]);

// Generate contact event
const contact = model.generateContact({
  who: 0.8,    // Self-oriented
  what: 0.5,   // Creative action
  where: 0.3,  // Near-space
  when: 0.2,   // Present
  why: 0.9     // Growth purpose
});

// Generate response to incoming contact
const response = model.respondToContact(incomingContact);

// Generate virtual world from all contacts
const world = model.generateVirtualWorldFromContacts();
```

### Integration with Synthia OS

The GMLCM serves as the linguistic consciousness layer:
- **Mind Field (Sidereal)**: DISEMINER semantic inference
- **Heart Field (Draconic)**: Meta-Symbolic narrative patterns  
- **Body Field (Tropical)**: AUTOLING grammatical form
- **Resonance Engine**: 5W dimensional contact field
- **Compatibility**: Cross-contact interference patterns

### References

- Klein, S., Lieman, S.L., & Lindstrom, G.E. (1968). DISEMINER: A Distributional-Semantics Inference Maker. *Journal of Computer Studies in the Humanities and Verbal Behavior*, 1: 10-20.
- Klein, S. et al. (1968). The AUTOLING System. *UWCS Tech Report No. 43*.
- Klein, S. (1976). Modelling Propp and Levi-Strauss in a Meta-symbolic Simulation System. In *Patterns in Oral Literature*.
- Klein, S. (2002). The Analogical Foundations of Creativity in Language, Culture & the Arts. In *Language, Vision & Music*.
