# YOUVA EdAI — Scope Reconciliation: Higher Education (18–24) Scope Decision
## Resolving Repository Marketing Artifacts, Legal Incompatibilities, and Strategic Focus

---

## 1. The Discrepancy & Issue Statement

In `frontend/app/layout.tsx:32`, the repository metadata contains the string:
```typescript
description: "Join the future of education. Personalized AI tutoring for students aged 12-24."
```
Furthermore, the Prisma schema contains `cognitiveLevel @default("TEEN") // CHILD, TEEN, ADULT`.

This creates ambiguity: **Is YOUVA EdAI building an adult higher-education / university platform (ages 18–24), or is it a dedicated primary and secondary school platform (K-12)?**

---

## 2. Authoritative Scope Decision

> **HIGHER EDUCATION (AGES 18–24) IS FORMALLY EXCLUDED FROM THE ACTIVE ROADMAP AND DEFERRED TO PHASE 11 / POST-INSTITUTIONAL SCALE.**
> 
> **YOUVA EdAI’s active product boundary is strictly locked to K-12 education (Ages 3–18): Pre-School, Elementary, Middle School, and High School.**

---

## 3. Rationale for Exclusion

### 1. Fundamental Legal & Consent Divergence
- **Minors (< 18 years):** Governed by strict child data protection laws (India DPDP Act 2023 §9, US COPPA, UK Age Appropriate Design Code). Verifiable parental consent is mandatory; automated profiling and targeted advertising are illegal.
- **Adults (18+ years):** Legal capacity transfers to the adult student. Parental oversight drops away; contracts are direct; data processing relies on standard adult terms of service. Mixing adult and minor data pipelines introduces severe compliance contamination risks.

### 2. Radical Pedagogical Divergence (Andragogy vs. Pedagogy)
- Primary/Secondary students require structured curricular scaffolding, cognitive load pacing, teacher supervision, and guided remediation.
- University students (undergraduates, graduate students, vocational adults) engage in unstructured self-directed inquiry, seminar research, thesis preparation, and vocational reskilling.

### 3. Institutional Procurement & Sales Incompatibility
- K-12 sales target school district superintendents, principals, parent associations, and state boards.
- Higher-Ed sales target university provosts, departmental deans, faculty senates, and enterprise corporate L&D budgets with completely distinct RFP and accreditation frameworks.

### 4. Conservation of Engineering Bandwidth
Simultaneously attempting to build university-level organic chemistry simulators or coding bootcamps while solving Pre-School voice-gesture safety and Middle School algebraic mastery would shatter engineering focus.

---

## 4. Immediate Repository Reconciliation Actions

1. **Metadata Cleanup:** Update `frontend/app/layout.tsx` to replace `"students aged 12-24"` with `"K-12 learners (ages 3–18)"`.
2. **Schema Integrity:** Deprecate `ADULT` from `cognitiveLevel` in `schema.prisma`; restrict active learner tiers to `PRE_SCHOOL`, `ELEMENTARY`, `MIDDLE_SCHOOL`, and `HIGH_SCHOOL`.
3. **Out-of-Scope Register:** Formally record Higher Education in `docs/strategy/mvp-boundary.md` as an explicit out-of-scope domain.
