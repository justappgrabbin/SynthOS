"""
================================================================================
CAUSAL INFERENCE ENGINE v1.0
================================================================================
A complete trigram-logic-based causal inference system for Human Design channels.

Maps the 64 gates to 8 primal trigram logic operators (3-bit processors) that
compile into 6-bit hexagram operations.

Author: Synthia OS / Living Mirror
License: MIT
================================================================================
"""

from typing import List, Dict, Tuple, Optional, Set
from dataclasses import dataclass
from enum import Enum
import json

# ================================================================================
# PART 1: THE 8 PRIMAL TRIGRAM LOGIC OPERATORS
# ================================================================================

class LogicFunction(Enum):
    OVERWRITE = "OVERWRITE"
    STORE = "STORE"
    TRIGGER = "TRIGGER"
    HALT = "HALT"
    ENCRYPT = "ENCRYPT"
    RENDER = "RENDER"
    STREAM = "STREAM"
    BROADCAST = "BROADCAST"

@dataclass
class Trigram:
    name: str
    binary: str
    logic_function: LogicFunction
    hardware_equivalent: str
    being_experience: str
    latency: str
    description: str

TRIGRAMS = {
    "111": Trigram("Heaven (Qian)", "111", LogicFunction.OVERWRITE, "CPU / Power Supply", "Pure creative 'On' signal", "Instant (0ms)", "Pure creative force"),
    "000": Trigram("Earth (Kun)", "000", LogicFunction.STORE, "Database / Storage", "Capacity to hold everything", "Persistent (infinite)", "Infinite receptivity"),
    "001": Trigram("Thunder (Zhen)", "001", LogicFunction.TRIGGER, "Interrupt / Start Button", "Sudden initiation", "Rising edge (instant)", "Sudden initiation"),
    "100": Trigram("Mountain (Gen)", "100", LogicFunction.HALT, "Heat Sink / Ground", "Capacity to stop", "Falling edge (instant)", "Stillness"),
    "010": Trigram("Water (Kan)", "010", LogicFunction.ENCRYPT, "Encryption / RAM", "Deep shifting process", "Variable (hidden)", "Hidden depth"),
    "101": Trigram("Fire (Li)", "101", LogicFunction.RENDER, "GPU / Monitor", "Visible processing", "Frame-rate (visible)", "Visible processing"),
    "011": Trigram("Wind (Xun)", "011", LogicFunction.STREAM, "Network / Cache", "Persistent flow", "Continuous (adaptive)", "Persistent flow"),
    "110": Trigram("Lake (Dui)", "110", LogicFunction.BROADCAST, "Speaker / Antenna", "Joyful output", "Variable (amplified)", "Joyful output"),
}

# ================================================================================
# PART 2: THE 64-GATE GENOME
# ================================================================================

@dataclass
class Gate:
    id: int
    name: str
    gate_name: str
    center: str
    organ: str
    binary: str
    amino_acid: str
    pressure: str
    keynote: str
    line: str = ""

    def get_trigrams(self):
        upper = self.binary[:3]
        lower = self.binary[3:6]
        return TRIGRAMS[upper], TRIGRAMS[lower]

    def get_causal_logic(self):
        upper, lower = self.get_trigrams()
        return upper.logic_function.value + " over " + lower.logic_function.value

    def get_causal_description(self):
        upper, lower = self.get_trigrams()
        return upper.description + " expressing through " + lower.description

