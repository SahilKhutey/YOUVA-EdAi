"""
Tests for Final Phase SystemsIntegrationEngine:
- Whole-system integration verification across all roadmap phases (Phase 0 to Final Phase).
- Evaluation of all 12 production release conditions.
- Final GO production release authorization execution.
"""

import pytest
from pathlib import Path
from final_phase.models.systems_integration_engine import (
    SystemsIntegrationEngine,
    ReleaseConditionViolationError,
)

ROOT = Path(__file__).resolve().parents[2]


@pytest.fixture
def integration_engine():
    return SystemsIntegrationEngine(ROOT)


def test_all_phases_integrated_and_verified(integration_engine):
    """Every phase from Phase 0 to Final Phase has verified evidence artifacts present."""
    statuses = integration_engine.verify_all_phases_integrated()
    assert len(statuses) == 11  # Phase 0 through Phase 9 plus Final Phase
    for s in statuses:
        assert s.is_verified is True, f"Phase '{s.phase_name}' missing evidence: {s.evidence_path}"
        assert len(s.invariants_enforced) > 0


def test_evaluate_release_conditions_all_pass(integration_engine):
    """All 12 mandatory release conditions evaluate to PASS."""
    result = integration_engine.evaluate_release_conditions()
    assert result.decision == "GO"
    assert result.total_conditions == 12
    assert result.passed_conditions == 12
    assert len(result.mandatory_violations) == 0
    assert result.release_authorized is True


def test_execute_release_authorization_succeeds(integration_engine):
    """Whole-system release authorization completes with GO decision."""
    auth = integration_engine.execute_release_authorization()
    assert auth["decision"] == "GO"
    assert auth["authorizationStatus"] == "PRODUCTION_RELEASE_AUTHORIZED"
    assert auth["phasesIntegrated"] == 11
    assert auth["releaseConditionsPassed"] == 12


def test_release_authorization_fails_if_mandatory_condition_fails(integration_engine):
    """If any mandatory condition fails, execute_release_authorization raises error."""
    tampered_cfg = dict(integration_engine.release_config)
    tampered_cfg["releaseConditions"] = [dict(c) for c in tampered_cfg["releaseConditions"]]
    tampered_cfg["releaseConditions"][0]["status"] = "FAIL"
    integration_engine.release_config = tampered_cfg

    with pytest.raises(ReleaseConditionViolationError, match="Production Release Denied"):
        integration_engine.execute_release_authorization()
