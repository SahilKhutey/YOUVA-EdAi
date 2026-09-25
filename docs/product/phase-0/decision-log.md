# YOUVA EdAI — Phase 0 Decision Log

## Canonical Decision Ledger

| ID | Decision | Status | Owner | Evidence Summary | Decision Date |
|:---:|---|:---:|---|---|:---:|
| **D01** | Launch Tier | PENDING | Product Lead | Investigation shows repo has seed data for Grade 8, but Middle School as a band is candidate. | — |
| **D02** | Jurisdiction | PENDING | Founder / Legal | Legal review is a blocking dependency; obligations under DPDP Act must be formally assessed. | — |
| **D03** | Launch Model | PENDING | Founder | Requires confirmation of actual pilot school vs. family recruitment access. | — |
| **D04** | Subject/Grade/Curriculum | PENDING | Content Lead | Candidate: Math Grade 7/8 CBSE; exact units await pilot teacher syllabus alignment. | — |
| **D05** | Content Sourcing | PENDING | Content Lead | Candidate: Hybrid (NCERT OER stems + in-house Socratic hints). | — |

## Decision Status Values
- `PENDING`: Candidate identified, awaiting evidentiary confirmation or pilot matching.
- `IN_REVIEW`: Active legal, pedagogical, or partner scrutiny in progress.
- `DECIDED`: Formally agreed by owner and verified with documentary evidence.
- `BLOCKED`: Dependency unresolved (e.g. pending legal counsel opinion).
- `REOPENED`: Previously decided item under active revision due to new empirical facts.

---

## D01 — Launch Tier

### Proposed Decision
Middle School (Grades 6–8). Candidate Grade: Grade 7 or Grade 8.

### Rationale
The MVP requires an age-appropriate learning experience with a manageable safety and autonomy profile while maximizing reuse of the existing learning architecture. Middle School is proposed because the existing learning architecture is materially closer to this audience than the Kindergarten/Junior experience, while avoiding the higher autonomy and examination-oriented requirements associated with High School.

### Repository Evidence (Audited on 2026-09-25)
- `README.md` (Line 13): Mentions "spanning learners ages 3 to 18+ (Preschool, Elementary, Middle School, High School, and Skills Ecosystem)".
- `backend/prisma/seed.ts` (Lines 12, 84, 93, 205-223): Hardcoded for `Grade 8-A Mathematics` and `Grade 8-B Mathematics`, referencing `phase1/content/grade8_linear_equations_bank.json`.
- `backend/prisma/schema.prisma` (Line 18): `User.gradeLevel String?` exists as an unconstrained attribute.
- `frontend/app/`: Exists `student/` and `teacher/` and `junior/` routes.

### Explicitly Deferred
- Kindergarten & Junior (Pre-School Ages 3–7 & Elementary Ages 7–12)
- High School (Ages 15–18)

### Owner
Product Lead

### Status
PENDING (Awaiting formal lock of exact Grade 7 vs Grade 8 with pilot educator)

---

## D02 — Launch Jurisdiction

### Proposed Decision
India (Digital Personal Data Protection Act, 2023).

### Rationale
Pilot school and candidate cohorts are geographically located in India. However, DPDP Act 2023 applicability, rules notification, and Section 9 obligations must be verified by licensed counsel rather than presumed.

### Required Legal Review
- Blocking artifact: `docs/compliance/phase-0/legal-review.md`
- Outside Counsel: Licensed Technology Law Practice (to be engaged).

### Owner
Founder / Legal Advisor

### Status
PENDING (Blocking on legal counsel review)

---

## D03 — Launch Model (B2B vs B2C)

### Proposed Decision
B2B School-First.

### Rationale
Testing the core hypothesis ("AI recommends, human teacher authorizes") requires an active, embedded classroom teacher. A direct-to-consumer launch lacks an authoritative teacher in the daily loop.

### Required Evidence
- Written confirmation of pilot classroom access (Delhi Public School or equivalent).
- Teacher participation agreement.

### Owner
Founder

### Status
PENDING (Awaiting signed partner confirmation letter)

---

## D04 — Subject, Grade & Curriculum Scope

### Proposed Decision
Mathematics, Middle School (NCERT / CBSE standard). Candidate: Simple Equations / Linear Equations.

### Rationale
Objectively gradable symbolic steps; clear BKT prerequisite sequence; high educational anxiety cliff.

### Required Evidence
- Syllabi mapping against the pilot school's active term calendar.

### Owner
Content Lead

### Status
PENDING (Awaiting syllabus alignment with pilot teacher)

---

## D05 — Content Sourcing

### Proposed Decision
Hybrid (Open NCERT curriculum stems + In-house Socratic progressive hint authoring).

### Sizing Estimate
- Volume: 50 items (40 practice, 5 diagnostic, 5 remediation).
- Budget: $2,500 – $3,500 USD (₹2,00,000 – ₹2,80,000 INR).
- Timeline: 3 weeks.

### Owner
Content Lead

### Status
PENDING
