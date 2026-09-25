import {
  Body,
  Controller,
  Get,
  Post,
  Query,
} from '@nestjs/common';
import {
  AssuranceEvaluationDto,
  AssuranceGate,
  AssuranceOverviewDto,
  EvaluateTargetDto,
  ExecutionGateResult,
} from '../domain/assurance.types';
import { AssuranceEvaluationService } from '../services/assurance-evaluation.service';
import { AssuranceGatesService } from '../services/assurance-gates.service';
import { FindingService } from '../services/finding.service';

@Controller('api/v1/assurance')
export class AssuranceController {
  constructor(
    private readonly evaluationService: AssuranceEvaluationService,
    private readonly gatesService: AssuranceGatesService,
    private readonly findingService: FindingService,
  ) {}

  @Get('overview')
  async getOverview(@Query('tenantId') tenantId?: string): Promise<AssuranceOverviewDto> {
    return this.findingService.getOverview(tenantId);
  }

  @Post('evaluate')
  async evaluateTarget(@Body() dto: EvaluateTargetDto): Promise<AssuranceEvaluationDto> {
    return this.evaluationService.evaluateTarget(dto);
  }

  @Post('gates/publication')
  async evaluatePublicationGate(
    @Body('targetType') targetType: string,
    @Body('targetId') targetId: string,
    @Body('payload') payload?: any,
  ): Promise<AssuranceGate> {
    return this.gatesService.evaluatePublicationGate(targetType, targetId, payload);
  }

  @Post('gates/execution')
  evaluateExecutionGate(
    @Body('orchestrationId') orchestrationId: string,
    @Body('gateParams') gateParams: any,
  ): ExecutionGateResult {
    return this.gatesService.evaluateExecutionGate(orchestrationId, gateParams);
  }
}
