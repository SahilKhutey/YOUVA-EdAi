import {
  Controller,
  Get,
  Param,
  Req,
  UseGuards,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { Request } from 'express';
import { UnifiedLearnerSnapshotService } from './unified-learner-snapshot.service';
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

@Controller(['api/v1/learner-record', 'v1/learner-record', 'learner-record'])
export class LearnerRecordController {
  constructor(
    private readonly snapshotService: UnifiedLearnerSnapshotService,
  ) {}

  @Get('me')
  @UseGuards(JwtAuthGuard)
  async getMyRecord(@Req() req: AuthenticatedRequest) {
    const learnerId = req.user?.sub || req.user?.userId || req.user?.id;
    const tenantId = req.user?.tenantId || 'default-tenant';
    if (!learnerId) {
      throw new ForbiddenException('User authentication required.');
    }

    const snapshot = await this.snapshotService.getLatest(learnerId, tenantId);
    if (!snapshot) {
      return this.snapshotService.rebuildSnapshot(learnerId, tenantId);
    }
    return snapshot;
  }

  @Get(':learnerId')
  @UseGuards(JwtAuthGuard)
  async getLearnerRecord(
    @Param('learnerId') learnerId: string,
    @Req() req: AuthenticatedRequest,
  ) {
    const tenantId = req.user?.tenantId || 'default-tenant';
    const snapshot = await this.snapshotService.getLatest(learnerId, tenantId);
    if (!snapshot) {
      throw new NotFoundException(`Learner record not found for learner ${learnerId}`);
    }
    return snapshot;
  }

  @Get(':learnerId/mastery')
  @UseGuards(JwtAuthGuard)
  async getLearnerMastery(
    @Param('learnerId') learnerId: string,
    @Req() req: AuthenticatedRequest,
  ) {
    const tenantId = req.user?.tenantId || 'default-tenant';
    const snapshot = await this.snapshotService.getLatest(learnerId, tenantId);
    if (!snapshot) return { mastery: [] };
    const parsed = JSON.parse(snapshot.snapshotJson);
    return { mastery: parsed.learning?.mastery || [] };
  }

  @Get(':learnerId/competencies')
  @UseGuards(JwtAuthGuard)
  async getLearnerCompetencies(
    @Param('learnerId') learnerId: string,
    @Req() req: AuthenticatedRequest,
  ) {
    const tenantId = req.user?.tenantId || 'default-tenant';
    const snapshot = await this.snapshotService.getLatest(learnerId, tenantId);
    if (!snapshot) return { competencies: [] };
    const parsed = JSON.parse(snapshot.snapshotJson);
    return { competencies: parsed.learning?.competencies || [] };
  }

  @Get(':learnerId/evidence')
  @UseGuards(JwtAuthGuard)
  async getLearnerEvidence(
    @Param('learnerId') learnerId: string,
    @Req() req: AuthenticatedRequest,
  ) {
    const tenantId = req.user?.tenantId || 'default-tenant';
    const snapshot = await this.snapshotService.getLatest(learnerId, tenantId);
    if (!snapshot) return { evidence: [] };
    const parsed = JSON.parse(snapshot.snapshotJson);
    return { evidence: parsed.evidence || { recent: [], confidence: 0 } };
  }

  @Get(':learnerId/pathway')
  @UseGuards(JwtAuthGuard)
  async getLearnerPathway(
    @Param('learnerId') learnerId: string,
    @Req() req: AuthenticatedRequest,
  ) {
    const tenantId = req.user?.tenantId || 'default-tenant';
    const snapshot = await this.snapshotService.getLatest(learnerId, tenantId);
    if (!snapshot) return { pathway: null };
    const parsed = JSON.parse(snapshot.snapshotJson);
    return { pathway: parsed.pathway || null };
  }

  @Get(':learnerId/provenance')
  @UseGuards(JwtAuthGuard)
  async getLearnerProvenance(
    @Param('learnerId') learnerId: string,
    @Req() req: AuthenticatedRequest,
  ) {
    const tenantId = req.user?.tenantId || 'default-tenant';
    const snapshot = await this.snapshotService.getLatest(learnerId, tenantId);
    if (!snapshot) throw new NotFoundException('Snapshot not found.');
    return {
      version: snapshot.version,
      sourceEventId: snapshot.sourceEventId,
      generatedAt: snapshot.generatedAt,
    };
  }
}
