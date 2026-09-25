import { Injectable, Logger, NotFoundException, Optional } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { LearningPathService } from '../knowledge-graph/learning-path.service';

export interface KnowledgePersonalizationDecision {
  decisionId: string;
  learnerId: string;
  tenantId: string;
  decisionType: 'CONTINUE' | 'REVIEW' | 'REMEDIATE' | 'PRACTICE' | 'ADVANCE' | 'EXTEND';
  targetKnowledge: {
    id: string;
    title: string;
    type: string;
    slug?: string;
  };
  sourceKnowledgeId?: string;
  reason: {
    code: string;
    message: string;
  };
  confidence: number;
  policyVersion: string;
  createdAt: Date;
}

@Injectable()
export class KnowledgePersonalizationService {
  private readonly logger = new Logger(KnowledgePersonalizationService.name);
  private readonly POLICY_VERSION = '1.0.0';

  constructor(
    private readonly prisma: PrismaService,
    @Optional() private readonly learningPathService?: LearningPathService,
  ) {}

  /**
   * Evaluates learner state and knowledge graph relationships to produce
   * an explainable, deterministic next-action recommendation.
   */
  async getNextRecommendation(
    tenantId: string,
    learnerId: string,
    currentKnowledgeId?: string,
  ): Promise<KnowledgePersonalizationDecision> {
    const now = new Date();

    // Case 1: Active context with a specific knowledge object
    if (currentKnowledgeId) {
      const currentObject = await this.prisma.knowledgeObject.findFirst({
        where: {
          id: currentKnowledgeId,
          status: 'PUBLISHED',
          OR: [{ tenantId }, { tenantId: null }],
        },
        include: {
          incomingLinks: {
            where: { relation: 'PREREQUISITE' },
            include: { source: true },
          },
          outgoingLinks: {
            include: { target: true },
          },
        },
      });

      if (!currentObject) {
        throw new NotFoundException(`Knowledge object '${currentKnowledgeId}' not found or not published`);
      }

      // Fetch learner state on current knowledge
      const currentState = await this.prisma.learnerKnowledgeState.findUnique({
        where: {
          tenantId_learnerId_knowledgeObjectId: {
            tenantId,
            learnerId,
            knowledgeObjectId: currentKnowledgeId,
          },
        },
      });

      // --- Rule 1: Struggle / Prerequisite Weakness -> REMEDIATE ---
      // Check multi-hop graph readiness via LearningPathService if available
      if (this.learningPathService) {
        try {
          const path = await this.learningPathService.buildPath(learnerId, currentKnowledgeId, { tenantId });
          if (
            (path.readiness === 'NOT_READY' ||
              path.readiness === 'PARTIALLY_READY' ||
              currentState?.status === 'STRUGGLING') &&
            path.weakestPrerequisiteId
          ) {
            const weakest = await this.prisma.knowledgeObject.findUnique({
              where: { id: path.weakestPrerequisiteId },
            });
            if (weakest && weakest.status === 'PUBLISHED') {
              return this.recordAndReturnDecision({
                tenantId,
                learnerId,
                sourceKnowledgeId: currentKnowledgeId,
                targetKnowledge: {
                  id: weakest.id,
                  title: weakest.title,
                  type: weakest.type,
                  slug: weakest.slug,
                },
                decisionType: 'REMEDIATE',
                reasonCode: 'PREREQUISITE_WEAK',
                reasonMessage: `Review '${weakest.title}' to reinforce foundational concepts before continuing with '${currentObject.title}'.`,
                confidence: 0.88,
              });
            }
          }
        } catch {
          // Fall back to direct incoming links if path build encounters any issue
        }
      }

      // Fallback: direct incoming prerequisite links
      const prerequisites = currentObject.incomingLinks
        .map((l) => l.source)
        .filter((s) => s.status === 'PUBLISHED');

      if (prerequisites.length > 0) {
        // Fetch states for all prerequisites
        const prereqStates = await this.prisma.learnerKnowledgeState.findMany({
          where: {
            tenantId,
            learnerId,
            knowledgeObjectId: { in: prerequisites.map((p) => p.id) },
          },
        });

        const prereqStateMap = new Map(prereqStates.map((s) => [s.knowledgeObjectId, s]));

        // Find weakest prerequisite
        let weakestPrereq: any = null;
        let lowestMastery = 1.0;

        for (const p of prerequisites) {
          const s = prereqStateMap.get(p.id);
          const mastery = s?.masteryLevel ?? 0.0;
          if (mastery < 0.70 && mastery < lowestMastery) {
            lowestMastery = mastery;
            weakestPrereq = p;
          }
        }

        if (weakestPrereq && (currentState?.status === 'STRUGGLING' || lowestMastery < 0.70)) {
          return this.recordAndReturnDecision({
            tenantId,
            learnerId,
            sourceKnowledgeId: currentKnowledgeId,
            targetKnowledge: {
              id: weakestPrereq.id,
              title: weakestPrereq.title,
              type: weakestPrereq.type,
              slug: weakestPrereq.slug,
            },
            decisionType: 'REMEDIATE',
            reasonCode: 'PREREQUISITE_WEAK',
            reasonMessage: `Review '${weakestPrereq.title}' to reinforce foundational concepts before continuing with '${currentObject.title}'.`,
            confidence: 0.85,
          });
        }
      }

      if (currentState?.status === 'STRUGGLING') {
        return this.recordAndReturnDecision({
          tenantId,
          learnerId,
          sourceKnowledgeId: currentKnowledgeId,
          targetKnowledge: {
            id: currentObject.id,
            title: currentObject.title,
            type: currentObject.type,
            slug: currentObject.slug,
          },
          decisionType: 'REMEDIATE',
          reasonCode: 'STRUGGLE_DETECTED',
          reasonMessage: `You had some difficulty on recent practice. Let us review the foundational concepts and worked examples together.`,
          confidence: 0.80,
        });
      }

      // --- Rule 2: Review Signal Detected -> REVIEW ---
      if (currentState?.status === 'NEEDS_REVIEW') {
        return this.recordAndReturnDecision({
          tenantId,
          learnerId,
          sourceKnowledgeId: currentKnowledgeId,
          targetKnowledge: {
            id: currentObject.id,
            title: currentObject.title,
            type: currentObject.type,
            slug: currentObject.slug,
          },
          decisionType: 'REVIEW',
          reasonCode: 'REVIEW_DUE',
          reasonMessage: `It has been some time since you practiced '${currentObject.title}'. A quick spaced retrieval session will keep it fresh.`,
          confidence: 0.75,
        });
      }

      // --- Rule 3: High Mastery & Extension Available -> EXTEND ---
      if (currentState?.status === 'MASTERED') {
        const extensionLink = currentObject.outgoingLinks.find(
          (l) => l.relation === 'EXTENDS_TO' && l.target.status === 'PUBLISHED',
        );

        if (extensionLink) {
          return this.recordAndReturnDecision({
            tenantId,
            learnerId,
            sourceKnowledgeId: currentKnowledgeId,
            targetKnowledge: {
              id: extensionLink.target.id,
              title: extensionLink.target.title,
              type: extensionLink.target.type,
              slug: extensionLink.target.slug,
            },
            decisionType: 'EXTEND',
            reasonCode: 'EXTENSION_CHALLENGE',
            reasonMessage: `You have mastered '${currentObject.title}'! Challenge yourself with '${extensionLink.target.title}'.`,
            confidence: 0.90,
          });
        }

        // --- Rule 4: Mastered & Next Connected Topic -> ADVANCE ---
        const advanceLink = currentObject.outgoingLinks.find(
          (l) =>
            (l.relation === 'BUILDS_ON' || l.relation === 'RELATED_TO') &&
            l.target.status === 'PUBLISHED',
        );

        if (advanceLink) {
          return this.recordAndReturnDecision({
            tenantId,
            learnerId,
            sourceKnowledgeId: currentKnowledgeId,
            targetKnowledge: {
              id: advanceLink.target.id,
              title: advanceLink.target.title,
              type: advanceLink.target.type,
              slug: advanceLink.target.slug,
            },
            decisionType: 'ADVANCE',
            reasonCode: 'MASTERED_ADVANCE',
            reasonMessage: `Excellent work! With '${currentObject.title}' mastered, proceed to '${advanceLink.target.title}'.`,
            confidence: 0.85,
          });
        }
      }

      // --- Rule 5: Developing or Practice Needed -> PRACTICE ---
      if (
        currentState?.status === 'DEVELOPING' ||
        (currentState?.status !== 'MASTERED' && (currentState?.attempts || 0) < 3)
      ) {
        return this.recordAndReturnDecision({
          tenantId,
          learnerId,
          sourceKnowledgeId: currentKnowledgeId,
          targetKnowledge: {
            id: currentObject.id,
            title: currentObject.title,
            type: currentObject.type,
            slug: currentObject.slug,
          },
          decisionType: 'PRACTICE',
          reasonCode: 'PRACTICE_REQUIRED',
          reasonMessage: `You are making steady progress on '${currentObject.title}'. Complete a few more questions to reach mastery.`,
          confidence: 0.70,
        });
      }

      // Default: CONTINUE current concept
      return this.recordAndReturnDecision({
        tenantId,
        learnerId,
        sourceKnowledgeId: currentKnowledgeId,
        targetKnowledge: {
          id: currentObject.id,
          title: currentObject.title,
          type: currentObject.type,
          slug: currentObject.slug,
        },
        decisionType: 'CONTINUE',
        reasonCode: 'STANDARD_PROGRESSION',
        reasonMessage: `Continue your learning session on '${currentObject.title}'.`,
        confidence: 0.65,
      });
    }

    // Case 2: Global Learner Context (no currentKnowledgeId provided)
    // Find learner's state prioritizing STRUGGLING > NEEDS_REVIEW > DEVELOPING
    const learnerStates = await this.prisma.learnerKnowledgeState.findMany({
      where: { tenantId, learnerId },
      include: { knowledgeObject: true },
      orderBy: { updatedAt: 'desc' },
    });

    const strugglingState = learnerStates.find(
      (s) => s.status === 'STRUGGLING' && s.knowledgeObject.status === 'PUBLISHED',
    );
    if (strugglingState) {
      return this.recordAndReturnDecision({
        tenantId,
        learnerId,
        targetKnowledge: {
          id: strugglingState.knowledgeObject.id,
          title: strugglingState.knowledgeObject.title,
          type: strugglingState.knowledgeObject.type,
          slug: strugglingState.knowledgeObject.slug,
        },
        decisionType: 'REMEDIATE',
        reasonCode: 'STRUGGLE_DETECTED',
        reasonMessage: `Let us address recent challenges on '${strugglingState.knowledgeObject.title}'.`,
        confidence: 0.85,
      });
    }

    const reviewState = learnerStates.find(
      (s) => s.status === 'NEEDS_REVIEW' && s.knowledgeObject.status === 'PUBLISHED',
    );
    if (reviewState) {
      return this.recordAndReturnDecision({
        tenantId,
        learnerId,
        targetKnowledge: {
          id: reviewState.knowledgeObject.id,
          title: reviewState.knowledgeObject.title,
          type: reviewState.knowledgeObject.type,
          slug: reviewState.knowledgeObject.slug,
        },
        decisionType: 'REVIEW',
        reasonCode: 'REVIEW_DUE',
        reasonMessage: `Time for a refresher on '${reviewState.knowledgeObject.title}'.`,
        confidence: 0.80,
      });
    }

    const developingState = learnerStates.find(
      (s) => s.status === 'DEVELOPING' && s.knowledgeObject.status === 'PUBLISHED',
    );
    if (developingState) {
      return this.recordAndReturnDecision({
        tenantId,
        learnerId,
        targetKnowledge: {
          id: developingState.knowledgeObject.id,
          title: developingState.knowledgeObject.title,
          type: developingState.knowledgeObject.type,
          slug: developingState.knowledgeObject.slug,
        },
        decisionType: 'PRACTICE',
        reasonCode: 'PRACTICE_REQUIRED',
        reasonMessage: `Keep practicing '${developingState.knowledgeObject.title}' to reach full mastery!`,
        confidence: 0.75,
      });
    }

    // Fallback: Recommend first available published knowledge object
    const defaultObject = await this.prisma.knowledgeObject.findFirst({
      where: {
        status: 'PUBLISHED',
        OR: [{ tenantId }, { tenantId: null }],
      },
      orderBy: { createdAt: 'asc' },
    });

    if (!defaultObject) {
      throw new NotFoundException('No published knowledge objects found to recommend');
    }

    return this.recordAndReturnDecision({
      tenantId,
      learnerId,
      targetKnowledge: {
        id: defaultObject.id,
        title: defaultObject.title,
        type: defaultObject.type,
        slug: defaultObject.slug,
      },
      decisionType: 'CONTINUE',
      reasonCode: 'EXPLORE_FOUNDATION',
      reasonMessage: `Start your learning journey with '${defaultObject.title}'.`,
      confidence: 0.60,
    });
  }

