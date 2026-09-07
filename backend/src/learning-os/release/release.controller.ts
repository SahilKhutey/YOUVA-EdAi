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
import { ReleaseService } from './release.service';
import { CreateReleaseArtifactDto, ReleaseValidation } from './release.types';
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

@Controller(['v1/learning-os/releases', 'learning-os/releases'])
export class ReleaseController {
  constructor(private readonly releaseService: ReleaseService) {}

  @Get('artifacts')
  @UseGuards(JwtAuthGuard)
  async listArtifacts(
    @Query('status') status?: string,
    @Query('artifactType') artifactType?: string,
    @Query('limit') limit?: string,
  ) {
    return this.releaseService.listArtifacts({
      status,
      artifactType,
      limit: limit ? parseInt(limit, 10) : 50,
    });
  }

  @Post('artifacts')
  @UseGuards(JwtAuthGuard)
  async registerArtifact(@Body() dto: CreateReleaseArtifactDto) {
    return this.releaseService.registerArtifact(dto);
  }

  @Post(':id/validate')
  @UseGuards(JwtAuthGuard)
  async validateArtifact(
    @Param('id') id: string,
    @Body() validation: ReleaseValidation,
  ) {
    return this.releaseService.validateArtifact(id, validation);
  }

  @Post(':id/canary')
  @UseGuards(JwtAuthGuard)
  async promoteCanary(@Param('id') id: string) {
    return this.releaseService.promoteToCanary(id);
  }

  @Post(':id/activate')
  @UseGuards(JwtAuthGuard)
  async activateArtifact(
    @Param('id') id: string,
    @Req() req: AuthenticatedRequest,
  ) {
    const approver = req.user?.sub || req.user?.id || 'release-engineer';
    return this.releaseService.activateArtifact(id, approver);
  }

  @Post(':id/rollback')
  @UseGuards(JwtAuthGuard)
  async rollbackArtifact(
    @Param('id') id: string,
    @Body('reason') reason: string,
  ) {
    return this.releaseService.rollbackArtifact(id, reason || 'Anomalies detected in production');
  }
}
