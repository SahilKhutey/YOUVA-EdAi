#!/usr/bin/env python3

import json
import sys
from pathlib import Path

BASE = Path(__file__).resolve().parents[1]

SCOPE_FILE = BASE / "scope-lock.json"
SIGNOFF_FILE = BASE / "signoffs.json"


def main():
    with SCOPE_FILE.open("r", encoding="utf-8") as f:
        scope = json.load(f)

    with SIGNOFF_FILE.open("r", encoding="utf-8") as f:
        signoffs = json.load(f)

    model = scope.get("launchModel", {}).get("model")

    failures = []

    for item in signoffs.get("requiredSignoffs", []):
        role = item["role"]

        required = item.get("required", False)

        if role == "pilot_partner" and model == "b2b_school_first":
            required = True

        if required:
            if item.get("status") != "approved":
                failures.append(
                    f"{role}: approval missing"
                )

            if not item.get("name"):
                failures.append(
                    f"{role}: reviewer name missing"
                )

            if not item.get("date"):
                failures.append(
                    f"{role}: approval date missing"
                )

    if failures:
        print("FAIL: Sign-off gate failed.")

        for failure in failures:
            print(f" - {failure}")

        return 1

    print("PASS: Required sign-offs complete.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
