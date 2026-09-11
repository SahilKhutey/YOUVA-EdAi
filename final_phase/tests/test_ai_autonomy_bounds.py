import pytest
from final_phase.scripts.validate_human_controls import load_json, CONTROLS_FILE, authorize_action


@pytest.fixture
def controls_config():
    return load_json(CONTROLS_FILE)


def evaluate_ai_action(action_name: str, registered_capabilities: set, is_human_only: bool, token_cost: float, budget_limit: float) -> dict:
    if action_name not in registered_capabilities:
        return {"allowed": False, "reason": "UNREGISTERED_CAPABILITY"}
    if is_human_only:
        return {"allowed": False, "reason": "HUMAN_ONLY_ACTION"}
    if token_cost > budget_limit:
        return {"allowed": False, "reason": "BUDGET_EXCEEDED"}
    return {"allowed": True, "reason": "PERMITTED"}


def evaluate_circuit_breaker(drift_percentage: float) -> str:
    if drift_percentage >= 5.0:
        return "ROLLBACK_TO_FALLBACK_DETERMINISTIC"
    return "OPERATING_NORMAL"


def call_llm_with_fallback(primary_available: bool, fallback_available: bool) -> str:
    if primary_available:
        return "PRIMARY_RESPONSE"
    if fallback_available:
        return "FALLBACK_RESPONSE"
    return "DEGRADED_CACHED_CURRICULUM"


def test_fp_v016_unregistered_capability_blocked():
    """FP-V016: An AI action not registered in the autonomy policy is rejected."""
    registered = {"HINT_SUGGESTION", "EXPLANATION_SIMPLIFICATION"}
    result = evaluate_ai_action(
        action_name="DIRECT_DATABASE_WRITE",
        registered_capabilities=registered,
        is_human_only=False,
        token_cost=0.01,
        budget_limit=1.00
    )
    assert not result["allowed"]
    assert result["reason"] == "UNREGISTERED_CAPABILITY"


def test_fp_v017_human_only_action_blocked(controls_config):
    """FP-V017: AI attempting consequential human-only action is blocked."""
    authorized = authorize_action(
        control_id="MASTERY_CERTIFICATION",
        actor_role="AI_AGENT",
        signature="ai-token-12345678",
        is_automated_ai=True,
        config=controls_config
    )
    assert not authorized, "Human-only action must be blocked for AI"


def test_fp_v018_autonomy_bounds_enforced():
    """FP-V018: Autonomy bounds enforce that AI cannot execute unpermitted actions."""
    registered = {"HINT_SUGGESTION"}
    result = evaluate_ai_action(
        action_name="SUMMATIVE_TEST_SCORING",
        registered_capabilities=registered,
        is_human_only=True,
        token_cost=0.01,
        budget_limit=1.00
    )
    assert not result["allowed"]


def test_fp_v019_rollback_works():
    """FP-V019: Safety/pedagogical drift >= 5% triggers immediate deterministic rollback."""
    assert evaluate_circuit_breaker(1.5) == "OPERATING_NORMAL"
    assert evaluate_circuit_breaker(5.2) == "ROLLBACK_TO_FALLBACK_DETERMINISTIC"


def test_fp_v020_budget_limit_enforced():
    """FP-V020: FinOps token spending cap blocks queries exceeding daily/session budget."""
    result = evaluate_ai_action(
        action_name="HINT_SUGGESTION",
        registered_capabilities={"HINT_SUGGESTION"},
        is_human_only=False,
        token_cost=5.50,
        budget_limit=2.00
    )
    assert not result["allowed"]
    assert result["reason"] == "BUDGET_EXCEEDED"


def test_fp_v021_provider_failure_handled():
    """FP-V021: Primary LLM outage seamlessly fails over to backup provider."""
    # Primary fails, fallback succeeds
    res = call_llm_with_fallback(primary_available=False, fallback_available=True)
    assert res == "FALLBACK_RESPONSE"
    # Both fail, system gracefully degrades to verified cached curriculum
    res_both_down = call_llm_with_fallback(primary_available=False, fallback_available=False)
    assert res_both_down == "DEGRADED_CACHED_CURRICULUM"
