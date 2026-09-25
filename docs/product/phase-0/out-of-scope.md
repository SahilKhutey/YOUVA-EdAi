# YOUVA EdAI — Phase 0 Explicit Out-of-Scope Exclusions

## The Inviolable Scope Fence

To guarantee delivery velocity and prevent architectural bloat during the MVP phase, the following features and systems are **strictly excluded** from Phase 0, Phase 1, Phase 2, and Phase 3:

```
┌────────────────────────────────────────────────────────────────────────┐
│                   EXPLICITLY OUT OF SCOPE FOR MVP                      │
├────────────────────────────────────────────────────────────────────────┤
│ ❌ Stripe Billing, Payments, & Paywalls (Repo P7)                     │
│ ❌ Multi-Tenant LMS/SIS Sync: Canvas, OneRoster, Clever, LTI 1.3 (P16)│
│ ❌ Autonomous AI Agents with Self-Authorizing Policy Engines (P9, P14)│
│ ❌ W3C Verifiable Credentials & OpenBadges 3.0 Skills Passport (P15)  │
│ ❌ Generative Image, Video, and Voice Media Pipelines (Repo P11)      │
│ ❌ Early Childhood (Pre-K/Elementary) and High School UIs & Curricula │
│ ❌ Multi-Tenant Database Sharding or Multi-Cloud Consensus            │
│ ❌ Open-Ended Free-Text Conversational Chatbot Interactions           │
│ ❌ Social Features: Peer Chat, Leaderboards, Public User Profiles     │
└────────────────────────────────────────────────────────────────────────┘
```

## Enforcement Mechanism
1. **Pull Request Boundary Filter:** Any PR on the `pilot/middle-school-mvp` branch touching directories related to the items above will be rejected.
2. **Codebase Freezing:** Existing backend modules corresponding to these exclusions (`subscription`, `interoperability`, `credential-network`, `multimodal`) will remain deactivated via environment flags (`PILOT_MODE=true`).
