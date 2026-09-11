"""
YOUVA-EdAI — Phase 9: Multi-Jurisdiction Compliance & Dynamic Routing Engine
Enforces:
- Dynamic jurisdiction resolution with fail-closed default fallback (India DPDP 2023).
- Draft jurisdiction isolation: draft/unapproved profiles cannot be routed for live sessions.
- Conflict Resolution Invariant: Strictest Rule On Mismatch (max age threshold, min purge SLA).
- Active jurisdiction compliance verification (legal & child safety sign-offs).
- Cross-border data transfer barrier.
"""

from dataclasses import dataclass
import json
from pathlib import Path
from typing import Any, Dict, List, Optional
from jsonschema import validate as json_validate, ValidationError as JsonSchemaValidationError


class JurisdictionRoutingError(Exception):
    """Raised when jurisdiction routing fails or policy is violated."""
    pass


@dataclass
class JurisdictionMismatchResolution:
    """Resolved parameters when tenant and user jurisdictions conflict."""
    jurisdictions: List[str]
    effective_child_age_threshold: int
    effective_withdrawal_purge_sla_hours: int
    effective_safety_escalation_sla_hours: int
    cross_border_transfer_allowed: bool
    allow_anonymized_research_telemetry: bool
    rationale: str


class JurisdictionEngine:
    """Production runtime engine for multi-jurisdiction compliance and routing."""

    DEFAULT_GEO_MAPPING = {
        "IN": "in-dpdp",
        "IND": "in-dpdp",
        "US": "us-coppa-ferpa",
        "USA": "us-coppa-ferpa",
        "EU": "eu-gdpr",
        "DE": "eu-gdpr",
        "FR": "eu-gdpr",
        "NL": "eu-gdpr",
        "GB": "eu-gdpr",
    }

    def __init__(self, jurisdictions_dir: Optional[Path] = None):
        if jurisdictions_dir is None:
            jurisdictions_dir = Path(__file__).resolve().parents[1] / "jurisdictions"
        self.jurisdictions_dir = jurisdictions_dir
        self.schema_file = self.jurisdictions_dir / "jurisdiction.schema.json"
        self.registry_file = self.jurisdictions_dir / "registry.json"

        self.schema = self._load_json(self.schema_file)
        self.registry_data = self._load_json(self.registry_file)
        self.registry = self.registry_data.get("registry", {})
        self.default_jurisdiction = self.registry.get("defaultJurisdiction", "in-dpdp")
        self.routing_rules = self.registry.get("routingRules", {})
        self.profiles: Dict[str, dict] = {}
        self._load_profiles()

    def _load_json(self, path: Path) -> dict:
        if not path.exists():
            raise FileNotFoundError(f"Jurisdiction file not found: {path}")
        with path.open("r", encoding="utf-8") as f:
            return json.load(f)

    def _load_profiles(self) -> None:
        supported = self.registry.get("supportedJurisdictions", [])
        for entry in supported:
            jur_id = entry.get("id")
            filename = entry.get("file")
            file_path = self.jurisdictions_dir / filename
            profile = self._load_json(file_path)
            self.profiles[jur_id] = profile

    def get_profile(self, jurisdiction_id: str) -> dict:
        if jurisdiction_id not in self.profiles:
            raise JurisdictionRoutingError(f"Jurisdiction '{jurisdiction_id}' not found in registry")
        return self.profiles[jurisdiction_id]

    def is_jurisdiction_active(self, jurisdiction_id: str) -> bool:
        if jurisdiction_id not in self.profiles:
            return False
        profile = self.profiles[jurisdiction_id]
        if profile.get("status") != "active":
            return False
        legal = profile.get("legalReview", {})
        safety = profile.get("childSafetyReview", {})
        return bool(legal.get("approved") and safety.get("approved"))

    def resolve_jurisdiction(
        self,
        geo_country: Optional[str] = None,
        tenant_override: Optional[str] = None,
        requested_id: Optional[str] = None,
    ) -> str:
        """
        Dynamically resolves the active jurisdiction profile.
        Prioritizes: tenant override (if allowed) -> geo country -> requested_id -> failover default.
        Always enforces fail-closed fallback to active default jurisdiction.
        """
        target_id: Optional[str] = None

        # 1. Check tenant override if permitted
        if tenant_override and self.routing_rules.get("tenantOverrideAllowed", True):
            target_id = tenant_override

        # 2. Check geo country mapping if no override
        elif geo_country:
            code = geo_country.strip().upper()
            target_id = self.DEFAULT_GEO_MAPPING.get(code)

        # 3. Check requested ID directly
        elif requested_id:
            target_id = requested_id

        # 4. Fallback if no target determined
        if not target_id:
            target_id = self.default_jurisdiction

        # 5. Fail-closed check: draft or unapproved jurisdictions cannot serve live traffic
        if not self.is_jurisdiction_active(target_id):
            failover = self.routing_rules.get("failoverJurisdiction", self.default_jurisdiction)
            return failover

        return target_id

    def resolve_conflicting_jurisdictions(
        self,
        jurisdiction_ids: List[str]
    ) -> JurisdictionMismatchResolution:
        """
        Resolves conflicts across multiple jurisdictions (e.g. cross-border user in local tenant).
        Enforces Strictest Rule On Mismatch:
        - Max child age threshold
        - Min withdrawal purge SLA hours
        - Min safety escalation SLA hours
        - Cross-border transfer must be permitted by ALL to be True
        - Research telemetry must be permitted by ALL to be True
        """
        if not jurisdiction_ids:
            jurisdiction_ids = [self.default_jurisdiction]

        profiles = []
        for jid in jurisdiction_ids:
            # Fall back to default if unrecognized
            effective_id = jid if jid in self.profiles else self.default_jurisdiction
            profiles.append(self.profiles[effective_id])

        age_thresholds = [p.get("minimumAgeRules", {}).get("childAgeThreshold", 18) for p in profiles]
        purge_slas = [p.get("consentRules", {}).get("withdrawalPurgeSLAHours", 24) for p in profiles]
        safety_slas = [p.get("safetyEscalationSLAHours", 4) for p in profiles]
        cross_border = [p.get("crossBorderTransferAllowed", False) for p in profiles]
        telemetry = [p.get("retentionRules", {}).get("allowAnonymizedResearchTelemetry", False) for p in profiles]

        effective_age = max(age_thresholds)
        effective_purge = min(purge_slas)
        effective_safety = min(safety_slas)
        effective_cross_border = all(cross_border)
        effective_telemetry = all(telemetry)

        rationale = (
            f"Resolved conflict among {jurisdiction_ids} via Strictest Rule Invariant: "
            f"age={effective_age}y (max), purge={effective_purge}h (min), "
            f"safety_sla={effective_safety}h (min), cross_border={effective_cross_border} (unanimous)."
        )

        return JurisdictionMismatchResolution(
            jurisdictions=jurisdiction_ids,
            effective_child_age_threshold=effective_age,
            effective_withdrawal_purge_sla_hours=effective_purge,
            effective_safety_escalation_sla_hours=effective_safety,
            cross_border_transfer_allowed=effective_cross_border,
            allow_anonymized_research_telemetry=effective_telemetry,
            rationale=rationale,
        )

    def validate_data_transfer(
        self,
        jurisdiction_id: str,
        destination_region: str,
        origin_region: str = "IN"
    ) -> bool:
        """Enforces cross-border data transfer policies."""
        if origin_region.upper() == destination_region.upper():
            return True
        profile = self.get_profile(jurisdiction_id)
        if not profile.get("crossBorderTransferAllowed", False):
            raise JurisdictionRoutingError(
                f"Cross-border transfer from '{origin_region}' to '{destination_region}' "
                f"strictly prohibited under jurisdiction '{jurisdiction_id}'"
            )
        return True
