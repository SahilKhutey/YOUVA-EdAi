# YOUVA EdAI — Phase 7: B2B Institutional School Licensing Specification
## Enterprise Contract Binding, Seat Quota Enforcement, and Webhook Idempotency

---

## 1. Architectural Scope & Invariants

The B2B Institutional Licensing Engine (`LicensingEngine`) governs school onboarding, seat allocations, and contract lifecycle:

### Core Licensing Invariants
1. **Hard Seat Quota Ceiling**: An institutional tenant cannot provision more active student seats than contracted. Overflow attempts fail closed with `SeatQuotaExceededError`.
2. **Contract-Bound Entitlements**: Features (e.g. High School tier, Early Learner tier, LMS sync) are activated strictly via `TenantEntitlement` linked to a verified `InstitutionalContract`.
3. **Webhook Replay Idempotency**: Billing and license provisioning webhooks must be cryptographically verified and idempotent. Replayed webhooks cannot duplicate seats or corrupt contract status.

---

## 2. Institutional Contract Domain Model

```typescript
export interface InstitutionalContract {
  id: string;                     // "CONTRACT-DPSRKP-2026-SCALE"
  tenantId: string;               // "tenant-dps-rkpuram"
  contractReference: string;      // "DPS-SOC-ANNUAL-2026-001"
  startsAt: Date;                 // "2026-08-01T00:00:00Z"
  endsAt: Date;                   // "2027-07-31T23:59:59Z"
  licensedSeats: number;          // 250
  status: 
    | "DRAFT"
    | "ACTIVE"
    | "SUSPENDED"
    | "EXPIRED"
    | "TERMINATED";
}

export interface TenantEntitlement {
  tenantId: string;
  entitlementType: string;        // e.g. "TIER_HIGH_SCHOOL", "LMS_SYNC"
  quantity: number | null;        // e.g. 250 seats, or null for boolean feature
  startsAt: Date;
  endsAt: Date | null;
  source: "CONTRACT" | "SUBSCRIPTION" | "MANUAL";
}
```

---

## 3. Seat Allocation & Quota Enforcement Algorithm

```python
# phase7/models/licensing_engine.py

def allocate_seat(self, tenant_id: str, student_id: str) -> None:
    contract = self.get_active_contract(tenant_id)
    if not contract or contract.status != LicenseStatus.ACTIVE:
        raise LicenseStatusError(f"Tenant '{tenant_id}' has no active license contract.")
    
    current_seats = self.get_allocated_seat_count(tenant_id)
    if current_seats >= contract.licensed_seats:
        raise SeatQuotaExceededError(
            f"Cannot allocate seat to student '{student_id}'. "
            f"Quota ceiling reached ({current_seats}/{contract.licensed_seats} seats)."
        )
    
    self._seats[tenant_id].add(student_id)
```

### Verification Guarantee
Tests in `test_licensing_engine.py` verify that allocating student seat 251 under a 250-seat contract raises `SeatQuotaExceededError` immediately, preventing unmetered license expansion.
