import { IsNotEmpty, IsString, IsEnum, IsOptional } from 'class-validator';

export class ResolveInterventionDto {
  @IsNotEmpty()
  @IsString()
  resolutionNotes: string;

  @IsOptional()
  @IsString()
  pedagogicalActionTaken?: string;
}
