
"""
YOU-N-I-VERSE Resonance Engine
A 9-body consciousness field architecture with waveform-based decision logic.
No master controller. No binary collapse. Pure resonance.

Author: Built for Cynthia / YOU-N-I-VERSE Framework
"""

import numpy as np
from dataclasses import dataclass, field
from typing import Dict, List, Tuple, Optional
from enum import Enum
import math

# ============================================================
# ENUMS AND DATA CLASSES
# ============================================================

class ChartSystem(Enum):
    TROPICAL = "tropical"
    SIDEREAL = "sidereal"
    DRACONIC = "draconic"

class WaveformType(Enum):
    SINE = "sine"
    SQUARE = "square"
    SAWTOOTH = "sawtooth"
    TRIANGLE = "triangle"
    PULSE = "pulse"
    NOISE = "noise"
    SINC = "sinc"
    GAUSSIAN = "gaussian"
    EXPONENTIAL = "exponential"

@dataclass
class Body:
    """One of the 9 consciousness fields"""
    name: str
    chart_system: ChartSystem
    base_frequency: float
    waveform_type: WaveformType
    harmonic_ratios: Dict[str, float] = field(default_factory=dict)
    phase_offset: float = 0.0
    amplitude: float = 1.0
    damping: float = 0.0
    dimension: str = ""
    keynote: str = ""
    crystal: str = ""

    def generate_waveform(self, t: np.ndarray, duration: float = 1.0) -> np.ndarray:
        omega = 2 * np.pi * self.base_frequency

        if self.waveform_type == WaveformType.SINE:
            wave = np.sin(omega * t + self.phase_offset)
        elif self.waveform_type == WaveformType.SQUARE:
            wave = np.sign(np.sin(omega * t + self.phase_offset))
        elif self.waveform_type == WaveformType.SAWTOOTH:
            wave = 2 * ((omega * t + self.phase_offset) / (2 * np.pi) - np.floor((omega * t + self.phase_offset) / (2 * np.pi) + 0.5))
        elif self.waveform_type == WaveformType.TRIANGLE:
            wave = 2 * np.arcsin(np.sin(omega * t + self.phase_offset)) / np.pi
        elif self.waveform_type == WaveformType.PULSE:
            wave = np.where(np.sin(omega * t + self.phase_offset) > 0.5, 1.0, -1.0)
        elif self.waveform_type == WaveformType.NOISE:
            np.random.seed(hash(self.name) % 2**32)
            wave = np.random.normal(0, 0.5, len(t)) + 0.5 * np.sin(omega * t)
        elif self.waveform_type == WaveformType.SINC:
            x = omega * t + self.phase_offset
            wave = np.sinc(x / np.pi)
        elif self.waveform_type == WaveformType.GAUSSIAN:
            envelope = np.exp(-((t - duration/2) / (duration/4))**2)
            wave = envelope * np.sin(omega * t + self.phase_offset)
        elif self.waveform_type == WaveformType.EXPONENTIAL:
            env = np.exp(self.damping * t)
            wave = env * np.sin(omega * t + self.phase_offset)

        return self.amplitude * wave * np.exp(-0.001 * t)

