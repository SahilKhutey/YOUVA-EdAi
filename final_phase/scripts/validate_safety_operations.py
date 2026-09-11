#!/usr/bin/env python3
"""
Validates the Continuous Safety Operations Configuration.
Enforces:
- Formal 9-stage continuous safety loop sequence.
- Permanent invariant: aiClosureAllowed == False (AI can never close an incident alone).
- Dual-channel notification dispatch on all critical and high triggers.
- Operational monitoring metrics covering unacknowledged incidents and notification failures.
"""

import json
import sys
from pathlib import Path

BASE = Path(__file__).resolve().parents[1]
SAFETY_OPS_FILE = BASE / "safety" / "safety_operations.json"
TRIGGERS_FILE = BASE / "safety" / "escalation_triggers.json"


class SafetyValidationError(Exception):
    pass


def load_json(path: Path) -> dict:
    if not path.exists():
        raise FileNotFoundError(f"File not found: {path}")
    with path.open("r", encoding="utf-8") as f:
        return json.load(f)


def validate_safety_loop(ops_data: dict) -> None:
    loop = ops_data.get("loop", {})
    stages = loop.get("stages", [])
    if len(stages) != 9:
        raise SafetyValidationError(f"Expected 9 continuous safety stages, found {len(stages)}")

    closure_rules = loop.get("closureRules", {})
    if closure_rules.get("aiClosureAllowed") is not False:
        raise SafetyValidationError("Permanent invariant breached: aiClosureAllowed MUST be False")
    if not closure_rules.get("requiresHumanSignature", False):
        raise SafetyValidationError("requiresHumanSignature MUST be True for incident closure")

    metrics = loop.get("monitoringMetrics", [])
    metric_ids = {m.get("id") for m in metrics}
    required_metrics = {"METRIC_UNACK_INCIDENTS", "METRIC_NOTIF_FAILURES", "METRIC_SLA_BREACHES"}
    missing_metrics = required_metrics - metric_ids
    if missing_metrics:
        raise SafetyValidationError(f"Missing mandatory safety monitoring metrics: {missing_metrics}")


def validate_triggers(triggers_data: dict) -> None:
    triggers = triggers_data.get("triggers", [])
    if not triggers:
        raise SafetyValidationError("No triggers found in escalation_triggers.json")

    for t in triggers:
        tid = t.get("triggerId")
        channels = t.get("channels", [])
        roles = t.get("recipientRoles", [])
        sla_ack = t.get("slaAckMinutes", 999)
        sla_res = t.get("slaResolveHours", 999)

        if not tid or not channels or not roles:
            raise SafetyValidationError(f"Incomplete trigger definition: {t}")

        # Invariant: Critical and High severity require dual-channel notification
        if t.get("severity") in {"CRITICAL_P0", "HIGH_P1"}:
            if len(channels) < 2:
                raise SafetyValidationError(
                    f"Trigger '{tid}' with severity '{t.get('severity')}' requires at least 2 notification channels"
                )

        if sla_ack > 60:
            raise SafetyValidationError(f"Acknowledgment SLA for '{tid}' exceeds 60 minutes ({sla_ack})")
        if sla_res > 24:
            raise SafetyValidationError(f"Resolution SLA for '{tid}' exceeds 24 hours ({sla_res})")


def close_incident(incident_id: str, actor_role: str, signature: str, is_automated_ai: bool, ops_data: dict) -> bool:
    """
    Evaluates an incident closure request.
    Fails closed if an AI attempts to close a safety incident.
    """
    closure_rules = ops_data.get("loop", {}).get("closureRules", {})
    if is_automated_ai:
        if not closure_rules.get("aiClosureAllowed", False):
            return False

    if actor_role in {"SAFEGUARDING_OFFICER", "DESIGNATED_SAFEGUARDING_LEAD"}:
        if closure_rules.get("requiresHumanSignature", True) and signature and len(signature.strip()) >= 16:
            return True

    return False


def main() -> int:
    try:
        ops = load_json(SAFETY_OPS_FILE)
        triggers = load_json(TRIGGERS_FILE)

        validate_safety_loop(ops)
        validate_triggers(triggers)

        # Simulation: test that AI closure attempt returns False
        ai_closure = close_incident(
            incident_id="INC-TEST-001",
            actor_role="AUTONOMOUS_SAFETY_BOT",
            signature="ai-sig-123",
            is_automated_ai=True,
            ops_data=ops
        )
        if ai_closure:
            raise SafetyValidationError("FAIL-CLOSED BREACH: AI was allowed to close a safety incident")

        print("PASS: Continuous safety operations and escalation protocols validated successfully.")
        return 0
    except (SafetyValidationError, FileNotFoundError, json.JSONDecodeError) as e:
        print(f"FAIL: {e}")
        return 1


if __name__ == "__main__":
    sys.exit(main())
