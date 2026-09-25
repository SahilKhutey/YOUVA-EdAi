import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { CreateSnapshotDto, TwinSnapshotDto } from '../domain/twin.types';
import { SnapshotService } from '../snapshots/snapshot.service';

@Controller('api/v1/learning-twin/snapshots')
export class TwinSnapshotController {
  constructor(private readonly snapshotService: SnapshotService) {}

  @Post()
  async createSnapshot(@Body() dto: CreateSnapshotDto): Promise<TwinSnapshotDto> {
    return this.snapshotService.createSnapshot(dto);
  }

  @Get()
  async listSnapshots(@Query('tenantId') tenantId?: string): Promise<TwinSnapshotDto[]> {
    return this.snapshotService.listSnapshots(tenantId);
  }

  @Get(':id')
  async getSnapshot(@Param('id') id: string): Promise<TwinSnapshotDto> {
    return this.snapshotService.getSnapshot(id);
  }

  @Get(':id/validate')
  async validateSnapshot(@Param('id') id: string): Promise<{
    valid: boolean;
    checksumValid: boolean;
    isStale: boolean;
    reason?: string;
  }> {
    return this.snapshotService.validateSnapshot(id);
  }
}