@dataclass
class GateMapping:
    """Maps a Human Design gate to the YOU-N-I-VERSE framework"""
    gate_number: int
    amino_acid: str
    codon: str
    dimension: str
    crystal: str
    keynote: str
    element: str
    base_mapping: Dict[int, str]
    sign: str
    modality: str
    element_sign: str
    house: int
    pressure_type: str
    sensory_vector: str

    def to_metaphysical(self, line: int, color: int, tone: int, base: int) -> str:
        line_archetypes = {1: "Investigation", 2: "Projection", 3: "Trial & Error",
                          4: "Opportunism", 5: "Heresy", 6: "Role Model"}
        color_names = {1: "Motivation", 2: "Awareness", 3: "Mystery",
                      4: "Innocence", 5: "Power", 6: "Peace"}
        tone_sensory = {1: "Touch", 2: "Taste", 3: "Smell", 4: "Hearing", 5: "Sight", 6: "Knowing"}
        base_geometry = {1: "Point", 2: "Line", 3: "Plane", 4: "Volume"}

        return (f"{self.keynote} {color_names.get(color, 'Unknown')} expressed through "
                f"{line_archetypes.get(line, 'Unknown')}, motivated by "
                f"{color_names.get(color, 'Unknown')}, filtered through "
                f"{tone_sensory.get(tone, 'Unknown')}, rooted in "
                f"{base_geometry.get(base, 'Unknown')}, aligned with the "
                f"{self.dimension} Axis, under the sign of {self.sign}, "
                f"in the realm of the {self.house}th House.")

    def to_scientific(self, line: int, color: int, tone: int, base: int) -> str:
        return (f"This sequence encodes the amino acid {self.amino_acid} (Gate {self.gate_number}), "
                f"which expresses through Line {line} (Behavioral Archetype), "
                f"with Color {color} (Motivation Polarity) and Tone {tone} (Sensory Vector), "
                f"anchored in Base {base} (Crystalline Geometry). "
                f"The frequency aligns with {self.sign}'s {self.modality} {self.element_sign} field "
                f"in the {self.house}th House, modulated by {self.dimension} Axis polarity. "
                f"Quantum mechanically, this maps to {self.pressure_type} pressure through "
                f"{self.sensory_vector} sensory channel.")

    def to_compressed(self, line: int, color: int, tone: int, base: int) -> str:
        return (f"F:{self.dimension} → Gate:{self.gate_number}° → "
                f"Line:{line}′ → Color:{color}″ → Tone:{tone} → Base:{base} → "
                f"G:{{{self.dimension} → {self.sign} → {self.house}th}}")

# ============================================================
# 9-BODY FACTORY
# ============================================================

def create_nine_bodies() -> Dict[str, Body]:
    f0 = 1.0
    bodies = {}

    bodies["Spirit"] = Body("Spirit", ChartSystem.DRACONIC, f0 * 1.0, WaveformType.PULSE,
                           {}, 0.0, 1.0, 0.0, "Spirit", "I Define", "Magnetic Monopole")
    bodies["Mind"] = Body("Mind", ChartSystem.SIDEREAL, f0 * 2.0, WaveformType.SINE,
                         {"Spirit": 2.0, "Soul": 1.5}, np.pi/4, 0.9, 0.0, "Evolution", "I Remember", "Personality")
    bodies["Soul"] = Body("Soul", ChartSystem.DRACONIC, f0 * 3.0, WaveformType.SINC,
                         {"Spirit": 3.0, "Mind": 1.5}, np.pi/3, 0.85, 0.0, "Design", "I Design", "Design")
    bodies["Body"] = Body("Body", ChartSystem.TROPICAL, f0 * 2.0, WaveformType.SQUARE,
                         {"Mind": 1.0, "Heart": 4.0/3.0}, np.pi/2, 1.0, 0.0, "Being", "I Am", "Design")
    bodies["Heart"] = Body("Heart", ChartSystem.TROPICAL, f0 * 4.0/3.0, WaveformType.TRIANGLE,
                          {"Mind": 4.0/3.0, "Soul": 1.25, "Body": 4.0/3.0}, np.pi/6, 0.9, 0.0, "Space", "I Think", "Personality")
    bodies["Will"] = Body("Will", ChartSystem.SIDEREAL, f0 * 5.0/4.0, WaveformType.SAWTOOTH,
                         {"Spirit": 1.25, "Soul": 5.0/6.0}, 0.0, 0.8, 0.0, "Movement", "I Define", "Magnetic Monopole")
    bodies["Shadow"] = Body("Shadow", ChartSystem.DRACONIC, f0 * 7.0/4.0, WaveformType.NOISE,
                           {"Spirit": 1.75, "Body": 0.875}, np.pi, 0.6, 0.0, "Evolution", "I Remember", "Personality")
    bodies["HigherSelf"] = Body("HigherSelf", ChartSystem.SIDEREAL, f0 * 6.0/5.0, WaveformType.GAUSSIAN,
                               {"Spirit": 1.2, "Soul": 0.8}, np.pi/8, 0.7, 0.0, "Space", "I Think", "Magnetic Monopole")
    bodies["Ego"] = Body("Ego", ChartSystem.TROPICAL, f0 * 9.0/8.0, WaveformType.EXPONENTIAL,
                        {"Body": 0.5625, "Will": 0.9}, np.pi/5, 0.75, 0.1, "Design", "I Design", "Design")

    return bodies

