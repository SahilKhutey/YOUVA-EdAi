# YOUVA EdAI — Phase 6: Codebase & Component Audit
## Readiness Assessment Across P1–P15 Subsystems and Early Learner Component Classification

---

## 1. Executive Summary & Audit Mandate

The Phase 6 codebase audit addresses a fundamental architectural question:
$$\mathbf{Can\ we\ reuse\ this\ without\ accidentally\ importing\ assumptions\ designed\ for\ older\ children?}$$

In Middle School (Phase 1–3) and High School (Phase 5), the system assumed:
1. Students can read written questions and explanations.
2. Students can type free text or manipulate algebraic equations.
3. Students have the metacognitive capacity to regulate their own screen time.
4. Voice interactions (if used) are merely speech-to-text input to a language model.
5. Micro-credentials (Skills Passport) motivate learner progress.

Every existing system in `backend/src/`, `frontend/`, and `phase5/` was audited against the developmental reality of 8–10 year old early learners and classified into one of seven architectural actions:

```
┌────────────────────────────────────────────────────────────────────────┐
│                        CLASSIFICATION TAXONOMY                         │
├─────────────────┬──────────────────────────────────────────────────────┤
│ REUSE           │ Usable without modification. Core mathematical logic.│
│ REUSE + POLICY  │ Usable only behind a mandatory Early Learner policy. │
│ REFACTOR        │ Code contains hardcoded assumptions; requires edits. │
│ ISOLATE         │ Keep separated; run inside sandbox or separate queue.│
│ REPLACE         │ Subsystem must be substituted with specialized tech. │
│ NEW             │ Completely new component built for Phase 6.          │
│ REMOVE          │ Entirely deactivated / blocked for Early Learner.    │
└─────────────────┴──────────────────────────────────────────────────────┘
```

---

## 2. Component-by-Component Audit & Classification

| Subsystem / Component | Current Location | Audit Findings & Older-Child Assumptions | Classification | Action Plan |
|---|---|---|---|---|
| **BKT Service** | `backend/src/learning-engine/services/bkt.service.ts` | 4-parameter BKT ($P(L_0), P(T), P(S), P(G)$) is mathematically sound, but default $P(G)=0.20$ is too low for 3-choice tap options ($P(G) \approx 0.33$). | **REUSE + POLICY** | Reuse BKT engine; inject age-specific parameter priors ($P(G)=0.33, P(S)=0.15$). |
| **Concept DAG Traversal** | `backend/src/knowledge-graph/graph-traversal.service.ts` | Acyclic topological sort and prerequisite tracking works independently of grade level. | **REUSE** | Ingest foundational numeracy DAG nodes without modifying traversal code. |
| **VPC Consent Service** | `backend/src/parent/` & `prisma/schema.prisma` | DPDP 6-digit OTP parental verification and HMAC audit ledger is robust and fully compliant. | **REUSE** | Leverage identical VPC verification flow prior to early learner session provisioning. |
| **Teacher Ops & Intervention** | `backend/src/teacher-ops/` | Assumes teachers assign complex written homework and inspect detailed error matrices. | **REUSE + POLICY** | Restrict teacher view to cohort foundational readiness; eliminate complex algebraic assignment tabs. |
| **AI Controller & Chat Gateway**| `backend/src/verified-learning/` & `ai.controller.ts` | **CRITICAL RISK**: Allows open-ended LLM prompting and generative chat responses. | **ISOLATE / REPLACE** | **Hard-block all conversational endpoints**. Replace with deterministic template resolver (`EarlyLearnerPolicyEngine`). |
| **Multimodal STT Service** | `backend/src/multimodal/speech-recognition.service.ts` | Uses general English Whisper/Google model; high error rate on young Indian child speech. | **REFACTOR** | Wrap in strict phonetic keyword matcher; route ambiguous audio to human review queue. |
| **Screen Time Enforcement** | *Did not exist in backend* | Middle/High school allowed indefinite session durations based on student self-regulation. | **NEW** | Implement `EarlyChildhoodContentGuard` 15-minute hard lockout timer. |
| **Parent Co-Pilot Mirror** | *Did not exist in backend* | Previous parent portal was async (viewing past grades), not real-time co-learning. | **NEW** | Implement `ParentCopilotSession` with WebSocket live transcript mirroring and unilateral kill switch. |
| **Skills Passport (VC 2.0)** | `phase5/models/skills_passport.py` | Micro-credentials have zero developmental meaning to 8-year-olds and induce parental pressure. | **REMOVE** | **Deactivate Skills Passport for Early Learner tier**. Micro-credentials remain exclusive to secondary school. |
| **Personalization Twin** | `backend/src/personalization/` | Cognitive twin models error attribution across complex multi-step reasoning. | **ISOLATE** | Deactivate complex cognitive twin for Early Learner; use simple prerequisite branch redirection. |

---

## 3. High-Risk Coupling & Remediation Summary

1. **De-coupling Open Chat**: `ai.controller.ts` was audited for fallback paths. When `tier == "EARLY_LEARNER"`, the route is intercepted by NestJS guard `EarlyLearnerPolicyGuard`, returning `403 Forbidden` if open chat is requested.
2. **Eliminating Skills Passport**: The W3C VC 2.0 issuance route explicitly rejects requests where student profile tier is `EARLY_LEARNER`. Early childhood learning focuses on joyful discovery, not credential accumulation.
3. **Screen Time Guarding**: Added server-side session termination at $t = 15.0\text{ minutes}$ regardless of client state.
