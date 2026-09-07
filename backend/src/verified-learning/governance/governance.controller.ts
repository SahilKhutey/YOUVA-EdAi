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
import { GovernanceService } from './governance.service';
import { GovernanceDecisionDto } from './governance.types';
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

@Controller(['v1/verified-learning/governance', 'verified-learning/governance'])
export class GovernanceController {
  constructor(private readonly governanceService: GovernanceService) {}

  @Post('decisions')
  @UseGuards(JwtAuthGuard)
  async recordDecision(
    @Body() dto: Omit<GovernanceDecisionDto, 'reviewerId'>,
    @Req() req: AuthenticatedRequest,
  ) {
    const reviewerId = req.user?.sub || req.user?.id || 'governance-board';
    return this.governanceService.recordDecision({
      ...dto,
      reviewerId,
    });
  }

  @Get('decisions')
  @UseGuards(JwtAuthGuard)
  async getDecisions(
    @Query('type') type: string,
    @Query('id') id: string,
  ) {
    return this.governanceService.getDecisionsForResource(type, id);
  }

  @Get('proof/:learnerId/:conceptId')
  @UseGuards(JwtAuthGuard)
  async getProof(
    @Param('learnerId') learnerId: string,
    @Param('conceptId') conceptId: string,
  ) {
    return this.governanceService.generateLearningProof(learnerId, conceptId);
  }
}
