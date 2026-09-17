# YOUVA-EdAI — N8 Closed-Pilot Operating Plan

## 1. Executive Pilot Summary

The N8 Closed-Pilot is an authorized, narrow MVP operational deployment designed to evaluate real educational efficacy, user workflows, and system reliability under strict governance controls.

Core Invariant:
> **"The pilot answers predefined empirical questions — it does not serve as an uncontrolled feature showcase."**

---

## 2. Pilot Cohort Specification (N8.27)

| Parameter | Specification |
| :--- | :--- |
| **Cohort Size** | **15 – 30 Students** (Grade 8) |
| **Partner Institution** | Modern School, Vasant Vihar (`tenant-modern-vv`) |
| **Subject & Domain** | Mathematics: *Linear Equations in One Variable* & *Rational Numbers* |
| **Teacher Lead** | Mrs. Anita Roy (Grade 8-A Mathematics) |
| **Parent Participation** | 15–30 Registered Parents with Verifiable DPDP Consent |
| **Duration** | 3 Weeks (15 instructional days) |
| **Session Cadence** | Three 25-minute sessions per week per student |

### Eligibility & Onboarding Protocol
1. **Verifiable Parental Consent**: Mandatory DPDP digital consent signed by parent prior to student account activation.
2. **Controlled Onboarding**: In-person classroom orientation led by Teacher Lead and Designated Safety Officer.
3. **Data Minimization**: Zero student biometric data; PII restricted to student first name and parent contact email.
4. **Withdrawal Procedure**: Immediate, frictionless self-service or teacher-initiated withdrawal without educational penalty; all buffered learner analytics retained or purged per DPDP instructions.

---

## 3. Pilot Experiment Design (N8.29)

### Core Hypotheses
1. **Primary Learning Hypothesis ($H_1$)**:
   * *Students receiving adaptive Bayesian Knowledge Tracing (BKT) tiered remediation demonstrate a $\ge 20\%$ relative increase in mastery on targeted concepts compared to their initial diagnostic baseline.*
2. **Primary Governance Hypothesis ($H_2$)**:
   * *Teacher oversight is preserved with 100% of consequential interventions reviewed and authorized without workflow bottlenecks ($< 3$ minutes per review).*
3. **Primary Safety Hypothesis ($H_3$)**:
   * *100% of detected acute child-safety events are escalated to human review within 30 seconds; 0% of safety cases are closed autonomously by AI.*

### Decision Rules
* **Success Rule**: $H_1$, $H_2$, and $H_3$ all satisfied with system availability $\ge 99.9\%$.
* **Failure Rule**: Mastery stagnation ($< 5\%$ increase), teacher abandonment ($> 50\%$ unreviewed interventions), or any unescalated safety incident.

---

## 4. Pilot Success Metrics Framework (N8.28)

```
┌───────────────────────────┬───────────────────────────┬───────────────────────────┬───────────────────────────┐
│     Educational Outcomes  │      Product Workflows    │     Technical Reliability │       Safety & Trust      │
├───────────────────────────┼───────────────────────────┼───────────────────────────┼───────────────────────────┤
│ • Diagnostic completion   │ • Session completion rate │ • Platform uptime (99.9%) │ • Zero safety bypasses    │
│ • Attempt correctness     │ • Time-on-task distribution│ • P95 API latency < 200ms │ • Escalation time < 30s   │
│ • BKT mastery delta       │ • Teacher review latency  │ • Zero data leaks (tenant)│ • 100% human resolution   │
│ • Retention over 2 weeks  │ • Parent dashboard visits │ • Outbox DLQ count = 0    │ • Zero AI closures        │
│ • Remediation gain score  │ • Dropout / skip rate     │ • AI daily cost < budget  │ • DPDP consent compliance │
└───────────────────────────┴───────────────────────────┴───────────────────────────┴───────────────────────────┘
```

---

## 5. Human Feedback Loops & Structured Instruments (N8.30)

Surveys are administered at End of Week 1 and End of Week 3:

### A. Student Usability & Confidence Survey (5-point Likert)
1. "The hints helped me understand my mistakes rather than giving away the answer."
2. "The system gave me questions that were just right — not too hard, not too easy."
3. "I felt safe and supported while using the app."
4. "I feel more confident solving algebra equations now."

### B. Teacher Workload & Trust Survey
1. "The system's intervention recommendations accurately highlighted students needing support."
2. "Reviewing and authorizing interventions took a manageable amount of time."
3. "I felt in complete control of my students' educational progression."
4. "The AI recommendations never overstepped my pedagogical judgment."

### C. Parent Visibility & Assurance Survey
1. "The parent portal gave me clear, understandable insights into my child's learning."
2. "I was informed immediately of important milestones or issues."
3. "I trust that my child's data and privacy are rigorously protected."

---

## 6. During-Run Operational Controls (N8.36)

```
Daily Standup (Ops + Lead Eng) ──► Weekly Review (Product + Safety) ──► Continuous Automated Telemetry
```

### Daily Operational Cadence
* 08:30 IST: Review previous day's telemetry, error rates, outbox lag, AI cost spend.
* 16:30 IST: Review completed sessions, teacher interventions, and open support tickets.

### Automatic Pause Triggers (Circuit Breaker for the Pilot)
The pilot is **automatically paused** (students see friendly maintenance banner) upon:
1. **Safety Trigger**: Any unhandled or misclassified acute safety event.
2. **Security Trigger**: Any cross-tenant data leakage or authentication breach.
3. **Data Integrity Trigger**: Any undetected corruption or unexpected drop in student mastery scores.
4. **Reliability Trigger**: System error rate $> 1.0\%$ sustained over 15 minutes or database unavailability $> 2$ minutes.
5. **Cost Trigger**: Tenant daily AI spend exceeding the hard cap ($50.00).

---

## 7. Pilot Exit Decision Criteria (N8.37)

At the conclusion of the 3-week pilot, the collected empirical data is reviewed against four exit pathways:

1. **`SCALE`**:
   * Criteria: $H_1, H_2, H_3$ validated; availability $> 99.9\%$; zero P0/P1 defects; positive teacher/student feedback $> 80\%$.
   * Action: Authorize cohort expansion to 100+ students across additional partner schools.
2. **`ITERATE`**:
   * Criteria: Core system reliable, but mastery gain or UI engagement below target thresholds; minor UX friction.
   * Action: Execute targeted pedagogy and UI revisions before expanding cohort.
3. **`PIVOT`**:
   * Criteria: Technical systems sound, but pedagogical model (hints, BKT) shows no measurable learning benefit over static worksheets.
   * Action: Re-architect adaptive logic or intervention framework.
4. **`STOP`**:
   * Criteria: Safety failure, fundamental breach of parental trust, or persistent architectural unreliability.
   * Action: Terminate pilot and conduct comprehensive postmortem.
