# YOUVA EdAI — Phase 9: District-Level Administration Specification (C10)
## Hierarchical Authority, k-Anonymity Data Bounds, and Privacy-Preserving Dashboards

---

## 1. Architectural Scope & Principles

District administration is activated only when institutional scale requires centralized oversight across multiple school campuses. The architecture enforces two fundamental rules:

1. **Strict Hierarchical Authority:** Data visibility narrows progressively as organizational scope expands.
2. **Privacy-Preserving Aggregations:** District leaders receive high-level pedagogical analytics. They are **strictly barred** from accessing identifiable student-level records without explicit school-level consent.

```
                   ORGANIZATIONAL HIERARCHY
                              │
                              ▼
                      DISTRICT ADMIN
                 (Aggregated Analytics Only)
                              │
                              ▼
                        SCHOOL ADMIN
                 (School-Level Cohort Data)
                              │
                              ▼
                           TEACHER
                 (Class & Authorized Students)
                              │
            ┌─────────────────┴─────────────────┐
            ▼                                   ▼
         PARENT                              STUDENT
    (Enrolled Child)                     (Self-State Only)
```

---

## 2. The k-Anonymity Guarantee (\(k \ge 10\))

To prevent student re-identification in small classes or specialized elective groups, `district_reporting.py` enforces a **\(k \ge 10\)** anonymity suppression rule:

```python
if student_count < self.k_threshold:
    return CohortMetric(
        competency_code=code,
        student_count=student_count,
        mean_mastery=0.0,
        mastery_pass_rate=0.0,
        teacher_review_compliance_rate=0.0,
        is_suppressed=True,
        suppression_reason=f"k-anonymity suppression: cohort size ({student_count}) < {self.k_threshold}"
    )
```

If a competency group or school cohort contains fewer than 10 students, all score dimensions (`mean_mastery`, `pass_rate`) are masked with zeros, preventing inferential re-identification of individual performance.

---

## 3. Forbidden PII Leakage Checks

District aggregate reports pass through automated PII field scanners before serialization. Any occurrence of individual identifiers (`studentname`, `email`, `phone`, `aadhaar`, `student_id`) immediately aborts report generation with `PIILeakageViolationError`.

### Permitted District Dashboard Metrics:
- Overall district mastery rate by grade band and curriculum standard.
- Curriculum pacing progress against state academic calendar benchmarks.
- Teacher review compliance percentage (pacing overrides and diagnostic audits).
- System availability, uptime, and student active engagement hours.
