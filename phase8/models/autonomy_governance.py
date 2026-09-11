"""
YOUVA-EdAI — Phase 8: Autonomy Governance Engine (P8.1 to P8.3)
Enforces:
1. Permanent Human-Only Authorization Invariants (Mastery, Consent, Roles, Safety Closure).
2. Capability Registry Verification (Unregistered or Disabled capabilities fail closed).
3. Parameterized Bounds Enforcement (Actions outside authorized step limits are blocked).
"""

from datetime import datetime, timezone
from enum import Enum
import hashlib
import json
from pathlib import Path
from typing import Any, Dict, List, Optional, Set

CATALOG_PATH = Path(__file__).resolve().parent.parent / "data" / "autonomy_governance_catalog.json"


class AgentAction(str, Enum):
    # Permitted low-risk autonomous actions
    GENERATE_HINT = "GENERATE_HINT"
    DISCLOSE_HINT_TIER = "DISCLOSE_HINT_TIER"
    RECOMMEND_ACTIVITY = "RECOMMEND_ACTIVITY"
    ADJUST_DIFFICULTY = "ADJUST_DIFFICULTY"

    # Supervised actions (Human approval required)
    ASSIGN_CONTENT = "ASSIGN_CONTENT"
    RESCHEDULE_ACTIVITY = "RESCHEDULE_ACTIVITY"

    # Strictly prohibited consequential actions (Permanent Human-Only Invariants)
    MODIFY_MASTERY = "MODIFY_MASTERY"
    MODIFY_CONSENT = "MODIFY_CONSENT"
    MODIFY_ROLE = "MODIFY_ROLE"
    CLOSE_SAFETY_CASE = "CLOSE_SAFETY_CASE"
    DELETE_LEARNER = "DELETE_LEARNER"
    CHANGE_BILLING = "CHANGE_BILLING"


class RiskTier(str, Enum):
    AUTO_LOW_RISK = "AUTO_LOW_RISK"
    HUMAN_APPROVAL = "HUMAN_APPROVAL"
    BLOCKED = "BLOCKED"


class AutonomyActionViolationError(PermissionError):
    """Base exception for autonomy policy breaches."""
    pass


class HumanAuthorizationRequiredError(AutonomyActionViolationError):
    """Raised when an automated system attempts an action reserved permanently for human authority."""
    pass


class CapabilityNotRegisteredError(AutonomyActionViolationError):
    """Raised when an AI action targets an unregistered capability."""
    pass


class CapabilityDisabledError(AutonomyActionViolationError):
    """Raised when an AI action targets a disabled or rolled-back capability."""
    pass


class ActionOutOfBoundsError(AutonomyActionViolationError):
    """Raised when an action parameter exceeds permitted pedagogical bounds."""
    pass


class AutonomyGovernanceEngine:
    """
    Evaluates and enforces autonomous action policies.
    Guarantees that AI remains within bounded pedagogical scaffolding.
    """

    PROHIBITED_HUMAN_ONLY_ACTIONS: Set[AgentAction] = {
        AgentAction.MODIFY_MASTERY,
        AgentAction.MODIFY_CONSENT,
        AgentAction.MODIFY_ROLE,
        AgentAction.CLOSE_SAFETY_CASE,
        AgentAction.DELETE_LEARNER,
        AgentAction.CHANGE_BILLING,
    }

    def __init__(self, catalog_path: Optional[Path] = None):
        self.catalog_path = catalog_path or CATALOG_PATH
        self._capabilities: Dict[str, Dict[str, Any]] = {}
        self.load_catalog()

    def load_catalog(self) -> None:
        if self.catalog_path.exists():
            with open(self.catalog_path, "r", encoding="utf-8") as f:
                data = json.load(f)
                for cap in data.get("capabilities", []):
                    self._capabilities[cap["capabilityId"]] = cap

    def register_capability(self, capability: Dict[str, Any]) -> None:
        cap_id = capability["capabilityId"]
        self._capabilities[cap_id] = capability

    def evaluate_action(
        self,
        capability_id: str,
        action: AgentAction | str,
        params: Dict[str, Any],
        is_ai_actor: bool = True
    ) -> Dict[str, Any]:
        """
        Evaluates an intended autonomous action against governance rules.
        Fails closed on any policy breach.
        """
        action_enum = AgentAction(action) if isinstance(action, str) else action

        # Invariant 1: Consequential actions are strictly human-only
        if is_ai_actor and action_enum in self.PROHIBITED_HUMAN_ONLY_ACTIONS:
            raise HumanAuthorizationRequiredError(
                f"CRITICAL INVARIANT VIOLATION: AI is strictly prohibited from executing [{action_enum.value}]. "
                "This action is permanently reserved for authorized human personnel."
            )

        # Invariant 2: Capability must be registered in the catalog
        if capability_id not in self._capabilities:
            raise CapabilityNotRegisteredError(
                f"Autonomous capability [{capability_id}] is not registered in the governance catalog."
            )

        cap = self._capabilities[capability_id]

        # Invariant 3: Capability must be ACTIVE
        if cap.get("status") != "ACTIVE":
            raise CapabilityDisabledError(
                f"Capability [{capability_id}] is {cap.get('status')}. Autonomous execution denied."
            )

        # Invariant 4: Action must be explicitly allowed for this capability
        bounds = cap.get("bounds", {})
        allowed_actions = bounds.get("allowedActions", [])
        if action_enum.value not in allowed_actions:
            raise ActionOutOfBoundsError(
                f"Action [{action_enum.value}] is not in allowed actions {allowed_actions} for capability [{capability_id}]."
            )

        # Invariant 5: Parameterized step bounds
        max_step = bounds.get("maxStepSize", 1.0)
        requested_step = abs(float(params.get("stepSize", 1.0)))
        if requested_step > max_step:
            raise ActionOutOfBoundsError(
                f"Requested step size ({requested_step}) exceeds maximum allowed bound ({max_step}) for [{capability_id}]."
            )

        canonical_input = json.dumps({"cap": capability_id, "action": action_enum.value, "params": params}, sort_keys=True)
        decision_hash = hashlib.sha256(canonical_input.encode("utf-8")).hexdigest()

        return {
            "authorized": True,
            "capabilityId": capability_id,
            "action": action_enum.value,
            "riskLevel": cap.get("riskLevel", RiskTier.AUTO_LOW_RISK.value),
            "decisionHash": decision_hash,
            "evaluatedAt": datetime.now(timezone.utc).isoformat()
        }
