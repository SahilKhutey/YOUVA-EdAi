"""
YOUVA-EdAI — Final Phase: Continuous Operating Rhythm & Organizational Ownership Engine
Enforces:
- Steady-state operating rhythm (real-time, bi-weekly, quarterly, annual, event-triggered).
- Explicit non-founder organizational ownership for all governance functions (zero founder default).
- Overdue review cadence detection and escalation path tracking.
"""

from dataclasses import dataclass
from datetime import datetime, date, timedelta
import json
from pathlib import Path
from typing import Any, Dict, List, Optional


class OperatingRhythmError(Exception):
    """Base error for operating rhythm violations."""
    pass


class OperatingCadenceOverdueError(OperatingRhythmError):
    """Raised when an operating cadence review has exceeded its maximum interval."""
    pass


class FounderDefaultViolationError(OperatingRhythmError):
    """Raised when a critical governance function defaults to a founder role."""
    pass


@dataclass
class CadenceStatus:
    cadence_id: str
    cadence_name: str
    frequency_type: str
    owner: str
    is_active: bool


class OperatingRhythmScheduler:
    """Production runtime engine for managing operating rhythm and ownership assignments."""

    CADENCE_MAX_DAYS = {
        "OP_BIWEEKLY": 14,
        "OP_QUARTERLY": 90,
        "OP_ANNUAL_SECURITY": 365,
        "OP_ANNUAL_SAFETY": 365,
    }

    def __init__(self, reviews_dir: Optional[Path] = None):
        if reviews_dir is None:
            reviews_dir = Path(__file__).resolve().parents[1] / "reviews"
        self.reviews_dir = reviews_dir
        self.rhythm_file = self.reviews_dir / "operating_rhythm.json"
        self.ownership_file = self.reviews_dir / "organizational_ownership.json"

        self.rhythm_data = self._load_json(self.rhythm_file)
        self.ownership_data = self._load_json(self.ownership_file)

        self.schedules = {s["cadenceId"]: s for s in self.rhythm_data.get("schedules", [])}
        self.ownership = {o["functionId"]: o for o in self.ownership_data.get("ownershipAssignments", [])}

    def _load_json(self, path: Path) -> dict:
        if not path.exists():
            raise FileNotFoundError(f"Review config file not found: {path}")
        with path.open("r", encoding="utf-8") as f:
            return json.load(f)

    def verify_no_founder_defaults(self) -> None:
        """
        Enforces that zero governance functions default to founder.
        Every function must have a distinct assigned role and delegate role.
        """
        for fid, assignment in self.ownership.items():
            if assignment.get("isFounderDefault", False):
                raise FounderDefaultViolationError(
                    f"Governance ownership violation: Function '{fid}' ({assignment.get('functionName')}) "
                    f"is marked as founder default."
                )
            if not assignment.get("assignedRole") or not assignment.get("delegateRole"):
                raise FounderDefaultViolationError(
                    f"Governance ownership incomplete: Function '{fid}' missing assignedRole or delegateRole."
                )

    def get_cadence_statuses(self) -> List[CadenceStatus]:
        """Returns the current operational status of all cadences."""
        result = []
        for cid, sched in self.schedules.items():
            result.append(
                CadenceStatus(
                    cadence_id=cid,
                    cadence_name=sched.get("activity", cid),
                    frequency_type=sched.get("frequencyType", "UNKNOWN"),
                    owner=sched.get("owner", "UNASSIGNED"),
                    is_active=sched.get("status") == "ACTIVE",
                )
            )
        return result

    def audit_cadence_timeliness(
        self,
        last_executed_dates: Dict[str, date],
        reference_date: Optional[date] = None,
    ) -> List[str]:
        """
        Audits cadence timeliness against specified last execution dates.
        Returns a list of overdue cadence descriptions.
        """
        if reference_date is None:
            reference_date = date.today()

        overdue = []
        for cid, max_days in self.CADENCE_MAX_DAYS.items():
            last_date = last_executed_dates.get(cid)
            if last_date:
                days_elapsed = (reference_date - last_date).days
                if days_elapsed > max_days:
                    overdue.append(
                        f"Cadence '{cid}' ({self.schedules.get(cid, {}).get('cadence')}) is overdue: "
                        f"{days_elapsed} days elapsed since last run (max allowed: {max_days} days)"
                    )
        return overdue
