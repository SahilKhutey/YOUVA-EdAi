"""
YOUVA-EdAi: 3-Tier Adaptive Hint Scaffolding Engine
Provides sequential, non-punitive hint progression:
  Tier 1: Conceptual Cue (General pedagogical prompt)
  Tier 2: Strategic Step (Actionable decomposition step)
  Tier 3: Concrete Execution (Direct mathematical walk-through)
Integrates with Bayesian Knowledge Tracing (BKT) to apply calibrated evidence adjustments.
"""

from dataclasses import dataclass
from enum import IntEnum
from typing import Dict, List, Optional, Tuple
import json
from pathlib import Path


class HintTier(IntEnum):
    CONCEPTUAL_CUE = 1
    STRATEGIC_STEP = 2
    CONCRETE_EXECUTION = 3


TIER_TITLES = {
    HintTier.CONCEPTUAL_CUE: "Conceptual Cue",
    HintTier.STRATEGIC_STEP: "Strategic Step",
    HintTier.CONCRETE_EXECUTION: "Concrete Execution",
}

DEFAULT_PENALTIES = {
    HintTier.CONCEPTUAL_CUE: 0.05,
    HintTier.STRATEGIC_STEP: 0.15,
    HintTier.CONCRETE_EXECUTION: 0.30,
}


class HintProgressionViolation(Exception):
    """Raised when hints are requested out of sequence or tier limits are exceeded."""
    pass


class ScaffoldNotFoundError(Exception):
    """Raised when no scaffold exists for a specified question ID."""
    pass


@dataclass(frozen=True)
class Hint:
    tier: int
    title: str
    content: str
    penalty_slip_factor: float


@dataclass
class QuestionScaffold:
    question_id: str
    concept_id: str
    hints: List[Hint]

    def __post_init__(self):
        if len(self.hints) != 3:
            raise ValueError(f"QuestionScaffold requires exactly 3 hints, got {len(self.hints)}")
        for idx, expected_tier in enumerate([1, 2, 3]):
            if self.hints[idx].tier != expected_tier:
                raise ValueError(f"Hint at position {idx} must be Tier {expected_tier}, got {self.hints[idx].tier}")


class HintScaffoldingEngine:
    """
    Manages multi-tier scaffolding delivery and BKT evidence calibration.
    Enforces strict progressive disclosure (Tier 1 -> Tier 2 -> Tier 3).
    """

    def __init__(self):
        self._scaffolds: Dict[str, QuestionScaffold] = {}
        # Session state: (session_id, question_id) -> highest tier accessed
        self._session_hint_state: Dict[Tuple[str, str], int] = {}

    @classmethod
    def load_from_json(cls, filepath: str | Path) -> "HintScaffoldingEngine":
        """Load scaffolding from a JSON file containing a list of scaffolds."""
        path = Path(filepath)
        if not path.exists():
            raise FileNotFoundError(f"Hints bank not found at {path}")

        with open(path, "r", encoding="utf-8") as f:
            data = json.load(f)

        engine = cls()
        for item in data:
            hints = [
                Hint(
                    tier=h["tier"],
                    title=h["title"],
                    content=h["content"],
                    penalty_slip_factor=float(h.get("penaltySlipFactor", DEFAULT_PENALTIES[HintTier(h["tier"])]))
                )
                for h in item["hints"]
            ]
            scaffold = QuestionScaffold(
                question_id=item["questionId"],
                concept_id=item["conceptId"],
                hints=hints
            )
            engine.register_scaffold(scaffold)

        return engine

    def register_scaffold(self, scaffold: QuestionScaffold) -> None:
        """Register a validated 3-tier scaffold for a question."""
        self._scaffolds[scaffold.question_id] = scaffold

    def get_scaffold(self, question_id: str) -> QuestionScaffold:
        if question_id not in self._scaffolds:
            raise ScaffoldNotFoundError(f"No scaffold registered for question '{question_id}'.")
        return self._scaffolds[question_id]

    def request_next_hint(self, session_id: str, question_id: str) -> Hint:
        """
        Request the next available hint in sequence for this session and question.
        Returns Tier 1 on first call, Tier 2 on second call, Tier 3 on third call.
        Raises HintProgressionViolation if attempting beyond Tier 3.
        """
        scaffold = self.get_scaffold(question_id)
        current_tier = self._session_hint_state.get((session_id, question_id), 0)

        if current_tier >= 3:
            raise HintProgressionViolation(
                f"All 3 scaffolding tiers have already been exhausted for question {question_id} in session {session_id}."
            )

        next_tier = current_tier + 1
        self._session_hint_state[(session_id, question_id)] = next_tier

        # Tier is 1-indexed, array is 0-indexed
        return scaffold.hints[next_tier - 1]

    def get_highest_accessed_tier(self, session_id: str, question_id: str) -> int:
        """Return the highest tier accessed so far (0 if none)."""
        return self._session_hint_state.get((session_id, question_id), 0)

    def calculate_hint_penalty(self, highest_tier: int) -> float:
        """
        Cumulative penalty factor based on deepest hint accessed:
        Tier 0: 0.00 (No hints)
        Tier 1: 0.05 (Conceptual cue)
        Tier 2: 0.15 (Strategic step)
        Tier 3: 0.30 (Concrete execution)
        """
        if highest_tier <= 0:
            return 0.0
        elif highest_tier == 1:
            return DEFAULT_PENALTIES[HintTier.CONCEPTUAL_CUE]
        elif highest_tier == 2:
            return DEFAULT_PENALTIES[HintTier.STRATEGIC_STEP]
        else:
            return DEFAULT_PENALTIES[HintTier.CONCRETE_EXECUTION]

    def calibrate_bkt_params(
        self,
        base_p_g: float,
        base_p_s: float,
        highest_tier: int
    ) -> Tuple[float, float]:
        """
        Adjust BKT parameters for hint assistance:
        If a student accessed hints and answered correctly, the probability that they
        guessed/were assisted is higher. We inflate effective P(G) by the hint penalty factor:
          effective_p_g = base_p_g + (1 - base_p_g) * penalty
        This prevents false-positive mastery inflation from assisted answers.
        """
        penalty = self.calculate_hint_penalty(highest_tier)
        if penalty == 0.0:
            return base_p_g, base_p_s

        effective_p_g = min(0.90, base_p_g + (1.0 - base_p_g) * penalty)
        return effective_p_g, base_p_s
