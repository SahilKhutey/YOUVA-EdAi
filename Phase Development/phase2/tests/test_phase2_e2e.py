"""
End-to-End Integration Tests for Phase 2:
Executes validate_phase2_gate.py and run_safety_audit.py as subprocesses.
"""

from pathlib import Path
import subprocess
import sys


def test_phase2_exit_gate_passes_cleanly():
    """Runs validate_phase2_gate.py and ensures exit code 0."""
    gate_script = Path(__file__).resolve().parents[1] / "scripts" / "validate_phase2_gate.py"
    res = subprocess.run([sys.executable, str(gate_script)], capture_output=True, text=True)
    assert res.returncode == 0, f"Exit gate failed: {res.stderr}\n{res.stdout}"
    assert "PHASE 2 COMPLETE — SAFETY & TRUST HARDENING VERIFIED" in res.stdout


def test_phase2_safety_audit_simulation_runs():
    """Runs run_safety_audit.py simulation and ensures exit code 0."""
    sim_script = Path(__file__).resolve().parents[1] / "scripts" / "run_safety_audit.py"
    res = subprocess.run([sys.executable, str(sim_script)], capture_output=True, text=True)
    assert res.returncode == 0, f"Simulation failed: {res.stderr}\n{res.stdout}"
    assert "ALL PHASE 2 SAFETY & TRUST CHECKS PASSED CLEANLY" in res.stdout
