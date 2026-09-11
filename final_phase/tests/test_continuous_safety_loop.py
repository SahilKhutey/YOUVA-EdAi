"""
Tests for Final Phase ContinuousSafetyLoopEngine:
- Ingestion and creation of safety incidents with appropriate SLAs.
- Dual-channel notification dispatch.
- Fail-safe secondary notification fallback if primary fails.
- Rejection of AI incident closure.
- Human acknowledgement and resolution with cryptographic audit chain.
"""

import pytest
from pathlib import Path
from final_phase.models.continuous_safety_loop import (
    ContinuousSafetyLoopEngine,
    UnauthorizedIncidentClosureError,
    SafetyNotificationDispatchError,
)

BASE = Path(__file__).resolve().parents[1]


@pytest.fixture
def safety_engine():
    return ContinuousSafetyLoopEngine(BASE / "safety")


def test_incident_lifecycle_creation_and_dispatch(safety_engine):
    """Safety incident is created with dual-channel notification dispatched."""
    incident = safety_engine.trigger_incident(
        severity="CRITICAL",
        category="SELF_HARM_DISTRESS",
        student_ref="anon_stu_101",
    )
    assert incident.status == "OPEN"
    assert incident.sla_minutes == 5
    assert incident.primary_channel_dispatched is True
    assert incident.secondary_channel_dispatched is True


def test_secondary_fallback_dispatched_on_primary_failure(safety_engine):
    """When primary notification channel fails, secondary channel is still dispatched."""
    incident = safety_engine.trigger_incident(
        severity="HIGH",
        category="PERSISTENT_DISTRESS",
        student_ref="anon_stu_102",
        simulate_primary_failure=True,
    )
    assert incident.primary_channel_dispatched is False
    assert incident.secondary_channel_dispatched is True
    assert safety_engine.notification_failures_count == 1


def test_total_notification_failure_raises(safety_engine):
    """When all notification channels fail, raises SafetyNotificationDispatchError."""
    with pytest.raises(SafetyNotificationDispatchError, match="Critical Safety Dispatch Failure"):
        safety_engine.trigger_incident(
            severity="CRITICAL",
            category="SELF_HARM_DISTRESS",
            student_ref="anon_stu_103",
            simulate_all_failure=True,
        )


def test_ai_incident_closure_rejected(safety_engine):
    """AI attempt to close or dismiss safety incident is blocked fail-closed."""
    incident = safety_engine.trigger_incident(
        severity="CRITICAL",
        category="CRISIS_SIGNAL",
        student_ref="anon_stu_104",
    )
    with pytest.raises(UnauthorizedIncidentClosureError, match="cannot be closed by AI"):
        safety_engine.resolve_incident(
            incident_id=incident.incident_id,
            actor_type="AI",
            officer_id="autonomous_bot",
            officer_role="AI_AGENT",
            resolution_notes="Dismissing incident via algorithmic rule.",
            signature="mock_signature_1234567890",
        )


def test_human_acknowledgement_and_resolution_flow(safety_engine):
    """Human safeguarding officer acknowledges and resolves incident with notes and signature."""
    incident = safety_engine.trigger_incident(
        severity="HIGH",
        category="PERSISTENT_DISTRESS",
        student_ref="anon_stu_105",
    )

    # Step 5: Ack
    acked = safety_engine.acknowledge_incident(
        incident_id=incident.incident_id,
        officer_id="safeguard_lead_01",
        officer_role="Head of Child Safeguarding"
    )
    assert acked.status == "ACKNOWLEDGED"

    # Step 7: Resolve
    resolved = safety_engine.resolve_incident(
        incident_id=incident.incident_id,
        actor_type="HUMAN",
        officer_id="safeguard_lead_01",
        officer_role="Head of Child Safeguarding",
        resolution_notes="Contacted school counsellor and verified student is in safe support environment.",
        signature="c4ca4238a0b923820dcc509a6f75849b2827df61a9796013a7c66a87756f6c91",
    )
    assert resolved.status == "RESOLVED"
    assert resolved.audit_hash is not None
    assert len(safety_engine.audit_chain) >= 2
