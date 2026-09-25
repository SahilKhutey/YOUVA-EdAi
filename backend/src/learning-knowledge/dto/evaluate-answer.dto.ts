import { IsString, IsInt, Min, IsOptional, IsBoolean } from 'class-validator';

export class EvaluateAnswerDto {
  @IsString()
  knowledgeObjectId!: string;

  @IsInt()
  @Min(1)
  knowledgeVersion!: number;

  @IsString()
  questionId!: string;

  @IsString()
  submittedAnswer!: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  attempt?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  latencyMs?: number;

  @IsOptional()
  @IsBoolean()
  hintUsed?: boolean;

  @IsOptional()
  @IsString()
  clientEventId?: string;
}
