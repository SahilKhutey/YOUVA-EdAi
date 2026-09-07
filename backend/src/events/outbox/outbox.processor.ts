import {
  Injectable,
  Logger,
  OnModuleInit,
  OnModuleDestroy,
} from '@nestjs/common';
import { OutboxService } from './outbox.service';
import { EventBusService } from '../event-bus.service';
import { DomainEvent } from '../domain/domain-event.interface';

@Injectable()
export class OutboxProcessor implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(OutboxProcessor.name);
  private isRunning = false;
  private intervalRef: NodeJS.Timeout | null = null;
  private pollIntervalMs = 5000; // 5 seconds polling interval

  constructor(
    private readonly outboxService: OutboxService,
    private readonly eventBusService: EventBusService,
  ) {}

  onModuleInit() {
    this.startWorker();
  }

  onModuleDestroy() {
    this.stopWorker();
  }

  startWorker(intervalMs = 5000) {
    if (this.isRunning) return;
    this.pollIntervalMs = intervalMs;
    this.isRunning = true;
    this.logger.log(`Starting OutboxProcessor worker (poll interval: ${this.pollIntervalMs}ms)`);

    this.intervalRef = setInterval(async () => {
      try {
        await this.processBatch();
      } catch (err) {
        this.logger.error(`Error in outbox processing loop: ${err.message}`, err.stack);
      }
    }, this.pollIntervalMs);
  }

  stopWorker() {
    if (this.intervalRef) {
      clearInterval(this.intervalRef);
      this.intervalRef = null;
    }
    this.isRunning = false;
    this.logger.log('OutboxProcessor worker stopped');
  }

  /**
   * Process a single batch of pending outbox events.
   * Exposed publicly for direct manual invocation in tests and tasks.
   */
  async processBatch(batchSize = 25): Promise<{ processed: number; failed: number }> {
    const pendingEvents = await this.outboxService.fetchPendingEvents(batchSize);
    if (pendingEvents.length === 0) {
      return { processed: 0, failed: 0 };
    }

    const eventIds = pendingEvents.map((e) => e.id);
    await this.outboxService.markProcessing(eventIds);

    let processedCount = 0;
    let failedCount = 0;

    for (const record of pendingEvents) {
      try {
        const parsed = JSON.parse(record.payload);
        const domainEvent: DomainEvent = {
          id: record.id,
          eventType: record.eventType,
          aggregateType: record.aggregateType,
          aggregateId: record.aggregateId,
          payload: parsed.payload,
          metadata: parsed.metadata || {
            timestamp: record.createdAt.toISOString(),
            version: '1.0.0',
            tenantId: record.tenantId,
          },
        };

        // Dispatch locally to subscribers
        await this.eventBusService.publish(domainEvent);

        // Mark as processed
        await this.outboxService.markProcessed(record.id);
        processedCount++;
      } catch (err: any) {
        failedCount++;
        await this.outboxService.markFailed(
          record.id,
          err.message || 'Unknown processing error',
          record.attempts,
          record.maxAttempts || 5,
        );
      }
    }

    return { processed: processedCount, failed: failedCount };
  }
}
