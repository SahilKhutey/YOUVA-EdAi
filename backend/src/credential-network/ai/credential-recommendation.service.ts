import { Injectable, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

export interface CredentialRecommendation {
  learnerId: string;
  templateId: string;
  evidenceIds: string[];
  rationale: string;
  confidence: number;
  requiresHumanVerification: true;
}

@Injectable()
export class CredentialRecommendationService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * AI-driven discovery of candidate skill achievements based on learning signals and evidence.
   * Invariant: AI CANNOT independently issue, approve, or revoke credentials.
   * Any recommendation strictly enforces `requiresHumanVerification: true`.
   */
  async recommendAchievementCandidate(data: {
    learnerId: string;
    templateId: string;
    evidenceIds: string[];
    rationale: string;
    confidence: number;
  }): Promise<CredentialRecommendation> {
    return {
      learnerId: data.learnerId,
      templateId: data.templateId,
      evidenceIds: data.evidenceIds,
      rationale: data.rationale,
      confidence: Math.min(1.0, Math.max(0.0, data.confidence)),
      requiresHumanVerification: true,
    };
  }

  /**
   * Guard preventing AI agents from invoking protected actions.
   */
  assertAiActionAllowed(action: string) {
    const forbiddenAiActions = [
      'ISSUE_CREDENTIAL',
      'APPROVE_CREDENTIAL',
      'REVOKE_CREDENTIAL',
      'ALTER_VERIFICATION_LEVEL',
      'IMPERSONATE_TEACHER',
    ];

    if (forbiddenAiActions.includes(action)) {
      throw new ForbiddenException(
        `Action '${action}' is strictly prohibited for autonomous AI agents. Human authority required.`,
      );
    }
  }
}
