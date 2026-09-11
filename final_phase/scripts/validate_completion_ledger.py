#!/usr/bin/env python3
"""
Validates the Master Task Completion Ledger, Consolidated Checklist, and Ownership Directory.
Enforces:
- All tasks in master_completion_ledger.json have valid status.
- Tasks marked VERIFIED or THIRD_PARTY_VERIFIED have verified evidence, reviewer, and valid dates.
- Organizational ownership functions do NOT default to the founder (isFounderDefault == False).
- All 11 roadmap phases in master_checklist.json are accounted for.
"""

import json
import sys
from pathlib import Path

BASE = Path(__file__).resolve().parents[1]
LEDGER_DIR = BASE / "ledger"
REVIEWS_DIR = BASE / "reviews"
LEDGER_FILE = LEDGER_DIR / "master_completion_ledger.json"
CHECKLIST_FILE = LEDGER_DIR / "master_checklist.json"
OWNERSHIP_FILE = REVIEWS_DIR / "organizational_ownership.json"
RHYTHM_FILE = REVIEWS_DIR / "operating_rhythm.json"

EXPECTED_PHASES = {
    "PHASE_0", "PHASE_1", "PHASE_2", "PHASE_3", "PHASE_4",
    "PHASE_5", "PHASE_6", "PHASE_7", "PHASE_8", "PHASE_9", "FINAL_PHASE"
}


class LedgerValidationError(Exception):
    pass


def load_json(path: Path) -> dict:
    if not path.exists():
        raise FileNotFoundError(f"File not found: {path}")
    with path.open("r", encoding="utf-8") as f:
        return json.load(f)


def validate_ledger(ledger_data: dict) -> None:
    valid_statuses = set(ledger_data.get("validStatuses", []))
    tasks = ledger_data.get("tasks", [])
    if not tasks:
        raise LedgerValidationError("Tasks cannot be empty in master_completion_ledger.json")

    phases_found = set()
    for task in tasks:
        tid = task.get("taskId")
        phase = task.get("phase")
        status = task.get("status")
        evidence = task.get("evidence")
        reviewer = task.get("reviewer")
        verified_date = task.get("verified")

        if not tid or not phase or not status:
            raise LedgerValidationError(f"Incomplete task entry: {task}")

        if status not in valid_statuses:
            raise LedgerValidationError(f"Task '{tid}' has invalid status '{status}'")

        if status in {"VERIFIED", "THIRD_PARTY_VERIFIED"}:
            if not evidence or not evidence.strip():
                raise LedgerValidationError(f"Task '{tid}' marked '{status}' but missing evidence")
            if not reviewer or not reviewer.strip():
                raise LedgerValidationError(f"Task '{tid}' marked '{status}' but missing reviewer")
            if not verified_date:
                raise LedgerValidationError(f"Task '{tid}' marked '{status}' but missing verified date")

        phases_found.add(phase)

    missing_phases = EXPECTED_PHASES - phases_found
    if missing_phases:
        raise LedgerValidationError(f"Ledger missing tasks for phases: {missing_phases}")


def validate_checklist(checklist_data: dict) -> None:
    phases = checklist_data.get("phases", [])
    if not phases:
        raise LedgerValidationError("Phases cannot be empty in master_checklist.json")

    checklist_phases = {p.get("phaseId") for p in phases}
    missing = EXPECTED_PHASES - checklist_phases
    if missing:
        raise LedgerValidationError(f"Master checklist missing phases: {missing}")

    for p in phases:
        items = p.get("items", [])
        if not items:
            raise LedgerValidationError(f"Checklist phase '{p.get('phaseId')}' has no items")
        for item in items:
            if not item.get("id") or not item.get("description") or not item.get("status"):
                raise LedgerValidationError(f"Incomplete checklist item in {p.get('phaseId')}: {item}")


def validate_ownership(ownership_data: dict) -> None:
    assignments = ownership_data.get("ownershipAssignments", [])
    if not assignments:
        raise LedgerValidationError("No ownership assignments found in organizational_ownership.json")

    for a in assignments:
        fid = a.get("functionId")
        assigned_role = a.get("assignedRole")
        is_founder = a.get("isFounderDefault", True)

        if not fid or not assigned_role:
            raise LedgerValidationError(f"Incomplete ownership assignment: {a}")

        # Invariant: Steady-state governance must not default to founder
        if is_founder:
            raise LedgerValidationError(
                f"Governance risk: Function '{fid}' defaults to founder. Must assign explicit non-founder role."
            )


def validate_operating_rhythm(rhythm_data: dict) -> None:
    schedules = rhythm_data.get("schedules", [])
    if len(schedules) < 8:
        raise LedgerValidationError(f"Expected at least 8 operating rhythm schedules, found {len(schedules)}")

    for s in schedules:
        if not s.get("cadenceId") or not s.get("owner") or s.get("status") != "ACTIVE":
            raise LedgerValidationError(f"Invalid operating rhythm schedule: {s}")


def main() -> int:
    try:
        ledger = load_json(LEDGER_FILE)
        validate_ledger(ledger)

        checklist = load_json(CHECKLIST_FILE)
        validate_checklist(checklist)

        ownership = load_json(OWNERSHIP_FILE)
        validate_ownership(ownership)

        rhythm = load_json(RHYTHM_FILE)
        validate_operating_rhythm(rhythm)

        print("PASS: Master completion ledger, checklist, ownership, and operating rhythm validated successfully.")
        return 0
    except (LedgerValidationError, FileNotFoundError, json.JSONDecodeError) as e:
        print(f"FAIL: {e}")
        return 1


if __name__ == "__main__":
    sys.exit(main())
