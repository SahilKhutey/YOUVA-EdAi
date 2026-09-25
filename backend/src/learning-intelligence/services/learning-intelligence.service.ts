import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { InsightEngineService } from './insight-engine.service';
import { KnowledgeQualityService } from './knowledge-quality.service';
import { CurriculumIntelligenceService } from './curriculum-intelligence.service';
import { RecommendationService } from './recommendation.service';
import { ExperimentService } from './experiment.service';
import { LearningGovernanceService } from './governance.service';

export interface TeacherIntelligenceOverview {
  needsAttention: {
    knowledgeCount: number;
    learnerPatternCount: number;
    curriculumOpportunityCount: number;
    assessmentSignalCount: number;
  };
  insights: any[];
  opportunities: any[];
  recommendations: any[];
  recentImprovements: Array<{
    title: string;
    actionType: string;
    status: string;
    implementedAt: Date;
  }>;
}

@Injectable()
export class LearningIntelligenceService {
  private readonly logger = new Logger(LearningIntelligenceService.name);

  constructor(
    private readonly prisma: PrismaService,
    public readonly insightEngine: InsightEngineService,
    public readonly knowledgeQuality: KnowledgeQualityService,
    public readonly curriculumIntelligence: CurriculumIntelligenceService,
    public readonly recommendationService: RecommendationService,
    public readonly experimentService: ExperimentService,
    public readonly governanceService: LearningGovernanceService,
  ) {}

  /**
   * Generates teacher continuous improvement dashboard overview.
   */
  async getTeacherOverview(tenantId = 'default-tenant'): Promise<TeacherIntelligenceOverview> {
    const insights = await this.prisma.learningInsight.findMany({
      where: {
        tenantId,
        status: { in: ['CONFIRMED', 'ACTIONABLE', 'RECOMMENDED'] },
      },
      orderBy: { detectedAt: 'desc' },
      take: 15,
    });

    const opportunities = await this.prisma.improvementOpportunity.findMany({
      where: { tenantId, status: 'OPEN' },
      orderBy: { priority: 'desc' },
      take: 10,
    });

    const recommendations = await this.prisma.improvementRecommendation.findMany({
      where: { tenantId, status: 'PROPOSED' },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    const knowledgeCount = insights.filter((i) => i.scope === 'KNOWLEDGE').length;
    const learnerPatternCount = insights.filter((i) => i.type === 'MISCONCEPTION_PATTERN' || i.type === 'LEARNER_STRUGGLE').length;
    const curriculumOpportunityCount = opportunities.length;
    const assessmentSignalCount = insights.filter((i) => i.type === 'ASSESSMENT_QUALITY').length;

    const implemented = await this.prisma.improvementRecommendation.findMany({
      where: { tenantId, status: 'IMPLEMENTED' },
      orderBy: { updatedAt: 'desc' },
      take: 5,
    });

    const recentImprovements = implemented.map((rec) => ({
      title: rec.reason.slice(0, 60),
      actionType: rec.actionType,
      status: 'Evaluation in progress',
      implementedAt: rec.updatedAt,
    }));

    return {
      needsAttention: {
        knowledgeCount,
        learnerPatternCount,
        curriculumOpportunityCount,
        assessmentSignalCount,
      },
      insights,
      opportunities,
      recommendations,
      recentImprovements,
    };
  }
}
