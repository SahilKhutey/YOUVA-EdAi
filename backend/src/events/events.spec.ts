import { OutboxService, OutboxStatus } from './outbox/outbox.service';
import { EventBusService } from './event-bus.service';
import { OutboxProcessor } from './outbox/outbox.processor';
import { DomainEvent } from './domain/domain-event.interface';

describe('Events and Outbox Subsystem', () => {
  let mockPrisma: any;
  let outboxService: OutboxService;
  let eventBusService: EventBusService;
  let outboxProcessor: OutboxProcessor;

  beforeEach(() => {
    mockPrisma = {
      outboxEvent: {
        create: jest.fn().mockImplementation(({ data }) => Promise.resolve({ ...data })),
        createMany: jest.fn().mockResolvedValue({ count: 2 }),
        findMany: jest.fn().mockResolvedValue([]),
        update: jest.fn().mockImplementation(({ where, data }) => Promise.resolve({ id: where.id, ...data })),
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
        groupBy: jest.fn().mockResolvedValue([
          { status: OutboxStatus.PENDING, _count: { id: 5 } },
          { status: OutboxStatus.PROCESSED, _count: { id: 20 } },
        ]),
      },
    };

    outboxService = new OutboxService(mockPrisma);
    eventBusService = new EventBusService(outboxService);
    outboxProcessor = new OutboxProcessor(outboxService, eventBusService);
  });

  afterEach(() => {
    outboxProcessor.stopWorker();
  });

  describe('OutboxService', () => {
    it('should correctly enqueue a domain event with PENDING status', async () => {
      const event: DomainEvent = {
        id: 'evt-101',
        eventType: 'learner.mastery.updated',
        aggregateType: 'TopicMastery',
        aggregateId: 'user-topic-1',
        payload: { mastery: 0.85 },
        metadata: {
          timestamp: new Date().toISOString(),
          version: '1.0.0',
          tenantId: 'tenant-school-1',
        },
      };

      const result = await outboxService.enqueue(event);

      expect(mockPrisma.outboxEvent.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          id: 'evt-101',
          eventType: 'learner.mastery.updated',
          status: OutboxStatus.PENDING,
          tenantId: 'tenant-school-1',
        }),
      });
      expect(result.id).toBe('evt-101');
    });

    it('should transition to FAILED with exponential backoff on transient errors', async () => {
      await outboxService.markFailed('evt-101', 'Network timeout', 1, 5);

      expect(mockPrisma.outboxEvent.update).toHaveBeenCalledWith({
        where: { id: 'evt-101' },
        data: expect.objectContaining({
          status: OutboxStatus.FAILED,
          attempts: 2,
          lastError: 'Network timeout',
        }),
      });
    });

    it('should transition to DEAD_LETTER when reaching maxAttempts', async () => {
      await outboxService.markFailed('evt-101', 'Fatal schema error', 4, 5);

      expect(mockPrisma.outboxEvent.update).toHaveBeenCalledWith({
        where: { id: 'evt-101' },
        data: expect.objectContaining({
          status: OutboxStatus.DEAD_LETTER,
          attempts: 5,
        }),
      });
    });

    it('should aggregate outbox telemetry stats', async () => {
      const stats = await outboxService.getEventStats();
      expect(stats.pending).toBe(5);
      expect(stats.processed).toBe(20);
      expect(stats.failed).toBe(0);
    });
  });

  describe('EventBusService', () => {
    it('should dispatch to matching event handlers and support unsubscribing', async () => {
      const handler = jest.fn().mockResolvedValue(undefined);
      const unsubscribe = eventBusService.subscribe('safety.escalation.triggered', handler);

      const event: DomainEvent = {
        id: 'evt-202',
        eventType: 'safety.escalation.triggered',
        aggregateType: 'SafetyEscalation',
        aggregateId: 'esc-1',
        payload: { severity: 'HIGH' },
        metadata: { timestamp: new Date().toISOString(), version: '1.0.0' },
      };

      await eventBusService.publish(event);
      expect(handler).toHaveBeenCalledTimes(1);
      expect(handler).toHaveBeenCalledWith(event);

      // Test unsubscribe
      unsubscribe();
      await eventBusService.publish(event);
      expect(handler).toHaveBeenCalledTimes(1); // Not called again
    });

    it('should dispatch to wildcard prefix subscribers', async () => {
      const wildcardHandler = jest.fn().mockResolvedValue(undefined);
      eventBusService.subscribe('learner.*', wildcardHandler);

      const eventA: DomainEvent = {
        id: 'evt-301',
        eventType: 'learner.mastery.updated',
        aggregateType: 'TopicMastery',
        aggregateId: 'tm-1',
        payload: {},
        metadata: { timestamp: new Date().toISOString(), version: '1.0.0' },
      };

      const eventB: DomainEvent = {
        id: 'evt-302',
        eventType: 'teacher.intervention.committed',
        aggregateType: 'Intervention',
        aggregateId: 'int-1',
        payload: {},
        metadata: { timestamp: new Date().toISOString(), version: '1.0.0' },
      };

      await eventBusService.publish(eventA);
      await eventBusService.publish(eventB);

      expect(wildcardHandler).toHaveBeenCalledTimes(1);
      expect(wildcardHandler).toHaveBeenCalledWith(eventA);
    });
  });

  describe('OutboxProcessor', () => {
    it('should process pending events batch, dispatch to bus, and mark PROCESSED', async () => {
      const mockEventRecord = {
        id: 'evt-505',
        eventType: 'learner.evidence.recorded',
        aggregateType: 'Evidence',
        aggregateId: 'ev-1',
        tenantId: 'tenant-1',
        payload: JSON.stringify({
          payload: { score: 1.0 },
          metadata: { timestamp: new Date().toISOString(), version: '1.0.0' },
        }),
        status: OutboxStatus.PENDING,
        attempts: 0,
        maxAttempts: 5,
        createdAt: new Date(),
      };

      mockPrisma.outboxEvent.findMany.mockResolvedValue([mockEventRecord]);

      const dispatchedEvents: DomainEvent[] = [];
      eventBusService.subscribe('learner.evidence.recorded', async (ev) => {
        dispatchedEvents.push(ev);
      });

      const result = await outboxProcessor.processBatch(10);

      expect(result.processed).toBe(1);
      expect(result.failed).toBe(0);
      expect(dispatchedEvents.length).toBe(1);
      expect(dispatchedEvents[0].id).toBe('evt-505');
      expect(mockPrisma.outboxEvent.update).toHaveBeenCalledWith({
        where: { id: 'evt-505' },
        data: expect.objectContaining({ status: OutboxStatus.PROCESSED }),
      });
    });
  });
});
