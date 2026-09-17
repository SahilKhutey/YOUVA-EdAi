# YOUVA-EdAI Pilot Protocol, Roles & Operational Procedures (N9.2 – N9.12)

**Document Reference**: `DOC-YOUVA-N9-PROTOCOL-ROLES`  
**Evaluation Cycle**: N9 — Closed Pilot Execution  
**Target Organization**: Modern School, Vasant Vihar, New Delhi  
**Tenant ID**: `tenant-modern-school`  
**Status**: `ACTIVE / OPERATIONAL-PILOT-AUTHORIZED`  

---

## 1. Pilot Cohort Definition (N9.2)

- **Cohort Size**: 24 enrolled Grade 8 learners (Target range: 15–30).
- **Curriculum Domain**:
  - **Mathematics**: Chapter 1: Rational Numbers (Operations, Commutativity, Associativity, Representation on Number Line), Chapter 2: Linear Equations in One Variable.
  - **Science**: Chapter 8: Cell — Structure and Functions (Plant vs Animal cells, Organelles), Chapter 11: Force and Pressure.
- **Pilot Duration**: 10 school operating days (2 calendar weeks), 45 minutes/day per student.
- **Scope Boundary**: Strictly isolated MVP. No high school tiers, no foreign languages, no unvetted community forums, and no automated grade alterations.

---

## 2. Pilot Roles & RACI Governance (N9.3)

| Role Title | Designated Individual | Primary Statutory Responsibility | RACI Scope |
|:---|:---|:---|:---|
| **Pilot Product Owner** | S. Khutey | Educational value hypothesis, scope control, pilot roadmap | **Accountable (A)** |
| **Pilot Operations Lead** | A. Mathur | Day-to-day session orchestration, attendance, lab readiness | **Responsible (R)** |
| **Lead Educator / Teacher** | Sunita Sharma | Pedagogical review, AI recommendation authorization/override | **Responsible (R)** |
| **Safety Reviewer** | Rajesh Mehra | 24/7 safety flag triage queue, crisis routing, incident logs | **Accountable (A)** |
| **Technical Owner** | Dev Lead | Infrastructure stability, PostgreSQL/Redis, API latency, SLOs | **Responsible (R)** |
| **Data & Evaluation Owner** | Dr. P. Rao | Data quality validation, learning gain statistics, metrics | **Responsible (R)** |
| **Support Contact** | Helpdesk Desk | Tier-1 usability, password reset, workstation troubleshooting | **Consulted (C)** |
| **Legal / Privacy Owner** | Adv. S. Roy | DPDP Act 2023 compliance, parent consent verification | **Informed (I)** |

---

## 3. Learner Onboarding Protocol (N9.4)

Every learner completes an eight-stage controlled onboarding sequence before accessing active learning activities:

```
[ Eligibility Check ] 
       │ (Enrolled Grade 8 at Modern School, active school ID)
       ▼
[ DPDP Parental Consent ]
       │ (Digital double-opt-in, verified phone OTP, signed privacy notice)
       ▼
[ Account Provisioning ]
       │ (Tenant-scoped user creation, salted bcrypt PIN setup)
       ▼
[ Baseline Profile ]
       │ (Self-reported subject confidence, preferred visual learning modality)
       ▼
[ Diagnostic Assessment ]
       │ (10 adaptive items spanning foundational Math & Science prerequisites)
       ▼
[ Learning Objective Lock ]
       │ (Rational Numbers Mastery: Target $M \ge 0.85$)
       ▼
[ Orientation Walkthrough ]
       │ (5-minute interactive tutorial on Socratic dialogue and hint requests)
       ▼
[ Session 1 Handshake ]
       │ (Authorization token issued, state machine transitions to INSTRUCTION)
```

**Pre-Learning Verification Checklist**:
- [x] Correct learner identity verified against school registrar roster.
- [x] Correct tenant binding (`tenant-modern-school`) confirmed.
- [x] Valid parental consent record linked in database with cryptographic timestamp.
- [x] Grade 8 NCERT content version `1.0.0` locked.

---

## 4. Baseline Assessment Protocol (N9.5)

Before commencing instruction, all 24 learners complete a 10-item diagnostic test measuring:
1. **Prerequisite Mastery ($M_0$)**: Prior knowledge of fractions, integers, basic algebraic balancing, and elementary biology.
2. **Item Response Time**: Median baseline seconds per item.
3. **Initial Guessing Behavior / Confidence Index**: Self-assessed 1–5 confidence score before answer submission.

*Data Boundary Note*: Raw baseline scores are immutably archived as `dataset_pilot_baseline_20260917.json` with SHA-256 hash. No post-hoc manipulation of baseline data is permitted.

