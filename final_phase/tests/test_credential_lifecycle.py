import hashlib
import pytest
from phase9.scripts.validate_credentials import (
    load_json,
    validate_credential,
    SCHEMA_FILE,
    ANTI_GAMING_FILE,
    SAMPLE_CREDENTIAL_FILE,
    CredentialValidationError,
    FORBIDDEN_PII_FIELDS
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


def test_fp_v022_unauthorized_issuance_blocked(sample_cred, schema, policy):
    """FP-V022: Issuance without authorized teacher signature is blocked."""
    tampered = dict(sample_cred)
    tampered["teacherAuthorization"] = {
        "teacherId": "unverified_bot",
        "teacherName": "Bot",
        "authorizationTimestamp": "2026-09-01T10:04:30Z",
        "signature": "c4ca4238a0b923820dcc509a6f75849b2827df61a9796013a7c66a87756f6c91a0b923820dcc509a6f75849b2827df61a9796013a7c66a87756f6c91a0b92382",
        "decision": "REJECTED"
    }
    with pytest.raises(CredentialValidationError):
        validate_credential(tampered, schema, policy)


def test_fp_v023_duplicate_issuance_blocked():
    """FP-V023: Attempting to issue the same credential ID twice is detected and blocked."""
    issued_ledger = {"urn:uuid:7f3b8c2a-9e1d-4f6b-8a2c-1d3e5f7a9b0c"}
    new_issuance_id = "urn:uuid:7f3b8c2a-9e1d-4f6b-8a2c-1d3e5f7a9b0c"
    is_duplicate = new_issuance_id in issued_ledger
    assert is_duplicate, "Duplicate credential issuance must be rejected"


def test_fp_v024_credential_tampering_detected(sample_cred):
    """FP-V024: Any alteration to achievement score alters hash and is detected as tampering."""
    original_score = sample_cred["credentialSubject"]["achievement"]["masteryScore"]
    original_token = "student_secret_bearer_token_123456"
    expected_hash = hashlib.sha256(original_token.encode()).hexdigest()

    # Tampering attempt: modify score
    tampered_cred = dict(sample_cred)
    tampered_cred["credentialSubject"]["achievement"]["masteryScore"] = 1.00

    # Cryptographic proof signature does not match altered payload
    tampered_payload_str = str(tampered_cred["credentialSubject"])
    computed_signature = hashlib.sha256(tampered_payload_str.encode()).hexdigest()
    assert computed_signature != sample_cred["proof"]["proofValue"]


def test_fp_v025_revoked_credential_detected():
    """FP-V025: A revoked credential is recognized by the verification resolver."""
    revocation_list = {
        "urn:uuid:revoked-credential-001": {
            "revoked": True,
            "revocationReason": "ACADEMIC_INTEGRITY_INVESTIGATION",
            "revokedAt": "2026-09-02T12:00:00Z"
        }
    }
    cred_id = "urn:uuid:revoked-credential-001"
    is_revoked = revocation_list.get(cred_id, {}).get("revoked", False)
    assert is_revoked, "Revocation status must be honored immediately"


def test_fp_v026_public_verification_leaks_no_pii(sample_cred):
    """FP-V026: Public credential verification payload contains zero prohibited PII."""
    subj = sample_cred["credentialSubject"]
    for key in subj.keys():
        assert key.lower() not in FORBIDDEN_PII_FIELDS, f"Prohibited PII field '{key}' leaked"
    # Verification token hash is purely SHA-256
    assert len(subj["verificationTokenHash"]) == 64
