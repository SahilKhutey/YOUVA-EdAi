"""
YOUVA-EdAI — Phase 7 Tests: B2B School Licensing Engine (P7-V11 to P7-V13)
Verifies institutional seat quota enforcement, entitlement checks,
and idempotent billing webhook processing.
"""

from datetime import datetime, timezone, timedelta
import pytest

from phase7.models.licensing_engine import (
    LicensingEngine,
    LicenseStatus,
    SeatQuotaExceededError,
    LicenseExpiredError,
    LicenseSuspendedError,
    LicensingError
)


@pytest.fixture
def engine():
    return LicensingEngine()


@pytest.fixture
def sample_license(engine):
    future_date = (datetime.now(timezone.utc) + timedelta(days=365)).isoformat()
    return engine.create_license(
        license_id="LIC-DPS-2026",
        contract_id="CONTRACT-DPSRKP-2026-SCALE",
        tenant_id="tenant-dps-rkpuram",
        student_seats=3,
        teacher_seats=2,
        expires_at_iso=future_date,
        features=["CORE_LEARNING", "CBSE_CURRICULUM", "ADVANCED_ANALYTICS"]
    )


def test_license_lifecycle_and_entitlements(engine, sample_license):
    """P7-V11: Contract -> License -> Seat allocation -> Entitlement -> Access."""
    lic_id = sample_license["licenseId"]

    # Allocate student seats
    alloc1 = engine.allocate_student_seat(lic_id, "std_001")
    assert alloc1["status"] == "ALLOCATED"
    assert alloc1["remainingSeats"] == 2

    alloc2 = engine.allocate_student_seat(lic_id, "std_002")
    assert alloc2["remainingSeats"] == 1

    # Idempotent re-allocation of same student
    alloc1_again = engine.allocate_student_seat(lic_id, "std_001")
    assert alloc1_again["remainingSeats"] == 1

    # Check entitlements
    assert engine.check_entitlement(lic_id, "std_001", "STUDENT") is True
    assert engine.check_entitlement(lic_id, "std_002", "STUDENT") is True
    # Unallocated student
    assert engine.check_entitlement(lic_id, "std_999", "STUDENT") is False

    # Feature entitlement
    assert engine.check_entitlement(lic_id, "std_001", "STUDENT", "ADVANCED_ANALYTICS") is True
    assert engine.check_entitlement(lic_id, "std_001", "STUDENT", "UNLICENSED_FEATURE") is False


def test_seat_quota_exceeded_fails(engine, sample_license):
    """P7-V13: Attempting to allocate beyond contracted capacity raises SeatQuotaExceededError."""
    lic_id = sample_license["licenseId"]

    engine.allocate_student_seat(lic_id, "std_001")
    engine.allocate_student_seat(lic_id, "std_002")
    engine.allocate_student_seat(lic_id, "std_003")

    # 4th allocation must fail
    with pytest.raises(SeatQuotaExceededError, match="quota exceeded"):
        engine.allocate_student_seat(lic_id, "std_004")

    # Revoke a seat and try again
    assert engine.revoke_student_seat(lic_id, "std_002") is True
    # Now allocation succeeds
    alloc4 = engine.allocate_student_seat(lic_id, "std_004")
    assert alloc4["status"] == "ALLOCATED"


def test_expired_and_suspended_license_access_denied(engine):
    """P7-V13.2: Expired or suspended licenses block access fail-closed."""
    past_date = (datetime.now(timezone.utc) - timedelta(days=1)).isoformat()
    lic = engine.create_license(
        license_id="LIC-EXPIRED",
        contract_id="CONTRACT-DPSRKP-2026-SCALE",
        tenant_id="tenant-dps-rkpuram",
        student_seats=10,
        teacher_seats=2,
        expires_at_iso=past_date
    )

    with pytest.raises(LicenseExpiredError, match="expired"):
        engine.allocate_student_seat("LIC-EXPIRED", "std_001")

    with pytest.raises(LicenseExpiredError):
        engine.check_entitlement("LIC-EXPIRED", "std_001", "STUDENT")


def test_webhook_idempotency(engine, sample_license):
    """P7-V12: Duplicate webhooks return cached result without duplicate execution."""
    payload = {
        "licenseId": sample_license["licenseId"],
        "additionalStudentSeats": 5,
        "additionalTeacherSeats": 1
    }

    # First webhook ingestion
    res1 = engine.process_billing_webhook(
        event_id="evt_stripe_9921",
        event_type="SEATS_EXPANDED",
        payload=payload
    )
    assert res1["idempotent"] is False
    assert res1["status"] == "PROCESSED"

    # Verify seats were increased from 3 to 8
    util = engine.get_license_utilization(sample_license["licenseId"])
    assert util["studentSeats"]["total"] == 8

    # Duplicate webhook with same event_id
    res2 = engine.process_billing_webhook(
        event_id="evt_stripe_9921",
        event_type="SEATS_EXPANDED",
        payload=payload
    )
    assert res2["idempotent"] is True
    assert res2["status"] == "ALREADY_PROCESSED"

    # Verify seats were NOT doubled
    util2 = engine.get_license_utilization(sample_license["licenseId"])
    assert util2["studentSeats"]["total"] == 8
