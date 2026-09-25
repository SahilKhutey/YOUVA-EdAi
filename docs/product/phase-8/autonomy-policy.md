# YOUVA EdAI — Phase 8: Autonomy Governance Policy & Reversion Protocols
## Structural Principles, Guardrails, and Cryptographic Lifecycle Control

---

## 1. Core Operating Principles

The deployment of autonomous AI agents in educational environments demands rigorous boundaries. YOUVA EdAI enforces four foundational policy pillars:

1. **Pre-Authorization Mandatory:** An AI agent cannot execute any action without an active, ratified capability definition in `autonomy_governance_catalog.json`.
2. **Deterministic Parameter Bounding:** Every autonomous operation must define absolute limits on step size, rate limits, and maximum consecutive loops.
3. **Guaranteed Reversibility:** Any state mutation performed autonomously must have an automated, programmatic reverse operation (undo/revert) available within milliseconds.
4. **Permanent Human Supremacy:** Consequential outcomes (grades, progression, safety disposition, legal rights) remain permanently under human teacher and guardian jurisdiction.

---

## 2. Autonomy Policy Rules

### Rule 1: Zero Ambient Autonomy
Agents do not possess general background task permissions. They execute only in response to bounded learning events (e.g., student submits an incorrect response, student requests clarification).

### Rule 2: Non-Destructive Step Sizing
For any adaptive pedagogical adjustment:
- Hint Disclosure step size \(\le 1.0\) (single progressive tier disclosure per request).
- Practice Difficulty adjustment \(\le 1.0\) within a normalized 1.0–5.0 scale per session.
- Any attempt to jump difficulty by \(> 1.0\) raises `ActionOutOfBoundsError`.

### Rule 3: Session Loop Hard Caps
To eliminate runaway agent invocation and recursive prompt spirals:
- Maximum consecutive autonomous adjustments per student goal = 5 iterations.
- If iteration 6 is attempted without explicit human pedagogical input, `FinOpsTokenGuard` raises `RunawayAgentLoopTerminatedError` and triggers teacher notification.

### Rule 4: Drift-Triggered Reversion
Every active capability is monitored continuously against certified baseline metrics:
- Maximum permissible safety drift: **5.0%** (\(0.05\)).
- Maximum permissible correctness drift: **5.0%** (\(0.05\)).
- General drift limit: **15.0%** (\(0.15\)).
If any threshold is exceeded, the capability is instantaneously demoted (`ROLLED_BACK`) to its prior validated version.

---

## 3. Reversion Protocols

When an anomaly, drift threshold breach, or student frustration signal trips the circuit breaker, the following reversion sequence executes automatically:

```
                   DRIFT DETECTION (>= 5%)
                             │
                             ▼
              CIRCUIT BREAKER TRIPS (OPEN)
                             │
            ┌────────────────┴────────────────┐
            ▼                                 ▼
   FREEZE ACTIVE CAPABILITY          REVERT TO FALLBACK VERSION
 (State: ROLLED_BACK)             (e.g., v1.2 -> v1.0)
            │                                 │
            └────────────────┬────────────────┘
                             ▼
               DISPATCH HEALTH NOTIFICATION
            (Teacher Dashboard & Safety Desk)
                             │
                             ▼
              LOG HMAC-SHA256 LEDGER ENTRY
            (Permanent Audit Trail in DB)
```

### Rollback Invariant Table
| Capability ID | Active Version | Fallback Version | Rollback Mechanism | Recovery Action |
|---|---|---|---|---|
| `CAP-001` | v1.2 | v1.0 | Automated (Zero downtime) | Offline model re-evaluation & pedagogical review |
| `CAP-002` | v1.0 | v0.9 | Automated (Zero downtime) | Pacing curve recalibration & teacher alignment |
| `CAP-003` | v0.0 | NONE | Permanently Disabled | Cannot be activated without board-level signoff |

---

## 4. Re-Authorization Protocols

A capability that has undergone automated rollback cannot be re-promoted to `ACTIVE` by engineering staff alone. Re-promotion requires:
1. Complete root-cause analysis (RCA) artifact in `docs/product/phase-8/circuit-breaker/`.
2. Validation on a minimum synthetic test batch of 1,000 adversarial prompts.
3. Cryptographic multi-signature approval from the Pedagogical Director and Child Safety Officer.
