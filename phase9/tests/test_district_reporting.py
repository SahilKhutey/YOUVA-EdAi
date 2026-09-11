"""
Tests for Phase 9 DistrictReportingEngine:
- k-Anonymity threshold (k >= 10) cohort suppression.
- Prevention of student PII in district aggregate reports (fail-closed).
- Accurate aggregation across multiple schools and competencies.
- Differential privacy protection preventing individual re-identification.
"""

import pytest
from phase9.models.district_reporting import (
    DistrictReportingEngine,
    KAnonymityViolationError,
    PIILeakageViolationError,
)


@pytest.fixture
def reporting_engine():
    return DistrictReportingEngine(k_anonymity=10)


def test_kanonymity_suppression_under_threshold(reporting_engine):
    """Cohorts with fewer than 10 students are suppressed to prevent re-identification."""
    records = [
        {
            "school_id": "sch_dps_rkp",
            "cohort_size": 35,
            "competency_code": "MATH-G8-LINEQ",
            "mean_mastery": 0.88,
            "teacher_reviewed": True,
        },
        {
            "school_id": "sch_rural_01",
            "cohort_size": 4,  # Under threshold of 10!
            "competency_code": "MATH-G8-ADV-01",
            "mean_mastery": 0.95,
            "teacher_reviewed": True,
        },
    ]

    report = reporting_engine.aggregate_district_data(
        district_id="DIST-DELHI-SOUTH",
        district_name="Delhi South Education District",
        academic_year="2026-2027",
        school_cohort_records=records,
    )

    # Big cohort must be published
    large_cohort = report.competency_summaries["MATH-G8-LINEQ"]
    assert not large_cohort.is_suppressed
    assert large_cohort.student_count == 35
    assert large_cohort.mean_mastery == 0.88

    # Small cohort must be suppressed
    small_cohort = report.competency_summaries["MATH-G8-ADV-01"]
    assert small_cohort.is_suppressed
    assert "Suppressed: Cohort size 4 < k-anonymity threshold (10)" in small_cohort.suppression_reason
    assert small_cohort.mean_mastery == 0.0  # Zeroed out to prevent leakage


def test_zero_pii_leakage_enforced(reporting_engine):
    """Detecting student personal identifiers raises PIILeakageViolationError."""
    leaky_records = [
        {
            "school_id": "sch_dps_rkp",
            "cohort_size": 25,
            "competency_code": "MATH-G8-LINEQ",
            "mean_mastery": 0.88,
            "student_name": "Aarav Gupta",  # PII leak!
        }
    ]

    with pytest.raises(PIILeakageViolationError, match="student_name"):
        reporting_engine.aggregate_district_data(
            district_id="DIST-DELHI-SOUTH",
            district_name="Delhi South Education District",
            academic_year="2026-2027",
            school_cohort_records=leaky_records,
        )


def test_district_aggregation_metrics_computed_correctly(reporting_engine):
    """Overall district enrollment, schools count, and compliance are computed."""
    records = [
        {
            "school_id": "sch_01",
            "cohort_size": 30,
            "competency_code": "SCI-G8-PHY-01",
            "mean_mastery": 0.90,
            "teacher_reviewed": True,
        },
        {
            "school_id": "sch_02",
            "cohort_size": 20,
            "competency_code": "SCI-G8-PHY-01",
            "mean_mastery": 0.80,
            "teacher_reviewed": True,
        },
    ]

    report = reporting_engine.aggregate_district_data(
        district_id="DIST-NCR-EAST",
        district_name="NCR East District",
        academic_year="2026-2027",
        school_cohort_records=records,
    )

    assert report.total_schools == 2
    assert report.total_enrolled_students == 50
    assert report.teacher_compliance_overall == 1.0
    summary = report.competency_summaries["SCI-G8-PHY-01"]
    assert summary.student_count == 50
    assert summary.mean_mastery == 0.86  # (30*0.90 + 20*0.80)/50 = 43/50 = 0.86
