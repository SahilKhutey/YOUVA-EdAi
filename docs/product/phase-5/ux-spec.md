# YOUVA EdAI — Phase 5: High School UX Specification
## Adolescent Analytical Dashboard, Student Agency, and Non-Gamified Progression

---

## 1. Executive Summary & Design Philosophy

Phase 5 addresses learners aged 14–16 (Grade 10, secondary school). The design philosophy reflects a critical developmental transition: **from teacher-guided discovery to self-regulated adolescent agency**.

### 1.1 The Anti-Gamification Invariant
Adolescent learners reject infantilizing and extrinsic gamification tokens (e.g., cartoon mascots, coin economies, bouncing stars, confetti bursts). In high school, such visual metaphors degrade institutional trust, convey patronizing condescension, and trigger gaming behaviors.

```
       Middle School (Grade 8)                      High School (Grade 10)
┌─────────────────────────────────────┐      ┌─────────────────────────────────────┐
│ Visual badges, guided quests,       │  vs  │ Analytical telemetry, velocity,     │
│ structured scaffolding, celebration │      │ prerequisite readiness radar,       │
│ animations, step-by-step narration. │      │ micro-credentials, self-directed.   │
└─────────────────────────────────────┘      └─────────────────────────────────────┘
```

**High School UX Rule**:
$$\text{Engagement} = \text{Agency} + \text{Transparency} + \text{Credibility}$$
No cartoon avatars, no celebratory confetti, no vanity streaks. All progress is expressed through calibrated mathematical telemetry: BKT knowledge probabilities, learning velocity, and verifiable skills credentials.

---

## 2. Core Dashboard Components

The High School student view consists of four primary analytical viewports:

```
┌────────────────────────────────────────────────────────────────────────┐
│  YOUVA EdAI | High School Portal (Grade 10 CBSE Math)                 │
├────────────────────────────────────────────────────────────────────────┤
│ [1] Prerequisite Concept Readiness Radar                              │
│     * Visualizes multidimensional mastery across 6 DAG competencies    │
│     * Displays empirical BKT P(L) values (0.00 -> 1.00)                │
├────────────────────────────────────────────────────────────────────────┤
│ [2] Learning Velocity & Metacognitive Telemetry                        │
│     * Velocity = (P(L_final) - P(L_initial)) / time_spent_hours        │
│     * Time on deliberate practice vs. idle dwell time                  │
├────────────────────────────────────────────────────────────────────────┤
│ [3] Self-Directed Goal Planning & Diagnostic Targeting               │
│     * Select next concept to target based on DAG prerequisite gaps     │
│     * Demand progressive scaffolding (Conceptual -> Strategy -> Hint)  │
├────────────────────────────────────────────────────────────────────────┤
│ [4] Verifiable Skills Passport Portfolio                              │
│     * Issued W3C VC 2.0 micro-credentials                              │
│     * Teacher digital signature verification badge                     │
│     * Cryptographic Zero-PII export token for external verification   │
└────────────────────────────────────────────────────────────────────────┘
```

### 2.1 Component 1: Prerequisite Concept Readiness Radar
- **Visualization**: Hexagonal spider chart / radar plot representing the 6 nodes in the Quadratic Equations Concept DAG:
  1. `linear_polynomials` (Prerequisite baseline)
  2. `standard_quadratic_form` ($ax^2 + bx + c = 0$)
  3. `discriminant_nature_roots` ($\Delta = b^2 - 4ac$)
  4. `factorisation_roots` (Splitting the middle term)
  5. `quadratic_formula` (Algebraic derivation and calculation)
  6. `word_problems_quadratic` (Real-world geometric & kinematics modeling)
- **State Representation**:
  - Green frontier ($P(L) \ge 0.85$): Mastered competency.
  - Amber zone ($0.60 \le P(L) < 0.85$): Working knowledge / active consolidation.
  - Grey perimeter ($P(L) < 0.60$): Unreached or prerequisite gap.

### 2.2 Component 2: Learning Velocity Metric
- **Mathematical Definition**:
  $$\text{Velocity} = \frac{\Delta P(L)}{\text{Hours of Deliberate Practice}} = \frac{P(L_t) - P(L_0)}{\Delta t / 60}$$
- **Metacognitive Feedback**: Rather than telling the student "You did great!", the system presents:
  > *"Your learning velocity in Quadratic Formula derivation was $+0.72\,P(L)/\text{hr}$ with an average question solve time of 142s. Prerequisites are stable."*

### 2.3 Component 3: Self-Directed Goal Setting & On-Demand Scaffolding
- High school students can override system default recommendations to target specific competencies they feel uncertain about before school examinations.
- **3-Tier Progressive Scaffolding**:
  - *Tier 1 (Conceptual Refresher)*: High-level mathematical axiom or geometric intuition.
  - *Tier 2 (Strategic Decomposition)*: Step-by-step problem breakdown without solving.
  - *Tier 3 (Concrete Step Hint)*: Calculation aid for the immediate obstacle.
- Scaffolding usage is logged in the BKT observation sequence as slip/guess penalty modifiers.

### 2.4 Component 4: Skills Passport Portfolio View
- Presents earned and pending micro-credentials (`MATH-G10-QUAD-01`).
- Clear visual indicators of:
  - Human teacher authorization status (`PENDING_TEACHER_REVIEW` vs `AUTHORIZED`).
  - Cryptographic verification token hash (e.g., `did:youva:student:3a7f...`).
  - Zero-PII public share link (`GET /verify/:token`).

---

## 3. Interaction Invariants & Guardrails

| Invariant ID | Target Dimension | Rule | Enforcement Mechanism |
|---|---|---|---|
| **INV-UX-01** | Avatar & Themes | No cartoon mascots or infantilized themes. Standard high-contrast, clean typography (Inter / JetBrains Mono). | `AdolescentUXProfile.has_cartoon_avatars = False` in `highschool_ux_state.py` |
| **INV-UX-02** | Rewards System | Zero arbitrary points, coins, or leveling up. Progress is strictly competency-based. | `AdolescentUXProfile.has_arbitrary_points = False` |
| **INV-UX-03** | Feedback Tone | Objective, academic, respectful, analytical. No patronizing exclamation marks. | Context-minimizer prompt templates for High School tier |
| **INV-UX-04** | Error Display | Specific mathematical misconception diagnosis (e.g., "Sign error in discriminant $-4ac$" rather than "Try again!"). | Diagnostic assessment item distractor tags |
| **INV-UX-05** | Credential Display | Complete transparency of issuance criteria, evidence trail, and teacher sign-off. | Read-only inspect modal on credential card |

---

## 4. Technical Integration with Frontend Stack

The High School UX operates on Next.js 14 App Router:
- Route: `/student/high-school/dashboard`
- Components:
  - `ConceptReadinessRadar.tsx`: SVG/Canvas radar visualization.
  - `VelocityTelemetryCard.tsx`: Recharts-based velocity trendline.
  - `ScaffoldingAccordion.tsx`: 3-tier progressive hint disclosure.
  - `SkillsPassportCard.tsx`: Cryptographic credential card with QR code generator.
- Telemetry: Consumes `AdolescentUXManager` via backend API `/api/v1/high-school/ux-state/:did`.
