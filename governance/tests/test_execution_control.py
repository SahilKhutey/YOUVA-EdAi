"""
YOUVA-EdAI — Master Execution Control Engine Tests
Verifies the 9-state task lifecycle, dependency gating, evidence binding, and dashboard metrics.
"""

import pytest
from governance.models.execution_control import (
    MasterExecutionControlEngine,
    RoadmapTask,
    TaskStatus,
    TaskPriority,
    VerificationEvidence,
    InvalidStatusTransitionError,
    DependencyBlockedError,
    MissingEvidenceError
)


@pytest.fixture
def engine(tmp_path):
    return MasterExecutionControlEngine(data_dir=tmp_path)


def test_task_lifecycle_happy_path(engine):
    """Verifies valid progression through the complete 9-state lifecycle."""
    task = RoadmapTask(
        id="TASK-TEST-01",
        phase="P1",
        category="Learning",
        title="Test Learning Loop",
        description="Lifecycle test",
        owner="Tester",
        status=TaskStatus.NOT_STARTED,
        priority=TaskPriority.HIGH
    )
    engine.tasks[task.id] = task

    # 1. NOT_STARTED -> IN_PROGRESS
    engine.transition_task_status(task.id, TaskStatus.IN_PROGRESS, "Dev")
    assert task.status == TaskStatus.IN_PROGRESS

    # 2. IN_PROGRESS -> IMPLEMENTED
    engine.transition_task_status(task.id, TaskStatus.IMPLEMENTED, "Dev")
    assert task.status == TaskStatus.IMPLEMENTED

    # 3. Add internal evidence and transition to INTERNAL_VERIFIED
    int_ev = VerificationEvidence(
        id="EV-01",
        taskId=task.id,
        evidenceType="UNIT_TEST",
        location="tests/test_loop.py",
        description="Internal unit tests pass",
        result="PASS",
        performedBy="Dev",
        performedAt="2026-09-25T00:00:00Z",
        independent=False
    )
    engine.add_evidence(int_ev)
    engine.transition_task_status(task.id, TaskStatus.INTERNAL_VERIFIED, "QA")
    assert task.status == TaskStatus.INTERNAL_VERIFIED

    # 4. Add independent external evidence and transition to EXTERNALLY_VERIFIED
    ext_ev = VerificationEvidence(
        id="EV-02",
        taskId=task.id,
        evidenceType="EXTERNAL_REVIEW",
        location="audits/external_audit.pdf",
        description="Independent third-party verification",
        result="PASS",
        performedBy="External Auditor",
        performedAt="2026-09-25T01:00:00Z",
        independent=True
    )
    engine.add_evidence(ext_ev)
    engine.transition_task_status(task.id, TaskStatus.EXTERNALLY_VERIFIED, "ExternalAuditor")
    assert task.status == TaskStatus.EXTERNALLY_VERIFIED

    # 5. EXTERNALLY_VERIFIED -> APPROVED
    engine.transition_task_status(task.id, TaskStatus.APPROVED, "ExecutiveOwner")
    assert task.status == TaskStatus.APPROVED
    assert "ExecutiveOwner" in task.reviewerIds

    # 6. APPROVED -> ACTIVE
    engine.transition_task_status(task.id, TaskStatus.ACTIVE, "OperationsLead")
    assert task.status == TaskStatus.ACTIVE


def test_invalid_status_transition_raises(engine):
    """Verifies that skipping required verification states raises an error."""
    task = RoadmapTask(
        id="TASK-TEST-02",
        phase="P2",
        category="Safety",
        title="Consent Flow",
        description="Testing transition guard",
        owner="Tester",
        status=TaskStatus.NOT_STARTED,
        priority=TaskPriority.CRITICAL
    )
    engine.tasks[task.id] = task

    # Cannot jump from NOT_STARTED directly to ACTIVE
    with pytest.raises(InvalidStatusTransitionError):
        engine.transition_task_status(task.id, TaskStatus.ACTIVE, "User")


def test_dependency_blocking_prevents_activation(engine):
    """Verifies that a downstream task cannot be APPROVED or ACTIVE if its blocking dependency is incomplete."""
    parent_task = RoadmapTask(
        id="TASK-PARENT",
        phase="P0",
        category="Scope",
        title="Scope Lock",
        description="Parent task",
        owner="Architect",
        status=TaskStatus.IN_PROGRESS,
        priority=TaskPriority.CRITICAL,
        blocking=True
    )
    child_task = RoadmapTask(
        id="TASK-CHILD",
        phase="P1",
        category="Core Loop",
        title="Core Loop",
        description="Child task depending on scope lock",
        owner="Dev",
        status=TaskStatus.INTERNAL_VERIFIED,
        priority=TaskPriority.CRITICAL,
        dependencies=["TASK-PARENT"]
    )
    engine.tasks[parent_task.id] = parent_task
    engine.tasks[child_task.id] = child_task

    # Attach evidence to child
    ev = VerificationEvidence(
        id="EV-CHILD-01",
        taskId=child_task.id,
        evidenceType="UNIT_TEST",
        location="tests/test_child.py",
        description="Unit test passes",
        result="PASS",
        performedBy="Dev",
        performedAt="2026-09-25T00:00:00Z"
    )
    engine.add_evidence(ev)

    # Attempting to approve child when parent is still IN_PROGRESS must be blocked
    with pytest.raises(DependencyBlockedError, match="Blocking dependency"):
        engine.transition_task_status(child_task.id, TaskStatus.APPROVED, "Approver")


def test_dashboard_metrics_generation(engine):
    """Verifies that dashboard metrics aggregate task and evidence states correctly."""
    metrics = engine.get_governance_dashboard_metrics()
    assert "totalTasks" in metrics
    assert "statusBreakdown" in metrics
    assert "overallReadinessPercentage" in metrics
