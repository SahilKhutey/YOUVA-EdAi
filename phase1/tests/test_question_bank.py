import json
import pytest
from pathlib import Path

CONTENT_DIR = Path(__file__).resolve().parents[1] / "content"


def load_json(path: Path) -> dict:
    with path.open("r", encoding="utf-8") as f:
        return json.load(f)


def test_question_bank_structure():
    """Question bank must contain 60 valid curriculum-aligned questions with 3-tier progressive hints."""
    bank = load_json(CONTENT_DIR / "grade8_linear_equations_bank.json")
    assert bank["subject"] == "Mathematics"
    assert bank["grade"] == "Grade 8"
    assert bank["reviewedBy"] is not None

    questions = bank["questions"]
    assert len(questions) == 60, f"Expected 60 questions, got {len(questions)}"

    seen_ids = set()
    for q in questions:
        assert q["questionId"] not in seen_ids
        seen_ids.add(q["questionId"])

        assert len(q["options"]) == 4
        assert 0 <= q["correctOptionIndex"] < 4
        assert len(q["text"].strip()) > 5
        assert len(q["explanation"].strip()) > 5
        assert q["difficulty"] in {"EASY", "MEDIUM", "HARD"}
        assert q["bloomsTaxonomyLevel"] in {
            "KNOWLEDGE",
            "UNDERSTANDING",
            "APPLICATION",
            "ANALYSIS",
            "SYNTHESIS",
        }

        # 3-Tier Progressive Hint Scaffolding assertion
        assert "hints" in q
        assert len(q["hints"]["tier1_socratic"].strip()) > 10
        assert len(q["hints"]["tier2_operational"].strip()) > 10
        assert len(q["hints"]["tier3_solution"].strip()) > 10

        # BKT parameter boundaries
        assert 0.10 <= q["bktParams"]["p_g"] <= 0.35
        assert 0.02 <= q["bktParams"]["p_s"] <= 0.25


def test_diagnostic_assessment_structure():
    """Diagnostic assessment must have 5 prerequisite items and a calibration table."""
    diag = load_json(CONTENT_DIR / "diagnostic_assessment.json")
    assert diag["itemCount"] == 5
    assert len(diag["questions"]) == 5

    scoring = diag["scoring"]
    for i in range(6):
        key = f"{i}_correct_prior_pl"
        assert key in scoring
        assert 0.0 <= scoring[key] <= 1.0
