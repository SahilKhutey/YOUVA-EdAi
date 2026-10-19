"""
YOUVA-EdAI — Phase 7: Scale Safety Operations & SLA Escalation (P7.5)
Enforces:
1. Human Safeguarding Invariant: AI can triage, but only a human officer can acknowledge or close incidents.
2. SLA Monitoring: Automatic escalation and secondary paging if incidents remain unacknowledged.
3. High-Availability Uptime & Circuit Breaker: Uptime tracking against 99.9% target with fail-closed breakers.
"""

from datetime import datetime, timezone
from enum import Enum
import hashlib
import json
from typing import Any, Dict, List, Optional


class IncidentSeverity(str, Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    CRITICAL = "CRITICAL"


class IncidentStatus(str, Enum):
    OPEN = "OPEN"
    ACKNOWLEDGED = "ACKNOWLEDGED"
    IN_PROGRESS = "IN_PROGRESS"
    RESOLVED = "RESOLVED"
    ESCALATED = "ESCALATED"


# SLA acknowledgment time limits in seconds
SLA_LIMITS_SECONDS = {
    IncidentSeverity.CRITICAL.value: 300,    # 5 minutes
    IncidentSeverity.HIGH.value: 900,        # 15 minutes
    IncidentSeverity.MEDIUM.value: 3600,     # 60 minutes
    IncidentSeverity.LOW.value: 14400        # 4 hours
}


class HumanSafeguardingRequiredError(PermissionError):
    """Raised when an automated system or non-human actor attempts to close or acknowledge safety incidents."""
    pass


class SafetyIncident:
    """Represents a student safeguarding alert in the operations queue."""

    def __init__(
        self,
        incident_id: str,
        tenant_id: str,
        severity: IncidentSeverity,
        category: str,
        details: Dict[str, Any],
        created_at: Optional[str] = None
    ):
        self.incident_id = incident_id
        self.tenant_id = tenant_id
        self.severity = severity.value if isinstance(severity, IncidentSeverity) else severity
        self.category = category
        self.details = dict(details)
        self.created_at = created_at or datetime.now(timezone.utc).isoformat()
        self.status = IncidentStatus.OPEN.value
        self.acknowledged_by_human_id: Optional[str] = None
        self.acknowledged_at: Optional[str] = None
        self.resolved_by_human_id: Optional[str] = None
        self.resolved_at: Optional[str] = None
        self.resolution_notes: Optional[str] = None
        self.escalation_count = 0
        self.secondary_paging_triggered = False

    def to_dict(self) -> Dict[str, Any]:
        return {
            "incidentId": self.incident_id,
            "tenantId": self.tenant_id,
            "severity": self.severity,
            "category": self.category,
            "details": self.details,
            "createdAt": self.created_at,
            "status": self.status,
            "acknowledgedByHumanId": self.acknowledged_by_human_id,
            "acknowledgedAt": self.acknowledged_at,
            "resolvedByHumanId": self.resolved_by_human_id,
            "resolvedAt": self.resolved_at,
            "resolutionNotes": self.resolution_notes,
            "escalationCount": self.escalation_count,
            "secondaryPagingTriggered": self.secondary_paging_triggered
        }


class SafetyOperationsManager:
    """
    Manages institutional child-safety incident queues and SLA escalation.
    Enforces that AI never closes or acknowledges safety incidents alone.
    """

    AUTHORIZED_HUMAN_ROLES = {
        "SAFEGUARDING_OFFICER",
        "LEAD_COUNSELOR",
        "PRINCIPAL",
        "DESIGNATED_SAFEGUARDING_LEAD",
        "ADMIN"
    }

    def __init__(self, tenant_id: str):
        self.tenant_id = tenant_id
        # incident_id -> SafetyIncident
        self._incidents: Dict[str, SafetyIncident] = {}
        # Circuit breaker state
        self.circuit_state = "CLOSED"  # CLOSED, OPEN, HALF_OPEN
        self.failure_counter = 0

    def file_incident(
        self,
        incident_id: str,
        severity: IncidentSeverity,
        category: str,
        details: Dict[str, Any],
        created_at: Optional[str] = None
    ) -> SafetyIncident:
        """Files a new safety alert into the queue."""
        incident = SafetyIncident(
            incident_id=incident_id,
            tenant_id=self.tenant_id,
            severity=severity,
            category=category,
            details=details,
            created_at=created_at
        )
        self._incidents[incident_id] = incident
        return incident

    def acknowledge_incident(
        self,
        incident_id: str,
        human_id: str,
        role: str
    ) -> SafetyIncident:
        """
        Acknowledges an incident. Fails closed if human role is not an authorized human officer.
        """
        inc = self._incidents.get(incident_id)
        if not inc:
            raise KeyError(f"Incident [{incident_id}] not found")

        if role.upper() not in self.AUTHORIZED_HUMAN_ROLES:
            raise HumanSafeguardingRequiredError(
                f"Role [{role}] is not authorized to acknowledge safeguarding incidents. "
                f"Required human roles: {list(self.AUTHORIZED_HUMAN_ROLES)}"
            )

        if not human_id or human_id.startswith("ai_") or human_id == "SYSTEM":
            raise HumanSafeguardingRequiredError(
                "AI/Automated agents are strictly prohibited from acknowledging safety incidents alone"
            )

        inc.status = IncidentStatus.ACKNOWLEDGED.value
        inc.acknowledged_by_human_id = human_id
        inc.acknowledged_at = datetime.now(timezone.utc).isoformat()
        return inc

    def resolve_incident(
        self,
        incident_id: str,
        human_id: str,
        role: str,
        resolution_notes: str
    ) -> SafetyIncident:
        """
        Resolves and closes an incident with mandatory human sign-off and clinical notes.
        """
        inc = self._incidents.get(incident_id)
        if not inc:
            raise KeyError(f"Incident [{incident_id}] not found")

        if role.upper() not in self.AUTHORIZED_HUMAN_ROLES:
            raise HumanSafeguardingRequiredError(
                f"Role [{role}] is not authorized to resolve safeguarding incidents"
            )

        if not human_id or human_id.startswith("ai_") or human_id == "SYSTEM":
            raise HumanSafeguardingRequiredError(
                "AI/Automated agents cannot resolve child safety incidents"
            )

        if not resolution_notes or len(resolution_notes.strip()) < 10:
            raise ValueError("Substantive human clinical notes are required to resolve a safety incident")

        inc.status = IncidentStatus.RESOLVED.value
        inc.resolved_by_human_id = human_id
        inc.resolved_at = datetime.now(timezone.utc).isoformat()
        inc.resolution_notes = resolution_notes.strip()
        return inc

    def check_sla_breaches(self, now: Optional[datetime] = None) -> List[SafetyIncident]:
        """
        Scans open incidents. If an incident has breached its acknowledgment SLA,
        triggers automated secondary paging and escalates state.
        """
        current_dt = now or datetime.now(timezone.utc)
        breached: List[SafetyIncident] = []

        for inc in self._incidents.values():
            if inc.status in (IncidentStatus.OPEN.value, IncidentStatus.ESCALATED.value):
                created_dt = datetime.fromisoformat(inc.created_at.replace("Z", "+00:00"))
                elapsed_seconds = (current_dt - created_dt).total_seconds()
                sla_limit = SLA_LIMITS_SECONDS.get(inc.severity, 3600)

                if elapsed_seconds > sla_limit:
                    inc.status = IncidentStatus.ESCALATED.value
                    inc.escalation_count += 1
                    inc.secondary_paging_triggered = True
                    breached.append(inc)

        return breached

    def record_service_health(self, is_healthy: bool) -> str:
        """Maintains circuit breaker for 99.9% uptime monitoring."""
        if is_healthy:
            self.failure_counter = 0
            self.circuit_state = "CLOSED"
        else:
            self.failure_counter += 1
            if self.failure_counter >= 3:
                self.circuit_state = "OPEN"
        return self.circuit_state
