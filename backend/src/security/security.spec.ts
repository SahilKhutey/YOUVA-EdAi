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

  describe('ProductionExceptionFilter Invariants', () => {
    let filter: any;
    let mockResponse: any;
    let mockArgumentsHost: any;

    beforeEach(async () => {
      const { ProductionExceptionFilter } = await import(
        './filters/production-exception.filter'
      );
      filter = new ProductionExceptionFilter();

      mockResponse = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis(),
      };

      mockArgumentsHost = {
        switchToHttp: () => ({
          getRequest: () => ({
            method: 'POST',
            originalUrl: '/api/learning/evaluate',
            requestId: 'req-prod-sec-test-01',
          }),
          getResponse: () => mockResponse,
        }),
      };
    });

    it('✓ masks unhandled internal errors (500) and does not leak stack trace or internal details', () => {
      const sensitiveInternalError = new Error('DATABASE CONNECTION FAILED: postgresql://admin:secret@internal-db:5432');

      filter.catch(sensitiveInternalError, mockArgumentsHost);

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: 500,
          message: 'Internal server error',
          requestId: 'req-prod-sec-test-01',
        }),
      );
      // Ensure raw database string was NOT leaked in JSON response
      const sentPayload = mockResponse.json.mock.calls[0][0];
      expect(JSON.stringify(sentPayload)).not.toContain('postgresql://admin:secret');
    });

    it('✓ preserves structured 4xx client errors without censorship', async () => {
      const { NotFoundException } = await import('@nestjs/common');
      const clientError = new NotFoundException('Topic not found in grade curriculum');

      filter.catch(clientError, mockArgumentsHost);

      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: 404,
          message: 'Topic not found in grade curriculum',
          requestId: 'req-prod-sec-test-01',
        }),
      );
    });
  });

  describe('TieredRateLimitGuard Invariants', () => {
    let guard: any;

    beforeEach(async () => {
      const { TieredRateLimitGuard } = await import(
        './guards/rate-limit.guard'
      );
      guard = new TieredRateLimitGuard();
    });

    it('✓ allows requests within limits and throttles upon exceeding threshold', () => {
      const mockContext = {
        switchToHttp: () => ({
          getRequest: () => ({
            originalUrl: '/api/auth/login',
            ip: '192.168.1.50',
            headers: {},
          }),
        }),
      } as any;

      // Auth route allows up to 10 requests
      for (let i = 0; i < 10; i++) {
        expect(guard.canActivate(mockContext)).toBe(true);
      }

      // 11th request must throw 429 Too Many Requests
      expect(() => guard.canActivate(mockContext)).toThrow(
        expect.objectContaining({
          status: 429,
        }),
      );
    });
  });
});
