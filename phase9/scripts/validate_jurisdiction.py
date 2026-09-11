#!/usr/bin/env python3
"""
Validates Phase 9 Jurisdiction Profiles and Registry against jurisdiction.schema.json.
Enforces strict fail-closed institutional invariants:
- Active jurisdictions MUST have approved legal and child safety reviews.
- Active jurisdictions MUST enforce withdrawalPurgeSLAHours <= 72.
- Active jurisdictions MUST enforce safetyEscalationSLAHours <= 24.
- The registry's defaultJurisdiction must be valid, active, and present.
"""

import json
import sys
from pathlib import Path
from jsonschema import validate as json_validate, ValidationError as JsonSchemaValidationError

BASE = Path(__file__).resolve().parents[1]
JURISDICTIONS_DIR = BASE / "jurisdictions"
SCHEMA_FILE = JURISDICTIONS_DIR / "jurisdiction.schema.json"
REGISTRY_FILE = JURISDICTIONS_DIR / "registry.json"


class JurisdictionValidationError(Exception):
    pass


def load_json(path: Path) -> dict:
    if not path.exists():
        raise FileNotFoundError(f"File not found: {path}")
    with path.open("r", encoding="utf-8") as f:
        return json.load(f)


def validate_single_jurisdiction(profile: dict, schema: dict, filename: str) -> None:
    # 1. JSON Schema validation
    try:
        json_validate(instance=profile, schema=schema)
    except JsonSchemaValidationError as e:
        raise JurisdictionValidationError(f"Schema violation in {filename}: {e.message}")

    # 2. Strict Fail-Closed Active Invariants
    status = profile.get("status")
    if status == "active":
        legal = profile.get("legalReview", {})
        if not legal.get("approved"):
            raise JurisdictionValidationError(
                f"Active jurisdiction '{profile.get('jurisdictionId')}' requires legalReview.approved == True"
            )
        if not legal.get("reviewedBy") or not legal.get("firm"):
            raise JurisdictionValidationError(
                f"Active jurisdiction '{profile.get('jurisdictionId')}' requires reviewedBy and firm"
            )

        safety = profile.get("childSafetyReview", {})
        if not safety.get("approved"):
            raise JurisdictionValidationError(
                f"Active jurisdiction '{profile.get('jurisdictionId')}' requires childSafetyReview.approved == True"
            )
        if not safety.get("reviewerRole"):
            raise JurisdictionValidationError(
                f"Active jurisdiction '{profile.get('jurisdictionId')}' requires childSafetyReview.reviewerRole"
            )

        consent = profile.get("consentRules", {})
        purge_sla = consent.get("withdrawalPurgeSLAHours", 999)
        if purge_sla > 72:
            raise JurisdictionValidationError(
                f"Active jurisdiction '{profile.get('jurisdictionId')}' withdrawalPurgeSLAHours cannot exceed 72 (found {purge_sla})"
            )

        escalation_sla = profile.get("safetyEscalationSLAHours", 999)
        if escalation_sla > 24:
            raise JurisdictionValidationError(
                f"Active jurisdiction '{profile.get('jurisdictionId')}' safetyEscalationSLAHours cannot exceed 24 (found {escalation_sla})"
            )


def validate_registry() -> None:
    schema = load_json(SCHEMA_FILE)
    registry_data = load_json(REGISTRY_FILE)

    registry = registry_data.get("registry")
    if not registry:
        raise JurisdictionValidationError("Missing 'registry' key in registry.json")

    default_jur = registry.get("defaultJurisdiction")
    supported = registry.get("supportedJurisdictions", [])

    if not default_jur:
        raise JurisdictionValidationError("defaultJurisdiction must be specified in registry.json")
    if not supported:
        raise JurisdictionValidationError("supportedJurisdictions cannot be empty in registry.json")

    found_default = False
    for entry in supported:
        jur_id = entry.get("id")
        file_name = entry.get("file")
        status = entry.get("status")

        if not jur_id or not file_name or not status:
            raise JurisdictionValidationError(f"Invalid entry in supportedJurisdictions: {entry}")

        file_path = JURISDICTIONS_DIR / file_name
        profile = load_json(file_path)

        if profile.get("jurisdictionId") != jur_id:
            raise JurisdictionValidationError(
                f"Mismatch: registry id '{jur_id}' != profile jurisdictionId '{profile.get('jurisdictionId')}' in {file_name}"
            )
        if profile.get("status") != status:
            raise JurisdictionValidationError(
                f"Mismatch: registry status '{status}' != profile status '{profile.get('status')}' in {file_name}"
            )

        validate_single_jurisdiction(profile, schema, file_name)

        if jur_id == default_jur:
            if status != "active":
                raise JurisdictionValidationError(
                    f"defaultJurisdiction '{default_jur}' MUST have status == 'active'"
                )
            found_default = True

    if not found_default:
        raise JurisdictionValidationError(
            f"defaultJurisdiction '{default_jur}' is not listed in supportedJurisdictions"
        )


def main() -> int:
    try:
        validate_registry()
        print("PASS: Jurisdiction profiles and registry validated successfully.")
        return 0
    except (JurisdictionValidationError, FileNotFoundError, json.JSONDecodeError) as e:
        print(f"FAIL: {e}")
        return 1


if __name__ == "__main__":
    sys.exit(main())
