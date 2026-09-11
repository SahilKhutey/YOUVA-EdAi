"""
End-to-End Integration Tests for Phase 3:
Executes validate_phase3_gate.py and run_pilot_simulation.py as subprocesses.
"""

from pathlib import Path
import subprocess
import sys


def test_phase3_exit_gate_passes_cleanly():
    """Runs validate_phase3_gate.py and ensures exit code 0."""
    gate_script = Path(__file__).resolve().parents[1] / "scripts" / "validate_phase3_gate.py"
    res = subprocess.run([sys.executable, str(gate_script)], capture_output=True, text=True)
    assert res.returncode == 0, f"Exit gate failed: {res.stderr}\n{res.stdout}"
    assert "PHASE 3 COMPLETE — CLASSROOM PILOT VALIDATED" in res.stdout


def test_phase3_pilot_simulation_runs():
    """Runs run_pilot_simulation.py and ensures exit code 0."""
    sim_script = Path(__file__).resolve().parents[1] / "scripts" / "run_pilot_simulation.py"
    res = subprocess.run([sys.executable, str(sim_script)], capture_output=True, text=True)
    assert res.returncode == 0, f"Simulation failed: {res.stderr}\n{res.stdout}"
    assert "PHASE 3 PILOT SIMULATION COMPLETED SUCCESSFULLY (GO TO PHASE 4)" in res.stdout
