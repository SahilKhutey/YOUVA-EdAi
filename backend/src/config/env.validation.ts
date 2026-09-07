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
  @IsIn(['development', 'test', 'production'])
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
  @IsString()
  AI_PROVIDER_API_KEY?: string;
}

export function validateEnvironment(
  config: Record<string, unknown>,
): EnvironmentVariables {
  const transformed = plainToInstance(EnvironmentVariables, {
    ...config,
    NODE_ENV: config.NODE_ENV || 'development',
    PORT: Number(config.PORT ?? 3001),
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

  if (
    transformed.NODE_ENV === 'production' &&
    (transformed.JWT_SECRET === 'defaultSecret' || transformed.JWT_SECRET === 'default_secret_key_change_in_production')
  ) {
    throw new Error('[FATAL] Insecure default JWT_SECRET detected in production environment.');
  }

  if (
    transformed.NODE_ENV === 'production' &&
    transformed.JWT_SECRET &&
    transformed.JWT_SECRET.length < 32
  ) {
    throw new Error('[FATAL] JWT_SECRET must contain at least 32 characters in production.');
  }

  return transformed;
}
