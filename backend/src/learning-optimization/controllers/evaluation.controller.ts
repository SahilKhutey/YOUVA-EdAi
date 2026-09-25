import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Headers,
} from '@nestjs/common';
import { EvaluationService, EvaluationInputDto } from '../services/evaluation.service';
import { OutcomeService } from '../services/outcome.service';

@Controller('api/v1/learning-optimization/plans')
export class EvaluationController {
  constructor(
    private readonly evaluationService: EvaluationService,
    private readonly outcomeService: OutcomeService,
  ) {}

  @Post(':id/evaluate')
  async evaluatePlan(
    @Param('id') id: string,
    @Body() dto: Omit<EvaluationInputDto, 'planId'>,
    @Headers('x-tenant-id') tenantId = 'default-tenant',
  ) {
    return this.evaluationService.evaluatePlan(
      {
        planId: id,
        ...dto,
      },
      tenantId,
    );
  }

  @Get(':id/outcomes')
  async getOutcomes(
    @Param('id') id: string,
    @Headers('x-tenant-id') tenantId = 'default-tenant',
  ) {
    return this.outcomeService.getOutcomesForPlan(id, tenantId);
  }
}
