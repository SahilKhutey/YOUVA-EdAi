# YOUVA EdAI — Phase 9: Jurisdiction Policy Template (C2)
## Standard Contract Definition and Machine-Readable Schema Specification

---

## 1. Schema Interface Specification (`JurisdictionPolicy`)

Every regional profile in `phase9/jurisdictions/` must implement the `JurisdictionPolicy` contract and strictly conform to `phase9/jurisdictions/jurisdiction.schema.json`.

```typescript
export interface JurisdictionPolicy {
  jurisdictionId: string;                   // Monotonic string ID, e.g. "us-coppa-ferpa"
  name: string;                             // Full official legal title
  statute: string;                          // Primary statutory citation
  version: string;                          // SemVer version, e.g. "1.0.0"
  status: "active" | "draft" | "suspended" | "retired";
  effectiveFrom: string;                    // ISO 8601 date string
  
  complianceRules: {
    childAgeThreshold: number;              // Age in years (e.g. 18 for IN, 13 for US)
    consentModel:
      | "verifiable_parental_consent"
      | "school_official_exception"
      | "explicit_guardian_opt_in";
    withdrawalPurgeSlaHours: number;        // Max permissible SLA in hours (<= 72)
    safetyEscalationSlaHours: number;       // Max permissible emergency SLA (<= 4)
    crossBorderTransferAllowed: boolean;   // Sovereign cloud transfer flag
    allowAnonymizedResearchTelemetry: boolean;
    mandatoryAuditRetentionDays: number;   // Retention schedule in days
  };

  legalReview: {
    reviewedBy: string;                     // External law firm / counsel identity
    reviewedAt: string;                     // ISO 8601 timestamp
    approved: boolean;                      // Formal approval flag
    legalOpinionDocumentRef: string;        // Path to signed opinion letter in Data Room
  };

  childSafetyReview: {
    reviewedBy: string;                     // Child Safety Officer identity
    reviewedAt: string;                     // ISO 8601 timestamp
    approved: boolean;                      // Formal child safeguarding approval
    emergencyEscalationProvider: string;    // National child helpline / agency
  };
}
```

---

## 2. Standard Machine-Readable Template (JSON)

New jurisdiction profiles must be authored using the following verified template structure:

```json
{
  "$schema": "./jurisdiction.schema.json",
  "jurisdictionId": "region-code-statute",
  "name": "Regional Education Privacy Framework",
  "statute": "Statutory Act Citation Year",
  "version": "1.0.0",
  "status": "draft",
  "effectiveFrom": "2026-10-01",
  "complianceRules": {
    "childAgeThreshold": 18,
    "consentModel": "verifiable_parental_consent",
    "withdrawalPurgeSlaHours": 24,
    "safetyEscalationSlaHours": 4,
    "crossBorderTransferAllowed": false,
    "allowAnonymizedResearchTelemetry": true,
    "mandatoryAuditRetentionDays": 365
  },
  "legalReview": {
    "reviewedBy": "Pending In-Country Legal Counsel",
    "reviewedAt": "2026-09-01T00:00:00Z",
    "approved": false,
    "legalOpinionDocumentRef": "DOCS/LEGAL/PENDING-OPINION.pdf"
  },
  "childSafetyReview": {
    "reviewedBy": "Chief Child Safety Officer",
    "reviewedAt": "2026-09-01T00:00:00Z",
    "approved": false,
    "emergencyEscalationProvider": "National Child Safeguarding Authority"
  }
}
```

Profiles remain locked in `draft` status until `legalReview.approved` and `childSafetyReview.approved` are both cryptographically validated.
