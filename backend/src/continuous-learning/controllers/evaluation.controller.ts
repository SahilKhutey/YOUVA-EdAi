import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { EvolutionEvaluationDto } from '../domain/evolution.types';
import { ContinuousEvaluationService } from '../evaluation/continuous-evaluation.service';

@Controller('api/v1/continuous-learning/evaluations')
export class EvaluationController {
  constructor(private readonly evaluationService: ContinuousEvaluationService) {}

  @Post()
  async createEvaluation(@Body() dto: any): Promise<EvolutionEvaluationDto> {
    return this.evaluationService.createEvaluation(dto);
  }

  @Get()
  async listEvaluations(@Query('tenantId') tenantId?: string): Promise<EvolutionEvaluationDto[]> {
    return this.evaluationService.listEvaluations(tenantId);
  }

  @Get(':id')
  async getEvaluation(@Param('id') id: string): Promise<EvolutionEvaluationDto> {
    return this.evaluationService.getEvaluation(id);
  }
}
