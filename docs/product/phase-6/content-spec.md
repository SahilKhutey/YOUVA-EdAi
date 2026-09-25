# YOUVA EdAI — Phase 6: Early Learner Content System Specification
## Audio as a First-Class Artifact, Certified Lexicons, and Age-Specific Content Schema

---

## 1. Architectural Transformation: Audio as a First-Class Entity

In secondary tiers, educational content was defined primarily as text and LaTeX equations, with audio/TTS treated as an optional accessibility overlay.

In Phase 6:
> **Audio is not a downstream artifact generated on the fly from text.**
> High-fidelity, professionally recorded or certified synthetic audio assets are **first-class content entities** with independent cryptographic hashes, review workflows, and accessibility tags.

---

## 2. Early Learner Content Schema (`EarlyLearnerContentItem`)

```typescript
export interface ResponseOption {
  optionId: string;
  visualAssetUri: string;      // SVG or PNG asset (e.g. "asset://images/apples_3.svg")
  audioLabelUri: string;       // Spoken audio of option (e.g. "asset://audio/three.mp3")
  textLabel?: string;          // Optional text label (e.g. "3")
  isCorrect: boolean;
}

export interface EarlyLearnerContentItem {
  id: string;                                    // "item_num_g3_001"
  conceptId: string;                             // "NUM-EARLY-01"
  learningObjective: string;                     // "Identify sets of objects up to 10"
  
  interactionType: 
    | "TAP" 
    | "VOICE" 
    | "TAP_AND_VOICE";

  // Mandatory Spoken Audio Assets
  promptAudio: string;                           // "asset://audio/prompt_tap_3_apples.mp3"
  promptText?: string;                           // "Tap 3 apples." (Max 8 words)

  responseOptions?: ResponseOption[];

  successFeedbackAudio: string;                  // "asset://audio/feedback_chime_sparkle.mp3"
  retryFeedbackAudio: string;                    // "asset://audio/feedback_gentle_try_again.mp3"
  hintAudio?: string;                            // "asset://audio/hint_count_together.mp3"

  estimatedSeconds: number;                      // Typically 15 - 30 seconds
  developmentalLevel: string;                    // "PRIMARY_GRADE_3_FOUNDATIONAL"
  curriculumReference: string;                   // "NCERT-M3-01 / NIPUN Bharat L2"

  status: 
    | "DRAFT"
    | "CONTENT_REVIEW"
    | "AGE_REVIEW"
    | "SAFETY_REVIEW"
    | "APPROVED"
    | "PUBLISHED"
    | "RETIRED";
}
```

---

## 3. Certified Early Childhood Lexicon (`early_lexicon.json`)

To prevent vocabulary overshoot, every prompt is validated against a certified closed lexicon:
- **Lexicon Size**: 146 foundation words covering numbers (one to twenty), shapes (circle, square, triangle, star), spatial relations (more, less, big, small, under, over), and simple action verbs (tap, find, count, look, listen).
- **Enforcement**: `EarlyChildhoodContentGuard.validate_prompt()` splits prompt text and verifies every token against `certifiedVocabulary`. Any uncertified word (e.g. "calculate", "hypotenuse", "equation") triggers an immediate validation failure (`ContentConstraintViolation`).

---

## 4. Content Lifecycle & Status FSM

```
  DRAFT 
    │
    ▼ (Curriculum Review)
  CONTENT_REVIEW 
    │
    ▼ (Pedagogical & Linguistic Review)
  AGE_REVIEW 
    │
    ▼ (Child Psychologist & Content Guard Audit)
  SAFETY_REVIEW 
    │
    ▼ (Human Sign-Off)
  APPROVED 
    │
    ▼ (Release Authorization)
  PUBLISHED ──> (Deprecation) ──> RETIRED
```

### Publication Guardrail
Only items with status `PUBLISHED` can be loaded by the student session runtime. Any item marked `DRAFT`, `CONTENT_REVIEW`, `SAFETY_REVIEW`, or `RETIRED` is strictly excluded from active learning pools.
