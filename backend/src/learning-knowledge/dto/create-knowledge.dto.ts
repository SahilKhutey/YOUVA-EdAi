import {
  IsString,
  MinLength,
  MaxLength,
  IsOptional,
  IsIn,
  IsArray,
} from 'class-validator';
import { KNOWLEDGE_OBJECT_TYPES } from '../types/knowledge.types';

export class CreateKnowledgeDto {
  @IsIn(KNOWLEDGE_OBJECT_TYPES)
  type!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(200)
  title!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(500)
  slug!: string;

  @IsOptional()
  @IsString()
  @MaxLength(5000)
  description?: string;

  @IsOptional()
  @IsString()
  subjectId?: string;

  @IsOptional()
  @IsString()
  topicId?: string;

  @IsOptional()
  @IsString()
  parentId?: string;

  @IsString()
  content!: string;

  @IsArray()
  @IsString({ each: true })
  learningObjectives!: string[];

  @IsArray()
  @IsString({ each: true })
  prerequisites!: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];
}
