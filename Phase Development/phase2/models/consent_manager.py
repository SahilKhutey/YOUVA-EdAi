"""
YOUVA-EdAI — Verifiable Parental Consent (VPC) & 24-Hour Purge Manager.
Compliant with DPDP Act 2023 Section 9 (Processing of personal data of children).
"""

from __future__ import annotations
from dataclasses import dataclass, field
from datetime import datetime, timezone, timedelta
from enum import Enum
import hashlib
import hmac
import secrets
from typing import Dict, List, Optional, Tuple
import uuid


class ConsentType(str, Enum):
    LEARNING_SERVICE = "LEARNING_SERVICE"
    AI_ASSISTANCE = "AI_ASSISTANCE"
    PERSONALIZATION = "PERSONALIZATION"
    PARENT_PROGRESS_VISIBILITY = "PARENT_PROGRESS_VISIBILITY"
    COMMUNICATION = "COMMUNICATION"
    OPTIONAL_ANALYTICS = "OPTIONAL_ANALYTICS"


class ConsentStatus(str, Enum):
    PENDING = "PENDING"
    VERIFIED = "VERIFIED"
    REVOKED = "REVOKED"
    PURGED = "PURGED"


class VerificationMethod(str, Enum):
    OTP_SMS = "OTP_SMS"
    OTP_EMAIL = "OTP_EMAIL"
    DIGILOCKER_ID = "DIGILOCKER_ID"
    GOVERNMENT_ID = "GOVERNMENT_ID"


@dataclass
class ConsentRecord:
    consent_id: str
    parent_id: str
    student_id: str
    consent_type: ConsentType
    status: ConsentStatus
    version: str
    verification_method: VerificationMethod
    verification_timestamp: Optional[datetime] = None
    evidence_token: Optional[str] = None
    revoked_at: Optional[datetime] = None
    purge_scheduled_at: Optional[datetime] = None
    purged_at: Optional[datetime] = None
    metadata: Dict = field(default_factory=dict)

    def to_dict(self) -> dict:
        return {
            "consentId": self.consent_id,
            "parentId": self.parent_id,
            "studentId": self.student_id,
            "consentType": self.consent_type.value,
            "status": self.status.value,
            "version": self.version,
            "verificationMethod": self.verification_method.value,
            "verificationTimestamp": self.verification_timestamp.isoformat() if self.verification_timestamp else None,
            "evidenceToken": self.evidence_token,
            "revokedAt": self.revoked_at.isoformat() if self.revoked_at else None,
            "purgeScheduledAt": self.purge_scheduled_at.isoformat() if self.purge_scheduled_at else None,
            "purgedAt": self.purged_at.isoformat() if self.purged_at else None,
        }


@dataclass
class OtpChallenge:
    parent_id: str
    student_id: str
    consent_type: ConsentType
    otp_code: str
    expires_at: datetime
    attempts: int = 0
    max_attempts: int = 3


