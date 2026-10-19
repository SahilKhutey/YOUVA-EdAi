import copy
import pytest
from pathlib import Path
from phase9.scripts.validate_jurisdiction import (
    load_json,
    validate_single_jurisdiction,
    validate_registry,
    JurisdictionValidationError,
    SCHEMA_FILE,
    REGISTRY_FILE,
    JURISDICTIONS_DIR
)


@pytest.fixture
def schema():
    return load_json(SCHEMA_FILE)


@pytest.fixture
def valid_in_dpdp():
    return load_json(JURISDICTIONS_DIR / "in-dpdp.json")


@pytest.fixture
def valid_us_coppa():
    return load_json(JURISDICTIONS_DIR / "us-coppa-ferpa.json")


def test_valid_in_dpdp_profile(schema, valid_in_dpdp):
    """India DPDP Act active profile must pass validation cleanly."""
    validate_single_jurisdiction(valid_in_dpdp, schema, "in-dpdp.json")


def test_valid_us_coppa_profile(schema, valid_us_coppa):
    """US COPPA/FERPA active profile must pass validation cleanly."""
    validate_single_jurisdiction(valid_us_coppa, schema, "us-coppa-ferpa.json")


def test_active_jurisdiction_missing_legal_approval(schema, valid_in_dpdp):
    """Active jurisdiction without approved legal review must fail closed."""
    tampered = copy.deepcopy(valid_in_dpdp)
    tampered["legalReview"]["approved"] = False
    with pytest.raises(JurisdictionValidationError, match="requires legalReview.approved == True"):
        validate_single_jurisdiction(tampered, schema, "test.json")


def test_active_jurisdiction_missing_child_safety_approval(schema, valid_in_dpdp):
    """Active jurisdiction without child safety signoff must fail closed."""
    tampered = copy.deepcopy(valid_in_dpdp)
    tampered["childSafetyReview"]["approved"] = False
    with pytest.raises(JurisdictionValidationError, match="requires childSafetyReview.approved == True"):
        validate_single_jurisdiction(tampered, schema, "test.json")


def test_withdrawal_purge_sla_exceeds_maximum(schema, valid_in_dpdp):
    """Withdrawal purge SLA over 72 hours must fail schema and validation."""
    tampered = copy.deepcopy(valid_in_dpdp)
    tampered["consentRules"]["withdrawalPurgeSLAHours"] = 120
    with pytest.raises(JurisdictionValidationError):
        validate_single_jurisdiction(tampered, schema, "test.json")


def test_safety_escalation_sla_exceeds_maximum(schema, valid_in_dpdp):
    """Safety escalation SLA over 24 hours must fail."""
    tampered = copy.deepcopy(valid_in_dpdp)
    tampered["safetyEscalationSLAHours"] = 48
    with pytest.raises(JurisdictionValidationError):
        validate_single_jurisdiction(tampered, schema, "test.json")


def test_draft_jurisdiction_allowed_unapproved(schema):
    """Draft jurisdiction (e.g. EU GDPR) may have null/unapproved reviews while in draft."""
    draft = load_json(JURISDICTIONS_DIR / "eu-gdpr.json")
    validate_single_jurisdiction(draft, schema, "eu-gdpr.json")


def test_registry_validation_passes():
    """Full registry validation must pass on current repository state."""
    validate_registry()
