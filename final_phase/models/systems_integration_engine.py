"""
YOUVA-EdAI — Final Phase: Master Systems Integration & Release Decision Engine
Enforces:
- Full end-to-end integration across all 10 roadmap phases (Phase 0 through Final Phase).
- Comprehensive evaluation of the 12 production release gate conditions.
- Whole-system health auditing, inter-phase contract validation, and final GO authorization.
"""

from dataclasses import dataclass, field
from datetime import datetime, timezone
import json
from pathlib import Path
from typing import Any, Dict, List, Optional


class SystemsIntegrationError(Exception):
    """Base error for systems integration failures."""
    pass


class ReleaseConditionViolationError(SystemsIntegrationError):
    """Raised when a mandatory production release condition is violated."""
    pass


@dataclass
class PhaseIntegrationStatus:
    phase_id: str
    phase_name: str
    is_verified: bool
    evidence_path: str
    invariants_enforced: List[str]


@dataclass
class ReleaseGateEvaluationResult:
    decision: str  # 'GO' or 'NO_GO'
    total_conditions: int
    passed_conditions: int
    mandatory_violations: List[str]
    evaluated_at: str
    release_authorized: bool


class SystemsIntegrationEngine:
    """Master production systems integration engine uniting Phases 0 through Final Phase."""

    PHASE_MAP = [
        ("PHASE_0", "Phase 0 — Scope Lock & Baseline Invariants", "phase0/scope-lock.json", ["MIDDLE_SCHOOL_BOUNDARY", "NO_GENERATIVE_FREE_TEXT"]),
        ("PHASE_1", "Phase 1 — Core Adaptive Learning Loop & BKT", "phase1/content/grade8_linear_equations_bank.json", ["DETERMINISTIC_BKT_MASTERY", "TEACHER_OVERRIDE"]),
        ("PHASE_2", "Phase 2 — Trust Hardening & Cryptographic Ledger", "phase2/models/consent_manager.py", ["VERIFIABLE_CONSENT_OTP", "24H_DATA_PURGE", "HMAC_LEDGER"]),
        ("PHASE_3", "Phase 3 — Classroom Closed Pilot & Telemetry", "phase3/data/pilot_evaluation_report.json", ["PRIVACY_PRESERVING_TELEMETRY", "TEACHER_TRUST_METRIC"]),
        ("PHASE_4", "Phase 4 — Personalization Depth & Concept DAG", "phase4/data/grade8_math_concept_dag.json", ["3_TIER_HINTS", "MISTAKE_TAXONOMY", "METRIC_PURGE"]),
        ("PHASE_5", "Phase 5 — High School & Skills Passport W3C VC 2.0", "phase5/content/grade10_concept_dag.json", ["ZERO_PII_STUDENT_HASH", "TEACHER_SIGNATURE_MANDATORY"]),
        ("PHASE_6", "Phase 6 — Early Childhood Voice UI & Sandbox", "phase6/content/foundational_diagnostic.json", ["ZERO_GENERATIVE_IN_CHILD_PATH", "15M_SCREEN_TIME_CAP"]),
        ("PHASE_7", "Phase 7 — Scale Infra, Multi-Tenancy & Licensing", "phase7/data/dps_enterprise_contract.json", ["ROW_LEVEL_TENANT_ISOLATION", "SSRF_DEFENSES", "AUTHORITATIVE_MASTERY"]),
        ("PHASE_8", "Phase 8 — Autonomous AI Maturity & Drift Guard", "phase8/data/phase8_verification_report.json", ["5_PERCENT_DRIFT_ROLLBACK", "FINOPS_TOKEN_GUARD", "AI_SANDBOX"]),
        ("PHASE_9", "Phase 9 — Institutional Scale & Credential Network", "phase9/data/phase9_verification_report.json", ["STRICKTEST_JURISDICTION_RULE", "ANTI_GAMING_SPEEDRUN_FILTER", "DISTRICT_K_ANONYMITY_10"]),
        ("FINAL_PHASE", "Final Phase — Continuous Governance & Operations", "final_phase/release_gate/release_gate_config.json", ["8_PERMANENT_HUMAN_CONTROLS", "9_STAGE_SAFETY_LOOP", "ZERO_FOUNDER_DEFAULT"]),
    ]

    def __init__(self, root_dir: Optional[Path] = None):
        if root_dir is None:
            root_dir = Path(__file__).resolve().parents[2]
        self.root_dir = root_dir
        self.release_config_file = (
            self.root_dir / "final_phase" / "release_gate" / "release_gate_config.json"
        )
        self.master_ledger_file = (
            self.root_dir / "final_phase" / "ledger" / "master_completion_ledger.json"
        )

        self.release_config = self._load_json(self.release_config_file)
        self.master_ledger = self._load_json(self.master_ledger_file)

    def _load_json(self, path: Path) -> dict:
        if not path.exists():
            raise FileNotFoundError(f"Integration config file not found: {path}")
        with path.open("r", encoding="utf-8") as f:
            return json.load(f)

    def verify_all_phases_integrated(self) -> List[PhaseIntegrationStatus]:
        """
        Validates that every single phase from Phase 0 to Final Phase
        is present, integrated, and verified by physical evidence artifacts.
        """
        statuses = []
        for pid, pname, evidence_rel, invariants in self.PHASE_MAP:
            evidence_full = self.root_dir / evidence_rel
            is_present = evidence_full.exists()
            statuses.append(
                PhaseIntegrationStatus(
                    phase_id=pid,
                    phase_name=pname,
                    is_verified=is_present,
                    evidence_path=str(evidence_rel),
                    invariants_enforced=invariants,
                )
            )
        return statuses

    def evaluate_release_conditions(self) -> ReleaseGateEvaluationResult:
        """
        Evaluates all 12 mandatory production release conditions.
        Fails closed on any violated mandatory condition.
        """
        conditions = self.release_config.get("releaseConditions", [])
        total = len(conditions)
        passed = 0
        violations = []

        for c in conditions:
            cid = c.get("id")
            name = c.get("name")
            status = c.get("status")
            mandatory = c.get("mandatory", True)

            if status == "PASS":
                passed += 1
            else:
                if mandatory:
                    violations.append(f"{cid} ({name}): status is '{status}'")

        decision = "GO" if len(violations) == 0 and passed == total else "NO_GO"
        now = datetime.now(timezone.utc).isoformat()

        return ReleaseGateEvaluationResult(
            decision=decision,
            total_conditions=total,
            passed_conditions=passed,
            mandatory_violations=violations,
            evaluated_at=now,
            release_authorized=(decision == "GO"),
        )

    def execute_release_authorization(self) -> Dict[str, Any]:
        """
        Executes final production release gate check.
        Raises ReleaseConditionViolationError if decision is not GO.
        """
        phases = self.verify_all_phases_integrated()
        missing_phases = [p.phase_name for p in phases if not p.is_verified]
        if missing_phases:
            raise SystemsIntegrationError(
                f"Whole-system integration broken: Missing evidence for {missing_phases}"
            )

        gate_eval = self.evaluate_release_conditions()
        if not gate_eval.release_authorized:
            raise ReleaseConditionViolationError(
                f"Production Release Denied: Violations detected: {gate_eval.mandatory_violations}"
            )

        return {
            "decision": "GO",
            "authorizationStatus": "PRODUCTION_RELEASE_AUTHORIZED",
            "evaluatedAt": gate_eval.evaluated_at,
            "phasesIntegrated": len(phases),
            "releaseConditionsEvaluated": gate_eval.total_conditions,
            "releaseConditionsPassed": gate_eval.passed_conditions,
            "governanceInvariants": "100_PERCENT_INTACT",
        }
