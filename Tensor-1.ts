// ═══════════════════════════════════════════════════════════════════════════
// Tensor.ts — resolves HDGraphEngine.ts's `import { Tensor } from './Tensor'`
//
// This is a name alias, not a rewrite. coordinate_generated_tensor.js already
// implements the right thing: "the coordinate IS the computation, no lookups,
// no registry" — a node's behavior is generated from its own gate/line/color/
// tone/base position, never fetched from elsewhere. That's the same principle
// the whole state-space is built on, just not previously wired to the name
// HDGraphEngine.ts was looking for.
// ═══════════════════════════════════════════════════════════════════════════

export {
  CoordinateGeneratedTensor as Tensor,
  Coordinate,
  AttractorGeometry,
  ChannelBehaviorGenerator,
  ResonanceNode,
} from './coordinate_generated_tensor.js';
