import { IsString, IsOptional } from 'class-validator';

export class StartSessionDto {
  @IsOptional()
  @IsString()
  knowledgeVersionId?: string;
}