---

## 5. Real Learning Loop Execution (N9.6, N9.7)

The core learner operating loop executes strictly through the 7-step pedagogical state machine:

```
┌────────────────────────────────────────────────────────────────────────┐
│                        LEARNING OPERATING LOOP                         │
│                                                                        │
│   [ DIAGNOSTIC ] ──> [ INSTRUCTION ] ──> [ PRACTICE ] ──> [ ASSESSMENT ]
│                             ▲                  │               │       │
│                             │                  ▼               │       │
│                             └─── [ REMEDIATION ] <─────────────┘       │
│                                                                        ▼
│                                                                  [ COMPLETE ]
└────────────────────────────────────────────────────────────────────────┘
```

**Daily Operations Invariants**:
1. **Session Lifecycle**: Each session begins with `POST /learning/session` and terminates with `POST /learning/session/:id/complete`.
2. **Deterministic Mastery Updates**:
   $$M_t = M_{t-1} \cdot 0.85 + S_t \cdot 0.15$$
3. **Socratic AI Interaction**: Direct answers are blocked; students receive targeted scaffolding hints (Levels 1–3).
4. **Operations Monitoring Desk**: Monitors real-time sessions for:
   - Abandoned sessions ($> 15$ min inactivity).
   - Rapid failure loops ($3+$ consecutive incorrect attempts on same concept).
   - Unexpected state skips (blocked by `LearningStateGuard`).

---

## 6. Teacher Operating Loop & Human-in-the-Loop Control (N9.8, N9.9)

Teachers govern all consequential learning interventions via the Teacher Cockpit:

```
[ Teacher Cockpit Radar ]
           │
           ▼
[ Identify Struggling Learner ] (e.g. Rohan: Rational Number Division $M < 0.40$)
           │
           ▼
[ AI Recommendation Generated ] (e.g. "Assign Fraction Inversion Scaffolding Module")
           │
           ▼
┌───────────────────────────────────────────────┐
│             TEACHER REVIEW GATE               │
├──────────────────────┬────────────────────────┤
│ AUTHORIZE            │ Assigns recommended module              │
├──────────────────────┼────────────────────────┤
│ MODIFY               │ Adjusts problem difficulty or item count│
├──────────────────────┼────────────────────────┤
│ REJECT / OVERRIDE    │ Manually prescribes custom intervention │
└──────────────────────┴────────────────────────┘
           │
           ▼
[ Cryptographic Audit Record Written ]
```

**Evaluative Metric**: Every authorization, modification, and rejection is tracked. High override rates indicate model misalignment and are analyzed directly in the AI quality review.

---

## 7. Parent & Guardian Experience (N9.10)

- **Parent Portal Access**: Dedicated login restricted by verified phone number and relationship token.
- **Progress Visibility**: Displays learning goals, modules mastered, total practice time, and teacher notes.
- **Privacy Boundary**: Raw student prompt text and granular mistake logs are strictly protected; parents receive aggregated conceptual mastery digests.
- **Consent Control**: Parents can view or revoke DPDP consent at any time, immediately halting AI learning sessions.

---

## 8. Safety Monitoring & Escalation Protocol (N9.11)

- **Pre-execution & Post-execution scanning**: Every input/output is evaluated by `SafetyService` against harmful corpora (Self-harm, bullying, violence, inappropriate content).
- **Crisis Response Protocol**:
  - Severity 4 (Self-harm / Crisis): Instant session pause ($< 50$ms), supportive helpline presentation (Childline 1098, Tele-MANAS 14416), automated urgent alert to Safety Reviewer and School Counselor.
  - Severity 1–3 (Language / Off-topic): Polite automated redirection, flag queued for daily moderator batch review.

---

## 9. Automated Pilot Pause Conditions (N9.12)

The pilot operations lead or automated monitoring triggers an **IMMEDIATE PILOT PAUSE** upon detecting any of the following conditions:
1. **P0 Security Incident**: Any unauthenticated access or vulnerability exploitation.
2. **Cross-Tenant Data Exposure**: Any leakage of learner records across tenant boundaries.
3. **Mastery Corruption**: Any systematic anomaly resulting in non-computable or out-of-bounds mastery values ($M \notin [0, 1]$).
4. **Consent Bypass**: Any student learning session executing without verified active parental consent.
5. **Critical Safety Failure**: An unintercepted, unmoderated high-severity harm interaction.
6. **Unauthorized Consequential AI Action**: AI altering curriculum assignment or grade without teacher sign-off.
7. **Audit Ledger Break**: Cryptographic HMAC SHA-256 chain verification failure.
