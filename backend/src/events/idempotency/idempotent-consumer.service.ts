import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { DomainEvent } from '../domain/domain-event.interface';

export interface IdempotentProcessingResult {
  handled: boolean;
  duplicate: boolean;
  error?: string;
}

@Injectable()
export class IdempotentConsumerService {
  private readonly logger = new Logger(IdempotentConsumerService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Checks if an event has already been successfully processed.
   */
  async isDuplicate(eventId: string): Promise<boolean> {
    const existing = await this.prisma.operationsEventProcessing.findUnique({
      where: { eventId },
    });
    return existing !== null && existing.status === 'PROCESSED';
  }

  /**
   * Executes an event handler with idempotency enforcement.
   * If the event was already processed, the handler is not invoked.
   */
  async consume<T = any>(
    event: DomainEvent<T>,
    handler: (event: DomainEvent<T>) => Promise<void>,
  ): Promise<IdempotentProcessingResult> {
    if (!event || !event.id) {
      throw new Error('Invalid event: id is required for idempotent processing');
    }

    // 1. Check existing record
    const existing = await this.prisma.operationsEventProcessing.findUnique({
      where: { eventId: event.id },
    });

    if (existing && existing.status === 'PROCESSED') {
      this.logger.debug(
        `Event [${event.id}] of type [${event.eventType}] was already processed at ${existing.processedAt?.toISOString()}. Skipping duplicate.`,
      );
      return { handled: false, duplicate: true };
    }

    // 2. Mark as PROCESSING
    await this.prisma.operationsEventProcessing.upsert({
      where: { eventId: event.id },
      create: {
        eventId: event.id,
        eventType: event.eventType,
        status: 'PROCESSING',
      },
      update: {
        status: 'PROCESSING',
        error: null,
      },
    });

    // 3. Execute handler
    try {
      await handler(event);

      // 4. Mark as PROCESSED
      await this.prisma.operationsEventProcessing.update({
        where: { eventId: event.id },
        data: {
          status: 'PROCESSED',
          processedAt: new Date(),
          error: null,
        },
      });

      return { handled: true, duplicate: false };
    } catch (err: any) {
      const errorMessage = err?.message || String(err);
      this.logger.error(
        `Handler failed for event [${event.id}] (${event.eventType}): ${errorMessage}`,
      );

      await this.prisma.operationsEventProcessing.update({
        where: { eventId: event.id },
        data: {
          status: 'FAILED',
          error: errorMessage.slice(0, 1000),
        },
      });

      return { handled: false, duplicate: false, error: errorMessage };
    }
  }

  /**
   * Resets an event status to allow replay.
   */
  async resetForReplay(eventId: string): Promise<boolean> {
    try {
      await this.prisma.operationsEventProcessing.delete({
        where: { eventId },
      });
      return true;
    } catch {
      return false;
    }
  }
}
