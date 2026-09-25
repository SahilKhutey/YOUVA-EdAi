import {
  IsString,
  IsIn,
  IsInt,
  Min,
  IsOptional,
} from 'class-validator';
import { KNOWLEDGE_EVENT_TYPES } from '../types/knowledge.types';

export class CreateKnowledgeEventDto {
  @IsString()
  knowledgeObjectId!: string;

  @IsInt()
  @Min(1)
  knowledgeVersion!: number;

  @IsIn(KNOWLEDGE_EVENT_TYPES)
  eventType!: string;

  @IsOptional()
  @IsString()
  clientEventId?: string;

  @IsOptional()
  @IsString()
  metadata?: string;
}
