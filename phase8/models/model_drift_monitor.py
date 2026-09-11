"""
YOUVA-EdAI — Phase 8: Model Drift Monitor & 5% Rollback Circuit Breaker (P8.4, P8.5)
Enforces:
1. Automated 5% Safety & Performance Drift Rollback.
2. Missing Telemetry Fail-Closed Invariant.
3. Automated Reversion to Preceding Validated Model Version.
"""

from dataclasses import dataclass
from datetime import datetime, timezone
import json
from pathlib import Path
from typing import Any, Dict, Optional

BASELINE_PATH = Path(__file__).resolve().parent.parent / "data" / "drift_monitoring_baseline.json"


class CircuitBreakerTrippedError(RuntimeError):
    """Raised when model drift breaches thresholds and triggers circuit breaker trip."""
    pass


class MissingTelemetryError(ValueError):
    """Raised when telemetry data is absent, corrupted, or insufficient for governance."""
    pass


@dataclass
class DriftReport:
    healthy: bool
    criticalViolation: bool
    driftMetrics: Dict[str, float]
    recommendation: str
    circuitState: str
    evaluatedAt: str

    def to_dict(self) -> Dict[str, Any]:
        return {
            "healthy": self.healthy,
            "criticalViolation": self.criticalViolation,
            "driftMetrics": self.driftMetrics,
            "recommendation": self.recommendation,
            "circuitState": self.circuitState,
            "evaluatedAt": self.evaluatedAt
        }


class ModelDriftMonitor:
    """
    Monitors live AI telemetry against certified baselines.
    Enforces the 5% drift threshold circuit breaker for automated rollback.
    """

    SAFETY_DRIFT_THRESHOLD = 0.05      # 5% maximum permissible drop in safety
    PERFORMANCE_DRIFT_THRESHOLD = 0.05 # 5% maximum drop in correctness or teacher agreement
    GENERAL_DRIFT_THRESHOLD = 0.15     # 15% maximum general drift before intervention

    def __init__(self, baseline_path: Optional[Path] = None):
        self.baseline_path = baseline_path or BASELINE_PATH
        self.circuit_state = "CLOSED"  # CLOSED (healthy), TRIPPED_ROLLBACK, MONITORING
        self.baseline = self._load_baseline()

    def _load_baseline(self) -> Dict[str, Any]:
        if self.baseline_path.exists():
            with open(self.baseline_path, "r", encoding="utf-8") as f:
                return json.load(f).get("metrics", {})
        return {
            "correctness": 0.92,
            "safety": 0.99,
            "helpfulness": 0.88,
            "teacherAgreementRate": 0.95
        }

    @staticmethod
    def calculate_relative_drift(baseline_val: float, current_val: float) -> float:
        if baseline_val == 0:
            return round(abs(current_val), 4)
        return round(abs(baseline_val - current_val) / baseline_val, 4)

    def evaluate_drift(
        self,
        current_telemetry: Optional[Dict[str, float]],
        baseline_override: Optional[Dict[str, float]] = None
    ) -> DriftReport:
        """
        Evaluates current metrics against baseline.
        Fails closed on missing telemetry.
        """
        # Invariant: Missing telemetry fails closed
        if not current_telemetry or not isinstance(current_telemetry, dict):
            self.circuit_state = "TRIPPED_ROLLBACK"
            raise MissingTelemetryError(
                "CRITICAL INVARIANT VIOLATION: AI model telemetry stream is missing or empty. "
                "Autonomous operations fail closed."
            )

        required_keys = {"safety", "correctness"}
        missing = required_keys - set(current_telemetry.keys())
        if missing:
            self.circuit_state = "TRIPPED_ROLLBACK"
            raise MissingTelemetryError(f"Missing required telemetry dimensions: {missing}")

        base = baseline_override or self.baseline
        drift: Dict[str, float] = {}

        for key, base_val in base.items():
            if key in current_telemetry:
                drift[key] = self.calculate_relative_drift(base_val, current_telemetry[key])

        # Drift violations
        safety_dropped = (
            current_telemetry.get("safety", 1.0) < base.get("safety", 1.0)
            and drift.get("safety", 0.0) > self.SAFETY_DRIFT_THRESHOLD
        )
        correctness_dropped = (
            current_telemetry.get("correctness", 1.0) < base.get("correctness", 1.0)
            and drift.get("correctness", 0.0) > self.PERFORMANCE_DRIFT_THRESHOLD
        )
        teacher_agreement_dropped = (
            "teacherAgreementRate" in current_telemetry
            and current_telemetry["teacherAgreementRate"] < base.get("teacherAgreementRate", 1.0)
            and drift.get("teacherAgreementRate", 0.0) > self.PERFORMANCE_DRIFT_THRESHOLD
        )

        max_drift = max(drift.values()) if drift else 0.0

        if safety_dropped or correctness_dropped or teacher_agreement_dropped:
            self.circuit_state = "TRIPPED_ROLLBACK"
            return DriftReport(
                healthy=False,
                criticalViolation=True,
                driftMetrics=drift,
                recommendation="TRIGGER_ROLLBACK_TO_PREVIOUS_VERSION",
                circuitState=self.circuit_state,
                evaluatedAt=datetime.now(timezone.utc).isoformat()
            )
        elif max_drift > self.GENERAL_DRIFT_THRESHOLD:
            self.circuit_state = "TRIPPED_ROLLBACK"
            return DriftReport(
                healthy=False,
                criticalViolation=False,
                driftMetrics=drift,
                recommendation="TRIGGER_ROLLBACK_TO_PREVIOUS_VERSION",
                circuitState=self.circuit_state,
                evaluatedAt=datetime.now(timezone.utc).isoformat()
            )
        elif max_drift > 0.03:
            self.circuit_state = "MONITORING"
            return DriftReport(
                healthy=True,
                criticalViolation=False,
                driftMetrics=drift,
                recommendation="FLAG_FOR_MONITORING",
                circuitState=self.circuit_state,
                evaluatedAt=datetime.now(timezone.utc).isoformat()
            )

        self.circuit_state = "CLOSED"
        return DriftReport(
            healthy=True,
            criticalViolation=False,
            driftMetrics=drift,
            recommendation="NORMAL_OPERATION",
            circuitState=self.circuit_state,
            evaluatedAt=datetime.now(timezone.utc).isoformat()
        )

    def execute_rollback(self, capability: Dict[str, Any]) -> Dict[str, Any]:
        """
        Rolls back a capability to its designated fallback version upon drift breach.
        """
        cap_id = capability.get("capabilityId")
        fallback_ver = capability.get("rollbackPolicy", {}).get("fallbackVersion", "v1.0")

        capability["previousVersion"] = capability.get("version")
        capability["version"] = fallback_ver
        capability["status"] = "ROLLED_BACK"
        capability["rolledBackAt"] = datetime.now(timezone.utc).isoformat()

        return {
            "capabilityId": cap_id,
            "status": "ROLLED_BACK",
            "activeVersion": fallback_ver,
            "reason": "Automated 5% drift circuit breaker trip",
            "timestamp": capability["rolledBackAt"]
        }
