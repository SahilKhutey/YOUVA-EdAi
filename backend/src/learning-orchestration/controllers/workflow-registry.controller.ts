import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
} from '@nestjs/common';
import {
  OrchestrationScope,
  WorkflowDefinitionDto,
} from '../domain/orchestration.types';
import { WorkflowRegistryService } from '../workflows/workflow-registry.service';

@Controller('api/v1/learning-orchestration/workflows')
export class WorkflowRegistryController {
  constructor(private readonly registryService: WorkflowRegistryService) {}

  @Get()
  async listWorkflows(
    @Query('scope') scope?: OrchestrationScope,
    @Query('status') status?: string,
  ): Promise<WorkflowDefinitionDto[]> {
    return this.registryService.listWorkflows({ scope, status });
  }

  @Get(':key/:version')
  async getWorkflow(
    @Param('key') key: string,
    @Param('version') version: string,
  ): Promise<WorkflowDefinitionDto | null> {
    return this.registryService.getWorkflow(key, version);
  }

  @Post()
  async registerWorkflow(
    @Body() dto: WorkflowDefinitionDto,
  ): Promise<WorkflowDefinitionDto> {
    return this.registryService.registerWorkflow(dto);
  }
}
