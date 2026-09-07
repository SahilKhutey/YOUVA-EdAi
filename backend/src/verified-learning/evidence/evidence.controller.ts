import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Request } from 'express';
import { EvidenceService } from './evidence.service';
import { EvidenceCorrectionDto, EvidenceProvenanceDto } from './evidence.types';
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

@Controller(['v1/evidence', 'evidence'])
export class EvidenceController {
  constructor(private readonly evidenceService: EvidenceService) {}

  @Post('provenance')
  @UseGuards(JwtAuthGuard)
  async recordProvenance(@Body() dto: EvidenceProvenanceDto) {
    return this.evidenceService.recordProvenance(dto);
  }

  @Get(':id/provenance')
  @UseGuards(JwtAuthGuard)
  async getProvenance(@Param('id') id: string) {
    return this.evidenceService.getProvenance(id);
  }

  @Post(':id/corrections')
  @UseGuards(JwtAuthGuard)
  async requestCorrection(
    @Param('id') id: string,
    @Body() body: { reason: string; replacementId?: string },
    @Req() req: AuthenticatedRequest,
  ) {
    const userId = req.user?.sub || req.user?.id || 'auditor';
    return this.evidenceService.requestCorrection(
      {
        evidenceId: id,
        reason: body.reason,
        replacementId: body.replacementId,
      },
      userId,
    );
  }
}
