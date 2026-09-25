import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import {
  AdaptiveActionType,
  AdaptiveCandidate,
  AdaptivePolicy,
  CandidateEligibility,
} from '../decision/decision.types';

@Injectable()
export class ConstraintEngine {
  private readonly logger = new Logger(ConstraintEngine.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Filters candidate list against tenant, published status, assignments,
   * prerequisites, and anti-loop constraints.
   */
  async filterCandidates(
    candidates: AdaptiveCandidate[],
    learnerId: string,
    policy: AdaptivePolicy,
    remediationDepth: number = 0,
    tenantId: string = 'default-tenant',
  ): Promise<AdaptiveCandidate[]> {
    const validCandidates: AdaptiveCandidate[] = [];

    // 1. Check if there are active required assignments
    const hasRequiredAssignment = candidates.some(
      (c) => c.required && c.source === 'ASSIGNMENT',
    );

    // 2. Check anti-loop threshold
    const isLoopExceeded = remediationDepth >= policy.maxRemediationDepth;

    for (const candidate of candidates) {
      const eligibility = await this.evaluateCandidate(
        candidate,
        learnerId,
        hasRequiredAssignment,
        isLoopExceeded,
        tenantId,
      );

      if (eligibility.eligible) {
        validCandidates.push({
          ...candidate,
          eligibility,
        });
      } else {
        this.logger.debug(
          `Candidate [${candidate.knowledgeId}, ${candidate.action}] filtered out: ${eligibility.failureReason}`,
        );
      }
    }

    // If loop was exceeded and there was a remediation candidate, ensure a TEACHER_INTERVENTION candidate is returned
    if (isLoopExceeded && candidates.some((c) => c.action === AdaptiveActionType.REMEDIATE)) {
      const remedCand = candidates.find((c) => c.action === AdaptiveActionType.REMEDIATE)!;
      return [
        {
          knowledgeId: remedCand.knowledgeId,
          action: AdaptiveActionType.TEACHER_INTERVENTION,
          source: remedCand.source,
          required: true,
          priority: 100,
          confidence: 1.0,
          reasonCodes: remedCand.reasonCodes,
          eligibility: { eligible: true },
          metadata: { remediationDepth, maxAllowed: policy.maxRemediationDepth },
        },
      ];
    }

    return validCandidates;
  }

  private async evaluateCandidate(
    candidate: AdaptiveCandidate,
    learnerId: string,
    hasRequiredAssignment: boolean,
    isLoopExceeded: boolean,
    tenantId: string,
  ): Promise<CandidateEligibility> {
    // 1. Check Tenant & Published Status
    const targetObj = await this.prisma.knowledgeObject.findFirst({
      where: {
        id: candidate.knowledgeId,
        status: 'PUBLISHED',
        OR: [{ tenantId }, { tenantId: null }],
      },
    });

    if (!targetObj) {
      return {
        eligible: false,
        failureReason: `Target knowledge object '${candidate.knowledgeId}' is not published or belongs to a different tenant.`,
      };
    }

    // 2. Assignment Priority Constraint
    // If a required assignment exists, non-assignment and non-override candidates of lower priority are suppressed
    if (
      hasRequiredAssignment &&
      candidate.source !== 'ASSIGNMENT' &&
      candidate.source !== 'TEACHER_PATH' &&
      candidate.action !== AdaptiveActionType.REMEDIATE
    ) {
      return {
        eligible: false,
        failureReason: `Required teacher assignment is active. Optional candidates are held until assignment is completed.`,
      };
    }

    // 3. Prerequisite Readiness Constraint on ADVANCE
    if (candidate.action === AdaptiveActionType.ADVANCE) {
      const unmetPrereqs = await this.checkPrerequisites(candidate.knowledgeId, learnerId, tenantId);
      if (unmetPrereqs.length > 0) {
        return {
          eligible: false,
          failureReason: `Cannot advance: unmet prerequisites [${unmetPrereqs.join(', ')}].`,
        };
      }
    }

    // 4. Anti-loop Protection: Block further remediation if max depth reached
    if (candidate.action === AdaptiveActionType.REMEDIATE && isLoopExceeded) {
      return {
        eligible: false,
        failureReason: `Anti-loop limit exceeded: remediation depth reached maximum threshold.`,
      };
    }

    return { eligible: true };
  }

  private async checkPrerequisites(
    knowledgeId: string,
    learnerId: string,
    tenantId: string,
  ): Promise<string[]> {
    const relationships = await this.prisma.knowledgeRelationship.findMany({
      where: {
        targetId: knowledgeId,
        relation: 'PREREQUISITE',
      },
      include: { source: true },
    });

    const unmet: string[] = [];

    for (const rel of relationships) {
      const state = await this.prisma.learnerKnowledgeState.findUnique({
        where: {
          tenantId_learnerId_knowledgeObjectId: {
            tenantId,
            learnerId,
            knowledgeObjectId: rel.sourceId,
          },
        },
      });

      // Prerequisite is unmet if mastery < 0.75 or status is STRUGGLING
      if (!state || state.masteryLevel < 0.75 || state.status === 'STRUGGLING') {
        unmet.push(rel.source.title);
      }
    }

    return unmet;
  }
}
