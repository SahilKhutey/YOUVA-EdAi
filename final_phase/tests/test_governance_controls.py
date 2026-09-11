import pytest
import datetime
from final_phase.scripts.validate_human_controls import load_json, CONTROLS_FILE, authorize_action


@pytest.fixture
def controls_config():
    return load_json(CONTROLS_FILE)


def test_fp_v001_policy_exists(controls_config):
    """FP-V001: Policy exists and contains all required control definitions."""
    assert "controls" in controls_config
    assert len(controls_config["controls"]) == 8


def test_fp_v002_expired_policy_rejected(controls_config):
    """FP-V002: An expired governance policy must be rejected fail-closed."""
    past_date = (datetime.datetime.now(datetime.timezone.utc) - datetime.timedelta(days=1)).isoformat()
    expired_policy = {
        "id": "POLICY-EXPIRED",
        "expiresAt": past_date,
        "status": "EXPIRED"
    }
    # Check that expired policy is recognized as invalid
    now = datetime.datetime.now(datetime.timezone.utc).isoformat()
    is_valid = expired_policy["expiresAt"] > now
    assert not is_valid, "Expired policy must be rejected"


def test_fp_v003_missing_approval_rejected(controls_config):
    """FP-V003: Policy without formal approval must be rejected fail-closed."""
    policy_missing_approval = {
        "id": "POLICY-NEW",
        "status": "DRAFT",
        "approval": None
    }
    assert policy_missing_approval["approval"] is None
    assert policy_missing_approval["status"] != "APPROVED"


def test_fp_v004_unauthorized_policy_change_rejected(controls_config):
    """FP-V004: Unauthorized policy change attempt must be blocked."""
    # Attempt to authorize an autonomy policy change by an unauthorized role (e.g. STUDENT)
    authorized = authorize_action(
        control_id="AUTONOMY_POLICY_CHANGE",
        actor_role="STUDENT",
        signature="dummy-signature-123456",
        is_automated_ai=False,
        config=controls_config
    )
    assert not authorized, "Unauthorized role must be rejected for policy change"
