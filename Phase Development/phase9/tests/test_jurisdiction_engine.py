"""
Tests for Phase 9 JurisdictionEngine:
- Dynamic resolution by country code and tenant override.
- Fallback to in-dpdp when jurisdiction is unknown or draft.
- Strictest Rule On Mismatch invariant (max age, min purge SLA, cross-border prohibition).
- Cross-border data transfer enforcement.
"""

import pytest
from pathlib import Path
from phase9.models.jurisdiction_engine import (
    JurisdictionEngine,
    JurisdictionRoutingError,
)

BASE = Path(__file__).resolve().parents[1]


@pytest.fixture
def engine():
    return JurisdictionEngine(BASE / "jurisdictions")


def test_resolve_by_country_code(engine):
    """Routing by geo country header resolves active profiles."""
    assert engine.resolve_jurisdiction(geo_country="IN") == "in-dpdp"
    assert engine.resolve_jurisdiction(geo_country="US") == "us-coppa-ferpa"


def test_draft_jurisdiction_falls_back_to_default(engine):
    """Draft jurisdiction (eu-gdpr) cannot be routed for live traffic, falls back to default."""
    resolved = engine.resolve_jurisdiction(geo_country="DE")
    assert resolved == "in-dpdp", "Draft EU profile must fall back to failover default"
    resolved_direct = engine.resolve_jurisdiction(requested_id="eu-gdpr")
    assert resolved_direct == "in-dpdp"


def test_tenant_override_respected(engine):
    """Tenant override routes to requested profile if valid and active."""
    resolved = engine.resolve_jurisdiction(geo_country="IN", tenant_override="us-coppa-ferpa")
    assert resolved == "us-coppa-ferpa"


def test_conflict_resolution_strictest_rule(engine):
    """When tenant and student jurisdictions conflict, strictest rule applies."""
    resolution = engine.resolve_conflicting_jurisdictions(["in-dpdp", "us-coppa-ferpa"])
    # in-dpdp age is 18, us-coppa-ferpa is 13 -> max is 18
    assert resolution.effective_child_age_threshold == 18
    # in-dpdp purge SLA is 24h, us-coppa-ferpa is 48h -> min is 24h
    assert resolution.effective_withdrawal_purge_sla_hours == 24
    # in-dpdp safety SLA is 4h, us-coppa-ferpa is 6h -> min is 4h
    assert resolution.effective_safety_escalation_sla_hours == 4
    # cross border is False in both -> must be False
    assert resolution.cross_border_transfer_allowed is False


def test_cross_border_transfer_enforced(engine):
    """Cross-border data transfer without permission raises JurisdictionRoutingError."""
    # in-dpdp does not allow cross-border transfer
    with pytest.raises(JurisdictionRoutingError, match="Cross-border transfer"):
        engine.validate_data_transfer(jurisdiction_id="in-dpdp", destination_region="US", origin_region="IN")

    # In-region transfer is allowed
    assert engine.validate_data_transfer(jurisdiction_id="in-dpdp", destination_region="IN", origin_region="IN") is True


def test_unknown_jurisdiction_falls_back(engine):
    """Unknown jurisdiction falls back cleanly to default."""
    assert engine.resolve_jurisdiction(requested_id="antarctica-region") == "in-dpdp"
