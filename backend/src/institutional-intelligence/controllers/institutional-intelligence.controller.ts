import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  Headers,
} from '@nestjs/common';
import { InstitutionalIntelligenceService } from '../services/institutional-intelligence.service';
import { SystemicInsightService, CreateSystemicInsightDto } from '../services/systemic-insight.service';
import { LearningPatternService } from '../services/learning-pattern.service';
import { LearningMemoryService, CreateMemoryDto } from '../services/learning-memory.service';
import { SystemicInsightStatus } from '../domain/systemic-insight';
import { PatternStatus } from '../domain/learning-pattern';

@Controller('api/v1/institutional-intelligence')
export class InstitutionalIntelligenceController {
  constructor(
    private readonly masterService: InstitutionalIntelligenceService,
    private readonly insightService: SystemicInsightService,
    private readonly patternService: LearningPatternService,
    private readonly memoryService: LearningMemoryService,
  ) {}

  @Get('overview')
  async getOverview(@Headers('x-tenant-id') tenantId = 'default-tenant') {
    return this.masterService.getOverview(tenantId);
  }

  @Get('insights')
  async listInsights(
    @Query('status') status?: SystemicInsightStatus,
    @Headers('x-tenant-id') tenantId = 'default-tenant',
  ) {
    return this.insightService.listInsights(tenantId, status);
  }

  @Get('insights/:id')
  async getInsight(
    @Param('id') id: string,
    @Headers('x-tenant-id') tenantId = 'default-tenant',
  ) {
    return this.insightService.getInsight(id, tenantId);
  }

  @Post('insights')
  async createInsight(
    @Body() dto: CreateSystemicInsightDto,
    @Headers('x-tenant-id') tenantId = 'default-tenant',
  ) {
    return this.insightService.createInsight(dto, tenantId);
  }

  @Get('patterns')
  async listPatterns(
    @Query('status') status?: PatternStatus,
    @Headers('x-tenant-id') tenantId = 'default-tenant',
  ) {
    return this.patternService.listPatterns(tenantId, status);
  }

  @Get('memories')
  async listMemories(@Headers('x-tenant-id') tenantId = 'default-tenant') {
    return this.memoryService.getActiveMemories(tenantId);
  }

  @Post('memories')
  async createMemory(
    @Body() dto: CreateMemoryDto,
    @Headers('x-tenant-id') tenantId = 'default-tenant',
  ) {
    return this.memoryService.createMemory(dto, tenantId);
  }
}
