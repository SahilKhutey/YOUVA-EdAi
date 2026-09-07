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
import { ClaimService } from './claim.service';
import { ClaimVerification, CreateClaimDto } from './claim.types';
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

@Controller(['v1/verified-learning/claims', 'verified-learning/claims'])
export class ClaimController {
  constructor(private readonly claims: ClaimService) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  async listClaims(
    @Query('status') status?: string,
    @Query('type') type?: string,
    @Query('limit') limit?: string,
  ) {
    return this.claims.listClaims({
      status,
      claimType: type,
      limit: limit ? parseInt(limit, 10) : 50,
    });
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  async createClaim(
    @Body() dto: CreateClaimDto,
    @Req() req: AuthenticatedRequest,
  ) {
    const creator = req.user?.sub || req.user?.id || 'researcher';
    return this.claims.createClaim(dto, creator);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  async getClaim(@Param('id') id: string) {
    return this.claims.getClaim(id);
  }

  @Get(':id/evidence')
  @UseGuards(JwtAuthGuard)
  async getEvidence(@Param('id') id: string) {
    return this.claims.getEvidence(id);
  }

  @Post(':id/verify')
  @UseGuards(JwtAuthGuard)
  async verifyClaim(
    @Param('id') id: string,
    @Body() body: Omit<ClaimVerification, 'claimId'>,
  ) {
    return this.claims.verifyClaim({
      ...body,
      claimId: id,
    });
  }
}
