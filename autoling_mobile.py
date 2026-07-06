
# AutoLing Mobile Runtime v2.1
# Lightweight, single-file version optimized for mobile deployment
# Compatible with Kivy, BeeWare, or Chaquopy for Android APK

import json
import hashlib
import time
import uuid
from dataclasses import dataclass, field
from typing import List, Dict, Any, Optional, Tuple, Callable, Set
from collections import deque
import math

# ============================================================
# MOBILE-OPTIMIZED: No numpy dependency, pure Python vectors
# ============================================================

class Vector:
    """Pure Python vector operations, no numpy needed"""
    def __init__(self, data: List[float]):
        self.data = data
        self.dim = len(data)

    def dot(self, other: 'Vector') -> float:
        return sum(a * b for a, b in zip(self.data, other.data))

    def norm(self) -> float:
        return math.sqrt(sum(x * x for x in self.data))

    def normalize(self) -> 'Vector':
        n = self.norm()
        if n > 0:
            return Vector([x / n for x in self.data])
        return Vector([0.0] * self.dim)

    def scale(self, s: float) -> 'Vector':
        return Vector([x * s for x in self.data])

    def add(self, other: 'Vector') -> 'Vector':
        return Vector([a + b for a, b in zip(self.data, other.data)])

    @staticmethod
    def zeros(dim: int) -> 'Vector':
        return Vector([0.0] * dim)

    @staticmethod
    def random(dim: int, seed: int = None) -> 'Vector':
        if seed is not None:
            import random
            random.seed(seed)
        import random
        return Vector([random.gauss(0, 0.3) for _ in range(dim)])

# ============================================================
# I CHING ADDRESS (Mobile-Optimized)
# ============================================================

@dataclass
class IChingAddress:
    hexagram: int
    line: int
    color: int
    tone: int
    base: int
    x: float = field(default=0.0)
    y: float = field(default=0.0)
    z: float = field(default=0.0)
    dimension: str = field(default="semantic")

    def __post_init__(self):
        angle = (self.hexagram / 64) * 2 * math.pi
        elevation = (self.line / 7) * math.pi - math.pi / 2
        radius = 10 + (self.color * 2) + (self.tone * 0.5)
        self.x = radius * math.cos(angle) * math.cos(elevation)
        self.y = radius * math.sin(elevation) * 5
        self.z = radius * math.sin(angle) * math.cos(elevation)

    def to_gene_key(self) -> str:
        gene_key_num = (self.hexagram - 1) * 6 + self.line
        return f"GK{gene_key_num}.{self.color}.{self.tone}.{self.base}"

    def to_string(self) -> str:
        return f"H{self.hexagram}.L{self.line}.C{self.color}.T{self.tone}.B{self.base}"

# ============================================================
# SEMANTIC EMBEDDINGS (No numpy, pure Python)
# ============================================================

