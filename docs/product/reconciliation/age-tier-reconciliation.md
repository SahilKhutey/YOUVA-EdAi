# YOUVA EdAI — Scope Reconciliation: Age Tier Architecture
## Reconciling Developmental Discrepancies, Subdividing Early Childhood, and Decoupling Age from Policy

---

## 1. The Concrete Architectural Conflict

A direct inspection of project documentation, concept notes, and codebase artifacts reveals three conflicting age models:

```
┌─────────────────────────────────┐   ┌─────────────────────────────────┐   ┌─────────────────────────────────┐
│        ORIGINAL ROADMAP         │   │         ORIGINAL CONCEPT        │   │       CURRENT REPOSITORY        │
├─────────────────────────────────┤   ├─────────────────────────────────┤   ├─────────────────────────────────┤
│ • Kindergarten & Junior (P6)    │   │ • Pre-School (Ages 3–7)         │   │ • "Students aged 12–24"         │
│ • Middle School (P0, P1)        │   │ • Elementary (Ages 7–12)        │   │   (frontend/app/layout.tsx:32)  │
│ • High School (P5)              │   │ • Middle School (Ages 12–15)    │   │ • cognitiveLevel:               │
│                                 │   │ • High School (Ages 15–18)      │   │   CHILD, TEEN, ADULT (Prisma)   │
│                                 │   │                                 │   │ • ageMin / ageMax on concepts   │
└─────────────────────────────────┘   └─────────────────────────────────┘   └─────────────────────────────────┘
```

### Why Kindergarten & Junior Was Too Broad
Treating ages 3 through 12 as a single "Kindergarten & Junior" tier (Phase 6) is pedagogically and developmentally untenable:
- A 4-year-old cannot read text, lacks motor skills for complex typing, requires full parental co-piloting, and cannot process abstract mathematical symbols.
- A 10-year-old in Grade 5 reads fluently, executes multi-step arithmetic, writes structured answers, and can engage with guided conversational AI tutors.

Lumping them together forced Phase 6 into contradictory compromises.

---

## 2. Canonical Four-Tier Learner Architecture (Approved)

The platform formally adopts the canonical four-tier K-12 structure:

```
                            YOUVA LEARNER ARCHITECTURE
                                         │
         ┌───────────────────────────────┴───────────────────────────────┐
         ▼                                                               ▼
   EARLY LEARNER                                                     SECONDARY
         │                                                               │
   ┌─────┴───────────────┐                                         ┌─────┴───────────────┐
   ▼                     ▼                                         ▼                     ▼
PRE-SCHOOL          ELEMENTARY                               MIDDLE SCHOOL          HIGH SCHOOL
(Ages 3–7)          (Ages 7–12)                              (Ages 12–15)           (Ages 15–18)
```

---

## 3. Core Architectural Rule: Don't Use Age Alone as Product Policy

A critical engineering principle established in reconciliation:
> **Age alone must never be hard-coded as the sole determinant of application behavior.**

A child's developmental readiness, curriculum track, and parental preferences vary. The platform implements the `LearnerProfile` contract to decouple developmental age from interaction and autonomy policies:

```typescript
export interface LearnerProfile {
  learnerTier:
    | "PRE_SCHOOL"       // Ages ~3–7 (Foundational sensory & play)
    | "ELEMENTARY"       // Ages ~7–12 (Primary literacy & numeracy)
    | "MIDDLE_SCHOOL"    // Ages ~12–15 (Algebra, science, abstract logic)
    | "HIGH_SCHOOL";     // Ages ~15–18 (Advanced calculus, physics, credentials)

  ageBand: string;                      // e.g. "3-5", "6-7", "8-10", "11-12", "13-15", "16-18"

  curriculumSystem: string;              // "NCERT-EARLY", "CBSE-PRIMARY", "CBSE-SECONDARY", "CCSS-M"

  interactionPolicy:
    | "VOICE_AND_TOUCH_ONLY"            // Zero keyboard typing required (Pre-School)
    | "AUDIO_VISUAL_GUIDED"             // Visual widgets, tap inputs, assisted text (Elementary)
    | "STRUCTURED_KEYBOARD_MATH"        // KaTeX input, formula editor, hints (Middle School)
    | "ADVANCED_MULTIMODAL_CODE";       // Code execution, graphing calculator, proofs (High School)

  autonomyPolicy:
    | "PRE_COMPILED_DETERMINISTIC_ONLY" // Zero runtime LLM text generation (Pre-School)
    | "STRICTLY_MODERATED_SCAFFOLD"     // Curated templates, guided hints (Elementary)
    | "BOUNDED_HINT_TIERING_CAP001"     // 3-tier scaffolding, maxStepSize 1.0 (Middle School)
    | "COMPREHENSIVE_SOCRATIC_TUTOR";   // Step-by-step problem solving (High School)

  parentParticipationPolicy:
    | "CO_PILOT_MANDATORY"              // Parent device must remain unlocked & present
    | "SESSION_SUMMARY_AND_APPROVAL"    // Parent reviews daily milestones & screentime
    | "STATUTORY_CONSENT_OVERSIGHT"     // Parent exercises DPDP/COPPA rights; independent study
    | "STUDENT_INDEPENDENT_ACCOUNT";    // Student manages learning; parent retains audit access

  teacherOversightPolicy:
    | "OBSERVATIONAL_PORTFOLIO"         // Qualitative observation notes (Pre-School)
    | "READING_MATH_DIAGNOSTIC_QUEUE"   // Formative diagnostic tracking (Elementary)
    | "ACTIVE_OVERRIDE_AND_PACING"      // Mastery overrides & curriculum pacing (Middle School)
    | "CREDENTIAL_AUTHORIZATION_GATED"; // Verifiable credential digital signing (High School)
}
```

---

## 4. Reclassification of Phase 6: P6A vs. P6B

Phase 6 is formally bifurcated into two distinct implementation workstreams:

### Phase 6A: Pre-School (Ages 3–7)
- **Primary Modalities:** Voice input (Whisper STT), Tap/Gesture navigation, Illustrated visual objects, Physical manipulatives tracking.
- **AI Policy:** **Zero runtime generative LLM text output**. Pre-compiled, deterministic audio stories, nursery rhymes, phonics drills, and tactile number lines.
- **Parental Integration:** Mandatory Co-Pilot mode. App cannot initiate learning activities without verified parent unlock.

### Phase 6B: Elementary (Ages 7–12)
- **Primary Modalities:** Audio + Tap + Structured visual diagrams + Early text reading + Interactive canvas.
- **AI Policy:** Guided AI scaffolding using strict template-constrained language; zero open chat; reading age verification heuristics.
- **Curriculum:** Core foundational literacy, multi-digit arithmetic, fractions, geometric intuition, and block-based computational logic (Scratch/Blockly).
- **Parental Integration:** Daily session limits, screentime caps, and automated progress digests.
