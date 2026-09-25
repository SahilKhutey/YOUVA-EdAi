# YOUVA EdAI — Phase 3 Pilot Issue Log

**Log Version:** 1.0  
**Purpose:** Canonical, persistent record of all defects, ambiguities, UX friction points, and safety observations discovered during the Phase 3 closed pilot.

---

## 1. Data Schema

```typescript
export interface PilotIssue {
  id: string;
  reportedBy: "STUDENT" | "TEACHER" | "PARENT" | "PRODUCT" | "ENGINEERING";
  category:
    | "BUG"
    | "CONTENT"
    | "UX"
    | "SAFETY"
    | "PRIVACY"
    | "TRUST"
    | "PERFORMANCE";
  description: string;
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  status: "OPEN" | "INVESTIGATING" | "FIXED" | "VERIFIED" | "WONT_FIX";
  discoveredAt: string; // ISO 8601
  resolvedAt: string | null;
  resolution: string | null;
}
```

---

## 2. Active Pilot Issue Register

| Issue ID | Reported By | Category | Severity | Description | Status | Discovered | Resolved | Resolution Summary |
|---|:---:|:---:|:---:|---|:---:|:---:|:---:|---|
| **ISSUE-P3-001** | TEACHER | CONTENT | MEDIUM | Question `Q-G8-ALG-014` explanation used decimal notation ($x = 2.5$) instead of improper fraction form ($x = \frac{5}{2}$) expected in NCERT text. | VERIFIED | 2026-08-12 | 2026-08-13 | Updated explanation to accept both forms and prioritize fractional notation. Reviewed by SME. |
| **ISSUE-P3-002** | STUDENT | UX | LOW | On mobile viewport, equation scratchpad clear button was located too close to the submit answer button, causing occasional accidental clears. | VERIFIED | 2026-08-14 | 2026-08-15 | Added 24px spatial separation and 200ms confirmation toast on scratchpad reset. |
| **ISSUE-P3-003** | TEACHER | TRUST | MEDIUM | Teacher dashboard initially displayed $P(L_t) = 0.86$ as "Mastered" after only 2 correct answers; teacher expected at least 3 independent correct solutions. | VERIFIED | 2026-08-16 | 2026-08-17 | Enforced the `MINIMUM_INDEPENDENT_CORRECT = 3` rule consistently in the web API layer. |
| **ISSUE-P3-004** | ENGINEERING | PERFORMANCE | LOW | Initial diagnostic response submission had p95 latency of 420ms due to unindexed `UserTopicMastery` lookups. | VERIFIED | 2026-08-18 | 2026-08-19 | Added compound database index `@@index([userId, topicId])`; latency reduced to 180ms. |
| **ISSUE-P3-005** | PARENT | PRIVACY | LOW | Parent OTP SMS delivery experienced a 90-second latency on a regional telecommunications carrier. | VERIFIED | 2026-08-20 | 2026-08-21 | Added automated secondary gateway fallback if SMS delivery report exceeds 30 seconds. |
