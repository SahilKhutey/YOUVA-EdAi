import { IsNotEmpty, IsString, IsNumber, Min, Max, IsOptional, IsInt } from 'class-validator';

export class SubmitEvidenceDto {
  @IsNotEmpty()
  @IsString()
  idempotencyKey: string;

  @IsNotEmpty()
  @IsString()
  topicId: string;

  @IsNotEmpty()
  @IsString()
  answer: string;

  @IsNumber()
  @Min(0.0)
  @Max(1.0)
  accuracy: number; // 1.0 = fully correct, 0.0 = incorrect

  @IsOptional()
  @IsInt()
  @Min(1)
  attemptNumber?: number = 1;

  @IsOptional()
  @IsInt()
  @Min(0)
  hintCount?: number = 0;

  @IsOptional()
  @IsString()
  misconception?: string;

  @IsOptional()
  @IsNumber()
  @Min(0.0)
  @Max(1.0)
  engagementScore?: number = 1.0;

  @IsOptional()
  metadata?: Record<string, any>;
}
