import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import {
  CivilizationKillSwitch,
  CivilizationKillSwitchSubsystem,
  IncidentLifecycleStage,
  IncidentRecord,
} from './n-infinity-types';
import * as crypto from 'crypto';

export const PROHIBITED_AI_ACTIONS = [
  'HUMAN_POTENTIAL_RANKING',
  'HUMAN_WORTH_EVALUATION',
  'CONSEQUENTIAL_EMPLOYMENT_DECISION',
  'MASTERY_OVERRIDE',
  'UNCONSENTED_SURVEILLANCE_PROFILING',
  'AUTONOMOUS_CREDENTIAL_REVOCATION_WITHOUT_HUMAN_REVIEW',
  'IRREVERSIBLE_LIFE_DECISION',
] as const;

export type ProhibitedAIAction = (typeof PROHIBITED_AI_ACTIONS)[number];

export const ALL_KILL_SWITCH_SUBSYSTEMS: CivilizationKillSwitchSubsystem[] = [
  'AI_AUTONOMY',
  'SAFETY_SENSITIVE',
  'CREDENTIAL_ISSUANCE',
  'OPPORTUNITY_EXCHANGE',
  'MENTOR_NETWORK',
  'EXTERNAL_INTEGRATIONS',
  'COMMUNITY_FEATURES',
  'RESEARCH_ACCESS',
  'ECOSYSTEM_ANALYTICS',
  'GLOBAL_EMERGENCY',
];

export const INCIDENT_LIFECYCLE_SEQUENCE: IncidentLifecycleStage[] = [
  'DECLARED',
  'TRIAGED',
  'CONTAINED',
  'MITIGATED',
  'RECOVERED',
  'VERIFIED',
  'CLOSED',
  'POSTMORTEM',
  'SYSTEMIC_IMPROVEMENT',
];

@Injectable()
export class GovernanceKillswitchIncidentService {
  private readonly killSwitches = new Map<CivilizationKillSwitchSubsystem, CivilizationKillSwitch>();
  private readonly incidents = new Map<string, IncidentRecord>();
  private readonly aiActionAuditLog: Array<{
    actionType: string;
    allowed: boolean;
    reason?: string;
    timestamp: string;
  }> = [];

  constructor() {
    // Initialize all kill switches to non-tripped (operational) state
    for (const subsystem of ALL_KILL_SWITCH_SUBSYSTEMS) {
      this.killSwitches.set(subsystem, {
        subsystem,
        isTripped: false,
      });
    }
  }

  // ==========================================
  // 1. FINAL AI AUTHORITY MATRIX ENFORCER
  // Clause N∞.10: AI Capability != AI Authority
  // ==========================================

  validateAIAction(
    actionType: string,
    payload?: any,
  ): { allowed: boolean; violation?: string } {
    if (!actionType || !actionType.trim()) {
      throw new BadRequestException('Action type is required for AI governance validation');
    }

    const normalizedAction = actionType.trim().toUpperCase();
    const isProhibited = PROHIBITED_AI_ACTIONS.includes(
      normalizedAction as ProhibitedAIAction,
    );

    const now = new Date().toISOString();

    if (isProhibited) {
      const violation = `Constitutional Violation: AI action '${normalizedAction}' is permanently prohibited under YOUVA-N-INFINITY-CONSTITUTION-2026 Clause N∞.10 (AI Authority Matrix). Human judgment required.`;
      this.aiActionAuditLog.push({
        actionType: normalizedAction,
        allowed: false,
        reason: violation,
        timestamp: now,
      });
      throw new ForbiddenException(violation);
    }

    this.aiActionAuditLog.push({
      actionType: normalizedAction,
      allowed: true,
      timestamp: now,
    });

    return {
      allowed: true,
    };
  }

  getAIAuditLog(): Array<{
    actionType: string;
    allowed: boolean;
    reason?: string;
    timestamp: string;
  }> {
    return [...this.aiActionAuditLog];
  }

  // ==========================================
  // 2. 9-SUBSYSTEM KILL SWITCH MATRIX
  // Clause N∞.39: Civilization Operational Resiliency
  // ==========================================

  getKillSwitchStatus(subsystem: CivilizationKillSwitchSubsystem): CivilizationKillSwitch {
    const sw = this.killSwitches.get(subsystem);
    if (!sw) {
      throw new NotFoundException(`Kill switch for subsystem ${subsystem} not found`);
    }
    return sw;
  }

  getAllKillSwitches(): CivilizationKillSwitch[] {
    return Array.from(this.killSwitches.values());
  }

  tripKillSwitch(
    subsystem: CivilizationKillSwitchSubsystem,
    trippedBy: string,
    reason: string,
  ): CivilizationKillSwitch {
    if (!ALL_KILL_SWITCH_SUBSYSTEMS.includes(subsystem)) {
      throw new BadRequestException(`Invalid kill switch subsystem: ${subsystem}`);
    }
    if (!trippedBy || !trippedBy.trim()) {
      throw new BadRequestException('trippedBy actor is required');
    }
    if (!reason || !reason.trim()) {
      throw new BadRequestException('Reason for tripping kill switch is required');
    }

    const sw: CivilizationKillSwitch = {
      subsystem,
      isTripped: true,
      trippedBy: trippedBy.trim(),
      reason: reason.trim(),
      trippedAt: new Date().toISOString(),
    };

    this.killSwitches.set(subsystem, sw);
    return sw;
  }

