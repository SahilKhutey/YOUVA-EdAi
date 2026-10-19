#!/usr/bin/env python3

import json
import sys
from pathlib import Path

BASE = Path(__file__).resolve().parents[1]
FILE = BASE / "compliance-checklist.json"


PASS_STATES = {"complete", "verified", "reviewed"}


def main():
    with FILE.open("r", encoding="utf-8") as f:
        data = json.load(f)

    failures = []

    if not data.get("jurisdiction"):
        failures.append("jurisdiction is missing")

    if not data.get("regulation"):
        failures.append("regulation is missing")

    controls = data.get("controls", [])

    if not controls:
        failures.append("no compliance controls defined")

    for control in controls:
        status = control.get("status")

        if status not in PASS_STATES:
            failures.append(
                f"{control.get('id')}: "
                f"{control.get('requirement')} "
                f"[{status}]"
            )

    if failures:
        print("FAIL: Compliance gate failed.")
        for failure in failures:
            print(f" - {failure}")
        return 1

    print("PASS: Compliance checklist complete.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
