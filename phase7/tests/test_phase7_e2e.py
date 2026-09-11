"""
YOUVA-EdAI — Phase 7 Tests: End-to-End Scale & Invariant Integration (P7-V21 to P7-V24)
Verifies:
- P7-V21: Authorization regression & privilege escalation defenses.
- P7-V22: Multi-tenant data purge isolation.
- P7-V23: Concurrent load test across multiple tenants with zero cross-tenant contamination.
- P7-V24: Complete production E2E lifecycle (Contract -> License -> LMS -> Review -> Safety -> Audit).
"""

import concurrent.futures
from datetime import datetime, timezone, timedelta
import json
from pathlib import Path
import time
import pytest

from phase7.demand.demand_validator import DemandValidator
from phase7.models.tenant_isolation import TenantContext, TenantIsolationEngine, CrossTenantViolationError
from phase7.models.tenant_cache_queue import TenantCache, TenantJobQueue
from phase7.models.licensing_engine import LicensingEngine, SeatQuotaExceededError
from phase7.models.lms_connector import LMSConnector, SSRFGuard
from phase7.models.safety_operations import SafetyOperationsManager, IncidentSeverity
from phase7.models.operational_audit import OperationalAuditLedger

CONTRACT_PATH = Path(__file__).resolve().parent.parent / "data" / "dps_enterprise_contract.json"


def test_authorization_regression_no_privilege_escalation():
    """P7-V21: Role-based boundaries cannot be bypassed via forged headers or roles."""
    engine = TenantIsolationEngine()

    # User cannot insert or query across tenant boundaries even if claiming ADMIN in another tenant
    with TenantContext(tenant_id="tenant-dps-rkpuram", user_id="student_aarav", role="STUDENT"):
        engine.insert("profiles", "prof_01", {"name": "Aarav"})

    # Student trying to access as teacher in another tenant
    with TenantContext(tenant_id="tenant-modern-school", user_id="student_aarav", role="TEACHER"):
        with pytest.raises(CrossTenantViolationError):
            engine.get("profiles", "prof_01")


def test_data_deletion_tenant_boundaries_preserved():
    """P7-V22: Deleting tenant records strictly affects only target tenant."""
    engine = TenantIsolationEngine()

    with TenantContext("tenant-alpha"):
        for i in range(10):
            engine.insert("items", f"item_a_{i}", {"val": i})

    with TenantContext("tenant-beta"):
        for i in range(10):
            engine.insert("items", f"item_b_{i}", {"val": i})

    assert engine.get_tenant_record_count("tenant-alpha") == 10
    assert engine.get_tenant_record_count("tenant-beta") == 10

    engine.purge_tenant_data("tenant-alpha", authorized_role="ADMIN")

    assert engine.get_tenant_record_count("tenant-alpha") == 0
    assert engine.get_tenant_record_count("tenant-beta") == 10


def test_load_test_isolation_maintained():
    """P7-V23: Multi-tenant load test under concurrency maintains strict isolation."""
    engine = TenantIsolationEngine()
    cache = TenantCache()
    tenants = [f"load-tenant-{i}" for i in range(8)]
    ops_per_tenant = 40

    def load_runner(t_id: str):
        with TenantContext(t_id):
            for step in range(ops_per_tenant):
                rec_id = f"{t_id}_rec_{step}"
                engine.insert("data", rec_id, {"step": step, "tenant": t_id})
                cache.set("cache_data", f"key_{step}", {"step": step, "tenant": t_id})

                # Read back and verify absolute isolation
                rec = engine.get("data", rec_id)
                if rec.data["tenant"] != t_id:
                    return False

                c_val = cache.get("cache_data", f"key_{step}")
                if c_val["tenant"] != t_id:
                    return False
        return True

    t0 = time.time()
    with concurrent.futures.ThreadPoolExecutor(max_workers=8) as executor:
        futures = [executor.submit(load_runner, t) for t in tenants]
        results = [f.result() for f in futures]
    t1 = time.time()

    assert all(results) is True
    # 8 tenants * 40 ops = 320 records
    assert sum(engine.get_tenant_record_count(t) for t in tenants) == 320
    # Latency should be fast (< 2.0s)
    assert (t1 - t0) < 2.0


