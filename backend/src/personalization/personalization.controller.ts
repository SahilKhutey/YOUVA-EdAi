import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  Headers,
  Request,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import {
  PersonalizationEngineService,
  RecommendationRequest,
  RecommendationResponse,
} from './personalization-engine.service';
import { KnowledgePersonalizationService } from './knowledge-personalization.service';
import { PersonalizationPolicyService } from './personalization-policy.service';
import { TeacherFeedbackLoopService, OverrideAnalyticsSummary } from './teacher-feedback-loop.service';
import { SpacedRepetitionService } from './spaced-repetition.service';
import {
  LearnerLearningState,
  TeacherFeedbackRecord,
  PolicyRegistryEntry,
  SpacedRepetitionItem,
} from './personalization-types';

@Controller(['v1/personalization', 'personalization'])
export class PersonalizationController {
  constructor(
    private readonly engine: PersonalizationEngineService,
    private readonly knowledgePersonalization: KnowledgePersonalizationService,
    private readonly policyService: PersonalizationPolicyService,
    private readonly teacherFeedback: TeacherFeedbackLoopService,
    private readonly spacedRepetition: SpacedRepetitionService,
  ) {}

  /**
   * Retrieves deterministic, explainable next personalized learning action for student.
   */
  @Get('next')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async getNextRecommendation(
    @Request() req: any,
    @Query('currentKnowledgeId') currentKnowledgeId?: string,
    @Headers('x-tenant-id') headerTenant?: string,
  ) {
    const learnerId = req.user.id;
    const tenantId = headerTenant || req.user?.tenantId || 'default-tenant';
    return this.knowledgePersonalization.getNextRecommendation(
      tenantId,
      learnerId,
      currentKnowledgeId,
    );
  }

  @Get('learner/:id/state')
  @HttpCode(HttpStatus.OK)
  getLearnerState(@Param('id') learnerId: string): LearnerLearningState {
    // Nominal state representation for learner
    return {
      learnerId,
      tenantId: 'tenant-modern-school',
      conceptMastery: {
        'fraction-fundamentals': 0.85,
        'rational-number-def': 0.80,
        'rational-addition-subtraction': 0.72,
        'rational-multiplication': 0.65,
        'reciprocals-and-division': 0.45,
      },
      evidenceConfidence: {
        'fraction-fundamentals': 0.88,
        'rational-number-def': 0.82,
        'rational-addition-subtraction': 0.75,
        'rational-multiplication': 0.68,
        'reciprocals-and-division': 0.52,
      },
      recentPerformance: 0.74,
      errorPatterns: ['negative-sign-inversion'],
      retentionRisk: {
        'fraction-fundamentals': 0.15,
        'rational-number-def': 0.25,
      },
      preferredActivityTypes: ['worked-example', 'socratic-practice'],
      pacingSignal: 1.0,
      interventionHistory: [],
      lastUpdated: new Date().toISOString(),
    };
  }

  @Post('recommend')
  @HttpCode(HttpStatus.OK)
  getRecommendation(@Body() body: RecommendationRequest): RecommendationResponse {
    return this.engine.recommendActivity(body);
  }

  @Post('teacher-feedback')
  @HttpCode(HttpStatus.CREATED)
  submitTeacherFeedback(@Body() record: TeacherFeedbackRecord) {
    return this.teacherFeedback.recordFeedback(record);
  }

  @Get('teacher-feedback/analytics')
  @HttpCode(HttpStatus.OK)
  getTeacherOverrideAnalytics(): OverrideAnalyticsSummary {
    return this.teacherFeedback.getOverrideAnalytics();
  }

  @Get('policies')
  @HttpCode(HttpStatus.OK)
  getPolicies(): PolicyRegistryEntry[] {
    return this.policyService.getAllPolicies();
  }

  @Post('policy/rollback')
  @HttpCode(HttpStatus.OK)
  rollbackPolicy(
    @Body('targetVersion') targetVersion: string,
    @Body('authorizedBy') authorizedBy?: string,
  ) {
    return this.policyService.rollbackPolicy(targetVersion, authorizedBy);
  }

  @Get('spaced-repetition/retrieval-queue')
  @HttpCode(HttpStatus.OK)
  getRetrievalQueue(): SpacedRepetitionItem[] {
    const mockItems: SpacedRepetitionItem[] = [
      {
        topicId: 'rational-addition-subtraction',
        intervalDays: 3,
        easeFactor: 2.5,
        repetitionNumber: 1,
        lastReviewedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
        nextReviewDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
        retentionRisk: 0.74,
      },
    ];
    return this.spacedRepetition.getDueRetrievalTopics(mockItems);
  }
}
