import { validateEnvironment } from '../config/env.validation';
import { IdempotencyGuard } from './guards/idempotency.guard';
import { BadRequestException } from '@nestjs/common';

describe('P5 Security & Environment Validation', () => {
  describe('Environment Validation', () => {
    it('✓ rejects defaultSecret in production environment', () => {
      expect(() =>
        validateEnvironment({
          NODE_ENV: 'production',
          PORT: 3001,
          DATABASE_URL: 'postgresql://localhost:5432/youva',
          JWT_SECRET: 'defaultSecret',
        }),
      ).toThrow('Insecure default JWT_SECRET');
    });

    it('✓ rejects JWT_SECRET with less than 32 characters in production', () => {
      expect(() =>
        validateEnvironment({
          NODE_ENV: 'production',
          PORT: 3001,
          DATABASE_URL: 'postgresql://localhost:5432/youva',
          JWT_SECRET: 'short_secret_12345',
        }),
      ).toThrow('at least 32 characters');
    });

    it('✓ accepts valid production environment configuration', () => {
      const valid = validateEnvironment({
        NODE_ENV: 'production',
        PORT: 3001,
        DATABASE_URL: 'postgresql://localhost:5432/youva',
        JWT_SECRET: 'super_secure_production_jwt_secret_token_32chars_min',
      });

      expect(valid.NODE_ENV).toBe('production');
      expect(valid.PORT).toBe(3001);
    });
  });

  describe('IdempotencyGuard Invariants', () => {
    let guard: IdempotencyGuard;
    let prisma: any;

    beforeEach(() => {
      prisma = {
        idempotencyRecord: {
          findUnique: jest.fn(),
          upsert: jest.fn(),
        },
      };
      guard = new IdempotencyGuard(prisma);
    });

    it('✓ allows requests without idempotency header to pass through', async () => {
      const mockContext: any = {
        switchToHttp: () => ({
          getRequest: () => ({
            header: () => undefined,
            body: {},
          }),
        }),
      };

      await expect(guard.canActivate(mockContext)).resolves.toBe(true);
    });

    it('✓ rejects reuse of idempotency key with mismatched payload hash', async () => {
      prisma.idempotencyRecord.findUnique.mockResolvedValue({
        key: 'key-123',
        requestHash: 'different_hash_from_previous_payload',
      });

      const mockContext: any = {
        switchToHttp: () => ({
          getRequest: () => ({
            header: (h: string) => (h === 'Idempotency-Key' ? 'key-123' : undefined),
            body: { answer: '42' },
          }),
        }),
      };

      await expect(guard.canActivate(mockContext)).rejects.toThrow(BadRequestException);
    });
  });
});
