# YOUVA EdAI — Phase 7: Product Entitlement Specification
## Commercial Decoupling, Feature Gating, and Unified Entitlement Modeling

---

## 1. Architectural Philosophy: Decoupling Entitlements from Billing Providers

In poorly decoupled platforms, code checks payment processor objects directly:
`if (user.stripeSubscription.status === 'active') { unlockFeature(); }`

This creates brittle vendor lock-in. If an institutional school pays via annual purchase order or government check, the billing model breaks.

In YOUVA EdAI:
> **The product entitlement engine knows nothing about Stripe, Razorpay, or purchase orders.**
> It checks `TenantEntitlement` records, which can be sourced from B2B contracts, B2C subscriptions, or administrative overrides.

---

## 2. Entitlement Data Model & Schema

```typescript
export type EntitlementSource = "CONTRACT" | "SUBSCRIPTION" | "MANUAL";

export interface TenantEntitlement {
  id: string;                     // "ent_89102"
  tenantId: string;               // "tenant-dps-rkpuram"
  entitlementType: string;        // Feature identifier
  quantity: number | null;        // Numeric limit or null for boolean feature
  startsAt: Date;
  endsAt: Date | null;
  source: EntitlementSource;
  status: "ACTIVE" | "EXPIRED" | "REVOKED";
}
```

### 2.1 Standard Entitlement Feature Keys
- `FEAT_TIER_HIGH_SCHOOL`: Access to Grade 9–10 secondary mathematics and quadratic DAG.
- `FEAT_TIER_EARLY_LEARNER`: Access to Grade 3 foundational numeracy and Parent Co-Pilot.
- `FEAT_SKILLS_PASSPORT`: Ability for teachers to digitally sign W3C VC 2.0 credentials.
- `FEAT_LMS_INTEROP`: Synchronization with on-premise SIS/LMS endpoints.
- `SEAT_LICENSES`: Number of concurrently active student accounts allowed.

---

## 3. Entitlement Evaluation Engine

```python
# Evaluator in phase7/models/licensing_engine.py

def check_feature_entitlement(self, tenant_id: str, feature_key: str) -> bool:
    """Verifies active entitlement without checking payment processor."""
    entitlements = self.get_tenant_entitlements(tenant_id)
    now = datetime.now(timezone.utc)
    for ent in entitlements:
        if ent.entitlement_type == feature_key and ent.status == "ACTIVE":
            if ent.ends_at is None or ent.ends_at > now:
                return True
    return False
```
