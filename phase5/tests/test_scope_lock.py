"""
Unit tests for High School Mini Scope Lock & DPDP Compliance
"""

import json
import pytest
from pathlib import Path
import jsonschema

ROOT = Path(__file__).parent.parent.parent
SCOPE_PATH = ROOT / "phase5" / "scope" / "mini_scope_lock.json"
SCHEMA_PATH = ROOT / "phase5" / "schemas" / "highschool_scope.schema.json"


@pytest.fixture
def scope_data():
    with open(SCOPE_PATH, "r", encoding="utf-8") as f:
        return json.load(f)


@pytest.fixture
def scope_schema():
    with open(SCHEMA_PATH, "r", encoding="utf-8") as f:
        return json.load(f)


def test_scope_lock_conforms_to_schema(scope_data, scope_schema):
    jsonschema.validate(scope_data, scope_schema)


def test_highschool_tier_and_curriculum(scope_data):
    assert scope_data["tier"] == "HIGH_SCHOOL"
    assert scope_data["grade"] == "Grade 10"
    assert scope_data["subject"] == "Mathematics"
    assert "CBSE" in scope_data["curriculumStandard"]
    assert scope_data["competencyCode"] == "MATH-G10-QUAD-01"


def test_ux_directives_anti_gamification(scope_data):
    ux = scope_data["uxDirectives"]
    assert ux["gamificationLevel"] == "MINIMAL_ANALYTICAL"
    assert "Radar" in ux["primaryTelemetryVisualizer"]
    assert "Self-directed" in ux["learnerAgency"]


def test_scope_lock_signoffs(scope_data):
    signoffs = scope_data["signoffs"]
    assert len(signoffs) >= 3
    for s in signoffs:
        assert s["decision"] == "APPROVED"
        assert s["name"]
        assert s["role"]
