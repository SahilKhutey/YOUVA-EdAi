"""
YOUVA-EdAI — Phase 8 Tests: FinOps Multi-Tiered Token Guard (P8-V16, P8-V17, P8-V26)
Verifies:
- P8-V16: Budget exceeded blocks execution fail-closed.
- P8-V17: Runaway autonomous loops terminated.
- P8-V26: Concurrent token budget racing handled safely.
"""

import concurrent.futures
import pytest
from phase8.models.finops_token_guard import (
    FinOpsTokenGuard,
    BudgetExceededError,
    RunawayAgentLoopTerminatedError
)


@pytest.fixture
def guard():
    g = FinOpsTokenGuard()
    g.set_tenant_budget("tenant-dps-rkpuram", monthly_limit=5000, session_limit=500)
    return g


def test_p8_v16_budget_exceeded_blocked(guard):
    """P8-V16: Token check raises BudgetExceededError when allocation is exhausted."""
    # Pre-flight check under budget passes
    assert guard.check_budget_before_call("tenant-dps-rkpuram", "sess_01", estimated_tokens=200) is True

    # Record usage that exhausts the session limit (500 tokens)
    guard.record_usage("tenant-dps-rkpuram", "sess_01", actual_tokens=450)

    # Next call requiring 100 tokens would reach 550, exceeding 500 session limit
    with pytest.raises(BudgetExceededError, match="token limit exceeded"):
        guard.check_budget_before_call("tenant-dps-rkpuram", "sess_01", estimated_tokens=100)


def test_p8_v17_runaway_agent_loop_terminated(guard):
    """P8-V17: Autonomous iterations exceeding threshold trigger RunawayAgentLoopTerminatedError."""
    session_id = "sess_autonomous_loop"
    goal_id = "solve_linear_eq"

    # Iterations 1 to 5 succeed
    for i in range(1, 6):
        cnt = guard.increment_and_check_loop(session_id, goal_id)
        assert cnt == i

    # 6th iteration breaches MAX_AUTONOMOUS_LOOPS_PER_GOAL (5)
    with pytest.raises(RunawayAgentLoopTerminatedError, match="Runaway agent loop terminated"):
        guard.increment_and_check_loop(session_id, goal_id)


def test_p8_v26_concurrent_budget_racing_safe(guard):
    """P8-V26: 20 threads concurrently consuming tokens reconcile safely."""
    tokens_per_worker = 20
    workers = 20

    def consumer(idx: int):
        guard.record_usage("tenant-dps-rkpuram", f"sess_concurrent_{idx}", actual_tokens=tokens_per_worker)

    with concurrent.futures.ThreadPoolExecutor(max_workers=10) as executor:
        futures = [executor.submit(consumer, i) for i in range(workers)]
        for f in futures:
            f.result()

    util = guard.get_utilization("tenant-dps-rkpuram")
    # 20 workers * 20 tokens = 400 tokens exactly
    assert util["tokensUsed"] == 400
    assert util["remainingTokens"] == 4600