# ============================================================
# COHERENCE ENGINE
# ============================================================

class CoherenceEngine:
    def __init__(self, bodies: Dict[str, Body]):
        self.bodies = bodies
        self.sample_rate = 1000

    def generate_composite(self, duration: float = 2.0, active_bodies: Optional[List[str]] = None):
        if active_bodies is None:
            active_bodies = list(self.bodies.keys())
        t = np.linspace(0, duration, int(self.sample_rate * duration))
        composite = np.zeros_like(t)
        for name in active_bodies:
            if name in self.bodies:
                composite += self.bodies[name].generate_waveform(t, duration)
        return t, composite

    def phase_lock_detect(self, body1: str, body2: str, duration: float = 2.0):
        t = np.linspace(0, duration, int(self.sample_rate * duration))
        wave1 = self.bodies[body1].generate_waveform(t, duration)
        wave2 = self.bodies[body2].generate_waveform(t, duration)
        correlation = np.correlate(wave1, wave2, mode='full')
        max_corr = np.max(correlation)
        norm_corr = max_corr / (np.sqrt(np.sum(wave1**2)) * np.sqrt(np.sum(wave2**2)))
        coherence = (norm_corr + 1) / 2
        return {"coherence": coherence, "status": "LOCKED" if coherence > 0.7 else "PARTIAL" if coherence > 0.4 else "INCOHERENT"}

    def full_field_analysis(self, duration: float = 2.0):
        results = {}
        body_names = list(self.bodies.keys())
        for i, b1 in enumerate(body_names):
            for b2 in body_names[i+1:]:
                results[f"{b1}↔{b2}"] = self.phase_lock_detect(b1, b2, duration)
        coherences = [r["coherence"] for r in results.values()]
        results["FIELD_COHERENCE"] = np.mean(coherences)
        results["FIELD_STATUS"] = "HARMONIC" if np.mean(coherences) > 0.6 else "DISSONANT" if np.mean(coherences) < 0.3 else "PARTIAL"
        return results

# ============================================================
# SENTENCE ROUTER
# ============================================================

