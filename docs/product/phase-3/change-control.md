# YOUVA EdAI — Phase 3 Pilot Change Control Protocol

**Objective:** Prevent evidence contamination during the pilot. Introducing new features mid-pilot causes different participants to experience different systems, rendering comparative efficacy and trust data ambiguous.

---

## 1. Three-Tier Change Classification System

Every proposed modification to the pilot environment is classified into one of three strict tiers:

```
                      [PROPOSED SYSTEM CHANGE]
                                 │
         ┌───────────────────────┼───────────────────────┐
         ▼                       ▼                       ▼
    [CLASS A]               [CLASS B]               [CLASS C]
 Safety / Security       Functional / Bug        Feature / Scope
   (Immediate)             (Controlled)            (PROHIBITED)
         │                       │                       │
         ▼                       ▼                       ▼
Immediate Hotfix            Scheduled Fix          Logged Directly to
+ Regression Test       + Verification Cycle       Phase 4 Backlog
+ Incident Record       + Change Log Record     (Zero Mid-Pilot Deploy)
```

### 1.1 Class A: Safety & Security Hotfixes
- **Scope:** Zero-day vulnerabilities, authorization leaks, child safety trigger failures, or critical data corruption.
- **Protocol:**
  1. Immediate engineering hotfix isolated to the root cause.
  2. Targeted security regression test execution.
  3. Expedited deploy authorized by Product Lead and Safeguarding Officer.
  4. Immutable entry recorded in `change-control.md` and audit log within 2 hours.

### 1.2 Class B: Functional & Content Defects
- **Scope:** Non-blocking functional bugs, calculation errors, ambiguous question wording, or UI rendering defects.
- **Protocol:**
  1. Remediation developed on an isolated fix branch.
  2. Full test suite execution (`pytest` and `jest`).
  3. Controlled deployment scheduled during off-hours (between 6:00 PM and 7:00 AM IST).
  4. Formal record added to the pilot changelog.

### 1.3 Class C: Feature Additions & Scope Expansions
- **Scope:** Any new UI widget, recommendation heuristic alteration, new question type, or workflow addition.
- **STRICT PROHIBITION:** **Class C changes are strictly forbidden during the pilot.**
- **Protocol:** Logged directly into the `Phase 4 Product Backlog`. Under no circumstances may new capabilities be introduced mid-pilot to "fix" engagement or adoption challenges.

---

## 2. Pilot Change Log

| Change ID | Class | Description | Affected Component | Date Deployed | Authorized By |
|---|:---:|---|---|:---:|---|
| **CC-P3-01** | B | Corrected question `Q-G8-ALG-014` solution explanation. | Content Bank | 2026-08-13 | Product Lead & SME |
| **CC-P3-02** | B | Added mobile layout margin between scratchpad reset and answer submission. | Frontend Student UI | 2026-08-15 | UX Lead |
| **CC-P3-03** | B | Aligned mastery threshold logic to require 3 independent correct answers. | Backend Learning Engine | 2026-08-17 | Tech Lead |
| **CC-P3-04** | B | Added compound index on `UserTopicMastery(userId, topicId)` for latency reduction. | Database Schema | 2026-08-19 | Tech Lead |
