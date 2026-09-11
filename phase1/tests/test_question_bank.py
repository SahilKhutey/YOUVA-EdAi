import json
import pytest
from pathlib import Path

CONTENT_DIR = Path(__file__).resolve().parents[1] / "content"


def load_json(path: Path) -> dict:
    with path.open("r", encoding="utf-8") as f:
        return json.load(f)


def test_question_bank_structure():
    """Question bank must contain 20 valid questions with peer review."""
    bank = load_json(CONTENT_DIR / "grade8_linear_equations_bank.json")
    assert bank["subject"] == "Mathematics"
    assert bank["grade"] == "Grade 8"
    assert bank["reviewedBy"] is not None

    questions = bank["questions"]
    assert len(questions) == 20

    seen_ids = set()
    for q in questions:
        assert q["questionId"] not in seen_ids
        seen_ids.add(q["questionId"])

        assert len(q["options"]) == 4
        assert 0 <= q["correctOptionIndex"] < 4
        assert len(q["text"].strip()) > 5
        assert len(q["explanation"].strip()) > 5
        assert q["difficulty"] in {"EASY", "MEDIUM", "HARD"}


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
