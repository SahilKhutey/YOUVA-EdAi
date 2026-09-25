import {
  IsString,
  IsIn,
  IsOptional,
  IsNumber,
  Min,
  Max,
} from 'class-validator';
import { KNOWLEDGE_RELATIONS } from '../types/knowledge.types';

export class CreateRelationshipDto {
  @IsString()
  sourceId!: string;

  @IsString()
  targetId!: string;

  @IsIn(KNOWLEDGE_RELATIONS)
  relation!: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1)
  weight?: number;
}
