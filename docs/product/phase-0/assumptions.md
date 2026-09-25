# YOUVA EdAI — Phase 0 Core Assumptions & Dependencies

## 1. Technical Assumptions
- **BKT Applicability:** 4-parameter Bayesian Knowledge Tracing is sufficient to model student skill acquisition for Middle School linear equations without requiring opaque deep neural models.
- **Explainability:** Teachers can understand and trust BKT mastery states ($P(L_t)$) when paired with plain-language diagnostic explanations.
- **Latency Tolerance:** Step-by-step Socratic evaluation latency must remain under $1200\text{ms}$ to prevent student distraction.
- **Device Environment:** Pilot students have access to school computer lab desktop/laptop browsers (Chrome/Edge) or tablets with standard keyboards.

## 2. Pedagogical Assumptions
- **Curriculum Alignment:** Grade 7/8 linear equations provides a representative test bed for symbolic pre-algebra mastery.
- **Hint Hierarchy:** A 3-tier Socratic hint structure (Conceptual $\to$ Procedural $\to$ Bottom-out) reduces unproductive struggle without encouraging hint abuse.
- **Teacher Agency:** Real teachers want to see student friction points and will actively use override controls if the interaction takes $<10\text{ seconds}$.

## 3. Legal & Organizational Assumptions
- **DPDP Enforcement Status:** DPDP Act Section 9 principles guide data minimization, but exact rules and parental consent mechanisms must be formally advised by counsel.
- **Pilot Access:** The pilot school will provide access to an active classroom for a 4–6 week trial period without demanding commercial software licensing or complex LMS rostering.
