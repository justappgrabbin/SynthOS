"""
Resonance Mission Advisor (RMA) -- the "Kim Possible" layer.

Ported from the gamification design doc's RMA framework:
  - Go/No-Go Resonance Check: don't hand out a mission if overall coherence
    is too low; recommend a recalibration mission instead.
  - Optimal Vector Action Prescriber: instead of naming a person's HD type,
    prescribe the *action* that works for their currently strongest field.
  - Friction Signature Diagnostic: name the *pattern* of resistance tied to
    their currently weakest field, framed as calibration, not failure.

Everything here is deterministic given (user_id, date, field_state) so the
same user gets the same mission all day, and a new one tomorrow -- no LLM
call, no randomness that can't be explained.
"""

from __future__ import annotations
from dataclasses import dataclass
from datetime import date
from typing import Dict, List
import hashlib

GO_NO_GO_THRESHOLD = 0.45

# Field -> Optimal Vector prescriptions (action-focused, not identity-focused).
# Multiple variants per field so the daily pick can rotate.
OPTIMAL_VECTORS: Dict[str, List[str]] = {
    "Mind": [
        "Write down the question before you look for the answer. Your Mind field is running hot enough to sharpen it alone.",
        "Teach what you know to one person today. Explaining it will finish the thought your Mind field already started.",
    ],
    "Heart": [
        "Say the thing you'd normally soften. Your Heart field has the charge to carry it honestly today.",
        "Make the ask you've been circling. This is a strong day for direct requests.",
    ],
    "Body": [
        "Start the physical task before you feel ready. Your Body field will catch up once you're moving.",
        "Do the thing with your hands today, not your head. Build, cook, move -- let the Body field lead.",
    ],
    "Will": [
        "Commit out loud to one thing you'll finish today. Your Will field holds follow-through well right now.",
        "Say no to one request that isn't yours to carry. Today's Will field supports a clean boundary.",
    ],
    "Shadow": [
        "Notice what you're avoiding without acting on it yet. Your Shadow field is showing you something real -- just observe it today.",
        "Write down the worst-case story you're telling yourself. Getting it out of your head lowers its charge.",
    ],
    "Child": [
        "Try the thing you haven't done before, badly, on purpose. Your Child field wants novelty more than mastery today.",
        "Ask a question you're embarrassed not to already know the answer to. Curiosity is well-supported today.",
    ],
    "Soul": [
        "Spend ten minutes on the project that has no deadline. Your Soul field is asking for something unmeasured.",
        "Revisit an old idea you shelved. Today's Soul field has range to reconsider it.",
    ],
    "Spirit": [
        "Do less today, on purpose. Your Spirit field moves slowly -- rushing it costs more than it saves.",
        "Sit with a question instead of resolving it. Not every open loop needs closing today.",
    ],
    "Synthesis": [
        "Connect two things you've been treating as separate. Your Synthesis field is primed to see the link.",
        "Explain your week to someone outside it. Saying it out loud will show you the pattern.",
    ],
}

# Field -> Friction Signature diagnostics (pattern-level, not failure-level).
FRICTION_SIGNATURES: Dict[str, List[str]] = {
    "Mind": [
        "Signature of Mental Overreach -- you're trying to think your way through something that needs to be felt or tested first.",
        "Signature of Analysis Loop -- the same question is circling without new input. More thinking won't resolve it; more data will.",
    ],
    "Heart": [
        "Signature of Withheld Ask -- something isn't being said directly, and it's costing more energy to hold than to voice.",
        "Signature of Borrowed Urgency -- someone else's timeline is running through your Heart field today. Check whose deadline this actually is.",
    ],
    "Body": [
        "Signature of Forced Motion -- pushing a task before the body's actually ready produces friction, not progress, today.",
        "Signature of Restlessness Without Direction -- the energy is real but unaimed. Pick one small physical task before it dissipates.",
    ],
    "Will": [
        "Signature of Overcommitment -- more has been agreed to than can be carried cleanly today.",
        "Signature of Forced Willpower -- pushing through by sheer force instead of finding the smaller next step.",
    ],
    "Shadow": [
        "Signature of Suppressed Pattern -- something uncomfortable is being managed instead of examined. Naming it costs less than carrying it.",
    ],
    "Child": [
        "Signature of Premature Seriousness -- treating a low-stakes moment like a high-stakes one. Some room to play would relieve this.",
    ],
    "Soul": [
        "Signature of Identity Pressure -- trying to prove something about who you are instead of just doing the next real thing.",
    ],
    "Spirit": [
        "Signature of Rushed Stillness -- trying to force calm on a schedule instead of letting it arrive.",
    ],
    "Synthesis": [
        "Signature of Scattered Threads -- too many open loops at once, none of them getting the attention that would close them.",
    ],
}

RECALIBRATION_MISSIONS = [
    "Recalibration mission: do nothing goal-directed for 20 minutes. No podcast, no scrolling -- just let the field settle.",
    "Recalibration mission: name three things that are actually fine right now. Coherence often drops from an inflated sense of what's wrong.",
    "Recalibration mission: move your body for 10 minutes with no productivity goal attached. Let it discharge, not perform.",
]


@dataclass
class MissionBrief:
    date: str
    go: bool
    coherence: float
    strongest_field: str
    weakest_field: str
    optimal_vector: str
    friction_signature: str
    mission_text: str
    recalibration: str | None


def _daily_pick(options: List[str], seed_key: str) -> str:
    """Deterministic per-day, per-user pick -- same mission all day, new one tomorrow."""
    h = int(hashlib.sha256(seed_key.encode()).hexdigest(), 16)
    return options[h % len(options)]


def generate_mission(user_id: str, field_state: Dict[str, "FieldState"], coherence: float,
                      for_date: date | None = None) -> MissionBrief:
    d = (for_date or date.today()).isoformat()
    seed_base = f"{user_id}:{d}"

    ranked = sorted(field_state.items(), key=lambda kv: kv[1].coherence, reverse=True)
    strongest_field, _ = ranked[0]
    weakest_field, _ = ranked[-1]

    optimal_vector = _daily_pick(OPTIMAL_VECTORS.get(strongest_field, ["Trust what's already working today."]), seed_base + ":ov")
    friction_signature = _daily_pick(FRICTION_SIGNATURES.get(weakest_field, ["Signature of General Friction -- something is off but not yet named."]), seed_base + ":fs")

    go = coherence >= GO_NO_GO_THRESHOLD

    if go:
        mission_text = f"{optimal_vector}"
        recalibration = None
    else:
        mission_text = _daily_pick(RECALIBRATION_MISSIONS, seed_base + ":recal")
        recalibration = mission_text

    return MissionBrief(
        date=d, go=go, coherence=coherence,
        strongest_field=strongest_field, weakest_field=weakest_field,
        optimal_vector=optimal_vector, friction_signature=friction_signature,
        mission_text=mission_text, recalibration=recalibration,
    )
