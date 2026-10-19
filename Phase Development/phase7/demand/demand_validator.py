"""
YOUVA-EdAI — Phase 7: Demand Validator (P7.1)
Enforces fail-closed demand gating: enterprise scale infrastructure (multi-tenancy,
LMS/SIS adapters, seat provisioning) refuses activation without a verified,
signed institutional contract meeting minimum thresholds.
"""

from datetime import datetime, timezone
import hashlib
import json
from pathlib import Path
from typing import Any, Dict, Optional
import jsonschema

SCHEMA_PATH = Path(__file__).resolve().parent.parent / "schemas" / "demand_contract.schema.json"


class DemandValidationError(Exception):
    """Raised when demand validation fails or contract does not meet scale criteria."""
    pass


class DemandValidator:
    """Validates institutional demand contracts against formal criteria."""

    def __init__(self, schema_path: Optional[Path] = None):
        self.schema_path = schema_path or SCHEMA_PATH
        with open(self.schema_path, "r", encoding="utf-8") as f:
            self.schema = json.load(f)

    def validate_contract(
        self,
        contract: Dict[str, Any],
        now: Optional[datetime] = None
    ) -> Dict[str, Any]:
        """
        Validates contract against schema and business rules.
        Returns validation result dictionary with cryptographic seal.
        Raises DemandValidationError if invalid (fail closed).
        """
        if not isinstance(contract, dict):
            raise DemandValidationError("Contract must be a valid dictionary/JSON object")

        # 1. JSON Schema validation
        try:
            jsonschema.validate(instance=contract, schema=self.schema)
        except jsonschema.ValidationError as e:
            raise DemandValidationError(f"Contract failed schema validation: {e.message}") from e

        # 2. Minimum committed seats (>= 50)
        seats = contract.get("minCommittedSeats", 0)
        if seats < 50:
            raise DemandValidationError(
                f"Contract committed seats ({seats}) below institutional threshold (minimum 50)"
            )

        # 3. Status must be ACTIVE or SIGNED
        status = contract.get("status")
        if status not in ("ACTIVE", "SIGNED"):
            raise DemandValidationError(
                f"Contract status must be ACTIVE or SIGNED to activate scale infrastructure (current: '{status}')"
            )

        # 4. Validity date range check
        current_dt = now or datetime.now(timezone.utc)
        try:
            valid_from = datetime.fromisoformat(contract["validFrom"].replace("Z", "+00:00"))
            valid_until = datetime.fromisoformat(contract["validUntil"].replace("Z", "+00:00"))
        except (ValueError, KeyError) as e:
            raise DemandValidationError(f"Invalid date format in contract validity: {e}") from e

        if current_dt < valid_from:
            raise DemandValidationError(
                f"Contract validity period has not started yet (validFrom: {contract['validFrom']})"
            )
        if current_dt > valid_until:
            raise DemandValidationError(
                f"Contract has expired (validUntil: {contract['validUntil']})"
            )

        # 5. Signer requirement
        signers = contract.get("authorizedSigners", [])
        if not signers or len(signers) < 1:
            raise DemandValidationError("At least one authorized institutional signer is required")

        for s in signers:
            if not s.get("name") or not s.get("role") or not s.get("signedAt"):
                raise DemandValidationError("Incomplete authorized signer information")

        # 6. SLA requirement (>= 99.9%)
        sla = contract.get("slaUptimePercent", 0.0)
        if sla < 99.9:
            raise DemandValidationError(
                f"Contract SLA ({sla}%) does not meet scale infrastructure requirement (minimum 99.9%)"
            )

        # 7. Generate cryptographic verification seal
        contract_canonical = json.dumps(contract, sort_keys=True)
        seal = hashlib.sha256(contract_canonical.encode("utf-8")).hexdigest()

        return {
            "valid": True,
            "contractId": contract["contractId"],
            "tenantId": contract["tenantId"],
            "institutionName": contract["institutionName"],
            "committedSeats": seats,
            "status": status,
            "slaUptimePercent": sla,
            "jurisdiction": contract["jurisdiction"],
            "verificationSeal": seal,
            "verifiedAt": current_dt.isoformat()
        }

    def assert_demand_satisfied(self, contract: Dict[str, Any], now: Optional[datetime] = None) -> None:
        """Helper that executes validate_contract and raises DemandValidationError on failure."""
        self.validate_contract(contract, now=now)

    def is_host_allowed(self, contract: Dict[str, Any], hostname: str) -> bool:
        """Checks if a given hostname is in the contract's allowed LMS host list."""
        if not hostname:
            return False
        allowed = contract.get("allowedLmsHosts", [])
        normalized = hostname.lower().strip()
        return normalized in [h.lower().strip() for h in allowed]
