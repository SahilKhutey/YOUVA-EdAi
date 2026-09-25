# YOUVA EdAI — Phase 0: Scope Lock & Decision Governance

## Overview
Phase 0 introduces zero product code. Its exclusive deliverable is the authoritative, signed-off **MVP SCOPE LOCK**, which establishes the binding contract across Product, Engineering, UX, Content, Safety, Compliance, Pilot Partners, and Leadership.

## Phase 0 State
Current Lifecycle State: **DRAFT**

Lifecycle State Machine:
```
DRAFT ──► DECISIONS_PENDING ──► LEGAL_REVIEW ──► STAKEHOLDER_REVIEW ──► SIGNOFF_PENDING ──► LOCKED
                                                                                           │
                                                                           Phase 1 Authorized
Terminal / Exceptional States:
BLOCKED | REJECTED | REOPENED
```

## Directory Structure
- `docs/product/phase-0/`: Core product scope, decision log, out-of-scope declarations, assumptions, pilot definition, content plan, and stakeholder sign-off.
- `docs/compliance/phase-0/`: Jurisdiction selection, legal review blocking artifact, compliance matrix, and deferred jurisdictions.
- `docs/architecture/phase-0/`: Architectural scope impact analysis.
- `governance/phase-0/`: Machine-readable scope JSON and JSON Schema specification.
- `scripts/`: Automated governance validator (`validate-phase-0-scope.mjs`).

## Validation Commands
```bash
# Validate draft scope structure
npm run validate:phase0

# Validate locked scope readiness (blocking gate for Phase 1)
npm run validate:phase0:locked
```
