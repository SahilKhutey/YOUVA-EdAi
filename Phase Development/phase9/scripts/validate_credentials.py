#!/usr/bin/env python3
"""
Validates Phase 9 Verifiable Credentials & Anti-Gaming Rules.
Enforces:
- Schema compliance with W3C VC 2.0 / Open Badges 3.0.
- Anti-gaming policy thresholds (questions, time on task, accuracy).
- Human teacher authorization invariant (AI cannot issue credentials autonomously).
- Zero-PII verification token integrity (no student PII in public credential payload).
"""

import json
import sys
from pathlib import Path
from jsonschema import validate as json_validate, ValidationError as JsonSchemaValidationError

BASE = Path(__file__).resolve().parents[1]
CREDENTIALS_DIR = BASE / "credentials"
SCHEMA_FILE = CREDENTIALS_DIR / "credential.schema.json"
ANTI_GAMING_FILE = CREDENTIALS_DIR / "anti-gaming.json"
SAMPLE_CREDENTIAL_FILE = CREDENTIALS_DIR / "sample-credential.json"

FORBIDDEN_PII_FIELDS = {
    "name", "studentname", "firstname", "lastname", "email",
    "phone", "phonenumber", "address", "ssn", "aadhaar", "dob"
}


class CredentialValidationError(Exception):
    pass


def load_json(path: Path) -> dict:
    if not path.exists():
        raise FileNotFoundError(f"File not found: {path}")
    with path.open("r", encoding="utf-8") as f:
        return json.load(f)


def validate_credential(credential: dict, schema: dict, policy: dict) -> None:
    # 1. JSON Schema Validation
    try:
        json_validate(instance=credential, schema=schema)
    except JsonSchemaValidationError as e:
        raise CredentialValidationError(f"Schema violation: {e.message}")

    # 2. Zero-PII Public Payload Invariant
    subj = credential.get("credentialSubject", {})
    for key in subj.keys():
        if key.lower() in FORBIDDEN_PII_FIELDS:
            raise CredentialValidationError(
                f"Zero-PII violation: found forbidden personal identifier field '{key}' in credentialSubject"
            )

    token_hash = subj.get("verificationTokenHash", "")
    if len(token_hash) != 64 or not all(c in "0123456789abcdefABCDEF" for c in token_hash):
        raise CredentialValidationError(
            f"Invalid verificationTokenHash: must be 64-character hex SHA-256 hash (got '{token_hash}')"
        )

    # 3. Human Teacher Authorization Invariant
    human_policy = policy.get("antiGamingPolicy", {}).get("humanAuthorizationInvariant", {})
    if human_policy.get("aiCanIssueIndependently", True):
        raise CredentialValidationError(
            "Policy violation: aiCanIssueIndependently must be explicitly FALSE"
        )
    if not human_policy.get("teacherAuthorizationMandatory", False):
        raise CredentialValidationError(
            "Policy violation: teacherAuthorizationMandatory must be explicitly TRUE"
        )

    auth = credential.get("teacherAuthorization", {})
    if auth.get("decision") != "APPROVED":
        raise CredentialValidationError(
            f"Human authorization rejected: decision is '{auth.get('decision')}'"
        )
    if not auth.get("teacherId") or not auth.get("signature"):
        raise CredentialValidationError(
            "Missing verified teacherId or cryptographic signature on teacher authorization"
        )

    # 4. Anti-Gaming Metric Thresholds
    min_criteria = policy.get("antiGamingPolicy", {}).get("minimumCriteria", {})
    min_questions = min_criteria.get("minimumIndependentQuestionsAnswered", 20)
    min_time = min_criteria.get("minimumTimeOnTaskMinutes", 45)
    min_acc = min_criteria.get("minimumIndependentAccuracy", 0.80)

    evidence_list = subj.get("evidence", [])
    total_questions = sum(e.get("metrics", {}).get("questionsAnswered", 0) for e in evidence_list)
    total_time = sum(e.get("metrics", {}).get("timeOnTaskMinutes", 0.0) for e in evidence_list)
    avg_accuracy = sum(e.get("metrics", {}).get("independentAccuracy", 0.0) for e in evidence_list) / max(len(evidence_list), 1)

    if total_questions < min_questions:
        raise CredentialValidationError(
            f"Anti-gaming violation: total questions ({total_questions}) < minimum ({min_questions})"
        )
    if total_time < min_time:
        raise CredentialValidationError(
            f"Anti-gaming violation: total time on task ({total_time:.1f}m) < minimum ({min_time}m)"
        )
    if avg_accuracy < min_acc:
        raise CredentialValidationError(
            f"Anti-gaming violation: accuracy ({avg_accuracy:.2f}) < minimum ({min_acc:.2f})"
        )


def main() -> int:
    try:
        schema = load_json(SCHEMA_FILE)
        policy = load_json(ANTI_GAMING_FILE)
        sample = load_json(SAMPLE_CREDENTIAL_FILE)

        validate_credential(sample, schema, policy)
        print("PASS: Credentials and anti-gaming verification validated successfully.")
        return 0
    except (CredentialValidationError, FileNotFoundError, json.JSONDecodeError) as e:
        print(f"FAIL: {e}")
        return 1


if __name__ == "__main__":
    sys.exit(main())
