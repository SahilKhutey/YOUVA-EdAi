import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import * as crypto from 'crypto';

export type IncidentSeverity = 'SEV-0' | 'SEV-1' | 'SEV-2' | 'SEV-3' | 'SEV-4';

export enum IncidentState {
  DETECTED = 'DETECTED',
  TRIAGED = 'TRIAGED',
  CONTAINED = 'CONTAINED',
  MITIGATED = 'MITIGATED',
  RECOVERED = 'RECOVERED',
  VERIFIED = 'VERIFIED',
  CLOSED = 'CLOSED',
  POSTMORTEM = 'POSTMORTEM',
}

export interface IncidentRecord {
  id: string;
  title: string;
  description: string;
  severity: IncidentSeverity;
  state: IncidentState;
  detectedAt: Date;
  updatedAt: Date;
  resolvedAt?: Date;
  timeline: { state: IncidentState; timestamp: Date; note: string; actor: string }[];
  postmortem?: {
    rootCause: string;
    impactSummary: string;
    actionItems: string[];
    preventiveMeasures: string[];
  };
}

@Injectable()
export class IncidentManagerService {
  private readonly logger = new Logger(IncidentManagerService.name);
  private readonly incidents = new Map<string, IncidentRecord>();

  // Allowed state transitions conforming to formal incident lifecycle
  private readonly validTransitions: Record<IncidentState, IncidentState[]> = {
    [IncidentState.DETECTED]: [IncidentState.TRIAGED, IncidentState.CLOSED],
    [IncidentState.TRIAGED]: [IncidentState.CONTAINED, IncidentState.CLOSED],
    [IncidentState.CONTAINED]: [IncidentState.MITIGATED, IncidentState.CLOSED],
    [IncidentState.MITIGATED]: [IncidentState.RECOVERED, IncidentState.CLOSED],
    [IncidentState.RECOVERED]: [IncidentState.VERIFIED, IncidentState.CLOSED],
    [IncidentState.VERIFIED]: [IncidentState.CLOSED, IncidentState.POSTMORTEM],
    [IncidentState.CLOSED]: [IncidentState.POSTMORTEM],
    [IncidentState.POSTMORTEM]: [],
  };

  /**
   * Declares a new incident.
   */
  declareIncident(input: {
    title: string;
    description: string;
    severity: IncidentSeverity;
    actor?: string;
  }): IncidentRecord {
    const id = `INC-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`;
    const now = new Date();

    const incident: IncidentRecord = {
      id,
      title: input.title,
      description: input.description,
      severity: input.severity,
      state: IncidentState.DETECTED,
      detectedAt: now,
      updatedAt: now,
      timeline: [
        {
          state: IncidentState.DETECTED,
          timestamp: now,
          note: 'Incident detected and registered in monitoring system',
          actor: input.actor || 'SYSTEM',
        },
      ],
    };

    this.incidents.set(id, incident);
    this.logger.error(
      `🚨 [${input.severity}] Incident declared: ${id} - "${input.title}"`,
    );

    return incident;
  }

  /**
   * Transitions an incident through its formal lifecycle.
   */
  transitionState(
    incidentId: string,
    targetState: IncidentState,
    note: string,
    actor = 'OPERATOR',
  ): IncidentRecord {
    const incident = this.incidents.get(incidentId);
    if (!incident) {
      throw new BadRequestException(`Incident with ID '${incidentId}' not found.`);
    }

    const allowed = this.validTransitions[incident.state];
    if (!allowed.includes(targetState)) {
      throw new BadRequestException(
        `Invalid incident lifecycle transition: Cannot transition from ${incident.state} to ${targetState}. Allowed: [${allowed.join(', ')}]`,
      );
    }

    const now = new Date();
    incident.state = targetState;
    incident.updatedAt = now;
    if (targetState === IncidentState.CLOSED || targetState === IncidentState.VERIFIED) {
      incident.resolvedAt = now;
    }

    incident.timeline.push({
      state: targetState,
      timestamp: now,
      note,
      actor,
    });

    this.logger.log(
      `Incident [${incidentId}] transitioned to ${targetState} by ${actor}. Note: ${note}`,
    );

    return incident;
  }

  /**
   * Attaches postmortem analysis to a resolved incident.
   */
  attachPostmortem(
    incidentId: string,
    postmortem: NonNullable<IncidentRecord['postmortem']>,
  ): IncidentRecord {
    const incident = this.incidents.get(incidentId);
    if (!incident) {
      throw new BadRequestException(`Incident with ID '${incidentId}' not found.`);
    }

    incident.postmortem = postmortem;
    if (incident.state === IncidentState.CLOSED || incident.state === IncidentState.VERIFIED) {
      incident.state = IncidentState.POSTMORTEM;
    }
    incident.updatedAt = new Date();

    return incident;
  }

  /**
   * Retrieves an incident by ID.
   */
  getIncident(incidentId: string): IncidentRecord | undefined {
    return this.incidents.get(incidentId);
  }

  /**
   * Lists active or all incidents.
   */
  listIncidents(activeOnly = false): IncidentRecord[] {
    const all = Array.from(this.incidents.values());
    if (activeOnly) {
      return all.filter(
        (i) =>
          i.state !== IncidentState.CLOSED &&
          i.state !== IncidentState.POSTMORTEM,
      );
    }
    return all;
  }

  /**
   * Clears state for testing.
   */
  reset() {
    this.incidents.clear();
  }
}
