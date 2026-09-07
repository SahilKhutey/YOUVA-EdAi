import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { DomainEvent } from '../domain/domain-event.interface';

export enum OutboxStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  PROCESSED = 'PROCESSED',
  FAILED = 'FAILED',
  DEAD_LETTER = 'DEAD_LETTER',
}

@Injectable()
export class OutboxService {
  private readonly logger = new Logger(OutboxService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Enqueue a domain event into the outbox within an optional transaction.
   */
  async enqueue(event: DomainEvent, tx?: any): Promise<any> {
    const client = tx || this.prisma;
    return client.outboxEvent.create({
      data: {
        id: event.id,
        eventType: event.eventType,
        aggregateType: event.aggregateType,
        aggregateId: event.aggregateId,
        tenantId: event.metadata?.tenantId ?? null,
        payload: JSON.stringify({
          payload: event.payload,
          metadata: event.metadata,
        }),
        status: OutboxStatus.PENDING,
        attempts: 0,
        maxAttempts: 5,
        availableAt: new Date(),
      },
    });
  }

  /**
   * Enqueue multiple domain events transactionally.
   */
  async enqueueBatch(events: DomainEvent[], tx?: any): Promise<void> {
    const client = tx || this.prisma;
    const records = events.map((event) => ({
      id: event.id,
      eventType: event.eventType,
      aggregateType: event.aggregateType,
      aggregateId: event.aggregateId,
      tenantId: event.metadata?.tenantId ?? null,
      payload: JSON.stringify({
        payload: event.payload,
        metadata: event.metadata,
      }),
      status: OutboxStatus.PENDING,
      attempts: 0,
      maxAttempts: 5,
      availableAt: new Date(),
    }));

    await client.outboxEvent.createMany({
      data: records,
      skipDuplicates: true,
    });
  }

  /**
   * Fetch a batch of pending events that are ready for processing.
   */
  async fetchPendingEvents(batchSize = 50): Promise<any[]> {
    const now = new Date();
    return this.prisma.outboxEvent.findMany({
      where: {
        status: { in: [OutboxStatus.PENDING, OutboxStatus.FAILED] },
        availableAt: { lte: now },
      },
      orderBy: { createdAt: 'asc' },
      take: batchSize,
    });
  }

  /**
   * Mark a set of events as currently being processed.
   */
  async markProcessing(eventIds: string[]): Promise<void> {
    if (eventIds.length === 0) return;
    await this.prisma.outboxEvent.updateMany({
      where: { id: { in: eventIds } },
      data: { status: OutboxStatus.PROCESSING },
    });
  }

  /**
   * Mark an event as successfully processed.
   */
  async markProcessed(eventId: string): Promise<void> {
    await this.prisma.outboxEvent.update({
      where: { id: eventId },
      data: {
        status: OutboxStatus.PROCESSED,
        processedAt: new Date(),
        lastError: null,
      },
    });
  }

  /**
   * Record failure and calculate exponential backoff or dead-letter transition.
   */
  async markFailed(
    eventId: string,
    errorMessage: string,
    currentAttempts: number,
    maxAttempts = 5,
  ): Promise<void> {
    const nextAttempt = currentAttempts + 1;
    const isDeadLetter = nextAttempt >= maxAttempts;

    // Exponential backoff: base 2 seconds * 2^(attempts-1), capped at 3600 seconds
    const backoffSeconds = Math.min(3600, Math.pow(2, nextAttempt) * 2);
    const nextAvailableAt = new Date(Date.now() + backoffSeconds * 1000);

    const newStatus = isDeadLetter ? OutboxStatus.DEAD_LETTER : OutboxStatus.FAILED;

    this.logger.warn(
      `OutboxEvent [${eventId}] failed (attempt ${nextAttempt}/${maxAttempts}). Transitioning to ${newStatus}. Next retry: ${nextAvailableAt.toISOString()}`,
    );

    await this.prisma.outboxEvent.update({
      where: { id: eventId },
      data: {
        status: newStatus,
        attempts: nextAttempt,
        availableAt: nextAvailableAt,
        lastError: errorMessage.slice(0, 1000),
      },
    });
  }

  /**
   * Get telemetry counts for outbox monitoring.
   */
  async getEventStats(): Promise<{
    pending: number;
    processing: number;
    processed: number;
    failed: number;
    deadLetter: number;
  }> {
    const counts = await this.prisma.outboxEvent.groupBy({
      by: ['status'],
      _count: { id: true },
    });

    const stats = {
      pending: 0,
      processing: 0,
      processed: 0,
      failed: 0,
      deadLetter: 0,
    };

    for (const item of counts) {
      if (item.status === OutboxStatus.PENDING) stats.pending = item._count.id;
      if (item.status === OutboxStatus.PROCESSING) stats.processing = item._count.id;
      if (item.status === OutboxStatus.PROCESSED) stats.processed = item._count.id;
      if (item.status === OutboxStatus.FAILED) stats.failed = item._count.id;
      if (item.status === OutboxStatus.DEAD_LETTER) stats.deadLetter = item._count.id;
    }

    return stats;
  }
}
