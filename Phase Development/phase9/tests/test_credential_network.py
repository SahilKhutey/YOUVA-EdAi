import copy
import pytest
from pathlib import Path
from phase9.scripts.validate_credentials import (
    load_json,
    validate_credential,
    CredentialValidationError,
    SCHEMA_FILE,
    ANTI_GAMING_FILE,
    SAMPLE_CREDENTIAL_FILE
)


@pytest.fixture
def schema():
    return load_json(SCHEMA_FILE)


@pytest.fixture
def policy():
    return load_json(ANTI_GAMING_FILE)


@pytest.fixture
def sample_cred():
    return load_json(SAMPLE_CREDENTIAL_FILE)


def test_valid_credential_passes(sample_cred, schema, policy):
    """Standard valid sample credential must pass all checks."""
    validate_credential(sample_cred, schema, policy)


def test_zero_pii_violation_detects_forbidden_field(sample_cred, schema, policy):
    """If student PII (e.g. email or name) is embedded in public payload, fail closed."""
    tampered = copy.deepcopy(sample_cred)
    tampered["credentialSubject"]["email"] = "student@school.edu"
    with pytest.raises(CredentialValidationError, match="Zero-PII violation"):
        validate_credential(tampered, schema, policy)


def test_invalid_token_hash_rejected(sample_cred, schema, policy):
    """Token hash must be exactly 64 hexadecimal characters (SHA-256)."""
    tampered = copy.deepcopy(sample_cred)
    tampered["credentialSubject"]["verificationTokenHash"] = "short-hash-123"
    with pytest.raises(CredentialValidationError):
        validate_credential(tampered, schema, policy)


def test_missing_teacher_authorization_rejected(sample_cred, schema, policy):
    """Missing or unapproved teacher authorization must fail closed."""
    tampered = copy.deepcopy(sample_cred)
    tampered["teacherAuthorization"]["decision"] = "REJECTED"
    with pytest.raises(CredentialValidationError, match="Human authorization rejected"):
        validate_credential(tampered, schema, policy)


def test_autonomous_ai_issuance_forbidden(sample_cred, schema, policy):
    """System policy must strictly prohibit autonomous AI credential issuance."""
    tampered_policy = copy.deepcopy(policy)
    tampered_policy["antiGamingPolicy"]["humanAuthorizationInvariant"]["aiCanIssueIndependently"] = True
    with pytest.raises(CredentialValidationError, match="aiCanIssueIndependently must be explicitly FALSE"):
        validate_credential(sample_cred, schema, tampered_policy)


def test_anti_gaming_insufficient_questions(sample_cred, schema, policy):
    """Credential candidate with fewer than 20 questions must be rejected."""
    tampered = copy.deepcopy(sample_cred)
    tampered["credentialSubject"]["evidence"][0]["metrics"]["questionsAnswered"] = 12
    with pytest.raises(CredentialValidationError, match="total questions.*< minimum"):
        validate_credential(tampered, schema, policy)


def test_anti_gaming_insufficient_time(sample_cred, schema, policy):
    """Credential candidate with insufficient time on task (< 45m) must be rejected."""
    tampered = copy.deepcopy(sample_cred)
    tampered["credentialSubject"]["evidence"][0]["metrics"]["timeOnTaskMinutes"] = 20.0
    with pytest.raises(CredentialValidationError, match="total time on task.*< minimum"):
        validate_credential(tampered, schema, policy)


def test_anti_gaming_low_accuracy(sample_cred, schema, policy):
    """Credential candidate with accuracy below 80% must be rejected."""
    tampered = copy.deepcopy(sample_cred)
    tampered["credentialSubject"]["evidence"][0]["metrics"]["independentAccuracy"] = 0.72
    with pytest.raises(CredentialValidationError, match="accuracy.*< minimum"):
        validate_credential(tampered, schema, policy)