class SemanticEmbedder:
    """Mobile-optimized semantic embedder, no external dependencies"""

    def __init__(self, dim: int = 64):
        self.dim = dim
        self.concept_space = self._build_concept_space()

    def _build_concept_space(self) -> Dict[str, Vector]:
        concepts = {
            'creation': [0.9, 0.8, 0.1, 0.2, 0.7, 0.3],
            'destruction': [0.1, 0.2, 0.9, 0.8, 0.1, 0.7],
            'connection': [0.5, 0.9, 0.3, 0.1, 0.8, 0.4],
            'separation': [0.3, 0.1, 0.7, 0.9, 0.2, 0.6],
            'growth': [0.8, 0.6, 0.2, 0.1, 0.9, 0.5],
            'decay': [0.2, 0.1, 0.8, 0.7, 0.1, 0.8],
            'light': [0.9, 0.7, 0.1, 0.0, 0.8, 0.2],
            'dark': [0.1, 0.1, 0.9, 0.9, 0.1, 0.9],
            'movement': [0.7, 0.3, 0.6, 0.4, 0.8, 0.3],
            'stillness': [0.2, 0.8, 0.1, 0.7, 0.1, 0.8],
            'function': [0.8, 0.2, 0.7, 0.3, 0.6, 0.1],
            'class': [0.7, 0.3, 0.8, 0.4, 0.5, 0.2],
            'loop': [0.6, 0.1, 0.5, 0.2, 0.9, 0.1],
            'data': [0.5, 0.7, 0.2, 0.6, 0.3, 0.4],
            'render': [0.3, 0.4, 0.6, 0.9, 0.2, 0.3],
            'mesh': [0.2, 0.3, 0.7, 0.9, 0.1, 0.5],
            'love': [0.9, 0.9, 0.1, 0.0, 0.7, 0.2],
            'fear': [0.1, 0.2, 0.9, 0.8, 0.2, 0.9],
            'joy': [0.9, 0.8, 0.1, 0.1, 0.9, 0.1],
            'sadness': [0.2, 0.3, 0.7, 0.6, 0.1, 0.8],
        }
        result = {}
        for key, vec in concepts.items():
            padded = vec + [0.0] * (self.dim - len(vec))
            result[key] = Vector(padded).normalize()
        return result

    def embed(self, content: str) -> Vector:
        content_lower = content.lower()
        embedding = Vector.zeros(self.dim)
        total_weight = 0.0

        for concept, vector in self.concept_space.items():
            weight = content_lower.count(concept) * 0.5 + 0.1
            if concept in content_lower:
                embedding = embedding.add(vector.scale(weight))
                total_weight += weight

        if total_weight > 0:
            embedding = embedding.scale(1.0 / total_weight)
        else:
            hash_val = int(hashlib.md5(content.encode()).hexdigest(), 16)
            embedding = Vector.random(self.dim, hash_val % (2**32))

        return embedding.normalize()

    def similarity(self, emb1: Vector, emb2: Vector) -> float:
        return emb1.dot(emb2)

    def route_to_hexagram(self, embedding: Vector, dimension: str) -> int:
        dimension_hexagrams = {
            'semantic': [1, 2, 11, 12, 13, 14],
            'relational': [31, 32, 37, 38, 53, 54],
            'operational': [3, 4, 5, 6, 21, 22],
            'visual': [22, 30, 56, 20, 10, 23],
            'temporal': [24, 25, 49, 50, 63, 64],
            'metaphysical': [41, 42, 47, 48, 61, 62]
        }
        hexagrams = dimension_hexagrams.get(dimension, [1])
        best_hex = hexagrams[0]
        best_score = -1.0

        for hex_num in hexagrams:
            hex_sig = Vector.random(self.dim, hex_num * 1000).normalize()
            score = embedding.dot(hex_sig)
            if score > best_score:
                best_score = score
                best_hex = hex_num
        return best_hex

# ============================================================
# MESSAGE OBJECTS
# ============================================================

@dataclass
class Message:
    id: str = field(default_factory=lambda: str(uuid.uuid4())[:8])
    sender: str = ""
    recipient: str = ""
    content: Any = None
    content_type: str = "text"
    intent: str = "inform"
    semantic_vector: Optional[Vector] = None
    timestamp: float = field(default_factory=time.time)
    ttl: int = 10
    trace: List[str] = field(default_factory=list)
    capabilities_required: List[str] = field(default_factory=list)
    transformation_chain: List[str] = field(default_factory=list)

    def mutate(self, transformation: str, new_content: Any) -> 'Message':
        return Message(
            sender=self.recipient or self.sender,
            recipient="",
            content=new_content,
            content_type=self.content_type,
            intent="mutate",
            semantic_vector=self.semantic_vector,
            ttl=self.ttl - 1,
            trace=self.trace + [transformation],
            capabilities_required=self.capabilities_required,
            transformation_chain=self.transformation_chain + [transformation]
        )

# ============================================================
# ACTOR / MAILBOX
# ============================================================

