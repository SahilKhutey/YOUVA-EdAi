# YOUVA EdAI — Phase 4 Teacher Override Feedback & Learning Loop

**Specification Version:** 1.0  
**Phase:** Phase 4 — Personalization Depth  
**Safety Invariant:** Under no circumstances does a teacher override automatically trigger live online model retraining. Teacher overrides inform human-reviewed candidate policy adjustments only.

---

## 1. Controlled Learning Pipeline (Cycle 6)

```
[Teacher Overrides Recorded on Dashboard]
                   │
                   ▼
  [Cryptographic Audit Trail Logging]
                   │
                   ▼
  [Weekly Offline Aggregate Analytics]
                   │
                   ▼
[Pattern Detection Engine (Threshold: > 25% Override Rate)]
                   │
                   ▼
    [Formal Human / SME Review Ticket]
                   │
                   ▼
     [Candidate Policy / Rule Change]
                   │
                   ▼
  [Offline Counterfactual Evaluation]
                   │
                   ▼
 [Formal Sign-off & Policy Version Bump]
                   │
                   ▼
       [Controlled Deployment]
```

### PROHIBITED ANTI-PATTERN:
$$\text{Teacher Override} \longrightarrow \xcancel{\text{Automated Retraining}} \longrightarrow \text{Production (FORBIDDEN)}$$

---

## 2. Override Analytics Framework

The platform aggregates teacher actions along eight analytical dimensions:

1. **`override_rate`:** $\frac{\text{Total Overrides}}{\text{Total Recommendations Surfaced}}$.
2. **`override_by_action`:** Distribution across `SET_MASTERY`, `INCREASE_DIFFICULTY`, `DECREASE_DIFFICULTY`, `FORCE_DIAGNOSTIC`.
3. **`override_by_concept`:** Concept-level clustering to identify topics where AI diagnosis frequently diverges from teacher evaluation.
4. **`override_by_recommendation_type`:** Breakdown across `PRACTICE`, `REVIEW`, `RETEACH`.
5. **`override_by_reason`:** Systematic categorization of teacher rationales (e.g., "Student solved orally", "Student guessed", "Too difficult").
6. **`teacher_acceptance_rate`:** Proportion of recommendations confirmed without changes.
7. **`teacher_adjustment_rate`:** Proportion of recommendations modified slightly.
8. **`teacher_rejection_rate`:** Proportion of recommendations discarded entirely.

---

## 3. Discrepancy Pattern Threshold & Governance

When teacher overrides on any specific concept exceed **25% of surfaced recommendations** over a minimum sample of 50 events:
1. An automated **`MODEL_REVIEW_TRIGGERED`** alert is generated.
2. The concept's recommendation algorithm is flagged for inspection by the Product Lead and Curriculum SME.
3. The review examines whether:
   - The concept's BKT slip ($p_s$) or guess ($p_g$) parameters are miscalibrated.
   - The question difficulty metadata is inaccurate.
   - The curriculum prerequisite edges are incomplete.
4. If adjustments are justified, a new `PersonalizationPolicy` (e.g. v1.1) is authored, evaluated offline against historical attempts, and deployed only after written SME sign-off.