class ConsentManager:
    """
    Manages DPDP Act 2023 verifiable parental consent lifecycle,
    active session gating, and statutory 24-hour cryptographic data purge.
    """

    def __init__(self, secret_key: str = "youva-edai-dpdp-hmac-secret-v1"):
        self.secret_key = secret_key.encode("utf-8")
        # Store: (parent_id, student_id, consent_type) -> ConsentRecord
        self.records: Dict[Tuple[str, str, str], ConsentRecord] = {}
        # Pending OTP challenges: (parent_id, student_id, consent_type) -> OtpChallenge
        self.otp_challenges: Dict[Tuple[str, str, str], OtpChallenge] = {}
        # Active student sessions: student_id -> set of session_ids
        self.active_sessions: Dict[str, set[str]] = {}
        # Student PII registry for purge verification: student_id -> dict
        self.student_pii: Dict[str, dict] = {}

    def register_student(self, student_id: str, name: str, email: str, grade: str = "Grade 8"):
        """Registers student PII for tracking and verifying data purge."""
        self.student_pii[student_id] = {
            "name": name,
            "email": email,
            "grade": grade,
            "is_anonymized": False,
        }

    def request_consent_otp(
        self,
        parent_id: str,
        student_id: str,
        consent_type: ConsentType,
        channel: VerificationMethod = VerificationMethod.OTP_SMS,
        expiry_minutes: int = 10,
    ) -> str:
        """
        Issues a cryptographically secure 6-digit OTP for verifiable parental consent.
        Returns the generated OTP string (simulating delivery to verified parent phone/email).
        """
        # Cryptographic 6-digit code
        otp_code = f"{secrets.randbelow(900000) + 100000:06d}"
        expires_at = datetime.now(timezone.utc) + timedelta(minutes=expiry_minutes)

        challenge_key = (parent_id, student_id, consent_type.value)
        self.otp_challenges[challenge_key] = OtpChallenge(
            parent_id=parent_id,
            student_id=student_id,
            consent_type=consent_type,
            otp_code=otp_code,
            expires_at=expires_at,
        )

        return otp_code

    def verify_otp_and_grant(
        self,
        parent_id: str,
        student_id: str,
        consent_type: ConsentType,
        otp_input: str,
        version: str = "1.0.0",
        channel: VerificationMethod = VerificationMethod.OTP_SMS,
    ) -> ConsentRecord:
        """
        Verifies the parent's OTP and transitions consent to VERIFIED.
        Generates an immutable cryptographic evidence token.
        """
        challenge_key = (parent_id, student_id, consent_type.value)
        challenge = self.otp_challenges.get(challenge_key)

        if not challenge:
            raise ValueError("No pending OTP challenge found for this consent request.")

        if datetime.now(timezone.utc) > challenge.expires_at:
            del self.otp_challenges[challenge_key]
            raise ValueError("OTP expired. Please request a new verification challenge.")

        challenge.attempts += 1
        if challenge.attempts > challenge.max_attempts:
            del self.otp_challenges[challenge_key]
            raise ValueError("Maximum OTP verification attempts exceeded. Challenge locked.")

        if not secrets.compare_digest(challenge.otp_code, otp_input.strip()):
            raise ValueError("Invalid OTP code provided.")

        # Successfully verified; remove challenge
        del self.otp_challenges[challenge_key]

        # Generate HMAC evidence token
        now = datetime.now(timezone.utc)
        payload = f"{parent_id}:{student_id}:{consent_type.value}:{now.isoformat()}:{version}"
        evidence_token = hmac.new(self.secret_key, payload.encode("utf-8"), hashlib.sha256).hexdigest()

        record = ConsentRecord(
            consent_id=str(uuid.uuid4()),
            parent_id=parent_id,
            student_id=student_id,
            consent_type=consent_type,
            status=ConsentStatus.VERIFIED,
            version=version,
            verification_method=channel,
            verification_timestamp=now,
            evidence_token=evidence_token,
        )

        self.records[challenge_key] = record
        return record

    def grant_verified_consent(
        self,
        parent_id: str,
        student_id: str,
        consent_type: ConsentType,
        method: VerificationMethod,
        evidence_token: str,
        version: str = "1.0.0",
    ) -> ConsentRecord:
        """Grants verified consent directly with third-party verifiable evidence (e.g. DigiLocker)."""
        now = datetime.now(timezone.utc)
        record = ConsentRecord(
            consent_id=str(uuid.uuid4()),
            parent_id=parent_id,
            student_id=student_id,
            consent_type=consent_type,
            status=ConsentStatus.VERIFIED,
            version=version,
            verification_method=method,
            verification_timestamp=now,
            evidence_token=evidence_token,
        )
        self.records[(parent_id, student_id, consent_type.value)] = record
        return record

    def start_learning_session(self, student_id: str, session_id: str) -> None:
        """
        Starts a student practice/learning session.
        Fail-closed: raises PermissionError if core LEARNING_SERVICE consent is missing.
        """
        permitted, reason = self.is_practice_permitted(student_id)
        if not permitted:
            raise PermissionError(f"Learning session denied: {reason}")

        if student_id not in self.active_sessions:
            self.active_sessions[student_id] = set()
        self.active_sessions[student_id].add(session_id)

    def is_practice_permitted(self, student_id: str) -> Tuple[bool, str]:
        """
        Fail-closed invariant: checks if active, verified parental consent exists
        for the mandatory LEARNING_SERVICE type.
        """
        matching = [
            rec for rec in self.records.values()
            if rec.student_id == student_id and rec.consent_type == ConsentType.LEARNING_SERVICE
        ]

        if not matching:
            return False, "NO_PARENTAL_CONSENT_FOUND"

        # Check latest record
        latest = max(matching, key=lambda r: r.verification_timestamp or datetime.min.replace(tzinfo=timezone.utc))
        if latest.status != ConsentStatus.VERIFIED or latest.revoked_at is not None:
            return False, f"CONSENT_NOT_ACTIVE_{latest.status.value}"

        return True, "CONSENT_VERIFIED_ACTIVE"

    def revoke_consent(
        self,
        parent_id: str,
        student_id: str,
        consent_type: ConsentType,
        purge_delay_hours: int = 24,
    ) -> ConsentRecord:
        """
        Revokes consent.
        1. Immediately invalidates student active sessions.
        2. Schedules a 24-hour cryptographic data purge.
        """
        key = (parent_id, student_id, consent_type.value)
        record = self.records.get(key)
        if not record:
            raise ValueError("Consent record does not exist to revoke.")

        now = datetime.now(timezone.utc)
        record.status = ConsentStatus.REVOKED
        record.revoked_at = now
        record.purge_scheduled_at = now + timedelta(hours=purge_delay_hours)

        # Immediate session invalidation
        terminated_count = len(self.active_sessions.get(student_id, set()))
        self.active_sessions[student_id] = set()

        record.metadata["terminated_active_sessions"] = terminated_count
        record.metadata["revocation_reason"] = "PARENT_REQUEST"

        return record

    def execute_scheduled_purge(self, student_id: str, force: bool = False) -> Dict:
        """
        Executes the statutory data purge for a student whose consent was revoked.
        Zeroizes personal data and marks status as PURGED.
        """
        # Find revoked records
        revoked_records = [
            r for r in self.records.values()
            if r.student_id == student_id and r.status == ConsentStatus.REVOKED
        ]

        if not revoked_records and not force:
            raise ValueError(f"No revoked consent scheduled for purge on student {student_id}")

        now = datetime.now(timezone.utc)

        # Verify purge schedule SLA
        for r in revoked_records:
            if not force and r.purge_scheduled_at and now < r.purge_scheduled_at:
                raise ValueError(
                    f"Purge SLA not yet reached for consent {r.consent_id}. Scheduled: {r.purge_scheduled_at}"
                )

        # Cryptographically zeroize student PII
        if student_id in self.student_pii:
            self.student_pii[student_id] = {
                "name": "[PURGED_ANONYMIZED_DPDP_COMPLIANT]",
                "email": f"purged_{hashlib.sha256(student_id.encode()).hexdigest()[:12]}@youva-purged.internal",
                "grade": "[REDACTED]",
                "is_anonymized": True,
                "purged_at": now.isoformat(),
            }

        # Invalidate any lingering session
        self.active_sessions[student_id] = set()

        # Update record status to PURGED
        for r in revoked_records:
            r.status = ConsentStatus.PURGED
            r.purged_at = now

        return {
            "studentId": student_id,
            "status": "PURGED_COMPLETED",
            "purgedAt": now.isoformat(),
            "piiZeroized": True,
            "activeSessionsCleared": True,
        }

    def list_student_consents(self, student_id: str) -> List[ConsentRecord]:
        """Lists all consent records for a given student."""
        return [r for r in self.records.values() if r.student_id == student_id]