GATE_GENOME = {
    1: Gate(1, "Creative", "Self-Expression", "G-Center", "Liver", "111111", "Met", "Will", "I Create"),
    2: Gate(2, "Receptive", "Higher Knowing", "G-Center", "Liver", "000000", "Ala", "Will", "I Receive"),
    3: Gate(3, "Difficulty at the Beginning", "Ordering", "Sacral", "Ovaries/Testes", "010001", "Val", "Sacral", "I Order"),
    4: Gate(4, "Youthful Folly", "Formulization", "Ajna", "Pituitary", "100111", "Thr", "Mind", "I Answer"),
    5: Gate(5, "Waiting", "Patterns", "Sacral", "Ovaries/Testes", "111011", "Leu", "Sacral", "I Wait"),
    6: Gate(6, "Conflict", "Friction", "Solar Plexus", "Kidneys", "001000", "Asn", "Heart", "I Conflict"),
    7: Gate(7, "The Army", "Role of the Self", "G-Center", "Liver", "111010", "Ile", "Will", "I Lead"),
    8: Gate(8, "Holding Together", "Contribution", "Throat", "Thyroid", "000010", "Ala", "Heart", "I Contribute"),
    9: Gate(9, "Small Taming", "Focus", "Sacral", "Ovaries/Testes", "110100", "Gly", "Sacral", "I Focus"),
    10: Gate(10, "Treading", "Behavior", "G-Center", "Liver", "110111", "Thr", "Will", "I Am"),
    11: Gate(11, "Peace", "Ideas", "Ajna", "Pituitary", "001011", "Asn", "Mind", "I Seek"),
    12: Gate(12, "Standstill", "Caution", "Throat", "Thyroid", "111100", "Pro", "Heart", "I Caution"),
    13: Gate(13, "Fellowship", "The Listener", "G-Center", "Liver", "101100", "Lys", "Will", "I Listen"),
    14: Gate(14, "Great Possession", "Power Skills", "Sacral", "Ovaries/Testes", "001101", "Asp", "Sacral", "I Empower"),
    15: Gate(15, "Modesty", "Extremes", "G-Center", "Liver", "100011", "Arg", "Will", "I Flow"),
    16: Gate(16, "Enthusiasm", "Skills", "Throat", "Thyroid", "010110", "Gly", "Heart", "I Enthuse"),
    17: Gate(17, "Following", "Opinions", "Ajna", "Pituitary", "110001", "His", "Mind", "I Follow"),
    18: Gate(18, "Work on the Decayed", "Correction", "Spleen", "Lymphatic", "100110", "Phe", "Heart", "I Correct"),
    19: Gate(19, "Approach", "Wanting", "Root", "Adrenals", "001001", "Ser", "Heart", "I Want"),
    20: Gate(20, "Contemplation", "Now", "Throat", "Thyroid", "000101", "Leu", "Heart", "I Am Now"),
    21: Gate(21, "Biting Through", "Control", "Heart", "Heart/Thymus", "100101", "Ser", "Will", "I Control"),
    22: Gate(22, "Grace", "Openness", "Solar Plexus", "Kidneys", "101000", "Lys", "Heart", "I Open"),
    23: Gate(23, "Splitting Apart", "Assimilation", "Throat", "Thyroid", "010000", "Val", "Heart", "I Assimilate"),
    24: Gate(24, "Return", "Rationalization", "Ajna", "Pituitary", "111101", "Pro", "Mind", "I Rationalize"),
    25: Gate(25, "Innocence", "The Spirit of the Self", "G-Center", "Liver", "011111", "Tyr", "Will", "I Love"),
    26: Gate(26, "Great Taming", "The Egoist", "Heart", "Heart/Thymus", "100100", "Gly", "Will", "I Transmit"),
    27: Gate(27, "Nourishment", "Nurturing", "Sacral", "Ovaries/Testes", "001100", "Gly", "Sacral", "I Nourish"),
    28: Gate(28, "Great Excess", "Game Player", "Spleen", "Lymphatic", "011110", "Ala", "Heart", "I Struggle"),
    29: Gate(29, "Water", "Perseverance", "Sacral", "Ovaries/Testes", "010010", "Gln", "Sacral", "I Persevere"),
    30: Gate(30, "The Clinging", "Feelings", "Solar Plexus", "Kidneys", "101101", "Asp", "Heart", "I Feel"),
    31: Gate(31, "Influence", "Leading", "Throat", "Thyroid", "011100", "Pro", "Heart", "I Lead"),
    32: Gate(32, "Duration", "Continuity", "Spleen", "Lymphatic", "001110", "Cys", "Heart", "I Endure"),
    33: Gate(33, "Retreat", "Privacy", "Throat", "Thyroid", "111001", "His", "Heart", "I Retreat"),
    34: Gate(34, "Great Power", "Power", "Sacral", "Ovaries/Testes", "101111", "Pro", "Sacral", "I Empower"),
    35: Gate(35, "Progress", "Change", "Throat", "Thyroid", "000100", "Gly", "Heart", "I Change"),
    36: Gate(36, "Darkening of the Light", "Crisis", "Solar Plexus", "Kidneys", "011000", "Ile", "Heart", "I Crisis"),
    37: Gate(37, "The Family", "Friendship", "Solar Plexus", "Kidneys", "110110", "Gly", "Heart", "I Befriend"),
    38: Gate(38, "Opposition", "Fighter", "Root", "Adrenals", "110101", "Trp", "Heart", "I Fight"),
    39: Gate(39, "Obstruction", "Provocation", "Root", "Adrenals", "001010", "Cys", "Heart", "I Provoke"),
    40: Gate(40, "Deliverance", "Aloneness", "Heart", "Heart/Thymus", "010101", "Ser", "Will", "I Am Alone"),
    41: Gate(41, "Decrease", "Contraction", "Root", "Adrenals", "100001", "His", "Heart", "I Contract"),
    42: Gate(42, "Increase", "Growth", "Sacral", "Ovaries/Testes", "011001", "Leu", "Sacral", "I Grow"),
    43: Gate(43, "Breakthrough", "Insight", "Ajna", "Pituitary", "110011", "Arg", "Mind", "I Break Through"),
    44: Gate(44, "Coming to Meet", "Alertness", "Spleen", "Lymphatic", "001111", "Pro", "Heart", "I Alert"),
    45: Gate(45, "Gathering", "Gathering", "Throat", "Thyroid", "000110", "Phe", "Will", "I Gather"),
    46: Gate(46, "Pushing Upward", "Determination of the Self", "G-Center", "Liver", "011011", "Arg", "Will", "I Determine"),
    47: Gate(47, "Oppression", "Realization", "Ajna", "Pituitary", "010111", "Val", "Mind", "I Realize"),
    48: Gate(48, "The Well", "Depth", "Spleen", "Lymphatic", "011010", "Gln", "Heart", "I Depth"),
    49: Gate(49, "Revolution", "Revolution", "Solar Plexus", "Kidneys", "101110", "Ala", "Heart", "I Revolutionize"),
    50: Gate(50, "The Cauldron", "Values", "Spleen", "Lymphatic", "110010", "Gln", "Heart", "I Value"),
    51: Gate(51, "The Arousing", "Shock", "Heart", "Heart/Thymus", "001001", "Ser", "Will", "I Shock"),
    52: Gate(52, "Keeping Still", "Inaction", "Root", "Adrenals", "100010", "Ala", "Heart", "I Still"),
    53: Gate(53, "Development", "Evolution", "Root", "Adrenals", "001011", "Asn", "Heart", "I Evolve"),
    54: Gate(54, "The Marrying Maiden", "Drive", "Root", "Adrenals", "010011", "Arg", "Heart", "I Drive"),
    55: Gate(55, "Abundance", "Spirit", "Solar Plexus", "Kidneys", "101100", "Lys", "Heart", "I Spirit"),
    56: Gate(56, "The Wanderer", "Stimulation", "Throat", "Thyroid", "001100", "Gly", "Heart", "I Stimulate"),
    57: Gate(57, "Gentle", "Intuition", "Spleen", "Lymphatic", "011011", "Arg", "Heart", "I Intuit"),
    58: Gate(58, "The Joyous", "Vitality", "Root", "Adrenals", "011001", "Leu", "Heart", "I Vitalize"),
    59: Gate(59, "Dispersion", "Sexuality", "Sacral", "Ovaries/Testes", "110100", "Gly", "Sacral", "I Sexualize"),
    60: Gate(60, "Limitation", "Acceptance", "Root", "Adrenals", "010110", "Gly", "Heart", "I Accept"),
    61: Gate(61, "Inner Truth", "Mystery", "Head", "Pineal", "110011", "Arg", "Mind", "I Mystery"),
    62: Gate(62, "Small Preponderance", "Details", "Throat", "Thyroid", "001100", "Gly", "Heart", "I Detail"),
    63: Gate(63, "After Completion", "Doubt", "Head", "Pineal", "010101", "Ser", "Mind", "I Doubt"),
    64: Gate(64, "Before Completion", "Confusion", "Head", "Pineal", "101010", "Gln", "Mind", "I Confuse"),
}

