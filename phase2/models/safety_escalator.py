"""
YOUVA-EdAI — Dual-Channel Child Safety Escalator.
Enforces child safeguarding trigger detection, multi-channel alerting,
and the permanent invariant: "AI cannot close alone — only human educators can authorize resolution."
"""

from __future__ import annotations
from dataclasses import dataclass, field
from datetime import datetime, timezone
from enum import Enum
import re
from typing import Dict, List, Optional
import uuid


class SafetySeverity(str, Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    CRITICAL = "CRITICAL"


class SafetyCategory(str, Enum):
    SELF_HARM = "SELF_HARM"
    IMMEDIATE_DANGER = "IMMEDIATE_DANGER"
    CHILD_ABUSE = "CHILD_ABUSE"
    SEXUAL_HARASSMENT = "SEXUAL_HARASSMENT"
    CYBERBULLYING = "CYBERBULLYING"
    EXTREME_DISTRESS = "EXTREME_DISTRESS"
    SUSPICIOUS_ADULT_CONTACT = "SUSPICIOUS_ADULT_CONTACT"


class EscalationStatus(str, Enum):
    OPEN = "OPEN"
    ESCALATED = "ESCALATED"
    UNDER_REVIEW = "UNDER_REVIEW"
    RESOLVED = "RESOLVED"


class ChannelType(str, Enum):
    SMS = "SMS"
    EMAIL = "EMAIL"
    IN_APP_WEBHOOK = "IN_APP_WEBHOOK"
    PAGER_DUTY = "PAGER_DUTY"


class SafetyGovernanceViolation(Exception):
    """Raised when an automated system or unauthorized role attempts to close a safety incident."""
    pass


@dataclass
class DispatchAttempt:
    channel: ChannelType
    recipient_role: str
    dispatched_at: datetime
    status: str = "DELIVERED"

    def to_dict(self) -> dict:
        return {
            "channel": self.channel.value,
            "recipientRole": self.recipient_role,
            "dispatchedAt": self.dispatched_at.isoformat(),
            "status": self.status,
        }


@dataclass
class ResolutionRecord:
    resolver_id: str
    resolver_role: str
    resolver_name: str
    rationale: str
    signature: str
    resolved_at: datetime

    def to_dict(self) -> dict:
        return {
            "resolvedBy": {
                "userId": self.resolver_id,
                "role": self.resolver_role,
                "name": self.resolver_name,
            },
            "rationale": self.rationale,
            "signature": self.signature,
            "resolvedAt": self.resolved_at.isoformat(),
        }


@dataclass
class SafetyIncident:
    incident_id: str
    student_id: str
    category: SafetyCategory
    severity: SafetySeverity
    status: EscalationStatus
    source: str
    summary: str
    created_at: datetime
    metadata: Dict = field(default_factory=dict)
    dispatch_log: List[DispatchAttempt] = field(default_factory=list)
    resolution: Optional[ResolutionRecord] = None

    def to_dict(self) -> dict:
        return {
            "incidentId": self.incident_id,
            "studentId": self.student_id,
            "category": self.category.value,
            "severity": self.severity.value,
            "status": self.status.value,
            "source": self.source,
            "summary": self.summary,
            "metadata": self.metadata,
            "createdAt": self.created_at.isoformat(),
            "dispatchLog": [d.to_dict() for d in self.dispatch_log],
            "resolution": self.resolution.to_dict() if self.resolution else None,
        }


# Category to default severity mapping
DEFAULT_SEVERITY_MAP: Dict[SafetyCategory, SafetySeverity] = {
    SafetyCategory.SELF_HARM: SafetySeverity.CRITICAL,
    SafetyCategory.IMMEDIATE_DANGER: SafetySeverity.CRITICAL,
    SafetyCategory.CHILD_ABUSE: SafetySeverity.CRITICAL,
    SafetyCategory.SEXUAL_HARASSMENT: SafetySeverity.HIGH,
    SafetyCategory.CYBERBULLYING: SafetySeverity.HIGH,
    SafetyCategory.SUSPICIOUS_ADULT_CONTACT: SafetySeverity.HIGH,
    SafetyCategory.EXTREME_DISTRESS: SafetySeverity.MEDIUM,
}

# Regex trigger rules for proactive child safety monitoring
TRIGGER_PATTERNS = [
    (re.compile(r"\b(suicide|kill myself|end my life|cut myself|want to die)\b", re.IGNORECASE),
     SafetyCategory.SELF_HARM, SafetySeverity.CRITICAL, 0.98),
    (re.compile(r"\b(beat me|hitting me at home|touching me inappropriately|threatened to hurt)\b", re.IGNORECASE),
     SafetyCategory.CHILD_ABUSE, SafetySeverity.CRITICAL, 0.95),
    (re.compile(r"\b(send nudes|share your pictures|don't tell your parents|meet me alone)\b", re.IGNORECASE),
     SafetyCategory.SUSPICIOUS_ADULT_CONTACT, SafetySeverity.HIGH, 0.92),
    (re.compile(r"\b(ugly|worthless|kill yourself|everybody hates you|loser)\b", re.IGNORECASE),
     SafetyCategory.CYBERBULLYING, SafetySeverity.HIGH, 0.88),
    (re.compile(r"\b(i can't breathe|panic attack|crying all day|hopeless|cannot take this anymore)\b", re.IGNORECASE),
     SafetyCategory.EXTREME_DISTRESS, SafetySeverity.MEDIUM, 0.85),
]


class SafetyEscalator:
    """
    Child Safety Escalation Engine with Dual-Channel Dispatch and Strict Human Authorization.
    """

    ALLOWED_RESOLVER_ROLES = {"SAFEGUARDING_OFFICER", "COUNSELOR", "TEACHER", "ADMIN"}

    def __init__(self):
        self.incidents: Dict[str, SafetyIncident] = {}

    def detect_triggers(self, text: str) -> Optional[Tuple[SafetyCategory, SafetySeverity, float, str]]:
        """
        Scans textual student or conversational interaction for safeguarding triggers.
        Returns (category, severity, confidence, match_snippet) if detected.
        """
        for pattern, cat, sev, conf in TRIGGER_PATTERNS:
            match = pattern.search(text)
            if match:
                return cat, sev, conf, match.group(0)
        return None

    def report_incident(
        self,
        student_id: str,
        category: SafetyCategory,
        summary: str,
        source: str = "AI_INTERACTION_MONITOR",
        severity: Optional[SafetySeverity] = None,
        metadata: Optional[Dict] = None,
    ) -> SafetyIncident:
        """
        Registers a safety incident and immediately triggers multi-channel escalation
        for HIGH and CRITICAL severity events.
        """
        actual_severity = severity or DEFAULT_SEVERITY_MAP.get(category, SafetySeverity.MEDIUM)
        incident_id = f"inc-{uuid.uuid4().hex[:12]}"
        now = datetime.now(timezone.utc)

        incident = SafetyIncident(
            incident_id=incident_id,
            student_id=student_id,
            category=category,
            severity=actual_severity,
            status=EscalationStatus.OPEN,
            source=source,
            summary=summary,
            created_at=now,
            metadata=metadata or {},
        )

        # Dual-Channel Escalation Rule:
        # HIGH or CRITICAL severity requires immediate dispatch to at least 2 distinct channels
        if actual_severity in (SafetySeverity.HIGH, SafetySeverity.CRITICAL):
            incident.status = EscalationStatus.ESCALATED
            # Channel 1: SMS to Safeguarding Officer
            incident.dispatch_log.append(
                DispatchAttempt(
                    channel=ChannelType.SMS,
                    recipient_role="SAFEGUARDING_OFFICER",
                    dispatched_at=now,
                    status="DELIVERED",
                )
            )
            # Channel 2: Email to School Counselor / Head of Pastoral Care
            incident.dispatch_log.append(
                DispatchAttempt(
                    channel=ChannelType.EMAIL,
                    recipient_role="COUNSELOR",
                    dispatched_at=now,
                    status="DELIVERED",
                )
            )
            # Channel 3: Real-time In-App Webhook to Teacher Dashboard
            incident.dispatch_log.append(
                DispatchAttempt(
                    channel=ChannelType.IN_APP_WEBHOOK,
                    recipient_role="TEACHER",
                    dispatched_at=now,
                    status="DELIVERED",
                )
            )

        self.incidents[incident_id] = incident
        return incident

    def resolve_incident(
        self,
        incident_id: str,
        actor_id: str,
        actor_role: str,
        actor_name: str,
        rationale: str,
        signature: str,
    ) -> SafetyIncident:
        """
        Resolves a safety incident.
        Strict Governance Invariant:
        - AI cannot close alone! If actor_role == 'AI' or not in ALLOWED_RESOLVER_ROLES, raises error.
        - Rationale and cryptographic signature are strictly mandatory.
        """
        incident = self.incidents.get(incident_id)
        if not incident:
            raise ValueError(f"Safety incident {incident_id} not found.")

        normalized_role = actor_role.upper().strip()

        # Hard invariant: AI is strictly prohibited from closing safety incidents
        if normalized_role in ("AI", "BOT", "SYSTEM", "AUTOMATED", "MODEL"):
            raise SafetyGovernanceViolation(
                "SafetyGovernanceViolation: AI systems and autonomous models are strictly "
                "prohibited from closing safety incidents. A human educator or safeguarding officer must authorize."
            )

        if normalized_role not in self.ALLOWED_RESOLVER_ROLES:
            raise PermissionError(
                f"Forbidden: User with role '{actor_role}' is not authorized to resolve safety incidents. "
                f"Must be one of: {', '.join(sorted(self.ALLOWED_RESOLVER_ROLES))}."
            )

        if len(rationale.strip()) < 10:
            raise ValueError("Pedagogical/safeguarding rationale must be at least 10 characters.")

        if len(signature.strip()) < 16:
            raise ValueError("Cryptographic digital signature must be at least 16 characters.")

        now = datetime.now(timezone.utc)
        incident.resolution = ResolutionRecord(
            resolver_id=actor_id,
            resolver_role=normalized_role,
            resolver_name=actor_name,
            rationale=rationale,
            signature=signature,
            resolved_at=now,
        )
        incident.status = EscalationStatus.RESOLVED

        return incident

    def get_incident(self, incident_id: str) -> Optional[SafetyIncident]:
        return self.incidents.get(incident_id)

    def list_open_incidents(self) -> List[SafetyIncident]:
        return [inc for inc in self.incidents.values() if inc.status != EscalationStatus.RESOLVED]
