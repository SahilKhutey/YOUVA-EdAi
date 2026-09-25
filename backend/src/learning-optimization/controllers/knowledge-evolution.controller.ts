import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Headers,
} from '@nestjs/common';
import { KnowledgeEvolutionService } from '../services/knowledge-evolution.service';
import { RollbackPlan } from '../policies/rollback-policy';

@Controller('api/v1/learning-optimization/knowledge')
export class KnowledgeEvolutionController {
  constructor(private readonly evolutionService: KnowledgeEvolutionService) {}

  @Get(':id/evolution')
  async getEvolution(
    @Param('id') id: string,
    @Headers('x-tenant-id') tenantId = 'default-tenant',
  ) {
    return this.evolutionService.getKnowledgeEvolution(id, tenantId);
  }

  @Get(':id/provenance/:version')
  async getProvenance(
    @Param('id') id: string,
    @Param('version') version: string,
    @Headers('x-tenant-id') tenantId = 'default-tenant',
  ) {
    return this.evolutionService.getVersionProvenance(id, parseInt(version, 10), tenantId);
  }

  @Post(':id/rollback')
  async rollbackVersion(
    @Param('id') id: string,
    @Body() plan: RollbackPlan,
    @Headers('x-tenant-id') tenantId = 'default-tenant',
  ) {
    return this.evolutionService.rollbackKnowledgeVersion(id, plan, tenantId);
  }
}
