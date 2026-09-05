import { IsNotEmpty, IsString, IsEnum, IsOptional, IsNumber, Min, Max } from 'class-validator';
import { InterventionAction, ActivityType, Modality, Pacing } from '../domain/enums';

export class TeacherInterventionDto {
  @IsNotEmpty()
  @IsString()
  studentId: string;

  @IsOptional()
  @IsString()
  decisionId?: string;

  @IsNotEmpty()
  @IsEnum(InterventionAction)
  action: InterventionAction; // APPROVE, OVERRIDE, INTERVENE

  @IsOptional()
  @IsString()
  feedback?: string;

  @IsOptional()
  overrideDetails?: {
    forcedActivityType?: ActivityType;
    forcedDifficulty?: number;
    forcedModality?: Modality;
    forcedPacing?: Pacing;
    teacherNotes?: string;
  };
}
