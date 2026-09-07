import { EcosystemService } from './ecosystem.service';
import { IntegrationProvider } from './ecosystem.types';

describe('EcosystemService', () => {
  let service: EcosystemService;
  let prismaMock: any;

  beforeEach(() => {
    prismaMock = {
      integration: {
        upsert: jest.fn(),
        findUnique: jest.fn(),
        findFirst: jest.fn(),
        update: jest.fn(),
      },
    };
    service = new EcosystemService(prismaMock as any);
  });

  describe('registerIntegration', () => {
    it('upserts integration record with config', async () => {
      prismaMock.integration.upsert.mockResolvedValue({
        id: 'integ-1',
        provider: IntegrationProvider.CANVAS_LMS,
        integrationKey: 'canvas-district-9',
        status: 'ACTIVE',
      });

      const res = await service.registerIntegration(
        'tenant-d9',
        IntegrationProvider.CANVAS_LMS,
        'canvas-district-9',
        { endpoint: 'https://canvas.instructure.com' },
      );

      expect(res.id).toBe('integ-1');
      expect(prismaMock.integration.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { integrationKey: 'canvas-district-9' },
          create: expect.objectContaining({
            tenantId: 'tenant-d9',
            provider: IntegrationProvider.CANVAS_LMS,
          }),
        }),
      );
    });
  });

  describe('syncRoster', () => {
    it('normalizes external roster data into standard schema', async () => {
      prismaMock.integration.findUnique.mockResolvedValue({
        id: 'integ-1',
        provider: IntegrationProvider.GOOGLE_CLASSROOM,
        configJson: {
          mockRoster: [
            { id: 'gc-101', email: 'charlie@school.org', first_name: 'Charlie', last_name: 'Brown', grade: '8' },
          ],
        },
      });

      prismaMock.integration.update.mockResolvedValue({ id: 'integ-1' });

      const syncResult = await service.syncRoster('integ-1');

      expect(syncResult.syncedCount).toBe(1);
      expect(syncResult.students[0]).toEqual({
        externalId: 'gc-101',
        email: 'charlie@school.org',
        firstName: 'Charlie',
        lastName: 'Brown',
        gradeLevel: '8',
      });
      expect(prismaMock.integration.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'integ-1' },
          data: expect.objectContaining({ status: 'ACTIVE' }),
        }),
      );
    });
  });

  describe('dispatchOutboundWebhook', () => {
    it('generates HMAC-SHA256 signature for outgoing webhook payload', () => {
      const payload = { event: 'LEARNER_MASTERY_ACHIEVED', learnerId: 'l-10' };
      const secret = 'test-signing-secret';

      const result = service.dispatchOutboundWebhook('tenant-alpha', 'LEARNER_MASTERY', payload, secret);

      expect(result.delivered).toBe(true);
      expect(result.signature).toMatch(/^sha256=[a-f0-9]{64}$/);
      expect(result.eventType).toBe('LEARNER_MASTERY');
    });
  });
});
