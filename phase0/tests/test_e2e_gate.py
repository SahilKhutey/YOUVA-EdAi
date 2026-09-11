import json
import subprocess
import sys
from pathlib import Path

import jsonschema
import pytest

BASE = Path(__file__).resolve().parents[1]


def test_schema_validates_complete_scope():
    schema_file = BASE / "scope-lock.schema.json"
    with schema_file.open("r", encoding="utf-8") as f:
        schema = json.load(f)

    # A valid, fully populated scope lock document must pass schema validation
    sample_valid_scope = {
        "document": {
            "name": "YOUVA EdAI MVP Scope Lock",
            "version": "1.0.0",
            "status": "locked",
            "dateLocked": "2026-09-08"
        },
        "launchTier": {
            "tier": "middle_school",
            "gradeBand": "Grade 7",
            "deferredTiers": [
                "kindergarten_junior",
                "high_school"
            ],
            "rationale": "Lowest-risk validated launch tier."
        },
        "jurisdiction": {
            "country": "India",
            "region": None,
            "regulation": "DPDP Act 2023",
            "reviewRequired": True,
            "reviewedBy": "Qualified Advisor",
            "reviewDate": "2026-09-08",
            "deferredJurisdictions": [
                "United States",
                "European Union"
            ]
        },
        "launchModel": {
            "model": "b2b_school_first",
            "pilotPartner": "Pilot School",
            "pilotRecruitmentPlan": None,
            "rationale": "Teacher oversight is central to the MVP thesis."
        },
        "mvpSubject": {
            "subject": "Mathematics",
            "grade": "Grade 7",
            "curriculumStandard": "CBSE",
            "units": [
                "Unit 1: Linear Equations"
            ],
            "contentSourcingApproach": "build",
            "contentOwner": "Curriculum Lead",
            "estimatedTimelineWeeks": 8,
            "estimatedBudget": 100000
        },
        "outOfScope": [
            "billing",
            "skills_passport"
        ],
        "nextPhase": {
            "target": "phase_1",
            "requiresPhase0Gate": True
        }
    }
    jsonschema.validate(instance=sample_valid_scope, schema=schema)


def test_schema_rejects_draft_with_empty_units():
    schema_file = BASE / "scope-lock.schema.json"
    scope_file = BASE / "scope-lock.json"

    with schema_file.open("r", encoding="utf-8") as f:
        schema = json.load(f)
    with scope_file.open("r", encoding="utf-8") as f:
        scope = json.load(f)

    # Draft scope should fail schema validation because units is empty ([])
    with pytest.raises(jsonschema.ValidationError):
        jsonschema.validate(instance=scope, schema=schema)


def test_draft_state_blocks_phase1_gate():
    gate_script = BASE / "scripts" / "validate_phase1_gate.py"
    result = subprocess.run(
        [sys.executable, str(gate_script)],
        capture_output=True,
        text=True
    )
    assert result.returncode == 1
    assert "PHASE 1 BLOCKED" in result.stdout
