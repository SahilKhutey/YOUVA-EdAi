# YOUVA-EdAI — Cycle N11 Multimodal Learning & Generation Charter
## Architectural Governance, Capability Scope Lock, Child Safety & Operational Limits

**Document Version:** 1.0.0-N11  
**Classification:** Authoritative Technical Standard & Ethical Governance Charter  
**Sign-off:** YOUVA Multimodal Review Board, Ethics Counsel & Academic Directorate  
**Date:** September 18, 2026  

---

## 1. Scope Lock & Capability Layers (Clause N11.2)

Multimodal learning capabilities in YOUVA-EdAi are partitioned into 6 strictly governed layers to ensure educational validity, reliability, and human safety:

```
┌───────────────────────────────────────────────────────────────────────────┐
│ Layer 6: Multimodal Orchestration (Text + Voice + Image + Audio + Video)  │
├───────────────────────────────────────────────────────────────────────────┤
│ Layer 5: Educational Video (Short demonstrations, simulations, < 60s)     │
├───────────────────────────────────────────────────────────────────────────┤
│ Layer 4: Audio Generation (Narration, pronunciation, read-aloud)          │
├───────────────────────────────────────────────────────────────────────────┤
│ Layer 3: Image Generation (Scientific diagrams, geometric visualizations) │
├───────────────────────────────────────────────────────────────────────────┤
│ Layer 2: Vision Understanding (Worksheet photos, handwriting OCR, charts) │
├───────────────────────────────────────────────────────────────────────────┤
│ Layer 1: Voice Learning (Speech-to-text, Voice tutor, Text-to-speech)     │
└───────────────────────────────────────────────────────────────────────────┘
```

**Scope Boundary Rules:**
1. No capability layer may bypass the central **Multimodal Gateway** or **Modality Router**.
2. Layer activation is controlled via granular feature flags (`VOICE_ENABLED`, `VISION_ENABLED`, `IMAGE_GENERATION_ENABLED`, `AUDIO_GENERATION_ENABLED`, `VIDEO_GENERATION_ENABLED`, `MULTIMODAL_TUTOR_ENABLED`).
3. Capability layers are enabled per tenant and per classroom based on educator authorization.

---

## 2. Child Safety & Pedagogical Boundaries (Clauses N11.39 & N11.40)

### 2.1 Child Protection Invariants
- **Age-Appropriate Language:** All system prompts, speech synthesizers, and generated materials must conform to reading and comprehension levels for Grades 6–10. Explicit, violent, sexually suggestive, or harmful content is blocked unconditionally.
- **Sensitive Attribute Prohibition:** Multimodal prompts and analysis are prohibited from inferring, storing, or evaluating learner race, ethnicity, nationality, religion, socioeconomic status, gender, or biometric health.
- **Non-Punitiveness in Voice Evaluation:** Speech recognition errors, regional accents, and hesitations must never be scored as conceptual errors. If speech confidence is low ($< 0.60$), the system must ask the learner to repeat or provide a text/multiple-choice alternative without penalty.

### 2.2 Deepfake, Identity & Impersonation Prohibition (Clause N11.40)
- **Face Generation Prohibition:** Generation of realistic human faces is strictly prohibited. Generated images are restricted to scientific diagrams, historical maps, physical models, and abstract illustrations.
- **Voice Cloning Prohibition:** Cloning real human voices, educators, historical figures, or celebrities is prohibited. Only certified, neutral educational speech synthesis voices are permitted.
- **Identity Simulation Prohibition:** The AI tutor may never claim to be a real human educator, counselor, or peer.

---

## 3. Media Security & Upload Safeguards (Clause N11.17)

All media ingested into the system must pass mandatory automated security controls:
1. **Magic Bytes Validation:**
   - `PNG`: `89 50 4E 47 0D 0A 1A 0A`
   - `JPEG`: `FF D8 FF`
   - `WAV`: `52 49 46 46` (`RIFF`)
   - `MP3`: `49 44 33` (`ID3`) or `FF FB`
   - `MP4`: `66 74 79 70` (`ftyp`)
2. **File Size Limits:**
   - Images: Max $5\text{MB}$
   - Audio recordings: Max $10\text{MB}$
   - Video clips: Max $50\text{MB}$
3. **MIME Type Allowlist:** `image/png`, `image/jpeg`, `audio/wav`, `audio/mpeg`, `video/mp4`. Client-provided file extensions and MIME headers are untrusted until verified against magic bytes.
4. **Path Traversal & Polyglot Defense:** Filenames are sanitized into cryptographically generated UUID keys (`media-<uuid>.<ext>`). Path separators (`..`, `/`, `\`) are strictly stripped. Polyglot files (e.g. zip/executable disguised as image) are immediately rejected and quarantined.
5. **Metadata Minimization (Clause N11.16):** All Exif metadata (GPS coordinates, camera serial numbers, device identifiers) are stripped prior to storage.

---

## 4. Cross-Modal Prompt Injection Defenses (Clauses N11.36 & N11.37)

External media provided by learners or third parties is classified as **untrusted data**:
- **OCR Text Isolation:** Text extracted from images or worksheets is encapsulated in safe structural delimiters (`<untrusted_learner_submission>`) and never concatenated directly into system instructions.
- **Instruction Boundary Filter:** Any text inside images or speech containing directives like `"ignore previous instructions"`, `"system prompt override"`, `"reveal passwords"`, or `"export database"` is neutralized by the pre-execution security filter.
- **Cross-Tenant Barrier:** Media storage keys are strictly bound to `tenantId`. Attempting to reference another tenant's media URL throws an immutable `ForbiddenException`.

---

## 5. Media Retention & Lifecycle State Machine (Clauses N11.48 & N11.49)

```
[CREATED] ──► [VALIDATING] ──► [MODERATING] ──► [APPROVED] ──► [PUBLISHED] ──► [ARCHIVED] ──► [DELETED]
     │              │               │
     └──────────────┴───────────────┴────────► [QUARANTINED]
```

### Retention Durations:
- **Temporary Uploads (Unverified):** 24 hours $\rightarrow$ Automatic Deletion.
- **Learner Voice Recordings:** 7 days $\rightarrow$ Automated deletion after mastery scoring.
- **Generated Educational Assets:** Permanent retention upon teacher approval, linked to immutable content version.
- **Quarantined Media:** 30 days retention in isolated cold storage for safety review $\rightarrow$ Permanent destruction.

---

## 6. FinOps Cost Ceilings & Budget Controls (Clauses N11.44 & N11.45)

Media generation is subject to strict deterministic cost controls:
- **Tenant Daily Budget:** $\$50.00$ daily spend ceiling.
- **Tenant Monthly Budget:** $\$500.00$ monthly spend ceiling.
- **Per-Request Cost Tracking:** Every generation logs provider, model, input size, output duration, and exact cost in USD.
- **Budget Exhaustion Graceful Fallback:** When a tenant reaches $90\%$ of budget, warnings are emitted. At $100\%$, media generation is paused, and the system automatically falls back to cached educational diagrams and text alternatives with zero disruption to core learning.
