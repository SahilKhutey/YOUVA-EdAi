"""
Unit tests for 3-Tier Adaptive Hint Scaffolding Engine
"""

import pytest
from pathlib import Path
from phase4.models.hint_scaffolding import (
    HintScaffoldingEngine,
    QuestionScaffold,
    Hint,
    HintTier,
    HintProgressionViolation,
    ScaffoldNotFoundError
)

ROOT = Path(__file__).parent.parent.parent
HINTS_PATH = ROOT / "phase4" / "data" / "question_hints_bank.json"


@pytest.fixture
def hint_engine():
    return HintScaffoldingEngine.load_from_json(HINTS_PATH)


def test_load_hints_bank(hint_engine):
    scaffold = hint_engine.get_scaffold("Q-G8-ALG-001")
    assert scaffold.question_id == "Q-G8-ALG-001"
    assert scaffold.concept_id == "two_step_linear_equations"
    assert len(scaffold.hints) == 3


def test_missing_scaffold_raises_error(hint_engine):
    with pytest.raises(ScaffoldNotFoundError):
        hint_engine.get_scaffold("NON_EXISTENT_QUESTION")


def test_invalid_scaffold_validation():
    # Only 2 hints provided
    with pytest.raises(ValueError):
        QuestionScaffold(
            question_id="Q-ERR",
            concept_id="some_concept",
            hints=[
                Hint(1, "Conceptual Cue", "Hint 1 text with enough length", 0.05),
                Hint(2, "Strategic Step", "Hint 2 text with enough length", 0.15)
            ]
        )


def test_sequential_progressive_disclosure(hint_engine):
    sess = "test_session_seq"
    qid = "Q-G8-ALG-001"

    # Call 1 -> Tier 1
    h1 = hint_engine.request_next_hint(sess, qid)
    assert h1.tier == 1
    assert h1.title == "Conceptual Cue"

    # Call 2 -> Tier 2
    h2 = hint_engine.request_next_hint(sess, qid)
    assert h2.tier == 2
    assert h2.title == "Strategic Step"

    # Call 3 -> Tier 3
    h3 = hint_engine.request_next_hint(sess, qid)
    assert h3.tier == 3
    assert h3.title == "Concrete Execution"

    # Call 4 -> Violation
    with pytest.raises(HintProgressionViolation):
        hint_engine.request_next_hint(sess, qid)


def test_session_isolation(hint_engine):
    qid = "Q-G8-ALG-001"
    sess_a = "session_A"
    sess_b = "session_B"

    # Progress session A to Tier 2
    hint_engine.request_next_hint(sess_a, qid)
    hint_engine.request_next_hint(sess_a, qid)
    assert hint_engine.get_highest_accessed_tier(sess_a, qid) == 2

    # Session B must still be at Tier 0
    assert hint_engine.get_highest_accessed_tier(sess_b, qid) == 0
    h_b1 = hint_engine.request_next_hint(sess_b, qid)
    assert h_b1.tier == 1


def test_bkt_calibration():
    engine = HintScaffoldingEngine()
    base_g = 0.25
    base_s = 0.05

    # Tier 0 (No hints)
    pg0, ps0 = engine.calibrate_bkt_params(base_g, base_s, 0)
    assert pg0 == base_g
    assert ps0 == base_s

    # Tier 1 (Conceptual)
    pg1, _ = engine.calibrate_bkt_params(base_g, base_s, 1)
    assert pg1 > base_g

    # Tier 2 (Strategic)
    pg2, _ = engine.calibrate_bkt_params(base_g, base_s, 2)
    assert pg2 > pg1

    # Tier 3 (Concrete execution)
    pg3, _ = engine.calibrate_bkt_params(base_g, base_s, 3)
    assert pg3 > pg2
    assert pg3 <= 0.90  # Bounded ceiling
