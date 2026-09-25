# Phase 4 Repository Audit: Personalization Depth & Cognitive Modeling Baseline

**Execution Date:** 2026-09-25  
**Active Branch:** `feature/phase-4-personalization-depth`  
**Governing Invariant:** Do not implement "Cognitive Twin" as a large opaque AI subsystem. Build it as an incremental, evidence-backed extension of the existing KnowledgeState + BKT + prerequisite + recommendation architecture.

---

## 1. Executive Summary

This audit assesses the repository's readiness to transition from the Phase 3 verified closed pilot into **Phase 4 Personalization Depth**.

The audit surfaces two critical insights:
1. **The Foundation is Solid:** The Phase 1 BKT engine, Phase 2 security/consent boundaries, and Phase 3 pilot evidence (+0.42 mastery growth, 92% teacher recommendation inspection, 3.1% override rate) provide a legitimate empirical baseline. In the backend, `KnowledgePersonalizationService` passes 5 unit tests verifying prerequisite remediation and review scheduling.
2. **Cognitive Modeling Requires Grounding:** In [`backend/src/cognitive-twin/cognitive-twin.service.ts`](file:///C:/Users/ASUS/Documents/Youva-EdAi/YOUVA-EdAi/backend/src/cognitive-twin/cognitive-twin.service.ts), speculative, ungrounded attributes (`skillGenome: { Creativity: 0.5 }`, `attentionSpanDelta`, `ethicalAlignmentScore`) exist in code without empirical justification or validation from the Phase 3 pilot. These ungrounded constructs must be pruned. In accordance with Phase 4 principles, the cognitive model must be restricted strictly to observable, evidence-backed behavioral signals (response-time patterns, recent error rates, hint success rates, and explanation preferences).

---

## 2. Component Classification Matrix

| Existing Component | Exists | Functional | Tested | Pilot Evidence | Action & Architectural Decision |
|---|:---:|:---:|:---:|:---:|---|
| **Student Knowledge State** | YES | YES | YES | YES | **REUSE & EXTEND:** Reuse `UserTopicMastery` / `TopicKnowledgeState`; extend with Phase 3 response-time and error pattern signals (`LearningPattern`). |
| **BKT Engine** | YES | YES | YES | YES | **REUSE:** Retain Corbett & Anderson 4-parameter BKT as the immutable foundation for belief updating. Do not replace with opaque deep learning. |
| **Concept Graph (DAG)** | YES | YES | YES | YES | **VALIDATE & FORMALIZE:** Leverage `grade8_math_concept_dag.json` and `KnowledgeGraphService`. Enforce rule: pilot data suggests candidate graph changes, but only human SME review can approve and publish graph modifications. |
| **Recommendation Engine** | YES | YES | YES | YES | **MODIFY:** Extend `KnowledgePersonalizationService` with explainable evidence payloads (`{ prerequisiteStatus, recentErrorRate, responseTimePattern }`) and explicit `requiresTeacherReview: boolean`. |
| **Cognitive Twin** | YES | PARTIAL | NO | NO | **AUDIT & REFACTOR:** Prune ungrounded speculative scalars (`creativity`, `attentionSpan`, `ethicalAlignment`). Replace with empirical `LearningPattern` v1. |
| **Teacher Override Loop** | YES | YES | YES | YES | **EXTEND:** Extend `TeacherFeedbackLoopService` with aggregate pattern detection (triggering review tickets when override rates exceed 25% on a concept). Strictly prohibit automatic retraining. |
| **Personalization Engine** | YES | YES | YES | YES | **BUILD & VERSION:** Enforce policy versioning (`PersonalizationPolicy` v1, v2) and guarantee a strict toggle (`PERSONALIZATION_ENABLED=true/false`) to compare against the baseline engine. |
| **Reinforcement Learning (RL)** | YES | PARTIAL | MINIMAL | NO | **DEFER:** Keep `rl-difficulty.service.ts` disabled. The Phase 3 pilot proved deterministic ZPD item selection was sufficient; RL difficulty introduces unexplainability. |

---

## 3. Concrete Defect & Refactoring Register

1. **Speculative Cognitive Twin Pruning:**
   - **File:** [`backend/src/cognitive-twin/cognitive-twin.service.ts`](file:///C:/Users/ASUS/Documents/Youva-EdAi/YOUVA-EdAi/backend/src/cognitive-twin/cognitive-twin.service.ts)
   - **Issue:** Attributes like `skillGenome: { "Creativity": 0.5 }` and `ethicalAlignmentScore` are pedagogical pseudoscience that violate the Phase 0 compliance boundary and Phase 4 empirical standards.
   - **Remediation:** Refactor to [`cognitive-model-spec.md`](file:///C:/Users/ASUS/Documents/Youva-EdAi/YOUVA-EdAi/docs/product/phase-4/cognitive-model-spec.md) (`LearningPattern` v1).
2. **Policy Versioning Missing in Decision Persistence:**
   - **File:** [`backend/src/personalization/personalization-engine.service.ts`](file:///C:/Users/ASUS/Documents/Youva-EdAi/YOUVA-EdAi/backend/src/personalization/personalization-engine.service.ts)
   - **Issue:** Decisions do not record the active policy version identifier (`policyVersion: number`), preventing historical auditability of why a specific recommendation was made.
   - **Remediation:** Wire `PersonalizationPolicyService.getActivePolicy()` version into every generated recommendation record.
3. **Graph Mutation Protection:**
   - **File:** [`backend/src/knowledge-graph/knowledge-graph.service.ts`](file:///C:/Users/ASUS/Documents/Youva-EdAi/YOUVA-EdAi/backend/src/knowledge-graph/knowledge-graph.service.ts)
   - **Issue:** Service permits direct creation of prerequisite links without an SME review and approval workflow.
   - **Remediation:** Enforce the status workflow: `DRAFT` $\to$ `SME_REVIEW` $\to$ `APPROVED` $\to$ `PUBLISHED`.
