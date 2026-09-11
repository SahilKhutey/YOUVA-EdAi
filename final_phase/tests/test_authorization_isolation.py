import pytest
from final_phase.scripts.validate_human_controls import load_json, CONTROLS_FILE, authorize_action


@pytest.fixture
def controls_config():
    return load_json(CONTROLS_FILE)


def check_resource_access(actor_context: dict, target_resource: dict) -> bool:
    """
    Evaluates multi-tenant and role-based resource access.
    """
    # Tenant boundary
    if actor_context.get("tenantId") != target_resource.get("tenantId"):
        return False

    # School boundary
    if actor_context.get("role") in {"STUDENT", "TEACHER", "SCHOOL_ADMIN"}:
        if actor_context.get("schoolId") != target_resource.get("schoolId"):
            return False

    # Student boundary
    if actor_context.get("role") == "STUDENT":
        if actor_context.get("userId") != target_resource.get("studentId"):
            return False

    return True


def test_fp_v011_student_isolation():
    """FP-V011: A student cannot access another student's learning trace or assessment."""
    student_a = {"tenantId": "tenant_1", "schoolId": "sch_1", "userId": "stu_001", "role": "STUDENT"}
    resource_b = {"tenantId": "tenant_1", "schoolId": "sch_1", "studentId": "stu_002"}
    assert not check_resource_access(student_a, resource_b), "Cross-student access must be blocked"


def test_fp_v012_teacher_isolation():
    """FP-V012: A teacher cannot access classes/students from a different school."""
    teacher = {"tenantId": "tenant_1", "schoolId": "sch_1", "userId": "tch_001", "role": "TEACHER"}
    resource_other_school = {"tenantId": "tenant_1", "schoolId": "sch_2", "studentId": "stu_999"}
    assert not check_resource_access(teacher, resource_other_school), "Cross-school teacher access must be blocked"


def test_fp_v013_school_isolation():
    """FP-V013: School admin cannot access resources of another school within same district."""
    admin_school_1 = {"tenantId": "tenant_1", "schoolId": "sch_1", "userId": "adm_001", "role": "SCHOOL_ADMIN"}
    resource_school_2 = {"tenantId": "tenant_1", "schoolId": "sch_2", "studentId": "stu_888"}
    assert not check_resource_access(admin_school_1, resource_school_2), "Cross-school admin access must be blocked"


def test_fp_v014_district_isolation():
    """FP-V014: District admin cannot cross into another tenant district."""
    district_a = {"tenantId": "district_delhi", "userId": "dist_001", "role": "DISTRICT_ADMIN"}
    resource_b = {"tenantId": "district_mumbai", "schoolId": "sch_mum_1", "studentId": "stu_777"}
    assert not check_resource_access(district_a, resource_b), "Cross-district access must be blocked"


def test_fp_v015_role_escalation_blocked(controls_config):
    """FP-V015: An unprivileged user (student) attempting role escalation is blocked."""
    escalation_attempt = authorize_action(
        control_id="ROLE_CHANGE",
        actor_role="STUDENT",
        signature="malicious-token-123456",
        is_automated_ai=False,
        config=controls_config
    )
    assert not escalation_attempt, "Privilege elevation by student must fail closed"
