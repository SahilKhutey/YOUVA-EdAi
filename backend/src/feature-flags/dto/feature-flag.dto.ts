import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsBoolean,
  IsInt,
  Min,
  Max,
} from 'class-validator';

export class CreateFeatureFlagDto {
  @IsString()
  @IsNotEmpty()
  key: string;

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsBoolean()
  isEnabled?: boolean;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100)
  rolloutPercentage?: number;

  @IsOptional()
  @IsString()
  tenantWhitelist?: string;

  @IsOptional()
  @IsString()
  userWhitelist?: string;

  @IsOptional()
  @IsString()
  targetRoles?: string;

  @IsOptional()
  metadata?: Record<string, any>;
}

export class UpdateFeatureFlagDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsBoolean()
  isEnabled?: boolean;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100)
  rolloutPercentage?: number;

  @IsOptional()
  @IsString()
  tenantWhitelist?: string;

  @IsOptional()
  @IsString()
  userWhitelist?: string;

  @IsOptional()
  @IsString()
  targetRoles?: string;

  @IsOptional()
  metadata?: Record<string, any>;
}

export class EvaluateFlagDto {
  @IsString()
  @IsNotEmpty()
  flagKey: string;

  @IsOptional()
  @IsString()
  userId?: string;

  @IsOptional()
  @IsString()
  tenantId?: string;

  @IsOptional()
  @IsString()
  role?: string;
}

export class LogAIModelEvaluationDto {
  @IsString()
  @IsNotEmpty()
  modelName: string;

  @IsString()
  @IsNotEmpty()
  modelVersion: string;

  @IsString()
  @IsNotEmpty()
  promptKey: string;

  @IsOptional()
  @IsBoolean()
  teacherAgreed?: boolean;

  @IsOptional()
  @IsBoolean()
  teacherOverridden?: boolean;

  @IsOptional()
  accuracyScore?: number;

  @IsOptional()
  @IsBoolean()
  safetyPassed?: boolean;

  @IsOptional()
  @IsInt()
  latencyMs?: number;

  @IsOptional()
  @IsString()
  feedback?: string;

  @IsOptional()
  metadata?: Record<string, any>;
}
