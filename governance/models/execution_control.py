"""
YOUVA-EdAI — Master Execution Control System (MECS)
Authoritative status engine, task registry, and evidence verification framework.

Enforces:
1. Strict 9-state task status model:
   NOT_STARTED -> IN_PROGRESS -> IMPLEMENTED -> INTERNAL_VERIFIED -> 
   EXTERNALLY_VERIFIED -> APPROVED -> ACTIVE -> REVALIDATION_REQUIRED -> RETIRED
2. Verification Independence:
   Implemented (code exists) vs Internal Verified (tested by team) vs 
   Externally Verified (independent third-party reviewer tested it).
3. Dependency-gated release and activation:
   Blocking tasks in prior phases must be satisfied before downstream activation.
4. Permanent immutable evidence binding.
"""

from dataclasses import dataclass, field
from datetime import datetime, timezone
from enum import Enum
import json
from pathlib import Path
from typing import Any, Dict, List, Optional, Set, Tuple


class TaskStatus(str, Enum):
    NOT_STARTED = "NOT_STARTED"
    IN_PROGRESS = "IN_PROGRESS"
    IMPLEMENTED = "IMPLEMENTED"
    INTERNAL_VERIFIED = "INTERNAL_VERIFIED"
    EXTERNALLY_VERIFIED = "EXTERNALLY_VERIFIED"
    APPROVED = "APPROVED"
    ACTIVE = "ACTIVE"
    REVALIDATION_REQUIRED = "REVALIDATION_REQUIRED"
    RETIRED = "RETIRED"


class EvidenceType(str, Enum):
    CODE = "CODE"
    UNIT_TEST = "UNIT_TEST"
    INTEGRATION_TEST = "INTEGRATION_TEST"
    E2E_TEST = "E2E_TEST"
    SECURITY_TEST = "SECURITY_TEST"
    MANUAL_TEST = "MANUAL_TEST"
    LEGAL_REVIEW = "LEGAL_REVIEW"
    SAFETY_REVIEW = "SAFETY_REVIEW"
    EXTERNAL_REVIEW = "EXTERNAL_REVIEW"
    PILOT_DATA = "PILOT_DATA"
    CUSTOMER_EVIDENCE = "CUSTOMER_EVIDENCE"
    DEPLOYMENT_RECORD = "DEPLOYMENT_RECORD"


class EvidenceResult(str, Enum):
    PASS = "PASS"
    FAIL = "FAIL"
    PARTIAL = "PARTIAL"


class TaskPriority(str, Enum):
    CRITICAL = "CRITICAL"
    HIGH = "HIGH"
    MEDIUM = "MEDIUM"
    LOW = "LOW"


class ExecutionControlError(Exception):
    """Base error for execution control violations."""
    pass


class InvalidStatusTransitionError(ExecutionControlError):
    """Raised when an unapproved or illegal status transition is attempted."""
    pass


class MissingEvidenceError(ExecutionControlError):
    """Raised when promoting a task without mandatory verification evidence."""
    pass


class DependencyBlockedError(ExecutionControlError):
    """Raised when attempting to activate a task whose blocking dependencies are unresolved."""
    pass


@dataclass
class VerificationEvidence:
    id: str = ""
    taskId: str = ""
    evidenceType: str = "CODE"
    location: str = ""
    description: str = ""
    result: str = "PASS"
    performedBy: str = ""
    performedAt: str = ""
    independent: bool = False
    expiresAt: Optional[str] = None

    def to_dict(self) -> Dict[str, Any]:
        return {
            "id": self.id,
            "taskId": self.taskId,
            "evidenceType": self.evidenceType,
            "location": self.location,
            "description": self.description,
            "result": self.result,
            "performedBy": self.performedBy,
            "performedAt": self.performedAt,
            "independent": self.independent,
            "expiresAt": self.expiresAt
        }


@dataclass
class RoadmapTask:
    id: str
    phase: str
    category: str
    title: str
    description: str
    owner: str
    status: TaskStatus
    priority: TaskPriority
    blocking: bool = False
    dependencies: List[str] = field(default_factory=list)
    evidenceIds: List[str] = field(default_factory=list)
    reviewerIds: List[str] = field(default_factory=list)
    completionDate: Optional[str] = None
    verificationDate: Optional[str] = None
    nextReviewDate: Optional[str] = None
    createdAt: str = field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    updatedAt: str = field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

    def to_dict(self) -> Dict[str, Any]:
        return {
            "id": self.id,
            "phase": self.phase,
            "category": self.category,
            "title": self.title,
            "description": self.description,
            "owner": self.owner,
            "status": self.status.value if isinstance(self.status, TaskStatus) else self.status,
            "priority": self.priority.value if isinstance(self.priority, TaskPriority) else self.priority,
            "blocking": self.blocking,
            "dependencies": self.dependencies,
            "evidenceIds": self.evidenceIds,
            "reviewerIds": self.reviewerIds,
            "completionDate": self.completionDate,
            "verificationDate": self.verificationDate,
            "nextReviewDate": self.nextReviewDate,
            "createdAt": self.createdAt,
            "updatedAt": self.updatedAt
        }


