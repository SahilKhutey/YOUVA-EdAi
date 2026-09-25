# YOUVA-EdAI — Strategy: MVP Boundary & Explicit Out-of-Scope Exclusions
## Canonical Strategy Document | Phase 0 Scope Lock

**Status:** RATIFIED & LOCKED  
**Core Principle:** *"Build the smallest thing that proves the hardest assumption first."*  
**Date Locked:** 2026-09-25  

---

## 1. What is IN Scope for MVP (Phase 1–3)

The MVP encompasses **only** the software required to validate the core learning loop and teacher trust:

1. **Diagnostic Assessment:** 5-question targeted pre-test calibrating initial prior $P(L_0)$.
2. **4-Parameter BKT Adaptive Practice Engine:** Real-time Bayesian Knowledge Tracing updating $P(L_t)$ per concept attempt.
3. **50-Item Psychometric Question Bank:** NCERT Grade 7 Linear Equations & Fractions with 3-tier Socratic hints and misconception remediation tags.
4. **Student Workspace UI:** Minimalist Middle School web client with equation scratchpad, step input, and Socratic hint drawer.
5. **Teacher Override Cockpit:** Real-time classroom ZPD distribution heatmap with one-click authoritative mastery overrides.
6. **Trust Boundary Layer:** Verifiable Parental Consent (VPC), 24-hr data erasure cascade, dual-channel safety escalation, and HMAC-SHA256 audit ledger.

---

## 2. Explicit Out-of-Scope List (The Scope Fence)

The following components—regardless of whether code already exists in the repository—are **strictly out of scope** and prohibited from being activated during MVP:

```
┌────────────────────────────────────────────────────────────────────────┐
│                   EXPLICITLY OUT OF SCOPE FOR MVP                      │
├────────────────────────────────────────────────────────────────────────┤
│ ❌ Stripe Billing, Subscriptions, & Paywalls (Repo P7)                 │
│ ❌ Institutional LMS/SIS Sync: Canvas, OneRoster, Clever, LTI 1.3 (P16)│
│ ❌ Autonomous AI Agents with Self-Authorizing Policy Engines (P9, P14) │
│ ❌ W3C Verifiable Credentials & OpenBadges 3.0 Skills Passport (P15)   │
│ ❌ Generative Image, Video, and Voice Media Pipelines (Repo P11)       │
│ ❌ Early Childhood (Pre-K/Elementary) and High School UIs & Curricula  │
│ ❌ Multi-Tenant Database Sharding or Multi-Cloud Consensus             │
│ ❌ Open-Ended Free-Text Conversational Chatbot Interactions            │
│ ❌ Social Features: Peer Chat, Leaderboards, Public User Profiles      │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 3. The Scope Fence Enforcement Rule

Any pull request or code change targeting the `pilot/middle-school-mvp` branch that introduces, activates, or touches any out-of-scope module will be **automatically rejected by CI and flagged as governance drift.**
