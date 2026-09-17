# YOUVA-EdAI Personalization Charter & Governance Framework (N10.1, N10.2, N10.20, N10.21)

**Document Reference**: `DOC-YOUVA-N10-CHARTER`  
**Milestone**: N10 — Deep Personalization, Teacher Feedback & Outcome Validation  
**Baseline Release**: Commit `ca77906` / `b7a8511` (N9 Pilot Validated Release Candidate)  
**Status**: `RATIFIED / GOVERNANCE-ACTIVE`  

---

## 1. Governing Principles (N10.0, N10.1)

Personalization in YOUVA-EdAI is fundamentally pedagogical, deterministic, and human-supervised. It operates strictly under the sequential cycle:

```
Observe (Learner Evidence)
   ↓
Decide (Governed Policy Engine)
   ↓
Teach (Scaffolded Activity)
   ↓
Measure (Objective Assessment)
   ↓
Review (Teacher Oversight & Override)
   ↓
Improve (Offline Model & Policy Tuning)
   ↓
Validate (Empirical Educational Outcomes)
```

**Core Architectural Invariant**:  
*AI algorithms recommend; human educators authorize consequential decisions. Personalization decisions must be explainable, reversible, and demonstrably tied to educational gains rather than mere user engagement.*

---

## 2. Personalization Scope Lock (N10.2)

The personalization subsystem is legally and architecturally bounded to **ten discrete educational dimensions**:

| Dimension | Description | Pedagogical Rationale |
|:---|:---|:---|
| **1. Knowledge State** | Mastery $M \in [0, 1]$ across curriculum DAG nodes. | Ensures instruction matches verified prerequisite readiness. |
| **2. Difficulty Level** | Calibrated item difficulty $D \in [0.1, 0.9]$. | Maintains learner within Vygotsky's Zone of Proximal Development (ZPD). |
| **3. Pacing** | Time-per-task allocation and pause thresholds. | Accommodates varied reading and problem-solving speeds. |
| **4. Practice Frequency** | Spaced repetition intervals (SM-2 memory model). | Mitigates forgetting curve and cements durable long-term retention. |
| **5. Remediation Path** | Sub-skill targeted review on consecutive errors. | Addresses specific arithmetic or conceptual misconceptions. |
| **6. Extension Path** | Advanced challenge problems for $M \ge 0.85$. | Prevents disengagement among high-velocity learners. |
| **7. Feedback Style** | Step-by-step Socratic hints vs conceptual rule reminders. | Matches hint granularity to current learner confidence and error type. |
| **8. Activity Type** | Worked examples vs visual diagrams vs interactive problems. | Aligns with individual cognitive modal preference. |
| **9. Content Sequencing** | Prerequisite-aware topological traversal of topics. | Prevents cognitive overload by enforcing prerequisite mastery. |
| **10. Teacher Interventions** | Manual pedagogical overrides and custom problem queues. | Preserves teacher sovereignty over classroom pacing and priorities. |

---

## 3. Explicit Prohibition of Sensitive-Attribute Profiling (N10.21)

YOUVA-EdAI strictly forbids collecting, inferring, or utilizing sensitive personal attributes for personalization:

```
┌────────────────────────────────────────────────────────────────────────────────┐
│                   PROHIBITED ATTRIBUTE CATEGORIES (ZERO-TOLERANCE)             │
├────────────────────────────────────────────────────────────────────────────────┤
│ ❌ Race, caste, ethnicity, or nationality                                      │
│ ❌ Religion, spiritual beliefs, or philosophical worldview                     │
│ ❌ Political affiliation or social opinions                                    │
│ ❌ Gender identity, sex, or sexual orientation                                 │
│ ❌ Medical, mental health, psychiatric, or biometric data                      │
│ ❌ Socioeconomic status, family income, or credit standing                    │
│ ❌ Behavioral surveillance outside the learning application                    │
└────────────────────────────────────────────────────────────────────────────────┘
```

*Enforcement*: `SsrfGuardService` and `TenantResolutionGuard` reject payloads containing non-educational profile attributes. Any attempt to infer sensitive traits triggers an immediate P0 audit alarm.

---

## 4. Personalization Fairness & Demographic Parity (N10.20)

Fairness is audited along educational and institutional strata:
1. **Access Equity**: Ensure equal availability of high-quality Socratic hints and remediation across all sections and devices.
2. **Calibration Parity**: Prediction error $|\hat{M} - S_{\text{actual}}|$ must not diverge by more than $\pm 5\%$ across cohort classrooms.
3. **Teacher Override Accessibility**: Every teacher retains identical real-time radar capabilities regardless of classroom size.

---

## 5. Personalization Review Board (N10.49)

All candidate policy revisions (`POLICY_V1` $\rightarrow$ `POLICY_V2`) require unanimous review by the 6-member Personalization Board:
- **Product Owner**: Validates hypothesis and educational scope lock.
- **Pedagogical Lead**: Validates concept DAG, mastery formulas, and transfer metrics.
- **Engineering Lead**: Validates $< 15\text{ ms}$ decision latency and zero-downtime rollback.
- **Child Safety Officer**: Validates crisis guardrails and anti-dependency protections.
- **Privacy Counsel**: Certifies DPDP Act compliance and lack of sensitive profiling.
- **Evaluation Lead**: Audits statistical effect sizes and counterfactual evaluations.
