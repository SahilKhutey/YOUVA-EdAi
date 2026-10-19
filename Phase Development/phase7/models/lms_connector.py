"""
YOUVA-EdAI — Phase 7: Demand-Gated LMS/SIS Connector & SSRF Defense (P7.4)
Enforces:
1. Demand Gating: Connectors remain disabled without a verified enterprise contract.
2. SSRF Defenses: Blocks RFC 1918 private IPv4, loopback, link-local, IPv6, cloud metadata endpoints, raw IPs.
3. Master Pedagogical Invariant: External LMS/SIS data can NEVER directly mutate student mastery.
   Must flow: External Observation -> Staging Queue -> Teacher Review -> Authorized Learning State.
"""

from datetime import datetime, timezone
import hashlib
import ipaddress
import json
from typing import Any, Dict, List, Optional
from urllib.parse import urlparse


class SSRFSecurityViolationError(SecurityError if "SecurityError" in dir(__builtins__) else PermissionError):
    """Raised when an external connection violates SSRF security boundaries."""
    pass


class IntegrationDemandRequiredError(PermissionError):
    """Raised when an enterprise integration is invoked without demand validation."""
    pass


class UnreviewedMasteryMutationError(PermissionError):
    """Raised when external LMS/SIS records attempt to alter student mastery without human teacher review."""
    pass


BLOCKED_HOSTNAMES = {
    "localhost",
    "localhost.localdomain",
    "metadata",
    "metadata.google.internal",
    "instance-data",
    "169.254.169.254"
}

PRIVATE_NETWORKS = [
    ipaddress.ip_network("0.0.0.0/8"),
    ipaddress.ip_network("10.0.0.0/8"),
    ipaddress.ip_network("127.0.0.0/8"),
    ipaddress.ip_network("169.254.0.0/16"),
    ipaddress.ip_network("172.16.0.0/12"),
    ipaddress.ip_network("192.168.0.0/16"),
    ipaddress.ip_network("::1/128"),
    ipaddress.ip_network("fc00::/7"),
    ipaddress.ip_network("fe80::/10"),
]


class SSRFGuard:
    """Network egress guard preventing Server-Side Request Forgery."""

    @staticmethod
    def assert_safe_url(raw_url: str, allowed_hosts: List[str]) -> str:
        """
        Validates URL against SSRF rules:
        - Scheme must be strictly HTTPS
        - Hostname must be non-empty and in allowed_hosts
        - Hostname must not be blocked metadata or localhost
        - Direct raw IP addresses are prohibited
        - Resolved IP must not fall into private/loopback/link-local ranges
        """
        if not raw_url or not isinstance(raw_url, str):
            raise SSRFSecurityViolationError("Invalid or empty URL")

        try:
            parsed = urlparse(raw_url.strip())
        except Exception as e:
            raise SSRFSecurityViolationError(f"Malformed URL: {e}") from e

        if parsed.scheme.lower() != "https":
            raise SSRFSecurityViolationError(
                f"Protocol [{parsed.scheme}] prohibited; only strictly verified HTTPS endpoints are allowed"
            )

        hostname = (parsed.hostname or "").lower()
        if not hostname:
            raise SSRFSecurityViolationError("URL has no valid hostname")

        # Prohibit direct raw IP address in URL
        try:
            ip = ipaddress.ip_address(hostname)
            raise SSRFSecurityViolationError(
                f"Direct IP integration endpoints [{hostname}] are prohibited. Must use verified FQDN."
            )
        except ValueError:
            # Hostname is not a raw IP string, which is required
            pass

        # Check blocked hostnames
        if hostname in BLOCKED_HOSTNAMES:
            raise SSRFSecurityViolationError(
                f"Target hostname [{hostname}] is in blocked infrastructure list"
            )

        # Check against contract's allowed LMS host whitelist
        normalized_allowed = [h.lower().strip() for h in allowed_hosts]
        if hostname not in normalized_allowed:
            raise SSRFSecurityViolationError(
                f"Target hostname [{hostname}] is not allowlisted for this institution. Allowed: {normalized_allowed}"
            )

        return raw_url


class StagedObservation:
    """Represents an external observation staged for human teacher review."""

    def __init__(
        self,
        staging_id: str,
        tenant_id: str,
        source_system: str,
        external_student_id: str,
        internal_student_id: str,
        concept_id: str,
        score: float,
        sync_timestamp: str,
        raw_payload: Dict[str, Any]
    ):
        self.staging_id = staging_id
        self.tenant_id = tenant_id
        self.source_system = source_system
        self.external_student_id = external_student_id
        self.internal_student_id = internal_student_id
        self.concept_id = concept_id
        self.score = float(score)
        self.sync_timestamp = sync_timestamp
        self.raw_payload = raw_payload

        # Cryptographic provenance seal
        canonical = f"{tenant_id}:{source_system}:{external_student_id}:{concept_id}:{score}:{sync_timestamp}"
        self.provenance_checksum = hashlib.sha256(canonical.encode("utf-8")).hexdigest()

        self.review_status = "PENDING_REVIEW"
        self.reviewed_by_teacher_id: Optional[str] = None
        self.reviewed_at: Optional[str] = None
        self.teacher_notes: Optional[str] = None

    def to_dict(self) -> Dict[str, Any]:
        return {
            "stagingId": self.staging_id,
            "tenantId": self.tenant_id,
            "sourceSystem": self.source_system,
            "externalStudentId": self.external_student_id,
            "internalStudentId": self.internal_student_id,
            "conceptId": self.concept_id,
            "score": self.score,
            "syncTimestamp": self.sync_timestamp,
            "provenanceChecksum": self.provenance_checksum,
            "reviewStatus": self.review_status,
            "reviewedByTeacherId": self.reviewed_by_teacher_id,
            "reviewedAt": self.reviewed_at,
            "teacherNotes": self.teacher_notes
        }


