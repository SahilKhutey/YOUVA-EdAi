import copy
import json
import subprocess
import sys
from pathlib import Path

import jsonschema
import pytest

BASE = Path(__file__).resolve().parents[1]


def test_schema_validates_complete_scope():
    schema_file = BASE / "scope-lock.schema.json"
    scope_file = BASE / "scope-lock.json"

    with schema_file.open("r", encoding="utf-8") as f:
        schema = json.load(f)
    with scope_file.open("r", encoding="utf-8") as f:
        scope = json.load(f)

    # The locked, fully populated scope lock document must pass schema validation
    jsonschema.validate(instance=scope, schema=schema)


def test_schema_rejects_draft_with_empty_units():
    schema_file = BASE / "scope-lock.schema.json"
    scope_file = BASE / "scope-lock.json"

    with schema_file.open("r", encoding="utf-8") as f:
        schema = json.load(f)
    with scope_file.open("r", encoding="utf-8") as f:
        scope = json.load(f)

    # Draft scope with empty units must fail schema validation
    draft_scope = copy.deepcopy(scope)
    draft_scope["mvpSubject"]["units"] = []
    with pytest.raises(jsonschema.ValidationError):
        jsonschema.validate(instance=draft_scope, schema=schema)


def test_locked_phase0_passes_phase1_gate():
    gate_script = BASE / "scripts" / "validate_phase1_gate.py"
    result = subprocess.run(
        [sys.executable, str(gate_script)],
        capture_output=True,
        text=True
    )
    assert result.returncode == 0, f"Gate output:\n{result.stdout}\n{result.stderr}"
    assert "PHASE 0 COMPLETE" in result.stdout
    assert "PHASE 1 MAY BEGIN" in result.stdout
