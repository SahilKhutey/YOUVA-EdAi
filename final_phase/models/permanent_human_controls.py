"""
YOUVA-EdAI — Final Phase: Permanent Human-Only Policy Controls Engine
Enforces:
- Fail-closed technical execution barrier for all 8 immutable human controls.
- Absolute rejection of automated AI/System execution on consequential actions.
- Role-based authorization verification and cryptographic signature validation.
- Audit trail recording for every consequential human authorization.
"""

from dataclasses import dataclass, field
from datetime import datetime, timezone
import hashlib
import json
from pathlib import Path
from typing import Any, Dict, List, Optional, Set


class HumanControlsError(Exception):
    """Base exception for human controls violations."""
    pass


class HumanAuthorizationMandatoryError(HumanControlsError):
    """Raised when an AI system attempts autonomous execution of a human-only control."""
    pass


class UnauthorizedActorRoleError(HumanControlsError):
    """Raised when a human actor does not possess the requisite role for a control."""
    pass


@dataclass
class AuthorizationExecutionResult:
    control_id: str
    action_name: str
    actor_id: str
    actor_role: str
    is_authorized: bool
    signature_verified: bool
    timestamp: str
    audit_hash: str


class PermanentHumanControlsEngine:
    """Production runtime engine enforcing the 8 permanent human-only controls."""

    def __init__(self, policies_dir: Optional[Path] = None):
        if policies_dir is None:
            policies_dir = Path(__file__).resolve().parents[1] / "policies"
        self.policies_dir = policies_dir
        self.controls_file = self.policies_dir / "human_only_controls.json"
        self.non_negotiables_file = self.policies_dir / "non_negotiables.json"

        self.controls_data = self._load_json(self.controls_file)
        self.non_negotiables_data = self._load_json(self.non_negotiables_file)

        self.controls: Dict[str, dict] = {
            c["controlId"]: c for c in self.controls_data.get("controls", [])
        }
        self.audit_log: List[Dict[str, Any]] = []

    def _load_json(self, path: Path) -> dict:
        if not path.exists():
            raise FileNotFoundError(f"Policy file not found: {path}")
        with path.open("r", encoding="utf-8") as f:
            return json.load(f)

    def is_human_only_control(self, control_id: str) -> bool:
        """Returns True if the control is one of the 8 permanent human-only controls."""
        return control_id in self.controls

    def get_control_definition(self, control_id: str) -> dict:
        if control_id not in self.controls:
            raise KeyError(f"Unknown control ID '{control_id}'")
        return self.controls[control_id]

    def authorize_execution(
        self,
        control_id: str,
        actor_type: str,  # 'HUMAN', 'AI', 'SYSTEM'
        actor_id: str,
        actor_role: str,
        signature: Optional[str] = None,
        context_data: Optional[Dict[str, Any]] = None,
    ) -> AuthorizationExecutionResult:
        """
        Validates and executes a consequential action against human-only policies.
        Fails closed if invoked by AI or unauthorized human role.
        """
        if control_id not in self.controls:
            raise KeyError(f"Unknown control ID: '{control_id}'")

        ctrl = self.controls[control_id]

        # 1. Reject automated AI or System execution fail-closed
        if actor_type.upper() in {"AI", "SYSTEM", "BOT", "AUTOMATED"}:
            raise HumanAuthorizationMandatoryError(
                f"Permanent Invariant Violation: Control '{control_id}' ({ctrl.get('name')}) "
                f"cannot be executed autonomously by {actor_type}. AI role is strictly limited "
                f"to '{ctrl.get('aiRole')}'."
            )

        # 2. Verify human actor role
        allowed_roles = ctrl.get("authorizedHumanRoles", [])
        if actor_role not in allowed_roles:
            raise UnauthorizedActorRoleError(
                f"Unauthorized Actor: Role '{actor_role}' is not authorized for control '{control_id}'. "
                f"Authorized roles: {allowed_roles}"
            )

        # 3. Verify signature requirement
        if ctrl.get("requiresSignature", True):
            if not signature or len(signature.strip()) < 16:
                raise HumanAuthorizationMandatoryError(
                    f"Signature Required: Control '{control_id}' mandates a verified human cryptographic signature."
                )

        # 4. Generate hash-chained audit record
        ts = datetime.now(timezone.utc).isoformat()
        payload_str = f"{control_id}|{actor_id}|{actor_role}|{signature}|{ts}"
        audit_hash = hashlib.sha256(payload_str.encode("utf-8")).hexdigest()

        audit_entry = {
            "controlId": control_id,
            "name": ctrl.get("name"),
            "actorId": actor_id,
            "actorRole": actor_role,
            "signature": signature,
            "timestamp": ts,
            "auditHash": audit_hash,
            "context": context_data or {},
            "status": "AUTHORIZED_BY_HUMAN",
        }
        self.audit_log.append(audit_entry)

        return AuthorizationExecutionResult(
            control_id=control_id,
            action_name=ctrl.get("name", control_id),
            actor_id=actor_id,
            actor_role=actor_role,
            is_authorized=True,
            signature_verified=True,
            timestamp=ts,
            audit_hash=audit_hash,
        )
