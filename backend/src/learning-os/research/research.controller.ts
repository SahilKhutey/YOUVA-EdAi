import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Request } from 'express';
import { ResearchService } from './research.service';
import { CreateResearchDatasetDto } from './research.types';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';

interface AuthenticatedRequest extends Request {
  user?: {
    id?: string;
    sub?: string;
    userId?: string;
    role?: string;
    email?: string;
  };
}

@Controller(['v1/learning-os/research', 'learning-os/research'])
export class ResearchController {
  constructor(private readonly researchService: ResearchService) {}

  @Get('datasets')
  @UseGuards(JwtAuthGuard)
  async listDatasets(
    @Query('status') status?: string,
    @Query('limit') limit?: string,
  ) {
    return this.researchService.listDatasets({
      status,
      limit: limit ? parseInt(limit, 10) : 50,
    });
  }

  @Post('datasets')
  @UseGuards(JwtAuthGuard)
  async createDataset(@Body() dto: CreateResearchDatasetDto) {
    return this.researchService.createDataset(dto);
  }

  @Post('datasets/:id/approve')
  @UseGuards(JwtAuthGuard)
  async approveDataset(
    @Param('id') id: string,
    @Req() req: AuthenticatedRequest,
  ) {
    const approver = req.user?.sub || req.user?.id || 'irb-officer';
    return this.researchService.approveDataset(id, approver);
  }

  @Post('datasets/:id/export')
  @UseGuards(JwtAuthGuard)
  async exportAnonymized(
    @Param('id') id: string,
    @Body('evidenceList') evidenceList: any[],
  ) {
    return this.researchService.exportAnonymizedRecords(id, evidenceList || []);
  }
}
