import { validateEnvironment } from './env.validation';

describe('Production Configuration Hardening (N2.14)', () => {
  const validDevConfig = {
    NODE_ENV: 'development',
    PORT: '3001',
    DATABASE_URL: 'postgresql://youva:secret@localhost:5432/youva',
    JWT_SECRET: 'a_secure_development_jwt_secret_token_123456',
    AI_PROVIDER: 'deterministic',
  };

  it('✓ accepts valid development configuration', () => {
    const validated = validateEnvironment(validDevConfig);
    expect(validated.NODE_ENV).toBe('development');
    expect(validated.PORT).toBe(3001);
    expect(validated.DATABASE_URL).toBe(validDevConfig.DATABASE_URL);
  });

  it('✓ rejects insecure default JWT_SECRET in production', () => {
    expect(() =>
      validateEnvironment({
        ...validDevConfig,
        NODE_ENV: 'production',
        FRONTEND_URL: 'https://youva.edai.example.com',
        JWT_SECRET: 'defaultSecret',
      }),
    ).toThrow(/Insecure default JWT_SECRET/);
  });

  it('✓ rejects short JWT_SECRET (<32 chars) in production', () => {
    expect(() =>
      validateEnvironment({
        ...validDevConfig,
        NODE_ENV: 'production',
        FRONTEND_URL: 'https://youva.edai.example.com',
        JWT_SECRET: 'short_secret_key',
      }),
    ).toThrow(/JWT_SECRET must contain at least 32 characters/);
  });

  it('✓ requires FRONTEND_URL in production', () => {
    expect(() =>
      validateEnvironment({
        ...validDevConfig,
        NODE_ENV: 'production',
        JWT_SECRET: 'this_is_a_sufficiently_long_production_jwt_secret_key_32chars',
      }),
    ).toThrow(/FRONTEND_URL is required in production/);
  });

  it('✓ requires REDIS_URL when Redis-backed features are enabled', () => {
    expect(() =>
      validateEnvironment({
        ...validDevConfig,
        REDIS_ENABLED: 'true',
        REDIS_URL: undefined,
      }),
    ).toThrow(/REDIS_URL is required when Redis-backed features are enabled/);
  });

  it('✓ requires API key when gemini AI provider is selected in production', () => {
    expect(() =>
      validateEnvironment({
        ...validDevConfig,
        NODE_ENV: 'production',
        FRONTEND_URL: 'https://youva.edai.example.com',
        JWT_SECRET: 'this_is_a_sufficiently_long_production_jwt_secret_key_32chars',
        AI_PROVIDER: 'gemini',
      }),
    ).toThrow(/requires GEMINI_API_KEY/);
  });
});
