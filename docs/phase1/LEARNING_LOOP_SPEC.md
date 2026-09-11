# YOUVA EdAI — Phase 1: Core Learning Loop MVP Specification

## 1. Objective & Philosophy

The goal of Phase 1 is to build and validate **exactly one complete learning loop**:

```
Student
   │
   ▼
Diagnostic Assessment (5 Items)
   │
   ▼
Initial Knowledge State P(L_0)
   │
   ▼
Adaptive Practice (Zone of Proximal Development)
   │
   ├── Answer Observation (Correct / Incorrect / Hint)
   │
   ▼
4-Parameter BKT Update (Corbett & Anderson)
   │
   ▼
Next-Item Selection (ZPD Proximity Target: P(C) ~ 0.60)
   │
   ▼
Student Progress Telemetry
   │
   ▼
Teacher Dashboard
   │
   ├── Consequential Override (Authoritative Human Intervention)
   │
   ▼
Loop Closes
```

---

## 2. 4-Parameter Bayesian Knowledge Tracing (BKT)

Rather than naive linear increment heuristics, Phase 1 grounds knowledge tracing in the peer-reviewed **Corbett & Anderson (1995)** mathematical formulation:

### Model Parameters
- $P(L_0)$: Initial prior knowledge probability (calibrated via 5-item diagnostic).
- $P(T)$: Transition/learning probability (probability of learning skill at each attempt, default $0.20$).
- $P(G)$: Guess probability (probability of correct answer despite unlearned state, default $0.25$ for 4-option MCQs).
- $P(S)$: Slip probability (probability of incorrect answer despite learned state, default $0.08 - 0.10$).

### Mathematical Updates

#### 1. Posterior Probability Update:
$$\text{If Correct (Obs = 1): } P(L_t \mid \text{Obs}=1) = \frac{P(L_{t-1}) \cdot (1 - P(S))}{P(L_{t-1}) \cdot (1 - P(S)) + (1 - P(L_{t-1})) \cdot P(G)}$$

$$\text{If Incorrect (Obs = 0): } P(L_t \mid \text{Obs}=0) = \frac{P(L_{t-1}) \cdot P(S)}{P(L_{t-1}) \cdot P(S) + (1 - P(L_{t-1})) \cdot (1 - P(G))}$$

#### 2. Learning Transition for Opportunity $t+1$:
$$P(L_{t+1}) = P(L_t \mid \text{Obs}) + (1 - P(L_t \mid \text{Obs})) \cdot P(T)$$

#### 3. Prediction of Correct Response on Next Item:
$$P(C_{t+1}) = P(L_{t+1}) \cdot (1 - P(S)) + (1 - P(L_{t+1})) \cdot P(G)$$

---

## 3. Zone of Proximal Development (ZPD) Item Selection

The adaptive item selector targets the student's optimal learning zone:
$$0.35 \le P(C) \le 0.75 \quad (\text{Target: } 0.60)$$

- **Scaffolding**: If $P(L) < 0.40$, foundational 1-step and 2-step linear equations are prioritized.
- **Challenge**: If $P(L) \ge 0.60$, complex multi-step and word problems are queued.
- **Anti-Repetition**: Questions answered within the last 3 opportunities are quarantined from selection.
- **Mastery Milestone**: Mastery is certified only when $P(L) \ge 0.85$ **AND** student demonstrates $\ge 3$ consecutive independent correct responses without hints.

---

## 4. Teacher Dashboard & Human Override Invariant

In adherence to the core non-negotiable (*AI recommends, humans authorize*):
- The teacher dashboard displays real-time class mastery distributions and individual student BKT trajectories.
- The teacher has full authority to:
  1. `SET_MASTERY_STATE`: Overwrite $P(L)$ if classroom performance warrants it.
  2. `FORCE_DIAGNOSTIC`: Re-calibrate knowledge state.
  3. `LOCK_SESSION`: Pause software practice for 1-on-1 pedagogical intervention.
- All overrides require a cryptographic digital signature and a substantive pedagogical rationale recorded in the immutable audit log.
