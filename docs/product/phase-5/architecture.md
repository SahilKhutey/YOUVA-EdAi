# YOUVA EdAI — Phase 5 Tier Architecture & Configuration Model

**Architecture Version:** 1.0  
**Phase:** Phase 5 — High School Expansion  
**Governing Architectural Invariant:** Tier-specific behavior $\ne$ Duplicated learning engine. High School is a configuration and content profile on top of the shared core.

---

## 1. System Topology

```
                  ┌──────────────────────────────────────────────┐
                  │            VALIDATED PLATFORM CORE           │
                  │  ├── Corbett & Anderson 4-Parameter BKT      │
                  │  ├── DPDP Act §9 Verifiable Parental Consent │
                  │  ├── Dual-Channel Child Safety Dispatch      │
                  │  └── Tamper-Evident HMAC-SHA256 Audit Ledger │
                  └──────────────────────┬───────────────────────┘
                                         │
                                         ▼
                  ┌──────────────────────────────────────────────┐
                  │           TIER POLICY ABSTRACTION            │
                  │              (EducationTierPolicy)           │
                  └──────────────┬────────────────┬──────────────┘
                                 │                │
                 ┌───────────────┘                └───────────────┐
                 ▼                                                ▼
     ┌────────────────────────┐                      ┌────────────────────────┐
     │  MIDDLE SCHOOL PROFILE │                      │  HIGH SCHOOL PROFILE   │
     │  • Grade 8 Math        │                      │  • Grade 10 Quadratics │
     │  • Guided Practice     │                      │  • Self-Directed Goals │
     │  • Socratic Dialogue   │                      │  • Analytical Visuals  │
     │  • Daily Teacher Queue │                      │  • Milestone Oversight │
     │  • No Credentials      │                      │  • Skills Passport MVP │
     └────────────────────────┘                      └────────────────────────┘
```

---

## 2. EducationTierPolicy Configuration (Cycle 3)

```typescript
export interface EducationTierPolicy {
  tier: "MIDDLE_SCHOOL" | "HIGH_SCHOOL";
  autonomyLevel: "GUIDED" | "SELF_DIRECTED";
  gamificationLevel: "LOW" | "MODERATE" | "MINIMAL";
  studentMasteryVisibility: "BASIC" | "DETAILED";
  parentVisibility: "STANDARD" | "CONFIGURABLE";
  teacherOversight: "FREQUENT" | "MILESTONE";
  goalSettingEnabled: boolean;
  skillsPassportEnabled: boolean;
}

export const HIGH_SCHOOL_POLICY: EducationTierPolicy = {
  tier: "HIGH_SCHOOL",
  autonomyLevel: "SELF_DIRECTED",
  gamificationLevel: "MINIMAL",
  studentMasteryVisibility: "DETAILED",
  parentVisibility: "CONFIGURABLE",
  teacherOversight: "MILESTONE",
  goalSettingEnabled: true,
  skillsPassportEnabled: true,
};

export const MIDDLE_SCHOOL_POLICY: EducationTierPolicy = {
  tier: "MIDDLE_SCHOOL",
  autonomyLevel: "GUIDED",
  gamificationLevel: "MODERATE",
  studentMasteryVisibility: "BASIC",
  parentVisibility: "STANDARD",
  teacherOversight: "FREQUENT",
  goalSettingEnabled: false,
  skillsPassportEnabled: false,
};
```

---

## 3. Tier Policy Resolution Workflow

When a request arrives at the API:
1. The user's active enrollment resolves their tier via `TeacherClassEnrollment` or `User.gradeLevel`.
2. The runtime attaches the appropriate `EducationTierPolicy` to the request context.
3. Services query the policy rather than executing hard-coded `if (grade === "8")` checks.
