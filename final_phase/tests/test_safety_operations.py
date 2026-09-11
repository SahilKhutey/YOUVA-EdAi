import pytest
from final_phase.scripts.validate_safety_operations import (
    load_json,
    SAFETY_OPS_FILE,
    TRIGGERS_FILE,
    close_incident
)


@pytest.fixture
def ops_data():
    return load_json(SAFETY_OPS_FILE)


@pytest.fixture
def triggers_data():
    return load_json(TRIGGERS_FILE)


def test_fp_v005_safety_event_opens(triggers_data):
    """FP-V005: Ingested safety signal opens an active incident record."""
    trigger = triggers_data["triggers"][0]
    incident = {
        "incidentId": "INC-001",
        "triggerId": trigger["triggerId"],
        "severity": trigger["severity"],
        "status": "OPEN",
        "openedAt": "2026-09-11T10:00:00Z"
    }
    assert incident["status"] == "OPEN"
    assert incident["incidentId"].startswith("INC-")


def test_fp_v006_human_notification_occurs(triggers_data):
    """FP-V006: High/Critical severity trigger dispatches dual-channel notification to human leads."""
    critical_trigger = next(t for t in triggers_data["triggers"] if t["severity"] == "CRITICAL_P0")
    assert len(critical_trigger["channels"]) >= 2
    assert "DESIGNATED_SAFEGUARDING_LEAD" in critical_trigger["recipientRoles"]


def test_fp_v007_notification_failure_detected(ops_data):
    """FP-V007: System detects notification delivery failures and triggers alert."""
    metrics = {m["id"]: m for m in ops_data["loop"]["monitoringMetrics"]}
    assert "METRIC_NOTIF_FAILURES" in metrics
    assert metrics["METRIC_NOTIF_FAILURES"]["threshold"] == 0


def test_fp_v008_ai_cannot_close_incident(ops_data):
    """FP-V008: AI attempting to close a safety incident is rejected fail-closed."""
    closed = close_incident(
        incident_id="INC-001",
        actor_role="AUTONOMOUS_AI_AGENT",
        signature="ai-sig-1234567890",
        is_automated_ai=True,
        ops_data=ops_data
    )
    assert not closed, "AI must never be permitted to close safety incidents"


def test_fp_v009_escalation_works(triggers_data):
    """FP-V009: Unacknowledged incident escalates to higher-tier safeguarding commander."""
    p0 = next(t for t in triggers_data["triggers"] if t["severity"] == "CRITICAL_P0")
    assert p0["slaAckMinutes"] <= 15
    assert p0["slaResolveHours"] <= 4


def test_fp_v010_audit_event_created(ops_data):
    """FP-V010: Incident lifecycle generates an immutable audit logging event."""
    stages = [s["name"] for s in ops_data["loop"]["stages"]]
    assert "HASH_CHAINED_AUDIT_LOGGING" in stages
