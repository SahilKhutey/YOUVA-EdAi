"""
YOUVA-EdAI — Phase 7 Tests: Cache & Background Queue Isolation (P7-V08 to P7-V10)
Verifies that multi-tenant isolation extends to caching layers, asynchronous task queues,
and concurrent worker executions with zero data leakage.
"""

import concurrent.futures
import pytest
from phase7.models.tenant_isolation import TenantContext
from phase7.models.tenant_cache_queue import (
    TenantCache,
    TenantJobQueue,
    TenantCacheViolationError,
    TenantJobViolationError
)


def test_tenant_cache_isolation():
    """P7-V09: Cache keys are strictly tenant-isolated."""
    cache = TenantCache()

    # Tenant A sets a profile in cache
    with TenantContext("tenant-dps-rkpuram"):
        key = cache.set("students", "profile_001", {"name": "Aarav", "bktMastery": 0.82})
        assert "tenant:tenant-dps-rkpuram:students:profile_001" == key
        val = cache.get("students", "profile_001")
        assert val is not None
        assert val["bktMastery"] == 0.82

    # Tenant B requests the same key in the same namespace
    with TenantContext("tenant-modern-school"):
        val_b = cache.get("students", "profile_001")
        # Must be None — no cross-tenant cache hit
        assert val_b is None

        # Tenant B can set its own value without collision
        cache.set("students", "profile_001", {"name": "Diya", "bktMastery": 0.45})
        assert cache.get("students", "profile_001")["name"] == "Diya"

    # Verify Tenant A's cache was not overwritten
    with TenantContext("tenant-dps-rkpuram"):
        assert cache.get("students", "profile_001")["name"] == "Aarav"


def test_tenant_job_queue_isolation():
    """P7-V08: Background jobs execute only within the matching tenant's worker sandbox."""
    queue = TenantJobQueue()

    # Enqueue jobs for two separate tenants
    with TenantContext("tenant-dps-rkpuram"):
        queue.enqueue(
            job_id="job_dps_1",
            job_type="BKT_RECALCULATION",
            payload={"studentCount": 30}
        )

    with TenantContext("tenant-modern-school"):
        queue.enqueue(
            job_id="job_mod_1",
            job_type="GRADEBOOK_SYNC",
            payload={"cohort": "G10"}
        )

    assert queue.get_queue_depth("tenant-dps-rkpuram") == 1
    assert queue.get_queue_depth("tenant-modern-school") == 1

    # Worker for DPS processes DPS job
    dps_job = queue.process_next_job(worker_tenant_id="tenant-dps-rkpuram")
    assert dps_job is not None
    assert dps_job["jobId"] == "job_dps_1"
    assert dps_job["status"] == "COMPLETED"
    assert queue.get_queue_depth("tenant-dps-rkpuram") == 0

    # Modern queue still has its job
    assert queue.get_queue_depth("tenant-modern-school") == 1

    # Worker without tenant declared fails
    with pytest.raises(TenantJobViolationError, match="declared tenant_id"):
        queue.process_next_job(worker_tenant_id="")


def test_concurrent_tenant_requests_no_leakage():
    """P7-V10: Highly concurrent multi-tenant read/writes produce zero cross-talk."""
    cache = TenantCache()
    tenants = [f"tenant-school-{i}" for i in range(10)]

    def tenant_worker(t_id: str):
        with TenantContext(t_id):
            for step in range(25):
                cache.set("benchmarks", f"item_{step}", {"tenant": t_id, "step": step})
                read_back = cache.get("benchmarks", f"item_{step}")
                if read_back["tenant"] != t_id:
                    return False
        return True

    with concurrent.futures.ThreadPoolExecutor(max_workers=5) as executor:
        futures = [executor.submit(tenant_worker, t) for t in tenants]
        results = [f.result() for f in futures]

    assert all(results) is True
    # 10 tenants * 25 items = 250 isolated keys
    assert cache.get_raw_key_count() == 250
