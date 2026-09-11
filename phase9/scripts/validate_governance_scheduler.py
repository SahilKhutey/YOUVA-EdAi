#!/usr/bin/env python3
"""
Validates Phase 9 Governance Scheduler, Compliance Matrix, and Data Room Index.
Enforces:
- Presence and validity of all 7 mandatory recurring governance review classes.
- Interval and SLA boundaries for each review class.
- 100% compliance across the institutional compliance matrix controls.
- Approved status for all enterprise data room documents.
"""

import json
import sys
from pathlib import Path

BASE = Path(__file__).resolve().parents[1]
GOVERNANCE_DIR = BASE / "governance"
SCHEDULER_FILE = GOVERNANCE_DIR / "governance-scheduler.json"
COMPLIANCE_FILE = GOVERNANCE_DIR / "compliance-matrix.json"
DATA_ROOM_FILE = GOVERNANCE_DIR / "data-room-index.json"

MANDATORY_REVIEW_CLASSES = {
    "model_drift_bias_audit": 90,
    "child_safety_policy_review": 60,
    "penetration_testing_security_audit": 180,
    "curriculum_alignment_review": 365,
    "sla_incident_retrospective": 30,
    "audit_log_cryptographic_verification": 7,
    "institutional_compliance_recertification": 365
}


class GovernanceValidationError(Exception):
    pass


def load_json(path: Path) -> dict:
    if not path.exists():
        raise FileNotFoundError(f"File not found: {path}")
    with path.open("r", encoding="utf-8") as f:
        return json.load(f)


def validate_scheduler(data: dict) -> None:
    review_classes = data.get("reviewClasses", [])
    if not review_classes:
        raise GovernanceValidationError("reviewClasses cannot be empty in governance-scheduler.json")

    found_ids = set()
    for item in review_classes:
        item_id = item.get("id")
        name = item.get("name")
        interval = item.get("maxIntervalDays")
        owner = item.get("ownerRole")
        status = item.get("status")
        escalation = item.get("escalationPathHours")

        if not item_id or not name or not owner or not status:
            raise GovernanceValidationError(f"Incomplete review class entry: {item}")

        if status not in {"scheduled", "in_progress", "completed"}:
            raise GovernanceValidationError(f"Invalid status '{status}' for review class '{item_id}'")

        if not isinstance(escalation, int) or escalation > 48 or escalation <= 0:
            raise GovernanceValidationError(
                f"Review class '{item_id}' escalationPathHours ({escalation}) must be between 1 and 48"
            )

        if item_id in MANDATORY_REVIEW_CLASSES:
            max_allowed = MANDATORY_REVIEW_CLASSES[item_id]
            if not isinstance(interval, int) or interval > max_allowed:
                raise GovernanceValidationError(
                    f"Review class '{item_id}' interval ({interval} days) exceeds maximum allowed ({max_allowed} days)"
                )

        found_ids.add(item_id)

    missing = set(MANDATORY_REVIEW_CLASSES.keys()) - found_ids
    if missing:
        raise GovernanceValidationError(f"Missing mandatory review classes: {missing}")


def validate_compliance_matrix(data: dict) -> None:
    domains = data.get("domains", [])
    if not domains:
        raise GovernanceValidationError("Missing domains in compliance-matrix.json")

    for domain in domains:
        controls = domain.get("controls", [])
        if not controls:
            raise GovernanceValidationError(f"Empty controls in domain '{domain.get('domain')}'")
        for control in controls:
            cid = control.get("controlId")
            status = control.get("status")
            if status != "COMPLIANT":
                raise GovernanceValidationError(
                    f"Non-compliant control in compliance matrix: '{cid}' has status '{status}'"
                )


def validate_data_room(data: dict) -> None:
    sections = data.get("dataRoom", {}).get("sections", [])
    if not sections:
        raise GovernanceValidationError("Missing sections in data-room-index.json")

    for sec in sections:
        docs = sec.get("documents", [])
        if not docs:
            raise GovernanceValidationError(f"No documents in section '{sec.get('id')}'")
        for doc in docs:
            doc_id = doc.get("docId")
            status = doc.get("status")
            if status != "APPROVED":
                raise GovernanceValidationError(
                    f"Data room document '{doc_id}' is not approved (status: '{status}')"
                )


def main() -> int:
    try:
        scheduler_data = load_json(SCHEDULER_FILE)
        validate_scheduler(scheduler_data)

        compliance_data = load_json(COMPLIANCE_FILE)
        validate_compliance_matrix(compliance_data)

        data_room_data = load_json(DATA_ROOM_FILE)
        validate_data_room(data_room_data)

        print("PASS: Governance scheduler, compliance matrix, and data room validated successfully.")
        return 0
    except (GovernanceValidationError, FileNotFoundError, json.JSONDecodeError) as e:
        print(f"FAIL: {e}")
        return 1


if __name__ == "__main__":
    sys.exit(main())
