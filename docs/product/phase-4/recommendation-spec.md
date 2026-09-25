# YOUVA EdAI — Phase 4 Explainable Recommendation Specification

**Specification Version:** 1.0  
**Phase:** Phase 4 — Personalization Depth  
**Core Requirement:** All recommendations must be fully explainable to the classroom educator. Opaque recommendations such as *"Cognitive Twin recommends reteaching"* are strictly prohibited.

---

## 1. Recommendation Schema (Cycle 4)

```typescript
export interface PersonalizedRecommendation {
  id: string;
  studentId: string;
  itemId: string;
  conceptId: string;
  policyVersion: number; // e.g. 1

  // Actionable Pedagogical Directive
  recommendationType:
    | "REVIEW"               // Spaced retrieval of previously mastered concept
    | "PRACTICE"             // Standard ZPD practice within current mastery band
    | "RETEACH"              // Foundational prerequisite weakness detected; pause practice
    | "INCREASE_DIFFICULTY"  // High accuracy + fast response; advance to multi-step
    | "DECREASE_DIFFICULTY"  // Repeated struggle; provide scaffolded sub-problem
    | "ALTERNATE_EXPLANATION";// Student stalled on symbolic; offer visual balance model

  // Human-Readable Justification (Rendered on Teacher Dashboard)
  reason: string;

  // Empirical Evidence Payload
  evidence: {
    masteryProbability?: number;       // Current P(L)
    recentErrorRate?: number;          // Rolling error rate over last 10 attempts
    responseTimePattern?: string;      // e.g. "RAPID_GUESSING" (< 4s) or "THOUGHTFUL_STRUGGLE" (> 60s)
    prerequisiteStatus?: string;       // e.g. "STABLE (P(L) = 0.88 on Integer Addition)"
    reviewStatus?: string;             // e.g. "DUE_FOR_RETRIEVAL (Day 7 interval reached)"
    misconceptionDetected?: string;    // e.g. "SIGN_TRANSPOSITION_ERROR"
  };

  confidence: number; // 0.0 to 1.0 (Algorithm certainty)

  // Teacher Review Gate
  requiresTeacherReview: boolean; // TRUE for consequential actions (RETEACH, LEVEL_CHANGE)

  createdAt: string; // ISO 8601 UTC
}
```

---

## 2. Production Recommendation Examples

### Example 1: Foundational Prerequisite Weakness (Reteach)
```json
{
  "id": "rec-2026-0901",
  "studentId": "s-dps-104",
  "conceptId": "linear_eq_both_sides",
  "itemId": "Q-G8-ALG-028",
  "policyVersion: 1,
  "recommendationType": "RETEACH",
  "reason": "Student has made 3 consecutive errors involving negative-number transposition while prerequisite integer arithmetic remains unmastered (P(L) = 0.42). Practice paused to prevent compounding misconceptions.",
  "evidence": {
    "masteryProbability": 0.35,
    "recentErrorRate": 0.60,
    "prerequisiteStatus": "UNSTABLE: Integer Arithmetic P(L) = 0.42",
    "misconceptionDetected": "SIGN_TRANSPOSITION_ERROR"
  },
  "confidence": 0.91,
  "requiresTeacherReview": true
}
```

### Example 2: Scaffolded Visual Explanation
```json
{
  "id": "rec-2026-0902",
  "studentId": "s-dps-108",
  "conceptId": "linear_eq_two_step",
  "itemId": "Q-G8-ALG-015",
  "policyVersion: 1,
  "recommendationType": "ALTERNATE_EXPLANATION",
  "reason": "Student repeated error after standard algebraic line-by-line explanation. Presenting physical balance scale representation for isolating unknown term.",
  "evidence": {
    "masteryProbability": 0.52,
    "recentErrorRate": 0.40,
    "responseTimePattern": "THOUGHTFUL_STRUGGLE (Median 72s)",
    "misconceptionDetected": "INCOMPLETE_ISOLATION"
  },
  "confidence": 0.84,
  "requiresTeacherReview": false
}
```
