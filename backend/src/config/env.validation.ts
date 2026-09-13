import { plainToInstance } from 'class-transformer';
import {
  IsIn,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
  Min,
  validateSync,
} from 'class-validator';

export class EnvironmentVariables {
  @IsIn(['development', 'test', 'production', 'staging'])
  NODE_ENV!: string;

  @IsInt()
  @Min(1)
  PORT!: number;

  @IsString()
  @IsNotEmpty()
  DATABASE_URL!: string;

  @IsString()
  @IsNotEmpty()
  JWT_SECRET!: string;

  @IsOptional()
  @IsUrl({ require_tld: false })
  FRONTEND_URL?: string;

  @IsOptional()
  @IsString()
  REDIS_URL?: string;

  @IsOptional()
  @IsIn(['gemini', 'google-generative-ai', 'ollama', 'mock', 'deterministic'])
  AI_PROVIDER?: string;

  @IsOptional()
  @IsString()
  AI_PROVIDER_API_KEY?: string;

  @IsOptional()
  @IsString()
  GEMINI_API_KEY?: string;
}

export function validateEnvironment(
  config: Record<string, unknown>,
): EnvironmentVariables {
  const transformed = plainToInstance(EnvironmentVariables, {
    ...config,
    NODE_ENV: config.NODE_ENV || 'development',
    PORT: Number(config.PORT ?? 3001),
    AI_PROVIDER: config.AI_PROVIDER || 'gemini',
  });

  const errors = validateSync(transformed, {
    whitelist: true,
    forbidNonWhitelisted: false,
  });

  if (errors.length > 0) {
    const errorMessages = errors
      .map((error) => Object.values(error.constraints ?? {}).join(', '))
      .join('\n');

    if (transformed.NODE_ENV === 'production') {
      throw new Error(`[FATAL] Invalid production environment configuration:\n${errorMessages}`);
    } else {
      console.warn(`[WARN] Development environment warning:\n${errorMessages}`);
    }
  }

  // Production security & configuration invariants (N2.14)
  if (transformed.NODE_ENV === 'production') {
    // 1. JWT_SECRET length and placeholder checks
    if (
      transformed.JWT_SECRET === 'defaultSecret' ||
      transformed.JWT_SECRET === 'default_secret_key_change_in_production'
    ) {
      throw new Error('[FATAL] Insecure default JWT_SECRET detected in production environment.');
    }

    if (transformed.JWT_SECRET && transformed.JWT_SECRET.length < 32) {
      throw new Error('[FATAL] JWT_SECRET must contain at least 32 characters in production.');
    }

    // 2. FRONTEND_URL is mandatory in production for secure CORS origin binding
    if (!transformed.FRONTEND_URL) {
      throw new Error('[FATAL] FRONTEND_URL is required in production environment.');
    }

    // 3. AI_PROVIDER credentials validation
    if (
      (transformed.AI_PROVIDER === 'gemini' || transformed.AI_PROVIDER === 'google-generative-ai') &&
      !transformed.GEMINI_API_KEY &&
      !transformed.AI_PROVIDER_API_KEY
    ) {
      throw new Error(
        `[FATAL] AI provider '${transformed.AI_PROVIDER}' requires GEMINI_API_KEY or AI_PROVIDER_API_KEY in production.`,
      );
    }
  }

  // Redis requirement when explicitly enabled
  const isRedisExplicitlyEnabled =
    config.REDIS_ENABLED === 'true' || config.REDIS_ENABLED === true;
  if (isRedisExplicitlyEnabled && !transformed.REDIS_URL) {
    throw new Error('[FATAL] REDIS_URL is required when Redis-backed features are enabled.');
  }

  return transformed;
}
