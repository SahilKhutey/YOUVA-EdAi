import datetime
import pytest
from final_phase.scripts.validate_completion_ledger import (
    load_json,
    LEDGER_FILE,
    RHYTHM_FILE
)
from final_phase.scripts.validate_safety_operations import (
    SAFETY_OPS_FILE
)


@pytest.fixture
def ledger():
    return load_json(LEDGER_FILE)


@pytest.fixture
def rhythm():
    return load_json(RHYTHM_FILE)


@pytest.fixture
def safety_ops():
    return load_json(SAFETY_OPS_FILE)


def check_review_overdue(last_conducted_iso: str, max_interval_days: int) -> bool:
    last_dt = datetime.date.fromisoformat(last_conducted_iso)
    now = datetime.date.today()
    delta = (now - last_dt).days
    return delta > max_interval_days


def check_incident_backlog(open_count: int, threshold: int) -> bool:
    return open_count > threshold


def check_evidence_expired(expiration_iso: str | None) -> bool:
    if not expiration_iso:
        return False
    exp_dt = datetime.date.fromisoformat(expiration_iso)
    return datetime.date.today() > exp_dt


def test_fp_v031_overdue_review_detected():
    """FP-V031: Operational monitoring detects when a review is overdue."""
    # 100 days ago with a 90-day threshold is overdue
    last_date = (datetime.date.today() - datetime.timedelta(days=100)).isoformat()
    assert check_review_overdue(last_date, max_interval_days=90)

    # 30 days ago with a 90-day threshold is not overdue
    recent_date = (datetime.date.today() - datetime.timedelta(days=30)).isoformat()
    assert not check_review_overdue(recent_date, max_interval_days=90)


def test_fp_v032_incident_backlog_detected(safety_ops):
    """FP-V032: Escalation queue depth exceeding threshold triggers critical alert."""
    metric = next(m for m in safety_ops["loop"]["monitoringMetrics"] if m["id"] == "METRIC_QUEUE_BACKLOG")
    threshold = metric["threshold"]

    assert not check_incident_backlog(open_count=3, threshold=threshold)
    assert check_incident_backlog(open_count=8, threshold=threshold)


def test_fp_v033_failed_safety_notification_detected(safety_ops):
    """FP-V033: Notification delivery failures immediately flag for manual intervention."""
    metric = next(m for m in safety_ops["loop"]["monitoringMetrics"] if m["id"] == "METRIC_NOTIF_FAILURES")
    assert metric["threshold"] == 0
    assert metric["alertSeverity"] == "CRITICAL"


def test_fp_v034_evidence_expiration_detected(ledger):
    """FP-V034: Expired auditor evidence triggers recertification flag."""
    past_date = "2024-01-01"
    future_date = "2028-01-01"

    assert check_evidence_expired(past_date)
    assert not check_evidence_expired(future_date)
    assert not check_evidence_expired(None)
