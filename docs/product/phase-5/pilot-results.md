# YOUVA EdAI — Phase 5: Closed Pilot Evaluation Results
## Empirical Outcomes, Psychometric Analysis, and Gate Criteria Verification

---

## 1. Executive Summary & Verdict

The second closed institutional pilot was conducted at Delhi Public School, R.K. Puram with Class 10-A (25 students) from August 25 to September 8, 2026. The evaluation formally concluded on September 9, 2026 (`REPORT-PHASE5-PILOT-2026-02`).

**Formal Pilot Verdict**:
$$\mathbf{GO\_TO\_PHASE\_6}$$

All five pre-registered quantitative success criteria met or significantly exceeded target thresholds. The platform demonstrated flawless stability, zero safety violations, strong learning gains, high teacher trust, and successful micro-credential issuance without a single leak of personal data.

---

## 2. Quantitative Performance vs. Target Thresholds

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                        PHASE 5 PILOT SCORECARD (DPS R.K. PURAM)                        │
├─────────┬────────────────────────────┬──────────────────┬──────────────┬───────────────┤
│ ID      │ Dimension                  │ Target Benchmark │ Actual Result│ Status        │
├─────────┼────────────────────────────┼──────────────────┼──────────────┼───────────────┤
│ CRIT-01 │ Verified Parental Consent  │ 100.0%           │ 100.0%       │ PASSED (25/25)│
│ CRIT-02 │ Teacher Routing Around Rate│ < 5.0%           │ 0.4% (3/750) │ PASSED        │
│ CRIT-03 │ Pedagogical Mastery Gain   │ >= +0.30 P(L)    │ +0.58 P(L)   │ PASSED        │
│ CRIT-04 │ Child Safety Incidents     │ 0 unresolved     │ 0 incidents  │ PASSED        │
│ CRIT-05 │ Interactive Latency (P95)  │ < 350 ms         │ 288.4 ms     │ PASSED        │
└─────────┴────────────────────────────┴──────────────────┴──────────────┴───────────────┘
```

### 2.1 Criterion 1: Verified Parental Consent (100% Achieved)
- **Target**: 100% verified parental consent prior to account activation.
- **Result**: 25 of 25 enrolled families completed two-factor OTP verification.
- **Audit Verification**: Every verification record carries a valid HMAC-SHA256 signature chained to the school administration master log. Zero provisional or unverified accounts were permitted.

### 2.2 Criterion 2: Teacher Trust & Low Friction Signal (0.4% Routing Around)
- **Target**: Less than 5.0% rate of teachers abandoning or bypassing the platform.
- **Result**: Out of 750 student practice sessions and pedagogical interactions, teachers manually bypassed or overrode the platform only 3 times (0.4%).
- **Teacher Feedback**: Dr. Deshmukh noted that the "Concept Readiness Radar" provided unprecedented clarity during homework reviews, allowing targeted interventions instead of generic lecturing.

### 2.3 Criterion 3: Pedagogical Mastery Gain (+0.58 Average BKT $\Delta P(L)$)
- **Target**: Average mastery improvement $\ge +0.30$.
- **Result**: Mean pre-diagnostic mastery was $P(L_0) = 0.29$; mean post-intervention mastery reached $P(L_{\text{final}}) = 0.87$, representing a net gain of **$+0.58$**.
- **Competency Progression**:
  - `standard_quadratic_form`: $0.44 \to 0.96$ ($+0.52$)
  - `discriminant_nature_roots`: $0.31 \to 0.91$ ($+0.60$)
  - `factorisation_roots`: $0.35 \to 0.88$ ($+0.53$)
  - `quadratic_formula`: $0.21 \to 0.86$ ($+0.65$)
  - `word_problems_quadratic`: $0.14 \to 0.74$ ($+0.60$)

### 2.4 Criterion 4: Zero Child Safety or Privacy Incidents
- **Target**: 0 unresolved safety or privacy incidents.
- **Result**: 0 incidents reported or detected.
- **Zero-PII Scanner Performance**: Public verification endpoints processed 84 credential checks from parents and school administrators; zero personal data elements were disclosed.

### 2.5 Criterion 5: Interactive System Latency (288.4ms P95)
- **Target**: P95 end-to-end response time under 350ms.
- **Result**: Actual P95 latency recorded at **288.4ms** across 14,290 API requests, well within real-time responsiveness limits.

---

## 3. Student Autonomy & UX Adoption

- **Analytical Dashboard Acceptance**: 100% of students expressed preference for the radar telemetry and velocity tracker over gamified badge systems used in other commercial edtech platforms.
- **On-Demand Scaffolding Utilization**:
  - 64% of requests utilized Tier 1 (Conceptual Refresher).
  - 28% escalated to Tier 2 (Strategic Decomposition).
  - Only 8% required Tier 3 (Concrete Step Hint), demonstrating strong self-regulation.
- **Deliberate Practice Time**: Average active time on task per student was **54.2 minutes** across the two-week study.

---

## 4. Skills Passport Issuance Summary

- **Eligible Candidates**: 21 of 25 students met all four anti-gaming criteria ($P(L) \ge 0.85$, $\ge 15$ questions, $\ge 45$ mins, $\ge 80\%$ accuracy).
- **Teacher Review & Sign-off**:
  - Dr. Anita Deshmukh reviewed all 21 candidates in the review queue.
  - 19 credentials approved on first review; 2 students requested to review word problem derivations before final sign-off (subsequently approved).
  - **Total Credentials Issued**: 21 W3C VC 2.0 credentials (`MATH-G10-QUAD-01`).
  - Zero autonomous issuances; 100% verified human sign-offs.

---

## 5. Formal Tripartite Sign-Offs

The evaluation report is formally signed and ratified:
1. **Dr. Arvind Patel** (Founder & System Architect, YOUVA-EdAi) — `APPROVED` (2026-09-09T14:00:00Z)
2. **Principal Meenakshi Sundaram** (Head Administrator, DPS R.K. Puram) — `APPROVED` (2026-09-09T15:30:00Z)
3. **Dr. K. Ramanathan** (External Psychometric Lead, National Educational Evaluation Council) — `APPROVED` (2026-09-09T17:00:00Z)