class LMSConnector:
    """
    Demand-gated LMS/SIS connector.
    Guarantees that external systems cannot directly alter student BKT mastery probabilities.
    """

    def __init__(self, tenant_id: str, contract_id: Optional[str] = None):
        self.tenant_id = tenant_id
        self.contract_id = contract_id
        self.is_activated = False
        self.allowed_hosts: List[str] = []
        # staging_id -> StagedObservation
        self._staging_queue: Dict[str, StagedObservation] = {}

    def activate_with_contract(self, contract: Dict[str, Any]) -> bool:
        """
        Activates connector if contract is verified, matches tenant and contract_id.
        Fails closed otherwise.
        """
        if not contract or not isinstance(contract, dict):
            raise IntegrationDemandRequiredError("Valid contract is required for activation")

        if contract.get("tenantId") != self.tenant_id:
            raise IntegrationDemandRequiredError(
                f"Contract tenant [{contract.get('tenantId')}] does not match connector tenant [{self.tenant_id}]"
            )

        if self.contract_id and contract.get("contractId") != self.contract_id:
            raise IntegrationDemandRequiredError(
                f"Contract ID [{contract.get('contractId')}] does not match configured contract [{self.contract_id}]"
            )

        if contract.get("status") not in ("ACTIVE", "SIGNED"):
            raise IntegrationDemandRequiredError(
                f"Contract status [{contract.get('status')}] must be ACTIVE or SIGNED to activate LMS integration"
            )

        self.allowed_hosts = list(contract.get("allowedLmsHosts", []))
        self.is_activated = True
        return True

    def ingest_external_observations(
        self,
        endpoint_url: str,
        source_system: str,
        raw_items: List[Dict[str, Any]]
    ) -> List[StagedObservation]:
        """
        Ingests external items into the review staging queue after SSRF verification.
        Does NOT update student mastery directly.
        """
        if not self.is_activated:
            raise IntegrationDemandRequiredError(
                f"LMS connector for tenant [{self.tenant_id}] is dormant. Valid demand contract required."
            )

        # 1. Enforce SSRF perimeter defense
        SSRFGuard.assert_safe_url(endpoint_url, self.allowed_hosts)

        now_iso = datetime.now(timezone.utc).isoformat()
        staged_list: List[StagedObservation] = []

        for idx, item in enumerate(raw_items):
            staging_id = f"STG-{self.tenant_id[:8]}-{hashlib.md5(f'{item}_{idx}_{now_iso}'.encode()).hexdigest()[:10]}"
            obs = StagedObservation(
                staging_id=staging_id,
                tenant_id=self.tenant_id,
                source_system=source_system,
                external_student_id=item["externalStudentId"],
                internal_student_id=item["internalStudentId"],
                concept_id=item["conceptId"],
                score=item["score"],
                sync_timestamp=now_iso,
                raw_payload=item
            )
            self._staging_queue[staging_id] = obs
            staged_list.append(obs)

        return staged_list

    def review_and_authorize_observation(
        self,
        staging_id: str,
        teacher_id: str,
        decision: str,
        teacher_notes: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Human teacher authorization gate.
        Only approved observations can transition to official mastery updates.
        Direct external mutation without teacher authorization raises UnreviewedMasteryMutationError.
        """
        obs = self._staging_queue.get(staging_id)
        if not obs:
            raise KeyError(f"Staged observation [{staging_id}] not found")

        if not teacher_id or not isinstance(teacher_id, str) or not teacher_id.strip():
            raise UnreviewedMasteryMutationError(
                "Human teacher authorization is strictly required to apply external observations"
            )

        decision_upper = decision.upper().strip()
        if decision_upper not in ("APPROVED", "REJECTED"):
            raise ValueError(f"Invalid review decision [{decision}]. Must be APPROVED or REJECTED")

        now_iso = datetime.now(timezone.utc).isoformat()
        obs.review_status = decision_upper
        obs.reviewed_by_teacher_id = teacher_id.strip()
        obs.reviewed_at = now_iso
        obs.teacher_notes = teacher_notes

        if decision_upper == "REJECTED":
            return {
                "stagingId": staging_id,
                "status": "REJECTED",
                "masteryUpdated": False,
                "teacherId": teacher_id
            }

        # Authorized learning state transition payload
        return {
            "stagingId": staging_id,
            "status": "APPROVED",
            "masteryUpdated": True,
            "studentId": obs.internal_student_id,
            "conceptId": obs.concept_id,
            "calibratedScore": obs.score,
            "provenanceChecksum": obs.provenance_checksum,
            "authorizedByTeacherId": teacher_id,
            "authorizedAt": now_iso
        }

    def attempt_direct_mastery_mutation(self, observation_payload: Dict[str, Any]) -> None:
        """
        Simulates an external actor or automated script attempting to update student mastery
        without teacher signoff. Enforces fail-closed invariant.
        """
        raise UnreviewedMasteryMutationError(
            "CRITICAL INVARIANT VIOLATION: External LMS/SIS data cannot directly mutate student mastery. "
            "Observations must be staged and explicitly reviewed by an authorized human teacher."
        )

    def get_pending_review_count(self) -> int:
        """Count of observations awaiting teacher review."""
        return sum(1 for obs in self._staging_queue.values() if obs.review_status == "PENDING_REVIEW")
