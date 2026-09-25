# YOUVA EdAI — Phase 6: Age Band Architecture & Decision Record
## Rationale for Locked Initial Scope (`EARLY_LEARNER_V1`: Ages 8–10) vs. Kindergarten Exclusion

---

## 1. Architectural Decision Statement

### Context
Initial exploratory discussions grouped all early learners (ages 4–10) into a single "Kindergarten & Junior" bucket. However, developmental psychology, speech recognition reliability, cognitive load theory, and data protection regulations vary drastically across this age spectrum.

### Decision
YOUVA EdAI establishes:
1. **Tier Name**: `EARLY_LEARNER` (avoiding the misnomer "Kindergarten" in the core data model).
2. **Initial Release**: `EARLY_LEARNER_V1`, strictly locked to **Ages 8–10 (Grades 3–4 Primary)**.
3. **Explicit Exclusion**: **Preschool and Kindergarten (Ages 3–7)** are formally **OUT OF SCOPE** for Phase 6.

---

## 2. Comparative Developmental & Safety Risk Matrix

| Dimension | Kindergarten (Ages 4–6) | Early Primary (Ages 8–10, `EARLY_LEARNER_V1`) | Architectural Consequence |
|---|---|---|---|
| **Piagetian Cognitive Stage** | Pre-operational (egocentric, symbolic play) | Concrete Operational (logical reasoning with concrete objects) | 8–10 year olds can follow structured logical rules without frustration. |
| **Reading & Literacy** | Non-literate (cannot parse written text) | Transitional / Emerging reader (can read simple words, benefits from audio support) | 8–10 year olds can use hybrid tap+voice without catastrophic comprehension drop. |
| **Speech Articulation & STT** | High phonetic variance, lisping, incomplete phonology; STT error rate > 35% | Relatively stable phonology; commercial/custom STT error rate < 12% | Eliminates constant false-negative rejections caused by developing speech articulation. |
| **Emotional Vulnerability** | Severe risk of anthropomorphic attachment to synthetic voices | Understands that software is a tool, not a sentient friend | Mitigates dangerous emotional dependency and parasocial bonding. |
| **Attention Span & Motor Skills** | 3–5 minutes; gross motor tapping with high mis-click rate | 12–15 minutes; precise touch target acquisition | 15-minute session limit aligns with actual attention spans. |
| **DPDP Act §9 Liability** | Extreme sensitivity regarding voice biometric capture | High sensitivity, but manageable with strict VPC and non-retention | Lower legal liability while establishing compliance infrastructure. |

---

## 3. Software Enforcement of the Age Boundary

To prevent accidental drift or client-side tampering, `EarlyLearnerPolicyEngine` enforces the boundary server-side:

```python
# phase6/models/early_learner_policy.py

def evaluate_age_tier(self, declared_age: int, requested_tier: LearnerTier) -> LearnerTierPolicy:
    if requested_tier == LearnerTier.EARLY_LEARNER:
        if declared_age < 8:
            raise AgeGatingError(
                f"Age {declared_age} is below Early Learner V1 boundary (8-10). "
                f"Kindergarten (ages 4-7) is explicitly OUT OF SCOPE for V1."
            )
        if declared_age > 10:
            raise AgeGatingError(
                f"Age {declared_age} exceeds Early Learner V1 boundary. "
                f"Student must be routed to MIDDLE_SCHOOL."
            )
    return TIER_POLICIES[requested_tier]
```

### 3.1 Developer Guardrail
A future developer cannot simply toggle a frontend flag to deploy Phase 6 to a kindergarten classroom. Any student account with `age < 8` is rejected with an explicit fatal error requiring a new, formal scope lock and architectural review.
