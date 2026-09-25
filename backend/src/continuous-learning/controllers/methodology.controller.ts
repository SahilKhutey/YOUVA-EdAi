import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
} from '@nestjs/common';
import {
  CreateMethodologyDto,
  MethodologyStatus,
  MethodologyVersionDto,
} from '../domain/evolution.types';
import { MethodologyRegistryService } from '../registry/methodology-registry.service';

@Controller('api/v1/continuous-learning/methodologies')
export class MethodologyController {
  constructor(private readonly registryService: MethodologyRegistryService) {}

  @Post()
  async createMethodology(
    @Body() dto: CreateMethodologyDto,
  ): Promise<MethodologyVersionDto> {
    return this.registryService.createMethodology(dto);
  }

  @Get()
  async listMethodologies(
    @Query('tenantId') tenantId?: string,
    @Query('status') status?: MethodologyStatus,
  ): Promise<MethodologyVersionDto[]> {
    return this.registryService.listMethodologies(tenantId, status);
  }

  @Get(':id')
  async getMethodology(@Param('id') id: string): Promise<MethodologyVersionDto> {
    return this.registryService.getMethodology(id);
  }

  @Post(':id/promote')
  async promoteMethodology(
    @Param('id') id: string,
    @Body('targetStatus') targetStatus: MethodologyStatus,
  ): Promise<MethodologyVersionDto> {
    return this.registryService.promoteMethodology(id, targetStatus);
  }

  @Post(':id/deprecate')
  async deprecateMethodology(@Param('id') id: string): Promise<MethodologyVersionDto> {
    return this.registryService.deprecateMethodology(id);
  }

  @Post('shadow-compare')
  async runShadowComparison(
    @Body()
    body: {
      activeMethodologyId: string;
      candidateMethodologyId: string;
      input: any;
    },
  ) {
    return this.registryService.runShadowComparison(
      body.activeMethodologyId,
      body.candidateMethodologyId,
      body.input,
    );
  }
}
