import copy
import pytest
from pathlib import Path
from phase9.scripts.validate_governance_scheduler import (
    load_json,
    validate_scheduler,
    validate_compliance_matrix,
    validate_data_room,
    GovernanceValidationError,
    SCHEDULER_FILE,
    COMPLIANCE_FILE,
    DATA_ROOM_FILE,
    MANDATORY_REVIEW_CLASSES
)


@pytest.fixture
def scheduler_data():
    return load_json(SCHEDULER_FILE)


@pytest.fixture
def compliance_data():
    return load_json(COMPLIANCE_FILE)


@pytest.fixture
def data_room():
    return load_json(DATA_ROOM_FILE)


def test_valid_governance_scheduler(scheduler_data):
    """Current governance scheduler must validate successfully."""
    validate_scheduler(scheduler_data)


def test_missing_mandatory_review_class(scheduler_data):
    """Removing any of the 7 mandatory review classes must fail."""
    tampered = copy.deepcopy(scheduler_data)
    tampered["reviewClasses"] = [
        rc for rc in tampered["reviewClasses"]
        if rc["id"] != "audit_log_cryptographic_verification"
    ]
    with pytest.raises(GovernanceValidationError, match="Missing mandatory review classes"):
        validate_scheduler(tampered)


def test_excessive_review_interval(scheduler_data):
    """Interval exceeding regulatory ceiling must be rejected."""
    tampered = copy.deepcopy(scheduler_data)
    for rc in tampered["reviewClasses"]:
        if rc["id"] == "audit_log_cryptographic_verification":
            rc["maxIntervalDays"] = 30  # Maximum allowed is 7 days
    with pytest.raises(GovernanceValidationError, match="exceeds maximum allowed"):
        validate_scheduler(tampered)


def test_excessive_escalation_hours(scheduler_data):
    """Escalation path over 48 hours must be rejected."""
    tampered = copy.deepcopy(scheduler_data)
    tampered["reviewClasses"][0]["escalationPathHours"] = 72
    with pytest.raises(GovernanceValidationError, match="escalationPathHours.*must be between 1 and 48"):
        validate_scheduler(tampered)


def test_compliance_matrix_passes(compliance_data):
    """Current compliance matrix must be 100% compliant."""
    validate_compliance_matrix(compliance_data)


def test_compliance_matrix_rejects_non_compliant(compliance_data):
    """Any control not marked COMPLIANT must fail validation."""
    tampered = copy.deepcopy(compliance_data)
    tampered["domains"][0]["controls"][0]["status"] = "PENDING_AUDIT"
    with pytest.raises(GovernanceValidationError, match="Non-compliant control"):
        validate_compliance_matrix(tampered)


def test_data_room_passes(data_room):
    """All documents in data room index must be approved."""
    validate_data_room(data_room)


def test_data_room_rejects_unapproved_document(data_room):
    """Unapproved document in data room index must trigger failure."""
    tampered = copy.deepcopy(data_room)
    tampered["dataRoom"]["sections"][0]["documents"][0]["status"] = "DRAFT"
    with pytest.raises(GovernanceValidationError, match="is not approved"):
        validate_data_room(tampered)
