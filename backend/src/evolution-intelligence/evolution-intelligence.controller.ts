import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { LearningIntelligenceService } from './learning-intelligence.service';
import { ResearchEngineService } from './research-engine.service';
import { ContentIntelligenceService } from './content-intelligence.service';
import { AiTutorBenchmarkService } from './ai-tutor-benchmark.service';
import { EvolutionGovernanceService } from './evolution-governance.service';
import {
  ResearchTrackId,
  ModelPromotionStage,
  ContentLifecycleStage,
  RedTeamDomain,
} from './n17-types';

@Controller('api/v1/evolution')
export class EvolutionIntelligenceController {
  constructor(
    private readonly learningService: LearningIntelligenceService,
    private readonly researchService: ResearchEngineService,
    private readonly contentService: ContentIntelligenceService,
    private readonly tutorService: AiTutorBenchmarkService,
    private readonly governanceService: EvolutionGovernanceService,
  ) {}

  // --- LEARNING INTELLIGENCE ---

  @Get('clusters')
  getConceptDifficultyClusters() {
    return {
      success: true,
      data: this.learningService.getConceptDifficultyClusters(),
    };
  }

  @Get('retention/:learnerId/:conceptId')
  getRetentionRecord(
    @Param('learnerId') learnerId: string,
    @Param('conceptId') conceptId: string,
  ) {
    return {
      success: true,
      data: this.learningService.getRetentionTransferRecord(learnerId, conceptId),
    };
  }

  @Post('retention/evaluate')
  evaluateRetentionAndTransfer(
    @Body()
    body: {
      learnerId: string;
      conceptId: string;
      immediateRecallScore: number;
      retentionIntervalDays: number;
      retainedScore: number;
      nearTransferScore: number;
      mediumTransferScore: number;
      farTransferScore: number;
    },
  ) {
    const record = this.learningService.evaluateRetentionAndTransfer(
      body.learnerId,
      body.conceptId,
      body.immediateRecallScore,
      body.retentionIntervalDays,
      body.retainedScore,
      body.nearTransferScore,
      body.mediumTransferScore,
      body.farTransferScore,
    );
    return { success: true, data: record };
  }

  @Get('retrieval-schedule/:learnerId/:conceptId')
  getSpacedRetrievalSchedule(
    @Param('learnerId') learnerId: string,
    @Param('conceptId') conceptId: string,
  ) {
    return {
      success: true,
      scheduleDays: this.learningService.getSpacedRetrievalSchedule(learnerId, conceptId),
    };
  }

  @Post('explainable-rationale')
  generateExplainableRationale(
    @Body()
    body: {
      learnerId: string;
      conceptId: string;
      recommendedActivityId: string;
    },
  ) {
    return {
      success: true,
      data: this.learningService.generateExplainableRationale(
        body.learnerId,
        body.conceptId,
        body.recommendedActivityId,
      ),
    };
  }

  @Get('research-cohort')
  getAnonymizedResearchCohort() {
    return {
      success: true,
      data: this.learningService.extractAnonymizedResearchCohort(),
    };
  }

  // --- RESEARCH ENGINE ---

  @Get('research/studies')
  getStudies() {
    return { success: true, data: this.researchService.getStudies() };
  }

  @Post('research/studies')
  registerStudy(@Body() body: any) {
    return { success: true, data: this.researchService.registerStudy(body) };
  }

  @Get('research/gaps')
  getEvidenceGaps() {
    return { success: true, data: this.researchService.getEvidenceGaps() };
  }

  @Post('research/gaps')
  reportEvidenceGap(@Body() body: any) {
    return { success: true, data: this.researchService.reportEvidenceGap(body) };
  }

  @Get('models')
  getModels() {
    return { success: true, data: this.researchService.getModels() };
  }

  @Post('models/promote')
  promoteModel(
    @Body()
    body: {
      modelId: string;
      targetStage: ModelPromotionStage;
      reviewer: string;
      safetyReviewId?: string;
    },
  ) {
    return {
      success: true,
      data: this.researchService.promoteModel(
        body.modelId,
        body.targetStage,
        body.reviewer,
        body.safetyReviewId,
      ),
    };
  }

  @Post('models/retire')
  retireModel(
    @Body()
    body: {
      modelId: string;
      replacementModelId: string;
      reason: string;
    },
  ) {
    return {
      success: true,
      data: this.researchService.retireModel(
        body.modelId,
        body.replacementModelId,
        body.reason,
      ),
    };
  }

  @Get('policies')
  getPolicies() {
    return { success: true, data: this.researchService.getPolicies() };
  }

  // --- CONTENT INTELLIGENCE ---

  @Get('content/artifacts')
  getContentArtifacts() {
    return { success: true, data: this.contentService.getAllArtifacts() };
  }

  @Post('content/evaluate')
  evaluateContentEfficacy(
    @Body()
    body: {
      artifactId: string;
      metrics: {
        masteryGainDelta: number;
        retentionRate30d: number;
        transferRateFar: number;
        errorReductionRate: number;
        completionRate: number;
        teacherApprovalRate: number;
      };
    },
  ) {
    return {
      success: true,
      data: this.contentService.evaluateContentEfficacy(body.artifactId, body.metrics),
    };
  }

  @Post('content/lifecycle')
  transitionContentLifecycle(
    @Body()
    body: {
      artifactId: string;
      nextStage: ContentLifecycleStage;
      smeNotes?: string;
    },
  ) {
    return {
      success: true,
      data: this.contentService.transitionContentLifecycle(
        body.artifactId,
        body.nextStage,
        body.smeNotes,
      ),
    };
  }

