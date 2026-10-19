"""
YOUVA-EdAI — Phase 7: B2B School Licensing Engine (P7.3)
Manages institutional contract-to-license mapping, seat allocation quotas,
entitlement enforcement, and idempotent billing webhooks.
"""

from datetime import datetime, timezone
from enum import Enum
import hashlib
import json
from typing import Any, Dict, List, Optional, Set


class LicenseStatus(str, Enum):
    DRAFT = "DRAFT"
    ACTIVE = "ACTIVE"
    SUSPENDED = "SUSPENDED"
    EXPIRED = "EXPIRED"
    TERMINATED = "TERMINATED"


class LicensingError(Exception):
    """Base exception for licensing failures."""
    pass


class SeatQuotaExceededError(LicensingError):
    """Raised when an allocation exceeds the contracted seat capacity."""
    pass


class LicenseExpiredError(LicensingError):
    """Raised when an operation is attempted on an expired license."""
    pass


class LicenseSuspendedError(LicensingError):
    """Raised when an operation is attempted on a suspended or terminated license."""
    pass


class LicensingEngine:
    """
    B2B institutional seat licensing and entitlement manager.
    Tracks seat quota consumption, prevents over-allocation, and enforces license state.
    """

    def __init__(self):
        # license_id -> license_dict
        self._licenses: Dict[str, Dict[str, Any]] = {}
        # license_id -> set of student_ids
        self._student_allocations: Dict[str, Set[str]] = {}
        # license_id -> set of teacher_ids
        self._teacher_allocations: Dict[str, Set[str]] = {}
        # event_id -> processed webhook result (idempotency ledger)
        self._processed_webhooks: Dict[str, Dict[str, Any]] = {}

    def create_license(
        self,
        license_id: str,
        contract_id: str,
        tenant_id: str,
        student_seats: int,
        teacher_seats: int,
        expires_at_iso: str,
        features: Optional[List[str]] = None,
        status: LicenseStatus = LicenseStatus.ACTIVE
    ) -> Dict[str, Any]:
        """Creates and registers a new institutional license."""
        if student_seats < 1 or teacher_seats < 1:
            raise LicensingError("Seat quotas must be positive integers")

        lic = {
            "licenseId": license_id,
            "contractId": contract_id,
            "tenantId": tenant_id,
            "allocatedStudentSeats": student_seats,
            "allocatedTeacherSeats": teacher_seats,
            "status": status.value if isinstance(status, LicenseStatus) else status,
            "expiresAt": expires_at_iso,
            "features": features or ["CORE_LEARNING", "CBSE_CURRICULUM", "TEACHER_DASHBOARD", "LMS_SYNC"],
            "createdAt": datetime.now(timezone.utc).isoformat()
        }

        self._licenses[license_id] = lic
        self._student_allocations[license_id] = set()
        self._teacher_allocations[license_id] = set()
        return lic

    def _assert_license_active(self, license_id: str, now: Optional[datetime] = None) -> Dict[str, Any]:
        lic = self._licenses.get(license_id)
        if not lic:
            raise LicensingError(f"License [{license_id}] does not exist")

        status = lic["status"]
        if status == LicenseStatus.EXPIRED.value:
            raise LicenseExpiredError(f"License [{license_id}] has expired")
        if status in (LicenseStatus.SUSPENDED.value, LicenseStatus.TERMINATED.value):
            raise LicenseSuspendedError(f"License [{license_id}] is {status}")
        if status == LicenseStatus.DRAFT.value:
            raise LicensingError(f"License [{license_id}] is still in DRAFT status")

        # Check date expiry
        current_dt = now or datetime.now(timezone.utc)
        expires_dt = datetime.fromisoformat(lic["expiresAt"].replace("Z", "+00:00"))
        if current_dt > expires_dt:
            lic["status"] = LicenseStatus.EXPIRED.value
            raise LicenseExpiredError(f"License [{license_id}] expired at {lic['expiresAt']}")

        return lic

    def allocate_student_seat(self, license_id: str, student_id: str) -> Dict[str, Any]:
        """
        Assigns a seat to a student under the license.
        Throws SeatQuotaExceededError if capacity reached.
        """
        lic = self._assert_license_active(license_id)
        current_students = self._student_allocations[license_id]

        if student_id in current_students:
            # Already allocated, idempotent
            return {
                "licenseId": license_id,
                "studentId": student_id,
                "status": "ALLOCATED",
                "remainingSeats": lic["allocatedStudentSeats"] - len(current_students)
            }

        if len(current_students) >= lic["allocatedStudentSeats"]:
            raise SeatQuotaExceededError(
                f"Student seat quota exceeded for license [{license_id}] "
                f"({len(current_students)} / {lic['allocatedStudentSeats']} used)"
            )

        current_students.add(student_id)
        return {
            "licenseId": license_id,
            "studentId": student_id,
            "status": "ALLOCATED",
            "remainingSeats": lic["allocatedStudentSeats"] - len(current_students)
        }

    def allocate_teacher_seat(self, license_id: str, teacher_id: str) -> Dict[str, Any]:
        """
        Assigns a seat to a teacher under the license.
        Throws SeatQuotaExceededError if capacity reached.
        """
        lic = self._assert_license_active(license_id)
        current_teachers = self._teacher_allocations[license_id]

        if teacher_id in current_teachers:
            return {
                "licenseId": license_id,
                "teacherId": teacher_id,
                "status": "ALLOCATED",
                "remainingSeats": lic["allocatedTeacherSeats"] - len(current_teachers)
            }

        if len(current_teachers) >= lic["allocatedTeacherSeats"]:
            raise SeatQuotaExceededError(
                f"Teacher seat quota exceeded for license [{license_id}] "
                f"({len(current_teachers)} / {lic['allocatedTeacherSeats']} used)"
            )

        current_teachers.add(teacher_id)
        return {
            "licenseId": license_id,
            "teacherId": teacher_id,
            "status": "ALLOCATED",
            "remainingSeats": lic["allocatedTeacherSeats"] - len(current_teachers)
        }

    def revoke_student_seat(self, license_id: str, student_id: str) -> bool:
        """Revokes an allocated student seat, returning capacity to the pool."""
        if license_id in self._student_allocations:
            if student_id in self._student_allocations[license_id]:
                self._student_allocations[license_id].remove(student_id)
                return True
        return False

    def check_entitlement(
        self,
        license_id: str,
        user_id: str,
        role: str,
        feature_key: Optional[str] = None
    ) -> bool:
        """
        Enforces that user holds an active allocated seat and feature entitlement.
        """
        lic = self._assert_license_active(license_id)

        # Check feature entitlement if requested
        if feature_key and feature_key not in lic.get("features", []):
            return False

        if role == "STUDENT":
            return user_id in self._student_allocations.get(license_id, set())
        elif role in ("TEACHER", "INSTRUCTOR"):
            return user_id in self._teacher_allocations.get(license_id, set())
        elif role in ("ADMIN", "SUPERADMIN"):
            return True

        return False

    def get_license_utilization(self, license_id: str) -> Dict[str, Any]:
        """Returns seat consumption metrics for a license."""
        lic = self._licenses.get(license_id)
        if not lic:
            raise LicensingError(f"License [{license_id}] not found")

        used_students = len(self._student_allocations.get(license_id, set()))
        used_teachers = len(self._teacher_allocations.get(license_id, set()))

        return {
            "licenseId": license_id,
            "tenantId": lic["tenantId"],
            "status": lic["status"],
            "studentSeats": {
                "total": lic["allocatedStudentSeats"],
                "used": used_students,
                "available": lic["allocatedStudentSeats"] - used_students,
                "utilizationPercent": round((used_students / lic["allocatedStudentSeats"]) * 100, 2)
            },
            "teacherSeats": {
                "total": lic["allocatedTeacherSeats"],
                "used": used_teachers,
                "available": lic["allocatedTeacherSeats"] - used_teachers,
                "utilizationPercent": round((used_teachers / lic["allocatedTeacherSeats"]) * 100, 2)
            }
        }

    def process_billing_webhook(
        self,
        event_id: str,
        event_type: str,
        payload: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Processes billing/licensing webhooks with strict idempotency.
        """
        if not event_id or not event_type:
            raise LicensingError("Missing event_id or event_type for billing webhook")

        # Idempotency check: deduplicate replay attacks or repeated webhooks
        if event_id in self._processed_webhooks:
            cached = self._processed_webhooks[event_id]
            return {
                "eventId": event_id,
                "idempotent": True,
                "status": "ALREADY_PROCESSED",
                "result": cached
            }

        license_id = payload.get("licenseId")
        result: Dict[str, Any] = {"action": "NONE"}

        if event_type == "LICENSE_SUSPENDED":
            if license_id and license_id in self._licenses:
                self._licenses[license_id]["status"] = LicenseStatus.SUSPENDED.value
                result = {"action": "STATUS_UPDATED", "newStatus": "SUSPENDED"}
        elif event_type == "LICENSE_REACTIVATED":
            if license_id and license_id in self._licenses:
                self._licenses[license_id]["status"] = LicenseStatus.ACTIVE.value
                result = {"action": "STATUS_UPDATED", "newStatus": "ACTIVE"}
        elif event_type == "SEATS_EXPANDED":
            if license_id and license_id in self._licenses:
                add_students = payload.get("additionalStudentSeats", 0)
                add_teachers = payload.get("additionalTeacherSeats", 0)
                self._licenses[license_id]["allocatedStudentSeats"] += add_students
                self._licenses[license_id]["allocatedTeacherSeats"] += add_teachers
                result = {
                    "action": "SEATS_EXPANDED",
                    "newStudentSeats": self._licenses[license_id]["allocatedStudentSeats"],
                    "newTeacherSeats": self._licenses[license_id]["allocatedTeacherSeats"]
                }
        elif event_type == "LICENSE_RENEWED":
            if license_id and license_id in self._licenses:
                new_expiry = payload.get("newExpiresAt")
                if new_expiry:
                    self._licenses[license_id]["expiresAt"] = new_expiry
                    self._licenses[license_id]["status"] = LicenseStatus.ACTIVE.value
                    result = {"action": "RENEWED", "newExpiresAt": new_expiry}

        audit_entry = {
            "eventId": event_id,
            "eventType": event_type,
            "payloadHash": hashlib.sha256(json.dumps(payload, sort_keys=True).encode("utf-8")).hexdigest(),
            "processedAt": datetime.now(timezone.utc).isoformat(),
            "result": result
        }

        self._processed_webhooks[event_id] = audit_entry
        return {
            "eventId": event_id,
            "idempotent": False,
            "status": "PROCESSED",
            "result": audit_entry
        }
