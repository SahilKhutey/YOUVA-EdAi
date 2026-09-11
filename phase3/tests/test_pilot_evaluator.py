"""
Unit Tests for Phase 3 Pilot Evaluator & Go/No-Go Decision Gate.
"""

import json
from pathlib import Path
import pytest
from jsonschema import validate

from phase3.models.pilot_evaluator import PilotEvaluator, GoNoGoVerdict

BASE = Path(__file__).resolve().parents[1]
REPORT_PATH = BASE / "data" / "pilot_evaluation_report.json"
SCHEMA_PATH = BASE / "schemas" / "pilot_report.schema.json"


@pytest.fixture
def report_schema():
    with open(SCHEMA_PATH, "r", encoding="utf-8") as f:
        return json.load(f)


@pytest.fixture
def evaluator():
    return PilotEvaluator()


def test_pilot_evaluation_report_schema_conformance(report_schema):
    """Verifies that the saved pilot evaluation report conforms to JSON schema."""
    with open(REPORT_PATH, "r", encoding="utf-8") as f:
        report = json.load(f)
    validate(instance=report, schema=report_schema)


def test_evaluator_all_passed_yields_go_to_phase_4(evaluator):
    """Verifies evaluator produces GO_TO_PHASE_4 when all 5 criteria pass."""
    manifest = {
        "pilotId": "TEST-PILOT",
        "students": [
            {"studentId": f"s-{i}", "guardianConsentStatus": "VERIFIED", "evidenceToken": "hmac-token-valid-01"}
            for i in range(20)
        ],
    }

    # 100 trials, 2 bypasses (2% bypass rate < 5%)
    events = []
    for i in range(20):
        # Initial trial
        events.append({
            "eventType": "PRACTICE_ITEM_ANSWERED",
            "pseudonymizedStudentId": f"anon_{i:012d}",
            "payload": {"priorMastery": 0.20, "posteriorMastery": 0.35, "latencyMs": 150},
        })
        # Final trial showing growth to 0.75 (+0.55 gain)
        for t in range(15):
            events.append({
                "eventType": "PRACTICE_ITEM_ANSWERED",
                "pseudonymizedStudentId": f"anon_{i:012d}",
                "payload": {"priorMastery": 0.35, "posteriorMastery": 0.75, "latencyMs": 180},
            })

    events.append({"eventType": "TEACHER_BYPASS_DETECTED", "payload": {}})

    summary = evaluator.evaluate(manifest, events, safety_breaches=0)
    assert summary.verdict == GoNoGoVerdict.GO_TO_PHASE_4
    assert all(c.passed for c in summary.criteria)


def test_evaluator_high_teacher_friction_yields_extend_pilot(evaluator):
    """Verifies evaluator returns EXTEND_PILOT if teacher bypass rate exceeds 5%."""
    manifest = {
        "pilotId": "TEST-PILOT",
        "students": [
            {"studentId": f"s-{i}", "guardianConsentStatus": "VERIFIED", "evidenceToken": "hmac-token-valid-01"}
            for i in range(20)
        ],
    }

    events = [
        {
            "eventType": "PRACTICE_ITEM_ANSWERED",
            "pseudonymizedStudentId": f"anon_{i:012d}",
            "payload": {"priorMastery": 0.2, "posteriorMastery": 0.7, "latencyMs": 150},
        }
        for i in range(20) for _ in range(15)
    ]
    # Inject 30 bypasses (~9% bypass rate > 5%)
    for _ in range(30):
        events.append({"eventType": "TEACHER_BYPASS_DETECTED", "payload": {}})

    summary = evaluator.evaluate(manifest, events, safety_breaches=0)
    assert summary.verdict == GoNoGoVerdict.EXTEND_PILOT
    # Criterion 2 failed
    c2 = next(c for c in summary.criteria if c.criterion_id == "CRIT-P3-02")
    assert c2.passed is False


def test_evaluator_safety_breach_yields_no_go_rollback(evaluator):
    """Verifies that any safety breach triggers a fail-closed NO_GO_ROLLBACK."""
    manifest = {
        "pilotId": "TEST-PILOT",
        "students": [
            {"studentId": f"s-{i}", "guardianConsentStatus": "VERIFIED", "evidenceToken": "hmac-token-valid-01"}
            for i in range(20)
        ],
    }
    events = [
        {
            "eventType": "PRACTICE_ITEM_ANSWERED",
            "pseudonymizedStudentId": f"anon_{i:012d}",
            "payload": {"priorMastery": 0.2, "posteriorMastery": 0.7, "latencyMs": 150},
        }
        for i in range(20) for _ in range(15)
    ]

    summary = evaluator.evaluate(manifest, events, safety_breaches=1)
    assert summary.verdict == GoNoGoVerdict.NO_GO_ROLLBACK
    c4 = next(c for c in summary.criteria if c.criterion_id == "CRIT-P3-04")
    assert c4.passed is False
