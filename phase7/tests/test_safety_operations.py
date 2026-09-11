"""
YOUVA-EdAI — Phase 7 Tests: Safety Operations & Operational Audit (P7-V19 to P7-V20)
Verifies:
1. Child safeguarding incident queues, human-only resolution invariants, and SLA breach escalation.
2. Tamper-evident HMAC-SHA256 chained audit ledger integrity and tamper detection.
"""

from datetime import datetime, timezone, timedelta
import pytest

from phase7.models.safety_operations import (
    SafetyOperationsManager,
    IncidentSeverity,
    IncidentStatus,
    HumanSafeguardingRequiredError
)
from phase7.models.operational_audit import OperationalAuditLedger


@pytest.fixture
def safety_mgr():
    return SafetyOperationsManager(tenant_id="tenant-dps-rkpuram")


@pytest.fixture
def audit_ledger():
    return OperationalAuditLedger()


def test_safety_sla_breach_and_secondary_paging(safety_mgr):
    """P7-V19: Incidents unacknowledged past SLA threshold trigger secondary paging and escalation."""
    now = datetime(2026, 9, 11, 10, 0, 0, tzinfo=timezone.utc)
    ten_mins_ago = (now - timedelta(minutes=10)).isoformat()

    # Critical incident created 10 minutes ago (SLA limit is 5 mins)
    inc = safety_mgr.file_incident(
        incident_id="INC-CRIT-001",
        severity=IncidentSeverity.CRITICAL,
        category="ACUTE_DISTRESS_VOCALIZATION",
        details={"studentId": "anon_jr_0012", "confidence": 0.96},
        created_at=ten_mins_ago
    )
    assert inc.status == IncidentStatus.OPEN.value
    assert inc.secondary_paging_triggered is False

    # Check SLA breaches
    breached = safety_mgr.check_sla_breaches(now=now)
    assert len(breached) == 1
    assert breached[0].incident_id == "INC-CRIT-001"
    assert breached[0].status == IncidentStatus.ESCALATED.value
    assert breached[0].secondary_paging_triggered is True


def test_human_safeguarding_invariant(safety_mgr):
    """P7-V19.2: Automated AI agents cannot acknowledge or resolve safety incidents alone."""
    inc = safety_mgr.file_incident(
        incident_id="INC-HIGH-002",
        severity=IncidentSeverity.HIGH,
        category="UNRESOLVED_FRUSTRATION",
        details={"studentId": "anon_cbse8_0023"}
    )

    # AI agent attempt must fail closed
    with pytest.raises(HumanSafeguardingRequiredError, match="AI/Automated agents"):
        safety_mgr.acknowledge_incident(
            incident_id="INC-HIGH-002",
            human_id="ai_triage_agent_v2",
            role="SAFEGUARDING_OFFICER"
        )

    # Non-safeguarding role attempt must fail
    with pytest.raises(HumanSafeguardingRequiredError, match="not authorized"):
        safety_mgr.acknowledge_incident(
            incident_id="INC-HIGH-002",
            human_id="staff_109",
            role="STUDENT_INTERN"
        )

    # Authorized human officer acknowledges
    acked = safety_mgr.acknowledge_incident(
        incident_id="INC-HIGH-002",
        human_id="officer_priya_sharma",
        role="SAFEGUARDING_OFFICER"
    )
    assert acked.status == IncidentStatus.ACKNOWLEDGED.value
    assert acked.acknowledged_by_human_id == "officer_priya_sharma"

    # AI resolution attempt fails
    with pytest.raises(HumanSafeguardingRequiredError, match="AI/Automated agents"):
        safety_mgr.resolve_incident(
            incident_id="INC-HIGH-002",
            human_id="ai_closer",
            role="SAFEGUARDING_OFFICER",
            resolution_notes="Closed automatically by model."
        )

    # Authorized human resolution with substantive clinical notes
    resolved = safety_mgr.resolve_incident(
        incident_id="INC-HIGH-002",
        human_id="officer_priya_sharma",
        role="SAFEGUARDING_OFFICER",
        resolution_notes="Contacted class teacher; student was having difficulty with fractions. Assigned 1-on-1 counselor check-in."
    )
    assert resolved.status == IncidentStatus.RESOLVED.value
    assert resolved.resolved_by_human_id == "officer_priya_sharma"


def test_operational_audit_chain_integrity(audit_ledger):
    """P7-V20: Operational audit ledger maintains cryptographic HMAC-SHA256 chain integrity."""
    audit_ledger.append_event(
        entry_id="AUD-001",
        tenant_id="tenant-dps-rkpuram",
        event_type="TENANT_PROVISIONED",
        actor_id="admin_user_01",
        payload={"contract": "CONTRACT-DPSRKP-2026-SCALE"}
    )
    audit_ledger.append_event(
        entry_id="AUD-002",
        tenant_id="tenant-dps-rkpuram",
        event_type="LICENSE_SEATS_ALLOCATED",
        actor_id="admin_user_01",
        payload={"seats": 250}
    )
    audit_ledger.append_event(
        entry_id="AUD-003",
        tenant_id="tenant-modern-school",
        event_type="TENANT_PROVISIONED",
        actor_id="superadmin_01",
        payload={"tier": "ENTERPRISE"}
    )

    assert audit_ledger.count() == 3
    is_valid, err = audit_ledger.verify_chain_integrity()
    assert is_valid is True
    assert err is None

    # Filter by tenant
    dps_events = audit_ledger.get_tenant_events("tenant-dps-rkpuram")
    assert len(dps_events) == 2
    assert all(e["tenantId"] == "tenant-dps-rkpuram" for e in dps_events)


def test_operational_audit_tamper_detection(audit_ledger):
    """P7-V20.2: Any tampering with historical audit entries breaks the cryptographic chain."""
    audit_ledger.append_event(
        entry_id="AUD-T1",
        tenant_id="tenant-dps-rkpuram",
        event_type="SEAT_QUOTA_MODIFIED",
        actor_id="admin_01",
        payload={"originalSeats": 200, "newSeats": 250}
    )
    audit_ledger.append_event(
        entry_id="AUD-T2",
        tenant_id="tenant-dps-rkpuram",
        event_type="LMS_CONNECTOR_ACTIVATED",
        actor_id="admin_01",
        payload={"connector": "CANVAS"}
    )

    # Malicious actor tampers with payload of AUD-T1 in memory
    audit_ledger._chain[0]["payload"]["newSeats"] = 99999

    is_valid, err = audit_ledger.verify_chain_integrity()
    assert is_valid is False
    assert "Tampering detected" in err or "Broken link" in err