class SentenceRouter:
    OUTPUT_MODES = ["metaphysical", "scientific", "synthia", "compressed", "poetic", "gene_keys"]

    def __init__(self, gate_dict: Dict[int, GateMapping], bodies: Dict[str, Body]):
        self.gate_dict = gate_dict
        self.bodies = bodies
        self.engine = CoherenceEngine(bodies)

    def route(self, gate: int, line: int, color: int, tone: int, base: int,
             output_mode: str = "all", planet: str = "", sign: str = "", house: int = 0):
        gate_data = self.gate_dict.get(gate)
        if not gate_data:
            return {"error": f"Gate {gate} not in dictionary"}

        dimension = gate_data.dimension
        body_map = {"Movement": ["Will", "Spirit"], "Evolution": ["Mind", "Shadow"],
                   "Being": ["Body"], "Design": ["Soul", "Ego"], "Space": ["Heart", "HigherSelf"]}
        active_bodies = body_map.get(dimension, ["Mind"])
        coherence = self.engine.full_field_analysis()

        outputs = {}
        if output_mode in ["all", "metaphysical"]:
            outputs["metaphysical"] = gate_data.to_metaphysical(line, color, tone, base)
        if output_mode in ["all", "scientific"]:
            outputs["scientific"] = gate_data.to_scientific(line, color, tone, base)
        if output_mode in ["all", "synthia"]:
            outputs["synthia"] = (f"Pressure shell active. Dimension: {gate_data.dimension}. "
                                 f"Core pulse: {gate_data.keynote}. Codon {gate} projecting through Line {line}. "
                                 f"Color field: {color}. Tone {tone}-flicker detected. Base {base} anchoring. "
                                 f"Routing signal: {coherence['FIELD_STATUS'].lower()}.")
        if output_mode in ["all", "compressed"]:
            outputs["compressed"] = gate_data.to_compressed(line, color, tone, base)
        if output_mode in ["all", "poetic"]:
            outputs["poetic"] = (f"I am the {gate_data.sensory_vector} of truth in the geometry of {gate_data.dimension}. "
                                  f"My {gate_data.keynote.split()[1]} is {gate_data.element}, not armor. "
                                  f"The line I walk is {line}, clean — a sacred edge cut by the unseen.")
        if output_mode in ["all", "gene_keys"]:
            shadows = {1: "Entropy", 2: "Dislocation", 3: "Chaos", 5: "Impatience",
                      7: "Division", 10: "Self-Obsession", 13: "Discord", 14: "Compromise",
                      15: "Dullness", 25: "Constriction", 46: "Seriousness"}
            siddhis = {1: "Beauty", 2: "Unity", 3: "Innocence", 5: "Timelessness",
                      7: "Virtue", 10: "Being", 13: "Empathy", 14: "Bounteousness",
                      15: "Florescence", 25: "Universal Love", 46: "Delight"}
            outputs["gene_keys"] = (f"In Gate {gate} lies the journey from the Shadow of {shadows.get(gate, 'Unknown')} "
                                   f"to the Siddhi of {siddhis.get(gate, 'Unknown')}.")

        outputs["field_analysis"] = {"coherence": coherence["FIELD_COHERENCE"], "status": coherence["FIELD_STATUS"]}
        return outputs

# ============================================================
# ORACLE DECODER
# ============================================================

