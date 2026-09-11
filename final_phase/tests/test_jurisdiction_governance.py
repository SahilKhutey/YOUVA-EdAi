import pytest
from phase9.scripts.validate_jurisdiction import (
    load_json,
    REGISTRY_FILE,
    JURISDICTIONS_DIR,
    SCHEMA_FILE,
    validate_single_jurisdiction,
    JurisdictionValidationError
)


@pytest.fixture
def registry():
    return load_json(REGISTRY_FILE)


@pytest.fixture
def schema():
    return load_json(SCHEMA_FILE)


def resolve_jurisdiction(requested_id: str, registry_data: dict) -> str:
    supported = {j["id"]: j["status"] for j in registry_data["registry"]["supportedJurisdictions"]}
    if requested_id not in supported or supported[requested_id] != "active":
        # Safe fallback
        return registry_data["registry"]["defaultJurisdiction"]
    return requested_id


def test_fp_v027_unknown_jurisdiction_restricted(registry):
    """FP-V027: Requesting an unknown jurisdiction falls back safely to default jurisdiction."""
    resolved = resolve_jurisdiction("unknown-country-xyz", registry)
    assert resolved == "in-dpdp"


def test_fp_v028_unapproved_jurisdiction_blocked(registry):
    """FP-V028: Draft/unapproved jurisdiction cannot be routed for active tenant sessions."""
    # eu-gdpr is currently draft in registry
    resolved = resolve_jurisdiction("eu-gdpr", registry)
    assert resolved == "in-dpdp", "Draft jurisdiction must not be activated"


def test_fp_v029_expired_legal_approval_blocks_activation(schema):
    """FP-V029: Unapproved or expired legal review blocks jurisdiction activation."""
    in_dpdp = load_json(JURISDICTIONS_DIR / "in-dpdp.json")
    in_dpdp["legalReview"]["approved"] = False
    with pytest.raises(JurisdictionValidationError, match="requires legalReview.approved == True"):
        validate_single_jurisdiction(in_dpdp, schema, "in-dpdp.json")


def test_fp_v030_jurisdiction_specific_controls_applied():
    """FP-V030: Distinct age thresholds and purge SLAs apply per jurisdiction."""
    in_dpdp = load_json(JURISDICTIONS_DIR / "in-dpdp.json")
    us_coppa = load_json(JURISDICTIONS_DIR / "us-coppa-ferpa.json")

    assert in_dpdp["minimumAgeRules"]["childAgeThreshold"] == 18
    assert in_dpdp["consentRules"]["withdrawalPurgeSLAHours"] == 24

    assert us_coppa["minimumAgeRules"]["childAgeThreshold"] == 13
    assert us_coppa["consentRules"]["withdrawalPurgeSLAHours"] == 48
