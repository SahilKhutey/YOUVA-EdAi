# YOUVA-EdAI — Phase 3: Classroom Closed Pilot Protocol & Methodology

**Partner Institution**: Delhi Public School, Sector XII, R.K. Puram, New Delhi  
**Target Audience**: Grade 8 Mathematics (CBSE / NCERT Curriculum)  
**Topic**: Linear Equations in One Variable  
**Trial Duration**: 3 Weeks (August 10, 2026 – August 30, 2026)  
**Trial Ethics & Compliance**: DPDP Act 2023 §9, Institutional Ethics Board (DPS-IRB-2026-04)  

---

## 1. Pilot Objectives & Hypotheses

1. **Pedagogical Calibrated Pacing (BKT)**:
   - *Hypothesis*: The 4-parameter Corbett & Anderson BKT model maintains student practice within the Zone of Proximal Development ($0.35 \le P(\text{correct}) \le 0.75$), generating an average mastery growth $\ge +0.30$ over 30 practice items.
2. **Teacher Trust & Friction Minimization**:
   - *Hypothesis*: By providing authoritative override controls and uncluttered recommendation feeds, teachers will actively adopt the system rather than "routing around" it (target: $< 5.0\%$ bypass rate).
3. **Fail-Closed Privacy & Safeguarding**:
   - *Hypothesis*: The platform operates with zero PII leaks in telemetry, 100% verifiable parental consent compliance, and zero unresolved safety events.

---

## 2. Participant Recruitment & Consent Procedures

- **Sample Size**: 30 students across two Grade 8 sections (Section 8-A: 15 students, Section 8-B: 15 students).
- **Educator Cohort**:
  - Mrs. Ritu Sharma (Head of Middle School Mathematics, Grade 8-A)
  - Mr. Vikram Seth (Senior Mathematics Faculty, Grade 8-B)
- **Consent Protocol**:
  - Out-of-band 6-digit OTP verified via SMS/Email to registered parents/guardians.
  - Active consent status `VERIFIED` with SHA-256 HMAC cryptographic evidence tokens linked in the pilot cohort manifest.
  - Fail-closed invariant: Learners without verified consent were excluded from platform logins.

---

## 3. Telemetry Instrumentation

Telemetry collection adhered to the principle of **data minimization**:
- **Collected Signals**: Trial latency (ms), question difficulty parameter, prior/posterior mastery probabilities, hint expansions, teacher override events, teacher bypass events.
- **Excluded Signals**: Raw keystrokes, facial tracking, video/audio feeds, geolocation, IP addresses, pupil dilation or biometric telemetry.
- **Pseudonymization**: Client identifiers mapped to irreversible 17-character tokens (`anon_<sha256_hash>`).
