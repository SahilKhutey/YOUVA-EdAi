"""
Unit Tests for Phase 2 Child Safety Escalator:
Trigger Detection, Severity Mapping, Dual-Channel Dispatch, and AI Resolution Prohibition.
"""

import json
from pathlib import Path
import pytest
from jsonschema import validate

from phase2.models.safety_escalator import (
    SafetyEscalator,
    SafetyCategory,
    SafetySeverity,
    EscalationStatus,
    SafetyGovernanceViolation,
)

SCHEMA_PATH = Path(__file__).resolve().parents[1] / "schemas" / "safety_escalation.schema.json"


@pytest.fixture
def safety_schema():
    with open(SCHEMA_PATH, "r", encoding="utf-8") as f:
        return json.load(f)


@pytest.fixture
def escalator():
    return SafetyEscalator()


def test_detect_self_harm_trigger(escalator):
    """Detects suicidal ideation / self-harm triggers and assigns CRITICAL severity."""
    text = "I don't want to live anymore, I want to kill myself."
    res = escalator.detect_triggers(text)
    assert res is not None
    cat, sev, conf, snippet = res
    assert cat == SafetyCategory.SELF_HARM
    assert sev == SafetySeverity.CRITICAL
    assert conf >= 0.9
    assert snippet == "kill myself"


def test_detect_cyberbullying_trigger(escalator):
    """Detects cyberbullying insults and assigns HIGH severity."""
    text = "Other students in class called me worthless and ugly."
    res = escalator.detect_triggers(text)
    assert res is not None
    cat, sev, conf, snippet = res
    assert cat == SafetyCategory.CYBERBULLYING
    assert sev == SafetySeverity.HIGH


def test_detect_distress_trigger(escalator):
    """Detects academic anxiety/distress and assigns MEDIUM severity."""
    text = "I am having a panic attack about the math exam tomorrow."
    res = escalator.detect_triggers(text)
    assert res is not None
    cat, sev, conf, snippet = res
    assert cat == SafetyCategory.EXTREME_DISTRESS
    assert sev == SafetySeverity.MEDIUM


def test_dual_channel_dispatch_on_high_and_critical(escalator, safety_schema):
    """Verifies that HIGH and CRITICAL incidents trigger dispatch across at least 2 channels."""
    incident = escalator.report_incident(
        student_id="student-10",
        category=SafetyCategory.CHILD_ABUSE,
        summary="Student reported severe physical punishment at home",
        severity=SafetySeverity.CRITICAL,
    )

    assert incident.status == EscalationStatus.ESCALATED
    assert len(incident.dispatch_log) >= 2

    channels = {d.channel.value for d in incident.dispatch_log}
    assert "SMS" in channels
    assert "EMAIL" in channels

    # Validate against schema
    validate(instance=incident.to_dict(), schema=safety_schema)


def test_ai_cannot_close_safety_incident(escalator):
    """Verifies invariant: AI cannot resolve or close a safety incident."""
    incident = escalator.report_incident(
        student_id="student-11",
        category=SafetyCategory.SELF_HARM,
        summary="Trigger phrase observed in practice chat",
    )

    with pytest.raises(SafetyGovernanceViolation, match="SafetyGovernanceViolation"):
        escalator.resolve_incident(
            incident.incident_id,
            actor_id="ai-llm-mentor",
            actor_role="AI",
            actor_name="Automated System",
            rationale="Auto-analyzed context as hypothetical question",
            signature="ai-token-signature-01",
        )


def test_unauthorized_role_cannot_close_incident(escalator):
    """Verifies students and unprivileged roles cannot close incidents."""
    incident = escalator.report_incident(
        student_id="student-12",
        category=SafetyCategory.CYBERBULLYING,
        summary="Peer harassment reported",
    )

    with pytest.raises(PermissionError, match="Forbidden"):
        escalator.resolve_incident(
            incident.incident_id,
            actor_id="student-12",
            actor_role="STUDENT",
            actor_name="Student Name",
            rationale="Closing my own incident report",
            signature="student-signature-12345",
        )


def test_human_counselor_can_resolve_incident(escalator, safety_schema):
    """Verifies an authorized human counselor can resolve an incident with documented rationale."""
    incident = escalator.report_incident(
        student_id="student-13",
        category=SafetyCategory.EXTREME_DISTRESS,
        summary="Student reported panic before diagnostic test",
    )

    resolved = escalator.resolve_incident(
        incident.incident_id,
        actor_id="counselor-01",
        actor_role="COUNSELOR",
        actor_name="Dr. Sunita Sen",
        rationale="Conducted 1-on-1 calming session; provided accommodations.",
        signature="sig-counselor-dps-verified-2026",
    )

    assert resolved.status == EscalationStatus.RESOLVED
    assert resolved.resolution is not None
    assert resolved.resolution.resolver_role == "COUNSELOR"

    # Validate against schema
    validate(instance=resolved.to_dict(), schema=safety_schema)
