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
import { ImprovementService } from './improvement.service';
import { ImprovementProposalDto } from './improvement.types';
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

@Controller(['v1/learning-os/improvements', 'learning-os/improvements'])
export class ImprovementController {
  constructor(private readonly improvementService: ImprovementService) {}

  @Get('proposals')
  @UseGuards(JwtAuthGuard)
  async listProposals(
    @Query('status') status?: string,
    @Query('tenantId') tenantId?: string,
    @Query('limit') limit?: string,
  ) {
    return this.improvementService.listProposals({
      status,
      tenantId,
      limit: limit ? parseInt(limit, 10) : 50,
    });
  }

  @Post('proposals')
  @UseGuards(JwtAuthGuard)
  async createProposal(
    @Body() dto: ImprovementProposalDto,
    @Req() req: AuthenticatedRequest,
  ) {
    const userId = req.user?.sub || req.user?.id || 'system-analytics';
    return this.improvementService.createProposal({
      ...dto,
      proposedBy: userId,
    });
  }

  @Get('proposals/:id')
  @UseGuards(JwtAuthGuard)
  async getProposal(@Param('id') id: string) {
    return this.improvementService.getProposal(id);
  }

  @Post('proposals/:id/approve')
  @UseGuards(JwtAuthGuard)
  async approveProposal(
    @Param('id') id: string,
    @Req() req: AuthenticatedRequest,
  ) {
    const approver = req.user?.sub || req.user?.id || 'governance-lead';
    return this.improvementService.approveProposal(id, approver);
  }

  @Post('proposals/:id/reject')
  @UseGuards(JwtAuthGuard)
  async rejectProposal(
    @Param('id') id: string,
    @Body('reason') reason: string,
    @Req() req: AuthenticatedRequest,
  ) {
    const rejecter = req.user?.sub || req.user?.id || 'governance-lead';
    return this.improvementService.rejectProposal(id, rejecter, reason || 'Rejected during review');
  }

  @Get('experiments/:experimentId/gate')
  @UseGuards(JwtAuthGuard)
  async checkExperimentGate(
    @Param('experimentId') experimentId: string,
    @Query('riskLevel') riskLevel?: string,
  ) {
    return this.improvementService.evaluateExperimentGate(experimentId, riskLevel || 'LOW');
  }
}
