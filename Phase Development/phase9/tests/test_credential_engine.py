"""
Tests for Phase 9 CredentialEngine:
- Zero-PII public verification token generation and SHA-256 hashing.
- Anti-gaming speedrun detection (< 8s anomaly flagging; >= 2 speedruns fail).
- Minimum criteria enforcement (questions, time on task, accuracy, assistance rate).
- Human teacher authorization requirement (rejection of autonomous AI issuance).
- Revocation ledger within 1-hour SLA.
- Duplicate issuance prevention.
"""

import json
import pytest
from pathlib import Path
from phase9.models.credential_engine import (
    CredentialEngine,
    CredentialValidationError,
    SpeedrunGamingDetectedError,
    AutonomousCredentialIssuanceForbiddenError,
)

BASE = Path(__file__).resolve().parents[1]


@pytest.fixture
def engine():
    return CredentialEngine(BASE / "credentials")


@pytest.fixture
def sample_credential():
    path = BASE / "credentials" / "sample-credential.json"
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)


def test_zero_pii_token_generation(engine):
    """Token generator generates 256 bits of entropy and valid SHA-256 hash."""
    tokens = engine.generate_zero_pii_token()
    assert len(tokens["private_token"]) == 64
    assert len(tokens["verificationTokenHash"]) == 64
    import hashlib
    computed = hashlib.sha256(tokens["private_token"].encode("utf-8")).hexdigest()
    assert tokens["verificationTokenHash"] == computed


def test_speedrun_anomaly_detection_flags_gaming(engine):
    """Sessions with >= 2 answers submitted in < 8s are flagged as gaming anomalies."""
    durations = [3.5, 4.0] + [25.0] * 20
    report = engine.evaluate_session_integrity(
        question_durations_seconds=durations,
        total_questions=22,
        accuracy=0.90,
        assistance_count=1,
        total_time_minutes=48.0,
    )
    assert not report.is_valid
    assert report.speedrun_item_count == 2
    assert any("Speedrun" in r for r in report.rejection_reasons)


def test_single_speedrun_allowed_within_tolerance(engine):
    """A single accidentally quick answer (< 8s) is tolerated by policy."""
    durations = [5.0] + [25.0] * 21
    report = engine.evaluate_session_integrity(
        question_durations_seconds=durations,
        total_questions=22,
        accuracy=0.90,
        assistance_count=1,
        total_time_minutes=48.0,
    )
    assert report.is_valid
    assert report.speedrun_item_count == 1


def test_insufficient_time_on_task_rejected(engine):
    """Practice sessions with < 45 active minutes on task are rejected."""
    report = engine.evaluate_session_integrity(
        question_durations_seconds=[20.0] * 20,
        total_questions=20,
        accuracy=0.90,
        assistance_count=0,
        total_time_minutes=25.0,  # Below 45m
    )
    assert not report.is_valid
    assert any("time on task" in r for r in report.rejection_reasons)


def test_excessive_assistance_rate_rejected(engine):
    """Sessions with > 25% assistance rate are rejected."""
    report = engine.evaluate_session_integrity(
        question_durations_seconds=[20.0] * 20,
        total_questions=20,
        accuracy=0.90,
        assistance_count=8,  # 8/20 = 40% > 25%
        total_time_minutes=50.0,
    )
    assert not report.is_valid
    assert any("Assistance rate exceeded" in r for r in report.rejection_reasons)


def test_human_teacher_signature_mandatory(engine, sample_credential):
    """Credentials with missing or rejected teacher signatures fail validation."""
    tampered = dict(sample_credential)
    tampered["teacherAuthorization"] = dict(tampered["teacherAuthorization"])
    tampered["teacherAuthorization"]["signature"] = ""
    with pytest.raises(CredentialValidationError):
        engine.validate_credential(tampered)

    # Test rejected decision with valid hex signature format
    tampered2 = dict(sample_credential)
    tampered2["teacherAuthorization"] = dict(tampered2["teacherAuthorization"])
    tampered2["teacherAuthorization"]["decision"] = "REJECTED"
    with pytest.raises(CredentialValidationError, match="Human authorization rejected"):
        engine.validate_credential(tampered2)


def test_autonomous_ai_issuance_blocked(engine, sample_credential):
    """If anti-gaming policy or caller attempts autonomous AI issuance, it is blocked."""
    tampered_policy = dict(engine.policy)
    tampered_policy["antiGamingPolicy"] = dict(tampered_policy["antiGamingPolicy"])
    tampered_policy["antiGamingPolicy"]["humanAuthorizationInvariant"] = dict(
        tampered_policy["antiGamingPolicy"]["humanAuthorizationInvariant"]
    )
    tampered_policy["antiGamingPolicy"]["humanAuthorizationInvariant"]["aiCanIssueIndependently"] = True
    engine.anti_gaming = tampered_policy["antiGamingPolicy"]

    with pytest.raises(AutonomousCredentialIssuanceForbiddenError):
        engine.validate_credential(sample_credential)


def test_duplicate_issuance_blocked(engine, sample_credential):
    """Attempting to issue the same credential twice is blocked."""
    res = engine.issue_credential(sample_credential)
    assert res["status"] == "ISSUED"
    with pytest.raises(CredentialValidationError, match="already issued"):
        engine.issue_credential(sample_credential)


def test_revocation_lifecycle(engine, sample_credential):
    """Revoking a credential marks it revoked and fails subsequent validation."""
    cid = sample_credential["id"]
    engine.revoke_credential(
        credential_id=cid,
        reason="Academic integrity re-assessment flag",
        authorized_by="Principal Dr. Ananya Sen"
    )
    assert engine.is_revoked(cid)
    with pytest.raises(CredentialValidationError, match="revoked"):
        engine.validate_credential(sample_credential)
