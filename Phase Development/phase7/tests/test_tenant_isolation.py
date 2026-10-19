"""
YOUVA-EdAI — Phase 7 Tests: Multi-Tenant Boundary Isolation (P7-V02 to P7-V07)
Verifies row-level security, tenant context propagation, and cross-tenant breach prevention.
"""

import pytest
from phase7.models.tenant_isolation import (
    TenantContext,
    TenantIsolationEngine,
    CrossTenantViolationError,
    TenantAuthenticationError
)


@pytest.fixture
def engine():
    return TenantIsolationEngine()


def test_tenant_context_resolution():
    """P7-V02: Tenant context resolves correctly within scope and clears on exit."""
    assert TenantContext.get_tenant_id() is None

    with TenantContext(tenant_id="tenant-dps-rkpuram", user_id="usr_01", role="TEACHER"):
        assert TenantContext.get_tenant_id() == "tenant-dps-rkpuram"
        ctx = TenantContext.get()
        assert ctx["userId"] == "usr_01"
        assert ctx["role"] == "TEACHER"

    # Must be none after context exit
    assert TenantContext.get_tenant_id() is None


def test_missing_tenant_context_fails(engine):
    """P7-V07: Operations without tenant context fail closed with TenantAuthenticationError."""
    with pytest.raises(TenantAuthenticationError, match="Tenant context is required"):
        engine.insert(collection="students", record_id="rec_01", data={"name": "Aarav"})

    with pytest.raises(TenantAuthenticationError):
        engine.get(collection="students", record_id="rec_01")


def test_cross_tenant_student_read_denied(engine):
    """P7-V03: Tenant B attempting to read Tenant A student is denied."""
    # Seed Tenant A student
    with TenantContext(tenant_id="tenant-dps-rkpuram"):
        engine.insert(collection="students", record_id="std_001", data={"grade": 8, "score": 95})
        rec = engine.get(collection="students", record_id="std_001")
        assert rec is not None
        assert rec.data["score"] == 95

    # Tenant B attempts read
    with TenantContext(tenant_id="tenant-modern-school"):
        with pytest.raises(CrossTenantViolationError, match="denied read access"):
            engine.get(collection="students", record_id="std_001")


def test_cross_tenant_student_mutation_denied(engine):
    """P7-V04: Tenant B attempting to update or delete Tenant A student is denied."""
    with TenantContext(tenant_id="tenant-dps-rkpuram"):
        engine.insert(collection="students", record_id="std_002", data={"grade": 8, "status": "ACTIVE"})

    with TenantContext(tenant_id="tenant-modern-school"):
        with pytest.raises(CrossTenantViolationError, match="denied mutation access"):
            engine.update(collection="students", record_id="std_002", new_data={"status": "EXPELLED"})

        with pytest.raises(CrossTenantViolationError, match="denied delete access"):
            engine.delete(collection="students", record_id="std_002")


def test_cross_tenant_teacher_access_denied(engine):
    """P7-V05: Teacher from Tenant A cannot see Teacher profile from Tenant B."""
    with TenantContext(tenant_id="tenant-modern-school"):
        engine.insert(collection="teachers", record_id="tch_001", data={"subject": "Math"})

    with TenantContext(tenant_id="tenant-dps-rkpuram"):
        with pytest.raises(CrossTenantViolationError):
            engine.get(collection="teachers", record_id="tch_001")


def test_row_level_security_query_filtering(engine):
    """P7-V06: Queries strictly enforce RLS and never leak peer tenant records."""
    # Insert 3 students for DPS, 2 for Modern
    with TenantContext(tenant_id="tenant-dps-rkpuram"):
        engine.insert(collection="students", record_id="dps_1", data={"cohort": "G8"})
        engine.insert(collection="students", record_id="dps_2", data={"cohort": "G8"})
        engine.insert(collection="students", record_id="dps_3", data={"cohort": "G10"})

    with TenantContext(tenant_id="tenant-modern-school"):
        engine.insert(collection="students", record_id="mod_1", data={"cohort": "G8"})
        engine.insert(collection="students", record_id="mod_2", data={"cohort": "G8"})

    # DPS query
    with TenantContext(tenant_id="tenant-dps-rkpuram"):
        dps_results = engine.query(collection="students")
        assert len(dps_results) == 3
        assert all(r.tenant_id == "tenant-dps-rkpuram" for r in dps_results)
        assert all(not r.record_id.startswith("mod_") for r in dps_results)

    # Modern query
    with TenantContext(tenant_id="tenant-modern-school"):
        mod_results = engine.query(collection="students")
        assert len(mod_results) == 2
        assert all(r.tenant_id == "tenant-modern-school" for r in mod_results)
        assert all(not r.record_id.startswith("dps_") for r in mod_results)


def test_tenant_data_purging_preserves_peer_tenants(engine):
    """P7-V22: Purging Tenant A data leaves Tenant B completely intact."""
    with TenantContext(tenant_id="tenant-dps-rkpuram"):
        engine.insert("records", "rec_a1", {"val": 1})
        engine.insert("records", "rec_a2", {"val": 2})

    with TenantContext(tenant_id="tenant-modern-school"):
        engine.insert("records", "rec_b1", {"val": 3})

    assert engine.get_tenant_record_count("tenant-dps-rkpuram") == 2
    assert engine.get_tenant_record_count("tenant-modern-school") == 1

    # Unauthorized purge fails
    with pytest.raises(TenantAuthenticationError):
        engine.purge_tenant_data("tenant-dps-rkpuram", authorized_role="TEACHER")

    # Authorized admin purge
    purged = engine.purge_tenant_data("tenant-dps-rkpuram", authorized_role="ADMIN")
    assert purged == 2

    # Verify DPS is empty, Modern is completely untouched
    assert engine.get_tenant_record_count("tenant-dps-rkpuram") == 0
    assert engine.get_tenant_record_count("tenant-modern-school") == 1

    with TenantContext(tenant_id="tenant-modern-school"):
        rec = engine.get("records", "rec_b1")
        assert rec is not None
        assert rec.data["val"] == 3
