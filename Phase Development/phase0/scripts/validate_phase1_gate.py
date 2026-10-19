#!/usr/bin/env python3

import subprocess
import sys
from pathlib import Path


BASE = Path(__file__).resolve().parents[1]


CHECKS = [
    (
        "Scope Lock",
        BASE / "scripts" / "validate_scope_lock.py"
    ),
    (
        "Compliance",
        BASE / "scripts" / "validate_compliance.py"
    ),
    (
        "Sign-offs",
        BASE / "scripts" / "validate_signoffs.py"
    )
]


def run_check(name, script):
    print(f"\n[{name}]")

    result = subprocess.run(
        [sys.executable, str(script)],
        capture_output=True,
        text=True
    )

    print(result.stdout)

    if result.stderr:
        print(result.stderr)

    return result.returncode == 0


def main():
    results = []

    for name, script in CHECKS:
        results.append(
            (name, run_check(name, script))
        )

    print("\n==============================")
    print("YOUVA EdAI PHASE 0 GATE")
    print("==============================")

    failed = False

    for name, passed in results:
        status = "PASS" if passed else "FAIL"
        print(f"{status:6} {name}")

        if not passed:
            failed = True

    print("==============================")

    if failed:
        print("PHASE 1 BLOCKED")
        return 1

    print("PHASE 0 COMPLETE")
    print("PHASE 1 MAY BEGIN")
    return 0


if __name__ == "__main__":
    sys.exit(main())
