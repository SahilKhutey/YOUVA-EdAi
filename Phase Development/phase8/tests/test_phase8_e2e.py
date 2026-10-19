"""
YOUVA-EdAI — Phase 8 Tests: End-to-End Autonomous AI Learning Loop & Governance (P8-V28)
Verifies:
- Complete learning loop: Student Activity -> Autonomous Recommendation -> Sandbox -> FinOps -> Ledger -> Drift Evaluation -> Circuit Breaker Rollback.
- Permanent preservation of human authority lines throughout autonomous operations.
"""

import pytest
from phase8.models.autonomy_governance import (
    AutonomyGovernanceEngine,
    AgentAction,
    HumanAuthorizationRequiredError
)
from phase8.models.model_drift_monitor import ModelDriftMonitor
from phase8.models.ai_model_sandbox import AIModelSandbox
from phase8.models.finops_token_guard import FinOpsTokenGuard
from phase8.models.llm_provider_gateway import LLMProviderGateway
from phase8.models.governance_ledger import GovernanceLedger


def test_p8_v28_full_autonomous_learning_loop_and_rollback():
    """
    P8-V28: End-to-end integration:
    Autonomous Action Evaluation ->
    FinOps Token Check ->
    Gateway Hint Generation ->
    Sandbox Structured Response Validation ->
    Governance Ledger Chaining ->
    Telemetry Drift Detection & Rollback Circuit Breaker.
    """
    # 1. Initialize subsystem components
    governance = AutonomyGovernanceEngine()
    sandbox = AIModelSandbox()
    finops = FinOpsTokenGuard()
    gateway = LLMProviderGateway()
    ledger = GovernanceLedger()
    drift_monitor = ModelDriftMonitor()

    tenant_id = "tenant-dps-rkpuram"
    session_id = "sess_p8_e2e_student_01"
    capability_id = "CAP-001"

    finops.set_tenant_budget(tenant_id, monthly_limit=10000, session_limit=1000)

    # 2. Evaluate autonomous action
    decision = governance.evaluate_action(
        capability_id=capability_id,
        action=AgentAction.GENERATE_HINT,
        params={"stepSize": 1.0, "conceptId": "MATH-G8-LINEQ-01"}
    )
    assert decision["authorized"] is True

    # 3. FinOps pre-flight check
    assert finops.check_budget_before_call(tenant_id, session_id, estimated_tokens=150) is True

    # 4. Gateway dispatches hint request
    llm_resp = gateway.request_hint_generation(
        concept_id="MATH-G8-LINEQ-01",
        hint_tier=1,
        primary_fn=lambda: '{"action": "GENERATE_HINT", "target": "MATH-G8-LINEQ-01", "newValue": "Group like terms together.", "confidence": 0.94, "reasonCode": "ALGEBRAIC_SCAFFOLD"}'
    )
    assert llm_resp["fallbackUsed"] is False

    # 5. Sandbox validates structured output
    parsed = sandbox.validate_and_parse_output(llm_resp["hintText"])
    assert parsed["action"] == "GENERATE_HINT"
    assert parsed["confidence"] == 0.94

    # 6. Record tokens in FinOps
    finops.record_usage(tenant_id, session_id, actual_tokens=120)

    # 7. Record event in immutable governance ledger
    ledger_entry = ledger.record_event(
        entry_id="GOV-E2E-001",
        event_type="AUTONOMOUS_HINT_DISCLOSED",
        payload={
            "tenantId": tenant_id,
            "sessionId": session_id,
            "capabilityId": capability_id,
            "conceptId": "MATH-G8-LINEQ-01",
            "decisionHash": decision["decisionHash"]
        }
    )
    assert ledger_entry is not None

    # 8. Normal drift telemetry maintains healthy closed state
    normal_telemetry = {
        "safety": 0.988,
        "correctness": 0.915,
        "helpfulness": 0.878,
        "teacherAgreementRate": 0.945
    }
    report = drift_monitor.evaluate_drift(normal_telemetry)
    assert report.healthy is True
    assert report.circuitState == "CLOSED"

    # 9. Simulate anomalous 6% safety drop drift attack
    degraded_telemetry = {
        "safety": 0.925,  # Drop > 5%
        "correctness": 0.915,
        "helpfulness": 0.878,
        "teacherAgreementRate": 0.945
    }
    drift_report = drift_monitor.evaluate_drift(degraded_telemetry)
    assert drift_report.criticalViolation is True
    assert drift_report.recommendation == "TRIGGER_ROLLBACK_TO_PREVIOUS_VERSION"
    assert drift_monitor.circuit_state == "TRIPPED_ROLLBACK"

    # 10. Execute rollback on capability
    cap_record = governance._capabilities[capability_id]
    rollback_info = drift_monitor.execute_rollback(cap_record)
    assert rollback_info["status"] == "ROLLED_BACK"
    assert cap_record["version"] == "v1.0"

    # 11. Record rollback in governance ledger
    ledger.record_event(
        entry_id="GOV-E2E-002",
        event_type="CAPABILITY_AUTOMATED_ROLLBACK",
        payload=rollback_info
    )

    # 12. Verify ledger chain integrity
    valid, err = ledger.verify_chain_integrity()
    assert valid is True
    assert err is None
    assert ledger.count() == 2

    # 13. Verify that consequential human invariant cannot be breached at any point
    with pytest.raises(HumanAuthorizationRequiredError):
        governance.evaluate_action(
            capability_id=capability_id,
            action=AgentAction.MODIFY_MASTERY,
            params={"studentId": "std_01"}
        )