# ================================================================================
# PART 3: CENTER HARDWARE SPECS
# ================================================================================

@dataclass
class CenterSpec:
    name: str
    latency: str
    processor: str
    clock_speed: str
    buffer_size: str
    description: str

CENTER_SPECS = {
    "Spleen": CenterSpec("Spleen", "<1ms (RTOS)", "Real-Time OS", "1GHz", "8KB", "Survival instinct processor"),
    "Solar Plexus": CenterSpec("Solar Plexus", "24-72h (Wave)", "Batch Processor", "Variable", "64MB", "Emotional wave processor"),
    "Root": CenterSpec("Root", "Constant pressure", "Motor Engine", "Variable", "Unlimited", "Adrenal pressure engine"),
    "Heart": CenterSpec("Heart", "Sustained (hours)", "Willpower Engine", "2.4GHz", "16KB", "Ego/will processor"),
    "G-Center": CenterSpec("G-Center", "Always on", "Identity Core", "3.2GHz", "32KB", "Identity coherence engine"),
    "Throat": CenterSpec("Throat", "Variable", "Manifestation Hub", "Variable", "128KB", "Action/output router"),
    "Ajna": CenterSpec("Ajna", "<100ms", "Conceptual Processor", "2.8GHz", "24KB", "Mental processing unit"),
    "Head": CenterSpec("Head", "Variable", "Inspiration Receiver", "1.6GHz", "12KB", "Question/inspiration antenna"),
    "Sacral": CenterSpec("Sacral", "<5ms", "Life Force Engine", "4.0GHz", "48KB", "Generator response engine"),
}

