# YOUVA EdAI — Phase 0 Architectural Scope Impact

## Overview
This document analyzes the impact of the Phase 0 Scope Lock decisions on the existing repository architecture (`YOUVA-EdAi`), detailing which modules are activated, which are isolated/frozen, and which are decoupled.

---

## 1. Repository Inventory Decoupling Matrix

The existing 60+ NestJS backend modules are categorized according to the MVP Scope Lock boundary:

```
┌─────────────────────────────────────────┐
│     ACTIVE MODULES (MVP Core Scope)     │
├─────────────────────────────────────────┤
│ • backend/src/auth/                     │
│ • backend/src/learning-loop/            │
│ • backend/src/mastery/                  │
│ • backend/src/teacher-ops/              │
│ • backend/src/safety/                   │
│ • backend/src/escalation/               │
│ • backend/src/prisma/                   │
└─────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────┐
│    FROZEN MODULES (Explicitly Out)      │
├─────────────────────────────────────────┤
│ • backend/src/subscription/ (Stripe)    │
│ • backend/src/interoperability/ (LMS)   │
│ • backend/src/credential-network/ (W3C) │
│ • backend/src/multimodal/ (Image/Video) │
│ • backend/src/governance/ (Autonomous)  │
│ • backend/src/early-childhood/          │
└─────────────────────────────────────────┘
```

---

## 2. Environment Guard: `PILOT_MODE=true`

To prevent accidental execution of frozen modules, `backend/src/app.module.ts` isolates them behind the `PILOT_MODE` environment flag:

```typescript
const isPilotMode = process.env.PILOT_MODE === 'true';

@Module({
  imports: [
    AuthModule,
    LearningLoopModule,
    MasteryModule,
    TeacherOpsModule,
    SafetyModule,
    EscalationModule,
    PrismaModule,
    ...(isPilotMode ? [] : [SubscriptionModule, InteroperabilityModule, MultimodalModule])
  ]
})
export class AppModule {}
```

---

## 3. Data Model Impact

- **User Model:** `gradeLevel` constrained to Middle School range (`Grade 7` / `Grade 8`).
- **Telemetry Boundaries:** Zero persistent biometric or location fields in PostgreSQL.
- **Audit Storage:** Cryptographic HMAC hash-chaining activated for all teacher overrides and safety events.
