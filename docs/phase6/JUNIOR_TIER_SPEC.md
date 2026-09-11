# YOUVA-EdAi: Phase 6 Junior Tier Specification

## 1. Scope & Target Age Band
Phase 6 defines the technical and pedagogical architecture for the Early Childhood / Foundational Tier (ages 4–6, UKG / Grade 1 / Foundational Stage under NEP 2020 / NIPUN Bharat).

---

## 2. Hard Technical AI Content Guardrails
Under DPDP Act 2023 §9, educational AI agents operating in early childhood are subjected to hard, non-negotiable boundaries:

### 2.1 Lexicon Restriction
- Content prompts must be composed strictly from words in the **Certified Early Childhood Vocabulary** (`early_lexicon.json`).
- Open-ended LLM synthetic hallucinations or unconstrained chatbot conversational loops are **strictly prohibited**.

### 2.2 Readability & Prompt Length
- Maximum prompt length: **$\le 8$ words**.
- Flesch-Kincaid Grade Level: **$\le 1.0$**.
- No complex subordinate clauses, semicolons, or parentheticals.

### 2.3 Prohibition of Dark Patterns
- **No Urgency Cues**: "Hurry", "quick", "faster", "time is running out" are banned.
- **No Loss Framing**: Streak loss threats, points deductions, or "fail" language are banned.
- **No Commercial Nudges**: In-app purchases, diamond/coin upgrades, or monetization hooks are blocked at the schema level.

### 2.4 Mandatory 15-Minute Screen-Time Limit
- Continuous interactive screen time is capped at **15.0 minutes**.
- Exceeding 15 minutes triggers a compulsory lockout and a 10-minute non-digital physical/rest break.

---

## 3. Parent Co-Pilot Supervisory Terminal (`/parent/copilot`)
Early childhood learners require adult scaffolding and presence.
- **Real-time Mirroring**: All synthesized speech prompts and child tap selections are mirrored in real time to the parent's device.
- **Parental Unilateral Kill Switch**: Parents can pause or immediately terminate sessions with zero latency.
- **Pedagogical Co-Play Guidance**: Delivers constructive physical co-play prompts (e.g., finger counting, real-world object matching) to reinforce digital learning offline.
