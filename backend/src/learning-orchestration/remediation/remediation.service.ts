import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import {
  AdaptiveActionType,
  AdaptiveReasonCode,
  RemediationContext,
} from '../decision/decision.types';

@Injectable()
export class RemediationService {
  private readonly logger = new Logger(RemediationService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Checks whether an ongoing remediation has met the return threshold,
   * restoring readiness so the learner can return to the original target.
   */
  async checkReturnToTarget(
    learnerId: string,
    remediationKnowledgeId: string,
    originalTargetId: string,
    tenantId: string = 'default-tenant',
  ): Promise<{
    canReturn: boolean;
    nextAction: AdaptiveActionType;
    reasonCode: AdaptiveReasonCode;
    reasonMessage: string;
  }> {
    const remediationState = await this.prisma.learnerKnowledgeState.findUnique({
      where: {
        tenantId_learnerId_knowledgeObjectId: {
          tenantId,
          learnerId,
          knowledgeObjectId: remediationKnowledgeId,
        },
      },
    });

    // If prerequisite has reached mastery >= 0.75 and confidence >= 0.70, return to target!
    if (
      remediationState &&
      remediationState.masteryLevel >= 0.75 &&
      remediationState.confidence >= 0.7
    ) {
      return {
        canReturn: true,
        nextAction: AdaptiveActionType.PRACTICE,
        reasonCode: AdaptiveReasonCode.READY_TO_ADVANCE,
        reasonMessage: `Prerequisite mastery restored. Returning to original target concept.`,
      };
    }

    return {
      canReturn: false,
      nextAction: AdaptiveActionType.PRACTICE,
      reasonCode: AdaptiveReasonCode.PREREQUISITE_NOT_READY,
      reasonMessage: `Continue practicing prerequisite concept to build foundational confidence.`,
    };
  }
}