class MasterExecutionControlEngine:
    """
    Engine that manages the roadmap task lifecycle, verifies evidence independence,
    and calculates platform governance status.
    """

    ALLOWED_TRANSITIONS: Dict[TaskStatus, Set[TaskStatus]] = {
        TaskStatus.NOT_STARTED: {TaskStatus.IN_PROGRESS, TaskStatus.RETIRED},
        TaskStatus.IN_PROGRESS: {TaskStatus.IMPLEMENTED, TaskStatus.NOT_STARTED, TaskStatus.RETIRED},
        TaskStatus.IMPLEMENTED: {TaskStatus.INTERNAL_VERIFIED, TaskStatus.IN_PROGRESS, TaskStatus.RETIRED},
        TaskStatus.INTERNAL_VERIFIED: {TaskStatus.EXTERNALLY_VERIFIED, TaskStatus.APPROVED, TaskStatus.IN_PROGRESS, TaskStatus.REVALIDATION_REQUIRED},
        TaskStatus.EXTERNALLY_VERIFIED: {TaskStatus.APPROVED, TaskStatus.IN_PROGRESS, TaskStatus.REVALIDATION_REQUIRED},
        TaskStatus.APPROVED: {TaskStatus.ACTIVE, TaskStatus.REVALIDATION_REQUIRED, TaskStatus.RETIRED},
        TaskStatus.ACTIVE: {TaskStatus.REVALIDATION_REQUIRED, TaskStatus.RETIRED},
        TaskStatus.REVALIDATION_REQUIRED: {TaskStatus.IN_PROGRESS, TaskStatus.INTERNAL_VERIFIED, TaskStatus.EXTERNALLY_VERIFIED, TaskStatus.RETIRED},
        TaskStatus.RETIRED: {TaskStatus.NOT_STARTED, TaskStatus.IN_PROGRESS}
    }

    def __init__(self, data_dir: Optional[Path] = None):
        if data_dir is None:
            data_dir = Path(__file__).resolve().parent.parent / "data"
        self.data_dir = data_dir
        self.tasks_file = self.data_dir / "master_task_registry.json"
        self.evidence_file = self.data_dir / "verification_evidence_registry.json"

        self.tasks: Dict[str, RoadmapTask] = {}
        self.evidence: Dict[str, VerificationEvidence] = {}
        self.load_registries()

    def load_registries(self) -> None:
        if self.evidence_file.exists():
            with open(self.evidence_file, "r", encoding="utf-8") as f:
                data = json.load(f)
                for item in data.get("evidence", []):
                    ev = VerificationEvidence(**item)
                    self.evidence[ev.id] = ev

        if self.tasks_file.exists():
            with open(self.tasks_file, "r", encoding="utf-8") as f:
                data = json.load(f)
                for item in data.get("tasks", []):
                    task = RoadmapTask(
                        id=item["id"],
                        phase=item["phase"],
                        category=item["category"],
                        title=item["title"],
                        description=item["description"],
                        owner=item["owner"],
                        status=TaskStatus(item["status"]),
                        priority=TaskPriority(item["priority"]),
                        blocking=item.get("blocking", False),
                        dependencies=item.get("dependencies", []),
                        evidenceIds=item.get("evidenceIds", []),
                        reviewerIds=item.get("reviewerIds", []),
                        completionDate=item.get("completionDate"),
                        verificationDate=item.get("verificationDate"),
                        nextReviewDate=item.get("nextReviewDate"),
                        createdAt=item.get("createdAt", datetime.now(timezone.utc).isoformat()),
                        updatedAt=item.get("updatedAt", datetime.now(timezone.utc).isoformat())
                    )
                    self.tasks[task.id] = task

    def save_registries(self) -> None:
        self.data_dir.mkdir(parents=True, exist_ok=True)
        with open(self.tasks_file, "w", encoding="utf-8") as f:
            json.dump(
                {
                    "version": "1.0.0",
                    "updatedAt": datetime.now(timezone.utc).isoformat(),
                    "tasks": [t.to_dict() for t in self.tasks.values()]
                },
                f,
                indent=2
            )

        with open(self.evidence_file, "w", encoding="utf-8") as f:
            json.dump(
                {
                    "version": "1.0.0",
                    "updatedAt": datetime.now(timezone.utc).isoformat(),
                    "evidence": [e.to_dict() for e in self.evidence.values()]
                },
                f,
                indent=2
            )

    def add_evidence(self, evidence: VerificationEvidence) -> None:
        self.evidence[evidence.id] = evidence
        if evidence.taskId in self.tasks:
            task = self.tasks[evidence.taskId]
            if evidence.id not in task.evidenceIds:
                task.evidenceIds.append(evidence.id)
                task.updatedAt = datetime.now(timezone.utc).isoformat()

    def transition_task_status(
        self,
        task_id: str,
        target_status: TaskStatus,
        actor_id: str
    ) -> RoadmapTask:
        if task_id not in self.tasks:
            raise ExecutionControlError(f"Task [{task_id}] not found in registry.")

        task = self.tasks[task_id]
        current_status = task.status

        # 1. State machine validation
        allowed = self.ALLOWED_TRANSITIONS.get(current_status, set())
        if target_status not in allowed:
            raise InvalidStatusTransitionError(
                f"Illegal transition: Cannot move task [{task_id}] from {current_status.value} to {target_status.value}. "
                f"Permitted next states: {[s.value for s in allowed]}"
            )

        # 2. Dependency validation for ACTIVE / APPROVED
        if target_status in (TaskStatus.APPROVED, TaskStatus.ACTIVE):
            for dep_id in task.dependencies:
                if dep_id not in self.tasks:
                    raise DependencyBlockedError(f"Blocking dependency [{dep_id}] not found in task registry.")
                dep_task = self.tasks[dep_id]
                if dep_task.status not in (TaskStatus.APPROVED, TaskStatus.ACTIVE):
                    raise DependencyBlockedError(
                        f"Cannot promote task [{task_id}] to {target_status.value}: "
                        f"Blocking dependency [{dep_id}] ({dep_task.title}) is in status {dep_task.status.value}."
                    )

        # 3. Verification Independence checks
        task_evidences = [self.evidence[eid] for eid in task.evidenceIds if eid in self.evidence]

        if target_status == TaskStatus.INTERNAL_VERIFIED:
            passing_ev = [e for e in task_evidences if e.result == EvidenceResult.PASS.value]
            if not passing_ev:
                raise MissingEvidenceError(
                    f"Cannot promote [{task_id}] to INTERNAL_VERIFIED: At least one passing internal evidence record is required."
                )

        if target_status == TaskStatus.EXTERNALLY_VERIFIED:
            independent_ev = [
                e for e in task_evidences 
                if e.independent and e.result == EvidenceResult.PASS.value
            ]
            if not independent_ev:
                raise MissingEvidenceError(
                    f"INDEPENDENT VERIFICATION INVARIANT VIOLATION: Cannot promote [{task_id}] to EXTERNALLY_VERIFIED. "
                    "At least one passing evidence record from an independent third-party reviewer is strictly required."
                )

        if target_status in (TaskStatus.APPROVED, TaskStatus.ACTIVE):
            passing_ev = [e for e in task_evidences if e.result == EvidenceResult.PASS.value]
            if not passing_ev:
                raise MissingEvidenceError(
                    f"Cannot promote [{task_id}] to {target_status.value}: No passing verification evidence attached."
                )

        # Update state
        now_iso = datetime.now(timezone.utc).isoformat()
        task.status = target_status
        task.updatedAt = now_iso
        if target_status in (TaskStatus.INTERNAL_VERIFIED, TaskStatus.EXTERNALLY_VERIFIED):
            task.verificationDate = now_iso
        if target_status == TaskStatus.APPROVED:
            task.completionDate = now_iso
            if actor_id not in task.reviewerIds:
                task.reviewerIds.append(actor_id)

        return task

    def get_governance_dashboard_metrics(self) -> Dict[str, Any]:
        """Calculates authoritative platform governance metrics based on real task and evidence states."""
        by_status = {s.value: 0 for s in TaskStatus}
        by_phase: Dict[str, Dict[str, int]] = {}

        for task in self.tasks.values():
            s_val = task.status.value if isinstance(task.status, TaskStatus) else task.status
            by_status[s_val] = by_status.get(s_val, 0) + 1

            p_val = task.phase
            if p_val not in by_phase:
                by_phase[p_val] = {s.value: 0 for s in TaskStatus}
            by_phase[p_val][s_val] = by_phase[p_val].get(s_val, 0) + 1

        total_tasks = len(self.tasks)
        active_count = by_status.get(TaskStatus.ACTIVE.value, 0)
        approved_count = by_status.get(TaskStatus.APPROVED.value, 0)
        ext_verified_count = by_status.get(TaskStatus.EXTERNALLY_VERIFIED.value, 0)
        int_verified_count = by_status.get(TaskStatus.INTERNAL_VERIFIED.value, 0)

        total_evidence = len(self.evidence)
        independent_evidence = sum(1 for e in self.evidence.values() if e.independent)

        return {
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "totalTasks": total_tasks,
            "statusBreakdown": by_status,
            "phaseBreakdown": by_phase,
            "activeTasks": active_count,
            "approvedTasks": approved_count,
            "externallyVerifiedTasks": ext_verified_count,
            "internallyVerifiedTasks": int_verified_count,
            "totalEvidenceRecords": total_evidence,
            "independentEvidenceRecords": independent_evidence,
            "overallReadinessPercentage": round(
                ((active_count + approved_count + ext_verified_count) / max(1, total_tasks)) * 100, 2
            )
        }
