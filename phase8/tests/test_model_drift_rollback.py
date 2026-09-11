"""
YOUVA-EdAI — Phase 8 Tests: Model Drift Monitoring & Automated Rollback (P8-V10 to P8-V12, P8-V25)
Verifies:
- P8-V10: 5% drift threshold trips circuit breaker.
- P8-V11: Rollback restoration to preceding validated version.
- P8-V12: Missing telemetry fails closed.
- P8-V25: Autonomous capability state rollbacks.
"""

import pytest
from phase8.models.model_drift_monitor import (
    ModelDriftMonitor,
    MissingTelemetryError
)


@pytest.fixture
def monitor():
    return ModelDriftMonitor()


def test_p8_v10_drift_threshold_trips_circuit_breaker(monitor):
    """P8-V10: Drop in safety > 5% triggers immediate rollback recommendation."""
    # Baseline: safety=0.99, correctness=0.92
    # Degraded: safety=0.93 (drop of ~6.06%, >5%)
    current_telemetry = {
        "safety": 0.93,
        "correctness": 0.92,
        "helpfulness": 0.88
    }

    report = monitor.evaluate_drift(current_telemetry)
    assert report.healthy is False
    assert report.criticalViolation is True
    assert report.recommendation == "TRIGGER_ROLLBACK_TO_PREVIOUS_VERSION"
    assert report.circuitState == "TRIPPED_ROLLBACK"


def test_p8_v11_rollback_restores_fallback_version(monitor):
    """P8-V11: Automated rollback updates capability record to fallback version."""
    capability_record = {
        "capabilityId": "CAP-001",
        "version": "v1.2",
        "status": "ACTIVE",
        "rollbackPolicy": {
            "fallbackVersion": "v1.0"
        }
    }

    res = monitor.execute_rollback(capability_record)
    assert res["status"] == "ROLLED_BACK"
    assert res["activeVersion"] == "v1.0"
    assert capability_record["version"] == "v1.0"
    assert capability_record["previousVersion"] == "v1.2"


def test_p8_v12_missing_telemetry_fails_closed(monitor):
    """P8-V12: Missing or incomplete telemetry fails closed and trips circuit breaker."""
    with pytest.raises(MissingTelemetryError, match="missing or empty"):
        monitor.evaluate_drift(None)

    with pytest.raises(MissingTelemetryError, match="Missing required telemetry"):
        # Missing 'safety' key
        monitor.evaluate_drift({"correctness": 0.90})

    assert monitor.circuit_state == "TRIPPED_ROLLBACK"


def test_p8_v25_normal_telemetry_maintains_healthy_circuit(monitor):
    """P8-V25: Telemetry within 1% drift maintains CLOSED healthy state."""
    healthy_telemetry = {
        "safety": 0.988,
        "correctness": 0.918,
        "helpfulness": 0.875,
        "teacherAgreementRate": 0.948
    }

    report = monitor.evaluate_drift(healthy_telemetry)
    assert report.healthy is True
    assert report.criticalViolation is False
    assert report.recommendation == "NORMAL_OPERATION"
    assert report.circuitState == "CLOSED"
