"""
Unit tests for Skills Passport W3C VC 2.0 Engine
"""

import json
import pytest
from pathlib import Path
import jsonschema
from phase5.models.skills_passport import (
    SkillsPassportEngine,
    HumanAuthorizationRequiredError,
    ZeroPIIViolationError,
    AntiGamingPolicyViolationError,
    CredentialIntegrityError
)

ROOT = Path(__file__).parent.parent.parent
SAMPLE_PATH = ROOT / "phase5" / "data" / "sample_skills_credential.json"
SCHEMA_PATH = ROOT / "phase5" / "schemas" / "skills_passport.schema.json"


@pytest.fixture
def engine():
    return SkillsPassportEngine()


@pytest.fixture
def valid_metrics():
    return {
        "questionsAnswered": 25,
        "timeOnTaskMinutes": 60.0,
        "independentAccuracy": 0.88,
        "finalBktMastery": 0.92
    }


@pytest.fixture
def teacher_auth():
    return {
        "teacherId": "TCH-DPS-101",
        "teacherRole": "Senior Mathematics Faculty",
        "decision": "APPROVED",
        "authorizedAt": "2026-08-30T10:00:00Z",
        "signature": "sig_mock_deshmukh_valid"
    }


def test_student_did_generation(engine):
    did = engine.generate_student_did("STUDENT_RAW_001")
    assert did.startswith("did:youva:student:")
    assert len(did) == len("did:youva:student:") + 16


def test_create_and_verify_valid_credential(engine, valid_metrics, teacher_auth):
    did = engine.generate_student_did("STUDENT_RAW_001")
    cred = engine.create_credential(
        student_did=did,
        competency_code="MATH-G10-QUAD-01",
        achievement_name="Class 10 Quadratic Equations Mastery",
        achievement_description="Demonstrated procedural fluency in quadratic equations.",
        metrics=valid_metrics,
        teacher_authorization=teacher_auth
    )

    with open(SCHEMA_PATH, "r", encoding="utf-8") as f:
        schema = json.load(f)
    jsonschema.validate(cred, schema)

    # Verify cryptographic signature
    assert engine.verify_credential(cred) is True


def test_zero_pii_violation_raises_error(engine, valid_metrics, teacher_auth):
    did = engine.generate_student_did("STUDENT_RAW_001")
    # Submitting forbidden student name inside subject
    with pytest.raises(ZeroPIIViolationError):
        bad_subject = {
            "id": did,
            "type": "AchievementSubject",
            "name": "Arjun Mehta",  # Direct top-level name in subject
            "achievement": {
                "id": "urn:youva:achievement:1",
                "name": "Badge",
                "description": "Desc",
                "competencyCode": "C1"
            },
            "verificationTokenHash": "a" * 64,
            "evidence": []
        }
        engine.verify_zero_pii(bad_subject)


def test_human_authorization_invariant(engine, valid_metrics):
    did = engine.generate_student_did("STUDENT_RAW_001")

    # Empty authorization -> rejected
    with pytest.raises(HumanAuthorizationRequiredError):
        engine.create_credential(
            student_did=did,
            competency_code="MATH-G10-QUAD-01",
            achievement_name="Test",
            achievement_description="Test",
            metrics=valid_metrics,
            teacher_authorization={}
        )

    # Decision not APPROVED -> rejected
    with pytest.raises(HumanAuthorizationRequiredError):
        engine.create_credential(
            student_did=did,
            competency_code="MATH-G10-QUAD-01",
            achievement_name="Test",
            achievement_description="Test",
            metrics=valid_metrics,
            teacher_authorization={
                "teacherId": "T1",
                "teacherRole": "Teacher",
                "decision": "PENDING_REVIEW",
                "signature": "sig"
            }
        )

    # AI authorizer -> rejected
    with pytest.raises(HumanAuthorizationRequiredError):
        engine.create_credential(
            student_did=did,
            competency_code="MATH-G10-QUAD-01",
            achievement_name="Test",
            achievement_description="Test",
            metrics=valid_metrics,
            teacher_authorization={
                "teacherId": "AI_AGENT",
                "teacherRole": "AI Orchestration Engine",
                "decision": "APPROVED",
                "signature": "sig"
            }
        )


def test_anti_gaming_violations(engine, teacher_auth):
    did = engine.generate_student_did("STUDENT_RAW_001")

    # Less than 15 questions
    with pytest.raises(AntiGamingPolicyViolationError):
        engine.create_credential(
            student_did=did,
            competency_code="MATH-G10-QUAD-01",
            achievement_name="Test",
            achievement_description="Test",
            metrics={"questionsAnswered": 12, "timeOnTaskMinutes": 50, "independentAccuracy": 0.90, "finalBktMastery": 0.90},
            teacher_authorization=teacher_auth
        )

    # Less than 45 minutes
    with pytest.raises(AntiGamingPolicyViolationError):
        engine.create_credential(
            student_did=did,
            competency_code="MATH-G10-QUAD-01",
            achievement_name="Test",
            achievement_description="Test",
            metrics={"questionsAnswered": 20, "timeOnTaskMinutes": 30, "independentAccuracy": 0.90, "finalBktMastery": 0.90},
            teacher_authorization=teacher_auth
        )

    # Accuracy below 80%
    with pytest.raises(AntiGamingPolicyViolationError):
        engine.create_credential(
            student_did=did,
            competency_code="MATH-G10-QUAD-01",
            achievement_name="Test",
            achievement_description="Test",
            metrics={"questionsAnswered": 20, "timeOnTaskMinutes": 50, "independentAccuracy": 0.75, "finalBktMastery": 0.90},
            teacher_authorization=teacher_auth
        )


def test_tamper_detection(engine, valid_metrics, teacher_auth):
    did = engine.generate_student_did("STUDENT_RAW_001")
    cred = engine.create_credential(
        student_did=did,
        competency_code="MATH-G10-QUAD-01",
        achievement_name="Test",
        achievement_description="Test",
        metrics=valid_metrics,
        teacher_authorization=teacher_auth
    )

    # Mutate mastery metric without updating HMAC signature
    cred["credentialSubject"]["evidence"][0]["metrics"]["finalBktMastery"] = 0.999
    with pytest.raises(CredentialIntegrityError):
        engine.verify_credential(cred)


def test_qr_payload_export(engine, valid_metrics, teacher_auth):
    did = engine.generate_student_did("STUDENT_RAW_001")
    cred = engine.create_credential(
        student_did=did,
        competency_code="MATH-G10-QUAD-01",
        achievement_name="Test",
        achievement_description="Test",
        metrics=valid_metrics,
        teacher_authorization=teacher_auth
    )

    qr = engine.export_verification_qr_payload(cred)
    assert qr["code"] == "MATH-G10-QUAD-01"
    assert qr["did"] == did
    assert len(qr["hash"]) == 64
    assert qr["sig"]
