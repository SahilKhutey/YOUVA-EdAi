# YOUVA EdAI — Phase 6: Early Learner Pilot Partner Plan
## Institutional Deployment Protocol, Primary Cohort Recruitment, and Parent Co-Pilot Onboarding

---

## 1. Pilot Partner Profile & Selection Criteria

Phase 6 executes its primary school deployment in collaboration with the Junior Wing of our validated pilot partner:
- **Partner Institution**: Delhi Public School (Junior Wing, East of Kailash / R.K. Puram Primary Annex), New Delhi.
- **Target Grade Band**: Grade 3 (Ages 8–9).
- **Target Cohort Size**: 20 students with active parental participation.
- **Lead Primary Educator**: Mrs. Sangeeta Verma (Primary Math Coordinator, 14 years foundational stage experience).
- **Supervising Child Psychologist**: Dr. Priya Deshpande (Independent Child Wellbeing & Digital Safety Council).

---

## 2. Parent Co-Pilot Participation Requirements

Unlike secondary school pilots where parental interaction is limited to consent and aggregate progress reviews, Phase 6 mandates **active parent accompaniment**:
1. **Mandatory Onboarding Briefing**: Prior to deployment, parents attend a 45-minute virtual workshop explaining the Parent Co-Pilot interface, the 15-minute screen-time cap, and how to use the unilateral pause/kill switch.
2. **Two-Factor Verified Parental Consent (VPC)**: All 20 parent participants must complete the cryptographic 6-digit OTP verification process under DPDP Act 2023 §9.
3. **Session Accompanying Guideline**: Parents are instructed to observe their child during the 15-minute session in `PARENT_ASSISTED` mode, offering physical encouragement without completing the touch/voice activities on the child's behalf.

---

## 3. Classroom & Home Deployment Environments

```
┌──────────────────────────────────────┐      ┌──────────────────────────────────────┐
│ Environment A: Primary Computer Lab  │  vs  │ Environment B: Home Family Setting   │
│ - Supervised by Mrs. Sangeeta Verma  │      │ - Accompanied by Parent Co-Pilot     │
│ - Shared Android Tablets (10-inch)   │      │ - Household Smartphone / Tablet      │
│ - Headsets with directional mic      │      │ - Quiet room / low background noise  │
│ - 15-minute scheduled practice block │      │ - Real-time parental audio mirror    │
└──────────────────────────────────────┘      └──────────────────────────────────────┘
```

### 3.1 Hardware & Acoustic Baseline
- **Devices**: Android tablets running Chrome / PWA with Web Audio API support.
- **Microphone Sensitivity**: Automatic gain control (AGC) and noise suppression enabled to minimize background classroom chatter from contaminating STT input.
