import { Controller, Get, Post, Body, Query, HttpCode, HttpStatus } from '@nestjs/common';
import { PilotEvidenceService, PilotEvidenceScorecard, FrozenPilotSnapshot } from './pilot-evidence.service';
import { PilotDataQualityService, PilotDataSnapshot, DataQualityAuditReport } from './pilot-data-quality.service';

@Controller('pilot')
export class PilotEvidenceController {
  constructor(
    private readonly evidenceService: PilotEvidenceService,
    private readonly dataQualityService: PilotDataQualityService,
  ) {}

  @Get('evidence')
  @HttpCode(HttpStatus.OK)
  getEvidence(
    @Query('tenantId') tenantId?: string,
    @Query('mode') mode?: 'REAL_TIME_OPERATIONAL' | 'FROZEN_VALIDATED_EVALUATION',
  ): PilotEvidenceScorecard {
    return this.evidenceService.getEvidenceScorecard(
      tenantId || 'tenant-modern-school',
      mode || 'REAL_TIME_OPERATIONAL',
    );
  }

  @Post('freeze')
  @HttpCode(HttpStatus.CREATED)
  freezeDataset(
    @Body('commitSha') commitSha: string,
    @Body('tenantId') tenantId?: string,
  ): FrozenPilotSnapshot {
    return this.evidenceService.freezeEvaluationDataset(
      commitSha || 'ca77906',
      tenantId || 'tenant-modern-school',
    );
  }

  @Post('data-quality/validate')
  @HttpCode(HttpStatus.OK)
  validateDataQuality(
    @Body() snapshot?: PilotDataSnapshot,
  ): DataQualityAuditReport {
    // If snapshot not provided, evaluate against nominal pilot dataset
    const safeSnapshot: PilotDataSnapshot = snapshot?.learners ? snapshot : {
      learners: [
        { id: 'learner-01', tenantId: 'tenant-modern-school', name: 'Aarav Gupta', hasActiveConsent: true },
        { id: 'learner-02', tenantId: 'tenant-modern-school', name: 'Diya Sharma', hasActiveConsent: true },
      ],
      sessions: [
        { id: 'sess-01', tenantId: 'tenant-modern-school', learnerId: 'learner-01', state: 'COMPLETED', startedAt: new Date(Date.now() - 3600000), completedAt: new Date() },
        { id: 'sess-02', tenantId: 'tenant-modern-school', learnerId: 'learner-02', state: 'COMPLETED', startedAt: new Date(Date.now() - 3600000), completedAt: new Date() },
      ],
      attempts: [
        { id: 'att-01', tenantId: 'tenant-modern-school', sessionId: 'sess-01', learnerId: 'learner-01', questionId: 'q-rn-01', score: 1, submittedAt: new Date(Date.now() - 1800000) },
        { id: 'att-02', tenantId: 'tenant-modern-school', sessionId: 'sess-02', learnerId: 'learner-02', questionId: 'q-rn-01', score: 1, submittedAt: new Date(Date.now() - 1800000) },
      ],
      masteries: [
        { id: 'mst-01', tenantId: 'tenant-modern-school', learnerId: 'learner-01', topicId: 'topic-rn', masteryScore: 0.82, updatedAt: new Date() },
        { id: 'mst-02', tenantId: 'tenant-modern-school', learnerId: 'learner-02', topicId: 'topic-rn', masteryScore: 0.79, updatedAt: new Date() },
      ],
      consents: [
        { id: 'con-01', tenantId: 'tenant-modern-school', learnerId: 'learner-01', parentPhone: '+919810011223', status: 'ACTIVE', grantedAt: new Date(Date.now() - 86400000) },
        { id: 'con-02', tenantId: 'tenant-modern-school', learnerId: 'learner-02', parentPhone: '+919810011224', status: 'ACTIVE', grantedAt: new Date(Date.now() - 86400000) },
      ],
      auditRecords: [
        { id: 'aud-01', tenantId: 'tenant-modern-school', resourceType: 'SESSION', resourceId: 'sess-01', previousHash: 'GENESIS', contentHash: 'c1', hash: 'h1', createdAt: new Date() },
      ],
    };

    return this.dataQualityService.evaluateDataQuality(safeSnapshot);
  }
}
