"""
YOUVA-EdAI — Phase 8: Immutable Governance Ledger (P8.8)
Maintains a permanent, tamper-evident cryptographic record of all
autonomous capability registrations, evaluations, drift rollbacks, and actions.
"""

from datetime import datetime, timezone
import hashlib
import hmac
import json
from typing import Any, Dict, List, Optional, Tuple

DEFAULT_SECRET = b"youva-phase8-autonomy-governance-salt"


class GovernanceLedger:
    """
    Append-only cryptographic ledger tracking autonomous AI lifecycle events.
    """

    def __init__(self, secret_key: bytes = DEFAULT_SECRET):
        self.secret = secret_key
        # list of ledger entries
        self._entries: List[Dict[str, Any]] = []

    def _hash_entry(self, entry_id: str, event_type: str, payload_json: str, timestamp: str, prev_hash: str) -> str:
        msg = f"{entry_id}|{event_type}|{payload_json}|{timestamp}|{prev_hash}"
        return hmac.new(self.secret, msg.encode("utf-8"), hashlib.sha256).hexdigest()

    def record_event(
        self,
        entry_id: str,
        event_type: str,
        payload: Dict[str, Any],
        actor_id: str = "AUTONOMOUS_GOVERNANCE_SYSTEM"
    ) -> Dict[str, Any]:
        """Appends an event to the chained governance ledger."""
        now_iso = datetime.now(timezone.utc).isoformat()
        payload_canonical = json.dumps(payload, sort_keys=True)
        prev_hash = self._entries[-1]["entryHash"] if self._entries else "0" * 64

        entry_hash = self._hash_entry(
            entry_id=entry_id,
            event_type=event_type,
            payload_json=payload_canonical,
            timestamp=now_iso,
            prev_hash=prev_hash
        )

        entry = {
            "entryId": entry_id,
            "eventType": event_type,
            "actorId": actor_id,
            "payload": dict(payload),
            "timestamp": now_iso,
            "prevHash": prev_hash,
            "entryHash": entry_hash
        }

        self._entries.append(entry)
        return entry

    def verify_chain_integrity(self) -> Tuple[bool, Optional[str]]:
        expected_prev = "0" * 64
        for idx, entry in enumerate(self._entries):
            if entry["prevHash"] != expected_prev:
                return False, f"Broken link at index {idx} ({entry['entryId']})"

            payload_canonical = json.dumps(entry["payload"], sort_keys=True)
            recalculated = self._hash_entry(
                entry_id=entry["entryId"],
                event_type=entry["eventType"],
                payload_json=payload_canonical,
                timestamp=entry["timestamp"],
                prev_hash=entry["prevHash"]
            )

            if recalculated != entry["entryHash"]:
                return False, f"Tamper detected at index {idx} ({entry['entryId']})"

            expected_prev = entry["entryHash"]

        return True, None

    def get_events_for_capability(self, capability_id: str) -> List[Dict[str, Any]]:
        return [
            e for e in self._entries
            if e["payload"].get("capabilityId") == capability_id
        ]

    def count(self) -> int:
        return len(self._entries)