  @Post('content/ai-drafts')
  submitAiDraft(@Body() body: any) {
    return { success: true, data: this.contentService.submitAiDraft(body) };
  }

  @Post('content/ai-drafts/approve')
  approveAiDraft(
    @Body()
    body: {
      draftId: string;
      smeReviewerId: string;
      pedagogicalNotes: string;
      approved: boolean;
    },
  ) {
    return {
      success: true,
      data: this.contentService.approveAiDraftBySme(
        body.draftId,
        body.smeReviewerId,
        body.pedagogicalNotes,
        body.approved,
      ),
    };
  }

  @Get('content/cross-modal/:conceptId')
  evaluateCrossModalEquivalence(@Param('conceptId') conceptId: string) {
    return {
      success: true,
      data: this.contentService.evaluateCrossModalEquivalence(conceptId),
    };
  }

  // --- AI TUTOR BENCHMARK & ANTI-DEPENDENCY ---

  @Get('tutor/benchmarks')
  getTutorBenchmarks() {
    return { success: true, data: this.tutorService.getBenchmarks() };
  }

  @Post('tutor/benchmarks')
  recordTutorBenchmark(@Body() body: any) {
    return { success: true, data: this.tutorService.recordBenchmark(body) };
  }

  @Get('tutor/anti-dependency/:learnerId')
  getAntiDependencyMetric(@Param('learnerId') learnerId: string) {
    return {
      success: true,
      data: this.tutorService.getAntiDependencyMetric(learnerId),
    };
  }

  @Post('tutor/interaction')
  recordTutorInteraction(
    @Body()
    body: {
      learnerId: string;
      isDirectHelpRequest: boolean;
      selfAttemptedFirst: boolean;
      transferWithoutAiScore?: number;
    },
  ) {
    return {
      success: true,
      data: this.tutorService.recordTutorInteraction(
        body.learnerId,
        body.isDirectHelpRequest,
        body.selfAttemptedFirst,
        body.transferWithoutAiScore,
      ),
    };
  }

  @Post('tutor/calibration')
  evaluateCalibration(
    @Body()
    body: {
      learnerId: string;
      conceptId: string;
      selfReportedConfidence: number;
      actualPerformanceScore: number;
    },
  ) {
    return {
      success: true,
      data: this.tutorService.evaluateCalibration(
        body.learnerId,
        body.conceptId,
        body.selfReportedConfidence,
        body.actualPerformanceScore,
      ),
    };
  }

  @Post('tutor/teacher-collaboration')
  recordTeacherCollaboration(
    @Body()
    body: {
      teacherId: string;
      classId: string;
      reviewedCount: number;
      acceptedCount: number;
      overriddenCount: number;
      overrideReason?: string;
    },
  ) {
    return {
      success: true,
      data: this.tutorService.recordTeacherCollaboration(
        body.teacherId,
        body.classId,
        body.reviewedCount,
        body.acceptedCount,
        body.overriddenCount,
        body.overrideReason,
      ),
    };
  }

  // --- GOVERNANCE, RED TEAMING & COMPLEXITY BUDGET ---

  @Get('governance/initiatives')
  getInitiatives() {
    return { success: true, data: this.governanceService.getInitiatives() };
  }

  @Post('governance/initiatives/evaluate')
  evaluateInitiative(@Body() body: any) {
    return { success: true, data: this.governanceService.evaluateInitiative(body) };
  }

  @Get('governance/complexity-budget')
  getComplexityBudget() {
    return { success: true, data: this.governanceService.getComplexityBudget() };
  }

  @Post('governance/complexity-budget/update')
  updateComplexityBudget(@Body() body: any) {
    return { success: true, data: this.governanceService.updateComplexityBudget(body) };
  }

  @Post('governance/feature/retire')
  retireFeature(@Body() body: { featureId: string }) {
    return { success: true, data: this.governanceService.executeFeatureRetirement(body.featureId) };
  }

  @Get('governance/red-team')
  getRedTeamResults() {
    return { success: true, data: this.governanceService.getRedTeamResults() };
  }

  @Post('governance/red-team/drill')
  runRedTeamDrill(
    @Body()
    body: {
      domain: RedTeamDomain;
      scenario: string;
      attemptedExploit: string;
      severity?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    },
  ) {
    return {
      success: true,
      data: this.governanceService.runRedTeamDrill(
        body.domain,
        body.scenario,
        body.attemptedExploit,
        body.severity,
      ),
    };
  }

  @Post('governance/stop-the-line')
  emergencyStopTheLine(
    @Body()
    body: {
      targetType: 'AGENT' | 'MODEL' | 'INTEGRATION' | 'PLATFORM_FEATURE';
      targetId: string;
      authorizedBy: string;
      reason: string;
    },
  ) {
    return {
      success: true,
      data: this.governanceService.emergencyStopTheLine(
        body.targetType,
        body.targetId,
        body.authorizedBy,
        body.reason,
      ),
    };
  }

  @Post('governance/resume')
  resumeComponent(
    @Body()
    body: {
      targetType: 'AGENT' | 'MODEL' | 'INTEGRATION' | 'PLATFORM_FEATURE';
      targetId: string;
      authorizedBy: string;
      remediationProof: string;
    },
  ) {
    return {
      success: true,
      data: this.governanceService.resumeComponent(
        body.targetType,
        body.targetId,
        body.authorizedBy,
        body.remediationProof,
      ),
    };
  }

  @Get('governance/participants')
  getParticipants() {
    return { success: true, data: this.governanceService.getParticipants() };
  }
}