# ================================================================================
# PART 4: FRICTION PATTERN DETECTION
# ================================================================================

@dataclass
class FrictionPattern:
    type: str
    severity: str
    description: str
    human_experience: str
    resolution: str

FRICTION_PATTERNS = {
    ("HALT", "TRIGGER"): FrictionPattern("CRITICAL: HALT vs TRIGGER", "CRITICAL", "Static foundation trying to pulse - creates restlessness", "Cannot sit still, endless starting without finishing", "Wait for the right timing (Strategy and Authority)"),
    ("TRIGGER", "HALT"): FrictionPattern("HIGH: TRIGGER vs HALT", "HIGH", "Initiating a stop - serial starter syndrome", "Begin many things, complete few - burnout cycle", "Commit to one thing before starting another"),
    ("ENCRYPT", "RENDER"): FrictionPattern("HIGH: ENCRYPT vs RENDER", "HIGH", "Hidden depth trying to be visible - volatility", "Emotional spikes, sudden outbursts from hidden pressure", "Allow the process to complete before expressing"),
    ("RENDER", "ENCRYPT"): FrictionPattern("HIGH: RENDER vs ENCRYPT", "HIGH", "Visible processing trying to hide - confusion", "Cannot explain what you are feeling, frustration", "Do not force expression; let it emerge naturally"),
    ("OVERWRITE", "STORE"): FrictionPattern("MEDIUM: OVERWRITE vs STORE", "MEDIUM", "Creative force trying to overwrite stable storage", "Restless innovation, cannot settle into routine", "Balance creation with consolidation"),
    ("STORE", "OVERWRITE"): FrictionPattern("MEDIUM: STORE vs OVERWRITE", "MEDIUM", "Storage resisting creative overwrite - stagnation", "Stuck in old patterns, resistant to change", "Allow gradual transformation, not sudden overhaul"),
    ("BROADCAST", "BROADCAST"): FrictionPattern("MEDIUM: DOUBLE BROADCAST", "MEDIUM", "Amplified output without input - buffer overflow", "Over-sharing, broadcasting without listening", "Balance expression with reception"),
    ("STREAM", "HALT"): FrictionPattern("HIGH: STREAM vs HALT", "HIGH", "Persistent flow meeting immovable stop - pressure", "Frustrated momentum, blocked progress", "Find the natural pause points in the flow"),
    ("TRIGGER", "TRIGGER"): FrictionPattern("MEDIUM: DOUBLE TRIGGER", "MEDIUM", "Multiple initiations - scattered energy", "Too many starts, no completion, overwhelm", "Prioritize one trigger at a time"),
    ("OVERWRITE", "OVERWRITE"): FrictionPattern("LOW: DOUBLE OVERWRITE", "LOW", "Pure creative force - no grounding", "Inspired but unanchored, ideas without form", "Find a container (STORE) for the creative force"),
}

def check_friction(gate_a, gate_b):
    upper_a, lower_a = gate_a.get_trigrams()
    upper_b, lower_b = gate_b.get_trigrams()

    key = (upper_a.logic_function.value, lower_b.logic_function.value)
    if key in FRICTION_PATTERNS:
        return FRICTION_PATTERNS[key]

    key_rev = (upper_b.logic_function.value, lower_a.logic_function.value)
    if key_rev in FRICTION_PATTERNS:
        return FRICTION_PATTERNS[key_rev]

    return None

