import json
from pathlib import Path

from phase0.scripts.validate_compliance import PASS_STATES


BASE = Path(__file__).resolve().parents[1]


def load():
    with (BASE / "compliance-checklist.json").open("r", encoding="utf-8") as f:
        return json.load(f)


def test_compliance_contains_controls():
    data = load()

    assert len(data["controls"]) > 0


def test_every_control_has_id():
    data = load()

    for control in data["controls"]:
        assert control["id"]


def test_every_control_has_requirement():
    data = load()

    for control in data["controls"]:
        assert control["requirement"]


def test_unreviewed_controls_do_not_pass():
    data = load()

    for control in data["controls"]:
        if control["status"] not in PASS_STATES:
            assert control["status"] != "approved"
