"""
YOUVA-EdAI — Phase 8 Tests: Autonomy Governance & Human Authorization Invariants (P8-V01 to P8-V09)
Verifies:
- P8-V01: Governing policy loaded.
- P8-V02: Unregistered capability DENIED.
- P8-V03: Disabled capability DENIED.
- P8-V04: AI mastery modification DENIED.
- P8-V05: AI consent modification DENIED.
- P8-V06: AI safety closure DENIED.
- P8-V07: AI role modification DENIED.
- P8-V08: Valid bounded action PERMITTED.
- P8-V09: Action outside bounds DENIED.
"""

import pytest
from phase8.models.autonomy_governance import (
    AutonomyGovernanceEngine,
    HumanAuthorizationRequiredError,
    CapabilityNotRegisteredError,
    CapabilityDisabledError,
    ActionOutOfBoundsError,
    AgentAction
)


@pytest.fixture
def engine():
    return AutonomyGovernanceEngine()


def test_p8_v01_governing_policy_loaded(engine):
    """P8-V01: Governance catalog loads registered capabilities successfully."""
    assert len(engine._capabilities) >= 3
    assert "CAP-001" in engine._capabilities
    assert "CAP-002" in engine._capabilities
    assert "CAP-003" in engine._capabilities


def test_p8_v02_unregistered_capability_denied(engine):
    """P8-V02: Invoking an unregistered capability fails closed."""
    with pytest.raises(CapabilityNotRegisteredError, match="not registered"):
        engine.evaluate_action(
            capability_id="CAP-999-NONEXISTENT",
            action=AgentAction.GENERATE_HINT,
            params={"stepSize": 1.0}
        )


def test_p8_v03_disabled_capability_denied(engine):
    """P8-V03: Invoking a disabled capability fails closed."""
    with pytest.raises(CapabilityDisabledError, match="DISABLED"):
        engine.evaluate_action(
            capability_id="CAP-003",
            action=AgentAction.GENERATE_HINT,
            params={}
        )


def test_p8_v04_ai_mastery_certification_denied(engine):
    """P8-V04: AI attempting to certify or modify mastery is permanently blocked."""
    with pytest.raises(HumanAuthorizationRequiredError, match="CRITICAL INVARIANT VIOLATION"):
        engine.evaluate_action(
            capability_id="CAP-001",
            action=AgentAction.MODIFY_MASTERY,
            params={"studentId": "std_01", "pMastery": 0.99},
            is_ai_actor=True
        )


def test_p8_v05_ai_consent_modification_denied(engine):
    """P8-V05: AI attempting to alter parental or student consent is blocked."""
    with pytest.raises(HumanAuthorizationRequiredError, match="CRITICAL INVARIANT VIOLATION"):
        engine.evaluate_action(
            capability_id="CAP-001",
            action=AgentAction.MODIFY_CONSENT,
            params={"consentGranted": True},
            is_ai_actor=True
        )


def test_p8_v06_ai_safety_incident_closure_denied(engine):
    """P8-V06: AI attempting to close child safety cases is permanently blocked."""
    with pytest.raises(HumanAuthorizationRequiredError, match="CRITICAL INVARIANT VIOLATION"):
        engine.evaluate_action(
            capability_id="CAP-001",
            action=AgentAction.CLOSE_SAFETY_CASE,
            params={"incidentId": "INC-01", "status": "RESOLVED"},
            is_ai_actor=True
        )


def test_p8_v07_ai_role_modification_denied(engine):
    """P8-V07: AI attempting to modify RBAC roles is blocked."""
    with pytest.raises(HumanAuthorizationRequiredError, match="CRITICAL INVARIANT VIOLATION"):
        engine.evaluate_action(
            capability_id="CAP-001",
            action=AgentAction.MODIFY_ROLE,
            params={"userId": "usr_01", "newRole": "ADMIN"},
            is_ai_actor=True
        )


def test_p8_v08_valid_bounded_action_passes(engine):
    """P8-V08: Authorized low-risk pedagogical action within bounds passes."""
    decision = engine.evaluate_action(
        capability_id="CAP-001",
        action=AgentAction.GENERATE_HINT,
        params={"stepSize": 1.0, "conceptId": "MATH-G8-LINEQ-01"}
    )
    assert decision["authorized"] is True
    assert decision["capabilityId"] == "CAP-001"
    assert len(decision["decisionHash"]) == 64


def test_p8_v09_action_outside_bounds_denied(engine):
    """P8-V09: Requesting step size exceeding authorized parameter bound fails closed."""
    with pytest.raises(ActionOutOfBoundsError, match="exceeds maximum allowed bound"):
        engine.evaluate_action(
            capability_id="CAP-001",
            action=AgentAction.GENERATE_HINT,
            params={"stepSize": 3.0}  # max is 1.0
        )
