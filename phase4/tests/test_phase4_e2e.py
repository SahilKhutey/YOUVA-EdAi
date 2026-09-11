"""
End-to-End Integration Tests for Phase 4 Personalization Depth
Combines DAG, Hint Scaffolding, BKT Update, Error Classification, and Teacher Override Review.
"""

import pytest
from pathlib import Path
from phase4.models.concept_dag import ConceptDAG
from phase4.models.hint_scaffolding import HintScaffoldingEngine
from phase4.models.error_analyzer import ErrorAnalyzer
from phase4.models.override_review import TeacherOverrideReviewer, OverrideEvent
from phase1.models.bkt_engine import BktEngine, BktParameters

ROOT = Path(__file__).parent.parent.parent
DAG_PATH = ROOT / "phase4" / "data" / "grade8_math_concept_dag.json"
HINTS_PATH = ROOT / "phase4" / "data" / "question_hints_bank.json"
RULES_PATH = ROOT / "phase4" / "data" / "error_classification_rules.json"


def test_full_personalization_journey():
    # 1. Initialize core engines
    dag = ConceptDAG.load_from_json(DAG_PATH)
    hints = HintScaffoldingEngine.load_from_json(HINTS_PATH)
    analyzer = ErrorAnalyzer(RULES_PATH)
    bkt = BktEngine()
    reviewer = TeacherOverrideReviewer(override_threshold_for_calibration=2)

    # 2. Student starts with weak prerequisites
    student_mastery = {
        "arithmetic_integers": 0.40,
        "algebraic_expressions": 0.90,
        "one_step_linear_equations": 0.50,
        "two_step_linear_equations": 0.60,
        "variables_on_both_sides": 0.45,
        "linear_equations_with_fractions": 0.20,
        "word_problems_linear_equations": 0.10
    }

    # Verify remediation path for advanced concept
    remediation_path = dag.find_remediation_path(
        student_mastery,
        "linear_equations_with_fractions",
        mastery_threshold=0.85
    )
    assert remediation_path[0] == "arithmetic_integers"

    # 3. Student attempts question Q-G8-ALG-001
    qid = "Q-G8-ALG-001"
    sess_id = "e2e_session_101"

    # Student requests Tier 1 hint
    h1 = hints.request_next_hint(sess_id, qid)
    assert h1.tier == 1

    # Student answers incorrectly with sign mistake (x = 2 instead of 5)
    diag = analyzer.analyze_error("2x - 3 = 7", "x = 2", "x = 5")
    assert diag.error_code == "SIGN_ERROR"

    # BKT updates for incorrect answer
    params = BktParameters(p_l0=0.35, p_t=0.15, p_g=0.25, p_s=0.05)
    posterior_p, next_p = bkt.update(0.35, False, params)
    assert next_p < 0.35  # Mastery drops on incorrect answer

    # Student requests Tier 2 hint
    h2 = hints.request_next_hint(sess_id, qid)
    assert h2.tier == 2

    # Student solves correctly with Tier 2 hint
    calibrated_g, calibrated_s = hints.calibrate_bkt_params(params.p_g, params.p_s, h2.tier)
    calibrated_params = BktParameters(p_l0=params.p_l0, p_t=params.p_t, p_g=calibrated_g, p_s=calibrated_s)
    
    # BKT updates for correct answer with calibrated params
    post_corr, next_corr = bkt.update(next_p, True, calibrated_params)
    assert next_corr > next_p  # Mastery increases

    # 4. Teacher reviews and overrides the next recommendation
    reviewer.record_recommendation_served()
    reviewer.record_override(OverrideEvent(
        override_id="ovr_e2e_1",
        teacher_id="TCH-DEL-001",
        student_id="STU-101",
        concept_id="arithmetic_integers",
        ai_recommendation={"difficulty": "MEDIUM"},
        teacher_decision={"difficulty": "EASY"},
        reason_category="DIFFICULTY_TOO_HIGH",
        reason_notes="Provide foundational review first."
    ))

    report = reviewer.analyze_patterns()
    assert report.total_overrides == 1
    assert report.teacher_agreement_rate == 0.0  # 1 override out of 1 recommendation
