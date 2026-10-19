"""
YOUVA-EdAI — Phase 8 Tests: Immutable Governance Ledger (P8-V23, P8-V24)
Verifies:
- P8-V23: Audit events present for all autonomous model decisions.
- P8-V24: HMAC-SHA256 chained cryptographic integrity and tamper resistance.
"""

import pytest
from phase8.models.governance_ledger import GovernanceLedger


@pytest.fixture
def ledger():
    return GovernanceLedger()


def test_p8_v23_audit_events_recorded(ledger):
    """P8-V23: Autonomous actions append structured events to the ledger."""
    entry = ledger.record_event(
        entry_id="GOV-001",
        event_type="CAPABILITY_ACTIVATED",
        payload={"capabilityId": "CAP-001", "version": "v1.2", "authorizedBy": "Governance Board"}
    )

    assert entry["entryId"] == "GOV-001"
    assert entry["eventType"] == "CAPABILITY_ACTIVATED"
    assert len(entry["entryHash"]) == 64
    assert ledger.count() == 1


def test_p8_v24_cryptographic_chain_integrity(ledger):
    """P8-V24: Chained hash integrity is verifiable across sequential autonomous events."""
    ledger.record_event("GOV-E1", "DRIFT_EVALUATED", {"drift": 0.01, "circuit": "CLOSED"})
    ledger.record_event("GOV-E2", "ACTION_EXECUTED", {"capabilityId": "CAP-001", "action": "GENERATE_HINT"})
    ledger.record_event("GOV-E3", "CIRCUIT_BREAKER_TRIPPED", {"reason": "5% safety drop", "rollbackTo": "v1.0"})

    assert ledger.count() == 3
    is_valid, err = ledger.verify_chain_integrity()
    assert is_valid is True
    assert err is None


def test_p8_v24_tamper_detection(ledger):
    """P8-V24.2: In-memory modification of past governance records is immediately flagged."""
    ledger.record_event("GOV-T1", "CAPABILITY_BOUNDS_SET", {"maxStep": 1.0})
    ledger.record_event("GOV-T2", "ACTION_EXECUTED", {"step": 1.0})

    # Attacker tampers with historical record
    ledger._entries[0]["payload"]["maxStep"] = 999.0

    is_valid, err = ledger.verify_chain_integrity()
    assert is_valid is False
    assert "Tamper detected" in err or "Broken link" in err
