"""
Unit tests for Teacher Override Reviewer & Calibration Engine
"""

import pytest
from phase4.models.override_review import (
    TeacherOverrideReviewer,
    OverrideEvent
)


def test_record_recommendation_and_agreement_rate():
    reviewer = TeacherOverrideReviewer(override_threshold_for_calibration=5)
    for _ in range(10):
        reviewer.record_recommendation_served()

    # 0 overrides -> 100% agreement
    report = reviewer.analyze_patterns()
    assert report.teacher_agreement_rate == 1.0
    assert report.total_overrides == 0

    # 1 override -> 90% agreement
    reviewer.record_override(OverrideEvent(
        override_id="ovr_1",
        teacher_id="T1",
        student_id="S1",
        concept_id="c1",
        ai_recommendation={"diff": "HARD"},
        teacher_decision={"diff": "EASY"},
        reason_category="DIFFICULTY_TOO_HIGH",
        reason_notes="Student needs easier practice"
    ))
    report = reviewer.analyze_patterns()
    assert report.teacher_agreement_rate == 0.90
    assert report.total_overrides == 1


def test_invalid_reason_rejected():
    reviewer = TeacherOverrideReviewer()
    with pytest.raises(ValueError):
        reviewer.record_override(OverrideEvent(
            override_id="ovr_bad",
            teacher_id="T1",
            student_id="S1",
            concept_id="c1",
            ai_recommendation={},
            teacher_decision={},
            reason_category="INVALID_UNSANCTIONED_REASON",
            reason_notes="None"
        ))


def test_calibration_recommendation_triggered():
    reviewer = TeacherOverrideReviewer(override_threshold_for_calibration=3)
    for _ in range(15):
        reviewer.record_recommendation_served()

    # Add 3 overrides for concept 'linear_equations_with_fractions'
    for i in range(3):
        reviewer.record_override(OverrideEvent(
            override_id=f"ovr_frac_{i}",
            teacher_id=f"T{i}",
            student_id=f"S{i}",
            concept_id="linear_equations_with_fractions",
            ai_recommendation={"difficulty": "HARD"},
            teacher_decision={"difficulty": "MEDIUM"},
            reason_category="DIFFICULTY_TOO_HIGH",
            reason_notes="Fractions consistently too hard for current cohort."
        ))

    report = reviewer.analyze_patterns()
    assert len(report.calibration_recommendations) == 1
    rec = report.calibration_recommendations[0]
    assert rec.concept_id == "linear_equations_with_fractions"
    assert "difficulty" in rec.recommended_adjustment.lower()
    assert rec.supporting_override_count == 3
