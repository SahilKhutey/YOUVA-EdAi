"""
YOUVA-EdAI — Tamper-Evident HMAC-SHA256 Audit Ledger.
Provides cryptographic forward hash chaining for all privileged, consent,
and safety actions, ensuring complete non-repudiation and immediate tamper detection.
"""

from __future__ import annotations
from dataclasses import dataclass, field
from datetime import datetime, timezone
import hashlib
import hmac
import json
from typing import Dict, List, Optional, Tuple
import uuid


GENESIS_HASH = "0" * 64


@dataclass
class AuditEntry:
    sequence: int
    event_id: str
    timestamp: datetime
    actor_id: str
    actor_role: str
    action: str
    resource: str
    resource_id: Optional[str]
    outcome: str
    metadata: Dict
    previous_hash: str
    entry_hash: str

    def to_dict(self) -> dict:
        return {
            "sequence": self.sequence,
            "eventId": self.event_id,
            "timestamp": self.timestamp.isoformat(),
            "actorId": self.actor_id,
            "actorRole": self.actor_role,
            "action": self.action,
            "resource": self.resource,
            "resourceId": self.resource_id,
            "outcome": self.outcome,
            "metadata": self.metadata,
            "previousHash": self.previous_hash,
            "entryHash": self.entry_hash,
        }


class AuditLedger:
    """
    Cryptographically chained append-only audit ledger.
    Every event binds to the hash of the preceding event using HMAC-SHA256.
    """

    def __init__(self, secret_key: str = "youva-edai-audit-ledger-hmac-key-2026"):
        self.secret_key = secret_key.encode("utf-8")
        self.entries: List[AuditEntry] = []

    def compute_hash(
        self,
        sequence: int,
        event_id: str,
        timestamp_iso: str,
        actor_id: str,
        actor_role: str,
        action: str,
        resource: str,
        resource_id: Optional[str],
        outcome: str,
        metadata: Dict,
        previous_hash: str,
    ) -> str:
        """
        Computes deterministic HMAC-SHA256 digest over canonicalized event attributes.
        """
        canonical_metadata = json.dumps(metadata, sort_keys=True, separators=(",", ":"))
        canonical_payload = (
            f"{sequence}|{event_id}|{timestamp_iso}|{actor_id}|{actor_role}|"
            f"{action}|{resource}|{resource_id or ''}|{outcome}|{canonical_metadata}|{previous_hash}"
        )
        return hmac.new(self.secret_key, canonical_payload.encode("utf-8"), hashlib.sha256).hexdigest()

    def append_event(
        self,
        actor_id: str,
        actor_role: str,
        action: str,
        resource: str,
        outcome: str = "SUCCESS",
        resource_id: Optional[str] = None,
        metadata: Optional[Dict] = None,
        timestamp: Optional[datetime] = None,
    ) -> AuditEntry:
        """
        Appends a new event to the ledger, cryptographically linking to the previous entry.
        """
        seq = len(self.entries)
        event_id = f"aud-{uuid.uuid4().hex[:12]}"
        ts = timestamp or datetime.now(timezone.utc)
        meta = metadata or {}

        previous_hash = self.entries[-1].entry_hash if self.entries else GENESIS_HASH

        entry_hash = self.compute_hash(
            sequence=seq,
            event_id=event_id,
            timestamp_iso=ts.isoformat(),
            actor_id=actor_id,
            actor_role=actor_role,
            action=action,
            resource=resource,
            resource_id=resource_id,
            outcome=outcome,
            metadata=meta,
            previous_hash=previous_hash,
        )

        entry = AuditEntry(
            sequence=seq,
            event_id=event_id,
            timestamp=ts,
            actor_id=actor_id,
            actor_role=actor_role,
            action=action,
            resource=resource,
            resource_id=resource_id,
            outcome=outcome,
            metadata=meta,
            previous_hash=previous_hash,
            entry_hash=entry_hash,
        )

        self.entries.append(entry)
        return entry

    def verify_chain_integrity(self) -> Tuple[bool, Optional[str], Optional[int]]:
        """
        Verifies the cryptographic continuity and HMAC validity of the entire audit chain.
        Returns:
            (is_valid: bool, error_description: Optional[str], corrupted_sequence: Optional[int])
        """
        if not self.entries:
            return True, None, None

        for idx, entry in enumerate(self.entries):
            # 1. Sequence numbering check
            if entry.sequence != idx:
                return False, f"Sequence discontinuity at index {idx}: expected {idx}, got {entry.sequence}", idx

            # 2. Previous hash pointer check
            expected_prev_hash = self.entries[idx - 1].entry_hash if idx > 0 else GENESIS_HASH
            if entry.previous_hash != expected_prev_hash:
                return (
                    False,
                    f"Broken hash pointer at sequence {idx}: expected {expected_prev_hash}, got {entry.previous_hash}",
                    idx,
                )

            # 3. Cryptographic HMAC recalculation
            recomputed_hash = self.compute_hash(
                sequence=entry.sequence,
                event_id=entry.event_id,
                timestamp_iso=entry.timestamp.isoformat(),
                actor_id=entry.actor_id,
                actor_role=entry.actor_role,
                action=entry.action,
                resource=entry.resource,
                resource_id=entry.resource_id,
                outcome=entry.outcome,
                metadata=entry.metadata,
                previous_hash=entry.previous_hash,
            )

            if not hmac.compare_digest(entry.entry_hash, recomputed_hash):
                return (
                    False,
                    f"Tampered entry detected at sequence {idx}: hash {entry.entry_hash} does not match computed {recomputed_hash}",
                    idx,
                )

        return True, None, None

    def get_entries(self) -> List[AuditEntry]:
        return list(self.entries)