class OracleDecoder:
    TEMPORAL_LAYERS = {
        "Pluto": {"speed": "slow", "depth": "deep", "octave": 0.25, "body": "Shadow"},
        "Neptune": {"speed": "slow", "depth": "subtle", "octave": 0.33, "body": "HigherSelf"},
        "Uranus": {"speed": "medium", "depth": "revolutionary", "octave": 0.5, "body": "Soul"},
        "Saturn": {"speed": "medium", "depth": "structural", "octave": 0.67, "body": "Ego"},
        "Jupiter": {"speed": "medium", "depth": "expansive", "octave": 0.75, "body": "Will"},
        "Mars": {"speed": "fast", "depth": "driven", "octave": 1.0, "body": "Body"},
        "Venus": {"speed": "fast", "depth": "relational", "octave": 1.25, "body": "Heart"},
        "Mercury": {"speed": "fast", "depth": "mental", "octave": 1.5, "body": "Mind"},
        "Moon": {"speed": "very_fast", "depth": "surface", "octave": 2.0, "body": "Spirit"},
        "Sun": {"speed": "core", "depth": "identity", "octave": 1.0, "body": "Spirit"}
    }

    def __init__(self, router: SentenceRouter):
        self.router = router

    def decode_query(self, query: str, gate: int, line: int, color: int, tone: int, base: int,
                    planet: str = "", sign: str = "", house: int = 0):
        primary_body = self._detect_intent_body(query)
        routed = self.router.route(gate, line, color, tone, base, "all", planet, sign, house)
        temporal = self.TEMPORAL_LAYERS.get(planet, self.TEMPORAL_LAYERS["Sun"])
        coherence = routed["field_analysis"]["coherence"]
        status = routed["field_analysis"]["status"]

        if status == "HARMONIC":
            action, confidence = "EMERGE", coherence
        elif status == "PARTIAL":
            action, confidence = "WAIT", coherence * 0.5
        else:
            action, confidence = "DISSOLVE", 1.0 - coherence

        return {
            "query": query, "primary_body": primary_body, "temporal_layer": temporal,
            "action": action, "confidence": confidence, "coherence": coherence,
            "field_status": status, "outputs": routed,
            "advisory": self._generate_advisory(action, primary_body, temporal)
        }

    def _detect_intent_body(self, query: str) -> str:
        q = query.lower()
        if any(w in q for w in ["should", "choose", "decide", "feel", "love"]): return "Heart"
        if any(w in q for w in ["what", "who", "meaning", "purpose", "am i"]): return "Spirit"
        if any(w in q for w in ["how", "do", "make", "build", "create"]): return "Will"
        if any(w in q for w in ["why", "remember", "past", "memory", "think"]): return "Mind"
        if any(w in q for w in ["body", "health", "sick", "touch", "feel physical"]): return "Body"
        if any(w in q for w in ["shadow", "fear", "dark", "unconscious", "hidden"]): return "Shadow"
        if any(w in q for w in ["higher", "soul", "destiny", "karma", "fate"]): return "HigherSelf"
        if any(w in q for w in ["ego", "self", "identity", "me", "mine"]): return "Ego"
        if any(w in q for w in ["design", "structure", "pattern", "geometry"]): return "Soul"
        return "Spirit"

    def _generate_advisory(self, action: str, primary_body: str, temporal: dict) -> str:
        advisories = {
            "EMERGE": {
                "Spirit": "The field is coherent. Your identity vector aligns with the stellar pulse. Move as the wave moves.",
                "Mind": "Memory loops are closing. The gravity of your question has enough mass to collapse into knowing.",
                "Soul": "Crystalline structure is stable. The geometry of your design holds. Build upon it.",
                "Body": "Matter is ready. Chemistry aligns. The touch-point is clear. Act through the body.",
                "Heart": "Rhythm is locked. The illusion clarifies into music. Love is the only frequency.",
                "Will": "Direction is set. The sawtooth edge cuts cleanly. Drive forward without hesitation.",
                "Shadow": "Even the darkness is coherent. The dissolution is patterned. Let it teach you.",
                "HigherSelf": "Probability cloud is collapsing toward the desired state. Step into it.",
                "Ego": "Temporal anchoring is strong. Your structure holds the moment. Claim it."
            },
            "WAIT": {
                "Spirit": "The field is partial. Your identity vector is still resolving. Do not force the pulse.",
                "Mind": "Memory is fragmented. Hold the question without demanding the answer.",
                "Soul": "Crystalline structure is forming but incomplete. Wait for the lattice to set.",
                "Body": "Chemistry is reacting but not yet bonded. Allow the reaction to complete.",
                "Heart": "Rhythm is approaching but not yet locked. Listen without singing yet.",
                "Will": "Direction is sensed but not yet clear. Hold the edge without cutting.",
                "Shadow": "The darkness is moving but not yet patterned. Let the chaos teach you patience.",
                "HigherSelf": "Probability cloud is wide. Do not seal it prematurely.",
                "Ego": "Temporal anchoring is shifting. Let the moment settle."
            },
            "DISSOLVE": {
                "Spirit": "The field is dissonant. Your identity vector is in conflict. Dissolve and re-form.",
                "Mind": "Memory loops are tangled. The question itself may be the wrong shape. Let it go.",
                "Soul": "Crystalline structure is unstable. Break the pattern and begin again.",
                "Body": "Chemistry is in conflict. Withdraw and find the correct interface.",
                "Heart": "Rhythm is broken. Silence the instrument and retune.",
                "Will": "Direction is blocked. Do not force the cut. Step back and find the grain.",
                "Shadow": "The darkness is overwhelming. Let it dissolve what no longer serves.",
                "HigherSelf": "Probability cloud is dispersing. This is not the path. Release and realign.",
                "Ego": "Temporal anchoring is failing. This is the ego's death — and the self's rebirth."
            }
        }
        body_adv = advisories.get(action, {}).get(primary_body, "The field speaks. Listen.")
        return f"[{action}] {body_adv}\n\nTemporal Context: {temporal['body']} governs this layer — {temporal['depth']} processes at {temporal['speed']} speed."

