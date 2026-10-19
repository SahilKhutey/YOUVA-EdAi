"""
YOUVA-EdAI — Phase 7: Operational Audit Ledger (P7.6)
Extends the Phase 2 tamper-evident HMAC-SHA256 audit ledger across all scale operations:
tenant lifecycle, license allocation, LMS integration, teacher approvals, and safety escalations.
"""

from datetime import datetime, timezone
import hashlib
import hmac
import json
from typing import Any, Dict, List, Optional, Tuple

DEFAULT_SECRET = b"youva-phase7-operational-audit-secret-key-salt"


class OperationalAuditLedger:
    """
    Append-only cryptographically chained operational audit log.
    Ensures every critical scale infrastructure action is permanently tamper-evident.
    """

    def __init__(self, hmac_secret: bytes = DEFAULT_SECRET):
        self.secret = hmac_secret
        # list of audit entry dicts in chronological order
        self._chain: List[Dict[str, Any]] = []

    def _compute_hash(
        self,
        entry_id: str,
        tenant_id: str,
        event_type: str,
        actor_id: str,
        payload_canonical: str,
        timestamp: str,
        prev_hash: str
    ) -> str:
        message = f"{entry_id}|{tenant_id}|{event_type}|{actor_id}|{payload_canonical}|{timestamp}|{prev_hash}"
        return hmac.new(self.secret, message.encode("utf-8"), hashlib.sha256).hexdigest()

    def append_event(
        self,
        entry_id: str,
        tenant_id: str,
        event_type: str,
        actor_id: str,
        payload: Dict[str, Any],
        timestamp: Optional[str] = None
    ) -> Dict[str, Any]:
        """Appends a new audit record to the chained ledger."""
        now_iso = timestamp or datetime.now(timezone.utc).isoformat()
        payload_canonical = json.dumps(payload, sort_keys=True)

        prev_hash = self._chain[-1]["entryHash"] if self._chain else "0" * 64
        entry_hash = self._compute_hash(
            entry_id=entry_id,
            tenant_id=tenant_id,
            event_type=event_type,
            actor_id=actor_id,
            payload_canonical=payload_canonical,
            timestamp=now_iso,
            prev_hash=prev_hash
        )

        entry = {
            "entryId": entry_id,
            "tenantId": tenant_id,
            "eventType": event_type,
            "actorId": actor_id,
            "payload": dict(payload),
            "timestamp": now_iso,
            "prevHash": prev_hash,
            "entryHash": entry_hash
        }

        self._chain.append(entry)
        return entry

    def verify_chain_integrity(self) -> Tuple[bool, Optional[str]]:
        """
        Verifies that every hash link in the chain is valid and uncorrupted.
        Returns (True, None) if intact, or (False, error_message) on violation.
        """
        expected_prev = "0" * 64

        for idx, entry in enumerate(self._chain):
            if entry["prevHash"] != expected_prev:
                return False, f"Broken link at index {idx} ({entry['entryId']}): prevHash does not match previous entryHash"

            payload_canonical = json.dumps(entry["payload"], sort_keys=True)
            recalculated = self._compute_hash(
                entry_id=entry["entryId"],
                tenant_id=entry["tenantId"],
                event_type=entry["eventType"],
                actor_id=entry["actorId"],
                payload_canonical=payload_canonical,
                timestamp=entry["timestamp"],
                prev_hash=entry["prevHash"]
            )

            if recalculated != entry["entryHash"]:
                return False, f"Tampering detected at index {idx} ({entry['entryId']}): recalculate hash mismatch"

            expected_prev = entry["entryHash"]

        return True, None

    def get_tenant_events(self, tenant_id: str) -> List[Dict[str, Any]]:
        """Returns all audit events strictly filtered to a specific tenant."""
        return [e for e in self._chain if e["tenantId"] == tenant_id]

    def count(self) -> int:
        """Returns total entries in ledger."""
        return len(self._chain)
