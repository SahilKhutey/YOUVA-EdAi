import {
  Body,
  Controller,
  Get,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { OutcomeService } from './outcome.service';
import { RecordOutcomeDto } from './outcome.types';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';

@Controller(['v1/learning-os/outcomes', 'learning-os/outcomes'])
export class OutcomeController {
  constructor(private readonly outcomeService: OutcomeService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  async recordOutcome(@Body() dto: RecordOutcomeDto) {
    return this.outcomeService.recordOutcome(dto);
  }

  @Get('learner')
  @UseGuards(JwtAuthGuard)
  async getLearnerOutcomes(
    @Query('learnerId') learnerId: string,
    @Query('tenantId') tenantId?: string,
  ) {
    return this.outcomeService.getLearnerOutcomes(learnerId, tenantId);
  }

  @Get('concept')
  @UseGuards(JwtAuthGuard)
  async getConceptOutcomes(
    @Query('conceptId') conceptId: string,
    @Query('tenantId') tenantId?: string,
  ) {
    return this.outcomeService.getConceptOutcomes(conceptId, tenantId);
  }

  @Get('cohort')
  @UseGuards(JwtAuthGuard)
  async getCohortBenchmark(
    @Query('tenantId') tenantId: string,
    @Query('metric') metric?: string,
    @Query('minGroupSize') minGroupSize?: string,
  ) {
    const minSize = minGroupSize ? parseInt(minGroupSize, 10) : 20;
    return this.outcomeService.getCohortBenchmark(tenantId, metric || 'masteryGain', minSize);
  }
}