class Actor:
    def __init__(self, actor_id: str, address: IChingAddress, capabilities: List[str]):
        self.actor_id = actor_id
        self.address = address
        self.capabilities = set(capabilities)
        self.mailbox: deque = deque()
        self.state: Dict[str, Any] = {}
        self.subscriptions: Set[str] = set()
        self.active = True
        self.processed_count = 0

    def receive(self, msg: Message) -> None:
        self.mailbox.append(msg)

    def process(self) -> List[Message]:
        outputs = []
        while self.mailbox and self.active:
            msg = self.mailbox.popleft()

            if msg.intent == 'mutate':
                transformed = self._transform_content(msg.content)
                mutated = msg.mutate(f"actor_{self.actor_id}", transformed)
                mutated.recipient = "next_dimension"
                outputs.append(mutated)
            elif msg.intent == 'inform':
                self.state[f"info_{msg.id}"] = msg.content
            elif msg.intent == 'propagate':
                for sub_id in self.subscriptions:
                    outputs.append(Message(
                        sender=self.actor_id,
                        recipient=sub_id,
                        content=msg.content,
                        intent='inform',
                        ttl=msg.ttl - 1,
                        trace=msg.trace + [f"prop_{self.actor_id}"]
                    ))

            self.processed_count += 1
        return outputs

    def _transform_content(self, content: Any) -> Any:
        dimension = self.address.dimension
        if dimension == 'semantic':
            return {'type': 'semantic_core', 'data': content, 'extracted': self._extract_semantics(content)}
        elif dimension == 'relational':
            return {'type': 'relational_web', 'connections': self._find_relations(content), 'source': content}
        elif dimension == 'operational':
            return {'type': 'operational_seq', 'steps': ['parse', 'analyze', 'transform', 'emit'], 'input': content}
        elif dimension == 'visual':
            return {'type': 'visual_scaffold', 'geometry': {'vertices': 100, 'faces': 50}, 'source': content}
        elif dimension == 'temporal':
            return {'type': 'temporal_flow', 'timeline': ['t0', 't1', 't2', 't3'], 'source': content}
        elif dimension == 'metaphysical':
            return {'type': 'meta_pattern', 'iching': {'hexagram': self.address.hexagram}, 'source': content}
        return content

    def _extract_semantics(self, content: Any) -> Dict:
        if isinstance(content, str):
            return {'concepts': [w for w in content.lower().split() if len(w) > 3], 'length': len(content)}
        return {'type': type(content).__name__}

    def _find_relations(self, content: Any) -> List[str]:
        return ['link_' + str(hash(str(content)) % 1000) for _ in range(3)]

# ============================================================
# ONTOLOGY REGISTRY (Mobile-Optimized, JSON-serializable)
# ============================================================

class OntologyRegistry:
    def __init__(self):
        self.addresses: Dict[str, Dict] = {}
        self.traits: Dict[str, List[str]] = {}
        self.capabilities: Dict[str, List[str]] = {}
        self.relationships: Dict[str, List[Tuple[str, str]]] = {}
        self.history: Dict[str, List[Dict]] = {}
        self.content_store: Dict[str, Any] = {}
        self.embeddings: Dict[str, List[float]] = {}

    def register(self, address: str, embedding: Vector, traits: List[str], 
                 capabilities: List[str], content: Any = None) -> None:
        self.addresses[address] = {
            'registered_at': time.time(),
            'access_count': 0,
            'last_accessed': time.time()
        }
        self.traits[address] = traits
        self.capabilities[address] = capabilities
        self.embeddings[address] = embedding.data
        if content is not None:
            self.content_store[address] = content
        self.history[address] = [{'event': 'registered', 'timestamp': time.time()}]

    def query(self, address: str) -> Dict:
        if address in self.addresses:
            self.addresses[address]['access_count'] += 1
            self.addresses[address]['last_accessed'] = time.time()
        return {
            'address': address,
            'metadata': self.addresses.get(address, {}),
            'traits': self.traits.get(address, []),
            'capabilities': self.capabilities.get(address, []),
            'history': self.history.get(address, []),
            'content': self.content_store.get(address)
        }

    def save_to_file(self, filepath: str) -> None:
        data = {
            'addresses': self.addresses,
            'traits': self.traits,
            'capabilities': self.capabilities,
            'relationships': self.relationships,
            'history': self.history,
            'embeddings': self.embeddings,
            'content_store': {k: str(v) for k, v in self.content_store.items()}
        }
        with open(filepath, 'w') as f:
            json.dump(data, f, indent=2)

    def load_from_file(self, filepath: str) -> None:
        with open(filepath, 'r') as f:
            data = json.load(f)
        self.addresses = data.get('addresses', {})
        self.traits = data.get('traits', {})
        self.capabilities = data.get('capabilities', {})
        self.relationships = data.get('relationships', {})
        self.history = data.get('history', {})
        self.embeddings = data.get('embeddings', {})
        self.content_store = data.get('content_store', {})

    def get_stats(self) -> Dict:
        return {
            'total_addresses': len(self.addresses),
            'total_content_items': len(self.content_store)
        }

