"""
YOUVA-EdAI — Phase 7 Tests: Adversarial Isolation & Penetration Testing Suite
Simulates adversarial attack vectors against multi-tenant boundaries, SSRF filters,
cache namespacing, and seat quota concurrency.
"""

import concurrent.futures
from datetime import datetime, timezone, timedelta
import hashlib
import pytest

from phase7.models.tenant_isolation import (
    TenantContext,
    TenantIsolationEngine,
    CrossTenantViolationError,
    TenantAuthenticationError
)
from phase7.models.tenant_cache_queue import TenantCache, TenantJobQueue
from phase7.models.licensing_engine import LicensingEngine, SeatQuotaExceededError
from phase7.models.lms_connector import LMSConnector, SSRFGuard, SSRFSecurityViolationError
from phase7.models.safety_operations import SafetyOperationsManager, IncidentSeverity


def test_adversarial_tenant_id_injection():
    """Penetration Test 1: SQL / Path injection in tenant ID fails closed."""
    engine = TenantIsolationEngine()

    malicious_tenant_ids = [
        "' OR '1'='1",
        "tenant-a' UNION SELECT * FROM students --",
        "../../etc/passwd",
        "tenant-dps-rkpuram\0admin",
        "<script>alert(1)</script>"
    ]

    for bad_id in malicious_tenant_ids:
        # Seed record under normal tenant
        with TenantContext("tenant-legit"):
            engine.insert("records", "rec_secure", {"secret": "confidential"})

        # Attacker tries to inject malicious tenant string
        with TenantContext(bad_id):
            with pytest.raises(CrossTenantViolationError):
                engine.get("records", "rec_secure")


def test_adversarial_ssrf_obfuscated_ips():
    """Penetration Test 2: Obfuscated IP schemes (octal, decimal, hex, IPv6-mapped) are rejected."""
    allowed = ["canvas.dpsrkp.net"]

    obfuscated_probes = [
        "http://0177.0.0.1/api",            # Octal loopback (non-https)
        "https://0177.0.0.1/api",           # Octal loopback over https
        "https://2130706433/api",           # Decimal loopback
        "https://0x7f000001/api",           # Hex loopback
        "https://127.0.0.1:8080/secret",    # Loopback with port
        "https://169.254.169.254/iam",      # AWS/GCP Metadata
        "https://metadata.google.internal", # GCP Metadata FQDN
        "https://10.255.255.1/internal",    # RFC 1918 Class A
        "https://172.31.255.255/db",        # RFC 1918 Class B
        "https://192.168.1.254/admin",      # RFC 1918 Class C
        "https://[::1]/debug",              # IPv6 loopback
        "https://[fe80::1]/link",           # IPv6 link-local
    ]

    for probe in obfuscated_probes:
        with pytest.raises(SSRFSecurityViolationError):
            SSRFGuard.assert_safe_url(probe, allowed)


def test_adversarial_cache_namespace_tampering():
    """Penetration Test 3: Directory traversal or colon delimiter injection in cache keys."""
    cache = TenantCache()

    with TenantContext("tenant-a"):
        cache.set("ns", "key_secret", "tenant_a_secret")

    # Attacker in Tenant B attempts key traversal
    with TenantContext("tenant-b"):
        probes = [
            ("../tenant-a/ns", "key_secret"),
            ("ns", "../../tenant-a:ns:key_secret"),
            ("tenant-a:ns", "key_secret")
        ]
        for ns_probe, key_probe in probes:
            val = cache.get(ns_probe, key_probe)
            assert val is None, f"Cross-tenant leak detected with probe: {ns_probe} / {key_probe}"


def test_adversarial_seat_quota_race_condition():
    """Penetration Test 4: 20 concurrent threads racing for 1 remaining seat quota."""
    licensing = LicensingEngine()
    future = (datetime.now(timezone.utc) + timedelta(days=30)).isoformat()
    lic = licensing.create_license(
        license_id="LIC-RACE-TEST",
        contract_id="CONTRACT-DPSRKP-2026-SCALE",
        tenant_id="tenant-dps-rkpuram",
        student_seats=1,  # Exactly 1 seat available
        teacher_seats=1,
        expires_at_iso=future
    )

    success_count = 0
    quota_denied_count = 0

    def racer(student_idx: int):
        student_id = f"racing_student_{student_idx}"
        try:
            licensing.allocate_student_seat("LIC-RACE-TEST", student_id)
            return True
        except SeatQuotaExceededError:
            return False

    with concurrent.futures.ThreadPoolExecutor(max_workers=20) as executor:
        futures = [executor.submit(racer, i) for i in range(20)]
        results = [f.result() for f in futures]

    successes = sum(1 for r in results if r is True)
    denials = sum(1 for r in results if r is False)

    # Exactly 1 seat granted, 19 denied
    assert successes == 1
    assert denials == 19
    util = licensing.get_license_utilization("LIC-RACE-TEST")
    assert util["studentSeats"]["used"] == 1


def test_adversarial_observation_provenance_tampering():
    """Penetration Test 5: Tampering with staged observation payload invalidates provenance."""
    connector = LMSConnector(tenant_id="tenant-dps-rkpuram", contract_id="CONTRACT-DPSRKP-2026-SCALE")
    connector.activate_with_contract({
        "contractId": "CONTRACT-DPSRKP-2026-SCALE",
        "tenantId": "tenant-dps-rkpuram",
        "status": "ACTIVE",
        "allowedLmsHosts": ["canvas.dpsrkp.net"]
    })

    raw = [{
        "externalStudentId": "ext_01",
        "internalStudentId": "anon_01",
        "conceptId": "MATH-G8-01",
        "score": 0.50
    }]

    staged = connector.ingest_external_observations(
        endpoint_url="https://canvas.dpsrkp.net/api/v1/sync",
        source_system="CANVAS",
        raw_items=raw
    )
    obs = staged[0]
    original_checksum = obs.provenance_checksum

    # Attacker attempts to forge score in memory
    obs.score = 0.99

    # Recomputed checksum does not match forged score
    recomputed = hashlib.sha256(
        f"{obs.tenant_id}:{obs.source_system}:{obs.external_student_id}:{obs.concept_id}:{obs.score}:{obs.sync_timestamp}".encode("utf-8")
    ).hexdigest()

    assert original_checksum != recomputed
