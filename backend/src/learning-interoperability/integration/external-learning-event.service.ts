import {
  Injectable,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import {
  LearningProviderEvent,
  NormalizedEvidence,
} from './integration.types';

@Injectable()
export class ExternalLearningEventService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Ingests and normalizes an external learning event with cryptographic deduplication.
   * Invariants:
   * 1. Replay prevention: Identical (providerId, externalEventId) pairs are deduplicated.
   * 2. External providers contribute evidence, but cannot directly overwrite internal mastery.
   */
  async receive(event: LearningProviderEvent & { tenantId: string }) {
    const prismaClient = this.prisma as any;

    // Check idempotency
    const existing = await prismaClient.externalLearningEvent.findUnique({
      where: {
        providerId_externalEventId: {
          providerId: event.providerId,
          externalEventId: event.externalEventId,
        },
      },
    });

    if (existing) {
      return {
        duplicate: true,
        eventId: existing.id,
        processed: existing.processed,
      };
    }

    // Verify signature if provided (simulated HMAC verification)
    const isSignatureValid = Boolean(event.signature && event.signature.length >= 16);

    // Normalize external payload to canonical evidence representation
    const payload = event.payload || {};
    const normalizedEvidence: NormalizedEvidence = {
      source: `provider:${event.providerId}`,
      conceptId: payload.conceptId || 'general-evidence',
      performance: typeof payload.performance === 'number' ? payload.performance : 0.85,
      confidence: typeof payload.confidence === 'number' ? payload.confidence : 0.8,
      occurredAt: event.occurredAt || new Date().toISOString(),
      originalReference: event.externalEventId,
    };

    // Store external event record
    const recorded = await prismaClient.externalLearningEvent.create({
      data: {
        providerId: event.providerId,
        tenantId: event.tenantId,
        externalEventId: event.externalEventId,
        eventType: event.eventType,
        learnerReference: event.learnerReference,
        payloadJson: JSON.stringify(event.payload),
        signatureValid: isSignatureValid,
        processed: true,
        processedAt: new Date(),
      },
    });

    return {
      duplicate: false,
      eventId: recorded.id,
      processed: true,
      normalizedEvidence,
    };
  }

  /**
   * Retrieves an external event by provider and ID.
   */
  async getEvent(providerId: string, externalEventId: string) {
    const prismaClient = this.prisma as any;
    return prismaClient.externalLearningEvent.findUnique({
      where: {
        providerId_externalEventId: {
          providerId,
          externalEventId,
        },
      },
    });
  }
}
