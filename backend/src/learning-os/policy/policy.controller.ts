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
import { PolicyService } from './policy.service';
import { LearningPolicyContext } from './policy.types';
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

@Controller(['v1/learning-os/policies', 'learning-os/policies'])
export class PolicyController {
  constructor(private readonly policyService: PolicyService) {}

  @Get('active')
  @UseGuards(JwtAuthGuard)
  async getActivePolicy(@Query('policyKey') policyKey?: string) {
    return this.policyService.getActivePolicy(policyKey || 'GLOBAL_LEARNING_POLICY');
  }

  @Post('versions')
  @UseGuards(JwtAuthGuard)
  async createVersion(
    @Body()
    body: {
      policyKey: string;
      version: string;
      definition: string;
    },
  ) {
    return this.policyService.createPolicyVersion(
      body.policyKey,
      body.version,
      body.definition,
    );
  }

  @Post('versions/:id/approve')
  @UseGuards(JwtAuthGuard)
  async approveVersion(
    @Param('id') id: string,
    @Req() req: AuthenticatedRequest,
  ) {
    const approver = req.user?.sub || req.user?.id || 'compliance-officer';
    return this.policyService.approvePolicyVersion(id, approver);
  }

  @Post('evaluate')
  @UseGuards(JwtAuthGuard)
  async evaluatePolicy(@Body() context: LearningPolicyContext) {
    return this.policyService.evaluateContext(context);
  }
}
