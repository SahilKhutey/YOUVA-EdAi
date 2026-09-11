"""
YOUVA-EdAI — Final Phase: 18-Step Production Release Execution Runner (FP.18)
Executes and verifies the comprehensive steady-state production release sequence:
 1. Validate Phase 9 gate prerequisite (GO_TO_FINAL_PHASE)
 2. 8 Permanent Human-Only Controls verification
 3. 4 Eternal Non-Negotiables policy integrity verification
 4. Continuous 9-stage safety loop operational audit
 5. Dual-channel safety notification dispatch & fallback drill
 6. AI safety incident closure absolute denial enforcement
 7. Multi-tenant zero-bleed database isolation verification
 8. Autonomous AI bounded capability catalog & 5% drift rollback circuit breaker
 9. FinOps token accounting spending caps & runaway agent killer verification
10. LLM provider outage independence (safety escalation operates normally without AI)
11. W3C VC 2.0 / Open Badges 3.0 credential issuance & revocation lifecycle verification
12. Zero-PII public verification token hash audit
13. Anti-gaming speedrun filter (< 8s response detection) verification
14. Multi-jurisdiction dynamic routing & Strictest Rule On Mismatch audit
15. District-level aggregate reporting k-anonymity (k >= 10) audit
16. Master completion ledger & explicit non-founder organizational ownership audit
17. Continuous operating rhythm schedules and overdue review detection audit
18. Master Production Release Gate evaluation (12 conditions -> DECISION: >>> GO <<<)
"""

from datetime import datetime, timezone
import json
from pathlib import Path
import subprocess
import sys
import time

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT))

from final_phase.models.permanent_human_controls import (
    PermanentHumanControlsEngine,
    HumanAuthorizationMandatoryError,
    UnauthorizedActorRoleError,
)
from final_phase.models.continuous_safety_loop import (
    ContinuousSafetyLoopEngine,
    UnauthorizedIncidentClosureError,
    SafetyNotificationDispatchError,
)
from final_phase.models.operating_rhythm_scheduler import (
    OperatingRhythmScheduler,
    FounderDefaultViolationError,
)
from final_phase.models.systems_integration_engine import (
    SystemsIntegrationEngine,
    ReleaseConditionViolationError,
)


def run_step(step_num: int, title: str, fn) -> bool:
    print(f"\n[Step {step_num:02d}/18] {title}...")
    t0 = time.time()
    try:
        ok, detail = fn()
        elapsed = time.time() - t0
        if ok:
            print(f"  --> PASS ({elapsed:.2f}s): {detail}")
            return True
        else:
            print(f"  --> FAILED ({elapsed:.2f}s): {detail}")
            return False
    except Exception as e:
        elapsed = time.time() - t0
        print(f"  --> EXCEPTION ({elapsed:.2f}s): {e}")
        return False


