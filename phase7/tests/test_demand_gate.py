"""
YOUVA-EdAI — Phase 7 Tests: Demand Validation Gate (P7-V01)
Verifies fail-closed demand gating: enterprise scale features cannot activate
without an authentic, signed institutional contract meeting minimum thresholds.
"""

from datetime import datetime, timezone, timedelta
import json
from pathlib import Path
import pytest

from phase7.demand.demand_validator import DemandValidator, DemandValidationError

DATA_DIR = Path(__file__).resolve().parent.parent / "data"
CONTRACT_PATH = DATA_DIR / "dps_enterprise_contract.json"


@pytest.fixture
def validator():
    return DemandValidator()


@pytest.fixture
def valid_contract():
    with open(CONTRACT_PATH, "r", encoding="utf-8") as f:
        return json.load(f)


def test_valid_enterprise_contract_passes(validator, valid_contract):
    """P7-V01.1: Certified enterprise contract passes validation and generates seal."""
    res = validator.validate_contract(valid_contract)
    assert res["valid"] is True
    assert res["contractId"] == "CONTRACT-DPSRKP-2026-SCALE"
    assert res["tenantId"] == "tenant-dps-rkpuram"
    assert res["committedSeats"] == 250
    assert res["slaUptimePercent"] == 99.9
    assert len(res["verificationSeal"]) == 64  # SHA-256


def test_contract_below_seat_threshold_fails(validator, valid_contract):
    """P7-V01.2: Contract with <50 seats must fail closed."""
    invalid = dict(valid_contract)
    invalid["minCommittedSeats"] = 49
    with pytest.raises(DemandValidationError, match="(below institutional threshold|less than the minimum of 50)"):
        validator.validate_contract(invalid)


def test_contract_invalid_status_fails(validator, valid_contract):
    """P7-V01.3: Non-ACTIVE/SIGNED contracts cannot activate scale infrastructure."""
    for bad_status in ["DRAFT", "SUSPENDED", "EXPIRED", "TERMINATED"]:
        invalid = dict(valid_contract)
        invalid["status"] = bad_status
        with pytest.raises(DemandValidationError, match="status must be ACTIVE or SIGNED"):
            validator.validate_contract(invalid)


def test_contract_missing_signers_fails(validator, valid_contract):
    """P7-V01.4: Contract without authorized signers fails closed."""
    invalid = dict(valid_contract)
    invalid["authorizedSigners"] = []
    with pytest.raises(DemandValidationError, match="(signer|should be non-empty)"):
        validator.validate_contract(invalid)


def test_contract_below_sla_threshold_fails(validator, valid_contract):
    """P7-V01.5: SLA below 99.9% fails closed."""
    invalid = dict(valid_contract)
    invalid["slaUptimePercent"] = 99.8
    with pytest.raises(DemandValidationError, match="(SLA .* does not meet|less than the minimum of 99.9)"):
        validator.validate_contract(invalid)


def test_contract_date_expiry_fails(validator, valid_contract):
    """P7-V01.6: Expired contract fails closed."""
    now = datetime(2028, 1, 1, tzinfo=timezone.utc)
    with pytest.raises(DemandValidationError, match="expired"):
        validator.validate_contract(valid_contract, now=now)


def test_contract_future_start_fails(validator, valid_contract):
    """P7-V01.7: Pre-effective date contract cannot activate infrastructure."""
    now = datetime(2025, 1, 1, tzinfo=timezone.utc)
    with pytest.raises(DemandValidationError, match="not started yet"):
        validator.validate_contract(valid_contract, now=now)


def test_host_allowlisting(validator, valid_contract):
    """P7-V01.8: Verified contract validates allowed LMS endpoints."""
    assert validator.is_host_allowed(valid_contract, "canvas.dpsrkp.net") is True
    assert validator.is_host_allowed(valid_contract, "moodle.dpsrkp.net") is True
    assert validator.is_host_allowed(valid_contract, "malicious.hacker.com") is False
    assert validator.is_host_allowed(valid_contract, "") is False
