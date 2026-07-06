═══════════════════════════════════════════════════════════════════════════════
KLEIN 1973 → MODERN NEURAL/RAG REBUILD: TECHNICAL ARCHITECTURE
═══════════════════════════════════════════════════════════════════════════════
A Neural Semantic Network Compiler with RAG-Backed Narrative Generation
═══════════════════════════════════════════════════════════════════════════════

PREAMBLE: What Klein Actually Built (1973)
═══════════════════════════════════════════════════════════════════════════════

Hardware: Univac 1108, 75,000 words storage (~300KB)
Language: FORTRAN V
Speed: 2100-word murder mystery in <19 seconds
Core Innovation: Semantic deep structure as directed graph (O-R-O triples) + 
               stochastic simulation + compiler-like production rules + 
               natural language meta-compiler (2nd-order predicate calculus)

═══════════════════════════════════════════════════════════════════════════════
PART 1: THE MODERN NEURAL SEMANTIC NETWORK
═══════════════════════════════════════════════════════════════════════════════

1.1 NEURAL KNOWLEDGE GRAPH EMBEDDING (Replaces Klein's Hash Table)

Klein (1973): The network is actually stored in the form of a hash table,
wherein the actual semantic network is implied and computable rather than
overtly listed.

Modern Equivalent: Graph Neural Network (GNN) with learned embeddings

    INPUT: Raw text / user prompt / story seed
           ↓
    ENTITY EXTRACTION (NER + LLM)
    - Objects: Named entities, concepts, characters
    - Relations: Action verbs, prepositions, causal links
           ↓
    TRIPLE CONSTRUCTION: <head, relation, tail> with timestamps
    - Each triple gets: unique ID, time_of_creation, confidence
    - Temporal ordering: simulation clock (now) maintained
           ↓
    GNN ENCODING (GraphSAGE / GAT / R-GCN)
    - Node embeddings: h_v^(l+1) = σ(AGG({h_u^(l) : u ∈ N(v)}))
    - Relation-aware: h_v = f(h_v, h_u, r) for each edge
    - Multi-hop: L layers capture L-hop neighborhood context
           ↓
    EMBEDDING STORE: Vector database (Chroma / Weaviate / Milvus)
    - Node embeddings indexed by semantic similarity
    - Triple embeddings for fast retrieval

1.2 LEXICAL EXPRESSION LISTS → NEURAL DICTIONARY (Vector Space)

Klein (1973): Atom nodes and relations are linked to expression lists that
may contain lexical stems or roots that are available for insertion into trees
during the generation process.

Modern Equivalent: Dense vector embeddings + transformer token vocabulary

    KLEIN'S BIT VECTOR DICTIONARY  →  NEURAL EMBEDDING MATRIX
    
    Klein:
    ┌─────────┬─────────────────────────────────────────────────┐
    │  Word   │ N V ADJ ADV PREP ... (bit flags per POS)       │
    ├─────────┼─────────────────────────────────────────────────┤
    │  man    │ 1 1 0  0   0  ... (can be noun or verb)       │
    │  ride   │ 1 1 0  0   0  ... (can be noun or verb)       │
    └─────────┴─────────────────────────────────────────────────┘
    
    Modern:
    ┌─────────────────────────────────────────────────────────┐
    │  Word Embedding + POS Tagging (BERT/Flair)                │
    │  + Semantic Role Labeling (SRL)                         │
    │  + FrameNet frames                                      │
    │  + Concreteness/Abstractness scores                     │
    │  + Emotional valence (VAD model)                        │
    │  = 768-dim vector per word                              │
    └─────────────────────────────────────────────────────────┘
    
    Lexical Expression List = Top-k nearest neighbors in
    embedding space, filtered by POS compatibility

═══════════════════════════════════════════════════════════════════════════════
PART 2: RAG-BACKED SEMANTIC TRIPLE RETRIEVAL
═══════════════════════════════════════════════════════════════════════════════

2.1 RAG PIPELINE FOR NARRATIVE GENERATION

Klein's simulation rules were stochastic with controllable randomness.
Modern RAG makes this deterministic-retrieval + stochastic-generation.

    STEP 1: QUERY ENCODING
    - User input / story prompt → LLM encoder (e.g., BGE-M3)
    - Produces query embedding q ∈ R^d
    
    STEP 2: KNOWLEDGE GRAPH RETRIEVAL (GNN-RAG style)
    - GNN scores nodes: p_v = softmax(H^(L) · w)
    - Select top-k nodes by cumulative probability threshold (0.95)
    - Extract shortest paths from query entities to answer nodes
    - Verbalize paths into natural language context
    
    STEP 3: SEMANTIC TRIPLE RETRIEVAL
    - Vector similarity search over triple embeddings
    - Retrieve: <head, relation, tail, timestamp, confidence>
    - Filter by temporal ordering (simulation clock)
    - Rank by relevance to current narrative state
    
    STEP 4: CONTEXT ASSEMBLY
    - Retrieved triples → structured prompt context
    - Include: character states, recent events, causal chains
    - Format: Given that [triple1], and [triple2], then...
    
    STEP 5: LLM GENERATION (Stochastic, temperature-controlled)
    - Prompt: context + narrative instruction + style constraints
    - Output: next sentence/paragraph with embedded triples
    - Temperature = Klein's controllable degree of randomness

2.2 HIERARCHICAL KNOWLEDGE GRAPH (LeanRAG / HiRAG style)

Klein's complex predicate nodes (self-referential pointers) =
Hierarchical graph abstraction with recursive clustering.

    LAYER 0: Atomic triples (raw O-R-O from text)
    ├── <John, knows, murder>
    ├── <murder, happened, midnight>
    └── <John, is-a, detective>
    
    LAYER 1: Entity clusters (GMM on embeddings)
    ├── Cluster: Crime Events → aggregated node
    ├── Cluster: Characters → aggregated node
    └── Cluster: Locations → aggregated node
    
    LAYER 2: Community summaries (GraphRAG style)
    ├── The murder mystery involves a detective investigating...
    ├── The house party setting includes...
    └── Motives include greed, jealousy, fear...
    
    LAYER 3: Global narrative schema (Proppian / dramatic)
    ├── Villainy → Mediation → Departure → Struggle → Victory
    └── Exposition → Rising Action → Climax → Falling Action

═══════════════════════════════════════════════════════════════════════════════
PART 3: STOCHASTIC SIMULATION → NEURAL SIMULATION ENGINE
═══════════════════════════════════════════════════════════════════════════════

3.1 SIMULATION LANGUAGE → NEURAL POLICY NETWORK

Klein (1973): The rules of a simulation model are stochastic (with controllable
degrees of randomness) and govern the behavior of individual characters and
events in the modelled universe.

Modern: Reinforcement Learning + LLM-based agent simulation

    KLEIN'S SIMULATION RULE (BNF-like):
    ─────────────────────────────────────────────
    IF <condition on semantic triples>
    THEN <action: SET/DELETE/MODIFY triple>
    WITH PROBABILITY <p>
    ─────────────────────────────────────────────
    
    MODERN NEURAL EQUIVALENT:
    ─────────────────────────────────────────────
    State s_t = current semantic network (GNN embedding)
    Action a_t = {ADD_TRIPLE, DELETE_TRIPLE, MODIFY_TRIPLE,
                  GENERATE_DIALOGUE, ADVANCE_TIME}
    Policy π(a_t | s_t) = Transformer decoder over action space
    Reward R(s_t, a_t) = narrative coherence + dramatic tension
    ─────────────────────────────────────────────
    
    TRAINING:
    - Supervised: Fine-tune on story corpora (ROCStories, etc.)
    - RL: PPO / GRPO with human preference reward model
    - Self-play: Generate stories, evaluate, iterate

3.2 CHARACTER AGENTS (Multi-Agent Simulation)

Klein (1973): Private semantic universes for individual characters (Section 5.2)

Modern: Each character = autonomous LLM agent with:
    - Personal knowledge graph (subjective beliefs)
    - Emotional state (PAD model: Pleasure-Arousal-Dominance)
    - Goal stack (hierarchical task network)
    - Memory buffer (recent events, long-term character arcs)
    - Behavioral policy (conditioned on personality traits)

    Character Agent Loop:
    ┌─────────────────────────────────────────────────────────────┐
    │  1. PERCEIVE: Update personal KG from shared world state     │
    │  2. BELIEVE: Infer hidden states (theory of mind)           │
    │  3. DESIRE: Evaluate goals against current state             │
    │  4. INTEND: Select action via policy network                  │
    │  5. ACT: Execute action → modify shared semantic network    │
    │  6. SPEAK: Generate dialogue from personal KG + intent      │
    └─────────────────────────────────────────────────────────────┘

═══════════════════════════════════════════════════════════════════════════════
PART 4: GENERATIVE RULES → NEURAL TRANSFORMATIONAL GRAMMAR
═══════════════════════════════════════════════════════════════════════════════

4.1 SURFACE STRUCTURE // SEMANTIC NETWORK (Neural Version)

Klein's canonical form: S → NP VP // O - R

Modern: Seq2Seq / Transformer with structured attention over triples

    INPUT: Semantic triples (ordered by simulation time)
    ├── <O(man), R(ride), O(bicycle)>
    ├── <R(ride), R(in), O(park)>
    └── <O(man), R(is), O(tall)>
    
    NEURAL GENERATION:
    ┌─────────────────────────────────────────────────────────┐
    │  Graph-to-Text Transformer (e.g., GNN + BART/T5)        │
    │                                                         │
    │  Encoder: GNN over triple graph → node embeddings       │
    │  Decoder: Auto-regressive text generation              │
    │  Attention: Structured over triple nodes (not just pos) │
    │  Output: The tall man rides the bicycle in the park.   │
    └─────────────────────────────────────────────────────────┘
    
    HIGH-LEVEL TRANSFORMATIONS (structural):
    - Active/Passive voice selection
    - Clause embedding (relative, complement)
    - Anaphora resolution (pronoun selection)
    - Tense/aspect determination (from simulation clock)
    
    LOW-LEVEL TRANSFORMATIONS (morphological):
    - Inflection: ride → rides, rode, riding, ridden
    - Derivation: tall → tallness, tallish
    - Agreement: subject-verb number agreement
    - Handled by: LLM tokenizer + grammar constraints

4.2 STYLE CONTROL (Section 5.1 of Klein's paper)

Klein (1973): Style control via lexical expression list selection and
transformation marking.

Modern: Controlled text generation via:
    - Prompt engineering (system prompt sets style)
    - Adapter layers (LoRA per style: noir, gothic, minimalist)
    - Constrained decoding (force certain vocabulary, sentence length)
    - Constitutional AI (rule-based constraints on output)

    Style Dimensions:
    ┌─────────────────────────────────────────────────────────────┐
    │  Lexical: vocabulary richness, formality, dialect             │
    │  Syntactic: sentence length, complexity, inversion          │
    │  Narrative: POV, tense, pacing, scene vs summary            │
    │  Emotional: valence, arousal, dominance (VAD)               │
    │  Thematic: genre markers, motif frequency                 │
    └─────────────────────────────────────────────────────────────┘

═══════════════════════════════════════════════════════════════════════════════
PART 5: META-COMPILING → SELF-IMPROVING SYSTEM
═══════════════════════════════════════════════════════════════════════════════

Klein (1973): Natural-language meta-compiling capability -- the use of the
semantic network to generate productions in the simulation language itself
that may themselves be compiled as new rules during the flow of the simulation.

Modern: Self-improving LLM with tool use + code generation

    META-COMPILING LOOP:
    
    1. OBSERVE: System generates story, detects pattern
       e.g., Characters who discover a secret tend to confront
       the secret-keeper within 3 scenes
    
    2. FORMALIZE: LLM writes new simulation rule in Python/DSL
       @simulation_rule
       def secret_confrontation(state):
           if state.has_event(secret_discovered) and
              state.time_since(secret_discovered) < 3:
               return Action(confront, probability=0.7)
    
    3. VALIDATE: Test rule on held-out stories, check coherence
    
    4. COMPILE: Add rule to simulation policy network
       (fine-tune or add to prompt context)
    
    5. DEPLOY: New rule active in next simulation runs
    
    LOGICAL POWER: 2nd-order predicate calculus →
    Neural theorem proving + program synthesis

═══════════════════════════════════════════════════════════════════════════════
PART 6: MODERN TECH STACK
═══════════════════════════════════════════════════════════════════════════════

    ┌──────────────────┬──────────────────┬──────────────────────────────┐
    │  COMPONENT       │  KLEIN 1973      │  MODERN 2024                 │
    ├──────────────────┼──────────────────┼──────────────────────────────┤
    │  Hardware        │  Univac 1108     │  GPU cluster (A100/H100)       │
    │  Storage         │  75K words       │  Vector DB + KG store          │
    │  Language        │  FORTRAN V       │  Python / PyTorch              │
    │  Semantic Network│  Hash table      │  GNN + Vector DB               │
    │  Triple Store    │  In-memory array │  Neo4j / RDFLib / DGraph       │
    │  Dictionary      │  Bit vector table│  Transformer embeddings        │
    │  Simulation Rules│  BNF grammar     │  RL policy + LLM agents        │
    │  Randomness Ctrl │  PRNG seed       │  Temperature + top-p           │
    │  Generation Rules│  Production rules│  Seq2Seq transformer           │
    │  Transformations │  High/low codes  │  LLM prompt + grammar          │
    │  Meta-compiler   │  Self-mod rules  │  LLM code generation           │
    │  RAG             │  N/A             │  GNN-RAG / GraphRAG            │
    │  Evaluation      │  Human reading   │  LLM-as-judge + metrics        │
    └──────────────────┴──────────────────┴──────────────────────────────┘

═══════════════════════════════════════════════════════════════════════════════
PART 7: IMPLEMENTATION PSEUDOCODE
═══════════════════════════════════════════════════════════════════════════════

# ============================================================
# KLEIN 2024: Neural Semantic Network Narrative Generator
# ============================================================

import torch
import torch.nn as nn
from transformers import AutoModel, AutoTokenizer
from py2neo import Graph
import chromadb

class NeuralSemanticNetwork:
    # Replaces Klein's hash table + triple store.
    
    def __init__(self):
        self.gnn = RGCN(num_relations=50, hidden_dim=256)
        self.vector_db = chromadb.Client()
        self.graph_db = Graph(bolt://localhost:7687)
        self.tokenizer = AutoTokenizer.from_pretrained(BGE-M3)
        self.encoder = AutoModel.from_pretrained(BGE-M3)
        self.simulation_clock = 0
        
    def add_triple(self, head, relation, tail, timestamp=None):
        # Klein's semantic triple with time of creation.
        if timestamp is None:
            timestamp = self.simulation_clock
        triple_id = hash((head, relation, tail, timestamp))
        
        # Store in graph DB
        self.graph_db.run(
            MERGE (h:Object {name: $head}) 
            MERGE (t:Object {name: $tail}) 
            MERGE (h)-[r:RELATION {type: $rel, time: $time, id: $id}]->(t),
            head=head, tail=tail, rel=relation, time=timestamp, id=triple_id
        )
        
        # Encode and store in vector DB
        text = f{head} {relation} {tail}
        embedding = self.encoder.encode(text)
        self.vector_db.add(triple_id, embedding, {
            head: head, relation: relation,
            tail: tail, time: timestamp
        })
        
        return triple_id
    
    def retrieve_relevant(self, query, k=10):
        # RAG retrieval over semantic triples.
        query_emb = self.encoder.encode(query)
        
        # Vector similarity search
        candidates = self.vector_db.query(query_emb, n_results=k*2)
        
        # GNN re-ranking (GNN-RAG style)
        subgraph = self.extract_subgraph(candidates)
        node_scores = self.gnn.score_nodes(subgraph, query_emb)
        
        # Select by cumulative probability
        probs = torch.softmax(node_scores, dim=0)
        cumsum = torch.cumsum(probs, dim=0)
        selected = cumsum < 0.95
        
        return [candidates[i] for i in selected.nonzero()]

class SimulationEngine:
    # Replaces Klein's stochastic simulation language.
    
    def __init__(self, network):
        self.network = network
        self.policy = nn.TransformerDecoder(...)  # Learned policy
        self.characters = {}  # Character agents
        
    def step(self):
        # One simulation tick. Advances story state.
        # Get current state embedding
        state_emb = self.network.gnn.encode_full_graph()
        
        # Sample action from policy (stochastic, like Klein's rules)
        action_probs = self.policy(state_emb)
        action = torch.multinomial(action_probs, 1)
        
        # Execute action: modify semantic network
        if action == ADD_TRIPLE:
            self.generate_event()
        elif action == DELETE_TRIPLE:
            self.resolve_event()
        elif action == ADVANCE_TIME:
            self.network.simulation_clock += 1
            
        # Update all character agents
        for char in self.characters.values():
            char.perceive(self.network)
            char.act(self.network)
            
    def generate_event(self):
        # Create new semantic triple via LLM + RAG.
        context = self.network.retrieve_relevant(
            What happens next?, k=5
        )
        prompt = self.build_narrative_prompt(context)
        
        # LLM generates next event as triple
        event_text = self.llm.generate(prompt, temperature=0.7)
        triple = self.parse_triple(event_text)
        self.network.add_triple(*triple)

class NarrativeGenerator:
    # Replaces Klein's surface structure generation.
    
    def __init__(self, network):
        self.network = network
        self.llm = AutoModel.from_pretrained(Llama-3-70B)
        
    def generate_sentence(self, triples):
        # Klein's generation: triples -> surface structure.
        # Build structured prompt from triples
        triple_text = newline.join([
            f<{t[head]}, {t[relation]}, {t[tail]}>
            for t in triples
        ])
        
        prompt = fGiven these semantic triples, write a natural sentence:
        {triple_text}
        
        Rules:
        - Maintain temporal order (use simulation clock)
        - Apply style: {self.style}
        - Use active voice unless passive is marked
        - Match tense to time differences between triples
        
        return self.llm.generate(prompt, max_length=100)
    
    def generate_story(self, num_words=2100):
        # Generate full story (Klein's 2100-word target).
        sentences = []
        word_count = 0
        
        while word_count < num_words:
            # Get recent triples from simulation
            recent_triples = self.network.get_recent(
                since=self.network.simulation_clock - 5
            )
            
            # Generate sentence from triples
            sentence = self.generate_sentence(recent_triples)
            sentences.append(sentence)
            word_count += len(sentence.split())
            
            # Advance simulation
            self.simulation.step()
            
        return  .join(sentences)

# ============================================================
# META-COMPILING: Self-Improving Simulation Rules
# ============================================================

class MetaCompiler:
    # Klein's natural-language meta-compiler, modernized.
    
    def observe_pattern(self, stories):
        # Detect recurring patterns in generated stories.
        prompt = fAnalyze these stories for recurring behavioral patterns:
        {stories}
        pattern = self.llm.generate(prompt)
        return pattern
    
    def formalize_rule(self, pattern_description):
        # Convert natural language pattern to executable code.
        prompt = fWrite a Python simulation rule from this description:
        {pattern_description}
        
        Format:
        @simulation_rule
        def rule_name(state):
            # condition
            # action with probability
        
        code = self.llm.generate(prompt)
        return code
    
    def compile_rule(self, code):
        # Add rule to simulation engine.
        exec(code)  # In practice: validate, sandbox, integrate
        self.engine.policy.add_rule(code)

═══════════════════════════════════════════════════════════════════════════════
PART 8: EVALUATION FRAMEWORK
═══════════════════════════════════════════════════════════════════════════════

    ┌──────────────────────────┬────────────────────────────────────────────┐
    │  METRIC                  │  METHOD                                    │
    ├──────────────────────────┼────────────────────────────────────────────┤
    │  Narrative Coherence     │  LLM-as-judge (GPT-4/Claude score 1-10)   │
    │  Semantic Fidelity       │  Parse generated text back to triples,     │
    │                          │  compare to input triples (P/R)          │
    │  Temporal Consistency    │  Check tense agreement with sim clock    │
    │  Character Consistency   │  Entity coreference + personality stab.  │
    │  Plot Progression        │  Proppian function detection + ordering    │
    │  Style Adherence         │  BLEURT / BERTScore against style corpus │
    │  Human Preference        │  Side-by-side comparison (Elo ratings)     │
    │  Speed                   │  Words/second (Klein: ~110 words/sec)      │
    │  Meta-compiling Success  │  Rule acceptance rate + story improvement  │
    └──────────────────────────┴────────────────────────────────────────────┘

═══════════════════════════════════════════════════════════════════════════════
PART 9: THE DEV LOCK (Modern Specification)
═══════════════════════════════════════════════════════════════════════════════

Klein-2024 recognizes narrative structure by maintaining a neural semantic network
of objects and relations, interrogated through retrieval-augmented generation.
The simulation engine advances story state via learned stochastic policies.
Characters perceive, believe, desire, intend, and act as autonomous LLM agents.
The generative component maps semantic triples to surface text via transformer
decoders with structured attention. The meta-compiler observes patterns, formalizes
rules, and compiles them into the simulation engine. The pattern is in the network.
The retrieval finds it. The generation expresses it. The network is never wrong.
The recognition is.

═══════════════════════════════════════════════════════════════════════════════
PART 10: DELIVERABLES & NEXT MOVES
═══════════════════════════════════════════════════════════════════════════════

    ┌────────┬────────────────────────────────────────────────────────────────┐
    │  CODE  │  DELIVERABLE                                                   │
    ├────────┼────────────────────────────────────────────────────────────────┤
    │ ENGINE │ PyTorch: NeuralSemanticNetwork + SimulationEngine             │
    │ SCHEMA │ Neo4j graph schema + Chroma vector collection setup           │
    │ CI     │ pytest: triple CRUD, RAG retrieval, generation coherence    │
    │ DEMO   │ Jupyter: seed -> triple graph -> 2100-word story generation   │
    │ ZIP    │ Dev kit: GNN weights, story corpus, style adapters,           │
    │        │          simulation rule templates, evaluation prompts      │
    └────────┴────────────────────────────────────────────────────────────────┘

═══════════════════════════════════════════════════════════════════════════════
