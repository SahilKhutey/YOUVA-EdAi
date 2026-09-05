import { IsNotEmpty, IsString, IsEnum, IsNumber, Min, Max, IsOptional } from 'class-validator';
import { ActivityType, Modality, Pacing } from '../../learning-loop/domain/enums';

export class OverrideRecommendationDto {
  @IsNotEmpty()
  @IsString()
  reason: string;

  @IsNotEmpty()
  @IsEnum(ActivityType)
  forcedActivityType: ActivityType;

  @IsNumber()
  @Min(0.1)
  @Max(1.0)
  forcedDifficulty: number;

  @IsOptional()
  @IsEnum(Modality)
  forcedModality?: Modality;

  @IsOptional()
  @IsEnum(Pacing)
  forcedPacing?: Pacing;

  @IsOptional()
  @IsString()
  teacherNotes?: string;
}
