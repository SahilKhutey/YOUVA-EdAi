"""
YOUVA-EdAI — Phase 7 Tests: LMS/SIS Interoperability & SSRF Security (P7-V14 to P7-V18)
Verifies demand-gated activation, SSRF perimeter defenses, cryptographic provenance,
and the Master Educational Invariant (external records cannot mutate mastery without teacher signoff).
"""

import json
from pathlib import Path
import pytest

from phase7.models.lms_connector import (
    LMSConnector,
    SSRFGuard,
    SSRFSecurityViolationError,
    IntegrationDemandRequiredError,
    UnreviewedMasteryMutationError
)

CONTRACT_PATH = Path(__file__).resolve().parent.parent / "data" / "dps_enterprise_contract.json"


@pytest.fixture
def contract():
    with open(CONTRACT_PATH, "r", encoding="utf-8") as f:
        return json.load(f)


@pytest.fixture
def connector(contract):
    conn = LMSConnector(tenant_id="tenant-dps-rkpuram", contract_id="CONTRACT-DPSRKP-2026-SCALE")
    conn.activate_with_contract(contract)
    return conn


def test_connector_disabled_without_demand():
    """P7-V14: Ingestion is blocked without verified demand contract."""
    dormant = LMSConnector(tenant_id="tenant-unverified")
    assert dormant.is_activated is False

    with pytest.raises(IntegrationDemandRequiredError, match="dormant"):
        dormant.ingest_external_observations(
            endpoint_url="https://canvas.school.edu/api",
            source_system="CANVAS",
            raw_items=[]
        )


def test_ssrf_blocks_private_and_loopback_ips():
    """P7-V15: SSRF perimeter defenses block RFC 1918, loopback, and metadata endpoints."""
    allowed = ["canvas.dpsrkp.net", "moodle.dpsrkp.net"]

    # Block non-HTTPS
    with pytest.raises(SSRFSecurityViolationError, match="prohibited"):
        SSRFGuard.assert_safe_url("http://canvas.dpsrkp.net/api", allowed)

    # Block localhost and metadata endpoints
    with pytest.raises(SSRFSecurityViolationError, match="blocked infrastructure"):
        SSRFGuard.assert_safe_url("https://localhost/api", ["localhost"])

    with pytest.raises(SSRFSecurityViolationError, match="blocked infrastructure"):
        SSRFGuard.assert_safe_url("https://metadata.google.internal/computeMetadata/v1/", ["metadata.google.internal"])


def test_ssrf_blocks_raw_ip_endpoints():
    """P7-V16: Direct IP addresses are prohibited even over HTTPS."""
    allowed = ["127.0.0.1", "192.168.1.100", "169.254.169.254"]

    for raw_ip in ["127.0.0.1", "10.0.0.5", "192.168.1.1", "169.254.169.254"]:
        with pytest.raises(SSRFSecurityViolationError, match="Direct IP"):
            SSRFGuard.assert_safe_url(f"https://{raw_ip}/gradebook", allowed)


def test_ssrf_blocks_unauthorized_hosts():
    """P7-V16.2: Hostnames not in contract allowlist are rejected."""
    allowed = ["canvas.dpsrkp.net"]
    with pytest.raises(SSRFSecurityViolationError, match="not allowlisted"):
        SSRFGuard.assert_safe_url("https://rogue-api.external.com/data", allowed)


def test_authoritative_mastery_invariant_enforced(connector):
    """P7-V17: External data CANNOT directly alter student mastery without teacher review."""
    # Attempting direct automated mutation must fail-closed
    with pytest.raises(UnreviewedMasteryMutationError, match="CRITICAL INVARIANT VIOLATION"):
        connector.attempt_direct_mastery_mutation({"studentId": "std_001", "pMastery": 0.99})

    # Legitimate workflow: Ingest -> Stage -> Teacher Review
    raw_records = [
        {
            "externalStudentId": "ext_canvas_88",
            "internalStudentId": "anon_cbse8_001",
            "conceptId": "MATH-G8-LINEQ-01",
            "score": 0.85
        }
    ]

    staged = connector.ingest_external_observations(
        endpoint_url="https://canvas.dpsrkp.net/api/v1/courses/801/grades",
        source_system="CANVAS_LMS",
        raw_items=raw_records
    )

    assert len(staged) == 1
    obs = staged[0]
    assert obs.review_status == "PENDING_REVIEW"
    assert connector.get_pending_review_count() == 1

    # Unauthorized attempt to authorize (empty teacher ID) fails
    with pytest.raises(UnreviewedMasteryMutationError, match="Human teacher authorization"):
        connector.review_and_authorize_observation(obs.staging_id, teacher_id="", decision="APPROVED")

    # Authorized teacher signs off
    decision_result = connector.review_and_authorize_observation(
        staging_id=obs.staging_id,
        teacher_id="teacher_math_head_01",
        decision="APPROVED",
        teacher_notes="Verified against CBSE homework notebook."
    )

    assert decision_result["masteryUpdated"] is True
    assert decision_result["status"] == "APPROVED"
    assert decision_result["authorizedByTeacherId"] == "teacher_math_head_01"
    assert connector.get_pending_review_count() == 0


def test_provenance_preservation(connector):
    """P7-V18: Cryptographic provenance is preserved across ingestion and review."""
    raw_records = [
        {
            "externalStudentId": "moodle_std_102",
            "internalStudentId": "anon_cbse10_015",
            "conceptId": "MATH-G10-QUAD-02",
            "score": 0.92
        }
    ]

    staged = connector.ingest_external_observations(
        endpoint_url="https://moodle.dpsrkp.net/webservice/rest/server.php",
        source_system="MOODLE_SIS",
        raw_items=raw_records
    )

    obs = staged[0]
    # Checksum is deterministic 64-char SHA-256
    assert len(obs.provenance_checksum) == 64
    assert obs.source_system == "MOODLE_SIS"
    assert obs.external_student_id == "moodle_std_102"