  resetKillSwitch(
    subsystem: CivilizationKillSwitchSubsystem,
    resetBy: string,
    authorizationToken: string,
  ): CivilizationKillSwitch {
    if (!ALL_KILL_SWITCH_SUBSYSTEMS.includes(subsystem)) {
      throw new BadRequestException(`Invalid kill switch subsystem: ${subsystem}`);
    }
    if (!resetBy || !resetBy.trim()) {
      throw new BadRequestException('resetBy actor is required');
    }
    if (!authorizationToken || authorizationToken.trim().length < 8) {
      throw new ForbiddenException('Valid human governance authorization token (min 8 chars) required to reset kill switch');
    }

    const sw: CivilizationKillSwitch = {
      subsystem,
      isTripped: false,
    };

    this.killSwitches.set(subsystem, sw);
    return sw;
  }

  tripGlobalEmergency(trippedBy: string, reason: string): CivilizationKillSwitch[] {
    if (!trippedBy || !trippedBy.trim() || !reason || !reason.trim()) {
      throw new BadRequestException('trippedBy and reason are required for Global Emergency trip');
    }

    const now = new Date().toISOString();
    const updated: CivilizationKillSwitch[] = [];

    for (const subsystem of ALL_KILL_SWITCH_SUBSYSTEMS) {
      const sw: CivilizationKillSwitch = {
        subsystem,
        isTripped: true,
        trippedBy: trippedBy.trim(),
        reason: `GLOBAL EMERGENCY: ${reason.trim()}`,
        trippedAt: now,
      };
      this.killSwitches.set(subsystem, sw);
      updated.push(sw);
    }

    return updated;
  }

  isSubsystemOperational(subsystem: CivilizationKillSwitchSubsystem): boolean {
    const globalSw = this.killSwitches.get('GLOBAL_EMERGENCY');
    if (globalSw && globalSw.isTripped) {
      return false;
    }

    const sw = this.killSwitches.get(subsystem);
    return sw ? !sw.isTripped : false;
  }

  // ==========================================
  // 3. 8-STAGE INCIDENT MANAGEMENT LIFECYCLE
  // Clause N∞.40
  // ==========================================

  declareIncident(
    severity: 'SEV-1' | 'SEV-2' | 'SEV-3' | 'SEV-4',
    title: string,
    declaredBy: string,
    notes?: string,
  ): IncidentRecord {
    if (!severity || !['SEV-1', 'SEV-2', 'SEV-3', 'SEV-4'].includes(severity)) {
      throw new BadRequestException('Invalid severity level');
    }
    if (!title || !title.trim()) {
      throw new BadRequestException('Incident title is required');
    }
    if (!declaredBy || !declaredBy.trim()) {
      throw new BadRequestException('declaredBy actor is required');
    }

    const incidentId = `inc_${crypto.randomBytes(8).toString('hex')}`;
    const now = new Date().toISOString();

    const record: IncidentRecord = {
      incidentId,
      severity,
      title: title.trim(),
      currentStage: 'DECLARED',
      timeline: [
        {
          stage: 'DECLARED',
          actor: declaredBy.trim(),
          timestamp: now,
          notes: notes?.trim(),
        },
      ],
      updatedAt: now,
    };

    this.incidents.set(incidentId, record);
    return record;
  }

  advanceIncidentStage(
    incidentId: string,
    nextStage: IncidentLifecycleStage,
    actor: string,
    notes?: string,
  ): IncidentRecord {
    const incident = this.incidents.get(incidentId);
    if (!incident) {
      throw new NotFoundException(`Incident ${incidentId} not found`);
    }
    if (!INCIDENT_LIFECYCLE_SEQUENCE.includes(nextStage)) {
      throw new BadRequestException(`Invalid incident lifecycle stage: ${nextStage}`);
    }
    if (!actor || !actor.trim()) {
      throw new BadRequestException('Actor name is required to advance incident stage');
    }

    const currentIndex = INCIDENT_LIFECYCLE_SEQUENCE.indexOf(incident.currentStage);
    const nextIndex = INCIDENT_LIFECYCLE_SEQUENCE.indexOf(nextStage);

    if (nextIndex <= currentIndex) {
      throw new BadRequestException(
        `Cannot advance incident backwards or to same stage: from ${incident.currentStage} to ${nextStage}`,
      );
    }

    const now = new Date().toISOString();
    incident.currentStage = nextStage;
    incident.timeline.push({
      stage: nextStage,
      actor: actor.trim(),
      timestamp: now,
      notes: notes?.trim(),
    });
    incident.updatedAt = now;

    this.incidents.set(incidentId, incident);
    return incident;
  }

  attachPostmortem(
    incidentId: string,
    postmortemUri: string,
    systemicActionItem: string,
  ): IncidentRecord {
    const incident = this.incidents.get(incidentId);
    if (!incident) {
      throw new NotFoundException(`Incident ${incidentId} not found`);
    }
    if (!postmortemUri || !postmortemUri.trim()) {
      throw new BadRequestException('postmortemUri is required');
    }
    if (!systemicActionItem || !systemicActionItem.trim()) {
      throw new BadRequestException('systemicActionItem is required');
    }

    incident.postmortemUri = postmortemUri.trim();
    incident.systemicActionItem = systemicActionItem.trim();
    incident.updatedAt = new Date().toISOString();

    this.incidents.set(incidentId, incident);
    return incident;
  }

  getIncident(incidentId: string): IncidentRecord {
    const incident = this.incidents.get(incidentId);
    if (!incident) {
      throw new NotFoundException(`Incident ${incidentId} not found`);
    }
    return incident;
  }

  listActiveIncidents(): IncidentRecord[] {
    return Array.from(this.incidents.values()).filter(
      (inc) => !['CLOSED', 'POSTMORTEM', 'SYSTEMIC_IMPROVEMENT'].includes(inc.currentStage),
    );
  }

  listAllIncidents(): IncidentRecord[] {
    return Array.from(this.incidents.values());
  }
}
