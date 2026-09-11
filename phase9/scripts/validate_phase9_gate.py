#!/usr/bin/env python3
"""
Master Phase 9 Institutional Readiness Gate Validator.
Executes:
1. Multi-Jurisdiction Compliance & Fallback Routing Check
2. W3C VC 2.0 / Open Badges 3.0 Credential & Anti-Gaming Check
3. Institutional Governance Scheduler, Compliance Matrix & Data Room Check

Fails closed if any invariant is violated.
"""

import subprocess
import sys
from pathlib import Path

BASE = Path(__file__).resolve().parents[1]

CHECKS = [
    (
        "Multi-Jurisdiction Compliance",
        BASE / "scripts" / "validate_jurisdiction.py"
    ),
    (
        "Credential Network & Anti-Gaming",
        BASE / "scripts" / "validate_credentials.py"
    ),
    (
        "Institutional Governance & Data Room",
        BASE / "scripts" / "validate_governance_scheduler.py"
    )
]


def run_check(name: str, script: Path):
    print(f"\n[{name}]")
    result = subprocess.run(
        [sys.executable, str(script)],
        capture_output=True,
        text=True
    )
    if result.stdout:
        print(result.stdout.strip())
    if result.stderr:
        print(result.stderr.strip())
    return result.returncode == 0


def main() -> int:
    print("=========================================================")
    print("YOUVA EdAI PHASE 9 INSTITUTIONAL READINESS GATE")
    print("=========================================================")

    results = []
    for name, script in CHECKS:
        results.append((name, run_check(name, script)))

    print("\n=========================================================")
    print("GATE SUMMARY EVALUATION")
    print("=========================================================")

    failed = False
    for name, passed in results:
        status = "PASS" if passed else "FAIL"
        print(f"[{status:4}] {name}")
        if not passed:
            failed = True

    print("=========================================================")
    if failed:
        print("STATUS: PHASE 9 GATE FAILED — INSTITUTIONAL SCALE BLOCKED")
        print("=========================================================")
        return 1

    print("STATUS: PHASE 9 COMPLETE — INSTITUTIONAL SCALE AUTHORIZED")
    print("=========================================================")
    return 0


if __name__ == "__main__":
    sys.exit(main())
