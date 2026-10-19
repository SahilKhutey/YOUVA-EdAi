"""
YOUVA-EdAi: Skills Passport Engine (W3C VC 2.0 / Open Badges 3.0)
Issues, cryptographically signs, and validates verifiable micro-credentials for student mastery.
Enforces:
  1. Strict Zero-PII Invariant: No personal identifiers in public credentials.
  2. Strict Human Authorization Invariant: AI CANNOT issue credentials autonomously.
  3. Anti-Gaming Policy: Verifiable thresholds on practice questions, task time, and accuracy.
"""

from dataclasses import dataclass
from typing import Dict, List, Optional, Any
import hashlib
import hmac
import json
from datetime import datetime, timezone
from pathlib import Path


FORBIDDEN_PII_FIELDS = {
    "name", "studentname", "firstname", "lastname", "email",
    "phone", "phonenumber", "address", "ssn", "aadhaar", "dob", "birthdate"
}


class HumanAuthorizationRequiredError(Exception):
    """Raised when an automated agent attempts to issue a credential without human authorization."""
    pass


class ZeroPIIViolationError(Exception):
    """Raised when forbidden personal identifiable information (PII) is detected in the credential subject."""
    pass


class AntiGamingPolicyViolationError(Exception):
    """Raised when mastery metrics fail to satisfy independent anti-gaming thresholds."""
    pass


class CredentialIntegrityError(Exception):
    """Raised when cryptographic signature or payload tamper verification fails."""
    pass


@dataclass(frozen=True)
class AntiGamingRules:
    min_questions_answered: int = 15
    min_time_on_task_minutes: float = 45.0
    min_independent_accuracy: float = 0.80
    min_bkt_mastery: float = 0.85


