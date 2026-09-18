# YOUVA-EdAI — Cycle N11 Evidence-Based Modality Matrix
## Pedagogical Modality Decision Engine, Curriculum Mapping & Equivalence Paths

**Document Version:** 1.0.0-N11  
**Classification:** Curriculum Instruction Standard  
**Governing Standard:** Clauses N11.5, N11.6, N11.27, N11.29, N11.33  
**Date:** September 18, 2026  

---

## 1. Governing Modality Selection Formula (Clause N11.5)

Modality selection is not arbitrary or novelty-driven. It is governed by an evidence-based objective function:
$$\text{Recommended Modality} = f(\text{Objective}, \text{LearnerState}, \text{HistoricalSuccess}, \text{Accessibility}, \text{Cost}, \text{Latency})$$

### Selection Determinants:
1. **Conceptual Structure:** Spatial concepts require visual representation; procedural skills require step-by-step interactive practice; linguistic and phonetic skills require acoustic/voice engagement.
2. **Learner History:** If a learner exhibits repeated textual misconceptions on a concept ($M < 0.60$ with high error count), the router pivots to a **visual worked example** or **narrated diagram**.
3. **Accessibility Overrides:**
   - Visual impairment $\longrightarrow$ Force `AUDIO` / `TEXT` (Screen reader accessible) + detailed audio descriptions.
   - Auditory impairment $\longrightarrow$ Force `TEXT` / `IMAGE` + closed captions on all media.
   - Reduced-motion preference $\longrightarrow$ Suppress animated video; provide step-by-step static diagrams.
4. **Bandwidth / Device Constraints:**
   - Low bandwidth / high latency ($> 800\text{ms}$) $\longrightarrow$ Graceful fallback to `TEXT` + compressed SVG diagrams.

---

## 2. Concept-to-Modality Curriculum Mapping (Grade 8)

| Subject | Concept ID | Primary Modality | Secondary Equivalent | Remediation Modality |
| :--- | :--- | :--- | :--- | :--- |
| **Math** | `fraction-fundamentals` | `IMAGE` (Visual area models) | `INTERACTIVE` (Number line slider) | `VOICE` (Guided Socratic dialogue) |
| **Math** | `rational-number-def` | `TEXT` (Formal definition) | `IMAGE` (Set diagram: $\mathbb{N} \subset \mathbb{Z} \subset \mathbb{Q}$) | `AUDIO` (Read-aloud with examples) |
| **Math** | `number-line-representation`| `INTERACTIVE` (Point plotting)| `IMAGE` (Graduated number line) | `VIDEO` (Step-by-step construction) |
| **Math** | `rational-multiplication` | `TEXT` (Algorithmic steps) | `IMAGE` (Area representation) | `VOICE` (Socratic step verification) |
| **Math** | `rational-word-problems` | `TEXT` (Word problem) | `IMAGE` (Problem schema diagram) | `VOICE` (Verbal reasoning & hint) |
| **Science**| `cell-structure-components`| `IMAGE` (Labeled cell diagram)| `INTERACTIVE` (Organelle explorer) | `VIDEO` (Microscopy walkthrough) |
| **Science**| `cell-membrane-and-wall` | `VIDEO` (Osmosis simulation) | `IMAGE` (Bilayer cross-section) | `TEXT` (Comparative table) |
| **Science**| `plant-vs-animal-cells` | `IMAGE` (Venn diagram) | `INTERACTIVE` (Sorting activity) | `VOICE` (Organelle distinction quiz) |

---

## 3. Modality Equivalence Pathways (Clause N11.29)

Every learning activity is provided with functionally equivalent alternative pathways so that no learner is disadvantaged by modality constraints or accessibility needs:

```
                  ┌─────────────────────────────────┐
                  │ Learning Objective: Cell Wall   │
                  │ Function & Osmotic Regulation   │
                  └────────────────┬────────────────┘
                                   │
         ┌─────────────────────────┼─────────────────────────┐
         ▼                         ▼                         ▼
   Pathway A: Watch          Pathway B: Read           Pathway C: Listen
   Short 35s animation       Illustrated text with     Full audio narration with
   with synchronized         static high-res diagram   tactile diagram description
   closed captions           and explanatory callouts  and verbal checkpoint
```

**Equivalence Invariants:**
- All pathways test identical underlying conceptual constructs.
- Assessment rubrics are calibrated to be construct-equivalent across modalities.
- Learners can switch between equivalent pathways at any time without losing session progress.

---

## 4. Assessment Construct Validity Across Modalities (Clause N11.33)

To ensure that evaluating answers across different modalities yields valid and comparable evidence:

| Assessment Mode | Input Format | Evaluation Method | Safeguards Against Bias |
| :--- | :--- | :--- | :--- |
| **Written Text** | Markdown / math text | Exact match & semantic regex | Case/spacing normalization |
| **Spoken Voice** | Audio recording $\rightarrow$ STT | Semantic intent extraction | STT confidence split; accent tolerance |
| **Handwritten Photo**| Uploaded worksheet image | OCR + equation parsing | Vision confidence gate ($C \ge 0.75$) |
| **Diagram Selection**| Interactive canvas click | Coordinate collision test | Scale & touch target accessibility |

**Core Rule:** A learner's mastery update is only committed when the assessment confidence $C \ge 0.75$. If technical ambiguity exists (e.g. blurred image, noisy audio), the system prompts for confirmation rather than registering a false failure.
