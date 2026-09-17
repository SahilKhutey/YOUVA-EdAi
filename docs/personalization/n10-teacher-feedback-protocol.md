# YOUVA-EdAI Teacher Feedback Loop & Override Protocol (N10.10, N10.11, N10.12, N10.46)

**Document Reference**: `DOC-YOUVA-N10-TEACHER-FEEDBACK`  
**Milestone**: N10 — Deep Personalization  
**Status**: `OPERATIONAL / HUMAN-GOVERNED`  

---

## 1. The Human-in-the-Loop Feedback Cycle (N10.10)

In YOUVA-EdAI, consequential pedagogical decisions are governed by human educators. The system executes a closed-loop review cycle:

```
[ Algorithmic Recommendation Generated ]
                 │
                 ▼
[ Teacher Cockpit Notification & Radar ]
                 │
                 ▼
┌────────────────────────────────────────────────────────┐
│                   TEACHER REVIEW GATE                  │
├───────────────┬───────────────────────┬────────────────┤
│ ACCEPT        │ MODIFY                │ REJECT / OVER. │
│ (Dispatches   │ (Adjusts count,       │ (Selects       │
│  as is)       │  difficulty, pacing)  │  custom path)  │
└───────┬───────┴───────────┬───────────┴────────┬───────┘
        │                   │                    │
        └───────────────────┼────────────────────┘
                            ▼
           [ Structured Reason Captured ]
                            │
                            ▼
           [ Intervention Executed & Audited ]
                            │
                            ▼
           [ Learner Outcome Tracked ]
                            │
                            ▼
           [ Model & Policy Evaluation Labeled ]
```

---

## 2. Structured Reason Taxonomy for Overrides (N10.10)

When modifying or rejecting an AI recommendation, teachers must select from eight discrete pedagogical categories and optionally append qualitative notes:

| Reason Code | Label | Typical Teacher Rationale |
|:---|:---|:---|
| `INCORRECT_DIAGNOSIS` | Incorrect Skill Diagnosis | AI misidentified the root cause (e.g. arithmetic sign error attributed to conceptual misunderstanding). |
| `WRONG_DIFFICULTY` | Inappropriate Difficulty | Recommended problem is too steep ($\Delta D > 0.25$) or overly trivial for the student. |
| `WRONG_CONTENT` | Content Misalignment | Topic is out of sync with current school syllabus pacing or upcoming examination focus. |
| `LEARNER_CONTEXT` | Unobserved Learner Context | Student was absent, fatigued, or experienced computer hardware lag during prior session. |
| `TIMING_ISSUE` | Session Pacing / Timing | Too late in the class period (e.g. only 5 minutes remaining) for a complex multi-step activity. |
| `ALREADY_MASTERED` | Verified Prior Mastery | Student demonstrated mastery on physical paper/pencil test not yet recorded in the digital state. |
| `INSUFFICIENT_EVIDENCE`| Premature Recommendation | Model made an aggressive adaptive jump after only 1 or 2 attempts ($C < 0.40$). |
| `OTHER` | Custom Pedagogical Note | Specific non-standard intervention prescribed by educator. |

---

## 3. Teacher Feedback as High-Weight Evidence (N10.11)

Teacher overrides do not blindly overwrite historical database records. Instead:
1. An immutable `TeacherFeedbackRecord` is created and cryptographically signed.
2. The learner's `conceptMastery` estimate receives a Bayesian Bayesian observational boost or dampening with pedagogical weight $w_T = 0.30$.
3. The override serves as ground truth for offline model calibration.

---

## 4. Teacher Override Analytics & Alarm Thresholds (N10.12)

Override patterns are aggregated across sections and evaluated daily:

```
Override Rate (OR) = (Modified + Rejected) / Total Recommendations Reviewed
```

- **Nominal Range**: $10.0\% \le \text{OR} \le 20.0\%$ (Demonstrates active educator oversight and model alignment).
- **High Override Warning ($\text{OR} > 25.0\%$)**: Triggers investigation by Pedagogical Lead into potential prompt/rubric drift.
- **Extreme Override Alarm ($\text{OR} > 40.0\%$)**: Automatically flags candidate policy for pause or rollback.
- **Low Override Warning ($\text{OR} < 5.0\%$)**: Triggers review into educator disengagement or rubber-stamping.

---

## 5. Offline Model & Policy Improvement Pipeline (N10.46)

```
Teacher Feedback Submissions
             │
             ▼
[ Quality & Spam Filter ]
             │
             ▼
[ Anonymized Labeled Training Dataset ]
             │
             ▼
[ Offline Counterfactual Policy Replay ]
             │
             ▼
[ Candidate Policy V(n+1) Generated ]
             │
             ▼
[ Personalization Review Board Approval ]
             │
             ▼
[ Staged A/B or Canary Rollout behind Feature Flag ]
```

*Strict Guarantee*: Teacher feedback **never** automatically retrains production weights in real-time. Policy iterations proceed solely through controlled, audited, versioned releases.
