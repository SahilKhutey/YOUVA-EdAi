# Phase P1: Core Human–AI Learning Loop Runbook & Verification Guide

## 1. Prerequisites & Environment Setup

To run and verify the P1 Human–AI Learning Loop, ensure you have:
- Node.js v20+
- PostgreSQL instance running or configured
- npm v10+

```bash
cd backend
npm install
```

---

## 2. Database Migration & Validation

Validate Prisma schema and apply migration:

```bash
# Step 1: Validate Schema
npx prisma validate

# Step 2: Apply Migration
npx prisma migrate dev --name p1_learning_loop

# Or deploy migration in production
npx prisma migrate deploy
```

---

## 3. Running Verification & Test Suites

Run the dedicated test suite validating all P1 policy invariants:

```bash
# Run all Learning Loop Unit & Integration Tests
npm test -- src/learning-loop

# Run with Coverage Report
npm test -- --coverage src/learning-loop
```

### Verification Standard Checklist

| Item | Test Suite | Pass Condition |
| :--- | :--- | :--- |
| **AI cannot certify mastery** | `policy-engine.spec.ts` | `enforceMasteryCertificationRule` strictly returns `false` |
| **Cognitive load safety gate** | `policy-engine.spec.ts` | Load > 0.85 halts session -> `TEACHER_REVIEW_REQUIRED` |
| **AI cannot dismiss escalation** | `escalation-state-machine.spec.ts` | Actor `AI` throws `ForbiddenException` |
| **Invalid transitions rejected** | `escalation-state-machine.spec.ts` | Transition matrix rejects illegal reopening |
| **Idempotent evidence submission** | `evidence-processor.spec.ts` | Same `idempotencyKey` returns cached result without BKT re-execution |
| **Deterministic BKT & RL updates** | `evidence-processor.spec.ts` | Calls `BktService.updateMastery` with calculated pass/fail |
| **Teacher scope security** | `teacher-intervention.spec.ts` | Unlinked teacher accessing student throws `ForbiddenException` |
| **Teacher override authority** | `teacher-intervention.spec.ts` | Override updates status to `OVERRIDDEN` and records audit |
| **Authorization boundaries** | `learning-loop.controller.spec.ts` | Students blocked from querying peer gates or teacher queues |

---

## 4. API Reference & Sample Requests

All endpoints are prefixed by `/learning-loop` and require `Authorization: Bearer <JWT>`.

### 4.1 Submit Learning Evidence (Idempotent)
**Endpoint**: `POST /learning-loop/evidence`  
**Role**: `STUDENT`

```json
{
  "idempotencyKey": "evt-student1-topic01-attempt1",
  "topicId": "topic-uuid-here",
  "answer": "Option B: 42",
  "accuracy": 1.0,
  "attemptNumber": 1,
  "hintCount": 0,
  "engagementScore": 0.95
}
```

### 4.2 Query Policy Gate Status
**Endpoint**: `GET /learning-loop/gate/:studentId`  
**Role**: `STUDENT` (self), `TEACHER`, or `ADMIN`

**Response Example**:
```json
{
  "gateState": "AI_CONTINUE",
  "reason": "Safe to proceed with AI learning interaction.",
  "ruleEvaluations": [
    {
      "ruleName": "NOMINAL_LEARNING_METRICS",
      "passed": true,
      "reason": "All learning metrics and safety parameters within nominal boundaries."
    }
  ],
  "requiresTeacherReview": false,
  "requiresSafetyEscalation": false
}
```

### 4.3 Teacher Intervention Queue
**Endpoint**: `GET /learning-loop/teacher/queue`  
**Role**: `TEACHER`, `ADMIN`

### 4.4 Execute Teacher Override
**Endpoint**: `POST /learning-loop/teacher/intervention`  
**Role**: `TEACHER`, `ADMIN`

```json
{
  "studentId": "student-uuid-here",
  "decisionId": "decision-uuid-here",
  "action": "OVERRIDE",
  "feedback": "Reinforce fundamentals with visual diagrams before continuing quiz.",
  "overrideDetails": {
    "forcedActivityType": "REMEDIATION",
    "forcedDifficulty": 0.35,
    "forcedModality": "VISUAL",
    "forcedPacing": "SLOW",
    "teacherNotes": "Student displayed confusion on sign inversion."
  }
}
```

### 4.5 Resolve Safety Escalation
**Endpoint**: `POST /learning-loop/escalation/:id/resolve`  
**Role**: `TEACHER`, `ADMIN`

```json
{
  "status": "RESOLVED",
  "resolutionNotes": "Educator spoke with student directly and reviewed cognitive stress levels. Safe to resume."
}
```

### 4.6 Query Student Audit Trail
**Endpoint**: `GET /learning-loop/audit/:studentId`  
**Role**: `STUDENT` (self), `TEACHER`, or `ADMIN`
