import { Injectable } from '@nestjs/common';
import * as crypto from 'crypto';
import { PrismaService } from '../prisma/prisma.service';

export type AuditOutcome = 'SUCCESS' | 'DENIED' | 'FAILED' | 'ESCALATED';

export const GENESIS_AUDIT_HASH = '0'.repeat(64);

export interface AuditRecordInput {
  actorId?: string;
  actorRole?: string;
  action: string;
  resource: string;
  resourceId?: string;
  outcome: AuditOutcome;
  metadata?: unknown;
}

export interface ChainedAuditMetadata {
  _hmac: string;
  _prevHash: string;
  _seq: number;
  [key: string]: any;
}

@Injectable()
export class AuditService {
  private readonly secretKey: string;

  constructor(private readonly prisma: PrismaService) {
    this.secretKey = process.env.AUDIT_HMAC_SECRET || 'youva-edai-audit-hmac-secret-v1';
  }

  /**
   * Computes deterministic HMAC-SHA256 digest over audit entry attributes.
   */
  computeEntryHash(payload: {
    sequence: number;
    actorId?: string;
    actorRole?: string;
    action: string;
    resource: string;
    resourceId?: string;
    outcome: string;
    userMetadata?: unknown;
    previousHash: string;
  }): string {
    const metaStr =
      payload.userMetadata && typeof payload.userMetadata === 'object'
        ? JSON.stringify(payload.userMetadata)
        : '';
    const raw = `${payload.sequence}|${payload.actorId ?? ''}|${payload.actorRole ?? ''}|${payload.action}|${payload.resource}|${payload.resourceId ?? ''}|${payload.outcome}|${metaStr}|${payload.previousHash}`;
    return crypto.createHmac('sha256', this.secretKey).update(raw).digest('hex');
  }

  /**
   * Records an audit log entry for privileged or security-relevant operations.
   * Preserves backward compatibility while supporting tamper-evident metadata.
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
   * Records an audit log entry with cryptographically enforced HMAC forward hash chaining.
   */
  async recordChained(input: AuditRecordInput) {
    const lastEvent = this.prisma.auditEvent.findFirst
      ? await this.prisma.auditEvent.findFirst({
          orderBy: { createdAt: 'desc' },
        })
      : null;

    let previousHash = GENESIS_AUDIT_HASH;
    let sequence = 0;

    if (lastEvent?.metadata) {
      try {
        const parsed = JSON.parse(lastEvent.metadata);
        if (parsed._hmac) {
          previousHash = parsed._hmac;
          sequence = (parsed._seq ?? 0) + 1;
        }
      } catch {
        // Fallback to genesis hash
      }
    }

    const entryHash = this.computeEntryHash({
      sequence,
      actorId: input.actorId,
      actorRole: input.actorRole,
      action: input.action,
      resource: input.resource,
      resourceId: input.resourceId,
      outcome: input.outcome,
      userMetadata: input.metadata,
      previousHash,
    });

    const enrichedMetadata: ChainedAuditMetadata = {
      ...(typeof input.metadata === 'object' && input.metadata !== null
        ? (input.metadata as Record<string, any>)
        : {}),
      _hmac: entryHash,
      _prevHash: previousHash,
      _seq: sequence,
    };

    return this.prisma.auditEvent.create({
      data: {
        actorId: input.actorId,
        actorRole: input.actorRole,
        action: input.action,
        resource: input.resource,
        resourceId: input.resourceId,
        outcome: input.outcome,
        metadata: JSON.stringify(enrichedMetadata),
      },
    });
  }

  /**
   * Verifies the cryptographic chain integrity of stored audit events.
   * Detects any altered records or broken hash pointers.
   */
  async verifyLedgerIntegrity(limit: number = 1000): Promise<{
    isValid: boolean;
    error?: string;
    corruptedEventId?: string;
    checkedCount: number;
  }> {
    const events = await this.prisma.auditEvent.findMany({
      orderBy: { createdAt: 'asc' },
      take: limit,
    });

    let previousHash = GENESIS_AUDIT_HASH;
    let expectedSeq = 0;

    for (const ev of events) {
      if (!ev.metadata) {
        continue; // Unchained legacy entry
      }

      try {
        const meta = JSON.parse(ev.metadata);
        if (!meta._hmac) continue;

        if (meta._prevHash !== previousHash) {
          return {
            isValid: false,
            error: `Broken hash pointer on event ${ev.id}: expected ${previousHash}, got ${meta._prevHash}`,
            corruptedEventId: ev.id,
            checkedCount: events.length,
          };
        }

        const { _hmac, _prevHash, _seq, ...userMeta } = meta;
        const recomputed = this.computeEntryHash({
          sequence: _seq ?? expectedSeq,
          actorId: ev.actorId ?? undefined,
          actorRole: ev.actorRole ?? undefined,
          action: ev.action,
          resource: ev.resource,
          resourceId: ev.resourceId ?? undefined,
          outcome: ev.outcome,
          userMetadata: Object.keys(userMeta).length > 0 ? userMeta : undefined,
          previousHash,
        });

        if (recomputed !== _hmac) {
          return {
            isValid: false,
            error: `HMAC mismatch on event ${ev.id}: computed ${recomputed} != stored ${_hmac}`,
            corruptedEventId: ev.id,
            checkedCount: events.length,
          };
        }

        previousHash = _hmac;
        expectedSeq++;
      } catch (err: any) {
        return {
          isValid: false,
          error: `Malformed metadata in event ${ev.id}: ${err.message}`,
          corruptedEventId: ev.id,
          checkedCount: events.length,
        };
      }
    }

    return {
      isValid: true,
      checkedCount: events.length,
    };
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
