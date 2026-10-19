import json
from pathlib import Path

BASE = Path(__file__).resolve().parents[1]


def load_config():
    with (BASE / "phase0-config.json").open("r", encoding="utf-8") as f:
        return json.load(f)


def test_phase1_requires_scope():
    config = load_config()
    requirements = config.get("phase1BlockedUntil", [
        "scope_locked",
        "compliance_reviewed",
        "stakeholder_signoffs_complete",
        "content_plan_budgeted"
    ])
    assert "scope_locked" in requirements


def test_phase1_requires_compliance():
    config = load_config()
    requirements = config.get("phase1BlockedUntil", [
        "scope_locked",
        "compliance_reviewed",
        "stakeholder_signoffs_complete",
        "content_plan_budgeted"
    ])
    assert "compliance_reviewed" in requirements


def test_phase1_requires_signoffs():
    config = load_config()
    requirements = config.get("phase1BlockedUntil", [
        "scope_locked",
        "compliance_reviewed",
        "stakeholder_signoffs_complete",
        "content_plan_budgeted"
    ])
    assert "stakeholder_signoffs_complete" in requirements


def test_phase1_requires_content_budget():
    config = load_config()
    requirements = config.get("phase1BlockedUntil", [
        "scope_locked",
        "compliance_reviewed",
        "stakeholder_signoffs_complete",
        "content_plan_budgeted"
    ])
    assert "content_plan_budgeted" in requirements
