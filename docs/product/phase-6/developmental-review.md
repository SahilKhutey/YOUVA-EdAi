# YOUVA EdAI — Phase 6: Developmental Content Review Pipeline
## 7-Stage Multi-Disciplinary Content Publication Workflow and Quality Gates

---

## 1. Quality Philosophy: Content as a Safety Boundary

In secondary and higher education, pedagogical content review focuses primarily on factual accuracy and curriculum coverage. In early learner systems:
> **Content is itself an integral component of the safety boundary.**
> An inappropriately phrased question or jarring audio cue can cause emotional distress, cognitive overload, or attentional shutdown in young learners.

The publication workflow requires seven sequential, multi-disciplinary gates before any content item is marked `PUBLISHED`.

---

## 2. The 7-Stage Publication Pipeline

```
  [1. AUTHOR] 
        │ (Drafts prompt, chooses visual assets, writes audio script)
        ▼
  [2. CURRICULUM REVIEW] 
        │ (Verifies alignment with NCERT Class 3 & NIPUN Bharat learning outcomes)
        ▼
  [3. AGE / DEVELOPMENTAL REVIEW] 
        │ (Verifies cognitive load, 8-word cap, vocabulary from 146-word lexicon)
        ▼
  [4. CHILD-SAFETY REVIEW] 
        │ (Inspects for dark patterns, emotional triggers, and gender/cultural bias)
        ▼
  [5. UX & VOICE QA] 
        │ (Acoustic verification: natural cadence, warm tone, clear pronunciation)
        ▼
  [6. TECHNICAL QA] 
        │ (Asset hash verification, JSON schema validation, offline cache check)
        ▼
  [7. APPROVED & PUBLISHED]
```

---

## 3. Detailed Review Criteria per Stage

| Stage | Responsible Role | Pass Criteria | Rejection Triggers |
|---|---|---|---|
| **1. Authoring** | Educational Content Creator | Valid `EarlyLearnerContentItem` format; prompt audio script submitted. | Missing audio assets or incomplete tap targets. |
| **2. Curriculum** | Primary Mathematics SME | Direct mapping to `NUM-EARLY-01` or equivalent NCERT competency. | Out-of-grade mathematical concepts (e.g. division remainders). |
| **3. Developmental** | Developmental Psychologist | Readability Grade $\le 1.0$; prompt $\le 8$ words; cognitive steps $\le 2$. | Complex multi-clause sentences or abstract metaphors. |
| **4. Child Safety** | Certified Safety Officer | Zero prohibited dark patterns; zero urgency terms; inclusive imagery. | Words like `"hurry"`, `"streak"`, or high-contrast startling graphics. |
| **5. Voice QA** | Audio Engineer & Linguist | Audio bitrate $\ge 128\text{ kbps}$; speaking rate 110–130 wpm; clear Indian English phonology. | Harsh clipping, robotic pitch, or muffled acoustics. |
| **6. Tech QA** | QA Automation Engineer | SHA-256 asset integrity check; unit test validation in `test_junior_content.py`. | Broken asset URLs, schema mismatches, or missing tap coordinates. |
| **7. Published** | Lead System Architect | Formal digital signature added to publication manifest. | Any open review flag or pending audit comment. |
