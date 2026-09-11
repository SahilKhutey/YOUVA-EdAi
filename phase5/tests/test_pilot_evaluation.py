"""
Unit tests for Second Closed Pilot Evaluation & Manifest
"""

import json
import pytest
from pathlib import Path
import jsonschema
from phase5.models.pilot_evaluator import HighSchoolPilotEvaluator

ROOT = Path(__file__).parent.parent.parent
MANIFEST_PATH = ROOT / "phase5" / "data" / "pilot_cohort_manifest.json"
MANIFEST_SCHEMA_PATH = ROOT / "phase5" / "schemas" / "pilot_cohort.schema.json"
REPORT_PATH = ROOT / "phase5" / "data" / "pilot_evaluation_report.json"
REPORT_SCHEMA_PATH = ROOT / "phase5" / "schemas" / "pilot_report.schema.json"


def test_cohort_manifest_conforms_to_schema():
    with open(MANIFEST_PATH, "r", encoding="utf-8") as f:
        data = json.load(f)
    with open(MANIFEST_SCHEMA_PATH, "r", encoding="utf-8") as f:
        schema = json.load(f)

    jsonschema.validate(data, schema)
    assert data["cohortSize"] == 25
    assert len(data["students"]) == 25
    assert all(s["consentStatus"] == "VERIFIED" for s in data["students"])
    assert len(data["teachers"]) >= 2


def test_pilot_report_conforms_to_schema():
    with open(REPORT_PATH, "r", encoding="utf-8") as f:
        data = json.load(f)
    with open(REPORT_SCHEMA_PATH, "r", encoding="utf-8") as f:
        schema = json.load(f)

    jsonschema.validate(data, schema)
    assert data["verdict"] == "GO_TO_PHASE_6"
    assert len(data["criteriaResults"]) == 5
    assert all(c["status"] == "PASSED" for c in data["criteriaResults"])
    assert len(data["signoffs"]) >= 3


def test_pilot_evaluator_logic():
    evaluator = HighSchoolPilotEvaluator()
    cohort_data = {
        "students": [
            {"consentStatus": "VERIFIED"},
            {"consentStatus": "VERIFIED"}
        ]
    }
    telemetry_summary = {
        "totalInteractions": 500,
        "teacherBypasses": 2,
        "averageMasteryGain": 0.55,
        "unresolvedSafetyIncidents": 0,
        "p95LatencyMs": 280.0
    }

    result = evaluator.evaluate(cohort_data, telemetry_summary)
    assert result["verdict"] == "GO_TO_PHASE_6"
    assert result["allPassed"] is True