# ============================================================
# CAPABILITY EXTRACTOR
# ============================================================

class CapabilityExtractor:
    PATTERNS = {
        'render': ['render', 'draw', 'display', 'show', 'visualize'],
        'compute': ['calculate', 'compute', 'solve', 'process'],
        'generate': ['generate', 'create', 'build', 'make'],
        'transform': ['transform', 'convert', 'change', 'mutate'],
        'store': ['store', 'save', 'persist', 'keep'],
        'retrieve': ['retrieve', 'load', 'fetch', 'get'],
        'communicate': ['send', 'receive', 'message', 'talk'],
        'learn': ['learn', 'adapt', 'train', 'optimize'],
    }

    def extract(self, content: str) -> List[str]:
        content_lower = content.lower()
        found = []
        for capability, patterns in self.PATTERNS.items():
            if any(p in content_lower for p in patterns):
                found.append(capability)
        if any(m in content for m in ['def ', 'class ', 'import ']):
            found.append('executable')
        return list(set(found))

# ============================================================
# EXECUTABLE MODULE (Mobile-Safe)
# ============================================================

class ExecutableModule:
    def __init__(self, module_id: str, source_code: str, capabilities: List[str]):
        self.module_id = module_id
        self.source_code = source_code
        self.capabilities = capabilities
        self.compiled = None
        self.state: Dict[str, Any] = {}
        self._compile()

    def _compile(self):
        try:
            self.compiled = compile(self.source_code, f"<module_{self.module_id}>", 'exec')
        except SyntaxError as e:
            self.compiled = None
            self.state['compile_error'] = str(e)

    def execute(self, context: Dict = None) -> Dict:
        if self.compiled is None:
            return {'error': 'compilation_failed'}
        exec_context = {'__name__': f'module_{self.module_id}', 'state': self.state}
        if context:
            exec_context.update(context)
        try:
            exec(self.compiled, exec_context)
            return {'status': 'executed', 'output': exec_context.get('output')}
        except Exception as e:
            return {'error': 'execution_failed', 'details': str(e)}

    def mount(self, registry: OntologyRegistry, address: str) -> bool:
        registry.register(
            address=address,
            embedding=Vector.zeros(64),
            traits=['executable', 'module'] + self.capabilities,
            capabilities=self.capabilities,
            content=self.source_code
        )
        return True

# ============================================================
# AUTOLING MOBILE RUNTIME
# ============================================================

