#!/usr/bin/env python3
"""
YOUVA EdAI Master Production Release Gate Validator.
Evaluates the 12 mandatory release conditions:
- All critical automated test suites pass
- No unresolved critical defects
- Security review current
- Child-safety review current
- Legal/compliance reviews current
- Governance approvals current
- Operational monitoring active
- Incident response tested
- Backup/recovery verified
- Audit ledger verified
- 8 permanent human-only controls enforced
- Product owner GO

Fails closed to NO-GO on any failure.
"""

import json
import subprocess
import sys
from pathlib import Path

BASE = Path(__file__).resolve().parents[1]
GATE_CONFIG_FILE = BASE / "release_gate" / "release_gate_config.json"

INTERNAL_CHECKS = [
    (
        "Permanent Human-Only Controls",
        BASE / "scripts" / "validate_human_controls.py"
    ),
    (
        "Continuous Safety Operations",
        BASE / "scripts" / "validate_safety_operations.py"
    ),
    (
        "Master Ledger & Organizational Ownership",
        BASE / "scripts" / "validate_completion_ledger.py"
    )
]


def load_json(path: Path) -> dict:
    with path.open("r", encoding="utf-8") as f:
        return json.load(f)


def run_script(name: str, script: Path) -> bool:
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
    print("=================================================================")
    print("YOUVA EdAI FINAL PRODUCTION RELEASE GATE — GO / NO-GO EVALUATION")
    print("=================================================================")

    # 1. Run internal validator scripts
    failed = False
    for name, script in INTERNAL_CHECKS:
        if not run_script(name, script):
            failed = True

    # 2. Evaluate 12 mandatory release conditions
    print("\n[Evaluating Release Conditions]")
    config = load_json(GATE_CONFIG_FILE)
    conditions = config.get("releaseConditions", [])

    for cond in conditions:
        cid = cond.get("id")
        cname = cond.get("name")
        status = cond.get("status")
        mandatory = cond.get("mandatory", True)

        passed = (status == "PASS")
        flag = "PASS" if passed else "FAIL"
        print(f"  [{flag:4}] {cid}: {cname}")

        if mandatory and not passed:
            failed = True

    print("\n=================================================================")
    print("FINAL RELEASE DECISION")
    print("=================================================================")

    if failed:
        print("DECISION: >>> NO-GO <<<")
        print("REASON: One or more mandatory conditions or invariant checks failed.")
        print("=================================================================")
        return 1

    print("DECISION: >>> GO <<<")
    print("AUTHORIZATION: All 12 production release conditions and human invariants verified.")
    print("=================================================================")
    return 0


if __name__ == "__main__":
    sys.exit(main())
