import { Injectable, Logger } from '@nestjs/common';
import { OutboxService, OutboxStatus } from './outbox.service';
import { EventBusService } from '../event-bus.service';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class OutboxWorkerService {
  private readonly logger = new Logger(OutboxWorkerService.name);

  constructor(
    private readonly outboxService: OutboxService,
    private readonly eventBusService: EventBusService,
    private readonly prisma: PrismaService,
  ) {}

  /**
   * Processes a single batch of pending/failed outbox events.
   * Dispatches them through the event bus and updates statuses.
   */
  async processBatch(batchSize = 50): Promise<{
    processed: number;
    failed: number;
    deadLettered: number;
  }> {
    const events = await this.outboxService.fetchPendingEvents(batchSize);
    if (events.length === 0) {
      return { processed: 0, failed: 0, deadLettered: 0 };
    }

    const eventIds = events.map((e) => e.id);
    await this.outboxService.markProcessing(eventIds);

    let processedCount = 0;
    let failedCount = 0;
    let deadLetterCount = 0;

    for (const record of events) {
      try {
        let parsedPayload = {};
        try {
          parsedPayload = JSON.parse(record.payload);
        } catch {
          parsedPayload = { raw: record.payload };
        }

        const domainEvent = {
          id: record.id,
          eventType: record.eventType,
          aggregateType: record.aggregateType,
          aggregateId: record.aggregateId,
          payload: (parsedPayload as any).payload ?? parsedPayload,
          metadata: (parsedPayload as any).metadata ?? {
            tenantId: record.tenantId,
            timestamp: record.createdAt.toISOString(),
          },
        };

        // Dispatch in-memory or to external bus
        await this.eventBusService.publish(domainEvent);
        await this.outboxService.markProcessed(record.id);
        processedCount++;
      } catch (err: any) {
        failedCount++;
        const nextAttempt = record.attempts + 1;
        if (nextAttempt >= record.maxAttempts) {
          deadLetterCount++;
        }
        await this.outboxService.markFailed(
          record.id,
          err.message || String(err),
          record.attempts,
          record.maxAttempts,
        );
      }
    }

    return {
      processed: processedCount,
      failed: failedCount,
      deadLettered: deadLetterCount,
    };
  }

  /**
   * Replays an event from DEAD_LETTER back to PENDING.
   */
  async replayDeadLetter(eventId: string): Promise<boolean> {
    try {
      const prismaAny = this.prisma as any;
      const record = await prismaAny.outboxEvent.findUnique({
        where: { id: eventId },
      });

      if (!record || record.status !== OutboxStatus.DEAD_LETTER) {
        return false;
      }

      await prismaAny.outboxEvent.update({
        where: { id: eventId },
        data: {
          status: OutboxStatus.PENDING,
          attempts: 0,
          availableAt: new Date(),
          lastError: null,
        },
      });

      this.logger.log(`Replayed DEAD_LETTER event [${eventId}] back to PENDING.`);
      return true;
    } catch (err) {
      this.logger.error(`Failed to replay dead letter event [${eventId}]: ${err.message}`);
      return false;
    }
  }
}
