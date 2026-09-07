describe('General Unit Tests: Error Handling & Logging Redaction (UT-GEN-013 - UT-GEN-017)', () => {
  class DomainException extends Error {
    constructor(
      public readonly code: string,
      public readonly statusCode: number,
      message: string,
    ) {
      super(message);
      this.name = 'DomainException';
    }
  }

  function handleException(error: unknown, isProduction = true) {
    if (error instanceof DomainException) {
      return {
        statusCode: error.statusCode,
        error: error.code,
        message: error.message,
      };
    }

    // Unexpected internal server error
    const internalMsg = isProduction ? 'Internal server error occurred.' : (error as any)?.message ?? 'Unknown error';

    return {
      statusCode: 500,
      error: 'INTERNAL_SERVER_ERROR',
      message: internalMsg,
    };
  }

  function sanitizeLogData(payload: Record<string, any>): Record<string, any> {
    const sensitiveKeys = new Set(['password', 'token', 'jwt', 'secret', 'secretKey', 'apiKey', 'creditCard']);
    const sanitized: Record<string, any> = {};

    for (const [key, value] of Object.entries(payload)) {
      if (sensitiveKeys.has(key.toLowerCase())) {
        sanitized[key] = '[REDACTED]';
      } else if (value && typeof value === 'object' && !Array.isArray(value)) {
        sanitized[key] = sanitizeLogData(value);
      } else {
        sanitized[key] = value;
      }
    }
    return sanitized;
  }

  describe('UT-GEN-013: Error handling - Domain exception mapped correctly', () => {
    it('maps domain exception to correct HTTP status and clean error code', () => {
      const notFoundErr = new DomainException('RESOURCE_NOT_FOUND', 404, 'Learning pathway was not found.');
      const response = handleException(notFoundErr);

      expect(response.statusCode).toBe(404);
      expect(response.error).toBe('RESOURCE_NOT_FOUND');
      expect(response.message).toBe('Learning pathway was not found.');
    });
  });

  describe('UT-GEN-014: Error handling - Unexpected exception does not expose internals', () => {
    it('masks stack traces and DB internal messages in production response', () => {
      const dbErr = new Error('FATAL: password authentication failed for user "postgres" at line 42 in pg_hba.conf');
      const response = handleException(dbErr, true);

      expect(response.statusCode).toBe(500);
      expect(response.message).toBe('Internal server error occurred.');
      expect((response as any).stack).toBeUndefined();
      expect(response.message).not.toContain('postgres');
    });
  });

  describe('UT-GEN-015: Logging - Normal operation logged', () => {
    it('records structured log message for standard operational events', () => {
      const logs: Array<{ level: string; event: string; context: any }> = [];
      const logger = {
        info: (event: string, context: any) => logs.push({ level: 'INFO', event, context }),
      };

      logger.info('STUDENT_ASSESSMENT_SUBMITTED', { studentId: 'std-1', score: 90 });
      expect(logs.length).toBe(1);
      expect(logs[0].event).toBe('STUDENT_ASSESSMENT_SUBMITTED');
      expect(logs[0].context.score).toBe(90);
    });
  });

  describe('UT-GEN-016: Logging - Sensitive data is not logged', () => {
    it('filters out confidential tokens and credentials before writing to log streams', () => {
      const rawPayload = {
        userId: 'u1',
        token: 'eyJhGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJ1MSJ9',
        action: 'LOGIN',
      };

      const sanitized = sanitizeLogData(rawPayload);
      expect(sanitized.token).toBe('[REDACTED]');
      expect(sanitized.userId).toBe('u1');
    });
  });

  describe('UT-GEN-017: Logging - Password/token/secret redacted', () => {
    it('recursively redacts nested passwords, secrets, and API keys', () => {
      const nestedPayload = {
        config: {
          apiKey: 'sk-secret-ai-token-12345',
          endpoint: 'https://api.example.com',
          auth: {
            password: 'SuperSecretPassword!',
          },
        },
      };

      const sanitized = sanitizeLogData(nestedPayload);
      expect(sanitized.config.apiKey).toBe('[REDACTED]');
      expect(sanitized.config.auth.password).toBe('[REDACTED]');
      expect(sanitized.config.endpoint).toBe('https://api.example.com');
    });
  });
});
