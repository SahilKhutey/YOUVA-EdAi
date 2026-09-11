"""
Unit tests for Junior Tier Scope Lock & Technical Constraints
"""

import json
import pytest
from pathlib import Path
import jsonschema

ROOT = Path(__file__).parent.parent.parent
SCOPE_PATH = ROOT / "phase6" / "scope" / "junior_scope_lock.json"
SCHEMA_PATH = ROOT / "phase6" / "schemas" / "junior_scope.schema.json"


@pytest.fixture
def scope_data():
    with open(SCOPE_PATH, "r", encoding="utf-8") as f:
        return json.load(f)


@pytest.fixture
def scope_schema():
    with open(SCHEMA_PATH, "r", encoding="utf-8") as f:
        return json.load(f)


def test_scope_conforms_to_schema(scope_data, scope_schema):
    jsonschema.validate(scope_data, scope_schema)


def test_tier_and_age_band(scope_data):
    assert scope_data["tier"] == "KINDERGARTEN_JUNIOR"
    assert "4-6" in scope_data["ageBand"]
    assert "NUM-EARLY-01" in scope_data["competencyCodes"]
    assert "PHON-EARLY-01" in scope_data["competencyCodes"]


def test_hard_technical_limits(scope_data):
    tc = scope_data["technicalConstraints"]
    assert tc["maxSessionMinutes"] <= 15
    assert tc["maxWordsPerPrompt"] <= 8
    assert tc["maxFleschKincaidGrade"] <= 1.0
    assert tc["prohibitOpenEndedAi"] is True


def test_parent_copilot_policy(scope_data):
    policy = scope_data["parentCoPilotPolicy"]
    assert policy["coPresenceMandatory"] is True
    assert policy["unilateralPauseKillSwitch"] is True


def test_signoffs_approved(scope_data):
    signoffs = scope_data["signoffs"]
    assert len(signoffs) >= 3
    for s in signoffs:
        assert s["decision"] == "APPROVED"
        assert s["role"]
        assert s["name"]
