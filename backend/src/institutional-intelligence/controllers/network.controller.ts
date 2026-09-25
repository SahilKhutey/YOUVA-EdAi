import {
  Controller,
  Get,
  Param,
  Query,
  Headers,
} from '@nestjs/common';
import { KnowledgeNetworkService } from '../services/knowledge-network.service';

@Controller('api/v1/institutional-intelligence/network')
export class NetworkController {
  constructor(private readonly networkService: KnowledgeNetworkService) {}

  @Get()
  async getNetwork(
    @Query('rootId') rootId = 'root',
    @Query('depth') depth?: string,
    @Headers('x-tenant-id') tenantId = 'default-tenant',
  ) {
    const parsedDepth = depth ? parseInt(depth, 10) : 2;
    return this.networkService.getBoundedNetwork(rootId, parsedDepth, tenantId);
  }

  @Get(':entityType/:entityId')
  async getEntityNetwork(
    @Param('entityType') entityType: string,
    @Param('entityId') entityId: string,
    @Query('depth') depth?: string,
    @Headers('x-tenant-id') tenantId = 'default-tenant',
  ) {
    const parsedDepth = depth ? parseInt(depth, 10) : 2;
    return this.networkService.getBoundedNetwork(entityId, parsedDepth, tenantId);
  }
}
