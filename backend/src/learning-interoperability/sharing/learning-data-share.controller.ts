import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Req,
  UseGuards,
  ForbiddenException,
} from '@nestjs/common';
import { Request } from 'express';
import { LearningExportService } from './learning-export.service';
import { CreateDataShareDto } from './data-sharing.types';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';

interface AuthenticatedRequest extends Request {
  user?: {
    id?: string;
    sub?: string;
    userId?: string;
    tenantId?: string;
    role?: string;
  };
}

@Controller(['api/v1/data-shares', 'v1/data-shares', 'data-shares'])
export class LearningDataShareController {
  constructor(private readonly exportService: LearningExportService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  async createShareRequest(
    @Req() req: AuthenticatedRequest,
    @Body() dto: CreateDataShareDto,
  ) {
    const learnerId = req.user?.sub || req.user?.userId || req.user?.id;
    const tenantId = req.user?.tenantId || 'default-tenant';
    if (!learnerId) throw new ForbiddenException('Authentication required.');
    return this.exportService.createShare(learnerId, tenantId, dto);
  }

  @Post(':id/approve')
  @UseGuards(JwtAuthGuard)
  async approveShare(
    @Param('id') id: string,
    @Req() req: AuthenticatedRequest,
  ) {
    const approverId = req.user?.sub || req.user?.userId || req.user?.id || 'admin';
    return this.exportService.approveShare(id, approverId);
  }

  @Post(':id/revoke')
  @UseGuards(JwtAuthGuard)
  async revokeShare(
    @Param('id') id: string,
  ) {
    return this.exportService.revokeShare(id);
  }

  @Get(':id/export')
  @UseGuards(JwtAuthGuard)
  async exportData(
    @Param('id') id: string,
    @Req() req: AuthenticatedRequest,
  ) {
    const learnerId = req.user?.sub || req.user?.userId || req.user?.id;
    if (!learnerId) throw new ForbiddenException('Authentication required.');
    return this.exportService.exportLearnerData(id, learnerId);
  }
}
