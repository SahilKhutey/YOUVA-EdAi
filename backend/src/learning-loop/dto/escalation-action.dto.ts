import { IsNotEmpty, IsString, IsEnum, IsOptional } from 'class-validator';
import { EscalationStatus, EscalationSeverity } from '../domain/enums';

export class ResolveEscalationDto {
  @IsNotEmpty()
  @IsEnum(EscalationStatus)
  status: EscalationStatus; // Typically IN_REVIEW or RESOLVED

  @IsNotEmpty()
  @IsString()
  resolutionNotes: string;
}

export class TriggerEscalationDto {
  @IsNotEmpty()
  @IsString()
  studentId: string;

  @IsNotEmpty()
  @IsEnum(EscalationSeverity)
  severity: EscalationSeverity;

  @IsNotEmpty()
  @IsString()
  reason: string;
}
