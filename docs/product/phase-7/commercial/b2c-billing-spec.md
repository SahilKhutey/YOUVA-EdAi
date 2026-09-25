# YOUVA EdAI — Phase 7: B2C Consumer Billing Specification
## Direct-to-Consumer Subscription Flow, Webhook Idempotency, and Strategic Deferral Record

---

## 1. B2C Architecture Topology (Dormant Blueprint)

Although B2C consumer billing is **deferred** in Phase 7 due to lack of validated consumer demand, the technical specification is codified to govern future activation:

```
Customer ──> Subscription Checkout ──> Payment Processor (Stripe / Razorpay)
                                                      │
                                                      ▼
[Server-Side Webhook Receiver] <───────────── Webhook Event
              │
              ▼
[Cryptographic Webhook Signature & Idempotency Check]
              │
              ▼
[Server-Side Entitlement Reconciler] ──> Grants / Revokes Feature Access
              │
              ▼
[Product Access Enabled / Disabled]
```

### Core Invariant
$$\mathbf{Payment\ Status\ and\ Product\ Entitlement\ MUST\ Reconcile\ Server\text{-}Side}$$
Client-side payment callbacks (e.g. `onSuccess()`) cannot grant product access. Access is unlocked strictly upon receiving and validating an authenticated webhook directly from the payment processor.

---

## 2. Webhook Event Replay & Reordering Invariants

| Event Scenario | System Reaction & Invariant Guaranteed |
|---|---|
| **Payment Succeeded** | `payment_intent.succeeded` received; checks idempotency key; provisions 30-day family entitlement. |
| **Payment Failed** | `invoice.payment_failed` received; transitions entitlement to `GRACE_PERIOD_3_DAYS`; notifies parent. |
| **Subscription Cancelled** | `customer.subscription.deleted` received; entitlement remains active until `current_period_end`, then transitions to `EXPIRED`. |
| **Duplicate Webhook** | Webhook with identical `event.id` replayed by network; system detects existing idempotency record; returns `200 OK` with zero duplicate mutations. |
| **Reordered Webhooks** | Out-of-order events (e.g. `cancelled` arriving before `created`); system evaluates event timestamp, ensuring later timestamp always overrides earlier state. |

---

## 3. Formal Strategic Deferral Statement

```
COMMERCIAL INFRASTRUCTURE DEFERRAL RECORD
Component: B2C Recurring Subscription Engine (Stripe Integration)
Phase: Phase 7
Decision: DEFERRED (DORMANT)

Rationale:
1. Customer Demand Gate: Zero consumer marketing or paid acquisition channels launched.
2. Regulatory Overhead: PCI-DSS compliance, credit card storage audits, and consumer refund mandates
   divert resources from B2B school scaling.
3. Architecture Decoupling: Product entitlements are driven by `TenantEntitlement`, meaning B2C billing
   can be connected in a future phase without modifying the core learning engine.
```
