"""
Tests for Phase 9 InstitutionalGovernanceEngine:
- Review cadence auditing & overdue review detection.
- Fail-closed enforcement on overdue mandatory reviews.
- Continuous 100% compliance matrix auditing.
- Procurement data room role-based access control and access logging.
"""

from datetime import date
import pytest
from pathlib import Path
from phase9.models.institutional_governance import (
    InstitutionalGovernanceEngine,
    GovernanceReviewOverdueError,
    NonCompliantControlError,
    DataRoomAccessDeniedError,
)

BASE = Path(__file__).resolve().parents[1]


@pytest.fixture
def gov_engine():
    return InstitutionalGovernanceEngine(BASE / "governance")


def test_review_cadences_no_overdue_on_baseline(gov_engine):
    """Reference date before review due dates returns zero overdue reviews."""
    ref_date = date(2026, 9, 1)
    overdue = gov_engine.check_review_cadences(reference_date=ref_date)
    assert len(overdue) == 0
    # Should not raise
    gov_engine.enforce_no_overdue_reviews(reference_date=ref_date)


def test_review_cadence_detects_overdue_and_raises(gov_engine):
    """Reference date past review due date detects overdue review and raises error."""
    # child_safety_policy_review was due 2026-10-01
    ref_date = date(2026, 10, 15)
    overdue = gov_engine.check_review_cadences(reference_date=ref_date)
    assert len(overdue) > 0
    assert any(o.review_id == "child_safety_policy_review" for o in overdue)

    with pytest.raises(GovernanceReviewOverdueError, match="is overdue"):
        gov_engine.enforce_no_overdue_reviews(reference_date=ref_date)


def test_compliance_matrix_audit_passes(gov_engine):
    """Baseline compliance matrix has 100% compliant controls across all domains."""
    result = gov_engine.audit_compliance_matrix()
    assert result["status"] == "100% COMPLIANT"
    assert result["totalControls"] >= 10
    assert result["compliantControls"] == result["totalControls"]


def test_compliance_matrix_rejects_non_compliant_control(gov_engine):
    """Any control with status other than COMPLIANT raises NonCompliantControlError."""
    tampered = dict(gov_engine.compliance)
    tampered["domains"] = [dict(d) for d in tampered["domains"]]
    tampered["domains"][0]["controls"] = [dict(c) for c in tampered["domains"][0]["controls"]]
    tampered["domains"][0]["controls"][0]["status"] = "PARTIAL"
    gov_engine.compliance = tampered

    with pytest.raises(NonCompliantControlError, match="non-compliant status 'PARTIAL'"):
        gov_engine.audit_compliance_matrix()


def test_data_room_access_control(gov_engine):
    """Authorized roles can access confidential documents; unauthorized roles are blocked."""
    # Authorized access
    doc = gov_engine.access_data_room_document(
        doc_id="DOC-SOC2-TYPE2",
        actor_role="Chief Information Security Officer",
        actor_id="ciso_user_01"
    )
    assert doc["docId"] == "DOC-SOC2-TYPE2"
    assert len(gov_engine.access_logs) == 1
    assert gov_engine.access_logs[0]["accessGranted"] is True

    # Unauthorized access
    with pytest.raises(DataRoomAccessDeniedError, match="not authorized"):
        gov_engine.access_data_room_document(
            doc_id="DOC-SOC2-TYPE2",
            actor_role="ExternalStudent",
            actor_id="student_99"
        )
