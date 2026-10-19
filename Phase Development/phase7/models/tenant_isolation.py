"""
YOUVA-EdAI — Phase 7: Multi-Tenant Isolation Engine (P7.2)
Implements strict row-level tenant boundary isolation, context propagation,
and fail-closed cross-tenant access defenses.
"""

from contextvars import ContextVar
from datetime import datetime, timezone
import hashlib
import json
from typing import Any, Dict, List, Optional


class CrossTenantViolationError(PermissionError):
    """Raised when an operation attempts to access or mutate data belonging to another tenant."""
    pass


class TenantAuthenticationError(PermissionError):
    """Raised when tenant context is missing, invalid, or forged."""
    pass


# Thread/Task-safe context variable for current tenant state
_current_tenant_ctx: ContextVar[Optional[Dict[str, Any]]] = ContextVar("_current_tenant_ctx", default=None)


class TenantContext:
    """
    Context manager and accessor for tenant context propagation.
    Ensures every operation carries verified tenant provenance.
    """

    def __init__(self, tenant_id: str, user_id: Optional[str] = None, role: Optional[str] = None):
        if not tenant_id or not isinstance(tenant_id, str) or not tenant_id.strip():
            raise TenantAuthenticationError("Invalid or empty tenant_id for TenantContext")
        self.tenant_id = tenant_id.strip()
        self.user_id = user_id
        self.role = role or "USER"
        self._token = None

    def __enter__(self):
        ctx_data = {
            "tenantId": self.tenant_id,
            "userId": self.user_id,
            "role": self.role
        }
        self._token = _current_tenant_ctx.set(ctx_data)
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        if self._token is not None:
            _current_tenant_ctx.reset(self._token)

    @classmethod
    def get(cls) -> Optional[Dict[str, Any]]:
        """Return the current active tenant context dict or None."""
        return _current_tenant_ctx.get()

    @classmethod
    def get_tenant_id(cls) -> Optional[str]:
        """Return current tenantId or None."""
        ctx = _current_tenant_ctx.get()
        return ctx.get("tenantId") if ctx else None

    @classmethod
    def require_tenant_id(cls) -> str:
        """Enforce that a tenant context is active, raising TenantAuthenticationError if absent."""
        tenant_id = cls.get_tenant_id()
        if not tenant_id:
            raise TenantAuthenticationError("Tenant context is required for this operation")
        return tenant_id


class TenantRecord:
    """Represents a row/document strictly scoped to a specific tenant."""

    def __init__(
        self,
        record_id: str,
        tenant_id: str,
        collection: str,
        data: Dict[str, Any],
        created_at: Optional[str] = None,
        updated_at: Optional[str] = None
    ):
        self.record_id = record_id
        self.tenant_id = tenant_id
        self.collection = collection
        self.data = dict(data)
        now_iso = datetime.now(timezone.utc).isoformat()
        self.created_at = created_at or now_iso
        self.updated_at = updated_at or now_iso

    def to_dict(self) -> Dict[str, Any]:
        return {
            "recordId": self.record_id,
            "tenantId": self.tenant_id,
            "collection": self.collection,
            "data": self.data,
            "createdAt": self.created_at,
            "updatedAt": self.updated_at
        }


