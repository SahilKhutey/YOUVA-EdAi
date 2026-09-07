import { ExternalLearningEventService } from './external-learning-event.service';
import { isSupportedVersion } from './integration.types';

describe('ExternalLearningEventService', () => {
  let service: ExternalLearningEventService;
  let prisma: any;

  beforeEach(() => {
    prisma = {
      externalLearningEvent: {
        findUnique: jest.fn(),
        create: jest.fn(),
      },
    };
    service = new ExternalLearningEventService(prisma);
  });

  it('does not process the same provider event twice', async () => {
    prisma.externalLearningEvent.findUnique.mockResolvedValue({
      id: 'existing',
      processed: true,
    });

    const result = await service.receive({
      externalEventId: 'evt-1',
      providerId: 'provider-1',
      tenantId: 'tenant-1',
      learnerReference: 'external-1',
      eventType: 'ACTIVITY_COMPLETED',
      occurredAt: new Date().toISOString(),
      payload: {},
    });

    expect(result.duplicate).toBe(true);
    expect(prisma.externalLearningEvent.create).not.toHaveBeenCalled();
  });

  it('processes and normalizes new provider event with idempotency guarantee', async () => {
    prisma.externalLearningEvent.findUnique.mockResolvedValue(null);
    prisma.externalLearningEvent.create.mockResolvedValue({
      id: 'evt-recorded-1',
      processed: true,
    });

    const result = await service.receive({
      externalEventId: 'evt-2',
      providerId: 'provider-cbse',
      tenantId: 'tenant-school-1',
      learnerReference: 'ext-student-42',
      eventType: 'ASSESSMENT_COMPLETED',
      occurredAt: new Date().toISOString(),
      payload: {
        conceptId: 'math-quadratics',
        performance: 0.95,
        confidence: 0.9,
      },
      signature: 'valid-test-signature-hmac-sha256',
    });

    expect(result.duplicate).toBe(false);
    expect(result.processed).toBe(true);
    expect(result.normalizedEvidence.conceptId).toBe('math-quadratics');
    expect(result.normalizedEvidence.performance).toBe(0.95);
  });

  it('enforces version support check', () => {
    expect(isSupportedVersion(1, [1, 2])).toBe(true);
    expect(isSupportedVersion(3, [1, 2])).toBe(false);
  });
});
