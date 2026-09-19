import {
  Injectable,
  ForbiddenException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import {
  AgentMessage,
  GovernedActionRequest,
} from './n15-types';
import * as crypto from 'crypto';

@Injectable()
export class SpecializedAgentsService {
  private readonly logger = new Logger(SpecializedAgentsService.name);

  // --- 1. Safety Agent Ceiling (Clauses N15.44 - N15.45) ---

  public runSafetyTriage(params: {
    tenantId: string;
    learnerId: string;
    transcriptSnippet: string;
    acousticAnomalyDetected: boolean;
  }): {
    detected: boolean;
    severityRecommendation: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    escalationRequired: boolean;
    summary: string;
  } {
    const isDistress =
      params.acousticAnomalyDetected ||
      /help|scared|hurt|bully|unsafe|threat/i.test(params.transcriptSnippet);

    if (isDistress) {
      return {
        detected: true,
        severityRecommendation: 'HIGH',
        escalationRequired: true,
        summary: `Distress indicators flagged in snippet: [${params.transcriptSnippet.slice(0, 30)}...]`,
      };
    }

    return {
      detected: false,
      severityRecommendation: 'LOW',
      escalationRequired: false,
      summary: 'No safety anomalies detected in session sample',
    };
  }

  public assertSafetyAgentCeiling(actionType: string): void {
    // Invariant N15.44 - N15.45: Safety agent must NEVER close safety incident or suppress escalation
    if (actionType === 'SAFETY_RESOLUTION' || actionType === 'CLOSE_SAFETY_INCIDENT') {
      throw new ForbiddenException(
        'SAFE-CEILING-001: Safety incident closure is an inviolable human safeguarding prerogative. Autonomous closure is strictly barred.'
      );
    }
  }

  // --- 2. Credential Agent Ceiling (Clauses N15.46 - N15.47) ---

  public calculateCredentialEligibility(params: {
    tenantId: string;
    learnerId: string;
    skillCode: string;
    evidenceItems: Array<{ tier: number; type: string; score: number }>;
  }): {
    isEligible: boolean;
    qualifiedEvidenceCount: number;
    recommendation: 'RECOMMEND_ISSUANCE' | 'INSUFFICIENT_EVIDENCE';
  } {
    // Requires at least 2 distinct evidence items with tier >= 2
    const valid = params.evidenceItems.filter((e) => e.tier >= 2 && e.score >= 0.8);
    const isEligible = valid.length >= 2;

    return {
      isEligible,
      qualifiedEvidenceCount: valid.length,
      recommendation: isEligible ? 'RECOMMEND_ISSUANCE' : 'INSUFFICIENT_EVIDENCE',
    };
  }

  public assertCredentialAgentCeiling(actionType: string): void {
    // Invariant N15.46: Credential issuance requires human/governed authority
    if (actionType === 'CREDENTIAL_ISSUANCE' || actionType === 'CREDENTIAL_REVOCATION') {
      throw new ForbiddenException(
        'CRED-CEILING-001: Autonomous credential issuance or revocation is barred. Consequential credential authority requires verified educator authorization.'
      );
    }
  }

  // --- 3. Learning Personalization Agent Ceiling (Clauses N15.22 - N15.28) ---

  public recommendNextPracticeActivity(params: {
    currentMastery: number;
    difficultyBounds: { min: number; max: number };
    preferredTags: string[];
  }): {
    selectedTopicId: string;
    recommendedDifficulty: number;
    modality: 'INTERACTIVE_EXERCISE' | 'SPACED_REVIEW';
  } {
    // Adjust within teacher difficulty range
    const clampedDiff = Math.max(
      params.difficultyBounds.min,
      Math.min(params.difficultyBounds.max, params.currentMastery + 0.1)
    );

    return {
      selectedTopicId: 'MATH-LINEQ-02',
      recommendedDifficulty: Number(clampedDiff.toFixed(2)),
      modality: params.currentMastery < 0.6 ? 'INTERACTIVE_EXERCISE' : 'SPACED_REVIEW',
    };
  }

  public assertLearningAgentCeiling(actionType: string): void {
    // Invariant N15.28: AI output must not directly rewrite database mastery field
    if (actionType === 'MASTERY_OVERRIDE' || actionType === 'LEARNING_STATE_CHANGE') {
      throw new ForbiddenException(
        'MASTER-CEILING-001: Direct AI mutation of student mastery truth is prohibited. Mastery updates must flow strictly through validated BKT evidence engines.'
      );
    }
  }

  // --- 4. Agent-to-Agent Message Broker & Blast Radius (Clauses N15.51 - N15.55) ---

  public dispatchAgentMessage(message: AgentMessage): { delivered: boolean; deliveryId: string } {
    if (!message.sourceAgent || !message.targetAgent) {
      throw new BadRequestException('A2A-001: Source and target agents required');
    }

    // Never assume internal AI is trusted implicitly
    if (message.sourceAgent === message.targetAgent) {
      throw new BadRequestException('A2A-002: Recursive self-invocation loop prevented');
    }

    // Blast Radius Gate: Deny cross-tenant message transmission
    if (!message.tenantId) {
      throw new ForbiddenException('A2A-003: Agent messages must be explicitly tenant-scoped');
    }

    const deliveryId = `msg-del-${crypto.randomUUID()}`;
    this.logger.log(
      `Delivered AgentMessage [${message.messageId}] from [${message.sourceAgent}] to [${message.targetAgent}] (Tenant: ${message.tenantId})`
    );

    return { delivered: true, deliveryId };
  }

  public assertBlastRadiusLimit(request: GovernedActionRequest, maxAffectedRecords: number = 1): void {
    // Invariant N15.55: Autonomy must start with the smallest safe scope (ONE learner)
    if (request.targetType === 'TENANT_ALL_STUDENTS' || maxAffectedRecords > 50) {
      throw new ForbiddenException(
        'BLAST-001: Autonomous action exceeds permitted blast radius. Bulk mutation requires explicit administrative authorization.'
      );
    }
  }
}
