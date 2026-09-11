import subprocess
import sys
from pathlib import Path

GATE_SCRIPT = Path(__file__).resolve().parents[1] / "scripts" / "validate_phase9_gate.py"


def test_phase9_gate_e2e_passes():
    """Executing validate_phase9_gate.py must return exit code 0."""
    result = subprocess.run(
        [sys.executable, str(GATE_SCRIPT)],
        capture_output=True,
        text=True
    )
    assert result.returncode == 0, f"Gate failed:\n{result.stdout}\n{result.stderr}"
    assert "STATUS: PHASE 9 COMPLETE" in result.stdout
