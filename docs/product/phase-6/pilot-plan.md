# YOUVA EdAI — Phase 6: Early Learner Pilot Plan
## Three Concentric Gate Methodology: Internal Lab, Supervised Usability, and Controlled Pilot

---

## 1. The Concentric Gate Architecture

Deploying software directly to young children carries severe ethical and pedagogical responsibilities. The Phase 6 pilot is structured into **three strictly sequential concentric gates**:

```
[GATE A: Internal Testing]
   ├── No real children involved.
   ├── QA team, developers, and educators simulate child behaviors.
   └── Verified: 100% negative security and content boundary tests pass.
         │
     (Passed)
         │
         ▼
[GATE B: Supervised Usability Lab]
   ├── Small cohort (N = 5 consenting families).
   ├── Direct 1-on-1 observation by child psychologist and product lead.
   ├── No unsupervised or home usage.
   └── Goal: Surface confusion points, motor fatigue, and acoustic glitches.
         │
     (Passed & Findings Remediated)
         │
         ▼
[GATE C: Controlled Institutional Pilot]
   ├── Class 3 cohort (N = 20 students + parents + primary teacher).
   ├── 10-day deployment in school lab and parent-accompanied home study.
   ├── Daily safety standups and daily review queue triage.
   └── Final empirical evidence collection for Phase 6 Exit Gate.
```

---

## 2. Gate Criteria & Progression Rules

| Gate | Target Population | Deployment Setting | Progression Gate to Next Stage |
|---|---|---|---|
| **Gate A (Internal)** | 0 children; 6 adults (Engineers & SMEs) | Synthetic simulation lab | Zero unhandled exceptions; 10/10 safety regression tests pass; zero PII leaks. |
| **Gate B (Usability)** | 5 children (Ages 8–9) + 5 parents | Supervised observation lab | All FND safety findings closed; zero emotional distress signals; 100% parent satisfaction. |
| **Gate C (Pilot)** | 20 children (Class 3) + 20 parents | School computer lab & home | 100% VPC; zero safety incidents; $> +0.35$ mastery gain; $< 5\%$ parent bypass. |

---

## 3. Daily Review & Operational Cadence (Gate C)

- **09:00–09:30**: Morning sync with Mrs. Sangeeta Verma (Primary Teacher). Review open items in Human Review Queue from previous evening.
- **11:00–11:30**: School computer lab session (15-minute practice block, 10 students per batch).
- **17:00–18:30**: Home practice window (accompanied by Parent Co-Pilot in `PARENT_ASSISTED` mode).
- **19:00**: Daily automated audit ledger verification and anomaly scan.
- **19:30**: Daily Safety Review standup with Dr. Priya Deshpande.
