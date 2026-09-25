# YOUVA EdAI — Phase 7: External Ingestion Gate & Pedagogical Invariant
## The Master Pedagogical Invariant: Complete Prohibition of Direct External Mastery Mutations

---

## 1. The Core Architectural Invariant

A dangerous architectural shortcut in educational platforms is allowing external LMS gradebooks (Canvas, Moodle) to directly overwrite internal cognitive state models:
$$\text{External 90\% Quiz Score} \xrightarrow{\quad\text{FORBIDDEN}\quad} \text{BKT } P(L) = 0.95$$

**Why this is strictly prohibited:**
1. External LMS quizzes frequently lack psychometric calibration (unknown guess/slip probabilities).
2. External grades may reflect open-book collaboration, parental assistance, or unproctored web browsing.
3. Overwriting the BKT knowledge state corrupts the prerequisite DAG and invalidates adaptive personalization.

In YOUVA EdAI:
$$\mathbf{External\ Record} \longrightarrow \mathbf{Imported\ Evidence} \longrightarrow \mathbf{Human\ Teacher\ Review} \longrightarrow \mathbf{Learning\ State\ Decision}$$

---

## 2. The 4-Stage Ingestion Pipeline

```
  [1. External LMS Fetch] 
        │ (Fetches external score via SSRF-safe adapter)
        ▼
  [2. Staging Table with Cryptographic Provenance] 
        │ (Stores raw record + SHA-256 hash in `StagedExternalEvidence`)
        ▼
  [3. Teacher Review Cockpit Queue] 
        │ (Presents evidence to educator alongside current BKT readiness)
        ▼
  [4. Authorized Knowledge State Update]
        │ (Teacher clicks "Approve Evidence" -> BKT engine processes observation)
        ▼
  [Append-Only HMAC Audit Ledger Entry]
```

---

## 3. Code-Level Enforcement

Implemented in `phase7/models/lms_connector.py`:

```python
def apply_external_evidence_to_mastery(
    self,
    evidence_id: str,
    teacher_authorization: Optional[Dict[str, Any]]
) -> None:
    """Enforces the Master Pedagogical Invariant."""
    if not teacher_authorization:
        raise UnreviewedMasteryMutationError(
            f"External evidence '{evidence_id}' cannot mutate knowledge state "
            f"without explicit human teacher review and authorization."
        )
    
    if teacher_authorization.get("decision") != "APPROVED":
        raise UnreviewedMasteryMutationError(
            f"Teacher authorization decision must be 'APPROVED' (got '{teacher_authorization.get('decision')}')."
        )
```

### Verification Guarantee
Tests in `test_lms_interoperability.py` verify that any automated script attempting to apply external grades without verified teacher authorization is aborted with `UnreviewedMasteryMutationError`.
