import { Injectable } from '@nestjs/common';
import { AutonomyLevel } from '../actions/action-policy.service';

export interface PolicyDecisionResult {
  decision: 'ALLOW' | 'REQUIRE_APPROVAL' | 'DENY';
  autonomyLevel: AutonomyLevel | string;
  reasons: string[];
}

@Injectable()
export class LearningPolicyService {
  /**
   * Deterministic policy decision engine.
   * Invariant: Authority is strictly determined by hard-coded deterministic policy rules, never LLM output.
   */
  decide(input: {
    actionType: string;
    ageTier: string;
    confidence: number;
    reversible: boolean;
    requiresHumanApproval: boolean;
  }): PolicyDecisionResult {
    if (input.requiresHumanApproval) {
      return {
        decision: 'REQUIRE_APPROVAL',
        autonomyLevel: AutonomyLevel.HUMAN_REQUIRED,
        reasons: ['Action requires human authority.'],
      };
    }

    if (input.ageTier === 'KIDS' && !input.reversible) {
      return {
        decision: 'REQUIRE_APPROVAL',
        autonomyLevel: AutonomyLevel.HUMAN_REQUIRED,
        reasons: ['Non-reversible action for youngest tier.'],
      };
    }

    if (input.confidence < 0.70) {
      return {
        decision: 'REQUIRE_APPROVAL',
        autonomyLevel: AutonomyLevel.ASSISTED,
        reasons: ['Insufficient decision confidence.'],
      };
    }

    return {
      decision: 'ALLOW',
      autonomyLevel: input.reversible
        ? AutonomyLevel.AUTO_REVERSIBLE
        : AutonomyLevel.AUTO_LOW_RISK,
      reasons: ['Policy permits low-risk action.'],
    };
  }
}
