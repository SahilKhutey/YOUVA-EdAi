"""
Unit Tests for Phase 3 Pilot Cohort Manifest & Verifiable Consent Compliance.
"""

import json
from pathlib import Path
import pytest
from jsonschema import validate, ValidationError

BASE = Path(__file__).resolve().parents[1]
SCHEMA_PATH = BASE / "schemas" / "pilot_cohort.schema.json"
MANIFEST_PATH = BASE / "data" / "pilot_cohort_manifest.json"


@pytest.fixture
def cohort_schema():
    with open(SCHEMA_PATH, "r", encoding="utf-8") as f:
        return json.load(f)


@pytest.fixture
def cohort_manifest():
    with open(MANIFEST_PATH, "r", encoding="utf-8") as f:
        return json.load(f)


def test_cohort_manifest_schema_conformance(cohort_manifest, cohort_schema):
    """Verifies that the pilot cohort manifest matches the JSON schema specification."""
    validate(instance=cohort_manifest, schema=cohort_schema)


def test_cohort_locked_institution_alignment(cohort_manifest):
    """Ensures pilot partner strictly matches the institution locked in Phase 0 Scope Lock."""
    assert cohort_manifest["institution"]["name"] == "Delhi Public School"
    assert "R.K. Puram" in cohort_manifest["institution"]["campus"]
    assert cohort_manifest["gradeBand"] == "Grade 8"
    assert cohort_manifest["subject"] == "Mathematics"
    assert cohort_manifest["curriculum"] == "CBSE / NCERT"


def test_all_students_have_verified_parental_consent(cohort_manifest):
    """Enforces the Phase 2 -> Phase 3 invariant: 100% of pilot participants must hold verified VPC."""
    students = cohort_manifest["students"]
    assert len(students) >= 20

    for s in students:
        assert s["guardianConsentStatus"] == "VERIFIED"
        assert s["evidenceToken"].startswith("hmac-sha256-")
        assert len(s["evidenceToken"]) >= 16


def test_unconsented_student_fails_schema_or_gate(cohort_manifest, cohort_schema):
    """Ensures a student with unverified or pending consent is rejected by the schema."""
    corrupted = json.loads(json.dumps(cohort_manifest))
    corrupted["students"][0]["guardianConsentStatus"] = "PENDING"

    with pytest.raises(ValidationError):
        validate(instance=corrupted, schema=cohort_schema)
