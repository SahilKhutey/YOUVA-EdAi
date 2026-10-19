"""
Unit tests for Student Mistake Taxonomy & Diagnostic Feedback Analyzer
"""

import pytest
from pathlib import Path
from phase4.models.error_analyzer import ErrorAnalyzer

ROOT = Path(__file__).parent.parent.parent
RULES_PATH = ROOT / "phase4" / "data" / "error_classification_rules.json"


@pytest.fixture
def analyzer():
    return ErrorAnalyzer(RULES_PATH)


def test_taxonomy_completeness(analyzer):
    expected_categories = [
        "SIGN_ERROR",
        "DISTRIBUTIVE_ERROR",
        "COMBINING_LIKE_TERMS_ERROR",
        "FRACTION_CLEARANCE_ERROR",
        "ARITHMETIC_ERROR"
    ]
    for code in expected_categories:
        assert code in analyzer.rules
        rule = analyzer.rules[code]
        assert rule.name
        assert rule.misconception_explanation
        assert rule.remedial_action


def test_sign_error_detection(analyzer):
    feedback = analyzer.analyze_error(
        question_text="Solve for x: 2x - 3 = 7",
        student_answer="x = 2",
        correct_answer="x = 5"
    )
    assert feedback.error_code == "SIGN_ERROR"
    assert "Sign" in feedback.misconception_name
    assert feedback.remedial_action


def test_distributive_error_detection(analyzer):
    feedback = analyzer.analyze_error(
        question_text="Solve: 3(x + 4) = 24",
        student_answer="3x + 4 = 24",
        correct_answer="3x + 12 = 24",
        steps=["3(x+4) -> 3x+4"]
    )
    assert feedback.error_code == "DISTRIBUTIVE_ERROR"
    assert "Distribution" in feedback.misconception_name


def test_combining_like_terms_error(analyzer):
    feedback = analyzer.analyze_error(
        question_text="Simplify: 3x + 4 = 19",
        student_answer="7x = 19",
        correct_answer="3x = 15",
        steps=["3x+4=7x"]
    )
    assert feedback.error_code == "COMBINING_LIKE_TERMS_ERROR"


def test_fraction_clearance_error(analyzer):
    feedback = analyzer.analyze_error(
        question_text="Solve for x: x/3 + 2 = 5",
        student_answer="x + 2 = 15",
        correct_answer="x + 6 = 15",
        steps=["cleared fraction without multiplying 2 by 3 (lcm)"]
    )
    assert feedback.error_code == "FRACTION_CLEARANCE_ERROR"


def test_error_distribution_tracking(analyzer):
    analyzer.analyze_error("2x - 3 = 7", "x = 2", "x = 5")
    analyzer.analyze_error("y + 3 = 10", "y = 13", "y = 7")
    analyzer.analyze_error("2(x + 1) = 8", "2x + 1 = 8", "2x + 2 = 8")

    dist = analyzer.get_error_distribution()
    assert dist["SIGN_ERROR"] >= 2
    assert dist["DISTRIBUTIVE_ERROR"] >= 1
