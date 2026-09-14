import { Injectable, Logger } from '@nestjs/common';
import { AuditService } from '../../audit/audit.service';

export interface AiAuditRecordInput {
  requestId: string;
  correlationId: string;
  tenantId: string;
  actorId: string;
  actorRole?: string;
  purpose: string;
  provider: string;
  model: string;
  promptKey?: string;
  promptVersion?: string;
  outcome: 'SUCCESS' | 'BLOCKED' | 'FAILED' | 'TIMEOUT';
  safetyFlags: string[];
  latencyMs?: number;
  tokensTotal?: number;
}

@Injectable()
export class AiAuditService {
  private readonly logger = new Logger(AiAuditService.name);

  constructor(private readonly auditService: AuditService) {}

  /**
   * Records an immutable, cryptographically chained audit event for an AI generation request.
   */
  async recordAiEvent(input: AiAuditRecordInput): Promise<string> {
    const outcomeMap: Record<string, 'SUCCESS' | 'DENIED' | 'FAILED'> = {
      SUCCESS: 'SUCCESS',
      BLOCKED: 'DENIED',
      FAILED: 'FAILED',
      TIMEOUT: 'FAILED',
    };

    const auditOutcome = outcomeMap[input.outcome] || 'SUCCESS';

    try {
      const record = await this.auditService.recordChained({
        actorId: input.actorId,
        actorRole: input.actorRole || 'STUDENT',
        action: `AI_${input.purpose}_${input.outcome}`,
        resource: 'AI_GATEWAY',
        resourceId: input.requestId,
        outcome: auditOutcome,
        metadata: {
          requestId: input.requestId,
          correlationId: input.correlationId,
          tenantId: input.tenantId,
          purpose: input.purpose,
          provider: input.provider,
          model: input.model,
          promptKey: input.promptKey,
          promptVersion: input.promptVersion,
          safetyFlags: input.safetyFlags,
          latencyMs: input.latencyMs,
          tokensTotal: input.tokensTotal,
        },
      });

      return record.id;
    } catch (err) {
      this.logger.error(`Failed to record chained AI audit event: ${err.message}`);
      return `fallback-audit-${Date.now()}`;
    }
  }
}
