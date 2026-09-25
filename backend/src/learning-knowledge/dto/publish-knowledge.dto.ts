import { IsOptional, IsString } from 'class-validator';

export class PublishKnowledgeDto {
  @IsOptional()
  @IsString()
  notes?: string;
}