class TenantIsolationEngine:
    """
    Simulates and enforces database row-level security (RLS) across collections.
    Guarantees cross-tenant boundary isolation with zero data leakage.
    """

    def __init__(self):
        # Store records: collection -> record_id -> TenantRecord
        self._records: Dict[str, Dict[str, TenantRecord]] = {}

    def insert(
        self,
        collection: str,
        record_id: str,
        data: Dict[str, Any],
        tenant_id: Optional[str] = None
    ) -> TenantRecord:
        """
        Inserts a record bound to tenant.
        Resolves tenant_id from active TenantContext if not explicitly provided.
        Fails if explicit tenant_id conflicts with active TenantContext.
        """
        active_tenant = TenantContext.require_tenant_id()
        target_tenant = tenant_id or active_tenant

        if target_tenant != active_tenant:
            raise CrossTenantViolationError(
                f"Active tenant [{active_tenant}] cannot insert record for target tenant [{target_tenant}]"
            )

        if collection not in self._records:
            self._records[collection] = {}

        # If record exists in another tenant, prevent collision/overwrite
        existing = self._records[collection].get(record_id)
        if existing and existing.tenant_id != target_tenant:
            raise CrossTenantViolationError(
                f"Record [{record_id}] already belongs to tenant [{existing.tenant_id}], access denied"
            )

        rec = TenantRecord(
            record_id=record_id,
            tenant_id=target_tenant,
            collection=collection,
            data=data
        )
        self._records[collection][record_id] = rec
        return rec

    def get(self, collection: str, record_id: str) -> Optional[TenantRecord]:
        """
        Retrieves a record strictly within the caller's tenant boundary.
        If record belongs to another tenant, raises CrossTenantViolationError.
        """
        active_tenant = TenantContext.require_tenant_id()
        col = self._records.get(collection, {})
        rec = col.get(record_id)

        if not rec:
            return None

        if rec.tenant_id != active_tenant:
            raise CrossTenantViolationError(
                f"Tenant [{active_tenant}] denied read access to record [{record_id}] belonging to [{rec.tenant_id}]"
            )

        return rec

    def query(self, collection: str, filters: Optional[Dict[str, Any]] = None) -> List[TenantRecord]:
        """
        Executes tenant-scoped query. Enforces RLS: only returns records matching active tenantId.
        Cross-tenant records are completely filtered out at the row level.
        """
        active_tenant = TenantContext.require_tenant_id()
        col = self._records.get(collection, {})
        results: List[TenantRecord] = []

        filters = filters or {}
        for rec in col.values():
            # Strict RLS predicate
            if rec.tenant_id != active_tenant:
                continue

            matches = True
            for k, v in filters.items():
                if rec.data.get(k) != v:
                    matches = False
                    break
            if matches:
                results.append(rec)

        return results

    def update(self, collection: str, record_id: str, new_data: Dict[str, Any]) -> TenantRecord:
        """
        Updates an existing record.
        Raises CrossTenantViolationError if record belongs to another tenant.
        """
        active_tenant = TenantContext.require_tenant_id()
        col = self._records.get(collection, {})
        rec = col.get(record_id)

        if not rec:
            raise KeyError(f"Record [{record_id}] not found in collection [{collection}]")

        if rec.tenant_id != active_tenant:
            raise CrossTenantViolationError(
                f"Tenant [{active_tenant}] denied mutation access to record [{record_id}] belonging to [{rec.tenant_id}]"
            )

        rec.data.update(new_data)
        rec.updated_at = datetime.now(timezone.utc).isoformat()
        return rec

    def delete(self, collection: str, record_id: str) -> bool:
        """
        Deletes a record.
        Raises CrossTenantViolationError if record belongs to another tenant.
        """
        active_tenant = TenantContext.require_tenant_id()
        col = self._records.get(collection, {})
        rec = col.get(record_id)

        if not rec:
            return False

        if rec.tenant_id != active_tenant:
            raise CrossTenantViolationError(
                f"Tenant [{active_tenant}] denied delete access to record [{record_id}] belonging to [{rec.tenant_id}]"
            )

        del col[record_id]
        return True

    def purge_tenant_data(self, tenant_id: str, authorized_role: str) -> int:
        """
        Deletes all data for a specific tenant during deprovisioning or GDPR/DPDP purge.
        Requires ADMIN authorization. Guarantees other tenants remain untouched.
        """
        if authorized_role not in ("ADMIN", "SYSTEM_SUPERADMIN"):
            raise TenantAuthenticationError("Unauthorized role for tenant data purge")

        count = 0
        for collection, col_records in self._records.items():
            to_delete = [rid for rid, rec in col_records.items() if rec.tenant_id == tenant_id]
            for rid in to_delete:
                del col_records[rid]
                count += 1
        return count

    def get_tenant_record_count(self, tenant_id: str) -> int:
        """Returns the total number of records across all collections for a tenant."""
        count = 0
        for col in self._records.values():
            count += sum(1 for r in col.values() if r.tenant_id == tenant_id)
        return count