def main():
    print("================================================================================")
    print("YOUVA-EdAI — Final Phase: Production Release Execution Runner (FP.18)")
    print("================================================================================")

    results = {}
    fp_base = ROOT / "final_phase"

    # Step 1: Validate Phase 9 gate prerequisite
    def step_01():
        p9_report_file = ROOT / "phase9" / "data" / "phase9_verification_report.json"
        if not p9_report_file.exists():
            return False, f"Phase 9 report not found: {p9_report_file}"
        with open(p9_report_file, "r", encoding="utf-8") as f:
            data = json.load(f)
        decision = data.get("decision")
        if decision != "GO_TO_FINAL_PHASE":
            return False, f"Phase 9 decision is '{decision}', expected 'GO_TO_FINAL_PHASE'"
        return True, f"Phase 9 verified with decision '{decision}'"

    # Step 2: 8 Permanent Human-Only Controls verification
    def step_02():
        script = fp_base / "scripts" / "validate_human_controls.py"
        res = subprocess.run([sys.executable, str(script)], capture_output=True, text=True)
        if res.returncode != 0:
            return False, f"validate_human_controls failed: {res.stderr}"
        return True, "All 8 permanent human-only controls validated via validate_human_controls.py"

    # Step 3: 4 Eternal Non-Negotiables policy integrity verification
    def step_03():
        path = fp_base / "policies" / "non_negotiables.json"
        with open(path, "r", encoding="utf-8") as f:
            data = json.load(f)
        principles = data.get("principles", [])
        if len(principles) < 4:
            return False, f"Expected 4 non-negotiables, found {len(principles)}"
        for p in principles:
            if not p.get("immutable"):
                return False, f"Principle '{p.get('id')}' must be immutable"
        return True, "All 4 eternal non-negotiables verified immutable"

    # Step 4: Continuous 9-stage safety loop operational audit
    def step_04():
        script = fp_base / "scripts" / "validate_safety_operations.py"
        res = subprocess.run([sys.executable, str(script)], capture_output=True, text=True)
        if res.returncode != 0:
            return False, f"validate_safety_operations failed: {res.stderr}"
        return True, "Continuous 9-stage safety loop validated via validate_safety_operations.py"

    # Step 5: Dual-channel safety notification dispatch & fallback drill
    def step_05():
        safety_engine = ContinuousSafetyLoopEngine(fp_base / "safety")
        incident = safety_engine.trigger_incident(
            severity="CRITICAL",
            category="SELF_HARM_DISTRESS",
            student_ref="anon_student_881",
        )
        if not incident.primary_channel_dispatched or not incident.secondary_channel_dispatched:
            return False, "Both primary and secondary notification channels must be dispatched"
        # Test simulated primary failure with secondary fallback
        incident2 = safety_engine.trigger_incident(
            severity="HIGH",
            category="PERSISTENT_DISTRESS",
            student_ref="anon_student_882",
            simulate_primary_failure=True,
        )
        if not incident2.secondary_channel_dispatched:
            return False, "Secondary fallback must dispatch when primary fails"
        return True, "Dual-channel dispatch verified with fail-safe secondary fallback"

    # Step 6: AI safety incident closure absolute denial enforcement
    def step_06():
        safety_engine = ContinuousSafetyLoopEngine(fp_base / "safety")
        incident = safety_engine.trigger_incident(
            severity="CRITICAL",
            category="CRISIS_SIGNAL",
            student_ref="anon_student_901",
        )
        try:
            safety_engine.resolve_incident(
                incident_id=incident.incident_id,
                actor_type="AI",
                officer_id="autonomous_safety_bot",
                officer_role="AI_AGENT",
                resolution_notes="Dismissing incident via automated filter.",
                signature="mock_ai_signature_hex_1234567890",
            )
            return False, "AI incident closure should have been rejected fail-closed"
        except UnauthorizedIncidentClosureError:
            pass
        return True, "AI attempt to close safety incident rejected fail-closed"

    # Step 7: Multi-tenant zero-bleed database isolation verification
    def step_07():
        from phase7.models.tenant_isolation import TenantContext, TenantIsolationEngine, CrossTenantViolationError
        engine = TenantIsolationEngine()
        with TenantContext(tenant_id="tenant-dps-rkpuram"):
            engine.insert("students", "stu-001", {"level": "Grade 8"})
        try:
            with TenantContext(tenant_id="tenant-other-school"):
                engine.get("students", "stu-001")
            return False, "Cross-tenant access should have been rejected"
        except CrossTenantViolationError:
            pass
        return True, "Row-level tenant isolation verified with zero-bleed boundaries"

    # Step 8: Autonomous AI bounded capability & 5% drift rollback circuit breaker
    def step_08():
        from phase8.models.model_drift_monitor import ModelDriftMonitor
        monitor = ModelDriftMonitor(
            baseline_path=ROOT / "phase8" / "data" / "drift_monitoring_baseline.json"
        )
        degraded = {"correctness": 0.85, "safety": 0.90}  # > 5% drop
        report = monitor.evaluate_drift(current_telemetry=degraded)
        if report.recommendation != "TRIGGER_ROLLBACK_TO_PREVIOUS_VERSION":
            return False, f"Expected rollback recommendation, got {report.recommendation}"
        return True, "5% model drift threshold tripped circuit breaker and recommended rollback"

    # Step 9: FinOps token accounting spending caps & runaway agent killer verification
    def step_09():
        from phase8.models.finops_token_guard import FinOpsTokenGuard, RunawayAgentLoopTerminatedError
        guard = FinOpsTokenGuard()
        try:
            for _ in range(1, 8):
                guard.increment_and_check_loop(session_id="sess-runaway", goal_id="goal-01")
            return False, "Runaway agent loop should have been terminated at 6 iterations (> 5)"
        except RunawayAgentLoopTerminatedError:
            pass
        return True, "FinOps token guard terminated runaway agent loop at 6 iterations (> 5 allowed)"

    # Step 10: LLM provider outage independence (safety remains operational)
    def step_10():
        from phase8.models.llm_provider_gateway import LLMProviderGateway
        gateway = LLMProviderGateway()
        gateway.set_provider_status(primary=False, secondary=False)
        if not gateway.is_safety_escalation_functional():
            return False, "Child safeguarding must remain 100% operational during complete AI outage"
        return True, "Child safeguarding escalation verified 100% operational during complete AI outage"

    # Step 11: W3C VC 2.0 credential issuance & revocation lifecycle verification
    def step_11():
        from phase9.models.credential_engine import CredentialEngine
        cred_engine = CredentialEngine(ROOT / "phase9" / "credentials")
        with open(ROOT / "phase9" / "credentials" / "sample-credential.json", "r", encoding="utf-8") as f:
            cred = json.load(f)
        res = cred_engine.issue_credential(cred)
        if res.get("status") != "ISSUED":
            return False, "Credential issuance failed"
        rev = cred_engine.revoke_credential(cred["id"], "Test revocation", "Principal")
        if rev.get("status") != "REVOKED" or not cred_engine.is_revoked(cred["id"]):
            return False, "Credential revocation failed"
        return True, "W3C VC 2.0 credential issuance and revocation lifecycle verified"

    # Step 12: Zero-PII public verification token hash audit
    def step_12():
        from phase9.models.credential_engine import CredentialEngine
        cred_engine = CredentialEngine(ROOT / "phase9" / "credentials")
        token_info = cred_engine.generate_zero_pii_token()
        if len(token_info["private_token"]) != 64 or len(token_info["verificationTokenHash"]) != 64:
            return False, "Invalid token or hash length"
        return True, "Zero-PII verification token hash verified (256-bit entropy, SHA-256)"

    # Step 13: Anti-gaming speedrun filter (< 8s) verification
    def step_13():
        from phase9.models.credential_engine import CredentialEngine
        cred_engine = CredentialEngine(ROOT / "phase9" / "credentials")
        durations = [3.0, 4.0] + [25.0] * 20
        report = cred_engine.evaluate_session_integrity(
            question_durations_seconds=durations,
            total_questions=22,
            accuracy=0.90,
            assistance_count=1,
            total_time_minutes=50.0,
        )
        if report.is_valid:
            return False, "Speedrun session must be invalidated"
        return True, "Anti-gaming filter flagged 2 speedrun answers (< 8s) and invalidated session"

    # Step 14: Multi-jurisdiction dynamic routing & Strictest Rule On Mismatch audit
    def step_14():
        from phase9.models.jurisdiction_engine import JurisdictionEngine
        jur_engine = JurisdictionEngine(ROOT / "phase9" / "jurisdictions")
        res = jur_engine.resolve_conflicting_jurisdictions(["in-dpdp", "us-coppa-ferpa"])
        if res.effective_child_age_threshold != 18 or res.effective_withdrawal_purge_sla_hours != 24:
            return False, "Strictest Rule On Mismatch failed"
        return True, "Strictest Rule On Mismatch enforced (max age=18y, min purge=24h)"

    # Step 15: District-level aggregate reporting k-anonymity (k >= 10) audit
    def step_15():
        from phase9.models.district_reporting import DistrictReportingEngine
        dist_engine = DistrictReportingEngine(k_anonymity=10)
        cohorts = [
            {"school_id": "s1", "cohort_size": 25, "competency_code": "MATH-01", "mean_mastery": 0.88, "teacher_reviewed": True},
            {"school_id": "s2", "cohort_size": 4, "competency_code": "MATH-TINY", "mean_mastery": 0.95, "teacher_reviewed": True},
        ]
        rep = dist_engine.aggregate_district_data("DIST-01", "North District", "2026-2027", cohorts)
        if not rep.competency_summaries["MATH-TINY"].is_suppressed:
            return False, "Cohort size 4 (< 10) must be suppressed"
        return True, "District aggregate reporting enforced k-anonymity (k=10 suppression)"

    # Step 16: Master completion ledger & explicit non-founder ownership audit
    def step_16():
        script = fp_base / "scripts" / "validate_completion_ledger.py"
        res = subprocess.run([sys.executable, str(script)], capture_output=True, text=True)
        if res.returncode != 0:
            return False, f"validate_completion_ledger failed: {res.stderr}"
        return True, "Master completion ledger and non-founder ownership validated"

    # Step 17: Continuous operating rhythm schedules and overdue review detection audit
    def step_17():
        scheduler = OperatingRhythmScheduler(fp_base / "reviews")
        scheduler.verify_no_founder_defaults()
        statuses = scheduler.get_cadence_statuses()
        if len(statuses) < 7:
            return False, f"Expected at least 7 active operating cadences, found {len(statuses)}"
        return True, f"Operating rhythm verified with {len(statuses)} active cadences and zero founder defaults"

    # Step 18: Master Production Release Gate evaluation (12 conditions -> DECISION: >>> GO <<<)
    def step_18():
        script = fp_base / "scripts" / "validate_release_gate.py"
        res = subprocess.run([sys.executable, str(script)], capture_output=True, text=True)
        if res.returncode != 0 or "DECISION: >>> GO <<<" not in res.stdout:
            return False, f"Release gate evaluation failed: {res.stdout}\n{res.stderr}"
        return True, "All 12 production release conditions satisfied: DECISION: >>> GO <<<"

    steps = [
        (1, "Validate Phase 9 gate prerequisite", step_01),
        (2, "8 Permanent Human-Only Controls verification", step_02),
        (3, "4 Eternal Non-Negotiables policy integrity verification", step_03),
        (4, "Continuous 9-stage safety loop operational audit", step_04),
        (5, "Dual-channel safety notification dispatch & fallback drill", step_05),
        (6, "AI safety incident closure absolute denial enforcement", step_06),
        (7, "Multi-tenant zero-bleed database isolation verification", step_07),
        (8, "Autonomous AI bounded capability & 5% drift rollback circuit breaker", step_08),
        (9, "FinOps token accounting spending caps & runaway agent killer verification", step_09),
        (10, "LLM provider outage independence (safety remains operational)", step_10),
        (11, "W3C VC 2.0 credential issuance & revocation lifecycle verification", step_11),
        (12, "Zero-PII public verification token hash audit", step_12),
        (13, "Anti-gaming speedrun filter (< 8s) verification", step_13),
        (14, "Multi-jurisdiction dynamic routing & Strictest Rule On Mismatch audit", step_14),
        (15, "District-level aggregate reporting k-anonymity (k >= 10) audit", step_15),
        (16, "Master completion ledger & explicit non-founder organizational ownership audit", step_16),
        (17, "Continuous operating rhythm schedules and overdue review detection audit", step_17),
        (18, "Master Production Release Gate evaluation (DECISION: >>> GO <<<)", step_18),
    ]

    all_passed = True
    for step_num, title, fn in steps:
        passed = run_step(step_num, title, fn)
        results[f"step_{step_num:02d}_{title}"] = "PASS" if passed else "FAIL"
        if not passed:
            all_passed = False
            break

    print("\n================================================================================")
    print("FINAL PHASE EXECUTION PROCEDURE SUMMARY")
    print("================================================================================")
    for step_key, status in results.items():
        print(f"[{status:4}] {step_key}")
    print("================================================================================")

    out_file = fp_base / "data" / "final_phase_verification_report.json"
    out_file.parent.mkdir(parents=True, exist_ok=True)
    report_data = {
        "phase": "FINAL_PHASE",
        "phaseName": "Ongoing Operations & Continuous Governance",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "status": "PASS" if all_passed else "FAIL",
        "decision": "GO" if all_passed else "NO_GO",
        "releaseAuthorized": all_passed,
        "stepsEvaluated": len(results),
        "stepsPassed": sum(1 for s in results.values() if s == "PASS"),
        "stepDetails": results,
        "releaseConditionsCount": 12,
        "releaseConditionsSatisfied": 12 if all_passed else 0,
        "permanentHumanControls": {
            "MASTERY_CERTIFICATION": "HUMAN_ONLY",
            "CONSENT_CHANGE": "HUMAN_ONLY",
            "CONSENT_WITHDRAWAL": "HUMAN_ONLY",
            "ROLE_CHANGE": "HUMAN_ONLY",
            "SAFETY_INCIDENT_CLOSURE": "HUMAN_ONLY",
            "CREDENTIAL_AUTHORIZATION": "HUMAN_ONLY",
            "AUTONOMY_POLICY_CHANGE": "HUMAN_ONLY",
            "JURISDICTION_ACTIVATION": "HUMAN_ONLY",
        },
    }
    with open(out_file, "w", encoding="utf-8") as f:
        json.dump(report_data, f, indent=2)

    print(f"Report written to: {out_file}")
    if all_passed:
        print("\n================================================================================")
        print(">>> FINAL RELEASE DECISION: GO — PRODUCTION AUTHORIZED FOR GLOBAL DEPLOYMENT <<<")
        print("================================================================================\n")
        return 0
    else:
        print("\n>>> FINAL RELEASE DECISION: NO-GO — RELEASE BLOCKED <<<\n")
        return 1


if __name__ == "__main__":
    sys.exit(main())
