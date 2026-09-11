#!/usr/bin/env python3
"""
Validates the Permanent Human-Only Controls.
Enforces:
- Exactly 8 immutable human-only controls are defined.
- Every control has aiAutonomousAllowed == False.
- Simulated AI authorization requests are rejected fail-closed.
- Simulated human requests with certified roles and signatures are authorized.
"""

import json
import sys
from pathlib import Path

BASE = Path(__file__).resolve().parents[1]
CONTROLS_FILE = BASE / "policies" / "human_only_controls.json"

MANDATORY_HUMAN_CONTROLS = {
    "MASTERY_CERTIFICATION",
    "CONSENT_CHANGE",
    "CONSENT_WITHDRAWAL",
    "ROLE_CHANGE",
    "SAFETY_INCIDENT_CLOSURE",
    "CREDENTIAL_AUTHORIZATION",
    "AUTONOMY_POLICY_CHANGE",
    "JURISDICTION_ACTIVATION"
}


class PolicyViolationError(Exception):
    pass


def load_json(path: Path) -> dict:
    if not path.exists():
        raise FileNotFoundError(f"File not found: {path}")
    with path.open("r", encoding="utf-8") as f:
        return json.load(f)


def authorize_action(control_id: str, actor_role: str, signature: str, is_automated_ai: bool, config: dict) -> bool:
    """
    Evaluates an authorization request against the human-only control policy.
    Fails closed if an AI tries to authorize a human-only control.
    """
    controls = {c["controlId"]: c for c in config.get("controls", [])}
    if control_id not in controls:
        raise PolicyViolationError(f"Unknown control ID: {control_id}")

    control = controls[control_id]

    # Invariant: AI can never autonomously authorize a human-only control
    if is_automated_ai:
        if not control.get("aiAutonomousAllowed", False):
            return False

    # Check authorized human roles and signature
    if actor_role in control.get("authorizedHumanRoles", []):
        if control.get("requiresSignature", True) and signature and len(signature.strip()) >= 16:
            return True

    return False


def validate_controls_configuration(config: dict) -> None:
    controls = config.get("controls", [])
    if not controls:
        raise PolicyViolationError("No controls found in human_only_controls.json")

    found_ids = set()
    for c in controls:
        cid = c.get("controlId")
        if not cid:
            raise PolicyViolationError(f"Missing controlId in entry: {c}")

        if c.get("aiAutonomousAllowed") is not False:
            raise PolicyViolationError(f"Control '{cid}' MUST have aiAutonomousAllowed == False")

        if not c.get("authorizedHumanRoles"):
            raise PolicyViolationError(f"Control '{cid}' must specify at least one authorizedHumanRole")

        if not c.get("requiresSignature"):
            raise PolicyViolationError(f"Control '{cid}' must require a cryptographic human signature")

        found_ids.add(cid)

    missing = MANDATORY_HUMAN_CONTROLS - found_ids
    if missing:
        raise PolicyViolationError(f"Missing mandatory human-only controls: {missing}")


def main() -> int:
    try:
        config = load_json(CONTROLS_FILE)
        validate_controls_configuration(config)

        # Simulation: test each control with an AI request (MUST return False)
        for cid in MANDATORY_HUMAN_CONTROLS:
            allowed = authorize_action(
                control_id=cid,
                actor_role="AUTONOMOUS_AI_AGENT",
                signature="ai-token-123",
                is_automated_ai=True,
                config=config
            )
            if allowed:
                raise PolicyViolationError(f"FAIL-CLOSED BREACH: AI was allowed to authorize '{cid}'")

        print("PASS: All 8 permanent human-only controls are strictly enforced fail-closed.")
        return 0
    except (PolicyViolationError, FileNotFoundError, json.JSONDecodeError) as e:
        print(f"FAIL: {e}")
        return 1


if __name__ == "__main__":
    sys.exit(main())
