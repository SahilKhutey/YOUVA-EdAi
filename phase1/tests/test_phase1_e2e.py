import subprocess
import sys
from pathlib import Path

GATE_SCRIPT = Path(__file__).resolve().parents[1] / "scripts" / "validate_phase1_gate.py"
LOOP_SCRIPT = Path(__file__).resolve().parents[1] / "scripts" / "run_learning_loop.py"


def test_phase1_gate_passes_cleanly():
    """Executing validate_phase1_gate.py must return exit code 0."""
    result = subprocess.run(
        [sys.executable, str(GATE_SCRIPT)],
        capture_output=True,
        text=True
    )
    assert result.returncode == 0, f"Phase 1 Gate failed:\n{result.stdout}\n{result.stderr}"
    assert "STATUS: PHASE 1 COMPLETE" in result.stdout


def test_phase1_learning_loop_simulation_runs():
    """Executing run_learning_loop.py must complete with success."""
    result = subprocess.run(
        [sys.executable, str(LOOP_SCRIPT)],
        capture_output=True,
        text=True
    )
    assert result.returncode == 0, f"Learning loop failed:\n{result.stdout}\n{result.stderr}"
    assert "SUCCESS: Full Phase 1 Core Learning Loop Executed Validly" in result.stdout