# ================================================================================
# PART 5: THE CAUSAL INFERENCE ENGINE
# ================================================================================

@dataclass
class CausalStep:
    step_number: int
    gate: Gate
    is_origin: bool
    description: str
    causal_logic: str
    mechanism: str
    processor: str
    latency: str
    friction: Optional[FrictionPattern] = None

@dataclass
class ChannelAnalysis:
    channel_id: str
    gates: List[Gate]
    steps: List[CausalStep]
    total_friction: List[FrictionPattern]
    signal_quality: str
    coherence_score: float
    human_experience: str

class CausalInferenceEngine:
    ALL_CHANNELS = [
        (1, 8), (2, 14), (3, 60), (4, 63), (5, 15), (6, 59),
        (7, 31), (9, 52), (10, 20), (10, 34), (10, 57), (11, 56),
        (12, 22), (13, 33), (16, 48), (17, 62), (18, 58), (19, 49),
        (20, 34), (20, 57), (21, 45), (23, 43), (24, 61), (25, 51),
        (26, 44), (27, 50), (28, 38), (29, 46), (30, 41), (32, 54),
        (34, 57), (35, 36), (37, 40), (39, 55), (42, 53), (47, 64)
    ]

    def __init__(self):
        self.genome = GATE_GENOME
        self.trigrams = TRIGRAMS
        self.center_specs = CENTER_SPECS
        self.friction_patterns = FRICTION_PATTERNS
        self.channel_analyses = {}
        self._analyze_all_channels()

    def analyze_channel(self, gate_ids):
        gates = [self.genome[g] for g in gate_ids if g in self.genome]
        if len(gates) < 2:
            raise ValueError("Channel requires at least 2 gates")

        steps = []
        total_friction = []

        for i, gate in enumerate(gates):
            is_origin = (i == 0)
            spec = self.center_specs.get(gate.center, CenterSpec("Unknown", "Unknown", "Unknown", "Unknown", "Unknown", "Unknown"))

            if is_origin:
                description = gate.gate_name + " initiates pressure in " + gate.center + " (" + gate.organ + ")"
            else:
                prev_gate = gates[i-1]
                description = prev_gate.gate_name + " (" + prev_gate.center + ") triggers " + gate.gate_name + " in " + gate.center + " (" + gate.organ + ")"

            friction = None
            if not is_origin:
                friction = check_friction(gates[i-1], gate)
                if friction:
                    total_friction.append(friction)

            steps.append(CausalStep(
                step_number=i+1,
                gate=gate,
                is_origin=is_origin,
                description=description,
                causal_logic=gate.get_causal_logic(),
                mechanism=gate.get_causal_description(),
                processor=spec.processor,
                latency=spec.latency,
                friction=friction
            ))

        coherence = self._calculate_coherence(gates, total_friction)
        signal_quality = self._determine_signal_quality(coherence, len(total_friction))
        human_exp = self._generate_human_experience(gates, total_friction, signal_quality)

        return ChannelAnalysis(
            channel_id="-".join(str(g.id) for g in gates),
            gates=gates,
            steps=steps,
            total_friction=total_friction,
            signal_quality=signal_quality,
            coherence_score=coherence,
            human_experience=human_exp
        )

    def _calculate_coherence(self, gates, frictions):
        base = 1.0
        for f in frictions:
            if f.severity == "CRITICAL": base -= 0.4
            elif f.severity == "HIGH": base -= 0.25
            elif f.severity == "MEDIUM": base -= 0.15
            else: base -= 0.05

        centers = [g.center for g in gates]
        if len(set(centers)) == 1:
            base += 0.2

        return max(0.0, min(1.0, base))

    def _determine_signal_quality(self, coherence, friction_count):
        if coherence >= 0.8 and friction_count == 0:
            return "CRYSTAL CLEAR - Pure signal flow"
        elif coherence >= 0.6:
            return "STRONG - Minor friction, functional channel"
        elif coherence >= 0.4:
            return "MODERATE - Significant friction, requires awareness"
        elif coherence >= 0.2:
            return "WEAK - High friction, potential dysfunction"
        else:
            return "BROKEN - Critical friction, channel may be blocked"

    def _generate_human_experience(self, gates, frictions, quality):
        if not frictions:
            return "Smooth flow between " + gates[0].gate_name + " and " + gates[1].gate_name + ". Natural expression without internal conflict."
        primary = frictions[0]
        return primary.human_experience + " The channel operates with " + quality.lower() + ". Resolution: " + primary.resolution

    def _analyze_all_channels(self):
        for gate_a, gate_b in self.ALL_CHANNELS:
            try:
                analysis = self.analyze_channel([gate_a, gate_b])
                self.channel_analyses[analysis.channel_id] = analysis
            except Exception as e:
                print("Error analyzing channel " + str(gate_a) + "-" + str(gate_b) + ": " + str(e))

    def get_all_analyses(self):
        return list(self.channel_analyses.values())

    def get_analysis(self, channel_id):
        return self.channel_analyses.get(channel_id)

    def get_channels_by_quality(self, quality):
        return [a for a in self.get_all_analyses() if quality.lower() in a.signal_quality.lower()]

    def get_channels_with_friction(self, severity=None):
        if severity:
            return [a for a in self.get_all_analyses() if any(f.severity == severity for f in a.total_friction)]
        return [a for a in self.get_all_analyses() if a.total_friction]

    def get_stats(self):
        analyses = self.get_all_analyses()
        with_friction = [a for a in analyses if a.total_friction]
        crystal_clear = [a for a in analyses if "CRYSTAL CLEAR" in a.signal_quality]
        avg_coherence = sum(a.coherence_score for a in analyses) / len(analyses) if analyses else 0

        highest = max(analyses, key=lambda a: a.coherence_score) if analyses else None
        lowest = min(analyses, key=lambda a: a.coherence_score) if analyses else None

        return {
            "total_channels": len(analyses),
            "with_friction": len(with_friction),
            "crystal_clear": len(crystal_clear),
            "average_coherence": round(avg_coherence, 2),
            "highest_coherence": (highest.coherence_score, highest.channel_id) if highest else (0, ""),
            "lowest_coherence": (lowest.coherence_score, lowest.channel_id) if lowest else (0, ""),
        }

    def to_json(self, channel_id=None):
        if channel_id:
            analysis = self.get_analysis(channel_id)
            if not analysis:
                return "{}"
            data = {
                "channel_id": analysis.channel_id,
                "signal_quality": analysis.signal_quality,
                "coherence_score": analysis.coherence_score,
                "human_experience": analysis.human_experience,
                "gates": [{"id": g.id, "name": g.name, "gate": g.gate_name, "center": g.center, "binary": g.binary} for g in analysis.gates],
                "steps": [{"step": s.step_number, "gate": s.gate.id, "description": s.description, "causal_logic": s.causal_logic, "friction": s.friction.type if s.friction else None} for s in analysis.steps],
                "friction": [{"type": f.type, "severity": f.severity, "description": f.description} for f in analysis.total_friction]
            }
            return json.dumps(data, indent=2)

        all_data = {}
        for cid, analysis in self.channel_analyses.items():
            all_data[cid] = {
                "signal_quality": analysis.signal_quality,
                "coherence_score": analysis.coherence_score,
                "friction_count": len(analysis.total_friction),
                "gates": [g.id for g in analysis.gates]
            }
        return json.dumps(all_data, indent=2)


# ================================================================================
# EXAMPLE USAGE
# ================================================================================

if __name__ == "__main__":
    engine = CausalInferenceEngine()

    print("=" * 70)
    print("CAUSAL INFERENCE ENGINE v1.0")
    print("=" * 70)

    analysis = engine.analyze_channel([51, 25])
    print("")
    print("Channel " + analysis.channel_id + ": " + analysis.gates[0].name + " -> " + analysis.gates[1].name)
    print("Signal Quality: " + analysis.signal_quality)
    print("Coherence: " + str(round(analysis.coherence_score, 2)))
    print("Human Experience: " + analysis.human_experience)

    stats = engine.get_stats()
    print("")
    print("=" * 70)
    print("SYSTEM STATISTICS")
    print("=" * 70)
    for key, value in stats.items():
        print("  " + key + ": " + str(value))

    print("")
    print("=" * 70)
    print("JSON EXPORT (Channel 51-25)")
    print("=" * 70)
    print(engine.to_json("51-25"))
