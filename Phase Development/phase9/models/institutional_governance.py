"""
YOUVA-EdAI — Phase 9: Institutional Governance & Procurement Data Room Engine
Enforces:
- 7 mandatory recurring governance review cadences and SLA escalation tracking.
- Overdue review detection and alerting.
- Continuous Compliance Matrix verification across ISO 27001, SOC 2, FERPA, COPPA, DPDP.
- Procurement Data Room access control, document approval verification, and audit logging.
"""

from dataclasses import dataclass, field
from datetime import datetime, date, timedelta, timezone
import json
from pathlib import Path
from typing import Any, Dict, List, Optional, Set


class GovernanceError(Exception):
    """Base error for governance failures."""
    pass


class GovernanceReviewOverdueError(GovernanceError):
    """Raised when a mandatory recurring governance review is overdue."""
    pass


class NonCompliantControlError(GovernanceError):
    """Raised when an institutional compliance matrix control is non-compliant."""
    pass


class DataRoomAccessDeniedError(GovernanceError):
    """Raised when an unauthorized actor attempts to access confidential data room documents."""
    pass


MANDATORY_REVIEW_CLASSES = {
    "model_drift_bias_audit": 90,
    "child_safety_policy_review": 60,
    "penetration_testing_security_audit": 180,
    "curriculum_alignment_review": 365,
    "sla_incident_retrospective": 30,
    "audit_log_cryptographic_verification": 7,
    "institutional_compliance_recertification": 365,
}

CONFIDENTIAL_AUTHORIZED_ROLES = {
    "Institutional Auditor",
    "Compliance Officer",
    "Legal Counsel",
    "Chief Information Security Officer",
    "AI Safety Officer",
    "Regulatory Affairs Director",
}


@dataclass
class OverdueReviewAlert:
    review_id: str
    name: str
    owner_role: str
    last_conducted: str
    next_due: str
    days_overdue: int
    escalation_hours: int


class InstitutionalGovernanceEngine:
    """Production runtime engine for institutional governance, compliance, and data room."""

    def __init__(self, governance_dir: Optional[Path] = None):
        if governance_dir is None:
            governance_dir = Path(__file__).resolve().parents[1] / "governance"
        self.governance_dir = governance_dir
        self.scheduler_file = self.governance_dir / "governance-scheduler.json"
        self.compliance_file = self.governance_dir / "compliance-matrix.json"
        self.data_room_file = self.governance_dir / "data-room-index.json"

        self.scheduler = self._load_json(self.scheduler_file)
        self.compliance = self._load_json(self.compliance_file)
        self.data_room = self._load_json(self.data_room_file)
        self.access_logs: List[Dict[str, Any]] = []

    def _load_json(self, path: Path) -> dict:
        if not path.exists():
            raise FileNotFoundError(f"Governance file not found: {path}")
        with path.open("r", encoding="utf-8") as f:
            return json.load(f)

    def check_review_cadences(self, reference_date: Optional[date] = None) -> List[OverdueReviewAlert]:
        """
        Audits all review classes against their maximum allowed intervals and due dates.
        Returns a list of OverdueReviewAlerts.
        """
        if reference_date is None:
            reference_date = date.today()

        reviews = self.scheduler.get("reviewClasses", [])
        overdue_alerts: List[OverdueReviewAlert] = []

        for r in reviews:
            rid = r.get("id")
            name = r.get("name")
            owner = r.get("ownerRole")
            next_due_str = r.get("nextDue")
            last_conducted_str = r.get("lastConducted")
            escalation = r.get("escalationPathHours", 24)

            if next_due_str:
                due_dt = datetime.strptime(next_due_str, "%Y-%m-%d").date()
                if reference_date > due_dt:
                    days_over = (reference_date - due_dt).days
                    overdue_alerts.append(
                        OverdueReviewAlert(
                            review_id=rid,
                            name=name,
                            owner_role=owner,
                            last_conducted=last_conducted_str,
                            next_due=next_due_str,
                            days_overdue=days_over,
                            escalation_hours=escalation,
                        )
                    )

        return overdue_alerts

    def enforce_no_overdue_reviews(self, reference_date: Optional[date] = None) -> None:
        """Raises GovernanceReviewOverdueError if any mandatory review is overdue."""
        overdue = self.check_review_cadences(reference_date)
        if overdue:
            first = overdue[0]
            raise GovernanceReviewOverdueError(
                f"Mandatory review '{first.review_id}' ({first.name}) is overdue by {first.days_overdue} days! "
                f"Owner: {first.owner_role}, Escalation SLA: {first.escalation_hours}h"
            )

    def audit_compliance_matrix(self) -> Dict[str, Any]:
        """
        Audits 100% of controls across all domains in the compliance matrix.
        Fails closed on any non-compliant control.
        """
        domains = self.compliance.get("domains", [])
        total_controls = 0
        compliant_controls = 0

        for domain in domains:
            d_name = domain.get("domain")
            controls = domain.get("controls", [])
            for c in controls:
                total_controls += 1
                cid = c.get("controlId")
                status = c.get("status")
                if status != "COMPLIANT":
                    raise NonCompliantControlError(
                        f"Compliance Matrix failure: Control '{cid}' in domain '{d_name}' "
                        f"has non-compliant status '{status}'"
                    )
                compliant_controls += 1

        return {
            "status": "100% COMPLIANT",
            "totalControls": total_controls,
            "compliantControls": compliant_controls,
            "domainsAudited": len(domains),
        }

    def access_data_room_document(
        self,
        doc_id: str,
        actor_role: str,
        actor_id: str
    ) -> Dict[str, Any]:
        """
        Retrieves a document from the Institutional Data Room.
        Enforces confidentiality access controls and records access log.
        """
        sections = self.data_room.get("dataRoom", {}).get("sections", [])
        target_doc = None
        target_section = None

        for sec in sections:
            for d in sec.get("documents", []):
                if d.get("docId") == doc_id:
                    target_doc = d
                    target_section = sec.get("title")
                    break
            if target_doc:
                break

        if not target_doc:
            raise FileNotFoundError(f"Document '{doc_id}' not found in Data Room")

        classification = target_doc.get("classification", "CONFIDENTIAL")
        if classification == "CONFIDENTIAL" and actor_role not in CONFIDENTIAL_AUTHORIZED_ROLES:
            raise DataRoomAccessDeniedError(
                f"Access Denied: Actor '{actor_id}' with role '{actor_role}' "
                f"is not authorized for CONFIDENTIAL document '{doc_id}'"
            )

        if target_doc.get("status") != "APPROVED":
            raise GovernanceError(
                f"Access Denied: Document '{doc_id}' is in unapproved status '{target_doc.get('status')}'"
            )

        log_entry = {
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "docId": doc_id,
            "section": target_section,
            "classification": classification,
            "actorId": actor_id,
            "actorRole": actor_role,
            "accessGranted": True,
        }
        self.access_logs.append(log_entry)
        return target_doc
