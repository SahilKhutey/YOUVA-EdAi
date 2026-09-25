import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

export interface AdaptiveAnalyticsMetrics {
  totalDecisions: number;
  decisionsByAction: Record<string, number>;
  remediationCount: number;
  advancementCount: number;
  reviewCount: number;
  teacherInterventionCount: number;
  teacherOverrideCount: number;
  teacherOverrideRate: number;
}

export interface DecisionAuditTrace {
  decisionId: string;
  learnerId: string;
  targetKnowledgeId: string;
  action: string;
  reasonCode: string;
  reasonMessage?: string;
  priority: number;
  confidence: number;
  policyVersion: string;
  status: string;
  createdAt: Date;
  executedAt?: Date;
  learnerState?: {
    masteryLevel: number;
    confidence: number;
    status: string;
  };
  supportingEvidence: Array<{
    id: string;
    accuracy: number;
    attemptNumber: number;
    hintCount: number;
    createdAt: Date;
  }>;
}

@Injectable()
export class AdaptiveAnalyticsService {
  private readonly logger = new Logger(AdaptiveAnalyticsService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Aggregates LKC-7 adaptive decision metrics and teacher override rates.
   */
  async getAdaptiveMetrics(
    tenantId: string = 'default-tenant',
  ): Promise<AdaptiveAnalyticsMetrics> {
    const decisions = await this.prisma.adaptiveDecision.findMany({
      where: { tenantId },
      select: { action: true, status: true },
    });

    const totalDecisions = decisions.length;
    const decisionsByAction: Record<string, number> = {};

    for (const d of decisions) {
      decisionsByAction[d.action] = (decisionsByAction[d.action] || 0) + 1;
    }

    const teacherOverrideCount = await this.prisma.teacherAdaptiveOverride.count({
      where: { tenantId },
    });

    const teacherOverrideRate =
      totalDecisions > 0 ? Number((teacherOverrideCount / totalDecisions).toFixed(3)) : 0;

    return {
      totalDecisions,
      decisionsByAction,
      remediationCount: decisionsByAction['REMEDIATE'] || 0,
      advancementCount: decisionsByAction['ADVANCE'] || 0,
      reviewCount: decisionsByAction['REVIEW'] || 0,
      teacherInterventionCount: decisionsByAction['TEACHER_INTERVENTION'] || 0,
      teacherOverrideCount,
      teacherOverrideRate,
    };
  }

  /**
   * Reconstructs the complete audit trace for an adaptive decision:
   * Evidence -> State -> Decision -> Action -> Outcome.
   */
  async getDecisionAuditTrace(
    decisionId: string,
    tenantId: string = 'default-tenant',
  ): Promise<DecisionAuditTrace> {
    const decision = await this.prisma.adaptiveDecision.findFirst({
      where: { id: decisionId, tenantId },
    });

    if (!decision) {
      throw new NotFoundException(`Adaptive decision '${decisionId}' not found`);
    }

    // Fetch learner state at target concept
    const state = await this.prisma.learnerKnowledgeState.findUnique({
      where: {
        tenantId_learnerId_knowledgeObjectId: {
          tenantId,
          learnerId: decision.learnerId,
          knowledgeObjectId: decision.targetKnowledgeId,
        },
      },
    });

    // Fetch supporting evidence around decision creation
    const evidence = await this.prisma.learningEvidenceLog.findMany({
      where: {
        userId: decision.learnerId,
        knowledgeObjectId: decision.targetKnowledgeId,
        tenantId,
      },
      orderBy: { createdAt: 'desc' },
      take: 5,
    });

    return {
      decisionId: decision.id,
      learnerId: decision.learnerId,
      targetKnowledgeId: decision.targetKnowledgeId,
      action: decision.action,
      reasonCode: decision.reasonCode,
      reasonMessage: decision.reasonMessage ?? undefined,
      priority: decision.priority,
      confidence: decision.confidence,
      policyVersion: decision.policyVersion,
      status: decision.status,
      createdAt: decision.createdAt,
      executedAt: decision.executedAt ?? undefined,
      learnerState: state
        ? {
            masteryLevel: state.masteryLevel,
            confidence: state.confidence,
            status: state.status,
          }
        : undefined,
      supportingEvidence: evidence.map((e) => ({
        id: e.id,
        accuracy: e.accuracy,
        attemptNumber: e.attemptNumber,
        hintCount: e.hintCount,
        createdAt: e.createdAt,
      })),
    };
  }
}
