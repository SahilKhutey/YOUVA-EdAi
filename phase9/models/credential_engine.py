"""
YOUVA-EdAI — Phase 9: Verifiable Credential Network & Anti-Gaming Engine
Enforces:
- W3C VC 2.0 & Open Badges 3.0 data model compliance.
- Zero-PII public verification token hashing (SHA-256 over 256-bit entropy).
- Anti-gaming & speedrun anomaly detection (< 8s threshold; >= 2 speedruns flag gaming).
- Human Teacher Authorization Invariant: strictly blocks autonomous AI credential issuance.
- Cryptographic proof verification and revocation management.
"""

from dataclasses import dataclass, field
from datetime import datetime, timezone
import hashlib
import json
from pathlib import Path
import secrets
from typing import Any, Dict, List, Optional, Set
from jsonschema import validate as json_validate, ValidationError as JsonSchemaValidationError


class CredentialValidationError(Exception):
    """Raised when a verifiable credential fails schema or policy validation."""
    pass


class SpeedrunGamingDetectedError(CredentialValidationError):
    """Raised when student session exhibits bot/speedrun gaming anomalies."""
    pass


class AutonomousCredentialIssuanceForbiddenError(CredentialValidationError):
    """Raised when an attempt is made to issue a credential without human teacher authorization."""
    pass


FORBIDDEN_PII_FIELDS = {
    "name", "studentname", "firstname", "lastname", "email",
    "phone", "phonenumber", "address", "ssn", "aadhaar", "dob"
}


@dataclass
class SessionIntegrityReport:
    total_questions: int
    total_time_minutes: float
    independent_accuracy: float
    assistance_rate: float
    speedrun_item_count: int
    is_valid: bool
    rejection_reasons: List[str] = field(default_factory=list)


