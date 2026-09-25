# YOUVA EdAI — Phase 5: High School Closed Pilot Plan
## Second Closed Institutional Pilot Protocol: Delhi Public School, R.K. Puram (Grade 10 Mathematics)

---

## 1. Pilot Mission & Institutional Context

Following the successful Phase 3 Middle School pilot, Phase 5 executes the **Second Closed Institutional Pilot**. The objective is to validate platform generalization and the new High School capabilities:
1. Reusability of core BKT and DAG infrastructure for secondary school curricula.
2. Efficacy of the adolescent analytical UX (anti-gamification, student agency).
3. Practical operationalization of the W3C VC 2.0 Skills Passport with human teacher authorization.

### 1.1 Institutional Partner Profile
- **Institution**: Delhi Public School, Sector XII, R.K. Puram, New Delhi.
- **CBSE Affiliation Number**: `CBSE-AFF-2730017`.
- **Target Cohort**: Class 10-A (25 adolescent students, ages 14–16).
- **Faculty Leads**:
  - Dr. Anita Deshmukh (Senior Mathematics Faculty, Override Certified)
  - Mr. Rajesh Nair (Head of Department, Mathematics)
- **Deployment Period**: August 25, 2026 – September 8, 2026 (14-day window).

---

## 2. Pilot Architecture & Schedule

```
Day 1 (Aug 25)      Days 2–11 (Aug 26 – Sep 4)     Days 12–13 (Sep 5–6)     Day 14 (Sep 7–8)
┌──────────────┐    ┌──────────────────────────┐    ┌────────────────────┐    ┌─────────────────┐
│ Diagnostic   │ -> │ Deliberate Practice &    │ -> │ Formative Post-    │ -> │ Skills Passport │
│ Baseline     │    │ Dynamic Scaffolding      │    │ Assessment & Review│    │ Authorization   │
│ Battery      │    │ (Adolescent UX Dashboard)│    │ (Teacher Override) │    │ & Verification  │
└──────────────┘    └──────────────────────────┘    └────────────────────┘    └─────────────────┘
```

### 2.1 Daily Protocol Breakdown
- **Day 1: Baseline Diagnostic**:
  - Execution of 5-item calibrated diagnostic assessment (`phase5/content/grade10_diagnostic_assessment.json`).
  - Establishment of initial BKT mastery state vector across all 6 DAG nodes.
- **Days 2–11: Deliberate Practice Sessions**:
  - Daily 30-minute practice blocks in school computer lab and home study.
  - Students utilize the analytical dashboard, track learning velocity, and target DAG competencies.
  - Teachers monitor real-time cohort readiness radar via Teacher Cockpit.
- **Days 12–13: Summative Synthesis & Whiteboard Challenge**:
  - Students complete advanced modeling word problems (`word_problems_quadratic`).
  - Teachers conduct brief in-person problem-solving check to corroborate algorithmic readiness.
- **Day 14: Skills Passport Issuance & Zero-PII Export**:
  - Eligible students ($P(L) \ge 0.85$, accuracy $\ge 80\%$, time $\ge 45\text{m}$, questions $\ge 15$) presented in Teacher Review Queue.
  - Faculty digitally signs and issues W3C VC 2.0 micro-credentials.

---

## 3. Strict Pre-Pilot Readiness Criteria

Before a single student interacted with the platform, the following gates were formally verified:

```
[Phase 0-4 Verified Baselines] ───> VERIFIED & LOCKED
[India DPDP Compliance Sign-off] ──> VERIFIED (Adv. Rajesh Nair, 2026-08-25)
[Parental Consent Verification] ──> 25/25 Parents Authenticated via 6-digit OTP
[Teacher Override Certification] ─> Dr. Anita Deshmukh & Mr. Rajesh Nair Certified
[Zero-PII Scanner Active] ────────> 100% of Endpoint Serializers Audited
```

---

## 4. Quantitative Evaluation Criteria

The Phase 5 Pilot is bound to 5 strict quantitative criteria for exit authorization (`phase5/schemas/pilot_report.schema.json`):

| Metric ID | Criterion Name | Target Threshold | Measuring Instrument |
|---|---|---|---|
| **CRIT-P5-01** | Verified Parental Consent (VPC) | **$100\%$** (25/25 students) | Cryptographic OTP log audit (`pilot_cohort_manifest.json`) |
| **CRIT-P5-02** | Teacher Trust & Bypass Rate | **$< 5.0\%$** routing around rate | Teacher override and session monitoring telemetry |
| **CRIT-P5-03** | Pedagogical Efficacy (BKT Gain) | **$\ge +0.30$** average $\Delta P(L)$ | Pre-diagnostic vs Post-intervention BKT vector |
| **CRIT-P5-04** | Child Safety & DPDP Integrity | **$0$** unresolved safety incidents | Real-time safety escalation pipeline & DPDP audit log |
| **CRIT-P5-05** | Interactive Latency | **$< 350\text{ms}$** P95 response time | Backend APM server telemetry across all API calls |

---

## 5. Risk Management & Fallback Protocol

- **Network Instability**: Offline-tolerant local cache in Next.js client; syncs state seamlessly upon reconnection.
- **Student Frustration Threshold**: If a student experiences 3 consecutive incorrect attempts on intermediate concepts, progressive scaffolding automatically escalates to Tier 2 (Strategic Decomposition), and the teacher cockpit highlights an orange attention beacon.
- **Parental Revocation**: Immediate automated session termination with zero penalty to academic standing.
