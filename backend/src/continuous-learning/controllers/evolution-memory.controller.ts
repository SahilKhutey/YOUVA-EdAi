import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import {
  CreateEvolutionMemoryDto,
  EvolutionMemoryDto,
  MemoryStatus,
} from '../domain/evolution.types';
import { EvolutionMemoryService } from '../memory/evolution-memory.service';

@Controller('api/v1/continuous-learning/memory')
export class EvolutionMemoryController {
  constructor(private readonly memoryService: EvolutionMemoryService) {}

  @Post()
  async createMemory(
    @Body() dto: CreateEvolutionMemoryDto,
  ): Promise<EvolutionMemoryDto> {
    return this.memoryService.createMemory(dto);
  }

  @Get()
  async listMemories(
    @Query('tenantId') tenantId?: string,
    @Query('status') status?: MemoryStatus,
  ): Promise<EvolutionMemoryDto[]> {
    return this.memoryService.listMemories(tenantId, status);
  }

  @Get(':id')
  async getMemory(@Param('id') id: string): Promise<EvolutionMemoryDto> {
    return this.memoryService.getMemory(id);
  }

  @Post(':id/revalidate')
  async revalidateMemory(@Param('id') id: string): Promise<EvolutionMemoryDto> {
    return this.memoryService.revalidateMemory(id);
  }
}