  /**
   * Persists the decision in PersonalizationDecision for auditability and returns result.
   */
  private async recordAndReturnDecision(params: {
    tenantId: string;
    learnerId: string;
    sourceKnowledgeId?: string;
    targetKnowledge: { id: string; title: string; type: string; slug?: string };
    decisionType: 'CONTINUE' | 'REVIEW' | 'REMEDIATE' | 'PRACTICE' | 'ADVANCE' | 'EXTEND';
    reasonCode: string;
    reasonMessage: string;
    confidence: number;
  }): Promise<KnowledgePersonalizationDecision> {
    const record = await this.prisma.personalizationDecision.create({
      data: {
        tenantId: params.tenantId,
        userId: params.learnerId,
        sourceKnowledgeId: params.sourceKnowledgeId || null,
        targetKnowledgeId: params.targetKnowledge.id,
        decisionType: params.decisionType,
        reasonCode: params.reasonCode,
        recommendationRationale: params.reasonMessage,
        activityType: params.decisionType,
        difficulty: 0.5,
        modality: 'INTERACTIVE',
        pacing: 'STANDARD',
        policyVersion: this.POLICY_VERSION,
        confidence: params.confidence,
        status: 'PROPOSED',
      },
    });

    return {
      decisionId: record.id,
      learnerId: params.learnerId,
      tenantId: params.tenantId,
      decisionType: params.decisionType,
      targetKnowledge: params.targetKnowledge,
      sourceKnowledgeId: params.sourceKnowledgeId,
      reason: {
        code: params.reasonCode,
        message: params.reasonMessage,
      },
      confidence: params.confidence,
      policyVersion: this.POLICY_VERSION,
      createdAt: record.createdAt,
    };
  }
}
