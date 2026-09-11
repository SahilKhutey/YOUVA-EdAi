"""
Tests for Final Phase PermanentHumanControlsEngine:
- Rejection of autonomous AI attempts on all 8 permanent human controls.
- Role-based authorization verification for authorized human personas.
- Cryptographic signature requirement.
- Hash-chained audit log creation for every human authorization.
"""

import pytest
from pathlib import Path
from final_phase.models.permanent_human_controls import (
    PermanentHumanControlsEngine,
    HumanAuthorizationMandatoryError,
    UnauthorizedActorRoleError,
)

BASE = Path(__file__).resolve().parents[1]


@pytest.fixture
def engine():
    return PermanentHumanControlsEngine(BASE / "policies")


def test_ai_execution_rejected_across_all_8_controls(engine):
    """Automated AI/System execution is rejected fail-closed for every human-only control."""
    all_controls = [
        "MASTERY_CERTIFICATION",
        "CONSENT_CHANGE",
        "CONSENT_WITHDRAWAL",
        "ROLE_CHANGE",
        "SAFETY_INCIDENT_CLOSURE",
        "CREDENTIAL_AUTHORIZATION",
        "AUTONOMY_POLICY_CHANGE",
        "JURISDICTION_ACTIVATION",
    ]

    for cid in all_controls:
        with pytest.raises(HumanAuthorizationMandatoryError, match="Permanent Invariant Violation"):
            engine.authorize_execution(
                control_id=cid,
                actor_type="AI",
                actor_id="autonomous_agent_01",
                actor_role="AI_AGENT",
                signature="mock_signature_1234567890",
            )


def test_human_authorization_with_valid_role_passes(engine):
    """Certified teacher authorization for mastery certification succeeds."""
    res = engine.authorize_execution(
        control_id="MASTERY_CERTIFICATION",
        actor_type="HUMAN",
        actor_id="teacher_ananya_01",
        actor_role="CERTIFIED_TEACHER",
        signature="c4ca4238a0b923820dcc509a6f75849b2827df61a9796013a7c66a87756f6c91",
        context_data={"studentId": "stu_01", "conceptId": "MATH-01", "score": 0.92},
    )
    assert res.is_authorized is True
    assert res.signature_verified is True
    assert len(engine.audit_log) == 1
    assert engine.audit_log[0]["status"] == "AUTHORIZED_BY_HUMAN"


def test_unauthorized_human_role_rejected(engine):
    """An unauthorized human role (e.g. Student attempting role change) is rejected."""
    with pytest.raises(UnauthorizedActorRoleError, match="Unauthorized Actor"):
        engine.authorize_execution(
            control_id="ROLE_CHANGE",
            actor_type="HUMAN",
            actor_id="student_bad_actor",
            actor_role="STUDENT",
            signature="c4ca4238a0b923820dcc509a6f75849b2827df61a9796013a7c66a87756f6c91",
        )


def test_missing_signature_rejected(engine):
    """Empty or missing human signature is rejected fail-closed."""
    with pytest.raises(HumanAuthorizationMandatoryError, match="Signature Required"):
        engine.authorize_execution(
            control_id="CONSENT_CHANGE",
            actor_type="HUMAN",
            actor_id="parent_01",
            actor_role="VERIFIED_GUARDIAN",
            signature="",
        )