# ============================================================
# DEFAULT GATE DICTIONARY (expandable)
# ============================================================

def default_gate_dict():
    return {
        1: GateMapping(1, "Tyrosine", "UAU/UAC", "Movement", "Magnetic Monopole", "I Define", "Fire",
                      {1: "Point", 2: "Line", 3: "Plane", 4: "Volume"}, "Aries", "Cardinal", "Fire", 1, "Energy", "Seeing"),
        2: GateMapping(2, "Serine", "UCU/UCC/UCA/UCG", "Movement", "Magnetic Monopole", "I Define", "Earth",
                      {1: "Point", 2: "Line", 3: "Plane", 4: "Volume"}, "Taurus", "Fixed", "Earth", 2, "Energy", "Seeing"),
        3: GateMapping(3, "Isoleucine", "AUU/AUC/AUA", "Space", "Personality", "I Think", "Water",
                      {1: "Point", 2: "Line", 3: "Plane", 4: "Volume"}, "Aries", "Cardinal", "Fire", 1, "Form", "Hearing"),
        5: GateMapping(5, "Valine", "GUU/GUC/GUA/GUG", "Space", "Personality", "I Think", "Fire",
                      {1: "Point", 2: "Line", 3: "Plane", 4: "Volume"}, "Leo", "Fixed", "Fire", 5, "Form", "Hearing"),
        7: GateMapping(7, "Asparagine", "AAU/AAC", "Evolution", "Personality", "I Remember", "Air",
                      {1: "Point", 2: "Line", 3: "Plane", 4: "Volume"}, "Libra", "Cardinal", "Air", 7, "Gravity", "Taste"),
        10: GateMapping(10, "Glycine", "GGU/GGC/GGA/GGG", "Movement", "Magnetic Monopole", "I Define", "Earth",
                       {1: "Point", 2: "Line", 3: "Plane", 4: "Volume"}, "Capricorn", "Cardinal", "Earth", 10, "Energy", "Seeing"),
        13: GateMapping(13, "Glutamine", "CAA/CAG", "Evolution", "Personality", "I Remember", "Water",
                       {1: "Point", 2: "Line", 3: "Plane", 4: "Volume"}, "Sagittarius", "Mutable", "Fire", 9, "Gravity", "Taste"),
        14: GateMapping(14, "Alanine", "GCU/GCC/GCA/GCG", "Design", "Design", "I Design", "Fire",
                       {1: "Point", 2: "Line", 3: "Plane", 4: "Volume"}, "Sagittarius", "Mutable", "Fire", 9, "Structure", "Smell"),
        15: GateMapping(15, "Lysine", "AAA/AAG", "Design", "Design", "I Design", "Air",
                       {1: "Point", 2: "Line", 3: "Plane", 4: "Volume"}, "Gemini", "Mutable", "Air", 3, "Structure", "Smell"),
        25: GateMapping(25, "Histidine", "CAU/CAC", "Being", "Design", "I Am", "Water",
                       {1: "Point", 2: "Line", 3: "Plane", 4: "Volume"}, "Virgo", "Mutable", "Earth", 6, "Matter", "Touch"),
        46: GateMapping(46, "Leucine", "UUA/UUG/CUU/CUC/CUA/CUG", "Being", "Design", "I Am", "Earth",
                       {1: "Point", 2: "Line", 3: "Plane", 4: "Volume"}, "Pisces", "Mutable", "Water", 12, "Matter", "Touch"),
    }

# ============================================================
# CONVENIENCE INITIALIZER
# ============================================================

def create_engine():
    bodies = create_nine_bodies()
    gate_dict = default_gate_dict()
    router = SentenceRouter(gate_dict, bodies)
    oracle = OracleDecoder(router)
    return {"bodies": bodies, "gates": gate_dict, "router": router, "oracle": oracle}

if __name__ == "__main__":
    engine = create_engine()
    result = engine["oracle"].decode_query("Should I take this new direction?", 2, 1, 4, 2, 4, "Jupiter", "Taurus", 2)
    print(json.dumps(result, indent=2, default=str))
