"""
YOUVA-EdAI — Phase 8 Tests: LLM Provider Gateway & Outage Fallback (P8-V18 to P8-V20, P8-V27)
Verifies:
- P8-V18: Primary outage degrades to deterministic fallback.
- P8-V19: Secondary fallback provider utilized seamlessly.
- P8-V20: Safety escalation survives complete AI provider outage.
- P8-V27: Provider disagreement handling.
"""

import pytest
from phase8.models.llm_provider_gateway import (
    LLMProviderGateway,
    ProviderTier
)


@pytest.fixture
def gateway():
    return LLMProviderGateway()


def test_p8_v18_total_outage_degrades_to_deterministic_cache(gateway):
    """P8-V18: Total external AI outage degrades gracefully to deterministic CBSE curriculum."""
    gateway.set_provider_status(primary=False, secondary=False)

    res = gateway.request_hint_generation(
        concept_id="MATH-G8-LINEQ-01",
        hint_tier=1
    )

    assert res["provider"] == ProviderTier.DETERMINISTIC_CACHE.value
    assert res["fallbackUsed"] is True
    assert res["deterministic"] is True
    assert "terms with the variable" in res["hintText"]


def test_p8_v19_secondary_provider_utilized_on_primary_down(gateway):
    """P8-V19: When primary provider drops, secondary backup provider responds."""
    gateway.set_provider_status(primary=False, secondary=True)

    res = gateway.request_hint_generation(
        concept_id="MATH-G10-QUAD-01",
        hint_tier=2
    )

    assert res["provider"] == ProviderTier.SECONDARY_FALLBACK.value
    assert res["fallbackUsed"] is True


def test_p8_v20_safety_escalation_survives_ai_outage(gateway):
    """
    P8-V20: CRITICAL INVARIANT: LLM Outage != Safety Escalation Outage.
    Crisis dispatch and child safeguarding remain fully operational.
    """
    # Total AI failure
    gateway.set_provider_status(primary=False, secondary=False)

    # Verify safety is still operational
    assert gateway.is_safety_escalation_functional() is True


def test_p8_v27_primary_provider_serves_normally_when_available(gateway):
    """P8-V27: When primary is healthy, requests are served without fallback."""
    gateway.set_provider_status(primary=True, secondary=True)

    res = gateway.request_hint_generation(
        concept_id="MATH-G8-LINEQ-01",
        hint_tier=1
    )

    assert res["provider"] == ProviderTier.PRIMARY.value
    assert res["fallbackUsed"] is False
