"""
Unit Tests for Phase 2 Tamper-Evident HMAC-SHA256 Audit Ledger:
Sequential Hashing, Cryptographic Forward Chaining, and Tamper Detection.
"""

from datetime import datetime, timezone
import json
from pathlib import Path
import pytest
from jsonschema import validate

from phase2.models.audit_ledger import AuditLedger, AuditEntry, GENESIS_HASH

SCHEMA_PATH = Path(__file__).resolve().parents[1] / "schemas" / "audit_ledger.schema.json"


@pytest.fixture
def ledger_schema():
    with open(SCHEMA_PATH, "r", encoding="utf-8") as f:
        return json.load(f)


@pytest.fixture
def ledger():
    return AuditLedger(secret_key="test-audit-key-2026")


def test_genesis_entry_points_to_genesis_hash(ledger, ledger_schema):
    """Verifies that the first ledger entry binds to the 64-character genesis hash."""
    entry = ledger.append_event(
        actor_id="admin-01",
        actor_role="ADMIN",
        action="SYSTEM_INIT",
        resource="System",
        outcome="SUCCESS",
        metadata={"environment": "pilot"},
    )

    assert entry.sequence == 0
    assert entry.previous_hash == GENESIS_HASH
    assert len(entry.entry_hash) == 64

    # Validate against schema
    validate(instance=entry.to_dict(), schema=ledger_schema)


def test_sequential_hash_chaining(ledger):
    """Verifies each consecutive entry links to the previous entry's hash."""
    e0 = ledger.append_event("user-1", "STUDENT", "LOGIN", "Session")
    e1 = ledger.append_event("user-1", "STUDENT", "PRACTICE_SUBMIT", "Question", resource_id="q-1")
    e2 = ledger.append_event("user-2", "TEACHER", "REVIEW_OVERRIDE", "LearningLoop", resource_id="t-1")

    assert e1.previous_hash == e0.entry_hash
    assert e2.previous_hash == e1.entry_hash

    is_valid, err, seq = ledger.verify_chain_integrity()
    assert is_valid is True
    assert err is None
    assert seq is None


def test_tamper_detection_metadata_modification(ledger):
    """Verifies modifying metadata on any entry breaks chain verification."""
    ledger.append_event("u-1", "STUDENT", "LOGIN", "Session")
    ledger.append_event("u-1", "STUDENT", "SUBMIT", "Question", metadata={"score": 100})
    ledger.append_event("u-2", "TEACHER", "LOGOUT", "Session")

    # Tamper with metadata
    ledger.entries[1].metadata["score"] = 50

    is_valid, err, seq = ledger.verify_chain_integrity()
    assert is_valid is False
    assert seq == 1
    assert "Tampered entry detected at sequence 1" in err


def test_tamper_detection_action_modification(ledger):
    """Verifies modifying action breaks hash check."""
    ledger.append_event("p-1", "PARENT", "CONSENT_GRANT", "ConsentRecord")
    ledger.append_event("s-1", "STUDENT", "DIAGNOSTIC_START", "Assessment")

    ledger.entries[0].action = "MALICIOUS_CONSENT_REVOKE"

    is_valid, err, seq = ledger.verify_chain_integrity()
    assert is_valid is False
    assert seq == 0


def test_tamper_detection_broken_hash_pointer(ledger):
    """Verifies modifying previousHash pointer is caught."""
    e0 = ledger.append_event("p-1", "PARENT", "CONSENT_GRANT", "ConsentRecord")
    e1 = ledger.append_event("s-1", "STUDENT", "DIAGNOSTIC_START", "Assessment")

    # Manually recompute hash with forged prev pointer
    ledger.entries[1].previous_hash = "f" * 64

    is_valid, err, seq = ledger.verify_chain_integrity()
    assert is_valid is False
    assert seq == 1
    assert "Broken hash pointer at sequence 1" in err
