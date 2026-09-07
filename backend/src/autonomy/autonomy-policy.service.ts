import { Injectable } from '@nestjs/common';
import * as crypto from 'crypto';
import {
  AgentAction,
  AgeTier,
  LearningAgentDecision,
  LearningAgentRequest,
  RiskClassification,
} from './autonomy.types';

@Injectable()
export class AutonomyPolicyService {
  public static readonly POLICY_VERSION = '1.0.0';

  private static readonly PROHIBITED_ACTIONS = new Set<AgentAction>([
    AgentAction.MODIFY_MASTERY,
    AgentAction.MODIFY_CONSENT,
    AgentAction.MODIFY_ROLE,
    AgentAction.CLOSE_SAFETY_CASE,
    AgentAction.DELETE_LEARNER,
    AgentAction.CHANGE_BILLING,
  ]);

  /**
   * Deterministically evaluate policy risk and gate autonomous execution.
   */
  evaluatePolicy(request: LearningAgentRequest): LearningAgentDecision {
    const inputHash = this.calculateHash(request.payload ?? {});

    // Invariant 1: Prohibited institutional authority actions
    if (AutonomyPolicyService.PROHIBITED_ACTIONS.has(request.action)) {
      return {
        allowed: false,
        requiresApproval: false,
        riskLevel: RiskClassification.BLOCKED,
        reason: `AI autonomy is strictly prohibited from executing institutional or human authority actions: ${request.action}`,
        action: request.action,
        policyVersion: AutonomyPolicyService.POLICY_VERSION,
        inputHash,
      };
    }

    // Invariant 2: Content assignment requires teacher review
    if (request.action === AgentAction.ASSIGN_CONTENT) {
      return {
        allowed: true,
        requiresApproval: true,
        riskLevel: RiskClassification.HUMAN_APPROVAL,
        reason: 'Curricular content assignments require teacher review and confirmation',
        action: request.action,
        policyVersion: AutonomyPolicyService.POLICY_VERSION,
        inputHash,
      };
    }

    // Invariant 3: Activity rescheduling based on learner age tier
    if (request.action === AgentAction.RESCHEDULE_ACTIVITY) {
      if (request.ageTier === AgeTier.KIDS) {
        return {
          allowed: true,
          requiresApproval: true,
          riskLevel: RiskClassification.HUMAN_APPROVAL,
          reason: 'Schedule modifications for child learners require parent/teacher approval',
          action: request.action,
          policyVersion: AutonomyPolicyService.POLICY_VERSION,
          inputHash,
        };
      }
      return {
        allowed: true,
        requiresApproval: false,
        riskLevel: RiskClassification.AUTO_LOW_RISK,
        reason: 'Self-paced activity rescheduling is permitted for teen and adult learners',
        action: request.action,
        policyVersion: AutonomyPolicyService.POLICY_VERSION,
        inputHash,
      };
    }

    // Invariant 4: Low-risk pedagogical hints, explanations, and recommendations
    if (
      request.action === AgentAction.RECOMMEND_ACTIVITY ||
      request.action === AgentAction.GENERATE_HINT ||
      request.action === AgentAction.GENERATE_EXPLANATION
    ) {
      return {
        allowed: true,
        requiresApproval: false,
        riskLevel: RiskClassification.AUTO_LOW_RISK,
        reason: 'Low-risk pedagogical assistance is approved for autonomous execution',
        action: request.action,
        policyVersion: AutonomyPolicyService.POLICY_VERSION,
        inputHash,
      };
    }

    // Default Invariant: Unknown or unclassified actions are blocked
    return {
      allowed: false,
      requiresApproval: false,
      riskLevel: RiskClassification.BLOCKED,
      reason: `Unclassified or unsupported action is blocked by safety policy: ${request.action}`,
      action: request.action,
      policyVersion: AutonomyPolicyService.POLICY_VERSION,
      inputHash,
    };
  }

  /**
   * Generates a stable SHA-256 hash from JSON data.
   */
  calculateHash(data: any): string {
    const normalized = JSON.stringify(data ?? {}, Object.keys(data ?? {}).sort());
    return crypto.createHash('sha256').update(normalized).digest('hex');
  }
}
