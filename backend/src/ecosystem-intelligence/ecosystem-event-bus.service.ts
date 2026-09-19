import { Injectable, BadRequestException, ForbiddenException } from '@nestjs/common';
import {
  EcosystemEvent,
  AuthorityMatrixRecord,
} from './n21-types';
import { PartnerGatewayService } from './partner-gateway.service';

@Injectable()
export class EcosystemEventBusService {
  private processedEvents: Map<string, EcosystemEvent> = new Map(); // idempotencyKey -> EcosystemEvent
  private authorityMatrix: Map<string, AuthorityMatrixRecord> = new Map();
  private conflictLog: any[] = [];

  constructor(private readonly partnerGateway: PartnerGatewayService) {
    this.seedAuthorityMatrix();
  }

  private seedAuthorityMatrix(): void {
    const rules: AuthorityMatrixRecord[] = [
      {
        domainField: 'learning.mastery',
        authoritativeSystem: 'YOUVA',
        allowExternalMutation: false, // Strict Invariant: External systems CANNOT mutate mastery!
        conflictStrategy: 'REJECT',
      },
      {
        domainField: 'credential.status',
        authoritativeSystem: 'ISSUER',
        allowExternalMutation: true,
        conflictStrategy: 'LOG_CONFLICT',
      },
      {
        domainField: 'institution.enrollment',
        authoritativeSystem: 'INSTITUTION',
        allowExternalMutation: true,
        conflictStrategy: 'LOG_CONFLICT',
      },
      {
        domainField: 'opportunity.listing',
        authoritativeSystem: 'EMPLOYER',
        allowExternalMutation: true,
        conflictStrategy: 'QUARANTINE',
      },
    ];

    for (const r of rules) {
      this.authorityMatrix.set(r.domainField, r);
    }
  }

  // --- External Event Pipeline ---

  public ingestExternalEvent(event: {
    eventType: string;
    sourceOrganizationId: string;
    aggregateType: string;
    aggregateId: string;
    correlationId: string;
    version: number;
    payload: Record<string, any>;
    idempotencyKey: string;
    rawApiKey?: string;
  }): {
    status: 'PROCESSED' | 'DUPLICATE_SKIPPED' | 'CONFLICT_LOGGED';
    eventId: string;
    details: string;
  } {
    // 1. Schema Validation
    if (!event.eventType || !event.sourceOrganizationId || !event.idempotencyKey || !event.aggregateType) {
      throw new BadRequestException('eventType, sourceOrganizationId, aggregateType, and idempotencyKey are required');
    }

    // 2. Replay Protection & Idempotency Check (Clause N21.29)
    if (this.processedEvents.has(event.idempotencyKey)) {
      const existing = this.processedEvents.get(event.idempotencyKey)!;
      return {
        status: 'DUPLICATE_SKIPPED',
        eventId: existing.eventId,
        details: `Idempotent replay detected. Event ${existing.eventId} previously processed at ${existing.occurredAt}.`,
      };
    }

    // 3. Authority Matrix Check (Clause N21.41 - N21.44)
    const targetField = `${event.aggregateType.toLowerCase()}.${event.eventType.toLowerCase()}`;
    const matrixRule = this.authorityMatrix.get(targetField) || this.authorityMatrix.get(`${event.aggregateType.toLowerCase()}.mastery`);

    if (matrixRule && !matrixRule.allowExternalMutation) {
      throw new ForbiddenException(
        `CONSTITUTIONAL VIOLATION (Clause N21.42): External organization '${event.sourceOrganizationId}' cannot mutate authoritative field '${targetField}'. Authoritative system is ${matrixRule.authoritativeSystem}.`
      );
    }

    // 4. Conflict Resolution (Clause N21.44: No silent overwrite)
    if (event.payload && event.payload.conflictingClaim) {
      const conflictRecord = {
        conflictId: `conf-${Date.now()}`,
        sourceOrg: event.sourceOrganizationId,
        aggregateId: event.aggregateId,
        claim: event.payload.conflictingClaim,
        detectedAt: new Date().toISOString(),
        strategy: matrixRule ? matrixRule.conflictStrategy : 'LOG_CONFLICT',
      };
      this.conflictLog.push(conflictRecord);

      const eventId = `evt-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
      const storedEvent: EcosystemEvent = {
        eventId,
        eventType: event.eventType,
        sourceOrganizationId: event.sourceOrganizationId,
        aggregateType: event.aggregateType,
        aggregateId: event.aggregateId,
        occurredAt: new Date().toISOString(),
        correlationId: event.correlationId || `corr-${Date.now()}`,
        version: event.version || 1,
        payload: event.payload,
        idempotencyKey: event.idempotencyKey,
      };
      this.processedEvents.set(event.idempotencyKey, storedEvent);

      return {
        status: 'CONFLICT_LOGGED',
        eventId,
        details: `Conflict recorded without silent overwrite. Managed under ${conflictRecord.strategy} strategy.`,
      };
    }

    const eventId = `evt-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const storedEvent: EcosystemEvent = {
      eventId,
      eventType: event.eventType,
      sourceOrganizationId: event.sourceOrganizationId,
      aggregateType: event.aggregateType,
      aggregateId: event.aggregateId,
      occurredAt: new Date().toISOString(),
      correlationId: event.correlationId || `corr-${Date.now()}`,
      version: event.version || 1,
      payload: event.payload,
      idempotencyKey: event.idempotencyKey,
    };

    this.processedEvents.set(event.idempotencyKey, storedEvent);
    return {
      status: 'PROCESSED',
      eventId,
      details: 'Event validated, verified against authority matrix, and ingested into ecosystem event ledger.',
    };
  }

  public getConflicts(): any[] {
    return this.conflictLog;
  }

  public getProcessedEventsCount(): number {
    return this.processedEvents.size;
  }

  public getAuthorityMatrix(): AuthorityMatrixRecord[] {
    return Array.from(this.authorityMatrix.values());
  }
}
