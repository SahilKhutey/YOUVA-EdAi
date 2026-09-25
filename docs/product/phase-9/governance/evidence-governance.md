# YOUVA EdAI — Phase 9: Evidence-Based Product Claims Governance (C15)
## Empirical Substantiation Model, Marketing Integrity, and Academic Review Gates

---

## 1. Governance Problem Statement

As educational technology companies scale, commercial marketing frequently degrades into unscientific generalizations (e.g., *"YOUVA improves student learning by 40%"*).

Phase 9 establishes the **Evidence-Based Product Claims System**:
> **No public, marketing, or sales claim regarding learning gains, engagement, or efficacy may be published without formal substantiation mapped to empirical evidence, sample populations, statistical methodology, and explicit limitations.**

```
                     EXTERNAL PRODUCT CLAIM PROPOSED
                                   │
                                   ▼
                    EVIDENCE RECORD SUBSTANTIATION
                     (Sample Size, Metrics, Dates)
                                   │
                                   ▼
                    LIMITATIONS & BOUNDARIES LOCK
                                   │
                                   ▼
                   PSYCHOMETRIC & LEGAL SIGN-OFF
                                   │
                                   ▼
                     AUTHORIZED CLAIM PUBLICATION
```

---

## 2. Product Claim Specification Contract

Every public efficacy claim must be formalized in a structured `ProductClaimRecord`:

```typescript
export interface ProductClaimRecord {
  claimId: string;                          // e.g. "CLAIM-2026-MATH-01"
  exactClaimText: string;                   // Exact wording approved for public use
  targetAudience: string;                   // "Prospective School Districts"
  supportingEvidenceRef: string;            // Path to empirical pilot dataset/paper
  studyDate: string;                        // "2026-04-01 to 2026-06-30"
  studyPopulation: {
    studentCount: number;                   // e.g. 1,420 students
    gradeBands: string[];                   // ["Grade 7", "Grade 8"]
    jurisdiction: string;                   // "in-dpdp" (CBSE schools, Delhi NCR)
    demographics: string;                   // "Co-ed urban middle schools"
  };
  statisticalMethodology: string;           // "Pre/post quasi-experimental with control group"
  primaryMetric: string;                    // "Normalized learning gain (Hake's g = 0.42)"
  confidenceInterval: string;               // "95% CI [0.38, 0.46], p < 0.001"
  documentedLimitations: string[];          // e.g. "Evaluated only on linear algebra units"
  claimOwner: string;                       // Lead Psychometrician / Research Director
  approvedAt: string;                       // ISO 8601 timestamp
  expiryDate: string;                       // Valid for max 12 months before revalidation
}
```

---

## 3. Disallowed Efficacy Claims (Strict Prohibition)

The following categories of marketing claims are **strictly barred**:
1. **Unqualified Universal Claims:** *"YOUVA guarantees top exam grades for all students."*
2. **Unsupported Extrapolations:** Applying Middle School algebra findings to Early Learner literacy.
3. **Selective Cherry-Picking:** Citing top 5% student outcomes while omitting cohort median performance.
4. **Unverified Comparative Denigration:** Claiming quantitative superiority over named competitors without peer-reviewed joint benchmarks.
