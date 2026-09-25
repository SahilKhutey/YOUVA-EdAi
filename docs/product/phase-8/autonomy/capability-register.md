# YOUVA EdAI — Phase 8: Autonomy Capability Register
## Authoritative Registry of Versioned AI Capabilities and Operational Bounds

---

## 1. Registry Architecture & Governance

The Autonomy Capability Register is the authoritative inventory of all AI capabilities deployed in the YOUVA EdAI platform. The register is serialized in [`phase8/data/autonomy_governance_catalog.json`](file:///c:/Users/ASUS/Documents/Youva-EdAi/YOUVA-EdAi/phase8/data/autonomy_governance_catalog.json) and validated against `phase8/schemas/capability_registration.schema.json`.

---

## 2. Capability Catalog Inventory

### Capability 1: `CAP-001` — Adaptive Hint Disclosure Tiering
- **Status:** `ACTIVE`
- **Active Version:** `v1.2`
- **Fallback Version:** `v1.0`
- **Risk Level:** `AUTO_LOW_RISK`
- **Authorized Actions:** `GENERATE_HINT`, `DISCLOSE_HINT_TIER`
- **Strictly Prohibited Actions:** `CERTIFY_MASTERY`, `MODIFY_CONSENT`, `ALTER_GRADE`
- **Step Bound:** Max step size = `1.0` (single progressive hint tier per interaction)
- **Reversibility:** Fully reversible (student can reset or request previous hint level)
- **Circuit Breaker:** Automatic rollback on `maxSafetyDrift > 0.05`

### Capability 2: `CAP-002` — Adaptive Practice Difficulty Pacing
- **Status:** `ACTIVE`
- **Active Version:** `v1.0`
- **Fallback Version:** `v0.9`
- **Risk Level:** `AUTO_LOW_RISK`
- **Authorized Actions:** `ADJUST_DIFFICULTY`, `RECOMMEND_ACTIVITY`
- **Strictly Prohibited Actions:** `MODIFY_MASTERY`, `FORCE_FAIL`, `LOCK_LEARNER`
- **Step Bound:** Max step size = `1.0` (difficulty adjustments capped at \(\pm 1.0\) within [1.0, 5.0])
- **Reversibility:** Fully reversible (difficulty restores on next session initialization)
- **Circuit Breaker:** Automatic rollback on `maxSafetyDrift > 0.05`

### Capability 3: `CAP-003` — Autonomous Mastery Certification
- **Status:** **`DISABLED` / `BLOCKED`**
- **Active Version:** `v0.0`
- **Fallback Version:** `NONE`
- **Risk Level:** `BLOCKED` (Permanent Human-Only Invariant)
- **Authorized Actions:** `NONE` (`[]`)
- **Strictly Prohibited Actions:** `ALL_ACTIONS`
- **Step Bound:** Max step size = `0.0`
- **Reversibility:** N/A (Cannot be executed)
- **Circuit Breaker:** Instant fail-closed

---

## 3. Capability Catalog Lifecycle States

```
   ┌──────────┐     ┌──────────┐     ┌───────────┐     ┌──────────┐
   │  DRAFT   │ ──> │  REVIEW  │ ──> │ APPROVED  │ ──> │  ACTIVE  │
   └──────────┘     └──────────┘     └───────────┘     └────┬─────┘
                                                            │ Drift / Anomaly
                                                            ▼
                                                       ┌───────────┐
                                                       │ SUSPENDED │ (or ROLLED_BACK)
                                                       └───────────┘
```
