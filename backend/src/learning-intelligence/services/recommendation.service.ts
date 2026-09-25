import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { RecommendationAction } from '../domain/intelligence.types';

@Injectable()
export class RecommendationService {
  private readonly logger = new Logger(RecommendationService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Generates actionable recommendations from confirmed insights and opportunities.
   */
  async generateRecommendationsForInsight(
    insightId: string,
    tenantId = 'default-tenant',
  ): Promise<any> {
    const insight = await this.prisma.learningInsight.findUnique({
      where: { id: insightId },
    });

    if (!insight) {
      throw new NotFoundException(`Insight '${insightId}' not found`);
    }

    // 1. Create or find Opportunity
    let opportunity = await this.prisma.improvementOpportunity.findFirst({
      where: {
        tenantId,
        targetId: insight.entityId || 'general',
        status: 'OPEN',
      },
    });

    if (!opportunity) {
      opportunity = await this.prisma.improvementOpportunity.create({
        data: {
          tenantId,
          insightIds: [insight.id],
          type: this.mapInsightToOpportunityType(insight.type),
          targetType: insight.scope === 'KNOWLEDGE' ? 'KNOWLEDGE_OBJECT' : 'CURRICULUM_PATH',
          targetId: insight.entityId || 'general',
          priority: insight.severity === 'HIGH' ? 80.0 : insight.severity === 'CRITICAL' ? 95.0 : 50.0,
          expectedImpact: 0.25,
          effortEstimate: 2.0, // hours
          status: 'OPEN',
        },
      });
    }

    // 2. Derive Recommendation Action Type
    const actionType = this.deriveActionType(insight.type);
    const reason = `Derived from confirmed insight: ${insight.title}. ${insight.summary}`;

    const recommendation = await this.prisma.improvementRecommendation.create({
      data: {
        tenantId,
        opportunityId: opportunity.id,
        actionType,
        targetId: insight.entityId || 'general',
        reason,
        evidenceIds: insight.evidenceIds,
        expectedEffect: 'Improve first-attempt practice accuracy and reduce prerequisite struggle.',
        confidence: insight.confidence,
        requiresHumanApproval: true, // Human-in-the-loop invariant
        status: 'PROPOSED',
      },
    });

    // Update insight status to RECOMMENDED
    await this.prisma.learningInsight.update({
      where: { id: insight.id },
      data: { status: 'RECOMMENDED' },
    });

    return recommendation;
  }

  /**
   * Teacher accepts a recommendation, routing to Knowledge Studio draft authoring.
   */
  async acceptRecommendation(id: string, tenantId = 'default-tenant') {
    const rec = await this.prisma.improvementRecommendation.findFirst({
      where: { id, tenantId },
    });

    if (!rec) {
      throw new NotFoundException(`Recommendation '${id}' not found`);
    }

    return this.prisma.improvementRecommendation.update({
      where: { id },
      data: {
        status: 'ACCEPTED',
      },
    });
  }

  /**
   * Teacher dismisses a recommendation with reason.
   */
  async dismissRecommendation(id: string, tenantId = 'default-tenant') {
    const rec = await this.prisma.improvementRecommendation.findFirst({
      where: { id, tenantId },
    });

    if (!rec) {
      throw new NotFoundException(`Recommendation '${id}' not found`);
    }

    return this.prisma.improvementRecommendation.update({
      where: { id },
      data: {
        status: 'DISMISSED',
      },
    });
  }

  /**
   * Links an accepted recommendation to an implemented version in Knowledge Studio.
   */
  async linkImplementedVersion(id: string, versionId: string, tenantId = 'default-tenant') {
    return this.prisma.improvementRecommendation.updateMany({
      where: { id, tenantId },
      data: {
        status: 'IMPLEMENTED',
        implementedVersionId: versionId,
      },
    });
  }

  private mapInsightToOpportunityType(insightType: string): string {
    switch (insightType) {
      case 'KNOWLEDGE_DIFFICULTY':
        return 'WORKED_EXAMPLE';
      case 'PREREQUISITE_GAP':
        return 'PREREQUISITE_ALIGNMENT';
      case 'MISCONCEPTION_PATTERN':
        return 'REMEDIATION_CREATION';
      case 'KNOWLEDGE_LOW_ENGAGEMENT':
        return 'KNOWLEDGE_REVISION';
      default:
        return 'KNOWLEDGE_REVISION';
    }
  }

  private deriveActionType(insightType: string): RecommendationAction {
    switch (insightType) {
      case 'KNOWLEDGE_DIFFICULTY':
        return 'ADD_EXAMPLE';
      case 'PREREQUISITE_GAP':
        return 'ADD_PREREQUISITE';
      case 'MISCONCEPTION_PATTERN':
        return 'CREATE_REMEDIATION';
      case 'KNOWLEDGE_LOW_ENGAGEMENT':
        return 'REVISE_EXPLANATION';
      default:
        return 'REVIEW_KNOWLEDGE';
    }
  }
}
