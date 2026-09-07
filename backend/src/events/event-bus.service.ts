import { Injectable, Logger } from '@nestjs/common';
import { DomainEvent } from './domain/domain-event.interface';
import { OutboxService } from './outbox/outbox.service';

export type EventHandler<T = any> = (event: DomainEvent<T>) => Promise<void>;

@Injectable()
export class EventBusService {
  private readonly logger = new Logger(EventBusService.name);
  private readonly handlers: Map<string, Set<EventHandler>> = new Map();

  constructor(private readonly outboxService: OutboxService) {}

  /**
   * Subscribe an asynchronous handler to a specific eventType or wildcard '*'.
   * Returns an unsubscribe callback.
   */
  subscribe<T = any>(eventType: string, handler: EventHandler<T>): () => void {
    if (!this.handlers.has(eventType)) {
      this.handlers.set(eventType, new Set());
    }
    this.handlers.get(eventType)!.add(handler as EventHandler);

    return () => {
      const set = this.handlers.get(eventType);
      if (set) {
        set.delete(handler as EventHandler);
        if (set.size === 0) {
          this.handlers.delete(eventType);
        }
      }
    };
  }

  /**
   * Publish an event synchronously/in-memory to all registered subscribers.
   */
  async publish<T = any>(event: DomainEvent<T>): Promise<void> {
    const matchingHandlers: EventHandler[] = [];

    // Exact eventType matches
    const exact = this.handlers.get(event.eventType);
    if (exact) {
      exact.forEach((h) => matchingHandlers.push(h));
    }

    // Wildcard prefix matches (e.g., 'learner.*')
    this.handlers.forEach((set, pattern) => {
      if (pattern.endsWith('.*')) {
        const prefix = pattern.slice(0, -2);
        if (event.eventType.startsWith(prefix)) {
          set.forEach((h) => matchingHandlers.push(h));
        }
      } else if (pattern === '*') {
        set.forEach((h) => matchingHandlers.push(h));
      }
    });

    if (matchingHandlers.length === 0) {
      this.logger.debug(`No in-memory handlers registered for event ${event.eventType}`);
      return;
    }

    const results = await Promise.allSettled(
      matchingHandlers.map((handler) => handler(event)),
    );

    results.forEach((result, idx) => {
      if (result.status === 'rejected') {
        this.logger.error(
          `Handler #${idx} for event [${event.eventType}] failed: ${result.reason?.message || result.reason}`,
        );
      }
    });
  }

  /**
   * Transactionally persist the event into the Outbox.
   * This guarantees at-least-once asynchronous delivery.
   */
  async publishTransactional<T = any>(event: DomainEvent<T>, tx?: any): Promise<void> {
    await this.outboxService.enqueue(event, tx);
  }

  /**
   * Helper to create a fully formed DomainEvent.
   */
  createEvent<T>(
    eventType: string,
    aggregateType: string,
    aggregateId: string,
    payload: T,
    metadata?: Partial<DomainEvent['metadata']>,
  ): DomainEvent<T> {
    return {
      id: crypto.randomUUID(),
      eventType,
      aggregateType,
      aggregateId,
      payload,
      metadata: {
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        ...metadata,
      },
    };
  }
}
