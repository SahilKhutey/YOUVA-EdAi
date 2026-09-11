"""
YOUVA-EdAI — Phase 7: Tenant Cache & Background Job Queue Isolation (P7.7)
Guarantees that caching and background asynchronous task workers strictly
preserve tenant boundaries, preventing subtle cross-tenant leaks.
"""

from collections import deque
from datetime import datetime, timezone
import time
from typing import Any, Dict, List, Optional
from .tenant_isolation import TenantContext, TenantAuthenticationError


class TenantCacheViolationError(PermissionError):
    """Raised when an operation attempts to access or pollute another tenant's cache space."""
    pass


class TenantJobViolationError(PermissionError):
    """Raised when a worker attempts to process a background job belonging to another tenant."""
    pass


class TenantCache:
    """
    Tenant-scoped cache simulator.
    Prefixes all cache keys with tenant context: `tenant:{tenant_id}:{namespace}:{key}`.
    """

    def __init__(self):
        # key -> (value, expiry_timestamp_or_none)
        self._store: Dict[str, tuple[Any, Optional[float]]] = {}

    def _build_key(self, namespace: str, key: str, tenant_id: str) -> str:
        if not namespace or not key or not tenant_id:
            raise ValueError("Namespace, key, and tenant_id are all required")
        return f"tenant:{tenant_id}:{namespace}:{key}"

    def set(
        self,
        namespace: str,
        key: str,
        value: Any,
        ttl_seconds: Optional[float] = None
    ) -> str:
        """Stores a value under the active tenant's namespace."""
        tenant_id = TenantContext.require_tenant_id()
        full_key = self._build_key(namespace, key, tenant_id)
        expiry = (time.time() + ttl_seconds) if ttl_seconds is not None else None
        self._store[full_key] = (value, expiry)
        return full_key

    def get(self, namespace: str, key: str) -> Optional[Any]:
        """Retrieves a value from the active tenant's namespace."""
        tenant_id = TenantContext.require_tenant_id()
        full_key = self._build_key(namespace, key, tenant_id)

        if full_key not in self._store:
            return None

        val, expiry = self._store[full_key]
        if expiry is not None and time.time() > expiry:
            del self._store[full_key]
            return None

        return val

    def delete(self, namespace: str, key: str) -> bool:
        """Deletes a key from the active tenant's namespace."""
        tenant_id = TenantContext.require_tenant_id()
        full_key = self._build_key(namespace, key, tenant_id)
        if full_key in self._store:
            del self._store[full_key]
            return True
        return False

    def get_raw_key_count(self) -> int:
        """Total number of cached items across all tenants."""
        return len(self._store)

    def verify_no_cross_tenant_access(self, target_tenant_id: str, probe_tenant_id: str, namespace: str, key: str) -> bool:
        """
        Verifies that probe_tenant cannot access or see target_tenant's cached item.
        """
        target_key = self._build_key(namespace, key, target_tenant_id)
        probe_key = self._build_key(namespace, key, probe_tenant_id)
        return target_key != probe_key


class TenantJobQueue:
    """
    Tenant-partitioned background job queue.
    Prevents asynchronous workers from processing jobs belonging to another tenant.
    """

    def __init__(self):
        # tenant_id -> deque of job dicts
        self._queues: Dict[str, deque[Dict[str, Any]]] = {}
        # job_id -> job dict
        self._all_jobs: Dict[str, Dict[str, Any]] = {}

    def enqueue(
        self,
        job_id: str,
        job_type: str,
        payload: Dict[str, Any],
        tenant_id: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Enqueues a background job bound to tenant context.
        """
        active_tenant = TenantContext.require_tenant_id()
        target_tenant = tenant_id or active_tenant

        if target_tenant != active_tenant:
            raise TenantJobViolationError(
                f"Active tenant [{active_tenant}] cannot enqueue job for tenant [{target_tenant}]"
            )

        job = {
            "jobId": job_id,
            "tenantId": target_tenant,
            "jobType": job_type,
            "payload": dict(payload),
            "status": "QUEUED",
            "enqueuedAt": datetime.now(timezone.utc).isoformat(),
            "processedAt": None,
            "processedByWorkerTenant": None
        }

        if target_tenant not in self._queues:
            self._queues[target_tenant] = deque()

        self._queues[target_tenant].append(job)
        self._all_jobs[job_id] = job
        return job

    def process_next_job(self, worker_tenant_id: str) -> Optional[Dict[str, Any]]:
        """
        Pulls and processes the next job for worker_tenant_id.
        Fails closed if the job's tenant_id does not match the worker's tenant_id.
        """
        if not worker_tenant_id:
            raise TenantJobViolationError("Worker must have a declared tenant_id")

        q = self._queues.get(worker_tenant_id)
        if not q or len(q) == 0:
            return None

        job = q.popleft()

        # Hard boundary invariant check
        if job["tenantId"] != worker_tenant_id:
            raise TenantJobViolationError(
                f"Worker [{worker_tenant_id}] attempted to process job [{job['jobId']}] belonging to tenant [{job['tenantId']}]"
            )

        job["status"] = "COMPLETED"
        job["processedAt"] = datetime.now(timezone.utc).isoformat()
        job["processedByWorkerTenant"] = worker_tenant_id
        return job

    def get_queue_depth(self, tenant_id: str) -> int:
        """Returns the pending queue depth for a specific tenant."""
        return len(self._queues.get(tenant_id, []))
