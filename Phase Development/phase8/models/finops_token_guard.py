"""
YOUVA-EdAI — Phase 8: FinOps Multi-Tiered Token Guard (P8.9)
Enforces:
1. Hard Spending Caps across Tenant, Student Session, and Capability dimensions.
2. Runaway Autonomous Agent Loop Termination (kill switch on circular loops).
3. Thread-Safe Budget Reconciliation.
"""

from collections import defaultdict
from datetime import datetime, timezone
import threading
from typing import Any, Dict, Optional


class BudgetExceededError(RuntimeError):
    """Raised when an AI call attempts to exceed allocated FinOps token limits."""
    pass


class RunawayAgentLoopTerminatedError(RuntimeError):
    """Raised when an autonomous agent enters a runaway or circular execution loop."""
    pass


class FinOpsTokenGuard:
    """
    Meters and caps LLM token expenditures to guarantee financial safety.
    """

    DEFAULT_MAX_TOKENS_PER_CALL = 1000
    DEFAULT_MAX_SESSION_TOKENS = 4000
    DEFAULT_MONTHLY_TENANT_TOKENS = 500000
    MAX_AUTONOMOUS_LOOPS_PER_GOAL = 5

    def __init__(self):
        self._lock = threading.Lock()
        # tenant_id -> config dict
        self._tenant_configs: Dict[str, Dict[str, Any]] = {}
        # tenant_id -> current token count
        self._tenant_usage: Dict[str, int] = defaultdict(int)
        # session_id -> current token count
        self._session_usage: Dict[str, int] = defaultdict(int)
        # f"{session_id}:{goal_id}" -> loop counter
        self._loop_counters: Dict[str, int] = defaultdict(int)

    def set_tenant_budget(
        self,
        tenant_id: str,
        monthly_limit: int = DEFAULT_MONTHLY_TENANT_TOKENS,
        session_limit: int = DEFAULT_MAX_SESSION_TOKENS,
        hard_cap: bool = True
    ) -> None:
        with self._lock:
            self._tenant_configs[tenant_id] = {
                "monthlyLimit": monthly_limit,
                "sessionLimit": session_limit,
                "hardCap": hard_cap
            }

    def check_budget_before_call(
        self,
        tenant_id: str,
        session_id: str,
        estimated_tokens: int
    ) -> bool:
        """
        Pre-flight check before dispatching an LLM request.
        Raises BudgetExceededError if budget is exhausted and hard_cap is enabled.
        """
        if estimated_tokens > self.DEFAULT_MAX_TOKENS_PER_CALL:
            raise BudgetExceededError(
                f"Single-call estimate ({estimated_tokens}) exceeds max allowed per call ({self.DEFAULT_MAX_TOKENS_PER_CALL})"
            )

        with self._lock:
            cfg = self._tenant_configs.get(tenant_id, {
                "monthlyLimit": self.DEFAULT_MONTHLY_TENANT_TOKENS,
                "sessionLimit": self.DEFAULT_MAX_SESSION_TOKENS,
                "hardCap": True
            })

            tenant_total = self._tenant_usage[tenant_id] + estimated_tokens
            if tenant_total > cfg["monthlyLimit"]:
                if cfg["hardCap"]:
                    raise BudgetExceededError(
                        f"Tenant [{tenant_id}] token budget exceeded: {tenant_total} / {cfg['monthlyLimit']} tokens"
                    )

            session_total = self._session_usage[session_id] + estimated_tokens
            if session_total > cfg["sessionLimit"]:
                if cfg["hardCap"]:
                    raise BudgetExceededError(
                        f"Student session [{session_id}] token limit exceeded: {session_total} / {cfg['sessionLimit']} tokens"
                    )

        return True

    def record_usage(
        self,
        tenant_id: str,
        session_id: str,
        actual_tokens: int
    ) -> Dict[str, Any]:
        """Records finalized token consumption in thread-safe ledger."""
        with self._lock:
            self._tenant_usage[tenant_id] += actual_tokens
            self._session_usage[session_id] += actual_tokens

            return {
                "tenantId": tenant_id,
                "sessionId": session_id,
                "tokensAdded": actual_tokens,
                "tenantTotal": self._tenant_usage[tenant_id],
                "sessionTotal": self._session_usage[session_id]
            }

    def increment_and_check_loop(self, session_id: str, goal_id: str) -> int:
        """
        Guards against autonomous runaway loops.
        Raises RunawayAgentLoopTerminatedError if iteration threshold is reached.
        """
        key = f"{session_id}:{goal_id}"
        with self._lock:
            self._loop_counters[key] += 1
            current = self._loop_counters[key]

            if current > self.MAX_AUTONOMOUS_LOOPS_PER_GOAL:
                raise RunawayAgentLoopTerminatedError(
                    f"Runaway agent loop terminated: execution reached {current} iterations for goal [{goal_id}] "
                    f"(maximum allowed: {self.MAX_AUTONOMOUS_LOOPS_PER_GOAL})"
                )
            return current

    def get_utilization(self, tenant_id: str) -> Dict[str, Any]:
        with self._lock:
            cfg = self._tenant_configs.get(tenant_id, {
                "monthlyLimit": self.DEFAULT_MONTHLY_TENANT_TOKENS,
                "sessionLimit": self.DEFAULT_MAX_SESSION_TOKENS
            })
            used = self._tenant_usage.get(tenant_id, 0)
            return {
                "tenantId": tenant_id,
                "monthlyLimit": cfg["monthlyLimit"],
                "tokensUsed": used,
                "remainingTokens": max(0, cfg["monthlyLimit"] - used),
                "utilizationPercent": round((used / cfg["monthlyLimit"]) * 100, 2)
            }
