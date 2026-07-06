"""
etymology_classifier.py — AUTOLING's real "test the word" function.

Three real categories, not a binary, verified against actual etymology
across tonight's session -- not guessed, checked one at a time:

  COGNATE:    genuine shared ancestor, part of a systematic sound-change
              pattern (the comparative method's actual evidence standard)
  ANALOGY:    different roots, but a real person deliberately connected
              them on purpose because of a real underlying relationship
  COINCIDENCE: surface resemblance only, no shared root, no systematic
              pattern, no deliberate connection

This is the concrete version of the "who/what/where/when/why" testing
loop described tonight -- AUTOLING doesn't just parse structure, it has
to test whether two forms in similar 'environments' actually belong to
the same class (Klein's own Heuristic 2), the same way this classifier
tests whether two words belong to the same etymological class.
"""

from __future__ import annotations
from dataclasses import dataclass
from enum import Enum
from typing import Dict, Optional


class Relation(Enum):
    COGNATE = "cognate"          # real shared root, systematic pattern
    ANALOGY = "analogy"          # different roots, deliberate real connection
    COINCIDENCE = "coincidence"  # surface resemblance only


@dataclass
class EtymologyVerdict:
    word_a: str
    word_b: str
    relation: Relation
    root_a: str
    root_b: str
    note: str


# Real, checked cases from tonight -- not invented, each individually
# verified against real etymological sources during the session.
VERIFIED_CASES: Dict[frozenset, EtymologyVerdict] = {
    frozenset({"no", "nein"}): EtymologyVerdict(
        "no", "nein", Relation.COGNATE,
        "PIE *ne", "PIE *ne + *oinos ('not one')",
        "Same root, same construction as English 'none' -- verified real cognate."),
    frozenset({"photon", "phonon"}): EtymologyVerdict(
        "photon", "phonon", Relation.ANALOGY,
        "Greek phos/photos (light)", "Greek phone (voice/sound)",
        "Different roots; Frenkel (1932) deliberately named phonon by analogy to photon's '-on' suffix."),
    frozenset({"arc", "axon"}): EtymologyVerdict(
        "arc", "axon", Relation.COINCIDENCE,
        "Latin arcus (bow), PIE *h2erkʷo-", "Greek axon (axis), PIE *aks-",
        "Different roots, no systematic sound-pattern connecting them."),
    frozenset({"axis", "axon"}): EtymologyVerdict(
        "axis", "axon", Relation.COGNATE,
        "Greek/Latin axis", "Greek axon",
        "Same PIE root *aks- ('axis'); axon was named in 1890s specifically because it functions like an axis."),
    frozenset({"whole", "hole"}): EtymologyVerdict(
        "whole", "hole", Relation.COINCIDENCE,
        "OE hal (healthy/complete)", "OE hol (cavity)",
        "W added to 'whole' in 1400s-1500s purely to distinguish it in print from unrelated 'hole'."),
    frozenset({"heed", "need"}): EtymologyVerdict(
        "heed", "need", Relation.COINCIDENCE,
        "OE hedan (to guard/attend)", "PIE *nēud- (need)",
        "Rhyme only, different Germanic roots."),
    frozenset({"vier", "furcht"}): EtymologyVerdict(
        "vier", "furcht", Relation.COINCIDENCE,
        "PIE *kwetwer- (four)", "PIE *pr-k- (to fear)",
        "Completely different roots and semantic fields."),
    frozenset({"art", "fart"}): EtymologyVerdict(
        "art", "fart", Relation.COINCIDENCE,
        "Latin ars/artem, PIE *h2er- (to fit together)", "PIE *perd- (imitative, to break wind)",
        "Ancient, unrelated words; no productive 'f-' prefix exists in English."),
}


class EtymologyClassifier:
    """Real lookup against verified cases; returns None (not a guess) for
    anything not yet checked -- matching the standard held all night:
    unverified stays unverified, it doesn't get quietly assumed."""

    def classify(self, word_a: str, word_b: str) -> Optional[EtymologyVerdict]:
        key = frozenset({word_a.lower(), word_b.lower()})
        return VERIFIED_CASES.get(key)

    def test_pair(self, word_a: str, word_b: str) -> str:
        """AUTOLING-style informant query: returns a real verdict or an
        honest 'needs checking' rather than a fabricated answer."""
        verdict = self.classify(word_a, word_b)
        if verdict is None:
            return (f"'{word_a}'/'{word_b}' not yet verified -- "
                    f"needs a real etymological source check before classifying.")
        return (f"{word_a}/{word_b}: {verdict.relation.value.upper()} "
                f"({word_a}<-{verdict.root_a}, {word_b}<-{verdict.root_b}) -- {verdict.note}")


if __name__ == "__main__":
    classifier = EtymologyClassifier()
    for pair in [("no", "nein"), ("photon", "phonon"), ("arc", "axon"),
                 ("art", "fart"), ("cat", "dog")]:  # last one: unverified on purpose
        print(classifier.test_pair(*pair))
