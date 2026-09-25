# YOUVA EdAI — Architectural Divergence Register

> **Document ID:** DOC-REC-007  
> **Status:** RATIFIED & LOCKED  
> **Gate:** Scope Reconciliation Gate (Cycle R0)  
> **Target Package:** `docs/product/reconciliation/`  
> **Related Documents:** [`DOC-REC-001`](file:///c:/Users/ASUS/Documents/Youva-EdAi/YOUVA-EdAi/docs/product/reconciliation/concept-repo-gap-analysis.md), [`DOC-REC-006`](file:///c:/Users/ASUS/Documents/Youva-EdAi/YOUVA-EdAi/docs/product/reconciliation/repository-capability-matrix.md)

---

## 1. Executive Summary

As a software system evolves from an early conceptual vision into an enterprise-grade production platform, divergences naturally arise between initial ideation documents and the actual working codebase. 

Divergences are not inherently defects. In high-stakes educational AI, most divergences represent **Legitimate Evolutionary Hardening**—essential security, privacy, pedagogical, and statutory safeguards introduced to protect children, comply with data sovereignty laws (e.g., India's Digital Personal Data Protection Act 2023), and guarantee teacher trust.

Conversely, other divergences represent **Genuine Technical Gaps or Incomplete Features** where initial vision has not yet been backed by concrete inference implementations.

This register formally logs, categorizes, justifies, and resolves every architectural divergence between the early concept notes and the repository reality.

---

## 2. Category A: Legitimate Evolutionary Hardening (Ratified Architectural Invariants)

These departures from early naive concepts were introduced deliberately and must be **strictly preserved**:

| Divergence ID | Initial Concept Vision | Repository Hardened Architecture | Rationale & Regulatory Justification |
| :--- | :--- | :--- | :--- |
| **DIV-HARD-001** | **Unconstrained Autonomous AI Tutor:** AI interacts directly with students without external oversight. | **Human Consequential Authority (INV-001):** AI can observe, assess, and recommend, but ONLY human teachers can resolve interventions, alter official mastery status, or override curriculums ([`backend/src/teacher-ops/services/teacher-intervention-ops.service.ts#L121`](file:///c:/Users/ASUS/Documents/Youva-EdAi/YOUVA-EdAi/backend/src/teacher-ops/services/teacher-intervention-ops.service.ts#L121)). | **Child Safety & Teacher Agency:** Prevents autonomous AI from trapping students in unverified loops or overriding human educators. Essential for institutional school adoption. |
| **DIV-HARD-002** | **Frictionless Onboarding:** Any student can register and start learning immediately with an email. | **Statutory Verifiable Parental Consent (INV-002):** Mandatory DPDP Act 2023 consent lifecycle before any learning transactions are processed ([`backend/src/learning/services/learning-transaction.service.ts#L45-L80`](file:///c:/Users/ASUS/Documents/Youva-EdAi/YOUVA-EdAi/backend/src/learning/services/learning-transaction.service.ts#L45-L80)). | **Legal Compliance:** Section 9 of India's DPDP Act 2023 criminalizes processing children's data without verifiable parental consent. Non-compliance risks shutdown and severe financial penalties. |
| **DIV-HARD-003** | **Single Global Database:** Unified learner state across all users. | **Cryptographic Multi-Tenant Isolation (INV-003):** Strict tenant context enforcement via `AsyncLocalStorage` and scoped database schemas ([`backend/src/tenants/tenant.context.ts#L12-L44`](file:///c:/Users/ASUS/Documents/Youva-EdAi/YOUVA-EdAi/backend/src/tenants/tenant.context.ts#L12-L44)). | **School Privacy & Security:** Schools and districts require total isolation of student records, grades, and behavioral data. Zero cross-tenant data leakage permitted. |
| **DIV-HARD-004** | **Standard Database Logging:** Appending audit entries to a regular SQL table. | **Cryptographic Forward-Chaining Audit Trail (INV-005):** HMAC-SHA256 hash chaining anchored to a genesis block ([`backend/src/audit/audit.service.ts#L37-L85`](file:///c:/Users/ASUS/Documents/Youva-EdAi/YOUVA-EdAi/backend/src/audit/audit.service.ts#L37-L85)). | **Tamper Evident Governance:** Prevents unauthorized internal tampering or deletion of safety incidents, consent grants, or grading overrides. |
| **DIV-HARD-005** | **Single Model Provider:** Hardcoded dependency on OpenAI or Gemini API. | **Tri-Tier Multi-Provider Gateway:** Fallback federation orchestrating Gemini 1.5 (Cloud) $\rightarrow$ Ollama/Llama 3 (Local OSS) $\rightarrow$ Deterministic Cache ([`backend/src/ai/gateway/ai-gateway.service.ts#L116-L162`](file:///c:/Users/ASUS/Documents/Youva-EdAi/YOUVA-EdAi/backend/src/ai/gateway/ai-gateway.service.ts#L116-L162)). | **Zero Downtime & Rural Resilience:** Protects schools from vendor lock-in, API price hikes, cloud outages, and allows offline rural classroom operation. |
| **DIV-HARD-006** | **Real-Time Generative Diagrams in Live Chat:** Student asks a question and an image diffusion model renders in live chat. | **Separation of Generation from Consumption:** Real-time generation in live chat is prohibited; generative media is produced offline, vetted by teachers, and cached on CDN ([`docs/product/reconciliation/multimodal-gap-analysis.md`](file:///c:/Users/ASUS/Documents/Youva-EdAi/YOUVA-EdAi/docs/product/reconciliation/multimodal-gap-analysis.md)). | **Pedagogical Latency & Child Protection:** Live image diffusion takes 3–8s (killing pedagogical momentum) and introduces severe visual hallucination and safety risks for children. |

---

## 3. Category B: Genuine Technical Gaps & Incomplete Scaffolding

These divergences represent areas where concept expectations exceeded current repository capability:

| Divergence ID | Concept Expectation | Repository Status | Root Cause | Target Resolution Phase |
| :--- | :--- | :--- | :--- | :--- |
| **DIV-GAP-001** | **Live Voice-to-Voice AI Dialogue:** Low-latency conversational audio interface. | Scaffolding exists with speech sanitization; STT and TTS return simulated strings and synthetic buffers ([`backend/src/multimodal/speech-recognition.service.ts#L35`](file:///c:/Users/ASUS/Documents/Youva-EdAi/YOUVA-EdAi/backend/src/multimodal/speech-recognition.service.ts#L35), [`speech-synthesis.service.ts#L47`](file:///c:/Users/ASUS/Documents/Youva-EdAi/YOUVA-EdAi/backend/src/multimodal/speech-synthesis.service.ts#L47)). | Prioritization of core BKT and governance engines over GPU runtime integration. | **Phase M1 & M2 (Multimodal STT/TTS)** |
| **DIV-GAP-002** | **Automated Explainer Video Synthesis:** AI creates animated video clips on demand. | Video modality routed to mock buffer generator (`Buffer.from('GENERATED_VIDEO_'...)`); no video render engine exists ([`backend/src/multimodal/media-generation.service.ts#L97`](file:///c:/Users/ASUS/Documents/Youva-EdAi/YOUVA-EdAi/backend/src/multimodal/media-generation.service.ts#L97)). | Video diffusion is computationally prohibitive; requires programmatic slide/SVG composer. | **Phase M5 (Explainer Video Pipeline)** |
| **DIV-GAP-003** | **Student Worksheet Handwriting OCR:** Student uploads homework photo; AI parses steps and detects errors. | Tenant isolation and OCR safety sanitization active; extraction returns hardcoded plant cell/fraction text ([`backend/src/multimodal/vision-understanding.service.ts#L38`](file:///c:/Users/ASUS/Documents/Youva-EdAi/YOUVA-EdAi/backend/src/multimodal/vision-understanding.service.ts#L38)). | Vision LLM API / local OCR pipeline unattached. | **Phase M3 (Vision Understanding)** |
| **DIV-GAP-004** | **Unified Age 3–24 Scope:** Single platform serving pre-school to university graduates. | Fragmented tier definitions; adult learners (18–24) referenced in landing page metadata (`frontend/app/layout.tsx:32`) with zero actual adult curriculum. | Ambiguous product positioning in early conceptual pitch. | **DOC-REC-003 & P6A/P6B:** Lock scope to K-12 (3–18); defer Higher-Ed. |
| **DIV-GAP-005** | **Pre-School Touch & Sound Experience:** Interactive UI for non-reading children. | Backend services exist (`preschool-learning.service.ts`), but frontend UI is currently text- and dashboard-centric for middle school. | Pilot Phase 3 focused on Grade 6–8 science/math baseline. | **Phase 6A & Phase M8** |

---

## 4. Formal Divergence Governance Invariant

No architectural divergence may be resolved by relaxing safety, privacy, or human-authority invariants. 

Any proposed resolution must conform to:
1. **Rule of Non-Degradation:** A gap resolution (e.g., adding Whisper STT or SDXL images) must operate entirely within the existing security, tenant-isolation, and teacher-review wrappers.
2. **Authoritative Evidence Standard:** Moving any item from Category B (Gap) to Resolved requires automated integration test evidence recorded in [`verification_evidence_registry.json`](file:///c:/Users/ASUS/Documents/Youva-EdAi/YOUVA-EdAi/governance/data/verification_evidence_registry.json).
