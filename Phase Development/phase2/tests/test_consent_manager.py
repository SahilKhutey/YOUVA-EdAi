"""
Unit Tests for Phase 2 Consent Manager:
Verifiable Parental Consent (VPC), Fail-Closed Session Gating, Revocation & 24h Purge SLA.
"""

from datetime import datetime, timezone, timedelta
import json
from pathlib import Path
import pytest
from jsonschema import validate

from phase2.models.consent_manager import (
    ConsentManager,
    ConsentType,
    ConsentStatus,
    VerificationMethod,
)

SCHEMA_PATH = Path(__file__).resolve().parents[1] / "schemas" / "consent.schema.json"


@pytest.fixture
def consent_schema():
    with open(SCHEMA_PATH, "r", encoding="utf-8") as f:
        return json.load(f)


@pytest.fixture
def manager():
    mgr = ConsentManager()
    mgr.register_student("student-01", "Pooja Verma", "pooja.verma@example.edu.in", "Grade 8")
    return mgr


def test_request_and_verify_otp_success(manager, consent_schema):
    """Verifies standard happy path of OTP generation, verification, and schema compliance."""
    otp = manager.request_consent_otp("parent-01", "student-01", ConsentType.LEARNING_SERVICE)
    assert len(otp) == 6
    assert otp.isdigit()

    record = manager.verify_otp_and_grant(
        "parent-01",
        "student-01",
        ConsentType.LEARNING_SERVICE,
        otp,
        version="1.0.0",
        channel=VerificationMethod.OTP_SMS,
    )

    assert record.status == ConsentStatus.VERIFIED
    assert record.verification_method == VerificationMethod.OTP_SMS
    assert record.evidence_token is not None
    assert len(record.evidence_token) == 64  # HMAC-SHA256 hex string

    # Validate against JSON schema
    validate(instance=record.to_dict(), schema=consent_schema)


def test_verify_otp_invalid_code_fails(manager):
    """Ensures wrong OTP code raises ValueError and decrements attempts."""
    manager.request_consent_otp("parent-01", "student-01", ConsentType.LEARNING_SERVICE)

    with pytest.raises(ValueError, match="Invalid OTP code provided"):
        manager.verify_otp_and_grant("parent-01", "student-01", ConsentType.LEARNING_SERVICE, "999999")


def test_verify_otp_max_attempts_lockout(manager):
    """Verifies that exceeding max OTP attempts locks out the challenge."""
    manager.request_consent_otp("parent-01", "student-01", ConsentType.LEARNING_SERVICE)

    for _ in range(3):
        with pytest.raises(ValueError, match="Invalid OTP code provided"):
            manager.verify_otp_and_grant("parent-01", "student-01", ConsentType.LEARNING_SERVICE, "000000")

    with pytest.raises(ValueError, match="Maximum OTP verification attempts exceeded"):
        manager.verify_otp_and_grant("parent-01", "student-01", ConsentType.LEARNING_SERVICE, "000000")


def test_fail_closed_practice_permission_gate(manager):
    """Verifies learning sessions fail closed before consent is granted."""
    permitted, reason = manager.is_practice_permitted("student-01")
    assert not permitted
    assert reason == "NO_PARENTAL_CONSENT_FOUND"

    with pytest.raises(PermissionError, match="Learning session denied"):
        manager.start_learning_session("student-01", "session-1")


def test_practice_permitted_after_consent(manager):
    """Verifies learning session succeeds after active consent is granted."""
    otp = manager.request_consent_otp("parent-01", "student-01", ConsentType.LEARNING_SERVICE)
    manager.verify_otp_and_grant("parent-01", "student-01", ConsentType.LEARNING_SERVICE, otp)

    permitted, reason = manager.is_practice_permitted("student-01")
    assert permitted
    assert reason == "CONSENT_VERIFIED_ACTIVE"

    # Start session without error
    manager.start_learning_session("student-01", "session-1")
    assert "session-1" in manager.active_sessions["student-01"]


def test_consent_revocation_terminates_sessions_and_schedules_purge(manager):
    """Verifies immediate session termination and 24h purge schedule on revocation."""
    otp = manager.request_consent_otp("parent-01", "student-01", ConsentType.LEARNING_SERVICE)
    manager.verify_otp_and_grant("parent-01", "student-01", ConsentType.LEARNING_SERVICE, otp)
    manager.start_learning_session("student-01", "session-1")

    revoked = manager.revoke_consent(
        "parent-01",
        "student-01",
        ConsentType.LEARNING_SERVICE,
        purge_delay_hours=24,
    )

    assert revoked.status == ConsentStatus.REVOKED
    assert revoked.revoked_at is not None
    assert revoked.purge_scheduled_at is not None
    assert len(manager.active_sessions["student-01"]) == 0  # Sessions terminated

    # Practice is now blocked immediately
    permitted, reason = manager.is_practice_permitted("student-01")
    assert not permitted
    assert "REVOKED" in reason


def test_cryptographic_data_purge_zeroizes_pii(manager):
    """Verifies cryptographic data purge zeroizes student personal information."""
    otp = manager.request_consent_otp("parent-01", "student-01", ConsentType.LEARNING_SERVICE)
    manager.verify_otp_and_grant("parent-01", "student-01", ConsentType.LEARNING_SERVICE, otp)
    manager.revoke_consent("parent-01", "student-01", ConsentType.LEARNING_SERVICE)

    res = manager.execute_scheduled_purge("student-01", force=True)
    assert res["status"] == "PURGED_COMPLETED"
    assert res["piiZeroized"] is True

    pii = manager.student_pii["student-01"]
    assert pii["is_anonymized"] is True
    assert pii["name"] == "[PURGED_ANONYMIZED_DPDP_COMPLIANT]"
    assert "@youva-purged.internal" in pii["email"]
