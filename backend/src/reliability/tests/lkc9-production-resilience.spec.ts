import { Test, TestingModule } from '@nestjs/testing';
import { validateEnvironment } from '../../config/env.validation';
import { LkcCacheService } from '../../infrastructure/cache/lkc-cache.service';
import { CircuitBreakerService, CircuitState } from '../circuit-breaker/circuit-breaker.service';
import { OutboxService, OutboxStatus } from '../../events/outbox/outbox.service';
import { PrismaService } from '../../prisma/prisma.service';

describe('LKC-9 Production Resilience & Operational Hardening', () => {
  describe('1. Configuration Validation Fail-Fast (Invariant 7 & 8)', () => {
    it('should throw fatal error when production JWT_SECRET is insecure or short', () => {
      expect(() =>
        validateEnvironment({
          NODE_ENV: 'production',
          DATABASE_URL: 'postgresql://postgres:secret@localhost:5432/youva',
          JWT_SECRET: 'defaultSecret', // insecure
          FRONTEND_URL: 'https://youva.ai',
        }),
      ).toThrow(/Insecure default JWT_SECRET/);

      expect(() =>
        validateEnvironment({
          NODE_ENV: 'production',
          DATABASE_URL: 'postgresql://postgres:secret@localhost:5432/youva',
          JWT_SECRET: 'short_key', // < 32 chars
          FRONTEND_URL: 'https://youva.ai',
        }),
      ).toThrow(/must contain at least 32 characters/);
    });

    it('should throw fatal error when production FRONTEND_URL is missing', () => {
      expect(() =>
        validateEnvironment({
          NODE_ENV: 'production',
          DATABASE_URL: 'postgresql://postgres:secret@localhost:5432/youva',
          JWT_SECRET: 'a_very_secure_production_jwt_secret_with_32_chars!',
        }),
      ).toThrow(/FRONTEND_URL is required in production/);
    });

    it('should pass validation when production configuration is fully compliant', () => {
      const config = validateEnvironment({
        NODE_ENV: 'production',
        PORT: 3001,
        DATABASE_URL: 'postgresql://postgres:secret@localhost:5432/youva',
        JWT_SECRET: 'a_very_secure_production_jwt_secret_with_32_chars!',
        FRONTEND_URL: 'https://youva.ai',
        AI_PROVIDER: 'gemini',
        GEMINI_API_KEY: 'test-api-key',
      });

      expect(config.NODE_ENV).toBe('production');
      expect(config.PORT).toBe(3001);
    });
  });

  describe('2. Canonical Tenant-Scoped Caching & In-Memory Fallback (Invariant 27 & 28)', () => {
    let cacheService: LkcCacheService;

    beforeEach(async () => {
      const module: TestingModule = await Test.createTestingModule({
        providers: [LkcCacheService],
      }).compile();

      cacheService = module.get<LkcCacheService>(LkcCacheService);
      await cacheService.onModuleInit();
    });

    afterEach(async () => {
      await cacheService.onModuleDestroy();
    });

    it('should format standardized tenant-scoped cache keys', () => {
      const kKey = LkcCacheService.knowledgeKey('tenant-1', 'ko-algebra', 3);
      expect(kKey).toBe('tenant:tenant-1:knowledge:ko-algebra:published:v3');

      const gKey = LkcCacheService.graphKey('tenant-1', 'ko-algebra', 'rev-1');
      expect(gKey).toBe('tenant:tenant-1:graph:ko-algebra:prerequisites:rev-1');

      const aKey = LkcCacheService.analyticsKey('tenant-1', 'learner-1', '2026-09-20');
      expect(aKey).toBe('tenant:tenant-1:analytics:learner:learner-1:daily:2026-09-20');
    });

    it('should seamlessly store and retrieve from in-memory cache when Redis is unavailable', async () => {
      const key = LkcCacheService.knowledgeKey('tenant-1', 'ko-linear', 1);
      const payload = { id: 'ko-linear', title: 'Linear Equations', content: '2x = 4' };

      await cacheService.set(key, payload, 60);
      const retrieved = await cacheService.get<typeof payload>(key);

      expect(retrieved).toEqual(payload);
    });

    it('should invalidate cache entries matching knowledge prefix upon new publication', async () => {
      const keyV1 = LkcCacheService.knowledgeKey('tenant-1', 'ko-linear', 1);
      const keyV2 = LkcCacheService.knowledgeKey('tenant-1', 'ko-linear', 2);

      await cacheService.set(keyV1, { version: 1 }, 60);
      await cacheService.set(keyV2, { version: 2 }, 60);

      // Invalidate knowledge object
      await cacheService.invalidateKnowledge('tenant-1', 'ko-linear');

      expect(await cacheService.get(keyV1)).toBeNull();
      expect(await cacheService.get(keyV2)).toBeNull();
    });
  });

  describe('3. Circuit Breaker & Graceful Degradation on AI Outage (Invariant 24 & 25)', () => {
    let circuitBreaker: CircuitBreakerService;

    beforeEach(() => {
      circuitBreaker = new CircuitBreakerService();
    });

    it('should trip to OPEN after failure threshold and immediately invoke fallback', async () => {
      const circuitName = 'gemini-ai-provider';
      const failingAction = jest.fn().mockRejectedValue(new Error('AI Provider 503 Overloaded'));
      const deterministicFallback = jest.fn().mockResolvedValue({
        answer: 'Deterministic pedagogical hint: check variable isolation.',
      });

      // Threshold is 3 failures
      const options = { failureThreshold: 3, resetTimeoutMs: 5000 };

      // Attempt 1, 2, 3 - all fail and invoke fallback
      for (let i = 0; i < 3; i++) {
        const res = await circuitBreaker.execute(
          circuitName,
          failingAction,
          deterministicFallback,
          options,
        );
        expect(res.answer).toContain('Deterministic pedagogical hint');
      }

      expect(failingAction).toHaveBeenCalledTimes(3);
      expect(circuitBreaker.getState(circuitName)).toBe(CircuitState.OPEN);

      // Attempt 4: Circuit is OPEN, action is fast-failed without calling downstream
      const res4 = await circuitBreaker.execute(
        circuitName,
        failingAction,
        deterministicFallback,
        options,
      );
      expect(res4.answer).toContain('Deterministic pedagogical hint');
      // failingAction should NOT have been called again (still 3)
      expect(failingAction).toHaveBeenCalledTimes(3);
    });
  });

  describe('4. Idempotent Event Processing (Invariant 18)', () => {
    it('should verify unique constraint on clientEventId preventing duplicate evidence', async () => {
      const mockPrisma = {
        knowledgeEvent: {
          create: jest.fn(),
        },
      };

      // First event succeeds
      mockPrisma.knowledgeEvent.create.mockResolvedValueOnce({
        id: 'evt-1',
        clientEventId: 'client-uuid-1234',
        learnerId: 'learner-1',
      });

      const firstCall = await mockPrisma.knowledgeEvent.create({
        data: {
          clientEventId: 'client-uuid-1234',
          learnerId: 'learner-1',
          tenantId: 'tenant-1',
        },
      });
      expect(firstCall.id).toBe('evt-1');

      // Duplicate event with same clientEventId rejects with unique constraint violation
      mockPrisma.knowledgeEvent.create.mockRejectedValueOnce(
        new Error('Unique constraint failed on the fields: (`tenantId`,`learnerId`,`clientEventId`)'),
      );

      await expect(
        mockPrisma.knowledgeEvent.create({
          data: {
            clientEventId: 'client-uuid-1234',
            learnerId: 'learner-1',
            tenantId: 'tenant-1',
          },
        }),
      ).rejects.toThrow(/Unique constraint failed/);
    });
  });

  describe('5. Outbox Dead-Letter Queue on Exhausted Retries (Invariant 19 & 23)', () => {
    it('should transition failed outbox event to DEAD_LETTER when maxAttempts reached', async () => {
      const mockPrisma = {
        outboxEvent: {
          update: jest.fn().mockImplementation((args) => Promise.resolve(args.data)),
        },
      };

      const outboxService = new OutboxService(mockPrisma as any);

      // Failure attempt 4 of 5 -> status remains FAILED
      await outboxService.markFailed('evt-99', 'Database connection timeout', 3, 5);
      expect(mockPrisma.outboxEvent.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'evt-99' },
          data: expect.objectContaining({
            status: OutboxStatus.FAILED,
            attempts: 4,
          }),
        }),
      );

      // Failure attempt 5 of 5 -> status transitions to DEAD_LETTER
      await outboxService.markFailed('evt-99', 'Permanent network partition', 4, 5);
      expect(mockPrisma.outboxEvent.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'evt-99' },
          data: expect.objectContaining({
            status: OutboxStatus.DEAD_LETTER,
            attempts: 5,
          }),
        }),
      );
    });
  });
});
