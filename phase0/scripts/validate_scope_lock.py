#!/usr/bin/env python3

import json
import sys
from pathlib import Path

BASE = Path(__file__).resolve().parents[1]

SCOPE_FILE = BASE / "scope-lock.json"


class ValidationError(Exception):
    pass


def load_json(path):
    with path.open("r", encoding="utf-8") as f:
        return json.load(f)


def require(value, field):
    if value is None:
        raise ValidationError(f"{field} is required")

    if isinstance(value, str) and not value.strip():
        raise ValidationError(f"{field} cannot be empty")

    if isinstance(value, list) and not value:
        raise ValidationError(f"{field} cannot be empty")


def validate(scope):
    document = scope["document"]
    tier = scope["launchTier"]
    jurisdiction = scope["jurisdiction"]
    model = scope["launchModel"]
    subject = scope["mvpSubject"]

    require(document["name"], "document.name")
    require(document["version"], "document.version")

    require(tier["tier"], "launchTier.tier")
    require(tier["gradeBand"], "launchTier.gradeBand")
    require(tier["rationale"], "launchTier.rationale")

    require(jurisdiction["country"], "jurisdiction.country")
    require(jurisdiction["regulation"], "jurisdiction.regulation")

    require(model["model"], "launchModel.model")
    require(model["rationale"], "launchModel.rationale")

    require(subject["subject"], "mvpSubject.subject")
    require(subject["grade"], "mvpSubject.grade")
    require(
        subject["curriculumStandard"],
        "mvpSubject.curriculumStandard"
    )
    require(subject["units"], "mvpSubject.units")
    require(
        subject["contentOwner"],
        "mvpSubject.contentOwner"
    )
    require(
        subject["estimatedTimelineWeeks"],
        "mvpSubject.estimatedTimelineWeeks"
    )
    require(
        subject["estimatedBudget"],
        "mvpSubject.estimatedBudget"
    )

    if model["model"] == "b2b_school_first":
        require(
            model["pilotPartner"],
            "launchModel.pilotPartner"
        )

    if model["model"] == "b2c_family_first":
        require(
            model["pilotRecruitmentPlan"],
            "launchModel.pilotRecruitmentPlan"
        )

    if tier["tier"] != "middle_school":
        raise ValidationError(
            "MVP recommendation requires explicit review "
            "before selecting a tier other than middle_school"
        )

    if len(subject["units"]) < 1:
        raise ValidationError(
            "At least one curriculum unit is required"
        )

    return True


def main():
    try:
        scope = load_json(SCOPE_FILE)
        validate(scope)
        print("PASS: Scope Lock is complete.")
        return 0

    except KeyError as exc:
        print(f"FAIL: Missing field: {exc}")
        return 1

    except ValidationError as exc:
        print(f"FAIL: {exc}")
        return 1

    except json.JSONDecodeError as exc:
        print(f"FAIL: Invalid JSON: {exc}")
        return 1


if __name__ == "__main__":
    sys.exit(main())
