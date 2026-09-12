import { Injectable, Logger } from '@nestjs/common';
import * as crypto from 'crypto';
import { TelemetryEventType, TelemetryEventDto } from './telemetry.constants';

@Injectable()
export class TelemetryService {
  private readonly logger = new Logger(TelemetryService.name);
  private readonly salt: string;
  private readonly events: TelemetryEventDto[] = [];

  constructor() {
    this.salt = process.env.TELEMETRY_SALT || 'youva-pilot-telemetry-salt-2026';
  }

  /**
   * Deterministic privacy-preserving student pseudonymization matching Phase 3 Python engine:
   * anon_<hash> where <hash> is the first 8 hex characters of sha256(salt + studentId).
   */
  pseudonymize(studentId: string): string {
    const raw = `${this.salt}${studentId}`;
    const hash = crypto.createHash('sha256').update(raw).digest('hex');
    return `anon_${hash.substring(0, 8)}`;
  }

  /**
   * Emits a privacy-preserving pedagogical telemetry event with zero student PII.
   */
  emitEvent(params: {
    eventType: TelemetryEventType;
    sessionId: string;
    studentId: string;
    cohortId?: string;
    payload?: Record<string, any>;
  }): TelemetryEventDto {
    const eventId = `tel-${crypto.randomUUID()}`;
    const pseudonymizedStudentId = this.pseudonymize(params.studentId);
    const cohortId = params.cohortId || 'PILOT-DPS-RKP-2026-Q3';

    // Strict PII scrub from payload
    const safePayload = { ...(params.payload || {}) };
    delete safePayload.email;
    delete safePayload.name;
    delete safePayload.phone;
    delete safePayload.studentEmail;
    delete safePayload.studentName;

    const event: TelemetryEventDto = {
      eventId,
      timestamp: new Date().toISOString(),
      eventType: params.eventType,
      sessionId: params.sessionId,
      cohortId,
      pseudonymizedStudentId,
      payload: safePayload,
    };

    this.events.push(event);
    this.logger.debug(
      `[Telemetry] Emitted ${event.eventType} for ${pseudonymizedStudentId} (Session: ${event.sessionId})`,
    );

    return event;
  }

  /**
   * Exports all recorded telemetry events for a given cohort.
   * Conforms to Phase 3 JSON schema.
   */
  exportCohortTelemetry(cohortId: string = 'PILOT-DPS-RKP-2026-Q3'): {
    cohortId: string;
    totalEvents: number;
    exportedAt: string;
    events: TelemetryEventDto[];
  } {
    const filtered = this.events.filter((e) => e.cohortId === cohortId);
    return {
      cohortId,
      totalEvents: filtered.length,
      exportedAt: new Date().toISOString(),
      events: filtered,
    };
  }

  /**
   * Clears in-memory buffer (primarily used in testing).
   */
  clearEvents(): void {
    this.events.length = 0;
  }
}
