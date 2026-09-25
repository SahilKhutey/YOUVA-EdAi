# YOUVA EdAI — Phase 7: LMS/SIS Adapter Validation
## Protocol Adapters, Schema Conformance, and Payload Ingestion Validation

---

## 1. Supported Integration Protocols

The P16 connector implements modular protocol adapters for standard institutional education software:

```
┌────────────────────────────────────────────────────────────────────────┐
│                        SUPPORTED LMS/SIS ADAPTERS                      │
├─────────────────────┬──────────────────┬───────────────────────────────┤
│ Protocol / Standard │ Target System    │ Primary Ingestion Object      │
├─────────────────────┼──────────────────┼───────────────────────────────┤
│ 1. Canvas REST API  │ Canvas LMS       │ Course Enrollments & Sections │
│ 2. Moodle Web API   │ Moodle LMS       │ Quiz Submission Metadata      │
│ 3. OneRoster v1.2   │ Custom SIS       │ Class Rosters & Demographics  │
└─────────────────────┴──────────────────┴───────────────────────────────┘
```

---

## 2. Inbound Data Schema Validation

Every external payload must strictly validate against the JSON schema before passing to the ingestion staging table:

```typescript
export interface ExternalLmsRecord {
  externalId: string;             // External LMS user/quiz ID
  sourceHost: string;             // Must match allowedLmsHosts allowlist
  ingestedAt: string;             // ISO-8601 timestamp
  recordType: "ENROLLMENT" | "ASSIGNMENT_METRIC";
  payload: {
    courseId: string;
    studentToken: string;
    score?: number;
    completedAt?: string;
  };
  provenanceSha256: string;       // SHA-256 hash over raw external JSON
}
```

---

## 3. Automated Adapter Testing

Tests in `phase7/tests/test_lms_interoperability.py` verify that:
- Malformed JSON payloads fail closed with schema validation errors.
- Oversized responses ($> 5\text{ MB}$) abort immediately with memory safety errors.
- External API timeouts ($> 5.0\text{ seconds}$) trigger graceful circuit-breaker fallbacks without freezing the application thread.
