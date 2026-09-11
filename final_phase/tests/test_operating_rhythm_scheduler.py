"""
Tests for Final Phase OperatingRhythmScheduler:
- Verification of non-founder ownership assignments across all critical governance functions.
- Retrieval of active cadence statuses.
- Timeliness auditing and overdue detection.
"""

from datetime import date, timedelta
import pytest
from pathlib import Path
from final_phase.models.operating_rhythm_scheduler import (
    OperatingRhythmScheduler,
    FounderDefaultViolationError,
)

BASE = Path(__file__).resolve().parents[1]


@pytest.fixture
def scheduler():
    return OperatingRhythmScheduler(BASE / "reviews")


def test_zero_founder_defaults_verified(scheduler):
    """Every governance function must have an explicit non-founder role."""
    # Should not raise
    scheduler.verify_no_founder_defaults()


def test_founder_default_flag_triggers_violation(scheduler):
    """If any function is marked with isFounderDefault == True, raises FounderDefaultViolationError."""
    tampered = dict(scheduler.ownership_data)
    tampered["ownershipAssignments"] = [dict(a) for a in tampered["ownershipAssignments"]]
    tampered["ownershipAssignments"][0]["isFounderDefault"] = True
    scheduler.ownership = {o["functionId"]: o for o in tampered["ownershipAssignments"]}

    with pytest.raises(FounderDefaultViolationError, match="founder default"):
        scheduler.verify_no_founder_defaults()


def test_all_cadences_active(scheduler):
    """Schedules contain all core recurring cadences in active status."""
    statuses = scheduler.get_cadence_statuses()
    assert len(statuses) >= 7
    active_count = sum(1 for s in statuses if s.is_active)
    assert active_count == len(statuses)


def test_overdue_cadence_detected(scheduler):
    """Auditing timeliness detects cadences that have exceeded their maximum interval."""
    ref_date = date(2026, 9, 11)
    # Bi-weekly run 30 days ago (max allowed: 14)
    last_runs = {
        "OP_BIWEEKLY": ref_date - timedelta(days=30),
        "OP_QUARTERLY": ref_date - timedelta(days=45),  # Within 90 days
    }
    overdue = scheduler.audit_cadence_timeliness(last_runs, reference_date=ref_date)
    assert len(overdue) == 1
    assert "OP_BIWEEKLY" in overdue[0]