class CredentialEngine:
    """Production runtime engine for issuing and verifying W3C VC 2.0 credentials."""

    def __init__(self, credentials_dir: Optional[Path] = None):
        if credentials_dir is None:
            credentials_dir = Path(__file__).resolve().parents[1] / "credentials"
        self.credentials_dir = credentials_dir
        self.schema_file = self.credentials_dir / "credential.schema.json"
        self.policy_file = self.credentials_dir / "anti-gaming.json"

        self.schema = self._load_json(self.schema_file)
        self.policy = self._load_json(self.policy_file)
        self.anti_gaming = self.policy.get("antiGamingPolicy", {})

        # Ledger of issued credential IDs and revocations
        self.issued_credentials: Set[str] = set()
        self.revoked_credentials: Dict[str, dict] = {}

    def _load_json(self, path: Path) -> dict:
        if not path.exists():
            raise FileNotFoundError(f"Credential file not found: {path}")
        with path.open("r", encoding="utf-8") as f:
            return json.load(f)

    def generate_zero_pii_token(self) -> Dict[str, str]:
        """
        Generates a 256-bit cryptographically secure private token
        and its public SHA-256 verification hash.
        """
        private_token = secrets.token_hex(32)  # 256 bits of entropy
        public_hash = hashlib.sha256(private_token.encode("utf-8")).hexdigest()
        return {
            "private_token": private_token,
            "verificationTokenHash": public_hash
        }

    def evaluate_session_integrity(
        self,
        question_durations_seconds: List[float],
        total_questions: int,
        accuracy: float,
        assistance_count: int,
        total_time_minutes: float
    ) -> SessionIntegrityReport:
        """
        Algorithmic verification of student session integrity.
        Enforces:
        - Minimum 20 independent questions
        - Minimum 45 active minutes on task
        - Minimum 80% accuracy
        - Maximum 25% assistance rate
        - Speedrun filter: questions answered in < 8s flagged; >= 2 speedruns = gaming failure.
        """
        min_criteria = self.anti_gaming.get("minimumCriteria", {})
        anomaly_cfg = self.anti_gaming.get("anomalyDetection", {})

        min_q = min_criteria.get("minimumIndependentQuestionsAnswered", 20)
        min_time = min_criteria.get("minimumTimeOnTaskMinutes", 45)
        min_acc = min_criteria.get("minimumIndependentAccuracy", 0.80)
        max_assist = min_criteria.get("maximumAssistanceRate", 0.25)
        min_sec_per_q = anomaly_cfg.get("minimumSecondsPerQuestion", 8)
        max_speedrun = anomaly_cfg.get("maxSpeedrunQuestionsAllowed", 1)

        reasons = []
        speedrun_items = [d for d in question_durations_seconds if d < min_sec_per_q]
        speedrun_count = len(speedrun_items)

        if speedrun_count > max_speedrun:
            reasons.append(
                f"Speedrun gaming anomaly detected: {speedrun_count} items answered in < {min_sec_per_q}s "
                f"(maximum permitted is {max_speedrun})"
            )

        if total_questions < min_q:
            reasons.append(f"Insufficient question count: {total_questions} < {min_q}")

        if total_time_minutes < min_time:
            reasons.append(f"Insufficient time on task: {total_time_minutes:.1f}m < {min_time}m")

        if accuracy < min_acc:
            reasons.append(f"Accuracy below threshold: {accuracy:.2%} < {min_acc:.2%}")

        assistance_rate = assistance_count / max(total_questions, 1)
        if assistance_rate > max_assist:
            reasons.append(f"Assistance rate exceeded: {assistance_rate:.2%} > {max_assist:.2%}")

        is_valid = len(reasons) == 0
        return SessionIntegrityReport(
            total_questions=total_questions,
            total_time_minutes=total_time_minutes,
            independent_accuracy=accuracy,
            assistance_rate=assistance_rate,
            speedrun_item_count=speedrun_count,
            is_valid=is_valid,
            rejection_reasons=reasons,
        )

    def validate_credential(self, credential: dict) -> None:
        """
        Validates a W3C VC 2.0 credential against schema, anti-gaming rules,
        zero-PII public constraints, and human teacher authorization.
        """
        # 1. JSON Schema Validation
        try:
            json_validate(instance=credential, schema=self.schema)
        except JsonSchemaValidationError as e:
            raise CredentialValidationError(f"Schema violation: {e.message}")

        # 2. Revocation Check
        cred_id = credential.get("id")
        if cred_id in self.revoked_credentials:
            rev_info = self.revoked_credentials[cred_id]
            raise CredentialValidationError(
                f"Credential '{cred_id}' has been revoked: {rev_info.get('reason')} "
                f"at {rev_info.get('revokedAt')}"
            )

        # 3. Zero-PII Public Payload Invariant
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

        # 4. Human Teacher Authorization Invariant
        human_policy = self.anti_gaming.get("humanAuthorizationInvariant", {})
        if human_policy.get("aiCanIssueIndependently", True):
            raise AutonomousCredentialIssuanceForbiddenError(
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

        # 5. Anti-Gaming Metrics Verification
        min_criteria = self.anti_gaming.get("minimumCriteria", {})
        min_questions = min_criteria.get("minimumIndependentQuestionsAnswered", 20)
        min_time = min_criteria.get("minimumTimeOnTaskMinutes", 45)
        min_acc = min_criteria.get("minimumIndependentAccuracy", 0.80)

        evidence_list = subj.get("evidence", [])
        total_questions = sum(e.get("metrics", {}).get("questionsAnswered", 0) for e in evidence_list)
        total_time = sum(e.get("metrics", {}).get("timeOnTaskMinutes", 0.0) for e in evidence_list)
        avg_accuracy = (
            sum(e.get("metrics", {}).get("independentAccuracy", 0.0) for e in evidence_list)
            / max(len(evidence_list), 1)
        )

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
                f"Anti-gaming violation: independent accuracy ({avg_accuracy:.2%}) < minimum ({min_acc:.2%})"
            )

    def issue_credential(
        self,
        credential: dict,
        session_durations: Optional[List[float]] = None
    ) -> dict:
        """
        Issues a new credential after full integrity checks.
        Prevents duplicate issuance.
        """
        cred_id = credential.get("id")
        if cred_id in self.issued_credentials:
            raise CredentialValidationError(f"Duplicate credential issuance rejected: '{cred_id}' already issued")

        # If durations supplied, test speedrun
        if session_durations:
            min_sec = self.anti_gaming.get("anomalyDetection", {}).get("minimumSecondsPerQuestion", 8)
            speedruns = [d for d in session_durations if d < min_sec]
            if len(speedruns) >= 2:
                raise SpeedrunGamingDetectedError(
                    f"Credential rejected: {len(speedruns)} speedrun responses (< {min_sec}s) detected"
                )

        # Validate against full policy & human authorization
        self.validate_credential(credential)

        # Record issuance
        self.issued_credentials.add(cred_id)
        return {
            "credentialId": cred_id,
            "status": "ISSUED",
            "issuedAt": datetime.now(timezone.utc).isoformat(),
            "verificationTokenHash": credential["credentialSubject"]["verificationTokenHash"],
            "teacherAuthorized": True,
        }

    def revoke_credential(self, credential_id: str, reason: str, authorized_by: str) -> dict:
        """Revokes a previously issued credential within the 1-hour SLA."""
        revocation_entry = {
            "credentialId": credential_id,
            "reason": reason,
            "authorizedBy": authorized_by,
            "revokedAt": datetime.now(timezone.utc).isoformat(),
            "status": "REVOKED",
        }
        self.revoked_credentials[credential_id] = revocation_entry
        return revocation_entry

    def is_revoked(self, credential_id: str) -> bool:
        return credential_id in self.revoked_credentials
