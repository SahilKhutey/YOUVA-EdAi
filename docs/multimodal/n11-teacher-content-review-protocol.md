# YOUVA-EdAI — Cycle N11 Teacher Content Review Protocol
## Educational Media Authorization, Content QA & SME Review Standard

**Document Version:** 1.0.0-N11  
**Classification:** Operational Policy & Educator Governance Protocol  
**Governing Standard:** Clauses N11.56, N11.57, N11.58, N11.59  
**Date:** September 18, 2026  

---

## 1. Teacher Governance Mandate (Clause N11.56)

In YOUVA-EdAi, AI generation of educational media (images, diagrams, audio narrations, video clips) is strictly assistive. Certified teachers maintain final authority over all instructional assets presented to learners.

### Educator Operational Actions:
1. **APPROVE (`APPROVED`):** Authorizes the media asset for learner access across the classroom or tenant.
2. **REJECT (`REJECTED`):** Withholds the asset from learners and flags the prompt template for algorithmic review.
3. **REQUEST REVISION (`REVISION_REQUESTED`):** Submits targeted pedagogical feedback for regeneration (e.g., *"Simplify labels for Grade 8"* or *"Increase contrast on cell membrane"*).
4. **MODALITY OVERRIDE:** Ability to lock or disable specific modalities (e.g. disabling voice in quiet classroom settings).

---

## 2. Content Review Metadata & Provenance (Clause N11.57)

Every generated educational media asset presented in the `TeacherMultimodalGovernance` UI displays a mandatory audit provenance card:
- **Asset Identifier:** Unique UUID (`asset-<timestamp>-<hash>`).
- **Learning Objective & Target Concept:** Explicit curriculum link (e.g., `cell-structure-components`).
- **Prompt & Template Version:** Exact system prompt template and version used.
- **Model & Provider:** e.g., `stable-diffusion-xl` (Image), `whisper-v3` (Audio), `piper-tts` (Speech).
- **Safety Status:** Automated safety scan status (`SAFE`, `FLAGGED`, `CLEARED`).
- **Review History:** Timestamp, reviewing educator ID, and review notes.

---

## 3. Three-Tier SME Risk Classification (Clause N11.59)

All educational content is categorized into 3 risk tiers to balance instructional agility with strict quality assurance:

```
┌──────────────┬──────────────────────────────────────────┬─────────────────────────────────┐
│ Risk Tier    │ Asset Types                              │ Governance Requirement          │
├──────────────┼──────────────────────────────────────────┼─────────────────────────────────┤
│ Tier 1: Low  │ Standard practice diagrams, audio read-   │ Automated QA scan + 10%         │
│              │ alouds, known mathematical graphs        │ random educator spot checks     │
├──────────────┼──────────────────────────────────────────┼─────────────────────────────────┤
│ Tier 2: Med  │ Dynamic concept visualizations,          │ Automated QA scan + classroom   │
│              │ personalized analogy illustrations       │ teacher one-click sign-off      │
├──────────────┼──────────────────────────────────────────┼─────────────────────────────────┤
│ Tier 3: High │ Core curriculum video demonstrations,    │ Mandatory 2-person SME review   │
│              │ sensitive historical/scientific visuals  │ (Lead Teacher + Curriculum SME) │
└──────────────┴──────────────────────────────────────────┴─────────────────────────────────┘
```

---

## 4. Content QA Criteria (Clause N11.58)

Generated assets must satisfy 8 educational QA dimensions:
1. **Factual Accuracy:** Scientific diagrams must have correct anatomical/biological structures and accurate mathematical scales.
2. **Curriculum Alignment:** Content directly supports the NCERT Grade 8 learning standard.
3. **Age Appropriateness:** Text and audio phrasing tailored to 13–15 year old learners.
4. **Visual & Auditory Clarity:** High-contrast lines, readable fonts, clear pronunciation ($> 22\text{kHz}$ audio).
5. **Caption Accuracy:** 100% synchronized word-for-word closed captions on all audio and video assets.
6. **Absence of Hallucination:** No fabricated scientific terms or fictitious historical claims.
7. **Accessibility Semantics:** Embedded alt-text and structured tactile descriptions.
8. **Pedagogical Utility:** Clear instructional focus without distracting decorative elements.
