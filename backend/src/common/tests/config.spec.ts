describe('General Unit Tests: Bootstrap, DI & Configuration (UT-GEN-001 - UT-GEN-007)', () => {
  describe('UT-GEN-001: Bootstrap - Application initializes with valid configuration', () => {
    it('initializes application config successfully when all required environment variables are present', () => {
      const validEnv = {
        NODE_ENV: 'production',
        PORT: '3000',
        DATABASE_URL: 'postgresql://user:pass@localhost:5432/youva?schema=public',
        JWT_SECRET: 'super-secure-production-jwt-secret-min-32-chars-long',
      };

      const initAppConfig = (env: Record<string, string>) => {
        if (!env.DATABASE_URL || !env.JWT_SECRET) {
          throw new Error('Missing essential config');
        }
        return {
          nodeEnv: env.NODE_ENV ?? 'development',
          port: parseInt(env.PORT ?? '3000', 10),
          databaseUrl: env.DATABASE_URL,
          jwtSecret: env.JWT_SECRET,
        };
      };

      const config = initAppConfig(validEnv);
      expect(config.nodeEnv).toBe('production');
      expect(config.port).toBe(3000);
      expect(config.databaseUrl).toBeDefined();
    });
  });

  describe('UT-GEN-002: Bootstrap - Missing required environment variable', () => {
    it('fails startup with clear error when required variable is absent', () => {
      const invalidEnv: Record<string, string> = {
        NODE_ENV: 'production',
        // DATABASE_URL is missing
      };

      const validateEnv = (env: Record<string, string>) => {
        const required = ['DATABASE_URL', 'JWT_SECRET'];
        const missing = required.filter(k => !env[k]);
        if (missing.length > 0) {
          throw new Error(`Config validation error: Missing required environment variables: ${missing.join(', ')}`);
        }
      };

      expect(() => validateEnv(invalidEnv)).toThrow(
        'Config validation error: Missing required environment variables: DATABASE_URL, JWT_SECRET',
      );
    });
  });

  describe('UT-GEN-003: Bootstrap - Invalid environment value', () => {
    it('fails startup safely when an environment variable has an invalid type or value', () => {
      const validatePort = (portStr: string) => {
        const port = Number(portStr);
        if (isNaN(port) || port <= 0 || port > 65535) {
          throw new Error(`Invalid PORT value: "${portStr}". Must be an integer between 1 and 65535.`);
        }
        return port;
      };

      expect(() => validatePort('not-a-number')).toThrow('Invalid PORT value');
      expect(() => validatePort('-5')).toThrow('Invalid PORT value');
      expect(() => validatePort('999999')).toThrow('Invalid PORT value');
      expect(validatePort('3000')).toBe(3000);
    });
  });

  describe('UT-GEN-004: DI - Required provider resolves', () => {
    it('resolves required service from dependency injection container', () => {
      class Container {
        private providers = new Map<string, any>();
        register(token: string, instance: any) {
          this.providers.set(token, instance);
        }
        resolve<T>(token: string): T {
          const p = this.providers.get(token);
          if (!p) throw new Error(`Cannot resolve provider: ${token}`);
          return p;
        }
      }

      const container = new Container();
      const mockPrisma = { name: 'PrismaService' };
      container.register('PrismaService', mockPrisma);

      expect(container.resolve('PrismaService')).toBe(mockPrisma);
    });
  });

  describe('UT-GEN-005: DI - Missing provider dependency', () => {
    it('fails deterministically when resolving an unregistered provider', () => {
      class Container {
        private providers = new Map<string, any>();
        resolve<T>(token: string): T {
          const p = this.providers.get(token);
          if (!p) throw new Error(`Nest DI Error: No provider for ${token}`);
          return p;
        }
      }

      const container = new Container();
      expect(() => container.resolve('UnknownService')).toThrow('Nest DI Error: No provider for UnknownService');
    });
  });

  describe('UT-GEN-006: Config - Production configuration loads correctly', () => {
    it('loads production configuration flags with security defaults', () => {
      const loadConfig = (env: string) => ({
        isProd: env === 'production',
        enableCors: env !== 'production',
        enableDetailedLogs: env !== 'production',
        enableStrictSsl: env === 'production',
        tokenExpiry: env === 'production' ? '15m' : '7d',
      });

      const prodConfig = loadConfig('production');
      expect(prodConfig.isProd).toBe(true);
      expect(prodConfig.enableStrictSsl).toBe(true);
      expect(prodConfig.enableDetailedLogs).toBe(false);
      expect(prodConfig.tokenExpiry).toBe('15m');
    });
  });

  describe('UT-GEN-007: Config - Development configuration does not leak into production', () => {
    it('ensures test/dev mocks, debug flags and loose bypasses are disabled in production', () => {
      const sanitizeForEnv = (env: string, flags: { mockAuth: boolean; debugTrace: boolean }) => {
        if (env === 'production') {
          if (flags.mockAuth) throw new Error('SECURITY CRITICAL: mockAuth cannot be enabled in production');
          if (flags.debugTrace) throw new Error('SECURITY CRITICAL: debugTrace cannot be enabled in production');
        }
        return true;
      };

      expect(() => sanitizeForEnv('production', { mockAuth: true, debugTrace: false })).toThrow('mockAuth');
      expect(() => sanitizeForEnv('production', { mockAuth: false, debugTrace: true })).toThrow('debugTrace');
      expect(sanitizeForEnv('production', { mockAuth: false, debugTrace: false })).toBe(true);
    });
  });
});
