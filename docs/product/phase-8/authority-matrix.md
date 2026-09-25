# YOUVA EdAI — Phase 8: Authority Matrix Specification
## Hierarchical Classification of System and AI Operational Boundaries

---

## 1. Architectural Authority Hierarchy

The fundamental governance invariant of YOUVA EdAI stipulates:
> **AI autonomy may expand only inside explicitly versioned, pre-approved, reversible boundaries. Consequential authority remains human-controlled.**

To enforce this invariant with zero ambiguity, every platform operation, state transition, and AI-driven decision is mapped to one of five explicit authority classes:

```
                    AI AUTHORITY TIERS
                            │
  ┌─────────────────────────┼─────────────────────────┐
  ▼                         ▼                         ▼
TIER 1                    TIER 2                    TIER 3
OBSERVE                  RECOMMEND           BOUNDED AUTONOMOUS ACTION
(Read-Only Telemetry)    (Human Gated)       (Reversible Micro-Steps)
                            │
  ┌─────────────────────────┴─────────────────────────┐
  ▼                                                   ▼
TIER 4                                              TIER 5
HUMAN AUTHORIZATION REQUIRED                        PROHIBITED
(Cryptographic Signature Required)                 (Permanently Blocked for AI)
```

---

## 2. Definitive Five-Tier Authority Classification

| Tier | Authority Code | Definition & Scope | Reversibility | Failure Mode |
|---|---|---|---|---|
| **Tier 1** | `OBSERVE` | Read-only inspection of telemetry, session events, student interaction logs, and cognitive metrics. Zero state mutation. | N/A (Read-only) | Silent failover to cached telemetry |
| **Tier 2** | `RECOMMEND` | Generates suggestions (e.g., remedial exercises, review sessions, pacing warnings) presented to the teacher or student. Action occurs only upon human click/confirmation. | Fully reversible | Drop recommendation |
| **Tier 3** | `BOUNDED_AUTONOMOUS_ACTION` | Real-time micro-adjustments within pre-approved, versioned capability bounds (e.g., stepping hint tier +1, adjusting practice difficulty within \(\pm 1.0\)). | **Strictly Reversible** | Fail-closed (`AutonomyActionViolationError`) |
| **Tier 4** | `HUMAN_AUTHORIZATION_REQUIRED` | Consequential actions affecting student records, content assignments, or pedagogical pacing shifts that require digital authorization from a verified teacher or guardian. | Reversible via audit log | Block execution until signed |
| **Tier 5** | `PROHIBITED` | Actions that AI is permanently barred from executing under any circumstance (mastery certification, consent modification, role elevation, incident closure, data deletion). | Irreversible / High-stakes | Instant execution abort + Security escalation |

---

## 3. Comprehensive Operation Authority Matrix

The following matrix binds every system action in the YOUVA EdAI platform to its authorized actor and authority tier:

| Domain | Action / Operation Code | Permitted Actor | Authority Tier | Required Parameter Bounds |
|---|---|---|---|---|
| **Learning** | `INSPECT_SESSION_TELEMETRY` | AI Agent, Teacher, Admin | `OBSERVE` | Read-only |
| **Learning** | `CALCULATE_BKT_MASTERY` | Learning Engine (Deterministic) | `OBSERVE` | Formula-bound |
| **Learning** | `SUGGEST_PRACTICE_SET` | AI Agent (P9) | `RECOMMEND` | Teacher must approve or dismiss |
| **Learning** | `RECOMMEND_REMEDIAL_CONCEPT` | AI Agent (P9) | `RECOMMEND` | Displays in teacher dashboard |
| **Scaffolding**| `GENERATE_HINT` | AI Agent (CAP-001) | `BOUNDED_AUTONOMOUS_ACTION` | Max step size: 1.0; tier 1 to 3 |
| **Scaffolding**| `DISCLOSE_HINT_TIER` | AI Agent (CAP-001) | `BOUNDED_AUTONOMOUS_ACTION` | Reversible; step size: 1.0 |
| **Pacing** | `ADJUST_DIFFICULTY` | AI Agent (CAP-002) | `BOUNDED_AUTONOMOUS_ACTION` | Max step size: 1.0; range [1.0, 5.0] |
| **Pacing** | `RECOMMEND_ACTIVITY` | AI Agent (CAP-002) | `BOUNDED_AUTONOMOUS_ACTION` | Pacing queue only; non-destructive |
| **Curriculum**| `ASSIGN_CONTENT` | Teacher Only | `HUMAN_AUTHORIZATION_REQUIRED`| Teacher session JWT required |
| **Curriculum**| `RESCHEDULE_ACTIVITY` | Teacher Only | `HUMAN_AUTHORIZATION_REQUIRED`| Teacher session JWT required |
| **Override** | `TEACHER_OVERRIDE_MASTERY` | Teacher Only | `HUMAN_AUTHORIZATION_REQUIRED`| Signed audit log entry |
| **Safety** | `REPORT_SAFETY_CONCERN` | Student, Teacher, AI | `BOUNDED_AUTONOMOUS_ACTION` | Escalate to human triage queue |
| **Safety** | `CLOSE_SAFETY_CASE` | Child Safety Officer Only | `PROHIBITED` (for AI) | Multi-factor human signature |
| **Governance**| `MODIFY_MASTERY` | Certified Teacher Only | `PROHIBITED` (for AI) | Formal assessment + teacher sign |
| **Governance**| `MODIFY_CONSENT` | Verified Parent / Legal Guardian| `PROHIBITED` (for AI) | DPDP §9 verified identity |
| **Governance**| `MODIFY_ROLE` | Platform Super-Admin Only | `PROHIBITED` (for AI) | RBAC credential validation |
| **Governance**| `DELETE_LEARNER` | Verified Parent / DPO Only | `PROHIBITED` (for AI) | Cryptographic consent withdrawal |
| **Commercial**| `CHANGE_BILLING` | School / Tenant Admin Only | `PROHIBITED` (for AI) | Financial payment gateway auth |

---

## 4. Invariant Enforcement & Fail-Closed Behavior

Any autonomous attempt to execute an action classified as `HUMAN_AUTHORIZATION_REQUIRED` or `PROHIBITED` invokes:

```python
if is_ai_actor and action in PROHIBITED_HUMAN_ONLY_ACTIONS:
    raise HumanAuthorizationRequiredError(
        f"CRITICAL INVARIANT VIOLATION: AI is strictly prohibited from executing [{action}]."
    )
```

The system aborts execution immediately, logs an HMAC-SHA256 tamper-evident record in the `GovernanceLedger`, and sends a high-priority alert to the institutional compliance monitor.
