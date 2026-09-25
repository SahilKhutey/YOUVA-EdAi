# YOUVA EdAI — Phase 8: FinOps Token Cost Policy
## Multi-Tiered Quota Ceilings, Hard Spending Caps, and Runaway Loop Killer

---

## 1. Executive Summary

Financial predictability and denial-of-wallet defense are core operational requirements for YOUVA EdAI. Autonomous agents operating without hard budgetary boundaries can incur catastrophic compute and token costs during unexpected retry loops or malicious stress testing.

The FinOps Token Guard (`finops_token_guard.py`) enforces deterministic limits across three dimensions: single-call, session, and tenant monthly quotas.

---

## 2. Token Budgetary Ceilings

| Dimension | Default Limit | Hard Cap Enforced | System Behavior on Threshold Breach |
|---|---|---|---|
| **Single LLM Call** | 1,000 tokens | YES | `BudgetExceededError`: Pre-flight check rejects call before dispatch. |
| **Student Session** | 4,000 tokens | YES | `BudgetExceededError`: Session falls back to deterministic curriculum cache. |
| **Tenant Monthly Quota** | 500,000 tokens (Base tier) | YES | `BudgetExceededError`: Tenant AI queries paused; admin notified. |

---

## 3. Runaway Autonomous Loop Killer

To defend against circular agent reasoning loops or infinite retry spirals:
- The system assigns a unique execution key: `f"{session_id}:{goal_id}"`.
- With every autonomous loop iteration, `FinOpsTokenGuard.increment_and_check_loop` increments the counter.
- **Maximum Permitted Iterations:** **5 iterations**.
- **Iteration 6 Trigger:**
  ```python
  if current > self.MAX_AUTONOMOUS_LOOPS_PER_GOAL:
      raise RunawayAgentLoopTerminatedError(
          f"Runaway agent loop terminated: execution reached {current} iterations for goal [{goal_id}] "
          f"(maximum allowed: {self.MAX_AUTONOMOUS_LOOPS_PER_GOAL})"
      )
  ```
- The execution process is killed immediately, the session state is frozen, and an alert is dispatched to the monitoring desk.

---

## 4. Multi-Tenant Accounting & Thread Safety

The token ledger uses atomic Python `threading.Lock` primitives to guarantee zero race conditions during concurrent student requests across tenants. Usage is tracked across:
1. Ingress estimation (pre-flight validation).
2. Egress actuals (finalized usage reconciliation).
3. Thread-safe utilization reporting (`get_utilization(tenant_id)`).