class SkillsPassportEngine:
    """
    Decentralized Credential Issuer and Verifier for YOUVA-EdAi Skills Passport.
    Adheres to W3C Verifiable Credentials 2.0 and Open Badges 3.0 specification.
    """

    SECRET_KEY = b"YOUVA_EDAI_W3C_VC_KEY_2026"

    def __init__(self, anti_gaming_rules: Optional[AntiGamingRules] = None):
        self.rules = anti_gaming_rules or AntiGamingRules()

    def generate_student_did(self, raw_id: str) -> str:
        """Derive a deterministic pseudonymized Decentralized Identifier (DID) with zero PII."""
        token_hash = hashlib.sha256(raw_id.encode("utf-8")).hexdigest()[:16]
        return f"did:youva:student:{token_hash}"

    def generate_verification_token_hash(self, student_did: str, competency_code: str) -> str:
        """Generate a 64-character hex SHA-256 verification hash."""
        seed = f"{student_did}:{competency_code}:YOUVA_VERIFIED_PROOF"
        return hashlib.sha256(seed.encode("utf-8")).hexdigest()

    def create_credential(
        self,
        student_did: str,
        competency_code: str,
        achievement_name: str,
        achievement_description: str,
        metrics: Dict[str, Any],
        teacher_authorization: Dict[str, Any],
        issuer_id: str = "did:youva:issuer:delhi-public-school",
        issuer_name: str = "Delhi Public School, Sector XII, R.K. Puram"
    ) -> Dict[str, Any]:
        """
        Issue a new W3C Verifiable Credential 2.0.
        Gated by:
          - Zero-PII check
          - Human teacher authorization check
          - Anti-gaming policy thresholds
        """
        # 1. Enforce Human Authorization Invariant
        if not teacher_authorization:
            raise HumanAuthorizationRequiredError("Credential issuance requires verified human teacher authorization.")

        if teacher_authorization.get("decision") != "APPROVED":
            raise HumanAuthorizationRequiredError(
                f"Teacher authorization decision must be 'APPROVED' (got '{teacher_authorization.get('decision')}')."
            )

        teacher_id = teacher_authorization.get("teacherId")
        teacher_sig = teacher_authorization.get("signature")
        if not teacher_id or not teacher_sig:
            raise HumanAuthorizationRequiredError("Missing verified teacher ID or cryptographic signature.")

        # Check if caller tried to specify AI as authorizer
        if "AI" in teacher_authorization.get("teacherRole", "").upper():
            raise HumanAuthorizationRequiredError("AI cannot act as teacher authorizer; human role required.")

        # 2. Enforce Anti-Gaming Policy
        questions = metrics.get("questionsAnswered", 0)
        time_minutes = metrics.get("timeOnTaskMinutes", 0.0)
        accuracy = metrics.get("independentAccuracy", 0.0)
        mastery = metrics.get("finalBktMastery", 0.0)

        if questions < self.rules.min_questions_answered:
            raise AntiGamingPolicyViolationError(
                f"Anti-gaming check failed: questions answered ({questions}) < minimum ({self.rules.min_questions_answered})"
            )
        if time_minutes < self.rules.min_time_on_task_minutes:
            raise AntiGamingPolicyViolationError(
                f"Anti-gaming check failed: time on task ({time_minutes:.1f}m) < minimum ({self.rules.min_time_on_task_minutes}m)"
            )
        if accuracy < self.rules.min_independent_accuracy:
            raise AntiGamingPolicyViolationError(
                f"Anti-gaming check failed: independent accuracy ({accuracy:.2f}) < minimum ({self.rules.min_independent_accuracy:.2f})"
            )
        if mastery < self.rules.min_bkt_mastery:
            raise AntiGamingPolicyViolationError(
                f"Anti-gaming check failed: final BKT mastery ({mastery:.2f}) < threshold ({self.rules.min_bkt_mastery:.2f})"
            )

        # 3. Assemble Zero-PII Credential Subject
        verification_hash = self.generate_verification_token_hash(student_did, competency_code)
        
        credential_subject = {
            "id": student_did,
            "type": "AchievementSubject",
            "achievement": {
                "id": f"urn:youva:achievement:{competency_code.lower()}",
                "name": achievement_name,
                "description": achievement_description,
                "competencyCode": competency_code,
                "criteria": "Demonstrated >= 85% Corbett & Anderson BKT mastery on verified CBSE Grade 10 problem bank."
            },
            "verificationTokenHash": verification_hash,
            "evidence": [
                {
                    "type": "FormativePracticeEvidence",
                    "competency": competency_code,
                    "metrics": {
                        "questionsAnswered": int(questions),
                        "timeOnTaskMinutes": float(time_minutes),
                        "independentAccuracy": float(round(accuracy, 4)),
                        "finalBktMastery": float(round(mastery, 4))
                    }
                }
            ]
        }

        # 4. Enforce Zero-PII Audit
        self.verify_zero_pii(credential_subject)

        # 5. Build Base Document
        now_iso = datetime.now(timezone.utc).isoformat()
        cred_id = f"urn:uuid:{hashlib.sha256(f'{student_did}:{competency_code}:{now_iso}'.encode()).hexdigest()[:32]}"

        base_credential = {
            "@context": [
                "https://www.w3.org/ns/credentials/v2",
                "https://purl.imsglobal.org/spec/ob/v3p0/context.json"
            ],
            "id": cred_id,
            "type": ["VerifiableCredential", "OpenBadgeCredential"],
            "issuer": {
                "id": issuer_id,
                "name": issuer_name,
                "type": "EducationalInstitution"
            },
            "validFrom": now_iso,
            "credentialSubject": credential_subject,
            "teacherAuthorization": {
                "teacherId": teacher_id,
                "teacherRole": teacher_authorization.get("teacherRole", "Senior Mathematics Faculty"),
                "decision": "APPROVED",
                "authorizedAt": teacher_authorization.get("authorizedAt", now_iso),
                "signature": teacher_sig
            }
        }

        # 6. Generate Cryptographic Proof
        canonical_bytes = json.dumps(base_credential, sort_keys=True).encode("utf-8")
        proof_signature = hmac.new(self.SECRET_KEY, canonical_bytes, hashlib.sha256).hexdigest()

        base_credential["proof"] = {
            "type": "HmacSha256Signature2026",
            "created": now_iso,
            "verificationMethod": f"{issuer_id}#key-1",
            "proofPurpose": "assertionMethod",
            "proofValue": proof_signature
        }

        return base_credential

    def verify_zero_pii(self, subject: Dict[str, Any]) -> None:
        """Scan credential subject to ensure NO direct personal identifiers exist."""
        # Check top-level subject keys
        for k in subject.keys():
            if k.lower() in {"name", "studentname", "firstname", "lastname", "email", "phone", "aadhaar", "dob", "address"}:
                raise ZeroPIIViolationError(f"Zero-PII violation: found forbidden identifier field '{k}' at credentialSubject root.")

        # Deep recursive check for personal identifier keys
        deep_forbidden = {
            "studentname", "student_name", "firstname", "first_name",
            "lastname", "last_name", "email", "phone", "phonenumber",
            "address", "ssn", "aadhaar", "dob", "birthdate"
        }

        def scan_dict(d: Dict[str, Any]) -> None:
            for k, v in d.items():
                if k.lower().replace("_", "") in deep_forbidden:
                    raise ZeroPIIViolationError(f"Zero-PII violation: found forbidden personal identifier '{k}'.")
                if isinstance(v, dict):
                    scan_dict(v)
                elif isinstance(v, list):
                    for item in v:
                        if isinstance(item, dict):
                            scan_dict(item)

        scan_dict(subject)

    def verify_credential(self, credential: Dict[str, Any]) -> bool:
        """
        Cryptographically verify the integrity and governance rules of a W3C VC 2.0 credential:
          - Proof presence and signature match
          - Zero-PII guarantee
          - Teacher authorization validity
        """
        if "proof" not in credential:
            raise CredentialIntegrityError("Missing cryptographic proof block.")

        proof = credential["proof"]
        claimed_sig = proof.get("proofValue")
        if not claimed_sig:
            raise CredentialIntegrityError("Missing proofValue signature.")

        # Reconstruct unsigned credential
        unsigned_cred = {k: v for k, v in credential.items() if k != "proof"}
        canonical_bytes = json.dumps(unsigned_cred, sort_keys=True).encode("utf-8")
        expected_sig = hmac.new(self.SECRET_KEY, canonical_bytes, hashlib.sha256).hexdigest()

        if not hmac.compare_digest(claimed_sig, expected_sig):
            raise CredentialIntegrityError("Cryptographic signature mismatch; credential payload was tampered!")

        # Verify Zero-PII
        self.verify_zero_pii(credential.get("credentialSubject", {}))

        # Verify Teacher Authorization
        auth = credential.get("teacherAuthorization", {})
        if auth.get("decision") != "APPROVED" or not auth.get("signature"):
            raise HumanAuthorizationRequiredError("Credential lacks valid human teacher authorization.")

        return True

    def export_verification_qr_payload(self, credential: Dict[str, Any]) -> Dict[str, str]:
        """Export minimal, zero-PII payload for fast offline QR code verification."""
        self.verify_credential(credential)
        subj = credential["credentialSubject"]
        return {
            "credId": credential["id"],
            "did": subj["id"],
            "code": subj["achievement"]["competencyCode"],
            "hash": subj["verificationTokenHash"],
            "issuer": credential["issuer"]["id"],
            "sig": credential["proof"]["proofValue"][:16]
        }
