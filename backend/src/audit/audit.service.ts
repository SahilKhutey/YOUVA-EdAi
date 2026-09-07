import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export type AuditOutcome = 'SUCCESS' | 'DENIED' | 'FAILED';

export interface AuditRecordInput {
  actorId?: string;
  actorRole?: string;
  action: string;
  resource: string;
  resourceId?: string;
  outcome: AuditOutcome;
  metadata?: unknown;
}

@Injectable()
export class AuditService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Records an immutable audit log entry for privileged or security-relevant operations.
   */
  async record(input: AuditRecordInput) {
    return this.prisma.auditEvent.create({
      data: {
        actorId: input.actorId,
        actorRole: input.actorRole,
        action: input.action,
        resource: input.resource,
        resourceId: input.resourceId,
        outcome: input.outcome,
        metadata: input.metadata ? JSON.stringify(input.metadata) : undefined,
      },
    });
  }

  /**
   * Retrieves audit events for administrative/compliance review.
   */
  async getEvents(filters?: {
    actorId?: string;
    resource?: string;
    resourceId?: string;
    action?: string;
    outcome?: string;
    limit?: number;
  }) {
    return this.prisma.auditEvent.findMany({
      where: {
        actorId: filters?.actorId,
        resource: filters?.resource,
        resourceId: filters?.resourceId,
        action: filters?.action,
        outcome: filters?.outcome,
      },
      orderBy: { createdAt: 'desc' },
      take: filters?.limit ?? 100,
      include: {
        actor: {
          select: { id: true, name: true, email: true, role: true },
        },
      },
    });
  }
}
