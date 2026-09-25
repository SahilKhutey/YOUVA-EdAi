# YOUVA EdAI — Phase 8: Immutable Governance Ledger Specification
## Tamper-Evident HMAC-SHA256 Cryptographic Audit Chain for Autonomous AI Events

---

## 1. Architectural Purpose

To guarantee complete accountability and non-repudiation, all autonomy lifecycle events—including capability promotions, action evaluations, circuit breaker trips, and rollbacks—are recorded in an immutable, append-only cryptographic ledger.

---

## 2. Cryptographic Block Chaining Structure

Every event block in the `GovernanceLedger` contains the SHA-256 HMAC of its canonical payload combined with the preceding block's entry hash:

```
┌────────────────────────────────────────┐
│ ENTRY 0 (Genesis)                      │
│ - EntryID: "P8-GENESIS"                │
│ - PrevHash: "000000...000000" (64 0s)  │
│ - EntryHash: HmacSha256(Block 0)       │
└───────────────────┬────────────────────┘
                    │ Chained EntryHash
                    ▼
┌────────────────────────────────────────┐
│ ENTRY 1 (CAP-001 Action Evaluated)     │
│ - EntryID: "P8-ACT-001"                │
│ - PrevHash: Entry 0 EntryHash          │
│ - EntryHash: HmacSha256(Block 1)       │
└───────────────────┬────────────────────┘
                    │ Chained EntryHash
                    ▼
┌────────────────────────────────────────┐
│ ENTRY 2 (Drift Rollback Triggered)     │
│ - EntryID: "P8-ROLLBACK-001"           │
│ - PrevHash: Entry 1 EntryHash          │
│ - EntryHash: HmacSha256(Block 2)       │
└────────────────────────────────────────┘
```

### Entry Schema
```typescript
export interface GovernanceLedgerEntry {
  entryId: string;          // Unique monotonic UUID/Identifier
  eventType: string;        // e.g. "CAPABILITY_EVALUATION", "ROLLBACK_TRIGGERED"
  actorId: string;          // "AUTONOMOUS_GOVERNANCE_SYSTEM" or Teacher/Admin ID
  payload: Record<string, any>; // Canonical JSON payload
  timestamp: string;        // ISO 8601 UTC timestamp
  prevHash: string;         // 64-character hex hash of previous entry
  entryHash: string;        // HMAC-SHA256(entryId|eventType|payload|timestamp|prevHash)
}
```

---

## 3. Cryptographic Verification & Tamper Detection

The `GovernanceLedger.verify_chain_integrity()` function iterates linearly through all entries, verifying:
1. `entry["prevHash"] == expected_prev`
2. `entry["entryHash"] == recalculated_hmac`

If any record is altered, inserted, or truncated in storage, the verification fails instantaneously and identifies the exact entry index where tampering occurred:
```python
is_valid, error_msg = ledger.verify_chain_integrity()
# Returns: (False, "Tamper detected at index 2 (P8-CORRUPTED)")
```

This cryptographic integrity guarantee complies with DPDP Act 2023 audit standards and ISO/IEC 42001 AI management system certification requirements.
