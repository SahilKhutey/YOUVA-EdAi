import { Injectable, Logger, Optional } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CandidateDeduplicator } from './candidate.deduplicator';
import {
  AdaptiveActionType,
  AdaptiveCandidate,
  AdaptiveReasonCode,
  CandidateSource,
} from '../decision/decision.types';
import { KnowledgePersonalizationService } from '../../personalization/knowledge-personalization.service';
import { GraphTraversalService } from '../../knowledge-graph/graph-traversal.service';
import { LearningPathService } from '../../knowledge-graph/learning-path.service';

@Injectable()
export class CandidateService {
  private readonly logger = new Logger(CandidateService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly deduplicator: CandidateDeduplicator,
    @Optional() private readonly personalizationService?: KnowledgePersonalizationService,
    @Optional() private readonly graphTraversal?: GraphTraversalService,
    @Optional() private readonly learningPathService?: LearningPathService,
  ) {}

  /**
   * Generates a unified candidate set across all authoritative sources.
   */
  async generateCandidates(
    learnerId: string,
    currentKnowledgeId?: string,
    tenantId: string = 'default-tenant',
  ): Promise<AdaptiveCandidate[]> {
    const rawCandidates: AdaptiveCandidate[] = [];

    // 1. Source: Active Teacher Overrides (Highest Priority)
    const activeOverride = await this.prisma.teacherAdaptiveOverride.findFirst({
      where: {
        learnerId,
        tenantId,
        active: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    if (activeOverride) {
      const overrideCandidate = this.mapOverrideToCandidate(activeOverride, currentKnowledgeId);
      if (overrideCandidate) {
        rawCandidates.push(overrideCandidate);
      }
    }

    // 2. Source: Required Teacher Assignments
    const activeAssignments = await this.prisma.contentAssignment.findMany({
      where: {
        studentId: learnerId,
        status: { in: ['ASSIGNED', 'IN_PROGRESS'] },
      },
      include: { content: true },
      take: 3,
    });

    for (const assignment of activeAssignments) {
      if (assignment.contentId) {
        rawCandidates.push({
          knowledgeId: assignment.contentId,
          action: AdaptiveActionType.PRACTICE,
          source: CandidateSource.ASSIGNMENT,
          required: true,
          priority: 90,
          confidence: 0.95,
          reasonCodes: [AdaptiveReasonCode.ASSIGNMENT_REQUIRED],
          metadata: { assignmentId: assignment.id, dueDate: assignment.dueDate },
        });
      }
    }

    // 3. Source: Session Resume
    const activeSession = await this.prisma.adaptiveSession.findUnique({
      where: {
        tenantId_learnerId: { tenantId, learnerId },
      },
    });

    if (activeSession && activeSession.status === 'ACTIVE' && activeSession.currentKnowledgeId) {
      rawCandidates.push({
        knowledgeId: activeSession.currentKnowledgeId,
        action: (activeSession.currentAction as AdaptiveActionType) || AdaptiveActionType.CONTINUE,
        source: CandidateSource.SESSION_RESUME,
        required: false,
        priority: 70,
        confidence: 0.85,
        reasonCodes: [AdaptiveReasonCode.SESSION_RESUME],
        metadata: {
          sessionId: activeSession.id,
          interventionLevel: activeSession.interventionLevel,
        },
      });
    }

    // 4. Source: Knowledge Graph & Learning Path
    if (currentKnowledgeId) {
      const graphCandidates = await this.generateGraphCandidates(
        learnerId,
        currentKnowledgeId,
        tenantId,
      );
      rawCandidates.push(...graphCandidates);
    }

    // 5. Source: Existing Personalization Engine
    if (this.personalizationService) {
      try {
        const reco = await this.personalizationService.getNextRecommendation(
          tenantId,
          learnerId,
          currentKnowledgeId,
        );

        if (reco && reco.targetKnowledge?.id) {
          rawCandidates.push({
            knowledgeId: reco.targetKnowledge.id,
            action: reco.decisionType as AdaptiveActionType,
            source: CandidateSource.PERSONALIZATION,
            required: false,
            priority: 65,
            confidence: reco.confidence ?? 0.8,
            reasonCodes: [reco.reason.code as AdaptiveReasonCode],
            metadata: { personalizationDecisionId: reco.decisionId },
          });
        }
      } catch (err: any) {
        this.logger.debug(`PersonalizationService recommendation skipped: ${err.message}`);
      }
    }

    // 6. Source: Review Queue (Spaced Review Due)
    const reviewCandidates = await this.generateReviewCandidates(learnerId, tenantId);
    rawCandidates.push(...reviewCandidates);

    // Deduplicate and merge reason codes
    return this.deduplicator.deduplicate(rawCandidates);
  }

  private mapOverrideToCandidate(
    override: any,
    currentKnowledgeId?: string,
  ): AdaptiveCandidate | null {
    const targetId = override.targetKnowledgeId || currentKnowledgeId;
    if (!targetId) return null;

    let action = AdaptiveActionType.PRACTICE;
    if (override.action === 'FORCE_ADVANCE') {
      action = AdaptiveActionType.ADVANCE;
    } else if (override.action === 'ASSIGN_REMEDIATION') {
      action = AdaptiveActionType.REMEDIATE;
    } else if (override.action === 'REQUIRE_REVIEW') {
      action = AdaptiveActionType.REVIEW;
    }

    return {
      knowledgeId: targetId,
      action,
      source: CandidateSource.TEACHER_PATH,
      required: true,
      priority: 100,
      confidence: 1.0,
      reasonCodes: [AdaptiveReasonCode.TEACHER_DIRECTED],
      metadata: { overrideId: override.id, reason: override.reason },
    };
  }

  private async generateGraphCandidates(
    learnerId: string,
    knowledgeId: string,
    tenantId: string,
  ): Promise<AdaptiveCandidate[]> {
    const candidates: AdaptiveCandidate[] = [];

    // Fetch current state
    const state = await this.prisma.learnerKnowledgeState.findUnique({
      where: {
        tenantId_learnerId_knowledgeObjectId: {
          tenantId,
          learnerId,
          knowledgeObjectId: knowledgeId,
        },
      },
    });

    // Check prerequisites via LearningPathService if available
    if (this.learningPathService) {
      try {
        const path = await this.learningPathService.buildPath(learnerId, knowledgeId, {
          tenantId,
        });

        if (
          (path.readiness === 'NOT_READY' || path.readiness === 'PARTIALLY_READY') &&
          path.weakestPrerequisiteId
        ) {
          candidates.push({
            knowledgeId: path.weakestPrerequisiteId,
            action: AdaptiveActionType.REMEDIATE,
            source: CandidateSource.KNOWLEDGE_GRAPH,
            required: true,
            priority: 85,
            confidence: 0.9,
            reasonCodes: [AdaptiveReasonCode.PREREQUISITE_NOT_READY],
          });
        }
      } catch (err: any) {
        this.logger.debug(`LearningPath candidate resolution skipped: ${err.message}`);
      }
    }

    // If current knowledge is mastered, generate NEXT / ADVANCE candidates
    if (state && state.masteryLevel >= 0.8 && state.confidence >= 0.7) {
      if (this.graphTraversal) {
        const nextNodes = await this.graphTraversal.getDependents(knowledgeId, {
          tenantId,
          publishedOnly: true,
        });

        for (const next of nextNodes.slice(0, 2)) {
          candidates.push({
            knowledgeId: next.id,
            action: AdaptiveActionType.ADVANCE,
            source: CandidateSource.KNOWLEDGE_GRAPH,
            required: false,
            priority: 75,
            confidence: 0.85,
            reasonCodes: [AdaptiveReasonCode.READY_TO_ADVANCE],
          });
        }
      }
    }

    return candidates;
  }

  private async generateReviewCandidates(
    learnerId: string,
    tenantId: string,
  ): Promise<AdaptiveCandidate[]> {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const dueForReview = await this.prisma.learnerKnowledgeState.findMany({
      where: {
        tenantId,
        learnerId,
        masteryLevel: { gte: 0.7 },
        updatedAt: { lt: sevenDaysAgo },
      },
      take: 2,
    });

    return dueForReview.map((item) => ({
      knowledgeId: item.knowledgeObjectId,
      action: AdaptiveActionType.REVIEW,
      source: CandidateSource.REVIEW_QUEUE,
      required: false,
      priority: 60,
      confidence: 0.75,
      reasonCodes: [AdaptiveReasonCode.REVIEW_DUE],
    }));
  }
}
