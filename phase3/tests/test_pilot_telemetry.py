"""
Unit Tests for Phase 3 Privacy-Preserving Telemetry & Friction Tracking.
"""

from datetime import datetime, timezone
import json
from pathlib import Path
import pytest
from jsonschema import validate

from phase3.models.pilot_telemetry import PilotTelemetryCollector, TelemetryEventType

BASE = Path(__file__).resolve().parents[1]
SCHEMA_PATH = BASE / "schemas" / "telemetry_event.schema.json"


@pytest.fixture
def telemetry_schema():
    with open(SCHEMA_PATH, "r", encoding="utf-8") as f:
        return json.load(f)


@pytest.fixture
def collector():
    return PilotTelemetryCollector(cohort_id="PILOT-DPS-TEST")


def test_pseudonymization_deterministic_and_zero_pii(collector):
    """Verifies that student IDs are converted to standard 17-char anon_<hash> tokens."""
    token1 = collector.pseudonymize_student("student-delhi-001")
    token2 = collector.pseudonymize_student("student-delhi-001")
    token3 = collector.pseudonymize_student("student-delhi-002")

    assert token1 == token2
    assert token1 != token3
    assert token1.startswith("anon_")
    assert len(token1) == 17
    assert "student" not in token1
    assert "delhi" not in token1


def test_record_item_answered_matches_schema(collector, telemetry_schema):
    """Verifies practice trial telemetry conforms to JSON schema."""
    event = collector.record_item_answered(
        session_id="sess-01",
        student_id="student-delhi-001",
        topic_id="linear_equations",
        question_id="q-001",
        is_correct=True,
        latency_ms=210,
        prior_mastery=0.25,
        posterior_mastery=0.45,
    )

    assert event.event_type == TelemetryEventType.PRACTICE_ITEM_ANSWERED
    validate(instance=event.to_dict(), schema=telemetry_schema)


def test_record_hint_requested_matches_schema(collector, telemetry_schema):
    """Verifies hint request event matches schema."""
    event = collector.record_hint_requested(
        session_id="sess-01",
        student_id="student-delhi-001",
        topic_id="linear_equations",
        question_id="q-001",
        hint_index=1,
    )

    assert event.event_type == TelemetryEventType.HINT_REQUESTED
    validate(instance=event.to_dict(), schema=telemetry_schema)


def test_routing_around_rate_calculation(collector):
    """Verifies teacher bypass rate calculation."""
    # 98 practice items
    for i in range(98):
        collector.record_item_answered(
            session_id=f"s-{i}",
            student_id=f"stu-{i % 5}",
            topic_id="linear_equations",
            question_id=f"q-{i}",
            is_correct=True,
            latency_ms=180,
            prior_mastery=0.3,
            posterior_mastery=0.4,
        )

    # 2 bypasses (2 / 100 = 2.0% < 5%)
    collector.record_teacher_bypass("s-99", "stu-1", "linear_equations", "Board demo")
    collector.record_teacher_bypass("s-100", "stu-2", "linear_equations", "External worksheet")

    rate = collector.calculate_routing_around_rate()
    assert rate == 0.02
    assert rate < 0.05
