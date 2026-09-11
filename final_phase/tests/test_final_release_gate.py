import subprocess
import sys
from pathlib import Path

GATE_SCRIPT = Path(__file__).resolve().parents[1] / "scripts" / "validate_release_gate.py"


def test_final_release_gate_passes_cleanly():
    """Executing validate_release_gate.py on current verified state must return exit code 0."""
    result = subprocess.run(
        [sys.executable, str(GATE_SCRIPT)],
        capture_output=True,
        text=True
    )
    assert result.returncode == 0, f"Release gate failed:\n{result.stdout}\n{result.stderr}"
    assert "DECISION: >>> GO <<<" in result.stdout