class AutoLingMobile:
    """Lightweight mobile runtime, no asyncio, no numpy"""

    def __init__(self):
        self.embedder = SemanticEmbedder(dim=64)
        self.registry = OntologyRegistry()
        self.extractor = CapabilityExtractor()
        self.actors: Dict[str, Actor] = {}
        self.modules: Dict[str, ExecutableModule] = {}
        self._init_actors()

    def _init_actors(self):
        dimensions = ['semantic', 'relational', 'operational', 'visual', 'temporal', 'metaphysical']
        dimension_hexagrams = {
            'semantic': [1, 2, 11, 12, 13, 14],
            'relational': [31, 32, 37, 38, 53, 54],
            'operational': [3, 4, 5, 6, 21, 22],
            'visual': [22, 30, 56, 20, 10, 23],
            'temporal': [24, 25, 49, 50, 63, 64],
            'metaphysical': [41, 42, 47, 48, 61, 62]
        }

        for dim in dimensions:
            for hex_num in dimension_hexagrams[dim]:
                addr = IChingAddress(hex_num, 1, 1, 1, 1)
                addr.dimension = dim
                actor_id = f"{dim}_gate_{hex_num}"
                actor = Actor(actor_id, addr, [dim, 'route', 'transform'])
                actor.state['embedder'] = self.embedder
                self.actors[actor_id] = actor
                self.registry.register(
                    address=addr.to_string(),
                    embedding=Vector.zeros(64),
                    traits=[dim, 'gate'],
                    capabilities=[dim, 'route', 'transform']
                )

    def ingest(self, content: str, content_type: str = "text") -> Dict:
        """Synchronous ingestion for mobile (no asyncio)"""
        capabilities = self.extractor.extract(content)
        embedding = self.embedder.embed(content)

        msg = Message(
            sender="user",
            recipient="semantic_gate_1",
            content=content,
            content_type=content_type,
            intent='mutate',
            semantic_vector=embedding
        )

        dimensions = ['semantic', 'relational', 'operational', 'visual', 'temporal', 'metaphysical']
        results = []
        current_msg = msg

        for i, dim in enumerate(dimensions):
            hex_num = self.embedder.route_to_hexagram(embedding, dim)
            actor_id = f"{dim}_gate_{hex_num}"

            if actor_id not in self.actors:
                break

            actor = self.actors[actor_id]
            current_msg.recipient = actor_id
            actor.receive(current_msg)
            outputs = actor.process()

            mutated = None
            for out in outputs:
                if out.intent == 'mutate' and out.ttl > 0:
                    mutated = out
                    results.append({
                        'dimension': dim,
                        'actor': actor_id,
                        'hexagram': hex_num,
                        'address': actor.address.to_string(),
                        'transformation': out.content,
                        'trace': out.trace
                    })

            if mutated:
                current_msg = mutated
                if i + 1 < len(dimensions):
                    next_dim = dimensions[i + 1]
                    next_hex = self.embedder.route_to_hexagram(embedding, next_dim)
                    current_msg.recipient = f"{next_dim}_gate_{next_hex}"
            else:
                break

        final_address = results[-1]['address'] if results else "unknown"

        self.registry.register(
            address=final_address,
            embedding=embedding,
            traits=capabilities + ['ingested'],
            capabilities=capabilities,
            content=content
        )

        return {
            'system': 'AutoLing Mobile v2.1',
            'input': content,
            'capabilities_found': capabilities,
            'dimensions_processed': len(results),
            'transformation_chain': results,
            'final_address': final_address,
            'registry_stats': self.registry.get_stats()
        }

    def dispatch(self, address: str, backend: str = 'trellis') -> Dict:
        record = self.registry.query(address)
        content = record.get('content', '')

        addr_str = record['address']
        parts = addr_str.split('.')
        hex_num = int(parts[0][1:]) if len(parts) > 0 else 1
        line = int(parts[1][1:]) if len(parts) > 1 else 1
        color = int(parts[2][1:]) if len(parts) > 2 else 1
        tone = int(parts[3][1:]) if len(parts) > 3 else 1
        base = int(parts[4][1:]) if len(parts) > 4 else 1

        return {
            'backend': backend,
            'address': address,
            'input_content': str(content)[:100],
            'generation_params': {
                'resolution': 16 + (color * 8),
                'steps': 12 + line,
                'cfg': 3.0 + (color * 0.5),
                'seed': hex_num * 1000 + line * 100 + color * 10
            },
            'status': 'queued'
        }

    def mount_module(self, module_id: str, source_code: str, address: str) -> bool:
        capabilities = self.extractor.extract(source_code)
        module = ExecutableModule(module_id, source_code, capabilities)
        self.modules[module_id] = module
        return module.mount(self.registry, address)

    def save_state(self, filepath: str) -> None:
        self.registry.save_to_file(filepath)

    def load_state(self, filepath: str) -> None:
        self.registry.load_from_file(filepath)

    def get_stats(self) -> Dict:
        return {
            'actors': len(self.actors),
            'modules': len(self.modules),
            'registry': self.registry.get_stats()
        }

# ============================================================
# KIVY UI SECTION (Commented out - uncomment for Android build)
# ============================================================
# To build Android APK:
#   1. pip install kivy
#   2. Uncomment the section below
#   3. Build with buildozer: buildozer android debug
# ============================================================
