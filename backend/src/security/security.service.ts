import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SecurityService {
  private readonly logger = new Logger(SecurityService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Persists an idempotent response so repeated requests return identical results.
   */
  async recordIdempotentResponse(
    key: string,
    userId: string | null,
    requestHash: string,
    statusCode: number,
    responseBody: unknown,
    ttlHours = 24,
  ) {
    const expiresAt = new Date(Date.now() + ttlHours * 3600 * 1000);

    return this.prisma.idempotencyRecord.upsert({
      where: { key },
      create: {
        key,
        userId,
        requestHash,
        statusCode,
        responseBody: JSON.stringify(responseBody),
        expiresAt,
      },
      update: {
        statusCode,
        responseBody: JSON.stringify(responseBody),
        expiresAt,
      },
    });
  }

  /**
   * Records a system-level security or privileged action audit event.
   */
  async recordSecurityAudit(input: {
    requestId?: string;
    actorId?: string;
    action: string;
    resourceType: string;
    resourceId?: string;
    outcome: 'SUCCESS' | 'DENIED' | 'FAILED';
    reason?: string;
    metadata?: unknown;
  }) {
    return this.prisma.systemAuditEvent.create({
      data: {
        requestId: input.requestId,
        actorId: input.actorId,
        action: input.action,
        resourceType: input.resourceType,
        resourceId: input.resourceId,
        outcome: input.outcome,
        reason: input.reason,
        metadata: input.metadata ? JSON.stringify(input.metadata) : undefined,
      },
    });
  }
}