def test_full_production_e2e_flow():
    """
    P7-V24: Full Production Lifecycle:
    Demand Contract Validation ->
    Tenant Context & RLS ->
    Licensing & Seat Quota ->
    LMS Connector Activation & SSRF Validation ->
    Staged Observation & Cryptographic Provenance ->
    Mandatory Human Teacher Review ->
    Authorized Mastery Transition ->
    Safety Incident Escalation Check ->
    HMAC-SHA256 Chained Operational Audit Verification.
    """
    # 1. Demand contract verification
    with open(CONTRACT_PATH, "r", encoding="utf-8") as f:
        contract_data = json.load(f)

    validator = DemandValidator()
    demand_seal = validator.validate_contract(contract_data)
    assert demand_seal["valid"] is True

    # 2. Tenant Context & Isolation Engine
    tenant_id = contract_data["tenantId"]
    db = TenantIsolationEngine()
    audit = OperationalAuditLedger()

    with TenantContext(tenant_id, user_id="admin_01", role="ADMIN"):
        db.insert("tenants", tenant_id, {"institution": contract_data["institutionName"], "status": "ACTIVE"})
        audit.append_event("AUD-INIT-01", tenant_id, "TENANT_PROVISIONED", "admin_01", {"contract": contract_data["contractId"]})

    # 3. Licensing & Seat Allocation
    licensing = LicensingEngine()
    future_date = (datetime.now(timezone.utc) + timedelta(days=365)).isoformat()
    lic = licensing.create_license(
        license_id="LIC-DPS-SCALE-01",
        contract_id=contract_data["contractId"],
        tenant_id=tenant_id,
        student_seats=250,
        teacher_seats=20,
        expires_at_iso=future_date
    )

    # Allocate seat
    student_id = "anon_cbse8_001"
    licensing.allocate_student_seat(lic["licenseId"], student_id)
    assert licensing.check_entitlement(lic["licenseId"], student_id, "STUDENT") is True

    # 4. LMS Connector Activation
    lms = LMSConnector(tenant_id=tenant_id, contract_id=contract_data["contractId"])
    lms.activate_with_contract(contract_data)
    assert lms.is_activated is True

    # 5. External record sync & staging
    raw_grade_item = [{
        "externalStudentId": "canvas_student_441",
        "internalStudentId": student_id,
        "conceptId": "MATH-G8-LINEQ-02",
        "score": 0.90
    }]

    staged = lms.ingest_external_observations(
        endpoint_url="https://canvas.dpsrkp.net/api/v1/courses/101/grades",
        source_system="CANVAS_LMS",
        raw_items=raw_grade_item
    )
    assert len(staged) == 1
    obs = staged[0]
    assert obs.review_status == "PENDING_REVIEW"

    # 6. Human Teacher Authorization Invariant
    teacher_id = "teacher_geeta_01"
    auth_result = lms.review_and_authorize_observation(
        staging_id=obs.staging_id,
        teacher_id=teacher_id,
        decision="APPROVED",
        teacher_notes="CBSE Unit Test 1 Verified."
    )
    assert auth_result["masteryUpdated"] is True

    # Store finalized learning state in tenant DB
    with TenantContext(tenant_id, user_id=teacher_id, role="TEACHER"):
        db.insert("mastery", f"mst_{student_id}_{obs.concept_id}", auth_result)
        audit.append_event(
            entry_id="AUD-MAST-01",
            tenant_id=tenant_id,
            event_type="MASTERY_AUTHORIZED_FROM_LMS",
            actor_id=teacher_id,
            payload={"studentId": student_id, "conceptId": obs.concept_id, "provenance": obs.provenance_checksum}
        )

    # 7. Safety Monitoring Check
    safety = SafetyOperationsManager(tenant_id=tenant_id)
    assert len(safety.check_sla_breaches()) == 0

    # 8. Chained Audit Verification
    is_valid, err = audit.verify_chain_integrity()
    assert is_valid is True
    assert err is None
    assert audit.count() == 2
